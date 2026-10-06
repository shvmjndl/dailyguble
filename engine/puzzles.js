/*
 * The daily puzzles' rules: today's word for the word game, and a 5x5 mini crossword.
 * Pure functions, no network: they run in readers' browsers (folded into the paper's
 * script), and in Node for the checks in engine/test.js.
 *
 * Everyone gets the same puzzles on the same date: the only inputs are the date, the
 * word list and the text of Wikipedia's front page for that date, and every "random"
 * choice comes from a generator seeded with the date.
 */

/* words.txt: "3:<all 3-letter words run together>", "c3:<the common ones>", and so on for 4 and 5. */
export function parseWordList(text) {
  const W = { all: new Set(), common: new Set(), byLen: {}, commonByLen: {} };
  for (const line of String(text).split('\n')) {
    const m = line.match(/^(c?)(\d):([a-z]*)$/);
    if (!m) continue;
    const n = +m[2], s = m[3], list = [];
    for (let i = 0; i + n <= s.length; i += n) list.push(s.substr(i, n));
    if (m[1]) { W.commonByLen[n] = list; list.forEach((w) => W.common.add(w)); }
    else { W.byLen[n] = list; list.forEach((w) => W.all.add(w)); }
  }
  for (const w of W.common) W.all.add(w);
  return W;
}

export function seedFrom(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function rng(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffled(list, rnd) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

/* Little words that make dull answers and odd clues. */
const DULL = new Set(('the and but for are was not you his her its our has had who how why all any can may she him own ' +
  'that this with from have were they them what when than then there their which would could should been into onto upon over ' +
  'very just also only more most much many each both some such will shall your yours mine ours here where while being since ' +
  'under until among about after other these those first every never often still again shall whom whose done does doing').split(' '));

/* Plurals and verb endings: "keys" and "baked" make weaker answers than "key" and "bake". */
export function isInflected(w, W) {
  const has = (x) => x.length >= 3 && W.all.has(x);
  if (w.endsWith('s') && !w.endsWith('ss') && (has(w.slice(0, -1)) || (w.endsWith('es') && has(w.slice(0, -2))))) return true;
  if (w.endsWith('ed') && (has(w.slice(0, -2)) || has(w.slice(0, -1)) || (w.endsWith('ied') && has(w.slice(0, -3) + 'y')))) return true;
  if (w.endsWith('ing') && (has(w.slice(0, -3)) || has(w.slice(0, -3) + 'e'))) return true;
  return false;
}

/*
 * The day's text: plain words written in lower case (so not names) that are in the word list,
 * each scored by where it appeared. texts: [{ src: 'tfa' | 'news' | 'read' | 'otd' | 'dyk', text, title? }]
 */
export function dayWords(texts, W, isSafe) {
  const score = {}, from = {};
  const weight = { tfa: 3, news: 2, dyk: 2, read: 1, otd: 1 };
  for (const t of texts) {
    for (const w of String(t.text || '').split(/[^A-Za-z]+/)) {
      if (w.length < 3 || w.length > 5 || w !== w.toLowerCase() || !W.all.has(w) || DULL.has(w)) continue;
      if (isSafe && !isSafe(w)) continue;
      score[w] = (score[w] || 0) + (weight[t.src] || 1);
      if (!from[w] || (weight[t.src] || 1) > (weight[from[w].src] || 1)) from[w] = t;
    }
  }
  return { score, from };
}

/* Today's word for the word game: a five-letter word from today's Wikipedia when there is a good one. */
export function wordleAnswer(day, texts, W, isSafe) {
  const rnd = rng(seedFrom('wordle:' + day));
  const { score, from } = dayWords(texts, W, isSafe);
  const good = (w) => w.length === 5 && W.common.has(w) && !isInflected(w, W) && !DULL.has(w) && (!isSafe || isSafe(w));
  const fromDay = Object.keys(score).filter(good).sort((a, b) => score[b] - score[a] || (a < b ? -1 : 1));
  if (fromDay.length) {
    const top = fromDay.slice(0, Math.min(12, fromDay.length)), w = top[Math.floor(rnd() * top.length)];
    return { word: w, source: from[w] ? { src: from[w].src, title: from[w].title || null, link: from[w].link || null } : null };
  }
  const pool = (W.commonByLen[5] || W.byLen[5] || []).filter(good);
  return { word: pool[Math.floor(rnd() * pool.length)] || 'paper', source: null };
}

/* Grid shapes for the mini, NYT-mini style. '#' is a black square. */
export const MINI_SHAPES = [
  ['#....', '.....', '.....', '.....', '....#'],
  ['....#', '.....', '.....', '.....', '#....'],
  ['#...#', '.....', '.....', '.....', '#...#'],
  ['##...', '#....', '.....', '....#', '...##'],
  ['...##', '....#', '.....', '#....', '##...']
];

/* The across and down slots of a shape. */
export function slotsOf(shape) {
  const R = shape.length, C = shape[0].length, black = (r, c) => shape[r][c] === '#', slots = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (black(r, c)) continue;
    if ((c === 0 || black(r, c - 1)) && c + 1 < C && !black(r, c + 1)) { const cells = []; for (let k = c; k < C && !black(r, k); k++) cells.push(r * C + k); slots.push({ dir: 'a', cells }); }
    if ((r === 0 || black(r - 1, c)) && r + 1 < R && !black(r + 1, c)) { const cells = []; for (let k = r; k < R && !black(k, c); k++) cells.push(k * C + c); slots.push({ dir: 'd', cells }); }
  }
  return slots;
}

/*
 * Fill a shape with words from lists[length] (best first). Bit sets index every word by
 * letter and position, and the slot with the fewest choices is filled next, so a 5x5
 * takes a few milliseconds. The budget counts steps, not time, so every device finds
 * the very same grid. Returns { rows, words: [{ dir, cells, word }] } or null.
 */
export function fillShape(shape, lists, budget = 40000, banned = new Set()) {
  const R = shape.length, C = shape[0].length, slots = slotsOf(shape);
  if (slots.some((s) => s.cells.length < 3 || !lists[s.cells.length])) return null;
  const idx = {};
  for (const n of new Set(slots.map((s) => s.cells.length))) {
    const L = lists[n], size = (L.length + 31) >>> 5, by = [], all = new Uint32Array(size);
    for (let p = 0; p < n; p++) by.push({});
    L.forEach((w, i) => {
      if (banned.has(w)) return;
      all[i >>> 5] |= 1 << (i & 31);
      for (let p = 0; p < n; p++) (by[p][w[p]] || (by[p][w[p]] = new Uint32Array(size)))[i >>> 5] |= 1 << (i & 31);
    });
    idx[n] = { by, all, size };
  }
  const grid = new Array(R * C).fill(''), used = new Set(), chosen = new Array(slots.length).fill(null);
  let steps = 0;
  function options(s) {
    const n = s.cells.length, X = idx[n], acc = X.all.slice();
    for (let p = 0; p < n; p++) {
      const ch = grid[s.cells[p]];
      if (!ch) continue;
      const b = X.by[p][ch];
      if (!b) return [];
      for (let i = 0; i < X.size; i++) acc[i] &= b[i];
    }
    const out = [];
    for (let i = 0; i < X.size; i++) {
      let w = acc[i];
      while (w) { const t = w & -w, j = (i << 5) + (31 - Math.clz32(t)); if (!used.has(lists[n][j])) out.push(lists[n][j]); w ^= t; }
    }
    return out;
  }
  function solve() {
    if (++steps > budget) return false;
    let best = -1, opts = null;
    for (let i = 0; i < slots.length; i++) {
      if (chosen[i]) continue;
      const o = options(slots[i]);
      if (!o.length) return false;
      if (!opts || o.length < opts.length) { best = i; opts = o; }
    }
    if (best < 0) return true;
    const s = slots[best], before = s.cells.map((k) => grid[k]);
    for (const w of opts.slice(0, 40)) {
      s.cells.forEach((k, p) => { grid[k] = w[p]; });
      chosen[best] = w; used.add(w);
      if (solve()) return true;
      used.delete(w); chosen[best] = null;
      s.cells.forEach((k, p) => { grid[k] = before[p]; });
      if (steps > budget) return false;
    }
    return false;
  }
  if (!solve()) return null;
  return {
    rows: shape.map((row, r) => row.split('').map((ch, c) => (ch === '#' ? '#' : grid[r * C + c])).join('')),
    words: slots.map((s, i) => ({ dir: s.dir, cells: s.cells, word: chosen[i] }))
  };
}

/*
 * Today's mini: today's Wikipedia words first, then everyday words in a daily order.
 * banned: words to leave out (e.g. ones no clue could be found for).
 */
export function makeMini(day, texts, W, isSafe, banned = new Set()) {
  const rnd = rng(seedFrom('mini:' + day));
  const { score } = dayWords(texts, W, isSafe);
  const ok = (w) => !DULL.has(w) && !isInflected(w, W) && (!isSafe || isSafe(w)) && !banned.has(w);
  const lists = {};
  for (const n of [3, 4, 5]) {
    const today = Object.keys(score).filter((w) => w.length === n && W.common.has(w) && ok(w)).sort((a, b) => score[b] - score[a] || (a < b ? -1 : 1));
    const seen = new Set(today);
    lists[n] = today.concat(shuffled((W.commonByLen[n] || []).filter((w) => !seen.has(w) && ok(w)), rnd));
  }
  for (const shape of shuffled(MINI_SHAPES, rnd)) {
    const f = fillShape(shape, lists, 40000, banned);
    if (f) return Object.assign(f, { today: f.words.filter((x) => score[x.word]).map((x) => x.word) });
  }
  return null;
}

/* A clue from the day's own text, for words that have no dictionary clue: "... the ___ of ..." */
export function blankClue(word, texts) {
  const re = new RegExp('(^|[^A-Za-z])' + word + '([^A-Za-z]|$)');
  for (const t of texts) {
    for (const s of String(t.text || '').split(/(?<=[.!?])\s+/)) {
      if (s.length > 150 || !re.test(s)) continue;
      return '“' + s.replace(re, '$1___$2').replace(/[.]$/, '') + '”';
    }
  }
  return null;
}
