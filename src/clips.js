/* =========================================================
   MARKING PAGES — a reader marks the pages they like, the way they'd mark
   a real paper: a dog-ear by default, or a paper clip, a coffee ring, a
   pencil tick, a ribbon or a push pin (their choice, kept for good).
   A marked page means "I like this news": it moves up to just after the
   front page, and the front page leans its way. The mark stays (in this
   browser) until the reader taps it off. Any number of pages can be marked.
   ========================================================= */
var MARKS = [
  ['dogear', 'Dog-ear', 'The corner folded down'],
  ['clip', 'Paper clip', 'Clipped at the top'],
  ['coffee', 'Coffee ring', 'Where your cup stood'],
  ['tick', 'Pencil tick', 'Ticked in red pencil'],
  ['ribbon', 'Ribbon', 'A ribbon marker'],
  ['pin', 'Push pin', 'Pinned to the board']
];
var MARK_ART = {
  dogear: '<span class="fold" aria-hidden="true"></span>',
  clip: '<svg viewBox="-3 -2 30 70" aria-hidden="true" focusable="false"><defs><linearGradient id="clipMetal" x1="0" x2="1">' +
    '<stop offset="0" stop-color="#8d939a"/><stop offset=".45" stop-color="#eef1f4"/><stop offset=".7" stop-color="#b9bfc6"/><stop offset="1" stop-color="#6f757c"/></linearGradient></defs>' +
    '<path d="M16 20 V50 a5 5 0 0 1 -10 0 V9 a7.5 7.5 0 0 1 15 0 V54 a10.5 10.5 0 0 1 -21 0 V17" fill="none" stroke="url(#clipMetal)" stroke-width="2.6" stroke-linecap="round"/></svg>',
  coffee: '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-linecap="round">' +
    '<path d="M50 11 C73 11 89 28 89 50 C89 73 72 89 50 89 C27 89 11 72 11 50 C11 29 27 12 49 11" stroke-width="5.5" stroke-opacity=".32"/>' +
    '<path d="M50 14 C71 14 86 30 86 50 C86 71 70 86 50 86 C29 86 14 70 14 50" stroke-width="1.6" stroke-opacity=".55"/>' +
    '<path d="M18 36 C25 22 38 15 52 14" stroke-width="3" stroke-opacity=".45"/><circle cx="91" cy="63" r="2.2" fill="currentColor" fill-opacity=".3" stroke="none"/>' +
    '<circle cx="8" cy="40" r="1.4" fill="currentColor" fill-opacity=".28" stroke="none"/></g></svg>',
  tick: '<svg viewBox="0 0 50 50" aria-hidden="true" focusable="false"><path d="M7 27 C11 30 15 35 19 41 C25 28 33 17 45 6" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M9 29 C13 32 16 36 19.5 39.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-opacity=".5" stroke-linecap="round"/></svg>',
  ribbon: '<span class="band" aria-hidden="true"></span>',
  pin: '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><defs><radialGradient id="pinHead" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ff8a7a"/><stop offset=".45" stop-color="#c8281c"/><stop offset="1" stop-color="#6e0f08"/></radialGradient></defs>' +
    '<ellipse cx="23" cy="26" rx="9" ry="4" fill="#000" fill-opacity=".25"/><circle cx="19" cy="17" r="10" fill="url(#pinHead)"/><circle cx="15.5" cy="13" r="2.6" fill="#fff" fill-opacity=".55"/></svg>'
};
function markStyle(){ var m = store('mark-style'); return MARK_ART[m] ? m : 'dogear'; }
function markName(style){ for (var i = 0; i < MARKS.length; i++) if (MARKS[i][0] === (style || markStyle())) return MARKS[i][1].toLowerCase(); return 'mark'; }

/* Which page this is, in a way that survives the hourly news: the kind of page, or its section name. */
function pageClipKey(page, i){ return page.news ? 'news:' + page.news : 'page:' + (plain((page.runhead || {}).center) || (page.plate ? 'front' : String(i))); }
function clippedPages(){ return store('page-clips') || []; }
function isPageClipped(key){ return clippedPages().indexOf(key) >= 0; }
function setPageClip(key, on){
  var list = clippedPages().filter(function(k){ return k !== key; });
  if (on) list.push(key);
  store('page-clips', list.length ? list : null);
}
/* Draw a page's mark (or the faint hint of where it goes) in the reader's chosen style. */
function drawMark(b){
  var on = isPageClipped(b.dataset.clip), style = markStyle();
  b.className = 'page-clip mark-' + style + (on ? ' on' : '');
  b.innerHTML = MARK_ART[style];
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  b.setAttribute('aria-label', on ? 'Take the ' + markName(style) + ' off this page' : 'Mark this page with a ' + markName(style));
}
function decoratePageClip(sheet, page, i){
  if (!hooks.clips) return;
  var b = el('button'); b.type = 'button'; b.dataset.clip = pageClipKey(page, i);
  drawMark(b);
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
  toast(on ? (name && page.news !== 'front' ? 'Marked. ' + name + ' now comes right after the front page, and leads more often.' : 'Page marked. It stays until you take it off.')
           : 'Mark taken off.');
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
   reader is (the sun times come from almanac.js). The Paper menu offers
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
  b.querySelector('.long').textContent = (NIGHT.on ? '☾ ' : '☀ ') + 'Paper';
  b.querySelector('.short').textContent = NIGHT.on ? '☾' : '☀';
  b.setAttribute('aria-label', 'Paper settings: ' + word + ' look, pages marked with a ' + markName() + '.');
}
/* Re-check (after the sun times arrive, and every minute). */
function updateNight(){
  if (!hooks.night) return;
  if (nightNow() !== NIGHT.on) applyTheme(hooks.issue ? hooks.issue() : ISSUE);
  nightLabel();
}
/* The Paper menu (the ☾/☀ button): the look (Auto, Dark, Day) and how pages are marked. Both are remembered. */
function setLook(mode){
  NIGHT.mode = mode;
  store('night', mode === 'auto' ? null : mode);
  applyTheme(hooks.issue ? hooks.issue() : ISSUE);
  nightLabel();
}
function setMarkStyle(style){
  store('mark-style', style === 'dogear' ? null : style);
  document.querySelectorAll('.page-clip').forEach(drawMark);
}
function paperMenu(open){
  var m = document.getElementById('paperMenu'), btn = document.getElementById('nightBtn');
  if (open === undefined) open = m.hidden;
  if (!open) { m.hidden = true; btn.setAttribute('aria-expanded', 'false'); return; }
  m.innerHTML = '';
  m.appendChild(txt('h6', 'pm-head', 'Look'));
  var looks = el('div', 'pm-looks');
  [['auto', 'Auto', 'Dark after sunset'], ['on', 'Dark', 'Always'], ['off', 'Day', 'Always']].forEach(function(o){
    var b = el('button', 'pm-opt'); b.type = 'button';
    b.appendChild(txt('b', null, o[1])); b.appendChild(txt('span', null, o[2]));
    b.setAttribute('aria-pressed', NIGHT.mode === o[0] ? 'true' : 'false');
    b.addEventListener('click', function(){ setLook(o[0]); paperMenu(true); });
    looks.appendChild(b);
  });
  m.appendChild(looks);
  m.appendChild(txt('h6', 'pm-head', 'Mark pages you like with'));
  var marks = el('div', 'pm-marks'), cur = markStyle();
  MARKS.forEach(function(k){
    var b = el('button', 'pm-mark'); b.type = 'button';
    var tile = el('span', 'pm-tile'), art = el('span', 'page-clip mark-' + k[0] + ' on'); art.innerHTML = MARK_ART[k[0]];
    tile.appendChild(art); b.appendChild(tile); b.appendChild(txt('b', null, k[1]));
    b.setAttribute('aria-pressed', cur === k[0] ? 'true' : 'false'); b.title = k[2];
    b.addEventListener('click', function(){ setMarkStyle(k[0]); paperMenu(true); toast('Pages you like are now marked with a ' + k[1].toLowerCase() + '.'); });
    marks.appendChild(b);
  });
  m.appendChild(marks);
  m.appendChild(txt('p', 'pm-note', 'Tap the top-right corner of a page to mark it. Marked pages come right after the front page.'));
  m.hidden = false; btn.setAttribute('aria-expanded', 'true');
}
function wireNight(){
  hooks.night = true;
  var grp = el('div', 'grp');
  grp.innerHTML = '<button class="ctl" id="nightBtn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="paperMenu"><span class="long"></span><span class="short"></span></button>';
  var bar = document.querySelector('.bar'), fold = document.getElementById('foldBtn').parentNode;
  bar.insertBefore(grp, fold.nextSibling);
  var menu = el('div', 'paper-menu'); menu.id = 'paperMenu'; menu.hidden = true; menu.setAttribute('role', 'dialog'); menu.setAttribute('aria-label', 'Paper settings');
  document.body.appendChild(menu);
  document.getElementById('nightBtn').addEventListener('click', function(e){ e.stopPropagation(); paperMenu(); });
  document.addEventListener('pointerdown', function(e){ if (!menu.hidden && !menu.contains(e.target) && !e.target.closest('#nightBtn')) paperMenu(false); }, true);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !menu.hidden) { paperMenu(false); document.getElementById('nightBtn').focus(); } });
  nightLabel();
}
