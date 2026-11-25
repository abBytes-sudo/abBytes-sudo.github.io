/* Northlane Back Office: app shell, router and UI kit (design sample). Pages register with A.page(name, def). */
(function () {
  'use strict';
  var NL = window.NL;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = NL.esc, money = NL.money;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mac = /Mac|iP(hone|ad)/.test(navigator.platform || navigator.userAgent);
  var A = window.A = { $: $, $$: $$, esc: esc, money: money, reduce: reduce, mac: mac };
  var view = $('#view'), layer = $('#layer');

  /* ───────── small helpers ───────── */
  A.ic = function (n, cls) { return '<span class="ic ic-' + n + (cls ? ' ' + cls : '') + '" aria-hidden="true"></span>'; };
  A.thumb = function (pid, cls) { var p = NL.product(pid), src = p && p.images[0] ? NL.thumb(p.images[0].src) : ''; return '<span class="th ' + (cls || '') + '">' + (src ? '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async">' : '') + '</span>'; };
  A.thumbs = function (o, max) { max = max || 3; var t = o.items.slice(0, max).map(function (it) { return A.thumb(it.pid); }).join(''); return '<span class="ths">' + t + (o.items.length > max ? '<em>+' + (o.items.length - max) + '</em>' : '') + '</span>'; };
  A.initials = function (n) { return String(n || '?').split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); };
  A.avc = function (s) { var h = 0; String(s).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) | 0; }); return ['', ' c2', ' c3', ' c4', ' c5'][Math.abs(h) % 5]; };
  A.av = function (name, lg) { return '<span class="av' + (lg ? ' lg' : '') + A.avc(name) + '" aria-hidden="true">' + esc(A.initials(name)) + '</span>'; };
  A.fulfilPill = function (o) { var f = NL.fulfilment(o); return { unfulfilled: '<span class="st ring c-warn">Unfulfilled</span>', partial: '<span class="st half c-warn">Partially fulfilled</span>', fulfilled: '<span class="st c-ink">Fulfilled</span>', cancelled: '<span class="st c-mute">Cancelled</span>' }[f]; };
  A.payPill = function (o) { var p = NL.payStatus(o); return '<span class="st ' + { paid: 'c-ok', pending: 'ring c-warn', cod: 'ring c-info', refunded: 'c-mute', partial_refund: 'half c-vio', voided: 'c-mute' }[p] + '">' + NL.PAYL[p] + '</span>'; };
  A.stagePill = function (st) { return st === 'placed' ? '<span class="st ring c-mute">Not shipped</span>' : '<span class="st ' + { packed: 'c-info', shipped: 'c-acc', out: 'c-acc', delivered: 'c-ok', cancelled: 'c-mute' }[st] + '">' + (st === 'packed' ? 'Packed' : NL.STGL[st]) + '</span>'; };
  A.retPill = function (rt) { return '<span class="st ' + { requested: 'ring c-vio', approved: 'half c-vio', received: 'c-vio', refunded: 'c-mute', rejected: 'c-mute' }[rt.st] + '">' + { requested: 'Return requested', approved: 'Return approved', received: 'Return received', refunded: 'Returned and refunded', rejected: 'Return declined' }[rt.st] + '</span>'; };
  A.discPill = function (d) { var s = NL.discStatus(d); return '<span class="st ' + { active: 'c-ok', paused: 'ring c-mute', scheduled: 'ring c-info', expired: 'c-mute', limit: 'half c-warn' }[s] + '">' + NL.DSL[s] + '</span>'; };
  A.segTag = function (s) { return '<span class="tag ' + ({ VIP: 'acc', 'At risk': 'warn', New: 'info', Subscriber: '' }[s] || '') + '">' + esc(s) + '</span>'; };
  A.empty = function (icon, title, body, action) { return '<div class="empty"><div class="art">' + A.ic(icon) + '</div><h3>' + title + '</h3>' + (body ? '<p>' + body + '</p>' : '') + (action || '') + '</div>'; };
  A.copy = function (text, label) { function ok() { A.toast((label || 'Copied') + ' to clipboard', { icon: 'copy' }); }
    try { navigator.clipboard.writeText(text).then(ok, function () { A.toast('Copy isn’t allowed here. Select the text instead.', { bad: true }); }); } catch (e) { A.toast('Copy isn’t allowed here.', { bad: true }); } };
  A.csv = function (name, rows) {
    var s = rows.map(function (r) { return r.map(function (c) { c = c == null ? '' : String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
    var url = URL.createObjectURL(new Blob(['﻿' + s], { type: 'text/csv;charset=utf-8' })), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    A.toast('Exported ' + NL.plural(rows.length - 1, 'row') + ' to ' + name, { icon: 'download' });
  };
  A.print = function (html) { var p = $('#print'); p.innerHTML = html; var imgs = $$('img', p), n = imgs.length; function go() { window.print(); setTimeout(function () { p.innerHTML = ''; }, 400); }
    if (!n) return setTimeout(go, 30); var k = 0; imgs.forEach(function (im) { if (im.complete) { if (++k === n) go(); } else im.onload = im.onerror = function () { if (++k === n) go(); }; }); };
  A.sparkPath = function (vals, w, h) { var mx = Math.max.apply(null, vals.concat([1])), mn = Math.min.apply(null, vals.concat([0])), n = vals.length - 1 || 1;
    var pts = vals.map(function (v, i) { return [i / n * w, h - 2 - (v - mn) / ((mx - mn) || 1) * (h - 4)]; });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(''); return { d: d, a: d + 'L' + w + ' ' + h + 'L0 ' + h + 'Z' }; };
  A.spark = function (vals) { var p = A.sparkPath(vals, 100, 30); return '<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path class="ar" d="' + p.a + '"/><path d="' + p.d + '"/></svg>'; };
  A.delta = function (a, b, invert) { if (!b) return '<span class="mute">—</span>'; var d = (a - b) / b * 100, up = d >= 0, good = invert ? !up : up; return '<span class="' + (Math.abs(d) < .5 ? 'mute' : good ? 'up' : 'dn') + '">' + (up ? '↑' : '↓') + ' ' + Math.abs(d).toFixed(Math.abs(d) < 10 ? 1 : 0) + '%</span>'; };
  A.fuzzy = function (q, s) { // subsequence match, bonus for word starts and runs; returns score or -1
    q = q.toLowerCase(); s = String(s).toLowerCase(); if (!q) return 0; var i = 0, j = 0, sc = 0, run = 0;
    var ix = s.indexOf(q); if (ix >= 0) return 100 - ix + (ix === 0 || /\W/.test(s[ix - 1]) ? 40 : 0);
    for (; i < s.length && j < q.length; i++) { if (s[i] === q[j]) { sc += 2 + run * 3 + (i === 0 || /[\s\-·@.]/.test(s[i - 1]) ? 6 : 0); run++; j++; } else run = 0; }
    return j === q.length ? sc : -1; };
  A.hl = function (q, s) { s = String(s); if (!q) return esc(s); var i = s.toLowerCase().indexOf(q.toLowerCase()); return i < 0 ? esc(s) : esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>' + esc(s.slice(i + q.length)); };
  A.qs = function (r, k, d) { var v = r.q.get(k); return v == null ? d : v; };

  /* ───────── toasts ───────── */
  A.toast = function (msg, o) {
    o = o || {}; var t = document.createElement('div'); t.className = 'toast' + (o.bad ? ' bad' : ''); t.setAttribute('role', 'status');
    t.innerHTML = A.ic(o.icon || (o.bad ? 'alert' : 'check')) + '<span>' + msg + '</span>' + (o.undo ? '<button type="button">Undo</button>' : '') + (o.action ? '<button type="button" data-x>' + esc(o.action[0]) + '</button>' : '');
    $('#toasts').appendChild(t);
    var done = false; function kill() { if (done) return; done = true; t.classList.add('out'); setTimeout(function () { t.remove(); }, 220); }
    if (o.undo) $('button', t).addEventListener('click', function () { o.undo(); kill(); });
    if (o.action) $('[data-x]', t).addEventListener('click', function () { o.action[1](); kill(); });
    setTimeout(kill, o.ms || (o.undo ? 6500 : 3600)); return t;
  };

  /* ───────── overlays ───────── */
  var stack = [];
  function trap(e, box) { if (e.key !== 'Tab') return; var f = $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])', box).filter(function (x) { return x.offsetParent !== null; }); if (!f.length) return; var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  A.overlay = function (html, o) {
    o = o || {}; var ov = document.createElement('div'); ov.className = 'ov' + (o.drawer ? ' dw' : '') + (o.cls ? ' ' + o.cls : ''); ov.innerHTML = html; layer.appendChild(ov);
    var opener = document.activeElement, box = ov.firstElementChild, closed = false;
    var api = { el: box, ov: ov, close: function (v) { if (closed) return; closed = true; stack.splice(stack.indexOf(api), 1); ov.classList.add('out'); setTimeout(function () { ov.remove(); }, 170); document.body.style.overflow = stack.length ? 'hidden' : ''; if (opener && document.contains(opener) && !o.noRefocus) try { opener.focus({ preventScroll: true }); } catch (e) {} if (o.onClose) o.onClose(v); } };
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) api.close(); });
    box.addEventListener('keydown', function (e) { trap(e, box); });
    stack.push(api); document.body.style.overflow = 'hidden';
    setTimeout(function () { var f = $('[autofocus]', box) || $('input:not([type=checkbox]):not([type=radio]),textarea,select', box) || $('button', box); if (f) try { f.focus({ preventScroll: true }); } catch (e) {} }, 40);
    return api;
  };
  A.modal = function (o) {
    // o: { title, sub, body, size, drawer, foot:[{label, cls, id, run(api)}], footNote, onOpen(api), onClose, kbdSubmit }
    var foot = (o.foot || []).map(function (b, i) { return '<button type="button" class="b ' + (b.cls || '') + '" data-f="' + i + '"' + (b.id ? ' id="' + b.id + '"' : '') + '>' + b.label + '</button>'; }).join('');
    var html = '<div class="md ' + (o.size || '') + '" role="dialog" aria-modal="true" aria-labelledby="mdT"><div class="md-h"><div><h2 id="mdT">' + o.title + '</h2>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div><button class="ib" type="button" data-close aria-label="Close">' + A.ic('x') + '</button></div>' +
      '<div class="md-b">' + (o.body || '') + '</div>' + (foot || o.footNote ? '<div class="md-f">' + (o.footNote != null ? '<span class="grow">' + o.footNote + '</span>' : '') + foot + '</div>' : '') + '</div>';
    var api = A.overlay(html, { drawer: o.drawer, onClose: o.onClose });
    $('[data-close]', api.el).addEventListener('click', function () { api.close(); });
    $$('[data-f]', api.el).forEach(function (b) { b.addEventListener('click', function () { var d = o.foot[+b.getAttribute('data-f')]; if (d.run) d.run(api, b); else api.close(); }); });
    api.body = $('.md-b', api.el); api.note = function (t) { var g = $('.md-f .grow', api.el); if (g) g.innerHTML = t; };
    api.el.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { var p = o.foot && o.foot.filter(function (f) { return /pri|acc|danger/.test(f.cls || ''); })[0]; if (p) { e.preventDefault(); $('[data-f="' + o.foot.indexOf(p) + '"]', api.el).click(); } } });
    if (o.onOpen) o.onOpen(api);
    return api;
  };
  A.confirm = function (o) {
    return new Promise(function (res) { var v = false;
      A.modal({ title: o.title, sub: o.sub, size: 'sm', body: o.body || '', foot: [{ label: o.cancel || 'Keep it' }, { label: o.ok || 'Confirm', cls: o.danger ? 'danger pri' : 'pri', run: function (api) { v = true; api.close(); } }], onClose: function () { res(v); } }); });
  };
  // anchored popover menu. items: [{label, icon, kbd, danger, run, head, sep, html}] or {html}
  var openMenu = null;
  A.menu = function (anchor, items, o) {
    o = o || {}; if (openMenu) { var same = openMenu.anchor === anchor; openMenu.close(); if (same) return null; }
    var p = document.createElement('div'); p.className = 'pop'; p.setAttribute('role', 'menu');
    p.innerHTML = typeof items === 'string' ? items : items.map(function (it, i) { if (it.sep) return '<div class="sep"></div>'; if (it.head) return '<h4>' + it.head + '</h4>'; if (it.html) return it.html;
      return '<button type="button" class="mi' + (it.danger ? ' danger' : '') + '" role="menuitem" data-i="' + i + '">' + (it.icon ? A.ic(it.icon) : '') + '<span>' + it.label + '</span>' + (it.kbd ? '<kbd>' + it.kbd + '</kbd>' : it.small ? '<small>' + it.small + '</small>' : '') + '</button>'; }).join('');
    document.body.appendChild(p);
    var r = anchor.getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight, x = o.right ? r.right - w : r.left, y = r.bottom + 6;
    if (x + w > innerWidth - 8) x = innerWidth - w - 8; if (x < 8) x = 8; if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - 6);
    p.style.left = x + 'px'; p.style.top = y + 'px';
    function close() { if (!p.parentNode) return; p.remove(); document.removeEventListener('mousedown', out, true); document.removeEventListener('keydown', key, true); openMenu = null; anchor.setAttribute('aria-expanded', 'false'); if (o.onClose) o.onClose(); }
    function out(e) { if (!p.contains(e.target) && !anchor.contains(e.target)) close(); }
    function key(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); anchor.focus(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var b = $$('.mi,.ck input,button', p), i = b.indexOf(document.activeElement); i = e.key === 'ArrowDown' ? Math.min(b.length - 1, i + 1) : Math.max(0, i - 1); if (b[i]) b[i].focus(); } }
    document.addEventListener('mousedown', out, true); document.addEventListener('keydown', key, true);
    if (Array.isArray(items)) p.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (!b) return; var it = items[+b.getAttribute('data-i')]; close(); if (it.run) it.run(); });
    anchor.setAttribute('aria-expanded', 'true');
    openMenu = { el: p, close: close, anchor: anchor };
    setTimeout(function () { var f = $('.mi,input,button', p); if (f && !o.noFocus) f.focus(); }, 10);
    return openMenu;
  };

  /* ───────── router ───────── */
  var pages = {}, cur = null, curName = '', curPath = '', scrollMem = {};
  A.page = function (name, def) { pages[name] = def; };
  A.parse = function () { var h = location.hash.replace(/^#\/?/, ''), q = '', i = h.indexOf('?'); if (i >= 0) { q = h.slice(i + 1); h = h.slice(0, i); }
    var parts = h.split('/').filter(Boolean).map(function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } }); return { name: parts[0] || 'home', id: parts[1] || '', sub: parts[2] || '', q: new URLSearchParams(q), path: h }; };
  A.go = function (path) { path = '#/' + String(path).replace(/^#?\/?/, ''); if (location.hash === path) A.refresh(); else location.hash = path; };
  A.setQ = function (obj) { var r = A.parse(), q = r.q; Object.keys(obj).forEach(function (k) { var v = obj[k]; if (v == null || v === '' || v === false || (Array.isArray(v) && !v.length)) q.delete(k); else q.set(k, Array.isArray(v) ? v.join(',') : v); });
    var s = q.toString(); history.replaceState(null, '', '#/' + r.path + (s ? '?' + s : '')); };
  A.cur = function () { return cur; };
  A.dirty = false;
  function crumbs(list) { $('#crumbs').innerHTML = list.map(function (c, i) { return i === list.length - 1 ? '<b>' + esc(c[0]) + '</b>' : '<a href="' + c[1] + '">' + esc(c[0]) + '</a>' + A.ic('chev-r'); }).join(''); }
  function skel(kind) {
    var row = function (w) { return '<div class="sk-row"><span class="sk" style="width:18px;height:18px"></span><span class="sk" style="width:' + w + '%;height:12px"></span><span class="sk" style="width:12%;height:12px;margin-left:auto"></span></div>'; };
    if (kind === 'detail') return '<div class="ph"><div><span class="sk" style="width:220px;height:26px"></span><span class="sk" style="width:320px;height:12px;margin-top:10px"></span></div></div><div class="g2"><div><div class="cd" style="height:220px"><div class="cd-b"><span class="sk" style="width:60%;height:14px"></span></div></div><div class="cd" style="height:300px;margin-top:16px"></div></div><div class="cd" style="height:360px"></div></div>';
    if (kind === 'none') return '';
    return '<div class="ph"><div><span class="sk" style="width:180px;height:26px"></span><span class="sk" style="width:280px;height:12px;margin-top:10px"></span></div></div><div class="tw">' + [42, 30, 50, 36, 44, 28, 40, 34].map(row).join('') + '</div>';
  }
  var MV = '25', loaded = {}, loading = {};
  var FILES = { home: ['admin-insights.js', 'journey.js'], orders: ['admin-orders.js', 'journey.js'], journey: ['journey.js', 'admin-orders.js'], products: ['admin-catalog.js'], inventory: ['admin-catalog.js'],
    customers: ['admin-people.js'], discounts: ['admin-people.js'], messages: ['admin-people.js'], analytics: ['admin-insights.js'], audit: ['admin-insights.js'], chats: ['admin-chat.js'] };
  A.load = function (list) { return Promise.all(list.map(function (f) { if (loaded[f]) return true; if (!loading[f]) loading[f] = new Promise(function (res) { var s = document.createElement('script'); s.src = f + '?v=' + MV; s.onload = function () { loaded[f] = 1; res(); }; s.onerror = function () { loaded[f] = 1; res(); }; document.head.appendChild(s); }); return loading[f]; })); };
  A.loadAll = function () { var all = {}; Object.keys(FILES).forEach(function (k) { FILES[k].forEach(function (f) { all[f] = 1; }); }); return A.load(Object.keys(all)); };
  function render(fresh) {
    var r0 = A.parse(), need = (FILES[r0.name] || FILES.home).filter(function (f) { return !loaded[f]; });
    if (need.length) { if (!view.querySelector('.boot')) view.innerHTML = skel(r0.id ? 'detail' : 'table'); A.load(need).then(function () { render(fresh); }); return; }
    var r = A.parse(), p = pages[r.name] || pages.home; if (!p) return;
    var changed = r.path !== curPath; if (!changed && A.dirty && !fresh) return;
    if (cur && cur.leave && (changed || fresh === 'nav')) cur.leave();
    if (changed && curPath) scrollMem[curPath] = scrollY;
    cur = p; curName = r.name; curPath = r.path; if (changed) A.dirty = false;
    view.className = 'view' + (p.wide ? ' wide' : '') + (p.flush ? ' flush' : '');
    document.body.setAttribute('data-page', r.name);
    $$('#sideNav .nv').forEach(function (a) { var nav = a.getAttribute('data-nav'), hit = nav === (p.nav || r.name); var hq = a.getAttribute('data-q'); if (hq) hit = hit && r.q.toString() === hq; else if (nav === 'orders' && r.q.get('v') === 'returns' && r.name === 'orders') hit = false; if (hit) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    crumbs(p.crumbs ? p.crumbs(r) : [[p.title || r.name, '#/' + r.name]]);
    document.title = (p.docTitle ? p.docTitle(r) : (p.title || 'Back office')) + ' · Northlane Back Office';
    function paint() { var h = p.render(r, view); if (typeof h === 'string') view.innerHTML = h; if (p.mount) p.mount(r, view); }
    if (changed && !reduce && p.skeleton !== 'none' && fresh !== 'instant') {
      view.innerHTML = skel(p.skeleton); setTimeout(function () { if (A.parse().path !== r.path) return; paint(); if (fresh !== 'keep') scrollTo(0, 0); view.classList.add('vin'); }, 140 + Math.random() * 80);
    } else { var y = scrollY; paint(); if (changed) scrollTo(0, scrollMem[r.path] || 0); else scrollTo(0, y); }
    if (changed) { closeSide(); try { view.focus({ preventScroll: true }); } catch (e) {} }
    navCounts();
  }
  A.refresh = function () { render(true); };
  addEventListener('hashchange', function () { render('nav'); });

  // page-level event delegation: data-act (click), data-ch (change), data-in (input)
  function deleg(type, attr) { view.addEventListener(type, function (e) { var t = e.target.closest('[' + attr + ']'); if (!t || !view.contains(t) || !cur || !cur.acts) return; var fn = cur.acts[t.getAttribute(attr)]; if (fn) { var inner = e.target.closest('input,label,select,textarea'); if (type === 'click' && t.tagName !== 'INPUT' && t.tagName !== 'LABEL' && !(inner && inner !== t && t.contains(inner))) e.preventDefault(); fn(t, e); } }); }
  deleg('click', 'data-act'); deleg('change', 'data-ch'); deleg('input', 'data-in');
  view.addEventListener('keydown', function (e) { var t = e.target.closest('[data-kd]'); if (t && cur && cur.acts && cur.acts[t.getAttribute('data-kd')]) cur.acts[t.getAttribute('data-kd')](t, e); });
  // row navigation: any [data-href] row opens on click unless a control inside was clicked
  view.addEventListener('click', function (e) { var tr = e.target.closest('[data-href]'); if (!tr || e.target.closest('a,button,input,label,select,textarea,[data-act]')) return; if (e.metaKey || e.ctrlKey) { open(tr.getAttribute('data-href'), '_blank'); return; } location.hash = tr.getAttribute('data-href'); });

  /* ───────── sidebar ───────── */
  var NAV = [
    { k: 'home', l: 'Home', i: 'home', href: '#/' },
    { k: 'orders', l: 'Orders', i: 'orders', href: '#/orders', ct: function () { return NL.db().orders.filter(function (o) { return !o.cancelled && NL.fulfilment(o) !== 'fulfilled'; }).length; }, hot: true },
    { k: 'orders', q: 'v=returns', l: 'Returns', i: 'return', href: '#/orders?v=returns', sub: true, ct: function () { return NL.db().orders.filter(function (o) { return NL.openReturn(o); }).length; } },
    { k: 'journey', l: 'Order journey', i: 'journey', href: '#/journey' },
    { h: 'Catalogue' },
    { k: 'products', l: 'Products', i: 'products', href: '#/products', ct: function () { return NL.products({ all: true }).length; } },
    { k: 'inventory', l: 'Inventory', i: 'inventory', href: '#/inventory', ct: function () { var n = 0; NL.products({ all: true }).forEach(function (p) { NL.variants(p).forEach(function (v) { if (v.state !== 'in') n++; }); }); return n; }, hot: true },
    { h: 'Customers' },
    { k: 'customers', l: 'Customers', i: 'customers', href: '#/customers' },
    { k: 'discounts', l: 'Discounts', i: 'discounts', href: '#/discounts' },
    { k: 'chats', l: 'Conversations', i: 'chat', href: '#/chats', ct: function () { return A.chatWaiting().n; }, hot: true },
    { k: 'messages', l: 'Messages', i: 'notify', href: '#/messages' },
    { h: 'Insight' },
    { k: 'analytics', l: 'Analytics', i: 'analytics', href: '#/analytics' },
    { k: 'audit', l: 'Audit log', i: 'audit', href: '#/audit' }
  ];
  function buildNav() {
    $('#sideNav').innerHTML = NAV.map(function (n) { if (n.h) return '<h3>' + n.h + '</h3>'; return '<a class="nv' + (n.sub ? ' sub' : '') + '" href="' + n.href + '" data-nav="' + n.k + '"' + (n.q ? ' data-q="' + n.q + '"' : '') + '>' + (n.sub ? '' : A.ic(n.i)) + '<span>' + n.l + '</span>' + (n.ct ? '<span class="ct' + (n.hot ? ' hot' : '') + '" data-ct="' + NAV.indexOf(n) + '"></span>' : '') + '</a>'; }).join('');
  }
  function navCounts() {
    $$('[data-ct]').forEach(function (el) { var n = NAV[+el.getAttribute('data-ct')], v = n.ct(); el.textContent = v || ''; el.classList.toggle('hot', !!(n.hot && v)); });
    var vs = NL.db().views || [];
    $('#sideViews').innerHTML = vs.length ? '<h3>Saved views</h3>' + vs.map(function (v) { return '<a class="nv sub" style="padding-left:12px" href="#/orders?' + esc(v.q) + '" data-nav="orders" data-q="' + esc(v.q) + '">' + A.ic('filter') + '<span>' + esc(v.name) + '</span></a>'; }).join('') : '';
    var r = A.parse(); $$('#sideViews .nv').forEach(function (a) { if (r.name === 'orders' && r.q.toString() === a.getAttribute('data-q')) a.setAttribute('aria-current', 'page'); });
  }
  A.navCounts = navCounts;
  // chats waiting for a person, read straight from the concierge's store so the badge works before the chat engine loads
  A.chatWaiting = function () { var r = { n: 0, longest: 0, first: null }; try { (JSON.parse(localStorage.getItem('orbit-convos')) || []).forEach(function (c) { if (c.agent === 'northlane' && c.status === 'waiting' && !c.hidden) { r.n++; var w = Date.now() - (c.handoverAt || c.updatedAt || Date.now()); if (w >= r.longest) { r.longest = w; r.first = c; } } }); } catch (e) {} return r; };
  addEventListener('storage', function (e) { if (e.key === 'orbit-convos') { navCounts(); if (curName === 'home' && !A.dirty) A.refresh(); } });
  var side = $('#side'), sh = $('#sideSh');
  function openSide() { side.classList.add('open'); sh.hidden = false; $('#menuBtn').setAttribute('aria-expanded', 'true'); setTimeout(function () { var a = $('.nv[aria-current]', side) || $('.nv', side); if (a) a.focus(); }, 60); }
  function closeSide() { if (!side.classList.contains('open')) return; side.classList.remove('open'); sh.hidden = true; $('#menuBtn').setAttribute('aria-expanded', 'false'); }
  $('#menuBtn').innerHTML = A.ic('menu'); $('#sideX').innerHTML = A.ic('x');
  $('#menuBtn').addEventListener('click', openSide); $('#sideX').addEventListener('click', closeSide); sh.addEventListener('click', closeSide);
  side.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSide(); });

  /* theme */
  function themeBtn() { var d = document.documentElement.getAttribute('data-theme') === 'dark'; $('#themeBtn').innerHTML = A.ic(d ? 'sun' : 'moon'); $('#themeBtn').setAttribute('aria-label', d ? 'Switch to light theme' : 'Switch to dark theme'); }
  A.toggleTheme = function () { var d = document.documentElement.getAttribute('data-theme') !== 'dark'; if (d) document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme'); try { localStorage.setItem('nl-admin-theme', d ? 'dark' : 'light'); } catch (e) {} themeBtn(); if (cur && cur.theme) cur.theme(); };
  $('#themeBtn').addEventListener('click', A.toggleTheme); themeBtn();
  $('#resetBtn').addEventListener('click', function () { A.confirm({ title: 'Start fresh?', sub: 'Every order, product edit, discount and note made in this browser goes back to the original seed. The storefront bag and sign-in are kept.', ok: 'Start fresh', danger: true }).then(function (y) { if (!y) return; NL.reset(); A.toast('Started fresh. New orders are waiting.'); A.go(''); }); });

  /* ───────── command palette ───────── */
  var cmds = [], searchers = [];
  A.cmd = function (c) { cmds.push(c); };
  A.searcher = function (f) { searchers.push(f); };
  var palOpen = null;
  A.palette = function (initial) {
    if (palOpen) { palOpen.close(); return; }
    var html = '<div class="pal" role="dialog" aria-modal="true" aria-label="Command menu"><div class="pal-in">' + A.ic('search') + '<input type="text" role="combobox" aria-expanded="true" aria-controls="palL" aria-autocomplete="list" placeholder="Search orders, customers, products, or type a command…" autocomplete="off" spellcheck="false" autofocus><kbd>esc</kbd></div><div class="pal-l" id="palL" role="listbox"></div>' +
      '<div class="pal-f"><span><kbd>↑</kbd><kbd>↓</kbd> to move</span><span><kbd>↵</kbd> to open</span><span><kbd>' + (mac ? '⌘' : 'Ctrl') + '</kbd><kbd>K</kbd> to close</span></div></div>';
    var api = A.overlay(html, { cls: 'palov', onClose: function () { palOpen = null; } }); palOpen = api;
    var inp = $('input', api.el), list = $('#palL', api.el), items = [], sel = 0;
    function build() {
      var q = inp.value.trim(), groups = {}, order = [];
      function add(g, it) { if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push(it); }
      if (!q) { var rec = recent(); if (rec.length) rec.forEach(function (it) { add('Recent', it); });
        cmds.filter(function (c) { return c.pin; }).forEach(function (c) { add('Suggestions', c); }); }
      else {
        var cm = cmds.map(function (c) { return { c: c, s: Math.max(A.fuzzy(q, c.label), c.keys ? A.fuzzy(q, c.keys) - 10 : -1) }; }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 6);
        searchers.forEach(function (f) { f(q).forEach(function (it) { add(it.group, it); }); });
        cm.forEach(function (x) { add('Commands', x.c); });
        if (order[0] !== 'Commands' && cm.length && cm[0].s > 120) { order.splice(order.indexOf('Commands'), 1); order.unshift('Commands'); }
      }
      items = []; var h = '';
      order.forEach(function (g) { h += '<h4>' + g + '</h4>'; groups[g].slice(0, g === 'Orders' ? 6 : 5).forEach(function (it) { var i = items.length; items.push(it);
        h += '<button type="button" class="pi" role="option" id="pi' + i + '" data-i="' + i + '" aria-selected="false">' + (it.thumb ? A.thumb(it.thumb) : A.ic(it.icon || 'arrow-r')) + '<span>' + (q ? A.hl(q, it.label) : esc(it.label)) + '</span>' + (it.sub ? '<small>' + esc(it.sub) + '</small>' : '') + (it.kbd ? '<kbd>' + it.kbd + '</kbd>' : '') + '</button>'; }); });
      list.innerHTML = h || '<div class="pal-e">Nothing matches “' + esc(q) + '”. Try an order number like NL-10471, a name, a SKU or “fulfil”.</div>';
      sel = 0; mark();
    }
    function mark() { $$('.pi', list).forEach(function (b, i) { b.setAttribute('aria-selected', i === sel); }); var b = $('#pi' + sel, list); if (b) { b.scrollIntoView({ block: 'nearest' }); inp.setAttribute('aria-activedescendant', 'pi' + sel); } }
    function run(i) { var it = items[i]; if (!it) return; api.close(); remember(it); setTimeout(function () { it.run(); }, 10); }
    inp.addEventListener('input', build);
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(items.length - 1, sel + 1); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); mark(); }
      else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
      else if (e.key === 'Escape') { e.preventDefault(); api.close(); } });
    list.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) run(+b.getAttribute('data-i')); });
    list.addEventListener('mousemove', function (e) { var b = e.target.closest('[data-i]'); if (b && +b.getAttribute('data-i') !== sel) { sel = +b.getAttribute('data-i'); mark(); } });
    if (initial) inp.value = initial; build();
    A.loadAll().then(function () { if (palOpen === api) build(); }); // every section's commands, fetched the first time the palette opens
  };
  function recent() { try { return (JSON.parse(localStorage.getItem('nl-admin-recent')) || []).map(function (r) { return { label: r.l, sub: r.s, icon: r.i, thumb: r.t, run: function () { A.go(r.h); } }; }).slice(0, 4); } catch (e) { return []; } }
  function remember(it) { if (!it.href) return; try { var L = JSON.parse(localStorage.getItem('nl-admin-recent')) || []; L = L.filter(function (r) { return r.h !== it.href; }); L.unshift({ l: it.label, s: it.sub || '', i: it.icon || '', t: it.thumb || '', h: it.href }); localStorage.setItem('nl-admin-recent', JSON.stringify(L.slice(0, 6))); } catch (e) {} }
  $('#topSearch').addEventListener('click', function () { A.palette(); });
  $('#sideSearch').addEventListener('click', function () { closeSide(); A.palette(); });
  $$('.top-search kbd, .side-search kbd').forEach(function (k) { k.textContent = mac ? '⌘K' : 'Ctrl K'; });

  // built-in searchers: orders, customers, products/SKUs, discounts
  A.searcher(function (q) {
    var D = NL.db(), out = [], ql = q.toLowerCase().replace(/^#/, ''), num = ql.replace(/[^0-9]/g, '');
    var hits = D.orders.map(function (o) { var s = Math.max(num.length >= 3 && String(o.num).indexOf(num) >= 0 ? 200 - String(o.num).indexOf(num) : -1, A.fuzzy(ql, o.name) - 5, ql.indexOf('@') >= 0 ? A.fuzzy(ql, o.email) : -1); return { o: o, s: s }; })
      .filter(function (x) { return x.s > 20; }).sort(function (a, b) { return b.s - a.s || b.o.t - a.o.t; }).slice(0, 6);
    hits.forEach(function (x) { var o = x.o; out.push({ group: 'Orders', label: o.id + ' · ' + o.name, sub: NL.money(o.total) + ' · ' + NL.STGL[NL.stage(o)], icon: 'orders', href: 'orders/' + o.id, run: function () { A.go('orders/' + o.id); } }); });
    var cs = D.cust.map(function (c) { return { c: c, s: Math.max(A.fuzzy(ql, c.name), A.fuzzy(ql, c.email) - 10, A.fuzzy(ql, c.city) - 30) }; }).filter(function (x) { return x.s > 25; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 5);
    cs.forEach(function (x) { out.push({ group: 'Customers', label: x.c.name, sub: x.c.email + ' · ' + x.c.city, icon: 'user', href: 'customers/' + x.c.id, run: function () { A.go('customers/' + x.c.id); } }); });
    NL.products({ all: true }).forEach(function (p) { var s = Math.max(A.fuzzy(ql, p.name), A.fuzzy(ql, p.code) - 5, A.fuzzy(ql, p.cat) - 40); if (s > 25) out.push({ group: 'Products', s: s, label: p.name, sub: p.cat + ' · ' + NL.money(p.price), thumb: p.id, href: 'products/' + p.id, run: function () { A.go('products/' + p.id); } }); });
    if (ql.length >= 3) { var sk = 0; NL.products({ all: true }).forEach(function (p) { NL.variants(p).forEach(function (v) { if (sk < 4 && v.code.toLowerCase().indexOf(ql) >= 0) { sk++; out.push({ group: 'Stock', label: v.code + ' · ' + p.name + ', ' + v.col + (v.s !== 'One size' ? ', ' + v.s : ''), sub: v.avail + ' available', icon: 'inventory', href: 'inventory?q=' + v.code, run: function () { A.go('inventory?q=' + v.code); } }); } }); }); }
    D.disc.forEach(function (d) { if (A.fuzzy(ql, d.code) > 30) out.push({ group: 'Discounts', label: d.code, sub: NL.discText(d), icon: 'discounts', href: 'discounts?code=' + d.code, run: function () { A.go('discounts?code=' + d.code); } }); });
    return out;
  });
  [['Go to Home', 'home', '', 'G H'], ['Go to Orders', 'orders', 'orders', 'G O'], ['Go to Returns', 'return', 'orders?v=returns', 'G R'], ['Go to Products', 'products', 'products', 'G P'], ['Go to Inventory', 'inventory', 'inventory', 'G I'], ['Go to Customers', 'customers', 'customers', 'G C'], ['Go to Discounts', 'discounts', 'discounts', 'G D'], ['Go to Analytics', 'analytics', 'analytics', 'G A'], ['Go to Messages', 'notify', 'messages', 'G M'], ['Go to Conversations', 'chat', 'chats', 'G T'], ['Open the order journey', 'journey', 'journey', 'G J'], ['Go to Audit log', 'audit', 'audit', 'G L']].forEach(function (c, i) {
    A.cmd({ label: c[0], icon: c[1], kbd: c[3], pin: i === 1 || i === 9, run: function () { A.go(c[2]); } }); });
  A.cmd({ label: 'Toggle dark theme', icon: 'moon', keys: 'theme dark light mode', run: function () { A.toggleTheme(); } });
  A.cmd({ label: 'Open the storefront in a new tab', icon: 'store', keys: 'shop store website', run: function () { open('../store/index.html', '_blank'); } });
  A.cmd({ label: 'Show keyboard shortcuts', icon: 'kbd', kbd: '?', keys: 'help keys', run: function () { shortcuts(); } });
  A.cmd({ label: 'Start fresh', icon: 'reset', keys: 'seed restore clear', run: function () { $('#resetBtn').click(); } });

  /* ───────── keyboard ───────── */
  var gPending = 0;
  var GO = { h: '', o: 'orders', r: 'orders?v=returns', p: 'products', i: 'inventory', c: 'customers', d: 'discounts', a: 'analytics', m: 'messages', j: 'journey', l: 'audit', t: 'chats' };
  function typing(t) { return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable); }
  addEventListener('keydown', function (e) {
    var mod = e.metaKey || e.ctrlKey;
    if (mod && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (openMenu) openMenu.close(); A.palette(); return; }
    if (e.key === 'Escape' && stack.length && !e.defaultPrevented) { stack[stack.length - 1].close(); return; }
    if (mod && (e.key === 's' || e.key === 'S') && cur && cur.save) { e.preventDefault(); cur.save(); return; }
    if (stack.length || typing(e.target) || mod || e.altKey) return;
    if (gPending) { var to = GO[e.key]; gPending = 0; if (to != null) { e.preventDefault(); A.go(to); } return; }
    if (e.key === 'g') { gPending = 1; setTimeout(function () { gPending = 0; }, 900); return; }
    if (e.key === '?') { e.preventDefault(); shortcuts(); return; }
    if (e.key === '/') { var s = $('[data-search]', view); e.preventDefault(); if (s) s.focus(); else A.palette(); return; }
    if (cur && cur.keys && cur.keys[e.key]) { cur.keys[e.key](e); }
  });
  function shortcuts() {
    var k = function (a, b) { return '<div><span>' + a + '</span><span>' + b.split(' ').map(function (x) { return '<kbd>' + x + '</kbd>'; }).join('') + '</span></div>'; }, M = mac ? '⌘' : 'Ctrl';
    A.modal({ title: 'Keyboard shortcuts', sub: 'The back office is built to be driven from the keyboard.', size: 'lg', body: '<div class="kbdl"><h4>Everywhere</h4>' + k('Command menu and search', M + ' K') + k('Search this page', '/') + k('This list', '?') + k('Close a dialog', 'esc') +
      '<h4>Go to</h4>' + k('Home', 'G H') + k('Orders', 'G O') + k('Returns', 'G R') + k('Products', 'G P') + k('Inventory', 'G I') + k('Customers', 'G C') + k('Discounts', 'G D') + k('Analytics', 'G A') + k('Messages', 'G M') + k('Conversations', 'G T') + k('Order journey', 'G J') + k('Audit log', 'G L') +
      '<h4>Lists</h4>' + k('Move down / up', 'J K') + k('Select row', 'X') + k('Open row', '↵') + k('Select all', 'Shift A') +
      '<h4>Order detail</h4>' + k('Fulfil items', 'E') + k('Refund', 'R') + k('Print packing slip', 'P') + k('Previous / next order', '[ ]') + k('Save (in editors)', M + ' S') + k('Submit a dialog', M + ' ↵') +
      '<h4>Conversations</h4>' + k('Next chat waiting', 'N') + k('Take over', 'T') + k('Reply', 'R') + k('Resolve', 'E') + k('Previous / next chat', 'K J') + '</div>' });
  }
  $('#kbdBtn').addEventListener('click', shortcuts);
  // list keyboard helper used by table pages
  A.listKeys = function (sel) {
    var i = -1; function rows() { return $$(sel, view); }
    function focus(n) { var R = rows(); if (!R.length) return; i = Math.max(0, Math.min(R.length - 1, n)); R.forEach(function (r, k) { r.classList.toggle('kf', k === i); }); R[i].scrollIntoView({ block: 'nearest' }); }
    return { j: function () { focus(i + 1); }, k: function () { focus(i - 1); }, x: function () { var r = rows()[i]; if (r) { var c = $('input[type=checkbox]', r); if (c) c.click(); } }, Enter: function () { var r = rows()[i]; if (r && r.getAttribute('data-href')) location.hash = r.getAttribute('data-href'); }, reset: function () { i = -1; } };
  };

  /* ───────── live sync with the storefront ───────── */
  var known = {};
  function snapshot() { known = {}; NL.db().orders.forEach(function (o) { known[o.id] = 1; }); }
  addEventListener('nl:change', function (e) {
    if (!e.detail || !e.detail.remote) { navCounts(); return; }
    var D = NL.db(), fresh = D.orders.filter(function (o) { return !known[o.id]; });
    snapshot(); A.fresh = fresh.map(function (o) { return o.id; });
    var live = $('#live'); live.classList.remove('flash'); void live.offsetWidth; live.classList.add('flash');
    fresh.slice(0, 2).forEach(function (o) { A.toast('New order <b>' + o.id + '</b> · ' + money(o.total) + ' from ' + esc(o.name), { icon: 'bolt', action: ['Open', function () { A.go('orders/' + o.id); }], ms: 7000 }); });
    if (A.dirty) { if (!fresh.length) A.toast('Something changed on the storefront.', { icon: 'reset', action: ['Refresh', function () { A.dirty = false; A.refresh(); }] }); navCounts(); return; }
    if (cur && cur.remote) cur.remote(fresh); else A.refresh();
  });

  /* ───────── boot (after page modules registered) ───────── */
  A.boot = function () { buildNav(); snapshot(); render('instant'); requestAnimationFrame(function () { requestAnimationFrame(function () { document.body.classList.add('ready'); }); }); };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', function () { setTimeout(A.boot, 0); }); else setTimeout(A.boot, 0);
})();
