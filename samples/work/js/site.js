/* Ordwell — marketing site: sticky nav, the ten tasks and their six layouts (shared with js/duo.js, the two-stage drag
   version; here they also drive the scroll sequence used on small screens and under reduced motion), the live brand wall,
   the templates strip/gallery and the walkthrough lead form (leads land in staff.html). */
(function () {
  'use strict';
  var OW = window.OW = window.OW || {}, G = window.gsap, ST = window.ScrollTrigger;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var LEADS = 'ordwell-site-leads';
  function readLeads() { try { return JSON.parse(localStorage.getItem(LEADS)) || null; } catch (e) { return null; } }
  function saveLeads(l) { try { localStorage.setItem(LEADS, JSON.stringify(l)); } catch (e) { } }
  OW.site = { readLeads: readLeads, saveLeads: saveLeads, esc: esc };

  /* ---------- brand persistence across the site (from the playground or the app's settings) ---------- */
  var KEY = 'ordwell-demo-v3';
  function appBrand() { try { var s = JSON.parse(localStorage.getItem(KEY)); return s && s.brand; } catch (e) { return null; } }
  function contrastOn(hex) { var c = hex.replace('#', ''), L = [0, 2, 4].map(function (i) { var v = parseInt(c.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }), l = 0.2126 * L[0] + 0.7152 * L[1] + 0.0722 * L[2]; return 1.05 / (l + 0.05) >= 4.5 ? '#FFFFFF' : '#1B1A17'; }
  function paint(name, accent) {
    var r = document.documentElement; r.style.setProperty('--accent', accent); r.style.setProperty('--on-accent', contrastOn(accent));
    $$('[data-bname]').forEach(function (e) { e.textContent = name; }); $$('[data-bmark]').forEach(function (e) { e.textContent = name.trim().charAt(0).toUpperCase() || 'O'; });
  }
  /* the footer wordmark is the visitor's name at the full width of the page: fit whatever they typed */
  function fitMark() { $$('[data-fit]').forEach(function (e) { var n = (e.textContent || '').length; e.parentNode.style.setProperty('--fit', Math.min(1, 7.6 / Math.max(7, n)).toFixed(3)); }); }
  var paint0 = paint; paint = function (name, accent) { paint0(name, accent); fitMark(); var named = name && name.toLowerCase() !== 'ordwell'; $$('[data-yname]').forEach(function (e) { e.textContent = named ? name : 'Your name'; }); document.documentElement.classList.toggle('named', !!named); document.documentElement.classList.toggle('hued', accent.toUpperCase() !== '#111317' && accent.toUpperCase() !== '#1B1A17'); };
  /* a link someone was sent (#b=Name|RRGGBB) wins over what the app last saved */
  var hb = /[#&]b=([^|&]+)\|([0-9a-f]{6})/i.exec(location.hash), linked = null;
  if (hb) { try { linked = { name: decodeURIComponent(hb[1]).replace(/[<>]/g, '').slice(0, 22), accent: '#' + hb[2].toUpperCase() }; } catch (e) { linked = null; } }
  var ab = linked || appBrand(); if (ab && ab.name && ab.name.toLowerCase() !== 'ordwell') paint(ab.name, ab.accent); else if (ab && ab.accent) paint('Ordwell', ab.accent);

  /* ---------- command rails: the ⌘K line types in when its panel arrives ---------- */
  (function () {
    var cmds = document.querySelectorAll('.idx'); if (!cmds.length) return;
    if (!('IntersectionObserver' in window)) { cmds.forEach(function (c) { c.classList.add('typed'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('typed'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -12% 0px' });
    cmds.forEach(function (c) { io.observe(c); });
  })();

  /* ---------- nav ---------- */
  var nav = $('#nav'); if (nav) { var onS = function () { nav.classList.toggle('scrolled', scrollY > 8); }; addEventListener('scroll', onS, { passive: true }); onS(); }

  /* ---------- the ten tasks and the six layouts. Shared by the scroll sequence below (small screens, reduced motion)
     and by js/duo.js, the two-stage drag version, through OW.viewKit ---------- */
  var TODAY = 7, CAL0 = 8, DAYS = 22; // day 0 is Tue 17 Nov; the calendar starts on the Monday before it
  var COLS = [['Brief', 'var(--c-todo)', 0], ['In progress', 'var(--c-active)', 1], ['Review', 'var(--c-review)', 1], ['Approved', 'var(--c-done)', 2]];
  var PPL = { AR: ['Aditi', 18, 8], PN: ['Priya', 330, 8], RI: ['Rohan', 200, 8], AD: ['Arjun', 260, 8], SQ: ['Sana', 280, 6.4] }, PO = ['AR', 'PN', 'RI', 'AD', 'SQ'];
  /* id, title, status, start day, days, budget, spent, owner, priority, estimate (h), client-visible */
  var T0 = [
    ['CEW-101', 'Sitemap and content inventory', 3, 0, 3, 60000, 54000, 'AR', 'm', 10, 0],
    ['CEW-102', 'Moodboard and visual direction', 3, 3, 3, 120000, 126000, 'PN', 'h', 6, 0],
    ['CEW-103', 'Homepage design — hero and story', 2, 6, 5, 180000, 151000, 'PN', 'h', 24, 1],
    ['CEW-108', 'Shop and filters (PLP)', 1, 8, 6, 140000, 62000, 'RI', 'h', 20, 0],
    ['CEW-109', 'Product page with grind selector', 1, 9, 5, 130000, 38000, 'PN', 'h', 12, 0],
    ['CEW-110', 'Subscription flow — “Fresh every fortnight”', 2, 7, 7, 220000, 180000, 'AD', 'h', 20, 0],
    ['CEW-114', 'Brew guides — 6 methods', 1, 10, 7, 90000, 30000, 'SQ', 'm', 22, 0],
    ['CEW-115', 'Checkout with UPI and COD', 0, 13, 6, 160000, 0, 'AD', 'h', 16, 0],
    ['CEW-123', 'Gift box configurator', 0, 15, 5, 150000, 0, 'RI', 'm', 14, 0],
    ['CEW-122', 'Launch — Christmas gifting', 0, 20, 1, 0, 0, 'AR', 'h', 2, 1]
  ];
  var DEPS = [['CEW-101', 'CEW-102'], ['CEW-102', 'CEW-103'], ['CEW-103', 'CEW-123'], ['CEW-110', 'CEW-115'], ['CEW-115', 'CEW-122']];
  var inr = function (n) { return (n < 0 ? '−₹' : '₹') + new Intl.NumberFormat('en-IN').format(Math.abs(n)); };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], WKD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function dayDate(d) { return new Date(2026, 10, 17 + d); }
  function dateLabel(d) { var x = dayDate(d); return WKD[x.getDay()] + ' ' + x.getDate() + ' ' + MON[x.getMonth()]; }
  function dl(due) { var dd = due - TODAY; return dd === 0 ? 'Today' : dd < 0 ? Math.abs(dd) + 'd ago' : dd === 1 ? 'Tomorrow' : 'in ' + dd + 'd'; }
  function isWE(d) { var w = (2 + d) % 7; return w === 6 || w === 0; }
  function make() {
    var rk = T0.map(function (r, i) { return i; }).sort(function (a, b) { return T0[a][3] - T0[b][3] || a - b; });
    return T0.map(function (r, i) { return { id: r[0], title: r[1], st: r[2], s: r[3], n: r[4], bud: r[5], sp: r[6], who: r[7], pr: r[8], est: r[9], cv: !!r[10], o: i, i: i, rk: rk.indexOf(i), ms: r[0] === 'CEW-122' }; });
  }
  /* hours per person per working day: an estimate is spread across the working days between start and due */
  function loadOf(all) {
    var W = {}; PO.forEach(function (p) { W[p] = {}; });
    all.forEach(function (t) { var ds = []; for (var d = t.s; d < t.s + t.n; d++) if (!isWE(d)) ds.push(d); if (!ds.length) ds = [t.s]; var h = t.est / ds.length; ds.forEach(function (d) { W[t.who][d] = (W[t.who][d] || 0) + h; }); });
    return W;
  }
  function overDays(all, who) { var l = loadOf(all)[who], c = PPL[who][2], n = 0; for (var d in l) if (l[d] > c + 0.05) n++; return n; }
  function avH(t) { return '<span class="av">' + t.who + '</span>'; }
  function prH(t) { return '<span class="pr ' + t.pr + '"><i></i><i></i><i></i></span>'; }
  /* six layers per task, one per view; paintItem() fills them from the task, so a change repaints in place */
  function layersHTML(t) {
    return '<div class="ly card"><span class="k">' + t.id + '</span><span class="t">' + esc(t.title) + '</span><span class="m">' + prH(t) + '<span data-due></span><span class="s"></span>' + avH(t) + '</span></div>' +
      '<div class="ly row"><span class="sd"></span><span class="k">' + t.id + '</span><span class="t">' + esc(t.title) + '</span>' + prH(t) + '<span class="dd" data-due></span>' + avH(t) + '</div>' +
      '<div class="ly bar"><i data-prog></i><span data-bt></span><b class="gr"></b></div>' +
      '<div class="ly chip"><span class="kk">' + t.id + '</span><span class="tt">' + esc(t.title) + '</span></div>' +
      '<div class="ly cell"><span class="c0"><span class="k">' + t.id + '</span>' + esc(t.title) + '</span><span class="c1"><span class="pill" data-pill></span></span><span class="c2">' + avH(t) + '</span><span class="c3" data-date></span><span class="c4 n" data-bud></span><span class="c5 n" data-sp></span><span class="c6 n fx" data-rem></span></div>' +
      '<div class="ly blk"></div>';
  }
  function paintItem(el, t) {
    var due = t.s + t.n - 1, over = due < TODAY && t.st < 3, rem = t.bud - t.sp, x;
    el.style.setProperty('--c', COLS[t.st][1]); el.classList.toggle('done', t.st === 3);
    el.setAttribute('aria-label', t.id + ', ' + t.title + '. ' + COLS[t.st][0] + ', due ' + dateLabel(due) + '. Owner ' + PPL[t.who][0] + '.');
    $$('[data-due]', el).forEach(function (e) { e.textContent = dl(due); });
    $$('.dd', el).forEach(function (e) { e.classList.toggle('o', over); });
    $$('.sd', el).forEach(function (e) { e.classList.toggle('f', t.st === 3); });
    $$('[data-pill]', el).forEach(function (e) { e.textContent = COLS[t.st][0]; });
    if ((x = $('[data-prog]', el))) x.style.width = [0, 35, 70, 100][t.st] + '%';
    if ((x = $('[data-bt]', el))) x.textContent = (t.st === 3 ? '✓ ' : '') + t.title;
    if ((x = $('[data-date]', el))) x.textContent = dateLabel(due);
    if ((x = $('[data-bud]', el))) x.textContent = inr(t.bud);
    if ((x = $('[data-sp]', el))) x.textContent = inr(t.sp);
    if ((x = $('[data-rem]', el))) { x.textContent = inr(rem); x.classList.toggle('neg', rem < 0); }
  }
  var fmtH = function (h) { return (Math.round(h * 10) / 10).toString(); };

  /* where every task goes in each of the six views, plus the backdrop of each view. Pure: takes the tasks to draw, the
     size of the stage and options (mob: stack the board two by two; cp: compact stage; all: every task, for workload). */
  function layouts(list, W, H, o) {
    o = o || {}; var mob = !!o.mob, cp = !!o.cp, n = list.length, all = o.all || list, deps = o.deps || DEPS, L = [{}, {}, {}, {}, {}, {}], bg = ['', '', '', '', '', ''], geo = {}, d, k;
    /* 0 board */
    var per = mob ? 2 : 4, rows = mob ? 2 : 1, gap = 10, colW = (W - gap * (per + 1)) / per, rowH = (H - gap) / rows, cnt = [0, 0, 0, 0], cols = [], bh = '', pos = [0, 0, 0, 0];
    list.forEach(function (t) { cnt[t.st]++; });
    COLS.forEach(function (c, i) {
      var r = Math.floor(i / per), kk = i % per, left = gap + kk * (colW + gap), top = gap + r * rowH;
      cols.push({ left: left, top: top, w: colW, h: rowH - gap });
      bh += '<div class="bg-col" data-col="' + i + '" style="left:' + left + 'px;top:' + top + 'px;width:' + colW + 'px;height:' + (rowH - gap) + 'px"><b><span class="sd' + (i === 3 ? ' f' : '') + '" style="--c:' + c[1] + '"></span>' + c[0] + ' <span class="ct">' + cnt[i] + '</span></b></div>';
    });
    var base = mob ? 64 : cp ? 74 : 72;
    list.slice().sort(function (a, b) { return a.st - b.st || a.o - b.o; }).forEach(function (t) {
      var c = t.st, cc = cols[c], r = Math.floor(c / per), mx = 1; for (var q = r * per; q < r * per + per; q++) mx = Math.max(mx, cnt[q]);
      var hd = mob ? 32 : 38, pitch = Math.min(base + 8, (cc.h - hd - 6) / mx), i2 = pos[c]++;
      L[0][t.id] = { x: cc.left + 6, y: cc.top + hd + i2 * pitch, w: colW - 12, h: Math.max(40, pitch - 6), r: 8 };
    });
    bg[0] = bh; geo.cols = cols;
    /* 1 list */
    var y = 0, lh = '', lr = Math.min(36, (H - 4 * 30) / Math.max(n, 1));
    [0, 1, 2, 3].forEach(function (c) {
      var ts = list.filter(function (t) { return t.st === c; }).sort(function (a, b) { return a.o - b.o; });
      lh += '<div class="bg-gh" style="top:' + y + 'px"><span class="sd' + (c === 3 ? ' f' : '') + '" style="--c:' + COLS[c][1] + '"></span>' + COLS[c][0] + ' <small>' + ts.length + '</small></div>'; y += 30;
      ts.forEach(function (t) { L[1][t.id] = { x: 0, y: y, w: W, h: lr, r: 0 }; y += lr; });
    });
    bg[1] = lh;
    /* 2 timeline */
    var dw = W / DAYS, step = dw >= 28 ? 1 : dw >= 17 ? 2 : 3, th = '<div class="bg-tlh">', trH = Math.min(36, (H - 34) / Math.max(n, 1));
    for (d = 0; d < DAYS; d++) if (d === TODAY || (d % step === 0 && (step === 1 || Math.abs(d - TODAY) > 1))) th += '<span style="left:' + (d * dw + dw / 2) + 'px"' + (d === TODAY ? ' class="td"' : '') + '>' + dayDate(d).getDate() + '</span>';
    th += '</div>';
    for (d = 0; d < DAYS; d++) th += '<div class="bg-day' + (isWE(d) ? ' we' : '') + '" style="left:' + d * dw + 'px;width:' + dw + 'px"></div>';
    th += '<div class="bg-today" style="left:' + (TODAY * dw + dw / 2 - 1) + 'px"></div>';
    list.slice().sort(function (a, b) { return a.rk - b.rk; }).forEach(function (t, r) {
      var ms = t.ms; L[2][t.id] = { x: t.s * dw + (ms ? dw / 2 - 9 : 0), y: 34 + r * trH + (trH - (ms ? 18 : 24)) / 2, w: ms ? 18 : t.n * dw, h: ms ? 18 : 24, r: ms ? 4 : 6 };
    });
    var svg = '<svg class="bg-deps" width="' + W + '" height="' + H + '" aria-hidden="true">';
    deps.forEach(function (dp) { var a = L[2][dp[0]], b = L[2][dp[1]]; if (!a || !b) return; var x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2, bad = x2 < x1 - 1, mx = Math.min(x1 + 10, x2 - 6); svg += '<path class="' + (bad ? 'bad' : '') + '" d="M' + x1 + ' ' + y1 + ' H' + (bad ? x1 + 8 : mx) + ' V' + y2 + ' H' + x2 + '"/>'; });
    bg[2] = th + svg + '</svg>'; geo.dw = dw;
    /* 3 calendar */
    var cw = W / 7, chh = (H - 26) / 5, ch = '<div class="bg-cal-h">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div>', stack = {};
    for (k = 0; k < 35; k++) ch += '<div class="bg-cell' + (k % 7 > 4 ? ' we' : '') + (k === TODAY + CAL0 ? ' td' : '') + '" style="left:' + (k % 7) * cw + 'px;top:' + (26 + Math.floor(k / 7) * chh) + 'px;width:' + cw + 'px;height:' + chh + 'px"><span>' + dayDate(k - CAL0).getDate() + '</span></div>';
    bg[3] = ch;
    list.slice().sort(function (a, b) { return a.i - b.i; }).forEach(function (t) { var c = t.s + t.n - 1 + CAL0, s = stack[c] = (stack[c] || 0) + 1; L[3][t.id] = { x: (c % 7) * cw + 4, y: 26 + Math.floor(c / 7) * chh + 20 + (s - 1) * 20, w: cw - 8, h: 18, r: 4 }; });
    geo.cw = cw; geo.chh = chh;
    /* 4 table: seven columns, the narrow stage keeps three */
    var wide = W >= 640, wt = wide ? [0.27, 0.12, 0.07, 0.12, 0.13, 0.12, 0.17] : [0.5, 0.22, 0, 0.28, 0, 0, 0], hd = ['Task', 'Status', 'Owner', 'Due', 'Budget', 'Spent', 'Remaining  ƒx'], tb = '<div class="bg-th">';
    wt.forEach(function (c, i) { if (c) tb += '<span style="width:' + c * W + 'px' + (i >= 4 ? ';justify-content:flex-end' : '') + '"' + (i === 6 ? ' class="fx"' : '') + '>' + hd[i] + '</span>'; });
    bg[4] = tb + '</div>';
    var tr = Math.min(36, (H - 32) / Math.max(n, 1));
    list.slice().sort(function (a, b) { return a.i - b.i; }).forEach(function (t, r) { L[4][t.id] = { x: 0, y: 32 + r * tr, w: W, h: tr, r: 0 }; });
    /* 5 workload: people are rows, working days are columns, load per day is a block that turns amber over capacity */
    var wd = []; for (d = 0; d < DAYS; d++) if (!isWE(d)) wd.push(d);
    var lw = cp || mob ? 52 : 80, cwk = (W - lw - 6) / wd.length, hh = 30, rh = Math.min(mob ? 100 : 80, (H - hh - 8) / PO.length), ld = loadOf(all), wb = '<div class="bg-tlh">', wstep = cwk >= 30 ? 1 : cwk >= 18 ? 2 : 3, idxOf = {};
    wd.forEach(function (dd, i) { idxOf[dd] = i; if (i % wstep === 0 || dd === TODAY) wb += '<span style="left:' + (lw + i * cwk + cwk / 2) + 'px"' + (dd === TODAY ? ' class="td"' : '') + '>' + dayDate(dd).getDate() + '</span>'; });
    wb += '</div>';
    PO.forEach(function (p, r) {
      var top = hh + 4 + r * rh, cap = PPL[p][2];
      wb += '<div class="wl-p" style="top:' + top + 'px;height:' + (rh - 6) + 'px"><span class="av">' + p + '</span><b>' + PPL[p][0] + '</b>' + (lw > 60 ? '<small>' + fmtH(cap) + ' h a day</small>' : '') + '</div>';
      wd.forEach(function (dd, i) { var h = ld[p][dd] || 0, ov = h > cap + 0.05; wb += '<div class="wl-c' + (ov ? ' ov' : '') + '" style="left:' + (lw + i * cwk) + 'px;top:' + top + 'px;width:' + (cwk - 2) + 'px;height:' + (rh - 6) + 'px"' + (h ? ' title="' + PPL[p][0] + ' · ' + fmtH(h) + ' of ' + fmtH(cap) + ' h"' : '') + '><i style="height:' + Math.round(Math.min(1, h / cap) * 100) + '%"></i>' + (cwk >= 24 && h ? '<em>' + fmtH(h) + '</em>' : '') + '</div>'; });
    });
    bg[5] = wb;
    function ci(dd, dir) { while (!(dd in idxOf) && dd >= 0 && dd < DAYS) dd += dir; return dd in idxOf ? idxOf[dd] : dir > 0 ? wd.length - 1 : 0; }
    PO.forEach(function (p, r) {
      var lanes = [], top = hh + 4 + r * rh;
      list.filter(function (t) { return t.who === p; }).sort(function (a, b) { return a.s - b.s; }).forEach(function (t) {
        var a = ci(t.s, 1), b = ci(t.s + t.n - 1, -1); if (b < a) b = a; var ln = 0; while (lanes[ln] !== undefined && lanes[ln] >= a) ln++; lanes[ln] = b;
        L[5][t.id] = { x: lw + a * cwk + 1, y: top + rh - 6 - 9 - ln * 8, w: Math.max(4, (b - a + 1) * cwk - 4), h: 5, r: 3 };
      });
    });
    var cols7 = wt.map(function (c) { return c * W; });
    return { L: L, bg: bg, geo: geo, cols: cols7 };
  }
  OW.viewKit = { COLS: COLS, PPL: PPL, PO: PO, TODAY: TODAY, DAYS: DAYS, CAL0: CAL0, DEPS: DEPS, make: make, layouts: layouts, layersHTML: layersHTML, paintItem: paintItem, dl: dl, dateLabel: dateLabel, dayDate: dayDate, isWE: isWE, loadOf: loadOf, overDays: overDays, esc: esc, fmtH: fmtH };
  try { document.dispatchEvent(new Event('ow:kit')); } catch (e) { }

  /* ---------- the scroll sequence: one dataset, six shapes. Used on small screens (pinned, scrubbed by scroll) and under
     reduced motion (clickable tabs, instant); wide screens get the two-stage drag version in js/duo.js ---------- */
  var canvas = $('#canvas'), wideMQ = matchMedia('(min-width:900px)'), legacyBuilt = false, legacyST = null;
  function legacyOn() { return reduce || !wideMQ.matches; }
  if (canvas) {
    setTimeout(function () { if (legacyOn()) { legacyBuilt = true; shift(); } }, 0); // own task, so script evaluation and the stage build are not one long task
    var onMQ = function () { if (legacyOn()) { if (!legacyBuilt) { legacyBuilt = true; shift(); } else if (legacyST) { legacyST.enable(); ST.refresh(); } } else if (legacyST) legacyST.disable(); };
    if (wideMQ.addEventListener) wideMQ.addEventListener('change', onMQ);
  }

  function shift() {
    var tasks = make(), N = 6;
    var items = tasks.map(function (t) {
      var el = document.createElement('div'); el.className = 'it2'; el.innerHTML = layersHTML(t); paintItem(el, t); canvas.appendChild(el); return el;
    });
    var bgs = [0, 1, 2, 3, 4, 5].map(function () { var b = document.createElement('div'); b.className = 'bgl'; return b; });
    bgs.slice().reverse().forEach(function (b) { canvas.insertBefore(b, canvas.firstChild); });
    var R = null;
    function layout() {
      var W = canvas.clientWidth, H = canvas.clientHeight, mob = W < 600;
      R = layouts(tasks, W, H, { mob: mob });
      R.bg.forEach(function (h, i) { bgs[i].innerHTML = h; });
      items.forEach(function (el) { $$('.ly.cell>span', el).forEach(function (s, k) { s.style.width = R.cols[k] + 'px'; s.style.display = R.cols[k] ? '' : 'none'; }); });
    }
    var flat = function (k) { return k === 1 || k === 4 || k === 5; };
    var cur = 0;
    function caps(k) {
      $$('.cap').forEach(function (c, i) { c.classList.toggle('on', i === k); });
      $$('[data-go]').forEach(function (b, i) { b.setAttribute('aria-pressed', i === k); });
      $$('.f-tab[data-tab]').forEach(function (b, i) { b.classList.toggle('on', i === k); });
      var ci = $('#cap-i'); if (ci) ci.textContent = '0' + (k + 1);
    }
    function setStatic(k) {
      cur = k; caps(k);
      items.forEach(function (el, i) { var p = R.L[k][tasks[i].id]; el.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)'; el.style.width = p.w + 'px'; el.style.height = p.h + 'px'; el.style.borderRadius = p.r + 'px'; el.style.borderColor = flat(k) ? 'transparent' : ''; el.style.boxShadow = k === 5 ? 'none' : k === 1 || k === 4 ? 'inset 0 -1px 0 var(--line-2)' : ''; $$('.ly', el).forEach(function (ly, j) { ly.classList.toggle('on', j === k); }); });
      bgs.forEach(function (b, i) { b.classList.toggle('on', i === k); });
      canvas.classList.toggle('cp', canvas.clientWidth < 600);
    }
    layout(); setStatic(0);
    var useG = G && ST && !reduce && !wideMQ.matches;
    if (!useG) {
      document.documentElement.classList.add('no-gsap');
      $$('[data-go]').forEach(function (b) { b.addEventListener('click', function () { setStatic(+b.getAttribute('data-go')); }); });
      $$('.f-tab[data-tab]').forEach(function (b) { b.addEventListener('click', function () { setStatic(+b.getAttribute('data-tab')); }); });
      addEventListener('resize', function () { layout(); setStatic(cur); });
      // swipe the stage sideways to step through the six views
      var sx = null, sy = 0;
      canvas.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; });
      canvas.addEventListener('pointerup', function (e) { if (sx === null) return; var dx = e.clientX - sx, dy = e.clientY - sy; sx = null; if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.6) setStatic(Math.max(0, Math.min(N - 1, cur + (dx < 0 ? 1 : -1)))); });
      canvas.addEventListener('pointercancel', function () { sx = null; });
      return;
    }
    G.registerPlugin(ST);
    // layers are driven by the timeline, not CSS classes
    items.forEach(function (el, i) { var p = R.L[0][tasks[i].id]; $$('.ly', el).forEach(function (ly, j) { ly.classList.remove('on'); ly.style.transition = 'none'; G.set(ly, { opacity: j === 0 ? 1 : 0 }); }); el.style.transform = ''; G.set(el, { x: p.x, y: p.y, width: p.w, height: p.h, borderRadius: 8 }); });
    bgs.forEach(function (b, i) { b.classList.remove('on'); b.style.transition = 'none'; G.set(b, { opacity: i === 0 ? 1 : 0 }); });
    var tl = G.timeline({ defaults: { ease: 'power3.inOut' } });
    tl.addLabel('s0', 0);
    for (var k = 1; k < N; k++) {
      (function (k) {
        var at = k - 1 + 0.15;
        items.forEach(function (el, i) {
          var id = tasks[i].id;
          tl.to(el, { x: function () { return R.L[k][id].x; }, y: function () { return R.L[k][id].y; }, width: function () { return R.L[k][id].w; }, height: function () { return R.L[k][id].h; }, borderRadius: function () { return R.L[k][id].r; }, borderColor: flat(k) ? 'rgba(0,0,0,0)' : '#E3E6EB', boxShadow: k === 5 ? 'none' : flat(k) ? 'inset 0 -1px 0 #ECEEF2' : '0 1px 2px rgba(17,19,23,.06)', duration: 0.7 }, at + i * 0.012);
          var lys = $$('.ly', el);
          tl.to(lys[k - 1], { opacity: 0, duration: 0.25, ease: 'none' }, at + 0.1).to(lys[k], { opacity: 1, duration: 0.3, ease: 'none' }, at + 0.38);
        });
        tl.to(bgs[k - 1], { opacity: 0, duration: 0.3, ease: 'none' }, at).to(bgs[k], { opacity: 1, duration: 0.35, ease: 'none' }, at + 0.3);
        tl.addLabel('s' + k, k);
      })(k);
    }
    tl.set({}, {}, N - 1); // exactly N-1 long so every label is a real stop
    var st = legacyST = ST.create({
      trigger: '.shift', pin: '.shift-pin', start: 'top 64px', end: function () { return '+=' + Math.round(innerHeight * 0.85 * (N - 1)); }, scrub: 0.7, animation: tl, invalidateOnRefresh: true,
      snap: { snapTo: 'labels', inertia: false, duration: { min: 0.25, max: 0.7 }, delay: 0.08, ease: 'power2.inOut' },
      onUpdate: function (s) { var k = Math.round(s.progress * (N - 1)); if (k !== cur) { cur = k; caps(k); canvas.classList.toggle('cp', canvas.clientWidth < 600); } }
    });
    canvas.classList.toggle('cp', canvas.clientWidth < 600);
    ST.addEventListener('refreshInit', function () { layout(); });
    var jump = function (k) { var y = Math.round(st.labelToScroll ? st.labelToScroll('s' + k) : st.start + (st.end - st.start) * k / (N - 1)); if (window.Motion && window.Motion.lenis) window.Motion.lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); };
    $$('[data-go]').forEach(function (b) { b.addEventListener('click', function () { jump(+b.getAttribute('data-go')); }); });
    $$('.f-tab[data-tab]').forEach(function (b) { b.addEventListener('click', function () { jump(+b.getAttribute('data-tab')); }); });
    // motion.js created its triggers first; re-measure everything now that the pin spacer exists
    if (ST.sort) ST.sort(); ST.refresh();
  }

  /* ---------- brand wall: the name, colour and domain drive the nav, the app frame, the sign-in card, the invite and the workspace ---------- */
  var pn = $('#pg-n');
  if (pn) {
    var state = { name: (ab && ab.name) || 'Ordwell', accent: (ab && ab.accent) || '#111317', domain: $('#pg-d').value };
    if (ab && ab.name && ab.name.toLowerCase() !== 'ordwell') pn.value = ab.name;
    var live = function () {
      $$('[data-bname-live]').forEach(function (e) { e.textContent = state.name; });
      paint(state.name, state.accent); $$('[data-bdomain]').forEach(function (e) { e.textContent = state.domain; });
    };
    pn.addEventListener('input', function () { var v = pn.value.trim(), e = $('#pg-e'); e.hidden = !!v; e.textContent = v ? '' : 'Give your product a name — even a working title.'; pn.setAttribute('aria-invalid', !v); if (v) { state.name = v; live(); } });
    $('#pg-d').addEventListener('input', function () { state.domain = $('#pg-d').value.trim() || 'work.youragency.com'; live(); });
    $$('[data-sw]').forEach(function (b) { b.addEventListener('click', function () { state.accent = b.getAttribute('data-sw'); $$('[data-sw]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); live(); }); });
    $('#pg-reset').addEventListener('click', function () { state = { name: 'Ordwell', accent: '#111317', domain: 'work.fernhill-digital.in' }; pn.value = 'Ordwell'; $('#pg-d').value = state.domain; $$('[data-sw]').forEach(function (x, i) { x.setAttribute('aria-pressed', i === 0); }); live(); });
    /* the nameplate in the hero drives the same state: type a name, pick a colour, and the page (and then the app) is yours */
    var pl = $('#pl-n'), copy = $('#pl-copy'), note = $('#pl-note');
    function keys(sel, attr) { $$(sel).forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute(attr).toUpperCase() === state.accent.toUpperCase())); }); }
    function save() { try { OW.store.load(); OW.store.commit('Branded from the website', function (S) { S.brand.name = state.name; S.brand.accent = state.accent; S.brand.sender = state.name; }); } catch (e) { } }
    function named() { return state.name && state.name.toLowerCase() !== 'ordwell'; }
    function plate() { keys('[data-plc]', 'data-plc'); keys('[data-sw]', 'data-sw'); if (copy) copy.hidden = !named(); if (note) note.textContent = named() ? 'This page is ' + state.name + ' now. Open the app and it is too.' : 'The whole page takes your name. So does the app.'; }
    if (pl) {
      if (ab && ab.name && ab.name.toLowerCase() !== 'ordwell') { pl.value = ab.name; state.name = ab.name; pn.value = ab.name; $$('[data-bname-live]').forEach(function (e) { e.textContent = ab.name; }); }
      pl.addEventListener('input', function () { var v = pl.value.replace(/[<>]/g, '').trim(); state.name = v || 'Ordwell'; pn.value = state.name; live(); plate(); });
      $$('[data-plc]').forEach(function (b) { b.addEventListener('click', function () { state.accent = b.getAttribute('data-plc'); live(); plate(); }); });
      pn.addEventListener('input', function () { if (pn.value.trim()) { pl.value = pn.value.trim().toLowerCase() === 'ordwell' ? '' : pn.value.trim().slice(0, 22); plate(); } });
      $$('[data-sw]').forEach(function (b) { b.addEventListener('click', plate); });
      $('#pg-reset').addEventListener('click', function () { pl.value = ''; setTimeout(plate, 0); });
      if (copy) copy.addEventListener('click', function () {
        var url = location.origin + location.pathname + '#b=' + encodeURIComponent(state.name) + '|' + state.accent.replace('#', ''), done = function () { copy.firstChild.textContent = 'Link copied'; setTimeout(function () { copy.firstChild.textContent = 'Copy my link'; }, 1800); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { location.hash = url.split('#')[1]; done(); }); else { location.hash = url.split('#')[1]; done(); }
      });
      /* every "Open …" button opens the app already carrying the name and colour */
      $$('a[data-open]').forEach(function (a) { a.addEventListener('click', function () { if (named() || state.accent.toUpperCase() !== '#111317') save(); }); });
      plate();
    }
    $('#pg-go').addEventListener('click', function () {
      if (!state.name) { pn.focus(); return; }
      try { OW.store.load(); OW.store.commit('Branded from the website', function (S) { S.brand.name = state.name; S.brand.accent = state.accent; if (/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(state.domain)) { S.brand.domain = state.domain.toLowerCase(); S.brand.domainState = 'verified'; } S.brand.sender = state.name; }); } catch (e) { }
      location.href = 'index.html#/settings/brand';
    });
  }

  /* ---------- templates strip / gallery ---------- */
  var STC = { todo: 'var(--c-todo)', active: 'var(--c-active)', review: 'var(--c-review)', review2: 'var(--c-review2)', done: 'var(--c-done)', backlog: 'var(--c-backlog)', blocked: 'var(--c-blocked)' };
  function art(t) { var h = '<div class="art" aria-hidden="true">'; t.tasks.slice(0, 7).forEach(function (r, i) { h += '<span style="left:' + (6 + r[2] * 2) + '%;width:' + Math.max(6, r[3] * 2.6) + '%;top:' + (18 + i * 17) + 'px;opacity:' + (0.35 + i * 0.09) + '"></span>'; }); return h + '</div>'; }
  function counts(t) { return t.tasks.length + ' tasks · ' + t.statuses.length + ' statuses · ' + t.autos.length + ' automation' + (t.autos.length === 1 ? '' : 's'); }
  function card(t, full) {
    return '<article class="tc" data-cat="' + esc(t.cat) + '">' + art(t) + '<div class="bd"><small>' + esc(t.cat) + '</small><h3>' + esc(t.name) + '</h3><p>' + esc(t.blurb) + '</p><p class="cnt mono">' + counts(t) + '</p>' +
      (full ? '<div class="sts" role="list" aria-label="Statuses">' + t.statuses.map(function (s) { return '<span role="listitem" class="pill" style="--c:' + (STC[s[1]] || 'var(--c-todo)') + '">' + esc(s[0]) + '</span>'; }).join('') + '</div><ol class="first" aria-label="First tasks">' + t.tasks.slice(0, 4).map(function (r) { return '<li><span>' + esc(r[0]) + '</span><small class="mono">day ' + (r[2] + 1) + '</small></li>'; }).join('') + '</ol><div class="go"><a class="btn sm pri" href="index.html#/templates?use=' + t.id + '">Use it in the app</a></div>' : '') + '</div></article>';
  }
  var strip = $('#tpl-strip'); if (strip && OW.TEMPLATES) strip.innerHTML = OW.TEMPLATES.map(function (t) { return card(t, false); }).join('');
  var gal = $('#tpl-gal');
  if (gal && OW.TEMPLATES) {
    var own = '<article class="tc own"><div class="bd"><small>Your own</small><h3>Bring your own: paste a list of tasks</h3><p>One task per line, in the order you do them. Ordwell turns the list into a project with a board, a timeline and a table, ready to date.</p><div class="go"><a class="btn pri" href="index.html#/templates">Paste a list in the app</a></div></div></article>';
    var draw = function (cat) { gal.innerHTML = OW.TEMPLATES.filter(function (t) { return !cat || t.cat === cat; }).map(function (t) { return card(t, true); }).join('') + own; };
    draw('');
    $$('[data-cat-f]').forEach(function (b) { b.addEventListener('click', function () { $$('[data-cat-f]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); draw(b.getAttribute('data-cat-f')); }); });
  }

  /* ---------- pricing: billing toggle + walkthrough form (lands in staff.html) ---------- */
  $$('[data-bill]').forEach(function (b) {
    b.addEventListener('click', function () {
      var yr = b.getAttribute('data-bill') === 'year'; $$('[data-bill]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      $$('[data-pm]').forEach(function (p) { var m = +p.getAttribute('data-pm'); p.textContent = '₹' + new Intl.NumberFormat('en-IN').format(yr ? Math.round(m * 10 / 12) : m); });
      $$('[data-pn]').forEach(function (p) { p.textContent = yr ? p.getAttribute('data-y') : p.getAttribute('data-m'); });
    });
  });
  var lf = $('#lead-form');
  if (lf) lf.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = function (n) { return lf.querySelector('[name=' + n + ']'); }, bad = null;
    function chk(n, ok, msg) { var el = f(n), er = $('#' + n + '-e'); el.setAttribute('aria-invalid', ok ? 'false' : 'true'); er.hidden = ok; er.textContent = ok ? '' : msg; if (!ok && !bad) bad = el; }
    chk('name', f('name').value.trim().length > 1, 'Tell us who to ask for.');
    chk('email', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f('email').value.trim()), f('email').value.trim() ? 'That email looks incomplete — check the part after @.' : 'We need an email to send the invite.');
    chk('company', f('company').value.trim().length > 1, 'Which agency or company is this for?');
    if (bad) { bad.focus(); return; }
    var leads = readLeads() || seedLeads();
    var id = 'L-' + (leads.reduce(function (m, l) { return Math.max(m, +l.id.slice(2) || 0); }, 2400) + 1);
    leads.unshift({ id: id, name: f('name').value.trim(), email: f('email').value.trim(), company: f('company').value.trim(), team: f('team').value, plan: f('plan').value, note: f('note').value.trim(), at: Date.now(), stage: 'new', log: [] });
    saveLeads(leads);
    lf.innerHTML = '<div class="ok-box" role="status"><h3>Thanks, ' + esc(f('name').value.trim().split(' ')[0]) + ' — you’re booked in.</h3><p>Reference ' + id + '. We’ll email a 30-minute slot within one working day.</p><p style="margin-top:16px"><a class="btn" href="staff.html">See it on the team’s request board →</a></p></div>';
  });
  function seedLeads() {
    var now = Date.now(), d = 864e5;
    return [
      { id: 'L-2403', name: 'Ritu Malhotra', email: 'ritu@saffronslate.in', company: 'Saffron & Slate', team: '11–25', plan: 'Agency', note: 'We run 14 retainers and want each client in their own branded space.', at: now - 0.2 * d, stage: 'new', log: [] },
      { id: 'L-2402', name: 'Joseph Mathew', email: 'joseph@banyanbuild.in', company: 'Banyan Build Co.', team: '26–60', plan: 'Business', note: 'Site teams in Kochi and Coimbatore — need the construction template and photo uploads.', at: now - 1.3 * d, stage: 'contacted', log: [{ at: now - d, text: 'Called — wants a walkthrough with site engineers on Thursday.' }] },
      { id: 'L-2401', name: 'Ananya Ghosh', email: 'ananya@tealkite.in', company: 'Teal Kite Studio', team: '1–10', plan: 'Team', note: '', at: now - 3 * d, stage: 'demo', log: [{ at: now - 2 * d, text: 'Demo booked for Friday 4 pm.' }] },
      { id: 'L-2399', name: 'Harsh Vora', email: 'harsh@monsoonworks.in', company: 'Monsoon Works', team: '11–25', plan: 'Agency', note: 'Moving off spreadsheets + WhatsApp groups.', at: now - 9 * d, stage: 'won', log: [{ at: now - 6 * d, text: 'Signed annual Agency plan, 18 seats.' }] }
    ];
  }
  OW.site.seedLeads = seedLeads;
})();
