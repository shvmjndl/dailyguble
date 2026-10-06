/*
 * Which region a story is about, from the first place it names.
 * Regions: americas, europe, mea (Middle East & Africa), asia (Asia-Pacific), india.
 * Countries, their people ("Ukrainian"), capitals and big cities, and a few
 * institutions that always mean one region ("Kremlin", "Pentagon").
 */
const R = {
  americas: `United States|U\\.S\\.|US|USA|America|American|Americans|Washington|White House|Pentagon|Congress|Senate|Capitol Hill|Trump|Biden|New York|California|Texas|Florida|Chicago|Los Angeles|Canada|Canadian|Ottawa|Toronto|Mexico|Mexican|Mexico City|Brazil|Brazilian|Brasilia|Lula|Argentina|Argentine|Argentinian|Buenos Aires|Milei|Chile|Chilean|Santiago|Colombia|Colombian|Bogota|Peru|Peruvian|Lima|Venezuela|Venezuelan|Caracas|Maduro|Ecuador|Ecuadorian|Bolivia|Bolivian|Paraguay|Uruguay|Cuba|Cuban|Havana|Haiti|Haitian|Dominican Republic|Jamaica|Jamaican|Puerto Rico|Guatemala|Honduras|El Salvador|Nicaragua|Costa Rica|Panama|Caribbean|Latin America`,
  europe: `Europe|European|EU|European Union|Brussels|UK|Britain|British|England|English|Scotland|Scottish|Wales|Welsh|Northern Ireland|London|Downing Street|Starmer|Westminster|Ireland|Irish|Dublin|France|French|Paris|Macron|Elysee|Germany|German|Berlin|Merz|Bundestag|Italy|Italian|Rome|Meloni|Vatican|Pope|Spain|Spanish|Madrid|Barcelona|Portugal|Portuguese|Lisbon|Netherlands|Dutch|Amsterdam|Belgium|Belgian|Switzerland|Swiss|Geneva|Austria|Austrian|Vienna|Poland|Polish|Warsaw|Czech|Prague|Slovakia|Hungary|Hungarian|Budapest|Orban|Romania|Romanian|Bulgaria|Bulgarian|Greece|Greek|Athens|Cyprus|Croatia|Serbia|Serbian|Belgrade|Bosnia|Kosovo|Albania|Montenegro|North Macedonia|Slovenia|Sweden|Swedish|Stockholm|Norway|Norwegian|Oslo|Denmark|Danish|Copenhagen|Greenland|Finland|Finnish|Helsinki|Iceland|Estonia|Latvia|Lithuania|Baltic|Ukraine|Ukrainian|Kyiv|Kiev|Zelensky|Russia|Russian|Moscow|Kremlin|Putin|Belarus|Belarusian|Minsk|Moldova|Georgia|Georgian|Tbilisi|Armenia|Armenian|Azerbaijan|NATO|Nato`,
  mea: `Middle East|Israel|Israeli|Israelis|Jerusalem|Tel Aviv|Netanyahu|Gaza|Gazan|Hamas|West Bank|Palestinian|Palestinians|Palestine|Lebanon|Lebanese|Beirut|Hezbollah|Syria|Syrian|Damascus|Iran|Iranian|Tehran|Iraq|Iraqi|Baghdad|Saudi|Saudi Arabia|Riyadh|Yemen|Yemeni|Houthi|Houthis|Jordan|Jordanian|Amman|Kuwait|Qatar|Qatari|Doha|Bahrain|UAE|Emirates|Emirati|Dubai|Abu Dhabi|Oman|Turkey|Turkish|Turkiye|Ankara|Istanbul|Erdogan|Egypt|Egyptian|Cairo|Libya|Libyan|Tunisia|Algeria|Morocco|Moroccan|Sudan|Sudanese|Khartoum|South Sudan|Ethiopia|Ethiopian|Addis Ababa|Eritrea|Somalia|Somali|Kenya|Kenyan|Nairobi|Uganda|Ugandan|Tanzania|Rwanda|Rwandan|Burundi|Congo|Congolese|DR Congo|DRC|Kinshasa|Nigeria|Nigerian|Lagos|Abuja|Ghana|Ghanaian|Senegal|Mali|Malian|Burkina Faso|Niger|Chad|Cameroon|Ivory Coast|Sierra Leone|Liberia|Guinea|Gabon|Angola|Mozambique|Zambia|Zimbabwe|Malawi|Namibia|Botswana|Madagascar|South Africa|South African|Johannesburg|Cape Town|Pretoria|Ramaphosa|Sahel|Africa|African`,
  india: `India|Indian|Indians|New Delhi|Delhi|Mumbai|Kolkata|Chennai|Bengaluru|Bangalore|Hyderabad|Gurugram|Gurgaon|Noida|Pune|Ahmedabad|Lucknow|Kerala|Tamil Nadu|Karnataka|Maharashtra|Punjab|Haryana|Bihar|Uttar Pradesh|West Bengal|Gujarat|Rajasthan|Assam|Manipur|Kashmir|Modi|BJP|Congress party|Lok Sabha|Rajya Sabha`,
  asia: `Asia|Asian|China|Chinese|Beijing|Shanghai|Hong Kong|Xi Jinping|Taiwan|Taiwanese|Taipei|Japan|Japanese|Tokyo|South Korea|North Korea|Korean|Seoul|Pyongyang|Kim Jong Un|Mongolia|Pakistan|Pakistani|Islamabad|Karachi|Lahore|Afghanistan|Afghan|Kabul|Taliban|Bangladesh|Bangladeshi|Dhaka|Sri Lanka|Sri Lankan|Colombo|Nepal|Nepali|Kathmandu|Bhutan|Maldives|Myanmar|Burma|Burmese|Thailand|Thai|Bangkok|Vietnam|Vietnamese|Hanoi|Cambodia|Laos|Malaysia|Malaysian|Kuala Lumpur|Singapore|Indonesia|Indonesian|Jakarta|Philippines|Philippine|Filipino|Manila|Brunei|Timor|Kazakhstan|Uzbekistan|Kyrgyzstan|Tajikistan|Turkmenistan|Australia|Australian|Sydney|Melbourne|Canberra|Albanese|New Zealand|Wellington|Auckland|Fiji|Papua New Guinea|Pacific`
};
/*
 * Lookup by words, not one giant pattern: the text is split into words once and each
 * position is checked for 3-, 2- and 1-word names in a Map. Hundreds of times faster than
 * a regular expression with hundreds of alternatives, which matters on a 10 ms budget.
 */
const LOOKUP = new Map();
export let MAXW = 1;
for (const [region, list] of Object.entries(R)) for (const raw of list.split('|')) {
  const name = raw.replace(/\\\./g, '').replace(/\./g, '');          // "U\.S\." is matched as "US"
  const key = name.toLowerCase();
  if (!LOOKUP.has(key)) LOOKUP.set(key, region);
  MAXW = Math.max(MAXW, key.split(' ').length);
}
/* Place names of two or more words ("tamil nadu", "saudi arabia"), so headlines can treat each as one word. */
export const MULTIWORD = new Set([...LOOKUP.keys()].filter((k) => k.includes(' ')).concat(['prime minister', 'supreme court', 'high court', 'central bank', 'united nations', 'red sea', 'black sea', 'strait of hormuz', 'gaza city']));
// Short all-caps names (US, UK, EU, UAE...) must be written in capitals so "us" the word never counts.
const CAPS = new Set(['us', 'usa', 'uk', 'eu', 'uae', 'drc', 'bjp', 'nato']);

export function regionOf(text) {
  const words = text.replace(/\b([A-Z])\.([A-Z])\.(?:([A-Z])\.)?/g, '$1$2$3').split(/[^\p{L}\p{N}]+/u);
  for (let i = 0; i < words.length; i++) {
    if (!words[i]) continue;
    for (let n = Math.min(MAXW, words.length - i); n >= 1; n--) {
      const found = n === 1 ? words[i] : words.slice(i, i + n).join(' ');
      const key = found.toLowerCase();
      const region = LOOKUP.get(key);
      if (!region) continue;
      if (CAPS.has(key) && found !== found.toUpperCase()) continue;
      if (key === 'georgia' || key === 'georgian') { if (/\b(?:Atlanta|Savannah|governor of Georgia)\b/i.test(text)) return 'americas'; }
      if (key === 'congress' && /\bCongress (?:leader|president|MP|MPs|MLA|MLAs|chief|workers)\b/.test(text)) return 'india';
      return region;
    }
  }
  return null;
}
