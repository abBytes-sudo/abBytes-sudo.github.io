/* Revv dealer app · the appraisal desk. Exchange requests from the public site ("revv:exchange", written by the vehicle page)
   arrive as a queue for the dealer who owns the wanted vehicle. The appraiser works a phone-first checklist with photos,
   sets an offer with the expected refurbishment and resale, sees the margin before saying yes, and an accepted appraisal
   becomes a new stock row in "Bought" on the refurbishment board. Appraisal work is kept in "revv:appraise". */
(function () {
  'use strict';
  var R = window.Revv, BO = window.BO, L = window.LEDGER, esc = BO.esc, ic = BO.ic, $ = BO.$, $$ = BO.$$, DAY = 864e5;
  var XKEY = 'revv:exchange', AKEY = 'revv:appraise';
  var CHECKS = [
    ['paint', 'Body and paint', ['Original', 'One panel repainted', 'Several panels', 'Accident repair']],
    ['tyres', 'Tyres', ['Above 60%', '30 to 60%', 'Replace soon']],
    ['engine', 'Engine and gearbox', ['Clean start, no noise', 'Minor noise or smoke', 'Needs work']],
    ['service', 'Service record', ['Full record', 'Partial', 'None']],
    ['docs', 'RC, insurance and loan NOC', ['All present', 'Loan to close', 'Missing papers']],
    ['flood', 'Flood or fire signs', ['None found', 'Possible, check further']],
    ['odo', 'Odometer matches the service book', ['Matches', 'Does not match']]
  ];
  var DED = { paint: [0, 0.03, 0.06, 0.12], tyres: [0, 0.015, 0.03], engine: [0, 0.03, 0.09], service: [0, 0.015, 0.04], docs: [0, 0.01, 0.05], flood: [0, 0.2], odo: [0, 0.18] };
  var PH = ['Front', 'Rear', 'Odometer', 'Engine bay'];
  var FIRST = ['Rohan', 'Sneha', 'Vivek', 'Ayesha', 'Nikhil', 'Fatima', 'Ritu', 'Gautam'], LAST = ['Mehta', 'Kulkarni', 'Nair', 'Shaikh', 'Bose', 'Pillai', 'Joshi', 'Rao'];
  var MODELS = { bike: [['Moreau', '350 Classic', 2019, 165000], ['Ishiro', 'Duo 200', 2020, 118000], ['Varno', 'Street 400', 2021, 245000], ['Aurex', 'Scoot 125', 2022, 72000]], car: [['Aurex', 'Hatch 1.2', 2018, 410000], ['Varno', 'City 1.5', 2019, 690000], ['Ishiro', 'Compact SUV', 2020, 820000], ['Moreau', 'Sedan 1.5', 2017, 520000]] };

  function work() { return R.get(AKEY, {}); }
  function setWork(id, fn) { var a = work(); a[id] = a[id] || {}; fn(a[id]); R.set(AKEY, a); }
  function real() { var x = R.get(XKEY, []); return Array.isArray(x) ? x : []; }
  // two or three requests per dealer while the public site has not sent any, so every dealer's desk is alive
  function seeded(dl) {
    var mine = R.listings({ all: true }).filter(function (l) { return l.dealer === dl && l.status !== 'sold'; }); if (!mine.length) return [];
    var r = R.rng('xch-' + dl), n = 2 + (r() < 0.5 ? 1 : 0), out = [];
    for (var i = 0; i < n; i++) {
      var want = mine[Math.floor(r() * mine.length)], type = r() < 0.55 ? want.type : (want.type === 'bike' ? 'car' : 'bike'), m = MODELS[type][Math.floor(r() * 4)], year = m[2] + Math.floor(r() * 3), base = m[3] * (1 + (year - m[2]) * 0.08);
      out.push({ id: 'X-' + dl.slice(0, 3).toUpperCase() + (101 + i), seed: true, at: Date.now() - (2 + Math.floor(r() * 70)) * 3600e3, wantId: want.id, make: m[0], model: m[1], year: year, km: type === 'bike' ? 8000 + Math.floor(r() * 24000) : 24000 + Math.floor(r() * 60000), condition: ['Excellent', 'Good', 'Fair'][Math.floor(r() * 3)], low: Math.round(base * 0.88 / 5000) * 5000, high: Math.round(base * 1.0 / 5000) * 5000, name: FIRST[Math.floor(r() * 8)] + ' ' + LAST[Math.floor(r() * 8)], contact: 'WhatsApp', status: 'new', type: type });
    }
    return out;
  }
  function queue(dl) {
    var w = work(), owned = real().filter(function (x) { var l = R.byId(x.wantId); return l ? l.dealer === dl : false; });
    return owned.concat(seeded(dl)).map(function (x) { var a = w[x.id] || {}; return Object.assign({ type: /scoot|350|duo|street|bike/i.test(x.model || '') ? 'bike' : 'car' }, x, { status: a.status || x.status || 'new', a: a }); }).sort(function (a, b) { return b.at - a.at; });
  }
  var LBL = { new: ['Waiting', 'warn'], inspecting: ['Inspecting', 'info'], offered: ['Offer sent', 'sig'], accepted: ['Accepted', 'ok'], declined: ['Declined', 'line'] };
  function mid(x) { return Math.round(((x.low || 0) + (x.high || x.low || 0)) / 2 / 1000) * 1000; }
  function calc(x, a) {
    var ded = 0; CHECKS.forEach(function (c) { var v = (a.checks || {})[c[0]]; if (v != null) ded += DED[c[0]][v] || 0; });
    var resale = a.resale || Math.round(mid(x) * 1.14 / 5000) * 5000, refurb = a.refurb != null ? a.refurb : Math.round(resale * (0.025 + ded * 0.6) / 500) * 500, offer = a.offer || Math.round(mid(x) * (1 - ded) / 5000) * 5000;
    var hold = Math.round(offer * 0.12 / 365 + (x.type === 'bike' ? 25 : 70)) * 30;
    return { offer: offer, refurb: refurb, resale: resale, hold: hold, margin: resale - offer - refurb - hold, ded: ded };
  }
  function setStatus(x, st) {
    setWork(x.id, function (a) { a.status = st; a.at = Date.now(); });
    if (!x.seed) { var arr = real(); arr.forEach(function (y) { if (y.id === x.id) y.status = st; }); R.set(XKEY, arr); }
  }

  function vAppraise(el) {
    var me = L.me(), q = queue(me), open = q.filter(function (x) { return x.status !== 'accepted' && x.status !== 'declined'; });
    el.innerHTML = '<div class="ph"><div><h1>Appraisals</h1><p>' + open.length + ' exchange request' + (open.length === 1 ? '' : 's') + ' to value · from the “Exchange against this one” button on your listings</p></div><div class="acts"><a class="btn" href="#/refurb">' + ic('board') + 'Refurbishment board</a></div></div>' +
      (q.length ? '<ul class="ap-l">' + q.map(function (x) { var w = R.byId(x.wantId), c = calc(x, x.a), lb = LBL[x.status] || LBL.new;
        return '<li class="ap-c ' + x.status + '"><button type="button" class="ap-b" data-ap="' + esc(x.id) + '"><span class="ap-ic">' + ic(x.type === 'bike' ? 'bike' : 'stock') + '</span><span class="ap-t"><b>' + esc(x.year + ' ' + x.make + ' ' + x.model) + '</b><small>' + esc(x.name) + ' · ' + R.km(x.km) + ' · ' + esc(x.condition || '') + ' · ' + BO.ago(x.at) + ' ago</small><small>Wants ' + (w ? esc(R.title(w)) + ' · ' + R.inr(w.price) : 'one of your listings') + '</small></span><span class="ap-r"><span class="chip ' + lb[1] + '">' + lb[0] + '</span><span class="num">' + (x.status === 'new' ? R.inr(x.low) + '–' + R.inr(x.high) : R.inr(c.offer)) + '</span><small class="' + (c.margin < 0 ? 'bad' : 'ok') + '">margin ' + R.inr(c.margin) + '</small></span></button></li>'; }).join('') + '</ul>'
        : '<div class="empty">' + ic('check') + '<b>No exchange requests yet</b><p>When a buyer taps “Exchange my car or bike” on one of your listings, the request lands here.</p></div>');
    el.onclick = function (e) { var b = e.target.closest('[data-ap]'); if (b) openAp(b.dataset.ap); };
  }
  function openAp(id) {
    var x = queue(L.me()).filter(function (y) { return y.id === id; })[0]; if (!x) return; var w = R.byId(x.wantId);
    if (x.status === 'new') { setStatus(x, 'inspecting'); x.status = 'inspecting'; }
    BO.slide({ title: x.year + ' ' + x.make + ' ' + x.model, head: '<span class="av">' + esc(BO.initials(x.name)) + '</span>', actions: '<span class="chip ' + (LBL[x.status] || LBL.new)[1] + '">' + (LBL[x.status] || LBL.new)[0] + '</span>', body: draw, onClose: function () { BO.refresh(); } });
    function draw(b) {
      var a = work()[id] || {}, c = calc(x, a), done = x.status === 'accepted' || x.status === 'declined';
      b.innerHTML = '<p class="desk-sum">' + esc(x.name) + ' · ' + R.km(x.km) + ' · says “' + esc(x.condition || 'good') + '” · their estimate ' + R.inr(x.low) + '–' + R.inr(x.high) + (w ? '<br>Wants <b>' + esc(R.title(w)) + '</b> at ' + R.inrFull(w.price) : '') + '</p>' +
        '<fieldset class="ap-ck"><legend class="lbl">Checklist</legend>' + CHECKS.map(function (ck) { var v = (a.checks || {})[ck[0]]; return '<div class="ck"><span class="ck-l">' + esc(ck[1]) + '</span><div class="ck-o" role="radiogroup" aria-label="' + esc(ck[1]) + '">' + ck[2].map(function (o, i) { return '<label><input type="radio" name="ck-' + ck[0] + '" value="' + i + '" data-ck="' + ck[0] + '"' + (v === i ? ' checked' : '') + (done ? ' disabled' : '') + '><span>' + esc(o) + '</span></label>'; }).join('') + '</div></div>'; }).join('') + '</fieldset>' +
        '<p class="lbl">Photos</p><div class="ap-ph">' + PH.map(function (p) { var nm = (a.photos || {})[p]; return '<label class="ap-p' + (nm ? ' on' : '') + '"><input type="file" accept="image/*" capture="environment" class="sr" data-ph="' + p + '"' + (done ? ' disabled' : '') + '><span class="ap-pi">' + (nm ? ic('check') : ic('plus')) + '</span><b>' + p + '</b><small>' + (nm ? esc(nm) : 'Tap to add') + '</small></label>'; }).join('') + '</div>' +
        '<div class="ap-of"><p class="lbl">Offer and margin</p><div class="ap-g">' + [['offer', 'Our offer'], ['refurb', 'Expected refurbishment'], ['resale', 'Expected resale']].map(function (f) { return '<label><span>' + f[1] + '</span><input class="inp num" inputmode="numeric" data-num="' + f[0] + '" value="' + c[f[0]] + '"' + (done ? ' disabled' : '') + '></label>'; }).join('') + '</div>' +
        '<div class="ap-mg ' + (c.margin < 0 ? 'bad' : c.margin < c.resale * 0.05 ? 'warn' : 'ok') + '"><span>Margin if it sells in 30 days</span><b>' + (c.margin < 0 ? '−' : '') + R.inrFull(Math.abs(c.margin)) + '</b><small>' + R.inrFull(c.resale) + ' resale − ' + R.inrFull(c.offer) + ' offer − ' + R.inrFull(c.refurb) + ' refurbishment − ' + R.inrFull(c.hold) + ' holding</small></div>' +
        (w ? '<p class="ap-net">The buyer pays <b>' + R.inrFull(Math.max(0, w.price - c.offer)) + '</b> for the ' + esc(w.make + ' ' + w.model) + ' after this exchange.</p>' : '') + '</div>' +
        (done ? '<p class="hint">' + (x.status === 'accepted' ? 'Accepted ' + BO.ago(a.at || Date.now()) + ' ago. It is in stock under “Bought”. <a href="#/refurb">Open the board</a>.' : 'Declined.') + '</p>'
          : '<div class="desk-a"><button type="button" class="btn" data-apx="decline">Decline</button><button type="button" class="btn" data-apx="offer">' + ic('chat') + 'Send offer</button><button type="button" class="btn pri" data-apx="accept">' + ic('check') + 'Accept and add to stock</button></div>');
      b.onchange = function (e) { var t = e.target;
        if (t.dataset.ck) { setWork(id, function (o) { (o.checks = o.checks || {})[t.dataset.ck] = +t.value; delete o.offer; delete o.refurb; }); draw(b); return; }
        if (t.dataset.ph && t.files && t.files[0]) { var nm = t.files[0].name; setWork(id, function (o) { (o.photos = o.photos || {})[t.dataset.ph] = nm; }); draw(b); }
      };
      b.oninput = function (e) { var t = e.target; if (!t.dataset.num) return; var v = +String(t.value).replace(/[^0-9]/g, ''); setWork(id, function (o) { o[t.dataset.num] = v; }); var c2 = calc(x, work()[id]), mg = $('.ap-mg', b); mg.className = 'ap-mg ' + (c2.margin < 0 ? 'bad' : c2.margin < c2.resale * 0.05 ? 'warn' : 'ok'); mg.querySelector('b').textContent = (c2.margin < 0 ? '−' : '') + R.inrFull(Math.abs(c2.margin)); mg.querySelector('small').textContent = R.inrFull(c2.resale) + ' resale − ' + R.inrFull(c2.offer) + ' offer − ' + R.inrFull(c2.refurb) + ' refurbishment − ' + R.inrFull(c2.hold) + ' holding'; var net = $('.ap-net b', b); if (net && w) net.textContent = R.inrFull(Math.max(0, w.price - c2.offer)); };
      b.onclick = function (e) { var k = e.target.closest('[data-apx]'); if (!k) return; var c2 = calc(x, work()[id] || {});
        if (k.dataset.apx === 'offer') { setStatus(x, 'offered'); x.status = 'offered'; var msg = 'Hi ' + x.name.split(' ')[0] + ', we can offer ' + R.inrFull(c2.offer) + ' for your ' + x.year + ' ' + x.make + ' ' + x.model + (w ? '. Against the ' + w.make + ' ' + w.model + ' you pay ' + R.inrFull(Math.max(0, w.price - c2.offer)) : '') + '. The offer holds for 7 days. ' + R.dealer(L.me()).name; try { navigator.clipboard.writeText(msg); } catch (z) { } draw(b); BO.toast('Offer message copied. Paste it into WhatsApp.'); return; }
        if (k.dataset.apx === 'decline') { setStatus(x, 'declined'); x.status = 'declined'; BO.closeSlide(); BO.toast('Declined. ' + esc(x.name.split(' ')[0]) + '’s request is closed.'); return; }
        if (c2.margin < 0) { BO.dialog({ title: 'Accept at a loss?', ok: 'Accept anyway', html: '<p style="margin:0">At this offer the car loses ' + R.inrFull(-c2.margin) + ' after refurbishment and a month of holding.</p>', run: accept }); return; }
        accept();
        function accept() { var dl = L.me(), sid = 'AP-' + x.id.replace(/[^A-Za-z0-9]/g, '') + '-' + Date.now().toString(36).slice(-3);
          L.addStock({ id: sid, dealer: dl, type: x.type, body: x.type === 'bike' ? 'naked' : 'sedan', make: x.make, model: x.model, year: x.year, km: x.km, owners: 1, target: c2.resale, bought: c2.offer, img: '', stage: 'Bought', at: Date.now(), from: 'appraisal', exchangeId: x.id, jobs: [{ id: 'est', label: 'Refurbishment estimate', vendor: 'From the appraisal', cost: c2.refurb }], city: R.dealer(dl).city });
          setStatus(x, 'accepted'); x.status = 'accepted'; BO.closeSlide(); BO.toast('Accepted. <b>' + esc(x.year + ' ' + x.make + ' ' + x.model) + '</b> is in stock under Bought.', { undo: function () { var s = R.get('revv:stock', []).filter(function (y) { return y.id !== sid; }); R.set('revv:stock', s); setStatus(x, 'offered'); BO.refresh(); } }); BO.go('refurb'); }
      };
    }
  }

  window.APPRAISE = { queue: queue };
  (window.DEALER_EXT = window.DEALER_EXT || []).push(function (cfg) {
    cfg.views.appraisals = vAppraise;
    var grp = cfg.nav.filter(function (g) { return g.group === 'Sell'; })[0];
    if (grp) grp.items.push({ id: 'appraisals', label: 'Appraisals', icon: 'tag' });
    var c0 = cfg.counts; cfg.counts = function () { var c = c0 ? c0() : {}; c.appraisals = queue(L.me()).filter(function (x) { return x.status === 'new'; }).length; return c; };
    (cfg.hot = cfg.hot || []).push('appraisals');
  });
  addEventListener('storage', function (e) { if (e.key === XKEY && window.BO && BO.counts) { BO.counts(); var n = real().slice(-1)[0]; if (n && Date.now() - (n.at || 0) < 60e3) BO.toast('New exchange request: <b>' + esc((n.year || '') + ' ' + (n.make || '') + ' ' + (n.model || '')) + '</b>'); } });
})();
