/* Taradhura engine: dates, demo storage, seeded bookings, the rate engine, availability and booking operations.
   Shared by the public site and the back office. Everything lives in localStorage ("taradhura:*"); no network. */
(function () {
  'use strict';
  var TD = window.TD = window.TD || {};
  var P = TD.pricing;

  // ---------- dates (ISO yyyy-mm-dd, computed in UTC so nothing drifts) ----------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var DTF = {}, NF = new Intl.NumberFormat('en-IN');
  var D = TD.date = {
    today: function () { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); },
    parse: function (s) { var p = s.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); },
    iso: function (d) { return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); },
    add: function (s, n) { var d = D.parse(s); d.setUTCDate(d.getUTCDate() + n); return D.iso(d); },
    diff: function (a, b) { return Math.round((D.parse(b) - D.parse(a)) / 864e5); },
    dow: function (s) { return D.parse(s).getUTCDay(); },
    md: function (s) { return s.slice(5); },
    // Intl formatters are expensive to build, so each option set is built once
    fmt: function (s, o) { var opt = Object.assign({ day: 'numeric', month: 'short', timeZone: 'UTC' }, o || {}), k = JSON.stringify(opt); return (DTF[k] || (DTF[k] = new Intl.DateTimeFormat('en-IN', opt))).format(D.parse(s)); },
    long: function (s) { return D.fmt(s, { weekday: 'short', year: 'numeric' }); },
    wd: function (s) { return D.fmt(s, { day: undefined, month: undefined, weekday: 'short' }); },
    range: function (a, b) { var out = [], s = a; while (s < b) { out.push(s); s = D.add(s, 1); } return out; }
  };
  TD.inr = function (n) { return '₹' + NF.format(Math.round(n)); };

  // ---------- the sky over the ridge: sun and moon for a date, from standard low-precision formulas (no network) ----------
  // Hours are IST (UTC+5:30). Azimuth is measured from south, positive towards the west.
  TD.sky = (function () {
    var LAT = 29.47, LNG = 79.65, PI = Math.PI, rad = PI / 180, OB = rad * 23.4397;
    function days(ms) { return ms / 864e5 + 2440587.5 - 2451545; }
    function ra(l, b) { return Math.atan2(Math.sin(l) * Math.cos(OB) - Math.tan(b) * Math.sin(OB), Math.cos(l)); }
    function dc(l, b) { return Math.asin(Math.sin(b) * Math.cos(OB) + Math.cos(b) * Math.sin(OB) * Math.sin(l)); }
    function lst(d) { return rad * (280.16 + 360.9856235 * d) + rad * LNG; }
    function sun(d) { var M = rad * (357.5291 + 0.98560028 * d), C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)), L = M + C + rad * 102.9372 + PI; return { ra: ra(L, 0), dec: dc(L, 0) }; }
    function moon(d) { var L = rad * (218.316 + 13.176396 * d), M = rad * (134.963 + 13.064993 * d), F = rad * (93.272 + 13.22935 * d), l = L + rad * 6.289 * Math.sin(M), b = rad * 5.128 * Math.sin(F); return { ra: ra(l, b), dec: dc(l, b), dist: 385001 - 20905 * Math.cos(M) }; }
    function pos(d, c) { var H = lst(d) - c.ra, phi = rad * LAT; return { alt: Math.asin(Math.sin(phi) * Math.sin(c.dec) + Math.cos(phi) * Math.cos(c.dec) * Math.cos(H)), az: Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(c.dec) * Math.cos(phi)) }; }
    function ms(iso, h) { var p = iso.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]) + (h - 5.5) * 36e5; }
    function sunAlt(iso, h) { var d = days(ms(iso, h)); return pos(d, sun(d)).alt; }
    // first crossing of the horizon (-0.833°) between a and b hours, by bisection
    function cross(iso, a, b, up) { var h0 = -0.833 * rad, lo = a, hi = b; for (var i = 0; i < 22; i++) { var m = (lo + hi) / 2; if ((sunAlt(iso, m) > h0) === up) hi = m; else lo = m; } return (lo + hi) / 2; }
    var cache = {};
    return {
      // { rise, set } in IST hours for a date; noon altitude in degrees
      sun: function (iso) { if (!cache[iso]) { cache[iso] = { rise: cross(iso, 3, 10, true), set: cross(iso, 15, 21, false), noonAlt: sunAlt(iso, 12.3) / rad }; } return cache[iso]; },
      // the moon at an IST hour on a date: altitude and azimuth (radians), lit fraction, phase 0..1 (0 new, 0.5 full)
      moon: function (iso, h) {
        var d = days(ms(iso, h)), s = sun(d), m = moon(d), sd = 149598000;
        var phi = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra));
        var inc = Math.atan2(sd * Math.sin(phi), m.dist - sd * Math.cos(phi));
        var ang = Math.atan2(Math.cos(s.dec) * Math.sin(s.ra - m.ra), Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra));
        var p = pos(d, m);
        return { alt: p.alt, az: p.az, fraction: (1 + Math.cos(inc)) / 2, phase: 0.5 + 0.5 * inc * (ang < 0 ? -1 : 1) / PI };
      },
      phaseName: function (ph) { var n = ['new', 'waxing crescent', 'first quarter', 'waxing gibbous', 'full', 'waning gibbous', 'last quarter', 'waning crescent']; return n[Math.round(ph * 8) % 8]; },
      // now on the ridge: today's date and the hour, in IST, whatever the visitor's clock says
      now: function () { var t = new Date(Date.now() + 5.5 * 36e5); return { iso: t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate()), h: t.getUTCHours() + t.getUTCMinutes() / 60 + t.getUTCSeconds() / 3600 }; },
      hm: function (h) { var m = Math.round(((h % 24) + 24) % 24 * 60) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); },
      // what a month is like up here: mornings the range shows (of 30), nights and days in °C
      CLIMATE: [null, [22, -1, 11], [19, 1, 13], [15, 4, 17], [11, 8, 21], [7, 12, 24], [4, 14, 23], [1, 15, 20], [2, 15, 20], [9, 13, 20], [25, 8, 18], [27, 4, 15], [23, 2, 12]],
      // the scene preset for a month
      season: function (iso) { var m = +iso.slice(5, 7); return m === 12 || m <= 2 ? 'winter' : m <= 4 ? 'spring' : m <= 6 ? 'premonsoon' : m <= 9 ? 'monsoon' : 'autumn'; },
      note: function (iso) {
        var p = iso.split('-'), m = +p[1], day = +p[2], c = this.CLIMATE[m];
        var when = (day <= 10 ? 'Early ' : day <= 20 ? 'Mid-' : 'Late ') + ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m];
        var s = this.season(iso);
        if (s === 'monsoon') return when + ': cloud fills the valley most mornings and the range shows about ' + c[0] + ' in 30. Rates are about a fifth lower.';
        if (s === 'spring') return when + ': the buransh is in flower on the slopes; the range shows about ' + c[0] + ' mornings in 30. Nights near ' + c[1] + '°.';
        if (s === 'premonsoon') return when + ': warm days and a haze over the plains; the range shows about ' + c[0] + ' mornings in 30. Nights near ' + c[1] + '°.';
        return when + ': range visible about ' + c[0] + ' mornings in 30. Nights near ' + c[1] + '°.';
      }
    };
  })();
  TD.nights = function (n) { return n + (n === 1 ? ' night' : ' nights'); };

  // ---------- storage ----------
  var NS = 'taradhura:v3:';
  var S = TD.store = {
    get: function (k, d) { try { var v = localStorage.getItem(NS + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) { /* private mode: keep going in memory */ } mem[k] = v; },
    clear: function () { try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('taradhura:') === 0) localStorage.removeItem(k); }); } catch (e) {} mem = {}; }
  };
  var mem = {};
  function load(k, d) { if (mem[k]) return mem[k]; var v = S.get(k, null); if (v == null) v = d; mem[k] = v; return v; }

  // ---------- refs and deterministic randomness ----------
  var ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  TD.newRef = function () { var s = 'TD-'; for (var i = 0; i < 5; i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)]; return s; };
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ---------- seasons and rates ----------
  TD.season = function (iso) {
    var md = D.md(iso);
    for (var i = 0; i < TD.seasons.length; i++) {
      var s = TD.seasons[i];
      var hit = s.from <= s.to ? (md >= s.from && md <= s.to) : (md >= s.from || md <= s.to);
      if (hit) return s;
    }
    return TD.seasons[TD.seasons.length - 1];
  };
  TD.isWeekend = function (iso) { var d = D.dow(iso); return d === 5 || d === 6; };
  // nightly rate for a room of a type (breakfast included); occ = share of the resort booked that night (0..1)
  TD.nightly = function (typeId, iso, occ) {
    var t = TD.type(typeId), s = TD.season(iso), k = s.k;
    if (TD.isWeekend(iso)) k *= P.weekend;
    if (TD.holidays[iso] || TD.holidays[D.add(iso, 1)]) k *= 1.2;
    if (occ == null) occ = TD.occupancy(iso);
    if (occ >= P.occHigh) k *= P.occUplift;
    return Math.round(t.base * k / 100) * 100;
  };
  TD.minStay = function (iso) {
    var s = TD.season(iso);
    if (s.minStay > 1 && (!s.weekendsOnly || TD.isWeekend(iso))) return s.minStay;
    return 1;
  };
  TD.rateWhy = function (typeId, iso) {
    var s = TD.season(iso), why = [s.name + (s.k !== 1 ? ' ×' + s.k : '')];
    if (TD.isWeekend(iso)) why.push('Weekend ×' + P.weekend);
    if (TD.holidays[iso] || TD.holidays[D.add(iso, 1)]) why.push((TD.holidays[iso] || TD.holidays[D.add(iso, 1)]) + ' ×1.2');
    if (TD.occupancy(iso) >= P.occHigh) why.push('Busy night ×' + P.occUplift);
    return why;
  };

  // ---------- bookings ----------
  TD.bookings = function () { return load('bookings', null) || seed().bookings; };
  TD.saveBookings = function (list) { S.set('bookings', list); };
  TD.findBooking = function (ref) { ref = (ref || '').trim().toUpperCase(); var l = TD.bookings(); for (var i = 0; i < l.length; i++) if (l[i].ref === ref) return l[i]; return null; };
  TD.active = function (b) { return b.status !== 'cancelled'; };
  // a room is taken on a night if an active booking covers it
  function occupiedMap() {
    var m = {}; TD.bookings().forEach(function (b) { if (!TD.active(b)) return; D.range(b.checkin, b.checkout).forEach(function (d) { (m[d] = m[d] || {})[b.room] = b.ref; }); });
    return m;
  }
  var _occ = null, _occStamp = 0;
  function occ() { var l = TD.bookings(); if (!_occ || _occStamp !== l.length + ':' + (l._v || 0)) { _occ = occupiedMap(); _occStamp = l.length + ':' + (l._v || 0); } return _occ; }
  TD.invalidate = function () { _occ = null; };
  TD.occupancy = function (iso) { if (seeding) return 0; var n = occ()[iso]; return n ? Object.keys(n).length / TD.allRooms.length : 0; };
  TD.freeRooms = function (typeId, checkin, checkout, ignoreRef) {
    var t = TD.type(typeId), o = occ(), nights = D.range(checkin, checkout);
    return t.rooms.filter(function (r) { return nights.every(function (d) { return !(o[d] && o[d][r] && o[d][r] !== ignoreRef); }); });
  };
  TD.availOn = function (typeId, iso) { var t = TD.type(typeId), n = occ()[iso] || {}; return t.rooms.filter(function (r) { return !n[r]; }).length; };
  TD.roomTaken = function (room, iso) { var n = occ()[iso]; return n && n[room]; };

  // ---------- the quote ----------
  // req: { type, checkin, checkout, rooms, adults, kids:[ages], plan, addons:{id:qty}, pay:'full'|'deposit' }
  TD.quote = function (req) {
    var t = TD.type(req.type), q = { lines: [], nights: [], errors: [], notes: [] };
    if (!t || !req.checkin || !req.checkout || req.checkout <= req.checkin) { q.errors.push('dates'); return q; }
    var n = D.diff(req.checkin, req.checkout), rooms = Math.max(1, req.rooms || 1);
    var adults = req.adults || 2, kids = req.kids || [];
    q.n = n; q.rooms = rooms;
    var room = 0;
    D.range(req.checkin, req.checkout).forEach(function (d) { var r = TD.nightly(t.id, d); q.nights.push({ date: d, rate: r, why: TD.rateWhy(t.id, d) }); room += r; });
    room *= rooms;
    q.lines.push({ k: 'room', label: rooms + ' × ' + t.name + ', ' + TD.nights(n), amt: room });
    // extra adults
    var capA = t.maxAdults * rooms;
    var baseA = (t.id === 'ridge' ? 2 : t.maxAdults) * rooms;
    if (adults > capA) q.errors.push('Up to ' + capA + ' adults in ' + rooms + ' ' + (rooms > 1 ? t.plural : t.name) + '.');
    if (kids.length > t.maxKids * rooms) q.errors.push(t.maxKids ? 'Up to ' + t.maxKids * rooms + ' children here.' : t.name + ' is for adults only.');
    if (adults + kids.length > t.maxGuests * rooms) q.errors.push('That is more guests than ' + rooms + ' ' + (rooms > 1 ? t.plural : t.name) + ' sleeps.');
    if (t.extraAdult && adults > baseA) { var ea = (adults - baseA) * t.extraAdult * n; q.lines.push({ k: 'extra', label: (adults - baseA) + ' extra bed' + (adults - baseA > 1 ? 's' : '') + ' (adult)', amt: ea }); room += ea; }
    // length-of-stay
    var los = null; for (var i = 0; i < P.los.length; i++) if (n >= P.los[i].n) { los = P.los[i]; break; }
    if (los) { var off = -Math.round(room * los.off); q.lines.push({ k: 'los', label: n + '-night stay, ' + Math.round(los.off * 100) + '% off', amt: off }); room += off; }
    // meal plan
    var plan = TD.plans.filter(function (p) { return p.id === (req.plan || 'bb'); })[0] || TD.plans[0];
    var kidsHalf = kids.filter(function (a) { return a >= 6 && a <= 11; }).length, kidsFull = kids.filter(function (a) { return a >= 12; }).length;
    var meal = plan.pp * n * (adults + kidsFull + kidsHalf * 0.5);
    if (meal) q.lines.push({ k: 'plan', label: plan.name + ', ' + (adults + kidsFull) + ' adult' + (adults + kidsFull > 1 ? 's' : '') + (kidsHalf ? ' + ' + kidsHalf + ' child' : ''), amt: meal });
    // add-ons
    var add = 0, guests = adults + kids.length;
    Object.keys(req.addons || {}).forEach(function (id) {
      var a = TD.addon(id), qty = req.addons[id]; if (!a || !qty) return;
      if (a.only && a.only.indexOf(t.id) < 0) return;
      var amt = a.price * qty * (a.perNight ? n : 1);
      add += amt; q.lines.push({ k: 'addon', id: id, label: a.name + (qty > 1 ? ' × ' + qty : '') + (a.perNight ? ', ' + TD.nights(n) : ''), amt: amt });
    });
    q.subtotal = room + meal + add;
    q.gst = Math.round(q.subtotal * P.gstRate);
    q.total = q.subtotal + q.gst;
    q.ota = Math.round((room / (los ? 1 - los.off : 1)) * P.otaMarkup * (1 + P.gstRate) + (meal + add) * (1 + P.gstRate) + n * rooms * 900); // OTA rate, no breakfast
    q.save = Math.max(0, q.ota - q.total);
    q.prepaid = Math.round(q.total * (1 - P.prepaid));
    q.deposit = Math.round(q.total * P.deposit);
    q.dueNow = req.pay === 'deposit' ? q.deposit : req.pay === 'hotel' ? 0 : q.prepaid;
    // availability and minimum stay
    if (seeding) { q.free = [t.rooms[0]]; return q; } // the seed only needs totals
    q.free = TD.freeRooms(t.id, req.checkin, req.checkout, req.ignoreRef);
    // a room chosen on the ridge (home page windows) goes first when it is free
    if (req.room && q.free.indexOf(req.room) > 0) { q.free.splice(q.free.indexOf(req.room), 1); q.free.unshift(req.room); }
    q.chosen = !!(req.room && q.free[0] === req.room);
    if (q.free.length < rooms) q.errors.push(q.free.length ? 'Only ' + q.free.length + ' ' + (q.free.length > 1 ? t.plural : t.name) + ' free for these dates.' : t.plural + (t.rooms.length > 1 ? ' are' : ' is') + ' full for these dates.');
    var ms = TD.minStay(req.checkin); if (n < ms) q.errors.push('A minimum of ' + ms + ' nights applies from ' + D.fmt(req.checkin) + '.');
    return q;
  };

  // ---------- create / change / cancel ----------
  TD.createBooking = function (req, guest, pay) {
    var q = TD.quote(req); if (q.errors.length) return { error: q.errors[0] };
    var list = TD.bookings(), made = [];
    var ref = TD.newRef(); while (TD.findBooking(ref)) ref = TD.newRef();
    for (var i = 0; i < (req.rooms || 1); i++) {
      made.push({ ref: i ? ref + '-' + (i + 1) : ref, group: req.rooms > 1 ? ref : null, type: req.type, room: q.free[i], checkin: req.checkin, checkout: req.checkout,
        adults: i ? 0 : req.adults, kids: i ? [] : (req.kids || []), plan: req.plan || 'bb', addons: i ? {} : (req.addons || {}), guest: guest, source: 'Direct · website',
        status: 'confirmed', pay: { mode: pay.mode, method: pay.method, paid: i ? 0 : pay.paid, total: i ? 0 : q.total }, total: i ? 0 : q.total, created: new Date().toISOString(), log: [{ at: new Date().toISOString(), what: 'Booked on the website (' + pay.method + ')' }] });
    }
    list.push.apply(list, made); list._v = (list._v || 0) + 1; TD.saveBookings(list); TD.invalidate();
    TD.addMessage(ref, 'desk', TD.fill('confirm', made[0]), 'confirm');
    return { booking: made[0], quote: q };
  };
  TD.updateBooking = function (ref, fn, note) {
    var list = TD.bookings(), b = null;
    for (var i = 0; i < list.length; i++) if (list[i].ref === ref) b = list[i];
    if (!b) return null; fn(b); if (note) (b.log = b.log || []).push({ at: new Date().toISOString(), what: note });
    list._v = (list._v || 0) + 1; TD.saveBookings(list); TD.invalidate(); return b;
  };
  TD.requote = function (b) { return TD.quote({ type: b.type, checkin: b.checkin, checkout: b.checkout, rooms: 1, adults: b.adults || 2, kids: b.kids || [], plan: b.plan, addons: b.addons, ignoreRef: b.ref }); };
  TD.refundFor = function (b, today) {
    var days = D.diff(today || D.today(), b.checkin), monsoon = TD.season(b.checkin).id === 'monsoon', paid = (b.pay && b.pay.paid) || 0;
    var pct = monsoon ? (days >= 7 ? 1 : 0.5) : days >= 21 ? 1 : days >= 7 ? 0.5 : 0;
    return { days: days, pct: pct, amount: Math.round(paid * pct), rule: monsoon ? 'Monsoon: free until 7 days before arrival' : 'Free until 21 days before; 50% until 7 days' };
  };

  // ---------- messages, enquiries, experience bookings ----------
  TD.messages = function () { TD.bookings(); return load('messages', null) || {}; };
  TD.addMessage = function (ref, from, text, tpl) {
    var m = TD.messages(); (m[ref] = m[ref] || []).push({ from: from, text: text, at: new Date().toISOString(), tpl: tpl || null, read: from === 'desk' });
    S.set('messages', m); return m[ref];
  };
  TD.enquiries = function () { TD.bookings(); return load('enquiries', null) || []; };
  TD.saveEnquiries = function (l) { S.set('enquiries', l); };
  TD.slots = function () { TD.bookings(); return load('slots', null) || []; };
  TD.saveSlots = function (l) { S.set('slots', l); };
  TD.slotTaken = function (exp, date, time) { return TD.slots().filter(function (s) { return s.exp === exp && s.date === date && s.time === time && s.status !== 'cancelled'; }).reduce(function (a, s) { return a + s.guests; }, 0); };

  TD.fill = function (tplId, b, extra) {
    var t = TD.templates.filter(function (x) { return x.id === tplId; })[0]; if (!t) return '';
    var T = TD.type(b.type), n = D.diff(b.checkin, b.checkout), m = +b.checkin.slice(5, 7);
    var low = [null, -2, 0, 3, 7, 11, 14, 15, 15, 12, 8, 3, 0][m];
    var map = { first: (b.guest && b.guest.first) || 'there', type: T ? T.name : '', checkin: D.fmt(b.checkin, { weekday: 'short' }), checkout: D.fmt(b.checkout, { weekday: 'short' }), nights: TD.nights(n), ref: b.ref, low: low, arrival: (b.guest && b.guest.arrival) || 'not yet shared', note: (extra && extra.note) || 'light snow is likely on the night of your arrival; the road is ploughed by 8 am' };
    return t.body.replace(/\{(\w+)\}/g, function (_, k) { return map[k] != null ? map[k] : ''; });
  };

  // ---------- the seed (relative to today, so the demo is always live) ----------
  var FIRST = ['Aarav', 'Ananya', 'Rohan', 'Meera', 'Kabir', 'Ira', 'Vikram', 'Nandini', 'Arjun', 'Sana', 'Dev', 'Tara', 'Aditya', 'Priya', 'Karan', 'Riya', 'Siddharth', 'Neha', 'Imran', 'Zoya', 'Rahul', 'Kavya', 'Nikhil', 'Isha', 'Harish', 'Shreya', 'Manish', 'Aditi', 'Farhan', 'Gauri', 'Yash', 'Pooja', 'Anil', 'Lakshmi', 'Sameer', 'Radhika', 'Varun', 'Mehak', 'Tenzin', 'Joanna'];
  var LAST = ['Sharma', 'Iyer', 'Mehta', 'Bisht', 'Kapoor', 'Rao', 'Malhotra', 'Negi', 'Banerjee', 'Qureshi', 'Menon', 'Chopra', 'Joshi', 'Sinha', 'Nair', 'Reddy', 'Pant', 'Ahluwalia', 'Das', 'Fernandes', 'Khanna', 'Agarwal', 'Rawat', 'Dutta', 'Shetty', 'Saxena', 'Kohli', 'Bhatt', 'Gill', 'Mathur'];
  var CITY = ['Delhi', 'Gurugram', 'Noida', 'Mumbai', 'Bengaluru', 'Lucknow', 'Dehradun', 'Pune', 'Kolkata', 'Hyderabad', 'Chandigarh', 'Jaipur', 'Ahmedabad', 'Chennai', 'Haldwani', 'Bareilly'];
  var SOURCES = [['Direct · website', 0.36], ['OTA', 0.32], ['Phone / WhatsApp', 0.16], ['Travel agent', 0.1], ['Corporate', 0.06]];
  var REQUESTS = ['Anniversary, would love a cake', 'Arriving by the Shatabdi, need a pickup', 'Vegetarian, no onion or garlic', 'Travelling with a toddler; cot please', 'Early riser, chai at 5:30 please', 'Allergic to nuts', 'Working remotely, need a desk', 'Our dog is coming (a beagle)', 'Celebrating 60th birthday of my father', 'Honeymoon', '', '', '', '', ''];
  function pickW(r, arr) { var x = r(), a = 0; for (var i = 0; i < arr.length; i++) { a += arr[i][1]; if (x <= a) return arr[i][0]; } return arr[0][0]; }

  var seeding = false;
  function seed() {
    seeding = true;
    var today = D.today(), r = rng(20261124), list = [], refs = {};
    mem.bookings = list; _occ = null;
    function ref() { var s; do { s = 'TD-'; for (var i = 0; i < 5; i++) s += ALPHA[Math.floor(r() * ALPHA.length)]; } while (refs[s]); refs[s] = 1; return s; }
    var start = D.add(today, -40), end = D.add(today, 150);
    TD.allRooms.forEach(function (room) {
      var d = start;
      while (d < end) {
        var s = TD.season(d), we = TD.isWeekend(d), days = D.diff(today, d);
        var p = s.id === 'festive' ? 0.75 : s.id === 'monsoon' ? 0.22 : s.id.indexOf('peak') === 0 ? 0.5 : 0.32;
        if (we) p += 0.22; if (room.type === 'star') p += 0.08; if (days > 60) p *= 0.7; if (days > 100) p *= 0.6;
        if (r() < p) {
          var n = 1 + Math.floor(r() * r() * 5) + (r() < 0.5 ? 1 : 0); n = Math.max(TD.minStay(d), n);
          var co = D.add(d, n), t = TD.type(room.type);
          var g = { first: FIRST[Math.floor(r() * FIRST.length)], last: LAST[Math.floor(r() * LAST.length)], city: CITY[Math.floor(r() * CITY.length)] };
          g.email = (g.first + '.' + g.last).toLowerCase() + '@example.com';
          g.phone = '+91 ' + (70 + Math.floor(r() * 29)) + '••• ••' + Math.floor(100 + r() * 899);
          g.arrival = ['12:30', '14:00', '15:30', '16:00', '17:30', ''][Math.floor(r() * 6)];
          g.requests = REQUESTS[Math.floor(r() * REQUESTS.length)];
          var src = pickW(r, SOURCES), adults = Math.min(t.maxAdults, room.type === 'orchard' ? 2 + Math.floor(r() * 3) : 2), kids = [];
          if (t.maxKids && r() < 0.3) kids.push(3 + Math.floor(r() * 9));
          var plan = ['bb', 'hb', 'hb', 'fb'][Math.floor(r() * 4)];
          var addons = {}; if (r() < 0.4) addons.kgm = 2; if (r() < 0.3) addons.bird = adults; if (r() < 0.2) addons.stars = adults; if (r() < 0.12) addons.deck = 1;
          var b = { ref: ref(), type: room.type, room: room.id, checkin: d, checkout: co, adults: adults, kids: kids, plan: plan, addons: addons, guest: g, source: src, created: D.add(d, -(7 + Math.floor(r() * 60))) + 'T10:00:00Z' };
          var q = TD.quote(Object.assign({}, b, { rooms: 1, pay: 'full' }));
          var total = q.total || 0;
          b.total = total;
          b.status = co < today ? 'checked-out' : d < today ? 'in-house' : d === today ? 'confirmed' : (r() < 0.08 ? 'tentative' : 'confirmed');
          var mode = src === 'OTA' ? 'ota' : src === 'Corporate' ? 'invoice' : r() < 0.55 ? 'full' : 'deposit';
          var paid = b.status === 'checked-out' ? total : mode === 'full' ? Math.round(total * 0.95) : mode === 'deposit' ? Math.round(total * 0.3) : mode === 'ota' ? 0 : 0;
          b.pay = { mode: mode, method: mode === 'ota' ? 'Collected by OTA' : mode === 'invoice' ? 'Company invoice' : ['UPI', 'Card', 'Bank transfer'][Math.floor(r() * 3)], paid: paid, total: total };
          b.log = [{ at: b.created, what: 'Booked via ' + src }];
          list.push(b);
          d = D.add(co, Math.floor(r() * 3));
        } else d = D.add(d, 1);
      }
    });
    // a few cancellations (they no longer hold rooms)
    list.forEach(function (b) { if (b.status === 'confirmed' && r() < 0.05) { b.status = 'cancelled'; b.log.push({ at: new Date().toISOString(), what: 'Cancelled by guest' }); } });
    // the demo booking for "My booking": R2, 18 days out, 3 nights
    var ci = D.add(today, 18), co2 = D.add(ci, 3);
    list = list.filter(function (b) { return !(b.room === 'R2' && b.checkin < co2 && b.checkout > ci); });
    var demo = { ref: 'TD-4M8PK', type: 'ridge', room: 'R2', checkin: ci, checkout: co2, adults: 2, kids: [], plan: 'hb', addons: { kgm: 2, bird: 2 },
      guest: { first: 'Meera', last: 'Bisht', email: 'meera.bisht@example.com', phone: '+91 98••• ••214', city: 'Bengaluru', arrival: '15:30', requests: 'Our 10th anniversary. Is the Star deck free for dinner one night?' },
      source: 'Direct · website', status: 'confirmed', created: D.add(today, -6) + 'T09:12:00Z', log: [{ at: D.add(today, -6) + 'T09:12:00Z', what: 'Booked on the website (UPI)' }] };
    _occ = null; mem.bookings = list; // quote needs occupancy of the seed itself
    seeding = false;
    var dq = TD.quote(Object.assign({}, demo, { rooms: 1, pay: 'deposit', ignoreRef: demo.ref }));
    demo.total = dq.total; demo.pay = { mode: 'deposit', method: 'UPI', paid: dq.deposit, total: dq.total };
    list.push(demo);
    // messages
    var msgs = {};
    function m(refId, from, text, ago, tpl) { (msgs[refId] = msgs[refId] || []).push({ from: from, text: text, at: new Date(Date.now() - ago * 36e5).toISOString(), tpl: tpl || null, read: from === 'desk' }); }
    m('TD-4M8PK', 'desk', TD.fill('confirm', demo), 144, 'confirm');
    m('TD-4M8PK', 'guest', 'Thank you! Is the Star deck free for a private dinner on our second night? It is our 10th anniversary.', 30);
    var upcoming = list.filter(function (b) { return b.status === 'confirmed' && D.diff(today, b.checkin) <= 9 && D.diff(today, b.checkin) >= 0; }).slice(0, 6);
    var Q = ['Is the road all right for a sedan? We are driving from Delhi.', 'Could we have a cot for our daughter?', 'Our train reaches Kathgodam at 11:40. Can you send a car?', 'Is there snow expected this week?', 'Can we bring our dog? He is very calm.', 'Do you have vegan options at dinner?'];
    upcoming.forEach(function (b, i) { m(b.ref, 'desk', TD.fill('confirm', b), 200 + i * 20, 'confirm'); m(b.ref, 'guest', Q[i % Q.length], 3 + i * 5); });
    list.filter(function (b) { return b.status === 'in-house'; }).slice(0, 2).forEach(function (b, i) { m(b.ref, 'guest', ['Could we move dinner to 8:30 tonight?', 'The stove is wonderful. Could we have more wood at turndown?'][i], 1 + i); });
    // enquiries (weddings and offsites)
    var enq = [
      { id: 'EQ-1042', kind: 'Wedding', name: 'Ishita Malhotra', org: '', guests: 64, dates: 'Late March 2027, flexible', budget: '₹25–40 L', stage: 'Proposal sent', venue: 'The Orchard Lawn', created: D.add(today, -12), note: 'Intimate 3-day wedding; mehendi in the orchard, pheras at sunset. Wants buransh in bloom.' },
      { id: 'EQ-1043', kind: 'Offsite', name: 'Rahul Menon', org: 'Fernway Labs', guests: 18, dates: D.fmt(D.add(today, 40)) + ', 3 nights', budget: '₹8–12 L', stage: 'Site visit', venue: 'The Library', created: D.add(today, -9), note: 'Leadership offsite, needs a screen, a trek on day 2 and vegetarian-first menus.' },
      { id: 'EQ-1044', kind: 'Wedding', name: 'Zoya Qureshi', org: '', guests: 110, dates: 'October 2027', budget: '₹40 L+', stage: 'New', venue: 'Full buyout', created: D.add(today, -2), note: 'Full buyout for 3 nights, 110 guests including nearby hotels. Asked about a shuttle from Kathgodam.' },
      { id: 'EQ-1045', kind: 'Celebration', name: 'Aditya Iyer', org: '', guests: 22, dates: D.fmt(D.add(today, 26)) + ', 2 nights', budget: '₹6–8 L', stage: 'Won', venue: 'The Ridge Deck', created: D.add(today, -20), note: 'Parents’ 40th anniversary. Ridge Deck dinner, live Kumaoni folk musicians.' },
      { id: 'EQ-1046', kind: 'Offsite', name: 'Priya Saxena', org: 'Hollow Pine Studio', guests: 12, dates: 'February 2027', budget: '₹4–6 L', stage: 'New', venue: 'The Long Room', created: D.add(today, -1), note: 'Design team retreat; wants workshops in the mornings and walks in the afternoons.' },
      { id: 'EQ-1039', kind: 'Wedding', name: 'Karan Gill', org: '', guests: 150, dates: 'December 2026', budget: '₹30 L', stage: 'Lost', venue: 'The Orchard Lawn', created: D.add(today, -48), note: 'Over our capacity for the dates; referred to a Nainital venue.' }
    ];
    // experience bookings for the next week
    var slots = [], sid = 500;
    for (var dd = -1; dd < 8; dd++) {
      var day = D.add(today, dd);
      TD.experiences.forEach(function (e) {
        e.slots.forEach(function (tm) {
          if (r() < 0.65) {
            var k = 1 + Math.floor(r() * 3);
            for (var j = 0; j < k; j++) {
              var gst = list[Math.floor(r() * list.length)];
              var g2 = Math.min(e.cap, 1 + Math.floor(r() * 3));
              if (TD.slotTakenIn(slots, e.id, day, tm) + g2 > e.cap) continue;
              slots.push({ id: 'X' + (sid++), exp: e.id, date: day, time: tm, guests: g2, name: gst.guest.first + ' ' + gst.guest.last, ref: gst.ref, room: gst.room, status: dd < 0 ? (r() < 0.9 ? 'attended' : 'no-show') : 'booked' });
            }
          }
        });
      });
    }
    var out = { bookings: list, messages: msgs, enquiries: enq, slots: slots };
    mem.bookings = list; mem.messages = msgs; mem.enquiries = enq; mem.slots = slots;
    S.set('bookings', list); S.set('messages', msgs); S.set('enquiries', enq); S.set('slots', slots);
    _occ = null;
    return out;
  }
  TD.slotTakenIn = function (slots, exp, date, time) { return slots.filter(function (s) { return s.exp === exp && s.date === date && s.time === time && s.status !== 'cancelled'; }).reduce(function (a, s) { return a + s.guests; }, 0); };
  TD.reset = function () { S.clear(); _occ = null; seed(); };
})();
