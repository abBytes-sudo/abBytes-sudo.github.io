/* Agent: Alderway Homes Assistant (fictional real estate agency in Bengaluru). Rent and sale search from a typed brief, price bands, visit booking with a demo OTP,
   reschedule and cancel, saved searches, FAQ and handover. All listings are demo data generated below. Nothing leaves the browser, no SMS or email is ever sent. */
(function () {
  'use strict';
  var O = window.Orbit, N = O.nlp, B = function (l, v) { return { label: l, value: v }; }, R = function (n) { return O.money(n, '₹'); };

  /* ---------- reference data ---------- */
  var LOCS = {
    'Indiranagar': ['indiranagar', 'indira nagar', 'indranagar', 'indiranager'], 'Koramangala': ['koramangala', 'kormangala', 'koramangla', 'kormangla', 'koramangal'], 'HSR Layout': ['hsr layout', 'hsr'],
    'Whitefield': ['whitefield', 'white field', 'whitfield'], 'Jayanagar': ['jayanagar', 'jaya nagar', 'jaynagar', 'jayanager'], 'Hebbal': ['hebbal'], 'Sarjapur Road': ['sarjapur road', 'sarjapur', 'sarjapura'],
    'JP Nagar': ['jp nagar', 'j p nagar', 'jpnagar'], 'Domlur': ['domlur', 'dumlur'], 'Malleshwaram': ['malleshwaram', 'maleshwaram', 'malleswaram', 'malleshwaran']
  };
  var LOCNAMES = Object.keys(LOCS), LOCRE = {}, FUZZ = { indiranagar: 'Indiranagar', koramangala: 'Koramangala', whitefield: 'Whitefield', jayanagar: 'Jayanagar', sarjapur: 'Sarjapur Road', malleshwaram: 'Malleshwaram', domlur: 'Domlur', hebbal: 'Hebbal' };
  LOCNAMES.forEach(function (k) { LOCRE[k] = LOCS[k].map(function (a) { return new RegExp('(^|[^a-z])' + a.replace(/\s+/g, '\\s*') + '($|[^a-z])'); }); });
  var NEAR = {
    'Indiranagar': ['a metro station about 1 km away', 'cafes and a weekend market on the main road', 'two hospitals within 3 km'], 'Koramangala': ['startup offices and co-working spaces within 2 km', 'a large park and several malls', 'a hospital strip on the ring road'],
    'HSR Layout': ['sector parks and a lake walk', 'busy food streets and a daily market', 'tech parks 10 minutes away'], 'Whitefield': ['tech parks and a railway station nearby', 'two malls and international schools', 'the metro line extension is a short drive'],
    'Jayanagar': ['a large shopping complex and tree-lined parks', 'old bookshops and sweet shops', 'a metro station within 1.5 km'], 'Hebbal': ['the flyover to the airport road', 'a lake and sports club', 'universities and hospitals within 4 km'],
    'Sarjapur Road': ['IT campuses and new apartment clusters', 'schools within 2 km', 'a hospital about 3 km away'], 'JP Nagar': ['metro and bus stops within 1 km', 'a district park and many schools', 'supermarkets and a hospital nearby'],
    'Domlur': ['a quick route to the airport road', 'restaurants and a leisure club', 'a metro station about 1.5 km away'], 'Malleshwaram': ['a long-standing market street and temples', 'metro and railway stations nearby', 'colleges and a large hospital']
  };
  var AM = ['Parking', 'Gym', 'Pool', 'Lift', 'Clubhouse', 'Garden', 'Power backup', 'Pet friendly', 'Gated community', 'Play area'];
  var PROJ = ['Birchwood Residency', 'Cedar Terrace', 'Juniper Heights', 'Lakeview Court', 'Orchard Lane', 'Pine Crest', 'Willow Park', 'Saffron Square', 'Maple Row', 'Harbour Walk', 'Elm Gardens', 'Ivory Court', 'Quill House', 'Marlow Place', 'Tamarind Nest', 'Olive Grove'];
  var PH = ['room-1', 'room-2', 'room-3', 'room-4', 'room-5', 'bedroom', 'bath-oak', 'bath-stone'], HOSTS = ['Kavya', 'Rohit', 'Neha', 'Arun'];
  var FURN = { furnished: 'Furnished', semi: 'Semi-furnished', unfurnished: 'Unfurnished' }, FURND = { furnished: 'Fully furnished: beds, wardrobes, sofa, kitchen appliances and light fittings.', semi: 'Semi-furnished: wardrobes, modular kitchen, fans and light fittings, no beds or sofa.', unfurnished: 'Unfurnished: bare rooms with basic fittings only.' };
  // [locality, mode, type, bhk, price INR (rent per month), sqft, furnished, floor]
  var ROWS = [
    ['Indiranagar', 'rent', 'apartment', 3, 135000, 1650, 'furnished', 4], ['Indiranagar', 'rent', 'apartment', 3, 118000, 1500, 'semi', 2], ['Indiranagar', 'rent', 'apartment', 2, 78000, 1100, 'furnished', 3], ['Indiranagar', 'sale', 'apartment', 3, 31500000, 1800, 'semi', 6], ['Indiranagar', 'rent', 'villa', 4, 350000, 3200, 'semi', 0],
    ['Koramangala', 'rent', 'apartment', 2, 38000, 1050, 'semi', 2], ['Koramangala', 'rent', 'apartment', 3, 95000, 1600, 'furnished', 5], ['Koramangala', 'sale', 'apartment', 2, 12500000, 1250, 'unfurnished', 3], ['Koramangala', 'rent', 'studio', 1, 26000, 520, 'furnished', 1],
    ['HSR Layout', 'rent', 'studio', 1, 24000, 480, 'furnished', 2], ['HSR Layout', 'rent', 'apartment', 2, 36000, 1000, 'unfurnished', 1], ['HSR Layout', 'sale', 'apartment', 3, 14500000, 1550, 'semi', 7], ['HSR Layout', 'rent', 'apartment', 3, 55000, 1450, 'semi', 4],
    ['Whitefield', 'rent', 'apartment', 3, 62000, 1700, 'semi', 8], ['Whitefield', 'rent', 'apartment', 3, 48000, 1550, 'unfurnished', 5], ['Whitefield', 'sale', 'apartment', 3, 11000000, 1650, 'unfurnished', 9], ['Whitefield', 'sale', 'villa', 4, 42000000, 3400, 'semi', 0], ['Whitefield', 'rent', 'apartment', 2, 32000, 1150, 'furnished', 6], ['Whitefield', 'sale', 'plot', 0, 9000000, 2400, '', 0],
    ['Jayanagar', 'rent', 'apartment', 2, 42000, 1200, 'semi', 1], ['Jayanagar', 'sale', 'apartment', 3, 17500000, 1500, 'unfurnished', 2], ['Hebbal', 'rent', 'apartment', 2, 33000, 1100, 'semi', 7], ['Hebbal', 'sale', 'apartment', 3, 9800000, 1450, 'unfurnished', 11], ['Hebbal', 'sale', 'villa', 3, 24000000, 2200, 'semi', 0],
    ['Sarjapur Road', 'sale', 'villa', 4, 28500000, 2900, 'semi', 0], ['Sarjapur Road', 'rent', 'apartment', 2, 28000, 1080, 'semi', 3], ['Sarjapur Road', 'sale', 'plot', 0, 4500000, 1500, '', 0],
    ['JP Nagar', 'rent', 'apartment', 3, 52000, 1500, 'semi', 3], ['JP Nagar', 'sale', 'villa', 5, 60000000, 4200, 'furnished', 0], ['Domlur', 'rent', 'apartment', 3, 88000, 1550, 'furnished', 6], ['Malleshwaram', 'rent', 'apartment', 1, 18000, 600, 'unfurnished', 2], ['Malleshwaram', 'sale', 'apartment', 2, 8500000, 1100, 'semi', 2]
  ];
  var TW = { apartment: 'apartment', villa: 'villa', studio: 'studio', plot: 'plot' };
  function seedListings() {
    return ROWS.map(function (r, i) {
      var r2 = O.rng(700 + i), am = [], k, n = r[2] === 'plot' ? 0 : 3 + Math.floor(r2() * 3), pool = AM.slice();
      while (am.length < n) { k = Math.floor(r2() * pool.length); am.push(pool.splice(k, 1)[0]); }
      if (r[2] === 'villa' && am.indexOf('Garden') < 0) am.push('Garden'); if (r[2] === 'plot') am = ['Gated community'];
      var bh = r[2] === 'plot' ? 'Plot' : r[2] === 'studio' ? 'Studio' : r[3] + ' BHK ' + r[2];
      return { id: 'AH-' + (101 + i), title: bh + ' in ' + r[0], mode: r[1], type: r[2], bhk: r[3], price: r[4], area: r[5], locality: r[0], furnished: r[6], floor: r[7], amenities: am, project: PROJ[(i * 5 + 3) % PROJ.length], img: 'interior/photos/' + PH[i % PH.length] + '.jpg' };
    });
  }

  /* ---------- helpers ---------- */
  var cp = function (o) { return JSON.parse(JSON.stringify(o)); }, phoneCh = function (bot) { return bot.channel === 'phone'; };
  function spokenMoney(n) { return n >= 1e7 ? Math.round(n / 1e5) / 100 + ' crore rupees' : n >= 1e5 ? Math.round(n / 1e3) / 100 + ' lakh rupees' : Math.round(n / 1000) + ' thousand rupees'; }
  function M(bot, n) { return phoneCh(bot) ? spokenMoney(n) : R(n); }
  function priceStr(bot, l) { return M(bot, l.price) + (l.mode === 'rent' ? (phoneCh(bot) ? ' a month' : ' / month') : ''); }
  function nice(n) { var p = Math.pow(10, Math.floor(Math.log(n) / Math.LN10) - 1); return Math.round(n / p) * p; }
  function median(a) { a = a.slice().sort(function (x, y) { return x - y; }); var m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; }
  function lev(a, b) { var m = [], i, j; for (i = 0; i <= a.length; i++) m[i] = [i]; for (j = 1; j <= b.length; j++) m[0][j] = j; for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return m[a.length][b.length]; }
  function findLocs(t) {
    var out = [];
    LOCNAMES.forEach(function (k) { if (LOCRE[k].some(function (r) { return r.test(t); })) out.push(k); });
    if (!out.length) t.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(function (w) { return w.length >= 6; }).forEach(function (w) { Object.keys(FUZZ).forEach(function (f) { if (Math.abs(f.length - w.length) <= 2 && lev(f, w) <= (f.length > 8 ? 2 : 1) && out.indexOf(FUZZ[f]) < 0) out.push(FUZZ[f]); }); });
    return out;
  }
  function getL(bot, id) { var a = bot.db('listings'); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function focus(bot, ent) { var id = ent && ent.listing ? ent.listing : bot.mem.current !== undefined ? bot.mem.current : bot.ctx.listing; var l = id ? getL(bot, id) : null; if (l && ent && ent.listing) bot.mem.current = l.id; return l; }
  function mask(p) { var d = String(p).replace(/\D/g, ''); return '•••••' + d.slice(-4); }
  function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function fromIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function days() { var o = [], n = new Date(), d, i; n.setHours(0, 0, 0, 0); for (i = 1; i <= 6; i++) { d = new Date(n); d.setDate(n.getDate() + i); o.push({ iso: ymd(d), label: O.fmtDay(d) }); } return o; }
  function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  var SLOTS = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  function free(bot, lid, iso, skipVid) { // some slots are always taken (deterministic per home and day), plus every visit saved by this demo
    var r = O.rng(hash(lid + iso)), taken = SLOTS.map(function () { return r() < .32; }), i = 0, nf = taken.filter(function (x) { return !x; }).length;
    while (nf < 3) { if (taken[i]) { taken[i] = false; nf++; } i++; }
    var bk = bot.db('visits').filter(function (v) { return v.status === 'booked' && v.listing === lid && v.iso === iso && v.id !== skipVid; }).map(function (v) { return v.time; });
    return SLOTS.filter(function (t, k) { return !taken[k] && bk.indexOf(t) < 0; });
  }
  function slotLabel(v) { return O.fmtDay(fromIso(v.iso)) + ', ' + O.fmtTime(v.time); }
  function hh(h) { return ('0' + (h < 9 ? h + 12 : h)).slice(-2) + ':00'; }
  function visitById(bot, id) { return bot.db('visits').filter(function (v) { return v.id === id; })[0]; }
  function mine(bot, phone) { var d = String(phone).replace(/\D/g, '').slice(-10); return bot.db('visits').filter(function (v) { return v.status === 'booked' && String(v.phone).replace(/\D/g, '').slice(-10) === d; }); }
  function lidOf(bot, s) { var v = s.vid && visitById(bot, s.vid); return s.listing || (v && v.listing); }

  /* ---------- search ---------- */
  function ok(l, s) {
    if (s.mode && s.mode !== 'any' && l.mode !== s.mode) return false; if (s.type && l.type !== s.type) return false; if (s.bhk != null && [].concat(s.bhk).indexOf(l.bhk) < 0) return false;
    if (s.locality && s.locality.length && s.locality.indexOf(l.locality) < 0) return false; if (s.minPrice != null && l.price < s.minPrice) return false; if (s.maxPrice != null && l.price > s.maxPrice) return false;
    if (s.furnished && l.furnished !== s.furnished) return false; if (s.minArea && l.area < s.minArea) return false; if (s.maxArea && l.area > s.maxArea) return false;
    return !(s.amen && s.amen.some(function (a) { return l.amenities.indexOf(a) < 0; }));
  }
  function run(all, s) { return all.filter(function (l) { return ok(l, s); }).sort(function (a, b) { return a.price - b.price; }); }
  function describe(bot, s, noPrice) {
    var p = [], per = s.mode === 'rent' ? (phoneCh(bot) ? ' a month' : ' / month') : '';
    if (s.furnished) p.push(FURN[s.furnished].toLowerCase()); if (s.bhk != null && s.type !== 'studio') p.push([].concat(s.bhk).join(' or ') + ' BHK'); p.push(s.type ? TW[s.type] : s.bhk != null ? 'home' : 'homes');
    if (s.mode && s.mode !== 'any') p.push(s.mode === 'rent' ? 'for rent' : 'for sale'); if (s.locality && s.locality.length) p.push('in ' + s.locality.join(' or '));
    if (!noPrice) { if (s.minPrice != null && s.maxPrice != null) p.push('between ' + M(bot, s.minPrice) + ' and ' + M(bot, s.maxPrice) + per); else if (s.maxPrice != null) p.push('up to ' + M(bot, s.maxPrice) + per); else if (s.minPrice != null) p.push('from ' + M(bot, s.minPrice) + per); }
    if (s.amen && s.amen.length) p.push('with ' + s.amen.join(', ').toLowerCase()); if (s.minArea) p.push('over ' + s.minArea + ' sqft');
    return p.join(' ');
  }
  function facetCount(e) { var n = 0; ['mode', 'type', 'bhk', 'locality', 'furnished', 'amen', 'minArea', 'maxArea'].forEach(function (k) { if (e[k] !== undefined) n++; }); if (e.minPrice != null || e.maxPrice != null) n++; return n; }
  function merge(s, e, bot) {
    var m = e.mode || (e.modeGuess && (!s.mode || (s.mode !== 'any' && e.modeGuess !== s.mode)) ? e.modeGuess : null);
    if (m && m !== s.mode) { if (s.mode && e.minPrice == null && e.maxPrice == null) { delete s.minPrice; delete s.maxPrice; } s.mode = m; }
    if (e.type) { s.type = e.type; if (e.type === 'studio' || e.type === 'plot') delete s.bhk; }
    if (e.bhk !== undefined) { s.bhk = e.bhk; if (s.type === 'studio' || s.type === 'plot') delete s.type; }
    ['locality', 'furnished', 'amen', 'minArea', 'maxArea'].forEach(function (k) { if (e[k] !== undefined) s[k] = e[k]; });
    if (e.minPrice != null || e.maxPrice != null) { s.minPrice = e.minPrice; s.maxPrice = e.maxPrice; if (s.minPrice == null) delete s.minPrice; if (s.maxPrice == null) delete s.maxPrice; }
    if (e.rel === 'cheaper' || e.rel === 'costlier') { var base = s.maxPrice != null ? s.maxPrice : bot.mem.lastMax; if (base) { s.maxPrice = nice(base * (e.rel === 'cheaper' ? .8 : 1.25)); if (s.minPrice != null && s.minPrice > s.maxPrice) delete s.minPrice; } }
    if (e.rel === 'bigger') s.minArea = nice((s.minArea || bot.mem.lastArea || 1000) * 1.15);
    if (s.type === 'plot' && !s.mode) s.mode = 'sale'; return s;
  }
  var STEPS = [['furnished', 'the furnishing'], ['amen', 'the amenity filter'], ['minArea', 'the minimum size'], ['maxArea', 'the size limit'], ['price', 'the budget'], ['bhk', 'the bedroom count'], ['locality', 'the area'], ['type', 'the home type']];
  function relaxOne(s, key) {
    var q = cp(s); if (key === 'price') { if (s.maxPrice == null && s.minPrice == null) return null; if (s.maxPrice != null) q.maxPrice = nice(s.maxPrice * 1.3); if (s.minPrice != null) q.minPrice = nice(s.minPrice * .75); return q; }
    if (key === 'bhk') { if (s.bhk == null) return null; q.bhk = [s.bhk - 1, s.bhk, s.bhk + 1]; return q; }
    if (s[key] == null || (s[key].length === 0)) return null; delete q[key]; return q;
  }
  function relax(bot, all, s) {
    var i, q, names = [], r;
    for (i = 0; i < STEPS.length; i++) { q = relaxOne(s, STEPS[i][0]); if (q && (r = run(all, q)).length) return { list: r, note: 'I relaxed ' + STEPS[i][1] + (STEPS[i][0] === 'price' ? ' (now up to ' + M(bot, q.maxPrice != null ? q.maxPrice : q.minPrice) + ')' : STEPS[i][0] === 'bhk' ? ' (also ' + (s.bhk - 1) + ' and ' + (s.bhk + 1) + ' BHK)' : '') + ' and found these.' }; }
    q = cp(s); for (i = 0; i < STEPS.length; i++) { var nq = relaxOne(q, STEPS[i][0]); if (nq) { q = nq; names.push(STEPS[i][1]); if ((r = run(all, q)).length) return { list: r, note: 'I had to relax ' + names.join(' and ') + ' to find these.' }; } }
    q = { mode: s.mode }; if (s.bhk != null) q.bhk = [s.bhk - 1, s.bhk, s.bhk + 1]; if (!(r = run(all, q)).length) { q = { mode: s.mode }; r = run(all, q); }
    if (!r.length) return null; var tgt = s.maxPrice != null ? s.maxPrice : s.minPrice; if (tgt != null) r.sort(function (a, b) { return Math.abs(a.price - tgt) - Math.abs(b.price - tgt); });
    return { list: r.slice(0, 6), note: 'Nothing is close on several points, so these are the nearest ' + (s.mode === 'any' || !s.mode ? 'homes' : 'homes ' + (s.mode === 'rent' ? 'for rent' : 'for sale')) + ' I have.' };
  }
  function card(bot, l) {
    var ph = phoneCh(bot), plot = l.type === 'plot', facts = [{ i: 'bed', t: plot ? 'Plot' : l.type === 'studio' ? 'Studio' : l.bhk + ' BHK' }, { i: 'area', t: l.area.toLocaleString('en-IN') + ' sqft' }];
    if (!plot) { facts.push({ i: 'sofa', t: FURN[l.furnished] }); facts.push({ i: 'stairs', t: l.floor ? 'Floor ' + l.floor : 'Ground floor' }); }
    return { title: l.title, sub: ph ? l.locality + ', ' + (FURN[l.furnished] || 'plot').toLowerCase() : l.project + ' · ' + l.locality, tag: l.id, img: O.samples(l.img), price: priceStr(bot, l), priceLabel: 'Price', badge: l.mode === 'rent' ? 'For rent' : 'For sale', facts: facts,
      meta: facts.map(function (f) { return f.t; }),
      buttons: [B('Book a visit', 'act:visit:' + l.id), B('Save', 'act:save:' + l.id), B('More like this', 'act:similar:' + l.id)] };
  }
  function page(bot, intro) {
    var ids = bot.mem.results || [], per = phoneCh(bot) ? 3 : 4, pg = bot.mem.page || 0, all = bot.db('listings'), sl = ids.slice(pg * per, pg * per + per).map(function (id) { return getL(bot, id); }).filter(Boolean), left = ids.length - (pg + 1) * per, b = [];
    if (left > 0) b.push(B('Show more (' + left + ')', 'act:more')); b.push(B('Cheaper', 'say:cheaper'), B('Save this search', 'intent:saved_search'), B('New search', 'act:newsearch'));
    bot.say(intro, { cards: sl.map(function (l) { return card(bot, l); }), buttons: b });
  }
  function showResults(bot, s) {
    var all = bot.db('listings'), r = run(all, s), note = '', rx, d = describe(bot, s);
    bot.mem.search = s; bot.event('action', { action: 'search', q: d });
    if (!r.length) { rx = relax(bot, all, s); if (rx) { r = rx.list; note = rx.note; } }
    if (!r.length) { bot.say('I do not have anything near **' + d + '** in my demo listings. Want to start a different search?', { buttons: [B('New search', 'act:newsearch'), B('Talk to a person', 'handover')] }); return; }
    bot.mem.results = r.map(function (l) { return l.id; }); bot.mem.page = 0; bot.mem.lastMax = Math.max.apply(null, r.map(function (l) { return l.price; })); bot.mem.lastArea = median(r.map(function (l) { return l.area; })); bot.mem.current = r.length === 1 ? r[0].id : '';
    var per = phoneCh(bot) ? 3 : 4, n = r.length;
    page(bot, (note ? 'No exact match for **' + d + '**. ' + note : 'I found ' + (n === 1 ? 'one home' : '**' + n + ' homes**') + ' for **' + d + '**' + (n > per ? ', cheapest first. Here are the first ' + per + '.' : '.')));
  }
  function askMode(bot, s) { bot.mem.search = s; bot.say('Do you want to rent or buy? I will keep the rest of your brief (' + describe(bot, s) + ').', { buttons: [B('Rent', 'act:mode:rent'), B('Buy', 'act:mode:sale'), B('Show both', 'act:mode:any')] }); }
  function promptSearch(bot) { bot.say('Tell me what you are looking for in one line: rent or buy, area, BHK and budget. For example “3 bhk under 1.5 lakh in Indiranagar”.', { buttons: [B('2 BHK to rent under 50k', 'say:2 bhk to rent under 50k'), B('Buy under 1 Cr', 'say:2 bhk to buy under 1 cr'), B('Villas for sale', 'say:villa for sale'), B('Studios to rent', 'say:studio to rent')] }); }
  function doSearch(bot, m) {
    var e = m.ent || {}, t = String(m.text || '').toLowerCase(), cur = bot.mem.search, n = facetCount(e);
    if (!n && !e.rel) { if (cur) bot.say('Your current search is **' + describe(bot, cur) + '**. Tell me what to change, or start fresh.', { buttons: [B('Show results', 'act:results'), B('Save this search', 'intent:saved_search'), B('New search', 'act:newsearch')] }); else promptSearch(bot); return; }
    var fresh = !cur || /\b(new search|start over|start again|different search|fresh)\b/.test(t) || n >= 3 || (n >= 2 && !/\b(make it|only|instead|also|cheaper|costlier|bigger|larger|change|but|these|those|ones)\b/.test(t));
    var s = merge(fresh ? {} : cp(cur), e, bot);
    if (!s.mode) { var ms = {}; bot.db('listings').forEach(function (l) { var q = cp(s); delete q.mode; if (ok(l, q)) ms[l.mode] = 1; }); if (Object.keys(ms).length === 1) s.mode = Object.keys(ms)[0]; else { askMode(bot, s); return; } }
    showResults(bot, s);
  }
  function median3(r, f) { var a = r.map(f); return { min: Math.min.apply(null, a), med: median(a), max: Math.max.apply(null, a) }; }
  function priceBand(bot, e) {
    var s = merge({}, e, bot), all = bot.db('listings'), modes = s.mode && s.mode !== 'any' ? [s.mode] : ['rent', 'sale'], lines = [], any = false, base;
    delete s.minPrice; delete s.maxPrice; base = describe(bot, s, true).replace(/ (for rent|for sale)/, '');
    modes.forEach(function (md) {
      var q = cp(s); q.mode = md; var r = run(all, q); if (!r.length) return; any = true; var st = median3(r, function (l) { return l.price; }), ps = median3(r, function (l) { return l.price / l.area; });
      lines.push((md === 'rent' ? 'To rent' : 'For sale') + ': ' + r.length + ' listing' + (r.length > 1 ? 's' : '') + ', ' + (st.min === st.max ? M(bot, st.min) : M(bot, st.min) + ' to ' + M(bot, st.max) + ', median ' + M(bot, st.med)) + (md === 'rent' ? (phoneCh(bot) ? ' a month' : ' / month') : ', about ₹' + Math.round(ps.med).toLocaleString('en-IN') + ' per sqft'));
    });
    if (!any) { bot.say('I have no demo listings for **' + base + '**. Try another area or size.', { buttons: [B('Find a home', 'intent:search'), B('Menu', 'menu')] }); return; }
    bot.mem.band = s; bot.say('Prices for **' + base + '**\n' + lines.join('\n') + '\nThis comes from my demo listings, not live market data, so treat it as a rough guide.', { buttons: [B('Show these homes', 'act:showband'), B('Menu', 'menu')] });
  }
  function infoReply(bot, l, t) {
    var s, a = l.amenities.join(', ').toLowerCase();
    if (/furnish|furniture/.test(t)) s = l.type === 'plot' ? 'It is a plot, so there is no furnishing.' : FURND[l.furnished];
    else if (/near|around|metro|school|hospital|commute|market|walk|neighbo/.test(t)) s = 'Around ' + l.locality + ' (demo info): ' + NEAR[l.locality].join('; ') + '.';
    else if (/\bpets?\b|\bdogs?\b|\bcats?\b/.test(t)) s = l.amenities.indexOf('Pet friendly') >= 0 ? 'Yes, this one is tagged Pet friendly. The owner may ask for an extra deposit.' : 'Pets are not listed as allowed here. A person can ask the owner for you.';
    else if (/parking/.test(t)) s = l.amenities.indexOf('Parking') >= 0 ? 'Yes, parking is included.' : 'Parking is not listed for this one. A person can confirm with the owner.';
    else if (/amenit|gym|pool|club|lift|garden|backup|play|facilit/.test(t)) s = a ? 'Amenities: ' + a + '.' : 'No shared amenities are listed, it is an open plot.';
    else if (/floor/.test(t)) s = l.type === 'plot' ? 'It is an open plot.' : l.floor ? 'It is on floor ' + l.floor + '.' : 'It is on the ground floor.';
    else if (/size|sqft|area|big|large|space/.test(t)) s = l.area.toLocaleString('en-IN') + ' sqft' + (l.mode === 'sale' ? ', about ₹' + Math.round(l.price / l.area).toLocaleString('en-IN') + ' per sqft' : '') + '.';
    else if (/deposit|maintenance/.test(t)) s = l.mode === 'rent' ? 'The deposit is typically 5 months of rent (' + M(bot, l.price * 5) + '). Maintenance is usually included in the rent for apartments.' : 'Society maintenance is paid by the owner. The token amount to hold it is usually 1% (' + M(bot, l.price / 100) + ').';
    else s = l.title + ' at ' + l.project + ': ' + (l.type === 'plot' ? 'open plot' : l.bhk + ' BHK, ' + FURN[l.furnished].toLowerCase()) + ', ' + l.area.toLocaleString('en-IN') + ' sqft, ' + priceStr(bot, l) + '.';
    bot.say(s, { buttons: [B('Book a visit', 'act:visit:' + l.id), B('More like this', 'act:similar:' + l.id), B('Menu', 'menu')] });
  }
  function offerPerson(bot, reason, text, msg) { bot.mem.offer = { reason: reason + ': “' + String(text).slice(0, 120) + '”' }; bot.say(msg, { buttons: [B('Yes, connect me', 'act:handoff:offer'), B('Not now', 'act:declineoffer')] }); }
  function newCode(bot) {
    var o = bot.mem.otp; if (!o) return false;
    if (o.sent >= 3) { bot.endFlow(); bot.say('I have already sent the code 3 times. A person can finish the booking for you.', { buttons: [B('Talk to a person', 'handover'), B('Menu', 'menu')] }); return false; }
    o.sent++; o.code = String(1000 + Math.floor(Math.random() * 9000)); o.fresh = true; return true;
  }
  function reminder(bot, v, l) { return 'Reminder preview (simulated, nothing is sent): “Hi ' + v.name.split(' ')[0] + ', your visit to ' + l.title + ' is on ' + slotLabel(v) + '. ' + HOSTS[hash(v.id) % HOSTS.length] + ' from Alderway will meet you at the entrance. Reply 2 to reschedule.”'; }
  function visitCard(bot, v, l, head) { return { title: head + ' · ' + v.id, sub: l.title + ' · ' + l.project, img: O.samples(l.img), meta: [slotLabel(v), 'Name: ' + v.name, 'Phone: ' + mask(v.phone), 'About 30 minutes, free'], buttons: [B('Reschedule', 'act:resched:' + v.id), B('Cancel visit', 'act:cancelv:' + v.id), B('Find more homes', 'intent:search')] }; }

  /* ---------- shared flow slots ---------- */
  var NOTNAME = /\b(visit|book|price|show|more|how|what|when|where|why|cancel|agent|human|menu|rent|buy|bhk|furnished|loan|pets?|broker\w*|document\w*|help|thanks|nearby|cheaper|reschedule|resend|code|stop)\b/i;
  function dayAsk(bot, s) {
    var v = s.vid && visitById(bot, s.vid), l = getL(bot, lidOf(bot, s)); bot.say(v ? 'Your visit to **' + l.title + '** is on ' + slotLabel(v) + '. Which new day suits you?' : 'Great, let’s book a visit to **' + l.title + '** (' + l.id + '). Which day suits you? I can do the next 6 days.',
      { buttons: days().filter(function (d) { return free(bot, l.id, d.iso, s.vid).length; }).map(function (d) { return B(d.label, 'slot:day=' + d.iso); }) });
  }
  var DAYSLOT = { name: 'day', ask: dayAsk, hint: 'Tell me a day like “Saturday” or “tomorrow”, or tap one below.',
    parse: function (t) { var w = N.when(t); return w && w.iso ? w.iso : undefined; },
    validate: function (v, bot, s) {
      var d = days().filter(function (x) { return x.iso === v; })[0], all = days(); if (!d) return 'I can book from tomorrow up to ' + all[5].label + '. Please pick a day in that range, for example “Saturday”.';
      var lid = lidOf(bot, s), f = free(bot, lid, v, s.vid); if (!f.length) return d.label + ' is fully booked for this home. Please pick another day.'; if (s.time && f.indexOf(s.time) < 0) delete s.time;
    } };
  var TIMESLOT = { name: 'time', hint: 'Tell me a time like “11 am” or “3 pm”, or tap a free slot.',
    ask: function (bot, s) { var f = free(bot, lidOf(bot, s), s.day, s.vid); bot.say('Free times on **' + O.fmtDay(fromIso(s.day)) + '**:', { buttons: f.map(function (t) { return B(O.fmtTime(t), 'slot:time=' + t); }) }); },
    parse: function (t, bot, s) {
      var w = N.when(t) || {}, b = String(t).trim().match(/^(\d{1,2})(?::00)?$/), f = s.day ? free(bot, lidOf(bot, s), s.day, s.vid) : [];
      if (w.time) return w.time; if (w.timeAmbiguous) return hh(w.timeAmbiguous); if (b && +b[1] >= 1 && +b[1] <= 12) return +b[1] === 12 ? '12:00' : hh(+b[1]);
      if (w.part) { var r = f.filter(function (x) { var h = +x.slice(0, 2); return w.part === 'morning' ? h < 12 : w.part === 'afternoon' ? h >= 12 && h < 17 : h >= 17; }); return r[0]; }
    },
    validate: function (v, bot, s) { if (!s.day) return; var f = free(bot, lidOf(bot, s), s.day, s.vid); if (f.indexOf(v) < 0) return O.fmtTime(v) + ' is not free on ' + O.fmtDay(fromIso(s.day)) + '. Free times: ' + f.map(O.fmtTime).join(', ') + '.'; } };
  function phoneSlot(askText) {
    return { name: 'phone', ask: function (bot) { if (bot.user.phone && bot.user.verified && bot.user.verifiedPhone === bot.user.phone) { bot.slots.phone = bot.user.phone; bot._advance(); return; } if (bot.user.phone) { bot.say(askText + ' Use the number ending **' + String(bot.user.phone).slice(-4) + '**, or type another.', { buttons: [B('Use ' + mask(bot.user.phone), 'slot:phone=' + bot.user.phone)] }); return; } bot.say(askText); },
      parse: function (t) { return N.phone(t); }, hint: 'Please type a 10 digit mobile number.' };
  }
  function vidSlot(verb) {
    return { name: 'vid', ask: function (bot, s) {
      var vs = mine(bot, s.phone); bot.user.phone = s.phone;
      if (!vs.length) { bot.say('I cannot find an active visit for that number. If you booked with another number, try it, or I can bring in a person.', { buttons: [B('Try another number', 'flow:' + verb), B('Book a visit', 'intent:search'), B('Talk to a person', 'handover')] }); bot.endFlow(); return; }
      if (vs.length === 1) { bot.slots.vid = vs[0].id; bot._advance(); return; }
      bot.say('You have ' + vs.length + ' visits booked. Which one?', { buttons: vs.map(function (v) { return B(v.title.split(' in ')[0] + ', ' + slotLabel(v), 'slot:vid=' + v.id); }) });
    }, parse: function (t, bot, s) { var m = String(t).match(/\bAV[- ]?(\d{4})\b/i); return m && visitById(bot, 'AV-' + m[1]) ? 'AV-' + m[1] : undefined; } };
  }

  O.registerAgent({
    id: 'realty', name: 'Alderway Homes Assistant', business: 'Alderway Homes', role: 'Real estate sales', industry: 'Real estate', initials: 'AH', accent: '#5EEAD4', phoneLabel: 'Alderway Homes line',
    blurb: 'Turns a typed brief into rent or sale matches in Bengaluru, answers price questions, books property visits with a demo phone check, reschedules, saves searches and hands over for negotiation or legal questions.',
    helloLine: 'I can find a home to rent or buy, book a visit or check prices in your area.',
    samples: ['3 BHK in Indiranagar under 1.5 lakh a month', '4 BHK villa for sale under 5 Cr', '2 BHK to rent near Koramangala, budget 60k', 'What is the price range for 3 BHK in Whitefield?'],
    kind: 'customer', contexts: [{ label: 'Just browsing', context: {} }, { label: 'Viewing: 3 BHK to rent, Indiranagar', context: { listing: 'AH-101' } }, { label: 'Viewing: 4 BHK villa for sale, Sarjapur Road', context: { listing: 'AH-125' } }, { label: 'Viewing: studio to rent, HSR Layout', context: { listing: 'AH-110' } }],
    synonyms: { apartment: ['flat', 'flats', 'apartments', 'condo', 'condos'], villa: ['villas', 'independent house', 'bungalow'], plot: ['plots', 'land'], studio: ['studios', '1 rk', '1rk'], bhk: ['bedroom', 'bedrooms', 'bhks'], rent: ['rental', 'rentals', 'lease', 'to let', 'renting'], buy: ['purchase', 'buying'],
      visit: ['viewing', 'site visit', 'walkthrough', 'walk through', 'inspection'], book: ['schedule', 'arrange'], cheaper: ['less expensive', 'lower budget', 'lower price', 'more affordable'], costlier: ['more expensive', 'pricier', 'higher budget'], reschedule: ['re schedule', 'rebook', 're book'] },
    seeds: { listings: seedListings, visits: function () { return []; }, searches: function () { return []; }, saved: function () { return []; } },
    menu: [B('Find a home', 'intent:search'), B('Book a visit', 'intent:book_visit'), B('Price check', 'intent:price'), B('Save a search alert', 'intent:saved_search'), B('Reschedule or cancel', 'intent:manage_visit')],
    greeting: function (bot) {
      var l = bot.ctx.listing && getL(bot, bot.ctx.listing);
      if (l) bot.say('Hi, I’m the Alderway Homes assistant. I can see you are looking at the **' + l.title + '** (' + l.id + '), ' + priceStr(bot, l) + '. Ask me about price, furnishing or what is nearby, or book a visit.', { cards: [card(bot, l)], buttons: [B('Is it furnished?', 'say:is it furnished'), B('What is nearby?', 'say:what is nearby'), B('Find another home', 'intent:search')] });
      else bot.say('Hi, I’m the Alderway Homes assistant. I can find a home to rent or buy in Bengaluru, book a visit or check prices in your area. Tell me what you need, for example “3 BHK in Indiranagar under 1.5 lakh a month”.', { buttons: bot.agent.menu });
    },
    extract: function (text, bot) {
      var raw = String(text), t = ' ' + raw.toLowerCase().replace(/(\d(?:\.\d+)?)\s?l\b/g, '$1 lakh') + ' ', e = {}, pure = /^[\s\d+()-]+$/.test(raw), pn = bot && bot.flow && bot.pending ? bot.pending.name : '', id = raw.match(/\bAH[- ]?(\d{3})\b/i), rent, buy, nb, ph, w, tm, m, ar, am = [], lc;
      if (id) e.listing = 'AH-' + id[1];
      rent = /\b(rent|rental|renting|lease|to let|per month|monthly|a month)\b/.test(t); buy = /\b(buy|buying|purchase|for sale|sale|resale)\b/.test(t); if (rent && buy) e.mode = 'any'; else if (rent) e.mode = 'rent'; else if (buy) e.mode = 'sale';
      if (/\bvillas?\b|independent house|bungalow/.test(t)) e.type = 'villa'; else if (/\bplots?\b|\bland\b/.test(t)) e.type = 'plot'; else if (/\bstudios?\b|\b1 ?rk\b/.test(t)) e.type = 'studio'; else if (/\b(flats?|apartments?|apts?|condos?)\b/.test(t)) e.type = 'apartment';
      nb = N.bhk(raw); if (nb !== undefined && e.type !== 'plot' && !(e.type === 'studio' && !/(\d|one|two|three|four|five|six)\s*[- ]?\s*(bhk|bed|br)/i.test(raw))) e.bhk = nb;
      lc = findLocs(t); if (lc.length) e.locality = lc;
      if (/\b(unfurnished|not furnished|without furniture)\b/.test(t)) e.furnished = 'unfurnished'; else if (/semi[- ]?furnished|partly furnished/.test(t)) e.furnished = 'semi'; else if (/\bfurnished\b/.test(t)) e.furnished = 'furnished';
      [[/\bparking\b/, 'Parking'], [/\bgym\b/, 'Gym'], [/\b(pool|swimming)\b/, 'Pool'], [/\b(lift|elevator)\b/, 'Lift'], [/\bpet[- ]friendly\b/, 'Pet friendly'], [/\bgarden\b/, 'Garden'], [/club ?house/, 'Clubhouse'], [/power backup|generator/, 'Power backup'], [/gated/, 'Gated community']].forEach(function (a) { if (a[0].test(t)) am.push(a[1]); }); if (am.length) e.amen = am;
      if (!pure && (m = N.money(t))) { if (m.min != null) e.minPrice = Math.round(m.min); if (m.max != null) e.maxPrice = Math.round(m.max); var pv = m.max != null ? m.max : m.min; if (!e.mode && pv != null) e.modeGuess = pv < 4e5 ? 'rent' : 'sale'; }
      if ((ar = N.area(t))) { if (/(under|below|less than|max|up to|upto)\s*\d/.test(t)) e.maxArea = ar; else e.minArea = Math.round(ar * .9); }
      if (/\b(cheaper|less expensive|lower budget|lower price|affordable)\b/.test(t)) e.rel = 'cheaper'; else if (/\b(costlier|more expensive|pricier|higher budget|premium)\b/.test(t)) e.rel = 'costlier'; else if (/\b(bigger|larger|more space|spacious)\b/.test(t)) e.rel = 'bigger';
      if (!(bot && bot.flow && ['name', 'phone', 'otp', 'contact', 'confirm'].indexOf(pn) >= 0)) { w = N.when(raw); if (w) { if (w.iso) e.day = w.iso; tm = w.time || (w.timeAmbiguous ? hh(w.timeAmbiguous) : ''); if (tm) e.time = tm; if (w.part) e.part = w.part; } }
      ph = N.phone(raw); if (ph) e.phone = ph; return e;
    },
    intents: [
      { id: 'search', label: 'Find a home', kw: ['find', 'looking for', 'look for', 'show me', 'search', 'apartment', 'villa', 'plot', 'studio', 'home', 'homes', 'house', 'property', 'properties', 'listing', 'listings', 'rent', 'buy', 'for sale', 'under', 'below', 'budget', 'cheaper', 'costlier', 'bigger', 'larger', 'furnished only', 'unfurnished', 'semi furnished', 'make it', 'change it', 'instead', 'new search', 'different area', 'another area', 'other area', 'options'], re: [/\b\d\s*bhk\b/i], run: doSearch },
      { id: 'more', label: 'Show more', kw: ['show more', 'show me more', 'more results', 'more homes', 'more options', 'see more', 'next page', 'next ones', 'any more'], priority: 2, run: function (bot) { actions.more(bot); } },
      { id: 'similar', label: 'More like this', kw: ['more like this', 'similar', 'something like this', 'alternatives', 'like this one'], priority: 2, run: function (bot, m) { var l = focus(bot, m.ent); if (l) similar(bot, l); else bot.say('Which home should I match? Tap “More like this” on a card, or type its code like AH-104.'); } },
      { id: 'price', label: 'Price check', kw: ['price range', 'average price', 'average rent', 'typical rent', 'typical price', 'market rate', 'going rate', 'price band', 'what is the price', 'what is the rent', 'whats the price', 'whats the rent', 'what are the rents', 'what are the prices', 'how much is the rent', 'what is the cost', 'how much is', 'how much does', 'how much for', 'how much are', 'how much would', 'what does it cost', 'what do they cost', 'cost of', 'rates', 'asking price', 'price of', 'rent of', 'how expensive', 'price', 'rent range'], priority: 3, ctx: function (bot) { return focus(bot) ? 1 : 0; },
        run: function (bot, m) {
          var e = m.ent, has = e.bhk !== undefined || e.locality || e.type || e.mode; if (has) { priceBand(bot, e); return; }
          var l = focus(bot, e); if (l) { bot.say('**' + l.title + '** (' + l.id + ') is **' + priceStr(bot, l) + '**' + (l.mode === 'rent' ? '. Deposit is usually 5 months of rent.' : ', about ₹' + Math.round(l.price / l.area).toLocaleString('en-IN') + ' per sqft.'), { buttons: [B('Book a visit', 'act:visit:' + l.id), B('Can the price come down?', 'say:can the owner reduce the price'), B('Menu', 'menu')] }); return; }
          bot.say('Which area and size should I check? For example “3 bhk in Whitefield” or “villa for sale in Sarjapur Road”.', { buttons: [B('3 BHK in Whitefield', 'say:price range for 3 bhk in whitefield'), B('2 BHK in Koramangala', 'say:price range for 2 bhk in koramangala'), B('Villas for sale', 'say:price range for villa for sale')] });
        } },
      { id: 'listing_info', label: 'About this home', kw: ['is it furnished', 'is this furnished', 'what is nearby', 'whats nearby', 'what is near', 'nearby', 'how big', 'which floor', 'what floor', 'amenities', 'does it have', 'tell me more', 'more about this', 'about this home', 'details', 'pets allowed', 'is parking'], re: [/\b(is|are|does|do|has|have|can)\s+(it|this|that|the (flat|house|home|apartment|villa|place|property|listing))\b/], priority: 1, ctx: function (bot) { return focus(bot) ? 2 : 0; },
        run: function (bot, m) { var l = focus(bot, m.ent); if (!l) { bot.say('Which home do you mean? Tap a card, or type its code like AH-104.', { buttons: [B('Find a home', 'intent:search')] }); return; } infoReply(bot, l, m.text.toLowerCase()); } },
      { id: 'book_visit', label: 'Book a visit', kw: ['book a visit', 'book visit', 'visit', 'see it', 'see the flat', 'see the house', 'see this', 'see the place', 'view it', 'i want to see', 'come and see', 'book it', 'book this', 'book that', 'i like this', 'i like it'], priority: 2, ctx: function (bot) { return focus(bot) ? 1 : 0; },
        run: function (bot, m) {
          var e = m.ent, p = {}, l = focus(bot, e), d = e.day && days().filter(function (x) { return x.iso === e.day; })[0], f; if (e.listing && getL(bot, e.listing)) p.listing = e.listing;
          if (e.day && !d) bot.say('I can only book from tomorrow up to ' + days()[5].label + '.'); if (d && l && e.time && free(bot, l.id, d.iso).indexOf(e.time) < 0) bot.say(O.fmtTime(e.time) + ' is already taken on ' + d.label + '.'); if (d && (!l || (f = free(bot, l.id, d.iso)).length)) { p.day = d.iso; if (e.time && (!l || f.indexOf(e.time) >= 0)) p.time = e.time; }
          if (e.phone) p.phone = e.phone; bot.startFlow('visit', p);
        } },
      { id: 'reschedule', label: 'Reschedule a visit', kw: ['reschedule', 'move my visit', 'change my visit', 'change the time', 'change the date', 'postpone', 'different time', 'another time for my visit', 'shift my visit'], priority: 3, run: function (bot, m) { bot.startFlow('reschedule', m.ent.phone ? { phone: m.ent.phone } : {}); } },
      { id: 'cancel_visit', label: 'Cancel a visit', kw: ['cancel my visit', 'cancel the visit', 'cancel visit', 'cancel my booking', 'cancel booking', 'cancel my appointment'], priority: 3, run: function (bot, m) { bot.startFlow('cancel_visit', m.ent.phone ? { phone: m.ent.phone } : {}); } },
      { id: 'manage_visit', label: 'Manage my visit', kw: ['my visit', 'my booking', 'manage visit', 'manage booking', 'existing visit'], run: function (bot) { bot.say('Sure. What would you like to do with your visit?', { buttons: [B('Reschedule it', 'flow:reschedule'), B('Cancel it', 'flow:cancel_visit'), B('Menu', 'menu')] }); } },
      { id: 'saved_search', label: 'Save a search alert', kw: ['save this search', 'save search', 'save my search', 'saved search', 'alert me', 'search alert', 'new listings', 'notify me', 'email me when', 'keep me posted', 'alerts', 'save a search'], priority: 2,
        run: function (bot, m) { if (!bot.mem.search) { bot.say('I can save a search once we have one. Tell me what you are looking for, for example “2 bhk to rent in HSR under 45k”.', { buttons: [B('Find a home', 'intent:search')] }); return; } bot.startFlow('savesearch', m.ent.phone ? { contact: m.ent.phone } : {}); } },
      { id: 'shortlist', label: 'My shortlist', kw: ['my shortlist', 'shortlist', 'saved homes', 'saved listings', 'my saved', 'show saved', 'favourites', 'favorites'], priority: 2, run: function (bot) { actions.shortlist(bot); } },
      { id: 'negotiate', label: 'Negotiate price', kw: ['negotiate', 'negotiable', 'negotiation', 'bargain', 'discount', 'reduce the price', 'reduce the rent', 'lower the price', 'lower the rent', 'come down', 'last price', 'final price', 'best price', 'can the owner', 'owner agree', 'waive', 'less rent'], priority: 5,
        run: function (bot, m) { var l = focus(bot, m.ent); offerPerson(bot, 'Price negotiation' + (l ? ' on ' + l.id + ' (' + l.locality + ', ' + priceStr(bot, l) + ')' : ''), m.text, 'I cannot change a price myself, because any movement has to be agreed by the owner. I can bring in a person from our team who talks to owners directly. Shall I connect you?'); } },
      { id: 'legal', label: 'Legal or ownership', kw: ['legal', 'lawyer', 'advocate', 'title deed', 'clear title', 'encumbrance', 'ownership', 'sale deed', 'khata', 'stamp duty', 'registration charges', 'dispute', 'court', 'rera', 'power of attorney', 'tenancy law', 'lock in clause'], priority: 4,
        run: function (bot, m) { var l = focus(bot, m.ent); offerPerson(bot, 'Legal or ownership question' + (l ? ' about ' + l.id : ''), m.text, 'That is a legal question, and I should not guess on it. A person from our team, with our panel advocate if needed, can go through the papers with you. Shall I connect you?'); } }
    ],
    flows: {
      visit: { intent: 'book_visit', slots: [
        { name: 'listing', ask: function (bot) { var l = focus(bot); if (l) { bot.slots.listing = l.id; bot._advance(); return; } var rs = (bot.mem.results || []).slice(0, 4); bot.say('Which home would you like to see? Tap one, or type its code like **AH-104**.', { buttons: rs.length ? rs.map(function (id) { var x = getL(bot, id); return B(id + ' · ' + x.locality, 'slot:listing=' + id); }) : [B('Find a home', 'intent:search')] }); },
          parse: function (t, bot) { var m = String(t).match(/\bAH[- ]?(\d{3})\b/i), o = { first: 0, '1st': 0, second: 1, '2nd': 1, third: 2, '3rd': 2, fourth: 3, '4th': 3 }, w = String(t).toLowerCase().match(/\b(first|second|third|fourth|1st|2nd|3rd|4th)\b/); if (m) return 'AH-' + m[1]; if (w && bot.mem.results && bot.mem.results[o[w[1]]]) return bot.mem.results[o[w[1]]]; },
          validate: function (v, bot) { if (!getL(bot, v)) return 'I could not find ' + v + '. Listing codes look like AH-104.'; }, hint: 'Type the listing code, like AH-104, or say “the first one”.' },
        DAYSLOT, TIMESLOT,
        { name: 'name', ask: function (bot) { if (bot.user.name) { bot.slots.name = bot.user.name; bot._advance(); return; } bot.say('Whose name should the visit be under?'); }, parse: function (t, bot) { if (NOTNAME.test(t) || /\d/.test(t) || O.kb.match('realty', t, bot.agent.synonyms)) return undefined; return N.name(t); }, hint: 'Just your name is fine, for example “Rohan Mehta”.' },
        phoneSlot('What mobile number can our host reach you on?'),
        { name: 'otp', when: function (bot, s) { return !(bot.user.verified && bot.user.verifiedPhone === s.phone); }, hint: 'Please type the 4 digit demo code shown above, or tap Resend code.',
          ask: function (bot, s) {
            var o = bot.mem.otp; if (!o || o.phone !== s.phone) o = bot.mem.otp = { phone: s.phone, code: String(1000 + Math.floor(Math.random() * 9000)), tries: 0, sent: 1 };
            if (o.fresh) { o.fresh = false; bot.say('Here is a fresh code. **Demo only, nothing is sent: ' + o.code + '.** Type it here.', { buttons: [B('Resend code', 'act:resend')], spoken: 'Your new demo code is ' + o.code.split('').join(', ') + '. Please type it. Or press 1 to get another code.' }); }
            else if (!o.tries) bot.say('To confirm it is you, I have sent a 4 digit code to ' + mask(s.phone) + '. **Demo only: no SMS is really sent, so your demo code is ' + o.code + '.** Type it here.', { buttons: [B('Resend code', 'act:resend')], spoken: 'To confirm it is you I would send a code to your phone. This is a demo, so no message is sent. Your demo code is ' + o.code.split('').join(', ') + '. Please type it. Or press 1 to get a new code.' });
            else bot.say('That code does not match. ' + (3 - o.tries) + (3 - o.tries === 1 ? ' try' : ' tries') + ' left. Demo code: **' + o.code + '**.', { buttons: [B('Resend code', 'act:resend')] });
          },
          parse: function (t, bot) { var m = String(t).match(/\b(\d{4})\b/), o = bot.mem.otp; if (/\b(resend|re-send|new code|another code|send (it )?again|didn.?t (get|receive)|did not (get|receive)|no code)\b/i.test(t)) return 'resend'; if (!m || !o) return undefined; if (m[1] === o.code) return 'ok'; o.tries++; return o.tries >= 3 ? 'fail' : 'bad'; } }
      ], done: function (bot, s) {
        var l = getL(bot, s.listing), keep = { listing: s.listing, day: s.day, time: s.time, name: s.name, phone: s.phone };
        if (s.otp === 'bad') { bot.startFlow('visit', keep); return; }
        if (s.otp === 'resend') { if (newCode(bot)) bot.startFlow('visit', keep); return; }
        if (s.otp === 'fail') { bot.mem.otp = null; bot.user.name = s.name; bot.user.phone = s.phone; bot.say('That was three wrong codes, so I have stopped to keep the booking safe. You can try again with a fresh code, or a person can book it for you.', { buttons: [B('Try again', 'act:visit:' + s.listing), B('Talk to a person', 'handover')] }); return; }
        if (s.otp === 'ok') { bot.user.verified = true; bot.user.verifiedPhone = s.phone; bot.mem.otp = null; }
        if (free(bot, l.id, s.day).indexOf(s.time) < 0) { delete keep.time; if (!free(bot, l.id, s.day).length) delete keep.day; bot.say('Sorry, that slot was just taken. Let me show you the free times again.'); bot.startFlow('visit', keep); return; }
        bot.user.name = s.name; bot.user.phone = s.phone;
        var vs = bot.db('visits'), v = { id: 'AV-' + (2100 + vs.length + 1), listing: l.id, title: l.title, iso: s.day, time: s.time, name: s.name, phone: s.phone, status: 'booked', at: Date.now() };
        vs.push(v); bot.save('visits', vs); bot.mem.current = l.id;
        bot.lead({ name: s.name, phone: s.phone, intent: 'book_visit', payload: { listing: l.id, title: l.title, locality: l.locality, mode: l.mode, price: l.price, slot: slotLabel(v), visit: v.id, verified: true } });
        bot.event('booking', { kind: 'visit' });
        bot.say('Your visit is booked, ' + s.name.split(' ')[0] + '. **' + l.title + '** on **' + slotLabel(v) + '**. Our host will meet you at the entrance.', { cards: [visitCard(bot, v, l, 'Visit confirmed')] });
        bot.say(reminder(bot, v, l), { buttons: [B('Find more homes', 'intent:search'), B('That’s all', 'say:bye')] });
      } },
      reschedule: { intent: 'reschedule', slots: [phoneSlot('Sure. What number did you book the visit with?'), vidSlot('reschedule'), DAYSLOT, TIMESLOT], done: function (bot, s) {
        var vs = bot.db('visits'), v = vs.filter(function (x) { return x.id === s.vid; })[0], l = getL(bot, v.listing);
        if (free(bot, l.id, s.day, v.id).indexOf(s.time) < 0) { bot.say('Sorry, that slot was just taken.'); bot.startFlow('reschedule', { phone: s.phone, vid: s.vid, day: s.day }); return; }
        v.iso = s.day; v.time = s.time; v.rescheduled = (v.rescheduled || 0) + 1; bot.save('visits', vs); bot.event('action', { action: 'visit_rescheduled' });
        bot.say('Done, your visit is moved to **' + slotLabel(v) + '**. The old slot is free again.', { cards: [visitCard(bot, v, l, 'Visit rescheduled')] }); bot.say(reminder(bot, v, l));
      } },
      cancel_visit: { intent: 'cancel_visit', slots: [phoneSlot('Sure. What number did you book the visit with?'), vidSlot('cancel_visit'),
        { name: 'confirm', ask: function (bot, s) { var v = visitById(bot, s.vid); bot.say('Cancel your visit to **' + v.title + '** on ' + slotLabel(v) + '?', { buttons: [B('Yes, cancel it', 'slot:confirm=yes'), B('No, keep it', 'slot:confirm=no'), B('Move it instead', 'act:resched:' + v.id)] }); }, parse: function (t) { var y = N.yesno(t); return y === undefined ? undefined : y ? 'yes' : 'no'; } }
      ], done: function (bot, s) {
        if (s.confirm === 'no') { bot.say('Okay, your visit stays as it is.', { buttons: [B('Menu', 'menu')] }); return; }
        var vs = bot.db('visits'), v = vs.filter(function (x) { return x.id === s.vid; })[0]; v.status = 'cancelled'; bot.save('visits', vs); bot.event('action', { action: 'visit_cancelled' });
        bot.say('Your visit to **' + v.title + '** on ' + slotLabel(v) + ' is cancelled and the slot is open again. Want to look at other homes?', { buttons: [B('Find a home', 'intent:search'), B('That’s all', 'say:bye')] });
      } },
      savesearch: { intent: 'saved_search', slots: [
        { name: 'name', ask: function (bot) { if (bot.user.name) { bot.slots.name = bot.user.name; bot._advance(); return; } bot.say('Happy to save it. What name should I put on the alert?'); }, parse: function (t, bot) { if (NOTNAME.test(t) || /\d/.test(t) || O.kb.match('realty', t, bot.agent.synonyms)) return undefined; return N.name(t); }, hint: 'Just your name is fine.' },
        { name: 'contact', ask: function (bot) { bot.say('Where should the alerts go? Type a mobile number or an email address.', bot.user.phone ? { buttons: [B('Use ' + mask(bot.user.phone), 'slot:contact=' + bot.user.phone)] } : undefined); }, parse: function (t) { return N.phone(t) || N.email(t); }, hint: 'Please type a 10 digit mobile number or an email address.' }
      ], done: function (bot, s) {
        var se = bot.db('searches'), d = describe(bot, bot.mem.search), em = N.email(s.contact), ph = em ? '' : N.phone(s.contact) || s.contact, rec = { id: 'SS-' + (300 + se.length + 1), desc: d, filters: bot.mem.search, name: s.name, contact: s.contact, at: Date.now() };
        se.push(rec); bot.save('searches', se); bot.user.name = s.name; if (em) bot.user.email = em; else bot.user.phone = ph;
        bot.lead({ name: s.name, phone: ph, email: em || undefined, intent: 'saved_search', payload: { search: d, filters: bot.mem.search, contact: s.contact, ref: rec.id } }); bot.event('action', { action: 'saved_search' });
        bot.say('Saved as **' + rec.id + '**: ' + d + '. When new matches appear I will message ' + (em ? em : mask(ph)) + '. Heads up, alerts are simulated in this demo, so nothing will actually be sent.', { buttons: [B('Show results now', 'act:results'), B('Menu', 'menu')] });
      } }
    },
    actions: {
      visit: function (bot, id) { if (!getL(bot, id)) return; bot.mem.current = id; bot.startFlow('visit', { listing: id }); },
      resched: function (bot, id) { var v = visitById(bot, id); if (v) bot.startFlow('reschedule', { phone: v.phone, vid: id }); },
      cancelv: function (bot, id) { var v = visitById(bot, id); if (v) bot.startFlow('cancel_visit', { phone: v.phone, vid: id }); },
      save: function (bot, id) {
        var l = getL(bot, id), sv = bot.db('saved'); if (!l) return; if (sv.indexOf(id) < 0) sv.push(id); bot.save('saved', sv); bot.mem.current = id; bot.event('action', { action: 'save_listing' });
        bot.say('Saved **' + l.title + '** to your shortlist (' + sv.length + ' saved).', { buttons: [B('Book a visit', 'act:visit:' + id), B('My shortlist', 'intent:shortlist'), B('More like this', 'act:similar:' + id)] });
      },
      shortlist: function (bot) { bot.endFlow();
        var sv = bot.db('saved').map(function (id) { return getL(bot, id); }).filter(Boolean); if (!sv.length) { bot.say('Your shortlist is empty. Tap “Save this” on a card to add a home.', { buttons: [B('Find a home', 'intent:search')] }); return; }
        bot.say('You have ' + sv.length + ' saved home' + (sv.length > 1 ? 's' : '') + ':', { cards: sv.slice(0, phoneCh(bot) ? 3 : 4).map(function (l) { return card(bot, l); }), buttons: [B('Find more', 'intent:search'), B('Menu', 'menu')] });
      },
      similar: function (bot, id) { bot.endFlow(); var l = getL(bot, id); if (l) { bot.mem.current = id; similar(bot, l); } },
      more: function (bot) { bot.endFlow();
        var ids = bot.mem.results, per = phoneCh(bot) ? 3 : 4; if (!ids || !ids.length) { bot.say('There is nothing to continue yet. Tell me what you are looking for.', { buttons: [B('Find a home', 'intent:search')] }); return; }
        if ((bot.mem.page + 1) * per >= ids.length) { bot.say('That is everything I have (' + ids.length + ' ' + (ids.length === 1 ? 'match' : 'matches') + '). I can widen the search, or save it and alert you.', { buttons: [B('Cheaper', 'say:cheaper'), B('Save this search', 'intent:saved_search'), B('New search', 'act:newsearch')] }); return; }
        bot.mem.page++; page(bot, 'Here are matches ' + (bot.mem.page * per + 1) + ' to ' + Math.min(ids.length, (bot.mem.page + 1) * per) + ' of ' + ids.length + ':');
      },
      mode: function (bot, md) { var s = bot.mem.search || {}; s.mode = md; showResults(bot, s); },
      results: function (bot) { bot.endFlow(); if (bot.mem.search) showResults(bot, bot.mem.search); else promptSearch(bot); },
      showband: function (bot) { bot.endFlow(); if (bot.mem.band) { var s = cp(bot.mem.band); if (!s.mode) { askMode(bot, s); return; } showResults(bot, s); } },
      newsearch: function (bot) { bot.endFlow(); bot.mem.search = null; bot.mem.results = null; bot.mem.current = ''; promptSearch(bot); },
      resend: function (bot) { if (bot.flow === 'visit' && bot.pending && bot.pending.name === 'otp' && newCode(bot)) bot.pending.ask(bot, bot.slots); else if (!(bot.flow === 'visit')) bot.say('There is no code to resend right now.'); },
      handoff: function (bot, arg) {
        var l = focus(bot), at = l ? ' (' + l.id + ')' : '', r = arg === 'offer' && bot.mem.offer ? bot.mem.offer.reason : ({ loan: 'Home loan help' + at, legal: 'Legal or property check question' + at, neg: 'Price negotiation' + at })[arg] || 'Visitor asked for a person';
        bot.mem.offer = null; bot.handover(r);
      },
      declineoffer: function (bot) { bot.mem.offer = null; bot.say('No problem. I am here if you change your mind.', { buttons: [B('Find a home', 'intent:search'), B('Menu', 'menu')] }); }
    },
    kb: [
      { id: 'brokerage', q: 'Do you charge brokerage?', a: 'Viewing homes is free. Brokerage is half a month’s rent from the tenant on rentals and 1% of the sale value from the buyer on purchases. It is due only after an agreement is signed. These are demo terms.', keys: ['brokerage', 'broker fee', 'commission', 'service fee', 'do you charge', 'fees'] },
      { id: 'docs', q: 'Which documents do I need?', a: 'To rent: a photo ID, address proof, a recent payslip or employment letter and two passport photos. To buy: PAN, ID and address proof, income proof if you need a loan, and the token amount. Company-leased homes need a letter from your employer.', keys: ['documents', 'paperwork', 'what do i need', 'id proof', 'kyc', 'documents needed', 'papers needed'] },
      { id: 'loan', q: 'Can you help with a home loan?', a: 'Yes, we can walk you through the steps with partner banks: eligibility, documents and a rough EMI. As a rule of thumb, an EMI is about ₹870 a month for every ₹1 lakh borrowed over 20 years at 8.5% (a demo figure). For a real eligibility check, a person from our team can help.', keys: ['home loan', 'loan', 'emi', 'mortgage', 'bank loan', 'loan eligibility', 'pre approval', 'down payment', 'finance'], buttons: [B('Talk to a loan advisor', 'act:handoff:loan'), B('Menu', 'menu')] },
      { id: 'verify', q: 'Are the listings verified?', a: 'Every listing is visited by our team before it goes live: we check the owner’s papers, match the photos on site and confirm the price. For a deeper legal check on a home you are serious about, a person can arrange it with our panel advocate.', keys: ['verified', 'verification', 'genuine', 'fake listing', 'is it genuine', 'are listings real', 'ownership check', 'title check'], buttons: [B('Ask a person about legal checks', 'act:handoff:legal'), B('Menu', 'menu')] },
      { id: 'pets', q: 'Are pets allowed?', a: 'Many homes welcome pets. A card with a Pet friendly tag means the owner has said yes, and some owners ask for an extra deposit. Give me a home code and I can check its tag.', keys: ['pet policy', 'pets allowed', 'allow pets', 'are pets allowed', 'dogs', 'cats', 'pets', 'bring my dog'] },
      { id: 'maint', q: 'Who pays maintenance and utilities?', a: 'On rentals the monthly maintenance is usually included for apartments, and the tenant pays electricity, water and internet. On purchases the owner pays society maintenance, typically ₹3 to ₹5 per sqft per month (a demo figure). Exact terms are confirmed before you sign.', keys: ['maintenance', 'maintenance charges', 'society charges', 'association fee', 'who pays maintenance', 'electricity bill', 'water bill', 'utilities'] },
      { id: 'possession', q: 'How soon can I move in?', a: 'All homes in my demo list are ready to move. Rentals can usually be occupied 7 to 10 days after the agreement is signed. Resale purchases take around 30 to 45 days from token to registration, depending on your loan.', keys: ['possession', 'move in', 'when can i move in', 'ready to move', 'under construction', 'handover date', 'how soon'] },
      { id: 'visits', q: 'How do visits work?', a: 'You pick a home, a day in the next 6 days and a free slot. I confirm it with a code to your phone, and a host from our team meets you at the entrance. A visit takes about 30 minutes and is free. You can reschedule or cancel here using your phone number.', keys: ['how do visits work', 'how does a visit work', 'visit process', 'what happens at a visit', 'visit duration', 'is the visit free', 'visit charges', 'how long is a visit'], buttons: [B('Book a visit', 'intent:book_visit'), B('Menu', 'menu')] },
      { id: 'deposit', q: 'What about deposit and lease terms?', a: 'Rental deposits are usually 3 to 6 months of rent and are refundable at move-out after a check. Lease terms are 11 months, renewable, with a 2 month notice period. These are demo terms.', keys: ['security deposit', 'deposit', 'advance', 'lock in period', 'notice period', 'lease term', 'lease terms'] },
      { id: 'hours', q: 'When can I reach your team?', a: 'Our team is online 9 am to 7 pm, Monday to Saturday (IST). I am here around the clock, and anything I cannot finish goes to the team with the full chat.', keys: ['opening hours', 'office hours', 'working hours', 'when are you open', 'office address', 'where is your office', 'contact number', 'contact'], buttons: [B('Talk to a person', 'handover'), B('Menu', 'menu')] }
    ],
    freeText: function (bot, m) {
      var e = m.ent, t = m.text, y = N.yesno(t);
      if (bot.mem.offer && y !== undefined) { if (y) actions.handoff(bot, 'offer'); else actions.declineoffer(bot); return true; }
      if (e.listing && getL(bot, e.listing) && !facetCount(e)) { var l = focus(bot, e); bot.say('Here is ' + l.id + '. What would you like to do with it?', { cards: [card(bot, l)], buttons: [B('Is it furnished?', 'say:is it furnished'), B('What is nearby?', 'say:what is nearby')] }); return true; }
      var fl = focus(bot), onlyAm = Object.keys(e).every(function (k) { return ['amen', 'furnished', 'modeGuess'].indexOf(k) >= 0; });
      if (fl && onlyAm && (e.amen || e.furnished) && (/\?/.test(t) || t.split(/\s+/).length <= 3)) { infoReply(bot, fl, t.toLowerCase()); return true; }
      if (facetCount(e) || e.rel) { doSearch(bot, m); return true; }
      return false;
    }
  });

  var actions = O.agents.realty.actions;
  function similar(bot, l) {
    var sc = bot.db('listings').filter(function (x) { return x.id !== l.id && x.mode === l.mode; }).map(function (x) { return { x: x, s: (x.locality === l.locality ? 2 : 0) + (x.bhk === l.bhk ? 2 : 0) + (x.type === l.type ? 1 : 0) + (Math.abs(x.price - l.price) / l.price < .3 ? 2 : 0) }; }).filter(function (o) { return o.s >= 3; })
      .sort(function (a, b) { return b.s - a.s || Math.abs(a.x.price - l.price) - Math.abs(b.x.price - l.price); });
    if (!sc.length) { bot.say('I do not have a close match to **' + l.title + '** right now. I can search again with a different brief.', { buttons: [B('Find a home', 'intent:search')] }); return; }
    bot.mem.results = sc.map(function (o) { return o.x.id; }); bot.mem.page = 0; bot.mem.current = ''; page(bot, 'Homes similar to **' + l.title + '** (' + priceStr(bot, l) + '):');
  }
})();
