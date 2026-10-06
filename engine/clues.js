/*
 * Crossword clues from Wiktionary, the free dictionary (definitions are CC BY-SA).
 * The first plain sense of the word is used (Wiktionary lists the main sense first).
 * Senses marked slang, vulgar, offensive, dated and the like are skipped when the label
 * shows, and so is any sense the content filter would flag or that gives the answer away.
 */
import { makeFilter } from './filter.js';

const SKIP_LABELS = /\b(slang|vulgar|offensive|derogatory|ethnic slur|pejorative|obsolete|archaic|dated|rare|dialect(al)?|nonstandard|euphemistic|informal|internet|text messaging|lgbtq|sexual|childish|humorous|regional|historical|uncommon|figuratively)\b/i;
const FORM_OF = /ISO 639|language code|\bsymbol for\b|spelling-alphabet|radiotelephony|\bletter of the\b|\balphabet\b|^(plural|alternative|obsolete|archaic|misspelling|abbreviation|initialism|acronym|simple past|past participle|present participle|third-person|eye dialect|comparative|superlative|synonym)\b/i;
const check = makeFilter({});

function plain(html) {
  return String(html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

/* The best clue in a Wiktionary definition response, or null. */
export function pickClue(word, data) {
  // a clue may not contain the answer, or the answer with an ending ("snoring" for SNORE)
  const base = word.replace(/e$/, '');
  const givesAway = new RegExp('\\b(?:' + word + '|' + base + ')(?:s|es|ed|d|ing|er|ers)?\\b', 'i');
  const rank = { Noun: 0, Verb: 1, Adjective: 2, Adverb: 3 };
  const entries = ((data && data.en) || []).map((e, i) => ({ e, i })).sort((a, b) => ((rank[a.e.partOfSpeech] ?? 4) - (rank[b.e.partOfSpeech] ?? 4)) || a.i - b.i).map((x) => x.e);
  for (const entry of entries) {
    for (const d of entry.definitions || []) {
      const raw = String(d.definition || '');
      const lead = plain(raw).match(/^\(([^)]*)\)/);
      if (lead && SKIP_LABELS.test(lead[1])) continue;
      let t = plain(raw).replace(/^\([^)]*\)\s*/, '').split(/(?<=\.)\s+(?=[A-Z])/)[0]          // the first sentence
        .replace(/\s*\([^)]*\)\s*$/, '').replace(/[.;:,]\s*$/, '');
      if (t.length < 4 || FORM_OF.test(t) || givesAway.test(t)) continue;
      if (check({ title: t, summary: '', outlet: '', id: '' }).action !== 'keep') continue;
      if (t.length > 72) t = t.slice(0, 72).replace(/[\s,;]+\S*$/, '') + '…';
      return t[0].toUpperCase() + t.slice(1);
    }
  }
  return null;
}

export const CLUE_URL = (w) => 'https://en.wiktionary.org/api/rest_v1/page/definition/' + encodeURIComponent(w);
const UA = 'DailyGuble/1.0 (newspaper puzzles; +https://dailyguble.pages.dev)';

/* Look one word up. Returns the clue, or null when there is no good one (or Wiktionary is unreachable: undefined). */
export async function fetchClue(word, fetchImpl = fetch) {
  try {
    const r = await fetchImpl(CLUE_URL(word), { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(6000) });
    if (r.status === 404) return null;
    if (!r.ok) return undefined;
    return pickClue(word, await r.json());
  } catch { return undefined; }
}

export const validWord = (w) => /^[a-z]{3,5}$/.test(w);
