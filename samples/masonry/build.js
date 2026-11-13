/* Ashlar & Co. (fictional sample): page behaviour. Shared motion lives in ../assets/motion.js; this file adds the hero intro,
   services preview, gallery progress, timeline, estimator, slider, lazy video and the lazy-loaded 3D material lab. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement, G = window.gsap, ST = window.ScrollTrigger;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motion = !reduce && G && ST && root.classList.contains('motion-on');

  /* ---------- header: solid after the hero, mobile menu ---------- */
  var hd = $('#hd'), menu = $('#menu');
  function onScroll() { hd.classList.toggle('solid', scrollY > innerHeight * 0.72 && !hd.classList.contains('open')); }
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();
  function setMenu(open) {
    hd.classList.toggle('open', open); menu.setAttribute('aria-expanded', open ? 'true' : 'false'); hd.classList.remove('solid'); if (!open) onScroll();
    var l = window.Motion && window.Motion.lenis; if (l) { open ? l.stop() : l.start(); } else document.body.style.overflow = open ? 'hidden' : '';
  }
  menu.addEventListener('click', function () { setMenu(!hd.classList.contains('open')); });
  $$('#nav a').forEach(function (a) { a.addEventListener('click', function () { if (hd.classList.contains('open')) setMenu(false); }); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && hd.classList.contains('open')) { setMenu(false); menu.focus(); } });
  addEventListener('resize', function () { if (innerWidth >= 900 && hd.classList.contains('open')) setMenu(false); });

  /* ---------- footer wordmark: fit the width exactly ---------- */
  var fw = $('#ftWord');
  if (fw) { fw.innerHTML = '<span>' + fw.textContent + '</span>'; }
  function fit() {
    if (!fw) return; var s = fw.firstChild; fw.style.fontSize = '100px'; s.style.display = 'inline-block';
    var w = s.getBoundingClientRect().width, avail = fw.clientWidth - 2 * parseFloat(getComputedStyle(fw).paddingLeft);
    if (w) fw.style.fontSize = Math.floor(100 * avail / w * 0.995) + 'px';
  }

  /* ---------- hero intro + page choreography (needs GSAP) ---------- */
  function ready() {
    root.classList.add('ready');
    fit();
    if (!motion) return;
    var SPLIT = window.SplitText;
    var tl = G.timeline({ defaults: { ease: 'power4.out' } });
    tl.fromTo('#heroMedia', { clipPath: 'inset(9% 7% 9% 7%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut' }, 0)
      .fromTo('#heroVid', { scale: 1.3 }, { scale: 1, duration: 2.4, ease: 'expo.out' }, 0)
      .fromTo('#hd', { yPercent: -100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1.2, onComplete: function () { G.set('#hd', { clearProps: 'transform,opacity,visibility' }); } }, 1.1);
    if (SPLIT) {
      var s = new SPLIT('#h1', { type: 'lines', mask: 'lines', linesClass: 'm-line' });
      tl.from(s.lines, { yPercent: 115, duration: 1.5, stagger: 0.14, ease: 'power4.out' }, 0.7);
    } else { tl.fromTo('#h1', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1.2 }, 0.7); }
    tl.fromTo('.hero-k', { autoAlpha: 0, y: 20 }, { autoAlpha: 0.88, y: 0, duration: 1 }, 0.5)
      .fromTo('.hero-b', { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 1.2 }, 1.5)
      .fromTo('.hero-s', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 2);
    // parallax on leaving the hero
    G.to('#heroVid', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    G.to('.hero-in', { yPercent: -10, autoAlpha: 0.15, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });

    // gallery progress (desktop pin is created by motion.js)
    var sec = $('#projects'), track = sec && $('[data-track]', sec), fill = $('#pFill'), no = $('#pNo');
    if (sec && track) {
      var n = $$('.p', sec).length;
      G.matchMedia().add('(min-width: 900px)', function () {
        ST.create({ trigger: sec, start: 'top top', end: function () { return '+=' + Math.max(1, track.scrollWidth - sec.clientWidth); }, scrub: true, invalidateOnRefresh: true,
          onUpdate: function (self) { fill.style.transform = 'scaleX(' + self.progress + ')'; no.textContent = ('0' + Math.min(n, Math.max(1, Math.ceil(self.progress * n + 0.001)))).slice(-2); } });
      });
    }

    // process timeline: line fills, steps light up
    var tlEl = $('#tl');
    if (tlEl) {
      tlEl.style.setProperty('--tp', 0);
      ST.create({ trigger: tlEl, start: 'top 65%', end: 'bottom 60%', scrub: 0.4, onUpdate: function (self) { tlEl.style.setProperty('--tp', self.progress); } });
      $$('li', tlEl).forEach(function (li) { ST.create({ trigger: li, start: 'top 62%', onEnter: function () { li.classList.add('on'); }, onLeaveBack: function () { li.classList.remove('on'); } }); });
    }

    // footer wordmark rises
    if (fw) G.from(fw.firstChild, { yPercent: 70, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: fw, start: 'top 98%' } });
    ST.refresh();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready); else addEventListener('load', ready);
  setTimeout(function () { root.classList.add('ready'); }, 3500); // failsafe: never leave the headline hidden
  addEventListener('resize', fit);

  /* hero video: honour reduced motion */
  var hv = $('#heroVid'); if (hv && reduce) { hv.removeAttribute('autoplay'); hv.pause(); }

  /* ---------- services index: image follows the pointer ---------- */
  var peek = $('#peek'), idx = $('#svcIndex');
  if (peek && idx && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var imgs = {}, cur = null, x = 0, y = 0, tx = 0, ty = 0, raf = 0, shown = false;
    function loop() { x += (tx - x) * 0.14; y += (ty - y) * 0.14; peek.style.transform = 'translate3d(' + (x + 28) + 'px,' + (y - peek.offsetHeight / 2) + 'px,0) rotate(' + ((tx - x) * 0.02) + 'deg)';
      raf = shown || Math.abs(tx - x) > 0.5 ? requestAnimationFrame(loop) : 0; }
    function show(a) {
      var src = a.getAttribute('data-img'); if (!src) return;
      if (!imgs[src]) { var im = new Image(); im.alt = ''; im.decoding = 'async'; im.src = src; peek.appendChild(im); imgs[src] = im; }
      if (cur && cur !== imgs[src]) cur.classList.remove('on');
      cur = imgs[src]; requestAnimationFrame(function () { cur.classList.add('on'); });
    }
    $$('a', idx).forEach(function (a) {
      a.addEventListener('pointerenter', function (e) { if (!shown) { x = tx = e.clientX; y = ty = e.clientY; } shown = true; peek.classList.add('on'); show(a); if (!raf) loop(); });
      a.addEventListener('focus', function () { var r = a.getBoundingClientRect(); tx = r.right - 360; ty = r.top + r.height / 2; x = tx; y = ty; shown = true; peek.classList.add('on'); show(a); if (!raf) loop(); });
      a.addEventListener('blur', function () { shown = false; peek.classList.remove('on'); });
    });
    idx.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; if (!raf) loop(); });
    idx.addEventListener('pointerleave', function () { shown = false; peek.classList.remove('on'); });
  }

  /* ---------- material + estimator ---------- */
  var mat = 'clay', wall = null;
  function setMat(m) {
    mat = m; if (wall) wall.colour(m);
    $$('[data-mat]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mat') === m ? 'true' : 'false'); });
    est(true);
  }
  $$('[data-mat]').forEach(function (b) { b.addEventListener('click', function () { setMat(b.getAttribute('data-mat')); }); });
  var RATE = { patio: [18, 30], wall: [28, 46], retaining: [35, 60], kitchen: [55, 95], facade: [24, 40] };
  // timelines in weeks include design, groundwork and curing: [base weeks, sq ft per extra week]
  var WEEKS = { patio: [2, 250], wall: [2, 160], retaining: [3, 200], kitchen: [4, 150], facade: [3, 200] };
  var INC = { patio: 'Excavation, drained base, laying, edging and sealing', wall: 'Footing, courses, capping and pointing', retaining: 'Engineering check, drainage, footing and wall', kitchen: 'Footing, flue, stone cladding and finishing', facade: 'Scaffold, preparation, cladding and pointing' };
  var HINT = { patio: 'Ground footprint of the paved area.', wall: 'Face area of the wall: length times height.', retaining: 'Face area of the wall: length times height.', kitchen: 'Footprint of the build, hearth and surrounds.', facade: 'Wall face to be clad.' };
  var MULT = { clay: 1, sand: 1.12, lime: 1.25, char: 1.08 }, FIN = { std: 1, prem: 1.3 };
  function money(n) { return '$' + (Math.round(n / 50) * 50).toLocaleString('en-US'); }
  function est(pulse) {
    var t = $('#eType'); if (!t) return;
    var a = +$('#eArea').value, r = RATE[t.value], k = MULT[mat] * FIN[$('#eFin').value], out = $('#eOut'), w = WEEKS[t.value];
    var lo = Math.round(w[0] + a / w[1]) + ($('#eFin').value === 'prem' ? 1 : 0), hi = Math.ceil(lo * 1.5 + 1);
    $('#eAreaV').textContent = a.toLocaleString('en-US') + ' sq ft';
    $('#eHint').textContent = HINT[t.value];
    out.textContent = money(a * r[0] * k) + ' – ' + money(a * r[1] * k);
    $('#eDays').textContent = lo + ' to ' + hi + ' weeks, including design and curing';
    $('#eInc').textContent = 'Includes: ' + INC[t.value];
    $('#eMat').textContent = { clay: 'Red clay brick', sand: 'Sandstone', lime: 'Limestone', char: 'Charcoal brick' }[mat];
    if (pulse && !reduce) { out.classList.remove('tick'); void out.offsetWidth; out.classList.add('tick'); }
  }
  ['#eType', '#eArea', '#eFin'].forEach(function (s) { var el = $(s); if (el) el.addEventListener('input', function () { est(true); }); });
  var ef = $('.est-f'); if (ef) ef.addEventListener('submit', function (e) { e.preventDefault(); });
  est(false);

  /* ---------- before / after ---------- */
  var ba = $('#ba'), bar = $('#baR');
  if (ba && bar) bar.addEventListener('input', function (e) { ba.style.setProperty('--p', e.target.value + '%'); });

  /* ---------- service rows prefill the quote form ---------- */
  $$('[data-type]').forEach(function (a) { a.addEventListener('click', function () { var sel = $('#qForm select'); if (sel) sel.value = a.getAttribute('data-type'); }); });

  /* ---------- quote form ---------- */
  var q = $('#qForm'); if (q) q.addEventListener('submit', function (e) { e.preventDefault(); $('#qDone').hidden = false; });

  /* ---------- videos load and play only while on screen ---------- */
  var vids = $$('video.lazyv');
  if (vids.length) {
    var load = function (v) { if (!v.src) { v.preload = 'metadata'; v.src = v.getAttribute('data-src'); } };
    if (!('IntersectionObserver' in window)) { vids.forEach(function (v) { load(v); if (!reduce) v.play(); }); }
    else { var vio = new IntersectionObserver(function (es) { es.forEach(function (e) { var v = e.target;
      if (e.isIntersecting) { load(v); if (!reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } } else v.pause(); }); }, { rootMargin: '200px 0px' });
      vids.forEach(function (v) { vio.observe(v); }); }
  }
  if (hv && 'IntersectionObserver' in window && !reduce) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var p = hv.play(); if (p && p.catch) p.catch(function () {}); } else hv.pause(); }); }).observe(hv);

  /* gallery images are lazy, but a horizontal track hides them from the browser's heuristics: promote them as the section nears */
  var gsec = $('#projects');
  if (gsec && 'IntersectionObserver' in window) { var gio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { gio.disconnect(); $$('img', gsec).forEach(function (i) { i.loading = 'eager'; }); } }, { rootMargin: '1500px 0px' }); gio.observe(gsec); }
  else if (gsec) $$('img', gsec).forEach(function (i) { i.loading = 'eager'; });

  /* ---------- 3D material lab: script loads only when the section nears the viewport ---------- */
  var lab = $('#lab'), prog = $('#prog'), rb = $('#rebuild'), canvas = $('#wall');
  function mount() {
    try {
      wall = window.Build3D.mount(canvas, { material: mat, onProgress: function (p) { prog.textContent = p < 1 ? 'Laying · ' + Math.round(p * 100) + '%' : 'Complete · drag to turn'; } });
    } catch (err) { prog.textContent = '3D preview is not available in this browser.'; if (rb) rb.hidden = true; }
  }
  function loadLab() {
    if (window.Build3D) return mount();
    var s = document.createElement('script'); s.src = '../assets/build3d.js?v=7'; s.onload = mount; s.onerror = function () { prog.textContent = '3D preview could not load.'; if (rb) rb.hidden = true; };
    document.head.appendChild(s);
  }
  if (rb) rb.addEventListener('click', function () { if (wall) wall.rebuild(); });
  if (lab && canvas) {
    if ('IntersectionObserver' in window) { var lio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { lio.disconnect(); loadLab(); } }, { rootMargin: '700px 0px' }); lio.observe(lab); }
    else loadLab();
  }
})();
