/* Ordwell marketing pages — paint first, then load the motion stack and the page script in order.
   (GSAP, ScrollTrigger, SplitText, Lenis and motion.js are shared vendor files; async=false keeps their order.) */
(function () {
  'use strict';
  var started = false, V = document.currentScript && document.currentScript.getAttribute('data-v') || '';
  var SRC = ['../assets/vendor/gsap.min.js', '../assets/vendor/ScrollTrigger.min.js', '../assets/vendor/SplitText.min.js', '../assets/vendor/lenis.min.js', '../assets/motion.js', 'js/site.min.js?v=' + V];
  function go() {
    if (started) return; started = true;
    SRC.forEach(function (s) { var e = document.createElement('script'); e.src = s; e.async = false; document.head.appendChild(e); });
  }
  if (window.requestAnimationFrame) requestAnimationFrame(function () { setTimeout(go, 40); });
  setTimeout(go, 250);
})();
