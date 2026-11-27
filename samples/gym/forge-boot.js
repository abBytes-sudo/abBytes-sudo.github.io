/* Forge home: the page paints first, then its scripts run. The files are already being fetched (preload links in the head);
   this starts them, in order, one frame after the first paint, so the hero is on screen before any script work begins.
   <script src="forge-boot.js" defer data-src="a.js,b.js,…"></script> */
(function () {
  var el = document.currentScript, list = el ? (el.getAttribute('data-src') || '').split(',') : [];
  function load() { list.forEach(function (src) { if (!src) return; var s = document.createElement('script'); s.src = src; s.async = false; document.head.appendChild(s); }); }
  function go() { requestAnimationFrame(function () { setTimeout(load, 0); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
