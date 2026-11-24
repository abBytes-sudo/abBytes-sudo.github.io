/* Starts the page's scripts once the first paint is done, in order.
   The HTML and CSS paint first (hero photo, headline, shell); motion, data and page logic follow.
   Usage: <script src="loader.js" defer data-s="a.js,b.js,c.js" data-hero="#gal img"></script>
   - data-s: scripts to run, in order (paths relative to the page);
   - data-hero (optional): the page's largest photograph, possibly inserted by another script; otherwise img[fetchpriority=high].
   If a hero photo is on its way, the scripts wait for it to land (at most 2.5 s), so they don't compete with it for bandwidth. */
(function () {
  var me = document.currentScript, list = ((me && me.getAttribute('data-s')) || '').split(',').filter(Boolean), sel = (me && me.getAttribute('data-hero')) || 'img[fetchpriority=high]';
  function go() { list.forEach(function (src) { var s = document.createElement('script'); s.src = src.trim(); s.async = false; document.head.appendChild(s); }); }
  var done = false; function once() { if (!done) { done = true; go(); } }
  function afterPaint() { if (window.requestAnimationFrame) requestAnimationFrame(function () { setTimeout(once, 0); }); setTimeout(once, 250); }
  function watch(img) { if (img.complete) afterPaint(); else { img.addEventListener('load', afterPaint, { once: true }); img.addEventListener('error', afterPaint, { once: true }); } }
  setTimeout(once, 2500);
  var hero = document.querySelector(sel);
  if (hero) { watch(hero); return; }
  if (!(me && me.getAttribute('data-hero')) || !window.MutationObserver) { afterPaint(); return; }
  // the hero is added by another (async) script: wait briefly for it
  var mo = new MutationObserver(function () { var h = document.querySelector(sel); if (h) { mo.disconnect(); watch(h); } });
  mo.observe(document.body || document.documentElement, { childList: true, subtree: true });
  setTimeout(function () { if (!document.querySelector(sel)) { mo.disconnect(); afterPaint(); } }, 1200);
})();
