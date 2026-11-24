/* Ordwell — UI toolkit: icons, formatting, avatars/pills, popovers & menus, pickers (status, people, date,
   priority, option), dialogs, toasts, delegated actions. CSP-safe: no inline handlers anywhere. */
(function () {
  'use strict';
  var OW = window.OW, UI = OW.UI = {};
  var Q = OW.Q, D = OW.D;

  var P = {
    home: 'M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z',
    inbox: 'M3 13h5l1.5 3h5L16 13h5M5.5 5h13L21 13v5.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5V13z',
    board: 'M4.5 4h4v16h-4zM10.5 4h4v10h-4zM16.5 4h3v7h-3z',
    list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
    table: 'M3.5 4.5h17v15h-17zM3.5 9.5h17M3.5 14.5h17M9.5 4.5v15',
    timeline: 'M4 4v16M7.5 7h8M10.5 12h9M7.5 17h6',
    calendar: 'M4 6h16v14H4zM4 10h16M8 3.5v4M16 3.5v4',
    workload: 'M3.5 20h17M6.5 16V10M11 16V5.5M15.5 16v-4M20 16V8.5',
    doc: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
    dash: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
    form: 'M5 3.5h14v17H5zM8.5 8h7M8.5 12h7M8.5 16h4',
    bolt: 'M13 3 5 13.5h6L10 21l8-10.5h-6z',
    template: 'M4 4h16v6H4zM4 14h7v6H4zM15 14h5v6h-5z',
    settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
    plus: 'M12 5v14M5 12h14', minus: 'M5 12h14',
    chd: 'm6 9 6 6 6-6', chr: 'm9 6 6 6-6 6', chl: 'm15 6-6 6 6 6', chu: 'm6 15 6-6 6 6',
    x: 'M6 6l12 12M18 6 6 18', check: 'm5 12.5 4.5 4.5L19 7.5',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2',
    play: 'M7 4.5v15l13-7.5z', pause: 'M8 5v14M16 5v14', stop: 'M6.5 6.5h11v11h-11z',
    flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c.9-3.8 3.8-6 7.5-6s6.6 2.2 7.5 6',
    users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.7-3.4 3.2-5.5 6.5-5.5s5.8 2.1 6.5 5.5M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.7 3.1 2.6 3.5 5.2',
    tag: 'M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3-8.7 8.7zM8 8h.01',
    clip: 'm20 11.5-8.2 8.2a5 5 0 0 1-7.1-7.1l8.6-8.6a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8',
    link: 'M10 13.5a4.5 4.5 0 0 0 6.4.4l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.4 1.4M14 10.5a4.5 4.5 0 0 0-6.4-.4l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.4-1.4',
    at: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1',
    msg: 'M4 5h16v11H9l-5 4z',
    filter: 'M4 5h16l-6 7.5V19l-4 1.5v-8z',
    sort: 'M7 4v16M3.5 16.5 7 20l3.5-3.5M17 20V4M13.5 7.5 17 4l3.5 3.5',
    group: 'M4 5h16M4 12h10M4 19h6',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    star: 'm12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z',
    archive: 'M3.5 4.5h17v4h-17zM5 8.5v11h14v-11M10 12.5h4',
    trash: 'M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13',
    undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11', redo: 'M15 14l5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13',
    eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
    globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z',
    sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4',
    moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
    spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
    arr: 'M5 12h14M13 6l6 6-6 6',
    grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
    sub: 'M6 4v9a3 3 0 0 0 3 3h9M15 13l3 3-3 3',
    copy: 'M8 8h12v12H8zM16 8V4H4v12h4',
    upload: 'M12 15V4M7.5 8.5 12 4l4.5 4.5M4.5 15v5h15v-5',
    download: 'M12 4v11M7.5 10.5 12 15l4.5-4.5M4.5 15v5h15v-5',
    bell: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
    target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 12h.01',
    layers: 'm12 3 9 5-9 5-9-5zM3 13l9 5 9-5',
    folder: 'M3.5 6.5a1 1 0 0 1 1-1h5l2 2.5h8a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z',
    hash: 'M5 9h15M4 15h15M10 3.5 8 20.5M16 3.5l-2 17',
    blocked: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.6 5.6l12.8 12.8',
    dep: 'M4 6h6a4 4 0 0 1 4 4v4a4 4 0 0 0 4 4h2M17 15l3 3-3 3',
    fx: 'M9.5 20c2 0 2.5-1.5 3-4l2-10c.5-2.5 1-3.5 3-3.5M7.5 9.5h9',
    sel: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 10.5 12 14l3.5-3.5',
    text: 'M5 6V4.5h14V6M12 4.5v15M9 19.5h6',
    cbox: 'M4.5 4.5h15v15h-15zM8 12l3 3 5-6',
    menu: 'M4 7h16M4 12h16M4 17h16',
    side: 'M3.5 4.5h17v15h-17zM9.5 4.5v15',
    expand: 'M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7',
    reply: 'M10 9 5 13.5 10 18M5 13.5h9a5 5 0 0 0 5-5V6',
    logout: 'M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10',
    image: 'M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15 9h.01',
    refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6',
    diamond: 'm12 3 9 9-9 9-9-9z',
    brush: 'M14.5 4.5l5 5L10 19l-5.5 1 1-5.5zM12.5 6.5l5 5',
    shield: 'M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6z',
    keyb: 'M3 6.5h18v11H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
    db: 'M12 9c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
    mail: 'M3.5 5.5h17v13h-17zM4 6l8 6.5L20 6',
    quote: 'M7 7h4v4c0 3-1.5 5-4 6M14 7h4v4c0 3-1.5 5-4 6',
    h1: 'M4 5v14M12 5v14M4 12h8M16.5 9.5 19 8v11', h2: 'M4 5v14M12 5v14M4 12h8M15.5 10a2 2 0 1 1 3.5 1.5l-3.5 4.5h4',
    bullet: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01', numbered: 'M10 6h10M10 12h10M10 18h10M4 5l1.5-1v5M3.5 14.5a1.5 1.5 0 1 1 2.5 1.2L3.5 19h3',
    hr: 'M4 12h16', callout: 'M4 4.5h16v15H4zM8 9h.01M11 9h5M8 13h8',
    focus: 'M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'
  };
  UI.P = P;
  UI.I = function (n, cls) { var fill = n === 'play'; return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true"' + (fill ? ' style="fill:currentColor;stroke:none"' : '') + (n === 'more' || n === 'grip' ? ' stroke-width="2.6"' : '') + '><path d="' + (P[n] || P.spark) + '"/></svg>'; };
  var I = UI.I;

  /* ---------- formatting ---------- */
  var esc = UI.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var nf = new Intl.NumberFormat('en-IN');
  UI.inr = function (n) { n = Math.round(+n || 0); return (n < 0 ? '−₹' : '₹') + nf.format(Math.abs(n)); };
  UI.inrS = function (n) { n = +n || 0; var a = Math.abs(n), s = n < 0 ? '−₹' : '₹'; if (a >= 1e7) return s + (a / 1e7).toFixed(a >= 1e8 ? 0 : 2).replace(/\.?0+$/, '') + ' Cr'; if (a >= 1e5) return s + (a / 1e5).toFixed(a >= 1e6 ? 1 : 2).replace(/\.?0+$/, '') + ' L'; return s + nf.format(Math.round(a)); };
  UI.n = function (n) { return nf.format(Math.round(n * 10) / 10); };
  UI.hm = function (mins) { mins = Math.round(mins); var h = Math.floor(mins / 60), m = mins % 60; return h ? h + 'h' + (m ? ' ' + m + 'm' : '') : m + 'm'; };
  UI.clock = function (ms) { var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60; return (h ? h + ':' : '') + (m < 10 && h ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x; };
  UI.fmtField = function (f, v) {
    if (v == null || v === '') return '';
    if (f.type === 'number' || (f.type === 'formula' && typeof v === 'number')) {
      if (f.fmt === 'inr') return UI.inr(v); if (f.fmt === 'pct') return UI.n(v) + '%'; return UI.n(v);
    }
    if (f.type === 'check') return v ? 'Yes' : 'No';
    if (f.type === 'people') { var u = Q.user(v); return u ? u.name : ''; }
    if (f.type === 'date') return D.fmt(v);
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    return String(v);
  };
  UI.initials = function (name) { var p = name.split(' '); return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase(); };
  UI.PRI = ['No priority', 'Low', 'Medium', 'High', 'Urgent'];
  UI.CAT = { backlog: 'var(--c-backlog)', todo: 'var(--c-todo)', active: 'var(--c-active)', review: 'var(--c-review)', review2: 'var(--c-review2)', done: 'var(--c-done)', blocked: 'var(--c-blocked)' };

  /* ---------- atoms ---------- */
  UI.av = function (id, size) {
    if (id === 'bot' || id == null) return '<span class="av bot' + (size ? ' ' + size : '') + '" title="Automation">' + I('bolt', 's') + '</span>';
    var u = Q.user(id); if (!u) return '';
    return '<span class="av' + (size ? ' ' + size : '') + '" style="--h:' + u.hue + '" title="' + esc(u.name) + '" aria-hidden="true">' + UI.initials(u.name) + '</span>';
  };
  UI.avs = function (ids, max, size) {
    max = max || 3; var h = '<span class="avs">';
    ids.slice(0, max).forEach(function (id) { h += UI.av(id, size); });
    if (ids.length > max) h += '<span class="av more' + (size ? ' ' + size : '') + '">+' + (ids.length - max) + '</span>';
    return h + '</span>';
  };
  UI.sdot = function (st) { return '<span class="sdot" data-cat="' + st.cat + '" style="--c:' + UI.CAT[st.cat] + '"></span>'; };
  UI.pill = function (t, tag) { var st = Q.status(t); tag = tag || 'span'; return '<' + tag + ' class="pill" style="--c:' + UI.CAT[st.cat] + '"' + (tag === 'button' ? ' type="button" data-act="pick-status" data-id="' + t.id + '" aria-label="Status: ' + esc(st.name) + '"' : '') + '>' + UI.sdot(st) + esc(st.name) + '</' + tag + '>'; };
  UI.prio = function (p) { return '<span class="prio" data-p="' + p + '" title="' + UI.PRI[p] + '" role="img" aria-label="Priority: ' + UI.PRI[p] + '"><i></i><i></i><i></i></span>'; };
  UI.due = function (t, long) {
    if (!t.due) return '';
    var n = D.diff(D.today(), t.due), cls = Q.isDone(t) ? '' : n < 0 ? 'over' : n === 0 ? 'today' : '';
    if (Q.isDone(t)) return '<span class="due">' + I('calendar', 's') + D.fmt(t.due) + '</span>';
    return '<span class="due ' + cls + '">' + I('calendar', 's') + (long && Math.abs(n) > 1 ? D.fmt(t.due) + ' · ' : '') + D.rel(t.due) + '</span>';
  };
  UI.tag = function (t) { return '<span class="tag' + (t === 'client-visible' ? ' cv' : '') + '">' + (t === 'client-visible' ? I('eye', 's') : '') + esc(t) + '</span>'; };
  UI.pdot = function (p) { return '<span class="pdot" style="--h:' + p.hue + '"></span>'; };

  /* ---------- delegated actions ---------- */
  var acts = UI.acts = {};
  UI.act = function (name, fn) { acts[name] = fn; };
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
    var fn = acts[el.getAttribute('data-act')]; if (!fn) return;
    if (el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href').charAt(0) !== '#') return;
    e.preventDefault(); fn(el, e);
  });
  document.addEventListener('change', function (e) {
    var el = e.target.closest('[data-change]'); if (!el) return; var fn = acts[el.getAttribute('data-change')]; if (fn) fn(el, e);
  });
  document.addEventListener('input', function (e) {
    var el = e.target.closest('[data-input]'); if (!el) return; var fn = acts[el.getAttribute('data-input')]; if (fn) fn(el, e);
  });

  /* ---------- popovers ---------- */
  var openPop = null;
  UI.closePop = function () { if (openPop) { var p = openPop; openPop = null; p.el.remove(); if (p.onClose) p.onClose(); if (p.anchor && p.anchor.setAttribute) { p.anchor.setAttribute('aria-expanded', 'false'); if (p.refocus !== false && document.body.contains(p.anchor)) try { p.anchor.focus({ preventScroll: true }); } catch (e) { } } } };
  UI.pop = function (anchor, html, opts) {
    opts = opts || {}; UI.closePop();
    var el = document.createElement('div'); el.className = 'pop ' + (opts.cls || ''); el.setAttribute('role', opts.role || 'dialog');
    el.innerHTML = html; document.body.appendChild(el);
    var r = anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : anchor, w = el.offsetWidth, h = el.offsetHeight;
    var x = opts.alignRight ? r.right - w : r.left, y = r.bottom + 6;
    if (x + w > innerWidth - 8) x = innerWidth - w - 8; if (x < 8) x = 8;
    if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - 6);
    el.style.left = x + 'px'; el.style.top = y + 'px';
    openPop = { el: el, anchor: anchor, onClose: opts.onClose, refocus: opts.refocus };
    if (anchor.setAttribute) anchor.setAttribute('aria-expanded', 'true');
    var f = el.querySelector('input,[autofocus]') || el.querySelector('.mi,button'); if (f && !opts.noFocus) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) { } }, 10);
    return el;
  };
  document.addEventListener('pointerdown', function (e) { if (openPop && !openPop.el.contains(e.target) && !(openPop.anchor.contains && openPop.anchor.contains(e.target))) { openPop.refocus = false; UI.closePop(); } }, true);
  document.addEventListener('keydown', function (e) {
    if (!openPop) return;
    if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); UI.closePop(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      var items = Array.prototype.slice.call(openPop.el.querySelectorAll('.mi:not([hidden])')); if (!items.length) return;
      e.preventDefault(); var i = items.indexOf(document.activeElement); i = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length; items[i].focus();
    }
    if (e.key === 'Enter' && document.activeElement && document.activeElement.closest('.pop .ps')) {
      var first = openPop.el.querySelector('.mi:not([hidden])'); if (first) { e.preventDefault(); first.click(); }
    }
  }, true);
  addEventListener('resize', function () { UI.closePop(); });

  /* menu: items = [{label, icon, kbd, checked, danger, sep, head, hint, html, fn}] */
  UI.menu = function (anchor, items, opts) {
    opts = opts || {};
    var h = opts.search ? '<div class="ps"><input type="text" placeholder="' + esc(opts.search) + '" aria-label="' + esc(opts.search) + '" data-ms></div>' : '';
    items.forEach(function (it, i) {
      if (it.sep) { h += '<div class="msep"></div>'; return; }
      if (it.head) { h += '<div class="mh">' + esc(it.head) + '</div>'; return; }
      h += '<button type="button" class="mi' + (it.danger ? ' danger' : '') + '" data-mi="' + i + '" role="menuitem' + (it.checked != null ? 'checkbox' : '') + '"' + (it.checked != null ? ' aria-checked="' + !!it.checked + '"' : '') + ' data-s="' + esc((it.label || '').toLowerCase()) + '">' +
        (it.checked != null ? '<svg class="ic ck" viewBox="0 0 24 24" aria-hidden="true"><path d="' + P.check + '"/></svg>' : '') +
        (it.html || '') + (it.icon ? I(it.icon) : '') + '<span class="sp">' + esc(it.label) + '</span>' + (it.hint ? '<small class="faint">' + esc(it.hint) + '</small>' : '') + (it.kbd ? '<kbd>' + esc(it.kbd) + '</kbd>' : '') + '</button>';
    });
    var el = UI.pop(anchor, h, { role: 'menu', alignRight: opts.alignRight, cls: opts.cls, onClose: opts.onClose });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-mi]'); if (!b) return; var it = items[+b.getAttribute('data-mi')];
      if (opts.keepOpen) { it.fn && it.fn(b); if (it.checked != null) { it.checked = !it.checked; b.setAttribute('aria-checked', it.checked); } return; }
      UI.closePop(); it.fn && it.fn(b);
    });
    var s = el.querySelector('[data-ms]');
    if (s) s.addEventListener('input', function () { var q = s.value.toLowerCase(); el.querySelectorAll('.mi').forEach(function (m) { m.hidden = q && m.getAttribute('data-s').indexOf(q) < 0; }); });
    return el;
  };

  /* ---------- pickers ---------- */
  UI.pickStatus = function (anchor, t, cb) {
    var p = Q.project(t.project);
    UI.menu(anchor, p.statuses.map(function (s, i) { return { label: s.name, html: UI.sdot(s), checked: s.id === t.status, kbd: String(i + 1), fn: function () { cb(s.id); } }; }));
  };
  UI.pickPeople = function (anchor, current, cb, opts) {
    opts = opts || {}; var sel = current.slice();
    var users = OW.store.S.users.filter(function (u) { return opts.guests || u.role !== 'guest'; });
    if (opts.project) { var pr = Q.project(opts.project); if (pr) users = users.filter(function (u) { return pr.members.indexOf(u.id) > -1; }); }
    var items = users.map(function (u) { return { label: u.name, hint: u.title.split(',')[0], html: UI.av(u.id, 's'), checked: sel.indexOf(u.id) > -1, fn: function () {
      if (opts.single) { cb(u.id); return; }
      var i = sel.indexOf(u.id); if (i > -1) sel.splice(i, 1); else sel.push(u.id);
    } }; });
    if (opts.single && opts.clear) items.unshift({ label: 'Nobody', icon: 'x', fn: function () { cb(null); } });
    UI.menu(anchor, items, { search: 'Search people…', keepOpen: !opts.single, onClose: opts.single ? null : function () { if (sel.join() !== current.join()) cb(sel); } });
  };
  UI.pickPriority = function (anchor, cur, cb) {
    UI.menu(anchor, [4, 3, 2, 1, 0].map(function (p) { return { label: UI.PRI[p], html: UI.prio(p), checked: cur === p, kbd: String(4 - p + 1), fn: function () { cb(p); } }; }));
  };
  UI.pickOption = function (anchor, options, cur, cb, clear) {
    var items = options.map(function (o) { return { label: o, checked: o === cur, fn: function () { cb(o); } }; });
    if (clear) items.push({ sep: true }, { label: 'Clear', icon: 'x', fn: function () { cb(null); } });
    UI.menu(anchor, items, { search: options.length > 6 ? 'Filter…' : '' });
  };
  UI.pickTags = function (anchor, cur, cb) {
    var all = {}; OW.store.S.tasks.forEach(function (t) { t.tags.forEach(function (g) { all[g] = 1; }); });
    var sel = cur.slice();
    var el = UI.menu(anchor, Object.keys(all).sort().map(function (g) { return { label: g, checked: sel.indexOf(g) > -1, fn: function () { var i = sel.indexOf(g); if (i > -1) sel.splice(i, 1); else sel.push(g); } }; }),
      { search: 'Find or create a tag…', keepOpen: true, onClose: function () { if (sel.slice().sort().join() !== cur.slice().sort().join()) cb(sel); } });
    var inp = el.querySelector('[data-ms]');
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && inp.value.trim() && !el.querySelector('.mi:not([hidden])')) { e.preventDefault(); e.stopPropagation(); var v = inp.value.trim().toLowerCase().replace(/\s+/g, '-'); if (sel.indexOf(v) < 0) sel.push(v); UI.closePop(); }
    }, true);
  };
  UI.pickDate = function (anchor, cur, cb, opts) {
    opts = opts || {};
    var view = cur || D.today(), vd = D.parse(view), ym = [vd.getFullYear(), vd.getMonth()];
    function grid() {
      var first = new Date(ym[0], ym[1], 1, 12), start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
      var h = '<div style="padding:8px 8px 4px;width:252px"><div style="display:flex;align-items:center;margin-bottom:6px"><b style="flex:1;font-size:13px;font-weight:600">' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][ym[1]] + ' ' + ym[0] + '</b>' +
        '<button type="button" class="ibtn" data-dp="-1" aria-label="Previous month">' + I('chl') + '</button><button type="button" class="ibtn" data-dp="1" aria-label="Next month">' + I('chr') + '</button></div>' +
        '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;font-size:11px;color:var(--faint);margin-bottom:2px"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">';
      for (var i = 0; i < 42; i++) {
        var d = new Date(start); d.setDate(start.getDate() + i); var s = OW.dateUtil.iso(d), inM = d.getMonth() === ym[1], isT = s === D.today(), isC = s === cur;
        h += '<button type="button" data-dd="' + s + '" aria-label="' + D.fmt(s, 'long') + '" style="height:32px;border-radius:6px;font-size:12.5px;font-variant-numeric:tabular-nums;' + (isC ? 'background:var(--accent);color:var(--on-accent);font-weight:600;' : isT ? 'color:var(--accent-ink);font-weight:700;box-shadow:inset 0 0 0 1px var(--accent-line);' : '') + (inM ? '' : 'color:var(--line-3);') + '">' + d.getDate() + '</button>';
      }
      return h + '</div></div>';
    }
    var quick = [['Today', 0], ['Tomorrow', 1], ['Next Monday', ((8 - D.dow(D.today())) % 7) || 7], ['In a week', 7]];
    function render() {
      return '<div style="display:flex;gap:4px;flex-wrap:wrap;padding:6px 8px 2px">' + quick.map(function (q) { return '<button type="button" class="chip" data-dq="' + q[1] + '">' + q[0] + '</button>'; }).join('') + '</div>' + grid() +
        (cur ? '<div class="msep"></div><button type="button" class="mi" data-dclear>' + I('x') + '<span class="sp">Clear date</span></button>' : '');
    }
    var el = UI.pop(anchor, render(), { noFocus: true });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-dp')) { ym[1] += +b.getAttribute('data-dp'); if (ym[1] < 0) { ym[1] = 11; ym[0]--; } if (ym[1] > 11) { ym[1] = 0; ym[0]++; } el.innerHTML = render(); return; }
      if (b.hasAttribute('data-dd')) { UI.closePop(); cb(b.getAttribute('data-dd')); }
      if (b.hasAttribute('data-dq')) { UI.closePop(); cb(D.add(D.today(), +b.getAttribute('data-dq'))); }
      if (b.hasAttribute('data-dclear')) { UI.closePop(); cb(null); }
    });
  };

  /* ---------- dialogs ---------- */
  UI.dialog = function (o) {
    var d = document.createElement('dialog'); d.className = 'dlg' + (o.wide ? ' wide' : '');
    d.setAttribute('aria-labelledby', 'dlg-t');
    d.innerHTML = '<div class="dlg-h"><h2 id="dlg-t">' + esc(o.title) + '</h2><button type="button" class="ibtn" data-dx aria-label="Close">' + I('x') + '</button></div>' +
      '<div class="dlg-b">' + (o.body || '') + '</div>' + (o.foot === false ? '' : '<div class="dlg-f">' + (o.footLeft || '') + '<span class="sp"></span><button type="button" class="btn ghost" data-dx>' + (o.cancel || 'Cancel') + '</button>' + (o.ok ? '<button type="button" class="btn pri" data-dok>' + esc(o.ok) + '</button>' : '') + '</div>');
    document.body.appendChild(d);
    function close() { try { d.close(); } catch (e) { } d.remove(); if (o.onClose) o.onClose(); }
    d.addEventListener('click', function (e) {
      if (e.target === d) { close(); return; }
      if (e.target.closest('[data-dx]')) close();
      if (e.target.closest('[data-dok]')) { if (!o.onOk || o.onOk(d) !== false) close(); }
    });
    d.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && o.onOk) { e.preventDefault(); if (o.onOk(d) !== false) close(); } });
    d.showModal(); if (o.onMount) o.onMount(d, close);
    var f = d.querySelector('[autofocus]'); if (f) f.focus();
    return { el: d, close: close };
  };
  UI.confirm = function (title, body, ok, fn, danger) {
    UI.dialog({ title: title, body: '<p style="color:var(--muted);line-height:1.6">' + body + '</p>', ok: ok, onOk: function () { fn(); }, onMount: function (d) { if (danger) d.querySelector('[data-dok]').style.background = 'var(--bad)'; } });
  };

  /* ---------- toasts ---------- */
  var tw = null;
  UI.toast = function (text, o) {
    o = o || {};
    if (!tw) { tw = document.createElement('div'); tw.className = 'toasts'; tw.setAttribute('role', 'status'); tw.setAttribute('aria-live', 'polite'); document.body.appendChild(tw); }
    var t = document.createElement('div'); t.className = 'toast';
    t.innerHTML = (o.icon ? I(o.icon) : '') + '<span>' + text + '</span>' + (o.undo ? '<button type="button" data-tu>Undo <kbd style="background:transparent;border-color:#4A4740;color:#B8B3A9;box-shadow:none;margin-left:4px">⌘Z</kbd></button>' : '') + (o.action ? '<button type="button" data-ta>' + esc(o.action.label) + '</button>' : '');
    tw.appendChild(t); while (tw.children.length > 3) tw.firstChild.remove();
    var timer = setTimeout(kill, o.ms || 5200);
    function kill() { clearTimeout(timer); t.classList.add('out'); setTimeout(function () { t.remove(); }, 220); }
    t.addEventListener('click', function (e) {
      if (e.target.closest('[data-tu]')) { OW.app.undo(); kill(); }
      if (e.target.closest('[data-ta]')) { o.action.fn(); kill(); }
    });
    return t;
  };

  /* long-press drags on touch: block page scroll while a drag is armed */
  document.addEventListener('touchmove', function (e) { if (UI.dragLock) e.preventDefault(); }, { passive: false });

  /* ---------- misc ---------- */
  UI.contrastOn = function (hex) {
    var c = hex.replace('#', ''); if (c.length === 3) c = c.split('').map(function (x) { return x + x; }).join('');
    var r = parseInt(c.substr(0, 2), 16) / 255, g = parseInt(c.substr(2, 2), 16) / 255, b = parseInt(c.substr(4, 2), 16) / 255;
    function L(v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    var lum = 0.2126 * L(r) + 0.7152 * L(g) + 0.0722 * L(b);
    return (1.05 / (lum + 0.05)) >= 4.5 ? '#FFFFFF' : '#1B1A17';
  };
  UI.reduced = function () { return matchMedia('(prefers-reduced-motion: reduce)').matches; };
  UI.vt = function (fn) {
    if (!document.startViewTransition || UI.reduced()) { fn(); return; }
    try { document.startViewTransition(fn); } catch (e) { fn(); }
  };
  UI.fileIcon = function (a) { var hue = { pdf: 4, fig: 280, video: 330, image: 150, sheet: 140, doc: 220 }[a.kind] || 30; return '<span class="fi" style="--h:' + hue + '">' + esc((a.name.split('.').pop() || '').slice(0, 4)) + '</span>'; };
  UI.kb = function (kb) { return kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB'; };
})();
