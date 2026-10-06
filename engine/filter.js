/*
 * The content filter: plain word and phrase rules, no AI.
 *
 * Every rule is matched against a story's headline and summary as a WHOLE word
 * or phrase, ignoring case, so place names like Scunthorpe or Essex never trip it.
 * Each pattern is a small regular expression: \w* allows endings ("porn\w*" catches
 * "porno", "pornographic"). Categories are checked in order; the first match wins.
 *
 *   remove  the story never reaches readers
 *   note    the story stays, with a short note, but is never the front-page lead
 */

export const RULES = [
  {
    key: 'explicit', label: 'Sexually explicit', action: 'remove',
    patterns: [
      '(?<!child |revenge |deepfake )porn\\w*', 'xxx', 'sex tapes?', 'sex videos?', 'nude (?:photos?|pictures?|images?|videos?|selfies?|scenes?)',
      'naked (?:photos?|pictures?|images?|videos?|selfies?)', 'nudes', 'topless (?:photos?|pictures?|images?)',
      'explicit (?:photos?|pictures?|images?|videos?|content|scenes?)', 'orgasm\\w*', 'masturbat\\w*',
      'onlyfans', 'sexting', 'strip ?clubs?', 'stripper\\w*', 'camgirls?', 'hentai', 'bdsm', 'dildos?', 'sex toys?'
    ]
  },
  {
    key: 'gore', label: 'Graphic gore', action: 'remove',
    // in a headline it goes; deeper in the summary (a war report, a review of a Goya print) it stays with a note
    summaryOnly: { action: 'note', note: 'This story contains descriptions of graphic violence.' },
    patterns: [
      'gory', 'gruesome (?:video|footage|images|photos|pictures)', 'graphic (?:video|footage|images|photos|pictures|content|scenes)',
      'dismember\\w*', 'decapitat\\w*', 'disembowel\\w*', 'beheading videos?', 'severed (?:heads?|limbs?|body|bodies|hands?|feet|legs?|arms?)',
      'mutilated (?:body|bodies|corpses?|remains)', 'body parts', 'charred (?:body|bodies|remains|corpses?)', 'skinned alive', 'burned alive', 'eaten alive'
    ]
  },
  {
    key: 'slurs', label: 'Slurs and hate terms', action: 'remove',
    patterns: [
      'nigg(?:er|a|ers|as|az)', 'negro(?:es)?', 'coons?', 'darkies', 'darkie', 'jungle bunn(?:y|ies)', 'porch monkeys?',
      'chinks?', 'gooks?', 'japs', 'slant[- ]?eyes?', 'ching chong',
      'kikes?', 'yids?', 'heebs?',
      'spics?', 'wetbacks?', 'beaners?',
      'pakis?', 'ragheads?', 'towelheads?', 'sand ?n\\w*gg\\w*', 'camel ?jockeys?', 'muzzies?',
      'gypp?os?', 'pikeys?',
      'fag(?:s|got|gots)?', 'trann(?:y|ies)', 'shemales?',
      'retard(?:s|ed)?', 'spastics?', 'spaz', 'mongs?'
    ]
  },
  {
    key: 'profanity', label: 'Explicit profanity', action: 'remove',
    patterns: [
      'fuck\\w*', 'f\\*ck\\w*', 'motherfuck\\w*', 'shit\\w*', 'bullshit', 'horseshit', 'cunts?', 'twats?', 'bitch\\w*',
      'arse ?holes?', 'ass ?holes?', 'dick ?heads?', 'wank\\w*', 'bastards?', 'piss(?:ed)? off', 'cock ?suck\\w*', 'pussy(?! riot)', 'pussies', 'slut\\w*', 'whores?'
    ]
  },
  {
    key: 'suicide', label: 'Suicide and self-harm', action: 'note', note: 'This story discusses suicide.',
    patterns: [
      'suicid\\w*(?![ -](?:bomb|attack|drone|vest|car|truck|mission|squad))', 'self[- ]harm\\w*', 'took (?:his|her|their) own lives?', 'took (?:his|her|their) own life', 'killed (?:himself|herself|themselves)',
      'kill (?:himself|herself|themselves|yourself|myself)', 'kys', 'overdosed? on purpose'
    ]
  },
  {
    key: 'sexual-violence', label: 'Sexual violence', action: 'note', note: 'This story discusses sexual violence.',
    patterns: [
      'rap(?:e|es|ed|ing|ist|ists)', 'gang[- ]?rap\\w*', 'sexual(?:ly)? (?:assault\\w*|abuse\\w*|violence|harass\\w*|exploit\\w*)',
      'molest\\w*', 'indecent assault', 'revenge porn', 'deepfake porn', 'sex(?:ual)? offen[cs]es?', 'sex offenders?', 'groping'
    ]
  },
  {
    key: 'child-abuse', label: 'Child abuse', action: 'note', note: 'This story discusses child abuse.',
    patterns: [
      'child (?:abuse|abusers?|sexual abuse|pornography|grooming|exploitation)', 'paedophil\\w*', 'pedophil\\w*', 'child porn\\w*',
      'csam', 'grooming gangs?', 'abused (?:children|a child|minors?)'
    ]
  },
  {
    key: 'eating-disorders', label: 'Eating disorders', action: 'note', note: 'This story discusses eating disorders.',
    patterns: ['eating disorders?', 'anorexi\\w*', 'bulimi\\w*', 'binge[- ]eating']
  }
];

/*
 * Matching works on lower-cased text with plain (non-unicode) expressions: several times
 * faster than unicode ones, which matters on Cloudflare's 10 ms budget. A "word" edge is
 * any character that is not a letter or digit in Latin, Greek or Cyrillic.
 */
const L = 'a-z0-9\\u00c0-\\u024f\\u0370-\\u03ff\\u0400-\\u04ff';
const B = '(?<![' + L + '])', E = '(?![' + L + '])';
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const COMPILED = RULES.map((r) => Object.assign({}, r, { re: new RegExp(B + '(?:' + r.patterns.join('|') + ')' + E) }));
const ANY = new RegExp(B + '(?:' + RULES.flatMap((r) => r.patterns).join('|') + ')' + E);   // one pass clears most stories

/* Turn the editor's own word lists into the same kind of rule. */
export function compileList(words, flags = '') {
  const list = (words || []).map((w) => String(w).trim().toLowerCase()).filter(Boolean).map((w) => escapeRe(w).replace(/\\\*/g, '[' + L + ']*').replace(/\s+/g, '\\s+'));
  return list.length ? new RegExp(B + '(?:' + list.join('|') + ')' + E, flags) : null;
}

/*
 * Check one story. settings: { blockWords, allowWords, blockOutlets, allow (story ids) }.
 * Returns { action: 'keep' | 'note' | 'remove', category, label, match, note }.
 */
export function makeFilter(settings = {}) {
  const block = compileList(settings.blockWords), allowG = compileList(settings.allowWords, 'g');
  const allowIds = new Set(settings.allow || []), blockedOutlets = new Set((settings.blockOutlets || []).map((o) => String(o).toLowerCase()));
  return function check(story) {
    if (blockedOutlets.has(String(story.outlet).toLowerCase())) return { action: 'remove', category: 'outlet', label: 'Blocked outlet', match: story.outlet };
    let title = story.title.toLowerCase(), text = title + ' • ' + String(story.summary || '').toLowerCase();
    if (allowG) { text = text.replace(allowG, ' '); title = title.replace(allowG, ' '); }   // the editor's "never block" words don't count
    const restored = allowIds.has(story.id);
    if (block && !restored) { const m = text.match(block); if (m) return { action: 'remove', category: 'editor', label: 'Your blocked words', match: m[0] }; }
    if (!ANY.test(text)) return { action: 'keep' };
    let soft = null;
    for (const r of COMPILED) {
      const m = text.match(r.re);
      if (!m) continue;
      let action = r.action, note = r.note || null;
      if (r.summaryOnly && !r.re.test(title)) ({ action, note } = r.summaryOnly);
      if (action === 'remove' && restored) continue;                    // an editor restored this story
      if (action === 'remove') return { action, category: r.key, label: r.label, match: m[0], note };
      if (!soft) soft = { action, category: r.key, label: r.label, match: m[0], note };   // a later rule may still remove it
    }
    return soft || { action: 'keep' };
  };
}

/* The built-in lists, for showing in the newsroom. */
export function ruleSummary() {
  return RULES.map((r) => ({ key: r.key, label: r.label, action: r.action, note: r.note || null, patterns: r.patterns }));
}
