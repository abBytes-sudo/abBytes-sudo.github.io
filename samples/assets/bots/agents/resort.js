/* Agent: Taradhura (a boutique ridge resort in Kumaon). The lantern concierge: checks dates and prices the four cottages from the
   resort's own rate engine (window.TD), books experience places on the live roster, finds a booking and makes small changes,
   helps people get here, and hands wedding and offsite enquiries to the events lead. Everything it completes lands in the
   front desk (resort/staff.html): leads, roster places, enquiries and booking changes. Rule-based, no network calls. */
(function () {
  'use strict';
  var O = window.Orbit, N = O.nlp, B = function (l, v) { return { label: l, value: v }; };
  var TD = function () { return window.TD; };
  var R = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  var PH = function (n) { return O.samples('resort/photos/' + n + '-s.jpg'); };
  var HI = [[/\b(kitne|kitna|kitni) (ka|ki|ke|mein|me)( hoga| padega| hai| hain)?\b|\bkharcha kitna\b|\brate kya (hai|h)\b|\bkya rate\b/g, 'how much'], [/\bkal subah\b/g, 'tomorrow morning'], [/\bkal shaam\b/g, 'tomorrow evening'], [/\bparso\b/g, 'day after tomorrow'], [/\bkal\b/g, 'tomorrow'], [/\baaj\b/g, 'today'], [/\b(raat|raatein|raaton)\b/g, 'nights'], [/\b(kamra|kamre)\b/g, 'room'], [/\b(bacche|bachche|baccha|bachcha)\b/g, 'children'], [/\b(log|logon)\b/g, 'people'], [/\b(shaadi|vivah|byah)\b/g, 'wedding'], [/\b(mausam)\b/g, 'weather'], [/\b(barf|baraf)\b/g, 'snow'], [/\b(raasta|rasta|sadak)\b/g, 'road'], [/\b(khana|khaana)\b/g, 'food'], [/\b(kutta|kutte|doggy)\b/g, 'dog'], [/\b(haan|haanji|ha ji)\b/g, 'yes'], [/\b(nahi|nahin)\b/g, 'no'], [/\b(chahiye|chaiye)\b/g, 'want'], [/\bkaise (pahunche|aaye|aayein|jaaye)\b|\bkaise pahunchna\b/g, 'how to reach'], [/\bbaat (karni|karna) (hai|h)\b/g, 'talk to a person'], [/\b(khali|khaali)\b/g, 'available']];
  function hi(t) { var s = ' ' + String(t).toLowerCase() + ' '; HI.forEach(function (p) { s = s.replace(p[0], p[1]); }); return s.trim(); }
  function today() { return TD().date.today(); }
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dfmt(s) { return TD().date.fmt(s, { weekday: 'short' }); }
  function nextFri() { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7)); return iso(d); }
  function lead(bot, intent, payload, extra) { payload = payload || {}; payload.convo = bot.id; var l = { intent: intent, payload: payload }; if (extra) for (var k in extra) l[k] = extra[k]; if (!l.name) l.name = bot.user.name || 'Website visitor'; return bot.lead(l); }
  function dateFrom(t) {
    t = hi(t); var w = N.when(t); if (w && w.iso && w.iso >= today()) return w.iso;
    var m = t.match(/\b(\d{1,2})[\/.-](\d{1,2})\b/); if (m) { var y = new Date().getFullYear(), d = new Date(y, +m[2] - 1, +m[1]); if (iso(d) < today()) d.setFullYear(y + 1); return iso(d); }
    if (/\bthis weekend\b|\bweekend\b/.test(t)) return nextFri(); if (/\bnext weekend\b/.test(t)) { var f = new Date(nextFri()); f.setDate(f.getDate() + 7); return iso(f); }
    return undefined;
  }
  function nightsFrom(t, ci) {
    t = hi(t); var m = t.match(/\b(\d{1,2}|one|two|three|four|five|six|seven)\s*(nights?|n\b|days?)/); var W = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 };
    if (m) { var n = W[m[1]] || +m[1]; if (/day/.test(m[2])) n = Math.max(1, n - 1); return n >= 1 && n <= 21 ? n : undefined; }
    if (ci) { var parts = t.split(/\b(?:to|till|until|-|–)\b/); if (parts.length > 1) { var o = dateFrom(parts[parts.length - 1]); if (o && o > ci) return TD().date.diff(ci, o); } }
    if (/\bweekend\b/.test(t)) return 2; return undefined;
  }
  function guestsFrom(t) {
    t = hi(t); var a, k = 0, m;
    if ((m = t.match(/\b(\d{1,2})\s*(adults?|grown ?ups?|people|persons?|pax|guests?|of us)\b/))) a = +m[1];
    if ((m = t.match(/\b(\d)\s*(kids?|children|child|bachche)\b/))) k = +m[1];
    if ((m = t.match(/\bfamily of (\d)\b/))) { a = 2; k = Math.max(0, +m[1] - 2); }
    if (!a && /\b(couple|two of us|me and my (wife|husband|partner)|honeymoon|anniversary)\b/.test(t)) a = 2;
    if (!a && /\b(solo|alone|just me)\b/.test(t)) a = 1;
    return a ? { adults: Math.min(12, a), kids: Math.min(6, k) } : undefined;
  }
  function refFrom(t) { var m = String(t).toUpperCase().match(/\bTD[- ]?([A-Z0-9]{5})\b/); return m ? 'TD-' + m[1] : undefined; }
  function expFrom(t) { t = hi(t); return /bird/.test(t) ? 'birding' : /village|dhura walk|terrace/.test(t) ? 'village' : /trek|hike|cliff/.test(t) ? 'trek' : /cook|kitchen|class|recipe/.test(t) ? 'kitchen' : /star|telescope|sky|milky/.test(t) ? 'stars' : /aipan|paint|art/.test(t) ? 'aipan' : undefined; }
  function runs(e, d) { var w = e.when, dw = TD().date.dow(d), M = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }; if (/^(Daily|Nightly)/.test(w)) return !(/except Mon/.test(w) && dw === 1); return w.split('·').map(function (s) { return M[s.trim()]; }).indexOf(dw) >= 0; }
  function guestsLabel(g) { return g.adults + ' adult' + (g.adults > 1 ? 's' : '') + (g.kids ? ' + ' + g.kids + ' child' + (g.kids > 1 ? 'ren' : '') : ''); }
  function go(bot, url, line) {
    if (bot.channel !== 'web') { bot.say(line + ' Here is the link: taradhura.in/' + url); return; }
    bot.say(line, { delay: 200 }); setTimeout(function () { try { window.Concierge && Concierge.close(); } catch (e) {} location.href = url; }, 1100);
  }
  function cottageCards(bot, s) {
    var T = TD(), co = T.date.add(s.checkin, s.nights), g = s.guests, out = [];
    T.types.forEach(function (t) {
      var need = Math.max(1, Math.ceil(g.adults / t.maxAdults), Math.ceil((g.adults + g.kids) / t.maxGuests)); if (g.kids && !t.maxKids) return;
      var q = T.quote({ type: t.id, checkin: s.checkin, checkout: co, rooms: Math.min(need, t.rooms.length), adults: g.adults, kids: new Array(g.kids).fill(8), plan: 'bb' });
      if (q.errors.length || need > t.rooms.length) return;
      out.push({ t: t, q: q, need: need });
    });
    return out.map(function (o) {
      return { title: (o.need > 1 ? o.need + ' × ' : '') + o.t.name, sub: o.t.line, img: PH(o.t.hero), badge: o.q.free.length <= 2 && o.t.rooms.length > 1 ? o.q.free.length + ' left' : o.t.view.split(',')[0], price: R(o.q.total), priceLabel: 'for ' + s.nights + ' night' + (s.nights > 1 ? 's' : '') + ', breakfast and GST included', meta: [R(Math.round(o.q.lines[0].amt / s.nights / o.q.rooms)) + ' a night on average', 'Sleeps ' + o.t.sleeps, o.q.save ? 'About ' + R(o.q.save) + ' less than on travel portals' : '2 pm check-out when you book direct'], buttons: [B('Book this', 'act:book:' + o.t.id), B('See the cottage', 'act:see:' + o.t.id)] };
    });
  }

  var MENU = [B('Check dates and prices', 'flow:stay'), B('Book an experience', 'flow:exp'), B('Find my booking', 'flow:lookup'), B('How do I get there?', 'intent:reach'), B('A wedding or offsite', 'flow:event')];

  O.registerAgent({
    id: 'resort', name: 'Taradhura', business: 'Taradhura', role: 'Front desk on the ridge', industry: 'Hospitality', initials: 'TD', accent: '#2A2140', phoneLabel: 'Taradhura front desk',
    blurb: 'The resort’s lantern concierge: checks dates and prices from the live rate engine, books experience places, finds a booking and changes it, helps with the road, and hands events to sales.',
    samples: ['26 dec to 29 dec, 2 adults, kitne ka hoga?', 'birding kal subah for 2', 'TD-4M8PK Bisht', 'how do I reach from Delhi by train'],
    kind: 'customer', menu: MENU,
    contexts: [{ label: 'On a cottage page', context: { page: 'cottage', id: 'ridge' } }, { label: 'On experiences', context: { page: 'experiences' } }, { label: 'On weddings', context: { page: 'celebrations' } }],
    synonyms: { 'how much': ['kitne ka padega', 'kitne ka hoga', 'kitna padega', 'kitne ka', 'kitna', 'tariff', 'price', 'rates', 'cost'], 'available': ['availability', 'vacancy', 'free rooms', 'khali'], 'wedding': ['shaadi', 'destination wedding', 'marriage'], 'offsite': ['team outing', 'corporate retreat', 'company trip', 'offsite'] },
    nudge: function (c) {
      if (c.page === 'cottage') { var t = TD() && TD().type(c.id); return { text: 'Shall I check ' + (t ? 'the ' + t.plural : 'these cottages') + ' for your dates? Two taps, with the exact price.', cta: 'Check my dates', button: B('Check dates', 'flow:stay') }; }
      if (c.page === 'experiences') return { text: 'I can see tomorrow’s places on every walk. Want me to hold one?', cta: 'Show tomorrow', button: B('Book an experience', 'flow:exp') };
      if (c.page === 'celebrations') return { text: 'Planning a wedding or an offsite? Tell me the rough size and dates and I’ll put you through to Ritu, who runs our events.', cta: 'Start here', button: B('A wedding or offsite', 'flow:event') };
      if (c.page === 'getting-there') return { text: 'Coming by the overnight train? I can book the car from Kathgodam for your booking.', cta: 'Sort my transfer', button: B('Getting here', 'intent:reach') };
      return { text: 'The range is clearest in the mornings this month. Shall I check a few dates for you?', cta: 'Check dates', button: B('Check dates and prices', 'flow:stay') };
    },
    greeting: function (bot) {
      var c = bot.ctx, T = TD(), h = new Date().getHours(), hello = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
      if (c.from === 'web') { bot.say('Namaste' + (c.name ? ' ' + c.name.split(' ')[0] : '') + ', this is the Taradhura desk on WhatsApp. Same conversation, now on your phone.', { buttons: MENU.slice(0, 4) }); return; }
      if (c.page === 'cottage' && T && T.type(c.id)) { var t = T.type(c.id); bot.say(hello + '. Looking at the **' + t.plural + '**? ' + t.line + ' I can check your dates and give you the exact price, breakfast included.', { buttons: [B('Check dates for ' + t.plural, 'flow:stay'), B('Compare all four', 'act:see:all'), B('Something else', 'menu')] }); bot.mem.prefer = t.id; return; }
      if (c.page === 'book') { bot.say(hello + '. Choosing between cottages? Tell me who is coming and I’ll tell you which fits, and why.', { buttons: [B('Two of us', 'say:2 adults'), B('A family', 'say:family of 4'), B('Four friends', 'say:4 adults'), B('Something else', 'menu')] }); return; }
      if (c.page === 'experiences') { bot.say(hello + '. I can book a place on any of the six walks and sessions; the guides see it straight away.', { buttons: [B('Dawn birding', 'act:exp:birding'), B('Stargazing', 'act:exp:stars'), B('Village walk', 'act:exp:village'), B('All six', 'flow:exp')] }); return; }
      if (c.page === 'celebrations') { bot.say(hello + '. Weddings of up to 90 and offsites of 12 to 30. Tell me roughly what you have in mind and I’ll pass you to Ritu, our events lead, with everything written down.', { buttons: [B('A wedding', 'act:event:Wedding'), B('An offsite', 'act:event:Offsite'), B('A celebration', 'act:event:Celebration')] }); return; }
      if (c.page === 'getting-there') { bot.say(hello + '. Most guests take the overnight train to Kathgodam and are on the deck for breakfast. Where are you coming from?', { buttons: [B('Delhi by train', 'act:route:train'), B('Flying in', 'act:route:fly'), B('Driving', 'act:route:drive')] }); return; }
      if (c.page === 'my-booking') { bot.say(hello + '. Give me your booking reference (it looks like **TD-4M8PK**) and your last name, and I’ll find it.', { buttons: [B('Find my booking', 'flow:lookup'), B('Something else', 'menu')] }); return; }
      bot.say(hello + ' from the ridge. I can check dates and prices, book a walk or the telescope, find your booking, or help you get here.', { buttons: MENU });
    },
    extract: function (text, bot) {
      var e = {}, t = hi(text), ci = dateFrom(t.split(/\b(?:to|till|until)\b/)[0]), g = guestsFrom(t), r = refFrom(text), x = expFrom(t), em = N.email(text), ph = N.phone(text);
      if (ci) e.checkin = ci; var n = nightsFrom(t, ci || bot.slots.checkin); if (n) e.nights = n; if (g) e.guests = g; if (r) e.ref = r; if (x) e.exp = x;
      if (em) e.contact = em; else if (ph) e.contact = ph;
      var hc = t.match(/\b(\d{1,3})\s*(people|persons|guests|pax|log|of us)\b/); if (hc) e.headcount = +hc[1];
      var k = /wedding|mehendi|sangeet/.test(t) ? 'Wedding' : /offsite|team outing|corporate|company/.test(t) ? 'Offsite' : /birthday|anniversary party/.test(t) ? 'Celebration' : /retreat/.test(t) ? 'Retreat' : null; if (k) e.kind = k;
      return e;
    },
    intents: [
      { id: 'stay', label: 'Check dates and prices', kw: ['how much', 'available', 'availability', 'book a room', 'book a cottage', 'stay', 'rooms', 'cottage', 'price', 'dates', 'tariff', 'nights', 'check in'], re: [/\b(\d+)\s*(nights?|adults?)\b/i, /\b(dec|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov)[a-z]*\b.*\b(to|till)\b/i], priority: 1, run: function (bot, m) { bot.startFlow('stay', { checkin: m.ent.checkin, nights: m.ent.nights, guests: m.ent.guests }); } },
      { id: 'exp', label: 'Book an experience', kw: ['birding', 'trek', 'village walk', 'cooking class', 'stargazing', 'telescope', 'aipan', 'experience', 'activities', 'things to do', 'walk', 'hike'], priority: 1, run: function (bot, m) { var g = m.ent.guests ? m.ent.guests.adults + m.ent.guests.kids : (m.text.match(/\bfor (\d)\b/) || [])[1]; bot.startFlow('exp', { exp: m.ent.exp, date: m.ent.checkin, guests: g ? +g : undefined }); } },
      { id: 'lookup', label: 'Find my booking', kw: ['my booking', 'booking status', 'reservation', 'change my booking', 'add transfer', 'cancel my booking', 'booking reference'], re: [/\bTD[- ]?[A-Z0-9]{5}\b/i], priority: 2, run: function (bot, m) { bot.startFlow('lookup', { ref: m.ent.ref }); } },
      { id: 'reach', label: 'Getting here', kw: ['how to reach', 'how do i get', 'directions', 'train', 'flight', 'airport', 'kathgodam', 'pantnagar', 'drive', 'road', 'distance', 'transfer', 'pickup', 'cab'], priority: 0, run: function (bot) { bot.say('Three ways up. Most guests take the overnight train from Delhi and are on the deck for breakfast.', { buttons: [B('Overnight train', 'act:route:train'), B('Fly to Pantnagar', 'act:route:fly'), B('Drive from Delhi', 'act:route:drive')] }); bot.event('intent', { intent: 'reach' }); } },
      { id: 'event', label: 'A wedding or offsite', kw: ['wedding', 'offsite', 'event', 'buyout', 'group booking', 'birthday party', 'anniversary party', 'retreat', 'conference', 'sangeet', 'mehendi'], priority: 1, run: function (bot, m) { bot.startFlow('event', { kind: m.ent.kind, guestsN: m.ent.headcount, dates: m.ent.checkin ? dfmt(m.ent.checkin) : undefined }); } }
    ],
    flows: {
      stay: { intent: 'stay', slots: [
        { name: 'checkin', ask: function (bot) { var t = today(), D = TD().date; bot.say('When would you like to arrive?', { buttons: [B('This weekend · ' + dfmt(nextFri()), 'slot:checkin=' + nextFri()), B('Next weekend · ' + dfmt(D.add(nextFri(), 7)), 'slot:checkin=' + D.add(nextFri(), 7)), B('In two weeks · ' + dfmt(D.add(t, 14)), 'slot:checkin=' + D.add(t, 14))] }); }, parse: dateFrom, hint: 'A date like 26 Dec, or “this weekend”.' },
        { name: 'nights', ask: function (bot, s) { var ms = TD().minStay(s.checkin); bot.say('Arriving **' + dfmt(s.checkin) + '**. For how many nights?' + (ms > 1 ? ' (There’s a ' + ms + '-night minimum from that date.)' : ''), { buttons: [2, 3, 4, 5].filter(function (n) { return n >= ms; }).map(function (n) { return B(n + ' nights' + (n >= 3 ? ' · ' + (n >= 5 ? '15' : '10') + '% off' : ''), 'slot:nights=' + n); }) }); }, parse: function (t, bot, s) { return nightsFrom(t, s.checkin) || (/^\s*\d{1,2}\s*$/.test(t) ? +t : undefined); }, validate: function (v, bot, s) { var ms = TD().minStay(s.checkin); return +v < ms ? 'From ' + dfmt(s.checkin) + ' the minimum is ' + ms + ' nights.' : ''; } },
        { name: 'guests', ask: function (bot) { bot.say('And who is coming?', { buttons: [B('2 adults', 'say:2 adults'), B('2 adults + 1 child', 'say:2 adults 1 child'), B('Family of 4', 'say:family of 4'), B('4 adults', 'say:4 adults')] }); }, parse: guestsFrom, hint: 'Like “2 adults and 1 child”.' }
      ], done: function (bot, s) {
        s.nights = +s.nights; var cards = cottageCards(bot, s), co = TD().date.add(s.checkin, s.nights);
        bot.mem.stay = { checkin: s.checkin, nights: s.nights, adults: s.guests.adults, kids: s.guests.kids };
        if (!cards.length) { bot.say('I’m sorry: for **' + dfmt(s.checkin) + '** to **' + dfmt(co) + '** nothing that fits ' + guestsLabel(s.guests) + ' is free. Try a day either side?', { buttons: [B('A day earlier', 'act:shift:-1'), B('A day later', 'act:shift:1'), B('Talk to the desk', 'handover')] }); lead(bot, 'availability', { checkin: dfmt(s.checkin), nights: s.nights, guests: guestsLabel(s.guests), result: 'Full' }); return; }
        var pref = bot.mem.prefer || (bot.ctx.page === 'cottage' && bot.ctx.id); if (pref) cards.sort(function (a, b) { return a.buttons[0].value.indexOf(pref) >= 0 ? -1 : b.buttons[0].value.indexOf(pref) >= 0 ? 1 : 0; });
        bot.say('For **' + dfmt(s.checkin) + '** to **' + dfmt(co) + '**, ' + guestsLabel(s.guests) + ', ' + (cards.length === 1 ? 'one cottage fits' : cards.length + ' cottages fit') + '. Prices are the whole stay with breakfast and GST:', { cards: cards });
        bot.say('Book direct and the 2 pm check-out is yours, free. Shall I open one with these dates filled in?', { buttons: [B('Change dates', 'flow:stay'), B('Talk to the desk', 'handover')] });
        bot.event('booking', { kind: 'quote' }); lead(bot, 'availability', { checkin: dfmt(s.checkin), nights: s.nights, guests: guestsLabel(s.guests), from: cards[cards.length - 1].price });
      } },
      exp: { intent: 'exp', slots: [
        { name: 'exp', ask: function (bot) { bot.say('Which one?', { cards: TD().experiences.map(function (e) { return { title: e.name, sub: e.line, img: PH(e.photo), meta: [e.when + ' · ' + e.slots.join(', '), e.dur + ' · up to ' + e.cap, 'With ' + e.guide], price: R(e.price), priceLabel: 'per guest', buttons: [B('Choose', 'slot:exp=' + e.id)] }; }) }); }, parse: expFrom },
        { name: 'date', ask: function (bot, s) { var T = TD(), e = T.exp(s.exp), out = []; for (var i = 0; i < 9 && out.length < 5; i++) { var d = T.date.add(today(), i); if (!runs(e, d)) continue; var left = e.slots.reduce(function (a, t) { return a + Math.max(0, e.cap - T.slotTaken(e.id, d, t)); }, 0); out.push(B((i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dfmt(d)) + (left ? ' · ' + left + ' places' : ' · full'), 'slot:date=' + d)); } bot.say('**' + e.name + '** runs ' + e.when.toLowerCase() + '. Which day?', { buttons: out }); }, parse: function (t, bot, s) { var d = dateFrom(t); return d && runs(TD().exp(s.exp), d) ? d : undefined; }, hint: 'A day it runs, like tomorrow or Saturday.' },
        { name: 'time', when: function (bot, s) { var e = TD().exp(s.exp); if (e.slots.length === 1) { s.time = e.slots[0]; return false; } return true; }, ask: function (bot, s) { var T = TD(), e = T.exp(s.exp); bot.say('Which session?', { buttons: e.slots.map(function (t) { var l = e.cap - T.slotTaken(e.id, s.date, t); return B(t + ' · ' + (l > 0 ? l + ' left' : 'full'), 'slot:time=' + t); }) }); }, parse: function (t) { var m = String(t).match(/\b(\d{1,2})[:.]?(\d{2})\b/); return m ? ('0' + m[1]).slice(-2) + ':' + m[2] : undefined; } },
        { name: 'guests', ask: function (bot, s) { var T = TD(), e = T.exp(s.exp), l = e.cap - T.slotTaken(e.id, s.date, s.time || e.slots[0]); bot.say('How many of you? ' + (l > 0 ? l + ' places are left.' : ''), { buttons: [1, 2, 3, 4].filter(function (n) { return n <= l; }).map(function (n) { return B(n + (n > 1 ? ' guests' : ' guest'), 'slot:guests=' + n); }) }); }, parse: function (t) { var g = guestsFrom(t); if (g) return g.adults + g.kids; var m = String(t).match(/^\s*(\d{1,2})\s*$/); return m ? +m[1] : undefined; }, validate: function (v, bot, s) { var T = TD(), e = T.exp(s.exp), l = e.cap - T.slotTaken(e.id, s.date, s.time || e.slots[0]); return +v > l ? 'Only ' + l + ' place' + (l === 1 ? ' is' : 's are') + ' left on that one.' : ''; } },
        { name: 'name', ask: function (bot) { if (bot.user.name) { bot.slots.name = bot.user.name; bot._advance(); return; } bot.say('Who should the guide ask for?'); }, parse: function (t) { var n = N.name(t); return n && !/\d|@/.test(t) ? n : (/^[a-z][a-z .'-]{1,40}$/i.test(String(t).trim()) ? String(t).trim().replace(/\b\w/g, function (c) { return c.toUpperCase(); }) : undefined); }, hint: 'Just a first name is fine.' }
      ], done: function (bot, s) {
        var T = TD(), e = T.exp(s.exp), time = s.time || e.slots[0], g = +s.guests, l = T.slots(), b = bot.mem.booking ? T.findBooking(bot.mem.booking) : null, id = 'X' + (800 + l.length);
        if (e.cap - T.slotTaken(e.id, s.date, time) < g) { bot.say('Someone took the last places a moment ago. Another day?', { buttons: [B('Pick another day', 'flow:exp')] }); return; }
        l.push({ id: id, exp: e.id, date: s.date, time: time, guests: g, name: s.name, ref: b ? b.ref : null, room: b ? b.room : 'Day visitor', status: 'booked', chat: true }); T.saveSlots(l);
        bot.user.name = s.name;
        bot.say('Done, ' + s.name.split(' ')[0] + '. You’re on the roster.', { cards: [{ title: e.name, sub: 'Meet at the Long Room porch five minutes before. ' + (b ? 'Added to ' + b.ref + ', paid at check-out.' : 'Pay at the desk on the day.'), img: PH(e.photo), badge: id, meta: [(s.date === today() ? 'Today' : dfmt(s.date)) + ' · ' + time, g + ' guest' + (g > 1 ? 's' : '') + ' with ' + e.guide, R(e.price * g) + ' plus GST'] }], buttons: [B('Book another', 'flow:exp'), B('Check dates for a stay', 'flow:stay')] });
        bot.event('booking', { kind: 'experience' }); lead(bot, 'experience', { experience: e.name, when: dfmt(s.date) + ' ' + time, guests: g, ref: b ? b.ref : '' }, { name: s.name });
      } },
      lookup: { intent: 'lookup', slots: [
        { name: 'ref', ask: function (bot) { bot.say('What’s the booking reference? It’s in your confirmation, and looks like **TD-4M8PK**.', { buttons: [B('Use TD-4M8PK', 'slot:ref=TD-4M8PK')] }); }, parse: refFrom, hint: 'References look like TD-4M8PK.' },
        { name: 'surname', ask: function (bot, s) { bot.say('Thanks. And the last name on the booking?', s.ref === 'TD-4M8PK' ? { buttons: [B('It’s Bisht', 'slot:surname=Bisht')] } : undefined); }, parse: function (t) { var w = String(t).trim().split(/\s+/).pop(); return /^[a-z][a-z'-]{1,30}$/i.test(w) ? w : undefined; } }
      ], done: function (bot, s) {
        var T = TD(), b = T.findBooking(s.ref);
        if (!b || b.guest.last.toLowerCase() !== String(s.surname).toLowerCase()) { bot.say('I couldn’t match **' + s.ref + '** with that name. Check the reference in your confirmation, or I can ask the desk.', { buttons: [B('Try again', 'flow:lookup'), B('Talk to the desk', 'handover')] }); return; }
        bot.mem.booking = b.ref; bot.user.name = bot.user.name || b.guest.first + ' ' + b.guest.last; bot.user.email = b.guest.email;
        var t = T.type(b.type), n = T.date.diff(b.checkin, b.checkout), days = T.date.diff(today(), b.checkin), tr = b.addons && (b.addons.kgm || b.addons.pgh || b.addons['kgm-suv']);
        bot.say('Found it, ' + b.guest.first + '. ' + (days > 0 ? 'You’re with us in **' + days + ' day' + (days > 1 ? 's' : '') + '**.' : days === 0 ? 'You arrive **today**; the fire is laid.' : 'Here are the details.'), { cards: [{ title: t.name + ' ' + b.room, sub: dfmt(b.checkin) + ' → ' + dfmt(b.checkout) + ' · ' + n + ' nights · ' + b.adults + ' adults', img: PH(t.hero), badge: b.ref, meta: ['Status: ' + ({ confirmed: 'confirmed', tentative: 'on hold', 'in-house': 'in house', 'checked-out': 'stayed', cancelled: 'cancelled' }[b.status] || b.status), 'Arriving around ' + (b.guest.arrival || 'not shared yet'), tr ? 'Kathgodam transfer booked' : 'No transfer yet'], buttons: [B('Open My booking', 'act:mybooking:' + b.ref)] }] });
        if (b.status === 'confirmed' || b.status === 'tentative') bot.say('Anything to change?', { buttons: (tr ? [] : [B('Add a Kathgodam transfer', 'act:transfer:' + b.ref)]).concat([B('Update my arrival time', 'act:eta:' + b.ref), B('Change my dates', 'act:change:' + b.ref), B('Book an experience', 'flow:exp')]) });
        bot.event('booking', { kind: 'lookup' }); lead(bot, 'booking_lookup', { ref: b.ref, cottage: t.name + ' ' + b.room, arrive: dfmt(b.checkin) }, { name: b.guest.first + ' ' + b.guest.last, email: b.guest.email });
      } },
      event: { intent: 'event', slots: [
        { name: 'kind', ask: function (bot) { bot.say('What are you planning?', { buttons: [B('A wedding', 'slot:kind=Wedding'), B('An offsite', 'slot:kind=Offsite'), B('A birthday or anniversary', 'slot:kind=Celebration'), B('A retreat', 'slot:kind=Retreat')] }); }, parse: function (t) { t = hi(t); return /wedding|mehendi|sangeet/.test(t) ? 'Wedding' : /offsite|team|company|corporate/.test(t) ? 'Offsite' : /birthday|anniversary|party/.test(t) ? 'Celebration' : /retreat|yoga/.test(t) ? 'Retreat' : undefined; } },
        { name: 'guestsN', ask: function (bot, s) { bot.say('About how many guests?', { buttons: (s.kind === 'Wedding' ? [30, 60, 90, 120] : [12, 20, 30, 40]).map(function (n) { return B(n + ' guests', 'slot:guestsN=' + n); }) }); }, parse: function (t) { var m = String(t).match(/\b(\d{1,3})\b/); return m && +m[1] >= 2 && +m[1] <= 400 ? +m[1] : undefined; }, validate: function (v) { return +v < 8 ? 'For fewer than 8, it’s easiest to book cottages directly. Shall I check dates instead?' : ''; } },
        { name: 'dates', ask: function (bot) { bot.say('Roughly when? Months are fine, and so is “flexible”.', { buttons: [B('Spring (buransh season)', 'slot:dates=March–April'), B('Autumn (clearest skies)', 'slot:dates=October–November'), B('Flexible', 'slot:dates=Flexible')] }); }, parse: function (t) { return String(t).trim().length >= 3 ? String(t).trim().slice(0, 60) : undefined; } },
        { name: 'budget', optional: false, ask: function (bot, s) { bot.say('And a rough budget, so Ritu can shape the first proposal?', { buttons: (s.kind === 'Wedding' ? ['Up to ₹15 L', '₹15–25 L', '₹25–40 L', '₹40 L+'] : ['Up to ₹5 L', '₹5–10 L', '₹10–15 L', 'Not sure yet']).map(function (x) { return B(x, 'slot:budget=' + x); }) }); }, parse: function (t) { var raw = String(t).trim(); if (/(₹|rs\.?|inr)?\s*\d+(\.\d+)?\s*(-|–|to)\s*\d+(\.\d+)?\s*(l|lakh|lakhs|lac|cr|crore)\b/i.test(raw) || /\d\s*(l|lakh|lakhs|lac|cr|crore)\b\+?/i.test(raw)) return raw.slice(0, 24); var m = N.money(t); return m ? R(m.max || m.min) : /not sure|no idea|flexible/i.test(t) ? 'Not sure yet' : undefined; } },
        { name: 'name', ask: function (bot) { if (bot.user.name) { bot.slots.name = bot.user.name; bot._advance(); return; } bot.say('Who should Ritu ask for?'); }, parse: function (t) { var n = N.name(t); return n && !/\d|@/.test(t) ? n : (/^[a-z][a-z .'-]{1,40}$/i.test(String(t).trim()) ? String(t).trim().replace(/\b\w/g, function (c) { return c.toUpperCase(); }) : undefined); } },
        { name: 'contact', ask: function (bot, s) { bot.say('And an email or mobile number for the proposal, ' + s.name.split(' ')[0] + '?'); }, parse: function (t) { return N.email(t) || N.phone(t); }, hint: 'An email address or a mobile number.' }
      ], done: function (bot, s) {
        var T = TD(), l = T.enquiries(), id = 'EQ-' + (1047 + l.length), email = /@/.test(s.contact) ? s.contact : '';
        bot.user.name = s.name; if (email) bot.user.email = email; else bot.user.phone = s.contact;
        l.unshift({ id: id, kind: s.kind, name: s.name, org: '', email: email, guests: +s.guestsN, dates: s.dates, budget: s.budget, stage: 'New', venue: s.kind === 'Wedding' && +s.guestsN > 40 ? 'Full buyout' : s.kind === 'Offsite' ? 'The Library' : 'Not sure', created: today(), note: s.kind + ' for about ' + s.guestsN + ', ' + s.dates + ', ' + s.budget + '. From the concierge chat.', chat: true }); T.saveEnquiries(l);
        bot.say('Thank you, ' + s.name.split(' ')[0] + '. That’s ' + id + ': a ' + s.kind.toLowerCase() + ' for about ' + s.guestsN + ', ' + s.dates.toLowerCase() + ', ' + s.budget + '. I’m passing you to Ritu, our events lead, now. She can see everything we talked about.', { cards: [{ title: s.kind + ' · ' + s.guestsN + ' guests', sub: s.kind === 'Wedding' ? 'Pheras on the Orchard Lawn at sunset, the whole ridge for three nights.' : 'The Library to yourselves, walks in the afternoons.', img: PH(s.kind === 'Wedding' ? 'wed-trees' : 'balcony-mist'), badge: id, meta: ['When: ' + s.dates, 'Budget: ' + s.budget, 'Reply within a working day'] }] });
        bot.event('booking', { kind: 'event_enquiry' }); lead(bot, 'event_enquiry', { ref: id, kind: s.kind, guests: +s.guestsN, dates: s.dates, budget: s.budget }, { name: s.name, phone: email ? '' : s.contact, email: email || undefined });
        bot.handover('Wedding or offsite enquiry for sales');
      } }
    },
    actions: {
      book: function (bot, type) { var st = bot.mem.stay; if (!st) { bot.startFlow('stay'); return; } var url = 'book.html?type=' + type + '&in=' + st.checkin + '&out=' + TD().date.add(st.checkin, st.nights) + '&ad=' + st.adults; lead(bot, 'availability', { chose: TD().type(type).name, checkin: dfmt(st.checkin), nights: st.nights }); go(bot, url, 'Opening the booking page with your dates and the ' + TD().type(type).name + ' selected. Breakfast and a 2 pm check-out are included.'); },
      see: function (bot, type) { if (type === 'all') { go(bot, 'stay.html', 'Taking you to all four, side by side.'); return; } go(bot, 'cottage.html?id=' + type, 'Opening the ' + TD().type(type).plural + ': photographs, a 360° look around and the next 30 nights.'); },
      shift: function (bot, d) { var st = bot.mem.stay; if (!st) { bot.startFlow('stay'); return; } bot.startFlow('stay', { checkin: TD().date.add(st.checkin, +d), nights: st.nights, guests: { adults: st.adults, kids: st.kids } }); },
      exp: function (bot, id) { bot.startFlow('exp', { exp: id }); },
      event: function (bot, kind) { bot.startFlow('event', { kind: kind }); },
      route: function (bot, k) {
        var R2 = { train: ['The overnight train leaves New Delhi at 22:30 and reaches **Kathgodam at 05:20**. Our driver meets you on the platform; you’re on the deck by **07:50**, with a chai stop at Bhowali.', 'Kathgodam car: ₹3,800 each way (₹5,200 for an SUV).'], fly: ['Fly Delhi → **Pantnagar** (about an hour), then 3 hours by road through Bhimtal and Bhowali. Lunch by the lake on the way is a good idea.', 'Pantnagar car: ₹5,600 each way.'], drive: ['About **8 hours from Delhi** (330 km): Moradabad, Haldwani, Bhowali, Mukteshwar. The last 9 km are narrow but fully tarred; signal drops for about 4 km after the Dhura temple. Covered parking and a 7 kW charger at the gate.', 'Leave by 05:30 to beat the traffic.'] }[k];
        bot.say(R2[0], { buttons: (bot.mem.booking ? [B('Add the transfer to my booking', 'act:transfer:' + bot.mem.booking)] : [B('Add it to my booking', 'flow:lookup')]).concat([B('Check dates', 'flow:stay'), B('Weather this month', 'say:weather')]) });
        bot.say(R2[1]); lead(bot, 'getting_here', { route: { train: 'Overnight train', fly: 'Fly to Pantnagar', drive: 'Drive' }[k] });
      },
      mybooking: function (bot, ref) { var b = TD().findBooking(ref); go(bot, 'my-booking.html?ref=' + ref + '&email=' + encodeURIComponent(b ? b.guest.email : ''), 'Opening My booking.'); },
      transfer: function (bot, ref) { var T = TD(), b = T.findBooking(ref); if (!b) return; T.updateBooking(ref, function (x) { x.addons = x.addons || {}; x.addons.kgm = 2; var q = T.requote(x); x.total = q.total; if (x.pay) x.pay.total = q.total; }, 'Kathgodam transfer (both ways) added by the concierge chat'); bot.say('Added: the Kathgodam car both ways, ' + R(7600) + ' plus GST, on your bill. The driver’s name comes the day before. Send your train number when you have it.'); lead(bot, 'booking_change', { ref: ref, change: 'Kathgodam transfer both ways' }, { name: b.guest.first + ' ' + b.guest.last, email: b.guest.email }); },
      eta: function (bot, ref) { bot.say('Around when will you reach the gate?', { buttons: ['12:30', '14:00', '15:30', '17:00', 'After 18:00'].map(function (t) { return B(t, 'act:seteta:' + ref + '|' + t); }) }); },
      seteta: function (bot, arg) { var p = arg.split('|'), T = TD(), b = T.findBooking(p[0]); if (!b) return; T.updateBooking(p[0], function (x) { x.guest.arrival = p[1]; }, 'Arrival time updated in the concierge chat: ' + p[1]); bot.say('Noted: around **' + p[1] + '**. The desk will have chai ready.'); lead(bot, 'booking_change', { ref: p[0], change: 'Arrival ' + p[1] }, { name: b.guest.first + ' ' + b.guest.last, email: b.guest.email }); },
      change: function (bot, ref) { var T = TD(), b = T.findBooking(ref); T.addMessage(ref, 'guest', 'Date change request from the concierge chat: could we move our stay? (' + dfmt(b.checkin) + ' → ' + dfmt(b.checkout) + ')'); bot.say('Date changes are free up to 7 days before arrival. I’ve asked the desk to move you; a person will confirm the new dates here.'); lead(bot, 'booking_change', { ref: ref, change: 'Date change requested' }, { name: b.guest.first + ' ' + b.guest.last, email: b.guest.email }); bot.handover('Date change request'); }
    },
    freeText: function (bot, m) {
      if (m.ent.checkin || m.ent.guests || m.ent.nights) { bot.startFlow('stay', { checkin: m.ent.checkin, nights: m.ent.nights, guests: m.ent.guests }); return true; }
      if (m.ent.exp) { bot.startFlow('exp', { exp: m.ent.exp, date: m.ent.checkin }); return true; }
      if (m.ent.kind) { bot.startFlow('event', { kind: m.ent.kind, guestsN: m.ent.headcount }); return true; }
      return false;
    },
    kb: [
      { id: 'checkin', q: 'Check-in and check-out times?', a: 'Check-in from **2 pm**; early check-in from 9 am for ₹3,000 when the cottage is free. Check-out by 11 am, or **2 pm** when you book direct.', keys: ['check in time', 'check out time', 'checkin', 'checkout', 'early check in', 'late check out', 'timings'] },
      { id: 'cancel', q: 'What is the cancellation policy?', a: 'Free cancellation up to **21 days** before arrival, 50% back from 7 to 20 days, nothing inside 7 days. Monsoon stays (July to September) are free to cancel until 7 days out. Date changes are free up to 7 days before.', keys: ['cancel', 'cancellation', 'refund', 'change dates', 'reschedule'] },
      { id: 'kids', q: 'Are children welcome?', a: 'Yes, everywhere except the Star House. Under 6 stay and eat free; 6 to 11 pay half on meal plans. Cots and high chairs are free.', keys: ['children', 'kids', 'child', 'baby', 'infant', 'toddler', 'family'] },
      { id: 'pets', q: 'Can we bring our dog?', a: 'Yes, in Deodar Rooms **D1 and D2**, for ₹1,500 a night, with a bed, bowls and a towel. Dogs stay indoors after dark (there are leopards in these forests).', keys: ['dog', 'pet', 'pets', 'cat', 'pet friendly'] },
      { id: 'food', q: 'What is the food like?', a: 'Kumaoni, cooked slowly by Chef Kamala Rawat, mostly from our garden and Dhura village: bhatt ki churkani, madua roti, jhangora kheer. Vegan, Jain and gluten-free are no trouble. Breakfast is always included when you book direct.', keys: ['food', 'menu', 'meals', 'vegetarian', 'veg', 'jain', 'vegan', 'dinner', 'breakfast', 'restaurant'] },
      { id: 'weather', q: 'What’s the weather like?', a: 'At 2,140 m nights are cold most of the year: about 0°C in December and January, 8°C in October, 14°C in June. Snow falls two or three times between late December and February. **October and November** have the clearest views of the range.', keys: ['weather', 'temperature', 'cold', 'snow', 'climate', 'rain', 'monsoon', 'best time', 'when to visit'] },
      { id: 'road', q: 'Is the road okay?', a: 'Fully tarred all the way; the last 9 km after Mukteshwar are narrow, so allow 25 minutes. After snow the road is usually ploughed by 8 am, and we send a 4×4 to Mukteshwar if it isn’t, at no charge.', keys: ['road', 'road condition', 'sedan', 'car', 'snow chains', 'driving', 'hill driving'] },
      { id: 'wifi', q: 'Is there Wi-Fi and phone signal?', a: 'Fibre Wi-Fi in every cottage with a backup line, and a desk facing the range in the Ridge Cottages. Mobile signal is patchy for about 4 km on the last stretch, fine at the resort.', keys: ['wifi', 'internet', 'signal', 'network', 'work from home', 'wfh', 'laptop'] },
      { id: 'heat', q: 'Are the rooms heated?', a: 'Every cottage has a wood stove or fireplace, lit for you at turndown, plus heaters and electric blankets. The Orchard Houses have a wood-burner in the living room.', keys: ['heating', 'heater', 'fireplace', 'cold at night', 'warm', 'blanket'] },
      { id: 'pay', q: 'How do I pay?', a: 'Pay in full when you book (5% off) or 30% now and the rest at check-in, by UPI, card or net banking. GST is 18% on rooms, shown before you pay; we issue GST invoices to companies.', keys: ['payment', 'pay', 'advance', 'deposit', 'gst', 'invoice', 'upi', 'card'] },
      { id: 'direct', q: 'Why book direct?', a: 'Same or lower rate than the portals, breakfast included, a free **2 pm** check-out, free date changes up to 7 days out, and you choose your cottage on the plan.', keys: ['book direct', 'cheaper', 'discount', 'best rate', 'booking.com', 'agoda', 'makemytrip', 'ota'] },
      { id: 'alcohol', q: 'Can we drink and smoke?', a: 'Drinks are served at the bar and in your cottage, and outside alcohol is fine in your cottage. No smoking indoors or in the forest, and no loudspeakers outdoors, ever.', keys: ['alcohol', 'drinks', 'bar', 'beer', 'smoking', 'smoke', 'party', 'music'] },
      { id: 'access', q: 'Is it accessible?', a: 'Deodar Rooms D1 and D2 and the Long Room are step-free from the car park, with a roll-in shower in D1. Other cottages have 6 to 42 stone steps; our team carries luggage and meals anywhere.', keys: ['wheelchair', 'accessible', 'accessibility', 'elderly', 'steps', 'stairs', 'senior'] },
      { id: 'medical', q: 'What about a doctor or altitude?', a: '2,140 m rarely bothers anyone. There’s a first-aid kit and oxygen at the desk, a doctor in Mukteshwar (9 km) and the hospital in Haldwani (2 h). Tell us about any condition and we’ll plan around it.', keys: ['doctor', 'hospital', 'medical', 'altitude', 'oxygen', 'emergency', 'pharmacy'] },
      { id: 'sights', q: 'What is there to see nearby?', a: 'Chauli ki Jali cliff and the Mukteshwar temple (20 minutes), Nainital (90 minutes), Binsar forest (2 h). Most guests find the ridge, the walks and the sky are enough.', keys: ['nearby', 'sightseeing', 'places to visit', 'nainital', 'mukteshwar', 'temple', 'things to see'] },
      { id: 'laundry', q: 'Is there laundry?', a: 'Same-day laundry if it’s in by 10 am, ₹60 a piece; woollens are hand-washed.', keys: ['laundry', 'washing', 'clothes', 'dry clean'] },
      { id: 'parking', q: 'Parking and EV charging?', a: 'Covered parking for 14 cars at the gate, a **7 kW charger** for electric cars (₹350 a session), and a porter with a hand cart for the 80 m to the lodge.', keys: ['parking', 'ev', 'charger', 'electric car', 'tesla', 'park'] },
      { id: 'tv', q: 'Is there a TV?', a: 'Most cottages are kept quiet: speakers you can pair your phone with, a library of 600 books and a projector in the Library for the cricket.', keys: ['tv', 'television', 'netflix', 'entertainment'] },
      { id: 'id', q: 'What ID do we need?', a: 'A government photo ID for every adult (Aadhaar, passport, driving licence or voter ID). Foreign nationals need a passport and visa; we file Form C as the law requires.', keys: ['id', 'id proof', 'aadhaar', 'passport', 'documents', 'foreigner'] },
      { id: 'stars', q: 'When is the best stargazing?', a: 'Around the **new moon**, any clear night; the Milky Way is overhead from about April to October and rises behind the range in early summer. The telescope sessions are at 7:30 and 9 pm.', keys: ['stargazing', 'milky way', 'stars', 'night sky', 'new moon', 'astronomy'] }
    ]
  });
})();
