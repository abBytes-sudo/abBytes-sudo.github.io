/* Fieldwise product page — hero intro and the pinned day story (the route draws itself as you scroll). */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.querySelector('.nav');
  addEventListener('scroll', function () { nav.classList.toggle('scrolled', scrollY > 10); }, { passive: true });

  /* hero intro */
  if (!reduce && window.gsap) {
    document.documentElement.classList.add('js-motion');
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to('.ln>span', { y: 0, duration: 1.1, stagger: .12 })
      .to('.hero .eyebrow, .hero .lede, .hero .cta, .hero .note', { opacity: 1, y: 0, duration: .8, stagger: .08 }, '-=.75')
      .to('.browser', { opacity: 1, y: 0, rotate: 0, duration: 1.2 }, '-=.9')
      .to('.phone-s', { opacity: 1, y: 0, duration: 1 }, '-=.8');
  }

  /* the day story */
  var story = document.getElementById('story'), stage = story.querySelector('.stage'), steps = story.querySelectorAll('.steps li');
  var clock = document.getElementById('clock'), kick = document.getElementById('stage-k'), route = stage.querySelector('.m-route');
  var cards = { lead: stage.querySelector('.c-lead'), match: stage.querySelector('.c-match'), trip: stage.querySelector('.c-trip'), visit: stage.querySelector('.c-visit'), deal: stage.querySelector('.c-deal') };
  var stops = stage.querySelectorAll('.m-stop');
  // minutes since midnight at each step boundary: 10:02 → 10:31 → 11:15 → 14:30–16:40 → 18:40
  var T = [602, 631, 675, 870, 1000, 1120];
  var KICK = ['New lead · WhatsApp', 'Matching · 6 homes', 'Trip planned · tomorrow', 'Out now · Kabir', 'Deal · token received'];
  function fmt(m) { m = Math.round(m); var h = Math.floor(m / 60), mm = m % 60; return ((h + 11) % 12 + 1) + ':' + (mm < 10 ? '0' : '') + mm + (h < 12 ? ' am' : ' pm'); }
  function set(p) {
    p = Math.max(0, Math.min(1, p));
    var f = p * 5, s = Math.min(4, Math.floor(f)), local = f - s;
    stage.dataset.s = s;
    steps.forEach(function (li, i) { li.classList.toggle('on', i === s); });
    var mins = s === 3 ? 870 + local * 130 : T[s] + (s === 4 ? 0 : (T[s + 1] - T[s]) * Math.max(0, (local - .7) / .3));
    clock.textContent = fmt(s === 4 ? 1120 : mins);
    kick.textContent = KICK[s];
    cards.lead.classList.toggle('on', s === 0);
    cards.match.classList.toggle('on', s === 1);
    cards.trip.classList.toggle('on', s === 2);
    cards.visit.classList.toggle('on', s === 3);
    cards.deal.classList.toggle('on', s === 4);
    var draw = s < 2 ? 0 : s === 2 ? Math.min(1, local * 1.25) : 1;
    if (route) route.style.strokeDashoffset = (1000 * (1 - draw)).toFixed(0);
    var visited = s < 3 ? 0 : s === 3 ? Math.min(3, Math.floor(local * 3.6)) : 3;
    stops.forEach(function (g, i) { g.classList.toggle('done', i < visited); var t = g.querySelector('text'); if (t) t.textContent = i < visited ? '✓' : i + 1; });
  }
  var pinned = function () { return !reduce && innerWidth > 1000; };
  if (!pinned()) { set(1); stage.dataset.s = 'all'; if (route) route.style.strokeDashoffset = 0; return; }
  function onScroll() { var r = story.getBoundingClientRect(), total = r.height - innerHeight; set(-r.top / total); }
  if (window.ScrollTrigger && window.gsap) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({ trigger: story, start: 'top top', end: 'bottom bottom', onUpdate: function (st) { set(st.progress); } });
  } else addEventListener('scroll', onScroll, { passive: true });
  set(0);
})();
