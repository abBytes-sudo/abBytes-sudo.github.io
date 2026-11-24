/* Agent: Tamarind Row Assistant (fictional modern Indian restaurant, Bengaluru). Table booking with a real seating model, waitlist, reschedule and cancel,
   menu Q&A with dietary filters, allergy caution, FAQ. Demo only: nothing leaves the browser. Bookings and the waitlist live in localStorage through bot.db / bot.save.
   Seating: 30 minute grid, lunch 12:00 to 15:00 (last seating 14:00), dinner 19:00 to 23:00 (last seating 21:30). Occupancy for the next ten days is generated
   deterministically from the date (Orbit.rng), so the same slots are full on every visit; real bookings are layered on top and remove a table from that slot. */
(function () {
  'use strict';
  var O = window.Orbit, N = O.nlp, B = function (l, v) { return { label: l, value: v }; }, R = function (n) { return O.money(n, '₹'); };
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MONS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MINSP = { lunch: 15000, dinner: 25000 }, HORIZON = 9;
  var CAUT = 'Please confirm allergens with the kitchen before you order. Our tags are a guide, and because we cook in a shared kitchen I cannot promise a dish is free of traces.';

  /* ---------- menu ---------- */
  var AL = { d: 'dairy', g: 'gluten', n: 'nuts', s: 'shellfish', f: 'fish', e: 'egg' }, SPL = ['not spicy', 'mild', 'medium', 'hot'];
  var CNAME = { starter: 'starters', main: 'mains', bread: 'breads', rice: 'rice dishes', dessert: 'desserts', drink: 'drinks' };
  var TAGN = { veg: 'Vegetarian', vegan: 'Vegan', 'gluten-free': 'Gluten-free', 'nut-free': 'Nut-free', 'dairy-free': 'Dairy-free', jain: 'Jain' };
  // id, name, course, price, spice 0-3, veg, allergens (d dairy, g gluten, n nuts, s shellfish, f fish, e egg), jain, chef pick, description
  var RAW = [
    ['beet-tikki', 'Smoked Beetroot Tikki', 'starter', 340, 1, 1, '', 0, 0, 'Beetroot and potato patties smoked over coal, with tamarind chutney.'],
    ['paneer-tikka', 'Charred Paneer Tikka', 'starter', 420, 2, 1, 'd', 0, 1, 'Tandoor paneer with ajwain and mint yoghurt.'],
    ['prawn-skewers', 'Kasundi Prawn Skewers', 'starter', 560, 2, 0, 's', 0, 0, 'Prawns in mustard and green mango, grilled on skewers.'],
    ['mango-chaat', 'Raw Mango Chaat Cups', 'starter', 290, 1, 1, '', 1, 0, 'Crisp lentil cups with raw mango, pomegranate and sev.'],
    ['galouti', 'Lamb Galouti with Tawa Paratha', 'starter', 640, 2, 0, 'dg', 0, 1, 'Melt-in-the-mouth lamb patties on a flaky griddle paratha.'],
    ['okra-fries', 'Crisp Okra Fries', 'starter', 260, 1, 1, '', 1, 0, 'Okra batons, dusted with amchur and chaat masala.'],
    ['black-dal', 'Black Dal Tamarind Row', 'main', 420, 1, 1, 'd', 0, 1, 'Our signature dal, simmered for eighteen hours and finished with butter.'],
    ['coconut-stew', 'Malabar Vegetable Stew', 'main', 460, 1, 1, '', 0, 0, 'Seasonal vegetables in a gentle coconut and green chilli broth.'],
    ['fish-curry', 'Kerala Fish Curry', 'main', 680, 3, 0, 'f', 0, 0, 'Seer fish in a tangy kokum and red chilli curry.'],
    ['laal-maas', 'Laal Maas Lamb', 'main', 720, 3, 0, 'd', 0, 0, 'Slow-cooked lamb in a fiery Mathania chilli gravy.'],
    ['butter-chicken', 'Wood-fired Butter Chicken', 'main', 620, 1, 0, 'dn', 0, 0, 'Tandoor chicken in a silky tomato and cashew gravy.'],
    ['paneer-lababdar', 'Paneer Lababdar', 'main', 480, 1, 1, 'dn', 0, 0, 'Paneer in a rich tomato, cream and cashew sauce.'],
    ['mushroom-pepper', 'Chettinad Mushroom Pepper Roast', 'main', 440, 3, 1, '', 0, 0, 'Wild mushrooms roasted with black pepper and curry leaf.'],
    ['lauki-kofta', 'Jain Lauki Kofta', 'main', 430, 1, 1, 'd', 1, 0, 'Bottle gourd dumplings in a tomato gravy, no onion or garlic.'],
    ['butter-naan', 'Butter Naan', 'bread', 90, 0, 1, 'dg', 0, 0, 'Soft tandoor bread brushed with butter.'],
    ['garlic-kulcha', 'Garlic Kulcha', 'bread', 110, 0, 1, 'dg', 0, 0, 'Leavened bread with roasted garlic and coriander.'],
    ['millet-roti', 'Millet Roti', 'bread', 80, 0, 1, '', 1, 0, 'Rustic bajra and jowar flatbread, cooked dry.'],
    ['lachha-paratha', 'Lachha Paratha', 'bread', 100, 0, 1, 'dg', 0, 0, 'Layered whole wheat paratha.'],
    ['lamb-biryani', 'Lamb Dum Biryani', 'rice', 640, 2, 0, 'd', 0, 0, 'Basmati and lamb sealed under dough and cooked on dum.'],
    ['jackfruit-biryani', 'Jackfruit Dum Biryani', 'rice', 520, 2, 1, '', 0, 1, 'Young jackfruit, saffron and fried onions, sealed and slow-cooked.'],
    ['jeera-rice', 'Saffron Jeera Rice', 'rice', 260, 0, 1, '', 1, 0, 'Fragrant basmati with cumin and a thread of saffron.'],
    ['gulab-brulee', 'Gulab Jamun Brulee', 'dessert', 320, 0, 1, 'dg', 0, 0, 'Warm gulab jamun with a burnt sugar crust and rabri.'],
    ['mango-kulfi', 'Mango Kulfi', 'dessert', 340, 0, 1, 'dn', 0, 0, 'Dense mango kulfi with pistachio.'],
    ['chocolate-pot', 'Dark Chocolate Pot with Sea Salt', 'dessert', 380, 0, 1, '', 0, 0, 'Dark chocolate pot with sea salt and toasted coconut.'],
    ['rasmalai-cake', 'Rasmalai Cheesecake', 'dessert', 420, 0, 1, 'dgne', 0, 1, 'Baked cheesecake soaked in cardamom milk with almonds.'],
    ['coconut-panna', 'Coconut Panna Cotta', 'dessert', 360, 0, 1, '', 0, 0, 'Set coconut cream with jaggery and passion fruit.'],
    ['mango-lassi', 'Salted Mango Lassi', 'drink', 240, 0, 1, 'd', 0, 0, 'Thick mango lassi with a pinch of salt.'],
    ['jaljeera', 'Jaljeera Spritz', 'drink', 260, 1, 1, '', 1, 0, 'Cumin, mint and tamarind with soda.'],
    ['filter-tonic', 'Filter Coffee Tonic', 'drink', 280, 0, 1, '', 0, 0, 'South Indian filter coffee over tonic and ice.']
  ];
  function mkDish(r) { var a = r[6], t = []; if (r[5]) { t.push('veg'); if (a.indexOf('d') < 0 && a.indexOf('e') < 0) t.push('vegan'); } if (a.indexOf('g') < 0) t.push('gluten-free'); if (a.indexOf('n') < 0) t.push('nut-free'); if (a.indexOf('d') < 0) t.push('dairy-free'); if (r[7]) t.push('jain'); return { id: r[0], name: r[1], course: r[2], price: r[3], spice: r[4], veg: !!r[5], al: a, tags: t, chef: !!r[8], desc: r[9] }; }
  function byId(menu, id) { for (var i = 0; i < menu.length; i++) if (menu[i].id === id) return menu[i]; return null; }
  function has(d, tag) { return tag === 'nonveg' ? !d.veg : d.tags.indexOf(tag) >= 0; }
  function filt(menu, f) { return menu.filter(function (d) { return (!f.course || f.course.indexOf(d.course) >= 0) && (f.diet || []).every(function (t) { return has(d, t); }) && (f.maxSpice == null || d.spice <= f.maxSpice) && (f.minSpice == null || d.spice >= f.minSpice) && (f.maxPrice == null || d.price <= f.maxPrice) && (f.minPrice == null || d.price >= f.minPrice) && (!f.chef || d.chef); }); }
  function hasF(f) { return !!((f.diet && f.diet.length) || (f.course && f.course.length) || f.maxSpice != null || f.minSpice != null || f.chef || f.maxPrice != null || f.minPrice != null); }
  function list(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function cp(o) { var r = {}; for (var k in o) if (o.hasOwnProperty(k)) r[k] = o[k]; return r; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function desc(f) {
    var p = (f.diet || []).map(function (t) { return t === 'nonveg' ? 'non-vegetarian' : t === 'veg' ? 'vegetarian' : t; }), c = f.course && f.course.length ? f.course.map(function (x) { return CNAME[x]; }).join(' and ') : 'dishes';
    var s = f.chef && !p.length && !(f.course && f.course.length) ? 'the chef’s picks' : (f.chef ? 'chef’s pick ' : '') + (p.length ? p.join(', ') + ' ' : '') + c;
    if (f.maxSpice === 0) s += ', with no heat'; else if (f.maxSpice === 1 && f.minSpice == null) s += ', mild or milder'; else if (f.maxSpice != null && f.maxSpice === f.minSpice) s += ', at spice level ' + f.maxSpice; else if (f.minSpice != null) s += f.minSpice >= 3 ? ', at the hottest level' : ', with real heat';
    var sc = s.indexOf(',') >= 0 && !f.chef; if (f.maxPrice != null) s += (sc ? ', under ' : ' under ') + R(f.maxPrice); if (f.minPrice != null) s += (sc ? ', over ' : ' over ') + R(f.minPrice); return s;
  }
  function card(d) { var m = [cap(d.course) + ', ' + SPL[d.spice]].concat(d.tags.filter(function (t) { return t !== 'veg' || d.tags.indexOf('vegan') < 0; }).map(function (t) { return TAGN[t]; })); if (!d.veg) m.splice(1, 0, 'Non-vegetarian'); return { title: d.name, sub: d.desc, price: R(d.price), badge: d.chef ? 'Chef’s pick' : undefined, meta: m, buttons: [B('Dietary details', 'act:dish:' + d.id)] }; }
  function tagLine(d, tag) {
    var n = 'it', c = d.al ? list(d.al.split('').map(function (x) { return AL[x]; })) : '';
    switch (tag) {
      case 'vegan': return has(d, 'vegan') ? 'Yes, ' + n + ' is vegan.' : d.veg ? 'No, ' + n + ' is vegetarian but not vegan, because it contains ' + c + '.' : 'No, ' + n + ' contains meat or fish.';
      case 'veg': return d.veg ? 'Yes, ' + n + ' is vegetarian.' : 'No, ' + n + ' contains meat or fish.';
      case 'nonveg': return d.veg ? 'No, ' + n + ' is vegetarian.' : 'Yes, ' + n + ' is non-vegetarian.';
      case 'jain': return has(d, 'jain') ? 'Yes, ' + n + ' is prepared without onion, garlic or root vegetables.' : 'No, ' + n + ' is not prepared as a Jain dish.';
      default: var w = { 'gluten-free': 'gluten', 'nut-free': 'nuts', 'dairy-free': 'dairy' }[tag]; return has(d, tag) ? 'It has no ' + w + ' in the recipe.' : 'No, ' + n + ' contains ' + w + '.';
    }
  }
  function compat(d, o) { return o.id !== d.id && ['vegan', 'gluten-free', 'nut-free', 'dairy-free', 'jain'].every(function (t) { return !has(d, t) || has(o, t); }) && (!d.veg || o.veg); }

  /* ---------- dates, grid, seating model ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function parseIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function isoOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addDays(iso, n) { var d = parseIso(iso); d.setDate(d.getDate() + n); return isoOf(d); }
  function todayIso() { return isoOf(new Date()); }
  function dayLong(iso) { var d = parseIso(iso), t = todayIso(), b = DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONS[d.getMonth()]; return iso === t ? 'today, ' + b : iso === addDays(t, 1) ? 'tomorrow, ' + b : b; }
  function dayPlain(iso) { var d = parseIso(iso); return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONS[d.getMonth()]; }
  function onDay(iso) { var l = dayLong(iso); return /^(today|tomorrow)/.test(l) ? l : 'on ' + l; }
  function dayShort(iso) { return O.fmtDay(parseIso(iso)); }
  var tl = function (t) { return O.fmtTime(t); };
  function idxOf(t) { var p = t.split(':'); return +p[0] * 2 + (+p[1] >= 30 ? 1 : 0); }
  function onGrid(t) { var m = +t.split(':')[1]; return m === 0 || m === 30; }
  function tOf(i) { return pad(Math.floor(i / 2)) + (i % 2 ? ':30' : ':00'); }
  function svcOf(i) { return i >= 24 && i <= 28 ? 'lunch' : i >= 38 && i <= 43 ? 'dinner' : null; }
  function dwellOf(i) { return svcOf(i) === 'lunch' ? 3 : 4; }
  function slotsFor(svc) { var o = []; for (var i = 24; i <= 43; i++) { var s = svcOf(i); if (s && (!svc || s === svc)) o.push(i); } return o; }
  function pastCut(iso) { if (iso !== todayIso()) return -1; var n = new Date(); return Math.ceil((n.getHours() * 60 + n.getMinutes() + 30) / 30); }
  function timesText(a) { var l = a.map(function (i) { return tl(tOf(i)); }), o = l.map(function (x, k) { return k < l.length - 1 && x.slice(-2) === l[k + 1].slice(-2) ? x.slice(0, -3) : x; }); return list(o); }
  var TBL = [];
  (function () { function add(p, n, cap) { for (var i = 1; i <= n; i++) TBL.push({ id: p + i, cap: cap }); } add('A', 6, 2); add('B', 6, 4); add('C', 3, 6); add('D', 2, 8); TBL.push({ id: 'PR', cap: 14, room: true }); })();
  function fits(t, p) { return t.room ? p >= 9 && p <= 14 : p <= t.cap && t.cap <= Math.max(p + 2, 2); }
  var OCC = {};
  function occ(iso) { // deterministic background occupancy for a date: table id -> 48 half-hour flags
    if (OCC[iso]) return OCC[iso]; var d = parseIso(iso), dow = d.getDay(), r = O.rng(d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()), m = {}, fri = dow === 5 || dow === 6, boost = (r() - .5) * .2;
    TBL.forEach(function (t) {
      var a = [], i, k; for (i = 0; i < 48; i++) a.push(0); var sc = t.room ? .25 : t.cap >= 8 ? .85 : t.cap >= 6 ? .8 : 1;
      for (i = 24; i <= 43; i++) { var sv = svcOf(i); if (!sv || a[i]) continue; var dem = sv === 'lunch' ? .3 + (dow === 0 ? .25 : dow === 6 ? .12 : 0) + (i === 26 || i === 27 ? .15 : 0) : .34 + (fri ? .18 : dow === 0 ? .06 : -.04) + (i === 40 || i === 41 ? .14 : i === 39 || i === 42 ? .06 : 0); if (r() < Math.max(.03, Math.min(.9, dem + boost)) * .55 * sc) for (k = 0; k < dwellOf(i); k++) a[i + k] = 1; }
      m[t.id] = a;
    });
    var rush = fri || r() < .22 ? 40 + Math.floor(r() * 3) : -1; if (rush > 0) TBL.forEach(function (t) { if (!t.room && t.cap <= 6) m[t.id][rush] = 1; });
    return (OCC[iso] = m);
  }
  function tableFree(t, iso, i, bks, excl) {
    var a = occ(iso)[t.id], dw = dwellOf(i), k, j; for (k = 0; k < dw; k++) if (a[i + k]) return false;
    for (j = 0; j < bks.length; j++) { var b = bks[j]; if (b.status !== 'confirmed' || b.date !== iso || b.table !== t.id || b.ref === excl) continue; var bi = idxOf(b.time); if (i < bi + dwellOf(bi) && bi < i + dw) return false; }
    return true;
  }
  function freeTables(iso, time, party, bks, excl) { var i = idxOf(time); return TBL.filter(function (t) { return fits(t, party) && tableFree(t, iso, i, bks, excl); }); }
  function pickTable(iso, time, party, bks, excl) { var f = freeTables(iso, time, party, bks, excl), best = null; f.forEach(function (t) { if (!best || t.cap < best.cap) best = t; }); return best; }
  function freeList(iso, party, bks, excl, svc) { var c = pastCut(iso); return slotsFor(svc).filter(function (i) { return i >= c && freeTables(iso, tOf(i), party, bks, excl).length > 0; }); }
  function tstate(s, bks) { var i = idxOf(s.time); if (!onGrid(s.time) || !svcOf(i)) return 'closed'; if (i < pastCut(s.date)) return 'past'; return pickTable(s.date, s.time, s.party, bks, s.which) ? 'ok' : 'full'; }
  function nearest(s, bks, n) { var base = idxOf(s.time), sv = svcOf(base) || (base >= 31 ? 'dinner' : 'lunch'), l = freeList(s.date, s.party, bks, s.which, sv); if (!l.length) l = freeList(s.date, s.party, bks, s.which); return l.sort(function (a, b) { return Math.abs(a - base) - Math.abs(b - base) || a - b; }).slice(0, n).sort(function (a, b) { return a - b; }); }
  function otherDays(s, bks, n) { var o = [], t = todayIso(), i; for (i = 0; i <= HORIZON && o.length < n; i++) { var d = addDays(t, i); if (d !== s.date && tstate({ date: d, time: s.time, party: s.party, which: s.which }, bks) === 'ok') o.push(d); } return o; }
  function estWait(s, bks) { var i = idxOf(s.time), sv = svcOf(i) || (i < 24 ? 'lunch' : i < 38 ? (i <= 31 ? 'lunch' : 'dinner') : 'dinner'), last = sv === 'lunch' ? 28 : 43, j; for (j = i + 1; j <= last; j++) if (freeTables(s.date, tOf(j), s.party, bks).length) return (j - i) * 30; return null; }

  /* ---------- parsing helpers ---------- */
  function pTime(t, bare) {
    t = String(t).toLowerCase(); var m, h, mi = 0, mer = '';
    if ((m = t.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)(?![a-z])/))) { h = +m[1]; mi = +(m[2] || 0); mer = m[3].charAt(0); }
    else if (/\b(noon|midday)\b/.test(t)) { h = 12; mer = 'p'; }
    else if ((m = t.match(/\bhalf past (\d{1,2})\b/))) { h = +m[1]; mi = 30; }
    else if ((m = t.match(/(?:\bat|\baround|\bby|@)\s*(\d{1,2})(?:[:.](\d{2}))?(?!\d)(?!\s*(?:people|persons|guests|pax|of us|%))/))) { h = +m[1]; mi = +(m[2] || 0); }
    else if ((m = t.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/))) { h = +m[1]; mi = +m[2]; }
    else if (bare && (m = t.match(/^\s*(\d{1,2})(?:[:.]?(\d{2}))?\s*(?:o'?clock)?\s*$/))) { h = +m[1]; mi = +(m[2] || 0); }
    else return undefined;
    if (h > 23 || mi > 59) return undefined; if (mer) h = h % 12 + (mer === 'p' ? 12 : 0); else if (h >= 1 && h <= 11) h += 12;
    return pad(h) + ':' + pad(mi);
  }
  function pParty(t) { var p = N.party(t); if (p === undefined) { var m = String(t).toLowerCase().match(/^\s*(?:we(?:'re| are)\s+)?(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:people|persons?|guests|pax|of us|adults|diners)?\s*[.!]?\s*$/); if (m) p = N.wordNum(m[1]); } return p >= 1 && p <= 40 ? p : undefined; }
  var BADNAME = /\b(yes|no|ok|okay|sure|menu|vegan|vegetarian|veg|gluten|nut|nuts|dessert|desserts|table|book|booking|cancel|change|different|another|name|tomorrow|today|tonight|evening|dinner|lunch|monday|tuesday|wednesday|thursday|friday|saturday|sunday|parking|hours|open|price|spicy|dish|chef|waitlist|wait|help|agent|human|person|private|thanks|thank|stop|skip|none|nothing|time|date|party|people|birthday|anniversary)\b/i;
  function pName(t) { t = String(t).trim(); if (/\d|@|\?/.test(t) || /^(can|could|do|does|is|are|what|how|when|where|why|will|should)\b/i.test(t)) return undefined; var n = N.name(t); return n && !BADNAME.test(n) ? n : undefined; }
  function pKey(t) { var m = String(t).match(/\bTR[- ]?(\d{4})\b/i); if (m) return m[1]; var ph = N.phone(t); if (ph) return ph.replace(/\D/g, '').slice(-4); m = String(t).match(/\b(\d{4})\b/); return m ? m[1] : undefined; }
  function occOf(t) { t = String(t || '').toLowerCase(); return /birthday|b'?day/.test(t) ? 'birthday' : /anniversary/.test(t) ? 'anniversary' : /business|client|corporate|work dinner|team (dinner|lunch)|office/.test(t) ? 'business' : /proposal|engagement|propose/.test(t) ? 'proposal' : /celebrat|farewell|promotion|graduat/.test(t) ? 'celebration' : undefined; }
  function parseF(arg) { var f = {}; String(arg).split(';').forEach(function (p) { var kv = p.split('='), k = kv[0], v = kv[1]; if (k === 'course') f.course = v.split(','); else if (k === 'diet') f.diet = v.split(','); else if (k === 'chef') f.chef = true; else if (k) f[k] = +v; }); return f; }
  function merge(a, b) { var r = cp(a); for (var k in b) if (b.hasOwnProperty(k)) { if (k === 'diet') { r.diet = (a.diet || []).concat((b.diet || []).filter(function (x) { return (a.diet || []).indexOf(x) < 0; })); } else r[k] = b[k]; } return r; }
  function dishesFrom(text, menu, single) {
    var q = N.content(text), best = 0, out = [];
    var df = {}; menu.forEach(function (d) { N.content(d.name).forEach(function (w) { df[w] = (df[w] || 0) + 1; }); });
    menu.forEach(function (d) { var tk = N.content(d.name), hit = tk.filter(function (w) { return q.indexOf(w) >= 0; }); var sc = hit.length >= 2 ? hit.length : (single && hit.length === 1 && hit[0].length >= 5 && df[hit[0]] <= 3 ? 1 : 0); if (sc > best) { best = sc; out = [d.id]; } else if (sc && sc === best) out.push(d.id); });
    return out.slice(0, 3);
  }
  function ctxDate(bot) { var c = bot.ctx.date; if (!c) return null; var iso = /^\d{4}-\d{2}-\d{2}$/.test(c) ? c : (N.when(c) || {}).iso; return iso && iso >= todayIso() && iso <= addDays(todayIso(), HORIZON) ? iso : null; }
  function rs(bot, ref) { return bot.channel === 'phone' ? 'T R ' + ref.slice(3).split('').join(' ') : ref; }
  function last4(p) { return String(p || '').replace(/\D/g, '').slice(-4); }
  function sum(s) { return 'a table for ' + s.party + ' ' + onDay(s.date) + ' at ' + tl(s.time); }
  function newRef(prefix, all) { var r, ok; do { r = prefix + (1000 + Math.floor(Math.random() * 9000)); ok = !all.some(function (b) { return b.ref === r; }); } while (!ok); return r; }
  function K(flow, fn) { return function (bot, s) { bot.mem.draft = cp(s); bot.mem.draftFlow = flow; fn(bot, s); }; }
  function findBks(bot, key) { var k = String(key).replace(/\D/g, '').slice(-4); return bot.db('bookings').filter(function (b) { return b.status === 'confirmed' && b.date >= todayIso() && (b.ref === 'TR-' + k || last4(b.phone) === k); }); }
  function getBk(bot, ref) { return bot.db('bookings').filter(function (b) { return b.ref === ref; })[0]; }
  function resume(bot) { return bot.mem.draft && bot.mem.draftFlow && !bot.flow ? [B('Back to my booking', 'act:resume')] : []; }

  /* ---------- conversation pieces ---------- */
  function large(bot, e) {
    bot.say('Groups of more than ten, and any private room request, are planned by our events team. The private room seats ten to fourteen, with its own host and a set menu. The minimum spend is ' + R(MINSP.lunch) + ' at lunch and ' + R(MINSP.dinner) + ' at dinner. I am passing you to the team now with what you have told me, so you will not need to repeat it.');
    bot.lead({ intent: 'private_dining', payload: { party: e.party, date: e.date, time: e.time, occasion: e.occasion || bot.ctx.occasion } }); bot.handover('Large party or private dining');
  }
  function startTable(bot, e) {
    if (e.privateRoom || e.party > 10) { large(bot, e); return; }
    var p = {}; ['party', 'date', 'time', 'service', 'occasion', 'requests', 'name', 'phone'].forEach(function (k) { if (e[k] !== undefined) p[k] = e[k]; });
    if (p.party !== undefined && (p.party < 1 || p.party > 10)) delete p.party; if (!p.occasion && bot.ctx.occasion) p.occasion = bot.ctx.occasion; bot.startFlow('table', p);
  }
  function dateAsk(bot, s) {
    var t = todayIso(), seen = {}, b = [], c = ctxDate(bot), i; function add(iso, label) { if (iso && !seen[iso]) { seen[iso] = 1; b.push(B(label || dayShort(iso), 'slot:date=' + iso)); } }
    if (c) add(c, dayShort(c) + ' (from the page)'); if (pastCut(t) <= 43) add(t, 'Today'); add(addDays(t, 1), 'Tomorrow');
    for (i = 2; i <= HORIZON && b.length < 5; i++) { var d = addDays(t, i), w = parseIso(d).getDay(); if (w === 5 || w === 6 || w === 0) add(d); }
    bot.say((s.which ? 'Let us move your booking. ' : '') + 'Which day would you like?' + (s.occasion ? ' I have noted the ' + s.occasion + '.' : ''), { buttons: b });
  }
  function dateErr(v) { var t = todayIso(); if (v > addDays(t, HORIZON)) return 'We take bookings up to ten days ahead, so until ' + dayLong(addDays(t, HORIZON)) + '. Which day would suit you?'; if (v < t) return 'That day has already passed. Which day would suit you?'; if (v === t && pastCut(t) > 43) return 'Tonight’s seatings are over. Would tomorrow work?'; }
  function badDate(bot, s) { var de = s.date && dateErr(s.date); if (!de) return false; bot.say(de); delete s.date; delete s.fit; bot._advance(); return true; }
  function timeAsk(bot, s) {
    if (badDate(bot, s)) return;
    var bks = bot.db('bookings'), note = '', fl = freeList(s.date, s.party, bks, s.which, s.service);
    if (!fl.length && s.service) { fl = freeList(s.date, s.party, bks, s.which); note = 'Nothing is free at ' + s.service + ', but '; delete s.service; }
    if (!fl.length) { var od = otherDays({ date: s.date, time: '20:00', party: s.party, which: s.which }, bks, 3); bot.say('Sorry, we are fully booked for ' + s.party + ' ' + onDay(s.date) + '. I can look at another day, or put you on the waitlist in case a table opens up.', { buttons: od.map(function (d) { return B(dayShort(d), 'slot:date=' + d); }).concat([B('Another day', 'act:otherday'), B('Join the waitlist', 'act:waitlist')]) }); return; }
    var all = slotsFor(s.service).filter(function (i) { return i >= pastCut(s.date); }), full = all.filter(function (i) { return fl.indexOf(i) < 0; }), lu = fl.filter(function (i) { return svcOf(i) === 'lunch'; }), di = fl.filter(function (i) { return svcOf(i) === 'dinner'; }), parts = [];
    if (lu.length) parts.push('lunch at ' + timesText(lu)); if (di.length) parts.push('dinner at ' + timesText(di));
    var few = fl.filter(function (i) { return freeTables(s.date, tOf(i), s.party, bks, s.which).length === 1; }).slice(0, 2), pick = fl;
    if (fl.length > 6) { pick = []; for (var k = 0; k < 6; k++) pick.push(fl[Math.round(k * (fl.length - 1) / 5)]); }
    bot.say((s.which ? 'Moving your booking. ' : '') + note + 'For ' + s.party + ' ' + onDay(s.date) + ', I have ' + list(parts) + '.' + (full.length ? ' Fully booked: ' + timesText(full) + '.' : '') + (few.length ? ' Only one table is left at ' + (few.length > 1 ? 'each of ' : '') + timesText(few) + '.' : '') + ' Tap a time, or type another and I will check it.', { buttons: pick.map(function (i) { return B(tl(tOf(i)), 'slot:time=' + tOf(i)); }) });
  }
  function fitAsk(bot, s) {
    if (badDate(bot, s)) return;
    var bks = bot.db('bookings'), st = tstate(s, bks), alt = nearest(s, bks, 3), od = otherDays(s, bks, 2), b = [], w;
    w = st === 'closed' ? 'We seat lunch from 12 to 2 pm and dinner from 7 to 9:30 pm, on the hour and half hour.' : st === 'past' ? 'That time has already passed today.' : 'Sorry, ' + tl(s.time) + ' ' + onDay(s.date) + ' is fully booked for ' + s.party + '.';
    alt.forEach(function (i) { b.push(B(tl(tOf(i)), 'slot:time=' + tOf(i))); }); od.forEach(function (d) { b.push(B('Same time, ' + dayShort(d), 'slot:date=' + d)); });
    if (st === 'full') b.push(B('Join the waitlist', 'act:waitlist')); b.push(B('Another day', 'act:otherday'));
    bot.say(w + (alt.length ? (alt.length === 1 ? ' The nearest time with a table is ' : ' The nearest times with a table are ') + timesText(alt) + '.' : ' Nothing else is free that day.') + (od.length ? ' ' + tl(s.time) + ' is free on ' + list(od.map(dayPlain)) + '.' : '') + (st === 'full' ? ' Or I can add you to the waitlist.' : ''), { buttons: b });
  }
  /* shared slot builders */
  function sParty(fl, auto) {
    return { name: 'party', ask: K(fl, function (bot, s) { if (auto) { var b = getBk(bot, s.which); bot.slots.party = b.party; bot._advance(); return; } bot.say('How many people will be dining?', { buttons: [B('Two', 'slot:party=2'), B('Three', 'slot:party=3'), B('Four', 'slot:party=4'), B('Five', 'slot:party=5'), B('Six', 'slot:party=6'), B('Seven or more', 'act:bigparty')] }); }),
      parse: function (t) { return pParty(t); }, coerce: function (v) { return +v; }, hint: 'How many people? A number is fine, for example 4.',
      validate: function (v, bot) { if (v > 10) { large(bot, { party: v }); return; } if (v < 1) return 'How many people should I book for?'; } };
  }
  function sDate(fl) { return { name: 'date', ask: K(fl, dateAsk), parse: function (t) { var w = N.when(t); return w && w.iso ? w.iso : undefined; }, validate: dateErr, hint: 'Which day? You can say tomorrow, Saturday, or a date like 21 November.' }; }
  function sTime(fl) { return { name: 'time', ask: K(fl, timeAsk), parse: function (t) { return pTime(t, true); }, hint: 'What time? For example 8 pm or 7:30.' }; }
  function sFit(fl) { return { name: 'fit', when: function (bot, s) { return s.party !== undefined && !!s.date && !!s.time && (!!dateErr(s.date) || tstate(s, bot.db('bookings')) !== 'ok'); }, ask: K(fl, fitAsk), hint: 'Tap one of the times, or type another time or day.' }; }
  function sName(fl) {
    return { name: 'name', ask: K(fl, function (bot) { var u = bot.user.name; var wl = fl === 'waitlist'; bot.say(u ? 'Shall I put it under ' + u + '?' : wl ? 'What name should I put the waitlist under?' : 'What name should the booking be under?', u ? { buttons: [B('Yes, ' + u, 'slot:name=' + u), B('A different name', 'say:a different name')] } : undefined); }), parse: pName, hint: 'Please type the name for the booking, for example Priya Nair.' };
  }
  function sPhone(fl) {
    return { name: 'phone', ask: K(fl, function (bot) { var p = bot.user.phone; bot.say(p ? 'Can we reach you on the number ending ' + last4(p) + '?' : fl === 'waitlist' ? 'What mobile number should we message when a table opens?' : 'What is the best mobile number for a reminder and any changes?', p ? { buttons: [B('Yes, use it', 'slot:phone=' + p), B('A different number', 'say:a different number')] } : undefined); }), parse: function (t) { return N.phone(t); }, hint: 'Please type a ten digit mobile number.' };
  }
  function sConfirm(fl, text) { return { name: 'confirm', ask: K(fl, function (bot, s) { bot.say(text(bot, s), { buttons: fl === 'table' ? [B('Confirm booking', 'slot:confirm=yes'), B('Change something', 'slot:confirm=change'), B('Never mind', 'slot:confirm=no')] : [B('Yes, go ahead', 'slot:confirm=yes'), B('No, keep it', 'slot:confirm=no')] }); }), parse: function (t) { var y = N.yesno(t); return /\b(change|edit|modify|different|wrong)\b/i.test(t) && fl === 'table' ? 'change' : y === undefined ? undefined : y ? 'yes' : 'no'; }, hint: 'Please say yes to confirm, or no to leave it.' }; }
  function sKey(fl) {
    return { name: 'key', ask: K(fl, function (bot) { var l = bot.mem.lastRef; bot.say('Sure. What is your booking reference, like TR-1234, or the last four digits of the phone number on the booking?', l ? { buttons: [B('The one I just made, ' + l, 'slot:key=' + l.slice(3))] } : undefined); }), parse: function (t, bot) { return bot.pending && bot.pending.name === 'key' ? pKey(t) : undefined; }, hint: 'Please give the reference, for example TR-1234, or four digits of your phone number.' };
  }
  function sWhich(fl) {
    return { name: 'which', ask: K(fl, function (bot, s) {
      var m = findBks(bot, s.key); if (!m.length) { bot.say('I could not find an upcoming booking with that. Check the reference or phone digits, or I can bring in a person.', { buttons: [B('Try again', 'flow:' + bot.flow), B('Talk to a person', 'handover')] }); bot.endFlow(); return; }
      if (m.length === 1) { bot.slots.which = m[0].ref; bot._advance(); return; }
      bot.say('I found ' + m.length + ' bookings. Which one?', { buttons: m.map(function (b) { return B(b.ref + ', ' + dayShort(b.date) + ' ' + tl(b.time), 'slot:which=' + b.ref); }) });
    }), parse: function (t, bot, s) { var m = String(t).match(/TR[- ]?(\d{4})/i); return m && findBks(bot, s.key).some(function (b) { return b.ref === 'TR-' + m[1]; }) ? 'TR-' + m[1] : undefined; } };
  }
  function bkLine(b) { return b.ref + ' for ' + b.party + ' ' + onDay(b.date) + ' at ' + tl(b.time); }
  function reminder(bot, name, s) { bot.say('Reminder preview, simulated and not actually sent: “Hi ' + name.split(' ')[0] + ', your table for ' + s.party + ' at Tamarind Row is ' + dayLong(s.date) + ' at ' + tl(s.time) + '. Reply C to cancel or R to change.” We send it the day before.', { delay: 500 }); }
  function notifyWait(bot, b) { var w = bot.db('waitlist'), t = TBL.filter(function (x) { return x.id === b.table; })[0], hit = null; w.forEach(function (x) { if (!hit && x.status === 'waiting' && x.date === b.date && Math.abs(idxOf(x.time) - idxOf(b.time)) <= 1 && t && fits(t, x.party)) hit = x; }); if (hit) { hit.status = 'notified'; bot.save('waitlist', w); } return hit; }

  /* ---------- menu answers ---------- */
  function overview(bot) {
    var m = bot.db('menu'), p = m.map(function (d) { return d.price; });
    bot.say('Our menu has ' + m.length + ' dishes across starters, mains, breads, rice, desserts and drinks, from ' + R(Math.min.apply(null, p)) + ' to ' + R(Math.max.apply(null, p)) + '. Every dish is tagged vegetarian, vegan, gluten-free, nut-free, dairy-free or Jain where it applies, with a spice level from zero to three. Tell me what you like, for example vegan mains that are not spicy, or pick a section.', { buttons: [B('Starters', 'act:f:course=starter'), B('Mains', 'act:f:course=main'), B('Desserts', 'act:f:course=dessert'), B('Vegan', 'act:f:diet=vegan'), B('Chef’s picks', 'act:f:chef=1')].concat(resume(bot)) });
  }
  function showMenu(bot, f, e, off) {
    var menu = bot.db('menu'), ls = filt(menu, f), dt = f.diet || [], al = dt.some(function (t) { return t === 'nut-free' || t === 'gluten-free' || t === 'dairy-free'; }), page, b = [];
    bot.mem.filter = f; bot.mem.page = off = off || 0; bot.event('action', { action: 'menu_filter', q: desc(f) });
    if (!ls.length) {
      var rel = [['maxPrice', 'minPrice', 'Without the price limit'], ['maxSpice', 'minSpice', 'With any spice level'], ['course', null, 'In any course']];
      rel.forEach(function (r) { var g = cp(f); delete g[r[0]]; if (r[1]) delete g[r[1]]; if ((f[r[0]] != null || (r[1] && f[r[1]] != null)) && filt(menu, g).length) b.push(B(r[2] + ' (' + filt(menu, g).length + ')', 'act:fset:' + fstr(g))); });
      bot.say('Nothing on the menu matches all of that: ' + desc(f) + '.' + (b.length ? ' I can loosen it a little.' : ' Try a different mix.'), { buttons: b.concat([B('Show the menu', 'intent:menu')]).concat(resume(bot)) }); return;
    }
    if (off >= ls.length) off = bot.mem.page = 0; page = ls.slice(off, off + 4); if (e && e.allergy && !off) bot.say(CAUT + ' For a severe allergy, I can bring in a person from the team.', { buttons: [B('Talk to the team', 'handover')] });
    var more = ls.length > off + 4; if (more) b.push(B('Show more', 'act:more'));
    if (!f.course) b.push(B('Just mains', 'act:fadd:course=main'), B('Just desserts', 'act:fadd:course=dessert')); if (f.maxSpice == null && f.minSpice == null) b.push(B('Not spicy', 'act:fadd:maxSpice=1')); if (f.maxPrice == null) b.push(B('Under ' + R(500), 'act:fadd:maxPrice=500'));
    b = b.slice(0, 4).concat([B('Book a table', 'intent:table')]).concat(resume(bot));
    bot.say((ls.length === 1 ? 'There is one match for ' : 'I found ' + ls.length + ' matches for ') + desc(f) + '.' + (ls.length > 4 ? ' Showing ' + (off + 1) + ' to ' + (off + page.length) + '.' : '') + (al && !(e && e.allergy && !off) ? ' Allergen tags are a guide, so please confirm with the kitchen.' : ''), { cards: page.map(card), buttons: b });
  }
  function fstr(f) { var o = []; if (f.course) o.push('course=' + f.course.join(',')); if (f.diet) o.push('diet=' + f.diet.join(',')); if (f.chef) o.push('chef=1'); ['maxSpice', 'minSpice', 'maxPrice', 'minPrice'].forEach(function (k) { if (f[k] != null) o.push(k + '=' + f[k]); }); return o.join(';'); }
  function dishAnswer(bot, ids, f, e, t) {
    var menu = bot.db('menu'), ds = ids.map(function (i) { return byId(menu, i); }).filter(Boolean), d, L = [], dt = f.diet || [];
    if (!ds.length) return; if (ds.length > 1) { bot.say('Which of these do you mean?', { cards: ds.map(card) }); return; }
    d = ds[0]; var CW = { 'gluten-free': ['g', 'gluten'], 'nut-free': ['n', 'nuts'], 'dairy-free': ['d', 'dairy'] }, asks = /\b(have|has|contain\w*|include\w*|with|made with)\b/i.test(t || '');
    dt.forEach(function (tag) { L.push(asks && CW[tag] ? (d.al.indexOf(CW[tag][0]) >= 0 ? 'Yes, it contains ' + CW[tag][1] + '.' : 'No, the recipe has no ' + CW[tag][1] + '.') : tagLine(d, tag)); });
    var sp = /spic|hot|heat|chilli|chili/i.test(t || ''), gen = !dt.length && !sp;
    if (gen) L.push(d.desc); if (sp || gen) L.push('Spice level: ' + SPL[d.spice] + '.');
    if (gen || (e && e.allergy)) L.push(d.al ? 'It contains ' + list(d.al.split('').map(function (x) { return AL[x]; })) + '.' : 'None of the main allergens are listed for it.');
    bot.say('**' + d.name + '**, ' + R(d.price) + '. ' + L.join(' ') + ' Please confirm allergens with the kitchen.', { cards: [card(d)], buttons: [B('What goes with it?', 'act:pair:' + d.id), B('Book a table', 'intent:table')].concat((e && e.allergy) || (e && e.severe) ? [B('Talk to the team', 'handover')] : []).concat(resume(bot)) });
  }
  function menuAnswer(bot, m, force) {
    var e = m.ent || {}, f = e.f || {}, t = m.text || '', ids = e.dishes || [];
    if (force) { if (force.chef) f = merge(f, { chef: true }); if (force.allergy) e.allergy = true; }
    if (!ids.length && bot.ctx.dish && /\b(it|this|that dish|the dish)\b/i.test(t) && (hasF(f) || e.allergy || /spic|contain|made|price|cost|goes with|pair/i.test(t))) ids = [bot.ctx.dish];
    if (ids.length && !(hasF(f) && !(/\b(is|are|does|do|can|has|have|contain\w*)\b/i.test(t)) && ids.length > 1)) { if (/goes with|pair|order with|side/i.test(t)) { actions.pair(bot, ids[0]); return; } dishAnswer(bot, ids, f, e, t); return; }
    if (/^\s*(show |see )?(me )?more\b/i.test(t) && bot.mem.filter && !hasF(f)) { actions.more(bot); return; }
    if (/^\s*(and|also|only|but|with|make it|now|what about)\b/i.test(t) && bot.mem.filter && hasF(f)) f = merge(bot.mem.filter, f);
    if (e.allergy && !hasF(f)) {
      bot.say('Thank you for telling me. ' + CAUT + ' Which would you like me to filter by?' + (e.severe ? ' Since it sounds serious, I would suggest speaking to the team before you book.' : ''), { buttons: (e.severe ? [B('Talk to the team', 'handover')] : []).concat([B('Nut-free', 'act:f:diet=nut-free'), B('Gluten-free', 'act:f:diet=gluten-free'), B('Dairy-free', 'act:f:diet=dairy-free')]).concat(e.severe ? [] : [B('Talk to the team', 'handover')]) }); return;
    }
    if (!hasF(f)) { overview(bot); return; }
    showMenu(bot, f, e, 0);
  }

  var actions = {
    bigparty: function (bot) { bot.say('How many exactly? Groups of nine and ten sit in our private room.', { buttons: [B('Seven', 'slot:party=7'), B('Eight', 'slot:party=8'), B('Nine', 'slot:party=9'), B('Ten', 'slot:party=10'), B('More than ten', 'act:large')] }); },
    large: function (bot) { large(bot, bot.mem.draft || {}); },
    waitlist: function (bot) { var s = bot.slots, p = { party: s.party, date: s.date, time: s.time }; bot.startFlow('waitlist', p); },
    otherday: function (bot) { delete bot.slots.date; delete bot.slots.fit; if (bot.flow) bot._advance(); else bot.startFlow('table', {}); },
    chg: function (bot, k) { var d = cp(bot.mem.draft || {}); delete d.confirm; delete d[k]; if (k === 'date' || k === 'time') delete d.fit; bot.startFlow('table', d); },
    resume: function (bot) { var d = cp(bot.mem.draft || {}), fl = bot.mem.draftFlow || 'table'; delete d.confirm; delete d.fit; bot.startFlow(fl, d); },
    checkdate: function (bot, iso) { bot.startFlow('table', { date: iso, occasion: bot.ctx.occasion }); },
    f: function (bot, a) { showMenu(bot, parseF(a), {}, 0); },
    fadd: function (bot, a) { showMenu(bot, merge(bot.mem.filter || {}, parseF(a)), {}, 0); },
    fset: function (bot, a) { showMenu(bot, parseF(a), {}, 0); },
    more: function (bot) { showMenu(bot, bot.mem.filter || {}, {}, (bot.mem.page || 0) + 4); },
    dish: function (bot, a) { var p = a.split('|'), tg = p[1]; dishAnswer(bot, [p[0]], tg && tg !== 'spice' ? { diet: [tg] } : {}, {}, tg === 'spice' ? 'how spicy' : ''); },
    pair: function (bot, id) {
      var m = bot.db('menu'), d = byId(m, id); if (!d) return; var br = m.filter(function (x) { return x.course === 'bread' && compat(d, x); })[0], rc = m.filter(function (x) { return x.course === 'rice' && compat(d, x); })[0], dr = m.filter(function (x) { return x.course === 'drink' && compat(d, x); })[0], c = [br, rc, dr].filter(Boolean);
      if (d.course === 'bread' || d.course === 'rice') c = m.filter(function (x) { return x.course === 'main' && compat(d, x); }).slice(0, 3);
      bot.say(c.length ? 'With the ' + d.name + ' I would add ' + list(c.map(function (x) { return x.name; })) + '. I picked only dishes that keep the same dietary tags.' : 'The ' + d.name + ' stands well on its own.', { cards: c.map(card), buttons: [B('Book a table', 'intent:table')] });
    },
    chef: function (bot) { showMenu(bot, { chef: true }, {}, 0); }
  };

  /* ---------- agent ---------- */
  var SYN = {
    starter: ['starters', 'appetizer', 'appetizers', 'appetiser', 'appetisers', 'snacks', 'small plates'], main: ['mains', 'main courses', 'main course', 'entree', 'entrees', 'curries', 'curry'], bread: ['breads', 'naan', 'roti', 'kulcha', 'paratha'],
    dessert: ['desserts', 'sweet', 'sweets', 'pudding'], drink: ['drinks', 'beverage', 'beverages', 'cocktail', 'cocktails', 'mocktail', 'mocktails', 'lassi'], 'gluten free': ['gluten-free', 'glutenfree', 'no gluten'], 'nut free': ['nut-free', 'no nuts', 'nothing with nuts', 'without nuts'], 'dairy free': ['dairy-free', 'no dairy', 'lactose free'],
    'chef pick': ['chef\'s pick', 'chef\'s picks', 'chef\'s recommendation', 'chefs recommendation', 'chef recommendation', 'chef special', 'must try', 'must-try'], parking: ['valet', 'car park', 'park my car'], vegan: ['plant based', 'plant-based'],
    'wait list': ['waitlist', 'wait-list'], 'take away': ['takeaway', 'take-away', 'takeout', 'take out', 'to go'], 'high chair': ['highchair', 'booster seat']
  };
  var DAYRE = /\b(tomorrow|today|tonight|saturday|sunday|monday|tuesday|wednesday|thursday|friday|weekend)\b/;
  O.registerAgent({
    id: 'dining', name: 'Tamarind Row Assistant', business: 'Tamarind Row', role: 'Restaurant', industry: 'Hospitality', initials: 'TR', accent: '#E8B04B', phoneLabel: 'Tamarind Row reservations',
    blurb: 'Books tables against a live seating plan, offers alternatives and a waitlist when a time is full, changes or cancels bookings, and answers menu questions by diet, course, spice and price.',
    helloLine: 'I can book a table, check the menu for your diet, or answer questions about the restaurant.',
    samples: ['table for 4 tomorrow at 8', 'book for six on saturday 7:30 pm, it’s my wife’s birthday', 'something vegan and not spicy', 'gluten free desserts under 400'],
    kind: 'customer', contexts: [{ label: 'Just browsing', context: {} }, { label: 'Viewing: Black Dal Tamarind Row', context: { dish: 'black-dal' } }, { label: 'Viewing: Kerala Fish Curry', context: { dish: 'fish-curry' } }, { label: 'Planning a birthday', context: { occasion: 'birthday' } }, { label: 'Looking at Saturday', context: { date: 'saturday' } }],
    synonyms: SYN,
    seeds: { menu: function () { return RAW.map(mkDish); }, bookings: function () { return []; }, waitlist: function () { return []; } },
    menu: [B('Book a table', 'intent:table'), B('Menu and diets', 'intent:menu'), B('Chef’s picks', 'act:chef'), B('Change or cancel a booking', 'intent:reschedule'), B('Private dining', 'intent:large')],
    greeting: function (bot) {
      var d = bot.ctx.dish && byId(bot.db('menu'), bot.ctx.dish), oc = bot.ctx.occasion, cd = ctxDate(bot), hi = 'Welcome to Tamarind Row. ';
      if (d) bot.say(hi + 'I can see you are looking at the **' + d.name + '**. Ask me if it is vegan, how spicy it is or what goes with it, or book a table.', { buttons: [B('Is it vegan?', 'act:dish:' + d.id + '|vegan'), B('How spicy is it?', 'act:dish:' + d.id + '|spice'), B('What goes with it?', 'act:pair:' + d.id), B('Book a table', 'intent:table')] });
      else if (oc) bot.say(hi + 'Planning ' + (/^[aeiou]/.test(oc) ? 'an ' : 'a ') + oc + '? Tell me the day and how many of you, and I will note the occasion with the booking. ' + (oc === 'birthday' || oc === 'anniversary' ? 'The kitchen sends out a candle dessert for the table.' : ''), { buttons: [B('Book a table', 'intent:table'), B('Can I bring a cake?', 'say:can I bring my own cake'), B('Chef’s picks', 'act:chef')] });
      else if (cd) bot.say(hi + 'You were looking at ' + dayLong(cd) + '. Shall I check tables for that day?', { buttons: [B('Check ' + dayShort(cd), 'act:checkdate:' + cd), B('Another day', 'intent:table'), B('See the menu', 'intent:menu')] });
      else bot.say(hi + 'I can book a table, check the menu for your diet, or answer questions about the restaurant.', { buttons: bot.agent.menu });
    },
    extract: function (text, bot) {
      var e = {}, t = text.toLowerCase().replace(/[’`]/g, "'"), nt = N.norm(text, SYN).replace(/\bmain menu\b/g, 'menu'), w = N.when(text), p = N.party(text), pend = bot.flow && bot.pending && bot.pending.name, m, f = {}, d = [], isQ = /\?|^\s*(do|does|is|are|can|could|what|which|how|any|show|list|tell|will)\b/.test(t);
      if (p !== undefined && p >= 1 && p <= 40) e.party = p; if (w && w.iso) e.date = w.iso;
      var tm = pTime(text, pend === 'time' || pend === 'fit'); if (tm) e.time = tm;
      if (/\blunch\b|\bafternoon\b|\bnoon\b/.test(t)) e.service = 'lunch'; else if (/\bdinner\b|\bsupper\b|\bevening\b|\btonight\b|\bnight\b/.test(t)) e.service = 'dinner';
      var oc = occOf(text); if (oc) e.occasion = oc;
      if (/private (room|dining|dinner|lunch|event)|\bbuyout\b|\bbanquet\b/.test(t)) e.privateRoom = true;
      var rq = []; if (!isQ) { if (/high ?chair|booster|baby chair/.test(t)) rq.push('high chair'); if (/\bwindow\b/.test(t)) rq.push('window table'); if (/wheelchair|step[- ]free/.test(t)) rq.push('wheelchair access'); if (/quiet|corner/.test(t)) rq.push('quiet corner'); }
      if (/\bnon[- ]?veg/.test(t)) d.push('nonveg'); else if (/\bvegan|plant[- ]based/.test(t)) d.push('vegan'); else if (/\bvegetarian|\bveg\b|\bveggie|pure veg/.test(t)) d.push('veg');
      if (/\bgluten|coeliac|celiac/.test(t)) d.push('gluten-free'); if (/nut[- ]?free|\bno nuts?\b|without nuts?|nothing with nuts?|\bnuts? allerg|peanut|allergic to (?:tree )?nuts?|\bnuts?\b.*\ballerg|(?:have|has|contain\w*|with|include\w*)\s+(?:any\s+)?(?:tree\s+)?nuts?\b/.test(t)) d.push('nut-free');
      if (/\bdairy|lactose/.test(t)) d.push('dairy-free'); if (/\bjain\b/.test(t)) d.push('jain'); if (d.length) { f.diet = d; if (!isQ && !/\b(starters?|mains?|breads?|rice|desserts?|drinks?|menu|dishes|under|below|price)\b/.test(nt)) rq.push('dietary: ' + d.join(', ').replace('nonveg', 'non-vegetarian')); }
      if (rq.length) e.requests = rq.join('; ');
      var cs = []; (nt.match(/\b(starter|main|bread|rice|dessert|drink)\b/g) || []).forEach(function (c) { if (cs.indexOf(c) < 0) cs.push(c); }); if (cs.length) f.course = cs;
      if ((m = t.match(/spice\s*(?:level)?\s*(?:of\s*|at\s*|=)?\s*([0-3])\b/) || t.match(/level\s*([0-3])\s*spic/))) { var lv = +m[1]; if (lv <= 1) f.maxSpice = lv; else f.minSpice = f.maxSpice = lv; }
      else if (/\b(?:no|zero|without)\s+(?:spice|heat|chilli|chili)|not spicy at all/.test(t)) f.maxSpice = 0;
      else if (/\b(?:not|non|less|low|barely|isn't|nothing)[- ]?(?:too |very |that |so )?(?:spicy|spice|hot|chilli|chili)\b|\bmild\b|\bgentle\b/.test(t)) f.maxSpice = 1;
      else if (/extra hot|very spicy|fiery|super spicy|as hot as/.test(t)) f.minSpice = 3; else if (/\bspicy\b|\bhot\b|\bheat\b|\bkick\b/.test(t)) f.minSpice = 2;
      if (/chef|signature|must try|recommend|best (dish|seller)|popular|specials?\b/.test(nt + ' ' + t) ) f.chef = true;
      if (/\b(under|below|less than|cheaper|budget|within|upto|up to|max|over|above|more than|around|between|₹|rs|inr|rupees?)\b/.test(t) && (m = N.money(text)) && !e.date) { if (m.max != null) f.maxPrice = m.max; if (m.min != null) f.minPrice = m.min; }
      e.f = f; var ids = dishesFrom(text, bot.db('menu'), !(hasF(f) && !f.chef)); if (ids.length) e.dishes = ids;
      if (/allerg|anaphyla|epipen|intoleran|coeliac|celiac/.test(t)) e.allergy = true; if (/severe|anaphyla|epipen|life[- ]threatening|serious/.test(t)) e.severe = true;
      if ((m = text.match(/(?:my name is|name'?s|call me|this is|booking under|under the name|in the name of)\s+([a-z][a-z'.-]+(?:\s+[a-z][a-z'.-]+)?)/i))) { var nm = pName(m[1]); if (nm) e.name = nm; }
      var ph = N.phone(text); if (ph) e.phone = ph;
      if ((m = text.match(/\bTR[- ]?(\d{4})\b/i) || t.match(/last\s*(?:4|four)\s*(?:digits)?\D{0,14}(\d{4})/))) e.key = m[1];
      return e;
    },
    intents: [
      { id: 'table', label: 'Book a table', kw: ['book a table', 'table for', 'reserve a table', 'reservation', 'book', 'booking', 'reserve', 'a table', 'table', 'seats for', 'any tables'], re: [/^(?!.*\b(cancel\w*|resched\w*|change|modify|move|postpone|wait ?list|wait list|private|policy|fee|deposit|menu)\b).*\b(book(?:ing)?|reserve|reservation|table)\b/i], priority: 1, ctx: function (bot) { return bot.ctx.occasion || bot.ctx.date ? 1 : 0; }, run: function (bot, m) { startTable(bot, m.ent); } },
      { id: 'waitlist', label: 'Waitlist', kw: ['waitlist', 'wait list', 'join the queue', 'how long is the wait', 'walk in', 'walk-in', 'wait time', 'queue'], re: [/\bwait ?list\b/i, /\bwait list\b/i], priority: 2, run: function (bot, m) { var d = bot.mem.draft || {}, p = {}; ['party', 'date', 'time'].forEach(function (k) { var v = m.ent[k] !== undefined ? m.ent[k] : d[k]; if (v !== undefined) p[k] = v; }); if (m.ent.name) p.name = m.ent.name; bot.startFlow('waitlist', p); } },
      { id: 'reschedule', label: 'Change a booking', kw: ['reschedule', 'change my booking', 'change my reservation', 'move my booking', 'move my reservation', 'change the time', 'change the date', 'modify my booking', 'postpone', 'push my booking', 'change my table'], re: [/\b(resched\w*|postpone|move|change|modify|shift|push)\b.*\b(booking|reservation|table|time|date|slot)\b/i], priority: 2, flow: 'reschedule' },
      { id: 'cancel_booking', label: 'Cancel a booking', kw: ['cancel my booking', 'cancel my reservation', 'cancel my table', 'cancel the booking', 'cancel booking', 'cancel reservation'], re: [/^(?!.*\b(policy|fee|charge|charges|deposit|refund)\b).*\bcancel\w*\b.*\b(booking|reservation|table|dinner|lunch|tr-?\d{4})\b/i], priority: 2, flow: 'cancel' },
      { id: 'large', label: 'Private dining', kw: ['private room', 'private dining', 'private dinner', 'large group', 'big group', 'group booking', 'buyout', 'banquet', 'private event'], re: [/\bprivate (room|dining|dinner|lunch|event)\b/i, /\b(banquet|buyout)\b/i], priority: 3, run: function (bot, m) { large(bot, m.ent); } },
      { id: 'allergy', label: 'Allergies', kw: ['allergy', 'allergic', 'allergies', 'allergen', 'allergens', 'anaphylaxis', 'intolerant', 'intolerance', 'coeliac', 'celiac'], re: [/\ballerg/i, /\b(coeliac|celiac|anaphyla\w*)\b/i], priority: 2, run: function (bot, m) { menuAnswer(bot, m, { allergy: true }); } },
      { id: 'chef', label: 'Chef’s picks', kw: ['chef pick', 'recommend', 'recommendation', 'what should i order', 'what do you recommend', 'best dish', 'signature', 'must try', 'what is good', 'popular'], priority: 0, run: function (bot, m) { menuAnswer(bot, m, { chef: true }); } },
      { id: 'menu', label: 'Menu and diets', kw: ['menu', 'vegan', 'vegetarian', 'veg', 'non veg', 'gluten free', 'spicy', 'spice', 'mild', 'starter', 'main', 'bread', 'rice', 'dessert', 'drink', 'nut free', 'dairy free', 'jain', 'nuts', 'dishes', 'dish', 'what do you serve', 'what do you have', 'price of', 'how much is', 'goes with', 'go with', 'pairs with', 'pair with', 'show more', 'see more', 'more dishes', 'more options'], re: [/\bis (the |a |an )?[\w' -]+ (vegan|vegetarian|veg|gluten[- ]free|nut[- ]free|dairy[- ]free|jain|spicy)\b/i, /\bspice (level )?[0-3]\b/i], priority: 0, ctx: function (bot) { return bot.ctx.dish ? 1.5 : 0; }, run: function (bot, m) { menuAnswer(bot, m); } }
    ],
    flows: {
      table: { intent: 'table', slots: [
        sParty('table'), sDate('table'), sTime('table'), { name: 'service', optional: true }, sFit('table'), sName('table'), sPhone('table'),
        { name: 'requests', ask: K('table', function (bot, s) { bot.say((s.occasion ? 'I have noted the ' + s.occasion + '. ' : '') + 'Is there anything we should know, such as a high chair, a window table, or dietary needs?', { buttons: [B('No, that is all', 'slot:requests=none'), B('Birthday', 'slot:requests=birthday'), B('Anniversary', 'slot:requests=anniversary'), B('High chair', 'slot:requests=high chair'), B('Window table', 'slot:requests=window table'), B('Dietary needs', 'slot:requests=dietary needs')] }); }),
          parse: function (t) { if (/\?|^\s*(can|could|do|does|is|are|what|how|when|where|will)\b/i.test(t)) return undefined; if (N.yesno(t) === false || /^\s*(nothing|none|skip|that'?s all|no thanks|all good|that is all)/i.test(t)) return 'none'; if (/\b(mains?|starters?|desserts?|menu|dishes|under|price)\b/i.test(t)) return undefined; return /birthday|anniversary|business|client|high ?chair|baby|booster|window|corner|quiet|wheelchair|allerg|vegan|vegetarian|jain|gluten|nut|dairy|cake|surprise|balcony|celebrat|proposal|candle|stroller|pram/i.test(t) ? t.trim().slice(0, 120).toLowerCase() : undefined; }, hint: 'Tell me what to note, or tap No, that is all.' },
        { name: 'occasion', optional: true },
        sConfirm('table', function (bot, s) { var oc = s.occasion || occOf(s.requests), rq = s.requests && s.requests !== 'none' && s.requests !== oc ? s.requests : ''; return 'Let me read it back. ' + cap(sum(s)) + ', under the name ' + s.name + ', phone ending ' + last4(s.phone) + '.' + (oc ? ' Occasion: ' + oc + '.' : '') + (rq ? ' Notes: ' + rq + '.' : '') + (s.party >= 9 ? ' Groups of nine and ten sit in our private room, which has a minimum spend of ' + R(MINSP[svcOf(idxOf(s.time))]) + '.' : '') + ' Shall I confirm it?'; })
      ], done: function (bot, s) {
        var snap = cp(s); delete bot.mem.draft; delete bot.mem.draftFlow;
        if (s.confirm === 'no') { bot.say('No problem, I have not booked anything.'); bot.menu('Anything else?'); return; }
        if (s.confirm === 'change') { delete snap.confirm; bot.mem.draft = snap; bot.mem.draftFlow = 'table'; bot.say('What would you like to change?', { buttons: [B('Party size', 'act:chg:party'), B('Day', 'act:chg:date'), B('Time', 'act:chg:time'), B('Name', 'act:chg:name'), B('Notes', 'act:chg:requests')] }); return; }
        var bks = bot.db('bookings'), t = pickTable(s.date, s.time, s.party, bks);
        if (!t) { bot.say('Sorry, that table was taken a moment ago. Let me find you another time.'); delete snap.confirm; delete snap.time; delete snap.fit; bot.startFlow('table', snap); return; }
        var ref = newRef('TR-', bks), oc = s.occasion || occOf(s.requests), rq = s.requests && s.requests !== 'none' && s.requests !== oc ? s.requests : '', first = s.name.split(' ')[0];
        bks.push({ ref: ref, name: s.name, phone: s.phone, party: s.party, date: s.date, time: s.time, table: t.id, occasion: oc || '', requests: rq, status: 'confirmed', at: Date.now(), channel: bot.channel }); bot.save('bookings', bks);
        bot.user.name = s.name; bot.user.phone = s.phone; bot.mem.lastRef = ref;
        bot.lead({ name: s.name, phone: s.phone, intent: 'table', payload: { ref: ref, party: s.party, date: s.date, time: s.time, table: t.id, occasion: oc || '', requests: rq } }); bot.event('booking', { kind: 'table' });
        bot.say('You are all set, ' + first + '. **' + cap(sum(s)) + '** is confirmed. Your reference is **' + rs(bot, ref) + '**. We hold the table for fifteen minutes after your booking time.' + (oc === 'birthday' || oc === 'anniversary' ? ' The kitchen will bring a candle dessert, with our compliments.' : oc === 'business' ? ' We will seat you somewhere quiet.' : '') + (s.party >= 9 ? ' You are in our private room, minimum spend ' + R(MINSP[svcOf(idxOf(s.time))]) + '.' : ''),
          { cards: [{ title: 'Booking ' + ref, sub: cap(sum(s)), badge: 'Confirmed', meta: ['Name: ' + s.name, 'Table ' + t.id + ', seats ' + (t.room ? '10 to 14' : t.cap)].concat(oc ? ['Occasion: ' + oc] : []).concat(rq ? ['Notes: ' + rq] : []), buttons: [B('Reschedule', 'intent:reschedule'), B('Cancel booking', 'intent:cancel_booking')] }], buttons: [B('See the menu', 'intent:menu'), B('Dietary or allergy notes', 'intent:allergy'), B('That is all', 'say:bye')] });
        reminder(bot, s.name, s);
      } },
      waitlist: { intent: 'waitlist', slots: [sParty('waitlist'), sDate('waitlist'),
        { name: 'time', ask: K('waitlist', function (bot, s) { bot.say('Which time would you like us to watch for ' + s.party + ' ' + onDay(s.date) + '?', { buttons: [B('12:30 pm', 'slot:time=12:30'), B('1 pm', 'slot:time=13:00'), B('7:30 pm', 'slot:time=19:30'), B('8 pm', 'slot:time=20:00'), B('8:30 pm', 'slot:time=20:30'), B('9 pm', 'slot:time=21:00')] }); }), parse: function (t) { return pTime(t, true); }, hint: 'What time? For example 8 pm.' },
        sName('waitlist'), sPhone('waitlist')], done: function (bot, s) {
        delete bot.mem.draft; delete bot.mem.draftFlow; var bks = bot.db('bookings'), st = tstate(s, bks);
        if (st === 'ok') { bot.say('Good news, there is a table free at ' + tl(s.time) + ' ' + onDay(s.date) + ', so you do not need the waitlist. Let me book it for you.'); var p = cp(s); startTable(bot, p); return; }
        if (st !== 'full') { bot.say(st === 'past' ? 'That time has already passed today.' : 'We seat lunch from 12 to 2 pm and dinner from 7 to 9:30 pm, so I cannot add that time to the waitlist.', { buttons: [B('Book a table', 'intent:table'), B('Menu', 'menu')] }); return; }
        var est = estWait(s, bks), wl = bot.db('waitlist'), ref = newRef('WL-', wl), n = freeTables(s.date, s.time, s.party, bks).length, tot = TBL.filter(function (t) { return fits(t, s.party); }).length;
        wl.push({ ref: ref, name: s.name, phone: s.phone, party: s.party, date: s.date, time: s.time, status: 'waiting', at: Date.now() }); bot.save('waitlist', wl); bot.user.name = s.name; bot.user.phone = s.phone;
        bot.lead({ name: s.name, phone: s.phone, intent: 'waitlist', payload: { ref: ref, party: s.party, date: s.date, time: s.time, estWaitMin: est } }); bot.event('action', { action: 'waitlist_join' });
        bot.say('You are on the waitlist, ' + s.name.split(' ')[0] + '. Reference **' + ref + '**. At ' + tl(s.time) + ' ' + onDay(s.date) + ', ' + (n === 0 ? 'every table that suits ' + s.party + ' is taken' : (tot - n) + ' of the ' + tot + ' tables that suit ' + s.party + ' are taken') + '. ' + (est ? 'If you arrive then, expect a wait of about ' + est + ' minutes.' : 'Tables stay busy for the rest of that service, so I cannot promise a seat, but cancellations do happen.') + ' We will message ' + 'the number ending ' + last4(s.phone) + ' the moment a table opens, and hold it for ten minutes.', { cards: [{ title: 'Waitlist ' + ref, sub: 'Party of ' + s.party + ', ' + dayLong(s.date) + ' around ' + tl(s.time), badge: 'Waiting', meta: [est ? 'Estimated wait: about ' + est + ' minutes' : 'No table expected at that time', 'We message you first'] }], buttons: [B('Show other times', 'intent:table'), B('That is all', 'say:bye')] });
        bot.say('Message preview, simulated and not actually sent: “Tamarind Row: a table for ' + s.party + ' has opened at ' + tl(s.time) + '. Reply YES in ten minutes to hold it.”', { delay: 500 });
      } },
      reschedule: { intent: 'reschedule', slots: [sKey('reschedule'), sWhich('reschedule'), sParty('reschedule', true), sDate('reschedule'), sTime('reschedule'), sFit('reschedule'),
        sConfirm('reschedule', function (bot, s) { var b = getBk(bot, s.which); return 'Move **' + b.ref + '** from ' + dayLong(b.date) + ' at ' + tl(b.time) + ' to ' + dayLong(s.date) + ' at ' + tl(s.time) + ', for ' + s.party + '?'; })
      ], done: function (bot, s) {
        delete bot.mem.draft; delete bot.mem.draftFlow; if (s.confirm === 'no') { bot.say('Okay, your booking stays as it was.'); bot.menu('Anything else?'); return; }
        var bks = bot.db('bookings'), b = bks.filter(function (x) { return x.ref === s.which; })[0], t = b && pickTable(s.date, s.time, b.party, bks, b.ref);
        if (!b || !t) { bot.say('Sorry, that slot was just taken. Your original booking is unchanged.', { buttons: [B('Try another time', 'flow:reschedule'), B('Talk to a person', 'handover')] }); return; }
        b.date = s.date; b.time = s.time; b.table = t.id; b.moved = (b.moved || 0) + 1; bot.save('bookings', bks); bot.mem.lastRef = b.ref; bot.event('action', { action: 'table_reschedule' });
        bot.say('Done. **' + rs(bot, b.ref) + '** is now ' + sum(b) + '. The old table has been released.', { cards: [{ title: 'Booking ' + b.ref, sub: cap(sum(b)), badge: 'Rescheduled', meta: ['Name: ' + b.name, 'Table ' + t.id] }], buttons: [B('See the menu', 'intent:menu'), B('That is all', 'say:bye')] }); reminder(bot, b.name, b);
      } },
      cancel: { intent: 'cancel_booking', slots: [sKey('cancel'), sWhich('cancel'),
        sConfirm('cancel', function (bot, s) { var b = getBk(bot, s.which); return 'Cancel booking **' + bkLine(b) + ', under ' + b.name + '**? You can cancel free of charge up to four hours before.'; })
      ], done: function (bot, s) {
        delete bot.mem.draft; delete bot.mem.draftFlow; if (s.confirm === 'no') { bot.say('Good, your booking stays.'); bot.menu('Anything else?'); return; }
        var bks = bot.db('bookings'), b = bks.filter(function (x) { return x.ref === s.which; })[0]; if (!b) { bot.say('I could not find that booking any more.'); return; }
        var hrs = (parseIso(b.date).getTime() + (idxOf(b.time) * 30) * 6e4 - Date.now()) / 36e5; b.status = 'cancelled'; b.cancelledAt = Date.now(); bot.save('bookings', bks); bot.event('action', { action: 'table_cancel' });
        var hit = notifyWait(bot, b);
        bot.say('Done. **' + rs(bot, b.ref) + '** is cancelled and the table is released for other guests.' + (hrs < 4 && b.party >= 6 ? ' As it is within four hours, a late cancellation fee may apply for a group of six or more, and the team will confirm it with you.' : ' There is no charge.') + (hit ? ' (Demo note: a guest on the waitlist for that time has just been messaged.)' : ''), { buttons: [B('Book another time', 'intent:table'), B('That is all', 'say:bye')] });
      } }
    },
    actions: actions,
    kb: [
      { id: 'hours', q: 'What are your opening hours?', a: 'We are open every day. Lunch runs from 12 noon to 3 pm, with last seating at 2 pm. Dinner runs from 7 to 11 pm, with last seating at 9:30 pm.', keys: ['opening hours', 'opening times', 'timings', 'what time do you open', 'what time do you close', 'closing time', 'when are you open', 'are you open', 'open on sunday', 'open today', 'last seating'], buttons: [B('Book a table', 'intent:table'), B('Menu', 'menu')] },
      { id: 'parking', q: 'Is there parking?', a: 'Yes. We have valet parking at the front door, free for diners for up to three hours, and a public lot two minutes’ walk away. On Friday and Saturday evenings, allow ten extra minutes for the valet queue.', keys: ['parking', 'park my car', 'valet', 'car park', 'where do i park'] },
      { id: 'dress', q: 'Is there a dress code?', a: 'Smart casual. Shirts and shoes, please, and no beachwear. Weekend dinners and the private room tend to be a little dressier, but nobody will turn you away for a jacket.', keys: ['dress code', 'what to wear', 'smart casual', 'shorts', 'slippers', 'formal'] },
      { id: 'kids', q: 'Are children welcome?', a: 'Yes, children are welcome. We have high chairs and booster seats, a kids’ menu with mild versions of our dishes, and a baby-changing room. Tell me about a high chair when you book and we will set it up.', keys: ['kids', 'children', 'child', 'kid friendly', 'toddler', 'baby', 'high chair', 'family friendly', 'kids menu'], buttons: [B('Book a table', 'intent:table'), B('Menu', 'menu')] },
      { id: 'corporate', q: 'Do you host corporate events?', a: 'Yes. We host business lunches, team dinners and client evenings. For groups over ten, or for the private room, our events team plans a set menu and quotes a minimum spend. I can pass you to them now.', keys: ['corporate events', 'corporate event', 'corporate dinner', 'host a corporate', 'corporate lunch', 'business lunch', 'team dinner', 'office party', 'client dinner', 'company event', 'events'], buttons: [B('Private dining', 'intent:large'), B('Menu', 'menu')] },
      { id: 'cake', q: 'Can I bring my own cake?', a: 'Yes, outside cakes are welcome for birthdays and anniversaries. We serve it with plates and candles for a cake service fee of ₹300 per table. Or let the kitchen make a celebration dessert, which we bring out with a candle at no charge.', keys: ['cake', 'bring a cake', 'outside cake', 'own cake', 'birthday cake', 'cake cutting', 'cutting fee', 'bring dessert'], buttons: [B('Book a table', 'intent:table'), B('Menu', 'menu')] },
      { id: 'takeaway', q: 'Do you do takeaway or delivery?', a: 'Yes. Takeaway and delivery run during lunch and dinner service. Most dishes travel well, though breads are best fresh from the tandoor. Takeaway orders over ₹1,500 come with a free dessert.', keys: ['take away', 'takeaway', 'delivery', 'order online', 'pick up', 'parcel', 'to go', 'order home'] },
      { id: 'cancelpol', q: 'What is your cancellation policy?', a: 'You can cancel or change a booking free of charge up to four hours before. After that, or for a no-show, a fee of ₹500 per person may apply to groups of six or more. We hold your table for fifteen minutes after your booking time.', keys: ['cancellation policy', 'cancellation fee', 'cancel policy', 'no show', 'late cancellation', 'deposit', 'booking policy', 'late arrival', 'running late'], buttons: [B('Change a booking', 'intent:reschedule'), B('Cancel a booking', 'intent:cancel_booking')] },
      { id: 'location', q: 'Where are you?', a: 'Tamarind Row is on a quiet tree-lined lane in Bengaluru, a short walk from the metro station. Your confirmation message includes a map pin.', keys: ['where are you', 'address', 'location', 'how to reach', 'directions', 'nearest metro', 'landmark'] },
      { id: 'payment', q: 'How can I pay?', a: 'We accept all major cards, UPI and cash. A 5 percent service charge is added to the bill, and you can ask for it to be removed. We can split the bill between cards.', keys: ['payment', 'pay by card', 'upi', 'accept cards', 'service charge', 'split the bill', 'cash'] },
      { id: 'access', q: 'Is the restaurant accessible?', a: 'Yes. The ground floor is step-free, with an accessible restroom. Tell us about a wheelchair when you book and we will set a table with extra room.', keys: ['wheelchair', 'accessible', 'accessibility', 'step free', 'lift', 'disabled', 'elderly'] },
      { id: 'alcohol', q: 'Do you serve alcohol?', a: 'We have a short list of wines, craft beers and cocktails, plus a zero-proof menu. If you bring your own bottle, corkage is ₹1,500 per bottle.', keys: ['alcohol', 'wine', 'beer', 'liquor', 'licensed', 'corkage', 'bring a bottle', 'cocktail list', 'bar'] }
    ],
    freeText: function (bot, m) {
      var e = m.ent;
      if (e.dishes && e.dishes.length) { menuAnswer(bot, m); return true; }
      if (e.party && (e.date || e.time || e.service || DAYRE.test(m.norm))) { startTable(bot, e); return true; }
      if (hasF(e.f || {}) && !e.party) { menuAnswer(bot, m); return true; }
      return false;
    }
  });
  O.agents.dining.debug = { occ: occ, freeList: freeList, freeTables: freeTables, pickTable: pickTable, estWait: estWait, tOf: tOf, TBL: TBL };
})();
