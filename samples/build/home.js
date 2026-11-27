/* Sthira · home: the site plan, then the pinned three.js build.
   The plan (plan-draw.js, inlined by make.py) draws itself on arrival. Scrolling hands it to the 3D model, whose first
   frame looks straight down on the same drawing; from there, scroll position -> build progress (0..1), and every
   caption, the day counter and the ruler follow what is actually on screen. "Draw your own plot" redraws the plan and
   the model for a visitor's plot, with days, cost range and stage payments from the estimator's formula (cost.js).
   At the end, a section through the stair core shows six of the hold points. */
(function () {
  'use strict';
  var D = window.STHIRA, A = window.App, $ = A.$, $$ = A.$$, esc = A.esc, P = window.SthiraPlan, Cost = window.SthiraCost;
  var reduce = A.reduce, FT = P.FT;
  var hero = $('#build'), stage = $('#stage'), canvas = $('#bld'), planbox = $('#planbox');
  if (!hero) return;
  var STAGES = D.STAGES, LIVE_P = D.pAt(D.LIVE.day);
  var B0 = 0.14, B1 = 0.88; // the build runs between these points of the hero's scroll: the plan before, keys and the section after
  var api = null, ready = false, no3d = false, raw = 0, lastRaw = 0, shown = 0, lastStage = -1, sec = false, panelOpen = false;
  var clamp = function (v, a, b) { return Math.max(a == null ? 0 : a, Math.min(b == null ? 1 : b, v)); };
  var smooth = function (a, b, v) { var t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

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

  // ---------- the plot: Plot 14, or the visitor's own (feet, floors), with its figures ----------
  var mine = (function (m) { return m && m.w >= 30 && m.w <= 100 && m.d >= 30 && m.d <= 150 && m.f >= 2 && m.f <= 4 ? m : null; })(A.store.get('myplot', null));
  function cfgOf(m) { return m ? { plotW: m.w * FT, plotD: m.d * FT, floors: m.f } : { floors: 4 }; }
  var fig = null; // { L, r, lo, hi, days, design, pays: [day] } for the visitor's plot
  function figures(m) {
    var L = P.layout(cfgOf(m)), r = Cost.calc({ city: 'blr', type: 'home', area: L.sqft, floors: L.floors, tier: 'signature', x: ['design'] }), a = r.tasks[0].l;
    return { L: L, r: r, lo: r.total * 0.94, hi: r.total * 1.08, days: Math.round((r.weeks - a) * 7), design: a, pays: r.pays.map(function (w) { return Math.max(0, Math.round((w - a) * 7)); }) };
  }
  // stage day ranges: Plot 14's own, or the visitor's from the estimator's programme
  var DAYS = STAGES.map(function (s) { return s.day; });
  function dayTable() {
    if (!fig) return STAGES.map(function (s) { return s.day; });
    var t = fig.r.tasks, a = fig.design, d = function (w) { return Math.max(1, Math.round((w - a) * 7)); };
    var ends = [0, d(t[1].s + t[1].l), d(t[2].s + t[2].l * 0.25), d(t[2].s + t[2].l), d(t[3].s + t[3].l), d(t[6].s + t[6].l), d(t[7].s + t[7].l)];
    for (var i = 1; i < ends.length; i++) ends[i] = Math.max(ends[i], ends[i - 1] + 2);
    return STAGES.map(function (s, i) { return i === 0 ? [0, 0] : [ends[i - 1] + 1, ends[i]]; });
  }
  function total() { return DAYS[DAYS.length - 1][1]; }
  function dayAt(p) {
    for (var i = 0; i < STAGES.length; i++) { var s = STAGES[i], d = DAYS[i]; if (p <= s.p[1] || i === STAGES.length - 1) return Math.round(d[0] + (d[1] - d[0]) * clamp((p - s.p[0]) / (s.p[1] - s.p[0]))); }
    return total();
  }
  function pAtDay(day) {
    for (var i = 1; i < STAGES.length; i++) { var s = STAGES[i], d = DAYS[i]; if (day <= d[1]) return s.p[0] + (s.p[1] - s.p[0]) * clamp((day - d[0]) / Math.max(1, d[1] - d[0])); }
    return 1;
  }
  var range = Cost.range;
  var WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  function cap1(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function leadOf(i) {
    var s = STAGES[i];
    if (!fig) return s.lead;
    var L = fig.L, n = (L.baysX + 1) * (L.baysZ + 1);
    if (i === 0) return 'Every line here is already priced. Your plot, its setbacks and the column grid are drawn before we break ground.';
    if (i === 1) return cap1(n <= 20 ? WORDS[n] : String(n)) + ' isolated footings on PCC, tied by plinth beams. We dig to the soil report, not to a habit.';
    return s.lead.replace('day 320', 'day ' + total());
  }
  function durOf(i) {
    var s = STAGES[i], d = DAYS[i];
    if (i === 0) return s.dur;
    return (fig ? (d[1] - d[0] + 1) + ' days' : s.dur) + ' · day ' + d[0] + '–' + d[1];
  }

  // ---------- ruler ----------
  var ticks = $('#ticks'), fill = $('#fill'), dayEl = $('#day'), dayOf = $('#dayof'), rstage = $('#rstage'), rcost = $('#rcost'), track = $('#track'), pays = $('#pays');
  if (ticks) ticks.innerHTML = STAGES.slice(1).map(function (s) {
    return '<button type="button" data-go="' + s.p[0] + '" style="left:' + (s.p[0] * 100) + '%" aria-label="Jump to stage ' + s.n + ', ' + esc(s.name) + '"><span>' + s.n + ' ' + esc(s.name.split(' ')[0]) + '</span></button>';
  }).join('');
  var todayMk = $('#todaymk'); if (todayMk) todayMk.style.left = (LIVE_P * 100) + '%';
  function heroTop() { return hero.getBoundingClientRect().top + scrollY; }
  function heroLen() { return hero.offsetHeight - innerHeight; }
  function go(y, smoothly) {
    if (window.Motion && Motion.lenis && smoothly !== false) Motion.lenis.scrollTo(y, { duration: 2.2 });
    else scrollTo({ top: y, behavior: reduce || smoothly === false ? 'auto' : 'smooth' });
  }
  function scrollToP(p, smoothly) { go(heroTop() + heroLen() * (B0 + p * (B1 - B0)), smoothly); }
  if (ticks) ticks.addEventListener('click', function (e) { var b = e.target.closest('[data-go]'); if (b) scrollToP(+b.dataset.go + 0.002); });
  var todayCard = $('#today'), todayPinned = false;
  $('#todaybtn') && $('#todaybtn').addEventListener('click', function () { todayPinned = true; scrollToP(LIVE_P); });
  if (track) {
    var dragging = false;
    var at = function (e) { var r = track.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width); };
    track.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; dragging = true; track.setPointerCapture(e.pointerId); scrollToP(at(e), false); });
    track.addEventListener('pointermove', function (e) { if (dragging) scrollToP(at(e), false); });
    track.addEventListener('pointerup', function () { dragging = false; });
  }
  // the nine stage payments of the visitor's estimate, marked where they fall on the build
  function drawPays() {
    if (!pays) return;
    if (!fig) { pays.innerHTML = ''; return; }
    var tot = fig.r.total;
    pays.innerHTML = fig.pays.map(function (day, i) {
      var p = day <= 0 ? 0 : pAtDay(day), amt = tot * Cost.PAYS[i][1] / 100;
      return '<i style="left:' + (p * 100).toFixed(2) + '%" data-p="' + p.toFixed(4) + '"><b>' + range(amt, amt).split('–')[0] + '</b></i>';
    }).join('');
  }

  // ---------- captions ----------
  var cap = $('#cap'), intro = $('#intro'), end = $('#end'), notes = $('#notes');
  function stageIndex(p) { for (var i = STAGES.length - 1; i >= 0; i--) if (p >= STAGES[i].p[0]) return i; return 0; }
  function fillCap(i) {
    var s = STAGES[i];
    $('#cap-n').innerHTML = s.n + '<sup>/ 06</sup>'; $('#cap-h').textContent = s.name; $('#cap-l').textContent = leadOf(i);
    $('#cap-t').textContent = s.trade; $('#cap-d').textContent = durOf(i); $('#cap-q').textContent = s.qc;
  }
  function ui(p) {
    var i = stageIndex(p);
    if (intro) intro.classList.toggle('away', raw > 0.015 || panelOpen);
    if (notes) notes.classList.toggle('away', raw > 0.015 || panelOpen);
    var showCap = (i >= 1 || raw > 0.03) && p < 0.955 && !panelOpen && !sec;
    if (cap) {
      cap.classList.toggle('on', showCap);
      if (i !== lastStage) {
        fillCap(i);
        if (!reduce && window.gsap && lastStage >= 0 && showCap) gsap.fromTo(cap.children, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.05, ease: 'power3.out' });
      }
    }
    lastStage = i;
    hero.classList.toggle('night', p > 0.962 && !sec);
    if (end) end.classList.toggle('on', p > 0.97 && !sec);
    if (dayEl) dayEl.textContent = 'Day ' + dayAt(p);
    if (rstage) rstage.textContent = i === 0 ? 'Site plan' : STAGES[i].n + ' · ' + STAGES[i].name;
    if (fill) fill.style.width = (p * 100) + '%';
    if (ticks) $$('button', ticks).forEach(function (b, k) { if (k + 1 === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    if (pays) $$('i', pays).forEach(function (m) { m.classList.toggle('on', p >= +m.dataset.p - 0.001); });
    var nearToday = !fig && Math.abs(p - LIVE_P) < 0.025;
    if (todayCard) todayCard.classList.toggle('on', nearToday || (!fig && todayPinned && Math.abs(p - LIVE_P) < 0.05));
    if (Math.abs(p - LIVE_P) > 0.05) todayPinned = false;
  }

  // ---------- the drawn plan: where it sits, and the hand-over to the 3D ----------
  // L1: the plan's own box (beside the intro on wide screens, above it on phones);
  // L2: where it sits once the intro has gone, which is also the 3D's first frame (the same on wide screens).
  var L1 = null, L2 = null, planT = { x: 0, y: 0, k: 1 }, wide = true;
  function planSvg() { return $('#plan', planbox); }
  function measure() {
    var svg = planSvg(); if (!svg) return;
    var st = stage.getBoundingClientRect(), b = planbox.getBoundingClientRect(), vb = svg.viewBox.baseVal;
    var s = Math.min(b.width / vb.width, b.height / vb.height);
    L1 = { left: b.left - st.left + (b.width - vb.width * s) / 2, top: b.top - st.top + (b.height - vb.height * s) / 2, width: vb.width * s, height: vb.height * s };
    wide = innerWidth > 900;
    if (wide) { L2 = L1; planT = { x: 0, y: 0, k: 1 }; }
    else {
      var W = stage.clientWidth, top = 96 + 14, bottom = (cap ? cap.offsetTop : stage.clientHeight * 0.66) - 18;
      L2 = P.fitRect(cfgOf(mine), { x0: 12, x1: W - 12, y0: top, y1: Math.max(top + 160, bottom) });
      var k = L2.width / L1.width, bx = b.left - st.left, by = b.top - st.top;
      planT = { x: L2.left - bx - k * (L1.left - bx), y: L2.top - by - k * (L1.top - by), k: k };
    }
    if (api) api.setPlanRect(L2);
  }
  function place() {
    var svg = planSvg();
    if (svg && !wide) {
      var m = smooth(0.012, 0.07, raw);
      svg.style.transform = m > 0.001 ? 'translate(' + (planT.x * m).toFixed(1) + 'px,' + (planT.y * m).toFixed(1) + 'px) scale(' + (1 + (planT.k - 1) * m).toFixed(4) + ')' : '';
    }
    if (ready && !reduce) {
      var f = smooth(0.095, 0.135, raw);
      canvas.style.opacity = f.toFixed(3); planbox.style.opacity = (1 - f).toFixed(3);
      planbox.style.visibility = f > 0.999 ? 'hidden' : '';
    }
  }
  function redrawPlan() {
    planbox.innerHTML = P.svg(cfgOf(mine), { id: 'plan' });
    measure(); place();
  }

  function readScroll() {
    var r = hero.getBoundingClientRect(), len = Math.max(1, hero.offsetHeight - innerHeight);
    raw = clamp(-r.top / len);
    var p = clamp((raw - B0) / (B1 - B0));
    place();
    if (sec && raw < B1 - 0.03) closeSection();
    if (panelOpen && raw > 0.05 && raw > lastRaw) closePanel();
    if (api && !reduce) { api.setProgress(p); ui(shown); } else { shown = p; ui(p); }
    lastRaw = raw;
  }

  // ---------- "draw your own plot" ----------
  var panel = $('#plotpanel'), plotBtn = $('#plotbtn'), out = $('#ppout'), wIn = $('#pp-w'), dIn = $('#pp-d');
  var rebuildT = 0, drawT = 0;
  function readForm() {
    var w = Math.round(+wIn.value), d = Math.round(+dIn.value), f = +(panel.querySelector('[name=pf]:checked') || {}).value || 3;
    return { w: w, d: d, f: f, ok: w >= 30 && w <= 100 && d >= 30 && d <= 150 };
  }
  function syncForm() {
    var m = mine || { w: 40, d: 60, f: 3 };
    wIn.value = m.w; dIn.value = m.d;
    $$('[name=pz]', panel).forEach(function (r) { r.checked = r.value === m.w + 'x' + m.d; });
    $$('[name=pf]', panel).forEach(function (r) { r.checked = +r.value === m.f; });
  }
  function describe(m) {
    var f2 = fig, fl = ['', 'G', 'G+1', 'G+2', 'G+3'][m.f];
    return f2.L.sqft.toLocaleString('en-IN') + ' sq ft on ' + m.f + ' floors (' + fl + ') · ' + range(f2.lo, f2.hi) + ' · ' + f2.days + ' days on site';
  }
  function setMine(m, quick) {
    mine = m; fig = m ? figures(m) : null; DAYS = dayTable();
    if (m) A.store.set('myplot', { w: m.w, d: m.d, f: m.f }); else A.store.del('myplot');
    // words: the A-01 head, the hint, the ruler, the title block, the end of the build
    var name = m ? 'Your plot, ' + m.w + ' × ' + m.d + ' ft, ' + ['', 'G', 'G+1', 'G+2', 'G+3'][m.f] : 'Plot 14, HSR Layout, Bengaluru';
    $('#plotname').textContent = name;
    $('#hinttxt').textContent = no3d ? (m ? 'Your ' + m.w + ' × ' + m.d + ' ft plot, drawn to scale. Or' : 'Plot 14, drawn to scale. Or') : m ? 'Scroll to build your ' + m.w + ' × ' + m.d + ' ft plot, or' : 'Scroll to build Plot 14, or';
    plotBtn.textContent = m ? 'change it' : 'draw your own plot';
    if (dayOf) dayOf.textContent = 'of ' + total();
    if (rcost) { rcost.hidden = !m; rcost.textContent = m ? range(fig.lo, fig.hi) : ''; }
    if (todayMk) todayMk.hidden = !!m;
    hero.classList.toggle('mine', !!m);
    if (A.setSheet) A.setSheet(m ? 'Your plot · ' + range(fig.lo, fig.hi) : null, m ? 'A' : null);
    $('#end-h').textContent = 'Day ' + total() + '. Keys.';
    var goBtn = $('#end-go');
    goBtn.innerHTML = m ? 'Send this drawing to Sthira <span class="ar" aria-hidden="true">→</span>' : 'Start your project <span class="ar" aria-hidden="true">→</span>';
    goBtn.setAttribute('href', m ? '#dlg-draw' : 'contact.html');
    if (out) out.textContent = m ? describe(m) : '';
    drawPays(); lastStage = -1; ui(shown);
    // the drawing and the model
    clearTimeout(drawT); clearTimeout(rebuildT);
    drawT = setTimeout(redrawPlan, quick ? 0 : 220);
    if (api) rebuildT = setTimeout(function () { api.rebuild(cfgOf(mine)); measure(); }, quick ? 0 : 380);
  }
  function openPanel() {
    panelOpen = true; panel.hidden = false; plotBtn.setAttribute('aria-expanded', 'true');
    hero.classList.add('drawing');
    syncForm(); if (!mine) setMine(readForm(), true);
    if (raw > 0.012) go(heroTop(), true);
    ui(shown); measure(); place();
    var first = panel.querySelector('[name=pz]:checked') || panel.querySelector('[name=pz]'); first && first.focus({ preventScroll: true });
  }
  function closePanel() {
    if (!panelOpen) return;
    panelOpen = false; panel.hidden = true; plotBtn.setAttribute('aria-expanded', 'false'); hero.classList.remove('drawing');
    ui(shown); measure(); place();
  }
  if (panel) {
    plotBtn.addEventListener('click', function () { if (panelOpen) closePanel(); else openPanel(); });
    $('#ppx').addEventListener('click', function () { closePanel(); plotBtn.focus(); });
    $('#ppreset').addEventListener('click', function () { setMine(null); closePanel(); plotBtn.focus(); });
    panel.addEventListener('change', function (e) {
      if (e.target.name === 'pz') { var v = e.target.value.split('x'); wIn.value = v[0]; dIn.value = v[1]; }
      if (e.target === wIn || e.target === dIn) { wIn.value = clamp(Math.round(+wIn.value) || 40, 30, 100); dIn.value = clamp(Math.round(+dIn.value) || 60, 30, 150); }
      var f = readForm(); if (!f.ok) return;
      $$('[name=pz]', panel).forEach(function (r) { r.checked = r.value === f.w + 'x' + f.d; });
      setMine(f);
    });
    panel.addEventListener('input', function (e) {
      if (e.target !== wIn && e.target !== dIn) return;
      var f = readForm(); if (!f.ok) { if (out) out.textContent = 'Plots from 30 to 100 ft wide and 30 to 150 ft deep.'; return; }
      $$('[name=pz]', panel).forEach(function (r) { r.checked = r.value === f.w + 'x' + f.d; });
      setMine(f);
    });
    panel.addEventListener('submit', function (e) { e.preventDefault(); closePanel(); scrollToP(0.07); });
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closePanel(); plotBtn.focus(); } });
  }

  // ---------- "Send this drawing to Sthira" ----------
  var dlg = $('#dlg-draw'), fd = $('#f-draw');
  if (dlg) {
    $('#end-go').addEventListener('click', function (e) {
      if (!mine) return; e.preventDefault();
      $('#dd-plan').innerHTML = P.svg(cfgOf(mine), { cls: 'still' });
      $('#dd-sum').textContent = mine.w + ' × ' + mine.d + ' ft plot · ' + describe(mine) + '. Bengaluru rates, Signature spec, design included.';
      fd.hidden = false; $('#dd-done').hidden = true; dlg.showModal();
    });
    $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    fd.addEventListener('submit', function (e) {
      e.preventDefault(); if (!A.validate(fd) || !mine) return;
      var d = Object.fromEntries(new FormData(fd).entries()), L = fig.L, fl = ['', 'G', 'G+1', 'G+2', 'G+3'][mine.f];
      var l = A.addLead({ name: d.name, email: d.email, phone: d.phone, city: 'Bengaluru', loc: d.loc, type: 'Residential', area: L.sqft, floors: fl, budget: range(fig.lo, fig.hi), source: 'Home drawing',
        note: 'Drew a ' + mine.w + ' × ' + mine.d + ' ft plot on the home page and built it: ' + fl + ', ' + L.sqft + ' sq ft, ' + L.baysX + ' × ' + L.baysZ + ' bays, ' + fig.days + ' days on site.',
        estimate: { tier: 'signature', area: L.sqft, floors: mine.f, city: 'blr', lo: fig.lo, hi: fig.hi, x: ['design'] },
        drawing: { plotFt: [mine.w, mine.d], floors: mine.f, bays: [L.baysX, L.baysZ], grid: [Math.round(L.bay * 1000), Math.round(L.depth * 1000)], footprint: [Math.round(L.W * 100) / 100, Math.round(L.D * 100) / 100], days: fig.days } });
      fd.hidden = true; $('#dd-done').hidden = false; $('#dd-ref').textContent = 'Reference ' + l.id + '. The drawing and its estimate are attached, so the engineer who calls has both.';
      A.toast('Drawing sent as <b>' + l.id + '</b>.');
    });
  }

  // ---------- the section through the stair core ----------
  var secBtn = $('#secbtn'), secUi = $('#secui'), secPanel = $('#secpanel'), handle = $('#sechandle'), line = $('#secline'), tags = $('#sectags'), card = $('#hpcard');
  var HOLDS = D.HOLDS || [], openHp = null, lastSt = null;
  if (tags) tags.innerHTML = HOLDS.map(function (h) { return '<button type="button" class="hp" data-hp="' + h.id + '" aria-expanded="false" aria-controls="hpcard" aria-label="' + h.id + ', ' + esc(h.title) + '" hidden><i aria-hidden="true"></i><span aria-hidden="true">' + h.id + '</span></button>'; }).join('');
  function openSection() {
    if (!api || sec) return;
    sec = true; hero.classList.add('sec-on'); secPanel.hidden = false; secUi.hidden = false;
    api.section(true); ui(shown);
    if (A.setSheet) A.setSheet('Section A–A, through the stair core', null);
    setTimeout(function () { if (sec) handle.focus({ preventScroll: true }); }, reduce ? 0 : 1200);
  }
  function closeSection() {
    if (!sec) return;
    sec = false; hero.classList.remove('sec-on'); secPanel.hidden = true; closeHp();
    if (api) api.section(false);
    if (A.setSheet) A.setSheet(mine ? 'Your plot · ' + range(fig.lo, fig.hi) : null, mine ? 'A' : null);
    ui(shown); if (document.activeElement === handle) secBtn.focus({ preventScroll: true });
  }
  function onSection(st) {
    lastSt = st;
    if (!st.open && st.k < 0.01) { secUi.hidden = true; return; }
    var show = st.k > 0.6;
    handle.hidden = !show;
    if (show) {
      handle.style.transform = 'translate(' + st.handle.x.toFixed(1) + 'px,' + st.handle.y.toFixed(1) + 'px)';
      line.setAttribute('x1', st.handle.x.toFixed(1)); line.setAttribute('y1', st.handle.y.toFixed(1)); line.setAttribute('x2', st.handle.tx.toFixed(1)); line.setAttribute('y2', st.handle.ty.toFixed(1));
      var u = Math.round(st.u * 100); handle.setAttribute('aria-valuenow', u);
      var dims = api.dims; handle.setAttribute('aria-valuetext', 'Cut ' + (dims.W / 2 - st.c).toFixed(1) + ' metres in from the right-hand wall');
    }
    line.style.opacity = show ? 1 : 0;
    $$('.hp', tags).forEach(function (b, i) {
      var h = st.holds[i]; if (!h) return;
      b.hidden = !h.vis;
      if (h.vis) { b.style.transform = 'translate(' + h.x.toFixed(1) + 'px,' + h.y.toFixed(1) + 'px)'; b.classList.toggle('flip', h.x > stage.clientWidth - 104); }
      if (!h.vis && openHp === b) closeHp();
    });
    if (openHp) placeCard(openHp);
  }
  function placeCard(b) {
    var r = b.getBoundingClientRect(), s = stage.getBoundingClientRect(), cw = Math.min(320, innerWidth - 24);
    var x = clamp(r.left - s.left - cw - 14, 12, s.width - cw - 12), y = clamp(r.top - s.top - 20, 100, s.height - 220);
    if (r.left - s.left - cw - 14 < 12) x = clamp(r.right - s.left + 14, 12, s.width - cw - 12);
    card.style.transform = 'translate(' + x + 'px,' + y + 'px)'; card.style.width = cw + 'px';
  }
  function openHpFor(b) {
    var h = HOLDS.filter(function (x) { return x.id === b.dataset.hp; })[0]; if (!h) return;
    if (openHp && openHp !== b) openHp.setAttribute('aria-expanded', 'false');
    openHp = b; b.setAttribute('aria-expanded', 'true');
    $('#hp-k').textContent = h.id + ' · ' + h.where; $('#hp-h').textContent = h.title; $('#hp-p').textContent = h.text;
    card.hidden = false; placeCard(b);
  }
  function closeHp() { if (openHp) openHp.setAttribute('aria-expanded', 'false'); openHp = null; if (card) card.hidden = true; }
  if (secBtn) {
    secBtn.addEventListener('click', openSection);
    $('#secexit').addEventListener('click', function () { closeSection(); });
    tags.addEventListener('click', function (e) { var b = e.target.closest('.hp'); if (!b) return; if (openHp === b) closeHp(); else openHpFor(b); });
    $('#hpx').addEventListener('click', function () { var b = openHp; closeHp(); b && b.focus(); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && sec) { if (openHp) { var b = openHp; closeHp(); b.focus(); } else closeSection(); } });
    // the handle: drag along the building, or arrow keys
    var drag = null;
    handle.addEventListener('pointerdown', function (e) { if (!lastSt) return; drag = { x: e.clientX, u: lastSt.u }; handle.setPointerCapture(e.pointerId); e.preventDefault(); });
    handle.addEventListener('pointermove', function (e) {
      if (!drag || !lastSt) return; var pm = lastSt.handle.pxPerM || 20, span = lastSt.handle.span || 10;
      api.cut(drag.u - (e.clientX - drag.x) / (pm * span));
    });
    handle.addEventListener('pointerup', function () { drag = null; });
    handle.addEventListener('keydown', function (e) {
      if (!api) return; var u = api.cutU, step = e.shiftKey ? 0.1 : 0.03, dir = lastSt && lastSt.handle.pxPerM < 0 ? -1 : 1;
      var k = { ArrowLeft: step * dir, ArrowDown: step * dir, ArrowRight: -step * dir, ArrowUp: -step * dir, PageDown: 0.15, PageUp: -0.15 }[e.key];
      if (e.key === 'Home') api.cut(0); else if (e.key === 'End') api.cut(1); else if (k != null) api.cut(u + k); else return;
      e.preventDefault();
    });
  }

  // ---------- mini estimator in the dark band (the estimator's own formula, Bengaluru, design included) ----------
  var mini = $('#mini');
  if (mini) {
    var calcMini = function () {
      var area = +$('#me-a').value, f = +(mini.querySelector('[name=mf]:checked') || {}).value || 3, tid = (mini.querySelector('[name=mt]:checked') || {}).value || 'signature';
      var r = Cost.calc({ city: 'blr', type: 'home', area: area, floors: f, tier: tid, x: ['design'] });
      $('#me-ao').textContent = area.toLocaleString('en-IN') + ' sq ft';
      $('#me-a').style.setProperty('--v', ((area - 1000) / 110) + '%');
      $('#me-r').textContent = range(r.total * 0.94, r.total * 1.08);
      $('#me-m').textContent = r.months + ' months';
      $('#me-go').href = 'estimate.html?c=blr&t=home&a=' + area + '&f=' + f + '&s=' + tid + '&x=design';
    };
    mini.addEventListener('input', calcMini); mini.addEventListener('change', calcMini); mini.addEventListener('submit', function (e) { e.preventDefault(); });
    calcMini();
  }

  // ---------- 3D: loaded at once on a real GPU; on software rendering or without WebGL the drawn plan is the page ----------
  function gpu() {
    try {
      var c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return 0;
      var ext = gl.getExtension('WEBGL_debug_renderer_info'), name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      var lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      return /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen/i.test(name) ? 1 : 2;
    } catch (e) { return 0; }
  }
  function frame() {
    var w = innerWidth;
    if (w <= 900) return [0, 0.16];
    return [w > 1500 ? 0.17 : 0.15, -0.03];
  }
  // without a model the page is the drawing: the plan, the stages as a list, and "draw your own plot" still redraws it
  function fail() {
    no3d = true; document.documentElement.classList.add('no-3d'); if (secBtn) secBtn.hidden = true;
    $('#hinttxt').textContent = mine ? 'Your ' + mine.w + ' × ' + mine.d + ' ft plot, drawn to scale. Or' : 'Plot 14, drawn to scale. Or';
    var k = $('#stagelist .k'); if (k) k.textContent = 'The build, stage by stage.';
    if (sl) $$('[data-stage]', sl).forEach(function (b) { b.removeAttribute('aria-pressed'); b.tabIndex = -1; });
    measure();
  }
  function onReady() {
    ready = true; if (secBtn) secBtn.hidden = false;
    if (reduce) { canvas.style.opacity = 1; planbox.style.opacity = 0; return; }
    // if the visitor is already past the hand-over, fade the model in instead of cutting to it
    if (raw > 0.095) { canvas.classList.add('fadein'); planbox.classList.add('fadein'); setTimeout(function () { canvas.classList.remove('fadein'); planbox.classList.remove('fadein'); }, 900); }
    place();
  }
  function mount3d() {
    try {
      var f = frame();
      api = window.Sthira3D.mount(canvas, { progress: reduce ? 0.93 : clamp((raw - B0) / (B1 - B0)), frameX: f[0], frameY: f[1], noIntro: true, config: cfgOf(mine), planRect: L2, onReady: onReady, onSection: onSection });
      api.onProgress = function (p) { shown = p; if (!reduce) ui(p); };
      addEventListener('resize', function () { var f2 = frame(); api.setFrame(f2[0], f2[1]); });
    } catch (e) { fail(); }
  }
  // the model is fetched at once; it is built (the heavy part, on the main thread) on the first sign of a visitor
  // (scroll, wheel, pointer, touch, key) or after eight quiet seconds, so the first screen stays responsive.
  // Until then the drawn plan is the first frame, so the sheet is never empty either way.
  function start3d() {
    var loaded = false, wanted = false, evs = ['scroll', 'wheel', 'pointerdown', 'pointermove', 'touchstart', 'keydown'], quiet = 0;
    function want() {
      if (wanted) return; wanted = true; clearTimeout(quiet);
      evs.forEach(function (e) { removeEventListener(e, want, true); });
      if (loaded) (window.requestIdleCallback || setTimeout)(mount3d, { timeout: 300 });
    }
    evs.forEach(function (e) { addEventListener(e, want, { capture: true, passive: true }); });
    quiet = setTimeout(want, 8000);
    var s = document.createElement('script'); s.src = '../assets/build-sthira3d.js?v=10';
    s.onload = function () { loaded = true; if (wanted) (window.requestIdleCallback || setTimeout)(mount3d, { timeout: 300 }); };
    s.onerror = fail;
    document.head.appendChild(s);
  }

  // ---------- boot ----------
  if (secBtn) secBtn.hidden = true;
  if (mine) { syncForm(); setMine(mine, true); } else { DAYS = dayTable(); fillCap(0); }
  measure();
  addEventListener('resize', function () { measure(); readScroll(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); place(); });
  if (reduce) {
    // static: no pin; the plan, then the finished building, and the stage buttons swap the still frame
    if (sl) sl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-stage]'); if (!b || !api) return;
      var s = STAGES[+b.dataset.stage]; api.setProgress(s.key === 'landscape' ? 0.93 : s.p[1] - 0.001, true);
      $$('[data-stage]', sl).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    });
  } else {
    addEventListener('scroll', readScroll, { passive: true });
  }
  readScroll();
  var tier = gpu();
  if (tier < 2) fail(); else start3d();
})();
