/* #why: the minutes-back calculator and the small live demos on each card. Every loop ticks only while its card is on
   screen and the tab is visible; with reduced motion nothing loops and each card keeps its static, final state. */
(function () {
  'use strict';
  var sec = document.getElementById('why'), grid = document.getElementById('wy');
  if (!sec || !grid) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s) { return sec.querySelector(s); }, $$ = function (s) { return Array.prototype.slice.call(sec.querySelectorAll(s)); };
  var inr = new Intl.NumberFormat('en-IN');
  function pop(el, cls) { cls = cls || 'wy-pop'; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  /* ---------- minutes-back calculator ---------- */
  var ppl = $('#wy-ppl'), tsk = $('#wy-tsk'), scs = $('#wy-sec'), big = $('#wy-h'), unit = $('#wy-hu'), eq = $('#wy-eq'), sr = $('#wy-sr'), cap = $('#wy-mcap'), month = $('#wy-month');
  var cells = month ? Array.prototype.slice.call(month.children) : [], shown = 0, tw = 0;
  function trim(n) { return n < 10 ? String(Math.round(n * 10) / 10) : inr.format(Math.round(n)); }
  function halves(d) { var r = Math.round(d * 2) / 2, i = Math.floor(r); return (i ? inr.format(i) : '') + (r % 1 ? '½' : '') || '0'; }
  function fill(el) { var lo = +el.min, hi = +el.max; el.style.setProperty('--p', ((el.value - lo) / (hi - lo) * 100).toFixed(1) + '%'); }
  function count(to) {
    cancelAnimationFrame(tw); var from = shown, t0 = performance.now(), dur = reduce ? 0 : 420;
    (function step(now) { var k = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3), v = from + (to - from) * e; big.textContent = trim(v); if (k < 1) tw = requestAnimationFrame(step); else { shown = to; big.textContent = trim(to); } })(t0);
  }
  function calc(announce) {
    if (!ppl) return;
    var p = +ppl.value, t = +tsk.value, s = +scs.value, perDay = t * s / 60, hours = p * t * s * 22 / 3600, days = hours / 8, fte = hours / 176;
    $('#wy-ppl-o').textContent = inr.format(p); $('#wy-tsk-o').textContent = inr.format(t); $('#wy-sec-o').textContent = s + ' s';
    [ppl, tsk, scs].forEach(fill);
    count(hours);
    unit.innerHTML = (trim(hours) === '1' ? 'hour' : 'hours') + ' back<br>every month';
    var mins = perDay < 1 ? Math.round(perDay * 60) + ' seconds' : perDay >= 90 ? trim(perDay / 60) + ' hours' : (perDay < 10 ? trim(perDay) : inr.format(Math.round(perDay))) + ' minute' + (trim(perDay) === '1' ? '' : 's');
    var what = fte >= 2 ? 'the whole working month of <b>' + trim(fte) + ' people</b>'
      : days >= 1 ? 'about <b>' + halves(days) + ' full working day' + (Math.round(days * 2) / 2 === 1 ? '' : 's') + '</b>' + (fte >= 1 ? ', more than one person’s whole month' : '')
      : hours >= 1 ? 'about <b>' + trim(hours) + ' hour' + (trim(hours) === '1' ? '' : 's') + '</b> a month' : 'about <b>' + Math.max(1, Math.round(hours * 60)) + ' minutes</b> a month';
    eq.innerHTML = 'That is ' + what + ', from <b>' + mins + '</b> per person, per day.';
    var d = Math.min(22, days);
    cells.forEach(function (c, i) { var f = Math.max(0, Math.min(1, d - i)); c.style.setProperty('--f', f.toFixed(3)); c.style.setProperty('--dl', (reduce ? 0 : i * 14) + 'ms'); });
    cap.innerHTML = '<span>One person’s working month: 22 days</span><b>' + (fte >= 1 ? '× ' + trim(fte) + (trim(fte) === '1' ? ' person' : ' people') : days < .25 ? 'under ½ a day' : halves(days) + ' of 22 days') + '</b>';
    if (announce && sr) sr.textContent = trim(hours) + ' hours back every month. ' + eq.textContent;
  }
  if (ppl) {
    [ppl, tsk, scs].forEach(function (el) { el.addEventListener('input', function () { calc(false); }); el.addEventListener('change', function () { calc(true); }); });
    calc(false);
  }

  /* ---------- the live demos ---------- */
  var loops = [];
  function loop(card, ms, fn, init) { if (card) loops.push({ card: card, ms: ms, fn: fn, init: init, k: 0, t: 0, ready: false }); }

  // effort tracking: counters tick up, today's heat cell warms
  (function () {
    var card = $('.wy-eff'); if (!card) return;
    var nums = $$('.wy-eff .wy-cnt b'), base = nums.map(function (b) { return +b.textContent; }), today = $('.wy-eff .td'), hits = 0, W = [.55, .75, .92, 1];
    loop(card, 1600, function () {
      var r = Math.random(), i = 0; while (r > W[i]) i++;
      var b = nums[i]; b.textContent = +b.textContent + 1; pop(b, 'wy-bump');
      if (++hits % 4 === 0 && today) { var lv = Math.min(4, (+(today.className.match(/l(\d)/) || [0, 0])[1]) + 1); today.className = 'l' + lv + ' td'; }
      if (+nums[0].textContent > 96) { nums.forEach(function (n, j) { n.textContent = base[j]; }); if (today) today.className = 'l1 td'; }
    });
  })();

  // clean data in, live decisions out: messy rows snap into clean records, the dashboard keeps moving
  (function () {
    var card = $('.wy-data'); if (!card) return;
    var sheet = $('#wy-sheet'), st = $('#wy-sst'), arw = $('#wy-arw'), act = $('#wy-act'), att = $('#wy-att'), dots = $$('#wy-dots i'), vis = $('#wy-vis'), now = $('#wy-now'), pos = $('#wy-pos'), arr = $('#wy-arr'), ev = $('#wy-ev'), cm = $('#wy-cm'), mr = $('#wy-mr');
    var A = 142, V = 1284, E = 38, C = 36, S = ['Importing 3 rows…', 'Checking for duplicates…', 'Merging 2 duplicates…', 'Fixing 1 phone number…'];
    function n(el, v, b) { el.textContent = inr.format(v); if (b) pop(el, 'wy-bump'); }
    loop(card, 1300, function (L) {
      var k = L.k % 8;
      if (k < 4) { sheet.className = 'wy-sheet st' + k; st.textContent = S[k]; }
      if (k === 0) { att.textContent = '11/12'; dots[11].className = 'off'; pos.textContent = '7'; arr.textContent = ''; }
      if (k === 4) { sheet.className = 'wy-sheet'; st.textContent = '✓ 2 clean records moved in'; pop(arw); pos.textContent = '4'; arr.textContent = '▲3'; pop(arr); att.textContent = '12/12'; dots[11].className = ''; pop(att, 'wy-bump'); }
      A += 1 + Math.floor(Math.random() * 3); n(act, A, true);
      now.textContent = 4 + Math.floor(Math.random() * 6);
      if (Math.random() < .6) { V += 1 + Math.floor(Math.random() * 3); n(vis, V); }
      if (Math.random() < .4) { E++; if (Math.random() < .85) C++; n(ev, E, true); cm.textContent = C; mr.style.setProperty('width', Math.round(C / E * 100) + '%'); }
      if (A > 400) { A = 142; V = 1284; E = 38; C = 36; }
      L.k++;
    });
  })();

  // employee management: check-ins and hand-overs come in
  (function () {
    var card = $('.wy-team'); if (!card) return;
    var chips = $$('.wy-team .wy-st');
    var S = [[2, 'Not in yet', 'wait'], [2, 'Checked in 10:02', ''], [1, 'Visit done · 3 photos', ''], [0, 'Approved a discount', ''], [2, 'Leave from Fri', 'away'], [1, 'On site · Sector 62', ''], [0, 'Checked in 9:41', ''], [2, 'Checked in 10:02', '']];
    loop(card, 2300, function (L) { var s = S[L.k % S.length], c = chips[s[0]]; c.textContent = s[1]; c.className = 'wy-st' + (s[2] ? ' ' + s[2] : ''); pop(c); L.k++; });
  })();

  // leads to revenue: a deal walks New → Called → Visit → Won
  (function () {
    var card = $('.wy-lead'); if (!card) return;
    var deal = $('#wy-deal'), nm = deal.querySelector('b'), lab = deal.querySelector('small'), won = $('#wy-won'), total = 18.6, di = 0;
    var D = [['Ravi', 4.8], ['Meena', 9.2], ['Arjun', 6.5]], ST = ['website', 'called', 'Sat 11am'];
    function place(s, jump) { if (jump) deal.classList.add('jump'); deal.style.setProperty('--s', s); if (jump) { void deal.offsetWidth; deal.classList.remove('jump'); } }
    loop(card, 1300, function (L) {
      var k = L.k % 6, d = D[di % D.length];
      if (k === 0) { nm.textContent = d[0]; lab.textContent = ST[0]; deal.classList.remove('won'); place(0, true); }
      else if (k < 3) { lab.textContent = ST[k]; place(k); }
      else if (k === 3) { place(3); lab.textContent = '₹' + d[1] + ' L'; deal.classList.add('won'); total = total > 60 ? 18.6 : Math.round((total + d[1]) * 10) / 10; won.textContent = '₹' + total + ' L'; pop(won, 'wy-bump'); }
      else if (k === 5) di++;
      L.k++;
    });
  })();

  // stock, orders and billing: orders draw stock down, a reorder fires, GST invoices go out
  (function () {
    var card = $('.wy-stock'); if (!card) return;
    var qty = $('#wy-qty'), bar = $('.wy-stock .wy-bar'), ord = $('#wy-ord'), inv = $('#wy-inv'), q = 54, so = 2266, ino = 412, po = 118, pend = false;
    function set(n) { q = n; qty.textContent = n; bar.style.setProperty('--q', Math.round(n / 60 * 100) + '%'); bar.classList.toggle('low', n <= 12); }
    loop(card, 1500, function () {
      if (pend) { pend = false; set(q + 40); ord.className = 'wy-chip po'; ord.textContent = 'PO-' + po + ' received · +40'; po++; pop(ord); return; }
      set(q - 6); ord.className = 'wy-chip'; ord.textContent = 'SO-' + (so++) + ' · −6 chairs'; inv.textContent = 'INV-0' + (ino++) + ' · GST 18% · ₹21,240'; pop(ord); pop(inv);
      if (q <= 12) { pend = true; setTimeout(function () { ord.className = 'wy-chip po'; ord.textContent = 'Low stock · PO-' + po + ' raised for 40'; pop(ord); }, 650); }
    }, function () { set(54); });
  })();

  // customers who help themselves: a 2 am question, answered and booked
  (function () {
    var card = $('.wy-help'); if (!card) return;
    var a = $('.wy-help .wy-b.in'), b = $('.wy-help .wy-b.out'), typ = $('.wy-help .wy-typ');
    loop(card, 900, function (L) {
      var k = L.k % 9;
      if (k === 0) { b.classList.add('hid'); typ.classList.remove('on'); a.classList.add('hid'); setTimeout(function () { a.classList.remove('hid'); }, 260); }
      if (k === 2) typ.classList.add('on');
      if (k === 4) { typ.classList.remove('on'); b.classList.remove('hid'); }
      L.k++;
    });
  })();

  // cost-effective by design: modules snap on one at a time
  (function () {
    var card = $('.wy-cost'); if (!card) return;
    var mods = $$('.wy-cost .wy-m'), n = mods.length, out = $('#wy-mn');
    loop(card, 850, function (L) {
      var k = L.k % (n + 4);
      if (k === 0) mods.forEach(function (m) { m.classList.remove('on'); });
      else if (k <= n) { mods[k - 1].classList.add('on'); pop(mods[k - 1], 'wy-snap'); }
      out.textContent = Math.min(k, n); L.k++;
    });
  })();

  // in-house and all connected: what just moved between the pieces
  (function () {
    var card = $('.wy-conn'); if (!card) return;
    var span = $('.wy-conn .wy-tick span');
    var M = ['Website enquiry → CRM lead in 0.4 s', 'CRM lead → visit task in the field app', 'App: visit done, photos → CRM record', 'CRM deal won → project created', 'Project task done → client portal updated'];
    loop(card, 2600, function (L) { span.classList.add('fade'); setTimeout(function () { span.textContent = M[++L.k % M.length]; span.classList.remove('fade'); }, 300); });
  })();

  // India-ready calling and SMS: call → IVR → CRM → DLT SMS
  (function () {
    var card = $('.wy-tel'); if (!card) return;
    var steps = $$('.wy-flow li'), flow = $('.wy-flow');
    loop(card, 1400, function (L) {
      var k = L.k % 6;
      if (k === 0) { steps.forEach(function (s) { s.classList.remove('on'); }); flow.style.setProperty('--t', 0); }
      if (k < 4) { steps[k].classList.add('on'); pop(steps[k]); flow.style.setProperty('--t', (k / 3).toFixed(3)); }
      L.k++;
    });
  })();

  /* ---------- run only while on screen ---------- */
  if (!('IntersectionObserver' in window)) return;
  var cards = $$('.wy-c,.wy-tel'), running = false;
  if (!reduce) sec.classList.add('wy-anim');
  var seen = new IntersectionObserver(function (es) {
    var n = 0;
    es.forEach(function (e) {
      e.target.classList.toggle('wy-v', e.isIntersecting && !reduce);
      if (e.isIntersecting && !e.target.classList.contains('wy-seen')) { var el = e.target; setTimeout(function () { el.classList.add('wy-seen'); }, reduce ? 0 : 70 * n++); }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: .12 });
  cards.forEach(function (c) { seen.observe(c); });
  if (reduce) return;
  function start() {
    if (running || document.hidden) return; running = true;
    loops.forEach(function (L) {
      if (!L.ready) { L.ready = true; if (L.init) L.init(L); L.fn(L); }
      L.t = setInterval(function () { if (L.card.classList.contains('wy-v')) L.fn(L); }, L.ms);
    });
  }
  function stop() { if (!running) return; running = false; loops.forEach(function (L) { clearInterval(L.t); }); }
  var near = false;
  new IntersectionObserver(function (es) { near = es[0].isIntersecting; if (near) start(); else stop(); }, { threshold: 0 }).observe(sec);
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (near) start(); });
})();
