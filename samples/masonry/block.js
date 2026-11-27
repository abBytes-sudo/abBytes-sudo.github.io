/* Ashlar & Co. · one stone, dressed. A CSS 3D block of bluestone on black; scrolling the hero works it in four stages
   (rough, sawn, bush-hammered, drafted margin) cross-faded on its faces, then lowers it into a course while the mortar draws.
   The stage buttons jump to a stage; with reduced motion they switch it directly. Transform and opacity only. */
(function () {
  'use strict';
  var sec = document.getElementById('top'), st = document.getElementById('blkStage'); if (!sec || !st) return;
  var stops = [].slice.call(document.querySelectorAll('#stops button')), cap = document.getElementById('stopCap'), live = document.getElementById('stageLive');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, N = 5, cur = -1, forced = null, raf = 0;
  var T = [.3, 1.4, 2.4, 3.4, 4.92]; // where each stop shows best, in stop units
  function clamp(x) { return Math.min(1, Math.max(0, x)); }
  function ease(t) { return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function progress() { if (forced !== null) return forced; var r = sec.getBoundingClientRect(), span = r.height - innerHeight; return span > 10 ? clamp(-r.top / span) : 0; }
  function set(k, v) { st.style.setProperty(k, v); }
  var W0 = 0; function base() { if (!W0) { st.style.removeProperty('--w'); W0 = st.querySelector('.blk').offsetWidth; } return W0; }
  function render() {
    raf = 0; var p = progress(), s = p * N; // s runs 0..5: one unit per stop
    var o1 = ease(clamp((s - .75) / .5)), o2 = ease(clamp((s - 1.75) / .5)), o3 = ease(clamp((s - 2.75) / .5));
    var split = ease(clamp((s - .45) / .55)), seat = ease(clamp((s - 3.55) / .85)), course = ease(clamp((s - 3.9) / .5)), mortar = ease(clamp((s - 4.3) / .45));
    var w = base(), h = w * .6, d = w * .62; st.style.setProperty('--w', (w * (1 - .3 * course)).toFixed(1) + 'px');
    set('--o1', o1.toFixed(3)); set('--o2', o2.toFixed(3)); set('--o3', o3.toFixed(3));
    set('--capy', (-h * .9 * split).toFixed(1) + 'px'); set('--capz', (d * .25 * split).toFixed(1) + 'px'); set('--capr', (-9 * split).toFixed(2) + 'deg'); set('--capo', (1 - clamp((s - .7) / .35)).toFixed(3));
    // the block turns slowly as it is worked, then squares up to the wall and drops into its course
    set('--rx', lerp(-18 + 6 * p, 0, seat).toFixed(2) + 'deg'); set('--ry', lerp(-34 + 26 * p, 0, seat).toFixed(2) + 'deg');
    set('--tz', (-d / 2 * seat).toFixed(1) + 'px'); set('--ty', (h * .18 * seat).toFixed(1) + 'px');
    set('--co', course.toFixed(3)); set('--mo', mortar.toFixed(3)); set('--lx', (15 + 70 * p).toFixed(1) + '%');
    var k = Math.min(N - 1, Math.floor(s + .12)); if (k !== cur) { cur = k; stops.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === k)); }); if (cap) { var b = stops[k]; cap.innerHTML = '<b>' + b.querySelector('b').textContent + '</b>' + b.querySelector('.tool').textContent + ' · ' + b.querySelector('.hrs').textContent; } }
  }
  function kick() { if (!raf) raf = requestAnimationFrame(render); }
  stops.forEach(function (b, i) {
    b.addEventListener('click', function () {
      var target = T[i] / N;
      if (reduce) { forced = target; render(); }
      else { forced = null; var r = sec.getBoundingClientRect(), span = r.height - innerHeight; scrollTo({ top: scrollY + r.top + span * target, behavior: 'smooth' }); }
      if (live) live.textContent = 'Stage ' + (i + 1) + ' of 5: ' + b.querySelector('b').textContent + '. ' + b.querySelector('.tool').textContent + ', ' + b.querySelector('.hrs').textContent.replace('h', 'hours') + '.';
    });
  });
  if (reduce) { forced = T[0] / N; render(); return; }
  addEventListener('scroll', kick, { passive: true }); addEventListener('resize', function () { W0 = 0; kick(); }); render();
})();
