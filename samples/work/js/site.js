/* Ordwell — marketing site: sticky nav, the "shape-shift" (one dataset morphing board → list → timeline →
   calendar → table, scrubbed by scroll with GSAP ScrollTrigger), the live white-label playground, the templates
   strip/gallery and the walkthrough lead form (leads land in staff.html). Reduced motion gets instant switching. */
(function () {
  'use strict';
  var OW = window.OW || {}, G = window.gsap, ST = window.ScrollTrigger;
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
  var ab = appBrand(); if (ab && ab.name && ab.name.toLowerCase() !== 'ordwell') paint(ab.name, ab.accent); else if (ab && ab.accent) paint('Ordwell', ab.accent);

  /* ---------- command rails: the ⌘K line types in when its panel arrives ---------- */
  (function () {
    var cmds = document.querySelectorAll('.idx'); if (!cmds.length) return;
    if (!('IntersectionObserver' in window)) { cmds.forEach(function (c) { c.classList.add('typed'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('typed'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -12% 0px' });
    cmds.forEach(function (c) { io.observe(c); });
  })();

  /* ---------- nav ---------- */
  var nav = $('#nav'); if (nav) { var onS = function () { nav.classList.toggle('scrolled', scrollY > 8); }; addEventListener('scroll', onS, { passive: true }); onS(); }

  /* ---------- the shape-shift ---------- */
  var T = [
    ['CEW-101', 'Sitemap and content inventory', 3, 0, 3, 60000, 54000, [18, 'AR'], 'm'],
    ['CEW-102', 'Moodboard and visual direction', 3, 3, 3, 120000, 126000, [330, 'PN'], 'h'],
    ['CEW-103', 'Homepage design — hero and story', 2, 6, 5, 180000, 151000, [330, 'PN'], 'h'],
    ['CEW-108', 'Shop and filters (PLP)', 1, 8, 6, 140000, 62000, [200, 'RI'], 'h'],
    ['CEW-109', 'Product page with grind selector', 1, 9, 5, 130000, 38000, [330, 'PN'], 'h'],
    ['CEW-110', 'Subscription flow — “Fresh every fortnight”', 2, 7, 7, 220000, 180000, [260, 'AD'], 'h'],
    ['CEW-114', 'Brew guides — 6 methods', 1, 10, 7, 90000, 30000, [280, 'SQ'], 'm'],
    ['CEW-115', 'Checkout with UPI and COD', 0, 13, 6, 160000, 0, [260, 'AD'], 'h'],
    ['CEW-123', 'Gift box configurator', 0, 15, 5, 150000, 0, [200, 'RI'], 'm'],
    ['CEW-122', 'Launch — Christmas gifting', 0, 20, 1, 0, 0, [18, 'AR'], 'h']
  ];
  var COLS = [['Brief', 'var(--c-todo)', 0], ['In progress', 'var(--c-active)', 1], ['Review', 'var(--c-review)', 1], ['Approved', 'var(--c-done)', 2]];
  var DEPS = [[0, 1], [1, 2], [2, 8], [5, 7], [7, 9]];
  var TODAY = 7, CAL0 = 8; // calendar shows from 9 days before day 0
  var inr = function (n) { return (n < 0 ? '−₹' : '₹') + new Intl.NumberFormat('en-IN').format(Math.abs(n)); };
  var canvas = $('#canvas');
  if (canvas) setTimeout(shift, 0); // own task, so script evaluation and the stage build are not one long task

  function shift() {
    var items = T.map(function (t, i) {
      var el = document.createElement('div'); el.className = 'it2'; el.style.setProperty('--c', COLS[t[2]][1]);
      var due = t[3] + t[4] - 1, dd = due - TODAY, dl = dd === 0 ? 'Today' : dd < 0 ? Math.abs(dd) + 'd ago' : dd === 1 ? 'Tomorrow' : 'in ' + dd + 'd';
      var av = '<span class="av" style="--h:' + t[7][0] + '">' + t[7][1] + '</span>', pr = '<span class="pr ' + t[8] + '"><i></i><i></i><i></i></span>';
      el.innerHTML = '<div class="ly card"><span class="k">' + t[0] + '</span><span class="t">' + esc(t[1]) + '</span><span class="m">' + pr + '<span>' + dl + '</span><span class="s"></span>' + av + '</span></div>' +
        '<div class="ly row"><span class="sd' + (t[2] === 3 ? ' f' : '') + '" style="--c:' + COLS[t[2]][1] + '"></span><span class="k">' + t[0] + '</span><span class="t">' + esc(t[1]) + '</span>' + pr + '<span class="dd' + (dd < 0 && t[2] < 3 ? ' o' : '') + '">' + dl + '</span>' + av + '</div>' +
        '<div class="ly bar"><i style="width:' + (t[2] === 3 ? 100 : t[2] === 2 ? 70 : t[2] === 1 ? 35 : 0) + '%"></i><span>' + esc(t[1]) + '</span></div>' +
        '<div class="ly chip"><span>' + esc(t[1]) + '</span></div>' +
        '<div class="ly cell"><span class="c0" style="gap:8px"><span class="k mono" style="font-size:10px;color:var(--faint)">' + t[0] + '</span>' + esc(t[1]) + '</span><span class="c1"><span class="pill" style="--c:' + COLS[t[2]][1] + '">' + COLS[t[2]][0] + '</span></span><span class="c2" style="gap:6px">' + av + '</span><span class="c3 n">' + inr(t[5]) + '</span><span class="c4 n">' + inr(t[6]) + '</span><span class="c5 fx' + (t[5] - t[6] < 0 ? ' neg' : '') + '">' + inr(t[5] - t[6]) + '</span></div>';
      canvas.appendChild(el); return el;
    });
    var bgs = ['board', 'list', 'tl', 'cal', 'table'].map(function (k) { var b = document.createElement('div'); b.className = 'bgl bg-' + k; return b; });
    bgs.slice().reverse().forEach(function (b) { canvas.insertBefore(b, canvas.firstChild); });
    var L = [];
    function layout() {
      var W = canvas.clientWidth, H = canvas.clientHeight, mob = W < 600;
      L = [[], [], [], [], []];
      // board
      var colW = Math.max(mob ? 168 : 150, (W - 20 - 30) / 4), order = [0, 0, 0, 0], bh = '';
      COLS.forEach(function (c, i) { bh += '<div class="bg-col" style="left:' + (10 + i * (colW + 10)) + 'px;width:' + colW + 'px"><b><span class="sd' + (i === 3 ? ' f' : '') + '" style="--c:' + c[1] + '"></span>' + c[0] + ' <span style="color:var(--faint);font-weight:500">' + T.filter(function (t) { return t[2] === i; }).length + '</span></b></div>'; });
      bgs[0].innerHTML = bh;
      T.forEach(function (t, i) { var c = t[2], o = order[c]++; L[0][i] = { x: 10 + c * (colW + 10) + 8, y: 50 + o * 80, w: colW - 16, h: 72, r: 8 }; });
      // list
      var y = 0, lh = '', rowH = Math.min(36, (H - 4 * 30) / 10);
      [0, 1, 2, 3].forEach(function (c) { var ts = T.map(function (t, i) { return [t, i]; }).filter(function (x) { return x[0][2] === c; }); lh += '<div class="bg-gh" style="top:' + y + 'px"><span class="sd' + (c === 3 ? ' f' : '') + '" style="--c:' + COLS[c][1] + '"></span>' + COLS[c][0] + ' <small>' + ts.length + '</small></div>'; y += 30; ts.forEach(function (x) { L[1][x[1]] = { x: 0, y: y, w: W, h: rowH, r: 0 }; y += rowH; }); });
      bgs[1].innerHTML = lh;
      // timeline
      var days = 22, dw = W / days, th = '<div class="bg-tlh">', trH = Math.min(36, (H - 34) / 10);
      for (var d = 0; d < days; d++) { th += (!mob || d === TODAY || (d % 3 === 0 && Math.abs(d - TODAY) > 1) ? '<span style="left:' + (d * dw + dw / 2) + 'px"' + (d === TODAY ? ' class="td"' : '') + '>' + (17 + d > 30 ? 17 + d - 30 : 17 + d) + '</span>' : ''); }
      th += '</div>'; for (var e = 0; e < days; e++) { var dow = (2 + e) % 7, we = dow === 6 || dow === 0; th += '<div class="bg-day' + (we ? ' we' : '') + '" style="left:' + e * dw + 'px;width:' + dw + 'px"></div>'; }
      th += '<div class="bg-today" style="left:' + (TODAY * dw + dw / 2 - 1) + 'px"></div>';
      var sorted = T.map(function (t, i) { return i; }).sort(function (a, b) { return T[a][3] - T[b][3]; });
      sorted.forEach(function (i, k) { var t = T[i], ms = t[4] === 1; L[2][i] = { x: t[3] * dw + (ms ? dw / 2 - 9 : 0), y: 34 + k * trH + (trH - (ms ? 18 : 24)) / 2, w: ms ? 18 : t[4] * dw, h: ms ? 18 : 24, r: ms ? 4 : 6 }; });
      var svg = '<svg class="bg-deps" width="' + W + '" height="' + H + '">';
      DEPS.forEach(function (dp) { var a = L[2][dp[0]], b = L[2][dp[1]], x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2, bad = x2 < x1 - 1; var mx = Math.min(x1 + 10, x2 - 6); svg += '<path class="' + (bad ? 'bad' : '') + '" d="M' + x1 + ' ' + y1 + ' H' + (bad ? x1 + 8 : mx) + ' V' + y2 + ' H' + x2 + '"/>'; });
      bgs[2].innerHTML = th + svg + '</svg>';
      // calendar
      var cw = W / 7, chh = (H - 26) / 5, ch = '<div class="bg-cal-h">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div>', stack = {};
      for (var n = 0; n < 35; n++) { var dn = n - CAL0 + 17; var lab = dn > 30 ? dn - 30 : dn < 1 ? dn + 31 : dn; ch += '<div class="bg-cell' + (n % 7 > 4 ? ' we' : '') + (n === TODAY + CAL0 ? ' td' : '') + '" style="left:' + (n % 7) * cw + 'px;top:' + (26 + Math.floor(n / 7) * chh) + 'px;width:' + cw + 'px;height:' + chh + 'px"><span>' + lab + '</span></div>'; }
      bgs[3].innerHTML = ch;
      T.forEach(function (t, i) { var n = t[3] + t[4] - 1 + CAL0, s = stack[n] = (stack[n] || 0) + 1; L[3][i] = { x: (n % 7) * cw + 4, y: 26 + Math.floor(n / 7) * chh + 20 + (s - 1) * 20, w: cw - 8, h: 18, r: 4 }; });
      // table
      var cols = mob ? [0.62, 0.38, 0, 0, 0, 0] : [0.36, 0.13, 0.08, 0.14, 0.14, 0.15], hd = ['Task', 'Status', 'Owner', 'Budget', 'Spent', 'Remaining  ƒx'], tb = '<div class="bg-th">', xx = 0;
      cols.forEach(function (c, k) { if (!c) return; tb += '<span style="width:' + c * W + 'px' + (k > 2 ? ';justify-content:flex-end' : '') + '" class="' + (k === 5 ? 'fx' : '') + '">' + hd[k] + '</span>'; xx += c * W; });
      bgs[4].innerHTML = tb + '</div>';
      var tr = Math.min(36, (H - 32) / 10);
      T.forEach(function (t, i) { L[4][i] = { x: 0, y: 32 + i * tr, w: W, h: tr, r: 0 }; });
      items.forEach(function (el) { $$('.ly.cell>span', el).forEach(function (s, k) { s.style.width = cols[k] * W + 'px'; s.style.display = cols[k] ? '' : 'none'; }); });
    }
    var LAY = ['card', 'row', 'bar', 'chip', 'cell'];
    var cur = 0;
    function caps(k) {
      $$('.cap').forEach(function (c, i) { c.classList.toggle('on', i === k); });
      $$('[data-go]').forEach(function (b, i) { b.setAttribute('aria-pressed', i === k); });
      $$('.f-tab[data-tab]').forEach(function (b, i) { b.classList.toggle('on', i === k); });
      var ci = $('#cap-i'); if (ci) ci.textContent = '0' + (k + 1);
    }
    function setStatic(k) {
      cur = k; caps(k);
      items.forEach(function (el, i) { var p = L[k][i]; el.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)'; el.style.width = p.w + 'px'; el.style.height = p.h + 'px'; el.style.borderRadius = p.r + 'px'; el.style.borderColor = k === 1 || k === 4 ? 'transparent' : ''; el.style.boxShadow = k === 1 || k === 4 ? 'inset 0 -1px 0 var(--line-2)' : ''; $$('.ly', el).forEach(function (ly, j) { ly.classList.toggle('on', j === k); }); });
      bgs.forEach(function (b, i) { b.classList.toggle('on', i === k); });
    }
    layout(); setStatic(0);
    var useG = G && ST && !reduce;
    if (!useG) {
      document.documentElement.classList.add('no-gsap');
      $$('[data-go]').forEach(function (b) { b.addEventListener('click', function () { setStatic(+b.getAttribute('data-go')); }); });
      addEventListener('resize', function () { layout(); setStatic(cur); });
      return;
    }
    G.registerPlugin(ST);
    // layers are driven by the timeline, not CSS classes
    items.forEach(function (el) { $$('.ly', el).forEach(function (ly, j) { ly.classList.remove('on'); ly.style.transition = 'none'; G.set(ly, { opacity: j === 0 ? 1 : 0 }); }); el.style.transform = ''; G.set(el, { x: L[0][items.indexOf(el)].x, y: L[0][items.indexOf(el)].y, width: L[0][items.indexOf(el)].w, height: L[0][items.indexOf(el)].h, borderRadius: 8 }); });
    bgs.forEach(function (b, i) { b.classList.remove('on'); b.style.transition = 'none'; G.set(b, { opacity: i === 0 ? 1 : 0 }); });
    var tl = G.timeline({ defaults: { ease: 'power3.inOut' } });
    tl.addLabel('s0', 0);
    for (var k = 1; k < 5; k++) {
      (function (k) {
        var at = k - 1 + 0.15;
        items.forEach(function (el, i) {
          tl.to(el, { x: function () { return L[k][i].x; }, y: function () { return L[k][i].y; }, width: function () { return L[k][i].w; }, height: function () { return L[k][i].h; }, borderRadius: function () { return L[k][i].r; }, borderColor: k === 1 || k === 4 ? 'rgba(0,0,0,0)' : '#E5E2DA', boxShadow: k === 1 || k === 4 ? 'inset 0 -1px 0 #EEECE6' : '0 1px 2px rgba(27,26,23,.06)', duration: 0.7 }, at + i * 0.012);
          var lys = $$('.ly', el);
          tl.to(lys[k - 1], { opacity: 0, duration: 0.25, ease: 'none' }, at + 0.1).to(lys[k], { opacity: 1, duration: 0.3, ease: 'none' }, at + 0.38);
        });
        tl.to(bgs[k - 1], { opacity: 0, duration: 0.3, ease: 'none' }, at).to(bgs[k], { opacity: 1, duration: 0.35, ease: 'none' }, at + 0.3);
        tl.addLabel('s' + k, k);
      })(k);
    }
    tl.set({}, {}, 4); // make the timeline exactly 4 long so every label is a real stop
    var st = ST.create({
      trigger: '.shift', pin: '.shift-pin', start: 'top 64px', end: function () { return '+=' + Math.round(innerHeight * 3.4); }, scrub: 0.7, animation: tl, invalidateOnRefresh: true,
      snap: { snapTo: 'labels', inertia: false, duration: { min: 0.25, max: 0.7 }, delay: 0.08, ease: 'power2.inOut' },
      onUpdate: function (s) { var k = Math.round(s.progress * 4); if (k !== cur) { cur = k; caps(k); } }
    });
    ST.addEventListener('refreshInit', function () { layout(); });
    $$('[data-go]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = +b.getAttribute('data-go'), y = Math.round(st.labelToScroll ? st.labelToScroll('s' + k) : st.start + (st.end - st.start) * k / 4);
        if (window.Motion && window.Motion.lenis) window.Motion.lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y);
      });
    });
    // hero intro: the app frame rises in once
    // (the frame's entrance is a CSS animation so it plays before this script arrives)
    // motion.js created its triggers first; re-measure everything now that the pin spacer exists
    if (ST.sort) ST.sort(); ST.refresh();
  }

  /* ---------- white-label playground ---------- */
  var pn = $('#pg-n');
  if (pn) {
    var state = { name: pn.value, accent: '#C2461C', domain: $('#pg-d').value };
    var live = function () {
      $$('[data-bname-live]').forEach(function (e) { e.textContent = state.name; });
      paint(state.name, state.accent); $('#pg-url').textContent = state.domain;
    };
    pn.addEventListener('input', function () { var v = pn.value.trim(), e = $('#pg-e'); e.hidden = !!v; e.textContent = v ? '' : 'Give your product a name — even a working title.'; pn.setAttribute('aria-invalid', !v); if (v) { state.name = v; live(); } });
    $('#pg-d').addEventListener('input', function () { state.domain = $('#pg-d').value.trim() || 'work.youragency.com'; live(); });
    $$('[data-sw]').forEach(function (b) { b.addEventListener('click', function () { state.accent = b.getAttribute('data-sw'); $$('[data-sw]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); live(); }); });
    $('#pg-reset').addEventListener('click', function () { state = { name: 'Ordwell', accent: '#C2461C', domain: 'work.fernhill-digital.in' }; pn.value = 'Ordwell'; $('#pg-d').value = state.domain; $$('[data-sw]').forEach(function (x, i) { x.setAttribute('aria-pressed', i === 0); }); live(); });
    $('#pg-go').addEventListener('click', function () {
      if (!state.name) { pn.focus(); return; }
      try { OW.store.load(); OW.store.commit('Branded from the website', function (S) { S.brand.name = state.name; S.brand.accent = state.accent; if (/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(state.domain)) { S.brand.domain = state.domain.toLowerCase(); S.brand.domainState = 'verified'; } S.brand.sender = state.name; }); } catch (e) { }
      location.href = 'index.html#/settings/brand';
    });
  }

  /* ---------- templates strip / gallery ---------- */
  function art(t) { var h = '<div class="art" style="--h:' + t.hue + '" aria-hidden="true">'; t.tasks.slice(0, 7).forEach(function (r, i) { h += '<span style="left:' + (6 + r[2] * 2) + '%;width:' + Math.max(6, r[3] * 2.6) + '%;top:' + (18 + i * 17) + 'px;opacity:' + (0.4 + i * 0.08) + '"></span>'; }); return h + '</div>'; }
  function card(t, full) {
    return '<article class="tc" data-cat="' + esc(t.cat) + '">' + art(t) + '<div class="bd"><small>' + esc(t.cat) + ' · used by ' + new Intl.NumberFormat('en-IN').format(t.uses) + ' teams</small><h3>' + esc(t.name) + '</h3><p>' + esc(t.blurb) + '</p><div class="tags"><span class="tg">' + t.tasks.length + ' tasks</span><span class="tg">' + t.statuses.length + ' statuses</span>' + (t.fields.length ? '<span class="tg">' + t.fields.length + ' fields' + (t.fields.some(function (f) { return f[1] === 'formula'; }) ? ' · formula' : '') + '</span>' : '') + '<span class="tg">' + t.autos.length + ' automation' + (t.autos.length > 1 ? 's' : '') + '</span></div>' +
      (full ? '<div class="go"><a class="btn sm pri" href="index.html#/templates?use=' + t.id + '">Use it in the app</a><button type="button" class="btn sm" data-prev="' + t.id + '" aria-expanded="false">What’s inside</button></div><div class="inside" hidden></div>' : '') + '</div></article>';
  }
  var strip = $('#tpl-strip'); if (strip && OW.TEMPLATES) strip.innerHTML = OW.TEMPLATES.slice(0, 4).map(function (t) { return card(t, false); }).join('');
  var gal = $('#tpl-gal');
  if (gal && OW.TEMPLATES) {
    var draw = function (cat) { gal.innerHTML = OW.TEMPLATES.filter(function (t) { return !cat || t.cat === cat; }).map(function (t) { return card(t, true); }).join(''); };
    draw('');
    $$('[data-cat-f]').forEach(function (b) { b.addEventListener('click', function () { $$('[data-cat-f]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); draw(b.getAttribute('data-cat-f')); }); });
    gal.addEventListener('click', function (e) {
      var b = e.target.closest('[data-prev]'); if (!b) return; var t = OW.TEMPLATES.filter(function (x) { return x.id === b.getAttribute('data-prev'); })[0], box = b.closest('.bd').querySelector('.inside');
      var open = box.hidden; box.hidden = !open; b.setAttribute('aria-expanded', open); b.textContent = open ? 'Hide details' : 'What’s inside';
      if (open) box.innerHTML = '<div style="border-top:1px solid var(--line);margin-top:14px;padding-top:12px;font-size:13.5px"><b style="font-size:12px;color:var(--faint)">STATUSES</b><p style="margin:4px 0 10px">' + t.statuses.map(function (s) { return esc(s[0]); }).join(' → ') + '</p>' + (t.fields.length ? '<b style="font-size:12px;color:var(--faint)">FIELDS</b><p style="margin:4px 0 10px">' + t.fields.map(function (f) { return esc(f[0]) + (f[3] ? ' = <span class="mono">' + esc(f[3]) + '</span>' : ''); }).join(' · ') + '</p>' : '') + '<b style="font-size:12px;color:var(--faint)">FIRST TASKS</b><ol style="margin:4px 0 10px 18px;padding:0">' + t.tasks.slice(0, 5).map(function (r) { return '<li>' + esc(r[0]) + ' <span class="muted">· day ' + (r[2] + 1) + '</span></li>'; }).join('') + '</ol><b style="font-size:12px;color:var(--faint)">AUTOMATIONS</b>' + t.autos.map(function (a) { return '<p style="margin-top:4px">⚡ ' + esc(a) + '</p>'; }).join('') + '</div>';
    });
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
