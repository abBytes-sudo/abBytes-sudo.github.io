/* Fieldwise — store: state, persistence, matching, routing maths and every action (all actions log to timeline + audit). */
(function () {
  'use strict';
  var CK = window.CK;
  var KEY = 'fieldwise-data-v5', UIKEY = 'fieldwise-ui-v1';
  var DAY = CK.DAY, S = null, subs = [];

  /* ---------- formatting ---------- */
  function grp(n) { n = Math.round(n); var s = String(Math.abs(n)), last = s.slice(-3), rest = s.slice(0, -3); if (rest) last = ',' + last; return (n < 0 ? '−' : '') + rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + last; }
  CK.grp = grp;
  CK.inr = function (n) { return '₹' + grp(n); };
  CK.money = function (n, short) { // ₹1.4 L / ₹4.25 Cr / ₹65,000
    if (n >= 1e7) return '₹' + trim(n / 1e7, 2) + ' Cr';
    if (n >= 1e5) return '₹' + trim(n / 1e5, n >= 1e6 ? 1 : 2) + ' L';
    if (short && n >= 1000) return '₹' + trim(n / 1000, 1) + 'k';
    return '₹' + grp(n);
  };
  function trim(x, d) { return String(+x.toFixed(d)); }
  CK.price = function (p) { return CK.money(p.price, true) + (p.deal === 'rent' ? '/mo' : ''); };
  CK.priceLong = function (p) { return (p.deal === 'rent' ? CK.inr(p.price) + ' a month' : CK.money(p.price)); };
  CK.budget = function (L) { return (L.intent === 'rent' ? CK.money(L.req.budget, true) + '/mo' : CK.money(L.req.budget)); };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  CK.MON = MON; CK.WD = WD;
  CK.date = function (t, withDay) { var d = new Date(t); return (withDay ? WD[d.getDay()] + ' ' : '') + d.getDate() + ' ' + MON[d.getMonth()]; };
  CK.time = function (t) { var d = new Date(t), h = d.getHours(), m = d.getMinutes(); return ((h + 11) % 12 + 1) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' am' : ' pm'); };
  CK.hm = function (t) { var d = new Date(t), h = d.getHours(), m = d.getMinutes(); return ((h + 11) % 12 + 1) + ':' + (m < 10 ? '0' : '') + m; };
  CK.dayLabel = function (t) { var d = CK.dayStart(t), td = CK.dayStart(CK.now()); var n = Math.round((d - td) / DAY); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? 'Yesterday' : CK.date(t, true); };
  CK.ago = function (t) { var s = (CK.now() - t) / 1000; if (s < 0) { s = -s; if (s < 3600) return 'in ' + Math.max(1, Math.round(s / 60)) + ' min'; if (s < 86400) return 'in ' + Math.round(s / 3600) + ' h'; return 'in ' + Math.round(s / 86400) + ' d'; } if (s < 60) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; var d = Math.round(s / 86400); return d === 1 ? 'yesterday' : d + ' days ago'; };
  CK.days = function (t) { return Math.floor((CK.now() - t) / DAY); };
  CK.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  CK.initials = function (n) { return n.replace(/^(Col\.|Dr\.|Brig\.)\s*/, '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); };
  CK.cfg = function (p) { return p.type === 'Office' ? CK.grp(p.sqft) + ' sq ft office' : p.type === 'Studio' ? 'Studio' : p.bhk + ' BHK ' + p.type.toLowerCase(); };

  /* the clock: real time, kept inside office hours so the seeded day reads right */
  CK.now = function () { var t = Date.now(), d = CK.dayStart(t); return Math.min(Math.max(t, d + 11 * 36e5 + 2 * 6e4), d + 18 * 36e5 + 25 * 6e4); };

  /* ---------- lookups ---------- */
  function by(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }
  CK.prop = function (id) { return by(S.props, id); };
  CK.lead = function (id) { return by(S.leads, id); };
  CK.agent = function (id) { return by(S.agents, id); };
  CK.owner = function (id) { return by(S.owners, id); };
  CK.trip = function (id) { return by(S.trips, id); };
  CK.deal = function (id) { return by(S.deals, id); };
  CK.partner = function (id) { return by(S.partners, id); };
  CK.S = function () { return S; };

  /* ---------- freshness & verification ---------- */
  CK.window = function (p) { return p.deal === 'rent' ? S.settings.rentWindow : S.settings.saleWindow; };
  CK.ver = function (p) { // pending | fresh | due | overdue | rejected
    var v = p.ver; if (v.status === 'pending') return 'pending'; if (v.status === 'rejected') return 'rejected';
    var age = (CK.now() - v.at) / DAY, w = CK.window(p);
    return age > w + 10 ? 'overdue' : age > w - 3 ? 'due' : 'fresh';
  };
  CK.verAge = function (p) { return p.ver.at ? Math.floor((CK.now() - p.ver.at) / DAY) : null; };
  CK.fresh = function (p) { // 0..100 listing freshness
    if (p.ver.status === 'pending') return 28;
    var age = (CK.now() - p.ver.at) / DAY, w = CK.window(p);
    var a = Math.max(0, 1 - age / (w * 1.4)) * 60;
    var ph = Math.min(1, (p.ver.photos || 0) / 8) * 20;
    var ow = Math.max(0, 1 - (CK.now() - p.ownerLastReply) / DAY / 45) * 12;
    var pr = Math.max(0, 1 - (CK.now() - p.hist[p.hist.length - 1].at) / DAY / 90) * 8;
    return Math.round(a + ph + ow + pr);
  };
  CK.freshLabel = function (f) { return f >= 70 ? 'Fresh' : f >= 45 ? 'Ageing' : 'Stale'; };

  /* ---------- matching (budget is a band: ±10% fits, +20% is close) ---------- */
  CK.match = function (L, p) {
    var R = [], s = 0, q = L.req;
    if (p.r !== q.r) return null;
    if ((L.intent === 'rent') !== (p.deal === 'rent')) return null;
    if (p.status === 'let' || p.status === 'sold' || p.status === 'inactive') return null;
    if (p.type === 'Office') return null;
    var ratio = p.price / q.budget, pct = Math.round((ratio - 1) * 100);
    if (ratio <= 1.1 && ratio >= 0.72) { s += ratio <= 1 ? 35 - Math.round(Math.max(0, 0.93 - ratio) * 45) : 33 - Math.round(pct * 0.9); R.push([1, ratio <= 1 ? 'Within budget' + (ratio < .9 ? ' (' + Math.abs(pct) + '% under)' : '') : pct + '% over, inside the 10% band']); }
    else if (ratio > 1.1 && ratio <= 1.2) { s += 18; R.push([0, pct + '% over budget — close']); }
    else if (ratio < 0.72) { s += 16; R.push([0, 'Well under budget (' + CK.money(p.price, true) + ')']); }
    else return null;
    if (q.bhk.indexOf(p.bhk) >= 0) { s += 20; R.push([1, p.bhk + ' BHK as asked']); }
    else if (Math.abs(p.bhk - q.bhk[0]) === 1) { s += 7; R.push([0, p.bhk + ' BHK, asked ' + q.bhk.join('/')]); }
    else return null;
    var a = CK.area(p.area);
    if (q.sectors.indexOf(p.area) >= 0) { s += 25 - q.sectors.indexOf(p.area) * 2; R.push([1, a.short + ' is on their list']); }
    else {
      var best = 99, bn = '';
      q.sectors.forEach(function (id) { var b = CK.area(id), k = CK.km(p, b); if (k < best) { best = k; bn = b.short; } });
      if (best < 2.2) { s += 15; R.push([0, best.toFixed(1) + ' km from ' + bn]); } else if (best < 4) { s += 6; R.push([0, best.toFixed(1) + ' km from ' + bn]); } else return null;
    }
    if (p.availFrom <= q.moveIn) { s += 8; R.push([1, 'Free by ' + CK.date(q.moveIn)]); } else if (p.availFrom - q.moveIn < 12 * DAY) { s += 4; R.push([0, 'Free ' + CK.date(p.availFrom) + ', after move-in']); } else { R.push([0, 'Free only from ' + CK.date(p.availFrom)]); }
    var v = CK.ver(p);
    if (v === 'fresh') { s += Math.round(7 * Math.min(1, CK.fresh(p) / 85)); R.push([1, 'Verified ' + CK.verAge(p) + 'd ago']); } else if (v === 'pending') R.push([0, 'Not verified yet']); else { s += 3; R.push([0, 'Check is ' + v]); }
    if (p.pref && p.pref !== 'Any' && L.intent === 'rent') {
      var fam = q.family;
      var ok = (p.pref === 'Families' && (fam === 'Family' || fam === 'Couple')) || (p.pref === 'Working professionals' && fam !== 'Family') || (p.pref === 'Expats preferred' && L.tags.indexOf('NRI') >= 0);
      if (ok) { s += 5; R.push([1, 'Owner prefers ' + p.pref.toLowerCase()]); } else R.push([0, 'Owner prefers ' + p.pref.toLowerCase()]);
    } else s += 5;
    if (L.tags.indexOf('Pets') >= 0) { if (!p.pets) { s -= 6; R.push([0, 'No pets allowed']); } else R.push([1, 'Pets allowed']); }
    if (p.status === 'hold' || p.status === 'blocked') { s -= 8; R.push([0, p.status === 'hold' ? 'On hold for another client' : 'Blocked — token paid']); }
    return { p: p, score: Math.max(0, Math.min(99, s)), why: R };
  };
  CK.matches = function (L, min) {
    var out = []; S.props.forEach(function (p) { var m = CK.match(L, p); if (m && m.score >= (min == null ? 45 : min)) out.push(m); });
    return out.sort(function (a, b) { return b.score - a.score; });
  };

  /* ---------- a brief in plain words → a requirement ("3 BHK in Vasant Vihar, around 1.1 lakh, near a school, by mid-December") ---------- */
  var ALIAS = { VV: ['vasant vihar'], AN: ['anand niketan'], SN: ['shanti niketan'], JB: ['jor bagh', 'jorbagh'], SE: ['safdarjung enclave', 'safdarjung encl', 'safdarjung'], GP: ['green park'], HK: ['hauz khas', 'hkv'], SV: ['sarvodaya enclave', 'sarvodaya'], PP: ['panchsheel park', 'panchsheel'], DC: ['defence colony', 'def col', 'def colony'], LN: ['lajpat nagar', 'lajpat'], G1: ['greater kailash 1', 'greater kailash i', 'greater kailash-1', 'gk 1', 'gk-1', 'gk i', 'gk1'], G2: ['greater kailash 2', 'greater kailash ii', 'greater kailash-2', 'gk 2', 'gk-2', 'gk ii', 'gk2'], CR: ['chittaranjan park', 'c r park', 'cr park'], MN: ['malviya nagar', 'malviya'], SK: ['saket'], VK: ['vasant kunj'] };
  var MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  function rx(a) { return new RegExp('(^|[^a-z0-9])' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![a-z0-9])'); }
  CK.parseBrief = function (text) {
    var t = ' ' + String(text || '').toLowerCase().replace(/(\d),(?=\d)/g, '$1').replace(/[;|]/g, ' ') + ' ', b = { sectors: [], bhk: null, intent: null, budget: null, moveIn: null, school: /school/.test(t), pets: /\b(pet|pets|dog|dogs|cat|cats|labrador)\b/.test(t), furn: null, type: null, family: null };
    var m = t.match(/(\d)\s*-?\s*(?:bhk|bed(?:room)?s?|br)\b/); if (m) b.bhk = +m[1]; else if (/\bstudio\b/.test(t)) b.bhk = 1;
    var hits = [];
    Object.keys(ALIAS).forEach(function (id) { ALIAS[id].some(function (a) { var r = t.search(rx(a)); if (r >= 0) { hits.push([r, id]); return true; } return false; }); });
    t.replace(/\bsec(?:tor)?[ -]?(\d{2})\b/g, function (x, n, i) { if (CK.area('S' + n)) hits.push([i, 'S' + n]); return x; });
    hits.sort(function (x, y) { return x[0] - y[0]; }); hits.forEach(function (h) { if (b.sectors.indexOf(h[1]) < 0) b.sectors.push(h[1]); });
    var mm = t.match(/(\d+(?:\.\d+)?)\s*(crores?|cr)\b/), amt = 0;
    if (mm) amt = +mm[1] * 1e7; else if ((mm = t.match(/(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|l)\b/))) amt = +mm[1] * 1e5; else if ((mm = t.match(/(\d+(?:\.\d+)?)\s*(k|thousand)\b/))) amt = +mm[1] * 1e3; else if ((mm = t.match(/(?:₹|rs\.?)\s*(\d{4,9})/) || t.match(/\b(\d{5,9})\b/))) amt = +mm[1];
    if (amt) b.budget = Math.round(amt);
    if (/\b(buy|buying|purchase|for sale|resale|to own)\b/.test(t)) b.intent = 'buy'; else if (/\b(rent|rental|lease|per month|a month|monthly|tenant)\b/.test(t)) b.intent = 'rent'; else b.intent = amt && amt >= 5e6 ? 'buy' : 'rent';
    var mo = t.match(/\b(early|mid|middle of|end of|late)?[ -]?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/), now = new Date(CK.now());
    if (mo) { var mi = MONTHS.indexOf(mo[2]), y = now.getFullYear() + (mi < now.getMonth() ? 1 : 0), dd = /mid|middle/.test(mo[1] || '') ? 15 : /end|late/.test(mo[1] || '') ? 28 : /early/.test(mo[1] || '') ? 5 : 1; b.moveIn = new Date(y, mi, dd, 12).getTime(); }
    else if (/next month/.test(t)) b.moveIn = CK.now() + 30 * DAY; else if ((mo = t.match(/in (\d+) weeks?/))) b.moveIn = CK.now() + +mo[1] * 7 * DAY; else if (/\b(asap|immediately|this week|right away)\b/.test(t)) b.moveIn = CK.now() + 7 * DAY;
    if (/fully[- ]furnished/.test(t)) b.furn = 'Fully furnished'; else if (/semi[- ]?furnished/.test(t)) b.furn = 'Semi-furnished'; else if (/unfurnished/.test(t)) b.furn = 'Unfurnished';
    if (/builder floor/.test(t)) b.type = 'Builder floor'; else if (/\b(apartment|flat|society)\b/.test(t)) b.type = 'Apartment'; else if (/independent house|kothi|bungalow/.test(t)) b.type = 'Independent house';
    if (/\b(company lease|corporate)\b/.test(t)) b.family = 'Corporate lease'; else if (/\bcouple\b/.test(t)) b.family = 'Couple'; else if (/\b(family|kids|children|parents)\b/.test(t)) b.family = 'Family';
    b.r = b.sectors.length ? CK.area(b.sectors[0]).r : 'sd'; b.sectors = b.sectors.filter(function (id) { return CK.area(id).r === b.r; });
    b.chips = [(b.bhk ? b.bhk + ' BHK' : 'Any size'), (b.intent === 'buy' ? 'To buy' : 'To rent'), (b.budget ? '≈ ' + CK.money(b.budget, true) + (b.intent === 'rent' ? '/mo' : '') : 'Any budget')].concat(b.sectors.map(function (id) { return CK.area(id).short; }), b.school ? ['near a school'] : [], b.pets ? ['pets'] : [], b.moveIn ? ['by ' + CK.date(b.moveIn)] : []);
    return b;
  };
  CK.marketPrice = function (r, sectors, bhk, deal) { var ps = S.props.filter(function (p) { return p.r === r && p.deal === deal && (!bhk || p.bhk === bhk) && (!sectors.length || sectors.indexOf(p.area) >= 0) && p.type !== 'Office'; }).map(function (p) { return p.price; }).sort(function (a, b) { return a - b; }); return ps.length ? ps[Math.floor(ps.length / 2)] : (deal === 'rent' ? 90000 : 40000000); };
  CK.briefLead = function (b) { // a lead-shaped requirement the matcher understands
    var deal = b.intent === 'buy' ? 'sale' : 'rent';
    return { id: 'brief', name: 'Brief', intent: b.intent, tags: b.pets ? ['Pets'] : [], req: { r: b.r, bhk: b.bhk ? [b.bhk] : [2, 3, 4], budget: b.budget || CK.marketPrice(b.r, b.sectors, b.bhk, deal), sectors: b.sectors, moveIn: b.moveIn || CK.now() + 30 * DAY, type: b.type || 'Any', furn: b.furn || 'Any', family: b.family || 'Family', note: '' } };
  };
  CK.poiDist = function (p, kind) { var best = 1e9; (CK.POIS || []).forEach(function (q) { if (q.k !== kind) return; var d = CK.km(p, q) * 1000; if (d < best) best = d; }); return best; };

  /* ---------- map maths & routes ---------- */
  CK.xy = function (o, r) { var R = CK.REGIONS[r || o.r || 'sd']; return [(o.lng - R.lng[0]) / (R.lng[1] - R.lng[0]) * R.w, (R.lat[1] - o.lat) / (R.lat[1] - R.lat[0]) * R.h]; };
  CK.legMin = function (a, b) { var k = CK.km(a, b); return Math.max(4, Math.round(k * 4.4 + 4)); }; // Delhi traffic ≈ 14 km/h + parking
  CK.orderStops = function (start, stops) { // nearest neighbour, then 2-opt
    var rest = stops.slice(), route = [], cur = start;
    while (rest.length) { var bi = 0, bd = 1e9; rest.forEach(function (s, i) { var d = CK.km(cur, s); if (d < bd) { bd = d; bi = i; } }); cur = rest.splice(bi, 1)[0]; route.push(cur); }
    function len(rt) { var t = 0, c = start; rt.forEach(function (s) { t += CK.legMin(c, s); c = s; }); return t; }
    var improved = true, guard = 0;
    while (improved && guard++ < 40) { improved = false; for (var i = 0; i < route.length - 1; i++) for (var j = i + 1; j < route.length; j++) { var n = route.slice(0, i).concat(route.slice(i, j + 1).reverse(), route.slice(j + 1)); if (len(n) < len(route)) { route = n; improved = true; } } }
    return route;
  };
  CK.routeLen = function (start, stops) { var t = 0, c = start; stops.forEach(function (s) { t += CK.legMin(c, s); c = s; }); return t; };
  CK.schedule = function (trip) { // fill eta on each stop
    var R = CK.REGIONS[trip.r], c = R.office, t = trip.start, out = [];
    trip.stops.forEach(function (st) { var p = CK.prop(st.pid); var leg = CK.legMin(c, p); t += leg * 6e4; out.push({ leg: leg, eta: t }); t += (trip.kind === 'verify' ? 25 : S.settings.visitMinutes) * 6e4; c = p; });
    return { legs: out, end: t };
  };
  CK.tripStatus = function (t) { return t.status; };

  /* ---------- persistence & events ---------- */
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  CK.save = save;
  CK.on = function (fn) { subs.push(fn); };
  CK.off = function (fn) { var i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); };
  function emit(what) { save(); subs.forEach(function (f) { try { f(what); } catch (e) { console.error(e); } }); }
  CK.emit = emit;
  CK.ui = (function () { var u = {}; try { u = JSON.parse(localStorage.getItem(UIKEY)) || {}; } catch (e) { } return u; })();
  CK.saveUI = function () { try { localStorage.setItem(UIKEY, JSON.stringify(CK.ui)); } catch (e) { } };
  addEventListener('storage', function (e) { if (e.key === KEY && e.newValue) { try { S = JSON.parse(e.newValue); subs.forEach(function (f) { f('sync'); }); } catch (x) { } } });

  CK.me = function () { return CK.agent(CK.ui.as || 'A1') || S.agents[0]; };
  CK.role = function () { return CK.ui.role || 'admin'; };

  /* ---------- timeline + audit ---------- */
  function tl(L, kind, text, extra) { var e = { at: CK.now(), kind: kind, text: text, by: (CK.me() || {}).id }; if (extra) for (var k in extra) e[k] = extra[k]; L.tl.unshift(e); L.last = e.at; return e; }
  function audit(action, ref, detail) { S.audit.unshift({ at: CK.now(), who: CK.ui.role === 'partner' ? (CK.ui.partner || 'PT1') : (CK.me() || {}).id, action: action, ref: ref, detail: detail || '' }); if (S.audit.length > 400) S.audit.length = 400; }
  CK.tl = tl; CK.audit = audit;

  /* ---------- actions ---------- */
  var A = CK.act = {};
  var STAGE_ORDER = ['new', 'contacted', 'requirement', 'matched', 'visit', 'deal'];
  A.stage = function (L, st, quiet) {
    if (L.stage === st) return; var from = L.stage; L.stage = st;
    tl(L, 'stage', 'Stage: ' + label(from) + ' → ' + label(st)); audit('Moved lead stage', L.id, label(from) + ' → ' + label(st)); if (!quiet) emit('lead');
  };
  function label(s) { var x = CK.LEAD_STAGES.filter(function (q) { return q.id === s; })[0]; return x ? x.label : s === 'lost' ? 'Lost' : s; }
  CK.stageLabel = label;
  A.bump = function (L, st) { if (STAGE_ORDER.indexOf(L.stage) < STAGE_ORDER.indexOf(st)) A.stage(L, st, true); };
  A.call = function (L, outcome, note, next) {
    var map = { connected: 'Connected', callback: 'Asked to call back', noanswer: 'Did not pick up', busy: 'Busy / switched off', wrong: 'Wrong number', notint: 'Not interested' };
    var txt = 'Call · ' + map[outcome] + (note ? ' — “' + note + '”' : '');
    tl(L, 'call', txt, { outcome: outcome });
    if (outcome === 'noanswer' || outcome === 'busy') {
      L.misses = (L.misses || 0) + 1;
      if (L.misses >= S.settings.maxMisses) { tl(L, 'system', L.misses + ' missed calls — handed to ' + CK.agent('A2').name + ' to decide'); addTask({ kind: 'call', title: 'Decide: ' + L.misses + ' missed calls', lead: L.id, due: CK.now() + 36e5, who: 'A2' }); }
      else { addTask({ kind: 'call', title: 'Retry call (' + L.misses + ' of ' + S.settings.maxMisses + ')', lead: L.id, due: CK.now() + S.settings.missedCallRetryH * 36e5, who: L.owner }); tl(L, 'system', 'Retry booked in ' + S.settings.missedCallRetryH + ' h'); }
    } else { L.misses = 0; }
    if (outcome === 'connected') A.bump(L, 'contacted');
    if (outcome === 'notint') { L.stage = 'lost'; L.lostReason = note || 'Not interested'; }
    if (next && next.kind) { addTask({ kind: next.kind, title: next.title, lead: L.id, due: next.due, who: next.who || L.owner }); tl(L, 'task', 'Next: ' + next.title + ' · ' + CK.dayLabel(next.due) + ' ' + CK.time(next.due)); }
    closeTasks(L.id, 'call');
    audit('Logged call', L.id, map[outcome]);
    emit('call');
  };
  A.note = function (L, text) { tl(L, 'note', text); audit('Added note', L.id); emit('lead'); };
  A.wa = function (L, text) { tl(L, 'wa', 'WhatsApp sent — “' + text.slice(0, 90) + (text.length > 90 ? '…' : '') + '”'); audit('Sent WhatsApp', L.id); emit('lead'); };
  A.setReq = function (L, field, val) { var old = L.req[field]; L.req[field] = val; L.reqDone = true; tl(L, 'edit', 'Requirement · ' + field + ' changed'); audit('Edited requirement', L.id, field); A.bump(L, 'requirement'); emit('lead'); return old; };
  A.shortlist = function (L, pid, on) {
    var i = L.shortlist.indexOf(pid), p = CK.prop(pid);
    if (on === undefined) on = i < 0;
    if (on && i < 0) { L.shortlist.push(pid); tl(L, 'match', 'Shortlisted ' + p.code + ' · ' + CK.area(p.area).short + ' · ' + CK.price(p)); A.bump(L, 'matched'); }
    if (!on && i >= 0) { L.shortlist.splice(i, 1); tl(L, 'match', 'Removed ' + p.code + ' from shortlist'); }
    audit(on ? 'Shortlisted property' : 'Removed from shortlist', L.id, p.code); emit('lead');
  };
  A.assign = function (L, who, field) { L[field || 'owner'] = who; tl(L, 'system', (field === 'field' ? 'Field agent' : 'Owner') + ' → ' + CK.agent(who).name); audit('Reassigned lead', L.id, CK.agent(who).name); emit('lead'); };
  A.newLead = function (o) {
    S.seq.L++; var L = { id: 'L-' + S.seq.L, name: o.name, phone: o.phone || '98XXX XX' + (100 + S.seq.L % 900), intent: o.intent || 'rent', src: o.src || 'Walk-in', found: o.found || 'Office signboard', partnerId: o.partnerId || null, stage: 'new', req: o.req, reqDone: !!o.reqDone, owner: o.owner || nextCaller(), field: o.req.r === 'ggn' ? 'A8' : 'A6', created: CK.now(), last: null, next: null, shortlist: [], tl: [], misses: 0, tags: [] };
    S.leads.unshift(L); tl(L, 'created', 'Lead created from ' + L.src + (L.partnerId ? ' · ' + CK.partner(L.partnerId).name : '')); L.last = null;
    tl(L, 'system', 'Auto-assigned to ' + CK.agent(L.owner).name + ' (round-robin) · first call due in 15 min'); L.last = null;
    addTask({ kind: 'call', title: 'First call — new lead', lead: L.id, due: CK.now() + 15 * 6e4, who: L.owner });
    audit('Created lead', L.id, L.src); emit('lead'); return L;
  };
  var rr = 0; function nextCaller() { var c = ['A3', 'A4', 'A5']; rr = (rr + 1) % 3; return c[rr]; }

  /* tasks */
  function addTask(t) { S.seq.K++; t.id = 'K' + S.seq.K; t.done = false; t.created = CK.now(); S.tasks.push(t); return t; }
  CK.addTask = addTask;
  function closeTasks(leadId, kind) { S.tasks.forEach(function (t) { if (!t.done && t.lead === leadId && t.kind === kind && t.due < CK.now() + 6 * 36e5) { t.done = true; t.doneAt = CK.now(); } }); }
  A.task = function (t, done) { t.done = done; t.doneAt = done ? CK.now() : null; audit(done ? 'Completed task' : 'Reopened task', t.lead || t.prop || t.id, t.title); emit('task'); };
  A.reschedule = function (ids, due) { S.tasks.forEach(function (t) { if (ids.indexOf(t.id) >= 0) t.due = due; }); audit('Rescheduled tasks', ids.length + ' tasks', CK.dayLabel(due)); emit('task'); };

  /* trips */
  A.planTrip = function (o) {
    S.seq.T++; var R = CK.REGIONS[o.r];
    var t = { id: 'TR-' + S.seq.T, agent: o.agent, date: CK.dayStart(o.start), start: o.start, r: o.r, kind: o.kind || 'visit', status: 'planned', leads: o.leads.slice(), stops: o.pids.map(function (pid) { return { pid: pid, leads: o.leads.filter(function (lid) { var L = CK.lead(lid); return L.shortlist.indexOf(pid) >= 0 || o.leads.length === 1; }), st: 'togo', out: {}, at: null, photos: 0 }; }), feed: [], by: CK.me().id, created: CK.now() };
    t.stops.forEach(function (s) { if (!s.leads.length) s.leads = o.leads.slice(); });
    S.trips.push(t);
    o.leads.forEach(function (lid) { var L = CK.lead(lid); A.bump(L, 'visit'); tl(L, 'trip', 'Site visit planned · ' + t.id + ' · ' + CK.dayLabel(t.start) + ' ' + CK.time(t.start) + ' with ' + CK.agent(t.agent).name.split(' ')[0] + ' · ' + t.stops.length + ' homes'); });
    o.pids.forEach(function (pid) { addTask({ kind: 'owner', title: 'Tell owner: visit ' + CK.dayLabel(t.start).toLowerCase() + ' ' + CK.time(t.start), prop: pid, due: t.start - 3 * 36e5, who: 'A2' }); });
    addTask({ kind: 'visit', title: 'Site visits · ' + t.stops.length + ' homes', trip: t.id, due: t.start, who: t.agent });
    audit('Planned trip', t.id, t.stops.length + ' stops · ' + CK.agent(t.agent).name); emit('trip'); return t;
  };
  function feed(t, text) { t.feed.unshift({ at: CK.now(), text: text }); }
  A.checkIn = function (t, i, m) {
    var s = t.stops[i]; s.st = 'here'; s.at = CK.now(); s.geo = m == null ? 18 : m;
    if (t.status === 'planned' || t.status === 'waiting') { t.status = 'out'; t.startedAt = CK.now(); feed(t, 'Trip started'); }
    feed(t, 'Checked in at ' + CK.prop(s.pid).code + ' · ' + s.geo + ' m from pin'); audit('Checked in (field app)', t.id, CK.prop(s.pid).code); emit('trip');
  };
  A.photo = function (t, i, n) { var s = t.stops[i]; s.photos = (s.photos || 0) + (n || 1); feed(t, (n || 1) + ' photo' + ((n || 1) > 1 ? 's' : '') + ' added at ' + CK.prop(s.pid).code); emit('trip'); };
  A.outcome = function (t, i, out, note) { // out: {leadId: {v:'liked'|'short'|'rejected'|'novisit', reason}}
    var s = t.stops[i], p = CK.prop(s.pid); s.out = out; s.note = note || ''; s.st = Object.keys(out).every(function (k) { return out[k].v === 'novisit'; }) ? 'missed' : 'done'; s.doneAt = CK.now();
    if (t.status !== 'out' && t.status !== 'done') { t.status = 'out'; t.startedAt = t.startedAt || CK.now(); }
    Object.keys(out).forEach(function (lid) {
      var L = CK.lead(lid), o = out[lid]; if (!L) return;
      var word = { liked: 'Liked it', short: 'Shortlisted', rejected: 'Rejected — ' + (o.reason || 'no reason'), novisit: 'Not visited' }[o.v];
      tl(L, 'visit', 'Visit · ' + p.code + ' ' + CK.area(p.area).short + ' — ' + word + (note ? ' · “' + note + '”' : ''), { pid: p.id, v: o.v });
      if (o.v === 'short' && L.shortlist.indexOf(p.id) < 0) L.shortlist.push(p.id);
      if (o.v !== 'novisit') A.bump(L, 'visit');
    });
    feed(t, p.code + ' — ' + Object.keys(out).map(function (k) { return { liked: 'liked', short: 'shortlisted', rejected: 'rejected', novisit: 'not visited' }[out[k].v]; }).join(', '));
    S.msgs.unshift({ at: CK.now(), owner: p.ownerId, pid: p.id, kind: 'visit', text: ownerMsg(p, out), sent: false });
    if (t.stops.every(function (x) { return x.st === 'done' || x.st === 'missed'; })) { t.status = 'done'; t.endedAt = CK.now(); feed(t, 'Trip finished'); }
    audit('Logged visit outcome', t.id, p.code); emit('trip');
  };
  function ownerMsg(p, out) {
    var o = CK.owner(p.ownerId), vs = Object.keys(out).map(function (k) { return out[k]; });
    var liked = vs.filter(function (v) { return v.v === 'liked' || v.v === 'short'; }).length, rej = vs.filter(function (v) { return v.v === 'rejected'; });
    var first = o.name.replace(/\s*\(.*\)/, '');
    if (liked) return 'Namaste ' + first + ' ji, we showed your ' + CK.cfg(p) + ' at ' + p.plot + ' today. The family liked it and has shortlisted it — we will share their offer by tomorrow. — Amaltas Estates';
    if (rej.length) return 'Namaste ' + first + ' ji, thank you for opening ' + p.plot + ' today. The client passed this time (' + (rej[0].reason || 'not a fit').toLowerCase() + '). We have two more families lined up this week. — Amaltas Estates';
    return 'Namaste ' + first + ' ji, today’s visit to ' + p.plot + ' could not happen. Can we come tomorrow between 11 and 1? — Amaltas Estates';
  }
  A.msgSent = function (m) { m.sent = true; var o = CK.owner(m.owner); o.comms.unshift({ at: CK.now(), kind: 'wa', text: m.text, by: CK.me().id }); audit('Notified owner (WhatsApp template)', o.id, CK.prop(m.pid).code); emit('owner'); };
  A.tripStatus = function (t, st) { t.status = st; if (st === 'done') t.endedAt = CK.now(); audit('Trip ' + st, t.id); emit('trip'); };
  A.reorder = function (t, from, to) { var s = t.stops.splice(from, 1)[0]; t.stops.splice(to, 0, s); emit('trip'); };

  /* verification */
  A.verify = function (p, checks, ok, reason, by) {
    var who = by || CK.me().id;
    if (ok) { p.ver = { status: 'verified', at: CK.now(), by: who, checks: checks, geo: { m: p.ver.geo && p.ver.geo.m || 22 }, photos: Math.max(6, p.ver.photos || 0, (p.ver.newPhotos || 0) + 6), reject: null }; audit('Verified listing', p.code, 'Badge on for ' + CK.window(p) + ' days'); }
    else { p.ver.status = 'rejected'; p.ver.reject = reason; p.ver.at = CK.now(); p.ver.by = who; audit('Rejected listing', p.code, reason); }
    S.tasks.forEach(function (t) { if (t.prop === p.id && t.kind === 'verify' && !t.done) { t.done = true; t.doneAt = CK.now(); } });
    emit('verify');
  };
  A.ownerRequest = function (p) { var o = CK.owner(p.ownerId); o.requests.unshift({ at: CK.now(), pid: p.id, st: 'sent' }); o.comms.unshift({ at: CK.now(), kind: 'wa', text: 'Update-your-listing link sent for ' + p.code + ' (price, availability, photos).', by: CK.me().id }); audit('Sent “update your listing” request', p.code, o.name); emit('owner'); };
  A.ownerUpdate = function (p, price, avail) {
    var o = CK.owner(p.ownerId);
    if (price && price !== p.price) { p.hist.push({ at: CK.now(), price: price }); p.price = price; }
    if (avail) p.availFrom = avail; p.ownerLastReply = CK.now();
    o.requests.forEach(function (r) { if (r.pid === p.id && r.st !== 'updated') r.st = 'updated'; });
    o.comms.unshift({ at: CK.now(), kind: 'form', text: 'Owner updated ' + p.code + ' — ' + CK.price(p) + ', free from ' + CK.date(p.availFrom), by: null });
    audit('Owner updated listing', p.code); emit('owner');
  };
  A.setPrice = function (p, price) { var old = p.price; p.hist.push({ at: CK.now(), price: price }); p.price = price; audit('Changed price', p.code, CK.money(old, true) + ' → ' + CK.money(price, true)); emit('prop'); return old; };
  A.propStatus = function (p, st, leadId) { p.status = st; p.holdFor = leadId || null; p.holdUntil = st === 'hold' ? CK.now() + 48 * 36e5 : null; audit('Listing ' + (st === 'hold' ? 'held 48 h' : st), p.code, leadId || ''); emit('prop'); };
  A.newProp = function (o) {
    S.seq.P++; var a = CK.area(o.area);
    var p = { id: 'P' + S.seq.P, code: a.id + '-' + (500 + S.seq.P), area: a.id, r: a.r, type: o.type, deal: o.deal, bhk: +o.bhk, sqft: +o.sqft, floor: o.floor || 'First', price: +o.price, hist: [{ at: CK.now(), price: +o.price }], addr: o.plot + ', ' + a.name, plot: o.plot, society: '', ownerId: o.ownerId, photos: ['ext-12', 'liv-03', 'bed-02', 'kit-03'], lat: a.lat + .0006, lng: a.lng - .0005, furn: o.furn || 'Semi-furnished', facing: 'Inner lane', parking: '1 covered', backup: 'Inverter points', pref: o.deal === 'rent' ? 'Any' : '', pets: true, availFrom: CK.now() + 10 * DAY, status: 'available', created: CK.now(), src: 'Owner direct', maint: 0, baths: Math.max(1, +o.bhk), balconies: 1, ver: { status: 'pending', at: null, by: null, checks: {}, geo: null, photos: 0, reject: null }, ownerLastReply: CK.now(), views: 0, enquiries: 0 };
    S.props.unshift(p); addTask({ kind: 'verify', title: 'Verify new listing', prop: p.id, due: CK.now() + DAY, who: 'A10' });
    audit('Added listing', p.code, 'Sent to verification desk'); emit('prop'); return p;
  };

  /* deals */
  CK.dealStages = function (d) { return d.kind === 'rent' ? CK.DEAL_STAGES_RENT : CK.DEAL_STAGES_SALE; };
  CK.docsFor = function (kind) {
    return kind === 'rent' ? [['tkyc', 'Tenant KYC — Aadhaar and PAN'], ['okyc', 'Owner KYC and ownership proof'], ['police', 'Police verification of tenant (Delhi Police portal)'], ['draft', 'Rent agreement draft shared'], ['stamp', 'E-stamp paper bought'], ['signed', 'Agreement signed by both'], ['inv', 'Inventory list and meter readings'], ['keys', 'Keys handed over']]
      : [['bkyc', 'Buyer KYC — Aadhaar and PAN'], ['skyc', 'Seller KYC'], ['title', 'Title chain checked (30 years)'], ['noc', 'Society / RWA NOC'], ['tax', 'Property tax receipts'], ['ats', 'Agreement to sell signed'], ['loan', 'Home loan sanction letter'], ['deed', 'Sale deed draft'], ['reg', 'Registry slot at sub-registrar'], ['poss', 'Possession letter']];
  };
  CK.dealFees = function (d) { // brokerage from each side
    var each = d.kind === 'rent' ? d.value : Math.round(d.value * 0.01);
    var total = each * 2; var sp = d.split;
    return { each: each, total: total, agent: Math.round(total * sp.agent / 100), partner: Math.round(total * sp.partner / 100), company: total - Math.round(total * sp.agent / 100) - Math.round(total * sp.partner / 100) };
  };
  A.dealStage = function (d, st) {
    var from = d.stage; d.stage = st; d.hist.push({ at: CK.now(), stage: st });
    var L = CK.lead(d.lead), p = CK.prop(d.pid);
    if (st === 'negotiation' && p.status === 'available') { p.status = 'hold'; p.holdFor = L.id; p.holdUntil = CK.now() + 48 * 36e5; }
    if (st === 'token' || st === 'agreement') { p.status = 'blocked'; p.holdFor = L.id; }
    if (st === 'closed') { p.status = d.kind === 'rent' ? 'let' : 'sold'; d.closedAt = CK.now(); }
    if (st === 'lost') { if (p.holdFor === L.id) { p.status = 'available'; p.holdFor = null; } }
    tl(L, 'deal', 'Deal ' + d.id + ': ' + CK.DEAL_LABEL[from] + ' → ' + CK.DEAL_LABEL[st]); A.bump(L, 'deal');
    audit('Moved deal', d.id, CK.DEAL_LABEL[from] + ' → ' + CK.DEAL_LABEL[st]); emit('deal');
  };
  A.dealGate = function (d, st) { // returns a reason string if blocked
    var stages = CK.dealStages(d), idx = stages.indexOf(st), cur = stages.indexOf(d.stage);
    if (st === 'closed') { var need = d.kind === 'rent' ? ['tkyc', 'okyc', 'police', 'signed'] : ['bkyc', 'skyc', 'title', 'deed']; var miss = need.filter(function (k) { return !d.docs[k]; }); if (miss.length) return 'Before closing: ' + miss.length + ' required document' + (miss.length > 1 ? 's' : '') + ' still open'; return null; }
    if (idx > cur && stages[idx] === 'agreement' && !d.token) return 'Record the token first — the home is blocked only once money changes hands';
    if (idx > cur && (stages[idx] === 'movein' || stages[idx] === 'registry') && !(d.docs.signed || d.docs.ats)) return 'The agreement isn’t signed yet';
    if (idx > cur && stages[idx] === 'token' && !d.visited) return 'Log a site visit for this home first';
    return null;
  };
  A.doc = function (d, k, on) { d.docs[k] = on ? CK.now() : 0; audit(on ? 'Ticked document' : 'Unticked document', d.id, k); emit('deal'); };
  A.token = function (d, amt) { d.token = { amt: amt, at: CK.now() }; d.coll.unshift({ id: 'C' + Date.now(), from: d.kind === 'rent' ? 'Tenant → owner (token)' : 'Buyer → seller (token)', amt: amt, st: 'passed', at: CK.now(), note: 'Held by owner; receipt uploaded' }); tl(CK.lead(d.lead), 'deal', 'Token ' + CK.inr(amt) + ' paid to owner for ' + CK.prop(d.pid).code); audit('Recorded token', d.id, CK.inr(amt)); emit('deal'); };
  A.collect = function (d, c, st) { c.st = st; c.at = CK.now(); audit(st === 'received' ? 'Brokerage received' : 'Brokerage invoiced', d.id, c.from + ' ' + CK.inr(c.amt)); if (d.partner && st === 'received') ledgerFromDeal(d, c); emit('deal'); };
  function ledgerFromDeal(d, c) { var pt = CK.partner(d.partner); if (!pt) return; var share = Math.round(c.amt * d.split.partner / 100); pt.ledger.unshift({ at: CK.now(), deal: d.id, text: 'Share of ' + c.from.split(' ')[0].toLowerCase() + ' brokerage · ' + CK.prop(d.pid).code, amt: share, st: 'due' }); }
  A.split = function (d, agent, partner) { d.split = { agent: agent, partner: partner, company: 100 - agent - partner }; audit('Changed commission split', d.id, agent + ' / ' + partner + ' / ' + (100 - agent - partner)); emit('deal'); };
  A.newDeal = function (L, pid) {
    S.seq.D++; var p = CK.prop(pid);
    var d = { id: 'D-' + S.seq.D, lead: L.id, pid: pid, kind: p.deal === 'rent' ? 'rent' : 'sale', stage: 'shortlist', value: p.price, ask: p.price, agent: L.field, partner: L.partnerId, split: { agent: 20, partner: L.partnerId ? 30 : 0, company: L.partnerId ? 50 : 80 }, docs: {}, coll: [], token: null, hist: [{ at: CK.now(), stage: 'shortlist' }], created: CK.now(), visited: L.tl.some(function (e) { return e.kind === 'visit' && e.pid === pid && e.v !== 'novisit'; }), offers: [] };
    var f = CK.dealFees(d); d.coll = feeRows(d, f);
    S.deals.unshift(d); A.bump(L, 'deal'); tl(L, 'deal', 'Deal opened · ' + d.id + ' for ' + p.code); audit('Opened deal', d.id, p.code); emit('deal'); return d;
  };
  function feeRows(d, f) { var a = d.kind === 'rent' ? ['Tenant', 'Owner'] : ['Buyer', 'Seller']; return [{ id: 'C1' + d.id, from: a[0] + ' brokerage', amt: f.each, st: 'due', at: null }, { id: 'C2' + d.id, from: a[1] + ' brokerage', amt: f.each, st: 'due', at: null }]; }
  CK.feeRows = feeRows;
  A.offer = function (d, amt, by) { d.offers.unshift({ at: CK.now(), amt: amt, by: by }); d.value = amt; var f = CK.dealFees(d); d.coll.forEach(function (c) { if (/brokerage/.test(c.from) && c.st === 'due') c.amt = f.each; }); tl(CK.lead(d.lead), 'deal', (by === 'owner' ? 'Owner countered at ' : 'Client offered ') + CK.money(amt, true)); audit('Logged offer', d.id, CK.inr(amt)); emit('deal'); };

  /* partners */
  A.partnerPay = function (pt, e) { e.st = 'paid'; e.paidAt = CK.now(); audit('Paid partner commission', pt.id, CK.inr(e.amt)); emit('partner'); };
  A.shareLead = function (pt, L) { L.partnerShared = pt.id; pt.shared.unshift({ at: CK.now(), lead: L.id, dir: 'out' }); tl(L, 'system', 'Shared with partner ' + pt.name + ' (they cover ' + CK.area(pt.area).short + ')'); audit('Shared lead with partner', L.id, pt.name); emit('partner'); };

  /* print issue */
  A.issue = function (iss, patch) { for (var k in patch) iss[k] = patch[k]; audit('Edited print issue', iss.id, Object.keys(patch).join(', ')); emit('issue'); };

  /* end of day */
  A.eod = function (o) { o.at = CK.now(); S.eod.unshift(o); audit('Submitted end-of-day report', CK.agent(o.agent).name, o.visits + ' visits · ' + o.verified + ' verified'); emit('eod'); };

  /* ---------- second phase of the seed: history, trips, deals, tasks, queues ---------- */
  function phase2(S) {
    var r = CK.rng(77), today = S.today, now = Math.min(Math.max(Date.now(), today + 11 * 36e5 + 2 * 6e4), today + 18 * 36e5 + 25 * 6e4);
    function at(dayOff, h, m) { return today + dayOff * DAY + (h * 60 + (m || 0)) * 6e4; }
    var pick = CK.pick, int = CK.int;
    S.partners = CK.PARTNERS_SEED.map(function (p) { var o = {}; for (var k in p) o[k] = p[k]; o.ledger = []; o.shared = []; return o; });
    var prevMe = CK.ui.as; CK.ui.as = 'A1';
    var saveNow = CK.now; CK.now = function () { return now; };
    // timelines
    S.leads.forEach(function (L, i) {
      var t0 = L.created;
      L.tl = [{ at: t0, kind: 'created', text: 'Lead created from ' + L.src + (L.partnerId ? ' · referred by ' + CK.partner(L.partnerId).name : '') + ' — “' + L.req.note.split(';')[0] + '”', by: null }];
      L.tl.unshift({ at: t0 + 60e3, kind: 'system', text: 'Auto-assigned to ' + CK.agent(L.owner).name + ' (round-robin)', by: null });
      if (L.stage === 'new') { L.next = null; return; }
      var tt = t0 + int(r, 6, 40) * 6e4;
      L.tl.unshift({ at: tt, kind: 'call', text: 'Call · Connected — ' + pick(r, ['“Send options on WhatsApp”', '“Budget is firm, can stretch a little for parking”', '“Weekends work best for visits”', '“Need it before school reopens”']), by: L.owner, outcome: 'connected' });
      if (L.stage === 'contacted') { L.last = tt; return; }
      tt += int(r, 1, 3) * DAY;
      L.tl.unshift({ at: tt, kind: 'edit', text: 'Requirement captured · ' + L.req.bhk.join('/') + ' BHK · ' + CK.budget(L) + ' · ' + L.req.sectors.map(function (s) { return CK.area(s).short; }).join(', '), by: L.owner });
      var ms = CK.matches(L, 50);
      if (L.stage === 'requirement') { L.last = tt; return; }
      ms.slice(0, int(r, 2, 4)).forEach(function (m) { L.shortlist.push(m.p.id); });
      tt += int(r, 2, 20) * 36e5;
      L.tl.unshift({ at: Math.min(tt, now - 36e5), kind: 'match', text: 'Matched to ' + ms.length + ' homes · shortlisted ' + L.shortlist.length, by: L.owner });
      L.tl.unshift({ at: Math.min(tt + 6e5, now - 30e5), kind: 'wa', text: 'WhatsApp sent — “Sharing ' + L.shortlist.length + ' homes that fit your brief, with photos. Which ones should we see?”', by: L.owner });
      L.last = Math.min(tt + 6e5, now - 30e5);
      L.tl.sort(function (a, b) { return b.at - a.at; });
    });
    // trips
    var visitLeads = S.leads.filter(function (L) { return (L.stage === 'visit' || L.stage === 'deal') && L.shortlist.length; });
    var vi = 0;
    function mkTrip(o) {
      var t = { id: 'TR-' + (++S.seq.T), agent: o.agent, date: CK.dayStart(o.start), start: o.start, r: o.r, kind: o.kind || 'visit', status: o.status, leads: o.leads || [], stops: [], feed: [], by: 'A2', created: o.start - 2 * DAY };
      var R = CK.REGIONS[o.r]; var ordered = CK.orderStops(R.office, o.pids.map(CK.prop));
      t.stops = ordered.map(function (p) { return { pid: p.id, leads: (o.leads || []).filter(function (lid) { return CK.lead(lid).shortlist.indexOf(p.id) >= 0; }), st: 'togo', out: {}, at: null, photos: 0 }; });
      t.stops.forEach(function (s) { if (!s.leads.length && t.kind === 'visit') s.leads = (o.leads || []).slice(0, 1); });
      S.trips.push(t); return t;
    }
    function fillDone(t, n) {
      var sch = CK.schedule(t);
      t.stops.forEach(function (s, i) {
        if (i >= n) return; var e = sch.legs[i].eta; s.at = e; s.geo = int(r, 6, 70); s.photos = t.kind === 'verify' ? int(r, 6, 11) : int(r, 0, 3); s.doneAt = e + 18 * 6e4;
        if (t.kind === 'verify') { s.st = 'done'; s.out = { verify: { v: r() < .85 ? 'verified' : 'notavail' } }; t.feed.unshift({ at: e + 15 * 6e4, text: CK.prop(s.pid).code + ' ' + (s.out.verify.v === 'verified' ? 'verified' : 'not available — let out last week') }); return; }
        s.st = 'done'; s.leads.forEach(function (lid) { var v = pick(r, ['liked', 'short', 'rejected', 'rejected', 'liked']); s.out[lid] = { v: v, reason: v === 'rejected' ? pick(r, CK.REJECT_REASONS) : '' }; var L = CK.lead(lid), p = CK.prop(s.pid); L.tl.unshift({ at: e + 20 * 6e4, kind: 'visit', text: 'Visit · ' + p.code + ' ' + CK.area(p.area).short + ' — ' + ({ liked: 'Liked it', short: 'Shortlisted', rejected: 'Rejected — ' + s.out[lid].reason })[v], by: t.agent, pid: p.id, v: v }); L.last = Math.max(L.last || 0, e + 20 * 6e4); });
        t.feed.unshift({ at: e + 20 * 6e4, text: CK.prop(s.pid).code + ' — ' + Object.keys(s.out).map(function (k) { return { liked: 'liked', short: 'shortlisted', rejected: 'rejected' }[s.out[k].v]; }).join(', ') });
        S.msgs.unshift({ at: e + 25 * 6e4, owner: CK.prop(s.pid).ownerId, pid: s.pid, kind: 'visit', text: ownerMsg(CK.prop(s.pid), s.out), sent: true });
      });
      t.feed.push({ at: sch.legs[0].eta - sch.legs[0].leg * 6e4, text: 'Trip started' }); t.feed.sort(function (a, b) { return b.at - a.at; });
    }
    // past done trips (15)
    for (var d = 14, k = 0; k < 15; k++, d -= (k % 2 ? 1 : 0)) {
      var L1 = visitLeads[vi++ % visitLeads.length], L2 = k % 3 === 0 ? visitLeads[vi++ % visitLeads.length] : null;
      var ls = [L1]; if (L2 && L2.req.r === L1.req.r && L2 !== L1) ls.push(L2);
      var pids = []; ls.forEach(function (L) { L.shortlist.slice(0, 3).forEach(function (p) { if (pids.indexOf(p) < 0) pids.push(p); }); });
      var ag = L1.req.r === 'ggn' ? 'A8' : ['A6', 'A7', 'A9'][k % 3];
      var t = mkTrip({ agent: ag, start: at(-Math.max(1, d), pick(r, [11, 12, 15, 16]), pick(r, [0, 30])), r: L1.req.r, status: 'done', leads: ls.map(function (x) { return x.id; }), pids: pids.slice(0, 5) });
      fillDone(t, t.stops.length); t.endedAt = CK.schedule(t).end;
      ls.forEach(function (L) { L.tl.unshift({ at: t.start - DAY, kind: 'trip', text: 'Site visit planned · ' + t.id + ' · ' + CK.date(t.start, true) + ' with ' + CK.agent(ag).name.split(' ')[0], by: 'A2' }); L.tl.sort(function (a, b) { return b.at - a.at; }); });
    }
    // today: out now (Kabir), verification run out now (Nikhil), planned afternoon (Rohit)
    var sdVisit = visitLeads.filter(function (L) { return L.req.r === 'sd' && L.stage === 'visit'; });
    var Lout = sdVisit[0];
    var mo = CK.matches(Lout, 40).filter(function (m) { return !m.p.story; }).slice(0, 5).map(function (m) { return m.p.id; });
    Lout.shortlist = mo.slice(0, 5);
    var tOut = mkTrip({ agent: 'A6', start: now - 105 * 6e4, r: 'sd', status: 'out', leads: [Lout.id], pids: mo }); tOut.startedAt = tOut.start;
    fillDone(tOut, 2); S.msgs.forEach(function (m) { if (tOut.stops.slice(0, 2).some(function (s) { return s.pid === m.pid; })) m.sent = false; }); tOut.stops[2].st = 'here'; tOut.stops[2].at = now - 9 * 6e4; tOut.stops[2].geo = 24; tOut.stops[2].photos = 2;
    tOut.feed.unshift({ at: now - 9 * 6e4, text: 'Checked in at ' + CK.prop(tOut.stops[2].pid).code + ' · 24 m from pin' });
    tOut.feed.unshift({ at: now - 6 * 6e4, text: '2 photos added at ' + CK.prop(tOut.stops[2].pid).code });
    Lout.tl.unshift({ at: tOut.start - 20 * 36e5, kind: 'trip', text: 'Site visit planned · ' + tOut.id + ' · today ' + CK.time(tOut.start) + ' with Kabir · ' + tOut.stops.length + ' homes', by: 'A2' }); Lout.tl.sort(function (a, b) { return b.at - a.at; });
    S.focusTrip = tOut.id;
    var dueProps = S.props.filter(function (p) { return p.r === 'sd' && p.ver.status === 'verified' && (now - p.ver.at) / DAY > S.settings.rentWindow - 3; }).slice(0, 6);
    var tV = mkTrip({ agent: 'A10', start: now - 150 * 6e4, r: 'sd', status: 'out', kind: 'verify', pids: dueProps.map(function (p) { return p.id; }) }); tV.startedAt = tV.start;
    fillDone(tV, 3); tV.stops.slice(0, 3).forEach(function (s) { var p = CK.prop(s.pid); if (s.out.verify.v === 'verified') { p.ver.at = s.doneAt; p.ver.by = 'A10'; p.ver.photos = s.photos; } else { p.status = p.deal === 'rent' ? 'let' : 'sold'; } });
    var eastL = visitLeads.filter(function (L) { return L.req.r === 'sd' && L !== Lout && L.req.sectors.some(function (s) { return ['G1', 'G2', 'CR', 'PP', 'MN', 'SK', 'LN', 'DC'].indexOf(s) >= 0; }); })[0] || sdVisit[1];
    var mE = CK.matches(eastL, 40).slice(0, 4).map(function (m) { return m.p.id; }); eastL.shortlist = mE.slice();
    var tP = mkTrip({ agent: 'A7', start: Math.max(now + 70 * 6e4, at(0, 16, 0)), r: 'sd', status: 'planned', leads: [eastL.id], pids: mE });
    var ggL = visitLeads.filter(function (L) { return L.req.r === 'ggn'; })[0];
    if (ggL) { var mg = CK.matches(ggL, 35).slice(0, 4).map(function (m) { return m.p.id; }); if (mg.length) { ggL.shortlist = mg.slice(); mkTrip({ agent: 'A8', start: at(1, 11, 30), r: 'ggn', status: 'waiting', leads: [ggL.id], pids: mg }); } }
    // upcoming planned (3) + cancelled (1)
    [[1, 15, 'A9'], [2, 11, 'A6'], [3, 12, 'A7']].forEach(function (x, i) { var L = sdVisit[2 + i] || sdVisit[1]; if (!L) return; var m = L.shortlist.length ? L.shortlist.slice(0, 4) : CK.matches(L, 40).slice(0, 3).map(function (q) { return q.p.id; }); if (!m.length) return; mkTrip({ agent: x[2], start: at(x[0], x[1], 30), r: 'sd', status: 'planned', leads: [L.id], pids: m }); });
    var cx = sdVisit[5] || sdVisit[1]; if (cx && cx.shortlist.length) { var tc = mkTrip({ agent: 'A9', start: at(-2, 12, 0), r: 'sd', status: 'cancelled', leads: [cx.id], pids: cx.shortlist.slice(0, 3) }); tc.cancelReason = 'Client’s flight delayed — moved to the weekend'; }
    var lv = sdVisit[6] || sdVisit[0]; if (lv) { mkTrip({ agent: 'A9', start: at(4, 11, 0), r: 'sd', status: 'planned', leads: [lv.id], pids: (lv.shortlist.length ? lv.shortlist : CK.matches(lv, 40).slice(0, 3).map(function (q) { return q.p.id; })).slice(0, 3) }); }

    // deals: 12 deal-stage leads + 3 visit-stage
    var dealLeads = S.leads.filter(function (L) { return L.stage === 'deal'; }).concat(sdVisit.slice(8, 11));
    var plan = ['closed', 'closed', 'registry', 'movein', 'agreement', 'agreement', 'token', 'token', 'token', 'negotiation', 'negotiation', 'negotiation', 'shortlist', 'shortlist', 'shortlist'];
    var usedP = {}; S.props.forEach(function (p) { if (p.story) usedP[p.id] = 1; });
    dealLeads.slice(0, 15).forEach(function (L, i) {
      var st = plan[i]; var cands = (L.shortlist.length ? L.shortlist.map(CK.prop) : CK.matches(L, 30).map(function (m) { return m.p; })).filter(function (p) { return !usedP[p.id] && p.status === 'available'; });
      if (!cands.length) cands = CK.matches(L, 20).map(function (m) { return m.p; }).filter(function (p) { return !usedP[p.id] && p.status === 'available'; });
      if (!cands.length) cands = S.props.filter(function (p) { return p.r === L.req.r && (p.deal === 'rent') === (L.intent === 'rent') && p.status === 'available' && !usedP[p.id] && p.type !== 'Office'; });
      if (!cands.length) return; var p = cands[0]; usedP[p.id] = 1;
      if (st === 'registry' && p.deal === 'rent') st = 'movein'; if (st === 'movein' && p.deal === 'sale') st = 'registry';
      var kind = p.deal === 'rent' ? 'rent' : 'sale';
      var disc = kind === 'rent' ? CK.int(r, 0, 3) * 2500 : CK.int(r, 0, 4) * 500000;
      var dd = { id: 'D-' + (++S.seq.D), lead: L.id, pid: p.id, kind: kind, stage: st, value: p.price - (st === 'shortlist' ? 0 : disc), ask: p.price, agent: L.field, partner: L.partnerId, split: { agent: 20, partner: L.partnerId ? 30 : 0, company: L.partnerId ? 50 : 80 }, docs: {}, coll: [], token: null, hist: [], created: now - (20 - i) * DAY, visited: true, offers: [] };
      var stages = CK.dealStages(dd), idx = st === 'closed' ? stages.length : stages.indexOf(st);
      for (var s = 0; s <= Math.min(idx, stages.length - 1); s++) dd.hist.push({ at: dd.created + s * 3 * DAY, stage: stages[s] });
      if (st === 'closed') dd.hist.push({ at: now - CK.int(r, 2, 9) * DAY, stage: 'closed' });
      dd.hist.forEach(function (h) { if (h.at > now) h.at = now - 36e5; });
      if (idx >= 1) dd.offers.push({ at: dd.hist[1].at, amt: dd.value, by: 'client' });
      if (idx >= 2) { dd.token = { amt: kind === 'rent' ? Math.round(dd.value / 2 / 1000) * 1000 : 500000, at: dd.hist[2].at }; }
      var docs = CK.docsFor(kind); var nd = Math.min(docs.length, st === 'closed' ? docs.length : Math.max(0, idx * 2 - 1 + CK.int(r, 0, 1)));
      docs.slice(0, nd).forEach(function (x) { dd.docs[x[0]] = now - CK.int(r, 1, 9) * DAY; });
      if (st === 'movein' || st === 'registry') { dd.docs[kind === 'rent' ? 'police' : 'title'] = 0; }
      var f = CK.dealFees(dd); dd.coll = feeRows(dd, f);
      if (dd.token) dd.coll.unshift({ id: 'CT' + dd.id, from: kind === 'rent' ? 'Tenant → owner (token)' : 'Buyer → seller (token)', amt: dd.token.amt, st: 'passed', at: dd.token.at, note: 'Held by owner; receipt uploaded' });
      if (st === 'closed') { dd.coll.forEach(function (c) { if (c.st === 'due') { c.st = 'received'; c.at = now - CK.int(r, 1, 6) * DAY; } }); dd.closedAt = dd.hist[dd.hist.length - 1].at; p.status = kind === 'rent' ? 'let' : 'sold'; }
      else if (idx >= 3) { dd.coll[dd.coll.length - 2].st = 'invoiced'; dd.coll[dd.coll.length - 2].at = now - 2 * DAY; }
      if (st === 'negotiation') { p.status = 'hold'; p.holdFor = L.id; p.holdUntil = now + CK.int(r, 6, 40) * 36e5; dd.offers.push({ at: now - CK.int(r, 3, 20) * 36e5, amt: p.price - disc / 2, by: 'owner' }); }
      if (st === 'token' || st === 'agreement' || st === 'movein' || st === 'registry') { p.status = 'blocked'; p.holdFor = L.id; }
      if (L.stage !== 'deal') L.stage = 'deal';
      L.tl.unshift({ at: dd.created, kind: 'deal', text: 'Deal opened · ' + dd.id + ' for ' + p.code, by: L.field });
      if (dd.token) L.tl.unshift({ at: dd.token.at, kind: 'deal', text: 'Token ' + CK.inr(dd.token.amt) + ' paid to owner for ' + p.code, by: L.field });
      L.tl.sort(function (a, b) { return b.at - a.at; });
      if (st === 'closed' && L.partnerId) { var pt = CK.partner(L.partnerId); dd.coll.forEach(function (c) { if (/brokerage/.test(c.from)) pt.ledger.push({ at: c.at, deal: dd.id, text: 'Share of ' + c.from.split(' ')[0].toLowerCase() + ' brokerage · ' + p.code, amt: Math.round(c.amt * dd.split.partner / 100), st: 'paid', paidAt: c.at + 3 * DAY }); }); }
      S.deals.push(dd);
    });
    S.deals.sort(function (a, b) { return b.created - a.created; });
    // partner extras
    S.partners.forEach(function (pt, i) {
      S.leads.filter(function (L) { return L.partnerId === pt.id; }).forEach(function (L) { pt.shared.push({ at: L.created, lead: L.id, dir: 'in' }); });
      pt.ledger.push({ at: now - (40 + i * 6) * DAY, deal: 'D-29' + (4 + i), text: 'Share of tenant brokerage · ' + ['G1-418', 'SK-377', 'CR-402', 'S54-561'][i], amt: [22500, 18000, 26000, 15000][i], st: 'paid', paidAt: now - (35 + i * 6) * DAY });
      pt.ledger.push({ at: now - (6 + i) * DAY, deal: 'D-31' + i, text: 'Listing referral bonus · ' + ['owner portfolio, GK I', 'two floors in Saket', 'CR Park block B', 'Sector 54 tower'][i], amt: [5000, 3000, 5000, 4000][i], st: i % 2 ? 'paid' : 'due' });
      pt.ledger.sort(function (a, b) { return b.at - a.at; });
      pt.listings = 3 + i * 2;
    });
    // tasks
    var callers = ['A3', 'A4', 'A5'];
    S.leads.forEach(function (L, i) {
      if (L.stage === 'new') { S.tasks.push({ id: 'K' + (++S.seq.K), kind: 'call', title: 'First call — new lead', lead: L.id, due: L.created + 15 * 6e4, who: L.owner, done: false, created: L.created }); return; }
      if (L.stage === 'lost') return;
      if (L.stage === 'deal' && i % 2) return;
      var due = i % 9 === 0 ? now - CK.int(r, 1, 2) * DAY - CK.int(r, 1, 5) * 36e5 : i % 4 === 0 ? Math.min(today + 19 * 36e5, now + CK.int(r, 1, 6) * 30 * 6e4) : at(CK.int(r, 1, 4), CK.int(r, 11, 18), 30);
      var kind = L.stage === 'matched' ? 'followup' : L.stage === 'visit' ? 'followup' : 'call';
      var title = L.stage === 'contacted' ? 'Take the full requirement' : L.stage === 'requirement' ? 'Send matches and book a visit' : L.stage === 'matched' ? 'Follow up on shortlist' : L.stage === 'visit' ? 'Ask for feedback after visit' : 'Chase documents';
      S.tasks.push({ id: 'K' + (++S.seq.K), kind: kind, title: title, lead: L.id, due: due, who: L.owner, done: false, created: due - 2 * DAY });
      L.next = { title: title, due: due };
    });
    S.props.forEach(function (p) { var v = CK.ver(p); if (v === 'pending' || v === 'due' || v === 'overdue') S.tasks.push({ id: 'K' + (++S.seq.K), kind: 'verify', title: v === 'pending' ? 'Verify new listing' : 'Re-verify (' + CK.window(p) + '-day check)', prop: p.id, due: v === 'pending' ? p.created + DAY : p.ver.at + CK.window(p) * DAY, who: v === 'pending' ? 'A10' : (p.r === 'ggn' ? 'A8' : 'A10'), done: false, created: p.created }); });
    S.deals.forEach(function (d) { if (d.stage === 'agreement' || d.stage === 'token') S.tasks.push({ id: 'K' + (++S.seq.K), kind: 'docs', title: d.kind === 'rent' ? 'Police verification + e-stamp' : 'Title check and NOC', deal: d.id, lead: d.lead, due: at(CK.int(r, 0, 2), 17, 0), who: d.agent, done: false, created: now - DAY }); });
    // done tasks history (for reports)
    for (var q = 0; q < 70; q++) S.tasks.push({ id: 'K' + (++S.seq.K), kind: pick(r, ['call', 'call', 'followup', 'visit', 'verify']), title: 'Completed', lead: S.leads[q % S.leads.length].id, due: now - CK.int(r, 1, 20) * DAY, who: pick(r, ['A3', 'A4', 'A5', 'A6', 'A7', 'A9', 'A10']), done: true, doneAt: now - CK.int(r, 1, 20) * DAY, created: now - 22 * DAY });
    // owner comms + requests
    S.owners.forEach(function (o, i) {
      var props = S.props.filter(function (p) { return p.ownerId === o.id; });
      props.slice(0, 3).forEach(function (p, j) { o.comms.push({ at: now - (j * 9 + i % 7 + 2) * DAY, kind: j % 2 ? 'call' : 'wa', text: j % 2 ? 'Call — confirmed ' + p.code + ' still available; open to ' + (p.deal === 'rent' ? '5% less for a family' : 'a quick close') : 'Shared visit feedback on ' + p.code, by: pick(r, ['A2', 'A3', 'A10']) }); });
      props.forEach(function (p) { var v = CK.ver(p); if ((v === 'overdue') && i % 2 === 0) o.requests.push({ at: now - CK.int(r, 1, 6) * DAY, pid: p.id, st: pick(r, ['sent', 'opened']) }); });
      o.comms.sort(function (a, b) { return b.at - a.at; });
    });
    S.msgs.sort(function (a, b) { return b.at - a.at; });
    // Ananya Iyer: WhatsApp at 10:02, called by Pooja at 10:09, brief captured — ready to match (the tour starts here)
    var An = S.leads[0]; An.created = today + (10 * 60 + 2) * 6e4; An.shortlist = [];
    An.tl = [
      { at: today + (10 * 60 + 31) * 6e4, kind: 'wa', text: 'WhatsApp sent — “Thank you Ananya! Sharing verified 3 BHK homes near Vasant Vihar by this evening.”', by: 'A3' },
      { at: today + (10 * 60 + 24) * 6e4, kind: 'edit', text: 'Requirement captured · 3 BHK · ₹1.1 L/mo · Vasant Vihar, Shanti Niketan, Anand Niketan, Safdarjung Encl. · move in ' + CK.date(An.req.moveIn), by: 'A3' },
      { at: today + (10 * 60 + 9) * 6e4, kind: 'call', text: 'Call · Connected — “Two kids, school in Vasant Vihar; light and a park view matter most”', by: 'A3', outcome: 'connected' },
      { at: today + (10 * 60 + 2) * 6e4 + 6e4, kind: 'system', text: 'Auto-assigned to Pooja Nair (round-robin) · first call due by 10:17', by: null },
      { at: today + (10 * 60 + 2) * 6e4, kind: 'created', text: 'Lead created from WhatsApp — click-to-chat on a Vasant Vihar listing', by: null }
    ];
    An.last = An.tl[0].at; An.next = { title: 'Send matches and book a visit', due: Math.min(today + 19 * 36e5, now + 40 * 6e4) };
    S.tasks = S.tasks.filter(function (t) { return t.lead !== An.id; });
    S.tasks.push({ id: 'K' + (++S.seq.K), kind: 'followup', title: 'Send matches and book a visit', lead: An.id, due: An.next.due, who: 'A3', done: false, created: An.created });
    // queues
    S.queues = [
      { id: 'Q1', name: 'New leads — first call', kind: 'auto', rule: 'new', who: ['A3', 'A4', 'A5'], sla: '15 min', desc: 'Every lead that hasn’t had a first call. Oldest first.' },
      { id: 'Q2', name: 'Callbacks due today', kind: 'auto', rule: 'due', who: ['A3', 'A4', 'A5'], desc: 'Follow-ups and retries due by 7 pm.' },
      { id: 'Q3', name: 'Confirm tomorrow’s visits', kind: 'auto', rule: 'confirm', who: ['A4'], desc: 'Clients on a trip tomorrow — confirm time and stops.' },
      { id: 'Q4', name: 'Owner checks — listings going stale', kind: 'auto', rule: 'owners', who: ['A5'], desc: 'Owners whose listing check is due. “Is it still available? Same price?”' },
      { id: 'Q5', name: 'Quiet for 10+ days', kind: 'auto', rule: 'quiet', who: ['A3'], desc: 'Qualified leads nobody has spoken to in 10 days.' },
      { id: 'Q6', name: '3 BHK · South Delhi · ₹1 L+ rent', kind: 'campaign', rule: 'campaign', who: ['A3', 'A4'], desc: 'Campaign list built from a lead filter on 18 Nov. Fixed list.', fixed: S.leads.filter(function (L) { return L.intent === 'rent' && L.req.r === 'sd' && L.req.bhk.indexOf(3) >= 0 && L.req.budget >= 90000 && L.stage !== 'lost'; }).slice(0, 9).map(function (L) { return L.id; }) }
    ];
    // print issues
    var rentals = S.props.filter(function (p) { return p.deal === 'rent' && p.r === 'sd' && p.status === 'available' && p.ver.status === 'verified'; });
    S.issues = [
      { id: 'IS-12', title: 'Amaltas Homes · December 2026', sub: 'South Delhi rentals, verified this month', status: 'draft', pids: rentals.slice(0, 12).map(function (p) { return p.id; }), created: now - 2 * DAY, layout: 'grid' },
      { id: 'IS-11', title: 'Amaltas Homes · November 2026', sub: 'South Delhi rentals and resale', status: 'printed', pids: rentals.slice(4, 16).map(function (p) { return p.id; }), created: now - 26 * DAY, printedAt: now - 24 * DAY, copies: 1500, layout: 'grid' }
    ];
    // eod
    S.eod = [
      { agent: 'A6', at: at(-1, 19, 2), visits: 6, verified: 1, km: 23, notes: 'Two families liked VV-110; owner open to ₹5k less. Gate at SN-137 locked — rebook.', photos: 14 },
      { agent: 'A10', at: at(-1, 18, 41), visits: 0, verified: 7, km: 31, notes: 'Found a To-Let board at E-182 GK I — added as a new listing.', photos: 52 },
      { agent: 'A7', at: at(-1, 18, 55), visits: 4, verified: 2, km: 19, notes: 'CR Park lanes jammed after 5 pm, start earlier tomorrow.', photos: 11 }
    ];
    // audit
    var acts = [['Logged call', 'A3'], ['Logged visit outcome', 'A6'], ['Verified listing', 'A10'], ['Moved deal', 'A2'], ['Planned trip', 'A2'], ['Shortlisted property', 'A4'], ['Notified owner (WhatsApp template)', 'A2'], ['Recorded token', 'A2'], ['Changed price', 'A1'], ['Sent “update your listing” request', 'A5']];
    for (var z = 0; z < 60; z++) { var a = acts[z % acts.length]; var Lz = S.leads[(z * 7) % S.leads.length], Pz = S.props[(z * 5) % S.props.length]; S.audit.push({ at: now - (z * 47 + 12) * 6e4, who: a[1], action: a[0], ref: /listing|price|Verified/.test(a[0]) ? Pz.code : /deal|token/i.test(a[0]) ? (S.deals[z % S.deals.length] || {}).id : /trip|visit/i.test(a[0]) ? S.trips[z % S.trips.length].id : Lz.id, detail: '' }); }
    S.audit.sort(function (a, b) { return b.at - a.at; });
    S.leads.forEach(function (L) { if (L.last && L.last > now) L.last = now - 6e5; L.tl.forEach(function (e) { if (e.at > now) e.at = now - 5 * 6e4; }); });
    CK.now = saveNow; CK.ui.as = prevMe;
  }

  /* ---------- boot ---------- */
  CK.load = function (force) {
    var raw = null; try { raw = localStorage.getItem(KEY); } catch (e) { }
    if (raw && !force) { try { S = JSON.parse(raw); } catch (e) { S = null; } }
    var today = CK.dayStart(Date.now());
    if (!S || S.v !== 5 || S.today !== today) { S = CK.seed(Date.now()); phase2(S); S.fresh = true; save(); }
    CK.TODAY = S.today;
    return S;
  };
  CK.reset = function () { CK.load(true); if (CK.ensure) CK.ensure(); emit('reset'); };
})();
