/* Sthira · build-cost estimator: city, type, area, floors, spec, extras -> range, cost by trade, programme Gantt with payment milestones.
   The formula itself is in cost.js. */
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

  // the formula lives in cost.js, shared with the home page
  var calc = window.SthiraCost.calc, range = window.SthiraCost.range;

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
