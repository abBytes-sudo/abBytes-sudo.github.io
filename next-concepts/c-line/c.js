/* Concept C · The Line. Hero: five tangled lines straighten into a diagram, and anything you draw becomes a tidy line with his five stops.
   Below: every project as a station on a transit-style map. Plain SVG, no libraries. */
(function () {
  'use strict';
  var d = document, W = window.WORK, $ = function (s) { return d.querySelector(s); }, NS = 'http://www.w3.org/2000/svg';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, coarse = matchMedia('(hover: none)').matches;
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; }, sm = function (t) { return t * t * (3 - 2 * t); };
  function S(tag, at, parent) { var e = d.createElementNS(NS, tag), k; for (k in at) e.setAttribute(k, at[k]); if (parent) parent.appendChild(e); return e; }
  /* polyline → path with rounded corners */
  function rpath(p, r) {
    var s = 'M' + p[0][0].toFixed(1) + ' ' + p[0][1].toFixed(1), i, a, v, q, la, lb, c;
    for (i = 1; i < p.length - 1; i++) {
      a = p[i - 1]; v = p[i]; q = p[i + 1]; la = Math.hypot(v[0] - a[0], v[1] - a[1]); lb = Math.hypot(q[0] - v[0], q[1] - v[1]); if (!la || !lb) continue; c = Math.min(r, la / 2, lb / 2);
      s += 'L' + (v[0] - (v[0] - a[0]) / la * c).toFixed(1) + ' ' + (v[1] - (v[1] - a[1]) / la * c).toFixed(1) + 'Q' + v[0].toFixed(1) + ' ' + v[1].toFixed(1) + ' ' + (v[0] + (q[0] - v[0]) / lb * c).toFixed(1) + ' ' + (v[1] + (q[1] - v[1]) / lb * c).toFixed(1);
    }
    v = p[p.length - 1]; return s + 'L' + v[0].toFixed(1) + ' ' + v[1].toFixed(1);
  }
  var svg = $('#lines'), probe = S('path', { visibility: 'hidden' }, svg);
  function sample(ds, n) { probe.setAttribute('d', ds); var L = probe.getTotalLength(), o = [], i, p; for (i = 0; i < n; i++) { p = probe.getPointAtLength(L * i / (n - 1)); o.push([p.x, p.y]); } return o; }
  function plen(p) { var l = 0, i; for (i = 1; i < p.length; i++) l += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return l; }
  function poly(p) { var s = 'M', i; for (i = 0; i < p.length; i++) s += (i ? 'L' : '') + p[i][0].toFixed(1) + ' ' + p[i][1].toFixed(1); return s; }
  function blend(a, b, T) { var o = [], n = a.length, i, e; for (i = 0; i < n; i++) { e = sm(clamp(T * 1.5 - i / n * .5)); o.push([a[i][0] + (b[i][0] - a[i][0]) * e, a[i][1] + (b[i][1] - a[i][1]) * e]); } return o; }

  /* ---------- hero: the five lines ---------- */
  var hero = $('#top'), N = 150, HW = 0, HH = 0, T = 0, goal = 1, raf = 0, lastT = 0;
  var TR = [['Property', '#0077c8'], ['Build & interiors', '#f2a900'], ['Fitness & stays', '#00a45f'], ['Retail & marketplaces', '#e2187d'], ['Software', '#7b3fb5']];
  var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  var P = TR.map(function (t) { var f = [], i; for (i = 0; i < 4; i++) f.push(7 + rnd() * 12, rnd() * 6.28); return { f: f, el: S('path', { stroke: t[1] }, svg) }; });
  P.forEach(function (L, k) { L.ring = S('circle', { class: 'ring tm', r: 9 }, svg); L.lab = S('text', { class: 'tl', 'text-anchor': 'end' }, svg); L.lab.textContent = TR[k][0]; });
  var mineG = S('g', {}, svg);
  function layout() {
    var r = hero.getBoundingClientRect(); HW = r.width; HH = r.height;
    var m = HW < 760, g = m ? 10 : 16, s = m ? 30 : 48, sw = m ? 6 : 10, xr = HW - (m ? 18 : Math.max(46, HW * .05)), yh = m ? HH - 262 : Math.max(92, HH * .13), xb = m ? HW * .14 : HW * .67, m0 = m ? 132 : Math.min(250, HH * .3), dm = s + g - g * Math.SQRT2;
    var cx = m ? HW * .5 : HW * .8, cy = m ? HH - 150 : HH * .5, rx = m ? HW * .42 : HW * .18, ry = m ? 104 : HH * .37;
    P.forEach(function (L, k) {
      var mk = m0 - k * dm, y = yh + k * s, x = xb + k * g, i, t; L.mess = [];
      L.tidy = sample(rpath([[xr, y], [x + mk, y], [x, y + mk], [x, HH + 40]], m ? 18 : 34), N);
      for (i = 0; i < N; i++) { t = i / (N - 1); L.mess.push([cx + rx * (.62 * Math.sin(t * L.f[0] + L.f[1]) + .38 * Math.sin(t * L.f[2] + L.f[3])), cy + ry * (.62 * Math.cos(t * L.f[4] + L.f[5]) + .38 * Math.sin(t * L.f[6] + L.f[7]))]); }
      L.el.setAttribute('stroke-width', sw); L.ring.setAttribute('cx', xr); L.ring.setAttribute('cy', y); L.ring.setAttribute('r', m ? 7 : 9); L.lab.setAttribute('x', xr - 18); L.lab.setAttribute('y', y - sw - 4);
    });
    draw();
  }
  function draw() { P.forEach(function (L) { L.el.setAttribute('d', poly(blend(L.mess, L.tidy, T))); }); svg.classList.toggle('tidy', T > .97); }
  function run(now) { var dt = Math.min(.05, (now - lastT) / 1000 || .016); lastT = now; T += (goal > T ? 1 : -1) * dt / 1.5; if ((goal > .5 && T >= 1) || (goal < .5 && T <= 0)) { T = goal; raf = 0; } else raf = requestAnimationFrame(run); draw(); }
  function to(v) { goal = v; tangle.textContent = v ? 'Tangle it again' : 'Untangle it'; if (reduce) { T = v; draw(); return; } if (!raf) { lastT = 0; raf = requestAnimationFrame(run); } }
  var tangle = $('#tangle'); tangle.addEventListener('click', function () { to(goal ? 0 : 1); });

  /* ---------- hero: your scribble becomes a line ---------- */
  var STOPS = ['Listen', 'Map', 'Decide', 'Build', 'Launch'], pen = $('#pen'), hint = $('#hint'), cur = null, penOn = false, mine = [];
  function rdp(p, eps) {
    if (p.length < 3) return p.slice(); var a = p[0], b = p[p.length - 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), mx = 0, at = 0, i, dd;
    for (i = 1; i < p.length - 1; i++) { dd = L < 1 ? Math.hypot(p[i][0] - a[0], p[i][1] - a[1]) : Math.abs((p[i][0] - a[0]) * dy - (p[i][1] - a[1]) * dx) / L; if (dd > mx) { mx = dd; at = i; } }
    return mx <= eps ? [a, b] : rdp(p.slice(0, at + 1), eps).slice(0, -1).concat(rdp(p.slice(at), eps));
  }
  function tidy(pts) {
    var eps = 30, c = rdp(pts, eps), G = 28, o = [], out, i, a, b, dx, dy, ax, ay, m;
    while (c.length > 7) { eps *= 1.3; c = rdp(pts, eps); }
    c.forEach(function (p) { var q = [Math.round(p[0] / G) * G, Math.round(p[1] / G) * G], l = o[o.length - 1]; if (!l || l[0] !== q[0] || l[1] !== q[1]) o.push(q); });
    if (o.length < 2) o.push([o[0][0] + G * 4, o[0][1]]);
    out = [o[0]];
    for (i = 0; i < o.length - 1; i++) {      // every leg runs flat, upright or at 45°
      a = o[i]; b = o[i + 1]; dx = b[0] - a[0]; dy = b[1] - a[1]; ax = Math.abs(dx); ay = Math.abs(dy); m = Math.min(ax, ay);
      if (m && ax !== ay) out.push(ax > ay ? [a[0] + Math.sign(dx) * (ax - m), a[1]] : [a[0], a[1] + Math.sign(dy) * (ay - m)]);
      out.push(b);
    }
    return out;
  }
  function settle(D) {
    var raw = sample(poly(D.pts), N), ds = rpath(tidy(D.pts), 22), fin = sample(ds, N), t0 = 0;
    function done() {
      D.el.setAttribute('d', ds); probe.setAttribute('d', ds); var L = probe.getTotalLength();
      STOPS.forEach(function (n, k) {
        var p = probe.getPointAtLength(L * k / 4), right = p.x > HW - 120, c = S('circle', { class: 'ring pop', cx: p.x, cy: p.y, r: 8.5 }, D.g), t = S('text', { class: 'pop', x: p.x + (right ? -15 : 15), y: p.y - 13, 'text-anchor': right ? 'end' : 'start' }, D.g);
        t.textContent = n; c.style.animationDelay = t.style.animationDelay = k * 90 + 'ms';
      });
      hint.innerHTML = '<b>That’s the line I’d draw:</b> Listen, Map, Decide, Build, Launch. Draw another, or scroll on.';
    }
    if (reduce) return done();
    (function step(now) { t0 = t0 || now; var t = (now - t0) / 850; D.el.setAttribute('d', poly(blend(raw, fin, Math.min(1, t)))); if (t < 1) requestAnimationFrame(step); else done(); })(performance.now());
  }
  hero.addEventListener('pointerdown', function (e) {
    if (e.button || e.target.closest('a,button') || (e.pointerType !== 'mouse' && !penOn)) return;
    var r = hero.getBoundingClientRect(), g = S('g', {}, mineG);
    cur = { r: r, g: g, pts: [[e.clientX - r.left, e.clientY - r.top]], el: S('path', { stroke: '#0f0f10', 'stroke-width': HW < 760 ? 5 : 7 }, g) };
    try { hero.setPointerCapture(e.pointerId); } catch (x) { /* older browsers */ }
    e.preventDefault();
  });
  hero.addEventListener('pointermove', function (e) {
    if (!cur) return; var p = [e.clientX - cur.r.left, e.clientY - cur.r.top], l = cur.pts[cur.pts.length - 1];
    if (Math.hypot(p[0] - l[0], p[1] - l[1]) < 4) return; cur.pts.push(p); cur.el.setAttribute('d', poly(cur.pts));
  });
  function up() {
    if (!cur) return; var D = cur; cur = null; penOn = false; hero.classList.remove('pen'); pen.textContent = 'Draw another';
    if (plen(D.pts) < 90) { D.g.remove(); return; }
    mine.push(D.g); if (mine.length > 3) mine.shift().remove(); settle(D);
  }
  hero.addEventListener('pointerup', up); hero.addEventListener('pointercancel', up);
  pen.addEventListener('click', function () { penOn = !penOn; hero.classList.toggle('pen', penOn); pen.textContent = penOn ? 'Now drag a finger across' : 'Draw a mess'; });
  window.__draw = function (pts) { var g = S('g', {}, mineG), D = { g: g, pts: pts, el: S('path', { stroke: '#0f0f10', 'stroke-width': HW < 760 ? 5 : 7 }, g) }; mine.push(g); settle(D); };   // used by the screenshot script

  /* ---------- the map ---------- */
  var U = 50, map = $('#net'), mapw = $('#mapw'), card = $('#card'), scr = $('#scr');
  var LN = { property: [0, [[2, 7], [23.5, 7]]], build: [1, [[1, 2], [8, 2], [13, 7], [16, 10], [26.2, 10]]], service: [2, [[13, .6], [13, 7]]], retail: [3, [[1, 12], [8, 12], [13, 7], [16.5, 3.5], [25.6, 3.5]]], software: [4, [[13, 7], [13, 12.6], [13.9, 13.5], [24.6, 13.5]]] };
  var ST = { recrm: [3, 7, 't'], reweb: [7.8, 7, 't'], estate: [18, 7, 't'], launch: [22.3, 7, 't'], interp: [2.2, 2, 't'], studio: [6, 2, 't'], quotes: [17.6, 10, 't'], interior: [20.3, 10, 't'], masonry: [23, 10, 't'], build: [25.6, 10, 't'], boxx: [13, 1.2, 'r'], gym: [13, 2.7, 'r'], resort: [13, 4.2, 'r'], ent: [2.4, 12, 'b'], revv: [6, 12, 'b'], store: [18, 3.5, 't'], orders: [21.2, 3.5, 't'], watch: [24.6, 3.5, 't'], crm: [13, 10.4, 'r'], stockroom: [13, 11.9, 'r'], work: [16.2, 13.5, 't'], saas: [19.8, 13.5, 't'], const: [23.6, 13.5, 't'] };
  var SHORT = { recrm: 'Real Estate CRM', reweb: 'Real Estate website' }, gL = S('g', {}, map), gT = S('g', {}, map), gS = S('g', {}, map), lines = [], nodes = [], hideT = 0, shown = -1;
  Object.keys(LN).forEach(function (k) {
    var L = LN[k], el = S('path', { class: 'ln', stroke: TR[L[0]][1], d: rpath(L[1].map(function (p) { return [p[0] * U, p[1] * U]; }), 30) }, gL);
    lines.push({ k: k, el: el, len: el.getTotalLength(), tr: [0, .5].map(function (o) { return { o: o, el: S('circle', { class: 'train', r: 5.5, fill: '#0f0f10' }, gT) }; }) });
  });
  S('circle', { class: 'hub', cx: 13 * U, cy: 7 * U, r: 15 }, gS);
  S('text', { class: 'hubt', x: 15.35 * U, y: 8.15 * U }, gS).textContent = 'One system';
  S('text', { class: 'hubs', x: 15.35 * U, y: 8.15 * U + 19 }, gS).textContent = 'where every line meets';
  function fill(i) {
    var w = W[i], t = TR[LN[w.trade][0]]; shown = i; card.style.setProperty('--c', t[1]); scr.textContent = '';
    if (w.img || w.card) {
      var im = new Image(); im.alt = '';
      if (w.img) im.addEventListener('load', function () { var dy = scr.clientHeight - im.clientHeight; if (dy < 0 && !reduce) { im.style.setProperty('--y', dy + 'px'); im.style.setProperty('--d', Math.max(6, w.a * 3.4) + 's'); im.classList.add('pan'); } });
      im.src = w.img ? 'img/' + w.img + '.webp' : 'img/cards/' + w.card + '.webp'; scr.appendChild(im);
    } else { var p = d.createElement('p'); p.textContent = 'Not launched publicly. Screens on request.'; scr.appendChild(p); }
    $('#cL').textContent = t[0] + ' line · ' + window.CATS[w.cat]; $('#cH').textContent = w.name; $('#cK').textContent = w.kind + ' · ' + w.status; $('#cT').textContent = w.blurb;
    var a = $('#cA'); a.href = w.href; a.textContent = w.cta;
  }
  function show(i) {
    clearTimeout(hideT); if (shown !== i || !card.classList.contains('on')) fill(i);
    nodes.forEach(function (n, k) { n.classList.toggle('on', k === i); });
    if (innerWidth > 760) {
      var r = nodes[i].querySelector('.dot').getBoundingClientRect(), b = mapw.getBoundingClientRect(), x = r.left + r.width / 2 - b.left, y = r.top + r.height / 2 - b.top;
      card.style.left = (x < b.width * .56 ? x + 28 : x - 330 - 28) + 'px'; card.style.top = Math.max(-40, Math.min(y - 170, b.height - 400)) + 'px';
    }
    card.classList.add('on');
  }
  function hide(now) { clearTimeout(hideT); hideT = setTimeout(function () { card.classList.remove('on'); nodes.forEach(function (n) { n.classList.remove('on'); }); }, now ? 0 : 260); }
  W.forEach(function (w, i) {
    var p = ST[w.id], x = p[0] * U, y = p[1] * U, a = S('a', { class: 'st', href: w.href, 'aria-label': w.name + ', ' + w.kind + '. ' + w.status + '.' }, gS), t;
    a.dataset.t = w.trade; S('circle', { class: 'hit', cx: x, cy: y, r: 21 }, a); S('circle', { class: 'dot', cx: x, cy: y, r: 8.5, stroke: w.cat === 'client' ? '#0f0f10' : TR[LN[w.trade][0]][1] }, a);
    t = S('text', p[2] === 'r' ? { x: x + 18, y: y + 5 } : { x: x, y: p[2] === 'b' ? y + 31 : y - 17, 'text-anchor': 'middle' }, a); t.textContent = SHORT[w.id] || w.name;
    a.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') show(i); }); a.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hide(); });
    a.addEventListener('focus', function () { show(i); }); a.addEventListener('blur', function () { if (innerWidth > 760) hide(); });
    a.addEventListener('click', function (e) { if (coarse || innerWidth <= 760) { e.preventDefault(); show(i); } });
    nodes.push(a);
  });
  card.addEventListener('pointerenter', function () { clearTimeout(hideT); }); card.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hide(); });
  $('#cx').addEventListener('click', function () { hide(true); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(true); });
  var maps = $('#maps'); if (maps.scrollWidth > maps.clientWidth) maps.scrollLeft = (maps.scrollWidth - maps.clientWidth) * .42;

  /* legend + line guide */
  var legend = $('#legend'), guide = $('#guide'), only = '';
  function dim() { lines.forEach(function (l) { var off = only && l.k !== only; l.el.classList.toggle('dim', !!off); l.tr.forEach(function (t) { t.el.classList.toggle('dim', !!off); }); }); nodes.forEach(function (n) { n.classList.toggle('dim', !!only && n.dataset.t !== only); }); [].forEach.call(legend.children, function (b) { b.setAttribute('aria-pressed', b.dataset.k === only); }); }
  [['', 'All lines', '#0f0f10']].concat(Object.keys(LN).map(function (k) { return [k, TR[LN[k][0]][0], TR[LN[k][0]][1]]; })).forEach(function (x) {
    var b = d.createElement('button'), n = x[0] ? W.filter(function (w) { return w.trade === x[0]; }).length : W.length; b.type = 'button'; b.dataset.k = x[0]; b.style.setProperty('--c', x[2]);
    b.appendChild(d.createTextNode(x[1] + ' ')); var sp = d.createElement('span'); sp.textContent = n; b.appendChild(sp); b.setAttribute('aria-pressed', !x[0]);
    b.addEventListener('click', function () { only = x[0]; dim(); }); legend.appendChild(b);
    if (!x[0]) return;
    var col = d.createElement('div'), h = d.createElement('h3'), ol = d.createElement('ol'); col.style.setProperty('--c', x[2]); h.textContent = x[1]; col.appendChild(h); col.appendChild(ol);
    W.filter(function (w) { return w.trade === x[0]; }).sort(function (a, c) { return ST[a.id][0] + ST[a.id][1] * .01 - ST[c.id][0] - ST[c.id][1] * .01; }).forEach(function (w) {
      var li = d.createElement('li'), a = d.createElement('a'), s = d.createElement('small'); if (w.cat === 'client') li.className = 'cw'; a.href = w.href; a.textContent = w.name; s.textContent = w.kind + ' · ' + w.status; a.appendChild(s); li.appendChild(a); ol.appendChild(li);
    });
    guide.appendChild(col);
  });

  /* trains run only while the map is on screen */
  var mapOn = false, tr = 0, t0 = 0;
  function trains(now) { if (!mapOn) { tr = 0; return; } tr = requestAnimationFrame(trains); t0 = t0 || now; var t = (now - t0) / 1000; lines.forEach(function (l) { l.tr.forEach(function (x) { var p = l.el.getPointAtLength(l.len * ((x.o + t * 70 / l.len) % 1)); x.el.setAttribute('cx', p.x); x.el.setAttribute('cy', p.y); }); }); }
  lines.forEach(function (l) { l.tr.forEach(function (x) { var p = l.el.getPointAtLength(l.len * (x.o + .2) % l.len); x.el.setAttribute('cx', p.x); x.el.setAttribute('cy', p.y); }); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.target === map) { mapOn = e.isIntersecting && !reduce; if (mapOn && !tr) tr = requestAnimationFrame(trains); } else if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    io.observe(map); [].forEach.call(d.querySelectorAll('.rv'), function (el) { io.observe(el); });
  } else [].forEach.call(d.querySelectorAll('.rv'), function (el) { el.classList.add('in'); });

  var copy = $('#copy'); copy.addEventListener('click', function () { var done = function () { copy.textContent = 'Copied'; setTimeout(function () { copy.textContent = 'Copy the address'; }, 1800); }; if (navigator.clipboard) navigator.clipboard.writeText('contact.abbytes@gmail.com').then(done, done); else done(); });
  var rT = 0, lw = innerWidth; addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(function () { if (innerWidth === lw) return; lw = innerWidth; mine.forEach(function (g) { g.remove(); }); mine = []; layout(); }, 160); });
  function boot() { layout(); if (reduce) { T = 1; draw(); } else setTimeout(function () { to(1); }, 700); }
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(boot, boot); else boot();
})();
