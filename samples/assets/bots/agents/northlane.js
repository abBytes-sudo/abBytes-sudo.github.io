/* Agent: Northlane Concierge (fictional Jaipur clothing label). The store's own stylist and client-care desk.
   Unlike the generic "support" agent, this one reads and writes the store's real demo database (store/nl-data.js, window.NL):
   products, live stock per size and colour, orders, returns (NL.requestReturn) and back-in-stock alerts (NL.alertMe),
   so whatever happens in the chat shows up in the Northlane back office (orders/admin.html). Demo only: nothing leaves the browser. */
(function () {
  'use strict';
  var O = window.Orbit, N = O.nlp, B = function (l, v) { return { label: l, value: v }; };
  function NL() { return window.NL; }
  function R(n) { return NL() ? NL().money(n) : '₹' + Math.round(n).toLocaleString('en-IN'); }
  var DAY = 864e5;

  /* ---------- Hinglish and shorthand, so "mera order kab aayega" and "kitne ka hai" land ---------- */
  var HI = [[/\b(kitne|kitna|kitni) (ka|ki|ke)( hai| h)?\b|\bprice kya( hai)?\b|\bkya rate hai\b/g, 'how much'], [/\b(kab|kab tak) (aayega|ayega|aaega|milega|pahunchega|aayegi)\b/g, 'when will it arrive'], [/\b(mera|meri|mere) order\b/g, 'my order'], [/\b(kahan|kaha|kidhar) (hai|h)\b/g, 'where is'],
    [/\b(wapas|vapas|wapis)( karna| karni| kar do| bhejna)?\b|\breturn karna\b/g, 'return'], [/\b(badalna|badal do|badalni|exchange karna)\b/g, 'exchange'], [/\b(kaunsa|konsa|kaun sa|kon sa) size\b|\bsize kya (lu|loon|lun|lena)\b/g, 'which size'], [/\b(chahiye|dikhao|dikha do|batao)\b/g, 'show me'],
    [/\b(sasta|saste|sasti)\b/g, 'cheap'], [/\bkal subah\b/g, 'tomorrow morning'], [/\bkal shaam\b/g, 'tomorrow evening'], [/\bparso\b/g, 'day after tomorrow'], [/\bkal\b/g, 'tomorrow'], [/\baaj\b/g, 'today'], [/\bsubah\b/g, 'morning'], [/\b(shaam|sham)\b/g, 'evening'], [/\bdopahar\b/g, 'afternoon'],
    [/\b(haan|haa|haanji|ha ji|ji haan)\b/g, 'yes'], [/\b(nahi|nahin|nai)\b/g, 'no'], [/\b(stock mein|available) (hai|h)\b/g, 'in stock'], [/\bbaat (karni|karna) (hai|h)\b/g, 'talk to a person'], [/\bthoda bada\b/g, 'roomy'], [/\bthoda tight\b/g, 'snug'], [/\bgarm\b/g, 'warm'], [/\bsardi\b/g, 'winter']];
  function hi(t) { var s = ' ' + String(t).toLowerCase() + ' '; HI.forEach(function (p) { s = s.replace(p[0], p[1]); }); return s.trim(); }

  /* ---------- catalogue helpers on top of the live store database ---------- */
  var TYPE = { 'harbor-jacket': 'jacket', 'atelier-tote': 'bag', 'meridian-38': 'watch', 'coast-sunglasses': 'sunglasses', 'drift-runner': 'boot', 'court-low': 'shoe', 'field-cap': 'cap', 'mini-crossbody': 'bag', 'everyday-tee': 'tee', 'loop-hoodie': 'hoodie', 'easy-trousers': 'trousers', 'rib-knit': 'knit' };
  var WARM = { 'harbor-jacket': 2, 'rib-knit': 2, 'loop-hoodie': 2, 'drift-runner': 1 }, GIFT = { 'meridian-38': 2, 'atelier-tote': 2, 'mini-crossbody': 2, 'coast-sunglasses': 1, 'field-cap': 1 };
  var FAM = { black: /black|ink|charcoal/i, white: /white|chalk|ivory|bone|cream|oat/i, brown: /tan|cognac|tortoise|sand|stone|clay|honey|rust|camel/i, green: /sage|olive|moss|forest/i, blue: /navy|blue/i, pink: /rose|pink/i };
  // how each cut behaves, used for the size advice: shift = sizes to move for a "regular" fit
  var CUT = { 'harbor-jacket': { note: 'relaxed through the body', snug: -1, regular: 0, roomy: 0 }, 'everyday-tee': { note: 'boxy, dropped at the shoulder', snug: -1, regular: 0, roomy: 0 }, 'loop-hoodie': { note: 'roomy by design', snug: -1, regular: -1, roomy: 0 },
    'easy-trousers': { note: 'cropped above the ankle with a drawcord', snug: 0, regular: 0, roomy: 1 }, 'rib-knit': { note: 'close to the body and slightly cropped', snug: 0, regular: 0, roomy: 1 }, 'drift-runner': { note: 'half a size large', snug: -1, regular: -1, roomy: 0 }, 'court-low': { note: 'true to size with a snug heel', snug: 0, regular: 0, roomy: 0 } };
  function products() { return NL() ? NL().products() : []; }
  function prod(id) { return NL() ? NL().product(id) : null; }
  function img(p) { return p && p.images && p.images[0] ? NL().thumb(p.images[0].src) : ''; }
  function avail(p) { var n = 0; NL().variants(p).forEach(function (v) { n += v.avail; }); return n; }
  function stateOf(p, ci, s) { return NL().stock(NL().skuKey(p.id, ci, s)); }
  function productFrom(text) {
    var t = ' ' + hi(text).replace(/[^a-z0-9 ]/g, ' ') + ' ', best = null, bs = 0;
    products().forEach(function (p) {
      var s = 0, nm = p.name.toLowerCase(); if (t.indexOf(' ' + nm + ' ') >= 0) s += 6; nm.split(' ').forEach(function (w) { if (w.length > 3 && t.indexOf(' ' + w + ' ') >= 0) s += 2; });
      if (t.indexOf(' ' + TYPE[p.id]) >= 0) s += 1; if (s > bs) { bs = s; best = p; }
    });
    return bs >= 2 ? best : null;
  }
  function sizeFrom(text, p) {
    var t = String(text).toUpperCase(), m;
    if (p && p.sizes.length === 1) return p.sizes[0];
    if ((m = t.match(/\b(XXS|XS|XXL|XL|S|M|L)\b/))) return m[1] === 'XXL' ? 'XL' : m[1] === 'XXS' ? 'XS' : m[1];
    if ((m = t.match(/\b(3[8-9]|4[0-6])\b/))) return m[1];
    if ((m = String(text).toLowerCase().match(/\buk\s*(\d{1,2})(?:\.5)?\b/))) return String(+m[1] + 33);
    if ((m = String(text).toLowerCase().match(/\b(small|medium|large)\b/))) return { small: 'S', medium: 'M', large: 'L' }[m[1]];
    return undefined;
  }
  function colourFrom(text, p) { var t = String(text).toLowerCase(), hit; if (!p) return undefined; p.colors.forEach(function (c, i) { if (t.indexOf(c.n.toLowerCase()) >= 0) hit = i; }); return hit; }
  function card(p, extra) {
    var a = avail(p), cols = p.colors.map(function (c) { return c.n; });
    return { title: p.name, sub: (p.desc || '').split('. ')[0] + '.', img: img(p), price: R(p.price), badge: a === 0 ? 'Sold out' : a <= 6 ? 'Last few' : p.isNew ? 'New' : '', meta: [cols.slice(0, 3).join(' · ')].concat(extra || []), buttons: [B('View the piece', 'act:view:' + p.id), B(p.sizes.length > 1 ? 'Size help' : 'Stock', p.sizes.length > 1 ? 'act:size:' + p.id : 'act:stock:' + p.id)] };
  }
  function search(brief) {
    var t = hi(brief), m = N.money(t), max = m && m.max, min = m && m.min, fam = null, cat = null, ty = null, who = null, warm = /\b(warm|winter|cold|layer|layering|chilly|sweater|jumper)\b/.test(t), gift = /\b(gift|present|birthday|anniversary|for (him|her|my))\b/.test(t);
    Object.keys(FAM).forEach(function (k) { if (new RegExp('\\b' + k + '\\b').test(t) || (k === 'brown' && /\b(tan|camel|rust)\b/.test(t))) fam = k; });
    if (/\b(shoe|shoes|boot|boots|sneaker|sneakers|footwear|brogue)\b/.test(t)) cat = 'Shoes'; else if (/\b(bag|bags|tote|crossbody|purse|handbag)\b/.test(t)) cat = 'Bags'; else if (/\b(watch|sunglass|sunglasses|shades|cap|hat|accessor)/.test(t)) cat = 'Accessories'; else if (/\b(jacket|coat|outerwear|tee|t-shirt|tshirt|hoodie|trouser|trousers|pants|knit|sweater|jumper|clothing|clothes)\b/.test(t)) cat = 'Clothing';
    var tym = t.match(/\b(jacket|tee|hoodie|trousers|knit|watch|sunglasses|cap|boot|tote|crossbody)\b/); if (tym) ty = { tote: 'bag', crossbody: 'bag' }[tym[1]] || tym[1];
    if (/\b(women|womens|woman|ladies|her|wife|girlfriend|mother|mom)\b/.test(t)) who = 'Women'; if (/\b(men|mens|man|him|husband|boyfriend|father|dad)\b/.test(t)) who = 'Men';
    var any = max || min || fam || cat || ty || who || warm || gift;
    var L = products().map(function (p) {
      var s = 1; if (max && p.price > max) return null; if (min && p.price < min) return null; if (cat && p.cat !== cat) return null;
      if (ty) { if (TYPE[p.id] === ty || (ty === 'bag' && p.cat === 'Bags')) s += 4; else s -= 2; }
      if (fam && p.colors.some(function (c) { return FAM[fam].test(c.n); })) s += 3; else if (fam) s -= 1;
      if (who && (p.for === who || p.for === 'Unisex')) s += 1; else if (who) s -= 1;
      if (warm) s += (WARM[p.id] || 0) * 2; if (gift) s += GIFT[p.id] || 0; if (avail(p) === 0) s -= 2;
      return { p: p, s: s };
    }).filter(Boolean).sort(function (a, b) { return b.s - a.s || a.p.price - b.p.price; });
    return { any: any, list: L.slice(0, 4).map(function (x) { return x.p; }), crit: { max: max, min: min, fam: fam, cat: cat, ty: ty, who: who, warm: warm, gift: gift } };
  }
  function eligible(o) {
    var X = NL(); if (!o || o.cancelled || X.stage(o) !== 'delivered' || X.openReturn(o)) return null;
    var last = 0; o.ships.forEach(function (s) { if (s.ev.delivered) last = Math.max(last, s.ev.delivered); });
    var left = X.db().set.returnDays - Math.floor((Date.now() - last) / DAY); if (left < 0) return null;
    var lines = o.items.map(function (it, i) { var asked = o.rets.filter(function (r) { return r.st !== 'rejected'; }).reduce(function (a, r) { return a + r.lines.filter(function (l) { return l.i === i; }).reduce(function (b, l) { return b + l.q; }, 0); }, 0); return { i: i, max: Math.max(0, X.shippedQ(o, i) - asked) }; }).filter(function (l) { return l.max > 0; });
    return lines.length ? { left: left, lines: lines } : null;
  }
  function who(bot) { var s = NL() && NL().session(); if (s && !bot.user.name) { bot.user.name = s.name; bot.user.email = s.email; } return s; }
  function orderFrom(t) { var m = String(t).toUpperCase().match(/\bNL[- ]?(\d{5})\b|\b(1\d{4})\b/); return m ? 'NL-' + (m[1] || m[2]) : undefined; }
  function lead(bot, intent, payload, extra) {
    payload = payload || {}; payload.convo = bot.id; payload.page = bot.ctx.page || ''; var l = { intent: intent, payload: payload };
    if (extra) for (var k in extra) l[k] = extra[k]; if (!l.name && !bot.user.name) l.name = 'Website visitor'; if (!l.email && bot.user.email) l.email = bot.user.email; return bot.lead(l);
  }
  function go(bot, url, line) { bot.say(line || 'Opening it for you…', { delay: 300 }); try { sessionStorage.setItem('cg-reopen-northlane', '1'); } catch (e) {} setTimeout(function () { location.href = url; }, 900); }
  function storeUrl(p) { return O.samples('store/' + p); }

  /* ---------- replies used from several places ---------- */
  function stockReply(bot, p, size) {
    var X = NL(), rows = [];
    p.colors.forEach(function (c, ci) { var sz = size ? [size] : p.sizes; var parts = sz.map(function (s) { var v = stateOf(p, ci, s); return (p.sizes.length > 1 ? s + ' ' : '') + (v.avail === 0 ? 'sold out' : v.avail <= 3 ? v.avail + ' left' : 'in stock'); }); rows.push(c.n + ': ' + parts.join(', ')); });
    var out = [], btn = [];
    p.colors.forEach(function (c, ci) { (size ? [size] : p.sizes).forEach(function (s) { var v = stateOf(p, ci, s); if (!v.avail) out.push({ c: ci, s: s, v: v }); }); });
    if (size || p.sizes.length === 1) { var okc = p.colors.map(function (c, ci) { return stateOf(p, ci, size || p.sizes[0]).avail ? ci : -1; }).filter(function (x) { return x >= 0; }); if (okc.length && window.NLS) btn.push(B('Add ' + p.colors[okc[0]].n + (size && p.sizes.length > 1 ? ', ' + size : '') + ' to bag', 'act:add:' + p.id + '|' + okc[0] + '|' + (size || p.sizes[0]))); }
    if (out.length) btn.push(B('Alert me when it’s back', 'act:alert:' + p.id + '|' + out[0].c + '|' + out[0].s));
    var inc = out.length && out[0].v.inc && out[0].v.inc.eta ? ' The next delivery from the workshop is due around **' + X.fD(out[0].v.inc.eta) + '**.' : '';
    bot.say('Here’s the **' + p.name + '**' + (size && p.sizes.length > 1 ? ' in ' + size : '') + ' right now, live from the studio shelves:' + inc, { cards: [{ title: p.name + (size && p.sizes.length > 1 ? ' · ' + size : ''), sub: rows.length > 3 ? rows.slice(0, 3).join(' · ') : '', img: img(p), price: R(p.price), meta: rows.slice(0, 4), buttons: btn.length ? btn.slice(0, 2) : [B('View the piece', 'act:view:' + p.id)] }], buttons: [B('Size help', 'act:size:' + p.id), B('Find something else', 'intent:find')] });
  }
  function results(bot, r, intro) {
    if (!r.list.length) { bot.say('Nothing in the collection fits all of that right now. Want me to loosen it a little?', { buttons: [B(r.crit.max ? 'Show me just over budget' : 'Show me everything', 'say:show me the collection'), B('Ask a stylist', 'handover')] }); return; }
    var c = r.crit, bits = []; if (c.ty || c.cat) bits.push((c.ty || c.cat).toLowerCase()); if (c.fam) bits.push('in ' + c.fam); if (c.max) bits.push('under ' + R(c.max)); if (c.warm) bits.push('for the cold months'); if (c.gift) bits.push('that make a good gift');
    bot.mem.lastEdit = r.list.map(function (p) { return p.id; });
    bot.say(intro || (bits.length ? 'Pieces ' + bits.join(', ') + ', picked from what’s on the shelf today:' : 'A short edit from the collection:'), { cards: r.list.map(function (p) { return card(p); }), buttons: [B('Email me this edit', 'flow:edit'), B('Under ₹5,000', 'say:under 5000'), B('Ask a stylist', 'handover')] });
  }
  function trackCard(o) {
    var X = NL(), stg = X.stage(o), steps = ['placed', 'packed', 'shipped', 'out', 'delivered'], at = steps.indexOf(stg), sh = o.ships[o.ships.length - 1];
    var line = steps.map(function (k, i) { return (i <= at ? '✓ ' : '○ ') + { placed: 'Placed', packed: 'Packed', shipped: 'In transit', out: 'Out for delivery', delivered: 'Delivered' }[k]; });
    var p = prod(o.items[0].pid), rt = X.openReturn(o);
    return { title: o.id + ' · ' + (rt ? 'Return ' + rt.st : X.STGL[stg]), sub: o.items.map(function (it) { return it.name + (it.s && it.s !== 'One size' ? ' (' + it.s + ')' : ''); }).join(', '), img: img(p), price: R(o.total), priceLabel: X.etaText(o), meta: line.concat(sh && sh.awb ? [sh.carrier + ' · ' + sh.awb] : []), buttons: [B('Live tracking', 'act:trackpage:' + o.id)].concat(eligible(o) ? [B('Start a return', 'act:ret:' + o.id)] : []) };
  }

  var MENU = [B('Find me something', 'intent:find'), B('Which size?', 'intent:size'), B('Track my order', 'flow:track'), B('Start a return', 'flow:returns'), B('Restock alert', 'flow:restock'), B('Delivery to my pincode', 'intent:delivery')];

  O.registerAgent({
    id: 'northlane', name: 'Northlane Concierge', business: 'Northlane', role: 'Stylist and client care', industry: 'Fashion retail', initials: 'N', accent: '#9C4A2B', phoneLabel: 'Northlane client care',
    blurb: 'The Northlane store’s own concierge: finds pieces from a sentence, advises on size from live stock, tracks orders, starts returns and sets restock alerts, all straight into the store’s back office.',
    helloLine: 'I can find a piece, help with size, track an order or start a return.',
    samples: ['something warm under 9000', 'which size harbor jacket', 'mera order kab aayega', 'return my hoodie'],
    kind: 'customer', menu: MENU,
    contexts: [{ label: 'Home page', context: { page: 'home' } }, { label: 'Viewing the Harbor Jacket', context: { page: 'product', id: 'harbor-jacket' } }, { label: 'Checkout', context: { page: 'checkout' } }],
    synonyms: { 'how much': ['price', 'cost', 'kitne ka hai', 'kitne ki hai', 'kitne ka', 'kitna hai', 'kitna'], 'when will it arrive': ['kab aayega', 'kab milega', 'kab ayega', 'kab tak aayega', 'kab pahunchega'], 'where is': ['kahan hai', 'kaha hai', 'kidhar hai'], 'talk to a person': ['baat karni hai', 'baat karna hai'], 'in stock': ['stock mein hai', 'available hai', 'milega kya'], 'my order': ['mera order', 'meri order'], 'return': ['wapas', 'vapas', 'send back', 'returns'], 'exchange': ['badalna', 'swap'], 'which size': ['kaunsa size', 'konsa size', 'size kya lu'], 'show me': ['chahiye', 'dikhao'], 'restock': ['back in stock', 'notify me', 'restock alert'], 'pincode': ['pin code', 'postcode', 'zip code', 'zip'] },
    seeds: {},
    nudge: function (c) {
      var p = c.page === 'product' && c.id && prod(c.id);
      if (p && p.sizes.length > 1) return { text: 'Between sizes on the ' + p.name + '? It runs ' + (CUT[p.id] ? CUT[p.id].note : 'true to size') + '. I can tell you which to take.', cta: 'Help me choose', button: B('Which size should I take?', 'act:size:' + p.id) };
      if (p) return { text: 'Want to know when the ' + p.name + ' would reach you? Give me your pincode.', cta: 'Check delivery', button: B('Delivery to my pincode', 'intent:delivery') };
      if (c.page === 'shop') return { text: 'Looking for something specific? Describe it in a sentence and I’ll pull the pieces.', cta: 'Find it for me', button: B('Find me something', 'intent:find') };
      if (c.page === 'checkout') return { text: 'Questions before you pay? Delivery dates, cash on delivery and returns, answered here.', cta: 'Ask now', button: B('Delivery to my pincode', 'intent:delivery') };
      return { text: 'Dressing for the cold months? I can put together a short edit from what’s on the shelf.', cta: 'Show me', button: B('Something warm for winter', 'say:something warm for winter') };
    },
    greeting: function (bot) {
      var c = bot.ctx, s = who(bot), p = c.page === 'product' && c.id && prod(c.id), first = s && s.name ? s.name.split(' ')[0] : '';
      if (c.from === 'web') { bot.say('Hello' + (c.name ? ' ' + c.name.split(' ')[0] : '') + ', it’s the Northlane concierge, now on WhatsApp. Same answers, and you’ll get order updates right here.', { buttons: MENU.slice(0, 4) }); return; }
      if (p) {
        var col = p.colors[0].n;
        bot.say('Good ' + daypart() + (first ? ', ' + first : '') + '. You’re looking at the **' + p.name + '**' + (p.sizes.length > 1 && CUT[p.id] ? ', which runs ' + CUT[p.id].note : '') + '. I can check your size against today’s stock, show what we wear it with, or tell you when it would reach you.',
          { buttons: (p.sizes.length > 1 ? [B('Which size for me?', 'act:size:' + p.id)] : []).concat([B('Is it in stock?', 'act:stock:' + p.id), B('What goes with it?', 'act:look:' + p.id), B('Delivery to my pincode', 'intent:delivery'), B('Something else', 'menu')]) });
        return;
      }
      if (c.page === 'account' && s) {
        var mine = NL().db().orders.filter(function (o) { return o.email === s.email; }), live = mine.filter(function (o) { var g = NL().stage(o); return !o.cancelled && g !== 'delivered'; })[0];
        bot.say('Welcome back, ' + first + '.' + (live ? ' Your order **' + live.id + '** is ' + NL().STGL[NL().stage(live)].toLowerCase() + ': ' + NL().etaText(live) + '.' : ' Everything you’ve ordered has arrived.') + ' What can I do for you?', { buttons: (live ? [B('Track ' + live.id, 'act:track:' + live.id)] : []).concat([B('Start a return', 'flow:returns'), B('Find me something', 'intent:find'), B('Restock alert', 'flow:restock')]) });
        return;
      }
      if (c.page === 'checkout') { bot.say('Questions before you pay? I can check delivery to your pincode, explain cash on delivery, or walk you through returns (30 days, free pickup).', { buttons: [B('Delivery to my pincode', 'intent:delivery'), B('Cash on delivery?', 'say:cash on delivery'), B('How returns work', 'say:return policy'), B('Talk to a person', 'handover')] }); return; }
      if ((c.page === 'track' || c.file === 'track') && NL()) { bot.say('I can look your order up and tell you exactly where it is. What’s the order number? It looks like **' + NL().demo().order + '**.', { buttons: [B('Use order ' + NL().demo().order, 'act:track:' + NL().demo().order), B('Something else', 'menu')] }); return; }
      if (c.page === 'shop') { bot.say('Good ' + daypart() + '. Tell me what you’re after in a sentence, like “a warm layer under ₹9,000” or “a gift for my father”, and I’ll pull the pieces.', { buttons: [B('Something warm', 'say:something warm for winter'), B('A gift', 'say:a gift under 13000'), B('Bags', 'say:show me bags'), B('Something else', 'menu')] }); return; }
      bot.say('Good ' + daypart() + (first ? ', ' + first : '') + '. I’m the Northlane concierge. I can find you a piece, help with size, track an order or start a return, and if you’d rather talk to the studio, I’ll bring someone in.', { buttons: MENU });
    },
    extract: function (text, bot) {
      var e = {}, t = hi(text), p = productFrom(t), oid = orderFrom(text), em = N.email(text), pin = String(text).match(/\b([1-8]\d{5})\b/);
      if (p) e.product = p.id; if (oid) e.orderId = oid; if (em) e.email = em; if (pin && !oid) e.pin = pin[1];
      var pp = p || (bot.ctx.id && prod(bot.ctx.id)) || (bot.slots.product && prod(bot.slots.product)); var sz = sizeFrom(text, pp); if (sz && /size|\b(xs|s|m|l|xl|xxl|uk|small|medium|large)\b|\b(3[8-9]|4[0-6])\b/i.test(text)) { e.usual = sz; e.size = sz; }
      if (/\b(snug|tight|slim|fitted|close)\b/.test(t)) e.fit = 'snug'; else if (/\b(roomy|loose|relaxed|oversize|oversized|baggy)\b/.test(t)) e.fit = 'roomy'; else if (/\b(regular|true to size|normal)\b/.test(t)) e.fit = 'regular';
      if (pp) { var ci = colourFrom(text, pp); if (ci !== undefined) e.colour = String(ci); }
      return e;
    },
    intents: [
      { id: 'find', label: 'Find me something', kw: ['find', 'looking for', 'show me', 'recommend', 'suggest', 'gift', 'something warm', 'something to wear', 'what do you have', 'browse', 'collection', 'outfit', 'edit', 'cheap', 'under'], re: [/\bunder\s*(₹|rs\.?)?\s*\d/i, /\b(show|find|looking for|recommend|suggest|need a|want a)\b.*\b(jacket|tee|hoodie|trousers|knit|watch|sunglasses|cap|boots?|shoes?|bags?|tote)\b/i], priority: 0,
        run: function (bot, m) { var r = search(m.text); if (!r.any && !/collection|everything/.test(m.norm)) { bot.say('Tell me what you’re after, in your own words. A piece, a colour, a budget, who it’s for.', { buttons: [B('Something warm', 'say:something warm for winter'), B('A gift under ₹13,000', 'say:a gift under 13000'), B('Black, under ₹8,000', 'say:something black under 8000'), B('Shoes', 'say:show me shoes')] }); return; } results(bot, r); if (r.list.length) lead(bot, 'product_finder', { brief: String(m.text).slice(0, 80), shown: r.list.map(function (p) { return p.name; }).join(', ') }); } },
      { id: 'size', label: 'Which size?', kw: ['size', 'sizing', 'fit', 'which size', 'what size', 'true to size', 'runs small', 'runs large', 'size guide', 'measurements', 'between sizes', 'size chart'], re: [/\b(which|what) size\b/i], priority: 1, run: function (bot, m) { var p = m.ent.product || (bot.ctx.page === 'product' && bot.ctx.id) || ''; bot.startFlow('size', { product: p || undefined, usual: m.ent.usual, fit: m.ent.fit }); } },
      { id: 'track', label: 'Track my order', kw: ['track', 'where is my order', 'order status', 'my order', 'when will it arrive', 'has it shipped', 'parcel', 'tracking', 'awb', 'delivery status', 'not received', 'not arrived'], re: [/\bNL[- ]?\d{5}\b/i], priority: 1, run: function (bot, m) { bot.startFlow('track', { orderId: m.ent.orderId, email: m.ent.email }); } },
      { id: 'returns', label: 'Start a return', kw: ['return', 'exchange', 'refund', 'send back', 'wrong size', 'too small', 'too big', 'doesnt fit', 'does not fit', 'damaged', 'faulty', 'not as expected'], re: [/\b(return|exchange|refund|send (it |this )?back)\b/i], priority: 1, run: function (bot, m) { bot.startFlow('returns', { orderId: m.ent.orderId, email: m.ent.email }); } },
      { id: 'restock', label: 'Restock alert', kw: ['restock', 'back in stock', 'notify me', 'sold out', 'out of stock', 'alert me', 'when will you have', 'waitlist'], re: [/\b(notify|alert|tell) me when\b|\bback in stock\b|\brestock/i], priority: 2, run: function (bot, m) { bot.startFlow('restock', { product: m.ent.product || (bot.ctx.page === 'product' ? bot.ctx.id : undefined), colour: m.ent.colour, size: m.ent.size }); } },
      { id: 'stock', label: 'Check stock', kw: ['in stock', 'available', 'do you have', 'is it available', 'stock', 'left in'], priority: 0, run: function (bot, m) { var p = prod(m.ent.product || bot.ctx.id); if (!p) { bot.say('Which piece shall I check? Tell me the name, like “Harbor Jacket in M”.', { buttons: products().slice(0, 4).map(function (x) { return B(x.name, 'act:stock:' + x.id); }) }); return; } stockReply(bot, p, m.ent.size); } },
      { id: 'delivery', label: 'Delivery to my pincode', kw: ['delivery', 'deliver to', 'shipping time', 'how long', 'when will i get', 'pincode', 'ship to', 'reach me', 'same day', 'express'], priority: 0, run: function (bot, m) { bot.startFlow('delivery', { pin: m.ent.pin }); } },
      { id: 'price', label: 'Price', kw: ['how much', 'price of', 'cost of'], priority: 0, run: function (bot, m) { var p = prod(m.ent.product || bot.ctx.id); if (!p) { results(bot, search('everything'), 'Here’s the collection with prices. Everything includes GST.'); return; } bot.say('The **' + p.name + '** is **' + R(p.price) + '**, GST included' + (p.price >= 5000 ? ', and delivery is free.' : '. Add ' + R(5000 - p.price) + ' more to your bag for free delivery.'), { buttons: [B('Is it in stock?', 'act:stock:' + p.id), B('Size help', 'act:size:' + p.id)] }); } },
      { id: 'look', label: 'What goes with it', kw: ['goes with', 'go with', 'wear it with', 'style it', 'pair with', 'complete the look', 'matching'], priority: 0, run: function (bot, m) { var id = m.ent.product || bot.ctx.id; if (!id) { bot.say('Which piece are you styling?', { buttons: products().slice(0, 4).map(function (x) { return B(x.name, 'act:look:' + x.id); }) }); return; } bot.agent.actions.look(bot, id); } },
      { id: 'orders', label: 'My orders', kw: ['my orders', 'order history', 'past orders', 'what did i order', 'previous orders'], priority: 1, run: function (bot) { var s = who(bot); if (!s) { bot.say('Sign in on the Account page and I can list them for you. Or give me an order number and I’ll track it.', { buttons: [B('Track an order', 'flow:track'), B('Go to my account', 'act:goto:account.html')] }); return; } var L = NL().db().orders.filter(function (o) { return o.email === s.email; }).slice(0, 4); bot.say('Your latest ' + L.length + ' orders:', { cards: L.map(trackCard) }); } }
    ],
    flows: {
      size: { intent: 'size', slots: [
        { name: 'product', ask: function (bot) { bot.say('Which piece is it for?', { buttons: products().filter(function (p) { return p.sizes.length > 1; }).slice(0, 6).map(function (p) { return B(p.name, 'slot:product=' + p.id); }) }); }, parse: function (t) { var p = productFrom(t); return p ? p.id : undefined; }, hint: 'Tell me the piece, for example “Harbor Jacket” or “Desert Boot”.' },
        { name: 'usual', ask: function (bot, s) { var p = prod(s.product); if (!p) { bot.endFlow(); bot.menu(); return; } if (p.sizes.length === 1) { bot.slots.usual = p.sizes[0]; bot.slots.fit = 'regular'; bot._advance(); return; } var shoe = p.cat === 'Shoes'; bot.say(shoe ? 'What size do you usually take in shoes? EU sizes, or tell me your UK size.' : 'What size do you usually wear in ' + (TYPE[p.id] === 'trousers' ? 'trousers' : 'tops and jackets') + ' from other labels?', { buttons: (shoe ? ['40', '41', '42', '43', '44'] : ['XS', 'S', 'M', 'L', 'XL']).map(function (z) { return B(z, 'slot:usual=' + z); }) }); }, parse: function (t, bot, s) { return sizeFrom(t, prod(s.product)); }, hint: 'Just the size you normally buy, like M, or 42 for shoes.' },
        { name: 'fit', ask: function (bot) { bot.say('And how do you like things to fit?', { buttons: [B('Close and neat', 'slot:fit=snug'), B('Regular', 'slot:fit=regular'), B('Easy and roomy', 'slot:fit=roomy')] }); }, parse: function (t) { t = hi(t); return /snug|tight|close|neat|slim|fitted/.test(t) ? 'snug' : /roomy|loose|relaxed|easy|oversize|baggy/.test(t) ? 'roomy' : /regular|normal|true|standard/.test(t) ? 'regular' : undefined; } }
      ], done: function (bot, s) {
        var p = prod(s.product); if (!p) { bot.menu(); return; }
        if (p.sizes.length === 1) { bot.say('The **' + p.name + '** comes in one size: ' + p.sizes[0] + '. ' + (p.fit || ''), { buttons: [B('Is it in stock?', 'act:stock:' + p.id)] }); return; }
        var cut = CUT[p.id] || { snug: 0, regular: 0, roomy: 0, note: 'true to size' }, ix = p.sizes.indexOf(s.usual); if (ix < 0) ix = Math.max(0, Math.min(p.sizes.length - 1, p.sizes.indexOf('M') >= 0 ? p.sizes.indexOf('M') : 2));
        var shift = cut[s.fit] || 0, to = Math.max(0, Math.min(p.sizes.length - 1, ix + shift)), rec = p.sizes[to], edge = ix + shift !== to;
        var why = shift < 0 ? 'it runs ' + cut.note + ', so going down one gives you the ' + (s.fit === 'snug' ? 'close' : 'regular') + ' fit you want' : shift > 0 ? 'it sits ' + cut.note + ', so one up gives you the easier drape' : 'it’s ' + cut.note + ', so your usual size is right';
        bot.mem.size = { product: p.id, size: rec };
        var ci = bot.ctx.id === p.id && bot.ctx.c != null ? +bot.ctx.c : 0, rows = p.colors.map(function (c, k) { var v = stateOf(p, k, rec); return c.n + ': ' + (v.avail ? (v.avail <= 3 ? 'only ' + v.avail + ' left' : 'in stock') : 'sold out'); });
        var okc = p.colors.map(function (c, k) { return stateOf(p, k, rec).avail ? k : -1; }).filter(function (x) { return x >= 0; });
        bot.say('Take the **' + rec + '**. ' + why.charAt(0).toUpperCase() + why.slice(1) + '.' + (edge ? ' (That’s already the end of the size range.)' : '') + (p.fit ? '\nFrom the pattern notes: “' + p.fit + '”' : ''), {
          cards: [{ title: p.name + ' · ' + rec, sub: 'Our recommendation for a ' + { snug: 'close', regular: 'regular', roomy: 'roomy' }[s.fit] + ' fit', img: img(p), price: R(p.price), meta: rows, buttons: okc.length ? [B('Add ' + p.colors[okc[0]].n + ' ' + rec + ' to bag', 'act:add:' + p.id + '|' + okc[0] + '|' + rec)].concat(okc.length < p.colors.length ? [B('Alert me for the rest', 'act:alert:' + p.id + '|' + p.colors.map(function (c, k) { return k; }).filter(function (k) { return okc.indexOf(k) < 0; })[0] + '|' + rec)] : [B('What goes with it?', 'act:look:' + p.id)]) : [B('Alert me when it’s back', 'act:alert:' + p.id + '|' + ci + '|' + rec)] }],
          buttons: [B('Free exchanges?', 'say:exchange policy'), B('Something else', 'menu')] });
        lead(bot, 'size_advice', { product: p.name, usual: s.usual, fit: s.fit, recommended: rec });
      } },
      track: { intent: 'track', slots: [
        { name: 'orderId', ask: function (bot) { var s = who(bot), mine = s && NL().db().orders.filter(function (o) { return o.email === s.email; }).slice(0, 3); bot.say('Of course. What’s the order number? It’s on your confirmation email and looks like **NL-10471**.', { buttons: (mine && mine.length ? mine.map(function (o) { return B(o.id, 'slot:orderId=' + o.id); }) : [B('Use order ' + NL().demo().order, 'slot:orderId=' + NL().demo().order)]).concat([B('I can’t find it', 'say:I cannot find my order number')]) }); }, parse: orderFrom, hint: 'Order numbers look like NL-10471.' },
        { name: 'email', ask: function (bot, s) { var se = who(bot), o = NL().findOrder(s.orderId); if (se && o && o.email === se.email) { bot.slots.email = se.email; bot._advance(); return; } bot.say('Thanks. For your privacy, which email did you check out with?', o && o.email === NL().demo().email ? { buttons: [B('Use ' + NL().demo().email, 'slot:email=' + NL().demo().email)] } : undefined); }, parse: function (t) { return N.email(t); }, hint: 'The email address you used at checkout, like name@example.com.' }
      ], done: function (bot, s) {
        var X = NL(), o = X.findOrder(s.orderId, s.email);
        if (!o) { bot.say(X.findOrder(s.orderId) ? 'I found **' + s.orderId + '**, but not with that email. Use the address you checked out with.' : 'I couldn’t find **' + s.orderId + '**. Check the number on your confirmation email.', { buttons: [B('Try again', 'flow:track'), B('Use order ' + X.demo().order, 'act:track:' + X.demo().order), B('Talk to a person', 'handover')] }); return; }
        bot.user.name = bot.user.name || o.name; bot.user.email = o.email; bot.mem.order = o.id;
        var stg = X.stage(o), head = { placed: 'is confirmed and being packed by hand at the Jaipur studio', packed: 'is packed and waiting for the courier', shipped: 'is on its way', out: 'is out for delivery today', delivered: 'has been delivered', cancelled: 'was cancelled' }[stg];
        bot.say(o.name.split(' ')[0] + ', **' + o.id + '** ' + head + '. ' + (stg === 'delivered' || stg === 'cancelled' ? '' : 'Expected: **' + X.etaText(o) + '**.'), { cards: [trackCard(o)], buttons: eligible(o) ? [B('Start a return', 'act:ret:' + o.id), B('That’s all', 'say:bye')] : [B('Change the address', 'handover'), B('That’s all', 'say:bye')] });
        bot.event('booking', { kind: 'order_lookup' }); lead(bot, 'order_status', { order: o.id, stage: stg }, { name: o.name, email: o.email });
      } },
      returns: { intent: 'returns', slots: [
        { name: 'orderId', ask: function (bot) { var s = who(bot), el = s && NL().db().orders.filter(function (o) { return o.email === s.email && eligible(o); }).slice(0, 3); if (bot.mem.order && !el) el = [NL().order(bot.mem.order)].filter(eligible); bot.say(el && el.length ? 'Which order is it? These can still be returned:' : 'Sorry it didn’t work out. Which order is it? The number looks like **NL-10471**.', { buttons: el && el.length ? el.map(function (o) { return B(o.id + ' · ' + o.items[0].name, 'slot:orderId=' + o.id); }) : [B('Use order ' + demoReturnable(), 'slot:orderId=' + demoReturnable())] }); }, parse: orderFrom, hint: 'Order numbers look like NL-10471.' },
        { name: 'email', ask: function (bot, s) { var se = who(bot), o = NL().findOrder(s.orderId); if ((se && o && o.email === se.email) || (bot.user.email && o && o.email === bot.user.email)) { bot.slots.email = o.email; bot._advance(); return; } bot.say('And the email you checked out with?', o && o.email === NL().demo().email ? { buttons: [B('Use ' + o.email, 'slot:email=' + o.email)] } : undefined); }, parse: function (t) { return N.email(t); }, hint: 'The email address you used at checkout.' },
        { name: 'item', ask: function (bot, s) {
          var X = NL(), o = X.findOrder(s.orderId, s.email);
          if (!o) { bot.say('That order and email don’t match. Try again, or I can bring in a person.', { buttons: [B('Try again', 'flow:returns'), B('Talk to a person', 'handover')] }); bot.endFlow(); return; }
          var el = eligible(o); bot.user.name = bot.user.name || o.name; bot.user.email = o.email;
          if (!el) { var rt = X.openReturn(o), stg = X.stage(o); bot.say(rt ? 'There’s already a return open on **' + o.id + '** (' + rt.id + ', ' + rt.st + '). I’ll keep you posted on it.' : stg !== 'delivered' ? '**' + o.id + '** hasn’t been delivered yet (' + X.STGL[stg].toLowerCase() + '). Once it arrives you have 30 days.' : '**' + o.id + '** is past our 30-day window. A person can look at an exception for you.', { buttons: [B('Talk to a person', 'handover'), B('Something else', 'menu')] }); bot.endFlow(); return; }
          if (el.lines.length === 1) { bot.slots.item = String(el.lines[0].i); bot._advance(); return; }
          bot.say('Which piece are you sending back? You have **' + el.left + ' days** left.', { buttons: el.lines.map(function (l) { var it = o.items[l.i]; return B(it.name + (it.s !== 'One size' ? ' (' + it.s + ')' : ''), 'slot:item=' + l.i); }) });
        }, parse: function (t, bot, s) { var o = NL().findOrder(s.orderId), hit; if (!o) return undefined; o.items.forEach(function (it, i) { if (hi(t).indexOf(it.name.toLowerCase().split(' ')[0]) >= 0) hit = String(i); }); return hit; } },
        { name: 'reason', ask: function (bot) { bot.say('What went wrong? It helps the studio more than you’d think.', { buttons: NL().RETR.map(function (r, i) { return B(r, 'slot:reason=' + i); }) }); }, parse: function (t) { t = hi(t); var i = /small|tight|short/.test(t) ? 0 : /big|large|loose|long|baggy/.test(t) ? 1 : /expect|look|feel/.test(t) ? 2 : /mind|dont like|don't like|no longer/.test(t) ? 3 : /damag|broken|torn|tear|fault|defect|split|hole/.test(t) ? 4 : /colou?r|shade|photo/.test(t) ? 5 : -1; return i < 0 ? undefined : String(i); } },
        { name: 'method', ask: function (bot) { bot.say('How would you like the money back?', { buttons: [B('Original payment', 'slot:method=original'), B('Store credit, instantly', 'slot:method=credit')] }); }, parse: function (t) { t = hi(t); return /credit|voucher|wallet/.test(t) ? 'credit' : /original|card|upi|refund|bank|money/.test(t) ? 'original' : undefined; } },
        { name: 'confirm', ask: function (bot, s) { var o = NL().findOrder(s.orderId), it = o.items[+s.item]; bot.say('So that’s the **' + it.name + '**' + (it.s !== 'One size' ? ' (' + it.s + ')' : '') + ' from ' + o.id + ', because “' + NL().RETR[+s.reason].toLowerCase() + '”, refunded to ' + (s.method === 'credit' ? 'store credit' : o.pay.d || 'your original payment') + '. We collect it from your door for free. Shall I book it?', { buttons: [B('Yes, book the pickup', 'slot:confirm=yes'), B('Not yet', 'slot:confirm=no')] }); }, parse: function (t) { var y = N.yesno(hi(t)); return y === undefined ? undefined : y ? 'yes' : 'no'; } }
      ], done: function (bot, s) {
        var X = NL(), o = X.findOrder(s.orderId, s.email); if (!o) return;
        if (s.confirm !== 'yes') { bot.say('No problem, nothing is booked. You still have time; just ask when you’re ready.', { buttons: MENU.slice(0, 3) }); return; }
        var it = o.items[+s.item], r = X.requestReturn(o, { lines: [{ i: +s.item, q: 1, reason: X.RETR[+s.reason] }], method: s.method, note: 'Started in the website chat', by: 'customer' });
        if (!r.ok) { bot.say(r.msg + ' Let me bring in a person.', { buttons: [B('Talk to a person', 'handover')] }); return; }
        var rt = r.rma, val = X.returnValue(o, rt);
        bot.say('Done. Your return is booked.', { cards: [{ title: rt.id + ' · Pickup booked', sub: it.name + (it.s !== 'One size' ? ', ' + it.s : '') + ' · ' + X.RETR[+s.reason], img: img(prod(it.pid)), price: R(val), priceLabel: s.method === 'credit' ? 'to store credit' : 'refund', meta: ['Pickup ' + X.fD(rt.pickup) + ', 10 am to 6 pm', 'Pack it in the original bag, tags on', s.method === 'credit' ? 'Credit lands the moment it’s collected' : 'Refund 5 to 7 working days after it reaches us'], buttons: [B('Track the return', 'act:trackpage:' + o.id)] }], buttons: [B('Find a replacement', 'intent:find'), B('That’s all', 'say:bye')] });
        bot.event('booking', { kind: 'return' }); lead(bot, 'return', { order: o.id, rma: rt.id, item: it.name, reason: X.RETR[+s.reason], method: s.method, value: val }, { name: o.name, email: o.email });
      } },
      restock: { intent: 'restock', slots: [
        { name: 'product', ask: function (bot) { var out = products().filter(function (p) { return NL().variants(p).some(function (v) { return !v.avail; }); }).slice(0, 5); bot.say('Which piece are you waiting for?', { buttons: out.map(function (p) { return B(p.name, 'slot:product=' + p.id); }) }); }, parse: function (t) { var p = productFrom(t); return p ? p.id : undefined; }, hint: 'Tell me the piece, like “Coast Sunglasses”.' },
        { name: 'colour', ask: function (bot, s) { var p = prod(s.product); if (p.colors.length === 1) { bot.slots.colour = '0'; bot._advance(); return; } bot.say('Which colour?', { buttons: p.colors.map(function (c, i) { var a = NL().variants(p).filter(function (v) { return v.c === i; }).reduce(function (x, v) { return x + v.avail; }, 0); return B(c.n + (a ? '' : ' · sold out'), 'slot:colour=' + i); }) }); }, parse: function (t, bot, s) { var c = colourFrom(t, prod(s.product)); return c === undefined ? undefined : String(c); } },
        { name: 'size', ask: function (bot, s) { var p = prod(s.product); if (p.sizes.length === 1) { bot.slots.size = p.sizes[0]; bot._advance(); return; } bot.say('And the size?', { buttons: p.sizes.map(function (z) { var v = stateOf(p, +s.colour, z); return B(z + (v.avail ? '' : ' · sold out'), 'slot:size=' + z); }) }); }, parse: function (t, bot, s) { return sizeFrom(t, prod(s.product)); } },
        { name: 'email', ask: function (bot, s) { var p = prod(s.product), v = stateOf(p, +s.colour, s.size); if (v.avail) { bot.slots.email = '-'; bot._advance(); return; } var se = who(bot); if (se || bot.user.email) { bot.slots.email = (se && se.email) || bot.user.email; bot._advance(); return; } bot.say('Where shall I send the alert? Your email is enough, and we only use it for this.'); }, parse: function (t) { return N.email(t); }, hint: 'An email address, like name@example.com.' }
      ], done: function (bot, s) {
        var X = NL(), p = prod(s.product), ci = +s.colour, key = X.skuKey(p.id, ci, s.size), v = X.stock(key), label = p.colors[ci].n + (p.sizes.length > 1 ? ', ' + s.size : '');
        if (v.avail) { bot.say('Good news: the **' + p.name + '** in ' + label + ' is in stock right now' + (v.avail <= 3 ? ', but only ' + v.avail + ' left' : '') + '.', { buttons: window.NLS ? [B('Add it to my bag', 'act:add:' + p.id + '|' + ci + '|' + s.size), B('Something else', 'menu')] : [B('View the piece', 'act:view:' + p.id)] }); return; }
        X.alertMe(key, s.email); bot.user.email = s.email;
        bot.say('You’re on the list. The moment it lands at the studio, we’ll email **' + s.email + '**.', { cards: [{ title: p.name, sub: label + ' · alert set', img: img(p), price: R(p.price), meta: [v.inc && v.inc.eta ? 'Next delivery due ' + X.fD(v.inc.eta) : 'Being remade at the workshop', (v.alerts + 1) + ' ' + (v.alerts ? 'people are' : 'person is') + ' waiting', 'We hold nothing back, so be quick'], buttons: [B('See it in stock elsewhere', 'act:stock:' + p.id)] }], buttons: [B('Find something similar', 'say:show me ' + TYPE[p.id]), B('That’s all', 'say:bye')] });
        bot.event('booking', { kind: 'restock_alert' }); lead(bot, 'restock_alert', { product: p.name, variant: label, sku: X.skuCode(key), eta: v.inc && v.inc.eta ? X.fD(v.inc.eta) : '' }, { email: s.email });
      } },
      delivery: { intent: 'delivery', slots: [
        { name: 'pin', ask: function (bot) { bot.say('What’s your 6-digit pincode?', { buttons: [B('560038 · Bengaluru', 'slot:pin=560038'), B('400050 · Mumbai', 'slot:pin=400050'), B('302001 · Jaipur', 'slot:pin=302001')] }); }, parse: function (t) { var m = String(t).match(/\b(\d{6})\b/); return m ? m[1] : undefined; }, validate: function (v) { var r = NL().pin(v); return r.ok ? '' : r.msg; }, hint: 'Six digits, like 560038.' }
      ], done: function (bot, s) {
        var X = NL(), p = X.pin(s.pin); if (!p.ok) { bot.say(p.msg, { buttons: [B('Try again', 'intent:delivery')] }); return; }
        var sub = 0; try { sub = window.NLS ? NLS.subtotal() : 0; } catch (e) {} var pr = bot.ctx.id && prod(bot.ctx.id); if (!sub && pr) sub = pr.price;
        var opts = X.shipOptions(p, sub || 6000), where = (p.city ? p.city + ', ' : '') + p.state;
        bot.say('To **' + s.pin + '** (' + where + '):\n' + opts.map(function (o) { return '**' + o.label + '**: ' + X.winText(o) + ', ' + (o.fee ? R(o.fee) : 'free') + '.'; }).join('\n') + '\n' + (p.cod ? 'Cash on delivery is available here, up to ₹10,000.' : 'Cash on delivery isn’t available to this pincode, but UPI and cards are.'), { buttons: [B('Find me something', 'intent:find'), B('How returns work', 'say:return policy')] });
        bot.mem.pin = s.pin; lead(bot, 'delivery_check', { pin: s.pin, city: p.city || p.state, zone: p.zone });
      } },
      edit: { slots: [
        { name: 'email', ask: function (bot) { var se = who(bot); if (se || bot.user.email) { bot.slots.email = (se && se.email) || bot.user.email; bot._advance(); return; } bot.say('Where shall I send it? Just your email.'); }, parse: function (t) { return N.email(t); }, hint: 'An email address, like name@example.com.' }
      ], done: function (bot, s) {
        var ids = bot.mem.lastEdit || [], names = ids.map(function (id) { var p = prod(id); return p ? p.name : id; }); bot.user.email = s.email;
        bot.say('Sent to **' + s.email + '**: ' + (names.join(', ') || 'your edit') + ', with sizes and today’s stock. A stylist can follow up if you’d like.', { buttons: [B('Yes, a stylist call', 'handover'), B('No thanks', 'say:bye')] });
        lead(bot, 'saved_edit', { pieces: names.join(', ') }, { email: s.email });
      } }
    },
    actions: {
      view: function (bot, id) { var p = prod(id); if (!p) return; go(bot, storeUrl('product.html?id=' + id), 'Opening the **' + p.name + '**. I’ll stay right here.'); },
      goto: function (bot, page) { go(bot, storeUrl(page), 'Taking you there…'); },
      size: function (bot, id) { bot.startFlow('size', { product: id }); },
      stock: function (bot, id) { var p = prod(id); if (p) stockReply(bot, p, bot.mem.size && bot.mem.size.product === id ? bot.mem.size.size : undefined); },
      look: function (bot, id) { var p = prod(id); if (!p) return; var L = (p.look || []).map(prod).filter(Boolean); bot.say('How the studio wears the **' + p.name + '**:', { cards: L.map(function (x) { return card(x); }), buttons: [B('Size help', 'act:size:' + p.id), B('Something else', 'menu')] }); },
      add: function (bot, arg) {
        var a = arg.split('|'), p = prod(a[0]), ci = +a[1], sz = a.slice(2).join('|'); if (!p) return;
        if (!window.NLS) { bot.say('Open the piece to add it to your bag.', { buttons: [B('View the piece', 'act:view:' + p.id)] }); return; }
        var r = NLS.add(p.id, ci, sz, 1, true); if (!r.ok) { bot.say(r.msg, { buttons: [B('Alert me when it’s back', 'act:alert:' + arg)] }); return; }
        bot.say('Added: **' + p.name + '**, ' + p.colors[ci].n + (p.sizes.length > 1 ? ', ' + sz : '') + '. Your bag is at ' + R(NLS.subtotal()) + (NLS.subtotal() >= 5000 ? ', so delivery is free.' : ', ' + R(5000 - NLS.subtotal()) + ' away from free delivery.'), { buttons: [B('Open my bag', 'act:bag:1'), B('What goes with it?', 'act:look:' + p.id)] });
        bot.event('action', { action: 'add_to_bag' });
      },
      bag: function () { if (window.NLS) NLS.openCart(); },
      alert: function (bot, arg) { var a = arg.split('|'); bot.startFlow('restock', { product: a[0], colour: a[1], size: a.slice(2).join('|') }); },
      track: function (bot, id) { var o = NL().findOrder(id); bot.startFlow('track', { orderId: id, email: o && o.email === NL().demo().email ? o.email : undefined }); },
      trackpage: function (bot, id) { var o = NL().findOrder(id); go(bot, O.samples('orders/track.html?o=' + encodeURIComponent(id) + (o ? '&e=' + encodeURIComponent(o.email) : '')), 'Opening live tracking for **' + id + '**…'); },
      ret: function (bot, id) { var o = NL().findOrder(id); bot.startFlow('returns', { orderId: id, email: o ? o.email : undefined }); }
    },
    freeText: function (bot, m) {
      if (m.ent.email && String(m.text).trim().length < 60) { bot.user.email = m.ent.email; bot.say('Noted. I’ll use **' + m.ent.email + '** for anything I send you.', { buttons: MENU.slice(0, 4) }); return true; }
      var p = m.ent.product && prod(m.ent.product); if (p) { bot.say('The **' + p.name + '**, ' + R(p.price) + '. What would you like to know?', { cards: [card(p)], buttons: [B('Is it in stock?', 'act:stock:' + p.id), B('What goes with it?', 'act:look:' + p.id)] }); return true; }
      var r = search(m.text); if (r.any && r.list.length) { results(bot, r); return true; }
      return false;
    },
    kb: [
      { id: 'ship', q: 'How much is delivery?', a: 'Standard delivery is **free over ₹5,000**, otherwise ₹149. Express is ₹349, and same-day in Jaipur is ₹199 if you order by 2 pm.', keys: ['shipping cost', 'delivery charge', 'free delivery', 'free shipping', 'delivery fee', 'shipping fee', 'how much is delivery'] },
      { id: 'times', q: 'How long does delivery take?', a: 'Metros take **3 to 4 working days** standard, or 1 to 2 by express. Other cities take 4 to 6 days, and the hills and the North East 6 to 9. Give me your pincode for exact dates.', keys: ['how long', 'delivery time', 'shipping time', 'how many days', 'when will i get it'], buttons: [B('Check my pincode', 'intent:delivery')] },
      { id: 'cod', q: 'Do you take cash on delivery?', a: 'Yes, up to **₹10,000** per order, for a ₹49 fee. It isn’t available to a few remote pincodes; UPI and cards work everywhere.', keys: ['cash on delivery', 'cod', 'pay on delivery', 'cash'] },
      { id: 'returns', q: 'What is your return policy?', a: 'You have **30 days** from delivery. Unworn, tags on, and we collect it from your door for free. Refunds go back to your original payment in 5 to 7 working days, or to store credit instantly.', keys: ['return policy', 'returns policy', 'how do returns work', 'can i return', 'return window'], buttons: [B('Start a return', 'flow:returns')] },
      { id: 'exchange', q: 'Can I exchange for another size?', a: 'Yes. Start a return and pick store credit: it lands the moment the courier collects, so you can reorder the right size straight away. Tell us in the note and we’ll hold your new size for 48 hours.', keys: ['exchange policy', 'exchange', 'swap size', 'different size', 'size exchange'], buttons: [B('Start a return', 'flow:returns'), B('Which size?', 'intent:size')] },
      { id: 'refund', q: 'When will I get my refund?', a: 'Once your parcel reaches the studio and we’ve checked it, usually within a day, the refund goes out. Banks take **5 to 7 working days** to show it; store credit is instant.', keys: ['refund time', 'when refund', 'refund status', 'money back', 'refund kab'] },
      { id: 'pay', q: 'Which payment methods do you accept?', a: 'UPI, all major cards, net banking and cash on delivery.', keys: ['payment methods', 'pay with', 'upi', 'credit card', 'debit card', 'net banking', 'emi'] },
      { id: 'care', q: 'How do I care for my pieces?', a: 'Cotton: cold wash, hang to dry. Knits: hand wash, dry flat. Leather: wipe clean and condition twice a year. Each piece has its own note on its page.', keys: ['wash', 'care', 'washing', 'dry clean', 'look after', 'leather care'] },
      { id: 'made', q: 'Where are your clothes made?', a: 'In small workshops around Jaipur, in organic cotton, merino blends and vegetable-tanned leather. We cut in small runs, which is why some sizes sell out before they’re remade.', keys: ['where made', 'made in', 'materials', 'sustainable', 'organic', 'ethical', 'sourcing'] },
      { id: 'gift', q: 'Do you gift wrap?', a: 'Yes, for ₹150: recycled paper, cotton tape and a handwritten note. Add it at checkout. Prices never appear in the parcel.', keys: ['gift wrap', 'gift wrapping', 'wrap it', 'gift note', 'gift message'] },
      { id: 'intl', q: 'Do you ship outside India?', a: 'Not yet. We deliver to every serviceable pincode in India. International delivery is planned for next year.', keys: ['international', 'ship abroad', 'outside india', 'overseas', 'usa', 'uk delivery', 'dubai'] },
      { id: 'studio', q: 'Can I visit the studio?', a: 'Yes. The Jaipur studio is open Tuesday to Sunday, 11 am to 8 pm, with try-ons by appointment. I can ask the team to set one up.', keys: ['visit', 'store location', 'shop address', 'studio address', 'try on', 'offline store', 'showroom', 'jaipur'], buttons: [B('Book a try-on', 'handover')] },
      { id: 'alter', q: 'Do you do alterations?', a: 'We hem Easy Trousers for free at the Jaipur studio. Elsewhere, any good tailor can take them up; there’s 4 cm of turn-up allowance.', keys: ['alteration', 'alterations', 'hem', 'tailor', 'shorten', 'length'] },
      { id: 'codes', q: 'Do you have any discount codes?', a: 'Sign up to the newsletter for **10% off your first order** (WELCOME10). Seasonal codes appear on the home page when they run.', keys: ['discount', 'coupon', 'promo code', 'offer', 'sale', 'code'] },
      { id: 'watch', q: 'Is there a warranty on the watch?', a: 'The Meridian 38 has a **two-year** warranty on the movement and is water resistant to 30 m: fine for rain and washing up, not for swimming.', keys: ['warranty', 'guarantee', 'watch warranty', 'water resistant', 'waterproof'] },
      { id: 'cancel', q: 'Can I cancel or change my order?', a: 'Until it’s packed, yes. Orders are usually packed within a working day, so ask quickly and a person will sort it.', keys: ['cancel my order', 'cancel order', 'change my order', 'change address', 'wrong address', 'modify order'], buttons: [B('Talk to a person', 'handover')] },
      { id: 'hours', q: 'When can I talk to someone?', a: 'Client care is in **10 am to 7 pm, Monday to Saturday**. I’m here around the clock, and I’ll pass anything I can’t solve to them with the full conversation.', keys: ['opening hours', 'working hours', 'customer care', 'contact', 'phone number', 'email address', 'call you'] },
      { id: 'guide', q: 'Do you have a size guide?', a: 'Every product page has the measurements, and I can do better: tell me your usual size and how you like things to fit, and I’ll check it against today’s stock.', keys: ['size guide', 'size chart', 'measurements chart'], buttons: [B('Which size?', 'intent:size')] }
    ]
  });
  function daypart() { var h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; }
  function demoReturnable() { var X = NL(), d = X.demo(), L = X.db().orders.filter(function (o) { return o.email === d.email && eligible(o); }); return L[0] ? L[0].id : d.order; }
})();
