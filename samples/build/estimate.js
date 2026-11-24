/* Sthira · build-cost estimator: city, type, area, floors, spec, extras -> range, cost by trade, programme Gantt with payment milestones. */
(function () {
  'use strict';
  var D = window.STHIRA, A = window.App, $ = A.$, $$ = A.$$, esc = A.esc, inr = D.inr;
  var form = $('#est'); if (!form) return;
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  $('#e-city').innerHTML = D.CITIES.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('');
  $('#e-tiers').innerHTML = D.TIERS.map(function (t, i) { return '<label><input type="radio" name="tier" value="' + t.id + '"' + (i === 1 ? ' checked' : '') + '><span><b>' + t.name + '</b><small>₹' + t.rate.toLocaleString('en-IN') + ' / sq ft</small></span></label>'; }).join('');

  // restore from the URL (shareable estimates) or the last visit
  var q = new URLSearchParams(location.search), last = A.store.get('estimate', null);
  function setVal(name, v) { var els = form.elements[name]; if (!els || v == null) return; if (els.length && els[0] && els[0].type === 'radio') { $$('input[name=' + name + ']', form).forEach(function (r) { r.checked = r.value === String(v); }); } else if (els.type === 'checkbox') els.checked = v === true || v === '1'; else els.value = v; }
  var src = q.has('a') ? { city: q.get('c'), type: q.get('t'), area: q.get('a'), floors: q.get('f'), tier: q.get('s'), x: (q.get('x') || '').split(',') } : last;
  if (src) { setVal('city', src.city); setVal('type', src.type); setVal('area', src.area); setVal('floors', src.floors); setVal('tier', src.tier); if (src.x) ['basement', 'lift', 'interiors', 'solar', 'landscape', 'design'].forEach(function (k) { form.elements[k].checked = src.x.indexOf(k) > -1; }); }

  function read() {
    var f = form.elements;
    return { city: f.city.value, type: form.querySelector('[name=type]:checked').value, area: +f.area.value, floors: +form.querySelector('[name=floors]:checked').value, tier: form.querySelector('[name=tier]:checked').value,
      x: ['basement', 'lift', 'interiors', 'solar', 'landscape', 'design'].filter(function (k) { return f[k].checked; }) };
  }

  function calc(s) {
    var city = D.CITIES.filter(function (c) { return c.id === s.city; })[0], tier = D.TIERS.filter(function (t) { return t.id === s.tier; })[0];
    var rate = tier.rate * city.k * (s.type === 'commercial' ? 1.06 : 1) * (1 + Math.max(0, s.floors - 2) * 0.025);
    var build = rate * s.area, extras = [];
    var plate = s.area / s.floors;
    if (s.x.indexOf('basement') > -1) extras.push(['Basement (one level)', plate * 2400 * city.k]);
    if (s.x.indexOf('lift') > -1) extras.push(['Passenger lift, ' + (s.floors + 1) + ' stops', 900000 + s.floors * 85000]);
    if (s.x.indexOf('interiors') > -1) extras.push(['Interiors and joinery', s.area * tier.int * city.k * 0.85]);
    if (s.x.indexOf('solar') > -1) extras.push(['Rooftop solar, 5 kW', 340000]);
    if (s.x.indexOf('landscape') > -1) extras.push(['Landscape', Math.max(250000, plate * 0.6 * 420)]);
    if (s.x.indexOf('design') > -1) extras.push(['Design and approvals', build * 0.045]);
    var total = build + extras.reduce(function (a, e) { return a + e[1]; }, 0);
    // programme in weeks
    var w = {
      design: s.x.indexOf('design') > -1 ? 10 : 0,
      found: 4 + Math.ceil(plate / 1500) + (s.x.indexOf('basement') > -1 ? 6 : 0),
      frame: s.floors * 3 + 1,
      walls: 4 + Math.ceil(s.area / 1800),
      mep: 8 + Math.ceil(s.area / 1500),
      facade: 4 + Math.ceil(s.floors * 0.8),
      finish: 8 + Math.ceil(s.area / 1400) + (s.x.indexOf('interiors') > -1 ? 6 : 0),
      land: s.x.indexOf('landscape') > -1 ? 4 : 2,
    };
    var tasks = [], t = 0;
    function add(name, start, len, hv) { tasks.push({ name: name, s: start, l: len, hv: hv }); return start + len; }
    var a = add('Design and approvals', 0, w.design, false);
    var b = add('Foundation', a, w.found);
    var c = add('Frame: columns and slabs', b, w.frame);
    var d = add('Walls', c - 1, w.walls);
    var e = add('MEP rough-in', d - Math.ceil(w.walls / 2), w.mep);
    add('Windows and facade', d, w.facade);
    var g = add('Flooring and finishes', e - 3, w.finish);
    var h = add('Landscape, snag, handover', g - 1, w.land + 2, true);
    var weeks = h, months = Math.ceil(weeks / 4.33);
    var pays = [0, a + 0.1, b, b + Math.round(w.frame / 2), c, d + 1, e, g, h].map(function (x) { return x; });
    return { rate: rate, total: total, build: build, extras: extras, tasks: tasks, weeks: weeks, months: months, pays: pays, city: city, tier: tier };
  }

  var bars = $('#o-bars'), grid = $('#g-grid');
  function render() {
    var s = read(), r = calc(s);
    $('#e-area-o').textContent = s.area.toLocaleString('en-IN');
    $('#e-area').style.setProperty('--v', ((s.area - 800) / (20000 - 800) * 100) + '%');
    $('#e-area-h').textContent = 'About ' + Math.round(s.area * 0.0929).toLocaleString('en-IN') + ' m², ' + Math.round(s.area / s.floors).toLocaleString('en-IN') + ' sq ft a floor.';
    $('#e-tier-note').textContent = r.tier.note + '.';
    var lo = r.total * 0.94, hi = r.total * 1.08;
    $('#o-total').textContent = range(lo, hi);
    $('#o-psf').textContent = '₹' + Math.round(r.rate / 10) * 10 + ' / sq ft construction · ' + r.city.name + ' · ' + r.tier.name;
    $('#o-months').textContent = r.months + ' months' + (s.x.indexOf('design') > -1 ? ', including ' + Math.round(10 / 4.33) + ' for design' : '');
    var hand = new Date(2026, 11 + r.months, 1);
    $('#o-hand').textContent = MONTHS[hand.getMonth()] + ' ' + hand.getFullYear();
    var rows = D.TRADES.map(function (tr) { return [tr[0], r.build * tr[1]]; }).concat(r.extras);
    var max = Math.max.apply(null, rows.map(function (x) { return x[1]; }));
    bars.innerHTML = rows.map(function (x) { return '<li><span>' + esc(x[0]) + '</span><span class="v num">' + inr(x[1]) + '</span><span class="b"><i style="width:' + (x[1] / max * 100).toFixed(1) + '%"></i></span></li>'; }).join('');
    // gantt
    var M = r.months, W = r.weeks;
    grid.style.setProperty('--m', M);
    var lanes = r.tasks.filter(function (t) { return t.l > 0; }).map(function (t) {
      return '<span class="lab">' + esc(t.name) + '</span><span class="lane" style="--m:' + M + '"><i class="bar' + (t.hv ? ' hv' : '') + '" style="left:' + (t.s / W * 100).toFixed(2) + '%;width:' + (t.l / W * 100).toFixed(2) + '%" title="' + esc(t.name) + ': weeks ' + (t.s + 1) + '–' + (t.s + t.l) + '"></i></span>';
    });
    lanes.push('<span class="lab">Payments</span><span class="lane" style="--m:' + M + '">' + r.pays.map(function (p) { return '<i class="bar pay" style="left:' + (Math.min(p, W) / W * 100).toFixed(2) + '%"></i>'; }).join('') + '</span>');
    var start = new Date(2026, 11, 1), ms = [];
    for (var i = 0; i <= M; i += Math.max(1, Math.round(M / 6))) { var dd = new Date(start.getFullYear(), start.getMonth() + i, 1); ms.push('<span>' + MONTHS[dd.getMonth()] + (dd.getMonth() === 0 || i === 0 ? ' ’' + String(dd.getFullYear()).slice(2) : '') + '</span>'); }
    grid.innerHTML = lanes.join('') + '<div class="gantt-months">' + ms.join('') + '</div>';
    A.store.set('estimate', s);
    current = { s: s, r: r, lo: lo, hi: hi };
  }
  function range(lo, hi) {
    if (hi >= 1e7) return '₹' + (lo / 1e7).toFixed(2) + '–' + (hi / 1e7).toFixed(2) + ' Cr';
    return '₹' + Math.round(lo / 1e5) + '–' + Math.round(hi / 1e5) + ' L';
  }
  var current = null;
  form.addEventListener('input', render); form.addEventListener('change', render);
  render();

  // share link
  $('#o-copy').addEventListener('click', function () {
    var s = current.s, u = location.origin + location.pathname + '?c=' + s.city + '&t=' + s.type + '&a=' + s.area + '&f=' + s.floors + '&s=' + s.tier + '&x=' + s.x.join(',');
    history.replaceState(null, '', u);
    (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { A.toast('Link copied. Anyone with it sees <b>this exact estimate</b>.'); }, function () { A.toast('The address bar now holds a link to this estimate.'); });
  });

  // send -> back office
  var dlg = $('#dlg-send'), fs = $('#f-send');
  $('#o-send').addEventListener('click', function () {
    var c = current; $('#ds-sum').textContent = c.s.area.toLocaleString('en-IN') + ' sq ft · ' + ['G', 'G+1', 'G+2', 'G+3', 'G+4'][c.s.floors - 1] + ' · ' + c.r.city.name + ' · ' + c.r.tier.name + ' · ' + range(c.lo, c.hi) + ' · ' + c.r.months + ' months';
    fs.hidden = false; $('#ds-done').hidden = true; dlg.showModal();
  });
  $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  fs.addEventListener('submit', function (e) {
    e.preventDefault(); if (!A.validate(fs)) return;
    var d = Object.fromEntries(new FormData(fs).entries()), c = current;
    var l = A.addLead({ name: d.name, email: d.email, phone: d.phone, city: c.r.city.name, loc: d.loc, type: c.s.type === 'commercial' ? 'Commercial' : 'Residential', area: c.s.area, floors: ['G', 'G+1', 'G+2', 'G+3', 'G+4'][c.s.floors - 1], budget: range(c.lo, c.hi), source: 'Estimator', note: 'Estimator: ' + c.r.tier.name + ', ' + c.s.area + ' sq ft, ' + c.r.months + ' months. Wants to start: ' + d.when.toLowerCase() + '.', estimate: { tier: c.s.tier, area: c.s.area, floors: c.s.floors, city: c.s.city, lo: c.lo, hi: c.hi, x: c.s.x } });
    fs.hidden = true; $('#ds-done').hidden = false; $('#ds-ref').textContent = 'Reference ' + l.id + '. Your estimate is attached, so the engineer who calls will already know the numbers.';
    A.toast('Estimate sent as <b>' + l.id + '</b>.');
  });
})();
