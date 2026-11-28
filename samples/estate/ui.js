/* Fieldwise — UI kit: icons, chips, router, drawer, modal, toast with undo, palette, map and chart renderers. */
(function () {
  'use strict';
  var CK = window.CK, esc = CK.esc;

  /* ---------- icons (one set: 24 grid, 1.6 stroke, round joins) ---------- */
  var P = {
    home: '<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>',
    users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8"/><path d="M15.5 5.6a3 3 0 0 1 0 5.8M17.5 14.6c1.6.6 2.7 2.1 3 4.4"/>',
    phone: '<path d="M6.6 3.8h2.6l1.4 4-1.9 1.3a11 11 0 0 0 6.2 6.2l1.3-1.9 4 1.4v2.6a1.8 1.8 0 0 1-2 1.8A15.6 15.6 0 0 1 4.8 5.8a1.8 1.8 0 0 1 1.8-2z"/>',
    building: '<path d="M5 20V5.5A1.5 1.5 0 0 1 6.5 4h7A1.5 1.5 0 0 1 15 5.5V20M15 10h3.5a1.5 1.5 0 0 1 1.5 1.5V20M3 20h18"/><path d="M8.5 8h3M8.5 11.5h3M8.5 15h3"/>',
    shield: '<path d="M12 3.5 19 6v5.5c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8"/>',
    deal: '<path d="m11 17 2 2a1.4 1.4 0 0 0 2-2"/><path d="m14 14 2.5 2.5a1.4 1.4 0 0 0 2-2L15 11l-1.5 1.5a1.8 1.8 0 0 1-2.5-2.5L13.8 7.2a2.4 2.4 0 0 1 3 0l3.7 3.4"/><path d="M3.5 10.6 8 6.2l2.5.8M3.5 10.6l5.5 5.6a1.4 1.4 0 0 0 2-2"/>',
    key: '<circle cx="8" cy="14.5" r="4"/><path d="m11 11.5 8.5-8.5M16 6.5l2.5 2.5M14 8.5l2 2"/>',
    partner: '<circle cx="7" cy="7.5" r="2.6"/><circle cx="17" cy="7.5" r="2.6"/><circle cx="12" cy="17" r="2.6"/><path d="M9 9.3l1.8 5.4M15 9.3l-1.8 5.4M9.6 7.5h4.8"/>',
    print: '<path d="M7 9V4h10v5M7 17H5a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 5 9h14a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 19 17h-2"/><path d="M7 14h10v6H7z"/>',
    chart: '<path d="M4 4v16h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
    activity: '<path d="M3.5 12h4l2.5-6 4 12 2.5-6h4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.2M12 18.8V21M4.2 7.5l1.9 1.1M17.9 15.4l1.9 1.1M4.2 16.5l1.9-1.1M17.9 8.6l1.9-1.1"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    right: '<path d="m9.5 6 6 6-6 6"/>', left: '<path d="m14.5 6-6 6 6 6"/>', down: '<path d="m6 9.5 6 6 6-6"/>', up: '<path d="m6 14.5 6-6 6 6"/>',
    more: '<circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/>',
    chat: '<path d="M4 19.5 5.3 16A7.5 7.5 0 1 1 8 18.7z"/><path d="M9 10.5h6M9 13.5h4"/>',
    cal: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
    camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.5-2h5.4l1.5 2h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.3"/>',
    pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    nav: '<path d="m4 11 16-7-7 16-2-7z"/>',
    star: '<path d="m12 4 2.4 5 5.3.6-4 3.6 1.1 5.3L12 15.8l-4.8 2.7 1.1-5.3-4-3.6 5.3-.6z"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    bookmark: '<path d="M7 4h10v16l-5-3.5L7 20z"/>',
    sun: '<circle cx="12" cy="12" r="3.8"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
    moon: '<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"/>',
    bell: '<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z"/><path d="M10 20.5h4"/>',
    arrow: '<path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5"/>',
    file: '<path d="M7 3.5h7L18.5 8v12.5h-11.5z"/><path d="M14 3.5V8h4.5M9.5 13h5M9.5 16.5h5"/>',
    rupee: '<path d="M7 5h10M7 9h10M10 5c4 0 4 8 0 8H7l7 6"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>', pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>', skip: '<path d="M6 6v12l8.5-6zM17.5 6v12"/>',
    undo: '<path d="M9 7 5 11l4 4"/><path d="M5 11h9a5 5 0 0 1 0 10h-2"/>',
    spark: '<path d="M12 3.5 13.8 10 20.5 12l-6.7 2L12 20.5 10.2 14 3.5 12l6.7-2z"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    grip: '<circle cx="9" cy="7" r="1"/><circle cx="15" cy="7" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="17" r="1"/><circle cx="15" cy="17" r="1"/>',
    offline: '<path d="M3 4l18 16M8.5 9.5a7 7 0 0 0-3.3 2M2 8.6A12 12 0 0 1 6 6.3M17.5 12.6a7 7 0 0 0-2-1.5M22 8.6a12 12 0 0 0-8.5-3.5M9 15.8a3.5 3.5 0 0 1 4.7-.3"/><circle cx="12" cy="19" r=".8"/>',
    flag: '<path d="M5.5 21V4M5.5 4.5h11l-2 4 2 4h-11"/>',
    edit: '<path d="m4.5 19.5 1-4L15.8 5.2a2 2 0 0 1 2.9 0l.1.1a2 2 0 0 1 0 2.9L8.5 18.5z"/><path d="M13.5 7.5 16.5 10.5"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
    ext: '<path d="M14 4.5h5.5V10M19.5 4.5 11 13M17 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 4 18.5v-10A1.5 1.5 0 0 1 5.5 7H10"/>',
    layers: '<path d="m12 4 8.5 4.5L12 13 3.5 8.5z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5"/>',
    sliders: '<path d="M5 6h9M18 6h1M5 12h3M12 12h7M5 18h11M20 18h-1"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    door: '<path d="M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21M3.5 21h17"/><circle cx="14.5" cy="12.5" r=".9"/>',
    list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r=".9"/><circle cx="4.8" cy="12" r=".9"/><circle cx="4.8" cy="17.5" r=".9"/>',
    board: '<rect x="3.5" y="4.5" width="5" height="15" rx="1.3"/><rect x="10" y="4.5" width="5" height="10" rx="1.3"/><rect x="16.5" y="4.5" width="4" height="12" rx="1.3"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r=".8"/>',
    heart: '<path d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10z"/>',
    thumbsdown: '<path d="M8 4.5h8.3a2 2 0 0 1 2 1.6l1.2 6a2 2 0 0 1-2 2.4H14l.7 3.4a1.8 1.8 0 0 1-3.2 1.4L8 14.5zM8 4.5H4.5v10H8"/>',
    upload: '<path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9M4.5 15v3.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V15"/>',
    logout: '<path d="M14 4.5h4.5A1.5 1.5 0 0 1 20 6v12a1.5 1.5 0 0 1-1.5 1.5H14M10 16.5 5.5 12 10 7.5M5.5 12H15"/>',
    sparkles: '<path d="M9 4.5 10.3 9 15 10.3 10.3 11.6 9 16 7.7 11.6 3 10.3 7.7 9zM17 13.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    command: '<path d="M9 6.5a2.5 2.5 0 1 0-2.5 2.5H9zm0 0v11m0-8.5h6m-6 6h6m0-8.5a2.5 2.5 0 1 1 2.5 2.5H15zm0 0v11m0 0a2.5 2.5 0 1 1-2.5-2.5H15zm-6 0a2.5 2.5 0 1 1-2.5-2.5H9z"/>'
  };
  CK.ic = function (n, s, cls) { return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" width="' + (s || 16) + '" height="' + (s || 16) + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || P.spark) + '</svg>'; };
  var ic = CK.ic;

  /* ---------- small building blocks ---------- */
  CK.h = function (sel) { return document.querySelector(sel); };
  CK.ph = function (name, thumb) { return 'photos/' + (thumb ? 't/' : '') + name + '.webp'; };
  CK.av = function (who, size) { // agent / owner / lead / partner avatar
    if (!who) return '';
    var hue = who.hue != null ? who.hue : (hash(who.name) % 360);
    return '<span class="av' + (size ? ' av-' + size : '') + '" style="--h:' + hue + '" aria-hidden="true">' + esc(CK.initials(who.name)) + '</span>';
  };
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  CK.hash = hash;
  CK.chipLead = function (L, extra) { if (!L) return ''; return '<button type="button" class="chip" data-peek="lead:' + L.id + '">' + CK.av(L) + '<span>' + esc(L.name) + '</span>' + (extra ? '<span class="chip-x">' + extra + '</span>' : '') + '</button>'; };
  CK.chipProp = function (p, extra) { if (!p) return ''; return '<button type="button" class="chip chip-p" data-peek="prop:' + p.id + '"><img src="' + CK.ph(p.photos[0], 1) + '" alt="" width="22" height="22" loading="lazy" decoding="async"><span class="mono">' + p.code + '</span><span class="chip-x">' + esc(CK.area(p.area).short) + (extra ? ' · ' + extra : '') + '</span></button>'; };
  CK.chipAgent = function (a) { if (!a) return ''; return '<span class="chip chip-s">' + CK.av(a, 's') + '<span>' + esc(a.name.split(' ')[0]) + '</span></span>'; };
  CK.chipOwner = function (o) { if (!o) return ''; return '<button type="button" class="chip" data-peek="owner:' + o.id + '">' + CK.av(o) + '<span>' + esc(o.name) + '</span></button>'; };
  CK.chipDeal = function (d) { if (!d) return ''; return '<button type="button" class="chip" data-peek="deal:' + d.id + '"><span class="mono">' + d.id + '</span>' + CK.dealPill(d) + '</button>'; };
  CK.chipTrip = function (t) { if (!t) return ''; return '<a class="chip" href="#/trips/' + t.id + '">' + ic('route', 14) + '<span class="mono">' + t.id + '</span>' + CK.tripPill(t) + '</a>'; };
  CK.pill = function (txt, tone) { return '<span class="pill' + (tone ? ' t-' + tone : '') + '">' + esc(txt) + '</span>'; };
  CK.stagePill = function (L) { var tone = { new: 'accent', contacted: 'blue', requirement: 'blue', matched: 'violet', visit: 'amber', deal: 'green', lost: 'grey' }[L.stage]; return CK.pill(CK.stageLabel(L.stage), tone); };
  CK.dealPill = function (d) { var tone = { shortlist: 'grey', negotiation: 'amber', token: 'accent', agreement: 'violet', movein: 'blue', registry: 'blue', closed: 'green', lost: 'grey' }[d.stage]; return CK.pill(CK.DEAL_LABEL[d.stage], tone); };
  CK.tripPill = function (t) { var m = { planned: ['Planned', 'blue'], out: ['Out now', 'live'], done: ['Done', 'green'], waiting: ['Waiting', 'amber'], cancelled: ['Cancelled', 'grey'] }[t.status]; return CK.pill(m[0], m[1]); };
  CK.verPill = function (p) { var v = CK.ver(p), a = CK.verAge(p); var m = { pending: ['Not verified', 'amber'], fresh: ['Verified · ' + a + 'd', 'green'], due: ['Check due', 'amber'], overdue: ['Overdue · ' + a + 'd', 'red'], rejected: ['Rejected', 'red'] }[v]; return '<span class="pill t-' + m[1] + '">' + (v === 'fresh' ? ic('shield', 12) : '') + esc(m[0]) + '</span>'; };
  CK.statusPill = function (p) { var m = { available: ['Available', 'green'], hold: ['On hold', 'amber'], blocked: ['Blocked · token', 'accent'], let: ['Let out', 'grey'], sold: ['Sold', 'grey'], inactive: ['Inactive', 'grey'] }[p.status]; return CK.pill(m[0], m[1]); };
  CK.ring = function (v, size) { size = size || 30; var r = size / 2 - 3, c = 2 * Math.PI * r, tone = v >= 70 ? 'var(--ok)' : v >= 45 ? 'var(--warn)' : 'var(--bad)'; return '<span class="ring" style="width:' + size + 'px;height:' + size + 'px" title="Listing freshness ' + v + '/100"><svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" aria-hidden="true"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="3"/><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + tone + '" stroke-width="3" stroke-linecap="round" stroke-dasharray="' + (c * v / 100).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/></svg><b>' + v + '</b></span>'; };
  CK.score = function (s) { var tone = s >= 85 ? 'hi' : s >= 70 ? 'mid' : 'lo'; return '<span class="score s-' + tone + '">' + s + '<small>%</small></span>'; };
  CK.stepper = function (steps, cur, opts) { // steps: [{id,label}] cur: index
    opts = opts || {};
    return '<ol class="stepper' + (opts.compact ? ' compact' : '') + '" aria-label="' + esc(opts.label || 'Progress') + '">' + steps.map(function (s, i) { var st = i < cur ? 'done' : i === cur ? 'cur' : ''; return '<li class="' + st + '"' + (i === cur ? ' aria-current="step"' : '') + '><span class="dot">' + (i < cur ? ic('check', 12) : i + 1) + '</span><span class="lbl">' + esc(s.label) + '</span></li>'; }).join('') + '</ol>';
  };
  CK.empty = function (title, body, action) { return '<div class="empty"><svg class="empty-art" viewBox="0 0 120 64" width="120" height="64" aria-hidden="true"><path d="M10 52C32 52 34 22 60 26s32 22 46-6" fill="none" stroke="var(--route)" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 6"/><circle cx="10" cy="52" r="5" fill="var(--ink)"/><path d="M106 24c-4-5-7-8-7-12a7 7 0 1 1 14 0c0 4-3 7-7 12z" fill="var(--ink)"/><circle cx="106" cy="12" r="2.6" fill="var(--paper)"/></svg><p class="empty-t">' + esc(title) + '</p><p class="muted">' + esc(body) + '</p>' + (action || '') + '</div>'; };
  CK.kv = function (rows) { return '<dl class="kv">' + rows.filter(Boolean).map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>'; };

  /* ---------- toast with undo ---------- */
  CK.toast = function (msg, opts) {
    opts = opts || {}; var host = document.getElementById('toasts'); if (!host) return;
    var el = document.createElement('div'); el.className = 'toast' + (opts.tone ? ' t-' + opts.tone : ''); el.setAttribute('role', 'status');
    el.innerHTML = '<span>' + (opts.icon ? ic(opts.icon, 16) : ic('check', 16)) + CK.bt(esc(msg)) + '</span>' + (opts.undo ? '<button type="button" class="tbtn">' + ic('undo', 14) + 'Undo</button>' : '');
    host.appendChild(el); while (host.children.length > 3) host.removeChild(host.firstChild); requestAnimationFrame(function () { el.classList.add('on'); });
    var done = function () { el.classList.remove('on'); setTimeout(function () { el.remove(); }, 220); };
    if (opts.undo) el.querySelector('.tbtn').addEventListener('click', function () { opts.undo(); done(); CK.toast('Undone', { icon: 'undo' }); });
    setTimeout(done, opts.undo ? 6000 : 3200);
  };

  /* ---------- modal ---------- */
  var lastFocus = null;
  CK.modal = function (html, opts) {
    opts = opts || {}; CK.closeModal();
    lastFocus = document.activeElement;
    var m = document.createElement('div'); m.className = 'modal-wrap'; m.id = 'modal';
    m.innerHTML = '<div class="modal-bg" data-close-modal></div><div class="modal' + (opts.wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="modal-t">' + CK.bt(html) + '</div>';
    document.body.appendChild(m); requestAnimationFrame(function () { m.classList.add('on'); });
    var f = m.querySelector('[autofocus], input, select, textarea, button:not([data-close-modal])'); if (f) f.focus();
    return m.querySelector('.modal');
  };
  CK.closeModal = function () { var m = document.getElementById('modal'); if (m) { m.remove(); if (lastFocus && lastFocus.focus) lastFocus.focus(); } };
  CK.confirm = function (title, body, yes, fn, tone) {
    var m = CK.modal('<h2 id="modal-t">' + esc(title) + '</h2><p class="muted">' + esc(body) + '</p><div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ' + (tone || 'primary') + '" id="m-yes">' + esc(yes) + '</button></div>');
    m.querySelector('#m-yes').addEventListener('click', function () { CK.closeModal(); fn(); });
  };

  /* ---------- menu (popover) ---------- */
  CK.menu = function (anchor, items, onPick) {
    CK.closeMenu();
    var m = document.createElement('div'); m.className = 'menu'; m.id = 'menu'; m.setAttribute('role', 'menu');
    m.innerHTML = items.map(function (it, i) { if (it === '-') return '<hr>'; if (it.head) return '<div class="menu-h">' + esc(it.head) + '</div>'; return '<button type="button" role="menuitem" data-i="' + i + '"' + (it.on ? ' aria-checked="true"' : '') + '>' + (it.html || ((it.icon ? ic(it.icon, 15) : '') + '<span>' + esc(it.label) + '</span>')) + (it.on ? ic('check', 14, 'mck') : '') + (it.hint ? '<small>' + esc(it.hint) + '</small>' : '') + '</button>'; }).join('');
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect(), mw = m.offsetWidth, mh = m.offsetHeight;
    var left = Math.min(r.left, innerWidth - mw - 8), top = r.bottom + 6; if (top + mh > innerHeight - 8) top = Math.max(8, r.top - mh - 6);
    m.style.left = Math.max(8, left) + 'px'; m.style.top = top + 'px';
    m.addEventListener('click', function (e) { var b = e.target.closest('button[data-i]'); if (!b) return; CK.closeMenu(); onPick(items[+b.dataset.i]); });
    var first = m.querySelector('button'); if (first) first.focus();
    m.addEventListener('keydown', function (e) { var bs = [].slice.call(m.querySelectorAll('button')), i = bs.indexOf(document.activeElement); if (e.key === 'ArrowDown') { e.preventDefault(); bs[(i + 1) % bs.length].focus(); } if (e.key === 'ArrowUp') { e.preventDefault(); bs[(i - 1 + bs.length) % bs.length].focus(); } if (e.key === 'Escape') { CK.closeMenu(); anchor.focus(); } });
    setTimeout(function () { document.addEventListener('click', outside, true); }, 0);
    function outside(e) { if (!m.contains(e.target)) { CK.closeMenu(); document.removeEventListener('click', outside, true); } }
  };
  CK.closeMenu = function () { var m = document.getElementById('menu'); if (m) m.remove(); };

  /* ---------- router ---------- */
  CK.V = {};
  CK.route = function () {
    var h = location.hash.replace(/^#\/?/, ''), peek = null, i = h.indexOf('~');
    if (i >= 0) { var pk = h.slice(i + 1).split(':'); peek = { kind: pk[0], id: pk[1] }; h = h.slice(0, i); }
    var parts = h.split('/').filter(Boolean);
    return { view: parts[0] || 'today', id: parts[1] || null, sub: parts[2] || null, peek: peek, base: '#/' + parts.join('/') };
  };
  CK.go = function (hash) { if (location.hash === hash) CK.render(); else location.hash = hash; };
  CK.peek = function (kind, id) { var r = CK.route(); var base = r.base === '#/' ? '#/today' : r.base; location.hash = base + (kind ? '~' + kind + ':' + id : ''); };

  /* ---------- palette (⌘K) ---------- */
  CK.palette = function () {
    var S = CK.S();
    var m = CK.modal('<div class="pal"><label class="sr" for="pal-q">Search Fieldwise</label><div class="pal-in">' + ic('search', 18) + '<input id="pal-q" autocomplete="off" placeholder="Search leads, homes, owners, deals — or type a command" autofocus><kbd>Esc</kbd></div><div class="pal-list" id="pal-list" role="listbox"></div><div class="pal-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span class="muted">Try “3 bhk gk”, “plan trip”, “dark”</span></div></div>', { wide: true });
    m.classList.add('pal-modal');
    var q = m.querySelector('#pal-q'), list = m.querySelector('#pal-list'), sel = 0, items = [];
    var cmds = [
      { t: 'Plan a trip', s: 'Command', ic: 'route', go: '#/trips/new' }, { t: 'Start a calling session', s: 'Command', ic: 'phone', go: '#/calling' },
      { t: 'Add a lead', s: 'Command', ic: 'plus', fn: function () { CK.newLeadForm(); } }, { t: 'Add a listing', s: 'Command', ic: 'building', fn: function () { CK.newPropForm(); } },
      { t: 'Open the verification desk', s: 'Command', ic: 'shield', go: '#/verify' }, { t: 'Build a print issue', s: 'Command', ic: 'print', go: '#/print' },
      { t: 'Switch theme (light / dark)', s: 'Command', ic: 'moon', fn: function () { CK.toggleTheme(); } }, { t: 'Take the guided tour', s: 'Command', ic: 'sparkles', fn: function () { CK.tour(0); } },
      { t: 'Open the field app', s: 'Command', ic: 'phone', href: 'field.html' }, { t: 'Open the map', s: 'Command', ic: 'pin', go: '#/map' }, { t: 'Import a listing sheet (PDF)', s: 'Command', ic: 'upload', go: '#/import' }, { t: 'Start owner check calls', s: 'Command', ic: 'target', go: '#/survey/focus' }, { t: 'Open conversations', s: 'Command', ic: 'chat', go: '#/inbox' }, { t: 'Invite a teammate', s: 'Command', ic: 'users', go: '#/team' }, { t: 'Search rankings', s: 'Command', ic: 'search', go: '#/seo' }, { t: 'Start fresh', s: 'Command', ic: 'undo', fn: function () { CK.confirm('Start fresh?', 'Every lead, trip and deal goes back to how the day started.', 'Start fresh', function () { CK.reset(); CK.toast('Started fresh'); }); } }
    ];
    if (window.FWB) cmds.push({ t: window.FWB.on ? 'Your brokerage: change the name or copy your link' : 'See it as your brokerage', s: 'Command', ic: 'sparkles', fn: function () { window.FWB.open(); } });
    ['admin', 'manager', 'telecaller', 'field', 'partner'].forEach(function (r) { cmds.push({ t: 'View as ' + CK.ROLE_NAME[r], s: 'Role', ic: 'eye', fn: function () { CK.setRole(r); } }); });
    function run() {
      var v = q.value.trim().toLowerCase(), out = [];
      var words = v.split(/\s+/).filter(Boolean);
      function hit(txt) { txt = txt.toLowerCase(); return words.every(function (w) { return txt.indexOf(w) >= 0; }); }
      cmds.forEach(function (c) { if (!v || hit(c.t)) out.push(c); });
      if (v) {
        S.leads.forEach(function (L) { if (hit(L.name + ' ' + L.id + ' ' + L.req.bhk.join(' ') + ' bhk ' + L.req.sectors.map(function (s) { return CK.area(s).name + ' ' + CK.area(s).short; }).join(' ') + ' ' + L.src)) out.push({ t: L.name, s: L.id + ' · ' + CK.stageLabel(L.stage) + ' · ' + L.req.bhk.join('/') + ' BHK · ' + CK.budget(L), av: L, peek: 'lead:' + L.id }); });
        S.props.forEach(function (p) { if (hit(p.code + ' ' + p.addr + ' ' + CK.area(p.area).short + ' ' + p.bhk + ' bhk ' + p.type + ' ' + p.deal)) out.push({ t: p.code + ' · ' + CK.cfg(p), s: CK.area(p.area).name + ' · ' + CK.price(p), img: p.photos[0], peek: 'prop:' + p.id }); });
        S.owners.forEach(function (o) { if (hit(o.name + ' owner')) out.push({ t: o.name, s: 'Owner · ' + S.props.filter(function (p) { return p.ownerId === o.id; }).length + ' listings', av: o, peek: 'owner:' + o.id }); });
        S.deals.forEach(function (d) { if (hit(d.id + ' ' + CK.lead(d.lead).name + ' deal')) out.push({ t: d.id + ' · ' + CK.lead(d.lead).name, s: 'Deal · ' + CK.DEAL_LABEL[d.stage], ic: 'deal', peek: 'deal:' + d.id }); });
        S.trips.forEach(function (t) { if (hit(t.id + ' trip ' + CK.agent(t.agent).name)) out.push({ t: t.id + ' · ' + CK.agent(t.agent).name, s: 'Trip · ' + CK.dayLabel(t.start) + ' · ' + t.stops.length + ' stops', ic: 'route', go: '#/trips/' + t.id }); });
      }
      items = out.slice(0, 40); sel = 0; draw();
    }
    function draw() {
      list.innerHTML = items.length ? items.map(function (it, i) { return '<button type="button" role="option" class="pal-it' + (i === sel ? ' on' : '') + '" data-i="' + i + '" aria-selected="' + (i === sel) + '">' + (it.av ? CK.av(it.av) : it.img ? '<img src="' + CK.ph(it.img, 1) + '" alt="" width="28" height="28">' : '<span class="pal-ic">' + ic(it.ic || 'spark', 16) + '</span>') + '<span class="pal-t">' + esc(it.t) + '<small>' + esc(it.s) + '</small></span>' + (i === sel ? '<kbd>↵</kbd>' : '') + '</button>'; }).join('') : '<p class="pal-none">Nothing matches “' + esc(q.value) + '”. Try a colony, a code like VV-108, or a name.</p>';
      var on = list.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest' });
    }
    function exec(it) { if (!it) return; CK.closeModal(); if (it.fn) it.fn(); else if (it.href) location.href = it.href; else if (it.go) CK.go(it.go); else if (it.peek) { var k = it.peek.split(':'); CK.peek(k[0], k[1]); } }
    q.addEventListener('input', run);
    q.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(items.length - 1, sel + 1); draw(); } else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); } else if (e.key === 'Enter') { e.preventDefault(); exec(items[sel]); } });
    list.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) exec(items[+b.dataset.i]); });
    run();
  };

  /* ---------- maps (stylised, drawn) ---------- */
  var BASE = {};
  function pts(r, arr) { return arr.map(function (ll) { var p = CK.xy({ lat: ll[0], lng: ll[1] }, r); return p[0].toFixed(0) + ',' + p[1].toFixed(0); }); }
  function smooth(r, arr) { var p = arr.map(function (ll) { return CK.xy({ lat: ll[0], lng: ll[1] }, r); }); var d = 'M' + p[0][0].toFixed(0) + ' ' + p[0][1].toFixed(0); for (var i = 1; i < p.length; i++) { var a = p[i - 1], b = p[i], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; d += ' Q' + a[0].toFixed(0) + ' ' + a[1].toFixed(0) + ' ' + mx.toFixed(0) + ' ' + my.toFixed(0); } var l = p[p.length - 1]; return d + ' T' + l[0].toFixed(0) + ' ' + l[1].toFixed(0); }
  function base(r) {
    if (BASE[r]) return BASE[r];
    var R = CK.REGIONS[r], s = '';
    s += '<defs><pattern id="blk-' + r + '" width="46" height="92" patternUnits="userSpaceOnUse"><rect x="6" y="6" width="34" height="34" rx="4" class="m-blk"/><rect x="29" y="52" width="34" height="34" rx="4" class="m-blk"/><rect x="-17" y="52" width="34" height="34" rx="4" class="m-blk"/></pattern></defs>';
    s += '<rect x="-800" y="-800" width="' + (R.w + 1600) + '" height="' + (R.h + 1600) + '" class="m-bg"/><rect x="-800" y="-800" width="' + (R.w + 1600) + '" height="' + (R.h + 1600) + '" fill="url(#blk-' + r + ')"/>';
    var parks = r === 'sd' ? [[28.5535, 77.1965, 52, 34], [28.5925, 77.2200, 70, 26], [28.5510, 77.2215, 48, 30], [28.5860, 77.1870, 46, 22], [28.5290, 77.1690, 90, 54], [28.5250, 77.2150, 36, 22], [28.5680, 77.1640, 30, 18]]
      : [[28.4660, 77.1100, 120, 60], [28.4300, 77.0870, 40, 26], [28.4120, 77.0920, 60, 30], [28.4520, 77.0700, 36, 24]];
    parks.forEach(function (pk) { var c = CK.xy({ lat: pk[0], lng: pk[1] }, r); s += '<ellipse cx="' + c[0].toFixed(0) + '" cy="' + c[1].toFixed(0) + '" rx="' + pk[2] + '" ry="' + pk[3] + '" class="m-park"/>'; });
    var roads = r === 'sd' ? [
      [[28.569, 77.148], [28.572, 77.170], [28.575, 77.190], [28.569, 77.206], [28.572, 77.225], [28.573, 77.245], [28.565, 77.258]],
      [[28.549, 77.148], [28.552, 77.165], [28.546, 77.185], [28.538, 77.205], [28.536, 77.225], [28.540, 77.258]],
      [[28.594, 77.212], [28.569, 77.206], [28.556, 77.206], [28.540, 77.201], [28.515, 77.197]],
      [[28.594, 77.236], [28.573, 77.236], [28.548, 77.238], [28.515, 77.246]],
      [[28.577, 77.176], [28.546, 77.166], [28.515, 77.158]],
      [[28.530, 77.148], [28.528, 77.190], [28.527, 77.232], [28.525, 77.258]],
      [[28.517, 77.160], [28.516, 77.200], [28.512, 77.258]]
    ] : [
      [[28.470, 77.093], [28.440, 77.097], [28.420, 77.098], [28.398, 77.101]],
      [[28.470, 77.062], [28.440, 77.060], [28.398, 77.056]],
      [[28.430, 77.052], [28.415, 77.068], [28.398, 77.080]],
      [[28.452, 77.052], [28.450, 77.085], [28.448, 77.118]],
      [[28.428, 77.052], [28.430, 77.085], [28.432, 77.118]],
      [[28.412, 77.052], [28.410, 77.085], [28.405, 77.118]]
    ];
    var names = r === 'sd' ? ['Ring Road', 'Outer Ring Road', 'Aurobindo Marg', 'Lala Lajpat Rai Marg', 'Nelson Mandela Marg', 'Press Enclave Marg', 'Mehrauli–Badarpur Rd'] : ['Golf Course Road', 'Sohna Road', 'Golf Course Ext. Road', 'Sector Road', 'Sector Road', 'Southern Peripheral Rd'];
    roads.forEach(function (rd, i) { var d = smooth(r, rd); s += '<path d="' + d + '" class="m-road-o"/><path d="' + d + '" class="m-road" id="rd-' + r + i + '"/>'; });
    roads.forEach(function (rd, i) { if (i > 4 && r === 'sd') return; s += '<text class="m-rname" dy="-6"><textPath href="#rd-' + r + i + '" startOffset="' + (i % 2 ? 62 : 18) + '%">' + names[i] + '</textPath></text>'; });
    CK.AREAS.filter(function (a) { return a.r === r; }).forEach(function (a) { var c = CK.xy(a, r); s += '<text x="' + c[0].toFixed(0) + '" y="' + (c[1] + 30).toFixed(0) + '" class="m-area">' + esc(a.short.toUpperCase()) + '</text>'; });
    BASE[r] = s; return s;
  }
  CK.map = function (r, o) {
    o = o || {}; var R = CK.REGIONS[r];
    var off = CK.xy(R.office, r), vb = o.vb ? o.vb.slice() : [0, 0, R.w, R.h];
    if (!o.vb && o.fit !== false && ((o.stops && o.stops.length) || (o.pins && o.pins.length))) {
      var ps = (o.stops || []).map(function (st) { return CK.xy(CK.prop(st.pid), r); }).concat((o.pins || []).map(function (p) { return CK.xy(p, r); }));
      if (o.stops && o.stops.length && o.office !== false) ps.push(off);
      var x0 = Math.min.apply(null, ps.map(function (p) { return p[0]; })), x1 = Math.max.apply(null, ps.map(function (p) { return p[0]; })), y0 = Math.min.apply(null, ps.map(function (p) { return p[1]; })), y1 = Math.max.apply(null, ps.map(function (p) { return p[1]; }));
      var pad = o.pad || 110, ar = o.aspect || 1.4, w = Math.max(x1 - x0 + pad * 2, o.minW || 380), h = Math.max(y1 - y0 + pad * 2, (o.minW || 380) / ar);
      if (w / h < ar) w = h * ar; else h = w / ar;
      vb = [(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h / 2, w, h];
    }
    var s = '<svg class="map" viewBox="' + vb.map(function (v) { return v.toFixed(0); }).join(' ') + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + esc(o.label || ('Map of ' + R.name)) + '">' + base(r);
    if (o.pins) o.pins.forEach(function (p) { var c = CK.xy(p, r); s += '<g class="m-pin' + (p.on ? ' on' : '') + '" data-pin="' + (p.id || '') + '"><circle cx="' + c[0].toFixed(0) + '" cy="' + c[1].toFixed(0) + '" r="' + (p.on ? 9 : 6.5) + '"/></g>'; });
    if (o.stops && o.stops.length) {
      var pts2 = [off].concat(o.stops.map(function (st) { return CK.xy(CK.prop(st.pid), r); }));
      var d = 'M' + pts2[0][0].toFixed(0) + ' ' + pts2[0][1].toFixed(0);
      for (var i = 1; i < pts2.length; i++) { var a = pts2[i - 1], b = pts2[i], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], k = 0.18; d += ' Q' + (mx - dy * k).toFixed(0) + ' ' + (my + dx * k).toFixed(0) + ' ' + b[0].toFixed(0) + ' ' + b[1].toFixed(0); }
      s += '<path d="' + d + '" class="m-route-o"/><path d="' + d + '" class="m-route' + (o.draw ? ' draw' : '') + '" pathLength="1000"/>';
      if (o.legs) for (var j = 1; j < pts2.length; j++) { var a2 = pts2[j - 1], b2 = pts2[j]; var lx = (a2[0] + b2[0]) / 2 - (b2[1] - a2[1]) * 0.09, ly = (a2[1] + b2[1]) / 2 + (b2[0] - a2[0]) * 0.09; s += '<g class="m-leg"><rect x="' + (lx - 22).toFixed(0) + '" y="' + (ly - 11).toFixed(0) + '" width="44" height="22" rx="11"/><text x="' + lx.toFixed(0) + '" y="' + (ly + 4.5).toFixed(0) + '">' + o.legs[j - 1] + 'm</text></g>'; }
      o.stops.forEach(function (st, i) { var c = CK.xy(CK.prop(st.pid), r); var cls = st.st === 'done' ? 'done' : st.st === 'here' ? 'here' : st.st === 'missed' ? 'missed' : ''; s += '<g class="m-stop ' + cls + '" data-stop="' + i + '"><circle cx="' + c[0].toFixed(0) + '" cy="' + c[1].toFixed(0) + '" r="15"/><text x="' + c[0].toFixed(0) + '" y="' + (c[1] + 5).toFixed(0) + '">' + (st.st === 'done' ? '✓' : i + 1) + '</text></g>'; });
      if (o.agent != null) { var ag = o.agent; s += '<g class="m-agent"><circle cx="' + ag[0].toFixed(0) + '" cy="' + ag[1].toFixed(0) + '" r="22" class="pulse"/><circle cx="' + ag[0].toFixed(0) + '" cy="' + ag[1].toFixed(0) + '" r="9"/></g>'; }
    }
    if (o.overlay) s += o.overlay;
    s += '<g class="m-office"><rect x="' + (off[0] - 11).toFixed(0) + '" y="' + (off[1] - 11).toFixed(0) + '" width="22" height="22" rx="6"/><path d="M' + (off[0] - 5).toFixed(0) + ' ' + (off[1] + 5).toFixed(0) + 'V' + (off[1] - 4).toFixed(0) + 'h10V' + (off[1] + 5).toFixed(0) + '" /></g>';
    if (o.office !== false) s += '<text x="' + (off[0] + 16).toFixed(0) + '" y="' + (off[1] + 4).toFixed(0) + '" class="m-olbl">' + esc(R.office.name.split(' · ')[0] === 'Amaltas office' ? 'Office' : 'Site desk') + '</text>';
    return s + '</svg>';
  };

  /* ---------- charts (plain SVG) ---------- */
  CK.bars = function (rows, o) { // rows: [{label, value, tone}]
    o = o || {}; var max = Math.max.apply(null, rows.map(function (r) { return r.value; }).concat([1]));
    return '<div class="bars">' + rows.map(function (r) { return '<div class="bar-row"><span class="bar-l">' + esc(r.label) + '</span><span class="bar-t"><span class="bar-f' + (r.tone ? ' t-' + r.tone : '') + '" style="width:' + (r.value / max * 100).toFixed(1) + '%"></span></span><span class="bar-v">' + (o.fmt ? o.fmt(r.value) : r.value) + '</span></div>'; }).join('') + '</div>';
  };
  CK.spark = function (vals, w, h) { w = w || 120; h = h || 32; var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals), rg = max - min || 1; var p = vals.map(function (v, i) { return (i / (vals.length - 1) * w).toFixed(1) + ',' + (h - 3 - (v - min) / rg * (h - 6)).toFixed(1); }); return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" aria-hidden="true"><polyline points="' + p.join(' ') + '" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linejoin="round"/></svg>'; };
})();
