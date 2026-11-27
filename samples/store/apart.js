/* Northlane · the cover story, "One jacket, taken apart" (home page). Markup in index.html, look in apart.css.
   The plate (.ap-cv) is laid out in the photograph's own pixels, 900 x 1125, and scaled as one. While the section is pinned
   the scroll position drives everything: the wall falls away, the ten pieces travel apart, three groups are named, and the
   jacket is basted together again. Reduced motion gets a still plate with the pieces apart. No dependencies. */
(function () {
  'use strict';
  var sec = document.getElementById('apart'); if (!sec) return;
  var $ = function (s) { return sec.querySelector(s); }, $$ = function (s) { return [].slice.call(sec.querySelectorAll(s)); };
  var sc = $('.ap-sc'), stage = $('.ap-stage'), cv = $('.ap-cv'), wrap = $('.ap-parts'), ph = $('.ap-ph'), cap = $('.ap-cap'), back = $('.ap-back'), sew = $('.ap-sew'), th = $('.ap-th i');
  var steps = $$('.ap-s'), ix = document.getElementById('apIx');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* where each piece goes when the jacket is apart: [dx, dy, turn in degrees, pivot x, pivot y, start] in photograph pixels */
  var WIDE = { sleeveL: [-96, 4, 4.5, 215, 288, 0], sleeveR: [96, 4, -4.5, 676, 280, 0], cuffL: [-104, 66, 4.5, 215, 288, .06], cuffR: [107, 65, -4.5, 676, 280, .06],
    hemL: [-38, 64, 0, 0, 0, .12], hemR: [38, 64, 0, 0, 0, .12], collar: [0, -84, 0, 0, 0, .18], frontL: [-38, 0, 0, 0, 0, .26], frontR: [38, 0, 0, 0, 0, .26], zip: [0, 30, 0, 0, 0, .34] };
  var NARROW = { sleeveL: [-58, 4, 3.2, 215, 288, 0], sleeveR: [58, 4, -3.2, 676, 280, 0], cuffL: [-63, 52, 3.2, 215, 288, .06], cuffR: [66, 51, -3.2, 676, 280, .06],
    hemL: [-24, 50, 0, 0, 0, .12], hemR: [24, 50, 0, 0, 0, .12], collar: [0, -66, 0, 0, 0, .18], frontL: [-24, 0, 0, 0, 0, .26], frontR: [24, 0, 0, 0, 0, .26], zip: [0, 24, 0, 0, 0, .34] };
  var LAST = .34, EX = WIDE;
  var parts = $$('.ap-p').map(function (el) { var d = el.dataset; return { el: el, k: d.k, x: +d.x, y: +d.y, w: +d.w, h: +d.h }; });

  /* the pieces and the photograph load now, once this script runs: the loader starts it only after the cover photo is on screen */
  function fetchPieces() { $$('img[data-src]').forEach(function (im) { im.src = im.getAttribute('data-src'); im.removeAttribute('data-src'); }); }

  function sm(a, b, x) { x = (x - a) / (b - a); x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }
  function io(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function mix(a, b, t) { return a + (b - a) * t; }

  /* three framings: the photograph, the pieces apart, the finished jacket a little closer */
  var bw = 0, bh = 0, camA, camB, camJ;
  function fit(v) { var s = Math.min(bw / v.w, bh / v.h); return { s: s, x: (bw - v.w * s) / 2 - v.x * s, y: (bh - v.h * s) / 2 - v.y * s }; }
  function layout() {
    bw = stage.clientWidth; bh = stage.clientHeight; if (!bw || !bh) return false;
    EX = innerWidth <= 860 ? NARROW : WIDE;
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    parts.forEach(function (p) {
      var t = EX[p.k], a = t[2] * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      p.el.style.transformOrigin = (t[3] - p.x) + 'px ' + (t[4] - p.y) + 'px';
      [[p.x, p.y], [p.x + p.w, p.y], [p.x, p.y + p.h], [p.x + p.w, p.y + p.h]].forEach(function (q) {
        var rx = q[0] - t[3], ry = q[1] - t[4], X = t[3] + rx * c - ry * s + t[0], Y = t[4] + rx * s + ry * c + t[1];
        if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; });
    });
    var m = innerWidth <= 860 ? 16 : 30;
    camB = fit({ x: x0 - m, y: y0 - m, w: x1 - x0 + 2 * m, h: y1 - y0 + 2 * m });
    camA = fit({ x: 0, y: 0, w: 900, h: 1125 + (innerWidth <= 860 ? 70 : 46) });
    camJ = fit({ x: 62, y: 168, w: 776, h: 934 });
    return true;
  }

  var state = { step: -1, focus: null, open: null };
  function draw(p) {
    if (!camA) return;
    var wall = sm(.05, .16, p), up = sm(.16, .38, p), down = sm(.78, .9, p), e = up * (1 - down), fin = down, stitch = sm(.87, .97, p);
    if (reduce) { wall = 1; e = 1; fin = 0; stitch = 0; }
    // camera
    var k = io(e), bs = mix(camA.s, camJ.s, fin), bx = mix(camA.x, camJ.x, fin), by = mix(camA.y, camJ.y, fin);
    var s = mix(bs, camB.s, k), tx = mix(bx, camB.x, k), ty = mix(by, camB.y, k);
    cv.style.transform = 'translate3d(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0) scale(' + s.toFixed(4) + ')';
    cv.style.setProperty('--u', (1 / s).toFixed(3));
    // the wall, the hand and the hanger
    ph.style.opacity = (1 - wall).toFixed(3); ph.style.visibility = wall >= 1 ? 'hidden' : '';
    cap.style.opacity = (1 - sm(.03, .1, p)).toFixed(3);
    // the pieces
    parts.forEach(function (q) {
      var t = EX[q.k], l = io(Math.min(1, Math.max(0, (e * (1 + LAST) - t[5]))));
      q.el.style.transform = l ? 'translate3d(' + (t[0] * l).toFixed(2) + 'px,' + (t[1] * l).toFixed(2) + 'px,0)' + (t[2] ? ' rotate(' + (t[2] * l).toFixed(3) + 'deg)' : '') : '';
      if (t[2]) q.el.style.setProperty('--mr', (-t[2] * l).toFixed(3) + 'deg');
    });
    wrap.style.filter = e > .01 ? 'drop-shadow(0 ' + (16 * e).toFixed(1) + 'px ' + (20 * e).toFixed(1) + 'px rgba(17,17,17,' + (.2 * e).toFixed(3) + '))' : '';
    back.style.opacity = Math.min(1, e * 1.5).toFixed(3);
    // white basting thread runs down the seams as the pieces meet
    sew.style.opacity = stitch > 0 ? 1 : 0; sew.style.clipPath = 'inset(0 0 ' + ((1 - stitch) * 100).toFixed(2) + '% 0)';
    if (th) th.style.setProperty('--p', p.toFixed(4));
    // words
    var step = reduce ? -1 : p < .16 ? 0 : p < .4 ? 1 : p < .53 ? 2 : p < .66 ? 3 : p < .78 ? 4 : 5;
    var focus = reduce ? '' : step === 2 ? 'cloth' : step === 3 ? 'rib' : step === 4 ? 'metal' : '';
    var open = reduce || (e > .55);
    if (step !== state.step) { state.step = step; steps.forEach(function (li, i) { li.classList.toggle('on', i === step); }); if (ix && step >= 0) ix.textContent = step + 1; sec.classList.toggle('moved', step > 0); }
    if (focus !== state.focus) { state.focus = focus; if (focus) sec.setAttribute('data-focus', focus); else sec.removeAttribute('data-focus'); }
    if (open !== state.open) { state.open = open; sec.classList.toggle('open', open); }
  }

  /* the parts list answers the pointer: rest on a row (or tab to it) and that piece stands out */
  (function () {
    var rows = $$('.ap-bom li'), els = $$('.ap-p'), marks = $$('.ap-m');
    function pick(L) {
      sec.classList.toggle('pick', !!L);
      rows.forEach(function (r) { r.classList.toggle('pk', !!L && r.getAttribute('data-l') === L); });
      els.forEach(function (el) { el.classList.toggle('dim', !!L && (' ' + el.getAttribute('data-l') + ' ').indexOf(' ' + L + ' ') < 0); });
      marks.forEach(function (m) { m.classList.toggle('dim', !!L && m.getAttribute('data-l') !== L); });
    }
    rows.forEach(function (r) { var L = r.getAttribute('data-l');
      r.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && sec.classList.contains('open')) pick(L); });
      r.addEventListener('pointerleave', function () { pick(''); });
      r.addEventListener('focus', function () { if (sec.classList.contains('open')) pick(L); }); r.addEventListener('blur', function () { pick(''); }); });
  })();

  /* the ledger under the plate follows the live price of the jacket */
  (function () {
    var led = document.getElementById('apLed'); if (!led) return;
    var pr = window.NL && NL.product && NL.product('harbor-jacket'), price = (pr && pr.price) || 8900, rows = [].slice.call(led.children), sum = 0, max = 0;
    var gst = Math.round(price * 18 / 118), amt = rows.map(function (li) { var k = li.getAttribute('data-s'); if (k === 'gst') { sum += gst; return gst; } if (k === 'rest') return -1; var a = Math.round(price * +k / 10) * 10; sum += a; return a; });
    amt = amt.map(function (a) { return a < 0 ? price - sum : a; }); amt.forEach(function (a) { if (a > max) max = a; });
    rows.forEach(function (li, i) { li.style.setProperty('--w', (amt[i] / max).toFixed(4)); li.style.setProperty('--i', i); var a = li.querySelector('.a'); if (a && window.NL && NL.money) a.textContent = NL.money(amt[i]); });
    if (reduce || !('IntersectionObserver' in window)) { led.classList.add('in'); return; }
    new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { led.classList.add('in'); o.disconnect(); } }, { threshold: .35 }).observe(led);
  })();

  if (reduce) {
    sec.classList.add('still');
    var still = function () { if (layout()) { draw(1); sec.classList.add('ready'); } };
    fetchPieces(); still(); addEventListener('resize', still); addEventListener('load', still); return;
  }

  /* the cover line lands on the first frame of the pinned plate, not a little short of it */
  [].forEach.call(document.querySelectorAll('a[href="#apart"]'), function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var y = Math.round(sc.getBoundingClientRect().top + scrollY) + 2, L = window.Motion && Motion.lenis;
      if (L) L.scrollTo(y, { duration: 1.4 }); else scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  var target = 0, cur = -1, raf = 0, last = 0, near = false;
  function prog() { var r = sc.getBoundingClientRect(), span = r.height - innerHeight; return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0; }
  function tick(now) {
    raf = 0; var dt = Math.min(.05, (now - last) / 1000) || .016; last = now; target = prog();
    if (cur < 0) cur = target; cur += (target - cur) * (1 - Math.exp(-dt * 13)); if (Math.abs(target - cur) < .0003) cur = target;
    draw(cur); if (near && cur !== target) raf = requestAnimationFrame(tick);
  }
  function kick() { if (!raf && near) { last = performance.now(); raf = requestAnimationFrame(tick); } }
  function start() { if (!layout()) return; cur = -1; sec.classList.add('ready'); near = true; kick(); }
  fetchPieces();
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { near = es[0].isIntersecting; if (near) kick(); }, { rootMargin: '60% 0px' }).observe(sec); else near = true;
  addEventListener('scroll', kick, { passive: true });
  var rz = 0; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (layout()) { near = true; kick(); draw(cur < 0 ? prog() : cur); } }, 120); });
  start(); addEventListener('load', start);
})();
