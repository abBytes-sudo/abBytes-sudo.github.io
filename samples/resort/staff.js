/* Taradhura front desk: the software the desk runs on all day.
   Home = what needs me now (KPI filters with deltas and sparklines, an attention list, a now-and-next strip, activity).
   Work cards: the arrivals check-in flow (ID → settle → room and keys, Save & next) and the payments call queue (outcome grid).
   Records open in a slide-over (overview, timeline, notes, related). Tape chart (drag to move), bookings table (filters,
   saved views, column choice, bulk with preview), experiences roster, guest messages, the concierge Conversations inbox
   with its leads, the wedding and offsite pipeline, rates, ⌘K. Reads and writes the same store as the website. */
(function () {
  'use strict';
  var TD = window.TD, ui = TD.ui, $ = ui.$, $$ = ui.$$, esc = ui.esc, D = TD.date, today = D.today();
  var view = $('#view'), dayOff = 0, cur = null;
  var VIEWS = { home: 'Home', arrivals: 'Front desk', payments: 'Payments to chase', tape: 'Tape chart', bookings: 'Bookings', rates: 'Rates', inbox: 'Conversations', messages: 'Guest messages', roster: 'Experiences', enquiries: 'Weddings & offsites' };
  var SRC = { 'Direct · website': 'var(--src-direct)', 'OTA': 'var(--src-ota)', 'Phone / WhatsApp': 'var(--src-phone)', 'Travel agent': 'var(--src-agent)', 'Corporate': 'var(--src-corp)', 'Walk-in': 'var(--src-phone)', 'Concierge chat': 'var(--src-direct)' };
  var STAT = { confirmed: ['Confirmed', 'ok'], tentative: ['On hold', 'warn'], 'in-house': ['In house', 'lamp'], 'checked-out': ['Checked out', ''], cancelled: ['Cancelled', 'bad'] };
  var ME = 'Ritu';
  function bday() { return D.add(today, dayOff); }
  function src(b) { return SRC[b.source] || 'var(--src-corp)'; }
  function pill(b) { var s = STAT[b.status] || [b.status, '']; return '<span class="pill ' + s[1] + '">' + s[0] + '</span>'; }
  function name(b) { return b.guest.first + ' ' + b.guest.last; }
  function ini(n) { return String(n || '?').split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); }
  function bal(b) { if (!b.pay || b.pay.mode === 'ota' || b.pay.mode === 'invoice' || b.status === 'cancelled') return 0; var tot = b.pay.mode === 'full' ? Math.round((b.total || 0) * (1 - TD.pricing.prepaid)) : (b.total || 0); return Math.max(0, tot - (b.pay.paid || 0)); }
  function active() { return TD.bookings().filter(function (b) { return b.status !== 'cancelled'; }); }
  function hm(t) { var d = new Date(t); return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
  function ago(t) { var m = Math.max(1, Math.round((Date.now() - new Date(t)) / 6e4)); return m < 60 ? m + 'm' : m < 1440 ? Math.round(m / 60) + 'h' : Math.round(m / 1440) + 'd'; }
  function spark(arr) {
    var w = 120, h = 22, mx = Math.max.apply(null, arr.concat([1])), mn = Math.min.apply(null, arr.concat([0])), sx = w / (arr.length - 1 || 1);
    var pts = arr.map(function (v, i) { return [i * sx, h - 2 - (v - mn) / ((mx - mn) || 1) * (h - 4)]; });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="' + d + ' L' + w + ' ' + h + ' L0 ' + h + ' Z"/><path d="' + d + '"/></svg>';
  }
  function delta(a, b, unit) { if (b == null || a === b) return '<span>same as last week</span>'; var up = a > b; return '<span class="' + (up ? 'up' : 'down') + '">' + (up ? '↑ ' : '↓ ') + (unit === '%' ? Math.abs(a - b) + ' pts' : Math.abs(a - b)) + '</span><span>vs last week</span>'; }

  // ---------- the concierge store (Orbit); read raw for counts, load the engine for the inbox ----------
  function rawConvos() { try { return (JSON.parse(localStorage.getItem('orbit-convos') || '[]') || []).filter(function (c) { return c.agent === 'resort'; }); } catch (e) { return []; } }
  var orbitReady = !!(window.Orbit && Orbit.convos), orbitWait = [];
  function loadOrbit(cb) {
    if (orbitReady) { cb && cb(); return; } if (cb) orbitWait.push(cb); if (loadOrbit.busy) return; loadOrbit.busy = 1;
    var s = document.createElement('script'); s.src = '../assets/bots/engine.js?v=23'; s.onload = function () { orbitReady = !!window.Orbit; seedChats(); orbitWait.splice(0).forEach(function (f) { f(); }); }; document.head.appendChild(s);
  }
  function seedChats() {
    var O = window.Orbit; if (!O || !O.convos) return; if (O.convos.list().some(function (c) { return c.agent === 'resort'; })) return;
    var now = Date.now(), M = 6e4, b1 = TD.findBooking('TD-4M8PK');
    function m(from, text, dt, x) { var r = { id: 'tdm' + Math.random().toString(36).slice(2, 8), from: from, text: text, ts: now - dt * M }; if (x) for (var k in x) if (x[k] != null) r[k] = x[k]; return r; }
    var C = [
      { id: 'tdc-ishita', status: 'waiting', channel: 'web', source: 'Instagram', user: { name: 'Ishita Malhotra', email: 'ishita.m@example.com' }, context: { page: 'celebrations' }, handoverReason: 'Wedding enquiry for sales', handoverAt: now - 9 * M, msgs: [
        ['bot', 'Good evening. Planning something on the ridge? I can check dates for a wedding or an offsite and pass you to Ritu, who runs our events.', 22], ['user', 'wedding for about 60 people, end of March', 21], ['bot', 'Lovely: the buransh will be out. For 60 guests we would take the whole ridge for three nights, with the pheras on the Orchard Lawn at sunset.', 21, { cards: ['Full buyout · 3 nights · from ₹6.2 L a night'] }], ['user', 'can we do mehendi in the orchard? and is 25-40 L realistic', 12], ['bot', 'Yes to the orchard. ₹25–40 L is realistic for 60 with stay, food, décor and music. I’m passing you to Ritu now; she can see everything we talked about.', 10, { kind: 'system' }]] },
      { id: 'tdc-farhan', status: 'bot', channel: 'whatsapp', source: 'WhatsApp', user: { name: 'Farhan Shetty' }, context: { page: 'index' }, msgs: [
        ['user', 'dec 26 to 29, 2 adults, kitne ka hoga?', 64], ['bot', 'For **Sat, 26 Dec** to **Tue, 29 Dec** (3 nights, festive minimum met), two cottages are free:', 63, { cards: ['Deodar Room · ₹68,420 for 3 nights', 'Ridge Cottage · ₹97,210 for 3 nights'] }], ['user', 'ridge one pls', 61], ['bot', 'Opening the booking page with your dates and the Ridge Cottage selected. Breakfast and a 2 pm check-out are included when you book direct.', 61]] },
      { id: 'tdc-meera', status: 'human', channel: 'web', source: 'Website chat', user: { name: 'Meera Bisht', email: 'meera.bisht@example.com' }, context: { page: 'my-booking' }, handoverReason: 'Asked for a person', handoverAt: now - 140 * M, msgs: [
        ['user', 'TD-4M8PK, can we have the star deck dinner on our 2nd night?', 150], ['bot', 'Found **TD-4M8PK**: Ridge Cottage R2, ' + (b1 ? D.fmt(b1.checkin) : 'next month') + ', 3 nights. The deck dinner is ₹6,500 for two; I’ll ask the desk to hold the Star deck.', 149], ['agent', 'Hi Meera, Ritu here. The Star deck is yours on your second night at 7:30. Shall I add the cake as well?', 120, { name: 'Ritu' }], ['user', 'yes please!! 10th anniversary', 118]] },
      { id: 'tdc-aarav', status: 'resolved', channel: 'web', source: 'Google search', user: { name: 'Aarav Mehta' }, context: { page: 'experiences' }, msgs: [
        ['user', 'birding tomorrow morning for 2', 300], ['bot', 'Tomorrow’s **dawn birding walk** leaves the Long Room porch at **6:15**; 3 places left. Booked 2 for you with Naveen.', 299, { cards: ['Dawn birding walk · tomorrow 06:15 · 2 guests'] }], ['user', 'thanks', 298]] }
    ];
    C.forEach(function (c) {
      var msgs = c.msgs.map(function (x) { var o = x[3] || {}; return m(x[0], x[1], x[2], { kind: o.kind, name: o.name, cards: o.cards ? o.cards.map(function (t) { return { title: t }; }) : null }); });
      O.convos.put({ id: c.id, seed: true, agent: 'resort', agentName: 'Taradhura', channel: c.channel, source: c.source, status: c.status, startedAt: msgs[0].ts, engaged: true, user: c.user, mem: {}, context: c.context, handoverReason: c.handoverReason, handoverAt: c.handoverAt, messages: msgs });
    });
    if (!O.leads.list({ agent: 'resort' }).length) {
      O.leads.add({ name: 'Ishita Malhotra', email: 'ishita.m@example.com', source: 'Instagram', channel: 'web', agent: 'resort', intent: 'event_enquiry', payload: { convo: 'tdc-ishita', kind: 'Wedding', guests: 60, dates: 'Late March 2027', budget: '₹25–40 L' }, timestamp: new Date(now - 10 * 6e4).toISOString() });
      O.leads.add({ name: 'Farhan Shetty', source: 'WhatsApp', channel: 'whatsapp', agent: 'resort', intent: 'availability', payload: { convo: 'tdc-farhan', type: 'Ridge Cottage', checkin: D.fmt(D.add(today, 32)), nights: 3, quote: '₹97,210' }, timestamp: new Date(now - 61 * 6e4).toISOString() });
      O.leads.add({ name: 'Aarav Mehta', source: 'Google search', channel: 'web', agent: 'resort', intent: 'experience', payload: { convo: 'tdc-aarav', experience: 'Dawn birding walk', when: 'tomorrow 06:15', guests: 2 }, timestamp: new Date(now - 299 * 6e4).toISOString() });
    }
  }

  // ---------- queues ----------
  function arrivals() { var d = bday(); return active().filter(function (b) { return b.checkin === d && (b.status === 'confirmed' || b.status === 'tentative' || b.status === 'in-house'); }).sort(function (a, b) { return (a.guest.arrival || '99') < (b.guest.arrival || '99') ? -1 : 1; }); }
  function departures() { var d = bday(); return active().filter(function (b) { return b.checkout === d && (b.status === 'in-house' || b.status === 'checked-out'); }); }
  function calledToday(b) { var c = b.calls || []; return c.length && c[c.length - 1].at.slice(0, 10) === today && ['paid', 'promised', 'wrong'].indexOf(c[c.length - 1].outcome) >= 0; }
  function dueList() { return active().filter(function (b) { var dd = D.diff(today, b.checkin); return (b.status === 'confirmed' || b.status === 'tentative') && bal(b) > 0 && dd >= 0 && dd <= 21; }).sort(function (a, b) { return a.checkin < b.checkin ? -1 : 1; }); }
  function unreadMsgs() { var m = TD.messages(); return Object.keys(m).filter(function (r) { var t = m[r]; return t.length && t[t.length - 1].from === 'guest' && !t[t.length - 1].read; }); }
  function chatsWaiting() { return (orbitReady ? Orbit.convos.list().filter(function (c) { return c.agent === 'resort'; }) : rawConvos()).filter(function (c) { return c.status === 'waiting'; }); }
  function counts() {
    var arr = arrivals().filter(function (b) { return b.status !== 'in-house'; }).length, pay = dueList().filter(function (b) { return !calledToday(b); }).length;
    var set = function (k, v) { $$('[data-count="' + k + '"]').forEach(function (e) { e.textContent = v || ''; }); };
    set('arrivals', arr); set('payments', pay); set('holds', TD.bookings().filter(function (b) { return b.status === 'tentative'; }).length); set('chats', chatsWaiting().length); set('msgs', unreadMsgs().length);
    set('slots', TD.slots().filter(function (s) { return s.date === today && s.status !== 'cancelled'; }).length); set('enq', TD.enquiries().filter(function (e) { return e.stage === 'New'; }).length);
  }

  // ---------- router ----------
  function route() {
    var h = (location.hash || '#home').slice(1), v = h.split('?')[0]; if (!VIEWS[v]) v = 'home';
    var q = new URLSearchParams(h.split('?')[1] || ''); if (q.get('f')) bkFilter = q.get('f');
    cur = v; $('#view-h').textContent = VIEWS[v]; document.title = VIEWS[v] + ' · Taradhura front desk';
    $$('.bo-nav a, .bo-tabs a').forEach(function (a) { if (a.dataset.v === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $('.bo-day').hidden = !(v === 'home' || v === 'arrivals');
    R[v](); counts(); $('#side').classList.remove('open'); $('#bo-mnav').setAttribute('aria-expanded', 'false');
  }
  addEventListener('hashchange', function () { route(); view.focus({ preventScroll: true }); scrollTo(0, 0); });
  $('#bo-mnav').onclick = function (e) { e.stopPropagation(); var o = $('#side').classList.toggle('open'); this.setAttribute('aria-expanded', o); };
  $('#tab-more').onclick = function (e) { e.stopPropagation(); $('#side').classList.add('open'); $('#bo-mnav').setAttribute('aria-expanded', 'true'); };
  document.addEventListener('click', function (e) { if ($('#side').classList.contains('open') && !e.target.closest('#side')) $('#side').classList.remove('open'); });
  $$('.bo-day button').forEach(function (b) { b.onclick = function () { dayOff = +b.dataset.day; $$('.bo-day button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); queueIx = 0; route(); }; });
  $('#reset').onclick = function () { if (!confirm('Start fresh? Bookings, messages and enquiries go back to this morning’s list.')) return; TD.reset(); ui.toast('Started fresh'); route(); };
  var nm = $('#new-menu'), nl = $('#new-list');
  nm.onclick = function (e) { e.stopPropagation(); var o = nl.hidden; nl.hidden = !o; nm.setAttribute('aria-expanded', o); if (o) nl.querySelector('button').focus(); };
  document.addEventListener('click', function (e) { if (!nl.hidden && !e.target.closest('.bo-new')) { nl.hidden = true; nm.setAttribute('aria-expanded', 'false'); } });
  nl.addEventListener('keydown', function (e) { if (e.key === 'Escape') { nl.hidden = true; nm.focus(); } });
  $$('[data-new]', nl).forEach(function (b) { b.onclick = function () { nl.hidden = true; nm.setAttribute('aria-expanded', 'false'); ({ booking: newBooking, slot: newSlot, enquiry: newEnquiry })[b.dataset.new](); }; });

  // ---------- ⋯ menus ----------
  function popMenu(btn, items) {
    closePop(); var r = btn.getBoundingClientRect(), p = document.createElement('div'); p.className = 'pop'; p.setAttribute('role', 'menu');
    p.innerHTML = items.map(function (it, i) { return '<button type="button" role="menuitem" data-i="' + i + '"' + (it.danger ? ' class="danger"' : '') + '>' + esc(it.t) + '</button>'; }).join('');
    document.body.appendChild(p); var w = p.offsetWidth; p.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w)) + 'px'; p.style.top = Math.max(8, Math.min(innerHeight - p.offsetHeight - 8, r.bottom + 4)) + 'px';
    $$('button', p).forEach(function (b) { b.onclick = function () { closePop(); items[+b.dataset.i].fn(); }; }); p.querySelector('button').focus();
    p.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closePop(); btn.focus(); } if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var bs = $$('button', p), i = bs.indexOf(document.activeElement); bs[(i + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length].focus(); } });
  }
  function closePop() { var p = $('.pop'); if (p) p.parentNode.removeChild(p); }
  document.addEventListener('click', function (e) { if (!e.target.closest('.pop') && !e.target.closest('.more')) closePop(); });

  var R = {};
  // =====================================================================================
  // HOME: what needs me now
  // =====================================================================================
  R.home = function () {
    var d = bday(), all = active(), arr = arrivals(), dep = departures(), wait = chatsWaiting(), unread = unreadMsgs(), due = dueList(), dueNow = due.filter(function (b) { return D.diff(today, b.checkin) <= 7 && !calledToday(b); });
    var last7 = D.add(d, -7), occ = TD.occupancy(d), occW = TD.occupancy(last7);
    var series = function (fn) { return Array.from({ length: 14 }, function (_, i) { return fn(D.add(d, i - 13)); }); };
    var arrOn = function (x) { return all.filter(function (b) { return b.checkin === x; }).length; };
    var revOn = function (x) { return all.filter(function (b) { return b.checkin <= x && b.checkout > x; }).reduce(function (a, b) { return a + TD.nightly(b.type, x, 0); }, 0); };
    var d30 = all.filter(function (b) { return b.created && b.created.slice(0, 10) >= D.add(today, -30); }), dP = all.filter(function (b) { return b.created && b.created.slice(0, 10) >= D.add(today, -60) && b.created.slice(0, 10) < D.add(today, -30); });
    var share = function (l) { return Math.round(l.filter(function (b) { return b.source.indexOf('Direct') === 0; }).length / Math.max(1, l.length) * 100); };
    var att = [], todoArr = arr.filter(function (b) { return b.status !== 'in-house'; }), noEta = todoArr.filter(function (b) { return !b.guest.arrival; });
    if (todoArr.length) att.push(['↘', todoArr.length + ' arriving ' + (dayOff ? 'tomorrow' : 'today') + ' to check in', noEta.length ? noEta.length + ' without an ETA: ' + noEta.map(function (b) { return b.guest.first; }).join(', ') : 'First due ' + (todoArr[0].guest.arrival || 'after 2 pm'), '#arrivals', true]);
    if (wait.length) att.push(['◌', wait.length + ' chat' + (wait.length > 1 ? 's' : '') + ' waiting for a person', (wait[0].user && wait[0].user.name || 'A visitor') + ': ' + (wait[0].handoverReason || 'asked for a person') + ' · ' + ago(wait[0].handoverAt || wait[0].updatedAt), '#inbox', true]);
    if (unread.length) { var mm = TD.messages()[unread[0]], ub = TD.findBooking(unread[0]); att.push(['✉', unread.length + ' guest message' + (unread.length > 1 ? 's' : '') + ' to answer', (ub ? ub.guest.first + ': ' : '') + '“' + mm[mm.length - 1].text.slice(0, 70) + '”', '#messages', true]); }
    if (dueNow.length) att.push(['₹', dueNow.length + ' balance' + (dueNow.length > 1 ? 's' : '') + ' due before arrival', TD.inr(dueNow.reduce(function (a, b) { return a + bal(b); }, 0)) + ' across guests arriving within 7 days', '#payments', true]);
    var holds = all.filter(function (b) { return b.status === 'tentative' && D.diff(today, b.checkin) <= 14 && D.diff(today, b.checkin) >= 0; });
    if (holds.length) att.push(['◷', holds.length + ' hold' + (holds.length > 1 ? 's' : '') + ' arrive within 14 days', 'Confirm or release so the rooms can sell', '#bookings?f=tentative']);
    var enqN = TD.enquiries().filter(function (e) { return e.stage === 'New'; });
    if (enqN.length) att.push(['◇', enqN.length + ' new wedding or offsite enquir' + (enqN.length > 1 ? 'ies' : 'y'), enqN.map(function (e) { return e.name + ' (' + e.guests + ')'; }).join(', '), '#enquiries']);
    var fullT = TD.experiences.filter(function (e) { return e.slots.some(function (t) { return TD.slotTaken(e.id, D.add(today, 1), t) >= e.cap; }); });
    if (fullT.length) att.push(['◎', fullT.map(function (e) { return e.name; }).join(', ') + ' full tomorrow', 'Offer the next morning to anyone who asks', '#roster']);
    var ev = [], seen = {};
    arr.forEach(function (b) { ev.push([b.guest.arrival || '14:00', 'Arrival', b.guest.first + ' ' + b.guest.last.slice(0, 1) + '. · ' + b.room, b.status === 'in-house']); });
    dep.forEach(function (b) { ev.push([b.source.indexOf('Direct') === 0 ? '14:00' : '11:00', 'Check-out', b.guest.first + ' · ' + b.room, b.status === 'checked-out']); });
    TD.slots().filter(function (s) { return s.date === d && s.status !== 'cancelled'; }).forEach(function (s) { var k = s.exp + s.time; if (seen[k]) return; seen[k] = 1; var e = TD.exp(s.exp), g = TD.slots().filter(function (x) { return x.date === d && x.exp === s.exp && x.time === s.time && x.status !== 'cancelled'; }).reduce(function (a, x) { return a + x.guests; }, 0); ev.push([s.time, e.name, g + ' guests · ' + e.guide.split(' ')[0], false]); });
    ev.push(['19:30', 'Dinner service', 'Long Room · about ' + Math.round(occ * 13 * 1.8) + ' covers', false]);
    ev.sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
    var nowT = new Date().toTimeString().slice(0, 5), nowIx = dayOff ? -1 : ev.findIndex(function (x) { return x[0] >= nowT && !x[3]; });
    var act = [];
    TD.bookings().forEach(function (b) { (b.log || []).forEach(function (l) { if (l.at && l.at.slice(0, 10) >= D.add(today, -3)) act.push([l.at, b, l.what]); }); });
    act.sort(function (a, b) { return a[0] < b[0] ? 1 : -1; }); act = act.slice(0, 9);
    var kp = [
      ['Arrivals', arr.length, delta(arr.length, arrOn(last7)), spark(series(arrOn)), 'arrivals'],
      ['Occupancy', Math.round(occ * 100) + '%', delta(Math.round(occ * 100), Math.round(occW * 100), '%'), spark(series(function (x) { return Math.round(TD.occupancy(x) * 13); })), 'tape'],
      ['Departures', dep.length, '<span>' + dep.filter(function (b) { return b.status === 'in-house'; }).length + ' still to settle</span>', spark(series(function (x) { return all.filter(function (b) { return b.checkout === x; }).length; })), 'bookings?f=departing'],
      ['Room revenue', TD.inr(revOn(d)), delta(Math.round(revOn(d) / 1000), Math.round(revOn(last7) / 1000)), spark(series(revOn)), 'rates'],
      ['Direct share', share(d30) + '%', delta(share(d30), share(dP), '%').replace('vs last week', 'vs prior 30 days'), spark(series(function (x) { return all.filter(function (b) { return b.created && b.created.slice(0, 10) === x && b.source.indexOf('Direct') === 0; }).length; })), 'bookings?f=direct'],
      ['To chase', TD.inr(dueNow.reduce(function (a, b) { return a + bal(b); }, 0)), '<span>' + dueNow.length + ' guests within 7 days</span>', spark(series(function (x) { return due.filter(function (b) { return b.checkin <= D.add(x, 7); }).length; })), 'payments']
    ];
    // the day's headline in the front desk's words, then tonight's thirteen windows: the one thing only this business has
    var firstEta = todoArr.map(function (b) { return b.guest.arrival; }).filter(Boolean).sort()[0];
    var lit = TD.allRooms.filter(function (rm) { return TD.roomTaken(rm.id, d); }).length;
    var head = [D.fmt(d, { weekday: 'long', day: undefined, month: undefined }),
      todoArr.length ? todoArr.length + ' arriving' + (firstEta ? ', first at ' + firstEta : '') : 'no arrivals left',
      dueNow.length ? dueNow.length + ' balance' + (dueNow.length > 1 ? 's' : '') + ' to collect' : null,
      wait.length ? wait.length + ' chat' + (wait.length > 1 ? 's' : '') + ' waiting' : null,
      lit + ' of 13 rooms lit tonight'].filter(Boolean).join(' · ');
    var html = '<div class="greet"><h2>' + esc(head) + '</h2><p>' + D.long(d) + ' · sunset ' + TD.sky.hm(TD.sky.sun(d).set) + ' · ' + att.length + ' thing' + (att.length === 1 ? '' : 's') + ' on the list below</p></div>';
    html += '<div class="tonight" role="group" aria-label="' + (dayOff ? 'Tomorrow night' : 'Tonight') + ' on the ridge, room by room">' + TD.allRooms.map(function (rm) {
      var ref = TD.roomTaken(rm.id, d), b = ref ? TD.findBooking(ref) : null, arrive = b && b.checkin === d && b.status !== 'in-house', left = b ? D.diff(d, b.checkout) : 0;
      return b ? '<button type="button" class="tn-w lit' + (arrive ? ' arr' : '') + '" data-open="' + b.ref + '"><i aria-hidden="true"></i><b>' + rm.id + '</b><small>' + esc(b.guest.last) + ' · ' + (arrive ? (b.guest.arrival ? 'due ' + b.guest.arrival : 'arriving') : TD.nights(left) + ' left') + '</small></button>'
        : '<a class="tn-w free" href="#tape"><i aria-hidden="true"></i><b>' + rm.id + '</b><small>Free</small></a>';
    }).join('') + '</div>';
    html += '<div class="kpis">' + kp.map(function (k) { return '<button type="button" class="kpi" data-go="' + k[4] + '"><span>' + k[0] + '</span><b>' + k[1] + '</b><small>' + k[2] + '</small>' + k[3] + '</button>'; }).join('') + '</div>';
    html += '<div class="home"><div><div class="sect" style="margin-top:0"><div class="sect-h"><h3>Needs your attention</h3><span class="small muted">' + att.length + '</span></div><div class="list">' +
      (att.length ? att.map(function (a) { return '<a class="li" href="' + a[3] + '"><span class="ic' + (a[4] ? ' hot' : '') + '" aria-hidden="true">' + a[0] + '</span><span><b>' + esc(a[1]) + '</b><small>' + esc(a[2]) + '</small></span><span class="go" aria-hidden="true">›</span></a>'; }).join('') : '<div class="empty"><b>All clear.</b>Nothing is waiting on the desk. A good moment for tomorrow’s pre-arrival notes.</div>') + '</div></div>';
    html += '<div class="sect"><div class="sect-h"><h3>Now and next</h3><span class="small muted">' + (dayOff ? 'Tomorrow' : 'Today') + '</span></div><div class="nn" tabindex="0" role="region" aria-label="Now and next, scrolls sideways">' + ev.map(function (x, i) { return '<div class="' + (i === nowIx ? 'now' : x[3] || (!dayOff && x[0] < nowT) ? 'past' : '') + '"><span class="t">' + (i === nowIx ? '● Next · ' : '') + x[0] + '</span><b>' + esc(x[1]) + '</b><small>' + esc(x[2]) + '</small></div>'; }).join('') + '</div></div></div>';
    html += '<div><div class="sect" style="margin-top:0"><div class="sect-h"><h3>Activity</h3><a href="#bookings">All bookings</a></div><div class="feed">' + (act.length ? act.map(function (a) { var who = /Ritu|at the desk/.test(a[2]) ? 'RP' : /website|online|chat/i.test(a[2]) ? 'W' : 'TD'; return '<div><span class="av sm' + (who === 'RP' ? '' : ' g') + '" aria-hidden="true">' + who + '</span><span>' + esc(a[2]) + ' · <button type="button" data-open="' + a[1].ref + '">' + esc(name(a[1])) + '</button></span><small>' + ago(a[0]) + '</small></div>'; }).join('') : '<div class="empty">No activity yet today.</div>') + '</div></div></div></div>';
    view.innerHTML = html;
    $$('[data-go]', view).forEach(function (b) { b.onclick = function () { location.hash = b.dataset.go; }; });
    wireOpen(view);
  };

  // =====================================================================================
  // FRONT DESK: arrivals, one guest at a time
  // =====================================================================================
  var queueIx = 0, showList = false;
  var IDS = ['Aadhaar', 'Passport', 'Driving licence', 'Voter ID'];
  R.arrivals = function () {
    var arr = arrivals(), todo = arr.filter(function (b) { return b.status !== 'in-house'; }), dep = departures();
    if (queueIx >= todo.length) queueIx = 0;
    var html = '<div class="vh"><div><h2>' + (dayOff ? 'Tomorrow’s' : 'Today’s') + ' arrivals</h2><p>' + todo.length + ' to check in · ' + (arr.length - todo.length) + ' in · ' + dep.filter(function (b) { return b.status === 'in-house'; }).length + ' check-outs to settle</p></div><button class="bob ghost" type="button" id="tog-list" aria-pressed="' + showList + '">' + (showList ? 'Hide the list' : 'Show the list') + '</button></div>';
    html += '<div class="desk' + (showList ? ' list' : '') + '"><aside class="queue" aria-label="Arrivals queue"><div class="queue-h"><b>Arrivals</b><span>' + (arr.length - todo.length) + ' of ' + arr.length + ' in</span></div><div style="padding:8px 12px 10px"><div class="meter"><i style="width:' + Math.round((arr.length - todo.length) / Math.max(1, arr.length) * 100) + '%"></i></div></div>' +
      arr.map(function (b) { var done = b.status === 'in-house', k = todo.indexOf(b); return '<button type="button" class="qi' + (done ? ' done' : '') + '" ' + (k === queueIx ? 'aria-current="true"' : '') + ' data-q="' + k + '" data-ref="' + b.ref + '"><b>' + esc(name(b)) + '</b><small>' + b.room + ' · ' + TD.nights(D.diff(b.checkin, b.checkout)) + (bal(b) ? ' · ' + TD.inr(bal(b)) + ' due' : '') + '</small><span class="r chipx">' + (b.guest.arrival || '—') + '</span></button>'; }).join('') +
      '<div class="queue-h" style="border-top:1px solid var(--line-2)"><b>Check-outs</b><span>' + dep.length + '</span></div>' + (dep.length ? dep.map(function (b) { return '<div class="qi' + (b.status === 'checked-out' ? ' done' : '') + '"><b>' + esc(name(b)) + '</b><small>' + b.room + (bal(b) ? ' · settle ' + TD.inr(bal(b)) : ' · settled') + '</small><span class="r">' + (b.status === 'in-house' ? '<button class="bob ghost" type="button" data-out="' + b.ref + '">Check out</button>' : '') + '</span></div>'; }).join('') : '<p class="empty">No check-outs.</p>') +
      '</aside><section id="focus" aria-live="polite"></section></div>';
    view.innerHTML = html;
    $('#tog-list').onclick = function () { showList = !showList; R.arrivals(); };
    $$('.qi[data-q]', view).forEach(function (q) { q.onclick = function () { var k = +q.dataset.q; if (k < 0) { openBooking(q.dataset.ref); return; } queueIx = k; showList = false; R.arrivals(); }; });
    wireOpen(view);
    focusArrival(todo);
  };
  function focusArrival(todo) {
    var box = $('#focus'); if (!box) return;
    if (!todo.length) { box.innerHTML = '<div class="focus"><div class="done-card"><b>Everyone is in.</b>No more arrivals ' + (dayOff ? 'tomorrow' : 'today') + '. Tomorrow’s pre-arrival notes are a filter away in Bookings.</div></div>'; return; }
    var b = TD.findBooking(todo[queueIx].ref), t = TD.type(b.type), ci = b.ci || {}, step = !ci.id ? 0 : !ci.settled ? 1 : 2, due = bal(b), n = D.diff(b.checkin, b.checkout);
    var eta = b.guest.arrival, mins = eta && !dayOff ? (function () { var p = eta.split(':'); return (+p[0] * 60 + +p[1]) - (new Date().getHours() * 60 + new Date().getMinutes()); })() : null;
    var adds = Object.keys(b.addons || {}).filter(function (k) { return b.addons[k] && TD.addon(k) && TD.addon(k).price; });
    var stepsHTML = '<div class="steps" role="tablist" aria-label="Check-in steps">' + [['Welcome', 'Photo ID for ' + b.adults], ['Settle', due ? TD.inr(due) + ' due' : 'Paid'], ['Room and keys', b.room + ' ready']].map(function (s, i) { return '<button type="button" role="tab" data-st="' + i + '"' + (i === step ? ' aria-current="step" aria-selected="true"' : ' aria-selected="false"') + ((i === 0 && ci.id) || (i === 1 && ci.settled) ? ' class="ok"' : '') + '><b>' + (i + 1) + ' · ' + s[0] + '</b><span>' + esc(s[1]) + '</span></button>'; }).join('') + '</div>';
    var body = '';
    if (step === 0) body = '<p class="small" style="margin:0;color:var(--on-night-2)">Which ID did they show?</p><div class="opts" role="group" aria-label="ID type">' + IDS.map(function (x) { return '<button type="button" class="opt2" data-id="' + x + '" aria-pressed="' + (ci.idType === x) + '">' + x + '</button>'; }).join('') + '</div><label class="chk"><input type="checkbox" id="ci-all"' + (ci.idAll ? ' checked' : '') + '> Seen for all ' + b.adults + ' adult' + (b.adults > 1 ? 's' : '') + '</label>';
    if (step === 1) body = due ? '<p style="margin:0;font-size:15px">Balance <b>' + TD.inr(due) + '</b> <span style="color:var(--on-night-2)">of ' + TD.inr(b.total) + ' · ' + TD.inr(b.pay.paid || 0) + ' paid by ' + esc(b.pay.method || '') + '</span></p><div class="opts" role="group" aria-label="How they settle">' + ['UPI', 'Card', 'Cash', 'At check-out'].map(function (x) { return '<button type="button" class="opt2" data-pay="' + x + '" aria-pressed="' + (ci.payMethod === x) + '">' + x + '</button>'; }).join('') + '</div>' : '<p style="margin:0">Nothing to settle: <b>' + TD.inr(b.pay.paid || 0) + '</b> paid' + (b.pay.mode === 'ota' ? ', collected by the travel portal' : ' by ' + esc(b.pay.method || 'UPI')) + '.</p>';
    if (step === 2) body = '<p style="margin:0">' + b.room + ' is ready · inspected ' + (11 + (b.room.charCodeAt(1) % 3)) + ':' + (b.room.charCodeAt(1) % 2 ? '40' : '15') + ' by Govind' + (t.id === 'deodar' ? ' · stove laid' : t.id === 'ridge' ? ' · fire laid' : '') + '</p><label class="chk"><input type="checkbox" id="ci-keys"' + (ci.keys ? ' checked' : '') + '> Keys handed over and the welcome walk done</label><label class="sr" for="ci-note">Note for housekeeping or the kitchen</label><textarea id="ci-note" rows="2" placeholder="Note for housekeeping or the kitchen (optional)">' + esc(ci.note || '') + '</textarea>';
    var primary = step === 0 ? '<button class="bob lamp big" type="button" id="ci-next"' + (ci.idType && ci.idAll ? '' : ' disabled title="Choose the ID type and confirm it was seen"') + '>Next: settle</button>' : step === 1 ? '<button class="bob lamp big" type="button" id="ci-next"' + (!due || ci.payMethod ? '' : ' disabled title="Choose how they settle"') + '>' + (due && ci.payMethod && ci.payMethod !== 'At check-out' ? 'Record ' + TD.inr(due) + ' · next' : 'Next: room and keys') + '</button>' : '<button class="bob lamp big" type="button" id="ci-done"' + (ci.keys ? '' : ' disabled title="Confirm the keys and the welcome walk"') + '>Check in ' + esc(b.guest.first) + ' · Save & next</button>';
    box.innerHTML = '<div class="focus"><div class="top"><span>Arrival ' + (queueIx + 1) + ' of ' + todo.length + '</span><span style="display:flex;gap:6px;flex-wrap:wrap">' + (eta ? '<span class="tchip">ETA ' + esc(eta) + (mins != null ? (mins > 0 ? ' · in ' + (mins > 90 ? Math.round(mins / 60) + ' h' : mins + ' m') : ' · due now') : '') + '</span>' : '<button type="button" class="tchip" id="ci-eta">+ Add ETA</button>') + '<span class="tchip mute">aim ≈ 4 m</span></span></div><div class="meter"><i style="width:' + Math.round(step / 3 * 100) + '%"></i></div>' +
      (b.guest.requests ? '<div class="remark"><small>Last note from ' + esc(b.guest.first) + '</small>' + esc(b.guest.requests) + '</div>' : '') +
      '<div><h3>' + esc(name(b)) + '</h3><p class="sub">' + b.room + ' · ' + esc(t.name) + ' · ' + TD.nights(n) + ' · ' + b.adults + ' adult' + (b.adults > 1 ? 's' : '') + (b.kids && b.kids.length ? ' + ' + b.kids.length + ' child' : '') + ' · <span class="src" style="background:' + src(b) + '"></span>' + esc(b.source) + '</p></div>' +
      '<div class="props"><div><span>Meals</span>' + esc((TD.plans.filter(function (p) { return p.id === b.plan; })[0] || {}).name || '') + '</div><div><span>From</span>' + esc(b.guest.city || '—') + '</div><div><span>Add-ons</span>' + (adds.length ? adds.map(function (k) { return esc(TD.addon(k).name.split(' ').slice(0, 2).join(' ')); }).join(', ') : '<button class="add-gap" type="button" id="ci-offer">+ Offer one</button>') + '</div><div><span>Mobile</span>' + esc(b.guest.phone || '—') + '</div></div>' +
      stepsHTML + '<div class="stepb">' + body + '</div><div class="acts">' + primary + '<button class="bob quiet" type="button" id="ci-skip">Skip for now</button><button class="more" type="button" id="ci-more" aria-label="More actions for ' + esc(name(b)) + '">⋯</button></div></div>';
    function save(patch, note) { TD.updateBooking(b.ref, function (x) { x.ci = Object.assign(x.ci || {}, patch); }, note); }
    function again() { focusArrival(arrivals().filter(function (x) { return x.status !== 'in-house'; })); }
    $$('[data-st]', box).forEach(function (s) { s.onclick = function () { var i = +s.dataset.st; if (i === 0) save({ id: false, settled: false }); if (i === 1 && ci.id) save({ settled: false }); again(); }; });
    $$('[data-id]', box).forEach(function (x) { x.onclick = function () { save({ idType: x.dataset.id }); again(); }; });
    var all = $('#ci-all', box); if (all) all.onchange = function () { save({ idAll: all.checked }); again(); };
    $$('[data-pay]', box).forEach(function (x) { x.onclick = function () { save({ payMethod: x.dataset.pay }); again(); }; });
    var k = $('#ci-keys', box); if (k) k.onchange = function () { save({ keys: k.checked, note: $('#ci-note', box).value }); again(); };
    var nx = $('#ci-next', box); if (nx) nx.onclick = function () {
      if (step === 0) save({ id: true }, 'ID seen at the desk (' + ci.idType + ')');
      else if (due && ci.payMethod && ci.payMethod !== 'At check-out') TD.updateBooking(b.ref, function (x) { x.pay.paid += due; x.ci = Object.assign(x.ci || {}, { settled: true }); }, 'Settled ' + TD.inr(due) + ' at the desk by ' + ci.payMethod);
      else save({ settled: true }, due ? 'Balance to settle at check-out' : null);
      again(); counts(); var nb = $('#focus .stepb .opt2, #focus #ci-keys'); nb && nb.focus();
    };
    var dn = $('#ci-done', box); if (dn) dn.onclick = function () {
      var note = $('#ci-note', box).value.trim(); TD.updateBooking(b.ref, function (x) { x.status = 'in-house'; x.ci = Object.assign(x.ci || {}, { keys: true, note: note }); }, 'Checked in by ' + ME + ' at ' + hm(Date.now()) + (note ? ' · note: ' + note : ''));
      ui.toast(b.guest.first + ' is in ' + b.room, 'Undo', function () { TD.updateBooking(b.ref, function (x) { x.status = 'confirmed'; }, 'Undo check-in'); route(); });
      queueIx = 0; R.arrivals(); counts();
    };
    $('#ci-skip', box).onclick = function () { queueIx = (queueIx + 1) % todo.length; R.arrivals(); };
    var et = $('#ci-eta', box); if (et) et.onclick = function () { var v = prompt('Arriving around (e.g. 15:30)?'); if (v && /^\d{1,2}[:.]\d{2}$/.test(v.trim())) { TD.updateBooking(b.ref, function (x) { x.guest.arrival = v.trim().replace('.', ':'); }, 'ETA added at the desk: ' + v); R.arrivals(); } else if (v) ui.toast('Use hours and minutes, like 15:30.'); };
    var of = $('#ci-offer', box); if (of) of.onclick = function () { openBooking(b.ref); };
    $('#ci-more', box).onclick = function () { popMenu(this, [{ t: 'Open the booking', fn: function () { openBooking(b.ref); } }, { t: 'Message ' + b.guest.first, fn: function () { msgRef = b.ref; location.hash = 'messages'; } }, { t: 'Move to another room', fn: function () { openBooking(b.ref); } }, { t: 'Mark no-show', danger: true, fn: function () { TD.updateBooking(b.ref, function (x) { x.status = 'cancelled'; x.refund = 0; }, 'Marked no-show by ' + ME); ui.toast(b.guest.first + ' marked no-show', 'Undo', function () { TD.updateBooking(b.ref, function (x) { x.status = 'confirmed'; }, 'Undo no-show'); route(); }); route(); } }]); };
  }
  function checkOut(ref) {
    var b = TD.findBooking(ref), due = bal(b);
    TD.updateBooking(ref, function (x) { x.status = 'checked-out'; if (due) x.pay.paid += due; }, 'Checked out by ' + ME + (due ? '; settled ' + TD.inr(due) + ' by UPI' : ''));
    TD.addMessage(ref, 'desk', TD.fill('checkout', b), 'checkout');
    ui.toast(b.guest.first + ' checked out' + (due ? ', ' + TD.inr(due) + ' settled' : ''), 'Undo', function () { TD.updateBooking(ref, function (x) { x.status = 'in-house'; if (due) x.pay.paid -= due; }, 'Undo check-out'); route(); });
    route();
  }
  function wireOpen(root) {
    $$('[data-open]', root).forEach(function (x) { x.onclick = function (e) { e.preventDefault(); e.stopPropagation(); openBooking(x.dataset.open); }; });
    $$('[data-out]', root).forEach(function (x) { x.onclick = function (e) { e.stopPropagation(); checkOut(x.dataset.out); }; });
  }

  // =====================================================================================
  // PAYMENTS: the call queue
  // =====================================================================================
  var payIx = 0;
  var OUT = [['paid', '✓', 'Paid by link', 'Records the balance'], ['promised', '◷', 'Promised to pay', 'By arrival; no more calls'], ['noanswer', '…', 'No answer', 'Back in the queue later'], ['busy', '◌', 'Busy', 'Back in the queue later'], ['wrong', '✕', 'Wrong number', 'Flag for email'], ['later', '↻', 'Call back later', 'They asked for a time']];
  function outLab(o) { return (OUT.filter(function (y) { return y[0] === o; })[0] || [0, 0, o])[2]; }
  R.payments = function () {
    var due = dueList(), todo = due.filter(function (b) { return !calledToday(b); }), done = due.length - todo.length;
    if (payIx >= todo.length) payIx = 0;
    var left = todo.reduce(function (a, b) { return a + bal(b); }, 0);
    var html = '<div class="vh"><div><h2>Balances to collect before arrival</h2><p>' + todo.length + ' to call · ' + TD.inr(left) + ' outstanding · guests arriving within 21 days (travel-portal and company bookings are excluded)</p></div></div>';
    html += '<div class="desk"><aside class="queue" aria-label="Call queue"><div class="queue-h"><b>Queue</b><span>' + done + ' of ' + due.length + ' done</span></div><div style="padding:8px 12px 10px"><div class="meter"><i style="width:' + Math.round(done / Math.max(1, due.length) * 100) + '%"></i></div></div>' +
      due.map(function (b) { var k = todo.indexOf(b), c = (b.calls || []).slice(-1)[0]; return '<button type="button" class="qi' + (k < 0 ? ' done' : '') + '" ' + (k === payIx ? 'aria-current="true"' : '') + ' data-q="' + k + '" data-ref="' + b.ref + '"><b>' + esc(name(b)) + '</b><small>' + D.fmt(b.checkin, { weekday: 'short' }) + ' · ' + b.room + (c ? ' · ' + outLab(c.outcome).toLowerCase() : '') + '</small><span class="r chipx">' + TD.inr(bal(b)) + '</span></button>'; }).join('') + '</aside><section id="pfocus" aria-live="polite"></section></div>';
    view.innerHTML = html;
    $$('.qi', view).forEach(function (q) { q.onclick = function () { var k = +q.dataset.q; if (k < 0) { openBooking(q.dataset.ref); return; } payIx = k; R.payments(); }; });
    var box = $('#pfocus');
    if (!todo.length) { box.innerHTML = '<div class="focus"><div class="done-card"><b>Queue clear.</b>Every balance due before arrival is paid, promised or flagged.</div></div>'; return; }
    var b = todo[payIx], t = TD.type(b.type), last = (b.calls || []).slice(-1)[0], dd = D.diff(today, b.checkin);
    var thread = TD.messages()[b.ref] || [], lastG = thread.filter(function (m) { return m.from === 'guest'; }).slice(-1)[0];
    box.innerHTML = '<div class="focus"><div class="top"><span>Ready to call · ' + (payIx + 1) + ' of ' + todo.length + '</span><span style="display:flex;gap:6px"><span class="tchip">≈ ' + Math.max(2, todo.length * 2) + ' m left</span><span class="tchip mute">aim ≈ 2 m</span></span></div><div class="meter"><i style="width:' + Math.round(payIx / todo.length * 100) + '%"></i></div>' +
      (last ? '<div class="remark"><small>Last call · ' + ago(last.at) + ' ago</small>' + esc(outLab(last.outcome)) + '</div>' : lastG ? '<div class="remark"><small>Last said by ' + esc(b.guest.first) + '</small>“' + esc(lastG.text) + '”</div>' : '') +
      '<div><h3>' + esc(name(b)) + '</h3><p class="sub">' + esc(b.guest.phone || 'No number on file') + ' · ' + b.room + ' ' + esc(t.name) + ' · arrives ' + D.fmt(b.checkin, { weekday: 'short' }) + ' (' + (dd === 0 ? 'today' : 'in ' + dd + ' day' + (dd > 1 ? 's' : '')) + ')</p></div>' +
      '<div class="props"><div><span>Due</span><b style="font-size:18px">' + TD.inr(bal(b)) + '</b></div><div><span>Paid</span>' + TD.inr(b.pay.paid || 0) + ' · ' + esc(b.pay.method || '') + '</div><div><span>Total</span>' + TD.inr(b.total) + '</div><div><span>Booked</span>' + esc(b.source) + '</div></div>' +
      '<p class="small" style="margin:0;color:var(--on-night-2)">How did it go?</p><div class="outcomes" role="group" aria-label="Call outcome">' + OUT.map(function (o) { return '<button type="button" data-o="' + o[0] + '"><i aria-hidden="true">' + o[1] + '</i><span>' + o[2] + '</span><small>' + o[3] + '</small></button>'; }).join('') + '</div><p class="small" style="margin:-4px 0 0;color:var(--on-night-2)">Pick one: it is saved to the booking and the next guest comes up.</p>' +
      '<div class="acts"><button class="bob lamp big" type="button" id="p-link">Send payment link</button><button class="bob quiet" type="button" id="p-skip">Skip</button><button class="more" type="button" id="p-more" aria-label="More actions">⋯</button></div></div>';
    $$('[data-o]', box).forEach(function (x) { x.onclick = function () {
      var o = x.dataset.o, lab = outLab(o), d2 = bal(b);
      TD.updateBooking(b.ref, function (y) { (y.calls = y.calls || []).push({ at: new Date().toISOString(), outcome: o }); if (o === 'paid') y.pay.paid += d2; }, 'Call by ' + ME + ': ' + lab + (o === 'paid' ? ' · ' + TD.inr(d2) + ' received' : ''));
      ui.toast(b.guest.first + ': ' + lab.toLowerCase(), 'Undo', function () { TD.updateBooking(b.ref, function (y) { y.calls.pop(); if (o === 'paid') y.pay.paid -= d2; }, 'Undo call outcome'); R.payments(); counts(); });
      if (!(o === 'paid' || o === 'promised' || o === 'wrong')) payIx++; R.payments(); counts();
    }; });
    $('#p-link').onclick = function () { TD.addMessage(b.ref, 'desk', 'Namaste ' + b.guest.first + ', a quick note from the front desk: the balance of ' + TD.inr(bal(b)) + ' for your stay from ' + D.fmt(b.checkin) + ' can be paid here: taradhura.in/pay/' + b.ref + '. Thank you!', 'paylink'); TD.updateBooking(b.ref, function () {}, 'Payment link sent by ' + ME); ui.toast('Payment link sent to ' + b.guest.first); };
    $('#p-skip').onclick = function () { payIx = (payIx + 1) % todo.length; R.payments(); };
    $('#p-more').onclick = function () { popMenu(this, [{ t: 'Open the booking', fn: function () { openBooking(b.ref); } }, { t: 'Message ' + b.guest.first, fn: function () { msgRef = b.ref; location.hash = 'messages'; } }]); };
  };

  // =====================================================================================
  // TAPE CHART
  // =====================================================================================
  var tapeStart = D.add(today, -2);
  R.tape = function () {
    var small = innerWidth < 700, N = small ? 8 : 21, col = small ? 46 : 54, row = 38, lw = small ? 64 : 118, hh = 44, th = 24;
    var days = Array.from({ length: N }, function (_, i) { return D.add(tapeStart, i); });
    var html = '<div class="tc-bar"><button class="bob ghost" type="button" id="tc-prev" aria-label="Earlier">←</button><button class="bob ghost" type="button" id="tc-today">Today</button><button class="bob ghost" type="button" id="tc-next" aria-label="Later">→</button><span class="small muted">' + D.fmt(days[0], { weekday: 'short' }) + ' – ' + D.fmt(days[N - 1], { weekday: 'short' }) + '</span>' +
      '<div class="tc-legend">' + [['Direct', 'var(--src-direct)'], ['OTA', 'var(--src-ota)'], ['Phone', 'var(--src-phone)'], ['Agent', 'var(--src-agent)'], ['Corporate', 'var(--src-corp)']].map(function (s) { return '<span><span class="src" style="background:' + s[1] + '"></span>' + s[0] + '</span>'; }).join('') + '<span>striped: on hold · ● in house · drag to move</span></div></div>';
    var g = '<div class="tc-grid" id="tcg" style="grid-template-columns:' + lw + 'px repeat(' + N + ', ' + col + 'px);--row:' + row + 'px">';
    g += '<div class="tc-corner" style="height:' + hh + 'px">Room</div>' + days.map(function (d) { return '<div class="tc-h' + (d === today ? ' today' : '') + '"><span>' + D.parse(d).toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' }) + '</span><b>' + D.parse(d).getUTCDate() + '</b></div>'; }).join('');
    var y = hh, rowY = {}, rowType = {};
    TD.types.forEach(function (t) {
      g += '<div class="tc-t">' + esc(t.plural) + '</div><div class="tc-t fill" style="grid-column:span ' + N + '"></div>'; y += th;
      t.rooms.forEach(function (r) { rowY[r] = y; rowType[r] = t.id; g += '<div class="tc-r tc-c">' + r + (small ? '' : ' <small>' + t.short + '</small>') + '</div>' + days.map(function (d) { return '<div class="tc-c cell' + (TD.isWeekend(d) ? ' we' : '') + (d === today ? ' today' : '') + '" data-room="' + r + '" data-d="' + d + '"></div>'; }).join(''); y += row; });
    });
    g += '<div class="tc-occ tc-occ-l">Sold</div>' + days.map(function (d) { var o = TD.occupancy(d); return '<div class="tc-occ' + (o >= 0.75 ? ' hi' : '') + '">' + Math.round(o * 13) + '/13</div>'; }).join('');
    var end = D.add(tapeStart, N);
    active().forEach(function (b) {
      if (b.checkout <= tapeStart || b.checkin >= end || rowY[b.room] == null) return;
      var s = Math.max(-0.5, D.diff(tapeStart, b.checkin) + 0.5), e = Math.min(N, D.diff(tapeStart, b.checkout) + 0.5);
      g += '<div class="bk' + (b.status === 'tentative' ? ' tentative' : '') + (b.status === 'checked-out' ? ' out' : '') + (b.status === 'in-house' ? ' in' : '') + '" tabindex="0" role="button" data-ref="' + b.ref + '" style="left:' + (lw + s * col + 2) + 'px;width:' + Math.max(18, (e - s) * col - 4) + 'px;top:' + (rowY[b.room] + 5) + 'px;background-color:' + src(b) + '">' + esc(b.guest.last) + ' <small>' + D.diff(b.checkin, b.checkout) + 'n</small><span class="sr">, ' + esc(b.guest.first) + ', ' + b.room + ', ' + D.fmt(b.checkin) + ' to ' + D.fmt(b.checkout) + '. Enter to open.</span></div>';
    });
    view.innerHTML = html + '<div class="tc" id="tc">' + g + '</div></div><p class="small muted" style="margin-top:8px">Click an empty night to take a phone booking. Drag a stay along its row to move dates, or to another room of the same type; clashes are refused and every move can be undone.</p>';
    $('#tc-prev').onclick = function () { tapeStart = D.add(tapeStart, -7); R.tape(); }; $('#tc-next').onclick = function () { tapeStart = D.add(tapeStart, 7); R.tape(); }; $('#tc-today').onclick = function () { tapeStart = D.add(today, -2); R.tape(); };
    $('#tcg').addEventListener('click', function (e) { var c = e.target.closest('.cell'); if (c && !TD.roomTaken(c.dataset.room, c.dataset.d)) newBooking({ room: c.dataset.room, type: rowType[c.dataset.room], in: c.dataset.d }); });
    $$('.bk', view).forEach(function (el) {
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBooking(el.dataset.ref); } });
      el.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return; var sx = e.clientX, sy = e.clientY, moved = false, b = TD.findBooking(el.dataset.ref), dDay = 0, target = b.room;
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
        function mv(ev) {
          var dx = ev.clientX - sx, dy = ev.clientY - sy; if (!moved && Math.hypot(dx, dy) < 6) return; moved = true; el.classList.add('dragging');
          dDay = Math.round(dx / col); var yy = rowY[b.room] + dy + row / 2; target = b.room;
          Object.keys(rowY).forEach(function (r) { if (yy >= rowY[r] && yy < rowY[r] + row && rowType[r] === b.type) target = r; });
          el.style.transform = 'translate(' + (dDay * col) + 'px,' + (rowY[target] - rowY[b.room]) + 'px)';
          var ok = dDay === 0 && target === b.room ? true : TD.freeRooms(b.type, D.add(b.checkin, dDay), D.add(b.checkout, dDay), b.ref).indexOf(target) >= 0 && D.add(b.checkin, dDay) >= (b.status === 'in-house' ? b.checkin : today);
          el.classList.toggle('bad-drop', !ok);
        }
        function up() {
          el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
          if (!moved) { openBooking(b.ref); return; }
          var bad = el.classList.contains('bad-drop'); el.classList.remove('dragging', 'bad-drop'); el.style.transform = '';
          if (bad) { ui.toast('That clashes with another stay, or moves one into the past.'); return; }
          if (!dDay && target === b.room) return;
          var before = { room: b.room, checkin: b.checkin, checkout: b.checkout }, after = { room: target, checkin: D.add(b.checkin, dDay), checkout: D.add(b.checkout, dDay) };
          TD.updateBooking(b.ref, function (x) { Object.assign(x, after); if (dDay) { var q = TD.requote(x); x.total = q.total; if (x.pay) x.pay.total = q.total; } }, 'Moved on the tape chart: ' + before.room + ' ' + D.fmt(before.checkin) + ' → ' + after.room + ' ' + D.fmt(after.checkin));
          R.tape(); ui.toast(b.guest.last + ' moved to ' + target + (dDay ? ', ' + D.fmt(after.checkin) : ''), 'Undo', function () { TD.updateBooking(b.ref, function (x) { Object.assign(x, before); var q = TD.requote(x); x.total = q.total; }, 'Undo move'); R.tape(); });
        }
        el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
      });
    });
  };

  // =====================================================================================
  // BOOKINGS: filters, saved views, column choice, bulk with preview
  // =====================================================================================
  var bkFilter = 'upcoming', bkSrc = '', bkQ = '', bkSort = ['checkin', 1], sel = {};
  var COLS = [['ref', 'Ref'], ['guest', 'Guest'], ['room', 'Room'], ['checkin', 'Arrive'], ['checkout', 'Leave'], ['nights', 'Nights'], ['source', 'Source'], ['plan', 'Meals'], ['status', 'Status'], ['total', 'Total'], ['balance', 'Balance']];
  var cols = ['ref', 'guest', 'room', 'checkin', 'checkout', 'source', 'status', 'total', 'balance'];
  try { var sv = JSON.parse(localStorage.getItem('taradhura:staff-view') || 'null'); if (sv) { bkFilter = sv.f || bkFilter; bkSrc = sv.s || ''; if (sv.c) cols = sv.c; } } catch (e) {}
  var FILTERS = {
    upcoming: ['Upcoming', function (b) { return b.status === 'confirmed' || b.status === 'tentative'; }],
    arriving: ['Arriving today', function (b) { return b.checkin === today && (b.status === 'confirmed' || b.status === 'tentative'); }],
    inhouse: ['In house', function (b) { return b.status === 'in-house'; }],
    departing: ['Departing today', function (b) { return b.checkout === today && b.status === 'in-house'; }],
    tentative: ['On hold', function (b) { return b.status === 'tentative'; }],
    balance: ['Balance due', function (b) { return (b.status === 'confirmed' || b.status === 'in-house') && bal(b) > 0; }],
    direct: ['Direct', function (b) { return b.source.indexOf('Direct') === 0 && b.status !== 'cancelled'; }],
    past: ['Stayed', function (b) { return b.status === 'checked-out'; }],
    cancelled: ['Cancelled', function (b) { return b.status === 'cancelled'; }]
  };
  function cell(b, k) {
    if (k === 'ref') return b.ref; if (k === 'guest') return '<b>' + esc(name(b)) + '</b> <span class="muted">' + esc(b.guest.city || '') + '</span>'; if (k === 'room') return b.room;
    if (k === 'checkin' || k === 'checkout') return D.fmt(b[k], { weekday: 'short' }); if (k === 'nights') return D.diff(b.checkin, b.checkout);
    if (k === 'source') return '<span class="src" style="background:' + src(b) + '"></span>' + esc(b.source); if (k === 'plan') return esc(((TD.plans.filter(function (p) { return p.id === b.plan; })[0]) || {}).name || '');
    if (k === 'status') return pill(b); if (k === 'total') return TD.inr(b.total || 0); if (k === 'balance') return bal(b) ? TD.inr(bal(b)) : '—';
  }
  R.bookings = function () {
    var all = TD.bookings(), f = FILTERS[bkFilter] || FILTERS.upcoming;
    var list = all.filter(f[1]).filter(function (b) { return !bkSrc || b.source === bkSrc; }).filter(function (b) { if (!bkQ) return true; var q = bkQ.toLowerCase(); return (b.ref + ' ' + name(b) + ' ' + b.room + ' ' + b.guest.email + ' ' + b.guest.city).toLowerCase().indexOf(q) >= 0; });
    var key = bkSort[0], dir = bkSort[1], val = function (b) { return key === 'guest' ? name(b) : key === 'total' ? b.total : key === 'balance' ? bal(b) : key === 'nights' ? D.diff(b.checkin, b.checkout) : b[key]; };
    list.sort(function (a, b) { var x = val(a), y = val(b); return (x > y ? 1 : x < y ? -1 : 0) * dir; });
    var html = '<div class="tbar"><label class="search"><span class="sr">Search bookings</span><input id="bk-q" type="search" placeholder="Guest, reference, room, city" value="' + esc(bkQ) + '"></label>' +
      Object.keys(FILTERS).map(function (k) { return '<button type="button" class="fchip" aria-pressed="' + (k === bkFilter) + '" data-f="' + k + '">' + FILTERS[k][0] + ' <em>' + all.filter(FILTERS[k][1]).length + '</em></button>'; }).join('') +
      '<label class="sr" for="bk-src">Source</label><select id="bk-src" class="fchip"><option value="">All sources</option>' + Object.keys(SRC).map(function (s) { return '<option' + (s === bkSrc ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>' +
      '<span class="colmenu"><button type="button" class="fchip" id="bk-cols" aria-haspopup="true" aria-expanded="false">Columns</button><div class="bo-menu" id="bk-colm" hidden>' + COLS.map(function (c) { return '<label><input type="checkbox" value="' + c[0] + '"' + (cols.indexOf(c[0]) >= 0 ? ' checked' : '') + '> ' + c[1] + '</label>'; }).join('') + '</div></span>' +
      '<button type="button" class="fchip" id="bk-save">Save view</button><button type="button" class="fchip" id="bk-csv">Export</button></div>';
    var shown = COLS.filter(function (c) { return cols.indexOf(c[0]) >= 0; });
    html += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col" style="width:28px"><input type="checkbox" id="bk-all" aria-label="Select all shown"></th>' + shown.map(function (c) { return '<th scope="col" data-k="' + c[0] + '"' + (bkSort[0] === c[0] ? ' aria-sort="' + (dir > 0 ? 'ascending' : 'descending') + '"' : '') + (c[0] === 'total' || c[0] === 'balance' || c[0] === 'nights' ? ' class="num"' : '') + ' tabindex="0">' + c[1] + '</th>'; }).join('') + '<th scope="col"><span class="sr">Actions</span></th></tr></thead><tbody>' +
      (list.length ? list.slice(0, 150).map(function (b) { return '<tr data-ref="' + b.ref + '"' + (sel[b.ref] ? ' class="sel"' : '') + '><td><input type="checkbox" data-s="' + b.ref + '"' + (sel[b.ref] ? ' checked' : '') + ' aria-label="Select ' + b.ref + '"></td>' + shown.map(function (c) { return '<td' + (c[0] === 'total' || c[0] === 'balance' || c[0] === 'nights' ? ' class="num"' : '') + '>' + cell(b, c[0]) + '</td>'; }).join('') + '<td class="num"><span class="rowact">' + (b.status === 'tentative' ? '<button class="bob ghost" type="button" data-conf="' + b.ref + '">Confirm</button>' : b.status === 'in-house' && b.checkout === today ? '<button class="bob ghost" type="button" data-out="' + b.ref + '">Check out</button>' : '') + ' <button class="more" type="button" data-more="' + b.ref + '" aria-label="More for ' + b.ref + '">⋯</button></span></td></tr>'; }).join('') : '<tr><td colspan="' + (shown.length + 2) + '"><div class="empty"><b>No bookings match.</b>Try another filter, or clear the search.</div></td></tr>') + '</tbody></table></div>' +
      (list.length > 150 ? '<p class="small muted" style="margin-top:8px">Showing 150 of ' + list.length + '. Narrow the search to see the rest.</p>' : '') + '<div id="bulk"></div>';
    view.innerHTML = html;
    var qi = $('#bk-q'); qi.oninput = function () { bkQ = qi.value; R.bookings(); var n = $('#bk-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
    $$('[data-f]', view).forEach(function (b) { b.onclick = function () { bkFilter = b.dataset.f; sel = {}; R.bookings(); }; });
    $('#bk-src').onchange = function () { bkSrc = this.value; R.bookings(); };
    var cbt = $('#bk-cols'), cm = $('#bk-colm'); cbt.onclick = function (e) { e.stopPropagation(); cm.hidden = !cm.hidden; cbt.setAttribute('aria-expanded', !cm.hidden); };
    $$('input', cm).forEach(function (i) { i.onchange = function () { cols = $$('input:checked', cm).map(function (x) { return x.value; }); if (!cols.length) cols = ['guest']; R.bookings(); $('#bk-colm').hidden = false; }; });
    $('#bk-save').onclick = function () { try { localStorage.setItem('taradhura:staff-view', JSON.stringify({ f: bkFilter, s: bkSrc, c: cols })); } catch (e) {} ui.toast('View saved: ' + FILTERS[bkFilter][0] + (bkSrc ? ' · ' + bkSrc : '') + ', ' + cols.length + ' columns'); };
    $('#bk-csv').onclick = function () { var rows = [['Ref', 'Guest', 'Email', 'Room', 'Arrive', 'Leave', 'Source', 'Status', 'Total', 'Balance']].concat(list.map(function (b) { return [b.ref, name(b), b.guest.email, b.room, b.checkin, b.checkout, b.source, b.status, b.total, bal(b)]; })); var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n')], { type: 'text/csv' })); a.download = 'taradhura-bookings-' + today + '.csv'; a.click(); ui.toast('Exported ' + list.length + ' bookings'); };
    $$('th[data-k]', view).forEach(function (th) { var go = function () { bkSort = [th.dataset.k, bkSort[0] === th.dataset.k ? -bkSort[1] : 1]; R.bookings(); }; th.onclick = go; th.onkeydown = function (e) { if (e.key === 'Enter') go(); }; });
    $('tbody', view).addEventListener('click', function (e) { if (e.target.closest('input,button')) return; var tr = e.target.closest('tr[data-ref]'); if (tr) openBooking(tr.dataset.ref); });
    $$('[data-s]', view).forEach(function (c) { c.onchange = function () { if (c.checked) sel[c.dataset.s] = 1; else delete sel[c.dataset.s]; c.closest('tr').classList.toggle('sel', c.checked); bulk(); }; });
    $('#bk-all').onchange = function () { var on = this.checked; list.slice(0, 150).forEach(function (b) { if (on) sel[b.ref] = 1; else delete sel[b.ref]; }); R.bookings(); };
    $$('[data-conf]', view).forEach(function (x) { x.onclick = function () { confirmHold(x.dataset.conf); }; });
    $$('[data-more]', view).forEach(function (x) { x.onclick = function (e) { e.stopPropagation(); var b = TD.findBooking(x.dataset.more); popMenu(x, [{ t: 'Open', fn: function () { openBooking(b.ref); } }, { t: 'Message ' + b.guest.first, fn: function () { msgRef = b.ref; location.hash = 'messages'; } }, { t: 'Send pre-arrival note', fn: function () { previewBulk([b.ref], 'prearrival'); } }].concat(b.status === 'confirmed' || b.status === 'tentative' ? [{ t: 'Cancel booking…', danger: true, fn: function () { cancelBk(b); } }] : [])); }; });
    wireOpen(view); bulk();
  };
  document.addEventListener('click', function (e) { if (!e.target.closest('.colmenu')) { var m = $('#bk-colm'); if (m && !m.hidden) { m.hidden = true; var b = $('#bk-cols'); b && b.setAttribute('aria-expanded', 'false'); } } });
  function confirmHold(ref) { var b = TD.findBooking(ref); TD.updateBooking(ref, function (x) { x.status = 'confirmed'; }, 'Hold confirmed by ' + ME); TD.addMessage(ref, 'desk', TD.fill('confirm', b), 'confirm'); ui.toast(b.guest.first + ' confirmed and told', 'Undo', function () { TD.updateBooking(ref, function (x) { x.status = 'tentative'; }, 'Undo confirm'); route(); }); route(); }
  function cancelBk(b) { var rf = TD.refundFor(b); if (!confirm('Cancel ' + b.ref + ' for ' + name(b) + '? Refund by policy: ' + TD.inr(rf.amount) + ' (' + Math.round(rf.pct * 100) + '%).')) return; TD.updateBooking(b.ref, function (x) { x.status = 'cancelled'; x.refund = rf.amount; }, 'Cancelled by ' + ME + '; refund ' + TD.inr(rf.amount)); ui.closeSheet(true); route(); ui.toast(b.ref + ' cancelled', 'Undo', function () { TD.updateBooking(b.ref, function (x) { x.status = 'confirmed'; x.refund = 0; }, 'Undo cancel'); route(); }); }
  function bulk() {
    var refs = Object.keys(sel), box = $('#bulk'); if (!box) return;
    if (!refs.length) { box.innerHTML = ''; return; }
    box.innerHTML = '<div class="bulk" role="region" aria-label="Bulk actions"><b>' + refs.length + ' selected</b><button class="bob lamp" type="button" id="bu-msg">Send pre-arrival note</button><button class="bob ghost" type="button" id="bu-conf">Confirm holds</button><button class="bob ghost" type="button" id="bu-clear">Clear</button></div>';
    $('#bu-clear').onclick = function () { sel = {}; R.bookings(); };
    $('#bu-msg').onclick = function () { previewBulk(refs, 'prearrival'); };
    $('#bu-conf').onclick = function () {
      var holds = refs.filter(function (r) { var b = TD.findBooking(r); return b && b.status === 'tentative'; });
      ui.sheet('Confirm ' + holds.length + ' hold' + (holds.length === 1 ? '' : 's') + '?', '<p style="margin-top:14px">What this does:</p><div class="kvs"><div><span>Become confirmed and get the confirmation note</span><b>' + holds.length + '</b></div><div><span>Already confirmed or closed, left alone</span><b>' + (refs.length - holds.length) + '</b></div></div>', '<button class="bob ghost" type="button" id="bc-x">Cancel</button><button class="bob lamp" type="button" id="bc-go"' + (holds.length ? '' : ' disabled title="None of the selected bookings are on hold"') + '>Apply</button>', function (sh) {
        $('#bc-x', sh).onclick = function () { ui.closeSheet(); };
        $('#bc-go', sh).onclick = function () { holds.forEach(function (r) { TD.updateBooking(r, function (x) { x.status = 'confirmed'; }, 'Hold confirmed in bulk by ' + ME); TD.addMessage(r, 'desk', TD.fill('confirm', TD.findBooking(r)), 'confirm'); }); ui.closeSheet(); sel = {}; R.bookings(); ui.toast(holds.length + ' bookings confirmed'); };
      });
    };
  }
  function previewBulk(refs, tpl) {
    var bs = refs.map(TD.findBooking).filter(Boolean), ok = bs.filter(function (b) { return b.status === 'confirmed' || b.status === 'tentative'; }), skip = bs.length - ok.length;
    var already = ok.filter(function (b) { return (TD.messages()[b.ref] || []).some(function (m) { return m.tpl === tpl; }); }), send = ok.filter(function (b) { return already.indexOf(b) < 0; });
    ui.sheet('Send “' + TD.templates.filter(function (t) { return t.id === tpl; })[0].name + '”', '<p style="margin-top:14px">What this does to the inbox:</p><div class="kvs"><div><span>Will send</span><b>' + send.length + '</b></div><div><span>Already sent, skipped</span><b>' + already.length + '</b></div><div><span>Stayed or cancelled, skipped</span><b>' + skip + '</b></div></div>' + (send[0] ? '<p class="small muted">Preview for ' + esc(name(send[0])) + ':</p><div class="remark">' + esc(TD.fill(tpl, send[0])) + '</div>' : ''), '<button class="bob ghost" type="button" id="bp-x">Cancel</button><span style="display:flex;gap:8px"><button class="bob ghost" type="button" id="bp-all"' + (already.length ? '' : ' hidden') + '>Include already sent</button><button class="bob lamp" type="button" id="bp-go"' + (send.length ? '' : ' disabled title="Everyone selected already has it"') + '>Send ' + send.length + '</button></span>', function (sh) {
      $('#bp-x', sh).onclick = function () { ui.closeSheet(); };
      function go(list) { list.forEach(function (b) { TD.addMessage(b.ref, 'desk', TD.fill(tpl, b), tpl); TD.updateBooking(b.ref, function () {}, 'Pre-arrival note sent by ' + ME); }); ui.closeSheet(); sel = {}; route(); ui.toast(list.length + ' notes sent'); }
      $('#bp-go', sh).onclick = function () { go(send); }; $('#bp-all', sh).onclick = function () { go(ok); };
    });
  }

  // ---------- the record: a slide-over with overview, timeline, notes and related ----------
  function openBooking(ref, tab) {
    var b = TD.findBooking(ref); if (!b) return; var t = TD.type(b.type), n = D.diff(b.checkin, b.checkout), q = TD.requote(b), due = bal(b);
    var plan = TD.plans.filter(function (p) { return p.id === b.plan; })[0];
    var adds = Object.keys(b.addons || {}).filter(function (k) { return b.addons[k] && TD.addon(k); });
    var slots = TD.slots().filter(function (s) { return s.ref === b.ref && s.status !== 'cancelled'; }), thread = TD.messages()[b.ref] || [];
    var chats = (orbitReady ? Orbit.convos.list() : rawConvos()).filter(function (c) { return c.agent === 'resort' && c.user && (c.user.email === b.guest.email || c.user.name === name(b)); });
    var ov = '<div class="rec-sum">' + pill(b) + '<span class="chipx">' + b.ref + '</span><span class="chipx"><span class="src" style="background:' + src(b) + '"></span>' + esc(b.source) + '</span>' + (due ? '<span class="pill warn">' + TD.inr(due) + ' due</span>' : '') + '</div>' +
      (b.guest.requests ? '<div class="remark" style="margin:14px 0"><small>Last note from ' + esc(b.guest.first) + '</small>' + esc(b.guest.requests) + '</div>' : '<div style="height:14px"></div>') +
      '<div class="kvs"><div><span>Stay</span><b>' + b.room + ' · ' + esc(t.name) + '</b></div><div><span>Dates</span><b>' + D.fmt(b.checkin, { weekday: 'short' }) + ' → ' + D.fmt(b.checkout, { weekday: 'short' }) + ' · ' + n + 'n</b></div><div><span>Guests</span><b>' + b.adults + ' adult' + (b.adults > 1 ? 's' : '') + (b.kids && b.kids.length ? ' + ' + b.kids.length + ' child' : '') + '</b></div><div><span>Meals</span><b>' + esc(plan ? plan.name : '') + '</b></div><div><span>Email</span><b style="font-weight:500">' + esc(b.guest.email) + '</b></div><div><span>Mobile</span>' + (b.guest.phone ? '<b style="font-weight:500">' + esc(b.guest.phone) + '</b>' : '<button class="gap" type="button" data-gap="phone">+ Add mobile</button>') + '</div><div><span>Arriving</span>' + (b.guest.arrival ? '<b>' + esc(b.guest.arrival) + '</b>' : '<button class="gap" type="button" data-gap="arrival">+ Add ETA</button>') + '</div><div><span>City</span>' + (b.guest.city ? '<b>' + esc(b.guest.city) + '</b>' : '<button class="gap" type="button" data-gap="city">+ Add city</button>') + '</div></div>' +
      '<div class="sect-h"><h3>Money</h3></div><div class="money"><div><span>Total incl. GST</span><span>' + TD.inr(b.total || q.total) + '</span></div><div><span>Paid · ' + esc((b.pay && b.pay.method) || '') + '</span><span>' + TD.inr((b.pay && b.pay.paid) || 0) + '</span></div><div><span>Balance</span><span>' + (due ? TD.inr(due) : 'Settled') + '</span></div></div>' +
      (adds.length ? '<div class="sect-h" style="margin-top:14px"><h3>Add-ons</h3></div><div class="money">' + adds.map(function (k) { var a = TD.addon(k); return '<div style="font-weight:400"><span>' + esc(a.name) + (b.addons[k] > 1 ? ' × ' + b.addons[k] : '') + '</span><span>' + (a.price ? TD.inr(a.price * b.addons[k] * (a.perNight ? n : 1)) : 'Free') + '</span></div>'; }).join('') + '</div>' : '') +
      '<div class="sect-h" style="margin-top:14px"><h3>Related</h3></div><div class="related">' + (slots.map(function (s) { return '<button type="button" data-go="roster"><span>◎ ' + esc(TD.exp(s.exp).name) + ' · ' + D.fmt(s.date) + ' ' + s.time + '</span><span class="muted">' + s.guests + ' guests</span></button>'; }).join('') + (thread.length ? '<button type="button" data-go="messages"><span>✉ ' + thread.length + ' guest messages</span><span class="muted">' + ago(thread[thread.length - 1].at) + '</span></button>' : '') + chats.map(function (c) { return '<button type="button" data-chat="' + c.id + '"><span>◌ Concierge chat on the ' + (c.channel === 'whatsapp' ? 'WhatsApp line' : 'website') + '</span><span class="muted">' + ago(c.updatedAt) + '</span></button>'; }).join('') || '<p class="muted small" style="margin:4px 0">Nothing linked yet.</p>') + '</div>' +
      '<div class="sect-h" style="margin-top:14px"><h3>Move room</h3></div><label class="sr" for="mv-room">Room</label><select id="mv-room" class="fchip">' + t.rooms.map(function (r) { var free = TD.freeRooms(b.type, b.checkin, b.checkout, b.ref).indexOf(r) >= 0 || r === b.room; return '<option value="' + r + '"' + (r === b.room ? ' selected' : '') + (free ? '' : ' disabled') + '>' + r + (free ? '' : ' (taken)') + '</option>'; }).join('') + '</select>';
    var tl = (b.log || []).map(function (l) { return [l.at, '•', l.what]; }).concat(thread.map(function (m) { return [m.at, m.from === 'guest' ? '←' : '→', (m.from === 'guest' ? b.guest.first + ': ' : 'Desk: ') + m.text.slice(0, 120)]; })).concat((b.notes || []).map(function (x) { return [x.at, '✎', x.by + ': ' + x.text]; })).sort(function (a, c) { return a[0] < c[0] ? 1 : -1; });
    var tlH = '<ul class="log">' + tl.map(function (x) { return '<li><i aria-hidden="true">' + x[1] + '</i><span>' + esc(x[2]) + '</span><small>' + new Date(x[0]).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</small></li>'; }).join('') + '</ul>';
    var notesH = '<form class="note-f" id="nf"><label class="sr" for="nf-i">Add a note</label><input id="nf-i" placeholder="A note for the next shift"><button class="bob" type="submit">Add</button></form><ul class="log">' + ((b.notes || []).slice().reverse().map(function (x) { return '<li><i aria-hidden="true">✎</i><span>' + esc(x.text) + '</span><small>' + esc(x.by) + ' · ' + ago(x.at) + '</small></li>'; }).join('') || '<li><i></i><span class="muted">No notes yet. Notes stay on the booking for whoever is on next.</span><small></small></li>') + '</ul>';
    var primary = b.status === 'confirmed' && b.checkin <= today ? ['Start check-in', function () { ui.closeSheet(true); location.hash = 'arrivals'; }] : b.status === 'tentative' ? ['Confirm hold', function () { ui.closeSheet(true); confirmHold(b.ref); }] : b.status === 'in-house' ? ['Check out' + (due ? ' & settle ' + TD.inr(due) : ''), function () { ui.closeSheet(true); checkOut(b.ref); }] : due ? ['Record ' + TD.inr(due), function () { TD.updateBooking(b.ref, function (x) { x.pay.paid += due; }, 'Payment recorded by ' + ME + ': ' + TD.inr(due)); ui.closeSheet(true); route(); ui.toast(TD.inr(due) + ' recorded'); }] : ['Message ' + b.guest.first, function () { ui.closeSheet(true); msgRef = b.ref; location.hash = 'messages'; }];
    ui.sheet(name(b), '<div class="rec-tabs" role="tablist"><button type="button" role="tab" data-tab="o" aria-selected="true">Overview</button><button type="button" role="tab" data-tab="t" aria-selected="false">Timeline <span class="muted">' + tl.length + '</span></button><button type="button" role="tab" data-tab="n" aria-selected="false">Notes <span class="muted">' + (b.notes || []).length + '</span></button></div><div data-pane="o">' + ov + '</div><div data-pane="t" hidden>' + tlH + '</div><div data-pane="n" hidden>' + notesH + '</div>',
      '<button class="more" type="button" id="r-more" aria-label="More actions">⋯</button><button class="bob lamp" type="button" id="r-pri">' + esc(primary[0]) + '</button>', function (sh) {
        $$('[data-tab]', sh).forEach(function (x) { x.onclick = function () { $$('[data-tab]', sh).forEach(function (y) { y.setAttribute('aria-selected', y === x); }); $$('[data-pane]', sh).forEach(function (p) { p.hidden = p.dataset.pane !== x.dataset.tab; }); }; });
        if (tab === 'notes') $('[data-tab="n"]', sh).click();
        $('#r-pri', sh).onclick = primary[1];
        $('#r-more', sh).onclick = function () { popMenu(this, [{ t: 'Message ' + b.guest.first, fn: function () { ui.closeSheet(true); msgRef = b.ref; location.hash = 'messages'; } }, { t: 'Send pre-arrival note', fn: function () { previewBulk([b.ref], 'prearrival'); } }, { t: 'Send payment link', fn: function () { TD.addMessage(b.ref, 'desk', 'Namaste ' + b.guest.first + ', the balance for your stay can be paid here: taradhura.in/pay/' + b.ref + '.', 'paylink'); ui.toast('Payment link sent'); } }].concat(b.status === 'confirmed' || b.status === 'tentative' ? [{ t: 'Cancel booking…', danger: true, fn: function () { cancelBk(b); } }] : [])); };
        $('#mv-room', sh).onchange = function () { var to = this.value, from = b.room; TD.updateBooking(b.ref, function (x) { x.room = to; }, 'Moved ' + from + ' → ' + to + ' by ' + ME); ui.closeSheet(true); route(); ui.toast('Moved to ' + to, 'Undo', function () { TD.updateBooking(b.ref, function (x) { x.room = from; }, 'Undo move'); route(); }); };
        $$('[data-gap]', sh).forEach(function (x) { x.onclick = function () { var k = x.dataset.gap, lab = { phone: 'Mobile number', arrival: 'Arriving around (15:30)', city: 'City' }[k], v = prompt(lab + '?'); if (!v) return; TD.updateBooking(b.ref, function (y) { y.guest[k] = v.trim(); }, lab.split(' (')[0] + ' added by ' + ME); openBooking(b.ref); }; });
        $$('[data-go]', sh).forEach(function (x) { x.onclick = function () { ui.closeSheet(true); if (x.dataset.go === 'messages') msgRef = b.ref; location.hash = x.dataset.go; }; });
        $$('[data-chat]', sh).forEach(function (x) { x.onclick = function () { ui.closeSheet(true); chatId = x.dataset.chat; location.hash = 'inbox'; }; });
        $('#nf', sh).onsubmit = function (e) { e.preventDefault(); var v = $('#nf-i', sh).value.trim(); if (!v) { $('#nf-i', sh).focus(); return; } TD.updateBooking(b.ref, function (y) { (y.notes = y.notes || []).push({ at: new Date().toISOString(), by: ME, text: v }); }); openBooking(b.ref, 'notes'); ui.toast('Note added'); };
      });
  }

  // ---------- new: booking, experience place, enquiry ----------
  function newBooking(pre) {
    pre = pre && pre.type ? pre : {}; var type = pre.type || 'ridge', ci = pre.in || D.add(today, 1);
    var body = '<div class="form-grid" style="margin-top:14px"><label class="field"><span>Cottage</span><select id="nb-t">' + TD.types.map(function (t) { return '<option value="' + t.id + '"' + (t.id === type ? ' selected' : '') + '>' + esc(t.name) + '</option>'; }).join('') + '</select></label><label class="field"><span>Room</span><select id="nb-r"></select></label>' +
      '<label class="field"><span>Arrive</span><input type="date" id="nb-in" value="' + ci + '" min="' + today + '"></label><label class="field"><span>Nights</span><input type="number" id="nb-n" value="2" min="1" max="21"></label>' +
      '<label class="field"><span>First name</span><input id="nb-f" autocomplete="off"></label><label class="field"><span>Last name</span><input id="nb-l" autocomplete="off"></label><label class="field"><span>Email</span><input id="nb-e" type="email"></label><label class="field"><span>Adults</span><input id="nb-a" type="number" value="2" min="1" max="6"></label>' +
      '<label class="field"><span>Source</span><select id="nb-s"><option>Phone / WhatsApp</option><option>Walk-in</option><option>Travel agent</option><option>Corporate</option></select></label><label class="field"><span>Meals</span><select id="nb-p">' + TD.plans.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + '</option>'; }).join('') + '</select></label><label class="field full"><span>Status</span><select id="nb-st"><option value="confirmed">Confirmed (advance received)</option><option value="tentative">On hold for 24 hours</option></select></label></div><p id="nb-q" class="small" style="margin-top:12px" aria-live="polite"></p>';
    ui.sheet('New booking', body, '<span class="small muted">Phone, walk-in and agent bookings</span><button class="bob lamp" type="button" id="nb-go">Create booking</button>', function (sh) {
      function rooms() { var t = TD.type($('#nb-t', sh).value), i = $('#nb-in', sh).value, o = D.add(i, +$('#nb-n', sh).value || 1), free = TD.freeRooms(t.id, i, o); $('#nb-r', sh).innerHTML = t.rooms.map(function (r) { return '<option value="' + r + '"' + (free.indexOf(r) < 0 ? ' disabled' : '') + (r === pre.room ? ' selected' : '') + '>' + r + (free.indexOf(r) < 0 ? ' (taken)' : '') + '</option>'; }).join(''); var qq = TD.quote({ type: t.id, checkin: i, checkout: o, rooms: 1, adults: +$('#nb-a', sh).value || 2, plan: $('#nb-p', sh).value }); $('#nb-q', sh).innerHTML = free.length ? 'Quote <b>' + TD.inr(qq.total) + '</b> incl. GST · ' + qq.nights.map(function (x) { return TD.inr(x.rate); }).join(' + ') : '<span style="color:var(--bad)">No ' + esc(t.name) + ' free for those dates.</span>'; $('#nb-go', sh).disabled = !free.length; }
      sh.addEventListener('change', rooms); sh.addEventListener('input', function (e) { if (e.target.type === 'number') rooms(); }); rooms();
      $('#nb-go', sh).onclick = function () {
        var f = $('#nb-f', sh).value.trim(), l = $('#nb-l', sh).value.trim(); if (!f || !l) { ui.toast('First and last name, please.'); ($('#nb-f', sh).value ? $('#nb-l', sh) : $('#nb-f', sh)).focus(); return; }
        var t = $('#nb-t', sh).value, i = $('#nb-in', sh).value, o = D.add(i, +$('#nb-n', sh).value || 1), room = $('#nb-r', sh).value;
        if (TD.freeRooms(t, i, o).indexOf(room) < 0) { ui.toast('That room is taken for those dates.'); return; }
        var qq = TD.quote({ type: t, checkin: i, checkout: o, rooms: 1, adults: +$('#nb-a', sh).value || 2, plan: $('#nb-p', sh).value }), list = TD.bookings(), ref = TD.newRef(), st = $('#nb-st', sh).value;
        list.push({ ref: ref, type: t, room: room, checkin: i, checkout: o, adults: +$('#nb-a', sh).value || 2, kids: [], plan: $('#nb-p', sh).value, addons: {}, guest: { first: f, last: l, email: $('#nb-e', sh).value.trim() || (f + '.' + l).toLowerCase() + '@example.com', phone: '', city: '', arrival: '', requests: '' }, source: $('#nb-s', sh).value, status: st, total: qq.total, pay: { mode: 'deposit', method: st === 'confirmed' ? 'Bank transfer' : '—', paid: st === 'confirmed' ? qq.deposit : 0, total: qq.total }, created: new Date().toISOString(), log: [{ at: new Date().toISOString(), what: 'Created at the desk by ' + ME + ' (' + $('#nb-s', sh).value + ')' }] });
        TD.saveBookings(list); TD.invalidate(); ui.closeSheet(true); route(); ui.toast(ref + ' created for ' + f + ' ' + l, 'Open', function () { openBooking(ref); });
      };
    });
  }
  function newSlot() {
    var body = '<div class="form-grid" style="margin-top:14px"><label class="field full"><span>Experience</span><select id="ns-e">' + TD.experiences.map(function (e) { return '<option value="' + e.id + '">' + esc(e.name) + ' · ' + e.slots.join(', ') + '</option>'; }).join('') + '</select></label><label class="field"><span>Day</span><input type="date" id="ns-d" value="' + D.add(today, 1) + '" min="' + today + '"></label><label class="field"><span>Time</span><select id="ns-t"></select></label><label class="field"><span>Guests</span><input type="number" id="ns-g" value="2" min="1" max="10"></label><label class="field"><span>In-house guest</span><select id="ns-b"><option value="">Day visitor</option>' + active().filter(function (b) { return b.status === 'in-house' || (b.status === 'confirmed' && D.diff(today, b.checkin) <= 3); }).map(function (b) { return '<option value="' + b.ref + '">' + esc(name(b)) + ' · ' + b.room + '</option>'; }).join('') + '</select></label><label class="field full"><span>Name, if a day visitor</span><input id="ns-n"></label></div>';
    ui.sheet('Book an experience place', body, '<span></span><button class="bob lamp" type="button" id="ns-go">Book place</button>', function (sh) {
      function upd() { var e = TD.exp($('#ns-e', sh).value), d = $('#ns-d', sh).value; $('#ns-t', sh).innerHTML = e.slots.map(function (t) { var left = e.cap - TD.slotTaken(e.id, d, t); return '<option value="' + t + '"' + (left <= 0 ? ' disabled' : '') + '>' + t + ' · ' + Math.max(0, left) + ' left</option>'; }).join(''); }
      sh.addEventListener('change', function (e) { if (e.target.id !== 'ns-t') upd(); }); upd();
      $('#ns-go', sh).onclick = function () { var e = TD.exp($('#ns-e', sh).value), d = $('#ns-d', sh).value, t = $('#ns-t', sh).value, g = +$('#ns-g', sh).value || 1, br = $('#ns-b', sh).value, b = br ? TD.findBooking(br) : null, nm2 = b ? name(b) : $('#ns-n', sh).value.trim(); if (!t) { ui.toast('That day is full.'); return; } if (!nm2) { ui.toast('Who is it for?'); $('#ns-n', sh).focus(); return; } if (e.cap - TD.slotTaken(e.id, d, t) < g) { ui.toast('Only ' + (e.cap - TD.slotTaken(e.id, d, t)) + ' places left.'); return; } var l = TD.slots(); l.push({ id: 'X' + (700 + l.length), exp: e.id, date: d, time: t, guests: g, name: nm2, ref: b ? b.ref : null, room: b ? b.room : 'Day visitor', status: 'booked' }); TD.saveSlots(l); ui.closeSheet(true); route(); ui.toast(e.name + ' · ' + D.fmt(d) + ' ' + t + ' booked for ' + nm2); };
    });
  }
  function newEnquiry() {
    ui.sheet('New wedding or offsite enquiry', '<div class="form-grid" style="margin-top:14px"><label class="field"><span>Name</span><input id="ne-n"></label><label class="field"><span>Kind</span><select id="ne-k"><option>Wedding</option><option>Offsite</option><option>Celebration</option><option>Retreat</option></select></label><label class="field"><span>Guests</span><input id="ne-g" type="number" min="8" value="40"></label><label class="field"><span>Dates</span><input id="ne-d" placeholder="e.g. March 2027"></label><label class="field full"><span>Note</span><textarea id="ne-t"></textarea></label></div>', '<span></span><button class="bob lamp" type="button" id="ne-go">Add to the pipeline</button>', function (sh) {
      $('#ne-go', sh).onclick = function () { var n = $('#ne-n', sh).value.trim(); if (!n) { $('#ne-n', sh).focus(); return; } var l = TD.enquiries(), id = 'EQ-' + (1047 + l.length); l.unshift({ id: id, kind: $('#ne-k', sh).value, name: n, org: '', guests: +$('#ne-g', sh).value || 20, dates: $('#ne-d', sh).value || 'Flexible', budget: 'Not sure', stage: 'New', venue: 'Not sure', created: today, note: $('#ne-t', sh).value || '—' }); TD.saveEnquiries(l); ui.closeSheet(true); if (cur === 'enquiries') route(); else location.hash = 'enquiries'; ui.toast(id + ' added'); };
    });
  }

  // =====================================================================================
  // EXPERIENCES ROSTER
  // =====================================================================================
  R.roster = function () {
    var slots = TD.slots(), html = '<div class="vh"><div><h2>Experiences roster</h2><p>Next 7 days. Places booked on the website and in the concierge chat appear here at once. Mark attendance after each walk.</p></div><button class="bob lamp" type="button" id="ro-new">Book a place</button></div>';
    for (var i = -1; i < 7; i++) {
      var d = D.add(today, i), day = slots.filter(function (s) { return s.date === d && s.status !== 'cancelled'; });
      html += '<h3 class="day-h">' + (i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : i === -1 ? 'Yesterday' : D.parse(d).toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'UTC' })) + ' <small>' + D.fmt(d) + ' · ' + day.reduce(function (a, s) { return a + s.guests; }, 0) + ' guests</small></h3><div class="slots">';
      var any = false;
      TD.experiences.forEach(function (e) { e.slots.forEach(function (t) {
        var g = day.filter(function (s) { return s.exp === e.id && s.time === t; }); if (!g.length) return; any = true; var n = g.reduce(function (a, s) { return a + s.guests; }, 0);
        html += '<section class="panel"><div class="panel-h"><div><h3>' + t + ' · ' + esc(e.name) + '</h3><small>' + esc(e.guide) + ' · ' + esc(e.dur) + '</small></div><span class="pill ' + (n >= e.cap ? 'warn' : 'ok') + '">' + n + '/' + e.cap + '</span></div><div class="panel-b"><div class="meter" style="margin:6px 0"><i style="width:' + Math.round(n / e.cap * 100) + '%"></i></div>' +
          g.map(function (s) { return '<div class="row"><div><b>' + esc(s.name) + '</b><small>' + s.guests + ' guest' + (s.guests > 1 ? 's' : '') + ' · ' + esc(s.room || '') + (s.chat ? ' · from the concierge' : s.web ? ' · booked online' : '') + '</small></div>' + (i <= 0 ? '<div class="att" role="group" aria-label="Attendance for ' + esc(s.name) + '"><button type="button" class="y" data-att="' + s.id + '" data-v="attended" aria-pressed="' + (s.status === 'attended') + '">Came</button><button type="button" class="n" data-att="' + s.id + '" data-v="no-show" aria-pressed="' + (s.status === 'no-show') + '">No-show</button></div>' : '<button class="more" type="button" data-cx="' + s.id + '" aria-label="Options for ' + esc(s.name) + '">⋯</button>') + '</div>'; }).join('') + '</div></section>';
      }); });
      if (!any) html += '<p class="muted small">Nothing booked yet.</p>';
      html += '</div>';
    }
    view.innerHTML = html;
    $('#ro-new').onclick = newSlot;
    $$('[data-att]', view).forEach(function (b) { b.onclick = function () { var l = TD.slots(); l.forEach(function (s) { if (s.id === b.dataset.att) s.status = s.status === b.dataset.v ? 'booked' : b.dataset.v; }); TD.saveSlots(l); R.roster(); }; });
    $$('[data-cx]', view).forEach(function (b) { b.onclick = function () { var l = TD.slots(), s = l.filter(function (x) { return x.id === b.dataset.cx; })[0]; popMenu(b, [{ t: 'Remove from the roster', danger: true, fn: function () { s.status = 'cancelled'; TD.saveSlots(l); R.roster(); ui.toast(s.name + ' removed', 'Undo', function () { s.status = 'booked'; TD.saveSlots(l); R.roster(); }); } }]); }; });
  };

  // =====================================================================================
  // GUEST MESSAGES (booking threads, templates)
  // =====================================================================================
  var msgRef = null, msgUnread = false, msgOpen = false;
  R.messages = function () {
    var m = TD.messages(), refs = Object.keys(m).filter(function (r) { return m[r].length && TD.findBooking(r); });
    refs.sort(function (a, b) { var x = m[a][m[a].length - 1], y = m[b][m[b].length - 1]; var ux = x.from === 'guest' && !x.read, uy = y.from === 'guest' && !y.read; return (uy - ux) || (x.at < y.at ? 1 : -1); });
    var unread = refs.filter(function (r) { var l = m[r][m[r].length - 1]; return l.from === 'guest' && !l.read; });
    if (msgUnread) refs = unread;
    if (!msgRef || refs.indexOf(msgRef) < 0) msgRef = refs[0] || null;
    var html = '<div class="tbar"><button type="button" class="fchip" aria-pressed="' + !msgUnread + '" id="m-all">All <em>' + Object.keys(m).length + '</em></button><button type="button" class="fchip" aria-pressed="' + msgUnread + '" id="m-un">Waiting for us <em>' + unread.length + '</em></button><span class="small muted" style="margin-left:auto">' + (unread.length ? 'Reply queue · ' + unread.length + ' to go' : 'Inbox zero') + '</span></div>';
    html += '<div class="inbox two' + (msgOpen ? ' reading' : '') + '"><div class="threads">' + (refs.length ? refs.map(function (r) { var b = TD.findBooking(r), l = m[r][m[r].length - 1], un = l.from === 'guest' && !l.read; return '<button type="button" class="thr' + (un ? ' unread' : '') + '" data-r="' + r + '" aria-current="' + (r === msgRef) + '"><span class="av sm g" aria-hidden="true">' + ini(name(b)) + '</span><b>' + esc(name(b)) + '</b><small>' + ago(l.at) + '</small><p>' + (l.from === 'desk' ? 'You: ' : '') + esc(l.text) + '</p><span class="meta"><small>' + b.room + ' · ' + D.fmt(b.checkin) + '</small></span></button>'; }).join('') : '<div class="empty"><b>No conversations here.</b>Guests’ messages from My booking land in this list.</div>') + '</div><div class="conv" id="conv"></div></div>';
    view.innerHTML = html;
    $('#m-all').onclick = function () { msgUnread = false; R.messages(); }; $('#m-un').onclick = function () { msgUnread = true; R.messages(); };
    $$('.thr', view).forEach(function (t) { t.onclick = function () { msgRef = t.dataset.r; msgOpen = true; R.messages(); }; });
    conv();
  };
  function conv() {
    var box = $('#conv'); if (!box) return; if (!msgRef) { box.innerHTML = '<div class="empty">Pick a conversation.</div>'; return; }
    var b = TD.findBooking(msgRef), m = TD.messages(), th = m[msgRef]; th.forEach(function (x) { x.read = true; }); TD.store.set('messages', m); counts();
    box.innerHTML = '<div class="conv-h"><div><b>' + esc(name(b)) + '</b><small>' + b.ref + ' · ' + b.room + ' · ' + D.fmt(b.checkin) + ' → ' + D.fmt(b.checkout) + '</small></div><span style="display:flex;gap:6px;align-items:center">' + pill(b) + '<button class="bob ghost" type="button" data-open="' + b.ref + '">Booking</button><button class="bob quiet m-back" type="button" id="m-back">Back</button></span></div>' +
      '<div class="conv-b" id="conv-b">' + th.map(function (x) { return '<div class="msg ' + (x.from === 'desk' ? 'me' : 'them') + '">' + esc(x.text) + '<small>' + (x.from === 'desk' ? 'Front desk' + (x.tpl ? ' · template' : '') : esc(b.guest.first)) + ' · ' + new Date(x.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</small></div>'; }).join('') + '</div>' +
      '<div class="conv-f"><div class="tpls" role="group" aria-label="Templates">' + TD.templates.map(function (t) { return '<button type="button" class="fchip" data-tpl="' + t.id + '" title="' + esc(t.when) + '">' + esc(t.name) + '</button>'; }).join('') + '</div><label class="sr" for="reply">Reply</label><textarea id="reply" placeholder="Reply to ' + esc(b.guest.first) + '… (⌘↵ to send)"></textarea><div class="bar"><span class="small muted">Goes out by email and WhatsApp, and appears in the guest’s My booking.</span><button class="bob lamp" type="button" id="send">Send</button></div></div>';
    var cb = $('#conv-b'); cb.scrollTop = cb.scrollHeight;
    $('#m-back').onclick = function () { msgOpen = false; R.messages(); };
    $$('[data-tpl]', box).forEach(function (t) { t.onclick = function () { $('#reply').value = TD.fill(t.dataset.tpl, b); $('#reply').dataset.tpl = t.dataset.tpl; $('#reply').focus(); }; });
    function send() { var v = $('#reply').value.trim(); if (!v) { $('#reply').focus(); return; } TD.addMessage(b.ref, 'desk', v, $('#reply').dataset.tpl || null); TD.updateBooking(b.ref, function () {}, 'Message sent by ' + ME); ui.toast('Sent to ' + b.guest.first); var m2 = TD.messages(), next = Object.keys(m2).filter(function (r) { var l = m2[r][m2[r].length - 1]; return l.from === 'guest' && !l.read; })[0]; if (msgUnread && next) msgRef = next; R.messages(); }
    $('#send').onclick = send; $('#reply').onkeydown = function (e) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); };
    wireOpen(box);
  }

  // =====================================================================================
  // CONVERSATIONS: the concierge inbox (website chat + WhatsApp) and its leads
  // =====================================================================================
  var chatId = null, inboxTab = 'chats', chatFilter = 'all', chatOpen = false;
  var CST = { bot: ['Concierge', 'ok'], waiting: ['Waiting', 'warn'], human: ['With you', 'lamp'], resolved: ['Resolved', ''] };
  var LINT = { availability: 'Availability and rates', experience: 'Experience booked', booking_lookup: 'Booking lookup', booking_change: 'Change requested', event_enquiry: 'Wedding or offsite', getting_here: 'Transfer request', handover: 'Asked for a person' };
  R.inbox = function () {
    if (!orbitReady) { view.innerHTML = '<div class="skel skrow"></div><div class="skel skrow"></div><div class="skel skrow" style="width:70%"></div>'; loadOrbit(function () { if (cur === 'inbox') R.inbox(); counts(); }); return; }
    var O = window.Orbit, cv = O.convos.list().filter(function (c) { return c.agent === 'resort' && (c.engaged || c.status !== 'bot'); });
    var L = O.leads.list({ agent: 'resort' }).slice().sort(function (a, b) { return Date.parse(b.timestamp) - Date.parse(a.timestamp); });
    var cnt = { all: cv.length, waiting: 0, human: 0, bot: 0, resolved: 0 }; cv.forEach(function (c) { cnt[c.status] = (cnt[c.status] || 0) + 1; });
    var head = '<div class="vh"><div><h2>Conversations</h2><p>The lantern concierge answers first on the website and WhatsApp; whatever it hands over waits here with the whole chat. ' + Math.round(cv.filter(function (c) { return !c.handoverReason; }).length / Math.max(1, cv.length) * 100) + '% handled without a person this week.</p></div><span style="display:flex;gap:6px"><a class="bob ghost" href="index.html" target="_blank" rel="noopener">Open the website chat</a>' + (cnt.waiting ? '<button class="bob lamp" type="button" id="next-wait">Next waiting</button>' : '') + '</span></div>';
    var tabs = '<div class="tbar"><button type="button" class="fchip" aria-pressed="' + (inboxTab === 'chats') + '" data-it="chats">Inbox <em>' + cv.length + '</em></button><button type="button" class="fchip" aria-pressed="' + (inboxTab === 'leads') + '" data-it="leads">Leads from chat <em>' + L.length + '</em></button></div>';
    if (inboxTab === 'leads') {
      view.innerHTML = head + tabs + '<div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">When</th><th scope="col">Who</th><th scope="col">What</th><th scope="col">Details</th><th scope="col">Came from</th><th scope="col"><span class="sr">Actions</span></th></tr></thead><tbody>' + (L.length ? L.map(function (l) { var p = l.payload || {}; var det = Object.keys(p).filter(function (k) { return k !== 'convo' && k !== 'section' && p[k] !== '' && p[k] != null; }).map(function (k) { return p[k]; }).join(' · '); return '<tr><td>' + ago(l.timestamp) + '</td><td><b>' + esc(l.name || 'Website visitor') + '</b></td><td>' + esc(LINT[l.intent] || l.intent) + '</td><td style="white-space:normal;max-width:380px">' + esc(det) + '</td><td>' + esc(l.source || l.channel) + '</td><td>' + (p.convo ? '<button class="bob ghost" type="button" data-tr="' + esc(p.convo) + '">Transcript</button>' : '') + '</td></tr>'; }).join('') : '<tr><td colspan="6"><div class="empty"><b>No leads yet.</b>Every flow the concierge completes arrives here with its transcript.</div></td></tr>') + '</tbody></table></div>';
      $$('[data-it]', view).forEach(function (b) { b.onclick = function () { inboxTab = b.dataset.it; R.inbox(); }; });
      $$('[data-tr]', view).forEach(function (b) { b.onclick = function () { chatId = b.dataset.tr; inboxTab = 'chats'; chatFilter = 'all'; chatOpen = true; R.inbox(); }; });
      return;
    }
    var list = cv.filter(function (c) { return chatFilter === 'all' || c.status === chatFilter; });
    if (!chatId || !list.some(function (c) { return c.id === chatId; })) chatId = (list.filter(function (c) { return c.status === 'waiting'; })[0] || list[0] || {}).id || null;
    var html = head + tabs + '<div class="inbox' + (chatOpen ? ' reading' : '') + '"><div class="threads"><div class="tbar" style="padding:8px;margin:0;border-bottom:1px solid var(--line-2)">' + [['all', 'All'], ['waiting', 'Waiting'], ['human', 'With you'], ['bot', 'Concierge'], ['resolved', 'Done']].map(function (f) { return '<button type="button" class="fchip" data-cf="' + f[0] + '" aria-pressed="' + (chatFilter === f[0]) + '">' + f[1] + ' <em>' + (cnt[f[0]] || 0) + '</em></button>'; }).join('') + '</div>' +
      (list.length ? list.map(function (c) { var u = c.user && c.user.name || 'Website visitor', lu = c.messages.filter(function (m) { return m.from === 'user'; }).slice(-1)[0] || c.messages.slice(-1)[0] || {}; var w = c.status === 'waiting'; return '<button type="button" class="thr' + (w ? ' unread' : '') + '" data-c="' + c.id + '" aria-current="' + (c.id === chatId) + '"><span class="av sm' + (w ? '' : ' g') + '" aria-hidden="true">' + ini(u) + '</span><b>' + esc(u) + '</b><small>' + ago(c.updatedAt) + '</small><p>' + esc(String(lu.text || '').replace(/\*\*/g, '')) + '</p><span class="meta"><span class="pill ' + CST[c.status][1] + '">' + CST[c.status][0] + '</span><small>' + (c.channel === 'whatsapp' ? 'WhatsApp' : 'Website') + ' · ' + esc(c.source || '') + '</small></span></button>'; }).join('') : '<div class="empty"><b>Nothing here.</b>When the concierge hands a chat over, it waits in this list.</div>') + '</div><div class="conv" id="cconv"></div><aside class="ctx" id="cctx" aria-label="About this visitor"></aside></div>';
    view.innerHTML = html;
    $$('[data-it]', view).forEach(function (b) { b.onclick = function () { inboxTab = b.dataset.it; R.inbox(); }; });
    $$('[data-cf]', view).forEach(function (b) { b.onclick = function () { chatFilter = b.dataset.cf; R.inbox(); }; });
    $$('.thr[data-c]', view).forEach(function (t) { t.onclick = function () { chatId = t.dataset.c; chatOpen = true; R.inbox(); }; });
    var nw = $('#next-wait'); if (nw) nw.onclick = function () { var w = cv.filter(function (c) { return c.status === 'waiting'; })[0]; if (w) { chatId = w.id; chatFilter = 'all'; chatOpen = true; R.inbox(); } };
    chatView(L);
  };
  function chatView(L) {
    var O = window.Orbit, box = $('#cconv'), cx = $('#cctx'); if (!box) return; var c = chatId && O.convos.get(chatId);
    if (!c) { box.innerHTML = '<div class="empty"><b>Pick a conversation.</b>Waiting chats are at the top.</div>'; cx.innerHTML = ''; return; }
    var u = c.user && c.user.name || 'Website visitor', lead = L.filter(function (l) { return l.payload && l.payload.convo === c.id; });
    var msgs = c.messages.map(function (m) {
      var cls = m.from === 'user' ? 'them' : m.from === 'agent' ? 'me' : m.kind === 'system' || m.from === 'system' ? 'sys' : 'bot';
      var cards = (m.cards || []).map(function (k) { return '<span>' + esc(k.title) + (k.price ? ' · ' + esc(k.price) : '') + '</span>'; }).join('');
      return '<div class="msg ' + cls + '">' + esc(String(m.text || '').replace(/\*\*/g, '')) + (cards ? '<span class="cards">' + cards + '</span>' : '') + '<small>' + (m.from === 'user' ? esc(u) : m.from === 'agent' ? esc(m.name || ME) : 'Concierge') + ' · ' + hm(m.ts) + '</small></div>';
    }).join('');
    var bar = c.status === 'waiting' ? '<div class="waitbar"><span><b>Waiting ' + ago(c.handoverAt || c.updatedAt) + '</b> · ' + esc(c.handoverReason || 'Asked for a person') + '</span><button class="bob lamp" type="button" id="c-take">Take over <kbd>T</kbd></button></div>' : '';
    box.innerHTML = '<div class="conv-h"><div><b>' + esc(u) + '</b><small>' + (c.channel === 'whatsapp' ? 'WhatsApp' : 'Website chat') + ' · ' + esc(c.source || '') + (c.context && c.context.page ? ' · on ' + esc(c.context.page) : '') + '</small></div><span style="display:flex;gap:6px;align-items:center"><span class="pill ' + CST[c.status][1] + '">' + CST[c.status][0] + '</span><button class="bob quiet m-back" type="button" id="c-back">Back</button><button class="more" type="button" id="c-more" aria-label="More">⋯</button></span></div>' + bar +
      '<div class="conv-b" id="cconv-b" aria-live="polite">' + msgs + '</div>' +
      '<div class="conv-f">' + (c.status === 'human' ? '<label class="sr" for="c-reply">Reply</label><textarea id="c-reply" placeholder="Reply as ' + ME + '… (⌘↵ to send)"></textarea><div class="bar"><span class="small muted">The visitor sees your name; the concierge stays quiet while you are here.</span><span style="display:flex;gap:6px"><button class="bob ghost" type="button" id="c-hand">Hand back</button><button class="bob ghost" type="button" id="c-res">Resolve</button><button class="bob lamp" type="button" id="c-send">Send</button></span></div>' : c.status === 'resolved' ? '<div class="bar"><span class="small muted">Resolved. Reopen to reply.</span><button class="bob ghost" type="button" id="c-reopen">Reopen</button></div>' : c.status === 'bot' ? '<div class="bar"><span class="small muted">The concierge is handling this chat.</span><button class="bob ghost" type="button" id="c-take2">Join the chat</button></div>' : '<div class="bar"><span class="small muted">Take over to reply.</span></div>') + '</div>';
    var cb = $('#cconv-b'); cb.scrollTop = cb.scrollHeight;
    $('#c-back').onclick = function () { chatOpen = false; R.inbox(); };
    function take() { O.convos.setStatus(c.id, 'human', { takenBy: ME }); O.convos.append(c.id, { from: 'system', kind: 'system', text: ME + ' from the front desk joined the chat.' }); R.inbox(); counts(); setTimeout(function () { var r = $('#c-reply'); r && r.focus(); }, 30); }
    var tk = $('#c-take'); if (tk) tk.onclick = take; var tk2 = $('#c-take2'); if (tk2) tk2.onclick = take;
    var ro = $('#c-reopen'); if (ro) ro.onclick = function () { O.convos.setStatus(c.id, 'human'); R.inbox(); };
    var sd = $('#c-send'); if (sd) { var send = function () { var v = $('#c-reply').value.trim(); if (!v) { $('#c-reply').focus(); return; } O.convos.append(c.id, { from: 'agent', name: ME, text: v }); R.inbox(); setTimeout(function () { var r = $('#c-reply'); r && r.focus(); }, 20); }; sd.onclick = send; $('#c-reply').onkeydown = function (e) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }; }
    var hd = $('#c-hand'); if (hd) hd.onclick = function () { O.convos.append(c.id, { from: 'system', kind: 'system', text: 'The concierge is back. ' + ME + ' is a message away if you need her.' }); O.convos.setStatus(c.id, 'bot'); R.inbox(); ui.toast('Handed back to the concierge'); };
    var rs = $('#c-res'); if (rs) rs.onclick = function () { O.convos.setStatus(c.id, 'resolved'); R.inbox(); counts(); ui.toast('Resolved', 'Undo', function () { O.convos.setStatus(c.id, 'human'); R.inbox(); counts(); }); };
    $('#c-more').onclick = function () { popMenu(this, [{ t: 'Continue on WhatsApp', fn: function () { O.convos.append(c.id, { from: 'system', kind: 'system', text: 'Moved to WhatsApp so ' + u.split(' ')[0] + ' can reply from their phone.' }); ui.toast('A WhatsApp link was sent to the visitor'); R.inbox(); } }, { t: 'Create a booking from this chat', fn: function () { newBooking(); } }, { t: 'Mark resolved', fn: function () { O.convos.setStatus(c.id, 'resolved'); R.inbox(); counts(); } }]); };
    var ctx = c.context || {};
    cx.innerHTML = '<div><h3>Visitor</h3><dl><dt>Name</dt><dd>' + esc(u) + '</dd>' + (c.user && c.user.email ? '<dt>Email</dt><dd>' + esc(c.user.email) + '</dd>' : '') + '<dt>Came from</dt><dd>' + esc(c.source || '—') + '</dd><dt>Was on</dt><dd>' + esc(ctx.page || 'home') + '</dd><dt>Started</dt><dd>' + hm(c.startedAt) + '</dd><dt>Messages</dt><dd>' + c.messages.length + '</dd></dl></div>' +
      '<div><h3>From this chat</h3>' + (lead.length ? lead.map(function (l) { var p = l.payload || {}; return '<div class="row"><div><b>' + esc(LINT[l.intent] || l.intent) + '</b><small>' + esc(Object.keys(p).filter(function (k) { return k !== 'convo' && k !== 'section'; }).map(function (k) { return p[k]; }).join(' · ')) + '</small></div></div>'; }).join('') : '<p class="muted small" style="margin:0">No lead yet.</p>') + '</div>' +
      '<div><h3>Shortcuts</h3><p class="muted small" style="margin:0"><kbd>T</kbd> take over · <kbd>⌘↵</kbd> send</p></div>';
  }
  document.addEventListener('keydown', function (e) { if (cur === 'inbox' && (e.key === 't' || e.key === 'T') && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !$('.sheet')) { var b = $('#c-take'); if (b) { e.preventDefault(); e.stopImmediatePropagation(); b.click(); } } }, true);

  // =====================================================================================
  // WEDDINGS AND OFFSITES (pipeline)
  // =====================================================================================
  var STAGES = ['New', 'Site visit', 'Proposal sent', 'Won', 'Lost'];
  R.enquiries = function () {
    var l = TD.enquiries(), won = l.filter(function (e) { return e.stage === 'Won'; }).length;
    view.innerHTML = '<div class="vh"><div><h2>Weddings and offsites</h2><p>' + l.length + ' enquiries · ' + won + ' won. Drag a card to change its stage, or open it.</p></div><button class="bob lamp" type="button" id="eq-new">New enquiry</button></div><div class="kan">' + STAGES.map(function (s) {
      var c = l.filter(function (e) { return e.stage === s; });
      return '<section class="col" data-stage="' + s + '" aria-label="' + s + '"><h3>' + s + '<span>' + c.length + '</span></h3>' + c.map(function (e) { return '<button type="button" class="eq" draggable="true" data-id="' + e.id + '">' + (e.chat && s === 'New' ? '<span class="new">FROM THE CONCIERGE</span>' : e.web && s === 'New' ? '<span class="new">FROM THE WEBSITE</span>' : '') + '<b>' + esc(e.name) + '</b><small>' + esc(e.kind) + (e.org ? ' · ' + esc(e.org) : '') + '</small><span>' + e.guests + ' guests · ' + esc(e.dates) + '</span><small>' + esc(e.budget) + ' · ' + esc(e.venue) + '</small></button>'; }).join('') + (c.length ? '' : '<p class="muted small" style="padding:4px">Nothing here.</p>') + '</section>';
    }).join('') + '</div>';
    $('#eq-new').onclick = newEnquiry;
    var dragId = null;
    $$('.eq', view).forEach(function (c) { c.addEventListener('dragstart', function (e) { dragId = c.dataset.id; e.dataTransfer.setData('text/plain', dragId); }); c.onclick = function () { openEnq(c.dataset.id); }; });
    $$('.col', view).forEach(function (col) { col.addEventListener('dragover', function (e) { e.preventDefault(); col.classList.add('over'); }); col.addEventListener('dragleave', function () { col.classList.remove('over'); }); col.addEventListener('drop', function (e) { e.preventDefault(); col.classList.remove('over'); move(e.dataTransfer.getData('text/plain') || dragId, col.dataset.stage); }); });
  };
  function move(id, stage) { var l = TD.enquiries(), e = l.filter(function (x) { return x.id === id; })[0]; if (!e || e.stage === stage) return; var from = e.stage; e.stage = stage; TD.saveEnquiries(l); R.enquiries(); counts(); ui.toast(e.name + ' → ' + stage, 'Undo', function () { e.stage = from; TD.saveEnquiries(l); R.enquiries(); counts(); }); }
  function openEnq(id) {
    var e = TD.enquiries().filter(function (x) { return x.id === id; })[0];
    ui.sheet(e.name, '<div class="rec-sum"><span class="chipx">' + e.id + '</span><span class="chipx">' + esc(e.kind) + '</span><span class="chipx">received ' + D.fmt(e.created) + '</span>' + (e.chat ? '<span class="pill lamp">From the concierge</span>' : '') + '</div><div class="remark" style="margin:14px 0"><small>What they wrote</small>' + esc(e.note) + '</div><div class="kvs"><div><span>Guests</span><b>' + e.guests + '</b></div><div><span>Dates</span><b>' + esc(e.dates) + '</b></div><div><span>Budget</span><b>' + esc(e.budget) + '</b></div><div><span>Venue</span><b>' + esc(e.venue) + '</b></div>' + (e.org ? '<div><span>Company</span><b>' + esc(e.org) + '</b></div>' : '') + (e.email ? '<div><span>Email</span><b>' + esc(e.email) + '</b></div>' : '') + '</div><label class="field"><span>Stage</span><select id="eq-st">' + STAGES.map(function (s) { return '<option' + (s === e.stage ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label><p class="small muted" style="margin-top:12px">Next step: ' + ({ New: 'reply within a working day with dates and a first budget.', 'Site visit': 'confirm the visit and hold a Ridge Cottage for the night.', 'Proposal sent': 'follow up in 3 days; offer a call with the chef.', Won: 'send the contract and the 50% advance link.', Lost: 'note why, and send the monsoon offer next year.' }[e.stage]) + '</p>', '<span></span><button class="bob lamp" type="button" id="eq-save">Save</button>', function (sh) { $('#eq-save', sh).onclick = function () { ui.closeSheet(true); move(e.id, $('#eq-st', sh).value); }; });
  }

  // =====================================================================================
  // RATES
  // =====================================================================================
  R.rates = function () {
    var days = Array.from({ length: 30 }, function (_, i) { return D.add(today, i); });
    view.innerHTML = '<div class="vh"><div><h2>Rate calendar</h2><p>Per cottage per night, breakfast included, before GST. Amber means a rule lifted the rate; hover a night to see which.</p></div></div><div class="panel" style="overflow:auto" tabindex="0" role="region" aria-label="Rate calendar, scrolls sideways"><table class="rt"><thead><tr><th>Cottage</th>' + days.map(function (d) { return '<th>' + D.parse(d).toLocaleDateString('en-IN', { weekday: 'narrow', timeZone: 'UTC' }) + '<br>' + D.parse(d).getUTCDate() + '</th>'; }).join('') + '</tr></thead><tbody>' +
      TD.types.map(function (t) { return '<tr><td><b>' + esc(t.plural) + '</b><br><small class="muted">base ' + TD.inr(t.base) + '</small></td>' + days.map(function (d) { var r = TD.nightly(t.id, d), a = TD.availOn(t.id, d); return '<td class="' + (TD.isWeekend(d) ? 'we ' : '') + (r > t.base ? 'up ' : '') + (a ? '' : 'full') + '" title="' + esc(TD.rateWhy(t.id, d).join(' · ')) + ' · ' + a + ' free">' + (r / 1000).toFixed(1) + 'k<br><small class="muted">' + a + '/' + t.rooms.length + '</small></td>'; }).join('') + '</tr>'; }).join('') +
      '<tr><td><b>Resort</b><br><small class="muted">rooms sold</small></td>' + days.map(function (d) { var o = TD.occupancy(d); return '<td class="' + (o >= 0.75 ? 'up' : '') + '">' + Math.round(o * 13) + '</td>'; }).join('') + '</tr></tbody></table></div>' +
      '<div class="sect"><div class="sect-h"><h3>How rates move</h3></div><div class="list">' + TD.seasons.slice(0, -1).map(function (s) { return '<div class="row"><div><b>' + esc(s.name) + '</b><small>' + s.from + ' to ' + s.to + (s.minStay > 1 ? ' · minimum ' + s.minStay + ' nights' + (s.weekendsOnly ? ' on weekends' : '') : '') + '</small></div><b>× ' + s.k + '</b></div>'; }).join('') + '<div class="row"><div><b>Friday and Saturday</b></div><b>× ' + TD.pricing.weekend + '</b></div><div class="row"><div><b>Festivals and long weekends</b><small>' + Object.keys(TD.holidays).filter(function (d) { return d >= today; }).slice(0, 4).map(function (d) { return TD.holidays[d] + ' ' + D.fmt(d); }).join(' · ') + '</small></div><b>× 1.2</b></div><div class="row"><div><b>Busy night</b><small>75% or more of the resort sold</small></div><b>× ' + TD.pricing.occUplift + '</b></div><div class="row"><div><b>Length of stay</b><small>3+ nights 10% off · 5+ nights 15% off</small></div><b>−10–15%</b></div></div></div>';
  };

  // =====================================================================================
  // ⌘K palette and shortcuts
  // =====================================================================================
  var pal = $('#pal'), pi = $('#pal-i'), pl = $('#pal-l'), items = [], pix = 0;
  function openPal() { pal.hidden = false; pi.value = ''; search(); pi.focus(); }
  function closePal() { pal.hidden = true; }
  function search() {
    var q = pi.value.trim().toLowerCase();
    var acts = Object.keys(VIEWS).map(function (v) { return { t: 'Go to ' + VIEWS[v], s: 'View', fn: function () { location.hash = v; } }; }).concat([{ t: 'New booking', s: 'N', fn: newBooking }, { t: 'Book an experience place', s: 'Action', fn: newSlot }, { t: 'New wedding or offsite enquiry', s: 'Action', fn: newEnquiry }, { t: 'Start fresh', s: 'Action', fn: function () { $('#reset').click(); } }, { t: 'Open the website', s: 'Link', fn: function () { location.href = 'index.html'; } }]);
    var bks = q.length > 1 ? TD.bookings().filter(function (b) { return (b.ref + ' ' + name(b) + ' ' + b.room).toLowerCase().indexOf(q) >= 0; }).slice(0, 8).map(function (b) { return { t: name(b) + ' · ' + b.room, s: b.ref + ' · ' + D.fmt(b.checkin), fn: function () { openBooking(b.ref); } }; }) : [];
    items = bks.concat(acts.filter(function (a) { return !q || a.t.toLowerCase().indexOf(q) >= 0; })); pix = 0; paintPal();
  }
  function paintPal() { pl.innerHTML = items.map(function (it, i) { return '<li role="option" aria-selected="' + (i === pix) + '" data-i="' + i + '"><span>' + esc(it.t) + '</span><small>' + esc(it.s) + '</small></li>'; }).join('') || '<li><span class="muted">No matches</span></li>'; }
  pi.addEventListener('input', search);
  pi.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { pix = Math.min(items.length - 1, pix + 1); paintPal(); e.preventDefault(); } else if (e.key === 'ArrowUp') { pix = Math.max(0, pix - 1); paintPal(); e.preventDefault(); } else if (e.key === 'Enter' && items[pix]) { closePal(); items[pix].fn(); } else if (e.key === 'Escape') closePal(); });
  pl.addEventListener('click', function (e) { var li = e.target.closest('li[data-i]'); if (li) { closePal(); items[+li.dataset.i].fn(); } });
  pal.addEventListener('click', function (e) { if (e.target === pal) closePal(); });
  $('#open-k').onclick = openPal; $('#open-k2').onclick = openPal;
  var KEYS = { h: 'home', d: 'arrivals', p: 'payments', c: 'tape', b: 'bookings', i: 'inbox', m: 'messages', x: 'roster', e: 'enquiries', r: 'rates' };
  $('#keys').onclick = function () { ui.sheet('Keyboard shortcuts', '<div class="kvs" style="margin-top:14px"><div><span>Search or jump</span><b><kbd>⌘K</kbd> or <kbd>/</kbd></b></div><div><span>New booking</span><b><kbd>N</kbd></b></div>' + Object.keys(KEYS).map(function (k) { return '<div><span>' + VIEWS[KEYS[k]] + '</span><b><kbd>' + k.toUpperCase() + '</kbd></b></div>'; }).join('') + '<div><span>Take over a waiting chat</span><b><kbd>T</kbd></b></div><div><span>Send a reply</span><b><kbd>⌘↵</kbd></b></div></div>'); };
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (pal.hidden) openPal(); else closePal(); return; }
    if (!pal.hidden || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || $('.sheet') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '/') { e.preventDefault(); openPal(); } else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); newBooking(); } else if (e.key === '?') $('#keys').click(); else if (KEYS[e.key]) location.hash = KEYS[e.key];
  });

  route();
  var idleLoad = function () { loadOrbit(function () { counts(); }); }; if ('requestIdleCallback' in window) requestIdleCallback(idleLoad, { timeout: 3000 }); else setTimeout(idleLoad, 1500);
  addEventListener('storage', function (e) { if (!e.key) return; if (e.key.indexOf('taradhura:') === 0) { TD.invalidate(); location.reload(); } else if (e.key === 'orbit-convos' || e.key === 'orbit-leads') { if (window.Orbit) Orbit.convos.reload(); if (cur === 'inbox' || cur === 'home') route(); else counts(); } });
})();
