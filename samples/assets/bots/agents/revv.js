/* Revv pit crew: the scripted assistant for the Revv marketplace (samples/revv). Rule-based, no LLM, no network calls.
   It reads the live inventory, inspection reports and dealers from window.Revv / window.REVV_DATA (revv/app.js, revv/data.js)
   and writes into the dealer app: test rides and callbacks land in the dealer's pipeline as "Chat" leads with a transcript link,
   seller valuations land on the admin inspector board. Loaded lazily by revv/concierge.js. */
(function () {
  'use strict';
  var O = window.Orbit; if (!O || O.agents.revv) return;
  var N = O.nlp, DAY = 864e5;
  var B = function (l, v) { return { label: l, value: v }; };
  function R() { return window.Revv || null; }
  function D() { return window.REVV_DATA || null; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  var DN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function nice(s) { var d = new Date(s + 'T00:00'); return DN[d.getDay()] + ' ' + d.getDate() + ' ' + MN[d.getMonth()]; }
  function dayWord(s) { var n = Math.round((new Date(s + 'T00:00') - new Date(iso(new Date()) + 'T00:00')) / DAY); return n === 0 ? 'today' : n === 1 ? 'tomorrow' : nice(s); }
  function first(n) { return String(n || '').split(' ')[0]; }
  function inr(n) { var r = R(); return r ? r.inr(n) : '₹' + Math.round(n).toLocaleString('en-IN'); }
  function inrFull(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  function mask(p) { var d = String(p || '').replace(/\D/g, '').slice(-10); return d.length === 10 ? d.slice(0, 2) + '•• ••• •' + d.slice(-2) : ''; }
  function daypart() { var h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; }
  var TIMES = ['10:30', '11:30', '12:30', '15:00', '16:30', '18:00'];

  /* ---------- inventory ---------- */
  function all() { var r = R(); return r ? r.listings().filter(function (l) { return l.status !== 'sold'; }) : []; }
  function byId(id) { var r = R(); return r && id ? r.byId(id) : null; }
  function title(l) { return l.year + ' ' + l.make + ' ' + l.model; }
  function img(l) { var r = R(); return O.samples('revv/' + (r ? r.img(l, true) : 'photos/' + l.img + '-s.jpg')); }
  function shop() { var r = R(); return r && r.shop ? r.shop() : null; }
  // the valuation table (revv/data.js MODELS): best match for free text, e.g. "my 2019 arka tez" -> ['car', ['Arka Tez 1.2', ...]]
  function tableModel(t) {
    var d = D(); if (!d || !d.MODELS) return null; var words = String(t).toLowerCase().replace(/[^a-z0-9. ]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 1; }), best = null, bs = 0;
    ['car', 'bike'].forEach(function (ty) { d.MODELS[ty].forEach(function (m) { var mw = m[0].toLowerCase().split(' '), sc = 0; mw.forEach(function (w, i) { if (words.indexOf(w) > -1) sc += i === 0 ? 2 : 3; }); if (sc >= 3 && (sc > bs || (sc === bs && mw.length < best[1][0].split(' ').length))) { bs = sc; best = [ty, m]; } }); });
    return best;
  }
  function card(l, btns) {
    var r = R(), d = r ? r.dealer(l.dealer) : { name: '' };
    return { title: title(l), sub: l.city + ' · ' + d.name, img: img(l), badge: l.score + '/150', price: inr(l.price) + (l.status === 'reserved' ? ' / reserved' : ''), priceLabel: 'ex-showroom',
      meta: [Math.round(l.km).toLocaleString('en-IN') + ' km · ' + (r ? r.own(l.owners) : ''), (l.spec.engine || l.spec.motor || l.spec.power), 'EMI from ' + inr(emi(l.price * 0.8, 10.5, 60)) + '/mo'],
      buttons: btns || [B('Book a test ride', 'act:ride:' + l.id), B('EMI for this', 'act:emi:' + l.id), B('Open the listing', 'act:go:vehicle.html?id=' + l.id)] };
  }
  function emi(p, rate, n) { var r = rate / 1200; return p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1); }
  function budget(t) {
    t = String(t).toLowerCase().replace(/,/g, ''); var m, q = /(under|below|less than|upto|up to|max|within|budget|tak|se kam|andar)/.test(t) ? 'max' : /(over|above|more than|at least|min|starting)/.test(t) ? 'min' : null;
    m = t.match(/(\d+(?:\.\d+)?)\s*(l|lakh|lakhs|lac|lacs|lk)\b/); if (m) return { v: +m[1] * 1e5, q: q || 'max' };
    m = t.match(/(\d+(?:\.\d+)?)\s*(cr|crore|crores)\b/); if (m) return { v: +m[1] * 1e7, q: q || 'max' };
    var mo = N.money(t); if (mo && (mo.max || mo.min) && (mo.max || mo.min) > 50000) return mo.max ? { v: mo.max, q: 'max' } : { v: mo.min, q: 'min' };
    return null;
  }
  function typeFrom(t) { t = t.toLowerCase(); if (/\b(bike|bikes|motorcycle|superbike|naked|cafe|café|bobber|tourer|supersport|scooter|gaadi do pahiya|two.?wheeler)\b/.test(t)) return 'bike'; if (/\b(car|cars|sedan|suv|coupe|coupé|hatch|gaadi|four.?wheeler|gt\b|roadster)\b/.test(t)) return 'car'; }
  function bodyFrom(t) { t = t.toLowerCase(); var M = [['superbike', /superbike|litre|1000 ?cc|track/], ['naked', /naked|streetfighter/], ['cafe', /caf[eé]/], ['tourer', /tourer|touring/], ['sedan', /sedan/], ['suv', /\bsuv\b/], ['coupe', /coup[eé]|gt\b/], ['ev', /electric|\bev\b|battery/]]; for (var i = 0; i < M.length; i++) if (M[i][1].test(t)) return M[i][0]; }
  function cityFrom(t) { var d = D(); if (!d) return; t = t.toLowerCase(); var c = (d.CITIES || []).filter(function (x) { return t.indexOf(String(x).toLowerCase()) > -1; })[0]; if (c) return c; if (/bombay|mumbai/.test(t)) return 'Mumbai'; if (/bangalore|bengaluru/.test(t)) return 'Bengaluru'; if (/delhi|ncr|gurgaon|gurugram|noida/.test(t)) return 'Delhi NCR'; }
  function search(f) {
    var L = all().filter(function (l) {
      if (f.type && l.type !== f.type) return false; if (f.city && l.city !== f.city) return false;
      if (f.body === 'ev') { if (l.fuel !== 'Electric') return false; } else if (f.body && l.body !== f.body && !(f.body === 'coupe' && /coup/i.test(l.body))) return false;
      if (f.max && l.price > f.max) return false; if (f.min && l.price < f.min) return false; if (f.lowkm && l.km > (l.type === 'bike' ? 12000 : 25000)) return false; return true; });
    L.sort(function (a, b) { return f.lowkm ? a.km - b.km : f.max ? b.price - a.price : b.score - a.score; }); return L;
  }

  /* ---------- the 150-point report ---------- */
  function report(l) { var r = R(); return r ? r.report(l) : null; }
  function reportLine(l) { var rp = report(l); if (!rp) return ''; return '**' + l.score + '/150** on the inspection by ' + rp.inspector + '. ' + (rp.advisories.length ? rp.advisories.length + ' advisor' + (rp.advisories.length > 1 ? 'ies' : 'y') + ', none safety-critical: ' + rp.advisories.slice(0, 2).map(function (a) { return a[1].toLowerCase(); }).join('; ') + '.' : 'No advisories.'); }

  /* ---------- writing into the dealer app ---------- */
  function toDealer(bot, l, o) {
    var r = R(); if (!r) return null; var lead = r.addLead({ listing: l.id, dealer: l.dealer, name: o.name, phone: mask(o.phone) || 'via chat', kind: o.kind, slot: o.slot || null, where: o.where || null, msg: o.msg || '', src: 'Chat', convo: bot.id, keepDealer: true });
    var crm = bot.lead({ name: o.name, phone: o.phone, intent: o.intent, payload: { listing: l.id, dealer: l.dealer, revvLead: lead.id, slot: o.slot || null, convo: bot.id } });
    try { O.convos.setStatus(bot.id, bot.convo.status, { dealer: l.dealer, lead: lead.id, leadId: crm.id, topic: o.intent }); } catch (e) {}
    return lead;
  }
  function takenSlots(l) { var r = R(); return r ? r.leads().filter(function (x) { return x.dealer === l.dealer && x.slot; }).map(function (x) { return x.slot; }) : []; }
  function go(bot, url, line) { bot.say(line || 'Opening it for you…', { delay: 250 }); try { sessionStorage.setItem('cg-reopen-revv', '1'); } catch (e) {} setTimeout(function () { location.href = O.samples('revv/' + url); }, 900); }
  function ctxListing(bot) { return byId(bot.ctx && bot.ctx.id) || byId(bot.mem.lastId); }
  // put the valued trade-in (bot.mem.xval) against a listing: writes revv:exchange; the vehicle page repaints its price block
  function xon(bot, id) {
    var r = R(), l = byId(id), x = bot.mem.xval; if (!r || !l) return;
    if (!x) { bot.startFlow('exchange', { name: bot.user.name, phone: bot.user.phone }); return; }
    if (!bot.user.name || !bot.user.phone) { bot.mem.lastId = id; bot.startFlow('exchange', { model: x.modelName, year: x.year, km: x.km, cond: x.condition }); return; }
    r.addExchange({ wantId: l.id, modelName: x.modelName, year: x.year, km: x.km, condition: x.condition, low: x.low, high: x.high, name: bot.user.name, contact: bot.user.phone });
    var net = l.price - x.low, d = r.dealer(l.dealer); bot.mem.lastId = l.id;
    bot.say('Done. On the **' + title(l) + '** you pay **' + inr(net) + '** after your ' + x.year + ' ' + x.modelName + ', about **' + inrFull(r.monthly(net)) + ' a month**. ' + d.name + ' has the request and confirms the final figure when they inspect yours (up to ' + inr(x.high) + ' if it’s as good as you say).', { buttons: [B('Open the listing', 'act:go:vehicle.html?id=' + l.id), B('Book a test ride', 'act:ride:' + l.id), B('That’s all, thanks', 'say:thanks')] });
  }

  var MENU = [B('Find me a ride', 'flow:find'), B('Book a test ride', 'flow:ride'), B('Work out an EMI', 'flow:emi'), B('Value my vehicle', 'flow:sell'), B('Talk to the dealer', 'intent:dealer')];
  function dayButtons(n) { var out = [], now = new Date(); for (var i = 0; i < (n || 5); i++) { var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i); if (i === 0 && now.getHours() >= 17) continue; out.push(B(i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DN[d.getDay()] + ' ' + d.getDate(), 'slot:day=' + iso(d))); } return out.slice(0, 4); }
  function dayFrom(t) { var w = N.when(String(t).replace(/\bkal\b/i, 'tomorrow').replace(/\baaj\b/i, 'today').replace(/\bparso\b/i, 'day after tomorrow')); return w && w.iso; }
  function timeFrom(t) { var w = N.when(t), tm = w && w.time; if (!tm) { var m = String(t).match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?\b/i); if (m && +m[1] <= 23) { var h = +m[1]; if ((m[3] || '').toLowerCase() === 'pm' && h < 12) h += 12; if (!m[3] && h < 9) h += 12; tm = pad(h) + ':' + (m[2] || '00'); } } if (!tm) { if (/subah|morning/i.test(t)) tm = '11:30'; else if (/dopahar|afternoon|lunch/i.test(t)) tm = '15:00'; else if (/shaam|evening/i.test(t)) tm = '18:00'; } return tm; }
  function modelFrom(t) {
    var s = String(t).replace(/(\d+(?:[.,]\d+)?)\s*(k|thousand)?\s*(km|kms|kilometres|kilometers)\b/gi, ' ').replace(/\b(20[0-2]\d|19\d\d)\b/g, ' ')
      .replace(/\b(i|i'm|im|want|wanna|to|would|like|sell|selling|my|mera|meri|apni|bechna|bechni|hai|karna|value|valuation|of|the|a|an|worth|what's|whats|what|is|how|much|for|please|pls|get|resale|driven|done|model|year|in|ka|ki)\b/gi, ' ').replace(/[,.?!]/g, ' ').replace(/\s+/g, ' ').trim();
    return s.length >= 2 && /[a-z]/i.test(s) ? s.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }).slice(0, 40) : undefined;
  }
  function nearest(tm) { var best = TIMES[0], bd = 1e9; TIMES.forEach(function (x) { var d = Math.abs((+x.slice(0, 2) * 60 + +x.slice(3)) - (+tm.slice(0, 2) * 60 + +tm.slice(3))); if (d < bd) { bd = d; best = x; } }); return best; }

  O.registerAgent({
    id: 'revv', name: 'Revv pit crew', business: 'Revv', role: 'Buying, test rides, finance and selling', industry: 'Automotive marketplace', initials: 'RV', accent: '#FF5B1F', phoneLabel: 'Revv buyer line',
    blurb: 'Revv’s own pit crew in chat: finds a superbike or car from a sentence, explains the 150-point report, works out the EMI, books a test ride into the dealer’s real calendar and values your vehicle.',
    helloLine: 'I can find you a ride, book a test ride, work out an EMI or value your vehicle.',
    samples: ['bike under 20 lakh, low km', 'kitne ka hai', 'test ride kal subah', 'value my 2019 naked bike'],
    kind: 'customer', menu: MENU,
    contexts: [{ label: 'Listings page', context: { page: 'listings' } }, { label: 'Viewing the Tessaro V4 R', context: { page: 'vehicle', id: 'tessaro-v4r' } }, { label: 'Sell page', context: { page: 'sell' } }],
    synonyms: {
      'how much': ['kitne ka hai', 'kitne ki hai', 'kitna hai', 'kitne ka', 'price kya hai', 'final price', 'best price', 'kitne mein'],
      'test ride': ['test drive', 'ride karni hai', 'chala ke dekhna', 'trial ride', 'try the bike', 'try the car', 'drive it'],
      'tomorrow': ['kal'], 'morning': ['subah'], 'evening': ['shaam', 'sham'],
      'sell my': ['bechna hai', 'bechni hai', 'sell karna hai', 'resale value of my', 'value my', 'valuation of my'],
      'talk to the dealer': ['baat karni hai', 'call me', 'real person', 'human', 'talk to someone', 'dealer se baat', 'speak to the showroom'],
      'emi': ['monthly', 'installment', 'instalment', 'loan', 'kisht', 'finance']
    },
    seeds: {},
    nudge: function (c) {
      var l = c.id && byId(c.id);
      if (l && (c.file === 'vehicle' || c.page === 'vehicle')) { var rp = report(l); return { text: title(l) + ': ' + l.score + '/150 with ' + (rp ? rp.advisories.length : 0) + ' advisor' + (rp && rp.advisories.length === 1 ? 'y' : 'ies') + '. Want the 30-second version of the report, or a ride this week?', cta: 'Walk me through it', button: B('Walk me through the report', 'act:report:' + l.id) }; }
      if (c.file === 'sell' || c.page === 'sell') return { text: 'Selling? Give me the model, year and km and I’ll show the range dealers are paying this week.', cta: 'Value my vehicle', button: B('Value my vehicle', 'flow:sell') };
      if (c.file === 'listings' || c.page === 'listings') return { text: 'Tell me a budget and how you ride. I’ll shortlist the inspected ones that fit.', cta: 'Shortlist for me', button: B('Find me a ride', 'flow:find') };
      return { text: 'Looking for a superbike or a car? One line is enough: “bike under 20 lakh, low km”.', cta: 'Try it', button: B('Find me a ride', 'flow:find') };
    },
    greeting: function (bot) {
      var c = bot.ctx || {}, l = byId(c.id), hi = 'Good ' + daypart() + '.';
      if (c.from === 'web') { bot.say('Revv pit crew, now on WhatsApp' + (c.name ? ', ' + first(c.name) : '') + '. Same answers here, and ride reminders land in this chat.', { buttons: MENU.slice(0, 4) }); return; }
      if (l) { var r = R(), d = r.dealer(l.dealer); bot.mem.lastId = l.id; try { bot.convo.dealer = l.dealer; } catch (e) {}
        bot.say(hi + ' Asking about the **' + title(l) + '**? It’s ' + reportLine(l) + ' ' + d.name + ' replies in about ' + (d.reply || '15 min') + '.', { buttons: [B('Book a test ride', 'act:ride:' + l.id), B('What did the inspection find?', 'act:report:' + l.id), B('EMI for this', 'act:emi:' + l.id), B('Similar for less', 'act:similar:' + l.id), B('Talk to ' + first(d.rep), 'intent:dealer')] }); return; }
      if (c.file === 'sell' || c.page === 'sell') { bot.say(hi + ' Selling? I can value it in three questions and book a free inspection at your place. Dealers bid within 48 hours.', { buttons: [B('Value my vehicle', 'flow:sell'), B('How does selling work?', 'say:how does selling work'), B('Something else', 'menu')] }); return; }
      if (c.file === 'dealer' || c.page === 'showroom' || c.file === 'showroom') { var dd = c.id && D() && D().dealers.filter(function (x) { return x.id === c.id; })[0]; if (dd) { bot.say(hi + ' You’re at **' + dd.name + '**, ' + dd.area + '. I can show what’s on their floor or book a ride.', { buttons: [B('What’s on the floor', 'act:floor:' + dd.id), B('Book a test ride', 'flow:ride'), B('Talk to ' + first(dd.rep), 'intent:dealer')] }); return; } }
      var sh = shop(); bot.say(hi + (sh ? ' ' + sh.name + ' here. Every ' + R().shopNoun(sh, 1) + ' on our floor passed a **150-point inspection**' : ' Revv pit crew here. Every vehicle on Revv passed a **150-point inspection**') + ', and the full report is public. Tell me what you’re after in one line, like “' + (sh && sh.deals === 'cars' ? 'SUV under 15 lakh, automatic' : 'bike under 20 lakh, low km') + '”.', { buttons: MENU });
    },
    extract: function (text) {
      var e = {}, b = budget(text), ty = typeFrom(text), bd = bodyFrom(text), ct = cityFrom(text), d = dayFrom(text), ph = N.phone(text), nm = N.name(text);
      if (b) { if (b.q === 'min') e.min = b.v; else e.max = b.v; } if (ty) e.type = ty; if (bd) e.body = bd; if (ct) e.city = ct; if (/low km|low kms|less km|kam chala|barely used|low mileage|under \d+ ?k ?km/i.test(text)) e.lowkm = '1';
      if (d) e.day = d; var tm = /\d|subah|shaam|morning|evening|afternoon/i.test(text) && /(am|pm|baje|o.?clock|subah|shaam|morning|evening|afternoon|:\d\d)/i.test(text) ? timeFrom(text) : null; if (tm) e.time = tm;
      if (ph) e.phone = ph; if (nm && /\b(i am|i'm|im|my name|this is|naam)\b/i.test(text)) e.name = nm;
      var y = String(text).match(/\b(20[0-2]\d|201\d)\b/); if (y) e.year = +y[1]; var km = String(text).match(/(\d+(?:[.,]\d+)?)\s*(k|thousand)?\s*(km|kms|kilometres|kilometers)\b/i); if (km) e.km = Math.round(parseFloat(km[1].replace(',', '')) * (km[2] ? 1000 : 1));
      return e;
    },
    intents: [
      { id: 'find', label: 'Find a vehicle', kw: ['find me', 'show me', 'looking for', 'want a bike', 'want a car', 'bike chahiye', 'car chahiye', 'suggest', 'recommend', 'which bike', 'which car', 'shortlist', 'options under'], re: [/\b(bike|bikes|car|cars|superbike|sedan|suv|naked|tourer)\b.*\b(under|below|budget|lakh|lac|\d+\s?l\b|low km|in mumbai|in pune)/i, /\b(under|below|budget)\b.*\b(lakh|lac|cr|\d+\s?l)\b/i], priority: 2,
        run: function (bot, m) { var e = m.ent; if (e.max || e.min || e.type || e.body || e.lowkm) { bot.slots = {}; bot.startFlow('find', { type: e.type || 'any', max: e.max || 0, min: e.min, body: e.body, city: e.city, lowkm: e.lowkm }); } else bot.startFlow('find', { body: e.body, city: e.city, lowkm: e.lowkm }); } },
      { id: 'ride', label: 'Test ride', kw: ['test ride', 'book a ride', 'book a test', 'see it in person', 'visit the showroom', 'come and see'], priority: 2,
        run: function (bot, m) { var l = ctxListing(bot); bot.startFlow('ride', { id: l ? l.id : undefined, day: m.ent.day, time: m.ent.time, name: m.ent.name || bot.user.name, phone: m.ent.phone || bot.user.phone }); } },
      { id: 'emi', label: 'EMI', kw: ['emi', 'loan', 'finance', 'monthly payment', 'down payment', 'interest rate'], priority: 1,
        run: function (bot) { var l = ctxListing(bot); bot.startFlow('emi', { price: l ? String(l.price) : undefined, id: l ? l.id : undefined }); } },
      { id: 'exchange', label: 'Exchange my vehicle', kw: ['exchange', 'exchange my', 'exchange it', 'exchange offer', 'exchange value', 'exchange mine', 'trade in', 'trade-in', 'part exchange', 'part-exchange', 'swap my', 'exchange karna', 'purani gaadi'], priority: 3,
        run: function (bot, m) { var tm = tableModel(m.text); bot.startFlow('exchange', { model: tm ? tm[1][0] : undefined, year: m.ent.year, km: m.ent.km, name: bot.user.name, phone: bot.user.phone }); } },
      { id: 'share', label: 'Share this', kw: ['share this', 'share it', 'send this', 'send it to', 'send to family', 'show my wife', 'show my husband', 'show my parents', 'show my family', 'whatsapp this', 'family ko', 'share link', 'share card', 'share karo'], priority: 2,
        run: function (bot) { var l = ctxListing(bot); if (!l) { bot.say('Open any listing and ask me there: I’ll make a one-screen page for your family and a picture card for WhatsApp.', { buttons: [B('Find me a ride', 'flow:find')] }); return; }
          bot.mem.lastId = l.id; bot.say('For the **' + title(l) + '** there’s a one-screen page your family can open on any phone: price, monthly figure, on-road cost and what the inspector found. “Send to family” under the price also makes a picture card and opens WhatsApp with the message ready; you choose the chat.', { buttons: [B('Open the family page', 'act:go:family.html?id=' + l.id), B('Make the share card', 'act:sharecard:' + l.id), B('Print a windscreen sheet', 'act:go:sticker.html?id=' + l.id)] }); } },
      { id: 'sell', label: 'Sell my vehicle', kw: ['sell my', 'sell my bike', 'sell my car', 'valuation', 'what is my bike worth', 'resale'], priority: 2,
        run: function (bot, m) { bot.startFlow('sell', { model: modelFrom(m.text), year: m.ent.year, km: m.ent.km, city: m.ent.city }); } },
      { id: 'report', label: 'Inspection report', kw: ['inspection', 'report', 'what did the inspection find', 'advisory', 'advisories', 'any issues', 'problems', 'accident', 'repainted', 'paint', 'tyres', 'tyre', 'brakes', 'service history', 'condition', 'kaisi hai'], priority: 1,
        run: function (bot, m) { var l = ctxListing(bot); if (!l) { bot.say('Which vehicle? Open any listing and I’ll read its report, or pick one here:', { cards: all().slice(0, 4).map(function (x) { return card(x, [B('Read its report', 'act:report:' + x.id)]); }) }); return; } answerReport(bot, l, m.norm); } },
      { id: 'price', label: 'Price', kw: ['how much', 'price', 'negotiable', 'discount', 'last price', 'cost'], priority: 0,
        run: function (bot) { var l = ctxListing(bot); if (!l) { bot.startFlow('find'); return; } var d = R().dealer(l.dealer); bot.say('The **' + title(l) + '** is listed at **' + inrFull(l.price) + '**' + (l.was ? ' (down from ' + inr(l.was) + ')' : '') + '. Prices on Revv are close to final: ' + d.name + ' can talk about accessories, insurance or a part-exchange, and the EMI starts around **' + inr(emi(l.price * 0.8, 10.5, 60)) + '/mo**.', { buttons: [B('Work out my EMI', 'act:emi:' + l.id), B('Talk to ' + first(d.rep), 'intent:dealer'), B('Book a test ride', 'act:ride:' + l.id)] }); } },
      { id: 'dealer', label: 'Talk to the dealer', kw: ['talk to the dealer', 'talk to a person', 'dealer', 'call me back', 'callback', 'speak to someone'], priority: 1,
        run: function (bot) { var l = ctxListing(bot), r = R(); if (l && r) { try { O.convos.setStatus(bot.id, bot.convo.status, { dealer: l.dealer }); bot.convo.dealer = l.dealer; } catch (e) {} } bot.handover(l ? 'Buyer asked for ' + (r ? r.dealer(l.dealer).name : 'the dealer') + ' about the ' + title(l) : 'Buyer asked for a person'); } },
      { id: 'thanks', label: 'Thanks', kw: ['thanks', 'thank you', 'shukriya', 'great', 'perfect', 'cool', 'ok thanks', 'that is all', 'bas'], run: function (bot) { bot.say('Anytime. Ride safe.', { buttons: [B('Something else', 'menu')] }); } },
      { id: 'hello', label: 'Hello', kw: ['hi', 'hello', 'hey', 'namaste', 'yo'], run: function (bot) { bot.menu('Hey. What are we looking for today?'); } }
    ],
    flows: {
      find: { intent: 'find', slots: [
        { name: 'type', ask: function (bot) { bot.say('Two wheels or four?', { buttons: [B('Superbikes and bikes', 'slot:type=bike'), B('Cars', 'slot:type=car'), B('Show me both', 'slot:type=any')] }); }, parse: function (t) { return typeFrom(t) || (/both|any|dono|either/i.test(t) ? 'any' : undefined); } },
        { name: 'max', ask: function (bot, s) { var b = s.type === 'car' ? [['Under ₹20 L', 2e6], ['Under ₹35 L', 3.5e6], ['Under ₹70 L', 7e6], ['No limit', 0]] : [['Under ₹8 L', 8e5], ['Under ₹15 L', 1.5e6], ['Under ₹25 L', 2.5e6], ['No limit', 0]]; bot.say('Budget? Type it any way: “18 lakh”, “under 25L”.', { buttons: b.map(function (x) { return B(x[0], 'slot:max=' + x[1]); }) }); }, coerce: function (v) { return +v; }, parse: function (t) { if (/no limit|any|koi bhi|doesn.?t matter/i.test(t)) return 0; var b = budget(t); return b ? b.v : undefined; } }
      ], done: function (bot, s) {
        var f = { type: s.type === 'any' ? null : s.type, max: +s.max || null, min: s.min, body: s.body, city: s.city, lowkm: s.lowkm }, L = search(f), wide = '';
        if (!L.length && f.body) { delete f.body; L = search(f); wide = 'Nothing in that exact style, so I widened it. '; }
        if (!L.length && f.city) { delete f.city; L = search(f); wide = 'Nothing in that city right now; these can be delivered. '; }
        if (!L.length && f.lowkm) { delete f.lowkm; L = search(f); wide = 'Nothing that low on the odometer, here are the closest. '; }
        if (!L.length && f.max) { var nx = search({ type: f.type }).filter(function (l) { return l.price > f.max; }).sort(function (a, b) { return a.price - b.price; }).slice(0, 2); bot.say('Nothing under ' + inr(f.max) + ' yet. The closest ' + (nx.length ? 'start at ' + inr(nx[0].price) + ':' : 'ones are just above that.'), { cards: nx.map(function (x) { return card(x); }), buttons: [B('Alert me when one lands', 'intent:dealer'), B('Different budget', 'flow:find')] }); return; }
        bot.mem.lastFind = f; if (L[0]) bot.mem.lastId = L[0].id;
        var lead = (f.type === 'bike' ? 'bike' : f.type === 'car' ? 'car' : 'ride') + (L.length > 1 ? 's' : '');
        bot.say(wide + L.length + ' inspected ' + lead + (f.max ? ' under **' + inr(f.max) + '**' : '') + (f.lowkm ? ', lowest km first' : ', best inspection score first') + ':', { cards: L.slice(0, 5).map(function (x) { return card(x); }), buttons: [B('Compare on the listings page', 'act:go:listings.html' + (f.type ? '?type=' + f.type : '')), B('Different budget', 'flow:find'), B('Work out an EMI', 'flow:emi')] });
      } },
      ride: { intent: 'ride', slots: [
        { name: 'id', ask: function (bot) { var L = all().filter(function (l) { return l.status === 'live'; }).slice(0, 4); bot.say('Which one would you like to ride? Pick below, or open any listing and ask me there.', { cards: L.map(function (x) { return card(x, [B('Ride this one', 'slot:id=' + x.id)]); }) }); }, parse: function (t) { var q = t.toLowerCase(), hit = all().filter(function (l) { return q.indexOf(l.model.toLowerCase().split(' ')[0]) > -1 || q.indexOf(l.make.toLowerCase()) > -1; })[0]; return hit && hit.id; } },
        { name: 'day', ask: function (bot, s) { var l = byId(s.id); bot.say('When suits you for the **' + l.make + ' ' + l.model + '**? Rides take 45 minutes; bring your licence.', { buttons: dayButtons(4) }); }, parse: function (t) { return dayFrom(t); }, validate: function (v) { var n = (new Date(v + 'T00:00') - new Date(iso(new Date()) + 'T00:00')) / DAY; if (n < 0) return 'That day has gone. Pick today or later.'; if (n > 14) return 'Rides can be booked up to two weeks ahead. Pick a closer day.'; } },
        { name: 'time', ask: function (bot, s) {
            var l = byId(s.id), tk = takenSlots(l), now = new Date(), free = TIMES.filter(function (tm) { var dt = new Date(s.day + 'T' + tm); return dt > now && tk.indexOf(s.day + ' ' + tm) < 0; });
            if (!free.length) { bot.slots.day = undefined; bot.say('That day is fully booked at the showroom. Another day?', { buttons: dayButtons(4) }); return; }
            bot.say('Open slots on **' + nice(s.day) + '** (booked ones are hidden):', { buttons: free.map(function (tm) { return B(tm, 'slot:time=' + tm); }) });
          }, parse: function (t) { var tm = timeFrom(t); return tm ? nearest(tm) : undefined; }, validate: function (v, bot, s) { var l = byId(s.id); if (takenSlots(l).indexOf(s.day + ' ' + v) > -1) return v + ' just went. Pick another time.'; if (new Date(s.day + 'T' + v) < new Date()) return 'That time has passed. Pick a later slot.'; } },
        { name: 'where', ask: function (bot, s) { var l = byId(s.id), d = R().dealer(l.dealer); bot.say('At the showroom in ' + d.area + ', or should ' + first(d.rep) + ' bring it to you?', { buttons: [B('At the showroom', 'slot:where=Showroom'), B(l.type === 'bike' ? 'Home ride' : 'Home test drive', 'slot:where=Home ride')] }); }, parse: function (t) { if (/home|ghar|my place|doorstep|bring/i.test(t)) return 'Home ride'; if (/showroom|store|dealer|come/i.test(t)) return 'Showroom'; } },
        { name: 'name', when: function (bot) { return !bot.user.name; }, ask: function (bot) { bot.say('Who should the dealer expect? First and last name.'); }, parse: function (t) { var n = N.name(t) || String(t).trim(); return n.length >= 2 && !/\d/.test(n) ? n.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }).slice(0, 40) : undefined; } },
        { name: 'phone', when: function (bot) { return !bot.user.phone; }, ask: function (bot, s) { bot.say('And a mobile number for ' + first(s.name || bot.user.name) + '? The dealer confirms on WhatsApp. It’s never shown publicly.'); }, parse: function (t) { return N.phone(t); }, validate: function (v) { var d = String(v).replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''); if (d.length !== 10 || !/^[6-9]/.test(d)) return 'That doesn’t look like an Indian mobile number. Ten digits, starting 6–9.'; } }
      ], done: function (bot, s) {
        var l = byId(s.id), r = R(), d = r.dealer(l.dealer), name = s.name || bot.user.name, phone = s.phone || bot.user.phone, slot = s.day + ' ' + s.time; bot.user.name = name; bot.user.phone = phone;
        toDealer(bot, l, { name: name, phone: phone, kind: 'test', slot: slot, where: s.where === 'Home ride' ? 'Home ride, ' + d.area : 'Showroom', intent: 'book_test_ride' });
        bot.event('booking', { kind: 'test_ride' });
        bot.say('Booked, ' + first(name) + '. ' + first(d.rep) + ' at ' + d.name + ' has it in the calendar and will confirm on WhatsApp.', { cards: [{ title: l.make + ' ' + l.model, sub: (dayWord(s.day)).replace(/^./, function (c) { return c.toUpperCase(); }) + ' · ' + s.time + ' · ' + (s.where === 'Home ride' ? 'at your place' : d.area), img: img(l), badge: 'Booked', meta: ['45 minutes, tank full, tyres warm', 'Bring your driving licence', 'Report: ' + l.score + '/150, on the listing', 'Free to reschedule'], buttons: [B('Work out the EMI', 'act:emi:' + l.id), B('Open the listing', 'act:go:vehicle.html?id=' + l.id)] }], buttons: [B('That’s all, thanks', 'say:thanks')] });
      } },
      emi: { intent: 'emi', slots: [
        { name: 'price', ask: function (bot) { bot.say('What’s the price of the vehicle? Or open a listing and ask me there.', { buttons: [B('₹8 L', 'slot:price=800000'), B('₹20 L', 'slot:price=2000000'), B('₹50 L', 'slot:price=5000000')] }); }, parse: function (t) { var b = budget(t); return b ? String(b.v) : undefined; } },
        { name: 'down', ask: function (bot, s) { bot.say('How much down? (on ' + inr(+s.price) + ')', { buttons: [B('10%', 'slot:down=10'), B('20%', 'slot:down=20'), B('30%', 'slot:down=30'), B('50%', 'slot:down=50')] }); }, coerce: function (v) { return +v; }, parse: function (t) { var p = String(t).match(/(\d{1,2})\s*%/); if (p) return +p[1]; var b = budget(t); return b ? Math.round(b.v / 1) : undefined; } },
        { name: 'months', ask: function (bot) { bot.say('Over how long?', { buttons: [B('2 years', 'slot:months=24'), B('3 years', 'slot:months=36'), B('4 years', 'slot:months=48'), B('5 years', 'slot:months=60')] }); }, coerce: function (v) { return +v; }, parse: function (t) { var y = String(t).match(/(\d)\s*(years?|yrs?|saal)/i); if (y) return +y[1] * 12; var m = String(t).match(/(\d{2})\s*(months?|mahine)/i); return m ? +m[1] : undefined; } }
      ], done: function (bot, s) {
        var price = +s.price, down = s.down > 100 ? s.down : price * s.down / 100, loan = Math.max(0, price - down), rows = [9.5, 10.5, 12].map(function (rt) { return [rt, emi(loan, rt, s.months)]; }), l = byId(s.id) || ctxListing(bot);
        bot.say('On **' + inr(price) + '** with **' + inr(down) + ' down** over **' + s.months + ' months**:', { cards: [{ title: inr(rows[1][1]) + ' / month', sub: 'At 10.5% · loan ' + inr(loan), badge: 'Most banks', meta: rows.map(function (r) { return r[0] + '%: ' + inr(r[1]) + '/mo · total interest ' + inr(r[1] * s.months - loan); }).concat(['Processing fee ~1%, paid to the bank']), buttons: l ? [B('Book a test ride', 'act:ride:' + l.id), B('Ask the dealer for a quote', 'intent:dealer')] : [B('Find something in budget', 'flow:find')] }] });
      } },
      sell: { intent: 'sell', slots: [
        { name: 'model', ask: function (bot) { bot.say('What are you selling? Make and model, like “Ishiro R6S” or “Aurex S4”.'); }, parse: function (t) { return modelFrom(t); } },
        { name: 'year', ask: function (bot) { bot.say('Which year was it registered?', { buttons: [2024, 2023, 2022, 2021, 2020, 2019].map(function (y) { return B(String(y), 'slot:year=' + y); }) }); }, coerce: function (v) { return +v; }, parse: function (t) { var y = String(t).match(/\b(20[0-2]\d|19\d\d)\b/); return y ? +y[1] : undefined; }, validate: function (v) { if (v > new Date().getFullYear() || v < 2005) return 'Revv buys vehicles from 2005 onwards. Which year?'; } },
        { name: 'km', ask: function (bot) { bot.say('Roughly how many km on the odometer?', { buttons: [B('Under 10,000', 'slot:km=7000'), B('10–25k', 'slot:km=18000'), B('25–50k', 'slot:km=38000'), B('50k+', 'slot:km=60000')] }); }, coerce: function (v) { return +v; }, parse: function (t) { var m = String(t).replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(k|thousand)?/i); return m ? Math.round(+m[1] * (m[2] ? 1000 : 1)) : undefined; } }
      ], done: function (bot, s) {
        var q = s.model.toLowerCase(), pool = (R() ? R().listings() : []), ref = pool.filter(function (l) { return q.indexOf(l.model.toLowerCase().split(' ')[0].toLowerCase()) > -1; }).sort(function (a, b) { return b.year - a.year; })[0] || pool.filter(function (l) { return q.indexOf(l.make.toLowerCase()) > -1; }).sort(function (a, b) { return b.year - a.year; })[0];
        var isBike = ref ? ref.type === 'bike' : typeFrom(q) !== 'car', base = ref ? ref.price * Math.pow(0.9, Math.max(0, ref.year - s.year)) : (isBike ? 650000 : 1500000) * Math.pow(0.88, Math.max(0, new Date().getFullYear() - s.year));
        var kmAdj = Math.max(0.82, 1 - Math.max(0, s.km - (isBike ? 8000 : 20000)) / (isBike ? 150000 : 400000)), mid = base * kmAdj * 0.86, lo = Math.round(mid * 0.95 / 5000) * 5000, hi = Math.round(mid * 1.04 / 5000) * 5000;
        bot.mem.val = { model: s.model, year: s.year, km: s.km, lo: lo, hi: hi };
        bot.say('A ' + s.year + ' **' + s.model + '** with ~' + Math.round(s.km).toLocaleString('en-IN') + ' km: dealers on Revv are paying **' + inr(lo) + '–' + inr(hi) + '** this week.' + (ref ? ' Based on ' + ref.year + ' ' + ref.make + ' ' + ref.model + ' sales, adjusted for age and km.' : ''), { cards: [{ title: inr(lo) + ' – ' + inr(hi), sub: s.year + ' ' + s.model + ' · ' + Math.round(s.km).toLocaleString('en-IN') + ' km', badge: 'Estimate', meta: ['Free 150-point inspection at your place', 'Bids from verified dealers within 48 h', 'Paid the same day you accept; RC handled'], buttons: [B('Book a free inspection', 'flow:inspect'), B('How does selling work?', 'say:how does selling work')] }] });
      } },
      exchange: { intent: 'exchange', slots: [
        { name: 'model', ask: function (bot) { var l = ctxListing(bot); bot.say('What are you trading in' + (l ? ' against the **' + title(l) + '**' : '') + '? Make and model, like “Arka Tez” or “Ashwa Rana 350”.'); }, parse: function (t) { var tm = tableModel(t); return tm ? tm[1][0] : modelFrom(t); } },
        { name: 'year', ask: function (bot) { var y = new Date().getFullYear(); bot.say('Which year was it registered?', { buttons: [y - 1, y - 3, y - 5, y - 7, y - 9].map(function (v) { return B(String(v), 'slot:year=' + v); }) }); }, coerce: function (v) { return +v; }, parse: function (t) { var y = String(t).match(/\b(20[0-2]\d|19\d\d)\b/); return y ? +y[1] : undefined; }, validate: function (v) { if (v > new Date().getFullYear() || v < new Date().getFullYear() - 20) return 'Dealers take vehicles up to 20 years old. Which year?'; } },
        { name: 'km', ask: function (bot) { bot.say('Roughly how many km?', { buttons: [B('Under 20,000', 'slot:km=12000'), B('20–50k', 'slot:km=35000'), B('50–90k', 'slot:km=70000'), B('90k+', 'slot:km=110000')] }); }, coerce: function (v) { return +v; }, parse: function (t) { var m = String(t).replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(k|thousand)?/i); return m ? Math.round(+m[1] * (m[2] ? 1000 : 1)) : undefined; } },
        { name: 'cond', ask: function (bot) { var d = D(); bot.say('Honestly, how is it? The inspection checks, so no need to round up.', { buttons: (d ? d.COND : []).map(function (c) { return B(c[1], 'slot:cond=' + c[0]); }) }); }, parse: function (t) { t = t.toLowerCase(); if (/showroom|mint|perfect|new/.test(t)) return 'showroom'; if (/good|fine|decent|theek/.test(t)) return 'good'; if (/fair|average|ok|wear/.test(t)) return 'fair'; if (/work|accident|bad|repair|kharab/.test(t)) return 'work'; } },
        { name: 'name', when: function (bot) { return !bot.user.name; }, ask: function (bot) { bot.say('Your name, for the dealer?'); }, parse: function (t) { var n = N.name(t) || String(t).trim(); return n.length >= 2 && !/\d/.test(n) ? n.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }).slice(0, 40) : undefined; } },
        { name: 'phone', when: function (bot) { return !bot.user.phone; }, ask: function (bot, s) { bot.say('And a mobile number for ' + first(s.name || bot.user.name) + '? The dealer calls to book the inspection. It’s never shown publicly.'); }, parse: function (t) { return N.phone(t); }, validate: function (v) { var d = String(v).replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''); if (d.length !== 10 || !/^[6-9]/.test(d)) return 'Ten digits, starting 6–9, please.'; } }
      ], done: function (bot, s) {
        var r = R(), tm = tableModel(s.model), name = s.name || bot.user.name, phone = s.phone || bot.user.phone, v; bot.user.name = name; bot.user.phone = phone;
        if (tm && r && r.valuate) v = r.valuate({ type: tm[0], model: tm[1], year: s.year, km: s.km, cond: s.cond });
        if (!v) { var age = Math.max(0, new Date().getFullYear() - s.year), mid = (typeFrom(s.model) === 'bike' ? 120000 : 700000) * Math.pow(0.88, age); v = { lo: Math.round(mid * 0.94 / 1000) * 1000, hi: Math.round(mid * 1.06 / 1000) * 1000 }; }
        bot.mem.xval = { modelName: tm ? tm[1][0] : s.model, year: s.year, km: s.km, condition: s.cond, low: v.lo, high: v.hi };
        var l = ctxListing(bot);
        if (l) { xon(bot, l.id); return; }
        var pool = all().filter(function (x) { return x.status === 'live' && x.price > v.lo * 1.2; }).sort(function (a, b) { return Math.abs(a.price - v.lo * 2.2) - Math.abs(b.price - v.lo * 2.2); }).slice(0, 4);
        bot.say('Your ' + s.year + ' **' + (tm ? tm[1][0] : s.model) + '** comes to **' + inr(v.lo) + '–' + inr(v.hi) + '** against anything on the floor. Pick one and I’ll put it on that price:', { cards: pool.map(function (x) { return card(x, [B('Put it against this', 'act:xon:' + x.id), B('Open the listing', 'act:go:vehicle.html?id=' + x.id)]); }) });
      } },
      inspect: { slots: [
        { name: 'city', ask: function (bot) { bot.say('Which city? An inspector comes to you.', { buttons: ['Mumbai', 'Pune', 'Bengaluru', 'Delhi', 'Chennai', 'Hyderabad'].map(function (c) { return B(c, 'slot:city=' + c); }) }); }, parse: function (t) { return cityFrom(t) || (String(t).trim().length > 2 ? String(t).trim().replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }) : undefined); } },
        { name: 'day', ask: function (bot) { bot.say('Which day works? Inspections take about an hour.', { buttons: dayButtons(4).filter(function (b) { return b.label !== 'Today'; }) }); }, parse: function (t) { return dayFrom(t); } },
        { name: 'name', when: function (bot) { return !bot.user.name; }, ask: function (bot) { bot.say('Your name, for the inspector?'); }, parse: function (t) { var n = N.name(t) || String(t).trim(); return n.length >= 2 && !/\d/.test(n) ? n.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }).slice(0, 40) : undefined; } },
        { name: 'phone', when: function (bot) { return !bot.user.phone; }, ask: function (bot) { bot.say('And a mobile number? The inspector calls before arriving.'); }, parse: function (t) { return N.phone(t); }, validate: function (v) { var d = String(v).replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''); if (d.length !== 10 || !/^[6-9]/.test(d)) return 'Ten digits, starting 6–9, please.'; } }
      ], done: function (bot, s) {
        var v = bot.mem.val || {}, name = s.name || bot.user.name, phone = s.phone || bot.user.phone, r = R(); bot.user.name = name; bot.user.phone = phone;
        if (r) { var all2 = r.get(r.K.sellers, []); all2.unshift({ id: 'S-' + Date.now().toString(36).slice(-4).toUpperCase(), name: name, phone: mask(phone), model: v.model || 'Vehicle', year: v.year || new Date().getFullYear() - 3, km: v.km || 15000, city: s.city, area: s.city, day: new Date(s.day + 'T00:00').getTime(), win: '11:00–13:00', lo: v.lo || 0, hi: v.hi || 0, status: 'booked', src: 'Chat', convo: bot.id }); r.set(r.K.sellers, all2); }
        bot.lead({ name: name, phone: phone, intent: 'sell_inspection', payload: { model: v.model, year: v.year, km: v.km, city: s.city, day: s.day, range: [v.lo, v.hi] } });
        bot.say('Inspection booked for **' + dayWord(s.day) + ', 11:00–13:00** in ' + s.city + '. You’ll get the inspector’s name on WhatsApp the evening before. No obligation to sell.', { buttons: [B('What happens after?', 'say:how does selling work'), B('That’s all, thanks', 'say:thanks')] });
      } }
    },
    actions: {
      ride: function (bot, id) { bot.mem.lastId = id; bot.startFlow('ride', { id: id, name: bot.user.name, phone: bot.user.phone }); },
      emi: function (bot, id) { var l = byId(id); if (!l) return; bot.mem.lastId = id; bot.startFlow('emi', { price: String(l.price), id: id }); },
      report: function (bot, id) { var l = byId(id); if (l) { bot.mem.lastId = id; answerReport(bot, l, ''); } },
      similar: function (bot, id) { var l = byId(id); if (!l) return; var L = all().filter(function (x) { return x.id !== l.id && x.type === l.type && x.price < l.price; }).sort(function (a, b) { return b.price - a.price; }).slice(0, 4); bot.say(L.length ? 'Same kind of ride, for less:' : 'This is already the most affordable of its kind on Revv right now.', { cards: L.map(function (x) { return card(x); }) }); },
      floor: function (bot, id) { var L = all().filter(function (l) { return l.dealer === id; }); bot.say(L.length + ' on the floor right now:', { cards: L.map(function (x) { return card(x); }) }); },
      go: function (bot, url) { go(bot, url); },
      xon: function (bot, id) { xon(bot, id); },
      sharecard: function (bot, id) {
        var b = document.querySelector('#share-slot[data-id="' + id + '"] [data-sh]');
        if (b) { if (b.getAttribute('aria-expanded') !== 'true') b.click(); setTimeout(function () { b.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60); bot.say('Done: it’s open under the price. Download the card, or send it on WhatsApp with the message ready.'); return; }
        go(bot, 'vehicle.html?id=' + id + '#share', 'Opening the listing with the card ready…');
      }
    },
    freeText: function (bot, m) { var e = m.ent; if (e.max || e.min || (e.type && /\b(under|below|budget|show|find|want|chahiye)\b/i.test(m.text))) { bot.startFlow('find', { type: e.type || 'any', max: e.max || 0, min: e.min, body: e.body, city: e.city, lowkm: e.lowkm }); return true; } },
    kb: [
      { id: 'inspect', q: 'What is the 150-point inspection?', a: 'An independent inspector checks **150 points** across 8 groups: engine and transmission, brakes, suspension, tyres, electricals, body and paint (with a thickness gauge), cabin, and documents. The full report is on every listing, advisories included.', keys: ['150 point', '150-point', 'what is inspection', 'how do you inspect', 'certified', 'inspection kya hai'] },
      { id: 'return', q: 'Can I return it?', a: 'Yes. Every Revv vehicle has a **7-day return window** from delivery: under 300 km and no new damage, and you get the full price back.', keys: ['return', 'refund', 'money back', 'return policy', 'wapas', 'change my mind'] },
      { id: 'rc', q: 'Who handles the RC transfer?', a: 'The dealer does. RC transfer usually completes in **2–4 weeks** depending on the RTO; you get the new RC by courier and status updates on WhatsApp.', keys: ['rc transfer', 'registration transfer', 'rto', 'ownership transfer', 'noc', 'papers'] },
      { id: 'warranty', q: 'Is there a warranty?', a: 'Vehicles still under factory warranty keep it (it moves with the vehicle). Every other Revv vehicle gets a **6-month engine and gearbox warranty** from the dealer.', keys: ['warranty', 'guarantee', 'extended warranty', 'engine warranty'] },
      { id: 'banks', q: 'Which banks finance?', a: 'Dealers work with the major banks and NBFCs. Rates on pre-owned vehicles usually run **9.5–12.5%**, up to 5 years, with 10–20% down. I can work out the EMI for any listing.', keys: ['which bank', 'bank loan', 'finance options', 'loan approval', 'credit score', 'cibil'], buttons: [B('Work out an EMI', 'flow:emi')] },
      { id: 'licence', q: 'What do I need for a test ride?', a: 'A valid driving licence for the vehicle class (motorcycle or car), and a helmet for bikes (the dealer has spares). Riders under 21 can test ride bikes up to 650cc.', keys: ['what do i need', 'licence', 'license', 'helmet', 'documents for test ride', 'age for test ride'] },
      { id: 'home', q: 'Do you do home test rides?', a: 'Most dealers bring the vehicle to you within their city at no charge. Pick “Home ride” when you book.', keys: ['home test ride', 'home test drive', 'at my place', 'doorstep', 'ghar pe'], buttons: [B('Book a test ride', 'flow:ride')] },
      { id: 'exchange', q: 'Do you take part-exchange?', a: 'Yes, on any listing. Tell me what you have and I’ll put a range on it in four questions; on a listing page, the price then shows what you pay after it. The dealer confirms the figure at inspection.', keys: ['do you take exchange', 'exchange policy', 'my old bike', 'my old car', 'purana'], buttons: [B('Exchange my vehicle', 'flow:exchange')] },
      { id: 'reserve', q: 'Can I reserve a vehicle?', a: 'Tell the dealer and they’ll mark it **Reserved** for 48 hours while your finance is approved. No money changes hands in this chat.', keys: ['reserve', 'hold it', 'book it', 'token amount', 'booking amount', 'advance'] },
      { id: 'pay', q: 'How do I pay?', a: 'You pay the dealer directly, by bank transfer or through your loan, after the test ride and paperwork. Revv never asks for card numbers or OTPs in chat.', keys: ['how to pay', 'payment', 'upi', 'card', 'cash', 'pay online'] },
      { id: 'deliver', q: 'Can you deliver to another city?', a: 'Yes. Dealers ship by enclosed carrier: usually **₹6,000–15,000** for bikes and **₹15,000–35,000** for cars, 3–7 days, insured in transit.', keys: ['deliver', 'delivery', 'ship', 'another city', 'outstation', 'transport'] },
      { id: 'insurance', q: 'What about insurance?', a: 'Existing insurance transfers with the vehicle (the dealer files it with the RC). You can switch insurer at renewal; the no-claim bonus stays with you, not the vehicle.', keys: ['insurance', 'insurance transfer', 'ncb', 'no claim bonus', 'zero dep'] },
      { id: 'service', q: 'Is there a service history?', a: 'Every listing shows the service log the inspector verified: dates, km and the workshop. Gaps are called out in the report, not hidden.', keys: ['service history', 'service record', 'serviced', 'maintenance', 'service book'] },
      { id: 'odo', q: 'How do you check the km is real?', a: 'The inspector cross-checks the odometer against service records, the ECU log where available, and wear on pedals, grips and seats. A mismatch fails the inspection.', keys: ['km real', 'odometer tampering', 'meter tampered', 'genuine km', 'km fake'] },
      { id: 'accident', q: 'Has it been in an accident?', a: 'Structural damage fails the inspection, so it never lists. Cosmetic repairs are shown with the paint-thickness readings in the report. Ask me on any listing and I’ll read it out.', keys: ['accident', 'crash', 'damage', 'flood', 'repainted', 'accidental'] },
      { id: 'ev', q: 'How do you check an EV battery?', a: 'EVs get a battery health test (state of health %), a charge-rate test and a check of the charge port and cable. The SoH is printed on the listing.', keys: ['battery health', 'ev battery', 'electric battery', 'soh', 'range real'] },
      { id: 'negotiate', q: 'Is the price negotiable?', a: 'Prices are set close to the market from the inspection, so there’s little room. Dealers often add value instead: accessories, insurance or a better part-exchange.', keys: ['negotiable', 'negotiate', 'discount', 'kam karo', 'best price', 'last price'] },
      { id: 'sellhow', q: 'How does selling work?', a: '1) Instant valuation here. 2) A free inspection at your place. 3) Verified dealers bid within **48 hours**. 4) Accept the best bid, get paid the same day, and the dealer handles the RC.', keys: ['how does selling work', 'selling process', 'sell process', 'how to sell'], buttons: [B('Value my vehicle', 'flow:sell')] },
      { id: 'hours', q: 'When are showrooms open?', a: 'Most Revv dealers are open **10:30–20:00 Monday to Saturday**; Sunday is usually test rides only. Each dealer’s hours are on their showroom page.', keys: ['opening hours', 'timings', 'open sunday', 'kab khulta', 'showroom timing'] },
      { id: 'dealers', q: 'Are the dealers verified?', a: 'Every dealer passes KYC (GST, trade licence, showroom visit, bank proof) before listing, and their reply time and reviews are public on their showroom page.', keys: ['verified dealer', 'trust', 'genuine dealer', 'scam', 'fraud', 'kyc'] }
    ]
  });

  function answerReport(bot, l, q) {
    var rp = report(l); if (!rp) return; q = String(q || '').toLowerCase();
    var adv = rp.advisories, pick = function (k) { return adv.filter(function (a) { return a[0].toLowerCase().indexOf(k) > -1; })[0]; };
    if (/tyre|tire/.test(q)) { var t = pick('tyre'); bot.say(t ? 'Tyres: **' + t[1] + '**. Everything else on the wheels passed.' : 'Tyres and wheels passed every check, no advisory.', { buttons: [B('Book a test ride', 'act:ride:' + l.id)] }); return; }
    if (/brake/.test(q)) { var b = pick('brake'); bot.say(b ? 'Brakes: **' + b[1] + '**.' : 'Brakes passed every check.'); return; }
    if (/paint|repaint|accident|crash|body/.test(q)) { var p = pick('paint'); bot.say('Paint thickness averaged **' + rp.paint + ' µm** across the panels' + (rp.paint > 160 ? ', which points to a repaint somewhere' : ', which is factory') + '. ' + (p ? 'Noted: ' + p[1].toLowerCase() + '.' : 'No structural repairs; structural damage would have failed the inspection.')); return; }
    bot.say('The **' + title(l) + '** scored **' + l.score + '/150**, inspected by ' + rp.inspector + ' on ' + rp.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + '. ' + (adv.length ? 'What the inspector flagged:' : 'Nothing flagged.'), { cards: [{ title: l.score + '/150', sub: '8 groups · ' + rp.ok + ' checks passed', badge: adv.length + ' advisor' + (adv.length === 1 ? 'y' : 'ies'), meta: adv.slice(0, 4).map(function (a) { return a[0] + ': ' + a[1]; }).concat(['Paint average ' + rp.paint + ' µm']), buttons: [B('Open the full report', 'act:go:vehicle.html?id=' + l.id + '#report'), B('Book a test ride', 'act:ride:' + l.id)] }] });
  }
})();
