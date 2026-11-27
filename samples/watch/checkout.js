/* Ghatika checkout: bag → delivery → payment → confirmation. Each watch in the bag is given the next number of the year's 300;
   the order lands in the back office. No money moves. */
(function () {
  'use strict';
  var D = window.GH_DATA, G = window.GH, $ = G.$, $$ = G.$$;
  var step = 'bag', payMethod = 'upi', emiN = 12, done = null;
  var draft = G.store.get('checkout-draft', {});
  var PIN = { '11': 'New Delhi', '12': 'Gurugram', '30': 'Jaipur', '31': 'Udaipur', '38': 'Ahmedabad', '40': 'Mumbai', '41': 'Pune', '50': 'Hyderabad', '56': 'Bengaluru', '60': 'Chennai', '68': 'Kochi', '70': 'Kolkata' };

  function items() { return G.bag.items(); }
  // the heading names the watch and the number it will carry on its caseback ring (0128 / 300 is on show; the year has reached 0130)
  var WORD = ['', 'one', 'two', 'three', 'four', 'five', 'six'];
  function no(n) { return String(n).padStart(4, '0'); }
  function heading() {
    var it = done ? done.items : items(), h = $('#coH'), first = done ? done.first : 131 + G.store.get('numbered', 0); if (!h) return;
    var n = it.reduce(function (a, x) { return a + (x.qty || 1); }, 0), names = it.map(function (x) { return D.MODELS[x.model].name; });
    var same = names.every(function (x) { return x === names[0]; });
    h.textContent = !n ? 'Your bag' : n === 1 ? 'Your ' + names[0] + ', No. ' + no(first)
      : 'Your ' + (same ? (WORD[n] || n) + ' ' + names[0] + 's' : n === 2 ? names.join(' and ') : (WORD[n] || n) + ' watches') + ', Nos. ' + no(first) + (n === 2 ? ' and ' : '–') + no(first + n - 1);
  }
  function total() { return G.bag.total(); }
  function summary() {
    heading(); var it = done ? done.items : items(), t = done ? done.total : total();
    var gst = Math.round(t * 18 / 118);
    $('#coSum').innerHTML = '<p class="k">Order summary</p>' + (it.length ? it.map(function (x) { var m = D.MODELS[x.model]; return '<div class="mini"><img src="' + m.img + '" alt="" width="64" height="80"><div><b>' + m.name + '</b><span>' + G.esc(G.cfgLine(x)) + (x.engraving ? '<br>Engraved “' + G.esc(x.engraving) + '”' : '') + '</span></div><span class="price">' + G.inr(x.price) + '</span></div>'; }).join('') : '<p class="muted">Nothing here yet.</p>') +
      '<div class="row"><span>Insured delivery</span><span>Free</span></div><div class="row"><span>Engraving and gift card</span><span>Free</span></div><div class="row"><span>GST (18%, included)</span><span>' + G.inr(gst) + '</span></div>' +
      '<div class="total"><span>Total</span><span class="price">' + G.inr(t) + '</span></div>' + (payMethod === 'emi' && step === 'pay' ? '<p class="row"><span>EMI</span><span>' + G.inr(Math.ceil(t / emiN)) + ' × ' + emiN + '</span></p>' : '') + '<p class="hint" style="margin:0">Prices include GST. Returns within 14 days for unworn, unengraved watches.</p>';
  }
  function go(s) {
    step = s; ['bag', 'delivery', 'pay', 'done'].forEach(function (k) { $('#s-' + k).hidden = k !== s; });
    var order = ['bag', 'delivery', 'pay', 'done'], i = order.indexOf(s);
    $$('#coSteps li').forEach(function (li, j) { li.classList.toggle('done', j < i); if (j === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
    summary(); var h = $('#s-' + s + ' h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    scrollTo({ top: 0, behavior: G.reduce ? 'auto' : 'smooth' });
  }
  $$('[data-go]').forEach(function (b) { b.addEventListener('click', function () { go(b.dataset.go); }); });

  // ---------- bag
  function paintBag() {
    var it = items(), el = $('#coBag');
    if (!it.length) {
      el.innerHTML = '<div class="empty"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="22"/><path d="M32 18v14l9 6"/></svg><h2 class="h3">Your bag is empty</h2><p class="muted" style="max-width:40ch">Every Ghatika is configured before it is made. Start with a dial you love, or try this checkout with our signature Prahar.</p><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><a class="btn" href="watch.html?m=prahar">Configure a watch</a><button class="btn ghost" type="button" id="tryOne">Add the signature Prahar</button></div></div>';
      $('#tryOne').addEventListener('click', function () { G.bag.add(Object.assign({ model: 'prahar' }, D.MODELS.prahar.sig)); G.closeBag(); paintBag(); });
      summary(); return;
    }
    el.innerHTML = it.map(function (x) { var m = D.MODELS[x.model]; return '<div class="line-item"><img src="' + m.img + '" alt="' + m.name + '" width="88" height="110"><div><h3>' + m.name + ' <span class="k" style="font-size:.66rem">' + m.ref + '</span></h3><p class="opts">' + G.esc(G.cfgLine(x)) + (x.engraving ? '<br>Engraved on the back: “' + G.esc(x.engraving) + '”' : '<br>No engraving') + '</p><p style="display:flex;gap:18px;margin:0"><a class="rm" href="watch.html?m=' + x.model + '&dial=' + x.dial + '&metal=' + x.metal + '&strap=' + x.strap + (x.engraving ? '&engr=' + encodeURIComponent(x.engraving) : '') + '">Edit</a><button class="rm" type="button" data-rm="' + x.id + '">Remove</button></p></div><p class="price">' + G.inr(x.price) + '</p></div>'; }).join('') +
      '<p class="hint" style="margin:18px 0">Made to order? You’ll see the build date at confirmation. You choose how to pay on the last step.</p><button class="btn" type="button" id="toDel">Continue to delivery <span class="ar" aria-hidden="true">→</span></button>';
    $$('[data-rm]', el).forEach(function (b) { b.addEventListener('click', function () { G.bag.remove(b.dataset.rm); paintBag(); }); });
    $('#toDel').addEventListener('click', function () { go('delivery'); });
    summary();
  }
  // re-render when the bag changes elsewhere (drawer, undo)
  var _save = G.bag.save; G.bag.save = function (a) { _save(a); if (step === 'bag') paintBag(); else summary(); };

  // ---------- delivery
  var f = $('#fDel');
  $('#dB').innerHTML = D.BOUTIQUES.map(function (b) { return '<option value="' + b.id + '">' + b.city + ' · ' + b.name + '</option>'; }).join('');
  $$('input[name="dm"]').forEach(function (r) { r.addEventListener('change', function () { var pick = r.value === 'boutique' && r.checked; if (r.checked) { $('#addrBox').hidden = pick; $('#pickBox').hidden = !pick; } }); });
  $('#dGift').addEventListener('change', function (e) { $('#giftBox').hidden = !e.target.checked; });
  ['dN', 'dE', 'dT', 'dA', 'dP', 'dC'].forEach(function (id) { var el = $('#' + id); if (draft[id]) el.value = draft[id]; el.addEventListener('input', function () { draft[id] = el.value; G.store.set('checkout-draft', draft); }); });
  $('#dP').addEventListener('input', function () {
    var v = $('#dP').value.replace(/\D/g, '').slice(0, 6); $('#dP').value = v; var m = $('#pinMsg');
    if (v.length < 6) { m.textContent = 'We deliver to 19,000 pincodes with a signature on arrival.'; return; }
    if (/^0/.test(v)) { m.textContent = 'Indian pincodes don’t start with 0. Check the first digit.'; return; }
    var c = PIN[v.slice(0, 2)]; if (c && !$('#dC').value) $('#dC').value = c;
    m.textContent = c ? 'Hand-delivered by our concierge in ' + c + ' in 2–3 days.' : 'Insured courier, 3–5 days, signature on arrival.';
  });
  function errs(list) { var first = null; list.forEach(function (e) { var box = $(e[1]); box.textContent = e[2] || ''; e[0].setAttribute('aria-invalid', e[2] ? 'true' : 'false'); if (e[2] && !first) first = e[0]; }); if (first) first.focus(); return !first; }
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var pick = $('input[name="dm"]:checked').value === 'boutique', digits = $('#dT').value.replace(/\D/g, '');
    var ok = errs([
      [$('#dN'), '#eDN', $('#dN').value.trim().split(/\s+/).length < 2 ? 'Your first and last name, as on your ID: the courier checks it.' : ''],
      [$('#dE'), '#eDE', !/^\S+@\S+\.\S{2,}$/.test($('#dE').value) ? 'That email looks incomplete. It should look like name@domain.com.' : ''],
      [$('#dT'), '#eDT', !(digits.length === 10 || (digits.length === 12 && digits.indexOf('91') === 0)) ? 'A 10-digit mobile number, so the courier can call before arriving.' : ''],
      [$('#dA'), '#eDA', !pick && $('#dA').value.trim().length < 12 ? 'Add the flat, building and street: a watch needs a signature at the door.' : ''],
      [$('#dC'), '#eDC', !pick && (!/^\d{6}$/.test($('#dP').value) || !$('#dC').value.trim()) ? 'A 6-digit pincode and a city, please.' : ''],
      [$('#dG'), '#eDG', $('#dG').value && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test($('#dG').value.toUpperCase()) ? 'A GSTIN has 15 characters, like 27ABCDE1234F1Z5. Leave it blank for a personal invoice.' : '']
    ]);
    if (ok) go('pay');
  });

  // ---------- payment: methods as choices, one button, no card or account fields
  $$('input[name="pm"]').forEach(function (r) { r.addEventListener('change', function () { if (r.checked) { payMethod = r.value; $('#emiBox').hidden = payMethod !== 'emi'; label(); summary(); } }); });
  function label() { var t = total(); $('#payLbl').textContent = payMethod === 'btq' ? 'Reserve for seven days' : 'Pay'; $('#payAmt').textContent = payMethod === 'btq' ? '' : payMethod === 'emi' ? G.inr(Math.ceil(t / emiN)) + ' a month' : G.inr(t); }
  $('#emiT').innerHTML = [3, 6, 9, 12].map(function (n) { return '<label><input type="radio" name="emi" value="' + n + '"' + (n === 12 ? ' checked' : '') + '>' + n + ' months</label>'; }).join('');
  $$('#emiT input').forEach(function (r) { r.addEventListener('change', function () { emiN = +r.value; label(); summary(); }); });
  $('#payBtn').addEventListener('click', function () { if (!items().length) { go('bag'); return; } process(); });
  function process() {
    var box = $('#s-pay .paybox'), keep = box.innerHTML;
    box.setAttribute('aria-busy', 'true');
    box.insertAdjacentHTML('afterbegin', '<div class="processing" id="proc" role="status"><div class="spinner" aria-hidden="true"></div><p class="h3" style="margin:0">Reserving your number…</p><p class="hint" style="margin:0">Please keep this page open.</p></div>');
    $$('#s-pay .paybox > :not(#proc)').forEach(function (el) { el.hidden = true; });
    setTimeout(function () { finish(); box.removeAttribute('aria-busy'); }, G.reduce ? 300 : 1700);
  }
  function finish() {
    var it = items(), t = total(), pick = $('input[name="dm"]:checked').value === 'boutique', digits = $('#dT').value.replace(/\D/g, '');
    var id = G.nextId('GH-O-', 'orders', 24200), name = $('#dN').value.trim();
    var sig = it.every(function (x) { var s = D.MODELS[x.model].sig; return x.dial === s.dial && x.metal === s.metal && x.strap === s.strap; });
    var rec = { id: id, at: new Date().toISOString(), customer: name, email: $('#dE').value.trim(), phone: '+91 ' + digits.slice(-10, -5) + ' •••' + digits.slice(-2), city: pick ? D.BOUTIQUES.filter(function (b) { return b.id === $('#dB').value; })[0].city : $('#dC').value.trim(), items: it.map(function (x) { return { model: x.model, dial: x.dial, metal: x.metal, strap: x.strap, engraving: x.engraving, qty: x.qty }; }), total: t, pay: { upi: 'UPI', card: 'Card', emi: 'EMI · ' + emiN + ' mo', btq: 'Pay at boutique' }[payMethod], delivery: pick ? 'Boutique pick-up' : 'Insured courier', status: payMethod === 'btq' ? 'new' : 'paid', owner: '', note: ($('#dGift').checked ? 'Gift: hide prices. Card: “' + $('#dMsg').value.trim() + '”. ' : '') + ($('#dG').value ? 'GST invoice ' + $('#dG').value.toUpperCase() : ''), source: 'website' };
    var first = 131 + G.store.get('numbered', 0); G.store.set('numbered', G.store.get('numbered', 0) + it.reduce(function (a, x) { return a + (x.qty || 1); }, 0));
    G.add('orders', rec); done = { items: it, total: t, first: first };
    G.bag.save([]); G.store.del('checkout-draft');
    var d0 = new Date(), add = function (n) { var d = new Date(d0); d.setDate(d.getDate() + n); return G.dfmt(d.toISOString(), { day: 'numeric', month: 'short' }); };
    var build = sig ? 0 : 38;
    $('#s-done').innerHTML = '<h2 id="sx-h" class="h2" style="margin-bottom:12px">Thank you, ' + G.esc(name.split(' ')[0]) + '.</h2><p class="lead" style="color:var(--muted-p)">Order <b style="color:var(--ink)">' + id + '</b> is ' + (payMethod === 'btq' ? 'reserved for seven days' : 'confirmed') + '. Your receipt and build updates go to ' + G.esc(rec.email) + '.</p>' +
      '<div class="receipt" style="margin-top:var(--s6)"><p class="k">What happens next</p><ol class="timeline">' +
      '<li class="done"><span>' + (payMethod === 'btq' ? 'Reserved' : 'Paid') + ' · ' + rec.pay + '</span><span>Today</span></li>' +
      '<li class="now"><span>' + (sig ? 'Final check at the atelier' : 'Your watchmaker begins: dial, finishing, assembly') + '</span><span>' + (sig ? add(1) : add(1) + ' to ' + add(build - 6)) + '</span></li>' +
      (sig ? '' : '<li><span>Regulation in five positions, then a 72-hour run</span><span>' + add(build - 5) + '</span></li>') +
      '<li><span>' + (pick ? 'Ready to collect' : 'Dispatched, insured') + '</span><span>' + add(build + 3) + '</span></li>' +
      '<li><span>' + (pick ? 'Collected at the boutique' : 'With you, signed for') + '</span><span>' + add(build + 5) + '</span></li></ol></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:var(--s6)"><a class="btn" href="watch.html?m=' + it[0].model + '">Back to your watch</a><a class="btn ghost" href="warranty.html">Register the warranty</a><a class="btn ghost" href="index.html">Back to Ghatika</a></div>';
    go('done'); G.toast('Order ' + id + ' placed');
  }

  paintBag(); label();
  if (location.hash === '#delivery' && items().length) go('delivery');
})();
