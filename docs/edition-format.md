# The Daily Guble: edition format

The agreed shape of the paper. The news engine fills this format automatically
every hour; editors can step in at any point. Nothing here uses AI: stories are
written by the outlets' own journalists, chosen and placed by plain, visible rules.

**Status:** agreed format, engine not built yet.

---

## Principles

- **A human paper.** Real journalists' work, chosen by clear rules and by you. No AI writes, summarises, ranks or filters anything.
- **Credit and link, never copy.** Each story shows its headline, the outlet's own short summary, the outlet's name and a link to read the full story at the source. No full articles and no outlet photos.
- **Everything fits.** Every slot has a size, and text is trimmed at a word boundary to fit. Nothing runs off a page.
- **Calm, not jumpy.** The edition changes once an hour, and never under a reader who is mid-way through it.
- **Personal, non-commercial use** for now: the sources below are chosen on that basis (see [Licensing](#licensing)).

---

## The edition: 8 pages

| # | Page | In one line |
|---|---|---|
| 1 | **Front page** | The day's biggest story, two more, the world in brief, and what's inside |
| 2 | **World** | Four regions: Americas · Europe · Middle East & Africa · Asia-Pacific |
| 3 | **India** | The national news |
| 4 | **Business** | Companies, economies, and a currency box |
| 5 | **Science, Tech & Health** | Three columns plus a climate box |
| 6 | **Opinion & Analysis** | Clearly labelled commentary and expert analysis |
| 7 | **Sport & Culture** | Sport, arts, and "On this day" |
| 8 | **Puzzles & Almanac** | Crossword, sudoku, word search; the reader's weather, sun and moon |

### What every story looks like

| Part | From | Notes |
|---|---|---|
| Kicker | the section or region | e.g. "Europe", "Markets", "Opinion" |
| Headline | the outlet, unchanged | |
| Summary | the outlet's own feed summary | trimmed to the slot's length at a word boundary, with "…" |
| Credit line | outlet name · time | e.g. "BBC News · 2 hours ago" |
| Link | the original article | "Read the full story at BBC News" |
| Note (sensitive stories only) | the filter | e.g. "This story discusses suicide." |

Tapping a story opens it in the story reader, the same as now, with the link to the full article at the bottom.

---

## Page by page

Sizes are for the 800 × 1120 page. Summary lengths are maximums; text is cut at a word boundary to fit.

### 1. Front page

```
┌────────────────────────────────────────────────────────────────┐
│ [lighthouse]          The Daily Guble        [Gurugram 33° ☀] │
│ Tuesday, October 6, 2026 · Updated 3:00 p.m. · Eight pages     │
├────────────┬──────────────────────────────────┬────────────────┤
│ The world  │ LEAD STORY                       │ SECOND STORY   │
│ in brief   │ kicker · large headline          │ headline       │
│            │ summary (up to 600 characters)   │ summary (300)  │
│ 6 briefs,  │ credit · link                    │────────────────│
│ one per    │                                  │ SECOND STORY   │
│ region     │ How others reported it:          │ headline       │
│ headline + │ up to 3 other outlets' headlines │ summary (300)  │
│ 1 line     │ for the same event, with links   │                │
├────────────┴──────────────────────────────────┴────────────────┤
│ Inside today: one top headline from each inside page           │
└────────────────────────────────────────────────────────────────┘
```

- **Lead story:** the event covered by the most outlets in the last 12 hours. Never a sensitive story.
- **Second stories:** the next two, from different regions to the lead where possible.
- **The world in brief:** six one-line stories, one per region where possible, none repeating the stories above.
- **Inside today:** a teaser for pages 2 to 7, linking to that page.

### 2. World

A 2 × 2 grid of regions. Each region box has **1 main story** (summary up to 300 characters) and **3 briefs** (headline only).

| Region | Covers |
|---|---|
| Americas | North, Central and South America, the Caribbean |
| Europe | Europe, including the UK, Russia and Ukraine |
| Middle East & Africa | the Middle East, North Africa, sub-Saharan Africa |
| Asia-Pacific | Asia (excluding India, which has its own page), Australia, the Pacific |

**Sources:** BBC World (and its regional feeds), The Guardian World, Al Jazeera, NPR World, DW, France 24, UN News, The New York Times World.

**Which region a story belongs to:** the outlet's regional feed when it has one (BBC does); otherwise the first country, city or region named in the headline or summary, matched against a place-name list.

### 3. India

- **Lead story** (summary up to 500 characters)
- **4 stories** (summary up to 250 characters)
- **"Across India"**: 6 briefs (headline only)

**Sources:** The Hindu, The Indian Express, Hindustan Times, Scroll, NDTV, BBC News India.

### 4. Business

- **Lead story** and **4 stories**
- **Markets box:** today's exchange rates for USD, EUR, GBP, INR and JPY against each other, from the European Central Bank's daily reference rates. Updated once a working day, with the date shown.
- **"Companies in brief"**: 4 briefs

**Sources:** BBC Business, The Guardian Business, CNBC World, NPR Business.

### 5. Science, Tech & Health

Three columns:

| Column | Stories | Sources |
|---|---|---|
| Science | 1 main + 2 | BBC Science & Environment, The Guardian Science |
| Technology | 1 main + 2 | BBC Technology, The Guardian Technology |
| Health | 1 main + 2 | BBC Health, The Guardian Society/Health |

Plus a **Climate box** of 3 briefs from The Guardian Environment and BBC Science & Environment.

### 6. Opinion & Analysis

- **5–6 pieces**, each labelled **Opinion** or **Analysis** in its kicker, with the writer's name when the feed gives one.
- At most **2 per outlet**, so no single outlet sets the page's voice.

**Sources:** The Guardian Opinion, The New York Times Opinion, The Hindu Opinion, The Conversation (analysis by academics, published under a Creative Commons licence).

### 7. Sport & Culture

- **Sport:** lead + 4 stories (BBC Sport, The Guardian Sport)
- **Culture:** 3 stories (The Guardian Culture, BBC Entertainment & Arts)
- **On this day:** 3 events from history for today's date, from Wikipedia, credited under its CC BY-SA licence

### 8. Puzzles & Almanac

Unchanged from today: the crossword, sudoku and word search made in the newsroom, plus the **Almanac** with the reader's own weather, sunrise, sunset and moon.

---

## How stories are chosen

All of these are plain rules, written down here and visible in the code.

1. **Collect:** every hour, read each page's source feeds. Keep stories from the **last 24 hours** (36 for Opinion and Culture).
2. **Merge duplicates:** stories from different outlets about the same event become one, when their headlines share most of their significant words (after removing common words like "the" and "says"). The merged story keeps the version from the outlet listed first for that page, and remembers the others for "How others reported it".
3. **Filter:** run every story through the [content filter](#content-filter).
4. **Rank:** score = number of outlets covering the event × 3, plus a freshness bonus (a story loses 1 point for every 2 hours of age), plus 5 if an editor pinned it.
5. **Balance:** at most 2 stories per outlet on a page (front page: 1 per outlet in the lead and second stories); on World, each region is filled from its own stories.
6. **Place:** the highest-scoring story takes the biggest slot on its page, and so on down. Text is trimmed to each slot's size.
7. **No repeats:** a story appears once in the edition (the front page takes priority; inside pages skip what's already on page 1, except in "Inside today").

---

## Content filter

Two layers, no AI. Both are fully predictable, and every decision can be seen and reversed in the newsroom.

### Layer 1: word and phrase rules (always on)

Matched against the headline and summary, as **whole words** and phrases, ignoring case, so "Scunthorpe" or "Essex" never trip a rule.

| Category | Action | Examples of what's caught |
|---|---|---|
| Sexually explicit | **Remove** | explicit sexual terms, porn, nude/naked imagery |
| Graphic gore | **Remove** | detailed descriptions of mutilation, dismemberment, "graphic video" |
| Slurs and hate terms | **Remove** | racial, ethnic, religious, homophobic and disability slurs |
| Explicit profanity | **Remove** | swear words, including in quotes |
| Sensitive topics | **Keep, with a note** | suicide, self-harm, sexual assault and rape, child abuse, eating disorders |

**Sensitive stories** stay in the paper with a short note ("This story discusses suicide."), but are **never the front-page lead** or in the front page's "world in brief".

War, crime, disasters and politics reported plainly are **not** filtered. That's the news.

### Layer 2: the editor

In the newsroom:

- **Hide** any story in one click, for this edition or for good.
- **Pin** a story to keep it on its page until you unpin it.
- **Move** a story to another page or slot.
- **Block** words, phrases or whole outlets with your own lists, alongside the built-in ones.
- **See what was filtered:** a "Filtered today" list shows each removed story with the exact word or phrase that removed it, and a **Restore** button for mistakes.

---

## Editors and the hourly update

- **Automatic, you can step in.** The news pages fill themselves every hour. Anything you do (hide, pin, move, your own stories) is kept across updates.
- **Your own stories:** write them in the newsroom as now and place them on any page. They're treated as pinned, and the engine fills the remaining slots around them.
- **Lock a page:** stop automatic updates on one page, e.g. to keep a front page you've arranged by hand.
- **Updated stamp:** the masthead shows when the edition was last updated, in the reader's own time.
- **No jumping:** a reader's open paper doesn't change under them. A new edition shows the next time they open the paper, or when they come back to it after the hour has turned.
- **If sources are down:** the last good edition stays up with its honest "Updated" time; a page with no fresh stories keeps its previous ones.

**Where it runs:** a small free Cloudflare function next to the website fetches the feeds once an hour, builds the edition and caches it, so readers' browsers just read the result. There's nothing to run yourself, and it stays within Cloudflare's free tier.

---

## Licensing

- **Personal, non-commercial use** is the basis for these sources. Showing headlines, the outlets' own summaries and links back is what feed readers and aggregators do; full articles and photos are never copied.
- **Wikipedia** ("On this day") is credited under CC BY-SA.
- **The Conversation** is published under Creative Commons and credited.
- **Exchange rates** are the European Central Bank's public reference rates.
- **Weather** stays as now (US National Weather Service; Open-Meteo, which is free for non-commercial use).
- **If the paper ever goes commercial** (ads or payments), the sources must be reviewed first: several outlets require permission for commercial use.

---

## Not in this version

- Photos from the outlets (copyright).
- Pages for other countries or languages.
- Comments or reader accounts.
