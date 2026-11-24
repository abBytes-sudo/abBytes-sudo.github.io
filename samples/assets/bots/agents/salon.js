/* Agent: Maison Verve Assistant (fictional hair and beauty salon). Bookings, rebooking, reschedule, cancel, waitlist, packages, FAQ.
   Slots are generated deterministically for 10 days (30 minute grid, Orbit.rng) and real bookings (bot.save 'bookings') remove or free slots. Demo only: nothing leaves the browser,
   no payment is taken, reminders are previews. Seeded client phones are dummy digits. */
(function () {
  'use strict';
  var O = window.Orbit, N = O.nlp, B = function (l, v) { return { label: l, value: v }; };
  var DAY = 864e5, OPEN = 600, CLOSE = 1200, CELL = 30, NC = (CLOSE - OPEN) / CELL;
  var MULT = { junior: 1, senior: 1.25, director: 1.6 }, TIER = { junior: 'junior stylist', senior: 'senior stylist', director: 'creative director' };
  var DOWN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MONN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var CATS = { hair: 'Hair', skin: 'Skin', nails: 'Nails', bridal: 'Bridal', grooming: 'Grooming' };
  var SV = [
    { id: 'cut', n: 'Cut and style', cat: 'hair', d: 45, p: 800, w: 'haircut', b: 'Consultation, wash, cut and a finished blow-dry' },
    { id: 'colour', n: 'Global colour', cat: 'hair', d: 120, p: 3200, w: 'colour', dep: 1, b: 'Full colour or root touch-up with a gloss finish' },
    { id: 'balayage', n: 'Balayage and highlights', cat: 'hair', d: 180, p: 5500, w: 'balayage', dep: 1, b: 'Hand-painted lightness, ombre or soft highlights' },
    { id: 'keratin', n: 'Keratin smoothing', cat: 'hair', d: 150, p: 6500, w: 'keratin', dep: 1, b: 'Frizz-free smoothing that lasts about three months' },
    { id: 'treat', n: 'Deep hair treatment', cat: 'hair', d: 60, p: 1500, w: 'treatment', b: 'Bond repair and a scalp massage' },
    { id: 'facial', n: 'Signature facial', cat: 'skin', d: 60, p: 1800, w: 'facial', b: 'Cleanse, exfoliate, mask and massage' },
    { id: 'cleanup', n: 'Express clean-up', cat: 'skin', d: 40, p: 900, w: 'cleanup', b: 'A quick cleanse, steam and mask' },
    { id: 'brows', n: 'Brow and lip threading', cat: 'skin', d: 20, p: 300, w: 'brows', b: 'Shaping with precise threading' },
    { id: 'mani', n: 'Manicure', cat: 'nails', d: 45, p: 700, w: 'manicure', b: 'Shape, cuticle care and polish' },
    { id: 'pedi', n: 'Pedicure', cat: 'nails', d: 60, p: 900, w: 'pedicure', b: 'Soak, scrub, massage and polish' },
    { id: 'trial', n: 'Bridal trial', cat: 'bridal', d: 120, p: 6000, w: 'trial', dep: 1, b: 'Hair and makeup trial for your wedding look' },
    { id: 'bridal', n: 'Bridal makeup', cat: 'bridal', d: 150, p: 12000, w: 'bridal', dep: 1, b: 'Full wedding-day makeup and finishing' },
    { id: 'beard', n: 'Beard trim', cat: 'grooming', d: 20, p: 400, w: 'beard', b: 'Shaping and line-up with a hot towel' },
    { id: 'shave', n: 'Classic shave', cat: 'grooming', d: 30, p: 500, w: 'shave', b: 'Straight-razor shave with a hot towel' }
  ];
  var ST = [
    { id: 'anika', n: 'Anika Rao', ini: 'AR', tier: 'senior', role: 'Colour specialist', bio: 'Nine years of balayage and soft blondes', days: [0, 2, 3, 4, 5, 6], svcs: ['cut', 'colour', 'balayage', 'keratin', 'treat'] },
    { id: 'kabir', n: 'Kabir Mehta', ini: 'KM', tier: 'director', role: 'Cut and colour lead', bio: 'Precision cuts, bold colour and smoothing', days: [0, 3, 4, 5, 6], svcs: ['cut', 'colour', 'balayage', 'keratin', 'treat'] },
    { id: 'tara', n: 'Tara Bose', ini: 'TB', tier: 'junior', role: 'Hair stylist', bio: 'Clean cuts, blow-dries and treatments', days: [1, 2, 4, 5, 6], svcs: ['cut', 'colour', 'treat'] },
    { id: 'meera', n: 'Meera Iyer', ini: 'MI', tier: 'senior', role: 'Skin and nails', bio: 'Facials, clean-ups, brows and nail care', days: [1, 2, 3, 4, 5, 6], svcs: ['facial', 'cleanup', 'brows', 'mani', 'pedi'] },
    { id: 'rhea', n: 'Rhea Menon', ini: 'RM', tier: 'senior', role: 'Bridal artist', bio: 'Wedding makeup, trials and bridal skin prep', days: [0, 3, 4, 5, 6], svcs: ['trial', 'bridal', 'facial', 'brows', 'mani'] },
    { id: 'imran', n: 'Imran Siddiqui', ini: 'IS', tier: 'junior', role: 'Barber', bio: 'Men’s cuts, beards and hot-towel shaves', days: [0, 1, 2, 3, 5, 6], svcs: ['cut', 'beard', 'shave'] }
  ];
  var PK = [
    { id: 'bridal', n: 'Bridal Week', items: ['trial', 'bridal', 'facial', 'mani', 'pedi'], price: 22900, b: 'Trial look, wedding-day makeup, plus a facial, manicure and pedicure before the big day' },
    { id: 'glow', n: 'Monthly Glow', items: ['facial', 'cleanup', 'brows', 'facial'], price: 4900, b: 'Two facials, a clean-up and brow threading across one month' },
    { id: 'combo', n: 'Colour + Cut Combo', items: ['colour', 'cut', 'treat'], price: 5900, b: 'Global colour, a fresh cut and a conditioning treatment in one visit' }
  ];
  var CL = [
    { id: 'priya', n: 'Priya Nair', ph: '0000048210', svcs: ['balayage'], st: 'anika', ago: 21 }, { id: 'rohan', n: 'Rohan Mehta', ph: '0000051774', svcs: ['cut', 'beard'], st: 'imran', ago: 27 },
    { id: 'ananya', n: 'Ananya Shah', ph: '0000063317', svcs: ['facial'], st: 'meera', ago: 14 }, { id: 'isha', n: 'Isha Kapoor', ph: '0000072905', svcs: ['colour', 'cut'], st: 'kabir', ago: 44 },
    { id: 'neel', n: 'Neel Bose', ph: '0000085562', svcs: ['cut'], st: 'tara', ago: 35 }, { id: 'sana', n: 'Sana Khan', ph: '0000096038', svcs: ['trial'], st: 'rhea', ago: 56 }
  ];
  var FULL = { kabir: [1, 4, 7], anika: [3] }; // days from today when these stylists have no room (keeps the waitlist demo reliable)
  var SB = {}, TB = {}, PB = {}; SV.forEach(function (s) { SB[s.id] = s; }); ST.forEach(function (s) { TB[s.id] = s; }); PK.forEach(function (s) { PB[s.id] = s; });

  /* ---------- small helpers ---------- */
  function m$(n) { return O.money(n, '₹'); }
  function r50(n) { return Math.round(n / 50) * 50; }
  function priceOf(id, tier) { return r50(SB[id].p * MULT[tier]); }
  function sumP(ids, tier) { return ids.reduce(function (a, i) { return a + priceOf(i, tier); }, 0); }
  function sumD(ids) { return ids.reduce(function (a, i) { return a + SB[i].d; }, 0); }
  function dur(m) { var h = Math.floor(m / 60), r = m % 60; return (h ? h + (h === 1 ? ' hour' : ' hours') : '') + (h && r ? ' ' : '') + (r ? r + ' minutes' : ''); }
  function lst(a) { var h = a.some(function (x) { return / and /.test(x); }); return a.length < 2 ? a.join('') : a.length === 2 ? a.join(h ? ' plus ' : ' and ') : a.slice(0, -1).join(', ') + (h ? ', and ' : ' and ') + a[a.length - 1]; }
  function svl(ids) { return lst(ids.map(function (i) { return SB[i].n.toLowerCase(); })); }
  function fn(id) { return TB[id].n.split(' ')[0]; }
  function tm(h) { var p = String(h).split(':'); return +p[0] * 60 + +p[1]; }
  function hm(m) { return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + m % 60).slice(-2); }
  function tl(m) { return O.fmtTime(hm(m)); }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function isoOf(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function fromIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function dayIdx(s) { return Math.round((fromIso(s) - today()) / DAY); }
  function isoPlus(i) { var d = today(); d.setDate(d.getDate() + i); return isoOf(d); }
  function dtxt(s) { var i = dayIdx(s), d = fromIso(s); return i === 0 ? 'today' : i === 1 ? 'tomorrow' : DOWN[d.getDay()] + ' ' + d.getDate() + ' ' + MONN[d.getMonth()]; }
  function onD(s) { var i = dayIdx(s); return (i === 0 || i === 1 ? '' : 'on ') + dtxt(s); }
  function fd(s) { return O.fmtDay(fromIso(s)); }
  function ts(b) { return fromIso(b.date).getTime() + b.start * 6e4; }
  function ago(iso) { var n = Math.round((today() - fromIso(iso)) / DAY); if (n < 0) return 'coming up ' + onD(iso); if (n === 0) return 'today'; if (n < 7) return n + (n === 1 ? ' day ago' : ' days ago'); var w = Math.round(n / 7); return w + (w === 1 ? ' week ago' : ' weeks ago'); }
  function hash(s) { var h = 17; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  function ampm(h) { return h >= 10 && h <= 12 ? h : h <= 9 ? h + 12 : h; }

  /* ---------- data and availability ---------- */
  function seedBookings(used) {
    var out = [], plan = [{ ref: 'MV-4402', c: 'ananya', off: 3, m: 900 }, { ref: 'MV-4417', c: 'rohan', off: 5, m: 1020 }];
    plan.forEach(function (p) {
      var c = CL.filter(function (x) { return x.id === p.c; })[0], s = TB[c.st], off = p.off;
      for (var k = 0; k < 8; k++) { var d = today(); d.setDate(d.getDate() + off + k); if (s.days.indexOf(d.getDay()) >= 0) { off += k; break; } }
      out.push({ ref: p.ref, services: c.svcs.slice(), stylists: [c.st], guests: 1, date: isoPlus(off), start: p.m, dur: sumD(c.svcs), price: sumP(c.svcs, s.tier), name: c.n, phone: c.ph, status: 'confirmed', at: Date.now() - 3 * DAY, seed: true });
    });
    return out;
  }
  function BK(bot) { var a = bot.db('bookings'), t = isoOf(today()); if (!a.some(function (b) { return b.seed && b.date >= t; })) { a = a.filter(function (b) { return !b.seed; }).concat(seedBookings()); bot.save('bookings', a); } return a; }
  var busyCache = {};
  function randBusy(st, iso) { // deterministic "already booked" pattern per stylist and date
    var k = st.id + '|' + iso; if (busyCache[k]) return busyCache[k];
    var r = O.rng(hash(k)), wk = [0, 6].indexOf(fromIso(iso).getDay()) >= 0, p = (wk ? .17 : .1) * (st.id === 'kabir' ? 1.6 : st.tier === 'junior' ? .8 : 1), c = [], i = 0, n;
    for (; i < NC; i++) c.push(false);
    if ((FULL[st.id] || []).indexOf(dayIdx(iso)) >= 0) c = c.map(function () { return true; });
    else for (i = 0; i < NC;) { if (r() < p * (i >= 4 && i < 14 ? .75 : 1) + (i >= 14 ? .06 : 0)) { n = 1 + Math.floor(r() * 4); while (n-- > 0 && i < NC) c[i++] = true; } else i++; }
    return (busyCache[k] = c);
  }
  function storedBusy(sid, iso, ex, bk) {
    var c = []; for (var i = 0; i < NC; i++) c.push(false);
    bk.forEach(function (b) { if (b.status === 'confirmed' && b.date === iso && b.ref !== ex && b.stylists.indexOf(sid) >= 0) for (var j = Math.floor((b.start - OPEN) / CELL), e = j + Math.ceil(b.dur / CELL); j < e; j++) if (j >= 0 && j < NC) c[j] = true; });
    return c;
  }
  function elig(svcs, sid, iso) { return ST.filter(function (s) { return (!sid || sid === 'any' || s.id === sid) && svcs.every(function (v) { return s.svcs.indexOf(v) >= 0; }) && (!iso || s.days.indexOf(fromIso(iso).getDay()) >= 0); }); }
  function freeStarts(bot, o) { // [{m, sts}] start minutes where guests-many eligible stylists are free for the whole duration
    var n = Math.ceil(sumD(o.svcs) / CELL), g = o.guests || 1, out = [], di = dayIdx(o.iso), min = 0, cells = {}, bk = BK(bot), el, c;
    if (di < 0 || di > 9 || !o.svcs.length) return out; if (di === 0) { var nw = new Date(); min = nw.getHours() * 60 + nw.getMinutes() + 60; }
    el = elig(o.svcs, o.stylist, o.iso); el.forEach(function (s) { var a = randBusy(s, o.iso), b = storedBusy(s.id, o.iso, o.ex, bk); cells[s.id] = a.map(function (x, i) { return x || b[i]; }); });
    for (c = 0; c + n <= NC; c++) { if (OPEN + c * CELL < min) continue; var fr = el.filter(function (s) { for (var i = c; i < c + n; i++) if (cells[s.id][i]) return false; return true; }); if (fr.length >= g) out.push({ m: OPEN + c * CELL, sts: fr.map(function (s) { return s.id; }) }); }
    return out;
  }
  function opts(bot, s) { s = s || bot.slots; return { svcs: s.services || [], stylist: (s.guests > 1 ? 'any' : s.stylist) || 'any', iso: s.day, guests: s.guests || 1, ex: s.ex }; }
  function assign(o, hit) { var g = o.guests || 1; return (o.stylist && o.stylist !== 'any' ? [o.stylist] : hit.sts.slice().sort(function (a, b) { return MULT[TB[a].tier] - MULT[TB[b].tier]; })).slice(0, g); }
  function total(svcs, sts) { return sts.reduce(function (a, id) { return a + sumP(svcs, TB[id].tier); }, 0); }
  function deposit(svcs, tot) { return tot > 5000 && svcs.some(function (i) { return SB[i].dep; }) ? r50(tot * .2) : 0; }
  function hitFor(bot, s) { var m = s.time ? tm(s.time) : -1; return freeStarts(bot, opts(bot, s)).filter(function (x) { return x.m === m; })[0]; }
  function nextBest(bot, o, want) { // up to 3 nearest openings, starting from o.iso
    var out = [], i0 = Math.max(0, dayIdx(o.iso || isoPlus(0))), i, iso, st;
    for (i = i0; i < 10 && out.length < 3; i++) { iso = isoPlus(i); st = freeStarts(bot, { svcs: o.svcs, stylist: o.stylist, iso: iso, guests: o.guests, ex: o.ex }); if (!st.length) continue; if (want != null) st.sort(function (a, b) { return Math.abs(a.m - want) - Math.abs(b.m - want); }); st.slice(0, i === i0 ? 2 : 1).forEach(function (x) { out.push({ iso: iso, m: x.m }); }); }
    return out.slice(0, 3);
  }
  function earliest(bot, svcs, sid, guests) { for (var i = 0; i < 10; i++) { var st = freeStarts(bot, { svcs: svcs, stylist: sid, iso: isoPlus(i), guests: guests || 1 }); if (st.length) return { iso: isoPlus(i), m: st[0].m, sts: st[0].sts }; } return null; }
  function newRef(a) { var n = 5000 + a.length * 17 + (Date.now() % 7); while (a.some(function (b) { return b.ref === 'MV-' + n; })) n++; return 'MV-' + n; }

  /* ---------- clients, bookings lookup ---------- */
  function dw(t) { var D = { zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 }; return String(t).replace(/\b(zero|oh|one|two|three|four|five|six|seven|eight|nine)\b/gi, function (w) { return D[w.toLowerCase()]; }).replace(/(\d) (?=\d)/g, '$1'); }
  function whoTok(t) { t = /\b(zero|one|two|three|four|five|six|seven|eight|nine)\b.*\b(zero|one|two|three|four|five|six|seven|eight|nine)\b/i.test(t) ? dw(t) : t; var m = String(t).match(/\bMV[- ]?(\d{4,5})\b/i); if (m) return 'ref:MV-' + m[1]; var p = N.phone(t); if (p) return 'ph:' + p.replace(/\D/g, ''); m = String(t).match(/\b(\d{4})\b/); return m ? 'ph:' + m[1] : undefined; }
  function digitsOf(bot, tok) { if (tok.slice(0, 4) === 'ref:') { var b = BK(bot).filter(function (x) { return x.ref === tok.slice(4); })[0]; return b ? b.phone : null; } return tok.slice(3); }
  function client(bot, tok) { // seeded client or a visitor who booked here; returns {name, phone, svcs, st, date}
    var v = tok.slice(0, 3) === 'nm:' ? tok.slice(3).toLowerCase() : null, d = v ? null : digitsOf(bot, tok), c = null;
    CL.forEach(function (x) { if (!c && (v ? (x.n.toLowerCase() === v || x.n.toLowerCase().split(' ')[0] === v) : d && x.ph.slice(-d.length) === d)) c = { name: x.n, phone: x.ph, svcs: x.svcs, st: x.st, date: isoPlus(-x.ago) }; });
    if (c) return c;
    var l = BK(bot).filter(function (b) { return b.status === 'confirmed' && (v ? b.name.toLowerCase().split(' ')[0] === v : d && b.phone && b.phone.slice(-d.length) === d); }).sort(function (a, b) { return b.at - a.at; })[0];
    return l ? { name: l.name, phone: l.phone, svcs: l.services, st: l.stylists[0], date: l.date, guests: l.guests } : null;
  }
  function mine(bot, tok) {
    var d = digitsOf(bot, tok), isRef = tok.slice(0, 4) === 'ref:', now = Date.now();
    return BK(bot).filter(function (b) { return b.status === 'confirmed' && ts(b) > now && (isRef ? b.ref === tok.slice(4) : d && b.phone && b.phone.slice(-d.length) === d); }).sort(function (a, b) { return ts(a) - ts(b); });
  }
  function find(bot, ref) { return BK(bot).filter(function (b) { return b.ref === ref; })[0]; }

  /* ---------- cards and shared outputs ---------- */
  function svcCard(id) {
    var s = SB[id], tiers = {}; elig([id]).forEach(function (x) { tiers[x.tier] = 1; });
    return { title: s.n, sub: dur(s.d) + '. ' + s.b, price: 'from ' + m$(priceOf(id, Object.keys(tiers).sort(function (a, b) { return MULT[a] - MULT[b]; })[0])), meta: ['junior', 'senior', 'director'].filter(function (t) { return tiers[t]; }).map(function (t) { return TIER[t].replace(/^./, function (c) { return c.toUpperCase(); }) + ' ' + m$(priceOf(id, t)); }), buttons: [B('Book this', 'act:booksvc:' + id)] };
  }
  function stCard(s) { return { title: s.n, sub: s.role + ', ' + TIER[s.tier] + '. ' + s.bio, badge: s.ini, meta: ['Works ' + s.days.slice().sort().map(function (d) { return DOWN[d].slice(0, 3); }).join(', '), 'Does ' + svl(s.svcs)], buttons: [B('Book with ' + fn(s.id), 'act:bookst:' + s.id)] }; }
  function pkgCalc(p) { var a = p.items.reduce(function (x, i) { return x + priceOf(i, 'senior'); }, 0); return { alc: a, save: a - p.price, pct: Math.round((a - p.price) / a * 100) }; }
  function pkgCard(p) { var c = pkgCalc(p); return { title: p.n, sub: p.b, price: m$(p.price), badge: 'Save ' + m$(c.save), meta: [p.items.map(function (i) { return SB[i].n; }).join(', '), 'Separately ' + m$(c.alc) + ' at senior-stylist prices', 'You save ' + m$(c.save) + ', about ' + c.pct + ' percent'], buttons: [B('I’m interested', 'act:pkg:' + p.id), B('Line by line', 'act:pkgcmp:' + p.id)] }; }
  function apptCard(b) { return { title: svl(b.services).replace(/^./, function (c) { return c.toUpperCase(); }), sub: dtxt(b.date) + ' at ' + tl(b.start) + ' with ' + lst(b.stylists.map(fn)), meta: [b.ref, dur(b.dur), 'Total ' + m$(b.price)], buttons: [B('Reschedule', 'act:mv:' + b.ref), B('Cancel', 'act:cx:' + b.ref)] }; }
  function reminderCard(r) {
    var f = r.name.split(' ')[0], w = tl(r.start), what = svl(r.services).replace(/^./, function (c) { return c.toUpperCase(); }), who = lst(r.stylists.map(fn));
    return { title: 'Reminder preview', sub: 'Simulated texts. Nothing is sent in this demo.', meta: ['24 hours before: “Hi ' + f + ', a reminder from Maison Verve. ' + what + ' with ' + who + ' is tomorrow at ' + w + '. Reply to move or cancel.”', '2 hours before: “Hi ' + f + ', see you at ' + w + ' today. Free parking is behind the building. Please arrive five minutes early.”'] };
  }
  function finish(bot, r, head) {
    var dep = deposit(r.services, r.price), cards = [{ title: r.ref, sub: svl(r.services) + ' with ' + lst(r.stylists.map(fn)), badge: 'Confirmed', meta: [dtxt(r.date) + ' at ' + tl(r.start), dur(r.dur) + (r.guests > 1 ? ', for ' + r.guests + ' people' : ''), 'Total ' + m$(r.price) + ', paid at the salon'].concat(dep ? ['Deposit note: ' + m$(dep) + ' (20 percent), simulated'] : [])}];
    if (bot.channel !== 'phone') cards.push(reminderCard(r));
    bot.say((head || 'You are booked') + ', ' + r.name.split(' ')[0] + '. Your reference is **' + r.ref + '**: ' + svl(r.services) + (r.guests > 1 ? ' for ' + r.guests + ' people' : '') + ' with ' + lst(r.stylists.map(fn)) + ' ' + onD(r.date) + ' at ' + tl(r.start) + '. The total is ' + m$(r.price) + ', paid at the salon.' + (bot.channel === 'phone' ? ' You will get a text reminder 24 hours and 2 hours before.' : ''), { cards: cards });
    if (dep) bot.say('Because this is a colour or bridal booking over ₹5,000, we would ask for a refundable deposit of ' + m$(dep) + ' to hold it. In this demo no payment is taken, a person would send you a secure link.');
    if (bot.mem.rest && bot.mem.rest.length) bot.say('You also wanted ' + svl(bot.mem.rest) + '. Shall I book that now?', { buttons: [B('Yes, book it', 'act:bookrest'), B('Not now', 'act:norest')] });
    else bot.say('Anything else?', { buttons: [B('Book another', 'flow:book'), B('Packages', 'intent:packages'), B('That’s all', 'say:bye')] });
  }
  function create(bot, p) {
    var a = BK(bot), tot = total(p.svcs, p.sts), r = { ref: newRef(a), services: p.svcs.slice(), stylists: p.sts, guests: p.sts.length, date: p.iso, start: p.m, dur: sumD(p.svcs), price: tot, name: p.name, phone: p.phone, status: 'confirmed', at: Date.now() };
    a.push(r); bot.save('bookings', a); bot.user.name = p.name; bot.user.phone = p.phone; bot.mem.phone4 = String(p.phone).slice(-4); bot.mem.lastRef = r.ref;
    bot.lead({ name: p.name, phone: p.phone, intent: 'book', payload: { ref: r.ref, services: p.svcs.map(function (i) { return SB[i].n; }), stylists: p.sts.map(function (i) { return TB[i].n; }), date: p.iso, time: hm(p.m), guests: r.guests, total: tot, deposit: deposit(p.svcs, tot) } });
    bot.event('booking', { kind: 'appointment' }); return r;
  }

  /* ---------- parsing ---------- */
  function svcFrom(text, bot) { var nt = N.norm(text, bot.agent.synonyms), f = []; SV.forEach(function (s) { var m = nt.match(new RegExp('(^| )' + s.w + '( |$)')); if (m) f.push({ id: s.id, i: m.index }); }); f.sort(function (a, b) { return a.i - b.i; }); return f.length ? f.map(function (x) { return x.id; }) : undefined; }
  function styFrom(text, bot) {
    var nt = N.norm(text, bot.agent.synonyms), m = nt.match(/\b(anika|kabir|tara|meera|rhea|imran)\b/); if (m) return m[1];
    if (/creative director|the director/.test(nt)) return 'kabir'; if (/\b(any stylist|any ?one|any of you|whoever|no preference|don'?t mind|doesn'?t matter|first available|cheapest|lowest price)\b/.test(nt) || /^(any|either|you choose|up to you|anyone is fine|any is fine)$/.test(nt)) return 'any'; return undefined;
  }
  function timeFrom(t) {
    var w = N.when(t), s = String(t).toLowerCase(), m, W = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
    if (w && w.time) return w.time; if (w && w.timeAmbiguous) return hm(ampm(w.timeAmbiguous) * 60);
    if ((m = s.match(/^\s*(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(?:o'?clock)?\s*$/)) && +m[1] <= 23) return hm((+m[1] < 13 ? ampm(+m[1]) : +m[1]) * 60 + +(m[2] || 0));
    if ((m = s.match(/^\s*(?:at\s*)?(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?:\s*(thirty))?\s*(?:(am|pm)|o'?clock)?\s*$/))) { var h = m[3] ? W[m[1]] % 12 + (m[3] === 'pm' ? 12 : 0) : ampm(W[m[1]]); return hm(h * 60 + (m[2] ? 30 : 0)); }
    return undefined;
  }

  /* ---------- availability gates shared by book, move and waitlist ---------- */
  function prep(bot) {
    var s = bot.slots, sv = s.services; if (!sv || !sv.length) return true;
    if (s.guests > 6) { bot.say('That is a big group, so a person will plan it with you to make sure we have enough stylists.'); bot.handover('Group booking of ' + s.guests); return false; }
    if (!elig(sv).length) {
      var best = null, bc = 0; ST.forEach(function (x) { var c = sv.filter(function (v) { return x.svcs.indexOf(v) >= 0; }).length; if (c > bc) { bc = c; best = x; } });
      var first = sv.filter(function (v) { return best.svcs.indexOf(v) >= 0; }), rest = sv.filter(function (v) { return first.indexOf(v) < 0; }); s.services = first; bot.mem.rest = rest;
      bot.say('No single stylist does all of those, so I will book two back-to-back visits. First ' + svl(first) + ', then I will set up ' + svl(rest) + ' right after.');
    }
    if (s.stylist && s.stylist !== 'any' && s.guests > 1) s.stylist = 'any';
    if (s.stylist && s.stylist !== 'any' && !elig(s.services, s.stylist).length) {
      bot.say(fn(s.stylist) + ' does not do ' + svl(s.services) + '. ' + lst(elig(s.services).map(function (x) { return fn(x.id); })) + ' can.'); delete s.stylist; bot._advance(); return false;
    }
    return true;
  }
  function gate(bot) { // services, stylist and day usable and with some room
    if (!prep(bot)) return false; var s = bot.slots; if (!s.day) return true; var i = dayIdx(s.day), o = opts(bot), why;
    if (i < 0 || i > 9) { bot.say(i < 0 ? 'That date has already passed.' : 'I can book up to ten days ahead, until ' + dtxt(isoPlus(9)) + '.'); delete s.day; delete s.time; delete s.ok; bot._advance(); return false; }
    if (freeStarts(bot, o).length) return true;
    why = o.stylist !== 'any' && TB[o.stylist].days.indexOf(fromIso(s.day).getDay()) < 0 ? fn(o.stylist) + ' does not work ' + DOWN[fromIso(s.day).getDay()] + 's' : (o.stylist !== 'any' ? fn(o.stylist) + ' is fully booked ' + onD(s.day) : 'There is no room left ' + onD(s.day));
    offer(bot, why + ' for ' + svl(o.svcs) + '.', o, null, 'day'); return false;
  }
  function offer(bot, head, o, want, back) { // not available: next best openings, waitlist, other ways out
    var s = bot.slots, near = nextBest(bot, o, want), b = near.map(function (x) { return B((x.iso === o.iso ? '' : fd(x.iso) + ', ') + tl(x.m), 'act:pickat:' + x.iso + '|' + hm(x.m)); });
    b.push(B(want != null ? 'Join waitlist for ' + tl(want) : 'Join the waitlist', 'act:wait:' + (want != null ? hm(want) : 'any')));
    if (o.stylist !== 'any' && elig(o.svcs).length > 1) b.push(B('Any stylist', 'act:anysty')); b.push(B('Try another day', 'act:chg:day'));
    delete s.time; delete s.ok; if (s.want) delete s.want.time; if (back === 'day') { s.reqDay = s.day; delete s.day; } bot.pending = back === 'day' ? SL.day : SL.time;
    bot.say(head + (near.length ? ' The closest openings are ' + lst(near.map(function (x) { return (x.iso === o.iso ? '' : onD(x.iso) + ' at ') + tl(x.m); })) + '.' : ' I do not see an opening in the next ten days.') + ' I can also add you to the waitlist.', { buttons: b });
  }
  function nameSlot() { return { name: 'name', ask: function (bot, s) { if (bot.user.name) { s.name = bot.user.name; bot._advance(); return; } bot.say('Almost there. What name should I put it under?'); }, hint: 'Just your first name, or first and last.', parse: function (t, bot) { if (t.length > 40 || /\d/.test(t) || /^(what|how|do|does|can|is|are|where|when|why|will|could|should|which)\b/i.test(t.trim()) || O.kb.match(bot.agent.id, t, bot.agent.synonyms)) return undefined; return N.name(t); } }; }
  function phoneSlot() { return { name: 'phone', ask: function (bot, s) { if (bot.user.phone) { s.phone = bot.user.phone; bot._advance(); return; } bot.say('And a mobile number for your reminders?'); }, hint: 'Please type a 10 digit mobile number.', parse: function (t) { return N.phone(dw(t)); } }; }
  var SL = {};
  SL.day = { name: 'day', ask: function (bot, s) {
    if (!prep(bot)) return; var o = opts(bot), days = [], i, b;
    for (i = 0; i < 10; i++) if (freeStarts(bot, { svcs: o.svcs, stylist: o.stylist, iso: isoPlus(i), guests: o.guests, ex: o.ex }).length) days.push(isoPlus(i));
    if (!days.length) { offer(bot, 'There is nothing open in the next ten days for ' + svl(o.svcs) + '.', { svcs: o.svcs, stylist: o.stylist, guests: o.guests, ex: o.ex, iso: isoPlus(0) }, null, 'day'); return; }
    b = days.slice(0, 5).map(function (d) { return B(fd(d), 'slot:day=' + d); }); b.push(B('Earliest available', 'act:earliest'));
    bot.say('Which day suits you? These days have room for ' + dur(sumD(o.svcs)) + '.', { buttons: b });
  }, parse: function (t) { var w = N.when(t); return w && w.iso ? w.iso : undefined; }, validate: function (v) { var i = dayIdx(v); return i < 0 ? 'That date has already passed. Which day would you like?' : i > 9 ? 'I can book up to ten days ahead, until ' + dtxt(isoPlus(9)) + '. Which day works?' : null; }, hint: 'Tell me a day, like “Saturday” or “tomorrow”.' };
  SL.time = { name: 'time', ask: function (bot, s) {
    if (!gate(bot)) return; var o = opts(bot), w = s.want || {}, st = freeStarts(bot, o), list = st, note = '', p = w.part, pick = [], k;
    if (w.time) { s.time = w.time; delete w.time; bot._advance(); return; }
    if (p) { list = st.filter(function (x) { return p === 'morning' ? x.m < 720 : p === 'afternoon' ? x.m >= 720 && x.m < 1020 : x.m >= 1020; }); if (!list.length) { note = 'Nothing is free in the ' + p + ' ' + onD(s.day) + ', so here is the rest of the day. '; list = st; } }
    k = Math.max(1, Math.ceil(list.length / 6)); list.forEach(function (x, i) { if (i % k === 0 && pick.length < 6) pick.push(x); });
    var pr = o.stylist === 'any' ? list.map(function (x) { return total(o.svcs, assign(o, x)); }) : [total(o.svcs, [o.stylist])];
    bot.say(note + 'Here are free start times ' + onD(s.day) + ' for ' + svl(o.svcs) + ', about ' + dur(sumD(o.svcs)) + ' with ' + (o.stylist === 'any' ? 'the first free stylist' : fn(o.stylist)) + ', from ' + m$(Math.min.apply(null, pr)) + (bot.channel === 'phone' ? '. Choose a number, or say a time.' : '. Tap one, or type a time.'), { buttons: pick.map(function (x) { return B(tl(x.m), 'slot:time=' + hm(x.m)); }).concat([B('Another day', 'act:chg:day')]) });
  }, parse: function (t) { return timeFrom(t); }, hint: 'Choose a time, or say one like “5pm” or “17:30”.' };
  SL.ok = { name: 'ok', ask: function (bot, s) {
    if (!gate(bot)) return; if (hitFor(bot, s)) { s.ok = 'y'; bot._advance(); return; }
    var o = opts(bot), m = tm(s.time); offer(bot, tl(m) + ' ' + onD(s.day) + ' is not free for ' + svl(o.svcs) + (o.stylist !== 'any' ? ' with ' + fn(o.stylist) : '') + '.', o, m, 'time');
  } };
  function whoSlot(fid) { return { name: 'who', ask: function (bot, s) {
    if (bot.mem.phone4 && mine(bot, 'ph:' + bot.mem.phone4).length) { s.who = 'ph:' + bot.mem.phone4; bot._advance(); return; }
    bot.say('Sure. What is your booking reference, like MV-4402, or the last four digits of the phone number you booked with?');
  }, parse: function (t) { return whoTok(t); }, hint: 'A reference looks like MV-4402. Or send the last four digits of your phone number.' }; }
  function pickSlot(fid) { return { name: 'pick', ask: function (bot, s) {
    var l = mine(bot, s.who); if (!l.length) { bot.say('I could not find an upcoming appointment for that. Check the reference or the last four digits and try again.', { buttons: [B('Try again', 'flow:' + fid), B('Book a visit', 'flow:book'), B('Talk to a person', 'handover')] }); bot.endFlow(); return; }
    if (l.length === 1) { s.pick = l[0].ref; bot._advance(); return; }
    bot.say('I can see ' + l.length + ' upcoming appointments. Which one?', { buttons: l.slice(0, 5).map(function (b) { return B(b.ref + ', ' + dtxt(b.date) + ' ' + tl(b.start), 'slot:pick=' + b.ref); }) });
  }, parse: function (t) { var m = String(t).match(/\bMV[- ]?(\d{4,5})\b/i); return m ? 'MV-' + m[1] : undefined; } }; }
  function summary(bot, s, hit) {
    var o = opts(bot, s), sts = assign(o, hit), tot = total(s.services, sts), dep = deposit(s.services, tot), old = s.ex && find(bot, s.ex);
    bot.say((old ? 'Here is the change. Please check it.' : 'Here is your booking. Please check it.'), { cards: [{ title: (old ? 'Move ' + old.ref : 'Appointment summary'), sub: svl(s.services) + ' with ' + lst(sts.map(function (i) { return TB[i].n + ' (' + TIER[TB[i].tier] + ')'; })), price: m$(tot), meta: [(old ? 'From ' + dtxt(old.date) + ' ' + tl(old.start) + ' to ' : '') + dtxt(s.day) + ' at ' + tl(tm(s.time)), dur(sumD(s.services)) + (s.guests > 1 ? ', for ' + s.guests + ' people' : ''), 'Paid at the salon'].concat(dep ? ['Deposit note: ' + m$(dep) + ', simulated'] : []) }], buttons: [B(old ? 'Yes, move it' : 'Confirm booking', 'slot:confirm=yes'), B('Change time', 'act:chg:time')].concat(old || elig(s.services).length < 2 ? [] : [B('Change stylist', 'act:chg:stylist')], [B('Cancel', 'cancel')]) });
  }
  function confirmSlot() { return { name: 'confirm', ask: function (bot, s) { if (!gate(bot)) return; var hit = hitFor(bot, s); if (!hit) { var o = opts(bot), m = tm(s.time); offer(bot, tl(m) + ' ' + onD(s.day) + ' is no longer free.', o, m, 'time'); return; } summary(bot, s, hit); }, parse: function (t) { var y = N.yesno(t); return y === undefined ? undefined : (y ? 'yes' : 'no'); }, hint: 'Say yes to confirm, or pick an option.' }; }

  O.registerAgent({
    id: 'salon', name: 'Maison Verve Assistant', business: 'Maison Verve', role: 'Salon bookings', industry: 'Beauty', initials: 'MV', accent: '#F0A5C8', phoneLabel: 'Maison Verve reception',
    blurb: 'Books hair, skin, nails and bridal appointments from real free slots, rebooks your usual, moves or cancels visits, runs a waitlist and explains packages.',
    helloLine: 'I can book a visit, rebook your usual, show prices or explain our packages.',
    samples: ['balayage with Anika on saturday afternoon', 'haircut and beard trim tomorrow 6pm', 'facial for 2 on friday', 'rebook my usual'],
    kind: 'customer', contexts: [{ label: 'Just browsing', context: {} }, { label: 'Viewing Balayage', context: { service: 'balayage' } }, { label: 'Viewing Bridal makeup', context: { service: 'bridal' } }, { label: 'Viewing Anika’s profile', context: { stylist: 'anika' } }, { label: 'Viewing Monthly Glow', context: { package: 'glow' } }],
    synonyms: {
      beard: ['beard trim', 'beard cut', 'beard shaping', 'beard styling', 'trim my beard'], shave: ['shaving', 'clean shave', 'razor shave', 'hot towel shave'],
      trial: ['bridal trial', 'makeup trial', 'wedding trial', 'trial look', 'hair and makeup trial'], bridal: ['bridal makeup', 'bridal make up', 'wedding makeup', 'wedding make up', 'bride makeup', 'bridal look', 'wedding look', 'wedding day makeup', 'party makeup', 'makeup', 'make up'],
      keratin: ['keratin treatment', 'smoothing', 'hair smoothing', 'rebonding', 'straightening', 'hair straightening', 'brazilian blowout', 'brazilian'],
      balayage: ['highlights', 'highlight', 'ombre', 'babylights', 'balayge', 'balyage', 'streaks', 'foils'], colour: ['hair colour', 'hair color', 'color', 'coloring', 'colouring', 'dye', 'hair dye', 'root touch up', 'root touchup', 'tint', 'grey coverage', 'gray coverage'],
      pedicure: ['pedi', 'pedis', 'pedicures', 'foot spa'], manicure: ['mani', 'manicures', 'nails', 'nail', 'nail art', 'gel nails', 'gel polish'],
      cleanup: ['clean up', 'clean-up', 'face cleanup', 'face clean up', 'cleanups'], facial: ['facials', 'hydrafacial', 'face treatment', 'face'], brows: ['eyebrow', 'eyebrows', 'eyebrow threading', 'threading', 'brow', 'brow shaping', 'upper lip'],
      treatment: ['hair treatment', 'hair spa', 'deep conditioning', 'conditioning', 'hair mask', 'scalp treatment', 'protein treatment', 'head spa', 'spa'],
      haircut: ['hair cut', 'cut and style', 'cut style', 'blowout', 'blow out', 'blow dry', 'blow-dry', 'blowdry', 'hair styling', 'styling', 'hairstyle', 'haircuts', 'mens cut', 'men\'s cut', 'trim', 'hair trim', 'cut']
    },
    seeds: { bookings: function () { return seedBookings(); }, waitlist: function () { return []; } },
    menu: [B('Book an appointment', 'flow:book'), B('Services and prices', 'intent:services'), B('Packages', 'intent:packages'), B('Rebook my usual', 'intent:rebook'), B('Reschedule or cancel', 'intent:manage')],
    greeting: function (bot) {
      var sv = SB[bot.ctx.service], st = TB[bot.ctx.stylist], pk = PB[bot.ctx.package], M = bot.agent.menu;
      if (sv) return bot.say('Hi, I’m the Maison Verve assistant. I can see you are looking at **' + sv.n + '**, about ' + dur(sv.d) + '. Want me to find a time?', { buttons: [B('Book it', 'act:booksvc:' + sv.id), B('Price by stylist', 'act:price:' + sv.id), M[2], M[3]] });
      if (st) return bot.say('Hi, I’m the Maison Verve assistant. You are on **' + st.n + '**’s page, our ' + TIER[st.tier] + '. Shall I check the next openings?', { buttons: [B('Book with ' + fn(st.id), 'act:bookst:' + st.id), M[1], M[2], M[3]] });
      if (pk) return bot.say('Hi, I’m the Maison Verve assistant. You are looking at **' + pk.n + '**. I can show what you save against booking each service separately.', { buttons: [B('Compare prices', 'act:pkgcmp:' + pk.id), B('I’m interested', 'act:pkg:' + pk.id), M[0], M[3]] });
      bot.say('Hi, I’m the Maison Verve assistant. I can book a visit, rebook your usual, show prices or explain our packages.', { buttons: M });
    },
    extract: function (text, bot) {
      var e = {}, nt = N.norm(text, bot.agent.synonyms), w = N.when(text), g = N.party(text), ph = N.phone(text), sv = svcFrom(text, bot), sy = styFrom(text, bot), tk = whoTok(text), pend = bot.flow === 'book' && bot.pending && bot.pending.name, nm, h;
      if (sv) { e.services = sv; if (pend === 'more') e.services = (bot.slots.services || []).concat(sv.filter(function (x) { return (bot.slots.services || []).indexOf(x) < 0; })).slice(0, 4); }
      if (sy) e.stylist = sy; if (w && w.iso) e.day = w.iso; if (g >= 2 && g <= 12) e.guests = g; if (ph) e.phone = ph; if (tk && (/MV/i.test(text) || ph)) e.who = tk;
      if (w && (w.time || w.timeAmbiguous || w.part)) { h = w.time || (w.timeAmbiguous ? hm(ampm(w.timeAmbiguous) * 60) : undefined); e.want = { time: h, part: w.part || (h ? (tm(h) < 720 ? 'morning' : tm(h) < 1020 ? 'afternoon' : 'evening') : undefined) }; }
      if (sv && pend !== 'more' && (sv.length > 1 || sy || w)) e.more = 'no';
      if (/\b(my name is|call me|this is|name'?s)\s+/i.test(text) && (nm = N.name(text))) e.name = nm;
      if (/\bbridal week\b/.test(nt)) e.pkg = 'bridal'; else if (/\bmonthly glow\b|\bglow package\b/.test(nt)) e.pkg = 'glow'; else if (/\b(combo|package|bundle)\b/.test(nt) && /colour|haircut/.test(nt)) e.pkg = 'combo';
      return e;
    },
    intents: [
      { id: 'book', label: 'Book an appointment', kw: ['book', 'booking', 'appointment', 'reserve', 'schedule', 'slot', 'slots', 'availability', 'available', 'haircut', 'colour', 'balayage', 'keratin', 'treatment', 'facial', 'cleanup', 'brows', 'manicure', 'pedicure', 'trial', 'bridal', 'beard', 'shave', 'openings', 'free time'], flow: 'book', priority: 0 },
      { id: 'services', label: 'Services and prices', kw: ['services', 'service menu', 'price list', 'prices', 'price', 'pricing', 'how much', 'cost', 'rates', 'charges', 'what do you offer', 'what do you do'], re: [/\b(how much|price|prices|pricing|cost|rates?|charges?)\b/], priority: 1, run: function (bot, m) {
        var e = m.ent, nt = m.norm, c = /\bhair\b/.test(nt) ? 'hair' : /\bskin\b/.test(nt) ? 'skin' : /\bnails?\b/.test(nt) ? 'nails' : /\bgrooming\b|\bmens?\b/.test(nt) ? 'grooming' : null;
        if (e.services && e.services.length) { bot.say('Prices depend on the stylist level. Here ' + (e.services.length === 1 ? 'it is' : 'they are') + ', with the tier prices.', { cards: e.services.slice(0, 4).map(svcCard), buttons: [B('Book it', 'act:booksvc:' + e.services[0]), B('See packages', 'intent:packages')] }); return; }
        if (c) { actions.cat(bot, c); return; }
        bot.say('We have hair, skin, nails, bridal and grooming. Prices start from ' + m$(300) + ' and depend on the stylist level: junior, senior or creative director. Which menu do you want?', { buttons: Object.keys(CATS).map(function (k) { return B(CATS[k], 'act:cat:' + k); }) });
      } },
      { id: 'packages', label: 'Packages', kw: ['package', 'packages', 'combo', 'bundle', 'deal', 'deals', 'offer', 'offers', 'membership', 'monthly glow', 'bridal week', 'discount'], re: [/\b(combo|package|packages|bundle|monthly glow|bridal week|membership)\b/], priority: 1, run: function (bot, m) {
        var p = PB[m.ent.pkg || bot.ctx.package]; if (p && m.ent.pkg) { actions.pkgcmp(bot, p.id); return; }
        bot.say('We have three packages. Each costs less than booking the same services one by one. Pick one to see the saving.', { cards: PK.map(pkgCard) });
      } },
      { id: 'rebook', label: 'Rebook my usual', kw: ['rebook', 'book again', 'same as last time', 'my usual', 'usual', 'last time', 'same again', 'same as before', 'repeat my last'], re: [/\b(rebook|re-book|same as (last time|before)|my usual|book (it )?again)\b/], priority: 2, flow: 'rebook' },
      { id: 'next_appt', label: 'My next appointment', kw: ['next appointment', 'upcoming', 'my appointment', 'my booking', 'when is my', 'when am i', 'booked for', 'my next visit', 'do i have an appointment', 'check my appointment'], re: [/when (is|am|are).*(appointment|booking|visit|booked|slot)/, /next (appointment|visit|booking)/], priority: 2, flow: 'view' },
      { id: 'reschedule', label: 'Reschedule', kw: ['reschedule', 'postpone', 'move my appointment', 'change my appointment', 'change my booking', 'shift my appointment', 'move my booking'], re: [/\b(reschedule|postpone|move|change|shift)\b.*\b(appointment|booking)\b/], priority: 3, flow: 'move' },
      { id: 'cancel_appt', label: 'Cancel', kw: ['cancel', 'cancel my appointment', 'cancel appointment', 'cancel my booking', 'cancel booking', 'cancel the appointment'], re: [/\bcancel\b.*\b(appointment|booking|slot|visit)\b/], priority: 2, flow: 'cancel' },
      { id: 'manage', label: 'Reschedule or cancel', kw: ['manage booking', 'manage my booking', 'my bookings'], priority: 1, run: function (bot) { bot.say('Would you like to move a visit, cancel one, or check when it is?', { buttons: [B('Reschedule', 'intent:reschedule'), B('Cancel', 'intent:cancel_appt'), B('When is my next one?', 'intent:next_appt')] }); } },
      { id: 'team', label: 'Our stylists', kw: ['stylist', 'stylists', 'who does', 'team', 'who works', 'hairdresser', 'colourist', 'barber', 'artist', 'tell me about', 'creative director'], priority: 1, run: function (bot, m) {
        var e = m.ent, l = e.stylist && e.stylist !== 'any' ? [TB[e.stylist]] : e.services ? elig(e.services) : ST;
        bot.say(e.services && l.length ? 'These stylists do ' + svl(e.services) + ', with their level, so you can see the price tier.' : l.length === 1 ? 'Here is ' + l[0].n + '.' : 'Meet the team. Junior, senior and creative director levels are priced differently.', { cards: l.slice(0, 6).map(stCard) });
      } },
      { id: 'bridal_info', label: 'Weddings', kw: ['wedding', 'bride', 'bridal party', 'bridesmaids', 'bridesmaid', 'getting married', 'my wedding'], priority: 1, run: function (bot, m) {
        if (m.ent.guests > 6) { bot.say('A bridal party that size needs a person to plan the chairs, timing and stylists with you.'); bot.handover('Bridal party of ' + m.ent.guests); return; }
        bot.say('For weddings we do a bridal trial first (' + dur(SB.trial.d) + ', from ' + m$(priceOf('trial', 'senior')) + ') and then the wedding-day makeup (from ' + m$(priceOf('bridal', 'senior')) + '). Bridal Week bundles both with a facial, manicure and pedicure. For a bridal party of more than six, a person plans it with you.', { buttons: [B('Book a bridal trial', 'act:booksvc:trial'), B('Bridal Week package', 'say:bridal week package'), B('Talk to a person', 'handover')] });
      } },
      { id: 'allergy', label: 'Allergy or medical question', kw: ['allergy', 'allergic', 'allergies', 'reaction', 'sensitive skin', 'sensitive scalp', 'pregnant', 'pregnancy', 'asthma', 'eczema', 'psoriasis', 'medication', 'breastfeeding'], re: [/\b(allerg\w*|eczema|psoriasis|pregnan\w*|breastfeeding|rash)\b/], priority: 3, run: function (bot) { bot.say('Thank you for telling me. Allergies and skin conditions are best checked by a stylist, so I will bring in a person who can see this chat.'); bot.handover('Allergy or medical question'); } },
      { id: 'complaint', label: 'Complaint', kw: ['complaint', 'complain', 'unhappy', 'disappointed', 'not happy', 'ruined', 'damaged my hair', 'terrible', 'redo', 'poor service', 'upset', 'bad haircut'], re: [/\b(ruined|burnt|burned|terrible|awful|worst|complaint)\b/], priority: 3, run: function (bot) { bot.say('I am sorry that happened. This needs a person who can look at it properly and put it right, so I will bring one in now.'); bot.handover('Complaint'); } }
    ],
    flows: {
      book: { intent: 'book', slots: [
        { name: 'services', coerce: function (v) { return v.split('+'); }, ask: function (bot) {
          var c = SB[bot.ctx.service]; if (c && !bot.mem.noctx) { bot.say('You are looking at **' + c.n + '**. Shall I book that one?', { buttons: [B('Yes, ' + c.n, 'slot:services=' + c.id), B('Something else', 'act:noctx')] }); return; }
          bot.say('What would you like to book? Pick a group, or type it, for example “balayage and a facial”.', { buttons: Object.keys(CATS).map(function (k) { return B(CATS[k], 'act:svcs:' + k); }) });
        }, parse: function (t, bot) { return svcFrom(t, bot); }, hint: 'Tell me the service, for example “haircut”, “facial” or “balayage”.' },
        { name: 'more', ask: function (bot, s) {
          if (s.services.length >= 3) { s.more = 'no'; bot._advance(); return; }
          var sug = ['treat', 'beard', 'brows', 'cleanup', 'mani', 'pedi', 'facial', 'cut', 'shave'].filter(function (i) { return s.services.indexOf(i) < 0 && elig(s.services.concat(i)).length; }).slice(0, 3);
          bot.say('Got it: **' + svl(s.services) + '**, ' + dur(sumD(s.services)) + '. Anything to add to this visit?', { buttons: [B('No, that is all', 'slot:more=no')].concat(sug.map(function (i) { return B('Add ' + SB[i].n.toLowerCase(), 'act:add:' + i); })) });
        }, parse: function (t) { var y = N.yesno(t); return y === false || /\b(that'?s all|nothing|just that|only that|done)\b/i.test(t) ? 'no' : undefined; }, hint: 'Tell me what to add, for example “beard trim”, or say no.' },
        { name: 'stylist', ask: function (bot, s) {
          if (!prep(bot)) return; var el = elig(s.services);
          if (s.guests > 1) { s.stylist = 'any'; bot.say('For ' + s.guests + ' people I will book ' + s.guests + ' stylists side by side.'); bot._advance(); return; }
          if (el.length === 1) { s.stylist = el[0].id; bot.say(el[0].n + ', our ' + TIER[el[0].tier] + ', is the one who does ' + svl(s.services) + '. That is ' + m$(sumP(s.services, el[0].tier)) + '.'); bot._advance(); return; }
          var cx = bot.ctx.stylist, ordered = el.slice().sort(function (a, b) { return (b.id === cx) - (a.id === cx); });
          bot.say('Who would you like? The price depends on the stylist level.', { buttons: [B('Any stylist, lowest price', 'slot:stylist=any')].concat(ordered.map(function (x) { return B(fn(x.id) + ', ' + TIER[x.tier] + ', ' + m$(sumP(s.services, x.tier)), 'slot:stylist=' + x.id); })) });
        }, parse: function (t, bot) { return styFrom(t, bot); }, hint: 'Say a stylist’s name, or “any”.' },
        SL.day, { name: 'want', optional: true }, { name: 'guests', optional: true }, SL.time, SL.ok, nameSlot(), phoneSlot(), confirmSlot()
      ], done: function (bot, s) {
        if (s.confirm === 'no') { bot.say('No problem, nothing is booked.'); bot.menu('Anything else?'); return; }
        var hit = hitFor(bot, s); if (!hit) { bot.say('Sorry, that time was just taken. Let me find another.'); bot.startFlow('book', { services: s.services, stylist: s.stylist, day: s.day, guests: s.guests, more: 'no', name: s.name, phone: s.phone }); return; }
        var o = opts(bot, s), r = create(bot, { svcs: s.services, sts: assign(o, hit), iso: s.day, m: tm(s.time), name: s.name, phone: s.phone }); finish(bot, r);
      } },
      waitlist: { intent: 'waitlist', slots: [{ name: 'name', ask: nameSlot().ask, parse: nameSlot().parse, hint: nameSlot().hint }, phoneSlot()], done: function (bot, s) {
        var w = bot.db('waitlist'), id = 'WL-' + (300 + w.length), want = s.want || {};
        w.push({ id: id, services: s.services, stylist: s.stylist || 'any', date: s.day, time: want.time || null, part: want.part || null, guests: s.guests || 1, name: s.name, phone: s.phone, at: Date.now(), status: 'waiting' }); bot.save('waitlist', w);
        bot.user.name = s.name; bot.user.phone = s.phone; bot.mem.phone4 = String(s.phone).slice(-4);
        bot.lead({ name: s.name, phone: s.phone, intent: 'waitlist', payload: { id: id, services: s.services.map(function (i) { return SB[i].n; }), date: s.day, time: want.time || want.part || 'any', stylist: s.stylist || 'any' } }); bot.event('action', { action: 'waitlist_join' });
        var near = nextBest(bot, { svcs: s.services, stylist: s.stylist || 'any', iso: s.day, guests: s.guests }, want.time ? tm(want.time) : null);
        bot.say('You are on the waitlist, ' + s.name.split(' ')[0] + '. Your waitlist number is ' + id + '. If ' + (want.time ? tl(tm(want.time)) : 'a slot') + ' ' + onD(s.day) + ' opens up, we will text you straight away. Meanwhile, these are free now:', { buttons: near.map(function (x) { return B((x.iso === s.day ? '' : fd(x.iso) + ', ') + tl(x.m), 'act:quick:' + x.iso + '|' + hm(x.m) + '|' + s.services.join('+') + '|' + (s.stylist || 'any') + '|' + (s.guests || 1)); }).concat([B('No thanks', 'say:bye')]) });
      } },
      rebook: { intent: 'rebook', slots: [{ name: 'who', ask: function (bot, s) {
        if (bot.mem.phone4) { s.who = 'ph:' + bot.mem.phone4; bot._advance(); return; }
        bot.say('Happy to. I will look up your last visit. What is the phone number you booked with? The last four digits is enough, or tell me your name.');
      }, parse: function (t) { var k = whoTok(t); if (k) return k; var n = N.name(t); return n && !/\b(rebook|book|usual|same)\b/i.test(t) ? 'nm:' + n.split(' ').join(' ') : undefined; }, hint: 'Send the last four digits of your phone number, or your name.' }], done: function (bot, s) {
        var c = client(bot, s.who); if (!c) { bot.say('I could not find a past visit for that. Check the digits, or I can start a fresh booking.', { buttons: [B('Try again', 'flow:rebook'), B('Book something new', 'flow:book'), B('Talk to a person', 'handover')] }); return; }
        var f = c.name.split(' ')[0], st = TB[c.st], sid = c.st, g = c.guests || 1, e = earliest(bot, c.svcs, sid, g), note = '';
        if (!e) { e = earliest(bot, c.svcs, 'any', g); sid = 'any'; note = ' ' + fn(c.st) + ' has nothing in the next ten days, so this is with the first free stylist.'; }
        bot.user.name = c.name; bot.user.phone = c.phone; bot.mem.phone4 = String(c.phone).slice(-4); bot.mem.rest = null;
        bot.say('Welcome back, ' + f + '. Last time was **' + svl(c.svcs) + ' with ' + fn(c.st) + '**, ' + ago(c.date) + '.' + (e ? ' Want the same again? The next free slot is ' + onD(e.iso) + ' at ' + tl(e.m) + '.' + note : ' I cannot see a free slot in the next ten days. I can add you to the waitlist.'), e ? (function () {
          var o = { svcs: c.svcs, stylist: sid, iso: e.iso, guests: g }, sts = assign(o, e), tot = total(c.svcs, sts); bot.mem.proposal = { svcs: c.svcs, sts: sts, iso: e.iso, m: e.m, name: c.name, phone: c.phone, sid: sid, g: g };
          return { cards: [{ title: 'Same as last time', sub: svl(c.svcs) + ' with ' + lst(sts.map(fn)), price: m$(tot), meta: [dtxt(e.iso) + ' at ' + tl(e.m), dur(sumD(c.svcs)), TIER[TB[sts[0]].tier]] }], buttons: [B('Yes, book it', 'act:rbk:yes'), B('Different time', 'act:rbk:time'), B('Different stylist', 'act:rbk:sty')] };
        })() : { buttons: [B('Join the waitlist', 'act:rbk:time'), B('Talk to a person', 'handover')] });
      } },
      view: { intent: 'next_appt', slots: [whoSlot('view')], done: function (bot, s) {
        var l = mine(bot, s.who); if (!l.length) { bot.say('I do not see an upcoming appointment for that. Would you like to book one?', { buttons: [B('Book a visit', 'flow:book'), B('Rebook my usual', 'flow:rebook'), B('Try another number', 'flow:view')] }); return; }
        var b = l[0]; bot.say('Your next appointment is **' + svl(b.services) + '** with ' + lst(b.stylists.map(fn)) + ' ' + onD(b.date) + ' at ' + tl(b.start) + '. The reference is ' + b.ref + '.' + (l.length > 1 ? ' You have ' + l.length + ' coming up.' : ''), { cards: l.slice(0, 3).map(apptCard) });
      } },
      cancel: { intent: 'cancel_appt', slots: [whoSlot('cancel'), pickSlot('cancel'), { name: 'confirm', ask: function (bot, s) {
        var b = find(bot, s.pick), late = ts(b) - Date.now() < 4 * 36e5; bot.say('Cancel **' + b.ref + '**, ' + svl(b.services) + ' ' + onD(b.date) + ' at ' + tl(b.start) + '? ' + (late ? 'It is within four hours, so a late fee of half the service price may apply.' : 'It is more than four hours ahead, so there is no charge.'), { buttons: [B('Yes, cancel it', 'slot:confirm=yes'), B('No, keep it', 'slot:confirm=no')] });
      }, parse: function (t) { var y = N.yesno(t); return y === undefined ? undefined : (y ? 'yes' : 'no'); } }], done: function (bot, s) {
        if (s.confirm === 'no') { bot.say('Okay, your appointment stays as it is.'); bot.menu('Anything else?'); return; }
        var a = BK(bot), b = a.filter(function (x) { return x.ref === s.pick; })[0]; b.status = 'cancelled'; b.cancelledAt = Date.now(); bot.save('bookings', a); bot.event('action', { action: 'appt_cancel' });
        var wl = bot.db('waitlist'), hit = wl.filter(function (w) { return w.status === 'waiting' && w.date === b.date && (w.stylist === 'any' || b.stylists.indexOf(w.stylist) >= 0); }); hit.forEach(function (w) { w.status = 'notified'; }); if (hit.length) { bot.save('waitlist', wl); bot.event('action', { action: 'waitlist_notify', n: hit.length }); }
        bot.say('Done. **' + b.ref + '** is cancelled and the time is open again.' + (hit.length ? ' Someone on the waitlist has been told.' : ''), { buttons: [B('Book another time', 'flow:book'), B('That’s all', 'say:bye')] });
      } },
      move: { intent: 'reschedule', slots: [whoSlot('move'), pickSlot('move'), { name: 'load', ask: function (bot, s) {
        var b = find(bot, s.pick); s.services = b.services.slice(); s.stylist = b.stylists.length > 1 ? 'any' : b.stylists[0]; s.guests = b.guests; s.ex = b.ref; s.load = 'y';
        bot.say('Moving **' + b.ref + '**, ' + svl(b.services) + ' with ' + lst(b.stylists.map(fn)) + ', now ' + onD(b.date) + ' at ' + tl(b.start) + '.'); bot._advance();
      } }, SL.day, { name: 'want', optional: true }, SL.time, SL.ok, confirmSlot()], done: function (bot, s) {
        if (s.confirm === 'no') { bot.say('Okay, nothing has changed.'); bot.menu('Anything else?'); return; }
        var hit = hitFor(bot, s), a = BK(bot), b = a.filter(function (x) { return x.ref === s.ex; })[0]; if (!hit) { bot.say('Sorry, that time was just taken. Let me look again.'); bot.startFlow('move', { who: 'ref:' + s.ex }); return; }
        var o = opts(bot, s), sts = assign(o, hit); b.date = s.day; b.start = tm(s.time); b.stylists = sts; b.price = total(s.services, sts); b.moved = (b.moved || 0) + 1; bot.save('bookings', a); bot.event('action', { action: 'appt_move' });
        bot.say('Moved. **' + b.ref + '** is now ' + onD(b.date) + ' at ' + tl(b.start) + ' with ' + lst(b.stylists.map(fn)) + '. The old time is open again.', { cards: bot.channel === 'phone' ? null : [reminderCard(b)], buttons: [B('That’s all', 'say:bye'), B('Menu', 'menu')] });
      } },
      package: { intent: 'packages', slots: [{ name: 'pkg', ask: function (bot) { bot.say('Which package are you interested in?', { buttons: PK.map(function (p) { return B(p.n + ', ' + m$(p.price), 'slot:pkg=' + p.id); }) }); }, parse: function (t, bot) { var m = N.norm(t, bot.agent.synonyms); return /bridal/.test(m) ? 'bridal' : /glow|monthly/.test(m) ? 'glow' : /combo|colour/.test(m) ? 'combo' : undefined; } }, nameSlot(), phoneSlot()], done: function (bot, s) {
        var p = PB[s.pkg], c = pkgCalc(p); bot.user.name = s.name; bot.user.phone = s.phone;
        bot.lead({ name: s.name, phone: s.phone, intent: 'package', payload: { package: p.n, price: p.price, saving: c.save } }); bot.event('action', { action: 'package_interest' });
        bot.say('Noted, ' + s.name.split(' ')[0] + '. I have passed your interest in **' + p.n + '** (' + m$(p.price) + ', you save ' + m$(c.save) + ') to our front desk. They will call to plan the visits. No payment is taken here.', { buttons: [B('Book the first visit', 'flow:book'), B('That’s all', 'say:bye')] });
      } }
    },
    actions: null,
    kb: [
      { id: 'patch', q: 'Do I need a patch test?', a: 'For colour and smoothing we do a free patch test at least 48 hours before your visit, or you can show a clear result from the last six months. It takes ten minutes and your stylist will arrange it when you book. If you have an allergy or sensitive skin, a person should advise you.', keys: ['patch test', 'skin test', 'allergy test', '48 hours before'], buttons: [B('Talk to a stylist', 'handover'), B('Book colour', 'say:book a colour'), B('Menu', 'menu')] },
      { id: 'late', q: 'What if I am running late?', a: 'We hold your slot for 15 minutes. After that we may shorten the service so the next guest is not kept waiting, and the full price still applies. If you are going to be late, message us and we will do our best.', keys: ['running late', 'late policy', 'late arrival', 'i am late', 'grace period', 'arrive late', 'how late can i be', 'late'] },
      { id: 'cancelpol', q: 'What is the cancellation policy?', a: 'You can move or cancel free up to 4 hours before your visit. Within 4 hours, or if you do not show up, we keep half of the service price. Deposits for colour and bridal are taken off your bill, and refunded if you cancel 48 hours ahead.', keys: ['cancellation policy', 'cancel fee', 'no show', 'cancellation fee', 'free cancellation', 'how late can i cancel'], buttons: [B('Cancel a booking', 'intent:cancel_appt'), B('Menu', 'menu')] },
      { id: 'products', q: 'Which products do you use?', a: 'We use professional ammonia-free colour, bond-protecting treatments and fragrance-light skincare. Everything is vegan and not tested on animals. Tell your stylist about preferences and they will choose to match.', keys: ['products used', 'which products', 'what products', 'products do you use', 'ammonia free', 'vegan', 'cruelty free', 'brands'] },
      { id: 'parking', q: 'Is there parking?', a: 'Yes, there is free parking behind the building for up to two hours, with a short walk through the side door. We are also a five minute walk from the main metro stop.', keys: ['parking', 'park', 'car park', 'valet', 'where to park', 'metro'] },
      { id: 'kids', q: 'Do you take children?', a: 'Children are welcome. Kids haircuts for under 12s are half the cut and style price with any stylist. For safety we do not colour or smooth hair for under 16s, and little ones should come with an adult.', keys: ['kids', 'children', 'child', 'kids haircut', 'toddler', 'bring my son', 'bring my daughter'] },
      { id: 'gift', q: 'Do you sell gift cards?', a: 'Yes. Gift cards come in ₹1,000, ₹2,500 and ₹5,000 and work for any service or package. They are valid for twelve months. A person at the front desk can set one up for you.', keys: ['gift card', 'gift cards', 'gift voucher', 'voucher', 'gift'], buttons: [B('Talk to a person', 'handover'), B('Menu', 'menu')] },
      { id: 'pay', q: 'How do I pay?', a: 'You pay at the salon after your visit. We take cards, UPI and cash. Colour and bridal bookings over ₹5,000 ask for a 20 percent deposit to hold the slot, which is taken off your bill.', keys: ['payment methods', 'how do i pay', 'pay by card', 'upi', 'cash', 'cards accepted', 'payment', 'pay at the salon', 'credit card', 'deposit'] },
      { id: 'hygiene', q: 'How do you keep things clean?', a: 'Tools are sterilised between every guest and capes and towels are freshly laundered. Nail and skin tools are single use or hospital-grade sterilised, and stylists wear fresh gloves for colour services.', keys: ['hygiene', 'hygienic', 'is it clean', 'sanitise', 'sanitize', 'sterilise', 'clean tools', 'disposable', 'is it safe'] },
      { id: 'hours', q: 'When are you open and where are you?', a: 'We are open every day from 10 am to 8 pm. Each stylist works different days, so I only show you real openings. You will find us at 14 Marigold Lane, behind the old market.', keys: ['opening hours', 'what time do you open', 'closing time', 'working hours', 'timings', 'address', 'location', 'where are you', 'directions', 'are you open'], buttons: [B('Book a visit', 'flow:book'), B('Menu', 'menu')] },
      { id: 'walkin', q: 'Do you take walk-ins?', a: 'Walk-ins are welcome when a stylist is free, but booking guarantees your time and your stylist. I can show you what is open today.', keys: ['walk in', 'walk-in', 'walkins', 'without appointment', 'drop in'], buttons: [B('Free today', 'say:book today'), B('Menu', 'menu')] }
    ],
    freeText: function (bot, m) { var e = m.ent; if (e.services || e.day || e.want) { bot.startFlow('book', bot._preset('book', e)); return true; } return false; }
  });

  /* ---------- actions (button targets), attached after registration so they can use the helpers above ---------- */
  var A = O.agents.salon, actions = A.actions = {};
  function inFlow(bot) { if (!bot.flow || !bot.slots.services) { bot.say('That option has expired. Tell me what you would like and I will check again.', { buttons: A.menu }); return false; } return true; }
  actions.cat = function (bot, c) { var l = SV.filter(function (s) { return s.cat === c; }); bot.say(CATS[c] + ' services. Prices start at the junior level, and I show the senior and director prices on each card.', { cards: l.map(function (x) { return svcCard(x.id); }) }); };
  actions.price = function (bot, id) { bot.say('Here is ' + SB[id].n + ' by stylist level.', { cards: [svcCard(id)].concat(elig([id]).slice(0, 3).map(stCard)) }); };
  actions.booksvc = function (bot, id) { bot.startFlow('book', { services: [id] }); };
  actions.bookst = function (bot, id) { bot.startFlow('book', { stylist: id }); };
  actions.svcs = function (bot, c) { bot.say('Which one?', { buttons: SV.filter(function (s) { return s.cat === c; }).map(function (s) { return B(s.n + ', ' + dur(s.d), 'slot:services=' + s.id); }) }); };
  actions.noctx = function (bot) { bot.mem.noctx = 1; bot._advance(); };
  actions.add = function (bot, id) { if (!inFlow(bot)) return; var s = bot.slots; if (s.services.indexOf(id) < 0) s.services.push(id); delete s.more; delete s.stylist; delete s.time; delete s.ok; delete s.confirm; bot._advance(); };
  actions.chg = function (bot, what) { if (!inFlow(bot)) return; var s = bot.slots; if (what === 'day') delete s.day; if (what === 'stylist') delete s.stylist; delete s.time; delete s.ok; delete s.confirm; if (s.want) delete s.want.time; bot._advance(); };
  actions.anysty = function (bot) { if (!inFlow(bot)) return; var s = bot.slots; s.stylist = 'any'; delete s.ok; delete s.confirm; bot._advance(); };
  actions.pickat = function (bot, arg) { if (!inFlow(bot)) return; var p = arg.split('|'), s = bot.slots; s.day = p[0]; s.time = p[1]; delete s.ok; delete s.confirm; bot._advance(); };
  actions.earliest = function (bot) { if (!inFlow(bot)) return; var s = bot.slots, o = opts(bot), e = earliest(bot, o.svcs, o.stylist, o.guests); if (!e) { bot.say('I do not see an opening in the next ten days.', { buttons: [B('Join the waitlist', 'act:wait:any')] }); return; } s.day = e.iso; s.time = hm(e.m); delete s.ok; bot._advance(); };
  actions.wait = function (bot, arg) { if (!bot.flow || !bot.slots.services) { bot.say('Tell me the service and day first, then I can add you to the waitlist.'); return; } var s = bot.slots, w = s.want || {}; bot.startFlow('waitlist', { services: s.services, stylist: s.stylist || 'any', day: s.day || s.reqDay || isoPlus(1), want: { time: arg !== 'any' ? arg : undefined, part: w.part }, guests: s.guests || 1 }); };
  actions.quick = function (bot, arg) { var p = arg.split('|'); bot.startFlow('book', { day: p[0], time: p[1], services: p[2].split('+'), stylist: p[3], guests: +p[4] > 1 ? +p[4] : undefined, more: 'no' }); };
  actions.mv = function (bot, ref) { bot.startFlow('move', { who: 'ref:' + ref }); };
  actions.cx = function (bot, ref) { bot.startFlow('cancel', { who: 'ref:' + ref }); };
  actions.bookrest = function (bot) { var r = bot.mem.rest; bot.mem.rest = null; bot.startFlow('book', { services: r, more: 'no' }); };
  actions.norest = function (bot) { bot.mem.rest = null; bot.say('Okay. Just ask when you want to book the rest.', { buttons: A.menu.slice(0, 3) }); };
  actions.rbk = function (bot, a) {
    var p = bot.mem.proposal; if (!p) { bot.say('Let me look up your last visit again.', { buttons: [B('Rebook my usual', 'flow:rebook')] }); return; }
    if (a === 'time') { bot.startFlow('book', { services: p.svcs, stylist: p.sid, guests: p.g > 1 ? p.g : undefined, more: 'no', name: p.name, phone: p.phone }); return; }
    if (a === 'sty') { bot.startFlow('book', { services: p.svcs, guests: p.g > 1 ? p.g : undefined, more: 'no', name: p.name, phone: p.phone }); return; }
    var hit = freeStarts(bot, { svcs: p.svcs, stylist: p.sid, iso: p.iso, guests: p.g }).filter(function (x) { return x.m === p.m; })[0];
    if (!hit) { bot.say('Sorry, that time has just gone. Let me find another.'); bot.startFlow('book', { services: p.svcs, stylist: p.sid, more: 'no', name: p.name, phone: p.phone }); return; }
    bot.mem.proposal = null; finish(bot, create(bot, { svcs: p.svcs, sts: assign({ stylist: p.sid, guests: p.g }, hit), iso: p.iso, m: p.m, name: p.name, phone: p.phone }), 'Booked, same as last time');
  };
  actions.pkg = function (bot, id) { bot.startFlow('package', { pkg: id }); };
  actions.pkgcmp = function (bot, id) {
    var p = PB[id], c = pkgCalc(p); bot.say(p.n + ' costs ' + m$(p.price) + '. Booked one by one at senior-stylist prices it would be ' + lst(p.items.map(function (i) { return SB[i].n.toLowerCase() + ' ' + m$(priceOf(i, 'senior')); })) + ', which is ' + m$(c.alc) + ' in all. You save ' + m$(c.save) + ', about ' + c.pct + ' percent.', { cards: [pkgCard(p)] });
  };
})();
