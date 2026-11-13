/* Home interactions. Everything works without this file; it only adds motion and the INTP gear tabs. */
(function () {
  var root = document.documentElement;
  root.classList.remove('no-js'); root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = window.requestAnimationFrame.bind(window);
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ── header: glass after the hero, hide on scroll down ── */
  var hd = document.getElementById('hd'), lastY = window.scrollY;
  function onHeader() {
    var y = window.scrollY;
    hd.classList.toggle('scrolled', y > 40);
    hd.classList.toggle('hide', y > lastY && y > 600);
    lastY = y;
  }
  window.addEventListener('scroll', onHeader, { passive: true }); onHeader();

  /* active nav link */
  var navLinks = [].slice.call(document.querySelectorAll('.hd-nav a[href^="#"]'));
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) { var s = document.querySelector(a.getAttribute('href')); if (s) secObs.observe(s); });
  }

  /* ── reveal + counters ── */
  function fmt(n) { return n.toLocaleString('en-US'); }
  function count(el) {
    var to = +el.getAttribute('data-count'); if (reduce || !to) return;
    var t0 = null, dur = 1400 + Math.min(to, 5000) / 10;
    function step(t) {
      if (!t0) t0 = t; var p = clamp((t - t0) / dur, 0, 1); p = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(Math.round(to * p)); if (p < 1) raf(step);
    }
    el.textContent = '0'; raf(step);
  }
  var reveals = [].slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        [].forEach.call(e.target.querySelectorAll('[data-count]'), count);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    reveals.forEach(function (el, i) { io.observe(el); });
  } else reveals.forEach(function (el) { el.classList.add('in'); });

  /* ── hero: a gravity field. Stars and planets drift; the cursor (or a finger) is a black hole. ──
     Inverse-square pull with softening, so bodies fall in, orbit, slingshot and get flung when the hole moves
     or lets go. Anything that crosses the event horizon is swallowed (flash) and re-enters from the edge. */
  var cv = document.getElementById('net');
  if (cv && cv.getContext) (function () {
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, bodies = [], flashes = [], pulses = [], disk = [];
    var KEYS = ['#F4B556', '#F5A02A', '#D3A84F', '#FF4FD8', '#E8B931', '#4BE3C1', '#9D8CFF'];
    var STARS = ['243,240,234', '207,227,255', '255,233,176', '255,214,232'];
    // game: planets are leads from a source; swallow 12 to build the system
    var LEADS = ['Google', 'Meta ad', 'WhatsApp', 'Referral', 'Website', 'Call', 'Instagram', 'Walk-in'], GOAL = 10, caught = 0, won = false;
    var hud = document.getElementById('gw-hud'), hudN = document.getElementById('gw-count'), hudWin = document.getElementById('gw-win'), tip = document.getElementById('gw-tip');
    var hero = document.getElementById('hero');
    var fine = window.matchMedia('(pointer: fine)').matches;
    var bh = { x: -999, y: -999, vx: 0, vy: 0, on: false, over: false, mass: 1, shown: 0, spin: 0 };
    var D = 150, running = false, visible = true, last = 0, lastPulse = 0, fs = 1;
    var GM = 800, SOFT = 30, SWIRL = .34, HORIZON = 12, VMAX = 13, CRUISE = .34, RANGE = 300, RANGE_FADE = 170;
    function size() {
      var r = cv.getBoundingClientRect(), oW = W, oH = H; dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      D = W < 700 ? 120 : 165;
      RANGE = clamp(Math.min(W, H) * .34, 140, 270); RANGE_FADE = RANGE * .55;
      var n = clamp(Math.round(W * H / 11000), 40, 150), i;
      if (bodies.length && oW && oH) {
        // a resize keeps the same sky: the bodies stretch into the new size, and a few are added or dropped
        for (i = 0; i < bodies.length; i++) { bodies[i].x *= W / oW; bodies[i].y *= H / oH; bodies[i].ox = bodies[i].x; bodies[i].oy = bodies[i].y; }
        while (bodies.length < n) bodies.push(spawn(Math.random() * W, Math.random() * H, bodies.length));
        bodies.length = n;
      } else {
        bodies = [];
        for (i = 0; i < n; i++) bodies.push(spawn(Math.random() * W, Math.random() * H, i));
      }
      if (!disk.length) for (var k = 0; k < 22; k++) disk.push({ a: Math.random() * 6.283, s: .03 + Math.random() * .035, r: .75 + Math.random() * .45 });
    }
    function spawn(x, y, i) {
      var planet = Math.random() < .14, far = !planet && Math.random() < .55, ang = Math.random() * 6.283, sp = .12 + Math.random() * .3;
      return { x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, far: far,
        r: planet ? 3.4 + Math.random() * 3.4 : far ? .6 + Math.random() * .8 : .9 + Math.random() * 1.3,
        c: planet ? KEYS[i % KEYS.length] : null, lbl: planet ? LEADS[i % LEADS.length] : null, ring: planet && Math.random() < .3, tilt: Math.random() * 6.283,
        star: STARS[(Math.random() * STARS.length) | 0], tw: Math.random() * 6.283, tws: .15 + Math.random() * .35, h: Math.random() * 6.283 };
    }
    function respawnAtEdge(a) {
      var side = (Math.random() * 4) | 0, sp = .5 + Math.random() * .8;
      if (side === 0) { a.x = -12; a.y = Math.random() * H; a.vx = sp; a.vy = (Math.random() - .5) * sp; }
      else if (side === 1) { a.x = W + 12; a.y = Math.random() * H; a.vx = -sp; a.vy = (Math.random() - .5) * sp; }
      else if (side === 2) { a.y = -12; a.x = Math.random() * W; a.vy = sp; a.vx = (Math.random() - .5) * sp; }
      else { a.y = H + 12; a.x = Math.random() * W; a.vy = -sp; a.vx = (Math.random() - .5) * sp; }
    }
    function rgba(hex, al) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + al + ')'; }
    function shade(hex, f) { var n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255;
      return f > 0 ? 'rgb(' + Math.round(r + (255 - r) * f) + ',' + Math.round(g + (255 - g) * f) + ',' + Math.round(b + (255 - b) * f) + ')'
                   : 'rgb(' + Math.round(r * (1 + f)) + ',' + Math.round(g * (1 + f)) + ',' + Math.round(b * (1 + f)) + ')'; }

    function step(f) {
      var i, a, dx, dy, r2, r, inv, ax, ay, sp, k, hold = bh.on && !bh.over;
      bh.mass += (1 - bh.mass) * .01 * f;
      for (i = 0; i < bodies.length; i++) {
        a = bodies[i]; a.ox = a.x; a.oy = a.y;
        r2 = 1e12;
        if (hold && !a.far) {
          dx = bh.x - a.x; dy = bh.y - a.y; r2 = dx * dx + dy * dy; r = Math.sqrt(r2);
          // gravity fades out beyond the hole's range so the far field keeps drifting
          k = r < RANGE ? 1 : r > RANGE + RANGE_FADE ? 0 : 1 - (r - RANGE) / RANGE_FADE;
          if (k > 0) {
            inv = GM * bh.mass * k / Math.pow(r2 + SOFT * SOFT, 1.5);
            // spinning (Kerr) hole: frame-dragging adds a swirl, so bodies orbit and spiral instead of dropping straight in
            ax = (dx - dy * SWIRL) * inv; ay = (dy + dx * SWIRL) * inv;
            a.vx += ax * f; a.vy += ay * f;
          }
          if (r < HORIZON * bh.mass) { swallow(a); continue; }
        }
        sp = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
        if (sp > VMAX) { a.vx *= VMAX / sp; a.vy *= VMAX / sp; sp = VMAX; }
        // far from the hole, fast bodies relax back to a slow drift; near it, almost no drag (so orbits and flings survive)
        var drag = (!hold || r2 > RANGE * RANGE) && sp > CRUISE ? .985 : .9993;
        if (drag !== 1) { var df = Math.pow(drag, f); a.vx *= df; a.vy *= df; }
        if (sp < .1) {
          if (sp < 1e-4) { a.vx = Math.cos(a.h) * .02; a.vy = Math.sin(a.h) * .02; }
          else { var up = (.1 - sp) * .04 * f / sp; a.vx += a.vx * up; a.vy += a.vy * up; }
        }
        a.x += a.vx * f; a.y += a.vy * f;
        if (a.x < -30) { a.x = W + 30; a.ox = a.x; } else if (a.x > W + 30) { a.x = -30; a.ox = a.x; }
        if (a.y < -30) { a.y = H + 30; a.oy = a.y; } else if (a.y > H + 30) { a.y = -30; a.oy = a.y; }
      }
    }
    function swallow(a) {
      flashes.push({ x: bh.x, y: bh.y, t: 0, c: a.c || 'rgb(' + a.star + ')' });
      if (a.c) score();
      bh.mass = Math.min(1.7, bh.mass + (a.c ? .12 : .035));
      respawnAtEdge(a); a.ox = a.x; a.oy = a.y;
    }
    function score() {
      if (won) return;
      caught++;
      if (hud) { hud.hidden = false; hud.classList.remove('bump'); void hud.offsetWidth; hud.classList.add('bump'); }
      if (hudN) hudN.textContent = caught;
      if (caught >= GOAL) {
        won = true;
        for (var k = 0; k < 6; k++) flashes.push({ x: bh.x, y: bh.y, t: -k * .12, c: KEYS[k] });
        if (hud) hud.classList.add('won'); if (hudWin) hudWin.hidden = false; if (tip) tip.hidden = true;
        // play again after a pause
        setTimeout(function () { won = false; caught = 0; if (hudN) hudN.textContent = 0; if (hud) hud.classList.remove('won'); if (hudWin) hudWin.hidden = true; }, 9000);
      }
    }
    // let go: everything near the hole keeps its orbital speed (that is the fling) plus a share of the hole's own motion
    function release() {
      if (!bh.on) return;
      for (var i = 0; i < bodies.length; i++) {
        var a = bodies[i], dx = a.x - bh.x, dy = a.y - bh.y, d = Math.sqrt(dx * dx + dy * dy);
        if (!a.far && d < RANGE) { var k = 1 - d / RANGE; a.vx += bh.vx * .55 * k; a.vy += bh.vy * .55 * k; }
      }
      bh.on = false;
    }

    function drawHole(t) {
      var s = bh.shown, R = HORIZON * bh.mass * (.6 + .4 * s);
      if (s < .02) return;
      var x = bh.x, y = bh.y, tilt = -.38 + clamp(bh.vx * .012, -.25, .25), rx = R * 3.9, ry = R * 1.05;
      // lensing glow
      var g = ctx.createRadialGradient(x, y, R * .9, x, y, R * 5.5);
      g.addColorStop(0, 'rgba(255,214,170,' + .34 * s + ')'); g.addColorStop(.25, 'rgba(255,120,190,' + .12 * s + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R * 5.5, 0, 6.283); ctx.fill();
      // accretion disk: back half, horizon, front half (approaching side brighter)
      var lg = ctx.createLinearGradient(-rx, 0, rx, 0); // used inside the translated/rotated frame below
      lg.addColorStop(0, 'rgba(255,244,214,' + .95 * s + ')'); lg.addColorStop(.3, 'rgba(255,170,80,' + .9 * s + ')'); lg.addColorStop(.7, 'rgba(255,79,150,' + .75 * s + ')'); lg.addColorStop(1, 'rgba(157,140,255,' + .45 * s + ')');
      ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
      ctx.strokeStyle = lg; ctx.lineWidth = R * .38;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, Math.PI, 6.283); ctx.stroke();
      drawDisk(R, rx, ry, s, false);
      ctx.restore();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x, y, R, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(255,226,190,' + .9 * s + ')'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, R * 1.12, 0, 6.283); ctx.stroke();
      ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
      ctx.strokeStyle = lg; ctx.lineWidth = R * .5;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI); ctx.stroke();
      drawDisk(R, rx, ry, s, true);
      ctx.restore();
    }
    function drawDisk(R, rx, ry, s, front) {
      for (var i = 0; i < disk.length; i++) {
        var p = disk[i], sn = Math.sin(p.a);
        if ((sn > 0) !== front) continue;
        ctx.fillStyle = 'rgba(255,' + (200 + (sn * 40 | 0)) + ',170,' + (.75 * s) + ')';
        ctx.beginPath(); ctx.arc(Math.cos(p.a) * rx * p.r, sn * ry * p.r, 1.1, 0, 6.283); ctx.fill();
      }
    }

    function frame(t) {
      if (!running) return;
      var raw = last ? clamp((t - last) / 16.667, .5, 2.2) : 1; last = t;
      fs += (raw - fs) * .15; var f = fs;
      bh.shown += ((bh.on ? (bh.over ? .3 : 1) : 0) - bh.shown) * clamp(.12 * f, 0, 1);
      for (var q = 0; q < disk.length; q++) disk[q].a += disk[q].s * f * (.5 + bh.mass * .5);
      step(f);
      draw(t);
      raf(frame);
    }
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      var i, j, a, b, dx, dy, d, sp;
      // constellation lines between nearby, slow bodies
      ctx.lineWidth = 1;
      for (i = 0; i < bodies.length; i++) {
        a = bodies[i]; var ka = clamp(1 - (Math.abs(a.vx) + Math.abs(a.vy) - 2) / 4, 0, 1); if (!ka) continue;
        for (j = i + 1; j < bodies.length; j++) {
          b = bodies[j]; dx = a.x - b.x; dy = a.y - b.y; d = dx * dx + dy * dy;
          var kb = d < D * D ? clamp(1 - (Math.abs(b.vx) + Math.abs(b.vy) - 2) / 4, 0, 1) : 0;
          if (kb) {
            var al = (1 - Math.sqrt(d) / D) * .4 * ka * kb, col = a.c || b.c;
            ctx.strokeStyle = col ? rgba(col, al * 1.2) : 'rgba(243,240,234,' + al * .7 + ')';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      // comets: signals hopping between nearby stars
      if (t - lastPulse > 300 && pulses.length < 10) {
        lastPulse = t;
        var s0 = bodies[(Math.random() * bodies.length) | 0], best = null, bd = D * D;
        for (j = 0; j < bodies.length; j++) { b = bodies[j]; if (b === s0) continue; dx = s0.x - b.x; dy = s0.y - b.y; d = dx * dx + dy * dy; if (d < bd && Math.random() < .5) { bd = d; best = b; } }
        if (best) pulses.push({ a: s0, b: best, p: 0, c: s0.c || best.c || KEYS[(Math.random() * KEYS.length) | 0] });
      }
      for (i = pulses.length - 1; i >= 0; i--) {
        var pz = pulses[i]; pz.p += .02; if (pz.p >= 1) { pulses.splice(i, 1); continue; }
        var px = pz.a.x + (pz.b.x - pz.a.x) * pz.p, py = pz.a.y + (pz.b.y - pz.a.y) * pz.p;
        ctx.fillStyle = rgba(pz.c, .16); ctx.beginPath(); ctx.arc(px, py, 5, 0, 6.283); ctx.fill();
        ctx.fillStyle = rgba(pz.c, .95); ctx.beginPath(); ctx.arc(px, py, 1.5, 0, 6.283); ctx.fill();
      }
      // bodies (trails for fast movers)
      for (i = 0; i < bodies.length; i++) {
        a = bodies[i]; sp = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
        if (sp > 1.6 && a.ox !== undefined) {
          var tl = Math.min(sp * 3.2, 70), nx = a.vx / sp, ny = a.vy / sp;
          var tg = ctx.createLinearGradient(a.x - nx * tl, a.y - ny * tl, a.x, a.y);
          tg.addColorStop(0, 'rgba(0,0,0,0)'); tg.addColorStop(1, a.c ? rgba(a.c, .7) : 'rgba(' + a.star + ',.6)');
          ctx.strokeStyle = tg; ctx.lineWidth = Math.max(1, a.r * .9);
          ctx.beginPath(); ctx.moveTo(a.x - nx * tl, a.y - ny * tl); ctx.lineTo(a.x, a.y); ctx.stroke();
        }
        if (a.c) drawPlanet(a); else {
          var tw = .9 + .1 * Math.sin(t * .001 * a.tws + a.tw);   // very slow, very gentle: no flicker
          ctx.fillStyle = 'rgba(' + a.star + ',' + (a.far ? .42 : .82) * tw + ')';
          ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill();
          if (a.r > 1.8) { ctx.fillStyle = 'rgba(' + a.star + ',' + .09 * tw + ')'; ctx.beginPath(); ctx.arc(a.x, a.y, a.r * 3.2, 0, 6.283); ctx.fill(); }
        }
      }
      // swallowed flashes
      for (i = flashes.length - 1; i >= 0; i--) {
        var fl = flashes[i]; fl.t += .045; if (fl.t >= 1) { flashes.splice(i, 1); continue; } if (fl.t < 0) continue;
        ctx.strokeStyle = fl.c.charAt(0) === '#' ? rgba(fl.c, 1 - fl.t) : fl.c.replace('rgb(', 'rgba(').replace(')', ',' + (1 - fl.t) + ')');
        ctx.lineWidth = 2 * (1 - fl.t); ctx.beginPath(); ctx.arc(fl.x, fl.y, HORIZON * (1.2 + fl.t * 4), 0, 6.283); ctx.stroke();
      }
      if (bh.on || bh.shown > .02) drawHole(t);
    }
    function drawPlanet(a) {
      // lit from the black hole when it is present, otherwise from the top left
      var lx = -.6, ly = -.6;
      if (bh.shown > .05) { var dx = bh.x - a.x, dy = bh.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1; lx = dx / d; ly = dy / d; }
      ctx.fillStyle = rgba(a.c, .16); ctx.beginPath(); ctx.arc(a.x, a.y, a.r * 3.4, 0, 6.283); ctx.fill();
      if (a.ring) { ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.tilt); ctx.strokeStyle = rgba(a.c, .55); ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.ellipse(0, 0, a.r * 2.3, a.r * .7, 0, Math.PI, 6.283); ctx.stroke(); ctx.restore(); }
      var g = ctx.createRadialGradient(a.x + lx * a.r * .45, a.y + ly * a.r * .45, a.r * .1, a.x, a.y, a.r);
      g.addColorStop(0, shade(a.c, .55)); g.addColorStop(.55, a.c); g.addColorStop(1, shade(a.c, -.55));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill();
      if (a.ring) { ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.tilt); ctx.strokeStyle = rgba(a.c, .75); ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.ellipse(0, 0, a.r * 2.3, a.r * .7, 0, 0, Math.PI); ctx.stroke(); ctx.restore(); }
      if (a.lbl && bh.shown > .05) {
        ctx.font = '500 10px "JetBrains Mono", ui-monospace, monospace'; ctx.textAlign = 'center';
        ctx.fillStyle = rgba(a.c, .85 * bh.shown); ctx.fillText(a.lbl, a.x, a.y + a.r + 14);
      }
    }

    function start() { if (running || reduce || !visible || document.hidden) return; running = true; last = 0; raf(frame); }
    function stop() { running = false; }
    size();
    if (reduce) draw(0); else start();
    // the drawing buffer follows the canvas's own size (it changes when the hero settles its height as the fonts arrive,
    // which no resize event reports, and the sky was then stretched and the hole drawn off the finger); a phone's
    // address bar showing or hiding fires resize without changing the canvas, and no longer rebuilds anything
    var rt;
    function resized() { clearTimeout(rt); rt = setTimeout(function () {
      var r = cv.getBoundingClientRect();
      if (Math.abs(r.width - W) < 1 && Math.abs(r.height - H) < 1 && Math.min(window.devicePixelRatio || 1, 2) === dpr) return;
      size(); if (reduce) draw(0);
    }, 150); }
    if ('ResizeObserver' in window) new ResizeObserver(resized).observe(cv);
    window.addEventListener('resize', resized);

    function place(e) {
      var r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (bh.on) { bh.vx = bh.vx * .6 + (x - bh.x) * .4; bh.vy = bh.vy * .6 + (y - bh.y) * .4; } else { bh.vx = 0; bh.vy = 0; }
      bh.x = x; bh.y = y;
      bh.over = !!(e.target && e.target.closest && e.target.closest('a,button'));
    }
    if (!reduce) {
      if (fine) hero.classList.add('bh-cursor');
      if (tip) { tip.textContent = fine ? 'Psst: your cursor is a black hole. Catch 10 leads.' : 'Psst: hold and drag to make a black hole. Catch 10 leads.'; tip.hidden = false; }
      hero.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch' && !bh.on) return;
        place(e); bh.on = true;
      });
      hero.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { place(e); bh.on = true; } });
      hero.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') release(); });
      hero.addEventListener('pointercancel', release);
      hero.addEventListener('pointerleave', release);
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(hero);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  })();

  /* ── hero quote: words rise out of a mask (blur → sharp), hold ~11 s, then leave upward before the next one.
     Only transform/opacity/filter animate, and the block keeps the tallest quote's height, so nothing shifts.
     "*word*" in the data marks the keyword drawn in the spectrum gradient. Static with reduced motion. ── */
  var hq = document.querySelector('[data-quotes]');
  if (hq) (function () {
    var items = [].slice.call(document.querySelectorAll('.hq-list li')).map(function (li) {
      return { t: li.textContent.trim(), by: li.getAttribute('data-by') || '' }; });
    var tEl = hq.querySelector('.hq-t'), byEl = hq.querySelector('.hq-by');
    if (!items.length || !tEl || !byEl) return;
    var idx = 0, timer = 0, heroOn = true, heroEl = document.getElementById('hero');
    function render(q) {
      tEl.textContent = ''; var n = 0;
      q.t.split(/(\*[^*]+\*)/).forEach(function (part) {
        if (!part) return;
        var acc = part.charAt(0) === '*' && part.length > 2, text = acc ? part.slice(1, -1) : part;
        text.split(/(\s+)/).forEach(function (tok) {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { tEl.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'), wi = document.createElement('span');
          w.className = 'w'; wi.className = acc ? 'wi acc' : 'wi'; wi.textContent = tok;
          wi.style.transitionDelay = (n * 55) + 'ms'; n++;
          w.appendChild(wi); tEl.appendChild(w);
        });
      });
      byEl.textContent = q.by;
      return n;
    }
    function reserve() {
      hq.style.minHeight = ''; var max = 0;
      // rounded up from the exact height, so a quote a fraction of a pixel taller than the rest cannot nudge the page
      items.forEach(function (q) { render(q); max = Math.max(max, Math.ceil(hq.getBoundingClientRect().height)); });
      render(items[idx]); hq.style.minHeight = max + 'px';
    }
    function show(q) {
      var n = render(q);
      byEl.style.transitionDelay = (n * 55 + 300) + 'ms';
      hq.classList.remove('leave', 'show');
      raf(function () { raf(function () { hq.classList.add('show'); }); });
      schedule();
    }
    function next() {
      if (!heroOn || document.hidden) { schedule(); return; }
      var ws = tEl.querySelectorAll('.wi');
      for (var i = 0; i < ws.length; i++) ws[i].style.transitionDelay = (i * 28) + 'ms';
      byEl.style.transitionDelay = '0ms';
      hq.classList.add('leave'); hq.classList.remove('show');
      setTimeout(function () { idx = (idx + 1) % items.length; show(items[idx]); }, 720 + ws.length * 28);
    }
    function schedule() { clearTimeout(timer); timer = setTimeout(next, 11000); }
    reserve();
    // the quotes' size follows the width only, so a height-only resize (a phone's address bar) leaves them alone
    var rq, rqW = window.innerWidth; window.addEventListener('resize', function () { clearTimeout(rq); rq = setTimeout(function () {
      if (window.innerWidth === rqW) return; rqW = window.innerWidth; reserve(); hq.classList.add('show'); }, 200); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { reserve(); hq.classList.add('show'); });
    if (reduce) { hq.classList.add('show'); return; }
    if ('IntersectionObserver' in window && heroEl) new IntersectionObserver(function (es) { heroOn = es[0].isIntersecting; }).observe(heroEl);
    show(items[0]);
  })();

  /* ── INTP gears: tabs + map. The auto-advance runs only where the map sits beside the panels (1024px and up);
     on phones and tablets each panel keeps its own height, so it changes only when the reader taps a tab. ── */
  var gears = document.querySelector('[data-gears]');
  if (gears) (function () {
    var tabs = [].slice.call(gears.querySelectorAll('.gtab')), order = tabs.map(function (t) { return t.getAttribute('data-g'); });
    var nodes = [].slice.call(gears.querySelectorAll('.gnode')), touched = false, cur = 'ti', timer = null, inView = false;
    var sideBySide = window.matchMedia('(min-width: 1024px)');   // same as .gears' two columns in home.css
    function select(g, focus, user) {
      if (user) touched = true;
      cur = g;
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-g') === g;
        t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus();
        var p = document.getElementById(t.getAttribute('aria-controls'));
        if (on) { if (p.hidden) { p.hidden = false; p.classList.remove('enter'); void p.offsetWidth; p.classList.add('enter'); } }
        else p.hidden = true;
      });
      nodes.forEach(function (n) { n.classList.toggle('on', n.getAttribute('data-g') === g); });
      gears.classList.add('has-sel');
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t.getAttribute('data-g'), false, true); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') n = (i + 1) % tabs.length;
        if (k === 'ArrowLeft' || k === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
        if (k === 'Home') n = 0; if (k === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(order[n], true, true); }
      });
    });
    nodes.forEach(function (n) { n.addEventListener('click', function () { select(n.getAttribute('data-g'), false, true); }); });
    select('ti');
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: .35 }).observe(gears);
      timer = setInterval(function () {
        if (touched || !inView || document.hidden || !sideBySide.matches) return;
        select(order[(order.indexOf(cur) + 1) % order.length]);
      }, 6500);
      gears.addEventListener('pointerenter', function () { touched = true; });
    }
  })();

  /* ── scroll-linked pieces below share one passive scroll listener and one rAF per frame.
     Each piece reads its layout first, then writes transforms or opacity only. ── */
  var hasIO = 'IntersectionObserver' in window;
  var onFrame = [], onResize = [], queued = false;
  function frameAll() { queued = false; for (var i = 0; i < onFrame.length; i++) onFrame[i](); }
  function kick() { if (!queued) { queued = true; raf(frameAll); } }
  window.addEventListener('scroll', kick, { passive: true });
  var rsT; window.addEventListener('resize', function () { clearTimeout(rsT); rsT = setTimeout(function () { for (var i = 0; i < onResize.length; i++) onResize[i](); kick(); }, 120); });

  /* ── ambient glow: three fixed layers crossfade (opacity only) to the colours of the section at mid-screen.
     In the work section it follows the card on top. Off in the hero, which has its own sky. ── */
  var ambSection = 'hero', ambKey = 1, ambApply = function () {};
  var amb = document.querySelector('.amb');
  if (amb && amb.children.length > 1 && hasIO) (function () {
    var L = [].slice.call(amb.children), front = -1, cur = 'none', last = 0, timer = 0;
    var PAL = { hero: 'none', brain: 'brain', results: 'results', how: 'how', contact: 'contact' };
    function want() { return ambSection === 'work' ? 'k' + ambKey : (PAL[ambSection] || 'none'); }
    function swap(name) {
      cur = name; last = Date.now();
      for (var i = 0; i < L.length; i++) L[i].classList.remove('on');
      if (name === 'none') return;
      front = (front + 1) % L.length;           // the layer re-used here faded out two swaps ago
      L[front].className = 'p-' + name + ' on';
    }
    ambApply = function () {
      var w = want(); clearTimeout(timer);
      if (w === cur) return;
      var wait = 600 - (Date.now() - last);       // let one crossfade get going before the next
      if (wait > 0) timer = setTimeout(ambApply, wait); else swap(w);
    };
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { ambSection = e.target.id; ambApply(); } });
    }, { rootMargin: '-48% 0px -48% 0px' });
    ['hero', 'brain', 'results', 'work', 'how', 'contact'].forEach(function (id) { var s = document.getElementById(id); if (s) so.observe(s); });
  })();

  /* ── section headings rise word by word as they enter. Words inside <em> keep one continuous gradient. ── */
  var heads = [].slice.call(document.querySelectorAll('.sec .sh > .h2, .contact .mega, .fan-h'));
  if (heads.length && !reduce && hasIO) (function () {
    var runs = [];
    function split(h) {
      var n = 0, frag = document.createDocumentFragment();
      function words(text, run) {
        text.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          var wd = document.createElement('span'), wi = document.createElement(run ? 'em' : 'span');
          wd.className = 'wd'; wi.className = 'wi'; wi.textContent = part; wi.style.setProperty('--wi', n++);
          wd.appendChild(wi); frag.appendChild(wd);
          if (run) run.push(wi);
        });
      }
      [].slice.call(h.childNodes).forEach(function (node) {
        if (node.nodeType === 3) words(node.textContent, null);
        else if (node.nodeType === 1 && node.tagName === 'EM' && !node.children.length) { var run = []; words(node.textContent, run); runs.push(run); }
        else frag.appendChild(node);
      });
      h.textContent = ''; h.appendChild(frag); h.classList.add('split');
    }
    // one gradient across the italic words: size it to the whole phrase and offset each word into it (in em, so it survives resizes)
    function grad(run) {
      if (!run.length) return;
      var fs = parseFloat(getComputedStyle(run[0]).fontSize) || 16, acc = 0, offs = [], i;
      for (i = 0; i < run.length; i++) {
        offs.push(acc);
        var gap = fs * .25;
        if (i < run.length - 1) {
          var a = run[i].parentNode.getBoundingClientRect(), b = run[i + 1].parentNode.getBoundingClientRect();
          if (Math.abs(a.top - b.top) < 2) gap = b.left - a.right;
        }
        acc += run[i].offsetWidth + (i < run.length - 1 ? gap : 0);
      }
      for (i = 0; i < run.length; i++) {
        run[i].style.backgroundSize = (acc / fs).toFixed(3) + 'em 100%';
        run[i].style.backgroundPosition = (-offs[i] / fs).toFixed(3) + 'em 0';
      }
    }
    heads.forEach(split);
    function grads() { runs.forEach(grad); }
    grads();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(grads);
    var ho = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('wi-in'); ho.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: .15 });
    heads.forEach(function (h) { ho.observe(h); });
  })();

  /* ── work: a 3D deck. Incoming cards rise tilted and settle flat; covered cards tip back, recede and dim;
     the card on top leans toward a fine pointer with a moving glare; the rail jumps between cards.
     Phones and tablets (no sticky stack) deal the cards in instead. Reduced motion: none of it. ── */
  var stackEl = document.querySelector('[data-stack]');
  if (stackEl) (function () {
    var cards = [].slice.call(stackEl.children).filter(function (c) { return c.classList.contains('pj'); });
    var n = cards.length; if (!n) return;
    var inners = cards.map(function (c) { return c.firstElementChild; });
    var wideMQ = window.matchMedia('(min-width: 900px) and (min-height: 700px)');   // same as the sticky stack in home.css
    var fine = !reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var rail = document.querySelector('.deck-rail'), links = rail ? [].slice.call(rail.querySelectorAll('a[data-i]')) : [];
    // each card keeps its project key (pj-5 → k5) and each rail link finds its card by its own href (data-i is only
    // the fallback), so a hidden project never shifts the colours or the jumps
    var keys = cards.map(function (c, i) { var m = /(\d+)$/.exec(c.id || ''); return m ? +m[1] : i + 1; });
    var linkIdx = links.map(function (l, k) {
      var id = (l.getAttribute('href') || '').replace(/^#/, ''), i = id ? cards.indexOf(document.getElementById(id)) : -1;
      if (i < 0) i = parseInt(l.getAttribute('data-i'), 10);
      return i >= 0 && i < n ? i : Math.min(k, n - 1);
    });
    var S = [], shades = [], glares = [], tops = [], hs = [], ws = [], last = [], lastSh = [];
    var wide = false, deck = false, near = !hasIO, active = -1, hover = -1, tiltRaf = 0, CAP = 4.5;
    for (var k = 0; k < n; k++) {
      S.push({ p: 0, q: 1, tx: 0, ty: 0, ttx: 0, tty: 0, gx: .5, gy: .5, tgx: .5, tgy: .5 });
      var sh = document.createElement('span'); sh.className = 'pj-shade'; sh.setAttribute('aria-hidden', 'true'); inners[k].appendChild(sh); shades.push(sh);
      if (fine) { var gl = document.createElement('span'); gl.className = 'pj-glare'; gl.setAttribute('aria-hidden', 'true'); inners[k].appendChild(gl); glares.push(gl); }
    }
    function measure() {
      wide = wideMQ.matches; deck = wide && !reduce;
      root.classList.toggle('deck3d', deck);
      for (var i = 0; i < n; i++) {
        tops[i] = parseFloat(getComputedStyle(cards[i]).top) || 0;
        hs[i] = inners[i].offsetHeight; ws[i] = inners[i].offsetWidth; last[i] = null; lastSh[i] = null;
        if (!deck) { inners[i].style.transform = ''; shades[i].style.opacity = ''; S[i].p = 0; S[i].q = 1; }
      }
      if (rail) { rail.hidden = !wide; if (!wide) rail.classList.remove('on'); }
    }
    function compose(i) {
      var s = S[i], H = hs[i], t = '';
      // covered: tip back about the top edge and recede
      if (s.p > .001) t += ' translate3d(0,' + (-s.p * 14).toFixed(1) + 'px,' + (-s.p * 140).toFixed(1) + 'px) rotateX(' + (s.p * 8).toFixed(2) + 'deg)';
      // incoming: lean back about the bottom edge, flattening as it reaches its place
      if (s.q < .999) { var e = (1 - s.q) * (1 - s.q); t += ' translate3d(0,' + H + 'px,0) rotateX(' + (e * 18).toFixed(2) + 'deg) translate3d(0,' + (-H) + 'px,0)'; }
      // pointer: face the cursor, about the centre
      if (Math.abs(s.tx) > .002 || Math.abs(s.ty) > .002) t += ' translate3d(0,' + (H / 2).toFixed(1) + 'px,0) rotateX(' + (-s.ty * CAP).toFixed(2) + 'deg) rotateY(' + (s.tx * CAP).toFixed(2) + 'deg) translate3d(0,' + (-H / 2).toFixed(1) + 'px,0)';
      return t ? 'perspective(1800px)' + t : '';
    }
    function paint(i) {
      var s = S[i], t = compose(i);
      if (t !== last[i]) { inners[i].style.transform = t; last[i] = t; }
      var o = Math.max(s.p * .58, (1 - s.q) * .45).toFixed(3);
      if (o !== lastSh[i]) { shades[i].style.opacity = o; lastSh[i] = o; }
      if (glares[i] && i === hover) glares[i].style.transform = 'translate3d(' + (s.gx * ws[i] - ws[i] * .31).toFixed(1) + 'px,' + (s.gy * hs[i] - ws[i] * .31).toFixed(1) + 'px,0)';
    }
    function setActive(a) {
      if (a === active) return;
      active = a;
      links.forEach(function (l, k) { if (linkIdx[k] === a) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
      cards.forEach(function (c, i) { c.classList.toggle('is-top', i === a); });   // accent glow on the card on top
      if (hover > -1 && hover !== a) leave();
      ambKey = keys[a] || 1; ambApply();
    }
    function update() {
      if (!near) return;
      var vh = window.innerHeight, r = [], i, a = 0;
      for (i = 0; i < n; i++) r.push(cards[i].getBoundingClientRect());
      for (i = 0; i < n; i++) if (r[i].top < vh * .5) a = i;
      if (deck) {
        for (i = 0; i < n; i++) {
          S[i].q = clamp(1 - (r[i].top - tops[i]) / (vh * .75), 0, 1);
          S[i].p = i < n - 1 ? clamp(1 - (r[i + 1].top - r[i].top) / r[i].height, 0, 1) : 0;
        }
        for (i = 0; i < n; i++) paint(i);
      }
      setActive(a);
      if (rail) rail.classList.toggle('on', wide && r[0].top < vh * .62 && r[n - 1].bottom > vh * .4);
    }

    /* pointer tilt + glare (fine pointers, the card on top only; eased, capped at CAP degrees) */
    function leave() {
      if (hover < 0) return;
      S[hover].ttx = 0; S[hover].tty = 0; inners[hover].classList.remove('tilt'); hover = -1; startTilt();
    }
    function startTilt() { if (!tiltRaf) tiltRaf = raf(tiltStep); }
    function tiltStep() {
      tiltRaf = 0; var moving = false;
      for (var i = 0; i < n; i++) {
        var s = S[i];
        if (i !== hover && s.tx === 0 && s.ty === 0) continue;
        s.tx += (s.ttx - s.tx) * .14; s.ty += (s.tty - s.ty) * .14;
        s.gx += (s.tgx - s.gx) * .22; s.gy += (s.tgy - s.gy) * .22;
        if (Math.abs(s.ttx - s.tx) < .003 && Math.abs(s.tty - s.ty) < .003) { s.tx = s.ttx; s.ty = s.tty; } else moving = true;
        if (Math.abs(s.tgx - s.gx) > .003 || Math.abs(s.tgy - s.gy) > .003) moving = true;
        if (deck) paint(i);
      }
      if (moving) tiltRaf = raf(tiltStep);
    }
    if (fine) {
      stackEl.addEventListener('pointermove', function (e) {
        if (!deck || e.pointerType !== 'mouse') return;
        var c = e.target.closest ? e.target.closest('.pj') : null, i = cards.indexOf(c);
        if (i < 0 || i !== active) { leave(); return; }
        var rr = inners[i].getBoundingClientRect();
        var nx = clamp((e.clientX - rr.left) / rr.width, 0, 1), ny = clamp((e.clientY - rr.top) / rr.height, 0, 1);
        if (hover !== i) { leave(); hover = i; inners[i].classList.add('tilt'); S[i].gx = nx; S[i].gy = ny; }
        S[i].ttx = nx * 2 - 1; S[i].tty = ny * 2 - 1; S[i].tgx = nx; S[i].tgy = ny;
        startTilt();
      });
      stackEl.addEventListener('pointerleave', leave);
    }

    /* rail: jump to the moment a card has just settled on top */
    function targetY(i) {
      var y = stackEl.getBoundingClientRect().top + window.pageYOffset + (parseFloat(getComputedStyle(stackEl).paddingTop) || 0);
      for (var j = 0; j <= i; j++) { if (j) y += cards[j - 1].offsetHeight; y += parseFloat(getComputedStyle(cards[j]).marginTop) || 0; }
      return Math.max(0, Math.round(y - tops[i] + 2));
    }
    links.forEach(function (l, k) {
      l.addEventListener('click', function (e) {
        if (!wide) return;
        e.preventDefault();
        window.scrollTo({ top: targetY(linkIdx[k]), behavior: reduce ? 'auto' : 'smooth' });
      });
    });

    /* keyboard: a card reached with Tab or Shift+Tab settles on top, so its focus ring is never under the next card
       (mouse and touch focus, which is not :focus-visible, never scrolls) */
    stackEl.addEventListener('focusin', function (e) {
      if (!wide) return;
      var i = cards.indexOf(e.target.closest ? e.target.closest('.pj') : null);
      if (i < 0) return;
      var kb = true; try { kb = e.target.matches(':focus-visible'); } catch (x) {}
      if (!kb) return;
      var y = targetY(i);
      if (Math.abs(window.pageYOffset - y) > 2) window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    });

    /* phones and tablets: deal each card in as it arrives (CSS limits this to narrow screens) */
    if (!reduce && hasIO) {
      var po = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('pj-on'); po.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -10% 0px', threshold: .04 });
      cards.forEach(function (c) { c.classList.add('pj-pre'); po.observe(c); });
    }

    if (hasIO) new IntersectionObserver(function (es) {
      near = es[0].isIntersecting;
      if (near) kick(); else if (rail) rail.classList.remove('on');
    }, { rootMargin: '100% 0px 100% 0px' }).observe(document.getElementById('work') || stackEl);
    measure(); onResize.push(measure); onFrame.push(update);
    if (wideMQ.addEventListener) wideMQ.addEventListener('change', function () { measure(); kick(); });
    kick();
  })();

  /* ── finale: after card 07 the deck fans out into all six (wide screens with motion; a plain grid otherwise) ── */
  var fan = document.querySelector('[data-fan]');
  if (fan) (function () {
    var list = fan.querySelector('.fan-list'); if (!list) return;
    var items = [].slice.call(list.children), m = items.length, wideMQ = window.matchMedia('(min-width: 900px)');
    var L = [], on = false, near = !hasIO, last = [];
    function measure() {
      on = wideMQ.matches && !reduce;
      items.forEach(function (it) { it.style.transform = ''; });
      last = [];
      if (!on) return;
      var W = list.clientWidth, H = list.clientHeight, cx = W / 2, cy = H / 2;
      L = items.map(function (it, i) {
        var x = it.offsetLeft + it.offsetWidth / 2, y = it.offsetTop + it.offsetHeight / 2, u = clamp((x - cx) / (W / 2), -1, 1);
        return { dx: cx - x, dy: cy - y, r0: (i - (m - 1) / 2) * 2.2, r1: u * 7, arc: u * u * 26, lift: (m - 1 - i) * 5 };
      });
    }
    function update() {
      if (!on || !near) return;
      var vh = window.innerHeight, r = list.getBoundingClientRect();
      var f = clamp((vh * .96 - r.top) / (vh * .52), 0, 1), e = 1 - Math.pow(1 - f, 3), k = 1 - e;
      for (var i = 0; i < m; i++) {
        var l = L[i];
        var t = 'translate3d(' + (l.dx * k).toFixed(1) + 'px,' + (l.dy * k - l.lift * k + l.arc * e).toFixed(1) + 'px,0) rotate(' + (l.r0 * k + l.r1 * e).toFixed(2) + 'deg) scale(' + (1 + .1 * k).toFixed(3) + ')';
        if (t !== last[i]) { items[i].style.transform = t; last[i] = t; }
      }
    }
    if (hasIO) new IntersectionObserver(function (es) { near = es[0].isIntersecting; if (near) kick(); }, { rootMargin: '50% 0px 50% 0px' }).observe(list);
    measure(); onResize.push(measure); onFrame.push(update);
    if (wideMQ.addEventListener) wideMQ.addEventListener('change', function () { measure(); kick(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); kick(); });
    kick();
  })();

  if (!onFrame.length) window.removeEventListener('scroll', kick);

  /* ── copy email ── */
  var cp = document.querySelector('.copy');
  if (cp && navigator.clipboard) {
    cp.hidden = false;
    cp.addEventListener('click', function () {
      navigator.clipboard.writeText(cp.getAttribute('data-copy')).then(function () {
        cp.textContent = 'Copied ✓'; setTimeout(function () { cp.textContent = 'Copy'; }, 1800);
      });
    });
  }
})();

/* 3D Lab redirect section: the reel loads only when it nears the viewport, plays while visible, pauses when not,
   and never runs with reduced motion, with Data Saver on or on a slow (2G/3G) connection (the poster image stays). */
(() => {
  const v = document.querySelector('.lt-vid');
  if (!v || !('IntersectionObserver' in window)) return;
  const net = navigator.connection;
  if (net && (net.saveData || /^(slow-2g|2g|3g)$/.test(net.effectiveType || ''))) return;
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  let ready = false;
  const load = () => {
    if (ready) return; ready = true;
    const s = document.createElement('source'); s.src = v.dataset.mp4; s.type = 'video/mp4'; v.appendChild(s);
    v.load();
  };
  v.addEventListener('playing', () => v.classList.add('on'));
  new IntersectionObserver(es => {
    for (const e of es) {
      if (e.isIntersecting && !rm.matches) { load(); const pr = v.play(); if (pr) pr.catch(() => {}); }
      else if (!e.isIntersecting && !v.paused) v.pause();
    }
  }, { rootMargin: '240px 0px' }).observe(v);
})();

/* Mobile menu (≤860px): a toggle in the header opens a full-screen menu built from the header's own links (one source
   of truth on every page). Esc or a link closes it; focus stays inside while it is open and returns to the toggle. */
(() => {
  const hd = document.querySelector('.hd');
  const nav = hd && hd.querySelector('.hd-nav');
  if (!hd || !nav || hd.querySelector('.hd-menu')) return;
  const root = document.documentElement;
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'hd-menu';
  btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'mnav'); btn.setAttribute('aria-label', 'Open menu');
  btn.append(document.createElement('i'), document.createElement('i'));
  hd.appendChild(btn);
  const menu = document.createElement('div');
  menu.className = 'mnav'; menu.id = 'mnav';
  menu.setAttribute('role', 'dialog'); menu.setAttribute('aria-modal', 'true'); menu.setAttribute('aria-label', 'Menu');
  const k = document.createElement('p'); k.className = 'mnav-k'; k.textContent = 'Menu'; menu.appendChild(k);
  const ol = document.createElement('ol');
  [...nav.querySelectorAll('a')].forEach((a, i) => {
    const li = document.createElement('li'), l = document.createElement('a'), n = document.createElement('span');
    l.className = 'ml'; l.href = a.getAttribute('href');
    if (a.hasAttribute('aria-current')) l.setAttribute('aria-current', a.getAttribute('aria-current'));
    n.textContent = String(i + 1).padStart(2, '0');
    l.append(n, document.createTextNode(a.textContent.trim()));
    li.appendChild(l); ol.appendChild(li);
  });
  menu.appendChild(ol);
  const cta = hd.querySelector('.hd-cta');
  if (cta) { const c = cta.cloneNode(true); c.className = 'mnav-cta'; c.removeAttribute('id'); menu.appendChild(c); }
  document.body.appendChild(menu);
  const focusables = () => [btn, ...menu.querySelectorAll('a')];
  const isOpen = () => root.classList.contains('nav-open');
  const set = (open, restore) => {
    root.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) { hd.classList.remove('hide'); setTimeout(() => { const f = menu.querySelector('a'); if (f) f.focus({ preventScroll: true }); }, 80); }
    else if (restore) btn.focus({ preventScroll: true });
  };
  btn.addEventListener('click', () => set(!isOpen(), true));
  menu.addEventListener('click', e => { if (e.target.closest('a')) set(false, false); });
  document.addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); set(false, true); return; }
    if (e.key === 'Tab') {
      // the toggle lives in the header and the menu at the end of <body>, so the browser's own Tab order would leave
      // the toggle for the page underneath; cycle through toggle + menu links by hand instead
      const f = focusables(), i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[i < 0 ? (e.shiftKey ? f.length - 1 : 0) : (i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  const wide = matchMedia('(min-width: 861px)');
  const onWide = e => { if (e.matches && isOpen()) set(false, false); };
  if (wide.addEventListener) wide.addEventListener('change', onWide); else if (wide.addListener) wide.addListener(onWide);
  window.addEventListener('pageshow', () => { if (isOpen()) set(false, false); });
})();
