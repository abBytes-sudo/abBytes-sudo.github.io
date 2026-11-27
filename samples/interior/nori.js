/* Atelier Nori · the page around the wall: header, reveals, the sample tray, the limewash chart,
   a first number, and the consultation that lands on the studio desk (studio.html). */
(function () {
  'use strict';
  var W = window, doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); }, $$ = function (s, c) { return [].slice.call((c || doc).querySelectorAll(s)); };
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add('js');
  /* the web fonts are asked for without holding up the first paint */
  var gf = doc.querySelector('link[data-fonts]'); if (gf) { if (gf.sheet) gf.media = 'all'; else gf.addEventListener('load', function () { gf.media = 'all'; }); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function R(n) { return n >= 1e7 ? '₹' + (n / 1e7).toFixed(2).replace(/\.?0+$/, '') + ' Cr' : n >= 1e5 ? '₹' + (n / 1e5).toFixed(1).replace(/\.0$/, '') + ' L' : '₹' + n.toLocaleString('en-IN'); }
  function wall() { return W.Wall || {}; }

  /* ---------- header ---------- */
  var hd = $('#hd'), mb = $('.mb'), mn = $('#mn'), lastY = 0, darks = $$('.r-tea,.you.dark,.rp-dark');
  function onScroll() {
    var y = W.scrollY || 0, down = y > lastY + 2, up = y < lastY - 2;
    if (hd) { if (y < 90) { hd.classList.remove('away', 'bar'); } else if (down && y > 320) hd.classList.add('away'); else if (up) { hd.classList.remove('away'); hd.classList.add('bar'); }
      var lit = false; darks.forEach(function (d) { var r = d.getBoundingClientRect(); if (r.top < 60 && r.bottom > 60) lit = true; }); hd.classList.toggle('lit', lit); }
    lastY = y;
  }
  W.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  function menu(open) { if (!mn) return; mn.hidden = !open; mb.setAttribute('aria-expanded', open ? 'true' : 'false'); if (hd) hd.classList.toggle('open', open); root.classList.toggle('menu-open', open); doc.body.style.overflow = open ? 'hidden' : ''; if (wall().lenis) { if (open) wall().lenis.stop(); else wall().lenis.start(); } }
  if (mb) mb.addEventListener('click', function () { menu(mn.hidden); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mn && !mn.hidden) { menu(false); mb.focus(); } });
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return; var id = a.getAttribute('href'); if (id.length < 2) return; var t = $(id); if (!t) return;
    e.preventDefault(); menu(false); var L = wall().lenis; if (L) L.scrollTo(t, { offset: id === '#top' ? -200 : -10, duration: 1.4 }); else t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (history.replaceState) history.replaceState(null, '', id); if (t.tabIndex < 0 && !/^(A|BUTTON|INPUT)$/.test(t.tagName)) t.setAttribute('tabindex', '-1'); setTimeout(function () { t.focus({ preventScroll: true }); }, 900);
  });

  /* ---------- reveals ---------- */
  var rv = $$('.rv');
  if ('IntersectionObserver' in W) { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -13% 0px', threshold: .12 }), late = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); late.unobserve(e.target); } }); }, { rootMargin: '0px 0px -27% 0px', threshold: .05 });
    /* in the dark room and on the last wall the paint goes on first, then the words */
    rv.forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 70 + 'ms'; (el.closest('.r-tea,.rp-dark .rp-hero,.you-t') ? late : io).observe(el); }); }
  else rv.forEach(function (el) { el.classList.add('in'); });

  /* ---------- the afternoon: a pinned frame the light crosses ---------- */
  var wetn = $('#wetn'), n3 = $('#n3');
  if (wetn && !fine) wetn.textContent = 'The plaster is still wet. Press it with your thumb.';
  if (n3 && !fine) n3.textContent = 'the lamp comes down the wall with you';
  doc.addEventListener('wall:mark', function () { if (!wetn) return; setTimeout(function () { wetn.style.opacity = 0; setTimeout(function () { wetn.textContent = 'It trowels itself out in a minute.'; wetn.style.opacity = 1; }, 600); }, 1400); });
  var aft = $('.aft'), stick = $('.aft-s');
  if (aft && stick) (function () {
    var datum = $('#datum'), nowEl = $('#now'), hr = $('#hr'), beats = $$('.beat', aft), sk = $('#sketch'), paths = sk ? $$('path[pathLength]', sk) : [];
    var K = null, ticks = [], geo = { w: 0 }, last = -9, lastHr = '', pinned = false, live = false, scrubbing = false, cord = sk ? $('.sk-cord', sk) : null;
    function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
    function at(P, p) { var n = P.length, i = 0; if (p <= P[0]) return [0, 0, 0]; if (p >= P[n - 1]) return [n - 1, n - 1, 0]; while (i < n - 2 && p > P[i + 1]) i++; return [i, i + 1, (p - P[i]) / (P[i + 1] - P[i])]; }
    function kv(a, k) { return a[k[0]] + (a[k[1]] - a[k[0]]) * k[2]; }
    function clock(h) { var hh = Math.floor(h), mm = Math.round((h - hh) * 12) * 5; if (mm === 60) { hh++; mm = 0; } return (hh > 12 ? hh - 12 : hh) + ':' + (mm < 10 ? '0' : '') + mm + ' pm'; }
    /* where the light's left edge crosses the datum line, in px from the line's own left end */
    function edge(p) { var k = at(K.p, p); return kv(K.L.x, k) * geo.vw + kv(K.L.sh, k) * (geo.yd - kv(K.L.y, k) * geo.vh) - geo.x0; }
    function pOf(h) { var H = K.hour, P = K.p, i; if (h <= H[0]) return P[0]; for (i = 0; i < H.length - 1; i++) if (h <= H[i + 1]) return P[i] + (P[i + 1] - P[i]) * (h - H[i]) / (H[i + 1] - H[i]); return P[P.length - 1]; }
    function layout() {
      pinned = getComputedStyle(stick).position === 'sticky';
      var raw = (root.clientWidth < 720 && aft.getAttribute('data-keys-m')) || aft.getAttribute('data-keys'); try { K = JSON.parse(raw); } catch (e) { K = null; }
      ticks.forEach(function (t) { datum.removeChild(t.el); }); ticks = []; if (!K || !datum) return;
      geo = { vw: root.clientWidth, vh: W.innerHeight, yd: datum.offsetTop, x0: datum.offsetLeft, w: datum.offsetWidth };
      /* the lamp's cord hangs from the datum line */
      if (cord && sk) { var r = sk.getBoundingClientRect(), b = stick.getBoundingClientRect(), sc = r.width / 520; if (sc > 0) cord.setAttribute('d', 'M423 ' + (pinned ? -(r.top - b.top - geo.yd) / sc : -46).toFixed(1) + 'L423.4 84'); }
      [14.5, 15, 15.5, 16, 16.5, 17, 17.5].forEach(function (h) { var p = pOf(h), x = edge(p); if (x < 14 || x > geo.w - 14) return; var el = doc.createElement('i'); el.className = 'tk'; el.setAttribute('aria-hidden', 'true'); el.style.setProperty('--x', x.toFixed(1) + 'px');
        el.innerHTML = '<b>' + (Math.floor(h) - 12) + (h % 1 ? '.30' : '') + '</b>'; datum.appendChild(el); ticks.push({ el: el, p: p }); });
      last = -9;
    }
    function span() { return { top: aft.getBoundingClientRect().top + (W.scrollY || 0), len: aft.offsetHeight - stick.offsetHeight }; }
    function prog() { var wl = wall(); if (wl.on && typeof wl.pe === 'number') return wl.pe; if (!pinned) return 0; var s = span(); return s.len > 0 ? cl(((W.scrollY || 0) - s.top) / s.len, 0, 1) : 0; }
    function draw(p) {
      if (!K) return;
      var x = cl(edge(p), 0, geo.w); nowEl.style.setProperty('--x', x.toFixed(1) + 'px'); nowEl.classList.toggle('flip', x > geo.w * .64);
      var h = clock(kv(K.hour, at(K.p, p))); if (h !== lastHr) { lastHr = h; hr.textContent = h; nowEl.setAttribute('aria-valuetext', h); }
      nowEl.setAttribute('aria-valuenow', Math.round(cl(p, 0, 1) * 100));
      ticks.forEach(function (t) { t.el.classList.toggle('on', p >= t.p - .004); });
      if (!pinned) return;
      var bi = p < .15 ? 0 : p < .42 ? 1 : p < .75 ? 2 : 3; beats.forEach(function (b, i) { b.classList.toggle('on', i === bi); }); stick.classList.toggle('k2', bi >= 2); stick.classList.toggle('moved', p > .03);
      var q = cl((p - .4) / .3, 0, 1), n = paths.length; paths.forEach(function (el, i) { el.style.setProperty('--o', (1.08 * (1 - cl((q - i / (n + 3)) / (4 / (n + 3)), 0, 1))).toFixed(3)); });
      if (sk) sk.style.setProperty('--t', q > .9 ? 1 : 0);
    }
    function tick() { if (!live) return; requestAnimationFrame(tick); var p = prog(); if (Math.abs(p - last) > .0005) { last = p; draw(p); } }
    /* the marks are there from the first paint; when the wall wakes at the top of the page it replays the afternoon and they are made again in order */
    layout(); draw(prog()); stick.classList.add('ready'); live = true; tick();
    doc.addEventListener('wall:on', function () { layout(); });
    var rz; W.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(layout, 160); });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(layout); if (doc.fonts && doc.fonts.addEventListener) doc.fonts.addEventListener('loadingdone', layout);
    if ('IntersectionObserver' in W) new IntersectionObserver(function (es) { var on = es[0].isIntersecting; if (on && !live) { live = true; tick(); } else if (!on) live = false; }).observe(aft);
    /* the pin on the line is a slider: drag it, or use the arrow keys, and the page scrolls to that hour */
    function scrub(p) { var s = span(), y = s.top + cl(p, 0, 1) * s.len, L = wall().lenis; if (L) L.scrollTo(y, { immediate: true, force: true }); else W.scrollTo(0, y); }
    function toP(cx) { var x = cx - geo.x0, lo = 0, hi = 1, i, m; for (i = 0; i < 22; i++) { m = (lo + hi) / 2; if (edge(m) > x) lo = m; else hi = m; } return (lo + hi) / 2; }
    if (nowEl) {
      nowEl.addEventListener('pointerdown', function (e) { if (!pinned || e.button > 0) return; scrubbing = true; root.classList.add('scrub'); try { nowEl.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); });
      nowEl.addEventListener('pointermove', function (e) { if (scrubbing) scrub(toP(e.clientX)); });
      var up = function () { scrubbing = false; root.classList.remove('scrub'); }; nowEl.addEventListener('pointerup', up); nowEl.addEventListener('pointercancel', up);
      nowEl.addEventListener('keydown', function (e) { if (!pinned) return; var d = { ArrowRight: .06, ArrowUp: .06, ArrowLeft: -.06, ArrowDown: -.06, PageUp: .2, PageDown: -.2 }[e.key], p = cl(prog(), 0, 1); if (e.key === 'Home') p = 0; else if (e.key === 'End') p = 1; else if (d) p += d; else return; e.preventDefault(); scrub(p); });
    }
  })();

  /* ---------- the table: samples you can move and keep ---------- */
  var tray = $('#tray'), state = store('nori-table') || { pos: {}, keep: [], wall: null }, NAMES = {};
  function grid() { return W.innerWidth <= 760; }
  function save() { store('nori-table', state); carry(); }
  if (tray) {
    var smps = $$('.smp', tray);
    smps.forEach(function (b) { var id = b.getAttribute('data-id'); NAMES[id] = $('b', b).textContent; b.setAttribute('aria-pressed', state.keep.indexOf(id) > -1 ? 'true' : 'false'); b.setAttribute('data-depth', '7');
      if (state.pos[id]) { b.style.setProperty('--x', state.pos[id][0]); b.style.setProperty('--y', state.pos[id][1]); } });
    var dg = null;
    function place(b, x, y) { var id = b.getAttribute('data-id'), mx = 100 - parseFloat(getComputedStyle(b).getPropertyValue('--w')), my = 100 - parseFloat(getComputedStyle(b).getPropertyValue('--h')) - 8; x = Math.max(0, Math.min(mx, x)); y = Math.max(0, Math.min(my, y)); b.style.setProperty('--x', x.toFixed(2)); b.style.setProperty('--y', y.toFixed(2)); state.pos[id] = [+x.toFixed(2), +y.toFixed(2)]; }
    tray.addEventListener('pointerdown', function (e) { var b = e.target.closest('.smp'); if (!b || grid() || e.button > 0) return; try { b.setPointerCapture(e.pointerId); } catch (x) {}
      var cs = getComputedStyle(b); dg = { b: b, px: e.clientX, py: e.clientY, x: parseFloat(cs.getPropertyValue('--x')), y: parseFloat(cs.getPropertyValue('--y')), moved: false }; });
    tray.addEventListener('pointermove', function (e) { if (!dg) return; var dx = e.clientX - dg.px, dy = e.clientY - dg.py; if (!dg.moved && Math.hypot(dx, dy) < 5) return; if (!dg.moved) { dg.moved = true; tray.appendChild(dg.b); try { dg.b.setPointerCapture(e.pointerId); } catch (x) {} dg.b.setAttribute('data-depth', '20'); if (wall().refresh) wall().refresh(); } place(dg.b, dg.x + dx / tray.offsetWidth * 100, dg.y + dy / tray.offsetHeight * 100); });
    var end = function () { if (!dg) return; var b = dg.b; b.setAttribute('data-depth', '7'); b._moved = dg.moved; dg = null; if (wall().refresh) wall().refresh(); save(); };
    tray.addEventListener('pointerup', end); tray.addEventListener('pointercancel', end);
    tray.addEventListener('click', function (e) { var b = e.target.closest('.smp'); if (!b) return; if (b._moved) { b._moved = false; return; } var id = b.getAttribute('data-id'), i = state.keep.indexOf(id); if (i > -1) state.keep.splice(i, 1); else state.keep.push(id); b.setAttribute('aria-pressed', i > -1 ? 'false' : 'true'); save(); });
    tray.addEventListener('keydown', function (e) { var b = e.target.closest('.smp'); if (!b || grid()) return; var d = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }[e.key]; if (!d) return; e.preventDefault(); var cs = getComputedStyle(b); place(b, parseFloat(cs.getPropertyValue('--x')) + d[0], parseFloat(cs.getPropertyValue('--y')) + d[1]); save(); });
  }

  /* ---------- the limewash chart: choose the wall ---------- */
  var chart = $('#chart'), yours = $('#yours'), you = $('#you'), ft = $('.ft'), board = $('.board');
  function lum(h) { h = h.replace('#', ''); var r = parseInt(h.substr(0, 2), 16) / 255, g = parseInt(h.substr(2, 2), 16) / 255, b = parseInt(h.substr(4, 2), 16) / 255; return .2126 * r + .7152 * g + .0722 * b; }
  function setWall(c, n, quiet) {
    state.wall = { c: c, n: n }; var dark = lum(c) < .42;
    if (you) { you.classList.toggle('dark', dark); you.style.setProperty('--you', c); darks = $$('.r-tea,.you.dark,.rp-dark'); }
    if (ft) { ft.classList.toggle('dark', dark); ft.style.setProperty('--you', c); }
    if (wall().paint) wall().paint('#you', c); if (board) board.style.backgroundColor = c; if (!quiet && wall().board) wall().board(c);
    if (yours) yours.textContent = 'Your wall: ' + n.replace(/^N-\d+ /, '') + ', ' + n.split(' ')[0] + '.';
    $$('.chipc', chart).forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-c') === c ? 'true' : 'false'); });
    if (!quiet) save(); else carry();
  }
  if (chart) { chart.addEventListener('click', function (e) { var b = e.target.closest('.chipc'); if (b) setWall(b.getAttribute('data-c'), b.getAttribute('data-n')); });
    chart.addEventListener('keydown', function (e) { var bs = $$('.chipc', chart), i = bs.indexOf(doc.activeElement); if (i < 0) return; var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0; if (!d) return; e.preventDefault(); var n = bs[(i + d + bs.length) % bs.length]; n.focus(); n.click(); });
    if (state.wall) { var go = function () { setWall(state.wall.c, state.wall.n, true); if (wall().board) wall().board(state.wall.c); }; go(); doc.addEventListener('wall:on', go); } }
  function list(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function carry() { var el = $('#carry'); if (!el) return; var parts = []; if (state.wall) parts.push(state.wall.n.replace(/^N-\d+ /, '')); state.keep.forEach(function (id) { if (NAMES[id]) parts.push(NAMES[id].toLowerCase()); }); if (est.sent) parts.push('a first number of ' + est.sent);
    el.hidden = !parts.length; if (parts.length) el.textContent = 'You’re bringing ' + list(parts) + '. They’ll be on the table when you arrive.'; }

  /* ---------- a first number (the same rate card the front desk quotes from) ---------- */
  var RATE = { living: { n: 'Living room', typ: 280, r: { essential: [1400, 2200], considered: [2400, 3600], bespoke: [3800, 6000] }, wk: [6, 9], inc: 'layout, lit drawings, furniture, lighting and soft furnishings' },
    bedroom: { n: 'Bedroom', typ: 180, r: { essential: [1200, 1900], considered: [2000, 3200], bespoke: [3400, 5200] }, wk: [5, 8], inc: 'layout, wardrobes, bed and headboard, lighting and linen' },
    kitchen: { n: 'Kitchen and dining', typ: 160, r: { essential: [2600, 3800], considered: [4000, 6200], bespoke: [6500, 10000] }, wk: [7, 11], inc: 'joinery drawings, worktops, an appliance plan, lighting and the dining table' },
    bathroom: { n: 'Bathroom', typ: 60, r: { essential: [2200, 3200], considered: [3400, 5200], bespoke: [5600, 9000] }, wk: [4, 7], inc: 'waterproofing, stone and tile, fittings, vanity and lighting' },
    study: { n: 'Study', typ: 110, r: { essential: [1100, 1700], considered: [1800, 2800], bespoke: [3000, 4600] }, wk: [4, 6], inc: 'desk joinery, shelving, task lighting and acoustics' },
    home: { n: 'Whole home', typ: 1400, r: { essential: [1300, 2000], considered: [2200, 3400], bespoke: [3600, 5800] }, wk: [14, 22], inc: 'every room, kitchen and baths, a lighting plan, furniture and styling' } };
  var est = { sent: '' }, ef = $('#est');
  if (ef) {
    var eRoom = $('#e-room'), eSize = $('#e-size'), eOut = $('#e-out'), eWk = $('#e-wk'), eSo = $('#e-so'), eInc = $('#e-inc');
    var calc = function () { var k = RATE[eRoom.value], sz = +eSize.value, tier = ($('input[name="tier"]:checked', ef) || {}).value || 'considered', rt = k.r[tier], f = sz > k.typ * 2 ? .93 : sz < k.typ * .6 ? 1.08 : 1;
      est.lo = Math.round(sz * rt[0] * f / 5000) * 5000; est.hi = Math.round(sz * rt[1] * f / 5000) * 5000; est.room = eRoom.value; est.size = sz; est.tier = tier;
      var wk = [k.wk[0] + (tier === 'bespoke' ? 2 : 0), k.wk[1] + (tier === 'bespoke' ? 3 : tier === 'essential' ? -1 : 0)];
      eOut.textContent = R(est.lo) + ' – ' + R(est.hi); eWk.textContent = wk[0] + ' to ' + wk[1] + ' weeks on site'; eSo.textContent = sz.toLocaleString('en-IN') + ' sq ft'; eInc.textContent = 'Includes ' + k.inc + '.'; };
    eRoom.addEventListener('change', function () { var k = RATE[eRoom.value]; eSize.max = Math.round(k.typ * 2.6 / 10) * 10; eSize.min = Math.max(30, Math.round(k.typ * .35 / 10) * 10); eSize.value = k.typ; calc(); });
    ef.addEventListener('input', calc); calc();
    $('#e-go').addEventListener('click', function () { est.sent = eOut.textContent; var r = $('input[name="room"][value="' + est.room + '"]'); if (r) r.checked = true; carry(); sum(); var t = $('#book'), L = wall().lenis; if (L) L.scrollTo(t, { offset: -110, duration: 1.5 }); else t.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  }

  /* ---------- the consultation ---------- */
  var bf = $('#book'), SLOTS = ['10:30', '12:00', '16:00', '17:30'], MODE = { studio: ['At the studio', 75], home: ['At your home', 90], video: ['On a video call', 45] }, ROOMN = { living: 'Living room', kitchen: 'Kitchen and dining', bedroom: 'Bedroom', bathroom: 'Bathroom', study: 'Study', home: 'Whole home' };
  var DN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], DL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], ML = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function tl(t) { var h = +t.split(':')[0], m = t.split(':')[1]; return t === '12:00' ? '12 noon' : (h > 12 ? h - 12 : h) + ':' + m + (h >= 12 ? ' pm' : ' am'); }
  function booked() { try { return JSON.parse(localStorage.getItem('orbit-data-nori-bookings')) || []; } catch (e) { return []; } }
  function taken(d, t) { if (booked().some(function (b) { return b.date === d && b.time === t && b.status !== 'cancelled'; })) return true; var h = 0; (d + t).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) | 0; }); return Math.abs(h) % 3 === 0; }
  function val(n) { var e = $('input[name="' + n + '"]:checked', bf); return e ? e.value : ''; }
  function sum() { var el = $('#bk-sum'); if (!el || !bf) return; var p = [ROOMN[val('room')], MODE[val('mode')][0].toLowerCase()], d = val('day'), t = val('slot'); if (d) { var dt = new Date(d + 'T00:00'); p.push(DN[dt.getDay()] + ' ' + dt.getDate() + ' ' + MN[dt.getMonth()] + (t ? ', ' + tl(t) : '')); } el.textContent = p.join(' · '); }
  if (bf) {
    var daysEl = $('#days'), slotsEl = $('#slots'), to3 = $('#to3'), err = $('#f-err');
    var days = function () { var out = [], d = new Date(); d.setHours(0, 0, 0, 0); while (out.length < 6) { d = new Date(d.getTime() + 864e5); if (d.getDay() !== 1) out.push(new Date(d)); } return out; };
    var open = function (d) { var home = val('mode') === 'home'; return SLOTS.filter(function (t) { return (!home || t === '16:00') && !taken(d, t); }); };
    var drawDays = function () { var cur = val('day'); daysEl.innerHTML = days().map(function (d) { var i = iso(d), n = open(i).length; return '<label><input type="radio" name="day" value="' + i + '"' + (n ? '' : ' disabled') + (cur === i && n ? ' checked' : '') + '><span><b>' + DN[d.getDay()] + ' ' + d.getDate() + ' ' + MN[d.getMonth()] + '</b><small>' + (n ? n + (n === 1 ? ' hour open' : ' hours open') : 'full') + '</small></span></label>'; }).join(''); drawSlots(); };
    var drawSlots = function () { var d = val('day'), cur = val('slot'), home = val('mode') === 'home'; slotsEl.innerHTML = d ? SLOTS.map(function (t) { var off = (home && t !== '16:00') || taken(d, t); return '<label><input type="radio" name="slot" value="' + t + '"' + (off ? ' disabled' : '') + (cur === t && !off ? ' checked' : '') + '><span>' + tl(t) + '</span></label>'; }).join('') + (home ? '<p class="est-n" style="flex-basis:100%;margin:4px 0 0">Home visits are at four, when the light is in the room.</p>' : '') : '<p class="est-n" style="margin:0">Pick a day first.</p>'; to3.disabled = !(val('day') && val('slot')); sum(); };
    var step = function (n) { $$('.bk-s', bf).forEach(function (s) { var on = +s.getAttribute('data-step') === n; s.hidden = !on; s.classList.toggle('on', on); }); if (n === 2) drawDays(); var s = $('.bk-s.on', bf), f = n === 4 ? s : $('input:not([disabled]),button', s); if (f && n > 1) f.focus({ preventScroll: true }); if (wall().refresh) setTimeout(wall().refresh, 30); };
    bf.addEventListener('change', function (e) { if (e.target.name === 'day') drawSlots(); else if (e.target.name === 'slot') { to3.disabled = false; sum(); } else if (e.target.name === 'mode') { sum(); } else sum(); });
    bf.addEventListener('click', function (e) { var g = e.target.closest('[data-go]'); if (g) step(+g.getAttribute('data-go')); });
    bf.addEventListener('submit', function (e) { e.preventDefault(); var name = $('#f-name').value.trim(), c = $('#f-contact').value.trim(), mail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c), tel = c.replace(/[^\d]/g, '').length >= 10 && !/@/.test(c);
      var msg = name.length < 2 ? 'Tell us your name, so we know who to ask for.' : !(mail || tel) ? 'An email address or a ten-digit mobile, please, for the confirmation.' : ''; err.hidden = !msg; err.textContent = msg; if (msg) { (name.length < 2 ? $('#f-name') : $('#f-contact')).focus(); return; }
      var b = { name: name, phone: tel ? c : '', email: mail ? c : '', room: val('room'), mode: val('mode'), date: val('day'), time: val('slot'), status: 'confirmed', t: Date.now(), source: 'Website form', note: $('#f-note').value.trim(), est: est.sent ? { room: est.room, size: est.size, tier: est.tier, lo: est.lo, hi: est.hi } : null,
        wall: state.wall ? state.wall.n : '', tray: state.keep.map(function (id) { return NAMES[id]; }) };
      var btn = $('button[type="submit"]', bf); btn.disabled = true; btn.textContent = 'Writing it in the diary…';
      commit(b, function (ref) { var dt = new Date(b.date + 'T00:00'), who = b.mode === 'home' ? 'Kavya will come to you' : b.mode === 'video' ? 'Ira will send a link' : 'Ira will be at the studio';
        $('#bk-h').textContent = 'You’re in the diary, ' + name.split(' ')[0] + '.'; $('#bk-p').textContent = DL[dt.getDay()] + ' ' + dt.getDate() + ' ' + ML[dt.getMonth()] + ' at ' + tl(b.time) + '. ' + who + (b.wall || b.tray.length ? ', with ' + list([b.wall.replace(/^N-\d+ /, '')].concat(b.tray.map(function (x) { return x.toLowerCase(); })).filter(Boolean)) + ' on the table.' : '.') + ' A confirmation goes to ' + c + '.';
        $('#bk-ref').textContent = 'Ref. ' + ref; $('#bk-sum').textContent = ''; btn.disabled = false; btn.textContent = 'Book the consultation'; step(4); }); });
    sum();
    /* the front desk does not offer help on top of the form someone is filling in */
    if ('IntersectionObserver' in W) new IntersectionObserver(function (es) { root.classList.toggle('at-book', es[0].isIntersecting); }, { threshold: .15 }).observe(bf);
  }
  /* write it where the studio desk reads: the front desk's own bookings and leads */
  function commit(b, done) {
    var go = function () { var O = W.Orbit, key = 'orbit-data-nori-bookings', bk = null, ref;
      try { if (O && O._store) { bk = O._store.get(key, null); if (!bk) { var sd = O.agents && O.agents.nori && O.agents.nori.seeds && O.agents.nori.seeds.bookings; bk = sd ? sd() : []; } } } catch (e) { bk = null; }
      if (!bk) bk = booked(); var mx = 1030; bk.forEach(function (x) { var n = +String(x.ref || '').replace(/\D/g, ''); if (n > mx) mx = n; }); ref = 'AN-' + (mx + 1); b.ref = ref; b.convo = 'form-' + ref; bk.push(b);
      try { localStorage.setItem(key, JSON.stringify(bk)); } catch (e) {}
      var lead = { name: b.name, phone: b.phone, email: b.email || undefined, source: 'Website form', channel: 'web', agent: 'nori', intent: 'consultation', payload: { ref: ref, room: ROOMN[b.room], mode: MODE[b.mode][0], date: b.date, time: b.time, estimate: b.est ? R(b.est.lo) + ' – ' + R(b.est.hi) : '', wall: b.wall, tray: b.tray, swatches: b.tray, note: b.note, form: 'Consultation form' } };
      try { if (O && O.leads) { var r = O.leads.add(lead); if (O.events) { O.events.log('lead', { agent: 'nori', channel: 'web', source: 'Website form', convo: b.convo, lead: r.id, intent: 'consultation' }); O.events.log('booking', { agent: 'nori', channel: 'web', source: 'Website form', convo: b.convo, kind: 'consultation' }); } }
        else { var a = JSON.parse(localStorage.getItem('orbit-leads') || '[]'); lead.id = 'L-' + (1008 + a.length); lead.timestamp = new Date().toISOString(); lead.status = 'new'; a.push(lead); localStorage.setItem('orbit-leads', JSON.stringify(a)); } } catch (e) {}
      setTimeout(function () { done(ref); }, 450); };
    if (W.Concierge && W.Concierge.load) { var fired = false, once = function () { if (!fired) { fired = true; go(); } }; try { W.Concierge.load(once); } catch (e) { once(); } setTimeout(once, 2500); } else go();
  }
  /* the front desk (chat) can lay the table and paint the wall too */
  W.Nori = { wall: function (c, n) { if (chart) setWall(c, n); }, keep: function (ids) { (ids || []).forEach(function (id) { var b = tray && $('.smp[data-id="' + id + '"]', tray); if (b && state.keep.indexOf(id) < 0) { state.keep.push(id); b.setAttribute('aria-pressed', 'true'); } }); save(); }, go: function (sel) { var t = $(sel); if (!t) return; var L = wall().lenis; if (L) L.scrollTo(t, { offset: -40, duration: 1.4 }); else t.scrollIntoView({ behavior: 'smooth' }); } };
  carry();

  /* ---------- room pages: the light study ---------- */
  var hours = $('.hours');
  if (hours) { hours.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; $$('button', hours).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); var to = null; try { to = JSON.parse(b.getAttribute('data-to')); } catch (x) {} if (to && wall().tween) wall().tween(hours.getAttribute('data-for'), to, 1400); }); }
})();
