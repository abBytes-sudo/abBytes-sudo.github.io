/* The end of the page. "Let's build yours." shows the visitor's own brief from the builder (or, with none yet, what
   happens on a 20-minute call), New Delhi time, a giant wordmark whose letters a small black hole near the cursor pulls
   about, and a footer that reads like a status line. Plain DOM. Motion only while on screen, none under reduced motion. */
(function () {
  'use strict';
  var d = document, sec = d.getElementById('contact');
  if (!sec) return;
  var $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function E(tag, cls, txt) { var e = d.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; }
  function seen(el, fn, th) { if (!el) return; if (!('IntersectionObserver' in window)) { fn(true); return; } new IntersectionObserver(function (es) { fn(es[es.length - 1].isIntersecting); }, { threshold: th || 0 }).observe(el); }

  /* ---- your brief: read from the builder, which restores the same saved setup (localStorage am-build, or a #b= link) ---- */
  var brief = $('#ft-brief'), call = $('#ft-call');
  function source() {
    if (location.hash.indexOf('#b=') === 0) return 'from a shared link';
    try { if (localStorage.getItem('am-build')) return 'saved in this browser'; } catch (e) { /* private mode */ }
    return '';
  }
  function on(g) { return $$('#build [data-g="' + g + '"] button[aria-pressed="true"]'); }
  function render() {
    var src = source(), trade = on('trade')[0], has = !!(src && trade && brief);
    if (brief) brief.hidden = !has;
    if (call) call.hidden = has;
    if (!has) return;
    var name = (($('#biz') || {}).value || '').trim(), theme = on('theme')[0], mods = on('mods'), autos = on('autos').length;
    var pick = $('#build [data-g="color"] input[type="color"]'), col = pick && /^#[0-9a-f]{6}$/i.test(pick.value) ? pick.value.toLowerCase() : '#6a3df0';
    brief.style.setProperty('--fb', col);
    $('#ft-src').textContent = src;
    $('#ft-bn').textContent = name || 'Your business';
    $('#ft-tr').textContent = trade.textContent.trim();
    $('#ft-th').textContent = theme ? theme.textContent.trim() + ' theme' : 'Theme to pick';
    $('#ft-hex').textContent = col;
    var ul = $('#ft-mods'); ul.textContent = '';
    if (mods.length) mods.forEach(function (m) { ul.appendChild(E('li', '', m.textContent.trim())); });
    else ul.appendChild(E('li', 'none', 'No modules picked yet'));
    var weeks = ''; $$('#build .spec dt').forEach(function (dt) { if (/timeline/i.test(dt.textContent) && dt.nextElementSibling) weeks = dt.nextElementSibling.textContent.trim(); });
    $('#ft-est').textContent = (weeks ? 'First estimate: ' + weeks + ' · ' : '') + (autos ? autos + (autos === 1 ? ' automation' : ' automations') + ' on' : 'no automations yet') + ' · not a quote';
    /* the tiny preview: theme, brand colour, a rail icon and a row for each module */
    var mini = $('#ft-mini'), rail = $('#ft-ms'), rows = $('#ft-ml'), n = Math.max(1, mods.length), i, r;
    mini.dataset.th = theme ? theme.dataset.v : 'clean';
    $('#ft-mu').textContent = (name.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'yourbusiness') + '.app';
    rail.textContent = ''; rows.textContent = '';
    for (i = 0; i < Math.min(n + 1, 8); i++) rail.appendChild(E('i'));
    for (i = 0; i < Math.min(n, 4); i++) { r = E('i'); r.style.setProperty('--w', [78, 54, 66, 42][i] + '%'); rows.appendChild(r); }
  }
  render();
  var q = 0;
  function later() { if (!q) q = requestAnimationFrame(function () { q = 0; render(); }); }
  var build = $('#build');
  if (build) ['click', 'input', 'change'].forEach(function (t) { build.addEventListener(t, later); });
  addEventListener('hashchange', later);
  d.addEventListener('DOMContentLoaded', render);

  /* ---- New Delhi time (IST is UTC+5:30 all year), ticking only while the section is on screen ---- */
  var tm = $('#ft-time'), hh = $('#ft-clock .ft-hh'), mh = $('#ft-clock .ft-mh'), lastM = -1, lastH = -1, turnM = 0, turnH = 0, iv = 0;
  function tick(hands) {
    if (!tm) return;
    var t = new Date(Date.now() + 19800000), h = t.getUTCHours(), m = t.getUTCMinutes();
    tm.textContent = (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' am' : ' pm');
    tm.setAttribute('datetime', (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + '+05:30');
    if (!hands || !hh || !mh) return;
    var ma = m * 6, ha = (h % 12) * 30 + m / 2;
    if (lastM >= 0 && ma < lastM) turnM++;
    if (lastH >= 0 && ha < lastH) turnH++;
    lastM = ma; lastH = ha;
    mh.style.setProperty('--a', (ma + turnM * 360) + 'deg');
    hh.style.setProperty('--a', (ha + turnH * 360) + 'deg');
  }
  tick(reduce);
  seen(sec, function (v) {
    if (v) { tick(true); if (!iv) iv = setInterval(function () { tick(true); }, 10000); }
    else if (iv) { clearInterval(iv); iv = 0; }
  });

  /* ---- the footer status line: the real date this page last changed, when the server says ---- */
  var up = $('#ft-upd'), lm = Date.parse(d.lastModified);
  if (up && lm && Math.abs(Date.now() - lm) > 120000) {
    var u = new Date(lm);
    up.textContent = u.getDate() + ' ' + MON[u.getMonth()] + ' ' + u.getFullYear();
    up.setAttribute('datetime', u.getFullYear() + '-' + ('0' + (u.getMonth() + 1)).slice(-2) + '-' + ('0' + u.getDate()).slice(-2));
  }
  var bar = $('.ft-bar');
  seen(bar, function (v) { bar.classList.toggle('ft-v', v && !reduce); });

  /* ---- the wordmark: each letter springs towards a small black hole near the cursor, and back when it goes ---- */
  var band = $('#ft-wm'), wrap = band && $('.ft-wi', band), hole = band && $('.ft-hole', band);
  if (!band || !wrap) return;
  var L = $$('span', wrap).map(function (el) { return { el: el, cx: 0, cy: 0, x: 0, y: 0, r: 0, s: 0, vx: 0, vy: 0, vr: 0, vs: 0, p: 0 }; });
  var fs = 0, W = 0, H = 0;
  function fit() {
    band.style.setProperty('--fs', '100px');
    var cs = getComputedStyle(band), avail = band.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), w = wrap.offsetWidth;
    if (!w || avail <= 0) return;
    fs = Math.max(48, Math.min(100 * avail / w, 520));
    band.style.setProperty('--fs', fs.toFixed(2) + 'px');
    W = band.clientWidth; H = band.clientHeight;
    L.forEach(function (l) { l.cx = l.el.offsetLeft + l.el.offsetWidth / 2; l.cy = l.el.offsetTop + l.el.offsetHeight * .5; });
  }
  fit();
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(fit);
  var rq = 0;
  addEventListener('resize', function () { if (!rq) rq = requestAnimationFrame(function () { rq = 0; fit(); }); });
  if (reduce) return;

  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var vis = false, running = false, last = 0, inside = false, px = 0, py = 0, hx = 0, hy = 0, pw = 0, tp = 0, wt = 0;
  var intro = fine ? 0 : -1; /* desktop: one slow pass across the word when it first comes into view, then it is the cursor's */
  function frame(now) {
    var dt = Math.min(.033, Math.max(.001, (now - last) / 1000)), tx, ty, k, busy;
    last = now;
    if (inside) { tx = px; ty = py; tp = 1; }
    else if (intro >= 0) {
      if (intro === 0) { hx = -.04 * W; hy = .56 * H; pw = 0; }
      intro = Math.min(1, intro + dt / 2.8);
      tx = W * (-.04 + 1.08 * intro); ty = H * (.56 - .16 * Math.sin(intro * 6.283));
      tp = Math.pow(Math.sin(intro * 3.1416), .6);
      if (intro >= 1) { intro = -1; tp = 0; }
    } else if (!fine) { wt += dt; tx = W * (.5 + .44 * Math.sin(wt * .27)); ty = H * (.58 + .2 * Math.sin(wt * .71 + 1.3)); tp = .8; }
    else { tx = hx; ty = hy; tp = 0; }
    if (tp > 0 && pw < .02) { hx = tx; hy = ty; }
    k = 1 - Math.exp(-dt * 9); hx += (tx - hx) * k; hy += (ty - hy) * k;
    pw += (tp - pw) * (1 - Math.exp(-dt * (tp > pw ? 7 : 4)));
    busy = tp > 0 || pw > .004;
    var R = fs * .95, R2 = R * R, maxP = fs * .11, K = 170, C = 13;
    L.forEach(function (l) {
      var dx = hx - l.cx, dy = hy - l.cy, dd = dx * dx + dy * dy, r = Math.sqrt(dd) + .001, g = pw * Math.exp(-dd / R2);
      var pull = Math.min(r * .5, maxP) * g, gx = dx / r * pull, gy = dy / r * pull, gr = Math.max(-1, Math.min(1, dx / R)) * 8 * g, gs = .12 * g;
      l.vx += ((gx - l.x) * K - l.vx * C) * dt; l.x += l.vx * dt;
      l.vy += ((gy - l.y) * K - l.vy * C) * dt; l.y += l.vy * dt;
      l.vr += ((gr - l.r) * K - l.vr * C) * dt; l.r += l.vr * dt;
      l.vs += ((gs - l.s) * K - l.vs * C) * dt; l.s += l.vs * dt;
      var moving = Math.abs(l.x) + Math.abs(l.y) + Math.abs(l.r) + Math.abs(l.vx) + Math.abs(l.vy) + Math.abs(l.vr) > .03 || Math.abs(l.s) + Math.abs(l.vs) > .0008;
      if (moving) {
        busy = true;
        var a = Math.atan2(l.y, l.x) * 57.296;
        l.el.style.transform = 'translate3d(' + l.x.toFixed(2) + 'px,' + l.y.toFixed(2) + 'px,0) rotate(' + l.r.toFixed(2) + 'deg) rotate(' + a.toFixed(1) + 'deg) scale(' + (1 + l.s).toFixed(3) + ',' + (1 - l.s * .45).toFixed(3) + ') rotate(' + (-a).toFixed(1) + 'deg)';
      } else if (l.el.style.transform) { l.x = l.y = l.r = l.s = l.vx = l.vy = l.vr = l.vs = 0; l.el.style.transform = ''; }
      var p = Math.round(Math.max(0, Math.min(1, l.s / .12)) * 10) / 30;
      if (p !== l.p) { l.p = p; l.el.style.setProperty('--p', p); }
    });
    if (hole) {
      hole.style.opacity = Math.min(1, pw * 1.4).toFixed(3);
      hole.style.transform = 'translate3d(' + hx.toFixed(1) + 'px,' + hy.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + (.35 + .65 * pw).toFixed(3) + ')';
    }
    if (busy && vis) requestAnimationFrame(frame);
    else { running = false; band.classList.remove('live'); }
  }
  function wake() {
    if (running || !vis || !fs) return;
    running = true; band.classList.add('live'); last = performance.now(); requestAnimationFrame(frame);
  }
  band.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var b = band.getBoundingClientRect(); px = e.clientX - b.left; py = e.clientY - b.top;
    if (!inside) { inside = true; intro = -1; }
    wake();
  });
  band.addEventListener('pointerleave', function () { inside = false; wake(); });
  seen(band, function (v) { vis = v; wake(); }, .35);
})();
