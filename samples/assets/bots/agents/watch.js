/* Ghatika concierge: the scripted assistant for the Ghatika watch maison (samples/watch). Rule-based, no LLM, no network calls.
   It reads the catalogue and boutiques from window.GH_DATA (watch/data.js) and the maison's records from window.GH (watch/app.js),
   and writes into the Ghatika back office: viewings land in 'appts', call-back enquiries in 'enquiries', service requests in
   'service', all with source 'chat' and the Orbit conversation id for the transcript. Loaded lazily by watch/concierge.js. */
(function () {
  'use strict';
  var O = window.Orbit; if (!O || O.agents.watch) return;
  var N = O.nlp, DAY = 864e5;
  var B = function (l, v) { return { label: l, value: v }; };
  function D() { return window.GH_DATA || null; }
  function G() { return window.GH || null; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  var DN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function nice(s) { var d = new Date(s + 'T00:00'); return DN[d.getDay()] + ' ' + d.getDate() + ' ' + MN[d.getMonth()]; }
  function first(n) { return String(n || '').split(' ')[0]; }
  function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  function lakh(n) { return O.money(n, '₹'); }
  function mask(p) { var d = String(p || '').replace(/\D/g, '').slice(-10); return d.length === 10 ? '+91 ' + d.slice(0, 2) + '••• ••' + d.slice(-3) : ''; }
  function daypart() { var h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; }
  var CLOSED = { udaipur: [1], mumbai: [0], delhi: [1], bengaluru: [0] };
  var NICK = { prahar: 'hand-wound, small seconds', nimisha: 'automatic, tithi moon', yantra: 'automatic GMT' };
  var L2L = { prahar: 47, nimisha: 44, yantra: 49 };

  /* ---------- catalogue ---------- */
  function M(id) { var d = D(); return d && d.MODELS[id]; }
  function opt(list, id) { var d = D(); return d ? d[list].filter(function (x) { return x.id === id; })[0] : null; }
  function price(cfg) { var d = D(); return d ? d.price(cfg) : 0; }
  function cfgUrl(c) { return 'watch.html?m=' + c.model + '&dial=' + c.dial + '&metal=' + c.metal + '&strap=' + c.strap; }
  function card(c, why, btns) {
    var m = M(c.model);
    return { title: m.name, sub: opt('DIALS', c.dial).name + ' · ' + opt('METALS', c.metal).name + ' · ' + opt('STRAPS', c.strap).name, img: O.samples('watch/img/' + c.model + '.webp'), badge: m.ref, price: inr(price(c)), priceLabel: 'incl. GST',
      meta: [why || NICK[c.model], m.specs[0][1].split(' · ')[0] + ' · lug to lug ' + L2L[c.model] + ' mm', 'No-cost EMI ' + inr(Math.ceil(price(c) / 12)) + ' a month'],
      buttons: btns || [B('Open it in the configurator', 'act:go:' + cfgUrl(c)), B('See it in a boutique', 'act:book:' + c.model), B('Have the atelier call me', 'act:callback:' + c.model + '|' + c.dial + '|' + c.metal + '|' + c.strap)] };
  }
  // the heart of it: a size, an occasion and a budget become two or three watches, each already configured
  function recommend(s) {
    var wrist = +s.wrist || 16.5, budget = +s.budget || 0, occ = s.occasion || 'everyday', out = [];
    var size = wrist < 15.6 ? ['nimisha', 'prahar', 'yantra'] : wrist > 17.6 ? ['yantra', 'prahar', 'nimisha'] : ['prahar', 'nimisha', 'yantra'];
    var byOcc = { everyday: ['prahar', 'yantra', 'nimisha'], dress: ['prahar', 'nimisha', 'yantra'], travel: ['yantra', 'prahar', 'nimisha'], gift: ['nimisha', 'prahar', 'yantra'], wedding: ['nimisha', 'prahar', 'yantra'], milestone: ['prahar', 'nimisha', 'yantra'] }[occ] || ['prahar', 'nimisha', 'yantra'];
    var order = ['prahar', 'nimisha', 'yantra'].map(function (k) { var fitPenalty = Math.max(0, size.indexOf(k) - (wrist >= 15.6 && wrist <= 17.6 ? 1 : 0)) * 1.4; return [k, fitPenalty + byOcc.indexOf(k)]; }).sort(function (a, b) { return a[1] - b[1]; }).map(function (x) { return x[0]; });
    var metals = occ === 'wedding' || occ === 'milestone' ? ['rose', 'yellow', 'steel'] : occ === 'travel' ? ['titanium', 'steel'] : ['steel', 'rose', 'titanium', 'yellow'];
    order.forEach(function (k) {
      var m = M(k), best = null;
      metals.forEach(function (mt) {
        var strap = occ === 'travel' && (mt === 'steel' || mt === 'titanium') ? 'bracelet' : occ === 'dress' || occ === 'wedding' ? 'ink' : m.sig.strap === 'bracelet' && (mt === 'rose' || mt === 'yellow') ? 'cognac' : m.sig.strap;
        var c = { model: k, dial: occ === 'wedding' ? 'ivory' : occ === 'gift' && k === 'nimisha' ? 'pichola' : m.sig.dial, metal: mt, strap: strap };
        if (!best && (!budget || price(c) <= budget)) best = c;
      });
      if (best) out.push(best);
    });
    return { list: out.slice(0, 3), wrist: wrist, budget: budget, occ: occ };
  }
  function why(c, r) {
    var w = r.wrist, width = Math.round(2 * (w * 10) / (Math.PI * (3 * 1.73 - Math.sqrt(3.73 * 3.19)))), ratio = L2L[c.model] / width;
    var fit = ratio < 0.8 ? 'sits well inside a ' + w + ' cm wrist' : ratio < 0.9 ? 'a confident fit on a ' + w + ' cm wrist' : 'reaches the edge of a ' + w + ' cm wrist';
    var O2 = { everyday: { prahar: 'wound each morning, worn all day', nimisha: 'a quiet moon for every day', yantra: 'built for 100 m and every day' },
      dress: { prahar: '9.8 mm: slips under a cuff', nimisha: 'small enough for the slimmest cuff', yantra: 'a dress watch that also travels' },
      travel: { prahar: 'one time zone, wound by hand', nimisha: 'the moon travels with you', yantra: 'keeps home time on the 24-hour hand' },
      gift: { prahar: 'a watch to wind every morning', nimisha: 'a moon that marks the evenings that matter', yantra: 'for someone who lives between two cities' },
      wedding: { prahar: 'engraved with the date, worn for decades', nimisha: 'ivory and gold, and the moon of the day', yantra: 'gold and a second time zone for family abroad' },
      milestone: { prahar: 'numbered, signed inside, yours for life', nimisha: 'the moon on the night it happened', yantra: 'for the years of travel ahead' } };
    var occ = (O2[r.occ] || O2.everyday)[c.model] || '';
    return fit + '; ' + occ;
  }

  /* ---------- records ---------- */
  function slotsTaken(b, day) { var g = G(); if (!g) return []; return g.db('appts').filter(function (a) { var d = new Date(a.at); return a.boutique === b && iso(d) === day && a.status !== 'cancelled'; }).map(function (a) { var d = new Date(a.at); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }); }
  function freeTimes(b, day) { var d = D(), now = new Date(), tk = slotsTaken(b, day); return (d ? d.SLOTS : []).filter(function (t) { return new Date(day + 'T' + t) > new Date(now.getTime() + 3600e3) && tk.indexOf(t) < 0; }); }
  function dayButtons(b, n) { var out = [], now = new Date(); for (var i = 0; out.length < (n || 4) && i < 14; i++) { var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i); if ((CLOSED[b] || []).indexOf(d.getDay()) > -1) continue; if (!freeTimes(b, iso(d)).length) continue; out.push(B(i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : nice(iso(d)), 'slot:day=' + iso(d))); } return out; }
  function dayFrom(t) { var w = N.when(String(t).replace(/\bkal\b/i, 'tomorrow').replace(/\baaj\b/i, 'today').replace(/\bparso\b/i, 'day after tomorrow')); return w && w.iso; }
  function timeFrom(t) { var w = N.when(t), tm = w && w.time; if (!tm) { var m = String(t).match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|baje)?\b/i); if (m && +m[1] <= 23) { var h = +m[1]; if ((m[3] || '').toLowerCase() === 'pm' && h < 12) h += 12; if (!m[3] && h < 9) h += 12; tm = pad(h) + ':' + (m[2] || '00'); } } if (!tm && /subah|morning/i.test(t)) tm = '11:00'; if (!tm && /shaam|evening/i.test(t)) tm = '18:00'; if (!tm && /afternoon|dopahar/i.test(t)) tm = '15:00'; return tm; }
  function nearest(tm, list) { var best = list[0], bd = 1e9; list.forEach(function (x) { var d = Math.abs((+x.slice(0, 2) * 60 + +x.slice(3)) - (+tm.slice(0, 2) * 60 + +tm.slice(3))); if (d < bd) { bd = d; best = x; } }); return best; }
  function boutiqueFrom(t) { t = String(t).toLowerCase(); if (/udaipur|atelier|lal ghat|pichola/.test(t)) return 'udaipur'; if (/mumbai|bombay|kala ghoda|fort/.test(t)) return 'mumbai'; if (/delhi|mehrauli|ncr|gurgaon|gurugram|noida/.test(t)) return 'delhi'; if (/bengaluru|bangalore|lavelle/.test(t)) return 'bengaluru'; }
  function modelFrom(t) { t = String(t).toLowerCase(); if (/prahar|hand.?wound|small seconds/.test(t)) return 'prahar'; if (/nimisha|moon|tithi|purnima/.test(t)) return 'nimisha'; if (/yantra|gmt|two time|dual time|travel/.test(t)) return 'yantra'; }
  function wristFrom(t) { var m = String(t).match(/(\d{2}(?:\.\d)?)\s*(cm|centimet)/i); if (m) return +m[1]; m = String(t).match(/(\d(?:\.\d)?)\s*(inch|in\b|")/i); if (m) return Math.round(+m[1] * 25.4) / 10; m = String(t).match(/\b(1[3-9](?:\.\d)?|2[01](?:\.\d)?)\b/); if (m && /wrist|kalai|size/i.test(t)) return +m[1]; if (/small|slim|patli|thin/i.test(t)) return 15; if (/large|big|broad|thick|mota/i.test(t)) return 18.5; }
  function budgetFrom(t) {
    t = String(t).toLowerCase().replace(/,/g, ''); var m = t.match(/(\d+(?:\.\d+)?)\s*(l|lakh|lakhs|lac|lacs)\b/); if (m) return +m[1] * 1e5;
    m = t.match(/(\d+(?:\.\d+)?)\s*(cr|crore)\b/); if (m) return +m[1] * 1e7; var mo = N.money(t); if (mo && (mo.max || mo.min) > 50000) return mo.max || mo.min;
    if (/no budget|any budget|doesn.?t matter|koi bhi|open/.test(t)) return 0;
  }
  function occasionFrom(t) { t = String(t).toLowerCase(); if (/wedding|shaadi|shadi|marriage|groom|bride|vivah/.test(t)) return 'wedding'; if (/gift|present|tohfa|for my (wife|husband|father|dad|mother|son|daughter|partner)|anniversary|birthday/.test(t)) return 'gift'; if (/travel|fly|flying|abroad|time zone|timezone|gmt|business trips/.test(t)) return 'travel'; if (/dress|suit|formal|office|meetings|cuff/.test(t)) return 'dress'; if (/promotion|milestone|retire|graduat|first watch|celebrat/.test(t)) return 'milestone'; if (/every ?day|daily|roz|all day|casual/.test(t)) return 'everyday'; }
  function idFrom(t) { var s = String(t).toUpperCase().replace(/\s+/g, ''), m = s.match(/GH-?([SOAW])-?(\d{3,5})/); if (m) return 'GH-' + m[1] + '-' + m[2]; m = s.match(/GH0?([123])-?(\d{4})/); if (m) return 'GH0' + m[1] + '-' + m[2]; }
  function go(bot, url, line) { bot.say(line || 'Opening it for you…', { delay: 250 }); try { sessionStorage.setItem('cg-reopen-watch', '1'); } catch (e) {} setTimeout(function () { location.href = O.samples('watch/' + url); }, 900); }
  function note(bot, extra) { try { O.convos.setStatus(bot.id, bot.convo.status, extra); } catch (e) {} }

  var MENU = [B('Find my watch', 'flow:find'), B('Book a private viewing', 'flow:book'), B('Service or warranty status', 'flow:status'), B('Talk to a watchmaker', 'intent:human')];

  O.registerAgent({
    id: 'watch', name: 'The Ghatika concierge', business: 'Ghatika', role: 'Watch advice, viewings, service and warranty', industry: 'Luxury watches', initials: 'GH', accent: '#c9ad7c', phoneLabel: 'Ghatika client line',
    blurb: 'Ghatika’s concierge in chat: recommends a watch from your wrist size, the occasion and a budget, opens it ready-configured, books an hour at a boutique, finds any service ticket, order or warranty, and hands over to a watchmaker.',
    helloLine: 'I can find your watch, book a viewing, or look up a service or warranty.',
    samples: ['16 cm wrist, a gift, under 5 lakh', 'kitne ka hai', 'viewing in Mumbai kal shaam', 'status of GH-S-880'],
    kind: 'customer', menu: MENU,
    contexts: [{ label: 'Home', context: { page: 'index' } }, { label: 'Configuring the Prahar', context: { page: 'watch', file: 'watch', m: 'prahar' } }, { label: 'Boutiques', context: { page: 'boutiques' } }, { label: 'Service', context: { page: 'service' } }],
    synonyms: {
      'how much': ['kitne ka hai', 'kitne ki hai', 'kitna hai', 'kitne mein', 'price kya hai', 'cost kya hai', 'daam'],
      'watch': ['ghadi', 'ghari', 'timepiece'], 'wrist': ['kalai'], 'tomorrow': ['kal'], 'morning': ['subah'], 'evening': ['shaam', 'sham'],
      'book a viewing': ['visit the boutique', 'see it in person', 'try it on', 'try on', 'appointment', 'come to the store', 'dekhna hai', 'boutique visit', 'book an appointment', 'private viewing'],
      'talk to a watchmaker': ['real person', 'human', 'talk to someone', 'call me', 'speak to someone', 'baat karni hai', 'watchmaker se baat'],
      'emi': ['monthly', 'installment', 'instalment', 'kisht', 'finance']
    },
    seeds: {},
    nudge: function (c) {
      var m = c.m && M(c.m);
      if (m && (c.file === 'watch' || c.page === 'watch')) return { text: 'Not sure the ' + m.name + ' suits your wrist? Tell me your wrist size and I’ll say how it sits.', cta: 'Check the fit', button: B('Check the fit', 'flow:find') };
      if (c.file === 'collection' || c.page === 'collection') return { text: 'Three watches, and only one is right for you. A size, an occasion and a budget is all I need.', cta: 'Help me choose', button: B('Find my watch', 'flow:find') };
      return { text: 'Choosing a watch, or a gift? Tell me the wrist size and the occasion; I’ll show you two or three, already configured.', cta: 'Help me choose', button: B('Find my watch', 'flow:find') };
    },
    greeting: function (bot) {
      var c = bot.ctx || {}, hi = 'Good ' + daypart() + '.', m = c.m && M(c.m);
      if (c.from === 'web') { bot.say('The Ghatika concierge, now on WhatsApp' + (c.name ? ', ' + first(c.name) : '') + '. Viewing reminders and service updates arrive in this chat.', { buttons: MENU.slice(0, 3) }); return; }
      if (m && (c.file === 'watch' || c.page === 'watch')) { bot.mem.model = c.m;
        bot.say(hi + ' Considering the **' + m.name + '**? It is ' + NICK[c.m] + ', ' + m.specs[0][1].split(' · ')[0] + ', from ' + lakh(m.price) + '. I can tell you how it sits on your wrist, book you an hour with it, or work out the EMI.', { buttons: [B('How will it fit me?', 'flow:find'), B('See it in a boutique', 'act:book:' + c.m), B('No-cost EMI', 'intent:emi'), B('Something else', 'menu')] }); return; }
      if (c.file === 'boutiques' || c.page === 'boutiques') { bot.say(hi + ' An hour at the boutique is the best way to choose. Which city suits you?', { buttons: [B('Udaipur atelier', 'act:book:city=udaipur'), B('Mumbai', 'act:book:city=mumbai'), B('New Delhi', 'act:book:city=delhi'), B('Bengaluru', 'act:book:city=bengaluru')] }); return; }
      if (c.file === 'service' || c.file === 'warranty' || c.page === 'service') { bot.say(hi + ' I can find a service ticket, an order or a warranty in a moment. Share the number, like **GH-S-880** or a serial such as **GH01-0128**.', { buttons: [B('Find my ticket', 'flow:status'), B('Book a service drop-off', 'act:book:purpose=service'), B('Talk to a watchmaker', 'intent:human')] }); return; }
      if (c.file === 'checkout') { bot.say(hi + ' Any question before you place your order? Delivery is insured and complimentary, and engraving is free.', { buttons: [B('When will it arrive?', 'say:delivery time'), B('Can I return it?', 'say:return policy'), B('No-cost EMI', 'intent:emi')] }); return; }
      bot.say(hi + ' Welcome to Ghatika. Tell me your **wrist size**, the **occasion** and a **budget**, and I’ll show you two or three watches, already configured. Or ask me anything about winding, service and warranties.', { buttons: MENU });
    },
    extract: function (text) {
      var e = {}, w = wristFrom(text), b = budgetFrom(text), o = occasionFrom(text), m = modelFrom(text), bq = boutiqueFrom(text), d = dayFrom(text), ph = N.phone(text), em = N.email && N.email(text), nm = N.name(text), id = idFrom(text);
      if (w) e.wrist = w; if (b != null) e.budget = b; if (o) e.occasion = o; if (m) e.model = m; if (bq) e.boutique = bq; if (d) e.day = d; if (id) e.ref = id;
      var tm = /(am|pm|baje|o.?clock|subah|shaam|morning|evening|afternoon|:\d\d)/i.test(text) ? timeFrom(text) : null; if (tm) e.time = tm;
      if (ph) e.phone = ph; if (em) e.email = em; if (nm && /\b(i am|i'm|im|my name|this is|naam)\b/i.test(text)) e.name = nm;
      return e;
    },
    intents: [
      { id: 'find', label: 'Find my watch', kw: ['find my watch', 'recommend', 'suggest', 'which watch', 'which one', 'help me choose', 'looking for a watch', 'gift', 'my wrist', 'wrist size', 'will it fit', 'fit me', 'for my wife', 'for my husband', 'for my father', 'wedding watch', 'first watch', 'under'], re: [/\b\d{2}(\.\d)?\s*cm\b/i, /\b(lakh|lac)\b/i],
        run: function (bot, m) { var e = m.ent; bot.startFlow('find', { wrist: e.wrist, occasion: e.occasion, budget: e.budget != null ? String(e.budget) : undefined }); } },
      { id: 'book', label: 'Book a viewing', kw: ['book a viewing', 'viewing', 'boutique', 'appointment', 'visit'], priority: 2,
        run: function (bot, m) { var e = m.ent; bot.startFlow('book', { boutique: e.boutique, model: e.model || bot.mem.model, day: e.day, time: e.time, name: e.name || bot.user.name, contact: e.phone || e.email || bot.user.phone }); } },
      { id: 'status', label: 'Status lookup', kw: ['status', 'where is my watch', 'my service', 'my order', 'track', 'ticket', 'warranty', 'serial', 'repair'], re: [/GH-?[SOW]-?\d{3,5}/i, /GH0[123]-?\d{4}/i], priority: 2,
        run: function (bot, m) { if (m.ent.ref) { answerStatus(bot, m.ent.ref); return; } bot.startFlow('status'); } },
      { id: 'price', label: 'Price', kw: ['how much', 'price', 'cost', 'expensive', 'discount'], priority: 1,
        run: function (bot, m) { var id = m.ent.model || bot.mem.model || (bot.ctx && bot.ctx.m); if (!id) { var d = D(); bot.say('Prahar is from **' + lakh(d.MODELS.prahar.price) + '**, Nimisha from **' + lakh(d.MODELS.nimisha.price) + '** and Yantra from **' + lakh(d.MODELS.yantra.price) + '**, in steel on calf, GST included. Gold adds about ₹4 L.', { buttons: [B('Find my watch', 'flow:find'), B('No-cost EMI', 'intent:emi')] }); return; }
          var md = M(id); bot.mem.model = id; bot.say('The **' + md.name + '** is **' + inr(md.price) + '** in steel, GST included; **' + inr(md.price + 420000) + '** in 18k rose gold. We don’t discount, but EMI over 12 months is interest-free: **' + inr(Math.ceil(md.price / 12)) + ' a month**.', { cards: [card({ model: id, dial: md.sig.dial, metal: md.sig.metal, strap: md.sig.strap })] }); } },
      { id: 'emi', label: 'EMI', kw: ['emi', 'no cost emi', 'monthly', 'pay in parts'], priority: 1,
        run: function (bot) { var id = bot.mem.model || (bot.ctx && bot.ctx.m) || 'prahar', md = M(id), p = md.price; bot.say('No-cost EMI on the **' + md.name + '** (' + inr(p) + '), with eligible credit cards: we pay the interest.', { cards: [{ title: md.name + ' in steel', sub: 'No-cost EMI, GST included', price: inr(p), meta: ['3 months · ' + inr(Math.ceil(p / 3)) + ' a month', '6 months · ' + inr(Math.ceil(p / 6)) + ' a month', '12 months · ' + inr(Math.ceil(p / 12)) + ' a month'], buttons: [B('Open it in the configurator', 'act:go:watch.html?m=' + id)] }] }); } },
      { id: 'human', label: 'Talk to a watchmaker', kw: ['talk to a watchmaker', 'watchmaker', 'person', 'someone'], priority: 1,
        run: function (bot) { note(bot, { topic: 'watchmaker' }); bot.say('Of course. I’m asking a watchmaker at the atelier to join this chat; Anjali or Mehul usually replies within a few minutes between 11:00 and 19:30.', { delay: 300 }); bot.handover('Client asked for a watchmaker'); } },
      { id: 'thanks', label: 'Thanks', kw: ['thanks', 'thank you', 'shukriya', 'dhanyavaad', 'perfect', 'great', 'bas'], run: function (bot) { bot.say('A pleasure. The atelier is here whenever you need it.', { buttons: [B('Something else', 'menu')] }); } },
      { id: 'hello', label: 'Hello', kw: ['hi', 'hello', 'hey', 'namaste', 'namaskar'], run: function (bot) { bot.menu('Namaste. How may I help?'); } }
    ],
    flows: {
      find: { intent: 'find', slots: [
        { name: 'wrist', ask: function (bot) { bot.say('What is your wrist size? Wrap a tape or a strip of paper just above the wrist bone. A rough guess is fine.', { buttons: [B('Slim · about 15 cm', 'slot:wrist=15'), B('Average · 16.5 cm', 'slot:wrist=16.5'), B('Broad · 18 cm and up', 'slot:wrist=18.5'), B('It’s a gift, not sure', 'slot:wrist=16')] }); }, parse: function (t) { return wristFrom(t) || (/not sure|gift|pata nahi|don.?t know/i.test(t) ? 16 : undefined); }, validate: function (v) { if (v < 12 || v > 23) return 'That sounds off for a wrist. Most are between 14 and 20 cm.'; } },
        { name: 'occasion', ask: function (bot) { bot.say('What is it for?', { buttons: [B('Every day', 'slot:occasion=everyday'), B('With a suit', 'slot:occasion=dress'), B('A gift', 'slot:occasion=gift'), B('A wedding', 'slot:occasion=wedding'), B('Travel', 'slot:occasion=travel'), B('A milestone', 'slot:occasion=milestone')] }); }, parse: function (t) { return occasionFrom(t); } },
        { name: 'budget', ask: function (bot) { bot.say('And a budget, GST included?', { buttons: [B('Up to ₹4 L', 'slot:budget=400000'), B('Up to ₹5.5 L', 'slot:budget=550000'), B('Up to ₹9 L', 'slot:budget=900000'), B('Show me the best', 'slot:budget=0')] }); }, parse: function (t) { var b = budgetFrom(t); return b == null ? undefined : String(b); } }
      ], done: function (bot, s) {
        var r = recommend(s); bot.mem.lastRec = r;
        if (!r.list.length) { bot.say('Nothing of ours is under ' + lakh(r.budget) + ', I’m afraid: the Prahar in steel starts at ' + lakh(M('prahar').price) + '. No-cost EMI brings that to ' + inr(Math.ceil(M('prahar').price / 12)) + ' a month.', { buttons: [B('Show me the Prahar', 'act:go:watch.html?m=prahar'), B('No-cost EMI', 'intent:emi')] }); return; }
        bot.mem.model = r.list[0].model; bot.event('action', { action: 'recommend' });
        bot.say('For a **' + r.wrist + ' cm** wrist' + (r.budget ? ' and up to **' + lakh(r.budget) + '**' : '') + ', here is what I’d put on the table. The first is my choice.', { cards: r.list.map(function (c) { return card(c, why(c, r)); }) });
        bot.say('Each opens ready-configured, or I can ask a boutique to have it in your size when you visit.', { delay: 500, buttons: [B('Book a viewing', 'act:book:' + r.list[0].model), B('Have the atelier call me', 'act:callback:' + [r.list[0].model, r.list[0].dial, r.list[0].metal, r.list[0].strap].join('|')), B('Start again', 'flow:find')] });
      } },
      book: { intent: 'book', slots: [
        { name: 'boutique', ask: function (bot) { bot.say('Which boutique?', { buttons: [B('Udaipur atelier', 'slot:boutique=udaipur'), B('Mumbai · Kala Ghoda', 'slot:boutique=mumbai'), B('New Delhi · Mehrauli', 'slot:boutique=delhi'), B('Bengaluru · Lavelle Road', 'slot:boutique=bengaluru')] }); }, parse: function (t) { return boutiqueFrom(t); } },
        { name: 'day', ask: function (bot, s) { var b = D().BOUTIQUES.filter(function (x) { return x.id === s.boutique; })[0]; bot.say('When would you like to come to **' + b.city + '**? An hour each; ' + b.hours.replace(' · ', ', ') + '.', { buttons: dayButtons(s.boutique, 4) }); }, parse: function (t) { return dayFrom(t); },
          validate: function (v, bot, s) { var d = new Date(v + 'T00:00'); if (d < new Date(iso(new Date()) + 'T00:00')) return 'That day has passed. Pick another?'; if ((CLOSED[s.boutique] || []).indexOf(d.getDay()) > -1) return 'The ' + s.boutique + ' boutique is closed on ' + DN[d.getDay()] + 'days. Another day?'; if (!freeTimes(s.boutique, v).length) return 'That day is fully booked. Another day?'; } },
        { name: 'time', ask: function (bot, s) { var f = freeTimes(s.boutique, s.day); bot.say('Open hours on **' + nice(s.day) + '**:', { buttons: f.map(function (t) { return B(t, 'slot:time=' + t); }) }); }, parse: function (t, bot, s) { var tm = timeFrom(t), f = freeTimes(s.boutique, s.day); return tm && f.length ? nearest(tm, f) : undefined; },
          validate: function (v, bot, s) { if (freeTimes(s.boutique, s.day).indexOf(v) < 0) return v + ' was just taken. Another time?'; } },
        { name: 'model', optional: true, when: function (bot, s) { return !s.model; }, ask: function (bot) { bot.say('Shall we have one on the table for you?', { buttons: [B('Prahar', 'slot:model=prahar'), B('Nimisha', 'slot:model=nimisha'), B('Yantra', 'slot:model=yantra'), B('All three', 'slot:model=all')] }); }, parse: function (t) { return modelFrom(t) || (/all|sab|teeno|every/i.test(t) ? 'all' : undefined); } },
        { name: 'name', when: function (bot) { return !bot.user.name; }, ask: function (bot) { bot.say('Who should we expect? First and last name.'); }, parse: function (t) { var n = N.name(t) || String(t).trim(); return n.length >= 3 && !/\d/.test(n) && n.split(/\s+/).length >= 2 ? n.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }) : undefined; } },
        { name: 'contact', when: function (bot) { return !bot.user.phone && !bot.user.email; }, ask: function (bot, s) { bot.say('And a mobile number or email, ' + first(s.name || bot.user.name) + '? We confirm there; it is never shared.'); }, parse: function (t) { return N.phone(t) || (N.email && N.email(t)) || undefined; } }
      ], done: function (bot, s) {
        var g = G(), d = D(), b = d.BOUTIQUES.filter(function (x) { return x.id === s.boutique; })[0], name = s.name || bot.user.name, contact = s.contact || bot.user.phone || bot.user.email || '';
        bot.user.name = name; if (/@/.test(contact)) bot.user.email = contact; else bot.user.phone = contact;
        var at = new Date(s.day + 'T' + s.time), id = g ? g.nextId('GH-A-', 'appts', 5200) : 'GH-A-' + Date.now().toString().slice(-4);
        if (g) g.add('appts', { id: id, boutique: b.id, at: at.toISOString(), customer: name, email: /@/.test(contact) ? contact : '', phone: /@/.test(contact) ? '' : mask(contact), purpose: s.purpose || 'Private viewing', interest: s.model || 'all', guests: 1, status: 'requested', host: '', note: 'Booked in chat' + (s.model && s.model !== 'all' ? '; ' + M(s.model).name + ' on the table' : ''), source: 'chat', convo: bot.id, created: new Date().toISOString() });
        bot.lead({ name: name, phone: /@/.test(contact) ? '' : contact, email: /@/.test(contact) ? contact : undefined, intent: 'book_viewing', payload: { boutique: b.id, at: at.toISOString(), model: s.model || 'all', ref: id, convo: bot.id } });
        note(bot, { topic: 'viewing', ref: id }); bot.event('booking', { kind: 'viewing' });
        bot.say('It’s in the book, ' + first(name) + '. ' + b.city + ' will confirm within two working hours.', { cards: [{ title: b.city + ' · ' + b.name, sub: nice(s.day) + ' · ' + s.time + ' · one hour', badge: id, meta: [b.addr, s.model && s.model !== 'all' ? M(s.model).name + ' will be on the table, in your size' : 'All three watches will be on the table', 'Bring the watch you wear every day'], buttons: [B('Find my watch first', 'flow:find'), B('Something else', 'menu')] }] });
      } },
      status: { intent: 'status', slots: [
        { name: 'ref', ask: function (bot) { bot.say('Share the number: a service ticket (**GH-S-…**), an order (**GH-O-…**), or the serial on the caseback (**GH01-0128**).'); }, parse: function (t) { return idFrom(t); } }
      ], done: function (bot, s) { answerStatus(bot, s.ref); } },
      callback: { slots: [
        { name: 'name', when: function (bot) { return !bot.user.name; }, ask: function (bot) { bot.say('Who should the atelier ask for? First and last name.'); }, parse: function (t) { var n = N.name(t) || String(t).trim(); return n.length >= 3 && !/\d/.test(n) && n.split(/\s+/).length >= 2 ? n.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }) : undefined; } },
        { name: 'contact', when: function (bot) { return !bot.user.phone && !bot.user.email; }, ask: function (bot) { bot.say('A mobile number or email for the call back?'); }, parse: function (t) { return N.phone(t) || (N.email && N.email(t)) || undefined; } }
      ], done: function (bot, s) {
        var g = G(), name = s.name || bot.user.name, contact = s.contact || bot.user.phone || bot.user.email || '', c = bot.mem.cb || {}, r = bot.mem.lastRec || {};
        bot.user.name = name; if (/@/.test(contact)) bot.user.email = contact; else bot.user.phone = contact;
        var list = (g && g.store.get('enquiries', [])) || [], id = 'GH-E-' + (610 + list.length);
        var rec = { id: id, at: new Date().toISOString(), name: name, email: /@/.test(contact) ? contact : '', phone: /@/.test(contact) ? '' : mask(contact), interest: c, budget: r.budget || 0, wrist: r.wrist || null, occasion: r.occ || '', note: 'Asked for a call back from the concierge', status: 'new', source: 'chat', convo: bot.id };
        if (g) { list.unshift(rec); g.store.set('enquiries', list); }
        bot.lead({ name: name, phone: /@/.test(contact) ? '' : contact, email: /@/.test(contact) ? contact : undefined, intent: 'callback', payload: { ref: id, interest: c, budget: r.budget || 0, wrist: r.wrist || null, convo: bot.id } });
        note(bot, { topic: 'enquiry', ref: id });
        bot.say('Thank you, ' + first(name) + '. ' + (c.model ? 'Someone who knows the **' + M(c.model).name + '** well' : 'A client advisor') + ' will call within a working day, from the atelier in Udaipur.', { buttons: [B('Book a viewing too', 'act:book:' + (c.model || '')), B('Something else', 'menu')] });
      } }
    },
    actions: {
      go: function (bot, url) { go(bot, url); },
      book: function (bot, arg) { var p = { name: bot.user.name, contact: bot.user.phone || bot.user.email }; arg = arg || ''; if (/^city=/.test(arg)) p.boutique = arg.slice(5); else if (/^purpose=service/.test(arg)) p.purpose = 'Service or repair'; else if (M(arg)) { p.model = arg; bot.mem.model = arg; } bot.startFlow('book', p); },
      callback: function (bot, arg) { var a = String(arg || '').split('|'); bot.mem.cb = a[0] ? { model: a[0], dial: a[1], metal: a[2], strap: a[3] } : {}; bot.startFlow('callback', { name: bot.user.name, contact: bot.user.phone || bot.user.email }); }
    },
    kb: [
      { id: 'wind', q: 'How do I wind a hand-wound watch?', a: 'Off the wrist, turn the crown clockwise about **thirty times** each morning, until it gently resists. Never force it. A full wind runs a Prahar for **72 hours**.', keys: ['wind', 'winding', 'chabi', 'hand wound', 'how to wind', 'stopped overnight'] },
      { id: 'water', q: 'Is it water resistant?', a: 'Prahar and Nimisha are rated to **50 m**: rain, hand-washing and a careful swim. Yantra is **100 m**. Never pull the crown when wet, and keep leather straps out of the water.', keys: ['water', 'waterproof', 'water resistant', 'swim', 'shower', 'paani', 'rain'] },
      { id: 'warranty', q: 'How long is the warranty?', a: 'Five years from purchase, extended to **eight years** when you register within 90 days. It passes to the next owner.', keys: ['warranty', 'guarantee', 'how many years', 'register'], buttons: [B('Register my watch', 'act:go:warranty.html')] },
      { id: 'service', q: 'How often does it need a service?', a: 'A full service every **five to seven years**: about ' + '₹38,000' + ', two to three weeks, with free insured collection from anywhere in India.', keys: ['service', 'servicing', 'overhaul', 'how often', 'cleaning', 'oil'], buttons: [B('Request a service', 'act:go:service.html')] },
      { id: 'delivery', q: 'How long does delivery take?', a: 'Watches in stock leave Udaipur in **3 days**. A commission in your own dial, metal and strap takes about **six weeks**. Delivery is insured and complimentary across India; our concierge hand-delivers in Udaipur, Mumbai, New Delhi and Bengaluru.', keys: ['delivery', 'shipping', 'how long', 'when will it arrive', 'dispatch', 'kab milega', 'delivery time'] },
      { id: 'return', q: 'Can I return it?', a: 'Yes: an unworn, unengraved watch within **14 days**, collected free and refunded in full within seven working days.', keys: ['return', 'refund', 'exchange', 'wapas', 'return policy', 'money back'] },
      { id: 'engrave', q: 'Can you engrave it?', a: 'Up to **22 letters** around the caseback, free, by hand. You can type it in the configurator and see it on the back before you order.', keys: ['engrave', 'engraving', 'name on the back', 'message on the back', 'personalise', 'personalize'] },
      { id: 'strap', q: 'Can I change the strap?', a: 'Every watch has quick-release spring bars. Straps are ₹9,500 in calf or suede; the Rann bracelet is made in steel and titanium only. We fit them free in any boutique.', keys: ['strap', 'change the strap', 'bracelet', 'leather', 'band', 'belt'] },
      { id: 'size', q: 'How do I know my wrist size?', a: 'Wrap a strip of paper just above the wrist bone, mark it, and measure it flat. Most wrists are 15 to 18 cm. Under 16 cm, Nimisha (36 mm) sits beautifully; over 17.5 cm, Yantra (41 mm) holds its own.', keys: ['wrist size', 'measure my wrist', 'which size', 'too big', 'too small', 'kalai'] },
      { id: 'gold', q: 'Is the gold solid?', a: 'Yes: **18k solid gold**, rose or yellow, hallmarked. Gold cases add about ₹4 L to the steel price.', keys: ['gold', 'solid gold', 'plated', 'hallmark', 'rose gold', 'yellow gold', 'sona'] },
      { id: 'moon', q: 'How do I set the moon on the Nimisha?', a: 'Pull the crown to the first position and turn it forward: each click advances the moon by one day. Set it to the next **Purnima** and it follows the tithi for 122 years before needing a day’s correction.', keys: ['moon', 'moonphase', 'set the moon', 'tithi', 'purnima', 'amavasya'] },
      { id: 'gmt', q: 'How does the GMT work?', a: 'The red arrow on the Yantra reads a second time zone on the 24-hour ring. Pull the crown to the first position to move it in one-hour jumps, without stopping the watch.', keys: ['gmt', 'second time zone', 'two time zones', 'dual time', 'travel time'] },
      { id: 'magnet', q: 'My watch is suddenly running fast.', a: 'Probably magnetism: phone cases, laptop lids and speakers can magnetise the hairspring. Any boutique will demagnetise it **free, in two minutes**.', keys: ['running fast', 'gaining time', 'magnet', 'magnetised', 'magnetized', 'fast'] },
      { id: 'pay', q: 'How can I pay?', a: 'UPI, credit or debit card, bank transfer, or **no-cost EMI** over 3 to 12 months. You can also reserve a watch for seven days and pay in a boutique.', keys: ['pay', 'payment', 'upi', 'card', 'bank transfer', 'cash'] },
      { id: 'hours', q: 'When are the boutiques open?', a: 'Udaipur (the atelier) Tue–Sun 11:00–19:30 · Mumbai Mon–Sat 11:00–20:00 · New Delhi Tue–Sun 12:00–20:00 · Bengaluru Mon–Sat 11:00–19:30.', keys: ['opening hours', 'timings', 'open', 'closed', 'hours', 'kab khulta'], buttons: [B('Book a viewing', 'flow:book')] },
      { id: 'genuine', q: 'How do I know it’s genuine?', a: 'Every Ghatika is numbered on the caseback ring and signed inside by its watchmaker. Check any serial on our warranty page; it shows the warranty, never the owner.', keys: ['genuine', 'fake', 'original', 'authentic', 'certificate', 'asli'] },
      { id: 'abroad', q: 'Do you ship abroad?', a: 'Not yet: we deliver only within India, insured. NRI clients often collect from a boutique on a visit home.', keys: ['international', 'abroad', 'usa', 'uk', 'dubai', 'ship outside india', 'nri'] },
      { id: 'name', q: 'What does Ghatika mean?', a: 'A **ghatika** is twenty-four minutes: the time a pierced copper bowl, a **ghati**, takes to sink in water. India kept time that way for centuries.', keys: ['ghatika meaning', 'what does ghatika mean', 'name', 'why ghatika', 'ghati'] },
      { id: 'made', q: 'Where are they made?', a: 'In our atelier at Lal Ghat, Udaipur: one watchmaker finishes, assembles, regulates and cases each watch over **38 days**. Three hundred a year.', keys: ['made in', 'where are they made', 'swiss', 'movement', 'in house', 'who makes'] },
      { id: 'gift', q: 'Can you gift-wrap it?', a: 'Every Ghatika arrives in a walnut box; for gifts we hide the price and add a card written by our calligrapher. Just tick “This is a gift” at checkout.', keys: ['gift wrap', 'gift', 'wrap', 'card', 'present'] }
    ],
    freeText: function (bot, m) {
      var e = m.ent;
      if (e.ref) { answerStatus(bot, e.ref); return true; }
      if (e.wrist || e.occasion || (e.budget != null && e.budget > 0)) { bot.startFlow('find', { wrist: e.wrist, occasion: e.occasion, budget: e.budget != null ? String(e.budget) : undefined }); return true; }
      if (e.boutique || (e.day && e.time)) { bot.startFlow('book', { boutique: e.boutique, day: e.day, time: e.time, model: e.model, name: bot.user.name, contact: bot.user.phone || bot.user.email }); return true; }
      if (e.model) { bot.mem.model = e.model; var md = M(e.model); bot.say('The **' + md.name + '**: ' + md.tagline + ' ' + md.desc, { cards: [card({ model: e.model, dial: md.sig.dial, metal: md.sig.metal, strap: md.sig.strap })] }); return true; }
      return false;
    }
  });

  function answerStatus(bot, ref) {
    var g = G(); if (!g) { bot.say('I can’t reach the records just now. A watchmaker can look it up for you.', { buttons: [B('Talk to a watchmaker', 'intent:human')] }); return; }
    var STG = { received: 'received at the atelier', diagnosis: 'being diagnosed', quote: 'waiting for your approval of the quote', approved: 'approved, waiting for the bench', service: 'on the bench, in service', qc: 'on its 72-hour run and pressure test', ready: 'ready to return', returned: 'back with you' };
    var OST = { new: 'reserved, awaiting payment', paid: 'paid; your watchmaker begins shortly', atelier: 'at the atelier, being made', qc: 'on its 72-hour run before casing', dispatched: 'dispatched, insured', delivered: 'delivered' };
    var t;
    if (/^GH-S-/.test(ref) && (t = g.db('service').filter(function (x) { return x.id === ref; })[0])) {
      note(bot, { topic: 'status', ref: ref });
      bot.say('Ticket **' + ref + '**, your ' + M(t.model).name + ': ' + STG[t.stage] + '.', { cards: [{ title: M(t.model).name + (t.serial !== 'unknown' ? ' · ' + t.serial : ''), sub: t.issue, badge: ref, meta: [STG[t.stage].replace(/^./, function (c) { return c.toUpperCase(); }), t.warranty ? 'Covered by the warranty' : t.quote ? 'Quote ' + inr(t.quote) : 'Quote to follow', 'Back by ' + nice(iso(new Date(t.due)))], buttons: [B('Open the tracker', 'act:go:service.html#track'), B('Talk to the watchmaker', 'intent:human')] }] }); return;
    }
    if (/^GH-O-/.test(ref) && (t = g.db('orders').filter(function (x) { return x.id === ref; })[0])) {
      var it = t.items[0]; note(bot, { topic: 'status', ref: ref });
      bot.say('Order **' + ref + '**: ' + OST[t.status] + '.', { cards: [{ title: M(it.model).name, sub: g.cfgLine(it), badge: ref, price: inr(t.total), meta: [OST[t.status].replace(/^./, function (c) { return c.toUpperCase(); }), t.delivery, 'Placed ' + nice(iso(new Date(t.at)))], buttons: [B('Talk to the atelier', 'intent:human')] }] }); return;
    }
    if (/^GH0/.test(ref) && (t = g.db('warranty').filter(function (x) { return x.serial === ref; })[0])) {
      var until = new Date(t.bought); until.setFullYear(until.getFullYear() + t.years); note(bot, { topic: 'warranty', ref: ref });
      bot.say('Serial **' + ref + '** is a ' + M(t.model).name + ', ' + (t.status === 'verified' ? 'verified against its build record' : 'registered, verification pending') + '. Warranty until **' + nice(iso(until)) + '** (' + t.years + ' years).', { buttons: [B('Request a service', 'act:go:service.html'), B('Something else', 'menu')] }); return;
    }
    if (/^GH0/.test(ref)) { bot.say('Serial **' + ref + '** isn’t registered yet. Register it within 90 days of purchase and the warranty becomes eight years.', { buttons: [B('Register it now', 'act:go:warranty.html'), B('Talk to a watchmaker', 'intent:human')] }); return; }
    bot.say('I can’t find **' + ref + '**. Check the number in your confirmation email, or a watchmaker can look it up by your name.', { buttons: [B('Try another number', 'flow:status'), B('Talk to a watchmaker', 'intent:human')] });
  }
})();
