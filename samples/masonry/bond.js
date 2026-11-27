/* Ashlar & Co. · choose the stone, choose the bond. Six generators lay the lab's wall in SVG, course by course, and a counter
   says what a wall of the chosen size needs: units, bags of lime, days for a crew of two and a dollar range. The estimator below
   uses the same stone and the same rate card as the chat. window.AshlarState() hands both to the quote form. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); }, $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, NS = 'http://www.w3.org/2000/svg';
  function money(n) { return '$' + (Math.round(n / 50) * 50).toLocaleString('en-US'); }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function rnd(seed) { var s = seed >>> 0 || 1; return function () { s = (Math.imul(s, 1664525) + 0x3C6EF35F) >>> 0; return s / 0x100000000; }; }

  var STONE = {
    blue: ['Bluestone', ['#56646F', '#4E5B66', '#606C74', '#68727B', '#5A5F6B', '#6A6964', '#525E68'], 1.15, 'blue-gray, split in the valley'],
    field: ['Fieldstone', ['#8A8276', '#7A7468', '#9B9284', '#6F6A62', '#A39B8C', '#857A69', '#77706A', '#8F8778'], 1.2, 'gathered from old farm walls'],
    brick: ['Reclaimed brick', ['#8E3B2C', '#9C4A32', '#7A3326', '#A0543A', '#874034', '#6E3125', '#93432F'], 1, 'with a century on it already'],
    lime: ['Limestone', ['#D9D2C0', '#CFC7B3', '#E1DACA', '#D4CBB6', '#C9C1AD', '#DDD6C5'], 1.3, 'pale, cut square']
  };
  var BOND = {
    running: { n: 'Running bond', ok: ['brick', 'blue', 'lime'], what: 'Each course offset by half a unit.' },
    english: { n: 'English bond', ok: ['brick'], what: 'Two wythes, tied by a course of headers every other course.' },
    flemish: { n: 'Flemish bond', ok: ['brick'], what: 'A header and a stretcher in every course, as on the old river houses.' },
    herring: { n: 'Herringbone paving', ok: ['brick', 'blue', 'lime'], what: 'Laid flat at forty-five degrees on stone dust, for terraces and walks. Length and width are the ground.' },
    drylaid: { n: 'Dry-laid wall', ok: ['field', 'blue'], what: 'No mortar: every stone fitted by hand, eighteen inches thick.' },
    screen: { n: 'Pierced screen', ok: ['brick'], what: 'Every other brick left out of alternate courses, so light and air come through.' }
  };
  var DEF = { brick: 'running', blue: 'running', field: 'drylaid', lime: 'running' };
  var S = { stone: 'blue', bond: 'running', len: 24, ht: 4 }, L = {};

  /* ---------- what a wall of this size needs ---------- */
  function count() {
    var A = S.len * S.ht, b = S.bond, s = S.stone, k = STONE[s][2], r = {};
    if (b === 'drylaid') { r.units = A / 10.8; r.unitL = 'tons of stone'; r.bags = 0; r.days = 1 + A / 28; r.rate = [44, 68]; }
    else if (s === 'brick') {
      var D = { running: [6.75, 140, 500, [26, 40]], english: [13.5, 140, 420, [40, 58]], flemish: [13.5, 140, 400, [42, 60]], herring: [4.6, 0, 0, [24, 36]], screen: [4.4, 120, 260, [36, 52]] }[b];
      r.units = A * D[0] * 1.05; r.unitL = b === 'herring' ? 'pavers' : 'bricks'; r.bags = D[1] ? r.units / D[1] : 0; r.days = b === 'herring' ? 1.5 + A / 140 : 1 + r.units / D[2]; r.rate = D[3];
    } else if (b === 'herring') { r.units = A / .5 * 1.05; r.unitL = 'pavers'; r.bags = 0; r.days = 1.5 + A / 110; r.rate = [28, 42]; }
    else { r.units = A / .89 * 1.04; r.unitL = 'stones'; r.bags = A / 14; r.days = 1 + A / 45; r.rate = [34, 52]; }
    r.units = b === 'drylaid' ? Math.round(r.units * 10) / 10 : Math.ceil(r.units); r.bags = Math.ceil(r.bags); r.days = Math.ceil(r.days);
    r.lo = A * r.rate[0] * k; r.hi = A * r.rate[1] * k; r.area = A; return r;
  }

  /* ---------- the generators: a panel 8 ft by 4 ft at 10 px to the inch ---------- */
  var W = 960, H = 480;
  function courses(heights) { var out = [], y = H; heights.forEach(function (h) { out.push([y - h, h]); y -= h; }); return out; }
  function brickRows(fn) { var u = [], ch = 80 / 3; for (var r = 0; r < 18; r++) { var y = H - (r + 1) * ch; fn(r, y, ch).forEach(function (q) { var x0 = Math.max(0, q[0]), x1 = Math.min(W, q[0] + q[1]); if (x1 - x0 > 6) u.push({ x: x0, y: y, w: x1 - x0, h: ch, r: r, hd: q[2] }); }); } return u; }
  function run(start, len, step) { var a = []; for (var x = start; x < W; x += step) a.push([x, len]); return a; }
  var GEN = {
    running: function (rand) {
      if (S.stone === 'brick') return brickRows(function (r) { return run(r % 2 ? -40 : 0, 80, 80); });
      var u = [], hs = [], t = 0; while (t < H) { var h = [60, 80, 100][Math.floor(rand() * 3)]; if (t + h > H) h = H - t; hs.push(h); t += h; }
      courses(hs).forEach(function (c, r) { var x = -rand() * 120; while (x < W) { var w = 120 + Math.round(rand() * 14) * 10; var x0 = Math.max(0, x), x1 = Math.min(W, x + w); if (x1 - x0 > 10) u.push({ x: x0, y: c[0], w: x1 - x0, h: c[1], r: r }); x += w; } });
      return u;
    },
    english: function () { return brickRows(function (r) { if (r % 2 === 0) return run(0, 80, 80); var a = [[0, 20, 1]]; for (var x = 20; x < W; x += 40) a.push([x, 40, 1]); return a; }); },
    flemish: function () { return brickRows(function (r) { var a = [], x = r % 2 ? -60 : 0; while (x < W) { a.push([x, 80]); a.push([x + 80, 40, 1]); x += 120; } return a; }); },
    screen: function () { return brickRows(function (r) { return r % 2 ? run(-40, 80, 160) : run(0, 80, 80); }); },
    drylaid: function (rand) {
      var u = [], y = H, r = 0;
      while (y > 0) { var h = 36 + Math.round(rand() * 30); if (y - h < 16) h = y; var x = -rand() * 60; while (x < W) { var w = 54 + rand() * 110, j = function (a) { return (rand() - .5) * a; };
        var pts = [[x + 3 + j(6), y - h + 3 + j(5)], [x + w * .5 + j(16), y - h + 2 + j(6)], [x + w - 3 + j(6), y - h + 4 + j(5)], [x + w - 2 + j(5), y - h * .5 + j(8)], [x + w - 4 + j(6), y - 3 + j(3)], [x + w * .45 + j(16), y - 2 + j(3)], [x + 3 + j(6), y - 4 + j(3)], [x + 2 + j(5), y - h * .5 + j(8)]];
        u.push({ pts: pts, r: r }); x += w; } y -= h; r++; }
      return u;
    },
    herring: function () {
      var u = [], s = 40, c = Math.SQRT1_2;
      for (var m = -8; m <= 8; m++) for (var n = -18; n <= 18; n++) {
        [[n * s - 2 * m * s, n * s + 2 * m * s, 2 * s, s], [n * s - 2 * m * s, (n + 1) * s + 2 * m * s, s, 2 * s]].forEach(function (q) {
          var cx = q[0] + q[2] / 2, cy = q[1] + q[3] / 2, rx = (cx - cy) * c + W / 2, ry = (cx + cy) * c + H / 2;
          if (rx > -70 && rx < W + 70 && ry > -70 && ry < H + 70) u.push({ x: q[0], y: q[1], w: q[2], h: q[3], r: Math.round((ry + 70) / 40), rot: true });
        });
      }
      return u;
    }
  };

  /* ---------- drawing ---------- */
  var svg = $('#wallSvg'), floor = $('#floor'), wrap = $('#wallW');
  function el(t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); return e; }
  function draw() {
    if (!svg) return; var rand = rnd(S.stone.length * 131 + S.bond.length * 17), pal = STONE[S.stone][1], J = S.bond === 'drylaid' ? 0 : 4;
    var units = GEN[S.bond](rand), frag = document.createDocumentFragment(), screen = S.bond === 'screen';
    svg.textContent = '';
    var bg = screen ? 'url(#sun)' : S.bond === 'drylaid' ? '#17191B' : S.stone === 'brick' ? '#CFC9BB' : '#B9B5AA';
    var defs = el('defs', {}); defs.innerHTML = '<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F1D9A6"/><stop offset="1" stop-color="#D9A86A"/></linearGradient><clipPath id="panel"><rect width="' + W + '" height="' + H + '"/></clipPath>';
    svg.appendChild(defs); svg.appendChild(el('rect', { width: W, height: H, fill: bg }));
    var g = el('g', { 'clip-path': 'url(#panel)' }), inner = S.bond === 'herring' ? el('g', { transform: 'translate(' + W / 2 + ' ' + H / 2 + ') rotate(45)' }) : g;
    if (inner !== g) g.appendChild(inner);
    var maxR = 0; units.forEach(function (u) { maxR = Math.max(maxR, u.r); });
    var shadow = screen ? [] : null;
    units.forEach(function (u, i) {
      var fill = pal[Math.floor(rand() * pal.length)], e, dl = reduce ? 0 : Math.round(u.r * (S.bond === 'herring' ? 40 : 55) + (u.x || 0) / W * 140);
      if (u.pts) e = el('polygon', { points: u.pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '), fill: fill });
      else e = el('rect', { x: (u.x + J / 2).toFixed(1), y: (u.y + J / 2).toFixed(1), width: Math.max(1, u.w - J).toFixed(1), height: Math.max(1, u.h - J).toFixed(1), fill: fill });
      if (screen) { e.setAttribute('stroke', '#CFC9BB'); e.setAttribute('stroke-width', '4'); shadow.push(u); }
      e.setAttribute('class', 'u'); e.style.setProperty('--dl', dl + 'ms'); frag.appendChild(e);
    });
    inner.appendChild(frag); svg.appendChild(g);
    // a little light on the top edge of every unit, so the courses read
    if (S.bond !== 'herring' && S.bond !== 'drylaid') { var hl = el('g', { opacity: '.18', 'clip-path': 'url(#panel)' }); units.forEach(function (u) { if (u.pts) return; hl.appendChild(el('rect', { x: u.x + J / 2, y: u.y + J / 2, width: Math.max(1, u.w - J), height: 1.5, fill: '#fff', class: 'u', style: '--dl:' + (reduce ? 0 : Math.round(u.r * 55 + u.x / W * 140)) + 'ms' })); }); svg.appendChild(hl); }
    wrap.classList.toggle('screen', screen);
    if (screen) { var sh = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' + shadow.map(function (u) { return '<rect x="' + u.x + '" y="' + u.y + '" width="' + u.w + '" height="' + u.h + '" fill="rgba(24,16,8,.82)"/>'; }).join('') + '</svg>'; floor.innerHTML = sh; } else floor.textContent = '';
  }

  /* ---------- the counter runs as the wall lays ---------- */
  var cU = $('#cUnits'), cB = $('#cBags'), cD = $('#cDays'), cC = $('#cCost'), anim = 0;
  function tally() {
    L = count(); var from = { u: +(cU.getAttribute('data-v') || 0), b: +(cB.getAttribute('data-v') || 0), d: +(cD.getAttribute('data-v') || 0) }, t0 = performance.now(), dur = reduce ? 0 : 900;
    $('#cUnitL').textContent = L.unitL; $('#cBagL').textContent = L.bags ? (L.bags === 1 ? 'bag of lime' : 'bags of lime') : 'No lime: ' + (S.bond === 'drylaid' ? 'dry-laid' : 'set on stone dust'); cB.style.display = L.bags ? '' : 'none';
    cU.setAttribute('data-v', L.units); cB.setAttribute('data-v', L.bags); cD.setAttribute('data-v', L.days);
    cancelAnimationFrame(anim);
    (function step(now) { var t = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - Math.pow(1 - t, 3);
      var uu = from.u + (L.units - from.u) * e; cU.textContent = S.bond === 'drylaid' ? uu.toFixed(1) : fmt(uu); cB.textContent = fmt(from.b + (L.bags - from.b) * e); cD.textContent = fmt(from.d + (L.days - from.d) * e);
      if (t < 1) anim = requestAnimationFrame(step); })(performance.now());
    cC.textContent = money(L.lo) + '–' + money(L.hi);
    $('#cWhat').textContent = STONE[S.stone][0] + ', ' + BOND[S.bond].n.toLowerCase() + ', ' + S.len + ' by ' + S.ht + ' ft' + (S.bond === 'herring' ? ' of ground' : ' of wall') + '.';
  }

  /* ---------- controls ---------- */
  var note = $('#labNote');
  function press(list, attr, v) { list.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr) === v)); }); }
  function setStone(v, from) {
    S.stone = v; var msg = '';
    if (BOND[S.bond].ok.indexOf(v) < 0) { msg = BOND[S.bond].n + ' is not laid in ' + STONE[v][0].toLowerCase() + ', so the wall switched to ' + BOND[DEF[v]].n.toLowerCase() + '. '; S.bond = DEF[v]; }
    sync(msg); if (from !== 'est') update(); estimate();
  }
  function setBond(v) {
    var msg = ''; S.bond = v; if (BOND[v].ok.indexOf(S.stone) < 0) { var s2 = BOND[v].ok[0]; msg = BOND[v].n + ' is laid in ' + STONE[s2][0].toLowerCase() + ', so the stone switched. '; S.stone = s2; }
    sync(msg); update(); estimate();
  }
  function sync(msg) {
    press($$('#labStone button'), 'data-mat', S.stone); press($$('.mats .mat'), 'data-mat', S.stone); press($$('#labBond button'), 'data-bond', S.bond);
    $('#lenL').textContent = S.bond === 'herring' ? 'Length' : 'Length'; $('#htL').textContent = S.bond === 'herring' ? 'Width' : 'Height';
    $('#htV').textContent = S.ht + ' ft'; $('#lenV').textContent = S.len + ' ft';
    note.textContent = msg + BOND[S.bond].what;
  }
  function update() { draw(); tally(); }
  $$('#labStone button').forEach(function (b) { b.addEventListener('click', function () { setStone(b.getAttribute('data-mat')); }); });
  $$('#labBond button').forEach(function (b) { b.addEventListener('click', function () { setBond(b.getAttribute('data-bond')); }); });
  var lt = 0;
  $('#labLen').addEventListener('input', function () { S.len = +this.value; $('#lenV').textContent = S.len + ' ft'; clearTimeout(lt); lt = setTimeout(tally, 60); });
  $('#labHt').addEventListener('input', function () { S.ht = +this.value; $('#htV').textContent = S.ht + ' ft'; clearTimeout(lt); lt = setTimeout(tally, 60); });

  /* ---------- the estimator: the chat's rate card, the lab's stone ---------- */
  var APP = {
    patio: { n: 'Terrace or walkway', rate: [18, 30], wk: [2, 250], inc: 'Excavation, drained base, laying, edging and sealing', hint: 'The ground footprint of the paved area.' },
    wall: { n: 'Garden or boundary wall', rate: [28, 46], wk: [2, 160], inc: 'Footing, courses, capping and pointing', hint: 'The face of the wall: length times height.' },
    retaining: { n: 'Retaining wall', rate: [35, 60], wk: [3, 200], inc: 'Engineering check, drainage, footing and wall', hint: 'The face of the wall: length times height.' },
    kitchen: { n: 'Outdoor kitchen or hearth', rate: [55, 95], wk: [4, 150], inc: 'Footing, flue, stone cladding and finishing', hint: 'The footprint of the build, hearth and surrounds.' },
    facade: { n: 'Facade or cladding', rate: [24, 40], wk: [3, 200], inc: 'Scaffold, preparation, cladding and pointing', hint: 'The wall face to be clad.' }
  };
  var E = {};
  function estimate() {
    var t = $('#eType'), a = $('#eArea'), f = $('#eFin'); if (!t) return;
    var A = APP[t.value], area = +a.value, k = STONE[S.stone][2] * (f.value === 'prem' ? 1.3 : 1);
    var lo = Math.round(A.wk[0] + area / A.wk[1]) + (f.value === 'prem' ? 1 : 0), hi = Math.ceil(lo * 1.5 + 1);
    E = { app: t.value, job: A.n, area: area, fin: f.value, lo: area * A.rate[0] * k, hi: area * A.rate[1] * k, weeks: [lo, hi] };
    $('#eAreaV').textContent = area.toLocaleString('en-US') + ' sq ft'; $('#eHint').textContent = A.hint;
    $('#eOut').textContent = money(E.lo) + ' – ' + money(E.hi);
    $('#eMat').textContent = STONE[S.stone][0] + ', ' + STONE[S.stone][3];
    $('#eDays').textContent = 'About ' + lo + ' to ' + hi + ' weeks from groundwork to handover';
    $('#eInc').textContent = 'Includes: ' + A.inc.toLowerCase();
  }
  ['#eType', '#eFin'].forEach(function (s) { var e = $(s); if (e) e.addEventListener('change', estimate); });
  var ea = $('#eArea'); if (ea) ea.addEventListener('input', estimate);
  $$('.mats .mat').forEach(function (b) { b.addEventListener('click', function () { setStone(b.getAttribute('data-mat'), 'est'); update(); }); });

  window.AshlarState = function () { return { stone: STONE[S.stone][0], bond: BOND[S.bond].n, size: S.len + ' × ' + S.ht + ' ft', lab: L, est: E }; };

  // draw when the lab comes near, so the wall is seen being laid
  sync(''); estimate(); tally();
  var lab = $('#lab');
  if ('IntersectionObserver' in window && lab) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); draw(); } }, { rootMargin: '0px 0px -25% 0px' }); io.observe(lab); } else draw();
})();
