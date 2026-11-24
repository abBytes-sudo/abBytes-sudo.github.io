/* Agent: Atelier Nori (fictional interior design studio, Bengaluru). The studio's own front desk: prices a room, books a
   consultation on a real slot picker, runs the three-question style quiz (and restyles the live 3D room on the page),
   and looks up a client project's stage. Everything it books lands in the studio's staff screen (interior/studio.html).
   Rate cards, slots and projects are made-up demo data. Demo only: nothing leaves the browser. */
(function () {
  'use strict';
  var O = window.Orbit, N = O.nlp, B = function (l, v) { return { label: l, value: v }; };
  var R = function (n) { return O.money(n, '₹'); };
  var PH = function (f) { return O.samples('interior/bot/' + f.replace(/\.jpg$/, '.webp')); };
  var DAY = 864e5;

  var HI = [[/\b(kitne|kitna|kitni) (ka|ki|ke|mein|me)( hoga| padega| hai)?\b|\bkharcha kitna\b|\bbudget kya\b/g, 'how much'], [/\bkal subah\b/g, 'tomorrow morning'], [/\bkal shaam\b/g, 'tomorrow evening'], [/\bparso\b/g, 'day after tomorrow'], [/\bkal\b/g, 'tomorrow'], [/\baaj\b/g, 'today'], [/\bsubah\b/g, 'morning'], [/\b(shaam|sham)\b/g, 'evening'], [/\bdopahar\b/g, 'afternoon'],
    [/\b(haan|haa|haanji|ha ji)\b/g, 'yes'], [/\b(nahi|nahin)\b/g, 'no'], [/\b(ghar|makaan)\b/g, 'home'], [/\bkamra\b/g, 'room'], [/\b(rasoi)\b/g, 'kitchen'], [/\bbaat (karni|karna) (hai|h)\b/g, 'talk to a person'], [/\b(milna|milte) (hai|hain)\b/g, 'book a consultation'], [/\b(dikhao|dikha do)\b/g, 'show me'], [/\bkab tak\b/g, 'how long'], [/\bmera project\b/g, 'my project']];
  function hi(t) { var s = ' ' + String(t).toLowerCase() + ' '; HI.forEach(function (p) { s = s.replace(p[0], p[1]); }); return s.trim(); }

  /* ---------- rate card: ₹ per sq ft, design and execution, before GST ---------- */
  var ROOM = {
    living: { n: 'Living room', typ: 280, sizes: [180, 280, 420], rate: { essential: [1400, 2200], considered: [2400, 3600], bespoke: [3800, 6000] }, wk: [6, 9], img: 'room-1.jpg', inc: 'layout, 3D walkthrough, furniture, lighting and soft furnishings' },
    bedroom: { n: 'Bedroom', typ: 180, sizes: [130, 180, 260], rate: { essential: [1200, 1900], considered: [2000, 3200], bespoke: [3400, 5200] }, wk: [5, 8], img: 'bedroom.jpg', inc: 'layout, wardrobes, bed and headboard, lighting and linen' },
    kitchen: { n: 'Kitchen and dining', typ: 160, sizes: [100, 160, 240], rate: { essential: [2600, 3800], considered: [4000, 6200], bespoke: [6500, 10000] }, wk: [7, 11], img: 'room-2.jpg', inc: 'joinery drawings, worktops, appliances plan, lighting and the dining table' },
    bathroom: { n: 'Bathroom', typ: 60, sizes: [40, 60, 90], rate: { essential: [2200, 3200], considered: [3400, 5200], bespoke: [5600, 9000] }, wk: [4, 7], img: 'bath-oak.jpg', inc: 'waterproofing, stone and tile, fittings, vanity and lighting' },
    study: { n: 'Study or home office', typ: 110, sizes: [80, 110, 160], rate: { essential: [1100, 1700], considered: [1800, 2800], bespoke: [3000, 4600] }, wk: [4, 6], img: 'room-5.jpg', inc: 'desk joinery, shelving, task lighting and acoustics' },
    home: { n: 'Whole home', typ: 1400, sizes: [900, 1400, 2200], rate: { essential: [1300, 2000], considered: [2200, 3400], bespoke: [3600, 5800] }, wk: [14, 22], img: 'poster-wide.jpg', inc: 'every room, kitchen and baths, lighting plan, furniture and styling' },
    commercial: { n: 'Small commercial', typ: 900, sizes: [500, 900, 1500], rate: { essential: [1500, 2400], considered: [2600, 4000], bespoke: [4200, 6800] }, wk: [8, 14], img: 'room-3.jpg', inc: 'brand-led layout, joinery, lighting and signage coordination' }
  };
  var ORDER = ['living', 'bedroom', 'kitchen', 'bathroom', 'study', 'home', 'commercial'];
  var TIER = { essential: ['Essential', 'Good materials, ready-made furniture, a calm finish', .08], considered: ['Considered', 'Custom joinery, natural materials, a lighting plan', .1], bespoke: ['Bespoke', 'Everything drawn for you: stone, solid wood, made-to-order pieces', .12] };
  var STY = {
    japandi: { n: 'Japandi', d: 'Calm, natural and quiet: pale oak, linen, soft sage and nothing extra.', p: ['room-1.jpg', 'House on the hill', 'Living room · 46 m² · 2025'] },
    midcentury: { n: 'Mid-century', d: 'Warm walnut, mustard and teal, with shapes that never date.', p: ['room-2.jpg', 'The long table', 'Kitchen and dining · 38 m² · 2024'] },
    coastal: { n: 'Coastal', d: 'Light, airy and relaxed: white oak, sand and sea blues.', p: ['bath-oak.jpg', 'Oak and stone bath', 'Bathroom · 9 m² · 2025'] },
    moody: { n: 'Moody', d: 'Deep green walls, rust velvet and brass, made for evenings.', p: ['room-4.jpg', 'The tea room', 'Tea room · 14 m² · 2025'] }
  };
  var WORK = [['room-1.jpg', 'House on the hill', 'Japandi living room, 46 m²', 'living'], ['room-2.jpg', 'The long table', 'Warm minimal kitchen and dining, 38 m²', 'kitchen'], ['room-4.jpg', 'The tea room', 'Moody tea room, 14 m²', 'living'], ['bedroom.jpg', 'Arched oak bedroom', 'Warm minimal bedroom, 17 m²', 'bedroom'], ['bath-stone.jpg', 'Stone vanity', 'Bathroom in oak and stone, 8 m²', 'bathroom'], ['room-5.jpg', 'The quiet study', 'Study with timber desk, 11 m²', 'study']];
  var MODES = { studio: ['Studio visit', 'At the studio in Indiranagar, with samples on the table', 75], home: ['Home visit', 'We come to you, measure and listen (Bengaluru)', 90], video: ['Video call', 'Anywhere, with a shared moodboard', 45] };
  var SLOTS = ['10:30', '12:00', '15:00', '17:30'];
  var STAGES = ['Consultation', 'Concept', 'Design plan', 'Procurement', 'Site work', 'Styling', 'Handover'];

  function roomFrom(t) {
    t = hi(t);
    if (/\b(whole|entire|full|complete) (home|house|flat|apartment|villa)\b|\b\d\s*bhk\b|\bnew (flat|home|apartment)\b|\bturnkey\b/.test(t)) return 'home';
    if (/\b(cafe|café|office|studio space|boutique|clinic|salon|shop|restaurant|commercial)\b/.test(t) && !/home office/.test(t)) return 'commercial';
    if (/\b(kitchen|dining|modular)\b/.test(t)) return 'kitchen'; if (/\b(bath|bathroom|toilet|washroom|powder room)\b/.test(t)) return 'bathroom';
    if (/\b(bedroom|master|kids room|nursery|guest room)\b/.test(t)) return 'bedroom'; if (/\b(study|home office|work from home|wfh)\b/.test(t)) return 'study';
    if (/\b(living|lounge|drawing room|hall|family room)\b/.test(t)) return 'living'; return undefined;
  }
  function tierFrom(t) { t = hi(t); return /\b(essential|basic|budget|simple|affordable|economical)\b/.test(t) ? 'essential' : /\b(bespoke|luxury|premium|high end|high-end|custom everything)\b/.test(t) ? 'bespoke' : /\b(considered|mid|standard|balanced|middle)\b/.test(t) ? 'considered' : undefined; }
  function sizeFrom(t, room) {
    var a = N.area(t); if (a) return a; var m = String(t).toLowerCase().replace(/,/g, '').match(/\b(\d{2,5})\s*(sq|sft|square|feet|ft)?\b/); if (m && +m[1] >= 30 && +m[1] <= 12000) return +m[1];
    m = String(t).match(/\b(\d{1,3})\s*(m2|m²|sqm|square met)/i); if (m) return Math.round(+m[1] * 10.764);
    if (room && /\bsmall\b/i.test(t)) return ROOM[room].sizes[0]; if (room && /\b(medium|average|normal)\b/i.test(t)) return ROOM[room].sizes[1]; if (room && /\b(large|big)\b/i.test(t)) return ROOM[room].sizes[2];
    var b = N.bhk(t); if (b) return [0, 650, 1050, 1450, 1900, 2400][Math.min(5, b)];
    return undefined;
  }
  function est(room, size, tier) { var r = ROOM[room], rt = r.rate[tier], k = size > r.typ * 2 ? .93 : size < r.typ * .6 ? 1.08 : 1; return { lo: Math.round(size * rt[0] * k / 5000) * 5000, hi: Math.round(size * rt[1] * k / 5000) * 5000, wk: [r.wk[0] + (tier === 'bespoke' ? 2 : 0), r.wk[1] + (tier === 'bespoke' ? 3 : 0)] }; }
  function nameOk(t) { var n = N.name(t); return n && !/^(morning|afternoon|evening|night|today|tomorrow|yes|no|ok|okay|sure|fine|thanks|thank you|hello|hi|any|anytime|whenever|later|done|that|this)$/i.test(n.trim()) && !/\d|@/.test(t) ? n : undefined; }
  function lead(bot, intent, payload, extra) { payload = payload || {}; payload.convo = bot.id; payload.section = bot.ctx.section || ''; var l = { intent: intent, payload: payload }; if (extra) for (var k in extra) l[k] = extra[k]; if (!l.name && !bot.user.name) l.name = 'Website visitor'; return bot.lead(l); }
  function days(n) { var out = [], d = new Date(); d.setHours(0, 0, 0, 0); while (out.length < n) { d = new Date(d.getTime() + DAY); if (d.getDay() !== 1) out.push(new Date(d)); } return out; }
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function taken(bot, dIso, t) { var bk = bot.db('bookings') || []; if (bk.some(function (b) { return b.date === dIso && b.time === t && b.status !== 'cancelled'; })) return true; var h = 0; (dIso + t).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) | 0; }); return Math.abs(h) % 3 === 0; }
  function dayLabel(dIso) { var p = dIso.split('-'); return O.fmtDay(new Date(+p[0], +p[1] - 1, +p[2])); }
  function code(prefix, list) { return prefix + (1040 + (list ? list.length : 0) + Math.floor(Math.random() * 9)); }
  function restyle(style) { try { var map = { japandi: 0, midcentury: 1, coastal: 2, moody: 3 }; [1, 2, 3].forEach(function (q) { var b = document.querySelectorAll('.q[data-q="' + q + '"] .opt')[map[style]]; if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); }); return !!document.querySelector('#qGo'); } catch (e) { return false; } }

  var MENU = [B('Price my room', 'flow:price'), B('Book a consultation', 'flow:book'), B('Take the style quiz', 'flow:quiz'), B('My project’s status', 'flow:status'), B('See our work', 'intent:work')];

  O.registerAgent({
    id: 'nori', name: 'Atelier Nori', business: 'Atelier Nori', role: 'Studio front desk', industry: 'Interior design', initials: 'AN', accent: '#A45E3B', phoneLabel: 'Atelier Nori studio',
    blurb: 'The studio’s own front desk: prices a room in four taps, books a consultation on a live slot picker, runs the style quiz and looks up a project’s stage.',
    helloLine: 'I can price a room, book a consultation or look up your project.',
    samples: ['how much for a 280 sq ft living room', 'book a home visit saturday morning', 'kitchen kitne ka padega', 'status of NR-2417'],
    kind: 'customer', menu: MENU,
    contexts: [{ label: 'Looking at the work', context: { section: 'work' } }, { label: 'In the style quiz', context: { section: 'style' } }],
    synonyms: { 'how much': ['kitne ka padega', 'kitne ka hoga', 'kitna padega', 'kitna hoga', 'kitne ka hai', 'kitna hai', 'kitne ka', 'kitna', 'kitni', 'kharcha kitna', 'kharcha'], 'book a consultation': ['milte hai', 'milte hain', 'milna hai', 'mil sakte', 'appointment chahiye', 'visit chahiye', 'schedule a call'], 'style quiz': ['what is my style', 'find my style'], 'my project': ['mera project', 'hamara project'], 'how long': ['kab tak', 'kitne din', 'kitna time'], 'talk to a person': ['baat karni hai', 'baat karna hai', 'designer se baat'] },
    seeds: {
      bookings: function () { var d = days(6), now = Date.now(); return [
        { ref: 'AN-1031', name: 'Riya Sharma', phone: '+91 98450 •• 214', room: 'living', mode: 'studio', date: iso(d[0]), time: '12:00', status: 'confirmed', t: now - 3 * DAY, source: 'Website chat', note: 'Wants to keep her grandmother’s rosewood chair.' },
        { ref: 'AN-1032', name: 'Arjun & Meghna Rao', phone: '+91 99001 •• 087', room: 'home', mode: 'home', date: iso(d[1]), time: '10:30', status: 'confirmed', t: now - 2 * DAY, source: 'Instagram ad', note: '3 BHK in Whitefield, handover in March.' },
        { ref: 'AN-1033', name: 'Sameer Kapoor', email: 'sameer.k@example.com', room: 'commercial', mode: 'video', date: iso(d[2]), time: '17:30', status: 'confirmed', t: now - DAY, source: 'Google search', note: 'A 900 sq ft café in Jayanagar.' }]; },
      projects: function () { var now = Date.now(); return [
        { code: 'NR-2417', client: 'Iyer', name: 'Meera Iyer', title: 'Living and dining, Koramangala', stage: 3, pct: 52, designer: 'Kavya (lead designer)', next: 'Sofa and dining table arrive', due: now + 9 * DAY, note: 'Oak samples approved. Linen curtains ordered from the Kannur weavers.', img: 'room-1.jpg' },
        { code: 'NR-2398', client: 'Bose', name: 'Ritwik Bose', title: 'Kitchen, Indiranagar', stage: 4, pct: 71, designer: 'Arun (site lead)', next: 'Worktop template and fitting', due: now + 4 * DAY, note: 'Carcasses installed. Plumbing points moved as drawn.', img: 'room-2.jpg' },
        { code: 'NR-2431', client: 'Khan', name: 'Sana Khan', title: 'Bedroom and bath, HSR Layout', stage: 1, pct: 18, designer: 'Kavya (lead designer)', next: 'Concept presentation', due: now + 3 * DAY, note: 'Moodboard draft ready; two layout options for the bath.', img: 'bedroom.jpg' },
        { code: 'NR-2380', client: 'Menon', name: 'Diya Menon', title: 'Tea room and study, Frazer Town', stage: 5, pct: 92, designer: 'Ira (principal)', next: 'Styling day and handover walk', due: now + 2 * DAY, note: 'Paint cured. Lamp rewired. Rugs arrive Thursday.', img: 'room-4.jpg' }]; }
    },
    nudge: function (c) {
      if (c.section === 'work') return { text: 'Like one of these rooms? I can tell you roughly what a room like it would cost, in four taps.', cta: 'Price a room', button: B('Price my room', 'flow:price') };
      if (c.section === 'style') return { text: 'Not sure which answer is you? Take the quiz with me and I’ll show you rooms we’ve made in that style.', cta: 'Take it here', button: B('Take the style quiz', 'flow:quiz') };
      if (c.section === 'book' || c.section === 'process') return { text: 'Rather pick a time yourself? I can show you open consultation slots this week.', cta: 'See open slots', button: B('Book a consultation', 'flow:book') };
      if (c.section === 'room') return { text: 'Changing styles in the 3D room? I can price that room in your size and finish.', cta: 'Price it', button: B('Price my room', 'flow:price') };
      return { text: 'Planning a room? I can give you a first number and an open slot with a designer.', cta: 'Let’s start', button: B('Price my room', 'flow:price') };
    },
    greeting: function (bot) {
      var c = bot.ctx;
      if (c.from === 'web') { bot.say('Hello' + (c.name ? ' ' + c.name.split(' ')[0] : '') + ', this is Atelier Nori on WhatsApp. Send photos of your room any time; a designer reads them every morning.', { buttons: MENU.slice(0, 4) }); return; }
      var open = 'Hello, welcome to Atelier Nori. ';
      if (c.section === 'work') { bot.say(open + 'Those are three rooms we’ve lived with for a while. I can tell you what a room like one of them would cost, or find you a time with a designer.', { buttons: [B('Price a room like these', 'flow:price'), B('Book a consultation', 'flow:book'), B('See more work', 'intent:work')] }); return; }
      if (c.section === 'style') { bot.say(open + 'Three questions, one room. Shall we take the style quiz together? I’ll restyle the 3D room above as we go.', { buttons: [B('Take the style quiz', 'flow:quiz'), B('Price my room', 'flow:price'), B('Something else', 'menu')] }); return; }
      if (c.section === 'book' || c.section === 'process') { bot.say(open + 'I can book your consultation right here and show you the open slots. Studio, home visit or a video call.', { buttons: [B('Book a consultation', 'flow:book'), B('What does it cost?', 'say:consultation fee'), B('Something else', 'menu')] }); return; }
      if (c.section === 'room') { bot.say(open + 'Enjoying the walk-through? I can price that room in your size and finish, or take you through the style quiz.', { buttons: [B('Price this room', 'act:price:living'), B('Take the style quiz', 'flow:quiz'), B('Book a consultation', 'flow:book')] }); return; }
      bot.say(open + 'I can give you a first number for a room, book you a consultation with a designer, take the style quiz with you, or look up a project we’re building.', { buttons: MENU });
    },
    extract: function (text, bot) {
      var e = {}, t = hi(text), r = roomFrom(t), tr = tierFrom(t), w = N.when(t), em = N.email(text), ph = N.phone(text), pc = String(text).match(/\bNR[- ]?(\d{4})\b/i);
      if (r) e.room = r; if (tr) e.tier = tr; var sz = sizeFrom(t, r || bot.slots.room); if (sz && (r || bot.flow === 'price' || /sq|ft|feet|m2|sqm|bhk/i.test(text))) e.size = sz;
      if (w && w.iso) e.date = w.iso; if (w && w.part) e.part = w.part; if (em) e.contact = em; else if (ph) e.contact = ph; if (pc) e.code = 'NR-' + pc[1];
      if (/\b(studio|indiranagar)\b/.test(t)) e.mode = 'studio'; else if (/\b(home visit|at home|come to|my place|site visit)\b/.test(t)) e.mode = 'home'; else if (/\b(video|zoom|online|call|virtual|meet)\b/.test(t) && !/\bcall me\b/.test(t)) e.mode = 'video';
      return e;
    },
    intents: [
      { id: 'price', label: 'Price my room', kw: ['how much', 'price', 'cost', 'estimate', 'quote', 'budget', 'per sq ft', 'rate', 'expensive', 'afford'], re: [/\b(how much|cost|price|estimate)\b.*\b(room|kitchen|bath|bedroom|home|flat|study|office|cafe|living)\b/i], priority: 1, run: function (bot, m) { bot.startFlow('price', { room: m.ent.room, size: m.ent.size, tier: m.ent.tier }); } },
      { id: 'book', label: 'Book a consultation', kw: ['book', 'book a consultation', 'appointment', 'meet', 'visit', 'slot', 'available', 'when can', 'schedule', 'call me', 'talk to a designer'], re: [/\b(book|schedule|fix)\b/i], priority: 1, run: function (bot, m) { bot.startFlow('book', { room: m.ent.room, mode: m.ent.mode, date: m.ent.date, contact: m.ent.contact }); } },
      { id: 'quiz', label: 'Style quiz', kw: ['style quiz', 'quiz', 'my style', 'which style', 'japandi', 'mid-century', 'coastal', 'moody', 'what style'], priority: 1, run: function (bot) { bot.startFlow('quiz'); } },
      { id: 'status', label: 'Project status', kw: ['my project', 'project status', 'status', 'update', 'progress', 'how far', 'when will it be done', 'handover date', 'where are we'], re: [/\bNR[- ]?\d{4}\b/i], priority: 1, run: function (bot, m) { bot.startFlow('status', { code: m.ent.code }); } },
      { id: 'work', label: 'See our work', kw: ['portfolio', 'your work', 'projects', 'examples', 'show me', 'past work', 'photos', 'rooms you have done'], priority: 0, run: function (bot, m) { var r = m.ent && m.ent.room, L = WORK.filter(function (w) { return !r || w[3] === r; }); if (!L.length) L = WORK; bot.say(r ? 'A few ' + ROOM[r].n.toLowerCase() + 's we’ve made:' : 'A few rooms from the last two years. Each was drawn and lit in 3D before anything was bought.', { cards: L.slice(0, 4).map(function (w) { return { title: w[1], sub: w[2], img: PH(w[0]), meta: ['From our work'], buttons: [B('Price a room like this', 'act:price:' + w[3]), B('Book a consultation', 'act:book:' + w[3])] }; }), buttons: [B('Take the style quiz', 'flow:quiz'), B('Price my room', 'flow:price')] }); } }
    ],
    flows: {
      price: { intent: 'price', slots: [
        { name: 'room', ask: function (bot) { bot.say('Which room are we pricing?', { buttons: ORDER.map(function (k) { return B(ROOM[k].n, 'slot:room=' + k); }) }); }, parse: roomFrom, hint: 'A room type, like living room, kitchen or whole home.' },
        { name: 'size', ask: function (bot, s) { var r = ROOM[s.room]; bot.say('Roughly how big is it? Square feet is fine, or pick the nearest.', { buttons: r.sizes.map(function (z, i) { return B(['Compact', 'Typical', 'Generous'][i] + ' · ' + z.toLocaleString('en-IN') + ' sq ft', 'slot:size=' + z); }) }); }, parse: function (t, bot, s) { return sizeFrom(t, s.room); }, coerce: function (v) { return +v; }, validate: function (v, bot, s) { return v < 25 ? 'That seems very small. In square feet, roughly?' : v > 15000 ? 'That’s larger than we take on through the website. A person can help with that one.' : ''; }, hint: 'A number in square feet, like 280, or “about 26 m²”.' },
        { name: 'tier', ask: function (bot) { bot.say('And the finish you have in mind?', { buttons: Object.keys(TIER).map(function (k) { return B(TIER[k][0] + ' · ' + TIER[k][1].split(',')[0].toLowerCase(), 'slot:tier=' + k); }) }); }, parse: tierFrom }
      ], done: function (bot, s) {
        var r = ROOM[s.room], e = est(s.room, +s.size, s.tier), T = TIER[s.tier];
        bot.mem.est = { room: s.room, size: +s.size, tier: s.tier, lo: e.lo, hi: e.hi };
        bot.say('Here’s a first number for your ' + r.n.toLowerCase() + '. It’s honest but rough; the real one comes after we’ve seen the room.', { cards: [{ title: r.n + ' · ' + T[0], sub: T[1], img: PH(r.img), price: R(e.lo) + ' – ' + R(e.hi), priceLabel: 'design and execution, before GST', meta: ['About ' + (+s.size).toLocaleString('en-IN') + ' sq ft', e.wk[0] + ' to ' + e.wk[1] + ' weeks, concept to styling', 'Design fee included (' + Math.round(T[2] * 100) + '%)', 'Covers ' + r.inc], buttons: [B('Book a consultation', 'act:book:' + s.room), B('Try another finish', 'act:retier:' + s.room)] }], buttons: [B('How do you charge?', 'say:design fee'), B('Take the style quiz', 'flow:quiz')] });
        bot.event('booking', { kind: 'estimate' }); lead(bot, 'estimate', { room: r.n, size: +s.size, tier: T[0], low: e.lo, high: e.hi });
      } },
      book: { intent: 'book', slots: [
        { name: 'room', ask: function (bot) { if (bot.mem.est) { bot.slots.room = bot.mem.est.room; bot._advance(); return; } bot.say('Lovely. What’s the project?', { buttons: ORDER.map(function (k) { return B(ROOM[k].n, 'slot:room=' + k); }) }); }, parse: roomFrom },
        { name: 'mode', ask: function (bot) { bot.say('How would you like to meet?', { cards: Object.keys(MODES).map(function (k) { var M = MODES[k]; return { title: M[0], sub: M[1], meta: [M[2] + ' minutes', k === 'video' ? 'Free' : 'Free, credited to your design fee'], buttons: [B('Choose ' + M[0].toLowerCase(), 'slot:mode=' + k)] }; }) }); }, parse: function (t) { t = hi(t); return /studio|indiranagar/.test(t) ? 'studio' : /home|house|come|site/.test(t) ? 'home' : /video|zoom|online|call|virtual/.test(t) ? 'video' : undefined; } },
        { name: 'date', ask: function (bot) { var d = days(6); bot.say('Which day suits you? The studio rests on Mondays.', { buttons: d.map(function (x) { var free = SLOTS.filter(function (t) { return !taken(bot, iso(x), t); }).length; return B(O.fmtDay(x) + (free ? ' · ' + free + ' open' : ' · full'), 'slot:date=' + iso(x)); }) }); }, parse: function (t) { var w = N.when(hi(t)); return w && w.iso ? w.iso : undefined; }, validate: function (v) { var p = v.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]); if (d.getDay() === 1) return 'We’re closed on Mondays, so the designers can draw. Any other day?'; if (d.getTime() < Date.now() - DAY) return 'That day has passed. Pick one from this week?'; return ''; } },
        { name: 'time', ask: function (bot, s) { var open = SLOTS.filter(function (t) { return !taken(bot, s.date, t); }); if (!open.length) { bot.say('**' + dayLabel(s.date) + '** is fully booked, I’m afraid. Another day?'); delete bot.slots.date; bot._advance(); return; } bot.say('Open on **' + dayLabel(s.date) + '**:', { buttons: SLOTS.map(function (t) { var tk = taken(bot, s.date, t); return B(O.fmtTime(t) + (tk ? ' · taken' : ''), tk ? 'say:that one is taken' : 'slot:time=' + t); }) }); }, parse: function (t, bot, s) { var w = N.when(hi(t)), want = w && w.time, part = w && w.part, open = SLOTS.filter(function (x) { return !taken(bot, s.date, x); }); if (want && open.indexOf(want) >= 0) return want; if (part === 'morning') return open.filter(function (x) { return +x.slice(0, 2) < 12; })[0]; if (part === 'afternoon') return open.filter(function (x) { var h = +x.slice(0, 2); return h >= 12 && h < 17; })[0]; if (part === 'evening') return open.filter(function (x) { return +x.slice(0, 2) >= 17; })[0]; return undefined; }, hint: 'Pick one of the open times above.' },
        { name: 'name', ask: function (bot) { if (bot.user.name) { bot.slots.name = bot.user.name; bot._advance(); return; } bot.say('Who should the designer ask for?'); }, parse: nameOk, hint: 'Just your name, please.' },
        { name: 'contact', ask: function (bot, s) { bot.say('And a phone number or email for the confirmation, ' + s.name.split(' ')[0] + '?'); }, parse: function (t) { return N.email(t) || N.phone(t); }, hint: 'A mobile number or an email address.' }
      ], done: function (bot, s) {
        var M = MODES[s.mode], r = ROOM[s.room], bk = bot.db('bookings') || [], ref = code('AN-', bk);
        bot.user.name = s.name; if (/@/.test(s.contact)) bot.user.email = s.contact; else bot.user.phone = s.contact;
        bk.push({ ref: ref, name: s.name, phone: /@/.test(s.contact) ? '' : s.contact, email: /@/.test(s.contact) ? s.contact : '', room: s.room, mode: s.mode, date: s.date, time: s.time, status: 'confirmed', t: Date.now(), source: bot.source, convo: bot.id, est: bot.mem.est || null }); bot.save('bookings', bk);
        bot.say('You’re booked, ' + s.name.split(' ')[0] + '. We’ll send a confirmation and, the day before, a short list of things to have ready.', { cards: [{ title: M[0] + ' · ' + O.fmtDay(new Date(s.date + 'T00:00')), sub: r.n + ' with Kavya, our lead designer', img: PH(r.img), badge: ref, meta: [O.fmtTime(s.time) + ' · ' + M[2] + ' minutes', s.mode === 'studio' ? 'Atelier Nori, 12th Main, Indiranagar' : s.mode === 'home' ? 'At your home. We bring samples.' : 'Link sent to ' + s.contact, 'Bring: floor plan, photos, one thing you love'], buttons: [B('Add a note for Kavya', 'say:I want to add a note'), B('Change the time', 'flow:book')] }], buttons: [B('Take the style quiz first', 'flow:quiz'), B('That’s all', 'say:bye')] });
        bot.event('booking', { kind: 'consultation' }); lead(bot, 'consultation', { ref: ref, room: r.n, mode: M[0], date: s.date, time: s.time, estimate: bot.mem.est && bot.mem.est.lo ? R(bot.mem.est.lo) + ' – ' + R(bot.mem.est.hi) : '' }, { name: s.name, phone: /@/.test(s.contact) ? '' : s.contact, email: /@/.test(s.contact) ? s.contact : undefined });
      } },
      quiz: { intent: 'quiz', slots: [
        { name: 'q1', ask: function (bot) { bot.say('**I.** Your perfect Sunday?', { buttons: [B('Tea and a quiet book', 'slot:q1=japandi'), B('Records and friends', 'slot:q1=midcentury'), B('A long walk by water', 'slot:q1=coastal'), B('Candles and a film', 'slot:q1=moody')] }); }, parse: function (t) { t = hi(t); return /tea|book|quiet/.test(t) ? 'japandi' : /record|friend|music/.test(t) ? 'midcentury' : /walk|water|sea|beach/.test(t) ? 'coastal' : /candle|film|movie/.test(t) ? 'moody' : undefined; } },
        { name: 'q2', ask: function (bot) { bot.say('**II.** Pick a material.', { buttons: [B('Pale oak', 'slot:q2=japandi'), B('Walnut', 'slot:q2=midcentury'), B('Linen', 'slot:q2=coastal'), B('Velvet', 'slot:q2=moody')] }); }, parse: function (t) { t = hi(t); return /oak/.test(t) ? 'japandi' : /walnut/.test(t) ? 'midcentury' : /linen/.test(t) ? 'coastal' : /velvet/.test(t) ? 'moody' : undefined; } },
        { name: 'q3', ask: function (bot) { bot.say('**III.** And a colour?', { buttons: [B('Sage', 'slot:q3=japandi'), B('Mustard', 'slot:q3=midcentury'), B('Sea blue', 'slot:q3=coastal'), B('Forest green', 'slot:q3=moody')] }); }, parse: function (t) { t = hi(t); return /sage/.test(t) ? 'japandi' : /mustard|yellow/.test(t) ? 'midcentury' : /blue|sea/.test(t) ? 'coastal' : /forest|green|dark/.test(t) ? 'moody' : undefined; } }
      ], done: function (bot, s) {
        var c = {}; [s.q1, s.q2, s.q3].forEach(function (v) { c[v] = (c[v] || 0) + 1; }); var win = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; })[0], S = STY[win], others = Object.keys(STY).filter(function (k) { return k !== win; }).slice(0, 2);
        bot.mem.style = win; var room3d = restyle(win);
        bot.say('You’re **' + S.n + '**. ' + S.d + (room3d ? ' I’ve restyled the 3D room on this page to match.' : ''), { cards: [{ title: S.p[1], sub: S.p[2], img: PH(S.p[0]), badge: S.n, meta: ['From our work'], buttons: [B('Price a room like this', 'act:price:' + (win === 'midcentury' ? 'kitchen' : win === 'coastal' ? 'bathroom' : 'living')), B('Book a consultation', 'flow:book')] }].concat(others.map(function (k) { return { title: STY[k].p[1], sub: STY[k].n + ' · ' + STY[k].p[2], img: PH(STY[k].p[0]), meta: ['Also close to you'], buttons: [B('Price a room like this', 'act:price:living')] }; })), buttons: room3d ? [B('Walk through it in 3D', 'act:tour:1'), B('Book a consultation', 'flow:book')] : [B('Book a consultation', 'flow:book'), B('Price my room', 'flow:price')] });
        bot.event('booking', { kind: 'style_quiz' }); lead(bot, 'style_quiz', { style: S.n, answers: [s.q1, s.q2, s.q3].join(', ') });
      } },
      status: { intent: 'status', slots: [
        { name: 'code', ask: function (bot) { bot.say('Of course. What’s your project number? It’s on every update we send, and looks like **NR-2417**.', { buttons: [B('Use project NR-2417', 'slot:code=NR-2417')] }); }, parse: function (t) { var m = String(t).match(/\bNR[- ]?(\d{4})\b|\b(2\d{3})\b/i); return m ? 'NR-' + (m[1] || m[2]) : undefined; }, hint: 'Project numbers look like NR-2417.' },
        { name: 'surname', ask: function (bot, s) { var p = (bot.db('projects') || []).filter(function (x) { return x.code === s.code; })[0]; bot.say('Thanks. And the family name on the project, so I know it’s you?', p && s.code === 'NR-2417' ? { buttons: [B('It’s Iyer', 'slot:surname=Iyer')] } : undefined); }, parse: function (t) { var w = String(t).trim().split(/\s+/).pop(); return /^[a-z][a-z'-]{1,30}$/i.test(w) ? w : undefined; } }
      ], done: function (bot, s) {
        var L = bot.db('projects') || [], p = L.filter(function (x) { return x.code === s.code; })[0];
        if (!p || p.client.toLowerCase() !== String(s.surname).toLowerCase()) { bot.say('I couldn’t match **' + s.code + '** with that name. Check the number on your last update, or I can ask your designer to message you.', { buttons: [B('Try again', 'flow:status'), B('Talk to a person', 'handover')] }); return; }
        bot.user.name = bot.user.name || p.name;
        var bar = STAGES.map(function (st, i) { return (i < p.stage ? '✓ ' : i === p.stage ? '● ' : '○ ') + st; });
        bot.say(p.name.split(' ')[0] + ', your project is in **' + STAGES[p.stage].toLowerCase() + '**, about ' + p.pct + '% of the way. Next: ' + p.next.toLowerCase() + ', around **' + O.fmtDay(new Date(p.due)) + '**.', { cards: [{ title: p.code + ' · ' + p.title, sub: '“' + p.note + '”', img: PH(p.img), badge: STAGES[p.stage], price: p.pct + '%', priceLabel: 'complete', meta: bar.slice(Math.max(0, p.stage - 2), p.stage + 3).concat([p.designer]), buttons: [B('Message ' + p.designer.split(' ')[0], 'handover')] }], buttons: [B('When is handover?', 'say:handover date'), B('That’s all', 'say:bye')] });
        bot.event('booking', { kind: 'status_lookup' }); lead(bot, 'project_status', { code: p.code, stage: STAGES[p.stage] }, { name: p.name });
      } }
    },
    actions: {
      price: function (bot, room) { bot.startFlow('price', { room: room }); },
      retier: function (bot, room) { var e = bot.mem.est; bot.startFlow('price', { room: room, size: e ? e.size : undefined }); },
      book: function (bot, room) { if (!bot.mem.est || bot.mem.est.room !== room) bot.mem.est = { room: room }; bot.startFlow('book', { room: room }); },
      tour: function (bot) { var g = document.querySelector('#qGo'); if (g && !g.hidden) { bot.say('Taking you to the room. Scroll to walk through it; I’ll be here.', { delay: 200 }); setTimeout(function () { try { window.Concierge && Concierge.close(); } catch (e) {} g.click(); }, 700); } else bot.say('The 3D room is further up this page, under “Walk through a room”.'); }
    },
    freeText: function (bot, m) {
      var r = m.ent.room; if (r && (m.ent.size || m.ent.tier)) { bot.convo.lastIntent = 'price'; bot.startFlow('price', { room: r, size: m.ent.size, tier: m.ent.tier }); return true; }
      if (r) { bot.say('A ' + ROOM[r].n.toLowerCase() + ', lovely. Shall I price it, or show you a few we’ve made?', { buttons: [B('Price it', 'act:price:' + r), B('Show me some', 'say:show me ' + ROOM[r].n.toLowerCase() + ' work'), B('Book a consultation', 'act:book:' + r)] }); return true; }
      return false;
    },
    kb: [
      { id: 'fee', q: 'How do you charge?', a: 'A design fee of **8 to 12%** of the project, depending on the finish, plus the cost of execution at what we pay (we pass on every trade discount). The first consultation is free and credited to your fee if you go ahead.', keys: ['design fee', 'how do you charge', 'fees', 'commission', 'consultation fee', 'charges'] },
      { id: 'process', q: 'How does it work?', a: 'Four steps: a **consultation**, a **concept** with a 3D layout and moodboard, a **design plan** with drawings and a priced shopping list, then **installation** where we order, run the trades and style the room.', keys: ['process', 'how does it work', 'steps', 'what happens', 'how do you work'] },
      { id: 'time', q: 'How long does a room take?', a: 'Most single rooms take **5 to 9 weeks** from concept to styling; kitchens 7 to 11; a whole home 14 to 22. Made-to-order furniture is usually what sets the pace.', keys: ['how long', 'timeline', 'duration', 'weeks', 'how much time'] },
      { id: 'where', q: 'Which cities do you work in?', a: 'We take on full projects in **Bengaluru and Mysuru**, and a few in Chennai. Virtual design works anywhere: a 3D plan and a shopping list, delivered online.', keys: ['which city', 'cities', 'location', 'where are you', 'do you work in', 'mumbai', 'chennai', 'outside bangalore', 'bangalore', 'bengaluru'] },
      { id: 'virtual', q: 'How does virtual design work?', a: 'You send a floor plan and photos; we send back a 3D room, a layout and a shopping list with links, in about **three weeks**. From ₹28,000 a room.', keys: ['virtual design', 'online design', 'e-design', 'remote'] },
      { id: 'min', q: 'Is there a minimum budget?', a: 'We take on single rooms from about **₹3 lakh**, and whole homes from about ₹18 lakh. Below that, virtual design is usually the better fit.', keys: ['minimum budget', 'minimum', 'small budget', 'smallest project', 'low budget'] },
      { id: '3d', q: 'Will I see it before it’s built?', a: 'Yes. Every room is modelled, lit and styled in **3D** first, so you can walk through it, change your mind and sign it off with confidence. Like the room further up this page.', keys: ['3d', 'render', 'visualise', 'see it before', 'walkthrough', 'preview'] },
      { id: 'pay', q: 'How do payments work?', a: 'Design fee in three parts: **30%** to start, 40% at the design plan, 30% at handover. Furniture and trades are paid as they’re ordered, against invoices you see.', keys: ['payment', 'payment terms', 'advance', 'installments', 'emi', 'pay'] },
      { id: 'warranty', q: 'Is there a warranty?', a: 'Our joinery carries a **one-year** warranty, and we come back at six months to tighten, adjust and touch up, at no charge.', keys: ['warranty', 'guarantee', 'after sales', 'defects', 'repairs'] },
      { id: 'revisions', q: 'How many revisions do I get?', a: 'Two rounds on the concept and one on the design plan are included. Most clients don’t need them all, because the 3D walk-through answers questions early.', keys: ['revisions', 'changes', 'change my mind', 'how many changes', 'redo'] },
      { id: 'rent', q: 'Do you work on rented homes?', a: 'Yes, with a light touch: no drilling where it matters, freestanding storage, lighting that plugs in and textiles that move with you.', keys: ['rented', 'rental', 'tenant', 'renting', 'landlord'] },
      { id: 'vastu', q: 'Can you follow Vastu?', a: 'Of course. Tell us at the consultation and we’ll plan the layout around it from the start, rather than bending a finished design.', keys: ['vastu', 'vaastu', 'feng shui', 'direction'] },
      { id: 'kids', q: 'Is it practical with kids and pets?', a: 'Calm doesn’t mean fragile. We use performance linen, oiled oak that can be re-sanded, washable paint and rounded edges where little heads are.', keys: ['kids', 'children', 'pets', 'dog', 'cat', 'durable', 'practical'] },
      { id: 'keep', q: 'Can I keep my existing furniture?', a: 'Please do. We often design around a piece you love, like a grandmother’s chair, and reupholster or refinish what’s worth keeping.', keys: ['existing furniture', 'keep my furniture', 'reuse', 'old furniture', 'my own furniture'] },
      { id: 'green', q: 'Do you use sustainable materials?', a: 'Wherever we can: FSC timber, low-VOC paints, lime plaster, handloom textiles from weavers we know by name, and furniture made within 300 km.', keys: ['sustainable', 'eco', 'green', 'natural materials', 'non toxic', 'environment'] },
      { id: 'site', q: 'Do you supervise the site?', a: 'Yes. A site lead is there for every trade day, with a photo update to you every Friday and a shared punch list until handover.', keys: ['site supervision', 'supervise', 'contractor', 'carpenter', 'who builds', 'execution'] },
      { id: 'gst', q: 'Are your prices inclusive of GST?', a: 'Estimates here are before GST: 18% on the design fee and on most execution. Every invoice shows it on its own line.', keys: ['gst', 'tax', 'inclusive', 'taxes'] },
      { id: 'hours', q: 'When is the studio open?', a: 'Tuesday to Sunday, **10 am to 7 pm**, at 12th Main, Indiranagar. Mondays we’re closed, so the designers can draw.', keys: ['opening hours', 'hours', 'timings', 'open', 'address', 'where is the studio', 'contact'] }
    ]
  });
})();
