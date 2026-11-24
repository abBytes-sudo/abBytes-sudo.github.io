/* Forge: class + coach detail pages. Runs synchronously at the end of <body> (render-blocked by rel=expect),
   so the content exists for the View Transition snapshot. */
(function () {
  'use strict';
  var F = window.Forge, page = document.getElementById('page'), esc = F.esc, I = F.ICON;
  var id = new URLSearchParams(location.search).get('id');
  var isCoach = document.body.classList.contains('coachpg');
  var reduce = F.reduce;
  var PT = [['Technique review', 45, 2500, 'Film, fix and re-test one lift. You leave with three cues and a video.'], ['Programme consult', 30, 1800, 'We rewrite your week around your goal, schedule and injuries.'], ['Race plan', 45, 0, 'Pacing, splits and transitions for your next HYROX.']];

  function upcoming(filter, max) {
    var out = [], d = new Date();
    for (var k = 0; k < 7 && out.length < max; k++) {
      var day = new Date(d.getFullYear(), d.getMonth(), d.getDate() + k);
      F.sessions(day).forEach(function (s) { if ((!s.past || s.live) && filter(s) && out.length < max) out.push(s); });
    }
    return out;
  }
  function rows(list, flashId) {
    if (!list.length) return '<div class="empty-st">' + I.empty + '<div><b>No sessions in the next 7 days</b><p>This one is between blocks right now. The front desk can tell you when it’s back, or try a class of the same type.</p><a class="btn ghost sm" href="index.html#timetable"><span>Full timetable</span></a></div></div>';
    return list.map(function (s) {
      var low = s.left <= 3, b = F.branches[s.branch];
      var act = s.mine ? '<button class="btn sm is-done' + (flashId === s.id ? ' pop' : '') + '" type="button" disabled>' + I.tick + '<span>Booked</span></button><button class="undo" type="button" data-undo="' + esc(s.id) + '">Cancel</button>' : s.live ? '<span class="mono lv"><i class="live"></i>On now</span>' : s.left === 0 ? '<button class="btn ghost sm" type="button" data-wait="' + esc(s.id) + '"><span>Waitlist</span></button>' : '<button class="btn volt sm" type="button" data-book="' + esc(s.id) + '"><span>Book</span></button>';
      return '<div class="row' + (flashId === s.id ? ' flash' : '') + '" data-id="' + esc(s.id) + '"><span class="t">' + s.time + '</span><div class="c"><a href="class.html?id=' + s.cls.id + '">' + esc(s.cls.name) + '</a><span class="mono">' + esc(F.nice(s.date)) + '<span class="br-m"> · ' + b.name + '</span></span></div>' +
        '<div class="who"><a class="ul" href="coach.html?id=' + s.coach.id + '">' + esc(s.coach.name) + '</a></div><div class="who br">' + b.name + '</div>' +
        '<div class="spots' + (low ? ' low' : '') + '"><div class="bar"><i style="--f:' + (s.booked / s.cap).toFixed(2) + '"></i></div><span class="mono">' + (s.left === 0 ? 'Full · waitlist open' : s.left === 1 ? 'Last spot' : s.left + ' of ' + s.cap + ' left') + '</span></div><div class="act">' + act + '</div></div>';
    }).join('');
  }
  var dialog = '<dialog class="dlg" id="bookDlg" aria-labelledby="bookH"><form method="dialog" class="dlg-in" id="bookForm" novalidate><p class="mono" id="bookMeta"></p><h3 id="bookH">Book a spot</h3>' +
    '<label class="fld" id="bfName"><span>Name</span><input name="name" autocomplete="name"><em class="msg"></em></label><label class="fld" id="bfPhone"><span>WhatsApp number</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+91"><em class="msg"></em></label>' +
    '<p class="mono" style="color:var(--ash)">Free to cancel up to 2 hours before.</p><div class="dlg-act"><button class="btn volt" type="submit"><span>Confirm spot</span></button><button class="btn ghost" type="button" id="bookCancel"><span>Not now</span></button></div></form></dialog>';
  function notFound(kind) {
    document.title = 'Not found · Forge Athletic Club';
    page.innerHTML = '<section class="notfound"><p class="idx mono">404 · ' + kind + '</p><h1 class="huge">Wrong <em>platform.</em></h1><p>We couldn’t find that ' + kind + '. It may have been renamed when the new block started. Here’s where everything lives:</p><div class="dlg-act"><a class="btn volt" href="index.html#' + (kind === 'coach' ? 'coaches' : 'classes') + '"><span>All ' + kind + (kind === 'class' ? 'es' : 'es') + '</span></a><a class="btn ghost" href="index.html#timetable"><span>Timetable</span></a></div></section>';
  }

  var listFilter, html;
  if (!isCoach) {
    var c = F.cls(id); if (!c) { notFound('class'); return; }
    var t = F.types[c.type], co = F.coach(c.coach);
    document.title = c.name + ' · ' + t.name + ' class · Forge Athletic Club';
    listFilter = function (s) { return s.cls.id === c.id; };
    var where = []; [0, 1, 2, 3, 4, 5, 6].forEach(function (k) { var d = new Date(); d.setDate(d.getDate() + k); F.sessions(d).forEach(function (s) { if (s.cls.id === c.id && where.indexOf(s.branch) < 0) where.push(s.branch); }); });
    var sibs = F.classes.filter(function (x) { return x.type === c.type && x.id !== c.id; }).concat(F.classes.filter(function (x) { return x.type !== c.type; })).slice(0, 4);
    html = '<section class="dhero" aria-labelledby="ch1"><div class="dhero-media"><img class="dh-img" src="' + c.photo + '"' + F.ss(c.photo, '100vw') + ' alt="" width="1400" height="1000" fetchpriority="high"><video class="lazyv" data-defer muted loop playsinline preload="none" data-src="' + c.video + '" aria-hidden="true"></video></div>' +
      '<p class="crumb mono"><a href="index.html#classes">Classes</a><span>/</span><span>' + esc(t.name) + '</span><span>/</span><span>' + esc(c.name) + '</span></p>' +
      '<div class="dhero-t"><p class="idx mono">' + esc(t.name) + ' · ' + c.mins + ' minutes · ' + where.map(function (w) { return F.branches[w].name; }).join(' + ') + '</p><h1 id="ch1" data-split data-now data-delay=".25" style="view-transition-name:cls-' + c.id + '">' + esc(c.name) + '</h1><p class="lede" data-reveal data-now data-delay=".5">' + esc(c.lede) + '</p>' +
      '<dl class="kv mono" data-reveal data-now data-delay=".6"><div><dt>Length</dt><dd>' + c.mins + ' min</dd></div><div><dt>Max class</dt><dd>' + c.cap + ' athletes</dd></div><div><dt>Coach</dt><dd>' + esc(co.name.split(' ')[0]) + '</dd></div><div><dt>Level</dt><dd>' + esc(c.level.split(':')[0].split(',')[0]) + '</dd></div></dl>' +
      '<div class="dlg-act" data-reveal data-now data-delay=".7"><a class="btn volt" href="#sessions"><span>Book a session</span><span class="arr" aria-hidden="true">↓</span></a><a class="btn ghost" href="index.html#trial"><span>Try it free first</span></a></div></div></section>' +
      '<section class="dsec"><div class="g12"><p class="idx mono c1-3" data-reveal>(01) The hour</p><h2 class="big c3-7" data-split>What <em>happens</em> in it.</h2>' +
      '<ol class="blocks c7-13" data-stagger>' + c.blocks.map(function (b) { return '<li><b>' + esc(b[0]) + '</b><span>' + esc(b[1]) + '</span></li>'; }).join('') + '</ol></div>' +
      '<div class="g12" style="margin-top:90px;row-gap:40px"><p class="idx mono c1-3">(02) Why it’s on the plan</p><p class="why c3-8" data-reveal>' + esc(c.why) + '</p>' +
      '<div class="c9-13" data-reveal><p class="mono idx" style="margin-bottom:12px">What to bring</p><ul class="bring">' + c.bring.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></div>' +
      '<div class="g12" style="margin-top:90px"><p class="mono c1-3 idx">(03) Who it’s for</p><p class="c3-7" style="font-size:20px" data-reveal>' + esc(c.level) + '.</p>' +
      '<a class="coach-mini c7-13" href="coach.html?id=' + co.id + '"><img src="' + F.th(co.photo) + '" alt="" width="96" height="120" loading="lazy" style="view-transition-name:coach-' + co.id + '"><span><span class="mono idx">Coached by</span><b>' + esc(co.name) + '</b><span class="mono">' + esc(co.role) + ' <span class="arr">→</span></span></span></a></div></section>' +
      '<section class="dsec tt" id="sessions" style="padding-top:0"><div class="g12 sec-head"><p class="idx mono c1-3">(04) Next sessions</p><h2 class="big c3-11" data-split>Book <em>a spot.</em></h2><p class="c11-13 tt-note mono">Live spots, both floors</p></div><div class="tt-list" id="ttList" aria-live="polite"></div></section>' +
      '<section class="dsec" style="padding-top:0"><div class="g12 sec-head"><p class="idx mono c1-3">(05) Pairs well with</p></div><div class="more rail">' +
      sibs.map(function (x) { return '<a href="class.html?id=' + x.id + '"><figure><img src="' + x.photo + '"' + F.ss(x.photo, '(max-width: 860px) 78vw, 24vw') + ' alt="" width="400" height="500" loading="lazy" decoding="async"></figure><span class="mono">' + esc(F.types[x.type].name) + ' · ' + x.mins + ' min</span><b>' + esc(x.name) + '</b></a>'; }).join('') + '</div></section>';
  } else {
    var p = F.coach(id); if (!p) { notFound('coach'); return; }
    document.title = p.name + ', ' + p.role + ' · Forge Athletic Club';
    listFilter = function (s) { return s.coach.id === p.id; };
    var theirs = F.classes.filter(function (x) { return x.coach === p.id; });
    html = '<section class="dhero coachp" aria-labelledby="ch1"><div class="dhero-media"></div>' +
      '<p class="crumb mono"><a href="index.html#coaches">Coaches</a><span>/</span><span>' + esc(p.name) + '</span></p>' +
      '<div class="dhero-t"><p class="idx mono">' + esc(p.role) + ' · ' + F.branches[p.branch].name + ' · ' + p.years + ' years coaching</p><h1 id="ch1" data-split data-now data-delay=".25">' + esc(p.name) + '</h1>' +
      '<p class="quote" data-reveal data-now data-delay=".5">“' + esc(p.quote) + '”</p>' +
      '<dl class="stats" data-reveal data-now data-delay=".65">' + p.stats.map(function (s) { return '<div><dt class="sr">' + esc(s[1]) + '</dt><dd><b>' + esc(s[0]) + '</b><span class="mono">' + esc(s[1]) + '</span></dd></div>'; }).join('') + '</dl></div>' +
      '<figure class="cportrait"><img src="' + p.photo + '"' + F.ss(p.photo, '(max-width: 860px) 92vw, 40vw') + ' fetchpriority="high" alt="' + esc(p.name) + ', ' + esc(p.role) + '" width="900" height="1125" style="view-transition-name:coach-' + p.id + '"></figure></section>' +
      '<section class="dsec"><div class="g12" style="row-gap:40px"><p class="idx mono c1-3" data-reveal>(01) About</p><div class="c3-8" data-reveal><p style="font-size:clamp(20px,1.7vw,26px);line-height:1.45">' + esc(p.bio) + '</p><p class="mono" style="color:var(--ash);margin-top:24px">' + esc(p.off) + '</p></div>' +
      '<div class="c9-13" style="display:flex;flex-direction:column;gap:26px" data-reveal><div><p class="mono idx">Specialities</p><div class="tagset" style="margin-top:10px">' + p.spec.map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('') + '</div></div>' +
      '<div><p class="mono idx">Qualifications</p><div class="tagset" style="margin-top:10px">' + p.certs.map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('') + '</div></div>' +
      '<div><p class="mono idx">Coaches</p><ul class="bring" style="margin-top:10px">' + theirs.map(function (x) { return '<li><a class="ul" href="class.html?id=' + x.id + '">' + esc(x.name) + '</a></li>'; }).join('') + '</ul></div></div></div></section>' +
      '<section class="dsec" id="pt" style="padding-top:0"><div class="g12 sec-head"><p class="idx mono c1-3">(02) Book a 1:1</p><h2 class="big c3-11" data-split>One hour, <em>just you.</em></h2><p class="c11-13 side">At the ' + F.branches[p.branch].name + ' floor. Race Team members get one a month included.</p></div>' +
      '<div class="g12 pt"><div class="c1-7"><div class="pt-types" role="radiogroup" aria-label="Session type">' + PT.map(function (t, i) { return '<label><input type="radio" name="ptType" value="' + i + '"' + (i ? '' : ' checked') + '><span class="pc"><b>' + t[0] + '</b><span class="mono">' + t[1] + ' min · ' + (t[2] ? F.rupees(t[2]) : 'Included with Race Team') + '</span><span>' + t[3] + '</span></span></label>'; }).join('') + '</div>' +
      '<div class="pt-days" id="ptDays" role="group" aria-label="Day"></div><div class="pt-slots" id="ptSlots" role="group" aria-label="Time"></div></div>' +
      '<form class="form c8-13" id="ptForm" novalidate><p class="mono idx" id="ptSum">Pick a time</p><label class="fld" id="ptName"><span>Your name</span><input name="name" autocomplete="name"><em class="msg"></em></label><label class="fld" id="ptPhone"><span>WhatsApp number</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+91"><em class="msg"></em></label><p class="err mono" id="ptErr" role="alert"></p><button class="btn volt big-btn" type="submit"><span>Request this slot</span></button><p class="fine mono" style="padding:0;color:var(--ash)">Pay at the desk on the day. Free to move up to 24 hours before.</p></form><div class="done c8-13" id="ptDone" hidden tabindex="-1"></div></div></section>' +
      '<section class="dsec tt" id="sessions" style="padding-top:0"><div class="g12 sec-head"><p class="idx mono c1-3">(03) This week</p><h2 class="big c3-11" data-split>Train with <em>' + esc(p.name.split(' ')[0]) + '.</em></h2><p class="c11-13 tt-note mono">Live spots</p></div><div class="tt-list" id="ttList" aria-live="polite"></div></section>' +
      '<section class="dsec" style="padding-top:0"><div class="g12 sec-head"><p class="idx mono c1-3">(04) The other coaches</p></div><div class="more rail">' +
      F.coaches.filter(function (x) { return x.id !== p.id; }).slice(0, 4).map(function (x) { return '<a href="coach.html?id=' + x.id + '"><figure><img src="' + x.photo + '"' + F.ss(x.photo, '(max-width: 860px) 78vw, 24vw') + ' alt="" width="400" height="500" loading="lazy" decoding="async"></figure><span class="mono">' + esc(x.role) + '</span><b>' + esc(x.name) + '</b></a>'; }).join('') + '</div></section>';
  }
  page.innerHTML = html + dialog;
  F.watchVideos(page);


  /* ---------------- coach 1:1 booking → staff back office ---------------- */
  if (isCoach && document.getElementById('ptForm')) (function () {
    var coachId = id && F.coach(id) ? id : F.coaches[0].id, co = F.coach(coachId), day = 1, slot = '', S = ['07:00', '08:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '20:30'];
    var daysEl = document.getElementById('ptDays'), slotsEl = document.getElementById('ptSlots'), sum = document.getElementById('ptSum'), form = document.getElementById('ptForm');
    function dt(k) { var d = new Date(); d.setDate(d.getDate() + k); return d; }
    function taken(iso, t) { var mine = F.get('pt', []).some(function (b) { return b.coach === coachId && b.date === iso && b.time === t; }); var cls = F.sessions(new Date(iso + 'T00:00')).some(function (s) { return s.coach.id === coachId && Math.abs(+s.time.slice(0, 2) - +t.slice(0, 2)) < 1; }); return mine || cls || (F.hash(coachId + iso + t) % 3 === 0); }
    function draw() {
      daysEl.innerHTML = [1, 2, 3, 4, 5, 6, 7].map(function (k) { var d = dt(k); return '<button type="button" data-k="' + k + '" class="' + (k === day ? 'on' : '') + '" aria-pressed="' + (k === day) + '"><span class="mono">' + F.DAYS[F.dow(d)] + '</span><b>' + d.getDate() + '</b></button>'; }).join('');
      var iso = F.iso(dt(day)), free = S.filter(function (t) { return !taken(iso, t); });
      slotsEl.innerHTML = S.map(function (t) { var tk = taken(iso, t); return '<button type="button" data-t="' + t + '"' + (tk ? ' disabled aria-disabled="true"' : '') + ' class="' + (t === slot ? 'on' : '') + '" aria-pressed="' + (t === slot) + '">' + t + (tk ? '<small>Taken</small>' : '') + '</button>'; }).join('') + (free.length ? '' : '<p class="mono" style="grid-column:1/-1;color:var(--ash)">' + esc(co.name.split(' ')[0]) + ' is fully booked this day. Try the next one.</p>');
      var ty = PT[+form.ownerDocument.querySelector('[name=ptType]:checked').value];
      sum.textContent = slot ? ty[0] + ' · ' + F.nice(iso) + ' · ' + slot + ' · ' + ty[1] + ' min · ' + (ty[2] ? F.rupees(ty[2]) : 'Race Team') : 'Pick a time';
    }
    daysEl.addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (!b) return; day = +b.dataset.k; slot = ''; draw(); });
    slotsEl.addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (!b || b.disabled) return; slot = b.dataset.t; document.getElementById('ptErr').textContent = ''; draw(); });
    document.querySelector('.pt-types').addEventListener('change', draw);
    var me = F.get('me', {}); if (me.name) form.name.value = me.name; if (me.phone) form.phone.value = me.phone;
    var vn = F.field(document.getElementById('ptName'), F.check.name), vp = F.field(document.getElementById('ptPhone'), F.check.phone);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!slot) { document.getElementById('ptErr').textContent = 'Pick a time first.'; return; }
      if (!(vn() & vp())) return;
      var ty = PT[+document.querySelector('[name=ptType]:checked').value], iso = F.iso(dt(day));
      var rec = { id: F.uid(), coach: coachId, coachName: co.name, type: ty[0], mins: ty[1], price: ty[2], date: iso, time: slot, branch: co.branch, name: form.name.value.trim(), phone: form.phone.value.trim(), status: 'requested', at: new Date().toISOString() };
      var l = F.get('pt', []); l.unshift(rec); F.set('pt', l); F.set('me', { name: rec.name, phone: rec.phone });
      var done = document.getElementById('ptDone');
      done.innerHTML = '<p class="idx mono">Requested</p><h3>' + esc(ty[0]) + ' with ' + esc(co.name.split(' ')[0]) + '</h3><p class="trial-copy">' + F.nice(iso) + ' at ' + slot + ', ' + F.branches[co.branch].name + '. The front desk confirms on WhatsApp within the hour.</p><div class="acts"><a class="btn volt" href="staff.html#pt"><span>See it in the staff dashboard</span></a></div>';
      form.hidden = true; done.hidden = false; done.focus({ preventScroll: true });
      F.toast('1:1 requested with ' + esc(co.name.split(' ')[0]) + '. It’s in the staff dashboard.');
    });
    draw();
  })();

  var list = document.getElementById('ttList'), current = {};
  function render(flashId) { var l = upcoming(listFilter, 8); current = {}; l.forEach(function (s) { current[s.id] = s; }); list.innerHTML = rows(l, flashId); }
  list.innerHTML = F.skeleton(4);
  setTimeout(function () { render(); }, reduce ? 0 : 380);

  /* booking (same record shape as the home timetable) */
  var dlg = document.getElementById('bookDlg'), bf = document.getElementById('bookForm'), sel = null;
  var vN = F.field(document.getElementById('bfName'), F.check.name), vP = F.field(document.getElementById('bfPhone'), F.check.phone);
  list.addEventListener('click', function (e) {
    var b = e.target.closest('[data-book]');
    if (b) {
      sel = current[b.dataset.book];
      document.getElementById('bookMeta').textContent = F.nice(sel.date) + ' · ' + sel.time + ' · ' + F.branches[sel.branch].name + ' · ' + (sel.left === 1 ? 'last spot' : sel.left + ' left');
      document.getElementById('bookH').textContent = sel.cls.name;
      var me = F.get('me', {}); bf.name.value = me.name || ''; bf.phone.value = me.phone || '';
      [].forEach.call(bf.querySelectorAll('.fld'), function (f) { f.classList.remove('bad', 'ok'); });
      dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
      if (window.Motion && Motion.lenis) Motion.lenis.stop();
    }
    var u = e.target.closest('[data-undo]'); if (u) { var s = current[u.dataset.undo]; F.cancel(u.dataset.undo); render(); F.toast('Cancelled ' + esc(s.cls.name) + ', ' + s.time + '. Your spot went back to the pool.'); }
    var w = e.target.closest('[data-wait]'); if (w) { var me2 = F.get('me', {}), ws = current[w.dataset.wait], wr = F.joinWaitlist(ws, { name: me2.name || 'Website visitor', phone: me2.phone || '' }); w.disabled = true; w.innerHTML = I.tick + '<span>#' + wr.pos + ' on list</span>'; w.classList.add('is-done'); F.toast('You’re #' + wr.pos + ' on the waitlist. The desk promotes you if a spot opens.'); }
  });
  dlg.addEventListener('close', function () { if (window.Motion && Motion.lenis) Motion.lenis.start(); });
  document.getElementById('bookCancel').addEventListener('click', function () { dlg.close ? dlg.close() : dlg.removeAttribute('open'); });
  bf.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!(vN() & vP())) { (bf.querySelector('.bad input') || bf.name).focus(); return; }
    var n = bf.name.value.trim(), ph = bf.phone.value.trim();
    F.set('me', { name: n, phone: ph }); F.book(sel, { name: n, phone: ph });
    dlg.close ? dlg.close() : dlg.removeAttribute('open'); render(sel.id);
    F.toast('Spot booked: ' + esc(sel.cls.name) + ', ' + F.nice(sel.date) + ' ' + sel.time + '. It’s in the <a href="staff.html">staff dashboard</a>.');
  });
})();
