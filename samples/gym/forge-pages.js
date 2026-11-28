/* Forge · content pages: branch pages, HYROX tools, forms that land in staff Messages, membership compare + sign-up wizard. */
(function () {
  'use strict';
  var F = window.Forge, $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = F.esc, I = F.ICON, reduce = F.reduce;
  function busyBtn(btn, on, label) { btn.classList.toggle('busy', on); if (label) $('span:not(.arr)', btn).textContent = label; }
  function pushStore(key, rec) { var l = F.get(key, []); l.unshift(rec); F.set(key, l); return rec; }

  /* On pages that start their scripts after first paint, the critical CSS holds the hero's animated words back.
     Release them once motion.js has set their entrance (it waits for the fonts too, and registered first), so nothing flashes. */
  (function () { var go = function () { document.documentElement.classList.add('fx-go'); };
    if (reduce || !window.gsap || !window.Motion || Motion.reduce || !document.fonts || !document.fonts.ready) go(); else document.fonts.ready.then(go); })();

  /* ---------------- branch pages ---------------- */
  $$('[data-branch-today]').forEach(function (box) {
    var br = box.getAttribute('data-branch-today'), list = F.sessions(new Date()).filter(function (s) { return s.branch === br; });
    var rest = list.filter(function (s) { return !s.past || s.live; });
    box.innerHTML = '<p class="tt-day"><span>Today · ' + F.nice(F.iso(new Date())) + '</span><span>' + rest.length + ' still to come</span></p>' + (rest.length ? rest.map(function (s) {
      return '<div class="row"><span class="t">' + s.time + '</span><div class="c"><a href="class.html?id=' + s.cls.id + '">' + esc(s.cls.name) + '</a><span class="mono">' + esc(F.types[s.cls.type].name) + ' · ' + s.cls.mins + ' min</span></div><div class="who"><a class="ul" href="coach.html?id=' + s.coach.id + '">' + esc(s.coach.name) + '</a></div><div class="who br">' + F.branches[br].name + '</div>' +
        '<div class="spots' + (s.left <= 3 ? ' low' : '') + '"><div class="bar"><i style="--f:' + (s.booked / s.cap).toFixed(2) + '"></i></div><span class="mono">' + (s.live ? 'On now' : s.left === 0 ? 'Full · waitlist' : s.left + ' of ' + s.cap + ' left') + '</span></div>' +
        '<div class="act"><a class="btn ' + (s.left ? 'volt' : 'ghost') + ' sm" href="class.html?id=' + s.cls.id + '#sessions"><span>' + (s.left ? 'Book' : 'Waitlist') + '</span></a></div></div>';
    }).join('') : '<div class="empty-st">' + I.bell + '<div><b>That’s it for today here</b><p>The floor stays open for Open Gym until close. Tomorrow’s first class is at 06:00.</p><a class="btn ghost sm" href="index.html#timetable"><span>Full timetable</span></a></div></div>');
  });
  $$('[data-branch-coaches]').forEach(function (box) {
    box.innerHTML = box.getAttribute('data-branch-coaches').split(',').map(function (id) { var c = F.coach(id); return '<a href="coach.html?id=' + c.id + '"><figure><img src="' + c.photo + '"' + F.ss(c.photo, '(max-width: 860px) 78vw, 24vw') + ' alt="" width="400" height="500" loading="lazy" decoding="async"></figure><span class="mono">' + esc(c.role) + '</span><b>' + esc(c.name) + '</b></a>'; }).join('');
  });
  /* floor plan <-> list linking (hover, focus, tap) */
  var plan = $('[data-plan]'), plist = $('[data-plan-list]');
  if (plan && plist) {
    var setZ = function (z) { $$('.fp-z', plan).forEach(function (g) { g.classList.toggle('on', g.getAttribute('data-z') === z); }); $$('li', plist).forEach(function (li) { li.classList.toggle('on', li.getAttribute('data-z') === z); }); };
    $$('li', plist).forEach(function (li) { li.tabIndex = 0; ['pointerenter', 'focus', 'click'].forEach(function (ev) { li.addEventListener(ev, function () { setZ(li.getAttribute('data-z')); }); }); });
    $$('.fp-z', plan).forEach(function (g) { g.addEventListener('pointerenter', function () { setZ(g.getAttribute('data-z')); }); });
    setZ($('li', plist).getAttribute('data-z'));
  }
  var busy = $('.busy');
  if (busy) { var hr = new Date().getHours() - 6; var li = $$('li', busy)[hr]; if (li) { li.classList.add('now'); li.setAttribute('aria-current', 'time'); } }

  /* ---------------- HYROX: pace calculator + race-day checklist ---------------- */
  var pt = $('#paceT');
  if (pt) {
    var SHARE = [['Run 1', 'r', .066], ['SkiErg', 's', .052], ['Run 2', 'r', .064], ['Sled push', 's', .042], ['Run 3', 'r', .066], ['Sled pull', 's', .055], ['Run 4', 'r', .068], ['Burpee broad jumps', 's', .062], ['Run 5', 'r', .065], ['Rowing', 's', .054], ['Run 6', 'r', .064], ['Farmers carry', 's', .025], ['Run 7', 'r', .066], ['Sandbag lunges', 's', .05], ['Run 8', 'r', .066], ['Wall balls', 's', .07], ['Roxzone transitions', 'x', .07]];
    var fmt = function (sec) { sec = Math.round(sec); var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return (h ? h + ':' + F.pad(m) : m) + ':' + F.pad(s); };
    var draw = function () {
      var tot = +pt.value * 60, sum = SHARE.reduce(function (a, r) { return a + r[2]; }, 0);
      pt.style.setProperty('--pct', ((pt.value - pt.min) / (pt.max - pt.min) * 100) + '%');
      $('#paceOut').textContent = fmt(tot);
      $('#paceTable tbody').innerHTML = SHARE.map(function (r) { return '<tr class="' + (r[1] === 'r' ? 'run' : '') + '"><td>' + r[0] + '</td><td>' + fmt(tot * r[2] / sum) + '</td></tr>'; }).join('') + '<tr class="tot"><td>Finish</td><td>' + fmt(tot) + '</td></tr>';
      pt.setAttribute('aria-valuetext', fmt(tot));
    };
    pt.addEventListener('input', draw); draw();
  }
  var cks = $$('[data-ck]');
  if (cks.length) {
    var saved = F.get('race-check', {}), cnt = function () { var n = cks.filter(function (c) { return c.checked; }).length; $('#ckCount').textContent = n + ' of ' + cks.length + ' done · saved on this device'; };
    cks.forEach(function (c) { c.checked = !!saved[c.dataset.ck]; c.addEventListener('change', function () { saved[c.dataset.ck] = c.checked; F.set('race-check', saved); cnt(); }); });
    cnt();
  }

  /* ---------------- forms → staff inbox ---------------- */
  var chk = {
    req: function (label) { return function (v) { return v.trim().length < 2 ? label : ''; }; },
    email: function (v) { v = v.trim(); if (!v) return 'We’ll need an email to reply to.'; if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'That email doesn’t look complete. Check for a missing @ or domain.'; return ''; }
  };
  function wireForm(form, fields, build, doneHtml) {
    if (!form) return;
    var vs = fields.map(function (f) { return F.field($(f[0]), f[1]); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = vs.map(function (v) { return v(); }).every(Boolean);
      if (!ok) { var bad = $('.bad input, .bad textarea', form); if (bad) bad.focus(); return; }
      var btn = $('button[type=submit]', form); busyBtn(btn, true, 'Sending');
      setTimeout(function () {
        var rec = build(new FormData(form)); rec.id = F.uid(); rec.at = new Date().toISOString(); rec.status = 'new'; pushStore('inbox', rec);
        var done = form.nextElementSibling; done.innerHTML = doneHtml(rec); form.hidden = true; done.hidden = false; done.focus({ preventScroll: true });
        F.toast('Sent. A coach replies within a working day.');
      }, reduce ? 0 : 650);
    });
  }
  wireForm($('#corpForm'), [['#cfName', chk.req('What should we call you?')], ['#cfCo', chk.req('Which company is this for?')], ['#cfEmail', chk.email]],
    function (d) { return { kind: 'corporate', name: d.get('name').trim(), company: d.get('company').trim(), email: d.get('email').trim(), size: d.get('size'), branch: d.get('branch') }; },
    function (r) { return '<p class="idx mono">Enquiry received</p><h3>Thanks, ' + esc(r.name.split(' ')[0]) + '.</h3><p class="trial-copy">Zoya (head coach, Gurugram) will email ' + esc(r.email) + ' within one working day with a pilot class date for ' + esc(r.company) + '.</p><div class="acts"><a class="btn volt" href="staff.html#inbox"><span>See it in the staff inbox</span></a></div>'; });
  wireForm($('#jobForm'), [['#jfName', F.check.name], ['#jfPhone', F.check.phone], ['#jfWhy', function (v) { return v.trim().length < 20 ? 'A couple of lines, please. What would you bring to the floor?' : ''; }]],
    function (d) { var role = $('#jobRole'); return { kind: 'application', name: d.get('name').trim(), phone: d.get('phone').trim(), role: role.options[role.selectedIndex].text, years: d.get('years'), cert: d.get('cert'), why: d.get('why').trim() }; },
    function (r) { return '<p class="idx mono">Application received</p><h3>Thanks, ' + esc(r.name.split(' ')[0]) + '.</h3><p class="trial-copy">We reply to every application within 7 days. For the ' + esc(r.role) + ' role, the next step is a 30-minute call, then a paid trial session on the floor.</p><div class="acts"><a class="btn volt" href="staff.html#inbox"><span>See it in the staff inbox</span></a></div>'; });
  $$('[data-apply]').forEach(function (b) { b.addEventListener('click', function () { $('#jobRole').value = b.getAttribute('data-apply'); var a = $('#apply'); if (window.Motion && Motion.lenis) Motion.lenis.scrollTo(a, { offset: -70 }); else a.scrollIntoView(); setTimeout(function () { $('#jobForm [name=name]').focus({ preventScroll: true }); }, 700); }); });
  var sub = $('#subForm');
  if (sub) { var vSub = F.field($('#fSub'), chk.email); sub.addEventListener('submit', function (e) { e.preventDefault(); if (!vSub()) return; pushStore('subs', { email: sub.email.value.trim(), at: new Date().toISOString() }); sub.innerHTML = '<p class="c1-13 mono idx">You’re on the list. First email: the January block, on 2 Jan.</p>'; F.toast('Subscribed. See you on 2 Jan.'); }); }

  /* ---------------- membership: compare table ---------------- */
  var cmp = $('#cmpTable'), bill = 'm';
  function drawCmp() {
    if (!cmp) return;
    var P = F.plans;
    cmp.innerHTML = '<thead><tr><th scope="col"><span class="sr">Feature</span></th>' + P.map(function (p) { var pr = bill === 'm' ? p.m : p.m * 10; return '<th scope="col"' + (p.best ? ' class="best"' : '') + '><span class="mono">' + esc(p.tag) + '</span><b>' + esc(p.name) + '</b><span class="p">' + F.rupees(pr) + ' <small class="mono">/ ' + (bill === 'm' ? 'month' : 'year') + '</small></span></th>'; }).join('') + '</tr></thead><tbody>' +
      F.planRows.map(function (r) { return '<tr><th scope="row">' + esc(r[1]) + '</th>' + P.map(function (p) { var v = p.feats[r[0]]; return '<td class="' + (v ? '' : 'no') + (p.best ? ' best' : '') + '">' + (v === true ? 'Included' : v ? esc(v) : 'Not included') + '</td>'; }).join('') + '</tr>'; }).join('') +
      '<tr><th scope="row"></th>' + P.map(function (p) { return '<td' + (p.best ? ' class="best"' : '') + '><button class="btn ' + (p.best ? 'volt' : 'dark') + ' sm" type="button" data-choose="' + p.id + '"><span>Choose</span></button></td>'; }).join('') + '</tr></tbody>';
  }
  $$('.bill .seg button').forEach(function (b) { b.addEventListener('click', function () { bill = b.dataset.bill; F.segSet($('.bill .seg'), b); drawCmp(); }); });
  drawCmp();

  /* ---------------- membership: sign-up wizard ---------------- */
  var wz = $('#wizard'); if (!wz) return;
  var S = { step: 0, plan: (location.search.match(/[?&]plan=([a-z]+)/) || [])[1] || 'club', home: 'saket', cycle: 'm', start: '', pay: 'UPI' };
  if (!F.plans.some(function (p) { return p.id === S.plan; })) S.plan = 'club';
  var panes = $$('.wz-pane', wz), dots = $$('.wz-steps li', wz), next = $('#wzNext'), back = $('#wzBack'), err = $('#wzErr');
  $('#pickPlans').innerHTML = F.plans.map(function (p) { return '<label><input type="radio" name="plan" value="' + p.id + '"' + (p.id === S.plan ? ' checked' : '') + '><span class="pc"><b>' + esc(p.name) + '</b><span class="pp">' + F.rupees(p.m) + ' <small class="mono">/ month</small></span><span class="mono">' + esc(p.note) + '</span></span></label>'; }).join('');
  cmp && cmp.addEventListener('click', function (e) { var b = e.target.closest('[data-choose]'); if (!b) return; S.plan = b.dataset.choose; $('#pickPlans [value="' + S.plan + '"]').checked = true; go(0); side(); var t = $('#signup'); if (window.Motion && Motion.lenis) Motion.lenis.scrollTo(t, { offset: -70 }); else t.scrollIntoView(); });
  wz.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'plan') S.plan = t.value; if (t.name === 'home') S.home = t.value; if (t.name === 'cycle') S.cycle = t.value; if (t.name === 'pay') S.pay = t.value;
    if (/^pq\d$/.test(t.name)) $('#pqNote').hidden = !$$('.pq input[value=yes]:checked', wz).length;
    side();
  });
  var plan = function () { return F.plans.filter(function (p) { return p.id === S.plan; })[0]; };
  var price = function () { return S.cycle === 'm' ? plan().m : plan().m * 10; };
  function side() {
    var p = plan(), nm = $('[name=name]', wz).value.trim();
    $('#wzSide').innerHTML = '<p class="mono idx">Your membership</p><dl><div><dt>Plan</dt><dd>' + esc(p.name) + '</dd></div><div><dt>Home floor</dt><dd>' + F.branches[S.home].name + '</dd></div><div><dt>Billing</dt><dd>' + (S.cycle === 'm' ? 'Monthly' : 'Yearly') + '</dd></div>' + (nm ? '<div><dt>Name</dt><dd>' + esc(nm) + '</dd></div>' : '') + (S.start ? '<div><dt>Starts</dt><dd>' + F.nice(S.start) + '</dd></div>' : '') + '<div><dt>Joining fee</dt><dd>₹0</dd></div></dl><p class="tot">' + F.rupees(price()) + ' <small class="mono">/ ' + (S.cycle === 'm' ? 'month' : 'year') + ' incl. GST</small></p>';
  }
  /* start-date calendar: next 21 days */
  (function cal() {
    var c = $('#cal'), d0 = new Date(); d0.setDate(d0.getDate() + 1);
    var lead = (d0.getDay() + 6) % 7, html = F.DAYS.map(function (d) { return '<span class="dh">' + d + '</span>'; }).join('');
    for (var k = 0; k < lead; k++) html += '<span></span>';
    for (var i = 0; i < 21; i++) { var d = new Date(d0); d.setDate(d0.getDate() + i); var iso = F.iso(d); html += '<button type="button" data-d="' + iso + '" aria-pressed="false" aria-label="' + F.nice(iso) + '">' + d.getDate() + '<small>' + F.MONTHS[d.getMonth()] + '</small></button>'; }
    c.innerHTML = html;
    c.addEventListener('click', function (e) { var b = e.target.closest('[data-d]'); if (!b) return; S.start = b.dataset.d; $$('[data-d]', c).forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); }); $('#calPick').textContent = 'Starts ' + F.nice(S.start) + '. Your movement screen will be booked that week.'; err.textContent = ''; side(); });
  })();
  var vName = F.field($('#sfName'), F.check.name), vPhone = F.field($('#sfPhone'), F.check.phone), vEmail = F.field($('#sfEmail'), chk.email),
      vDob = F.field($('#sfDob'), function (v) { if (!v) return 'We need your date of birth for the health screen.'; var a = (Date.now() - new Date(v)) / 31557600000; if (a < 16) return 'Members need to be 16 or older. Under-16s can join our parent-and-teen class.'; if (a > 100) return 'Please check the year.'; return ''; }),
      vEc = F.field($('#sfEc'), chk.req('Who should we call in an emergency?')), vEcp = F.field($('#sfEcp'), F.check.phone);
  function valid(step) {
    err.textContent = '';
    if (step === 1) { var ok = [vName(), vPhone(), vEmail(), vDob(), vEc(), vEcp()].every(Boolean); if (!ok) { var b = $('.wz-pane.on .bad input', wz); if (b) b.focus(); } return ok; }
    if (step === 3 && !S.start) { err.textContent = 'Pick a start date to continue.'; return false; }
    return true;
  }
  function go(n) {
    S.step = n;
    panes.forEach(function (p, i) { p.classList.toggle('on', i === n); });
    dots.forEach(function (d, i) { d.classList.toggle('on', i === n); d.classList.toggle('done', i < n); if (i === n) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
    back.hidden = n === 0 || n === 5; next.hidden = n === 5;
    $('span:not(.arr)', next).textContent = n === 4 ? 'Pay ' + F.rupees(price()) : 'Continue';
    if (n === 4) $('#paySum').innerHTML = '<div><span>' + esc(plan().name) + ' · ' + (S.cycle === 'm' ? 'first month' : 'first year') + '</span><span>' + F.rupees(price()) + '</span></div><div><span>Joining fee</span><span>₹0</span></div><div><span>GST (included)</span><span>' + F.rupees(Math.round(price() * 18 / 118)) + '</span></div><div><span>Due today</span><span>' + F.rupees(price()) + '</span></div>';
    var h = $('.wz-pane.on h3', wz); if (h && S.started) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
    S.started = true; side();
  }
  back.addEventListener('click', function () { go(Math.max(0, S.step - 1)); });
  next.addEventListener('click', function () {
    if (!valid(S.step)) return;
    if (S.step < 4) return go(S.step + 1);
    busyBtn(next, true, 'Confirming payment');
    setTimeout(function () { busyBtn(next, false); finish(); }, reduce ? 0 : 1300);
  });
  function finish() {
    var p = plan(), no = 'FM-' + (20400 + Math.floor(Math.random() * 500)), start = new Date(S.start + 'T00:00'), renews = new Date(start);
    if (S.cycle === 'm') renews.setMonth(renews.getMonth() + 1); else renews.setFullYear(renews.getFullYear() + 1);
    var yes = $$('.pq input[value=yes]:checked', wz).length;
    var rec = { id: F.uid(), memberNo: no, name: $('[name=name]', wz).value.trim(), phone: $('[name=phone]', wz).value.trim(), email: $('[name=email]', wz).value.trim(), plan: p.name, planId: p.id, cycle: S.cycle, home: S.home, start: S.start, renews: F.iso(renews), parqYes: yes, paid: price(), method: S.pay, at: new Date().toISOString(), status: 'new' };
    pushStore('signups', rec);
    F.set('session', { memberNo: no, name: rec.name, phone: rec.phone, plan: p.name, planId: p.id, cycle: S.cycle, home: S.home, start: S.start, renews: rec.renews, since: F.iso(new Date()), invoices: [{ no: 'INV-' + no.slice(3) + '-01', date: F.iso(new Date()), amount: price(), desc: p.name + ' · ' + (S.cycle === 'm' ? 'monthly' : 'yearly'), method: S.pay }], fresh: true });
    $('#welcome').innerHTML = '<div class="welcome"><div><p class="idx mono">Welcome to Forge · ' + no + '</p><h3>See you on ' + F.nice(S.start) + ', ' + esc(rec.name.split(' ')[0]) + '.</h3><dl class="mono"><div><dt>Plan</dt><dd>' + esc(p.name) + '</dd></div><div><dt>Home floor</dt><dd>' + F.branches[S.home].name + '</dd></div><div><dt>Paid</dt><dd>' + F.rupees(price()) + ' · ' + S.pay + '</dd></div><div><dt>Renews</dt><dd>' + F.nice(rec.renews) + '</dd></div></dl>' +
      (yes ? '<p class="pq-note mono" style="margin-top:12px">You answered yes to ' + yes + ' health question' + (yes > 1 ? 's' : '') + '. Meera’s team will call before your first heavy session.</p>' : '') +
      '<div class="acts"><a class="btn volt" href="member.html"><span>Open the member app</span><span class="arr" aria-hidden="true">→</span></a><a class="btn ghost" href="staff.html#signups"><span>See it in the staff dashboard</span></a></div></div><div class="qrbox" id="wqr" role="img" aria-label="Your check-in QR code"></div></div>';
    if (window.qrcode) { var q = window.qrcode(0, 'M'); q.addData('FORGE:MEMBER:' + no); q.make(); $('#wqr').innerHTML = q.createSvgTag({ cellSize: 6, margin: 0, scalable: true }); }
    go(5); F.toast('Payment simulated. Welcome to Forge, ' + esc(rec.name.split(' ')[0]) + '.');
  }
  go(0);
})();
