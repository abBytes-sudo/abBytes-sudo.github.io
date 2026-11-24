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
    { h: 'Ira, the owner', p: 'Approvals, overdue money and project health in one inbox. The only person who can change a rate, and the only one who sees the audit log.', img: 'media/ui-home.jpg', w: 2000, hh: 1208, a: 'index.html?as=owner#/', al: 'Open as Ira', alt: 'Owner home: pipeline, receivables, approvals inbox and live projects' },
    { h: 'Kabir, project manager', p: 'His quotes, his projects, client comments and change orders waiting on a signature. Margin is visible; rates are read-only, with a “suggest a change” button.', img: 'media/ui-quote.jpg', w: 1600, hh: 966, a: 'index.html?as=pm#/quote/q-mehra', al: 'Open as Kabir', alt: 'Quote builder with rooms, line items, version tabs, client comments and the approval policy' },
    { h: 'Rakesh, accounts', p: 'Finance first: what is ready to bill, what came in this month with which UTR, and which client needs a polite reminder today.', img: 'media/ui-accounts.jpg', w: 1600, hh: 966, a: 'index.html?as=accounts#/', al: 'Open as Rakesh', alt: 'Accounts home: outstanding, collected this month, ready to bill and ageing' },
    { h: 'Tanvi, designer', p: 'Her leads in the brief stage, design boards with client comments to answer, renders to version and rooms to send for approval. Quotes yes, money no.', img: 'media/ui-designer.jpg', w: 1600, hh: 966, a: 'index.html?as=design#/', al: 'Open as Tanvi', alt: 'Designer home: leads to call, client comments waiting, and a design-changes card with pinned comments' },
    { h: 'Imran, site engineer', p: 'Three sites, a camera and a bottom bar. Logs, snags and deliveries, with every amount hidden from his view.', img: 'media/ui-site-m.jpg', w: 720, hh: 1502, a: 'index.html?as=site#/site', al: 'Open as Imran', alt: 'Site engineer phone screen with sites and snags', phone: true },
    { h: 'Rohan, the client', p: 'His own portal: progress by milestone, site photos, rooms to approve with comments pinned on the render, payments and signed documents. Nothing internal.', img: 'media/ui-portal-m.jpg', w: 720, hh: 1502, a: 'index.html#/d/dz-iyer', al: 'Open the client link', alt: 'Client portal on a phone: project progress, site photos and design approvals', phone: true }
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

  /* the story */
  var layers = $$('.layer'), steps = $$('.step'), rail = $('#rail'), cap = $('#stageCap'), url = $('#stUrl');
  var URLS = ['studio-os / leads / LD-0231', 'studio-os / design / khurana', 'marlowreed.example / q / mr1057', 'studio-os / bids / VB-2026-021', 'studio-os / projects / MR-P-26-021', 'studio-os / projects / MR-P-26-021 / handover', 'studio-os / receivables'];
  var CAPS = ['01 · Enquiry', '02 · Design', '03 · Approvals', '04 · Bids', '05 · Build', '06 · Handover', '07 · Paid'];
  var path = $('#sigPath'), len = path.getTotalLength();
  G.set(path, { strokeDasharray: len, strokeDashoffset: len });
  var cur = -1;
  function setStep(i) {
    if (i === cur) return; cur = i;
    steps.forEach(function (s, j) { s.classList.toggle('is-on', j === i); });
    cap.textContent = CAPS[i]; url.textContent = URLS[i];
  }
  var paid = { v: 0 }, out = { v: 4508780 }, pB = $('#paidBig'), rN = $('#recvN');
  var tl = G.timeline({ defaults: { ease: 'power2.out' } });
  function swap(a, b, at) {
    tl.to(layers[a], { autoAlpha: 0, y: -14, duration: .22, ease: 'power2.in' }, at)
      .fromTo(layers[b], { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: .28 }, at + .16);
  }
  // 0 · enquiry
  tl.from('.ll-chips span', { autoAlpha: 0, y: 6, duration: .1, stagger: .06 }, .05)
    .from('.ll-step li', { autoAlpha: 0, x: -8, duration: .1, stagger: .06 }, .3)
    .from('.ll-rem, .ll-next', { autoAlpha: 0, y: 10, duration: .16, stagger: .12 }, .6);
  // 1 · design
  swap(0, 1, 1);
  tl.from('.ld-img .pin', { scale: 0, duration: .14, stagger: .12, ease: 'back.out(3)' }, 1.3)
    .from('.pin-note', { autoAlpha: 0, y: 8, duration: .14 }, 1.5)
    .from('.ld-rooms li', { autoAlpha: 0, x: 10, duration: .1, stagger: .06 }, 1.35)
    .from('.ld-sel span', { autoAlpha: 0, duration: .1, stagger: .06 }, 1.7);
  // 2 · approvals and signature
  swap(1, 2, 2);
  tl.from('.ls-pol span', { autoAlpha: 0, scale: .9, duration: .1, stagger: .08 }, 2.3)
    .from('.ls-cm', { autoAlpha: 0, y: 8, duration: .14 }, 2.4)
    .to(path, { strokeDashoffset: 0, duration: .4, ease: 'none' }, 2.5)
    .fromTo('#stamp', { autoAlpha: 0, scale: 2.2, rotate: -20 }, { autoAlpha: 1, scale: 1, rotate: -6, duration: .18, ease: 'back.out(2)' }, 2.85);
  // 3 · bids
  swap(2, 3, 3.05);
  tl.from('.lb-v', { autoAlpha: 0, y: 24, duration: .18, stagger: .08, ease: 'expo.out' }, 3.25)
    .from('.lb-v .aw', { autoAlpha: 0, scale: 2, duration: .14, ease: 'back.out(2)' }, 3.7)
    .from('.lb-po', { autoAlpha: 0, y: 10, duration: .14 }, 3.82);
  // 4 · build
  swap(3, 4, 4.1);
  tl.from('.gm-row .b', { scaleX: 0, duration: .2, stagger: .05, ease: 'expo.out' }, 4.3)
    .from('.gm-row .pd', { scale: 0, duration: .12, stagger: .07 }, 4.6)
    .from('.lp-sched span', { autoAlpha: 0, y: 10, duration: .12, stagger: .06 }, 4.7);
  // 5 · handover: each item ticks in turn
  swap(4, 5, 5.15);
  tl.from('.lh-list .tk', { scale: 0, autoAlpha: 0, duration: .1, stagger: .07, ease: 'back.out(3)' }, 5.4);
  tl.fromTo('#hoBar', { width: '0%' }, { width: '100%', duration: .45, ease: 'none' }, 5.4)
    .from('.lh-war span', { autoAlpha: 0, y: 6, duration: .1, stagger: .05 }, 5.8)
    .fromTo('#hoStamp', { autoAlpha: 0, scale: 2.2, rotate: -20 }, { autoAlpha: 1, scale: 1, rotate: -6, duration: .18, ease: 'back.out(2)' }, 5.95);
  // 6 · paid
  swap(5, 6, 6.2);
  tl.from('.pays li', { autoAlpha: 0, x: 12, duration: .1, stagger: .08 }, 6.4)
    .fromTo(paid, { v: 0 }, { v: 4508780, duration: .5, ease: 'none', onUpdate: function () { pB.textContent = money.format(paid.v); } }, 6.45)
    .fromTo(out, { v: 4508780 }, { v: 0, duration: .5, ease: 'none', onUpdate: function () { rN.textContent = money.format(out.v); } }, 6.45)
    .fromTo('#recvBar', { width: '100%' }, { width: '0%', duration: .5, ease: 'none' }, 6.45)
    .from('.pays li i', { autoAlpha: 0, scale: 2, duration: .1, stagger: .08, ease: 'back.out(2)' }, 6.6)
    .to({}, { duration: .35 });
  var CUT = [1.05, 2.05, 3.1, 4.15, 5.2, 6.25];

  ST.create({
    trigger: '.story', start: 'top top', end: function () { return '+=' + Math.round(innerHeight * 6.2); },
    pin: '.story-pin', scrub: .6, animation: tl, invalidateOnRefresh: true, anticipatePin: 1,
    onUpdate: function (self) {
      var t = self.progress * tl.duration(), i = 0; while (i < CUT.length && t >= CUT[i]) i++;
      setStep(i); if (rail) rail.style.height = (self.progress * 100) + '%';
    }
  });
  setStep(0);

  /* light reveals elsewhere */
  $$('.b, .role-panel, .phones .phone, .craft-grid > div, .facts p, .crm-grid figure').forEach(function (el) {
    G.from(el, { opacity: 0, y: 28, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  G.from('.wordmark', { yPercent: 30, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.wordmark', start: 'top 95%', once: true } });
  }
})();
