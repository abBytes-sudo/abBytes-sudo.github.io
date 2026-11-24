/* Taradhura: the shared motion stack (GSAP, ScrollTrigger, SplitText, Lenis, motion.js) arrives once the page has settled:
   on the first touch, key, wheel or scroll, or a couple of seconds after load, whichever comes first.
   Nothing above the fold waits for it: headings, images and counters that motion.js would have animated are left alone
   and rise in with CSS (.rise), so the first screen is never hidden behind 170 KB of script. */
(function () {
  var html = document.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { html.classList.add('motion-off'); return; }

  // 1. what is on the first screen opts out of the scripted reveal
  var vh = innerHeight || 800, n = 0;
  [].forEach.call(document.querySelectorAll('[data-split],[data-reveal],[data-clip],[data-count],[data-stagger]'), function (el) {
    var r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh * 0.92) return;
    ['data-split', 'data-reveal', 'data-clip', 'data-count', 'data-stagger', 'data-delay'].forEach(function (a) { el.removeAttribute(a); });
    el.classList.add('rise'); el.style.setProperty('--rd', Math.min(n++, 6) * 80 + 'ms');
  });

  // 2. everything else is loaded when a person shows up, or after a short while
  var list = ['../assets/vendor/gsap.min.js', '../assets/vendor/ScrollTrigger.min.js', '../assets/vendor/SplitText.min.js', '../assets/vendor/lenis.min.js', '../assets/motion.js?v=1'];
  var EV = ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll'], booted = false, armed = false;
  function boot() {
    if (booted) return; booted = true; EV.forEach(function (e) { removeEventListener(e, soon); });
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '../assets/vendor/lenis.css'; document.head.appendChild(l);
    list.forEach(function (src) { var s = document.createElement('script'); s.src = src; s.async = false; document.head.appendChild(s); });
  }
  function soon() { if (armed || booted) return; armed = true; ('requestIdleCallback' in window) ? requestIdleCallback(boot, { timeout: 700 }) : setTimeout(boot, 150); }
  EV.forEach(function (e) { addEventListener(e, soon, { passive: true }); });
  function later() { setTimeout(soon, 2600); }
  if (document.readyState === 'complete') later(); else addEventListener('load', later);
})();
