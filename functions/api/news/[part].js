/*
 * GET /api/news/:part on Cloudflare Pages: one part of this hour's news (0..5) or "extras".
 *
 * Each part is a few feeds, fetched, read and filtered here, then kept in Cloudflare's
 * cache for the hour. Each request stays small, well within the free plan's CPU limits.
 * When the hour turns, the last hour's copy is served at once and a fresh one is built
 * in the background, so readers never wait on the feeds.
 *
 * The filter settings come from news-settings.json, which the newsroom publishes with the site.
 * Stories the filter removed never leave this function.
 */
import { buildPart, buildExtras, publicPart, PARTS } from '../../../engine/edition.js';

const HOUR = 3600000;
let settingsMemo = null;      // { at, value, key } kept for a few minutes per worker

async function loadSettings(env, origin) {
  if (settingsMemo && Date.now() - settingsMemo.at < 300000) return settingsMemo;
  let value = {};
  try {
    const r = await env.ASSETS.fetch(new Request(origin + '/news-settings.json'));
    if (r.ok) value = await r.json();
  } catch {}
  const pick = (k) => (Array.isArray(value[k]) ? value[k].filter((x) => typeof x === 'string').slice(0, 1000) : []);
  value = { blockWords: pick('blockWords'), allowWords: pick('allowWords'), blockOutlets: pick('blockOutlets'), allow: pick('allow') };
  let h = 2166136261;
  const s = JSON.stringify(value);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  settingsMemo = { at: Date.now(), value, key: (h >>> 0).toString(36) };
  return settingsMemo;
}

function reply(body, ageSec, state) {
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${ageSec}`,
      'X-News': state,
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export async function onRequestGet({ params, request, env, waitUntil }) {
  const name = String(params.part);
  if (name !== 'extras' && !(/^\d$/.test(name) && Number(name) < PARTS)) return new Response('Not found', { status: 404 });
  const origin = new URL(request.url).origin;
  const settings = await loadSettings(env, origin);
  const now = Date.now(), hour = Math.floor(now / HOUR);
  const untilNextHour = Math.max(60, Math.ceil(((hour + 1) * HOUR - now) / 1000));
  const cache = caches.default;
  const keyFor = (h) => new Request(`${origin}/__news-cache/${name}?h=${h}&s=${settings.key}`);

  const fresh = await cache.match(keyFor(hour));
  if (fresh) return reply(fresh.body, untilNextHour, 'hit');

  const build = async () => {
    const data = name === 'extras' ? await buildExtras({ settings: settings.value, now }) : publicPart(await buildPart(Number(name), { settings: settings.value, now }));
    const body = JSON.stringify(data);
    await cache.put(keyFor(hour), new Response(body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=10800' } }));
    return body;
  };

  for (const h of [hour - 1, hour - 2]) {
    const stale = await cache.match(keyFor(h));
    if (stale) { waitUntil(build().catch(() => {})); return reply(stale.body, 120, 'stale'); }
  }
  try { return reply(await build(), untilNextHour, 'miss'); }
  catch { return new Response(JSON.stringify({ error: 'unavailable' }), { status: 503, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }); }
}
