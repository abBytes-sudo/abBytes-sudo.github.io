/* Sthira · loads the shared motion stack (GSAP, ScrollTrigger, SplitText, Lenis, motion.js) after the page has loaded,
   in order, so it never competes with the first paint. Nothing on the page depends on it to be visible. */
(function () {
  var L = ['../assets/vendor/gsap.min.js', '../assets/vendor/ScrollTrigger.min.js', '../assets/vendor/SplitText.min.js', '../assets/vendor/lenis.min.js', '../assets/motion.js?v=1'];
  function go() { L.forEach(function (src) { var s = document.createElement('script'); s.src = src; s.async = false; document.head.appendChild(s); }); }
  if (document.readyState === 'complete') go(); else addEventListener('load', go);
})();
