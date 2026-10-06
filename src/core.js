/* The Daily Guble: shared renderer, games and reading controls.
   The server wraps this file together with reader.js (for readers) or
   editor.js (for signed-in editors) into one bundle. */


/* =========================================================
   BASICS
   ========================================================= */
var COARSE = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
var ISSUE = (function(){
  try { return JSON.parse(document.getElementById('issue-data').textContent); }
  catch (e) { return { masthead: { name: 'The Daily Guble' }, pages: [] }; }
})();
/* Filled in by loadAlmanac() (src/almanac.js), in the reader's own browser. */
var ALMANAC = null;
/* Hooks the reader and editor bundles plug into. */
var hooks = { onPage: null, labels: {}, rerender: null, issue: null };

function el(tag, cls, html){
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}
function txt(tag, cls, text){ var n = el(tag, cls); n.textContent = text; return n; }
function plain(html){ var d = document.createElement('div'); d.innerHTML = html == null ? '' : String(html); return (d.textContent || '').replace(/\s+/g, ' ').trim(); }
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function hash(s){ var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
function store(key, val){
  try {
    if (val === undefined) { var raw = localStorage.getItem('guble:' + key); return raw ? JSON.parse(raw) : null; }
    if (val === null) { localStorage.removeItem('guble:' + key); return null; }
    localStorage.setItem('guble:' + key, JSON.stringify(val));
  } catch (e) { return null; }
}
function mulberry(seed){
  var a = seed | 0;
  return function(){
    a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rnd){ for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }

/* =========================================================
   THEME — presets, colours and typefaces
   ========================================================= */
var loadedFonts = {};
(function(){
  var l = document.querySelector('link[data-fonts]');
  if (l) l.getAttribute('data-fonts').split('|').forEach(function(f){ if (f) loadedFonts[f] = 1; });
})();
function loadFont(family){
  if (!family || loadedFonts[family]) return;
  loadedFonts[family] = 1;
  var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = fontsHref([family]);
  l.onerror = function(){
    var l2 = document.createElement('link'); l2.rel = 'stylesheet';
    l2.href = 'https://fonts.googleapis.com/css2?family=' + family.replace(/ /g, '+') + '&display=swap';
    document.head.appendChild(l2);
  };
  document.head.appendChild(l);
}
function applyTheme(issue){
  var t = themeOf(issue), rs = document.documentElement.style, colors = nightColors(t.colors);
  Object.keys(COLOR_VAR).forEach(function(k){ rs.setProperty(COLOR_VAR[k], colors[k]); });
  FONT_ROLES.forEach(function(r){ loadFont(t.fonts[r[0]]); rs.setProperty('--f-' + r[0], '"' + t.fonts[r[0]] + '",' + FALLBACK[r[0]]); });
}

/* =========================================================
   ART — drawings a photo or cartoon can use instead of an upload
   ========================================================= */
var ART_LABELS = { lighthouse:'Drawing: lighthouse at dusk', dollar:'Drawing: dollar-a-year cartoon' };

var ART = {
  lighthouse: function(g, W, H){
    var sky = g.createLinearGradient(0,0,0,H*0.62);
    sky.addColorStop(0,'#575449'); sky.addColorStop(0.55,'#9b968a'); sky.addColorStop(1,'#cfcabb');
    g.fillStyle = sky; g.fillRect(0,0,W,H*0.64);
    g.globalAlpha = 0.18; g.fillStyle = '#3f3c34';
    for (var i=0;i<7;i++){ g.beginPath(); g.ellipse(W*(0.1+0.16*i), 20+i*22, 190-i*12, 6+(i%3)*5, 0, 0, Math.PI*2); g.fill(); }
    g.globalAlpha = 1;
    var sea = g.createLinearGradient(0,H*0.62,0,H);
    sea.addColorStop(0,'#8e897c'); sea.addColorStop(1,'#4a473f');
    g.fillStyle = sea; g.fillRect(0,H*0.62,W,H*0.38);
    g.strokeStyle = 'rgba(232,228,214,.35)'; g.lineWidth = 1;
    for (var s=0;s<26;s++){
      var yy = H*0.63 + s*5.2, xo = (s%2)*23;
      g.beginPath(); g.moveTo(xo,yy); g.lineTo(xo+W*0.42,yy+1); g.stroke();
      g.beginPath(); g.moveTo(xo+W*0.52,yy); g.lineTo(W,yy+1); g.stroke();
    }
    var refl = g.createLinearGradient(0,H*0.62,0,H);
    refl.addColorStop(0,'rgba(245,240,224,.55)'); refl.addColorStop(1,'rgba(245,240,224,0)');
    g.fillStyle = refl;
    g.beginPath(); g.moveTo(W*0.70,H*0.62); g.lineTo(W*0.78,H*0.62); g.lineTo(W*0.90,H); g.lineTo(W*0.58,H); g.closePath(); g.fill();
    g.fillStyle = '#35322b';
    g.beginPath(); g.moveTo(0,H); g.lineTo(0,H*0.80);
    for (var r=0;r<9;r++){ g.lineTo(r*26, H*0.80 + ((r%3)-1)*7); g.lineTo(r*26+13, H*0.86 + (r%2)*6); }
    g.lineTo(240,H); g.closePath(); g.fill();
    g.fillStyle = '#2b2823';
    g.beginPath(); g.moveTo(W*0.58,H*0.70); g.quadraticCurveTo(W*0.74,H*0.60,W*0.95,H*0.66); g.lineTo(W,H*0.66); g.lineTo(W,H); g.lineTo(W*0.54,H); g.closePath(); g.fill();
    var bx = W*0.745, baseY = H*0.635, topY = H*0.195;
    g.fillStyle = '#23201b';
    g.beginPath(); g.moveTo(bx-26,baseY); g.lineTo(bx-13,topY); g.lineTo(bx+13,topY); g.lineTo(bx+26,baseY); g.closePath(); g.fill();
    g.fillStyle = '#d8d3c2';
    g.beginPath(); g.moveTo(bx-21,baseY-85); g.lineTo(bx-17.5,baseY-150); g.lineTo(bx+17.5,baseY-150); g.lineTo(bx+21,baseY-85); g.closePath(); g.fill();
    g.fillStyle = '#23201b';
    g.fillRect(bx-17,topY-16,34,17); g.fillRect(bx-20,topY-20,40,5);
    g.beginPath(); g.moveTo(bx-13,topY-20); g.lineTo(bx,topY-34); g.lineTo(bx+13,topY-20); g.closePath(); g.fill();
    g.fillStyle = '#f6f2e2'; g.fillRect(bx-9,topY-13,18,11);
    g.fillStyle = '#2b2823'; g.fillRect(bx+34,baseY-44,62,44);
    g.beginPath(); g.moveTo(bx+30,baseY-44); g.lineTo(bx+65,baseY-62); g.lineTo(bx+100,baseY-44); g.closePath(); g.fill();
    g.fillStyle = '#e9e3cf'; g.fillRect(bx+48,baseY-30,11,11); g.fillRect(bx+70,baseY-30,11,11);
    var beam = g.createLinearGradient(bx,topY-8,0,topY+60);
    beam.addColorStop(0,'rgba(252,248,232,.75)'); beam.addColorStop(1,'rgba(252,248,232,0)');
    g.fillStyle = beam;
    g.beginPath(); g.moveTo(bx-6,topY-9); g.lineTo(-20,topY+10); g.lineTo(-20,topY+92); g.closePath(); g.fill();
    var vg = g.createRadialGradient(W/2,H/2,H*0.35,W/2,H/2,H*0.85);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(20,18,12,.45)');
    g.fillStyle = vg; g.fillRect(0,0,W,H);
  },

  dollar: function(g, W, H){
    g.fillStyle = '#ded7c4'; g.fillRect(0,0,W,H);
    g.strokeStyle = '#17150f'; g.lineJoin = 'round'; g.lineCap = 'round';
    g.save(); g.globalAlpha = .3; g.lineWidth = 1;
    for (var i=-H;i<W;i+=9){ g.beginPath(); g.moveTo(i,0); g.lineTo(i+H*0.7,H*0.7); g.stroke(); }
    g.restore();
    g.lineWidth = 2.4; g.beginPath(); g.moveTo(0,H*0.80); g.bezierCurveTo(W*0.3,H*0.76,W*0.7,H*0.84,W,H*0.79); g.stroke();
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(W*0.60,H*0.80); g.lineTo(W*0.655,H*0.26); g.lineTo(W*0.775,H*0.26); g.lineTo(W*0.84,H*0.80); g.stroke();
    g.beginPath(); g.moveTo(W*0.645,H*0.235); g.lineTo(W*0.785,H*0.235); g.stroke();
    g.strokeRect(W*0.665,H*0.145,W*0.10,H*0.09);
    g.beginPath(); g.moveTo(W*0.655,H*0.145); g.lineTo(W*0.715,H*0.085); g.lineTo(W*0.775,H*0.145); g.stroke();
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(W*0.62,H*0.52); g.lineTo(W*0.82,H*0.52); g.stroke();
    g.beginPath(); g.moveTo(W*0.61,H*0.62); g.lineTo(W*0.83,H*0.62); g.stroke();
    g.lineWidth = 1.6;
    for (var b=0;b<3;b++){ g.beginPath(); g.moveTo(W*0.655,H*0.19); g.lineTo(W*0.42-b*30,H*0.10+b*0.055*H); g.stroke(); }
    g.lineWidth = 2.6;
    var mx = W*0.22, my = H*0.80;
    g.beginPath(); g.arc(mx,my-H*0.30,18,0,Math.PI*2); g.stroke();
    g.beginPath(); g.moveTo(mx-24,my-H*0.335); g.lineTo(mx+24,my-H*0.335); g.stroke();
    g.strokeRect(mx-14,my-H*0.41,28,22);
    g.beginPath(); g.moveTo(mx,my-H*0.245); g.lineTo(mx,my-H*0.09); g.stroke();
    g.beginPath(); g.moveTo(mx,my-H*0.09); g.lineTo(mx-16,my); g.stroke();
    g.beginPath(); g.moveTo(mx,my-H*0.09); g.lineTo(mx+16,my); g.stroke();
    g.beginPath(); g.moveTo(mx,my-H*0.20); g.lineTo(mx-22,my-H*0.13); g.stroke();
    g.beginPath(); g.moveTo(mx,my-H*0.20); g.lineTo(mx+52,my-H*0.235); g.stroke();
    g.lineWidth = 2; g.strokeRect(mx+52,my-H*0.265,30,16); g.fillStyle = '#f2ecd9'; g.fillRect(mx+53,my-H*0.264,28,14);
    g.fillStyle = '#17150f'; g.font = 'italic 12px serif'; g.fillText('$1',mx+61,my-H*0.238);
    g.lineWidth = 2.2; var cx = W*0.44, cy = H*0.80;
    g.beginPath(); g.moveTo(cx,cy); g.lineTo(cx,cy-16); g.lineTo(cx+22,cy-16); g.lineTo(cx+22,cy); g.stroke();
    g.beginPath(); g.arc(cx+28,cy-22,8,0,Math.PI*2); g.stroke();
    g.beginPath(); g.moveTo(cx+22,cy-27); g.lineTo(cx+25,cy-34); g.lineTo(cx+29,cy-28); g.stroke();
    g.beginPath(); g.moveTo(cx,cy-14); g.quadraticCurveTo(cx-16,cy-30,cx-6,cy-40); g.stroke();
  }
};



function paintArt(name, w, h, label){
  var c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.setAttribute('role', 'img');
  if (label) c.setAttribute('aria-label', label);
  if (ART[name]) ART[name](c.getContext('2d'), w, h);
  return c;
}
function picture(b, w, h){
  if (b.src) { var img = new Image(); img.decoding = 'async'; img.src = b.src; img.alt = plain(b.alt || b.caption || ''); img.draggable = false; return img; }
  return paintArt(b.art || 'lighthouse', w, h, plain(b.alt || b.caption || ''));
}

/* =========================================================
   LIVE VALUES: {{date}}, {{sunrise}}, {{highWater}} and friends.
   Typed anywhere in the paper's text, they are filled in on every
   render from the clock and the server's almanac (sun, moon, NOAA tides).
   ========================================================= */
var LIVE_TOKENS = [
  ['date', 'Today’s date in full'], ['weekday', 'Day of the week'], ['shortDate', 'Month and day'],
  ['month', 'Month'], ['day', 'Day of the month'], ['year', 'Year'],
  ['yesterday', 'Yesterday’s weekday'], ['tomorrow', 'Tomorrow’s weekday'], ['dayAfter', 'The day after tomorrow'],
  ['sunrise', 'Sunrise'], ['sunset', 'Sunset'], ['daylight', 'Hours of daylight'],
  ['highWater', 'Next high tide'], ['lowWater', 'Next low tide'], ['moon', 'Moon phase'], ['moonLit', 'Moon, percent lit'],
  ['temp', 'Temperature now'], ['conditions', 'Sky right now'], ['forecast', 'Short forecast'],
  ['high', 'Today’s high'], ['low', 'Tonight’s low'], ['tonight', 'Tonight'],
  ['tomorrowWeather', 'Tomorrow’s weather'], ['dayAfterWeather', 'The day after'], ['weatherPlace', 'Where the weather is for'],
  ['updated', 'When the news was last updated'], ['sudokuLevel', 'How hard today’s sudoku is']
];
var TOKEN_RE = /\{\{\s*(\w+)\s*\}\}/g;
function liveTZ(){ return (ALMANAC && ALMANAC.timeZone) || 'America/New_York'; }
function todayParts(){
  var p = new Intl.DateTimeFormat('en-US', { timeZone: liveTZ(), year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date());
  function g(t){ return +p.filter(function(x){ return x.type === t; })[0].value; }
  return { y: g('year'), m: g('month'), d: g('day') };
}
function ymdKey(t){ return t.y + '-' + (t.m < 10 ? '0' : '') + t.m + '-' + (t.d < 10 ? '0' : '') + t.d; }
function localKey(iso){ return new Date(iso).toLocaleDateString('en-CA', { timeZone: liveTZ() }); }
function clock(iso){
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: liveTZ(), hour: 'numeric', minute: '2-digit' })
    .replace(/[\s ]*AM$/i, ' a.m.').replace(/[\s ]*PM$/i, ' p.m.');
}
function tideTZ(){ return (ALMANAC && ALMANAC.tideTimeZone) || liveTZ(); }
function tideKey(iso){ return new Date(iso).toLocaleDateString('en-CA', { timeZone: tideTZ() }); }
function tideToday(){ return new Date().toLocaleDateString('en-CA', { timeZone: tideTZ() }); }
function tideClock(iso, withZone){
  if (!iso) return '—';
  var o = { timeZone: tideTZ(), hour: 'numeric', minute: '2-digit' };
  if (withZone && tideTZ() !== liveTZ()) o.timeZoneName = 'short';
  return new Date(iso).toLocaleTimeString('en-US', o).replace(/[\s\u202f]*AM/i, ' a.m.').replace(/[\s\u202f]*PM/i, ' p.m.');
}
function dayName(t, offset){ return new Date(Date.UTC(t.y, t.m - 1, t.d + offset, 12)).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long' }); }
function liveValues(){
  var t = todayParts(), noon = new Date(Date.UTC(t.y, t.m - 1, t.d, 12)), A = ALMANAC || {}, now = Date.now(), today = ymdKey(t);
  function next(type){
    var x = (A.tides || []).filter(function(e){ return e.type === type && Date.parse(e.time) > now; })[0];
    return x ? tideClock(x.time, true) + (tideKey(x.time) === tideToday() ? '' : ' tomorrow') : '—';
  }
  var mins = A.sunrise && A.sunset ? Math.round((Date.parse(A.sunset) - Date.parse(A.sunrise)) / 60000) : null;
  var month = noon.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long' });
  return {
    date: noon.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    weekday: dayName(t, 0), shortDate: month + ' ' + t.d, month: month, day: String(t.d), year: String(t.y),
    yesterday: dayName(t, -1), tomorrow: dayName(t, 1), dayAfter: dayName(t, 2),
    sunrise: clock(A.sunrise), sunset: clock(A.sunset),
    daylight: mins == null ? '—' : Math.floor(mins / 60) + ' hr ' + (mins % 60) + ' min',
    highWater: next('high'), lowWater: next('low'),
    moon: A.moon ? A.moon.phase : '—', moonLit: A.moon ? A.moon.illumination + '%' : '—',
    weatherPlace: A.placeName || '—',
    updated: newsUpdatedText(),
    sudokuLevel: dailySudoku().level,
    temp: wx(function(W){ return W.current.temp + '°'; }),
    conditions: wx(function(W){ return W.current.text; }),
    forecast: wx(function(W){ return W.forecast; }),
    high: wx(function(W){ var d = dayWx(W, 0); return d.high == null ? '—' : d.high + '°'; }),
    low: wx(function(W){ return W.tonight ? W.tonight.temp + '°' : '—'; }),
    tonight: wx(function(W){ return W.tonight ? W.tonight.text + ', ' + W.tonight.temp + '°' : '—'; }),
    tomorrowWeather: wx(function(W){ return dayLine(dayWx(W, 1)); }),
    dayAfterWeather: wx(function(W){ return dayLine(dayWx(W, 2)); })
  };
  function wx(fn){ try { return A.weather ? String(fn(A.weather)) : '—'; } catch (e) { return '—'; } }
}
/* Weather for today + offset days, matched by the paper's local date. */
function dayWx(W, offset){
  var t = todayParts(), k = new Date(Date.UTC(t.y, t.m - 1, t.d + offset, 12)).toISOString().slice(0, 10);
  return (W.days || []).filter(function(d){ return d.date === k; })[0] || {};
}
function dayLine(d){ return d.text ? d.text + (d.high != null ? ', ' + d.high + '°' : '') : '—'; }
var liveSig = '', LIVE_NODES = [], LIVE_BLOCKS = { weather: 1, tides: 1 };
function fillTokens(text, v){ return text.replace(TOKEN_RE, function(m, k){ return Object.prototype.hasOwnProperty.call(v, k) ? v[k] : m; }); }
function applyLive(root){
  var v = liveValues(), walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n, found = [];
  liveSig = JSON.stringify(v);
  while ((n = walker.nextNode())) if (n.nodeValue.indexOf('{{') >= 0) found.push(n);
  found.forEach(function(node){ node.__tpl = node.nodeValue; LIVE_NODES.push(node); node.nodeValue = fillTokens(node.__tpl, v); });
}
/* New weather, tides or a new day: update only the words and blocks that change, not every page. */
function refreshLive(){
  var v = liveValues();
  liveSig = JSON.stringify(v);
  LIVE_NODES = LIVE_NODES.filter(function(n){ return n.isConnected; });
  LIVE_NODES.forEach(function(n){ var t = fillTokens(n.__tpl, v); if (n.nodeValue !== t) n.nodeValue = t; });
  Object.keys(BIDMAP).forEach(function(id){
    var info = BIDMAP[id]; if (!info || !LIVE_BLOCKS[info.block.type]) return;
    var old = book.querySelector('[data-bid="' + id + '"]'); if (!old) return;
    var fresh = BLOCKS[info.block.type](info.block);
    fresh.classList.add('block'); fresh.dataset.bid = id;
    if (old.classList.contains('is-sel')) fresh.classList.add('is-sel');
    old.replaceWith(fresh);
  });
}
/* Once a minute: fetch a new almanac after midnight, and redraw when a value
   changes (the next high tide passes, the date rolls over). Never mid-puzzle. */
/* New tides or weather arrived: redraw now, unless a reader is mid-puzzle (the clock catches up later). */
function liveUpdated(){ if (!PZ.active && book && JSON.stringify(liveValues()) !== liveSig) refreshLive(); }
function tickLive(){
  if (!hooks.rerender || PZ.active) return;
  if (ALMANAC && (ALMANAC.date !== ymdKey(todayParts()) || Date.now() - ALMANAC.loadedAt > 30 * 60000)) {
    loadAlmanac(hooks.issue ? hooks.issue() : null, liveUpdated);
    refreshLive();
    return;
  }
  if (JSON.stringify(liveValues()) !== liveSig) refreshLive();
}
function startLiveClock(){
  setInterval(tickLive, 60000);
  document.addEventListener('visibilitychange', function(){ if (!document.hidden) tickLive(); });
}

/* =========================================================
   BLOCKS — one function per block "type"
   ========================================================= */
function heading(text, size){
  if (size === 'lead')   return el('h2', 'lead', text);
  if (size === 'small')  return el('h5', 'small', text);
  if (size === 'medium') return el('h4', 'medium', text);
  return el('h4', 'big', text);
}
function paragraphs(list, dateline){
  var frag = document.createDocumentFragment();
  (list || []).forEach(function(t, i){
    var p = el('p', null, t);
    if (i === 0 && dateline) p.innerHTML = '<span class="dateplace">' + dateline + ' &mdash;</span> ' + t;
    frag.appendChild(p);
  });
  return frag;
}
function textBody(b){
  var cls = ['body'];
  if (b.cols > 1) cls.push('cols' + b.cols);
  if (b.drop) cls.push('drop');
  if (b.size === 'small') cls.push('body-small');
  if (b.align === 'left') cls.push('body-left');
  var d = el('div', cls.join(' '));
  d.appendChild(paragraphs(b.body, b.dateline));
  return d;
}
var NUMERIC = /^[\s\d.,:%$+–—\-\/apm°]*$|&deg;/i;

var BLOCKS = {
  kicker: function(b){ return el('p', 'kicker', b.text); },
  sect:   function(b){ return el('h6', 'sect' + (b.strong ? ' strong' : ''), b.text); },
  head:   function(b){ return BLOCKS.article({ head:b.text, size:b.size, sub:b.sub, byline:b.byline, kicker:b.kicker }); },
  rule:   function(b){ return el('hr', b.style === 'thick' ? 'thick' : 'thin'); },
  html:   function(b){ return el('div', null, b.html); },
  big:    function(b){ return el('div', 'bignum', (b.value || '') + (b.unit ? '<span class="unit">' + b.unit + '</span>' : '')); },

  article: function(b){
    var w = el('div', 'art' + (b.size === 'lead' ? ' lead-wrap' : ''));
    if (b.kicker) w.appendChild(el('p', 'kicker', b.kicker));
    if (b.head)   w.appendChild(heading(b.head, b.size));
    if (b.sub)    w.appendChild(el('p', 'sub', b.sub));
    if (b.byline) w.appendChild(el('div', 'byline', '<b>' + b.byline + '</b>' + (b.bylineNote ? ' &nbsp;&middot;&nbsp; ' + b.bylineNote : '')));
    if (b.body && b.body.length) { var body = textBody(b); if (!b.head && !b.kicker && !b.byline) body.style.marginTop = '0'; w.appendChild(body); }
    if (b.jump)   w.appendChild(el('p', 'jump', b.jump));
    return w;
  },
  text: function(b){ return textBody(b); },

  photo: function(b){
    var f = el('figure', 'cut'), frame = el('div', 'frame');
    if (b.ratio) frame.style.aspectRatio = b.ratio;
    frame.appendChild(picture(b, 640, 360));
    f.appendChild(frame);
    if (b.caption) f.appendChild(el('figcaption', null, b.caption));
    return f;
  },
  cartoon: function(b){
    var f = el('figure', 'cartoon');
    f.appendChild(picture(b, 480, 360));
    if (b.caption) f.appendChild(el('div', 'cap', b.caption));
    return f;
  },
  box: function(b){
    var d = el('div', 'box' + (b.heavy ? ' heavy' : ''));
    if (b.title) d.appendChild(el('h6', 'sect', b.title));
    b.blocks = b.blocks || [];
    renderBlocks(b.blocks, d);
    return d;
  },
  list: function(b){
    var ul = el('ul', 'brief');
    (b.items || []).forEach(function(it){ ul.appendChild(el('li', null, (it.title ? '<b>' + it.title + '</b>' : '') + (it.text || ''))); });
    return ul;
  },
  table: function(b){
    var t = el('table'), rows = b.rows || [], width = Math.max((b.head || []).length, rows.reduce(function(m, r){ return Math.max(m, r.length); }, 0));
    var al = b.align || [];
    if (!b.align) for (var i = 0; i < width; i++) al[i] = i > 0 && rows.length && rows.every(function(r){ return NUMERIC.test(r[i] == null ? '' : String(r[i])); }) ? 'r' : 'l';
    function cell(tag, v, i){ return el(tag, al[i] === 'r' ? 'r' : null, v == null || v === '' ? '&nbsp;' : v); }
    if (b.head && b.head.length) { var tr = el('tr'); b.head.forEach(function(h, i){ tr.appendChild(cell('th', h, i)); }); t.appendChild(tr); }
    rows.forEach(function(r){ var tr2 = el('tr'); r.forEach(function(v, i){ tr2.appendChild(cell('td', v, i)); }); t.appendChild(tr2); });
    return t;
  },
  rows: function(b){
    var d = el('div', 'rowlist');
    (b.items || []).forEach(function(r){ d.appendChild(el('div', 'row', '<span>' + (r[0] || '') + '</span><span>' + (r[1] || '') + '</span>')); });
    return d;
  },
  score: function(b){
    var d = el('div');
    (b.items || []).forEach(function(r){ d.appendChild(el('div', 'score', '<span>' + (r[0] || '') + '</span><span>' + (r[1] || '') + '</span>')); });
    return d;
  },
  quote: function(b){ return el('div', 'quote', (b.text || '') + (b.who ? '<span class="who">' + b.who + '</span>' : '')); },
  ad: function(b){
    return el('div', 'ad',
      (b.eyebrow ? '<div class="small">' + b.eyebrow + '</div>' : '') +
      '<div class="shout">' + (b.shout || '') + '</div>' +
      (b.script ? '<div class="script">' + b.script + '</div>' : '') +
      (b.small ? '<div class="small">' + b.small + '</div>' : ''));
  },
  letters: function(b){
    var d = el('div');
    (b.items || []).forEach(function(l){
      var x = el('div', 'letter');
      x.appendChild(el('h5', 'small', l.head || ''));
      x.appendChild(paragraphs(l.body));
      if (l.sig) x.appendChild(el('p', 'sig', l.sig));
      d.appendChild(x);
    });
    return d;
  },
  obits: function(b){
    var d = el('div', 'obit');
    (b.items || []).forEach(function(o){ d.appendChild(el('p', null, '<b>' + (o.name || '') + '</b>, ' + (o.body || ''))); });
    return d;
  },
  classified: function(b){
    var d = el('div', 'classi');
    (b.items || []).forEach(function(c){ d.appendChild(el('p', null, '<b>' + (c.tag || '') + '</b> &mdash; ' + (c.text || ''))); });
    return d;
  },
  comic: function(b){
    var d = el('div', 'comic');
    (b.panels || []).forEach(function(p){
      var x = el('div', 'panel');
      x.innerHTML = '<div class="bubble">' + (p.line || '') + '</div><div class="ground"></div>';
      var fig = el('div', 'figure'); fig.style.left = (p.pos != null ? p.pos : 30) + '%';
      x.appendChild(fig); d.appendChild(x);
    });
    d.style.gridTemplateColumns = 'repeat(' + Math.max(1, (b.panels || []).length) + ',1fr)';
    return d;
  },
  tides: function(b){
    var A = ALMANAC || {}, wrap = el('div', 'tides');
    if (!A.tideStation) { wrap.appendChild(txt('p', 'tide-note', 'No tide station is set for this paper.')); return wrap; }
    var today = tideToday(), now = Date.now(), nextDone = false;
    var list = (A.tides || []).filter(function(x){ return tideKey(x.time) === today; });
    if (!list.length) { wrap.appendChild(txt('p', 'tide-note', A.tideError || 'No tide predictions for today yet.')); return wrap; }
    var t = el('table'), head = el('tr');
    ['', 'Time', 'Feet'].forEach(function(h, i){ head.appendChild(el('th', i ? 'r' : null, h || '&nbsp;')); });
    t.appendChild(head);
    list.forEach(function(x){
      var tr = el('tr');
      if (!nextDone && Date.parse(x.time) > now) { tr.className = 'next'; nextDone = true; }
      tr.appendChild(txt('td', null, x.type === 'high' ? 'High' : 'Low'));
      tr.appendChild(txt('td', 'r', tideClock(x.time)));
      tr.appendChild(txt('td', 'r', x.feet.toFixed(1)));
      t.appendChild(tr);
    });
    wrap.appendChild(t);
    var zone = new Date().toLocaleTimeString('en-US', { timeZone: tideTZ(), timeZoneName: 'short' }).split(' ').pop();
    wrap.appendChild(txt('p', 'tide-note', 'NOAA predictions, station ' + A.tideStation + ', in harbour time (' + zone + '). The next tide is in bold.'));
    return wrap;
  },
  weather: function(b){
    var A = ALMANAC || {}, W = A.weather, wrap = el('div', 'wx');
    if (!W) { wrap.appendChild(txt('p', 'tide-note', A.weatherError || 'Loading the forecast…')); return wrap; }
    // Words from the forecast service go in as plain text, never as HTML.
    var big = el('div', 'bignum'); big.appendChild(document.createTextNode(W.current.temp + '°'));
    big.appendChild(txt('span', 'unit', W.current.text)); wrap.appendChild(big);
    wrap.appendChild(txt('p', null, W.forecast));
    var rows = el('div', 'rowlist'), t = todayParts();
    function row(a, b2){ var r = el('div', 'row'); r.appendChild(txt('span', null, a)); r.appendChild(txt('span', null, b2)); rows.appendChild(r); }
    if (W.tonight) row('Tonight', W.tonight.text + ', ' + W.tonight.temp + '°');
    [1, 2].forEach(function(o){ var d = dayWx(W, o); if (d.text) row(dayName(t, o), dayLine(d)); });
    wrap.appendChild(rows);
    var note = txt('p', 'tide-note', 'Forecast for ' + (A.placeName || 'here') + (A.placeSource === 'connection' ? ' (from your connection)' : '') +
      ': ' + W.source + '. Temperatures in °' + (A.units || 'F') + '.');
    wrap.appendChild(note);
    if (A.placeSource !== 'device' && navigator.geolocation) {
      var btn = txt('button', 'wx-locate', 'Use my exact location'); btn.type = 'button';
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        btn.disabled = true; btn.textContent = 'Finding you…';
        useExactLocation(function(changed, why){
          if (changed) { loadAlmanac(hooks.issue ? hooks.issue() : null, liveUpdated); refreshLive(); }
          else { btn.disabled = false; btn.textContent = 'Use my exact location'; if (why) note.textContent = why; }
        });
      });
      wrap.appendChild(btn);
    }
    return wrap;
  },
  crossword:  function(b){ return Crossword(b); },
  sudoku:     function(b){ return Sudoku(b); },
  wordsearch: function(b){ return WordSearch(b); }
};

/* Every rendered block remembers which config object drew it, so the
   editor can find a block from a click on the paper. */
var BID = 0, BIDMAP = {};
function renderBlocks(list, into){
  (list || []).forEach(function(b){
    var fn = BLOCKS[b && b.type], node;
    if (!fn) {
      node = el('div', 'oops', 'Unknown block type &ldquo;' + (b && b.type) + '&rdquo;.');
    } else {
      try { node = fn(b); }
      catch (err) { node = el('div', 'oops', 'Could not draw this ' + (SCHEMA_LABEL(b.type)) + ': ' + err.message); }
    }
    node.classList.add('block');
    node.dataset.bid = ++BID;
    BIDMAP[BID] = { block: b, list: list };
    into.appendChild(node);
  });
}
function SCHEMA_LABEL(type){ return hooks.labels[type] || type; }

/* =========================================================
   PAGES
   ========================================================= */
function renderPage(page, i, N, m, issue){
  var sheet = el('div', 'sheet'), face = el('div', 'face'), paper = el('div', 'paper');
  var news = page.news ? newsColumns(page, issue || ISSUE) : null;     // news pages are laid out from the hour's stories
  if (page.plate) {
    paper.appendChild(el('div', 'plate',
      '<div class="folio"><span>' + (m.volume || '') + ' &nbsp; ' + (m.number || '') + '</span><span>' + (m.place || '') + '</span><span>' + (m.price || '') + '</span></div>' +
      '<div class="nameplate">' +
        '<div class="ear ear-brand">' + BRAND_BADGE + '</div>' +
        '<h1>' + (m.name || '') + '</h1>' +
        '<div class="ear ear-weather"><span class="ear-label">{{weatherPlace}}</span><b>{{temp}}</b><span>{{conditions}}</span></div>' +
      '</div>' +
      (m.motto ? '<div class="motto">' + m.motto + '</div>' : '') +
      '<div class="dateline"><span>' + (m.date || '') + '</span><span>' + (m.meta || '') + '</span><span>' + (m.pages || '') + '</span></div>'));
  } else {
    var rh = page.runhead || {};
    paper.appendChild(el('div', 'runhead',
      '<span class="rh-left"><span class="rh-badge">' + BRAND_BADGE + '</span>' + (rh.left || ((m.name || '') + ' &nbsp;&middot;&nbsp; ' + (m.date || ''))) + '</span>' +
      '<em>' + (rh.center || (news && NEWS_TEMPLATES[page.news] ? NEWS_TEMPLATES[page.news].center : '')) + '</em>' +
      '<span>' + (rh.right || ('Page ' + (i + 1))) + '</span>'));
  }
  var cols = news ? news.cols : page.columns || [];
  if (news) sheet.classList.add('news-page');
  var grid = el('div', 'grid');
  grid.style.gridTemplateColumns = cols.map(function(c){ return (c.w || 1) + 'fr'; }).join(' ') || '1fr';
  cols.forEach(function(c){ c.blocks = c.blocks || []; var col = el('div', 'col'); renderBlocks(c.blocks, col); grid.appendChild(col); });
  paper.appendChild(grid);
  var stripCols = news ? news.strip : page.strip;
  if (stripCols && stripCols.length) {
    var strip = el('div', 'strip');
    strip.style.gridTemplateColumns = stripCols.map(function(c){ return (c.w || 1) + 'fr'; }).join(' ');
    stripCols.forEach(function(c){ c.blocks = c.blocks || []; var cell = el('div', 'cell'); renderBlocks(c.blocks, cell); strip.appendChild(cell); });
    paper.appendChild(strip);
  }
  face.appendChild(paper);
  ['crease', 'grain', 'folded-edge', 'shade'].forEach(function(c){ face.appendChild(el('div', c)); });
  if (i > 0)     { var bp = el('button', 'corner prev'); bp.dataset.nav = '-1'; bp.setAttribute('aria-label', 'Turn back to page ' + i); face.appendChild(bp); }
  if (i < N - 1) { var bn = el('button', 'corner next'); bn.dataset.nav = '1';  bn.setAttribute('aria-label', 'Turn to page ' + (i + 2)); face.appendChild(bn); }
  var verso = el('div', 'face verso');
  verso.appendChild(el('div', 'grain')); verso.appendChild(el('div', 'crease'));
  sheet.appendChild(face); sheet.appendChild(verso);
  return sheet;
}

/* =========================================================
   PUZZLE INPUT — one hidden input drives whichever grid is active
   ========================================================= */
var PZ = { active: null, input: null };
var SENTINEL = ' ';
function resetInput(){ PZ.input.value = SENTINEL; try { PZ.input.setSelectionRange(1, 1); } catch (e) {} }
PZ.activate = function(p){
  if (PZ.active && PZ.active !== p) PZ.active.setActive(false);
  PZ.active = p; p.setActive(true);
  PZ.input.setAttribute('inputmode', p.inputMode);
  resetInput();
  PZ.input.focus({ preventScroll: true });
  setTimeout(keepCellVisible, 400);
};
PZ.release = function(){
  if (PZ.active) { try { PZ.active.setActive(false); } catch (e) {} }
  PZ.active = null;
  if (PZ.input && document.activeElement === PZ.input) PZ.input.blur();
};
function wireInput(){
  PZ.input.addEventListener('keydown', function(e){
    if (!PZ.active) return;
    if (e.key === 'Escape') { e.preventDefault(); PZ.release(); return; }
    if (PZ.active.key(e)) e.preventDefault();
    keepCellVisible();
  });
  PZ.input.addEventListener('input', function(){
    if (!PZ.active) return;
    var v = PZ.input.value;
    if (v.length === 0) PZ.active.erase();
    else for (var i = 0; i < v.length; i++) if (v[i] !== SENTINEL) PZ.active.type(v[i]);
    resetInput();
    keepCellVisible();
  });
}
function twoTap(btn, label, armedLabel, run, armedClass){
  var timer = null;
  btn.addEventListener('click', function(){
    if (timer) { clearTimeout(timer); timer = null; btn.textContent = label; btn.classList.remove(armedClass || 'warn'); run(); return; }
    btn.textContent = armedLabel; btn.classList.add(armedClass || 'warn');
    timer = setTimeout(function(){ timer = null; btn.textContent = label; btn.classList.remove(armedClass || 'warn'); }, 2600);
  });
}
function pzButton(text, cls){ var b = el('button', 'pz-btn' + (cls ? ' ' + cls : ''), text); b.type = 'button'; return b; }
function progressKey(prefix, cfg, content){ return (cfg.id || prefix) + ':' + hash(JSON.stringify(content)); }

/* ---------------- crossword ---------------- */
/* Shared by the reader's grid and the editor's grid builder. */
function cwAnalyze(grid){
  var rows = (grid || []).map(function(r){ return String(r).toUpperCase(); });
  var R = rows.length, C = rows.reduce(function(m, r){ return Math.max(m, r.length); }, 0);
  var sol = [], r, c, i;
  for (r = 0; r < R; r++) for (c = 0; c < C; c++) { var ch = rows[r][c]; sol.push(ch === '#' ? '#' : (/[A-Z]/.test(ch || '') ? ch : '.')); }
  function black(k){ return sol[k] === '#'; }
  var nums = [], words = [], at = sol.map(function(){ return { a: -1, d: -1 }; }), n = 0;
  for (r = 0; r < R; r++) for (c = 0; c < C; c++) {
    i = r * C + c; if (black(i)) continue;
    var sa = (c === 0 || black(i - 1)) && c + 1 < C && !black(i + 1);
    var sd = (r === 0 || black(i - C)) && r + 1 < R && !black(i + C);
    if (sa || sd) nums[i] = ++n;
    [['a', sa, 1], ['d', sd, C]].forEach(function(spec){
      if (!spec[1]) return;
      var cells = [], k = i;
      while (k < R * C && !black(k) && (spec[0] === 'd' || Math.floor(k / C) === r)) { cells.push(k); k += spec[2]; }
      var w = { dir: spec[0], num: n, cells: cells, ans: cells.map(function(x){ return sol[x]; }).join(''), key: spec[0] + cells[0], idx: words.length };
      cells.forEach(function(x){ at[x][spec[0]] = w.idx; });
      words.push(w);
    });
  }
  return { R: R, C: C, sol: sol, nums: nums, words: words, at: at };
}

function Crossword(cfg){
  var A = cwAnalyze(cfg.grid), R = A.R, C = A.C, sol = A.sol, words = A.words, at = A.at;
  if (!R || !C) throw new Error('the grid is empty');
  function black(k){ return sol[k] === '#'; }
  words.forEach(function(w){
    var bank = w.dir === 'a' ? (cfg.across || {}) : (cfg.down || {});
    w.clue = bank[w.ans] || bank[w.num] || '(clue to come)';
  });
  var order = words.filter(function(w){ return w.dir === 'a'; }).concat(words.filter(function(w){ return w.dir === 'd'; }));
  var key = progressKey('cw', cfg, cfg.grid);
  var saved = store(key) || {};
  var letters = (saved.l && saved.l.length === sol.length) ? saved.l : sol.map(function(){ return ''; });
  var bad = {}, rev = saved.rev || {};
  var sel = sol.findIndex(function(x){ return x !== '#'; }), dir = 'a', live = false;
  if (sel < 0) throw new Error('every square is black');
  if (at[sel].a < 0) dir = 'd';

  var root = el('div', 'pz pz-cw'); root.dataset.pz = '';
  var gridEl = el('div', 'cw-grid'); gridEl.style.setProperty('--n', C);
  var cells = sol.map(function(ch, k){
    var d = el('div', 'cw-cell' + (ch === '#' ? ' blk' : ''));
    if (ch !== '#') {
      if (A.nums[k]) d.appendChild(txt('span', 'num', String(A.nums[k])));
      d.appendChild(el('span', 'ch'));
      d.addEventListener('click', function(){
        if (k === sel && live) toggleDir(); else { sel = k; if (at[k][dir] < 0) dir = dir === 'a' ? 'd' : 'a'; }
        PZ.activate(api); draw();
      });
    }
    gridEl.appendChild(d); return d;
  });
  var clueBar = el('div', 'pz-clue'), tools = el('div', 'pz-tools');
  var bCheck = pzButton('Check'), bReveal = pzButton('Reveal word'), bClear = pzButton('Clear'), status = el('span', 'pz-status');
  [bCheck, bReveal, bClear, status].forEach(function(x){ tools.appendChild(x); });
  var lists = el('div', 'cw-clues'), li = [];
  [['a', 'Across'], ['d', 'Down']].forEach(function(g){
    var col = el('div'); col.appendChild(txt('h6', null, g[1]));
    var ol = el('ol');
    words.filter(function(w){ return w.dir === g[0]; }).forEach(function(w){
      var item = el('li', null, '<b>' + w.num + '</b><span>' + w.clue + '</span>');
      item.addEventListener('click', function(){ dir = w.dir; sel = firstEmpty(w); PZ.activate(api); draw(); });
      li[w.idx] = item; ol.appendChild(item);
    });
    col.appendChild(ol); lists.appendChild(col);
  });
  [gridEl, clueBar, tools, lists].forEach(function(x){ root.appendChild(x); });

  function word(){ var w = at[sel][dir]; return w < 0 ? null : words[w]; }
  function firstEmpty(w){ for (var j = 0; j < w.cells.length; j++) if (!letters[w.cells[j]]) return w.cells[j]; return w.cells[0]; }
  function toggleDir(){ var o = dir === 'a' ? 'd' : 'a'; if (at[sel][o] >= 0) dir = o; }
  function save(){ store(key, { l: letters, rev: rev }); }
  function solved(){ return sol.every(function(ch, k){ return ch === '#' || letters[k] === ch; }); }
  function jumpWord(step){
    if (!order.length) return;
    var p = order.indexOf(word()), nx = order[(p + step + order.length) % order.length];
    dir = nx.dir; sel = firstEmpty(nx);
  }
  function draw(){
    var w = word(), cross = at[sel][dir === 'a' ? 'd' : 'a'];
    cells.forEach(function(d, k){
      if (black(k)) return;
      d.classList.toggle('sel', live && k === sel);
      d.classList.toggle('hl', live && !!w && w.cells.indexOf(k) >= 0 && k !== sel);
      d.classList.toggle('bad', !!bad[k]);
      d.classList.toggle('rev', !!rev[k]);
      d.lastChild.textContent = letters[k];
    });
    words.forEach(function(x){
      li[x.idx].classList.toggle('on', live && x === w);
      li[x.idx].classList.toggle('cross', live && x.idx === cross);
      li[x.idx].classList.toggle('done', x.cells.every(function(k){ return letters[k]; }));
    });
    clueBar.innerHTML = w ? '<b>' + w.num + ' ' + (w.dir === 'a' ? 'Across' : 'Down') + '</b><span>' + w.clue + '</span>' : '<span>Tap a square to start.</span>';
    var filled = letters.filter(function(x, k){ return x && !black(k); }).length, total = sol.filter(function(x){ return x !== '#'; }).length;
    var done = solved();
    root.classList.toggle('solved', done);
    status.textContent = done ? 'Solved' : filled + ' of ' + total + ' squares';
  }
  function step(delta){
    var w = word(); if (!w) return;
    var p = w.cells.indexOf(sel) + delta;
    if (p >= 0 && p < w.cells.length) sel = w.cells[p]; else if (delta > 0) jumpWord(1);
  }
  function move(dr, dc){
    var want = dc ? 'a' : 'd';
    if (dir !== want && at[sel][want] >= 0) { dir = want; return; }
    var r0 = Math.floor(sel / C), c0 = sel % C;
    for (var r1 = r0 + dr, c1 = c0 + dc; r1 >= 0 && r1 < R && c1 >= 0 && c1 < C; r1 += dr, c1 += dc) {
      if (!black(r1 * C + c1)) { sel = r1 * C + c1; if (at[sel][dir] < 0) toggleDir(); return; }
    }
  }
  var api = {
    root: root,
    inputMode: 'text',
    setActive: function(on){ live = on; draw(); },
    type: function(ch){
      if (!/[a-z]/i.test(ch)) return;
      letters[sel] = ch.toUpperCase(); delete bad[sel]; delete rev[sel];
      step(1); save(); draw();
    },
    erase: function(){
      if (letters[sel]) letters[sel] = '';
      else { var w = word(), p = w ? w.cells.indexOf(sel) : -1; if (p > 0) { sel = w.cells[p - 1]; letters[sel] = ''; } }
      delete bad[sel]; delete rev[sel]; save(); draw();
    },
    key: function(e){
      var k = e.key;
      if (k === 'ArrowLeft')  { move(0, -1); draw(); return true; }
      if (k === 'ArrowRight') { move(0, 1);  draw(); return true; }
      if (k === 'ArrowUp')    { move(-1, 0); draw(); return true; }
      if (k === 'ArrowDown')  { move(1, 0);  draw(); return true; }
      if (k === 'Tab' || k === 'Enter') { jumpWord(e.shiftKey ? -1 : 1); draw(); return true; }
      if (k === ' ') { toggleDir(); draw(); return true; }
      if (k === 'Backspace') { api.erase(); return true; }
      if (k === 'Delete') { letters[sel] = ''; save(); draw(); return true; }
      return false;
    }
  };
  bCheck.addEventListener('click', function(){ sol.forEach(function(ch, k){ if (ch !== '#' && letters[k] && letters[k] !== ch) bad[k] = 1; }); draw(); });
  bReveal.addEventListener('click', function(){
    var w = word(); if (!w) return;
    w.cells.forEach(function(k){ if (letters[k] !== sol[k] && sol[k] !== '.') { letters[k] = sol[k]; rev[k] = 1; delete bad[k]; } });
    save(); draw();
  });
  twoTap(bClear, 'Clear', 'Tap again to clear', function(){ letters = sol.map(function(){ return ''; }); bad = {}; rev = {}; save(); draw(); });
  draw();
  return root;
}

/* ---------------- sudoku ---------------- */
function popcount(m){ var n = 0; while (m) { m &= m - 1; n++; } return n; }
/* Counts solutions up to `limit`; `out` receives the first solution found. */
function sdCount(grid, limit, out, rnd){
  var g = grid.slice(), rows = [0,0,0,0,0,0,0,0,0], cols = rows.slice(), boxes = rows.slice(), count = 0;
  for (var i = 0; i < 81; i++) if (g[i]) {
    var r = Math.floor(i / 9), c = i % 9, b = Math.floor(r / 3) * 3 + Math.floor(c / 3), bit = 1 << g[i];
    if ((rows[r] | cols[c] | boxes[b]) & bit) return 0;
    rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
  }
  function rec(){
    var best = -1, bestMask = 0, bestN = 10;
    for (var k = 0; k < 81; k++) if (!g[k]) {
      var r = Math.floor(k / 9), c = k % 9, b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
      var m = ~(rows[r] | cols[c] | boxes[b]) & 0x3FE, n = popcount(m);
      if (n < bestN) { best = k; bestMask = m; bestN = n; if (!n) return; }
    }
    if (best < 0) { count++; if (out && count === 1) for (var q = 0; q < 81; q++) out[q] = g[q]; return; }
    var r2 = Math.floor(best / 9), c2 = best % 9, b2 = Math.floor(r2 / 3) * 3 + Math.floor(c2 / 3);
    var ds = []; for (var d = 1; d <= 9; d++) if (bestMask & (1 << d)) ds.push(d);
    if (rnd) shuffle(ds, rnd);
    for (var j = 0; j < ds.length; j++) {
      var bit2 = 1 << ds[j];
      g[best] = ds[j]; rows[r2] |= bit2; cols[c2] |= bit2; boxes[b2] |= bit2;
      rec();
      g[best] = 0; rows[r2] &= ~bit2; cols[c2] &= ~bit2; boxes[b2] &= ~bit2;
      if (count >= limit) return;
    }
  }
  rec();
  return count;
}
function sdGenerate(target, seed){
  var rnd = mulberry(seed || (Date.now() & 0xffffff)), full = new Array(81).fill(0);
  sdCount(new Array(81).fill(0), 1, full, rnd);
  var g = full.slice(), order = shuffle(Array.from({ length: 41 }, function(_, i){ return i; }), rnd);
  for (var t = 0; t < order.length; t++) {
    if (g.filter(Boolean).length <= target) break;
    var i = order[t], j = 80 - i, a = g[i], b = g[j];
    g[i] = 0; g[j] = 0;
    if (sdCount(g, 2) !== 1) { g[i] = a; g[j] = b; }
  }
  return g.map(function(d){ return d ? String(d) : '.'; }).join('');
}
function sdParse(s){ return String(s || '').replace(/\s/g, '').split('').map(function(ch){ return /[1-9]/.test(ch) ? +ch : 0; }); }
var PEERS = [];
(function(){
  for (var i = 0; i < 81; i++) {
    var r = Math.floor(i / 9), c = i % 9, br = r - r % 3, bc = c - c % 3, out = [];
    for (var k = 0; k < 81; k++) {
      if (k === i) continue;
      var r2 = Math.floor(k / 9), c2 = k % 9;
      if (r2 === r || c2 === c || (r2 - r2 % 3 === br && c2 - c2 % 3 === bc)) out.push(k);
    }
    PEERS.push(out);
  }
})();

function Sudoku(cfg){
  if (cfg.daily) { var today = dailySudoku(); cfg = { id: (cfg.id || 'sd') + '-' + today.day, givens: today.givens }; }   // a new one every day
  var giv = sdParse(cfg.givens);
  if (giv.length !== 81) throw new Error('the puzzle needs 81 squares, it has ' + giv.length);
  var sol = new Array(81).fill(0);
  if (!sdCount(giv, 1, sol)) throw new Error('these numbers have no solution');
  var key = progressKey('sd', cfg, cfg.givens);
  var saved = store(key) || {};
  var v = (saved.v && saved.v.length === 81) ? saved.v : giv.slice();
  var notes = (saved.n && saved.n.length === 81) ? saved.n : giv.map(function(){ return 0; });
  var bad = {}, noteMode = false, live = false, sel = Math.max(0, giv.indexOf(0));

  var root = el('div', 'pz pz-sd'); root.dataset.pz = '';
  var gridEl = el('div', 'sd-grid');
  var cells = giv.map(function(g0, k){
    var r = Math.floor(k / 9), c = k % 9;
    var d = el('div', 'sd-cell' + (g0 ? ' given' : '') + (c === 2 || c === 5 ? ' br' : '') + (r === 2 || r === 5 ? ' bb' : '') + (c === 8 ? ' er' : '') + (r === 8 ? ' eb' : ''));
    d.addEventListener('click', function(){ sel = k; PZ.activate(api); draw(); });
    gridEl.appendChild(d); return d;
  });
  var pad = el('div', 'sd-pad');
  for (var d = 1; d <= 9; d++) (function(d){
    var b = pzButton(String(d)); b.addEventListener('click', function(){ PZ.activate(api); api.type(String(d)); }); pad.appendChild(b);
  })(d);
  var bErase = pzButton('Erase', 'word'), bNotes = pzButton('Notes', 'word'), bCheck = pzButton('Check', 'word');
  bNotes.setAttribute('aria-pressed', 'false');
  bErase.addEventListener('click', function(){ PZ.activate(api); api.erase(); });
  bNotes.addEventListener('click', function(){ PZ.activate(api); setNotes(!noteMode); draw(); });
  bCheck.addEventListener('click', function(){ v.forEach(function(x, k){ if (x && x !== sol[k]) bad[k] = 1; }); draw(); });
  [bErase, bNotes, bCheck].forEach(function(x){ pad.appendChild(x); });
  var tools = el('div', 'pz-tools'), bClear = pzButton('Clear'), status = el('span', 'pz-status');
  tools.appendChild(bClear); tools.appendChild(status);
  twoTap(bClear, 'Clear', 'Tap again to clear', function(){ v = giv.slice(); notes = giv.map(function(){ return 0; }); bad = {}; save(); draw(); });
  [gridEl, pad, tools].forEach(function(x){ root.appendChild(x); });

  function setNotes(on){ noteMode = on; bNotes.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  function save(){ store(key, { v: v, n: notes }); }
  function draw(){
    var sv = v[sel];
    cells.forEach(function(d, k){
      var clash = !!v[k] && PEERS[k].some(function(p){ return v[p] === v[k]; });
      d.classList.toggle('sel', live && k === sel);
      d.classList.toggle('peer', live && k !== sel && PEERS[sel].indexOf(k) >= 0);
      d.classList.toggle('same', live && !!sv && k !== sel && v[k] === sv);
      d.classList.toggle('clash', clash && !giv[k]);
      d.classList.toggle('bad', !!bad[k]);
      if (v[k]) d.textContent = v[k];
      else if (notes[k]) {
        var h = '<div class="sd-notes">';
        for (var q = 1; q <= 9; q++) h += '<span>' + ((notes[k] >> q) & 1 ? q : '') + '</span>';
        d.innerHTML = h + '</div>';
      } else d.textContent = '';
    });
    var done = v.every(function(x, k){ return x === sol[k]; });
    root.classList.toggle('solved', done);
    status.textContent = done ? 'Solved' : v.filter(Boolean).length + ' of 81 filled' + (noteMode ? ' · notes on' : '');
  }
  function moveBy(dr, dc){ var r = (Math.floor(sel / 9) + dr + 9) % 9, c = (sel % 9 + dc + 9) % 9; sel = r * 9 + c; }
  var api = {
    root: root,
    inputMode: COARSE ? 'none' : 'numeric',
    setActive: function(on){ live = on; draw(); },
    type: function(ch){
      if (ch === 'n' || ch === 'N') { setNotes(!noteMode); draw(); return; }
      if (ch === '0') { api.erase(); return; }
      if (!/[1-9]/.test(ch) || giv[sel]) return;
      var dd = +ch;
      if (noteMode) { if (!v[sel]) notes[sel] ^= (1 << dd); }
      else {
        v[sel] = v[sel] === dd ? 0 : dd; notes[sel] = 0; delete bad[sel];
        if (v[sel]) PEERS[sel].forEach(function(p){ notes[p] &= ~(1 << dd); });
      }
      save(); draw();
    },
    erase: function(){ if (giv[sel]) return; v[sel] = 0; notes[sel] = 0; delete bad[sel]; save(); draw(); },
    key: function(e){
      var k = e.key;
      if (k === 'ArrowLeft')  { moveBy(0, -1); draw(); return true; }
      if (k === 'ArrowRight') { moveBy(0, 1);  draw(); return true; }
      if (k === 'ArrowUp')    { moveBy(-1, 0); draw(); return true; }
      if (k === 'ArrowDown')  { moveBy(1, 0);  draw(); return true; }
      if (k === 'Backspace' || k === 'Delete') { api.erase(); return true; }
      if (k === 'Tab') { var guard = 0; do { sel = (sel + (e.shiftKey ? 80 : 1)) % 81; } while (v[sel] && ++guard < 81); draw(); return true; }
      return false;
    }
  };
  draw();
  return root;
}

/* ---------------- word search ---------------- */
var DIRS8 = [[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]];
var FILL = 'EEEEAAAIIIOOTTTNNSSRRLLHDCUMPGBFYWKV';
function wsWords(list){
  var seen = {};
  return (list || []).map(function(w){ return String(w).toUpperCase().replace(/[^A-Z]/g, ''); })
    .filter(function(w){ if (w.length < 2 || seen[w]) return false; seen[w] = 1; return true; });
}
function wsBuild(words, size, seed){
  var N = Math.max(5, Math.min(16, size | 0 || 10)), rnd = mulberry(seed || 1), g = new Array(N * N).fill('');
  var list = wsWords(words), placed = {}, unplaced = [];
  list.slice().sort(function(a, b){ return b.length - a.length; }).forEach(function(w){
    if (w.length > N) { unplaced.push(w); return; }
    for (var t = 0; t < 400; t++) {
      var d = DIRS8[Math.floor(rnd() * 8)], r = Math.floor(rnd() * N), c = Math.floor(rnd() * N);
      var er = r + d[0] * (w.length - 1), ec = c + d[1] * (w.length - 1);
      if (er < 0 || er >= N || ec < 0 || ec >= N) continue;
      var ok = true, i;
      for (i = 0; i < w.length; i++) { var k = (r + d[0] * i) * N + c + d[1] * i; if (g[k] && g[k] !== w[i]) { ok = false; break; } }
      if (!ok) continue;
      var cells = [];
      for (i = 0; i < w.length; i++) { var k2 = (r + d[0] * i) * N + c + d[1] * i; g[k2] = w[i]; cells.push(k2); }
      placed[w] = cells; return;
    }
    unplaced.push(w);
  });
  for (var k3 = 0; k3 < g.length; k3++) if (!g[k3]) g[k3] = FILL[Math.floor(rnd() * FILL.length)];
  return { N: N, grid: g, words: list.filter(function(w){ return placed[w]; }), placed: placed, unplaced: unplaced };
}
function WordSearch(cfg){
  var ws = wsBuild(cfg.words, cfg.size, cfg.seed), N = ws.N;
  var key = progressKey('ws', cfg, [cfg.words, cfg.size, cfg.seed]);
  var found = ((store(key) || {}).f || []).filter(function(w){ return ws.placed[w]; });
  var root = el('div', 'pz pz-ws'); root.dataset.pz = '';
  var gridEl = el('div', 'ws-grid'); gridEl.style.setProperty('--n', N);
  gridEl.style.setProperty('--ws-font', Math.round(Math.max(9, Math.min(17, 150 / N))) + 'px');
  var cells = ws.grid.map(function(ch, k){ var d = txt('div', 'ws-cell', ch); d.dataset.k = k; gridEl.appendChild(d); return d; });
  var list = el('ul', 'ws-words'), items = {};
  ws.words.forEach(function(w){ items[w] = txt('li', null, w); list.appendChild(items[w]); });
  var tools = el('div', 'pz-tools'), bClear = pzButton('Clear'), status = el('span', 'pz-status');
  tools.appendChild(bClear); tools.appendChild(status);
  [gridEl, list, tools].forEach(function(x){ root.appendChild(x); });

  var start = -1, cur = -1, pending = -1, dragging = false;
  function line(a, b){
    if (a < 0 || b < 0) return [];
    var r0 = Math.floor(a / N), c0 = a % N, r1 = Math.floor(b / N), c1 = b % N, dr = r1 - r0, dc = c1 - c0;
    if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return [a];
    var len = Math.max(Math.abs(dr), Math.abs(dc)), sr = Math.sign(dr), sc = Math.sign(dc), out = [];
    for (var i = 0; i <= len; i++) out.push((r0 + sr * i) * N + c0 + sc * i);
    return out;
  }
  function cellAt(x, y){ var t = document.elementFromPoint(x, y); t = t && t.closest && t.closest('.ws-cell'); return t && gridEl.contains(t) ? +t.dataset.k : -1; }
  function save(){ store(key, { f: found }); }
  function draw(){
    var selCells = dragging || cur >= 0 ? line(start, cur) : [];
    var hit = {};
    found.forEach(function(w){ ws.placed[w].forEach(function(k){ hit[k] = 1; }); });
    cells.forEach(function(d, k){
      d.classList.toggle('found', !!hit[k]);
      d.classList.toggle('sel', selCells.indexOf(k) >= 0);
      d.classList.toggle('start', k === pending);
    });
    ws.words.forEach(function(w){ items[w].classList.toggle('got', found.indexOf(w) >= 0); });
    var done = ws.words.length && found.length === ws.words.length;
    root.classList.toggle('solved', !!done);
    status.textContent = done ? 'All found' : found.length + ' of ' + ws.words.length + ' found';
  }
  function finish(a, b){
    var cs = line(a, b);
    if (cs.length > 1) {
      var s = cs.map(function(k){ return ws.grid[k]; }).join(''), rs = s.split('').reverse().join('');
      ws.words.forEach(function(w){
        if (found.indexOf(w) >= 0 || (w !== s && w !== rs)) return;
        var p = ws.placed[w], same = p.join() === cs.join() || p.slice().reverse().join() === cs.join();
        if (same) { found.push(w); save(); }
      });
    }
    start = cur = pending = -1; draw();
  }
  gridEl.addEventListener('pointerdown', function(e){
    var k = cellAt(e.clientX, e.clientY); if (k < 0) return;
    e.preventDefault();
    if (pending >= 0 && k !== pending) { finish(pending, k); return; }
    start = cur = k; dragging = true;
    try { gridEl.setPointerCapture(e.pointerId); } catch (err) {}
    draw();
  });
  gridEl.addEventListener('pointermove', function(e){
    if (!dragging) return;
    var k = cellAt(e.clientX, e.clientY); if (k >= 0 && k !== cur) { cur = k; draw(); }
  });
  function up(){
    if (!dragging) return;
    dragging = false;
    if (cur === start) { pending = start === pending ? -1 : start; start = cur = -1; draw(); }
    else finish(start, cur);
  }
  gridEl.addEventListener('pointerup', up);
  gridEl.addEventListener('pointercancel', function(){ dragging = false; start = cur = -1; draw(); });
  twoTap(bClear, 'Clear', 'Tap again to clear', function(){ found = []; save(); draw(); });
  draw();
  return root;
}


/* =========================================================
   STORY READER: tap a story to read it in large type,
   then swipe or use the arrows to go story by story.
   ========================================================= */
var SKIP_READ = { crossword: 1, sudoku: 1, wordsearch: 1, rule: 1, sect: 1, kicker: 1, inside: 1, notice: 1 };
var RD = { list: [], i: 0, open: false, lastFocus: null };
function blockType(n){ var info = n && BIDMAP[n.dataset.bid]; return info ? info.block.type : null; }
/* A story is a headline plus the photo, text, quotes and tables that follow it in
   the same column. Boxes, lists, letters, ads and the like stand on their own. */
var CONTINUES = { photo: 1, text: 1, quote: 1, big: 1, score: 1, table: 1, rows: 1 };
function storyNodes(){
  var out = [];
  sheets.forEach(function(sh, pi){
    sh.querySelectorAll('.paper .col, .paper .strip > .cell').forEach(function(col){
      var cur = null;
      [].forEach.call(col.children, function(n){
        if (!n.classList.contains('block')) return;
        var info = BIDMAP[n.dataset.bid], t = info && info.block.type;
        if (!t || SKIP_READ[t]) return;
        var headed = ((t === 'article' || t === 'head') && !!(info.block.head || info.block.text)) || t === 'story';
        var cont = CONTINUES[t] || (t === 'article' && !headed);
        if (headed && cur && !cur.headed && !cur.standalone) { cur.nodes.push(n); cur.headed = true; return; }
        if (cont && cur && !cur.standalone) { cur.nodes.push(n); return; }
        cur = { nodes: [n], node: n, page: pi, headed: headed, standalone: !headed && !cont, rank: info.block.fit != null ? info.block.fit : 5000 };
        out.push(cur);
      });
    });
  });
  // on a news page, read the lead story first and the briefs last, whatever column they sit in
  return out.map(function(s, k){ s.k = k; return s; }).sort(function(a, b){
    return a.page - b.page || (sheets[a.page].classList.contains('news-page') ? (a.rank === 0 ? 5000 : a.rank) - (b.rank === 0 ? 5000 : b.rank) : 0) || a.k - b.k;
  });
}
function storyIndexOf(node){
  for (var k = 0; k < RD.list.length; k++) if (RD.list[k].nodes.indexOf(node) >= 0) return k;
  return -1;
}
/* A tap on a section heading or kicker opens the story under it. */
function readableFrom(block){
  for (var n = block; n; n = n.nextElementSibling) {
    var t = blockType(n);
    if (t === 'sect' || t === 'kicker' || t === 'rule') continue;
    return t && !SKIP_READ[t] ? n : null;
  }
  return null;
}
function sectionLabel(n){
  var labels = [];
  for (var p = n.previousElementSibling; p && p.classList.contains('block'); p = p.previousElementSibling) {
    var t = blockType(p);
    if (t === 'sect') { labels.unshift(p.textContent.trim()); break; }
    if (t === 'kicker') { labels.unshift(p.textContent.trim()); continue; }
    break;
  }
  return labels.join(' · ');
}
function headlineOf(n){
  var h = n.querySelector('h2, h4, h5, h6, .shout, .sect');
  return (h ? h.textContent : n.textContent).replace(/\s+/g, ' ').trim().slice(0, 80);
}
function pageName(i){
  var s = sheets[i], rh = s && s.querySelector('.runhead em');
  return rh && rh.textContent.trim() ? rh.textContent.trim() : (i === 0 ? 'Front page' : 'Page ' + (i + 1));
}
function copyCanvases(src, dst){
  var a = src.querySelectorAll('canvas'), b = dst.querySelectorAll('canvas');
  for (var i = 0; i < b.length; i++) {
    b[i].width = a[i].width; b[i].height = a[i].height;
    try { b[i].getContext('2d').drawImage(a[i], 0, 0); } catch (e) {}
  }
}
function showStory(i){
  var el_ = document.getElementById('rdBody'), foot = document.getElementById('rdFoot');
  RD.i = Math.max(0, Math.min(RD.list.length - 1, i));
  var s = RD.list[RD.i];
  el_.innerHTML = '';
  var label = sectionLabel(s.node);
  if (label) el_.appendChild(txt('p', 'reader-section', label));
  s.nodes.forEach(function(node){
    var clone = node.cloneNode(true);
    copyCanvases(node, clone);
    [clone].concat([].slice.call(clone.querySelectorAll('[data-bid]'))).forEach(function(x){ x.removeAttribute('data-bid'); x.classList.remove('is-sel'); });
    el_.appendChild(clone);
  });
  document.getElementById('rdWhere').textContent = 'Page ' + (s.page + 1) + ' · ' + pageName(s.page) + ' · ' + (RD.i + 1) + ' of ' + RD.list.length;
  document.getElementById('rdPrev').disabled = RD.i === 0;
  document.getElementById('rdNext').disabled = RD.i === RD.list.length - 1;
  foot.innerHTML = '';
  var nx = RD.list[RD.i + 1];
  if (nx) {
    var b = el('button', 'reader-next'); b.type = 'button';
    b.appendChild(txt('span', null, 'Next story'));
    b.appendChild(txt('b', null, headlineOf(nx.node) + ' →'));
    b.addEventListener('click', function(){ showStory(RD.i + 1); });
    foot.appendChild(b);
  } else {
    var end = el('div', 'reader-end'); end.innerHTML = BRAND_BADGE;
    end.appendChild(txt('span', null, 'That’s the whole paper. See you tomorrow.'));
    foot.appendChild(end);
  }
  document.getElementById('rdScroll').scrollTop = 0;
  if (s.page !== idx) { idx = s.page; zoom = 1; panX = 0; panY = 0; apply(); paint(); }
}
function openReader(node){
  ensureBuilt(N - 1);                             // the reader goes through the whole paper
  RD.list = storyNodes();
  if (!RD.list.length) return;
  var i = node ? Math.max(0, storyIndexOf(node)) : 0;
  if (!node) for (var j = 0; j < RD.list.length; j++) if (RD.list[j].page === idx) { i = j; break; }
  PZ.release();
  RD.lastFocus = document.activeElement;
  var r = document.getElementById('reader');
  r.hidden = false; RD.open = true;
  document.body.classList.add('reading');
  stage.inert = true; document.querySelector('.bar').inert = true;
  showStory(i);
  document.getElementById('rdClose').focus({ preventScroll: true });
}
function closeReader(){
  if (!RD.open) return;
  RD.open = false;
  document.getElementById('reader').hidden = true;
  document.body.classList.remove('reading');
  stage.inert = false; document.querySelector('.bar').inert = false;
  if (RD.lastFocus && RD.lastFocus.focus) RD.lastFocus.focus({ preventScroll: true });
}
function wireReader(){
  document.getElementById('rdClose').addEventListener('click', closeReader);
  document.getElementById('rdPrev').addEventListener('click', function(){ showStory(RD.i - 1); });
  document.getElementById('rdNext').addEventListener('click', function(){ showStory(RD.i + 1); });
  document.getElementById('readBtn').addEventListener('click', function(){ openReader(null); });
  var sc = document.getElementById('rdScroll'), sw = null;
  sc.addEventListener('pointerdown', function(e){ sw = { x: e.clientX, y: e.clientY, t: Date.now() }; });
  sc.addEventListener('pointerup', function(e){
    if (!sw) return;
    var dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    if (Math.abs(dx) > 70 && Math.abs(dy) < Math.abs(dx) * 0.6 && Date.now() - sw.t < 800) showStory(RD.i + (dx < 0 ? 1 : -1));
    sw = null;
  });
  sc.addEventListener('pointercancel', function(){ sw = null; });
}
/* Double-tap: zoom to fit the column under the finger; double-tap again to come back out. */
function zoomAt(x, y){
  if (zoom > 1.4) { glide(); setZoom(1, false); return; }
  var face = sheets[idx] && sheets[idx].firstChild; if (!face) return;
  var s = fit * zoom, fr = face.getBoundingClientRect();
  var hit = document.elementFromPoint(x, y), col = hit && hit.closest && hit.closest('.col, .strip > .cell');
  var py = (y - fr.top) / s, cx = (x - fr.left) / s, z = 2.2;
  var multi = hit && hit.closest && hit.closest('.cols2, .cols3, .classi');
  if (multi && face.contains(multi)) {
    // inside newspaper-style text columns: zoom to the one narrow column that was tapped
    var mr = multi.getBoundingClientRect(), n = multi.classList.contains('cols3') ? 3 : 2;
    var gap = (multi.classList.contains('classi') ? 9 : 11) * s, cw = (mr.width - gap * (n - 1)) / n;
    var k = Math.max(0, Math.min(n - 1, Math.floor((x - mr.left) / (cw + gap))));
    z = stage.clientWidth * 0.96 / (cw / s * fit);
    cx = (mr.left + k * (cw + gap) - fr.left) / s + cw / s / 2;
  } else if (col && face.contains(col)) {
    var cr = col.getBoundingClientRect(), w = cr.width / s;
    z = stage.clientWidth * 0.96 / (w * fit);
    cx = (cr.left - fr.left) / s + w / 2;
  }
  // fill the screen with the column, but keep story text between ~15px and ~20px
  var cap = 20 / (9.4 * fit), floor = Math.min(cap, Math.max(1.6, 15 / (9.4 * fit)));
  zoom = Math.max(floor, Math.min(z, cap, maxZoom()));
  panX = -(cx - PAGE_W / 2) * fit * zoom;
  panY = -(py - pageH() / 2) * fit * zoom;
  glide(); apply();
}
/* Phones: when the keyboard opens over a puzzle, slide the grid so the square being typed stays visible. */
function keepCellVisible(){
  if (!PZ.active || !PZ.active.root) return;
  var cell = PZ.active.root.querySelector('.sel'); if (!cell) return;
  var vv = window.visualViewport, top = vv ? vv.offsetTop : 0, h = vv ? vv.height : window.innerHeight;
  var r = cell.getBoundingClientRect();
  if (r.top >= top + 12 && r.bottom <= top + h - 12) return;
  panY += (top + h * 0.35) - (r.top + r.height / 2);
  apply(true);
}
function showHint(){
  if (store('hint-v1')) return;
  store('hint-v1', 1);
  var t = document.getElementById('toast');
  t.textContent = COARSE ? 'Tap any story to read it in large type. Double-tap a column to zoom in.' : 'Click any story to read it in large type. Double-click a column to zoom in.';
  t.hidden = false;
  setTimeout(function(){ t.classList.add('show'); }, 60);
  setTimeout(function(){ t.classList.remove('show'); setTimeout(function(){ t.hidden = true; }, 400); }, 7000);
}

/* =========================================================
   VIEW — the desk, the sheets, and every reading control
   ========================================================= */
var SHELL =
  '<div class="stage" id="stage"><div class="book" id="book"><div class="stack" aria-hidden="true"><i></i><i></i></div></div></div>' +
  '<div class="bar"><div class="brandmark" aria-hidden="true">' + BRAND_WORDMARK_DARK + '</div>' +
    '<div class="grp"><button class="ctl" id="prev" aria-label="Previous page">&#8592;</button>' +
    '<span class="readout" id="pageRead">Page 1</span><span class="dots" id="dots" aria-hidden="true"></span>' +
    '<button class="ctl" id="next" aria-label="Next page">&#8594;</button></div>' +
    '<div class="grp"><button class="ctl read" id="readBtn"><span class="long">Read stories</span><span class="short">Read</span></button></div>' +
    '<div class="grp"><button class="ctl" id="zoomOut" aria-label="Zoom out">&#8722;</button>' +
    '<span class="readout" id="zoomRead">100%</span><button class="ctl" id="zoomIn" aria-label="Zoom in">+</button>' +
    '<button class="ctl" id="fitBtn"><span class="long">Fit page</span><span class="short">Fit</span></button></div>' +
    '<input id="pzInput" type="text" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" aria-label="Puzzle answer input">' +
    '<div class="grp"><button class="ctl" id="foldBtn" aria-pressed="false"><span class="long">Fold in half</span><span class="short">Fold</span></button></div>' +
    '<p class="hint"><kbd>&#8592;</kbd> <kbd>&#8594;</kbd> turn pages &nbsp;&middot;&nbsp; <kbd>+</kbd> <kbd>&#8722;</kbd> zoom &nbsp;&middot;&nbsp; ' +
    '<kbd>0</kbd> fit &nbsp;&middot;&nbsp; <kbd>F</kbd> fold / flip &nbsp;&middot;&nbsp; click a story to read it &nbsp;&middot;&nbsp; drag a page to turn it, double-click a column to zoom</p>' +
  '</div>' +
  '<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>' +
  '<div class="reader" id="reader" role="dialog" aria-modal="true" aria-labelledby="rdWhere" hidden>' +
    '<div class="reader-bar"><button class="ctl" id="rdClose" aria-label="Back to the paper">&#215;</button>' +
    '<span class="rd-where" id="rdWhere"></span>' +
    '<button class="ctl" id="rdPrev" aria-label="Previous story">&#8592;</button><button class="ctl" id="rdNext" aria-label="Next story">&#8594;</button></div>' +
    '<div class="reader-scroll" id="rdScroll"><article class="reader-sheet" id="rdBody"></article><div class="reader-foot" id="rdFoot"></div></div>' +
  '</div>';

var PAGE_W = 800, PAGE_H = 1120, FOLD_H = 566;
var stage, book, prevBtn, nextBtn, pageRead, zoomRead, dots, foldBtn;
var sheets = [], N = 0, idx = 0, zoom = 1, fit = 1, panX = 0, panY = 0, folded = false;

function mountShell(){
  document.body.insertAdjacentHTML('afterbegin', SHELL);
  stage = document.getElementById('stage'); book = document.getElementById('book');
  prevBtn = document.getElementById('prev'); nextBtn = document.getElementById('next');
  pageRead = document.getElementById('pageRead'); zoomRead = document.getElementById('zoomRead');
  dots = document.getElementById('dots'); foldBtn = document.getElementById('foldBtn');
  PZ.input = document.getElementById('pzInput');
  wireInput();
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) document.body.classList.add('reduced');
}

function buildSheets(issue){
  PZ.release();
  finishCurl();                                   // never leave a half-turned page behind a redraw
  sheets.forEach(function(s){ s.remove(); });
  BID = 0; BIDMAP = {}; LIVE_NODES = []; NEWS.used = {};
  var pages = clipOrder(issue.pages || []), m = issue.masthead || {};     // clipped pages come first
  NEWS.pages = pages;
  NEWS.fontsPending = !!(document.fonts && document.fonts.status !== 'loaded');
  BUILD = { gen: BUILD.gen + 1, next: 0, pages: pages, m: m, issue: issue };
  // a blank sheet for every page first; pages are drawn in order (each news page is fitted
  // before the next picks its stories), the page being read straight away and the rest
  // one per background step, so the phone never freezes for long
  sheets = pages.map(function(){ var s = el('div', 'sheet pending', '<div class="face"><div class="paper"></div></div>'); book.appendChild(s); return s; });
  N = sheets.length;
  idx = Math.max(0, Math.min(idx, N - 1));
  dots.innerHTML = '';
  for (var d = 0; d < N; d++) dots.appendChild(document.createElement('b'));
  ensureBuilt(hooks.lazyPages ? idx : N - 1);
  paint();
  if (BUILD.next < N) schedulePages(BUILD.gen);
}
var BUILD = { gen: 0, next: 0, pages: [], m: {}, issue: null };
function buildPageAt(i){
  var p = BUILD.pages[i], s = renderPage(p, i, BUILD.pages.length, BUILD.m, BUILD.issue);
  sheets[i].replaceWith(s); sheets[i] = s;
  if (p.news) fitNewsSheet(s);
  decoratePageClip(s, p, i);
  applyLive(s);
}
/* Draw every page up to and including k (in order), now. */
function ensureBuilt(k){
  k = Math.min(k, N - 1);
  if (BUILD.next > k) return;
  while (BUILD.next <= k) buildPageAt(BUILD.next++);
  if (book) paint();
}
function schedulePages(gen){
  var later = window.requestIdleCallback ? function(f){ requestIdleCallback(f, { timeout: 250 }); } : function(f){ setTimeout(f, 16); };
  later(function(){
    if (gen !== BUILD.gen || BUILD.next >= N) return;
    var t0 = performance.now();
    do { buildPageAt(BUILD.next++); } while (BUILD.next < N && performance.now() - t0 < 8);
    paint();
    if (BUILD.next < N) schedulePages(gen);
  });
}
function pageH(){ return folded ? FOLD_H : PAGE_H; }
function clampPan(){
  var vw = stage.clientWidth, vh = stage.clientHeight;
  var mx = Math.max(0, (PAGE_W * fit * zoom - vw) / 2) + 24, my = Math.max(0, (pageH() * fit * zoom - vh) / 2) + 24;
  panX = Math.min(mx, Math.max(-mx, panX)); panY = Math.min(my, Math.max(-my, panY));
}
function apply(loose){
  if (!loose) clampPan();
  book.style.transform = 'translate(-50%,-50%) translate(' + panX.toFixed(1) + 'px,' + panY.toFixed(1) + 'px) scale(' + (fit * zoom).toFixed(4) + ')';
  zoomRead.textContent = Math.round(zoom * 100) + '%';
  stage.classList.toggle('pannable', zoom > 1.02);
}
function glide(){
  if (document.body.classList.contains('reduced')) return;
  book.classList.add('glide'); clearTimeout(glide.t); glide.t = setTimeout(function(){ book.classList.remove('glide'); }, 480);
}
function measure(){
  book.style.height = pageH() + 'px';
  fit = Math.min((stage.clientWidth - 28) / PAGE_W, (stage.clientHeight - 28) / pageH());
  if (!isFinite(fit) || fit <= 0) fit = 1;
  apply();
}
function paint(){
  if (DAILY.openGate && sheets[idx] && sheets[idx].querySelector('.pz, .pz-daily')) DAILY.openGate();   // on the puzzles page: fetch their words now
  sheets.forEach(function(sh, i){
    sh.classList.toggle('turned', i < idx);
    sh.classList.toggle('buried', i > idx + 1);
    sh.style.zIndex = i < idx ? (20 + i) : (10 - i);
    sh.querySelectorAll('.corner').forEach(function(b){ b.disabled = i !== idx; });
    sh.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
    if ('inert' in sh) sh.inert = i !== idx;
  });
  pageRead.innerHTML = N ? '<span class="long">Page </span>' + (idx + 1) + '<span class="long"> of </span><span class="short">/</span>' + N : 'No pages';
  prevBtn.disabled = idx === 0; nextBtn.disabled = idx >= N - 1;
  [].forEach.call(dots.children, function(b, i){ b.className = (i === idx ? 'on' : '') + (sheets[i] && sheets[i].querySelector('.page-clip.on') ? ' clipped' : ''); });
  if (hooks.onPage) hooks.onPage(idx);
}
function go(step){
  var t = Math.min(N - 1, Math.max(0, idx + step));
  if (t === idx) return;
  ensureBuilt(t);
  if (folded && foldSide === 'bottom') setFold(true, 'top');
  PZ.release();
  if (Math.abs(t - idx) === 1 && animateTurn(t - idx)) return;
  finishCurl();
  idx = t; zoom = 1; panX = 0; panY = 0; glide(); apply(); paint();
}
function goTo(i){ go(i - idx); }
function setZoom(z, keepPan){
  zoom = Math.min(maxZoom(), Math.max(0.5, z));
  if (!keepPan && zoom <= 1.02) { panX = 0; panY = 0; }
  apply();
}
/* Folded, the paper shows one half at a time: the top, or (flipped over) the bottom. */
var foldSide = 'top';
function setFold(on, side){
  folded = on; foldSide = on && side === 'bottom' ? 'bottom' : 'top';
  foldBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  foldBtn.innerHTML = !on ? '<span class="long">Fold in half</span><span class="short">Fold</span>'
    : foldSide === 'top' ? '<span class="long">See the bottom half</span><span class="short">Bottom</span>'
    : '<span class="long">Open the paper</span><span class="short">Open</span>';
  book.classList.add('folding'); book.classList.toggle('folded', on); book.classList.toggle('folded-bottom', foldSide === 'bottom');
  panX = 0; panY = 0; measure();
}
/* The Fold button and the F key: fold (top half) → the bottom half → open again. */
function cycleFold(){ if (!folded) setFold(true, 'top'); else if (foldSide === 'top') setFold(true, 'bottom'); else setFold(false); }
function focusOn(node){
  var s = fit * zoom, face = sheets[idx] && sheets[idx].firstChild; if (!face) return;
  var nr = node.getBoundingClientRect(), fr = face.getBoundingClientRect();
  if (nr.width >= Math.min(stage.clientWidth * 0.8, 440)) return;
  // grids are shown square-ish; the word game shows whole, keyboard included
  var x = (nr.left - fr.left) / s, y = (nr.top - fr.top) / s, w = nr.width / s, h = node.classList.contains('pz-wd') ? nr.height / s : Math.min(nr.height / s, w * 1.25);
  zoom = Math.max(1, Math.min(maxZoom(), (stage.clientWidth * 0.94) / (w * fit), (stage.clientHeight * 0.94) / (h * fit)));
  panX = -(x + w / 2 - PAGE_W / 2) * fit * zoom;
  panY = -(y + h / 2 - pageH() / 2) * fit * zoom;
  glide(); apply();
}
/* Story text is 9.4px on the page; let zoom reach about 24px on any screen. */
function maxZoom(){ return Math.max(4, 24 / (9.4 * fit)); }
function isEditing(){ return document.body.classList.contains('editing'); }

/* =========================================================
   PAGE CURL: turning a page bends it like newsprint.
   The fold line follows the finger (it is the line halfway between
   the page's corner and where the corner is being pulled to). The
   part past the fold flips over, showing the back of the sheet with
   faint ink showing through, shaded where it curves, and casts a
   soft shadow on the page underneath. The spine holds the paper,
   so the corner can never be pulled further than the page is wide.
   ========================================================= */
var CURL = null, curlEls = null;
function curlLayer(){
  if (curlEls && curlEls.root.parentNode === book) return curlEls;
  var root = el('div', 'curl'); root.setAttribute('aria-hidden', 'true'); root.hidden = true;
  var cast = el('div', 'curl-cast'), castStrip = el('div', 'curl-strip curl-cast-strip');
  var wrap = el('div', 'curl-flap-wrap'), flap = el('div', 'curl-flap'), ink = el('div', 'curl-ink'), shade = el('div', 'curl-strip curl-shade');
  cast.appendChild(castStrip); flap.appendChild(ink); flap.appendChild(shade); wrap.appendChild(flap);
  root.appendChild(cast); root.appendChild(wrap); book.appendChild(root);
  curlEls = { root: root, cast: cast, castStrip: castStrip, wrap: wrap, flap: flap, ink: ink, shade: shade };
  return curlEls;
}
/* Keep the part of a polygon on one side of the fold line. */
function clipHalf(poly, M, n, cornerSide){
  var out = [];
  function side(p){ var v = (p[0] - M.x) * n.x + (p[1] - M.y) * n.y; return cornerSide ? v : -v; }
  for (var i = 0; i < poly.length; i++) {
    var a = poly[i], b = poly[(i + 1) % poly.length], sa = side(a), sb = side(b);
    if (sa >= 0) out.push(a);
    if ((sa >= 0) !== (sb >= 0)) { var t = sa / (sa - sb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}
function polyCss(pts){
  if (pts.length < 3) return 'polygon(0 0, 0 0, 0 0)';
  return 'polygon(' + pts.map(function(p){ return p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px'; }).join(', ') + ')';
}
function setClip(node, v){ node.style.clipPath = v; node.style.webkitClipPath = v; }
/* The spine holds the sheet: the corner stays within a page-width of the spine. */
function constrainCorner(P, C){
  var H = pageH(), near = { x: 0, y: C.y }, far = { x: 0, y: C.y === 0 ? H : 0 }, D = Math.hypot(PAGE_W, H);
  var dx = P.x - near.x, dy = P.y - near.y, d = Math.hypot(dx, dy);
  if (d > PAGE_W) { P.x = near.x + dx / d * PAGE_W; P.y = near.y + dy / d * PAGE_W; }
  dx = P.x - far.x; dy = P.y - far.y; d = Math.hypot(dx, dy);
  if (d > D) { P.x = far.x + dx / d * D; P.y = far.y + dy / d * D; }
  return P;
}
function drawCurl(c){
  var E = curlLayer(), face = c.sheet.firstChild, C = c.C, P = c.P;
  var nx = C.x - P.x, ny = C.y - P.y, len = Math.hypot(nx, ny);
  if (len < 0.5) { setClip(face, ''); E.root.hidden = true; return; }
  nx /= len; ny /= len;
  var M = { x: (C.x + P.x) / 2, y: (C.y + P.y) / 2 }, rect = [[0, 0], [PAGE_W, 0], [PAGE_W, PAGE_H], [0, PAGE_H]];
  var front = clipHalf(rect, M, { x: nx, y: ny }, false), folded = clipHalf(rect, M, { x: nx, y: ny }, true);
  setClip(face, polyCss(front));
  E.root.hidden = false;
  // mirror the folded part across the fold line
  var dx = -ny, dy = nx, a = dx * dx - dy * dy, b = 2 * dx * dy, d2 = dy * dy - dx * dx;
  var e = M.x - (a * M.x + b * M.y), f = M.y - (b * M.x + d2 * M.y);
  E.flap.style.transform = 'matrix(' + [a, b, b, d2, e, f].map(function(v){ return v.toFixed(5); }).join(',') + ')';
  setClip(E.flap, polyCss(folded));
  setClip(E.cast, polyCss(folded));
  // light and shadow along the fold
  var ang = Math.atan2(-nx, ny) * 180 / Math.PI;
  var tf = 'translate(' + M.x.toFixed(1) + 'px,' + M.y.toFixed(1) + 'px) rotate(' + ang.toFixed(3) + 'deg) translate(-1600px,0)';
  E.shade.style.transform = tf; E.castStrip.style.transform = tf;
  var lift = Math.min(1, len / 160);
  E.shade.style.opacity = (0.5 + 0.5 * lift).toFixed(3);
  E.castStrip.style.opacity = lift.toFixed(3);
  E.wrap.style.setProperty('--lift', lift.toFixed(3));
}
function pageCoords(x, y){
  var r = book.getBoundingClientRect(), s = fit * zoom;
  return { x: (x - r.left) / s, y: (y - r.top) / s };
}
/* dir 'fwd' turns the sheet away; 'back' brings an already-turned sheet back. */
function startCurl(sheet, dir, corner){
  ensureBuilt(sheets.indexOf(sheet) + 1);           // the page underneath must be drawn
  var H = pageH(), Cy = corner === 'top' ? 0 : H;
  var C = { x: PAGE_W, y: Cy }, home = dir === 'fwd' ? { x: C.x, y: C.y } : { x: -PAGE_W, y: Cy };
  var E = curlLayer();
  E.ink.innerHTML = '';
  var paper = sheet.querySelector('.paper');
  if (paper) { var ink = paper.cloneNode(true); copyCanvases(paper, ink); E.ink.appendChild(ink); }
  E.root.classList.remove('fading');
  sheet.classList.remove('turned', 'buried');
  sheet.classList.add('curling');
  var i = sheets.indexOf(sheet), under = dir === 'fwd' ? sheets[i + 1] : sheets[i + 1];
  if (under) { under.classList.remove('buried'); under.classList.add('under'); }
  sheet.style.zIndex = '60';
  CURL = { sheet: sheet, dir: dir, C: C, P: { x: home.x, y: home.y }, T: { x: home.x, y: home.y }, V: { x: 0, y: 0 }, mode: 'drag', commitIdx: null };
  drawCurl(CURL);
  curlLoop();
  return CURL;
}
function curlLoop(){
  if (!CURL || CURL.raf) return;
  var last = performance.now();
  CURL.raf = requestAnimationFrame(function step(now){
    var c = CURL; if (!c) return;
    var dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now;
    if (c.mode === 'drag') {
      // the paper follows the finger with a touch of lag, like something with a little weight
      var k = 1 - Math.exp(-dt * 26);
      c.P.x += (c.T.x - c.P.x) * k; c.P.y += (c.T.y - c.P.y) * k;
    } else if (c.mode === 'spring') {
      var K = 190, damp = 2 * Math.sqrt(K) * 0.8;
      c.V.x += (-K * (c.P.x - c.T.x) - damp * c.V.x) * dt; c.V.y += (-K * (c.P.y - c.T.y) - damp * c.V.y) * dt;
      c.P.x += c.V.x * dt; c.P.y += c.V.y * dt;
      if (Math.hypot(c.P.x - c.T.x, c.P.y - c.T.y) < 0.8 && Math.hypot(c.V.x, c.V.y) < 12) { c.P.x = c.T.x; c.P.y = c.T.y; c.done = true; }
    } else if (c.mode === 'path') {
      // a hand turning the page: the corner lifts in an arc as it crosses
      var u = Math.min(1, (now - c.t0) / c.dur), s = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      c.P.x = c.from.x + (c.to.x - c.from.x) * s;
      c.P.y = c.from.y + (c.to.y - c.from.y) * s + (c.C.y === 0 ? 1 : -1) * Math.sin(Math.PI * s) * pageH() * 0.16;
      if (u >= 1) c.done = true;
    }
    if (!c.done) constrainCorner(c.P, c.C);
    drawCurl(c);
    if (c.done) { endCurl(); return; }
    c.raf = requestAnimationFrame(step);
  });
}
function endCurl(){
  var c = CURL; if (!c) return;
  if (c.raf) cancelAnimationFrame(c.raf);
  CURL = null;
  var E = curlLayer();
  setClip(c.sheet.firstChild, '');
  c.sheet.style.zIndex = '';
  c.sheet.classList.remove('curling');
  sheets.forEach(function(s){ s.classList.remove('under'); });
  var flappedAway = c.P.x < 0;           // the sheet ended up turned over, lying left of the spine
  if (c.commitIdx != null) { idx = c.commitIdx; zoom = 1; panX = 0; panY = 0; apply(); }
  paint();
  if (flappedAway) {
    E.root.classList.add('fading');
    setTimeout(function(){ if (!CURL) { E.root.hidden = true; E.root.classList.remove('fading'); E.ink.innerHTML = ''; } }, 260);
  } else { E.root.hidden = true; E.ink.innerHTML = ''; }
}
/* Finish whatever turn is in progress straight away (a new turn was asked for). */
function finishCurl(){
  var c = CURL; if (!c) return;
  if (c.mode === 'path') { c.P.x = c.to.x; c.P.y = c.to.y; }
  else if (c.mode === 'spring') { c.P.x = c.T.x; c.P.y = c.T.y; }
  else { c.commitIdx = null; c.P.x = c.dir === 'fwd' ? c.C.x : -PAGE_W; c.P.y = c.C.y; }
  endCurl();
}
/* Buttons, keys and corners: turn by one page with the curl. */
function animateTurn(step){
  finishCurl();
  var reducedMotion = document.body.classList.contains('reduced');
  // no animation frames come while the tab is hidden: turn straight away instead
  if (reducedMotion || document.hidden || (step > 0 ? idx >= N - 1 : idx <= 0)) return false;
  if (zoom > 1.02) { zoom = 1; panX = 0; panY = 0; glide(); apply(); }
  var c, H = pageH();
  if (step > 0) { c = startCurl(sheets[idx], 'fwd', 'bottom'); c.from = { x: PAGE_W, y: H }; c.to = { x: -PAGE_W, y: H }; c.commitIdx = idx + 1; }
  else { c = startCurl(sheets[idx - 1], 'back', 'bottom'); c.from = { x: -PAGE_W, y: H }; c.to = { x: PAGE_W, y: H }; c.commitIdx = idx - 1; }
  c.mode = 'path'; c.t0 = performance.now(); c.dur = 760;
  return true;
}

function wireView(){
  document.addEventListener('visibilitychange', function(){ if (document.hidden) finishCurl(); });
  prevBtn.addEventListener('click', function(){ go(-1); });
  nextBtn.addEventListener('click', function(){ go(1); });
  document.getElementById('zoomIn').addEventListener('click', function(){ glide(); setZoom(zoom * 1.25, true); });
  document.getElementById('zoomOut').addEventListener('click', function(){ glide(); setZoom(zoom / 1.25, false); });
  document.getElementById('fitBtn').addEventListener('click', function(){ PZ.release(); glide(); setZoom(1, false); });
  foldBtn.addEventListener('click', cycleFold);
  var tapTimer = null, lastTap = null;
  book.addEventListener('click', function(e){
    if (isEditing() || stage.__justDragged) return;
    var c = e.target.closest('.corner'); if (c) { go(parseInt(c.dataset.nav, 10)); return; }
    var pc = e.target.closest('.page-clip'); if (pc) { finishCurl(); togglePageClip(pc); return; }
    if (e.target.closest('.folded-edge')) { setFold(true, foldSide === 'top' ? 'bottom' : 'top'); return; }
    if (e.target.closest('[data-pz], .wx-locate')) return;
    var gt = e.target.closest('[data-goto]');
    if (gt && zoom <= 1.02) { goTo(parseInt(gt.dataset.goto, 10)); return; }
    var now = Date.now(), x = e.clientX, y = e.clientY;
    clearTimeout(tapTimer);
    if (lastTap && now - lastTap.t < 320 && Math.hypot(x - lastTap.x, y - lastTap.y) < 40) { lastTap = null; zoomAt(x, y); return; }
    lastTap = { t: now, x: x, y: y };
    var block = e.target.closest('.col > .block, .strip > .cell > .block');
    if (!block || zoom > 1.02) return;          // zoomed in, you're reading the page itself
    tapTimer = setTimeout(function(){ lastTap = null; var n = readableFrom(block); if (n) openReader(n); }, 300);
  });
  book.addEventListener('pointerdown', function(e){
    if (isEditing()) return;
    var p = e.target.closest('[data-pz]');
    if (p) focusOn(p);
    else if (PZ.active && !e.target.closest('button')) PZ.release();
  }, true);

  /* no copying off the paper */
  ['copy', 'cut', 'contextmenu', 'dragstart', 'selectstart'].forEach(function(ev){
    stage.addEventListener(ev, function(e){ e.preventDefault(); });
  });
  document.addEventListener('copy', function(e){
    var t = e.target;
    if (t === PZ.input || (t && t.closest && t.closest('.ed'))) return;
    var s = window.getSelection && window.getSelection();
    if (s && s.anchorNode && s.anchorNode.parentElement && s.anchorNode.parentElement.closest('.ed')) return;
    e.preventDefault();
  });

  stage.addEventListener('wheel', function(e){
    e.preventDefault();
    if (e.ctrlKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX)) setZoom(zoom * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), true);
    else { panX -= e.deltaX; apply(); }
  }, { passive: false });
  /* iOS Safari: keep its own page zoom out of the paper (the reader still allows it) */
  ['gesturestart', 'gesturechange'].forEach(function(ev){
    document.addEventListener(ev, function(e){ if (!(e.target.closest && e.target.closest('.reader'))) e.preventDefault(); }, { passive: false });
  });
  if (window.visualViewport) { visualViewport.addEventListener('resize', keepCellVisible); visualViewport.addEventListener('scroll', keepCellVisible); }
  wireReader();

  /* drag: turn the page by hand, pan when zoomed, pinch to zoom */
  var pts = {}, g = null, pinch = null;
  /* Grab the page anywhere: the nearest corner (top or bottom) does the turning. */
  function beginTurn(dx){
    finishCurl();
    if (folded && foldSide === 'bottom') { g.mode = 'none'; go(dx < 0 ? 1 : -1); return; }   // from the bottom half: the next page opens at its top
    var start = pageCoords(g.x, g.y), corner = start.y < pageH() / 2 ? 'top' : 'bottom';
    if (dx < 0) {
      if (idx < N - 1) g.mode = 'fwd';
      else g.mode = 'edge';                                    // last page: a little give, then it springs back
      var c = startCurl(sheets[idx], 'fwd', corner);
      g.offset = { x: c.C.x - start.x, y: c.C.y - start.y };
    } else if (dx > 0 && idx > 0) {
      g.mode = 'back';
      startCurl(sheets[idx - 1], 'back', corner);
      g.start = start;
    } else { g.mode = 'none'; return; }
    PZ.release();
  }
  function dragTurn(e){
    var c = CURL; if (!c) return;
    var p = pageCoords(e.clientX, e.clientY);
    if (g.mode === 'back') { c.T.x = -PAGE_W + (p.x - g.start.x) * 2; c.T.y = c.C.y + (p.y - g.start.y); }
    else {
      c.T.x = p.x + g.offset.x; c.T.y = p.y + g.offset.y;
      if (g.mode === 'edge') c.T.x = Math.max(c.T.x, PAGE_W - 90);
    }
  }
  function endTurn(){
    var c = CURL; if (!c) return;
    if (performance.now() - g.lt > 90) g.vx = 0;              // held still before letting go: no flick
    var commit;
    if (g.mode === 'fwd') commit = c.P.x < PAGE_W * 0.3 || g.vx < -0.4;
    else if (g.mode === 'back') commit = c.P.x > -PAGE_W * 0.3 || g.vx > 0.4;
    else commit = false;
    if (g.mode === 'back') c.T = commit ? { x: c.C.x, y: c.C.y } : { x: -PAGE_W, y: c.C.y };
    else c.T = commit ? { x: -PAGE_W, y: c.C.y } : { x: c.C.x, y: c.C.y };
    c.commitIdx = commit ? idx + (g.mode === 'back' ? -1 : 1) : null;
    c.V = { x: g.vx * 1000 / (fit * zoom) * 0.5, y: 0 };      // carry the flick into the spring
    c.mode = 'spring';
  }
  stage.addEventListener('pointerdown', function(e){
    if (e.button > 0) return;
    var onButton = e.target.closest('button') && !e.target.closest('.corner');   // page corners are for grabbing
    if (!isEditing() && (e.target.closest('[data-pz], input') || onButton)) return;
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(pts);
    if (ids.length === 2) {
      if (g && (g.mode === 'fwd' || g.mode === 'back' || g.mode === 'edge')) endTurn();
      var a = pts[ids[0]], b = pts[ids[1]];
      pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom: zoom }; g = null; return;
    }
    g = { x: e.clientX, y: e.clientY, px: panX, py: panY, mode: null, lx: e.clientX, lt: performance.now(), vx: 0, angle: 0 };
  });
  stage.addEventListener('pointermove', function(e){
    if (!pts[e.pointerId]) return;
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (pinch) {
      var ids = Object.keys(pts); if (ids.length < 2) return;
      var a = pts[ids[0]], b = pts[ids[1]];
      setZoom(pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinch.dist, true); return;
    }
    if (!g) return;
    var dx = e.clientX - g.x, dy = e.clientY - g.y, now = performance.now();
    g.vx = 0.7 * g.vx + 0.3 * ((e.clientX - g.lx) / Math.max(1, now - g.lt)); g.lx = e.clientX; g.lt = now;
    if (!g.mode) {
      if (Math.abs(dx) + Math.abs(dy) < 6) return;
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      if (zoom > 1.02) g.mode = 'pan';
      else if (Math.abs(dx) > Math.abs(dy) * 0.7) beginTurn(dx);
      else g.mode = 'none';
      g.dragged = true;
    }
    if (g.mode === 'pan') { panX = g.px + dx; panY = g.py + dy; stage.classList.add('grabbing'); apply(); }
    else if (g.mode === 'fwd' || g.mode === 'back' || g.mode === 'edge') dragTurn(e);
  });
  function release(e){
    delete pts[e.pointerId];
    if (pinch) { if (Object.keys(pts).length < 2) pinch = null; return; }
    if (!g) return;
    if (g.mode === 'fwd' || g.mode === 'back' || g.mode === 'edge') endTurn();
    if (g.dragged) { stage.__justDragged = true; setTimeout(function(){ stage.__justDragged = false; }, 0); }
    stage.classList.remove('grabbing');
    g = null;
  }
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);

  document.addEventListener('keydown', function(e){
    if (RD.open) {
      if (e.key === 'Escape') { e.preventDefault(); closeReader(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); showStory(RD.i + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); showStory(RD.i - 1); }
      return;
    }
    if (document.activeElement === PZ.input) return;
    var t = e.target;
    if (t && t.closest && (t.closest('.ed') || t.closest('.gate') || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); go(1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); go(-1); }
    else if (k === '+' || k === '=') { e.preventDefault(); glide(); setZoom(zoom * 1.25, true); }
    else if (k === '-' || k === '_') { e.preventDefault(); glide(); setZoom(zoom / 1.25, false); }
    else if (k === '0') { e.preventDefault(); glide(); setZoom(1, false); }
    else if (k === 'f' || k === 'F') { e.preventDefault(); cycleFold(); }
    else if (k === 'Home') { e.preventDefault(); go(-N); }
    else if (k === 'End') { e.preventDefault(); go(N); }
  });
  window.addEventListener('resize', measure);
}
