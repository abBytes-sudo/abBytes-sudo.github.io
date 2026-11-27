/* Taradhura home: the ridge at the real hour.
   The hero opens at the time it is on the ridge now (IST), under that day's sun and moon, and scrolling runs a whole day round
   from there. Your dates (the strip above the hour rail, shared with the booking bar and the booking page) carry the ridge to
   their season, and at dusk the thirteen cottage windows show which rooms are free for them: choose one and the booking opens
   with that room. The 3D ridge (assets/resort3d.js) loads after first paint over a poster frame of the same hour. */
(function () {
  'use strict';
  var TD = window.TD, ui = TD.ui, $ = ui.$, $$ = ui.$$, D = TD.date, SKY = TD.sky, esc = ui.esc;
  var reduce = ui.reduce;

  // ---------- content blocks ----------
  var cots = $('#cots'); if (cots) cots.innerHTML = TD.types.map(ui.keyCard).join('');
  var dc = $('#day-cards');
  if (dc) dc.innerHTML = TD.experiences.map(function (e) {
    return '<article class="day-card"><figure>' + ui.photo(e.photo, e.name, '(max-width:900px) 78vw, 30vw') + '</figure><div class="t"><span>' + e.slots.join(' · ') + '</span><span>' + e.dur + ' · ' + TD.inr(e.price) + '</span></div><h3>' + esc(e.name) + '</h3><p>' + esc(e.line) + '</p></article>';
  }).join('');
  var jl = $('#jl');
  if (jl) jl.innerHTML = TD.posts.slice(0, 3).map(function (p) {
    return '<a class="jc" href="journal.html?post=' + p.id + '"><figure>' + ui.photo(p.photo, '', '(max-width:900px) 100vw, 33vw') + '</figure><p class="kicker">' + esc(p.kicker) + ' · ' + p.read + ' min</p><h3>' + esc(p.title) + '</h3><p>' + esc(p.dek) + '</p></a>';
  }).join('');

  // ---------- the day ----------
  var dn = $('#dn'); if (!dn) return;
  var NOW = SKY.now(), today = NOW.iso;
  var chapters = $$('.dn-ch', dn), railBox = $('#rail'), rail = $$('#rail button'), clk = $('#clk'), clkNow = $('#clk-now'), clkS = $('#clk-s'), sunEl = $('#sun'), title = $('#dn-title'), hint = $('#hint');
  var copy = $('#dn-copy'), clock = $('.dn-clock'), hsBox = $('#dn-hs'), card = $('#room-card'), moonLine = $('#moon-line');
  var LABELS = chapters.map(function (c) { var k = c.querySelector('.kicker'); return k ? k.textContent.split(' · ').slice(1).join(' · ') : ''; });
  var clamp01 = function (x) { return Math.max(0, Math.min(1, x)); };

  // ---------- your dates: shared with the booking bar below and the booking page (sessionStorage 'td:draft') ----------
  var dates = (function () {
    var d = null; try { d = JSON.parse(sessionStorage.getItem('td:draft') || 'null'); } catch (e) {}
    if (d && d.in && d.in >= today && d.out > d.in) return { in: d.in, out: d.out, ad: d.adults || 2, picked: true };
    return { in: today, out: D.add(today, 1), ad: 2, picked: false };
  })();
  function saveDates() { try { var d = JSON.parse(sessionStorage.getItem('td:draft') || 'null') || {}; d.in = dates.in; d.out = dates.out; d.adults = dates.ad; sessionStorage.setItem('td:draft', JSON.stringify(d)); } catch (e) {} }
  // the ridge previews your arrival once you have chosen dates; until then it is today on the ridge
  function sceneIso() { return dates.picked ? dates.in : today; }
  function when() { return dates.picked ? 'for your dates' : 'tonight'; }

  // ---------- the hours: chapters follow the date's sun; scroll runs the day round from now ----------
  var S, A, W = [0.08, 0.12, 0.13, 0.13, 0.14, 0.18, 0.22], CUM = [], w0 = 0, c0 = 0;
  for (var i = 0, c = 0; i < W.length; i++) { CUM.push(c); c += W[i]; }
  function chOf(h) { h = ((h % 24) + 24) % 24; for (var i = 6; i >= 0; i--) if (h >= A[i]) return i; return 6; }
  function span(i) { return [A[i], i < 6 ? A[i + 1] : A[0] + 24]; }
  function wOf(h) { h = ((h % 24) + 24) % 24; var i = chOf(h), s = span(i); if (i === 6 && h < A[0]) h += 24; return CUM[i] + W[i] * (h - s[0]) / (s[1] - s[0]); }
  function hourAtW(w) { w = ((w % 1) + 1) % 1; var i = 6; while (i > 0 && w < CUM[i]) i--; var s = span(i); return (((s[0] + (w - CUM[i]) / W[i] * (s[1] - s[0])) % 24) + 24) % 24; }
  // the first stretch of scroll holds the hour it is now, under the name; the day runs round after it
  var P0 = 0.06;
  function hourAt(p) { return p <= P0 ? NOW.h : hourAtW(w0 + (p - P0) / (1 - P0) * 0.9999); }
  function railRange(i) { var s = i === c0 ? CUM[i] - w0 : (((CUM[i] - w0) % 1) + 1) % 1; return [P0 + s * (1 - P0), P0 + (s + W[i]) * (1 - P0)]; }
  function setHours() {
    S = SKY.sun(sceneIso());
    A = [S.rise - 65 / 60, S.rise - 22 / 60, S.rise + 2.25, 13, S.set - 4 / 60, S.set + 66 / 60, Math.max(S.set + 4, 21.5)];
    chapters.forEach(function (ch, i) { var k = ch.querySelector('.kicker'); if (k) k.textContent = SKY.hm(A[i]) + ' · ' + LABELS[i]; ch.dataset.h = A[i].toFixed(3); });
    rail.forEach(function (b) { b.querySelector('b').textContent = SKY.hm(A[+b.dataset.i]); });
    w0 = wOf(NOW.h); c0 = chOf(NOW.h);
    // the rail starts at the hour it is now
    for (var k = 0; k < 7; k++) railBox.appendChild(rail[(c0 + k) % 7]);
    if (moonLine) moonLine.textContent = moonText();
    showClock();
  }
  function moonText() {
    var iso = sceneIso(), m = SKY.moon(iso, A[6]), pct = Math.round(m.fraction * 100), name = SKY.phaseName(m.phase);
    var lead = dates.picked ? ' On your first night the moon is ' : ' Tonight the moon is ';
    if (m.fraction < 0.03) return dates.picked ? ' Your first night has no moon: the darkest sky of the month.' : ' No moon tonight: the darkest sky of the month.';
    var rise = null; if (m.alt <= 0) for (var h = A[6]; h < A[6] + 10; h += 0.25) { if (SKY.moon(iso, h).alt > 0) { rise = h; break; } }
    return lead + (name === 'full' ? 'full' : 'a ' + name + ', ' + pct + '% lit') + (m.alt > 0 ? ', already up over the range.' : rise != null ? ', rising at ' + SKY.hm(rise) + '.' : ', below the hills until morning.');
  }
  function showClock() {
    clkNow.textContent = 'It is ' + SKY.hm(SKY.now().h) + ' on the ridge.';
    clkS.textContent = (dates.picked ? D.fmt(sceneIso()) + ': sunrise ' : 'Sunrise ') + SKY.hm(S.rise) + ' · sunset ' + SKY.hm(S.set);
  }

  var api = null, cur = NOW.h, curP = 0, tgtP = 0, chIx = -1, visible = true, started = true;
  function progress() { var r = dn.getBoundingClientRect(); var sp = r.height - innerHeight; return sp > 0 ? clamp01(-r.top / sp) : 0; }

  function paint(p, h) {
    clk.textContent = SKY.hm(h);
    var day = h >= S.rise && h <= S.set, t = day ? (h - S.rise) / (S.set - S.rise) : 0;
    if (day) { sunEl.setAttribute('cx', (6 + t * 138).toFixed(1)); sunEl.setAttribute('cy', (54 - Math.sin(t * Math.PI) * 36).toFixed(1)); sunEl.style.fill = ''; }
    else { var since = ((h - S.set) % 24 + 24) % 24, tn = Math.min(1, since / 6); sunEl.setAttribute('cx', (144 - tn * 60).toFixed(1)); sunEl.setAttribute('cy', (54 - Math.sin(tn * Math.PI * .5) * 30).toFixed(1)); sunEl.style.fill = '#ECE6DA'; }
    var ix = chOf(h);
    if (ix !== chIx) {
      chapters.forEach(function (ch, i) { ch.classList.toggle('on', i === ix); });
      rail.forEach(function (b) { var on = +b.dataset.i === ix; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      chIx = ix; if ((ix === 5 || ix === 4) && started) wantRooms(); if (ix !== 5) { unhover(); }
    }
    rail.forEach(function (b) { var r = railRange(+b.dataset.i); b.style.setProperty('--p', (clamp01((p - r[0]) / (r[1] - r[0])) * 100).toFixed(1) + '%'); });
    var tOp = Math.max(0, 1 - p * 24); title.style.opacity = tOp; title.style.transform = 'translateY(' + (-p * 600).toFixed(1) + 'px)'; title.style.visibility = tOp ? '' : 'hidden';
    hint.style.opacity = p > 0.015 ? 0 : 1;
    copy.classList.toggle('wait', p < 0.05); clock.classList.toggle('wait', p < 0.05);
  }

  var lastPaint = -1, raf = 0;
  function tick() {
    raf = requestAnimationFrame(tick);
    if (!visible) return;
    tgtP = progress();
    curP += (tgtP - curP) * (reduce ? 1 : 0.14);
    if (Math.abs(tgtP - curP) < 0.0002) curP = tgtP;
    if (api && chIx === 5) place();
    if (curP === lastPaint) return;
    lastPaint = curP;
    cur = hourAt(curP);
    paint(curP, cur);
    if (api) api.set(cur, curP);
  }

  // rail: jump to an hour
  rail.forEach(function (b) {
    b.addEventListener('click', function () {
      var i = +b.dataset.i, r = dn.getBoundingClientRect(), top = scrollY + r.top, sp = r.height - innerHeight;
      var target = top + sp * (i === c0 ? 0 : railRange(i)[0] + 0.006);
      if (window.Motion && Motion.lenis) Motion.lenis.scrollTo(target, { duration: 1.6 }); else scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  // ---------- the thirteen windows: rooms free or taken for your dates ----------
  var avail = null, hov = null, sel = null, rowsBuilt = false, roomsTimer = 0;
  var IDS = TD.allRooms.map(function (r) { return r.id; });           // D1 … S1, the same order as the 3D windows
  function typeOf(id) { var r = TD.allRooms.filter(function (x) { return x.id === id; })[0]; return TD.type(r.type); }
  function wantRooms() { if (avail || roomsTimer) return; roomsTimer = ('requestIdleCallback' in window) ? requestIdleCallback(computeRooms, { timeout: 700 }) : setTimeout(computeRooms, 60); }
  function computeRooms() {
    roomsTimer = 0;
    var taken = {};
    TD.types.forEach(function (t) { var free = TD.freeRooms(t.id, dates.in, dates.out); t.rooms.forEach(function (r) { taken[r] = free.indexOf(r) < 0; }); });
    var price = {}; TD.types.forEach(function (t) { price[t.id] = TD.nightly(t.id, dates.in); });
    avail = { taken: IDS.map(function (r) { return taken[r]; }), price: price };
    avail.free = avail.taken.filter(function (x) { return !x; }).length;
    renderRooms(); push3d();
  }
  function hiArr() { return IDS.map(function (r) { return r === sel ? 1 : r === hov ? 0.5 : 0; }); }
  function push3d() { if (api && avail) api.rooms({ on: true, taken: avail.taken, hi: hiArr(), dim: !!sel }); }
  function isTaken(r) { return avail.taken[IDS.indexOf(r)]; }
  function renderRooms() {
    var nT = 13 - avail.free, w = when();
    var line = avail.free === 0 ? 'Every room is taken ' + w + '. Try a night either side.' : nT === 0 ? 'All thirteen windows are dark ' + w + '. Choose one.' :
      nT + (nT === 1 ? ' room' : ' rooms') + ' taken ' + w + '. ' + avail.free + (avail.free === 1 ? ' window' : ' windows') + ' dark. Choose one.';
    $$('.rooms-line', dn).forEach(function (p) { p.textContent = line; });
    var html = TD.types.map(function (t) {
      return '<span class="rg">' + t.rooms.map(function (r) {
        var tk = isTaken(r);
        return '<button type="button" class="rw ' + (tk ? 'taken' : 'free') + (sel === r ? ' sel' : '') + '" data-r="' + r + '" aria-label="' + esc(t.name + ' ' + r + (tk ? ', taken ' : ', free ') + w) + '"' + (tk ? ' aria-disabled="true"' : '') + (sel === r ? ' aria-pressed="true"' : '') + '><i aria-hidden="true"></i>' + r + '</button>';
      }).join('') + '</span>';
    }).join('');
    $$('[data-rooms]', dn).forEach(function (box) { box.innerHTML = html; box.classList.toggle('dim', !!sel); });
    if (!rowsBuilt) { rowsBuilt = true; $$('[data-rooms]', dn).forEach(wireRow); buildHotspots(); }
  }
  function wireRow(box) {
    box.addEventListener('pointerover', function (e) { var b = e.target.closest('.rw'); if (b) hover(b.dataset.r, b); });
    box.addEventListener('pointerleave', function () { unhover(); });
    box.addEventListener('focusin', function (e) { var b = e.target.closest('.rw'); if (b) hover(b.dataset.r, b); });
    box.addEventListener('focusout', function () { unhover(); });
    box.addEventListener('click', function (e) { var b = e.target.closest('.rw'); if (b) choose(b.dataset.r, b); });
  }
  // over the canvas: a hotspot on each room's windows (pointer only; the row of buttons is the keyboard way in)
  var hs = [];
  function buildHotspots() {
    if (!hsBox) return;
    hsBox.innerHTML = IDS.map(function (r) { return '<div class="hs" data-r="' + r + '"></div>'; }).join('');
    hs = $$('.hs', hsBox);
    hs.forEach(function (el) {
      el.addEventListener('pointerenter', function () { hover(el.dataset.r, el); });
      el.addEventListener('pointerleave', function () { unhover(); });
      el.addEventListener('click', function () { choose(el.dataset.r, el); });
    });
  }
  var fine = matchMedia('(pointer: fine)').matches;
  function place() {
    if (!hs.length || !avail) return;
    var show = fine && innerWidth >= 900 && dn.classList.contains('live');
    hsBox.style.display = show ? '' : 'none'; if (!show) return;
    var sc = api.screen;
    hs.forEach(function (el, i) {
      var v = sc[i * 3 + 2] > 0; el.style.display = v ? '' : 'none';
      if (v) el.style.transform = 'translate(' + sc[i * 3].toFixed(0) + 'px,' + sc[i * 3 + 1].toFixed(0) + 'px)';
      el.className = 'hs ' + (isTaken(el.dataset.r) ? 'taken' : 'free') + (el.dataset.r === hov ? ' hov' : '');
    });
  }
  function hover(r, el) {
    if (!avail || sel) return;
    hov = r; push3d();
    $$('.rw', dn).forEach(function (b) { b.classList.toggle('hov', b.dataset.r === r); });
    var t = typeOf(r), tk = isTaken(r);
    card.innerHTML = '<b>' + esc(t.name + ' ' + r) + '</b> ' + (tk ? 'Taken ' + when() + '.' : 'Free ' + when() + ' · <span class="p">' + TD.inr(avail.price[t.id]) + '</span> a night');
    showCard(el);
  }
  function unhover() { if (sel || hov == null) return; hov = null; push3d(); $$('.rw.hov', dn).forEach(function (b) { b.classList.remove('hov'); }); card.classList.remove('on'); }
  function showCard(el) {
    // the static fallback (reduced motion, no WebGL) has its row below the picture: the note under it carries the words
    if (dn.classList.contains('static') || !el.closest('.dn-stage')) { var note = $('.dn-sr .rooms-note', dn); if (note) note.innerHTML = card.innerHTML; return; }
    var st = dn.querySelector('.dn-stage').getBoundingClientRect(), r = el.getBoundingClientRect();
    card.classList.add('on');
    var cw = card.offsetWidth, ch = card.offsetHeight;
    var x = Math.max(12, Math.min(st.width - cw - 12, r.left - st.left + r.width / 2 - cw / 2));
    // under a button in the row (so the heading stays readable); above a window on the hill
    var y = el.classList.contains('rw') ? r.bottom - st.top + 10 : r.top - st.top - ch - 12; if (y < 70) y = r.bottom - st.top + 12;
    card.style.left = x.toFixed(0) + 'px'; card.style.top = y.toFixed(0) + 'px';
  }
  function choose(r, el) {
    if (!avail || sel) return;
    var t = typeOf(r);
    if (isTaken(r)) {
      var alt = t.rooms.filter(function (x) { return !isTaken(x); });
      if (!alt.length) alt = IDS.filter(function (x) { return !isTaken(x); }).slice(0, 3);
      card.innerHTML = '<b>' + esc(t.name + ' ' + r) + '</b> Taken ' + when() + '.' + (alt.length ? ' Dark windows: ' + alt.join(', ') + '.' : ' Try a night either side.');
      showCard(el); return;
    }
    sel = r; hov = null; push3d(); renderRooms();
    var n = D.diff(dates.in, dates.out);
    card.innerHTML = '<b>' + esc(t.name + ' ' + r) + ' is yours to book</b> ' + D.fmt(dates.in, { weekday: 'short' }) + ' to ' + D.fmt(dates.out, { weekday: 'short' }) + ' · ' + TD.nights(n) + ' · opening the booking…';
    showCard(el);
    var url = 'book.html?type=' + t.id + '&room=' + r + '&in=' + dates.in + '&out=' + dates.out + '&ad=' + dates.ad;
    setTimeout(function () { location.href = url; }, reduce ? 150 : 1100);
  }
  // returning to the page with the back button: let the windows be chosen again
  addEventListener('pageshow', function (e) { if (e.persisted && sel) { sel = null; card.classList.remove('on'); if (avail) { renderRooms(); push3d(); } } });

  // ---------- the dates strip ----------
  var ddOpen = $('#dd-open'), ddPop = $('#dd-pop'), ddIn = $('#dd-in'), ddOut = $('#dd-out'), ddAd = $('#dd-ad'), ddV = $('#dd-v'), ddNote = $('#dd-note');
  function day(iso, month) { return D.fmt(iso, { weekday: 'short', month: month ? 'short' : undefined }).replace(',', ''); }
  function range(a, b) { return day(a, a.slice(5, 7) !== b.slice(5, 7)) + ' – ' + day(b, true); }
  function showDates() {
    ddV.textContent = dates.picked ? range(dates.in, dates.out) + ' · ' + dates.ad + (dates.ad === 1 ? ' guest' : ' guests') : 'Tonight';
    ddNote.textContent = SKY.note(sceneIso());
  }
  function openPop(open) {
    ddPop.hidden = !open; ddOpen.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open) return;
    var a = dates.picked ? dates.in : D.add(today, 14), b = dates.picked ? dates.out : D.add(today, 16);
    ddIn.min = today; ddIn.value = a; ddOut.min = D.add(a, 1); ddOut.value = b; ddAd.value = String(dates.ad);
    ddIn.focus();
  }
  ddOpen.addEventListener('click', function () { openPop(ddPop.hidden); });
  ddIn.addEventListener('change', function () { if (!ddIn.value) return; ddOut.min = D.add(ddIn.value, 1); if (!ddOut.value || ddOut.value <= ddIn.value) ddOut.value = D.add(ddIn.value, 2); });
  ddPop.addEventListener('keydown', function (e) { if (e.key === 'Escape') { openPop(false); ddOpen.focus(); } });
  document.addEventListener('pointerdown', function (e) { if (!ddPop.hidden && !e.target.closest('#dn-dates')) openPop(false); });
  ddPop.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!ddIn.value || !ddOut.value || ddOut.value <= ddIn.value || ddIn.value < today) { ui.toast('Pick an arrival from today and a later departure.'); (ddIn.value ? ddOut : ddIn).focus(); return; }
    setDates(ddIn.value, ddOut.value, +ddAd.value);
    openPop(false); ddOpen.focus();
  });
  function setDates(a, b, ad) {
    dates = { in: a, out: b, ad: ad || dates.ad, picked: true };
    saveDates(); syncBar(); setHours(); showDates(); lastPaint = -1;
    if (api) { api.sky(skyOpts()); api.season(SKY.season(sceneIso())); }
    avail = null; sel = null; hov = null; card.classList.remove('on'); computeRooms();
  }
  // the booking bar below the hero holds the same dates
  var qi = $('#q-in'), qo = $('#q-out'), qa = $('#q-ad');
  function syncBar() { if (!qi) return; qi.value = dates.in; qo.min = D.add(dates.in, 1); qo.value = dates.out; if (qa) qa.value = String(Math.min(6, dates.ad)); }
  if (qi) {
    if (dates.picked) syncBar();
    var barT = 0;
    [qi, qo, qa].forEach(function (el) { el && el.addEventListener('change', function () { clearTimeout(barT); barT = setTimeout(function () { if (qi.value && qo.value && qo.value > qi.value && qi.value >= today) setDates(qi.value, qo.value, +qa.value); }, 250); }); });
  }

  function skyOpts() { var iso = sceneIso(); return { rise: S.rise, set: S.set, moon: function (h) { return SKY.moon(iso, h); } }; }

  setHours(); showDates();
  setInterval(showClock, 30000);

  // ---------- 3D: after first paint, only with WebGL, never under reduced motion ----------
  function hasGL() { try { var cv = document.createElement('canvas'); return !!(cv.getContext('webgl2') || cv.getContext('webgl')); } catch (e) { return false; } }
  function still() { dn.classList.add('static'); paint(0, NOW.h); var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 300); }; idle(computeRooms); }
  if (reduce || !hasGL()) { still(); return; }
  raf = requestAnimationFrame(tick);

  function load3d() {
    var s = document.createElement('script'); s.src = '../assets/resort3d.js?v=15'; s.async = true;
    s.onload = function () {
      try {
        api = window.Resort3D.mount($('#land'), { portrait: innerWidth < innerHeight, hour: cur, season: SKY.season(sceneIso()), sky: skyOpts() });
        api.set(cur); lastPaint = -1; push3d();
        if (visible) api.start();
        requestAnimationFrame(function () { dn.classList.add('live'); });
        wantRooms();
      } catch (e) { still(); }
    };
    document.head.appendChild(s);
  }
  // the 3D starts on the first sign of a person (pointer, touch, key, scroll); until then the poster is the same frame
  started = false; var EV = ['pointermove', 'pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll'];
  function go() { if (started) return; started = true; EV.forEach(function (e) { removeEventListener(e, go); }); ('requestIdleCallback' in window) ? requestIdleCallback(load3d, { timeout: 400 }) : setTimeout(load3d, 50); }
  EV.forEach(function (e) { addEventListener(e, go, { passive: true }); });
  if (scrollY > 40) go();

  // pause when the hero is off screen or the tab is hidden
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (!api) return; if (visible && !document.hidden) api.start(); else api.stop(); }, { rootMargin: '100px' }).observe(dn);
  document.addEventListener('visibilitychange', function () { if (!api) return; if (document.hidden) api.stop(); else if (visible) api.start(); });
  // a gentle look-around with the pointer
  if (fine) addEventListener('pointermove', function (e) { if (api) api.pointer(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); }, { passive: true });
})();
