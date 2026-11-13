/* Lumen CRM — demo seed data. Everything here is fictional / simulated. */
(function () {
  'use strict';
  var C = window.CRM = window.CRM || {};
  var H = 3600e3, D = 864e5;

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  C.rng = rng;

  C.TEAM = ['Aarav Khanna', 'Meera Joshi', 'Kabir Anand', 'Isha Bedi'];
  C.SERVICES = ['Modular kitchen', 'Full-home interiors', 'Wardrobes & storage', 'Bathroom remodel', 'Painting & polish', 'Smart lighting'];
  C.AREAS = ['Gurugram', 'Noida', 'Dwarka', 'Saket', 'Vasant Kunj', 'Rohini', 'Indirapuram', 'Greater Noida', 'Faridabad', 'Pitampura'];

  // name, source, service, area, budget (₹ lakh), status, hours ago
  var ROWS = [
    ['Ananya Sharma', 'web', 'Modular kitchen', 'Gurugram', 6.5, 'quote', 190],
    ['Rohan Mehta', 'google', 'Full-home interiors', 'Noida', 18, 'site', 120],
    ['Priya Nair', 'meta', 'Wardrobes & storage', 'Dwarka', 2.8, 'contacted', 30],
    ['Vikram Singh', 'phone', 'Bathroom remodel', 'Saket', 3.2, 'won', 640],
    ['Neha Gupta', 'whatsapp', 'Painting & polish', 'Rohini', 1.4, 'new', 5],
    ['Arjun Malhotra', 'chatbot', 'Modular kitchen', 'Indirapuram', 4.5, 'new', 3],
    ['Sana Qureshi', 'web', 'Full-home interiors', 'Vasant Kunj', 24, 'quote', 260],
    ['Karan Bhatia', 'google', 'Smart lighting', 'Gurugram', 1.8, 'contacted', 52],
    ['Deepa Iyer', 'meta', 'Modular kitchen', 'Noida', 5.2, 'lost', 480],
    ['Manish Agarwal', 'phone', 'Full-home interiors', 'Faridabad', 14, 'site', 96],
    ['Tanvi Kapoor', 'chatbot', 'Wardrobes & storage', 'Pitampura', 3.1, 'contacted', 20],
    ['Imran Sheikh', 'whatsapp', 'Bathroom remodel', 'Greater Noida', 2.6, 'quote', 150],
    ['Sneha Reddy', 'web', 'Modular kitchen', 'Dwarka', 7.8, 'won', 580],
    ['Aditya Joshi', 'google', 'Painting & polish', 'Saket', 0.9, 'lost', 400],
    ['Pooja Verma', 'meta', 'Full-home interiors', 'Gurugram', 16, 'new', 9],
    ['Harsh Vardhan', 'chatbot', 'Smart lighting', 'Noida', 2.2, 'new', 1.5],
    ['Ritu Saxena', 'phone', 'Modular kitchen', 'Rohini', 5.6, 'contacted', 44],
    ['Faisal Ahmed', 'web', 'Wardrobes & storage', 'Indirapuram', 3.6, 'won', 420],
    ['Kavya Menon', 'google', 'Bathroom remodel', 'Vasant Kunj', 4.1, 'site', 70],
    ['Gaurav Chopra', 'whatsapp', 'Full-home interiors', 'Pitampura', 21, 'quote', 210],
    ['Nidhi Bansal', 'meta', 'Modular kitchen', 'Faridabad', 4.8, 'lost', 340],
    ['Siddharth Rao', 'chatbot', 'Full-home interiors', 'Gurugram', 12, 'contacted', 26],
    ['Aisha Khan', 'web', 'Painting & polish', 'Greater Noida', 1.1, 'new', 14],
    ['Rajat Kulkarni', 'phone', 'Wardrobes & storage', 'Dwarka', 2.9, 'site', 110],
    ['Meenal Desai', 'google', 'Modular kitchen', 'Noida', 6.2, 'won', 700],
    ['Yash Tandon', 'meta', 'Smart lighting', 'Saket', 1.6, 'contacted', 38],
    ['Lavanya Pillai', 'whatsapp', 'Bathroom remodel', 'Gurugram', 3.8, 'new', 11],
    ['Dev Sethi', 'web', 'Full-home interiors', 'Vasant Kunj', 28, 'quote', 300],
    ['Ishita Roy', 'chatbot', 'Wardrobes & storage', 'Rohini', 3.3, 'won', 520],
    ['Naveen Prasad', 'google', 'Modular kitchen', 'Indirapuram', 5.9, 'lost', 600],
    ['Shruti Mishra', 'phone', 'Painting & polish', 'Pitampura', 1.3, 'contacted', 60],
    ['Omar Farooqui', 'meta', 'Full-home interiors', 'Noida', 15, 'site', 135],
    ['Bhavna Thakur', 'web', 'Smart lighting', 'Faridabad', 2.4, 'lost', 380],
    ['Tarun Dutta', 'whatsapp', 'Modular kitchen', 'Greater Noida', 4.2, 'quote', 175],
    ['Zoya Hussain', 'google', 'Bathroom remodel', 'Dwarka', 3.4, 'new', 14],
    ['Kunal Sinha', 'chatbot', 'Modular kitchen', 'Saket', 5.1, 'lost', 450],
    ['Aparna Bose', 'web', 'Full-home interiors', 'Gurugram', 19, 'won', 660],
    ['Mohit Rawat', 'phone', 'Wardrobes & storage', 'Noida', 2.7, 'new', 2.5],
    ['Charu Lata', 'google', 'Smart lighting', 'Vasant Kunj', 1.9, 'contacted', 80],
    ['Vivaan Oberoi', 'meta', 'Modular kitchen', 'Indirapuram', 6.8, 'site', 100]
  ];

  var REQ = {
    'Modular kitchen': ['Wants an L-shaped kitchen with a quartz counter, soft-close drawers and a chimney cut-out.', 'Replacing an old kitchen. Needs a breakfast counter and tall pantry unit.', 'Small parallel kitchen in a 2BHK. Wants max storage and easy-clean laminates.'],
    'Full-home interiors': ['3BHK handover. Wants a complete package: living, bedrooms, kitchen, false ceiling.', 'Wants a modern-minimal full-home design with warm lighting and built-in storage.', 'Family of five. Needs a study nook, a pooja unit and a guest bedroom.'],
    'Wardrobes & storage': ['Sliding-door wardrobe with loft for the master bedroom, plus a kids’ room unit.', 'Walk-in wardrobe conversion of a spare room. Wants LED strips and a dressing mirror.', 'Wall-to-wall wardrobe in a compact bedroom. Wants a built-in study desk.'],
    'Bathroom remodel': ['Full remodel of two bathrooms: new tiles, wall-hung WC and a rain shower.', 'Wants anti-skid tiles and a walk-in shower for elderly parents.', 'Waterproofing issue plus new vanity and mirror cabinet.'],
    'Painting & polish': ['Repaint of a 3BHK with texture on one living-room wall. Wants low-VOC paint.', 'Wood polish for doors and a teak dining table, plus ceiling touch-ups.', 'Pre-move-in painting of a 2BHK, two-tone colour scheme.'],
    'Smart lighting': ['Wants app-controlled lighting for the living room and a dimmable cove light.', 'Retrofit of smart switches and scene control in a 3BHK.', 'Warm-white track lighting for the kitchen and hallway, voice-assistant ready.']
  };
  var WHEN = ['wants to start within a month', 'possession in about 6 weeks', 'flexible on timeline', 'would like to begin after the festive season', 'needs it done before a family function'];
  var LOSS = ['went with another vendor', 'budget mismatch', 'project postponed', 'not reachable after two attempts'];
  var CAMPS = { meta: ['kitchen-leadform-ncr', 'fullhome-carousel', 'wardrobe-retarget', 'smartlight-video'], google: ['kitchen-search-ncr', 'interior-designer-gurugram', '(organic)', '(organic)'] };

  var TASKTXT = {
    'new': 'Call back and qualify the requirement',
    'contacted': 'Follow up and confirm a site-visit slot',
    'site': 'Share measurements and first moodboard',
    'quote': 'Follow up on the quote and answer questions'
  };
  var PAT = [[-1, 17, 0], [0, 10, 30], [1, 11, 0], [0, 15, 30], [2, 12, 0], [-2, 16, 0], [1, 15, 0], [0, 17, 45], [3, 11, 0], [1, 10, 0], [0, 13, 0], [4, 12, 0]];

  // ---- Chatbot flow -------------------------------------------------------
  C.flowSeed = function () {
    return {
      start: 'start',
      nodes: {
        start: { type: 'question', text: 'Hi! I’m Lumi, the Lumen Homes assistant. What can I help you with today?', options: [{ label: 'Get a free quote', next: 'svc' }, { label: 'Pricing & timelines', next: 'faq' }, { label: 'Book a site visit', next: 'visit' }, { label: 'Talk to a person', next: 'human' }] },
        svc: { type: 'question', text: 'Which service are you looking for?', options: [{ label: 'Modular kitchen', next: 'budget' }, { label: 'Full-home interiors', next: 'budget' }, { label: 'Wardrobes & storage', next: 'budget' }, { label: 'Bathroom remodel', next: 'budget' }] },
        budget: { type: 'question', text: 'Roughly what budget do you have in mind?', options: [{ label: 'Under ₹3 L', next: 'lead' }, { label: '₹3–8 L', next: 'lead' }, { label: 'Above ₹8 L', next: 'lead_big' }] },
        lead: { type: 'lead', text: 'Perfect. Share your name and phone number and a designer will call you within 30 minutes (9 am–8 pm).' },
        lead_big: { type: 'lead', text: 'That’s a substantial project — we’ll assign a senior designer. Share your name and phone number and we’ll call you shortly.' },
        faq: { type: 'question', text: 'Here’s what most customers ask about:', options: [{ label: 'Typical timelines', next: 'faq_time' }, { label: 'How pricing works', next: 'faq_price' }, { label: 'Back to menu', next: 'start' }] },
        faq_time: { type: 'answer', text: 'Kitchens take 3–4 weeks, wardrobes 2–3 weeks and full-home interiors 8–12 weeks from design sign-off.' },
        faq_price: { type: 'answer', text: 'We quote per sq. ft. after a free site visit, so there are no surprises. Most modular kitchens start around ₹1,100 per sq. ft.' },
        visit: { type: 'lead', text: 'Happy to arrange a free site visit. Share your name and phone number and we’ll confirm a slot within the hour.' },
        human: { type: 'handoff', text: 'Connecting you to a team member now. Typical wait is under 2 minutes.' }
      }
    };
  };

  // Walk the flow with a list of option indexes -> transcript messages + outcome
  C.walk = function (flow, path, who) {
    var msgs = [], id = flow.start, pi = 0, out = 'resolved', first = who.name.split(' ')[0];
    for (var g = 0; g < 20; g++) {
      var n = flow.nodes[id]; if (!n) break;
      msgs.push({ from: 'bot', text: n.text });
      if (n.type === 'question' && n.options && n.options.length) {
        var o = n.options[path[pi++] || 0]; if (!o) break;
        msgs.push({ from: 'user', text: o.label }); id = o.next; if (!id) break; continue;
      }
      if (n.type === 'lead') { msgs.push({ from: 'user', text: who.name + ' · ' + who.phone }); msgs.push({ from: 'bot', text: 'Thanks ' + first + '! We’ve passed this to the team — expect a call soon.' }); out = 'lead'; }
      else if (n.type === 'handoff') { out = 'handoff'; msgs.push({ from: 'system', text: 'Agent ' + who.agent + ' joined the chat' }); }
      break;
    }
    return { msgs: msgs, outcome: out };
  };

  // ---- Seed ---------------------------------------------------------------
  C.seed = function () {
    var R = rng(42), t = Date.now();
    var pick = function (a) { return a[Math.floor(R() * a.length)]; };
    var SRC = C.SOURCES;
    var base = { web: 18, google: 24, meta: 31, whatsapp: 6, chatbot: 1, phone: 0 };
    var leads = ROWS.map(function (r, i) {
      var name = r[0], src = r[1], service = r[2], loc = r[3], budget = r[4], status = r[5], created = t - r[6] * H;
      var owner = C.TEAM[i % 4];
      var resp = null;
      if (status !== 'new') resp = Math.round(base[src] * (0.4 + R() * 1.6)); else if (src === 'chatbot') resp = 1;
      var utm = src === 'meta' ? { source: 'facebook', medium: 'paid_social', campaign: pick(CAMPS.meta) }
        : src === 'google' ? { source: 'google', medium: (i % 2 ? 'cpc' : 'organic'), campaign: (i % 2 ? pick(['kitchen-search-ncr', 'interior-designer-gurugram']) : '') }
        : src === 'whatsapp' ? { source: 'whatsapp', medium: 'referral', campaign: i % 2 ? 'flyer-qr-society-drive' : '' }
        : src === 'chatbot' ? { source: 'website', medium: 'chatbot', campaign: '' }
        : src === 'phone' ? { source: 'direct', medium: 'phone', campaign: '' }
        : { source: 'website', medium: 'form', campaign: '' };
      var slug = name.toLowerCase().replace(/[^a-z ]/g, '').replace(/ +/g, '.');
      var phone = '+91 ' + pick(['98', '99', '97', '96', '88', '70']) + '••• ••' + String(100 + Math.floor(R() * 899));
      var lead = {
        id: 'L-' + (1001 + i), name: name, phone: phone, email: slug + '@example.com', source: src, service: service, loc: loc,
        budget: budget, status: status, owner: owner, created: created, resp: resp,
        req: pick(REQ[service]) + ' Customer ' + pick(WHEN) + '.', utm: utm, tl: [], notes: []
      };
      lead.tl.push({ t: created, type: 'in', text: 'Lead received via ' + SRC[src].label + (utm.campaign ? ' · campaign ' + utm.campaign : '') });
      if (src === 'chatbot') lead.tl.push({ t: created + 6e4, type: 'msg', text: 'Lumi (chatbot) collected service and budget, and promised a callback' });
      var k = { 'new': 0, contacted: 1, site: 2, quote: 3, won: 4, lost: 4 }[status];
      if (status === 'lost') k = 1 + (i % 3);
      var t0 = created + (resp || 0) * 6e4;
      if (status !== 'new') lead.tl.push({ t: t0 + 3e4, type: src === 'whatsapp' ? 'msg' : 'call', text: src === 'phone' ? 'Inbound call answered by ' + owner : src === 'whatsapp' ? owner + ' replied on WhatsApp' : owner + ' called — connected, requirement confirmed' });
      var later = [];
      if (k >= 1) later.push({ type: 'note', text: 'Qualified: ' + service.toLowerCase() + ' in ' + loc + ', budget about ₹' + budget + ' L, ' + pick(WHEN) + '.' });
      if (k >= 2) later.push({ type: 'visit', text: status === 'site' ? 'Site visit scheduled with ' + owner : 'Site visit completed with ' + owner + '; measurements taken' });
      if (k >= 3) later.push({ type: 'quote', text: 'Quote shared on WhatsApp and email — ₹' + (budget * 0.96).toFixed(1) + ' L' });
      if (status === 'won') later.push({ type: 'status', text: 'Status changed to Won — token advance received' });
      if (status === 'lost') later.push({ type: 'status', text: 'Status changed to Lost — ' + pick(LOSS) });
      var span = t - t0;
      later.forEach(function (e, j) {
        e.t = Math.round(t0 + span * (0.1 + 0.8 * (j + 1) / (later.length + 1)));
        lead.tl.push(e);
        if (e.type === 'note') lead.notes.push({ t: e.t, text: e.text, by: owner });
      });
      lead.tl.sort(function (a, b) { return a.t - b.t; });
      return lead;
    });

    // tasks
    var tasks = [], today = new Date(); today.setHours(0, 0, 0, 0);
    leads.filter(function (l) { return l.status !== 'won' && l.status !== 'lost'; }).forEach(function (l, j) {
      var p = PAT[j % PAT.length], d = new Date(today); d.setDate(d.getDate() + p[0]); d.setHours(p[1], p[2], 0, 0);
      var done = (j === 3 || j === 11);
      tasks.push({ id: 'T-' + (100 + j), leadId: l.id, text: TASKTXT[l.status], due: d.getTime(), done: done, doneAt: done ? t - 2 * H : null, owner: l.owner });
    });

    // Meta Conversions API log (simulated)
    var capi = [], ER = rng(11), hex = function () { return Math.floor(ER() * 0xffffff).toString(16).padStart(6, '0') + Math.floor(ER() * 0xffffff).toString(16).padStart(6, '0'); };
    leads.filter(function (l) { return l.source === 'meta'; }).forEach(function (l) {
      var ev = [['Lead', l.created + 12e4]];
      if (['contacted', 'site', 'quote', 'won'].indexOf(l.status) > -1 || l.status === 'lost') ev.push(['Contact', l.created + (l.resp || 30) * 6e4 + 6e4]);
      if (l.status === 'site' || l.status === 'quote' || l.status === 'won') ev.push(['Schedule', l.created + (t - l.created) * 0.4]);
      if (l.status === 'won') ev.push(['Purchase', l.created + (t - l.created) * 0.9]);
      ev.forEach(function (e, x) {
        capi.push({ id: 'evt_' + hex(), t: Math.round(e[1]), name: e[0], leadId: l.id, match: +(6.4 + ER() * 2.7).toFixed(1), status: (capi.length === 5 ? 'Deduplicated' : capi.length === 9 ? 'Retried' : 'Delivered'), value: e[0] === 'Purchase' ? Math.round(l.budget * 1e5) : null });
      });
    });
    capi.sort(function (a, b) { return b.t - a.t; });

    // chatbot transcripts
    var flow = C.flowSeed(), TR = rng(5), PAGES = ['/modular-kitchen', '/', '/full-home-interiors', '/wardrobes', '/pricing', '/bathroom-remodel'];
    var paths = [[1, 0], [0, 0, 1], [2], [1, 1], [0, 1, 2], [3], [0, 2, 0], [1, 0], [0, 3, 1], [2], [1, 2, 3], [0, 0, 0], [1, 1], [3], [0, 1, 1], [2], [1, 0], [3]];
    var botLeadCap = leads.filter(function (l) { return l.source === 'chatbot'; }).length, botLeads = 0;
    var transcripts = paths.map(function (p, i) {
      var nm = ['Reena Kohli', 'Sameer Anand', 'Divya Chauhan', 'Rahul Bedi', 'Anita Rao', 'Jatin Arora', 'Mira Sodhi', 'Tushar Jain', 'Kriti Malik'][i % 9];
      var w = C.walk(flow, p, { name: nm, phone: '98••• ••' + (200 + i * 17), agent: C.TEAM[i % 4].split(' ')[0] });
      if (w.outcome === 'lead') { if (botLeads >= botLeadCap) w = C.walk(flow, [1, 1], { name: nm, phone: '', agent: 'Meera' }); else botLeads++; }
      return { id: 'C-' + (2040 + i), t: t - (i * 31 + 3 + Math.floor(TR() * 20)) * H, visitor: w.outcome === 'lead' ? nm : 'Visitor #' + (4100 + i * 37), page: PAGES[i % PAGES.length], msgs: w.msgs, outcome: w.outcome };
    });

    var utmSaved = [
      { t: t - 9 * D, name: 'kitchen-leadform-ncr', url: 'https://www.lumenhomes.example/modular-kitchen?utm_source=facebook&utm_medium=paid_social&utm_campaign=kitchen-leadform-ncr' },
      { t: t - 6 * D, name: 'flyer-qr-society-drive', url: 'https://www.lumenhomes.example/book-visit?utm_source=flyer&utm_medium=qr&utm_campaign=flyer-qr-society-drive' },
      { t: t - 2 * D, name: 'monthly-inspiration', url: 'https://www.lumenhomes.example/?utm_source=newsletter&utm_medium=email&utm_campaign=monthly-inspiration' }
    ];

    return { v: 1, seedAt: t, leads: leads, tasks: tasks, bot: flow, transcripts: transcripts, capi: capi, utmSaved: utmSaved };
  };

  // ---- Simulated Search Console + Meta numbers (deterministic) -------------
  var cache = null;
  C.sim = function () {
    if (cache) return cache;
    var R = rng(7), t = Date.now(), days = [], i;
    for (i = 0; i < 56; i++) {
      var d = new Date(t - (56 - i) * D), dow = d.getDay(), wk = (dow === 0 || dow === 6) ? 0.78 : 1;
      var imp = Math.round((560 + i * 8) * (0.9 + R() * 0.25) * wk);
      var ctr = 0.028 + 0.005 * Math.sin(i / 4) + R() * 0.004;
      days.push({ t: d.getTime(), imp: imp, clicks: Math.round(imp * ctr), pos: +(15.2 - i * 0.05 + R() * 0.5).toFixed(1) });
    }
    var prevDays = days.slice(0, 28); days = days.slice(28);
    var q = [['modular kitchen design delhi', 2840, .034, 6.2], ['interior designer in gurugram', 2310, .029, 8.4], ['kitchen renovation cost delhi ncr', 1870, .041, 5.1], ['wardrobe design for small bedroom', 1650, .022, 11.3], ['lumen homes interiors', 1210, .19, 1.3], ['bathroom remodel cost noida', 1120, .027, 9.8], ['full home interior packages 3bhk', 1040, .031, 7.6], ['smart lighting for living room', 930, .018, 14.2], ['modular kitchen price per sq ft', 880, .036, 6.9], ['best interior designers noida', 820, .024, 10.5], ['l shaped kitchen design ideas', 760, .015, 16.4], ['sliding wardrobe designs', 690, .017, 15.1], ['home interior designer near me', 640, .026, 9.2], ['kitchen cabinet makers dwarka', 410, .037, 7.1], ['lumen homes reviews', 380, .12, 1.8], ['painting contractor saket', 310, .021, 12.7]]
      .map(function (r) { return { q: r[0], imp: r[1], clicks: r[1] * r[2], ctr: r[2], pos: r[3] }; });
    // the tracked queries are a subset of all search traffic: scale them so they never exceed the period totals
    var totI = days.reduce(function (s, x) { return s + x.imp; }, 0), totC = days.reduce(function (s, x) { return s + x.clicks; }, 0);
    var qI = q.reduce(function (s, x) { return s + x.imp; }, 0), qC = q.reduce(function (s, x) { return s + x.clicks; }, 0);
    var fi = 0.8 * totI / qI, fc = 0.8 * totC / qC;
    q.forEach(function (x) { x.imp = Math.round(x.imp * fi); x.clicks = Math.max(1, Math.round(x.clicks * fc)); x.ctr = x.clicks / x.imp; });
    var camps = [
      { name: 'Kitchen remodel — Lead form (NCR)', status: 'Active', spend: 3120, impr: 41200, clicks: 690, leads: 4 },
      { name: 'Full-home interiors — Carousel', status: 'Active', spend: 2860, impr: 36800, clicks: 520, leads: 3 },
      { name: 'Wardrobes — Retarget visitors', status: 'Active', spend: 1240, impr: 12600, clicks: 310, leads: 2 },
      { name: 'Bathroom — Lookalike 1%', status: 'Learning', spend: 1660, impr: 19900, clicks: 180, leads: 1 },
      { name: 'Smart lighting — Video views', status: 'Paused', spend: 980, impr: 22100, clicks: 240, leads: 1 }
    ];
    var raw = [], sum = 0; for (i = 0; i < 30; i++) { var v = 0.7 + R() * 0.6; raw.push(v); sum += v; }
    var daily = raw.map(function (v) { return Math.round(v / sum * 9860); });
    cache = { gsc: { days: days, prev: prevDays, queries: q }, meta: { camps: camps, daily: daily } };
    return cache;
  };
})();
