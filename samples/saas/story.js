/* Orbit Assistants: three section modules in one file (styles in story.css).
   OrbitSections.story     03 The night shift     placeholder: <section id="story"   data-module="story">
   OrbitSections.split     06 Without vs with     placeholder: <section id="without" data-module="split">
   OrbitSections.estimate  06 Savings estimator   placeholder: <section id="estimate" data-module="estimate">
   Prefixes: .stv- (story)  .spl- (split)  .est- (estimator).  All figures are demo or estimates. */
(function () {
  'use strict';
  var OS = window.OrbitSections = window.OrbitSections || {};
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function brands(ctx) { return (ctx && ctx.Brands) || window.OrbitBrands || { byId: {}, order: [] }; }
  function fmtInt(n) { return Math.round(n).toLocaleString('en-US'); }

  /* =====================================================================================
     STORY: "11:42 pm to 9:05 am"
     Pinned and scrubbed on desktop (>= 1100px, motion allowed). Stacked sequence otherwise.
     ===================================================================================== */
  var PIN_MQ = '(min-width: 1100px)';
  var I = {
    ticks: '<svg class="stv-tk" viewBox="0 0 18 11" aria-hidden="true"><path d="M1 6l3 3 6-8M7 8l1.2 1.2L15 1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ok: '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    wa: '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M4 20l1.3-4A8.2 8.2 0 1 1 8 18.7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9.5 9c.2 2.5 2.2 4.6 5 5.2l1-1.3-1.8-1-.8.7a4 4 0 0 1-1.8-1.8l.7-.8-1-1.8z" fill="currentColor"/></svg>',
    orb: '<svg viewBox="0 0 22 22" width="13" height="13" aria-hidden="true"><circle cx="11" cy="11" r="8.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.2" cy="5.6" r="2.6" fill="currentColor"/></svg>'
  };
  var CAPS = [
    { time: '11:42 pm', k: 'Message', t: 'Priya writes on WhatsApp.' },
    { time: '11:42 pm', k: 'Reply', t: 'Answered in the same minute.' },
    { time: '11:43 pm', k: 'Booked', t: 'Saturday, 11 am. Booked.' },
    { time: '11:44 pm', k: 'In the CRM', t: 'Waiting in the CRM, marked hot.' },
    { time: '9:05 am', k: 'Assigned', t: 'Ranked first. Handed to Kiran.' }
  ];
  var LABELS = ['Message', 'Reply', 'Booked', 'In the CRM', 'Assigned'];
  var HEAD = '11:42 pm. By 9:05 am: <em>a booked visit.</em>';

  function fmtClock(m) {
    var tot = (23 * 60 + 42 + Math.round(m)) % 1440, h = Math.floor(tot / 60), mi = tot % 60;
    return { t: ((h % 12) || 12) + ':' + (mi < 10 ? '0' : '') + mi, ap: h >= 12 ? 'pm' : 'am' };
  }

  /* ---- UI fragments (real HTML, shared by the pinned stage and the stacked sequence) ---- */
  function av(t) { return '<span class="stv-av" aria-hidden="true">' + esc(t) + '</span>'; }
  function bub(who, inner, time) {
    return '<div class="stv-b stv-b--' + who + '">' + inner + '<span class="stv-meta"><time>' + time + '</time>' + (who === 'me' ? I.ticks : '') + '</span></div>';
  }
  function listing(src) {
    return '<div class="stv-lst"><span class="stv-lst-i"><img src="' + esc(src) + '" alt="Living room of Lakeview Court, a furnished 3 BHK" loading="lazy" decoding="async"></span>' +
      '<span class="stv-lst-t"><b>Lakeview Court</b><span class="stv-ns">3 BHK · furnished</span><strong>₹1.35 L <small>a month</small></strong></span></div>';
  }
  function booking() {
    return '<div class="stv-bk"><div class="stv-bk-h">' + I.ok + 'Visit booked</div><div class="stv-bk-d"><b>Saturday</b><span>11:00 am</span></div>' +
      '<div class="stv-bk-f"><span>Lakeview Court</span><span>Ref AV-4821 (demo)</span></div></div>';
  }
  function waHead() {
    return '<div class="stv-wa-h">' + av('AH') + '<span class="stv-wa-n"><b>Alderway Homes</b><small><i class="stv-on"></i>online</small></span><span class="stv-wa-c">' + I.wa + 'WhatsApp</span></div>';
  }
  function crmRow(o) {
    return '<div class="stv-row' + (o.cls ? ' ' + o.cls : '') + '">' +
      (o.hot ? '<span class="stv-hot"><span class="stv-sr">Hot lead</span></span>' : '<span class="stv-cold" aria-hidden="true"></span>') +
      '<span class="stv-row-m"><b>' + o.name + '</b><span class="stv-need">' + o.need + '</span><span class="stv-row-c"><span class="stv-src' + (o.wa ? ' stv-src--wa' : '') + '">' + (o.wa ? I.wa : '') + o.src + '</span><span class="stv-stg' + (o.hot ? ' stv-stg--hot' : '') + '">' + o.stage + '</span></span></span>' +
      '<span class="stv-row-r"><time>' + o.time + '</time>' + o.own + '</span></div>';
  }
  function crm(pin) {
    var own = pin ? '<span class="stv-own"><span class="stv-own-a">Unassigned</span><span class="stv-own-b">Kiran</span></span>' : '<span class="stv-own"><span class="stv-own-a">Unassigned</span></span>';
    var first = crmRow({ cls: 'stv-row--new', hot: true, name: 'Priya Nair', need: '3 BHK, Indiranagar', wa: true, src: 'WhatsApp', stage: 'Visit booked', time: '11:44 pm', own: own });
    return '<div class="stv-crm-h"><b>Leads</b><span class="stv-crm-n">Today</span></div>' +
      (pin ? '<div class="stv-slot">' + first + '</div>' : first) +
      crmRow({ name: 'Rohan Mehta', need: 'Plot, Whitefield', src: 'Web chat', stage: 'Qualified', time: 'Tue', own: '<span class="stv-own">Meera</span>' }) +
      crmRow({ name: 'Sana Qureshi', need: '2 BHK, HSR', src: 'Instagram', stage: 'New', time: 'Mon', own: '<span class="stv-own">Meera</span>' });
  }
  function rank() {
    return '<div class="stv-rk-h"><span class="stv-rk-b">' + I.orb + 'CRM assistant</span><time>9:05 am</time></div>' +
      '<p class="stv-rk-q">Who should I call first?</p>' +
      '<ol class="stv-rk-l">' +
      '<li><b class="stv-rk-1">1</b><span><strong>Priya Nair</strong><span>Visit booked, Saturday 11 am</span></span></li>' +
      '<li><b>2</b><span><strong>Rohan Mehta</strong><span>Asked for a callback</span></span></li>' +
      '<li><b>3</b><span><strong>Sana Qureshi</strong><span>Still browsing</span></span></li></ol>';
  }
  function toast() { return av('K') + '<span class="stv-toast-t"><b>Assigned to Kiran</b><span class="stv-sr"> · </span><span class="stv-toast-s">Indiranagar specialist</span></span>' + I.ok; }

  function stageHTML(src) {
    var caps = CAPS.map(function (c, i) { return '<div class="stv-cap" data-i="' + i + '"><span class="stv-cap-t">' + c.time + ' <i>·</i> ' + c.k + '</span><p>' + c.t + '</p></div>'; }).join('');
    var ticks = LABELS.map(function (l, i) { return '<li style="top:' + (i * 25) + '%"><i class="stv-dot"></i><span>' + l + '</span></li>'; }).join('');
    return '<div class="stv-stage stv-pal"><div class="stv-bg" aria-hidden="true"><i class="stv-hz"></i></div>' +
      '<div class="stv-grid"><div class="stv-l">' +
      '<p class="stv-lab"><span>03</span> The night shift <i>·</i> demo</p>' +
      '<div class="stv-clock" aria-hidden="true"><span class="stv-ck">11:42</span><span class="stv-ap">pm</span></div>' +
      '<h2 class="stv-h">' + HEAD + '</h2><div class="stv-caps" aria-live="off">' + caps + '</div></div>' +
      '<div class="stv-cast" role="group" aria-label="One enquiry, from the customer\'s phone to the team\'s CRM (demo)">' +
      '<i class="stv-gl stv-gl--wa" aria-hidden="true"></i><i class="stv-gl stv-gl--crm" aria-hidden="true"></i><i class="stv-gl stv-gl--rk" aria-hidden="true"></i>' +
      '<div class="stv-wa">' + waHead() + '<div class="stv-wa-b">' +
      bub('me', '<p>3 BHK in Indiranagar under 1.5 lakh a month</p>', '11:42 pm') +
      bub('bot', '<p>Two homes fit. Lakeview Court, ₹1.35 L a month.</p>' + listing(src), '11:42 pm') +
      bub('me', '<p>Can I see one on Saturday?</p>', '11:43 pm') +
      bub('bot', '<p>Saturday 11 am is free. Booked for you.</p>' + booking(), '11:43 pm') +
      '</div></div>' +
      '<div class="stv-crm">' + crm(true) + '</div>' +
      '<div class="stv-rk">' + rank() + '</div>' +
      '<div class="stv-toast">' + toast() + '</div></div>' +
      '<div class="stv-rail" aria-hidden="true"><div class="stv-ghost"><i class="stv-gln"></i><i class="stv-gdot"></i><span class="stv-glab">Without an assistant · first reply 6 h (demo)</span></div>' +
      '<div class="stv-main"><i class="stv-ln"></i><i class="stv-fill"></i><ol>' + ticks + '</ol></div></div>' +
      '</div></div>';
  }

  function flatHTML(src) {
    var nav = LABELS.map(function (l, i) { return '<li><a href="#stv-s' + (i + 1) + '"><i class="stv-dot"></i><span>' + l + '</span></a></li>'; }).join('');
    var steps = [
      '<div class="stv-wa stv-wa--lone">' + waHead() + '<div class="stv-wa-b">' + bub('me', '<p>3 BHK in Indiranagar under 1.5 lakh a month</p>', '11:42 pm') + '</div></div>',
      '<div class="stv-wa stv-wa--lone"><div class="stv-wa-b">' + bub('bot', '<p>Two homes fit. Lakeview Court, ₹1.35 L a month.</p>' + listing(src), '11:42 pm') + '</div></div>',
      '<div class="stv-wa stv-wa--lone"><div class="stv-wa-b">' + bub('me', '<p>Can I see one on Saturday?</p>', '11:43 pm') + bub('bot', '<p>Saturday 11 am is free. Booked for you.</p>' + booking(), '11:43 pm') + '</div></div>',
      '<div class="stv-crm">' + crm(false) + '</div>',
      '<div class="stv-rk">' + rank() + '</div><div class="stv-toast">' + toast() + '</div>'
    ];
    var li = CAPS.map(function (c, i) {
      return '<li class="stv-st" id="stv-s' + (i + 1) + '"><div class="stv-st-hd"><time>' + c.time + '</time><span class="stv-st-k">' + c.k + '</span></div><p class="stv-st-p">' + c.t + '</p><div class="stv-st-bd">' + steps[i] + '</div></li>';
    }).join('');
    return '<div class="stv-flat"><div class="stv-fw"><div class="stv-fl stv-pal"><div class="stv-fi">' +
      '<p class="stv-lab"><span>03</span> The night shift <i>·</i> demo</p>' +
      '<p class="stv-fclock" aria-hidden="true"><span>11:42 pm</span><span><i>→</i> 9:05 am</span></p><p class="stv-sr">11:42 pm to 9:05 am</p>' +
      '<h2 class="stv-h">' + HEAD + '</h2>' +
      '<nav class="stv-hr" aria-label="The five steps of the night"><ol>' + nav + '</ol><i class="stv-hr-ln"></i><i class="stv-hr-f"></i>' +
      '<p class="stv-hr-g"><i></i><span>Without an assistant: first reply 6 h (demo)</span></p></nav>' +
      '</div></div><div class="stv-fr stv-pal"><ol class="stv-steps">' + li + '</ol></div></div></div>';
  }

  function mountStory(el, ctx) {
    var G = ctx.gsap, ST = ctx.ST, B = brands(ctx), r = B.byId.realty || { acc: '#5EEAD4', ink: '#04201B', tx: '#0F766E', soft: '#D9F7F1', photo: 'interior/photos/room-2.jpg' };
    var src = ctx.samples ? ctx.samples(r.photo) : '../' + r.photo;
    el.classList.add('stv');
    el.style.setProperty('--stv-acc', r.acc); el.style.setProperty('--stv-ink', r.ink); el.style.setProperty('--stv-tx', r.tx || '#0F766E'); el.style.setProperty('--stv-soft', r.soft || '#D9F7F1');
    el.innerHTML = stageHTML(src) + flatHTML(src);
    var live = ctx.animated && G && ST && G.context;
    if (!live) { initFlat(el, ctx, false); return; }
    var mode = null, gctx = null, mq = window.matchMedia(PIN_MQ), t = null;
    function apply(first) {
      var want = mq.matches ? 'pin' : 'stack'; if (want === mode) return;
      if (gctx) gctx.revert();
      el.classList.toggle('stv--pin', false); mode = want;
      gctx = G.context(function () {
        if (want === 'pin') { el.classList.add('stv--pin'); buildPin(el, ctx, r); } else initFlat(el, ctx, true);
      }, el);
      if (first !== true) setTimeout(function () { ST.refresh(); }, 30);
    }
    apply(true);
    function later() { clearTimeout(t); t = setTimeout(apply, 120); }
    window.addEventListener('resize', later);
    if (mq.addEventListener) mq.addEventListener('change', later); else if (mq.addListener) mq.addListener(later);
    var done = function () { ST.refresh(); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { requestAnimationFrame(done); });
    $$('img', el).forEach(function (im) { if (!im.complete) im.addEventListener('load', function () { ST.refresh(); }, { once: true }); });
  }

  /* Stacked sequence (mobile, narrow, reduced motion): a night hero, then light steps. */
  function initFlat(el, ctx, animated) {
    var hr = $('.stv-hr', el), dots = $$('.stv-hr li', el), fill = $('.stv-hr-f', el), steps = $$('.stv-st', el);
    if (!animated) { hr.classList.add('is-all'); dots.forEach(function (d) { d.classList.add('is-on'); }); return; }
    hr.classList.toggle('is-all', false); dots.forEach(function (d) { d.classList.toggle('is-on', false); });
    var G = ctx.gsap, ST = ctx.ST;
    function go(k) { dots.forEach(function (d, i) { d.classList.toggle('is-on', i < k); }); G.to(fill, { scaleX: Math.max(0, k - 1) / 4, duration: 1.2, ease: 'power4.out', overwrite: true }); }
    G.set(fill, { scaleX: 0 });
    steps.forEach(function (st, i) {
      G.from(st, { autoAlpha: 0, y: 48, duration: 1.3, ease: 'power4.out', scrollTrigger: { trigger: st, start: 'top 90%', once: true } });
      ST.create({ trigger: st, start: 'top 62%', onEnter: function () { go(i + 1); }, onLeaveBack: function () { go(i); } });
    });
  }

  /* Pinned, scrubbed night: dark at 11:42 pm, the page's light background at 9:05 am. */
  function buildPin(el, ctx, r) {
    var G = ctx.gsap;
    var stage = $('.stv-stage', el), cast = $('.stv-cast', stage);
    var hdEl = document.querySelector('.hd'), hd = hdEl ? Math.round(hdEl.getBoundingClientRect().height) : 0;
    el.style.setProperty('--stv-hd', hd + 'px');
    var ck = $('.stv-ck', stage), ap = $('.stv-ap', stage), clockEl = $('.stv-clock', stage);
    var bs = $$('.stv-wa-b > .stv-b', stage), caps = $$('.stv-cap', stage), ticks = $$('.stv-rail li', stage);
    var wa = $('.stv-wa', stage), crm = $('.stv-crm', stage), slot = $('.stv-slot', stage), row = $('.stv-row--new', stage), rk = $('.stv-rk', stage), toast = $('.stv-toast', stage);
    var rkLis = $$('.stv-rk-l li', stage), ownA = $('.stv-own-a', stage), ownB = $('.stv-own-b', stage);
    var hz = $('.stv-hz', stage), fill = $('.stv-fill', stage);
    var glWa = $('.stv-gl--wa', stage), glCrm = $('.stv-gl--crm', stage), glRk = $('.stv-gl--rk', stage);
    var gdot = $('.stv-gdot', stage), glab = $('.stv-glab', stage);
    var em = function () { return parseFloat(getComputedStyle(cast).fontSize) || 12; };
    var clk = { m: 0 }, last = '';
    function paint() { var f = fmtClock(clk.m), s = f.t + f.ap; if (s !== last) { last = s; ck.textContent = f.t; ap.textContent = f.ap; } }
    paint();
    G.set(stage, { '--d': 0, '--ck': 0 });

    var tl = G.timeline({
      scrollTrigger: {
        trigger: stage, start: 'top top+=' + hd, end: function () { return '+=' + Math.round(window.innerHeight * 4); },
        pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
        onToggle: function (s) { el.classList.toggle('is-live', s.isActive); }
      }
    });
    function pop(node, at, dur) { tl.fromTo(node, { autoAlpha: 0, y: 34, scale: 0.965 }, { autoAlpha: 1, y: 0, scale: 1, duration: dur || 1.1, ease: 'expo.out' }, at); }

    /* captions */
    var CT = [0, 1.45, 3.7, 5.65, 8.5];
    caps.forEach(function (c, i) {
      if (i > 0) tl.fromTo(c, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power4.out' }, CT[i]);
      if (i < caps.length - 1) tl.to(c, { autoAlpha: 0, y: -14, duration: 0.5, ease: 'power2.in' }, CT[i + 1] - 0.55);
    });

    /* the conversation */
    tl.fromTo(wa, { x: function () { return 11.5 * em(); } }, { x: 0, duration: 1.6, ease: 'expo.inOut' }, 5.5);
    pop(bs[0], 0.2, 1.0); pop(bs[1], 1.6, 1.3); pop(bs[2], 3.0, 1.0); pop(bs[3], 4.0, 1.3);
    tl.fromTo($('.stv-lst-i img', stage), { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 1.7);
    tl.fromTo($('.stv-bk', stage), { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'expo.out' }, 4.25);

    /* the clock */
    tl.to(clk, { m: 1, duration: 0.3, ease: 'none', onUpdate: paint }, 2.7)
      .to(clk, { m: 2, duration: 0.4, ease: 'none', onUpdate: paint }, 5.3)
      .to(clk, { m: 563, duration: 2.2, ease: 'none', onUpdate: paint }, 6.2)
      .to(stage, { '--ck': 1, duration: 0.9, ease: 'power2.out' }, 8.2);

    /* night to morning: every colour in the stage follows --d */
    tl.to(stage, { '--d': 1, duration: 3.2, ease: 'power1.inOut' }, 6.0);
    tl.fromTo(hz, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.6, ease: 'none' }, 6.2).to(hz, { autoAlpha: 0, duration: 1.8, ease: 'none' }, 8.2);

    /* the CRM */
    tl.fromTo(crm, { autoAlpha: 0, x: function () { return 5 * em(); } }, { autoAlpha: 1, x: 0, duration: 1.5, ease: 'expo.out' }, 5.8);
    tl.fromTo(slot, { height: 0 }, { height: 'auto', duration: 1.5, ease: 'expo.out' }, 6.7);
    tl.fromTo(row, { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: 1.3, ease: 'expo.out' }, 6.8);

    /* 9:05 am: the team asks who to call first */
    tl.to(wa, { autoAlpha: 0.18, scale: 0.95, duration: 1.4, ease: 'power4.out' }, 8.3);
    tl.fromTo(rk, { autoAlpha: 0, y: 56 }, { autoAlpha: 1, y: 0, duration: 1.5, ease: 'expo.out' }, 8.6);
    tl.fromTo(rkLis, { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: 1.1, ease: 'power4.out', stagger: 0.28 }, 9.0);
    tl.fromTo(toast, { autoAlpha: 0, y: -34, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.3, ease: 'expo.out' }, 9.8);
    tl.to(ownA, { autoAlpha: 0, duration: 0.6, ease: 'power2.out' }, 10.2).fromTo(ownB, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, ease: 'power2.out' }, 10.3);

    /* glows only behind what is live */
    tl.fromTo(glWa, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4, ease: 'power2.out' }, 0.2).to(glWa, { autoAlpha: 0, duration: 1.2, ease: 'power2.inOut' }, 5.2)
      .fromTo(glCrm, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.5, ease: 'power2.out' }, 6.2).to(glCrm, { autoAlpha: 0.3, duration: 1.2, ease: 'power2.inOut' }, 8.6)
      .fromTo(glRk, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.5, ease: 'power2.out' }, 8.8);

    /* the rail: five ticks, a fill, and the ghost track */
    var TT = [0.2, 1.6, 4.0, 5.8, 9.8];
    G.set(fill, { scaleY: 0, transformOrigin: '50% 0%' });
    tl.to(fill, { scaleY: 0.25, duration: 1.4, ease: 'none' }, 0.2).to(fill, { scaleY: 0.5, duration: 2.4, ease: 'none' }, 1.6)
      .to(fill, { scaleY: 0.75, duration: 1.8, ease: 'none' }, 4.0).to(fill, { scaleY: 1, duration: 4.0, ease: 'none' }, 5.8);
    ticks.forEach(function (li, i) {
      G.set(li, { '--on': 0 });
      tl.to(li, { '--on': 1, duration: 0.7, ease: 'power4.out' }, TT[i]);
      tl.to($('.stv-dot', li), { scale: 1.25, duration: 0.7, ease: 'power4.out' }, TT[i]);
    });
    tl.fromTo(glab, { opacity: 0.45 }, { opacity: 1, duration: 1.0, ease: 'power2.out' }, 7.6);
    tl.to({}, { duration: 0.01 }, 11.8);
  }

  OS.story = { mount: mountStory };

  /* =====================================================================================
     SPLIT: one night, two states, a draggable divider
     ===================================================================================== */
  var DAY0 = 18 * 60, DAYSPAN = 17 * 60;           // axis: 6 pm to 11 am
  function xOf(h, m) { return (((h * 60 + m - DAY0) % 1440 + 1440) % 1440) / DAYSPAN * 100; }
  function clock12(h, m) { var ap = h >= 12 ? 'pm' : 'am', hh = (h % 12) || 12; return hh + ':' + (m < 10 ? '0' : '') + m + ' ' + ap; }
  function addMin(h, m, d) { var t = (h * 60 + m + d) % 1440; return [Math.floor(t / 60), t % 60]; }
  var CHANNEL = { whatsapp: 'WhatsApp', instagram: 'Instagram', web: 'Web chat' };
  /* per-business after-hours scenarios (demo): enquiry time, reply, outcome, what goes wrong without, the 9:05 call */
  var DAYS = {
    realty: { t: [23, 42], reply: 'Two homes fit. ₹1.35 L a month.', win: 'Visit booked, Saturday 11 am', cold: 'Asks another agent', late: '11 am slot gone', who: 'Kiran', callW: 'Inbox order, no owner', callV: 'Kiran calls Priya first' },
    support: { t: [22, 20], reply: 'Out for delivery. Link sent.', win: 'Resolved, no agent', cold: 'Starts a dispute', late: 'Refund already asked', who: 'Asha', callW: 'Backlog, oldest first', callV: 'Asha takes the odd ones' },
    build: { t: [21, 50], reply: '₹4.3 to ₹6.4 L before GST', win: 'Site visit booked', cold: 'Asks two other firms', late: 'Two quotes already in', who: 'Dev', callW: 'Calls with no brief', callV: 'Dev calls with the brief' },
    clinic: { t: [22, 35], reply: 'Dr Iyer has 6:30 pm', win: 'Slot booked, reminder set', cold: 'Books another clinic', late: 'Slot filled elsewhere', who: 'Meera', callW: 'A dozen unread messages', callV: 'Meera sees a booked day' },
    salon: { t: [23, 5], reply: 'Friday 4:30 pm is free', win: 'Moved to Friday 4:30', cold: 'Cancels instead', late: 'Friday slot gone', who: 'Anika', callW: 'Diary untangled by hand', callV: 'Diary already updated' },
    dining: { t: [23, 10], reply: 'Saturday 8 pm works for 6', win: 'Table held', cold: 'Books next door', late: 'Saturday is full', who: 'Rahul', callW: 'Host calls back, hoping', callV: 'Rahul confirms the table' }
  };
  var RULER = [[18, '6 pm'], [21, '9 pm'], [24, '12 am'], [27, '3 am'], [30, '6 am'], [33, '9 am'], [35, '11 am']];

  function evHTML(e) {
    var right = e.x > 58;
    return '<li class="spl-ev spl-ev--' + e.dir + (right ? ' spl-ev--r' : '') + (e.cls ? ' ' + e.cls : '') + '" style="--x:' + e.x.toFixed(2) + '%;--n:' + e.n + '">' +
      '<span class="spl-ev-p"></span><span class="spl-ev-m" aria-hidden="true"></span>' +
      '<span class="spl-ev-t"><span class="spl-ev-h"><time>' + e.time + '</time><b>' + e.title + '</b></span><span class="spl-ev-s">' + e.sub + '</span></span></li>';
  }
  function layerHTML(kind, d, m) {
    var wo = kind === 'wo', t = d.t, late = addMin(t[0], t[1], 360), nudge = addMin(t[0], t[1], 70);
    var enq = { x: xOf(t[0], t[1]), dir: 'up', n: 1, time: clock12(t[0], t[1]), title: 'Enquiry', sub: '“' + esc(m.msg) + '”' };
    var call = { x: xOf(9, 5), dir: 'up', n: 2, time: '9:05 am', title: 'Call', sub: esc(wo ? d.callW : d.callV), cls: 'spl-ev--call' };
    var evs;
    if (wo) {
      evs = [enq,
        { x: xOf(nudge[0], nudge[1]), dir: 'dn', n: 1, time: clock12(nudge[0], nudge[1]), title: 'Nobody answers', sub: esc(d.cold), cls: 'spl-ev--bad' },
        { x: xOf(late[0], late[1]), dir: 'dn', n: 2, time: '6 h later', title: 'First reply (demo)', sub: esc(d.late) }, call];
    } else {
      evs = [enq,
        { x: xOf(t[0], t[1]), dir: 'dn', n: 1, time: clock12(t[0], t[1]), title: 'Instant reply', sub: esc(d.reply) },
        { x: xOf(addMin(t[0], t[1], 1)[0], addMin(t[0], t[1], 1)[1]) + 0.01, dir: 'dn', n: 2, time: clock12.apply(null, addMin(t[0], t[1], 1)), title: 'Booked', sub: esc(d.win) }, call];
    }
    var x0 = enq.x, x1 = wo ? xOf(late[0], late[1]) : call.x;
    var grid = RULER.map(function (r) { return '<i class="spl-gr" style="left:' + ((r[0] - 18) / 17 * 100).toFixed(2) + '%"></i>'; }).join('');
    var rul = RULER.map(function (r, i) { return '<span class="spl-rt' + (i === RULER.length - 1 ? ' spl-rt--end' : '') + '" style="left:' + ((r[0] - 18) / 17 * 100).toFixed(2) + '%">' + r[1] + '</span>'; }).join('');
    return '<div class="spl-sum"><p class="spl-tag">' + (wo ? 'Without Orbit' : 'With Orbit') + '</p>' +
      '<p class="spl-stat">' + (wo ? '6 h' : 'Instant') + '</p><p class="spl-cap">first reply · demo</p></div>' +
      '<div class="spl-ax"><i class="spl-band" aria-hidden="true"><span>Team offline</span></i>' + grid +
      '<i class="spl-axl" aria-hidden="true"></i>' +
      (wo ? '<i class="spl-sil" aria-hidden="true" style="left:' + x0.toFixed(2) + '%;width:' + (x1 - x0).toFixed(2) + '%"></i>' : '<i class="spl-run" aria-hidden="true" style="left:' + x0.toFixed(2) + '%;width:' + (x1 - x0).toFixed(2) + '%"></i><i class="spl-dot" aria-hidden="true"></i>') +
      '<ol class="spl-evs">' + evs.map(evHTML).join('') + '</ol></div>' +
      '<div class="spl-rul" aria-hidden="true">' + rul + '</div>';
  }

  function mountSplit(el, ctx) {
    var G = ctx.gsap, ST = ctx.ST, B = brands(ctx), animated = !!ctx.animated && !!G;
    var ids = (B.order && B.order.length) ? B.order : ['realty', 'support', 'build', 'clinic', 'salon', 'dining'];
    var cur = (B.current && B.current()) || 'realty'; if (!DAYS[cur]) cur = 'realty';
    el.classList.add('spl');
    var chips = ids.map(function (id) {
      var b = B.byId[id]; if (!b) return '';
      return '<button type="button" class="spl-chip" data-id="' + id + '" aria-pressed="false" style="--c:' + b.acc + ';--ci:' + b.ink + '"><i aria-hidden="true">' + esc(b.mark) + '</i>' + esc(b.short) + '</button>';
    }).join('');
    el.innerHTML = '<div class="spl-wrap"><div class="spl-head"><div><p class="spl-lab"><span>07</span> Without vs with <i>·</i> demo</p>' +
      '<h2 class="spl-h">Same night. <em>Two mornings.</em></h2></div>' +
      '<div class="spl-pick"><div class="spl-chips" role="group" aria-label="Pick a business">' + chips + '</div>' +
      '<div class="spl-enq" aria-live="polite"><p class="spl-enq-m"></p><p class="spl-enq-q"></p></div></div></div>' +
      '<div class="spl-stage" data-pos="50"><section class="spl-ly spl-ly--wo" aria-label="Without Orbit"></section><section class="spl-ly spl-ly--wi" aria-label="With Orbit"></section>' +
      '<button type="button" class="spl-hd" role="slider" aria-orientation="horizontal" aria-label="Compare without and with Orbit" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"><span class="spl-hd-k" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="spl-hd-h" aria-hidden="true">Drag</span></button></div>' +
      '<div class="spl-foot"><a class="spl-cta" href="../../index.html#contact" data-magnetic>I’ll build this for your business <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></a></div></div>';
    var stage = $('.spl-stage', el), wo = $('.spl-ly--wo', el), wi = $('.spl-ly--wi', el), hd = $('.spl-hd', el);
    var enqM = $('.spl-enq-m', el), enqQ = $('.spl-enq-q', el), chipEls = $$('.spl-chip', el);
    var pos = 50, dotTl = null, inView = false, intro = null, touched = false;

    function setPos(p, quiet) {
      p = Math.max(0, Math.min(100, p)); pos = p;
      stage.style.setProperty('--spl-x', p + '%');
      var w = stage.clientWidth || 1, px = p / 100 * w, kx = px < 24 ? 24 - px : (w - px < 24 ? -(24 - (w - px)) : 0);
      stage.style.setProperty('--spl-kx', kx.toFixed(1) + 'px');
      hd.setAttribute('aria-valuenow', String(Math.round(p)));
      hd.setAttribute('aria-valuetext', Math.round(p) + '% without Orbit, ' + (100 - Math.round(p)) + '% with Orbit');
    }
    function stopIntro() { if (intro) { intro.kill(); intro = null; } }
    function touch() { if (!touched) { touched = true; stage.classList.add('is-touched'); } stopIntro(); }
    function fromX(cx) { var r = stage.getBoundingClientRect(); return (cx - r.left) / r.width * 100; }
    var dragging = false;
    stage.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button > 0) return;
      dragging = true; touch(); stage.classList.add('is-drag');
      try { stage.setPointerCapture(e.pointerId); } catch (x) {}
      setPos(fromX(e.clientX));
    });
    stage.addEventListener('pointermove', function (e) { if (dragging) setPos(fromX(e.clientX)); });
    function end(e) { if (!dragging) return; dragging = false; stage.classList.remove('is-drag'); try { stage.releasePointerCapture(e.pointerId); } catch (x) {} }
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end); stage.addEventListener('lostpointercapture', function () { dragging = false; stage.classList.remove('is-drag'); });
    hd.addEventListener('keydown', function (e) {
      var k = e.key, s = e.shiftKey ? 10 : 2, n = null;
      if (k === 'ArrowLeft' || k === 'ArrowDown') n = pos - s; else if (k === 'ArrowRight' || k === 'ArrowUp') n = pos + s;
      else if (k === 'PageDown') n = pos - 10; else if (k === 'PageUp') n = pos + 10; else if (k === 'Home') n = 0; else if (k === 'End') n = 100;
      if (n == null) return; e.preventDefault(); touch(); setPos(n);
    });
    window.addEventListener('resize', function () { setPos(pos); });

    function render(id, animate) {
      cur = id; var b = B.byId[id], d = DAYS[id], m = b.msgs[0];
      stage.style.setProperty('--spl-acc', b.acc); stage.style.setProperty('--spl-ink', b.ink); stage.style.setProperty('--spl-tx', b.tx || b.acc); stage.style.setProperty('--spl-soft', b.soft || '#EFEBE3'); stage.style.setProperty('--spl-disp', b.display);
      chipEls.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-id') === id)); });
      enqM.textContent = (CHANNEL[m.ch] || 'Chat') + ' · ' + clock12(d.t[0], d.t[1]) + ' · ' + b.name + ' (demo)';
      enqQ.textContent = '“' + m.msg + '”'; enqQ.style.fontFamily = b.display;
      if (dotTl) { dotTl.kill(); dotTl = null; }
      wo.innerHTML = layerHTML('wo', d, m); wi.innerHTML = layerHTML('wi', d, m);
      if (animated) {
        G.killTweensOf($$('.spl-ev,.spl-stat,.spl-cap', stage));
        if (animate) G.from($$('.spl-ev,.spl-stat,.spl-cap', stage), { autoAlpha: 0, y: 14, duration: 1.1, ease: 'power4.out', stagger: 0.05, clearProps: 'opacity,visibility,transform' });
        var dot = $('.spl-dot', wi), x0 = parseFloat($('.spl-run', wi).style.left), x1 = x0 + parseFloat($('.spl-run', wi).style.width);
        dotTl = G.timeline({ repeat: -1, repeatDelay: 1.2, paused: !inView });
        dotTl.fromTo(dot, { left: x0 + '%', autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' })
          .to(dot, { left: x1 + '%', duration: 5.2, ease: 'power2.inOut' }, 0.2).to(dot, { autoAlpha: 0, duration: 0.6 }, '-=0.5');
      }
    }
    chipEls.forEach(function (c) { c.addEventListener('click', function () { var id = c.getAttribute('data-id'); if (id !== cur) render(id, true); }); });
    if (B.on) B.on(function (id) { if (DAYS[id] && id !== cur) render(id, true); });
    setPos(50); render(cur, false);

    if (animated && ST) {
      ST.create({ trigger: stage, start: 'top bottom', end: 'bottom top', onToggle: function (s) { inView = s.isActive; if (dotTl) dotTl.paused(!inView); } });
      var evs0 = function () { return $$('.spl-ev,.spl-stat,.spl-cap', stage); };
      G.set(evs0(), { autoAlpha: 0, y: 16 });
      ST.create({ trigger: stage, start: 'top 72%', once: true, onEnter: function () {
        G.to(evs0(), { autoAlpha: 1, y: 0, duration: 1.4, ease: 'expo.out', stagger: 0.07, clearProps: 'opacity,visibility,transform' });
        var o = { p: 50 }; intro = G.timeline({ delay: 0.9 });
        intro.to(o, { p: 24, duration: 1.5, ease: 'expo.inOut', onUpdate: function () { setPos(o.p); } })
          .to(o, { p: 76, duration: 2.1, ease: 'expo.inOut', onUpdate: function () { setPos(o.p); } })
          .to(o, { p: 50, duration: 1.6, ease: 'expo.inOut', onUpdate: function () { setPos(o.p); } });
      } });
    }
  }
  OS.split = { mount: mountSplit };

  /* =====================================================================================
     ESTIMATE: a labelled savings estimator (hours, after-hours leads, first reply)
     ===================================================================================== */
  var AFTER = 0.28, LEAD = 0.30;
  function fmtH(v) { return v < 10 ? (Math.round(v * 10) / 10).toFixed(1) : fmtInt(v); }
  function mountEstimate(el, ctx) {
    var G = ctx.gsap, ST = ctx.ST, animated = !!ctx.animated && !!G;
    el.classList.add('est');
    function ctl(n, id, label, min, max, step, val, note, unit) {
      return '<div class="est-ctl est-rv"><div class="est-row"><label for="' + id + '"><span class="est-n">' + n + '</span>' + label + '</label><span class="est-v" id="' + id + '-v"></span></div>' +
        '<input class="est-rg" type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '">' +
        '<div class="est-rgs" aria-hidden="true"><span>' + unit[0] + '</span><span>' + unit[1] + '</span></div>' + (note ? '<p class="est-note">' + note + '</p>' : '') + '</div>';
    }
    el.innerHTML = '<div class="est-wrap"><div class="est-top"><p class="est-lab est-rv"><span>07</span> Savings estimator <b>Estimate</b></p>' +
      '<h2 class="est-h est-rv">Hours back, <em>every month.</em></h2></div>' +
      '<div class="est-grid"><div class="est-in est-rv" role="group" aria-label="Your numbers">' +
      ctl('01', 'est-chats', 'Chats a month', 100, 5000, 50, 1200, '', ['100', '5,000']) +
      ctl('02', 'est-mins', 'Minutes per chat', 1, 15, 1, 4, '', ['1 min', '15 min']) +
      ctl('03', 'est-rate', 'Handled without a person', 50, 95, 5, 85, '85% is the share on a live real-estate deployment.', ['50%', '95%']) +
      '</div>' +
      '<div class="est-out">' +
      '<div class="est-hero est-rv"><p class="est-k">Hours saved a month <span>estimate</span></p>' +
      '<p class="est-big" aria-hidden="true"><span class="est-n-h">68</span><span class="est-u">hours</span></p>' +
      '<div class="est-bar" aria-hidden="true"><i class="est-bar-a"></i><i class="est-bar-p"></i></div>' +
      '<div class="est-bar-k" aria-hidden="true"><span><i class="est-sw est-sw--a"></i>Assistant <b class="est-n-ha">68</b> h</span><span><i class="est-sw"></i>A person <b class="est-n-hp">12</b> h</span><span class="est-eq">≈ <b class="est-n-d">8.5</b> working days</span></div></div>' +
      '<div class="est-pair"><div class="est-lead est-rv"><p class="est-k">After-hours leads <span>estimate</span></p>' +
      '<p class="est-mid" aria-hidden="true"><span class="est-n-l">101</span></p>' +
      '<p class="est-note">28% of chats after hours, 30% become leads.</p></div>' +
      '<div class="est-first est-rv"><p class="est-k">First reply <span>demo</span></p>' +
      '<div class="est-fr" aria-hidden="true"><div class="est-fr-r"><b>Instant</b><span class="est-fr-t"><i class="est-fr-a"></i></span></div><div class="est-fr-r est-fr-r--b"><b>~6 h</b><span class="est-fr-t"><i class="est-fr-b"></i></span></div></div></div></div>' +
      '</div></div>' +
      '<details class="est-how est-rv"><summary><span>How this is estimated</span><i aria-hidden="true"></i></summary><ul class="est-fx">' +
      '<li><span>Hours saved</span><code class="est-fx-h"></code></li>' +
      '<li><span>After-hours chats</span><code class="est-fx-a"></code></li>' +
      '<li><span>Leads captured</span><code class="est-fx-l"></code></li>' +
      '<li><span>First reply</span><code>Assistant: seconds. Without: ~6 h, a demo figure.</code></li>' +
      '</ul><p class="est-fine">An estimate, not a quote. The 28% and 30% are assumptions.</p></details>' +
      '<div class="est-cta est-rv"><a class="est-link" href="../../index.html#contact" data-magnetic>Want your real numbers? I’ll scope it with you <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></a></div>' +
      '<p class="est-sr" role="status" aria-live="polite"></p></div>';

    var rg = { c: $('#est-chats', el), m: $('#est-mins', el), r: $('#est-rate', el) };
    var out = { h: $('.est-n-h', el), d: $('.est-n-d', el), ha: $('.est-n-ha', el), hp: $('.est-n-hp', el), l: $('.est-n-l', el) };
    var barA = $('.est-bar-a', el), live = $('.est-sr', el), vC = $('#est-chats-v', el), vM = $('#est-mins-v', el), vR = $('#est-rate-v', el);
    var cur = { h: 0, d: 0, ha: 0, hp: 0, l: 0 }, tgt = { h: 0, d: 0, ha: 0, hp: 0, l: 0 }, shown = false, done = !animated, timer = null;

    function vals() { return { c: +rg.c.value, m: +rg.m.value, r: +rg.r.value / 100 }; }
    function calc(v) { var total = v.c * v.m / 60, h = total * v.r, ac = v.c * AFTER; return { total: total, h: h, hp: total - h, d: h / 8, ac: ac, l: ac * LEAD }; }
    function paint() {
      out.h.textContent = fmtH(cur.h); out.d.textContent = (Math.round(cur.d * 10) / 10).toFixed(1); out.ha.textContent = fmtH(cur.ha); out.hp.textContent = fmtH(cur.hp); out.l.textContent = fmtInt(cur.l);
    }
    function fillSlider(input) { var p = (input.value - input.min) / (input.max - input.min) * 100; input.style.setProperty('--p', p + '%'); }
    function text(v, r) {
      vC.textContent = fmtInt(v.c); vM.textContent = v.m + ' min'; vR.textContent = Math.round(v.r * 100) + '%';
      rg.c.setAttribute('aria-valuetext', fmtInt(v.c) + ' chats a month'); rg.m.setAttribute('aria-valuetext', v.m + (v.m === 1 ? ' minute' : ' minutes') + ' per chat'); rg.r.setAttribute('aria-valuetext', Math.round(v.r * 100) + ' percent handled without a person');
      $('.est-fx-h', el).textContent = fmtInt(v.c) + ' chats × ' + v.m + ' min × ' + Math.round(v.r * 100) + '% ÷ 60 = ' + fmtH(r.h) + ' hours';
      $('.est-fx-a', el).textContent = fmtInt(v.c) + ' chats × 28% (assumed share arriving outside office hours) = ' + fmtInt(r.ac);
      $('.est-fx-l', el).textContent = fmtInt(r.ac) + ' after-hours chats × 30% (assumed share that become leads) = ' + fmtInt(r.l);
      [rg.c, rg.m, rg.r].forEach(fillSlider);
    }
    function update(announce) {
      var v = vals(), r = calc(v); text(v, r);
      tgt = { h: r.h, d: r.d, ha: r.h, hp: r.hp, l: r.l };
      if (done) barA.style.transform = 'scaleX(' + v.r.toFixed(3) + ')';
      if (animated && shown) G.to(cur, { h: tgt.h, d: tgt.d, ha: tgt.ha, hp: tgt.hp, l: tgt.l, duration: 1.1, ease: 'power4.out', overwrite: true, onUpdate: paint });
      else if (!animated) { cur = { h: tgt.h, d: tgt.d, ha: tgt.ha, hp: tgt.hp, l: tgt.l }; paint(); }
      if (announce) {
        clearTimeout(timer);
        timer = setTimeout(function () { live.textContent = 'Estimate: about ' + fmtH(r.h) + ' hours saved each month, and about ' + fmtInt(r.l) + ' leads captured after hours. First reply is instant instead of about 6 hours, a demo figure.'; }, 500);
      }
    }
    [rg.c, rg.m, rg.r].forEach(function (i) { i.addEventListener('input', function () { update(true); }); });
    update(false);

    if (animated && ST) {
      var rvs = $$('.est-rv', el), frB = $('.est-fr-b', el), frA = $('.est-fr-a', el);
      G.set(rvs, { autoAlpha: 0, y: 36 }); G.set(barA, { scaleX: 0 }); G.set([frA, frB], { scaleX: 0 });
      cur = { h: 0, d: 0, ha: 0, hp: 0, l: 0 }; paint();
      ST.create({ trigger: el, start: 'top 68%', once: true, onEnter: function () {
        shown = true;
        var tl = G.timeline();
        tl.to(rvs, { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power4.out', stagger: 0.12, clearProps: 'opacity,visibility,transform' }, 0)
          .to(cur, { h: tgt.h, d: tgt.d, ha: tgt.ha, hp: tgt.hp, l: tgt.l, duration: 1.8, ease: 'power4.out', onUpdate: paint }, 0.25)
          .to(barA, { scaleX: vals().r, duration: 1.6, ease: 'expo.out', onComplete: function () { done = true; barA.style.transform = 'scaleX(' + vals().r.toFixed(3) + ')'; el.classList.add('est-ready'); } }, 0.45)
          .to(frA, { scaleX: 1, duration: 1.2, ease: 'expo.out' }, 0.8).to(frB, { scaleX: 1, duration: 1.8, ease: 'expo.out' }, 0.8);
      } });
    }
  }
  OS.estimate = { mount: mountEstimate };
})();
