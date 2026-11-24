/* Revv back-office shell: sidebar with counts, top bar, hash routes, Cmd+K palette, slide-over, "⋯" menus,
   dialogs, toasts with Undo and the 375 px bottom tab bar. The dealer app and the admin both build on it. */
(function () {
  'use strict';
  var d = document, $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var P = {
    home: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10', phone: 'M6.6 3.5h3l1.4 4.2-2 1.3a11 11 0 0 0 6 6l1.3-2 4.2 1.4v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z',
    board: 'M4 4.5h4.5v15H4zM10 4.5h4.5v10H10zM16 4.5h4v7h-4z', stock: 'M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16zM3.5 8 12 12.5 20.5 8M12 12.5v8', cal: 'M4 6.5h16v13H4zM4 10.5h16M8 4v4M16 4v4',
    chat: 'M4 5.5h16v10.5H9l-5 4z', rupee: 'M7 5h10M7 9h10M9.5 5a4 4 0 0 1 0 8H7l7 6', shield: 'M12 3.5 19 6v6c0 4.2-3 7-7 8.5C8 19 5 16.2 5 12V6z', id: 'M4 5.5h16v13H4zM8 14.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-2.5 3c.5-1.6 1.4-2.4 2.5-2.4s2 .8 2.5 2.4M13 10h4.5M13 13.5h3',
    users: 'M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11zm-5.5 8c.6-3 2.8-4.7 5.5-4.7s4.9 1.7 5.5 4.7M16 5a3 3 0 0 1 0 6M17.5 14.6c1.6.6 2.6 2 3 4.4', pulse: 'M3 12h4l2.5-6 4 12 2.5-6h5',
    search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.8-4.8', plus: 'M12 5v14M5 12h14', more: 'M5.5 12h.01M12 12h.01M18.5 12h.01', x: 'M6 6l12 12M18 6 6 18', check: 'M5 12.5l4.2 4.2L19 7',
    arrow: 'M5 12h14M13 6l6 6-6 6', ext: 'M14 4h6v6M20 4l-9 9M18 14v5.5H4.5V6H10', menu: 'M4 7h16M4 12h16M4 17h16', clock: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 7.5V12l3 2', doc: 'M6 3.5h8l4 4v13H6zM14 3.5v4h4M9 12h6M9 15.5h6',
    flag: 'M5 21V4h11l-2 4 2 4H5', alert: 'M12 4 21 19.5H3zM12 10v4M12 17v.01', bike: 'M5.5 17.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm13 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5.5 14.5l4-6h4l2 3h-6M13.5 8.5 12 5.5h3', down: 'M12 5v14M6 13l6 6 6-6', tag: 'M3.5 12 12 3.5h8.5V12L12 20.5zM16 8h.01',
    undo: 'M9 7 4 12l5 5M4 12h11a5 5 0 0 1 0 10h-2', out: 'M14 4h5.5v16H14M10 8l-4 4 4 4M6 12h9', bolt: 'M13 3 5 13.5h6L10 21l8-10.5h-6z', print: 'M7 9V3.5h10V9M7 17.5H4.5v-8h15v8H17M7 14h10v6.5H7z'
  };
  function ic(n, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (P[n] || '') + '"/></svg>'; }
  function spark(vals, w, h) {
    w = w || 84; h = h || 22; if (!vals || !vals.length) return ''; var mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals), rg = mx - mn || 1;
    var pts = vals.map(function (v, i) { return (i / (vals.length - 1) * (w - 2) + 1).toFixed(1) + ',' + (h - 2 - (v - mn) / rg * (h - 4)).toFixed(1); });
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><polygon class="ar" points="1,' + h + ' ' + pts.join(' ') + ' ' + (w - 1) + ',' + h + '"/><polyline points="' + pts.join(' ') + '"/></svg>';
  }
  function initials(n) { return String(n || '?').split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); }
  function ago(t) { var m = Math.round((Date.now() - t) / 60000); if (m < 1) return 'now'; if (m < 60) return m + 'm'; var h = Math.round(m / 60); if (h < 24) return h + 'h'; var dd = Math.round(h / 24); return dd < 30 ? dd + 'd' : Math.round(dd / 30) + 'mo'; }

  var cfg = null, cur = null, side, view, crumb, tabs;
  var BO = window.BO = { ic: ic, esc: esc, spark: spark, initials: initials, ago: ago, $: $, $$: $$ };

  /* ---------- routing ---------- */
  BO.route = function () { var h = location.hash.replace(/^#\/?/, ''), q = {}, p = h.split('?'); (p[1] || '').split('&').forEach(function (kv) { if (!kv) return; var a = kv.split('='); q[decodeURIComponent(a[0])] = decodeURIComponent(a[1] || ''); }); return { id: p[0] || cfg.home, q: q }; };
  BO.go = function (id, q) { var s = '#/' + id + (q ? '?' + Object.keys(q).filter(function (k) { return q[k] != null && q[k] !== ''; }).map(function (k) { return k + '=' + encodeURIComponent(q[k]); }).join('&') : ''); if (location.hash === s) BO.render(); else location.hash = s; };
  BO.render = function (keepScroll) {
    var r = BO.route(), v = cfg.views[r.id]; if (!v) { r.id = cfg.home; v = cfg.views[r.id]; }
    var changed = !cur || cur.id !== r.id; cur = r;
    $$('[data-nav]').forEach(function (a) { if (a.getAttribute('data-nav') === r.id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    var item = cfg.flat[r.id] || {}; crumb.innerHTML = '<span class="hide-m">' + esc(cfg.section) + '</span><span class="hide-m" aria-hidden="true">/</span><b>' + esc(item.label || '') + '</b>';
    d.title = (item.label || '') + ' · ' + cfg.title;
    var y = scrollY; view.innerHTML = ''; v(view, r.q); BO.counts();
    if (changed && !keepScroll) { scrollTo(0, 0); view.focus({ preventScroll: true }); } else if (keepScroll) scrollTo(0, y);
    side.classList.remove('open');
  };
  BO.refresh = function () { BO.render(true); };

  /* ---------- counts in the nav and tabs ---------- */
  BO.counts = function () { var c = cfg.counts ? cfg.counts() : {}; $$('[data-ct]').forEach(function (e) { var k = e.getAttribute('data-ct'), v = c[k]; e.textContent = v || ''; e.hidden = !v; e.classList.toggle('hot', !!(cfg.hot && cfg.hot.indexOf(k) > -1 && v)); }); };

  /* ---------- toasts with undo ---------- */
  BO.toast = function (html, o) {
    o = o || {}; var box = $('#toasts'), t = d.createElement('div'); t.className = 'toast'; t.innerHTML = '<span>' + html + '</span>';
    if (o.undo) { var u = d.createElement('button'); u.type = 'button'; u.textContent = 'Undo'; u.addEventListener('click', function () { o.undo(); kill(); BO.toast('Undone.'); }); t.appendChild(u); }
    box.appendChild(t); var tm = setTimeout(kill, o.ms || (o.undo ? 6500 : 3800));
    function kill() { clearTimeout(tm); if (t.parentNode) t.parentNode.removeChild(t); }
    return kill;
  };

  /* ---------- "⋯" menu ---------- */
  var openMenu = null;
  BO.menu = function (anchor, items) {
    BO.closeMenu(); var m = d.createElement('div'); m.className = 'menu'; m.setAttribute('role', 'menu');
    items.forEach(function (it) {
      if (it === '-') { m.appendChild(Object.assign(d.createElement('div'), { className: 'sep' })); return; }
      var b = d.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); if (it.danger) b.className = 'danger';
      b.innerHTML = (it.icon ? ic(it.icon) : '') + '<span>' + esc(it.label) + '</span>' + (it.kb ? '<kbd class="kb">' + esc(it.kb) + '</kbd>' : '');
      b.addEventListener('click', function () { BO.closeMenu(); it.run(); }); m.appendChild(b);
    });
    d.body.appendChild(m); var r = anchor.getBoundingClientRect(), w = m.offsetWidth, h = m.offsetHeight;
    var x = Math.min(innerWidth - w - 8, Math.max(8, r.right - w)), y = r.bottom + 4; if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - 4);
    m.style.left = x + 'px'; m.style.top = y + 'px'; openMenu = { m: m, a: anchor }; anchor.setAttribute('aria-expanded', 'true');
    var f = m.querySelector('button'); if (f) f.focus();
  };
  BO.closeMenu = function () { if (!openMenu) return; openMenu.a.setAttribute('aria-expanded', 'false'); openMenu.m.remove(); var a = openMenu.a; openMenu = null; return a; };
  d.addEventListener('mousedown', function (e) { if (openMenu && !openMenu.m.contains(e.target) && !openMenu.a.contains(e.target)) BO.closeMenu(); });
  d.addEventListener('keydown', function (e) {
    if (!openMenu) return; var bs = $$('button', openMenu.m), i = bs.indexOf(d.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); var a = BO.closeMenu(); if (a) a.focus(); } else if (e.key === 'ArrowDown') { e.preventDefault(); bs[(i + 1) % bs.length].focus(); } else if (e.key === 'ArrowUp') { e.preventDefault(); bs[(i - 1 + bs.length) % bs.length].focus(); }
  });

  /* ---------- slide-over ---------- */
  var so = null;
  BO.slide = function (o) {
    BO.closeSlide(true); var opener = d.activeElement;
    var bg = d.createElement('div'); bg.className = 'so-bg'; var p = d.createElement('aside'); p.className = 'so'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('aria-labelledby', 'so-t'); p.tabIndex = -1;
    p.innerHTML = '<div class="so-h">' + (o.head || '') + '<h2 id="so-t">' + esc(o.title) + '</h2>' + (o.actions || '') + '<button type="button" class="ib" data-so-x aria-label="Close panel" title="Close (Esc)">' + ic('x') + '</button></div><div class="so-b"></div>' + (o.foot ? '<div class="so-f"></div>' : '');
    d.body.appendChild(bg); d.body.appendChild(p); var body = $('.so-b', p); if (typeof o.body === 'function') o.body(body); else body.innerHTML = o.body || '';
    if (o.foot) { var f = $('.so-f', p); if (typeof o.foot === 'function') o.foot(f); else f.innerHTML = o.foot; }
    requestAnimationFrame(function () { bg.classList.add('on'); p.classList.add('on'); });
    so = { p: p, bg: bg, opener: opener, onClose: o.onClose }; bg.addEventListener('click', function () { BO.closeSlide(); }); $('[data-so-x]', p).addEventListener('click', function () { BO.closeSlide(); });
    setTimeout(function () { p.focus({ preventScroll: true }); }, reduce ? 0 : 60);
    return p;
  };
  BO.closeSlide = function (quick) {
    if (!so) return; var s = so; so = null; s.p.classList.remove('on'); s.bg.classList.remove('on'); if (s.onClose) s.onClose();
    setTimeout(function () { s.p.remove(); s.bg.remove(); }, quick || reduce ? 0 : 280); if (!quick && s.opener && d.contains(s.opener)) try { s.opener.focus({ preventScroll: true }); } catch (e) {}
  };
  BO.slideOpen = function () { return so && so.p; };

  /* ---------- dialog (previews before bulk changes, confirmations) ---------- */
  BO.dialog = function (o) {
    var w = d.createElement('div'); w.className = 'dlg'; var opener = d.activeElement;
    w.innerHTML = '<div class="dlg-b" role="dialog" aria-modal="true" aria-labelledby="dlg-t"><h2 id="dlg-t">' + esc(o.title) + '</h2><div class="c">' + (o.html || '') + '</div><div class="f"><button type="button" class="btn" data-d="no">' + esc(o.cancel || 'Cancel') + '</button><button type="button" class="btn pri" data-d="ok">' + esc(o.ok || 'Confirm') + '</button></div></div>';
    d.body.appendChild(w); var close = function () { w.remove(); if (opener) try { opener.focus(); } catch (e) {} };
    w.addEventListener('click', function (e) { var b = e.target.closest('[data-d]'); if (e.target === w || (b && b.dataset.d === 'no')) close(); else if (b && b.dataset.d === 'ok') { close(); o.run && o.run(w); } });
    w.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
    setTimeout(function () { $('[data-d="ok"]', w).focus(); }, 30);
  };

  /* ---------- command palette (Cmd/Ctrl + K) ---------- */
  BO.palette = function () {
    if ($('.pal')) return; var opener = d.activeElement, w = d.createElement('div'); w.className = 'pal';
    w.innerHTML = '<div class="pal-b" role="dialog" aria-modal="true" aria-label="Search and jump"><label class="sr" for="pal-i">Search</label><input id="pal-i" type="text" autocomplete="off" placeholder="' + esc(cfg.searchHint || 'Search or jump to…') + '" role="combobox" aria-expanded="true" aria-controls="pal-l"><ul class="pal-l" id="pal-l" role="listbox"></ul><div class="pal-f"><span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div></div>';
    d.body.appendChild(w); var inp = $('input', w), list = $('ul', w), items = [], sel = 0;
    function close() { w.remove(); try { opener && opener.focus(); } catch (e) {} }
    function draw() {
      var q = inp.value.trim().toLowerCase(), nav = Object.keys(cfg.flat).map(function (k) { return { g: 'Go to', label: cfg.flat[k].label, icon: cfg.flat[k].icon, run: function () { BO.go(k); } }; });
      var acts = (cfg.actions || []).map(function (a) { return { g: 'Actions', label: a.label, icon: a.icon || 'plus', kb: a.kb, run: a.run }; });
      var found = q ? (cfg.search ? cfg.search(q) : []) : [];
      items = nav.concat(acts).filter(function (x) { return !q || x.label.toLowerCase().indexOf(q) > -1; }).concat(found).slice(0, 14); sel = Math.min(sel, Math.max(0, items.length - 1));
      var g = null; list.innerHTML = items.length ? items.map(function (x, i) { var h = x.g !== g ? '<li class="g" role="presentation">' + esc(x.g) + '</li>' : ''; g = x.g; return h + '<li role="presentation"><button type="button" role="option" data-i="' + i + '" aria-selected="' + (i === sel) + '">' + ic(x.icon || 'arrow') + '<span>' + esc(x.label) + '</span>' + (x.sub ? '<small>' + esc(x.sub) + '</small>' : x.kb ? '<small>' + esc(x.kb) + '</small>' : '') + '</button></li>'; }).join('')
        : '<li class="g" role="presentation">Nothing matches “' + esc(q) + '”. Try a buyer, a bike or a car.</li>';
    }
    function run(i) { var x = items[i]; if (!x) return; close(); x.run(); }
    inp.addEventListener('input', function () { sel = 0; draw(); });
    w.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); } else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(items.length - 1, sel + 1); draw(); } else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); } else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
    });
    w.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) run(+b.dataset.i); else if (e.target === w) close(); });
    draw(); inp.focus();
  };

  /* ---------- build the shell ---------- */
  BO.init = function (c) {
    cfg = c; cfg.flat = {}; c.nav.forEach(function (g) { g.items.forEach(function (it) { cfg.flat[it.id] = it; }); });
    var app = $('#app');
    app.innerHTML = '<aside class="bo-side" id="side" aria-label="' + esc(c.section) + ' navigation">' +
      '<a class="bo-brand" href="#/' + c.home + '"><svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="4" fill="#FF5B1F"/><path d="M8 24V8h9a5 5 0 0 1 1.6 9.7L23 24h-4.4l-3.9-6H12v6zM12 14.5h4.6a1.75 1.75 0 0 0 0-3.5H12z" fill="#0A0B0D"/></svg><span><b>REVV</b><small>' + esc(c.section) + '</small></span></a>' +
      (c.switcher ? '<button type="button" class="bo-switch" id="bo-sw" aria-haspopup="menu" aria-expanded="false"></button>' : '') +
      '<button type="button" class="bo-search" data-pal>' + ic('search') + '<span>Search or jump to…</span><kbd>⌘K</kbd></button>' +
      '<nav class="bo-nav" aria-label="Sections">' + c.nav.map(function (g) { return (g.group ? '<p class="bo-grp">' + esc(g.group) + '</p>' : '') + g.items.map(function (it) { return it.href ? '<a class="bo-nv" href="' + it.href + '">' + ic(it.icon) + '<span>' + esc(it.label) + '</span>' + ic('ext') + '</a>' : '<a class="bo-nv" href="#/' + it.id + '" data-nav="' + it.id + '">' + ic(it.icon) + '<span>' + esc(it.label) + '</span><span class="ct" data-ct="' + it.id + '" hidden></span></a>'; }).join(''); }).join('') + '</nav>' +
      '<div class="bo-sfoot">' + (c.foot || '') + '<div class="bo-me"><span class="av">' + esc(initials(c.user.name)) + '</span><span><b>' + esc(c.user.name) + '</b><small>' + esc(c.user.role) + '</small></span></div></div></aside>' +
      '<div class="bo-main"><header class="bo-top"><button type="button" class="ib bo-mobile-brand" id="bo-menu" aria-label="Open navigation" aria-controls="side" aria-expanded="false">' + ic('menu') + '</button><nav class="bo-crumb" aria-label="Breadcrumb" id="crumb"></nav>' +
      '<div class="bo-topr"><span class="bo-live" title="Updates arrive from the marketplace in real time"><i aria-hidden="true"></i>Live</span>' +
      '<button type="button" class="ib bo-tsearch" data-pal aria-label="Search">' + ic('search') + '</button>' + (c.topActions || '') + '</div></header>' +
      '<main class="bo-view" id="view" tabindex="-1"></main></div>' +
      '<nav class="bo-tabs" aria-label="Sections">' + c.tabs.map(function (id) { var it = id === 'more' ? { label: 'More', icon: 'menu' } : cfg.flat[id]; return id === 'more' ? '<button type="button" id="bo-more">' + ic('menu') + '<span>More</span></button>' : '<a href="#/' + id + '" data-nav="' + id + '">' + ic(it.icon) + '<span>' + esc(it.short || it.label) + '</span><span class="ct" data-ct="' + id + '" hidden></span></a>'; }).join('') + '</nav>';
    side = $('#side'); view = $('#view'); crumb = $('#crumb'); tabs = $('.bo-tabs');
    var sw = $('#bo-sw'); if (sw) { var drawSw = function () { var s = c.switcher(); sw.innerHTML = '<span class="av sq sig">' + esc(initials(s.label)) + '</span><span><b>' + esc(s.label) + '</b><small>' + esc(s.sub) + '</small></span>' + ic('down'); }; drawSw(); BO.drawSwitch = drawSw;
      sw.addEventListener('click', function () { var s = c.switcher(); BO.menu(sw, s.options.map(function (o) { return { label: o.label + (o.id === s.value ? '  ✓' : ''), run: function () { s.pick(o.id); drawSw(); BO.render(); BO.toast('Switched to ' + esc(o.label) + '.'); } }; })); }); }
    $$('[data-pal]').forEach(function (b) { b.addEventListener('click', BO.palette); });
    var mb = $('#bo-menu'); mb.addEventListener('click', function () { var o = side.classList.toggle('open'); mb.setAttribute('aria-expanded', o); if (o) { var f = $('.bo-nv', side); if (f) f.focus(); } });
    var more = $('#bo-more'); if (more) more.addEventListener('click', function () { side.classList.add('open'); mb.setAttribute('aria-expanded', 'true'); var f = $('.bo-nv', side); if (f) f.focus(); });
    d.addEventListener('click', function (e) { if (side.classList.contains('open') && !side.contains(e.target) && !e.target.closest('#bo-menu,#bo-more')) side.classList.remove('open'); });
    d.addEventListener('keydown', function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || '')) || e.target.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); BO.palette(); return; }
      if (e.key === 'Escape') { if ($('.pal') || $('.dlg') || openMenu) return; if (so) { e.preventDefault(); BO.closeSlide(); return; } if (side.classList.contains('open')) { side.classList.remove('open'); mb.focus(); } return; }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') { e.preventDefault(); BO.palette(); return; }
      if (c.keys && c.keys[e.key] && !so && !$('.pal') && !$('.dlg')) { e.preventDefault(); c.keys[e.key](); }
    });
    addEventListener('hashchange', function () { BO.closeSlide(true); BO.render(); });
    if (!location.hash) history.replaceState(null, '', '#/' + c.home);
    BO.render();
  };
})();
