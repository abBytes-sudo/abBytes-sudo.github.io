/* Northlane order tracking (design sample). Reads the shared demo database (store/nl-data.js) and updates live when the admin moves an order on. */
(function () {
  'use strict';
  var NL = window.NL, S = window.NLS; if (!NL) return;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = NL.esc, money = NL.money, form = $('#tf'), res = $('#res'), errEl = $('#tErr'), cur = null, curEmail = '', reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var qs = new URLSearchParams(location.search), isNew = qs.get('new') === '1';
  var HEAD = { placed: 'We’ve got your order', packed: 'Packed and ready to go', shipped: 'On its way to you', out: 'Out for delivery today', delivered: 'Delivered. Enjoy.', cancelled: 'This order was cancelled' };
  var NOTE = { placed: 'We pack every order by hand at our Jaipur studio, usually within a working day.', packed: 'It’s wrapped and waiting for the courier to collect it.', shipped: 'Your parcel is moving between our courier’s hubs.', out: 'Your rider is on the way. Keep your phone handy.', delivered: 'Thanks for shopping with Northlane. Returns are free for 30 days.', cancelled: 'Anything you paid has been refunded to your original payment method.' };
  var CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8"/></svg>';
  var RST = { requested: 'Return requested', approved: 'Pickup booked', received: 'Received at the studio', refunded: 'Refunded', rejected: 'Return declined' };
  var demo = NL.demo(); $('#demoHint').innerHTML = 'Try <b>' + esc(demo.order) + '</b> with <b>' + esc(demo.email) + '</b>';
  $('#tNum').placeholder = demo.order;

  function submit(num, email, quiet) {
    errEl.textContent = '';
    if (!num.trim() || !email.trim()) { errEl.textContent = 'Please enter both your order number and email address.'; (num.trim() ? $('#tEmail') : $('#tNum')).focus(); return; }
    var o = NL.findOrder(num, email);
    if (!o) { cur = null; res.hidden = true; errEl.textContent = NL.findOrder(num) ? 'That order exists, but not with this email. Use the address you checked out with.' : 'We couldn’t find ' + esc(num.trim().toUpperCase()) + '. Check the number on your confirmation, or try ' + demo.order + '.'; return; }
    cur = o.id; curEmail = o.email; render(o, true); try { history.replaceState(null, '', '?o=' + encodeURIComponent(o.id) + '&e=' + encodeURIComponent(o.email) + (isNew ? '&new=1' : '')); } catch (e) {}
    if (!quiet) { var h = $('#stH'); if (h) h.focus({ preventScroll: true }); res.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
  }

  function steps(o) {
    var st = NL.stage(o), i = Math.max(0, NL.STG.indexOf(st)), fin = st === 'delivered', sh = o.ships[0] || { ev: {} };
    var notes = ['Order confirmed', 'Packed by hand in Jaipur', (sh.carrier || NL.CARRIER[o.m === 'exp' ? 'exp' : o.m === 'same' ? 'same' : 'std'].name) + ' has it', 'With your rider', 'At your door'];
    var when = [o.t, sh.ev.packed, sh.ev.shipped, sh.ev.out, sh.ev.delivered];
    return ['Placed', 'Packed', 'Shipped', 'Out for delivery', 'Delivered'].map(function (l, j) {
      var done = j <= i, d = done && when[j] ? NL.fD(when[j]) + ', ' + NL.fT(when[j]) : j === 4 ? 'Est. ' + NL.etaText(o) : 'Pending';
      return '<li class="' + (done ? 'done' : '') + (j === i ? ' cur' : '') + (j === i && fin ? ' fin' : '') + '" style="--i:' + j + '"' + (j === i ? ' aria-current="step"' : '') + '><span class="dot">' + CHECK + '</span><div class="tl-tx"><b>' + l + '</b><span class="tl-d">' + d + '</span><span class="tl-n">' + (done ? notes[j] : '') + '</span></div></li>';
    }).join('');
  }
  function itemsHtml(o, lines) { return '<ul class="items">' + lines.map(function (l) { var it = o.items[l.i], p = NL.product(it.pid);
    return '<li class="it"><div class="thumb">' + (p ? '<img src="' + NL.thumb(p.images[0].src) + '" alt="" width="90" height="112" loading="lazy" decoding="async">' : '') + '</div><div class="it-tx"><b>' + esc(it.name) + '</b><span>' + esc(it.col) + (it.s !== 'One size' ? ' · ' + esc(it.s) : '') + ' · Qty ' + l.q + '</span></div><span class="it-p">' + money(it.price * l.q) + '</span></li>'; }).join('') + '</ul>'; }
  function scanList(o, sh) {
    var E = NL.scans(o, sh), lastDone = -1; E.forEach(function (e, i) { if (e.done) lastDone = i; });
    return '<ol class="scn">' + E.map(function (e, i) { return '<li class="' + (e.done ? 'd' : 'p') + (i === lastDone ? ' now' : '') + '"><span class="scn-t">' + (e.done ? NL.fD(e.t) + '<br>' + NL.fT(e.t) : 'Expected<br>' + NL.fD(e.t)) + '</span><span class="scn-m"><b>' + esc(e.msg) + '</b>' + esc(e.place) + '</span></li>'; }).reverse().join('') + '</ol>';
  }
  function shipCard(o, sh, k, n) {
    var stI = NL.STG.indexOf(sh.stage);
    return '<section class="card shp" aria-label="Parcel ' + (k + 1) + '"><div class="route-h"><h3>' + (n > 1 ? 'Parcel ' + (k + 1) + ' of ' + n : 'The journey') + '</h3><p class="rtNote" data-rn="' + k + '"></p></div>' +
      '<div class="route" data-route="' + k + '"></div>' +
      '<div class="shp-g"><dl class="kv"><div><dt>Carrier</dt><dd>' + esc(sh.carrier) + '</dd></div><div><dt>Tracking no.</dt><dd>' + (sh.awb ? '<span class="mono">' + esc(sh.awb) + '</span><button class="copy" type="button" data-copy="' + esc(sh.awb) + '">Copy</button>' : 'Added when it ships') + '</dd></div><div><dt>Status</dt><dd>' + NL.STGL[sh.stage] + (sh.stage !== 'delivered' && sh.eta ? ' · due ' + (sh.stage === 'out' ? 'today' : NL.fD(sh.eta)) : '') + '</dd></div>' + (n > 1 ? '<div><dt>In this parcel</dt><dd>' + NL.plural(sh.lines.reduce(function (a, l) { return a + l.q; }, 0), 'item') + '</dd></div>' : '') + '</dl>' +
      '<details class="scd"' + (stI >= 2 ? ' open' : '') + '><summary>Courier updates</summary>' + scanList(o, sh) + '</details></div>' + (n > 1 ? itemsHtml(o, sh.lines) : '') + '</section>';
  }
  function pendingCard(o) { var L = o.items.map(function (it, i) { return { i: i, q: NL.remaining(o, i) }; }).filter(function (l) { return l.q > 0; }); if (!L.length || !o.ships.length || o.cancelled) return '';
    return '<section class="card shp pend"><div class="route-h"><h3>Still to pack</h3><p>Ships separately as soon as it’s back on the shelf. No extra delivery charge.</p></div>' + itemsHtml(o, L) + '</section>'; }

  function render(o, animate) {
    var st = NL.stage(o), city = o.addr.city, ps = NL.payStatus(o), n = o.ships.length, rts = o.rets || [];
    var thx = $('#thx');
    if (isNew) { $('#tHero').hidden = true; thx.hidden = false;
      thx.innerHTML = '<p class="eyebrow">Order ' + o.id + ' · ' + NL.fDT(o.t) + '</p><h1 id="thxH" tabindex="-1">Thank you, ' + esc(o.name.split(' ')[0]) + '. <em>It’s confirmed.</em></h1>' +
        '<p class="lede">A confirmation is on its way to <b>' + esc(o.email) + '</b> and by WhatsApp to ' + esc(NL.maskPhone(o.addr.phone)) + '. ' + (o.pay.m === 'COD' ? 'Please keep ' + money(o.total) + ' ready for the rider.' : money(o.total) + ' paid by ' + esc(o.pay.d) + '.') + '</p>' +
        '<ol class="nx"><li><b>Today</b><span>We pack it by hand at the Jaipur studio' + (o.gift && o.gift.note ? ' and handwrite your gift note' : '') + '.</span></li><li><b>When it ships</b><span>You’ll get the tracking number by email and WhatsApp. This page updates on its own.</span></li><li><b>' + esc(NL.etaText(o)) + '</b><span>Expected at ' + esc(o.addr.l2.split(',').pop().trim() || city) + '. Returns are free for 30 days.</span></li></ol>' +
        '<div class="thx-a"><a class="btn" href="../store/account.html#order/' + o.id + '">View in your account <span class="arrow" aria-hidden="true">→</span></a><a class="btn ghost" href="../store/shop.html">Continue shopping</a><a class="lnk" href="admin.html#/orders/' + o.id + '">Open it in the back office</a></div>';
      if (animate) { var h = $('#thxH'); if (h) h.focus({ preventScroll: true }); if (window.gsap && window.Motion && !Motion.reduce) gsap.from($$('#thx > *'), { autoAlpha: 0, y: 30, duration: 1.2, ease: 'power4.out', stagger: .08, clearProps: 'all' }); } }
    var tot = '<div class="sum"><div><span>Subtotal</span><span>' + money(o.sub) + '</span></div>' + (o.disc ? '<div><span>' + esc(o.disc.code) + '</span><span>' + (o.disc.amt ? '−' + money(o.disc.amt) : 'Free shipping') + '</span></div>' : '') + '<div><span>Delivery</span><span>' + (o.shipFee ? money(o.shipFee) : 'Free') + '</span></div>' + (o.gift && o.gift.fee ? '<div><span>Gift wrap</span><span>' + money(o.gift.fee) + '</span></div>' : '') + (o.codFee ? '<div><span>COD fee</span><span>' + money(o.codFee) + '</span></div>' : '') + '<div class="tot"><span>Total</span><span>' + money(o.total) + '</span></div>' +
      o.refunds.map(function (r) { return '<div class="rf"><span>Refunded ' + NL.fDs(r.t) + '</span><span>−' + money(r.amt) + '</span></div>'; }).join('') + '</div>';
    var ships = o.ships.map(function (sh, k) { return shipCard(o, sh, k, n + (pendingCard(o) ? 1 : 0)); }).join('') + pendingCard(o);
    if (!n && !o.cancelled) ships = '<section class="card shp"><div class="route-h"><h3>The journey</h3><p class="rtNote" data-rn="0"></p></div><div class="route" data-route="0"></div><p class="shp-w">Tracking appears here as soon as ' + NL.CARRIER[o.m === 'exp' ? 'exp' : o.m === 'same' ? 'same' : 'std'].name + ' collects your parcel.</p></section>';
    res.innerHTML = '<div class="res-grid"><div class="res-main">' +
      '<section class="card st-head" aria-labelledby="stH"><p class="eyebrow">Order ' + o.id + ' · placed ' + NL.fD(o.t) + '</p><h2 id="stH" tabindex="-1">' + HEAD[st] + '</h2>' +
      '<p class="eta"><span class="eta-k">' + (st === 'delivered' ? 'Delivered' : st === 'cancelled' ? 'Status' : 'Estimated delivery') + '</span><b>' + esc(NL.etaText(o)) + '</b><span class="eta-note">' + NOTE[st] + (NL.fulfilment(o) === 'partial' ? ' It’s coming in more than one parcel: one item was short on the shelf.' : '') + '</span></p></section>' +
      (st !== 'cancelled' ? '<section class="card" aria-label="Order progress"><ol class="tl" id="tl">' + steps(o) + '</ol></section>' : '') + ships +
      (rts.length ? '<section class="card"><h3>Returns</h3>' + rts.map(function (r) { return '<div class="rtn"><p><b>' + r.id + '</b> · ' + RST[r.st] + '</p><p>' + r.lines.map(function (l) { return esc(o.items[l.i].name) + (l.q > 1 ? ' × ' + l.q : ''); }).join(', ') + ' · ' + esc(r.lines[0].reason) + '</p><p class="rtn-n">' + (r.st === 'approved' ? 'Pickup on ' + NL.fD(r.pickup || Date.now()) + (r.awb ? ' · ' + r.awb : '') : r.st === 'refunded' ? 'Refunded ' + NL.fD(r.ev.refunded) : r.st === 'received' ? 'Refund within two working days' : r.st === 'requested' ? 'We’ll confirm within a working day' : '') + '</p></div>'; }).join('') + '<a class="lnk" href="../store/account.html#returns">Manage returns</a></section>' : '') +
      '</div><aside class="res-side" aria-label="Order details">' +
      '<section class="card"><h3>Delivering to</h3><address><b>' + esc(o.name) + '</b><br>' + esc(o.addr.l1) + '<br>' + esc(o.addr.l2) + '<br>' + esc(o.addr.city) + ', ' + esc(o.addr.state) + ' ' + esc(o.addr.pin) + '</address><p class="sd-m">' + esc(NL.METHOD[o.m] || 'Collected in store') + ' delivery' + (o.gift ? ' · gift' + (o.gift.wrap ? ', wrapped' : '') : '') + '</p></section>' +
      '<section class="card"><h3>Payment</h3><p class="pay-s"><span class="pill ps-' + ps + '">' + NL.PAYL[ps] + '</span>' + esc(o.pay.d) + '</p></section>' +
      '<section class="card"><h3>In this order</h3>' + itemsHtml(o, o.items.map(function (it, i) { return { i: i, q: it.q }; })) + tot + '</section>' +
      '<section class="card"><h3>Need a hand?</h3><p class="sd-m">Returns are free within 30 days and we collect from your door. <a class="lnk" href="../store/account.html#order/' + o.id + '">Open this order in your account</a></p></section>' +
      '</aside></div><p class="res-note">This page updates the moment the studio moves your order along. <a class="lnk" href="admin.html#/orders/' + o.id + '">Open it in the admin</a> in another tab and watch this page update.</p>';
    res.hidden = false;
    if (animate && window.gsap && window.Motion && !Motion.reduce) gsap.from(res.querySelectorAll('.card, .res-note'), { autoAlpha: 0, y: 36, duration: 1.2, ease: 'power4.out', stagger: .07, clearProps: 'all' });
    var tl = $('#tl'); if (tl) { if (reduce || !animate) tl.classList.add('go'); else requestAnimationFrame(function () { requestAnimationFrame(function () { tl.classList.add('go'); }); }); }
    $$('[data-route]').forEach(function (box) { var k = +box.getAttribute('data-route'); drawRoute(o, o.ships[k], box, $('[data-rn="' + k + '"]'), animate); });
    $$('[data-copy]').forEach(function (c) { c.addEventListener('click', function () { var v = c.getAttribute('data-copy');
      try { navigator.clipboard.writeText(v).then(function () { c.textContent = 'Copied'; }, function () { c.textContent = 'Select to copy'; }); } catch (e) { c.textContent = 'Select to copy'; }
      setTimeout(function () { c.textContent = 'Copy'; }, 1800); }); });
  }

  /* route: studio → sort centre → city, drawn from real coordinates, parcel moves to where the last scan put it */
  function proj(lat, lon) { return [(lon - 68) * Math.cos(22 * Math.PI / 180), (36 - lat)]; }
  function progress(o, sh) {
    if (!sh) return { pv: 0, n: 1, label: 'Waiting to be packed at our Jaipur studio' };
    var E = NL.scans(o, sh), local = o.addr.city === 'Jaipur', n = local ? 1 : 2, by = {}, now = Date.now(); E.forEach(function (e) { by[e.k] = e; });
    var city = o.addr.city, pv = 0, label;
    function lerp(a, b, from, to) { if (!a || !b) return from; var f = Math.max(0, Math.min(1, (now - a.t) / Math.max(1, b.t - a.t))); return from + (to - from) * f; }
    if (sh.stage === 'delivered') { pv = n; label = 'Delivered to ' + city + ' on ' + NL.fD(sh.ev.delivered); }
    else if (sh.stage === 'out') { pv = n - .05; label = 'Out for delivery in ' + city + ' with ' + sh.rider; }
    else if (sh.stage === 'shipped') {
      if (local) { pv = .5; label = 'With ' + sh.carrier + ', on its way across Jaipur'; }
      else if (by.dest && by.dest.done) { pv = 2 - .08; label = 'At the ' + city + ' delivery centre'; }
      else if (by.hubdep && by.hubdep.done) { pv = lerp(by.hubdep, by.dest, 1.02, 1.9); label = 'On the road from ' + NL.HUB[(NL.geo(city) || {}).region || 'C'].short + ' to ' + city; }
      else if (by.hub && by.hub.done) { pv = 1; label = 'Being sorted at the ' + by.hub.place + ' sort centre'; }
      else if (by.depart && by.depart.done) { pv = lerp(by.depart, by.hub, .05, .96); label = 'On a linehaul truck towards ' + (by.hub ? by.hub.place : city); }
      else { pv = .02; label = 'Collected by ' + sh.carrier + ' in Jaipur'; }
    } else { pv = 0; label = 'Packed at our Jaipur studio, waiting for ' + sh.carrier; }
    return { pv: pv, n: n, label: label, E: E, local: local };
  }
  var rafs = [];
  function drawRoute(o, sh, box, note, animate) {
    var g = NL.geo(o.addr.city) || { lat: 22, lon: 79, region: 'C' }, hub = NL.HUB[g.region] || NL.HUB.C, local = o.addr.city === 'Jaipur';
    var pts = [[NL.ORIGIN.lat, NL.ORIGIN.lon, 'Jaipur studio']].concat(local ? [] : [[hub.lat, hub.lon, hub.short + ' sort centre']]).concat([[g.lat, g.lon, o.addr.city]]);
    if (local) pts[1][0] += .04;
    var P = progress(o, sh); if (note) note.textContent = o.cancelled ? 'Cancelled before it left the studio' : P.label;
    var w = Math.max(280, Math.round(box.clientWidth)), h = w < 520 ? 250 : 330, pad = w < 520 ? 36 : 56;
    var pp = pts.map(function (p) { return proj(p[0], p[1]); }), xs = pp.map(function (p) { return p[0]; }), ys = pp.map(function (p) { return p[1]; });
    var minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs), miny = Math.min.apply(null, ys), maxy = Math.max.apply(null, ys), sx = Math.max(maxx - minx, .6), sy = Math.max(maxy - miny, .6);
    var k = Math.min((w - pad * 2) / sx, (h - pad * 2) / sy); if (local) k = Math.min(k, 900);
    var ox = (w - sx * k) / 2 - minx * k + (sx < .7 ? 0 : 0), oy = (h - sy * k) / 2 - miny * k;
    function XY(lat, lon) { var q = proj(lat, lon); return [q[0] * k + ox, q[1] * k + oy]; }
    var xy = pts.map(function (p) { return XY(p[0], p[1]); });
    var segs = []; for (var i = 0; i < xy.length - 1; i++) { var a = xy[i], b = xy[i + 1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy) || 1, bend = Math.min(.22 * L, 70);
      segs.push('M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' Q' + (mx - dy / L * bend).toFixed(1) + ' ' + (my + dx / L * bend).toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1)); }
    var taken = xy.map(function (q) { return [q[0], q[1]]; });
    function free(x, y) { return taken.every(function (t) { return Math.abs(t[0] - x) > 64 || Math.abs(t[1] - y) > 16; }); }
    var cities = Object.keys(NL.CITY).map(function (c) { var C = NL.CITY[c], q = XY(C[3], C[4]); if (c === o.addr.city || c === 'Jaipur' || q[0] < -10 || q[0] > w + 10 || q[1] < -10 || q[1] > h + 10) return '';
      var lab = free(q[0] + 6, q[1]); if (lab) taken.push([q[0] + 6, q[1]]);
      return '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="2" fill="rgba(19,17,15,.22)"/>' + (lab ? '<text class="ct" x="' + (q[0] + 6).toFixed(1) + '" y="' + (q[1] + 3).toFixed(1) + '">' + esc(c) + '</text>' : ''); }).join('');
    var hubClose = xy.length === 3 && Math.abs(xy[1][0] - xy[2][0]) < 90 && Math.abs(xy[1][1] - xy[2][1]) < 30;
    var del = sh && sh.stage === 'delivered';
    box.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Route from the Northlane studio in Jaipur' + (local ? '' : ' through ' + esc(hub.short)) + ' to ' + esc(o.addr.city) + '. ' + esc(P.label) + '.">' +
      '<defs><pattern id="gr' + box.getAttribute('data-route') + '" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="rgba(19,17,15,.055)"/></pattern></defs><rect width="' + w + '" height="' + h + '" fill="url(#gr' + box.getAttribute('data-route') + ')"/>' + cities +
      segs.map(function (d) { return '<path d="' + d + '" fill="none" stroke="rgba(19,17,15,.24)" stroke-width="2.5" stroke-dasharray="2 8" stroke-linecap="round"/>'; }).join('') +
      segs.map(function (d) { return '<path class="rp" d="' + d + '" fill="none" stroke="#9C4A2B" stroke-width="3.5" stroke-linecap="round"/>'; }).join('') +
      xy.map(function (q, i) { var last = i === xy.length - 1, first = i === 0;
        return '<g transform="translate(' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ')">' + (first ? '<rect x="-11" y="-11" width="22" height="22" fill="#13110F"/><path d="M-5 0h10M0 -5v10" stroke="#F5F2EC" stroke-width="1.8" stroke-linecap="round"/>' : last ? '<circle r="13" fill="' + (del ? '#4E6B45' : '#fff') + '" stroke="#13110F" stroke-width="1.8"/><path d="M-5 1.5L0-4l5 5.5M-3.5 0v5h7V0" fill="none" stroke="' + (del ? '#fff' : '#13110F') + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>' : '<circle r="6" fill="#F5F2EC" stroke="#13110F" stroke-width="1.6"/>') +
          (i === 1 && hubClose && !last ? '' : '<text class="lb" x="' + (q[0] > w - 120 ? -18 : 18) + '" y="' + (first ? -16 : last ? 28 : 4) + '" text-anchor="' + (q[0] > w - 120 ? 'end' : 'start') + '">' + esc(last && hubClose ? pts[i][2] + ' · via ' + pts[1][2] : pts[i][2]) + '</text>') + '</g>'; }).join('') +
      '<g class="rpar" aria-hidden="true"' + (del || o.cancelled ? ' style="display:none"' : '') + '><circle class="rt-ring" r="15" fill="none" stroke="#9C4A2B" stroke-width="2"/><circle r="11" fill="#9C4A2B"/><path d="M-5 -2.5l5 -2.5 5 2.5v5l-5 2.5 -5 -2.5zM-5 -2.5l5 2.5 5 -2.5M0 0v5" fill="none" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></g></svg>';
    var paths = $$('.rp', box), par = $('.rpar', box), lens = paths.map(function (p) { return p.getTotalLength(); });
    function set(v) { paths.forEach(function (p, i) { var f = Math.max(0, Math.min(1, v - i)); p.style.strokeDasharray = lens[i]; p.style.strokeDashoffset = lens[i] * (1 - f); });
      var si = Math.min(paths.length - 1, Math.floor(v)), f = Math.max(0, Math.min(1, v - si)), pt = paths[si].getPointAtLength(lens[si] * f); par.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')'); }
    var id = +box.getAttribute('data-route'); cancelAnimationFrame(rafs[id]);
    if (!animate || reduce) { set(P.pv); return; }
    set(0); var t0 = performance.now();
    (function tick(t) { var q = Math.min(1, Math.max(0, (t - t0 - 450) / 2000)); set(P.pv * (1 - Math.pow(1 - q, 3))); if (q < 1) rafs[id] = requestAnimationFrame(tick); })(t0);
  }

  (function () { var de = document.documentElement; if (!de.classList.contains('motion-on')) return;
    function show() { $$('.t-hero [data-now], .t-ph').forEach(function (e) { e.style.visibility = 'visible'; }); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { requestAnimationFrame(show); }); setTimeout(show, 2500); })();
  form.addEventListener('submit', function (e) { e.preventDefault(); isNew = false; submit($('#tNum').value, $('#tEmail').value); });
  $('#demoFill').addEventListener('click', function () { $('#tNum').value = demo.order; $('#tEmail').value = demo.email; errEl.textContent = ''; $('#tNum').focus(); });
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { var o = cur && NL.order(cur); if (o) $$('[data-route]').forEach(function (box) { var k = +box.getAttribute('data-route'); drawRoute(o, o.ships[k], box, $('[data-rn="' + k + '"]'), false); }); }, 150); });
  addEventListener('nl:change', function () { if (!cur) return; var o = NL.order(cur); if (o) render(o, false); });

  var q = qs.get('o') || '', qe = qs.get('e') || '';
  if (!q) { var s = NL.session(); if (s) { $('#tEmail').value = s.email; } }
  if (q) { $('#tNum').value = q; if (!qe) { var hit = NL.findOrder(q); if (hit) qe = hit.email; }
    if (qe) { $('#tEmail').value = qe; submit(q, qe, isNew); if (isNew) scrollTo(0, 0); } }
})();
