/* Sample projects.
   Desktop (wide, mouse, motion allowed): a pinned 3D ring. The seven sample sites float as browser windows on a ring
   that turns as you scroll; the window at the front comes alive and scrolls through its own site, the caption below
   follows it, and a numbered bar jumps to any project. Click a side window to bring it to the front; click the front
   one to open it. Arrow keys turn the ring.
   Everywhere else: the grid of windows (hover scrolls a site and tilts the window; on touch each scrolls by itself).
   GSAP + ScrollTrigger are vendored; without them, or with reduced motion, the grid stays static. */
(function () {
  'use strict';
  var G = window.gsap, ST = window.ScrollTrigger;
  var sec = document.getElementById('examples'), grid = sec && sec.querySelector('.ex-grid');
  if (!grid || !G) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  var cards = [].slice.call(grid.querySelectorAll('.ex-c'));
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var ringOK = ST && window.matchMedia('(min-width: 1000px) and (min-height: 620px) and (hover: hover) and (pointer: fine)').matches;

  function panner(card) {
    var win = card.querySelector('[data-win]'), img = win && win.querySelector('.ex-long'), scr = win && win.querySelector('.ex-scr'), tw = null;
    function dist() { return img && scr ? Math.max(0, img.getBoundingClientRect().height / (card._scale || 1) - scr.clientHeight) : 0; }
    return {
      win: win, img: img,
      loop: function (speed) { var d = dist(); if (!d) return; if (tw) tw.kill(); tw = G.to(img, { y: -d, duration: d / speed, ease: 'none', repeat: -1, yoyo: true, repeatDelay: 1, delay: 0.5 }); },
      down: function (speed) { var d = dist(); if (!d) return; if (tw) tw.kill(); var cur = -(G.getProperty(img, 'y') || 0); tw = G.to(img, { y: -d, duration: Math.max(1.2, (d - cur) / speed), ease: 'power1.inOut' }); },
      up: function () { if (tw) tw.kill(); if (img) tw = G.to(img, { y: 0, duration: 1, ease: 'power3.out' }); }
    };
  }

  if (ringOK) ring(); else gridMode();

  /* ───────────── 3D ring ───────────── */
  function ring() {
    G.registerPlugin(ST);
    var N = cards.length, STEP = 360 / N, R = 0, active = -1, st;
    var pans = cards.map(panner);
    sec.classList.add('ring-on');
    cards.forEach(function (c) { var im = c.querySelector('.ex-long'); if (im) { im.loading = 'eager'; if (im.decode) im.decode().catch(function () {}); } });

    var stage = document.createElement('div'); stage.className = 'ring-stage';
    var tilt = document.createElement('div'); tilt.className = 'ring-tilt';
    grid.parentNode.insertBefore(stage, grid); stage.appendChild(tilt); tilt.appendChild(grid);
    var cap = document.createElement('div'); cap.className = 'ring-cap'; cap.setAttribute('aria-live', 'polite');
    cap.innerHTML = '<p class="ex-k"></p><h3></h3><p class="ring-d"></p><a class="ring-go" href="#"></a>';
    var nav = document.createElement('div'); nav.className = 'ring-nav'; nav.setAttribute('role', 'group'); nav.setAttribute('aria-label', 'Jump to a sample project');
    cards.forEach(function (c, i) {
      var b = document.createElement('button'); b.type = 'button';
      b.innerHTML = '<span>' + String(i + 1).padStart(2, '0') + '</span>' + c.querySelector('h3').textContent;
      b.addEventListener('click', function () { go(i); }); nav.appendChild(b);
    });
    var hint = document.createElement('p'); hint.className = 'ring-hint'; hint.innerHTML = 'Scroll to turn <span aria-hidden="true">↓</span>';
    stage.appendChild(cap); stage.appendChild(nav); stage.appendChild(hint);
    var navBtns = [].slice.call(nav.children);

    function layout() {
      var w = cards[0].getBoundingClientRect().width / (cards[0]._scale || 1) || Math.min(window.innerWidth * 0.44, 620);
      R = Math.round((w / 2) / Math.tan(Math.PI / N) * 1.08);
      cards.forEach(function (c, i) { c.style.transform = 'translate(-50%,-50%) rotateY(' + (i * STEP) + 'deg) translateZ(' + R + 'px)'; });
      G.set(grid, { z: -R });
    }
    layout();

    function setActive(i) {
      if (i === active) return;
      if (active > -1) { cards[active].classList.remove('on'); pans[active].up(); navBtns[active].removeAttribute('aria-current'); }
      active = i; var c = cards[i];
      c.classList.add('on'); navBtns[i].setAttribute('aria-current', 'true');
      pans[i].loop(110);
      cap.querySelector('.ex-k').textContent = c.querySelector('.ex-k').textContent;
      cap.querySelector('h3').textContent = c.querySelector('h3').textContent;
      cap.querySelector('.ring-d').textContent = c.querySelector('.ex-tx > p:not(.ex-k)').textContent;
      var go2 = cap.querySelector('.ring-go'), a = c.querySelector('a');
      go2.href = a.getAttribute('href'); go2.textContent = c.querySelector('.ex-go').textContent;
      G.fromTo(cap.children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.05, overwrite: true });
    }

    var tween = G.to(grid, {
      rotationY: -(N - 1) * STEP, ease: 'none',
      scrollTrigger: {
        trigger: stage, start: 'top top', end: '+=' + (N - 1) * 60 + '%', pin: true, scrub: 0.7, anticipatePin: 1,
        snap: { snapTo: 1 / (N - 1), inertia: false, duration: { min: 0.25, max: 0.7 }, delay: 0.12, ease: 'power2.inOut' },
        onUpdate: function (s) { setActive(Math.round(s.progress * (N - 1))); hint.classList.toggle('gone', s.progress > 0.02); },
        onRefresh: function (s) { st = s; }
      }
    });
    st = tween.scrollTrigger; setActive(0);

    function go(i) {
      i = Math.max(0, Math.min(N - 1, i)); if (!st) return;
      var y = st.start + (st.end - st.start) * (i / (N - 1));
      var from = window.scrollY, o = { v: from };
      G.to(o, { v: y + 1, duration: Math.min(1.4, 0.5 + Math.abs(y - from) / 2500), ease: 'power2.inOut', onUpdate: function () { window.scrollTo(0, o.v); } });
    }
    cards.forEach(function (c, i) {
      c.querySelector('a').addEventListener('click', function (e) { if (i !== active) { e.preventDefault(); go(i); } });
      c.querySelector('a').addEventListener('focus', function () { if (i !== active) go(i); });
    });
    document.addEventListener('keydown', function (e) {
      if (!st || !st.isActive) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
    });
    window.addEventListener('resize', function () { layout(); });
    window.addEventListener('load', function () { ST.refresh(); });
  }

  /* ───────────── grid fallback ───────────── */
  function gridMode() {
    if ('IntersectionObserver' in window) {
      var queue = [], qt = 0;
      G.set(cards, { opacity: 0, y: 70, rotateX: 14, transformOrigin: '50% 100%' });
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return; io.unobserve(e.target); queue.push(e.target); clearTimeout(qt);
          qt = setTimeout(function () { G.to(queue.splice(0), { opacity: 1, y: 0, rotateX: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, clearProps: 'transform' }); }, 30);
        });
      }, { rootMargin: '0px 0px -10% 0px' });
      cards.forEach(function (c) { io.observe(c); });
      document.querySelectorAll('.ex-tabs button').forEach(function (b) { b.addEventListener('click', function () { cards.forEach(function (c) { if (!c.hidden) G.set(c, { opacity: 1, clearProps: 'transform' }); }); }); });
    }
    cards.forEach(function (card) {
      var p = panner(card), win = p.win; if (!win || !p.img) return;
      var rx = G.quickTo(win, 'rotationX', { duration: 0.6, ease: 'power3' }), ry = G.quickTo(win, 'rotationY', { duration: 0.6, ease: 'power3' });
      card.addEventListener('mouseenter', function () { if (fine.matches) p.down(260); });
      card.addEventListener('mouseleave', function () { if (!fine.matches) return; p.up(); rx(0); ry(0); });
      card.addEventListener('mousemove', function (e) {
        if (!fine.matches) return;
        var r = win.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        ry((px - 0.5) * 9); rx((0.5 - py) * 7);
        win.style.setProperty('--gx', (px * 100).toFixed(1) + '%'); win.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      if (!fine.matches && 'IntersectionObserver' in window) {
        var seen = false, auto = false;
        var start = function () { if (seen && !auto) { auto = true; p.loop(90); } };
        p.img.addEventListener('load', start);
        new IntersectionObserver(function (es) { seen = es[0].isIntersecting; if (seen) start(); }, { threshold: 0.5 }).observe(win);
      }
    });
  }
})();
