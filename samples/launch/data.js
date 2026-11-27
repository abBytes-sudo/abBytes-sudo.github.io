/* Aaranya Residences: one data model for the public site, the unit picker, the 3D massing model and the back office.
   Everything is deterministic (same seed, same demo) and lives in localStorage under "aaranya:*".
   Geometry is in metres. Site north is -Z, east is +X (three.js convention used by launch3d.js). */
(function () {
  'use strict';
  var A = window.AAR = window.AAR || {};
  var DAY = 864e5;

  /* ---------------- storage (always wrapped) ---------------- */
  var P = 'aaranya:';
  function get(k, d) { try { var v = localStorage.getItem(P + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) { /* private mode: demo keeps working in memory */ } mem[k] = v; }
  var mem = {};
  A.get = function (k, d) { var v = get(k, undefined); return v === undefined ? (k in mem ? mem[k] : d) : v; };
  A.set = set;

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  A.rng = rng; A.hash = hash; A.DAY = DAY;

  /* ---------------- project ---------------- */
  A.PROJECT = {
    name: 'Aaranya Residences', developer: 'Saptaparni Developers', sector: 'Sector 109, Dwarka Expressway, Gurugram',
    rera: 'RERA registration shown at launch', reraSite: 'haryanarera.gov.in', acres: 4.6, openPct: 79, homes: 612, story: { tower: 'A', floor: 40 },
    launch: 'September 2025', possession: 'December 2029', possessionTarget: 'June 2029',
    floorH: 3.25, lobbyH: 5.2
  };

  /* ---------------- residence types ---------------- */
  // carpet = RERA carpet area (sq ft). bal = balconies (sq ft). nominal plan size w x d (m) is used by the residences drawings.
  A.TYPES = {
    A: { id: 'A', name: 'Two-bedroom', bhk: 2, short: '2 BHK', carpet: 1012, bal: 146, w: 14.0, d: 9.8, parking: 1, color: '#7C8F6A',
      line: 'A corner living room with a 4.2 m sliding wall onto the balcony.',
      rooms: [['bal', 'Balcony', 0, 0, .62, .14], ['liv', 'Living · dining', 0, .14, .62, .62], ['bed', 'Bedroom 1', .62, 0, 1, .5], ['bed', 'Bedroom 2', .62, .5, 1, .8],
        ['kit', 'Kitchen', 0, .62, .32, 1], ['foy', 'Foyer', .32, .62, .62, 1], ['wet', 'Toilet', .62, .8, .82, 1], ['wet', 'Toilet', .82, .8, 1, 1]] },
    B: { id: 'B', name: 'Three-bedroom', bhk: 3, short: '3 BHK', carpet: 1468, bal: 212, w: 16.0, d: 11.2, parking: 2, color: '#5E7B63',
      line: 'Three bedrooms on the light side, the kitchen and utility on the corridor side.',
      rooms: [['bal', 'Balcony', 0, 0, .55, .13], ['liv', 'Living · dining', 0, .13, .55, .6], ['bed', 'Main bedroom', .55, 0, 1, .42], ['bed', 'Bedroom 2', .55, .42, 1, .72],
        ['bed', 'Bedroom 3', 0, .6, .3, 1], ['kit', 'Kitchen', .3, .6, .55, .84], ['foy', 'Foyer', .3, .84, .55, 1], ['wet', 'Bath', .55, .72, .78, 1], ['wet', 'Bath', .78, .72, 1, 1]] },
    C: { id: 'C', name: 'Three-bedroom + study', bhk: 3, short: '3 BHK + study', carpet: 1742, bal: 268, w: 18.0, d: 13.0, parking: 2, color: '#40604B',
      line: 'A study you can close off, and a wraparound balcony on the corner.',
      rooms: [['bal', 'Wraparound balcony', 0, 0, 1, .11], ['liv', 'Living · dining', 0, .11, .52, .58], ['bed', 'Main bedroom', .52, .11, 1, .46], ['bed', 'Bedroom 2', .52, .46, 1, .74],
        ['bed', 'Bedroom 3', 0, .58, .28, 1], ['std', 'Study', .28, .58, .52, .78], ['kit', 'Kitchen', .28, .78, .52, 1], ['wet', 'Bath', .52, .74, .76, 1], ['wet', 'Bath', .76, .74, 1, 1]] },
    D: { id: 'D', name: 'Four-bedroom + staff', bhk: 4, short: '4 BHK', carpet: 2386, bal: 402, w: 19.0, d: 14.0, parking: 3, color: '#24402F',
      line: 'Double-aspect corner living, a family lounge and a staff room with its own entry.',
      rooms: [['bal', 'Wraparound balcony', 0, 0, 1, .1], ['liv', 'Living', 0, .1, .48, .5], ['bed', 'Main suite', .48, .1, 1, .44], ['bed', 'Bedroom 2', .48, .44, .76, .72],
        ['bed', 'Bedroom 4', .76, .44, 1, .72], ['bed', 'Bedroom 3', 0, .5, .27, .84], ['kit', 'Kitchen', .27, .5, .48, .78], ['std', 'Staff', 0, .84, .27, 1], ['foy', 'Foyer', .27, .78, .48, 1],
        ['wet', 'Bath', .48, .72, .74, 1], ['wet', 'Bath', .74, .72, 1, 1]] }
  };

  /* ---------------- towers + floor plates ---------------- */
  // rect = [x0, z0, x1, z1] in tower-local metres; face = which z edge is the exterior facade ('n' = -z, 's' = +z); m = mirror rooms.
  A.TOWERS = [
    { id: 'A', name: 'Tower A', floors: 46, w: 48, d: 28, x: -42, z: -24, rot: 0, rate: 1.06, core: [-6, -6, 6, 6],
      note: 'The tallest of the three: 46 floors, four corner homes on each, and the Sky Club on the roof.',
      units: [['01', 'D', [-24, -14, -6, 0], 'n', 0], ['02', 'C', [6, -14, 24, 0], 'n', 1], ['03', 'D', [6, 0, 24, 14], 's', 1], ['04', 'C', [-24, 0, -6, 14], 's', 0]] },
    { id: 'B', name: 'Tower B', floors: 44, w: 44, d: 26, x: 32, z: -38, rot: 0, rate: 1.02, core: [-5, -5, 5, 5],
      note: 'Looks south over the podium gardens and north across the sector to the Expressway skyline.',
      units: [['01', 'B', [-22, -13, -5, 0], 'n', 0], ['02', 'C', [5, -13, 22, 0], 'n', 1], ['03', 'B', [5, 0, 22, 13], 's', 1], ['04', 'B', [-22, 0, -5, 13], 's', 0]] },
    { id: 'C', name: 'Tower C', floors: 42, w: 52, d: 22, x: 56, z: 22, rot: Math.PI / 2, rate: 1.0, core: [18, -11, 26, 11],
      note: 'Six homes a floor along a daylit corridor; the west side watches the sun go down over the podium.',
      units: [['01', 'A', [-26, -11, -12, -1.2], 'n', 0], ['02', 'B', [-12, -11, 4, -1.2], 'n', 0], ['03', 'A', [4, -11, 18, -1.2], 'n', 1],
        ['04', 'A', [4, 1.2, 18, 11], 's', 1], ['05', 'B', [-12, 1.2, 4, 11], 's', 0], ['06', 'A', [-26, 1.2, -12, 11], 's', 0]] }
  ];
  A.tower = function (id) { for (var i = 0; i < A.TOWERS.length; i++) if (A.TOWERS[i].id === id) return A.TOWERS[i]; return null; };
  A.CLUB = { x: -44, z: 36, w: 38, d: 20, h: 9.5, name: 'Podium Club' };
  A.SITE = { x0: -86, z0: -64, x1: 86, z1: 62, centre: [6, 4] };

  /* ---------------- units ---------------- */
  var WIND = ['North', 'North-east', 'East', 'South-east', 'South', 'South-west', 'West', 'North-west'];
  var WIND_S = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  function rot(x, z, t) { return [x * Math.cos(t) + z * Math.sin(t), -x * Math.sin(t) + z * Math.cos(t)]; }
  A.rotXZ = rot;
  function compass(dx, dz) { var a = Math.atan2(dx, -dz); if (a < 0) a += Math.PI * 2; return Math.round(a / (Math.PI / 4)) % 8; }

  var units = [], byId = {};
  A.TOWERS.forEach(function (T) {
    T.units.forEach(function (u) {
      var r = u[2], cx = (r[0] + r[2]) / 2, cz = (r[1] + r[3]) / 2;
      var w = rot(cx, cz, T.rot), wx = T.x + w[0], wz = T.z + w[1];
      // facing = direction from the tower centre to the unit centre, pushed toward the facade normal
      var n = u[3] === 'n' ? [0, -1] : [0, 1], nn = rot(n[0], n[1], T.rot), off = rot(cx, 0, T.rot);
      var fdx = nn[0] * 1.2 + off[0] / (T.w / 2), fdz = nn[1] * 1.2 + off[1] / (T.w / 2);
      var ci = compass(fdx, fdz);
      var toC = [A.SITE.centre[0] - wx, A.SITE.centre[1] - wz], L = Math.hypot(toC[0], toC[1]) || 1;
      var garden = (nn[0] * toC[0] + nn[1] * toC[1]) / L > 0.35;
      var view = garden ? 'Podium garden' : ({ N: 'City skyline', NE: 'City skyline', E: 'Sunrise side', SE: 'Podium club', S: 'Podium club', SW: 'Sunset side', W: 'Expressway · sunset', NW: 'City skyline' })[WIND_S[ci]];
      for (var f = 1; f <= T.floors; f++) {
        var id = T.id + '-' + f + u[0];
        var unit = { id: id, tower: T.id, floor: f, pos: u[0], type: u[1], rect: r, face: u[3], mirror: u[4], facing: WIND[ci], facingS: WIND_S[ci][0], facingFull: WIND_S[ci], view: view, garden: garden,
          corner: T.id !== 'C' || u[0] === '01' || u[0] === '06' || u[0] === '03' || u[0] === '04' };
        units.push(unit); byId[id] = unit;
      }
    });
  });
  A.UNITS = units;
  A.unit = function (id) { return byId[id] || null; };
  A.floorUnits = function (t, f) { return units.filter(function (u) { return u.tower === t && u.floor === f; }); };

  /* ---------------- pricing (indicative, demo) ---------------- */
  A.RATE = 18900;                 // ₹ per sq ft of RERA carpet, base
  A.CHARGES = { parking: 600000, club: 350000, ifms: 150 /* per sq ft, interest-free maintenance security */, gst: 0.05 };
  A.price = function (u) {
    if (typeof u === 'string') u = byId[u];
    var T = A.tower(u.tower), t = A.TYPES[u.type];
    var base = A.RATE * T.rate;
    var floorPLC = Math.max(0, u.floor - 4) * 55;
    var plc = (u.garden ? 450 : 0) + (u.corner ? 200 : 0);
    var top = u.floor > T.floors - 3 ? 600 : 0;
    var rate = Math.round(base + floorPLC + plc + top);
    var basic = rate * t.carpet;
    var parking = A.CHARGES.parking * t.parking, club = A.CHARGES.club, ifms = A.CHARGES.ifms * t.carpet;
    var gst = Math.round((basic + parking + club) * A.CHARGES.gst);
    var total = basic + parking + club + ifms + gst;
    return { rate: rate, base: Math.round(base), floorPLC: floorPLC, plc: plc + top, basic: basic, parking: parking, club: club, ifms: ifms, gst: gst, total: total, preGst: basic + parking + club + ifms };
  };

  /* ---------------- availability: seeded + overrides from the back office ---------------- */
  function seedStatus(u) {
    var r = rng(hash(u.id))(); var T = A.tower(u.tower);
    var pSold = 0.5 + (u.floor <= 8 ? 0.16 : 0) + (u.garden ? 0.1 : 0) - (u.floor > T.floors - 4 ? 0.14 : 0) + (u.type === 'A' ? 0.08 : 0) - (u.type === 'D' ? 0.06 : 0);
    if (r < pSold) return 'sold';
    if (r < pSold + 0.07) return 'hold';
    return 'avail';
  }
  var seeded = {}; units.forEach(function (u) { seeded[u.id] = seedStatus(u); });
  // the story floor in the hero (Tower A, 40th) keeps a readable mix
  seeded['A-4001'] = 'sold'; seeded['A-4002'] = 'avail'; seeded['A-4003'] = 'hold'; seeded['A-4004'] = 'avail';

  A.inv = function () { return A.get('inv', {}); };
  A.status = function (id) {
    var o = A.inv()[id];
    if (o) { if (o.s === 'hold' && o.until && o.until < Date.now()) return 'avail'; return o.s; }
    return seeded[id];
  };
  A.statusMeta = function (id) { return A.inv()[id] || null; };
  A.seedStatus = function (id) { return seeded[id]; };
  A.setStatus = function (id, s, meta) {
    var inv = A.inv(), prev = A.status(id);
    if (s === seeded[id] && !(meta && meta.keep)) delete inv[id];
    else inv[id] = Object.assign({ s: s, at: Date.now() }, meta || {});
    A.set('inv', inv);
    A.log({ kind: 'inv', unit: id, from: prev, to: s, by: (meta && meta.by) || 'Staff', note: (meta && meta.note) || '' });
    A.emit('inv', { id: id, s: s, prev: prev });
    return prev;
  };
  A.STATUS = { avail: { label: 'Available', c: '#3E7B55' }, hold: { label: 'On hold', c: '#C68A23' }, sold: { label: 'Sold', c: '#A39D93' } };
  A.counts = function (filter) {
    var c = { avail: 0, hold: 0, sold: 0, total: 0 };
    units.forEach(function (u) { if (filter && !filter(u)) return; c[A.status(u.id)]++; c.total++; });
    return c;
  };

  /* ---------------- tiny event bus (same tab + other tabs via storage events) ---------------- */
  var subs = {};
  A.on = function (n, fn) { (subs[n] = subs[n] || []).push(fn); };
  A.emit = function (n, d) { (subs[n] || []).forEach(function (fn) { try { fn(d); } catch (e) { } }); };
  addEventListener('storage', function (e) {
    if (!e.key || e.key.indexOf(P) !== 0) return;
    var k = e.key.slice(P.length); try { mem[k] = JSON.parse(e.newValue); } catch (x) { }
    A.emit(k, { remote: true });
  });

  /* ---------------- formatting ---------------- */
  A.inr = function (n, dp) {
    if (n >= 1e7) return '₹' + (n / 1e7).toFixed(dp == null ? 2 : dp).replace(/\.?0+$/, '') + ' Cr';
    if (n >= 1e5) return '₹' + (n / 1e5).toFixed(dp == null ? 1 : dp).replace(/\.0$/, '') + ' L';
    return '₹' + Math.round(n).toLocaleString('en-IN');
  };
  A.inrFull = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  A.sqft = function (n) { return Math.round(n).toLocaleString('en-IN') + ' sq ft'; };
  A.sqm = function (n) { return (n * 0.092903).toFixed(1) + ' m²'; };
  A.ord = function (n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  A.ago = function (t) {
    var m = Math.round((Date.now() - t) / 6e4);
    if (m < 1) return 'just now'; if (m < 60) return m + ' min ago';
    var h = Math.round(m / 60); if (h < 24) return h + ' h ago';
    var d = Math.round(h / 24); return d === 1 ? 'yesterday' : d + ' days ago';
  };
  A.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  A.dayStart = function (t) { var d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  A.fmtDay = function (t, o) { return new Date(t).toLocaleDateString('en-IN', o || { weekday: 'short', day: 'numeric', month: 'short' }); };
  A.fmtTime = function (t) { return new Date(t).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }); };
  A.minPrice = function (typeId) {
    var m = Infinity; units.forEach(function (u) { if (u.type === typeId && A.status(u.id) === 'avail') m = Math.min(m, A.price(u).total); });
    return m === Infinity ? null : m;
  };

  /* ---------------- team ---------------- */
  A.TEAM = [
    { id: 'RM', name: 'Ritika Menon', role: 'Sales manager', init: 'RM' },
    { id: 'KA', name: 'Kabir Anand', role: 'Relationship manager', init: 'KA' },
    { id: 'SQ', name: 'Sana Qureshi', role: 'Relationship manager', init: 'SQ' },
    { id: 'DM', name: 'Dev Malhotra', role: 'Relationship manager', init: 'DM' },
    { id: 'FS', name: 'Farah Siddiqui', role: 'NRI desk', init: 'FS' }
  ];
  A.member = function (id) { for (var i = 0; i < A.TEAM.length; i++) if (A.TEAM[i].id === id) return A.TEAM[i]; return A.TEAM[0]; };

  /* ---------------- site-visit slots ---------------- */
  A.SLOTS = ['10:00', '11:30', '13:00', '15:00', '16:30', '18:00'];
  A.SLOT_CAP = 3; // three relationship managers in the sales lounge
  A.slotKey = function (day, hhmm) { var d = new Date(day); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + hhmm; };
  A.slotTime = function (key) { var p = key.split(' '), d = p[0].split('-'), h = p[1].split(':'); return new Date(+d[0], +d[1] - 1, +d[2], +h[0], +h[1]).getTime(); };
  A.slotLabel = function (key) { var t = A.slotTime(key); return A.fmtDay(t) + ' · ' + A.fmtTime(t); };

  /* ---------------- seeds: enquiries + visits ---------------- */
  var NAMES = [['Aditi', 'Khurana', 'Gurugram'], ['Rohit', 'Bansal', 'New Delhi'], ['Meenakshi', 'Iyer', 'Dubai'], ['Varun', 'Sethi', 'Gurugram'], ['Harleen', 'Gill', 'Chandigarh'],
    ['Arnav', 'Kapoor', 'Noida'], ['Shalini', 'Rao', 'Singapore'], ['Karthik', 'Subramanian', 'Bengaluru'], ['Nidhi', 'Agarwal', 'Gurugram'], ['Imran', 'Sheikh', 'London'],
    ['Pallavi', 'Joshi', 'New Delhi'], ['Gaurav', 'Taneja', 'Gurugram'], ['Ruchi', 'Malhotra', 'Toronto'], ['Siddharth', 'Jain', 'Gurugram'], ['Tanvi', 'Arora', 'New Delhi'],
    ['Manpreet', 'Singh', 'Dubai'], ['Abhay', 'Chauhan', 'Faridabad'], ['Sneha', 'Pillai', 'Gurugram'], ['Yash', 'Grover', 'New Delhi'], ['Lakshmi', 'Narayanan', 'San Jose'],
    ['Kunal', 'Batra', 'Gurugram'], ['Anjali', 'Mehra', 'New Delhi'], ['Vikram', 'Rathore', 'Jaipur'], ['Fatima', 'Siddiqui', 'Riyadh'], ['Rahul', 'Khanna', 'Gurugram'],
    ['Priya', 'Venkatesh', 'Bengaluru'], ['Aman', 'Dhillon', 'Melbourne'], ['Neeraj', 'Saxena', 'Noida'], ['Ishita', 'Bose', 'Kolkata'], ['Rohan', 'Chawla', 'Gurugram'],
    ['Deepa', 'Menon', 'Dubai'], ['Arjit', 'Sharma', 'Gurugram'], ['Megha', 'Kulkarni', 'Pune'], ['Saurabh', 'Goel', 'New Delhi'], ['Nikhil', 'Bhatia', 'Gurugram'],
    ['Zoya', 'Haider', 'London'], ['Tarun', 'Ahuja', 'Faridabad'], ['Kavya', 'Reddy', 'Hyderabad'], ['Prateek', 'Mittal', 'Gurugram'], ['Simran', 'Kohli', 'Singapore']];
  var SOURCES = ['Brochure download', 'Site-visit booking', 'Unit picker', 'NRI desk', 'Channel partner', 'Walk-in', 'Cost-sheet request'];
  var REMARKS = [
    'Wants an east-facing 3 BHK above the 15th; asked twice about winter sun in the living room.',
    'Comparing with a ready-to-move tower on Golf Course Extension. Price is the objection, not the product.',
    'Husband in Dubai, joins on video. Prefers Tower A for the corner living room. Send the NRI payment note.',
    'Liked the skyline from the 34th floor in the 3D model. Wants the cost sheet for B-3403 with two parkings.',
    'Visited last Sunday with parents. Mother wants a lower floor; asked for 6th–9th options.',
    'Home-loan pre-approved for ₹1.6 Cr. Asked if the subvention plan is still open.',
    'Channel partner lead. Partner wants to hold two Tower C 2 BHKs till Friday.',
    'Downloaded the brochure at 11:40 pm. Not picked up twice; try after 6 pm.',
    'Investor; asking about rental demand near the Expressway and resale lock-in.',
    'Wants a video walkthrough of the show apartment; in London time zone.'
  ];
  var STAGES = ['new', 'contacted', 'visit', 'negotiation', 'booked', 'lost'];
  A.STAGES = { new: 'New', contacted: 'Contacted', visit: 'Visit booked', negotiation: 'Negotiation', booked: 'Booked', lost: 'Lost' };

  function seed() {
    var r = rng(20251109), now = Date.now(), today = A.dayStart(now);
    var avail = units.filter(function (u) { return seeded[u.id] !== 'sold'; });
    var leads = NAMES.map(function (n, i) {
      var src = SOURCES[i % SOURCES.length]; if (/Dubai|Singapore|London|Toronto|San Jose|Riyadh|Melbourne/.test(n[2])) src = i % 2 ? 'NRI desk' : 'Brochure download';
      var t = A.TYPES[['B', 'A', 'D', 'C', 'B', 'A', 'C', 'B', 'D', 'C'][i % 10]];
      var u = avail[Math.floor(r() * avail.length)];
      var stage = ['new', 'new', 'contacted', 'visit', 'contacted', 'negotiation', 'new', 'visit', 'contacted', 'lost', 'booked', 'contacted', 'new', 'visit', 'negotiation', 'contacted', 'new', 'visit', 'contacted', 'new'][i < 20 ? i : (i * 7) % 20];
      var created = now - Math.round((i * 0.45 + r() * 1.5) * DAY) - Math.round(r() * 8) * 36e5;
      var lead = {
        id: 'L' + (2401 + i), name: n[0] + ' ' + n[1], city: n[2], email: (n[0] + '.' + n[1]).toLowerCase() + '@example.com',
        phone: (/Dubai/.test(n[2]) ? '+971 5x xxx ' : /Riyadh/.test(n[2]) ? '+966 5x xxx ' : /Singapore/.test(n[2]) ? '+65 8xxx ' : /London/.test(n[2]) ? '+44 7xxx xx' : /Melbourne/.test(n[2]) ? '+61 4xx xxx ' : /Toronto|San Jose/.test(n[2]) ? '+1 4xx xxx ' : '+91 98xxx ') + String(1000 + Math.floor(r() * 8999)),
        source: src, interest: t.short, budget: [null, '₹2–2.5 Cr', '₹3–3.5 Cr', '₹5 Cr +', '₹3.5–4 Cr'][i % 5], unit: i % 3 === 1 ? null : u.id,
        stage: stage, owner: ['KA', 'SQ', 'DM', 'FS', 'KA'][i % 5], created: created, nri: /Dubai|Singapore|London|Toronto|San Jose|Riyadh|Melbourne/.test(n[2]),
        remark: REMARKS[i % REMARKS.length], next: stage === 'lost' || stage === 'booked' ? null : today + Math.round((r() * 4 - 1)) * DAY + (10 + Math.floor(r() * 8)) * 36e5,
        log: [{ t: created, k: 'created', s: 'Came in via ' + src.toLowerCase() }]
      };
      if (stage !== 'new') lead.log.push({ t: created + 3 * 36e5, k: 'call', s: 'Connected · shared the floor plan and price list' });
      if (stage === 'visit' || stage === 'negotiation' || stage === 'booked') lead.log.push({ t: created + DAY, k: 'visit', s: 'Site visit booked' });
      return lead;
    });
    // visits: past few days (with outcomes) and the next week
    var visits = [], vi = 0;
    leads.forEach(function (l, i) {
      if (!(l.stage === 'visit' || l.stage === 'negotiation' || l.stage === 'booked' || i % 4 === 0)) return;
      var dOff = (l.stage === 'visit' ? Math.floor(r() * 6) : -1 - Math.floor(r() * 5));
      var slot = A.slotKey(today + dOff * DAY, A.SLOTS[Math.floor(r() * A.SLOTS.length)]);
      visits.push({ id: 'V' + (731 + vi++), lead: l.id, name: l.name, unit: l.unit, slot: slot, mode: l.nri ? 'video' : (i % 3 ? 'lounge' : 'pickup'), party: 1 + Math.floor(r() * 4),
        rm: l.owner, outcome: dOff < 0 ? ['interested', 'thinking', 'interested', 'noshow'][i % 4] : null, source: l.source, created: l.created + 2 * 36e5 });
    });
    // today at the sales lounge: a full board, the morning ones already done
    [['10:00', 'interested'], ['11:30', 'thinking'], ['13:00', 'interested'], ['15:00', null], ['16:30', null], ['18:00', null]].forEach(function (s, k) {
      var l = leads[(k * 7 + 3) % leads.length], key = A.slotKey(today, s[0]), past = A.slotTime(key) < now;
      visits.push({ id: 'V' + (731 + vi++), lead: l.id, name: l.name, unit: l.unit, slot: key, mode: l.nri ? 'video' : (k % 3 ? 'lounge' : 'pickup'), party: 1 + (k % 4), rm: ['KA', 'SQ', 'DM'][k % 3], outcome: past ? (s[1] || 'interested') : null, source: l.source, created: now - (k + 2) * DAY });
    });
    // fill a few slots so the calendar shows "1 left" and "full"
    for (var k = 0; k < 9; k++) {
      var d = today + (1 + (k % 5)) * DAY, s = A.SLOTS[(k * 2 + 1) % A.SLOTS.length];
      visits.push({ id: 'V' + (731 + vi++), lead: null, name: ['Walk-in family', 'Partner client', 'Repeat visitor'][k % 3], unit: null, slot: A.slotKey(d, s), mode: 'lounge', party: 2, rm: ['KA', 'SQ', 'DM'][k % 3], outcome: null, source: 'Phone', created: now - k * 36e5 });
    }
    // sunday rush
    var sun = today; while (new Date(sun).getDay() !== 0 || sun <= today) sun += DAY;
    ['11:30', '11:30', '11:30', '15:00', '15:00'].forEach(function (s, k) { visits.push({ id: 'V' + (731 + vi++), lead: null, name: 'Weekend visitor ' + (k + 1), unit: null, slot: A.slotKey(sun, s), mode: 'lounge', party: 3, rm: ['KA', 'SQ', 'DM'][k % 3], outcome: null, source: 'Phone', created: now - k * 36e5 }); });
    // a couple of live holds so the back office has something to act on
    var inv = {};
    inv['B-3403'] = { s: 'hold', at: now - 20 * 36e5, until: now + 28 * 36e5, by: 'Sana Qureshi', note: 'Varun Sethi · cost sheet sent, cheque on Friday' };
    inv['C-701'] = { s: 'hold', at: now - 40 * 36e5, until: now + 8 * 36e5, by: 'Channel partner · Arora Homes Desk', partner: 'AHD', client: 'The Batra family', pending: true, note: 'Two Tower C 2 BHKs for a family' };
    inv['C-706'] = { s: 'hold', at: now - 40 * 36e5, until: now + 8 * 36e5, by: 'Channel partner · Arora Homes Desk', partner: 'AHD', client: 'The Batra family', pending: true, note: 'Two Tower C 2 BHKs for a family' };
    inv['A-2204'] = { s: 'sold', at: now - 3 * DAY, by: 'Ritika Menon', note: 'Booked · Pallavi Joshi, cheque cleared' };
    var pool = units.filter(function (u) { return seeded[u.id] === 'sold' && u.tower !== 'A' && u.floor > 6; }), pdeals = [];
    [['Kunal Batra', 41], ['Harleen Gill', 33], ['The Khanna family', 22], ['Abhay Chauhan', 9]].forEach(function (c, k) {
      var u = pool[(k * 37 + 11) % pool.length]; pdeals.push({ id: 'PB-' + (301 + k), unit: u.id, client: c[0], bookedAt: now - c[1] * 7 * DAY, basic: A.price(u).basic, share: A.PARTNER.share, paidAll: k > 1 });
    });
    return { leads: leads, visits: visits, inv: inv, pdeals: pdeals };
  }

  A.init = function (force) {
    if (!force && A.get('v', 0) === 5) return;
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(P) === 0 && k !== P + 'hour') localStorage.removeItem(k); }); } catch (e) { }
    // the concierge keeps its chats, leads and events under "orbit-*" (shared with other sites): drop only this site's old ones
    try {
      ['orbit-convos', 'orbit-leads', 'orbit-events'].forEach(function (k) { var a = JSON.parse(localStorage.getItem(k) || 'null'); if (Array.isArray(a)) localStorage.setItem(k, JSON.stringify(a.filter(function (x) { return !x || x.agent !== 'launch'; }))); });
      Object.keys(localStorage).forEach(function (k) { if (k === 'orbit-kb-launch' || k.indexOf('orbit-data-launch-') === 0) localStorage.removeItem(k); });
    } catch (e) { }
    var s = seed();
    set('leads', s.leads); set('visits', s.visits); set('inv', s.inv); set('pdeals', s.pdeals); set('log', []); set('v', 5);
    try { localStorage.removeItem('demo-bridge:site-visits'); } catch (e) { }
    s.visits.filter(function (v) { return v.lead && A.slotTime(v.slot) > Date.now(); }).slice(0, 4).forEach(bridge);
  };
  A.reset = function () { A.init(true); A.emit('inv', {}); A.emit('leads', {}); A.emit('visits', {}); };

  /* ---------------- leads / visits API ---------------- */
  A.leads = function () { return A.get('leads', []); };
  A.visits = function () { return A.get('visits', []); };
  A.saveLeads = function (l) { set('leads', l); A.emit('leads', {}); };
  A.saveVisits = function (v) { set('visits', v); A.emit('visits', {}); };
  A.log = function (e) { var l = A.get('log', []); e.t = Date.now(); l.unshift(e); set('log', l.slice(0, 200)); };
  A.addLead = function (d) {
    var leads = A.leads();
    var lead = Object.assign({ id: 'L' + (2401 + leads.length + Math.floor(Math.random() * 50) + 100), stage: 'new', owner: d.nri ? 'FS' : A.TEAM[1 + leads.length % 3].id, created: Date.now(), next: Date.now() + 2 * 36e5, log: [] }, d);
    lead.log = [{ t: Date.now(), k: 'created', s: 'Came in via ' + (d.source || 'website').toLowerCase() + (d.unit ? ' · ' + d.unit : '') }];
    lead.remark = d.remark || d.message || ('New ' + (d.source || 'website').toLowerCase() + ' enquiry' + (d.interest ? ' for a ' + d.interest : '') + '.');
    leads.unshift(lead); A.saveLeads(leads); return lead;
  };
  A.slotUsed = function (key) { return A.visits().filter(function (v) { return v.slot === key && v.outcome !== 'cancelled' && v.mode !== 'video'; }).length; };
  A.addVisit = function (d) {
    var visits = A.visits();
    var v = Object.assign({ id: 'V' + (900 + visits.length), created: Date.now(), outcome: null, rm: A.TEAM[1 + visits.length % 3].id }, d);
    visits.push(v); A.saveVisits(visits); bridge(v); return v;
  };
  function bridge(v) {
    // cross-sample contract: the estate CRM sample reads this and shows "from the launch site"
    try {
      var k = 'demo-bridge:site-visits', arr = JSON.parse(localStorage.getItem(k) || '[]');
      arr = arr.filter(function (x) { return x.id !== 'AAR-' + v.id; });
      arr.push({ id: 'AAR-' + v.id, name: v.name, unit: v.unit ? 'Aaranya ' + v.unit : 'Aaranya Residences', slot: new Date(A.slotTime(v.slot)).toISOString(), source: 'Aaranya launch site · ' + (v.source || 'website') });
      localStorage.setItem(k, JSON.stringify(arr.slice(-60)));
    } catch (e) { }
  }

  /* ---------------- floor-plan painter (2D canvas; used by the 3D drawer texture) ---------------- */
  A.ROOMTINT = { bal: '#E6DFD2', liv: '#F7F3EC', bed: '#F2EDE4', kit: '#EDE6D9', foy: '#EFE9DF', wet: '#E3E6E3', std: '#EEE8DC' };
  A.unitRoomRects = function (u) {
    // rooms in tower-local metres; v runs from the facade inwards, u across (mirrored for right-hand units)
    var r = u.rect, x0 = r[0], x1 = r[2], fz = u.face === 'n' ? r[1] : r[3], iz = u.face === 'n' ? r[3] : r[1];
    return A.TYPES[u.type].rooms.map(function (rm) {
      var ua = u.mirror ? 1 - rm[4] : rm[2], ub = u.mirror ? 1 - rm[2] : rm[4];
      var xa = x0 + ua * (x1 - x0), xb = x0 + ub * (x1 - x0);
      var za = fz + rm[3] * (iz - fz), zb = fz + rm[5] * (iz - fz);
      return { k: rm[0], name: rm[1], x0: Math.min(xa, xb), x1: Math.max(xa, xb), z0: Math.min(za, zb), z1: Math.max(za, zb) };
    });
  };
  A.paintFloor = function (ctx, T, floor, o) {
    o = o || {}; var S = o.scale || 24, W = T.w * S, H = T.d * S, hi = o.highlight, sel = o.selected, match = o.match;
    var X = function (x) { return (x + T.w / 2) * S; }, Z = function (z) { return (z + T.d / 2) * S; };
    ctx.save(); ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ECE6DB'; ctx.fillRect(0, 0, W, H);
    // corridor + core
    var c = T.core; ctx.fillStyle = '#D9D2C5'; ctx.fillRect(X(c[0]), Z(c[1]), (c[2] - c[0]) * S, (c[3] - c[1]) * S);
    ctx.strokeStyle = 'rgba(23,32,26,.35)'; ctx.lineWidth = S * 0.08;
    for (var k = 0; k < 3; k++) { var lx = X(c[0]) + (k + 0.5) * (c[2] - c[0]) * S / 3; ctx.strokeRect(lx - S * 0.9, Z(c[1]) + S * 0.8, S * 1.8, S * 1.8); }
    A.floorUnits(T.id, floor).forEach(function (u) {
      var st = A.status(u.id), col = A.STATUS[st].c, dim = match && !match(u);
      var rooms = A.unitRoomRects(u);
      rooms.forEach(function (rm) {
        ctx.fillStyle = A.ROOMTINT[rm.k]; ctx.fillRect(X(rm.x0), Z(rm.z0), (rm.x1 - rm.x0) * S, (rm.z1 - rm.z0) * S);
      });
      // status wash
      ctx.globalAlpha = dim ? 0.12 : (st === 'sold' ? 0.42 : 0.5);
      ctx.fillStyle = col; ctx.fillRect(X(u.rect[0]), Z(u.rect[1]), (u.rect[2] - u.rect[0]) * S, (u.rect[3] - u.rect[1]) * S);
      ctx.globalAlpha = 1;
      if (st === 'sold') { // hatch
        ctx.save(); ctx.beginPath(); ctx.rect(X(u.rect[0]), Z(u.rect[1]), (u.rect[2] - u.rect[0]) * S, (u.rect[3] - u.rect[1]) * S); ctx.clip();
        ctx.strokeStyle = 'rgba(23,32,26,.18)'; ctx.lineWidth = S * 0.06;
        for (var hx = -H; hx < W; hx += S * 0.8) { ctx.beginPath(); ctx.moveTo(hx, 0); ctx.lineTo(hx + H, H); ctx.stroke(); }
        ctx.restore();
      }
      // partitions
      ctx.strokeStyle = 'rgba(23,32,26,.55)'; ctx.lineWidth = S * 0.07;
      rooms.forEach(function (rm) { ctx.strokeRect(X(rm.x0), Z(rm.z0), (rm.x1 - rm.x0) * S, (rm.z1 - rm.z0) * S); });
      // outer wall
      ctx.strokeStyle = (sel === u.id) ? '#17201A' : (hi === u.id ? '#17201A' : 'rgba(23,32,26,.9)');
      ctx.lineWidth = S * (sel === u.id ? 0.42 : hi === u.id ? 0.32 : 0.2);
      ctx.strokeRect(X(u.rect[0]), Z(u.rect[1]), (u.rect[2] - u.rect[0]) * S, (u.rect[3] - u.rect[1]) * S);
      // label
      var cx = X((u.rect[0] + u.rect[2]) / 2), cz = Z((u.rect[1] + u.rect[3]) / 2);
      ctx.fillStyle = dim ? 'rgba(23,32,26,.35)' : '#17201A'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '600 ' + Math.round(S * 1.5) + 'px Geist, system-ui, sans-serif'; ctx.fillText(u.id, cx, cz - S * 0.9);
      ctx.font = '500 ' + Math.round(S * 0.95) + 'px Geist, system-ui, sans-serif';
      ctx.fillText(A.TYPES[u.type].short + ' · ' + A.STATUS[st].label, cx, cz + S * 0.8);
    });
    ctx.restore();
  };

  /* ---------------- floor plan as accessible SVG (picker + residences) ---------------- */
  A.floorSVG = function (tid, floor, o) {
    o = o || {}; var T = A.tower(tid), pad = 1.5, W = T.w + pad * 2, H = T.d + pad * 2;
    var X = function (x) { return (x + T.w / 2 + pad).toFixed(2); }, Z = function (z) { return (z + T.d / 2 + pad).toFixed(2); };
    var s = '<svg class="fplan" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="' + A.esc(T.name + ', ' + A.ord(floor) + ' floor plan') + '">';
    var c = T.core;
    s += '<rect class="fp-core" x="' + X(c[0]) + '" y="' + Z(c[1]) + '" width="' + (c[2] - c[0]) + '" height="' + (c[3] - c[1]) + '"/>';
    s += '<text class="fp-cl" x="' + X((c[0] + c[2]) / 2) + '" y="' + Z((c[1] + c[3]) / 2) + '">Lifts · lobby</text>';
    A.floorUnits(tid, floor).forEach(function (u) {
      var st = A.status(u.id), m = o.match ? o.match(u) : true, r = u.rect;
      s += '<g class="fp-u st-' + st + (m ? '' : ' dim') + (o.selected === u.id ? ' sel' : '') + '" data-unit="' + u.id + '" tabindex="0" role="button" aria-label="' + A.esc(u.id + ' ' + A.TYPES[u.type].short + ', ' + u.facing + ' facing, ' + A.STATUS[st].label + (st !== 'sold' ? ', ' + A.inr(A.price(u).total) : '')) + '">';
      s += '<rect class="fp-bg" x="' + X(r[0]) + '" y="' + Z(r[1]) + '" width="' + (r[2] - r[0]) + '" height="' + (r[3] - r[1]) + '"/>';
      A.unitRoomRects(u).forEach(function (rm) { s += '<rect class="fp-r fp-' + rm.k + '" x="' + X(rm.x0) + '" y="' + Z(rm.z0) + '" width="' + (rm.x1 - rm.x0).toFixed(2) + '" height="' + (rm.z1 - rm.z0).toFixed(2) + '"/>'; });
      s += '<rect class="fp-wash" x="' + X(r[0]) + '" y="' + Z(r[1]) + '" width="' + (r[2] - r[0]) + '" height="' + (r[3] - r[1]) + '"/>';
      s += '<rect class="fp-wall" x="' + X(r[0]) + '" y="' + Z(r[1]) + '" width="' + (r[2] - r[0]) + '" height="' + (r[3] - r[1]) + '"/>';
      var cx = X((r[0] + r[2]) / 2), cz = (+Z((r[1] + r[3]) / 2));
      s += '<text class="fp-id" x="' + cx + '" y="' + (cz - 0.5).toFixed(2) + '">' + u.id + '</text>';
      s += '<text class="fp-t" x="' + cx + '" y="' + (cz + 1.6).toFixed(2) + '">' + A.TYPES[u.type].short + '</text>';
      s += '</g>';
    });
    // north arrow (tower-local north rotates with the tower)
    var na = -T.rot * 180 / Math.PI;
    s += '<g class="fp-n" transform="translate(' + (W - 2.6) + ' 2.6) rotate(' + na + ')"><circle r="1.6"/><path d="M0 -1.2 L.6 .8 L0 .4 L-.6 .8Z"/></g>';
    return s + '</svg>';
  };

  /* ---------------- sun and view: shared by the 3D model, the view report and the sun-on-plan drawings ---------------- */
  // world axes as in the 3D model: x east, y up, z south. Gurugram 28.45° N; solar time runs ~22 min behind IST.
  var LAT = 28.45 * Math.PI / 180;
  A.DECL = { dec: -23.44, mar: 0, jun: 23.44 };
  A.sunAt = function (hours, declDeg) {
    var H = (hours - 22 / 60 - 12) * 15 * Math.PI / 180, d = declDeg * Math.PI / 180;
    var E = -Math.cos(d) * Math.sin(H), N = Math.cos(LAT) * Math.sin(d) - Math.sin(LAT) * Math.cos(d) * Math.cos(H), U = Math.sin(LAT) * Math.sin(d) + Math.cos(LAT) * Math.cos(d) * Math.cos(H);
    var L = Math.sqrt(E * E + U * U + N * N) || 1; return { x: E / L, y: U / L, z: -N / L };
  };
  A.monthDecl = function (m) { return 23.44 * Math.sin(2 * Math.PI * (284 + [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349][m]) / 365); };
  A.MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // the balcony of a home: where you stand (eye height) and which way you look
  A.balcony = function (u) {
    if (typeof u === 'string') u = byId[u];
    var T = A.tower(u.tower), r = u.rect, cx = (r[0] + r[2]) / 2, out = u.face === 'n' ? -1 : 1, fz = u.face === 'n' ? r[1] : r[3];
    var p = rot(cx, fz + out * 1.2, T.rot), n = rot(0, out, T.rot), off = rot(cx, 0, T.rot);
    var fx = n[0] * 1.2 + off[0] / (T.w / 2), fzz = n[1] * 1.2 + off[1] / (T.w / 2), L = Math.hypot(fx, fzz) || 1;
    return { x: T.x + p[0], y: A.PROJECT.lobbyH + (u.floor - 1) * A.PROJECT.floorH + 1.55, z: T.z + p[1], nx: n[0], nz: n[1], dx: fx / L, dz: fzz / L, tower: u.tower };
  };
  A.towerTop = function (T) { if (typeof T === 'string') T = A.tower(T); return A.PROJECT.lobbyH + T.floors * A.PROJECT.floorH + 7; };
  // a ray from o along the unit vector d: where it enters tower T, and whether it passes over the roof there
  function rayTower(o, d, T) {
    var lo = rot(o.x - T.x, o.z - T.z, -T.rot), ld = rot(d.x, d.z, -T.rot), ext = [T.w / 2 + 1, T.d / 2 + 1], t0 = -Infinity, t1 = Infinity;
    for (var a = 0; a < 2; a++) {
      if (Math.abs(ld[a]) < 1e-9) { if (Math.abs(lo[a]) > ext[a]) return null; continue; }
      var ta = (-ext[a] - lo[a]) / ld[a], tb = (ext[a] - lo[a]) / ld[a]; if (ta > tb) { var s = ta; ta = tb; tb = s; }
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
    }
    if (t0 > t1 || t1 < 0) return null;
    var te = Math.max(t0, 0); return { t: te, over: o.y + te * d.y > A.towerTop(T) };
  }
  function blocked(o, d, skip) { for (var i = 0; i < A.TOWERS.length; i++) { var T = A.TOWERS[i]; if (T.id === skip) continue; var h = rayTower(o, d, T); if (h && !h.over) return T; } return null; }
  function sunHours(b, decl) {
    var n = 0;
    for (var h = 5; h <= 19.5; h += 1 / 6) {
      var s = A.sunAt(h, decl); if (s.y < 0.035) continue;
      var hl = Math.hypot(s.x, s.z) || 1; if ((s.x * b.nx + s.z * b.nz) / hl < 0.34) continue;    // behind the facade, or too oblique to reach the room
      if (!blocked(b, s, b.tower)) n++;
    }
    return Math.round(n / 6 * 2) / 2;
  }
  function sunEvents(b) {
    var rise = [], set = [], c65 = Math.cos(65 * Math.PI / 180);
    for (var m = 0; m < 12; m++) {
      var d = A.monthDecl(m), r0 = null, s0 = null;
      for (var h = 4; h <= 21; h += 1 / 20) { if (A.sunAt(h, d).y > 0.02) { if (r0 === null) r0 = h; s0 = h; } }
      var sees = function (h) { var s = A.sunAt(h, d), hl = Math.hypot(s.x, s.z) || 1; return (s.x * b.dx + s.z * b.dz) / hl > c65 && !blocked(b, s, b.tower); };
      rise.push(r0 !== null && sees(r0 + 0.15)); set.push(s0 !== null && sees(s0 - 0.15));
    }
    return { rise: rise, set: set };
  }
  A.monthsPhrase = function (arr) {
    var n = arr.filter(Boolean).length; if (!n) return ''; if (n === 12) return 'all year';
    var runs = [];
    for (var i = 0; i < 12; i++) {
      if (!arr[i] || arr[(i + 11) % 12]) continue;          // a run starts where the month before is off
      var j = i; while (arr[(j + 1) % 12]) j = (j + 1) % 12; runs.push([i, j]);
    }
    return runs.map(function (r) { return r[0] === r[1] ? A.MONTHS[r[0]] : A.MONTHS[r[0]] + ' to ' + A.MONTHS[r[1]]; }).join(' and ');
  };
  function compassOf(dx, dz) { var a = Math.atan2(dx, -dz) * 180 / Math.PI; return (a + 360) % 360; }
  A.viewReport = function (u) {
    if (typeof u === 'string') u = byId[u];
    var b = A.balcony(u), az = compassOf(b.dx, b.dz), near = null, over = [];
    [-0.35, -0.17, 0, 0.17, 0.35].forEach(function (a) {
      var c = Math.cos(a), s = Math.sin(a), d = { x: b.dx * c - b.dz * s, y: 0, z: b.dx * s + b.dz * c };
      A.TOWERS.forEach(function (T) { if (T.id === u.tower) return; var h = rayTower(b, d, T); if (!h || h.t > 700) return; if (h.over) { if (over.indexOf(T.name) < 0) over.push(T.name); } else if (!near || h.t < near.t) near = { t: h.t, name: T.name }; });
    });
    var bits = [];
    if (near) bits.push('looks across to ' + near.name + ', ' + Math.round(near.t / 5) * 5 + ' m away');
    else if (over.length) bits.push('clears the roof of ' + over.join(' and ') + ' and looks out over the city');
    else bits.push('open to the skyline');
    var dw = Math.abs(((az - 270 + 540) % 360) - 180), dse = Math.abs(((az - 140 + 540) % 360) - 180);
    if (dw < 60 && b.y > 30) bits.push('the Expressway to the west');
    if (dse < 60 && b.y > 70) bits.push('the Aravalli ridge on clear winter days');
    if (u.garden) bits.push('the podium garden below');
    var ev = sunEvents(b), rise = A.monthsPhrase(ev.rise), set = A.monthsPhrase(ev.set), dec = sunHours(b, A.DECL.dec), jun = sunHours(b, A.DECL.jun);
    var hrs = function (h) { return h === 0 ? 'no direct sun' : 'about ' + (h % 1 ? h.toFixed(1) : h) + (h === 1 ? ' hour' : ' hours') + ' of direct sun'; };
    var when = function (p) { return p === 'all year' ? 'all year' : (/ to | and /.test(p) ? '' : 'in ') + p; };
    var sunLine = rise ? 'sunrise from the living room ' + when(rise) : set ? 'sunset from the living room ' + when(set) : '';
    var line = [u.id, 'faces ' + u.facing.toLowerCase()].concat(sunLine ? [sunLine] : []).concat([hrs(dec) + ' on 21 December']).join(' · ');
    return { b: b, az: az, height: Math.round(b.y), view: bits, rise: rise, set: set, dec: dec, jun: jun, line: line };
  };

  /* ---------------- channel partners: holds placed for clients, brokerage by slab ---------------- */
  A.PARTNER = { id: 'AHD', name: 'Arora Homes Desk', person: 'Neha Arora', office: 'Sector 57, Gurugram', since: 'March 2025', share: 2 };
  A.partnerHold = function (id, client, note) {
    return A.setStatus(id, 'hold', { by: 'Channel partner · ' + A.PARTNER.name, partner: A.PARTNER.id, client: client, pending: true, until: Date.now() + 48 * 36e5, note: note || ('For ' + client), keep: true });
  };
  A.approveHold = function (id, by) {
    var inv = A.inv(), m = inv[id]; if (!m) return;
    m.pending = false; m.approvedAt = Date.now(); m.approvedBy = by || 'Ritika Menon'; A.set('inv', inv);
    A.log({ kind: 'inv', unit: id, from: 'hold', to: 'hold', by: m.approvedBy, note: 'Partner hold approved' }); A.emit('inv', { id: id, s: 'hold' });
  };
  A.partnerDeals = function () { return A.get('pdeals', []); };
  A.brokerage = function (deal) {
    var u = byId[deal.unit], T = A.tower(u.tower), done = A.PROGRESS[u.tower], total = Math.round(deal.basic * deal.share / 100);
    var steps = [['On the agreement for sale', 0.4, 0], ['On the ' + A.ord(Math.round(T.floors / 2)) + ' slab of ' + T.name, 0.3, Math.round(T.floors / 2)], ['On the top slab of ' + T.name, 0.3, T.floors]];
    return { total: total, rows: steps.map(function (s) { var due = s[2] <= done; return { label: s[0], amount: Math.round(total * s[1]), slab: s[2], done: due, paid: due && (s[2] === 0 || deal.paidAll || s[2] < done - 2) }; }) };
  };

  /* ---------------- construction progress (slabs cast) ---------------- */
  A.PROGRESS = { A: 27, B: 23, C: 21, club: 'Podium slab cast · façade in progress', asOf: 'November 2026' };

  A.init();
})();
