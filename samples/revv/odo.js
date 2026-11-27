/* Revv odometer story: kilometres against date from every service stamp, registration to inspection. An honest vehicle draws a
   straight-ish line and gets "No rollback found" under it. window.Odo.stamps(listing) -> [{date, km, label, where}], Odo.mount(host, listing) */
(function () {
  'use strict';
  var R = window.Revv, MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function stamps(l) {
    var rg = R.reg(l), mi = Math.max(0, MON.indexOf(rg.month)), reg = new Date(l.year, mi, 12);
    var rep = R.inspection ? R.inspection(l) : null, end = rep ? rep.date : new Date(), span = Math.max(30 * 864e5, end - reg), r = R.rng(l.id + 'odo');
    var svc = R.service(l).slice().sort(function (a, b) { return a.km - b.km; }).filter(function (s) { return s.km > 0 && s.km < l.km; });
    var out = [{ date: reg, km: 0, label: 'First registered', where: rg.rto, kind: 'reg' }];
    svc.forEach(function (s) { out.push({ date: new Date(reg.getTime() + span * (s.km / l.km) + (r() - 0.5) * 24 * 864e5), km: s.km, label: s.job, where: s.where, kind: 'svc' }); });
    out.push({ date: end, km: l.km, label: 'Revv 150-point inspection', where: rep ? rep.inspector : 'Revv', kind: 'insp' });
    for (var i = 1; i < out.length; i++) if (out[i].date <= out[i - 1].date) out[i].date = new Date(out[i - 1].date.getTime() + 21 * 864e5);
    return out;
  }
  function honest(st) { for (var i = 1; i < st.length; i++) if (st[i].km < st[i - 1].km) return false; return true; }
  function mount(host, l) {
    if (!host) return; var st = stamps(l), ok = honest(st), t0 = st[0].date.getTime(), t1 = st[st.length - 1].date.getTime(), kmax = Math.max(1000, l.km);
    var W = 600, H = 230, P = { l: 56, r: 16, t: 16, b: 34 }, X = function (d) { return P.l + (d - t0) / Math.max(1, t1 - t0) * (W - P.l - P.r); }, Y = function (k) { return H - P.b - k / kmax * (H - P.t - P.b); };
    var yrs = Math.max(0.3, (t1 - t0) / (365.25 * 864e5)), perYear = Math.round(l.km / yrs / 100) * 100;
    var path = st.map(function (s, i) { return (i ? 'L' : 'M') + X(s.date).toFixed(1) + ' ' + Y(s.km).toFixed(1); }).join('');
    var ticks = '', y0 = new Date(t0).getFullYear(), y1 = new Date(t1).getFullYear();
    for (var y = y0 + 1; y <= y1; y++) { var tx = X(new Date(y, 0, 1)); if (tx > P.l + 8 && tx < W - P.r) ticks += '<line class="g" x1="' + tx.toFixed(1) + '" y1="' + P.t + '" x2="' + tx.toFixed(1) + '" y2="' + (H - P.b) + '"/><text x="' + tx.toFixed(1) + '" y="' + (H - 12) + '" text-anchor="middle">' + y + '</text>'; }
    [0, 0.5, 1].forEach(function (f) { var k = Math.round(kmax * f / 1000) * 1000, ty = Y(k); ticks += '<line class="g" x1="' + P.l + '" y1="' + ty.toFixed(1) + '" x2="' + (W - P.r) + '" y2="' + ty.toFixed(1) + '"/><text x="' + (P.l - 8) + '" y="' + (ty + 4).toFixed(1) + '" text-anchor="end">' + (k ? (k / 1000).toLocaleString('en-IN') + 'k' : '0') + '</text>'; });
    var dots = st.map(function (s) { return '<circle class="' + s.kind + '" cx="' + X(s.date).toFixed(1) + '" cy="' + Y(s.km).toFixed(1) + '" r="' + (s.kind === 'svc' ? 4.5 : 6) + '"><title>' + R.esc(s.date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) + ' · ' + R.km(s.km) + ' · ' + s.label) + '</title></circle>'; }).join('');
    host.classList.add('odo-story');
    host.innerHTML = '<p class="k">Odometer story · ' + (st.length - 2) + ' service stamp' + (st.length - 2 === 1 ? '' : 's') + '</p>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Kilometres against date, from registration to the Revv inspection: ' + R.esc(st.map(function (s) { return s.date.getFullYear() + ', ' + R.km(s.km); }).join('; ')) + '">' + ticks +
      '<path class="ln" d="' + path + '"/>' + dots + '</svg>' +
      '<p class="odo-v ' + (ok ? 'ok' : 'bad') + '">' + (ok ? '<b>No rollback found.</b> Every stamp reads higher than the one before, about ' + perYear.toLocaleString('en-IN') + ' km a year.' : '<b>Check this one.</b> A stamp reads lower than the one before it.') + '</p>';
  }
  window.Odo = { stamps: stamps, mount: mount };
})();
