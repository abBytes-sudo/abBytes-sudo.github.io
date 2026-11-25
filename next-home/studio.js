/* The product configurator. Four steps on the left (business, modules, theme, team and automations) drive a working app preview on the
   right: a sidebar you can click, a home screen that is different for every trade, modules that affect each other, roles, automations
   that fire in front of you, five real themes, a phone view, an architecture view, and a spec you can share or send. Plain DOM. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, W = window.WORK, $ = function (s) { return d.querySelector(s); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function E(tag, cls, txt) { var e = d.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; }
  function B(txt, cls, fn) { var b = E('button', cls, txt); b.type = 'button'; b.addEventListener('click', fn); return b; }
  function A(p) { for (var i = 1; i < arguments.length; i++) if (arguments[i]) p.appendChild(arguments[i]); return p; }
  var PACK = {
    property: { n: 'Property', st: ['Enquiry', 'Site visit', 'Won'], k: ['New enquiries', 'Visits booked'], cal: 'Site visits', stT: 'Homes available', unit: ' L',
      cards: [['Mehra family', '3 BHK · Vasant Vihar', 18], ['R. Kapoor', 'Office · Saket', 42], ['Anita S.', '2 BHK · rent', 6], ['D. Bose', 'Plot · Gurugram', 95]],
      stock: [['3 BHK, Tower A', 6, 12], ['2 BHK, Tower B', 9, 14], ['Shops, ground floor', 3, 8]], bot: 'Hello! Buying or renting?',
      qr: [['3 BHK to rent under ₹1.5 lakh', 'Four homes match, in Vasant Vihar and Saket. Shall I book a visit?', ['Web chat lead', '3 BHK · rent', 9]], ['Book a site visit', 'Done. Saturday, 11 am is held for you.', ['Visit request', 'Tower A · Sat', 14]]], like: ['recrm', 'reweb', 'estate', 'launch'] },
    build: { n: 'Construction', st: ['Enquiry', 'Quote sent', 'Won'], k: ['New enquiries', 'Quotes out'], cal: 'Site surveys', stT: 'On hand', unit: ' L',
      cards: [['Villa, Sainik Farm', 'Full interiors', 38], ['Café fit-out', 'Hauz Khas', 12], ['Arora residence', 'Kitchen, wardrobes', 7], ['Office, 4th floor', 'Design-build', 64]],
      stock: [['Plywood, 18 mm', 140, 200], ['Tiles, 600 × 600', 520, 900], ['Site teams free', 2, 5]], bot: 'Hello! What are you building?',
      qr: [['Price for a modular kitchen?', 'Most come to ₹2.4 to 4 lakh. Want a line-by-line quote?', ['Quote request', 'Modular kitchen', 3]], ['Book a site survey', 'Booked. The surveyor will call an hour before.', ['Survey request', 'Flat · Dwarka', 9]]], like: ['interp', 'studio', 'quotes', 'build', 'masonry', 'interior'] },
    retail: { n: 'Retail', st: ['In cart', 'Paid', 'Delivered'], k: ['Open carts', 'Paid orders'], cal: 'Store pickups', stT: 'In stock', unit: 'K',
      cards: [['Order 1042', 'Harbor jacket × 1', 8], ['Order 1043', 'Linen shirt × 2', 5], ['Order 1044', 'Tote and scarf', 4], ['Order 1045', 'Wool coat', 14]],
      stock: [['Harbor jacket', 14, 40], ['Linen shirt', 31, 60], ['Wool coat', 5, 20]], bot: 'Hi! Need help with an order?',
      qr: [['Is the wool coat in a medium?', 'Yes, five left in medium. Shall I hold one?', ['Chat order', 'Wool coat · M', 14]], ['Where is my order?', 'Out for delivery, arriving today by 6 pm.', ['Returning customer', 'Asked about tracking', 3]]], like: ['store', 'orders', 'watch', 'revv', 'stockroom'] },
    stay: { n: 'Hospitality', st: ['Enquiry', 'Held', 'Booked'], k: ['New enquiries', 'Rooms held'], cal: 'Tables and tours', stT: 'Free tonight', unit: 'K',
      cards: [['Iyer, 2 nights', 'Ridge room', 22], ['Wedding party', '14 rooms', 180], ['Sen, weekend', 'Valley suite', 31], ['Company offsite', '3 nights', 240]],
      stock: [['Ridge rooms', 4, 10], ['Valley suites', 2, 6], ['Dinner tables', 7, 16]], bot: 'Namaste! When are you visiting?',
      qr: [['Any rooms this weekend?', 'Two ridge rooms are free, ₹11,000 a night. Hold one?', ['Chat enquiry', 'Ridge room · weekend', 22]], ['A table for four tonight', 'Held for 8 pm.', ['Dinner guest', 'Table for 4', 4]]], like: ['resort', 'saas', 'store'] },
    service: { n: 'Services', st: ['Enquiry', 'Trial', 'Member'], k: ['New enquiries', 'Trials booked'], cal: 'Trial sessions', stT: 'Spots left', unit: 'K',
      cards: [['Kabir', 'Strength · 3 months', 12], ['Naina', 'HYROX prep', 18], ['Dr Rao', 'Morning batch', 9], ['Team of 6', 'Company plan', 54]],
      stock: [['6 am strength', 3, 14], ['7 pm HYROX', 5, 16], ['Sunday open gym', 9, 20]], bot: 'Hey! Want to try a class?',
      qr: [['What does a trial cost?', 'Your first class is free. Shall I book one?', ['Chat lead', 'Free trial', 12]], ['Book me in for 7 pm', 'You are in. Bring water and a towel.', ['Trial booked', '7 pm HYROX', 12]]], like: ['boxx', 'gym', 'saas', 'work', 'crm'] }
  };
  /* what makes each trade its own product: the home screen, the default modules, the words */
  var TR = {
    property: { home: 'Listings map', def: 'pipe cal chat field rep', pipe: 'Enquiries', cal: 'Site visits', stock: 'Units', book: 'Site visit', pins: [['3 BHK · Vasant Vihar', '₹1.4 L a month', 24, 30], ['2 BHK · Saket', '₹65 K a month', 58, 22], ['Office · GK II', '₹2.1 L a month', 74, 58], ['Plot · Gurugram', '₹95 L', 18, 70], ['Shop · Hauz Khas', '₹1.2 L a month', 44, 54]] },
    build: { home: 'Projects', def: 'pipe stock inv field rep', pipe: 'Quotes', cal: 'Site surveys', stock: 'Materials', book: 'Survey', proj: [['Villa, Sainik Farm', 0, 6], ['Café fit-out', 2, 4], ['Arora residence', 3, 3], ['Office, 4th floor', 1, 7]] },
    retail: { home: 'Today', def: 'stock inv chat rep portal', pipe: 'Orders', cal: 'Pickups', stock: 'Inventory', book: 'Pickup', price: [8, 5, 14] },
    stay: { home: 'Tape chart', def: 'cal chat inv rep portal', pipe: 'Enquiries', cal: 'Bookings', stock: 'Rooms', book: 'Stay', rooms: ['Ridge 1', 'Ridge 2', 'Valley suite', 'Garden room'], held: [[0, 1, 3, 'Iyer'], [2, 0, 2, 'Sen'], [1, 4, 2, 'Rao']] },
    service: { home: 'Appointments', def: 'cal pipe inv chat rep', pipe: 'Enquiries', cal: 'Calendar', stock: 'Class spots', book: 'Appointment', slots: [['6:00 am', 'Kabir'], ['7:00 am', ''], ['8:00 am', 'Dr Rao'], ['5:00 pm', ''], ['6:00 pm', 'Naina'], ['7:00 pm', '']] }
  };
  var MODS = [['pipe', 'Leads & pipeline', 2], ['cal', 'Calendar & bookings', 1], ['stock', 'Inventory', 1.5], ['inv', 'Invoices & payments', 1.5], ['chat', 'WhatsApp assistant', 1.5], ['field', 'Field app', 2], ['rep', 'Reports', 1], ['portal', 'Customer portal', 1.5]];
  var THEMES = [['clean', 'Clean SaaS'], ['midnight', 'Midnight Pro'], ['boutique', 'Boutique'], ['bold', 'Bold'], ['soft', 'Soft']];
  var AUTOS = [['a1', 'When a booking is made', 'send a WhatsApp confirmation', 'create a follow-up task'], ['a2', 'When a deal is won', 'raise the invoice', 'reserve the stock'], ['a3', 'When stock runs low', 'alert the owner', 'draft a purchase order'], ['a4', 'When an invoice is overdue', 'send a polite reminder', 'flag it for the owner']];
  var ROLES = { owner: ['Owner', 0], sales: ['Sales', 'home pipe cal chat portal'], field: ['Field', 'field cal'] };
  var COLS = ['#6a3df0', '#2563eb', '#0d9f6e', '#e5482d', '#c98a00', '#d6249f'];
  var C = { name: '', trade: 'property', mods: {}, theme: 'clean', color: COLS[0], role: 'owner', autos: { a1: 1, a2: 1, a3: 0, a4: 0 }, dev: 'desk', view: 'app' }, scr = 'home', D, P, T, touched = false, seq = 104;
  var NAMES = ['S. Verma', 'Priya N.', 'Imran K.', 'Joshi & Sons', 'Meera T.', 'A. Fernandes'];
  var fr = $('#fr'), app = $('#app2'), toasts = $('#pvT'), cfg = $('#cfg');
  function money(v) { return '₹' + v + P.unit; }
  function defaults() { C.mods = {}; TR[C.trade].def.split(' ').forEach(function (m) { C.mods[m] = 1; }); }
  function reset() {
    P = PACK[C.trade]; T = TR[C.trade]; seq = 104;
    D = { cards: P.cards.map(function (c, i) { return { n: c[0], d: c[1], v: c[2], s: i === 3 ? 1 : 0 }; }), stock: P.stock.map(function (s) { return { n: s[0], q: s[1], of: s[2] }; }), invs: [{ id: 'INV-101', n: P.cards[2][0], v: P.cards[2][2], paid: 0, over: 1 }, { id: 'INV-100', n: P.cards[1][0], v: P.cards[1][2], paid: 1 }],
      ev: [], chat: [[0, P.bot]], qr: P.qr.slice(), tasks: 2, won: 0, paid: P.cards[1][2], fired: 0, bill: [], photos: ['Week 2 · slab poured', 'Week 1 · site cleared'], sel: 0, low: {}, held: (T.held || []).map(function (h) { return h.slice(); }), slots: (T.slots || []).map(function (s) { return s.slice(); }) };
  }
  /* ---- things that happen, and what they set off ---- */
  function fire(id, who) {
    var a = AUTOS.filter(function (x) { return x[0] === id; })[0], t = E('div', 'at'); D.fired++;
    A(t, E('b', '', a[1].replace('When ', '') + ': ' + who), E('span', '', '→ ' + a[2]), E('span', '', '→ ' + a[3])); toasts.appendChild(t); setTimeout(function () { t.remove(); }, reduce ? 3000 : 4600);
  }
  function note(txt) { var t = E('div', 'at n'); t.appendChild(E('b', '', txt)); toasts.appendChild(t); setTimeout(function () { t.remove(); }, 3000); }
  function invoice(n, v, paid) { if (!C.mods.inv) return; D.invs.unshift({ id: 'INV-' + (++seq), n: n, v: v, paid: paid ? 1 : 0 }); if (paid) D.paid += v; }
  function low() { D.stock.forEach(function (s) { if (s.q <= s.of * .3 && !D.low[s.n]) { D.low[s.n] = 1; if (C.autos.a3) fire('a3', s.n); else note('Low stock: ' + s.n); } }); }
  function book(who, what) {
    D.ev.unshift({ n: who, w: what, done: 0 }); var c = D.cards.filter(function (x) { return x.s === 0 && x.n === who; })[0]; if (c) c.s = 1;
    invoice(who, 6 + (who.length % 9), 0);
    if (C.autos.a1) { fire('a1', who); D.tasks++; if (C.mods.chat) D.chat.push([0, 'Confirmation sent to ' + who + ': ' + what + '.']); } else note(T.book + ' booked for ' + who + (C.mods.inv ? ' · invoice drafted' : ''));
    paint();
  }
  function win(c) { D.won += c.v; if (C.autos.a2) { invoice(c.n, c.v, 0); if (C.mods.stock && D.stock[0].q > 0) D.stock[0].q--; fire('a2', c.n); } else { invoice(c.n, c.v, 0); note('Won: ' + c.n + ', ' + money(c.v)); } low(); confetti(); }
  function pay(v) { v.paid = 1; v.over = 0; D.paid += v.v; note(v.id + ' paid · ' + money(v.v) + ' (test mode)'); paint(); }
  function confetti() {
    if (reduce) return; var r = fr.getBoundingClientRect(), i, c, a, q;
    for (i = 0; i < 22; i++) { c = E('i', 'cf'); a = Math.random() * 6.283; q = 60 + Math.random() * 150; c.style.left = r.left + r.width * .7 + 'px'; c.style.top = r.top + r.height * .45 + 'px'; c.style.background = [C.color, '#0e0c12', '#f4b556'][i % 3]; c.style.setProperty('--x', Math.cos(a) * q + 'px'); c.style.setProperty('--y', Math.sin(a) * q - 60 + 'px'); c.style.setProperty('--r', Math.random() * 720 - 360 + 'deg'); d.body.appendChild(c); setTimeout(function (n) { n.remove(); }, 1000, c); }
  }
  function who() { var c = D.cards.filter(function (x) { return x.s === 0; })[0]; return c ? c.n : NAMES[D.ev.length % NAMES.length]; }
  /* ---- screens ---- */
  function panel(t, sub) { var p = E('div', 'pn'); if (t) p.appendChild(E('h5', '', t)); if (sub) p.appendChild(E('p', 'mu', sub)); return p; }
  function rows(list, fn) { var ul = E('ul', 'ls'); list.forEach(function (x) { var li = E('li'); fn(li, x); ul.appendChild(li); }); return ul; }
  var HOME = {
    property: function (c) {
      var m = E('div', 'mapx'), s = T.pins[D.sel], info = panel(s[0], s[1] + ' · tap a pin to switch');
      T.pins.forEach(function (p, i) { var b = B('', 'pin' + (i === D.sel ? ' on' : ''), function () { D.sel = i; paint(); }); b.style.left = p[2] + '%'; b.style.top = p[3] + '%'; b.setAttribute('aria-label', p[0]); m.appendChild(b); });
      info.appendChild(B('Book a site visit for ' + who(), 'pb', function () { book(who(), 'site visit, ' + s[0]); })); A(c, m, info);
    },
    build: function (c) {
      var g = panel('Programme', 'Eight weeks · the line is today'), ph = panel('Site photo log');
      T.proj.forEach(function (p) { var r = E('div', 'gn'), tr = E('i'), b = E('b'); b.style.left = p[1] * 12.5 + '%'; b.style.width = p[2] * 12.5 + '%'; tr.appendChild(b); A(r, E('span', '', p[0]), tr); g.appendChild(r); });
      var tl = E('div', 'tiles'); D.photos.slice(0, 4).forEach(function (p, i) { var t = E('span', 'tile t' + i % 3, p); tl.appendChild(t); });
      A(ph, tl, B('Log a site photo', 'pb', function () { D.photos.unshift('Week 3 · ' + T.proj[D.photos.length % 4][0]); if (C.mods.portal) note('Client portal updated with the new photo'); paint(); })); A(c, g, ph);
    },
    retail: function (c) {
      var g = E('div', 'pos'), bill = panel('Bill', D.bill.length ? D.bill.map(function (i) { return D.stock[i].n; }).join(', ') : 'Tap items to add them'), tot = D.bill.reduce(function (s, i) { return s + T.price[i]; }, 0);
      D.stock.forEach(function (s, i) { var b = B('', 'posb', function () { if (s.q - D.bill.filter(function (x) { return x === i; }).length > 0) { D.bill.push(i); paint(); } }); A(b, E('b', '', s.n), E('span', '', money(T.price[i]) + ' · ' + s.q + ' left')); g.appendChild(b); });
      bill.appendChild(B(tot ? 'Charge ' + money(tot) + ' · test mode' : 'Nothing to charge yet', 'pb', function () { if (!tot) return; D.bill.forEach(function (i) { D.stock[i].q--; }); D.won += tot; invoice('Walk-in sale', tot, 1); D.bill = []; note('Sale ' + money(tot) + ' · stock updated'); low(); paint(); })); A(c, g, bill);
    },
    stay: function (c) {
      var t = E('div', 'tp'), days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; t.appendChild(E('span')); days.forEach(function (x) { t.appendChild(E('span', 'th', x)); });
      T.rooms.forEach(function (r, ri) { t.appendChild(E('span', 'rm', r)); days.forEach(function (x, di) { var h = D.held.filter(function (b) { return b[0] === ri && di >= b[1] && di < b[1] + b[2]; })[0], cell = h ? E('span', 'bk' + (di === h[1] ? ' s' : ''), di === h[1] ? h[3] : '') : B('', 'fc', function () { var n = NAMES[D.held.length % NAMES.length]; D.held.push([ri, di, Math.min(2, 7 - di), n.split(' ')[0]]); book(n, r + ', from ' + x); }); if (!h) cell.setAttribute('aria-label', 'Free: ' + r + ' ' + x); t.appendChild(cell); }); });
      A(c, A(panel('This week', 'Tap a free night to take a booking'), t));
    },
    service: function (c) {
      A(c, A(panel('Today', 'Tap a free slot to book the next enquiry in'), rows(D.slots, function (li, s) { A(li, E('b', '', s[0]), s[1] ? E('span', '', s[1]) : B('Book ' + who(), 'pb s', function () { var n = who(); s[1] = n; book(n, s[0]); })); })));
    }
  };
  var SCR = {
    home: function (c) { HOME[C.trade](c); },
    pipe: function (c) {
      var k = E('div', 'kb'); P.st.forEach(function (s, i) {
        var col = E('div', 'kcol'), l = D.cards.filter(function (x) { return x.s === i; }); col.dataset.s = i; col.appendChild(E('h6', '', s + ' · ' + l.length));
        l.forEach(function (x) { var e = E('div', 'kcard'); A(e, E('b', '', x.n), E('span', '', x.d), E('i', '', money(x.v))); if (i < 2) drag(e, x); col.appendChild(e); }); k.appendChild(col);
      });
      A(c, k, E('p', 'mu', 'Drag a card to the next stage. ' + D.tasks + ' follow-up tasks open.'));
    },
    cal: function (c) { var p = panel(T.cal, D.ev.length ? '' : 'Nothing booked yet. Book from “' + T.home + '”.'); p.appendChild(rows(D.ev.slice(0, 5), function (li, e) { A(li, E('b', '', e.n), E('span', '', e.w)); })); p.appendChild(B('+ Book ' + who(), 'pb', function () { book(who(), T.book.toLowerCase() + ', tomorrow 11 am'); })); c.appendChild(p); },
    stock: function (c) { var p = panel(T.stock, 'Anything at 30% or under is flagged'); D.stock.forEach(function (s) { var r = E('div', 'sk' + (s.q <= s.of * .3 ? ' lo' : '')), i = E('i'); i.style.setProperty('--w', s.q / s.of * 100 + '%'); A(r, E('span', '', s.n), E('b', '', s.q + ' of ' + s.of), i); if (s.q <= s.of * .3) r.appendChild(E('em', '', D.low[s.n] && C.autos.a3 ? 'Low · purchase order drafted' : 'Low stock')); p.appendChild(r); }); c.appendChild(p); },
    inv: function (c) {
      var p = panel('Invoices', ''); p.insertBefore(E('em', 'tm', 'Test mode · no real payments'), p.firstChild);
      p.appendChild(rows(D.invs.slice(0, 5), function (li, v) { A(li, E('b', '', v.id + ' · ' + v.n), v.paid ? E('span', 'ok', 'Paid ✓ ' + money(v.v)) : A(E('span', 'rw'), v.over ? E('em', '', C.autos.a4 ? 'Overdue · reminder sent ✓' : 'Overdue') : null, B('Mark ' + money(v.v) + ' paid', 'pb s', function () { pay(v); }))); })); c.appendChild(p);
    },
    chat: function (c) { var p = panel('WhatsApp assistant', 'Scripted replies, not AI. It answers at night and files the lead.'), m = E('div', 'bub'); D.chat.slice(-4).forEach(function (x) { m.appendChild(E('p', x[0] ? 'u' : '', x[1])); }); var q = E('div', 'qrs'); D.qr.forEach(function (x, i) { q.appendChild(B(x[0], 'pb s', function () { D.chat.push([1, x[0]], [0, x[1]]); D.qr.splice(i, 1); D.cards.unshift({ n: x[2][0], d: x[2][1], v: x[2][2], s: 0 }); note('New lead filed from WhatsApp'); paint(); })); }); A(p, m, q); c.appendChild(p); },
    field: function (c) { var ph = E('div', 'ph'); A(ph, E('h5', '', 'Today'), D.ev.length ? rows(D.ev.slice(0, 4), function (li, e) { A(li, E('b', '', e.n), e.done ? E('span', 'ok', 'On site ✓') : B('Check in', 'pb s', function () { e.done = 1; note('Checked in at ' + e.n + ' · office notified'); paint(); })); }) : E('p', 'mu', 'Nothing assigned yet. Book something from “' + T.home + '” and it lands here.')); A(c, E('p', 'mu', 'What the person on site sees on their phone:'), ph); },
    rep: function (c) {
      var p = panel('Pipeline'), g = E('div', 'ch'), mx = Math.max.apply(0, P.st.map(function (s, i) { return D.cards.filter(function (x) { return x.s === i; }).length; }).concat(1));
      P.st.forEach(function (s, i) { var n = D.cards.filter(function (x) { return x.s === i; }).length, b = E('div'), bar = E('i'); bar.style.height = n / mx * 100 + '%'; A(b, bar, E('b', '', n), E('span', '', s)); g.appendChild(b); }); p.appendChild(g);
      var k = E('div', 'kpi'); [['Won', money(D.won)], ['Paid', money(D.paid)], ['Due', money(D.invs.reduce(function (s, v) { return s + (v.paid ? 0 : v.v); }, 0))], ['Bookings', D.ev.length], ['Automations run', D.fired]].forEach(function (x) { k.appendChild(A(E('p'), E('b', '', x[1]), E('span', '', x[0]))); }); A(c, k, p);
    },
    portal: function (c) { var e = D.ev[0], v = D.invs.filter(function (x) { return !x.paid; })[0], p = panel('Hello, ' + (e ? e.n : v ? v.n : 'there'), 'What your customer sees when they log in'), st = E('ol', 'stp2'); [['Booked', !!e], ['Confirmed', !!e && !!C.autos.a1], ['Invoice sent', !!v || D.invs.length > 0], ['Paid', !v && D.invs.length > 0]].forEach(function (s) { st.appendChild(E('li', s[1] ? 'on' : '', s[0])); }); p.appendChild(st); if (v && C.mods.inv) p.appendChild(B('Pay ' + money(v.v) + ' · test mode', 'pb', function () { pay(v); })); c.appendChild(p); },
    arch: function (c) {
      var w = E('div', 'ar'), ids = MODS.filter(function (m) { return C.mods[m[0]]; }), n = ids.length, hub = E('b', 'hubn', (C.name || 'Your business').charAt(0).toUpperCase()); w.appendChild(hub);
      ids.forEach(function (m, i) { var a = i / n * 6.283 - 1.57, e = E('span', '', m[1]), l = E('i'); e.style.left = 50 + Math.cos(a) * 38 + '%'; e.style.top = 50 + Math.sin(a) * 36 + '%'; l.style.transform = 'rotate(' + a + 'rad)'; A(w, l, e); });
      A(c, w, E('p', 'mu', 'One database in the middle; every module reads and writes to it. ' + AUTOS.filter(function (a) { return C.autos[a[0]]; }).length + ' automations watch for events.'));
    }
  };
  function drag(el, x) {
    el.addEventListener('pointerdown', function (e) {
      if (e.button) return; e.preventDefault(); var r = el.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top, over = null, g = el.cloneNode(true);
      g.className = 'kcard drag ' + 'th-' + C.theme; g.style.width = r.width + 'px'; g.style.left = r.left + 'px'; g.style.top = r.top + 'px'; d.body.appendChild(g); el.style.opacity = .3;
      function mv(ev) { g.style.left = ev.clientX - ox + 'px'; g.style.top = ev.clientY - oy + 'px'; var c = d.elementFromPoint(ev.clientX, ev.clientY); c = c && c.closest('.kcol'); if (c !== over) { if (over) over.classList.remove('over'); over = c; if (c) c.classList.add('over'); } }
      function up() { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); g.remove(); if (over && +over.dataset.s > x.s) { x.s = +over.dataset.s; if (x.s === 2) win(x); } paint(); }
      addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    });
  }
  function screens() { var allow = ROLES[C.role][1], l = [['home', T.home]].concat(MODS.filter(function (m) { return C.mods[m[0]]; }).map(function (m) { return [m[0], T[m[0]] || m[1].replace('Leads & pipeline', 'Pipeline').replace(' & payments', '').replace(' & bookings', '')]; })); return allow ? l.filter(function (s) { return (' ' + allow + ' ').indexOf(' ' + s[0] + ' ') >= 0; }) : l; }
  function paint() {
    var list = screens(), sb = E('nav', 'ap-sb'), main = E('div', 'ap-main'), head = E('div', 'ap-h'), view = C.view === 'arch' ? 'arch' : list.some(function (s) { return s[0] === scr; }) ? scr : (scr = list[0][0]);
    A(sb, A(E('div', 'ap-brand'), E('i', 'ap-logo', (C.name || 'Y').charAt(0).toUpperCase()), E('b', '', C.name || 'Your business')));
    list.forEach(function (s) { var b = B(s[1], '', function () { scr = s[0]; C.view = 'app'; sync(); paint(); }); if (s[0] === view) b.setAttribute('aria-current', 'page'); sb.appendChild(b); });
    A(head, E('h4', '', view === 'arch' ? 'Architecture' : list.filter(function (s) { return s[0] === view; })[0][1]), A(E('span', 'ap-role'), E('i', '', ROLES[C.role][0].charAt(0)), d.createTextNode(ROLES[C.role][0] + ' view')));
    main.appendChild(head); SCR[view](main); app.textContent = ''; A(app, sb, main); $('#frUrl').textContent = (C.name ? C.name.toLowerCase().replace(/[^a-z0-9]+/g, '') : 'yourbusiness') + '.app/' + view; summary();
  }
  /* ---- the configurator ---- */
  function step(n, title) { var f = E('fieldset', 'stp'), l = E('legend'); A(l, E('b', '', n), d.createTextNode(title)); f.appendChild(l); cfg.appendChild(f); return f; }
  function group(parent, key, items, multi, fn) { var g = E('div', 'chips'); g.dataset.g = key; items.forEach(function (it) { var b = B(it[1], '', function () { touched = true; fn(it[0]); sync(); paint(); save(); }); b.dataset.v = it[0]; g.appendChild(b); }); parent.appendChild(g); return g; }
  var s1 = step(1, 'Business'), nameIn = E('input'); nameIn.type = 'text'; nameIn.maxLength = 28; nameIn.placeholder = 'Type its name'; nameIn.id = 'biz'; nameIn.setAttribute('aria-label', 'Your business name'); nameIn.autocomplete = 'off'; s1.appendChild(nameIn);
  nameIn.addEventListener('input', function () { C.name = nameIn.value.trim(); touched = true; paint(); save(); });
  group(s1, 'trade', Object.keys(PACK).map(function (k) { return [k, PACK[k].n]; }), 0, function (v) { if (v !== C.trade) { C.trade = v; defaults(); reset(); scr = 'home'; C.view = 'app'; index(); } });
  var s2 = step(2, 'Modules'); group(s2, 'mods', MODS, 1, function (v) { C.mods[v] = C.mods[v] ? 0 : 1; if (C.mods[v]) { scr = v; C.view = 'app'; } }).classList.add('pick');
  var s3 = step(3, 'Theme'), tg = group(s3, 'theme', THEMES, 0, function (v) { C.theme = v; }); tg.classList.add('ths'); [].forEach.call(tg.children, function (b) { b.classList.add('th-' + b.dataset.v); });
  var cg = E('div', 'swt'); cg.dataset.g = 'color'; COLS.forEach(function (c) { var b = B('', '', function () { C.color = c; touched = true; sync(); save(); }); b.dataset.v = c; b.style.setProperty('--c', c); b.setAttribute('aria-label', 'Brand colour ' + c); cg.appendChild(b); });
  var pick = E('input'); pick.type = 'color'; pick.setAttribute('aria-label', 'Pick any brand colour'); pick.addEventListener('input', function () { C.color = pick.value; touched = true; sync(); save(); }); cg.appendChild(pick); s3.appendChild(cg);
  var s4 = step(4, 'Team and automations'); s4.appendChild(E('p', 'l', 'See it as')); group(s4, 'role', Object.keys(ROLES).map(function (k) { return [k, ROLES[k][0]]; }), 0, function (v) { C.role = v; C.view = 'app'; });
  s4.appendChild(E('p', 'l', 'Automations'));
  var ag = E('div', 'autos'); ag.dataset.g = 'autos'; AUTOS.forEach(function (a) { var b = B('', '', function () { C.autos[a[0]] = C.autos[a[0]] ? 0 : 1; touched = true; if (C.autos[a[0]] && a[0] === 'a4') { var o = D.invs.filter(function (v) { return v.over; })[0]; if (o) fire('a4', o.n); } sync(); paint(); save(); }); b.dataset.v = a[0]; A(b, E('b', '', a[1]), E('span', '', '→ ' + a[2] + ' → ' + a[3])); ag.appendChild(b); }); s4.appendChild(ag);
  var sum = E('div', 'spec'); cfg.appendChild(sum);
  group($('#vView'), 'view', [['app', 'App'], ['arch', 'Architecture']], 0, function (v) { C.view = v; }); group($('#vDev'), 'dev', [['desk', 'Desktop'], ['phone', 'Phone']], 0, function (v) { C.dev = v; });
  function tint(hex) { var n = parseInt(hex.slice(1), 16), m = function (v) { return Math.round(v + (255 - v) * .88); }; return 'rgb(' + m(n >> 16) + ',' + m(n >> 8 & 255) + ',' + m(n & 255) + ')'; }
  function sync() {
    [].forEach.call(d.querySelectorAll('#build [data-g]'), function (g) { var k = g.dataset.g; [].forEach.call(g.querySelectorAll('button'), function (b) { var v = b.dataset.v; b.setAttribute('aria-pressed', k === 'mods' || k === 'autos' ? !!C[k][v] : C[k] === v); }); });
    fr.dataset.th = C.theme; fr.classList.toggle('phone', C.dev === 'phone'); root.style.setProperty('--b', C.color); root.style.setProperty('--bs', tint(C.color)); pick.value = C.color; if (nameIn.value.trim() !== C.name) nameIn.value = C.name;
  }
  function spec() { var m = MODS.filter(function (x) { return C.mods[x[0]]; }), a = AUTOS.filter(function (x) { return C.autos[x[0]]; }), w = Math.round(2 + m.reduce(function (s, x) { return s + x[2]; }, 0)); return { m: m, a: a, lo: w, hi: w + 2, th: THEMES.filter(function (t) { return t[0] === C.theme; })[0][1] }; }
  function summary() {
    var s = spec(), n = C.name || 'my business', mess = window.MESS && window.MESS.length ? window.MESS.join(', ') : '';
    var body = 'Business: ' + n + '\nTrade: ' + P.n + '\nHome screen: ' + T.home + '\nModules: ' + s.m.map(function (x) { return x[1]; }).join(', ') + '\nTheme: ' + s.th + ', brand colour ' + C.color + '\nRoles: Owner, Sales, Field\nAutomations: ' + (s.a.length ? s.a.map(function (x) { return x[1] + ' → ' + x[2] + ' → ' + x[3]; }).join('; ') : 'none yet') + '\nTypical timeline: ' + s.lo + ' to ' + s.hi + ' weeks' + (mess ? '\nOur mess: ' + mess : '') + '\nLink to this configuration: ' + location.href.split('#')[0] + '#b=' + pack() + '\n\nHow we work today:\n';
    var href = 'mailto:abhimasih0505@gmail.com?subject=' + encodeURIComponent('A system for ' + n) + '&body=' + encodeURIComponent(body);
    sum.textContent = ''; A(sum, E('h4', '', (C.name || 'Your') + (C.name ? '’s' : '') + ' system, as specified'));
    var dl = E('dl'); [['Product', P.n + ' · home screen: ' + T.home], ['Modules', s.m.length ? s.m.map(function (x) { return x[1]; }).join(', ') : 'None yet'], ['Theme', s.th], ['Roles', 'Owner, Sales, Field'], ['Automations', s.a.length + ' on'], ['Typical timeline', s.lo + ' to ' + s.hi + ' weeks']].forEach(function (x) { A(dl, E('dt', '', x[0]), E('dd', '', x[1])); }); sum.appendChild(dl);
    sum.appendChild(E('small', '', 'Two weeks to listen and map, the rest to build, test and launch. A first estimate, not a quote.'));
    var go = E('a', 'btn b', C.name ? 'Build ' + C.name + ' for real →' : 'Build this for real →'); go.href = href; var sh = B('Copy a link to this setup', 'btn', function () { var u = location.href.split('#')[0] + '#b=' + pack(), ok = function () { sh.textContent = 'Link copied'; setTimeout(function () { sh.textContent = 'Copy a link to this setup'; }, 1800); }; try { history.replaceState(null, '', '#b=' + pack()); } catch (e) { /* file: or sandboxed */ } if (navigator.clipboard) navigator.clipboard.writeText(u).then(ok, ok); else ok(); });
    A(sum, A(E('p', 'acts'), go, sh)); $('#endH').textContent = C.name ? 'Let’s build ' + C.name + ' its own system.' : 'Let’s build yours.'; $('#cta2').href = $('#mail').href = href;
  }
  /* ---- save, share, restore ---- */
  function pack() { return [C.trade, C.theme, C.color.slice(1), MODS.map(function (m) { return C.mods[m[0]] ? 1 : 0; }).join(''), AUTOS.map(function (a) { return C.autos[a[0]] ? 1 : 0; }).join(''), C.role, C.dev, encodeURIComponent(C.name)].join('.'); }
  function unpack(s) { var p = s.split('.'); if (p.length < 7 || !PACK[p[0]]) return false; C.trade = p[0]; if (THEMES.some(function (t) { return t[0] === p[1]; })) C.theme = p[1]; if (/^[0-9a-f]{6}$/i.test(p[2])) C.color = '#' + p[2]; C.mods = {}; MODS.forEach(function (m, i) { if (p[3].charAt(i) === '1') C.mods[m[0]] = 1; }); AUTOS.forEach(function (a, i) { C.autos[a[0]] = p[4].charAt(i) === '1' ? 1 : 0; }); if (ROLES[p[5]]) C.role = p[5]; C.dev = p[6] === 'phone' ? 'phone' : 'desk'; try { C.name = decodeURIComponent(p.slice(7).join('.')).slice(0, 28); } catch (e) { C.name = ''; } return true; }
  function save() { if (!touched) return; try { localStorage.setItem('am-build', pack()); } catch (e) { /* private mode */ } }
  var ok = false; if (location.hash.indexOf('#b=') === 0) ok = unpack(location.hash.slice(3)); if (!ok) { try { var st = localStorage.getItem('am-build'); if (st) ok = unpack(st); } catch (e) { /* private mode */ } } if (!ok) defaults();
  addEventListener('mess', function () { var m = window.MESS; if (m && m.length) note('Your mess arrived: “' + m[m.length - 1] + '”'); summary(); });

  /* the real projects: closest to the chosen trade first, with a preview that plays the page */
  var ix = $('#ix'), pv = $('#pv');
  var plain = false;
  function index() {
    var like = P.like, order = plain ? W.slice() : like.map(function (id) { return W.filter(function (w) { return w.id === id; })[0]; }).concat(W.filter(function (w) { return like.indexOf(w.id) < 0; })), nt = $('#like');
    ix.textContent = ''; nt.textContent = plain ? 'Showing all 23 in the usual order.' : 'Showing ' + P.n.toLowerCase() + ' projects first, to match the trade picked above.';
    nt.appendChild(B(plain ? 'Show ' + P.n.toLowerCase() + ' first' : 'Show all in the usual order', '', function () { plain = !plain; index(); }));
    order.forEach(function (w, i) {
      var a = E('a'), b = E('b', '', w.name); a.href = w.href;
      a.appendChild(E('span', 'n', (i < 9 ? '0' : '') + (i + 1))); a.appendChild(b); a.appendChild(E('span', 'k', w.kind)); a.appendChild(E('span', 's', w.status)); a.appendChild(E('span', 'g', '→'));
      function on() { pv.textContent = ''; if (!w.img && !w.card) { pv.classList.remove('on'); return; } var im = new Image(); im.alt = ''; if (w.img) im.addEventListener('load', function () { var dy = pv.clientHeight - im.clientHeight; if (dy < 0 && !reduce) { im.style.setProperty('--y', dy + 'px'); im.style.setProperty('--t', Math.max(6, w.a * 3.4) + 's'); im.classList.add('pan'); } }); im.src = (root.dataset.base || '') + (w.img ? 'img/' + w.img + '.webp' : 'img/cards/' + w.card + '.webp'); pv.appendChild(im); pv.classList.add('on'); }
      a.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') on(); }); a.addEventListener('focus', on); if (!i) on();
      ix.appendChild(a);
    });
  }
  reset(); sync(); paint(); index();
  if (location.hash.indexOf('#b=') === 0) setTimeout(function () { $('#build').scrollIntoView(); }, 300);
  window.__studio = { C: C, paint: paint, book: book };
})();
