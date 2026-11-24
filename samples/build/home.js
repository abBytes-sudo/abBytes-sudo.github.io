/* Sthira · home: the pinned three.js build. Scroll position -> build progress (0..1); the 3D module damps it,
   and every caption, the day counter and the ruler follow what is actually on screen. */
(function () {
  'use strict';
  var D = window.STHIRA, A = window.App, $ = A.$, $$ = A.$$, esc = A.esc;
  var reduce = A.reduce;
  var hero = $('#build'), canvas = $('#bld'), poster = $('#poster');
  var STAGES = D.STAGES, TODAY_P = D.pAt(D.LIVE.day);
  var api = null, raw = 0, shown = 0, lastStage = -1;

  // ---------- services + projects + stage list ----------
  var svc = $('#svc-list');
  if (svc) svc.innerHTML = D.SERVICES.map(function (s) {
    var img = { residential: 'home-1', commercial: 'office-2', interiors: 'fitout-office', turnkey: 'home-2' }[s.id];
    return '<a class="svc-row" href="services.html#' + s.id + '" data-peek="photos/' + img + '-s.jpg"><span class="idx">' + s.n + '</span><h3>' + esc(s.name) + '</h3><p>' + esc(s.short) + '</p><span class="k from">From ' + esc(s.from) + '</span><span class="go" aria-hidden="true">→</span></a>';
  }).join('');
  var hp = $('#home-projects');
  if (hp) hp.innerHTML = ['menon-residence', 'banyan-court', 'house-of-courtyards', 'northlight-studio'].map(function (id, i) { return A.pcard(D.PROJECTS.filter(function (p) { return p.id === id; })[0], i); }).join('');
  var sl = $('#stagelist-ol');
  if (sl) sl.innerHTML = STAGES.slice(1).map(function (s, i) {
    return '<li><button type="button" data-stage="' + (i + 1) + '" aria-pressed="' + (i === 5) + '"><span class="n">' + s.n + '</span><span class="st">' + esc(s.name) + '</span><span class="sp">' + esc(s.lead) + '</span><span class="sp k">' + esc(s.trade) + ' · ' + esc(s.dur) + '</span><span class="sp k">✓ ' + esc(s.qc) + '</span></button></li>';
  }).join('');

  // ---------- ruler ----------
  var ticks = $('#ticks'), fill = $('#fill'), dayEl = $('#day'), rstage = $('#rstage'), track = $('#track');
  if (ticks) ticks.innerHTML = STAGES.slice(1).map(function (s, i) {
    return '<button type="button" data-go="' + s.p[0] + '" style="left:' + (s.p[0] * 100) + '%" aria-label="Jump to stage ' + s.n + ', ' + esc(s.name) + '"><span>' + s.n + ' ' + esc(s.name.split(' ')[0]) + '</span></button>';
  }).join('');
  var todayMk = $('#todaymk'); if (todayMk) todayMk.style.left = (TODAY_P * 100) + '%';

  function scrollToP(p, smooth) {
    var top = hero.getBoundingClientRect().top + scrollY, len = hero.offsetHeight - innerHeight;
    var y = top + len * (0.04 + p * 0.93);
    if (window.Motion && Motion.lenis && smooth !== false) Motion.lenis.scrollTo(y, { duration: 2.2 }); else scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }
  if (ticks) ticks.addEventListener('click', function (e) { var b = e.target.closest('[data-go]'); if (b) scrollToP(+b.dataset.go + 0.002); });
  var todayCard = $('#today'), todayPinned = false;
  $('#todaybtn') && $('#todaybtn').addEventListener('click', function () { todayPinned = true; scrollToP(TODAY_P); });
  // drag along the ruler to scrub
  if (track) {
    var dragging = false;
    var at = function (e) { var r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
    track.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; dragging = true; track.setPointerCapture(e.pointerId); scrollToP(at(e), false); });
    track.addEventListener('pointermove', function (e) { if (dragging) scrollToP(at(e), false); });
    track.addEventListener('pointerup', function () { dragging = false; });
  }

  // ---------- captions ----------
  var cap = $('#cap'), intro = $('#intro'), end = $('#end');
  function stageIndex(p) { for (var i = STAGES.length - 1; i >= 0; i--) if (p >= STAGES[i].p[0]) return i; return 0; }
  function ui(p) {
    var i = stageIndex(p), s = STAGES[i];
    if (intro) intro.classList.toggle('away', raw > 0.015);
    var nt = document.getElementById('notes'); if (nt) nt.classList.toggle('away', raw > 0.015);
    var showCap = i >= 1 && p < 0.955;
    if (cap) {
      cap.classList.toggle('on', showCap);
      if (i !== lastStage && i >= 1) {
        $('#cap-n').innerHTML = s.n + '<sup>/ 06</sup>'; $('#cap-h').textContent = s.name; $('#cap-l').textContent = s.lead;
        $('#cap-t').textContent = s.trade; $('#cap-d').textContent = s.dur + ' · day ' + s.day[0] + '–' + s.day[1]; $('#cap-q').textContent = s.qc;
        if (!reduce && window.gsap && lastStage >= 1) gsap.fromTo(cap.children, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.05, ease: 'power3.out' });
      }
    }
    lastStage = i;
    hero.classList.toggle('night', p > 0.962);
    if (end) end.classList.toggle('on', p > 0.97);
    var day = D.dayAt(p);
    if (dayEl) dayEl.textContent = 'Day ' + day;
    if (rstage) rstage.textContent = i === 0 ? 'Site plan' : s.n + ' · ' + s.name;
    if (fill) fill.style.width = (p * 100) + '%';
    if (ticks) $$('button', ticks).forEach(function (b, k) { if (k + 1 === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    var nearToday = Math.abs(p - TODAY_P) < 0.025;
    if (todayCard) todayCard.classList.toggle('on', nearToday || (todayPinned && Math.abs(p - TODAY_P) < 0.05));
    if (!nearToday && Math.abs(p - TODAY_P) > 0.05) todayPinned = false;
  }

  function readScroll() {
    var r = hero.getBoundingClientRect(), len = hero.offsetHeight - innerHeight;
    var t = Math.max(0, Math.min(1, -r.top / Math.max(1, len)));
    raw = t;
    var p = Math.max(0, Math.min(1, (t - 0.04) / 0.93));
    if (api) api.setProgress(p); else { shown = p; ui(p); }
  }

  // ---------- mini estimator in the dark band (same rates as the full estimator, Bengaluru) ----------
  var mini = $('#mini');
  if (mini) {
    var calcMini = function () {
      var area = +$('#me-a').value, f = +(mini.querySelector('[name=mf]:checked') || {}).value || 3, tid = (mini.querySelector('[name=mt]:checked') || {}).value || 'signature';
      var tier = D.TIERS.filter(function (x) { return x.id === tid; })[0], rate = tier.rate * (1 + Math.max(0, f - 2) * 0.025), total = area * rate * 1.045;
      var plate = area / f, wk = 10 + (4 + Math.ceil(plate / 1500)) + (f * 3 + 1) + (4 + Math.ceil(area / 1800)) - 1 - Math.ceil((4 + Math.ceil(area / 1800)) / 2) + (8 + Math.ceil(area / 1500)) - 3 + (8 + Math.ceil(area / 1400)) - 1 + 4;
      var lo = total * 0.94, hi = total * 1.08;
      $('#me-ao').textContent = area.toLocaleString('en-IN') + ' sq ft';
      $('#me-a').style.setProperty('--v', ((area - 1000) / 110) + '%');
      $('#me-r').textContent = hi >= 1e7 ? '₹' + (lo / 1e7).toFixed(2) + '–' + (hi / 1e7).toFixed(2) + ' Cr' : '₹' + Math.round(lo / 1e5) + '–' + Math.round(hi / 1e5) + ' L';
      $('#me-m').textContent = Math.ceil(wk / 4.33) + ' months';
      $('#me-go').href = 'estimate.html?c=blr&t=home&a=' + area + '&f=' + f + '&s=' + tid + '&x=design';
    };
    mini.addEventListener('input', calcMini); mini.addEventListener('change', calcMini); mini.addEventListener('submit', function (e) { e.preventDefault(); });
    calcMini();
  }

  // ---------- 3D: loaded after first paint, only if WebGL works ----------
  function webgl() { try { var c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }
  function frame() {
    var w = innerWidth;
    if (w < 900) return [0, 0.16];
    return [w > 1500 ? 0.17 : 0.15, -0.03];
  }
  function start() {
    if (!webgl()) { document.documentElement.classList.add('no-3d'); return; }
    var s = document.createElement('script'); s.src = '../assets/build-sthira3d.js?v=6';
    s.onload = function () {
      try {
        var f = frame();
        api = window.Sthira3D.mount(canvas, { progress: reduce ? 0.93 : 0, frameX: f[0], frameY: f[1], noIntro: reduce });
        api.onProgress = function (p) { shown = p; if (!reduce) ui(p); };
        requestAnimationFrame(function () { canvas.classList.add('on'); setTimeout(function () { poster && poster.classList.add('gone'); }, 900); });
        if (!reduce) { readScroll(); addEventListener('resize', function () { var f2 = frame(); api.setFrame(f2[0], f2[1]); }); }
      } catch (e) { document.documentElement.classList.add('no-3d'); }
    };
    s.onerror = function () { document.documentElement.classList.add('no-3d'); };
    document.head.appendChild(s);
  }
  // the 3D starts on the first sign of a person (scroll, pointer, touch, key) or after 15 s; until then the poster,
  // rendered from the same scene and camera, holds the first frame, so nothing changes visually when it swaps in
  function whenIdle(fn) {
    var done = false, evs = ['scroll', 'pointermove', 'pointerdown', 'touchstart', 'keydown', 'wheel'];
    function go() { if (done) return; done = true; evs.forEach(function (e) { removeEventListener(e, go, true); }); (window.requestIdleCallback || setTimeout)(fn, { timeout: 300 }); }
    evs.forEach(function (e) { addEventListener(e, go, { capture: true, passive: true }); });
    var arm = function () { setTimeout(go, 15000); };
    if (document.readyState === 'complete') arm(); else addEventListener('load', arm);
  }

  if (reduce) {
    // static: no pin, the finished building, stage buttons swap the still frame
    if (sl) sl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-stage]'); if (!b || !api) return;
      var s = STAGES[+b.dataset.stage]; api.setProgress(s.key === 'landscape' ? 0.93 : s.p[1] - 0.001, true);
      $$('[data-stage]', sl).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    });
    whenIdle(start);
  } else {
    addEventListener('scroll', readScroll, { passive: true });
    addEventListener('resize', readScroll);
    readScroll();
    whenIdle(start);
  }

})();
