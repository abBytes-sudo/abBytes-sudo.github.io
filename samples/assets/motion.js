/* Shared motion for the sample sites. Load after vendor/gsap.min.js, vendor/ScrollTrigger.min.js, vendor/SplitText.min.js, vendor/lenis.min.js.
   Opt in with attributes; everything is skipped for prefers-reduced-motion (content stays visible).
   data-split            headline: lines rise out of a mask on scroll
   data-reveal           fade + rise (add data-delay="0.1"); data-stagger on a parent staggers its children
   data-clip             image/video wrapper: clip-path wipe in, inner media eases down from 1.15 scale
   data-parallax="0.15"  vertical drift while scrolling (fraction of its height)
   data-pin-scrub        horizontal gallery: the inner [data-track] scrolls sideways while the section is pinned
   data-count="1250"     number counts up once (keeps prefix/suffix via data-prefix / data-suffix)
   data-magnetic         buttons lean toward the pointer
   data-marquee          the first child loops sideways (duplicate content inside for a seamless loop)
   window.Motion.lenis   the Lenis instance (or null) */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = window.gsap, ST = window.ScrollTrigger, SPLIT = window.SplitText;
  var M = window.Motion = { lenis: null, reduce: reduce };
  if (!G || reduce) { document.documentElement.classList.add('motion-off'); return; }
  G.registerPlugin(ST); if (SPLIT) G.registerPlugin(SPLIT);
  document.documentElement.classList.add('motion-on');

  if (window.Lenis && !document.documentElement.hasAttribute('data-no-lenis')) {
    var lenis = M.lenis = new Lenis({ duration: 1.15, smoothWheel: true, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    lenis.on('scroll', ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); }); G.ticker.lagSmoothing(0);
    document.addEventListener('click', function (e) { var a = e.target.closest('a[href^="#"]'); if (!a) return; var id = a.getAttribute('href'); if (id.length < 2) return;
      var el = document.querySelector(id); if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -80 }); } });
  }
  var ease = 'power4.out';
  function q(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }

  function init() {
    if (SPLIT) q('[data-split]').forEach(function (el) {
      var s = new SPLIT(el, { type: 'lines', mask: 'lines', linesClass: 'm-line' });
      G.from(s.lines, { yPercent: 110, duration: 1.1, ease: ease, stagger: 0.09, delay: +el.dataset.delay || 0,
        scrollTrigger: el.hasAttribute('data-now') ? null : { trigger: el, start: 'top 88%' } });
    });
    q('[data-reveal]').forEach(function (el) {
      G.from(el, { y: 40, autoAlpha: 0, duration: 1.1, ease: ease, delay: +el.dataset.delay || 0, scrollTrigger: el.hasAttribute('data-now') ? null : { trigger: el, start: 'top 90%' } });
    });
    q('[data-stagger]').forEach(function (p) {
      G.from(p.children, { y: 50, autoAlpha: 0, duration: 1, ease: ease, stagger: +p.dataset.stagger || 0.08, scrollTrigger: { trigger: p, start: 'top 86%' } });
    });
    q('[data-clip]').forEach(function (el) {
      var media = el.querySelector('img,video,canvas');
      var tl = G.timeline({ scrollTrigger: { trigger: el, start: 'top 85%' } });
      tl.fromTo(el, { clipPath: 'inset(12% 8% 12% 8% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.4, ease: 'expo.out' });
      if (media) tl.from(media, { scale: 1.18, duration: 1.8, ease: 'expo.out' }, 0);
    });
    q('[data-parallax]').forEach(function (el) {
      var k = +el.dataset.parallax || 0.15;
      G.fromTo(el, { yPercent: -k * 50 }, { yPercent: k * 50, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    q('[data-pin-scrub]').forEach(function (sec) {
      var track = sec.querySelector('[data-track]'); if (!track) return;
      var mm = G.matchMedia();
      mm.add('(min-width: 900px)', function () {
        var dist = function () { return Math.max(0, track.scrollWidth - sec.clientWidth); };
        G.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true } });
      });
    });
    q('[data-count]').forEach(function (el) {
      var to = +el.dataset.count, o = { v: 0 }, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '', dec = (String(to).split('.')[1] || '').length;
      G.to(o, { v: to, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 92%' },
        onUpdate: function () { el.textContent = pre + o.v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; } });
    });
    q('[data-marquee]').forEach(function (m) {
      var t = m.firstElementChild; if (!t) return;
      G.to(t, { xPercent: -50, ease: 'none', duration: +m.dataset.marquee || 30, repeat: -1 });
    });
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) q('[data-magnetic]').forEach(function (b) {
      var xTo = G.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), yTo = G.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
      b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.3); yTo((e.clientY - r.top - r.height / 2) * 0.35); });
      b.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
    ST.refresh();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else addEventListener('load', init);
})();
