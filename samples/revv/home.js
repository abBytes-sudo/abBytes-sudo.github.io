/* Revv home: ignition (hold to start, the car is lit by its own lights), the paint-gauge game, hero chapters with the peel
   x-ray, a nav tachometer on scroll speed, browse-by, featured, dealers and the pit-board footer. */
(function () {
  'use strict';
  var R = window.Revv, D = window.REVV_DATA, $ = R.$, $$ = R.$$;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = matchMedia('(pointer: coarse)').matches;
  var all = R.listings();

  // ---------- browse by ----------
  var nb = all.filter(function (l) { return l.type === 'bike'; }).length, nc = all.length - nb;
  $('#n-bikes').textContent = nb + ' certified · from ' + R.inr(Math.min.apply(null, all.filter(function (l) { return l.type === 'bike'; }).map(function (l) { return l.price; })));
  $('#n-cars').textContent = nc + ' certified · from ' + R.inr(Math.min.apply(null, all.filter(function (l) { return l.type === 'car'; }).map(function (l) { return l.price; })));
  // stock by price: ten bands, bikes stacked on cars; a bar is a link to that band
  (function () {
    var H = $('#hist'), out = $('#hist-r'); if (!H) return;
    var E = [0, 1e5, 2e5, 3e5, 5e5, 75e4, 1e6, 15e5, 25e5, 5e6, 1e9], LB = ['<1 L', '1–2', '2–3', '3–5', '5–7.5', '7.5–10', '10–15', '15–25', '25–50', '50 L+'];
    var bins = LB.map(function (lb, i) { var inb = all.filter(function (l) { return l.price >= E[i] && l.price < E[i + 1]; });
      return { lb: lb, lo: E[i], hi: E[i + 1], b: inb.filter(function (l) { return l.type === 'bike'; }).length, n: inb.length }; });
    var max = Math.max.apply(null, bins.map(function (x) { return x.n; })) || 1, rest = out ? out.textContent : '';
    H.innerHTML = bins.map(function (x, i) {
      var say = x.n + (x.n === 1 ? ' vehicle ' : ' vehicles ') + (i === 0 ? 'under ₹1 L' : i === 9 ? 'above ₹50 L' : 'from ' + R.inr(x.lo) + ' to ' + R.inr(x.hi));
      var inner = '<span class="hb-n">' + x.n + '</span><span class="hb-c" style="--h:' + (x.n / max).toFixed(3) + ';--d:' + i + '"><i class="b" style="flex:' + x.b + '"></i><i class="c" style="flex:' + (x.n - x.b) + '"></i></span><span class="hb-l">' + x.lb + '</span>';
      return x.n ? '<a class="hb" role="listitem" href="listings.html?min=' + x.lo + (x.hi < 1e9 ? '&max=' + x.hi : '') + '" aria-label="' + say + '" data-say="' + say + ' →">' + inner + '</a>' : '<span class="hb off" role="listitem" aria-label="' + say + '">' + inner + '</span>';
    }).join('');
    if (out) { H.addEventListener('pointerover', function (e) { var a = e.target.closest('a.hb'); if (a) out.textContent = a.dataset.say; });
      H.addEventListener('focusin', function (e) { var a = e.target.closest('a.hb'); if (a) out.textContent = a.dataset.say; });
      H.addEventListener('pointerleave', function () { out.textContent = rest; }); }
    if ('IntersectionObserver' in window && !reduce) new IntersectionObserver(function (en, io) { if (en[0].isIntersecting) { H.classList.add('in'); io.disconnect(); } }, { threshold: 0.35 }).observe(H); else H.classList.add('in');
  })();
  (function () { var cs = D.CITIES.map(function (c) { return { c: c, n: all.filter(function (l) { return l.city === c; }).length }; }), mx = Math.max.apply(null, cs.map(function (x) { return x.n; })) || 1;
    $('#cities').innerHTML = cs.map(function (x) { return '<li><a href="listings.html?city=' + encodeURIComponent(x.c) + '"><b>' + x.c + '</b><i style="--w:' + (x.n / mx).toFixed(3) + '"></i><span>' + x.n + '</span></a></li>'; }).join(''); })();

  // bay feed: the last inspections, as a timing-screen ticker (two copies for the loop)
  (function () { var f = $('#feed'); if (!f || !R.report) return;
    var rows = all.map(function (l) { return { l: l, d: R.report(l).date }; }).sort(function (a, b) { return b.d - a.d; }).slice(0, 9).map(function (x) {
      var d = new Date(x.d); return '<span><b>Passed</b>' + d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + '<em>' + R.esc(R.title(x.l)) + '</em><u>' + x.l.score + '<small>/150</small></u>' + R.esc(x.l.city) + '</span>'; }).join('');
    f.innerHTML = rows + rows; })();

  var cta = document.querySelector('.hero-cta .btn'); if (cta) cta.firstChild.textContent = 'See all ' + all.length + ' in stock ';

  // ---------- pit board (footer readouts) ----------
  (function () { var pb = $('#pitboard'); if (!pb) return; var wk = 0, sum = 0;
    all.forEach(function (l) { sum += l.score || 0; if (R.report && (Date.now() - R.report(l).date) < 7 * 864e5) wk++; });
    var set = function (k, v) { var e = pb.querySelector('[data-k="' + k + '"]'); if (e) e.textContent = v; };
    set('stock', all.length); set('week', wk); set('avg', all.length ? (sum / all.length).toFixed(1) : '—'); set('cities', D.CITIES.length); })();
  // ---------- featured ----------
  var feat = ['halvard-rr1000', 'aurex-s4', 'moreau-650', 'varno-vela-n', 'aurex-ecafe', 'varno-atlas'].map(R.byId).filter(Boolean);
  $('#feat').innerHTML = feat.map(function (l, i) { return R.card(l, i); }).join('') +
    '<div class="feat-end"><p class="disp">' + all.length + ' more <span class="ser">on the lot.</span></p><a class="btn dark" href="listings.html">See all listings <span class="ar" aria-hidden="true">→</span></a></div>';

  // ---------- dealers ----------
  var peekImgs = ['d-shop', 'b-noir', 'c-sage', 'b-tourer', 'c-coast', 'b-nine', 'c-hatch', 'c-forest'];
  (function () {
    var rows = D.dealers.map(function (d, i) { var st = all.filter(function (l) { return l.dealer === d.id; }), sum = 0; st.forEach(function (l) { sum += l.score || 0; });
      return { d: d, i: i, n: st.length, avg: st.length ? sum / st.length : 0 }; }).sort(function (a, b) { return b.avg - a.avg; });
    var top = rows[0] ? rows[0].avg : 150, lo = 140;
    $('#dealer-list').innerHTML = rows.map(function (x, k) { var d = x.d, gap = k ? '−' + (top - x.avg).toFixed(1) : 'Leader', ok = d.kyc === 'verified';
      return '<li class="dl" data-peek="photos/' + peekImgs[x.i] + '-s.jpg"><span class="n"><span class="sr">Position </span>' + (k + 1) + '</span>' +
        '<span class="who"><h3><a href="showroom.html?id=' + d.id + '">' + R.esc(d.name) + '</a></h3><small>' + R.esc(d.area) + ', ' + R.esc(d.city) + '</small></span>' +
        '<span class="sc"><b><span class="sr">Average report </span>' + x.avg.toFixed(1) + '</b><i style="--w:' + Math.max(0.04, (x.avg - lo) / (150 - lo)).toFixed(3) + '"></i><em>' + gap + '</em></span>' +
        '<span class="rp"><span class="lb">Replies in </span>' + R.esc(d.reply || '—') + '</span><span class="lv">' + x.n + '<span class="sr"> live</span></span><span class="rt"><span class="sr">Rated </span>★ ' + d.rating + '</span>' +
        '<span class="st' + (ok ? ' ok' : '') + '">' + (ok ? 'Since ' + d.since : 'KYC in review') + '</span></li>'; }).join('');
  })();
  // the lap bar over "how certification works": a sector lights as its step reaches the middle of the screen
  (function () { var bar = $('#lap-bar'), st = $$('#steps li'); if (!bar || !st.length) return; var seg = $$('i', bar);
    if (!('IntersectionObserver' in window)) { seg.forEach(function (i) { i.classList.add('on'); }); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { var k = st.indexOf(e.target); if (e.isIntersecting) { for (var j = 0; j <= k; j++) { seg[j].classList.add('on'); st[j].classList.add('on'); } } else if (e.boundingClientRect.top > 0) { seg[k].classList.remove('on'); st[k].classList.remove('on'); } }); }, { rootMargin: '0px 0px -38% 0px', threshold: 0.2 });
    st.forEach(function (li) { io.observe(li); }); })();
  var peek = $('#peek');
  if (!coarse && peek) {
    $$('.dl').forEach(function (li) {
      li.addEventListener('mouseenter', function () { peek.src = li.dataset.peek; peek.classList.add('on'); });
      li.addEventListener('mouseleave', function () { peek.classList.remove('on'); });
    });
    document.addEventListener('mousemove', function (e) { if (peek.classList.contains('on')) { peek.style.left = e.clientX + 'px'; peek.style.top = e.clientY + 'px'; } }, { passive: true });
  }
  R.refreshCounts();

  // ---------- hero ----------
  var hero = $('#hero'), stage = $('#stage'), canvas = $('#car');
  var api = null, progress = 0, scan = null, ign = 0, lit = false;
  var prog = $$('.hero-prog span');
  var hint = $('#hint');
  try { lit = sessionStorage.getItem('revv:lit') === '1'; } catch (e) {}
  if (reduce) lit = true;

  function setIgn(v) { ign = v; stage.style.setProperty('--ign', v.toFixed(3)); if (api) api.setIgnition(v); }
  function latch() {
    if (stage.dataset.lit === '1') return; lit = true; setIgn(1); stage.dataset.lit = '1';
    try { sessionStorage.setItem('revv:lit', '1'); } catch (e) {}
    if (hint) hint.textContent = coarse ? 'Touch the body to read the paint' : 'Move over the body to read the paint';
    startScan(); tacho();
    if (hint && !coarse) stage.addEventListener('pointermove', function h() { hint.style.opacity = 0; stage.removeEventListener('pointermove', h); });
  }
  function startScan() {
    if (scan || !api || stage.dataset.lit !== '1') return;
    if (!window.PaintScan) { if (!startScan.busy) { startScan.busy = true; var s = document.createElement('script'); s.src = 'paint-scan.js?v=4'; s.onload = function () { startScan(); }; document.head.appendChild(s); } return; }
    api.setLens(false); scan = window.PaintScan.init(api, stage); scan.setActive(progress < 0.1);
  }

  function load3D() {
    if (api || !canvas || !window.WebGLRenderingContext) return;
    if (load3D.busy) return; load3D.busy = true;
    var s = document.createElement('script'); s.src = '../assets/revv3d.js?v=6'; s.async = true;
    s.onload = function () {
      try {
        api = window.Revv3D.mount(canvas, { mode: 'hero', src: 'models/kestrel.glb', paint: '#a3231a', readout: $('#read'), callouts: $$('.callout'), pointerHost: stage, ignition: lit ? 1 : ign, intro: lit && !reduce });
        api.ready.then(function () { stage.classList.add('live'); api.setProgress(progress); api.setIgnition(lit ? 1 : ign); startScan(); });
      } catch (e) { /* no WebGL: the poster stays, lit by CSS */ }
    };
    document.head.appendChild(s);
  }
  // Start 3D after the first paint settles. Phones wait for a gesture (or 3.5 s) so the page is usable first.
  var EV = ['pointerdown', 'pointermove', 'scroll', 'keydown', 'wheel'];
  function kick() { EV.forEach(function (n) { removeEventListener(n, kick); }); load3D(); }
  addEventListener('load', function () {
    EV.forEach(function (n) { addEventListener(n, kick, { once: true, passive: true }); });
    setTimeout(kick, coarse ? 3500 : 6000);
  });

  // ---------- ignition: press and hold the start button; the needle climbs, then the car lights itself ----------
  (function () {
    var box = $('#ign'), btn = $('#ign-btn'), cv = $('#ign-ring'), skip = $('#ign-skip'); if (!box || !btn) return;
    if (lit) { box.remove(); stage.dataset.lit = '1'; setIgn(1); if (hint && !reduce && !coarse) hint.textContent = 'Move over the body to read the paint'; if (hint && (reduce || coarse)) hint.remove(); return; }
    stage.dataset.lit = '0'; setIgn(0);
    var ctx = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), S = 300, rpmEl = $('#ign-rpm'); cv.width = cv.height = S * dpr; ctx.scale(dpr, dpr);
    var v = 0, held = false, raf = 0, t0 = 0, done = false, HOLD = 1300, tPress = 0, v0 = 0;
    function draw(rpm) {
      var c = S / 2, r = 132, a0 = Math.PI * 0.75, span = Math.PI * 1.5, i, a; ctx.clearRect(0, 0, S, S);
      ctx.lineCap = 'butt'; ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(237,234,227,.16)'; ctx.beginPath(); ctx.arc(c, c, r, a0, a0 + span); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,91,31,.55)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(c, c, r - 2, a0 + span * 0.8, a0 + span); ctx.stroke();
      for (i = 0; i <= 40; i++) { a = a0 + span * i / 40; var maj = i % 5 === 0, hot = i >= 32, l = maj ? 14 : 6;
        ctx.strokeStyle = hot ? (maj ? '#ff5b1f' : 'rgba(255,91,31,.6)') : (maj ? 'rgba(237,234,227,.75)' : 'rgba(237,234,227,.28)'); ctx.lineWidth = maj ? 2 : 1;
        ctx.beginPath(); ctx.moveTo(c + Math.cos(a) * (r - 8 - l), c + Math.sin(a) * (r - 8 - l)); ctx.lineTo(c + Math.cos(a) * (r - 8), c + Math.sin(a) * (r - 8)); ctx.stroke();
        if (maj) { ctx.fillStyle = hot ? 'rgba(255,91,31,.9)' : 'rgba(237,234,227,.6)'; ctx.font = '600 11px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i / 5), c + Math.cos(a) * (r - 36), c + Math.sin(a) * (r - 36)); } }
      ctx.lineCap = 'round'; ctx.strokeStyle = '#ff5b1f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c, c, r + 9, a0, a0 + span * Math.max(0.001, rpm)); ctx.stroke();
      var na = a0 + span * rpm; ctx.strokeStyle = '#edeae3'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(c + Math.cos(na) * 74, c + Math.sin(na) * 74); ctx.lineTo(c + Math.cos(na) * (r - 26), c + Math.sin(na) * (r - 26)); ctx.stroke();
      if (rpmEl) rpmEl.textContent = ('0000' + Math.round(rpm * 8000 / 10) * 10).slice(-4);
    }
    function tick(t) {
      raf = 0; var now = performance.now(), dt = Math.min(0.25, (now - (t0 || now)) / 1000); t0 = now; // wall clock, so slow frames don't slow the start
      if (held) v = Math.min(1, v0 + (now - tPress) / HOLD); else if (v >= 0.6) v = Math.min(1, v + dt * 1000 / HOLD); else v = Math.max(0, v - dt * 1.6);
      var rpm = done ? Math.max(0.14, v) : v * 0.92 + (held ? Math.random() * 0.02 : 0);
      draw(rpm); setIgn(v); box.style.setProperty('--v', v.toFixed(3));
      if (v >= 1 && !done) { done = true; latch(); box.classList.add('out'); setTimeout(function () { box.remove(); }, 900); return; }
      if (held || (v > 0 && v < 1)) raf = requestAnimationFrame(tick);
    }
    function go() { if (!raf) { t0 = 0; raf = requestAnimationFrame(tick); } }
    function finish() { if (done) return; done = true; v = 1; setIgn(1); latch(); box.classList.add('out'); setTimeout(function () { box.remove(); }, 900); }
    // a full hold latches on a timer too, so a busy GPU (no animation frames for a while) cannot hold the start back
    var holdT = 0;
    function down(e) { if (done) return; if (e) e.preventDefault(); held = true; tPress = performance.now(); v0 = v; box.classList.add('held'); load3D(); go();
      clearTimeout(holdT); holdT = setTimeout(function () { if (held) finish(); }, Math.max(0, (1 - v0) * HOLD) + 20); }
    function up() { clearTimeout(holdT); if (held) v = Math.min(1, v0 + (performance.now() - tPress) / HOLD); held = false; box.classList.remove('held'); if (v >= 1 && !done) { finish(); return; } go(); }
    btn.addEventListener('pointerdown', function (e) { btn.setPointerCapture(e.pointerId); down(e); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (n) { btn.addEventListener(n, up); });
    btn.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); down(); } });
    btn.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') up(); });
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    skip.addEventListener('click', function () { done = true; load3D(); latch(); box.classList.add('out'); setTimeout(function () { box.remove(); }, 600); });
    // scrolling on is turning the key: past a fifth of a screen the needle runs up by itself, so the chapters never play in the dark
    var autoStart = function () { if (done) { removeEventListener('scroll', autoStart); return; } if (scrollY < innerHeight * 0.22) return;
      removeEventListener('scroll', autoStart); load3D(); box.classList.add('out'); if (!held) { v = Math.max(v, 0.62); go(); setTimeout(function () { if (!done) finish(); }, 900); } };
    addEventListener('scroll', autoStart, { passive: true });
    draw(0);
  })();

  // ---------- nav tachometer: scroll speed on the needle, a shift light at each section change ----------
  function tacho() {
    if (tacho.on || reduce) return; tacho.on = true; var hr = document.querySelector('.hdr-r'); if (!hr) return;
    var w = el('span', 'tacho'); w.setAttribute('aria-hidden', 'true'); w.innerHTML = '<canvas width="68" height="68"></canvas><i class="shift"></i>'; hr.insertBefore(w, hr.firstChild);
    var c = w.querySelector('canvas').getContext('2d'), sh = w.querySelector('.shift'), vS = 0, lastY = scrollY, sec = -1, secs = $$('main > section, main > .mq, footer');
    c.scale(2, 2);
    (function loop() {
      var L = window.Motion && window.Motion.lenis, vel = L && typeof L.velocity === 'number' ? Math.abs(L.velocity) : Math.abs(scrollY - lastY); lastY = scrollY;
      vS += (Math.min(1, vel / 60) - vS) * 0.18; var a0 = Math.PI * 0.75, a = a0 + Math.PI * 1.5 * (0.06 + vS * 0.94);
      c.clearRect(0, 0, 34, 34); c.lineWidth = 2; c.strokeStyle = 'rgba(237,234,227,.25)'; c.beginPath(); c.arc(17, 17, 14, a0, a0 + Math.PI * 1.5); c.stroke();
      c.strokeStyle = '#ff5b1f'; c.beginPath(); c.arc(17, 17, 14, a0, a); c.stroke(); c.strokeStyle = '#edeae3'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(17, 17); c.lineTo(17 + Math.cos(a) * 11, 17 + Math.sin(a) * 11); c.stroke();
      var mid = innerHeight * 0.5, cur = -1; for (var i = 0; i < secs.length; i++) { var r = secs[i].getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) { cur = i; break; } }
      if (cur !== sec) { if (sec !== -1) { sh.classList.remove('on'); void sh.offsetWidth; sh.classList.add('on'); } sec = cur; }
      requestAnimationFrame(loop);
    })();
  }
  function el(t, c) { var e = document.createElement(t); e.className = c; return e; }
  if (lit && !reduce) tacho();

  // "Find the repaint on this one": light it if needed, then walk the gauge onto the repainted panel
  var fr = $('#find-repaint');
  if (fr) fr.addEventListener('click', function (e) {
    if (!window.WebGLRenderingContext) return; e.preventDefault(); load3D(); latch();
    var wait = function () { if (scan) scan.seek(); else setTimeout(wait, 200); }; wait();
  });

  // paint swatches in chapter 2
  $$('#paints button').forEach(function (b) {
    b.addEventListener('click', function () { $$('#paints button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); if (api) api.setPaint(b.dataset.c, b.dataset.f || 'gloss'); });
  });

  // ---------- motion stack: loaded once the hero poster has painted, so the poster is not sharing the line with ~150 KB
  // of animation scripts. Ordered execution (async = false), then the chapters are built on top of it. ----------
  var STACK = ['../assets/vendor/gsap.min.js', '../assets/vendor/ScrollTrigger.min.js', '../assets/vendor/SplitText.min.js', '../assets/vendor/lenis.min.js', '../assets/motion.js?v=1'];
  function loadOrdered(list, done) {
    var left = list.length, ok = true;
    list.forEach(function (src) {
      var s = document.createElement('script'); s.src = src; s.async = false;
      s.onload = function () { if (--left === 0) done(ok); }; s.onerror = function () { ok = false; if (--left === 0) done(ok); };
      document.head.appendChild(s);
    });
  }
  // Runs fn once the poster has actually been painted (its largest-contentful-paint entry), or at the first scroll, key or
  // touch, or after 3 s. Browsers without the LCP entry fall back to "poster loaded, then two frames".
  function afterPoster(fn) {
    var p = $('.hero-poster'), fired = false, EVS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'];
    var go = function (e) { // a scroll counts only when it is the page scrolling (the featured row scrolls itself on load)
      if (fired || (e && e.type === 'scroll' && e.target !== document && e.target !== document.documentElement)) return;
      fired = true; EVS.forEach(function (n) { removeEventListener(n, go, true); }); setTimeout(fn, 0); };
    EVS.forEach(function (n) { addEventListener(n, go, { capture: true, passive: true }); }); setTimeout(go, 3000);
    var lcp = false; try { lcp = PerformanceObserver.supportedEntryTypes.indexOf('largest-contentful-paint') > -1; } catch (e) {}
    if (lcp && p) {
      new PerformanceObserver(function (list) { list.getEntries().forEach(function (e) { if (e.element === p || (e.url && e.url.indexOf('x-shape') > -1)) go(); }); }).observe({ type: 'largest-contentful-paint', buffered: true });
      return;
    }
    var frame = document.hidden ? function (f) { setTimeout(f, 30); } : requestAnimationFrame, two = function () { frame(function () { frame(go); }); };
    if (!p || (p.complete && p.naturalWidth)) two(); else { p.addEventListener('load', two); p.addEventListener('error', go); }
  }
  function staticHero() { // nothing pinned, no chapters (their content lives in "How certification works")
    hero.style.height = 'auto'; $$('.chap, .hero-prog').forEach(function (e) { e.style.display = 'none'; });
  }
  if (reduce) { document.documentElement.classList.add('motion-off'); staticHero(); afterPoster(function () { loadOrdered(STACK.slice(-1), function () {}); }); return; }
  afterPoster(function () { loadOrdered(STACK, function (ok) { if (ok && window.gsap && window.ScrollTrigger) chapters(); else staticHero(); }); });

  function chapters() {
  var G = window.gsap, ST = window.ScrollTrigger; G.registerPlugin(ST);
  var odo = $('#odo'), o = { v: 0 }, pl = { p: 0 };
  var tl = G.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.8,
    onUpdate: function (st) {
      progress = st.progress; if (api) api.setProgress(progress); if (scan) scan.setActive(progress < 0.1); if (api && !scan) api.setLens(progress > 0.1);
      var i = progress < 0.34 ? 0 : progress < 0.68 ? 1 : 2; prog.forEach(function (s, k) { s.classList.toggle('on', k === i); });
    } } });
  var flood = { f: 0 };
  function setFlood() { if (api) api.setFlood(flood.f); }
  function setPeel() { if (api) api.setPeel(pl.p); }
  tl.to('#hcopy', { autoAlpha: 0, y: -60, duration: 0.12 }, 0.03)
    .to('.hero-meta, #hint', { autoAlpha: 0, duration: 0.08 }, 0.05)
    // the repainted panel peels to x-ray, with the filler line under the paint
    .to(pl, { p: 1, duration: 0.08, onUpdate: setPeel }, 0.12)
    .fromTo('.callout-peel', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.16)
    .to('.callout-peel', { autoAlpha: 0, duration: 0.04 }, 0.3)
    .to(pl, { p: 0, duration: 0.06, onUpdate: setPeel }, 0.3)
    .to(flood, { f: 1, duration: 0.1, onUpdate: setFlood }, 0.34)
    .fromTo('#ch1', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.36)
    .to(o, { v: 150, duration: 0.14, ease: 'power2.out', onUpdate: function () { odo.textContent = Math.round(o.v); } }, 0.36)
    .fromTo('.callout:not(.callout-peel)', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05, stagger: 0.015 }, 0.42)
    .to('.callout:not(.callout-peel)', { autoAlpha: 0, duration: 0.04 }, 0.58)
    .to('#ch1', { autoAlpha: 0, y: -40, duration: 0.06 }, 0.6)
    .to(flood, { f: 0, duration: 0.1, onUpdate: setFlood }, 0.6)
    .fromTo('#ch2', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.72)
    .fromTo('#paints', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.76)
    .to({}, { duration: 0.02 }, 0.98);
  // auto cycle paint during chapter 2 unless the visitor picks one
  var picked = false, cycle = 0, paints = $$('#paints button');
  paints.forEach(function (b) { b.addEventListener('click', function () { picked = true; }); });
  setInterval(function () {
    if (picked || !api || progress < 0.78) return;
    cycle = (cycle + 1) % paints.length; var b = paints[cycle];
    paints.forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); api.setPaint(b.dataset.c, b.dataset.f || 'gloss');
  }, 2200);
  }
})();
