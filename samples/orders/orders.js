/* Northlane orders: shared data layer for the tracking page and the admin (design sample). The catalogue and photographs come from the store; orders live in this browser only. */
(function () {
  'use strict';
  var P = window.NLCAT.P, byId = window.NLCAT.byId;
  // product photograph for thumbnails (4:5), shared with the store catalogue
  function img(p) { return '<img src="../store/products/' + p.id + '.jpg" alt="" width="90" height="112" loading="lazy" decoding="async">'; }

  /* ── order model, seed data and persistence (localStorage only, never leaves the browser) ── */
  var KEY = 'nl-orders-v1', H = 36e5, DAYMS = 864e5;
  var STEPS = [{ k: 'placed', l: 'Placed' }, { k: 'packed', l: 'Packed' }, { k: 'shipped', l: 'Shipped' }, { k: 'out', l: 'Out for delivery' }, { k: 'delivered', l: 'Delivered' }];
  var IDX = {}, LABEL = {}; STEPS.forEach(function (s, i) { IDX[s.k] = i; LABEL[s.k] = s.l; });
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function fmtD(ts) { var d = new Date(ts); return DAY[d.getDay()] + ', ' + MON[d.getMonth()] + ' ' + d.getDate(); }
  function fmtT(ts) { var d = new Date(ts), h = d.getHours(), m = d.getMinutes(); return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'AM' : 'PM'); }
  function fmtDT(ts) { return fmtD(ts) + ' · ' + fmtT(ts); }
  function ago(ts) { var m = Math.max(1, Math.round((Date.now() - ts) / 6e4)); return m < 60 ? m + 'm' : m < 1440 ? Math.round(m / 60) + 'h' : Math.round(m / 1440) + 'd'; }
  function dayStart(ts) { var d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }

  var CUST = [
    ['Priya Nair', 'priya.nair', '12 Alder Court', 'Portland, OR', '97205', 'United States'], ['Tom Whitaker', 'tom.whitaker', '7 Marlow Terrace', 'Bristol', 'BS1 4QD', 'United Kingdom'],
    ['Chloe Bennett', 'chloe.bennett', '301 Harbour Street', 'Vancouver, BC', 'V6B 2M9', 'Canada'], ['Marcus Reid', 'marcus.reid', '55 Elm Grove', 'Austin, TX', '78704', 'United States'],
    ['Sofia Alvarez', 'sofia.alvarez', '19 Calle Luna, Apt 4', 'Miami, FL', '33130', 'United States'], ['Daniel Cho', 'daniel.cho', '220 Pine Street', 'Seattle, WA', '98101', 'United States'],
    ['Hannah Berg', 'hannah.berg', '4 Fjord Lane', 'Chicago, IL', '60614', 'United States'], ['Oliver Grant', 'oliver.grant', '31 Wharf Road', 'London', 'N1 7GU', 'United Kingdom'],
    ['Aisha Rahman', 'aisha.rahman', '9 Cedar Mews', 'Manchester', 'M4 1HN', 'United Kingdom'], ['Lucas Moreau', 'lucas.moreau', '146 rue Saint-Denis', 'Montréal, QC', 'H2X 3K8', 'Canada'],
    ['Maya Okafor', 'maya.okafor', '48 Linden Row', 'Brooklyn, NY', '11215', 'United States'], ['Ethan Brooks', 'ethan.brooks', '62 Oak Terrace', 'Denver, CO', '80206', 'United States'],
    ['Grace Liu', 'grace.liu', '1408 Market Street, Apt 9', 'San Francisco, CA', '94102', 'United States'], ['Noah Fischer', 'noah.fischer', '17 Birch Avenue', 'Boston, MA', '02116', 'United States'],
    ['Isla Campbell', 'isla.campbell', '23 Queen’s Crescent', 'Edinburgh', 'EH3 6JT', 'United Kingdom'], ['Rafael Costa', 'rafael.costa', '500 Congress Avenue', 'Austin, TX', '78701', 'United States'],
    ['Zoe Hartman', 'zoe.hartman', '8 Willow Close', 'Nashville, TN', '37203', 'United States'], ['Amir Haddad', 'amir.haddad', '75 Lakeshore Boulevard', 'Toronto, ON', 'M5V 1A1', 'Canada'],
    ['Emma Larsson', 'emma.larsson', '3 Juniper Way', 'Minneapolis, MN', '55401', 'United States'], ['Kenji Sato', 'kenji.sato', '270 Mission Road', 'Los Angeles, CA', '90012', 'United States'],
    ['Charlotte Dubois', 'charlotte.dubois', '41 Albion Place', 'Leeds', 'LS1 5AA', 'United Kingdom'], ['Ben Okonkwo', 'ben.okonkwo', '98 Fulton Street', 'New York, NY', '10038', 'United States'],
    ['Leah Goldberg', 'leah.goldberg', '16 Maple Hollow', 'Philadelphia, PA', '19103', 'United States'], ['Sam Delaney', 'sam.delaney', '5 Rowan Drive', 'Atlanta, GA', '30308', 'United States'],
    ['Nina Petrova', 'nina.petrova', '212 Sunset Boulevard', 'San Diego, CA', '92101', 'United States'], ['Jack Morrison', 'jack.morrison', '34 Station Road', 'Cambridge', 'CB1 2JD', 'United Kingdom'],
    ['Fatima Zahra', 'fatima.zahra', '11 Spruce Street', 'Calgary, AB', 'T2P 1J9', 'Canada'], ['Owen Gallagher', 'owen.gallagher', '60 Bayview Avenue', 'Boston, MA', '02110', 'United States'],
    ['Mei Tanaka', 'mei.tanaka', '7 Orchard Lane', 'Portland, ME', '04101', 'United States'], ['Lucy Harper', 'lucy.harper', '29 Dune Road', 'Santa Cruz, CA', '95060', 'United States'],
    ['Victor Mendes', 'victor.mendes', '140 Canal Street', 'New Orleans, LA', '70130', 'United States']
  ];
  // hours before "now" for each order, newest first; the first four are always placed earlier today
  var AGO = [0, 0, 0, 0, 19, 27, 35, 44, 52, 61, 71, 84, 99, 112, 126, 140, 152, 168, 181, 197, 214, 230, 247, 262, 280, 298, 318, 336, 350, 368, 384];
  var STAT = ['placed', 'placed', 'placed', 'placed', 'placed', 'packed', 'packed', 'packed', 'shipped', 'shipped', 'out', 'shipped', 'out'];
  var PAYM = ['Visa ···· 4242', 'Mastercard ···· 5555', 'Apple Pay', 'PayPal', 'Visa ···· 1881', 'Amex ···· 0005'];
  var LOW = { 'drift-runner|0': 3, 'atelier-tote|1': 2, 'meridian-38|1': 4, 'harbor-jacket|0': 4, 'coast-sunglasses|2': 0, 'loop-hoodie|1': 5, 'court-low|1': 4 };

  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function carrierFor(o) { return o.method === 'Express' ? 'Arrowpost Express' : 'Parcelwise Standard'; }
  function genTrack(o, r) { r = r || Math.random; var n = ''; for (var i = 0; i < 9; i++) n += Math.floor(r() * 10); return (o.method === 'Express' ? 'AP' : 'PW') + n; }
  function sub(o) { return o.items.reduce(function (a, it) { return a + byId[it.id].price * it.q; }, 0); }
  function total(o) { return sub(o) + o.ship; }
  function count(o) { return o.items.reduce(function (a, it) { return a + it.q; }, 0); }

  function seed() {
    var now = Date.now(), day = dayStart(now), r = rng(20482), orders = [], stock = {}, k, j;
    for (k = 0; k < CUST.length; k++) {
      var c = CUST[k], status = k < STAT.length ? STAT[k] : 'delivered', i = IDX[status], t;
      t = k < 4 ? now - (k + 1) * (now - day) / 5 : Math.min(now - AGO[k] * H, day - (10 + (k - 3) * 40) * 6e4);
      var n = 1 + (r() < .45) + (r() < .15), pool = P.slice(), items = [];
      while (n-- > 0) { var p = pool.splice(Math.floor(r() * pool.length), 1)[0]; items.push({ id: p.id, c: Math.floor(r() * p.colors.length), s: p.sizes[Math.floor(r() * p.sizes.length)], q: (r() < .15 && p.price < 100) ? 2 : 1 }); }
      if (k === 10) items = [{ id: 'harbor-jacket', c: 0, s: 'M', q: 1 }, { id: 'field-cap', c: 2, s: 'One size', q: 1 }];
      var o = { id: 'NL-' + (10492 - k), email: c[1] + '@example.com', name: c[0], addr: { l1: c[2], city: c[3], pc: c[4], cn: c[5] }, items: items, method: (k !== 10 && r() < .3) ? 'Express' : 'Standard', pay: { status: 'Paid', method: PAYM[Math.floor(r() * PAYM.length)] }, status: status, ev: { placed: t } };
      o.ship = o.method === 'Express' ? 18 : (sub(o) >= 150 ? 0 : 8);
      if (k === 1) o.pay = { status: 'Pending', method: 'Bank transfer' };
      if (k === 20) o.pay = { status: 'Refunded', method: o.pay.method };
      var gaps = [0, 2 + r() * 5, 10 + r() * 10, 30 + r() * 14, 3 + r() * 5], ts = t;
      for (j = 1; j <= i; j++) { ts += gaps[j] * H; o.ev[STEPS[j].k] = ts; }
      for (j = i; j >= 1; j--) { var lim = j === i ? now - 20 * 6e4 : o.ev[STEPS[j + 1].k] - 30 * 6e4; o.ev[STEPS[j].k] = Math.min(o.ev[STEPS[j].k], lim); }
      if (k === 10) o.ev.out = now - 95 * 6e4;
      if (i >= 2) { o.carrier = carrierFor(o); o.tracking = genTrack(o, r); }
      orders.push(o);
    }
    P.forEach(function (p) { p.colors.forEach(function (_, ci) { stock[p.id + '|' + ci] = 16 + Math.floor(r() * 30); }); });
    var s = { v: 1, seededAt: now, orders: orders, stock: stock };
    Object.keys(LOW).forEach(function (key) { stock[key] = reserved(s, key) + LOW[key]; });
    return s;
  }
  function reserved(s, key) { var n = 0; s.orders.forEach(function (o) { if (o.status === 'placed') o.items.forEach(function (it) { if (it.id + '|' + it.c === key) n += it.q; }); }); return n; }
  function avail(s, key) { return (s.stock[key] || 0) - reserved(s, key); }

  var mem = null;
  function save(s) { mem = s; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function load(force) {
    if (mem && !force) return mem;
    var s = null; try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!s || s.v !== 1 || !s.orders || !s.seededAt) { s = seed(); save(s); }
    else { // keep the demo "live": slide every timestamp forward by the whole days elapsed since seeding
      var n = Math.floor((Date.now() - s.seededAt) / DAYMS);
      if (n >= 1) { var d = n * DAYMS; s.orders.forEach(function (o) { Object.keys(o.ev).forEach(function (k) { o.ev[k] += d; }); }); s.seededAt += d; save(s); }
    }
    mem = s; return s;
  }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} mem = null; return load(); }
  function advance(s, o, to, opts) {
    if (IDX[to] !== IDX[o.status] + 1) return false;
    if (to === 'packed') o.items.forEach(function (it) { var key = it.id + '|' + it.c; s.stock[key] = Math.max(0, (s.stock[key] || 0) - it.q); });
    if (to === 'shipped') { o.tracking = (opts && opts.tracking) || o.tracking || genTrack(o); o.carrier = carrierFor(o); }
    o.status = to; o.ev[to] = Date.now(); save(s); return true;
  }
  function find(num, email) {
    var v = String(num).trim().toUpperCase().replace(/[^A-Z0-9]/g, ''), m = v.match(/^(?:NL)?(\d{5})$/); v = m ? 'NL-' + m[1] : v;
    email = String(email).trim().toLowerCase();
    return load().orders.filter(function (o) { return o.id === v && o.email === email; })[0] || null;
  }
  function eta(o) {
    if (o.status === 'delivered') return fmtD(o.ev.delivered) + ' · ' + fmtT(o.ev.delivered);
    if (o.status === 'out') return 'Today, by 8:00 PM';
    return fmtD(o.ev.placed + (o.method === 'Express' ? 2 : 5) * DAYMS);
  }

  window.NLO = { P: P, byId: byId, img: img, STEPS: STEPS, IDX: IDX, LABEL: LABEL, esc: esc, money: money, fmtD: fmtD, fmtT: fmtT, fmtDT: fmtDT, ago: ago, dayStart: dayStart, DAYMS: DAYMS,
    load: load, save: save, reset: reset, advance: advance, find: find, eta: eta, sub: sub, total: total, count: count, reserved: reserved, avail: avail, carrierFor: carrierFor, genTrack: genTrack };
})();
