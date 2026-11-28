/* Forge: the page paints first; then its scripts are fetched and run, in order.
   - It waits for the hero photograph (img[fetchpriority=high]) to land, at most 2.5 s, so the scripts never compete with it;
   - then two frames and 50 ms, so the hero is on screen before any script work begins (a second at most, for a background tab).
   - If the scripts arrive so late that the hero's words have already been shown by the CSS failsafe (about 3 s), their
     entrance is skipped (window.FORGE_LATE, html.fx-late): the words never appear twice.
   <script src="forge-boot.js" defer data-src="a.js,b.js,…"></script> */
(function () {
  var el = document.currentScript, list = el ? (el.getAttribute('data-src') || '').split(',').filter(Boolean) : [], done = false, t0 = 0;
  function shown() { var p = performance.getEntriesByType ? performance.getEntriesByType('paint') : []; return p.length ? p[p.length - 1].startTime : t0; }
  function late() {   // runs when the script before motion.js has loaded, that is just before any entrance is set up
    if (performance.now() - shown() < 3000) return;
    window.FORGE_LATE = true; document.documentElement.classList.add('fx-late');
    [].forEach.call(document.querySelectorAll('[data-now]'), function (n) { n.removeAttribute('data-split'); n.removeAttribute('data-reveal'); });
  }
  function load() {
    if (done) return; done = true;
    var gate = -1; list.forEach(function (src, i) { if (/motion\.js/.test(src)) gate = i - 1; });
    list.forEach(function (src, i) { var s = document.createElement('script'); s.src = src; s.async = false; if (i === gate) s.onload = late; document.head.appendChild(s); });
  }
  function afterPaint() { requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(load, 50); }); }); setTimeout(load, 1000); }
  function go() {
    t0 = performance.now();
    var hero = document.querySelector('img[fetchpriority=high]');
    if (!hero || hero.complete) { afterPaint(); return; }
    var fired = false, once = function () { if (fired) return; fired = true; afterPaint(); };
    hero.addEventListener('load', once); hero.addEventListener('error', once); setTimeout(once, 2500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
