/* The sample business behind the builder. Five trades of data, and the flows that tie the modules together:
     booking → confirmation → advance invoice → reminder on the day → payment reminder if it goes overdue
     deal won → invoice → stock reserved → (stock runs low) → purchase order → approved → delivered → shortfalls filled
     invoice paid → stock issued → a job for the person on site → finished → balance invoice
   A clock (tick) makes the time-based steps happen. No DOM in here: studio.js draws it and shows what each flow did. */
(function () {
  'use strict';
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  function inr(n) { var s = String(Math.round(n)), l = s.slice(-3), r = s.slice(0, -3); return '₹' + (r ? r.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + l; }
  function short(n) { var f = function (v, u) { return '₹' + (+v.toFixed(v < 10 ? 2 : 1)) + u; }; return n >= 1e7 ? f(n / 1e7, ' Cr') : n >= 1e5 ? f(n / 1e5, ' L') : n >= 1e3 ? f(n / 1e3, 'K') : '₹' + Math.round(n); }
  function dn(day) { return DAYS[(day % 7 + 7) % 7]; }

  var MODS = [['pipe', 'Leads & pipeline', 2], ['cal', 'Calendar & bookings', 1], ['stock', 'Inventory', 1.5], ['inv', 'Invoices & payments', 1.5], ['chat', 'WhatsApp assistant', 1.5], ['field', 'Field app', 2], ['rep', 'Reports', 1], ['portal', 'Customer portal', 1.5]];
  /* id, trigger, the steps as the visitor reads them, and the module each step needs ('' = none; without WhatsApp a message goes by email) */
  var AUTOS = [
    ['a1', 'When a booking is made', ['confirm it on WhatsApp', 'raise the advance invoice', 'remind them on the day'], ['', 'inv', '']],
    ['a2', 'When a deal is won', ['raise the invoice', 'reserve the stock'], ['inv', 'stock']],
    ['a3', 'When stock runs low', ['alert the owner', 'draft a purchase order'], ['stock', 'stock']],
    ['a4', 'When an invoice is overdue', ['send a polite reminder', 'flag it for the owner'], ['inv', 'inv']],
    ['a5', 'When a job is finished on site', ['tell the customer', 'raise what is left to pay'], ['', 'inv']],
    ['a6', 'When a lead goes quiet for two days', ['set a task for whoever owns it'], ['pipe']]
  ];
  /* leads: name, what, value, stage, whose (0 = the salesperson you can view as, 1 = their colleague), source, stock item, quantity
     stock: name, on hand, capacity, reorder level, supplier, unit · invs: name, what, value, state, due day */
  var PACK = {
    property: { n: 'Property', home: 'Listings map', def: 'pipe cal stock inv chat field rep', st: ['Enquiry', 'Site visit', 'Won'], mid: 1,
      w: { pipe: 'Enquiries', cal: 'Site visits', stock: 'Units', book: 'Site visit', po: 'Inventory request', job: 'Key handover', free: 'available', fin: 'Visit done', won: 'Deal won', au: ['When a site visit is booked', 'When a deal is won'], ty: 'Thank you for visiting today. We will call you with the next steps.' },
      team: { owner: ['Rhea', 'Owner'], sales: ['Arjun', 'Agent'], s2: 'Kavya', field: ['Imran', 'Site executive'], acct: ['Neha', 'Accounts'] },
      fee: null, adv: ['Brokerage', 1],
      leads: [['Mehra family', '3 BHK · Vasant Vihar', 360000, 0, 0, 'Website', 0, 1], ['R. Kapoor', 'Office · GK II', 210000, 0, 1, 'Referral', 4, 1], ['Anita S.', '2 BHK · Saket', 65000, 0, 0, 'WhatsApp', 1, 1], ['D. Bose', 'Plot · Gurugram', 190000, 1, 0, 'Property portal', 3, 1], ['Farah & Zaid', '3 BHK · Vasant Vihar', 340000, 1, 1, 'Walk-in', 0, 1], ['Col. Bhatia', '2 BHK · Saket', 240000, 0, 1, 'Property portal', 1, 1], ['Nisha T.', 'Shop · Hauz Khas', 120000, 0, 0, 'Instagram', 2, 1]],
      stock: [['3 BHK, Vasant Vihar', 4, 12, 3, 'the Vasant Vihar developer', 'homes'], ['2 BHK, Saket', 9, 14, 3, 'the Saket developer', 'homes'], ['Shops, Hauz Khas', 2, 8, 2, 'the market association', 'shops'], ['Plots, Gurugram', 5, 10, 2, 'the Gurugram developer', 'plots'], ['Offices, GK II', 6, 9, 2, 'the GK II landlord', 'offices']],
      ev: [['Farah & Zaid', 'Site visit · 3 BHK, Vasant Vihar', 0, '4:00 pm'], ['D. Bose', 'Site visit · plot, Gurugram', 1, '11:00 am']],
      invs: [['Sharma family', 'Brokerage · 2 BHK, Saket', 65000, 'paid', -2], ['V. Nair', 'Brokerage · shop lease', 120000, 'over', -1]],
      check: ['Keys collected', 'Walk-through done', 'Feedback noted'], night: [['Tanya G.', '2 BHK · Saket', 55000, 1], ['Mr Oberoi', 'Office · GK II', 180000, 4]],
      bot: 'Hello! Buying or renting?', chat: [['Anita S.', 'Is the 2 BHK in Saket still available?', 'Yes, it is. Rent is ₹65,000 a month. Shall I book a visit?']],
      qr: [['3 BHK to rent under ₹1.5 lakh', 'Four homes match, in Vasant Vihar and Saket. Shall I book a visit?', ['Sunita P.', '3 BHK · Vasant Vihar', 140000, 0], 0], ['Book a site visit for Saturday', 'Done. Saturday, 11 am is held for you.', ['Rohit A.', '2 BHK · Saket', 65000, 1], 5]],
      pins: [['3 BHK · Vasant Vihar', '₹1.4 L a month', 24, 30], ['2 BHK · Saket', '₹65K a month', 58, 22], ['Shop · Hauz Khas', '₹1.2 L a month', 44, 54], ['Plot · Gurugram', '₹95 L', 18, 70], ['Office · GK II', '₹2.1 L a month', 74, 58]], like: ['recrm', 'reweb', 'estate', 'launch'],
      hist: { src: { Website: [14, 2], Referral: [6, 3], WhatsApp: [11, 2], 'Property portal': [18, 1], 'Walk-in': [5, 2], Instagram: [9, 1] }, rev: [[310000, 265000], [285000, 240000], [420000, 300000], [365000, 410000], [298000, 255000], [455000, 330000], [390000, 372000]], use: [1, 2, .5, .5, 1], vis: [22, 7], team: { Arjun: [18, 84, 7], Kavya: [42, 61, 4] } } },
    build: { n: 'Construction', home: 'Projects', def: 'pipe cal stock inv field rep', st: ['Enquiry', 'Quote sent', 'Won'], mid: 0,
      w: { pipe: 'Quotes', cal: 'Site surveys', stock: 'Materials', book: 'Site survey', po: 'Purchase order', job: 'Site start', free: 'free', fin: 'Finished on site', won: 'Quote won', au: ['When a site survey is booked', 'When a quote is won'], ty: 'Today’s work on site is done. Photos are on their way to you.' },
      team: { owner: ['Kabir', 'Owner'], sales: ['Sana', 'Estimator'], s2: 'Dev', field: ['Ramesh', 'Site supervisor'], acct: ['Priti', 'Accounts'] },
      fee: ['Site survey fee, adjusted in the quote', 2500], adv: ['Advance on signing, 40%', .4],
      leads: [['Villa, Sainik Farm', 'Full interiors', 3800000, 0, 0, 'Referral', 0, 90], ['Café fit-out', 'Flooring · Hauz Khas', 1200000, 1, 0, 'Instagram', 1, 300], ['Arora residence', 'Kitchen, wardrobes', 700000, 1, 1, 'Website', 2, 40], ['Office, 4th floor', 'Design-build', 6400000, 0, 1, 'Referral', 3, 120], ['Gupta duplex', 'False ceiling, paint', 950000, 0, 0, 'WhatsApp', 3, 40], ['Clinic, Dwarka', 'Reception, cabins', 1500000, 0, 1, 'Website', 2, 30]],
      stock: [['Plywood, 18 mm', 140, 200, 60, 'the timber yard, Kirti Nagar', 'sheets'], ['Tiles, 600 × 600', 520, 900, 250, 'the tile depot, Okhla', 'boxes'], ['Laminate sheets', 75, 160, 40, 'the timber yard, Kirti Nagar', 'sheets'], ['Gypsum boards', 90, 220, 60, 'the hardware store, Kotla', 'boards'], ['Paint, 20 L', 9, 40, 10, 'the hardware store, Kotla', 'buckets']],
      ev: [['Café fit-out', 'Site survey · Hauz Khas', 0, '3:00 pm'], ['Arora residence', 'Measurement visit', 1, '10:30 am']],
      invs: [['Bansal flat', 'Advance · modular kitchen', 180000, 'paid', -3], ['Studio Nine', 'Final bill · reception', 240000, 'over', -1]],
      check: ['Measurements taken', 'Photos uploaded', 'Client walk-through', 'Sign-off captured'], night: [['Mrs Khanna', 'Wardrobes · 3 rooms', 420000, 2], ['Bakery, Saket', 'Counter and seating', 880000, 0]],
      bot: 'Hello! What are you building?', chat: [['Gupta duplex', 'Can you share the false-ceiling options?', 'Sent: three options with prices. Want a site survey to measure up?']],
      qr: [['Price for a modular kitchen?', 'Most come to ₹2.4 to 4 lakh. Want a line-by-line quote?', ['Verma kitchen', 'Modular kitchen', 320000, 2], 0], ['Book a site survey', 'Booked. The supervisor will call an hour before.', ['Flat, Dwarka', 'Full interiors', 1400000, 0], 1]],
      proj: [['Villa, Sainik Farm', 0, 6], ['Café fit-out', 2, 4], ['Arora residence', 3, 3], ['Office, 4th floor', 1, 7]], like: ['interp', 'studio', 'quotes', 'build', 'masonry', 'interior'],
      hist: { src: { Referral: [9, 4], Website: [12, 2], Instagram: [10, 1], WhatsApp: [8, 2] }, rev: [[820000, 610000], [1250000, 900000], [640000, 720000], [980000, 540000], [1420000, 1180000], [760000, 690000], [1100000, 830000]], use: [38, 120, 22, 30, 6], vis: [22, 9], slip: [-2, 9, 0, 3], team: { Sana: [35, 78, 6], Dev: [95, 55, 3] } } },
    retail: { n: 'Retail', home: 'Till', def: 'pipe stock inv chat rep portal', st: ['In cart', 'Checkout', 'Ordered'], mid: 0,
      w: { pipe: 'Online orders', cal: 'Store pickups', stock: 'Inventory', book: 'Store pickup', po: 'Purchase order', job: 'Delivery', free: 'free', fin: 'Handed over', won: 'Order placed', au: ['When a store pickup is booked', 'When an order is placed'], ty: 'Your order has been handed over. Thank you for shopping with us.' },
      team: { owner: ['Tara', 'Owner'], sales: ['Jai', 'Store staff'], s2: 'Mitali', field: ['Suresh', 'Delivery'], acct: ['Leena', 'Accounts'] },
      fee: null, adv: ['Order total', 1],
      leads: [['Ritu M.', 'Harbor jacket × 1', 8000, 0, 0, 'Website', 0, 1], ['Karan', 'Linen shirt × 2', 5000, 1, 0, 'Instagram', 1, 2], ['Sophie D.', 'Canvas tote × 2', 3600, 0, 1, 'Walk-in', 3, 2], ['Aman V.', 'Wool coat × 1', 14000, 1, 1, 'WhatsApp', 2, 1], ['Boutique Nomad', 'Linen shirts × 24, wholesale', 54000, 0, 0, 'Referral', 1, 24], ['Pooja R.', 'Silk scarf × 3', 6600, 0, 1, 'Website', 4, 3]],
      stock: [['Harbor jacket', 14, 40, 10, 'the jacket workshop, Noida', 'pcs'], ['Linen shirt', 31, 60, 20, 'the loom house, Jaipur', 'pcs'], ['Wool coat', 5, 20, 5, 'the hill weavers, Kullu', 'pcs'], ['Canvas tote', 22, 50, 12, 'the stitch unit, Okhla', 'pcs'], ['Silk scarf', 9, 30, 8, 'the loom house, Jaipur', 'pcs']],
      ev: [['Karan', 'Store pickup · 2 linen shirts', 0, '5:30 pm']],
      invs: [['Isha, order 1039', 'Wool coat × 1', 14000, 'paid', -2], ['Dev S., order 1040', 'Harbor jacket × 2', 16000, 'over', -1]],
      check: ['Parcel scanned', 'Handed over', 'Photo taken'], night: [['Meenal', 'Harbor jacket × 1', 8000, 0], ['Arnav', 'Canvas tote × 3', 5400, 3]],
      bot: 'Hi! Need help with an order?', chat: [['Aman V.', 'Do you have the wool coat in a medium?', 'Yes, five left in medium. I have put one in your cart.']],
      qr: [['Is the linen shirt in stock?', 'Yes. Shall I add two to a cart for you?', ['Farhan', 'Linen shirt × 2', 5000, 1], 0], ['Can I pick up in store tomorrow?', 'Yes. Your order will be held at the counter from 11 am.', ['Lata', 'Canvas tote × 1', 1800, 3], 1]],
      price: [8000, 2500, 14000, 1800, 2200], like: ['store', 'orders', 'watch', 'revv', 'stockroom'],
      hist: { src: { 'Walk-in': [60, 44], Website: [46, 21], Instagram: [38, 12], WhatsApp: [22, 9], Referral: [6, 4] }, rev: [[142000, 138000], [168000, 150000], [121000, 126000], [189000, 171000], [156000, 149000], [203000, 182000], [174000, 168000]], use: [6, 14, 2, 9, 1], vis: [112, 90], team: { Jai: [6, 92, 52], Mitali: [14, 80, 38] } } },
    stay: { n: 'Hospitality', home: 'Front desk', def: 'pipe cal stock inv chat rep portal', st: ['Enquiry', 'Held', 'Booked'], mid: 1,
      w: { pipe: 'Enquiries', cal: 'Arrivals', stock: 'Supplies', book: 'Stay', po: 'Purchase order', job: 'Room prep', free: 'free', fin: 'Guest checked in', won: 'Booking confirmed', au: ['When a stay is held', 'When a booking is confirmed'], ty: 'You are checked in. Dinner is from 7:30 pm. Enjoy your stay.' },
      team: { owner: ['Meera', 'Owner'], sales: ['Aditi', 'Front desk'], s2: 'Rohan', field: ['Lakshmi', 'Housekeeping'], acct: ['Vinod', 'Accounts'] },
      fee: ['Advance to hold the room', 6500], adv: ['Room charges', 1],
      leads: [['Iyer, 2 nights', 'Ridge room', 22000, 0, 0, 'Website', 0, 2], ['Wedding party', '14 rooms · 2 nights', 360000, 1, 0, 'Referral', 0, 28], ['Sen, weekend', 'Valley suite', 31000, 0, 1, 'Instagram', 1, 2], ['Company offsite', '8 rooms · 3 nights', 240000, 0, 1, 'Website', 2, 48], ['Dr Thomas', 'Garden room · 4 nights', 38000, 0, 0, 'WhatsApp', 0, 2], ['D’Souza anniversary', 'Dinner for 20', 46000, 1, 1, 'Walk-in', 2, 20]],
      stock: [['Linen sets', 38, 60, 18, 'the linen supplier, Dehradun', 'sets'], ['Toiletry kits', 42, 120, 30, 'the hotel supplier, Dehradun', 'kits'], ['Breakfast covers', 64, 150, 40, 'the provisions store, Mussoorie', 'covers'], ['Firewood', 8, 40, 10, 'the forest depot', 'bundles'], ['LPG cylinders', 4, 8, 2, 'the gas agency, Mussoorie', 'cylinders']],
      ev: [['Kohli', 'Stay · Valley suite, 2 nights', 0, '2:00 pm'], ['Menon', 'Stay · Ridge 1, 3 nights', 1, '2:00 pm']],
      invs: [['Kohli', 'Valley suite · 2 nights', 31000, 'paid', -1], ['Bhalla group', 'Balance · 6 rooms', 84000, 'over', -1]],
      check: ['Room cleaned', 'Linen changed', 'Minibar restocked', 'Ready for check-in'], night: [['Aarav P.', 'Ridge room · long weekend', 33000, 0], ['Joshi family', 'Valley suite · 3 nights', 46000, 1]],
      bot: 'Namaste! When are you visiting?', chat: [['Dr Thomas', 'Is the garden room free for four nights from Thursday?', 'It is. ₹9,500 a night with breakfast. Shall I hold it?']],
      qr: [['Any rooms this weekend?', 'Two ridge rooms are free, ₹11,000 a night. Shall I hold one?', ['Nair, weekend', 'Ridge room', 22000, 0], 5], ['A table for four tonight', 'Held for 8 pm. See you then.', ['Dinner, table of 4', 'Dining room', 4800, 2], 0]],
      rooms: ['Ridge 1', 'Ridge 2', 'Valley suite', 'Garden room'], rate: [11000, 11000, 15500, 9500], held: [[0, 1, 3, 'Menon'], [2, 0, 2, 'Kohli'], [1, 4, 2, 'Rao'], [1, -1, 3, 'Bedi'], [3, -2, 4, 'Shah']], like: ['resort', 'saas', 'store'],
      hist: { src: { Website: [24, 9], Referral: [8, 5], Instagram: [15, 3], WhatsApp: [12, 5], 'Walk-in': [4, 2] }, rev: [[186000, 172000], [242000, 205000], [158000, 166000], [301000, 244000], [224000, 231000], [268000, 240000], [215000, 198000]], use: [14, 30, 55, 9, 2], vis: [38, 24], occ: [64, 11200], team: { Aditi: [9, 90, 15], Rohan: [26, 72, 9] } } },
    service: { n: 'Services', home: 'Appointments', def: 'pipe cal inv chat rep portal', st: ['Enquiry', 'Trial', 'Member'], mid: 1,
      w: { pipe: 'Enquiries', cal: 'Calendar', stock: 'Shop and kits', book: 'Trial session', po: 'Purchase order', job: 'Induction session', free: 'free', fin: 'Session done', won: 'New member', au: ['When a trial is booked', 'When someone joins'], ty: 'Good session today. See you at the next one.' },
      team: { owner: ['Zoya', 'Owner'], sales: ['Nikhil', 'Front desk'], s2: 'Farah', field: ['Coach Dev', 'Trainer'], acct: ['Asha', 'Accounts'] },
      fee: ['Trial session', 500], adv: ['Membership', 1],
      leads: [['Kabir', 'Strength · 3 months', 12000, 0, 0, 'Instagram', 0, 1], ['Naina', 'HYROX prep · 3 months', 18000, 1, 0, 'Referral', 0, 1], ['Dr Rao', 'Morning batch · 6 months', 21000, 0, 1, 'Walk-in', 0, 1], ['Team of 6', 'Company plan · 3 months', 54000, 1, 1, 'Website', 0, 6], ['Ishaan', 'Personal training × 12', 24000, 0, 0, 'WhatsApp', 1, 1], ['Maya & Tanvi', 'Couple plan · 6 months', 36000, 0, 1, 'Instagram', 0, 2]],
      stock: [['Welcome kits', 9, 30, 8, 'the merch printer, Okhla', 'kits'], ['Shaker bottles', 26, 60, 15, 'the merch printer, Okhla', 'pcs'], ['Protein tubs', 5, 24, 6, 'the nutrition distributor', 'tubs'], ['Chalk blocks', 14, 40, 10, 'the sports store, Lajpat Nagar', 'blocks'], ['Guest towels', 30, 80, 20, 'the linen supplier', 'pcs']],
      ev: [['Ananya', 'Members’ session · strength', 0, '6:00 am'], ['Vikram', 'Personal training · session 4', 0, '8:00 am'], ['Sneha', 'Members’ session · HYROX prep', 0, '6:00 pm']],
      invs: [['Ananya', 'Membership · 3 months', 12000, 'paid', -4], ['Vikram', 'Personal training × 12', 24000, 'over', -1]],
      check: ['Assessment done', 'Plan explained', 'Notes saved'], night: [['Rhea K.', 'Morning batch · 3 months', 12000, 0], ['Samar', 'Personal training × 12', 24000, 1]],
      bot: 'Hey! Want to try a class?', chat: [['Ishaan', 'What does personal training cost?', 'Twelve sessions are ₹24,000. A trial is ₹500, adjusted when you join.']],
      qr: [['What does a trial cost?', 'A trial class is ₹500, adjusted when you join. Shall I book one?', ['Tara V.', 'Strength · 3 months', 12000, 0], 0], ['Book me in for 7 pm', 'You are in for 7 pm. Bring water and a towel.', ['Yash', 'HYROX prep · 3 months', 18000, 0], 1]],
      slots: [['6:00 am', 'Ananya'], ['7:00 am', ''], ['8:00 am', 'Vikram'], ['5:00 pm', ''], ['6:00 pm', 'Sneha'], ['7:00 pm', '']], like: ['boxx', 'gym', 'saas', 'work', 'crm'],
      hist: { src: { Referral: [10, 6], 'Walk-in': [16, 7], Instagram: [28, 6], WhatsApp: [9, 3], Website: [14, 3] }, rev: [[86000, 80000], [112000, 94000], [74000, 79000], [128000, 101000], [96000, 97000], [141000, 118000], [104000, 99000]], use: [5, 8, 4, 3, 10], vis: [41, 25], sess: [78, 31], team: { Nikhil: [12, 88, 16], Farah: [30, 70, 9] } } }
  };
  function autos(t) {
    var P = PACK[t]; return AUTOS.map(function (a) {
      var x = a.slice(); if (a[0] === 'a1') { x[1] = P.w.au[0]; if (!P.fee) { x[2] = ['confirm it on WhatsApp', 'set a task for the team', 'remind them on the day']; x[3] = ['', '', '']; } }
      if (a[0] === 'a2') x[1] = P.w.au[1]; if (a[0] === 'a3') x[2] = ['alert the owner', 'draft ' + (/^[AEIOU]/.test(P.w.po) ? 'an ' : 'a ') + P.w.po.toLowerCase()]; return x;
    });
  }
  var WALK = ['S. Verma', 'Priya N.', 'Imran K.', 'Joshi & Sons', 'Meera T.', 'A. Fernandes', 'Gaurav B.', 'Leela R.'];

  function make(C) {
    var M = { C: C, emit: function () {} }, D, P, seq, hush = null;
    function by(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
    function person(k) { return P.team[k][0]; }
    function actor() { return person(C.role); }
    function log(a, t, s, ref) { var e = { day: D.day, a: a || '', t: t, s: s || [], ref: ref || null }; D.log.unshift(e); if (D.log.length > 80) D.log.pop(); if (a) D.fired++; if (hush) hush.push(e); else M.emit(e); return e; }
    function touch(l, txt) { l.last = D.day; l.nudge = 0; l.log.unshift([D.day, txt]); }
    function move(s, q, k, why) { D.moves.unshift({ day: D.day, n: s.n, q: q, k: k, why: why }); if (D.moves.length > 40) D.moves.pop(); }
    function task(t, who, due, ref) { var k = { id: 'T' + (++seq.t), t: t, who: who, due: due, done: 0, ref: ref || null }; D.tasks.unshift(k); return k; }
    function thread(n) { var c = D.chats.filter(function (x) { return x.n === n; })[0]; if (!c) { c = { n: n, m: [], un: 0 }; D.chats.unshift(c); } return c; }
    function say(n, mine, txt) { var c = thread(n); c.m.push([mine, txt, D.day]); if (mine) c.un++; return c; }
    function invoice(n, lines, src, ref, due) {
      var v = { id: 'INV-' + (++seq.i), n: n, lines: lines, v: lines.reduce(function (s, x) { return s + x[1]; }, 0), st: 'sent', over: 0, rem: 0, flag: 0, due: due, src: src, ref: ref, made: D.day, log: [[D.day, 'Raised and sent']] };
      D.invs.unshift(v); return v;
    }
    function lead(n, dsc, v, item, src) {
      var l = { id: 'L' + (++seq.l), n: n, d: dsc, v: v, s: 0, own: C.role === 'sales' || seq.l % 2 ? person('sales') : P.team.s2, src: src, need: [item || 0, 1], last: D.day, res: 0, short: 0, out: 0, inv: null, bal: null, job: null, nudge: 0, log: [[D.day, 'Enquiry came in · ' + src]] };
      D.leads.unshift(l); return l;
    }
    function tpl(k, e) {
      var b = C.name || 'us', w = e.w.split(' · ')[0].toLowerCase();
      return k === 'ok' ? 'Confirmed: ' + w + ', ' + LONG[(e.day % 7 + 7) % 7] + ' at ' + e.tm + '. Reply 1 to change it. Thank you, ' + b + '.' : k === 'rem' ? 'A reminder from ' + b + ': your ' + w + ' is today at ' + e.tm + '. See you then.' : k === 'done' ? P.w.ty : '';
    }
    function openPO(i) { return D.pos.filter(function (p) { return p.i === i && p.st !== 'received'; })[0]; }
    function draft(i, why) {
      var s = D.stock[i], sh = D.leads.reduce(function (t, l) { return t + (l.need[0] === i ? l.short : 0); }, 0), p = { id: (P.w.po === 'Purchase order' ? 'PO-' : 'REQ-') + (++seq.p), i: i, n: s.n, q: Math.max(1, s.of - (s.q - s.res) + sh), sup: s.sup, st: 'draft', eta: 0, why: why, day: D.day };
      D.pos.unshift(p); return p;
    }
    function low() {
      if (!C.mods.stock) return;
      D.stock.forEach(function (s, i) {
        if (s.q - s.res > s.min || openPO(i)) return; var p;
        if (C.autos.a3) { p = draft(i, 'Fell to the reorder level'); log('a3', 'Low stock: ' + s.n, [[person('owner') + ' alerted', 1], [p.id + ' drafted · ' + p.q + ' ' + s.u + ' from ' + s.sup, 1]], ['po', p.id]); }
        else if (!s.flag) { s.flag = 1; log('', 'Low stock: ' + s.n, [['The low-stock automation is off: reorder it by hand', 0]], ['stock', i]); }
      });
    }
    function reserve(l) {
      var s = D.stock[l.need[0]], q = l.need[1] - l.res - l.out, t = Math.max(0, Math.min(q, s.q - s.res)); s.res += t; l.res += t; l.short = q - t; if (t) move(s, t, 'res', 'Reserved for ' + l.n);
      return l.short ? [(l.res + l.out) + ' of ' + l.need[1] + ' × ' + s.n + ' reserved · ' + l.short + ' short', 1] : [l.need[1] + ' × ' + s.n + ' reserved', 1];
    }
    function dealInv(l) {
      var lines = [[P.adv[0] + ' · ' + l.d, Math.round(l.v * P.adv[1])]], a = D.invs.filter(function (x) { var e = x.src === 'booking' && by(D.ev, x.ref); return e && e.lead === l.id; })[0], v;
      if (a) lines.push(['Less the advance on ' + a.id, -a.v]); v = invoice(l.n, lines, 'deal', l.id, D.day + 2); l.inv = v.id; touch(l, v.id + ' raised'); return v;
    }
    function job(l) {
      var e = { id: 'J-' + (++seq.b), n: l.n, w: P.w.job + ' · ' + l.d, day: D.day + 1, tm: '10:00 am', st: 'confirmed', job: 1, rem: 0, on: 0, done: 0, paid: 0, inv: null, chk: [], who: person('field'), lead: l.id, by: 'the system', log: [[D.day, 'Created when ' + l.inv + ' was paid']] };
      D.ev.push(e); l.job = e.id; return e;
    }
    function remind(v, auto) {
      v.rem++; v.log.push([D.day, 'Reminder ' + v.rem + ' sent']); if (C.mods.chat) say(v.n, 0, 'A gentle reminder: ' + v.id + ' for ' + inr(v.v) + ' was due on ' + LONG[(v.due % 7 + 7) % 7] + '. You can pay from your portal link.');
      if (auto) { v.flag = 1; log('a4', 'Overdue: ' + v.id + ' · ' + v.n, [[C.mods.chat ? 'Polite reminder sent on WhatsApp' : 'Polite reminder sent by email', 1], ['Flagged for ' + person('owner'), 1]], ['inv', v.id]); }
      else log('', 'Reminder sent: ' + v.id + ' · ' + v.n, [], ['inv', v.id]);
    }
    function receive(p) {
      var s = D.stock[p.i], steps = [['+' + p.q + ' ' + s.u + ' · ' + s.n, 1]]; p.st = 'received'; s.q += p.q; s.flag = 0; move(s, p.q, 'in', p.id + ' received from ' + s.sup);
      D.leads.forEach(function (l) { if (l.short && l.need[0] === p.i && l.s === 2) { reserve(l); if (!l.short) steps.push(['Shortfall filled for ' + l.n, 1]); } });
      log('', p.id + ' delivered', steps, ['po', p.id]);
    }

    M.reset = function () {
      P = M.P = PACK[C.trade]; seq = { i: 103, b: 20, p: 10, t: 0, l: 0 };
      D = M.D = { day: 0, won: 0, paid: 0, fired: 0, log: [], moves: [], pays: [], tasks: [], pos: [], chats: [], nt: 0, wk: 0, sel: 0, bill: [], photos: ['Week 2 · slab poured', 'Week 1 · site cleared'], held: (P.held || []).map(function (h) { return h.slice(); }), slots: (P.slots || []).map(function (s) { return s.slice(); }), qr: P.qr.slice() };
      D.leads = P.leads.map(function (c, i) { return { id: 'L' + (++seq.l), n: c[0], d: c[1], v: c[2], s: c[3], own: c[4] ? P.team.s2 : person('sales'), src: c[5], need: [c[6], c[7]], last: -(i % 2), res: 0, short: 0, out: 0, inv: null, bal: null, job: null, nudge: 0, log: (c[3] ? [[-1, P.st[1]]] : []).concat([[-2 - i % 3, 'Enquiry came in · ' + c[5]]]) }; });
      D.stock = P.stock.map(function (s) { return { n: s[0], q: s[1], res: 0, of: s[2], min: s[3], sup: s[4], u: s[5], flag: 0 }; });
      D.invs = P.invs.map(function (v, i) { var o = v[3] === 'over'; return { id: 'INV-' + (102 - i), n: v[0], lines: [[v[1], v[2]]], v: v[2], st: o ? 'sent' : 'paid', over: o ? 1 : 0, rem: o && C.autos.a4 ? 1 : 0, flag: o ? 1 : 0, due: v[4], src: 'old', ref: null, made: v[4] - 3, log: [[v[4] - 3, 'Raised and sent']].concat(o ? (C.autos.a4 ? [[0, 'Reminder 1 sent']] : []) : [[v[4], 'Paid · bank transfer']]) }; });
      D.pays = D.invs.filter(function (v) { return v.st === 'paid'; }).map(function (v) { D.paid += v.v; return { id: v.id, n: v.n, v: v.v, how: 'Bank transfer', day: v.due }; });
      D.ev = P.ev.map(function (e) { var l = D.leads.filter(function (x) { return x.n === e[0]; })[0]; return { id: 'B-' + (++seq.b), n: e[0], w: e[1], day: e[2], tm: e[3], st: 'confirmed', job: 0, rem: e[2] === 0 ? 1 : 0, on: 0, done: 0, paid: 0, inv: null, chk: [], who: person('field'), lead: l ? l.id : null, by: person('sales'), log: [[-1, 'Booked by ' + person('sales')], [-1, 'Confirmation sent']] }; });
      D.stock.forEach(function (s, i) { if (s.q <= s.min) { var p = draft(i, 'Fell to the reorder level'); p.day = -1; } });
      D.leads.forEach(function (l) { if (l.s === 1) task('Follow up with ' + l.n, l.own, l.own === person('sales') ? 0 : 1, ['lead', l.id]); });
      task('Approve this week’s rota', person('owner'), 1, null);
      P.chat.forEach(function (c) { say(c[0], 1, c[1]); say(c[0], 0, c[2]); thread(c[0]).un = 0; });
      return M;
    };
    M.who = function () { var me = person('sales'), c = D.leads.filter(function (x) { return x.s === 0 && (C.role !== 'sales' || x.own === me); })[0]; return c ? c.n : WALK[(D.wk++) % WALK.length]; };
    M.peek = function () { var me = person('sales'), c = D.leads.filter(function (x) { return x.s === 0 && (C.role !== 'sales' || x.own === me); })[0]; return c ? c.n : WALK[D.wk % WALK.length]; };
    M.mine = function (l) { return C.role !== 'sales' || l.own === person('sales'); };
    M.person = person; M.actor = actor; M.by = by;
    M.can = function (k) { var r = C.role; return k === 'approve' ? r === 'owner' : k === 'pay' ? r === 'owner' || r === 'acct' : k === 'money' ? r === 'owner' || r === 'acct' : k === 'sell' ? r === 'owner' || r === 'sales' : k === 'site' ? r === 'owner' || r === 'field' : true; };

    /* booking → confirmation → advance invoice (or a follow-up task where the visit is free) → reminder on the day */
    M.taken = function (r, dd) { return D.held.some(function (h) { return h[0] === r && dd >= h[1] && dd < h[1] + h[2]; }); };
    M.book = function (n, w, day, tm, rm) {
      var l, steps = [], v, e;
      day = day === undefined ? D.day + 1 : day;
      if (P.rooms) { if (rm === undefined) for (rm = 0; rm < P.rooms.length && M.taken(rm, day); rm++); if (rm < P.rooms.length) { v = M.taken(rm, day + 1) ? 1 : 2; D.held.push([rm, day, v, n.split(/[ ,]/)[0]]); w = 'Stay · ' + P.rooms[rm] + ', ' + v + (v > 1 ? ' nights' : ' night'); tm = tm || '2:00 pm'; } }
      w = w || P.w.book; tm = tm || '11:00 am';
      l = D.leads.filter(function (x) { return x.n === n; })[0] || lead(n, w.split(' · ').pop(), P.fee ? P.fee[1] * 4 : 90000, 0, 'Walk-in');
      e = { id: 'B-' + (++seq.b), n: n, w: w, day: day, tm: tm, st: 'booked', job: 0, rem: 0, on: 0, done: 0, paid: 0, inv: null, chk: [], who: person('field'), lead: l.id, by: actor(), log: [[D.day, 'Booked by ' + actor()]] };
      D.ev.push(e); if (l.s === 0) l.s = 1; touch(l, P.w.book + ' booked for ' + LONG[(day % 7 + 7) % 7] + ', ' + tm);
      if (C.autos.a1) {
        e.st = 'confirmed'; e.log.push([D.day, 'Confirmation sent']);
        if (C.mods.chat) { say(n, 0, tpl('ok', e)); steps.push(['WhatsApp confirmation sent', 1]); } else steps.push(['Confirmation sent by email', 1]);
        if (P.fee) { if (C.mods.inv) { v = invoice(n, [[P.fee[0], P.fee[1]]], 'booking', e.id, day); e.inv = v.id; steps.push([v.id + ' raised for the advance · ' + inr(v.v), 1]); } else steps.push(['No advance invoice: Invoices is not in this setup', 0]); }
        else { task(C.trade === 'retail' ? 'Pack the order for ' + n : 'Call ' + n + ' after the ' + P.w.book.toLowerCase(), l.own, day, ['lead', l.id]); steps.push([(C.trade === 'retail' ? 'Packing task set for ' : 'Follow-up task set for ') + l.own, 1]); }
        if (day > D.day) steps.push(['Reminder set for ' + LONG[(day % 7 + 7) % 7] + ' morning', 1]); else { e.rem = 1; steps.push(['Same day, so no reminder is needed', 1]); }
        log('a1', P.w.book + ' booked: ' + n, steps, ['ev', e.id]);
      } else log('', P.w.book + ' booked: ' + n, [['The booking automation is off, so nothing was sent', 0]], ['ev', e.id]);
      return e;
    };
    M.confirm = function (e) { e.st = 'confirmed'; e.log.push([D.day, 'Confirmation sent by ' + actor()]); if (C.mods.chat) say(e.n, 0, tpl('ok', e)); log('', 'Confirmation sent: ' + e.n, [], ['ev', e.id]); };
    M.nudge = function (e) { e.rem = 1; e.log.push([D.day, 'Reminder sent by ' + actor()]); if (C.mods.chat) say(e.n, 0, tpl('rem', e)); log('', 'Reminder sent: ' + e.n, [], ['ev', e.id]); };
    M.advance = function (e) { var v = invoice(e.n, [[P.fee[0], P.fee[1]]], 'booking', e.id, e.day); e.inv = v.id; e.log.push([D.day, v.id + ' raised']); log('', v.id + ' raised for the advance · ' + inr(v.v), [], ['inv', v.id]); return v; };
    /* a lead moves on: the middle stage books (where the trade works that way), the last stage wins */
    M.stage = function (l, s) {
      if (s <= l.s) return; if (s === 2) return M.win(l);
      if (P.mid) { M.book(l.n, P.w.book + ' · ' + l.d); return; }
      l.s = 1; touch(l, P.st[1]); log('', P.st[1] + ': ' + l.n, C.trade === 'build' ? [['Quote for ' + inr(l.v) + ' shared with the client', 1]] : [], ['lead', l.id]);
    };
    /* deal won → invoice → stock reserved → (low stock) → purchase order */
    M.win = function (l) {
      if (l.s === 2) return; var steps = []; l.s = 2; D.won += l.v; touch(l, 'Won · ' + inr(l.v));
      if (C.autos.a2) {
        if (C.mods.inv) { var v = dealInv(l); steps.push([v.id + ' raised · ' + inr(v.v), 1]); } else steps.push(['No invoice: Invoices is not in this setup', 0]);
        if (C.mods.stock) steps.push(reserve(l)); else steps.push(['No stock reserved: Inventory is not in this setup', 0]);
        log('a2', P.w.won + ': ' + l.n, steps, ['lead', l.id]);
      } else log('', P.w.won + ': ' + l.n + ' · ' + inr(l.v), [['That automation is off: the invoice and the stock are yours to do', 0]], ['lead', l.id]);
      low();
    };
    M.raise = function (l) { var v = dealInv(l); log('', v.id + ' raised · ' + inr(v.v), [], ['inv', v.id]); return v; };
    M.hold = function (l) { var r = reserve(l); log('', r[0], [], ['lead', l.id]); low(); };
    /* invoice paid → stock issued → a job for the person on site */
    M.pay = function (v, how) {
      if (v.st === 'paid') return; var steps = [['Receipt sent to ' + v.n, 1]], l, e, s; how = how || 'UPI';
      v.st = 'paid'; v.over = 0; v.flag = 0; D.paid += v.v; D.pays.unshift({ id: v.id, n: v.n, v: v.v, how: how, day: D.day }); v.log.push([D.day, 'Paid · ' + how]);
      if (v.src === 'deal' && (l = by(D.leads, v.ref))) {
        touch(l, v.id + ' paid');
        if (l.res) { s = D.stock[l.need[0]]; s.q -= l.res; s.res -= l.res; move(s, -l.res, 'out', 'Issued to ' + l.n); steps.push([l.res + ' × ' + s.n + ' issued from stock', 1]); l.out += l.res; l.res = 0; }
        if (C.mods.field && !l.job) { e = job(l); steps.push([P.w.job + ' set for ' + LONG[e.day % 7] + ' · ' + person('field'), 1]); }
      }
      if (v.src === 'booking' && (e = by(D.ev, v.ref))) { e.paid = 1; e.log.push([D.day, 'Advance paid']); steps.push([P.w.book + ' marked as paid', 1]); }
      log('', v.id + ' paid · ' + inr(v.v), steps, ['inv', v.id]);
    };
    M.remind = function (v) { remind(v, 0); };
    M.reorder = function (i) { var p = draft(i, 'Reordered by ' + actor()); log('', p.id + ' drafted · ' + p.q + ' ' + D.stock[i].u + ' of ' + p.n, [], ['po', p.id]); return p; };
    M.approve = function (p) { p.st = 'ordered'; p.eta = D.day + 2; log('', p.id + ' approved and sent to ' + p.sup, [['Due ' + LONG[p.eta % 7], 1]], ['po', p.id]); };
    M.receive = receive; M.openPO = openPO;
    M.sweep = function () { low(); D.invs.forEach(function (v) { if (v.st === 'sent' && v.over && !v.rem && C.autos.a4) remind(v, 1); }); };
    /* on site: check in, tick the list, finish → the customer is told and what is left to pay is raised */
    M.checkin = function (e) { e.on = 1; e.log.push([D.day, e.who + ' checked in']); log('', e.who + ' is on site: ' + e.n, [['The office was told', 1]].concat(C.mods.portal ? [['The customer portal shows “On site”', 1]] : []), ['ev', e.id]); };
    function finish(e, grp) {
      if (e.done) return; var l = by(D.leads, e.lead), steps = [], bal, v, t = (e.job ? P.w.job + ' done' : P.w.fin); e.done = 1; e.on = 1; e.log.push([D.day, 'Finished by ' + e.who]); if (l) touch(l, e.w.split(' · ')[0] + ' done');
      if (C.autos.a5) {
        steps.push([C.mods.chat ? 'Customer told on WhatsApp' : 'Customer told by email', 1]); if (C.mods.chat) say(e.n, 0, tpl('done', e));
        bal = l && l.s === 2 && !l.bal && P.adv[1] < 1 && (e.job || !C.mods.field) ? Math.round(l.v * (1 - P.adv[1])) : 0;
        if (bal && C.mods.inv) { v = invoice(l.n, [['Balance · ' + l.d, bal]], 'bal', l.id, D.day + 3); l.bal = v.id; steps.push([v.id + ' raised for the balance · ' + inr(bal), 1]); }
        else if (l && l.s < 2) { task('Call ' + l.n + ': how did the ' + P.w.book.toLowerCase() + ' go?', l.own, D.day, ['lead', l.id]); steps.push(['Follow-up task set for ' + l.own, 1]); }
      } else steps.push(['That automation is off, so nobody was told', 0]);
      if (grp) grp.push([t, e.n, steps]); else log(C.autos.a5 ? 'a5' : '', t + ': ' + e.n, steps, ['ev', e.id]);
    }
    M.finish = function (e) { finish(e); };
    /* the counter (retail): a sale is an invoice paid on the spot, and stock that leaves the shelf */
    M.sale = function (items, total) {
      var v = invoice('Walk-in sale', items.map(function (i) { return [D.stock[i].n, P.price[i]]; }), 'sale', null, D.day);
      items.forEach(function (i) { D.stock[i].q--; move(D.stock[i], -1, 'out', 'Sold at the counter · ' + v.id); });
      v.st = 'paid'; v.log.push([D.day, 'Paid · UPI at the counter']); D.paid += total; D.won += total; D.pays.unshift({ id: v.id, n: v.n, v: total, how: 'UPI', day: D.day });
      log('', 'Sale ' + inr(total) + ' · ' + v.id, [['Stock updated', 1]], ['inv', v.id]); low();
    };
    /* the assistant answers, files the lead and, when asked, books */
    M.ask = function (i) {
      var x = D.qr[i], n = x[2][0], l; D.qr.splice(i, 1); say(n, 1, x[0]); say(n, 0, x[1]); thread(n).un = 0;
      l = lead(n, x[2][1], x[2][2], x[2][3], 'WhatsApp'); log('', 'WhatsApp enquiry: ' + n, [['Answered by the assistant', 1], ['Lead filed for ' + l.own, 1]], ['lead', l.id]);
      if (x[3] && C.mods.cal) M.book(n, P.w.book + ' · ' + l.d, D.day + (x[3] > 1 ? Math.max(1, (x[3] - D.day % 7 + 7) % 7) : 1));
      return n;
    };
    M.done = function (k) { k.done = k.done ? 0 : 1; };
    /* typed in by a person: a new enquiry from the form, a reply in a chat */
    M.add = function (n, dsc, v, item, src, own) { var l = lead(n, dsc, v, item, src); if (own) l.own = own; log('', 'New ' + P.st[0].toLowerCase() + ': ' + n, [['Filed for ' + l.own, 1]], ['lead', l.id]); return l; };
    M.send = function (n, txt) { say(n, 0, txt); };
    /* the clock: the team works, deliveries arrive, reminders go out, unpaid invoices turn overdue, quiet leads get noticed */
    M.tick = function () {
      var d = ++D.day, n = [], x; hush = [];
      D.ev.forEach(function (e) { if (e.day < d && !e.done) finish(e, n); });
      if (n.length === 1) log(C.autos.a5 ? 'a5' : '', n[0][0] + ': ' + n[0][1], n[0][2], null);
      else if (n.length) log(C.autos.a5 ? 'a5' : '', 'Yesterday’s work closed: ' + n.map(function (y) { return y[1]; }).join(', '), n.reduce(function (a, y) { return a.concat(y[2].slice(1)); }, [[C.autos.a5 ? 'Each customer was told' : 'Nobody was told: that automation is off', C.autos.a5 ? 1 : 0]]), null);
      n = [];
      D.pos.forEach(function (p) { if (p.st === 'ordered' && p.eta <= d) receive(p); });
      D.ev.forEach(function (e) { if (e.day === d && !e.rem && C.autos.a1) { e.rem = 1; e.log.push([d, 'Reminder sent']); if (C.mods.chat) say(e.n, 0, tpl('rem', e)); n.push(e.n); } });
      if (n.length) log('a1', (n.length > 1 ? n.length + ' reminders' : 'Reminder') + ' sent this morning', [[n.join(', '), 1]], null);
      D.invs.forEach(function (v) {
        if (v.st !== 'sent' || v.due >= d) return; var first = !v.over; v.over = 1;
        if (C.autos.a4) { if (first || (d - v.due) % 3 === 0) remind(v, 1); } else if (first) { v.flag = 1; log('', v.id + ' is overdue · ' + v.n, [['The overdue automation is off: chase it by hand', 0]], ['inv', v.id]); }
      });
      if (C.autos.a6) { n = D.leads.filter(function (l) { return l.s < 2 && d - l.last >= 2 && !l.nudge; }); n.forEach(function (l) { l.nudge = 1; task('Call ' + l.n + ': quiet for two days', l.own, d, ['lead', l.id]); }); if (n.length) log('a6', n.length + (n.length > 1 ? ' leads have' : ' lead has') + ' gone quiet', [[n.map(function (l) { return l.n; }).join(', '), 1], ['Tasks set for whoever owns them', 1]], null); }
      if ((x = P.night[D.nt])) { D.nt++; if (C.mods.chat) { say(x[0], 1, 'Hi, I saw you online. I am asking about: ' + x[1] + '.'); say(x[0], 0, P.bot + ' I have noted that down. Someone will call you by 10 am.'); var l = lead(x[0], x[1], x[2], x[3], 'WhatsApp'); log('', 'Enquiry at 11:40 pm: ' + x[0], [['Answered by the assistant', 1], ['Lead filed for ' + l.own, 1]], ['lead', l.id]); } else if (D.nt === 1) log('', 'Enquiry at 11:40 pm went unanswered', [['The WhatsApp assistant would have replied and filed it', 0]], null); }
      x = hush; hush = null;
      M.emit({ day: d, a: '', t: LONG[d % 7] + ' morning', s: x.length ? x.slice(0, 5).map(function (e) { return [(e.a ? '⚡ ' : '') + e.t, 1]; }).concat(x.length > 5 ? [['and ' + (x.length - 5) + ' more', 1]] : []) : [['A quiet night: nothing needed doing', 1]], ref: null, dayc: 1 });
    };
    return M.reset();
  }
  window.Biz = { PACK: PACK, MODS: MODS, AUTOS: AUTOS, autos: autos, DAYS: DAYS, LONG: LONG, inr: inr, short: short, dn: dn, make: make };
})();
