/* Taradhura booking engine: availability calendar → cottage + meals → add-ons → guest details → demo payment → confirmation.
   Uses the shared rate engine (engine.js); the booking lands in the back office (staff.html) and in "My booking". */
(function () {
  'use strict';
  var TD = window.TD, ui = TD.ui, $ = ui.$, $$ = ui.$$, esc = ui.esc, D = TD.date, today = D.today();
  var qs = new URLSearchParams(location.search);
  var st = { in: null, out: null, adults: 2, kids: [], rooms: 1, type: null, plan: 'bb', addons: { late: 1 }, guest: {}, pay: 'full', method: 'upi' };
  try { var saved = JSON.parse(sessionStorage.getItem('td:draft') || 'null'); if (saved && saved.in >= today) st = Object.assign(st, saved); } catch (e) {}
  if (qs.get('in') && qs.get('in') >= today) { st.in = qs.get('in'); st.out = qs.get('out') && qs.get('out') > st.in ? qs.get('out') : D.add(st.in, 2); }
  if (qs.get('ad')) st.adults = Math.max(1, Math.min(8, +qs.get('ad') || 2));
  if (qs.get('type') && TD.type(qs.get('type'))) st.type = qs.get('type');
  // a window chosen on the ridge (home page): that room, of that type, goes first in the quote
  st.room = null;
  if (qs.get('room')) { var rq = qs.get('room').toUpperCase(), rt = TD.allRooms.filter(function (x) { return x.id === rq; })[0]; if (rt) { st.type = rt.type; st.room = rq; } }
  var step = 0, maxStep = 0;
  function save() { try { var c = Object.assign({}, st); delete c.guest; sessionStorage.setItem('td:draft', JSON.stringify(c)); } catch (e) {} }
  function req() { return { type: st.type, room: st.room, checkin: st.in, checkout: st.out, rooms: st.rooms, adults: st.adults, kids: st.kids, plan: st.plan, addons: st.addons, pay: st.pay }; }

  // ---------- steps ----------
  var panes = $$('.be-pane'), stepBtns = $$('#steps button');
  function go(n, focus) {
    step = n; maxStep = Math.max(maxStep, n);
    panes.forEach(function (p) { p.classList.toggle('on', +p.dataset.p === n); });
    stepBtns.forEach(function (b, i) { b.disabled = i > maxStep || n === 5; b.classList.toggle('done', i < n || n === 5); if (i === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    if (n === 1) renderOpts(); if (n === 2) renderAdds(); if (n === 4) renderPay();
    var top = $('#be').getBoundingClientRect().top + scrollY - 100;
    if (scrollY > top) { if (window.Motion && Motion.lenis) Motion.lenis.scrollTo(top, { immediate: ui.reduce }); else scrollTo(0, top); }
    if (focus !== false) { var h = panes[n].querySelector('h2') || panes[n]; h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    summary(); save();
  }
  stepBtns.forEach(function (b) { b.addEventListener('click', function () { go(+b.dataset.s); }); });
  $$('[data-back]').forEach(function (b) { b.addEventListener('click', function () { go(+b.dataset.back); }); });

  // ---------- 1 · calendar ----------
  var view = st.in ? st.in.slice(0, 7) + '-01' : today.slice(0, 7) + '-01', hover = null;
  function addMonths(iso, n) { var d = D.parse(iso); d.setUTCMonth(d.getUTCMonth() + n); return D.iso(d); }
  function dayInfo(d) {
    var best = Infinity, free = 0, types = st.type ? [TD.type(st.type)] : TD.types;
    types.forEach(function (t) { var a = TD.availOn(t.id, d); free += a; if (a) best = Math.min(best, TD.nightly(t.id, d)); });
    return { free: free, price: best === Infinity ? 0 : best };
  }
  function month(iso) {
    var d0 = D.parse(iso), y = d0.getUTCFullYear(), m = d0.getUTCMonth();
    var first = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7, days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    var h = '<div class="cal-m"><h3>' + d0.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }) + '</h3><div class="cal-g">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (w) { return '<span class="w" aria-hidden="true">' + w.slice(0, 2) + '</span>'; }).join('');
    for (var i = 0; i < first; i++) h += '<span></span>';
    var picking = st.in && !st.out ? 'out' : 'in';
    for (var dd = 1; dd <= days; dd++) {
      var iso2 = D.iso(new Date(Date.UTC(y, m, dd))), past = iso2 < today, info = past ? { free: 0, price: 0 } : dayInfo(iso2);
      var cls = ['cal-d'], dis = past, label = D.long(iso2);
      if (TD.isWeekend(iso2)) cls.push('we');
      if (iso2 === today) cls.push('today');
      if (!past && !info.free) { cls.push('full'); if (picking === 'in') dis = true; }
      else if (!past && info.free <= 2) cls.push('few');
      if (picking === 'out' && st.in) { if (iso2 <= st.in) dis = true; var ms = TD.minStay(st.in); if (iso2 > st.in && D.diff(st.in, iso2) < ms) { dis = true; label += ', minimum stay ' + ms + ' nights'; } }
      if (st.in === iso2) cls.push('in'); if (st.out === iso2) cls.push('out');
      if (st.in && st.out && iso2 > st.in && iso2 < st.out) cls.push('mid');
      if (st.in && !st.out && hover && iso2 > st.in && iso2 < hover) cls.push('hov');
      label += past ? '' : info.free ? ', from ' + TD.inr(info.price) + (info.free <= 2 ? ', last few rooms' : '') : ', full';
      var p = past ? '' : info.free ? '₹' + (info.price / 1000).toFixed(info.price % 1000 ? 1 : 0) + 'k' : 'Full';
      if (picking === 'out' && st.in && iso2 > st.in && !past) p = info.free || iso2 === st.out ? p : 'out ✓';
      h += '<button type="button" class="' + cls.join(' ') + '" data-d="' + iso2 + '"' + (dis ? ' disabled' : '') + (st.in === iso2 || st.out === iso2 ? ' aria-pressed="true"' : '') + '><span class="n">' + dd + '</span><span class="p">' + p + '</span><span class="sr">, ' + esc(label) + '</span></button>';
    }
    return h + '</div></div>';
  }
  function cal() {
    $('#cal').innerHTML = month(view) + month(addMonths(view, 1));
    $('#cal-prev').disabled = view <= today.slice(0, 7) + '-01';
    $('#cal-next').disabled = view >= addMonths(today.slice(0, 7) + '-01', 10);
    var s = $('#cal-sel');
    if (st.in && st.out) s.innerHTML = '<b>' + D.long(st.in) + '</b> → <b>' + D.long(st.out) + '</b> · ' + TD.nights(D.diff(st.in, st.out)) + ' <button class="ul" type="button" id="cal-clear" style="margin-left:10px;color:var(--ember);font-weight:600">Change</button>';
    else if (st.in) s.innerHTML = 'Arriving <b>' + D.long(st.in) + '</b>. Now pick your departure' + (TD.minStay(st.in) > 1 ? ' (minimum ' + TD.minStay(st.in) + ' nights from this date)' : '') + '.';
    else s.textContent = 'Select your arrival date';
    var c = $('#cal-clear'); if (c) c.onclick = function () { st.in = st.out = null; cal(); check0(); };
    check0();
  }
  $('#cal').addEventListener('click', function (e) {
    var b = e.target.closest('.cal-d'); if (!b || b.disabled) return; var d = b.dataset.d;
    if (!st.in || st.out || d <= st.in) { st.in = d; st.out = null; }
    else st.out = d;
    cal(); summary(); save();
    var again = $('.cal-d[data-d="' + d + '"]'); again && again.focus();
  });
  $('#cal').addEventListener('pointerover', function (e) { var b = e.target.closest('.cal-d'); if (!b || !st.in || st.out) return; if (hover !== b.dataset.d) { hover = b.dataset.d; $$('.cal-d').forEach(function (x) { x.classList.toggle('hov', x.dataset.d > st.in && x.dataset.d < hover); }); } });
  $('#cal').addEventListener('keydown', function (e) { // arrow keys move between days
    var b = e.target.closest('.cal-d'); if (!b) return; var k = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]; if (!k) return;
    e.preventDefault(); var all = $$('.cal-d'), i = all.indexOf(b), j = i + k; while (all[j] && all[j].disabled) j += k > 0 ? 1 : -1; if (all[j]) all[j].focus();
  });
  $('#cal-prev').onclick = function () { view = addMonths(view, -1); cal(); };
  $('#cal-next').onclick = function () { view = addMonths(view, 1); cal(); };

  // guests
  function stepper(k, min, max, get, set) {
    var el = $('.step[data-k="' + k + '"]'), out = el.querySelector('output'), bs = el.querySelectorAll('button');
    function paint() { var v = get(); out.textContent = v; bs[0].disabled = v <= min(); bs[1].disabled = v >= max(); }
    bs[0].onclick = function () { set(get() - 1); paint(); }; bs[1].onclick = function () { set(get() + 1); paint(); };
    paint(); return paint;
  }
  var pA = stepper('adults', function () { return 1; }, function () { return 12; }, function () { return st.adults; }, function (v) { st.adults = v; changed(); });
  var pK = stepper('kids', function () { return 0; }, function () { return 6; }, function () { return st.kids.length; }, function (v) { while (st.kids.length < v) st.kids.push(8); st.kids.length = v; ages(); changed(); });
  function ages() {
    var a = $('#ages'); a.hidden = !st.kids.length;
    a.innerHTML = st.kids.map(function (age, i) { return '<label>Child ' + (i + 1) + ' age<select data-i="' + i + '">' + Array.from({ length: 13 }, function (_, n) { return '<option' + (n === age ? ' selected' : '') + ' value="' + n + '">' + (n === 0 ? 'Under 1' : n) + '</option>'; }).join('') + '</select></label>'; }).join('') + '<p class="small muted" style="width:100%;margin:4px 0 0">Ages help us set up beds and price meals: under 6 free, 6 to 11 half.</p>';
    $$('select', a).forEach(function (s) { s.onchange = function () { st.kids[+s.dataset.i] = +s.value; changed(); }; });
  }
  function changed() { summary(); save(); if (step === 1) renderOpts(); }
  function check0() {
    var ok = st.in && st.out; $('#to1').disabled = !ok;
    $('#p0-note').textContent = ok ? TD.nights(D.diff(st.in, st.out)) + ', ' + st.adults + ' adult' + (st.adults > 1 ? 's' : '') + (st.kids.length ? ', ' + st.kids.length + ' child' + (st.kids.length > 1 ? 'ren' : '') : '') : 'Free date changes up to 7 days before arrival.';
  }
  $('#to1').onclick = function () { go(1); };
  ages(); cal();

  // ---------- 2 · cottage + meals ----------
  // the room chosen from its window on the ridge, if there is one
  function windowNote() {
    if (!st.room || !st.type || st.rooms > 1) return '';
    var t = TD.type(st.type), free = TD.freeRooms(st.type, st.in, st.out);
    return free.indexOf(st.room) >= 0 ? ' Your window: ' + t.name + ' ' + st.room + ', held for you on the ridge.' : ' ' + st.room + ' is taken for these dates, so we will give you the next free ' + t.name + '.';
  }
  function renderOpts() {
    if (!st.in || !st.out) return;
    $('#p1-sub').textContent = D.fmt(st.in, { weekday: 'short' }) + ' to ' + D.fmt(st.out, { weekday: 'short' }) + ' · ' + TD.nights(D.diff(st.in, st.out)) + ' · ' + st.adults + ' adult' + (st.adults > 1 ? 's' : '') + (st.kids.length ? ' + ' + st.kids.length + ' child' + (st.kids.length > 1 ? 'ren' : '') : '') + '. Totals include breakfast, before GST.' + windowNote();
    var list = TD.types.map(function (t) {
      // how many cottages this party needs at minimum
      var need = Math.max(1, Math.ceil(st.adults / t.maxAdults), Math.ceil((st.adults + st.kids.length) / t.maxGuests), t.maxKids ? Math.ceil(st.kids.length / t.maxKids) : st.kids.length ? 99 : 1);
      var rooms = st.type === t.id ? Math.max(st.rooms, need) : need;
      var q = TD.quote({ type: t.id, checkin: st.in, checkout: st.out, rooms: Math.min(rooms, t.rooms.length), adults: st.adults, kids: st.kids, plan: 'bb' });
      return { t: t, q: q, need: need, ok: !q.errors.length && need <= t.rooms.length };
    }).sort(function (a, b) { return (b.ok - a.ok) || (a.t.base - b.t.base); });
    if (st.type && !list.some(function (o) { return o.ok && o.t.id === st.type; })) st.type = null;
    if (!st.type) { var f = list.filter(function (o) { return o.ok; })[0]; if (f && qs.get('type') == null) {} }
    $('#opts').innerHTML = list.map(function (o) {
      var t = o.t, q = o.q, nights = D.diff(st.in, st.out), why = o.need > t.rooms.length ? (t.maxKids ? 'Too many guests for ' + t.plural + '.' : t.name + ' is for two adults only.') : q.errors[0];
      return '<label class="opt' + (o.ok ? '' : ' na') + '"><input type="radio" name="type" value="' + t.id + '"' + (st.type === t.id ? ' checked' : '') + (o.ok ? '' : ' disabled') + '>' +
        '<figure>' + ui.photo(t.hero, '', '200px') + '</figure>' +
        '<div><h3>' + esc(t.plural) + '</h3><p class="sub">' + esc(t.line) + '</p><div class="meta"><span class="tag">' + t.size + ' m²</span><span class="tag">Sleeps ' + esc(t.sleeps) + '</span>' + (o.ok && q.free.length <= 2 && t.rooms.length > 1 ? '<span class="tag lamp">' + q.free.length + ' left</span>' : '') + (o.need > 1 && o.ok ? '<span class="tag">' + o.need + ' needed</span>' : '') + '</div>' + (o.ok ? '' : '<p class="why">' + esc(why || 'Not available') + '</p>') + '</div>' +
        '<div class="pr">' + (o.ok ? '<div><b>' + TD.inr(q.subtotal) + '</b><span>' + TD.inr(Math.round(q.lines[0].amt / nights / q.rooms)) + ' avg a night</span></div><span class="sel">' + (st.type === t.id ? 'Selected' : 'Choose') + '</span>' : '<span class="small muted">' + (q.free && q.free.length ? '' : 'Full') + '</span>') + '</div></label>';
    }).join('');
    $$('#opts input').forEach(function (r) { r.onchange = function () { if (st.room && (TD.allRooms.filter(function (x) { return x.id === st.room; })[0] || {}).type !== r.value) st.room = null; st.type = r.value; var o = list.filter(function (x) { return x.t.id === r.value; })[0]; st.rooms = o.need; if (st.addons.pet && st.type !== 'deodar') delete st.addons.pet; renderOpts(); summary(); save(); }; });
    // rooms
    var sel = list.filter(function (o) { return o.t.id === st.type; })[0];
    $('#rooms-row').hidden = !sel || sel.t.rooms.length < 2;
    if (sel) { $('#rooms-note').textContent = sel.need > 1 ? 'Your party needs at least ' + sel.need : 'Add a second for friends or grandparents'; paintRooms && paintRooms(); }
    $('#to2').disabled = !sel;
    plans();
  }
  var paintRooms = stepper('rooms', function () { var t = TD.type(st.type); if (!t) return 1; return Math.max(1, Math.ceil(st.adults / t.maxAdults), Math.ceil((st.adults + st.kids.length) / t.maxGuests)); }, function () { var t = TD.type(st.type); return t ? TD.freeRooms(t.id, st.in || today, st.out || D.add(today, 1)).length : 1; }, function () { return st.rooms; }, function (v) { st.rooms = v; summary(); save(); });
  function plans() {
    var n = st.in && st.out ? D.diff(st.in, st.out) : 1;
    $('#plans').innerHTML = TD.plans.map(function (p) {
      var add = p.pp ? TD.inr(p.pp) + ' per adult a night' : 'Included';
      return '<label><input type="radio" name="plan" value="' + p.id + '"' + (st.plan === p.id ? ' checked' : '') + '><b>' + esc(p.name) + '</b><span>' + esc(p.note) + '</span><em>' + add + '</em></label>';
    }).join('');
    $$('#plans input').forEach(function (r) { r.onchange = function () { st.plan = r.value; summary(); save(); }; });
  }
  $('#to2').onclick = function () { if (st.type) go(2); };

  // ---------- 3 · add-ons ----------
  function guests() { return st.adults + st.kids.length; }
  function renderAdds() {
    var groups = {}, n = D.diff(st.in, st.out);
    TD.addons.forEach(function (a) { if (a.only && a.only.indexOf(st.type) < 0) return; (groups[a.group] = groups[a.group] || []).push(a); });
    $('#adds').innerHTML = Object.keys(groups).map(function (g) {
      return '<h3>' + esc(g) + '</h3>' + groups[g].map(function (a) {
        var q = st.addons[a.id] || 0, multi = a.max || a.perGuest;
        var ctl = multi ? '<div class="step" data-a="' + a.id + '"><button type="button" aria-label="Fewer: ' + esc(a.name) + '"' + (q ? '' : ' disabled') + '>−</button><output>' + q + '</output><button type="button" aria-label="More: ' + esc(a.name) + '"' + (q >= (a.max || guests()) ? ' disabled' : '') + '>+</button></div>'
          : '<button type="button" class="tgl" role="switch" aria-checked="' + (q ? 'true' : 'false') + '" data-a="' + a.id + '" aria-label="' + esc(a.name) + '"></button>';
        var price = a.price ? TD.inr(a.price) + '<small>' + a.unit + '</small>' : '<b style="color:var(--ok)">Free</b><small>direct only</small>';
        return '<div class="add"><div><b>' + esc(a.name) + '</b><p>' + esc(a.note) + '</p></div><div class="amt">' + price + '</div><div class="ctl">' + ctl + '</div></div>';
      }).join('');
    }).join('');
    $$('#adds .tgl').forEach(function (b) { b.onclick = function () { var id = b.dataset.a; if (st.addons[id]) delete st.addons[id]; else st.addons[id] = 1; b.setAttribute('aria-checked', !!st.addons[id]); summary(); save(); }; });
    $$('#adds .step').forEach(function (s) {
      var id = s.dataset.a, a = TD.addon(id), bs = s.querySelectorAll('button'), out = s.querySelector('output');
      function set(v) { v = Math.max(0, Math.min(a.max || guests(), v)); if (v) st.addons[id] = v; else delete st.addons[id]; out.textContent = v; bs[0].disabled = !v; bs[1].disabled = v >= (a.max || guests()); summary(); save(); }
      bs[0].onclick = function () { set((st.addons[id] || 0) - 1); }; bs[1].onclick = function () { set((st.addons[id] || 0) + (a.perGuest && !st.addons[id] ? guests() : 1)); };
    });
  }
  $('#to3').onclick = function () { go(3); };

  // ---------- 4 · details ----------
  var gf = $('#gform');
  $('#gst-on').onchange = function () { $('#gst').hidden = !this.checked; };
  function setErr(input, msg) { var f = input.closest('.field'); if (!f) return; f.classList.toggle('err', !!msg); f.querySelector('.msg').textContent = msg || ''; input.setAttribute('aria-invalid', msg ? 'true' : 'false'); }
  var RULES = {
    first: function (v) { return v.trim().length < 2 ? 'Your first name, please, as it is on your ID.' : ''; },
    last: function (v) { return v.trim().length < 2 ? 'And your last name.' : ''; },
    email: function (v) { return !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? 'That email doesn’t look complete. We send the confirmation here.' : ''; },
    phone: function (v) { var d = v.replace(/\D/g, ''); return d.length < 10 || d.length > 13 ? 'A mobile number with country code, so the driver can reach you.' : ''; },
    gstin: function (v) { return $('#gst-on').checked && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(v.trim().toUpperCase()) ? 'A GSTIN has 15 characters: state code, PAN, entity number, Z and a check digit.' : ''; },
    company: function (v) { return $('#gst-on').checked && v.trim().length < 2 ? 'The company name as registered for GST.' : ''; }
  };
  Object.keys(RULES).forEach(function (k) { var i = gf.elements[k]; i.addEventListener('blur', function () { if (i.value) setErr(i, RULES[k](i.value)); }); i.addEventListener('input', function () { if (i.closest('.field').classList.contains('err')) setErr(i, RULES[k](i.value)); }); });
  if (st.guest && st.guest.first) Object.keys(st.guest).forEach(function (k) { if (gf.elements[k] && typeof st.guest[k] === 'string') gf.elements[k].value = st.guest[k]; });
  $('#to4').onclick = function () {
    var bad = null;
    Object.keys(RULES).forEach(function (k) { var i = gf.elements[k], m = RULES[k](i.value); setErr(i, m); if (m && !bad) bad = i; });
    var agree = gf.elements.agree.checked; $('#agree-msg').textContent = agree ? '' : 'Please confirm you have read the cancellation policy.';
    if (bad) { bad.focus(); return; } if (!agree) { gf.elements.agree.focus(); return; }
    st.guest = { first: gf.elements.first.value.trim(), last: gf.elements.last.value.trim(), email: gf.elements.email.value.trim(), phone: gf.elements.phone.value.trim(), city: gf.elements.city.value.trim(), arrival: gf.elements.arrival.value, requests: gf.elements.requests.value.trim() };
    if ($('#gst-on').checked) st.guest.gst = { name: gf.elements.company.value.trim(), gstin: gf.elements.gstin.value.trim().toUpperCase() };
    go(4);
  };

  // ---------- 5 · payment: methods are choices, one button, no number fields ----------
  var holdT = null;
  function renderPay() {
    var q = TD.quote(req());
    var modes = [['full', 'Pay in full now', '5% off for paying today', q.prepaid], ['deposit', 'Pay 30% now', 'The rest at check-in, by UPI or card', q.deposit]];
    $('#paymodes').innerHTML = modes.map(function (m) { return '<label><input type="radio" name="pay" value="' + m[0] + '"' + (st.pay === m[0] ? ' checked' : '') + '><span><b>' + m[1] + '</b><span>' + m[2] + '</span></span><span class="amt">' + TD.inr(m[3]) + '</span></label>'; }).join('');
    $$('#paymodes input').forEach(function (r) { r.onchange = function () { st.pay = r.value; summary(); amt(); save(); }; });
    amt();
    var end = Date.now() + 15 * 60e3; clearInterval(holdT);
    holdT = setInterval(function () { var s = Math.max(0, Math.round((end - Date.now()) / 1000)); $('#hold').textContent = 'Held for ' + Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); if (!s) clearInterval(holdT); }, 1000);
  }
  function amt() { var q = TD.quote(req()); $('#pay .lbl').textContent = 'Pay ' + TD.inr(q.dueNow); }
  $('#pay').onclick = function () { var m = (document.querySelector('input[name="method"]:checked') || {}).value || 'UPI'; st.method = m; pay(this, m); };
  function pay(btn, method) {
    btn.classList.add('busy'); btn.setAttribute('aria-busy', 'true');
    var msgs = ['Waiting for the bank…', 'Confirming your cottage…'];
    ui.toast(msgs[0]);
    setTimeout(function () { ui.toast(msgs[1]); }, 900);
    setTimeout(function () {
      var q = TD.quote(req());
      var res = TD.createBooking(req(), st.guest, { mode: st.pay, method: method, paid: q.dueNow });
      btn.classList.remove('busy'); btn.removeAttribute('aria-busy');
      if (res.error) { ui.toast('Someone just booked the last one: ' + res.error); go(1); return; }
      clearInterval(holdT);
      try { sessionStorage.removeItem('td:draft'); localStorage.setItem('taradhura:last-ref', res.booking.ref); } catch (e) {}
      confirmPane(res.booking, res.quote, q.dueNow, method);
    }, 1900);
  }
  function ics(b) {
    var t = TD.type(b.type), f = function (d) { return d.replace(/-/g, ''); };
    var body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Taradhura//EN', 'BEGIN:VEVENT', 'UID:' + b.ref + '@taradhura.in', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', 'DTSTART;VALUE=DATE:' + f(b.checkin), 'DTEND;VALUE=DATE:' + f(b.checkout), 'SUMMARY:Taradhura · ' + t.name + ' (' + b.ref + ')', 'LOCATION:Taradhura\\, Dhura village\\, above Mukteshwar\\, Uttarakhand', 'DESCRIPTION:Check-in from 2 pm. Manage your booking at taradhura.in/my-booking.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
  }
  function cancelNote(b) {
    var days = D.diff(today, b.checkin), mon = TD.season(b.checkin).id === 'monsoon';
    if (mon) return days >= 7 ? '<b>Free until ' + D.fmt(D.add(b.checkin, -7)) + '</b><br><small class="muted">monsoon flexi</small>' : '<b>50% refund</b><br><small class="muted">inside 7 days</small>';
    if (days >= 21) return '<b>Free until ' + D.fmt(D.add(b.checkin, -21)) + '</b><br><small class="muted">then 50% until 7 days</small>';
    if (days >= 7) return '<b>50% until ' + D.fmt(D.add(b.checkin, -7)) + '</b><br><small class="muted">date changes free</small>';
    return '<b>Non-refundable</b><br><small class="muted">inside 7 days</small>';
  }
  function confirmPane(b, q, paid, method) {
    var t = TD.type(b.type), n = D.diff(b.checkin, b.checkout);
    var p = $('[data-p="5"]');
    p.innerHTML = '<p class="kicker"><span class="dot"></span> Confirmed</p><h2 id="p5-h" style="margin-top:16px">See you on the ridge, ' + esc(b.guest.first) + '.</h2>' +
      '<p>Your ' + esc(t.name) + ' is booked. A confirmation is on its way to ' + esc(b.guest.email) + '.</p>' +
      '<div class="conf-ref"><span class="small muted">Booking reference</span><b>' + b.ref + '</b><button class="ul small" type="button" id="copy-ref" style="font-weight:600">Copy</button></div>' +
      '<div class="voucher" id="voucher"><div><div><span>Arrive</span><b>' + D.long(b.checkin) + '</b><br><small class="muted">from 2 pm</small></div><div><span>Leave</span><b>' + D.long(b.checkout) + '</b><br><small class="muted">by 2 pm (direct perk)</small></div><div><span>Cottage</span><b>' + esc(t.name) + (q.rooms > 1 ? ' × ' + q.rooms : '') + '</b><br><small class="muted">' + b.room + (q.rooms > 1 ? ' + more' : '') + '</small></div><div><span>Guests</span><b>' + b.adults + ' adult' + (b.adults > 1 ? 's' : '') + (b.kids.length ? ', ' + b.kids.length + ' child' + (b.kids.length > 1 ? 'ren' : '') : '') + '</b><br><small class="muted">' + esc(TD.plans.filter(function (x) { return x.id === b.plan; })[0].name) + '</small></div></div>' +
      '<div><div><span>Total</span><b>' + TD.inr(q.total) + '</b><br><small class="muted">incl. GST</small></div><div><span>Paid now</span><b>' + TD.inr(paid) + '</b><br><small class="muted">' + esc(method) + '</small></div><div><span>Due at check-in</span><b>' + TD.inr(Math.max(0, (st.pay === 'full' ? q.prepaid : q.total) - paid)) + '</b><br><small class="muted">' + (st.pay === 'full' ? 'nothing more' : 'UPI or card') + '</small></div><div><span>Cancellation</span>' + cancelNote(b) + '</div></div></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:28px" class="no-print"><a class="btn" href="my-booking.html?ref=' + b.ref + '&email=' + encodeURIComponent(b.guest.email) + '"><span class="lbl">Manage my booking</span> <span class="ar" aria-hidden="true">→</span></a><a class="btn line" id="ics" download="taradhura-' + b.ref + '.ics"><span class="lbl">Add to calendar</span></a><button class="btn line" type="button" id="print"><span class="lbl">Print voucher</span></button></div>' +
      '<p class="small muted" style="margin-top:28px;max-width:60ch">What happens next: we write a week before with the weather and directions, and the driver’s name the day before if you booked a transfer. Questions before then? <a class="ul" href="my-booking.html?ref=' + b.ref + '&email=' + encodeURIComponent(b.guest.email) + '#write">Write to the front desk</a>.</p>';
    $('#ics').href = ics(b);
    $('#print').onclick = function () { print(); };
    $('#copy-ref').onclick = function () { try { navigator.clipboard.writeText(b.ref); ui.toast('Reference copied'); } catch (e) { ui.toast(b.ref); } };
    go(5);
    $('#sum').classList.remove('open');
    if (window.gsap && !ui.reduce) gsap.from('#voucher > div', { y: 24, opacity: 0, duration: 1, stagger: .1, ease: 'expo.out', delay: .2 });
  }

  // ---------- summary ----------
  function summary() {
    var t = TD.type(st.type), body = $('#sum-body');
    $('#sum-name').textContent = t ? t.plural : 'Taradhura';
    var img = $('#sum-img'), want = 'photos/' + (t ? t.hero : 'range-dusk') + '-s.jpg'; if (img.getAttribute('src') !== want) img.src = want;
    var h = '<div class="sum-dates"><div><span>Arrive</span><b>' + (st.in ? D.fmt(st.in, { weekday: 'short' }) : '—') + '</b></div><div><span>Leave</span><b>' + (st.out ? D.fmt(st.out, { weekday: 'short' }) : '—') + '</b></div></div>';
    h += '<div class="sum-row"><span>Guests</span><span>' + st.adults + ' adult' + (st.adults > 1 ? 's' : '') + (st.kids.length ? ', ' + st.kids.length + ' child' + (st.kids.length > 1 ? 'ren' : '') : '') + '</span></div>';
    if (!st.in || !st.out) { body.innerHTML = h + '<p class="sum-empty">Choose your dates to see live rates.</p>'; $('#sum-mt').textContent = 'Pick dates'; return; }
    if (!t) {
      var from = Math.min.apply(null, TD.types.map(function (x) { return TD.nightly(x.id, st.in); }));
      body.innerHTML = h + '<div class="sum-row"><span>Nights</span><span>' + D.diff(st.in, st.out) + '</span></div><p class="sum-empty">From ' + TD.inr(from) + ' a night. Choose a cottage next.</p>'; $('#sum-mt').textContent = 'from ' + TD.inr(from); return;
    }
    var q = TD.quote(req());
    h += q.lines.filter(function (l) { return l.amt !== 0; }).map(function (l) { return '<div class="sum-row' + (l.amt < 0 ? ' neg' : '') + '"><span>' + esc(l.label) + '</span><span>' + (l.amt < 0 ? '−' : '') + TD.inr(Math.abs(l.amt)) + '</span></div>'; }).join('');
    if (st.addons.late) h += '<div class="sum-row neg"><span>2 pm check-out</span><span>Free</span></div>';
    h += '<details class="sum-nights"><summary>Night by night</summary><ol>' + q.nights.map(function (nn) { return '<li><span>' + D.fmt(nn.date, { weekday: 'short' }) + ' <i>' + esc(nn.why.join(' · ')) + '</i></span><span>' + TD.inr(nn.rate * q.rooms) + '</span></li>'; }).join('') + '</ol></details>';
    h += '<div class="sum-row"><span>GST 18%</span><span>' + TD.inr(q.gst) + '</span></div>';
    h += '<div class="sum-total"><span>Total</span><b>' + TD.inr(q.total) + '</b></div>';
    if (step >= 4) h += '<div class="sum-row" style="margin-top:6px"><span><b>Due now</b></span><span><b>' + TD.inr(q.dueNow) + '</b></span></div>';
    if (q.save > 0) h += '<div class="sum-save">Booking direct saves about <b>' + TD.inr(q.save) + '</b> against travel portals, and breakfast is included.</div>';
    if (q.errors.length) h += '<div class="sum-errs">' + q.errors.map(function (e) { return '<p>' + esc(e) + '</p>'; }).join('') + '</div>';
    body.innerHTML = h; $('#sum-mt').textContent = TD.inr(q.total);
    $('#sum-ms').textContent = TD.nights(q.n) + ' · details ↑';
  }
  $('#sum-m').onclick = function () { var o = $('#sum').classList.toggle('open'); this.setAttribute('aria-expanded', o); };

  // ---------- start ----------
  summary();
  if (st.in && st.out && st.type) { maxStep = 1; go(1, false); } else go(0, false);
})();
