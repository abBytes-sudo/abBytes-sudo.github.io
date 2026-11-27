/* Concept E · Live. A flight through space between real, running projects. The window in front boots the actual app in an iframe;
   "Use it live" flies the camera into it and hands over the mouse. CSS 3D for the windows, one 2D canvas for the star streaks. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, W = ['client', 'sys', 'web'].reduce(function (a, c) { return a.concat(window.WORK.filter(function (w) { return w.cat === c; })); }, []), N = W.length, $ = function (s) { return d.querySelector(s); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, mobile = matchMedia('(max-width: 900px)').matches;
  var clamp = function (v, a, b) { a = a || 0; b = b === undefined ? 1 : b; return v < a ? a : v > b ? b : v; }, sm = function (t) { return t * t * (3 - 2 * t); }, lerp = function (a, b, t) { return a + (b - a) * t; };
  function E(tag, cls, txt) { var e = d.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; }
  var RISE = 90, STEP = 44, END = RISE + (N - 1) * STEP + 40, P = 1200, GAP = 1500, W0 = mobile ? 300 : 880, H0 = mobile ? 594 : 584, FW = mobile ? 390 : 1280;

  /* the list: always real links; in flight they steer instead */
  var rail = $('#rail'), links = [], lastCat = '';
  W.forEach(function (w, i) {
    if (w.cat !== lastCat) { lastCat = w.cat; rail.appendChild(E('h3', '', window.CATS[w.cat])); }
    var a = E('a'); a.href = w.href; a.appendChild(E('span', '', (i < 9 ? '0' : '') + (i + 1))); a.appendChild(d.createTextNode(w.name));
    a.addEventListener('click', function (e) { if (!root.classList.contains('still')) { e.preventDefault(); go(i); } }); rail.appendChild(a); links.push(a);
  });
  var copy = $('#copy'); copy.addEventListener('click', function () { var done = function () { copy.textContent = 'Copied'; setTimeout(function () { copy.textContent = 'Copy the address'; }, 1800); }; if (navigator.clipboard) navigator.clipboard.writeText('abhimasih0505@gmail.com').then(done, done); else done(); });
  if (reduce) { root.classList.add('still', 'solid'); [].forEach.call(d.querySelectorAll('a[href="#fly"]'), function (a) { a.setAttribute('href', '#rail'); }); return; }

  /* windows in space */
  var cam = $('#cam'), wins = W.map(function (w, i) {
    var el = E('div', 'win'), ch = E('div', 'chrome'), v = E('div', 'view'), src = w.img ? 'img/' + w.img + '.webp' : w.card ? 'img/cards/' + w.card + '.webp' : '', em = E('em', '', w.href.indexOf('mailto') ? 'Preview' : 'On request');
    el.style.setProperty('--w', W0 + 'px'); el.style.setProperty('--h', H0 + 'px'); el.style.setProperty('--fw', FW + 'px'); el.style.setProperty('--fh', (H0 - 34) / (W0 / FW) + 'px'); el.style.setProperty('--fs', W0 / FW);
    ch.appendChild(E('i')); ch.appendChild(E('i')); ch.appendChild(E('i')); ch.appendChild(E('span', '', w.name)); ch.appendChild(em); el.appendChild(ch); el.appendChild(v);
    if (src) { var im = new Image(); im.alt = ''; im.loading = i < 4 ? 'eager' : 'lazy'; im.src = src; v.appendChild(im); } else v.appendChild(E('p', '', 'Not launched publicly. Screens on request.'));
    var x = mobile ? ((i * 37) % 5 - 2) * 70 : ((i * 37) % 11 - 5) * 120, y = ((i * 53) % 7 - 3) * (mobile ? 60 : 90);
    el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,' + (-i * GAP) + 'px)'; cam.appendChild(el);
    return { el: el, v: v, em: em, x: x, y: y, w: w, vis: false, live: !w.href.indexOf('mailto') ? false : true };
  });

  /* stars: streak with speed */
  var cv = $('#stars'), g = cv.getContext('2d'), VW = 1, VH = 1, stars = [], i;
  for (i = 0; i < (mobile ? 150 : 300); i++) stars.push([Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random(), 0, 0]);
  function size() { VW = innerWidth; VH = innerHeight; cv.width = VW; cv.height = VH; g.fillStyle = '#06070b'; g.fillRect(0, 0, VW, VH); stars.forEach(function (s) { s[3] = 0; }); }
  function drawStars(v) {
    var k, s, z, x, y, f = Math.max(VW, VH) * .7, sp = .0006 + Math.min(.05, v * .011);
    g.fillStyle = 'rgba(6,7,11,' + (v > .15 ? .35 : .9) + ')'; g.fillRect(0, 0, VW, VH); g.lineCap = 'round';
    for (k = 0; k < stars.length; k++) {
      s = stars[k]; z = s[2] - sp; if (z < .03) { s[0] = Math.random() * 2 - 1; s[1] = Math.random() * 2 - 1; z = 1; s[3] = 0; } s[2] = z;
      x = VW / 2 + s[0] / z * f * .5; y = VH / 2 + s[1] / z * f * .5;
      if (s[3]) { g.strokeStyle = 'rgba(255,255,255,' + (.9 * (1 - z)).toFixed(2) + ')'; g.lineWidth = 1 + (1 - z) * 1.6; g.beginPath(); g.moveTo(s[3], s[4]); g.lineTo(x + .01, y); g.stroke(); }
      s[3] = x; s[4] = y;
    }
  }

  /* flight state */
  var cap = $('#cap'), st = { r: 0, s: 0, u: 0 }, tg = { r: 0, s: 0, u: 0 }, cur = -1, deck = false, using = false, busy = false, liveT = 0, frame = null, frameI = -1, solid = false;
  function go(i) { window.scrollTo({ top: (RISE + clamp(i, 0, N - 1) * STEP) / 100 * innerHeight + 2, behavior: 'smooth' }); }
  function boot(i) {            // start the real thing in the window in front; keep one running at a time
    var w = wins[i]; if (frameI === i || !w.live) return; if (frame) { frame.remove(); wins[frameI].el.classList.remove('on'); wins[frameI].em.textContent = 'Preview'; }
    frame = E('iframe'); frameI = i; frame.title = w.w.name + ', running live'; frame.tabIndex = -1; w.em.textContent = 'Starting…';
    frame.addEventListener('load', function () { if (frameI === i) { w.el.classList.add('on'); w.em.textContent = 'Live'; } }); frame.src = w.w.href; w.v.appendChild(frame);
  }
  function show(i) {
    var w = W[i], live = wins[i].live; cur = i; $('#capH').textContent = w.name; $('#capK').textContent = window.CATS[w.cat] + ' · ' + w.kind + ' · ' + w.status; $('#capB').textContent = w.blurb;
    $('#use').hidden = !live; $('#use').textContent = w.cat === 'client' || w.id === 'const' ? 'Read it here' : 'Use it live'; $('#open').href = $('#open2').href = w.href; $('#open').textContent = live ? 'Open full screen ↗' : w.cta + ' →';
    $('#useN').textContent = 'You are ' + (w.cat === 'client' || w.id === 'const' ? 'reading ' : 'using ') + w.name + ', live.';
    links.forEach(function (a, k) { a.classList.toggle('on', k === i); }); wins.forEach(function (x, k) { x.el.classList.toggle('cur', k === i); });
    cap.classList.remove('sw'); void cap.offsetWidth; cap.classList.add('sw'); clearTimeout(liveT); liveT = setTimeout(function () { if (cur === i && deck) boot(i); }, 650);
  }
  function state() {
    busy = false; var p = window.scrollY / innerHeight * 100, on, i, sd;
    tg.r = clamp(p / RISE); tg.s = clamp((p - RISE) / STEP, 0, N - 1); on = p > RISE * .72 && p < END + 30; i = Math.round(tg.s);
    if (on !== deck) { deck = on; root.classList.toggle('deck', on); if (!on) clearTimeout(liveT); } if (on && i !== cur) show(i); else if (on && frameI !== cur) { clearTimeout(liveT); liveT = setTimeout(function () { if (deck) boot(cur); }, 650); }
    sd = p > END + 60; if (sd !== solid) { solid = sd; root.classList.toggle('solid', sd); }
  }
  addEventListener('scroll', function () { if (!busy && !using) { busy = true; requestAnimationFrame(state); } }, { passive: true });
  function use(v) { if (v && (cur < 0 || !wins[cur].live)) return; using = v; tg.u = v ? 1 : 0; root.classList.toggle('using', v); if (v) { boot(cur); if (frame) frame.tabIndex = 0; } else if (frame) frame.tabIndex = -1; }
  $('#use').addEventListener('click', function () { use(true); }); $('#back').addEventListener('click', function () { use(false); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && using) use(false); else if (deck && !using && !e.metaKey && !e.ctrlKey && !e.altKey) { if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { go(cur + 1); e.preventDefault(); } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { go(cur - 1); e.preventDefault(); } } });
  addEventListener('click', function (e) {          // the page sits above the space layer, so find the window under the pointer ourselves
    if (!deck || using || e.target.closest('a,button,.cap,.rail,.top,.sec')) return; var els = d.elementsFromPoint(e.clientX, e.clientY), k, j, el;
    for (k = 0; k < els.length; k++) { el = els[k].closest('.win'); if (el) { for (j = 0; j < N; j++) if (wins[j].el === el) { if (j === cur) use(true); else go(j); return; } } }
  });
  [].forEach.call(d.querySelectorAll('a[href="#fly"]'), function (a) { a.addEventListener('click', function (e) { e.preventDefault(); go(0); }); });

  var last = 0, raf = 0, ps = 0;
  function tick(now) {
    raf = requestAnimationFrame(tick); var dt = Math.min(.05, (now - last) / 1000 || .016), k = 1 - Math.exp(-dt * 5), i0, f, a, b, e, u, fit, kU, zoom, sx, sy, cx, cy, j, rel, op, w; last = now;
    st.r += (tg.r - st.r) * k; st.s += (tg.s - st.s) * (1 - Math.exp(-dt * 4.2)); st.u += (tg.u - st.u) * (1 - Math.exp(-dt * 6));
    i0 = Math.min(N - 1, Math.floor(st.s)); f = sm(st.s - i0); a = wins[i0]; b = wins[Math.min(N - 1, i0 + 1)]; e = sm(st.r); u = sm(clamp(st.u));
    fit = mobile ? Math.min(1, (VW - 28) / W0, (VH - 300) / H0) : Math.min(1, (VW - 400) / W0, (VH - 300) / H0); kU = Math.min((VW - 24) / W0, (VH - 78) / H0);
    zoom = lerp(lerp(mobile ? -1500 : -1250, P * (1 - 1 / fit), e), P * (1 - 1 / kU), u); sx = lerp(lerp(mobile ? 0 : VW * .27, mobile ? 0 : 150, e), 0, u); sy = lerp(lerp(mobile ? VH * .3 : 10, mobile ? -110 : -56, e), 27, u);
    cx = lerp(a.x, b.x, f); cy = lerp(a.y, b.y, f);
    cam.style.transform = 'translate3d(' + (sx - cx).toFixed(1) + 'px,' + (sy - cy).toFixed(1) + 'px,' + (st.s * GAP + zoom).toFixed(1) + 'px)';
    for (j = 0; j < N; j++) {
      w = wins[j]; rel = j - st.s; op = rel >= 0 ? clamp(1.12 - rel * .27) : clamp(1 + rel * 2.4); if (u > .01 && j !== cur) op *= 1 - u;
      if (op < .01) { if (w.vis) { w.vis = false; w.el.style.visibility = 'hidden'; } } else { if (!w.vis) { w.vis = true; w.el.style.visibility = 'visible'; } w.el.style.opacity = op.toFixed(3); }
    }
    drawStars(using ? 0 : Math.abs(st.s - ps) / dt + Math.abs(tg.r - st.r) * 2); ps = st.s;
  }
  $('#fly').style.setProperty('--len', END); size(); addEventListener('resize', function () { size(); state(); }); state(); st.r = tg.r; st.s = ps = tg.s; raf = requestAnimationFrame(tick);
  d.addEventListener('visibilitychange', function () { if (d.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { last = 0; raf = requestAnimationFrame(tick); } });
  window.__live = { use: use };
})();
