/* Studio OS product page: hero intro, pinned scroll story, role tabs. Design sample by Abhishek. */
(function () {
  'use strict';
  var html = document.documentElement;
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* nav border on scroll */
  var nav = $('.nav');
  window.addEventListener('scroll', function () { nav.classList.toggle('scrolled', window.scrollY > 8); }, { passive: true });

  /* role tabs */
  var ROLES = [
    { h: 'Ira, the owner', p: 'Approvals, overdue money and project health in one inbox. The only person who can change a rate, and the only one who sees the audit log.', img: 'media/ui-home.jpg?v=2', w: 2000, hh: 1208, a: 'index.html?as=owner#/', al: 'Open as Ira', alt: 'Owner home: pipeline, receivables, approvals inbox and live projects' },
    { h: 'Kabir, project manager', p: 'His quotes, his projects, client comments and change orders waiting on a signature. Margin is visible; rates are read-only, with a “suggest a change” button.', img: 'media/ui-quote.jpg?v=2', w: 1600, hh: 966, a: 'index.html?as=pm#/quote/q-mehra', al: 'Open as Kabir', alt: 'Quote builder with rooms, line items, version tabs, client comments and the approval policy' },
    { h: 'Rakesh, accounts', p: 'Finance first: what is ready to bill, what came in this month with which UTR, and which client needs a polite reminder today.', img: 'media/ui-accounts.jpg?v=2', w: 1600, hh: 966, a: 'index.html?as=accounts#/', al: 'Open as Rakesh', alt: 'Accounts home: outstanding, collected this month, ready to bill and ageing' },
    { h: 'Tanvi, designer', p: 'Her leads in the brief stage, design boards with client comments to answer, renders to version and rooms to send for approval. Quotes yes, money no.', img: 'media/ui-designer.jpg?v=2', w: 1600, hh: 966, a: 'index.html?as=design#/', al: 'Open as Tanvi', alt: 'Designer home: leads to call, client comments waiting, and a design-changes card with pinned comments' },
    { h: 'Imran, site engineer', p: 'Three sites, a camera and a bottom bar. Logs, snags and deliveries, with every amount hidden from his view.', img: 'media/ui-site-m.jpg?v=2', w: 720, hh: 1502, a: 'index.html?as=site#/site', al: 'Open as Imran', alt: 'Site engineer phone screen with sites and snags', phone: true },
    { h: 'Rohan, the client', p: 'His own portal: progress by milestone, site photos, rooms to approve with comments pinned on the render, payments and signed documents. Nothing internal.', img: 'media/ui-portal-m.jpg?v=2', w: 720, hh: 1502, a: 'index.html#/d/dz-iyer', al: 'Open the client link', alt: 'Client portal on a phone: project progress, site photos and design approvals', phone: true }
  ];
  var tabs = $$('.role-tabs [role=tab]');
  function setRole(i, focus) {
    var r = ROLES[i], img = $('#rpImg'), shot = $('.rp-shot');
    tabs.forEach(function (t, j) { t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1; });
    $('#rp').setAttribute('aria-labelledby', tabs[i].id);
    $('#rpH').textContent = r.h; $('#rpP').textContent = r.p; $('#rpA').href = r.a; $('#rpA').textContent = r.al;
    img.style.opacity = '0';
    setTimeout(function () { img.src = r.img; img.width = r.w; img.height = r.hh; img.alt = r.alt; shot.classList.toggle('phone-mode', !!r.phone); img.style.opacity = '1'; }, RM ? 0 : 160);
    if (focus) tabs[i].focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { setRole(i); });
    t.addEventListener('keydown', function (e) { var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null; if (n == null) return; e.preventDefault(); setRole((n + tabs.length) % tabs.length, true); });
  });

  /* every version, and what changed: three versions of one quote under a scrubber */
  (function () {
    var box = $('#vs'); if (!box) return;
    var lines = $$('.vs-line', box).map(function (li) { return { li: li, v: li.dataset.v.split(',').map(Number), n: li.dataset.n.split('|'), a: $('.vs-a', li), note: $('.vs-note', li), was: $('.vs-was', li), shown: 0 }; });
    var rooms = $$('.vs-room', box), wf = $$('#vsW li', box), tot = $('#vsTot'), d = $('#vsD'), range = $('#vsR'), tabs = $$('.vs-tabs button', box);
    var LAB = ['Version 1, sent 4 November', 'Version 2, revised 11 November', 'Version 3, signed 18 November'], shownTot = 0, raf = 0;
    function inr(n) { return money.format(Math.round(n)); }
    function roomOf(l) { var e = l.li.previousElementSibling; while (e && !e.classList.contains('vs-room')) e = e.previousElementSibling; return e; }
    lines.forEach(function (l) { l.room = roomOf(l); });
    function setV(v, anim) {
      var from = lines.map(function (l) { return l.shown; }), fromTot = shownTot, to = lines.map(function (l) { return l.v[v]; }), toTot = to.reduce(function (x, y) { return x + y; }, 0);
      lines.forEach(function (l) {
        var now = l.v[v], first = l.v[0], prev = v ? l.v[v - 1] : first, c = l.li.classList;
        var off = !now && !l.v.slice(0, v + 1).some(Boolean);                 // not in the quote yet
        var cut = !now && !off, isNew = !!now && !first, chg = !!now && !!first && now !== first;
        c.toggle('is-off', off); c.toggle('is-cut', cut); c.toggle('is-new', isNew); c.toggle('is-chg', chg);
        l.note.textContent = cut ? 'removed' : isNew ? 'added' : chg ? (l.n[v] || l.n[1] || 'changed') : '';
        l.was.textContent = chg ? inr(first) : '';
        l.li.setAttribute('aria-hidden', String(off));
        if (cut) { l.a.textContent = inr(first); l.shown = 0; }
      });
      rooms.forEach(function (r) { var mine = lines.filter(function (l) { return l.room === r; }), sum = 0, any = false;
        mine.forEach(function (l) { sum += l.v[v]; if (!l.li.classList.contains('is-off')) any = true; });
        r.classList.toggle('is-off', !any); r.lastElementChild.textContent = sum ? inr(sum) : ''; });
      var max = 0, del = wf.map(function (w) { var x = 0; lines.forEach(function (l) { if (l.room && l.room.dataset.room === w.dataset.room) x += l.v[v] - l.v[0]; }); max = Math.max(max, Math.abs(x)); return x; });
      lines.forEach(function (l) { var x = 0; }); max = Math.max(max, 144000);
      wf.forEach(function (w, i) { var x = del[i], u = w.querySelector('u'), pc = Math.abs(x) / max * 50;
        w.classList.toggle('neg', x < 0); w.classList.toggle('zero', !x);
        u.style.width = pc.toFixed(1) + '%'; u.style.left = (x < 0 ? 50 - pc : 50).toFixed(1) + '%';
        w.lastElementChild.textContent = x ? (x < 0 ? '−' : '+') + inr(Math.abs(x)) : 'no change'; });
      var dd = toTot - lines.reduce(function (x, l) { return x + l.v[0]; }, 0);
      d.textContent = dd ? inr(Math.abs(dd)) + (dd < 0 ? ' less than v1' : ' more than v1') : 'As first sent'; d.classList.toggle('same', !dd);
      tabs.forEach(function (t, i) { t.setAttribute('aria-pressed', String(i === v)); }); range.value = v; range.setAttribute('aria-valuetext', LAB[v]);
      cancelAnimationFrame(raf);
      var t0 = performance.now(), D = anim && !RM ? 520 : 0;
      (function step(now) { var k = D ? Math.min(1, (now - t0) / D) : 1, e = 1 - Math.pow(1 - k, 3);
        lines.forEach(function (l, i) { if (l.li.classList.contains('is-cut') || !to[i]) return; l.shown = from[i] + (to[i] - from[i]) * e; l.a.textContent = inr(l.shown); });
        shownTot = fromTot + (toTot - fromTot) * e; tot.textContent = inr(shownTot);
        if (k < 1) raf = requestAnimationFrame(step); })(t0);
    }
    lines.forEach(function (l) { l.shown = l.v[2]; }); shownTot = lines.reduce(function (x, l) { return x + l.v[2]; }, 0);
    setV(2, false);
    range.addEventListener('input', function () { setV(+range.value, true); });
    tabs.forEach(function (t, i) { t.addEventListener('click', function () { setV(i, true); }); });
    // the first time it comes into view it plays itself once, v1 to v3, so nobody has to guess that it moves
    if (!RM && 'IntersectionObserver' in window) new IntersectionObserver(function (en, io) { if (!en[0].isIntersecting) return; io.disconnect();
      setV(0, false); setTimeout(function () { setV(1, true); }, 700); setTimeout(function () { setV(2, true); }, 1700); }, { threshold: 0.45 }).observe(box);
  })();

  if (RM) return;   // static, fully readable version
  // GSAP arrives after the first paint, so the hero (text and screenshot) is never held back by animation code
  function load(src, cb) { var el = document.createElement('script'); el.src = src; el.onload = cb; document.head.appendChild(el); }
  function start() { load('../assets/vendor/gsap.min.js', function () { load('../assets/vendor/ScrollTrigger.min.js', boot); }); }
  if (document.readyState === 'complete') setTimeout(start, 0); else window.addEventListener('load', function () { setTimeout(start, 0); });

  function boot() {
  var G = window.gsap, ST = window.ScrollTrigger;
  if (!G || !ST) return;
  G.registerPlugin(ST);
  html.classList.add('motion');

  /* the story: one photograph per stage, and the same seven BOQ lines going from pencil to priced, awarded, built,
     checked and paid. The page ships the finished state; with motion on, the scroll starts it again from the bare flat. */
  var steps = $$('.step'), rail = $('#rail'), cap = $('#stageCap');
  var IM = {}; $$('.rp').forEach(function (im) { IM[im.dataset.k] = im; });
  var L = $$('#bq li').map(function (li) { return { li: li, a: +li.dataset.a, amt: $('.amt', li), bar: $('.bar i', li), tk: $('.tk', li), o: { v: 0 } }; });
  var SUB = L.reduce(function (x, l) { return x + l.a; }, 0), GST = Math.round(SUB * 0.18), TOT = SUB + GST;
  var eSub = $('#slipSub'), eGst = $('#slipGst'), eTot = $('#slipTot'), ePay = $('#slipPay'), ePayN = $('#slipPayN'), eId = $('#slipId'), eS = $('#slipS'), eStage = $('#rpStage'), eCap = $('#rpCap');
  var CAPS = ['01 · Enquiry', '02 · Design', '03 · Approvals', '04 · Bids', '05 · Build', '06 · Handover', '07 · Paid'];
  var IDS = ['LD-0231', 'DB-014', 'Q-1057 v3', 'VB-2026-021', 'MR-P-26-021', 'Handover', '4 invoices'];
  var STAT = ['New lead · first call due in 30 minutes', 'Design board v1 · two comments from the client', 'Signed on a phone · margin 27.8%', 'Carpentry awarded · ₹1.2 L under budget',
    'On site · a log every evening', '18 of 18 snags closed · warranties start today', 'Paid in full · UTR and TDS recorded'];
  var LINES = ['The flat as it is, before anyone draws a line.', 'The master bedroom, rendered. The client pins two comments.', 'Version three, approved room by room and signed on a phone.',
    'Carpentry goes to three vendors. The best rate is awarded.', '', 'Handover. The lights are on and the checklist is finished.', 'Four invoices, and the balance is zero.'];
  var BUILD = [['Day 9. Conduits and boxes go in.', 1], ['Day 23. The ceiling frame is up.', 2], ['Day 41. Joinery is cut and fitted on site.', 3], ['Day 58. Putty, primer and two coats.', 5]];
  var path = $('#sigPath'), len = path.getTotalLength();
  var sub = { v: 0 }, pay = { v: 0 }, cur = -1, bcur = -1;
  function paintMoney() { L.forEach(function (l) { l.amt.textContent = l.o.v > 0 ? money.format(Math.round(l.o.v)) : 'to price'; });
    var k = sub.v; eSub.textContent = k > 0 ? money.format(Math.round(SUB * k)) : '—'; eGst.textContent = k > 0 ? money.format(Math.round(GST * k)) : '—'; eTot.textContent = k > 0 ? money.format(Math.round(TOT * k)) : '—'; }
  function paintPay() { ePayN.textContent = money.format(Math.round(pay.v)); }
  function setStep(i) {
    if (i === cur) return; cur = i;
    steps.forEach(function (s, j) { s.classList.toggle('is-on', j === i); });
    cap.textContent = CAPS[i]; eStage.textContent = CAPS[i]; eId.textContent = IDS[i]; eS.textContent = STAT[i];
    if (i !== 4) { eCap.textContent = LINES[i]; bcur = -1; }
    L.forEach(function (l, k) { l.li.classList.toggle('is-pencil', i < 2); l.li.classList.toggle('is-now', i === 3 && k === 3); });
  }
  function setBuild(b) { if (cur !== 4 || b === bcur) return; bcur = b; eCap.textContent = BUILD[b][0]; L.forEach(function (l, k) { l.li.classList.toggle('is-now', k === BUILD[b][1]); }); }

  // the start: a bare flat, an empty quote
  G.set(Object.keys(IM).map(function (k) { return IM[k]; }), { autoAlpha: 0 }); G.set(IM.shell, { autoAlpha: 1 });
  G.set(L.map(function (l) { return l.li; }), { autoAlpha: 0, x: -10 });
  G.set(L.map(function (l) { return l.bar; }), { scaleX: 0 }); G.set(L.map(function (l) { return l.tk; }), { autoAlpha: 0, scale: 0 });
  G.set(path, { strokeDasharray: len, strokeDashoffset: len }); G.set('.rp-sig', { autoAlpha: 1 });
  G.set('#paidStamp, #stamp, .rp-pin, .rp-note', { autoAlpha: 0 }); G.set(ePay, { scaleX: 0 });
  G.set('#bqEmpty', { autoAlpha: 1, display: 'block' });
  paintMoney(); paintPay();

  var tl = G.timeline({ defaults: { ease: 'power2.out' } });
  function photo(a, b, at) { tl.to(IM[b], { autoAlpha: 1, duration: .16, ease: 'none' }, at).set(IM[a], { autoAlpha: 0 }, at + .16); }
  // 1 · design: the render, the client's pins, and the lines appear in pencil
  photo('shell', 'render', 1);
  tl.to('#bqEmpty', { autoAlpha: 0, duration: .1 }, 1.08).set('#bqEmpty', { display: 'none' }, 1.18);
  tl.to(L.map(function (l) { return l.li; }), { autoAlpha: 1, x: 0, duration: .12, stagger: .06 }, 1.2)
    .fromTo('.rp-pin', { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: .14, stagger: .12, ease: 'back.out(3)' }, 1.35)
    .fromTo('.rp-note', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: .14 }, 1.6);
  // 2 · approvals: every line is priced, the total rolls up, the client signs
  tl.to('.rp-pin, .rp-note', { autoAlpha: 0, duration: .12 }, 2);
  L.forEach(function (l, k) { tl.to(l.o, { v: l.a, duration: .3, ease: 'power1.out', onUpdate: paintMoney }, 2.08 + k * .05); });
  tl.to(sub, { v: 1, duration: .5, ease: 'none', onUpdate: paintMoney }, 2.1)
    .to(path, { strokeDashoffset: 0, duration: .32, ease: 'none' }, 2.6)
    .fromTo('#stamp', { autoAlpha: 0, scale: 2.2, rotate: -20 }, { autoAlpha: 1, scale: 1, rotate: -6, duration: .16, ease: 'back.out(2)' }, 2.88);
  // 3 · bids
  tl.to('.rp-sig, #stamp', { autoAlpha: 0, duration: .12 }, 3.05);
  photo('render', 'mark', 3.05);
  // 4 · build: a photograph for each line as it is built
  photo('mark', 'elec', 4.1);
  tl.to(L[0].bar, { scaleX: 1, duration: .14, ease: 'none' }, 4.12).to(L[1].bar, { scaleX: 1, duration: .24, ease: 'none' }, 4.2);
  photo('elec', 'frame', 4.42);
  tl.to(L[2].bar, { scaleX: 1, duration: .24, ease: 'none' }, 4.46);
  photo('frame', 'join', 4.74);
  tl.to([L[3].bar, L[4].bar], { scaleX: 1, duration: .26, ease: 'none', stagger: .04 }, 4.78);
  photo('join', 'paint', 5.06);
  tl.to(L[5].bar, { scaleX: 1, duration: .2, ease: 'none' }, 5.1);
  // 5 · handover: the finished room, every line ticked
  photo('paint', 'done', 5.4);
  tl.to(L[6].bar, { scaleX: 1, duration: .16, ease: 'none' }, 5.5)
    .to(L.map(function (l) { return l.tk; }), { autoAlpha: 1, scale: 1, duration: .1, stagger: .06, ease: 'back.out(3)' }, 5.62);
  // 6 · paid
  tl.to(ePay, { scaleX: 1, duration: .5, ease: 'none' }, 6.45)
    .to(pay, { v: TOT, duration: .5, ease: 'none', onUpdate: paintPay }, 6.45)
    .fromTo('#paidStamp', { autoAlpha: 0, scale: 2.2, rotate: -16 }, { autoAlpha: 1, scale: 1, rotate: -5, duration: .18, ease: 'back.out(2)' }, 6.95)
    .to({}, { duration: .4 });
  var CUT = [1, 2, 3.05, 4.1, 5.4, 6.4], BCUT = [4.42, 4.74, 5.06];

  ST.create({
    trigger: '.story', start: 'top top', end: function () { return '+=' + Math.round(innerHeight * 6.4); },
    pin: '.story-pin', scrub: .6, animation: tl, invalidateOnRefresh: true, anticipatePin: 1,
    onUpdate: function (self) {
      var t = self.progress * tl.duration(), i = 0, b = 0; while (i < CUT.length && t >= CUT[i]) i++;
      setStep(i); if (i === 4) { while (b < BCUT.length && t >= BCUT[b]) b++; setBuild(b); }
      if (rail) rail.style.height = (self.progress * 100) + '%';
    }
  });
  setStep(0);

  /* light reveals elsewhere */
  $$('.vs, .b, .role-panel, .phones .phone, .craft-grid > div, .facts p, .crm-grid figure').forEach(function (el) {
    G.from(el, { opacity: 0, y: 28, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  G.from('.board span', { yPercent: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: '.board', start: 'top 96%', once: true } });
  }
})();
