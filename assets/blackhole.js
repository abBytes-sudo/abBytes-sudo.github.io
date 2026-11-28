/* Blackhole: the portfolio's small black hole. It follows the pointer over any element marked data-bh and pulls that element's
   letters toward itself; they spring back when it leaves. Lifted from the homepage's contact section so every page can share it.

   Opt in by markup (nothing happens on a page without it):
     <footer data-bh>…</footer>            the hole lives over this element and pulls every letter inside it
     <footer data-bh="span">…</footer>     the same, with the letters made as <span> elements (the homepage's contact section, whose
                                           styles were written around spans). By default the pieces are <bh-sp>, <bh-w> and <bh-lt>,
                                           names no page style can catch: a rule such as ".kick span" must not dress every letter
     <h2 data-bh-strong>…</h2>             inside a data-bh element: these letters are pulled at full strength and take the glow as their colour
     <form data-bh-still>…</form>          inside a data-bh element: the hole lets go here and this text is never split (forms, live widgets)
     <div data-bh data-bh-lazy>…</div>     split the letters when a pointer first reaches the element, not when it first comes into view.
                                           For a page's main heading: its text stays one piece for anything that reads the page without a pointer
   Colours come from CSS (assets/blackhole.css): --bh-rgb on the element sets the glow of pulled letters.
   Script: window.Blackhole.add(el) marks an element added later; window.Blackhole.refresh() after a layout change the page makes itself.

   How it behaves:
   - Reduced motion: the module does nothing at all. No letters are split, no hole is made.
   - Mouse or pen: the hole eases after the pointer while it is over a marked element.
   - Touch: no hole is shown. A tap gives one short pull where the finger landed.
   - It never stays behind. It lets go on pointer leave, when a scroll carries the page out from under the pointer, when the pointer is
     over anything else, on pointer cancel, when the window loses focus, when the tab hides and on page hide; off screen it is switched
     off outright and every letter is put back.
   - Cost: text is split into letters only when its element first comes near the screen; one requestAnimationFrame loop for the whole
     page, running only while something is moving and a marked element is on screen, and timed by the clock, so a slow frame never
     slows the hole's release; positions are measured once and again only after
     a resize, a font load or a change of text; each frame touches only the letters near the hole.
   - A hidden copy of each piece of text stays for screen readers and for copy and paste; the letters themselves are aria-hidden.
   Plain DOM, styles through CSSOM only (works under a strict Content-Security-Policy). */
(function () {
  'use strict';
  var d = document, w = window;
  if (w.Blackhole || !d.querySelectorAll || !w.requestAnimationFrame || !d.createTreeWalker) return;
  var API = w.Blackhole = { add: function () {}, refresh: function () {} };
  if (w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SKIP = '.bh-sp,.bh-sr,[data-bh-still],script,style,textarea,select,option,input,svg,canvas,iframe,[aria-hidden="true"],[contenteditable]';
  var OBS = { childList: true, characterData: true, subtree: true };
  var ROOTS = [], L = [], SP = [], act = [], mo = null, io = null, hole = null, dirty = true, R = 110, R2 = R * R, CUT = R * 2.1;
  var running = false, last = 0, inside = false, ghost = false, cx = 0, cy = 0, hx = 0, hy = 0, pw = 0, tap = 0;

  function E(tag, cls, txt) { var e = d.createElement(tag); e.className = cls; if (txt !== undefined) e.textContent = txt; return e; }
  function anyVis() { for (var i = 0; i < ROOTS.length; i++) if (ROOTS[i].vis) return true; return false; }
  function rootOf(t) { return t && t.closest ? t.closest('[data-bh]') : null; }
  function calm(t) { return !!(t && t.closest && t.closest('[data-bh-still]')); }
  function reset(l) { l.x = l.y = l.r = l.s = l.vx = l.vy = l.vr = l.vs = 0; l.el.style.transform = ''; if (l.p) { l.p = 0; l.el.classList.remove('bh-hot'); l.el.style.removeProperty('--p'); } l.on = false; }

  /* ---- text into letters, once per text node ---- */
  function splitNode(tn, span) {
    var t = tn.nodeValue, pa = tn.parentNode, sp = E(span ? 'span' : 'bh-sp', 'bh-sp'), c = { el: sp, fs: 16, k: .5, h: !!(pa.closest && pa.closest('[data-bh-strong]')) }, frag = d.createDocumentFragment();
    sp.setAttribute('aria-hidden', 'true');
    for (var u = pa, top = pa.closest('[data-bh]'); u && u !== top && u.nodeType === 1; u = u.parentNode) {      // a line drawn by an element further up than the parent
      if (u !== pa && getComputedStyle(u).textDecorationLine !== 'none') { sp.style.textDecoration = getComputedStyle(u).textDecoration; break; }
    }
    t.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) { sp.appendChild(d.createTextNode(part)); return; }
      var wd = E(span ? 'span' : 'bh-w', 'bh-w');
      Array.from(part).forEach(function (ch) { var el = E(span ? 'span' : 'bh-lt', 'bh-lt', ch); wd.appendChild(el); L.push({ el: el, c: c, cx: NaN, cy: NaN, x: 0, y: 0, r: 0, s: 0, vx: 0, vy: 0, vr: 0, vs: 0, p: 0, on: false }); });
      sp.appendChild(wd);
    });
    frag.appendChild(E(span ? 'span' : 'bh-sr', 'bh-sr', t)); frag.appendChild(sp); SP.push(c);
    pa.replaceChild(frag, tn);
  }
  function scan(el) {
    var span = el.getAttribute('data-bh') === 'span', todo = [], n, tw = d.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: function (x) {
      if (x.nodeType === 1) return x.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
      return /\S/.test(x.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    } });
    while ((n = tw.nextNode())) todo.push(n);
    todo.forEach(function (tn) { splitNode(tn, span); });
  }
  /* split the elements that have been seen, again after scripts rewrite their text (a clock, a counter, a copied label) */
  function rescan() {
    if (mo) mo.disconnect();
    ROOTS.forEach(function (r) { if (r.split && r.el.isConnected) scan(r.el); });
    L = L.filter(function (l) { return l.el.isConnected; }); SP = SP.filter(function (c) { return c.el.isConnected; });
    act = act.filter(function (l) { if (l.el.isConnected) return true; l.on = false; return false; });
    dirty = true;
    if (mo) ROOTS.forEach(function (r) { if (r.split && r.el.isConnected) mo.observe(r.el, OBS); });
  }
  function measure() {
    var sx = w.scrollX, sy = w.scrollY;
    SP.forEach(function (c) { c.fs = parseFloat(getComputedStyle(c.el).fontSize) || 16; c.k = c.h ? 1 : Math.max(.5, Math.min(1, (c.fs - 4) / 64)); });
    L.forEach(function (l) { var b = l.el.getBoundingClientRect(); if (!b.width) { l.cx = l.cy = NaN; return; } l.cx = b.left + b.width / 2 + sx - l.x; l.cy = b.top + b.height * .55 + sy - l.y; });
    dirty = false;
  }

  /* ---- the loop: one for the page, asleep unless the hole or a letter is moving ---- */
  function frame(now) {
    var real = Math.min(.3, Math.max(.001, (now - last) / 1000)), steps = Math.min(10, Math.ceil(real / .02)), dt = real / steps, tx = hx, ty = hy, tp = 0, k, i, l, n, still = true, on = anyVis();
    last = now;
    if (inside) { tx = cx; ty = cy; tp = 1; } else if (now < tap) { tx = cx; ty = cy; tp = .6; }
    if (tp > 0 && pw < .02) { hx = tx; hy = ty; }
    k = 1 - Math.exp(-real * 10); hx += (tx - hx) * k; hy += (ty - hy) * k;
    pw += (tp - pw) * (1 - Math.exp(-real * (tp > pw ? 8 : 4)));
    if (dirty) measure();
    var X = hx + w.scrollX, Y = hy + w.scrollY;
    if (pw > .004) for (i = 0; i < L.length; i++) { l = L[i]; if (!l.on && Math.abs(X - l.cx) < CUT && Math.abs(Y - l.cy) < CUT) { l.on = true; act.push(l); } }
    act = act.filter(function (l) {
      if (!l.el.isConnected) { l.on = false; return false; }
      var dx = X - l.cx, dy = Y - l.cy, dd = dx * dx + dy * dy, r = Math.sqrt(dd) + .001, g = dd < CUT * CUT ? pw * Math.exp(-dd / R2) : 0, q = l.c.k;
      var pull = Math.min(r * .5, (5 + l.c.fs * .1) * q) * g, gx = dx / r * pull, gy = dy / r * pull, gr = Math.max(-1, Math.min(1, dx / R)) * 10 * q * g, gs = .14 * q * g;
      for (n = 0; n < steps; n++) {
        l.vx += ((gx - l.x) * 170 - l.vx * 13) * dt; l.x += l.vx * dt;
        l.vy += ((gy - l.y) * 170 - l.vy * 13) * dt; l.y += l.vy * dt;
        l.vr += ((gr - l.r) * 170 - l.vr * 13) * dt; l.r += l.vr * dt;
        l.vs += ((gs - l.s) * 170 - l.vs * 13) * dt; l.s += l.vs * dt;
      }
      if (g < .002 && Math.abs(l.x) + Math.abs(l.y) + Math.abs(l.r) + Math.abs(l.vx) + Math.abs(l.vy) + Math.abs(l.vr) < .03 && Math.abs(l.s) + Math.abs(l.vs) < .0008) { reset(l); return false; }
      if (Math.abs(l.vx) + Math.abs(l.vy) + Math.abs(l.vr) > .05 || Math.abs(l.vs) > .002) still = false;
      var a = Math.atan2(l.y, l.x) * 57.296;
      l.el.style.transform = 'translate3d(' + l.x.toFixed(2) + 'px,' + l.y.toFixed(2) + 'px,0) rotate(' + l.r.toFixed(2) + 'deg) rotate(' + a.toFixed(1) + 'deg) scale(' + (1 + l.s).toFixed(3) + ',' + (1 - l.s * .45).toFixed(3) + ') rotate(' + (-a).toFixed(1) + 'deg)';
      var p = Math.round(Math.max(0, Math.min(1, l.s / .14)) * 12) / 20;
      if (p !== l.p) { if (p) { l.el.classList.add('bh-hot'); l.el.style.setProperty('--p', p); } else { l.el.classList.remove('bh-hot'); l.el.style.removeProperty('--p'); } l.p = p; }
      return true;
    });
    if (hole) {
      hole.style.opacity = ghost ? '0' : Math.min(1, pw * 1.4).toFixed(3);      // a tap pulls without showing the hole
      hole.style.transform = 'translate3d(' + hx.toFixed(1) + 'px,' + hy.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + (.35 + .65 * pw).toFixed(3) + ')';
    }
    var settled = Math.abs(tx - hx) < .3 && Math.abs(ty - hy) < .3 && Math.abs(tp - pw) < .004;
    if ((!settled || !still || now < tap || (tp === 0 && (pw > .004 || act.length))) && on) w.requestAnimationFrame(frame);
    else { running = false; if (!on) drop(true); }
  }
  function wake() {
    if (running || !L.length || !anyVis()) return;
    if (!hole) { hole = E('i', 'bh-hole'); hole.setAttribute('aria-hidden', 'true'); d.body.appendChild(hole); }
    running = true; last = w.performance.now(); w.requestAnimationFrame(frame);
  }
  /* is the last pointer position still over a marked element? (a scroll moves the page, not the pointer) */
  function over() { for (var i = 0; i < ROOTS.length; i++) { if (!ROOTS[i].vis) continue; var b = ROOTS[i].el.getBoundingClientRect(); if (cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom) return true; } return false; }
  function drop(hard) {
    inside = false; tap = 0;
    if (hard || !anyVis()) { pw = 0; if (hole) hole.style.opacity = '0'; act.forEach(reset); act = []; }
    else wake();
  }

  /* ---- pointer ---- */
  function mv(e) {
    if (e.pointerType === 'touch') return;
    if (!this.__bh.split) open(this.__bh);
    if (calm(e.target)) { if (inside) drop(); return; }
    cx = e.clientX; cy = e.clientY; ghost = false; if (!inside) { inside = true; dirty = true; } wake();
  }
  function dn(e) { if (e.pointerType !== 'touch' || calm(e.target)) return; if (!this.__bh.split) open(this.__bh); cx = e.clientX; cy = e.clientY; ghost = true; tap = w.performance.now() + 520; dirty = true; wake(); }
  function lv(e) { if (e.pointerType === 'touch') { inside = false; wake(); } else drop(); }
  function cn() { drop(); }
  function stale(e) { if (!e.target.classList || !e.target.classList.contains('bh-lt')) dirty = true; }

  function add(el) {
    if (!el || el.nodeType !== 1 || el.__bh) return;
    if (!el.hasAttribute('data-bh')) el.setAttribute('data-bh', '');
    var r = el.__bh = { el: el, vis: false, split: false, lazy: el.hasAttribute('data-bh-lazy') };
    ROOTS.push(r);
    el.addEventListener('pointermove', mv); el.addEventListener('pointerleave', lv); el.addEventListener('pointercancel', cn); el.addEventListener('pointerdown', dn);
    el.addEventListener('animationend', stale); el.addEventListener('transitionend', stale);      // a page's own entrance motion moves the text: measure again after it
    if (io) io.observe(el); else show(r, true);
  }
  function open(r) { r.split = true; if (mo) mo.disconnect(); scan(r.el); dirty = true; if (mo) ROOTS.forEach(function (x) { if (x.split && x.el.isConnected) mo.observe(x.el, OBS); }); }
  function show(r, v) {
    r.vis = v;
    if (v && !r.split && !r.lazy) open(r);
    if (anyVis()) { if (inside || pw > .004 || act.length) wake(); } else drop(true);
  }

  if ('MutationObserver' in w) mo = new MutationObserver(rescan);
  if ('IntersectionObserver' in w) io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.target.__bh) show(e.target.__bh, e.isIntersecting); }); }, { rootMargin: '120px 0px' });
  [].forEach.call(d.querySelectorAll('[data-bh]'), add);

  w.addEventListener('scroll', function () { if (!ROOTS.length) return; if (tap || (inside && !over())) drop(); else if (inside || pw > .004) wake(); }, { passive: true });
  d.addEventListener('pointermove', function (e) { if (inside && e.pointerType !== 'touch' && !rootOf(e.target)) drop(); }, { passive: true });
  w.addEventListener('blur', function () { drop(true); });
  d.addEventListener('visibilitychange', function () { if (d.hidden) drop(true); });
  w.addEventListener('pagehide', function () { drop(true); });
  w.addEventListener('resize', function () { dirty = true; });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { dirty = true; });

  API.add = add;
  API.refresh = function () { dirty = true; };
})();
