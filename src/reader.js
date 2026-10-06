
/* Reader bundle: draw today's edition and wire the controls. */
mountShell();
wireView();
wireClips();                            // readers can clip pages, like a real paper
wireNight();                            // dark newsprint after sunset
hooks.issue = function(){ return ISSUE; };
hooks.lazyPages = true;                 // draw the page being read first, the rest in the background
hooks.rerender = function(){ buildSheets(ISSUE); measure(); };
loadAlmanac(ISSUE, function(){ liveUpdated(); updateNight(); });   // date, sun and moon now; tides and weather as they arrive
/* The news: shown as soon as it's here, refreshed when the hour turns, never while someone is reading. */
function showNews(){ if (newsBusy()) { NEWS.pending = true; return; } NEWS.pending = false; hooks.rerender(); refreshLive(); }
loadNews(showNews);
var shownDay = dayKey();
setInterval(function(){
  loadNews(showNews);
  updateNight();
  if (dayKey() !== shownDay && !newsBusy()) { shownDay = dayKey(); hooks.rerender(); }    // midnight: today's puzzles
  else if (NEWS.pending) showNews();
}, 30000);
applyTheme(ISSUE);
nightLabel();
buildSheets(ISSUE);
measure();
startLiveClock();
setTimeout(showHint, 1200);
if (window.ResizeObserver) new ResizeObserver(measure).observe(stage);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){
  measure();
  if (NEWS.fontsPending && NEWS.pool) showNews();     // columns were fitted before the typefaces arrived: fit them again
});
