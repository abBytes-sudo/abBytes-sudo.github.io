/* Northlane account (demo sign-in): overview, orders with re-order and tracking, returns, addresses, saved pieces, details. */
(function () {
  'use strict';
  var NL = window.NL, S = window.NLS; if (!NL || !S) return;
  var $ = S.$, $$ = S.$$, esc = NL.esc, money = NL.money, root = $('#ac');
  var TABS = [['overview', 'Overview'], ['orders', 'Orders'], ['returns', 'Returns'], ['addresses', 'Addresses'], ['saved', 'Saved pieces'], ['details', 'Details']];
  var STEPL = { placed: 'Order placed', packed: 'Packed', shipped: 'On its way', out: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled' };
  var RSTEP = [['requested', 'Requested'], ['approved', 'Pickup booked'], ['received', 'Received'], ['refunded', 'Refunded']];
  var next = new URLSearchParams(location.search).get('next');
  function track(o) { return '../orders/track.html?o=' + encodeURIComponent(o.id) + '&e=' + encodeURIComponent(o.email); }
  function mine(c) { return NL.db().orders.filter(function (o) { return o.email === c.email; }); }
  function thumbs(o, n) { return '<span class="ac-th">' + o.items.slice(0, n || 3).map(function (it) { var p = NL.product(it.pid); return '<span>' + (p ? '<img src="' + NL.thumb(p.images[0].src) + '" alt="" width="60" height="75" loading="lazy" decoding="async">' : '') + '</span>'; }).join('') + (o.items.length > (n || 3) ? '<span class="more">+' + (o.items.length - (n || 3)) + '</span>' : '') + '</span>'; }
  function pill(o) { var s = NL.stage(o), rt = NL.openReturn(o); return '<span class="st st-' + s + '">' + (rt ? 'Return ' + ({ requested: 'requested', approved: 'pickup booked', received: 'received' }[rt.st]) : STEPL[s]) + '</span>'; }
  function lastDel(o) { var t = 0; o.ships.forEach(function (s) { if (s.ev.delivered) t = Math.max(t, s.ev.delivered); }); return t; }
  function returnable(o) {
    if (o.cancelled || NL.stage(o) !== 'delivered' || NL.openReturn(o)) return null;
    var days = NL.db().set.returnDays, left = days - Math.floor((Date.now() - lastDel(o)) / NL.DAY); if (left < 0) return null;
    var lines = o.items.map(function (it, i) { var asked = o.rets.filter(function (r) { return r.st !== 'rejected'; }).reduce(function (a, r) { return a + r.lines.filter(function (l) { return l.i === i; }).reduce(function (b, l) { return b + l.q; }, 0); }, 0); return { i: i, max: Math.max(0, NL.shippedQ(o, i) - asked) }; }).filter(function (l) { return l.max > 0; });
    return lines.length ? { left: left, lines: lines } : null;
  }
  var tt; function toast(m) { var t = $('.ac-toast') || document.body.appendChild(Object.assign(document.createElement('p'), { className: 'ac-toast', role: 'status' })); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('on'); }, 3200); }

  /* ── signed out ── */
  function signin() {
    var demo = NL.demo(), dc = NL.custByEmail(demo.email);
    root.className = 'ac ac-out';
    root.innerHTML = '<div class="si"><p class="eyebrow">Your account</p><h1>Sign in to <em>Northlane</em></h1><p class="lede">Orders, returns, saved addresses and the pieces you’ve kept an eye on, in one place.</p>' +
      '<form id="siF" class="si-f" novalidate><label class="f w" data-f="se"><span>Email</span><input id="siE" type="email" autocomplete="email" inputmode="email" spellcheck="false" value="' + esc(demo.email) + '" placeholder="you@example.com"><em class="fe" id="siEe" aria-live="polite"></em></label>' +
      '<label class="f w" data-f="sn" id="siNw" hidden><span>Your name</span><input id="siN" autocomplete="name" placeholder="First and last name"><em class="fe" id="siNe" aria-live="polite"></em></label>' +
      '<p class="si-n" id="siM">No password needed: we recognise you by your email.</p><button class="nl-btn" type="submit" id="siB">Continue <span class="arrow" aria-hidden="true">→</span></button></form>' +
      '<div class="si-demo"><p class="eyebrow">Recently on this device</p><button type="button" class="si-d" id="siDemo"><b>' + esc(dc ? dc.name : 'Meera Iyer') + '</b><span>Customer in Mumbai · ' + NL.plural(dc ? mine(dc).length : 6, 'order') + ', one out for delivery today, one return in progress</span><i aria-hidden="true">→</i></button></div></div>' +
      '<figure class="si-ph fr"><img src="photos/strip-2.jpg" alt="A person in a cream blazer holding dried flowers" width="1100" height="1650" decoding="async"></figure>';
    var newUser = false;
    $('#siF').addEventListener('submit', function (e) { e.preventDefault(); var v = $('#siE').value.trim().toLowerCase(), w = $('[data-f="se"]');
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) { $('#siEe').textContent = v ? 'That email doesn’t look right. Check for a missing @ or dot.' : 'Enter the email you shop with.'; w.classList.add('bad'); $('#siE').focus(); return; }
      w.classList.remove('bad'); $('#siEe').textContent = '';
      var c = NL.custByEmail(v);
      if (!c && !newUser) { newUser = true; $('#siNw').hidden = false; $('#siM').textContent = 'New to Northlane? Add your name and we’ll set up your account for ' + v + '.'; $('#siB').innerHTML = 'Create account <span class="arrow" aria-hidden="true">→</span>'; $('#siN').focus(); return; }
      if (!c && $('#siN').value.trim().length < 2) { $('#siNe').textContent = 'What should we call you?'; $('[data-f="sn"]').classList.add('bad'); $('#siN').focus(); return; }
      NL.signIn(v, c ? c.name : $('#siN').value.trim()); done(); });
    $('#siE').addEventListener('input', function () { if (newUser) { newUser = false; $('#siNw').hidden = true; $('#siB').innerHTML = 'Continue <span class="arrow" aria-hidden="true">→</span>'; } });
    $('#siDemo').addEventListener('click', function () { NL.signIn(demo.email); done(); });
    function done() { if (next && /^[a-z]+\.html$/.test(next)) { location.href = next; return; } S.counts(); route(); }
    if (S.fx) window.gsap.from($$('.si > *, .si-ph'), { autoAlpha: 0, y: 30, duration: 1.2, ease: 'power4.out', stagger: .07, clearProps: 'all' });
  }

  /* ── signed in shell ── */
  function route() {
    var c = NL.session(); if (!c) { signin(); return; }
    var h = (location.hash || '#overview').slice(1).split('/'), tab = h[0], arg = h[1] ? decodeURIComponent(h[1]) : '';
    var valid = TABS.some(function (t) { return t[0] === tab; }) || tab === 'order' || tab === 'return'; if (!valid) tab = 'overview';
    var nav = tab === 'order' ? 'orders' : tab === 'return' ? 'returns' : tab;
    root.className = 'ac ac-in';
    var first = (c.name || '').split(' ')[0] || 'there';
    root.innerHTML = '<aside class="ac-nav"><p class="eyebrow">Your account</p><p class="ac-hi">Hello, <em>' + esc(first) + '</em></p><nav aria-label="Account"><ul>' + TABS.map(function (t) { var n = t[0] === 'orders' ? mine(c).length : t[0] === 'saved' ? S.wish().length : t[0] === 'addresses' ? (c.addrs || []).length : t[0] === 'returns' ? allReturns(c).length : 0;
      return '<li><a href="#' + t[0] + '"' + (t[0] === nav ? ' aria-current="page"' : '') + '>' + t[1] + (n ? '<span>' + n + '</span>' : '') + '</a></li>'; }).join('') + '</ul></nav><button type="button" class="ac-out-b" id="acOut">Sign out</button></aside><section class="ac-main" id="acMain" tabindex="-1"></section>';
    $('#acOut').addEventListener('click', function () { NL.signOut(); S.counts(); location.hash = ''; signin(); });
    var m = $('#acMain');
    ({ overview: overview, orders: orders, order: orderView, returns: returns, return: returnForm, addresses: addresses, saved: saved, details: details })[tab](c, m, arg);
    var cur = $('.ac-nav a[aria-current]'); if (cur && cur.scrollIntoView && matchMedia('(max-width:900px)').matches) cur.scrollIntoView({ inline: 'center', block: 'nearest' });
    if (S.fx && !route.quiet) window.gsap.from(m.children, { autoAlpha: 0, y: 24, duration: .9, ease: 'power3.out', stagger: .05, clearProps: 'all' });
  }
  function allReturns(c) { var L = []; mine(c).forEach(function (o) { o.rets.forEach(function (r) { L.push({ o: o, r: r }); }); }); return L.sort(function (a, b) { return b.r.t - a.r.t; }); }

  function orderRow(o) { var rt = returnable(o), s = NL.stage(o);
    return '<li class="or"><a class="or-a" href="#order/' + o.id + '">' + thumbs(o) + '<span class="or-t"><b>' + o.id + '</b><span>' + NL.fD(o.t) + ' · ' + NL.plural(NL.qty(o), 'item') + ' · ' + money(o.total) + '</span></span><span class="or-s">' + pill(o) + '<em>' + (s === 'cancelled' ? 'Refunded where paid' : NL.etaText(o)) + '</em></span></a>' +
      '<div class="or-x">' + (s !== 'cancelled' && s !== 'delivered' ? '<a class="lnk u" href="' + track(o) + '">Track</a>' : '') + '<button type="button" class="lnk u" data-reorder="' + o.id + '">Buy again</button>' + (rt ? '<a class="lnk u" href="#return/' + o.id + '">Return · ' + rt.left + ' days left</a>' : '') + '</div></li>'; }

  function overview(c, m) {
    var os = mine(c), live = os.filter(function (o) { var s = NL.stage(o); return s !== 'delivered' && s !== 'cancelled'; }), rets = allReturns(c).filter(function (x) { return x.r.st !== 'refunded' && x.r.st !== 'rejected'; });
    var def = (c.addrs || []).filter(function (a) { return a.def; })[0] || (c.addrs || [])[0];
    m.innerHTML = '<h1>Overview</h1><div class="ov-k"><div><span>Orders</span><b>' + os.length + '</b></div><div><span>Member since</span><b>' + (c.since ? new Date(c.since).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'today') + '</b></div><div><span>Store credit</span><b>' + money(c.credit || 0) + '</b></div><div><span>Saved pieces</span><b>' + S.wish().length + '</b></div></div>' +
      '<h2 class="ac-h">On its way</h2>' + (live.length ? '<ul class="lv">' + live.map(function (o) { var s = NL.stage(o), k = Math.max(0, NL.STG.indexOf(s));
        return '<li><div class="lv-h"><div><p class="eyebrow">' + o.id + ' · ' + NL.fD(o.t) + '</p><p class="lv-s">' + STEPL[s] + '</p><p class="lv-e">' + (s === 'out' ? 'Arriving today, by 9 pm' : 'Expected ' + NL.etaText(o)) + '</p></div>' + thumbs(o, 2) + '</div><ol class="lv-p" aria-label="Progress">' + ['Placed', 'Packed', 'Shipped', 'Out', 'Delivered'].map(function (l, i) { return '<li class="' + (i <= k ? 'on' : '') + '">' + l + '</li>'; }).join('') + '</ol><a class="nl-btn sm" href="' + track(o) + '">Track parcel <span class="arrow" aria-hidden="true">→</span></a></li>'; }).join('') + '</ul>' : '<p class="ac-empty">Nothing on its way right now. <a class="u" href="shop.html">Browse the new season</a></p>') +
      (rets.length ? '<h2 class="ac-h">Returns in progress</h2><ul class="rl">' + rets.map(retRow).join('') + '</ul>' : '') +
      '<h2 class="ac-h">Recent orders <a class="lnk u" href="#orders">See all</a></h2>' + (os.length ? '<ul class="ol">' + os.filter(function (o) { return live.indexOf(o) < 0; }).slice(0, 3).map(orderRow).join('') + '</ul>' : '<p class="ac-empty">No orders yet. Your first one will appear here the moment you place it.</p>') +
      '<div class="ov-two"><div><h2 class="ac-h">Default address</h2>' + (def ? '<address>' + adrHtml(def) + '</address><a class="lnk u" href="#addresses">Manage addresses</a>' : '<p class="ac-empty">No address saved yet. <a class="u" href="#addresses">Add one</a></p>') + '</div><div><h2 class="ac-h">Need a hand?</h2><p>Returns are free within 30 days and we collect from your door. Repairs are free for two years: write to the studio from any order.</p></div></div>';
  }
  function adrHtml(a) { return '<b>' + esc(a.name) + '</b><br>' + esc(a.l1) + '<br>' + esc(a.l2) + '<br>' + esc(a.city) + ', ' + esc(a.state) + ' ' + esc(a.pin); }
  function orders(c, m) {
    var os = mine(c), f = orders.f || 'all';
    var L = os.filter(function (o) { var s = NL.stage(o); return f === 'all' || (f === 'live' ? s !== 'delivered' && s !== 'cancelled' : f === 'done' ? s === 'delivered' : s === 'cancelled'); });
    m.innerHTML = '<h1>Orders</h1><div class="seg2" role="group" aria-label="Filter orders">' + [['all', 'All'], ['live', 'In progress'], ['done', 'Delivered'], ['cancelled', 'Cancelled']].map(function (x) { return '<button type="button" data-of="' + x[0] + '" aria-pressed="' + (f === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      (L.length ? '<ul class="ol">' + L.map(orderRow).join('') + '</ul>' : '<p class="ac-empty">' + (os.length ? 'No orders here.' : 'You haven’t ordered yet. When you do, you’ll track it and return it from here.') + ' <a class="u" href="shop.html">Shop the collection</a></p>');
    $$('[data-of]', m).forEach(function (b) { b.onclick = function () { orders.f = b.getAttribute('data-of'); orders(c, m); $('[data-of="' + orders.f + '"]').focus(); }; });
  }
  function orderView(c, m, id) {
    var o = NL.order(id); if (!o || o.email !== c.email) { m.innerHTML = '<h1>Order not found</h1><p class="ac-empty">We couldn’t find ' + esc(id) + ' on this account. <a class="u" href="#orders">Back to your orders</a></p>'; return; }
    var s = NL.stage(o), rt = returnable(o), ps = NL.payStatus(o), fe = NL.fulfilment(o);
    var tl = o.tl.filter(function (e) { return /placed|ship|out|deliver|refund|return|cancel/.test(e.k); }).slice().reverse();
    m.innerHTML = '<p class="crumb2"><a class="u" href="#orders">← All orders</a></p><div class="od-h"><div><p class="eyebrow">Placed ' + NL.fDT(o.t) + '</p><h1>' + o.id + '</h1></div>' + pill(o) + '</div>' +
      '<div class="od-a">' + (s !== 'cancelled' ? '<a class="nl-btn sm" href="' + track(o) + '">Track parcel <span class="arrow" aria-hidden="true">→</span></a>' : '') + '<button type="button" class="nl-btn ghost sm" data-reorder="' + o.id + '">Buy again</button>' + (rt ? '<a class="nl-btn ghost sm" href="#return/' + o.id + '">Start a return</a>' : '') + '</div>' +
      (fe === 'partial' ? '<p class="od-n">This order is arriving in more than one parcel. Something was short on the shelf, so we sent the rest first.</p>' : '') +
      '<ul class="od-i">' + o.items.map(function (it, i) { var p = NL.product(it.pid), sh = NL.shippedQ(o, i), cq = it.cq || 0, rq = it.rq || 0;
        return '<li><a class="od-im" href="product.html?id=' + it.pid + '">' + (p ? '<img src="' + NL.thumb(p.images[0].src) + '" alt="" width="90" height="112" loading="lazy" decoding="async">' : '') + '</a><div><p class="dr-n">' + esc(it.name) + '</p><p class="dr-m">' + esc(it.col) + (it.s !== 'One size' ? ' · ' + esc(it.s) : '') + ' · Qty ' + it.q + '</p><p class="od-st">' + (cq >= it.q ? 'Cancelled' : rq ? rq + ' returned' : sh >= it.q - cq ? 'Shipped' : sh ? sh + ' of ' + (it.q - cq) + ' shipped' : 'Being packed') + '</p></div><p class="dr-p">' + money(it.price * it.q) + '</p></li>'; }).join('') + '</ul>' +
      '<div class="od-g"><div><h2 class="ac-h">Delivery</h2><address>' + adrHtml(o.addr) + '</address><p class="od-m">' + esc(NL.METHOD[o.m] || 'Collected in store') + (o.ships.length ? ' · ' + o.ships.map(function (x) { return esc(x.carrier) + (x.awb ? ' ' + x.awb : ''); }).join(', ') : '') + '</p>' + (o.gift ? '<p class="od-m">Gift' + (o.gift.wrap ? ', wrapped' : '') + (o.gift.note ? ': “' + esc(o.gift.note) + '”' : '') + '</p>' : '') + '</div>' +
      '<div><h2 class="ac-h">Payment</h2><div class="sum2"><p><span>Subtotal</span><span>' + money(o.sub) + '</span></p>' + (o.disc ? '<p><span>' + esc(o.disc.code) + '</span><span>' + (o.disc.amt ? '−' + money(o.disc.amt) : 'Free shipping') + '</span></p>' : '') + '<p><span>Delivery</span><span>' + (o.shipFee ? money(o.shipFee) : 'Free') + '</span></p>' + (o.gift && o.gift.fee ? '<p><span>Gift wrap</span><span>' + money(o.gift.fee) + '</span></p>' : '') + (o.codFee ? '<p><span>COD fee</span><span>' + money(o.codFee) + '</span></p>' : '') + '<p class="big"><span>Total</span><span>' + money(o.total) + '</span></p>' + o.refunds.map(function (r) { return '<p class="rf"><span>Refunded ' + NL.fDs(r.t) + '</span><span>−' + money(r.amt) + '</span></p>'; }).join('') + '<p class="pm2">' + esc(o.pay.d) + ' · ' + NL.PAYL[ps] + '</p></div></div></div>' +
      (o.rets.length ? '<h2 class="ac-h">Returns</h2><ul class="rl">' + o.rets.map(function (r) { return retRow({ o: o, r: r }); }).join('') + '</ul>' : '') +
      '<h2 class="ac-h">History</h2><ol class="od-tl">' + tl.map(function (e) { return '<li><span>' + NL.fDT(e.t) + '</span><p>' + esc(e.m.replace(' (demo, nothing charged)', '')) + '</p></li>'; }).join('') + '</ol>';
  }
  function retRow(x) { var r = x.r, o = x.o, k = RSTEP.map(function (s) { return s[0]; }).indexOf(r.st), val = NL.returnValue(o, r);
    return '<li class="rr"><div class="rr-h"><div><p class="eyebrow">' + r.id + ' · ' + o.id + '</p><p class="rr-t">' + r.lines.map(function (l) { return esc(o.items[l.i].name) + (l.q > 1 ? ' × ' + l.q : ''); }).join(', ') + '</p><p class="rr-m">' + esc(r.lines[0].reason) + ' · refund ' + (r.st === 'refunded' ? money(val) + ' ' + (r.method === 'credit' ? 'as store credit' : 'to ' + esc(o.pay.d)) : 'of about ' + money(val) + ' ' + (r.method === 'credit' ? 'as store credit' : 'to your original payment')) + '</p></div>' + (r.st === 'rejected' ? '<span class="st st-cancelled">Declined</span>' : '') + '</div>' +
      (r.st !== 'rejected' ? '<ol class="lv-p">' + RSTEP.map(function (s, i) { return '<li class="' + (i <= k ? 'on' : '') + '">' + s[1] + '</li>'; }).join('') + '</ol>' : '') +
      '<p class="rr-n">' + (r.st === 'requested' ? 'We’ll confirm within a working day and book a pickup' + (r.pickup ? ' for around ' + NL.fD(r.pickup) : '') + '.' : r.st === 'approved' ? 'Pickup booked for ' + NL.fD(r.pickup || Date.now()) + (r.awb ? ' · return AWB ' + r.awb : '') + '. Keep it packed and ready.' : r.st === 'received' ? 'It’s back at the studio. Your refund follows within two working days.' : r.st === 'refunded' ? 'Refunded on ' + NL.fD(r.ev.refunded) + '. Banks take 3 to 5 working days to show it.' : (r.reason ? esc(r.reason) : 'This return was declined. Write to us if that seems wrong.')) + '</p></li>'; }
  function returns(c, m) {
    var L = allReturns(c), elig = mine(c).filter(returnable);
    m.innerHTML = '<h1>Returns</h1><p class="ac-lede">Return anything unworn within 30 days of delivery. We collect it from your door and refund to your original payment, or instantly as store credit.</p>' +
      (elig.length ? '<h2 class="ac-h">Start a return</h2><ul class="ol">' + elig.map(function (o) { var r = returnable(o); return '<li class="or"><a class="or-a" href="#return/' + o.id + '">' + thumbs(o) + '<span class="or-t"><b>' + o.id + '</b><span>Delivered ' + NL.fD(lastDel(o)) + '</span></span><span class="or-s"><span class="st">' + r.left + ' days left</span><em>Choose items →</em></span></a></li>'; }).join('') + '</ul>' : '<p class="ac-empty">Nothing is eligible for return right now. Delivered orders appear here for 30 days.</p>') +
      '<h2 class="ac-h">Your returns</h2>' + (L.length ? '<ul class="rl">' + L.map(retRow).join('') + '</ul>' : '<p class="ac-empty">No returns yet. We hope it stays that way.</p>');
  }
  function returnForm(c, m, id) {
    var o = NL.order(id), r = o && o.email === c.email ? returnable(o) : null;
    if (!r) { m.innerHTML = '<h1>Start a return</h1><p class="ac-empty">' + (o ? 'This order can’t be returned online' + (NL.openReturn(o) ? ': there’s already a return open for it.' : '.') : 'We couldn’t find that order.') + ' <a class="u" href="#returns">Back to returns</a></p>'; return; }
    var pk = [1, 2, 3].map(function (n) { return NL.addBiz(Date.now(), n); });
    m.innerHTML = '<p class="crumb2"><a class="u" href="#returns">← Returns</a></p><h1>Return from ' + o.id + '</h1><p class="ac-lede">' + r.left + ' days left to return. Choose what’s going back and why; it helps us make better pieces.</p>' +
      '<form id="rtF" novalidate><ul class="rt-i">' + r.lines.map(function (l) { var it = o.items[l.i], p = NL.product(it.pid);
        return '<li data-i="' + l.i + '"><label class="rt-c"><input type="checkbox" data-pick="' + l.i + '"><span class="vh">Return ' + esc(it.name) + '</span></label><span class="od-im">' + (p ? '<img src="' + NL.thumb(p.images[0].src) + '" alt="" width="90" height="112" loading="lazy">' : '') + '</span><div><p class="dr-n">' + esc(it.name) + '</p><p class="dr-m">' + esc(it.col) + (it.s !== 'One size' ? ' · ' + esc(it.s) : '') + ' · ' + money(NL.unitNet(o, l.i)) + ' each</p>' +
          '<div class="rt-o" hidden>' + (l.max > 1 ? '<label class="f"><span>Quantity</span><select data-q="' + l.i + '">' + Array.apply(null, Array(l.max)).map(function (_, k) { return '<option>' + (k + 1) + '</option>'; }).join('') + '</select></label>' : '') + '<label class="f"><span>Reason</span><select data-r="' + l.i + '"><option value="">Choose a reason</option>' + NL.RETR.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select></label></div></div></li>'; }).join('') + '</ul>' +
      '<fieldset class="rt-m"><legend>Refund to</legend><label class="adr-o"><input type="radio" name="rm" value="original" checked><span><b>Original payment</b>' + esc(o.pay.d) + ' · 3 to 5 working days after we receive it</span></label><label class="adr-o"><input type="radio" name="rm" value="credit"><span><b>Northlane store credit</b>Instant once it’s back at the studio, never expires</span></label></fieldset>' +
      '<label class="f w"><span>Pickup from ' + esc(o.addr.l2.split(',').pop().trim() || o.addr.city) + ' on</span><select id="rtP">' + pk.map(function (t, i) { return '<option value="' + t + '">' + NL.fD(t) + (i ? '' : ' (earliest)') + ', 10 am – 6 pm</option>'; }).join('') + '</select></label>' +
      '<label class="f w"><span>Anything we should know? (optional)</span><textarea id="rtN" rows="2" maxlength="300" placeholder="Prefer an exchange for a size up?"></textarea></label>' +
      '<div class="rt-sum"><p id="rtV">Choose the pieces you’re returning.</p><p class="err" id="rtE" role="alert"></p><button class="nl-btn" type="submit">Request return</button></div></form>';
    var f = $('#rtF');
    function val() { var L = sel(); $('#rtV').innerHTML = L.length ? 'Returning ' + NL.plural(L.reduce(function (a, l) { return a + l.q; }, 0), 'item') + ' · estimated refund <b>' + money(L.reduce(function (a, l) { return a + NL.unitNet(o, l.i) * l.q; }, 0)) + '</b>' : 'Choose the pieces you’re returning.'; }
    function sel() { return $$('[data-pick]:checked', f).map(function (cb) { var i = +cb.getAttribute('data-pick'), qs = $('[data-q="' + i + '"]', f); return { i: i, q: qs ? +qs.value : 1, reason: $('[data-r="' + i + '"]', f).value }; }); }
    f.addEventListener('change', function (e) { var cb = e.target.closest('[data-pick]'); if (cb) { var li = cb.closest('li'); $('.rt-o', li).hidden = !cb.checked; li.classList.toggle('on', cb.checked); if (cb.checked) $('[data-r]', li).focus(); } $('#rtE').textContent = ''; val(); });
    f.addEventListener('submit', function (e) { e.preventDefault(); var L = sel(), er = $('#rtE');
      if (!L.length) { er.textContent = 'Tick at least one piece to return.'; return; }
      var nr = L.filter(function (l) { return !l.reason; })[0]; if (nr) { er.textContent = 'Tell us why ' + o.items[nr.i].name + ' is going back.'; $('[data-r="' + nr.i + '"]', f).focus(); return; }
      var res = NL.requestReturn(o, { lines: L, method: f.querySelector('[name=rm]:checked').value, note: $('#rtN').value.trim(), pickup: +$('#rtP').value, by: 'customer' });
      if (!res.ok) { er.textContent = res.msg; return; }
      m.innerHTML = '<div class="rt-done"><p class="eyebrow">' + res.rma.id + '</p><h1>Return requested.</h1><p class="ac-lede">We’ll confirm by email and book a pickup for ' + NL.fD(res.rma.pickup) + '. Pack the pieces in their original bag; the rider brings the label.</p><ol class="lv-p"><li class="on">Requested</li><li>Pickup booked</li><li>Received</li><li>Refunded</li></ol><div class="od-a"><a class="nl-btn sm" href="#returns">See your returns</a><a class="nl-btn ghost sm" href="#order/' + o.id + '">Back to the order</a></div><p class="hint">This page updates as soon as the studio approves, receives and refunds your return.</p></div>';
      m.focus(); });
  }
  function addresses(c, m) {
    var A = c.addrs || [];
    m.innerHTML = '<h1>Addresses</h1><ul class="ad-l">' + A.map(function (a) { return '<li><address>' + adrHtml(a) + '</address>' + (a.def ? '<span class="st">Default</span>' : '') + '<div class="ad-x"><button type="button" class="lnk u" data-ae="' + a.id + '">Edit</button>' + (a.def ? '' : '<button type="button" class="lnk u" data-ad="' + a.id + '">Make default</button>') + '<button type="button" class="lnk u" data-ax="' + a.id + '">Delete</button></div></li>'; }).join('') +
      '<li class="ad-new"><button type="button" id="adNew"><b>+</b> Add an address</button></li></ul>' + (A.length ? '' : '<p class="ac-empty">No saved addresses yet. Add one now, or it’s saved automatically at checkout.</p>');
    $('#adNew').onclick = function () { addrForm(c, null); };
    $$('[data-ae]', m).forEach(function (b) { b.onclick = function () { addrForm(c, A.filter(function (a) { return a.id === b.getAttribute('data-ae'); })[0]); }; });
    $$('[data-ad]', m).forEach(function (b) { b.onclick = function () { var a = A.filter(function (x) { return x.id === b.getAttribute('data-ad'); })[0]; a.def = true; NL.saveAddr(c, a); toast('Default address updated.'); }; });
    $$('[data-ax]', m).forEach(function (b) { b.onclick = function () { var li = b.closest('li'), x = $('.ad-x', li);
      x.innerHTML = '<span>Delete this address?</span><button type="button" class="lnk u" data-yes>Delete</button><button type="button" class="lnk u" data-no>Keep</button>'; $('[data-no]', x).focus();
      $('[data-yes]', x).onclick = function () { NL.removeAddr(c, b.getAttribute('data-ax')); toast('Address deleted.'); }; $('[data-no]', x).onclick = function () { route(); }; }; });
  }
  var ov = $('#acOv');
  function openOv(h) { $('#acOvB').innerHTML = h; ov.hidden = false; requestAnimationFrame(function () { ov.classList.add('open'); var f = ov.querySelector('input'); if (f) f.focus(); }); }
  function closeOv() { ov.classList.remove('open'); ov.hidden = true; }
  ov.addEventListener('click', function (e) { if (e.target === ov) closeOv(); });
  ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeOv(); });
  function addrForm(c, a) {
    a = a || { name: c.name || '', l1: '', l2: '', city: '', state: '', pin: '', def: !(c.addrs || []).length };
    var f = function (k, l, at) { return '<label class="f w" data-f="' + k + '"><span>' + l + '</span><input id="a_' + k + '" value="' + esc(a[k] || '') + '" ' + (at || '') + '><em class="fe" id="ae_' + k + '"></em></label>'; };
    openOv('<p class="eyebrow">' + (a.id ? 'Edit address' : 'New address') + '</p><h2 id="acOvH">' + (a.id ? 'Update the details' : 'Where should we deliver?') + '</h2><form id="adF" novalidate>' + f('name', 'Full name', 'autocomplete="name"') + f('l1', 'Flat, house no., building', 'autocomplete="address-line1"') + f('l2', 'Street, area, landmark', 'autocomplete="address-line2"') +
      '<div class="row3">' + f('pin', 'Pincode', 'inputmode="numeric" maxlength="6"') + f('city', 'City') + f('state', 'State') + '</div><label class="tgl"><input type="checkbox" id="a_def"' + (a.def ? ' checked' : '') + '><span>Use as my default address</span></label><div class="ov-a"><button type="button" class="nl-btn ghost" id="adX">Cancel</button><button class="nl-btn" type="submit">Save address</button></div></form>');
    $('#adX').onclick = closeOv;
    $('#a_pin').oninput = function () { var v = this.value.replace(/\D/g, '').slice(0, 6); this.value = v; if (v.length === 6) { var r = NL.pin(v); $('#ae_pin').textContent = r.ok ? (r.cod ? '' : 'Prepaid delivery only here.') : r.msg; $('[data-f="pin"]').classList.toggle('bad', !r.ok); if (r.ok) { if (r.city) $('#a_city').value = r.city; $('#a_state').value = r.state; } } };
    $('#adF').onsubmit = function (e) { e.preventDefault(); var bad = '', v = {}; ['name', 'l1', 'l2', 'pin', 'city', 'state'].forEach(function (k) { v[k] = $('#a_' + k).value.trim(); });
      var M = { name: v.name.length < 2 && 'Who should we address it to?', l1: v.l1.length < 3 && 'Add the flat, house or building.', l2: v.l2.length < 3 && 'Add the street and area.', pin: !NL.pin(v.pin).ok && NL.pin(v.pin).msg, city: !v.city && 'Add the city.', state: !v.state && 'Add the state.' };
      Object.keys(M).forEach(function (k) { $('#ae_' + k).textContent = M[k] || ''; $('[data-f="' + k + '"]').classList.toggle('bad', !!M[k]); if (M[k] && !bad) bad = k; });
      if (bad) { $('#a_' + bad).focus(); return; }
      NL.saveAddr(c, Object.assign({}, a, v, { def: $('#a_def').checked })); closeOv(); route.quiet = true; route(); route.quiet = false; toast(a.id ? 'Address updated.' : 'Address saved.'); };
  }
  function saved(c, m) {
    var L = S.wish().map(NL.product).filter(function (p) { return p && p.status === 'active'; });
    m.innerHTML = '<h1>Saved pieces</h1>' + (L.length ? '<ul class="grid g3 sv">' + L.map(function (p) { var t = NL.totalStock(p); return S.card(p).replace('</li>', '<p class="sv-s">' + (t ? (t < 5 ? 'Only a few left' : 'In stock') : 'Sold out · we can email you') + '</p><a class="nl-btn ghost sm" href="product.html?id=' + p.id + '">' + (t ? 'Choose a size' : 'Get a restock alert') + '</a></li>'); }).join('') + '</ul>' : '<p class="ac-empty">Nothing saved yet. Tap the heart on any piece to keep it here. <a class="u" href="shop.html">Browse the shop</a></p>');
  }
  function details(c, m) {
    m.innerHTML = '<h1>Details</h1><form id="dtF" class="dt" novalidate><label class="f w"><span>Name</span><input id="d_n" value="' + esc(c.name || '') + '" autocomplete="name"></label><label class="f w"><span>Email</span><input value="' + esc(c.email) + '" readonly aria-describedby="dEm"><em class="fe" id="dEm">Your sign-in email. It can’t be changed here.</em></label>' +
      '<label class="f w"><span>Mobile</span><input id="d_p" value="' + esc(c.phone || '') + '" inputmode="numeric" maxlength="10" placeholder="10-digit mobile"><em class="fe" id="dPe"></em></label><label class="tgl"><input type="checkbox" id="d_m"' + (c.mkt ? ' checked' : '') + '><span>Northlane letters: new pieces and repair days, once a month</span></label>' +
      '<div class="dt-c"><span class="eyebrow">Store credit</span><b>' + money(c.credit || 0) + '</b><span>' + (c.credit ? 'Applied automatically at checkout in a live store.' : 'Choose store credit on a return and it lands here instantly.') + '</span></div><div class="dt-a"><button class="nl-btn" type="submit">Save details</button><button type="button" class="nl-btn ghost" id="dtOut">Sign out</button></div></form>';
    $('#dtOut').onclick = function () { NL.signOut(); S.counts(); location.hash = ''; signin(); scrollTo(0, 0); };
    $('#dtF').onsubmit = function (e) { e.preventDefault(); var ph = $('#d_p').value.replace(/\D/g, ''); if (ph && (ph.length !== 10 || !/^[6-9]/.test(ph))) { $('#dPe').textContent = 'Indian mobile numbers have 10 digits and start with 6 to 9.'; $('#d_p').focus(); return; }
      var x = NL.custByEmail(c.email); if (x) NL.updateCustomer(c.email, { name: $('#d_n').value.trim() || x.name, phone: ph, mkt: $('#d_m').checked });
      S.counts(); toast('Details saved.'); };
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-reorder]'); if (!b) return; var o = NL.order(b.getAttribute('data-reorder')); if (!o) return;
    var added = 0, miss = [];
    o.items.forEach(function (it) { var p = NL.product(it.pid); if (!p || p.status !== 'active') { miss.push(it.name + ' (no longer sold)'); return; } var r = S.add(it.pid, it.c, it.s, it.q, true); if (r.ok) added += r.q; else miss.push(it.name + ' in ' + it.col + (it.s !== 'One size' ? ', ' + it.s : '') + ' (sold out)'); });
    if (added) S.openCart(); toast((added ? NL.plural(added, 'piece') + ' added to your bag.' : 'Nothing could be added.') + (miss.length ? ' Not available: ' + miss.join(', ') + '.' : ''));
  });
  addEventListener('hashchange', function () { route(); var mm = $('#acMain'); if (mm) mm.focus({ preventScroll: true }); scrollTo(0, 0); });
  S.onChange.push(function (sc) { if (sc === 'cart') return; var a = document.activeElement; if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT') && sc !== 'session' && !ov.contains(a) && a.id !== 'siE') return; route.quiet = true; route(); route.quiet = false; });
  route();
})();
