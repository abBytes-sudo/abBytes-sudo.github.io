/* Staff desk (design sample by Abhishek). The small back office behind a website's scripted concierge: every lead the chat
   captures, the bookings it makes, the conversations it hands over and the projects it reports on. One file, branded by a
   config (window.DESK, set by the page's *-config.js). Data lives in this browser only: the shared Orbit store
   (localStorage "orbit-*", written by samples/assets/bots/engine.js) plus this desk's own notes and statuses. */
(function () {
  'use strict';
  var C = window.DESK, O = window.Orbit; if (!C || !O) return;
  var doc = document, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, mac = /Mac|iP(hone|ad)/.test(navigator.platform || navigator.userAgent);
  var DAY = 864e5, H = 36e5, MIN = 6e4, KEY = 'desk-' + C.agent;
  function $(s, r) { return (r || doc).querySelector(s); } function $$(s, r) { return [].slice.call((r || doc).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plain(t) { return String(t || '').replace(/\*\*/g, ''); }
  function fmt(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); }
  function ago(t) { var m = Math.round((Date.now() - t) / MIN); if (m < 1) return 'just now'; if (m < 60) return m + 'm ago'; if (m < 1440) return Math.round(m / 60) + 'h ago'; var d = Math.round(m / 1440); return d + 'd ago'; }
  function hm(t) { var d = new Date(t), h = d.getHours(), m = d.getMinutes(); return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'am' : 'pm'); }
  function dayStart(t) { var d = new Date(t == null ? Date.now() : t); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function fD(t) { return O.fmtDay(new Date(t)); }
  function relLow(t) { var r = rel(t); return /^(Today|Tomorrow|Yesterday)$/.test(r) ? r.toLowerCase() : 'on ' + r; }
  function rel(t) { var d = Math.round((dayStart(t) - dayStart()) / DAY); return d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : d === -1 ? 'Yesterday' : fD(t); }
  function isoT(iso, time) { var p = String(iso).split('-'), q = String(time || '09:00').split(':'); return new Date(+p[0], +p[1] - 1, +p[2], +q[0], +q[1]).getTime(); }
  function initials(n) { return String(n || '?').split(/\s+/).filter(Boolean).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); }
  function avc(s) { var h = 0; String(s).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) | 0; }); return ' c' + (Math.abs(h) % 5); }
  function av(n, lg) { return '<span class="av' + (lg ? ' lg' : '') + avc(n) + '" aria-hidden="true">' + esc(initials(n)) + '</span>'; }
  function plural(n, a, b) { return n + ' ' + (n === 1 ? a : (b || a + 's')); }
  var IC = { home: 'M3 10.5L12 4l9 6.5V20h-6v-6H9v6H3z', leads: 'M4 6h16M4 12h10M4 18h7', cal: 'M5 6h14v14H5zM5 10h14M9 3v4M15 3v4', chat: 'M4 5h16v11H9l-5 4z', proj: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', box: 'M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8', search: 'M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13zM20 20l-4.6-4.6', plus: 'M12 5v14M5 12h14', x: 'M6 6l12 12M18 6L6 18', check: 'M5 12.5l4.5 4.5L19 7', phone: 'M6 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L15 12l5 2v3a3 3 0 0 1-3 3A15 15 0 0 1 3 6a3 3 0 0 1 3-3z', more: 'M5 12h.01M12 12h.01M19 12h.01', arrow: 'M5 12h14M13 6l6 6-6 6', back: 'M19 12H5M11 18l-6-6 6-6', ext: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6', clock: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM12 7v5l3 2', bolt: 'M13 3L5 14h6l-1 7 8-11h-6z', note: 'M5 4h14v12l-4 4H5zM15 20v-4h4', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6', filter: 'M4 5h16l-6 8v6l-4-2v-4z', sort: 'M8 5v14M4 15l4 4 4-4M16 19V5M12 9l4-4 4 4', play: 'M7 5l12 7-12 7z', reset: 'M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5', menu: 'M4 7h16M4 12h16M4 17h16', mail: 'M4 6h16v12H4zM4 7l8 6 8-6', star: 'M12 4l2.5 5 5.5.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.5-.8z', kbd: 'M3 7h18v10H3zM7 11h.01M11 11h.01M15 11h.01M8 14h8' };
  function ic(n, s) { return '<svg class="i" width="' + (s || 16) + '" height="' + (s || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (IC[n] || IC.bolt) + '"/></svg>'; }

  /* ───────── this desk's own data: statuses, notes, activity ───────── */
  function ds() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function dsave(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function dget(k, d) { var x = ds(); return x[k] || d; }
  function dset(k, v) { var x = ds(); x[k] = v; dsave(x); }
  var S = O.createSession(C.agent, { silent: true }); // reads the agent's bookings and projects
  function db(n) { return S.db(n) || []; } function dbs(n, v) { S.save(n, v); }
  function logAct(text, icon) { var L = dget('act', []); L.unshift({ t: Date.now(), m: text, i: icon || 'bolt' }); dset('act', L.slice(0, 60)); }

  /* ───────── seeded history the first time a desk opens ───────── */
  function seed() {
    if (ds().seeded === 2) return; var now = Date.now(), have = {}; O.convos.list().forEach(function (c) { have[c.id] = 1; });
    var add = [];
    (C.seed || []).forEach(function (s, i) {
      var id = C.agent + '-seed-' + i, t0 = now - s.ago * MIN;
      if (!have[id] && s.msgs) add.push({ id: id, seed: true, agent: C.agent, agentName: C.brand, channel: s.channel || 'web', source: s.source, status: s.status || 'resolved', startedAt: t0, updatedAt: t0 + s.msgs.length * 40e3, engaged: true, user: { name: s.name, email: s.email || '', phone: s.phone || '' }, mem: {}, context: s.ctx || {}, handoverReason: s.status === 'waiting' ? 'Visitor asked for a person' : '', handoverAt: s.status === 'waiting' ? now - (s.wait || 5) * MIN : 0,
        messages: s.msgs.map(function (m, k) { return { id: id + 'm' + k, from: m[0], text: m[1], ts: t0 + k * 40e3, kind: m[0] === 'system' ? 'system' : undefined, name: m[0] === 'agent' ? C.user.first : undefined }; }) });
      (s.leads || []).forEach(function (L) { if (!O.leads.list().some(function (x) { return x.payload && x.payload.convo === id && x.intent === L.intent; })) O.leads.add({ name: s.name, email: s.email || undefined, phone: s.phone || '', source: s.source, channel: s.channel || 'web', agent: C.agent, intent: L.intent, payload: Object.assign({ convo: s.msgs ? id : undefined, deskSeed: true }, L.payload), status: 'new', timestamp: new Date(t0 + 60e3).toISOString() }); });
      if (s.st) { var st = dget('st', {}); st[(s.msgs ? id : 'seed' + i)] = s.st; dset('st', st); }
      if (s.notes) { var nt = dget('notes', {}); nt[(s.msgs ? id : 'seed' + i)] = s.notes.map(function (x) { return { t: now - x[0] * H, m: x[1], by: C.user.first }; }); dset('notes', nt); }
    });
    if (add.length) { var all = O._store.get('orbit-convos', []); O._store.set('orbit-convos', all.concat(add)); O.convos.reload(); }
    (C.activity || []).forEach(function (a) { var L = dget('act', []); L.push({ t: now - a[0] * MIN, m: a[1], i: a[2] }); dset('act', L); });
    var x = ds(); x.seeded = 2; dsave(x);
  }

  /* ───────── records: one per person (a chat can produce several leads: an estimate, then a booking) ───────── */
  var PRI = C.priority || {};
  function records() {
    var g = {}, st = dget('st', {}), notes = dget('notes', {});
    O.leads.list().filter(function (l) { return l.agent === C.agent; }).forEach(function (l) {
      var p = l.payload || {}, k = p.convo || ('L' + l.timestamp + l.name), r = g[k] || (g[k] = { key: k, convo: p.convo, leads: [], name: '', contact: '', email: '', phone: '', t: 0, first: Infinity, source: l.source, channel: l.channel, value: 0 });
      r.leads.push(l); r.t = Math.max(r.t, Date.parse(l.timestamp)); r.first = Math.min(r.first, Date.parse(l.timestamp));
      if (l.name && l.name !== 'Website visitor') r.name = l.name; if (l.email) r.email = l.email; if (l.phone) r.phone = l.phone; var v = C.value(l); if (v > r.value) r.value = v;
    });
    return Object.keys(g).map(function (k) {
      var r = g[k]; r.leads.sort(function (a, b) { return (PRI[b.intent] || 0) - (PRI[a.intent] || 0) || Date.parse(b.timestamp) - Date.parse(a.timestamp); });
      var top = r.leads[0], c = r.convo && O.convos.get(r.convo); if (!r.name && c && c.user && c.user.name) r.name = c.user.name; if (!r.name) r.name = 'Website visitor';
      if (c && c.user) { r.email = r.email || c.user.email || ''; r.phone = r.phone || c.user.phone || ''; }
      r.intent = top.intent; r.what = (C.intents[top.intent] || [top.intent])[0]; r.tone = (C.intents[top.intent] || [0, 'mute'])[1]; r.detail = C.detail(top);
      r.status = st[k] || (C.booked && C.booked.indexOf(top.intent) >= 0 ? 'booked' : 'new'); r.notes = notes[k] || []; r.c = c || null;
      var lu = c && c.messages.filter(function (m) { return m.from === 'user'; }).pop(); r.last = r.notes[0] ? { t: r.notes[0].t, m: r.notes[0].m, by: r.notes[0].by } : lu ? { t: lu.ts, m: plain(lu.text), by: r.name.split(' ')[0] } : null;
      var co = dget('contact', {})[k]; if (co) { if (/@/.test(co)) r.email = r.email || co; else r.phone = r.phone || co; }
      r.contact = r.phone || r.email; return r;
    }).sort(function (a, b) { return b.t - a.t; });
  }
  var STL = { new: ['New', 'acc'], contacted: ['Contacted', 'info'], booked: ['Booked', 'ok'], won: ['Won', 'ok'], lost: ['Lost', 'mute'] };
  function stPill(s) { var x = STL[s] || STL.new; return '<span class="pill ' + x[1] + '">' + x[0] + '</span>'; }
  function setStatus(keys, s, quiet) { var st = dget('st', {}), prev = {}; keys.forEach(function (k) { prev[k] = st[k]; st[k] = s; }); dset('st', st); if (!quiet) logAct(plural(keys.length, 'lead') + ' marked ' + STL[s][0].toLowerCase(), 'check'); return function () { var s2 = dget('st', {}); keys.forEach(function (k) { if (prev[k]) s2[k] = prev[k]; else delete s2[k]; }); dset('st', s2); }; }
  function bookings() { return db(C.bookings.key).slice().map(function (b) { b.at = isoT(b.date, b.time); return b; }).sort(function (a, b) { return a.at - b.at; }); }
  function convos() { return O.convos.list().filter(function (c) { return c.agent === C.agent && (c.engaged || c.status !== 'bot'); }); }
  function waiting() { return convos().filter(function (c) { return c.status === 'waiting'; }); }

  /* ───────── shell ───────── */
  var view, layer, route = {}, sel = {}, sort = { k: 't', d: -1 }, chan = dget('chan', 'all');
  function chanOk(x) { return chan === 'all' || x.channel === chan; }
  var NAV = [
    { k: 'home', l: 'Today', i: 'home' },
    { k: 'leads', l: 'Leads', i: 'leads', ct: function () { return records().filter(function (r) { return r.status === 'new' && chanOk(r); }).length; } },
    { k: 'bookings', l: C.bookings.label, i: 'cal', ct: function () { return bookings().filter(function (b) { return b.status === 'confirmed' && b.at > Date.now() - 2 * H; }).length; }, quiet: true },
    { k: 'chats', l: 'Conversations', i: 'chat', ct: function () { return waiting().length; }, hot: true }
  ].concat(C.extra ? [{ k: 'extra', l: C.extra.label, i: 'box', ct: function () { return db(C.extra.key).filter(function (x) { return x.status === 'to pack'; }).length; }, hot: true }] : []).concat([{ k: 'projects', l: C.projects.label, i: 'proj', ct: function () { return db(C.projects.key).length; }, quiet: true }]);
  function shell() {
    doc.body.insertAdjacentHTML('beforeend', '<div class="app">' +
      '<aside class="side" id="side" aria-label="Desk navigation"><a class="brand" href="#/"><span class="mark" aria-hidden="true"><i></i><i></i><i></i></span><span><b>' + esc(C.brand) + '</b><small>' + esc(C.app) + '</small></span></a>' +
      '<button class="side-q" type="button" data-k="pal">' + ic('search', 15) + '<span>Search or jump to…</span><kbd>' + (mac ? '⌘' : 'Ctrl ') + 'K</kbd></button><nav class="nav" id="nav" aria-label="Sections"></nav><div class="views" id="views"></div>' +
      '<div class="side-ft"><a class="side-a" href="' + esc(C.site) + '" target="_blank" rel="noopener">' + ic('ext', 15) + 'Open the website chat</a><button class="side-a" type="button" data-k="keys">' + ic('kbd', 15) + 'Keyboard shortcuts <kbd>?</kbd></button><div class="me">' + av(C.user.name) + '<span><b>' + esc(C.user.name) + '</b><small>' + esc(C.user.role) + '</small></span></div></div></aside>' +
      '<div class="main"><header class="top"><nav class="crumbs" id="crumbs" aria-label="Breadcrumb"></nav><div class="top-r"><label class="vh" for="chan">Channel</label><span class="chan">' + ic('filter', 14) + '<select id="chan"><option value="all">All channels</option><option value="web">Website chat</option><option value="whatsapp">WhatsApp</option></select></span>' +
      '<button class="top-q" type="button" data-k="pal" aria-label="Search">' + ic('search', 15) + '<span>Search</span><kbd>' + (mac ? '⌘' : 'Ctrl ') + 'K</kbd></button><button class="btn pri" type="button" data-k="new" aria-haspopup="menu" aria-label="New">' + ic('plus', 15) + '<span>New</span></button><span class="live" title="Updates as the website chat talks to visitors"><i></i>Live</span></div></header>' +
      '<main class="view" id="view" tabindex="-1"></main></div>' +
      '<nav class="tabbar" aria-label="Sections"></nav></div><div class="layer" id="layer"></div><div class="toasts" id="toasts" aria-live="polite"></div>');
    view = $('#view'); layer = $('#layer'); $('#chan').value = chan;
    $('#chan').addEventListener('change', function () { chan = this.value; dset('chan', chan); render(); });
  }
  function navHtml(mobile) { return NAV.map(function (n) { var c = n.ct ? n.ct() : 0; return '<a class="nv" href="#/' + (n.k === 'home' ? '' : n.k) + '" data-nav="' + n.k + '"' + (route.name === n.k ? ' aria-current="page"' : '') + '>' + ic(n.i, mobile ? 20 : 16) + '<span>' + esc(mobile && n.k === 'bookings' ? C.bookings.short : n.l) + '</span>' + (c ? '<em class="ct' + (n.hot && c ? ' hot' : n.quiet ? ' q' : '') + '">' + c + '</em>' : '') + '</a>'; }).join(''); }
  function chrome() {
    $('#nav').innerHTML = navHtml(); $('.tabbar').innerHTML = navHtml(true).replace(/<a class="nv" href="#\/projects"[\s\S]*?<\/a>/, '');
    var V = dget('views', null) || C.views; $('#views').innerHTML = '<h3>Saved views</h3>' + V.map(function (v) { return '<a class="nv sub" href="#/leads?' + esc(v.q) + '"' + (route.name === 'leads' && route.qs === v.q ? ' aria-current="page"' : '') + '>' + ic('filter', 14) + '<span>' + esc(v.name) + '</span></a>'; }).join('');
  }
  function crumbs(list) { $('#crumbs').innerHTML = list.map(function (c, i) { return i === list.length - 1 ? '<b>' + esc(c[0]) + '</b>' : '<a href="' + c[1] + '">' + esc(c[0]) + '</a><span aria-hidden="true">/</span>'; }).join(''); }

  /* ───────── toasts, menus, overlays ───────── */
  function toast(msg, o) {
    o = o || {}; var t = doc.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.innerHTML = ic(o.icon || 'check', 15) + '<span>' + msg + '</span>' + (o.undo ? '<button type="button">Undo</button>' : '') + (o.action ? '<button type="button" data-x>' + esc(o.action[0]) + '</button>' : '');
    $('#toasts').appendChild(t); var done = false; function kill() { if (done) return; done = true; t.classList.add('out'); setTimeout(function () { t.remove(); }, 220); }
    if (o.undo) $('button', t).addEventListener('click', function () { o.undo(); kill(); render(); }); if (o.action) $('[data-x]', t).addEventListener('click', function () { o.action[1](); kill(); });
    setTimeout(kill, o.undo ? 6500 : 3400);
  }
  var menuEl = null;
  function menu(anchor, items) {
    if (menuEl) { menuEl.remove(); menuEl = null; } var p = doc.createElement('div'); p.className = 'pop'; p.setAttribute('role', 'menu');
    p.innerHTML = items.map(function (it, i) { return it.sep ? '<hr>' : '<button type="button" role="menuitem" data-i="' + i + '">' + (it.icon ? ic(it.icon, 15) : '') + '<span>' + it.label + '</span>' + (it.kbd ? '<kbd>' + it.kbd + '</kbd>' : '') + '</button>'; }).join('');
    doc.body.appendChild(p); var r = anchor.getBoundingClientRect(), w = p.offsetWidth, x = Math.min(innerWidth - w - 8, Math.max(8, r.right - w)), y = r.bottom + 6; if (y + p.offsetHeight > innerHeight - 8) y = r.top - p.offsetHeight - 6; p.style.left = x + 'px'; p.style.top = y + 'px'; menuEl = p;
    function close() { if (!p.parentNode) return; p.remove(); menuEl = null; doc.removeEventListener('mousedown', out, true); doc.removeEventListener('keydown', key, true); }
    function out(e) { if (!p.contains(e.target) && !anchor.contains(e.target)) close(); }
    function key(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); anchor.focus(); } if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var b = $$('button', p), i = b.indexOf(doc.activeElement); i = e.key === 'ArrowDown' ? Math.min(b.length - 1, i + 1) : Math.max(0, i - 1); b[i].focus(); } }
    p.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (!b) return; var it = items[+b.getAttribute('data-i')]; close(); it.run(); });
    doc.addEventListener('mousedown', out, true); doc.addEventListener('keydown', key, true); setTimeout(function () { var f = $('button', p); if (f) f.focus(); }, 10);
  }
  var stack = [];
  function overlay(html, o) {
    o = o || {}; var ov = doc.createElement('div'); ov.className = 'ov ' + (o.cls || ''); ov.innerHTML = html; layer.appendChild(ov); var opener = doc.activeElement, box = ov.firstElementChild;
    var api = { el: box, close: function () { if (api.closed) return; api.closed = true; stack.splice(stack.indexOf(api), 1); ov.classList.add('out'); setTimeout(function () { ov.remove(); }, reduce ? 0 : 200); doc.body.classList.toggle('lock', !!stack.length); try { opener && opener.focus({ preventScroll: true }); } catch (e) {} if (o.onClose) o.onClose(); } };
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) api.close(); }); box.addEventListener('keydown', function (e) { if (e.key !== 'Tab') return; var f = $$('button,a[href],input,select,textarea', box).filter(function (x) { return x.offsetParent; }); if (!f.length) return; if (e.shiftKey && doc.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && doc.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); } });
    stack.push(api); doc.body.classList.add('lock'); setTimeout(function () { var f = $('[autofocus]', box) || $('input,textarea,select', box) || $('button', box); if (f) f.focus({ preventScroll: true }); }, 50); return api;
  }

  /* ───────── views ───────── */
  var V = {};
  function kpi(lbl, v, d, href, spark, on) { return '<a class="kpi' + (on ? ' on' : '') + '" href="' + href + '"><span class="l">' + lbl + '</span><span class="v">' + v + '</span><span class="d">' + d + '</span>' + (spark ? sparkSvg(spark) : '') + '</a>'; }
  function sparkSvg(vals) { var mx = Math.max.apply(null, vals.concat([1])), n = vals.length - 1, pts = vals.map(function (v, i) { return [i / n * 100, 28 - v / mx * 24]; }), d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(''); return '<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path class="ar" d="' + d + 'L100 30L0 30Z"/><path d="' + d + '"/></svg>'; }
  function delta(a, b) { if (!b && !a) return '<span class="mute">no change</span>'; if (b < 4) return '<span class="' + (a >= b ? 'up' : 'dn') + '">' + (a >= b ? '+' : '−') + Math.abs(a - b) + '</span> on last week (' + b + ')'; var p = Math.round((a - b) / b * 100); return '<span class="' + (p >= 0 ? 'up' : 'dn') + '">' + (p >= 0 ? '↑ ' : '↓ ') + Math.abs(p) + '%</span> vs last week'; }
  V.home = function () {
    var R = records().filter(chanOk), now = Date.now(), wk = R.filter(function (r) { return r.first > now - 7 * DAY; }), pw = R.filter(function (r) { return r.first <= now - 7 * DAY && r.first > now - 14 * DAY; });
    var series = []; for (var i = 13; i >= 0; i--) { var d0 = dayStart(now - i * DAY); series.push(R.filter(function (r) { return r.first >= d0 && r.first < d0 + DAY; }).length); }
    var B = bookings().filter(function (b) { return b.status !== 'cancelled'; }), up = B.filter(function (b) { return b.at > now - H && b.at < now + 7 * DAY; }), W = waiting(), open = R.filter(function (r) { return r.status !== 'lost' && r.status !== 'won'; }), pipe = open.reduce(function (a, r) { return a + r.value; }, 0);
    var need = [];
    W.forEach(function (c) { need.push(['#/chats/' + c.id, 'chat', 'acc', (c.user && c.user.name || 'A visitor') + ' is waiting in chat', 'Handed over ' + ago(c.handoverAt || c.updatedAt) + ' · “' + plain((c.messages.filter(function (m) { return m.from === 'user'; }).pop() || {}).text).slice(0, 70) + '”']); });
    R.filter(function (r) { return r.status === 'new' && now - r.t > 20 * H; }).slice(0, 3).forEach(function (r) { need.push(['#/leads/' + encodeURIComponent(r.key), 'phone', 'warn', r.name + ': no reply yet', r.what + (r.detail ? ' · ' + r.detail : '') + ' · came in ' + ago(r.first)]); });
    up.filter(function (b) { return b.at - now < 30 * H && b.at > now; }).forEach(function (b) { need.push(['#/bookings', 'cal', 'ok', C.bookings.one.charAt(0).toUpperCase() + C.bookings.one.slice(1) + ' with ' + b.name + ' ' + relLow(b.at) + ', ' + hm(b.at), C.bookings.line(b)]); });
    (C.attention ? C.attention(db) : []).forEach(function (x) { need.push(x); });
    var hr = new Date().getHours(), act = dget('act', []).slice(0, 7), newOnes = R.filter(function (r) { return r.status === 'new' && (r.phone || r.email); });
    crumbs([['Today', '#/']]);
    return '<div class="hello"><div><h1>Good ' + (hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening') + ', ' + esc(C.user.first) + '</h1><p>' + fD(now) + ' · ' + (need.length ? plural(need.length, 'thing needs', 'things need') + ' you' : 'Nothing needs you right now') + (chan !== 'all' ? ' · showing ' + (chan === 'web' ? 'website chat' : 'WhatsApp') + ' only' : '') + '</p></div>' + (newOnes.length ? '<a class="btn pri" href="#/call">' + ic('play', 14) + 'Start call queue <kbd>C</kbd></a>' : '') + '</div>' +
      '<div class="kpis">' + kpi('New leads · 7 days', wk.length, delta(wk.length, pw.length), '#/leads?v=week', series) + kpi(C.bookings.label + ' ahead', up.length, up[0] ? 'Next: ' + rel(up[0].at) + ', ' + hm(up[0].at) : 'Nothing booked', '#/bookings') + kpi('Waiting in chat', W.length, W.length ? '<span class="dn">Longest ' + ago(Math.min.apply(null, W.map(function (c) { return c.handoverAt || c.updatedAt; }))).replace(' ago', '') + '</span>' : 'The concierge has it', '#/chats?f=waiting') + kpi('Open pipeline', C.money(pipe), plural(open.length, 'open lead'), '#/leads?s=open') + '</div>' +
      '<div class="grid2"><section class="card"><header><h2>Needs you</h2><span class="sub">' + need.length + '</span></header><div class="todo">' + (need.length ? need.map(function (n) { return '<a href="' + n[0] + '"><span class="ico ' + n[2] + '">' + ic(n[1], 15) + '</span><span><b>' + esc(n[3]) + '</b><small>' + esc(n[4]) + '</small></span>' + ic('arrow', 14) + '</a>'; }).join('') : empty('check', 'All clear', 'Every lead has a reply and nobody is waiting.')) + '</div></section>' +
      '<div><section class="card"><header><h2>Now and next</h2><a class="sub lnk" href="#/bookings">' + esc(C.bookings.label) + '</a></header><div class="next">' + (up.length ? up.slice(0, 4).map(function (b) { var live = b.at < now && b.at > now - H; return '<div class="nx' + (live ? ' live' : '') + '"><span class="nx-t"><b>' + hm(b.at) + '</b><small>' + rel(b.at) + '</small></span><span class="nx-b"><b>' + esc(b.name) + '</b><small>' + esc(C.bookings.line(b)) + '</small></span>' + (live ? '<span class="pill acc">Now</span>' : '') + '</div>'; }).join('') : empty('cal', 'Nothing booked yet', 'Bookings the website chat makes appear here.')) + '</div></section>' +
      '<section class="card"><header><h2>Activity</h2></header><ul class="feed">' + (act.length ? act.map(function (a) { return '<li>' + ic(a.i || 'bolt', 14) + '<span>' + esc(a.m) + '</span><small>' + ago(a.t) + '</small></li>'; }).join('') : '<li class="mute">Quiet so far.</li>') + '</ul></section></div></div>';
  };
  function leadRows(R) {
    return R.map(function (r) { return '<tr data-key="' + esc(r.key) + '" tabindex="0"><td class="cb"><label class="ck"><input type="checkbox" aria-label="Select ' + esc(r.name) + '"' + (sel[r.key] ? ' checked' : '') + '><span></span></label></td><td class="who">' + av(r.name) + '<span><b>' + esc(r.name) + '</b><small>' + esc(r.contact || 'No contact yet') + '</small></span></td><td class="what"><span class="pill ' + r.tone + '">' + esc(r.what) + '</span><small>' + esc(r.detail) + '</small></td><td class="num">' + (r.value ? C.money(r.value) : '<span class="faint">—</span>') + '</td><td class="hide-s">' + esc(r.source || '') + (r.convo ? ' <span class="tag">from chat</span>' : '') + '</td><td>' + stPill(r.status) + '</td><td class="num mute">' + ago(r.t) + '</td></tr>'; }).join('');
  }
  V.leads = function () {
    var q = route.q, v = q.get('v') || '', s = q.get('s') || '', t = q.get('q') || '', R = records().filter(chanOk), now = Date.now();
    if (v === 'chat') R = R.filter(function (r) { return r.convo; }); if (v === 'week') R = R.filter(function (r) { return r.first > now - 7 * DAY; }); if (v === 'high') R = R.filter(function (r) { return r.value >= C.high; }); if (v === 'booked') R = R.filter(function (r) { return r.status === 'booked'; });
    var all = R.length; if (s === 'open') R = R.filter(function (r) { return r.status !== 'won' && r.status !== 'lost'; }); else if (s) R = R.filter(function (r) { return r.status === s; });
    if (t) R = R.filter(function (r) { return (r.name + ' ' + r.contact + ' ' + r.what + ' ' + r.detail).toLowerCase().indexOf(t.toLowerCase()) >= 0; });
    R.sort(function (a, b) { var x = sort.k === 'name' ? a.name.localeCompare(b.name) : sort.k === 'value' ? a.value - b.value : a.t - b.t; return x * sort.d; });
    var cnt = {}; records().filter(chanOk).forEach(function (r) { cnt[r.status] = (cnt[r.status] || 0) + 1; });
    var V2 = dget('views', null) || C.views, vname = (V2.filter(function (x) { return x.q === route.qs; })[0] || {}).name;
    crumbs([['Leads', '#/leads']].concat(vname ? [[vname, '#/leads?' + route.qs]] : []));
    var sh = function (k, l, cls) { return '<th class="' + (cls || '') + '"><button type="button" data-sort="' + k + '" aria-label="Sort by ' + l + '">' + l + (sort.k === k ? ' ' + (sort.d < 0 ? '↓' : '↑') : '') + '</button></th>'; };
    return '<div class="ph"><div><h1>Leads</h1><p>Everyone the website chat has helped, newest first. One row per person, with every step they took.</p></div><div class="ph-a"><button class="btn" type="button" data-k="saveview">' + ic('star', 14) + 'Save this view</button><a class="btn pri" href="#/call">' + ic('play', 14) + 'Call queue</a></div></div>' +
      '<div class="fbar"><div class="seg" role="group" aria-label="Status">' + [['', 'All', all], ['new', 'New', cnt.new], ['contacted', 'Contacted', cnt.contacted], ['booked', 'Booked', cnt.booked], ['won', 'Won', cnt.won]].map(function (x) { return '<button type="button" data-s="' + x[0] + '" aria-pressed="' + (s === x[0]) + '">' + x[1] + (x[2] ? ' <em>' + x[2] + '</em>' : '') + '</button>'; }).join('') + '</div><span class="srch">' + ic('search', 14) + '<label class="vh" for="lq">Search leads</label><input id="lq" type="search" placeholder="Search names, rooms, numbers" value="' + esc(t) + '"></span></div>' +
      '<div class="tw"><table class="tb"><thead><tr><th class="cb"><label class="ck"><input type="checkbox" id="lall" aria-label="Select all"><span></span></label></th>' + sh('name', 'Name') + '<th>What happened</th>' + sh('value', 'Value', 'num') + '<th class="hide-s">Source</th><th>Status</th>' + sh('t', 'Last touch', 'num') + '</tr></thead><tbody>' + leadRows(R) + '</tbody></table>' + (R.length ? '' : empty('leads', t ? 'Nothing matches “' + esc(t) + '”' : 'No leads like that yet', 'When the website chat prices a job or books a ' + C.bookings.one + ', the person lands here.')) + '</div><div id="bulk"></div>';
  };
  V.call = function () {
    var Q = records().filter(function (r) { return r.status === 'new' && chanOk(r) && (r.phone || r.email); }), done = dget('callDone', 0), i = Math.min(route.i || 0, Q.length);
    crumbs([['Leads', '#/leads'], ['Call queue', '#/call']]);
    if (!Q.length) return '<div class="focus-wrap">' + empty('check', 'Queue cleared', 'Every new lead has been called. Nice work.', '<a class="btn pri" href="#/">Back to today</a>') + '</div>';
    var r = Q[0], mins = Q.length * 4;
    return '<div class="focus-wrap"><div class="focus-top"><a class="btn ghost" href="#/leads">' + ic('back', 14) + 'Leave queue</a><div class="meter"><span>Call <b>1</b> of ' + Q.length + '</span><i style="--p:' + Math.round(done / (done + Q.length) * 100) + '%"></i><span class="chip">' + ic('clock', 13) + '≈ ' + mins + ' m left</span><span class="chip">aim ≈ 4 m</span></div></div>' +
      '<section class="focus"><div class="f-hd">' + av(r.name, true) + '<div><h1>' + esc(r.name) + '</h1><p>' + esc(r.what) + ' · ' + esc(r.detail) + '</p></div>' + (r.value ? '<span class="f-val">' + C.money(r.value) + '</span>' : '') + '</div>' +
      (r.last ? '<blockquote class="last"><small>Last said · ' + esc(r.last.by) + ', ' + ago(r.last.t) + '</small>“' + esc(r.last.m) + '”</blockquote>' : '') +
      '<div class="f-grid"><div><span>Phone</span>' + (r.phone ? '<b>' + esc(r.phone) + '</b>' : '<button type="button" class="add" data-k="addc" data-key="' + esc(r.key) + '">+ Add phone</button>') + '</div><div><span>Email</span>' + (r.email ? '<b>' + esc(r.email) + '</b>' : '<button type="button" class="add" data-k="addc" data-key="' + esc(r.key) + '">+ Add email</button>') + '</div><div><span>Came from</span><b>' + esc(r.source || '—') + '</b></div><div><span>First seen</span><b>' + ago(r.first) + '</b></div></div>' +
      '<a class="btn call-btn" href="#/leads/' + encodeURIComponent(r.key) + '">' + ic('phone', 16) + (r.phone ? 'Call ' + esc(r.name.split(' ')[0]) + ' · ' + esc(r.phone) : 'Email ' + esc(r.name.split(' ')[0]) + ' · ' + esc(r.email)) + '</a>' +
      '<h2 class="og-h">How did it go?</h2><div class="og" role="group" aria-label="Call outcome">' + C.outcomes.map(function (o, k) { return '<button type="button" data-out="' + k + '" data-key="' + esc(r.key) + '">' + ic(o[1], 18) + '<span>' + o[0] + '</span><kbd>' + (k + 1) + '</kbd></button>'; }).join('') + '</div>' +
      '<label class="vh" for="cnote">Note for the next person</label><textarea id="cnote" rows="2" placeholder="A note for the next person (optional)…"></textarea><div class="f-ft"><button class="btn" type="button" data-k="skip" data-key="' + esc(r.key) + '">Skip</button><span class="mute">Pick an outcome to save and go to the next one.</span></div></section></div>';
  };
  V.bookings = function () {
    var L = bookings().filter(function (b) { return chanOk({ channel: /whatsapp/i.test(b.source || '') ? 'whatsapp' : 'web' }); }), now = Date.now(), up = L.filter(function (b) { return b.at > now - 3 * H && b.status !== 'cancelled'; }), past = L.filter(function (b) { return b.at <= now - 3 * H || b.status === 'cancelled'; }).reverse();
    var days = {}; up.forEach(function (b) { var k = dayStart(b.at); (days[k] = days[k] || []).push(b); });
    crumbs([[C.bookings.label, '#/bookings']]);
    function item(b) { return '<div class="bk' + (b.status === 'cancelled' ? ' off' : '') + '"><span class="bk-t"><b>' + hm(b.at) + '</b><small>' + esc(C.bookings.len(b)) + '</small></span><span class="bk-b">' + av(b.name) + '<span><b>' + esc(b.name) + '</b><small>' + esc(C.bookings.line(b)) + (b.note ? ' · ' + esc(b.note) : '') + '</small></span></span><span class="tag">' + esc(b.ref) + '</span>' + (b.convo ? '<a class="tag chatlink" href="#/chats/' + esc(b.convo) + '">from chat</a>' : '') + '<span class="bk-a">' + (b.status === 'confirmed' ? '<button class="btn sm" type="button" data-bk="done" data-ref="' + esc(b.ref) + '">' + ic('check', 14) + 'Done</button><button class="ib" type="button" data-bk="more" data-ref="' + esc(b.ref) + '" aria-label="More for ' + esc(b.ref) + '">' + ic('more', 16) + '</button>' : '<span class="pill ' + (b.status === 'done' ? 'ok' : 'mute') + '">' + (b.status === 'done' ? 'Done' : 'Cancelled') + '</span>') + '</span></div>'; }
    return '<div class="ph"><div><h1>' + esc(C.bookings.label) + '</h1><p>' + esc(C.bookings.blurb) + '</p></div></div>' +
      (Object.keys(days).length ? Object.keys(days).map(function (k) { return '<section class="day"><h2>' + rel(+k) + (rel(+k) === fD(+k) ? '' : ' · ' + fD(+k)) + '<span>' + plural(days[k].length, C.bookings.one) + '</span></h2>' + days[k].map(item).join('') + '</section>'; }).join('') : '<div class="card">' + empty('cal', 'Nothing booked ahead', 'When a visitor books in the website chat, it lands here with the full conversation.') + '</div>') +
      (past.length ? '<section class="day past"><h2>Earlier<span>' + past.length + '</span></h2>' + past.slice(0, 8).map(item).join('') + '</section>' : '');
  };
  V.extra = function () {
    var X = C.extra, L = db(X.key).slice().reverse(); crumbs([[X.label, '#/extra']]);
    return '<div class="ph"><div><h1>' + esc(X.label) + '</h1><p>' + esc(X.blurb) + '</p></div></div><div class="tw"><table class="tb"><thead><tr><th>Ref</th><th>For</th><th>' + esc(X.what) + '</th><th class="hide-s">Where</th><th>Status</th><th class="num">Asked</th><th><span class="vh">Action</span></th></tr></thead><tbody>' +
      L.map(function (k) { var nx = X.next(k.status); return '<tr><td><b class="mono">' + esc(k.ref) + '</b></td><td class="who">' + av(k.name) + '<span><b>' + esc(k.name) + '</b><small>' + esc(k.email || k.phone || '') + '</small></span></td><td>' + esc(X.items(k)) + '</td><td class="hide-s">' + esc(k.area || '') + '</td><td><span class="pill ' + (k.status === 'shipped' ? 'ok' : k.status === 'packed' ? 'info' : 'acc') + '">' + esc(k.status) + '</span></td><td class="num mute">' + ago(k.t) + '</td><td class="num">' + (nx ? '<button class="btn sm" type="button" data-kit="' + esc(k.ref) + '">' + esc(nx[1]) + '</button>' : '<span class="faint">—</span>') + '</td></tr>'; }).join('') + '</tbody></table>' + (L.length ? '' : empty('box', 'No kits asked for yet', 'Sample kits ordered in the website chat appear here.')) + '</div>';
  };
  V.projects = function () {
    var P = C.projects, L = db(P.key); crumbs([[P.label, '#/projects']]);
    return '<div class="ph"><div><h1>' + esc(P.label) + '</h1><p>' + esc(P.blurb) + '</p></div></div><div class="pgrid">' + L.map(function (p) {
      return '<section class="pc"><div class="pc-h"><span class="tag mono">' + esc(p.code) + '</span><b>' + esc(p.title) + '</b><small>' + esc(p.name) + ' · ' + esc(p.designer || p.crew) + '</small></div><ol class="stp" aria-label="Stage">' + P.stages.map(function (s, i) { return '<li class="' + (i < p.stage ? 'done' : i === p.stage ? 'cur' : '') + '"><button type="button" data-stage="' + i + '" data-code="' + esc(p.code) + '" aria-label="Move to ' + esc(s) + '" title="' + esc(s) + '"></button></li>'; }).join('') + '</ol><p class="pc-s"><b>' + esc(P.stages[p.stage]) + '</b> · ' + p.pct + '% · next: ' + esc(p.next) + ', ' + relLow(p.due) + '</p><blockquote>“' + esc(p.note) + '”</blockquote><p class="pc-f mute">What the chat tells ' + esc(p.name.split(' ')[0]) + ' when they ask. Click a dot to move the stage.</p></section>'; }).join('') + '</div>';
  };
  var chatSel = null, chatF = 'all', draft = {};
  V.chats = function () {
    var L = convos().filter(chanOk), f = route.q.get('f') || chatF; chatF = f; if (route.id) chatSel = route.id; else if (!chatSel && innerWidth > 760) { var w = L.filter(function (c) { return c.status === 'waiting'; })[0] || L[0]; chatSel = w ? w.id : null; }
    var n = { waiting: 0, human: 0, bot: 0 }; L.forEach(function (c) { n[c.status] = (n[c.status] || 0) + 1; }); var Lf = L.filter(function (c) { return f === 'all' || c.status === f; }).sort(function (a, b) { return (b.status === 'waiting') - (a.status === 'waiting') || b.updatedAt - a.updatedAt; });
    var c = chatSel && O.convos.get(chatSel); crumbs([['Conversations', '#/chats']].concat(c ? [[(c.user && c.user.name) || 'Visitor', '#/chats/' + c.id]] : []));
    return '<div class="ph"><div><h1>Conversations</h1><p>The concierge answers first. Anything it hands over waits here with the whole chat.</p></div><div class="ph-a"><a class="btn" href="' + esc(C.site) + '" target="_blank" rel="noopener">' + ic('ext', 14) + 'Open the website chat</a></div></div>' +
      '<div class="cx' + (c ? ' has' : '') + '"><aside class="cx-l"><div class="seg" role="group" aria-label="Filter">' + [['all', 'All'], ['waiting', 'Waiting'], ['human', 'With you'], ['bot', 'Bot'], ['resolved', 'Done']].map(function (x) { return '<button type="button" data-cf="' + x[0] + '" aria-pressed="' + (f === x[0]) + '">' + x[1] + (n[x[0]] && x[0] !== 'all' && x[0] !== 'resolved' ? ' <em>' + n[x[0]] + '</em>' : '') + '</button>'; }).join('') + '</div><div class="cx-list">' +
      (Lf.length ? Lf.map(function (k) { var nm = (k.user && k.user.name) || 'Website visitor', last = k.messages[k.messages.length - 1] || {}, lu = k.messages.filter(function (m) { return m.from === 'user'; }).pop(); return '<a class="cx-it' + (k.id === chatSel ? ' on' : '') + (k.status === 'waiting' ? ' wait' : '') + '" href="#/chats/' + esc(k.id) + '">' + av(nm) + '<span><span class="r1"><b>' + esc(nm) + '</b><small>' + (k.status === 'waiting' ? '<em class="w">' + ago(k.handoverAt || k.updatedAt).replace(' ago', '') + '</em>' : ago(k.updatedAt).replace(' ago', '')) + '</small></span><span class="r2">' + esc(plain((k.status === 'waiting' && lu ? lu : last).text).slice(0, 80)) + '</span><span class="r3">' + chatPill(k.status) + '<small>' + (k.channel === 'whatsapp' ? 'WhatsApp' : 'Website') + '</small></span></span></a>'; }).join('') : '<p class="cx-none">' + (f === 'waiting' ? 'Nobody is waiting. The concierge has it.' : 'No conversations yet. Try the website chat.') + '</p>') +
      '</div></aside><section class="cx-t">' + (c ? thread(c) : empty('chat', 'Pick a conversation', 'Chats the concierge hands over show up here as Waiting.')) + '</section></div>';
  };
  function chatPill(s) { return '<span class="pill ' + { bot: 'ok', waiting: 'warn', human: 'acc', resolved: 'mute' }[s] + '">' + { bot: 'Concierge', waiting: 'Waiting', human: 'With you', resolved: 'Done' }[s] + '</span>'; }
  function thread(c) {
    var nm = (c.user && c.user.name) || 'Website visitor', st = c.status, lu = c.messages.filter(function (m) { return m.from === 'user'; }).pop(), rec = records().filter(function (r) { return r.convo === c.id; })[0];
    var acts = st === 'waiting' ? '<button class="btn pri" type="button" data-cx="take">' + ic('user', 14) + 'Take over <kbd>T</kbd></button>' : st === 'bot' ? '<button class="btn" type="button" data-cx="take">Join</button>' : st === 'human' ? '<button class="btn" type="button" data-cx="back">' + ic('reset', 14) + 'Hand back</button><button class="btn pri" type="button" data-cx="resolve">' + ic('check', 14) + 'Resolve</button>' : '<button class="btn" type="button" data-cx="reopen">Reopen</button>';
    return '<div class="th-h"><a class="ib show-s" href="#/chats" aria-label="Back to the list">' + ic('back', 16) + '</a>' + av(nm) + '<div><h2>' + esc(nm) + '</h2><small>' + (c.channel === 'whatsapp' ? 'WhatsApp' : 'Website chat') + (c.source && !/^(Website chat|WhatsApp)$/.test(c.source) ? ' · ' + esc(c.source) : '') + (rec ? ' · <a class="lnk" href="#/leads/' + encodeURIComponent(rec.key) + '">' + esc(rec.what) + '</a>' : '') + '</small></div><div class="th-a">' + acts + '<button class="ib" type="button" data-cx="more" aria-label="More actions">' + ic('more', 16) + '</button></div></div>' +
      (lu && st !== 'bot' ? '<div class="last sm"><small>Last said' + (c.handoverReason && st === 'waiting' ? ' · ' + esc(c.handoverReason.toLowerCase()) : '') + '</small>“' + esc(plain(lu.text)) + '”</div>' : '') +
      '<div class="th-log" role="log" aria-label="Transcript">' + c.messages.map(function (m) { if (m.kind === 'system' || m.from === 'system') return '<div class="m-sys"><span>' + esc(plain(m.text)) + ' · ' + hm(m.ts) + '</span></div>'; var me = m.from === 'agent', bot = m.from === 'bot'; return '<div class="m ' + (me ? 'a' : bot ? 'b' : 'u') + '"><small>' + (me ? esc(m.name || C.user.first) : bot ? 'Concierge' : esc(nm.split(' ')[0])) + ' · ' + hm(m.ts) + '</small><div>' + fmt(m.text) + (m.cards && m.cards.length ? '<p class="m-cards">' + m.cards.map(function (k) { return '<span>' + esc(k.title) + (k.price ? ' · ' + esc(k.price) : '') + '</span>'; }).join('') + '</p>' : '') + '</div></div>'; }).join('') + '</div>' +
      (st === 'human' ? '<div class="comp"><div class="macros">' + C.macros.map(function (t, i) { return '<button type="button" data-mac="' + i + '">' + esc(t.replace('{name}', nm.split(' ')[0])) + '</button>'; }).join('') + '</div><div class="comp-r"><label class="vh" for="cxin">Reply</label><textarea id="cxin" rows="2" placeholder="Reply as ' + esc(C.user.first) + '… (Enter to send)">' + esc(draft[c.id] || '') + '</textarea><button class="btn pri" type="button" data-cx="send">Send</button></div></div>' : '<p class="hint">' + (st === 'waiting' ? ic('clock', 14) + nm.split(' ')[0] + ' was told a person is coming. Take over to reply.' : st === 'bot' ? ic('bolt', 14) + 'The concierge is handling this live.' : ic('check', 14) + 'Resolved.') + '</p>');
  }
  function empty(i, t, b, a) { return '<div class="empty"><span class="art">' + ic(i, 22) + '</span><h3>' + t + '</h3><p>' + b + '</p>' + (a || '') + '</div>'; }

  /* ───────── record slide-over ───────── */
  function openRecord(key) {
    var r = records().filter(function (x) { return x.key === key; })[0]; if (!r) return;
    var c = r.c, msgs = c ? c.messages.filter(function (m) { return m.from === 'user' || m.from === 'agent'; }).slice(-6) : [];
    var html = '<aside class="so" role="dialog" aria-modal="true" aria-labelledby="soT"><header>' + av(r.name, true) + '<div><h2 id="soT">' + esc(r.name) + '</h2><p>' + esc(r.what) + (r.value ? ' · ' + C.money(r.value) : '') + '</p></div><button class="ib" type="button" data-so="close" aria-label="Close">' + ic('x', 16) + '</button></header>' +
      '<div class="so-b"><div class="so-st"><span>Status</span><div class="seg" role="group" aria-label="Status">' + Object.keys(STL).map(function (s) { return '<button type="button" data-so="st" data-v="' + s + '" aria-pressed="' + (r.status === s) + '">' + STL[s][0] + '</button>'; }).join('') + '</div></div>' +
      (r.last ? '<blockquote class="last"><small>Last said · ' + esc(r.last.by) + ', ' + ago(r.last.t) + '</small>“' + esc(r.last.m) + '”</blockquote>' : '') +
      '<div class="f-grid"><div><span>Phone</span>' + (r.phone ? '<b>' + esc(r.phone) + '</b>' : '<button type="button" class="add" data-so="addc">+ Add phone</button>') + '</div><div><span>Email</span>' + (r.email ? '<b>' + esc(r.email) + '</b>' : '<button type="button" class="add" data-so="addc">+ Add email</button>') + '</div><div><span>Came from</span><b>' + esc(r.source || '—') + '</b></div><div><span>Channel</span><b>' + (r.channel === 'whatsapp' ? 'WhatsApp' : 'Website chat') + '</b></div></div>' +
      '<h3>What happened</h3><ol class="tl">' + r.leads.slice().reverse().map(function (l) { var x = C.intents[l.intent] || [l.intent, 'mute']; return '<li><span class="pill ' + x[1] + '">' + esc(x[0]) + '</span><span>' + esc(C.detail(l)) + '</span><small>' + ago(Date.parse(l.timestamp)) + '</small></li>'; }).join('') + r.notes.slice().reverse().map(function (n) { return '<li class="note">' + ic('note', 14) + '<span>' + esc(n.m) + '</span><small>' + esc(n.by) + ' · ' + ago(n.t) + '</small></li>'; }).join('') + '</ol>' +
      (c ? '<h3>From the chat <a class="lnk" href="#/chats/' + esc(c.id) + '" data-so="close2">Open transcript →</a></h3><div class="mini">' + msgs.map(function (m) { return '<p class="' + (m.from === 'agent' ? 'a' : 'u') + '"><small>' + (m.from === 'agent' ? esc(m.name || C.user.first) : esc(r.name.split(' ')[0])) + '</small>' + esc(plain(m.text)) + '</p>'; }).join('') + '</div>' : '') +
      '<h3>Add a note</h3><label class="vh" for="soN">Note</label><textarea id="soN" rows="2" placeholder="What did you agree? (Enter to save)"></textarea></div>' +
      '<footer><button class="btn" type="button" data-so="lost">Mark lost</button><span class="grow"></span>' + (r.status === 'new' ? '<button class="btn" type="button" data-so="st" data-v="contacted">' + ic('phone', 14) + 'Contacted</button>' : '') + '<button class="btn pri" type="button" data-so="st" data-v="' + (r.status === 'booked' ? 'won' : 'booked') + '">' + ic('check', 14) + (r.status === 'booked' ? 'Mark won' : 'Mark booked') + '</button></footer></aside>';
    var api = overlay(html, { cls: 'so-ov', onClose: function () { if (route.name === 'leads' && route.id) { history.replaceState(null, '', '#/leads' + (route.qs ? '?' + route.qs : '')); route.id = ''; } } });
    api.el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-so]'); if (!b) return; var k = b.getAttribute('data-so');
      if (k === 'close') api.close(); else if (k === 'close2') { api.close(); }
      else if (k === 'st' || k === 'lost') { var v = k === 'lost' ? 'lost' : b.getAttribute('data-v'), undo = setStatus([r.key], v); api.close(); render(); toast(esc(r.name) + ' marked ' + STL[v][0].toLowerCase() + '.', { undo: undo }); }
      else if (k === 'addc') { api.close(); addContact(r); }
    });
    $('#soN', api.el).addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && this.value.trim()) { e.preventDefault(); var nt = dget('notes', {}); (nt[r.key] = nt[r.key] || []).unshift({ t: Date.now(), m: this.value.trim(), by: C.user.first }); dset('notes', nt); logAct('Note on ' + r.name + ': ' + this.value.trim().slice(0, 60), 'note'); var v = this.value; api.close(); render(); openRecord(r.key); toast('Note saved.', { undo: function () { var n2 = dget('notes', {}); (n2[r.key] || []).shift(); dset('notes', n2); } }); } });
  }
  function addContact(r) {
    var api = overlay('<div class="md" role="dialog" aria-modal="true" aria-labelledby="acT"><header><h2 id="acT">Add a contact for ' + esc(r.name) + '</h2><button class="ib" type="button" data-x aria-label="Close">' + ic('x', 16) + '</button></header><label class="fl"><span>Phone or email</span><input id="acV" autocomplete="off" placeholder="name@example.com"></label><p class="err" id="acE" role="alert"></p><footer><button class="btn" type="button" data-x>Cancel</button><button class="btn pri" type="button" data-ok>Save</button></footer></div>');
    $$('[data-x]', api.el).forEach(function (b) { b.addEventListener('click', api.close); });
    function save() { var v = $('#acV').value.trim(), em = O.nlp.email(v), ph = O.nlp.phone(v); if (!em && !ph) { $('#acE').textContent = 'That isn’t a phone number or an email address yet. Check for a missing digit or @.'; return; } var c = r.c; if (c) { c.user = c.user || {}; if (em) c.user.email = em; else c.user.phone = ph; O.convos.put(c); } else { var nt = dget('contact', {}); nt[r.key] = v; dset('contact', nt); } api.close(); render(); toast('Saved. ' + esc(r.name.split(' ')[0]) + ' can be reached on ' + esc(em || ph) + '.'); }
    $('[data-ok]', api.el).addEventListener('click', save); $('#acV').addEventListener('keydown', function (e) { if (e.key === 'Enter') save(); });
  }

  /* ───────── command palette ───────── */
  function palette() {
    if (stack.some(function (s) { return s.pal; })) return;
    var api = overlay('<div class="pal" role="dialog" aria-modal="true" aria-label="Search and commands"><div class="pal-in">' + ic('search', 16) + '<input type="text" role="combobox" aria-expanded="true" aria-controls="palL" placeholder="Search leads, ' + esc(C.bookings.label.toLowerCase()) + ', ' + esc(C.projects.label.toLowerCase()) + ' or type a command…" autocomplete="off" autofocus><kbd>esc</kbd></div><div class="pal-l" id="palL" role="listbox"></div></div>', { cls: 'pal-ov' }); api.pal = true;
    var inp = $('input', api.el), list = $('#palL', api.el), items = [], cur = 0;
    var CMD = [['Go to Today', 'home', '#/'], ['Go to Leads', 'leads', '#/leads'], ['Start the call queue', 'play', '#/call'], ['Go to ' + C.bookings.label, 'cal', '#/bookings'], ['Go to Conversations', 'chat', '#/chats'], ['Go to ' + C.projects.label, 'proj', '#/projects']].concat(C.extra ? [['Go to ' + C.extra.label, 'box', '#/extra']] : []).concat([['Add a lead by hand', 'plus', 'new'], ['Open the website chat', 'ext', 'site']]);
    function build() {
      var q = inp.value.trim().toLowerCase(), out = [];
      if (q) { records().forEach(function (r) { if ((r.name + ' ' + r.contact + ' ' + r.detail).toLowerCase().indexOf(q) >= 0) out.push({ g: 'Leads', l: r.name, s: r.what + ' · ' + r.detail, i: 'user', h: '#/leads/' + encodeURIComponent(r.key) }); });
        bookings().forEach(function (b) { if ((b.name + ' ' + b.ref).toLowerCase().indexOf(q) >= 0) out.push({ g: C.bookings.label, l: b.ref + ' · ' + b.name, s: rel(b.at) + ', ' + hm(b.at), i: 'cal', h: '#/bookings' }); });
        db(C.projects.key).forEach(function (p) { if ((p.code + ' ' + p.name + ' ' + p.title).toLowerCase().indexOf(q) >= 0) out.push({ g: C.projects.label, l: p.code + ' · ' + p.title, s: C.projects.stages[p.stage], i: 'proj', h: '#/projects' }); }); }
      CMD.forEach(function (c) { if (!q || c[0].toLowerCase().indexOf(q) >= 0) out.push({ g: 'Commands', l: c[0], i: c[1], h: c[2] }); });
      items = out.slice(0, 12); var g = '';
      list.innerHTML = items.map(function (it, i) { var h = (it.g !== g ? '<h4>' + esc(it.g) + '</h4>' : ''); g = it.g; return h + '<button type="button" role="option" id="pi' + i + '" data-i="' + i + '" aria-selected="' + (i === cur) + '">' + ic(it.i, 15) + '<span>' + esc(it.l) + '</span>' + (it.s ? '<small>' + esc(it.s) + '</small>' : '') + '</button>'; }).join('') || '<p class="pal-e">Nothing matches “' + esc(inp.value) + '”.</p>';
    }
    function run(i) { var it = items[i]; if (!it) return; api.close(); if (it.h === 'new') newLead(); else if (it.h === 'site') open(C.site, '_blank'); else location.hash = it.h; }
    inp.addEventListener('input', function () { cur = 0; build(); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); cur = Math.max(0, Math.min(items.length - 1, cur + (e.key === 'ArrowDown' ? 1 : -1))); $$('[data-i]', list).forEach(function (b, i) { b.setAttribute('aria-selected', i === cur); }); var b = $('#pi' + cur, list); if (b) b.scrollIntoView({ block: 'nearest' }); } else if (e.key === 'Enter') { e.preventDefault(); run(cur); } else if (e.key === 'Escape') api.close(); });
    list.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) run(+b.getAttribute('data-i')); }); build();
  }
  function newLead() {
    var api = overlay('<div class="md" role="dialog" aria-modal="true" aria-labelledby="nlT"><header><h2 id="nlT">Add a lead</h2><button class="ib" type="button" data-x aria-label="Close">' + ic('x', 16) + '</button></header><label class="fl"><span>Name</span><input id="nlN" autocomplete="off" placeholder="Full name"></label><label class="fl"><span>Phone or email</span><input id="nlC" autocomplete="off"></label><label class="fl"><span>' + esc(C.newLead.label) + '</span><select id="nlW">' + C.newLead.options.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select></label><p class="err" id="nlE" role="alert"></p><footer><button class="btn" type="button" data-x>Cancel</button><button class="btn pri" type="button" data-ok>Add lead</button></footer></div>');
    $$('[data-x]', api.el).forEach(function (b) { b.addEventListener('click', api.close); });
    $('[data-ok]', api.el).addEventListener('click', function () { var n = $('#nlN').value.trim(), c = $('#nlC').value.trim(); if (n.length < 2) { $('#nlE').textContent = 'Add a name so the team knows who to ask for.'; $('#nlN').focus(); return; } var em = O.nlp.email(c), ph = O.nlp.phone(c); if (c && !em && !ph) { $('#nlE').textContent = 'That contact isn’t a phone number or an email yet.'; $('#nlC').focus(); return; }
      O.leads.add({ name: n, email: em || undefined, phone: ph || '', source: 'Walk-in or call', channel: 'web', agent: C.agent, intent: 'manual', payload: { note: $('#nlW').value } }); logAct('Added ' + n + ' by hand', 'plus'); api.close(); location.hash = '#/leads'; render(); toast(esc(n) + ' added to leads.'); });
  }
  function keys() { var k = function (a, b) { return '<div><span>' + a + '</span><span>' + b.split(' ').map(function (x) { return '<kbd>' + x + '</kbd>'; }).join('') + '</span></div>'; }; var api = overlay('<div class="md lg" role="dialog" aria-modal="true" aria-labelledby="kT"><header><h2 id="kT">Keyboard shortcuts</h2><button class="ib" type="button" data-x aria-label="Close">' + ic('x', 16) + '</button></header><div class="kl">' + k('Search and commands', (mac ? '⌘' : 'Ctrl') + ' K') + k('Today', 'G H') + k('Leads', 'G L') + k(C.bookings.label, 'G B') + k('Conversations', 'G T') + k(C.projects.label, 'G P') + k('Call queue', 'C') + k('Call outcome', '1 … 6') + k('Take over a chat', 'T') + k('This list', '?') + '</div></div>'); $('[data-x]', api.el).addEventListener('click', api.close); }

  /* ───────── router + events ───────── */
  function parse() { var h = location.hash.replace(/^#\/?/, ''), q = '', i = h.indexOf('?'); if (i >= 0) { q = h.slice(i + 1); h = h.slice(0, i); } var p = h.split('/').filter(Boolean).map(function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } }); return { name: p[0] || 'home', id: p[1] || '', q: new URLSearchParams(q), qs: q }; }
  var first = true;
  function render(nav) {
    var r = parse(), changed = r.name !== route.name; route = r; var fn = V[r.name] || V.home, ta = $('#cxin'); if (ta && chatSel) draft[chatSel] = ta.value;
    var focused = doc.activeElement && doc.activeElement.id, pos = doc.activeElement && doc.activeElement.selectionStart;
    if (nav && changed && !first && !reduce) { view.innerHTML = '<div class="skel"><span></span><span></span><span></span><span></span></div>'; setTimeout(function () { paint(fn, changed); }, 120); } else paint(fn, changed, focused, pos);
    first = false;
  }
  function paint(fn, changed, focused, pos) {
    view.className = 'view v-' + route.name; view.innerHTML = fn(); chrome();
    var lg = $('.th-log'); if (lg) lg.scrollTop = lg.scrollHeight;
    if (focused) { var f = doc.getElementById(focused); if (f) { f.focus({ preventScroll: true }); try { if (pos != null) f.setSelectionRange(pos, pos); } catch (e) {} } }
    else if (changed) { scrollTo(0, 0); try { view.focus({ preventScroll: true }); } catch (e) {} }
    if (route.name === 'leads' && route.id && !stack.length) openRecord(route.id);
    bulk();
  }
  addEventListener('hashchange', function () { if (menuEl) { menuEl.remove(); menuEl = null; } stack.slice().forEach(function (s) { s.close(); }); render(true); });
  var tm = 0; function later() { clearTimeout(tm); tm = setTimeout(function () { if (!stack.length && !(doc.activeElement && /TEXTAREA|INPUT/.test(doc.activeElement.tagName) && doc.activeElement.id !== 'cxin')) render(); else chrome(); }, 160); }
  function bulk() { var b = $('#bulk'); if (!b) return; var k = Object.keys(sel).filter(function (x) { return sel[x]; }); b.innerHTML = k.length ? '<div class="bulk" role="region" aria-label="Bulk actions"><b>' + k.length + ' selected</b><button class="btn sm" type="button" data-bulk="contacted">Mark contacted</button><button class="btn sm" type="button" data-bulk="booked">Mark booked</button><button class="btn sm" type="button" data-bulk="lost">Mark lost</button><button class="ib" type="button" data-bulk="clear" aria-label="Clear selection">' + ic('x', 14) + '</button></div>' : ''; }
  function cxAct(k, el) {
    var c = chatSel && O.convos.get(chatSel); if (!c) return; var who = C.user.name + ' (' + C.user.short + ')';
    if (k === 'take') { O.convos.setStatus(c.id, 'human', { person: who }); O.convos.append(c.id, { from: 'system', kind: 'system', text: 'Connected to ' + who }); O.events.log('agent_reply', { agent: c.agent, channel: c.channel, source: c.source, convo: c.id, kind: 'takeover' }); logAct('Took over the chat with ' + ((c.user && c.user.name) || 'a visitor'), 'chat'); render(); setTimeout(function () { var t = $('#cxin'); if (t) t.focus(); }, 40); }
    if (k === 'back') { O.convos.setStatus(c.id, 'bot', { person: null }); O.convos.append(c.id, { from: 'system', kind: 'system', text: 'You’re back with the ' + C.brand + ' assistant. Anything else?' }); render(); toast('Handed back to the concierge.', { undo: function () { O.convos.setStatus(c.id, 'human', { person: who }); } }); }
    if (k === 'resolve') { O.convos.setStatus(c.id, 'resolved'); O.convos.append(c.id, { from: 'system', kind: 'system', text: 'Conversation resolved by ' + C.user.first }); O.events.log('resolved', { agent: c.agent, channel: c.channel, source: c.source, convo: c.id, by: 'person' }); logAct('Resolved the chat with ' + ((c.user && c.user.name) || 'a visitor'), 'check'); var nx = waiting()[0]; render(); toast('Resolved.' + (nx ? ' ' + esc((nx.user && nx.user.name) || 'Someone') + ' is waiting.' : ''), { undo: function () { O.convos.setStatus(c.id, 'human'); }, action: nx ? ['Open', function () { location.hash = '#/chats/' + nx.id; }] : null }); }
    if (k === 'reopen') { O.convos.setStatus(c.id, 'human', { person: who }); render(); }
    if (k === 'send') { var t = $('#cxin'), v = t && t.value.trim(); if (!v) return; t.value = ''; draft[c.id] = ''; O.convos.append(c.id, { from: 'agent', name: C.user.first, text: v }); O.events.log('agent_reply', { agent: c.agent, channel: c.channel, source: c.source, convo: c.id }); render(); setTimeout(function () { var t2 = $('#cxin'); if (t2) t2.focus(); }, 30); }
    if (k === 'more') menu(el, [{ label: 'Simulate a reply from the visitor', icon: 'chat', run: function () { O.convos.append(c.id, { from: 'user', text: c.status === 'human' ? 'That’s perfect, thank you!' : 'Hello? Is anyone there?' }); } }, { label: 'Open the website chat', icon: 'ext', run: function () { open(C.site, '_blank'); } }]);
  }
  doc.addEventListener('click', function (e) {
    var t = e.target, b;
    if ((b = t.closest('[data-k]'))) { var k = b.getAttribute('data-k'); if (k === 'pal') palette(); if (k === 'keys') keys(); if (k === 'new') menu(b, [{ label: 'Add a lead by hand', icon: 'plus', run: newLead }, { label: 'Start the call queue', icon: 'play', kbd: 'C', run: function () { location.hash = '#/call'; } }, { label: 'Open the website chat', icon: 'ext', run: function () { open(C.site, '_blank'); } }]);
      if (k === 'saveview') { var nm = 'View ' + ((dget('views', null) || C.views).length + 1); var Vw = (dget('views', null) || C.views).slice(); Vw.push({ name: route.q.get('s') ? STL[route.q.get('s')] ? STL[route.q.get('s')][0] + ' leads' : nm : nm, q: route.qs }); dset('views', Vw); chrome(); toast('Saved to the sidebar.', { undo: function () { Vw.pop(); dset('views', Vw); chrome(); } }); }
      if (k === 'skip') { var Q = dget('skipped', []); Q.push(b.getAttribute('data-key')); var st = dget('st', {}); st[b.getAttribute('data-key')] = 'contacted'; dset('st', st); render(); toast('Skipped. Moved to contacted so the queue moves on.', { undo: function () { var s2 = dget('st', {}); delete s2[b.getAttribute('data-key')]; dset('st', s2); } }); }
      if (k === 'addc') { var r0 = records().filter(function (x) { return x.key === b.getAttribute('data-key'); })[0]; if (r0) addContact(r0); }
      return; }
    if ((b = t.closest('[data-out]'))) { outcome(+b.getAttribute('data-out'), b.getAttribute('data-key')); return; }
    if ((b = t.closest('[data-s]')) && view.contains(b)) { var q = new URLSearchParams(route.qs); if (b.getAttribute('data-s')) q.set('s', b.getAttribute('data-s')); else q.delete('s'); location.hash = '#/leads' + (q.toString() ? '?' + q : ''); return; }
    if ((b = t.closest('[data-sort]'))) { var sk = b.getAttribute('data-sort'); sort = { k: sk, d: sort.k === sk ? -sort.d : -1 }; render(); return; }
    if ((b = t.closest('#lall'))) { $$('.tb tbody tr').forEach(function (tr) { sel[tr.getAttribute('data-key')] = b.checked; }); render(); return; }
    if ((b = t.closest('.tb tbody .ck input'))) { sel[b.closest('tr').getAttribute('data-key')] = b.checked; b.closest('tr').classList.toggle('sel', b.checked); bulk(); return; }
    if (t.closest('.tb .ck')) return;
    if ((b = t.closest('.v-leads .tb tbody tr'))) { location.hash = '#/leads/' + encodeURIComponent(b.getAttribute('data-key')) + (route.qs ? '?' + route.qs : ''); return; }
    if ((b = t.closest('[data-bulk]'))) { var bk = b.getAttribute('data-bulk'), ks = Object.keys(sel).filter(function (x) { return sel[x]; }); if (bk === 'clear') { sel = {}; render(); return; } var und = setStatus(ks, bk); sel = {}; render(); toast(plural(ks.length, 'lead') + ' marked ' + STL[bk][0].toLowerCase() + '.', { undo: und }); return; }
    if ((b = t.closest('[data-cf]'))) { location.hash = '#/chats' + (b.getAttribute('data-cf') !== 'all' ? '?f=' + b.getAttribute('data-cf') : ''); chatSel = null; return; }
    if ((b = t.closest('[data-cx]'))) { cxAct(b.getAttribute('data-cx'), b); return; }
    if ((b = t.closest('[data-mac]'))) { var c0 = O.convos.get(chatSel), ta = $('#cxin'); if (ta) { ta.value = C.macros[+b.getAttribute('data-mac')].replace('{name}', ((c0 && c0.user && c0.user.name) || 'there').split(' ')[0]); ta.focus(); } return; }
    if ((b = t.closest('[data-bk]'))) { var ref = b.getAttribute('data-ref'), L = db(C.bookings.key), it = L.filter(function (x) { return x.ref === ref; })[0]; if (!it) return; var set = function (s) { var prev = it.status; it.status = s; dbs(C.bookings.key, L); logAct(ref + ' with ' + it.name + ' marked ' + s, s === 'done' ? 'check' : 'x'); render(); toast(ref + ' marked ' + s + '.', { undo: function () { it.status = prev; dbs(C.bookings.key, L); } }); }; if (b.getAttribute('data-bk') === 'done') set('done'); else menu(b, [{ label: 'Mark done', icon: 'check', run: function () { set('done'); } }, { label: 'Cancel this ' + C.bookings.one, icon: 'x', run: function () { set('cancelled'); } }].concat(it.convo ? [{ label: 'Open the chat', icon: 'chat', run: function () { location.hash = '#/chats/' + it.convo; } }] : [])); return; }
    if ((b = t.closest('[data-kit]'))) { var L2 = db(C.extra.key), kt = L2.filter(function (x) { return x.ref === b.getAttribute('data-kit'); })[0], nx = C.extra.next(kt.status), pv = kt.status; kt.status = nx[0]; dbs(C.extra.key, L2); logAct(kt.ref + ' ' + nx[0], 'box'); render(); toast(kt.ref + ' is ' + nx[0] + '.', { undo: function () { kt.status = pv; dbs(C.extra.key, L2); } }); return; }
    if ((b = t.closest('[data-stage]'))) { var P = db(C.projects.key), p = P.filter(function (x) { return x.code === b.getAttribute('data-code'); })[0], ps = p.stage, pp = p.pct; p.stage = +b.getAttribute('data-stage'); p.pct = Math.round((p.stage + .5) / C.projects.stages.length * 100); dbs(C.projects.key, P); logAct(p.code + ' moved to ' + C.projects.stages[p.stage].toLowerCase(), 'proj'); render(); toast(p.code + ' is now at ' + esc(C.projects.stages[p.stage].toLowerCase()) + '. The chat will say so.', { undo: function () { p.stage = ps; p.pct = pp; dbs(C.projects.key, P); } }); return; }
  });
  doc.addEventListener('keydown', function (e) {
    var tg = e.target, typing = tg && (/INPUT|TEXTAREA|SELECT/.test(tg.tagName)), mod = e.metaKey || e.ctrlKey;
    if (mod && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); palette(); return; }
    if (e.key === 'Escape' && stack.length) { stack[stack.length - 1].close(); return; }
    if (tg && tg.id === 'cxin' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); cxAct('send'); return; }
    if (tg && tg.id === 'lq') { clearTimeout(tg._t); tg._t = setTimeout(function () { var q = new URLSearchParams(route.qs); if (tg.value) q.set('q', tg.value); else q.delete('q'); history.replaceState(null, '', '#/leads' + (q.toString() ? '?' + q : '')); route = parse(); render(); }, 220); return; }
    if (e.key === 'Enter' && tg && tg.matches && tg.matches('.tb tbody tr')) { tg.click(); return; }
    if (typing || mod || e.altKey || stack.length) return;
    if (route.name === 'call' && /^[1-6]$/.test(e.key)) { var bb = $('[data-out="' + (+e.key - 1) + '"]'); if (bb) bb.click(); return; }
    if (e.key === '?') { keys(); return; } if (e.key === 'c') { location.hash = '#/call'; return; }
    if (e.key === 't' && route.name === 'chats') { var c = chatSel && O.convos.get(chatSel); if (c && c.status !== 'human' && c.status !== 'resolved') cxAct('take'); return; }
    if (g) { g = false; var to = { h: '', l: 'leads', b: 'bookings', t: 'chats', p: 'projects', k: 'extra' }[e.key]; if (to != null) location.hash = '#/' + to; return; } if (e.key === 'g') { g = true; setTimeout(function () { g = false; }, 900); }
  });
  var g = false;
  function outcome(i, key) {
    var o = C.outcomes[i], r = records().filter(function (x) { return x.key === key; })[0]; if (!r) return; var note = ($('#cnote') || {}).value || '';
    var nt = dget('notes', {}); (nt[key] = nt[key] || []).unshift({ t: Date.now(), m: o[0] + (note ? ': ' + note : ''), by: C.user.first }); dset('notes', nt);
    var undo = setStatus([key], o[2], true); dset('callDone', dget('callDone', 0) + 1); logAct('Called ' + r.name + ': ' + o[0].toLowerCase(), 'phone'); render();
    toast(esc(r.name.split(' ')[0]) + ': ' + o[0].toLowerCase() + '. ' + o[3], { undo: function () { undo(); var n2 = dget('notes', {}); (n2[key] || []).shift(); dset('notes', n2); dset('callDone', Math.max(0, dget('callDone', 1) - 1)); } });
  }

  /* ───────── boot ───────── */
  function boot() { seed(); shell(); render(); O.convos.on(later); O.leads.on(later); addEventListener('storage', function (e) { if (e.key && (e.key.indexOf('orbit-data-' + C.agent) === 0)) later(); }); requestAnimationFrame(function () { doc.body.classList.add('ready'); }); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})();
