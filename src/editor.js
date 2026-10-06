
/* Editor bundle: only sent to signed-in editors. */

/* =========================================================
   EDITOR — what each block type can be edited with
   ========================================================= */
var CROSSWORD_STARTER = ['HEART', 'EMBER', 'ABUSE', 'RESIN', 'TREND'];
function newId(prefix){ return prefix + '-' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36); }
var SIZE_OPTS = [['big','Large'],['medium','Medium'],['small','Small'],['lead','Front-page lead']];
var COLS_OPTS = [[1,'One'],[2,'Two'],[3,'Three']];
var SCHEMA = {
  article: { label:'Story', group:'Text', fields:[
      { k:'kicker', t:'text', label:'Kicker', hint:'Small coloured line above the headline' },
      { k:'head', t:'text', label:'Headline' },
      { k:'size', t:'select', label:'Headline size', options:SIZE_OPTS, def:'big' },
      { k:'sub', t:'text', label:'Subheadline' },
      { k:'byline', t:'text', label:'Byline', hint:'e.g. By Marguerite Tolliver' },
      { k:'bylineNote', t:'text', label:'Byline note', hint:'e.g. Staff Reporter' },
      { k:'dateline', t:'text', label:'Dateline', hint:'Town name printed at the start, e.g. HARROW BAY' },
      { k:'body', t:'paras', label:'Story text', hint:'Leave a blank line between paragraphs. <b>, <i> and &mdash; work.' },
      { k:'cols', t:'select', label:'Text columns', options:COLS_OPTS, def:1 },
      { k:'drop', t:'check', label:'Large first letter (drop cap)' },
      { k:'jump', t:'text', label:'Continued line', hint:'e.g. Continued on Page 2' } ],
    make:function(){ return { type:'article', kicker:'Local', head:'Write the headline here', size:'big', byline:'By Staff Reporter',
      body:['Start the story here. Who, what, where and when go in the first paragraph.','Leave a blank line to begin a new paragraph.'] }; } },
  text: { label:'Paragraphs', group:'Text', fields:[
      { k:'body', t:'paras', label:'Text', hint:'Leave a blank line between paragraphs' },
      { k:'size', t:'select', label:'Size', options:[['','Normal'],['small','Small']], def:'' },
      { k:'align', t:'select', label:'Alignment', options:[['','Justified'],['left','Ragged right']], def:'' },
      { k:'cols', t:'select', label:'Text columns', options:COLS_OPTS, def:1 } ],
    make:function(){ return { type:'text', body:['A new paragraph.'] }; } },
  sect: { label:'Section heading', group:'Text', fields:[ { k:'text', t:'text', label:'Heading' }, { k:'strong', t:'check', label:'Heavy underline' } ],
    make:function(){ return { type:'sect', text:'New section' }; } },
  kicker: { label:'Kicker', group:'Text', fields:[ { k:'text', t:'text', label:'Text' } ], make:function(){ return { type:'kicker', text:'Kicker' }; } },
  quote: { label:'Pull quote', group:'Text', fields:[ { k:'text', t:'long', label:'Quote' }, { k:'who', t:'text', label:'Who said it' } ],
    make:function(){ return { type:'quote', text:'&ldquo;A line worth reading twice.&rdquo;', who:'&mdash; Name, where they said it' }; } },
  rule: { label:'Divider line', group:'Text', fields:[ { k:'style', t:'select', label:'Style', options:[['','Thin'],['thick','Double']], def:'' } ],
    make:function(){ return { type:'rule' }; } },
  photo: { label:'Photo', group:'Pictures', fields:[
      { t:'pic', label:'Picture' },
      { k:'caption', t:'long', label:'Caption', hint:'Wrap the opening words in <b>…</b> for a bold lead-in' },
      { k:'ratio', t:'select', label:'Shape', options:[['','Wide 16:9'],['2/1','Panorama 2:1'],['21/9','Letterbox 21:9'],['4/3','Standard 4:3'],['1/1','Square'],['4/5','Portrait 4:5']], def:'' } ],
    make:function(){ return { type:'photo', art:'lighthouse', caption:'<b>Caption.</b> Say who or what is in the picture, and where.' }; } },
  cartoon: { label:'Cartoon', group:'Pictures', fields:[ { t:'pic', label:'Picture' }, { k:'caption', t:'text', label:'Caption' } ],
    make:function(){ return { type:'cartoon', art:'dollar', caption:'&ldquo;Caption goes here.&rdquo;' }; } },
  comic: { label:'Comic strip', group:'Pictures', fields:[
      { k:'panels', t:'items', label:'Panel', sub:[ { k:'line', t:'text', label:'Speech bubble' }, { k:'pos', t:'num', label:'Figure position, 0 to 85', min:0, max:85 } ],
        make:function(){ return { line:'New line.', pos:40 }; } } ],
    make:function(){ return { type:'comic', panels:[ { line:'Set-up.', pos:25 }, { line:'Build-up.', pos:45 }, { line:'Punchline.', pos:30 } ] }; } },
  box: { label:'Box', group:'Boxes and lists', fields:[ { k:'title', t:'text', label:'Title' }, { k:'heavy', t:'check', label:'Heavy border' } ], children:true,
    make:function(){ return { type:'box', title:'New box', blocks:[ { type:'text', size:'small', body:['Short text for the box.'] } ] }; } },
  list: { label:'List with titles', group:'Boxes and lists', fields:[
      { k:'items', t:'items', label:'Item', sub:[ { k:'title', t:'text', label:'Title' }, { k:'text', t:'long', label:'Text' } ], make:function(){ return { title:'Title', text:'Details.' }; } } ],
    make:function(){ return { type:'list', items:[ { title:'First item', text:'Details.' }, { title:'Second item', text:'Details.' } ] }; } },
  table: { label:'Table', group:'Boxes and lists', fields:[
      { k:'head', t:'cells', label:'Header row', hint:'Separate columns with |' },
      { k:'rows', t:'lines', label:'Rows', hint:'One row per line, columns separated by |. Number columns line up on the right.' } ],
    make:function(){ return { type:'table', head:['Item','Price'], rows:[['Haddock','3.10'],['Scallops, dry','18.50']] }; } },
  weather: { label:'Weather, live', group:'Boxes and lists', fields:[], note:'Prints the temperature now, a short forecast and the next two days, from the US National Weather Service (Open-Meteo outside the US) for the location on the Edition tab. Put it inside a box titled Weather.',
    make:function(){ return { type:'weather' }; } },
  tides: { label:'Tide table, live', group:'Boxes and lists', fields:[], note:'Prints today’s high and low tides from NOAA for the station set on the Edition tab, and highlights the next one. Put it inside a box to give it a title, such as Tide Table · {{shortDate}}.',
    make:function(){ return { type:'tides' }; } },
  rows: { label:'Label and value rows', group:'Boxes and lists', fields:[ { k:'items', t:'lines', label:'Rows', hint:'One per line: label | value' } ],
    make:function(){ return { type:'rows', items:[['High','58&deg;'],['Low','44&deg;']] }; } },
  score: { label:'Scoreboard', group:'Boxes and lists', fields:[ { k:'items', t:'lines', label:'Teams', hint:'One per line: team | score' } ],
    make:function(){ return { type:'score', items:[['Home side','2'],['Visitors','1']] }; } },
  big: { label:'Big number', group:'Boxes and lists', fields:[ { k:'value', t:'text', label:'Number' }, { k:'unit', t:'text', label:'Small label beside it' } ],
    make:function(){ return { type:'big', value:'54&deg;', unit:'and fog' }; } },
  ad: { label:'Advertisement', group:'Features', fields:[
      { k:'eyebrow', t:'text', label:'Top line' }, { k:'shout', t:'text', label:'Business name' },
      { k:'script', t:'text', label:'Slogan' }, { k:'small', t:'long', label:'Details' } ],
    make:function(){ return { type:'ad', eyebrow:'Since 1950', shout:'YOUR SHOP', script:'A slogan in italics', small:'Address and opening hours.' }; } },
  letters: { label:'Letters to the editor', group:'Features', fields:[
      { k:'items', t:'items', label:'Letter', sub:[ { k:'head', t:'text', label:'Headline' }, { k:'body', t:'paras', label:'Letter' }, { k:'sig', t:'text', label:'Signed' } ],
        make:function(){ return { head:'Headline', body:['Sir &mdash; '], sig:'Name, Street' }; } } ],
    make:function(){ return { type:'letters', items:[ { head:'Headline', body:['Sir &mdash; The letter goes here.'], sig:'Name, Street' } ] }; } },
  obits: { label:'Death notices', group:'Features', fields:[
      { k:'items', t:'items', label:'Notice', sub:[ { k:'name', t:'text', label:'Name', hint:'SURNAME, First' }, { k:'body', t:'long', label:'Notice' } ],
        make:function(){ return { name:'SURNAME, First', body:'Age, of Town, on Date.' }; } } ],
    make:function(){ return { type:'obits', items:[ { name:'SURNAME, First', body:'Age, of Town, on Date. Services details.' } ] }; } },
  classified: { label:'Classified ads', group:'Features', fields:[
      { k:'items', t:'items', label:'Ad', sub:[ { k:'tag', t:'text', label:'Heading', hint:'e.g. FOR SALE' }, { k:'text', t:'long', label:'Ad text' } ],
        make:function(){ return { tag:'FOR SALE', text:'Describe it. Price. Phone.' }; } } ],
    make:function(){ return { type:'classified', items:[ { tag:'FOR SALE', text:'Describe it. Price. Phone.' }, { tag:'WANTED', text:'What you need. Who to ask.' } ] }; } },
  crossword: { label:'Crossword', group:'Games', special:'crossword',
    make:function(){
      var across = {}, down = {};
      CROSSWORD_STARTER.forEach(function(w){ across[w] = 'Clue for ' + w; down[w] = 'Clue for ' + w; });
      return { type:'crossword', id:newId('cw'), grid:CROSSWORD_STARTER.slice(), across:across, down:down };
    } },
  sudoku: { label:'Sudoku', group:'Games', special:'sudoku', make:function(){ return { type:'sudoku', id:newId('sd'), givens:sdGenerate(30) }; } },
  wordsearch: { label:'Word search', group:'Games', special:'wordsearch',
    make:function(){ return { type:'wordsearch', id:newId('ws'), size:10, seed:Math.floor(Math.random() * 1e9), words:['HARBOR','LIGHT','FERRY','TIDE','DORY','KEEPER','ANCHOR','GULL'] }; } },
  html: { label:'Custom HTML', group:'Advanced', fields:[ { k:'html', t:'long', label:'HTML', rows:8 } ], make:function(){ return { type:'html', html:'<p>Custom content</p>' }; } },
  head: { label:'Headline', group:null, fields:[ { k:'text', t:'text', label:'Headline' }, { k:'size', t:'select', label:'Size', options:SIZE_OPTS, def:'big' } ], make:function(){ return { type:'head', text:'Headline' }; } }
};
var GROUPS = ['Text', 'Pictures', 'Boxes and lists', 'Features', 'Games', 'Advanced'];
Object.keys(SCHEMA).forEach(function(k){ hooks.labels[k] = SCHEMA[k].label.toLowerCase(); });
function label(type){ return SCHEMA[type] ? SCHEMA[type].label : 'Block (' + type + ')'; }
function summary(b){
  var it = b.items && b.items[0];
  var s = b.head || b.title || b.text || b.shout || b.value || b.caption || (b.body && b.body[0]) ||
    (it && (it.title || it.head || it.name || it.tag || it[0])) || (b.panels && b.panels[0] && b.panels[0].line) ||
    (b.words && b.words.join(', ')) || (b.type === 'crossword' && b.grid ? b.grid.length + ' by ' + b.grid.length + ' grid' : '') ||
    (b.type === 'sudoku' ? sdParse(b.givens).filter(Boolean).length + ' starting numbers' : '') || (b.type === 'rule' ? (b.style === 'thick' ? 'Double' : 'Thin') : '');
  return plain(s).slice(0, 70);
}
function freshIds(b){
  if (!b || typeof b !== 'object') return b;
  if (b.type === 'crossword' || b.type === 'sudoku' || b.type === 'wordsearch') b.id = newId(b.type.slice(0, 2));
  (b.blocks || []).forEach(freshIds);
  (b.columns || []).concat(b.strip || []).forEach(function(c){ (c.blocks || []).forEach(freshIds); });
  return b;
}
function swap(arr, i, j){ if (j < 0 || j >= arr.length) return; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }


/* =========================================================
   EDITOR — state, drafts, saving to the server
   ========================================================= */
var CSRF = (document.querySelector('meta[name="csrf-token"]') || {}).content || '';
var LIVE_VERSION = +((document.querySelector('meta[name="issue-version"]') || {}).content || 0);
var ED = { open:false, draft:null, sel:null, tab:'page', busy:false, lastPage:-1, history:null };
var LIVE_JSON = JSON.stringify(ISSUE), LIVE_HASH = hash(LIVE_JSON);
var panel = null, backBtn = null, UID = 0;

function current(){ return ED.open && ED.draft ? ED.draft : ISSUE; }
function renderPaper(){ applyTheme(current()); buildSheets(current()); measure(); if (ED.open) { markSel(); checkFit(); } }
/* Warn when a column holds more than fits on the page; the paper cuts it off. */
function checkFit(){
  if (!panel) return;
  var out = [];
  sheets.forEach(function(sh, pi){
    sh.querySelectorAll('.grid > .col').forEach(function(c, ci){ if (c.scrollHeight - c.clientHeight > 2) out.push('page ' + (pi + 1) + ', column ' + (ci + 1)); });
    sh.querySelectorAll('.strip > .cell').forEach(function(c, ci){ if (c.scrollHeight - c.clientHeight > 2) out.push('page ' + (pi + 1) + ', footer box ' + (ci + 1)); });
  });
  var box = panel.querySelector('#edFit');
  box.hidden = !out.length;
  box.textContent = out.length ? 'Too long to fit: ' + out.join('; ') + '. The end is cut off. Trim the text, shrink a photo or widen the column.' : '';
}
var paperTimer = null;
function changed(panelToo){
  saveDraft();
  clearTimeout(paperTimer);
  paperTimer = setTimeout(function(){ renderPaper(); updateChip(); }, 140);
  if (panelToo) renderPanel();
}
function saveDraft(){
  if (store('draft', { issue: ED.draft, base: LIVE_HASH, version: LIVE_VERSION }) === null)
    msg('This edition is too large to keep as a draft in this browser. Publish it before closing the tab.', 'warn');
}
function loadDraft(){
  var d = store('draft');
  if (!d || !d.issue) return null;
  if (hash(JSON.stringify(d.issue)) === LIVE_HASH) { store('draft', null); return null; }
  return d;
}
function isDirty(){ return !!ED.draft && JSON.stringify(ED.draft) !== LIVE_JSON; }
function updateChip(){
  if (!panel) return;
  var chip = panel.querySelector('#edChip'), pub = panel.querySelector('#edPub'), d = isDirty();
  chip.textContent = d ? 'Unpublished changes' : 'Same as the published paper';
  chip.classList.toggle('dirty', d);
  if (!ED.busy) pub.disabled = !d;
}
function msg(text, kind){
  if (!panel) return;
  var m = panel.querySelector('#edMsg');
  m.textContent = text || ''; m.className = 'ed-msg' + (kind ? ' ' + kind : '');
}

/* Every write carries the session cookie (sent automatically) plus the
   CSRF token from the page, and the server checks both. */
function api(method, url, body){
  return fetch(url, {
    method: method, credentials: 'same-origin', cache: 'no-store',
    headers: Object.assign({ 'X-CSRF-Token': CSRF }, body ? { 'Content-Type': 'application/json' } : {}),
    body: body ? JSON.stringify(body) : undefined
  }).then(function(res){
    return res.json().catch(function(){ return {}; }).then(function(data){ data.status = res.status; data.ok = res.ok; return data; });
  });
}
function sessionEnded(){
  msg('Your session has ended. Your changes are kept in this browser. Sign in again to publish them.', 'warn');
  var link = panel.querySelector('#edRelogin'); if (link) link.hidden = false;
}

function publish(){
  if (ED.busy || !isDirty()) return;
  var pub = panel.querySelector('#edPub');
  ED.busy = true; pub.disabled = true; pub.textContent = 'Publishing…'; msg('');
  saveDraft();
  api('PUT', '/api/issue', { issue: ED.draft, baseVersion: LIVE_VERSION }).then(function(r){
    ED.busy = false; pub.textContent = 'Publish edition';
    if (r.ok) {
      ISSUE = clone(ED.draft); LIVE_JSON = JSON.stringify(ISSUE); LIVE_HASH = hash(LIVE_JSON); LIVE_VERSION = r.version;
      store('draft', null); ED.history = null;
      var t = new Date(r.savedAt || Date.now()).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      ED.site = null;
      var site = r.site || {};
      if (site.ok && site.pushed) msg('Published at ' + t + '. The public website updates within a minute or two.', 'ok');
      else if (site.ok) msg('Published at ' + t + '. The website files are ready, but no GitHub repository is set up to publish them to. See the Edition tab.', 'warn');
      else msg('Saved at ' + t + ', but the public website wasn\u2019t updated: ' + (site.error || 'unknown error') + '. Try again from the Edition tab.', 'warn');
    } else if (r.status === 401) { sessionEnded(); }
    else if (r.status === 409) {
      msg('Someone published a newer edition (version ' + r.version + ') after you opened the editor. Reload this page to see it. Your changes stay saved in this browser.', 'warn');
    } else if (r.status === 413) { msg('This edition is too large to save. Use fewer or smaller photos.', 'warn'); }
    else if (r.status === 422) { msg('The server refused this edition: ' + (r.error || 'it is not in the expected shape') + '.', 'warn'); }
    else { msg('Publishing failed (' + (r.error || 'error ' + r.status) + '). Your changes are still here; try again.', 'warn'); }
    updateChip();
  }, function(){
    ED.busy = false; pub.textContent = 'Publish edition'; updateChip();
    msg('Couldn’t reach the server. Check your connection and try again. Your changes are still here.', 'warn');
  });
}
function downloadJSON(){
  var blob = new Blob([JSON.stringify(ED.draft, null, 1)], { type: 'application/json' });
  var a = document.createElement('a'), d = new Date();
  a.href = URL.createObjectURL(blob);
  a.download = 'daily-guble-' + d.toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
}
function loadJSONFile(file){
  var r = new FileReader();
  r.onload = function(){
    try {
      var data = JSON.parse(r.result);
      if (!data || !Array.isArray(data.pages)) throw new Error('no pages');
      ED.draft = data; ED.sel = null; idx = 0; changed(true);
      msg('Loaded ' + file.name + '. Check it over, then publish.', 'ok');
    } catch (e) { msg('That file isn’t a Daily Guble edition.', 'warn'); }
  };
  r.readAsText(file);
}
function logout(){
  api('POST', '/api/logout').then(function(){ location.href = '/admin'; }, function(){ location.href = '/admin'; });
}

/* ---------- panel shell ---------- */
function buildPanel(){
  panel = el('aside', 'ed'); panel.setAttribute('aria-label', 'Newsroom editor');
  panel.innerHTML =
    '<header class="ed-head"><div class="ed-title"><b>Newsroom</b><span class="ed-chip" id="edChip"></span></div>' +
    '<div class="ed-actions"><button class="ed-btn ghost small" id="edPeek" type="button">Preview</button>' +
    '<button class="ed-btn primary" id="edPub" type="button">Publish edition</button></div></header>' +
    '<div class="ed-tabs" role="tablist">' +
      '<button class="ed-tab" role="tab" type="button" data-tab="page">This page</button>' +
      '<button class="ed-tab" role="tab" type="button" data-tab="pages">Pages</button>' +
      '<button class="ed-tab" role="tab" type="button" data-tab="issue">Edition</button>' +
      '<button class="ed-tab" role="tab" type="button" data-tab="theme">Theme</button>' +
      '<button class="ed-tab" role="tab" type="button" data-tab="history">History</button></div>' +
    '<p class="ed-fit" id="edFit" role="status" hidden></p>' +
    '<div class="ed-body" id="edBody" role="tabpanel"></div>' +
    '<footer class="ed-foot">' +
      '<a class="ed-btn small ghost" href="/" target="_blank" rel="noopener">Open the public paper</a>' +
      '<button class="ed-btn small danger" id="edDiscard" type="button">Discard changes</button>' +
      '<button class="ed-btn small ghost" id="edLogout" type="button">Sign out</button>' +
      '<p class="ed-msg" id="edMsg" role="status" aria-live="polite"></p>' +
      '<a class="ed-btn small" id="edRelogin" href="/admin" hidden>Sign in again</a></footer>';
  document.body.appendChild(panel);
  backBtn = txt('button', 'ed-btn primary ed-back', 'Back to the newsroom'); backBtn.type = 'button'; backBtn.hidden = true;
  backBtn.addEventListener('click', function(){ setPeek(false); });
  document.body.appendChild(backBtn);
  panel.querySelectorAll('.ed-tab').forEach(function(t){ t.addEventListener('click', function(){ ED.tab = t.dataset.tab; renderPanel(); }); });
  panel.querySelector('#edPeek').addEventListener('click', function(){ setPeek(true); });
  panel.querySelector('#edPub').addEventListener('click', publish);
  panel.querySelector('#edLogout').addEventListener('click', logout);
  twoTap(panel.querySelector('#edDiscard'), 'Discard changes', 'Tap again to discard', function(){
    store('draft', null); ED.draft = clone(ISSUE); ED.sel = null;
    renderPaper(); renderPanel(); updateChip(); msg('Changes discarded. You’re looking at the published paper again.', 'ok');
  }, 'armed');
}
function setPeek(on){ document.body.classList.toggle('ed-peek', on); backBtn.hidden = !on; measure(); }
function openEditor(){
  var d = loadDraft();
  ED.draft = d ? d.issue : clone(ISSUE);
  ED.open = true; ED.sel = null; ED.tab = 'page'; ED.lastPage = idx;
  if (!panel) buildPanel();
  document.body.classList.add('editing');
  renderPaper(); renderPanel(); updateChip();
  if (JSON.stringify(ED.draft.location || null) !== JSON.stringify(ISSUE.location || null) && ED.draft.location) loadAlmanac(ED.draft, liveUpdated);
  if (d && d.version !== LIVE_VERSION) msg('A newer edition was published after you started these changes. Publishing will replace it with your version.', 'warn');
  else if (d) msg('Your unpublished changes are back.', 'ok');
}
function markSel(){
  book.querySelectorAll('.is-sel').forEach(function(n){ n.classList.remove('is-sel'); });
  if (!ED.sel) return;
  Object.keys(BIDMAP).forEach(function(id){
    if (BIDMAP[id].block === ED.sel.block) { var n = book.querySelector('[data-bid="' + id + '"]'); if (n) n.classList.add('is-sel'); }
  });
}

/* ---------- small form kit ---------- */
function sec(title, small){
  var s = el('section', 'ed-sec'), h = el('h3');
  h.appendChild(document.createTextNode(title)); if (small) h.appendChild(txt('small', null, small));
  s.appendChild(h); return s;
}
function btn(text, cls, fn){ var b = txt('button', 'ed-btn' + (cls ? ' ' + cls : ''), text); b.type = 'button'; if (fn) b.addEventListener('click', fn); return b; }
function ico(glyph, title, fn, disabled){
  var b = txt('button', 'ed-ico', glyph); b.type = 'button'; b.title = title; b.setAttribute('aria-label', title);
  if (disabled) b.disabled = true; else if (fn) b.addEventListener('click', fn);
  return b;
}
function delIco(title, fn, disabled){
  var b = ico('✕', title, null, disabled);
  if (!disabled) twoTap(b, '✕', '✓', fn, 'armed');
  b.addEventListener('click', function(){ b.title = b.classList.contains('armed') ? 'Tap again to delete' : title; });
  return b;
}
function field(lbl, control, hint){
  var w = el('div', 'ed-field'), id = 'ed' + (++UID), l = txt('label', 'ed-label', lbl);
  control.id = id; l.htmlFor = id;
  w.appendChild(l); w.appendChild(control);
  if (hint) w.appendChild(txt('span', 'ed-hint', hint));
  return w;
}
function setVal(obj, k, v){ if (v === '' || v == null || v === false) delete obj[k]; else obj[k] = v; }
function inText(obj, k, ph, panelToo){
  var i = el('input', 'ed-in'); i.type = 'text'; i.value = obj[k] == null ? '' : String(obj[k]); if (ph) i.placeholder = ph;
  i.addEventListener('input', function(){ setVal(obj, k, i.value); changed(); });
  if (panelToo) i.addEventListener('change', function(){ renderPanel(); });
  return i;
}
function inArea(obj, k, rows){
  var t = el('textarea', 'ed-in'); t.rows = rows || 3; t.value = obj[k] == null ? '' : String(obj[k]);
  t.addEventListener('input', function(){ setVal(obj, k, t.value); changed(); });
  return t;
}
function inParas(obj, k){
  var t = el('textarea', 'ed-in'), v = (obj[k] || []).join('\n\n');
  t.rows = Math.min(18, Math.max(4, Math.round(v.length / 42) + 2)); t.value = v;
  t.addEventListener('input', function(){
    var arr = t.value.split(/\n\s*\n/).map(function(s){ return s.trim(); }).filter(Boolean);
    if (arr.length) obj[k] = arr; else delete obj[k];
    changed();
  });
  return t;
}
function inLines(obj, k){
  var t = el('textarea', 'ed-in'); t.rows = Math.max(3, (obj[k] || []).length + 1);
  t.value = (obj[k] || []).map(function(r){ return r.join(' | '); }).join('\n');
  t.addEventListener('input', function(){
    var rows = t.value.split('\n').map(function(l){ return l.trim(); }).filter(Boolean).map(function(l){ return l.split('|').map(function(s){ return s.trim(); }); });
    if (rows.length) obj[k] = rows; else delete obj[k];
    changed();
  });
  return t;
}
function inCells(obj, k){
  var i = el('input', 'ed-in'); i.type = 'text'; i.value = (obj[k] || []).join(' | ');
  i.addEventListener('input', function(){
    var cells = i.value.split('|').map(function(s){ return s.trim(); });
    if (cells.some(Boolean)) obj[k] = cells; else delete obj[k];
    changed();
  });
  return i;
}
function inSelect(obj, k, options, def, onChange){
  var s = el('select', 'ed-in');
  options.forEach(function(o){ var op = txt('option', null, o[1]); op.value = String(o[0]); s.appendChild(op); });
  s.value = String(obj[k] == null ? (def == null ? '' : def) : obj[k]);
  s.addEventListener('change', function(){
    var o = options.filter(function(x){ return String(x[0]) === s.value; })[0], v = o ? o[0] : s.value;
    if (v === '' || v === def) delete obj[k]; else obj[k] = v;
    changed(); if (onChange) onChange(v);
  });
  return s;
}
function inCheck(obj, k, text){
  var l = el('label', 'ed-check'), c = el('input'); c.type = 'checkbox'; c.checked = !!obj[k];
  c.addEventListener('change', function(){ setVal(obj, k, c.checked); changed(); });
  l.appendChild(c); l.appendChild(document.createTextNode(text)); return l;
}
function inNum(obj, k, min, max, step){
  var i = el('input', 'ed-in'); i.type = 'number'; if (min != null) i.min = min; if (max != null) i.max = max; i.step = step || 1;
  i.value = obj[k] == null ? '' : obj[k];
  i.addEventListener('input', function(){ var v = parseFloat(i.value); if (isNaN(v)) delete obj[k]; else obj[k] = v; changed(); });
  return i;
}
function buildField(obj, f){
  switch (f.t) {
    case 'text':   return field(f.label, inText(obj, f.k), f.hint);
    case 'long':   return field(f.label, inArea(obj, f.k, f.rows), f.hint);
    case 'paras':  return field(f.label, inParas(obj, f.k), f.hint);
    case 'lines':  return field(f.label, inLines(obj, f.k), f.hint);
    case 'cells':  return field(f.label, inCells(obj, f.k), f.hint);
    case 'select': return field(f.label, inSelect(obj, f.k, f.options, f.def), f.hint);
    case 'check':  return inCheck(obj, f.k, f.label);
    case 'num':    return field(f.label, inNum(obj, f.k, f.min, f.max, f.step), f.hint);
    case 'items':  return itemsField(obj, f);
    case 'pic':    return picField(obj);
  }
  return el('div');
}
function itemsField(obj, f){
  var wrap = el('div', 'ed-field'), box = el('div', 'ed-items');
  wrap.appendChild(txt('span', 'ed-label', f.label + 's')); wrap.appendChild(box);
  function draw(){
    box.innerHTML = '';
    var arr = obj[f.k] = obj[f.k] || [];
    arr.forEach(function(it, i){
      var card = el('div', 'ed-item'), bar = el('div', 'ed-item-bar');
      bar.appendChild(txt('span', null, f.label + ' ' + (i + 1)));
      bar.appendChild(ico('↑', 'Move up', function(){ swap(arr, i, i - 1); changed(); draw(); }, i === 0));
      bar.appendChild(ico('↓', 'Move down', function(){ swap(arr, i, i + 1); changed(); draw(); }, i === arr.length - 1));
      bar.appendChild(delIco('Delete this ' + f.label.toLowerCase(), function(){ arr.splice(i, 1); changed(); draw(); }));
      card.appendChild(bar);
      f.sub.forEach(function(sf){ card.appendChild(buildField(it, sf)); });
      box.appendChild(card);
    });
    box.appendChild(btn('Add ' + f.label.toLowerCase(), 'small ed-add', function(){ arr.push(f.make()); changed(); draw(); }));
  }
  draw(); return wrap;
}
function shrinkImage(file, maxW){
  return new Promise(function(res, rej){
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function(){
      var s = Math.min(1, maxW / img.naturalWidth), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * s)); c.height = Math.max(1, Math.round(img.naturalHeight * s));
      var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = function(){ URL.revokeObjectURL(url); rej(new Error('not an image')); };
    img.src = url;
  });
}
function picField(obj){
  var wrap = el('div', 'ed-pic'), thumb = el('div', 'thumb'), right = el('div', 'ed-field');
  function setThumb(){
    if (obj.src) thumb.style.backgroundImage = 'url("' + obj.src + '")';
    else thumb.style.backgroundImage = 'url("' + paintArt(obj.art || 'lighthouse', 192, 108).toDataURL() + '")';
  }
  var sel = el('select', 'ed-in');
  Object.keys(ART).forEach(function(k){ var o = txt('option', null, ART_LABELS[k] || k); o.value = k; sel.appendChild(o); });
  var up = txt('option', null, 'My own photo'); up.value = '__upload'; sel.appendChild(up);
  sel.value = obj.src ? '__upload' : (obj.art || 'lighthouse');
  var file = el('input', 'ed-file'); file.type = 'file'; file.accept = 'image/*';
  file.setAttribute('aria-label', 'Upload a photo');
  sel.addEventListener('change', function(){
    if (sel.value === '__upload') { file.click(); return; }
    obj.art = sel.value; delete obj.src; setThumb(); changed();
  });
  file.addEventListener('change', function(){
    var f = file.files && file.files[0];
    if (!f) { sel.value = obj.src ? '__upload' : (obj.art || 'lighthouse'); return; }
    msg('Preparing the photo…');
    shrinkImage(f, 1100).then(function(data){
      obj.src = data; delete obj.art; sel.value = '__upload'; setThumb(); changed();
      msg('Photo added. It prints in black and white with a halftone screen, like the rest of the paper.', 'ok');
    }, function(){ msg('That file couldn’t be read as an image. Try a JPEG or PNG.', 'warn'); sel.value = obj.src ? '__upload' : (obj.art || 'lighthouse'); });
  });
  right.appendChild(field('Picture', sel)); right.appendChild(file);
  right.appendChild(txt('span', 'ed-hint', 'Photos are resized on upload so the paper stays quick to open.'));
  setThumb(); wrap.appendChild(thumb); wrap.appendChild(right);
  return wrap;
}

/* ---------- block lists and the "add block" palette ---------- */
function blockList(list){
  var ul = el('ul', 'ed-blocks');
  list.forEach(function(b, i){
    var li = el('li'), row = el('div', 'ed-bl' + (ED.sel && ED.sel.block === b ? ' on' : ''));
    var main = el('button', 'ed-bl-main'); main.type = 'button';
    main.appendChild(txt('span', null, label(b.type))); main.appendChild(txt('em', null, summary(b) || '—'));
    main.addEventListener('click', function(){ ED.sel = { block: b, list: list }; renderPanel(); markSel(); });
    row.appendChild(main);
    row.appendChild(ico('↑', 'Move up', function(){ swap(list, i, i - 1); changed(true); }, i === 0));
    row.appendChild(ico('↓', 'Move down', function(){ swap(list, i, i + 1); changed(true); }, i === list.length - 1));
    row.appendChild(ico('⧉', 'Duplicate', function(){ list.splice(i + 1, 0, freshIds(clone(b))); changed(true); }));
    row.appendChild(delIco('Delete this ' + label(b.type).toLowerCase(), function(){
      list.splice(i, 1); if (ED.sel && ED.sel.block === b) ED.sel = null; changed(true);
    }));
    li.appendChild(row);
    if (b.type === 'box') { b.blocks = b.blocks || []; li.appendChild(blockList(b.blocks)); li.appendChild(addButton(b.blocks, 'Add inside this box')); }
    ul.appendChild(li);
  });
  return ul;
}
function addButton(list, text){
  var wrap = el('div'), b = btn('+ ' + (text || 'Add a block'), 'small ed-add');
  wrap.appendChild(b);
  b.addEventListener('click', function(){
    var open = wrap.querySelector('.ed-palette');
    if (open) { open.remove(); b.setAttribute('aria-expanded', 'false'); return; }
    wrap.appendChild(palette(list)); b.setAttribute('aria-expanded', 'true');
  });
  return wrap;
}
function palette(list){
  var p = el('div', 'ed-palette');
  GROUPS.forEach(function(g){
    var types = Object.keys(SCHEMA).filter(function(t){ return SCHEMA[t].group === g; });
    if (!types.length) return;
    p.appendChild(txt('h4', null, g));
    var grid = el('div', 'grid');
    types.forEach(function(t){
      grid.appendChild(btn(SCHEMA[t].label, 'small', function(){
        var nb = SCHEMA[t].make(); list.push(nb);
        ED.sel = { block: nb, list: list }; changed(true);
      }));
    });
    p.appendChild(grid);
  });
  return p;
}
function containers(page){
  var out = [];
  (page.columns || []).forEach(function(c, i){ c.blocks = c.blocks || []; out.push({ name: 'Column ' + (i + 1), list: c.blocks }); });
  (page.strip || []).forEach(function(c, i){ c.blocks = c.blocks || []; out.push({ name: 'Footer box ' + (i + 1), list: c.blocks }); });
  return out;
}

/* =========================================================
   EDITOR — live dates and times
   ========================================================= */
function draftLocation(){
  var A = ALMANAC || {};
  return ED.draft.location = ED.draft.location || { lat: A.lat, lon: A.lon, timeZone: A.timeZone || 'America/New_York', tideStation: A.tideStation || '', units: A.units || 'F' };
}
/* Live values are worked out in this browser, so previewing a new place needs no server. */
var previewTimer = null;
function previewLocation(after){
  clearTimeout(previewTimer);
  previewTimer = setTimeout(function(){
    loadAlmanac(ED.draft, function(){
      renderPaper(); if (after) after();
      var A = ALMANAC || {}, problems = [A.tideError, A.weatherError].filter(Boolean).join(' ');
      msg(problems ? 'Location updated. ' + problems : 'Location updated. Tides and weather now come from there.', problems ? 'warn' : 'ok');
    });
    renderPaper(); if (after) after();
  }, 500);
}
function timeZones(){
  try { return Intl.supportedValuesOf('timeZone'); } catch (e) { return null; }
}
function locationSection(onUpdate){
  var loc = draftLocation(), s = sec('Location for live times');
  s.appendChild(txt('p', 'ed-note', 'Sunrise, sunset, the moon and the date are worked out for this spot, in its time zone. Weather comes from the US National Weather Service (Open-Meteo outside the US). Tides come from the NOAA station you pick.'));
  var r = el('div', 'ed-row');
  var lat = inNum(loc, 'lat', -90, 90, 0.0001), lon = inNum(loc, 'lon', -180, 180, 0.0001);
  [lat, lon].forEach(function(i){ i.addEventListener('input', function(){ previewLocation(onUpdate); }); });
  r.appendChild(field('Latitude', lat)); r.appendChild(field('Longitude', lon));
  s.appendChild(r);
  var zones = timeZones(), tz;
  if (zones) {
    tz = el('select', 'ed-in');
    if (zones.indexOf(loc.timeZone) < 0) zones = [loc.timeZone].concat(zones);
    zones.forEach(function(z){ var o = txt('option', null, z.replace(/_/g, ' ')); o.value = z; tz.appendChild(o); });
    tz.value = loc.timeZone;
    tz.addEventListener('change', function(){ loc.timeZone = tz.value; changed(); previewLocation(onUpdate); });
  } else {
    tz = inText(loc, 'timeZone', 'e.g. America/New_York');
    tz.addEventListener('change', function(){ previewLocation(onUpdate); });
  }
  s.appendChild(field('Time zone', tz));
  var st = inText(loc, 'tideStation', 'e.g. 8415490');
  st.inputMode = 'numeric';
  st.addEventListener('input', function(){ if (/^(\d{7})?$/.test(st.value.trim())) previewLocation(onUpdate); });
  s.appendChild(field('NOAA tide station', st, 'Seven digits. Find the nearest one at tidesandcurrents.noaa.gov. Leave it empty to print no tides.'));
  var units = el('select', 'ed-in');
  [['F', 'Fahrenheit, \u00b0F'], ['C', 'Celsius, \u00b0C']].forEach(function(o){ var op = txt('option', null, o[1]); op.value = o[0]; units.appendChild(op); });
  units.value = loc.units === 'C' ? 'C' : 'F';
  units.addEventListener('change', function(){ loc.units = units.value; changed(); previewLocation(onUpdate); });
  s.appendChild(field('Temperatures in', units));
  return s;
}
function liveSection(){
  var s = sec('Live dates and times', 'Copy a code into any text');
  s.appendChild(txt('p', 'ed-note', 'Type one of these codes anywhere on the paper, in a headline, a story, a table or the nameplate. Readers see today’s value, and it changes by itself: the date at midnight, the next tide after each tide.'));
  var v = liveValues(), list = el('div', 'ed-clues');
  LIVE_TOKENS.forEach(function(t){
    var code = '{{' + t[0] + '}}', row = el('div', 'ed-live');
    var b = txt('button', 'ed-btn small ed-code', code); b.type = 'button'; b.title = 'Copy ' + code;
    b.addEventListener('click', function(){
      var done = function(){ msg('Copied ' + code + '. Paste it into any text field.', 'ok'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, function(){ msg('Select and copy: ' + code); });
      else msg('Select and copy: ' + code);
    });
    var info = el('div', 'ed-live-info');
    info.appendChild(txt('span', 'ed-label', t[1]));
    info.appendChild(txt('b', null, v[t[0]]));
    row.appendChild(b); row.appendChild(info); list.appendChild(row);
  });
  s.appendChild(list);
  return s;
}

function websiteSection(){
  var s = sec('Public website'), box = el('div', 'ed-sec');
  s.appendChild(box);
  function show(st){
    box.innerHTML = '';
    if (st.url) {
      var a = txt('a', 'ed-btn small ghost', 'Open ' + st.url.replace(/^https?:\/\//, ''));
      a.href = st.url; a.target = '_blank'; a.rel = 'noopener'; box.appendChild(a);
    }
    if (!st.pushConfigured) {
      box.appendChild(txt('p', 'ed-note warn', 'Publishing to the website isn\u2019t set up yet. Each publish still writes the website files on the server, ready for any static host. To publish automatically, set GITHUB_REPO and GITHUB_TOKEN (see the README).'));
    } else {
      box.appendChild(txt('p', 'ed-note', 'Each publish commits the paper to ' + st.repo + ', and your host redeploys it.'));
    }
    var L = st.last;
    if (L) box.appendChild(txt('p', 'ed-note ' + (L.ok ? 'ok' : 'warn'), L.ok
      ? (L.pushed ? 'Last pushed ' + new Date(L.at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) + ' (edition version ' + L.version + ', ' + L.changed + ' file' + (L.changed === 1 ? '' : 's') + ' changed).'
                  : 'Website files written ' + new Date(L.at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) + '.')
      : 'The last push failed: ' + L.error));
    if (st.pushConfigured) {
      var b = btn('Publish the website now', 'small', function(){
        b.disabled = true; b.textContent = 'Publishing\u2026';
        api('POST', '/api/site/publish').then(function(r){
          if (r.status === 401) { sessionEnded(); return; }
          ED.site = null; load();
          msg(r.site && r.site.ok ? 'The public website is up to date.' : 'The website wasn\u2019t updated: ' + ((r.site && r.site.error) || r.error || 'unknown error') + '.', r.site && r.site.ok ? 'ok' : 'warn');
        }, function(){ b.disabled = false; b.textContent = 'Publish the website now'; msg('Couldn\u2019t reach the server.', 'warn'); });
      });
      box.appendChild(b);
    }
  }
  function load(){
    if (ED.site) { show(ED.site); return; }
    box.appendChild(txt('p', 'ed-note', 'Checking\u2026'));
    api('GET', '/api/site').then(function(r){ if (r.status === 401) { sessionEnded(); return; } ED.site = r; show(r); }, function(){});
  }
  load();
  return s;
}

/* =========================================================
   EDITOR — page templates
   ========================================================= */
function sectHead(text){ return { type:'sect', strong:true, text:text }; }
var TEMPLATES = {
  news: { label:'Three columns of news', make:function(){ return { runhead:{ center:'Local News' }, columns:[
    { w:1.3, blocks:[ SCHEMA.article.make() ] },
    { w:1.4, blocks:[ SCHEMA.photo.make(), SCHEMA.article.make() ] },
    { w:1.2, blocks:[ SCHEMA.box.make(), SCHEMA.ad.make() ] } ] }; } },
  feature: { label:'Feature with a sidebar', make:function(){ var a = SCHEMA.article.make(); a.cols = 2; a.drop = true; return { runhead:{ center:'Features' }, columns:[
    { w:2.3, blocks:[ SCHEMA.photo.make(), a ] },
    { w:1.2, blocks:[ SCHEMA.quote.make(), SCHEMA.list.make() ] } ] }; } },
  opinion: { label:'Opinion and letters', make:function(){ var e = SCHEMA.article.make(); e.kicker = 'Editorial'; e.byline = ''; delete e.byline; return { runhead:{ center:'Opinion &amp; Letters' }, columns:[
    { w:2.2, blocks:[ e ] },
    { w:1.5, blocks:[ sectHead('Letters to the Editor'), SCHEMA.letters.make() ] },
    { w:1.4, blocks:[ SCHEMA.cartoon.make() ] } ] }; } },
  puzzles: { label:'Puzzles and games', make:function(){ return { runhead:{ center:'Puzzles &amp; Games' }, columns:[
    { w:1, blocks:[ sectHead('Crossword'), SCHEMA.crossword.make() ] },
    { w:1, blocks:[ sectHead('Sudoku'), SCHEMA.sudoku.make() ] },
    { w:1, blocks:[ sectHead('Word search'), SCHEMA.wordsearch.make() ] } ] }; } },
  empty: { label:'Empty page, three columns', make:function(){ return { runhead:{ center:'New Section' }, columns:[ { w:1, blocks:[] }, { w:1, blocks:[] }, { w:1, blocks:[] } ] }; } }
};
function today(){ return new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' }); }

/* =========================================================
   EDITOR — the panel's views
   ========================================================= */
var blockIds = new WeakMap(), nextBlockId = 0;
function blockKey(b){ if (!blockIds.has(b)) blockIds.set(b, ++nextBlockId); return blockIds.get(b); }
function renderPanel(){
  if (!panel) return;
  if (ED.sel && ED.sel.list.indexOf(ED.sel.block) < 0) ED.sel = null;
  panel.querySelectorAll('.ed-tab').forEach(function(t){ t.setAttribute('aria-selected', t.dataset.tab === ED.tab ? 'true' : 'false'); });
  var body = panel.querySelector('#edBody'), top = body.scrollTop;
  var key = ED.tab + ':' + idx + ':' + (ED.sel ? blockKey(ED.sel.block) : '');
  body.innerHTML = '';
  ({ page: ED.sel ? viewBlock : viewPage, pages: viewPages, issue: viewIssue, theme: viewTheme, history: viewHistory })[ED.tab](body);
  body.scrollTop = key === renderPanel.lastKey ? top : 0;
  renderPanel.lastKey = key;
}
function disable(b, on){ if (on) b.disabled = true; return b; }

function group(name, c, arr, i, minCount){
  c.blocks = c.blocks || [];
  var g = el('div', 'ed-group'), h = el('header');
  h.appendChild(txt('b', null, name));
  var w = inNum(c, 'w', 0.3, 6, 0.1); if (c.w == null) w.value = 1;
  w.setAttribute('aria-label', name + ' width'); w.title = 'Width compared with its neighbours';
  h.appendChild(txt('span', null, 'Width')); h.appendChild(w);
  h.appendChild(ico('←', 'Move ' + name.toLowerCase() + ' left', function(){ swap(arr, i, i - 1); changed(true); }, i === 0));
  h.appendChild(ico('→', 'Move ' + name.toLowerCase() + ' right', function(){ swap(arr, i, i + 1); changed(true); }, i === arr.length - 1));
  h.appendChild(delIco('Delete ' + name.toLowerCase() + ' and everything in it', function(){ arr.splice(i, 1); ED.sel = null; changed(true); }, arr.length <= minCount));
  g.appendChild(h);
  g.appendChild(blockList(c.blocks));
  g.appendChild(addButton(c.blocks));
  return g;
}

function viewPage(body){
  var pages = ED.draft.pages = ED.draft.pages || [], page = pages[idx];
  if (!page) {
    body.appendChild(txt('p', 'ed-note', 'This edition has no pages yet.'));
    body.appendChild(btn('Add a page', 'primary', function(){ pages.push(TEMPLATES.news.make()); idx = 0; changed(true); }));
    return;
  }
  var s = sec('Page ' + (idx + 1) + ' of ' + pages.length, page.plate ? 'Front page' : plain(page.runhead && page.runhead.center));
  var nav = el('div', 'ed-row');
  nav.appendChild(disable(btn('← Previous page', 'small', function(){ go(-1); }), idx === 0));
  nav.appendChild(disable(btn('Next page →', 'small', function(){ go(1); }), idx >= pages.length - 1));
  s.appendChild(nav);
  var head = el('select', 'ed-in');
  [['plate', 'Nameplate (front page)'], ['run', 'Running head (inside pages)']].forEach(function(o){ var op = txt('option', null, o[1]); op.value = o[0]; head.appendChild(op); });
  head.value = page.plate ? 'plate' : 'run';
  head.addEventListener('change', function(){
    if (head.value === 'plate') { page.plate = true; } else { delete page.plate; page.runhead = page.runhead || { center:'Section' }; }
    changed(true);
  });
  s.appendChild(field('Top of the page', head));
  if (page.plate) s.appendChild(txt('p', 'ed-note', 'The nameplate prints the paper’s name and edition details. Change them on the Edition tab.'));
  else {
    page.runhead = page.runhead || {};
    s.appendChild(field('Section name', inText(page.runhead, 'center'), 'Printed in the middle of the running head'));
    var r = el('div', 'ed-row');
    r.appendChild(field('Left side', inText(page.runhead, 'left', 'Paper name and date')));
    r.appendChild(field('Right side', inText(page.runhead, 'right', 'Page ' + (idx + 1))));
    s.appendChild(r);
  }
  body.appendChild(s);

  page.columns = page.columns || [];
  var s2 = sec('Columns', 'Click a block on the paper to edit it'), tree = el('div', 'ed-tree');
  page.columns.forEach(function(col, ci){ tree.appendChild(group('Column ' + (ci + 1), col, page.columns, ci, 1)); });
  tree.appendChild(disable(btn('+ Add a column', 'small', function(){ page.columns.push({ w:1, blocks:[] }); changed(true); }), page.columns.length >= 6));
  s2.appendChild(tree); body.appendChild(s2);

  var strip = page.strip || [];
  var s3 = sec('Footer row', strip.length ? strip.length + (strip.length === 1 ? ' box' : ' boxes') : 'None');
  if (strip.length) {
    var t3 = el('div', 'ed-tree');
    strip.forEach(function(cell, ci){ t3.appendChild(group('Footer box ' + (ci + 1), cell, strip, ci, 1)); });
    var fr = el('div', 'ed-row');
    fr.appendChild(disable(btn('+ Add a footer box', 'small', function(){ strip.push({ blocks:[] }); changed(true); }), strip.length >= 5));
    var rm = btn('Remove the footer row', 'small danger');
    twoTap(rm, 'Remove the footer row', 'Tap again to remove it', function(){ delete page.strip; ED.sel = null; changed(true); }, 'armed');
    fr.appendChild(rm); t3.appendChild(fr); s3.appendChild(t3);
  } else {
    s3.appendChild(txt('p', 'ed-note', 'A footer row runs across the bottom of the page, under all the columns.'));
    s3.appendChild(btn('Add a footer row', 'small', function(){ page.strip = [{ blocks:[] }, { blocks:[] }, { blocks:[] }]; changed(true); }));
  }
  body.appendChild(s3);
}

function viewBlock(body){
  var b = ED.sel.block, list = ED.sel.list, S = SCHEMA[b.type] || { label: b.type, fields: [] };
  body.appendChild(btn('← Back to page ' + (idx + 1), 'small ghost', function(){ ED.sel = null; renderPanel(); markSel(); }));
  var page = ED.draft.pages[idx] || {}, conts = containers(page), where = conts.filter(function(c){ return c.list === list; })[0];
  var s = sec(S.label, where ? where.name : 'Inside a box');
  if (where) {
    var mv = el('select', 'ed-in');
    conts.forEach(function(c, i){ var o = txt('option', null, c.name); o.value = i; if (c.list === list) o.selected = true; mv.appendChild(o); });
    mv.addEventListener('change', function(){
      var target = conts[+mv.value].list; list.splice(list.indexOf(b), 1); target.push(b);
      ED.sel = { block: b, list: target }; changed(true);
    });
    s.appendChild(field('Where it sits', mv, 'Moving a block puts it at the bottom of that column'));
  }
  if (S.note) s.appendChild(txt('p', 'ed-note', S.note));
  (S.fields || []).forEach(function(f){ s.appendChild(buildField(b, f)); });
  body.appendChild(s);
  if (S.special === 'crossword') body.appendChild(cwEditor(b));
  if (S.special === 'sudoku') body.appendChild(sdEditor(b));
  if (S.special === 'wordsearch') body.appendChild(wsEditor(b));
  if (b.type === 'box') {
    b.blocks = b.blocks || [];
    var inner = el('div', 'ed-group'), hh = el('header');
    hh.appendChild(txt('b', null, 'Inside this box')); inner.appendChild(hh);
    inner.appendChild(blockList(b.blocks)); inner.appendChild(addButton(b.blocks, 'Add inside this box'));
    s.appendChild(inner);
  }
  var acts = el('div', 'ed-row');
  acts.appendChild(btn('Duplicate', 'small', function(){ var c = freshIds(clone(b)); list.splice(list.indexOf(b) + 1, 0, c); ED.sel = { block: c, list: list }; changed(true); }));
  var del = btn('Delete this block', 'small danger');
  twoTap(del, 'Delete this block', 'Tap again to delete', function(){ list.splice(list.indexOf(b), 1); ED.sel = null; changed(true); }, 'armed');
  acts.appendChild(del);
  body.appendChild(acts);
}

function viewPages(body){
  var pages = ED.draft.pages = ED.draft.pages || [];
  var s = sec('Pages', pages.length + (pages.length === 1 ? ' page' : ' pages')), ul = el('ul', 'ed-pages');
  pages.forEach(function(p, i){
    var li = el('li', 'ed-page' + (i === idx ? ' on' : '')), main = el('button', 'ed-bl-main'); main.type = 'button';
    main.appendChild(txt('span', null, 'Page ' + (i + 1)));
    main.appendChild(txt('em', null, p.plate ? 'Front page' : (plain(p.runhead && p.runhead.center) || 'Untitled section')));
    main.addEventListener('click', function(){ goTo(i); ED.tab = 'page'; ED.sel = null; renderPanel(); });
    li.appendChild(main);
    li.appendChild(ico('↑', 'Move page ' + (i + 1) + ' earlier', function(){ swap(pages, i, i - 1); if (idx === i) idx = i - 1; else if (idx === i - 1) idx = i; changed(true); }, i === 0));
    li.appendChild(ico('↓', 'Move page ' + (i + 1) + ' later', function(){ swap(pages, i, i + 1); if (idx === i) idx = i + 1; else if (idx === i + 1) idx = i; changed(true); }, i === pages.length - 1));
    li.appendChild(ico('⧉', 'Duplicate page ' + (i + 1), function(){ pages.splice(i + 1, 0, freshIds(clone(p))); changed(true); }));
    li.appendChild(delIco('Delete page ' + (i + 1), function(){
      pages.splice(i, 1); if (idx > i || idx >= pages.length) idx = Math.max(0, idx - 1); ED.sel = null; changed(true);
    }, pages.length <= 1));
    ul.appendChild(li);
  });
  s.appendChild(ul); body.appendChild(s);

  var s2 = sec('Add a page'), tpl = el('select', 'ed-in');
  Object.keys(TEMPLATES).forEach(function(k){ var o = txt('option', null, TEMPLATES[k].label); o.value = k; tpl.appendChild(o); });
  s2.appendChild(field('Start from', tpl));
  s2.appendChild(btn('Add after page ' + (idx + 1), 'primary', function(){
    pages.splice(idx + 1, 0, TEMPLATES[tpl.value].make()); idx = idx + 1; ED.sel = null; ED.tab = 'page'; changed(true);
  }));
  body.appendChild(s2);
}

function viewIssue(body){
  var m = ED.draft.masthead = ED.draft.masthead || {};
  var s = sec('Nameplate');
  s.appendChild(field('Paper name', inText(m, 'name')));
  s.appendChild(field('Motto', inText(m, 'motto'), 'Printed in italics under the name'));
  body.appendChild(s);

  var s2 = sec('This edition'), r1 = el('div', 'ed-row');
  r1.appendChild(field('Volume', inText(m, 'volume'))); r1.appendChild(field('Number', inText(m, 'number')));
  s2.appendChild(r1);
  var dateIn = inText(m, 'date'), r2 = el('div', 'ed-row');
  r2.appendChild(field('Date', dateIn, '{{date}} prints today’s date and changes by itself at midnight'));
  r2.appendChild(btn('Print today’s date automatically', 'small', function(){ m.date = '{{date}}'; dateIn.value = m.date; changed(); }));
  s2.appendChild(r2);
  var r3 = el('div', 'ed-row');
  r3.appendChild(field('Town', inText(m, 'place'))); r3.appendChild(field('Price', inText(m, 'price')));
  s2.appendChild(r3);
  s2.appendChild(field('Front-page line', inText(m, 'meta'), 'e.g. Sunrise {{sunrise}} · Sunset {{sunset}} · High water {{highWater}}'));
  s2.appendChild(field('Page count line', inText(m, 'pages'), 'e.g. Twelve Pages'));
  body.appendChild(s2);

  var liveBox = el('div'); liveBox.appendChild(liveSection());
  body.appendChild(locationSection(function(){ liveBox.innerHTML = ''; liveBox.appendChild(liveSection()); }));
  body.appendChild(liveBox);

  var s3 = sec('Next edition');
  s3.appendChild(txt('p', 'ed-note', 'Moves the edition number on by one and sets today’s date. Stories, pages and games stay as they are so you can update them.'));
  s3.appendChild(btn('Start the next edition', 'primary', function(){
    var before = m.number || '';
    m.number = /\d/.test(before) ? before.replace(/\d[\d,]*/, function(n){ return (parseInt(n.replace(/,/g, ''), 10) + 1).toLocaleString('en-US'); }) : 'No. 1';
    if (!/\{\{/.test(m.date || '')) m.date = '{{date}}';
    changed(true);
    msg('Ready for ' + plain(m.number) + '. Update the stories, then publish.', 'ok');
  }));
  body.appendChild(s3);

  body.appendChild(websiteSection());

  var s4 = sec('Backup');
  s4.appendChild(txt('p', 'ed-note', 'Save this edition as a file, or load one you saved earlier. Loading only changes the editor until you publish.'));
  var r4 = el('div', 'ed-row');
  r4.appendChild(btn('Download as a file', 'small', downloadJSON));
  var f = el('input', 'ed-file'); f.type = 'file'; f.accept = 'application/json,.json'; f.setAttribute('aria-label', 'Load an edition from a file');
  f.addEventListener('change', function(){ if (f.files && f.files[0]) loadJSONFile(f.files[0]); });
  r4.appendChild(f); s4.appendChild(r4);
  body.appendChild(s4);
}

function viewTheme(body){
  var t = themeOf(ED.draft);
  function th(){ return ED.draft.theme = ED.draft.theme || { preset: t.preset }; }
  var custom = !!(ED.draft.theme && (ED.draft.theme.colors || ED.draft.theme.fonts));
  var s = sec('Look', custom ? PRESETS[t.preset].label + ', customised' : PRESETS[t.preset].label), grid = el('div', 'ed-presets');
  Object.keys(PRESETS).forEach(function(k){
    var P = PRESETS[k], b = el('button', 'ed-preset'); b.type = 'button';
    b.setAttribute('aria-pressed', t.preset === k && !custom ? 'true' : 'false');
    b.style.background = P.colors.paper; b.style.color = P.colors.ink;
    loadFont(P.fonts.plate);
    var nm = txt('span', 'name', P.label); nm.style.fontFamily = '"' + P.fonts.plate + '",serif';
    var sw = el('span', 'sw');
    ['paper', 'ink', 'accent', 'hl'].forEach(function(c){ var i = el('i'); i.style.background = P.colors[c]; sw.appendChild(i); });
    b.appendChild(nm); b.appendChild(sw); b.appendChild(txt('small', null, P.note));
    b.addEventListener('click', function(){ ED.draft.theme = { preset: k }; changed(true); });
    grid.appendChild(b);
  });
  s.appendChild(grid); body.appendChild(s);

  var s2 = sec('Colours'), cg = el('div', 'ed-colors');
  COLOR_KEYS.forEach(function(ck){
    var l = el('label', 'ed-color'), i = el('input', 'ed-in'); i.type = 'color'; i.value = t.colors[ck[0]];
    i.addEventListener('input', function(){ var x = th(); x.colors = x.colors || {}; x.colors[ck[0]] = i.value; changed(); });
    l.appendChild(i); l.appendChild(document.createTextNode(ck[1])); cg.appendChild(l);
  });
  s2.appendChild(cg); body.appendChild(s2);

  var s3 = sec('Typefaces');
  var samples = { plate: plain(ED.draft.masthead && ED.draft.masthead.name) || 'The Daily Guble', head: 'Council votes to keep the light', body: 'The selectmen voted seven to two on Sunday evening.', util: 'By Marguerite Tolliver · Page 3' };
  FONT_ROLES.forEach(function(r){
    var sel = el('select', 'ed-in'), list = FONTS[r[0]].slice();
    if (list.indexOf(t.fonts[r[0]]) < 0) list.unshift(t.fonts[r[0]]);
    list.forEach(function(f){ var o = txt('option', null, f); o.value = f; sel.appendChild(o); });
    sel.value = t.fonts[r[0]];
    var prev = txt('div', 'ed-fontprev', samples[r[0]]); prev.style.fontFamily = '"' + t.fonts[r[0]] + '",' + FALLBACK[r[0]];
    sel.addEventListener('change', function(){
      var x = th(); x.fonts = x.fonts || {}; x.fonts[r[0]] = sel.value; loadFont(sel.value);
      prev.style.fontFamily = '"' + sel.value + '",' + FALLBACK[r[0]]; changed();
    });
    var f = field(r[1], sel); f.appendChild(prev); s3.appendChild(f);
  });
  s3.appendChild(btn('Reset colours and typefaces to ' + PRESETS[t.preset].label, 'small', function(){ ED.draft.theme = { preset: t.preset }; changed(true); }));
  body.appendChild(s3);
}

function viewHistory(body){
  var s = sec('Published editions', 'Newest first');
  s.appendChild(txt('p', 'ed-note', 'Every publish is kept on the server. Load an older one to look at it or bring it back. Readers see no change until you publish.'));
  var list = el('ul', 'ed-pages'); s.appendChild(list); body.appendChild(s);
  if (!ED.history) {
    list.appendChild(txt('li', 'ed-note', 'Loading…'));
    api('GET', '/api/history').then(function(r){
      if (r.status === 401) { sessionEnded(); return; }
      ED.history = r.items || []; if (ED.tab === 'history') renderPanel();
    }, function(){ msg('Couldn’t load the history. Check your connection.', 'warn'); });
    return;
  }
  if (!ED.history.length) list.appendChild(txt('li', 'ed-note', 'Nothing has been published from the newsroom yet.'));
  ED.history.forEach(function(h){
    var li = el('li', 'ed-page'), main = el('div', 'ed-bl-main');
    main.appendChild(txt('span', null, 'Version ' + h.version + (h.version === LIVE_VERSION ? ' · live now' : '')));
    main.appendChild(txt('em', null, new Date(h.savedAt).toLocaleString([], { dateStyle:'medium', timeStyle:'short' })));
    li.appendChild(main);
    var b = btn('Load', 'small');
    b.addEventListener('click', function(){
      b.disabled = true;
      api('GET', '/api/history/' + encodeURIComponent(h.id)).then(function(r){
        b.disabled = false;
        if (r.status === 401) { sessionEnded(); return; }
        if (!r.issue) { msg('That version couldn’t be loaded.', 'warn'); return; }
        ED.draft = r.issue; ED.sel = null; idx = 0; ED.tab = 'page'; changed(true);
        msg('Loaded version ' + h.version + '. Publish to make it the live edition again.', 'ok');
      }, function(){ b.disabled = false; msg('Couldn’t reach the server.', 'warn'); });
    });
    li.appendChild(b); list.appendChild(li);
  });
}

/* =========================================================
   EDITOR — game builders
   ========================================================= */
function keyCatcher(onKey, onChar, onErase, mode){
  var i = el('input', 'ed-catch'); i.type = 'text';
  i.setAttribute('autocomplete', 'off'); i.setAttribute('autocapitalize', 'characters'); i.setAttribute('spellcheck', 'false');
  i.setAttribute('aria-label', 'Type into the grid'); if (mode) i.setAttribute('inputmode', mode);
  function reset(){ i.value = ' '; try { i.setSelectionRange(1, 1); } catch (e) {} }
  i.addEventListener('keydown', function(e){ if (onKey(e)) e.preventDefault(); });
  i.addEventListener('input', function(){
    var v = i.value;
    if (!v.length) onErase(); else for (var k = 0; k < v.length; k++) if (v[k] !== ' ') onChar(v[k]);
    reset();
  });
  i.focusGrid = function(){ reset(); i.focus({ preventScroll: true }); };
  return i;
}
var ARROWS = { ArrowLeft:[0,-1], ArrowRight:[0,1], ArrowUp:[-1,0], ArrowDown:[1,0] };

function cwEditor(b){
  if (!b.grid || !b.grid.length) b.grid = ['.....', '.....', '.....', '.....', '.....'];
  b.across = b.across || {}; b.down = b.down || {};
  var size = Math.max(b.grid.length, b.grid.reduce(function(m, r){ return Math.max(m, String(r).length); }, 0));
  var mode = 'letters', sel = 0, dir = 'a', slotClue = {};
  cwAnalyze(b.grid).words.forEach(function(w){ var bank = w.dir === 'a' ? b.across : b.down, v = bank[w.ans] || bank[w.num]; if (v) slotClue[w.key] = v; });

  var out = el('div', 'ed-sec');
  var s = sec('Build the grid'), ctr = el('div', 'ed-row');
  var sizeSel = el('select', 'ed-in');
  [5, 7, 9, 11, 13, 15].concat([5, 7, 9, 11, 13, 15].indexOf(size) < 0 ? [size] : []).forEach(function(n){ var o = txt('option', null, n + ' by ' + n); o.value = n; sizeSel.appendChild(o); });
  sizeSel.value = size;
  ctr.appendChild(field('Size', sizeSel));
  var seg = el('div', 'ed-seg'), bL = txt('button', null, 'Letters'), bB = txt('button', null, 'Black squares');
  bL.type = bB.type = 'button'; seg.appendChild(bL); seg.appendChild(bB);
  var segF = el('div', 'ed-field'); segF.appendChild(txt('span', 'ed-label', 'Clicking a square adds')); segF.appendChild(seg);
  ctr.appendChild(segF); s.appendChild(ctr);
  var mirL = el('label', 'ed-check'), mirC = el('input'); mirC.type = 'checkbox'; mirC.checked = true;
  mirL.appendChild(mirC); mirL.appendChild(document.createTextNode('Mirror black squares, like a printed crossword')); s.appendChild(mirL);
  var holder = el('div'); holder.style.position = 'relative';
  var gridEl = el('div', 'ed-grid'); holder.appendChild(gridEl);
  var catcher = keyCatcher(onKey, onChar, onErase); holder.appendChild(catcher);
  s.appendChild(holder);
  var status = el('p', 'ed-note'); s.appendChild(status);
  s.appendChild(txt('p', 'ed-hint', 'Click a square and type. Click it again, or press Space, to switch between Across and Down. Type a full stop to make a square black.'));
  var cs = sec('Clues', 'Matched to each answer'), cluesBox = el('div', 'ed-clues'); cs.appendChild(cluesBox);
  out.appendChild(s); out.appendChild(cs);

  function arr(){
    var a = [];
    for (var r = 0; r < size; r++) { var row = String(b.grid[r] || '').toUpperCase(); for (var c = 0; c < size; c++) { var ch = row[c]; a.push(ch === '#' ? '#' : (/[A-Z]/.test(ch || '') ? ch : '.')); } }
    return a;
  }
  function syncClues(){
    var A = cwAnalyze(b.grid);
    ['a', 'd'].forEach(function(d){
      var bank = d === 'a' ? b.across : b.down, keep = {};
      A.words.forEach(function(w){
        if (w.dir !== d || w.ans.indexOf('.') >= 0) return;
        keep[w.ans] = 1;
        if (bank[w.ans] == null && slotClue[w.key]) bank[w.ans] = slotClue[w.key];
      });
      Object.keys(bank).forEach(function(k){ if (!keep[k] && !/^\d+$/.test(k)) delete bank[k]; });
    });
  }
  function write(a){
    var g = []; for (var r = 0; r < size; r++) g.push(a.slice(r * size, (r + 1) * size).join(''));
    b.grid = g; syncClues(); changed(); draw();
  }
  function nextIn(a, from, delta){
    var r = Math.floor(from / size), c = from % size;
    if (dir === 'a') c += delta; else r += delta;
    if (r < 0 || r >= size || c < 0 || c >= size) return -1;
    var k = r * size + c; return a[k] === '#' ? -1 : k;
  }
  function toggleBlack(k){
    var a = arr(), black = a[k] !== '#';
    a[k] = black ? '#' : '.';
    if (mirC.checked) { var m = size * size - 1 - k; if (m !== k) a[m] = black ? '#' : (a[m] === '#' ? '.' : a[m]); }
    write(a);
  }
  function onChar(ch){
    if (ch === '.' || ch === '#') { toggleBlack(sel); return; }
    if (!/[a-z]/i.test(ch)) return;
    var a = arr(); a[sel] = ch.toUpperCase();
    var nx = nextIn(a, sel, 1); if (nx >= 0) sel = nx;
    write(a);
  }
  function onErase(){
    var a = arr();
    if (a[sel] !== '.' && a[sel] !== '#') a[sel] = '.';
    else { var pv = nextIn(a, sel, -1); if (pv >= 0) { sel = pv; a[sel] = '.'; } }
    write(a);
  }
  function onKey(e){
    var k = e.key;
    if (k === 'Backspace') { onErase(); return true; }
    if (k === 'Delete') { var a = arr(); if (a[sel] !== '#') a[sel] = '.'; write(a); return true; }
    if (k === ' ') { dir = dir === 'a' ? 'd' : 'a'; draw(); return true; }
    if (k === '.' || k === '#') { toggleBlack(sel); return true; }
    var mv = ARROWS[k];
    if (mv) {
      var r = Math.floor(sel / size) + mv[0], c = sel % size + mv[1];
      if (r >= 0 && r < size && c >= 0 && c < size) sel = r * size + c;
      dir = mv[1] ? 'a' : 'd'; draw(); return true;
    }
    return false;
  }
  function draw(){
    var A = cwAnalyze(b.grid), a = arr();
    gridEl.style.setProperty('--n', size); gridEl.innerHTML = '';
    var at = A.at[sel], wi = at ? at[dir] : -1;
    if (wi < 0 && at) { var o = dir === 'a' ? 'd' : 'a'; if (at[o] >= 0) { dir = o; wi = at[o]; } }
    var w = wi >= 0 ? A.words[wi] : null;
    a.forEach(function(ch, k){
      var d = el('div', 'ed-cell' + (ch === '#' ? ' blk' : ''));
      if (mode === 'letters' && k === sel) d.classList.add('sel');
      else if (mode === 'letters' && w && w.cells.indexOf(k) >= 0) d.classList.add('hl');
      if (ch !== '#') {
        if (A.nums[k]) d.appendChild(txt('span', 'n', String(A.nums[k])));
        if (ch !== '.') d.appendChild(document.createTextNode(ch));
      }
      d.addEventListener('click', function(){
        if (mode === 'black') { toggleBlack(k); return; }
        if (k === sel) dir = dir === 'a' ? 'd' : 'a';
        sel = k; draw(); catcher.focusGrid();
      });
      gridEl.appendChild(d);
    });
    var empty = a.filter(function(c){ return c === '.'; }).length;
    status.className = 'ed-note ' + (empty ? 'warn' : 'ok');
    status.textContent = empty
      ? empty + (empty === 1 ? ' square is' : ' squares are') + ' still empty. Readers can only finish once every white square has a letter.'
      : 'Every square is filled: ' + A.words.length + ' answers.';
    cluesBox.innerHTML = '';
    [['a', 'Across'], ['d', 'Down']].forEach(function(g){
      var ws = A.words.filter(function(x){ return x.dir === g[0]; });
      if (!ws.length) return;
      cluesBox.appendChild(txt('span', 'ed-label', g[1]));
      ws.forEach(function(x){
        var row = el('div', 'ed-clue'), bank = g[0] === 'a' ? b.across : b.down, done = x.ans.indexOf('.') < 0;
        row.appendChild(txt('b', null, x.num + ' ' + g[1]));
        row.appendChild(txt('code', null, x.ans.replace(/\./g, '·')));
        var inp = el('input', 'ed-in'); inp.type = 'text'; inp.style.gridColumn = '1 / -1';
        inp.setAttribute('aria-label', 'Clue for ' + x.num + ' ' + g[1]);
        inp.value = (done ? bank[x.ans] : null) || slotClue[x.key] || '';
        inp.placeholder = done ? 'Write the clue' : 'Finish this answer first';
        inp.addEventListener('input', function(){
          slotClue[x.key] = inp.value;
          if (x.ans.indexOf('.') < 0) { if (inp.value) bank[x.ans] = inp.value; else delete bank[x.ans]; changed(); }
        });
        row.appendChild(inp); cluesBox.appendChild(row);
      });
    });
    bL.setAttribute('aria-pressed', mode === 'letters' ? 'true' : 'false');
    bB.setAttribute('aria-pressed', mode === 'black' ? 'true' : 'false');
  }
  sizeSel.addEventListener('change', function(){
    var n = +sizeSel.value, a = arr(), na = [];
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) na.push(r < size && c < size ? a[r * size + c] : '.');
    size = n; sel = 0; write(na);
  });
  bL.addEventListener('click', function(){ mode = 'letters'; draw(); });
  bB.addEventListener('click', function(){ mode = 'black'; draw(); });
  draw();
  return out;
}

function sdEditor(b){
  var out = sec('Build the puzzle'), sel = 0;
  out.classList.add('ed-sd');
  var ctr = el('div', 'ed-row'), diff = el('select', 'ed-in');
  [['36', 'Easy, 36 numbers'], ['30', 'Medium, 30 numbers'], ['25', 'Hard, 25 numbers']].forEach(function(o){ var op = txt('option', null, o[1]); op.value = o[0]; diff.appendChild(op); });
  diff.value = '30';
  ctr.appendChild(field('Difficulty', diff));
  var gen = btn('Make a new puzzle', 'small', function(){
    gen.disabled = true; gen.textContent = 'Making…';
    setTimeout(function(){ b.givens = sdGenerate(+diff.value); gen.disabled = false; gen.textContent = 'Make a new puzzle'; changed(); draw(); }, 20);
  });
  ctr.appendChild(gen); out.appendChild(ctr);
  var holder = el('div'); holder.style.position = 'relative';
  var gridEl = el('div', 'ed-grid'); gridEl.style.setProperty('--n', 9); holder.appendChild(gridEl);
  var catcher = keyCatcher(onKey, onChar, onErase, 'numeric'); holder.appendChild(catcher);
  out.appendChild(holder);
  var status = el('p', 'ed-note'); out.appendChild(status);
  out.appendChild(txt('p', 'ed-hint', 'Click a square and type a number. Backspace or 0 clears it. Arrow keys move.'));
  var clr = btn('Empty the grid', 'small danger');
  twoTap(clr, 'Empty the grid', 'Tap again to empty it', function(){ b.givens = new Array(82).join('.'); changed(); draw(); }, 'armed');
  out.appendChild(clr);

  function g(){ var a = sdParse(b.givens); while (a.length < 81) a.push(0); return a.slice(0, 81); }
  function write(a){ b.givens = a.map(function(d){ return d ? String(d) : '.'; }).join(''); changed(); draw(); }
  function onChar(ch){
    var a = g();
    if (/[1-9]/.test(ch)) { a[sel] = +ch; if (sel < 80) sel++; write(a); }
    else if (ch === '0' || ch === '.') { a[sel] = 0; write(a); }
  }
  function onErase(){ var a = g(); if (a[sel]) a[sel] = 0; else if (sel > 0) { sel--; a[sel] = 0; } write(a); }
  function onKey(e){
    if (e.key === 'Backspace') { onErase(); return true; }
    if (e.key === 'Delete') { var a = g(); a[sel] = 0; write(a); return true; }
    var mv = ARROWS[e.key];
    if (mv) { var r = (Math.floor(sel / 9) + mv[0] + 9) % 9, c = (sel % 9 + mv[1] + 9) % 9; sel = r * 9 + c; draw(); return true; }
    return false;
  }
  function draw(){
    var a = g(); gridEl.innerHTML = '';
    a.forEach(function(d, k){
      var r = Math.floor(k / 9), c = k % 9;
      var cell = el('div', 'ed-cell given' + (c === 2 || c === 5 ? ' sd-br' : '') + (r === 2 || r === 5 ? ' sd-bb' : '') + (k === sel ? ' sel' : ''));
      if (d) cell.textContent = d;
      cell.addEventListener('click', function(){ sel = k; draw(); catcher.focusGrid(); });
      gridEl.appendChild(cell);
    });
    var n = a.filter(Boolean).length, count = sdCount(a, 2);
    if (count === 0) { status.className = 'ed-note warn'; status.textContent = n + ' numbers. These can’t be solved. Change or remove one.'; }
    else if (count === 1) { status.className = 'ed-note ok'; status.textContent = n + ' numbers and exactly one solution. Ready to print.'; }
    else { status.className = 'ed-note warn'; status.textContent = n + ' numbers, but more than one solution. Add a few more so readers have a single answer.'; }
  }
  draw();
  return out;
}

function wsEditor(b){
  var out = sec('Words to hide');
  var ta = el('textarea', 'ed-in'); ta.rows = 8; ta.value = (b.words || []).join('\n');
  ta.addEventListener('input', function(){ b.words = ta.value.split('\n').map(function(s){ return s.trim(); }).filter(Boolean); changed(); upd(); });
  out.appendChild(field('One word per line', ta, 'Letters only. Spaces and punctuation are dropped.'));
  var row = el('div', 'ed-row'), sz = el('select', 'ed-in');
  for (var n = 8; n <= 15; n++) { var o = txt('option', null, n + ' by ' + n); o.value = n; sz.appendChild(o); }
  sz.value = b.size || 10;
  sz.addEventListener('change', function(){ b.size = +sz.value; changed(); upd(); });
  row.appendChild(field('Grid size', sz));
  row.appendChild(btn('Shuffle the letters', 'small', function(){ b.seed = Math.floor(Math.random() * 1e9); changed(); upd(); }));
  out.appendChild(row);
  var st = el('p', 'ed-note'); out.appendChild(st);
  function upd(){
    var ws = wsBuild(b.words, b.size || 10, b.seed || 1);
    if (!ws.words.length && !ws.unplaced.length) { st.className = 'ed-note warn'; st.textContent = 'Add at least one word.'; }
    else if (ws.unplaced.length) { st.className = 'ed-note warn'; st.textContent = 'Couldn’t fit: ' + ws.unplaced.join(', ') + '. Make the grid bigger, shuffle, or use shorter words.'; }
    else { st.className = 'ed-note ok'; st.textContent = 'All ' + ws.words.length + ' words are hidden in the grid.'; }
  }
  upd();
  return out;
}

/* =========================================================
   EDITOR — clicking the paper selects blocks; boot
   ========================================================= */
function wireEditorHooks(){
  book.addEventListener('pointerdown', function(e){ if (ED.open && e.target.closest('[data-pz]')) e.stopPropagation(); }, true);
  book.addEventListener('click', function(e){
    if (!ED.open) return;
    e.preventDefault(); e.stopPropagation();
    if (stage.__justDragged) return;
    var n = e.target.closest('[data-bid]'); if (!n) return;
    var info = BIDMAP[n.dataset.bid]; if (!info) return;
    ED.sel = info; ED.tab = 'page';
    if (document.body.classList.contains('ed-peek')) setPeek(false);
    renderPanel(); markSel();
  }, true);
  hooks.onPage = function(i){
    if (!ED.open || ED.lastPage === i) return;
    ED.lastPage = i; ED.sel = null;
    if (panel && (ED.tab === 'page' || ED.tab === 'pages')) renderPanel();
  };
}

mountShell();
wireView();
wireEditorHooks();
hooks.issue = function(){ return current(); };
hooks.rerender = function(){ renderPaper(); };
loadAlmanac(ISSUE, liveUpdated);
applyTheme(ISSUE);
buildSheets(ISSUE);
measure();
if (window.ResizeObserver) new ResizeObserver(measure).observe(stage);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
startLiveClock();
openEditor();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ setTimeout(checkFit, 300); });
