/*
 * Spotting the same event reported by different outlets.
 * Two headlines are about the same event when they share most of their significant
 * words (common words like "the" and "says" removed, plurals folded):
 *   at least 3 shared words covering half of the shorter headline,
 *   or, for very short headlines, 2 shared words covering two thirds.
 * (Thresholds were tuned on a day of real headlines from all the feeds.)
 * An inverted index means each headline is only compared with those sharing a word.
 */
import { MULTIWORD } from './places.js';

const STOP = new Set(('the a an and or but nor of in on at to for from by with as is are was were be been being has have had ' +
  'it its this that these those after before over under into out up down off says say said tells told new more most than ' +
  'amid about across against among around what why how who whom which when where will would could can may might must shall ' +
  'not no yes his her him their them they he she we you our your my me us live latest update updates news report reports ' +
  'reported video watch first last day days week weeks year years one two three four five six seven eight nine ten ' +
  'just now still also all any some many much very get gets got make makes made take takes took set sets back amid via ' +
  'here there what\'s don\'t won\'t can\'t it\'s says? say: during while within without until since per vs').split(/\s+/));

const NONWORD = /[^a-zA-Z0-9À-ɏͰ-ϿЀ-ӿऀ-ॿ]+/;   // plain classes: quicker to set up than unicode ones

function stem(w) {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 4 && /(?:ches|shes|sses|xes)$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us')) return w.slice(0, -1);
  return w;
}

export function tokens(title) {
  const words = title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['\u2019]s(?![a-z])/g, '').split(NONWORD);
  const out = new Set();
  for (let i = 0; i < words.length; i++) {
    let joined = null;                                    // "tamil nadu" is one word, not two
    for (let n = 3; n >= 2 && !joined; n--) if (i + n <= words.length) { const k = words.slice(i, i + n).join(' '); if (MULTIWORD.has(k)) { joined = k; i += n - 1; } }
    if (joined) { out.add(joined); continue; }
    const w = words[i];
    if (w.length > 2 && !STOP.has(w)) out.add(stem(w));
  }
  return [...out];
}

/* Do two headlines (token lists) describe the same event? */
export function sameEvent(a, b, shared) {
  const m = Math.min(a.length, b.length);
  return (shared >= 3 && shared / m >= 0.5) || (shared >= 2 && m <= 3 && shared / m >= 0.66);
}

/*
 * Group stories (each with .tokens and .outlet) into events, taking them in order of
 * preference. A story joins an event only when it matches MORE than half of that event's
 * stories from other outlets (or exactly half, through a close match), so one loose match can't chain two different events together
 * (the physics Nobel and the medicine Nobel stay apart). Returns arrays of stories.
 */
export function clusterStories(stories) {
  const group = new Int32Array(stories.length), groups = [], index = new Map();
  for (let i = 0; i < stories.length; i++) {
    const s = stories[i], shared = new Map();
    for (const t of s.tokens) { const list = index.get(t); if (list) for (const j of list) shared.set(j, (shared.get(j) || 0) + 1); }
    const hits = new Map(), strong = new Set();
    for (const [j, n] of shared) {
      const o = stories[j];
      if (o.outlet === s.outlet || !sameEvent(s.tokens, o.tokens, n)) continue;
      hits.set(group[j], (hits.get(group[j]) || 0) + 1);
      if (n >= 4 || n / Math.min(s.tokens.length, o.tokens.length) >= 0.6) strong.add(group[j]);
    }
    // join the event this story matches best: more than half its reports, or exactly half with a close match
    let best = -1, bestRatio = 0;
    for (const [g, n] of hits) {
      let others = 0;
      for (const m of groups[g]) if (m.outlet !== s.outlet) others++;
      const ratio = n / others;
      if (ratio < 0.5 || (ratio === 0.5 && !strong.has(g))) continue;
      if (ratio > bestRatio || (ratio === bestRatio && n > hits.get(best))) { best = g; bestRatio = ratio; }
    }
    if (best < 0) { best = groups.length; groups.push([]); }
    groups[best].push(s); group[i] = best;
    for (const t of s.tokens) { let list = index.get(t); if (!list) index.set(t, list = []); list.push(i); }
  }
  return groups;
}
