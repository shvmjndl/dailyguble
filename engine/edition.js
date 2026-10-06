/*
 * The news engine: fetch every feed, keep the last day's stories, filter them,
 * merge the same event across outlets, rank, and hand back a compact pool of
 * stories per section. Work is split into parts so each stays small and fast.
 *
 * Runs unchanged on Cloudflare (Pages Functions) and in Node (the newsroom).
 * No dependencies and no AI: every step is a plain rule.
 */
import { FEEDS, WINDOW_HOURS, MARKETS_URL, ON_THIS_DAY_URL, PART_SIZE, PARTS } from './sources.js';
export { PART_SIZE, PARTS } from './sources.js';
import { parseFeed } from './parse.js';
import { makeFilter, ruleSummary } from './filter.js';
import { regionOf } from './places.js';
import { combine } from './combine.js';
export { combine, EDITION_VERSION } from './combine.js';
const UA = 'DailyGuble/1.0 (newspaper; +https://dailyguble.pages.dev)';
const SUMMARY_MAX = 520;

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

/* Read at most maxBytes of a URL: feeds are newest-first, so the start is all we need. */
async function fetchText(url, maxBytes, timeoutMs, fetchImpl) {
  const res = await fetchImpl(url, {
    headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.9, */*;q=0.5' },
    signal: AbortSignal.timeout(timeoutMs), redirect: 'follow'
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  if (!res.body || !res.body.getReader) return (await res.text()).slice(0, maxBytes);
  const reader = res.body.getReader(), chunks = [];
  let size = 0;
  while (size < maxBytes) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); size += value.length; }
  reader.cancel().catch(() => {});
  const buf = new Uint8Array(size); let o = 0;
  for (const c of chunks) { buf.set(c, o); o += c.length; }
  return new TextDecoder('utf-8').decode(buf);
}

async function fetchJSON(url, timeoutMs, fetchImpl) {
  const res = await fetchImpl(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

/*
 * The work is split into parts of a few feeds each. On Cloudflare every part runs as its
 * own small request (each well inside the free plan's 10 ms of CPU) and is cached for the
 * hour; the edition then combines the parts. In the newsroom (Node) it all runs in one go.
 */
const feedsOfPart = (k) => FEEDS.slice(k * PART_SIZE, (k + 1) * PART_SIZE);

function trim(s, n) {
  if (s.length <= n) return s;
  const cut = s.slice(0, n), sp = cut.lastIndexOf(' ');
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.–—-]+$/, '') + '…';
}

/* One part: fetch its feeds, keep the fresh stories, filter them, tag their region. */
export async function buildPart(k, { settings = {}, now = Date.now(), fetchImpl = fetch, timeoutMs = 7000 } = {}) {
  if (!(k >= 0 && k < PARTS)) throw new Error('no such part');
  const raws = await Promise.all(feedsOfPart(k).map(async (feed) => {
    const t = Date.now();
    try { return { feed, text: await fetchText(feed.url, feed.maxBytes || 60000, timeoutMs, fetchImpl), ms: Date.now() - t }; }
    catch (e) { return { feed, text: '', error: String(e && e.message || e).slice(0, 80), ms: Date.now() - t }; }
  }));
  return Object.assign(processPart(raws, settings, now), { part: k });
}

export function processPart(raws, settings, now) {
  const check = makeFilter(settings);
  const stories = [], filtered = [], sources = [];
  for (const r of raws) {
    const win = (WINDOW_HOURS[r.feed.section] || WINDOW_HOURS.default) * 3600000;
    const items = r.text ? parseFeed(r.text, r.feed, 40, now - win) : [];
    sources.push({ id: r.feed.id, outlet: r.feed.outlet, section: r.feed.section, ok: !r.error, stories: items.length, ms: r.ms, error: r.error || undefined });
    for (const it of items) {
      if (it.time > now + 3600000) continue;                              // a clock in the future
      it.id = hash(it.link);
      const c = check(it);
      if (c.action === 'remove') {
        filtered.push({ id: it.id, title: it.title, outlet: it.outlet, link: it.link, section: it.section, time: it.time, category: c.category, label: c.label, match: c.match, summary: trim(it.summary, 300) });
        continue;
      }
      if (c.action === 'note') it.note = c.note;
      if (it.region === 'asia') { if (regionOf(it.title) === 'india') it.region = 'india'; }   // BBC files India under Asia
      else if (!it.region) it.region = regionOf(it.title + ' • ' + it.summary.slice(0, 240)) || r.feed.hint || null;
      it.summary = trim(it.summary, SUMMARY_MAX);
      if (!it.author) delete it.author;
      if (!it.kind) delete it.kind;
      if (!it.region) delete it.region;
      stories.push(it);
    }
  }
  return { part: null, builtAt: now, stories, sources, filtered, filteredCount: filtered.length };
}

/* What readers get: the filtered stories themselves never leave the server. */
export function publicPart(p) {
  const { filtered, ...rest } = p;
  return rest;
}

/* The extras: currency rates and three moments from this day in history. */
export async function buildExtras({ settings = {}, now = Date.now(), fetchImpl = fetch, timeoutMs = 7000 } = {}) {
  const d = new Date(now);
  const [rates, days] = await Promise.all([
    fetchJSON(MARKETS_URL, timeoutMs, fetchImpl).catch(() => null),
    fetchJSON(ON_THIS_DAY_URL(String(d.getUTCMonth() + 1).padStart(2, '0'), String(d.getUTCDate()).padStart(2, '0')), timeoutMs, fetchImpl).catch(() => null)
  ]);
  // rates against the US dollar, from the European Central Bank's reference rates
  const markets = rates && rates.rates ? { date: rates.date, base: 'USD', rates: rates.rates } : null;
  // three events far apart in time, run through the same filter as the news
  let onThisDay = [];
  if (days && Array.isArray(days.selected)) {
    const check = makeFilter(settings);
    const events = days.selected
      .filter((e) => e && e.text && isFinite(e.year) && check({ title: e.text, summary: '', outlet: 'Wikipedia', id: '' }).action === 'keep')
      .map((e) => ({ year: e.year, text: e.text, link: e.pages && e.pages[0] && e.pages[0].content_urls ? e.pages[0].content_urls.desktop.page : null }))
      .sort((a, b) => a.year - b.year);
    onThisDay = events.length <= 3 ? events : [events[0], events[Math.floor(events.length / 2)], events[events.length - 1]];
  }
  return { markets, onThisDay, builtAt: now };
}

/* Everything in one go (the newsroom, and tests). With includeFiltered, the newsroom view. */
export async function buildEdition(opts = {}) {
  const o = Object.assign({}, opts, { now: opts.now || Date.now() });
  const [parts, extras] = await Promise.all([
    Promise.all(Array.from({ length: PARTS }, (_, k) => buildPart(k, o))),
    buildExtras(o)
  ]);
  const out = combine(opts.includeFiltered ? parts : parts.map(publicPart), extras, o);
  if (opts.includeFiltered) { out.rules = ruleSummary(); out.filtered = out.filtered || []; }
  return out;
}
