/* Taradhura home: scroll drives the hour. The 3D ridge (assets/resort3d.js) loads after first paint over a poster frame;
   the clock, the sun arc, the lamp counter and the copy all follow the same hour. */
(function () {
  'use strict';
  var TD = window.TD, ui = TD.ui, $ = ui.$, $$ = ui.$$;
  var reduce = ui.reduce;

  // ---------- content blocks ----------
  var cots = $('#cots'); if (cots) cots.innerHTML = TD.types.map(ui.cotCard).join('');
  var dc = $('#day-cards');
  if (dc) dc.innerHTML = TD.experiences.map(function (e) {
    return '<article class="day-card"><figure>' + ui.photo(e.photo, e.name, '(max-width:900px) 78vw, 30vw') + '</figure><div class="t"><span>' + e.slots.join(' · ') + '</span><span>' + e.dur + ' · ' + TD.inr(e.price) + '</span></div><h3>' + ui.esc(e.name) + '</h3><p>' + ui.esc(e.line) + '</p></article>';
  }).join('');
  var jl = $('#jl');
  if (jl) jl.innerHTML = TD.posts.slice(0, 3).map(function (p) {
    return '<a class="jc" href="journal.html?post=' + p.id + '"><figure>' + ui.photo(p.photo, '', '(max-width:900px) 100vw, 33vw') + '</figure><p class="kicker">' + ui.esc(p.kicker) + ' · ' + p.read + ' min</p><h3>' + ui.esc(p.title) + '</h3><p>' + ui.esc(p.dek) + '</p></a>';
  }).join('');

  // ---------- the day ----------
  var dn = $('#dn'); if (!dn) return;
  var chapters = $$('.dn-ch', dn), rail = $$('#rail button'), clk = $('#clk'), clkS = $('#clk-s'), sun = $('#sun'), title = $('#dn-title'), hint = $('#hint');
  var copy = $('#dn-copy'), clock = $('.dn-clock'), lit = $('#lit'), litI = $('#lit-i'), litT = $('#lit-t');
  litI.innerHTML = new Array(14).join('<s></s>'); var litS = $$('s', litI);
  // scroll progress → hour (anchors line up with the chapters)
  var PA = [0, 0.1, 0.24, 0.38, 0.53, 0.68, 0.85, 1], HA = [5.667, 6.333, 9, 13, 17.333, 18.5, 21.5, 22.4];
  function hourAt(p) { for (var i = 0; i < PA.length - 1; i++) if (p <= PA[i + 1]) return HA[i] + (HA[i + 1] - HA[i]) * (p - PA[i]) / (PA[i + 1] - PA[i]); return HA[HA.length - 1]; }
  var sm = function (a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function fmt(h) { var m = Math.round(h * 60) % 1440; var hh = Math.floor(m / 60), mm = m % 60; return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm; }

  var api = null, cur = 5.667, curP = 0, tgtP = 0, chIx = -1, visible = true;
  function progress() { var r = dn.getBoundingClientRect(); var span = r.height - innerHeight; return span > 0 ? Math.max(0, Math.min(1, -r.top / span)) : 0; }

  function paint(p, h) {
    clk.textContent = fmt(h);
    var rise = 6.73, set = 17.4, day = h >= rise && h <= set;
    var t = day ? (h - rise) / (set - rise) : 0;
    if (day) { var x = 6 + t * 138, y = 54 - Math.sin(t * Math.PI) * 36 * 1.0; sun.setAttribute('cx', x.toFixed(1)); sun.setAttribute('cy', y.toFixed(1)); sun.style.fill = ''; clkS.textContent = h < 12 ? 'Sunrise 06:44 · IST' : 'Sunset 17:24 · IST'; }
    else { var tn = h > set ? Math.min(1, (h - set) / 6) : 0; sun.setAttribute('cx', (144 - tn * 60).toFixed(1)); sun.setAttribute('cy', (54 - Math.sin(tn * Math.PI * .5) * 30).toFixed(1)); sun.style.fill = h > set ? '#ECE6DA' : ''; clkS.textContent = h > set ? (h > 19.3 ? 'Moonrise 19:10 · Milky Way 21:00' : 'Sunset 17:24 · IST') : 'Sunrise 06:44 · IST'; }
    // chapters
    var ix = 0; chapters.forEach(function (c, i) { if (h >= +c.dataset.h - 0.05) ix = i; });
    if (ix !== chIx) { chapters.forEach(function (c, i) { c.classList.toggle('on', i === ix); }); rail.forEach(function (b, i) { b.classList.toggle('on', i === ix); if (i === ix) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); }); chIx = ix; }
    rail.forEach(function (b, i) { var a = PA[i], z = PA[i + 1] || 1; b.style.setProperty('--p', (Math.max(0, Math.min(1, (p - a) / (z - a))) * 100).toFixed(1) + '%'); });
    // lamps
    var n = Math.round(sm(17.15, 19.0, h) * 13); var early = h > 4.8 && h < 6.4 ? 3 : 0; n = Math.max(n, early);
    litS.forEach(function (s, i) { s.classList.toggle('on', i < n); }); litT.textContent = n + ' of 13 lamps lit';
    lit.classList.toggle('on', p > 0.04);
    var tOp = Math.max(0, 1 - p * 24); title.style.opacity = tOp; title.style.transform = 'translateY(' + (-p * 600).toFixed(1) + 'px)'; title.style.visibility = tOp ? '' : 'hidden';
    hint.style.opacity = p > 0.015 ? 0 : 1;
    copy.classList.toggle('wait', p < 0.05); clock.classList.toggle('wait', p < 0.05);
  }

  var lastPaint = -1;
  function tick() {
    raf = requestAnimationFrame(tick);
    if (!visible) return;
    tgtP = progress();
    curP += (tgtP - curP) * (reduce ? 1 : 0.14);
    if (Math.abs(tgtP - curP) < 0.0002) curP = tgtP;
    if (curP === lastPaint) return;
    lastPaint = curP;
    cur = hourAt(curP);
    paint(curP, cur);
    if (api) api.set(cur, curP);
  }
  var raf = 0;

  // rail: jump to an hour
  rail.forEach(function (b, i) {
    b.addEventListener('click', function () {
      var r = dn.getBoundingClientRect(), top = scrollY + r.top, span = r.height - innerHeight;
      var target = top + span * (PA[i] + 0.02);
      if (window.Motion && Motion.lenis) Motion.lenis.scrollTo(target, { duration: 1.6 }); else scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  // ---------- 3D: after first paint, only with WebGL, never under reduced motion ----------
  function hasGL() { try { var c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }
  if (reduce) { dn.classList.add('static'); paint(0, 5.6); return; }
  if (!hasGL()) { dn.classList.add('static'); paint(0, 5.6); return; }
  raf = requestAnimationFrame(tick);

  function load3d() {
    var s = document.createElement('script'); s.src = '../assets/resort3d.js?v=14'; s.async = true;
    s.onload = function () {
      try {
        api = window.Resort3D.mount($('#land'), { portrait: innerWidth < innerHeight, hour: cur, progress: curP });
        api.set(cur, curP); lastPaint = -1;
        if (visible) api.start();
        requestAnimationFrame(function () { dn.classList.add('live'); });
      } catch (e) { dn.classList.add('static'); }
    };
    document.head.appendChild(s);
  }
  // the 3D starts on the first sign of a person (pointer, touch, key, scroll); until then the poster is the same frame
  var started = false, EV = ['pointermove', 'pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll'];
  function go() { if (started) return; started = true; EV.forEach(function (e) { removeEventListener(e, go); }); ('requestIdleCallback' in window) ? requestIdleCallback(load3d, { timeout: 400 }) : setTimeout(load3d, 50); }
  EV.forEach(function (e) { addEventListener(e, go, { passive: true }); });
  if (scrollY > 40) go();

  // pause when the hero is off screen or the tab is hidden
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (!api) return; if (visible && !document.hidden) api.start(); else api.stop(); }, { rootMargin: '100px' }).observe(dn);
  document.addEventListener('visibilitychange', function () { if (!api) return; if (document.hidden) api.stop(); else if (visible) api.start(); });
  // a gentle look-around with the pointer
  if (matchMedia('(pointer: fine)').matches) addEventListener('pointermove', function (e) { if (api) api.pointer(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); }, { passive: true });
})();
