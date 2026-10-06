/* =========================================================
   PAPER CLIPS — a reader clips a page to mark it, the way you'd clip a
   page of a real paper. The clip sits on the page's top-right corner and
   stays (in this browser) until the reader takes it off. Any number of
   pages can be clipped. Tap the corner to clip; tap the clip to remove it.
   ========================================================= */
var CLIP_SVG = '<svg viewBox="-3 -2 30 70" aria-hidden="true" focusable="false"><defs><linearGradient id="clipMetal" x1="0" x2="1">' +
  '<stop offset="0" stop-color="#8d939a"/><stop offset=".45" stop-color="#eef1f4"/><stop offset=".7" stop-color="#b9bfc6"/><stop offset="1" stop-color="#6f757c"/></linearGradient></defs>' +
  '<path d="M16 20 V50 a5 5 0 0 1 -10 0 V9 a7.5 7.5 0 0 1 15 0 V54 a10.5 10.5 0 0 1 -21 0 V17" fill="none" stroke="url(#clipMetal)" stroke-width="2.6" stroke-linecap="round"/></svg>';
/* Which page this is, in a way that survives the hourly news: the kind of page, or its section name. */
function pageClipKey(page, i){ return page.news ? 'news:' + page.news : 'page:' + (plain((page.runhead || {}).center) || (page.plate ? 'front' : String(i))); }
function clippedPages(){ return store('page-clips') || []; }
function isPageClipped(key){ return clippedPages().indexOf(key) >= 0; }
function setPageClip(key, on){
  var list = clippedPages().filter(function(k){ return k !== key; });
  if (on) list.push(key);
  store('page-clips', list.length ? list : null);
}
/* Put the clip (or the faint outline where it goes) on a freshly drawn page. */
function decoratePageClip(sheet, page, i){
  if (!hooks.clips) return;
  var key = pageClipKey(page, i), b = el('button', 'page-clip' + (isPageClipped(key) ? ' on' : ''), CLIP_SVG);
  b.type = 'button'; b.dataset.clip = key;
  b.setAttribute('aria-pressed', isPageClipped(key) ? 'true' : 'false');
  b.setAttribute('aria-label', isPageClipped(key) ? 'Take the clip off this page' : 'Clip this page');
  sheet.querySelector('.face').appendChild(b);
}
function togglePageClip(btn){
  var key = btn.dataset.clip, on = !isPageClipped(key), page = (NEWS.pages || [])[idx];
  setPageClip(key, on);
  // redraw in the new order, staying on this same page
  var order = clipOrder(((hooks.issue ? hooks.issue() : ISSUE).pages) || []);
  if (page && order.indexOf(page) >= 0) idx = order.indexOf(page);
  if (hooks.rerender) hooks.rerender();
  var name = page && page.news ? newsKindName(page.news) : '';
  toast(on ? (name && page.news !== 'front' ? 'Clipped. ' + name + ' now comes right after the front page, and leads more often.' : 'Page clipped. The clip stays until you take it off.')
           : 'Clip taken off.');
}
function wireClips(){ hooks.clips = true; }

/*
 * A clip is a preference: the reader likes that page's news. Clipped pages move up to
 * just after the front page (in the order they were clipped), and the front page gives
 * their sections' stories a lift.
 */
var CLIP_SECTIONS = { world: ['world'], india: ['india'], business: ['business'], science: ['science', 'tech', 'health', 'climate'], opinion: ['opinion'], sport: ['sport', 'culture'] };
function clipOrder(pages){
  var clipped = clippedPages();
  if (!hooks.clips || !clipped.length || pages.length < 3) return pages;
  var rest = pages.slice(1), picked = [];
  clipped.forEach(function(k){ rest.forEach(function(p, i){ if (picked.indexOf(p) < 0 && pageClipKey(p, i + 1) === k) picked.push(p); }); });
  return pages.slice(0, 1).concat(picked, rest.filter(function(p){ return picked.indexOf(p) < 0; }));
}
function preferredSections(){
  var out = {};
  if (!hooks.clips) return out;
  clippedPages().forEach(function(k){ var m = k.match(/^news:(\w+)$/); if (m && CLIP_SECTIONS[m[1]]) CLIP_SECTIONS[m[1]].forEach(function(s){ out[s] = 1; }); });
  return out;
}
function toast(text){
  var t = document.getElementById('toast');
  clearTimeout(toast.timer);
  t.textContent = text; t.hidden = false;
  requestAnimationFrame(function(){ t.classList.add('show'); });
  toast.timer = setTimeout(function(){ t.classList.remove('show'); setTimeout(function(){ t.hidden = true; }, 400); }, 3200);
}

/* =========================================================
   NIGHT EDITION — dark newsprint from sunset to sunrise, where the
   reader is (the sun times come from almanac.js). A button cycles through
   Auto (dark after sunset), Dark and Day.
   ========================================================= */
var NIGHT = { mode: store('night') || 'auto', on: false };
var NIGHT_COLORS = { paper: '#22201b', paperLit: '#2b2822', ink: '#e8dfca', inkSoft: '#ab9f88', rule: '#4b4438', accent: '#e58a6f',
  cell: '#2d2a23', sel: '#7c5d1f', hl: '#344652', hlSoft: '#2c3236', pen: '#9fc4ff' };
function nightNow(){
  if (NIGHT.mode === 'on') return true;
  if (NIGHT.mode === 'off') return false;
  var A = ALMANAC || {}, now = Date.now();
  if (A.sunrise && A.sunset) return now < Date.parse(A.sunrise) || now >= Date.parse(A.sunset);
  var h = new Date().getHours();
  return h >= 19 || h < 6;
}
/* Called by applyTheme: night colours over the edition's own. */
function nightColors(colors){
  NIGHT.on = !!hooks.night && nightNow();
  document.documentElement.classList.toggle('night', NIGHT.on);
  return NIGHT.on ? Object.assign({}, colors, NIGHT_COLORS) : colors;
}
function nightLabel(){
  var b = document.getElementById('nightBtn');
  if (!b) return;
  var word = NIGHT.mode === 'auto' ? 'Auto' : NIGHT.mode === 'on' ? 'Dark' : 'Day';
  b.querySelector('.long').textContent = (NIGHT.on ? '☾ ' : '☀ ') + word;
  b.querySelector('.short').textContent = (NIGHT.mode === 'auto' ? 'A' : '') + (NIGHT.on ? '☾' : '☀');
  b.setAttribute('aria-label', 'Paper: ' + (NIGHT.mode === 'auto' ? 'automatic, dark after sunset' : NIGHT.mode === 'on' ? 'always dark' : 'always day') + '. Tap to change.');
  b.setAttribute('aria-pressed', NIGHT.on ? 'true' : 'false');
}
/* Re-check (after the sun times arrive, and every minute). */
function updateNight(){
  if (!hooks.night) return;
  if (nightNow() !== NIGHT.on) applyTheme(hooks.issue ? hooks.issue() : ISSUE);
  nightLabel();
}
function wireNight(){
  hooks.night = true;
  var grp = el('div', 'grp');
  grp.innerHTML = '<button class="ctl" id="nightBtn" type="button"><span class="long"></span><span class="short"></span></button>';
  var bar = document.querySelector('.bar'), fold = document.getElementById('foldBtn').parentNode;
  bar.insertBefore(grp, fold.nextSibling);
  document.getElementById('nightBtn').addEventListener('click', function(){
    NIGHT.mode = { auto: 'on', on: 'off', off: 'auto' }[NIGHT.mode] || 'auto';      // Auto → Dark → Day → Auto
    store('night', NIGHT.mode === 'auto' ? null : NIGHT.mode);
    applyTheme(hooks.issue ? hooks.issue() : ISSUE);
    nightLabel();
    toast(NIGHT.mode === 'auto' ? 'Auto: the paper turns dark at sunset where you are, and light at sunrise.' : NIGHT.mode === 'on' ? 'Dark paper, always.' : 'Day paper, always.');
  });
  nightLabel();
}
