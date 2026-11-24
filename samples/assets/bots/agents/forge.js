/* Forge front desk: the scripted assistant for Forge Athletic Club (samples/gym). Rule-based, no LLM, no network calls.
   It reads the club's own live timetable, coaches and plans from window.Forge (gym/forge-data.js) and writes straight into the
   club's back office: trial bookings land on the staff trial board (forge:leads, source "Chat") with a transcript link,
   class bookings in forge:bookings, freeze requests in forge:freezes. Loaded lazily by gym/concierge.js. */
(function () {
  'use strict';
  var O = window.Orbit; if (!O || O.agents.forge) return;
  var N = O.nlp, DAY = 864e5;
  var B = function (l, v) { return { label: l, value: v }; };
  function F() { return window.Forge || null; }
  function fget(k, d) { try { var v = localStorage.getItem('forge:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function fset(k, v) { try { localStorage.setItem('forge:' + k, JSON.stringify(v)); } catch (e) {} }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  var DN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function nice(s) { var d = new Date(s + 'T00:00'); return DN[d.getDay()] + ' ' + d.getDate() + ' ' + MN[d.getMonth()]; }
  function dayWord(s) { var n = Math.round((new Date(s + 'T00:00') - new Date(iso(new Date()) + 'T00:00')) / DAY); return n === 0 ? 'today' : n === 1 ? 'tomorrow' : nice(s); }
  function first(n) { return String(n || '').split(' ')[0]; }
  function bn(b) { return b === 'gurugram' ? 'Gurugram' : b === 'saket' ? 'Saket' : 'either floor'; }
  function rupees(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
  function img(src) { var f = F(); return O.samples('gym/' + (f && f.small ? f.small(src) : src)); }
  function mask(p) { var d = String(p || '').replace(/\D/g, '').slice(-10); return d.length === 10 ? '+91 ' + d.slice(0, 2) + '••• ••' + d.slice(7) : ''; }
  function daypart() { var h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; }

  /* ---------- the club's data ---------- */
  var GOALS = { strength: 'Get stronger', engine: 'Fitter, faster engine', hyrox: 'Train for HYROX', recovery: 'Move better, recover', start: 'Brand new to this' };
  var PARTS = { morning: ['05:00', '11:59', 'Mornings'], midday: ['12:00', '16:59', 'Midday'], evening: ['17:00', '23:00', 'Evenings'] };
  var BEGINNER = ['foundations', 'kettlebell-club', 'mobility', 'engine-room', 'tempo-run'];
  function sessionsOn(d) { var f = F(); return f ? f.sessions(d) : []; }
  function upcoming(days) { var out = [], now = new Date(); for (var i = 0; i < (days || 4); i++) { var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i); out = out.concat(sessionsOn(d).filter(function (s) { return !s.past; })); } return out; }
  function slotById(id) { var p = String(id).split('|'); return sessionsOn(new Date(p[0] + 'T00:00')).filter(function (s) { return s.id === id; })[0]; }
  function inPart(t, part) { var p = PARTS[part]; return !p || (t >= p[0] && t <= p[1]); }
  function find(goal, part, branch, day) {
    var L = (day ? sessionsOn(new Date(day + 'T00:00')).filter(function (s) { return !s.past; }) : upcoming(4)).filter(function (s) {
      if (branch && branch !== 'any' && s.branch !== branch) return false; if (!inPart(s.time, part)) return false;
      if (goal === 'start') return BEGINNER.indexOf(s.cls.id) > -1; if (goal && GOALS[goal]) return s.cls.type === goal; return true; });
    L.sort(function (a, b) { return (a.date + a.time < b.date + b.time ? -1 : 1); });
    var seen = {}, out = []; L.forEach(function (s) { var k = s.cls.id + s.branch; if (out.length < 4 && !seen[k] && s.left > 0) { seen[k] = 1; out.push(s); } }); return out;
  }
  function sessCard(s, extra) {
    return { title: s.cls.name, sub: dayWord(s.date).replace(/^./, function (c) { return c.toUpperCase(); }) + ' · ' + s.time + ' · ' + bn(s.branch), img: img(s.cls.photo), badge: s.left <= 3 ? (s.left === 1 ? 'Last spot' : s.left + ' spots left') : s.live ? 'On now' : '',
      meta: ['Coach ' + s.coach.name, s.cls.mins + ' min · ' + s.cls.level, s.left + ' of ' + s.cap + ' spots left'], buttons: extra || [B('Book my free trial here', 'act:pick:' + s.id), B('About this class', 'act:cls:' + s.cls.id)] };
  }
  function plans() { var f = F(); return f ? f.plans : []; }
  function planCard(p, tag) {
    return { title: p.name, sub: p.tag, price: rupees(p.m), priceLabel: '/ month', badge: tag || (p.best ? 'Most picked' : ''),
      meta: [p.feats.floor + ' floor', p.feats.classes + ' classes', p.feats.branches, p.feats.coach ? 'Coach 1:1: ' + p.feats.coach : 'No coach check-ins'].concat(p.feats.race ? ['HYROX race plan + simulation entry'] : []),
      buttons: [B('Start with ' + p.name, 'act:go:membership.html?plan=' + p.id + '#signup'), B('Free trial first', 'flow:trial')] };
  }
  function leadToBoard(bot, o) {
    var f = F(), L = fget('leads', null); if (!L && f && f.seedLeads) L = f.seedLeads(); L = L || [];
    var l = { id: 'c' + Date.now().toString(36), name: o.name, phone: mask(o.phone), branch: o.branch || 'saket', goal: o.goal || '', day: o.day || iso(new Date(Date.now() + DAY)), stage: 'new', at: new Date().toISOString(), source: 'Chat', chat: true, convo: bot.id, plan: o.plan || '', notes: [o.note || 'Booked in website chat'] };
    L.unshift(l); fset('leads', L); return l;
  }
  function crmLead(bot, intent, payload, extra) {
    payload = payload || {}; payload.convo = bot.id; payload.page = bot.ctx.page || bot.ctx.file || '';
    var l = { intent: intent, payload: payload, name: (extra && extra.name) || bot.user.name || 'Website visitor', phone: (extra && extra.phone) || bot.user.phone || '' };
    var out = bot.lead(l); try { var c = O.convos.get(bot.id); if (c) O.convos.setStatus(bot.id, c.status, { leadId: out.id, topic: intent }); } catch (e) {} return out;
  }
  function go(bot, url, line) { bot.say(line || 'Opening it for you…', { delay: 250 }); try { sessionStorage.setItem('cg-reopen-forge', '1'); } catch (e) {} setTimeout(function () { location.href = O.samples('gym/' + url); }, 900); }

  /* ---------- quick replies ---------- */
  var MENU = [B('Find a class for me', 'flow:find'), B('Book a free trial', 'flow:trial'), B('Which plan fits me?', 'flow:plan'), B('HYROX prep', 'flow:hyrox'), B('Freeze or cancel', 'intent:freeze'), B('Talk to the front desk', 'handover')];
  function dayButtons(slot, n) { var out = [], now = new Date(); for (var i = 0; i < (n || 5); i++) { var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i); if (i === 0 && now.getHours() >= 20) continue; out.push(B(i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DN[d.getDay()] + ' ' + d.getDate(), 'slot:' + slot + '=' + iso(d))); } return out.slice(0, 5); }

  /* ---------- free-text helpers (English + Hinglish) ---------- */
  function goalFrom(t) { t = t.toLowerCase();
    if (/hyrox|race|sled|wall ?ball|doubles|station/.test(t)) return 'hyrox';
    if (/beginner|new to|never (lifted|trained)|first time|nervous|start(ing)? out|naya|pehli baar|out of shape|long break/.test(t)) return 'start';
    if (/strong|strength|lift|squat|deadlift|bench|barbell|muscle|weights?|power|takat|kettlebell/.test(t)) return 'strength';
    if (/cardio|engine|run|running|stamina|endurance|erg|row|bike|fat|weight loss|lose|vazan|fit\b|fitter|hiit/.test(t)) return 'engine';
    if (/mobility|stretch|recover|yoga|sauna|plunge|stiff|back pain|flexib|injur/.test(t)) return 'recovery'; }
  function partFrom(t) { t = t.toLowerCase(); if (/morning|subah|early|before work|\bam\b|6 ?am|7 ?am/.test(t)) return 'morning'; if (/lunch|midday|afternoon|dopahar|noon/.test(t)) return 'midday'; if (/evening|shaam|sham|after work|night|raat|\bpm\b/.test(t)) return 'evening'; }
  function branchFrom(t) { t = t.toLowerCase(); if (/saket|south delhi|delhi\b|press enclave|malviya/.test(t)) return 'saket'; if (/gurugram|gurgaon|ggn|cyber ?hub|golf course|sector/.test(t)) return 'gurugram'; if (/either|any|both|doesn.?t matter|koi bhi/.test(t)) return 'any'; }
  function dayFrom(t) { var w = N.when(String(t).replace(/\bkal\b/i, 'tomorrow').replace(/\baaj\b/i, 'today').replace(/\bparso\b/i, 'day after tomorrow')); return w && w.iso; }

  O.registerAgent({
    id: 'forge', name: 'Forge Front Desk', business: 'Forge Athletic Club', role: 'Classes, trials and memberships', industry: 'Fitness', initials: 'F', accent: '#D4FF3A', phoneLabel: 'Forge front desk',
    blurb: 'Forge’s own front desk in chat: finds a class from a sentence, books the free trial into a real slot, picks a plan, plans a HYROX build-up and handles freezes, all straight onto the staff trial board.',
    helloLine: 'I can find you a class, book your free trial, pick a plan or plan your HYROX build-up.',
    samples: ['strength class tomorrow morning in Saket', 'kitne ka hai membership', 'first hyrox in 10 weeks', 'kal shaam trial chahiye'],
    kind: 'customer', menu: MENU,
    contexts: [{ label: 'Home page', context: { page: 'home' } }, { label: 'Heavy Hour class page', context: { page: 'class', id: 'heavy-hour' } }, { label: 'HYROX page', context: { page: 'hyrox' } }],
    synonyms: {
      'how much': ['kitne ka hai', 'kitne ki hai', 'kitna hai', 'kitne ka', 'kitna lagega', 'fees kya hai', 'price kya hai', 'charges'],
      'free trial': ['trial chahiye', 'trial class', 'try a class', 'trial session', 'demo class', 'try it out', 'try out', 'first class free'],
      'tomorrow': ['kal'], 'morning': ['subah'], 'evening': ['shaam', 'sham'],
      'freeze': ['pause', 'hold my membership', 'rokna hai', 'band karna hai kuch din', 'on hold'],
      'cancel membership': ['membership band karni hai', 'stop my membership', 'end my membership', 'quit the gym'],
      'where is': ['kahan hai', 'kaha hai', 'kidhar hai', 'address', 'location'],
      'talk to a person': ['baat karni hai', 'call me', 'front desk', 'real person', 'human'],
      'my booking': ['meri booking', 'my class booking', 'did my booking go through', 'booking status', 'what did i book']
    },
    seeds: {},
    nudge: function (c) {
      var f = F(); if (!f) return null;
      if (c.page === 'class' && c.id && f.cls(c.id)) { var s = find(f.cls(c.id).type, null, null).filter(function (x) { return x.cls.id === c.id; })[0]; return { text: 'Want to try ' + f.cls(c.id).name + ' for free?' + (s ? ' Next one: ' + dayWord(s.date) + ' ' + s.time + ' at ' + bn(s.branch) + ', ' + s.left + ' spots left.' : ''), cta: 'Hold me a spot', button: s ? B('Book my free trial here', 'act:pick:' + s.id) : B('Book a free trial', 'flow:trial') }; }
      if (c.page === 'hyrox' || c.file === 'hyrox') return { text: 'Got a race date? Tell me how far away it is and I’ll map your build-up, week by week.', cta: 'Plan my race', button: B('HYROX prep', 'flow:hyrox') };
      if (c.page === 'membership' || c.file === 'membership') return { text: 'Not sure between Club and Open Gym? Three quick questions and I’ll tell you straight.', cta: 'Help me pick', button: B('Which plan fits me?', 'flow:plan') };
      return { text: 'First time lifting with a coach? Your first class is on us. Tell me when suits you.', cta: 'Book my free class', button: B('Book a free trial', 'flow:trial') };
    },
    greeting: function (bot) {
      var c = bot.ctx || {}, f = F(), me = fget('session', null), hi = 'Good ' + daypart() + (me && me.name ? ', ' + first(me.name) : '') + '.';
      if (c.from === 'web') { bot.say('Hey' + (c.name ? ' ' + first(c.name) : '') + ', Forge front desk here, now on WhatsApp. Same answers, and your class reminders land right here.', { buttons: MENU.slice(0, 4) }); return; }
      if (c.page === 'class' && c.id && f && f.cls(c.id)) {
        var k = f.cls(c.id), nx = upcoming(4).filter(function (s) { return s.cls.id === k.id && s.left > 0; })[0];
        bot.say(hi + ' Looking at **' + k.name + '**? ' + (nx ? 'The next one is **' + dayWord(nx.date) + ' at ' + nx.time + '** at ' + bn(nx.branch) + ' with ' + first(nx.coach.name) + ', and ' + nx.left + ' of ' + nx.cap + ' spots are open.' : 'It’s full for the next few days, but I can find you something close.') + ' Your first class is free.',
          { buttons: (nx ? [B('Book my free trial here', 'act:pick:' + nx.id)] : []).concat([B('Other times', 'act:times:' + k.id), B('Is it OK for beginners?', 'say:is ' + k.name + ' ok for beginners'), B('Something else', 'menu')]) });
        return;
      }
      if (c.page === 'coach' && c.id && f && f.coach(c.id)) {
        var co = f.coach(c.id), mine = f.classes.filter(function (x) { return x.coach === co.id; });
        bot.say(hi + ' You’re reading about **' + co.name + '**, ' + co.role + '. ' + first(co.name) + ' coaches ' + mine.map(function (x) { return x.name; }).join(' and ') + '. Want to train with ' + first(co.name) + ' this week?',
          { buttons: [B('Classes with ' + first(co.name), 'act:coach:' + co.id), B('Book a 1:1', 'act:go:coach.html?id=' + co.id + '#pt'), B('Book a free trial', 'flow:trial'), B('Something else', 'menu')] });
        return;
      }
      if (/^branch-/.test(c.file || '')) {
        var br = c.file.replace('branch-', ''), today = sessionsOn(new Date()).filter(function (s) { return s.branch === br && !s.past; });
        bot.say(hi + ' Welcome to the **' + bn(br) + '** floor. ' + (today.length ? today.length + ' classes still to come today, next is **' + today[0].cls.name + ' at ' + today[0].time + '**.' : 'Classes are done for today; doors open at 05:30.') + ' Parking is free in the basement.', { buttons: [B('Today at ' + bn(br), 'act:today:' + br), B('Book a free trial', 'flow:trial'), B('Directions', 'say:where is forge ' + br), B('Something else', 'menu')] });
        return;
      }
      if (c.page === 'hyrox' || c.file === 'hyrox') { bot.say(hi + ' Racing HYROX? I can plan your build-up from your race date, find the next simulation, or tell you which plan includes a race coach.', { buttons: [B('Plan my build-up', 'flow:hyrox'), B('Next HYROX Sim', 'act:times:hyrox-sim'), B('Which plan for racing?', 'say:which plan for hyrox'), B('Something else', 'menu')] }); return; }
      if (c.page === 'membership' || c.file === 'membership') { bot.say(hi + ' Plans run from **₹2,900** to **₹9,800** a month, and every one starts with a free trial and a movement screen. Three questions and I’ll tell you which fits.', { buttons: [B('Which plan fits me?', 'flow:plan'), B('Compare all four', 'act:plans'), B('Can I freeze?', 'say:can i freeze my membership'), B('Free trial first', 'flow:trial')] }); return; }
      if (c.page === 'corporate' || c.file === 'corporate') { bot.say(hi + ' Looking at Forge for your team? I can book a pilot class for your people or connect you with our partnerships lead.', { buttons: [B('Book a team pilot class', 'act:corp'), B('Talk to a person', 'handover'), B('Something else', 'menu')] }); return; }
      if (me && me.memberNo) { var bk = fget('bookings', []).filter(function (b) { return b.name === me.name && b.date >= iso(new Date()); })[0]; bot.say(hi + (bk ? ' You’re booked into **' + (f && f.cls(bk.cls) ? f.cls(bk.cls).name : 'a class') + '** ' + dayWord(bk.date) + ' at ' + bk.time + '.' : ' Nothing booked yet this week.') + ' What can I do?', { buttons: [B('Find a class', 'flow:find'), B('My bookings', 'intent:mybooking'), B('Freeze my membership', 'intent:freeze'), B('Talk to the front desk', 'handover')] }); return; }
      bot.say(hi + ' This is the Forge front desk. Tell me what you want from training and I’ll find the class, book your **free trial** into a real slot, or help you pick a plan.', { buttons: MENU });
    },
    extract: function (text) {
      var e = {}, g = goalFrom(text), p = partFrom(text), b = branchFrom(text), d = dayFrom(text), ph = N.phone(text), nm = N.name(text);
      if (g) e.goal = g; if (p) e.part = p; if (b) e.branch = b; if (d) e.day = d; if (ph) e.phone = ph;
      if (nm && /\b(i am|i'm|im|my name|this is|naam)\b/i.test(text)) e.name = nm;
      if (/first (hyrox|race|time)|never raced|pehli (baar|race)/i.test(text)) e.exp = 'first'; else if (/raced before|second (hyrox|race)|again|beat my (time|pb)/i.test(text)) e.exp = 'again';
      var dv = String(text).match(/\b(open|pro|doubles|relay)\b/i); if (dv && /hyrox|race|division/i.test(text)) e.div = dv[1][0].toUpperCase() + dv[1].slice(1).toLowerCase();
      var w = String(text).match(/(\d{1,2})\s*(weeks?|hafte|wks?)/i); if (w) e.weeks = +w[1]; var mo = String(text).match(/(\d{1,2})\s*months?/i); if (mo) e.weeks = +mo[1] * 4;
      return e;
    },
    intents: [
      { id: 'find', label: 'Find a class', kw: ['find a class', 'which class', 'classes for', 'class for me', 'what class', 'timetable', 'schedule', 'show me classes', 'classes tomorrow', 'class today'], re: [/\bclass(es)?\b.*\b(today|tomorrow|morning|evening|saket|gurugram|strength|hyrox)\b/i], priority: 1,
        run: function (bot, m) { bot.startFlow('find', { goal: m.ent.goal, part: m.ent.part, branch: m.ent.branch, day: m.ent.day }); } },
      { id: 'trial', label: 'Free trial', kw: ['free trial', 'book a trial', 'trial', 'first class', 'try a class', 'join', 'sign up for a trial', 'come and try'], priority: 2,
        run: function (bot, m) { bot.startFlow('trial', { goal: m.ent.goal, part: m.ent.part, branch: m.ent.branch === 'any' ? undefined : m.ent.branch, day: m.ent.day, name: m.ent.name, phone: m.ent.phone }); } },
      { id: 'plan', label: 'Plans and prices', kw: ['how much', 'price', 'membership', 'plans', 'which plan', 'fees', 'cost', 'monthly', 'pricing', 'rates'], priority: 1, run: function (bot, m) { if (/which|best|suit|fit|recommend/.test(m.norm)) { bot.startFlow('plan'); return; } bot.agent.actions.plans(bot); } },
      { id: 'hyrox', label: 'HYROX prep', kw: ['hyrox', 'race', 'race prep', 'simulation', 'hyrox plan', 'doubles race'], priority: 1, run: function (bot, m) { if (/which plan/.test(m.norm)) { var p = plans().filter(function (x) { return x.id === 'race'; })[0]; bot.say('**Race Team** is the one built for it: everything in Club, a monthly 1:1 with a race coach, a written race plan and a seat at every HYROX Sim.', { cards: p ? [planCard(p, 'For racers')] : [], buttons: [B('Plan my build-up', 'flow:hyrox')] }); return; } bot.startFlow('hyrox', { weeks: m.ent.weeks, exp: m.ent.exp, div: m.ent.div }); } },
      { id: 'freeze', label: 'Freeze or cancel', kw: ['freeze', 'cancel membership', 'pause membership', 'stop membership', 'refund', 'travelling', 'injured'], priority: 2,
        run: function (bot, m) {
          var cancel = /cancel membership|refund|stop|end/.test(m.norm) && !/freeze/.test(m.norm);
          bot.say(cancel ? 'Sorry to hear it. Monthly plans stop at the end of the month you’re in, with no notice fee. Yearly plans refund the unused months after the first three. Before you go: a **freeze** keeps your rate and your PRs, and most people who cancel for travel or exams freeze instead.' : 'You can freeze for **2 to 8 weeks**, once a year, free. Your renewal date moves by the same time, and your price is locked.',
            { buttons: [B('Freeze my membership', 'flow:freeze'), B('Do it in the member app', 'act:go:member.html'), B('Talk to the front desk', 'handover')] });
        } },
      { id: 'mybooking', label: 'My bookings', kw: ['my booking', 'my bookings', 'booking status', 'am i booked', 'cancel my class', 'cancel booking', 'what did i book'], priority: 2, run: function (bot, m) { bot.startFlow('lookup', { who: m.ent.phone || (fget('session', null) || {}).name || fget('me', {}).name }); } },
      { id: 'coach', label: 'Coaches', kw: ['coach', 'coaches', 'trainer', 'personal trainer', 'pt', 'one on one', '1:1', 'personal training'], priority: 0, run: function (bot) { var f = F(); if (!f) return; bot.say('Six coaches across the two floors. A 1:1 is ₹1,800 to ₹2,500, and Race Team members get one a month included.', { cards: f.coaches.map(function (c) { return { title: c.name, sub: c.role + ' · ' + bn(c.branch), img: img(c.photo), meta: c.spec.slice(0, 2), buttons: [B('Classes with ' + first(c.name), 'act:coach:' + c.id), B('Book a 1:1', 'act:go:coach.html?id=' + c.id + '#pt')] }; }) }); } },
      { id: 'where', label: 'Where are you', kw: ['where is', 'directions', 'parking', 'how to reach', 'metro', 'nearest'], priority: 0, run: function (bot, m) { var b = m.ent.branch, f = F(); var line = function (k) { return '**' + bn(k) + '**: ' + (f ? f.branches[k].addr : '') + '. ' + (k === 'saket' ? 'Malviya Nagar metro is 9 minutes on foot.' : 'Golf Course Road; Sector 55–56 Rapid Metro is a 6-minute walk.') + ' Free basement parking.'; }; bot.say(b && b !== 'any' ? line(b) : line('saket') + '\n' + line('gurugram'), { buttons: [B('Tour Saket', 'act:go:branch-saket.html'), B('Tour Gurugram', 'act:go:branch-gurugram.html'), B('Book a free trial', 'flow:trial')] }); } }
    ],
    flows: {
      find: { intent: 'find', slots: [
        { name: 'goal', ask: function (bot) { bot.say('What are you training for?', { buttons: Object.keys(GOALS).map(function (k) { return B(GOALS[k], 'slot:goal=' + k); }) }); }, parse: function (t) { return goalFrom(t); }, hint: 'Pick one, or say it your way: “get stronger”, “run better”, “my first HYROX”.' },
        { name: 'part', ask: function (bot) { bot.say('When do you like to train?', { buttons: [B('Mornings', 'slot:part=morning'), B('Midday', 'slot:part=midday'), B('Evenings', 'slot:part=evening'), B('Any time', 'slot:part=any')] }); }, parse: function (t) { return partFrom(t) || (/any|whenever|flexible|koi bhi/i.test(t) ? 'any' : undefined); } },
        { name: 'branch', ask: function (bot) { bot.say('Which floor is closer?', { buttons: [B('Saket', 'slot:branch=saket'), B('Gurugram', 'slot:branch=gurugram'), B('Either', 'slot:branch=any')] }); }, parse: function (t) { return branchFrom(t); } }
      ], done: function (bot, s) {
        var r = find(s.goal, s.part === 'any' ? null : s.part, s.branch, s.day), wide = false;
        if (!r.length) { r = find(s.goal, null, s.branch); wide = true; }
        if (!r.length) r = find(null, s.part === 'any' ? null : s.part, s.branch);
        bot.mem.lastFind = s;
        if (!r.length) { bot.say('Every class like that is full for the next few days. Want me to put you on a waitlist, or find something close?', { buttons: [B('Find something close', 'say:any class in the next 3 days'), B('Talk to the front desk', 'handover')] }); return; }
        bot.say((wide ? 'Nothing in that window, so I widened it. ' : '') + 'Here’s what has room' + (s.branch && s.branch !== 'any' ? ' at ' + bn(s.branch) : '') + '. Your first class is free:', { cards: r.map(function (x) { return sessCard(x); }), buttons: [B('Different time', 'flow:find'), B('Which plan fits me?', 'flow:plan')] });
      } },
      trial: { intent: 'trial', slots: [
        { name: 'branch', ask: function (bot) { bot.say('Let’s get your free class booked. Which floor?', { buttons: [B('Saket', 'slot:branch=saket'), B('Gurugram', 'slot:branch=gurugram')] }); }, parse: function (t) { var b = branchFrom(t); return b === 'any' ? 'saket' : b; } },
        { name: 'day', ask: function (bot, s) { bot.say('Which day suits you at ' + bn(s.branch) + '?', { buttons: dayButtons('day', 5) }); }, parse: function (t) { return dayFrom(t); }, validate: function (v) { var n = (new Date(v + 'T00:00') - new Date(iso(new Date()) + 'T00:00')) / DAY; if (n < 0) return 'That day has gone. Pick today or later.'; if (n > 13) return 'We book trials up to two weeks ahead. Pick a closer day?'; } },
        { name: 'slot', ask: function (bot, s) {
            var L = sessionsOn(new Date(s.day + 'T00:00')).filter(function (x) { return x.branch === s.branch && !x.past && x.left > 0; }), g = s.goal;
            var good = L.filter(function (x) { return g ? (g === 'start' ? BEGINNER.indexOf(x.cls.id) > -1 : x.cls.type === g) : BEGINNER.indexOf(x.cls.id) > -1 || x.cls.type === 'strength'; }); if (good.length < 3) good = good.concat(L.filter(function (x) { return good.indexOf(x) < 0; })).slice(0, 8);
            if (s.part && PARTS[s.part]) { var inP = good.filter(function (x) { return inPart(x.time, s.part); }); good = inP.concat(good.filter(function (x) { return inP.indexOf(x) < 0; })); }
            if (!good.length) { bot.say('That day is full at ' + bn(s.branch) + '. Pick another?', { buttons: dayButtons('day', 5) }); bot.slots.day = undefined; return; }
            bot.say('Pick a time on **' + nice(s.day) + '**' + (s.part && PARTS[s.part] ? ', ' + PARTS[s.part][2].toLowerCase() + ' first' : '') + '. Spots left are live:', { buttons: good.slice(0, 6).map(function (x) { return B(x.time + ' · ' + x.cls.name + (x.left <= 3 ? ' (' + x.left + ' left)' : ''), 'slot:slot=' + x.id); }) });
          }, parse: function (t, bot, s) { var w = N.when(t), tm = w && w.time; if (!tm) { var m = String(t).match(/\b(\d{1,2})(?::(\d{2}))?\b/); if (m) { var h = +m[1]; if (h < 12 && /evening|shaam|pm/i.test(t)) h += 12; tm = pad(h) + ':' + (m[2] || '00'); } } if (!tm) return; var L = sessionsOn(new Date(s.day + 'T00:00')).filter(function (x) { return x.branch === s.branch && !x.past && x.left > 0; }); var hit = L.filter(function (x) { return x.time === tm; })[0] || L.filter(function (x) { return x.time.slice(0, 2) === tm.slice(0, 2); })[0]; return hit && hit.id; } },
        { name: 'goal', optional: false, when: function (bot, s) { return !s.goal; }, ask: function (bot) { bot.say('What would you like from training? The coach reads this before you arrive.', { buttons: [B('Get stronger', 'slot:goal=strength'), B('Fitter, faster', 'slot:goal=engine'), B('A HYROX race', 'slot:goal=hyrox'), B('Just starting', 'slot:goal=start')] }); }, parse: function (t) { if (/\b(i am|i'm|im|my name|this is|naam)\b/i.test(t) || /\d{3,}/.test(t.replace(/\s/g, ''))) return goalFrom(t); return goalFrom(t) || (t.trim().length > 3 ? t.trim().slice(0, 80) : undefined); } },
        { name: 'name', ask: function (bot) { bot.say('Who should the coach expect? Your first and last name.'); }, parse: function (t) { var n = N.name(t) || String(t).trim(); return n.length >= 2 && !/\d/.test(n) ? n.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }).slice(0, 40) : undefined; }, hint: 'Just your name, like “Riya Sharma”.' },
        { name: 'phone', ask: function (bot, s) { bot.say('And a WhatsApp number for ' + first(s.name) + '? We send the confirmation and one reminder, nothing else.'); }, parse: function (t) { return N.phone(t); }, validate: function (v) { var d = String(v).replace(/\D/g, ''); if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2); if (d.length !== 10) return 'That’s ' + d.length + ' digits. An Indian mobile number has 10.'; if (!/^[6-9]/.test(d)) return 'Indian mobile numbers start with 6, 7, 8 or 9. Mind checking?'; }, hint: 'A 10-digit mobile number, like 98xxx xxxxx.' }
      ], done: function (bot, s) {
        var x = slotById(s.slot), f = F(); if (!x) { bot.say('That slot just filled. Let’s pick another.'); bot.startFlow('trial', { branch: s.branch, day: s.day, goal: s.goal, name: s.name, phone: s.phone }); return; }
        bot.user.name = s.name; bot.user.phone = s.phone;
        if (f) { var rec = f.book(x, { name: s.name, phone: mask(s.phone) }); rec.source = 'chat'; var bk = fget('bookings', []); bk.forEach(function (b) { if (b.id === rec.id) b.source = 'chat'; }); fset('bookings', bk); fset('me', { name: s.name, phone: mask(s.phone) }); }
        var goal = GOALS[s.goal] || s.goal || '';
        leadToBoard(bot, { name: s.name, phone: s.phone, branch: s.branch, goal: goal, day: s.day, note: 'Booked in chat: ' + x.cls.name + ', ' + nice(s.day) + ' ' + x.time });
        crmLead(bot, 'book_trial', { cls: x.cls.name, slot: x.id, branch: s.branch, goal: goal }, { name: s.name, phone: s.phone });
        bot.event('booking', { kind: 'trial' });
        bot.say('You’re in, ' + first(s.name) + '. See you on the floor.', { cards: [{ title: x.cls.name + ' · free trial', sub: nice(s.day) + ' · ' + x.time + ' · Forge ' + bn(s.branch), img: img(x.cls.photo), badge: 'Booked', meta: ['Coach ' + x.coach.name + ' knows you’re coming', 'Arrive 10 minutes early for a short movement screen', 'Bring trainers and water; towels are on us', 'Confirmation on WhatsApp to ' + mask(s.phone)], buttons: [B('Add to calendar', 'act:ics:' + x.id), B('Directions', 'say:where is forge ' + s.branch)] }],
          buttons: [B('Which plan after the trial?', 'flow:plan'), B('That’s all, thanks', 'say:thanks')] });
      } },
      plan: { intent: 'plan', slots: [
        { name: 'often', ask: function (bot) { bot.say('How often will you realistically train?', { buttons: [B('Twice a week', 'slot:often=2'), B('3–4 times', 'slot:often=4'), B('5 or more', 'slot:often=6')] }); }, parse: function (t) { var m = String(t).match(/\b(\d)\b/); if (m) return +m[1] <= 2 ? '2' : +m[1] <= 4 ? '4' : '6'; if (/twice|two/i.test(t)) return '2'; if (/daily|every day|roz/i.test(t)) return '6'; } },
        { name: 'when', ask: function (bot) { bot.say('When can you come in?', { buttons: [B('Weekdays 10:00–17:00', 'slot:when=off'), B('Before or after work', 'slot:when=peak'), B('All over the place', 'slot:when=peak')] }); }, parse: function (t) { if (/day ?time|10|off.?peak|student|shift|retired/i.test(t)) return 'off'; if (/morning|evening|after work|before work|weekend|any/i.test(t)) return 'peak'; } },
        { name: 'coached', ask: function (bot) { bot.say('Do you want coached classes, or your own programme on the open floor?', { buttons: [B('Coached classes', 'slot:coached=yes'), B('My own programme', 'slot:coached=no'), B('Racing HYROX', 'slot:coached=race')] }); }, parse: function (t) { if (/hyrox|race/i.test(t)) return 'race'; var y = N.yesno(t); if (/own|myself|solo|open/i.test(t)) return 'no'; if (/class|coach/i.test(t) || y === true) return 'yes'; if (y === false) return 'no'; } }
      ], done: function (bot, s) {
        var P = plans(), pick = s.coached === 'race' ? 'race' : s.when === 'off' && s.often !== '6' ? 'offpeak' : s.coached === 'no' ? 'open' : 'club', p = P.filter(function (x) { return x.id === pick; })[0];
        var why = { race: 'You’re racing, so you want the coach who knows your splits and a seat at every simulation.', offpeak: 'You train in the quiet hours, so there’s no reason to pay for 18:30.', open: 'You have your own programme; you need the floor, not a class.', club: 'Coached classes ' + (s.often === '2' ? 'twice a week' : 'most days') + ', both floors, and a written programme. It’s what most members pick.' }[pick];
        var alt = P.filter(function (x) { return x.id !== pick; }).sort(function (a, b) { return Math.abs(a.m - p.m) - Math.abs(b.m - p.m); })[0];
        bot.mem.plan = pick;
        bot.say('**' + p.name + '**, ' + rupees(p.m) + ' a month. ' + why + (s.often === '2' && pick === 'club' ? ' At twice a week that’s about ' + rupees(Math.round(p.m / 8.7)) + ' a session.' : ''), { cards: [planCard(p, 'Best fit'), alt ? planCard(alt, 'Also worth a look') : null].filter(Boolean), buttons: [B('Compare all four', 'act:plans'), B('Free trial first', 'flow:trial')] });
      } },
      hyrox: { intent: 'hyrox', slots: [
        { name: 'weeks', ask: function (bot) { bot.say('How far away is your race?', { buttons: [B('Under 8 weeks', 'slot:weeks=6'), B('8–16 weeks', 'slot:weeks=12'), B('4 months or more', 'slot:weeks=20'), B('No date yet', 'slot:weeks=0')] }); }, coerce: function (v) { return +v; }, parse: function (t) { var w = String(t).match(/(\d{1,2})\s*(weeks?|hafte|wks?)/i), m = String(t).match(/(\d{1,2})\s*months?/i); if (w) return +w[1]; if (m) return +m[1] * 4; if (/no date|not sure|someday|maybe/i.test(t)) return 0; } },
        { name: 'exp', ask: function (bot) { bot.say('Raced one before?', { buttons: [B('This is my first', 'slot:exp=first'), B('I’ve raced before', 'slot:exp=again')] }); }, parse: function (t) { if (/first|never|pehli/i.test(t)) return 'first'; if (/before|again|raced|yes|second|pb/i.test(t)) return 'again'; } },
        { name: 'div', ask: function (bot) { bot.say('Which division?', { buttons: [B('Open', 'slot:div=Open'), B('Pro', 'slot:div=Pro'), B('Doubles', 'slot:div=Doubles'), B('Relay', 'slot:div=Relay')] }); }, parse: function (t) { var m = String(t).match(/\b(open|pro|doubles|relay)\b/i); return m ? m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() : undefined; } }
      ], done: function (bot, s) {
        var w = s.weeks, ph = !w ? ['Base', 'Start with 3 Strength + 2 Engine a week. Pick a race once your 1 km run is steady.'] : w < 8 ? ['Sharpen', 'Short block: 2 HYROX Sims, station technique twice a week, then a 7-day taper.'] : w <= 16 ? ['Build', 'Weeks 1–4 strength base, 5–' + (w - 3) + ' race-specific engine, then 2 simulations and a taper.'] : ['Base → Build → Peak', 'Long runway: 6 weeks of strength first, then build your engine, then race-specific work from week ' + (w - 10) + '.'];
        var sims = upcoming(7).filter(function (x) { return x.cls.id === 'hyrox-sim' || x.cls.id === 'stations' || (s.div === 'Doubles' && x.cls.id === 'doubles'); }).filter(function (x) { return x.left > 0; }).slice(0, 3);
        bot.mem.race = s;
        bot.say((w ? w + ' weeks out' : 'No date yet') + ', ' + (s.exp === 'first' ? 'first race' : 'racing again') + ', ' + s.div + '. Your phase: **' + ph[0] + '**. ' + ph[1] + (s.exp === 'first' ? ' First-timers lose most time on the sled and wall balls, so we put those twice a week from day one.' : ' Bring your last splits; we’ll find the station costing you the most.'),
          { cards: sims.map(function (x) { return sessCard(x, [B('Book my free trial here', 'act:pick:' + x.id)]); }), buttons: [B('Have a race coach call me', 'flow:callback'), B('Race Team plan', 'say:which plan for hyrox'), B('See the 8 stations', 'act:go:hyrox.html#stations')] });
      } },
      callback: { slots: [
        { name: 'name', when: function (bot) { return !bot.user.name; }, ask: function (bot) { bot.say('Who should the coach ask for?'); }, parse: function (t) { var n = N.name(t) || String(t).trim(); return n.length >= 2 && !/\d/.test(n) ? n.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }) : undefined; } },
        { name: 'phone', when: function (bot) { return !bot.user.phone; }, ask: function (bot) { bot.say('And the best number to call?'); }, parse: function (t) { return N.phone(t); }, validate: function (v) { var d = String(v).replace(/\D/g, '').slice(-10); if (d.length !== 10 || !/^[6-9]/.test(d)) return 'That doesn’t look like a 10-digit Indian mobile. Mind checking?'; } },
        { name: 'time', ask: function (bot) { bot.say('When’s good for a 10-minute call?', { buttons: [B('This evening', 'slot:time=This evening'), B('Tomorrow morning', 'slot:time=Tomorrow morning'), B('Tomorrow evening', 'slot:time=Tomorrow evening')] }); }, parse: function (t) { return String(t).trim().slice(0, 40); } }
      ], done: function (bot, s) {
        var name = s.name || bot.user.name, phone = s.phone || bot.user.phone; bot.user.name = name; bot.user.phone = phone; var r = bot.mem.race || {};
        leadToBoard(bot, { name: name, phone: phone, branch: 'gurugram', goal: 'HYROX ' + (r.div || '') + (r.weeks ? ' in ' + r.weeks + ' weeks' : '') + (r.exp === 'first' ? ', first race' : ''), plan: 'Race Team', note: 'Asked in chat for a race-coach call: ' + s.time });
        crmLead(bot, 'callback', { topic: 'HYROX', when: s.time, race: r }, { name: name, phone: phone });
        bot.say('Done. Tenzin, our race coach, will call ' + first(name) + ' **' + s.time.toLowerCase() + '** on ' + mask(phone) + '. Have your last race splits handy if you’ve got them.', { buttons: [B('Find a class meanwhile', 'flow:find'), B('That’s all, thanks', 'say:thanks')] });
      } },
      freeze: { slots: [
        { name: 'who', ask: function (bot) { var me = fget('session', null); bot.say('Which membership? Your member number (like FM-20417) or the name on it.', { buttons: me && me.memberNo ? [B(me.name + ' · ' + me.memberNo, 'slot:who=' + me.memberNo)] : [] }); }, parse: function (t) { var m = String(t).toUpperCase().match(/FM-?\d{5}/); if (m) return m[0].replace(/FM-?/, 'FM-'); var n = String(t).trim(); return n.length > 2 ? n : undefined; } },
        { name: 'weeks', ask: function (bot) { bot.say('For how long?', { buttons: [B('2 weeks', 'slot:weeks=2'), B('4 weeks', 'slot:weeks=4'), B('6 weeks', 'slot:weeks=6'), B('8 weeks', 'slot:weeks=8')] }); }, coerce: function (v) { return +v; }, parse: function (t) { var m = String(t).match(/(\d)\s*(weeks?|hafte|wks?)/i), mo = String(t).match(/(\d)\s*months?/i); return m ? +m[1] : mo ? +mo[1] * 4 : undefined; }, validate: function (v) { if (v < 2 || v > 8) return 'Freezes run 2 to 8 weeks. For longer, the front desk can help.'; } },
        { name: 'reason', ask: function (bot) { bot.say('What’s it for? It helps the desk approve it fast.', { buttons: [B('Travel', 'slot:reason=Travel'), B('Exams or work', 'slot:reason=Exams or work'), B('Injury or illness', 'slot:reason=Injury or illness'), B('Something else', 'slot:reason=Other')] }); }, parse: function (t) { return String(t).trim().slice(0, 60); } }
      ], done: function (bot, s) {
        var me = fget('session', null), no = /^FM-/.test(s.who) ? s.who : (me && me.name && me.name.toLowerCase() === String(s.who).toLowerCase() ? me.memberNo : ''), name = me && me.memberNo === no ? me.name : (/^FM-/.test(s.who) ? (me && me.name) || 'Member ' + s.who : s.who);
        var from = new Date(Date.now() + 3 * DAY), nr = new Date((me && me.renews ? new Date(me.renews + 'T00:00') : new Date(Date.now() + 20 * DAY)).getTime() + s.weeks * 7 * DAY);
        var fz = fget('freezes', []); fz.unshift({ id: 'fzc' + Date.now().toString(36), memberNo: no, name: name, plan: (me && me.plan) || '', branch: (me && me.home) || 'saket', weeks: s.weeks, from: iso(from), reason: s.reason, newRenews: iso(nr), status: 'pending', at: new Date().toISOString(), via: 'chat', convo: bot.id }); fset('freezes', fz);
        crmLead(bot, 'freeze', { weeks: s.weeks, reason: s.reason, memberNo: no }, { name: name });
        bot.say('Request sent. The desk usually approves within a few hours, and you’ll get a WhatsApp when it’s done.', { cards: [{ title: s.weeks + '-week freeze', sub: name + (no ? ' · ' + no : ''), badge: 'Pending', meta: ['From ' + nice(iso(from)), 'Renewal moves to ' + nice(iso(nr)), 'Reason: ' + s.reason, 'Your price stays locked'] }], buttons: [B('Open the member app', 'act:go:member.html'), B('That’s all, thanks', 'say:thanks')] });
      } },
      lookup: { slots: [
        { name: 'who', ask: function (bot) { bot.say('Whose bookings? Your name, or the last 3 digits of your phone.'); }, parse: function (t) { var d = String(t).replace(/\D/g, ''); if (d.length >= 3) return d.slice(-3); var n = String(t).trim(); return n.length > 1 ? n : undefined; } }
      ], done: function (bot, s) {
        var q = String(s.who).toLowerCase(), f = F(), today = iso(new Date());
        var L = fget('bookings', []).filter(function (b) { return b.date >= today && (b.name.toLowerCase().indexOf(q) > -1 || String(b.phone || '').replace(/\D/g, '').slice(-3) === q); }).sort(function (a, b) { return a.date + a.time < b.date + b.time ? -1 : 1; });
        if (!L.length) { bot.say('I can’t find an upcoming booking for “' + s.who + '”. It may be under another name, or it’s already passed.', { buttons: [B('Find a class', 'flow:find'), B('Talk to the front desk', 'handover')] }); return; }
        bot.say(L.length === 1 ? 'One booking coming up:' : L.length + ' bookings coming up:', { cards: L.slice(0, 4).map(function (b) { var c = f && f.cls(b.cls); return { title: c ? c.name : b.cls, sub: nice(b.date) + ' · ' + b.time + ' · ' + bn(b.branch), img: c ? img(c.photo) : undefined, badge: 'Booked', meta: ['For ' + b.name, b.source === 'chat' ? 'Booked in chat' : 'Booked on the website'], buttons: [B('Cancel this one', 'act:cancel:' + b.slot)] }; }), buttons: [B('Find another class', 'flow:find')] });
      } }
    },
    actions: {
      pick: function (bot, id) { var x = slotById(id); if (!x) { bot.say('That one just filled. Here’s what else has room:'); bot.startFlow('find', { goal: (bot.mem.lastFind || {}).goal }); return; } bot.startFlow('trial', { branch: x.branch, day: x.date, slot: x.id, goal: x.cls.type === 'hyrox' ? 'hyrox' : x.cls.type, name: bot.user.name, phone: bot.user.phone }); },
      cls: function (bot, id) { var f = F(), c = f && f.cls(id); if (!c) return; bot.say('**' + c.name + '**: ' + c.lede, { cards: [{ title: c.name, sub: c.mins + ' min · ' + c.level, img: img(c.photo), meta: c.blocks.map(function (b) { return b[0] + ' ' + b[1]; }), buttons: [B('Next times', 'act:times:' + c.id), B('Open the class page', 'act:go:class.html?id=' + c.id)] }] }); },
      times: function (bot, id) { var f = F(), c = f && f.cls(id), L = upcoming(5).filter(function (s) { return s.cls.id === id && s.left > 0; }).slice(0, 4); if (!L.length) { bot.say('Full for the next few days. Want something similar?', { buttons: [B('Find something similar', 'flow:find')] }); return; } bot.say('Next ' + (c ? c.name : 'sessions') + ' with room:', { cards: L.map(function (s) { return sessCard(s); }) }); },
      coach: function (bot, id) { var L = upcoming(5).filter(function (s) { return s.coach.id === id && s.left > 0; }).slice(0, 4); bot.say(L.length ? 'Coming up with ' + first(L[0].coach.name) + ':' : 'No open spots with that coach this week.', { cards: L.map(function (s) { return sessCard(s); }) }); },
      today: function (bot, br) { var L = sessionsOn(new Date()).filter(function (s) { return s.branch === br && !s.past; }).slice(0, 4); bot.say(L.length ? 'Still to come today at ' + bn(br) + ':' : 'That’s it for today. Tomorrow starts at 06:00.', { cards: L.map(function (s) { return sessCard(s); }) }); },
      plans: function (bot) { bot.say('Four plans, all month to month, all with a free trial and a movement screen. Prices include GST.', { cards: plans().map(function (p) { return planCard(p); }), buttons: [B('Which plan fits me?', 'flow:plan'), B('Can I freeze?', 'say:can i freeze')] }); },
      cancel: function (bot, slot) { var f = F(), b = fget('bookings', []).filter(function (x) { return x.slot === slot; })[0]; if (!b || !f) return; f.cancel(slot); bot.say('Cancelled your ' + (f.cls(b.cls) ? f.cls(b.cls).name : 'class') + ' on ' + nice(b.date) + ' at ' + b.time + '. The spot goes to the first person on the waitlist.', { buttons: [B('Find another class', 'flow:find'), B('That’s all, thanks', 'say:thanks')] }); },
      ics: function (bot, id) { var x = slotById(id); if (!x) return; try { var st = x.date.replace(/-/g, '') + 'T' + x.time.replace(':', '') + '00', end = new Date(new Date(x.date + 'T' + x.time).getTime() + x.cls.mins * 6e4), en = iso(end).replace(/-/g, '') + 'T' + pad(end.getHours()) + pad(end.getMinutes()) + '00';
        var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Forge//Front desk//EN', 'BEGIN:VEVENT', 'UID:' + id.replace(/\W/g, '') + '@forge', 'DTSTART:' + st, 'DTEND:' + en, 'SUMMARY:Forge · ' + x.cls.name + ' (free trial)', 'LOCATION:Forge ' + bn(x.branch), 'DESCRIPTION:Arrive 10 minutes early for your movement screen.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
        var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'forge-trial.ics'; document.body.appendChild(a); a.click(); a.remove(); bot.say('Saved to your calendar file. Open it to add the class.'); } catch (e) { bot.say('Your calendar didn’t open, but the booking is safe.'); } },
      corp: function (bot) { bot.say('A pilot class is one free 60-minute session for up to 12 of your people, at either floor. Tell me your name and I’ll have our partnerships lead call you.'); bot.startFlow('callback'); },
      go: function (bot, url) { go(bot, url); }
    },
    kb: [
      { id: 'hours', q: 'What are your opening hours?', a: 'Both floors are open **05:30–22:30** Monday to Saturday, and **07:00–13:00** on Sunday. Coached classes run 06:00 to 20:00.', keys: ['opening hours', 'timings', 'what time do you open', 'kab khulta hai', 'open on sunday', 'closing time', 'timing'] },
      { id: 'trialfree', q: 'Is the trial really free?', a: 'Yes. One coached class plus a 10-minute movement screen, no card needed and no hard sell after.', keys: ['trial free', 'is the trial free', 'free class', 'trial cost', 'trial ka paisa'], buttons: [B('Book a free trial', 'flow:trial')] },
      { id: 'beginner', q: 'I’m a complete beginner. Is that OK?', a: 'Most of our members started with **Foundations**: barbell basics with a coach to every 6 people. Coaches scale every class, so you’ll never be the only one learning.', keys: ['beginner', 'complete beginner', 'never lifted', 'ok for beginners', 'too unfit', 'out of shape', 'first time gym', 'nervous'], buttons: [B('Classes for beginners', 'say:beginner class this week')] },
      { id: 'bring', q: 'What should I bring?', a: 'Flat trainers, water and clothes you can squat in. Towels, chalk and lockers are on us. Arrive 10 minutes early for your first class.', keys: ['what to bring', 'what should i bring', 'shoes', 'what to wear', 'kya lana hai', 'dress code'] },
      { id: 'parking', q: 'Is there parking?', a: 'Free basement parking at both floors. Tell the guard you’re visiting Forge. Bike stands at the entrance.', keys: ['parking', 'car park', 'park my car', 'bike parking', 'parking hai'] },
      { id: 'showers', q: 'Are there showers and lockers?', a: 'Yes: showers, lockers with your own code, hair dryers and towels at both floors. Saket also has the sauna and two plunge tubs.', keys: ['showers', 'locker', 'changing room', 'bathroom', 'towel', 'washroom'] },
      { id: 'sauna', q: 'Do you have a sauna?', a: 'Saket has a sauna and two cold plunge tubs. Club gets 2 contrast sessions a month; Race Team is unlimited. Book them in the app.', keys: ['sauna', 'plunge', 'ice bath', 'cold plunge', 'steam', 'contrast'] },
      { id: 'pt', q: 'How much is personal training?', a: 'A 1:1 is **₹2,500** for a 45-minute technique review or **₹1,800** for a 30-minute programme consult. Race Team includes a monthly 1:1 race plan.', keys: ['personal training price', 'pt cost', 'one on one', 'personal trainer', 'pt kitne ka', '1:1 price'], buttons: [B('Meet the coaches', 'intent:coach')] },
      { id: 'daypass', q: 'Do you have a day pass?', a: 'Yes, **₹800** at the desk: open floor for the day plus one class if there’s room. Visiting from out of town? Members of other clubs get the first visit free.', keys: ['day pass', 'drop in', 'one day', 'single visit', 'guest pass', 'visiting'] },
      { id: 'women', q: 'Is it comfortable for women?', a: 'Over 40% of our members are women, and four of our six coaches are. Every class is mixed, coached and scaled; there’s a women’s Foundations block every Saturday at 09:00 in Saket.', keys: ['women', 'ladies', 'female', 'women only', 'safe for women', 'female trainer'] },
      { id: 'age', q: 'Is there an age limit?', a: 'From 16 with a parent’s consent, and no upper limit: our oldest member deadlifts at 71. Over 60 or managing a condition? We start with a longer screen.', keys: ['age limit', 'too old', 'teenager', 'kids', 'children', 'over 50', 'senior'] },
      { id: 'injury', q: 'I have an injury. Can I still train?', a: 'Usually, yes. Tell the coach at your screen; they’ll scale around it, and our physio partner can see you at Saket on Tuesdays and Fridays. If a doctor has told you not to train, start there first.', keys: ['injury', 'injured', 'back pain', 'knee pain', 'shoulder', 'physio', 'slip disc', 'pregnant', 'postnatal'] },
      { id: 'payment', q: 'How do I pay?', a: 'UPI, cards or netbanking at sign-up, or at the desk. Monthly plans can renew by UPI autopay. We never ask for card or bank details in chat.', keys: ['payment', 'pay', 'upi', 'emi', 'card', 'cash', 'autopay', 'payment methods'] },
      { id: 'freezepol', q: 'Can I freeze my membership?', a: 'Yes, **2 to 8 weeks**, once a year, free. Your renewal date moves by the same time and your price stays locked.', keys: ['can i freeze', 'freeze policy', 'pause membership', 'travelling for a month', 'membership hold'], buttons: [B('Freeze my membership', 'flow:freeze')] },
      { id: 'cancelpol', q: 'How do I cancel?', a: 'Monthly plans stop at the end of the month you’re in, no fee. Yearly plans refund unused months after the first three. Tell the desk or use the member app.', keys: ['how to cancel', 'cancellation policy', 'refund policy', 'lock in', 'contract', 'notice period'] },
      { id: 'hyroxwhat', q: 'What is HYROX?', a: 'A fitness race: 8 × 1 km runs, each followed by a station (ski erg, sled push, sled pull, burpee broad jumps, row, farmers carry, sandbag lunges, wall balls). Most people finish in 70 to 110 minutes.', keys: ['what is hyrox', 'hyrox kya hai', 'hyrox stations', 'explain hyrox'], buttons: [B('Plan my build-up', 'flow:hyrox')] },
      { id: 'branches', q: 'Can I use both floors?', a: 'Club and Race Team work at **both** Saket and Gurugram. Off-Peak and Open Gym are home-floor only, with 4 visits a month at the other.', keys: ['both branches', 'other branch', 'both floors', 'saket and gurugram', 'switch branch'] },
      { id: 'classsize', q: 'How big are the classes?', a: '12 people for Heavy Hour, 14 to 20 for engine classes. Always one coach to every 6 lifters on the barbell.', keys: ['class size', 'how many people', 'crowded', 'busy', 'rush'] },
      { id: 'busy', q: 'When is it quiet?', a: '10:00–16:00 on weekdays is quiet. 07:00 and 18:30 are the busy classes; book those a day ahead.', keys: ['when is it quiet', 'least busy', 'peak hours', 'empty', 'kab bheed kam'] },
      { id: 'nutrition', q: 'Do you help with nutrition?', a: 'Coaches set simple habits in your programme (protein, sleep, steps). For a full plan, our partner dietitian sees members at Saket on Saturdays, ₹1,500 a session.', keys: ['diet', 'nutrition', 'meal plan', 'protein', 'dietitian', 'weight loss diet', 'khana'] },
      { id: 'corporate', q: 'Do you do corporate memberships?', a: 'Yes, from 10 people: Club for ₹4,900 a person, a monthly team class and a usage report. We’ll run a free pilot class for your team first.', keys: ['corporate', 'company', 'team membership', 'office', 'employees', 'group discount'], buttons: [B('Book a team pilot class', 'act:corp')] },
      { id: 'refer', q: 'Do you have a referral offer?', a: 'Members get a free month for every friend who joins, and the friend gets their first month at the trial rate. Your code is in the member app.', keys: ['referral', 'refer a friend', 'invite', 'bring a friend', 'discount code', 'offer', 'discount'] }
    ],
    freeText: function (bot, m) {
      if (/\b(thanks|thank you|shukriya|dhanyavaad)\b/i.test(m.text)) { bot.say('Any time. See you on the floor.', { buttons: [B('Something else', 'menu')] }); return true; }
      var g = goalFrom(m.text), p = partFrom(m.text), d = dayFrom(m.text);
      if (g || p || d) { bot.startFlow('find', { goal: g, part: p, day: d, branch: branchFrom(m.text) }); return true; }
      return false;
    }
  });
})();
