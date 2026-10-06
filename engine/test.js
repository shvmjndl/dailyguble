/*
 * Checks for the news engine, with no network: node engine/test.js
 * Covers the feed reader, the content filter, the region finder and story grouping.
 */
import { parseFeed, toText, canonicalLink } from './parse.js';
import { makeFilter } from './filter.js';
import { regionOf } from './places.js';
import { tokens, clusterStories } from './cluster.js';
import { processPart, publicPart, combine } from './edition.js';
import { parseWordList, wordleAnswer, makeMini, fillShape, isInflected, blankClue } from './puzzles.js';
import { pickClue } from './clues.js';
import { readFileSync } from 'node:fs';

let failed = 0, passed = 0;
function eq(got, want, label) {
  if (JSON.stringify(got) === JSON.stringify(want)) passed++;
  else { failed++; console.log('FAIL', label, '\n   got ', JSON.stringify(got), '\n   want', JSON.stringify(want)); }
}

// ---- feed reader
const NOW = Date.parse('2026-10-06T12:00:00Z');
const rss = `<?xml version="1.0"?><rss><channel><title>Feed</title>
<item><title><![CDATA[🔴 LIVE: Rates &amp; markets]]></title><link>https://ex.com/a?utm_source=rss&id=1#top</link>
<description><![CDATA[<p>Rates &ldquo;rose&rdquo; today.</p><figure><img src="x.jpg"><figcaption>Photo</figcaption></figure> Continue reading...]]></description>
<pubDate>Tue, 06 Oct 2026 10:00:00 GMT</pubDate><dc:creator>A Writer</dc:creator></item>
<item><title>Old story</title><link>https://ex.com/old</link><pubDate>Fri, 02 Oct 2026 10:00:00 GMT</pubDate></item>
<item><title>Cut off</title><link>https://ex.com/cut</link>`;
const items = parseFeed(rss, { id: 'f', outlet: 'Ex', section: 'world' }, 40, NOW - 86400000);
eq(items.length, 1, 'stale and cut-off items are skipped');
eq(items[0].title, 'Rates & markets', 'emoji and LIVE tag dropped, entities decoded');
eq(items[0].link, 'https://ex.com/a?id=1', 'tracking parameters and fragment removed');
eq(items[0].summary, 'Rates “rose” today.', 'figure, tags and "Continue reading" removed');
eq(items[0].author, 'A Writer', 'author read');
const atom = `<feed><entry><title type="html">Atom &lt;b&gt;title&lt;/b&gt;</title><link rel="alternate" href="https://ex.com/atom"/>
<summary>Short</summary><updated>2026-10-06T09:00:00Z</updated><author><name>B Writer</name></author></entry></feed>`;
const a = parseFeed(atom, { id: 'g', outlet: 'Ex', section: 'world' });
eq([a[0].title, a[0].link, a[0].author], ['Atom title', 'https://ex.com/atom', 'B Writer'], 'atom entry');
eq(toText('&lt;p&gt;Hi&lt;/p&gt;'), 'Hi', 'escaped HTML');
eq(canonicalLink('https://x.com/p?ref=home&q=2'), 'https://x.com/p?q=2', 'ref dropped');

const plug = parseFeed('<rss><item><title>T</title><link>https://ex.com/p</link><description>Graves were found in NSW. Find more from the Unmarked graves investigation here Get our breaking news email, free app or daily news podcast</description><pubDate>Tue, 06 Oct 2026 10:00:00 GMT</pubDate></item></rss>', { id: 'g', outlet: 'G', section: 'world' });
eq(plug[0].summary, 'Graves were found in NSW.', 'newsletter plugs removed');

// ---- content filter
const check = makeFilter({});
const f = (title, summary = '') => { const r = check({ title, summary, outlet: 'X', id: 'i' }); return r.action + (r.category ? ':' + r.category : ''); };
eq(f('Scunthorpe United win again'), 'keep', 'no substring matches');
eq(f('Essex council budget approved'), 'keep', 'Essex');
eq(f('Leaked sex tape scandal grows'), 'remove:explicit', 'explicit');
eq(f('Pornographic deepfakes spread'), 'remove:explicit', 'endings');
eq(f('Child porn ring broken up'), 'note:child-abuse', 'child abuse is news, kept with a note');
eq(f('Graphic video of attack shared online'), 'remove:gore', 'gore in a headline');
eq(f('Art review', 'a display of dismembered corpses'), 'note:gore', 'gore deeper in the summary gets a note');
eq(f('Minister calls critics bastards'), 'remove:profanity', 'profanity');
eq(f('Pussy Riot member detained'), 'keep', 'Pussy Riot');
eq(f('Suicide bombing kills 12'), 'keep', 'suicide bombing is not self-harm');
eq(f('Coroner rules death a suicide'), 'note:suicide', 'suicide note');
eq(f('Man charged with rape'), 'note:sexual-violence', 'sexual violence note');
eq(f('Grape harvest begins'), 'keep', 'grape');
eq(f('Therapist warns on eating disorders'), 'note:eating-disorders', 'eating disorders');
const own = makeFilter({ blockWords: ['crypto*'], allowWords: ['bastards'], blockOutlets: ['Spam Daily'] });
eq(own({ title: 'Cryptocurrency slumps', summary: '', outlet: 'X' }).action, 'remove', 'editor blocked word with *');
eq(own({ title: 'Inglourious Basterds and the bastards of war', summary: '', outlet: 'X' }).action, 'keep', 'editor never-block word');
eq(own({ title: 'Anything', summary: '', outlet: 'spam daily' }).action, 'remove', 'blocked outlet');
eq(makeFilter({ allow: ['i'] })({ title: 'Graphic video shown at trial', summary: '', outlet: 'X', id: 'i' }).action, 'keep', 'editor restore');

// ---- region finder
const R = [['Fighting in South Sudan displaces thousands', 'mea'], ['Let us know what you think', null], ['US strikes in Yemen', 'americas'],
  ['U.S. troops leave Iraq', 'americas'], ['Tbilisi protests grow as Georgian Dream wins', 'europe'], ['Georgia governor signs bill in Atlanta', 'americas'],
  ['Congress leader Rahul Gandhi slams BJP', 'india'], ['Congress passes spending bill', 'americas'], ['Papua New Guinea quake', 'asia'],
  ['Kim Jong Un fires missile', 'asia'], ['Kenya’s president visits', 'mea'], ['A quiet day', null], ['Tamil Nadu bypolls', 'india']];
for (const [t, want] of R) eq(regionOf(t), want, 'region: ' + t);

// ---- grouping
eq(tokens('Tamil Nadu bypolls are a test for the government'), ['tamil nadu', 'bypoll', 'test', 'government'], 'place names are one word');
const S = (outlet, title) => ({ outlet, title, tokens: tokens(title) });
const groups = clusterStories([
  S('BBC', "'Ghost particles' from space telescope wins physics Nobel"),
  S('NPR', 'Francis Halzen wins Nobel Prize in physics for work on high-energy neutrinos from space'),
  S('F24', 'Nobel Prize in Physics awarded to Francis Halzen for ice research'),
  S('Scroll', 'Nobel Prize in Medicine awarded to three scientists for brain research'),
  S('Guardian', 'Nobel prize in physics goes to Francis Halzen for south pole work on neutrinos'),
  S('Guardian', 'Nobel prize in medicine 2026 awarded for research into mysteries of brain'),
  S('BBC', 'Saudi Arabia says three wounded in attacks on airports near Yemen border'),
  S('F24', "Yemen's Houthis claim attack on Riyadh airport"),
  S('NYT', 'Why Saudi Arabia’s Last War in Yemen Turned Into a Quagmire'),
  S('HT', 'Tamil Nadu government transfers three IAS officers'),
  S('Hindu', 'Tamil Nadu bypolls are an early test for Vijay’s young government')
]).map((g) => g.map((s) => s.outlet).join('+'));
eq(groups, ['BBC+NPR+F24+Guardian', 'Scroll+Guardian', 'BBC+F24', 'NYT', 'HT', 'Hindu'], 'events grouped without chaining');

// ---- parts and combine
const feed = { id: 'bbc-world', outlet: 'BBC News', section: 'world' };
const part = processPart([{ feed, text: rss.replace('Rates &amp; markets', 'Graphic video of attack shared online') + '</item></channel></rss>' }], {}, NOW);
eq([part.stories.length, part.filtered.length, part.filteredCount], [0, 1, 1], 'filtered story kept aside');
eq('filtered' in publicPart(part), false, 'readers never get filtered stories');
const ed = combine([processPart([{ feed, text: rss }], {}, NOW)], { markets: null, onThisDay: [] }, { now: NOW });
eq([ed.front.length, ed.sections.world.length, ed.front[0].title], [1, 1, 'Rates & markets'], 'combine places the story');

// ---- daily puzzles
const W = parseWordList(readFileSync(new URL('../public/words.txt', import.meta.url), 'utf8'));
eq([W.byLen[5].length > 8000, W.commonByLen[5].length > 2000, W.all.has('apple'), W.all.has('xyzzy')], [true, true, true, false], 'word list loads');
eq([isInflected('keys', W), isInflected('baked', W), isInflected('glass', W), isInflected('apple', W)], [true, true, false, false], 'inflections');
const texts = [{ src: 'tfa', text: 'The castle was built beside a quiet river by the Normans. Its tower and moat survive.', title: 'A castle', link: 'https://en.wikipedia.org/wiki/Castle' }];
const w1 = wordleAnswer('2026-10-06', texts, W), w2 = wordleAnswer('2026-10-06', texts, W);
eq([w1.word === w2.word, ['quiet', 'river', 'tower'].includes(w1.word), w1.source && w1.source.title], [true, true, 'A castle'], 'word game: same word for everyone, from the day’s text');
eq(wordleAnswer('2026-10-07', [], W).word.length, 5, 'word game: a word even without the day’s text');
const m1 = makeMini('2026-10-06', texts, W), m2 = makeMini('2026-10-06', texts, W);
eq([!!m1, JSON.stringify(m1 && m1.rows) === JSON.stringify(m2 && m2.rows)], [true, true], 'mini: made, and the same on every device');
const words = m1.words.map((x) => x.word);
eq([new Set(words).size === words.length, words.every((w) => W.all.has(w))], [true, true], 'mini: real words, none repeated');
const g = m1.rows;
const across = g.flatMap((r) => r.split('#').filter((x) => x.length > 1)), down = [0, 1, 2, 3, 4].map((c) => g.map((r) => r[c]).join('')).flatMap((col) => col.split('#').filter((x) => x.length > 1));
eq(across.concat(down).every((w) => W.all.has(w)), true, 'mini: every row and column reads as a word');
eq(fillShape(['.....', '.....', '.....', '.....', '.....'], { 5: ['abcde'] }, 1000), null, 'mini: an impossible fill gives up');
eq(blankClue('river', texts), '“The castle was built beside a quiet ___ by the Normans”', 'clue from the day’s text');
const wikt = (defs) => ({ en: [{ partOfSpeech: 'Noun', definitions: defs.map((d) => ({ definition: d })) }] });
eq(pickClue('petal', wikt(['One of the parts of the <a href="x">corolla</a> of a flower. It is often bright.', 'The labia'])), 'One of the parts of the corolla of a flower', 'clue: first sense, first sentence');
eq(pickClue('snore', wikt(['The act of snoring', 'A loud sleeper'])), 'A loud sleeper', 'clue: never gives the answer away');
eq(pickClue('keys', wikt(['Plural of key'])), null, 'clue: no plain form-of clues');
eq(pickClue('alfa', wikt(['NATO & ICAO radiotelephony clear code (spelling-alphabet name) for the letter A'])), null, 'clue: no spelling-alphabet clues');

console.log(failed ? `${failed} failed, ${passed} passed` : `all ${passed} checks pass`);
process.exit(failed ? 1 : 0);
