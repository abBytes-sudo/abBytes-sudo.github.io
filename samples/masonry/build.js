/* Ashlar & Co.: page behaviour. Shared motion lives in ../assets/motion.js; this file adds the hero intro, services preview,
   gallery progress, timeline, the lab (stone, bond, size and a counter around the lazy-loaded 3D corner of wall), the estimator,
   the slider, lazy video and the quote form, which saves to the desk as a lead. */
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

  /* ---------- stone, bond, the lab's counter and the estimator ---------- */
  var STONE = { brick: ['Reclaimed brick', 1, 'warm, with a century on it already'], blue: ['Bluestone', 1.15, 'blue-gray, split in the valley'], field: ['Fieldstone', 1.2, 'gathered from old farm walls'], lime: ['Limestone', 1.3, 'pale, cut square'] };
  var BOND = {
    running: ['Running bond', ['brick', 'blue', 'lime'], 'Each course offset by half a unit.'],
    english: ['English bond', ['brick'], 'Two wythes, tied by a course of headers every other course.'],
    flemish: ['Flemish bond', ['brick'], 'A header and a stretcher in every course, as on the old river houses.'],
    herring: ['Herringbone paving', ['brick', 'blue', 'lime'], 'Laid flat at forty-five degrees on stone dust, for terraces and walks, so it goes on the ground. Length and width are the ground.'],
    drylaid: ['Dry-laid wall', ['field', 'blue'], 'No mortar: every stone fitted by hand, eighteen inches thick.'],
    screen: ['Pierced screen', ['brick'], 'Every other brick left out of alternate courses, so light and air come through.']
  };
  var DEF = { brick: 'running', blue: 'running', field: 'drylaid', lime: 'running' };
  var mat = 'brick', bond = 'running', len = 24, ht = 4, wall = null, L = {};
  function money(n) { return '$' + (Math.round(n / 50) * 50).toLocaleString('en-US'); }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  // what a wall of this size needs, in real sizes: modular brick, 3/8 in. joints, a crew of two
  function count() {
    var A = len * ht, k = STONE[mat][1], r = {};
    if (bond === 'drylaid') { r.units = Math.round(A / 10.8 * 10) / 10; r.unitL = 'tons of stone'; r.bags = 0; r.days = 1 + A / 28; r.rate = [44, 68]; }
    else if (mat === 'brick') { var D = { running: [6.75, 140, 500, [26, 40]], english: [13.5, 140, 420, [40, 58]], flemish: [13.5, 140, 400, [42, 60]], herring: [4.6, 0, 0, [24, 36]], screen: [4.4, 120, 260, [36, 52]] }[bond];
      r.units = Math.ceil(A * D[0] * 1.05); r.unitL = bond === 'herring' ? 'pavers' : 'bricks'; r.bags = D[1] ? r.units / D[1] : 0; r.days = bond === 'herring' ? 1.5 + A / 140 : 1 + r.units / D[2]; r.rate = D[3]; }
    else if (bond === 'herring') { r.units = Math.ceil(A / .5 * 1.05); r.unitL = 'pavers'; r.bags = 0; r.days = 1.5 + A / 110; r.rate = [28, 42]; }
    else { r.units = Math.ceil(A / .89 * 1.04); r.unitL = 'stones'; r.bags = A / 14; r.days = 1 + A / 45; r.rate = [34, 52]; }
    r.bags = Math.ceil(r.bags); r.days = Math.ceil(r.days); r.lo = A * r.rate[0] * k; r.hi = A * r.rate[1] * k; return r;
  }
  var cU = $('#cUnits'), cB = $('#cBags'), cD = $('#cDays'), anim = 0;
  function tally() {
    if (!cU) return; L = count(); var from = { u: +(cU.getAttribute('data-v') || 0), b: +(cB.getAttribute('data-v') || 0), d: +(cD.getAttribute('data-v') || 0) }, t0 = performance.now(), dur = reduce ? 0 : 800;
    $('#cUnitL').textContent = L.unitL; $('#cBagL').textContent = L.bags ? (L.bags === 1 ? 'bag of lime' : 'bags of lime') : 'No lime: ' + (bond === 'drylaid' ? 'dry-laid' : 'set on stone dust'); cB.style.display = L.bags ? '' : 'none';
    cU.setAttribute('data-v', L.units); cB.setAttribute('data-v', L.bags); cD.setAttribute('data-v', L.days); cancelAnimationFrame(anim);
    (function step(now) { var t = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - Math.pow(1 - t, 3), uu = from.u + (L.units - from.u) * e;
      cU.textContent = bond === 'drylaid' ? uu.toFixed(1) : fmt(uu); cB.textContent = fmt(from.b + (L.bags - from.b) * e); cD.textContent = fmt(from.d + (L.days - from.d) * e);
      if (t < 1) anim = requestAnimationFrame(step); })(performance.now());
    $('#cCost').textContent = money(L.lo) + '–' + money(L.hi);
    $('#cWhat').textContent = STONE[mat][0] + ', ' + BOND[bond][0].toLowerCase() + ', ' + len + ' by ' + ht + ' ft' + (bond === 'herring' ? ' of ground.' : ' of wall.');
  }
  function sync(msg) {
    $$('[data-mat]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mat') === mat ? 'true' : 'false'); });
    $$('[data-bond]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-bond') === bond ? 'true' : 'false'); });
    var hl = $('#htL'); if (hl) hl.textContent = bond === 'herring' ? 'Width' : 'Height';
    var nt = $('#labNote'); if (nt) nt.textContent = (msg || '') + BOND[bond][2];
  }
  function setMat(m) {
    var msg = ''; mat = m; if (BOND[bond][1].indexOf(m) < 0) { msg = BOND[bond][0] + ' is not laid in ' + STONE[m][0].toLowerCase() + ', so the wall switched to ' + BOND[DEF[m]][0].toLowerCase() + '. '; bond = DEF[m]; }
    sync(msg); tally(); est(true); if (wall) wall.set({ stone: mat, bond: bond }); show();
  }
  // on a phone the controls sit above the stage: bring the wall into view so the choice is seen being laid
  function show() { var st = $('.stage'); if (!st || innerWidth >= 900) return; var r = st.getBoundingClientRect(); if (r.top < 60 || r.bottom > innerHeight) st.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); }
  function setBond(b) {
    var msg = ''; bond = b; if (BOND[b][1].indexOf(mat) < 0) { mat = BOND[b][1][0]; msg = BOND[b][0] + ' is laid in ' + STONE[mat][0].toLowerCase() + ', so the stone switched. '; }
    sync(msg); tally(); est(true); if (wall) wall.set({ stone: mat, bond: bond }); show();
  }
  $$('[data-mat]').forEach(function (b) { b.addEventListener('click', function () { setMat(b.getAttribute('data-mat')); }); });
  $$('[data-bond]').forEach(function (b) { b.addEventListener('click', function () { setBond(b.getAttribute('data-bond')); }); });
  var lt = 0;
  [['#labLen', function (v) { len = v; $('#lenV').textContent = v + ' ft'; }], ['#labHt', function (v) { ht = v; $('#htV').textContent = v + ' ft'; }]].forEach(function (x) { var el = $(x[0]); if (el) el.addEventListener('input', function () { x[1](+el.value); clearTimeout(lt); lt = setTimeout(tally, 60); }); });

  // the estimator: the same rate card as the chat, and the stone chosen in the lab
  var RATE = { patio: [18, 30], wall: [28, 46], retaining: [35, 60], kitchen: [55, 95], facade: [24, 40] };
  // timelines in weeks include design, groundwork and curing: [base weeks, sq ft per extra week]
  var WEEKS = { patio: [2, 250], wall: [2, 160], retaining: [3, 200], kitchen: [4, 150], facade: [3, 200] };
  var INC = { patio: 'Excavation, drained base, laying, edging and sealing', wall: 'Footing, courses, capping and pointing', retaining: 'Engineering check, drainage, footing and wall', kitchen: 'Footing, flue, stone cladding and finishing', facade: 'Scaffold, preparation, cladding and pointing' };
  var HINT = { patio: 'Ground footprint of the paved area.', wall: 'Face area of the wall: length times height.', retaining: 'Face area of the wall: length times height.', kitchen: 'Footprint of the build, hearth and surrounds.', facade: 'Wall face to be clad.' };
  var JOB = { patio: 'Terrace or walkway', wall: 'Garden or boundary wall', retaining: 'Retaining wall', kitchen: 'Outdoor kitchen or hearth', facade: 'Facade or cladding' }, FIN = { std: 1, prem: 1.3 }, E = {};
  function est(pulse) {
    var t = $('#eType'); if (!t) return;
    var a = +$('#eArea').value, r = RATE[t.value], k = STONE[mat][1] * FIN[$('#eFin').value], out = $('#eOut'), w = WEEKS[t.value];
    var lo = Math.round(w[0] + a / w[1]) + ($('#eFin').value === 'prem' ? 1 : 0), hi = Math.ceil(lo * 1.5 + 1);
    E = { app: t.value, job: JOB[t.value], area: a, lo: a * r[0] * k, hi: a * r[1] * k, weeks: [lo, hi] };
    $('#eAreaV').textContent = a.toLocaleString('en-US') + ' sq ft';
    $('#eHint').textContent = HINT[t.value];
    out.textContent = money(E.lo) + ' – ' + money(E.hi);
    $('#eDays').textContent = lo + ' to ' + hi + ' weeks, including design and curing';
    $('#eInc').textContent = 'Includes: ' + INC[t.value];
    $('#eMat').textContent = STONE[mat][0] + ', ' + STONE[mat][2];
    if (pulse && !reduce) { out.classList.remove('tick'); void out.offsetWidth; out.classList.add('tick'); }
    estLabel();
  }
  ['#eType', '#eArea', '#eFin'].forEach(function (s) { var el = $(s); if (el) el.addEventListener('input', function () { est(true); }); });
  var ef = $('.est-f'); if (ef) ef.addEventListener('submit', function (e) { e.preventDefault(); });

  /* ---------- before / after ---------- */
  var ba = $('#ba'), bar = $('#baR');
  if (ba && bar) bar.addEventListener('input', function (e) { ba.style.setProperty('--p', e.target.value + '%'); });

  /* ---------- service rows prefill the quote form ---------- */
  $$('[data-type]').forEach(function (a) { a.addEventListener('click', function () { var sel = $('#qForm select'); if (sel) sel.value = a.getAttribute('data-type'); }); });

  /* ---------- quote form: saved to the desk as a lead, through the same store as the chat ---------- */
  window.ashlarLead = function (lead, done) {
    lead.agent = 'ashlar'; lead.channel = lead.channel || 'web'; lead.source = lead.source || 'Website form'; lead.payload = lead.payload || {};
    function save() {
      try { if (window.Orbit && Orbit.leads) { var r = Orbit.leads.add(lead); if (Orbit.events) Orbit.events.log('lead', { agent: 'ashlar', channel: 'web', source: lead.source, convo: 'form-' + r.id, lead: r.id, intent: lead.intent }); return done && done(r); } } catch (e) {}
      try { var a = JSON.parse(localStorage.getItem('orbit-leads') || '[]'); lead.id = 'L-' + (1008 + a.length); lead.timestamp = new Date().toISOString(); lead.status = 'new'; a.push(lead); localStorage.setItem('orbit-leads', JSON.stringify(a)); } catch (e) {}
      if (done) done(lead);
    }
    if (window.Concierge && Concierge.load) Concierge.load(save); else save();
  };
  var QAPP = { 'Terrace or walkway': ['patio'], 'Wall or facade': ['wall', 'facade'], 'Retaining wall': ['retaining'], 'Hearth or outdoor kitchen': ['kitchen'] };
  // the checkbox says exactly which number goes with the request
  function estLabel() {
    var l = $('#qEstL'), qt = $('#qT'); if (!l || !qt || !E.lo) return;
    var same = (QAPP[qt.value] || []).indexOf(E.app) >= 0;
    l.textContent = 'Attach my first number (' + E.job.toLowerCase() + ', ' + E.area.toLocaleString('en-US') + ' sq ft, ' + money(E.lo) + ' – ' + money(E.hi) + (same ? '' : ', worked out for a different job') + ') and my wall from the lab';
  }
  var q = $('#qForm');
  if (q) {
    var qt0 = $('#qT'); if (qt0) qt0.addEventListener('change', estLabel);
    q.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = $('#qN').value.trim(), c = $('#qC').value.trim(), err = $('#qE'), em = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c), ph = c.replace(/\D/g, '').length >= 7;
      if (n.length < 2) { err.textContent = 'Add your name, please.'; $('#qN').focus(); return; }
      if (!em && !ph) { err.textContent = 'Add a phone number or an email so Sana can reach you.'; $('#qC').focus(); return; }
      err.textContent = '';
      var job = $('#qT').value, town = $('#qTown').value, p = { job: job, town: town, area: town, note: $('#qM').value.trim(), form: 'Quote request' };
      if ($('#qEst').checked && E.lo) {
        p.est = { lo: Math.round(E.lo), hi: Math.round(E.hi), area: E.area, job: E.job, weeks: E.weeks }; p.stone = STONE[mat][0]; p.bond = BOND[bond][0]; p.wall = len + ' × ' + ht + ' ft';
        // the range counts as this request's value only when it was worked out for the same kind of job
        if ((QAPP[job] || []).indexOf(E.app) >= 0) { p.low = p.est.lo; p.high = p.est.hi; }
      }
      var btn = q.querySelector('button[type=submit]'), label = btn.innerHTML; btn.disabled = true; btn.textContent = 'Sending';
      window.ashlarLead({ name: n, email: em ? c : undefined, phone: em ? undefined : c, source: 'Website form', intent: 'quote_request', payload: p }, function () {
        btn.disabled = false; btn.innerHTML = label;
        var d = $('#qDone'); d.hidden = false; d.textContent = 'Thank you, ' + n.split(' ')[0] + '. Sana has your note about the ' + job.toLowerCase() + ' in ' + (town === 'Elsewhere in the valley' ? 'the valley' : town) + (p.est ? ', with your first number,' : '') + ' and will call within a working day to book the visit.';
        $('#qM').value = '';
      });
    });
  }

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
      wall = window.Build3D.mount(canvas, { material: mat, bond: bond, onProgress: function (p, phase) { prog.textContent = phase === 'cut' ? 'Cutting the stone' : p < 1 ? 'Laying · ' + Math.round(p * 100) + '%' : 'Complete · drag to turn'; } });
    } catch (err) { prog.textContent = '3D preview is not available in this browser.'; if (rb) rb.hidden = true; }
  }
  function loadLab() {
    if (window.Build3D) return mount();
    var s = document.createElement('script'); s.src = '../assets/build3d.js?v=10'; s.onload = mount; s.onerror = function () { prog.textContent = '3D preview could not load.'; if (rb) rb.hidden = true; };
    document.head.appendChild(s);
  }
  if (rb) rb.addEventListener('click', function () { if (wall) wall.rebuild(); });
  if (lab && canvas) {
    if ('IntersectionObserver' in window) { var lio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { lio.disconnect(); loadLab(); } }, { rootMargin: '700px 0px' }); lio.observe(lab); }
    else loadLab();
  }
  sync(''); tally(); est(false);
})();
