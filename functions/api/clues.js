/*
 * GET /api/clues?w=apple,petal,…  Crossword clues for up to 16 words, from Wiktionary.
 * Each word's clue is kept in Cloudflare's cache for 30 days, so Wiktionary is asked
 * about a word once, not once per reader. The work here is tiny: a few lookups.
 */
import { fetchClue, validWord } from '../../engine/clues.js';

export async function onRequestGet({ request, waitUntil }) {
  const url = new URL(request.url);
  const words = [...new Set(String(url.searchParams.get('w') || '').toLowerCase().split(',').filter(validWord))].slice(0, 16);
  if (!words.length) return new Response(JSON.stringify({ error: 'no words' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  const cache = caches.default, clues = {};
  let complete = true;
  await Promise.all(words.map(async (w) => {
    const key = new Request(url.origin + '/__clue/' + w);
    const hit = await cache.match(key);
    if (hit) { clues[w] = (await hit.json()).clue; return; }
    const clue = await fetchClue(w);
    if (clue === undefined) { complete = false; clues[w] = null; return; }     // Wiktionary unreachable: don't remember that
    clues[w] = clue;
    waitUntil(cache.put(key, new Response(JSON.stringify({ clue }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=2592000' } })));
  }));
  return new Response(JSON.stringify({ clues, complete }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': complete ? 'public, max-age=86400' : 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}
