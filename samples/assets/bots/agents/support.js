/* Agent: Northlane Support (fictional clothing and accessories store). Orders, returns, size advice, product finder, restock alerts, FAQ.
   Seed data is copied (condensed) from the Northlane catalogue and orders demo. Demo only: nothing leaves the browser. */
(function () {
  'use strict';
  var O = window.Orbit, N = O.nlp, B = function (l, v) { return { label: l, value: v }; };
  var C = function (n) { return n; };
  var CAT = [
    { id: 'harbor-jacket', name: 'Harbor Jacket', cat: 'Clothing', type: 'jacket', price: 210, sizes: ['XS', 'S', 'M', 'L'], colors: ['Rust', 'Navy', 'Black'], fit: 'slim', blurb: 'Water-resistant cotton twill bomber' },
    { id: 'atelier-tote', name: 'Atelier Tote', cat: 'Bags', type: 'bag', price: 185, sizes: ['One size'], colors: ['Cognac', 'Black', 'Bone'], blurb: 'Full-grain leather, fits a 14 inch laptop' },
    { id: 'meridian-38', name: 'Meridian 38', cat: 'Accessories', type: 'watch', price: 240, sizes: ['38 mm'], colors: ['Ivory dial', 'Navy dial', 'Forest dial'], blurb: 'Steel watch, sapphire-coated crystal' },
    { id: 'coast-sunglasses', name: 'Coast Sunglasses', cat: 'Accessories', type: 'sunglasses', price: 95, sizes: ['One size'], colors: ['Tortoise', 'Black', 'Honey'], blurb: 'Polarised acetate frames' },
    { id: 'drift-runner', name: 'Desert Boot', cat: 'Shoes', type: 'boot', price: 148, sizes: ['40', '41', '42', '43', '44', '45'], colors: ['Olive', 'Sand', 'Charcoal'], fit: 'true', blurb: 'Suede upper on a crepe sole' },
    { id: 'court-low', name: 'Sage Brogue', cat: 'Shoes', type: 'sneaker', price: 138, sizes: ['39', '40', '41', '42', '43', '44'], colors: ['Sage', 'Black', 'Chalk'], fit: 'small', blurb: 'Low-profile leather court shoe' },
    { id: 'field-cap', name: 'Field Cap', cat: 'Accessories', type: 'cap', price: 42, sizes: ['One size'], colors: ['White', 'Stone', 'Navy'], blurb: 'Washed cotton six-panel cap' },
    { id: 'mini-crossbody', name: 'Mini Crossbody', cat: 'Bags', type: 'bag', price: 120, sizes: ['One size'], colors: ['Tan', 'Black', 'Sand'], blurb: 'Small leather bag with a long strap' },
    { id: 'everyday-tee', name: 'Everyday Tee', cat: 'Clothing', type: 'tee', price: 38, sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: ['White', 'Clay', 'Ink'], fit: 'true', blurb: 'Heavy organic cotton tee' },
    { id: 'loop-hoodie', name: 'Loop Hoodie', cat: 'Clothing', type: 'hoodie', price: 88, sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: ['White', 'Oat', 'Charcoal'], fit: 'roomy', blurb: 'Loopback cotton, relaxed fit' },
    { id: 'easy-trousers', name: 'Easy Trousers', cat: 'Clothing', type: 'trousers', price: 96, sizes: ['XS', 'S', 'M', 'L'], colors: ['Sage', 'Stone', 'Black'], fit: 'true', blurb: 'Drawstring linen-blend trousers' },
    { id: 'rib-knit', name: 'Rib Knit', cat: 'Clothing', type: 'knit', price: 110, sizes: ['XS', 'S', 'M', 'L'], colors: ['Moss', 'Cream', 'Rose'], fit: 'slim', blurb: 'Fitted merino-blend rib sweater' }
  ];
  var BY = {}; CAT.forEach(function (p) { BY[p.id] = p; });
  var COLORFAM = { white: ['white', 'chalk', 'ivory', 'bone', 'cream', 'oat'], black: ['black', 'ink', 'charcoal'], green: ['sage', 'olive', 'moss', 'forest'], blue: ['navy'], brown: ['tan', 'cognac', 'tortoise', 'sand', 'stone', 'clay', 'honey', 'rust'], pink: ['rose'] };
  var STATUS = ['placed', 'packed', 'shipped', 'out', 'delivered'], LABEL = { placed: 'Order placed', packed: 'Packed', shipped: 'Shipped', out: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled' };
  var H = 36e5, DAY = 864e5;
  var CUST = ['Priya Nair', 'Tom Whitaker', 'Chloe Bennett', 'Marcus Reid', 'Sofia Alvarez', 'Daniel Cho', 'Hannah Berg', 'Oliver Grant', 'Aisha Rahman', 'Lucas Moreau', 'Maya Okafor', 'Ethan Brooks', 'Grace Liu', 'Noah Fischer', 'Isla Campbell', 'Rafael Costa', 'Zoe Hartman', 'Amir Haddad', 'Emma Larsson', 'Kenji Sato', 'Charlotte Dubois', 'Ben Okonkwo'];
  var STAT = ['placed', 'placed', 'packed', 'packed', 'shipped', 'shipped', 'out', 'shipped', 'out'];
  var AGO = [3, 5, 22, 30, 52, 61, 74, 90, 98, 120, 150, 190, 230, 270, 300, 340, 380, 440, 520, 600, 700, 800];
  var LOW = { 'drift-runner|42': 2, 'harbor-jacket|M': 3, 'coast-sunglasses|Honey': 0, 'court-low|Chalk|41': 1 };

  function seedOrders() {
    var r = O.rng(20482), now = Date.now(), out = [];
    CUST.forEach(function (n, k) {
      var st = k < STAT.length ? STAT[k] : 'delivered', i = STATUS.indexOf(st), pool = CAT.slice(), items = [], cnt = 1 + (r() < .4) + (r() < .12), t0 = now - AGO[k] * H;
      while (cnt-- > 0) { var p = pool.splice(Math.floor(r() * pool.length), 1)[0]; items.push({ id: p.id, color: p.colors[Math.floor(r() * p.colors.length)], size: p.sizes[Math.floor(r() * p.sizes.length)], qty: 1 }); }
      if (k === 12) items = [{ id: 'harbor-jacket', color: 'Rust', size: 'M', qty: 1 }, { id: 'field-cap', color: 'Navy', size: 'One size', qty: 1 }];
      var sub = items.reduce(function (a, it) { return a + BY[it.id].price * it.qty; }, 0), express = r() < .3, ev = { placed: t0 };
      if (i >= 1) ev.packed = t0 + (3 + r() * 5) * H; if (i >= 2) ev.shipped = ev.packed + (8 + r() * 12) * H; if (i >= 3) ev.out = ev.shipped + (30 + r() * 20) * H; if (i >= 4) ev.delivered = ev.out + (4 + r() * 5) * H;
      var ts = Object.keys(ev); ts.forEach(function (key) { ev[key] = Math.min(ev[key], now - 25 * 6e4 * (STATUS.indexOf(key) === i ? 1 : 0.2)); });
      out.push({ id: 'NL-' + (10492 - k), name: n, email: n.toLowerCase().replace(/\s+/g, '.') + '@example.com', items: items, ship: express ? 18 : (sub >= 150 ? 0 : 8), express: express, status: st, ev: ev, total: sub + (express ? 18 : (sub >= 150 ? 0 : 8)), tracking: i >= 2 ? (express ? 'AP' : 'PW') + String(Math.floor(r() * 1e9)).padStart(9, '0') : null, carrier: express ? 'Arrowpost Express' : 'Parcelwise Standard', base: now });
    });
    return out;
  }
  function seedStock() { var r = O.rng(99), s = {}; CAT.forEach(function (p) { p.colors.forEach(function (c) { p.sizes.forEach(function (z) { s[p.id + '|' + c + '|' + z] = 6 + Math.floor(r() * 30); }); }); }); s['drift-runner|Olive|42'] = 2; s['harbor-jacket|Rust|M'] = 3; s['harbor-jacket|Rust|S'] = 0; s['coast-sunglasses|Honey|One size'] = 0; s['court-low|Chalk|41'] = 0; s['loop-hoodie|Oat|L'] = 0; return s; }

  function money(n) { return '$' + (n % 1 ? n.toFixed(2) : n); }
  function dshort(ts) { return O.fmtDay(new Date(ts)); }
  function findOrder(bot, id) { var u = String(id).toUpperCase(); return bot.db('orders').filter(function (o) { return o.id === u; })[0]; }
  function shift(o) { // keep the demo live: timestamps slide forward by whole days since seeding
    var d = Math.floor((Date.now() - o.base) / DAY); return d > 0 && o.status !== 'delivered' ? d * DAY : 0;
  }
  function eta(o) { var now = Date.now(); if (o.status === 'delivered') return 'Delivered ' + dshort(o.ev.delivered); if (o.status === 'cancelled') return 'Cancelled'; if (o.status === 'out') return 'Arriving today'; var from = o.ev.placed + (o.express ? 2 : 4) * DAY; if (from < now + DAY) from = now + (o.express ? 1 : 2) * DAY; return 'Estimated ' + dshort(from) + (o.express ? '' : ' to ' + dshort(from + DAY)); }
  function productCard(p, extra) { return { title: p.name, sub: p.blurb, img: O.samples('store/products/' + p.id + '.jpg'), price: money(p.price), meta: [p.cat, p.colors.length + ' colours'].concat(extra || []), buttons: [B('Sizes & stock', 'act:stock:' + p.id), B('Size advice', 'act:size:' + p.id)] }; }
  function productFromText(norm) { var best = null, bs = 0; CAT.forEach(function (p) { var t = N.content(p.name + ' ' + p.type), q = N.content(norm), s = 0; t.forEach(function (w) { if (q.indexOf(w) >= 0) s++; }); if (norm.indexOf(p.name.toLowerCase()) >= 0) s += 3; if (norm.indexOf(p.type) >= 0) s += 1; if (s > bs) { bs = s; best = p; } }); return bs >= 1 ? best : null; }
  function parseSize(text, p) {
    var t = String(text).toUpperCase(), m; if ((m = t.match(/\b(XXS|XS|XL|XXL|S|M|L)\b/))) return m[1]; if ((m = t.match(/\b(?:SIZE\s*)?(3[6-9]|4[0-6])\b/))) return m[1];
    if ((m = String(text).toLowerCase().match(/\buk\s*(\d{1,2}(?:\.5)?)\b/))) return String(Math.round(+m[1] + 34)); if ((m = String(text).toLowerCase().match(/\bus\s*(?:m\s*)?(\d{1,2}(?:\.5)?)\b/))) return String(Math.round(+m[1] + 33)); return undefined;
  }

  O.registerAgent({
    id: 'support', name: 'Northlane Support', business: 'Northlane', role: 'E-commerce support', industry: 'Retail', initials: 'NL', accent: '#C8FF4D', phoneLabel: 'Northlane customer line',
    blurb: 'Tracks orders, starts returns and exchanges, advises on size, finds products from a typed brief and sets restock alerts.',
    helloLine: 'I can track an order, start a return, advise on size or find something to wear.',
    samples: ['white sneakers under $150', 'where is my order NL-10480', 'is the harbor jacket in stock in S', 'I want to return my jacket'],
    kind: 'customer', contexts: [{ label: 'Just browsing', context: {} }, { label: 'Viewing the Harbor Jacket', context: { product: 'harbor-jacket' } }, { label: 'Viewing the Desert Boot', context: { product: 'drift-runner' } }],
    synonyms: { sneaker: ['sneakers', 'trainers', 'trainer', 'kicks', 'runners', 'court shoes'], boot: ['boots', 'desert boots'], shoe: ['shoes', 'footwear'], jacket: ['jackets', 'bomber', 'coat', 'outerwear'], tee: ['tees', 't-shirt', 't shirt', 'tshirt', 'shirt'], bag: ['bags', 'handbag', 'purse', 'tote', 'backpack'], sunglasses: ['shades', 'sunnies', 'sunglass'], watch: ['watches', 'timepiece'], trousers: ['pants', 'trouser', 'chinos', 'bottoms'], hoodie: ['hoodies', 'sweatshirt', 'pullover'], knit: ['sweater', 'jumper', 'knitwear'], cap: ['hat', 'caps'], track: ['wismo', 'whereabouts'], refund: ['money back', 'reimburse'], 'return': ['send back', 'returns'], exchange: ['swap', 'replace'], restock: ['back in stock', 'notify me', 'let me know when', 'waitlist'] },
    seeds: { orders: seedOrders, stock: seedStock, returns: function () { return []; }, alerts: function () { return []; } },
    menu: [B('Track my order', 'intent:track_order'), B('Start a return', 'intent:returns'), B('Find me something', 'intent:find'), B('Size advice', 'intent:size'), B('Restock alert', 'intent:restock')],
    greeting: function (bot) {
      var p = bot.ctx.product && BY[bot.ctx.product];
      bot.say('Hi, I’m the Northlane assistant.' + (p ? ' I can see you are looking at the **' + p.name + '**.' : '') + ' ' + (p ? 'Ask me about sizing, stock or delivery for it, or anything else.' : 'I can track an order, start a return, advise on size or find something to wear.'),
        { buttons: p ? [B('Is it in stock?', 'act:stock:' + p.id), B('Which size should I get?', 'act:size:' + p.id)].concat(bot.agent.menu.slice(0, 3)) : bot.agent.menu });
    },
    extract: function (text, bot) {
      var e = {}, t = text.toLowerCase(), oid = N.orderId(text), em = N.email(text), m = N.money(text), p = productFromText(N.norm(text, bot.agent.synonyms));
      if (oid) e.orderId = oid; if (em) e.email = em; if (m) { if (m.max != null) e.maxPrice = m.max; if (m.min != null) e.minPrice = m.min; }
      if (p) e.product = p.id; var sz = parseSize(text, p); if (sz && /size|\b(xs|xl|xxl)\b|\bs\b|\bm\b|\bl\b|\buk\b|\bus\b|\b(3[6-9]|4[0-6])\b/i.test(text)) e.sizeValue = sz;
      var nt = N.norm(text, bot.agent.synonyms); if (/\bsneaker\b|\bshoe\b|\bboot\b/.test(nt)) e.cat = 'Shoes'; else if (/\bbag\b/.test(nt)) e.cat = 'Bags'; else if (/\b(jacket|tee|hoodie|trousers|knit)\b/.test(nt)) e.cat = 'Clothing'; else if (/\b(watch|sunglasses|cap)\b/.test(nt)) e.cat = 'Accessories';
      Object.keys(COLORFAM).forEach(function (c) { if (new RegExp('\\b' + c + '\\b').test(t)) e.color = c; });
      if (/\b(women|womens|ladies|her)\b/.test(t)) e.for = 'Women'; if (/\b(men|mens|him|guys)\b/.test(t)) e.for = 'Men';
      if (e.sizeValue) { e.usual = e.sizeValue; e.size = e.sizeValue; e.newSize = e.sizeValue; } if (/\b(snug|tight|slim|fitted)\b/.test(t)) e.pref = 'snug'; else if (/\b(roomy|loose|relaxed|oversize|baggy)\b/.test(t)) e.pref = 'roomy'; else if (/\b(regular|true to size)\b/.test(t)) e.pref = 'regular';
      var ty = nt.match(/\b(sneaker|boot|jacket|tee|hoodie|trousers|knit|bag|watch|sunglasses|cap)\b/); if (ty) e.type = ty[1];
      return e;
    },
    intents: [
      { id: 'track_order', label: 'Track my order', kw: ['track', 'where is my order', 'order status', 'my order', 'delivery status', 'when will it arrive', 'has it shipped', 'parcel', 'tracking number', 'eta', 'delivery date'], re: [/\bNL[- ]?\d{4,6}\b/i], flow: 'track', priority: 1 },
      { id: 'returns', label: 'Return or exchange', kw: ['return', 'exchange', 'refund', 'send back', 'wrong size', 'too small', 'too big', 'doesn\'t fit', 'does not fit', 'faulty', 'damaged', 'not what i ordered', 'rma'], flow: 'returns', priority: 1 },
      { id: 'size', label: 'Size advice', kw: ['size', 'sizing', 'fit', 'which size', 'what size', 'true to size', 'runs small', 'runs large', 'size guide', 'measurements'], flow: 'size', priority: 0 },
      { id: 'restock', label: 'Restock alert', kw: ['restock', 'back in stock', 'notify me', 'sold out', 'out of stock', 'alert me', 'when will you have'], flow: 'restock', priority: 1 },
      { id: 'stock', label: 'Check stock', kw: ['in stock', 'available', 'do you have', 'is it available', 'stock'], run: function (bot, m) { var p = BY[m.ent.product || bot.ctx.product]; if (!p) { bot.say('Which piece do you want me to check? Tell me the name, for example “Harbor Jacket in M”.'); return; } stockReply(bot, p, m.ent.sizeValue, m.ent.color); }, priority: 0 },
      { id: 'find', label: 'Find me something', kw: ['find', 'looking for', 'show me', 'recommend', 'suggest', 'under', 'below', 'budget', 'gift', 'something to wear', 'what do you have', 'browse', 'new arrivals', 'cheapest'], flow: 'find', priority: 0 },
      { id: 'cancel_order', label: 'Cancel an order', kw: ['cancel my order', 'cancel order', 'cancel the order', 'change my mind', 'ordered by mistake'], flow: 'cancel', priority: 2 }
    ],
    flows: {
      track: { intent: 'track_order', slots: [
        { name: 'orderId', ask: function (bot) { bot.say('Happy to check. What is your order number? It looks like **NL-10482**.', { buttons: [B('I can’t find it', 'say:I cannot find my order number')] }); }, parse: function (t) { return N.orderId(t); }, hint: 'Order numbers look like NL-10482. You will find yours in the confirmation email.' },
        { name: 'email', ask: function (bot) { bot.say('Thanks. For privacy, what email address was the order placed with?'); }, parse: function (t) { return N.email(t); }, hint: 'Please type the email address used at checkout, for example name@example.com.' }
      ], done: function (bot, s) {
        var o = findOrder(bot, s.orderId);
        if (!o || o.email !== s.email.toLowerCase()) { bot.say('I could not match **' + s.orderId + '** with that email. Check both and try again, or I can bring in a person.' + (bot.channel === 'web' ? ' (Demo tip: try NL-10480 with grace.liu@example.com.)' : ''), { buttons: [B('Try again', 'flow:track'), B('Talk to a person', 'handover')] }); return; }
        bot.mem.order = o.id; bot.user.email = o.email; bot.user.name = o.name; var d = shift(o), steps = STATUS.map(function (k) { return (o.ev[k] ? '✓ ' : '· ') + LABEL[k] + (o.ev[k] ? ' ' + dshort(o.ev[k] + d) : ''); }).join('\n');
        bot.say('Found it, ' + o.name.split(' ')[0] + '. **' + o.id + '** is **' + LABEL[o.status].toLowerCase() + '**. ' + eta(o) + '.' + (o.tracking ? '\nCarrier: ' + o.carrier + ', tracking ' + o.tracking + '.' : ''), { cards: [{ title: o.id + ' · ' + money(o.total), sub: o.items.map(function (it) { return BY[it.id].name + ' (' + it.color + ', ' + it.size + ')'; }).join(', '), meta: steps.split('\n'), img: O.samples('store/products/' + o.items[0].id + '.jpg'), buttons: o.status === 'delivered' ? [B('Start a return', 'intent:returns')] : o.status === 'placed' ? [B('Cancel this order', 'intent:cancel_order')] : [B('Talk to a person', 'handover')] }] });
        bot.say('Anything else on this order?', { buttons: o.status === 'delivered' ? [B('Start a return', 'intent:returns'), B('That’s all', 'say:bye')] : [B('Notify me when it ships', 'act:notify:' + o.id), B('That’s all', 'say:bye')] });
      } },
      cancel: { intent: 'cancel_order', slots: [
        { name: 'orderId', ask: function (bot) { bot.say('Which order do you want to cancel? Send me the order number.'); }, parse: function (t) { return N.orderId(t); } },
        { name: 'email', ask: function (bot) { bot.say('And the email used at checkout?'); }, parse: function (t) { return N.email(t); } },
        { name: 'confirm', ask: function (bot, s) { bot.say('Cancel **' + s.orderId + '**? Orders can only be cancelled before they are packed.', { buttons: [B('Yes, cancel it', 'slot:confirm=yes'), B('No, keep it', 'slot:confirm=no')] }); }, parse: function (t) { var y = N.yesno(t); return y === undefined ? undefined : (y ? 'yes' : 'no'); } }
      ], done: function (bot, s) {
        var all = bot.db('orders'), o = all.filter(function (x) { return x.id === String(s.orderId).toUpperCase(); })[0];
        if (s.confirm === 'no') { bot.say('Okay, your order stays as it is.'); bot.menu('Anything else?'); return; }
        if (!o || o.email !== String(s.email).toLowerCase()) { bot.say('I could not match that order and email. A person can check it for you.', { buttons: [B('Talk to a person', 'handover')] }); return; }
        if (o.status !== 'placed') { bot.say('**' + o.id + '** is already ' + LABEL[o.status].toLowerCase() + ', so it can’t be cancelled here. You can return it once it arrives.', { buttons: [B('How returns work', 'say:return policy'), B('Talk to a person', 'handover')] }); return; }
        o.status = 'cancelled'; bot.save('orders', all); bot.event('booking', { kind: 'order_cancel' }); bot.say('Done. **' + o.id + '** is cancelled and ' + money(o.total) + ' goes back to your original payment method within 3 to 5 working days. A confirmation email is on its way.'); bot.menu('Anything else?');
      } },
      returns: { intent: 'returns', slots: [
        { name: 'orderId', ask: function (bot) { bot.say(bot.mem.order ? 'Is this about **' + bot.mem.order + '**?' : 'Sure. What is the order number?', bot.mem.order ? { buttons: [B('Yes, ' + bot.mem.order, 'slot:orderId=' + bot.mem.order), B('A different order', 'say:different order')] } : undefined); }, parse: function (t) { return N.orderId(t); } },
        { name: 'email', ask: function (bot) { if (bot.user.email) { bot.slots.email = bot.user.email; bot._advance(); return; } bot.say('And the email address used at checkout?'); }, parse: function (t) { return N.email(t); } },
        { name: 'item', ask: function (bot, s) { var o = findOrder(bot, s.orderId); if (!o) { bot.say('I could not find that order. Check the number and try again.', { buttons: [B('Try again', 'flow:returns'), B('Talk to a person', 'handover')] }); bot.endFlow(); return; } if (o.email !== String(s.email).toLowerCase()) { bot.say('That email does not match the order. Please try again or ask for a person.', { buttons: [B('Try again', 'flow:returns'), B('Talk to a person', 'handover')] }); bot.endFlow(); return; } if (o.status !== 'delivered') { bot.say('**' + o.id + '** is still ' + LABEL[o.status].toLowerCase() + ', so it can’t be returned yet. ' + (o.status === 'placed' ? 'You can cancel it instead.' : 'Once it arrives you have 30 days.'), { buttons: o.status === 'placed' ? [B('Cancel the order', 'intent:cancel_order'), B('Menu', 'menu')] : [B('Menu', 'menu')] }); bot.endFlow(); return; } if (Date.now() - o.ev.delivered > 30 * DAY + shift(o)) { bot.say('That order was delivered more than 30 days ago, which is outside our return window. A person can look at exceptions.', { buttons: [B('Talk to a person', 'handover')] }); bot.endFlow(); return; } if (o.items.length === 1) { bot.slots.item = '0'; bot._advance(); return; } bot.say('Which item is it?', { buttons: o.items.map(function (it, i) { return B(BY[it.id].name + ' (' + it.size + ')', 'slot:item=' + i); }) }); }, parse: function (t, bot, s) { var o = findOrder(bot, s.orderId), best; if (!o) return undefined; o.items.forEach(function (it, i) { if (t.toLowerCase().indexOf(BY[it.id].name.toLowerCase().split(' ')[0]) >= 0) best = String(i); }); return best; } },
        { name: 'reason', ask: function (bot) { bot.say('What went wrong?', { buttons: [B('Too small', 'slot:reason=small'), B('Too big', 'slot:reason=big'), B('Not as expected', 'slot:reason=expected'), B('Faulty or damaged', 'slot:reason=faulty'), B('Changed my mind', 'slot:reason=mind')] }); }, parse: function (t) { t = t.toLowerCase(); return /small|tight|short/.test(t) ? 'small' : /big|large|loose|baggy|long/.test(t) ? 'big' : /fault|damag|broken|split|tear|defect|hole/.test(t) ? 'faulty' : /expect|photo|colou?r|different|looks/.test(t) ? 'expected' : /mind|don.?t like|dont like|no longer/.test(t) ? 'mind' : undefined; } },
        { name: 'resolution', ask: function (bot, s) { var o = findOrder(bot, s.orderId), it = o.items[+s.item], p = BY[it.id], canEx = p.sizes.length > 1; bot.say('I can do either. Which do you prefer?' + (canEx ? '' : ' (This piece has one size, so a swap is not possible.)'), { buttons: (canEx ? [B('Exchange for another size', 'slot:resolution=exchange')] : []).concat([B('Refund to original payment', 'slot:resolution=refund'), B('Store credit (+10%)', 'slot:resolution=credit')]) }); }, parse: function (t) { t = t.toLowerCase(); return /exchange|swap|different size|another size|replace/.test(t) ? 'exchange' : /refund|money/.test(t) ? 'refund' : /credit|voucher/.test(t) ? 'credit' : undefined; } },
        { name: 'newSize', when: function (bot, s) { return s.resolution === 'exchange'; }, ask: function (bot, s) { var o = findOrder(bot, s.orderId), p = BY[o.items[+s.item].id], cur = o.items[+s.item].size, rec = s.reason === 'small' ? p.sizes[Math.min(p.sizes.length - 1, p.sizes.indexOf(cur) + 1)] : s.reason === 'big' ? p.sizes[Math.max(0, p.sizes.indexOf(cur) - 1)] : null; bot.say('You ordered **' + cur + '**.' + (rec && rec !== cur ? ' Since it was ' + (s.reason === 'small' ? 'too small' : 'too big') + ', I would suggest **' + rec + '**.' : '') + ' Which size should I send?', { buttons: p.sizes.filter(function (z) { return z !== cur; }).map(function (z) { return B(z, 'slot:newSize=' + z); }) }); }, parse: function (t, bot, s) { var o = findOrder(bot, s.orderId), p = BY[o.items[+s.item].id], v = parseSize(t); return v && p.sizes.indexOf(v) >= 0 ? v : undefined; } }
      ], done: function (bot, s) {
        var o = findOrder(bot, s.orderId), it = o.items[+s.item], p = BY[it.id], rets = bot.db('returns'), rma = 'RMA-' + (4200 + rets.length + 1);
        var rec = { id: rma, order: o.id, item: p.name, size: it.size, reason: s.reason, resolution: s.resolution, newSize: s.newSize || null, status: 'label sent', at: Date.now(), email: o.email }; rets.push(rec); bot.save('returns', rets);
        bot.user.email = o.email; bot.user.name = o.name; bot.event('action', { action: 'return_created', rma: rma });
        bot.lead({ intent: 'return', payload: { rma: rma, order: o.id, item: p.name, reason: s.reason, resolution: s.resolution, newSize: s.newSize || null } });
        bot.say('All set. Return **' + rma + '** is created for the ' + p.name + '. A prepaid label is on its way to ' + o.email + '.\n' + (s.resolution === 'exchange' ? 'Your size ' + s.newSize + ' ships as soon as the parcel is scanned in.' : s.resolution === 'credit' ? 'You will get ' + money(Math.round(p.price * 1.1)) + ' store credit when we receive it.' : 'Your ' + money(p.price) + ' refund lands within 3 to 5 working days of us receiving it.'), { cards: [{ title: rma, sub: p.name + ' · ' + (s.resolution === 'exchange' ? 'exchange to ' + s.newSize : s.resolution), meta: ['Drop off at any Parcelwise point', 'Window closes in 30 days'], img: O.samples('store/products/' + p.id + '.jpg') }] });
        bot.say('Anything else?', { buttons: [B('Track another order', 'flow:track'), B('That’s all', 'say:bye')] });
      } },
      size: { intent: 'size', slots: [
        { name: 'product', ask: function (bot) { var p = BY[bot.ctx.product]; if (p) { bot.slots.product = p.id; bot._advance(); return; } bot.say('Which piece is it for?', { buttons: CAT.filter(function (x) { return x.sizes.length > 1; }).slice(0, 6).map(function (x) { return B(x.name, 'slot:product=' + x.id); }) }); }, parse: function (t, bot) { var p = productFromText(N.norm(t, bot.agent.synonyms)); return p ? p.id : undefined; } },
        { name: 'usual', ask: function (bot, s) { var p = BY[s.product]; if (p.sizes.length === 1) { bot.say('The ' + p.name + ' comes in one size, so no worry there. ' + (p.cat === 'Accessories' || p.cat === 'Bags' ? 'Ask me about stock or colours if you like.' : '')); bot.endFlow(); bot.menu(); return; } bot.say(p.cat === 'Shoes' ? 'What shoe size do you usually take? Say it like “EU 42”, “UK 8” or “US 9”.' : 'What size do you usually wear in tops and trousers? XS, S, M, L or XL.', { buttons: p.sizes.map(function (z) { return B(z, 'slot:usual=' + z); }) }); }, parse: function (t, bot, s) { var v = parseSize(t); if (v && !/^\d/.test(v) && BY[s.product].cat === 'Shoes') return undefined; return v; } },
        { name: 'pref', ask: function (bot) { bot.say('How do you like it to fit?', { buttons: [B('Snug', 'slot:pref=snug'), B('Regular', 'slot:pref=regular'), B('Roomy', 'slot:pref=roomy')] }); }, parse: function (t) { t = t.toLowerCase(); return /snug|tight|slim|fitted/.test(t) ? 'snug' : /roomy|loose|relaxed|oversize|baggy/.test(t) ? 'roomy' : /regular|normal|true|standard|usual|normally/.test(t) ? 'regular' : undefined; } }
      ], done: function (bot, s) {
        var p = BY[s.product], i = p.sizes.indexOf(s.usual), adj = 0, why = [];
        if (p.fit === 'slim') { why.push('The ' + p.name + ' cuts slim'); if (s.pref !== 'snug') adj++; } else if (p.fit === 'roomy') { why.push('The ' + p.name + ' is cut relaxed'); if (s.pref === 'snug') adj--; } else if (p.fit === 'small') { why.push('The ' + p.name + ' runs about half a size small'); adj++; } else why.push('The ' + p.name + ' is true to size');
        if (s.pref === 'roomy' && p.fit !== 'roomy') { adj++; why.push('you like room'); } if (s.pref === 'snug' && p.fit !== 'slim') { adj--; why.push('you like it snug'); }
        if (i < 0) { bot.say('I could not match **' + s.usual + '** to our sizes for the ' + p.name + ' (' + p.sizes.join(', ') + '). Tell me your usual size another way?'); return; }
        var k = Math.max(0, Math.min(p.sizes.length - 1, i + adj)), rec = p.sizes[k];
        bot.say('I would go for **' + rec + '**. ' + why.join(', ') + '.' + (adj === 0 ? '' : ' That is ' + (adj > 0 ? 'a size up' : 'a size down') + ' from your usual ' + s.usual + '.'), { cards: [productCard(p, ['Suggested: ' + rec])] });
        var st = bot.db('stock'), colors = p.colors.filter(function (c) { return (st[p.id + '|' + c + '|' + rec] || 0) > 0; });
        bot.say(colors.length ? rec + ' is in stock in ' + colors.join(', ') + '.' : rec + ' is sold out right now. I can set a restock alert for you.', { buttons: colors.length ? [B('Check another size', 'act:size:' + p.id), B('Menu', 'menu')] : [B('Alert me', 'act:alert:' + p.id + '|' + rec), B('Menu', 'menu')] });
      } },
      find: { intent: 'find', slots: [
        { name: 'color', optional: true }, { name: 'type', optional: true }, { name: 'maxPrice', optional: true }, { name: 'minPrice', optional: true },
        { name: 'cat', optional: false, ask: function (bot, s) { bot.say('Happy to help you find something. What are you after?', { buttons: [B('Shoes', 'slot:cat=Shoes'), B('Clothing', 'slot:cat=Clothing'), B('Bags', 'slot:cat=Bags'), B('Accessories', 'slot:cat=Accessories'), B('Anything', 'slot:cat=any')] }); }, parse: function (t) { t = t.toLowerCase(); return /shoe|sneaker|boot/.test(t) ? 'Shoes' : /cloth|wear|top|dress/.test(t) ? 'Clothing' : /bag/.test(t) ? 'Bags' : /access|watch|glass|cap/.test(t) ? 'Accessories' : /anything|surprise|all|everything/.test(t) ? 'any' : undefined; } }
      ], done: function (bot, s) { bot.mem.lastFind = s; showFind(bot, s); } }
    },
    actions: {
      stock: function (bot, id) { stockReply(bot, BY[id]); },
      size: function (bot, id) { bot.startFlow('size', { product: id }); },
      alert: function (bot, arg) { var a = arg.split('|'); bot.startFlow('restock', { product: a[0], size: a[1] }); },
      notify: function (bot, id) { bot.say('I will email you when **' + id + '** ships. I have used the address on the order.'); bot.event('action', { action: 'ship_notify' }); }
    },
    kb: [
      { id: 'ship', q: 'How long does delivery take?', a: 'Standard delivery takes 3 to 5 working days and is free over $150 (otherwise $8). Express is $18 and arrives in 1 to 2 working days. Orders placed before 2 pm ship the same day.', keys: ['delivery time', 'shipping time', 'how long', 'shipping cost', 'free shipping', 'delivery cost', 'express', 'international', 'ship to'] },
      { id: 'ret', q: 'What is your return policy?', a: 'You have 30 days from delivery to return unworn items with their tags, free of charge. Refunds go back to the original payment method in 3 to 5 working days after we receive the parcel. Exchanges ship as soon as the return is scanned.', keys: ['return policy', 'returns policy', 'how do returns work', 'return window', '30 days'], buttons: [B('Start a return', 'intent:returns'), B('Menu', 'menu')] },
      { id: 'pay', q: 'Which payment methods do you accept?', a: 'Visa, Mastercard, Amex, Apple Pay, PayPal and bank transfer. Payment is taken when the order is placed. Bank transfers are held for 3 days.', keys: ['payment methods', 'pay with', 'apple pay', 'paypal', 'credit card', 'klarna', 'instalments'] },
      { id: 'care', q: 'How do I look after my leather and suede?', a: 'Brush suede, never soak it. Wipe leather with a damp cloth and condition it twice a year. Cotton pieces wash cold and hang to dry.', keys: ['care', 'wash', 'clean', 'leather care', 'suede'] },
      { id: 'gift', q: 'Do you offer gift wrapping or gift cards?', a: 'Yes. Gift wrap is free at checkout and gift cards come in $25, $50 and $100, delivered by email instantly.', keys: ['gift wrap', 'gift card', 'gift voucher', 'present', 'gift receipt'] },
      { id: 'disc', q: 'Do you have a discount code or sale?', a: 'New subscribers get 10% off their first order. Sale pieces are marked on the shop page and are final sale, so they cannot be returned.', keys: ['discount', 'promo code', 'coupon', 'sale', 'offer', 'student discount'] },
      { id: 'hours', q: 'Can I speak to someone?', a: 'Our team is online Monday to Friday, 9 am to 6 pm (Eastern). Outside those hours I can still help, and anything I cannot finish is passed to the team with the full chat.', keys: ['opening hours', 'support hours', 'working hours', 'contact', 'phone number', 'when are you open'], buttons: [B('Talk to a person', 'handover'), B('Menu', 'menu')] }
    ],
    freeText: function (bot, m) { // typed product brief with no clear intent, e.g. "white sneakers under $120"
      var e = m.ent; if (e.cat || e.type || e.color || e.maxPrice != null || e.minPrice != null) { showFind(bot, e); return true; } return false;
    }
  });

  function stockReply(bot, p, size, color) {
    var st = bot.db('stock'), rows = [], total = 0; p.colors.forEach(function (c) { if (color && c.toLowerCase().indexOf(String(color).toLowerCase()) < 0 && (COLORFAM[color] || []).indexOf(c.toLowerCase().split(' ')[0]) < 0) return; var sizes = p.sizes.filter(function (z) { return (st[p.id + '|' + c + '|' + z] || 0) > 0 && (!size || z === size); }); total += sizes.length; rows.push(c + ': ' + (sizes.length ? sizes.join(', ') : 'sold out')); });
    var low = []; p.colors.forEach(function (c) { p.sizes.forEach(function (z) { var n = st[p.id + '|' + c + '|' + z]; if (n > 0 && n <= 3 && (!size || z === size)) low.push(c + ' ' + z + ' (only ' + n + ' left)'); }); });
    bot.say(total ? 'Yes, the **' + p.name + '** is in stock' + (size ? ' in ' + size : '') + '.' + (low.length ? ' Running low: ' + low.slice(0, 2).join(', ') + '.' : '') : 'Sorry, the **' + p.name + '**' + (size ? ' in ' + size : '') + ' is sold out right now.', { cards: [{ title: p.name, sub: rows.join(' · '), img: O.samples('store/products/' + p.id + '.jpg'), price: money(p.price), meta: ['Ships today if ordered before 2 pm'], buttons: total ? [B('Which size should I get?', 'act:size:' + p.id)] : [B('Alert me when it’s back', 'act:alert:' + p.id + '|' + (size || ''))] }] });
  }
  function showFind(bot, q) {
    var list = CAT.filter(function (p) { return (!q.cat || q.cat === 'any' || p.cat === q.cat) && (!q.type || p.type === q.type) && (!q.color || p.colors.some(function (c) { return COLORFAM[q.color].indexOf(c.toLowerCase().split(' ')[0]) >= 0; })); });
    var inB = list.filter(function (p) { return (q.maxPrice == null || p.price <= q.maxPrice) && (q.minPrice == null || p.price >= q.minPrice); });
    var desc = [q.color, q.type || (q.cat && q.cat !== 'any' ? q.cat.toLowerCase() : 'pieces')].filter(Boolean).join(' ') + (q.maxPrice != null ? ' under ' + money(q.maxPrice) : '') + (q.minPrice != null ? ' over ' + money(q.minPrice) : '');
    bot.event('action', { action: 'product_search', q: desc });
    if (inB.length) { bot.say('Here ' + (inB.length === 1 ? 'is' : 'are') + ' ' + inB.length + ' match' + (inB.length === 1 ? '' : 'es') + ' for **' + desc + '**:', { cards: inB.slice(0, 4).map(function (p) { return productCard(p, q.color ? ['In ' + p.colors.filter(function (c) { return COLORFAM[q.color].indexOf(c.toLowerCase().split(' ')[0]) >= 0; }).join(', ')] : []); }), buttons: [B('Narrow it down', 'say:show me cheaper options'), B('Menu', 'menu')] }); return; }
    if (list.length) { var near = list.slice().sort(function (a, b) { return a.price - b.price; }).slice(0, 2); bot.say('Nothing at that price for **' + desc + '**. The closest are these, a little above your budget:', { cards: near.map(function (p) { return productCard(p, ['$' + (p.price - (q.maxPrice || 0)) + ' over budget']); }), buttons: [B('Show everything in ' + (q.cat || 'the shop'), 'say:show me ' + (q.cat || 'everything')), B('Menu', 'menu')] }); return; }
    var any = CAT.filter(function (p) { return !q.cat || q.cat === 'any' || p.cat === q.cat; }).slice(0, 3); bot.say('I don’t have an exact match for **' + desc + '**, but here are some pieces you may like:', { cards: any.map(function (p) { return productCard(p); }) });
  }
  /* restock alert flow is defined after registration so it can use the helpers above */
  var A = O.agents.support;
  A.flows.restock = { intent: 'restock', slots: [
    { name: 'product', ask: function (bot) { var p = BY[bot.ctx.product]; if (p) { bot.slots.product = p.id; bot._advance(); return; } bot.say('Which piece do you want to hear about?', { buttons: [B('Harbor Jacket', 'slot:product=harbor-jacket'), B('Desert Boot', 'slot:product=drift-runner'), B('Coast Sunglasses', 'slot:product=coast-sunglasses'), B('Sage Brogue', 'slot:product=court-low')] }); }, parse: function (t, bot) { var p = productFromText(N.norm(t, bot.agent.synonyms)); return p ? p.id : undefined; } },
    { name: 'size', ask: function (bot, s) { var p = BY[s.product]; if (p.sizes.length === 1) { bot.slots.size = p.sizes[0]; bot._advance(); return; } bot.say('Which size?', { buttons: p.sizes.map(function (z) { return B(z, 'slot:size=' + z); }) }); }, parse: function (t, bot, s) { var v = parseSize(t); return v && BY[s.product].sizes.indexOf(v) >= 0 ? v : undefined; } },
    { name: 'email', ask: function (bot) { bot.say(bot.user.email ? 'Use **' + bot.user.email + '**?' : 'What email should I notify?', bot.user.email ? { buttons: [B('Yes', 'slot:email=' + bot.user.email), B('Different email', 'say:different')] } : undefined); }, parse: function (t) { return N.email(t); }, hint: 'Please type an email address, for example name@example.com.' }
  ], done: function (bot, s) {
    var p = BY[s.product], al = bot.db('alerts'); al.push({ product: p.id, size: s.size, email: s.email, at: Date.now() }); bot.save('alerts', al); bot.user.email = s.email;
    bot.lead({ intent: 'restock_alert', payload: { product: p.name, size: s.size, email: s.email } });
    bot.say('Done. I will email **' + s.email + '** the moment the ' + p.name + ' in ' + s.size + ' is back. You are on the list.', { buttons: [B('Find something similar', 'intent:find'), B('Menu', 'menu')] });
  } };
})();
