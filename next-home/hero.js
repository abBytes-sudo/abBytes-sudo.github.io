/* His live hero (gravity field and rotating line), lifted from site/assets/home.js. Added here: the hero's text leans toward the black
   hole (the same letter pull as the contact section), and the hole hands over to the big one in the next section when the page scrolls. */
(function () {
  var root = document.documentElement;
  root.classList.remove('no-js'); root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = window.requestAnimationFrame.bind(window);
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  /* ── hero text feels the hole. Each letter is its own span and leans toward the black hole when it is near, with the same spring
     as the contact section; a hidden copy keeps the words for screen readers. Only letters near the hole are touched each frame. ── */
  var HL = (function () {
    var L = [], act = [], dirty = true, R = 110, R2 = R * R, CUT = R * 2.1;
    function E(tag, cls, txt) { var e = document.createElement(tag); e.className = cls; if (txt !== undefined) e.textContent = txt; return e; }
    function unit(el) { L.push({ el: el, cx: NaN, cy: NaN, fs: 16, k: .5, x: 0, y: 0, r: 0, s: 0, vx: 0, vy: 0, vr: 0, vs: 0, p: 0, on: false, glow: !el.classList.contains('acc') }); dirty = true; return el; }
    /* a word as letters; an accent word (drawn in the gradient) moves as one piece so its colours stay whole */
    function word(text, acc) { var w = E('i', 'hl-w'); if (acc) w.appendChild(unit(E('i', 'hl-lt acc', text))); else Array.from(text).forEach(function (ch) { w.appendChild(unit(E('i', 'hl-lt', ch))); }); return w; }      // <i>, not <span>: the hero styles its own spans
    function split(root) {
      var todo = [], n, tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: function (x) { return /\S/.test(x.nodeValue) && !x.parentNode.closest('.hl-sp,.hl-sr') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP; } });
      while ((n = tw.nextNode())) todo.push(n);
      todo.forEach(function (tn) {
        var sp = E('i', 'hl-sp'), frag = document.createDocumentFragment(); sp.setAttribute('aria-hidden', 'true');
        tn.nodeValue.split(/(\s+)/).forEach(function (part) { if (!part) return; if (/^\s+$/.test(part)) sp.appendChild(document.createTextNode(part)); else sp.appendChild(word(part, false)); });
        frag.appendChild(E('i', 'hl-sr', tn.nodeValue)); frag.appendChild(sp); tn.parentNode.replaceChild(frag, tn);
      });
    }
    function measure() {
      var sx = window.scrollX, sy = window.scrollY, fs = new Map();
      L = L.filter(function (l) { return l.el.isConnected; });
      L.forEach(function (l) {
        var b = l.el.getBoundingClientRect(), pa = l.el.parentNode, f = fs.get(pa); if (!b.width) { l.cx = l.cy = NaN; return; }
        if (f === undefined) { f = parseFloat(getComputedStyle(pa).fontSize) || 16; fs.set(pa, f); }
        l.fs = f; l.k = Math.max(.5, Math.min(1, (f - 4) / 64)); l.cx = b.left + b.width / 2 + sx - l.x; l.cy = b.top + b.height * .55 + sy - l.y;
      });
      dirty = false;
    }
    function still(l) { l.x = l.y = l.r = l.s = l.vx = l.vy = l.vr = l.vs = 0; l.el.style.transform = ''; if (l.p) { l.p = 0; l.el.classList.remove('hl-hot'); l.el.style.removeProperty('--p'); } l.on = false; }
    /* X, Y: the hole in page coordinates; pw: how present it is, 0 to 1 */
    function step(X, Y, pw, dt) {
      if (pw <= .004 && !act.length) return; if (dirty) measure(); var i, l;
      if (pw > .004) for (i = 0; i < L.length; i++) { l = L[i]; if (!l.on && Math.abs(X - l.cx) < CUT && Math.abs(Y - l.cy) < CUT) { l.on = true; act.push(l); } }
      act = act.filter(function (l) {
        if (!l.el.isConnected) { l.on = false; return false; }
        var dx = X - l.cx, dy = Y - l.cy, dd = dx * dx + dy * dy, r = Math.sqrt(dd) + .001, g = dd < CUT * CUT ? pw * Math.exp(-dd / R2) : 0, q = l.k;
        var pull = Math.min(r * .5, (5 + l.fs * .1) * q) * g, gx = dx / r * pull, gy = dy / r * pull, gr = Math.max(-1, Math.min(1, dx / R)) * 10 * q * g, gs = .14 * q * g;
        l.vx += ((gx - l.x) * 170 - l.vx * 13) * dt; l.x += l.vx * dt; l.vy += ((gy - l.y) * 170 - l.vy * 13) * dt; l.y += l.vy * dt;
        l.vr += ((gr - l.r) * 170 - l.vr * 13) * dt; l.r += l.vr * dt; l.vs += ((gs - l.s) * 170 - l.vs * 13) * dt; l.s += l.vs * dt;
        if (g < .002 && Math.abs(l.x) + Math.abs(l.y) + Math.abs(l.r) + Math.abs(l.vx) + Math.abs(l.vy) + Math.abs(l.vr) < .03 && Math.abs(l.s) + Math.abs(l.vs) < .0008) { still(l); return false; }
        var a = Math.atan2(l.y, l.x) * 57.296, p;
        l.el.style.transform = 'translate3d(' + l.x.toFixed(2) + 'px,' + l.y.toFixed(2) + 'px,0) rotate(' + l.r.toFixed(2) + 'deg) rotate(' + a.toFixed(1) + 'deg) scale(' + (1 + l.s).toFixed(3) + ',' + (1 - l.s * .45).toFixed(3) + ') rotate(' + (-a).toFixed(1) + 'deg)';
        p = l.glow ? Math.round(Math.max(0, Math.min(1, l.s / .14)) * 12) / 20 : 0;
        if (p !== l.p) { if (p) { l.el.classList.add('hl-hot'); l.el.style.setProperty('--p', p); } else { l.el.classList.remove('hl-hot'); l.el.style.removeProperty('--p'); } l.p = p; }
        return true;
      });
    }
    function rest() { act.forEach(still); act = []; }
    return { on: !reduce, word: word, split: split, step: step, rest: rest, dirty: function () { dirty = true; } };
  })();
  if (HL.on) {
    [].forEach.call(document.querySelectorAll('.hero .statement, .hero .role'), HL.split);
    window.addEventListener('resize', HL.dirty); if (document.fonts && document.fonts.ready) document.fonts.ready.then(HL.dirty);
    setTimeout(HL.dirty, 1600); setTimeout(HL.dirty, 3200);      // after the opening rise has finished moving the text
  }
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
    var hud = document.getElementById('gw-hud'), hudN = document.getElementById('gw-count'), hudWin = document.getElementById('gw-win');
    var hero = document.getElementById('hero');
    var fine = window.matchMedia('(pointer: fine)').matches;
    var bh = { x: -999, y: -999, vx: 0, vy: 0, on: false, over: false, mass: 1, shown: 0, spin: 0 };
    var D = 150, running = false, visible = true, last = 0, lastPulse = 0, fs = 1, ox = 0, oy = 0;
    var GM = 800, SOFT = 30, SWIRL = .34, HORIZON = 12, VMAX = 13, CRUISE = .34, RANGE = 300, RANGE_FADE = 170;
    function size() {
      var r = cv.getBoundingClientRect(), oW = W, oH = H; dpr = Math.min(window.devicePixelRatio || 1, fine ? 2 : 1.5);
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ox = r.left + window.scrollX; oy = r.top + window.scrollY; HL.dirty();
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
        if (hud) hud.classList.add('won'); if (hudWin) hudWin.hidden = false;
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
      if (HL.on) HL.step(ox + bh.x, oy + bh.y, bh.shown, clamp(raw / 60, .001, .033));
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
    function stop() { running = false; HL.rest(); }
    size();
    var boot = function () { if (reduce) draw(0); else start(); };
    if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 900 }); else setTimeout(boot, 300);
    // the drawing buffer follows the canvas's own size (it changes when the hero settles its height as the fonts arrive,
    // which no resize event reports, and the sky was then stretched and the hole drawn off the finger); a phone's
    // address bar showing or hiding fires resize without changing the canvas, and no longer rebuilds anything
    var rt;
    function resized() { clearTimeout(rt); rt = setTimeout(function () {
      var r = cv.getBoundingClientRect();
      if (Math.abs(r.width - W) < 1 && Math.abs(r.height - H) < 1 && Math.min(window.devicePixelRatio || 1, fine ? 2 : 1.5) === dpr) return;
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
      hero.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch' && !bh.on) return;
        place(e); bh.on = true;
      });
      hero.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { place(e); bh.on = true; } });
      hero.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') release(); });
      hero.addEventListener('pointercancel', release);
      hero.addEventListener('pointerleave', release);
      /* added for the new homepage: never leave the hole behind. Let go when the page scrolls the pointer off the hero, when the pointer is over
         anything else, when the window loses focus or the tab hides. */
      var lastP = [0, 0];
      hero.addEventListener('pointermove', function (e) { lastP = [e.clientX, e.clientY]; });
      addEventListener('scroll', function () { if (!bh.on) return; var b = hero.getBoundingClientRect(); if (lastP[1] < b.top || lastP[1] > b.bottom || lastP[0] < b.left || lastP[0] > b.right) release(); }, { passive: true });
      /* the hand-off: the next section's black hole starts where this one is. at() says where that is on screen; go() lets this one fade */
      window.__hero = { at: function () { if (bh.shown < .12) return null; var r = cv.getBoundingClientRect(); return [r.left + bh.x, r.top + bh.y]; }, go: release };
      document.addEventListener('pointermove', function (e) { if (bh.on && e.pointerType !== 'touch' && !hero.contains(e.target)) release(); }, { passive: true });
      addEventListener('blur', release); document.addEventListener('visibilitychange', function () { if (document.hidden) release(); });
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; hero.classList.toggle('off', !visible); visible ? start() : stop(); }).observe(hero);
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
    var idx = 0, timer = 0, landed = 0, heroOn = true, heroEl = document.getElementById('hero');
    function render(q) {
      tEl.textContent = ''; var n = 0, vis = tEl; if (HL.on) { tEl.appendChild(document.createElement('i')).className = 'hl-sr'; tEl.firstChild.textContent = q.t.replace(/\*/g, ''); vis = tEl.appendChild(document.createElement('i')); vis.className = 'hl-sp'; vis.setAttribute('aria-hidden', 'true'); }
      q.t.split(/(\*[^*]+\*)/).forEach(function (part) {
        if (!part) return;
        var acc = part.charAt(0) === '*' && part.length > 2, text = acc ? part.slice(1, -1) : part;
        text.split(/(\s+)/).forEach(function (tok) {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { vis.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'), wi = document.createElement('span');
          w.className = 'w'; if (HL.on) { wi.className = 'wi'; wi.appendChild(HL.word(tok, acc)); } else { wi.className = acc ? 'wi acc' : 'wi'; wi.textContent = tok; }
          wi.style.transitionDelay = (n * 55) + 'ms'; n++;
          w.appendChild(wi); vis.appendChild(w);
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
      hq.classList.remove('leave', 'show', 'rest'); clearTimeout(landed);
      raf(function () { raf(function () { hq.classList.add('show'); }); });
      landed = setTimeout(function () { hq.classList.add('rest'); HL.dirty(); }, n * 55 + 1150);
      schedule();
    }
    function next() {
      if (!heroOn || document.hidden) { schedule(); return; }
      var ws = tEl.querySelectorAll('.wi');
      for (var i = 0; i < ws.length; i++) ws[i].style.transitionDelay = (i * 28) + 'ms';
      byEl.style.transitionDelay = '0ms';
      HL.rest(); hq.classList.add('leave'); hq.classList.remove('show', 'rest');
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
})();
