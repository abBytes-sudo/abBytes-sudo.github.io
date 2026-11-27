/* Ghatika home: wind the Prahar, then take it apart. The exploded view is live three.js where the device has a graphics card,
   and a pre-rendered image sequence of the same scene everywhere else, scrubbed by the same scroll with the same callouts.
   Reduced motion gets seven still chapters. Also: the ghati that sinks as you scroll, and the dial preview. */
(function () {
  'use strict';
  var D = window.GH_DATA, G = window.GH, $ = G.$, $$ = G.$$, reduce = G.reduce;
  var coarse = matchMedia('(pointer: coarse)').matches;

  // ---------- dial preview
  var dots = $('#teaseDots'), timg = $('#teaseImg');
  if (dots) {
    dots.innerHTML = D.DIALS.map(function (d, i) { return '<button class="dot" type="button" style="--c:' + d.c + '" aria-pressed="' + (i === 0) + '" data-d="' + d.id + '" aria-label="' + d.name + '"><i></i></button>'; }).join('');
    var cache = {};
    $$('button', dots).forEach(function (b) {
      var src = 'img/dial-' + b.dataset.d + '.webp';
      b.addEventListener('pointerenter', function () { if (!cache[src]) { cache[src] = new Image(); cache[src].src = src; } });
      b.addEventListener('click', function () {
        $$('button', dots).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        timg.style.opacity = 0;
        setTimeout(function () { timg.src = src; timg.alt = 'Prahar with a ' + G.optName('DIALS', b.dataset.d) + ' dial'; timg.onload = function () { timg.style.opacity = 1; }; }, reduce ? 0 : 280);
      });
    });
  }

  // ---------- the ghati sinks as you scroll
  var bowl = $('#bowl'), fill = $('#fill'), tmin = $('#tmin'), tbar = $('#tbar'), art = $('.ghati-art');
  if (bowl && art) {
    var upd = function () {
      var r = art.getBoundingClientRect(), t = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (innerHeight * 0.85)));
      var sink = t < 0.82 ? t / 0.82 * 0.25 : 0.25 + (t - 0.82) / 0.18 * 0.75;
      bowl.setAttribute('transform', 'translate(0 ' + (sink * 140).toFixed(1) + ')');
      fill.setAttribute('ry', (5 + t * 22).toFixed(1)); fill.setAttribute('rx', (40 + t * 14).toFixed(1)); fill.setAttribute('cy', (198 + t * 18).toFixed(1));
      var mins = t * 24; tmin.textContent = String(Math.floor(mins)).padStart(2, '0') + ':' + String(Math.floor((mins % 1) * 60)).padStart(2, '0');
      tbar.setAttribute('width', (t * 340).toFixed(1));
    };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  var sec = $('#reveal'), stage = $('#stage'), canvas = $('#watch3d');
  if (!sec || !canvas) return;

  // ---------- winding: the power-reserve complication and the crown
  var W = window.GHWind, crownBtn = $('#crownHit'), windRoot = $('#wind');
  var api = null, seq = null, grabbing = false, loupeOff = 0, lastAnchors = null;
  function placeLoupe(on) {
    if (!api || !lastAnchors || !lastAnchors.crown) return;
    var Wd = stage.clientWidth, H = stage.clientHeight, c = lastAnchors.crown, nl = Wd < 760;
    var r = nl ? Math.min(92, Wd * 0.24) : Math.min(150, H * 0.17);
    var x = nl ? Math.min(Wd - r - 14, c[0] - r * 0.2) : Math.min(Wd - r - 24, c[0] + r * 0.55), y = Math.min(H - r - 16, c[1] + (nl ? r * 1.35 : r * 1.25));
    api.loupe({ on: on, x: x, y: y, r: r });
  }
  if (W && windRoot) {
    W.attach({ root: windRoot, crown: crownBtn, button: $('#windBtn'), sound: $('#sndBtn'), arcFill: $('#prFill'), hand: $('#prHand'), value: $('#prVal'), live: $('#prLive'),
      onGrab: function (on) { grabbing = on; clearTimeout(loupeOff); if (!on) loupeOff = setTimeout(function () { if (api) api.loupe({ on: false }); }, 1600); else placeLoupe(true); windRoot.classList.add('touched'); if (crownBtn) crownBtn.classList.add('touched'); },
      onChange: function (r, run, crown, ratchet) { if (api) api.wind(crown, ratchet); } });
  }

  // ---------- callouts
  var CO = [
    { k: 'crystal', a: 0.08, b: 0.19, n: '01 · Crystal', t: 'Domed sapphire', d: 'A 1.1 mm dome, anti-reflective on the inside only, so the outside never scuffs cloudy.' },
    { k: 'hands', a: 0.15, b: 0.27, n: '02 · Hands', t: 'Dauphine, faceted', d: 'Two facets per hand, polished on a tin wheel until they catch the light from any angle.' },
    { k: 'dial', a: 0.24, b: 0.35, n: '03 · Dial', t: 'Lehariya guilloché', d: 'Cut in 120 passes on a 1931 rose engine. The waves come from the monsoon turbans of Mewar.' },
    { k: 'macroA', fixed: true, a: 0.355, b: 0.475, n: '×40 · Dial', t: 'Forty times closer', d: 'Each ridge is one pass of the cutter, 0.13 mm from the next. The light finds every one.' },
    { k: 'case', a: 0.48, b: 0.58, n: '04 · Case', t: '39 mm, 9.8 mm thin', d: 'Brushed flanks, a polished bevel, and lugs that curve down to meet the wrist.' },
    { k: 'movement', a: 0.565, b: 0.655, n: '05 · Balance', t: 'Six beats a second', d: 'A free-sprung balance regulated in five positions, to within four seconds a day.' },
    { k: 'macroB', fixed: true, a: 0.655, b: 0.775, n: '×40 · Bridge', t: 'Bevelled by hand', d: 'Every edge filed to 45° and polished on gentian wood until it is a mirror. Côtes de Genève on the faces.' },
    { k: 'macroC', fixed: true, a: 0.775, b: 0.86, n: '×40 · Screw', t: 'Heated to 290 °C', d: 'Each screw is polished, then warmed on a brass tray until it turns cornflower blue.' },
    { k: 'strap', a: 0.86, b: 0.93, n: '07 · Strap', t: 'Vegetable-tanned calf', d: 'Cut and saddle-stitched in Jodhpur. It softens to your wrist in about a month.' },
    { k: 'caseback', a: 0.9, b: 0.975, n: '08 · Caseback', t: 'Numbered, signed inside', d: 'Sapphire, so the movement stays on show. Your watchmaker’s initials sit beneath it.' }
  ];
  var CH = [0, 0.08, 0.3, 0.48, 0.57, 0.84, 0.97];
  var host = $('#callouts'), svg = $('#leaders'), NS = 'http://www.w3.org/2000/svg', scale = $('#scale'), vign = $('#vign');
  CO.forEach(function (c) {
    c.el = document.createElement('div'); c.el.className = 'co' + (c.fixed ? ' co-fixed' : '');
    c.el.innerHTML = '<p class="k"><span>' + c.n + '</span></p><h3></h3><p></p>'; host.appendChild(c.el);
    c.h = $('h3', c.el); c.p = $('p:last-child', c.el); c.typed = -1;
    c.line = document.createElementNS(NS, 'polyline'); c.line.setAttribute('fill', 'none'); c.line.setAttribute('stroke', '#c9ad7c'); c.line.setAttribute('stroke-width', '1'); svg.appendChild(c.line);
    c.dot = document.createElementNS(NS, 'circle'); c.dot.setAttribute('r', '4'); svg.appendChild(c.dot);
  });
  var heroCopy = $('#heroCopy'), rail = $('#chapters'), chapters = $$('#chapters span'), endEl = $('#revealEnd'), endCta = $('#endCta'), top = $('.hero-top'), hdr = $('.hdr');
  function prog() { var r = sec.getBoundingClientRect(), span = r.height - innerHeight; return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0; }
  var p = prog();
  function chrome(pp) {
    var hf = Math.max(0, 1 - pp / 0.05);
    var below = Math.max(0, stage.getBoundingClientRect().bottom - innerHeight); // the part of the stage still under the fold at load
    heroCopy.style.opacity = hf; heroCopy.style.transform = 'translateY(' + (-30 * (1 - hf) - below).toFixed(1) + 'px)'; heroCopy.style.visibility = hf < 0.02 ? 'hidden' : '';
    if (top) top.style.opacity = hf;
    if (crownBtn) { crownBtn.hidden = hf < 0.5; if (hf < 0.5 && api) api.loupe({ on: false }); }
    if (rail) rail.classList.toggle('on', pp > 0.02); // the rail waits until you scroll, so the crown has the hero to itself
    var ci = 0; CH.forEach(function (v, i) { if (pp >= v) ci = i; }); chapters.forEach(function (s, i) { s.classList.toggle('on', i === ci); });
    var on = pp > 0.95; endEl.classList.toggle('on', on); endCta.tabIndex = on ? 0 : -1;
    if (hdr) hdr.classList.toggle('clear', pp < 0.02);
    if (W) W.setActive(pp < 0.06);
  }
  function onScroll() { p = prog(); if (api) api.setProgress(p); if (seq) seq.draw(p); chrome(p); }
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); chrome(p);

  var narrow = function () { return innerWidth < 760; };
  // portrait: the band between the header and the headline, where the resting watch must fit (measured at rest only)
  var band = null;
  function measureBand() {
    if (p > 0.02) return band; var r = stage.getBoundingClientRect(), port = r.width / r.height < 0.95;
    if (!port) return (band = null);
    var hb = hdr ? Math.max(hdr.offsetHeight, hdr.getBoundingClientRect().bottom - r.top) : 64, ct = heroCopy.getBoundingClientRect().top - r.top;
    if (top && top.offsetParent) hb = Math.max(hb, top.getBoundingClientRect().bottom - r.top); // tablets keep the "since 2019" line
    return (band = [Math.max(0, hb) + 10, ct - 16]);
  }
  addEventListener('resize', function () { measureBand(); if (api && api.setBand) api.setBand(band ? band[0] : null, band ? band[1] : 0); });
  // the phone poster (frame 0 of the sequence) gets the same fit, so nothing jumps when the 3D or the sequence takes over
  var poster = $('.poster', stage);
  function fitPoster() {
    if (!poster) return; measureBand();
    var on = !!band && /poster-m/.test(poster.currentSrc || '') && poster.naturalWidth > 0; poster.classList.toggle('fit', on);
    if (!on) { poster.style.transform = ''; return; }
    var W2 = stage.clientWidth, H2 = stage.clientHeight, s = Math.max(W2 / poster.naturalWidth, H2 / poster.naturalHeight), fw = poster.naturalWidth * s, fh = poster.naturalHeight * s;
    var cy0 = (H2 - fh) / 2 + 0.3 * fh, z = Math.min(1, (band[1] - band[0]) * 0.94 / (0.827 * fw)), yc = (band[0] + band[1]) / 2;
    poster.style.transformOrigin = '50% ' + cy0.toFixed(1) + 'px'; poster.style.transform = 'translateY(' + (yc - cy0).toFixed(1) + 'px) scale(' + z.toFixed(4) + ')';
  }
  if (poster) { if (poster.complete) fitPoster(); else poster.addEventListener('load', fitPoster); addEventListener('resize', fitPoster); if (document.fonts) document.fonts.ready.then(fitPoster); }
  function type(c, local) {
    var full = c.t.length + c.d.length, n = Math.round(Math.min(1, local / 0.42) * full);
    if (n !== c.typed) { c.typed = n; c.h.innerHTML = G.esc(c.t.slice(0, Math.min(n, c.t.length))) + (n < c.t.length ? '<span class="caret"></span>' : ''); c.p.innerHTML = n > c.t.length ? G.esc(c.d.slice(0, n - c.t.length)) + (n < full ? '<span class="caret"></span>' : '') : ''; }
  }
  // anchors: { key: [x, y, inFront] } in stage px; info: { macro: 0..1, mmPx }
  function layout(anchors, pp, info) {
    lastAnchors = anchors; if (grabbing) placeLoupe(true);
    var Wd = stage.clientWidth, H = stage.clientHeight, m = Math.max(20, Wd * 0.05), nar = narrow();
    // the crown target sits over the 3D crown while the watch is at rest
    if (crownBtn && anchors.crown) { crownBtn.style.transform = 'translate(' + Math.round(anchors.crown[0] - 32) + 'px,' + Math.round(anchors.crown[1] - 32) + 'px)'; crownBtn.dataset.placed = '1'; }
    // on a phone only the latest callout shows, so two never overlap
    var latest = -1; if (nar) CO.forEach(function (c, i) { if (pp > c.a && pp < c.b) latest = i; });
    CO.forEach(function (c, i) {
      var a = anchors[c.k], local = (pp - c.a) / (c.b - c.a), vis = (c.fixed || a) && local > 0 && local < 1 && (!nar || i === latest);
      c.el.classList.toggle('on', !!vis); c.line.style.display = c.dot.style.display = vis && !c.fixed ? '' : 'none';
      if (!vis) { c.el.style.opacity = ''; c.line.style.opacity = c.dot.style.opacity = ''; if (local <= 0 && c.typed !== 0) { c.h.textContent = ''; c.p.textContent = ''; c.typed = 0; } return; }
      var fade = local > 0.86 ? 1 - (local - 0.86) / 0.14 : local < 0.06 ? local / 0.06 : 1; c.el.style.opacity = fade; c.line.style.opacity = c.dot.style.opacity = fade;
      type(c, local);
      var bw = c.el.offsetWidth, bx, by, ex, ey, pts;
      if (c.fixed) {
        bx = m; by = nar ? Math.max(84, H * 0.12) : H * 0.56;
        c.el.style.transform = 'translate(' + Math.round(bx) + 'px,' + Math.round(by) + 'px)'; return;
      }
      if (nar) {
        bx = m; by = c.k === 'strap' || c.k === 'caseback' ? H * 0.62 : Math.max(84, H * 0.12); if (by + 170 > H) by = H - 190;
        ex = bx + 8; ey = by > H * 0.5 ? by - 10 : by + c.el.offsetHeight + 8;
        pts = [a[0], a[1], a[0], ey, ex, ey];
      } else {
        var right = a[0] > Wd * 0.5; bx = right ? Math.min(Wd - bw - m, a[0] + 110) : Math.max(m, a[0] - 110 - bw);
        by = Math.min(H - 220, Math.max(110, a[1] - 70));
        ex = right ? bx - 14 : bx + bw + 14; ey = by + 22; var mid = right ? ex - 30 : ex + 30;
        pts = [a[0], a[1], mid, ey, ex, ey];
      }
      c.el.style.transform = 'translate(' + Math.round(bx) + 'px,' + Math.round(by) + 'px)';
      c.line.setAttribute('points', pts.join(' ')); c.dot.setAttribute('cx', a[0]); c.dot.setAttribute('cy', a[1]);
    });
    // forty times closer: a vignette and a real scale bar (1 mm at the surface in focus)
    var mk = info ? info.macro : 0;
    if (vign) vign.style.opacity = (mk * 0.85).toFixed(3);
    if (scale) {
      scale.style.opacity = mk > 0.6 ? ((mk - 0.6) / 0.4).toFixed(3) : 0;
      if (mk > 0.6 && info.mmPx) { var px = Math.round(info.mmPx), half = px > Wd * 0.4; scale.style.setProperty('--w', (half ? Math.round(px / 2) : px) + 'px'); scale.querySelector('span').textContent = half ? '0.5 mm' : '1 mm'; }
    }
  }

  // ---------- reduced motion: seven still chapters (their images load only here)
  if (reduce) {
    document.documentElement.classList.add('no3d'); fitPoster();
    $$('#revealList source[data-srcset]').forEach(function (s) { s.srcset = s.dataset.srcset; });
    $$('#revealList img[data-src]').forEach(function (im) { im.src = im.dataset.src; });
    return;
  }

  // ---------- the image sequence (no graphics card): same scroll, same callouts
  function startSeq() {
    if (seq) return; stage.classList.add('seq');
    var c2 = document.createElement('canvas'); c2.className = 'seqc'; c2.setAttribute('aria-hidden', 'true'); stage.insertBefore(c2, canvas.nextSibling);
    var g = c2.getContext('2d'), port = stage.clientWidth / stage.clientHeight < 0.95, set = port ? 'port' : 'land', data = null, imgs = [], n = 0, cur = -1;
    function size() { measureBand(); var r = stage.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); c2.width = Math.round(r.width * d); c2.height = Math.round(r.height * d); c2.style.width = r.width + 'px'; c2.style.height = r.height + 'px'; cur = -1; draw(p); }
    function fit(im, pp) {
      var cw = c2.width, ch = c2.height, s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s, f = { x: (cw - w) / 2, y: (ch - h) / 2, w: w, h: h };
      if (set !== 'port' || !band) return f;
      var k = 1 - Math.min(1, Math.max(0, pp / 0.1)); k = k * k * (3 - 2 * k); if (k <= 0) return f;
      var d = c2.width / stage.clientWidth, b0 = band[0] * d, b1 = band[1] * d, wh = 0.827 * f.w, cy0 = f.y + 0.3 * f.h, cx = f.x + 0.5 * f.w;
      var z = 1 + (Math.min(1, (b1 - b0) * 0.94 / wh) - 1) * k, cy = cy0 + ((b0 + b1) / 2 - cy0) * k;
      return { x: cx - (cx - f.x) * z, y: cy - (cy0 - f.y) * z, w: f.w * z, h: f.h * z };
    }
    function feather(f) { // fade the frame's edges that sit inside the canvas, so no rectangle shows
      var W2 = c2.width, H2 = c2.height, e = Math.min(f.w, f.h) * 0.14, q = [];
      if (f.x > 0) q.push([f.x, 0, f.x + e, 0, f.x, f.y, e, f.h]);
      if (f.x + f.w < W2) q.push([f.x + f.w, 0, f.x + f.w - e, 0, f.x + f.w - e, f.y, e, f.h]);
      if (f.y > 0) q.push([0, f.y, 0, f.y + e, f.x, f.y, f.w, e]);
      if (f.y + f.h < H2) q.push([0, f.y + f.h, 0, f.y + f.h - e, f.x, f.y + f.h - e, f.w, e]);
      g.save(); g.globalCompositeOperation = 'destination-out';
      q.forEach(function (r) { var gr = g.createLinearGradient(r[0], r[1], r[2], r[3]); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(r[4], r[5], r[6], r[7]); });
      g.restore();
    }
    function nearest(i) { for (var d = 0; d < n; d++) { if (imgs[i - d] && imgs[i - d].ok) return i - d; if (imgs[i + d] && imgs[i + d].ok) return i + d; } return -1; }
    function draw(pp) {
      if (!data) return; var i = Math.round(pp * (n - 1)), j = nearest(i); if (j < 0) return;
      var f = fit(imgs[j], pp), moving = set === 'port' && band && pp < 0.1;
      if (j !== cur || moving) { cur = j; var cover = f.x <= 0 && f.y <= 0 && f.x + f.w >= c2.width && f.y + f.h >= c2.height; if (!cover) g.clearRect(0, 0, c2.width, c2.height); g.drawImage(imgs[j], f.x, f.y, f.w, f.h); if (!cover) feather(f); stage.classList.add('live'); }
      var A = data[set][i], dpr = c2.width / stage.clientWidth, out = {};
      for (var k in A) out[k] = [(f.x + A[k][0] * f.w) / dpr, (f.y + A[k][1] * f.h) / dpr, A[k][2] === 1];
      layout(out, pp, { macro: data.macro[i], mmPx: data.mmPx[set][i] * f.h / dpr });
    }
    function want(i) { if (imgs[i]) return imgs[i]; var im = new Image(); imgs[i] = im; im.decoding = 'async'; im.onload = function () { im.ok = true; if (Math.abs(i - Math.round(p * (n - 1))) < 9) draw(p); }; im.src = 'img/seq/' + set + '/f' + String(i).padStart(3, '0') + '.webp'; return im; }
    // load coarse to fine, nearest to the current scroll first, four at a time
    function pump() {
      var queue = [], here = Math.round(p * (n - 1));
      [8, 4, 2, 1].forEach(function (stp) { var list = []; for (var i = 0; i < n; i += stp) list.push(i); list.sort(function (a, b) { return Math.abs(a - here) - Math.abs(b - here); }); list.forEach(function (i) { if (queue.indexOf(i) < 0) queue.push(i); }); });
      var busy = 0; (function next() { while (busy < 4 && queue.length) { var i = queue.shift(); if (imgs[i]) continue; busy++; var im = want(i); im.addEventListener('load', function () { busy--; next(); }); im.addEventListener('error', function () { busy--; next(); }); } })();
    }
    var started = false;
    fetch('img/seq/anchors.json').then(function (r) { return r.json(); }).then(function (j) {
      data = j; n = j.n; want(0).addEventListener('load', size);
      var go = function () { if (started) return; started = true; ['scroll', 'wheel', 'touchstart', 'keydown'].forEach(function (e) { removeEventListener(e, go); }); pump(); };
      if (p > 0.01) go(); else ['scroll', 'wheel', 'touchstart', 'keydown'].forEach(function (e) { addEventListener(e, go, { passive: true }); });
    }).catch(function () { document.documentElement.classList.add('no3d'); });
    addEventListener('resize', function () {
      var np = stage.clientWidth / stage.clientHeight < 0.95;
      if (np !== port && data) { port = np; set = port ? 'port' : 'land'; imgs = []; cur = -1; want(0).addEventListener('load', size); if (started) pump(); } else size();
    });
    seq = { draw: draw };
  }

  // ---------- the live 3D
  function boot() {
    if (boot.done) return; boot.done = true;
    if (!G.gpuOK()) { startSeq(); return; }
    var s = document.createElement('script'); s.src = '../assets/watch3d.js?v=10'; s.async = true;
    s.onload = function () {
      try {
        api = window.Ghatika3D.mount(canvas, { mode: 'explode', model: 'prahar', dial: 'pichola', metal: 'steel', strap: 'cognac', hdr: 'hdri/studio.hdr', backdrop: true, onFrame: layout, timeFn: W ? W.timeFn : null });
        measureBand(); if (band) api.setBand(band[0], band[1]);
        api.setProgress(p); if (W) { var a = W.angles(); api.wind(a.crown, a.ratchet); }
        api.ready.then(function () { stage.classList.add('live'); });
      } catch (e) { startSeq(); }
    };
    s.onerror = function () { startSeq(); };
    document.head.appendChild(s);
  }
  var EV = ['pointerdown', 'pointermove', 'scroll', 'keydown', 'wheel', 'touchstart'];
  function kick() { EV.forEach(function (n) { removeEventListener(n, kick); }); boot(); }
  // phones start the 3D on the first touch or scroll (the poster already shows the same watch, fitted the same way), so the
  // shader compile never lands while someone is reading; desktops also start it after a few idle seconds
  function arm() { EV.forEach(function (n) { addEventListener(n, kick, { once: true, passive: true }); }); if (!coarse) setTimeout(kick, 4500); }
  if (document.readyState === 'complete') arm(); else addEventListener('load', arm);
})();
