/* Aaranya · payment plans: a schedule tied to real slab progress, an itemised cost sheet and an EMI calculator. */
(function () {
  'use strict';
  var A = window.AAR, $ = A.$, $$ = A.$$;
  var sel = $('#pay-unit'), own = $('#pay-own');
  var plan = 'clp';
  var avail = A.UNITS.filter(function (u) { return A.status(u.id) !== 'sold'; });
  var want = A.qs('unit');
  var start = (want && A.unit(want)) ? want : (A.status('S-1802') !== 'sold' ? 'S-1802' : avail[0].id);
  sel.innerHTML = A.TOWERS.map(function (T) {
    return '<optgroup label="' + T.name + '">' + avail.filter(function (u) { return u.tower === T.id; }).sort(function (a, b) { return b.floor - a.floor; }).map(function (u) {
      return '<option value="' + u.id + '"' + (u.id === start ? ' selected' : '') + '>' + u.id + ' · ' + A.TYPES[u.type].short + ' · ' + A.inr(A.price(u).total) + (A.status(u.id) === 'hold' ? ' (on hold)' : '') + '</option>';
    }).join('') + '</optgroup>';
  }).join('');
  if (want && A.unit(want) && A.status(want) === 'sold') A.toast(want + ' is sold; showing it anyway so you can see the numbers.');
  if (want && A.unit(want) && !sel.querySelector('option[value="' + want + '"]')) { var o = document.createElement('option'); o.value = want; o.textContent = want + ' (sold)'; o.selected = true; sel.prepend(o); }

  var DUTY = { m: 0.07, f: 0.05, j: 0.06 };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function est(slab, done, cycle) { var d = new Date(2026, 10, 15); d.setDate(d.getDate() + Math.max(0, slab - done) * cycle); return MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }

  function schedule(u, pr) {
    var T = A.tower(u.tower), done = A.PROGRESS[u.tower], top = T.floors, cyc = u.tower === 'K' ? 8 : 9;
    var base = pr.preGst - pr.ifms - (plan === 'dp' ? Math.round(pr.basic * 0.06) : 0); // agreement value before GST and IFMS
    var rows;
    if (plan === 'clp') rows = [['On booking', 10, 0], ['Within 45 days of booking', 10, 0], ['On the raft foundation', 10, 0.01], ['On the podium slab', 7.5, 0.02],
      ['On the ' + A.ord(Math.round(top * 0.25)) + ' slab', 7.5, Math.round(top * 0.25)], ['On the ' + A.ord(Math.round(top * 0.5)) + ' slab', 7.5, Math.round(top * 0.5)], ['On the ' + A.ord(Math.round(top * 0.75)) + ' slab', 7.5, Math.round(top * 0.75)],
      ['On the top slab', 10, top], ['On blockwork of the home', 10, top + 3], ['On flooring and finishes', 10, top + 9], ['On the offer of possession', 10, top + 20]];
    else if (plan === 'pl') rows = [['On booking', 10, 0], ['Within 60 days of booking', 20, 0], ['On the top slab', 40, top], ['On the offer of possession', 30, top + 20]];
    else rows = [['On booking', 10, 0], ['Within 45 days of booking', 85, 0], ['On the offer of possession', 5, top + 20]];
    var nextSet = false, sum = 0;
    var body = rows.map(function (r) {
      var amt = Math.round(base * r[1] / 100 * (plan === 'dp' ? 1 : 1)), gst = Math.round(amt * 0.05);
      var reached = r[2] < 1 || r[2] <= done, cls = '', when;
      if (r[2] === 0) when = r[0].indexOf('45') > 0 || r[0].indexOf('60') > 0 ? 'Fixed date' : 'Today';
      else if (reached) { cls = 'reached'; when = 'Reached · due at booking'; }
      else { when = 'Est. ' + est(r[2], done, cyc); if (!nextSet) { cls = 'next'; nextSet = true; } }
      sum += amt + gst;
      return '<tr class="' + cls + '"><td>' + r[0] + '</td><td class="r mono">' + r[1] + '%</td><td class="r mono">' + A.inrFull(amt + gst) + '</td><td>' + when + '</td></tr>';
    }).join('');
    $('#ms').innerHTML = '<caption class="vh">Payment schedule for ' + u.id + '</caption><thead><tr><th scope="col">Milestone</th><th class="r" scope="col">Share</th><th class="r" scope="col">Amount incl. GST</th><th scope="col">When</th></tr></thead><tbody>' + body + '</tbody>' +
      '<tfoot><tr><td>Total' + (plan === 'dp' ? ' (after the 6% discount on basic)' : '') + '</td><td class="r mono">100%</td><td class="r mono">' + A.inrFull(sum) + '</td><td></td></tr></tfoot>';
  }
  function cost(u, pr) {
    var t = A.TYPES[u.type], disc = plan === 'dp' ? Math.round(pr.basic * 0.06) : 0;
    var gst = Math.round((pr.basic - disc + pr.parking + pr.club) * 0.05);
    var total = pr.basic - disc + pr.parking + pr.club + pr.ifms + gst;
    var duty = Math.round((pr.basic - disc + pr.parking + pr.club) * DUTY[own.value]), reg = 50000;
    $('#cs').innerHTML = '<p class="k" style="margin-bottom:10px">' + u.id + ' · ' + t.short + ' · ' + A.sqft(t.carpet) + ' · ' + u.facing + ' facing</p><table>' +
      '<tr><td>Basic (' + A.inrFull(pr.base) + ' × ' + t.carpet + ' sq ft)</td><td>' + A.inrFull(pr.base * t.carpet) + '</td></tr>' +
      (pr.floorPLC ? '<tr><td>Floor rise</td><td>' + A.inrFull(pr.floorPLC * t.carpet) + '</td></tr>' : '') +
      (pr.plc ? '<tr><td>Location premium</td><td>' + A.inrFull(pr.plc * t.carpet) + '</td></tr>' : '') +
      (disc ? '<tr><td>Down-payment discount (6% of basic)</td><td>− ' + A.inrFull(disc) + '</td></tr>' : '') +
      '<tr><td>Covered parking × ' + t.parking + '</td><td>' + A.inrFull(pr.parking) + '</td></tr><tr><td>Club membership</td><td>' + A.inrFull(pr.club) + '</td></tr>' +
      '<tr><td>IFMS (₹150 per sq ft)</td><td>' + A.inrFull(pr.ifms) + '</td></tr><tr><td>GST at 5%</td><td>' + A.inrFull(gst) + '</td></tr>' +
      '<tr class="t"><td>Paid to Aaranya</td><td>' + A.inrFull(total) + '</td></tr>' +
      '<tr><td>Stamp duty (' + Math.round(DUTY[own.value] * 100) + '%), paid to the state</td><td>' + A.inrFull(duty) + '</td></tr><tr><td>Registration fee</td><td>' + A.inrFull(reg) + '</td></tr>' +
      '<tr class="t"><td>Total cost of ownership</td><td>' + A.inrFull(total + duty + reg) + '</td></tr></table>' +
      '<p class="muted" style="font-size:12px;margin-top:10px">Indicative until signed. Generated ' + A.fmtDay(Date.now(), { day: 'numeric', month: 'short', year: 'numeric' }) + '.</p>';
    $('#cs-visit').href = 'visit.html?unit=' + u.id;
    return total;
  }
  // EMI
  var L = $('#emi-l'), Rt = $('#emi-r'), Tn = $('#emi-t');
  function emi() {
    var P = +L.value, r = +Rt.value / 1200, n = +Tn.value * 12;
    var e = r ? P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : P / n, tot = e * n, int = tot - P;
    $('#emi-lo').textContent = A.inr(P); $('#emi-ro').textContent = (+Rt.value).toFixed(2) + '%'; $('#emi-to').textContent = Tn.value + ' years';
    $('#emi-v').textContent = A.inrFull(e);
    $('#emi-p').style.width = (P / tot * 100).toFixed(1) + '%'; $('#emi-i').style.width = (int / tot * 100).toFixed(1) + '%';
    $('#emi-pv').textContent = A.inr(P); $('#emi-iv').textContent = A.inr(int);
    // balance by year
    var bal = P, pts = [[0, P]];
    for (var y = 1; y <= +Tn.value; y++) { for (var m = 0; m < 12; m++) { bal = bal * (1 + r) - e; } pts.push([y, Math.max(0, bal)]); }
    var W = 600, H = 150, X = function (y) { return 30 + y / +Tn.value * (W - 40); }, Y = function (v) { return 10 + (1 - v / P) * (H - 30); };
    var d = 'M' + pts.map(function (p) { return X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join(' L');
    var s = '<path d="' + d + ' L' + X(+Tn.value) + ' ' + Y(0) + ' L' + X(0) + ' ' + Y(0) + 'Z" fill="rgba(28,49,37,.12)"/><path d="' + d + '" fill="none" stroke="#1C3125" stroke-width="2"/>';
    s += '<line x1="30" x2="' + (W - 10) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="rgba(22,32,26,.3)"/>';
    [0, Math.round(+Tn.value / 2), +Tn.value].forEach(function (y) { s += '<text x="' + X(y) + '" y="' + (H + 6) + '" text-anchor="middle" style="font:500 11px var(--mono);fill:#596158">Year ' + y + '</text>'; });
    s += '<text x="30" y="10" style="font:500 11px var(--mono);fill:#596158">' + A.inr(P) + ' owed</text>';
    $('#amort').innerHTML = s;
  }
  [L, Rt, Tn].forEach(function (i) { i.addEventListener('input', emi); });

  function all(resetLoan) {
    var u = A.unit(sel.value), pr = A.price(u);
    schedule(u, pr); var total = cost(u, pr);
    if (resetLoan) { L.value = Math.round(total * 0.8 / 1e5) * 1e5; }
    emi();
  }
  sel.addEventListener('change', function () { all(true); history.replaceState(null, '', '?unit=' + sel.value); });
  own.addEventListener('change', function () { all(false); });
  $$('#plans .plan-card').forEach(function (b) { b.addEventListener('click', function () { plan = b.dataset.p; $$('#plans .plan-card').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); all(false); }); });
  $('#print').addEventListener('click', function () { print(); });
  all(true);
})();
