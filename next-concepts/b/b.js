/* Concept B · Departures. One small split-flap engine (canvas) drives the hero board, the clock, the list of projects and the facts. */
(function () {
  'use strict';
  var d = document, W = window.WORK, N = W.length, $ = function (s) { return d.querySelector(s); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, mobile = matchMedia('(max-width: 820px)').matches, coarse = matchMedia('(hover: none)').matches;
  var A = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,'&/-:~?!+", AL = A.length;
  /* flap themes: top gradient ×2, bottom gradient ×2, glyph, hinge */
  var TH = [['#ffffff', '#f1efe9', '#f8f6f1', '#e7e4dc', '#111111', 'rgba(0,0,0,.62)'], ['#f4603f', '#e2452b', '#ec4a2f', '#cf3a22', '#ffffff', 'rgba(0,0,0,.5)'], ['#242424', '#1e1e1e', '#222222', '#191919', '#ffffff', 'rgba(0,0,0,.9)']];
  function norm(ch) { ch = (ch || ' ').toUpperCase(); if (ch === '’' || ch === '‘') ch = "'"; return A.indexOf(ch) < 0 ? ' ' : ch; }
  function rnd() { return A[1 + (Math.random() * 36 | 0)]; }

  function Board(cv, o) {
    this.cv = cv; this.g = cv.getContext('2d'); this.cols = o.cols; this.rows = o.rows; this.ratio = o.ratio || 1.42; this.gap = o.gap || .1; this.rgap = o.rgap || .15; this.step = o.step || 74;
    this.cells = []; for (var i = 0; i < this.cols * this.rows; i++) this.cells.push({ cur: ' ', q: [], t: 0, wait: 0, th: 0 });
    this.raf = 0; this.scr = false; this.tick = this.tick.bind(this); this.fit();
  }
  Board.prototype.fit = function () {
    var W = this.cv.clientWidth || this.cv.parentNode.clientWidth; if (!W) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2), gx = Math.max(2, Math.round(W / this.cols * this.gap));
    this.cw = Math.floor((W - gx * (this.cols - 1)) / this.cols); this.ch = Math.round(this.cw * this.ratio); this.gx = gx; this.gy = Math.max(3, Math.round(this.ch * this.rgap));
    this.ox = Math.floor((W - (this.cols * this.cw + (this.cols - 1) * gx)) / 2); this.pitch = this.ch + this.gy; this.H = this.rows * this.pitch - this.gy;
    this.cv.style.height = this.H + 'px'; this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(this.H * dpr); this.dpr = dpr; this.tiles = {};
    for (var i = 0; i < this.cells.length; i++) { var c = this.cells[i]; if (c.q.length && !this.scr) { c.cur = c.q[c.q.length - 1]; c.q = []; c.t = 0; } this.drawCell(i); }
  };
  Board.prototype.tile = function (ch, th) {
    var k = th + ch, t = this.tiles[k]; if (t) return t;
    var dp = this.dpr, w = Math.round(this.cw * dp), h = Math.round(this.ch * dp), c = d.createElement('canvas'), g = c.getContext('2d'), T = TH[th], r = Math.max(2, w * .09), m = Math.round(h / 2);
    c.width = w; c.height = h;
    var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, T[0]); gr.addColorStop(.5, T[1]); gr.addColorStop(.5, T[2]); gr.addColorStop(1, T[3]);
    g.fillStyle = gr; g.beginPath(); g.moveTo(r, 0); g.arcTo(w, 0, w, h, r); g.arcTo(w, h, 0, h, r); g.arcTo(0, h, 0, 0, r); g.arcTo(0, 0, w, 0, r); g.fill();
    if (ch !== ' ') { g.fillStyle = T[4]; g.font = '400 ' + Math.round(h * .9) + 'px "Bebas Neue", Impact, sans-serif'; g.textAlign = 'center'; g.fillText(ch, w / 2, h / 2 + h * .315); }
    var l = Math.max(1, Math.round(dp * .75)); g.fillStyle = T[5]; var pw = Math.max(1, Math.round(w * .035)), ph = Math.round(h * .07); g.fillRect(0, m - l, w, l); g.fillRect(0, m - ph, pw, ph * 2); g.fillRect(w - pw, m - ph, pw, ph * 2);
    return (this.tiles[k] = c);
  };
  Board.prototype.drawCell = function (i) {
    var c = this.cells[i], dp = this.dpr, g = this.g, w = Math.round(this.cw * dp), h = Math.round(this.ch * dp), hh = Math.round(h / 2);
    var x = Math.round((this.ox + (i % this.cols) * (this.cw + this.gx)) * dp), y = Math.round(((i / this.cols | 0) * this.pitch) * dp), a = c.off ? this.tile(' ', 2) : this.tile(c.cur, c.th);
    if (c.off) { g.drawImage(a, x, y); return; }
    if (!c.q.length || c.wait > 0) { g.drawImage(a, x, y); return; }
    var b = this.tile(c.q[0], c.th), p = c.t, k;
    g.drawImage(b, 0, 0, w, hh, x, y, w, hh); g.drawImage(a, 0, hh, w, h - hh, x, y + hh, w, h - hh);
    if (p < .5) { k = Math.cos(p * Math.PI); g.drawImage(a, 0, 0, w, hh, x, y + hh * (1 - k), w, hh * k); g.fillStyle = 'rgba(0,0,0,' + (.34 * (1 - k)).toFixed(3) + ')'; g.fillRect(x, y + hh * (1 - k), w, hh * k); }
    else { k = -Math.cos(p * Math.PI); g.drawImage(b, 0, hh, w, h - hh, x, y + hh, w, (h - hh) * k); g.fillStyle = 'rgba(0,0,0,' + (.26 * (1 - k)).toFixed(3) + ')'; g.fillRect(x, y + hh, w, (h - hh) * k); }
  };
  Board.prototype.tick = function (now) {
    var dt = Math.min(50, now - (this.last || now)), any = false, i, c; this.last = now;
    for (i = 0; i < this.cells.length; i++) {
      c = this.cells[i]; if (!c.q.length) continue; any = true;
      if (c.wait > 0) { c.wait -= dt; continue; }
      c.t += dt / this.step;
      if (c.t >= 1) { c.cur = c.q.shift(); c.t = 0; if (this.scr && !c.q.length) c.q.push(rnd()); }
      this.drawCell(i);
    }
    if (any) this.raf = requestAnimationFrame(this.tick); else { this.raf = 0; this.last = 0; }
  };
  Board.prototype.go = function () { if (!this.raf) { this.last = 0; this.raf = requestAnimationFrame(this.tick); } };
  /* lines: array of strings. o: themes (per row), cs/rs (stagger per column/row, ms), max (flaps on the way) */
  Board.prototype.set = function (lines, o) {
    o = o || {}; var max = o.max || 8, cs = o.cs === undefined ? 26 : o.cs, rs = o.rs === undefined ? 70 : o.rs, r, c, cell, tg, from, n, k, q;
    for (r = 0; r < this.rows; r++) for (c = 0; c < this.cols; c++) {
      cell = this.cells[r * this.cols + c]; tg = norm((lines[r] || '')[c]); var th = (o.themes && o.themes[r]) || 0, thc = th !== cell.th; cell.th = th;
      if (reduce) { cell.cur = tg; cell.q = []; cell.t = 0; this.drawCell(r * this.cols + c); continue; }
      from = cell.q.length ? cell.q[0] : cell.cur; n = (A.indexOf(tg) - A.indexOf(from) + AL) % AL; q = cell.q.length ? [cell.q[0]] : [];
      for (k = Math.min(n, max) - 1; k >= 0; k--) q.push(A[(A.indexOf(tg) - k + AL) % AL]);
      if (!cell.q.length) { cell.t = 0; cell.wait = q.length ? c * cs + r * rs + Math.random() * 36 : 0; }
      cell.q = q; if (thc && !q.length) this.drawCell(r * this.cols + c);
    }
    this.go();
  };
  Board.prototype.scramble = function (on) { this.scr = on; if (on) { for (var i = 0; i < this.cells.length; i++) { var c = this.cells[i]; if (!c.q.length) { c.q.push(rnd()); c.wait = Math.random() * 220; c.t = 0; } } this.go(); } };

  function start() {
    /* ---------- hero board ---------- */
    var LINES = [['EVERY MESS IS A', 'SYSTEM NOBODY', 'HAS DRAWN YET.'], ['MACHINES TAKE ME', 'BY SURPRISE WITH', 'GREAT FREQUENCY.'], ["IT'S ALWAYS BEEN", 'DONE THIS WAY', 'IS A BUG REPORT.'], ['THE FIRST', 'PRINCIPLE IS THAT', 'YOU MUST NOT FOOL', 'YOURSELF.'], ['CURIOSITY IS MY', 'OPERATING SYSTEM.'], ['THE BEST WAY TO', 'PREDICT THE', 'FUTURE IS TO', 'INVENT IT.'], ['I COLLECT EDGE', 'CASES WHILE', 'OTHERS COLLECT', 'ASSUMPTIONS.'], ["I DON'T BUILD", 'SCREENS.', 'I DESIGN SYSTEMS.']];
    var hbEl = $('#hb'), hb = new Board($('#board'), { cols: 17, rows: 4, rgap: .13 }), li = 0, lineNo = $('#lineNo'), heroOn = true, typing = false, buf = '', typeT = 0, autoT = 0, held = false, holdT = 0, skip = false;
    function showLine(o) {
      var L = LINES[li], off = L.length < 3 ? 1 : 0, out = [], r; for (r = 0; r < 4; r++) out.push(L[r - off] || '');
      hb.set(out, o); lineNo.textContent = 'Line ' + (li + 1) + ' of ' + LINES.length + '.';
      hbEl.setAttribute('aria-label', 'Split-flap board. It reads: ' + L.join(' ').toLowerCase() + ' Press for the next line.');
      clearTimeout(autoT); if (!reduce) autoT = setTimeout(function () { if (heroOn && !typing && !held && !d.hidden) { li = (li + 1) % LINES.length; } showLine(); }, 11000);
    }
    if (reduce) showLine(); else { hb.scramble(true); setTimeout(function () { hb.scramble(false); showLine({ cs: 34, rs: 90 }); }, 650); }
    /* the mess: hold the board and every flap falls off it. Kick them about with the pointer; click the board to put them back. */
    var sec = d.querySelector('.hero'), fx = d.createElement('canvas'), fg = fx.getContext('2d'), bodies = null, fraf = 0, flast = 0, back = false, px = -999, py = 0, backT = 0;
    fx.className = 'fall'; sec.appendChild(fx);
    function drop() {
      if (bodies || reduce) return; var hr = sec.getBoundingClientRect(), br = hb.cv.getBoundingClientRect(), dp = Math.min(window.devicePixelRatio || 1, 1.5);
      fx.width = hr.width * dp; fx.height = hr.height * dp; fg.setTransform(dp, 0, 0, dp, 0, 0); held = true; back = false; clearTimeout(autoT);
      bodies = hb.cells.map(function (c, i) {
        var x = br.left - hr.left + hb.ox + (i % hb.cols) * (hb.cw + hb.gx) + hb.cw / 2, y = br.top - hr.top + (i / hb.cols | 0) * hb.pitch + hb.ch / 2, ch = c.q.length ? c.q[c.q.length - 1] : c.cur;
        c.cur = ch; c.q = []; c.t = 0; c.off = true; hb.drawCell(i);
        return { hx: x, hy: y, x: x, y: y, a: 0, vx: (Math.random() - .5) * 320, vy: -Math.random() * 260, va: (Math.random() - .5) * 8, img: hb.tile(ch, 0), fl: hr.height - hb.ch * .52 - Math.random() * Math.random() * hb.ch * 1.3, wait: Math.random() * .4, k: 0, W: hr.width };
      });
      lineNo.textContent = 'A mess.'; flast = 0; fraf = requestAnimationFrame(fall); clearTimeout(backT); backT = setTimeout(restore, 9000);
    }
    function restore() { if (!bodies || back) return; clearTimeout(backT); back = true; bodies.forEach(function (b, i) { b.sx = b.x; b.sy = b.y; b.sa = b.a % 6.2832; b.k = -i * .012; }); }
    function fall(now) {
      var dt = Math.min(.033, (now - (flast || now)) / 1000), w = hb.cw, h = hb.ch, done = true, i, b, e, dd; flast = now; fg.clearRect(0, 0, fx.width, fx.height);
      for (i = 0; i < bodies.length; i++) {
        b = bodies[i];
        if (back) { b.k += dt * 1.9; e = b.k <= 0 ? 0 : b.k >= 1 ? 1 : 1 - Math.pow(1 - b.k, 3); if (b.k < 1) done = false; b.x = b.sx + (b.hx - b.sx) * e; b.y = b.sy + (b.hy - b.sy) * e - Math.sin(e * Math.PI) * 60; b.a = b.sa * (1 - e); }
        else if (b.wait > 0) { b.wait -= dt; done = false; }
        else {
          done = false; b.vy += 2800 * dt; dd = Math.hypot(b.x - px, b.y - py);
          if (dd < 95) { b.vx += (b.x - px) / (dd + 1) * 5200 * dt; b.vy -= 5200 * dt; b.va += (Math.random() - .5) * 30 * dt; }
          b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
          if (b.y > b.fl) { b.y = b.fl; b.vy *= -.3; b.vx *= .72; b.va *= .6; if (Math.abs(b.vy) < 60) { b.vy = 0; b.a += (Math.round(b.a / Math.PI) * Math.PI - b.a) * .25; } }
          if (b.x < w / 2) { b.x = w / 2; b.vx = Math.abs(b.vx) * .5; } else if (b.x > b.W - w / 2) { b.x = b.W - w / 2; b.vx = -Math.abs(b.vx) * .5; }
        }
        fg.save(); fg.translate(b.x, b.y); fg.rotate(b.a); fg.drawImage(b.img, -w / 2, -h / 2, w, h); fg.restore();
      }
      if (back && done) { hb.cells.forEach(function (c, k) { c.off = false; hb.drawCell(k); }); bodies = null; held = false; fg.clearRect(0, 0, fx.width, fx.height); fraf = 0; li = (li + 1) % LINES.length; showLine(); return; }
      fraf = requestAnimationFrame(fall);
    }
    sec.addEventListener('pointermove', function (e) { var r = sec.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; }); sec.addEventListener('pointerleave', function () { px = -999; });
    hbEl.addEventListener('click', function () { if (skip) { skip = false; return; } if (bodies) { restore(); return; } typing = false; li = (li + 1) % LINES.length; showLine(); });
    hbEl.addEventListener('pointerdown', function () { clearTimeout(holdT); if (!bodies) holdT = setTimeout(function () { skip = true; drop(); }, 320); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { hbEl.addEventListener(ev, function () { clearTimeout(holdT); if (ev !== 'pointerup') skip = false; }); });
    d.addEventListener('keydown', function (e) {
      if (!heroOn || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      var k = e.key;
      if (bodies) return;
      if (!typing) { if (!/^[a-z0-9]$/i.test(k)) return; typing = true; buf = ''; }
      if (k === 'Escape') { typing = false; showLine(); return; }
      if (k === 'Backspace') buf = buf.slice(0, -1); else if (k === 'Enter') { buf += new Array(18 - (buf.length % 17 || 17)).join(' '); if (e.target === hbEl) e.preventDefault(); } else if (k.length === 1) { buf += k; if (k === ' ') e.preventDefault(); } else return;
      if (buf.length > 68) buf = buf.slice(17);
      var rows = [], i; for (i = 0; i < 4; i++) rows.push(buf.substr(i * 17, 17));
      hb.set(rows, { cs: 0, rs: 0, max: 2 }); lineNo.textContent = 'Your line.'; clearTimeout(autoT); clearTimeout(typeT); typeT = setTimeout(function () { typing = false; showLine(); }, 6000);
    });
    var clock = new Board($('#clock'), { cols: 5, rows: 1, gap: .12 }), fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }), lastT = '';
    function tickClock() { var t = fmt.format(new Date()); if (t !== lastT) { lastT = t; clock.set([t], { cs: 40 }); } }
    tickClock(); setInterval(tickClock, 5000);

    /* ---------- departures ---------- */
    var TAGS = { recrm: 'property real estate brokerage leads calling', reweb: 'property real estate search seo chatbot', interp: 'interiors quotes construction boq', boxx: 'gym fitness', studio: 'interiors construction 3d', ent: 'marketplace', const: '3d planning', revv: 'cars bikes 3d dealers', launch: 'property real estate 3d', crm: 'sales leads whatsapp pipeline', estate: 'property brokerage leads calling', store: 'ecommerce shop fashion', watch: 'luxury 3d shop', resort: 'hotel booking hospitality', stockroom: 'warehouse stock barcode', quotes: 'quotes interiors construction invoices', work: 'tasks projects saas', saas: 'chatbot bots whatsapp', interior: 'interiors 3d', masonry: 'construction 3d estimator', build: 'construction 3d portal', orders: 'ecommerce shop returns' };
    var cols = mobile ? 17 : 25, db = new Board($('#dboard'), { cols: cols, rows: N, rgap: .17, step: 62 }), clip = $('#clip'), rowsEl = $('#rows'), gate = $('#gate'), cnt = $('#cnt');
    var cat = 'all', view = 'name', query = '', list = W.slice(), sel = 0, opened = false;
    function p2(n) { return (n < 10 ? '0' : '') + n; }
    function label(w) { return view === 'what' ? w.type : mobile ? w.short : w.name.toUpperCase().replace('REAL ESTATE PLATFORM', 'REAL ESTATE'); }
    function themes() { var th = [], i; for (i = 0; i < N; i++) th.push(i === sel && list[i] ? 1 : 0); return th; }
    function repaint(o) { var lines = [], i; for (i = 0; i < N; i++) lines.push(list[i] ? p2(W.indexOf(list[i]) + 1) + ' ' + label(list[i]) : ''); if (!list.length) { lines[0] = mobile ? '-- NO DEPARTURES' : '-- NO DEPARTURES FOR THAT'; lines[1] = mobile ? '   TRY GYM OR CRM' : '   TRY GYM, CRM OR STORE'; } o = o || { cs: 12, rs: 22, max: 6 }; o.themes = themes(); db.set(lines, o); }
    function links() {
      rowsEl.textContent = '';
      list.forEach(function (w, i) {
        var a = d.createElement('a'); a.href = w.href; a.style.top = i * db.pitch - db.gy / 2 + 'px'; a.style.height = db.pitch + 'px';
        a.setAttribute('aria-label', w.name + ', ' + w.kind + '. ' + w.status + '.');
        a.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') pick(i); }); a.addEventListener('focus', function () { pick(i); });
        a.addEventListener('click', function (e) { if (coarse || mobile) { e.preventDefault(); pick(i); gate.classList.add('open'); opened = true; } });
        rowsEl.appendChild(a);
      });
      clip.style.height = (mobile ? Math.max(list.length, 3) * db.pitch - db.gy : db.H) + 'px';
      cnt.textContent = list.length + (list.length === 1 ? ' project' : ' projects') + (query ? ' for “' + query + '”' : '') + '. ' + (coarse || mobile ? 'Tap a row.' : 'Point at a row to preview it; click to open.');
    }
    function pick(i, force) {
      if (i === sel && !force) return; sel = i; var w = list[i]; if (!w) return;
      repaint({ cs: 0, rs: 0, max: 1 });
      var scr = $('#scr'); scr.textContent = '';
      if (w.img || w.card) {
        var im = new Image(); im.alt = ''; im.decoding = 'async';
        if (w.img) im.addEventListener('load', function () { var dy = scr.clientHeight - im.clientHeight; if (dy < 0 && !reduce) { im.style.setProperty('--y', dy + 'px'); im.style.setProperty('--d', Math.max(6, w.a * 3.6) + 's'); im.classList.add('pan'); } });
        im.src = w.img ? 'img/' + w.img + '.webp' : 'img/cards/' + w.card + '.webp'; scr.appendChild(im);
      } else { var no = d.createElement('p'); no.className = 'none'; no.textContent = 'Not launched publicly. Screens on request.'; scr.appendChild(no); }
      $('#gN').textContent = 'No. ' + p2(W.indexOf(w) + 1) + ' of ' + N; $('#gS').textContent = window.CATS[w.cat];
      $('#gH').textContent = w.name; $('#gK').textContent = w.kind + ' · ' + w.status; $('#gT').textContent = w.blurb;
      var a = $('#gA'); a.href = w.href; a.firstElementChild.textContent = w.cta;
      gate.classList.remove('flip'); void gate.offsetWidth; gate.classList.add('flip');
    }
    function filter() {
      var qs = query.toLowerCase().split(/[\s,]+/).filter(Boolean);
      list = W.filter(function (w) { if (cat !== 'all' && w.cat !== cat) return false; var t = (w.name + ' ' + w.kind + ' ' + w.type + ' ' + w.trade + ' ' + window.CATS[w.cat] + ' ' + w.blurb + ' ' + TAGS[w.id]).toLowerCase(); return qs.every(function (q) { return t.indexOf(q) >= 0; }); });
      sel = -1; repaint(); links(); if (list.length) pick(0, true);
    }
    [['all', 'All'], ['client', 'Client work'], ['web', 'Websites'], ['sys', 'Systems']].forEach(function (t) {
      var b = d.createElement('button'); b.type = 'button'; b.innerHTML = t[1] + '<span>' + (t[0] === 'all' ? N : W.filter(function (w) { return w.cat === t[0]; }).length) + '</span>'; b.setAttribute('aria-pressed', t[0] === 'all');
      b.addEventListener('click', function () { cat = t[0]; [].forEach.call($('#cats').children, function (c) { c.setAttribute('aria-pressed', c === b); }); filter(); }); $('#cats').appendChild(b);
    });
    [].forEach.call($('#view').children, function (b) { b.addEventListener('click', function () { view = b.dataset.v; [].forEach.call($('#view').children, function (c) { c.setAttribute('aria-pressed', c === b); }); repaint({ cs: 16, rs: 26, max: 7 }); }); });
    var qT = 0; $('#q').addEventListener('input', function (e) { clearTimeout(qT); qT = setTimeout(function () { query = e.target.value.trim(); filter(); }, 220); });
    $('#gx').addEventListener('click', function () { gate.classList.remove('open'); opened = false; });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && opened) { gate.classList.remove('open'); opened = false; } });
    var depSeen = false; links(); sel = -1;

    /* ---------- arrivals ---------- */
    var AD = [['6,089 OLD RECORDS MOVED', '0 REJECTED'], ['PAGE 1 ON GOOGLE', 'IN 30 DAYS'], ['CUSTOM CRM, BRIEF TO LIVE', '3 MONTHS'], ['WEBSITE REBUILT, RELAUNCHED', '~19 HOURS'], ['SYSTEMS JOINED INTO ONE', '6 INTEGRATIONS'], ['BUILDING SYSTEMS', '4 YEARS']];
    var AM = ['6,089 RECORDS', 'MOVED, 0 REJECTED', 'PAGE 1 ON GOOGLE', 'IN 30 DAYS', 'CRM BRIEF TO LIVE', 'IN 3 MONTHS', 'WEBSITE RELAUNCH', 'IN ~19 HOURS', '6 INTEGRATIONS', 'IN ONE SYSTEM', '4 YEARS LEADING', 'OPS AND SYSTEMS'];
    var ac = mobile ? 17 : 38, ab = new Board($('#aboard'), { cols: ac, rows: mobile ? 12 : 6, rgap: .17 });
    var aLines = mobile ? AM : AD.map(function (p) { return p[0] + new Array(ac - p[0].length - p[1].length + 1).join(' ') + p[1]; }), aTh = mobile ? AM.map(function (x, i) { return i % 2; }) : null;

    /* ---------- reveal, resize ---------- */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) {
        var id = e.target.id;
        if (id === 'hb') { heroOn = e.isIntersecting; return; }
        if (!e.isIntersecting) return;
        if (id === 'dboard' && !depSeen) { depSeen = true; sel = -1; repaint({ cs: 16, rs: 34, max: 8 }); pick(0, true); }
        else if (id === 'aboard') ab.set(aLines, { themes: aTh, cs: 18, rs: 110 });
        else e.target.classList.add('in');
        if (id !== 'hb') io.unobserve(e.target);
      }); }, { rootMargin: '0px 0px -12% 0px' });
      [hbEl, $('#dboard'), $('#aboard')].concat([].slice.call(d.querySelectorAll('.rv'))).forEach(function (el) { io.observe(el); });
    } else { repaint(); pick(0, true); ab.set(aLines, { themes: aTh }); [].forEach.call(d.querySelectorAll('.rv'), function (el) { el.classList.add('in'); }); }
    var rT = 0, lastW = innerWidth;
    addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(function () { if (innerWidth === lastW) return; lastW = innerWidth; if (bodies) { hb.cells.forEach(function (c) { c.off = false; }); bodies = null; held = false; cancelAnimationFrame(fraf); fg.clearRect(0, 0, fx.width, fx.height); } [hb, clock, db, ab].forEach(function (b) { b.fit(); }); links(); }, 180); });
    var copy = $('#copy'); copy.addEventListener('click', function () { var done = function () { copy.firstElementChild.textContent = 'Copied'; setTimeout(function () { copy.firstElementChild.textContent = 'Copy the address'; }, 1800); }; if (navigator.clipboard) navigator.clipboard.writeText('abhimasih0505@gmail.com').then(done, done); else done(); });
  }
  var went = false, begin = function () { if (!went) { went = true; start(); } };
  if (d.fonts && d.fonts.load) { d.fonts.load('40px "Bebas Neue"').then(begin, begin); setTimeout(begin, 1500); } else begin();
})();
