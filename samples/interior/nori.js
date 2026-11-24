(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var G = window.gsap, ST = window.ScrollTrigger, M = window.Motion || {}, fx = !!G && !M.reduce;
  var lenis = function () { return window.Motion && window.Motion.lenis; };

  /* header turns solid once the hero is behind us */
  var hdr = $('#hdr'), hero = $('.hero');
  function hd() { hdr.classList.toggle('solid', scrollY > hero.offsetHeight - 120); }
  addEventListener('scroll', hd, { passive: true }); hd();

  /* hero intro: image opens up, headline rises (motion.js splits it), details fade in */
  if (fx) {
    var tl = G.timeline();
    tl.fromTo('.hero-clip', { clipPath: 'inset(16% 12% 16% 12%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 2, ease: 'expo.inOut' }, 0)
      .from('.hero-clip video', { scale: 1.28, duration: 2.6, ease: 'expo.out' }, 0)
      .from('#hdr', { y: -24, autoAlpha: 0, duration: 1.2, ease: 'power3.out' }, 1.5)
      .from('[data-hero]', { y: 18, autoAlpha: 0, duration: 1.2, ease: 'power3.out', stagger: 0.15 }, 1.7);
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(function () { setTimeout(function () { G.set('.hero h1', { opacity: 1 }); late(); }, 30); });
  }
  function late() {
    G.to('.hero-clip video', { yPercent: 9, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    G.to('.hero-in', { yPercent: -10, autoAlpha: 0.2, ease: 'none', scrollTrigger: { trigger: hero, start: '30% top', end: 'bottom top', scrub: true } });

    /* image wipes: a clip rises, the photograph settles from a slight zoom */
    $$('[data-wipe]').forEach(function (el) {
      var m = $('img,video', el);
      G.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 88%' } });
      if (m) G.from(m, { scale: 1.3, duration: 2.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    /* footer wordmark */
    G.from('.mark', { yPercent: 40, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.ft', start: 'top 98%' } });
    ST.sort(); ST.refresh();
  }
  addEventListener('load', function () { if (ST) ST.refresh(); });

  /* 3D room */
  var cv = $('#room3d'), room = null;
  try { room = window.Room3D ? window.Room3D.mount(cv, { base: 'models/', tex: 'tex/', theme: 'japandi', debug: /[?&]debug/.test(location.search), onBusy: function (b) { var st = $('.stage'); if (st) st.classList.toggle('on', !b); } }) : null; } catch (e) { room = null; }
  var stage = $('.stage');
  if (!room) { cv.hidden = true; $('#fb').hidden = false; $('#ld').hidden = true; }
  else if (room.ready) room.ready.then(function () { stage.classList.add('on'); }); else stage.classList.add('on');
  var tour = $('.tour'), stick = $('#stick'), caps = $$('.cap'), fill = $('#railFill'), stepNo = $('#stepNo');
  function onScroll() {
    var r = tour.getBoundingClientRect(), span = tour.offsetHeight - innerHeight, p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    if (room) room.setProgress(p);
    var i = Math.min(caps.length - 1, Math.floor(p * caps.length * 0.999));
    caps.forEach(function (c, k) { c.classList.toggle('on', k === i); }); stepNo.textContent = '0' + (i + 1);
    fill.style.transform = 'scaleX(' + p.toFixed(3) + ')';
  }
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();
  function theme(t) { if (room) room.setTheme(t); $$('[data-theme]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-theme') === t); }); }
  $$('[data-theme]').forEach(function (b) { b.addEventListener('click', function () { theme(b.getAttribute('data-theme')); }); });
  var nb = $('#night');
  nb.addEventListener('click', function () { var on = nb.getAttribute('aria-pressed') !== 'true'; nb.setAttribute('aria-pressed', on); stick.classList.toggle('night', on); if (room) room.setNight(on); });

  /* style quiz: three answers vote for a style; the winner restyles the 3D room */
  var votes = {}, STY = {
    japandi: ['Japandi', 'Calm, natural and quiet: pale oak, linen, soft sage and nothing extra.', ['#D9C8A8', '#EDE6D6', '#9AA58A', '#6B6256']],
    midcentury: ['Mid-century', 'Warm walnut, mustard and teal, with shapes that never date.', ['#6E4A2F', '#C9962B', '#2E6F73', '#EFE3CC']],
    coastal: ['Coastal', 'Light, airy and relaxed: white oak, sand and sea blues.', ['#F4F0E8', '#D8C7A6', '#6E97B0', '#2F5871']],
    moody: ['Moody', 'Deep green walls, rust velvet and brass, made for evenings.', ['#1F3A31', '#8A4B2E', '#B08A3F', '#1A1714']]
  };
  var res = $('#qRes'), go = $('#qGo');
  $$('.q').forEach(function (q) { q.addEventListener('click', function (e) { var b = e.target.closest('.opt'); if (!b) return;
    $$('.opt', q).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    votes[q.getAttribute('data-q')] = b.getAttribute('data-v'); var n = Object.keys(votes).length;
    if (n < 3) { $('#qTitle').textContent = (3 - n) + ' to go'; return; }
    var c = {}; Object.keys(votes).forEach(function (k) { c[votes[k]] = (c[votes[k]] || 0) + 1; });
    var win = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; })[0], S = STY[win];
    $('#qTitle').textContent = S[0]; $('#qDesc').textContent = S[1]; res.classList.add('done');
    $('#qSw').innerHTML = S[2].map(function (h) { return '<i style="background:' + h + '"></i>'; }).join('');
    go.hidden = false; go.setAttribute('data-win', win); theme(win);
    if (fx) G.fromTo('#qTitle', { yPercent: 30, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1, ease: 'expo.out' });
  }); });
  go.addEventListener('click', function () { theme(this.getAttribute('data-win')); var L = lenis(); if (L) L.scrollTo(tour, { offset: -(innerHeight * 0.02), duration: 2 }); else scrollTo({ top: tour.offsetTop, behavior: 'smooth' }); });

  $('#bForm').addEventListener('submit', function (e) { e.preventDefault(); $('#bDone').hidden = false; });

  /* videos load and play only while on screen */
  var vids = $$('video.lazyv'), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = matchMedia('(max-width: 800px), (pointer: coarse)').matches;
  function load(v) { if (!v.getAttribute('src')) v.src = (small && v.getAttribute('data-src-sm')) || v.getAttribute('data-src'); }
  if (!('IntersectionObserver' in window)) { vids.forEach(function (v) { if (!still) { load(v); v.play(); } }); }
  else { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { var v = e.target;
    if (e.isIntersecting) { if (!still) { load(v); var p = v.play(); if (p && p.catch) p.catch(function () {}); } } else v.pause(); }); }, { rootMargin: '200px 0px' });
    vids.forEach(function (v) { io.observe(v); }); }

  /* mobile menu */
  var mb = $('#mbtn'), mn = $('#menu');
  function menu(open) {
    mb.setAttribute('aria-expanded', open); mb.firstChild.textContent = open ? 'Close' : 'Menu'; hdr.classList.toggle('open', open);
    var L = lenis(); if (L) { open ? L.stop() : L.start(); } document.body.style.overflow = open ? 'hidden' : '';
    if (open) { mn.hidden = false; requestAnimationFrame(function () { mn.classList.add('on'); $('a', mn).focus(); }); }
    else { mn.classList.remove('on'); setTimeout(function () { if (!mn.classList.contains('on')) mn.hidden = true; }, 500); }
  }
  mb.addEventListener('click', function () { var o = mb.getAttribute('aria-expanded') !== 'true'; menu(o); if (!o) mb.focus(); });
  mn.addEventListener('click', function (e) { if (e.target.closest('a')) menu(false); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && mb.getAttribute('aria-expanded') === 'true') { menu(false); mb.focus(); } });
  addEventListener('resize', function () { if (innerWidth > 900 && mb.getAttribute('aria-expanded') === 'true') menu(false); });

  /* the hero film starts straight away; the observer above only pauses it once it scrolls off */
  var hv = $('.hero video'); if (hv && !still) { load(hv); var hp = hv.play(); if (hp && hp.catch) hp.catch(function () {}); }

  /* the floating "Portfolio" button would sit on the 3D controls: tuck it away while the room is on screen */
  if ('IntersectionObserver' in window) { new IntersectionObserver(function (es) { var h = $('.to-home'); if (h) { h.style.visibility = es[0].isIntersecting ? 'hidden' : ''; } }, { threshold: 0.35 }).observe(stick); }
})();
