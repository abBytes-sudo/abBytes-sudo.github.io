/* Lumen CRM Pro — the hero: a month of leads, as light.
   Every point is one lead at Lumen Homes this month. It is born at the source it came from, travels to the pipeline
   stage it has reached, dims if it has gone cold and flares when it is won. A plain 2D canvas: 40-odd sprites, paused
   off-screen, one settled frame under reduced motion. The stage counts, sources and the feed are real DOM (hero-light
   only reads their positions), so the picture follows the layout at any width. */
(function () {
  'use strict';
  var field = document.getElementById('field'), cv = document.getElementById('lights'); if (!field || !cv) return;
  var ctx = cv.getContext('2d'); if (!ctx) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var srcEls = [].slice.call(field.querySelectorAll('.srcs li')), stgEls = [].slice.call(field.querySelectorAll('.stages li'));
  var feed = document.getElementById('lfeed'), tip = document.getElementById('ltip'), total = document.getElementById('ltotal'), wonEl = document.getElementById('lwon');
  var SRC = [['WhatsApp', '#3CC487'], ['Website form', '#B9C0D4'], ['Meta ads', '#7C97FF'], ['Google ads', '#F2A33A'], ['Referral', '#E58AC0'], ['Missed call', '#FF8A75']];
  var STG = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won'];
  var FIRST = ['Kunal', 'Ananya', 'Rohan', 'Aisha', 'Gaurav', 'Neha', 'Ishaan', 'Priya', 'Varun', 'Sana', 'Dev', 'Ritu', 'Kabir', 'Tanvi', 'Arjun', 'Meenal', 'Sahil', 'Pooja', 'Nikhil', 'Zoya', 'Harsh', 'Divya', 'Farhan', 'Lavanya'];
  var LAST = ['Saini', 'Sharma', 'Mehta', 'Khan', 'Chopra', 'Bansal', 'Gupta', 'Nair', 'Malhotra', 'Qureshi', 'Reddy', 'Kapoor', 'Sethi', 'Menon', 'Bhatia', 'Joshi', 'Arora', 'Iyer', 'Verma', 'Hussain'];
  var WANT = ['modular kitchen', 'full-home interiors', '2 BHK interiors', 'wardrobes', 'office fit-out', 'living room', 'painting and polish', 'false ceiling', 'kids’ room', 'café seating'];
  // source and stage for the month's forty leads (14 / 9 / 8 / 5 / 3 / 1 by source; 8 / 11 / 9 / 6 / 6 by stage)
  var SEED = '00011112223344 001112234 00112234 01234 124 3', seedSrc = [], seedStg = [];
  SEED.split(' ').forEach(function (grp, s) { grp.split('').forEach(function (c) { seedSrc.push(s); seedStg.push(+c); }); });
  var rnd = (function (a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })(1102);
  var W = 0, H = 0, dpr = 1, pts = [], srcXY = [], stgXY = [], phone = false, spacing = 17, raf = 0, running = false, t0 = 0, last = 0, hover = null;

  function lead(i, s, g) {
    var v = [2.4, 3.8, 4, 5.6, 6.5, 8.2, 11, 14, 18, 21][Math.floor(rnd() * 10)];
    return { i: i, s: s, g: g, name: FIRST[i % FIRST.length] + ' ' + LAST[(i * 7 + 3) % LAST.length], want: WANT[(i * 3 + s) % WANT.length], val: v, cold: g > 0 && g < 4 && rnd() < .3, x: 0, y: 0, fx: 0, fy: 0, tx: 0, ty: 0, u: 1, born: -1, ph: rnd() * 6.28, slot: 0, ring: 0 };
  }
  for (var i = 0; i < seedSrc.length; i++) pts.push(lead(i, seedSrc[i], seedStg[i]));

  /* sprites: one soft warm point, one won point */
  function sprite(core, mid, size) {
    var c = document.createElement('canvas'), n = size * 2; c.width = c.height = n; var x = c.getContext('2d'), g = x.createRadialGradient(size, size, 0, size, size, size);
    g.addColorStop(0, core); g.addColorStop(.16, core); g.addColorStop(.34, mid); g.addColorStop(1, 'rgba(255,214,150,0)'); x.fillStyle = g; x.fillRect(0, 0, n, n); return c;
  }
  var SP = sprite('rgba(255,246,226,1)', 'rgba(255,214,150,.3)', 32), SPW = sprite('rgba(255,236,170,1)', 'rgba(255,196,84,.42)', 44);

  function measure() {
    var r = cv.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); dpr = Math.min(2, window.devicePixelRatio || 1); phone = W < 700; spacing = phone ? 8.6 : W < 1100 ? 15 : 23;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    srcXY = srcEls.map(function (el) { var b = (el.querySelector('i') || el).getBoundingClientRect(); return [b.left + b.width / 2 - r.left, b.top + b.height / 2 - r.top]; });
    if (!srcXY.length || phone) srcXY = SRC.map(function (_, k) { return [-12, H * (.2 + k * .11)]; });
    stgXY = stgEls.map(function (el) { var b = el.getBoundingClientRect(); return [b.left + b.width / 2 - r.left, b.top - r.top]; });
  }
  /* where each point sits inside its stage: a sunflower packing above the stage's label */
  function slots() {
    var n = [0, 0, 0, 0, 0], by = [[], [], [], [], []];
    pts.forEach(function (p) { by[p.g].push(p); });
    by.forEach(function (list, g) {
      var c = stgXY[g] || [W * (.3 + g * .15), H * .8], rad = spacing * Math.sqrt(list.length) + 6, cy = c[1] - rad - (phone ? 16 : 40);
      list.forEach(function (p, k) { var r2 = spacing * Math.sqrt(k + .5), a = k * 2.39996 + g; p.tx = c[0] + Math.cos(a) * r2; p.ty = cy + Math.sin(a) * r2 * .92; });
      n[g] = list.length; var b = stgEls[g] && stgEls[g].querySelector('span'); if (b && b.textContent !== String(list.length)) b.textContent = list.length;
    });
    if (total) total.textContent = pts.length; if (wonEl) wonEl.textContent = n[4];
  }
  function send(p, now, fromSource) { var s = srcXY[p.s] || [0, H / 2]; p.fx = fromSource ? s[0] : p.x; p.fy = fromSource ? s[1] : p.y; p.born = now; p.u = 0; if (fromSource) p.ring = now; }
  function ease(u) { return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    // the pipeline, as hairlines of light between the stages
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.055)'; ctx.beginPath();
    for (var g = 0; g < stgXY.length - 1; g++) { var a = stgXY[g], b = stgXY[g + 1], y = a[1] - (phone ? 44 : spacing * 3.3 + 46); ctx.moveTo(a[0] + spacing * 3.6, y); ctx.lineTo(b[0] - spacing * 3.6, y); }
    ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    pts.forEach(function (p) {
      var dur = 1500, u = p.born < 0 ? 1 : Math.max(0, Math.min(1, (now - p.born) / dur)); if (reduce) u = 1; p.u = u; if (u <= 0 && p.born > now) return;
      var e = ease(u), mx = (p.fx + p.tx) / 2, my = Math.min(p.fy, p.ty) - Math.abs(p.tx - p.fx) * .22 - 20;
      p.x = u >= 1 ? p.tx : (1 - e) * (1 - e) * p.fx + 2 * (1 - e) * e * mx + e * e * p.tx; p.y = u >= 1 ? p.ty : (1 - e) * (1 - e) * p.fy + 2 * (1 - e) * e * my + e * e * p.ty;
      var breathe = reduce ? 1 : .86 + .14 * Math.sin(now / 900 + p.ph), won = p.g === 4, size = (won ? 21 : 13 + Math.min(6, p.val * .28)) * (phone ? .62 : W < 1100 ? 1 : 1.32) * (p === hover ? 1.5 : 1);
      ctx.globalAlpha = (p.cold ? .26 : won ? 1 : .82) * breathe * (u < 1 ? .55 + .45 * e : 1);
      ctx.drawImage(won ? SPW : SP, p.x - size, p.y - size, size * 2, size * 2);
      if (p.ring && now - p.ring < 1100 && !reduce) { var k = (now - p.ring) / 1100; ctx.globalAlpha = (1 - k) * .8; ctx.strokeStyle = SRC[p.s][1]; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.fx, p.fy, 4 + k * 22, 0, 6.2832); ctx.stroke(); }
      if (p.flare && now >= p.flare && now - p.flare < 1400 && !reduce) { var f = (now - p.flare) / 1400; ctx.globalAlpha = (1 - f) * .7; ctx.strokeStyle = 'rgba(255,214,120,1)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.tx, p.ty, 6 + f * 46, 0, 6.2832); ctx.stroke(); }
    });
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  /* the feed: what just happened, in the CRM's words */
  function say(time, text) {
    if (!feed) return; var li = document.createElement('li'); li.innerHTML = '<time></time><span></span>'; li.firstChild.textContent = time; li.lastChild.textContent = text;
    feed.insertBefore(li, feed.firstChild); while (feed.children.length > 3) feed.removeChild(feed.lastChild);
  }
  var clock = 11 * 60 + 2, step = 0;
  function hm(m) { var h = Math.floor(m / 60) % 24; return ((h + 11) % 12 + 1) + ':' + (m % 60 < 10 ? '0' : '') + m % 60; }
  function pick(g, warm) { var l = pts.filter(function (p) { return p.g === g && p.u >= 1 && (!warm || !p.cold); }); return l[Math.floor(rnd() * l.length)]; }
  function event(now) {
    var k = step++ % 6, p;
    if (k === 0) { // a new enquiry
      var s = step === 1 ? 0 : [0, 0, 2, 1, 0, 3, 4][Math.floor(rnd() * 7)]; p = lead(pts.length, s, 0); p.name = step === 1 ? 'Kunal Saini' : p.name; p.want = step === 1 ? 'modular kitchen' : p.want; pts.push(p); slots(); send(p, now, true); p.x = p.fx; p.y = p.fy; event.lastNew = p;
      say(hm(clock), p.name + ' said hi on ' + SRC[s][0] + ' · ' + p.want);
    } else if (k === 1 && event.lastNew) { // scored, routed, answered
      clock += 1; p = event.lastNew; p.g = 1; slots(); send(p, now); say(hm(clock), 'Scored ' + (58 + Math.floor(rnd() * 30)) + ', routed to Meera · she replied in 0:' + (31 + Math.floor(rnd() * 28)));
    } else if (k === 2) { p = pick(1, true); if (p) { clock += 6; p.g = 2; slots(); send(p, now); say(hm(clock), p.name + ' qualified · site visit booked'); } }
    else if (k === 3) { p = pick(2, true); if (p) { clock += 9; p.g = 3; slots(); send(p, now); say(hm(clock), 'Quote sent to ' + p.name + ' · ₹' + p.val + ' L with GST'); } }
    else if (k === 4) { p = pick(3, true); if (p) { clock += 12; p.g = 4; p.cold = false; slots(); send(p, now); p.flare = now + 1300; say(hm(clock), 'Won · ' + p.name + ' · ₹' + p.val + ' L · traced to ' + SRC[p.s][0]); } }
    else { p = pick(1) || pick(2); if (p && !p.cold) { clock += 4; p.cold = true; say(hm(clock), p.name + ' has gone quiet for 5 days · nudge queued'); } }
    if (pts.length > 56) { var old = pts.filter(function (q) { return q.g === 4; })[0]; if (old) { pts.splice(pts.indexOf(old), 1); slots(); } }
  }

  var nextEvent = 0;
  function frame(now) {
    if (!running) return; raf = requestAnimationFrame(frame);
    if (now - last < 30) return; last = now; // ~30 fps is plenty for drifting light
    if (now > nextEvent) { event(now); nextEvent = now + 2600; }
    draw(now);
  }
  function start() { if (running || reduce) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  function layout() { measure(); slots(); pts.forEach(function (p) { if (p.u >= 1) { p.x = p.tx; p.y = p.ty; } }); if (!running) draw(performance.now()); }
  function arrive() { // the month arrives: every lead leaves its source and finds its stage
    var now = performance.now(); pts.forEach(function (p, k) { send(p, now + 250 + k * 46, true); p.ring = 0; p.x = p.fx; p.y = p.fy; p.u = 0; }); nextEvent = now + 1300;
  }
  layout();
  if (reduce) { say('11:03', 'Scored 72, routed to Meera · she replied in 0:42'); say('11:02', 'Kunal Saini said hi on WhatsApp · modular kitchen'); draw(0); }
  else { arrive(); }
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) start(); else stop(); }); }).observe(cv); else start();
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (cv.getBoundingClientRect().bottom > 0) start(); });
  var rz = 0, lastW = innerWidth; addEventListener('resize', function () { if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rz); rz = setTimeout(layout, 140); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  /* hover or tap a point for the person */
  function near(e) {
    var r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, best = null, bd = phone ? 22 : 18;
    pts.forEach(function (p) { var d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } });
    hover = best; field.style.cursor = best ? 'pointer' : '';
    if (!tip) return;
    if (!best) { tip.hidden = true; return; }
    tip.hidden = false; tip.innerHTML = '<b></b><span></span>'; tip.firstChild.textContent = best.name; tip.lastChild.textContent = SRC[best.s][0] + ' · ' + best.want + ' · ₹' + best.val + ' L · ' + (best.cold ? 'gone quiet' : STG[best.g].toLowerCase());
    var tw = tip.offsetWidth; tip.style.left = Math.max(8, Math.min(W - tw - 8, best.x - tw / 2)) + 'px'; tip.style.top = Math.max(8, best.y - tip.offsetHeight - 16) + 'px';
    if (!running) draw(performance.now());
  }
  field.addEventListener('pointermove', near); field.addEventListener('pointerdown', near);
  field.addEventListener('pointerleave', function () { hover = null; if (tip) tip.hidden = true; if (!running) draw(performance.now()); });
})();
