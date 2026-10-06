/* =========================================================
   NEWS — the hourly edition, put together in the reader's own browser.
   The server hands out the news in a few small parts (fetched, filtered,
   cached for the hour); this file combines them with the engine's rules,
   then lays every news page out in columns and fits them to the page.
   ========================================================= */
var NEWS = { pool: null, byId: {}, used: {}, loading: false, error: null, pending: null, filtered: false };
var NEWS_API = '/api/news';
var NEWS_KINDS = [
  ['front', 'Front page'], ['world', 'World'], ['india', 'India'], ['business', 'Business'],
  ['science', 'Science, Tech & Health'], ['opinion', 'Opinion & Analysis'], ['sport', 'Sport & Culture']
];
var REGION_NAMES = { americas: 'The Americas', europe: 'Europe', mea: 'Middle East & Africa', asia: 'Asia-Pacific', india: 'India' };
var SECTION_NAMES = { world: 'World', india: 'India', business: 'Business', science: 'Science', tech: 'Technology', health: 'Health', climate: 'Climate', opinion: 'Opinion', sport: 'Sport', culture: 'Culture' };
function newsHour(t){ return Math.floor((t || Date.now()) / 3600000); }
function newsKindName(k){ for (var i = 0; i < NEWS_KINDS.length; i++) if (NEWS_KINDS[i][0] === k) return NEWS_KINDS[i][1]; return k; }

/* ---------------- getting the news ---------------- */
function setPool(pool){
  NEWS.pool = pool; NEWS.byId = {};
  if (!pool) return;
  function add(list){ (list || []).forEach(function(s){ if (!NEWS.byId[s.id]) NEWS.byId[s.id] = s; }); }
  add(pool.front);
  Object.keys(pool.sections || {}).forEach(function(k){ add(pool.sections[k]); });
}
function getJSONNews(url){
  return fetch(url, { credentials: 'same-origin' }).then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
}
/*
 * Load the news: the copy saved in this browser first (instant, works offline), then this
 * hour's parts if that copy is older. Cheap to call often: it does nothing until the hour
 * turns. onUpdate(pool) runs whenever there is news to show.
 * withFiltered: the newsroom also gets the stories the filter took out.
 */
function loadNews(onUpdate, withFiltered){
  var hour = newsHour();
  if (NEWS.hour === hour || NEWS.loading) return;
  if (!NEWS.pool && !withFiltered) {
    var saved = store('news');
    if (saved && saved.v === NEWS_ENGINE.EDITION_VERSION && saved.pool) {
      setPool(saved.pool); onUpdate(saved.pool);
      if (saved.hour === hour) { NEWS.hour = hour; return; }
    }
  }
  NEWS.loading = true;
  var q = '?h=' + hour + (withFiltered ? '&include=filtered' : ''), parts = [];
  for (var k = 0; k < NEWS_ENGINE.PARTS; k++) parts.push(getJSONNews(NEWS_API + '/' + k + q).catch(function(){ return null; }));
  Promise.all([Promise.all(parts), getJSONNews(NEWS_API + '/extras' + q).catch(function(){ return null; })]).then(function(r){
    NEWS.loading = false; NEWS.hour = hour;
    var got = r[0].filter(Boolean);
    if (got.length < NEWS_ENGINE.PARTS) setTimeout(function(){ if (NEWS.hour === hour) NEWS.hour = null; }, 5 * 60000);   // try the missing parts again soon
    if (!got.length) { NEWS.error = 'The news could not be reached just now. It will try again in a few minutes.'; if (!NEWS.pool) onUpdate(null); return; }
    var pool = NEWS_ENGINE.combine(r[0], r[1] || {}, { now: Date.now() });
    pool.complete = got.length === NEWS_ENGINE.PARTS;
    if (r[0][0] && r[0][0].rules) pool.rules = r[0][0].rules;
    NEWS.error = null;
    if (!withFiltered) store('news', { v: NEWS_ENGINE.EDITION_VERSION, hour: pool.complete ? hour : -1, pool: pool });
    setPool(pool); onUpdate(pool);
  });
}
/* Is the reader in the middle of something? Then fresh news waits rather than moving the page under them. */
function newsBusy(){ return RD.open || zoom > 1.02 || !!PZ.active || !!CURL; }

/* ---------------- choosing the stories for a page ---------------- */
function newsSettings(issue){ return (issue && issue.news) || {}; }
/* The stories a slot can draw from, best first, with the editor's choices applied. */
function newsQueue(name, page, issue){
  if (name.indexOf('|') >= 0) return [].concat.apply([], name.split('|').map(function(n){ return newsQueue(n, page, issue); }));
  var P = NEWS.pool;
  if (page.locked && page.locked.stories) return page.locked.stories.slice();
  if (!P) return [];
  var parts = name.split(':'), sec = parts[0], region = parts[1], list;
  if (sec === 'front') {
    list = P.front || [];
    var pref = preferredSections();
    if (Object.keys(pref).length) list = list.map(function(s, i){                       // the reader's clipped sections lead more often
      return { s: s, i: i, v: (s.score || 0) + ((s.sections || []).some(function(x){ return pref[x]; }) ? 4 : 0) };
    }).sort(function(a, b){ return b.v - a.v || a.i - b.i; }).map(function(x){ return x.s; });
  }
  else list = (P.sections || {})[sec] || [];
  if (sec === 'world' && region !== 'india') list = list.filter(function(s){ return s.region !== 'india'; });   // India has its own page
  if (region) list = list.filter(function(s){ return s.region === region; });
  var hide = newsSettings(issue).hide || [];
  if (hide.length) list = list.filter(function(s){ return hide.indexOf(s.id) < 0; });
  var pins = (page.pin || []).map(function(id){ return NEWS.byId[id]; }).filter(Boolean);
  var own = (page.own || []).filter(function(o){ return o && o.title; }).map(function(o, i){
    return { id: 'own-' + i + '-' + hash(o.title), own: true, title: o.title, summary: o.summary || '', link: o.link || '', outlet: o.outlet || '', kicker: o.kicker || '', time: o.time || null, outlets: 1 };
  });
  return own.concat(pins, list.filter(function(s){ return (page.pin || []).indexOf(s.id) < 0; }));
}
function takeStory(queue){
  for (var i = 0; i < queue.length; i++) {
    var s = queue[i];
    if (!NEWS.used[s.id]) { NEWS.used[s.id] = 1; queue.splice(i, 1); NEWS.byId[s.id] = NEWS.byId[s.id] || s; return s; }
  }
  return null;
}
function giveBack(id){ delete NEWS.used[id]; }

/*
 * Page templates. Each column lists slots; columns are filled in "pri" order so the
 * biggest story takes the first pick. Slot kinds:
 *   story  one story from a queue, at a size, with up to sum characters of summary
 *   fill   as many stories from a queue as the column holds (the fitter removes the extras)
 *   sect   a section label        briefs  headlines only       region  a label and up to n stories
 *   inside what's on the other pages     markets  currency rates      onthisday  three moments in history
 */
var NEWS_TEMPLATES = {
  front: { center: '', cols: [
    { w: 1, pri: 2, slots: [{ fill: 'front', size: 'small', sum: 260 }] },
    { w: 2.15, pri: 1, slots: [{ story: 'front', size: 'lead', sum: 560, cols: 2, also: true }, { story: 'front', size: 'big', sum: 360, cols: 2, also: true }, { fill: 'front', size: 'medium', sum: 260, cols: 2 }] },
    { w: 1, pri: 3, slots: [{ fill: 'front', size: 'small', sum: 240 }] },
    { w: 0.95, pri: 4, slots: [{ inside: true }, { sect: 'In brief' }, { briefs: 'front|world|business|science|sport', n: 12 }] }
  ] },
  world: { center: 'World', cols: [
    { w: 2, pri: 1, slots: [{ story: 'world', size: 'lead', sum: 520, cols: 2, also: true }, { story: 'world', size: 'big', sum: 320, cols: 2, also: true }, { fill: 'world', size: 'medium', sum: 240, cols: 2 }] },
    { w: 1, pri: 2, slots: [{ region: 'world:americas', n: 3 }, { region: 'world:europe', n: 3 }] },
    { w: 1, pri: 3, slots: [{ region: 'world:mea', n: 3 }, { region: 'world:asia', n: 3 }] }
  ] },
  india: { center: 'India', cols: [
    { w: 2, pri: 1, slots: [{ story: 'india', size: 'lead', sum: 520, cols: 2, also: true }, { fill: 'india', size: 'medium', sum: 260, cols: 2 }] },
    { w: 1, pri: 2, slots: [{ fill: 'india', size: 'small', sum: 220 }] },
    { w: 1, pri: 3, slots: [{ sect: 'Across the country' }, { briefs: 'india', n: 16 }] }
  ] },
  business: { center: 'Business', cols: [
    { w: 2, pri: 1, slots: [{ story: 'business', size: 'lead', sum: 520, cols: 2, also: true }, { fill: 'business', size: 'medium', sum: 260, cols: 2 }] },
    { w: 1, pri: 2, slots: [{ fill: 'business', size: 'small', sum: 240 }] },
    { w: 1, pri: 3, slots: [{ markets: true }, { sect: 'Business in brief' }, { briefs: 'business|tech', n: 12 }] }
  ] },
  science: { center: 'Science, Tech &amp; Health', cols: [
    { w: 1, pri: 1, slots: [{ sect: 'Science', strong: true }, { story: 'science', size: 'big', sum: 340 }, { fill: 'science', size: 'small', sum: 220 }] },
    { w: 1, pri: 2, slots: [{ sect: 'Technology', strong: true }, { story: 'tech', size: 'big', sum: 340 }, { fill: 'tech', size: 'small', sum: 220 }] },
    { w: 1, pri: 3, slots: [{ sect: 'Health', strong: true }, { story: 'health', size: 'big', sum: 340 }, { fill: 'health', size: 'small', sum: 220 }] }
  ], strip: [{ w: 1, slots: [{ sect: 'Climate &amp; environment' }, { briefs: 'climate', n: 4, row: true }] }] },
  opinion: { center: 'Opinion &amp; Analysis', cols: [
    { w: 1.4, pri: 1, slots: [{ story: 'opinion', size: 'big', sum: 520, label: true }, { fill: 'opinion', size: 'medium', sum: 320, label: true }] },
    { w: 1, pri: 2, slots: [{ fill: 'opinion', size: 'medium', sum: 300, label: true }] },
    { w: 1, pri: 3, slots: [{ fill: 'opinion', size: 'small', sum: 260, label: true }, { sect: 'More views' }, { briefs: 'opinion', n: 8 }] }
  ] },
  sport: { center: 'Sport &amp; Culture', cols: [
    { w: 1, pri: 1, slots: [{ sect: 'Sport', strong: true }, { story: 'sport', size: 'big', sum: 340 }, { fill: 'sport', size: 'small', sum: 220 }] },
    { w: 1, pri: 3, slots: [{ fill: 'sport|culture', size: 'small', sum: 200 }] },
    { w: 1, pri: 2, slots: [{ sect: 'Culture', strong: true }, { story: 'culture', size: 'big', sum: 340 }, { fill: 'culture', size: 'small', sum: 220 }] }
  ], strip: [{ w: 1, slots: [{ onthisday: true }] }] }
};

/* Build a news page's columns: blocks for every slot, plus extra fillers the fitter trims. */
function newsColumns(page, issue){
  var T = NEWS_TEMPLATES[page.news] || NEWS_TEMPLATES.world, queues = {};
  function Q(name){ return queues[name] || (queues[name] = newsQueue(name, page, issue)); }
  if (!NEWS.pool && !(page.locked && page.locked.stories)) {
    return { cols: [{ w: 1, blocks: [{ type: 'notice', text: NEWS.error || 'The news is on its way…' }] }], strip: null };
  }
  function build(c, rankBase){
    var blocks = [], rank = rankBase;
    c.slots.forEach(function(s){
      if (s.sect) { blocks.push({ type: 'sect', text: s.sect, strong: s.strong, fit: 0 }); return; }
      if (s.story) { var st = takeStory(Q(s.story)); if (st) blocks.push(storyBlock(st, s, rank++)); return; }
      if (s.fill) { for (var i = 0; i < 9; i++) { var f = takeStory(Q(s.fill)); if (!f) break; blocks.push(storyBlock(f, s, 1000 + rank++, true)); } return; }
      if (s.region) {
        var name = s.region.split(':')[1], got = [];
        for (var j = 0; j < s.n; j++) { var r = takeStory(Q(s.region)); if (r) got.push(r); }
        if (!got.length) return;
        blocks.push({ type: 'sect', text: REGION_NAMES[name] || name, fit: 0, region: name });
        got.forEach(function(x, n){ blocks.push(storyBlock(x, { size: n ? 'small' : 'medium', sum: n ? 200 : 260 }, 100 * (n + 1) + rank++)); });
        return;
      }
      if (s.briefs) {
        var items = [];
        for (var k = 0; k < s.n; k++) { var b = takeStory(Q(s.briefs)); if (b) items.push(b.id); }
        if (items.length) blocks.push({ type: 'briefs', ids: items, row: !!s.row, fit: 0, trims: true });
        return;
      }
      if (s.inside) { blocks.push({ type: 'inside', fit: 0 }); return; }
      if (s.markets) { if (NEWS.pool && NEWS.pool.markets) blocks.push({ type: 'markets', fit: 0 }); return; }
      if (s.onthisday) { if (NEWS.pool && NEWS.pool.onThisDay && NEWS.pool.onThisDay.length) blocks.push({ type: 'onthisday', fit: 0 }); return; }
    });
    return { w: c.w, blocks: blocks };
  }
  var cols = new Array(T.cols.length);
  T.cols.map(function(c, i){ return { c: c, i: i }; }).sort(function(a, b){ return a.c.pri - b.c.pri; })
    .forEach(function(x){ cols[x.i] = build(x.c, x.i * 10); });
  var strip = T.strip ? T.strip.map(function(c){ return build(c, 0); }) : null;
  return { cols: cols, strip: strip };
}
function storyBlock(s, slot, rank, filler){
  return { type: 'story', id: s.id, size: slot.size, sum: slot.sum, cols: slot.cols || 1, also: !!slot.also, label: !!slot.label, fit: rank, filler: !!filler };
}

/* ---------------- drawing the blocks ---------------- */
function trimWords(s, n){
  s = String(s || '');
  if (n == null || s.length <= n) return s;
  if (n <= 0) return '';
  var cut = s.slice(0, n), sp = cut.lastIndexOf(' ');
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.–—-]+$/, '') + '…';
}
function ago(t){
  if (!t) return '';
  var m = Math.round((Date.now() - t) / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return m + ' minutes ago';
  var h = Math.round(m / 60);
  return h === 1 ? 'an hour ago' : h < 36 ? h + ' hours ago' : Math.round(h / 24) + ' days ago';
}
function storyKicker(s, b){
  if (s.kicker) return s.kicker;
  if (b && b.label) return s.kind || 'Opinion';
  if (s.region && REGION_NAMES[s.region] && s.region !== 'india') return REGION_NAMES[s.region];
  return '';
}
function storyLink(s){
  if (!s.link || !/^https:\/\//.test(s.link)) return null;
  var a = txt('a', 'story-link', 'Read the full story at ' + (s.outlet || 'the source') + ' →');
  a.href = s.link; a.target = '_blank'; a.rel = 'noopener noreferrer';
  return a;
}
BLOCKS.story = function(b){
  var s = NEWS.byId[b.id] || {};
  var w = el('div', 'art story story-' + (b.size || 'medium') + (b.size === 'lead' ? ' lead-wrap' : ''));
  var k = storyKicker(s, b);
  if (k) w.appendChild(txt('p', 'kicker', k));
  var h = heading('', b.size === 'lead' ? 'lead' : b.size); h.textContent = (s.title || '').replace(/ ([\u2013\u2014-]) /g, '\u00a0$1 '); w.appendChild(h);   // a dash never starts a line
  if (s.note) w.appendChild(txt('p', 'story-note', s.note));
  var sum = trimWords(s.summary, b.sum);
  if (sum) {
    var body = el('div', 'body' + (b.cols > 1 && sum.length > 300 ? ' cols' + b.cols : '') + (b.size === 'small' ? ' body-small' : ''));
    body.appendChild(txt('p', null, sum));
    w.appendChild(body);
  }
  var credit = [s.author && s.kind ? s.author : '', s.outlet, ago(s.time)].filter(Boolean).join(' · ');
  if (s.outlets > 1 && !b.also) credit += ' · also in ' + (s.outlets - 1) + ' more';
  if (credit) w.appendChild(txt('div', 'byline story-credit', credit));
  if (b.also && s.others && s.others.length && !b.noAlso) {
    var ul = el('ul', 'story-also');
    s.others.forEach(function(o){ var li = el('li'); li.appendChild(txt('b', null, o.outlet)); li.appendChild(document.createTextNode(' ' + o.title)); ul.appendChild(li); });
    w.appendChild(ul);
  }
  var a = storyLink(s); if (a) w.appendChild(a);
  return w;
};
BLOCKS.briefs = function(b){
  var ul = el('ul', 'brief news-briefs' + (b.row ? ' brief-row' : ''));
  (b.ids || []).forEach(function(id){
    var s = NEWS.byId[id]; if (!s) return;
    var li = el('li'); li.appendChild(txt('b', null, s.title));
    li.appendChild(txt('span', 'brief-src', [s.outlet, ago(s.time)].filter(Boolean).join(' · ')));
    var a = storyLink(s); if (a) { a.textContent = 'Read at ' + (s.outlet || 'the source') + ' →'; li.appendChild(a); }
    ul.appendChild(li);
  });
  return ul;
};
BLOCKS.inside = function(){
  var d = el('div', 'box inside'), pages = NEWS.pages || (hooks.issue ? hooks.issue() : ISSUE).pages || [];
  d.appendChild(el('h6', 'sect', 'Inside today'));
  var ul = el('ul', 'inside-list');
  pages.forEach(function(p, i){
    if (i === 0) return;
    var name = p.news ? newsKindName(p.news) : plain((p.runhead || {}).center || '') || 'Page ' + (i + 1);
    var li = el('li'); li.dataset.goto = i;
    li.appendChild(txt('span', null, name)); li.appendChild(txt('b', null, String(i + 1)));
    ul.appendChild(li);
  });
  d.appendChild(ul);
  return d;
};
BLOCKS.markets = function(){
  var M = NEWS.pool && NEWS.pool.markets, d = el('div', 'box markets');
  d.appendChild(el('h6', 'sect', 'Currencies'));
  if (!M) { d.appendChild(txt('p', 'tide-note', 'Rates are on their way.')); return d; }
  var names = { EUR: 'Euro', GBP: 'Pound', INR: 'Rupee', JPY: 'Yen' }, rows = el('div', 'rowlist');
  Object.keys(M.rates).forEach(function(c){
    var v = M.rates[c], r = el('div', 'row');
    r.appendChild(txt('span', null, (names[c] || c) + ' (' + c + ')'));
    r.appendChild(txt('span', null, v >= 100 ? v.toFixed(1) : v.toFixed(3)));
    rows.appendChild(r);
  });
  d.appendChild(txt('p', 'tide-note', 'One US dollar buys:'));
  d.appendChild(rows);
  var day = M.date ? new Date(M.date + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric' }) : '';
  d.appendChild(txt('p', 'tide-note', 'European Central Bank reference rates' + (day ? ', ' + day : '') + '.'));
  return d;
};
BLOCKS.onthisday = function(){
  var list = (NEWS.pool && NEWS.pool.onThisDay) || [], d = el('div', 'onthisday');
  d.appendChild(el('h6', 'sect', 'On this day'));
  var row = el('div', 'otd-row');
  list.forEach(function(e){
    var p = el('p'); p.appendChild(txt('b', null, String(e.year))); p.appendChild(document.createTextNode(' ' + e.text));
    row.appendChild(p);
  });
  d.appendChild(row);
  d.appendChild(txt('p', 'tide-note', 'From Wikipedia’s “On this day”.'));
  return d;
};
BLOCKS.notice = function(b){ return txt('p', 'news-notice', b.text || ''); };

/* ---------------- fitting the columns to the page ---------------- */
/*
 * Every news column is drawn with more than it can hold. This trims it, measuring the
 * real layout (so it is right for the actual typefaces): first whole blocks that start
 * below the page, then the lowest-priority blocks one by one, shortening summaries
 * before dropping a story. Stories that don't make it go back for the next pages.
 */
function fitColumn(col){
  var H = col.clientHeight;
  if (!H) return;
  function bottom(n){ return n.offsetTop + n.offsetHeight; }
  function info(n){ return BIDMAP[n.dataset.bid]; }
  function drop(n){
    var i = info(n);
    if (i) { var k = i.list.indexOf(i.block); if (k >= 0) i.list.splice(k, 1); if (i.block.type === 'story') giveBack(i.block.id); if (i.block.type === 'briefs') i.block.ids.forEach(giveBack); }
    n.remove();
  }
  function redraw(n){
    var i = info(n), fresh = BLOCKS[i.block.type](i.block);
    fresh.classList.add('block'); fresh.dataset.bid = n.dataset.bid;
    n.replaceWith(fresh); return fresh;
  }
  var top = col.firstElementChild ? col.firstElementChild.offsetTop : 0;
  function over(){ var last = col.lastElementChild; return last && bottom(last) - top > H + 0.5; }
  // 1. anything starting below the page goes in one pass
  [].slice.call(col.children).forEach(function(n){ if (n.offsetTop - top >= H - 24) drop(n); });
  for (var guard = 0; guard < 40 && over(); guard++) {
    var kids = [].slice.call(col.children), last = kids[kids.length - 1], li = info(last);
    // 2. a list of headlines loses items from its end
    if (li && li.block.type === 'briefs' && li.block.ids.length > 1) { giveBack(li.block.ids.pop()); redraw(last); continue; }
    // 3. an unlabelled section heading never ends a column
    if (li && li.block.type === 'sect' && kids.length > 1) { drop(last); continue; }
    // 4. shorten the summary of the lowest-priority story, then drop it
    var worst = null;
    kids.forEach(function(n){ var x = info(n); if (x && x.block.type === 'story' && (!worst || x.block.fit >= info(worst).block.fit)) worst = n; });
    if (!worst) { drop(last); continue; }
    var wb = info(worst).block;
    if (wb.sum > 120 && wb.size !== 'lead') { wb.sum = Math.floor(wb.sum * 0.6); redraw(worst); continue; }
    if (wb.also && !wb.noAlso) { wb.noAlso = true; redraw(worst); continue; }
    if (wb.size === 'lead' && wb.sum > 160) { wb.sum = Math.floor(wb.sum * 0.75); redraw(worst); continue; }
    if (wb.sum > 0 && wb.filler) { wb.sum = 0; wb.size = 'small'; redraw(worst); continue; }
    var next = worst.nextElementSibling, prev = worst.previousElementSibling;
    drop(worst);
    // a region or section label left with nothing under it goes too
    if (prev && info(prev) && info(prev).block.type === 'sect' && (!next || (info(next) && info(next).block.type === 'sect'))) drop(prev);
  }
}
function fitNewsSheet(sheet){
  sheet.querySelectorAll('.paper .col, .paper .strip > .cell').forEach(fitColumn);
}

/* ---------------- the live "updated" time ---------------- */
function newsUpdatedText(){
  var P = NEWS.pool;
  if (!P || !P.updatedAt) return '—';
  return clock(new Date(P.updatedAt).toISOString());
}
