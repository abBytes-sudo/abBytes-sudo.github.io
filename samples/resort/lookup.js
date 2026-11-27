/* Taradhura "My booking": find by reference + email/last name, then manage the stay in place.
   Every change writes to the same demo store the back office reads (staff.html). */
(function () {
  'use strict';
  var TD = window.TD, ui = TD.ui, $ = ui.$, $$ = ui.$$, esc = ui.esc, D = TD.date, today = D.today();
  var qs = new URLSearchParams(location.search), cur = null;
  var last = null; try { last = localStorage.getItem('taradhura:last-ref'); } catch (e) {}
  if (last && last !== 'TD-4M8PK') { var lb = TD.findBooking(last); if (lb) $('#try-last').innerHTML = ', or your last booking <button type="button" class="ul" id="try-mine" style="font-weight:600;color:var(--ember)">' + esc(last) + '</button>'; }
  function fill(ref, who) { $('#f-ref').value = ref; $('#f-who').value = who; find(); }
  $('#try-demo').onclick = function () { fill('TD-4M8PK', 'Bisht'); };
  document.addEventListener('click', function (e) { if (e.target.id === 'try-mine') { var b = TD.findBooking(last); fill(b.ref, b.guest.email); } });
  $('#find').addEventListener('submit', function (e) { e.preventDefault(); find(); });

  function find() {
    var ref = $('#f-ref').value.trim().toUpperCase(), who = $('#f-who').value.trim().toLowerCase(), m = $('#find-msg');
    if (!/^TD-[A-Z0-9]{5}$/.test(ref)) { m.innerHTML = '<span style="color:var(--bad)">A reference looks like TD- and five letters or numbers, e.g. TD-4M8PK. It’s in your confirmation email.</span>'; $('#f-ref').focus(); return; }
    if (!who) { m.innerHTML = '<span style="color:var(--bad)">Add the email or last name on the booking, so only you can open it.</span>'; $('#f-who').focus(); return; }
    $('#res').innerHTML = '<div class="skel" style="height:120px"></div><div class="skel" style="height:320px;margin-top:16px"></div>';
    setTimeout(function () {
      var b = TD.findBooking(ref);
      if (!b || !(b.guest.email.toLowerCase() === who || b.guest.last.toLowerCase() === who)) {
        cur = null; $('#res').innerHTML = '<div class="state"><h3>We couldn’t find that booking</h3><p>Check the reference in your confirmation email, and use the same email or last name you booked with. Booked through a travel portal? Manage it there, or write to us.</p><a class="btn line sm" href="book.html"><span class="lbl">Make a new booking</span></a></div>';
        m.textContent = 'No match for ' + ref + '.'; return;
      }
      cur = b.ref; m.textContent = 'Found ' + b.ref + '.'; render();
      try { history.replaceState(null, '', 'my-booking.html?ref=' + b.ref + '&email=' + encodeURIComponent(b.guest.email) + location.hash); } catch (e) {}
      if (location.hash === '#write') setTimeout(function () { var t = $('#msg-t'); t && t.focus(); t && t.scrollIntoView({ block: 'center' }); }, 200);
    }, 450);
  }

  var STATUS = { confirmed: ['Confirmed', 'ok'], tentative: ['On hold', ''], 'in-house': ['In house', 'lamp'], 'checked-out': ['Stayed', ''], cancelled: ['Cancelled', 'bad'] };
  function render() {
    var b = TD.findBooking(cur), t = TD.type(b.type), n = D.diff(b.checkin, b.checkout), q = TD.requote(b);
    var paid = (b.pay && b.pay.paid) || 0, total = b.total || q.total, bal = b.pay && b.pay.mode === 'ota' ? 0 : Math.max(0, (b.pay && b.pay.mode === 'full' ? Math.round(total * (1 - TD.pricing.prepaid)) : total) - paid);
    var days = D.diff(today, b.checkin), live = b.status === 'confirmed' || b.status === 'tentative';
    var st = STATUS[b.status] || ['', ''];
    var plan = TD.plans.filter(function (p) { return p.id === b.plan; })[0];
    var adds = Object.keys(b.addons || {}).filter(function (k) { return b.addons[k]; });
    var thread = (TD.messages()[b.ref] || []);
    var html = '<div class="mb"><div class="mb-card" id="card">' +
      '<header><div><p class="kicker">' + b.ref + ' · ' + esc(b.source) + '</p><h2 style="margin-top:12px">' + esc(t.name) + ' ' + b.room + '</h2><p class="muted small" style="margin:10px 0 0">' + esc(b.guest.first + ' ' + b.guest.last) + ' · ' + esc(b.guest.email) + '</p></div><span class="tag ' + st[1] + '">' + st[0] + '</span></header>' +
      (live && days >= 0 ? '<div class="countdown"><div><p class="kicker" style="color:var(--lamp)">Until you arrive</p><p class="small" style="margin:6px 0 0;color:var(--on-night-2)">Check-in from 2 pm · ' + D.long(b.checkin) + '</p></div><b>' + (days === 0 ? 'Today' : days + (days === 1 ? ' day' : ' days')) + '</b></div>' : '') +
      '<div class="mb-sec"><h3>Your stay</h3><div class="kv"><div><span>Arrive</span><b>' + D.fmt(b.checkin, { weekday: 'short' }) + '</b></div><div><span>Leave</span><b>' + D.fmt(b.checkout, { weekday: 'short' }) + '</b></div><div><span>Nights</span><b>' + n + '</b></div><div><span>Guests</span><b>' + b.adults + ' adult' + (b.adults > 1 ? 's' : '') + (b.kids && b.kids.length ? ', ' + b.kids.length + ' child' : '') + '</b></div><div><span>Meals</span><b>' + esc(plan ? plan.name : '') + '</b></div><div><span>Check-out</span><b>' + (b.source.indexOf('Direct') === 0 ? '2 pm (direct)' : '11 am') + '</b></div></div></div>' +
      '<div class="mb-sec"><h3>Arrival' + (live ? '<button class="ul" type="button" id="edit-arr" style="color:var(--ember);letter-spacing:0;text-transform:none;font-size:13px">Edit</button>' : '') + '</h3><div class="kv"><div><span>Arriving around</span><b id="arr-v">' + esc(b.guest.arrival || 'Not shared yet') + '</b></div><div><span>Transfer</span><b>' + (b.addons && (b.addons.kgm || b.addons['kgm-suv'] || b.addons.pgh) ? 'Booked' : 'Not booked') + '</b></div><div><span>Requests</span><b style="font-weight:400;font-size:14px">' + esc(b.guest.requests || '—') + '</b></div></div></div>' +
      '<div class="mb-sec"><h3>Add-ons' + (live ? '<button class="ul" type="button" id="add-more" style="color:var(--ember);letter-spacing:0;text-transform:none;font-size:13px">+ Add</button>' : '') + '</h3>' +
      (adds.length ? adds.map(function (k) { var a = TD.addon(k); if (!a) return ''; return '<div class="sum-row"><span>' + esc(a.name) + (b.addons[k] > 1 ? ' × ' + b.addons[k] : '') + '</span><span>' + (a.price ? TD.inr(a.price * b.addons[k] * (a.perNight ? n : 1)) : 'Free') + (live ? ' <button type="button" class="x" data-rm="' + k + '" aria-label="Remove ' + esc(a.name) + '" style="min-width:32px;min-height:32px;display:inline-grid;font-size:16px;vertical-align:middle">×</button>' : '') + '</span></div>'; }).join('') : '<p class="muted small" style="margin:0">Nothing added yet. Transfers, the dawn birding walk and a private dinner on the deck are the favourites.</p>') + '</div>' +
      '<div class="mb-sec"><h3>Payment</h3><div class="sum-row"><span>Total incl. GST</span><span>' + TD.inr(total) + '</span></div><div class="sum-row"><span>Paid · ' + esc((b.pay && b.pay.method) || '') + '</span><span>' + TD.inr(paid) + '</span></div><div class="sum-row" style="font-weight:600"><span>' + (b.status === 'cancelled' ? 'Refund' : 'Balance') + '</span><span>' + TD.inr(b.status === 'cancelled' ? (b.refund || 0) : bal) + '</span></div>' +
      (live && bal > 0 && b.pay.mode !== 'ota' ? '<button class="btn sm" type="button" id="pay-bal" style="margin-top:14px"><span class="lbl">Pay ' + TD.inr(bal) + ' now</span></button>' : '') + '</div>' +
      '<div class="mb-sec no-print" style="display:flex;gap:12px;flex-wrap:wrap"><button class="btn line sm" type="button" id="print"><span class="lbl">Print voucher</span></button>' + (live ? '<button class="btn line sm" type="button" id="chg"><span class="lbl">Change dates</span></button><button class="btn line sm" type="button" id="cancel" style="color:var(--bad)"><span class="lbl">Cancel booking</span></button>' : '') + '</div>' +
      '</div>' +
      '<div><div class="mb-card" id="write"><header style="grid-template-columns:1fr"><div><p class="kicker">Front desk · 7 am – 11 pm</p><h2 style="margin-top:10px;font-size:32px">Messages</h2></div></header><div class="mb-sec"><div class="thread" id="thread" data-lenis-prevent>' + thread.map(bubble).join('') + (thread.length ? '' : '<p class="muted small">No messages yet. Ask us anything: trains, diets, the road, a surprise.</p>') + '</div>' +
      '<form class="compose" id="compose"><label class="sr" for="msg-t">Message the front desk</label><textarea id="msg-t" rows="2" placeholder="Write to the front desk…"></textarea><button class="btn sm" type="submit"><span class="lbl">Send</span></button></form></div></div>' +
      '<div class="mb-sec" style="padding:24px 0"><h3 class="lab" style="margin-bottom:14px">Before you come</h3><ul class="feat" style="list-style:none;padding:0;margin:0;border-top:1px solid var(--line)">' +
      ['Government photo ID for every adult (passport for foreign nationals)', 'Nights in ' + D.parse(b.checkin).toLocaleDateString('en-IN', { month: 'long', timeZone: 'UTC' }) + ' are around ' + [null, -2, 0, 3, 7, 11, 14, 15, 15, 12, 8, 3, 0][+b.checkin.slice(5, 7)] + '°C: a warm layer and shoes with grip', 'Phone signal drops for 4 km after the Dhura temple; download your map', 'The last 9 km after Mukteshwar take about 25 minutes'].map(function (x) { return '<li style="padding:12px 0;border-bottom:1px solid var(--line);font-size:15px">' + esc(x) + '</li>'; }).join('') +
      '</ul><a class="lnk" href="getting-there.html" style="margin-top:12px"><span>Routes and transfers</span><span class="ar" aria-hidden="true">→</span></a></div></div></div>';
    $('#res').innerHTML = html;
    var th = $('#thread'); th.scrollTop = th.scrollHeight;
    wire(b, q, bal);
  }
  function bubble(m) { var d = new Date(m.at); return '<div class="bub ' + m.from + '">' + esc(m.text) + '<small>' + (m.from === 'desk' ? 'Front desk' : 'You') + ' · ' + d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + '</small></div>'; }

  function wire(b, q, bal) {
    $('#print').onclick = function () { print(); };
    $$('[data-rm]').forEach(function (x) { x.onclick = function () { var k = x.dataset.rm, a = TD.addon(k), before = JSON.stringify(b.addons); TD.updateBooking(b.ref, function (bb) { delete bb.addons[k]; retotal(bb); }, 'Guest removed ' + a.name + ' online'); render(); ui.toast(a.name + ' removed', 'Undo', function () { TD.updateBooking(b.ref, function (bb) { bb.addons = JSON.parse(before); retotal(bb); }, 'Undo: ' + a.name + ' restored'); render(); }); }; });
    var compose = $('#compose');
    compose.addEventListener('submit', function (e) {
      e.preventDefault(); var v = $('#msg-t').value.trim(); if (!v) { $('#msg-t').focus(); return; }
      TD.addMessage(b.ref, 'guest', v); $('#msg-t').value = ''; var th = $('#thread'); th.innerHTML = (TD.messages()[b.ref] || []).map(bubble).join(''); th.scrollTop = th.scrollHeight;
      setTimeout(function () { TD.addMessage(b.ref, 'desk', 'Thank you, ' + b.guest.first + '. Your message is with the front desk; someone will reply within the hour (7 am – 11 pm).'); th.innerHTML = (TD.messages()[b.ref] || []).map(bubble).join(''); th.scrollTop = th.scrollHeight; }, 1400);
    });
    $('#msg-t').addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) compose.requestSubmit(); });
    var ea = $('#edit-arr'); if (ea) ea.onclick = function () {
      ui.sheet('Arrival details', '<div class="form-grid" style="grid-template-columns:1fr"><label class="field"><span>Arriving around</span><select id="s-arr">' + ['', '11:00', '12:30', '14:00', '15:30', '17:00', 'After 18:00'].map(function (o) { return '<option' + (o === b.guest.arrival ? ' selected' : '') + ' value="' + o + '">' + (o || 'Not sure yet') + '</option>'; }).join('') + '</select></label><label class="field"><span>Requests</span><textarea id="s-req">' + esc(b.guest.requests || '') + '</textarea></label></div>', '<span class="small muted">The front desk sees this immediately.</span><button class="btn sm" type="button" id="s-save"><span class="lbl">Save</span></button>', function (sh) {
        $('#s-save', sh).onclick = function () { var arr = $('#s-arr', sh).value, req = $('#s-req', sh).value.trim(); TD.updateBooking(b.ref, function (bb) { bb.guest.arrival = arr; bb.guest.requests = req; }, 'Guest updated arrival details'); TD.addMessage(b.ref, 'guest', 'Arrival update: around ' + (arr || 'not sure yet') + (req ? '. ' + req : '')); ui.closeSheet(); render(); ui.toast('Saved. The front desk has your arrival time.'); };
      });
    };
    var am = $('#add-more'); if (am) am.onclick = function () {
      var list = TD.addons.filter(function (a) { return !(a.only && a.only.indexOf(b.type) < 0) && !b.addons[a.id] && a.price; });
      ui.sheet('Add to your stay', list.map(function (a) { return '<label class="add" style="cursor:pointer"><div><b>' + esc(a.name) + '</b><p>' + esc(a.note) + '</p></div><div class="amt">' + TD.inr(a.price) + '<small>' + a.unit + '</small></div><div class="ctl"><input type="checkbox" value="' + a.id + '" style="width:22px;height:22px;accent-color:var(--ink)" aria-label="Add ' + esc(a.name) + '"></div></label>'; }).join(''), '<span class="small muted" id="s-tot">Nothing selected</span><button class="btn sm" type="button" id="s-add"><span class="lbl">Add to booking</span></button>', function (sh) {
        var g = b.adults + (b.kids || []).length, n = D.diff(b.checkin, b.checkout);
        function pick() { return $$('input:checked', sh).map(function (i) { var a = TD.addon(i.value); return { a: a, qty: a.perGuest ? g : 1 }; }); }
        sh.addEventListener('change', function () { var p = pick(), s = p.reduce(function (x, y) { return x + y.a.price * y.qty * (y.a.perNight ? n : 1); }, 0); $('#s-tot', sh).textContent = p.length ? p.length + ' selected · ' + TD.inr(s * 1.18) + ' incl. GST' : 'Nothing selected'; });
        $('#s-add', sh).onclick = function () { var p = pick(); if (!p.length) { ui.toast('Tick something to add first.'); return; } TD.updateBooking(b.ref, function (bb) { p.forEach(function (x) { bb.addons[x.a.id] = x.qty; }); retotal(bb); }, 'Guest added ' + p.map(function (x) { return x.a.name; }).join(', ') + ' online'); ui.closeSheet(); render(); ui.toast('Added. Your balance is updated.'); };
      });
    };
    var pb = $('#pay-bal'); if (pb) pb.onclick = function () { pb.classList.add('busy'); setTimeout(function () { TD.updateBooking(b.ref, function (bb) { bb.pay.paid += bal; }, 'Balance paid online (UPI)'); render(); ui.toast('Balance paid. Nothing to settle at check-in.'); }, 1300); };
    var chg = $('#chg'); if (chg) chg.onclick = function () {
      ui.sheet('Change your dates', '<p class="muted">Date changes are free up to 7 days before arrival, subject to the new rate. Tell us what works and we will confirm within the hour.</p><div class="form-grid"><label class="field"><span>New arrival</span><input type="date" id="c-in" min="' + D.add(today, 1) + '" value="' + b.checkin + '"></label><label class="field"><span>New departure</span><input type="date" id="c-out" value="' + b.checkout + '"></label></div><p class="small" id="c-q" style="margin-top:16px" aria-live="polite"></p>', '<span></span><button class="btn sm" type="button" id="c-send"><span class="lbl">Send request</span></button>', function (sh) {
        function check() { var i = $('#c-in', sh).value, o = $('#c-out', sh).value, out = $('#c-q', sh); if (!i || !o || o <= i) { out.textContent = 'Pick a departure after the arrival.'; return null; } var free = TD.freeRooms(b.type, i, o, b.ref); if (!free.length) { out.innerHTML = '<span style="color:var(--bad)">' + esc(TD.type(b.type).plural) + ' are full for those dates. Try a day either side.</span>'; return null; } var nq = TD.quote({ type: b.type, checkin: i, checkout: o, rooms: 1, adults: b.adults, kids: b.kids, plan: b.plan, addons: b.addons, ignoreRef: b.ref }); out.innerHTML = 'Available. New total about <b>' + TD.inr(nq.total) + '</b> (' + (nq.total >= b.total ? '+' : '−') + TD.inr(Math.abs(nq.total - b.total)) + ').'; return { i: i, o: o }; }
        sh.addEventListener('change', check); check();
        $('#c-send', sh).onclick = function () { var r = check(); if (!r) return; TD.addMessage(b.ref, 'guest', 'Date change request: ' + D.fmt(r.i) + ' to ' + D.fmt(r.o) + '. Could you move us?'); ui.closeSheet(); render(); ui.toast('Request sent. The front desk will confirm here.'); };
      });
    };
    var cn = $('#cancel'); if (cn) cn.onclick = function () {
      var rf = TD.refundFor(b);
      ui.sheet('Cancel this booking?', '<p class="lede" style="margin-bottom:16px">You’d get back <b>' + TD.inr(rf.amount) + '</b> of the ' + TD.inr(b.pay.paid || 0) + ' paid.</p><p class="muted">' + esc(rf.rule) + '. You are ' + rf.days + ' days from arrival, so ' + Math.round(rf.pct * 100) + '% of what you paid is refundable, back to your ' + esc(b.pay.method || 'original payment') + ' in 5 to 7 working days.</p><p class="muted small">Would a date change work instead? It’s free up to 7 days before arrival.</p><label class="field" style="margin-top:20px"><span>Reason (optional)</span><select id="x-why"><option>Plans changed</option><option>Found somewhere else</option><option>Health</option><option>Weather or road worries</option><option>Other</option></select></label>', '<button class="btn line sm" type="button" id="x-keep"><span class="lbl">Keep my booking</span></button><button class="btn sm" type="button" id="x-go" style="--bg:var(--bad)"><span class="lbl">Cancel and refund ' + TD.inr(rf.amount) + '</span></button>', function (sh) {
        $('#x-keep', sh).onclick = function () { ui.closeSheet(); };
        $('#x-go', sh).onclick = function () { var why = $('#x-why', sh).value; TD.updateBooking(b.ref, function (bb) { bb.status = 'cancelled'; bb.refund = rf.amount; }, 'Cancelled online by guest (' + why + '); refund ' + TD.inr(rf.amount)); TD.addMessage(b.ref, 'desk', 'Your booking ' + b.ref + ' is cancelled. A refund of ' + TD.inr(rf.amount) + ' is on its way. We hope to see you on the ridge another time.'); ui.closeSheet(); render(); ui.toast('Booking cancelled. Refund ' + TD.inr(rf.amount) + ' is on its way.'); };
      });
    };
  }
  function retotal(bb) { var q = TD.requote(bb); bb.total = q.total; if (bb.pay) bb.pay.total = q.total; }

  if (qs.get('ref')) fill(qs.get('ref'), qs.get('email') || qs.get('who') || '');
})();
