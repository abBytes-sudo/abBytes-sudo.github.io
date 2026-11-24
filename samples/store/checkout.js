/* Northlane checkout (demo): contact & delivery with pincode checks → shipping with dates, gift note → payment (UPI, card, COD; nothing is charged).
   Places a real order in the shared demo database (NL.placeOrder) and hands over to the tracking page for that order. */
(function () {
  'use strict';
  var NL = window.NL, S = window.NLS; if (!NL || !S) return;
  var $ = S.$, $$ = S.$$, esc = NL.esc, money = NL.money;
  var KEY = 'nl-co', step = 1, busy = false;
  var F = (function () { try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
  var D = { email: '', phone: '', name: '', l1: '', l2: '', pin: '', city: '', state: '', addrId: '', mkt: true, ship: 'std', code: '', gift: false, note: '', wrap: false, pay: 'UPI', upiMode: 'id', upi: '', upiOk: '' };
  Object.keys(D).forEach(function (k) { if (F[k] == null) F[k] = D[k]; });
  var sess = NL.session();
  if (sess) { if (!F.email) F.email = sess.email; if (!F.name) F.name = sess.name; if (!F.phone && sess.phone) F.phone = sess.phone;
    var da = (sess.addrs || []).filter(function (a) { return a.def; })[0] || (sess.addrs || [])[0]; if (da && !F.l1 && !F.addrId) useAddr(da); }
  if (!F.pin) { var lp = S.ls.get('pin', ''); if (lp) F.pin = lp; }
  function useAddr(a) { F.addrId = a.id; F.name = a.name.replace(/\s*\(.*\)$/, '') || F.name; F.l1 = a.l1; F.l2 = a.l2; F.pin = a.pin; F.city = a.city; F.state = a.state; }
  function persist() { try { sessionStorage.setItem(KEY, JSON.stringify(F)); } catch (e) {} }
  NL.track('checkout');

  function q() { return NL.quote(S.cart(), { code: F.code, email: F.email, pin: F.pin, ship: F.ship, pay: F.pay, wrap: F.gift && F.wrap }); }
  function pinR() { return F.pin ? NL.pin(F.pin) : null; }
  function codBlock(Q) { var p = pinR(); if (p && p.ok && !p.cod) return 'Cash on delivery isn’t available for ' + p.pin + '. Choose UPI or a card.'; if (!Q.codOk) return 'Cash on delivery is available up to ' + money(NL.db().set.codMax) + '. This order is ' + money(Q.sub - Q.disc) + '.'; return ''; }

  /* ── validation ── */
  var V = {
    email: function (v) { return !v ? 'We need an email for your receipt and tracking link.' : /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v) ? '' : 'That email doesn’t look right. Check for a missing @ or dot.'; },
    phone: function (v) { var d = v.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''); return !d ? 'The courier will call this number if they can’t find you.' : d.length !== 10 ? 'Mobile numbers have 10 digits. This one has ' + d.length + '.' : /^[6-9]/.test(d) ? '' : 'Indian mobile numbers start with 6, 7, 8 or 9.'; },
    name: function (v) { return v.trim().length < 2 ? 'Who should we address the parcel to?' : ''; },
    l1: function (v) { return v.trim().length < 3 ? 'Add the flat, house or building.' : ''; },
    l2: function (v) { return v.trim().length < 3 ? 'Add the street and area, so the rider finds you.' : ''; },
    pin: function (v) { var r = NL.pin(v); return r.ok ? '' : r.msg; },
    city: function (v) { return v.trim() ? '' : 'Add your town or city.'; },
    state: function (v) { return v.trim() ? '' : 'Add your state.'; }
  };
  function fld(k, label, attrs, wide) { var v = F[k] || ''; if (k === 'phone' && /^\d{10}$/.test(v)) v = v.slice(0, 5) + ' ' + v.slice(5); return '<label class="f' + (wide ? ' w' : '') + '" data-f="' + k + '"><span>' + label + '</span><input id="c_' + k + '" value="' + esc(v) + '" ' + (attrs || '') + '><em class="fe" id="e_' + k + '" aria-live="polite"></em></label>'; }
  function setErr(k, m) { var e = $('#e_' + k), w = $('[data-f="' + k + '"]'); if (e) e.textContent = m || ''; if (w) w.classList.toggle('bad', !!m); var i = $('#c_' + k); if (i) i.setAttribute('aria-invalid', !!m); }

  /* ── render ── */
  function render() {
    if (!S.cart().length) { empty(); return; }
    var Q = q();
    $('#coSteps').innerHTML = s1(Q) + s2(Q) + s3(Q);
    side(Q); wire();
  }
  function empty() {
    $('#coSteps').innerHTML = '<div class="co-empty"><h2>Your bag is empty.</h2><p>Add a piece or two and come back. Your details will still be here.</p><a class="nl-btn" href="shop.html">Shop all pieces <span class="arrow" aria-hidden="true">→</span></a>' + (S.wish().length ? '<a class="lnk u" href="shop.html?wish=1">See your ' + NL.plural(S.wish().length, 'saved piece') + '</a>' : '') + '</div>';
    $('#coSide').innerHTML = '';
  }
  function head(n, t, sum) { var cls = step === n ? 'cur' : step > n ? 'done' : 'next';
    return '<header class="cs-h"><span class="cs-n">0' + n + '</span><h2 id="csH' + n + '" tabindex="-1">' + t + '</h2>' + (step > n ? '<button type="button" class="cs-e" data-edit="' + n + '" aria-label="Edit ' + t + '">Edit</button>' : '') + '</header>' + (step > n && sum ? '<div class="cs-sum">' + sum + '</div>' : ''); }
  function sec(n, t, sum, body) { return '<section class="cs ' + (step === n ? 'cur' : step > n ? 'done' : 'next') + '" aria-labelledby="csH' + n + '">' + head(n, t, sum) + (step === n ? '<div class="cs-b">' + body + '</div>' : '') + '</section>'; }
  function s1() {
    var p = pinR(), addrs = sess && sess.addrs ? sess.addrs : [];
    var sum = esc(F.email) + ' · ' + esc(F.phone) + '<br>' + esc(F.name) + ', ' + esc(F.l1) + ', ' + esc(F.l2) + ', ' + esc(F.city) + ' ' + esc(F.pin);
    var b = (sess ? '<p class="cs-who">Signed in as <b>' + esc(sess.name || sess.email) + '</b>. <a class="u" href="account.html">Not you?</a></p>' : '<p class="cs-who">Have an account? <a class="u" href="account.html?next=checkout.html">Sign in</a> for saved addresses, or check out as a guest.</p>') +
      '<div class="row">' + fld('email', 'Email', 'type="email" autocomplete="email" inputmode="email" spellcheck="false"') + fld('phone', 'Mobile', 'type="tel" autocomplete="tel-national" inputmode="numeric" maxlength="14" placeholder="10-digit mobile"') + '</div>' +
      (addrs.length ? '<fieldset class="adr"><legend>Deliver to</legend>' + addrs.map(function (a) { return '<label class="adr-o"><input type="radio" name="adr" value="' + a.id + '"' + (F.addrId === a.id ? ' checked' : '') + '><span><b>' + esc(a.name) + (a.def ? ' <i>Default</i>' : '') + '</b>' + esc(a.l1) + ', ' + esc(a.l2) + ', ' + esc(a.city) + ' ' + esc(a.pin) + '</span></label>'; }).join('') +
        '<label class="adr-o"><input type="radio" name="adr" value=""' + (!F.addrId ? ' checked' : '') + '><span><b>A new address</b>Deliver somewhere else</span></label></fieldset>' : '<h3 class="lg">Delivery address</h3>') +
      '<div class="adr-f"' + (F.addrId ? ' hidden' : '') + '>' + fld('name', 'Full name', 'autocomplete="name"', true) + fld('l1', 'Flat, house no., building', 'autocomplete="address-line1"', true) + fld('l2', 'Street, area, landmark', 'autocomplete="address-line2"', true) +
      '<div class="row3">' + fld('pin', 'Pincode', 'inputmode="numeric" maxlength="6" autocomplete="postal-code"') + fld('city', 'City', 'autocomplete="address-level2"') + fld('state', 'State', 'autocomplete="address-level1"') + '</div></div>' +
      '<p class="pin-n" id="pinN" aria-live="polite">' + pinNote(p) + '</p>' +
      '<label class="tgl"><input type="checkbox" id="c_mkt"' + (F.mkt ? ' checked' : '') + '><span>Send me Northlane letters: new pieces and repair days, once a month.</span></label>' +
      '<button class="nl-btn" type="button" data-next="1">Continue to shipping <span class="arrow" aria-hidden="true">→</span></button>';
    return sec(1, 'Contact &amp; delivery', sum, b);
  }
  function pinNote(p) { if (!p || !p.ok) return ''; return '<b>' + esc((p.city ? p.city + ', ' : '') + p.state) + '</b> · ' + (p.same ? 'Same-day delivery available' : p.zone === 'remote' ? 'Delivery takes a little longer here' : p.zone === 'metro' ? 'Express in 1–2 days' : 'Express in 2–3 days') + ' · ' + (p.cod ? 'COD available' : 'Prepaid only'); }
  function s2(Q) {
    var so = Q.ship, sum = so ? esc(so.label) + ' · ' + NL.winText(so) + ' · ' + (Q.shipFee ? money(Q.shipFee) : 'Free') + (F.gift ? '<br>Gift' + (F.wrap ? ', wrapped' : '') + (F.note ? ': “' + esc(F.note.slice(0, 60)) + (F.note.length > 60 ? '…' : '') + '”' : '') : '') : '';
    var b = '<fieldset class="ship"><legend class="vh">Delivery speed</legend>' + Q.shipOpts.map(function (o) { var fee = Q.code && Q.code.ok && Q.code.ship ? 0 : o.fee;
      return '<label class="ship-o"><input type="radio" name="sh" value="' + o.id + '"' + (o.id === Q.ship.id ? ' checked' : '') + '><span class="so-t"><b>' + esc(o.label) + '</b><span>' + NL.winText(o) + ' · ' + esc(o.carrier) + '</span><em>' + esc(o.note) + '</em></span><span class="so-p">' + (fee ? money(fee) : 'Free') + '</span></label>'; }).join('') + '</fieldset>' +
      '<div class="gift"><label class="tgl"><input type="checkbox" id="c_gift"' + (F.gift ? ' checked' : '') + '><span>This is a gift</span></label><div class="gift-b"' + (F.gift ? '' : ' hidden') + '>' +
      '<label class="f w"><span>Gift note</span><textarea id="c_note" rows="3" maxlength="200" placeholder="We’ll handwrite it on a card. Prices are never included.">' + esc(F.note) + '</textarea><small id="noteC">' + F.note.length + ' / 200</small></label>' +
      '<label class="tgl"><input type="checkbox" id="c_wrap"' + (F.wrap ? ' checked' : '') + '><span>Wrap it in our cotton furoshiki cloth <b>+' + money(NL.db().set.giftWrap) + '</b></span></label></div></div>' +
      '<button class="nl-btn" type="button" data-next="2">Continue to payment <span class="arrow" aria-hidden="true">→</span></button>';
    return sec(2, 'Shipping', sum, b);
  }
  function s3(Q) {
    var cb = codBlock(Q); if (cb && F.pay === 'COD') F.pay = 'UPI';
    var M = [['UPI', 'UPI', 'Scan a code with any UPI app. Instant.'], ['Card', 'Card', 'Visa, Mastercard, RuPay and Amex'], ['COD', 'Cash on delivery', cb || 'Pay in cash or UPI at the door · ' + money(NL.db().set.codFee) + ' fee']];
    var b = '<div class="pay" role="radiogroup" aria-label="Payment method">' + M.map(function (m) { var dis = m[0] === 'COD' && cb, on = F.pay === m[0];
      return '<div class="pm' + (on ? ' on' : '') + (dis ? ' dis' : '') + '"><label class="pm-h"><input type="radio" name="pm" value="' + m[0] + '"' + (on ? ' checked' : '') + (dis ? ' disabled' : '') + '><span><b>' + m[1] + '</b><em>' + esc(m[2]) + '</em></span>' + (m[0] === 'Card' ? '<span class="nets"><i>VISA</i><i>MC</i><i>RuPay</i></span>' : m[0] === 'UPI' ? '<span class="nets"><i>UPI</i></span>' : '') + '</label>' + (on ? '<div class="pm-b">' + payBody(m[0], Q) + '</div>' : '') + '</div>'; }).join('') + '</div>' +
      '<p class="err" id="payE" role="alert"></p><button class="nl-btn pay-go" type="button" id="payGo">' + payLabel(Q) + '</button><p class="co-fine">Portfolio project: no payment is taken.</p>';
    return sec(3, 'Payment', '', b);
  }
  function payLabel(Q) { return F.pay === 'COD' ? 'Place order · pay on delivery' : 'Pay ' + money(Q.total); }
  function payBody(m, Q) {
    if (m === 'UPI') return '<div class="qr"><div class="qr-c">' + qr(Q.total) + '</div><div><p><b>Scan with any UPI app</b> to pay ' + money(Q.total) + ' to Northlane Studio.</p><p class="hint">The code stays valid for <b id="qrT">5:00</b>.</p></div></div>';
    if (m === 'Card') return '<p class="cod">Pay <b>' + money(Q.total) + '</b> by card.</p>';
    return '<p class="cod">Pay <b>' + money(Q.total) + '</b> in cash, or by UPI on the courier’s phone, when your parcel arrives. Includes a ' + money(NL.db().set.codFee) + ' handling fee. Please keep the exact amount ready.</p>';
  }
  function qr(seed) { // a drawn, decorative QR-style code (demo only)
    var n = 25, r = 2166136261 ^ Math.round(seed), cells = '';
    function rnd() { r ^= r << 13; r ^= r >>> 17; r ^= r << 5; return ((r >>> 0) % 1000) / 1000; }
    function finder(x, y) { return '<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="none" stroke="#13110F" stroke-width="1"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3"/>'; }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) { if ((x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)) continue; if (rnd() < .47) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>'; }
    return '<svg viewBox="-2 -2 ' + (n + 4) + ' ' + (n + 4) + '" role="img" aria-label="UPI QR code" shape-rendering="crispEdges"><rect x="-2" y="-2" width="' + (n + 4) + '" height="' + (n + 4) + '" fill="#fff"/><g fill="#13110F">' + cells + finder(.5, .5) + finder(n - 7.5, .5) + finder(.5, n - 7.5) + '</g></svg>';
  }

  /* ── summary ── */
  var sumOpen = false;
  function side(Q) {
    var free = NL.db().set.freeShip, base = Q.sub - Q.disc;
    var rows = '<p><span>Subtotal · ' + NL.plural(Q.count, 'item') + '</span><span>' + money(Q.sub) + '</span></p>' + (Q.disc ? '<p class="dsc"><span>' + esc(Q.code.code) + '</span><span>−' + money(Q.disc) + '</span></p>' : '') +
      '<p><span>' + (step > 1 || F.ship !== 'std' ? esc(Q.ship.label) + ' delivery' : 'Delivery') + '</span><span>' + (Q.code && Q.code.ok && Q.code.ship ? 'Free with ' + esc(Q.code.code) : Q.shipFee ? money(Q.shipFee) : 'Free') + '</span></p>' +
      (Q.giftFee ? '<p><span>Gift wrap</span><span>' + money(Q.giftFee) + '</span></p>' : '') + (Q.codFee ? '<p><span>Cash on delivery fee</span><span>' + money(Q.codFee) + '</span></p>' : '');
    $('#coSide').innerHTML = '<button type="button" class="sum-t" id="sumT" aria-expanded="' + sumOpen + '" aria-controls="sumB"><span>' + (sumOpen ? 'Hide' : 'Show') + ' order summary · ' + NL.plural(Q.count, 'item') + '</span><b>' + money(Q.total) + '</b></button>' +
      '<div class="sum-b' + (sumOpen ? ' open' : '') + '" id="sumB"><h2>Your bag</h2><ul class="co-l">' + Q.lines.map(function (l) {
        return '<li><div class="co-im">' + S.img(l.p) + '<span class="co-q">' + l.q + '</span></div><div><p class="dr-n">' + esc(l.p.name) + '</p><p class="dr-m">' + esc(l.col) + (l.s !== 'One size' ? ' · ' + esc(l.s) : '') + '</p>' + (l.short ? '<p class="dr-warn">' + (l.stock.avail ? 'Only ' + l.stock.avail + ' left' : 'Just sold out') + '</p>' : '') + '</div><p class="dr-p">' + money(l.line) + '</p></li>'; }).join('') + '</ul>' +
      '<form class="cpn" id="cpn" novalidate>' + (Q.code && Q.code.ok ? '<p class="cpn-on"><span><b>' + esc(Q.code.code) + '</b> ' + (Q.code.ship ? 'Free delivery applied' : '−' + money(Q.disc) + ' applied') + '</span><button type="button" id="cpnX">Remove</button></p>' :
        '<label class="vh" for="cpnI">Discount code</label><div class="cpn-in"><input id="cpnI" placeholder="Discount code" value="' + esc(F.code) + '" autocomplete="off" autocapitalize="characters" spellcheck="false"><button type="submit">Apply</button></div>' + (F.code && Q.code && !Q.code.ok ? '<p class="cpn-m bad" role="alert">' + esc(Q.code.msg) + '</p>' : '<p class="cpn-m">Try NORTHLANE500, FREESHIP or WELCOME10.</p>')) + '</form>' +
      '<div class="co-t">' + rows + '<p class="big"><span>Total</span><span>' + money(Q.total) + '</span></p><p class="gst">Prices include GST.' + (Q.disc ? ' You save ' + money(Q.disc + (Q.code.ship ? 0 : 0)) + '.' : '') + '</p></div>' +
      (base < free && !(Q.code && Q.code.ship) ? '<p class="co-free"><span>Add ' + money(free - base) + ' more for free standard delivery</span><i><b style="width:' + Math.min(100, base / free * 100) + '%"></b></i></p>' : '') +
      '<ul class="co-tr"><li>Packed by hand in Jaipur</li><li>30-day returns, free pickup</li><li>Free repairs for two years</li></ul></div>';
    $('#sumT').onclick = function () { sumOpen = !sumOpen; side(q()); $('#sumT').focus(); };
    var cf = $('#cpn'); cf.onsubmit = function (e) { e.preventDefault(); var v = $('#cpnI').value.trim().toUpperCase(); if (!v) { F.code = ''; } else F.code = v; persist(); render(); var m = $('.cpn-on, .cpn-m'); if (m) m.classList.add('pop'); };
    var x = $('#cpnX'); if (x) x.onclick = function () { F.code = ''; persist(); render(); setTimeout(function () { var i = $('#cpnI'); if (i) i.focus(); }); };
  }

  /* ── wiring ── */
  function read1() { ['email', 'phone', 'name', 'l1', 'l2', 'pin', 'city', 'state'].forEach(function (k) { var i = $('#c_' + k); if (i) F[k] = i.value.trim(); }); var m = $('#c_mkt'); if (m) F.mkt = m.checked; persist(); }
  function wire() {
    $$('[data-edit]').forEach(function (b) { b.onclick = function () { step = +b.getAttribute('data-edit'); render(); focusStep(); }; });
    var n1 = $('[data-next="1"]'); if (n1) {
      $$('input[name=adr]').forEach(function (r) { r.onchange = function () { var a = (sess.addrs || []).filter(function (x) { return x.id === r.value; })[0]; if (a) useAddr(a); else { F.addrId = ''; F.l1 = F.l2 = F.pin = F.city = F.state = ''; } persist(); render(); }; });
      ['email', 'phone', 'name', 'l1', 'l2', 'city', 'state'].forEach(function (k) { var i = $('#c_' + k); i.addEventListener('blur', function () { if (i.value) setErr(k, V[k](i.value)); }); i.addEventListener('input', function () { if ($('[data-f="' + k + '"]').classList.contains('bad')) setErr(k, V[k](i.value)); F[k] = i.value.trim(); persist(); }); });
      var pi = $('#c_pin'); pi.addEventListener('input', function () { var v = pi.value.replace(/\D/g, '').slice(0, 6); if (v !== pi.value) pi.value = v; F.pin = v; persist();
        if (v.length === 6) { var r = NL.pin(v); setErr('pin', r.ok ? '' : r.msg); if (r.ok) { if (r.city) { $('#c_city').value = F.city = r.city; setErr('city', ''); } $('#c_state').value = F.state = r.state; setErr('state', ''); S.ls.set('pin', v); } $('#pinN').innerHTML = pinNote(r); side(q()); }
        else { setErr('pin', ''); $('#pinN').innerHTML = ''; } });
      pi.addEventListener('blur', function () { if (pi.value) setErr('pin', V.pin(pi.value)); });
      n1.onclick = function () { read1(); var bad = []; ['email', 'phone'].concat(F.addrId ? [] : ['name', 'l1', 'l2', 'pin', 'city', 'state']).forEach(function (k) { var m = V[k](F[k] || ''); setErr(k, m); if (m) bad.push(k); });
        if (F.addrId && !NL.pin(F.pin).ok) { bad.push('adr'); }
        if (bad.length) { var f = $('#c_' + bad[0]); if (f) f.focus(); return; }
        F.phone = F.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''); step = 2; persist(); render(); focusStep(); };
    }
    var n2 = $('[data-next="2"]'); if (n2) {
      $$('input[name=sh]').forEach(function (r) { r.onchange = function () { F.ship = r.value; persist(); side(q()); }; });
      $('#c_gift').onchange = function () { F.gift = this.checked; $('.gift-b').hidden = !F.gift; persist(); side(q()); if (F.gift) $('#c_note').focus(); };
      $('#c_note').oninput = function () { F.note = this.value; $('#noteC').textContent = this.value.length + ' / 200'; persist(); };
      $('#c_wrap').onchange = function () { F.wrap = this.checked; persist(); side(q()); };
      n2.onclick = function () { step = 3; persist(); render(); focusStep(); };
    }
    var go = $('#payGo'); if (!go) return;
    $$('input[name=pm]').forEach(function (r) { r.onchange = function () { F.pay = r.value; persist(); render(); var x = $('input[name=pm]:checked'); if (x) x.focus(); }; });
    if (F.pay === 'UPI') qrTimer();
    go.onclick = pay;
  }
  function focusStep() { var h = $('#csH' + step); if (h) { h.focus({ preventScroll: true }); h.closest('.cs').scrollIntoView({ behavior: S.reduce ? 'auto' : 'smooth', block: 'start' }); } }
  var qrI; function qrTimer() { clearInterval(qrI); var t = 300; qrI = setInterval(function () { var el = $('#qrT'); if (!el) { clearInterval(qrI); return; } t--; el.textContent = Math.floor(t / 60) + ':' + ('0' + t % 60).slice(-2); if (t <= 0) { clearInterval(qrI); el.textContent = 'expired'; } }, 1000); }

  function pay() {
    if (busy) return; var Q = q(), e = $('#payE'); e.textContent = '';
    if (F.pay === 'UPI') return place('UPI', 'UPI');
    if (F.pay === 'Card') return place('Card', 'Card');
    if (F.pay === 'COD') { var cb = codBlock(Q); if (cb) { e.textContent = cb; return; } place('COD', 'Cash on delivery'); }
  }
  var ov = $('#coOv'), ovOpener;
  function overlay(h) { $('#ovBody').innerHTML = h; ovOpener = document.activeElement; ov.hidden = false; requestAnimationFrame(function () { ov.classList.add('open'); var f = ov.querySelector('input,button,[tabindex]'); if (f) f.focus(); }); }
  function closeOv() { ov.classList.remove('open'); ov.hidden = true; if (ovOpener && document.contains(ovOpener)) ovOpener.focus(); }
  ov.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !busy) closeOv(); });
  function place(m, d) {
    busy = true; var Q = q(), steps = m === 'UPI' ? ['Confirming your UPI payment', 'Reserving your pieces', 'Placing your order'] : m === 'Card' ? ['Confirming your card payment', 'Reserving your pieces', 'Placing your order'] : ['Confirming cash on delivery', 'Reserving your pieces', 'Placing your order'];
    overlay('<p class="eyebrow">Almost there</p><h2 id="ovH" tabindex="-1">One moment…</h2><ol class="prog">' + steps.map(function (s, i) { return '<li data-i="' + i + '">' + s + '</li>'; }).join('') + '</ol>');
    var i = 0; (function tick() { $$('.prog li').forEach(function (li, k) { li.className = k < i ? 'done' : k === i ? 'cur' : ''; }); if (i < steps.length) { i++; setTimeout(tick, S.reduce ? 150 : 700); } else finish(); })();
    function finish() {
      var r = NL.placeOrder({ cart: S.cart(), email: F.email, phone: F.phone, addr: { name: F.name, l1: F.l1, l2: F.l2, city: F.city, state: F.state, pin: F.pin }, ship: F.ship, code: Q.code && Q.code.ok ? Q.code.code : '', pay: { m: m, d: d }, gift: F.gift ? { note: F.note, wrap: F.wrap } : null, mkt: F.mkt, channel: 'Online store' });
      busy = false;
      if (!r.ok) { closeOv(); var e = $('#payE'); e.innerHTML = esc(r.msg) + (r.lines ? ' <button type="button" class="inl" id="fixBag">Update my bag</button>' : ''); var fb = $('#fixBag'); if (fb) fb.onclick = function () { var c = S.cart().map(function (x) { var a = NL.stock(NL.skuKey(x.id, x.c, x.s)).avail; return Object.assign({}, x, { q: Math.min(x.q, a) }); }).filter(function (x) { return x.q > 0; }); S.setCart(c); render(); }; side(q()); return; }
      if (!NL.session() || NL.session().email !== F.email.toLowerCase()) NL.signIn(F.email, F.name);
      try { sessionStorage.removeItem(KEY); } catch (e) {}
      S.setCart([]);
      location.href = '../orders/track.html?o=' + encodeURIComponent(r.order.id) + '&e=' + encodeURIComponent(r.order.email) + '&new=1';
    }
  }

  render();
  if (S.fx) window.gsap.from($$('.co-demo, .co-main h1, .cs, .co-side'), { autoAlpha: 0, y: 30, duration: 1.1, ease: 'power4.out', stagger: .07, delay: .1, clearProps: 'all' });
  S.onChange.push(function (sc) { if (busy) return; if (sc === 'session') { sess = NL.session(); } if (step === 3 && document.activeElement && document.activeElement.closest('.pm-b')) { side(q()); return; } var a = document.activeElement, aid = a && a.id; render(); if (aid && $('#' + aid)) $('#' + aid).focus(); });
})();
