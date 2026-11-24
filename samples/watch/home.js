/* Ghatika home: the scroll-scrubbed exploded view (three.js), typed callouts, the ghati, and the editorial sections. */
(function () {
  'use strict';
  var D = window.GH_DATA, G = window.GH, $ = G.$, $$ = G.$$, reduce = G.reduce;
  var coarse = matchMedia('(pointer: coarse)').matches;

  // ---------- content blocks (rendered before motion.js wires the staggers)
  var models = $('#models');
  if (models) models.innerHTML = Object.keys(D.MODELS).map(function (k, i) {
    var m = D.MODELS[k];
    return '<article class="mcard"><div class="ph arch"><img src="' + m.img + '" alt="' + m.name + ', ' + G.cfgLine(m.sig) + '" width="960" height="1200" loading="lazy" decoding="async"><span class="tag k">0' + (i + 1) + ' · ' + m.ref + '</span></div>' +
      '<div class="meta"><h3>' + m.name + '<span class="nick">' + (k === 'prahar' ? 'hand-wound' : k === 'nimisha' ? 'moon' : 'GMT') + '</span></h3><span class="price">from ' + G.lakh(m.price) + '</span></div><p class="desc">' + m.tagline + ' ' + m.line + '.</p>' +
      '<a class="cover" href="watch.html?m=' + k + '" aria-label="Configure ' + m.name + '"></a></article>';
  }).join('');
  var bq = $('#bqList');
  if (bq) bq.innerHTML = D.BOUTIQUES.map(function (b) {
    return '<div class="bq"><p class="k">' + b.area + '</p><h3>' + b.city + '</h3><p>' + b.note + '</p><p class="k" style="margin-top:8px">' + b.hours + '</p><a class="lnk" href="boutiques.html?b=' + b.id + '#book">Book ' + b.city + ' <span class="ar" aria-hidden="true">→</span></a></div>';
  }).join('');
  var jg = $('#jgrid');
  if (jg) jg.innerHTML = D.JOURNAL.slice(0, 3).map(function (j) {
    return '<article class="jcard"><div class="ph"><img src="' + j.img + '" srcset="' + j.img.replace('.jpg', '-s.jpg') + ' 760w, ' + j.img + ' 1500w" sizes="(max-width: 900px) 92vw, 30vw" alt="' + j.alt + '" width="900" height="600" loading="lazy" decoding="async"></div><p class="k">' + j.cat + ' · ' + j.read + ' min read</p><h3>' + j.title + '</h3><p>' + j.dek + '</p><a class="cover" href="article-' + j.id + '.html" aria-label="Read: ' + j.title + '"></a></article>';
  }).join('');
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

  // ---------- the reveal
  var sec = $('#reveal'), stage = $('#stage'), canvas = $('#watch3d');
  if (!sec || !canvas) return;
  if (reduce) { document.documentElement.classList.add('no3d'); return; }

  var CO = [
    { k: 'crystal', a: 0.13, b: 0.29, n: '01 · Crystal', t: 'Domed sapphire', d: 'A 1.1 mm dome, anti-reflective on the inside only, so the outside never scuffs cloudy.' },
    { k: 'hands', a: 0.26, b: 0.41, n: '02 · Hands', t: 'Dauphine, faceted', d: 'Two facets per hand, polished on a tin wheel until they catch the light from any angle.' },
    { k: 'dial', a: 0.38, b: 0.52, n: '03 · Dial', t: 'Lehariya guilloché', d: 'Cut in 120 passes on a 1931 rose engine. The waves come from the monsoon turbans of Mewar.' },
    { k: 'case', a: 0.5, b: 0.62, n: '04 · Case', t: '39 mm, 9.8 mm thin', d: 'Brushed flanks, a polished bevel, and lugs that curve down to meet the wrist.' },
    { k: 'movement', a: 0.63, b: 0.74, n: '05 · Balance', t: 'Six beats a second', d: 'A free-sprung balance regulated in five positions, to within four seconds a day.' },
    { k: 'bridges', a: 0.71, b: 0.83, n: '06 · Calibre GH-01', t: 'Finished by hand', d: 'Côtes de Genève, bevelled edges, blued screws and 21 rubies. Four hours of bevelling alone.' },
    { k: 'strap', a: 0.8, b: 0.9, n: '07 · Strap', t: 'Vegetable-tanned calf', d: 'Cut and saddle-stitched in Jodhpur. It softens to your wrist in about a month.' },
    { k: 'caseback', a: 0.86, b: 0.95, n: '08 · Caseback', t: 'Numbered, signed inside', d: 'Sapphire, so the movement stays on show. Your watchmaker’s initials sit beneath it.' }
  ];
  var CH = [0, 0.13, 0.38, 0.5, 0.63, 0.8, 0.95];
  var host = $('#callouts'), svg = $('#leaders'), NS = 'http://www.w3.org/2000/svg';
  CO.forEach(function (c) {
    c.el = document.createElement('div'); c.el.className = 'co';
    c.el.innerHTML = '<p class="k"><span>' + c.n + '</span></p><h3></h3><p></p>'; host.appendChild(c.el);
    c.h = $('h3', c.el); c.p = $('p:last-child', c.el); c.typed = -1;
    c.line = document.createElementNS(NS, 'polyline'); c.line.setAttribute('fill', 'none'); c.line.setAttribute('stroke', '#c9a25a'); c.line.setAttribute('stroke-width', '1'); svg.appendChild(c.line);
    c.dot = document.createElementNS(NS, 'circle'); c.dot.setAttribute('r', '4'); svg.appendChild(c.dot);
  });
  var heroCopy = $('#heroCopy'), chapters = $$('#chapters span'), endEl = $('#revealEnd'), endCta = $('#endCta'), top = $('.hero-top'), cue = $('.scrollcue');
  var hdr = $('.hdr');
  function prog() { var r = sec.getBoundingClientRect(), span = r.height - innerHeight; return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0; }
  var api = null, p = prog();
  function chrome(pp) {
    var hf = Math.max(0, 1 - pp / 0.07);
    heroCopy.style.opacity = hf; heroCopy.style.transform = 'translateY(' + (-40 * (1 - hf)) + 'px)'; heroCopy.style.visibility = hf < 0.02 ? 'hidden' : '';
    top.style.opacity = hf;
    var ci = 0; CH.forEach(function (v, i) { if (pp >= v) ci = i; }); chapters.forEach(function (s, i) { s.classList.toggle('on', i === ci); });
    var on = pp > 0.95; endEl.classList.toggle('on', on); endCta.tabIndex = on ? 0 : -1;
    if (hdr) hdr.classList.toggle('clear', pp < 0.02 || pp > 0.999 ? pp < 0.02 : true);
  }
  function onScroll() { p = prog(); if (api) api.setProgress(p); chrome(p); }
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); chrome(p);

  var narrow = function () { return innerWidth < 760; };
  function layout(anchors, pp) {
    var W = stage.clientWidth, H = stage.clientHeight, m = Math.max(20, W * 0.05);
    CO.forEach(function (c) {
      var a = anchors[c.k], local = (pp - c.a) / (c.b - c.a), vis = a && local > 0 && local < 1;
      c.el.classList.toggle('on', !!vis); c.line.style.display = c.dot.style.display = vis ? '' : 'none';
      if (!vis) { c.el.style.opacity = ''; c.line.style.opacity = c.dot.style.opacity = ''; if (local <= 0 && c.typed !== 0) { c.h.textContent = ''; c.p.textContent = ''; c.typed = 0; } return; }
      var fade = local > 0.86 ? 1 - (local - 0.86) / 0.14 : 1; c.el.style.opacity = fade; c.line.style.opacity = c.dot.style.opacity = fade;
      var full = c.t.length + c.d.length, n = Math.round(Math.min(1, local / 0.42) * full);
      if (n !== c.typed) { c.typed = n; c.h.innerHTML = G.esc(c.t.slice(0, Math.min(n, c.t.length))) + (n < c.t.length ? '<span class="caret"></span>' : ''); c.p.innerHTML = n > c.t.length ? G.esc(c.d.slice(0, n - c.t.length)) + (n < full ? '<span class="caret"></span>' : '') : ''; }
      var bw = c.el.offsetWidth, bx, by, ex, ey, pts;
      if (narrow()) {
        bx = m; by = c.k === 'strap' || c.k === 'caseback' ? H * 0.64 : H * 0.11; if (by + 170 > H) by = H - 190;
        ex = bx + 8; ey = by > H * 0.5 ? by - 10 : by + c.el.offsetHeight + 8;
        pts = [a[0], a[1], a[0], ey, ex, ey];
      } else {
        var right = a[0] > W * 0.5; bx = right ? Math.min(W - bw - m, a[0] + 110) : Math.max(m, a[0] - 110 - bw);
        by = Math.min(H - 220, Math.max(110, a[1] - 70));
        ex = right ? bx - 14 : bx + bw + 14; ey = by + 22; var mid = right ? ex - 30 : ex + 30;
        pts = [a[0], a[1], mid, ey, ex, ey];
      }
      c.el.style.transform = 'translate(' + Math.round(bx) + 'px,' + Math.round(by) + 'px)';
      c.line.setAttribute('points', pts.join(' ')); c.dot.setAttribute('cx', a[0]); c.dot.setAttribute('cy', a[1]);
    });
  }

  function boot() {
    if (boot.done) return; boot.done = true;
    if (!G.gpuOK()) { document.documentElement.classList.add('no3d'); return; }
    var s = document.createElement('script'); s.src = '../assets/watch3d.js?v=7'; s.async = true;
    s.onload = function () {
      try {
        api = window.Ghatika3D.mount(canvas, { mode: 'explode', model: 'prahar', dial: 'pichola', metal: 'steel', strap: 'cognac', hdr: 'hdri/studio.hdr', onFrame: layout });
        api.setProgress(p);
        api.ready.then(function () { stage.classList.add('live'); });
      } catch (e) { document.documentElement.classList.add('no3d'); }
    };
    s.onerror = function () { document.documentElement.classList.add('no3d'); };
    document.head.appendChild(s);
  }
  var EV = ['pointerdown', 'pointermove', 'scroll', 'keydown', 'wheel', 'touchstart'];
  function kick() { EV.forEach(function (n) { removeEventListener(n, kick); }); boot(); }
  function arm() { EV.forEach(function (n) { addEventListener(n, kick, { once: true, passive: true }); }); setTimeout(kick, coarse ? 3500 : 4500); }
  if (document.readyState === 'complete') arm(); else addEventListener('load', arm);

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
})();
