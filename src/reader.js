
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
