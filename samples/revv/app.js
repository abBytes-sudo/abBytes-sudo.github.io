/* Revv shared layer: storage, formatting, listings state, leads (the CRM flow), wishlist, compare tray, card markup, report generator.
   Everything is demo data in localStorage (keys start with "revv:"). */
(function () {
  'use strict';
  var DATA = window.REVV_DATA;
  var R = window.Revv = {};
  var K = { leads: 'revv:leads', wish: 'revv:wish', cmp: 'revv:compare', status: 'revv:status', extra: 'revv:extra', dealerKyc: 'revv:kyc', sellers: 'revv:sellers', me: 'revv:dealer' };
  R.K = K;
  R.get = function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  R.set = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  R.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  R.$ = function (s, r) { return (r || document).querySelector(s); };
  R.$$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  // ---------- formatting ----------
  R.inr = function (n) {
    if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
    if (n >= 1e5) return '₹' + (n / 1e5).toFixed(n >= 1e6 ? 1 : 2).replace(/\.?0+$/, '') + ' L';
    return '₹' + Math.round(n).toLocaleString('en-IN');
  };
  R.inrFull = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  R.km = function (n) { return Math.round(n).toLocaleString('en-IN') + ' km'; };
  R.own = function (n) { return n === 1 ? '1st owner' : n === 2 ? '2nd owner' : n + 'rd owner'; };
  R.title = function (l) { return l.year + ' ' + l.make + ' ' + l.model; };
  R.body = function (l) { return DATA.BODY[l.body] || l.body; };
  R.blurb = function (l) { return l.spec.engine || l.spec.motor || l.spec.power; };
  R.dealers = function () { var k = R.get(K.dealerKyc, {}); var st = k.status || {}; return DATA.dealers.concat((k.applicants || []).filter(function (a) { return st[a.id] === 'verified'; })).map(function (d) { return st[d.id] ? Object.assign({}, d, { kyc: st[d.id] }) : d; }); };
  R.dealer = function (id) { return R.dealers().filter(function (d) { return d.id === id; })[0] || DATA.dealers[0]; };
  R.ago = function (t) { var m = Math.round((Date.now() - t) / 60000); if (m < 1) return 'just now'; if (m < 60) return m + ' min ago'; var h = Math.round(m / 60); if (h < 24) return h + ' h ago'; return Math.round(h / 24) + ' d ago'; };

  // ---------- listings (base + admin-approved additions, with dealer status overrides) ----------
  // listings waiting for moderation (dealer submissions); seeded once so the dealer app and admin agree
  R.extra = function () {
    var e = R.get(K.extra, null); if (e) return e; var now = Date.now();
    e = [
      { id: 'varno-vela-n-black', type: 'car', body: 'sedan', make: 'Varno', model: 'Vela N Night', year: 2024, km: 4200, owners: 1, fuel: 'Petrol', trans: 'Automatic', price: 2890000, dealer: 'marina', city: 'Chennai', img: 'x-tunnel', color: 'Obsidian black', approved: false, submitted: now - 5 * 3600e3, photos: 14,
        spec: { engine: '2.0 turbo petrol', power: '280 PS', gearbox: '8-speed DCT', extras: 'Night pack, matrix LEDs' }, desc: 'Night edition with the dual-clutch gearbox and matrix headlamps. Garaged, 4,200 km.', score: 149 },
      { id: 'aurex-s4-noir', type: 'car', body: 'sedan', make: 'Aurex', model: 'S4 Noir', year: 2022, km: 21800, owners: 1, fuel: 'Petrol', trans: 'Automatic', price: 1490000, dealer: 'deccan', city: 'Hyderabad', img: 'x-sil', color: 'Midnight', approved: false, submitted: now - 26 * 3600e3, photos: 9,
        spec: { engine: '1.6 turbo petrol', power: '180 PS', gearbox: '8-speed automatic', extras: 'Ventilated seats' }, desc: 'Midnight sedan with ventilated seats. Report attached; one advisory on rear tyres.', score: 144 },
      { id: 'halvard-rr-shadow', type: 'bike', body: 'superbike', make: 'Halvard', model: 'RR 1000 Shadow', year: 2022, km: 7100, owners: 1, fuel: 'Petrol', trans: 'Manual', price: 1990000, dealer: 'ghat', city: 'Pune', img: 'x-shadow', color: 'Stealth black', approved: false, submitted: now - 50 * 3600e3, photos: 6,
        spec: { engine: '999cc inline-four', power: '207 PS', weight: '199 kg wet', extras: 'Titanium slip-on, stock can included' }, desc: 'Stealth black superbike. Aftermarket titanium can, original exhaust included.', score: 0 },
      { id: 'ishiro-n9-street', type: 'bike', body: 'naked', make: 'Ishiro', model: 'N9 Street', year: 2023, km: 3900, owners: 1, fuel: 'Petrol', trans: 'Manual', price: 820000, dealer: 'redline', city: 'Mumbai', img: 'x-shape', color: 'Graphite', approved: false, draft: true, submitted: now - 20 * 3600e3, photos: 11,
        spec: { engine: '890cc triple', power: '119 PS', weight: '189 kg wet', extras: 'Bar-end mirrors' }, desc: 'Graphite triple with bar-end mirrors. Waiting on the 150-point inspection.', score: 0 }
    ];
    R.set(K.extra, e); return e;
  };
  R.listings = function (opts) {
    var extra = R.extra().filter(function (x) { return opts && opts.all ? true : x.approved; });
    var st = R.get(K.status, {}), pr = R.get('revv:price', {});
    return DATA.listings.concat(extra).map(function (l) { var s = st[l.id], o = Object.assign({ status: 'live' }, l); if (s) o.status = s; if (pr[l.id]) { o.was = l.price; o.price = pr[l.id]; } return o; });
  };
  R.byId = function (id) { return R.listings({ all: true }).filter(function (l) { return l.id === id; })[0]; };
  // registration + paperwork, derived and stable per listing
  R.reg = function (l) { var r = R.rng(l.id + 'reg'), m = ['Jan', 'Mar', 'Apr', 'Jun', 'Aug', 'Sep', 'Nov'][Math.floor(r() * 7)];
    return { rto: (DATA.RTO && DATA.RTO[l.city]) || 'MH-02', month: m, ins: (r() < 0.7 ? 'Comprehensive' : 'Zero-dep') + ' · to ' + m + ' ' + (new Date().getFullYear() + 1), keys: l.type === 'bike' ? (r() < 0.8 ? 2 : 1) : 2, puc: 'Valid · ' + (['Feb', 'May', 'Jul', 'Oct'][Math.floor(r() * 4)]) + ' ' + (new Date().getFullYear() + 1) }; };
  R.img = function (l, small) { return 'photos/' + l.img + (small ? '-s' : '') + '.jpg'; };

  // ---------- seeded random (stable per listing) ----------
  R.rng = function (seed) { var h = 2166136261; for (var i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); } return function () { h += 0x6D2B79F5; var t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  // ---------- 150-point report ----------
  var ADV = {
    bike: [['Tyres and wheels', 'Rear tyre at 3.1 mm, replace within 2,000 km'], ['Brakes', 'Front pads at 40%, fine for now'], ['Exterior and paint', 'Light scuff on the left bar end'], ['Suspension and steering', 'Fork seals serviced, no weep'], ['Electricals', 'Battery at 78%, charged and tested'], ['Engine and transmission', 'Chain slack adjusted to spec'], ['Cabin and controls', 'Clutch lever replaced with OEM part']],
    car: [['Tyres and wheels', 'Rear tyres at 4.2 mm, even wear'], ['Exterior and paint', 'Repainted front bumper (stone chips), 186 µm'], ['Brakes', 'Rear discs lipped, skimmed'], ['Cabin and controls', 'Driver seat bolster wear, minor'], ['Electricals', '12 V battery replaced'], ['Suspension and steering', 'Alignment set after inspection'], ['Engine and transmission', 'Transmission fluid changed']]
  };
  R.report = function (l) {
    var r = R.rng(l.id), fails = 150 - (l.score || 146), pool = ADV[l.type].slice();
    pool.sort(function () { return r() - 0.5; });
    var adv = pool.slice(0, Math.max(1, Math.min(pool.length, fails)));
    var groups = DATA.GROUPS.map(function (g) { return { name: g[0], total: g[1], ok: g[1] }; });
    adv.forEach(function (a) { var g = groups.filter(function (x) { return x.name === a[0]; })[0]; if (g) g.ok--; });
    var left = fails - adv.length; while (left > 0) { var g = groups[Math.floor(r() * groups.length)]; if (g.ok > g.total - 3) { g.ok--; left--; } }
    var ok = groups.reduce(function (s, g) { return s + g.ok; }, 0);
    var paint = l.type === 'car' ? Math.round(108 + r() * 18) : Math.round(96 + r() * 20);
    return { groups: groups, advisories: adv, ok: ok, paint: paint, inspector: ['A. Menon', 'R. Iyer', 'S. Khanna', 'D. Pillai', 'N. Shaikh'][Math.floor(r() * 5)], date: new Date(Date.now() - (3 + Math.floor(r() * 20)) * 864e5) };
  };
  R.service = function (l) {
    var r = R.rng(l.id + 's'), out = [], km = 0, step = l.type === 'bike' ? 6000 : 10000, y = l.year;
    var jobs = l.type === 'bike' ? ['First service, oil and filter', 'Oil, filter, chain kit inspected', 'Valve clearance check, plugs', 'Brake fluid, coolant flush', 'Oil, air filter, fork oil'] : ['First service, oil and filter', 'Oil, filters, brake fluid', 'Major service, spark plugs, coolant', 'Oil, cabin filter, alignment', 'Gearbox fluid, wipers, battery test'];
    if (l.fuel === 'Electric') jobs = ['Software update, tyre rotation', 'Brake fluid, cabin filter', 'Battery health test, coolant check', 'Tyre rotation, alignment'];
    var i = 0; while (km + step < l.km || i === 0) { km = Math.min(l.km - 300, (i + 1) * step - Math.floor(r() * 900)); if (km < 500) km = 800; out.push({ km: km, date: new Date(y + Math.floor(i * 0.8), Math.floor(r() * 12), 4 + Math.floor(r() * 22)), job: jobs[i % jobs.length], where: i % 3 === 2 ? 'Independent specialist' : 'Authorised workshop' }); i++; if (i > 6) break; }
    return out.reverse();
  };

  // ---------- leads (the system flow: enquiry / test ride / chat -> dealer CRM) ----------
  var STAGES = R.STAGES = ['New', 'Test ride', 'Finance', 'Sold'];
  var SEEDV = 5; // bump to re-seed the sample workload (visitor-made leads are kept)
  var FIRST = ['Aarav', 'Diya', 'Rohan', 'Meera', 'Kunal', 'Sana', 'Arjun', 'Nikhil', 'Tara', 'Zoya', 'Vivek', 'Isha', 'Aditya', 'Neha', 'Kabir', 'Ira', 'Farhan', 'Anika', 'Dev', 'Riya', 'Omkar', 'Tanvi', 'Yash', 'Pooja'];
  var LAST = ['Mehta', 'Nair', 'Gupta', 'Iyer', 'Shah', 'Qureshi', 'Reddy', 'Joshi', 'Fernandes', 'Khan', 'Rao', 'Kapoor', 'Bose', 'Pillai', 'Malhotra', 'Desai', 'Sheikh', 'Menon', 'Bhatt', 'Kulkarni'];
  var ASK = {
    New: ['Is the price negotiable if I pay in full this week?', 'Can I see the service file before I come in?', 'Does it come with both keys and the original exhaust?', 'Kitne ka final hoga? Cash buyer, can close Saturday.', 'Is the quickshifter factory fitted?', 'Any chance of a home test ride in Bandra?', 'Will you take my 2019 naked bike in part-exchange?', 'Is the battery health report recent?'],
    'Test ride': ['Confirming the slot. Bringing my brother along, he rides too.', 'Can we do the ride on the highway stretch, not just the lane?', 'Running 15 minutes late, sorry!', 'Will the tyres be warmed up? Want to feel the quickshifter.'],
    Finance: ['Can you do 15% down over 4 years?', 'Bank wants the RC copy and insurance. Can you share?', 'Is 10.5% the best rate you have?', 'Salary credited on the 1st, can we close after that?'],
    Sold: ['Thanks! When does the RC transfer finish?', 'Picked it up, rides beautifully. Thank you Kabir!', 'Can you send the invoice PDF again?']
  };
  var SRC = ['Marketplace', 'Chat', 'Marketplace', 'Instagram', 'Walk-in', 'Chat', 'Marketplace', 'Call', 'Marketplace', 'Chat', 'Instagram', 'Marketplace'];
  function hhmm(d) { return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function day(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  R.slotOf = function (d) { return day(d) + ' ' + hhmm(d); };
  R.slotDate = function (s) { return s ? new Date(s.replace(' ', 'T')) : null; };
  R.slotTxt = function (s) { var d = R.slotDate(s); return d && !isNaN(d) ? d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' + hhmm(d) : s; };
  function seedLeads() {
    var out = [], now = Date.now(), n = 0;
    // within opening hours: round to the next half hour between 10:00 and 19:00
    function at(dayOff, h, m) { var d = new Date(); d.setDate(d.getDate() + dayOff); d.setHours(h, m || 0, 0, 0); return d; }
    var soon = new Date(now + 165 * 60e3); soon.setMinutes(Math.ceil(soon.getMinutes() / 15) * 15, 0, 0); // a ride in under three hours
    if (soon.getHours() < 9 || soon.getHours() >= 21) soon = at(soon.getHours() < 9 ? 0 : 1, 11, 30);
    DATA.dealers.forEach(function (d, di) {
      var ls = DATA.listings.filter(function (l) { return l.dealer === d.id; }); if (!ls.length) return;
      var r = R.rng('lead-' + d.id), count = Math.min(13, 7 + ls.length * 2);
      // stage plan: the first three are calls waiting, then rides, quotes and sales
      var plan = ['New', 'New', 'New', 'Test ride', 'Test ride', 'Finance', 'New', 'Sold', 'Test ride', 'Finance', 'Sold', 'New', 'Test ride'];
      var ageH = [3.4, 0.7, 26, 30, 50, 96, 5.5, 220, 72, 140, 400, 1.6, 20];
      var replyMin = 7 + (di * 37) % 118; // each dealer answers at their own pace
      for (var i = 0; i < count; i++) {
        if (i > 7 && i !== 12 && r() < 0.3) continue;
        var l = ls[(i + di) % ls.length], stage = plan[i], src = SRC[(i + di) % SRC.length], t = now - ageH[i] * (i === 0 || i === 3 || i === 8 ? 1 : 0.7 + r() * 0.8) * 3600e3;
        var name = FIRST[(i * 7 + di * 5) % FIRST.length] + ' ' + LAST[(i * 11 + di * 7 + 3) % LAST.length];
        var ask = ASK[stage][(i + di) % ASK[stage].length], slot = null, where = null;
        if (stage === 'Test ride') { var sd = i === 3 ? soon : i === 4 ? at(1, 11, 0) : i === 8 ? at(0, 17, 30) : at(2 + (di % 3), 12, 30); slot = R.slotOf(sd); where = i === 3 && d.focus !== 'Cars' ? 'Home ride, ' + d.area : 'Showroom'; }
        if (stage === 'Finance') { var fd = new Date(t + 864e5); fd.setHours(12, 30, 0, 0); slot = R.slotOf(fd); }
        var lead = { id: 'L' + (1000 + n++), seed: true, listing: l.id, dealer: d.id, name: name, phone: '98' + String(10 + (n % 80)) + ' ••• ••' + String(10 + (n * 7) % 89), kind: slot ? 'test' : 'enquiry', slot: slot, where: where, msg: ask, stage: stage, at: t, src: src,
          contacted: !(stage === 'New' && (i === 0 || (i === 1 && di % 2 === 0) || (i === 11 && di % 3 === 0))), thread: [{ from: 'buyer', at: t, txt: ask }], log: [{ at: t, txt: (src === 'Chat' ? 'Lead from website chat: ' : src === 'Walk-in' ? 'Walk-in enquiry: ' : 'Enquiry: ') + ask }] };
        if (lead.contacted) { lead.thread.push({ from: 'dealer', at: t + replyMin * 60e3, txt: stage === 'New' ? 'Hi ' + name.split(' ')[0] + ', thanks for asking. Yes, happy to help. When can you come by?' : 'Done. See you then, ' + name.split(' ')[0] + '.' }); lead.log.push({ at: t + replyMin * 60e3, txt: 'Replied on WhatsApp' }); }
        if (stage === 'New' && i === 6) { lead.attempts = 1; lead.log.push({ at: t + 3600e3, txt: 'Call: no answer. Retry later.' }); lead.contacted = false; lead.retryAt = now - 600e3; }
        if (slot && stage === 'Test ride') lead.log.push({ at: t + 50 * 60e3, txt: 'Test ride booked for ' + R.slotTxt(slot) + (where ? ' (' + where + ')' : '') });
        if (stage === 'Finance') { lead.log.push({ at: t + 864e5, txt: 'Test ride done. Wants a finance quote.' }); if (i === 9) lead.quote = { down: 20, months: 48, rate: 10.5, at: t + 9e7 }; }
        if (stage === 'Sold') { lead.soldAt = i === 7 ? now - 6 * 864e5 : now - 34 * 864e5; lead.price = Math.round(l.price * (i === 7 ? 0.98 : 0.97) / 1000) * 1000; lead.paid = i !== 7; lead.log.push({ at: lead.soldAt, txt: 'Sold for ' + R.inr(lead.price) }); }
        if (i === 12) { lead.lost = 'Price'; lead.log.push({ at: t + 3600e3, txt: 'Lost: price. Buyer chose a cheaper listing.' }); }
        out.push(lead);
      }
      // last quarter's settled sales, so statements have history
      [62, 93].forEach(function (dAgo, k) { var l2 = ls[k % ls.length]; out.push({ id: 'L' + (1000 + n++), seed: true, listing: l2.id + '-prev' + k, prevTitle: (l2.year - 1) + ' ' + l2.make + ' ' + l2.model, prevImg: l2.img, dealer: d.id, name: FIRST[(n * 3) % FIRST.length] + ' ' + LAST[(n * 11) % LAST.length], phone: '98•• ••• •••', kind: 'enquiry', stage: 'Sold', at: now - (dAgo + 9) * 864e5, soldAt: now - dAgo * 864e5, price: Math.round(l2.price * 0.82 / 1000) * 1000, paid: true, src: 'Marketplace', contacted: true, thread: [], log: [{ at: now - dAgo * 864e5, txt: 'Sold' }] }); });
    });
    return out;
  }
  R.leads = function () {
    var v = R.get(K.leads, null);
    if (!v || R.get('revv:seedv', 0) !== SEEDV) { var mine = (v || []).filter(function (x) { return !x.seed; }); v = mine.concat(seedLeads()); R.set(K.leads, v); R.set('revv:seedv', SEEDV); }
    return v;
  };
  R.saveLeads = function (v) { R.set(K.leads, v); };
  R.addLead = function (o) {
    var all = R.leads(); var l = R.byId(o.listing) || {}, now = Date.now(), src = o.src || (o.kind === 'test' ? 'Marketplace' : o.kind === 'walk-in' ? 'Walk-in' : 'Marketplace');
    var first = o.kind === 'test' ? 'Test ride booked for ' + R.slotTxt(o.slot) + (o.where ? ' (' + o.where + ')' : '') : 'Enquiry: ' + (o.msg || 'asked for a call back');
    var lead = { id: 'L' + now.toString(36).toUpperCase().slice(-5), listing: o.listing, dealer: o.dealer || l.dealer, name: o.name, phone: o.phone, kind: o.kind, slot: o.slot || null, where: o.where || null, msg: o.msg || '', stage: o.kind === 'test' ? 'Test ride' : 'New', at: now, fresh: true, src: src, convo: o.convo || null, contacted: false,
      thread: o.msg ? [{ from: 'buyer', at: now, txt: o.msg }] : [], log: [{ at: now, txt: (src === 'Chat' ? 'From website chat. ' : '') + first }] };
    all.unshift(lead); R.saveLeads(all); if (!o.keepDealer) R.set(K.me, lead.dealer); return lead;
  };
  R.COMMISSION = 0.015; // 1.5% of the sale price, owed by the dealer to Revv

  // ---------- wishlist + compare ----------
  R.wish = function () { return R.get(K.wish, []); };
  R.toggleWish = function (id) { var w = R.wish(), i = w.indexOf(id); if (i < 0) w.push(id); else w.splice(i, 1); R.set(K.wish, w); R.refreshCounts(); return i < 0; };
  R.cmp = function () { return R.get(K.cmp, []); };
  R.toggleCmp = function (id) { var c = R.cmp(), i = c.indexOf(id); if (i < 0) { if (c.length >= 3) { R.toast('Compare holds three. Remove one first.'); return false; } c.push(id); } else c.splice(i, 1); R.set(K.cmp, c); R.renderTray(); R.refreshCounts(); return i < 0; };
  R.refreshCounts = function () {
    R.$$('[data-count-wish]').forEach(function (e) { var n = R.wish().length; e.textContent = n; e.hidden = !n; });
    R.$$('[data-wish]').forEach(function (b) { var on = R.wish().indexOf(b.dataset.wish) > -1; b.setAttribute('aria-pressed', on); });
    R.$$('[data-cmp]').forEach(function (b) { var on = R.cmp().indexOf(b.dataset.cmp) > -1; b.setAttribute('aria-pressed', on); var t = b.querySelector('.t'); if (t) t.textContent = on ? 'Comparing' : 'Compare'; });
  };

  // ---------- card ----------
  R.card = function (l, i) {
    var d = R.dealer(l.dealer), st = l.status && l.status !== 'live' ? '<span class="flag flag-' + l.status + '">' + (l.status === 'reserved' ? 'Reserved' : 'Sold') + '</span>' : '';
    return '<article class="card" data-id="' + l.id + '">' +
      '<a class="card-img" href="vehicle.html?id=' + l.id + '" aria-label="' + R.esc(R.title(l)) + '"><img src="' + R.img(l, true) + '" alt="' + R.esc(l.color + ' ' + R.title(l)) + '" loading="lazy" decoding="async" width="720" height="480">' + st +
      (l.model3d ? '<span class="flag flag-3d">3D walk-around</span>' : '') + '</a>' +
      '<div class="card-b"><p class="card-k"><span>' + (i != null ? String(i + 1).padStart(2, '0') + ' · ' : '') + R.esc(R.body(l)) + '</span><span class="score" title="Inspection score">' + l.score + '<small>/150</small></span></p>' +
      '<h3 class="card-t"><a href="vehicle.html?id=' + l.id + '">' + R.esc(R.title(l)) + '</a></h3>' +
      '<p class="card-s">' + R.esc(R.blurb(l)) + ' · ' + R.km(l.km) + ' · ' + R.own(l.owners) + ' · ' + R.reg(l).rto + '</p>' +
      '<p class="card-p"><b>' + R.inr(l.price) + '</b><span>' + R.esc(l.city) + ' · ' + R.esc(d.name) + '</span></p>' +
      '<div class="card-a"><button type="button" class="ic" data-wish="' + l.id + '" aria-pressed="false" aria-label="Save ' + R.esc(R.title(l)) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button>' +
      '<button type="button" class="cmp" data-cmp="' + l.id + '" aria-pressed="false"><span class="box" aria-hidden="true"></span><span class="t">Compare</span></button></div></div></article>';
  };

  // ---------- compare tray + dialog ----------
  R.renderTray = function () {
    var tray = R.$('#tray'); if (!tray) return; var c = R.cmp().map(R.byId).filter(Boolean);
    tray.hidden = !c.length; document.body.classList.toggle('has-tray', !!c.length);
    tray.querySelector('.tray-items').innerHTML = c.map(function (l) { return '<span class="tray-i"><img src="' + R.img(l, true) + '" alt="" width="64" height="42">' + R.esc(l.make + ' ' + l.model) + '<button type="button" data-untray="' + l.id + '" aria-label="Remove ' + R.esc(R.title(l)) + ' from compare">×</button></span>'; }).join('') +
      (c.length < 3 ? '<span class="tray-hint">' + (3 - c.length) + ' more slot' + (c.length === 2 ? '' : 's') + '</span>' : '');
    tray.querySelector('[data-open-cmp]').disabled = c.length < 2;
  };
  R.openCompare = function () {
    var dlg = R.$('#cmpdlg'); if (!dlg) return; var c = R.cmp().map(R.byId).filter(Boolean);
    var rows = [['Price', function (l) { return R.inr(l.price); }, 'min', function (l) { return l.price; }], ['Inspection', function (l) { return l.score + '/150'; }, 'max', function (l) { return l.score; }], ['Year', function (l) { return l.year; }, 'max', function (l) { return l.year; }], ['Odometer', function (l) { return R.km(l.km); }, 'min', function (l) { return l.km; }], ['Owners', function (l) { return R.own(l.owners); }, 'min', function (l) { return l.owners; }],
      ['Body', R.body], ['Engine / motor', R.blurb], ['Power', function (l) { return l.spec.power || '—'; }], ['Fuel', function (l) { return l.fuel; }], ['Gearbox', function (l) { return l.trans; }], ['City', function (l) { return l.city; }], ['Registered', function (l) { var g = R.reg(l); return g.rto + ' · ' + g.month + ' ' + l.year; }], ['Insurance', function (l) { return R.reg(l).ins; }], ['Dealer', function (l) { return R.dealer(l.dealer).name; }],
      ['EMI from', function (l) { return R.inr(R.emi(l.price * 0.8, 10.5, 60)) + '/mo'; }, 'min', function (l) { return l.price; }]];
    var html = '<table class="cmp-t"><thead><tr><th scope="col"><span class="sr">Spec</span></th>' + c.map(function (l) { return '<th scope="col"><img src="' + R.img(l, true) + '" alt="" width="240" height="160"><a href="vehicle.html?id=' + l.id + '">' + R.esc(R.title(l)) + '</a></th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { var best = null; if (r[2]) { var vals = c.map(r[3]); best = r[2] === 'min' ? Math.min.apply(null, vals) : Math.max.apply(null, vals); }
        return '<tr><th scope="row">' + r[0] + '</th>' + c.map(function (l) { var w = best != null && r[3](l) === best && c.length > 1; return '<td' + (w ? ' class="best"' : '') + '>' + R.esc(r[1](l)) + (w ? ' <span class="sr">(best)</span>' : '') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
    dlg.querySelector('.cmp-body').innerHTML = html; dlg.showModal();
  };
  R.emi = function (p, rate, n) { var r = rate / 1200; return r ? p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : p / n; };

  // ---------- field validation (inline, human messages) ----------
  var MSG = { name: ['Tell us your name so the dealer knows who to expect.', function (v) { return v.trim().length >= 2; }],
    phone: ['That doesn’t look like a mobile number. Ten digits, please (it is never shown publicly).', function (v) { return v.replace(/\D/g, '').replace(/^91/, '').length === 10; }],
    area: ['Add an area or pin code so the inspector can find you.', function (v) { return v.trim().length >= 3; }],
    licence: ['A test ride needs a valid licence. Tick the box to confirm you have one.', function (v, el) { return el.checked; }] };
  R.validate = function (fields) {
    var first = null;
    fields.forEach(function (f) { var el = f[0], m = MSG[f[1]], ok = m[1](el.value || '', el), err = document.getElementById(el.id + '-e');
      el.setAttribute('aria-invalid', !ok); if (err) err.textContent = ok ? '' : m[0];
      if (!ok && !first) first = el;
      if (!el._v) { el._v = 1; el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', function () { if (el.getAttribute('aria-invalid') === 'true' && m[1](el.value || '', el)) { el.setAttribute('aria-invalid', 'false'); if (err) err.textContent = ''; } }); } });
    if (first) { first.focus(); var fm = first.closest('form'); if (fm) { fm.classList.toggle('shake', false); void fm.offsetWidth; fm.classList.add('shake'); } }
    return !first;
  };

  // ---------- images fade in once decoded (a shimmer sits underneath) ----------
  document.addEventListener('load', function (e) { var t = e.target; if (t.tagName === 'IMG') t.classList.add('in'); }, true);
  addEventListener('DOMContentLoaded', function () { R.$$('img').forEach(function (i) { if (i.complete && i.naturalWidth) i.classList.add('in'); }); });

  // ---------- toast ----------
  R.toast = function (html, ms) {
    var t = R.$('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.innerHTML = html; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('on'); }, ms || 4200);
  };

  // ---------- global wiring ----------
  document.addEventListener('click', function (e) {
    var w = e.target.closest('[data-wish]'); if (w) { var on = R.toggleWish(w.dataset.wish); R.toast(on ? 'Saved to your shortlist.' : 'Removed from your shortlist.'); R.refreshCounts(); return; }
    var c = e.target.closest('[data-cmp]'); if (c) { R.toggleCmp(c.dataset.cmp); return; }
    var u = e.target.closest('[data-untray]'); if (u) { R.toggleCmp(u.dataset.untray); return; }
    if (e.target.closest('[data-open-cmp]')) { R.openCompare(); return; }
    if (e.target.closest('[data-clear-cmp]')) { R.set(K.cmp, []); R.renderTray(); R.refreshCounts(); return; }
    var x = e.target.closest('[data-close]'); if (x) { var d = x.closest('dialog'); if (d) d.close(); }
    // card image -> give it the shared view-transition name just before navigating
    var ci = e.target.closest('.card-img, .card-t a'); if (ci) { var card = ci.closest('.card'); var img = card && card.querySelector('img'); if (img) img.style.viewTransitionName = 'v-hero'; }
  });
  // mobile menu
  var mb = R.$('#mbtn'), menu = R.$('#menu');
  if (mb && menu) mb.addEventListener('click', function () { var o = mb.getAttribute('aria-expanded') === 'true'; mb.setAttribute('aria-expanded', !o); menu.hidden = o; document.body.classList.toggle('menu-open', !o); });
  // header state
  var hdr = R.$('.hdr'); if (hdr) { var onS = function () { hdr.classList.toggle('scrolled', scrollY > 40); }; addEventListener('scroll', onS, { passive: true }); onS(); }
  document.addEventListener('DOMContentLoaded', function () { R.refreshCounts(); R.renderTray(); });
  // restore bfcache states (view-transition names)
  addEventListener('pageshow', function () { R.$$('.card img').forEach(function (i) { i.style.viewTransitionName = ''; }); R.refreshCounts(); R.renderTray(); });
})();
