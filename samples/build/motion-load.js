/* Sthira · loads the shared motion stack (GSAP, ScrollTrigger, SplitText, Lenis, motion.js) after the page has loaded,
   in order, so it never competes with the first paint; then starts the site-desk chat shell a moment later.
   Nothing on the page depends on either to be visible. */
(function () {
  var L = ['../assets/vendor/gsap.min.js', '../assets/vendor/ScrollTrigger.min.js', '../assets/vendor/SplitText.min.js', '../assets/vendor/lenis.min.js', '../assets/motion.js?v=1'];
  function chat() {
    var h = document.getElementById('cg-hold'); if (!h || window.__cgOn) return;
    var s = document.createElement('script');
    [].slice.call(h.attributes).forEach(function (a) { if (a.name.indexOf('data-') === 0 && a.name !== 'data-src') s.setAttribute(a.name, a.value); });
    s.src = h.getAttribute('data-src'); document.head.appendChild(s);
  }
  function go() {
    L.forEach(function (src) { var s = document.createElement('script'); s.src = src; s.async = false; document.head.appendChild(s); });
    setTimeout(function () { (window.requestIdleCallback || function (f) { f(); })(chat, { timeout: 1500 }); }, 600);
  }
  if (document.readyState === 'complete') go(); else addEventListener('load', go);
})();
