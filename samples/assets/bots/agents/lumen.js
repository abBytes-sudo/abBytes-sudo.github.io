/* Agent: Lumen Homes (interiors studio, Delhi NCR). The studio's own design desk: prices a kitchen, wardrobe or whole home,
   books a free site visit with a designer, shows finished homes like yours and tracks a project's stage.
   Every lead and booking lands in Lumen CRM (samples/crm, Conversations and the lead inbox). Nothing leaves the browser. */
(function () {
  'use strict';
  var O = window.Orbit, N = O.nlp, B = function (l, v) { return { label: l, value: v }; };
  var DAY = 864e5;
  var HI = [[/\b(kitne|kitna|kitni) (ka|ki|ke|mein|me)( hoga| padega| hai| lagega)?\b|\bkharcha kitna\b|\bkitna lagega\b/g, 'how much'], [/\bkal subah\b/g, 'tomorrow morning'], [/\bkal shaam\b/g, 'tomorrow evening'], [/\bparso\b/g, 'day after tomorrow'], [/\bkal\b/g, 'tomorrow'], [/\baaj\b/g, 'today'],
    [/\b(haan|haa|haanji|ha ji)\b/g, 'yes'], [/\b(nahi|nahin)\b/g, 'no'], [/\b(rasoi|kitchen ka kaam)\b/g, 'kitchen'], [/\b(almari|almirah)\b/g, 'wardrobe'], [/\b(ghar|flat|makaan)\b/g, 'home'], [/\b(dikhao|dikhaiye)\b/g, 'show me'], [/\bbaat (karni|karna) (hai|h)\b/g, 'talk to a person'], [/\bmera project\b/g, 'my project']];
  function hi(t) { var s = ' ' + String(t).toLowerCase() + ' '; HI.forEach(function (p) { s = s.replace(p[0], p[1]); }); return s.trim(); }

  /* ---------- the studio's rate card (₹ lakh) ---------- */
  var SCOPE = {
    kitchen: { n: 'Modular kitchen', short: 'kitchen', unit: 'rft', ask: 'How long is the counter, in running feet? A 10 by 8 L-shape is about 18 ft.', typ: [12, 18, 26], rate: { ess: 0.11, sig: 0.16, luxe: 0.24 }, wk: [4, 6], inc: 'Carcass, shutters, hardware, quartz top, sink and installation' },
    wardrobe: { n: 'Wardrobes and storage', short: 'wardrobes', unit: 'sqft', ask: 'Roughly how much wardrobe face, in square feet? An 8 ft wide, 7 ft tall unit is 56 sq ft.', typ: [40, 80, 140], rate: { ess: 0.017, sig: 0.026, luxe: 0.04 }, wk: [3, 5], inc: 'BWP ply carcass, shutters, lofts, soft-close fittings and lighting' },
    home: { n: 'Full home interiors', short: 'home', unit: 'bhk', ask: 'How many bedrooms?', typ: [2, 3, 4], rate: { ess: 3.6, sig: 5.2, luxe: 7.8 }, wk: [7, 10], inc: 'Kitchen, wardrobes, TV and study units, false ceiling, lighting and painting' },
    bath: { n: 'Bathroom remodel', short: 'bathroom', unit: 'n', ask: 'How many bathrooms?', typ: [1, 2, 3], rate: { ess: 1.4, sig: 2.1, luxe: 3.4 }, wk: [2, 3], inc: 'Demolition, waterproofing, tiling, fittings, vanity and mirror' },
    paint: { n: 'Painting and polish', short: 'painting', unit: 'bhk', ask: 'How many bedrooms?', typ: [2, 3, 4], rate: { ess: 0.42, sig: 0.65, luxe: 1.1 }, wk: [1, 2], inc: 'Putty, primer, two coats, wood polish and clean-up' }
  };
  var ORDER = ['kitchen', 'wardrobe', 'home', 'bath', 'paint'];
  var FIN = { ess: ['Essential', 'Laminates, soft-close hinges, a clean finish'], sig: ['Signature', 'Acrylic or PU shutters, profile handles, quartz'], luxe: ['Luxe', 'Veneer and lacquer, imported hardware, stone'] };
  var AREAS = ['Gurugram', 'South Delhi', 'Noida', 'Dwarka', 'Ghaziabad', 'Faridabad'];
  var SLOTS = [['11:00', '11 am'], ['13:00', '1 pm'], ['16:00', '4 pm'], ['18:00', '6 pm']];
  var STAGES = ['Site measure', 'Design and 3D', 'Factory production', 'Installation', 'Handover'];
  var WORK = [
    { t: 'Sector 57 villa', s: 'Full home · 4 BHK · Gurugram · 11 weeks', kind: 'home', bhk: 4, l: 38, badge: 'Luxe' },
    { t: 'Greenwood flat', s: 'Full home · 3 BHK · Noida · 8 weeks', kind: 'home', bhk: 3, l: 14.5, badge: 'Signature' },
    { t: 'Dwarka twin kitchens', s: 'Kitchen · L-shape · Dwarka · 5 weeks', kind: 'kitchen', l: 3.4, badge: 'Signature' },
    { t: 'Saket studio home', s: 'Full home · 2 BHK · South Delhi · 7 weeks', kind: 'home', bhk: 2, l: 9.2, badge: 'Essential' },
    { t: 'Golf Course Road walk-in', s: 'Wardrobes · walk-in closet · Gurugram · 4 weeks', kind: 'wardrobe', l: 4.1, badge: 'Luxe' },
    { t: 'Indirapuram bathrooms', s: 'Two bathrooms · Ghaziabad · 3 weeks', kind: 'bath', l: 4.6, badge: 'Signature' }
  ];
  function L(n) { return '₹' + (Math.round(n * 10) / 10).toString().replace(/\.0$/, '') + ' L'; }
  function scopeFrom(t) { t = hi(t); return /\b(full home|whole home|entire home|complete home|full house|whole flat|\d ?bhk interior|home interior|turnkey)\b/.test(t) ? 'home' : /\b(kitchen|modular kitchen|rasoi)\b/.test(t) ? 'kitchen' : /\b(wardrobe|closet|storage|walk.?in)\b/.test(t) ? 'wardrobe' : /\b(bathroom|washroom|toilet|bath)\b/.test(t) ? 'bath' : /\b(paint|painting|polish)\b/.test(t) ? 'paint' : undefined; }
  function finFrom(t) { t = hi(t); return /\b(luxe|luxury|premium|veneer|imported|high end|best)\b/.test(t) ? 'luxe' : /\b(signature|mid|acrylic|pu|quartz)\b/.test(t) ? 'sig' : /\b(essential|basic|budget|laminate|simple|cheap)\b/.test(t) ? 'ess' : undefined; }
  function sizeFrom(t, sc) { var b = N.bhk(t); if (b && (sc === 'home' || sc === 'paint')) return b; var m = String(t).replace(/,/g, '').match(/\b(\d{1,4})\s*(?:x|by|\*)\s*(\d{1,3})\b/); if (m && sc !== 'home') return sc === 'kitchen' ? (+m[1] + +m[2]) : +m[1] * +m[2]; m = String(t).match(/\b(\d{1,4})\b/); return m ? +m[1] : undefined; }
  function estimate(sc, n, f) { var S = SCOPE[sc], r = S.rate[f], base = sc === 'home' ? r * (0.55 + n * 0.32) : sc === 'paint' ? r * n : r * n; return { lo: base * 0.88, hi: base * 1.15, w: S.wk }; }
  function days(n) { var out = [], d = new Date(); d.setHours(0, 0, 0, 0); while (out.length < n) { d = new Date(d.getTime() + DAY); if (d.getDay() === 0) continue; out.push(new Date(d)); } return out; }
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dayLabel(v) { var p = String(v).split('-'); return O.fmtDay ? O.fmtDay(new Date(+p[0], +p[1] - 1, +p[2])) : v; }
  function taken(bot, dIso, t) { var bk = bot.db('visits') || []; if (bk.some(function (b) { return b.date === dIso && b.time === t; })) return true; var h = 11; (dIso + t).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) | 0; }); return Math.abs(h) % 4 === 0; }
  function nameOk(t) { var n = N.name(t); return n && !/^(morning|afternoon|evening|today|tomorrow|yes|no|ok|okay|sure|thanks|hello|hi|any|later|done)$/i.test(n.trim()) && !/\d|@/.test(t) ? n : undefined; }
  function lead(bot, intent, payload, extra) { payload = payload || {}; payload.convo = bot.id; payload.page = bot.ctx.section || ''; var l = { intent: intent, payload: payload }; if (extra) for (var k in extra) l[k] = extra[k]; if (!l.name && !bot.user.name) l.name = 'Website visitor'; return bot.lead(l); }
  var MENU = [B('What will it cost?', 'flow:estimate'), B('Book a free site visit', 'flow:visit'), B('Show me homes like mine', 'intent:work'), B('Where is my project?', 'flow:status'), B('Talk to a designer', 'handover')];

  O.registerAgent({
    id: 'lumen', name: 'Lumen Homes', business: 'Lumen Homes', role: 'Design desk', industry: 'Home interiors', initials: 'LH', accent: '#4F46E5', phoneLabel: 'Lumen Homes studio',
    blurb: 'The studio’s design desk: prices a kitchen, wardrobes or a whole home, books a free site visit with a designer, shows finished homes and tracks a project’s stage.',
    helloLine: 'I can price your home, book a designer’s visit, show finished homes or look up your project.',
    samples: ['3 bhk full home signature finish', 'kitchen 18 ft kitna lagega', 'site visit kal shaam in Gurugram', 'where is my project LH-3184'],
    kind: 'customer', menu: MENU,
    contexts: [{ label: 'Reading about kitchens', context: { section: 'kitchen' } }, { label: 'On the pricing table', context: { section: 'pricing' } }],
    synonyms: { 'how much': ['kitne ka padega', 'kitna padega', 'kitne ka hoga', 'kitne ka hai', 'kitna hai', 'kharcha', 'budget kya'], 'site visit': ['ghar aao', 'dekhne aao', 'visit chahiye', 'come home', 'measure my'], 'my project': ['mera kaam', 'my order', 'my flat', 'our project'], 'talk to a person': ['baat karni hai', 'call me', 'human', 'designer se baat'] },
    seeds: {
      visits: function () { var d = days(4), now = Date.now(); return [
        { ref: 'SV-3102', name: 'Ritika Bansal', phone: '+91 98••• ••214', scope: 'home', area: 'Gurugram', date: iso(d[0]), time: '11:00', t: now - DAY, source: 'Instagram' },
        { ref: 'SV-3105', name: 'Arjun Mehra', phone: '+91 99••• ••508', scope: 'kitchen', area: 'Dwarka', date: iso(d[1]), time: '16:00', t: now - 5 * 36e5, source: 'Website chat' }]; },
      projects: function () { var now = Date.now(); return [
        { code: 'LH-3184', client: 'Kapoor', name: 'Neha Kapoor', title: '3 BHK, Greenwood City, Gurugram', stage: 2, pct: 52, lead: 'Isha (designer)', next: 'Kitchen and wardrobe carcasses leave the factory', due: now + 4 * DAY, note: 'Shutters in PU, sage green. Quartz slab blocked for you.' },
        { code: 'LH-3171', client: 'Rao', name: 'Vikram Rao', title: 'Modular kitchen, Sector 50, Noida', stage: 3, pct: 80, lead: 'Kabir (site lead)', next: 'Chimney and hob fitting, then deep clean', due: now + 2 * DAY, note: 'Counter installed and levelled. Backsplash tiles go up tomorrow.' },
        { code: 'LH-3190', client: 'Sethi', name: 'Pooja Sethi', title: 'Wardrobes, Saket', stage: 1, pct: 25, lead: 'Meera (designer)', next: '3D approval call', due: now + DAY, note: 'Two options shared: walnut veneer and matte white with brass pulls.' }]; }
    },
    nudge: function (c) {
      if (c.section === 'pricing') return { text: 'Want the number for your own home? Three questions, no phone number needed.', cta: 'Price my home', button: B('What will it cost?', 'flow:estimate') };
      return { text: 'Planning a kitchen or a full home? I can give you a first number in under a minute.', cta: 'Price my home', button: B('What will it cost?', 'flow:estimate') };
    },
    greeting: function (bot) {
      var c = bot.ctx, h = new Date().getHours(), hey = h < 12 ? 'Good morning from the studio. ' : h < 17 ? 'Good afternoon from the studio. ' : 'Good evening. The studio is closed, I’m not. ';
      if (bot.channel === 'whatsapp') { bot.say('Lumen Homes on WhatsApp. Send a floor plan or a photo of the room and a designer will look at it before the visit.', { buttons: MENU.slice(0, 4) }); return; }
      if (bot.channel === 'instagram') { bot.say('Hi! Saw something you liked on our feed? I can price it for your home or book a designer to come and measure.', { buttons: MENU.slice(0, 4) }); return; }
      if (c.section === 'kitchen') { bot.say(hey + 'Kitchens are most of what we do. Want a first number for yours, or a designer to come and measure?', { buttons: [B('Price my kitchen', 'act:scope:kitchen'), B('Book a free site visit', 'flow:visit'), B('Show me kitchens', 'say:show me kitchens')] }); return; }
      bot.say(hey + 'I’m the Lumen Homes design desk. I can price your home, book a free site visit, show you homes we’ve finished or tell you where your project stands.', { buttons: MENU });
    },
    extract: function (text, bot) {
      var e = {}, t = hi(text), sc = scopeFrom(t), f = finFrom(t), w = N.when(t), em = N.email(text), ph = N.phone(text), pc = String(text).match(/\bLH[- ]?(\d{4})\b/i);
      if (sc) e.scope = sc; if (f) e.fin = f;
      var sz = sizeFrom(t, sc || (bot.slots && bot.slots.scope)); if (sz && !pc && (sc || bot.flow === 'estimate')) e.size = sz;
      if (w && w.iso) { var d = new Date(w.iso + 'T00:00'); if (d.getDay() !== 0) e.date = w.iso; }
      if (em) e.contact = em; else if (ph) e.contact = ph; if (pc) e.code = 'LH-' + pc[1];
      AREAS.forEach(function (x) { if (t.indexOf(x.toLowerCase()) >= 0) e.area = x; });
      var mo = N.money && N.money(text); if (mo) e.budget = mo;
      return e;
    },
    intents: [
      { id: 'estimate', label: 'Price my home', kw: ['how much', 'price', 'cost', 'estimate', 'quote', 'rate', 'budget', 'ballpark', 'per square foot', 'charges'], re: [/\b(how much|cost|price|estimate|quote)\b/i], priority: 1, run: function (bot, m) { bot.startFlow('estimate', { scope: m.ent.scope, size: m.ent.size, fin: m.ent.fin }); } },
      { id: 'visit', label: 'Book a site visit', kw: ['site visit', 'visit', 'measure', 'come home', 'appointment', 'book', 'meet a designer', 'consultation'], re: [/\b(book|schedule)\b/i], priority: 1, run: function (bot, m) { bot.startFlow('visit', { scope: m.ent.scope, area: m.ent.area, date: m.ent.date, contact: m.ent.contact }); } },
      { id: 'status', label: 'Project status', kw: ['my project', 'project status', 'status', 'progress', 'when will it be done', 'installation date', 'update', 'delivery'], re: [/\bLH[- ]?\d{4}\b/i], priority: 1, run: function (bot, m) { bot.startFlow('status', { code: m.ent.code }); } },
      { id: 'work', label: 'See finished homes', kw: ['show me', 'portfolio', 'projects', 'your work', 'examples', 'photos', 'finished homes', 'similar homes', 'like mine'], priority: 0, run: function (bot, m) {
        var sc = m.ent.scope, b = m.ent.budget, list = WORK.filter(function (w) { return (!sc || w.kind === sc) && (!b || w.l * 1e5 <= b * 1.1); });
        if (!list.length) list = WORK.slice(0, 3);
        bot.say(sc ? 'Some ' + SCOPE[sc].short + ' projects we’ve handed over:' : 'A few homes we handed over this year:', { cards: list.slice(0, 4).map(function (w) { return { title: w.t, sub: w.s, badge: w.badge, price: L(w.l), priceLabel: 'final cost', buttons: [B('Price something like this', 'act:scope:' + w.kind)] }; }), buttons: [B('Book a free site visit', 'flow:visit')] });
        bot.event('action', { action: 'portfolio' });
      } },
      { id: 'emi', label: 'EMI', kw: ['emi', 'instalment', 'installment', 'finance', 'loan', 'monthly'], priority: 1, run: function (bot) { bot.say('Yes: **0% EMI for 6 months** or low-cost EMI up to 24 months through our finance partner, on orders above ₹3 L. A ₹6 L kitchen at 12 months comes to about **₹52,000 a month**.', { buttons: [B('What will it cost?', 'flow:estimate'), B('Book a free site visit', 'flow:visit')] }); } }
    ],
    flows: {
      estimate: { intent: 'estimate', slots: [
        { name: 'scope', ask: function (bot) { bot.say('What are we designing?', { buttons: ORDER.map(function (k) { return B(SCOPE[k].n, 'slot:scope=' + k); }) }); }, parse: scopeFrom, hint: 'A kitchen, wardrobes, a full home, a bathroom or painting.' },
        { name: 'size', ask: function (bot, s) { var S = SCOPE[s.scope]; bot.say(S.ask, { buttons: S.typ.map(function (z) { return B(S.unit === 'bhk' ? z + ' BHK' : S.unit === 'n' ? z + (z > 1 ? ' bathrooms' : ' bathroom') : z + (S.unit === 'rft' ? ' ft' : ' sq ft'), 'slot:size=' + z); }) }); }, parse: function (t, bot, s) { return sizeFrom(hi(t), s.scope); }, coerce: function (v) { return +v; }, validate: function (v, bot, s) { var u = SCOPE[s.scope].unit; return (u === 'bhk' && (v < 1 || v > 6)) ? 'Between 1 and 6 bedrooms, please.' : (u === 'rft' && (v < 6 || v > 60)) ? 'Most kitchens are 8 to 40 running feet.' : (u === 'sqft' && (v < 10 || v > 600)) ? 'Between 10 and 600 sq ft, please.' : (u === 'n' && (v < 1 || v > 6)) ? 'Between 1 and 6, please.' : ''; } },
        { name: 'fin', ask: function (bot) { bot.say('Which finish feels right?', { cards: Object.keys(FIN).map(function (k) { return { title: FIN[k][0], sub: FIN[k][1], buttons: [B('Choose ' + FIN[k][0], 'slot:fin=' + k)] }; }) }); }, parse: finFrom }
      ], done: function (bot, s) {
        var S = SCOPE[s.scope], e = estimate(s.scope, +s.size, s.fin), sz = S.unit === 'bhk' ? s.size + ' BHK' : S.unit === 'n' ? s.size + ' bathroom' + (s.size > 1 ? 's' : '') : s.size + (S.unit === 'rft' ? ' running ft' : ' sq ft');
        bot.mem.est = { scope: s.scope, size: +s.size, fin: s.fin, lo: e.lo, hi: e.hi };
        bot.say('Here’s a first number from our rate card. The fixed quote comes after a designer measures, usually within ±10%.', { cards: [{ title: S.n, sub: sz + ' · ' + FIN[s.fin][0] + ' finish', badge: 'Estimate', price: L(e.lo) + ' – ' + L(e.hi), priceLabel: 'incl. GST', meta: [e.w[0] + ' to ' + e.w[1] + ' weeks from design sign-off', S.inc, '10-year warranty on carcass and hardware'] }], buttons: [B('Book a free site visit', 'flow:visit'), B('Try another finish', 'act:refin:1'), B('EMI options', 'intent:emi')] });
        bot.event('booking', { kind: 'estimate' }); lead(bot, 'estimate', { scope: S.n, size: sz, finish: FIN[s.fin][0], low_lakh: Math.round(e.lo * 10) / 10, high_lakh: Math.round(e.hi * 10) / 10 });
      } },
      visit: { intent: 'visit', slots: [
        { name: 'scope', ask: function (bot) { if (bot.mem.est) { bot.slots.scope = bot.mem.est.scope; bot._advance(); return; } bot.say('What’s the project? So the right designer comes.', { buttons: ORDER.map(function (k) { return B(SCOPE[k].n, 'slot:scope=' + k); }) }); }, parse: scopeFrom },
        { name: 'area', ask: function (bot) { bot.say('Where’s the home?', { buttons: AREAS.map(function (a) { return B(a, 'slot:area=' + a); }) }); }, parse: function (t) { var hit; AREAS.forEach(function (a) { if (hi(t).indexOf(a.toLowerCase()) >= 0) hit = a; }); return hit; }, hint: 'Gurugram, South Delhi, Noida, Dwarka, Ghaziabad or Faridabad.' },
        { name: 'date', ask: function (bot) { var d = days(5); bot.say('Which day suits you? Visits take about an hour.', { buttons: d.map(function (x) { var free = SLOTS.filter(function (w) { return !taken(bot, iso(x), w[0]); }).length; return B((O.fmtDay ? O.fmtDay(x) : iso(x)) + ' · ' + free + ' slots', 'slot:date=' + iso(x)); }) }); }, parse: function (t) { var w = N.when(hi(t)); return w && w.iso ? w.iso : undefined; } },
        { name: 'time', ask: function (bot, s) { var open = SLOTS.filter(function (w) { return !taken(bot, s.date, w[0]); }); if (!open.length) { bot.say('**' + dayLabel(s.date) + '** is full. Another day?'); delete bot.slots.date; bot._advance(); return; } bot.say('Open slots on **' + dayLabel(s.date) + '**:', { buttons: SLOTS.map(function (w) { var tk = taken(bot, s.date, w[0]); return B(w[1] + (tk ? ' · taken' : ''), tk ? 'say:another time' : 'slot:time=' + w[0]); }) }); }, parse: function (t) { t = hi(t); var m = t.match(/\b(11|1|4|6)\s*(am|pm)?\b/); if (m) return { '11': '11:00', '1': '13:00', '4': '16:00', '6': '18:00' }[m[1]]; return /morning/.test(t) ? '11:00' : /afternoon/.test(t) ? '13:00' : /evening/.test(t) ? '18:00' : undefined; } },
        { name: 'name', ask: function (bot) { if (bot.user.name) { bot.slots.name = bot.user.name; bot._advance(); return; } bot.say('Who will the designer meet?'); }, parse: nameOk, hint: 'Just a name.' },
        { name: 'contact', ask: function (bot, s) { bot.say('And a mobile number, ' + s.name.split(' ')[0] + '? The designer calls 30 minutes before.'); }, parse: function (t) { return N.phone(t) || N.email(t); }, hint: 'A 10-digit mobile number or an email.' }
      ], done: function (bot, s) {
        var S = SCOPE[s.scope], Ls = bot.db('visits') || [], r = 'SV-' + (3110 + Ls.length * 3), slot = SLOTS.filter(function (w) { return w[0] === s.time; })[0];
        bot.user.name = s.name; if (/@/.test(s.contact)) bot.user.email = s.contact; else bot.user.phone = s.contact;
        Ls.push({ ref: r, name: s.name, phone: /@/.test(s.contact) ? '' : s.contact, scope: s.scope, area: s.area, date: s.date, time: s.time, t: Date.now(), source: bot.source, convo: bot.id }); bot.save('visits', Ls);
        bot.say('Booked, ' + s.name.split(' ')[0] + '. A designer will see you on **' + dayLabel(s.date) + ' at ' + slot[1] + '**.', { cards: [{ title: 'Site visit · ' + dayLabel(s.date), sub: S.n + ' · ' + s.area, badge: r, meta: [slot[1] + ', about an hour', 'We measure, take photos and talk through ideas', 'Free. A 3D design and fixed quote follow within 5 days'] }], buttons: [B('Add it to my calendar', 'say:thanks'), B('Show me homes like mine', 'intent:work')] });
        bot.event('booking', { kind: 'site_visit' }); lead(bot, 'site_visit', { ref: r, scope: S.n, area: s.area, date: s.date, time: slot[1], estimate: bot.mem.est ? L(bot.mem.est.lo) + ' – ' + L(bot.mem.est.hi) : '' }, { name: s.name, phone: /@/.test(s.contact) ? '' : s.contact, email: /@/.test(s.contact) ? s.contact : undefined });
      } },
      status: { intent: 'status', slots: [
        { name: 'code', ask: function (bot) { bot.say('What’s your project number? It’s on the design sign-off and every Friday update, like **LH-3184**.', { buttons: [B('LH-3184', 'slot:code=LH-3184')] }); }, parse: function (t) { var m = String(t).match(/\bLH[- ]?(\d{4})\b|\b(31\d{2})\b/i); return m ? 'LH-' + (m[1] || m[2]) : undefined; }, hint: 'Project numbers look like LH-3184.' },
        { name: 'surname', ask: function (bot, s) { bot.say('And the family name on the project?', s.code === 'LH-3184' ? { buttons: [B('Kapoor', 'slot:surname=Kapoor')] } : undefined); }, parse: function (t) { var w = String(t).trim().split(/\s+/).pop(); return /^[a-z][a-z'-]{1,30}$/i.test(w) ? w : undefined; } }
      ], done: function (bot, s) {
        var J = (bot.db('projects') || []).filter(function (x) { return x.code === s.code; })[0];
        if (!J || J.client.toLowerCase() !== String(s.surname).toLowerCase()) { bot.say('I can’t match **' + s.code + '** with that name. Check the number on your sign-off, or I’ll have your designer call.', { buttons: [B('Try again', 'flow:status'), B('Talk to a designer', 'handover')] }); return; }
        bot.user.name = bot.user.name || J.name;
        bot.say(J.name.split(' ')[0] + ', your project is at **' + STAGES[J.stage].toLowerCase() + '**, about ' + J.pct + '% done. Next: ' + J.next.toLowerCase() + ', around **' + (O.fmtDay ? O.fmtDay(new Date(J.due)) : '') + '**.', { cards: [{ title: J.code + ' · ' + J.title, sub: '“' + J.note + '”', badge: STAGES[J.stage], price: J.pct + '%', priceLabel: 'complete', meta: STAGES.map(function (st, i) { return (i < J.stage ? '✓ ' : i === J.stage ? '● ' : '○ ') + st; }).concat(['Your lead: ' + J.lead]) }], buttons: [B('Talk to ' + J.lead.split(' ')[0], 'handover'), B('That’s all', 'say:thanks')] });
        bot.event('booking', { kind: 'project_lookup' }); lead(bot, 'project_status', { code: J.code, stage: STAGES[J.stage] }, { name: J.name });
      } }
    },
    actions: {
      scope: function (bot, sc) { bot.startFlow('estimate', { scope: sc }); },
      refin: function (bot) { var e = bot.mem.est || {}; bot.startFlow('estimate', { scope: e.scope, size: e.size }); }
    },
    freeText: function (bot, m) {
      if (m.ent.scope && (m.ent.size || m.ent.fin)) { bot.startFlow('estimate', { scope: m.ent.scope, size: m.ent.size, fin: m.ent.fin }); return true; }
      if (m.ent.scope) { bot.say(SCOPE[m.ent.scope].n + ', lovely. Shall I price it, or book a designer to come and measure?', { buttons: [B('Price it', 'act:scope:' + m.ent.scope), B('Book a free site visit', 'flow:visit')] }); return true; }
      return false;
    },
    kb: [
      { id: 'warranty', q: 'What warranty do you give?', a: '**10 years** on carcass and hardware, 1 year on installation and finishes, in writing. Service visits in the first year are free.', keys: ['warranty', 'guarantee', 'how long will it last'] },
      { id: 'ply', q: 'What material do you use?', a: 'Kitchens and bathrooms use **BWP (boiling water proof) ply**; wardrobes use BWR ply. No particle board in wet areas, ever.', keys: ['material', 'ply', 'plywood', 'mdf', 'particle board', 'bwp'] },
      { id: 'time', q: 'How long does it take?', a: 'A kitchen takes **4 to 6 weeks** from design sign-off; a full 3 BHK takes **8 to 10 weeks**. The site is ready for you on the date in your contract, or we pay a delay credit.', keys: ['how long', 'timeline', 'time taken', 'weeks', 'delivery time', 'kitne din'] },
      { id: 'pay', q: 'How do payments work?', a: '**10%** to book the design, **50%** when production starts, **40%** before installation. Every payment gets a GST invoice.', keys: ['payment', 'advance', 'payment terms', 'instalments', 'booking amount'] },
      { id: 'fee', q: 'Do you charge for design?', a: 'The site visit and first 3D design are free. If you go ahead, the design fee is part of the project price.', keys: ['design fee', 'design charges', 'consultation fee', 'free design'] },
      { id: 'visitfree', q: 'Is the site visit free?', a: 'Yes, completely free and without obligation. About an hour: we measure, take photos and talk through ideas.', keys: ['visit free', 'visit charge', 'free visit', 'free consultation'], buttons: [B('Book a free site visit', 'flow:visit')] },
      { id: '3d', q: 'Will I see a 3D design?', a: 'Yes. You get photo-real 3D views of every room within **5 working days** of the visit, with two rounds of changes included.', keys: ['3d', 'render', 'design preview', 'see the design', 'drawings'] },
      { id: 'areas', q: 'Where do you work?', a: 'Gurugram, South Delhi, Noida, Dwarka, Ghaziabad and Faridabad. Further out, we take full-home projects only.', keys: ['where do you work', 'service area', 'location', 'do you cover', 'city'] },
      { id: 'gst', q: 'Are prices inclusive of GST?', a: 'Every estimate and quote includes **18% GST**. You get a GST invoice for each payment.', keys: ['gst', 'tax', 'inclusive', 'invoice'] },
      { id: 'appl', q: 'Do you supply appliances?', a: 'Yes, at dealer prices: chimney, hob, built-in oven and dishwasher. Or bring your own and we’ll fit them.', keys: ['appliance', 'chimney', 'hob', 'oven', 'dishwasher'] },
      { id: 'carp', q: 'Why modular and not a carpenter?', a: 'Factory-made units are machine-cut, edge-banded and finished in a dust-free booth, so they last longer and install in days instead of weeks of on-site work.', keys: ['carpenter', 'modular vs', 'local carpenter', 'site made'] },
      { id: 'after', q: 'What about after-sales service?', a: 'Raise a request on WhatsApp and a technician visits within **72 hours**. Hinge or channel fixes are free for 10 years.', keys: ['after sales', 'service', 'repair', 'complaint', 'support'] },
      { id: 'changes', q: 'Can I change the design later?', a: 'Two rounds of changes are included before sign-off. After production starts, changes are possible but may add time.', keys: ['change design', 'revision', 'modify', 'alteration'] },
      { id: 'site', q: 'Can I see a finished home?', a: 'Yes. We arrange walk-throughs of finished homes in Gurugram and Noida most weekends, with the owner’s permission.', keys: ['see a finished', 'experience centre', 'showroom', 'walkthrough', 'visit a home'], buttons: [B('Show me homes like mine', 'intent:work')] },
      { id: 'rent', q: 'Do you do rented homes?', a: 'Yes. We design freestanding pieces that move with you, and avoid drilling into tiles where the landlord says no.', keys: ['rented', 'rental', 'landlord', 'tenant'] },
      { id: 'hours', q: 'When is the studio open?', a: 'Monday to Saturday, 10 am to 7 pm, at Sector 44, Gurugram. This chat answers around the clock.', keys: ['timing', 'open', 'hours', 'studio address', 'office'] }
    ]
  });
})();
