/* =========================================================
   DAILY PUZZLES — a new sudoku, word game and mini crossword every day.
   Made in the reader's own browser at midnight their time. Everyone gets
   the same puzzles on the same date: the inputs are only the date, the
   word list and Wikipedia's front page for that day (engine/puzzles.js).
   ========================================================= */
var DAILY = { wordsP: null, feedP: {}, sd: {} };
var WIKI_FEATURED = 'https://api.wikimedia.org/feed/v1/wikipedia/en/featured/';
var SAFE = NEWS_ENGINE.makeFilter({});
function isSafeWord(w){ return SAFE({ title: w, summary: '', outlet: '', id: '' }).action === 'keep'; }
function dayKey(){ return ymdKey(todayParts()); }

function loadWords(){
  return DAILY.wordsP || (DAILY.wordsP = fetch('/words.txt').then(function(r){
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.text();
  }).then(NEWS_ENGINE.parseWordList).catch(function(e){ DAILY.wordsP = null; throw e; }));
}
function stripTags(h){
  return String(h || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}
/* The text of Wikipedia's front page for the reader's date (or the day before, early in the morning). */
function loadDayFeed(){
  var day = dayKey();
  if (DAILY.feedP[day]) return DAILY.feedP[day];
  var saved = store('dayfeed');
  if (saved && saved.day === day) return (DAILY.feedP[day] = Promise.resolve(saved));
  function get(d){ return fetch(WIKI_FEATURED + d.replace(/-/g, '/')).then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); }
  var t = todayParts(), prev = new Date(Date.UTC(t.y, t.m - 1, t.d - 1)).toISOString().slice(0, 10);
  return (DAILY.feedP[day] = get(day).catch(function(){ return get(prev); }).then(function(f){
    var texts = [], page = function(a){ return a && a.content_urls ? a.content_urls.desktop.page : null; };
    if (f.tfa) texts.push({ src: 'tfa', text: f.tfa.extract, title: f.tfa.titles ? f.tfa.titles.normalized : '', link: page(f.tfa) });
    (f.news || []).forEach(function(n){ texts.push({ src: 'news', text: stripTags(n.story), title: n.links && n.links[0] ? n.links[0].titles.normalized : '', link: page(n.links && n.links[0]) }); });
    (f.dyk || []).forEach(function(d){ texts.push({ src: 'dyk', text: stripTags(d.html || d.text) }); });
    ((f.mostread || {}).articles || []).forEach(function(a){ if (a.extract) texts.push({ src: 'read', text: a.extract, title: a.titles ? a.titles.normalized : '', link: page(a) }); });
    (f.onthisday || []).forEach(function(e){ texts.push({ src: 'otd', text: e.text }); });
    var out = { day: day, texts: texts };
    store('dayfeed', out);
    return out;
  }).catch(function(e){ delete DAILY.feedP[day]; throw e; }));
}

/* ---------------- sudoku: harder as the week goes on ---------------- */
var SD_LEVELS = [['Moderate', 30], ['Gentle', 38], ['Gentle', 35], ['Moderate', 32], ['Moderate', 30], ['Tough', 28], ['Tough', 26]];   // Sunday first
function dailySudoku(){
  var day = dayKey();
  if (DAILY.sd[day]) return DAILY.sd[day];
  var t = todayParts(), L = SD_LEVELS[new Date(Date.UTC(t.y, t.m - 1, t.d)).getUTCDay()];
  return (DAILY.sd[day] = { day: day, level: L[0], givens: sdGenerate(L[1], NEWS_ENGINE.seedFrom('sudoku:' + day) || 1) });
}

/* ---------------- the mini crossword ---------------- */
function getClues(words){
  return fetch('/api/clues?w=' + words.join(',')).then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
}
/* cb(config for Crossword(), or null). Cached for the day once every clue is in. */
function dailyMini(cb){
  var day = dayKey(), saved = store('mini');
  if (saved && saved.v === 1 && saved.day === day) { cb(saved.cfg); return; }
  Promise.all([loadWords(), loadDayFeed().catch(function(){ return { texts: [] }; })]).then(function(r){
    var W = r[0], texts = r[1].texts, banned = new Set(), rounds = 0;
    (function attempt(){
      var m = NEWS_ENGINE.makeMini(day, texts, W, isSafeWord, banned);
      if (!m) { cb(null); return; }
      var list = m.words.map(function(x){ return x.word; });
      getClues(list).then(function(res){
        var clues = res.clues || {}, across = {}, down = {}, redo = [], fromNews = 0;
        m.words.forEach(function(x){
          var c = clues[x.word];
          // a word from today's Wikipedia gets its sentence as the clue, up to twice a puzzle
          if (fromNews < 2 && m.today.indexOf(x.word) >= 0) { var b = NEWS_ENGINE.blankClue(x.word, texts.filter(function(t){ return t.src === 'tfa' || t.src === 'news' || t.src === 'dyk'; })); if (b) { c = b + ' (Wikipedia today)'; fromNews++; } }
          if (!c && res.complete) c = NEWS_ENGINE.blankClue(x.word, texts);
          if (!c && res.complete) redo.push(x.word);
          (x.dir === 'a' ? across : down)[x.word.toUpperCase()] = c || '(clue on its way)';
        });
        if (redo.length && rounds++ < 4) { redo.forEach(function(w){ banned.add(w); }); attempt(); return; }
        var cfg = { id: 'mini-' + day, grid: m.rows.map(function(row){ return row.toUpperCase(); }), across: across, down: down };
        if (res.complete && !redo.length) store('mini', { v: 1, day: day, cfg: cfg });
        cb(cfg);
      }).catch(function(){ cb(null); });
    })();
  }).catch(function(){ cb(null); });
}
var handMadeCrossword = BLOCKS.crossword;
BLOCKS.crossword = function(b){
  if (!b.daily) return handMadeCrossword(b);
  var holder = el('div', 'pz-daily');
  holder.appendChild(txt('p', 'tide-note', 'Making today’s mini crossword…'));
  dailyMini(function(cfg){
    holder.innerHTML = '';
    try {
      if (cfg) {
        holder.appendChild(Crossword(cfg));
        holder.appendChild(txt('p', 'tide-note pz-credit', 'A new mini every day, from Wikipedia’s front page. Clues from Wiktionary (CC BY-SA).'));
      } else if (b.grid) holder.appendChild(handMadeCrossword(b));
      else holder.appendChild(txt('p', 'tide-note', 'Today’s crossword needs a connection. It will be here next time you open the paper online.'));
    } catch (e) { holder.appendChild(txt('p', 'tide-note', 'Today’s crossword could not be drawn.')); }
  });
  return holder;
};

/* ---------------- the word game: six tries at today's five-letter word ---------------- */
function scoreGuess(guess, answer){
  var res = ['miss', 'miss', 'miss', 'miss', 'miss'], left = {};
  for (var i = 0; i < 5; i++) { if (guess[i] === answer[i]) res[i] = 'hit'; else left[answer[i]] = (left[answer[i]] || 0) + 1; }
  for (var j = 0; j < 5; j++) if (res[j] !== 'hit' && left[guess[j]]) { res[j] = 'near'; left[guess[j]]--; }
  return res;
}
function WordGame(cfg){
  var day = dayKey(), key = 'wd:' + day, saved = store(key) || {};
  var guesses = saved.g || [], cur = '', answer = null, W = null, source = null, live = false, msgTimer = null;
  var root = el('div', 'pz pz-wd'); root.dataset.pz = '';
  var gridEl = el('div', 'wd-grid'), cells = [];
  for (var r = 0; r < 6; r++) { var row = el('div', 'wd-row'); for (var c = 0; c < 5; c++) { var d = el('div', 'wd-cell'); row.appendChild(d); cells.push(d); } gridEl.appendChild(row); }
  var kb = el('div', 'wd-kb'), keys = {};
  ['qwertyuiop', 'asdfghjkl', '>zxcvbnm<'].forEach(function(line){
    var kr = el('div', 'wd-kr');
    line.split('').forEach(function(ch){
      var b = pzButton(ch === '>' ? 'Enter' : ch === '<' ? '⌫' : ch.toUpperCase(), 'wd-key' + (ch === '>' || ch === '<' ? ' wd-wide' : ''));
      if (ch === '<') b.setAttribute('aria-label', 'Delete');
      b.addEventListener('click', function(){ PZ.activate(api); if (ch === '>') submit(); else if (ch === '<') api.erase(); else api.type(ch); });
      if (ch !== '>' && ch !== '<') keys[ch] = b;
      kr.appendChild(b);
    });
    kb.appendChild(kr);
  });
  var status = el('p', 'wd-status');
  [gridEl, status, kb].forEach(function(x){ root.appendChild(x); });
  gridEl.addEventListener('click', function(){ PZ.activate(api); });

  function done(){ return !!answer && (guesses.indexOf(answer) >= 0 || guesses.length >= 6); }
  function say(text, keep){ clearTimeout(msgTimer); status.textContent = text; if (!keep) msgTimer = setTimeout(function(){ if (!done()) status.textContent = ''; }, 2200); }
  function draw(){
    var best = {};
    cells.forEach(function(x){ x.textContent = ''; x.className = 'wd-cell'; });
    guesses.forEach(function(g, gi){
      var s = scoreGuess(g, answer);
      for (var i = 0; i < 5; i++) {
        var cell = cells[gi * 5 + i]; cell.textContent = g[i].toUpperCase(); cell.classList.add(s[i]);
        var rank = { hit: 3, near: 2, miss: 1 }[s[i]];
        if (!best[g[i]] || rank > best[g[i]]) best[g[i]] = rank;
      }
    });
    if (!done()) for (var k = 0; k < cur.length; k++) { var cc = cells[guesses.length * 5 + k]; cc.textContent = cur[k].toUpperCase(); cc.classList.add('typed'); }
    Object.keys(keys).forEach(function(ch){ keys[ch].className = 'pz-btn wd-key' + (best[ch] ? ' ' + ['', 'miss', 'near', 'hit'][best[ch]] : ''); });
    root.classList.toggle('solved', guesses.indexOf(answer) >= 0);
    root.classList.toggle('live', live);
    if (done()) {
      status.innerHTML = '';
      status.appendChild(document.createTextNode(guesses.indexOf(answer) >= 0 ? 'Got it in ' + guesses.length + '. ' : 'Today’s word was ' + answer.toUpperCase() + '. '));
      if (source && source.link && /^https:\/\//.test(source.link)) {
        status.appendChild(document.createTextNode('It was in today’s Wikipedia: '));
        var a = txt('a', null, source.title || 'read more'); a.href = source.link; a.target = '_blank'; a.rel = 'noopener noreferrer';
        status.appendChild(a); status.appendChild(document.createTextNode('.'));
      } else status.appendChild(document.createTextNode('A new word tomorrow.'));
    }
  }
  function submit(){
    if (!answer || done()) return;
    if (cur.length < 5) { say('Five letters, please.'); return; }
    if (!W.all.has(cur)) { say('That’s not in the word list.'); return; }
    guesses.push(cur); cur = '';
    store(key, { g: guesses });
    clearTimeout(msgTimer);
    status.textContent = done() ? '' : (6 - guesses.length) + (guesses.length === 5 ? ' try' : ' tries') + ' left.';
    draw();
    if (done()) PZ.release();
  }
  var api = {
    inputMode: COARSE ? 'none' : 'text',
    setActive: function(on){ live = on; root.classList.toggle('live', on); },
    type: function(ch){ ch = String(ch).toLowerCase(); if (!answer || done() || !/^[a-z]$/.test(ch) || cur.length >= 5) return; cur += ch; draw(); },
    erase: function(){ if (cur) { cur = cur.slice(0, -1); draw(); } },
    key: function(e){
      if (e.key === 'Enter') { submit(); return true; }
      if (e.key === 'Backspace') { api.erase(); return true; }
      return false;
    }
  };
  say('Loading today’s word…', true);
  Promise.all([loadWords(), loadDayFeed().catch(function(){ return { texts: [] }; })]).then(function(r){
    W = r[0];
    var pick = NEWS_ENGINE.wordleAnswer(day, r[1].texts, W, isSafeWord);
    answer = pick.word; source = pick.source;
    guesses = guesses.filter(function(g){ return W.all.has(g); }).slice(0, 6);
    status.textContent = done() ? '' : 'Guess today’s five-letter word in six tries.';
    draw();
  }).catch(function(){ say('The word game needs a connection the first time each day.', true); });
  return root;
}
BLOCKS.wordle = function(b){ return WordGame(b); };
