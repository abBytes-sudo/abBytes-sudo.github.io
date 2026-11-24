/* Agent: Ashlar & Co. Assistant (fictional stone, masonry and renovation contractor, Bengaluru). Price ranges, site visits, draft quotes, materials Q&A, gallery, FAQ.
   Rate cards, durations and materials below are made-up demo data. Demo only: nothing leaves the browser. */
(function () {
  'use strict';
  var O = window.Orbit, N = O.nlp, B = function (l, v) { return { label: l, value: v }; };
  var PH = function (f) { return O.samples('masonry/photos/' + f); };
  var R = function (n) { return O.money(n, '₹'); }, RR = function (a, b) { return R(a) + ' to ' + R(b); };
  var S = function (n) { return n >= 1e7 ? +(n / 1e7).toFixed(2) + ' crore rupees' : n >= 1e5 ? +(n / 1e5).toFixed(2) + ' lakh rupees' : Math.round(n / 1000) + ' thousand rupees'; };
  var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); }, jn = function (a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0]; };
  var TIERS = ['basic', 'standard', 'premium'], TN = { basic: 'Basic', standard: 'Standard', premium: 'Premium' }, BIG = 2500000;

  /* ---------- rate cards: base rate per sq ft (materials plus labour, before contingency and GST) ---------- */
  var PR = {
    kitchen: { name: 'Kitchen remodel', lower: 'kitchen remodel', photo: 'project-2.jpg', unit: 'kitchen floor', min: 40, max: 400, typ: 100, sizes: [70, 100, 150], mat: .58, wk: [2, 3], pw: [1.2, 1.8], rate: { basic: [1800, 2600], standard: [2800, 4200], premium: [4600, 7200] },
      tn: { basic: 'laminate shutters and a tile worktop', standard: 'plywood shutters with a granite or slate worktop', premium: 'solid wood or lacquer shutters with a quartz or marble worktop' },
      inc: ['demolition and debris removal', 'worktop and backsplash', 'cabinets and shutters', 'plumbing and electrical point shifts', 'painting and final clean'], exc: ['appliances', 'hob and chimney', 'structural changes', 'loose furniture'] },
    bathroom: { name: 'Bathroom remodel', lower: 'bathroom remodel', photo: 'stone-detail.jpg', unit: 'bathroom floor', min: 30, max: 200, typ: 45, sizes: [35, 45, 70], mat: .55, wk: [1, 2], pw: [2, 3], rate: { basic: [2400, 3400], standard: [3600, 5400], premium: [5800, 9000] },
      tn: { basic: 'ceramic tile and standard fittings', standard: 'vitrified or stone tile, mid-range fittings and a glass partition', premium: 'slate or marble, concealed plumbing and designer fittings' },
      inc: ['demolition and debris removal', 'waterproofing', 'wall and floor finish', 'sanitary fittings and plumbing', 'final clean'], exc: ['vanity furniture', 'accessories', 'structural changes'] },
    patio: { name: 'Patio and hardscape', lower: 'patio', photo: 'patio-shadow.jpg', unit: 'patio or paved area', min: 80, max: 3000, typ: 200, sizes: [120, 200, 400], mat: .62, wk: [1, 2], pw: [.4, .7], rate: { basic: [420, 650], standard: [700, 1100], premium: [1200, 2000] },
      tn: { basic: 'Kota or sandstone paving', standard: 'slate or limestone paving with proper drainage falls', premium: 'dressed natural stone, edging, steps and lighting conduits' },
      inc: ['excavation and compacted base', 'drainage falls', 'stone laying and pointing', 'sealing', 'debris removal'], exc: ['pergolas and roofing', 'planting', 'furniture'] },
    cladding: { name: 'Stone cladding', lower: 'stone cladding job', photo: 'ledgestone.jpg', unit: 'wall area to be clad', min: 60, max: 3000, typ: 250, sizes: [120, 250, 400], mat: .6, wk: [1, 2], pw: [.6, .9], rate: { basic: [320, 500], standard: [520, 860], premium: [900, 1500] },
      tn: { basic: 'sandstone or mixed veneer panels', standard: 'slate or limestone ledge panels', premium: 'hand-split ledgestone with matched corners' },
      inc: ['surface preparation', 'panels, adhesive and fixings', 'corner pieces', 'sealing', 'cleanup'], exc: ['wall repairs beyond patching', 'scaffolding above 12 feet', 'lighting'] },
    hearth: { name: 'Fireplace and hearth', lower: 'fireplace and hearth', photo: 'hearth.jpg', unit: 'fireplace wall including the hearth', min: 25, max: 150, typ: 40, sizes: [30, 40, 70], mat: .5, wk: [1, 2], pw: [2.5, 3.5], rate: { basic: [3800, 5500], standard: [6000, 9000], premium: [9500, 15000] },
      tn: { basic: 'stone veneer around a ready firebox', standard: 'a dressed stone surround with a hearth slab', premium: 'a full stone breast with a custom mantel and flue' },
      inc: ['design sketch', 'firebox and flue work', 'stone surround and hearth slab', 'heat-safe finishing', 'cleanup'], exc: ['gas or electrical supply', 'mantel wood', 'chimney work through the roof'] },
    gabion: { name: 'Retaining wall (gabion)', lower: 'gabion retaining wall', photo: 'gabion.jpg', unit: 'face of the wall', min: 100, max: 3000, typ: 300, sizes: [150, 300, 600], mat: .65, wk: [1, 2], pw: [.5, .9], rate: { basic: [380, 600], standard: [650, 1000], premium: [1050, 1700] },
      tn: { basic: 'mesh cages filled with local rubble', standard: 'galvanised cages with sorted granite fill', premium: 'coated mesh with a hand-packed stone face' },
      inc: ['site clearing and levelling', 'footing', 'cages and stone fill', 'back-fill and drainage', 'cleanup'], exc: ['walls over 6 feet, which need an engineer’s design', 'planting', 'soil testing'] },
    home: { name: 'Full home renovation', lower: 'full home renovation', photo: 'project-1.jpg', unit: 'built-up area of the home', min: 400, max: 6000, typ: 1200, sizes: [800, 1200, 1800], mat: .5, wk: [4, 6], pw: [1, 1.5], rate: { basic: [800, 1200], standard: [1300, 1900], premium: [2100, 3400] },
      tn: { basic: 'repainting, new tile and fittings', standard: 'new flooring, refreshed kitchen and bathrooms, and lighting', premium: 'a full redesign with stone features and custom joinery' },
      inc: ['site manager', 'demolition', 'flooring, painting and electrical', 'kitchen and bathroom work', 'final clean'], exc: ['structural changes', 'furniture and appliances', 'society deposits'] },
    compound: { name: 'Compound wall', lower: 'compound wall', photo: 'project-3.jpg', unit: 'face of the wall', min: 150, max: 3000, typ: 400, sizes: [200, 400, 800], mat: .6, wk: [1, 2], pw: [.3, .5], rate: { basic: [450, 700], standard: [750, 1150], premium: [1200, 1900] },
      tn: { basic: 'block or brick with plaster', standard: 'a stone-faced wall with coping', premium: 'dry-stacked stone with pillars and a gate frame' },
      inc: ['footing', 'wall build', 'finish', 'coping', 'cleanup'], exc: ['gates and automation', 'walls over 6 feet, which need an engineer’s design', 'electrical'] }
  };
  var ORDER = ['kitchen', 'bathroom', 'patio', 'cladding', 'hearth', 'gabion', 'home', 'compound'];
  var PRE = { home: /\b(whole|entire|full|complete|total) (home|house|flat|apartment|villa|place)\b|\b(home|house|flat|apartment|villa) remodel\b|\bturnkey\b|\bfull remodel\b|\bremodel (my |the |our )?(home|house|flat|apartment|villa)\b/, gabion: /\bgabion\b/, compound: /\bcompound wall\b/, hearth: /\b(fireplace|hearth)\b/, bathroom: /\bbathroom\b/, kitchen: /\bkitchen\b/, patio: /\bpatio\b/, cladding: /\bcladding\b/ };

  /* ---------- materials: ratings 1 low to 3 high, f = price index inside a tier ---------- */
  var MT = {
    granite: { name: 'Granite', tier: 'standard', f: 1, life: '25 to 50 years', heat: 3, stain: 2, scratch: 3, out: 3, img: 'stone-detail.jpg', top: ['kitchen', 'hearth', 'compound'], use: ['kitchen', 'bathroom', 'patio', 'compound', 'cladding', 'hearth', 'gabion'], good: 'a very hard surface that shrugs off heat and daily wear, in polished or flamed finishes', watch: 'seal it once a year indoors, and dark slabs show water marks' },
    quartz: { name: 'Engineered quartz', tier: 'premium', f: 1.1, life: '15 to 25 years', heat: 1, stain: 3, scratch: 3, out: 1, use: ['kitchen', 'bathroom'], good: 'a non-porous surface that never needs sealing, with an even colour', watch: 'direct sun fades it and hot pans can mark it, so keep it indoors' },
    marble: { name: 'Marble', tier: 'premium', f: 1.2, life: '20 to 40 years', heat: 2, stain: 1, scratch: 1, out: 1, use: ['bathroom', 'home', 'hearth'], good: 'a bright, classic look that ages beautifully', watch: 'it etches from lemon and cleaners and stains easily, so seal it yearly and avoid busy kitchen tops' },
    slate: { name: 'Slate', tier: 'standard', f: 1, life: '30 to 50 years', heat: 3, stain: 2, scratch: 2, out: 3, img: 'project-2.jpg', top: ['patio', 'bathroom'], use: ['patio', 'bathroom', 'cladding', 'compound', 'kitchen'], good: 'natural grip and good handling of sun, rain and heat, so it suits wet areas', watch: 'cheap grades can flake, so we use sorted slabs and seal them once' },
    limestone: { name: 'Limestone', tier: 'standard', f: 1.05, life: '20 to 30 years', heat: 3, stain: 1, scratch: 2, out: 2, img: 'patio-shadow.jpg', use: ['patio', 'cladding', 'hearth'], good: 'a warm tone that is easy to dress and carve', watch: 'it is porous, so seal it and wipe spills quickly' },
    sandstone: { name: 'Sandstone', tier: 'basic', f: .92, life: '20 to 25 years', heat: 3, stain: 1, scratch: 1, out: 3, img: 'patio-shadow.jpg', use: ['patio', 'compound', 'cladding', 'gabion'], good: 'a budget friendly price, good grip and warm colours', watch: 'it is softer and weathers faster, so reseal every two years' },
    kota: { name: 'Kota stone', tier: 'basic', f: .85, life: '20 to 30 years', heat: 3, stain: 2, scratch: 2, out: 3, use: ['patio', 'home', 'compound', 'kitchen'], good: 'a hard, flat surface at the most affordable floor price', watch: 'the look is plain, and polish lines can show' },
    ledgestone: { name: 'Ledgestone', tier: 'premium', f: 1.1, life: '30 to 50 years', heat: 3, stain: 2, scratch: 2, out: 3, img: 'ledgestone.jpg', top: ['cladding'], use: ['cladding', 'hearth'], good: 'stacked, textured panels that add depth to feature walls and chimneys', watch: 'rough faces collect dust, so keep it out of cooking zones' }
  };
  var MRE = { granite: /\bgranite/, quartz: /\bquartz/, marble: /\bmarble/, slate: /\bslate/, limestone: /\blimestone/, sandstone: /\bsandstone/, kota: /\bkota\b/, ledgestone: /\bledge ?stone/ };
  var CRIT = [['heat', 'heat'], ['stain', 'stains'], ['scratch', 'scratches'], ['out', 'outdoor weather']];

  /* ---------- gallery (photos are stock demo images, projects are fictional) ---------- */
  var GAL = [
    { id: 'hearth', t: 'Fieldstone fireplace and hearth', p: 'hearth', f: 'hearth.jpg', m: ['Fireplace and hearth', 'Stacked fieldstone with a stone hearth slab', 'Koramangala home, about 4 weeks'] },
    { id: 'chimney', t: 'Rubble stone chimney breast', p: 'hearth', f: 'chimney.jpg', m: ['Fireplace and hearth', 'Full-height river stone chimney', 'Whitefield villa, about 5 weeks'] },
    { id: 'ledgestone', t: 'Ledgestone feature wall', p: 'cladding', f: 'ledgestone.jpg', m: ['Stone cladding', 'Hand-split ledgestone panels', 'Indiranagar townhouse, about 2 weeks'], mat: 'ledgestone' },
    { id: 'stone-detail', t: 'Dry-stack stone wall, close up', p: 'cladding', f: 'stone-detail.jpg', m: ['Stone cladding', 'Mixed granite and sandstone, dry-stack finish', 'Hebbal, about 3 weeks'] },
    { id: 'patio-shadow', t: 'Sandstone patio', p: 'patio', f: 'patio-shadow.jpg', m: ['Patio and hardscape', 'Honed sandstone with drainage falls', 'JP Nagar, about 2 weeks'], mat: 'sandstone' },
    { id: 'project-2', t: 'Slate courtyard', p: 'patio', f: 'project-2.jpg', m: ['Patio and hardscape', 'Sealed slate floor against brick walls', 'Jayanagar courtyard, about 3 weeks'], mat: 'slate' },
    { id: 'project-1', t: 'Terracotta frontage and steps', p: 'patio', f: 'project-1.jpg', m: ['Patio and hardscape', 'Terracotta paving and brick piers', 'Malleshwaram home, about 3 weeks'] },
    { id: 'project-3', t: 'Cobble paving and brick restoration', p: 'compound', f: 'project-3.jpg', m: ['Compound and hardscape', 'Reset cobbles and repointed brick wall', 'Basavanagudi, about 3 weeks'] },
    { id: 'gabion', t: 'Gabion retaining wall', p: 'gabion', f: 'gabion.jpg', m: ['Retaining wall', 'Galvanised cages with sorted stone fill', 'Sarjapur Road plot, about 2 weeks'] },
    { id: 'before', t: 'Before: cracked yard slab', p: 'patio', f: 'before.jpg', m: ['Before the work', 'Failed concrete slab with no drainage', 'Replaced with the sandstone patio'] }
  ], GB = {}; GAL.forEach(function (g) { GB[g.id] = g; });

  var LOC = ['Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout', 'Jayanagar', 'JP Nagar', 'Malleshwaram', 'Hebbal', 'Yelahanka', 'Sarjapur Road', 'Bellandur', 'Electronic City', 'Banashankari', 'Basavanagudi', 'Rajajinagar', 'Marathahalli', 'Bannerghatta Road', 'Kanakapura Road', 'BTM Layout', 'Frazer Town', 'Sadashivanagar', 'Domlur', 'Kengeri', 'Yeshwanthpur', 'RT Nagar', 'Hennur', 'Devanahalli', 'Bengaluru', 'Bangalore'];
  var OUT = ['Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Kochi', 'Mysuru', 'Mysore', 'Coimbatore', 'Goa', 'Ahmedabad', 'Jaipur', 'Gurugram', 'Noida'];
  var SL = [{ id: 'am1', t: '9 am', h: 9 }, { id: 'am2', t: '11:30 am', h: 11.5 }, { id: 'pm1', t: '2 pm', h: 14 }, { id: 'pm2', t: '4:30 pm', h: 16.5 }], SLB = {}; SL.forEach(function (s) { SLB[s.id] = s; });

  /* ---------- small helpers ---------- */
  function rk(n) { return Math.round(n / 1000) * 1000; }
  function wk(w) { return w[0] + ' to ' + w[1] + ' weeks' + (w[1] >= 12 ? ' (about ' + Math.round(w[0] / 4.3) + ' to ' + Math.round(w[1] / 4.3) + ' months)' : ''); }
  function projectsIn(nt) { if (PRE.home.test(nt)) return ['home']; var o = []; Object.keys(PRE).forEach(function (k) { var m = nt.match(PRE[k]); if (m) o.push([k, m.index]); }); return o.sort(function (a, b) { return a[1] - b[1]; }).map(function (x) { return x[0]; }); }
  function matsIn(nt) { var o = []; Object.keys(MRE).forEach(function (k) { var m = nt.match(MRE[k]); if (m) o.push([k, m.index]); }); return o.sort(function (a, b) { return a[1] - b[1]; }).map(function (x) { return x[0]; }); }
  function tierFrom(t) { t = t.toLowerCase(); if (/\b(premium|luxury|luxurious|high.?end|top.?end|designer|deluxe|best quality)\b/.test(t)) return 'premium'; if (/\b(basic|economy|economical|cheapest|cheap|entry.?level|no.?frills|simple|low cost)\b/.test(t)) return 'basic'; if (/\b(standard|mid.?range|medium|regular|middle|moderate)\b(?! size)/.test(t)) return 'standard'; return undefined; }
  function areaOf(t, loose) {
    var a = N.area(t); if (a) return a; var m = String(t).toLowerCase().match(/(\d+(?:\.\d+)?)\s*(?:x|by)\s*(\d+(?:\.\d+)?)\s*(ft|feet|foot)?/); if (m && (m[3] || loose)) return Math.round(+m[1] * +m[2]);
    if (loose && (m = String(t).toLowerCase().match(/^\s*(?:about|around|approx\w*|roughly|nearly)?\s*(\d{2,5})\s*(?:sq\w*|sft|feet|ft)?\s*\.?\s*$/))) return +m[1]; return undefined;
  }
  function timelineFrom(t) {
    t = t.toLowerCase(); if (/just (exploring|looking|browsing|curious|checking)|\bexploring\b|no rush|not sure when|someday|only checking|window shopping/.test(t)) return 'explore';
    if (/this month|asap|urgent|immediately|right away|this week|next week|tomorrow|today|couple of weeks|within (a |1 |2 |3 |4 )?weeks?|(one|two|1|2) weeks?/.test(t)) return 'month';
    if (/next month|(1|one|2|two) ?(to|-) ?(3|three) months?|(next )?(couple|few) (of )?months|in (a|1|2|3|one|two|three) months?|quarter/.test(t)) return 'soon';
    var w = N.when(t); if (w && w.date) { var d = Math.round((w.date - new Date().setHours(0, 0, 0, 0)) / 864e5); return d <= 30 ? 'month' : d <= 95 ? 'soon' : undefined; } return undefined;
  }
  var TLN = { month: 'this month', soon: 'in 1 to 3 months', explore: 'just exploring' };
  function locIn(t) { for (var i = 0; i < LOC.length; i++) if (new RegExp('\\b' + LOC[i].toLowerCase().replace(/ /g, '\\s*') + '\\b').test(t.toLowerCase())) return LOC[i] === 'Bangalore' ? 'Bengaluru' : LOC[i]; for (i = 0; i < OUT.length; i++) if (new RegExp('\\b' + OUT[i].toLowerCase() + '\\b').test(t.toLowerCase())) return OUT[i]; }
  function isQ(t) { return /\?|\b(vs|versus|compare|which|what|why|how|difference|better|should|does|do)\b/i.test(t); }
  function other(bot, t) { try { if (O.kb.match(bot.agent.id, t, bot.agent.synonyms)) return true; var m = bot._match(t); return !!((m.intent && m.score >= 4.5) || (m.global && m.gscore >= 3)); } catch (e) { return false; } }
  function placeFrom(t, bot, loose, allowSkip) {
    var l = t.toLowerCase(), x = locIn(t); if (x) return x; if (!loose) return undefined;
    if (/\b(skip|not sure|later|rather not|don.?t know|prefer not|no idea)\b/.test(l)) return allowSkip ? 'skip' : undefined;
    if (/^(different|another|other|change|yes|no|not|none)\b|\?/.test(l) || other(bot, t)) return undefined;
    var m = t.match(/\b(?:in|at|near|around|from)\s+([A-Za-z][A-Za-z ]{2,28})\s*$/); if (m) return m[1].replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
    return /^[A-Za-z0-9][A-Za-z0-9 ,.'\/-]{2,50}$/.test(t.trim()) && t.trim().split(/\s+/).length <= 5 ? t.trim().replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }) : undefined;
  }
  function okName(t, bot) { var n = N.name(t); if (!n || /\d|(kitchen|bath|patio|cladd|fireplace|hearth|wall|stone|granite|marble|slate|quote|price|cost|visit|premium|basic|standard|skip|morning|afternoon|evening|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday)/i.test(t)) return undefined; return other(bot, t) ? undefined : n; }
  var ph = function (x) { return String(x || '').replace(/\D/g, '').slice(-10); };

  /* ---------- estimate maths ---------- */
  function calc(e) {
    var p = PR[e.project], t = e.tier || 'standard', asked = +e.area || p.typ, ar = Math.max(asked, p.min), f = (MT[e.material] || { f: 1 }).f, r = p.rate[t];
    function set(rate) { var base = ar * rate * f, m = rk(base * p.mat), l = rk(base * (1 - p.mat)), c = rk((m + l) * .08), g = rk((m + l + c) * .18); return { mat: m, lab: l, con: c, gst: g, total: m + l + c + g }; }
    var k = t === 'premium' ? 1.2 : t === 'basic' ? .9 : 1, w0 = Math.max(1, Math.round((p.wk[0] + p.pw[0] * ar / 100) * k)), w1 = Math.max(w0 + 1, Math.round((p.wk[1] + p.pw[1] * ar / 100) * k));
    return { p: p, tier: t, area: ar, asked: asked, clamped: ar > asked, lo: set(r[0]), hi: set(r[1]), w: [w0, w1] };
  }
  function verdict(e, c) {
    var b = e.budget; if (!b) return null; var bs = R(b), j, c2;
    if (b >= c.hi.total) return { text: 'Your budget of ' + bs + ' covers the whole range, so this fits comfortably, with some room to upgrade finishes.' };
    if (b >= c.lo.total) return { text: 'Your budget of ' + bs + ' sits inside the range. It works at the lower end but it is a stretch at the top, so we would choose finishes carefully.' };
    for (j = TIERS.indexOf(c.tier) - 1; j >= 0; j--) { c2 = calc({ project: e.project, area: e.area, tier: TIERS[j], material: e.material }); if (b >= c2.lo.total) return { tier: TIERS[j], text: 'Your budget of ' + bs + ' is below this range. A lighter tier would help: ' + TN[TIERS[j]] + ' comes to ' + RR(c2.lo.total, c2.hi.total) + ', which ' + (b >= c2.hi.total ? 'fits.' : 'is a stretch but possible.') }; }
    var per = calc({ project: e.project, area: c.area, tier: 'basic', material: e.material }).lo.total / c.area, n = Math.floor(b / per / 10) * 10;
    if (n >= c.p.min) return { area: n, text: 'Your budget of ' + bs + ' is below even our Basic tier for this size, which starts at ' + R(calc({ project: e.project, area: c.area, tier: 'basic', material: e.material }).lo.total) + '. It would cover about ' + n + ' sq ft at Basic, or we can phase the work in two stages.' };
    return { person: 1, text: 'Your budget of ' + bs + ' is below the smallest job of this type. I would rather be honest than squeeze it, so tell me if you want to phase it or talk to a person.' };
  }
  function big(bot, why) { bot.say('That is a bigger job than I can price properly from a chat. Projects above ₹25 lakh get a project manager who walks the site with you, so I am passing you across with everything we have covered.'); bot.handover(why); }

  function showEstimate(bot, e, o) {
    o = o || {}; var c = calc(e), p = c.p, mat = MT[e.material], lo = c.lo, hi = c.hi, v = verdict(e, c), t = c.tier, w = wk(c.w), notes = [];
    bot.mem.est = { project: e.project, area: +e.area || p.typ, tier: t, material: e.material || null, budget: e.budget || null, place: e.place || '', timeline: e.timeline || '' }; bot.mem.range = [lo.total, hi.total];
    bot.event('action', { action: 'estimate', project: e.project });
    if (c.clamped) notes.push('The smallest ' + p.lower + ' I price is ' + p.min + ' sq ft, so I used that.');
    if (e.areaNote === 'typical') notes.push('I assumed a typical size of ' + c.area + ' sq ft.');
    if (mat && (e.project === 'patio' || e.project === 'compound') && mat.out < 2) notes.push(mat.name + ' is not ideal outdoors, so slate or sandstone would last longer.');
    if (e.also && e.also !== e.project) notes.push('This covers the ' + p.lower + ' only. Ask me for the ' + PR[e.also].lower + ' next.');
    var delta = ''; if (o.prev) { var d = (lo.total + hi.total) / 2 - (o.prev.lo.total + o.prev.hi.total) / 2; delta = ' Compared with the earlier estimate, the middle of the range moves ' + (d >= 0 ? 'up' : 'down') + ' by about ' + R(Math.abs(d)) + '.'; }
    var head = (o.lead || 'Here is your estimate.') + ' A ' + p.lower + ' of about ' + c.area + ' sq ft in a ' + t + ' finish' + (mat ? ' with ' + mat.name.toLowerCase() : '') + ' comes to **' + RR(lo.total, hi.total) + '** including 18 percent GST, and takes about ' + w + '.' + delta + (notes.length ? ' ' + notes.join(' ') : '');
    var inc = 'Included: ' + p.inc.join(', ') + '. Not included: ' + p.exc.join(', ') + '.';
    var spoken = (o.lead || 'Here is your estimate.') + ' A ' + p.lower + ' of about ' + c.area + ' square feet in a ' + t + ' finish ' + (mat ? 'with ' + mat.name.toLowerCase() + ' ' : '') + 'comes to between ' + S(lo.total) + ' and ' + S(hi.total) + ', including 18 percent GST. Materials are about ' + S(lo.mat) + ' to ' + S(hi.mat) + ' and labour about ' + S(lo.lab) + ' to ' + S(hi.lab) + ', plus 8 percent contingency. The work takes about ' + w + '. ' + inc + (delta ? delta : '') + ' ' + notes.join(' ');
    bot.say(head, { spoken: spoken, cards: [{ title: p.name + ' · ' + c.area + ' sq ft', sub: TN[t] + ' finish' + (mat ? ' · ' + mat.name : '') + ' · estimate range', img: PH(p.photo), price: RR(lo.total, hi.total), badge: 'Estimate', meta: ['Materials ' + RR(lo.mat, hi.mat), 'Labour ' + RR(lo.lab, hi.lab), 'Contingency (8%) ' + RR(lo.con, hi.con), 'GST (18%) ' + RR(lo.gst, hi.gst), 'Total incl. GST ' + RR(lo.total, hi.total), 'Duration ' + w, 'Included: ' + p.inc.join(', '), 'Not included: ' + p.exc.join(', ')] }] });
    var other_ = t === 'premium' ? 'standard' : 'premium', btns = [B('Book a free site visit', 'intent:site_visit')]; if (!(v && v.tier === other_)) btns.push(B('What if ' + other_ + '?', 'act:tier:' + other_)); btns.push(B('Try a different size', 'act:resize'), B('Compare materials', 'intent:materials'));
    if (v) { bot.say(v.text); if (v.tier) btns.unshift(B('Show ' + TN[v.tier] + ' instead', 'act:tier:' + v.tier)); else if (v.area) btns.unshift(B('Try ' + v.area + ' sq ft', 'say:what if ' + v.area + ' sq ft')); else if (v.person) btns.unshift(B('Talk to a person', 'handover')); }
    if (hi.total > BIG) { big(bot, 'Estimate above ₹25 lakh: ' + p.name + ', ' + c.area + ' sq ft, ' + t + ' (' + RR(lo.total, hi.total) + ')'); return; }
    if (!e.place && !e.timeline && e.quick) btns.push(B('Add area and timing', 'flow:details'));
    bot.say(o.prev ? 'Same caveat as before: it is a range, and the on-site measurement fixes the final price.' : 'One honest note: this is a range from our rate card, not a fixed quote. Only an on-site measurement fixes the final price, because wall condition, access, drainage and the exact stone move it either way. The site visit is free.', { buttons: btns.slice(0, 5) });
  }
  function refine(bot, ent) {
    var old = bot.mem.est, n = {}, k, parts = []; for (k in old) n[k] = old[k];
    if (ent.tier && ent.tier !== old.tier) parts.push('a ' + ent.tier + ' finish instead of ' + old.tier); if (ent.area && +ent.area !== old.area) parts.push(ent.area + ' sq ft instead of ' + old.area); if (ent.material && ent.material !== old.material) parts.push('using ' + MT[ent.material].name.toLowerCase());
    if (ent.tier) n.tier = ent.tier; else if (ent.material && ent.material !== old.material) n.tier = MT[ent.material].tier; ['area', 'material', 'budget', 'place', 'timeline'].forEach(function (x) { if (ent[x]) n[x] = ent[x]; });
    showEstimate(bot, n, { prev: calc(old), lead: parts.length ? 'Switching to ' + parts.join(' and ') + '.' : 'That matches the current estimate.' });
  }
  function entry(bot, ent) {
    ent = ent || {}; var has = ent.project || ent.area || ent.tier || ent.material || ent.budget, est = bot.mem.est, pre = {};
    if (ent.place && outside(ent.place)) { bot.say(outside(ent.place).replace(' If the site is in Bengaluru, tell me the locality, or say skip.', ' I will price it as if it were in Bengaluru, and a project manager would add any travel charge.')); delete ent.place; }
    if (ent.budget > BIG) { big(bot, 'Budget above ₹25 lakh: ' + R(ent.budget)); return; }
    if (est && has && (!ent.project || ent.project === est.project)) { refine(bot, ent); return; }
    if (est && !has) { bot.say('Your last estimate was a ' + PR[est.project].lower + ' of ' + est.area + ' sq ft, ' + est.tier + ', ' + RR(bot.mem.range[0], bot.mem.range[1]) + '. Want to tweak it or start a new one?', { buttons: [B('What if premium?', 'act:tier:premium'), B('Try a different size', 'act:resize'), B('Start a new estimate', 'act:newest')] }); return; }
    ['project', 'area', 'tier', 'material', 'budget', 'place', 'timeline', 'areaNote', 'also'].forEach(function (k) { if (ent[k] !== undefined) pre[k] = ent[k]; });
    if (pre.project && pre.area && pre.tier) pre.quick = true; bot.startFlow('estimate', pre);
  }

  /* ---------- site visit slots, persisted through bot.db / bot.save ---------- */
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dateOf(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function days() { var o = [], d = new Date(); d.setHours(0, 0, 0, 0); for (var i = 1; i <= 7; i++) { var x = new Date(d); x.setDate(d.getDate() + i); if (x.getDay() !== 0) o.push(iso(x)); } return o; }
  function dayLabel(s) { var d = dateOf(s), n = Math.round((d - new Date().setHours(0, 0, 0, 0)) / 864e5); return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()] + ' ' + d.getDate() + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()] + (n === 1 ? ' (tomorrow)' : ''); }
  function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function freeSlots(bot, day) { var vs = bot.db('visits'); return SL.filter(function (s) { return !(hash(day + s.id) % 100 < 30) && !vs.some(function (v) { return v.status === 'booked' && v.day === day && v.slot === s.id; }); }); }
  function freeDays(bot) { return days().filter(function (d) { return freeSlots(bot, d).length; }); }
  function dayErr(bot, d) { if (days().indexOf(d) < 0) return 'I can book site visits from tomorrow up to a week ahead, Monday to Saturday. Which of those days works?'; if (!freeSlots(bot, d).length) return 'That day is fully booked. Please pick another day.'; }
  function timeErr(bot, d, id) { var f = freeSlots(bot, d); if (f.some(function (s) { return s.id === id; })) return; return 'Sorry, ' + SLB[id].t + ' on ' + dayLabel(d) + ' is already taken. Free that day: ' + f.map(function (s) { return s.t; }).join(', ') + '.'; }
  function slotFrom(t, bot, day) {
    var w = N.when(t); if (!w) return; var h, f = day ? freeSlots(bot, day) : SL, best, bd = 99;
    if (w.time) { var q = w.time.split(':'); h = +q[0] + (+q[1] || 0) / 60; } else if (w.timeAmbiguous) { h = w.timeAmbiguous < 8 ? w.timeAmbiguous + 12 : w.timeAmbiguous; }
    if (h !== undefined) { SL.forEach(function (s) { var d = Math.abs(s.h - h); if (d < bd) { bd = d; best = s; } }); return best.id; }
    var pool = (f.length ? f : SL).filter(function (s) { return w.part === 'morning' ? s.h < 12 : s.h >= 12; }); if (w.part && pool.length) return pool[0].id;
  }
  function findVisit(bot, phone, list) { var today = iso(new Date()), l = (list || bot.db('visits')).filter(function (v) { return v.status === 'booked' && v.day >= today && ph(v.phone) && ph(v.phone) === ph(phone); }); return l.sort(function (a, b) { return a.day < b.day ? -1 : 1; })[0]; }
  function seedVisits() { var d = days(), n = ['Rohan Mehta', 'Meera Iyer', 'Kabir Rao']; return [{ id: 'SV-3001', day: d[1], slot: 'am1', name: n[0], phone: '', place: 'Koramangala', project: 'kitchen', quote: 'QT-1041', status: 'booked' }, { id: 'SV-3002', day: d[2], slot: 'pm1', name: n[1], phone: '', place: 'Whitefield', project: 'patio', quote: 'QT-1042', status: 'booked' }, { id: 'SV-3003', day: d[3] || d[0], slot: 'am2', name: n[2], phone: '', place: 'Hebbal', project: 'cladding', quote: 'QT-1040', status: 'booked' }]; }
  function seedQuotes() { var t = Date.now() - 864e5 * 4; return [{ id: 'QT-1040', status: 'sent', created: t, name: 'Kabir Rao', projectName: 'Stone cladding', area: 280, tier: 'standard', total: { low: 192000, high: 301000 } }, { id: 'QT-1041', status: 'draft', created: t + 864e5, name: 'Rohan Mehta', projectName: 'Kitchen remodel', area: 110, tier: 'standard', total: { low: 396000, high: 586000 } }, { id: 'QT-1042', status: 'accepted', created: t + 2 * 864e5, name: 'Meera Iyer', projectName: 'Patio and hardscape', area: 220, tier: 'premium', total: { low: 369000, high: 616000 } }]; }

  /* ---------- materials Q&A ---------- */
  function matCard(m, extra) { var c = { title: m.name, sub: 'Offers ' + m.good, meta: ['Typical life ' + m.life, 'Watch out: ' + m.watch, 'Usually priced as ' + m.tier + ' tier'].concat(extra || []), buttons: [B('Price a job with ' + m.name.toLowerCase(), 'act:withMat:' + Object.keys(MT).filter(function (k) { return MT[k] === m; })[0])] }; if (m.img) c.img = PH(m.img); return c; }
  function useIn(nt) { return /\b(patio|outdoor|outside|garden|terrace|driveway|balcony)\b/.test(nt) ? 'patio' : /\b(kitchen|worktop|countertop|counter)\b/.test(nt) ? 'kitchen' : /\b(bathroom|shower|wet)\b/.test(nt) ? 'bathroom' : /\b(fireplace|hearth)\b/.test(nt) ? 'hearth' : /\b(cladding|facade|feature wall|wall)\b/.test(nt) ? 'cladding' : /\bcompound wall\b/.test(nt) ? 'compound' : undefined; }
  function matsFor(use) { var sc = function (m) { return (m.top && m.top.indexOf(use) >= 0 ? 4 : 0) + (/patio|compound|gabion/.test(use) ? m.out * 3 + m.scratch + m.heat : use === 'kitchen' ? (m.heat + m.stain + m.scratch) * 2 : use === 'bathroom' ? m.stain * 2 + m.out + m.scratch : m.out + m.scratch + m.heat + m.stain); }; return Object.keys(MT).map(function (k) { return MT[k]; }).filter(function (m) { return m.use.indexOf(use) >= 0; }).sort(function (a, b) { return sc(b) - sc(a); }).slice(0, 3); }
  function materials(bot, m) {
    var nt = m.norm, ids = matsIn(nt), use = useIn(nt), a = MT[ids[0]], b = MT[ids[1]], L = ['', 'low', 'medium', 'high'];
    bot.event('action', { action: 'materials_qa' });
    if (a && b) {
      var wa = [], wb = []; CRIT.forEach(function (c) { if (a[c[0]] > b[c[0]]) wa.push(c[1]); else if (b[c[0]] > a[c[0]]) wb.push(c[1]); });
      var price = TIERS.indexOf(a.tier) === TIERS.indexOf(b.tier) ? (a.f === b.f ? 'They cost about the same.' : (a.f < b.f ? a.name : b.name) + ' usually costs a little less.') : (TIERS.indexOf(a.tier) < TIERS.indexOf(b.tier) ? a.name : b.name) + ' usually costs less.';
      bot.say(a.name + ' against ' + b.name + '. ' + (wa.length ? a.name + ' does better on ' + jn(wa) + '. ' : '') + (wb.length ? b.name + ' does better on ' + jn(wb) + '. ' : '') + (!wa.length && !wb.length ? 'They are close on performance, so it comes down to look and budget. ' : '') + price + (use ? ' For a ' + use + ', ' + (matsFor(use)[0] === a || matsFor(use)[0] === b ? matsFor(use)[0].name + ' is the stronger pick.' : 'I would also look at ' + matsFor(use)[0].name.toLowerCase() + '.') : ''), { cards: [matCard(a), matCard(b)], buttons: [B('Price a job', 'intent:estimate'), B('Which stone for outdoors?', 'say:which stone for an outdoor patio')] }); return;
    }
    if (a) { var last = /\b(last|life|lifespan|durab|years|long)\b/.test(nt); bot.say(last ? a.name + ' typically lasts ' + a.life + ' with normal care. ' + cap(a.watch) + '.' : a.name + ' offers ' + a.good + '. Heat resistance is ' + L[a.heat] + ', stain resistance ' + L[a.stain] + ', and it is ' + L[a.out] + ' outdoors. Note: ' + a.watch + '.', { cards: [matCard(a)], buttons: [B('Compare with another stone', 'say:granite vs quartz'), B('Menu', 'menu')] }); return; }
    if (use) { var rec = matsFor(use); bot.say('For ' + (use === 'patio' ? 'an outdoor patio' : use === 'cladding' ? 'a feature wall' : 'a ' + use) + ', I would look at ' + rec.map(function (x) { return x.name; }).join(', ') + '. ' + rec[0].name + ' leads because it offers ' + rec[0].good + '.', { cards: rec.map(function (x) { return matCard(x); }), buttons: [B('Price a job', 'intent:estimate'), B('Menu', 'menu')] }); return; }
    bot.say('I can compare any two of granite, quartz, marble, slate, limestone, sandstone, Kota stone and ledgestone, tell you how long one lasts, or suggest a stone for a place. What would you like?', { buttons: [B('Granite vs quartz', 'say:granite vs quartz'), B('Stone for an outdoor patio', 'say:which stone for an outdoor patio'), B('How long does slate last?', 'say:how long does slate last'), B('Stone for a kitchen worktop', 'say:which stone for a kitchen worktop')] });
  }
  function gallery(bot, project) {
    var l = GAL.filter(function (g) { return !project || g.p === project; }); if (!l.length) l = GAL; l = l.slice(0, 4); bot.event('action', { action: 'gallery' });
    bot.say(project && PR[project] ? 'Here is some of our ' + PR[project].lower + ' work.' : 'Here is a taste of our recent work across Bengaluru.', { cards: l.map(function (g) { return { title: g.t, sub: g.m[1], img: PH(g.f), meta: [g.m[0], g.m[2]], buttons: g.id === 'before' ? [B('Price a patio like this', 'act:likeThis:patio-shadow')] : [B('Price one like this', 'act:likeThis:' + g.id)] }; }), buttons: [B('Hearths', 'act:gallery:hearth'), B('Patios', 'act:gallery:patio'), B('Walls and cladding', 'act:gallery:cladding'), B('Book a site visit', 'intent:site_visit')] });
  }

  /* ---------- slot factories, shared by several flows ---------- */
  function sProject(when) { return { name: 'project', when: when, ask: function (bot) { var c = bot.ctx.project; if (c && PR[c]) { bot.slots.project = c; bot._advance(); return; } bot.say('Which kind of job is it?', { buttons: ORDER.map(function (k) { return B(PR[k].name, 'slot:project=' + k); }) }); }, parse: function (t, bot) { return projectsIn(N.norm(t, bot.agent.synonyms))[0]; }, hint: 'Tell me the job: kitchen, bathroom, patio, stone cladding, fireplace, retaining wall, compound wall or a full home.' }; }
  function sArea(when) {
    return { name: 'area', when: when, ask: function (bot, s) { var p = PR[s.project]; bot.say('Roughly how big is the ' + p.unit + '? Tell me in square feet, for example ' + p.typ + ', or in square metres. If you are not sure, say so and I will use a typical size.', { buttons: p.sizes.map(function (n) { return B(n + ' sq ft', 'slot:area=' + n); }).concat([B('Not sure', 'say:not sure'), B('Different job', 'act:rejob')]) }); },
      parse: function (t, bot, s) { if (/not sure|don.?t know|no idea|typical|average/.test(t.toLowerCase()) && !N.area(t)) { s.areaNote = 'typical'; return (PR[s.project] || PR.kitchen).typ; } return areaOf(t, true); },
      validate: function (v, bot, s) { var p = PR[s.project] || PR[(bot.mem.est || {}).project] || PR.kitchen; if (v < 10) return 'That looks very small. Could you check the size in square feet?'; if (v > p.max) return 'That is bigger than I can price in a chat, the most I handle here for this job is about ' + p.max + ' sq ft. Try a smaller part of it, or ask for a person.'; }, hint: 'I need a size in square feet, for example 120 sq ft, or a room like 10 by 12 feet.' };
  }
  function sTier(when) {
    return { name: 'tier', when: when, ask: function (bot, s) {
      var p = PR[s.project], fit = ''; if (s.budget && s.area) { var ok = TIERS.filter(function (t) { return calc({ project: s.project, area: s.area, tier: t }).lo.total <= s.budget; }); fit = ' With your budget of ' + R(s.budget) + ', ' + (ok.length ? ok.map(cap).join(' and ') + (ok.length > 1 ? ' look' : ' looks') + ' workable.' : 'even Basic looks tight, but I will show you the numbers.'); }
      bot.say('Which finish level should I price? ' + TIERS.map(function (t) { return TN[t] + ' is ' + p.tn[t] + ', about ' + R(p.rate[t][0]) + ' to ' + R(p.rate[t][1]) + ' per sq ft before GST.'; }).join(' ') + fit + ' You can also just name a stone, like granite or slate.', { buttons: TIERS.map(function (t) { return B(TN[t], 'slot:tier=' + t); }) }); },
      parse: function (t, bot, s) { if (isQ(t) && other(bot, t)) return undefined; var m = matsIn(t.toLowerCase())[0]; if (m) s.material = m; return tierFrom(t) || (m ? MT[m].tier : undefined); }, hint: 'Pick Basic, Standard or Premium, or name a stone such as granite, slate or marble.' };
  }
  function sPlace(when) { return { name: 'place', when: when, ask: function (bot) { bot.say('Which part of Bengaluru is the site in? A locality name is enough, and you can skip this.', { buttons: [B('Skip', 'slot:place=skip')] }); }, parse: function (t, bot) { return placeFrom(t, bot, true, true); }, validate: outside, hint: 'Tell me a locality such as Indiranagar or Whitefield, or say skip.' }; }
  function outside(v) { if (OUT.indexOf(v) >= 0) return 'Sorry, we work in Bengaluru and about 60 km around it, so ' + v + ' is outside our area. If the site is in Bengaluru, tell me the locality, or say skip.'; }
  function sTimeline(when) { return { name: 'timeline', when: when, ask: function (bot) { bot.say('When are you hoping to start?', { buttons: [B('This month', 'slot:timeline=month'), B('In 1 to 3 months', 'slot:timeline=soon'), B('Just exploring', 'slot:timeline=explore')] }); }, parse: function (t) { return timelineFrom(t); }, hint: 'Say this month, in 1 to 3 months, or just exploring.' }; }
  function sPhone(why) { return { name: 'phone', ask: function (bot) { if (bot.user.phone) { bot.slots.phone = bot.user.phone; bot._advance(); return; } bot.say(why, {}); }, parse: function (t) { return N.phone(t); }, hint: 'Please type your 10 digit mobile number.' }; }
  function sDay(intro) {
    return { name: 'day', ask: function (bot, s) { var d = freeDays(bot); if (bot.flow === 'resched' && !findVisit(bot, s.phone)) { bot.say('I could not find an upcoming site visit under that number. Check the number, or I can book a new one.', { buttons: [B('Book a visit', 'flow:visit'), B('Menu', 'menu')] }); bot.endFlow(); return; } bot.say(typeof intro === 'function' ? intro(bot, s) : intro, { buttons: d.map(function (x) { return B(dayLabel(x), 'slot:day=' + x); }) }); },
      parse: function (t) { var w = N.when(t); return w && w.iso; }, validate: function (v, bot, s) { var e = dayErr(bot, v); if (e) return e; if (s.time && timeErr(bot, v, s.time)) delete s.time; }, hint: 'Pick a day, for example tomorrow or Saturday.' };
  }
  var sTime = { name: 'time', ask: function (bot, s) { var f = freeSlots(bot, s.day), tk = SL.filter(function (x) { return f.indexOf(x) < 0; }); bot.say('On ' + dayLabel(s.day) + ' I have ' + f.map(function (x) { return x.t; }).join(', ').replace(/, ([^,]*)$/, ' and $1') + ' free.' + (tk.length ? ' ' + tk.map(function (x) { return x.t; }).join(' and ') + (tk.length > 1 ? ' are' : ' is') + ' taken.' : '') + ' Which time suits you?', { buttons: f.map(function (x) { return B(x.t, 'slot:time=' + x.id); }) }); },
    parse: function (t, bot, s) { return slotFrom(t, bot, s.day); }, validate: function (v, bot, s) { return s.day ? timeErr(bot, s.day, v) : undefined; }, hint: 'Pick one of the times, for example morning or 2 pm.' };

  O.registerAgent({
    id: 'build', name: 'Ashlar & Co. Assistant', business: 'Ashlar & Co.', role: 'Construction quotes', industry: 'Construction', initials: 'AC', accent: '#F59E4B', phoneLabel: 'Ashlar & Co. quotes line',
    blurb: 'Prices kitchens, bathrooms, patios, stone cladding, hearths, retaining walls and full homes from a typed brief, books free site visits with a draft quote for the site team, compares stones and shows past work.',
    helloLine: 'I can price a stone or renovation job, book a free site visit, compare materials or show past work.',
    samples: ['I want to redo my kitchen, about 120 sq ft, granite', 'stone cladding for a 300 sqft wall, budget 2 lakh', 'granite vs quartz for a worktop', 'book a site visit for saturday morning'],
    kind: 'customer', contexts: [{ label: 'Just browsing', context: {} }, { label: 'Viewing: Kitchen remodels', context: { project: 'kitchen' } }, { label: 'Viewing: Patio and hardscape', context: { project: 'patio' } }, { label: 'Viewing: Fireplace and hearth', context: { project: 'hearth' } }, { label: 'Gallery: Ledgestone feature wall', context: { page: 'gallery', item: 'ledgestone' } }, { label: 'Gallery: Gabion retaining wall', context: { page: 'gallery', item: 'gabion' } }],
    synonyms: {
      remodel: ['renovate', 'renovation', 'renovating', 'revamp', 'revamping', 'redo', 'redoing', 'makeover', 'refurbish', 'refurbishment', 'upgrade', 'overhaul', 'redesign', 'do up'],
      cost: ['price', 'prices', 'pricing', 'rate', 'rates', 'charges', 'how much', 'ballpark', 'costs'], quote: ['quotation', 'quotations', 'quotes'],
      kitchen: ['kitchens', 'modular kitchen', 'kitchenette'], bathroom: ['bathrooms', 'washroom', 'washrooms', 'toilet', 'bath room', 'restroom', 'wet room'],
      patio: ['patios', 'terrace', 'deck', 'garden path', 'paving', 'pavers', 'paver', 'courtyard', 'hardscape', 'hardscaping', 'driveway', 'walkway'], cladding: ['clad', 'claddings', 'stone wall', 'facade', 'elevation', 'veneer'],
      fireplace: ['fire place', 'fireplaces', 'hearth', 'chimney', 'fire pit', 'mantel'], gabion: ['gabions', 'gabion wall', 'retaining wall', 'retaining walls', 'retainer wall'], 'compound wall': ['boundary wall', 'boundary', 'compound walls', 'fence wall'],
      visit: ['site visit', 'site inspection', 'inspection', 'measurement visit', 'survey'], granite: ['granites'], slate: ['slates'], marble: ['marbles'], quartz: ['engineered quartz', 'quartz stone']
    },
    seeds: { visits: seedVisits, quotes: seedQuotes },
    menu: [B('Get a price range', 'intent:estimate'), B('Book a site visit', 'intent:site_visit'), B('Compare materials', 'intent:materials'), B('See past work', 'intent:gallery'), B('Talk to the team', 'handover')],
    greeting: function (bot) {
      var c = bot.ctx, p = c.project && PR[c.project], g = c.page === 'gallery' && GB[c.item];
      if (g) { bot.say('Hi, I am the Ashlar & Co. assistant. I can see you are looking at the **' + g.t + '** in our gallery. Want a price for something like it, or to see more of our work?', { buttons: [B('Price a project like this', 'act:likeThis:' + g.id), B('See similar work', 'act:gallery:' + g.p), B('Book a site visit', 'intent:site_visit'), B('Something else', 'menu')] }); return; }
      if (p) { bot.say('Hi, I am the Ashlar & Co. assistant. I can see you are looking at **' + p.name + '**. I can give you a price range in about a minute.'); bot.startFlow('estimate', {}); return; }
      bot.say('Hi, I am the Ashlar & Co. assistant. We are a stone, masonry and renovation team in Bengaluru. I can give you a price range for a job, book a free site visit, compare stones or show you past work.', { buttons: bot.agent.menu });
    },
    extract: function (text, bot) {
      var e = {}, nt = N.norm(text, bot.agent.synonyms), t = text.toLowerCase(), pj = projectsIn(nt), a = areaOf(text), m = N.money(text), ms = matsIn(nt), w = N.when(text), x, nm;
      if (pj.length) { e.project = pj[0]; if (pj[1]) e.also = pj[1]; } if (a) e.area = a; else if (!a && N.bhk(text) && e.project === 'home') { e.area = ({ 1: 650, 2: 1000, 3: 1400, 4: 1900 })[N.bhk(text)] || 1400; e.areaNote = 'typical'; }
      if (m && m.max != null && m.max >= 10000) e.budget = Math.round(m.max);
      if (ms.length) e.material = ms[0]; x = tierFrom(text); if (x) e.tier = x; else if (e.material) e.tier = MT[e.material].tier;
      x = placeFrom(text, bot, false); if (x) e.place = x; x = timelineFrom(text); if (x && !/visit|appointment|book/.test(nt)) e.timeline = x;
      if (w && w.date) e.day = w.iso; if (!/\bsq|sqft|sqm|lakh|\d k\b/.test(t)) { x = slotFrom(text, bot, e.day || bot.slots.day); if (x) e.time = x; }
      if ((x = N.phone(text))) e.phone = x; if ((nm = text.match(/\b(?:my name is|this is|call me|name'?s)\s+([a-z][a-z'.-]+(?:\s+[a-z][a-z'.-]+)?)/i))) e.name = nm[1].replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
      return e;
    },
    intents: [
      { id: 'scope', label: 'Outside what I can price', kw: ['structural', 'load bearing', 'loft', 'mezzanine', 'extra floor', 'commercial', 'showroom', 'warehouse', 'factory', 'restaurant', 'hotel', 'demolish', 'basement', 'swimming pool', 'fitout', 'fit out'], re: [/\b(?:[7-9]|[1-9]\d)\s*(?:ft|feet|foot)\s*(?:high|tall)\b[^.]*\b(wall|gabion|retaining)|\b(wall|gabion|retaining)\b[^.]*\b(?:[7-9]|[1-9]\d)\s*(?:ft|feet|foot)\s*(?:high|tall)/, /\b(load[- ]?bearing|structural|loft|mezzanine|(add|adding|build|building) (a |an )?(extra |another |new )?(floor|storey|story)|commercial|swimming pool|basement|demolish|demolition|knock down)\b/], priority: 3,
        run: function (bot, m) { var t = m.text.toLowerCase(), k = /\d\s*(ft|feet|foot)\s*(high|tall)|(high|tall)/.test(t) && /wall|gabion|retaining/.test(t) ? 'a wall taller than 6 feet' : /commercial|showroom|warehouse|factory|restaurant|hotel|fitout|fit out/.test(t) ? 'commercial work' : /loft|mezzanine|floor|storey|story/.test(t) ? 'a loft or extra floor' : /pool/.test(t) ? 'a swimming pool' : 'structural work';
          if (/\b(no|without|not|non)[- ]+(any )?(structural|load)/.test(t)) { entry(bot, m.ent); return; }
          bot.say('That sounds like ' + k + ', which needs an engineer’s assessment before anyone can responsibly give a price, so I will not guess a number. I am passing you to a person who can arrange that.'); bot.handover('Out of scope: ' + k + ' (“' + m.text.slice(0, 80) + '”)'); } },
      { id: 'existing', label: 'Existing project help', kw: ['complaint', 'ongoing project', 'existing project', 'site supervisor', 'my contractor', 'delayed'], re: [/\b(my (ongoing|current) (project|work|site)|complain\w*)\b/], priority: 3, run: function (bot, m) { bot.say('I am sorry to hear that. Questions about work already in progress are best handled by a person who can see your project file, so I will bring one in.'); bot.handover('Existing customer query: ' + m.text.slice(0, 100)); } },
      { id: 'reschedule', label: 'Reschedule my visit', kw: ['reschedule', 'postpone', 'move my visit', 'change my visit', 'different day', 'another day', 'change the visit', 'change appointment'], re: [/\b(reschedule|postpone|move|change|shift)\b.*\b(visit|appointment|booking)\b/], priority: 3, run: function (bot) { bot.startFlow('resched'); } },
      { id: 'cancel_visit', label: 'Cancel my visit', kw: ['cancel visit', 'cancel my visit', 'cancel appointment', 'cancel booking', 'cancel the visit'], re: [/\bcancel\b.*\b(visit|appointment|booking)\b/], priority: 3, run: function (bot) { bot.startFlow('cancelvisit'); } },
      { id: 'site_visit', label: 'Book a site visit', kw: ['visit', 'appointment', 'schedule', 'measure', 'measurement', 'come and see', 'free consultation', 'consultation', 'come over', 'book'], re: [/\b(book|schedule|arrange|fix|set up)\b.*\b(visit|appointment|measurement|consultation)\b/], priority: 2,
        run: function (bot, m) { var pre = {}, e = m.ent, er; ['project', 'area', 'tier', 'material', 'budget', 'place', 'timeline', 'name', 'phone', 'day', 'time'].forEach(function (k) { if (e[k] !== undefined) pre[k] = e[k]; });
          if (pre.place && outside(pre.place)) { bot.say(outside(pre.place)); delete pre.place; } if (pre.day && (er = dayErr(bot, pre.day))) { bot.say(er); delete pre.day; delete pre.time; } else if (pre.day && pre.time && timeErr(bot, pre.day, pre.time)) delete pre.time; bot.startFlow('visit', pre); } },
      { id: 'gallery', label: 'See past work', kw: ['gallery', 'portfolio', 'past work', 'previous work', 'previous projects', 'past projects', 'recent projects', 'your work', 'completed projects', 'before and after', 'photos', 'pictures', 'examples'], re: [/\bshow me\b.*\b(work|projects?|photos|examples|pictures|gallery|past|previous)\b/], priority: 2, run: function (bot, m) { gallery(bot, m.ent.project); } },
      { id: 'materials', label: 'Compare materials', kw: ['granite', 'marble', 'slate', 'limestone', 'sandstone', 'quartz', 'kota', 'ledgestone', 'which stone', 'what stone', 'best stone', 'material', 'materials', 'durable', 'maintenance', 'sealing', 'compare'], re: [/\b(vs\.?|versus|difference between)\b/, /\b(which|what|best)\b.*\b(stone|material)\b/, /how long (does|do|will)\b.*\b(last|survive)/], priority: 2, run: function (bot, m) { materials(bot, m); } },
      { id: 'rates', label: 'Rate card', kw: ['rate card', 'price list', 'per sq ft', 'per square foot'], re: [/\bper\s?(sq|square)/], priority: 2,
        run: function (bot, m) { var p = PR[m.ent.project], l = p ? [p] : ORDER.map(function (k) { return PR[k]; }); bot.say('Our rate cards, per sq ft before contingency and GST:\n' + l.map(function (x) { return x.name + ': Basic ' + R(x.rate.basic[0]) + ' to ' + R(x.rate.basic[1]) + ', Standard ' + R(x.rate.standard[0]) + ' to ' + R(x.rate.standard[1]) + ', Premium ' + R(x.rate.premium[0]) + ' to ' + R(x.rate.premium[1]) + '.'; }).join('\n'), { buttons: [B('Get a full estimate', 'intent:estimate'), B('Menu', 'menu')] }); } },
      { id: 'duration', label: 'How long it takes', kw: ['how long', 'how many weeks', 'duration', 'turnaround', 'time frame'], re: [/\bhow long\b.*\b(take|complete|finish|work|project|job|remodel|build)\b/], priority: 2,
        run: function (bot, m) { var est = bot.mem.est, id = m.ent.project || (est && est.project), p = PR[id];
          if (p) { var c = calc({ project: id, area: m.ent.area || (est && est.project === id ? est.area : p.typ), tier: (est && est.tier) || 'standard' }); bot.say('A ' + p.lower + ' of about ' + c.area + ' sq ft usually takes ' + wk(c.w) + ' on site, plus about a week before we start for measurement and ordering stone.', { buttons: [B('Get a price range', 'intent:estimate'), B('Book a site visit', 'intent:site_visit')] }); return; }
          bot.say('Typical time on site, plus about a week up front for measurement and ordering stone:\n' + ORDER.map(function (k) { var c = calc({ project: k, area: PR[k].typ }); return PR[k].name + ': ' + wk(c.w) + ' for about ' + PR[k].typ + ' sq ft'; }).join('\n'), { buttons: [B('Get a price range', 'intent:estimate'), B('Book a site visit', 'intent:site_visit')] }); } },
      { id: 'estimate', label: 'Get a price range', kw: ['estimate', 'cost', 'quote', 'budget', 'remodel', 'kitchen', 'bathroom', 'patio', 'cladding', 'fireplace', 'gabion', 'compound wall', 'what if', 'instead', 'how about', 'switch to', 'change it to', 'make it'], re: [/\b\d+\s*(sq\.?\s?ft|sqft|sft|sq\.?\s?m|sqm|square (feet|foot|metres?|meters?))/, /\bwhat if\b/], priority: 1,
        ctx: function (bot) { return bot.ctx.project ? 1 : 0; }, run: function (bot, m) { entry(bot, m.ent); } }
    ],
    flows: {
      estimate: { intent: 'estimate', slots: [
        sProject(), sArea(), sTier(), sPlace(function (bot, s) { return !s.quick; }), sTimeline(function (bot, s) { return !s.quick; }),
        { name: 'material', optional: true }, { name: 'budget', optional: true }, { name: 'areaNote', optional: true }, { name: 'also', optional: true }, { name: 'quick', optional: true }
      ], done: function (bot, s) { showEstimate(bot, { project: s.project, area: s.area, tier: s.tier, material: s.material, budget: s.budget, place: s.place === 'skip' ? '' : s.place, timeline: s.timeline, areaNote: s.areaNote, also: s.also, quick: s.quick }); } },
      details: { intent: 'estimate', slots: [sPlace(), sTimeline()], done: function (bot, s) { var e = bot.mem.est; if (e) { e.place = s.place === 'skip' ? '' : s.place; e.timeline = s.timeline; } bot.say('Noted' + (e && e.place ? ': ' + e.place : '') + ', starting ' + TLN[s.timeline] + '. I will pass that to the site team when you book a visit.', { buttons: [B('Book a free site visit', 'intent:site_visit'), B('What if premium?', 'act:tier:premium'), B('Menu', 'menu')] }); } },
      visit: { intent: 'site_visit', slots: [
        sProject(function (bot) { return !bot.mem.est; }), sArea(function (bot) { return !bot.mem.est; }),
        { name: 'tier', optional: true }, { name: 'material', optional: true }, { name: 'budget', optional: true }, { name: 'timeline', optional: true }, { name: 'areaNote', optional: true }, { name: 'also', optional: true },
        sDay(function (bot) { return 'Let’s book your free site visit' + (bot.mem.est ? ' for the ' + PR[bot.mem.est.project].lower : '') + '. It takes about 45 minutes. Which day suits you? I can book from tomorrow up to a week ahead, Monday to Saturday.'; }), sTime,
        { name: 'name', ask: function (bot) { if (bot.user.name) { bot.slots.name = bot.user.name; bot._advance(); return; } bot.say('What name should the site engineer ask for?'); }, parse: function (t, bot) { return okName(t, bot); }, hint: 'Just tell me your name, for example Priya Nair.' },
        Object.assign(sPhone('What mobile number can the engineer call on the evening before?'), {}),
        { name: 'place', ask: function (bot, s) { var k = s.noKnown ? '' : (s.place && s.place !== 'skip' ? s.place : '') || (bot.mem.est && bot.mem.est.place); if (k) { bot.say('Is the site in **' + k + '**?', { buttons: [B('Yes, ' + k, 'slot:place=' + k), B('Different area', 'say:different area')] }); return; } bot.say('Which area is the site in? Give me the locality, and the apartment or street name if you like.'); }, parse: function (t, bot, s) { if (/^(different|another|other|change)/i.test(t.trim())) s.noKnown = 1; var r = placeFrom(t, bot, true, false); return r === 'skip' ? undefined : r; }, validate: outside, hint: 'Tell me the locality, for example Indiranagar.' },
        { name: 'confirm', ask: function (bot, s) { bot.say('Shall I book **' + dayLabel(s.day) + ' at ' + SLB[s.time].t + '** for ' + s.name + ' at ' + s.place + '? The visit is free, and I will attach a draft quote for the site team.', { buttons: [B('Yes, book it', 'slot:confirm=yes'), B('No, not now', 'slot:confirm=no')] }); }, parse: function (t) { var y = N.yesno(t); return y === undefined ? undefined : (y ? 'yes' : 'no'); } }
      ], done: function (bot, s) { confirmVisit(bot, s); } },
      resched: { intent: 'reschedule', slots: [
        sPhone('Sure. What mobile number is the visit booked under?'),
        sDay(function (bot, s) { var v = findVisit(bot, s.phone); return v ? 'Your visit is on ' + dayLabel(v.day) + ' at ' + SLB[v.slot].t + '. Which new day suits you?' : ''; }), sTime
      ], done: function (bot, s) {
        var all = bot.db('visits'), v = findVisit(bot, s.phone, all); if (!v) { bot.say('I could not find an upcoming site visit under that number.', { buttons: [B('Book a visit', 'flow:visit'), B('Menu', 'menu')] }); return; }
        v.day = s.day; v.slot = s.time; v.status = 'booked'; bot.save('visits', all); bot.event('action', { action: 'visit_rescheduled' });
        bot.say('Done. Your site visit is moved to **' + dayLabel(s.day) + ' at ' + SLB[s.time].t + '**. The engineer will call the evening before. Your draft quote ' + (v.quote || '') + ' stays attached.', { buttons: [B('Cancel the visit', 'intent:cancel_visit'), B('Menu', 'menu')] });
      } },
      cancelvisit: { intent: 'cancel_visit', slots: [
        sPhone('Okay. What mobile number is the visit booked under?'),
        { name: 'confirm', ask: function (bot, s) { var v = findVisit(bot, s.phone); if (!v) { bot.say('I could not find an upcoming site visit under that number.', { buttons: [B('Book a visit', 'flow:visit'), B('Menu', 'menu')] }); bot.endFlow(); return; } bot.say('I found your visit on ' + dayLabel(v.day) + ' at ' + SLB[v.slot].t + '. Cancel it?', { buttons: [B('Yes, cancel it', 'slot:confirm=yes'), B('No, keep it', 'slot:confirm=no')] }); }, parse: function (t) { var y = N.yesno(t); return y === undefined ? undefined : (y ? 'yes' : 'no'); } }
      ], done: function (bot, s) {
        if (s.confirm === 'no') { bot.say('Okay, your visit stays as it is.'); bot.menu('Anything else?'); return; }
        var all = bot.db('visits'), v = findVisit(bot, s.phone, all); if (!v) return; v.status = 'cancelled'; bot.save('visits', all);
        var qs = bot.db('quotes'); qs.forEach(function (q) { if (q.id === v.quote) q.status = 'on hold'; }); bot.save('quotes', qs); bot.event('action', { action: 'visit_cancelled' });
        bot.say('Done, your site visit is cancelled and the slot is free again. Your draft quote ' + (v.quote || '') + ' is on hold for 30 days in case you change your mind.', { buttons: [B('Book a new visit', 'flow:visit'), B('Menu', 'menu')] });
      } }
    },
    actions: {
      likeThis: function (bot, id) { var g = GB[id]; if (!g) return; var pre = { project: g.p }; if (g.mat) { pre.material = g.mat; pre.tier = MT[g.mat].tier; } bot.endFlow(); bot.mem.est = null; bot.ctx.project = null; bot.startFlow('estimate', pre); },
      gallery: function (bot, p) { gallery(bot, p); },
      rejob: function (bot) { bot.endFlow(); bot.ctx.project = null; bot.startFlow('estimate', {}); },
      newest: function (bot) { bot.mem.est = null; bot.ctx.project = null; bot.startFlow('estimate', {}); },
      resize: function (bot) { bot.say('Tell me the new size, for example “what if 200 sq ft”.'); },
      tier: function (bot, t) { if (bot.flow === 'estimate') { bot.fill('tier', t); bot._advance(); return; } if (!bot.mem.est) { bot.startFlow('estimate', { tier: t }); return; } refine(bot, { tier: t }); },
      withMat: function (bot, id) { if (bot.mem.est) refine(bot, { material: id }); else bot.startFlow('estimate', { material: id, tier: MT[id].tier }); }
    },
    kb: [
      { id: 'warranty', q: 'What warranty do you give?', a: 'Masonry and stonework carry a 5 year workmanship warranty. Waterproofing and finishing carry 1 year. Stone, fittings and appliances carry the maker’s own warranty and we help you claim it. The warranty certificate is issued at handover.', keys: ['warranty', 'guarantee', 'defect', 'after handover', 'snag'] },
      { id: 'payment', q: 'How do payments work?', a: 'Thirty percent when you accept the quote, forty percent at the midpoint of the work, twenty five percent when the work is complete, and the last five percent after the handover walk-through and snag fixes. You can pay by bank transfer or cheque, and every payment gets a GST invoice.', keys: ['payment schedule', 'payment terms', 'advance', 'how do i pay', 'instalments', 'installments', 'milestones', 'down payment', 'deposit', 'pay in stages'] },
      { id: 'permits', q: 'Do I need permits or permissions?', a: 'Cosmetic work such as cladding, patios and flooring usually needs no permit, but your apartment society may want a work notice and a deposit. Anything that changes the structure or the outside of the building can need municipal approval, and we prepare the drawings and paperwork. The site engineer will tell you at the visit.', keys: ['permit', 'permits', 'permission', 'approval', 'noc', 'society permission', 'licence', 'license'] },
      { id: 'how_long', q: 'How long will my project take?', a: 'As a guide: a bathroom 2 to 4 weeks, a kitchen 3 to 5, a patio 2 to 3, cladding or a hearth 2 to 4, a retaining wall 2 to 4, and a full home renovation 3 to 5 months. Add about a week up front for measurement and ordering stone. Tell me your job and size for a closer figure.', keys: ['project duration', 'how many weeks', 'completion time', 'how soon can you start', 'when can you start', 'start date', 'lead time'], buttons: [B('Get a price range', 'intent:estimate'), B('Menu', 'menu')] },
      { id: 'supply', q: 'Do you supply the materials?', a: 'Yes. We supply stone, cement, fittings and consumables from our own yards, so you get one bill. If you already have stone or fittings you love we can use them and deduct the cost, but we cannot warranty material we did not supply.', keys: ['supply the materials', 'do you supply', 'own materials', 'bring my own', 'materials included', 'who buys the stone', 'customer supplied'] },
      { id: 'cleanup', q: 'Do you clean up after the work?', a: 'Yes. Debris is cleared every day, floors and furniture are covered in dusty areas, and a deep clean and final debris removal are part of every job. Skip hire and disposal are in the quote.', keys: ['clean up', 'cleanup', 'cleaning', 'debris', 'mess', 'dust', 'waste removal', 'rubble'] },
      { id: 'area', q: 'Where do you work?', a: 'We work across Bengaluru and about 60 km around it. For sites further out we add a travel charge and need a project manager’s approval first.', keys: ['service area', 'where do you work', 'which areas', 'do you cover', 'areas you serve', 'outside bengaluru', 'other city', 'travel charge', 'do you work in'] },
      { id: 'insurance', q: 'Are your workers insured?', a: 'Yes. Every worker on site has accident insurance, and we hold third-party liability cover for damage to your property or your neighbours’. We can share the certificate on request.', keys: ['insurance', 'insured', 'liability', 'accident cover', 'worker safety', 'safety'] },
      { id: 'visit_free', q: 'Is the site visit free?', a: 'Yes, the visit is free within 25 km of the city centre and takes about 45 minutes. The engineer measures, photographs the space, checks access and drainage and leaves a written scope. Your draft quote is updated from that.', keys: ['visit free', 'visit charge', 'is the visit free', 'consultation fee', 'inspection fee', 'charge for the visit'], buttons: [B('Book a site visit', 'intent:site_visit'), B('Menu', 'menu')] },
      { id: 'gabion', q: 'What is a gabion wall?', a: 'A gabion wall is a retaining wall built from steel mesh cages packed with stone. It drains freely, copes with soil pressure and looks good, and it is quicker and cheaper than a poured concrete wall for slopes and plot edges. Walls above about 6 feet need an engineer’s design.', keys: ['what is a gabion', 'gabion wall mean', 'how does a gabion work', 'gabion explained', 'what are gabions'], buttons: [B('Price a retaining wall', 'say:retaining wall estimate'), B('Menu', 'menu')] },
      { id: 'minimum', q: 'What is the smallest job you take?', a: 'We take small jobs too, such as a hearth or a single bathroom. Our minimum job value is about ₹40,000 before GST.', keys: ['smallest job', 'minimum job', 'minimum order', 'small job', 'small work', 'minimum charge'] },
      { id: 'hours', q: 'What are your working hours?', a: 'Our crews work Monday to Saturday, 9 am to 6 pm, and avoid Sundays and public holidays. Noisy work can be limited to the hours your society allows.', keys: ['working hours', 'timings', 'work on sunday', 'work on weekends', 'noise', 'business hours', 'office hours'] },
      { id: 'gst', q: 'Is GST included?', a: 'Our estimates show GST at 18 percent separately so you can see the base price. The final quote and invoices include it.', keys: ['is gst included', 'gst', 'tax', 'gst bill', 'with gst'] }
    ],
    freeText: function (bot, m) { var e = m.ent; if (e.project || e.area || e.tier || e.material || e.budget) { entry(bot, e); return true; } return false; }
  });

  function confirmVisit(bot, s) {
    if (s.confirm !== 'yes') { bot.say('No problem, I have not booked anything.'); bot.menu('Anything else?'); return; }
    if (timeErr(bot, s.day, s.time)) { bot.say('Sorry, that slot was just taken. Let’s pick another.'); bot.startFlow('visit', { name: s.name, phone: s.phone, place: s.place }); return; }
    var old = bot.mem.est || {}, e = {}, k, q, c, vs, qs, v, lead, when;
    for (k in old) e[k] = old[k]; ['project', 'area', 'tier', 'material', 'budget'].forEach(function (x) { if (s[x]) e[x] = s[x]; }); e.tier = e.tier || 'standard'; e.place = s.place;
    c = calc(e); bot.user.name = s.name; bot.user.phone = s.phone; bot.mem.est = { project: e.project, area: +e.area || c.p.typ, tier: c.tier, material: e.material || null, budget: e.budget || null, place: s.place, timeline: e.timeline || s.timeline || '' }; bot.mem.range = [c.lo.total, c.hi.total];
    vs = bot.db('visits'); v = { id: 'SV-' + (3001 + vs.length), day: s.day, slot: s.time, name: s.name, phone: s.phone, place: s.place, project: e.project, status: 'booked', at: Date.now() };
    qs = bot.db('quotes'); q = { id: 'QT-' + (1040 + qs.length), status: 'draft', created: Date.now(), name: s.name, phone: s.phone, place: s.place, project: e.project, projectName: c.p.name, area: c.area, tier: c.tier, material: e.material || null, weeks: c.w, visit: v.id,
      items: [{ item: 'Materials', low: c.lo.mat, high: c.hi.mat }, { item: 'Labour', low: c.lo.lab, high: c.hi.lab }, { item: 'Contingency (8%)', low: c.lo.con, high: c.hi.con }, { item: 'GST (18%)', low: c.lo.gst, high: c.hi.gst }], total: { low: c.lo.total, high: c.hi.total }, note: 'Draft from the chat estimate. Final price after on-site measurement.' };
    v.quote = q.id; vs.push(v); qs.push(q); bot.save('visits', vs); bot.save('quotes', qs); when = dayLabel(s.day).replace(' (tomorrow)', '') + ', ' + SLB[s.time].t;
    lead = bot.lead({ name: s.name, phone: s.phone, intent: 'site_visit', payload: { project: c.p.name, area: c.area, tier: c.tier, material: e.material || '', budget: e.budget || '', timeline: bot.mem.est.timeline, estimateLow: c.lo.total, estimateHigh: c.hi.total, slot: when, place: s.place, quote: q.id, visit: v.id } }); bot.event('booking', { kind: 'site visit' });
    bot.say('You are booked, ' + s.name.split(' ')[0] + '. A free site visit on **' + when + '** at ' + s.place + '. The engineer will call ' + s.phone + ' the evening before. Please keep access to the space free and have any floor plan or photos handy.', { cards: [{ title: 'Site visit · ' + when, sub: 'Free · about 45 minutes · ' + s.place, meta: ['Booking ' + v.id, 'Engineer calls the evening before', 'Draft quote ' + q.id + ' attached'], img: PH('stone-detail.jpg') }] });
    bot.say('Draft quote **' + q.id + '** created for the site team. It is a draft, so the number can move once they measure.', { spoken: 'Draft quote ' + q.id.replace('-', ' ') + ' has been created for the site team. It is a draft, so the number can move once they measure.', cards: [{ title: q.id + ' · Draft quote', sub: c.p.name + ' · ' + c.area + ' sq ft · ' + TN[c.tier] + (e.material ? ' · ' + MT[e.material].name : ''), price: RR(c.lo.total, c.hi.total), badge: 'Draft', meta: q.items.map(function (i) { return i.item + ' ' + RR(i.low, i.high); }).concat(['Duration ' + wk(c.w), 'Status: draft']) }], buttons: [B('Reschedule', 'intent:reschedule'), B('Cancel the visit', 'intent:cancel_visit'), B('See past work', 'intent:gallery'), B('Menu', 'menu')] });
  }
})();
