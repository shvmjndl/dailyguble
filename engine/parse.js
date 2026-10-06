/*
 * A small, fast feed reader for RSS 2.0, RSS 1.0 (RDF) and Atom.
 * It scans with indexOf rather than a full XML parser: feeds are machine-made
 * and regular, and this keeps the work tiny (no dependencies, no DOM).
 */

const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '\u2013', mdash: '\u2014',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201c', rdquo: '\u201d', hellip: '\u2026', bull: '\u2022',
  middot: '\u00b7', laquo: '\u00ab', raquo: '\u00bb', copy: '\u00a9', reg: '\u00ae', trade: '\u2122',
  euro: '\u20ac', pound: '\u00a3', yen: '\u00a5', cent: '\u00a2', deg: '\u00b0', times: '\u00d7',
  eacute: '\u00e9', egrave: '\u00e8', aacute: '\u00e1', agrave: '\u00e0', iacute: '\u00ed', oacute: '\u00f3',
  uacute: '\u00fa', ntilde: '\u00f1', ccedil: '\u00e7', uuml: '\u00fc', ouml: '\u00f6', auml: '\u00e4',
  szlig: '\u00df', acirc: '\u00e2', ecirc: '\u00ea', ocirc: '\u00f4', icirc: '\u00ee', ucirc: '\u00fb',
  Eacute: '\u00c9', shy: '', zwnj: '', zwj: '', thinsp: ' ', ensp: ' ', emsp: ' '
};
export function decodeEntities(s) {
  if (s.indexOf('&') < 0) return s;
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return code > 0 && code < 0x110000 ? String.fromCodePoint(code) : '';
    }
    return e in NAMED ? NAMED[e] : m;
  });
}

function unCdata(s) {
  const a = s.indexOf('<![CDATA[');
  if (a < 0) return s;
  let out = '', i = 0;
  while (i < s.length) {
    const st = s.indexOf('<![CDATA[', i);
    if (st < 0) { out += s.slice(i); break; }
    out += s.slice(i, st);
    const en = s.indexOf(']]>', st + 9);
    if (en < 0) { out += s.slice(st + 9); break; }
    out += s.slice(st + 9, en); i = en + 3;
  }
  return out;
}

/* Text from an HTML fragment: drop scripts, styles and tags, decode, tidy spaces. */
export function toText(html) {
  let s = unCdata(html);
  if (s.indexOf('&lt;') >= 0 && s.indexOf('<') < 0) s = decodeEntities(s);       // escaped HTML inside the feed
  s = s.replace(/<(script|style|figure|figcaption)[\s\S]*?<\/\1>/gi, ' ')
       .replace(/<br\s*\/?>|<\/p>|<\/li>/gi, ' ')
       .replace(/<[^>]*>/g, ' ').replace(/<[^>]*$/, '');
  return decodeEntities(s).replace(/\s+/g, ' ').trim();
}

/* Content of the first <tag ...>...</tag> (or self-closing) inside a block. */
function tag(block, name) {
  let i = 0;
  for (;;) {
    const st = block.indexOf('<' + name, i);
    if (st < 0) return null;
    const ch = block[st + name.length + 1];
    if (ch !== '>' && ch !== ' ' && ch !== '/' && ch !== '\n' && ch !== '\t' && ch !== '\r') { i = st + 1; continue; }
    const gt = block.indexOf('>', st);
    if (gt < 0) return null;
    if (block[gt - 1] === '/') return { attrs: block.slice(st + name.length + 1, gt - 1), body: '' };
    const end = block.indexOf('</' + name + '>', gt);
    if (end < 0) return null;
    return { attrs: block.slice(st + name.length + 1, gt), body: block.slice(gt + 1, end) };
  }
}
function attr(attrs, name) {
  const m = attrs && attrs.match(new RegExp('(?:^|\\s)' + name + '\\s*=\\s*(["\'])(.*?)\\1', 'i'));
  return m ? decodeEntities(m[2]) : null;
}
function atomLink(block) {
  let i = 0, fallback = null;
  for (;;) {
    const st = block.indexOf('<link', i);
    if (st < 0) return fallback;
    const gt = block.indexOf('>', st);
    const attrs = block.slice(st + 5, gt);
    const href = attr(attrs, 'href'), rel = attr(attrs, 'rel');
    if (href && (!rel || rel === 'alternate')) return href;
    if (href && !fallback) fallback = href;
    i = gt + 1;
  }
}

/* Remove the bits feeds tack onto summaries. */
function tidySummary(s, title) {
  s = s.replace(/\s*(Continue reading|Read more|Read the full story|The post .+ appeared first on .+)\s*\.{0,3}\s*$/i, '')
       .replace(/\s*\[(…|\.\.\.)\]\s*$/, '\u2026')
       .replace(/\s*Photograph:.*$/i, '');
  if (title && s.toLowerCase().startsWith(title.toLowerCase())) s = s.slice(title.length).replace(/^[\s:.\u2013\u2014-]+/, '');
  return s.length > 900 ? s.slice(0, 900) : s;
}

export function canonicalLink(link) {
  try {
    const u = new URL(link);
    for (const k of [...u.searchParams.keys()]) if (/^(utm_|at_|cmp|ito|ns_|ref|src|traffic_source|smid|partner)/i.test(k)) u.searchParams.delete(k);
    u.hash = '';
    return u.toString();
  } catch { return link; }
}

/* Headlines sometimes carry emoji or a "LIVE" tag: the paper drops them. */
function tidyTitle(t) {
  return t.replace(/[\ud83c-\ud83e][\udc00-\udfff]|[☀-➿⬀-⯿️‍]/g, '').replace(/^\s*(?:live(?: updates)?|watch|video|breaking)\s*[:|\u2013\u2014-]\s*/i, '').trim();
}

/*
 * Parse one feed's text into plain story objects.
 * since: skip stories published before this time (ms) without doing any work on them.
 */
export function parseFeed(xml, feed, limit = 40, since = 0) {
  const atom = xml.indexOf('<entry') >= 0 && xml.indexOf('<item') < 0;
  const open = atom ? '<entry' : '<item', close = atom ? '</entry>' : '</item>';
  const out = [];
  let i = 0;
  while (out.length < limit) {
    let st = xml.indexOf(open, i);
    if (st < 0) break;
    const ch = xml[st + open.length];
    if (ch !== '>' && ch !== ' ' && ch !== '\n' && ch !== '\t' && ch !== '\r') { i = st + 1; continue; }
    const en = xml.indexOf(close, st);
    if (en < 0) break;                                   // cut off by maxBytes: stop at the last complete story
    const block = xml.slice(st, en);
    i = en + close.length;

    const when = tag(block, 'pubDate') || tag(block, 'dc:date') || tag(block, 'published') || tag(block, 'updated');
    const time = when ? Date.parse(toText(when.body)) : NaN;
    if (since && !(time >= since)) continue;

    const t = tag(block, 'title');
    const title = t ? tidyTitle(toText(t.body)) : '';
    let link = atom ? atomLink(block) : null;
    if (!link) { const l = tag(block, 'link'); link = l ? toText(l.body) : null; }
    if (!link) { const g = tag(block, 'guid'); if (g && /^https?:/.test(toText(g.body))) link = toText(g.body); }
    if (!title || !link || !/^https?:\/\//.test(link)) continue;

    const d = tag(block, 'description') || tag(block, 'summary') || tag(block, 'content');
    let author = null;
    const dc = tag(block, 'dc:creator');
    if (dc) author = toText(dc.body);
    else { const a = tag(block, 'author'); if (a) { const n = tag(a.body, 'name'); author = toText(n ? n.body : a.body); } }
    if (author && (/@/.test(author) || author.length > 80)) author = null;

    out.push({
      title,
      summary: d ? tidySummary(toText(d.body.length > 5000 ? d.body.slice(0, 5000) : d.body), title) : '',
      link: canonicalLink(link),
      time: isFinite(time) ? time : null,
      author: author || null,
      outlet: feed.outlet, feed: feed.id, section: feed.section,
      region: feed.region || null, kind: feed.kind || null
    });
  }
  return out;
}
