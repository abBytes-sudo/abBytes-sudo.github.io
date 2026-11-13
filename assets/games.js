/* Homepage: Lead Run (an arcade section).
   Both are optional: the page reads the same without them. Each canvas only animates while it is on screen. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function css(name, fb) { var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; }
  function rgba(hex, al) { var n = parseInt(hex.replace('#', ''), 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + al + ')'; }
  var raf = window.requestAnimationFrame.bind(window);
  var MONO = '"JetBrains Mono", ui-monospace, monospace', DISP = '"Inter Tight", Inter, system-ui, sans-serif';

  /* ── Lead Run: steer a lead through the chaos that loses it. Rocks cost a life; crystals build the system. ── */
  var run = document.querySelector('[data-run]');
  if (run) (function () {
    var cv = run.querySelector('.run-cv'), ctx = cv && cv.getContext && cv.getContext('2d'); if (!ctx) return;
    var ov = run.querySelector('.run-ov'), go = run.querySelector('.run-go'), title = run.querySelector('.run-t'), sub = run.querySelector('.run-s'), bestEl = run.querySelector('.run-best');
    var ROCKS = ['Spreadsheet', 'Missed call', 'Lost lead', 'Double entry', 'No follow-up', 'Sticky note', 'Rented CRM'];
    var GEMS = [{ t: 'CRM', c: css('--k7', '#4BE3C1') }, { t: 'Website', c: css('--k1', '#F4B556') }, { t: 'Automation', c: css('--k4', '#FF4FD8') }, { t: '3D', c: css('--fe', '#9D8CFF') }];
    var W = 0, H = 0, dpr = 1, stars = [], state = 'idle', visible = !hasIO, running = false, last = 0;
    var ship, objs, parts, score, lives, have, level, inv, tRock, tGem, banner, shake, speed, keyY = 0;
    var best = 0; try { best = +localStorage.getItem('leadrun-best') || 0; } catch (e) {}
    function showBest() { bestEl.textContent = best ? 'Best: ' + best : ''; }
    function size() {
      var r = cv.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = []; for (var i = 0; i < Math.round(W * H / 1800); i++) stars.push({ x: Math.random() * W, y: Math.random() * H, z: Math.random() * .9 + .1 });
      if (state !== 'play') draw(0);
    }
    function reset() {
      ship = { x: Math.max(60, W * .14), y: H / 2, ty: H / 2 }; objs = []; parts = []; score = 0; lives = 3; have = {}; level = 1;
      inv = 0; tRock = 600; tGem = 2500; banner = null; shake = 0; speed = W < 600 ? 3 : 3.6;
    }
    function spawnRock() { var r = 15 + Math.random() * 12; objs.push({ k: 'rock', x: W + 40, y: 58 + Math.random() * (H - 58 - 72), r: r, v: speed * (.85 + Math.random() * .4), t: ROCKS[(Math.random() * ROCKS.length) | 0], s: Math.random() * 6.283, sv: (Math.random() - .5) * .05 }); }
    function spawnGem() {
      var left = GEMS.filter(function (g) { return !have[g.t]; }); if (!left.length) return;
      var g = left[(Math.random() * left.length) | 0]; objs.push({ k: 'gem', x: W + 40, y: 64 + Math.random() * (H - 64 - 80), r: 14, v: speed * .9, t: g.t, c: g.c, s: 0 });
    }
    function burst(x, y, c, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, sp = 1 + Math.random() * 4; parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, l: 1, c: c }); } }
    function step(f, dt) {
      score += dt * .012 * level; speed += .0009 * f;
      ship.ty = clamp(ship.ty + keyY * 7 * f, 24, H - 24);
      ship.y += (ship.ty - ship.y) * clamp(.18 * f, 0, 1);
      tRock -= dt; tGem -= dt;
      if (tRock <= 0) { spawnRock(); tRock = Math.max(300, 950 - level * 90 - speed * 40) * (.7 + Math.random() * .6); }
      if (tGem <= 0) { spawnGem(); tGem = 2600 + Math.random() * 1800; }
      if (inv > 0) inv -= dt; if (shake > 0) shake *= Math.pow(.88, f);
      for (var i = objs.length - 1; i >= 0; i--) {
        var o = objs[i]; o.x -= o.v * f; o.s += (o.sv || .04) * f;
        if (o.x < -60) { objs.splice(i, 1); continue; }
        var dx = o.x - ship.x, dy = o.y - ship.y, hit = o.r + 12;
        if (dx * dx + dy * dy < hit * hit) {
          if (o.k === 'gem') {
            have[o.t] = true; score += 100; burst(o.x, o.y, o.c, 18); objs.splice(i, 1);
            if (GEMS.every(function (g) { return have[g.t]; })) { score += 500; level++; have = {}; banner = { t: 'System built! +500', l: 1 }; burst(ship.x, ship.y, '#FFF4D6', 40); }
          } else if (inv <= 0) {
            lives--; inv = 1300; shake = 10; burst(o.x, o.y, '#FF6B6B', 22); banner = { t: o.t + '!', l: .7 }; objs.splice(i, 1);
            if (lives <= 0) { over(); return; }
          }
        }
      }
      for (var p = parts.length - 1; p >= 0; p--) { var q = parts[p]; q.x += q.vx * f; q.y += q.vy * f; q.vx *= .96; q.vy *= .96; q.l -= .025 * f; if (q.l <= 0) parts.splice(p, 1); }
      if (banner) { banner.l -= .012 * f; if (banner.l <= 0) banner = null; }
    }
    function draw(t) {
      ctx.save(); ctx.clearRect(0, 0, W, H);
      if (shake > .3) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
      var sp = state === 'play' ? speed : .6;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i]; if (state === 'play' || !reduce) { s.x -= s.z * sp * .5; if (s.x < 0) { s.x = W; s.y = Math.random() * H; } }
        ctx.fillStyle = 'rgba(243,240,234,' + (.15 + s.z * .55) + ')'; ctx.fillRect(s.x, s.y, s.z * 2.2 * (state === 'play' ? 1 + s.z * 2 : 1), s.z * 1.4);
      }
      if (state !== 'idle' && ship) {
        objs.forEach(function (o) {
          ctx.save(); ctx.translate(o.x, o.y);
          if (o.k === 'gem') {
            ctx.fillStyle = rgba(o.c, .18); ctx.beginPath(); ctx.arc(0, 0, o.r * 2.2, 0, 6.283); ctx.fill();
            ctx.rotate(Math.sin(o.s) * .3); ctx.fillStyle = o.c; ctx.beginPath(); ctx.moveTo(0, -o.r); ctx.lineTo(o.r * .75, 0); ctx.lineTo(0, o.r); ctx.lineTo(-o.r * .75, 0); ctx.closePath(); ctx.fill();
            ctx.rotate(-Math.sin(o.s) * .3); ctx.font = '700 11px ' + MONO; ctx.textAlign = 'center'; ctx.fillStyle = o.c; ctx.fillText(o.t, 0, o.r + 16);
          } else {
            ctx.rotate(o.s); ctx.fillStyle = '#3A3A44'; ctx.strokeStyle = 'rgba(255,107,107,.65)'; ctx.lineWidth = 1.4; ctx.beginPath();
            for (var k = 0; k < 8; k++) { var a = k / 8 * 6.283, rr = o.r * (k % 2 ? .82 : 1); k ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
            ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.rotate(-o.s);
            ctx.font = '500 10px ' + MONO; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,170,170,.85)'; ctx.fillText(o.t, 0, o.r + 15);
          }
          ctx.restore();
        });
        parts.forEach(function (q) { ctx.fillStyle = q.c.charAt(0) === '#' ? rgba(q.c, q.l) : q.c; ctx.globalAlpha = q.l; ctx.beginPath(); ctx.arc(q.x, q.y, 2, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; });
        // the lead: a comet with a glowing tail
        if (!(inv > 0 && Math.floor(inv / 100) % 2)) {
          var tg = ctx.createLinearGradient(ship.x - 70, ship.y, ship.x, ship.y); tg.addColorStop(0, 'rgba(75,227,193,0)'); tg.addColorStop(1, 'rgba(75,227,193,.75)');
          ctx.strokeStyle = tg; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ship.x - 70, ship.y + (ship.ty - ship.y) * -.3); ctx.lineTo(ship.x, ship.y); ctx.stroke();
          var g = ctx.createRadialGradient(ship.x, ship.y, 1, ship.x, ship.y, 22); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.35, 'rgba(75,227,193,.9)'); g.addColorStop(1, 'rgba(75,227,193,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ship.x, ship.y, 22, 0, 6.283); ctx.fill();
          ctx.font = '700 9.5px ' + MONO; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(243,240,234,.9)'; ctx.fillText('LEAD', ship.x, ship.y - 20);
        }
        // HUD
        ctx.textAlign = 'left'; ctx.font = '700 15px ' + DISP; ctx.fillStyle = '#F3F0EA'; ctx.fillText('Score ' + Math.floor(score), 16, 26);
        ctx.font = '500 11px ' + MONO; ctx.fillStyle = 'rgba(243,240,234,.6)'; ctx.fillText('LEVEL ' + level, 16, 44);
        ctx.textAlign = 'right'; ctx.font = '700 16px ' + DISP; ctx.fillStyle = '#FF6B8A'; ctx.fillText('♥ '.repeat(Math.max(lives, 0)).trim(), W - 16, 26);
        var x = 16; ctx.textAlign = 'left'; ctx.font = '700 10.5px ' + MONO;
        GEMS.forEach(function (gm) { var w = ctx.measureText(gm.t).width + 18; ctx.fillStyle = have[gm.t] ? gm.c : 'rgba(243,240,234,.08)'; roundRect(x, H - 34, w, 22, 11); ctx.fill();
          ctx.fillStyle = have[gm.t] ? '#07070A' : 'rgba(243,240,234,.55)'; ctx.fillText(gm.t, x + 9, H - 19); x += w + 6; });
        if (banner) { ctx.textAlign = 'center'; ctx.font = '700 ' + (W < 600 ? 20 : 26) + 'px ' + DISP; ctx.fillStyle = 'rgba(243,240,234,' + clamp(banner.l * 1.5, 0, 1) + ')'; ctx.fillText(banner.t, W / 2, H / 2 - 40 + banner.l * 10); }
      }
      ctx.restore();
    }
    function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function frame(t) {
      if (!running) return;
      var dt = last ? clamp(t - last, 8, 40) : 16.667, f = dt / 16.667; last = t;
      if (state === 'play') step(f, dt);
      draw(t); raf(frame);
    }
    function start() { if (running || !visible || document.hidden) return; if (reduce && state !== 'play') return; running = true; last = 0; raf(frame); }
    function stop() { running = false; }
    function play() {
      reset(); state = 'play'; ov.hidden = true; run.classList.add('playing'); cv.focus({ preventScroll: true }); start();
    }
    function over() {
      state = 'over'; run.classList.remove('playing'); var s = Math.floor(score);
      if (s > best) { best = s; try { localStorage.setItem('leadrun-best', String(best)); } catch (e) {} }
      title.textContent = 'Score ' + s; sub.textContent = s >= best ? 'New best! The lead made it further than ever.' : 'A lead got lost. That’s what a system fixes.';
      go.innerHTML = 'Play again <span aria-hidden="true">↻</span>'; showBest(); ov.hidden = false;
      if (reduce) { draw(0); stop(); }
    }
    function aim(e) { if (state !== 'play') return; var r = cv.getBoundingClientRect(); ship.ty = clamp(e.clientY - r.top, 24, H - 24); }
    cv.addEventListener('pointermove', aim);
    cv.addEventListener('pointerdown', function (e) { aim(e); });
    cv.tabIndex = 0;
    cv.addEventListener('keydown', function (e) {
      if (state !== 'play') return;
      if (e.key === 'ArrowUp' || e.key === 'w') { keyY = -1; e.preventDefault(); } else if (e.key === 'ArrowDown' || e.key === 's') { keyY = 1; e.preventDefault(); }
    });
    cv.addEventListener('keyup', function (e) { if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'w' || e.key === 's') keyY = 0; });
    go.addEventListener('click', play);
    showBest(); size();
    if ('ResizeObserver' in window) new ResizeObserver(function () { var r = cv.getBoundingClientRect(); if (Math.abs(r.width - W) > 1 || Math.abs(r.height - H) > 1) { size(); if (ship) { ship.x = Math.max(60, W * .14); ship.ty = clamp(ship.ty, 24, H - 24); } } }).observe(cv);
    if (hasIO) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(cv);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    start();
  })();
})();

/* ── landing page examples: filter tabs ── */
(function () {
  var tabs = document.querySelectorAll('.ex-tabs button'), cards = document.querySelectorAll('.ex-c');
  tabs.forEach(function (b) { b.addEventListener('click', function () {
    var f = b.getAttribute('data-f');
    tabs.forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    cards.forEach(function (c) { c.hidden = f !== 'all' && c.getAttribute('data-k') !== f; });
    var g = document.querySelector('.ex-grid'); if (g) g.classList.toggle('filtered', f !== 'all');
  }); });
})();
