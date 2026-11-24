/* Ghatika craft page: film pause control, before/after finishing slider. */
(function () {
  'use strict';
  var G = window.GH, $ = G.$;
  var v = $('#film'), b = $('#filmBtn');
  if (v && b) {
    if (G.reduce) { v.removeAttribute('autoplay'); v.pause(); b.textContent = 'Play film'; b.setAttribute('aria-pressed', 'true'); }
    b.addEventListener('click', function () { if (v.paused) { v.play().catch(function () {}); b.textContent = 'Pause film'; b.setAttribute('aria-pressed', 'false'); } else { v.pause(); b.textContent = 'Play film'; b.setAttribute('aria-pressed', 'true'); } });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { if (!e[0].isIntersecting) v.pause(); else if (b.getAttribute('aria-pressed') === 'false') v.play().catch(function () {}); }).observe(v);
  }
  var f = $('#finish'), h = $('#finH');
  if (f && h) {
    var x = 50, drag = false;
    function set(n) { x = Math.max(0, Math.min(100, n)); f.style.setProperty('--x', x + '%'); h.setAttribute('aria-valuenow', Math.round(x)); h.setAttribute('aria-valuetext', Math.round(x) + '% before, ' + Math.round(100 - x) + '% after'); }
    function at(e) { var r = f.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); }
    f.addEventListener('pointerdown', function (e) { drag = true; f.setPointerCapture(e.pointerId); at(e); });
    f.addEventListener('pointermove', function (e) { if (drag) at(e); });
    f.addEventListener('pointerup', function () { drag = false; });
    h.addEventListener('keydown', function (e) { var k = { ArrowLeft: -5, ArrowRight: 5, Home: -100, End: 100 }[e.key]; if (k) { e.preventDefault(); set(x + k); } });
    // a slow first sweep shows what the slider does
    if (!G.reduce && 'IntersectionObserver' in window) { var io = new IntersectionObserver(function (e) { if (!e[0].isIntersecting) return; io.disconnect(); var t0 = performance.now(); (function step(t) { var k = Math.min(1, (t - t0) / 1600); set(50 + Math.sin(k * Math.PI * 2) * 22 * (1 - k)); if (k < 1 && !drag) requestAnimationFrame(step); })(t0); }, { threshold: 0.6 }); io.observe(f); }
  }
})();
