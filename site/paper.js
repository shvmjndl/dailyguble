(function(){"use strict";
/* Themes: presets, typefaces and colours. Pure data, shared by the browser and the server. */
var FONT_SPEC = {
  'UnifrakturMaguntia':'', 'UnifrakturCook':':wght@700', 'Grenze Gotisch':':wght@400;700', 'Pirata One':'',
  'Old Standard TT':':ital,wght@0,400;0,700;1,400', 'Playfair Display':':ital,wght@0,400;0,700;0,900;1,400;1,700',
  'Abril Fatface':'', 'Bodoni Moda':':ital,opsz,wght@0,6..96,400;0,6..96,700;0,6..96,900;1,6..96,400;1,6..96,700',
  'Libre Caslon Display':'', 'DM Serif Display':':ital@0;1', 'Libre Franklin':':ital,wght@0,400;0,600;0,700;0,900;1,400',
  'Oswald':':wght@400;500;600;700', 'Roboto Slab':':wght@400;700;900', 'Libre Baskerville':':ital,wght@0,400;0,700;1,400',
  'Source Serif 4':':ital,opsz,wght@0,8..60,400;0,8..60,700;1,8..60,400', 'PT Serif':':ital,wght@0,400;0,700;1,400',
  'Merriweather':':ital,wght@0,400;0,700;0,900;1,400', 'Lora':':ital,wght@0,400;0,700;1,400',
  'Crimson Pro':':ital,wght@0,400;0,700;1,400', 'Archivo Narrow':':ital,wght@0,400;0,500;0,600;0,700;1,400',
  'Roboto Condensed':':wght@400;500;600;700', 'IBM Plex Sans Condensed':':wght@400;500;600;700'
};
var FONTS = {
  plate: ['UnifrakturMaguntia','UnifrakturCook','Grenze Gotisch','Pirata One','Old Standard TT','Playfair Display','Abril Fatface','Bodoni Moda','Oswald'],
  head:  ['Bodoni Moda','Playfair Display','Libre Caslon Display','DM Serif Display','Old Standard TT','Abril Fatface','Libre Franklin','Oswald','Roboto Slab'],
  body:  ['Libre Baskerville','Source Serif 4','PT Serif','Merriweather','Lora','Crimson Pro','Old Standard TT'],
  util:  ['Archivo Narrow','Oswald','Roboto Condensed','Libre Franklin','IBM Plex Sans Condensed']
};
var FONT_ROLES = [['plate','Nameplate'],['head','Headlines'],['body','Story text'],['util','Labels and captions']];
var FALLBACK = { plate:'serif', head:'"Times New Roman",serif', body:'"Times New Roman",serif', util:'"Helvetica Neue",Arial,sans-serif' };
var PRESETS = {
  newsprint: { label:'Newsprint', note:'Grey-cream stock, black ink, red kickers',
    colors:{ paper:'#e7e1d1', paperLit:'#f0ead9', ink:'#17150f', inkSoft:'#4b443a', rule:'#b2a992', accent:'#95291c', cell:'#f3eee0', sel:'#e9c35a', hl:'#cdd9df', hlSoft:'#e2e5dc', pen:'#24486b' },
    fonts:{ plate:'UnifrakturMaguntia', head:'Bodoni Moda', body:'Libre Baskerville', util:'Archivo Narrow' } },
  pink: { label:'Pink sheet', note:'Salmon business paper with teal accents',
    colors:{ paper:'#f1d9c7', paperLit:'#f7e6d8', ink:'#211a16', inkSoft:'#5a4a40', rule:'#c9a48c', accent:'#0f5a72', cell:'#fbefe5', sel:'#f0c46a', hl:'#c9dde3', hlSoft:'#efdcd0', pen:'#0f4a60' },
    fonts:{ plate:'Old Standard TT', head:'Libre Caslon Display', body:'Source Serif 4', util:'Libre Franklin' } },
  sepia: { label:'Archive', note:'Yellowed stock from the bound volumes',
    colors:{ paper:'#dccca6', paperLit:'#e7dab9', ink:'#2a1d0f', inkSoft:'#5f4a30', rule:'#a88f62', accent:'#7a2e12', cell:'#ece2c8', sel:'#d9a441', hl:'#c8c4a3', hlSoft:'#d8cdaa', pen:'#3b2a6b' },
    fonts:{ plate:'UnifrakturCook', head:'Old Standard TT', body:'Crimson Pro', util:'Oswald' } },
  tabloid: { label:'Tabloid', note:'Bright paper, condensed headlines, red flash',
    colors:{ paper:'#eef0ee', paperLit:'#f8f9f7', ink:'#101418', inkSoft:'#47505a', rule:'#b9c0c6', accent:'#c4161c', cell:'#ffffff', sel:'#ffd23f', hl:'#cfe3f2', hlSoft:'#e6ecef', pen:'#163f8a' },
    fonts:{ plate:'Oswald', head:'Oswald', body:'PT Serif', util:'Roboto Condensed' } }
};
var COLOR_KEYS = [['paper','Paper'],['paperLit','Paper, light'],['ink','Ink'],['inkSoft','Soft ink'],['rule','Rules'],['accent','Accent'],
  ['cell','Puzzle squares'],['sel','Selected square'],['hl','Highlighted word'],['hlSoft','Highlighted row'],['pen','Reader’s pen']];
var COLOR_VAR = { paper:'--paper', paperLit:'--paper-lit', ink:'--ink', inkSoft:'--ink-soft', rule:'--rule', accent:'--press-red',
  cell:'--cell', sel:'--sel', hl:'--hl', hlSoft:'--hl-soft', pen:'--pen' };

function themeOf(issue){
  var t = issue.theme || {}, base = PRESETS[t.preset] || PRESETS.newsprint;
  return { preset: PRESETS[t.preset] ? t.preset : 'newsprint',
           colors: Object.assign({}, base.colors, t.colors || {}),
           fonts: Object.assign({}, base.fonts, t.fonts || {}) };
}
function fontsHref(families){
  var uniq = families.filter(function(f, i){ return f && families.indexOf(f) === i; });
  return 'https://fonts.googleapis.com/css2?' + uniq.map(function(f){ return 'family=' + f.replace(/ /g, '+') + (FONT_SPEC[f] || ''); }).join('&') + '&display=swap';
}

/* The Harbor Light logo, built into the page (generated from brand/*.svg). */
var BRAND_BADGE = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\" aria-hidden=\"true\" focusable=\"false\"><clipPath id=\"guble-disc\"><circle cx=\"256\" cy=\"256\" r=\"256\"/></clipPath><g clip-path=\"url(#guble-disc)\"><rect width=\"512\" height=\"512\" fill=\"#e7e1d1\"/><path d=\"M236 135 L40 65 L40 157 Z M276 135 L472 65 L472 157 Z\" fill=\"#f2b53c\" opacity=\".42\"/><path d=\"M204.0 392 L224.0 170 L288.0 170 L308.0 392 Z M202 170 h108 v-12 h-108 Z M220 158 V112 H292 V158 Z M210 112 L256 66 L302 112 Z\" fill=\"#17150f\"/><path d=\"M212.3 300 L216.6 252 L295.4 252 L299.7 300 Z\" fill=\"#95291c\"/><path d=\"M234 150 V120 H278 V150 Z\" fill=\"#f6d77a\"/><rect x=\"0\" y=\"392\" width=\"512\" height=\"14\" fill=\"#17150f\"/><path d=\"M64 420 q24 -14 48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0\" fill=\"none\" stroke=\"#17150f\" stroke-width=\"10\" stroke-linecap=\"round\"/><path d=\"M64 452 q24 -14 48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0\" fill=\"none\" stroke=\"#17150f\" stroke-width=\"10\" stroke-linecap=\"round\"/></g></svg>";
var BRAND_WORDMARK_DARK = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 703 284\" aria-hidden=\"true\" focusable=\"false\"><g transform=\"translate(33.2,196.0)\"><path d=\"M464.4 -152.2 L-11.0 -185.2 L-11.0 -143.9 Z\" fill=\"#f2b53c\" opacity=\".45\"/><path d=\"M58.96 57.2Q48.62 57.2 38.61 55.825Q28.6 54.45 20.405 51.480000000000004Q12.21 48.51 7.315 43.67Q2.42 38.83 2.42 31.9Q2.42 25.63 6.93 21.725Q11.44 17.82 17.985 15.73Q24.53 13.64 30.855 12.870000000000001Q37.18 12.1 40.92 12.1H41.36Q38.94 13.31 36.629999999999995 17.82Q34.32 22.330000000000002 34.32 28.49Q34.32 35.97 37.730000000000004 42.295Q41.14 48.62 48.400000000000006 52.36Q55.660000000000004 56.1 67.32000000000001 56.1Q73.48 56.1 80.795 54.89Q88.11 53.68 94.765 50.875Q101.42 48.07 105.71000000000001 43.230000000000004Q110.0 38.39 110.0 31.13Q110.0 22.99 104.995 19.14Q99.99 15.290000000000001 92.62 14.135000000000002Q85.25 12.98 78.1 12.98Q75.79 12.98 70.45500000000001 12.98Q65.12 12.98 59.785000000000004 12.98Q54.45 12.98 52.03 12.98Q33.11 12.98 21.285 7.425000000000001Q9.46 1.87 9.46 -10.78Q9.46 -18.59 14.025 -23.43Q18.59 -28.27 25.96 -30.965000000000003Q33.33 -33.660000000000004 41.8 -34.650000000000006Q50.27 -35.64 58.08 -35.64V-35.2Q55.33 -35.2 51.205 -34.925Q47.08 -34.65 42.955 -33.825Q38.83 -33.0 36.025 -31.515Q33.22 -30.03 33.22 -27.72Q33.22 -24.53 38.004999999999995 -23.21Q42.79 -21.89 51.81 -21.89Q55.660000000000004 -21.89 60.775000000000006 -21.945Q65.89 -22.0 70.785 -22.055Q75.68 -22.11 78.76 -22.11Q84.92 -22.11 91.85 -20.02Q98.78 -17.93 104.88499999999999 -13.254999999999999Q110.99 -8.58 114.84 -0.8799999999999999Q118.69 6.82 118.69 18.04Q118.69 29.04 114.125 36.575Q109.56 44.11 101.36500000000001 48.620000000000005Q93.17 53.13 82.33500000000001 55.165000000000006Q71.5 57.2 58.96 57.2ZM58.08 -35.2Q49.39 -35.2 40.480000000000004 -37.125Q31.57 -39.05 24.145 -43.12Q16.72 -47.19 12.209999999999999 -53.68Q7.7 -60.17 7.7 -69.3Q7.7 -78.43 12.209999999999999 -84.86500000000001Q16.72 -91.3 24.145 -95.37Q31.57 -99.44 40.480000000000004 -101.36500000000001Q49.39 -103.29 58.08 -103.29Q66.88 -103.29 75.735 -101.36500000000001Q84.59 -99.44 92.015 -95.37Q99.44 -91.3 103.94999999999999 -84.86500000000001Q108.46 -78.43 108.46 -69.3Q108.46 -60.17 103.94999999999999 -53.68Q99.44 -47.19 92.015 -43.12Q84.59 -39.05 75.735 -37.125Q66.88 -35.2 58.08 -35.2ZM58.08 -35.64Q60.72 -35.64 62.37 -40.425Q64.02 -45.21 64.78999999999999 -52.91Q65.56 -60.61 65.56 -69.3Q65.56 -79.09 64.78999999999999 -86.68Q64.02 -94.27 62.37 -98.56Q60.72 -102.85 58.08 -102.85Q55.44 -102.85 53.79 -98.56Q52.14 -94.27 51.370000000000005 -86.68Q50.6 -79.09 50.6 -69.3Q50.6 -60.61 51.150000000000006 -52.91Q51.7 -45.21 53.295 -40.425Q54.89 -35.64 58.08 -35.64ZM128.7 -62.59Q122.1 -62.59 117.095 -66.935Q112.09 -71.28 112.09 -79.2Q112.09 -87.23 117.20500000000001 -91.08000000000001Q122.32000000000001 -94.93 128.7 -94.93Q134.42 -94.93 140.03 -91.08000000000001Q145.64000000000001 -87.23 145.64000000000001 -80.19H145.42Q145.42 -88.44 138.70999999999998 -95.15Q132.0 -101.86 119.79 -101.86Q114.4 -101.86 108.79 -99.495Q103.18 -97.13 98.725 -91.905Q94.27 -86.68 92.07000000000001 -77.88L91.85 -77.99Q94.05 -87.23 98.56 -92.565Q103.07000000000001 -97.9 108.68 -100.1Q114.29 -102.3 119.79 -102.3Q128.48 -102.3 134.255 -99.0Q140.03 -95.7 142.945 -90.58500000000001Q145.86 -85.47 145.86 -80.19Q145.86 -70.73 140.58 -66.66Q135.3 -62.59 128.7 -62.59Z M195.8 2.2Q184.03 2.2 177.21 -2.145Q170.39000000000001 -6.49 167.47500000000002 -13.969999999999999Q164.56 -21.45 164.56 -31.02V-100.76H149.16V-101.2H206.36V-29.04Q206.36 -19.8 207.07500000000002 -15.4Q207.79000000000002 -11.0 209.495 -9.68Q211.2 -8.36 214.28000000000003 -8.36Q218.9 -8.36 222.2 -12.32Q225.5 -16.28 227.59 -22.770000000000003Q229.68 -29.26 230.67000000000002 -36.96Q231.66000000000003 -44.660000000000004 231.66000000000003 -52.14H232.10000000000002Q232.10000000000002 -43.67 230.78000000000003 -34.21Q229.46 -24.75 225.72000000000003 -16.5Q221.98000000000002 -8.25 214.775 -3.025Q207.57 2.2 195.8 2.2ZM231.66000000000003 0.0V-100.76H218.46V-101.2H273.46000000000004V-0.44H288.86V0.0Z M384.6700000000001 2.2Q369.6 2.2 360.855 -8.8Q352.11000000000007 -19.8 350.35 -40.04V0.0H293.15000000000003V-0.44H308.55000000000007V-164.56H293.15000000000003V-165.0H350.35V-61.27Q352.11000000000007 -81.4 360.74500000000006 -92.29Q369.38000000000005 -103.18 384.6700000000001 -103.18Q396.66 -103.18 407.33000000000004 -96.91Q418.00000000000006 -90.64 424.6550000000001 -78.87Q431.31000000000006 -67.1 431.31000000000006 -50.6Q431.31000000000006 -34.1 424.6550000000001 -22.275Q418.00000000000006 -10.45 407.33000000000004 -4.125Q396.66 2.2 384.6700000000001 2.2ZM374.77000000000004 -1.32Q378.51000000000005 -1.32 380.49 -6.6000000000000005Q382.47 -11.88 383.24 -22.770000000000003Q384.01000000000005 -33.660000000000004 384.01000000000005 -50.6Q384.01000000000005 -67.54 383.24 -78.375Q382.47 -89.21 380.49 -94.435Q378.51000000000005 -99.66 374.77000000000004 -99.66Q369.27000000000004 -99.66 363.605 -94.435Q357.94000000000005 -89.21 354.14500000000004 -78.375Q350.35 -67.54 350.35 -50.6Q350.35 -33.660000000000004 354.14500000000004 -22.770000000000003Q357.94000000000005 -11.88 363.605 -6.6000000000000005Q369.27000000000004 -1.32 374.77000000000004 -1.32Z M584.6500000000001 2.2Q568.0400000000001 2.2 555.2250000000001 -3.685Q542.4100000000001 -9.57 535.1500000000001 -21.285Q527.8900000000001 -33.0 527.8900000000001 -50.6Q527.8900000000001 -68.2 534.9850000000001 -79.91499999999999Q542.0800000000002 -91.63 554.7300000000001 -97.515Q567.3800000000001 -103.4 583.9900000000001 -103.4Q600.3800000000001 -103.4 611.7650000000001 -96.855Q623.1500000000001 -90.31 629.0900000000001 -79.75Q635.0300000000001 -69.19 635.0300000000001 -57.2H542.6300000000001V-57.64H593.0100000000001Q592.9000000000001 -65.78 592.6800000000001 -73.755Q592.4600000000002 -81.73 591.6350000000001 -88.385Q590.8100000000001 -95.04 588.9950000000001 -99.0Q587.1800000000001 -102.96 583.9900000000001 -102.96Q580.8000000000001 -102.96 578.6550000000001 -99.055Q576.5100000000001 -95.15 575.2450000000001 -88.385Q573.9800000000001 -81.62 573.4850000000001 -73.03999999999999Q572.9900000000001 -64.46 572.9900000000001 -55.0Q572.9900000000001 -43.12 573.815 -33.055Q574.6400000000001 -22.99 576.8950000000001 -15.62Q579.1500000000001 -8.25 583.2750000000001 -4.125Q587.4000000000001 0.0 593.8900000000001 0.0Q608.4100000000001 0.0 619.575 -8.745Q630.7400000000001 -17.49 634.8100000000001 -31.46H635.2500000000001Q630.9600000000002 -17.16 618.6400000000001 -7.48Q606.3200000000002 2.2 584.6500000000001 2.2Z\" fill=\"#e7e1d1\"/><path d=\"M442.1 0 L454.2 -138.6 L504.8 -138.6 L516.9 0 Z M439.1 -136.8 h81.0 v-8.8 h-81.0 Z M451.7 -144.8 V-159.6 H507.4 V-144.8 Z M448.2 -158.6 L479.5 -172.9 L510.9 -158.6 Z\" fill=\"#e7e1d1\"/><path d=\"M449.3 -82.5 L447.3 -59.4 L511.8 -59.4 L509.7 -82.5 Z\" fill=\"#95291c\"/><path d=\"M466.4 -147.4 V-157.0 H492.7 V-147.4 Z\" fill=\"#f6d77a\"/></g></svg>";

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
  var t = themeOf(issue), rs = document.documentElement.style;
  Object.keys(COLOR_VAR).forEach(function(k){ rs.setProperty(COLOR_VAR[k], t.colors[k]); });
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
  ['tomorrowWeather', 'Tomorrow’s weather'], ['dayAfterWeather', 'The day after'], ['weatherPlace', 'Where the weather is for']
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
function renderPage(page, i, N, m){
  var sheet = el('div', 'sheet'), face = el('div', 'face'), paper = el('div', 'paper');
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
      '<em>' + (rh.center || '') + '</em>' +
      '<span>' + (rh.right || ('Page ' + (i + 1))) + '</span>'));
  }
  var cols = page.columns || [];
  var grid = el('div', 'grid');
  grid.style.gridTemplateColumns = cols.map(function(c){ return (c.w || 1) + 'fr'; }).join(' ') || '1fr';
  cols.forEach(function(c){ c.blocks = c.blocks || []; var col = el('div', 'col'); renderBlocks(c.blocks, col); grid.appendChild(col); });
  paper.appendChild(grid);
  if (page.strip && page.strip.length) {
    var strip = el('div', 'strip');
    strip.style.gridTemplateColumns = page.strip.map(function(c){ return (c.w || 1) + 'fr'; }).join(' ');
    page.strip.forEach(function(c){ c.blocks = c.blocks || []; var cell = el('div', 'cell'); renderBlocks(c.blocks, cell); strip.appendChild(cell); });
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
var SKIP_READ = { crossword: 1, sudoku: 1, wordsearch: 1, rule: 1, sect: 1, kicker: 1 };
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
        var headed = (t === 'article' || t === 'head') && !!(info.block.head || info.block.text);
        var cont = CONTINUES[t] || (t === 'article' && !headed);
        if (headed && cur && !cur.headed && !cur.standalone) { cur.nodes.push(n); cur.headed = true; return; }
        if (cont && cur && !cur.standalone) { cur.nodes.push(n); return; }
        cur = { nodes: [n], node: n, page: pi, headed: headed, standalone: !headed && !cont };
        out.push(cur);
      });
    });
  });
  return out;
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
    '<kbd>0</kbd> fit &nbsp;&middot;&nbsp; <kbd>F</kbd> fold &nbsp;&middot;&nbsp; click a story to read it &nbsp;&middot;&nbsp; drag a page to turn it, double-click a column to zoom</p>' +
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
  BID = 0; BIDMAP = {}; LIVE_NODES = [];
  var pages = issue.pages || [], m = issue.masthead || {};
  sheets = pages.map(function(p, i){ return renderPage(p, i, pages.length, m); });
  sheets.forEach(function(s){ book.appendChild(s); applyLive(s); });
  N = sheets.length;
  idx = Math.max(0, Math.min(idx, N - 1));
  dots.innerHTML = '';
  for (var d = 0; d < N; d++) dots.appendChild(document.createElement('b'));
  paint();
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
  [].forEach.call(dots.children, function(b, i){ b.className = i === idx ? 'on' : ''; });
  if (hooks.onPage) hooks.onPage(idx);
}
function go(step){
  var t = Math.min(N - 1, Math.max(0, idx + step));
  if (t === idx) return;
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
function setFold(on){
  folded = on;
  foldBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  foldBtn.innerHTML = on ? '<span class="long">Open the paper</span><span class="short">Open</span>' : '<span class="long">Fold in half</span><span class="short">Fold</span>';
  book.classList.add('folding'); book.classList.toggle('folded', on);
  panX = 0; panY = 0; measure();
}
function focusOn(node){
  var s = fit * zoom, face = sheets[idx] && sheets[idx].firstChild; if (!face) return;
  var nr = node.getBoundingClientRect(), fr = face.getBoundingClientRect();
  if (nr.width >= Math.min(stage.clientWidth * 0.8, 440)) return;
  var x = (nr.left - fr.left) / s, y = (nr.top - fr.top) / s, w = nr.width / s, h = Math.min(nr.height / s, w * 1.25);
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
  if (reducedMotion || (step > 0 ? idx >= N - 1 : idx <= 0)) return false;
  if (zoom > 1.02) { zoom = 1; panX = 0; panY = 0; glide(); apply(); }
  var c, H = pageH();
  if (step > 0) { c = startCurl(sheets[idx], 'fwd', 'bottom'); c.from = { x: PAGE_W, y: H }; c.to = { x: -PAGE_W, y: H }; c.commitIdx = idx + 1; }
  else { c = startCurl(sheets[idx - 1], 'back', 'bottom'); c.from = { x: -PAGE_W, y: H }; c.to = { x: PAGE_W, y: H }; c.commitIdx = idx - 1; }
  c.mode = 'path'; c.t0 = performance.now(); c.dur = 760;
  return true;
}

function wireView(){
  prevBtn.addEventListener('click', function(){ go(-1); });
  nextBtn.addEventListener('click', function(){ go(1); });
  document.getElementById('zoomIn').addEventListener('click', function(){ glide(); setZoom(zoom * 1.25, true); });
  document.getElementById('zoomOut').addEventListener('click', function(){ glide(); setZoom(zoom / 1.25, false); });
  document.getElementById('fitBtn').addEventListener('click', function(){ PZ.release(); glide(); setZoom(1, false); });
  foldBtn.addEventListener('click', function(){ setFold(!folded); });
  var tapTimer = null, lastTap = null;
  book.addEventListener('click', function(e){
    if (isEditing() || stage.__justDragged) return;
    var c = e.target.closest('.corner'); if (c) { go(parseInt(c.dataset.nav, 10)); return; }
    if (e.target.closest('[data-pz], .wx-locate')) return;
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
    else if (k === 'f' || k === 'F') { e.preventDefault(); setFold(!folded); }
    else if (k === 'Home') { e.preventDefault(); go(-N); }
    else if (k === 'End') { e.preventDefault(); go(N); }
  });
  window.addEventListener('resize', measure);
}


/* =========================================================
   ALMANAC: worked out in the reader's own browser.
     date, sunrise, sunset, moon   calculated here, instantly
     tides                         NOAA tide predictions
     weather                       US National Weather Service, or Open-Meteo outside the US
   Results are cached in the browser, so a returning reader sees them at once
   and the free public services get one request per reader every half hour at most.
   ========================================================= */
var DEFAULT_LOCATION = { lat: 44.105, lon: -69.1017, timeZone: 'America/New_York', tideStation: '8415490', units: 'F' };
var TIDE_TTL = 6 * 3600000, WEATHER_TTL = 30 * 60000, POINTS_TTL = 30 * 86400000;

function locationOf(issue){
  var l = Object.assign({}, DEFAULT_LOCATION, (issue && issue.location) || {});
  l.lat = +l.lat; l.lon = +l.lon; l.units = l.units === 'C' ? 'C' : 'F';
  try { new Intl.DateTimeFormat('en-US', { timeZone: l.timeZone }); } catch (e) { l.timeZone = DEFAULT_LOCATION.timeZone; }
  return l;
}
function datePartsIn(when, timeZone){
  var p = new Intl.DateTimeFormat('en-US', { timeZone: timeZone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(when);
  function g(t){ return +p.filter(function(x){ return x.type === t; })[0].value; }
  return { y: g('year'), m: g('month'), d: g('day') };
}

/* ---------- sun (NOAA sunrise equation, within a minute or two) ---------- */
function sunEvent(y, m, d, lat, lon, rising){
  var DAY = 86400000, rad = Math.PI / 180;
  function mod(a, n){ return ((a % n) + n) % n; }
  var N = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / DAY), lngHour = lon / 15;
  var t = N + ((rising ? 6 : 18) - lngHour) / 24, M = 0.9856 * t - 3.289;
  var L = mod(M + 1.916 * Math.sin(M * rad) + 0.020 * Math.sin(2 * M * rad) + 282.634, 360);
  var RA = mod(Math.atan(0.91764 * Math.tan(L * rad)) / rad, 360);
  RA = (RA + (Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90)) / 15;
  var sinDec = 0.39782 * Math.sin(L * rad), cosDec = Math.cos(Math.asin(sinDec));
  var cosH = (Math.cos(90.833 * rad) - sinDec * Math.sin(lat * rad)) / (cosDec * Math.cos(lat * rad));
  if (cosH > 1 || cosH < -1) return null;
  var H = (rising ? 360 - Math.acos(cosH) / rad : Math.acos(cosH) / rad) / 15;
  var UT = mod(H + RA - 0.06571 * t - 6.622 - lngHour, 24);
  var noon = Date.UTC(y, m - 1, d, 12) - lngHour * 3600000, ms = Date.UTC(y, m - 1, d) + UT * 3600000;
  while (ms - noon > DAY / 2) ms -= DAY;
  while (noon - ms > DAY / 2) ms += DAY;
  return ms;
}
/* ---------- moon ---------- */
function moonOn(ms){
  var SYN = 29.530588853, age = (((ms - Date.UTC(2000, 0, 6, 18, 14)) / 86400000) % SYN + SYN) % SYN;
  var names = [[1.85, 'New moon'], [5.54, 'Waxing crescent'], [9.23, 'First quarter'], [12.92, 'Waxing gibbous'],
    [16.61, 'Full moon'], [20.3, 'Waning gibbous'], [23.99, 'Last quarter'], [27.68, 'Waning crescent'], [99, 'New moon']];
  var phase = names.filter(function(n){ return age < n[0]; })[0][1];
  return { phase: phase, illumination: Math.round((1 - Math.cos(2 * Math.PI * age / SYN)) / 2 * 100) };
}

/* ---------- small fetch helpers ---------- */
function cached(key, ttl){ var v = store('cache:' + key); return v && Date.now() - v.at < ttl ? v.data : null; }
function remember(key, data){ store('cache:' + key, { at: Date.now(), data: data }); }
function getJSON(url){
  var ctrl = window.AbortController ? new AbortController() : null;
  var timer = ctrl && setTimeout(function(){ ctrl.abort(); }, 9000);
  return fetch(url, { headers: { Accept: 'application/geo+json, application/json' }, signal: ctrl && ctrl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
    .then(function(r){ clearTimeout(timer); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
}
function pad2(n){ return (n < 10 ? '0' : '') + n; }

/* ---------- tides (NOAA) ---------- */
function fetchTides(station, day){
  var key = 'tides:' + station + ':' + day.y + pad2(day.m) + pad2(day.d), hit = cached(key, TIDE_TTL);
  if (hit) return Promise.resolve(hit);
  var start = new Date(Date.UTC(day.y, day.m - 1, day.d) - 86400000);
  var begin = start.getUTCFullYear() + pad2(start.getUTCMonth() + 1) + pad2(start.getUTCDate());
  return getJSON('https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&datum=MLLW&interval=hilo' +
    '&units=english&time_zone=gmt&format=json&application=daily_guble&station=' + encodeURIComponent(station) + '&begin_date=' + begin + '&range=72')
    .then(function(body){
      if (!body || !Array.isArray(body.predictions)) throw new Error((body && body.error && body.error.message) || 'no predictions');
      var tides = body.predictions.map(function(p){
        return { type: p.type === 'H' ? 'high' : 'low', time: new Date(String(p.t).replace(' ', 'T') + ':00Z').toISOString(), feet: Math.round(Number(p.v) * 10) / 10 };
      });
      remember(key, tides);
      return tides;
    });
}

/* ---------- weather ---------- */
var WMO = { 0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Freezing fog', 51: 'Light drizzle', 53: 'Drizzle',
  55: 'Heavy drizzle', 56: 'Freezing drizzle', 57: 'Freezing drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain',
  67: 'Freezing rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
  85: 'Snow showers', 86: 'Snow showers', 95: 'Thunderstorms', 96: 'Thunderstorms with hail', 99: 'Thunderstorms with hail' };
function inUS(loc){ return loc.lat > 17 && loc.lat < 72 && loc.lon > -180 && loc.lon < -64; }
function toUnits(f, units){ return f == null ? null : Math.round(units === 'C' ? (f - 32) * 5 / 9 : f); }
function localKeyIn(iso, tz){ return new Date(iso).toLocaleDateString('en-CA', { timeZone: tz }); }

function weatherFromNWS(loc){
  var pkey = 'points:' + loc.lat.toFixed(3) + ',' + loc.lon.toFixed(3), pts = cached(pkey, POINTS_TTL);
  var points = pts ? Promise.resolve(pts) : getJSON('https://api.weather.gov/points/' + loc.lat.toFixed(4) + ',' + loc.lon.toFixed(4)).then(function(j){
    var p = j && j.properties; if (!p || !p.forecast) throw new Error('no forecast office here');
    var v = { forecast: p.forecast, hourly: p.forecastHourly }; remember(pkey, v); return v;
  });
  return points.then(function(p){
    return Promise.all([getJSON(p.forecast), getJSON(p.hourly).catch(function(){ return null; })]);
  }).then(function(r){
    var periods = (r[0] && r[0].properties && r[0].properties.periods) || [];
    if (!periods.length) throw new Error('empty forecast');
    var hour = r[1] && r[1].properties && r[1].properties.periods && r[1].properties.periods[0];
    var days = {}, tonight = null;
    periods.forEach(function(p){
      var k = localKeyIn(p.startTime, loc.timeZone), d = days[k] = days[k] || { date: k };
      if (p.isDaytime) { d.high = toUnits(p.temperature, loc.units); d.text = p.shortForecast; }
      else { d.low = toUnits(p.temperature, loc.units); if (!d.text) d.text = p.shortForecast; if (!tonight) tonight = { text: p.shortForecast, temp: d.low }; }
    });
    var first = periods[0];
    return {
      source: 'National Weather Service',
      current: hour ? { temp: toUnits(hour.temperature, loc.units), text: hour.shortForecast } : { temp: toUnits(first.temperature, loc.units), text: first.shortForecast },
      forecast: first.shortForecast + '. ' + (first.isDaytime ? 'High ' : 'Low ') + toUnits(first.temperature, loc.units) + '°.' +
        (first.windSpeed ? ' Wind ' + (first.windDirection ? first.windDirection + ' ' : '') + first.windSpeed + '.' : ''),
      tonight: tonight,
      days: Object.keys(days).sort().map(function(k){ return days[k]; })
    };
  });
}
function weatherFromOpenMeteo(loc){
  var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + loc.lat + '&longitude=' + loc.lon +
    '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=4' +
    '&timezone=' + encodeURIComponent(loc.timeZone) + '&temperature_unit=' + (loc.units === 'C' ? 'celsius' : 'fahrenheit');
  return getJSON(url).then(function(j){
    var dl = j.daily || {}, days = (dl.time || []).map(function(t, i){
      return { date: t, high: Math.round(dl.temperature_2m_max[i]), low: Math.round(dl.temperature_2m_min[i]), text: WMO[dl.weather_code[i]] || '' };
    });
    if (!days.length) throw new Error('empty forecast');
    var cur = j.current || {}, today = days[0], tonightLow = days[1] ? days[1].low : today.low;
    return {
      source: 'Open-Meteo.com',
      current: { temp: Math.round(cur.temperature_2m), text: WMO[cur.weather_code] || today.text },
      forecast: today.text + '. High ' + today.high + '°, low tonight ' + tonightLow + '°.',
      tonight: { text: WMO[cur.weather_code] || today.text, temp: tonightLow },
      days: days
    };
  });
}
function fetchWeather(loc){
  var key = 'weather:' + loc.lat.toFixed(3) + ',' + loc.lon.toFixed(3) + ':' + loc.units, hit = cached(key, WEATHER_TTL);
  if (hit) return Promise.resolve(hit);
  var job = inUS(loc) ? weatherFromNWS(loc).catch(function(){ return weatherFromOpenMeteo(loc); }) : weatherFromOpenMeteo(loc);
  return job.then(function(w){ w.fetchedAt = Date.now(); remember(key, w); return w; });
}

/* ---------- where the reader is ---------- */
/* Each reader gets their own date, sun and weather. Their town comes from their
   connection (city level, no permission needed), or from their device if they tap
   "Use my exact location". Coordinates are rounded to about 1 km before use. */
var PLACE_API = 'https://api-bdc.io/data/reverse-geocode-client?localityLanguage=en';
function deviceTimeZone(fallback){
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback; } catch (e) { return fallback; }
}
function placeName(d){ return (d && (d.city || d.locality || d.principalSubdivision)) || ''; }
function storedPlace(){ var p = store('reader-place'); return p && isFinite(p.lat) && isFinite(p.lon) ? p : null; }
function findReaderPlace(){
  var p = storedPlace();
  if (p && (p.source === 'device' || Date.now() - p.at < 12 * 3600000)) return Promise.resolve(p);
  return getJSON(PLACE_API).then(function(d){
    if (!d || !isFinite(d.latitude) || !isFinite(d.longitude) || (d.latitude === 0 && d.longitude === 0)) throw new Error('no place');
    var q = { lat: Math.round(d.latitude * 100) / 100, lon: Math.round(d.longitude * 100) / 100, name: placeName(d), cc: d.countryCode || '', source: 'connection', at: Date.now() };
    store('reader-place', q);
    return q;
  });
}
/* Asked only when the reader taps the button. Calls back with true when the place changed. */
function useExactLocation(done){
  if (!navigator.geolocation) { done(false, 'This browser can’t share its location.'); return; }
  navigator.geolocation.getCurrentPosition(function(pos){
    var lat = Math.round(pos.coords.latitude * 100) / 100, lon = Math.round(pos.coords.longitude * 100) / 100;
    getJSON(PLACE_API + '&latitude=' + lat + '&longitude=' + lon).catch(function(){ return {}; }).then(function(d){
      store('reader-place', { lat: lat, lon: lon, name: placeName(d) || 'your location', cc: d.countryCode || '', source: 'device', at: Date.now() });
      done(true);
    });
  }, function(err){
    done(false, err && err.code === 1 ? 'Location not shared, so the forecast uses the town your connection suggests.' : 'Couldn’t get your location just now.');
  }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 6 * 3600000 });
}

/* ---------- everything for today ---------- */
function weatherCacheFor(loc){ return cached('weather:' + loc.lat.toFixed(3) + ',' + loc.lon.toFixed(3) + ':' + loc.units, 6 * 3600000); }
var almanacJob = 0;
function loadAlmanac(issue, onUpdate){
  var paper = locationOf(issue), job = ++almanacJob, tz = deviceTimeZone(paper.timeZone);
  var day = datePartsIn(new Date(), tz), tideDay = datePartsIn(new Date(), paper.timeZone);
  var paperPlace = String(((issue && issue.masthead) || {}).place || '').replace(/<[^>]*>/g, '').split(',')[0] || 'the paper’s town';
  var A = {
    date: day.y + '-' + pad2(day.m) + '-' + pad2(day.d), timeZone: tz,
    moon: moonOn(Date.UTC(day.y, day.m - 1, day.d, 12)),
    tideStation: paper.tideStation || null, tideTimeZone: paper.timeZone, tides: [], tideError: null,
    weather: null, weatherError: null, loadedAt: Date.now()
  };
  /* Sun and weather follow the reader's place once known; until then, the paper's town. */
  function placeAt(p){
    var here = p ? { lat: p.lat, lon: p.lon, timeZone: tz, units: p.cc === 'US' || p.cc === 'LR' ? 'F' : 'C' }
                 : { lat: paper.lat, lon: paper.lon, timeZone: tz, units: paper.units };
    A.lat = here.lat; A.lon = here.lon; A.units = here.units;
    A.placeName = p ? (p.name || 'where you are') : paperPlace;
    A.placeSource = p ? p.source : 'paper';
    var rise = sunEvent(day.y, day.m, day.d, here.lat, here.lon, true), set = sunEvent(day.y, day.m, day.d, here.lat, here.lon, false);
    A.sunrise = rise == null ? null : new Date(rise).toISOString();
    A.sunset = set == null ? null : new Date(set).toISOString();
    A.weather = weatherCacheFor(here);
    A.weatherError = null;
    return here;
  }
  var here = placeAt(storedPlace());
  // Tides belong to the paper's harbour, in its own time zone.
  if (A.tideStation) A.tides = cached('tides:' + A.tideStation + ':' + tideDay.y + pad2(tideDay.m) + pad2(tideDay.d), 7 * 86400000) || [];
  ALMANAC = A;
  function done(){ if (job === almanacJob && onUpdate) onUpdate(); }
  function weatherFor(loc){
    fetchWeather(loc).then(function(w){ if (A.lat === loc.lat && A.lon === loc.lon) { A.weather = w; A.weatherError = null; done(); } },
      function(){ if (!A.weather) A.weatherError = 'The forecast is unavailable right now.'; done(); });
  }
  if (A.tideStation) fetchTides(A.tideStation, tideDay).then(function(t){ A.tides = t; A.tideError = null; done(); },
    function(){ if (!A.tides.length) A.tideError = 'Tide predictions are unavailable right now.'; done(); });
  weatherFor(here);
  findReaderPlace().then(function(p){
    if (job !== almanacJob) return;
    if (p.lat === A.lat && p.lon === A.lon && A.placeSource !== 'paper') return;   // already showing this place
    weatherFor(placeAt(p)); done();
  }, function(){ /* keep the paper's town */ });
  return A;
}


/* Reader bundle: draw today's edition and wire the controls. */
mountShell();
wireView();
hooks.issue = function(){ return ISSUE; };
hooks.rerender = function(){ buildSheets(ISSUE); measure(); };
loadAlmanac(ISSUE, liveUpdated);       // date, sun and moon now; tides and weather as they arrive
applyTheme(ISSUE);
buildSheets(ISSUE);
measure();
startLiveClock();
setTimeout(showHint, 1200);
if (window.ResizeObserver) new ResizeObserver(measure).observe(stage);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

})();
