/* Northlane order tracking page (design sample). Reads orders from this browser's localStorage. */
(function () {
  'use strict';
  var N = window.NLO, $ = function (s, r) { return (r || document).querySelector(s); };
  var form = $('#tf'), res = $('#res'), errEl = $('#tErr'), cur = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HEAD = { placed: 'We’ve got your order', packed: 'Packed and ready to go', shipped: 'On its way to you', out: 'Out for delivery today', delivered: 'Delivered. Enjoy.' };
  var NOTE = { placed: 'We’ll pack it by hand at our studio.', packed: 'Waiting for the courier to collect it.', shipped: 'Your parcel is moving between depots.', out: 'Your courier is on the way, keep an eye on the door.', delivered: 'Thanks for shopping with Northlane.' };
  var FRAC = [0, .14, .5, .84, 1];
  var CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8"/></svg>';

  function submit(num, email) {
    errEl.textContent = '';
    if (!num.trim() || !email.trim()) { errEl.textContent = 'Please enter both your order number and email address.'; (num.trim() ? $('#tEmail') : $('#tNum')).focus(); return; }
    var o = N.find(num, email);
    if (!o) { cur = null; res.hidden = true; errEl.textContent = 'We couldn’t find an order matching those details. Check the number and email, or try NL-10482.'; return; }
    cur = o.id; render(o); try { history.replaceState(null, '', '?o=' + encodeURIComponent(o.id) + '&e=' + encodeURIComponent(o.email)); } catch (e) {}
    var h = $('#stH'); if (h) h.focus({ preventScroll: true });
    res.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  function steps(o) {
    var i = N.IDX[o.status], fin = o.status === 'delivered';
    var notes = ['Order confirmed', 'Packed by hand at our studio', (o.carrier || N.carrierFor(o)) + ' collects', 'Courier on the way', 'Left at your door'];
    return N.STEPS.map(function (s, j) {
      var done = j <= i, d = o.ev[s.k] ? N.fmtD(o.ev[s.k]) + ', ' + N.fmtT(o.ev[s.k]) : (j === 4 ? 'Est. ' + N.eta(o) : 'Pending');
      return '<li class="' + (done ? 'done' : '') + (j === i ? ' cur' : '') + (j === i && fin ? ' fin' : '') + '" style="--i:' + j + '"' + (j === i ? ' aria-current="step"' : '') + '><span class="dot">' + CHECK + '</span><div class="tl-tx"><b>' + s.l + '</b><span class="tl-d">' + d + '</span><span class="tl-n">' + (done ? notes[j] : '') + '</span></div></li>';
    }).join('');
  }

  function render(o) {
    var by = N.byId, i = N.IDX[o.status], fin = o.status === 'delivered', city = o.addr.city.split(',')[0];
    var items = o.items.map(function (it) {
      var p = by[it.id], col = p.colors[it.c] || p.colors[0];
      return '<li class="it"><div class="thumb">' + N.img(p) + '</div><div class="it-tx"><b>' + N.esc(p.name) + '</b><span>' + N.esc(col.n) + ' · ' + N.esc(it.s) + ' · Qty ' + it.q + '</span></div><span class="it-p">' + N.money(p.price * it.q) + '</span></li>';
    }).join('');
    var ship = o.tracking
      ? '<div><dt>Carrier</dt><dd>' + N.esc(o.carrier) + '</dd></div><div><dt>Tracking no.</dt><dd><span class="mono" id="trk">' + N.esc(o.tracking) + '</span><button class="copy" type="button" id="cpy">Copy</button></dd></div>'
      : '<div><dt>Carrier</dt><dd>' + N.esc(N.carrierFor(o)) + '</dd></div><div><dt>Tracking no.</dt><dd>Added when your parcel ships</dd></div>';
    res.innerHTML = '<div class="res-grid"><div class="res-main">' +
      '<section class="card st-head" aria-labelledby="stH"><p class="eyebrow">Order ' + o.id + ' · placed ' + N.fmtD(o.ev.placed) + '</p><h2 id="stH" tabindex="-1">' + HEAD[o.status] + '</h2>' +
      '<p class="eta"><span class="eta-k">' + (fin ? 'Delivered on' : 'Estimated delivery') + '</span><b>' + N.eta(o) + '</b><span class="eta-note">' + NOTE[o.status] + '</span></p></section>' +
      '<section class="card" aria-label="Order progress"><ol class="tl" id="tl">' + steps(o) + '</ol></section>' +
      '<section class="card" aria-label="Delivery route"><div class="route-h"><h3>The journey</h3><p id="rtNote"></p></div><div id="route"></div></section></div>' +
      '<aside class="res-side" aria-label="Order details">' +
      '<section class="card"><h3>Shipment</h3><dl class="kv">' + ship + '<div><dt>Service</dt><dd>' + o.method + ' delivery</dd></div></dl></section>' +
      '<section class="card"><h3>Delivering to</h3><address><b>' + N.esc(o.name) + '</b><br>' + N.esc(o.addr.l1) + '<br>' + N.esc(o.addr.city) + ' ' + N.esc(o.addr.pc) + '<br>' + N.esc(o.addr.cn) + '</address></section>' +
      '<section class="card"><h3>In this order</h3><ul class="items">' + items + '</ul><div class="sum"><div><span>Subtotal</span><span>' + N.money(N.sub(o)) + '</span></div><div><span>Shipping</span><span>' + (o.ship ? N.money(o.ship) : 'Free') + '</span></div><div class="tot"><span>Total</span><span>' + N.money(N.total(o)) + '</span></div></div></section>' +
      '</aside></div><p class="res-note">Status updates when the store admin moves your order along (demo, in this browser). <a class="lnk" href="admin.html">Open the admin to try it</a>.</p>';
    res.hidden = false;
    if (window.gsap && window.Motion && !Motion.reduce) gsap.from(res.querySelectorAll('.card, .res-note'), { autoAlpha: 0, y: 36, duration: 1.2, ease: 'power4.out', stagger: .09, clearProps: 'all' });
    var tl = $('#tl'); if (reduce) tl.classList.add('go'); else requestAnimationFrame(function () { requestAnimationFrame(function () { tl.classList.add('go'); }); });
    drawRoute(o, city, true);
    var c = $('#cpy'); if (c) c.addEventListener('click', function () {
      try { navigator.clipboard.writeText(o.tracking).then(function () { c.textContent = 'Copied'; }, function () { c.textContent = 'Press ⌘/Ctrl+C'; }); } catch (e) { c.textContent = 'Select to copy'; }
      setTimeout(function () { c.textContent = 'Copy'; }, 1800);
    });
  }

  /* stylised route: hub → destination, parcel travels to the current stage */
  var raf = 0;
  function drawRoute(o, city, animate) {
    var box = $('#route'); if (!box) return;
    var w = Math.max(280, Math.round(box.clientWidth)), h = w < 520 ? 190 : 220, i = N.IDX[o.status], f = FRAC[i];
    var d = 'M30 ' + (h - 50) + ' C ' + w * .24 + ' ' + (h - 50) + ', ' + w * .2 + ' ' + h * .46 + ', ' + w * .5 + ' ' + h * .46 + ' S ' + w * .78 + ' 52, ' + (w - 34) + ' 52';
    var lab = o.status === 'delivered' ? 'Delivered to ' + city : ['At our Louisville hub', 'Packed, leaving the hub', 'In transit with ' + (o.carrier || '').split(' ')[0], (2 + (parseInt(o.id.slice(-2), 10) % 7)) + ' stops away from ' + city, ''][i];
    $('#rtNote').textContent = lab;
    box.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Route from the Northlane fulfilment hub to ' + N.esc(city) + '. Current stage: ' + N.LABEL[o.status] + '.">' +
      '<defs><pattern id="gr" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="rgba(19,17,15,.06)"/></pattern></defs>' +
      '<rect width="' + w + '" height="' + h + '" rx="0" fill="url(#gr)"/>' +
      '<path id="rbase" d="' + d + '" fill="none" stroke="rgba(19,17,15,.22)" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>' +
      '<path id="rprog" d="' + d + '" fill="none" stroke="#9C4A2B" stroke-width="4" stroke-linecap="round"/>' +
      '<g id="rdots"></g>' +
      '<g aria-hidden="true"><rect x="16" y="' + (h - 64) + '" width="28" height="28" rx="0" fill="#13110F"/><path d="M24 ' + (h - 50) + 'h12M30 ' + (h - 56) + 'v12" stroke="#F5F2EC" stroke-width="2" stroke-linecap="round"/><text x="16" y="' + (h - 16) + '">Louisville hub</text>' +
      '<g transform="translate(' + (w - 34) + ' 52)"><circle r="15" fill="' + (o.status === 'delivered' ? '#4E6B45' : '#fff') + '" stroke="#13110F" stroke-width="2"/><path d="M-6 1.5L0-5l6 6.5M-4 0v6h8V0" fill="none" stroke="' + (o.status === 'delivered' ? '#fff' : '#13110F') + '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></g>' +
      '<text x="' + (w - 18) + '" y="86" text-anchor="end">' + N.esc(city) + '</text></g>' +
      '<g id="rpar" aria-hidden="true"><circle class="rt-ring" r="16" fill="none" stroke="#9C4A2B" stroke-width="2"/><circle r="13" fill="#9C4A2B"/><path d="M-6 -3l6 -3 6 3v6l-6 3 -6 -3zM-6 -3l6 3 6 -3M0 0v6" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></g></svg>';
    var path = $('#rprog'), len = path.getTotalLength(), dots = $('#rdots'), par = $('#rpar'), g = '';
    FRAC.forEach(function (fr, j) { if (j === 0 || j === 4) return; var pt = path.getPointAtLength(len * fr); g += '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="5.5" fill="' + (j <= i ? '#9C4A2B' : '#F5F2EC') + '" stroke="' + (j <= i ? '#9C4A2B' : 'rgba(19,17,15,.35)') + '" stroke-width="2"/>'; });
    dots.innerHTML = g;
    if (o.status === 'delivered') par.style.display = 'none';
    function set(p) { path.style.strokeDasharray = len; path.style.strokeDashoffset = len * (1 - p * f); var pt = path.getPointAtLength(len * p * f); par.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ')'); }
    cancelAnimationFrame(raf);
    if (!animate || reduce) { set(1); return; }
    set(0); var t0 = performance.now();
    (function tick(t) { var k = Math.min(1, (t - t0 - 500) / 1700); if (k < 0) k = 0; set(1 - Math.pow(1 - k, 3)); if (k < 1) raf = requestAnimationFrame(tick); })(t0);
  }

  (function () { var de = document.documentElement; if (!de.classList.contains('motion-on')) return;
    function show() { [].forEach.call(document.querySelectorAll('.t-hero [data-now], .t-ph'), function (e) { e.style.visibility = 'visible'; }); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { requestAnimationFrame(show); }); setTimeout(show, 2500); })();
  form.addEventListener('submit', function (e) { e.preventDefault(); submit($('#tNum').value, $('#tEmail').value); });
  $('#demoFill').addEventListener('click', function () { $('#tNum').value = 'NL-10482'; $('#tEmail').value = 'maya.okafor@example.com'; errEl.textContent = ''; $('#tNum').focus(); });
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { var o = cur && N.find(cur, $('#tEmail').value); if (o) drawRoute(o, o.addr.city.split(',')[0], false); }, 150); });
  // admin changes in another tab show up here without a refresh
  addEventListener('storage', function (e) { if (e.key !== 'nl-orders-v1' || !cur) return; N.load(true); var o = N.find(cur, $('#tEmail').value); if (o) render(o); });

  var q = ''; try { q = new URLSearchParams(location.search).get('o') || ''; } catch (e) {}
  var qe = ''; try { qe = new URLSearchParams(location.search).get('e') || ''; } catch (e) {}
  if (q) { $('#tNum').value = q; // a link from the store or the admin is trusted in this demo: the order is looked up by number
    if (!qe) { var hit = N.load().orders.filter(function (o) { return o.id === q.toUpperCase(); })[0]; if (hit) qe = hit.email; }
    if (qe) { $('#tEmail').value = qe; submit(q, qe); } }
})();
