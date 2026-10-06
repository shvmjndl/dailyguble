/*
 * Where the news comes from: each feed, its outlet, the section it fills and,
 * for regional feeds, the region. Order matters: within a section, when several
 * outlets report the same event, the outlet listed first supplies the version shown.
 *
 * region: every story in the feed is from that region (BBC's regional feeds).
 * hint: the region to assume when a story names no place (an Indian paper's national news).
 *
 * maxBytes: how much of a feed to read. Feeds list newest first, so the start of
 * the file is all we need; this keeps the engine fast.
 */
export const FEEDS = [
  // ---- World (BBC regional feeds tag their region directly)
  { id: 'bbc-world', outlet: 'BBC News', section: 'world', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { id: 'bbc-africa', outlet: 'BBC News', section: 'world', region: 'mea', url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml' },
  { id: 'bbc-mideast', outlet: 'BBC News', section: 'world', region: 'mea', url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml' },
  { id: 'bbc-europe', outlet: 'BBC News', section: 'world', region: 'europe', url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml' },
  { id: 'bbc-latam', outlet: 'BBC News', section: 'world', region: 'americas', url: 'https://feeds.bbci.co.uk/news/world/latin_america/rss.xml' },
  { id: 'bbc-uscanada', outlet: 'BBC News', section: 'world', region: 'americas', url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml' },
  { id: 'bbc-asia', outlet: 'BBC News', section: 'world', region: 'asia', url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml' },
  { id: 'bbc-australia', outlet: 'BBC News', section: 'world', region: 'asia', url: 'https://feeds.bbci.co.uk/news/world/australia/rss.xml' },
  { id: 'guardian-world', outlet: 'The Guardian', section: 'world', url: 'https://www.theguardian.com/world/rss', maxBytes: 90000 },
  { id: 'aljazeera', outlet: 'Al Jazeera', section: 'world', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { id: 'npr-world', outlet: 'NPR', section: 'world', url: 'https://feeds.npr.org/1004/rss.xml' },
  { id: 'dw-world', outlet: 'DW', section: 'world', url: 'https://rss.dw.com/rdf/rss-en-world' },
  { id: 'france24', outlet: 'France 24', section: 'world', url: 'https://www.france24.com/en/rss' },
  { id: 'un-news', outlet: 'UN News', section: 'world', url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml' },
  { id: 'nyt-world', outlet: 'The New York Times', section: 'world', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', maxBytes: 80000 },

  // ---- India
  { id: 'the-hindu', outlet: 'The Hindu', section: 'india', hint: 'india', url: 'https://www.thehindu.com/news/national/feeder/default.rss', maxBytes: 70000 },
  { id: 'indian-express', outlet: 'The Indian Express', section: 'india', hint: 'india', url: 'https://indianexpress.com/section/india/feed/', maxBytes: 70000 },
  { id: 'hindustan-times', outlet: 'Hindustan Times', section: 'india', hint: 'india', url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', maxBytes: 70000 },
  { id: 'scroll', outlet: 'Scroll', section: 'india', hint: 'india', url: 'https://feeds.feedburner.com/ScrollinArticles.rss', maxBytes: 70000 },
  { id: 'bbc-india', outlet: 'BBC News', section: 'india', hint: 'india', url: 'https://feeds.bbci.co.uk/news/world/asia/india/rss.xml' },

  // ---- Business
  { id: 'bbc-business', outlet: 'BBC News', section: 'business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
  { id: 'guardian-business', outlet: 'The Guardian', section: 'business', url: 'https://www.theguardian.com/uk/business/rss', maxBytes: 80000 },
  { id: 'cnbc-business', outlet: 'CNBC', section: 'business', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147' },
  { id: 'cnbc-economy', outlet: 'CNBC', section: 'business', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258' },
  { id: 'npr-business', outlet: 'NPR', section: 'business', url: 'https://feeds.npr.org/1006/rss.xml' },
  { id: 'dw-business', outlet: 'DW', section: 'business', url: 'https://rss.dw.com/rdf/rss-en-bus' },

  // ---- Science, Tech & Health, and the climate box
  { id: 'bbc-science', outlet: 'BBC News', section: 'science', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml' },
  { id: 'guardian-science', outlet: 'The Guardian', section: 'science', url: 'https://www.theguardian.com/science/rss', maxBytes: 80000 },
  { id: 'bbc-tech', outlet: 'BBC News', section: 'tech', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
  { id: 'guardian-tech', outlet: 'The Guardian', section: 'tech', url: 'https://www.theguardian.com/uk/technology/rss', maxBytes: 80000 },
  { id: 'bbc-health', outlet: 'BBC News', section: 'health', url: 'https://feeds.bbci.co.uk/news/health/rss.xml' },
  { id: 'npr-health', outlet: 'NPR', section: 'health', url: 'https://feeds.npr.org/1128/rss.xml' },
  { id: 'guardian-society', outlet: 'The Guardian', section: 'health', url: 'https://www.theguardian.com/society/rss', maxBytes: 80000 },
  { id: 'guardian-environment', outlet: 'The Guardian', section: 'climate', url: 'https://www.theguardian.com/environment/rss', maxBytes: 80000 },

  // ---- Opinion & Analysis
  { id: 'guardian-opinion', outlet: 'The Guardian', section: 'opinion', kind: 'Opinion', url: 'https://www.theguardian.com/commentisfree/rss', maxBytes: 90000 },
  { id: 'nyt-opinion', outlet: 'The New York Times', section: 'opinion', kind: 'Opinion', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Opinion.xml', maxBytes: 80000 },
  { id: 'hindu-opinion', outlet: 'The Hindu', section: 'opinion', kind: 'Opinion', url: 'https://www.thehindu.com/opinion/feeder/default.rss', maxBytes: 70000 },
  { id: 'conversation', outlet: 'The Conversation', section: 'opinion', kind: 'Analysis', url: 'https://theconversation.com/global/articles.atom', maxBytes: 160000 },

  // ---- Sport & Culture
  { id: 'bbc-sport', outlet: 'BBC Sport', section: 'sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml' },
  { id: 'guardian-sport', outlet: 'The Guardian', section: 'sport', url: 'https://www.theguardian.com/uk/sport/rss', maxBytes: 80000 },
  { id: 'guardian-culture', outlet: 'The Guardian', section: 'culture', url: 'https://www.theguardian.com/culture/rss', maxBytes: 80000 },
  { id: 'bbc-arts', outlet: 'BBC News', section: 'culture', url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml' }
];

/* The feeds are handled in parts of this many, each part its own small, cached request. */
export const PART_SIZE = 7;
export const PARTS = Math.ceil(FEEDS.length / PART_SIZE);

export const SECTIONS = ['world', 'india', 'business', 'science', 'tech', 'health', 'climate', 'opinion', 'sport', 'culture'];

/* How long a story stays news, in hours. */
export const WINDOW_HOURS = { default: 24, opinion: 36, culture: 36, climate: 36 };

export const MARKETS_URL = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,GBP,INR,JPY';
export const ON_THIS_DAY_URL = (m, d) => `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected/${m}/${d}`;
