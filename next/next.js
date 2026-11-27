/* Portfolio "next": hero (poster first, 3D after first paint), index filters + floating hover preview, reveals, copy email. */
(function () {
  'use strict';
  var d = document, $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, coarse = matchMedia('(pointer: coarse)').matches;
  d.documentElement.classList.add('js');

  // headline lines rise once fonts are in
  $$('h1 .ln').forEach(function (l) { l.innerHTML = '<span>' + l.innerHTML + '</span>'; });
  var go = function () { d.documentElement.classList.add('ready'); };
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { requestAnimationFrame(go); }); else go();
  setTimeout(go, 900);

  // header gets a background once scrolled
  var top = $('#top'), heroObj = $('#obj'), rail = $('#rail'), tick = false, ticks = [], track = 0, docMax = 1;
  function railBuild() {
    if (!rail || getComputedStyle(rail).display === 'none') return; track = rail.clientHeight; docMax = Math.max(1, d.documentElement.scrollHeight - innerHeight);
    if (!ticks.length) ['#main', '#work', '#clients', '#services', '#how', '#contact'].forEach(function (id) { var e = $(id); if (!e) return; var t = d.createElement('i'); t.className = 'tk'; rail.appendChild(t); ticks.push({ e: e, t: t }); });
    ticks.forEach(function (k) { var y = Math.min(docMax, Math.max(0, k.e.getBoundingClientRect().top + scrollY - 64)); k.y = y; k.t.style.transform = 'translate3d(0,' + (y / docMax * track).toFixed(1) + 'px,0)'; });
  }
  function onS() {
    tick = false; var y = scrollY; top.classList.toggle('solid', y > 24);
    if (!reduce && heroObj && y < innerHeight * 1.4) heroObj.style.setProperty('--py', (y * 0.14).toFixed(1) + 'px');
    if (track) { var bead = rail.firstElementChild, f = y / docMax; bead.style.transform = 'translate3d(0,' + (f * track).toFixed(1) + 'px,0)'; rail.style.setProperty('--f', f.toFixed(4)); ticks.forEach(function (k) { k.t.classList.toggle('on', y >= k.y - innerHeight * 0.35); }); }
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(onS); } }, { passive: true });
  addEventListener('resize', function () { railBuild(); onS(); });
  addEventListener('load', function () { railBuild(); onS(); }); railBuild(); onS();

  // ---------- hero: the 3D cable loads after the page is usable ----------
  var obj = $('#obj'), canvas = $('#knot'), hold = $('#hold'), api = null;
  function load3D() {
    if (api || load3D.busy || !window.WebGLRenderingContext) return; load3D.busy = true;
    var s = d.createElement('script'); s.src = 'hero3d.js?v=3'; s.async = true;
    s.onload = function () { try { api = window.NextHero.mount(canvas, { host: obj }); requestAnimationFrame(function () { obj.classList.add('live'); }); } catch (e) { /* the poster stays */ } };
    d.head.appendChild(s);
  }
  var EV = ['pointerdown', 'pointermove', 'scroll', 'keydown', 'wheel', 'touchstart'];
  function kick() { EV.forEach(function (n) { removeEventListener(n, kick); }); load3D(); }
  // desktop: first pointer move, or 5 s after load. Phones: first touch or scroll only, so a phone never pays
  // for three.js unless someone is actually there; until then the poster is the hero.
  addEventListener('load', function () { EV.forEach(function (n) { addEventListener(n, kick, { once: true, passive: true }); }); if (!coarse) setTimeout(kick, 5000); });
  // press and hold to make a mess (pointer, touch, Space/Enter)
  function mess(on) { if (!api) { load3D(); return; } api.setMess(on); hold.classList.toggle('on', on); d.documentElement.classList.toggle('messy', on); }
  hold.addEventListener('pointerdown', function (e) { e.preventDefault(); hold.setPointerCapture(e.pointerId); mess(true); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (n) { hold.addEventListener(n, function () { mess(false); }); });
  hold.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); mess(true); } });
  hold.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') mess(false); });
  hold.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  if (reduce) hold.hidden = true;

  // ---------- index filters ----------
  var rows = $$('.row'), btns = $$('.filters button');
  btns.forEach(function (b) { var f = b.dataset.f, n = f === 'all' ? rows.length : rows.filter(function (r) { return r.dataset.cat.split(' ').indexOf(f) > -1; }).length; b.querySelector('small').textContent = n; });
  $('.filters').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; var f = b.dataset.f;
    btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    rows.forEach(function (r, i) { var on = f === 'all' || r.dataset.cat.split(' ').indexOf(f) > -1; r.classList.toggle('out', !on);
      if (on && !reduce) r.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: Math.min(i, 10) * 30, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }); });
    setTimeout(function () { railBuild(); onS(); }, 60);
  });

  // ---------- floating preview window that follows the pointer (desktop) ----------
  var pv = $('#pv'), pimg = $('#pv-img'), pu = $('#pv-u'), list = $('#rows');
  var fine = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1001px)');
  if (fine.matches) {
    var x = 0, y = 0, tx = 0, ty = 0, raf = 0, on = false;
    function loop() { x += (tx - x) * 0.14; y += (ty - y) * 0.14; pv.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)'; if (on || Math.abs(tx - x) > 0.5) raf = requestAnimationFrame(loop); else raf = 0; }
    // window sits right of the pointer, or flips to its left near the edge; always kept inside the viewport
    function aim(e) { tx = e.clientX + 32; if (tx + pv.offsetWidth > innerWidth - 16) tx = e.clientX - pv.offsetWidth - 32; tx = Math.max(16, tx);
      ty = Math.min(innerHeight - pv.offsetHeight - 16, Math.max(80, e.clientY - pv.offsetHeight / 2)); }
    list.addEventListener('mousemove', function (e) { aim(e); if (!raf) raf = requestAnimationFrame(loop); });
    list.addEventListener('mouseover', function (e) {
      var r = e.target.closest('.row'); if (!r) return; rows.forEach(function (x2) { x2.classList.toggle('hov', x2 === r); }); list.classList.add('dim');
      var src = r.dataset.long || r.dataset.thumb, long = !!r.dataset.long;
      if (r.dataset.k) pv.setAttribute('data-k', r.dataset.k); else pv.removeAttribute('data-k');
      if (pimg.getAttribute('src') !== src) { pimg.className = long ? 'long' : 'card'; pimg.src = src; }
      [r.previousElementSibling, r.nextElementSibling].forEach(function (n) { if (n && !n._pf) { n._pf = 1; var u = n.dataset.long || n.dataset.thumb; if (u) { var im = new Image(); im.src = u; } } });
      pu.textContent = (r.querySelector('a').getAttribute('href') || '').replace(/^\.\.\//, '').replace(/\/index\.html$|\.html$/, '');
      if (!on) { on = true; aim(e); x = tx; y = ty; pv.classList.add('on'); if (!raf) raf = requestAnimationFrame(loop); }
    });
    list.addEventListener('mouseleave', function () { on = false; pv.classList.remove('on'); list.classList.remove('dim'); rows.forEach(function (x2) { x2.classList.remove('hov'); }); });
  }
  // phones and tablets: the long screenshot scrolls in place while its row is on screen
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('play', e.isIntersecting); }); }, { rootMargin: '-10% 0px' });
    $$('.mthumb.long').forEach(function (m) { io.observe(m); });
  }

  // ---------- reveals ----------
  var rv = $$('.sh, .cw, .svc li, .pk > div, .steps li, .about > *, .contact > *, .facts li');
  rv.forEach(function (e) { e.classList.add('rv'); });
  if ('IntersectionObserver' in window && !reduce) {
    var ro = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (e, i) { e.style.transitionDelay = (i % 4) * 70 + 'ms'; ro.observe(e); });
  } else rv.forEach(function (e) { e.classList.add('in'); });

  // ---------- copy email ----------
  var t = $('#toast');
  $('#copy').addEventListener('click', function () { var v = this.dataset.v, done = function () { t.textContent = 'Email copied.'; t.classList.add('on'); setTimeout(function () { t.classList.remove('on'); }, 2200); };
    if (navigator.clipboard) navigator.clipboard.writeText(v).then(done, done); else done(); });
})();
