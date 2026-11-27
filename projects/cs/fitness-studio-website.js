/* The Boxx: the live site moving inside a phone (home → a programme → the timetable → plans). It plays only while
   the phone is on screen and the tab is visible, has a pause button, and stays a still under reduced motion
   (the page buttons still switch screens). Also staggers the 27-plan map and the 19-hour clock. */
(function () {
  'use strict';
  var d = document, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $$(s) { return [].slice.call(d.querySelectorAll(s)); }
  $$('.bx-tiles li').forEach(function (li, i) { li.style.setProperty('--i', i); });
  $$('.ck-seg path').forEach(function (p, i) { p.style.setProperty('--i', i); });

  var ph = d.getElementById('bx-phone'), strip = d.getElementById('bx-strip');
  if (!ph || !strip) return;
  var btns = [].slice.call(ph.querySelectorAll('.bx-steps button')), pp = d.getElementById('bx-pp');
  var n = btns.length, cur = 0, HOLD = 2600, MOVE = 950, t = 0, phase = 'hold', raf = 0, last = 0, vis = false, paused = false;

  function place(i, instant) {
    if (instant) strip.style.transition = 'none';
    strip.style.transform = 'translateY(' + (-100 / n * i).toFixed(3) + '%)';
    if (instant) { void strip.offsetHeight; strip.style.transition = ''; }
  }
  function show(i, how) {
    cur = i; ph.dataset.cur = i;
    btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); b.style.setProperty('--p', 0); });
    if (how === 'fade') {
      strip.classList.add('fade');
      setTimeout(function () { place(i, true); strip.classList.remove('fade'); }, 360);
      return;
    }
    place(i, how === 'instant');
    if (how === 'swipe') { ph.classList.remove('swipe'); void ph.offsetWidth; ph.classList.add('swipe'); }
  }
  function tick(now) {
    raf = 0;
    var dt = last ? Math.min(100, now - last) : 16; last = now;
    t += dt;
    if (phase === 'hold') {
      btns[cur].style.setProperty('--p', Math.min(1, t / HOLD).toFixed(3));
      if (t >= HOLD) { t = 0; phase = 'move'; var nx = (cur + 1) % n; show(nx, nx === 0 ? 'fade' : 'swipe'); }
    } else if (t >= MOVE) { t = 0; phase = 'hold'; }
    if (vis && !paused && !d.hidden) raf = requestAnimationFrame(tick);
  }
  function play() {
    if (reduce || paused || !vis || d.hidden || raf) return;
    last = 0; raf = requestAnimationFrame(tick); ph.dataset.playing = '1';
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; ph.dataset.playing = '0'; }

  btns.forEach(function (b, k) {
    b.addEventListener('click', function () { t = 0; phase = 'hold'; show(k, reduce ? 'instant' : 'jump'); play(); });
  });
  if (pp) pp.addEventListener('click', function () {
    paused = !paused;
    pp.setAttribute('aria-pressed', paused ? 'true' : 'false');
    pp.setAttribute('aria-label', paused ? 'Play the phone' : 'Pause the phone');
    if (paused) stop(); else play();
  });
  show(0, 'instant');
  ph.dataset.playing = '0';
  if (reduce) return;
  d.addEventListener('visibilitychange', function () { if (d.hidden) stop(); else play(); });
  if (!('IntersectionObserver' in window)) { vis = true; play(); return; }
  new IntersectionObserver(function (es) {
    vis = es[0].isIntersecting;
    if (vis) play(); else stop();
  }, { threshold: .2 }).observe(ph);
})();
