/* Northlane · Follow one order.
   The real store (on a phone) and the real back office (in a window) side by side, sharing one order through the store
   database: Meera adds the Harbor Jacket to a bag that already holds a tee and pays by UPI; the order lands in Jaipur;
   Kabir scans and weighs it on the packing bench; the 4 pm courier collects it; Meera's phone buzzes with the WhatsApp
   message that opens the tracking page. Play runs it; "Do it myself" hands both screens over and waits for each step. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fS = $('#fStore'), fA = $('#fAdmin'), stage = $('#trStage'), ring = $('#trRing'), cur = $('#trCur'), hint = $('#trHint'), list = $('#trSteps'), prog = $('#trProg'), playB = $('#trPlay'), selfB = $('#trSelf'), wa = $('#trWa');
  var S = {}, run = 0, mode = 'idle', paused = false, step = 0, target = null, watchT = 0, bag0 = null;
  try { bag0 = localStorage.getItem('nl-cart'); } catch (e) {}

  var gf = $('#gf'); if (gf) { var on = function () { gf.media = 'all'; }; if (gf.sheet) on(); else gf.addEventListener('load', on); }

  /* ───────── time that pauses, and waiting for things ───────── */
  function stopErr() { var e = new Error('stop'); e.stop = true; return e; }
  function sleep(ms) { var my = run, el = 0; return new Promise(function (res, rej) { (function t() { if (my !== run) return rej(stopErr()); if (!paused) el += 60; if (el >= ms) return res(); setTimeout(t, 60); })(); }); }
  function waitFor(fn, ms) { var my = run, t0 = Date.now(); return new Promise(function (res, rej) { (function t() { if (my !== run) return rej(stopErr()); var v = null; try { v = fn(); } catch (e) {} if (v) return res(v); if (Date.now() - t0 > (ms || 15000)) return rej(new Error('timeout')); setTimeout(t, 100); })(); }); }

  /* ───────── the two frames ───────── */
  function sw() { try { return fS.contentWindow; } catch (e) { return null; } }
  function aw() { try { return fA.contentWindow; } catch (e) { return null; } }
  function sd() { var w = sw(); try { return w && w.document; } catch (e) { return null; } }
  function ad() { var w = aw(); try { return w && w.document; } catch (e) { return null; } }
  // inside the frames the portfolio bar is already on this page, so it is hidden there
  function dress(f) { try { var d = f.contentDocument; if (!d || !d.head || d.getElementById('trDress')) return; var s = d.createElement('style'); s.id = 'trDress'; s.textContent = '.nl-bar,.demo,.to-home{display:none!important}:root{--bar:0px!important}'; d.head.appendChild(s); } catch (e) {} }
  setInterval(function () { dress(fS); dress(fA); }, 120);
  function load(f, url) { var my = run; return new Promise(function (res, rej) { function done() { f.removeEventListener('load', done); if (my !== run) return rej(stopErr()); dress(f); res(); } f.addEventListener('load', done); f.src = url; }); }
  function storeReady(sel) { return waitFor(function () { var w = sw(), d = sd(); return w && w.NL && w.NLS && d && d.readyState === 'complete' && (!sel || d.querySelector(sel)); }, 25000); }
  function adminReady(page) { return waitFor(function () { var w = aw(), d = ad(); return w && w.A && w.NL && d.body.classList.contains('ready') && !d.querySelector('#view .boot') && !d.querySelector('#view .sk') && (!page || d.body.getAttribute('data-page') === page); }, 25000); }
  function fit() {
    var ph = $('.tr-ph-in'), s1 = ph.clientWidth / 390 || 1; fS.style.width = '390px'; fS.style.height = Math.round((ph.clientHeight - 32) / s1) + 'px'; fS.style.transform = 'scale(' + s1 + ')';
    var dk = $('.tr-desk-in'), w = dk.clientWidth, W = innerWidth <= 1000 ? 390 : w >= 820 ? 1180 : 1024, s2 = w / W || 1; fA.style.width = W + 'px'; fA.style.height = Math.round(dk.clientHeight / s2) + 'px'; fA.style.transform = 'scale(' + s2 + ')';
  }
  addEventListener('resize', function () { fit(); place(); });
  addEventListener('scroll', place, { passive: true });

  /* ───────── pointing at things inside the frames ───────── */
  function box(f, el) { var fr = f.getBoundingClientRect(), r = el.getBoundingClientRect(), s = fr.width / (f.offsetWidth || 1); return { x: fr.left + r.left * s, y: fr.top + r.top * s, w: r.width * s, h: r.height * s, f: fr }; }
  function place() { if (!target) return;
    if (target.top) { var t = target.top.getBoundingClientRect(), q = target.pad; ring.style.transform = 'translate(' + (t.left - q).toFixed(1) + 'px,' + (t.top - q).toFixed(1) + 'px)'; ring.style.width = (t.width + 2 * q).toFixed(1) + 'px'; ring.style.height = (t.height + 2 * q).toFixed(1) + 'px'; ring.classList.add('on'); return; }
    var el = target.el; if (!el || !el.isConnected) { ring.classList.remove('on'); return; }
    var b = box(target.f, el), p = target.pad, clip = target.f.parentNode.getBoundingClientRect(), x0 = Math.max(b.x - p, clip.left + 2), y0 = Math.max(b.y - p, clip.top + 2), x1 = Math.min(b.x + b.w + p, clip.right - 2), y1 = Math.min(b.y + b.h + p, clip.bottom - 2);
    if (x1 - x0 < 6 || y1 - y0 < 6) { ring.classList.remove('on'); return; }
    ring.style.transform = 'translate(' + x0.toFixed(1) + 'px,' + y0.toFixed(1) + 'px)'; ring.style.width = (x1 - x0).toFixed(1) + 'px'; ring.style.height = (y1 - y0).toFixed(1) + 'px'; ring.classList.add('on'); }
  function show(f, el, pad) { target = el ? { f: f, el: el, pad: pad == null ? 6 : pad } : null; if (target) place(); else ring.classList.remove('on'); }
  function clear() { target = null; ring.classList.remove('on'); cur.classList.remove('on'); }
  function reveal(el) { var w = el.ownerDocument.defaultView, r = el.getBoundingClientRect(), y = w.scrollY + r.top - w.innerHeight / 2 + r.height / 2;
    if (r.top > 60 && r.bottom < w.innerHeight - 80) return; try { if (w.Motion && w.Motion.lenis) w.Motion.lenis.scrollTo(Math.max(0, y), { immediate: true }); else w.scrollTo(0, Math.max(0, y)); } catch (e) { w.scrollTo(0, Math.max(0, y)); } }
  async function tap(f, el) {
    if (!el) return; reveal(el); await sleep(220); show(f, el); var b = box(f, el);
    cur.style.transform = 'translate(' + (b.x + b.w / 2).toFixed(1) + 'px,' + (b.y + b.h / 2).toFixed(1) + 'px)'; cur.classList.add('on');
    await sleep(reduce ? 120 : 680); cur.classList.remove('tap'); void cur.offsetWidth; cur.classList.add('tap'); await sleep(160); el.click(); setTimeout(function () { cur.classList.remove('on'); }, 520); }
  async function type(f, input, text) { reveal(input); show(f, input, 4); input.value = ''; var E = input.ownerDocument.defaultView.Event;
    for (var i = 0; i < text.length; i++) { input.value += text[i]; input.dispatchEvent(new E('input', { bubbles: true })); await sleep(reduce ? 10 : 55); } }
  function view(who) { stage.setAttribute('data-show', who); $$('.tr-sw button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-show') === who)); }); fit(); place(); }
  $$('.tr-sw button').forEach(function (b) { b.addEventListener('click', function () { view(b.getAttribute('data-show')); }); });

  /* ───────── the order's state, read from the shared database ───────── */
  function cart() { try { return JSON.parse(localStorage.getItem('nl-cart')) || []; } catch (e) { return []; } }
  function hasJacket() { return !!S.id || cart().some(function (c) { return c.id === 'harbor-jacket'; }); }
  function NLx() { var w = aw(); if (w && w.NL) return w.NL; w = sw(); return w && w.NL; }
  function findOrder() { if (S.id) return true; var N = NLx(); if (!N) return false; var o = N.db().orders.filter(function (x) { return x.t >= S.t0; })[0]; if (o) { S.id = o.id; S.email = o.email; } return !!o; }
  function order() { var N = NLx(); return S.id && N ? N.order(S.id) : null; }
  function fulfilled() { var o = order(); return !!o && NLx().fulfilment(o) === 'fulfilled'; }
  function scanned() { var o = order(), w = aw(); if (!o) return false; if (fulfilled()) return true; var st = w && w.A && w.A.bench && w.A.bench.state(); return !!st && st.id === S.id && st.got >= st.need; }
  function shipped() { var o = order(), N = NLx(); return !!o && o.ships.some(function (s) { return N.STG.indexOf(s.stage) >= 2; }); }
  function onTrack() { var d = sd(); return !!d && /track\.html/.test(d.URL) && !/new=1/.test(d.URL); }
  function trackUrl(isNew) { return '../orders/track.html?o=' + encodeURIComponent(S.id) + '&e=' + encodeURIComponent(S.email) + (isNew ? '&new=1' : ''); }
  function pickVariant(N, id, prefer) { var p = N.product(id), i, c, s; if (!p) return null;
    for (i = 0; i < prefer.length; i++) { c = prefer[i][0]; s = prefer[i][1]; if (p.colors[c] && p.sizes.indexOf(s) >= 0 && N.stock(N.skuKey(id, c, s)).avail > 0) return { c: c, s: s, si: p.sizes.indexOf(s) }; }
    for (c = 0; c < p.colors.length; c++) for (i = 0; i < p.sizes.length; i++) if (N.stock(N.skuKey(id, c, p.sizes[i])).avail > 0) return { c: c, s: p.sizes[i], si: i };
    return null; }
  function jacket(N) { return pickVariant(N, 'harbor-jacket', [[1, 'M'], [1, 'S'], [2, 'M'], [0, 'M'], [1, 'L'], [2, 'S'], [0, 'S']]); }
  function money(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }

  /* ───────── the nine steps ───────── */
  var STEPS = [
    { who: 'store', t: 'Meera finds the Harbor Jacket', d: 'On her phone in Mumbai, with last week’s tee still in the bag.', self: 'On the phone, pick a colour and a size.', ok: hasJacket, go: async function () {
      if (hasJacket()) return; var d = sd(); if (!d || !/product\.html/.test(d.URL)) { await load(fS, '../store/product.html?id=harbor-jacket'); }
      await storeReady('#pAdd'); await sleep(600); var w = sw(), k = jacket(w.NL); if (!k) throw new Error('sold out');
      await tap(fS, $$('#pColors button', sd())[k.c]); await sleep(500); await tap(fS, $$('#pSizes button', sd())[k.si]); await sleep(500); } },
    { who: 'store', t: 'Into the bag, next to the tee', d: 'The bag shows both pieces and how close she is to free delivery.', self: 'Tap Add to bag.', ok: hasJacket, go: async function () {
      if (hasJacket()) return; await tap(fS, $('#pAdd', sd()));
      await waitFor(hasJacket, 4000).catch(function () { var w = sw(), k = jacket(w.NL); w.NLS.add('harbor-jacket', k.c, k.s, 1); });
      var dr = $('.nl-drawer', sd()); if (dr) show(fS, dr, -2); await sleep(2200); } },
    { who: 'store', t: 'She pays by UPI', d: 'One tap on the phone. The order is real: stock is held and the studio sees it straight away.', self: 'Check out from the bag and pay with UPI.', ok: findOrder, go: async function () {
      if (!findOrder()) {
        var w = sw(), co = $('.dr-ft a[href*="checkout"], .dr-ft .nl-btn', sd());
        if (co && co.href) { var nav = new Promise(function (res) { fS.addEventListener('load', function on() { fS.removeEventListener('load', on); dress(fS); res(); }); }); await tap(fS, co); await nav; } else await load(fS, '../store/checkout.html');
        await storeReady('#coSide'); await sleep(700); show(fS, $('#coSide', sd()), 4); await sleep(1600);
        w = sw(); var r = w.NL.placeOrder({ cart: w.NLS.cart(), email: S.email, phone: S.phone, addr: S.addr, ship: 'std', code: '', pay: { m: 'UPI', d: 'UPI' }, gift: null, mkt: false, channel: 'Online store' });
        if (!r.ok) throw new Error(r.msg || 'order'); S.id = r.order.id; w.NLS.setCart([]);
      }
      if (!/track\.html/.test(sd().URL)) await load(fS, trackUrl(true));
      await waitFor(function () { var t = $('#thx', sd()); return t && t.textContent.trim(); }, 12000).catch(function () {});
      show(fS, $('#thx', sd()), 2); await sleep(1800); } },
    { who: 'admin', t: 'The order lands in Jaipur', d: 'Nobody refreshes anything: the back office hears the store, and the order drops into the list.', self: 'Watch the order list in the back office.', ok: function () { return !!order(); }, go: async function () {
      var w = aw(); if (w.A.parse().name !== 'orders' || w.A.parse().id) { w.A.go('orders'); await adminReady('orders'); }
      var row = await waitFor(function () { return $('[data-href$="/' + S.id + '"]', ad()); }, 6000).catch(function () { return null; });
      if (!row) { w.A.refresh(); row = await waitFor(function () { return $('[data-href$="/' + S.id + '"]', ad()); }, 4000).catch(function () { return null; }); }
      if (row) show(fA, row, 2); await sleep(2400); var t = $('.toast', ad()); if (t) { show(fA, t, 4); await sleep(1500); } } },
    { who: 'admin', t: 'Kabir scans both pieces', d: 'The packing bench shows each piece with its bin; the scan field ticks them off.', self: 'On the bench, type the code under each piece and press Enter, or tap the piece.', ok: scanned, go: async function () {
      if (scanned()) return; var w = aw(); w.A.go('bench/' + S.id); await adminReady('bench');
      await waitFor(function () { var st = w.A.bench && w.A.bench.state(); return st && st.id === S.id; }, 8000); await sleep(800);
      var o = order();
      for (var i = 0; i < o.items.length; i++) {
        var left = w.NL.remaining(o, i);
        for (var k = 0; k < left; k++) {
          var st = w.A.bench.state(); if (!st || st.got >= st.need) break; var code = w.A.bench.code(o, i), card = $('.bn-it[data-i="' + i + '"]', ad());
          if (card) { show(fA, card, 3); await sleep(1000); }
          var inp = $('#bnScan', ad()); if (inp) { await type(fA, inp, code); await sleep(300); inp.value = ''; } w.A.bench.scan(code); await sleep(1000);
        }
      } } },
    { who: 'admin', t: 'Weighed, labelled, next', d: 'The weight check catches a missing piece. The courier label prints with its AWB.', self: 'Read the scale, then Print label and next.', ok: fulfilled, go: async function () {
      if (fulfilled()) return; var rd = $('[data-act="read"]', ad()); if (rd) await tap(fA, rd); await sleep(1000);
      var pk = $('#bnPack', ad()); if (pk) await tap(fA, pk); await waitFor(fulfilled, 5000);
      var md = await waitFor(function () { return $('.md', ad()); }, 2500).catch(function () { return null; }); if (md) { show(fA, md, 4); await sleep(3000); } } },
    { who: 'admin', t: '4 pm: the parcel leaves Jaipur', d: 'Parcelwise collects it, and on the map it joins every other parcel on the road.', self: 'Open the order journey and choose Hand to carrier.', ok: shipped, go: async function () {
      var w = aw(), o = order(); if (!shipped()) { var sh = o.ships.filter(function (s) { return s.stage === 'packed'; })[0]; if (sh) w.NL.advance(o, sh.id, 'shipped', { by: 'Kabir Sethi' }); }
      w.A.go(''); await adminReady('home'); await waitFor(function () { return w.A.pm && w.A.pm.has(S.id); }, 8000);
      aw().scrollTo(0, 0); await sleep(300); w.A.pm.focus(S.id); show(fA, $('.pm-mapw', ad()), 0); await sleep(3800); } },
    { who: 'store', t: 'Meera’s phone buzzes', d: 'The shipping message goes out on WhatsApp the moment the courier scans the parcel.', self: 'Tap the message on the phone.', ok: onTrack, go: async function () { clear(); buzz(); await sleep(700); target = { top: wa, pad: 4 }; place(); await sleep(3200); } },
    { who: 'store', t: 'She follows it to her door', d: 'The tracking page shows the same scans the studio sees.', self: '', ok: onTrack, go: async function () {
      unbuzz(); if (!onTrack()) await load(fS, trackUrl(false)); await waitFor(function () { var r = $('#res', sd()); return r && r.textContent.trim(); }, 12000).catch(function () {});
      var r = $('#res', sd()); if (r) { reveal(r); show(fS, r, 2); } await sleep(2800); } }
  ];
  function buzz() { var N = NLx(), m = N && N.db().outbox.filter(function (x) { return x.oid === S.id && x.ch === 'wa' && x.ev === 'shipped'; })[0];
    $('#trWaT').textContent = m ? m.body : 'Your Northlane order ' + S.id + ' is on its way with Parcelwise.'; view('store'); wa.hidden = false;
    requestAnimationFrame(function () { wa.classList.add('on'); }); var ph = $('#trPhone'); ph.classList.remove('buzz'); void ph.offsetWidth; if (!reduce) ph.classList.add('buzz'); }
  function unbuzz() { wa.classList.remove('on'); setTimeout(function () { if (!wa.classList.contains('on')) wa.hidden = true; }, 500); }
  wa.addEventListener('click', function () { if (!S.id) return; unbuzz(); load(fS, trackUrl(false)).catch(function () {}); });

  /* ───────── the step list ───────── */
  list.innerHTML = STEPS.map(function (s, i) { return '<li data-i="' + i + '"><span class="n">' + (i + 1) + '</span><div><b>' + s.t + '</b><small>' + (s.who === 'store' ? 'The store' : 'The back office') + '</small><p>' + s.d + '</p></div></li>'; }).join('');
  function ui() {
    $$('li', list).forEach(function (li, i) { li.className = i < step || STEPS[i].done ? 'done' : i === step ? 'cur' : ''; if (i === step && mode !== 'done') li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
    prog.textContent = mode === 'done' ? 'All nine steps · ' + (S.id || '') : 'Step ' + Math.min(step + 1, STEPS.length) + ' of ' + STEPS.length + (mode === 'self' ? ' · your turn' : paused ? ' · paused' : '');
    var playing = mode === 'auto' && !paused; playB.classList.toggle('playing', playing); $('.tb-t', playB).textContent = mode === 'done' ? 'Run it again' : playing ? 'Pause' : mode === 'idle' ? 'Play' : 'Play from here';
    selfB.setAttribute('aria-pressed', String(mode === 'self')); stage.classList.toggle('free', mode === 'self' || mode === 'done');
    if (mode === 'self' && STEPS[step]) hint.textContent = STEPS[step].self ? 'Your turn: ' + STEPS[step].self : '';
    else if (mode !== 'done') hint.textContent = '';
  }
  STEPS[2].title = function () { var el = $('li[data-i="2"] b', list); if (el && S.total) el.textContent = 'She pays ' + money(S.total) + ' by UPI'; };

  /* ───────── running it ───────── */
  async function prepare() {
    clear(); unbuzz(); STEPS.forEach(function (s) { s.done = false; }); step = 0; S = {}; mode = 'auto'; paused = false; ui();
    hint.textContent = 'Opening the store and the back office…';
    await Promise.all([load(fS, '../store/product.html?id=harbor-jacket'), load(fA, 'admin.html#/orders')]);
    await storeReady('#pAdd'); await adminReady('orders'); aw().__tour = true; fit();
    var N = sw().NL, dm = N.demo() || {}, c = N.custByEmail(dm.email) || {}, a = (c.addrs || [])[0] || {};
    S.email = dm.email || 'meera.iyer@example.com'; S.name = c.name || a.name || 'Meera Iyer'; S.phone = c.phone || '';
    S.addr = { name: a.name || S.name, l1: a.l1 || '14 Carter Road', l2: a.l2 || 'Bandra West', city: a.city || 'Mumbai', state: a.state || 'Maharashtra', pin: a.pin || '400050' };
    if (!N.session() || N.session().email !== S.email) N.signIn(S.email, S.name);
    var tee = pickVariant(N, 'everyday-tee', [[0, 'M'], [1, 'M'], [0, 'S'], [0, 'L']]); sw().NLS.setCart(tee ? [{ id: 'everyday-tee', c: tee.c, s: tee.s, q: 1 }] : []);
    var k = jacket(N); if (k) { var q = N.quote((tee ? [{ id: 'everyday-tee', c: tee.c, s: tee.s, q: 1 }] : []).concat([{ id: 'harbor-jacket', c: k.c, s: k.s, q: 1 }]), { pin: S.addr.pin, ship: 'std', pay: 'UPI' }); S.total = q.total; STEPS[2].title(); }
    S.t0 = Date.now(); hint.textContent = '';
  }
  async function play(from) {
    var my = ++run; mode = 'auto'; paused = false; clearInterval(watchT); ui();
    try {
      for (step = from; step < STEPS.length; step++) { ui(); view(STEPS[step].who); await STEPS[step].go(); if (my !== run) return; STEPS[step].done = true; }
      finish();
    } catch (e) { if (e && e.stop) return; mode = 'idle'; paused = false; ui(); clear(); hint.textContent = 'Step ' + (step + 1) + ' didn’t finish: ' + (e && e.message === 'timeout' ? 'the page took too long to answer.' : e && e.message === 'sold out' ? 'the jacket has sold out in every size. Restock it in Inventory first.' : 'something changed on the page.') + ' Choose Start again.'; }
  }
  function finish() { run++; mode = 'done'; step = STEPS.length; clear(); unbuzz(); ui(); clearInterval(watchT);
    hint.innerHTML = 'That’s one order, start to finish: two apps, one record. <a href="admin.html#/orders/' + encodeURIComponent(S.id) + '">Open ' + S.id + ' in the back office</a> or <a href="admin.html#/bench">see what’s left on the bench</a>.'; }
  function self() {
    if (mode === 'done') return; run++; mode = 'self'; paused = false; clear(); ui();
    clearInterval(watchT); watchT = setInterval(function () {
      if (mode !== 'self') { clearInterval(watchT); return; } var s = STEPS[step]; if (!s) return;
      if (step === 7 && !wa.classList.contains('on') && shipped()) buzz();
      if (s.ok()) { s.done = true; step++; if (step >= STEPS.length) { finish(); return; } ui(); view(STEPS[step].who); if (step === 3 || step === 8) { /* nothing to do: it happens on its own */ } }
    }, 500);
  }
  playB.addEventListener('click', function () {
    if (mode === 'done') { restart(); return; }
    if (mode === 'auto') { paused = !paused; ui(); if (paused) cur.classList.remove('on'); return; }
    play(step);
  });
  selfB.addEventListener('click', function () { if (mode === 'self') play(step); else self(); });
  $('#trRe').addEventListener('click', restart);
  function restart() { run++; clearInterval(watchT); prepare().then(function () { play(0); }, function (e) { if (!e || !e.stop) hint.textContent = 'The store didn’t open. Choose Start again.'; }); }
  // the visitor's own bag comes back when they leave
  addEventListener('pagehide', function () { try { if (bag0 == null) localStorage.removeItem('nl-cart'); else localStorage.setItem('nl-cart', bag0); } catch (e) {} });

  (function clock() { var d = new Date(), el = $('#trClock'); if (el) el.textContent = (d.getHours() % 12 || 12) + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); setTimeout(clock, 20000); })();
  fit(); ui();
  // the two apps start loading once the page itself is on screen, so the first paint never waits for them
  var begun = false, begin = function () { if (begun) return; begun = true; restart(); };
  requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(begin, 0); }); }); setTimeout(begin, 700);
})();
