/* Forge member app (demo, mobile-first): QR check-in pass, bookings + waitlist, PR log with chart,
   HYROX plan, freeze, invoices, refer a friend. Everything is localStorage and shows up in staff.html. */
(function () {
  'use strict';
  var F = window.Forge, $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = F.esc, I = F.ICON, app = $('#app'), tab = 'today', bookDay = 0, bookBr = '', prLift = 'Back squat', planWeek = 0;
  var ICO = {
    today: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 18h3v3h-3z"/></svg>',
    book: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    progress: '<svg viewBox="0 0 24 24"><path d="M3 20h18M5 16l5-5 4 3 6-8"/></svg>',
    plan: '<svg viewBox="0 0 24 24"><path d="M5 4h14v17H5zM9 9h6M9 13h6M9 17h3"/></svg>',
    account: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>'
  };
  function me() { return F.member(); }
  function save(m) { F.set('session', m); }
  function myBookings() { var m = me(); return F.get('bookings', []).filter(function (b) { return b.memberNo === m.memberNo || b.name === m.name; }); }
  function qrSvg(text, cell) { if (!window.qrcode) return ''; var q = window.qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: cell || 6, margin: 0, scalable: true }); }
  function sessionFor(b) { var d = new Date(b.date + 'T00:00'); return F.sessions(d).filter(function (s) { return s.id === b.slot; })[0]; }

  /* ---------------- sign in ---------------- */
  function login() {
    app.innerHTML = '<div class="ap-login"><div class="ap-brand"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h18v4H8v3h10v4H8v7H3z"/></svg><span>Forge</span></div>' +
      '<h2>Sign in to <em>your week.</em></h2><p class="ap-muted">Your bookings, pass and progress, in one place.</p>' +
      '<form class="ap-form" id="signIn"><label class="fld"><span>Mobile number</span><input name="ph" value="+91 98••• ••417" readonly aria-readonly="true"></label><label class="fld"><span>One-time code</span><input name="otp" value="• • • • • •" readonly aria-readonly="true"></label>' +
      '<button class="btn volt big-btn" type="submit" id="demoIn"><span>Sign in</span><span class="arr" aria-hidden="true">→</span></button></form>' +
      '<a class="btn ghost big-btn" href="membership.html#signup"><span>New here? Join Forge</span></a>' +
      '<p class="ap-muted mono">Aanya Kapoor · Club · Saket · FM-20417</p></div>';
    $('#signIn').addEventListener('submit', function (e) { e.preventDefault();
      var m = Object.assign({}, F.DEMO_MEMBER, { invoices: seedInvoices() });
      save(m); seedDemoBooking(m); render();
      F.toast('Signed in as ' + esc(m.name) + '.');
    });
  }
  function seedInvoices() { var out = []; for (var k = 0; k < 6; k++) { var d = new Date(); d.setMonth(d.getMonth() - k); d.setDate(4); out.push({ no: 'INV-20417-' + F.pad(24 - k), date: F.iso(d), amount: 6500, desc: 'Club · monthly', method: k % 2 ? 'Card' : 'UPI' }); } return out; }
  function seedDemoBooking(m) {
    if (myBookings().some(function (b) { return new Date(b.date + 'T' + b.time) > new Date(); })) return;
    for (var k = 0; k < 3; k++) { var d = new Date(); d.setDate(d.getDate() + k); var s = F.sessions(d).filter(function (x) { return !x.past && x.left > 0 && x.branch === m.home; })[0]; if (s) { var r = F.book(s, { name: m.name, phone: m.phone }); r.memberNo = m.memberNo; var l = F.get('bookings', []); l[l.length - 1] = r; F.set('bookings', l); return; } }
  }

  /* ---------------- shell ---------------- */
  function render() {
    var m = me(); if (!m) return login();
    var views = { today: today, book: book, progress: progress, plan: plan, account: account };
    app.innerHTML = '<header class="ap-top"><div><p class="mono ap-muted">' + esc(m.memberNo) + ' · ' + esc(m.plan) + '</p><h2>' + (tab === 'today' ? greet() + ', ' + esc(m.name.split(' ')[0]) : { book: 'Book a class', progress: 'Progress', plan: 'HYROX plan', account: 'Account' }[tab]) + '</h2></div><span class="ap-av" aria-hidden="true">' + esc(m.name.split(' ').map(function (x) { return x[0]; }).join('').slice(0, 2)) + '</span></header>' +
      '<div class="ap-view" id="view"></div>' +
      '<nav class="ap-tabs" aria-label="Member app">' + ['today', 'book', 'progress', 'plan', 'account'].map(function (t) { return '<button type="button" data-tab="' + t + '"' + (t === tab ? ' aria-current="page" class="on"' : '') + '>' + ICO[t] + '<span>' + t[0].toUpperCase() + t.slice(1) + '</span></button>'; }).join('') + '</nav>';
    views[tab]($('#view'));
    if (m.fresh) { m.fresh = false; save(m); F.toast('Welcome, ' + esc(m.name.split(' ')[0]) + '. Your pass is ready.'); }
  }
  app.addEventListener('click', function (e) { var t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; render(); app.scrollTop = 0; } });
  function greet() { var h = new Date().getHours(); return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'; }

  /* ---------------- today ---------------- */
  function today(v) {
    var m = me(), now = new Date(), up = myBookings().filter(function (b) { return new Date(b.date + 'T' + b.time) > new Date(now - 60 * 60000); }).sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
    var nb = up[0], s = nb && sessionFor(nb), html = '';
    if (nb && s) {
      var start = new Date(nb.date + 'T' + nb.time), mins = Math.round((start - now) / 60000);
      var when = mins <= 0 ? 'On now' : mins < 60 ? 'Starts in ' + mins + ' min' : mins < 24 * 60 ? 'Starts in ' + Math.floor(mins / 60) + ' h ' + (mins % 60) + ' min' : F.nice(nb.date) + ' · ' + nb.time;
      html += '<section class="ap-pass" aria-label="Check-in pass"><div class="ap-pass-h"><span class="mono">Check-in pass</span><span class="chip">' + esc(when) + '</span></div>' +
        '<div class="ap-qr" role="img" aria-label="QR code for checking in to ' + esc(s.cls.name) + '">' + qrSvg('FORGE:CHECKIN:' + m.memberNo + ':' + nb.slot, 7) + '</div>' +
        '<h3>' + esc(s.cls.name) + '</h3><p class="mono">' + F.nice(nb.date) + ' · ' + nb.time + ' · ' + F.branches[nb.branch].name + ' · ' + esc(s.coach.name) + '</p>' +
        '<p class="ap-muted">Show this at the desk, or scan it at the gate. Turn your screen brightness up.</p>' +
        '<div class="ap-row"><button class="btn ghost sm" type="button" data-ics><span>Add to calendar</span></button><button class="btn ghost sm" type="button" data-cancel="' + esc(nb.slot) + '"><span>Cancel</span></button></div></section>';
    } else {
      html += '<section class="ap-card ap-empty">' + I.empty + '<div><b>Nothing booked today</b><p class="ap-muted">Book a class and your check-in pass appears here.</p><button class="btn volt sm" type="button" data-tab="book"><span>Book a class</span></button></div></section>';
    }
    var days = [0, 1, 2, 3, 4, 5, 6].map(function (k) { var d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + k); return d; });
    var trained = [0, 2, 3].concat(new Date().getDay() === 1 ? [] : []);
    html += '<section class="ap-card"><div class="ap-card-h"><b>This week</b><span class="mono ap-muted">3 of 4 planned</span></div><ol class="ap-week">' + days.map(function (d, i) { var isToday = F.iso(d) === F.iso(new Date()); var done = trained.indexOf(i) > -1 && d < new Date(); return '<li class="' + (done ? 'did' : '') + (isToday ? ' today' : '') + '"><span class="mono">' + F.DAYS[i][0] + '</span><i></i></li>'; }).join('') + '</ol><p class="ap-muted mono">Streak: 14 weeks at 3+ sessions</p></section>';
    if (up.length > 1) html += '<section class="ap-card"><div class="ap-card-h"><b>Coming up</b></div>' + up.slice(1, 4).map(function (b) { var ss = sessionFor(b); return ss ? '<div class="ap-li"><span class="t">' + b.time + '</span><div><b>' + esc(ss.cls.name) + '</b><p class="mono ap-muted">' + F.nice(b.date) + ' · ' + F.branches[b.branch].name + '</p></div></div>' : ''; }).join('') + '</section>';
    var mem = new Date(m.renews), dl = Math.round((mem - new Date()) / 864e5);
    html += '<section class="ap-card"><div class="ap-card-h"><b>Membership</b><span class="chip ' + (m.frozen ? 'warn' : 'ok') + '">' + (m.frozen ? 'Freeze requested' : 'Active') + '</span></div><p>' + esc(m.plan) + ' · ' + F.branches[m.home].name + ' · renews ' + F.nice(m.renews) + (dl >= 0 && dl <= 10 ? ' <span class="mono ap-warn">in ' + dl + ' days</span>' : '') + '</p></section>';
    v.innerHTML = html;
  }
  app.addEventListener('click', function (e) {
    var c = e.target.closest('[data-cancel]');
    if (c) { var slot = c.dataset.cancel, s = F.sessions(new Date(slot.split('|')[0] + 'T00:00')).filter(function (x) { return x.id === slot; })[0]; F.cancel(slot); promoteNotice(slot); render(); F.toast('Cancelled' + (s ? ' ' + esc(s.cls.name) + ', ' + s.time : '') + '. Your spot went to the waitlist.'); }
    if (e.target.closest('[data-ics]')) ics();
  });
  function promoteNotice(slot) { var w = F.waitlist().filter(function (x) { return x.slot === slot && !x.promoted; }); if (w.length) { /* staff promotes from the back office */ } }
  function ics() {
    var b = myBookings().sort(function (a, c) { return (a.date + a.time) < (c.date + c.time) ? -1 : 1; }).filter(function (x) { return new Date(x.date + 'T' + x.time) > new Date(Date.now() - 36e5); })[0]; if (!b) return;
    var s = sessionFor(b), st = b.date.replace(/-/g, '') + 'T' + b.time.replace(':', '') + '00', en = new Date(new Date(b.date + 'T' + b.time).getTime() + s.cls.mins * 60000);
    var ends = F.iso(en).replace(/-/g, '') + 'T' + F.pad(en.getHours()) + F.pad(en.getMinutes()) + '00';
    var body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Forge Athletic Club//EN', 'BEGIN:VEVENT', 'UID:' + b.id + '@forge.example', 'DTSTART:' + st, 'DTEND:' + ends, 'SUMMARY:' + s.cls.name + ' · Forge ' + F.branches[b.branch].name, 'LOCATION:' + F.branches[b.branch].addr, 'DESCRIPTION:Coach ' + s.coach.name + '. Arrive 10 minutes early.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' })); a.download = 'forge-' + s.cls.id + '-' + b.date + '.ics'; document.body.appendChild(a); a.click(); a.remove();
    F.toast('Calendar file downloaded.');
  }

  /* ---------------- book ---------------- */
  function book(v) {
    var m = me(), d = new Date(); d.setDate(d.getDate() + bookDay);
    var mine = myBookings().map(function (b) { return b.slot; }), wl = F.waitlist().filter(function (w) { return w.name === m.name && !w.promoted; });
    var list = F.sessions(d).filter(function (s) { return (!bookBr || s.branch === bookBr) && (!s.past || s.live); });
    var strip = [0, 1, 2, 3, 4, 5, 6].map(function (k) { var x = new Date(); x.setDate(x.getDate() + k); return '<button type="button" data-day="' + k + '" class="' + (k === bookDay ? 'on' : '') + '" aria-pressed="' + (k === bookDay) + '"><span class="mono">' + (k ? F.DAYS[F.dow(x)] : 'Today') + '</span><b>' + x.getDate() + '</b></button>'; }).join('');
    v.innerHTML = '<div class="ap-days">' + strip + '</div><div class="seg ap-seg" role="group" aria-label="Floor"><button type="button" data-br="" class="' + (!bookBr ? 'on' : '') + '" aria-pressed="' + (!bookBr) + '">Both</button><button type="button" data-br="saket" class="' + (bookBr === 'saket' ? 'on' : '') + '" aria-pressed="' + (bookBr === 'saket') + '">Saket</button><button type="button" data-br="gurugram" class="' + (bookBr === 'gurugram' ? 'on' : '') + '" aria-pressed="' + (bookBr === 'gurugram') + '">Gurugram</button></div>' +
      '<div class="ap-list">' + (list.length ? list.map(function (s) {
        var booked = mine.indexOf(s.id) > -1, w = wl.filter(function (x) { return x.slot === s.id; })[0];
        var act = booked ? '<button class="btn sm is-done" type="button" data-unbook="' + esc(s.id) + '">' + I.tick + '<span>Booked</span></button>' : w ? '<button class="btn ghost sm" type="button" data-unwait="' + esc(s.id) + '"><span>#' + w.pos + ' on list</span></button>' : s.live ? '<span class="mono ap-muted">On now</span>' : s.left ? '<button class="btn volt sm" type="button" data-book="' + esc(s.id) + '"><span>Book</span></button>' : '<button class="btn ghost sm" type="button" data-wait="' + esc(s.id) + '"><span>Waitlist</span></button>';
        return '<div class="ap-li ap-sess"><span class="t">' + s.time + '</span><div><b>' + esc(s.cls.name) + '</b><p class="mono ap-muted">' + F.branches[s.branch].name + ' · ' + esc(s.coach.name.split(' ')[0]) + ' · ' + (s.left ? s.left + ' left' : 'full') + '</p><div class="ap-bar"><i style="--f:' + (s.booked / s.cap).toFixed(2) + '"></i></div></div>' + act + '</div>';
      }).join('') : '<div class="ap-empty">' + I.empty + '<div><b>No more classes this day</b><p class="ap-muted">Try another day or the other floor.</p></div></div>') + '</div>';
    F.seg($('.ap-seg', v));
  }
  app.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-day]'))) { bookDay = +t.dataset.day; book($('#view')); }
    if ((t = e.target.closest('[data-br]'))) { bookBr = t.dataset.br; book($('#view')); }
    var find = function (id) { return F.sessions(new Date(id.split('|')[0] + 'T00:00')).filter(function (x) { return x.id === id; })[0]; };
    if ((t = e.target.closest('[data-book]'))) { var s = find(t.dataset.book), m = me(); var r = F.book(s, { name: m.name, phone: m.phone }); var l = F.get('bookings', []); l[l.length - 1].memberNo = m.memberNo; F.set('bookings', l); book($('#view')); F.toast('Booked: ' + esc(s.cls.name) + ', ' + F.nice(s.date) + ' ' + s.time + '. Your pass is on Today.'); }
    if ((t = e.target.closest('[data-unbook]'))) { var s2 = find(t.dataset.unbook); F.cancel(t.dataset.unbook); book($('#view')); F.toast('Cancelled ' + esc(s2.cls.name) + '. Free up to 2 hours before.'); }
    if ((t = e.target.closest('[data-wait]'))) { var s3 = find(t.dataset.wait), w = F.joinWaitlist(s3, me()); book($('#view')); F.toast('You’re #' + w.pos + ' on the waitlist. We’ll book you automatically if a spot opens.'); }
    if ((t = e.target.closest('[data-unwait]'))) { F.leaveWaitlist(t.dataset.unwait, me().name); book($('#view')); F.toast('Left the waitlist.'); }
  });

  /* ---------------- progress (PR log + chart) ---------------- */
  function prs() { var l = F.get('prs', null); if (!l) { l = F.seedPRs(); F.set('prs', l); } return l; }
  function progress(v) {
    var all = prs(), lifts = []; all.forEach(function (p) { if (lifts.indexOf(p.lift) < 0) lifts.push(p.lift); });
    var pts = all.filter(function (p) { return p.lift === prLift; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; }), unit = pts.length ? pts[0].unit : 'kg';
    var best = function (l) { var x = all.filter(function (p) { return p.lift === l; }); return x.length ? (x[0].unit === 'min' ? Math.min.apply(null, x.map(function (p) { return p.value; })) : Math.max.apply(null, x.map(function (p) { return p.value; }))) : 0; };
    var first = pts[0], last = pts[pts.length - 1], delta = last && first ? last.value - first.value : 0;
    v.innerHTML = '<div class="chips-row ap-chips" role="group" aria-label="Lift">' + lifts.map(function (l) { return '<button type="button" class="chip" data-lift="' + esc(l) + '" aria-pressed="' + (l === prLift) + '"><i></i>' + esc(l) + '</button>'; }).join('') + '</div>' +
      '<section class="ap-card"><div class="ap-card-h"><b>' + esc(prLift) + '</b><span class="mono ' + ((unit === 'min' ? delta < 0 : delta > 0) ? 'ap-up' : 'ap-muted') + '">' + (delta ? (delta > 0 ? '+' : '') + fmtV(delta, unit) + ' in ' + Math.max(1, Math.round((new Date(last.date) - new Date(first.date)) / 2.63e9)) + ' months' : 'First entry') + '</span></div><p class="ap-big">' + (last ? fmtV(last.value, unit) : '—') + '</p>' + chart(pts, unit) + '</section>' +
      '<section class="ap-card"><div class="ap-card-h"><b>Log a PR</b></div><form class="ap-form" id="prForm" novalidate><label class="fld"><span>Lift</span><select name="lift">' + lifts.map(function (l) { return '<option' + (l === prLift ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select></label>' +
      '<div class="f2"><label class="fld" id="prVal"><span>' + (unit === 'min' ? 'Time (minutes)' : 'Weight (kg)') + '</span><input name="value" inputmode="decimal" placeholder="' + (last ? last.value : '') + '"><em class="msg"></em></label><label class="fld"><span>Reps</span><select name="reps"><option>1</option><option>2</option><option>3</option><option>5</option></select></label></div>' +
      '<button class="btn volt" type="submit"><span>Save PR</span></button></form></section>' +
      '<section class="ap-card"><div class="ap-card-h"><b>Best lifts</b></div>' + lifts.map(function (l) { var u = all.filter(function (p) { return p.lift === l; })[0].unit; return '<div class="ap-li"><div><b>' + esc(l) + '</b></div><span class="mono">' + fmtV(best(l), u) + '</span></div>'; }).join('') + '</section>';
    var vf = F.field($('#prVal'), function (x) { var n = parseFloat(x); if (!x.trim()) return 'Add the number you hit.'; if (isNaN(n) || n <= 0) return 'Numbers only, please.'; if (n > 400) return 'That’s a world record. Check the number?'; return ''; });
    $('#prForm').addEventListener('submit', function (e) {
      e.preventDefault(); if (!vf()) return;
      var f = e.target, l = f.lift.value, u = all.filter(function (p) { return p.lift === l; })[0].unit, val = parseFloat(f.value.value);
      var list = prs(); list.push({ lift: l, unit: u, date: F.iso(new Date()), value: val, reps: +f.reps.value }); F.set('prs', list); prLift = l;
      var pb = u === 'min' ? val < best(l) : val > best(l); progress(v); F.toast(pb ? 'New best ' + esc(l) + ': ' + fmtV(val, u) + '. Kofi will see it in your log.' : 'Logged ' + esc(l) + ': ' + fmtV(val, u) + '.');
    });
  }
  function fmtV(x, u) { if (u === 'min') { var s = Math.abs(x); return (x < 0 ? '−' : '') + Math.floor(s / 60) + ':' + F.pad(Math.round(s % 60)) + ' h'; } return (Math.round(x * 10) / 10) + ' kg'; }
  function chart(pts, unit) {
    if (pts.length < 2) return '<p class="ap-muted">Log another entry to see the trend.</p>';
    var W = 320, H = 150, P = 22, xs = pts.map(function (p) { return new Date(p.date).getTime(); }), ys = pts.map(function (p) { return p.value; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), pad = (y1 - y0) * 0.15 || 5;
    y0 -= pad; y1 += pad;
    var X = function (t) { return P + (t - x0) / (x1 - x0 || 1) * (W - P * 2); }, Y = function (v) { return H - P - (v - y0) / (y1 - y0) * (H - P * 2); };
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(xs[i]).toFixed(1) + ' ' + Y(p.value).toFixed(1); }).join(' ');
    var area = d + ' L' + X(xs[xs.length - 1]).toFixed(1) + ' ' + (H - P) + ' L' + X(xs[0]).toFixed(1) + ' ' + (H - P) + ' Z';
    var grid = [0, 1, 2].map(function (k) { var v = y0 + (y1 - y0) * (k + 0.5) / 3; return '<line x1="' + P + '" x2="' + (W - P) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text x="' + (W - P + 4) + '" y="' + (Y(v) + 3).toFixed(1) + '">' + (unit === 'min' ? Math.round(v) : Math.round(v)) + '</text>'; }).join('');
    var dots = pts.map(function (p, i) { return '<circle cx="' + X(xs[i]).toFixed(1) + '" cy="' + Y(p.value).toFixed(1) + '" r="' + (i === pts.length - 1 ? 5 : 3) + '"' + (i === pts.length - 1 ? ' class="last"' : '') + '><title>' + F.nice(p.date) + ': ' + fmtV(p.value, unit) + '</title></circle>'; }).join('');
    var lbl = '<text class="xl" x="' + P + '" y="' + (H - 4) + '">' + F.MONTHS[new Date(x0).getMonth()] + ' ' + String(new Date(x0).getFullYear()).slice(2) + '</text><text class="xl" x="' + (W - P) + '" y="' + (H - 4) + '" text-anchor="end">' + F.MONTHS[new Date(x1).getMonth()] + ' ' + String(new Date(x1).getFullYear()).slice(2) + '</text>';
    return '<svg class="ap-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(prLift) + ' progress: ' + pts.map(function (p) { return F.nice(p.date) + ' ' + fmtV(p.value, unit); }).join(', ') + '"><g class="g">' + grid + '</g><path class="a" d="' + area + '"/><path class="l" d="' + d + '"/>' + dots + lbl + '</svg>';
  }
  app.addEventListener('click', function (e) { var t = e.target.closest('[data-lift]'); if (t) { prLift = t.dataset.lift; progress($('#view')); } });

  /* ---------------- plan (HYROX 12-week block) ---------------- */
  var BLOCK = [
    ['Base', ['Heavy Hour · squat', 'Engine Room · zone 2', 'Heavy Hour · deadlift', 'Station Skills · sled', 'Easy run 40 min']],
    ['Build', ['Heavy Hour · squat', 'Engine Room · intervals', 'Station Skills · wall balls', 'Compromised runs', 'Easy run 50 min']],
    ['Sharpen', ['Strength · lighter', 'Compromised runs', 'Full simulation (wk 10)', 'Mobility & Breath', 'Easy run 45 min']],
    ['Taper', ['Short strength', 'Opener 20 min', 'Race walkthrough', 'Race day']]
  ];
  function weekOf() { var m = me(), s = new Date('2026-11-02T00:00'), w = Math.floor((new Date() - s) / 6048e5); return Math.max(0, Math.min(11, w)); }
  function phaseOf(w) { return w < 4 ? 0 : w < 8 ? 1 : w < 11 ? 2 : 3; }
  function plan(v) {
    var cur = weekOf(); if (planWeek === 0 && !plan.init) { planWeek = cur; plan.init = true; }
    var done = F.get('plan-done', {}), ph = phaseOf(planWeek), items = BLOCK[ph][1];
    var total = 0, got = 0; for (var w = 0; w < 12; w++) { var n = BLOCK[phaseOf(w)][1].length; total += n; for (var k = 0; k < n; k++) if (done[w + '-' + k]) got++; }
    v.innerHTML = '<section class="ap-card"><div class="ap-card-h"><b>HYROX block · Jan race</b><span class="mono ap-muted">' + got + ' of ' + total + ' sessions</span></div><div class="ap-meter"><i style="--f:' + (got / total).toFixed(3) + '"></i></div><p class="ap-muted mono">Coach: Tenzin Dolma · Race: Sat 24 Jan, Delhi</p></section>' +
      '<div class="ap-weeks" role="group" aria-label="Week">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (w) { return '<button type="button" data-week="' + w + '" class="' + (w === planWeek ? 'on' : '') + (w === cur ? ' cur' : '') + '" aria-pressed="' + (w === planWeek) + '">' + (w + 1) + '</button>'; }).join('') + '</div>' +
      '<section class="ap-card"><div class="ap-card-h"><b>Week ' + (planWeek + 1) + ' · ' + BLOCK[ph][0] + '</b>' + (planWeek === cur ? '<span class="chip ok">This week</span>' : '') + '</div>' +
      items.map(function (it, k) { var id = planWeek + '-' + k; return '<label class="check ap-check"><input type="checkbox" data-plan="' + id + '"' + (done[id] ? ' checked' : '') + '><span class="box" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 4.5"/></svg></span><span>' + esc(it) + '</span></label>'; }).join('') + '</section>' +
      '<a class="btn ghost big-btn" href="hyrox.html"><span>Stations, pacing and race-day checklist</span></a>';
  }
  app.addEventListener('click', function (e) { var t = e.target.closest('[data-week]'); if (t) { planWeek = +t.dataset.week; plan($('#view')); } });
  app.addEventListener('change', function (e) { var t = e.target.closest('[data-plan]'); if (t) { var d = F.get('plan-done', {}); d[t.dataset.plan] = t.checked; F.set('plan-done', d); var y = app.scrollTop; plan($('#view')); app.scrollTop = y; } });

  /* ---------------- account: membership, freeze, invoices, referrals ---------------- */
  function account(v) {
    var m = me(), fr = F.get('freezes', []).filter(function (f) { return f.memberNo === m.memberNo; })[0];
    var refs = F.get('leads', []).filter(function (l) { return (l.source || '').indexOf('Referral · ' + m.name.split(' ')[0]) === 0; });
    v.innerHTML = '<section class="ap-card ap-mcard"><p class="mono">Forge · ' + esc(m.plan) + '</p><b>' + esc(m.name) + '</b><p class="mono">' + esc(m.memberNo) + ' · ' + F.branches[m.home].name + ' · since ' + F.nice(m.since || m.start) + '</p><p class="mono">Renews ' + F.nice(m.renews) + ' · ' + F.rupees((F.plans.filter(function (p) { return p.id === m.planId; })[0] || F.plans[2]).m) + ' / month</p></section>' +
      '<section class="ap-card"><div class="ap-card-h"><b>Freeze membership</b>' + (fr ? '<span class="chip ' + (fr.status === 'approved' ? 'ok' : 'warn') + '">' + (fr.status === 'approved' ? 'Approved' : 'Pending approval') + '</span>' : '') + '</div>' +
      (fr ? '<p>' + fr.weeks + ' week' + (fr.weeks > 1 ? 's' : '') + ' from ' + F.nice(fr.from) + '. Your renewal moves to ' + F.nice(fr.newRenews) + '.</p><p class="ap-muted mono">Reason: ' + esc(fr.reason) + '</p>' + (fr.status !== 'approved' ? '<button class="btn ghost sm" type="button" data-unfreeze><span>Withdraw request</span></button>' : '') :
      '<p class="ap-muted">Up to 8 weeks a year, free. Your renewal date moves by the same number of weeks.</p><form class="ap-form" id="frForm" novalidate><div class="f2"><label class="fld"><span>Weeks</span><select name="weeks">' + [1, 2, 3, 4, 6, 8].map(function (w) { return '<option value="' + w + '">' + w + ' week' + (w > 1 ? 's' : '') + '</option>'; }).join('') + '</select></label><label class="fld" id="frFrom"><span>Starting</span><input type="date" name="from"><em class="msg"></em></label></div><label class="fld"><span>Reason</span><select name="reason"><option>Travel</option><option>Injury or illness</option><option>Exams or work</option><option>New baby</option><option>Other</option></select></label><p class="ap-muted mono" id="frPreview"></p><button class="btn volt" type="submit"><span>Request freeze</span></button></form>') + '</section>' +
      '<section class="ap-card"><div class="ap-card-h"><b>Invoices</b><span class="mono ap-muted">GST included</span></div>' + (m.invoices || []).map(function (inv, i) { return '<div class="ap-li"><div><b>' + esc(inv.desc) + '</b><p class="mono ap-muted">' + inv.no + ' · ' + F.nice(inv.date) + ' · ' + inv.method + '</p></div><span class="mono">' + F.rupees(inv.amount) + '</span><button class="btn ghost sm" type="button" data-inv="' + i + '"><span>View</span></button></div>'; }).join('') + '</section>' +
      '<section class="ap-card"><div class="ap-card-h"><b>Refer a friend</b><span class="mono ap-muted">You both get a free month</span></div><div class="ap-ref"><span class="mono">' + esc(m.ref || ('FORGE-' + m.memberNo.slice(3))) + '</span><button class="btn ghost sm" type="button" data-copyref><span>Copy link</span></button></div>' +
      '<form class="ap-form" id="refForm" novalidate><div class="f2"><label class="fld" id="rfName"><span>Friend’s name</span><input name="name"><em class="msg"></em></label><label class="fld" id="rfPhone"><span>Their WhatsApp</span><input name="phone" type="tel" inputmode="tel" placeholder="+91"><em class="msg"></em></label></div><button class="btn volt" type="submit"><span>Send them a free trial</span></button></form>' +
      (refs.length ? refs.map(function (r) { return '<div class="ap-li"><div><b>' + esc(r.name) + '</b><p class="mono ap-muted">' + ({ new: 'Trial booked', contacted: 'Followed up', trial: 'Trained', joined: 'Joined · you get a free month' }[r.stage] || r.stage) + '</p></div></div>'; }).join('') : '<p class="ap-muted mono">No referrals yet.</p>') + '</section>' +
      '<button class="btn ghost big-btn" type="button" data-signout><span>Sign out</span></button>';
    var ff = $('#frForm');
    if (ff) {
      var dmin = new Date(); dmin.setDate(dmin.getDate() + 1); ff.from.min = F.iso(dmin); ff.from.value = F.iso(dmin);
      var prev = function () { var w = +ff.weeks.value, nr = new Date(m.renews); nr.setDate(nr.getDate() + w * 7); $('#frPreview').textContent = 'Renewal moves from ' + F.nice(m.renews) + ' to ' + F.nice(F.iso(nr)) + '.'; };
      ff.addEventListener('change', prev); prev();
      var vfrom = F.field($('#frFrom'), function (x) { if (!x) return 'Pick a start date.'; if (x < ff.from.min) return 'Freezes start tomorrow at the earliest.'; return ''; });
      ff.addEventListener('submit', function (e) { e.preventDefault(); if (!vfrom()) return; var w = +ff.weeks.value, nr = new Date(m.renews); nr.setDate(nr.getDate() + w * 7);
        var l = F.get('freezes', []); l.unshift({ id: F.uid(), memberNo: m.memberNo, name: m.name, plan: m.plan, branch: m.home, weeks: w, from: ff.from.value, reason: ff.reason.value, newRenews: F.iso(nr), status: 'pending', at: new Date().toISOString() }); F.set('freezes', l);
        m.frozen = true; save(m); account(v); F.toast('Freeze requested. The front desk approves it within a working day.'); });
    }
    var vrn = F.field($('#rfName'), F.check.name), vrp = F.field($('#rfPhone'), F.check.phone);
    $('#refForm').addEventListener('submit', function (e) { e.preventDefault(); if (!(vrn() & vrp())) return; var f = e.target;
      F.addLead({ name: f.name.value.trim(), phone: f.phone.value.trim(), branch: m.home, day: F.iso(new Date(Date.now() + 2 * 864e5)), goal: 'Referred by ' + m.name, plan: '' });
      var L = F.get('leads', []); L[0].source = 'Referral · ' + m.name.split(' ')[0]; L[0].web = false; F.set('leads', L);
      account(v); F.toast('Trial invite sent to ' + esc(f.name.value.trim()) + '. They’ll get a WhatsApp with a free trial invite.'); });
  }
  app.addEventListener('click', function (e) {
    var m = me();
    if (e.target.closest('[data-signout]')) { F.set('session', null); tab = 'today'; render(); F.toast('Signed out.'); }
    if (e.target.closest('[data-unfreeze]')) { F.set('freezes', F.get('freezes', []).filter(function (f) { return f.memberNo !== m.memberNo || f.status === 'approved'; })); m.frozen = false; save(m); render(); F.toast('Freeze request withdrawn.'); }
    if (e.target.closest('[data-copyref]')) { var link = location.origin + location.pathname.replace('member.html', '') + 'index.html?ref=' + (m.ref || m.memberNo); (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () { F.toast('Referral link copied.'); }, function () { F.toast(link); }); }
    var iv = e.target.closest('[data-inv]'); if (iv) invoice(m.invoices[+iv.dataset.inv], m);
  });
  function invoice(inv, m) {
    var gst = Math.round(inv.amount * 18 / 118), base = inv.amount - gst;
    var dlg = document.createElement('dialog'); dlg.className = 'dlg ap-inv'; dlg.setAttribute('aria-label', 'Invoice ' + inv.no);
    dlg.innerHTML = '<div class="dlg-in"><p class="mono">Tax invoice</p><h3>' + inv.no + '</h3><dl class="mono"><div><dt>Date</dt><dd>' + F.nice(inv.date) + '</dd></div><div><dt>Billed to</dt><dd>' + esc(m.name) + ' · ' + esc(m.memberNo) + '</dd></div><div><dt>Item</dt><dd>' + esc(inv.desc) + '</dd></div><div><dt>Taxable value</dt><dd>' + F.rupees(base) + '</dd></div><div><dt>CGST 9%</dt><dd>' + F.rupees(Math.floor(gst / 2)) + '</dd></div><div><dt>SGST 9%</dt><dd>' + F.rupees(Math.ceil(gst / 2)) + '</dd></div><div class="tot"><dt>Total</dt><dd>' + F.rupees(inv.amount) + '</dd></div><div><dt>Paid by</dt><dd>' + inv.method + '</dd></div></dl><p class="ap-muted mono">Forge Athletic Club Pvt. Ltd. · GSTIN 07AAAAA0000A1Z5 · SAC 999723</p><div class="dlg-act"><button class="btn volt" type="button" data-dl><span>Download</span></button><button class="btn ghost" type="button" data-close><span>Close</span></button></div></div>';
    document.body.appendChild(dlg); dlg.showModal();
    dlg.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]') || e.target === dlg) { dlg.close(); dlg.remove(); }
      if (e.target.closest('[data-dl]')) { var txt = ['FORGE ATHLETIC CLUB PVT. LTD.', 'Tax invoice ' + inv.no, 'Date: ' + F.nice(inv.date), 'Billed to: ' + m.name + ' (' + m.memberNo + ')', 'Item: ' + inv.desc, 'Taxable value: Rs ' + base, 'CGST 9%: Rs ' + Math.floor(gst / 2), 'SGST 9%: Rs ' + Math.ceil(gst / 2), 'Total: Rs ' + inv.amount, 'Paid by: ' + inv.method, 'Portfolio project: no payment is taken.'].join('\n');
        var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' })); a.download = inv.no + '.txt'; document.body.appendChild(a); a.click(); a.remove(); F.toast('Invoice downloaded.'); }
    });
    dlg.addEventListener('close', function () { dlg.remove(); });
  }

  render();
  addEventListener('storage', function (e) { if (e.key && e.key.indexOf('forge:') === 0) render(); });
})();
