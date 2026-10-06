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
