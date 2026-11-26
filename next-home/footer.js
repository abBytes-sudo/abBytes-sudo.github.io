/* The end of the page. "Let's build yours." shows the visitor's own brief from the builder (or, with none yet, what
   happens on a 20-minute call), New Delhi time, a small black hole near the cursor that pulls every letter of the section
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

  /* ---- one small black hole for the whole contact section and footer. Every visible text node is split once into
     letter spans (a hidden copy keeps the words for screen readers); only letters near the hole move, links and
     buttons keep their boxes, and the loop stops when everything is still or off screen. Text that scripts rewrite
     (the headline, the brief, the clock, the copy button) is split again by a MutationObserver. ---- */
  var foot = $('.ft-bar'), ROOTS = [sec].concat(foot ? [foot] : []);
  if (reduce) return;
  var SKIP = '.ft-sp,.ft-sr,script,style,textarea,select,option,input,[aria-hidden="true"],[contenteditable]';
  var OBS = { childList: true, characterData: true, subtree: true };
  var L = [], SP = [], act = [], mo = null, dirty = true, R = 110, R2 = R * R, CUT = R * 2.1;
  var vis = {}, running = false, last = 0, inside = false, cx = 0, cy = 0, hx = 0, hy = 0, pw = 0, tap = 0;
  var hole = E('i', 'ft-hole'); hole.setAttribute('aria-hidden', 'true'); d.body.appendChild(hole);
  function splitNode(tn) {
    var t = tn.nodeValue, sp = E('span', 'ft-sp'), c = { el: sp, fs: 16, k: .5, h: !!(tn.parentNode.closest && tn.parentNode.closest('#endH')) }, frag = d.createDocumentFragment();
    sp.setAttribute('aria-hidden', 'true');
    t.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) { sp.appendChild(d.createTextNode(part)); return; }
      var w = E('span', 'ft-w');
      Array.from(part).forEach(function (ch) { var el = E('span', 'ft-lt', ch); w.appendChild(el); L.push({ el: el, c: c, cx: NaN, cy: NaN, x: 0, y: 0, r: 0, s: 0, vx: 0, vy: 0, vr: 0, vs: 0, p: 0, on: false }); });
      sp.appendChild(w);
    });
    frag.appendChild(E('span', 'ft-sr', t)); frag.appendChild(sp); SP.push(c);
    tn.parentNode.replaceChild(frag, tn);
  }
  function rescan() {
    if (mo) mo.disconnect();
    ROOTS.forEach(function (root) {
      var todo = [], n, tw = d.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: function (x) {
        if (x.nodeType === 1) return x.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
        return /\S/.test(x.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      } });
      while ((n = tw.nextNode())) todo.push(n);
      todo.forEach(splitNode);
    });
    L = L.filter(function (l) { return l.el.isConnected; }); SP = SP.filter(function (c) { return c.el.isConnected; });
    dirty = true;
    if (mo) ROOTS.forEach(function (r) { mo.observe(r, OBS); });
  }
  function measure() {
    var sx = scrollX, sy = scrollY;
    SP.forEach(function (c) { c.fs = parseFloat(getComputedStyle(c.el).fontSize) || 16; c.k = c.h ? 1 : Math.max(.5, Math.min(1, (c.fs - 4) / 64)); });
    L.forEach(function (l) { var b = l.el.getBoundingClientRect(); if (!b.width) { l.cx = l.cy = NaN; return; } l.cx = b.left + b.width / 2 + sx - l.x; l.cy = b.top + b.height * .55 + sy - l.y; });
    dirty = false;
  }
  if ('MutationObserver' in window) mo = new MutationObserver(rescan);
  rescan();
  function frame(now) {
    var dt = Math.min(.033, Math.max(.001, (now - last) / 1000)), tx = hx, ty = hy, tp = 0, k, i, l, still = true;
    last = now;
    if (inside) { tx = cx; ty = cy; tp = 1; } else if (now < tap) { tx = cx; ty = cy; tp = .6; }
    if (tp > 0 && pw < .02) { hx = tx; hy = ty; }
    k = 1 - Math.exp(-dt * 10); hx += (tx - hx) * k; hy += (ty - hy) * k;
    pw += (tp - pw) * (1 - Math.exp(-dt * (tp > pw ? 8 : 4)));
    if (dirty) measure();
    var X = hx + scrollX, Y = hy + scrollY;
    if (pw > .004) for (i = 0; i < L.length; i++) { l = L[i]; if (!l.on && Math.abs(X - l.cx) < CUT && Math.abs(Y - l.cy) < CUT) { l.on = true; act.push(l); } }
    act = act.filter(function (l) {
      if (!l.el.isConnected) { l.on = false; return false; }
      var dx = X - l.cx, dy = Y - l.cy, dd = dx * dx + dy * dy, r = Math.sqrt(dd) + .001, g = dd < CUT * CUT ? pw * Math.exp(-dd / R2) : 0, q = l.c.k;
      var pull = Math.min(r * .5, (5 + l.c.fs * .1) * q) * g, gx = dx / r * pull, gy = dy / r * pull, gr = Math.max(-1, Math.min(1, dx / R)) * 10 * q * g, gs = .14 * q * g;
      l.vx += ((gx - l.x) * 170 - l.vx * 13) * dt; l.x += l.vx * dt;
      l.vy += ((gy - l.y) * 170 - l.vy * 13) * dt; l.y += l.vy * dt;
      l.vr += ((gr - l.r) * 170 - l.vr * 13) * dt; l.r += l.vr * dt;
      l.vs += ((gs - l.s) * 170 - l.vs * 13) * dt; l.s += l.vs * dt;
      if (g < .002 && Math.abs(l.x) + Math.abs(l.y) + Math.abs(l.r) + Math.abs(l.vx) + Math.abs(l.vy) + Math.abs(l.vr) < .03 && Math.abs(l.s) + Math.abs(l.vs) < .0008) {
        l.x = l.y = l.r = l.s = l.vx = l.vy = l.vr = l.vs = 0; l.el.style.transform = '';
        if (l.p) { l.p = 0; l.el.classList.remove('ft-hot'); l.el.style.removeProperty('--p'); }
        l.on = false; return false;
      }
      if (Math.abs(l.vx) + Math.abs(l.vy) + Math.abs(l.vr) > .05 || Math.abs(l.vs) > .002) still = false;
      var a = Math.atan2(l.y, l.x) * 57.296;
      l.el.style.transform = 'translate3d(' + l.x.toFixed(2) + 'px,' + l.y.toFixed(2) + 'px,0) rotate(' + l.r.toFixed(2) + 'deg) rotate(' + a.toFixed(1) + 'deg) scale(' + (1 + l.s).toFixed(3) + ',' + (1 - l.s * .45).toFixed(3) + ') rotate(' + (-a).toFixed(1) + 'deg)';
      var p = Math.round(Math.max(0, Math.min(1, l.s / .14)) * 12) / 20;
      if (p !== l.p) { if (p) { l.el.classList.add('ft-hot'); l.el.style.setProperty('--p', p); } else { l.el.classList.remove('ft-hot'); l.el.style.removeProperty('--p'); } l.p = p; }
      return true;
    });
    hole.style.opacity = Math.min(1, pw * 1.4).toFixed(3);
    hole.style.transform = 'translate3d(' + hx.toFixed(1) + 'px,' + hy.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + (.35 + .65 * pw).toFixed(3) + ')';
    var settled = Math.abs(tx - hx) < .3 && Math.abs(ty - hy) < .3 && Math.abs(tp - pw) < .004;
    if ((!settled || !still || now < tap || (tp === 0 && (pw > .004 || act.length))) && (vis.a || vis.b)) requestAnimationFrame(frame);
    else running = false;
  }
  function wake() { if (running || !(vis.a || vis.b) || !L.length) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
  function mv(e) { if (e.pointerType === 'touch') return; cx = e.clientX; cy = e.clientY; if (!inside) { inside = true; dirty = true; } wake(); }
  function dn(e) { if (e.pointerType !== 'touch') return; cx = e.clientX; cy = e.clientY; tap = performance.now() + 520; dirty = true; wake(); }
  ROOTS.forEach(function (r) { r.addEventListener('pointermove', mv); r.addEventListener('pointerleave', function () { inside = false; wake(); }); r.addEventListener('pointerdown', dn); });
  addEventListener('scroll', function () { if (inside || pw > .004) wake(); }, { passive: true });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { dirty = true; });
  addEventListener('resize', function () { dirty = true; });
  seen(sec, function (v) { vis.a = v; wake(); });
  seen(foot, function (v) { vis.b = v; wake(); });
})();
