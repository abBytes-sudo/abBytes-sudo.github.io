/* Aaranya · location: a schematic SVG map (no map API) with routes and travel times by time of day. */
(function () {
  'use strict';
  var A = window.AAR, $ = A.$, $$ = A.$$;
  var HOME = [430, 430];
  var EXP = [[352, 0], [392, 190], [430, 360], [470, 470], [540, 590], [628, 720]];
  var NH = [[1000, 60], [900, 230], [800, 400], [700, 560], [612, 720]];
  var NPR = [[430, 360], [560, 382], [700, 400], [800, 400]];
  var SPR = [[540, 590], [640, 560], [740, 545]];
  var METRO = [[372, 40], [398, 200], [440, 372], [478, 470], [548, 588]];
  // name, category, x, y, [off, peak, metro] minutes (null = n/a), note, route (points from home)
  var D = [
    ['Dwarka Expressway', 'commute', 432, 372, [7, 12, null], 'On-ramp at the Sector 109 junction', [[430, 400], [432, 372]]],
    ['IGI Airport, Terminal 3', 'commute', 690, 70, [24, 40, 46], 'Via the Expressway and the airport tunnel', [[432, 372], [392, 190], [520, 120], [690, 70]]],
    ['Cyber City', 'commute', 870, 280, [32, 55, 50], 'Via the Northern Peripheral Road and NH-48', [[432, 372], [560, 382], [700, 400], [800, 400], [870, 280]]],
    ['Dwarka Sector 21 metro', 'commute', 372, 40, [14, 22, null], 'Free pickup for site visits', [[432, 372], [392, 190], [372, 40]]],
    ['Convention centre, Dwarka', 'commute', 420, 120, [18, 30, 28], 'Exhibitions and conferences', [[432, 372], [400, 200], [420, 120]]],
    ['NH-48 at Kherki Daula', 'commute', 618, 690, [12, 20, null], 'For Jaipur and Manesar', [[470, 470], [540, 590], [618, 690]]],
    ['Shishukunj Public School (CBSE)', 'school', 470, 470, [5, 8, null], 'Sector 109, 1.6 km', [[430, 430], [470, 470]]],
    ['Meridian Hills International (IB)', 'school', 360, 520, [9, 14, null], 'Sector 106, 3 km', [[430, 430], [395, 470], [360, 520]]],
    ['Pre-school in the Podium Club', 'school', 420, 440, [1, 1, null], 'Inside the gates', [[430, 432], [420, 440]]],
    ['Multi-speciality hospital, 450 beds', 'health', 520, 420, [8, 14, null], 'Sector 110, with a 24-hour emergency', [[432, 400], [560, 382], [520, 420]]],
    ['Clinic and pharmacy', 'health', 452, 452, [3, 4, null], 'Sector 109 market', [[430, 430], [452, 452]]],
    ['Sector 109 market', 'daily', 452, 452, [3, 4, null], 'Grocery, bakery, bank branches', [[430, 430], [452, 452]]],
    ['Hypermarket, Sector 104', 'daily', 330, 300, [10, 16, null], 'Open till 11 pm', [[432, 372], [410, 300], [330, 300]]],
    ['Mall and cinema, Sector 83', 'daily', 640, 470, [14, 22, null], 'Eight screens, food court', [[470, 470], [560, 470], [640, 470]]]
  ];
  var CATS = [['', 'All'], ['commute', 'Commute'], ['school', 'Schools'], ['health', 'Health'], ['daily', 'Daily needs']];
  var mode = 'off', cat = '', cur = 1;
  var pts = function (a) { return a.map(function (p) { return p.join(','); }).join(' '); };
  var path = function (a) { return 'M' + a.map(function (p) { return p.join(' '); }).join(' L'); };

  function map() {
    var s = '<svg class="map" viewBox="0 0 1000 720" role="img" aria-label="Schematic map of Sector 109 and the Dwarka Expressway with the selected route highlighted">';
    s += '<rect width="1000" height="720" fill="#12211A"/>';
    var r = A.rng(3);
    for (var gx = 0; gx < 1000; gx += 62) for (var gy = 0; gy < 720; gy += 54) { if (r() < 0.18) continue; s += '<rect class="sec-b" x="' + (gx + 4) + '" y="' + (gy + 4) + '" width="' + (52 + r() * 6).toFixed(0) + '" height="' + (44 + r() * 4).toFixed(0) + '" rx="3"/>'; }
    s += '<path class="green" d="M610 250 q60 -30 120 10 q30 60 -30 90 q-80 10 -90 -40z"/><path class="green" d="M140 560 q70 -40 140 0 q20 70 -60 90 q-90 0 -80 -90z"/>';
    s += '<path class="air" d="M600 20 h240 v120 h-240z"/><path d="M620 60 h200 M640 100 h180" stroke="#4A5A50" stroke-width="5"/><text class="rlab" x="610" y="44">IGI Airport</text>';
    [EXP, NH].forEach(function (rd) { s += '<polyline class="rd rd-case" points="' + pts(rd) + '"/>'; });
    s += '<polyline class="rd rd-x" points="' + pts(EXP) + '"/><polyline class="rd rd-x" points="' + pts(NH) + '"/>';
    s += '<polyline class="rd rd-m" points="' + pts(NPR) + '"/><polyline class="rd rd-m" points="' + pts(SPR) + '"/>';
    s += '<polyline class="rd rd-s" points="430,360 410,300 330,300"/><polyline class="rd rd-s" points="430,430 395,470 360,520"/><polyline class="rd rd-s" points="470,470 640,470"/><polyline class="rd rd-s" points="392,190 520,120 690,70"/><polyline class="rd rd-s" points="800,400 870,280"/>';
    s += '<polyline class="metro" points="' + pts(METRO) + '" style="stroke-dasharray:6 4"/>';
    METRO.forEach(function (p, i) { s += '<circle class="metro-st" cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i === 2 ? 5 : 3.5) + '"/>'; });
    s += '<text class="rlab" transform="translate(372 250) rotate(76)">Dwarka Expressway</text><text class="rlab" transform="translate(860 210) rotate(-58)">NH-48</text><text class="rlab" x="560" y="372">Northern Peripheral Rd</text>';
    s += '<text class="rlab mlab" x="452" y="346">Sector 109 metro (proposed)</text>';
    D.forEach(function (d, i) { s += '<g class="route-g" data-i="' + i + '"><path class="route" d="' + path([HOME].concat(d[6])) + '"/></g>'; });
    D.forEach(function (d, i) { s += '<g class="poi" data-i="' + i + '"><circle cx="' + d[2] + '" cy="' + d[3] + '" r="4.5"/></g>'; });
    s += '<g class="home"><circle class="pulse" cx="' + HOME[0] + '" cy="' + HOME[1] + '" r="10"/><circle cx="' + HOME[0] + '" cy="' + HOME[1] + '" r="9"/><text class="plab homel" x="' + (HOME[0] - 16) + '" y="' + (HOME[1] + 6) + '" text-anchor="end">Aaranya · Sector 109</text></g>';
    s += '<text class="plab" id="poi-l" x="0" y="0"></text>';
    return s + '</svg>';
  }
  var host = $('#map'); if (!host) return;
  host.innerHTML = map();
  var cats = $('#cats');
  cats.innerHTML = CATS.map(function (c) { return '<button type="button" class="chip" data-c="' + c[0] + '" aria-pressed="' + (c[0] === cat) + '">' + c[1] + '</button>'; }).join('');
  cats.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; cat = b.dataset.c; $$('.chip', cats).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); list(); });
  $$('.seg [data-m]').forEach(function (b) { b.addEventListener('click', function () { mode = b.dataset.m; $$('.seg [data-m]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); list(); }); });
  var dest = $('#dest');
  function t(d) { var v = d[4][mode === 'off' ? 0 : mode === 'peak' ? 1 : 2]; return v == null ? null : v; }
  function list() {
    var rows = D.map(function (d, i) { return [d, i]; }).filter(function (x) { return !cat || x[0][1] === cat; });
    dest.innerHTML = rows.map(function (x) {
      var d = x[0], v = t(d);
      return '<li><button type="button" data-i="' + x[1] + '" aria-pressed="' + (x[1] === cur) + '"><span>' + d[0] + '<em>' + d[5] + '</em></span><b>' + (v == null ? '<small>' + (mode === 'metro' ? 'drive only' : '') + '</small>' : v + '<small>min</small>') + '</b></button></li>';
    }).join('');
    show(cur);
  }
  function show(i) {
    cur = i;
    $$('.route-g', host).forEach(function (g) { g.classList.toggle('on', +g.dataset.i === i); });
    $$('.poi', host).forEach(function (g) { g.classList.toggle('on', +g.dataset.i === i); });
    $$('button', dest).forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.i === i)); });
    var d = D[i], l = $('#poi-l', host), right = d[2] > 760;
    l.setAttribute('x', d[2] + (right ? -10 : 10)); l.setAttribute('y', d[3] - 10); l.setAttribute('text-anchor', right ? 'end' : 'start');
    var v = t(d); l.textContent = d[0] + (v != null ? ' · ' + v + ' min' : '');
  }
  dest.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) show(+b.dataset.i); });
  host.addEventListener('click', function (e) { var g = e.target.closest('.poi'); if (g) { var i = +g.dataset.i; if (cat && D[i][1] !== cat) { cat = ''; $$('.chip', cats).forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.c === '')); }); list(); } show(i); } });
  list();
})();
