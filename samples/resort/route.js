/* Taradhura getting here: a drawn map (no map API) with three routes, legs and a weather table. */
(function () {
  'use strict';
  var TD = window.TD, ui = TD.ui, $ = ui.$, $$ = ui.$$, esc = ui.esc;
  var P = { delhi: [70, 520, 'New Delhi'], mbd: [270, 470, 'Moradabad'], rampur: [350, 430, 'Rampur'], pgh: [470, 410, 'Pantnagar airport'], hld: [540, 340, 'Haldwani'], kgm: [565, 312, 'Kathgodam station'], bhimtal: [612, 262, 'Bhimtal'], bhowali: [640, 236, 'Bhowali'], nainital: [600, 205, 'Nainital'], ramgarh: [700, 198, 'Ramgarh'], mkt: [770, 150, 'Mukteshwar'], td: [850, 128, 'Taradhura'] };
  var R = {
    train: { name: 'Overnight train + car', sum: 'Sleep on the train, breakfast on the deck', time: '≈ 9 h', path: ['delhi', 'mbd', 'rampur', 'hld', 'kgm'], car: ['kgm', 'bhimtal', 'bhowali', 'ramgarh', 'mkt', 'td'],
      legs: [['New Delhi station, overnight sleeper', '22:30'], ['Kathgodam, end of the line', '05:20'], ['Our driver meets you on the platform', '05:30'], ['Chai stop at Bhowali', '06:30'], ['Mukteshwar', '07:25'], ['Taradhura, breakfast on the deck', '07:50']] },
    fly: { name: 'Fly to Pantnagar + car', sum: 'The 1-hour flight, then the hills', time: '≈ 4 h 30 m', path: ['delhi', 'pgh'], car: ['pgh', 'hld', 'kgm', 'bhimtal', 'bhowali', 'ramgarh', 'mkt', 'td'],
      legs: [['Delhi airport', '11:30'], ['Pantnagar airport', '12:35'], ['Lunch stop at Bhimtal lake', '14:15'], ['Bhowali', '15:00'], ['Mukteshwar', '15:55'], ['Taradhura, for copper hour', '16:20']] },
    drive: { name: 'Drive from Delhi', sum: '330 km on good roads, last 9 km narrow', time: '≈ 8 h', path: [], car: ['delhi', 'mbd', 'rampur', 'hld', 'kgm', 'bhimtal', 'bhowali', 'ramgarh', 'mkt', 'td'],
      legs: [['Leave Delhi before the traffic', '05:30'], ['Breakfast after Moradabad', '08:15'], ['Haldwani, the hills begin', '10:45'], ['Bhowali', '12:00'], ['Mukteshwar', '13:10'], ['Taradhura', '13:35']] }
  };
  function pts(list) { return list.map(function (k) { return P[k][0] + ' ' + P[k][1]; }); }
  function curve(list) { var p = list.map(function (k) { return P[k]; }); var d = 'M' + p[0][0] + ' ' + p[0][1]; for (var i = 1; i < p.length; i++) { var a = p[i - 1], b = p[i], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - 8; d += ' Q' + mx + ' ' + my + ' ' + b[0] + ' ' + b[1]; } return d; }
  var svg = '<svg viewBox="0 0 940 580" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A drawn map from Delhi to Taradhura via Moradabad, Haldwani, Kathgodam, Bhowali and Mukteshwar">';
  for (var i = 0; i < 7; i++) svg += '<path class="ridge" d="M' + (480 + i * 30) + ' 600 C ' + (560 + i * 30) + ' ' + (420 - i * 30) + ', ' + (700 + i * 20) + ' ' + (300 - i * 30) + ', 960 ' + (220 - i * 26) + '"/>';
  svg += '<path class="river" d="M520 600 C 540 520, 600 470, 640 420 S 720 330, 760 300"/><text class="s" x="420" y="580">Plains</text><text class="s" x="760" y="560">Kumaon hills</text><text class="s" x="760" y="40">Himalaya ↑</text>';
  svg += '<path class="rail" d="' + curve(['delhi', 'mbd', 'rampur', 'hld', 'kgm']) + '"/>';
  svg += '<path class="road" d="' + curve(R.drive.car) + '" style="opacity:.25"/>';
  svg += '<path class="prog" id="prog" d=""/>';
  Object.keys(P).forEach(function (k) { var p = P[k]; svg += '<g class="stop' + (k === 'td' ? ' hl' : '') + '"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (k === 'td' ? 8 : 5) + '"/><text x="' + (p[0] + 12) + '" y="' + (p[1] + 4) + '"' + (k === 'td' ? ' style="font-weight:700"' : '') + '>' + esc(p[2]) + '</text></g>'; });
  svg += '<g transform="translate(40 40)"><path d="M0 18 L0 0 M-5 6 L0 0 L5 6" stroke="var(--ink)" fill="none" stroke-width="1.4"/><text x="10" y="6" class="s">N</text></g><text class="s" x="40" y="566">Not to scale</text></svg>';
  $('#map').innerHTML = svg;
  $('#routes').innerHTML = Object.keys(R).map(function (k, i) { var r = R[k]; return '<button type="button" data-r="' + k + '" aria-pressed="' + (i === 0) + '"><b>' + esc(r.name) + '</b><span>' + esc(r.sum) + '</span><em>' + r.time + '</em></button>'; }).join('');
  function show(k) {
    var r = R[k], prog = $('#prog');
    prog.setAttribute('d', curve(r.car));
    var len = prog.getTotalLength(); prog.style.strokeDasharray = len; prog.style.strokeDashoffset = ui.reduce ? 0 : len;
    if (!ui.reduce) { prog.getBoundingClientRect(); prog.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.65,0,.35,1)'; prog.style.strokeDashoffset = 0; }
    $$('#routes button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.r === k); });
    $('#legs').innerHTML = r.legs.map(function (l) { return '<li><b style="font-weight:500">' + esc(l[0]) + '</b><span>' + l[1] + '</span></li>'; }).join('');
  }
  $$('#routes button').forEach(function (b) { b.onclick = function () { show(b.dataset.r); }; });
  show('train');
  // weather
  var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var hi = [9, 11, 15, 19, 22, 22, 20, 19, 19, 17, 14, 11], lo = [-2, 0, 3, 7, 11, 14, 15, 15, 12, 8, 3, 0], rain = [4, 5, 4, 4, 7, 14, 23, 22, 13, 3, 1, 2], vis = [70, 60, 55, 45, 35, 20, 8, 10, 30, 85, 90, 80];
  var best = [0, 1, 9, 10, 11];
  function row(label, arr, unit) { return '<tr><th scope="row">' + label + '</th>' + arr.map(function (v, i) { return '<td' + (best.indexOf(i) >= 0 ? ' class="best"' : '') + '>' + v + (unit || '') + '</td>'; }).join('') + '</tr>'; }
  $('#wx').innerHTML = '<thead><tr><th scope="col"><span class="sr">Month</span></th>' + M.map(function (m, i) { return '<th scope="col"' + (best.indexOf(i) >= 0 ? ' class="best"' : '') + '>' + m + '</th>'; }).join('') + '</tr></thead><tbody>' + row('Day °C', hi, '°') + row('Night °C', lo, '°') + row('Rain days', rain) + row('Range visible', vis, '%') + row('Also', ['Snow', 'Snow', 'Buransh', 'Buransh', 'Apricots', 'Apricots', 'Monsoon', 'Monsoon', 'Clearing', 'Clearest', 'Clear', 'Festive'], '') + '</tbody>';
})();
