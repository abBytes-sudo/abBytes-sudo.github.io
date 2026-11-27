/* Orbit Assistants page: the hero paints with orbit.css, saas.css and four small scripts (brands, trades, ui, tell).
   Everything below it (motion, the night shift, the modules, the live assistants) loads right after the first paint,
   so the first screen is never waiting on code it doesn't use. The engine itself loads later still (saas.js). */
(function () {
  'use strict';
  var V = '27';
  var CSS = ['../assets/vendor/lenis.css', '../assets/bots/bots.css?v=22', '../assets/bots/crm.css?v=22', 'story.css?v=' + V, 'rows.css?v=' + V, 'close.css?v=' + V];
  var JS = ['../assets/vendor/gsap.min.js', '../assets/vendor/ScrollTrigger.min.js', '../assets/vendor/lenis.min.js', '../assets/motion.js?v=1', 'story.js?v=' + V, 'rows.js?v=' + V, 'close.js?v=' + V, 'meter.js?v=' + V, 'saas.js?v=' + V];
  function css(href) {
    return new Promise(function (res) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = l.onerror = function () { res(); }; document.head.appendChild(l); });
  }
  function js(list) {
    return list.reduce(function (p, src) { return p.then(function () { return new Promise(function (res) { var s = document.createElement('script'); s.src = src; s.async = false; s.onload = s.onerror = function () { res(); }; document.head.appendChild(s); }); }); }, Promise.resolve());
  }
  var started = false;
  function go() { if (started) return; started = true; Promise.all(CSS.map(css)).then(function () { return js(JS); }); }
  if (window.OrbitUI && OrbitUI.afterPaint) OrbitUI.afterPaint(go); else addEventListener('load', function () { setTimeout(go, 300); });
})();
