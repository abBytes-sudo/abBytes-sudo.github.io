/* Aaranya concierge: the scripted assistant for Aaranya Residences (samples/launch). Rule-based, no LLM, no network calls.
   It reads the live inventory from window.AAR (launch/data.js), so a hold made in the back office changes its answers at once,
   and it writes straight into the sales back office: enquiries (aaranya:leads, source "Chat", with the conversation id for the
   transcript) and site visits (aaranya:visits, which also feed demo-bridge:site-visits). Loaded lazily by launch/concierge.js. */
(function () {
  'use strict';
  var O = window.Orbit; if (!O || O.agents.launch) return;
  var N = O.nlp, DAY = 864e5;
  var B = function (l, v) { return { label: l, value: v }; };
  function A() { return window.AAR || null; }
  function first(n) { return String(n || '').split(' ')[0]; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function img(k) { return O.samples('launch/photos/' + k + '-s.webp'); }
  function daypart() { var h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; }
  var TYPEIMG = { A: 'i-family', B: 'i-bed-study', C: 'i-living', D: 'i-sunroom' };
  var BHK = { A: '2 BHK', B: '3 BHK', C: '3 BHK + study', D: '4 BHK' };
  var BUDGETS = { u25: [0, 2.5e7, 'Under ₹2.5 Cr'], m35: [2.5e7, 3.5e7, '₹2.5–3.5 Cr'], m50: [3.5e7, 5e7, '₹3.5–5 Cr'], o50: [5e7, 9e9, '₹5 Cr +'], any: [0, 9e9, 'Any budget'] };
  var BANDS = { low: [1, 12, 'Lower floors (1–12)'], mid: [13, 28, 'Middle floors (13–28)'], high: [29, 46, 'High floors (29 +)'], any: [1, 46, 'Any floor'] };
  var FACE = { garden: 'Podium garden', N: 'North', E: 'East', S: 'South', W: 'West', any: 'Any facing' };

  /* ---------- reading what people type ---------- */
  function typeFrom(t) {
    t = String(t).toLowerCase(); if (/study|3\s*\+\s*s|3\.5\s*bhk|three and a half/.test(t)) return 'C';
    var b = N.bhk(t); if (b === 2) return 'A'; if (b === 3) return 'B'; if (b >= 4) return 'D';
    if (/\b(two|2)\s*(bed|bedroom)/.test(t)) return 'A'; if (/penthouse|biggest|largest|4\s*b/.test(t)) return 'D';
  }
  function budgetFrom(t) {
    var m = N.money(t); if (!m) return; var mx = m.max, mn = m.min || 0;
    if (mx && mx < 1e5) mx *= 1e7; // "under 3" in a property chat means crore
    if (mx && !mn) return 'max:' + Math.round(mx);
    if (mx) { if (mx <= 2.5e7) return 'u25'; if (mx <= 3.5e7) return 'm35'; if (mx <= 5e7) return 'm50'; return 'o50'; }
    if (mn >= 5e7) return 'o50'; if (mn >= 3.5e7) return 'm50';
  }
  function crFrom(t) { var m = String(t).toLowerCase().match(/(\d+(?:\.\d+)?)\s*(cr|crore|c\b)/); if (m) return +m[1] * 1e7; var l = String(t).toLowerCase().match(/(\d+(?:\.\d+)?)\s*(l|lakh|lac)/); if (l) return +l[1] * 1e5; var x = N.money(t); return x && (x.max || x.min) ? ((x.max || x.min) < 1e3 ? (x.max || x.min) * 1e7 : (x.max || x.min)) : undefined; }
  function faceFrom(t) { t = ' ' + String(t).toLowerCase() + ' '; if (/garden|green|podium|park|court|lawn/.test(t)) return 'garden'; if (/\b(east|purab|poorab|sunrise)\b/.test(t)) return 'E'; if (/\b(north|uttar)\b/.test(t)) return 'N'; if (/\b(west|paschim|sunset)\b/.test(t)) return 'W'; if (/\b(south|dakshin)\b/.test(t)) return 'S'; }
  function bandFrom(t) { t = String(t).toLowerCase(); if (/high|top|upper|above 20|view|oonch/.test(t)) return 'high'; if (/low|ground|lower|parents|elderly|neeche|first few/.test(t)) return 'low'; if (/mid|middle|10th|12th|15th/.test(t)) return 'mid'; }
  function unitFrom(t) { var m = String(t).toUpperCase().match(/\b([SKA])\s*-?\s*(\d{3,4})\b/); if (!m) return; var id = m[1] + '-' + m[2]; return A() && A().unit(id) ? id : undefined; }

  /* ---------- the inventory ---------- */
  function search(s) {
    var a = A(); if (!a) return [];
    var b = /^max:/.test(s.budget || '') ? [0, +s.budget.slice(4) + 1] : BUDGETS[s.budget || 'any'] || BUDGETS.any, fb = BANDS[s.band || 'any'];
    var L = a.UNITS.filter(function (u) {
      if (a.status(u.id) !== 'avail') return false; if (s.type && s.type !== 'any' && u.type !== s.type) return false;
      if (u.floor < fb[0] || u.floor > fb[1]) return false;
      if (s.face && s.face !== 'any') { if (s.face === 'garden') { if (!u.garden) return false; } else if (u.facingFull.indexOf(s.face) < 0) return false; }
      var p = a.price(u).total; return p >= b[0] && p < b[1];
    });
    // spread the answer across towers and floors, best value first
    L.sort(function (x, y) { return a.price(x).total - a.price(y).total; });
    var out = [], seen = {};
    L.forEach(function (u) { var k = u.tower + u.type + Math.floor(u.floor / 5); if (out.length < 4 && !seen[k]) { seen[k] = 1; out.push(u); } });
    return { list: out, total: L.length };
  }
  function unitCard(u, extra) {
    var a = A(), t = a.TYPES[u.type], st = a.status(u.id), pr = a.price(u), T = a.tower(u.tower);
    var mates = a.floorUnits(u.tower, u.floor).filter(function (x) { return a.status(x.id) === 'avail'; }).length;
    return { title: u.id + ' · ' + t.short, sub: T.name + ' · ' + a.ord(u.floor) + ' floor · ' + u.facing.toLowerCase() + ' facing', img: img(TYPEIMG[u.type]),
      badge: st === 'hold' ? 'On hold' : st === 'sold' ? 'Sold' : mates === 1 ? 'Last on this floor' : u.garden ? 'Garden view' : u.floor >= 36 ? 'High floor' : '',
      price: st === 'sold' ? 'Sold' : a.inr(pr.total), priceLabel: 'all-inclusive',
      meta: [t.carpet.toLocaleString('en-IN') + ' sq ft carpet', u.view, t.parking + ' covered parking'],
      buttons: extra || [B('Open in the picker', 'act:go:picker.html?unit=' + u.id), B('Visit this home', 'act:visit:' + u.id), B('EMI for it', 'act:emi:' + u.id)] };
  }
  function emi(P, rate, yrs) { var r = rate / 1200, n = yrs * 12; return P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1); }

  /* ---------- writing into the sales back office ---------- */
  function toOffice(bot, d) {
    var a = A(); if (!a) return null;
    var lead = a.addLead({ name: d.name, phone: d.phone || '', email: d.email || '', city: d.city || '', source: 'Chat', interest: d.interest || null, budget: d.budget || null,
      unit: d.unit || null, nri: !!d.nri, convo: bot.id, remark: 'From the website chat: ' + d.note });
    var out = bot.lead({ name: d.name, phone: d.phone || '', intent: d.intent, payload: { unit: d.unit, note: d.note, office: lead.id, page: bot.ctx.page || '' } });
    try { var c = O.convos.get(bot.id); if (c) O.convos.setStatus(bot.id, c.status, { leadId: out.id, topic: d.intent }); } catch (e) {}
    return lead;
  }
  function go(bot, url, line) { bot.say(line || 'Opening it for you…', { delay: 250 }); try { sessionStorage.setItem('cg-reopen-launch', '1'); } catch (e) {} setTimeout(function () { location.href = O.samples('launch/' + url); }, 900); }

  /* ---------- visit slots ---------- */
  function dayButtons() {
    var a = A(), out = [], d0 = a.dayStart(Date.now());
    for (var i = 0; i < 7 && out.length < 5; i++) {
      var d = d0 + i * DAY, free = 0; a.SLOTS.forEach(function (s) { var k = a.slotKey(d, s); if (a.slotTime(k) > Date.now() + 36e5) free += Math.max(0, a.SLOT_CAP - a.slotUsed(k)); });
      if (free) out.push(B((i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : a.fmtDay(d, { weekday: 'short', day: 'numeric', month: 'short' })) + ' · ' + free + ' free', 'slot:day=' + d));
    }
    return out;
  }
  function slotButtons(day, mode) {
    var a = A();
    return a.SLOTS.map(function (s) { var k = a.slotKey(day, s), left = mode === 'video' ? 2 : a.SLOT_CAP - a.slotUsed(k); return { k: k, left: left, past: a.slotTime(k) < Date.now() + 36e5 }; })
      .filter(function (x) { return !x.past && x.left > 0; }).map(function (x) { return B(a.fmtTime(a.slotTime(x.k)) + (x.left === 1 ? ' · last place' : ''), 'slot:slot=' + x.k); });
  }

  var MENU = [B('Find me a home', 'flow:find'), B('Book a site visit', 'flow:visit'), B('EMI and payment plans', 'intent:pay'), B('I live abroad', 'intent:nri'), B('My visit', 'flow:lookup')];

  O.registerAgent({
    id: 'launch', name: 'Aaranya concierge', business: 'Aaranya Residences', role: 'Homes, visits and payment plans', industry: 'Real estate', initials: 'A', accent: '#E8B65A', phoneLabel: 'Aaranya sales lounge',
    blurb: 'Aaranya’s own sales lounge in chat: finds a home by budget, size, facing and floor from the live inventory, books a site visit into a real slot, works out the EMI and hands NRI buyers to the NRI desk.',
    helloLine: 'I can find you a home, book a site visit, work out an EMI or connect you to the NRI desk.',
    samples: ['3 bhk under 3.5 cr east facing', 'kitne ka hai 4 bhk', 'kal subah site visit', 'EMI on 3 crore for 20 years'],
    kind: 'customer', menu: MENU,
    contexts: [{ label: 'Home page', context: { page: 'index' } }, { label: 'Unit picker, A-4002', context: { page: 'picker', unit: 'A-4002' } }, { label: 'NRI desk', context: { page: 'nri' } }],
    synonyms: {
      'how much': ['kitne ka hai', 'kitne ki hai', 'kitna hai', 'kitne ka', 'kitna lagega', 'price kya hai', 'rate kya hai', 'cost kya hai', 'daam'],
      'tomorrow': ['kal'], 'morning': ['subah'], 'evening': ['shaam', 'sham'], 'afternoon': ['dopahar'],
      'show me': ['dikhao', 'dikha do', 'batao', 'bata do'], 'home': ['ghar', 'makaan', 'flat', 'apartment'],
      'site visit': ['dekhne aana hai', 'dekhna hai', 'visit karna hai', 'aana hai', 'site dekhni hai', 'come and see', 'see the site', 'show apartment', 'sample flat'],
      'talk to a person': ['baat karni hai', 'call me', 'call karo', 'real person', 'human', 'agent', 'sales person', 'relationship manager'],
      'my visit': ['meri visit', 'my booking', 'booking status', 'did my visit', 'my appointment'],
      'cheap': ['sasta', 'kam budget', 'affordable', 'lowest'],
      'abroad': ['nri', 'outside india', 'dubai', 'singapore', 'london', 'usa', 'canada', 'uk', 'videsh', 'overseas']
    },
    seeds: {},
    nudge: function (c) {
      var a = A(); if (!a) return null;
      if (c.page === 'picker') return { text: 'Want me to shortlist three homes for your budget? Tell me the size and the facing.', cta: 'Shortlist for me', button: B('Find me a home', 'flow:find') };
      if (c.page === 'payment') return { text: 'I can work out the EMI on any home in a couple of taps, at today’s rate.', cta: 'Work out my EMI', button: B('EMI', 'flow:emi') };
      if (c.page === 'nri') return { text: 'Living abroad? I can set up a video walkthrough at an hour that suits you.', cta: 'Set it up', button: B('I live abroad', 'intent:nri') };
      var n = a.counts().avail; return { text: n + ' homes are open today. Tell me your budget and I’ll pull out the three best.', cta: 'Show me', button: B('Find me a home', 'flow:find') };
    },
    greeting: function (bot) {
      var c = bot.ctx || {}, a = A(), hi = 'Good ' + daypart() + '.';
      if (c.from === 'web') { bot.say('Hello' + (c.name ? ' ' + first(c.name) : '') + ', the Aaranya sales lounge, now on WhatsApp. Same answers, and your visit reminder will land right here.', { buttons: MENU.slice(0, 4) }); return; }
      if (!a) { bot.say(hi + ' I’m Aaranya’s concierge. Ask me about homes, site visits or payment plans.', { buttons: MENU }); return; }
      var q = new URLSearchParams(location.search), uid = c.unit || q.get('unit');
      if (c.page === 'picker' && uid && a.unit(uid)) {
        var u = a.unit(uid), st = a.status(uid);
        bot.say(hi + ' Looking at **' + uid + '**? It’s a ' + a.TYPES[u.type].short + ' on the ' + a.ord(u.floor) + ' floor of ' + a.tower(u.tower).name + ', facing ' + u.facing.toLowerCase() + ', and it’s **' + a.STATUS[st].label.toLowerCase() + '**' + (st !== 'sold' ? ' at ' + a.inr(a.price(u).total) + ' all-inclusive.' : '.'),
          { buttons: [B('Visit this home', 'act:visit:' + uid), B('EMI for it', 'act:emi:' + uid), B('Similar homes', 'act:similar:' + uid), B('Something else', 'menu')] });
        return;
      }
      if (c.page === 'payment') { bot.say(hi + ' Most buyers here pay **construction-linked**: 10% to book, the rest as slabs are cast. Tell me a home or a budget and I’ll work out the EMI.', { buttons: [B('Work out an EMI', 'flow:emi'), B('Explain the three plans', 'intent:pay'), B('Find me a home', 'flow:find')] }); return; }
      if (c.page === 'nri') { bot.say(hi + ' Buying from abroad? Farah runs our NRI desk: video walkthroughs at your hour, NRE payments, and the power of attorney for registration.', { buttons: [B('Set up a video walkthrough', 'intent:nri'), B('Prices in my currency', 'say:prices in dollars'), B('Find me a home', 'flow:find')] }); return; }
      if (c.page === 'visit') { bot.say(hi + ' I can book your visit right here, with a pickup from the metro if you like.', { buttons: [B('Book a site visit', 'flow:visit'), B('Where is it?', 'say:where is aaranya'), B('Something else', 'menu')] }); return; }
      var n = a.counts();
      bot.say(hi + ' I’m Aaranya’s concierge. **' + n.avail + ' homes** are open today across Towers A, B and C. Tell me what you’re looking for in your own words, like “3 BHK under 3.5 crore, east facing”.', { buttons: MENU });
    },
    extract: function (text) {
      text = String(text).replace(/\bkal\b/gi, 'tomorrow').replace(/\bparson\b/gi, 'day after tomorrow').replace(/\bsubah\b/gi, 'morning').replace(/\bshaam\b/gi, 'evening');
      var e = {}, ty = typeFrom(text), bu = budgetFrom(text), fa = faceFrom(text), ba = bandFrom(text), ph = N.phone(text), un = unitFrom(text), w = N.when(text);
      if (ty) e.type = ty; if (bu) e.budget = bu; if (fa) e.face = fa; if (ba) e.band = ba; if (ph) e.phone = ph; if (un) e.unit = un;
      if (w && w.date) e.day = A() ? A().dayStart(w.date.getTime()) : undefined; if (w && w.part) e.part = w.part;
      if (/video|virtual|online|zoom|whatsapp video/i.test(text)) e.mode = 'video'; else if (/pick ?up|metro|cab/i.test(text)) e.mode = 'pickup';
      var nm = N.name(text); if (nm && /\b(i am|i'm|im|my name|this is|naam)\b/i.test(text)) e.name = nm;
      return e;
    },
    intents: [
      { id: 'find', label: 'Find a home', kw: ['find me a home', 'find a home', 'show me', 'available', 'flat', 'home', 'unit', 'options', 'apartments', 'what do you have', 'cheap'], re: [/\b\d\s*bhk\b(?!.*\b(how much|price|rate|cost|emi|visit)\b)/i, /\b(two|three|four)\s*bed/i], priority: 1,
        run: function (bot, m) { if (m.ent.unit) { bot.agent.actions.unit(bot, m.ent.unit); return; } bot.startFlow('find', { type: m.ent.type, budget: m.ent.budget, face: m.ent.face, band: m.ent.band }); } },
      { id: 'price', label: 'Prices', kw: ['how much', 'price', 'prices', 'rate', 'cost', 'starting price', 'price list'], priority: 2,
        run: function (bot, m) {
          var a = A(); if (!a) return; if (m.ent.unit) { bot.agent.actions.unit(bot, m.ent.unit); return; }
          if (m.ent.type) { var mp = a.minPrice(m.ent.type); bot.say('A **' + a.TYPES[m.ent.type].short + '** starts at **' + (mp ? a.inr(mp) : 'sold out') + '** all-inclusive today, with ' + a.counts(function (u) { return u.type === m.ent.type; }).avail + ' open. Prices rise about ₹55 per sq ft a floor above the 4th, and garden-facing homes carry a premium.', { buttons: [B('Show me the open ones', 'act:findtype:' + m.ent.type), B('EMI on that', 'act:emitype:' + m.ent.type), B('Book a visit', 'flow:visit')] }); return; }
          bot.say('All-inclusive prices today (parking, club and GST included):\n' + ['A', 'B', 'C', 'D'].map(function (k) { var mp = a.minPrice(k); return '• **' + a.TYPES[k].short + '** from ' + (mp ? a.inr(mp) : 'sold out'); }).join('\n'), { buttons: [B('Find one in my budget', 'flow:find'), B('How the price adds up', 'say:what is included in the price'), B('Payment plans', 'intent:pay')] });
        } },
      { id: 'visit', label: 'Site visit', kw: ['site visit', 'book a visit', 'visit', 'come and see', 'appointment', 'meet', 'see the flat', 'walkthrough'], priority: 2,
        run: function (bot, m) { bot.startFlow('visit', { day: m.ent.day, mode: m.ent.mode, unit: m.ent.unit, name: m.ent.name, phone: m.ent.phone }); } },
      { id: 'emi', label: 'EMI', kw: ['emi', 'home loan', 'loan', 'monthly payment', 'installment', 'instalment', 'kist'], priority: 2,
        run: function (bot, m) { var P = crFrom(m.text); if (m.ent.unit) { bot.agent.actions.emi(bot, m.ent.unit); return; } bot.startFlow('emi', { price: P, years: (String(m.text).match(/(\d{1,2})\s*(years?|yrs?|saal)/i) || [])[1] }); } },
      { id: 'pay', label: 'Payment plans', kw: ['payment plan', 'payment plans', 'construction linked', 'clp', 'down payment', 'booking amount', 'how do i pay', 'subvention', '30 40 30'], priority: 1,
        run: function (bot) {
          bot.say('Three ways to pay, all on the same price list:\n• **Construction-linked:** 10% to book, 10% in 45 days, the rest as slabs are cast. Most people choose this.\n• **30 : 40 : 30:** 30% in 60 days, 40% at the top slab, 30% on possession.\n• **Down payment:** 95% in 45 days and **6% off the basic price**.\nGST is 5% on each instalment; stamp duty is 7% (5% for women, 6% joint).',
            { buttons: [B('Work out an EMI', 'flow:emi'), B('See the full schedule', 'act:go:payment.html'), B('Book a visit to discuss', 'flow:visit')] });
        } },
      { id: 'nri', label: 'NRI', kw: ['abroad', 'nri', 'nre', 'nro', 'repatriation', 'power of attorney', 'poa', 'oci', 'foreign'], priority: 2,
        run: function (bot) { bot.say('Farah Siddiqui runs our NRI desk. She’ll do a **40-minute video walkthrough** of the show apartment at an hour that suits you, then help with NRE payments and a power of attorney for registration. Want me to set it up?', { buttons: [B('Yes, set it up', 'flow:nri'), B('Prices in my currency', 'say:prices in dollars'), B('What paperwork do I need?', 'say:nri documents')] }); } },
      { id: 'mine', label: 'My visit', kw: ['my visit', 'my booking', 'reschedule', 'cancel my visit', 'when is my visit'], priority: 2, run: function (bot, m) { bot.startFlow('lookup', { phone: m.ent.phone }); } },
      { id: 'where', label: 'Where', kw: ['where is', 'location', 'address', 'directions', 'how to reach', 'kahan hai', 'distance', 'airport', 'metro'], priority: 0,
        run: function (bot) { bot.say('Aaranya is in **Sector 109, on the Dwarka Expressway**, Gurugram: 7 minutes to the Expressway, 24 to IGI Terminal 3 and 32 to Cyber City off-peak. The sales lounge is open daily 10:00–19:00, and we pick visitors up from Dwarka Sector 21 metro.', { buttons: [B('Open the travel-time map', 'act:go:location.html'), B('Book a visit with pickup', 'say:site visit with metro pickup')] }); } },
      { id: 'thanks', label: 'Thanks', kw: ['thanks', 'thank you', 'shukriya', 'dhanyavaad', 'great', 'perfect', 'that is all', 'bye'], priority: 0, run: function (bot) { bot.say('My pleasure. I’m here if anything else comes up, and the sales lounge is open till 7 pm.', { buttons: [B('Find me a home', 'flow:find'), B('Book a site visit', 'flow:visit')] }); } }
    ],
    flows: {
      find: { intent: 'find', slots: [
        { name: 'type', ask: function (bot) { bot.say('How many bedrooms?', { buttons: [B('2 BHK', 'slot:type=A'), B('3 BHK', 'slot:type=B'), B('3 BHK + study', 'slot:type=C'), B('4 BHK', 'slot:type=D'), B('Show me all', 'slot:type=any')] }); }, parse: function (t) { return typeFrom(t) || (/any|all|koi bhi|doesn.?t matter/i.test(t) ? 'any' : undefined); } },
        { name: 'budget', ask: function (bot) { bot.say('And the budget, all-inclusive?', { buttons: Object.keys(BUDGETS).map(function (k) { return B(BUDGETS[k][2], 'slot:budget=' + k); }) }); }, parse: function (t) { return budgetFrom(t) || (/any|no limit|flexible/i.test(t) ? 'any' : undefined); } },
        { name: 'face', ask: function (bot) { bot.say('Any preference on facing? Podium-garden homes look down onto the landscaped decks; the others look out to the skyline.', { buttons: Object.keys(FACE).map(function (k) { return B(FACE[k], 'slot:face=' + k); }) }); }, parse: function (t) { return faceFrom(t) || (/any|doesn.?t matter|no/i.test(t) ? 'any' : undefined); } },
        { name: 'band', ask: function (bot) { bot.say('Which floors suit you? Higher floors see further over the skyline; lower ones are quicker for parents.', { buttons: Object.keys(BANDS).map(function (k) { return B(BANDS[k][2], 'slot:band=' + k); }) }); }, parse: function (t) { return bandFrom(t) || (/any|doesn.?t matter/i.test(t) ? 'any' : undefined); } }
      ], done: function (bot, s) {
        var r = search(s), loosened = '';
        if (!r.list.length && s.band && s.band !== 'any') { r = search(Object.assign({}, s, { band: 'any' })); loosened = 'Nothing on those floors, so I opened up every floor. '; }
        if (!r.list.length && s.face && s.face !== 'any') { r = search(Object.assign({}, s, { band: 'any', face: 'any' })); loosened = 'Nothing with that facing right now, so I widened it. '; }
        bot.mem.lastFind = s;
        if (!r.list.length) { bot.say('Every home like that is sold or on hold today. I can tell you the moment one is released, or show the closest size up or down.', { buttons: [B('Tell me when one opens', 'flow:visit'), B('Try another budget', 'flow:find'), B('Talk to the sales lounge', 'handover')] }); return; }
        bot.say(loosened + '**' + r.total + '** open home' + (r.total === 1 ? '' : 's') + ' match. Here are the best-value ones, spread across towers and floors:', { cards: r.list.map(function (u) { return unitCard(u); }),
          buttons: [B('Book a visit to see them', 'flow:visit'), B('Open all in the picker', 'act:picker:' + [s.type, s.budget, s.face, s.band].join('|')), B('Change something', 'flow:find')] });
      } },
      visit: { intent: 'visit', slots: [
        { name: 'mode', ask: function (bot) { bot.say('How would you like to see it?', { buttons: [B('At the sales lounge', 'slot:mode=lounge'), B('Pick me up from the metro', 'slot:mode=pickup'), B('Video walkthrough', 'slot:mode=video')] }); }, parse: function (t) { if (/video|online|virtual|zoom/i.test(t)) return 'video'; if (/pick|metro|cab/i.test(t)) return 'pickup'; if (/lounge|site|visit|come|person|myself|drive/i.test(t)) return 'lounge'; } },
        { name: 'day', ask: function (bot) { var d = dayButtons(); if (!d.length) { bot.say('The lounge is fully booked this week. Let me connect you to a relationship manager.', { buttons: [B('Talk to the sales lounge', 'handover')] }); return; } bot.say('Which day? Free places are live:', { buttons: d }); },
          parse: function (t) { var w = N.when(t); if (w && w.date) return A().dayStart(w.date.getTime()); if (/^\d{12,}$/.test(String(t).trim())) return +t; }, coerce: function (v) { return +v; } },
        { name: 'slot', ask: function (bot, s) { var b = slotButtons(s.day, s.mode); if (!b.length) { bot.say('That day is full. Pick another?', { buttons: dayButtons() }); bot.slots.day = undefined; return; } bot.say('What time on **' + A().fmtDay(s.day, { weekday: 'long', day: 'numeric', month: 'short' }) + '**?' + (s.mode === 'video' ? ' (India time)' : ''), { buttons: b }); },
          parse: function (t, bot, s) { if (/^\d{4}-\d\d-\d\d \d\d:\d\d$/.test(String(t).trim())) return String(t).trim(); var w = N.when(t), a = A(), tm = w && w.time; if (!tm && w && w.part) tm = w.part === 'morning' ? '11:30' : w.part === 'afternoon' ? '15:00' : '18:00'; if (!tm) return; var best = a.SLOTS.slice().sort(function (x, y) { return Math.abs(+x.replace(':', '') - +tm.replace(':', '')) - Math.abs(+y.replace(':', '') - +tm.replace(':', '')); })[0]; return a.slotKey(s.day, best); },
          validate: function (v, bot, s) { var a = A(); if (a.slotTime(v) < Date.now() + 36e5) return 'That time has passed or is too soon. Pick a later one.'; if (s.mode !== 'video' && a.slotUsed(v) >= a.SLOT_CAP) return 'That slot just filled. Pick another.'; } },
        { name: 'unit', optional: true, when: function (bot, s) { return !s.unit && !bot.mem.askedUnit; }, ask: function (bot) { bot.mem.askedUnit = 1; var sh = []; try { sh = JSON.parse(localStorage.getItem('aaranya:short') || '[]'); } catch (e) {} bot.say('Any home you’d like open on the big screen? Type a unit (like A-4002) or skip.', { buttons: sh.slice(0, 3).map(function (id) { return B(id, 'slot:unit=' + id); }).concat([B('Skip', 'slot:unit=none')]) }); }, parse: function (t) { return unitFrom(t) || (/skip|no|none|not yet|later/i.test(t) ? 'none' : undefined); } },
        { name: 'name', ask: function (bot) { bot.say('Who should we expect? Your full name.'); }, parse: function (t) { var n = N.name(t) || String(t).trim(); return n.length >= 2 && !/\d/.test(n) ? n.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }).slice(0, 40) : undefined; }, hint: 'Just your name, like “Aditi Khurana”.' },
        { name: 'phone', ask: function (bot, s) { bot.say('And a WhatsApp number for ' + first(s.name) + '? The confirmation and one reminder go there, nothing else.'); }, parse: function (t) { return N.phone(t); }, validate: function (v) { var d = String(v).replace(/\D/g, ''); if (d.length < 10) return 'That number looks short. Include the country code if you’re abroad.'; } }
      ], done: function (bot, s) {
        var a = A(); if (!a) return; var unit = s.unit && s.unit !== 'none' ? s.unit : null;
        if (s.mode !== 'video' && a.slotUsed(s.slot) >= a.SLOT_CAP) { bot.say('That slot filled while we were talking. Pick another time?', { buttons: slotButtons(s.day, s.mode) }); bot.slots.slot = undefined; bot.startFlow('visit', s); return; }
        bot.user.name = s.name; bot.user.phone = s.phone;
        var lead = toOffice(bot, { name: s.name, phone: s.phone, unit: unit, intent: 'book_visit', note: 'booked a ' + ({ lounge: 'lounge visit', pickup: 'visit with metro pickup', video: 'video walkthrough' })[s.mode] + ' for ' + a.slotLabel(s.slot) + (unit ? ', wants to see ' + unit : '') });
        var v = a.addVisit({ lead: lead && lead.id, name: s.name, unit: unit, slot: s.slot, mode: s.mode, party: 2, source: 'Chat', convo: bot.id });
        if (lead) { var ls = a.leads(); ls.forEach(function (l) { if (l.id === lead.id) { l.stage = 'visit'; l.next = a.slotTime(s.slot); l.log.push({ t: Date.now(), k: 'visit', s: 'Visit ' + v.id + ' booked in chat' }); } }); a.saveLeads(ls); }
        bot.event('booking', { kind: 'site_visit' });
        var rm = a.member(v.rm);
        bot.say('Booked, ' + first(s.name) + '. ' + rm.name + ' will look after you.', { cards: [{ title: ({ lounge: 'Site visit · sales lounge', pickup: 'Site visit · metro pickup', video: 'Video walkthrough' })[s.mode], sub: a.slotLabel(s.slot) + (s.mode === 'video' ? ' IST' : ''), img: img('a-lobby'), badge: 'Confirmed',
          meta: ['Booking ' + v.id, s.mode === 'pickup' ? 'Dwarka Sector 21 metro, gate 2' : s.mode === 'video' ? 'Link on WhatsApp an hour before' : 'Sector 109, Dwarka Expressway', unit ? unit + ' ready on the big screen' : 'About 75 minutes, tea on us'],
          buttons: [B('Find homes to see', 'flow:find'), B('Directions', 'say:where is aaranya')] }], buttons: [B('That’s all, thanks', 'say:thanks')] });
      } },
      emi: { intent: 'emi', slots: [
        { name: 'price', ask: function (bot) { bot.say('What’s the price of the home? A number like “3.2 crore”, or pick a size.', { buttons: ['A', 'B', 'C', 'D'].map(function (k) { var mp = A().minPrice(k); return B(BHK[k] + (mp ? ' · ' + A().inr(mp) : ''), 'slot:price=' + (mp || 0)); }) }); }, parse: function (t) { var v = crFrom(t); if (v) return v; if (/^\d{6,}$/.test(String(t).trim())) return +t; }, coerce: function (v) { return +v; }, validate: function (v) { if (v < 5e6 || v > 2e8) return 'Homes here are between about ₹2 Cr and ₹7 Cr. Try a number in crore, like “3.5 crore”.'; } },
        { name: 'years', ask: function (bot) { bot.say('Over how many years?', { buttons: [B('15 years', 'slot:years=15'), B('20 years', 'slot:years=20'), B('25 years', 'slot:years=25'), B('30 years', 'slot:years=30')] }); }, parse: function (t) { var m = String(t).match(/\b(\d{1,2})\b/); return m && +m[1] >= 5 && +m[1] <= 30 ? +m[1] : undefined; }, coerce: function (v) { return +v; } }
      ], done: function (bot, s) {
        var a = A(), loan = Math.round(s.price * 0.8 / 1e5) * 1e5, e = emi(loan, 8.4, s.years), tot = e * s.years * 12;
        bot.say('On ' + a.inr(s.price) + ', a bank typically lends 80%: **' + a.inr(loan) + '**. At 8.4% over ' + s.years + ' years that’s about **' + a.inrFull(e) + ' a month**. You’d pay ' + a.inr(tot - loan) + ' in interest over the term; the 20% you pay yourself is ' + a.inr(s.price - loan) + ', spread across the construction-linked plan.',
          { buttons: [B('Try ' + (s.years === 20 ? 25 : 20) + ' years', 'act:emiy:' + s.price + '|' + (s.years === 20 ? 25 : 20)), B('Full calculator', 'act:go:payment.html'), B('Find homes in this budget', 'act:findbudget:' + s.price)] });
      } },
      nri: { intent: 'nri', slots: [
        { name: 'city', ask: function (bot) { bot.say('Where do you live? I’ll suggest times that work for both of us.', { buttons: [B('Dubai', 'slot:city=Dubai'), B('Singapore', 'slot:city=Singapore'), B('London', 'slot:city=London'), B('USA / Canada', 'slot:city=North America')] }); }, parse: function (t) { var x = String(t).trim(); return x.length >= 2 ? x.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }).slice(0, 40) : undefined; } },
        { name: 'name', ask: function (bot) { bot.say('Your full name, for Farah?'); }, parse: function (t) { var n = N.name(t) || String(t).trim(); return n.length >= 2 && !/\d/.test(n) ? n.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }).slice(0, 40) : undefined; } },
        { name: 'phone', ask: function (bot) { bot.say('A WhatsApp number with the country code?'); }, parse: function (t) { return N.phone(t); } }
      ], done: function (bot, s) {
        var a = A(); bot.user.name = s.name; bot.user.phone = s.phone;
        toOffice(bot, { name: s.name, phone: s.phone, city: s.city, nri: true, intent: 'nri_walkthrough', note: 'NRI in ' + s.city + ', wants a video walkthrough' });
        bot.say('Done. Farah will message you today with three walkthrough times that suit ' + s.city + ', plus our NRI payment note and a draft power of attorney. Want me to bring her into this chat now?', { buttons: [B('Yes, connect me to Farah', 'handover'), B('No, WhatsApp is fine', 'say:thanks')] });
      } },
      lookup: { slots: [
        { name: 'phone', ask: function (bot) { bot.say('What number did you book with?'); }, parse: function (t) { return N.phone(t) || (String(t).replace(/\D/g, '').length >= 4 ? String(t).replace(/\D/g, '') : undefined); } }
      ], done: function (bot, s) {
        var a = A(), tail = String(s.phone).replace(/\D/g, '').slice(-4);
        var leads = a.leads().filter(function (l) { return String(l.phone).replace(/\D/g, '').slice(-4) === tail; }).map(function (l) { return l.id; });
        var vs = a.visits().filter(function (v) { return leads.indexOf(v.lead) >= 0 && a.slotTime(v.slot) > Date.now() - DAY; }).sort(function (x, y) { return a.slotTime(x.slot) - a.slotTime(y.slot); });
        if (!vs.length) { bot.say('I can’t find an upcoming visit on that number. Want to book one?', { buttons: [B('Book a site visit', 'flow:visit'), B('Talk to the sales lounge', 'handover')] }); return; }
        var v = vs[0]; bot.say('Found it: **' + a.slotLabel(v.slot) + '**, ' + ({ lounge: 'at the sales lounge', pickup: 'with a metro pickup', video: 'on video' })[v.mode] + ', with ' + a.member(v.rm).name + (v.unit ? '. ' + v.unit + ' will be ready to see.' : '.'), { buttons: [B('Change the time', 'flow:visit'), B('Talk to ' + first(a.member(v.rm).name), 'handover')] });
      } }
    },
    actions: {
      go: function (bot, url) { go(bot, url); },
      unit: function (bot, id) { var a = A(), u = a.unit(id); if (!u) { bot.say('I can’t find ' + id + '. Units look like A-4002: tower, floor, home.'); return; } bot.say(id + ' is **' + a.STATUS[a.status(id)].label.toLowerCase() + '**.', { cards: [unitCard(u)] }); },
      visit: function (bot, id) { bot.startFlow('visit', { unit: id }); },
      emi: function (bot, id) { var a = A(); bot.startFlow('emi', { price: a.price(id).total }); },
      emitype: function (bot, k) { var mp = A().minPrice(k); bot.startFlow('emi', { price: mp }); },
      emiy: function (bot, arg) { var p = arg.split('|'); bot.startFlow('emi', { price: +p[0], years: +p[1] }); },
      findtype: function (bot, k) { bot.startFlow('find', { type: k, budget: 'any', face: 'any', band: 'any' }); },
      findbudget: function (bot, p) { p = +p; var k = p <= 2.5e7 ? 'u25' : p <= 3.5e7 ? 'm35' : p <= 5e7 ? 'm50' : 'o50'; bot.startFlow('find', { budget: k, face: 'any', band: 'any' }); },
      similar: function (bot, id) { var u = A().unit(id); bot.startFlow('find', { type: u.type, budget: 'any', face: u.garden ? 'garden' : 'any', band: 'any' }); },
      picker: function (bot, arg) { var p = arg.split('|'), q = []; if (p[0] && p[0] !== 'any' && p[0] !== 'undefined') q.push('type=' + p[0]); if (/^max:/.test(p[1] || '')) q.push('budget=0-' + p[1].slice(4)); else if (p[1] && BUDGETS[p[1]] && p[1] !== 'any') q.push('budget=' + BUDGETS[p[1]][0] + '-' + BUDGETS[p[1]][1]); if (p[2] && p[2] !== 'any' && p[2] !== 'undefined') q.push('facing=' + p[2]); if (p[3] && BANDS[p[3]] && p[3] !== 'any') q.push('band=' + BANDS[p[3]][0] + '-' + BANDS[p[3]][1]); go(bot, 'picker.html?' + q.join('&'), 'Opening the picker with your filters…'); }
    },
    kb: [
      { id: 'possession', q: 'When is possession?', a: 'The RERA possession date is **31 December 2029**; our target is June 2029. Tower A is at slab 27 of 46, Tower B at 23 of 44 and Tower C at 21 of 42.', keys: ['possession', 'ready', 'handover date', 'when will it be ready', 'completion', 'kab milega'], buttons: [B('Construction photos', 'act:go:progress.html')] },
      { id: 'rera', q: 'Is it RERA registered?', a: 'The RERA registration is shown at launch, before any booking opens, and you can check it on haryanarera.gov.in. 70% of what you pay goes into a project escrow account used only for this project.', keys: ['rera', 'registered', 'registration', 'approved', 'legal'], buttons: [B('Legal and RERA page', 'act:go:legal.html')] },
      { id: 'carpet', q: 'Carpet or super area?', a: 'Every area we quote is **RERA carpet**: wall to wall inside the home. A 3 BHK is 1,468 sq ft carpet plus 212 sq ft of balconies. We don’t price on super area.', keys: ['carpet', 'super area', 'built up', 'sq ft', 'size', 'area'] },
      { id: 'included', q: 'What is included in the price?', a: 'The all-inclusive price covers the basic price, floor rise, location premium, covered parking, the club membership, maintenance security and GST at 5%. Only stamp duty and registration are paid separately, to the state.', keys: ['included', 'all inclusive', 'hidden charges', 'extra charges', 'gst', 'plc'] },
      { id: 'parking', q: 'How much parking?', a: 'One covered bay with a 2 BHK, two with a 3 BHK, three with a 4 BHK, all in the basement, each with an EV charging point. 40 guest bays are at grade.', keys: ['parking', 'car park', 'ev charging', 'garage'] },
      { id: 'maintenance', q: 'What is the maintenance?', a: 'Estimated at **₹6.5 per sq ft of carpet a month** after possession, with the first year’s maintenance security (₹150 per sq ft) included in the price.', keys: ['maintenance', 'monthly charges', 'association', 'society charges'] },
      { id: 'club', q: 'What is in the club?', a: 'The **Sky Club** on the roof of Tower A has an infinity-edge pool, a lounge and private dining. The **Podium Club** has a heated 25 m pool, a gym, squash and badminton, a library lounge, work pods, a banquet hall and four guest suites. Membership is included.', keys: ['club', 'clubhouse', 'amenities', 'pool', 'gym', 'swimming'], buttons: [B('See the amenities', 'act:go:amenities.html')] },
      { id: 'pets', q: 'Are pets allowed?', a: 'Yes. There’s a fenced pet park on the podium and a service lift in every tower you can use with a pet.', keys: ['pet', 'pets', 'dog', 'cat'] },
      { id: 'metro', q: 'Is there a metro?', a: 'A Sector 109 station is **proposed** on the Dwarka Expressway line, about 900 m away, but not yet sanctioned. Today the nearest is Dwarka Sector 21, 14 minutes off-peak.', keys: ['metro', 'station', 'public transport'] },
      { id: 'schools', q: 'Schools nearby?', a: 'Two CBSE schools and one IB school within 3 km, and a pre-school inside the Podium Club.', keys: ['school', 'schools', 'education', 'kids school'] },
      { id: 'hospital', q: 'Hospital nearby?', a: 'A 450-bed multi-speciality hospital with a 24-hour emergency is 8 minutes away in Sector 110.', keys: ['hospital', 'medical', 'emergency', 'doctor'] },
      { id: 'power', q: 'Power and water?', a: '100% power back-up for homes and common areas, piped gas, a sewage treatment plant and rainwater harvesting.', keys: ['power backup', 'electricity', 'water', 'gas', 'backup'] },
      { id: 'loan', q: 'Which banks give loans?', a: 'Most major banks and housing-finance companies have approved the project, so loans of up to 80% are routine. Your relationship manager will share the list on the visit.', keys: ['bank', 'banks', 'approved', 'loan approval', 'hdfc', 'sbi'] },
      { id: 'stamp', q: 'Stamp duty?', a: 'In Haryana it’s **7%** if registered to a man, **5%** to a woman and **6%** jointly, plus a registration fee of up to ₹50,000.', keys: ['stamp duty', 'registration charges', 'registry'] },
      { id: 'cancel', q: 'Can I cancel a booking?', a: 'Before the agreement for sale, a booking can be cancelled with the booking amount refunded minus processing. After it, the terms in the agreement and RERA apply.', keys: ['cancel booking', 'refund', 'cancellation', 'exit'] },
      { id: 'vastu', q: 'Vastu and facing?', a: 'Many homes have east or north entrances, and every living room faces between south-east and south-west for winter sun. Tell me “east facing” and I’ll show you the open ones.', keys: ['vastu', 'vaastu', 'entrance direction', 'main door'] },
      { id: 'hours', q: 'Sales lounge hours?', a: 'Open every day, **10:00 to 19:00**, with the show apartment, the 3D model and a hard-hat walk on a tower floor.', keys: ['timing', 'timings', 'open', 'hours', 'sunday', 'office'] },
      { id: 'docs', q: 'NRI documents?', a: 'PAN card, passport with visa or OCI, an overseas address proof, an NRE or NRO account, and a power of attorney if you won’t be here to register. The NRI page has a checklist you can tick.', keys: ['nri documents', 'documents', 'paperwork', 'kyc'], buttons: [B('Open the NRI checklist', 'act:go:nri.html')] },
      { id: 'fx', q: 'Prices in my currency?', a: 'At this week’s reference rates, a 2 BHK starts around **USD 2.4 L (240,000)** or **AED 8.9 L**, and a 3 BHK around **USD 3.5 L**. The NRI page converts every price for your country.', keys: ['dollars', 'usd', 'aed', 'dirham', 'pounds', 'currency', 'my currency'], buttons: [B('Open the NRI desk', 'act:go:nri.html')] }
    ],
    freeText: function (bot, m) {
      var e = m.ent || {};
      if (e.unit) { bot.agent.actions.unit(bot, e.unit); return true; }
      if (e.type || e.budget || e.face) { bot.startFlow('find', { type: e.type, budget: e.budget, face: e.face, band: e.band }); return true; }
      if (e.day || e.mode) { bot.startFlow('visit', { day: e.day, mode: e.mode }); return true; }
      return false;
    }
  });
})();
