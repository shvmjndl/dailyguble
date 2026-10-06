/*
 * Combining the parts into one edition: merge the same event across outlets, rank,
 * and keep the best stories per section. Pure computation with no network, a few
 * milliseconds: it runs in the reader's own browser (and in the newsroom).
 */
import { FEEDS } from './sources.js';
export { PARTS } from './sources.js';
import { tokens, clusterStories } from './cluster.js';

export const EDITION_VERSION = 2;
const KEEP = { world: 70, india: 50, business: 40, science: 20, tech: 20, health: 20, climate: 12, sport: 30, culture: 24, opinion: 30, front: 40 };

function storyOut(s, extra) {
  const o = { id: s.id, title: s.title, summary: s.summary, link: s.link, outlet: s.outlet, time: s.time };
  if (s.author) o.author = s.author;
  if (s.kind) o.kind = s.kind;
  return Object.assign(o, extra);
}

/* Combine the parts into the ranked edition. Pure computation, a few milliseconds. */
export function combine(parts, extras = {}, { now = Date.now() } = {}) {
  const order = new Map(FEEDS.map((f, i) => [f.id, i]));
  const rank = (s) => order.has(s.feed) ? order.get(s.feed) : 999;

  // one story per link, and per outlet headline (regional and world feeds overlap)
  const byLink = new Map(), byTitle = new Map(), sources = [], filtered = [];
  for (const p of parts) {
    if (!p) continue;
    sources.push(...p.sources); if (p.filtered) filtered.push(...p.filtered);
    for (const it of p.stories) {
      const key = it.outlet + '\n' + it.title.toLowerCase().replace(/[^a-zA-Z0-9À-ɏͰ-ϿЀ-ӿऀ-ॿ]+/g, ' ').trim();
      const prev = byLink.get(it.link) || byTitle.get(key);
      if (prev) {
        prev.sections.add(it.section);
        if (rank(it) < rank(prev)) prev.feed = it.feed;
        if (it.region && FEEDS[rank(it)] && FEEDS[rank(it)].region) prev.region = it.region;
        continue;
      }
      const s = Object.assign({}, it, { sections: new Set([it.section]) });
      byLink.set(it.link, s); byTitle.set(key, s);
    }
  }
  sources.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
  const kept = [...byLink.values()].sort((a, b) => rank(a) - rank(b) || b.time - a.time);

  // the same event across outlets (opinion pieces stand alone)
  const news = kept.filter((s) => s.section !== 'opinion');
  for (const s of news) s.tokens = tokens(s.title);
  const clusters = clusterStories(news).map((members) => {
    const outlets = new Set(members.map((m) => m.outlet));
    let newest = 0;
    const sections = new Set();
    for (const m of members) { if (m.time > newest) newest = m.time; for (const x of m.sections) sections.add(x); }
    const tagged = members.find((m) => m.region && FEEDS[rank(m)] && FEEDS[rank(m)].region);   // a regional feed knows best
    const votes = {};
    for (const m of members) if (m.region) votes[m.region] = (votes[m.region] || 0) + 1;
    const region = tagged ? tagged.region : Object.keys(votes).sort((a, b) => votes[b] - votes[a])[0] || null;
    const sens = members.find((m) => m.note);
    // more outlets on it = bigger news; it fades by one outlet's worth every six hours
    return { members, sections, region, newest, outlets: outlets.size, note: sens ? sens.note : null, score: outlets.size * 3 - (now - newest) / 7200000 };
  });
  clusters.sort((a, b) => b.score - a.score || b.newest - a.newest);

  function present(c, section) {
    const primary = (section && c.members.find((m) => m.sections.has(section))) || c.members[0];
    const others = [], seen = new Set([primary.outlet]);
    for (const m of c.members) if (!seen.has(m.outlet) && others.length < 3) { seen.add(m.outlet); others.push({ outlet: m.outlet, title: m.title, link: m.link }); }
    const extra = { outlets: c.outlets, score: Math.round(c.score * 10) / 10 };
    if (c.region) extra.region = c.region;
    if (c.note) extra.note = c.note;
    if (others.length) extra.others = others;
    return storyOut(primary, extra);
  }

  /*
   * An event belongs in a section when at least a third of its reports came from that
   * section's feeds (a business wire picking up a war story doesn't make it business news),
   * and the India page keeps to stories about India.
   */
  const inSection = (c, sec) => {
    if (!c.sections.has(sec)) return false;
    if (sec === 'india' && c.region && c.region !== 'india') return false;
    let n = 0;
    for (const m of c.members) if (m.sections.has(sec)) n++;
    return sec === 'world' ? n * 2 >= c.members.length : n * 3 >= c.members.length;   // world news: mostly from world desks
  };
  const sections = {};
  for (const sec of ['world', 'india', 'business', 'science', 'tech', 'health', 'climate', 'sport', 'culture']) {
    sections[sec] = clusters.filter((c) => inSection(c, sec)).slice(0, KEEP[sec]).map((c) => present(c, sec));
  }
  sections.opinion = kept.filter((s) => s.section === 'opinion').sort((a, b) => b.time - a.time).slice(0, KEEP.opinion)
    .map((s) => storyOut(s, Object.assign({ outlets: 1 }, s.note ? { note: s.note } : {}, s.region ? { region: s.region } : {})));
  const front = clusters.filter((c) => [...c.sections].some((x) => x !== 'climate')).slice(0, KEEP.front).map((c) => present(c, null));

  const updatedAt = Math.max(0, ...parts.map((p) => (p && p.builtAt) || 0)) || now;
  const out = { version: EDITION_VERSION, updatedAt, front, sections, markets: extras.markets || null, onThisDay: extras.onThisDay || [], sources,
    counts: { stories: kept.length, events: clusters.length, filtered: parts.reduce((n, p) => n + ((p && p.filteredCount) || 0), 0) } };
  if (filtered.length) out.filtered = filtered.sort((a, b) => b.time - a.time);
  return out;
}

