/* Forge · the floor, live. An isometric drawing of each branch, lit by the timetable: the zone in use glows,
   figures stand where the class is, a tag says what is on and how many places are left, and a scrubber runs
   the day from 05:30 to 22:30. Pure SVG built from boxes; the sessions are the same ones the timetable books.
   Markup (written by forge-pages.py): <div class="fl" data-floor="saket" data-busy="12,64,…"></div> */
(function () {
  'use strict';
  var F = window.Forge, host = document.querySelector('[data-floor]'); if (!F || !host) return;
  var key = host.getAttribute('data-floor'), esc = F.esc, reduce = F.reduce;
  var busy = (host.getAttribute('data-busy') || '').split(',').map(Number);
  var NS = 'http://www.w3.org/2000/svg', C = Math.cos(Math.PI / 6), S = 0.5;
  var T0 = 330, T1 = 1350;                                  /* 05:30 and 22:30 in minutes */

  /* ---------- the two floors, in metres ---------- */
  var PLANS = {
    saket: { W: 42, D: 25, k: 15.6,
      zones: { p: [2, 2, 28, 9.4], e: [31.5, 2, 9, 9.4], s: [1, 13.2, 40, 3.4], l: [9.5, 18.6, 11.5, 5.4], y: [22.2, 18.6, 7, 5.4], r: [30.4, 18.6, 10.6, 5.4] },
      map: { 'heavy-hour': 'p', foundations: 'p', 'kettlebell-club': 'p', 'engine-room': 'e', 'erg-lab': 'e', 'tempo-run': 's', 'hyrox-sim': 's', stations: 's', doubles: 's', mobility: 'r', contrast: 'r' },
      open: ['p', 'p', 'p', 'e', 's', 'r'] },
    gurugram: { W: 50, D: 28, k: 13.4,
      zones: { p: [1, 1, 48, 26], s: [6, 5, 24, 8], e: [32, 5, 12.5, 8], r: [6, 15, 25, 5], y: [33, 15, 11.5, 8], l: [6, 21.4, 12, 3.6] },
      map: { 'heavy-hour': 'y', foundations: 'y', 'kettlebell-club': 'y', 'engine-room': 'e', 'erg-lab': 'e', 'tempo-run': 'p', 'hyrox-sim': 's', stations: 's', doubles: 's', mobility: 'r', contrast: 'r' },
      open: ['y', 'y', 'e', 's', 'r', 'p'] }
  }, PL = PLANS[key]; if (!PL) return;
  var names = {}; [].forEach.call(document.querySelectorAll('[data-plan-list] li'), function (li) { names[li.getAttribute('data-z')] = li.querySelector('b').textContent; });

  /* ---------- projection and drawing helpers ---------- */
  var K = PL.k, VW = 1000, OX = PL.D * C * K + 34, OY = 96, VH = Math.round((PL.W + PL.D) * S * K + OY + 44);
  function P(x, y, z) { return [(OX + (x - y) * C * K), (OY + (x + y) * S * K - (z || 0) * K)]; }
  function pts(a) { return a.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
  function poly(a, cls, extra) { return '<polygon class="' + cls + '" points="' + pts(a) + '"' + (extra || '') + '/>'; }
  function flat(x, y, w, d, z, cls, extra) { return poly([P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)], cls, extra); }
  function box(x, y, w, d, h, cls, z0) { z0 = z0 || 0;            /* left face, right face, top */
    return poly([P(x, y + d, z0), P(x + w, y + d, z0), P(x + w, y + d, z0 + h), P(x, y + d, z0 + h)], cls + ' fl-l') +
      poly([P(x + w, y, z0), P(x + w, y + d, z0), P(x + w, y + d, z0 + h), P(x + w, y, z0 + h)], cls + ' fl-r') +
      flat(x, y, w, d, z0 + h, cls + ' fl-t'); }
  function line(a, b, cls) { var p = P(a[0], a[1], a[2]), q = P(b[0], b[1], b[2]); return '<line class="' + cls + '" x1="' + p[0].toFixed(1) + '" y1="' + p[1].toFixed(1) + '" x2="' + q[0].toFixed(1) + '" y2="' + q[1].toFixed(1) + '"/>'; }
  function ring(cx, cy, r, z, cls) { var p = P(cx, cy, z); return '<ellipse class="' + cls + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" rx="' + (r * K * C * 1.4142).toFixed(1) + '" ry="' + (r * K * S * 1.4142).toFixed(1) + '"/>'; }
  function rack(x, y) { return line([x, y, 0], [x, y, 2.3], 'fl-steel') + line([x + 1.2, y, 0], [x + 1.2, y, 2.3], 'fl-steel') + line([x, y, 2.3], [x + 1.2, y, 2.3], 'fl-steel') + line([x - 0.5, y + 0.2, 1.25], [x + 1.7, y + 0.2, 1.25], 'fl-bar'); }
  function rnd(seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

  /* ---------- the still parts of each floor, drawn far to near ---------- */
  function scene() {
    var o = '', W = PL.W, D = PL.D, z = PL.zones, i, j;
    o += box(0, 0, W, D, 0.5, 'fl-slab', -0.5);
    if (key === 'saket') {
      /* far walls of the old press building, with the east windows */
      o += poly([P(0, 0, 0), P(W, 0, 0), P(W, 0, 3.6), P(0, 0, 3.6)], 'fl-wall') + poly([P(0, 0, 0), P(0, D, 0), P(0, D, 3.6), P(0, 0, 3.6)], 'fl-wall fl-wall2');
      for (i = 0; i < 9; i++) o += poly([P(2.4 + i * 4.4, 0, 1), P(5.6 + i * 4.4, 0, 1), P(5.6 + i * 4.4, 0, 3.1), P(2.4 + i * 4.4, 0, 3.1)], 'fl-win') + line([4 + i * 4.4, 0, 1], [4 + i * 4.4, 0, 3.1], 'fl-mull');
      for (i = 0; i < 5; i++) o += line([0, 2.5 + i * 5, 0], [0, 2.5 + i * 5, 3.6], 'fl-col');
      /* platform row: 14 platforms, a rack on each */
      o += flat(z.p[0], z.p[1], z.p[2], z.p[3], 0, 'fl-zone');
      for (j = 0; j < 2; j++) for (i = 0; i < 7; i++) { var px = 2.6 + i * 4, py = 2.5 + j * 4.7; o += flat(px, py, 2.6, 3.6, 0.04, 'fl-plat') + flat(px + 0.75, py, 1.1, 3.6, 0.05, 'fl-plat2') + rack(px + 0.7, py + 0.5); }
      /* erg bay: three rows facing the windows */
      o += flat(z.e[0], z.e[1], z.e[2], z.e[3], 0, 'fl-zone');
      for (j = 0; j < 3; j++) for (i = 0; i < 6; i++) o += box(32.2 + i * 1.4, 3 + j * 2.9, 0.5, 1.9, j === 0 ? 1.5 : 0.5, 'fl-erg');
      /* sled lane: 40 m of turf, ticked every 5 m */
      o += flat(z.s[0], z.s[1], z.s[2], z.s[3], 0, 'fl-turf');
      for (i = 0; i <= 8; i++) o += line([1 + i * 5, 13.2, 0.02], [1 + i * 5, 16.6, 0.02], 'fl-tick');
      o += line([1, 14.9, 0.02], [41, 14.9, 0.02], 'fl-lane');
      [[6, 13.7], [17, 15.3], [29, 13.7]].forEach(function (s) { o += box(s[0], s[1], 1.5, 0.9, 0.35, 'fl-sled') + line([s[0] + 0.2, s[1] + 0.45, 0.35], [s[0] + 0.2, s[1] + 0.45, 1.1], 'fl-steel') + line([s[0] + 1.3, s[1] + 0.45, 0.35], [s[0] + 1.3, s[1] + 0.45, 1.1], 'fl-steel'); });
      /* front desk and gate 2 */
      o += box(2, 19.4, 5.6, 1.5, 1.1, 'fl-desk') + flat(1, 22.6, 7.4, 2.4, 0.02, 'fl-mat');
      /* lockers and showers */
      o += flat(z.l[0], z.l[1], z.l[2], z.l[3], 0, 'fl-zone');
      for (i = 0; i < 3; i++) o += box(10.2 + i * 2.6, 19.2, 0.6, 4.2, 1.9, 'fl-lock');
      for (i = 0; i < 4; i++) o += box(18 + (i % 2) * 1.5, 19.2 + (i > 1 ? 2.3 : 0), 1.2, 1.9, 2.1, 'fl-glassb');
      /* physio room: half-height walls, a table */
      o += flat(z.y[0], z.y[1], z.y[2], z.y[3], 0, 'fl-zone') + box(22.2, 18.6, 7, 0.12, 1.3, 'fl-part') + box(22.2, 18.6, 0.12, 5.4, 1.3, 'fl-part') + box(24.4, 20.6, 2, 0.8, 0.7, 'fl-desk') + flat(26.9, 21.9, 1.5, 1.5, 0.04, 'fl-plat2');
      /* recovery: sauna, two tubs */
      o += flat(z.r[0], z.r[1], z.r[2], z.r[3], 0, 'fl-zone') + box(31, 19.1, 4.4, 3.2, 2.4, 'fl-sauna');
      for (i = 1; i < 6; i++) o += line([31 + i * 0.73, 22.3, 0], [31 + i * 0.73, 22.3, 2.4], 'fl-slat');
      [[37.6, 20.2], [39.4, 22.3]].forEach(function (t) { o += ring(t[0], t[1], 0.95, 0.75, 'fl-tub') + ring(t[0], t[1], 0.78, 0.75, 'fl-water'); });
    } else {
      /* a rooftop: parapet, run loop round the edge, canopy over the ergs, strength room behind glass */
      o += poly([P(0, 0, 0), P(W, 0, 0), P(W, 0, 1), P(0, 0, 1)], 'fl-wall') + poly([P(0, 0, 0), P(0, D, 0), P(0, D, 1), P(0, 0, 1)], 'fl-wall fl-wall2');
      o += flat(1, 1, 48, 26, 0, 'fl-track') + flat(3.4, 3.4, 43.2, 21.2, 0.01, 'fl-roof');
      [[1, 1, 48, 26], [2.2, 2.2, 45.6, 23.6]].forEach(function (r) { o += flat(r[0], r[1], r[2], r[3], 0.02, 'fl-laneb'); });
      for (i = 0; i < 6; i++) o += line([4 + i * 8.6, 1, 0.02], [4 + i * 8.6, 3.4, 0.02], 'fl-tick');
      /* simulation lane: eight stations */
      o += flat(z.s[0], z.s[1], z.s[2], z.s[3], 0.02, 'fl-turf');
      for (i = 1; i < 8; i++) o += line([6 + i * 3, 5, 0.03], [6 + i * 3, 13, 0.03], 'fl-tick');
      for (i = 0; i < 8; i++) o += flat(6.3 + i * 3, 12.1, 2.4, 0.6, 0.04, 'fl-mat');
      o += box(6.9, 6, 0.5, 1.9, 1.5, 'fl-erg') + box(10, 6.4, 1.5, 0.9, 0.35, 'fl-sled') + box(13, 8.6, 1.5, 0.9, 0.35, 'fl-sled') + box(18.9, 6, 0.5, 1.9, 0.5, 'fl-erg') + box(27.2, 5.2, 2.4, 0.2, 3, 'fl-part');
      /* erg bay under the canopy */
      o += flat(z.e[0], z.e[1], z.e[2], z.e[3], 0.02, 'fl-zone');
      for (j = 0; j < 3; j++) for (i = 0; i < 8; i++) o += box(32.8 + i * 1.45, 5.8 + j * 2.5, 0.5, 1.8, j === 0 ? 1.5 : 0.5, 'fl-erg');
      [[32, 5], [44.5, 5], [32, 13], [44.5, 13]].forEach(function (p) { o += line([p[0], p[1], 0], [p[0], p[1], 3.2], 'fl-col'); });
      o += flat(31.6, 4.6, 13.3, 8.8, 3.2, 'fl-canopy');
      /* turf */
      o += flat(z.r[0], z.r[1], z.r[2], z.r[3], 0.02, 'fl-turf');
      for (i = 0; i <= 5; i++) o += line([6 + i * 5, 15, 0.03], [6 + i * 5, 20, 0.03], 'fl-tick');
      o += box(9, 16.4, 1.5, 0.9, 0.35, 'fl-sled') + box(22, 17.9, 1.5, 0.9, 0.35, 'fl-sled');
      /* lockers, and the lift to R */
      o += flat(z.l[0], z.l[1], z.l[2], z.l[3], 0.02, 'fl-zone');
      for (i = 0; i < 3; i++) o += box(6.8 + i * 2.6, 21.9, 0.6, 2.6, 1.9, 'fl-lock');
      o += box(14.8, 21.9, 2.6, 2.6, 2.1, 'fl-glassb') + box(20.6, 21.6, 4.6, 3.2, 2.9, 'fl-desk') + flat(25.6, 21.8, 3.4, 2.8, 0.03, 'fl-mat');
      /* strength room behind glass */
      o += flat(z.y[0], z.y[1], z.y[2], z.y[3], 0.02, 'fl-zone');
      for (j = 0; j < 2; j++) for (i = 0; i < 4; i++) { var qx = 33.7 + i * 2.8, qy = 15.8 + j * 3.9; o += flat(qx, qy, 2.2, 3, 0.05, 'fl-plat') + rack(qx + 0.5, qy + 0.4); }
      o += poly([P(33, 23, 0), P(44.5, 23, 0), P(44.5, 23, 2.8), P(33, 23, 2.8)], 'fl-glass') + poly([P(44.5, 15, 0), P(44.5, 23, 0), P(44.5, 23, 2.8), P(44.5, 15, 2.8)], 'fl-glass');
    }
    return o;
  }
  /* where a zone's outline and its tag sit */
  function zonePoly(k, cls) { var r = PL.zones[k]; if (key === 'gurugram' && k === 'p') return '<path class="' + cls + '" fill-rule="evenodd" d="M' + pts([P(1, 1), P(49, 1), P(49, 27), P(1, 27)]).replace(/ /g, 'L') + 'ZM' + pts([P(3.4, 3.4), P(46.6, 3.4), P(46.6, 24.6), P(3.4, 24.6)]).replace(/ /g, 'L') + 'Z"/>'; return flat(r[0], r[1], r[2], r[3], 0.06, cls); }
  function anchor(k) { var r = PL.zones[k]; if (key === 'gurugram' && k === 'p') return P(25, 2.2, 0); return P(r[0] + r[2] / 2, r[1] + r[3] / 2, 0); }

  /* ---------- build ---------- */
  host.innerHTML = '<div class="fl-stage"><svg class="fl-svg" viewBox="0 0 ' + VW + ' ' + VH + '" role="img" aria-label="Drawing of the ' + esc(F.branches[key].name) + ' floor. The zone in use at the chosen time is lit."><g class="fl-still">' + scene() + '</g><g class="fl-hits"></g><g class="fl-glow"></g><g class="fl-people"></g>' +
    (key === 'saket' ? '<text class="fl-note" x="' + P(4.8, 24.6)[0].toFixed(0) + '" y="' + (P(4.8, 24.6)[1] + 26).toFixed(0) + '">Gate 2 ↑</text>' : '<text class="fl-note" x="' + P(27.4, 25)[0].toFixed(0) + '" y="' + (P(27.4, 25)[1] + 24).toFixed(0) + '">Lift · R</text>') +
    '</svg><div class="fl-tag" hidden></div></div>' +
    '<div class="fl-ctl"><button type="button" class="fl-play" aria-pressed="false"><i aria-hidden="true"></i><span>Play the day</span></button>' +
    '<div class="fl-scrub"><div class="fl-marks" aria-hidden="true"></div><input type="range" class="fl-range" min="' + T0 + '" max="' + T1 + '" step="5" aria-label="Time of day on the ' + esc(F.branches[key].name) + ' floor"><div class="fl-ends mono" aria-hidden="true"><span>05:30</span><span>12:00</span><span>18:00</span><span>22:30</span></div></div>' +
    '<output class="fl-now mono" aria-hidden="true"></output></div><p class="fl-line" aria-live="polite"></p>';
  var svg = host.querySelector('.fl-svg'), glow = host.querySelector('.fl-glow'), people = host.querySelector('.fl-people'), hits = host.querySelector('.fl-hits'), tag = host.querySelector('.fl-tag');
  var range = host.querySelector('.fl-range'), nowEl = host.querySelector('.fl-now'), lineEl = host.querySelector('.fl-line'), play = host.querySelector('.fl-play'), marks = host.querySelector('.fl-marks');
  hits.innerHTML = Object.keys(PL.zones).map(function (k) { return zonePoly(k, 'fl-hit" data-z="' + k); }).join('');
  /* a small chalk label at each zone's far corner */
  var labs = document.createElementNS(NS, 'g'); labs.setAttribute('class', 'fl-labs'); svg.insertBefore(labs, glow);
  labs.innerHTML = Object.keys(PL.zones).map(function (k) { var r = PL.zones[k], p = key === 'gurugram' && k === 'p' ? P(40, 1.2, 0) : P(r[0] + 0.3, r[1] + 0.3, 0); return '<text class="fl-lab" data-z="' + k + '" x="' + (p[0] + (key === 'gurugram' && k === 'p' ? 0 : 0)).toFixed(0) + '" y="' + (p[1] - 9).toFixed(0) + '">' + esc(names[k] || '') + '</text>'; }).join('');

  var today = new Date(), sessions = F.sessions(today).filter(function (s) { return s.branch === key; });
  function mins(t) { return +t.slice(0, 2) * 60 + +t.slice(3, 5); }
  function hhmm(m) { var h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm; }
  marks.innerHTML = sessions.map(function (s) { var a = (mins(s.time) - T0) / (T1 - T0) * 100, w = s.cls.mins / (T1 - T0) * 100; return '<i style="left:' + a.toFixed(2) + '%;width:' + w.toFixed(2) + '%" class="t-' + s.cls.type + '"></i>'; }).join('');

  function figures(k, n, seed, coach) {
    var r = PL.zones[k], R = rnd(seed), out = [], i, x, y, ringZone = key === 'gurugram' && k === 'p';
    for (i = 0; i < n; i++) {
      if (ringZone) { var t = R(), e = Math.floor(R() * 4), o2 = 1.4 + R() * 1.4; x = e === 0 ? 2 + t * 46 : e === 1 ? 49.8 - o2 : e === 2 ? 2 + t * 46 : o2; y = e === 0 ? o2 : e === 1 ? 2 + t * 24 : e === 2 ? 27.8 - o2 : 2 + t * 24; }
      else { x = r[0] + 0.7 + R() * (r[2] - 1.4); y = r[1] + 0.6 + R() * (r[3] - 1.2); }
      out.push([x, y, i === 0 && coach]);
    }
    out.sort(function (a, b) { return (a[0] + a[1]) - (b[0] + b[1]); });
    return out.map(function (f, i) { var p = P(f[0], f[1], 0); return '<g class="fl-fig' + (f[2] ? ' coach' : '') + '" style="--d:' + (i % 9) * 0.07 + 's" transform="translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ') scale(' + FS + ')"><ellipse class="sh" cx="0" cy="0" rx="4.4" ry="1.9"/><line y1="-1" y2="-10"/><circle cy="-13" r="2.7"/></g>'; }).join('');
  }

  var FS = host.clientWidth < 560 ? 2 : host.clientWidth < 760 ? 1.4 : 1;   /* figures stay readable when the drawing is small */
  var cur = { z: '', id: '' }, picked = '';
  function at(m) {
    var live = null, next = null;
    sessions.forEach(function (s) { var a = mins(s.time); if (m >= a && m < a + s.cls.mins) live = live || s; else if (a > m && (!next || a < mins(next.time))) next = s; });
    return { live: live, next: next };
  }
  function show(m, fromUser) {
    m = Math.max(T0, Math.min(T1, Math.round(m / 5) * 5)); range.value = m; range.style.setProperty('--p', ((m - T0) / (T1 - T0) * 100).toFixed(2) + '%');
    var st = at(m), s = st.live, soon = !s && st.next && mins(st.next.time) - m <= 40 ? st.next : null, focus = s || soon, hr = Math.max(0, Math.min(busy.length - 1, Math.floor(m / 60) - 6));
    var z = focus ? PL.map[focus.cls.id] || 'p' : '', id = (focus ? focus.id : 'open' + hr) + (s ? '' : soon ? ':soon' : '');
    nowEl.textContent = hhmm(m);
    if (id !== cur.id) {
      cur = { z: z, id: id };
      glow.innerHTML = z ? zonePoly(z, 'fl-on2') + zonePoly(z, 'fl-on') : '';
      [].forEach.call(labs.querySelectorAll('.fl-lab'), function (t) { t.classList.toggle('off', t.getAttribute('data-z') === z); });
      var html = '';
      if (s) html = figures(z, s.booked, F.hash(s.id), true);
      else if (soon) html = figures(z, Math.max(2, Math.round(soon.booked * 0.4)), F.hash(soon.id), true);
      /* open gym between classes: a few people where the typical-hour figures say they are */
      var openN = Math.round((busy[hr] || 20) / 100 * (s ? 7 : 16)), per = {}; PL.open.forEach(function (k, i) { if (k !== z) per[k] = (per[k] || 0) + (i < openN % PL.open.length ? 1 : 0) + Math.floor(openN / PL.open.length); });
      Object.keys(per).forEach(function (k) { if (per[k]) html += figures(k, per[k], F.hash(key + k + hr), false); });
      people.innerHTML = html;
      [].forEach.call(document.querySelectorAll('[data-plan-list] li'), function (li) { li.classList.toggle('on', li.getAttribute('data-z') === (z || picked)); });
      if (focus) {
        var a = anchor(z), left = s ? focus.left : focus.left;
        tag.hidden = false; tag.style.left = (a[0] / VW * 100).toFixed(2) + '%'; tag.style.top = (a[1] / VH * 100).toFixed(2) + '%';
        tag.className = 'fl-tag' + (a[0] > VW * 0.62 ? ' flip' : '') + (s ? '' : ' soon');
        tag.innerHTML = '<span class="mono">' + (s ? 'On now · ' + esc(focus.time) : 'Starts ' + esc(focus.time)) + '</span><b>' + esc(focus.cls.name) + '</b><span class="mono">' + esc(focus.coach.name.split(' ')[0]) + ' · ' + (left ? left + ' of ' + focus.cap + ' left' : 'Full · waitlist') + '</span>' +
          '<a class="fl-book" href="class.html?id=' + focus.cls.id + '#sessions">' + (left ? 'Book' : 'Waitlist') + ' <span aria-hidden="true">→</span></a>';
        lineEl.innerHTML = '<b>' + hhmm(m) + '</b> ' + (s ? esc(focus.cls.name) + ' is on in the ' + esc((names[z] || '').toLowerCase()) + ' with ' + esc(focus.coach.name) + '. ' : esc(focus.cls.name) + ' starts at ' + esc(focus.time) + ' in the ' + esc((names[z] || '').toLowerCase()) + '. ') + (left ? left + ' of ' + focus.cap + ' places left.' : 'It is full; there is a waitlist.');
      } else {
        tag.hidden = true;
        lineEl.innerHTML = '<b>' + hhmm(m) + '</b> Open floor. ' + (st.next ? 'Next class: ' + esc(st.next.cls.name) + ' at ' + esc(st.next.time) + '.' : 'No more classes today; the floor stays open until close.');
      }
    }
    range.setAttribute('aria-valuetext', lineEl.textContent);
    if (fromUser) stop();
  }
  /* play the day */
  var raf = 0, t0 = 0, m0 = 0;
  function stop() { if (!raf) return; cancelAnimationFrame(raf); raf = 0; play.setAttribute('aria-pressed', 'false'); play.querySelector('span').textContent = 'Play the day'; }
  function step(now) { var m = m0 + (now - t0) / 1000 * 68; if (m >= T1) { show(T1); stop(); return; } show(m); raf = requestAnimationFrame(step); }
  play.addEventListener('click', function () { if (raf) { stop(); return; } m0 = +range.value >= T1 - 10 ? T0 : +range.value; t0 = performance.now(); play.setAttribute('aria-pressed', 'true'); play.querySelector('span').textContent = 'Pause'; raf = requestAnimationFrame(step); });
  range.addEventListener('input', function () { show(+range.value, true); });
  /* a zone, tapped on the drawing or in the list, jumps to its next class today */
  function pick(k) {
    picked = k; var now = +range.value, list = sessions.filter(function (s) { return (PL.map[s.cls.id] || 'p') === k; }), nx = list.filter(function (s) { return mins(s.time) + s.cls.mins > now; })[0] || list[0];
    if (nx) show(mins(nx.time) + 5, true); else { [].forEach.call(document.querySelectorAll('[data-plan-list] li'), function (li) { li.classList.toggle('on', li.getAttribute('data-z') === k); }); glow.innerHTML = zonePoly(k, 'fl-on2') + zonePoly(k, 'fl-on'); cur.id = 'pick' + k; tag.hidden = true; lineEl.innerHTML = '<b>' + esc(names[k] || '') + '</b> No class here today. It is open to members all day.'; stop(); }
  }
  hits.addEventListener('click', function (e) { var z = e.target.getAttribute && e.target.getAttribute('data-z'); if (z) pick(z); });
  [].forEach.call(document.querySelectorAll('[data-plan-list] li'), function (li) { li.tabIndex = 0; li.addEventListener('click', function () { pick(li.getAttribute('data-z')); }); li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(li.getAttribute('data-z')); } }); });

  var nowM = today.getHours() * 60 + today.getMinutes();
  /* outside opening hours, open on the fullest class of the day */
  var peak = sessions.slice().sort(function (a, b) { return b.booked - a.booked; })[0];
  show(nowM < T0 || nowM > T1 ? (peak ? mins(peak.time) + 10 : 18 * 60 + 5) : nowM);
  host.classList.add('ready');
  /* once, when it first comes into view, run a short stretch of the evening so it is plainly alive */
  if (!reduce && 'IntersectionObserver' in window) new IntersectionObserver(function (es, ob) { if (!es[0].isIntersecting) return; ob.disconnect(); host.classList.add('seen'); }, { threshold: 0.35 }).observe(host);
})();
