/* The CRM inside the builder: the app a visitor's choices produce. One set of parts (shell, tables, boards, records, forms)
   is drawn the same way for every look; crm.css gives each look its own density, type and layout. The business itself (data,
   flows, clock, roles) is biz.js; studio.js owns the settings beside it and hands this file the configuration.
   Plain DOM, styles through CSSOM only. Every class starts with c- so nothing here can meet a class the page uses. */
(function () {
  'use strict';
  var d = document, Z = window.Biz, NS = 'http://www.w3.org/2000/svg';
  var inr = Z.inr, short = Z.short, dn = Z.dn, LONG = Z.LONG, MODS = Z.MODS;
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var T0 = (function () { var x = new Date(); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; })();      // the sample week starts on this week's Monday
  function E(tag, cls, txt) { var e = d.createElement(tag); if (cls) e.className = cls; if (txt !== undefined && txt !== null) e.textContent = txt; return e; }
  function B(txt, cls, fn) { var b = E('button', cls, txt); b.type = 'button'; if (fn) b.addEventListener('click', fn); return b; }
  function A(p) { for (var i = 1; i < arguments.length; i++) if (arguments[i]) p.appendChild(arguments[i]); return p; }
  function T(t) { return d.createTextNode(t); }
  function svg(tag, at, kids) { var e = d.createElementNS(NS, tag), k; for (k in at) e.setAttribute(k, at[k]); (kids || []).forEach(function (c) { e.appendChild(c); }); return e; }
  var IC = {
    home: 'M4 11l8-7 8 7M6 10v9h12v-9M10 19v-5h4v5', users: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c.6-3.6 3.2-5.5 6.500-5.500s5.900 1.900 6.500 5.500M16 4.500a3.500 3.500 0 010 6.500M18 14.700c2 .700 3.200 2.400 3.600 5.300',
    cal: 'M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1zM4 10h16M8 3.500v4M16 3.500v4', box: 'M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8',
    receipt: 'M7 3h10a1 1 0 011 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 011-1zM9 8h6M9 12h6', chat: 'M5 5h14a1 1 0 011 1v10a1 1 0 01-1 1h-8l-5 4v-4H5a1 1 0 01-1-1V6a1 1 0 011-1z',
    pin: 'M12 21s-6.500-5.600-6.500-10.500a6.500 6.500 0 0113 0C18.500 15.400 12 21 12 21zM12 13a2.500 2.500 0 100-5 2.500 2.500 0 000 5z', chart: 'M4 20h16M7 20v-6M12 20V6M17 20v-9',
    globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.500 2.500 3.800 5.500 3.800 9s-1.300 6.500-3.800 9c-2.500-2.500-3.800-5.500-3.800-9S9.500 5.500 12 3z', search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-3.800-3.800',
    bell: 'M6 16v-5a6 6 0 0112 0v5l1.500 2h-15zM10 20.500a2 2 0 004 0', plus: 'M12 5v14M5 12h14', chevr: 'M9 6l6 6-6 6', chevl: 'M15 6l-6 6 6 6', chevd: 'M6 9l6 6 6-6',
    check: 'M5 12.500l4.500 4.500L19 7.500', x: 'M6 6l12 12M18 6L6 18', clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7.500V12l3 2', bolt: 'M13 3L5 13.500h6L10 21l8-10.500h-6z',
    arrow: 'M5 12h14M13 6l6 6-6 6', menu: 'M4 7h16M4 12h16M4 17h16', sort: 'M8 10l4-4 4 4M8 14l4 4 4-4', file: 'M7 3h7l4 4v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM14 3v4h4',
    send: 'M4 12l16-8-6 16-3-7z', tray: 'M4 13l2.500-8h11L20 13v5a1 1 0 01-1 1H5a1 1 0 01-1-1zM4 13h4.500l1 2.500h5l1-2.500H20', truck: 'M3 6h11v10H3zM14 9h4l3 3.500V16h-7M7 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z',
    layers: 'M12 4l8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4', user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4.500 20.500c1-3.500 3.800-5.500 7.500-5.500s6.500 2 7.500 5.500', phone: 'M8 3h8a1 1 0 011 1v16a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1zM11 18h2',
    tag: 'M4 4h7l9 9-7 7-9-9zM8 8h.01', note: 'M5 4h14v11l-5 5H5zM14 20v-5h5', grid: 'M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5z'
  };
  function ic(n, cls) { return svg('svg', { viewBox: '0 0 24 24', 'class': 'c-ic' + (cls ? ' ' + cls : ''), 'aria-hidden': 'true' }, [svg('path', { d: IC[n] || IC.file })]); }
  /* a quiet street map: blocks, a park, water and roads, drawn once and stretched to its box */
  function mapSvg() {
    return svg('svg', { viewBox: '0 0 400 240', preserveAspectRatio: 'none', 'class': 'c-mapsvg', 'aria-hidden': 'true' }, [
      svg('rect', { 'class': 'm0', width: 400, height: 240 }),
      svg('path', { 'class': 'm3', d: 'M-10 200C60 184 96 216 150 206S238 164 292 180 360 216 410 200V250H-10z' }),
      svg('path', { 'class': 'm1', d: 'M14 12h106v72H14zM146 12h78v72h-78zM344 14h44v66h-44zM14 110h30v70H14zM70 110h50v30H70zM70 152h50v26H70zM146 110h52v28h-52zM146 150h52v26h-52zM224 110h62v52h-62zM314 110h74v48h-74z' }),
      svg('rect', { 'class': 'm2', x: 236, y: 20, width: 92, height: 60, rx: 6 }),
      svg('path', { 'class': 'm4', d: 'M-10 97H410M133-10V250M301-10V172' }),
      svg('path', { 'class': 'm5', d: 'M-10 42H133M133 144H301M211 97V250M57 97V190M-10 146H57M301 60H410' })
    ]);
  }

  window.CRM = function (app, C, M, hook) {
    var D, P, AU, shut = {}, scr = 'home', tab = {}, open = null, filt = 'all', lf = 'all', thr = '', cust = '', key = '', pop = '', gq = '', loading = false, sorts = {}, modal = null, unseen = 0, tAt = 0, fast = false, rail = false, hint = '';
    var small = matchMedia('(max-width: 640px)'), still = matchMedia('(prefers-reduced-motion: reduce)'), box = app.parentNode, ticked = 0;
    var toasts = E('div', 'c-toasts'); toasts.setAttribute('aria-live', 'polite');
    /* which modules each role can open at all; what they see inside is decided screen by screen */
    var SEE = { owner: 'pipe cal stock inv chat field rep portal', sales: 'pipe cal stock inv chat', field: 'cal', acct: 'stock inv rep' };
    /* each trade is its own product: its own menu groups, order and words */
    var NAV = {
      property: [['', ['home']], ['Sales', ['pipe', 'cal']], ['Inventory', ['stock', 'field']], ['Finance', ['inv']], ['Customers', ['chat', 'portal']], ['Insights', ['rep']]],
      build: [['', ['home']], ['Pre-construction', ['pipe', 'cal']], ['On site', ['field', 'stock']], ['Commercial', ['inv']], ['Clients', ['portal', 'chat']], ['Reports', ['rep']]],
      retail: [['', ['home']], ['Store', ['stock', 'pipe', 'cal', 'field']], ['Money', ['inv']], ['Customers', ['chat', 'portal']], ['Insights', ['rep']]],
      stay: [['', ['home']], ['Reservations', ['cal', 'pipe']], ['House', ['field', 'stock']], ['Accounts', ['inv']], ['Guests', ['chat', 'portal']], ['Reports', ['rep']]],
      service: [['', ['home']], ['Members', ['pipe', 'cal']], ['Studio', ['field', 'stock']], ['Billing', ['inv']], ['Messages', ['chat', 'portal']], ['Insights', ['rep']]]
    };
    var WORD = { property: { field: 'Field team', portal: 'Customer portal' }, build: { field: 'Site team', portal: 'Client portal' }, retail: { field: 'Deliveries', portal: 'Customer portal' }, stay: { field: 'Housekeeping', portal: 'Guest portal' }, service: { field: 'Coaches', portal: 'Member portal' } };
    var SIDE = { atlas: 1, blueprint: 1, console: 1 }, HUE = [205, 28, 150, 265, 345, 48];
    var NICON = { home: 'home', pipe: 'users', cal: 'cal', stock: 'box', inv: 'receipt', chat: 'chat', field: 'pin', rep: 'chart', portal: 'globe' };
    var SRC = { Website: 'info', WhatsApp: 'ok', Referral: 'vio', Instagram: 'bad', 'Property portal': 'warn' };

    function me() { return P.team[C.role][0]; }
    function phone() { return C.dev === 'phone' || (!C.box && small.matches); }      /* an app shown in a box elsewhere (C.box) keeps the device it was given, whatever the screen */
    function when(day) { var x = day - D.day; return x === 0 ? 'Today' : x === 1 ? 'Tomorrow' : x === -1 ? 'Yesterday' : x < -6 ? 'Last week' : x < 0 ? -x + ' days ago' : LONG[day % 7]; }
    function wl(day) { var x = day - D.day; return x >= -6 && x <= 1 ? when(day).toLowerCase() : when(day); }
    function dstr(day) { var x = new Date(T0); x.setDate(x.getDate() + day); return x.getDate() + ' ' + MON[x.getMonth()]; }
    function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
    function cap(s) { s = s.replace(/^the /, ''); return s.charAt(0).toUpperCase() + s.slice(1); }
    function one(s) { s = s.toLowerCase(); return /ies$/.test(s) ? s.slice(0, -3) + 'y' : s.replace(/s$/, ''); }
    function modName(m) { return MODS.filter(function (x) { return x[0] === m; })[0][1]; }
    function sum(l) { return l.reduce(function (s, v) { return s + v.v; }, 0); }
    function unpaid(v) { return v.st !== 'paid'; }
    function first(n) { var p = n.split(' '); return /^(Dr|Mr|Mrs|Ms|Col\.|Prof)$/.test(p[0]) ? n : p[0]; }      /* a first name to address someone by, keeping a title with its surname */
    function num(n, one, many) { return n + ' ' + (n === 1 ? one : many || one + 's'); }
    function kinds() { var seen = {}, l = []; P.leads.forEach(function (c) { if (!seen[c[1]]) { seen[c[1]] = 1; l.push([c[1], c[6], c[2]]); } }); return l; }

    /* ---- who sees what ---- */
    function label(m) { return P.w[m] || WORD[C.trade][m] || { inv: 'Invoices', chat: 'WhatsApp', rep: 'Reports' }[m]; }
    function screens() {
      var r = C.role, l = [['home', r === 'field' ? 'My jobs' : r === 'acct' ? 'Money desk' : P.home]];
      MODS.forEach(function (m) { if (C.mods[m[0]] && (' ' + SEE[r] + ' ').indexOf(' ' + m[0] + ' ') >= 0) l.push([m[0], r === 'field' ? 'My week' : label(m[0])]); });
      return l;
    }
    function sees(s) { return screens().some(function (x) { return x[0] === s; }); }
    function tabsOf(s) {
      var r = C.role;
      return ({
        home: r === 'field' ? [['today', 'Jobs'], ['route', 'Route']] : [],
        pipe: [['board', 'Board'], ['list', 'List'], ['tasks', 'Tasks']],
        cal: [['week', 'Week'], ['agenda', 'Agenda']],
        stock: r === 'sales' ? [['items', 'Items']] : [['items', 'Items'], ['moves', 'Movements'], ['pos', P.w.po + 's']],
        inv: r === 'sales' ? [['all', 'Invoices']] : [['all', 'Invoices'], ['pays', 'Payments']],
        chat: [['inbox', 'Inbox'], ['tpl', 'Templates']],
        field: [['today', 'Today'], ['route', 'Route']],
        rep: r === 'acct' ? [['money', 'Money'], ['ops', OPSN[C.trade]], ['act', 'Activity']] : [['over', 'Overview'], ['sales', 'Sales'], ['money', 'Money'], ['ops', OPSN[C.trade]], ['team', 'Team'], ['act', 'Activity']],
        portal: [['status', 'Status'], ['bills', 'Bills']]
      })[s] || [];
    }
    function leads() { return D.leads.filter(M.mine); }
    function mineN(n) { if (C.role !== 'sales') return true; var l = D.leads.filter(function (x) { return x.n === n; })[0]; return !!l && M.mine(l); }
    function invs() { return D.invs.filter(function (v) { return mineN(v.n); }); }
    function tnum(t) { var m = /(\d+):(\d+) (am|pm)/.exec(t); return m ? (+m[1] % 12 + (m[3] === 'pm' ? 12 : 0)) * 60 + +m[2] : 0; }
    function evs() { return D.ev.filter(function (e) { return C.role !== 'sales' || mineN(e.n) || e.by === me(); }).sort(function (a, b) { return a.day - b.day || tnum(a.tm) - tnum(b.tm); }); }
    function jobs(day) { return evs().filter(function (e) { return e.day === day; }); }
    function tasks() { return D.tasks.filter(function (k) { return C.role === 'owner' || k.who === me(); }); }
    function needs() {
      var l = [];
      if (C.mods.stock) D.pos.forEach(function (p) { if (p.st === 'draft') l.push([p.id + ' to approve', function () { go('stock', 'pos'); }]); });
      if (C.mods.inv) D.invs.forEach(function (v) { if (v.flag && v.st !== 'paid') l.push([v.id + ' overdue · ' + short(v.v), function () { jump(['inv', v.id]); }]); });
      if (C.mods.pipe) D.tasks.forEach(function (k) { if (!k.done && k.who === me() && k.due <= D.day) l.push([k.t, function () { go('pipe', 'tasks'); }]); });
      return l;
    }
    function myday() {
      var l = [];
      if (sees('pipe')) tasks().forEach(function (k) { if (!k.done && k.due <= D.day) l.push([k.t, function () { go('pipe', 'tasks'); }]); });
      jobs(D.day).forEach(function (e) { if (!e.done) l.push([e.tm + ' · ' + e.n, function () { jump(['ev', e.id]); }]); });
      return l;
    }
    function count(s) {
      var r = C.role;
      return s === 'inv' ? invs().filter(function (v) { return v.over; }).length
        : s === 'stock' ? (r === 'sales' ? 0 : D.pos.filter(function (p) { return p.st === 'draft'; }).length)
          : s === 'chat' ? D.chats.reduce(function (t, c) { return t + c.un; }, 0)
            : s === 'pipe' ? D.tasks.filter(function (k) { return !k.done && k.who === me() && k.due <= D.day; }).length
              : s === 'home' && r === 'field' ? jobs(D.day).filter(function (e) { return !e.done; }).length : 0;
    }

    /* ---- getting around ---- */
    function go(s, t, o) { scr = s; if (t) tab[s] = t; open = o || null; C.view = 'app'; pop = ''; gq = ''; hook.sync(); paint(); }
    function where(r) {
      var x;
      if (r[0] === 'lead') { x = M.by(D.leads, r[1]); return x && M.mine(x) && sees('pipe') ? 'pipe' : ''; }
      if (r[0] === 'inv') { x = M.by(D.invs, r[1]); return x && mineN(x.n) && sees('inv') ? 'inv' : ''; }
      if (r[0] === 'ev') return M.by(D.ev, r[1]) ? (C.role === 'field' ? 'home' : sees('cal') ? 'cal' : sees('field') ? 'field' : 'home') : '';
      return sees('stock') ? 'stock' : '';
    }
    function jump(r) { var m = where(r); if (!m) return; if (r[0] === 'po' || r[0] === 'stock') go('stock', r[0] === 'po' && C.role !== 'sales' ? 'pos' : 'items'); else go(m, null, { t: r[0], id: r[1] }); }
    function find(o) { return M.by(o.t === 'lead' ? D.leads : o.t === 'ev' ? D.ev : D.invs, o.id); }
    function link(txt, r) { return r && where(r) ? B(txt, 'c-lk', function () { jump(r); }) : E('b', '', txt); }

    /* ---- parts ---- */
    function ini(n) { var p = n.replace(/[^A-Za-z ]/g, ' ').trim().split(/\s+/); return ((p[0] || '?').charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : '')).toUpperCase(); }
    function av(n, cls) { var a = E('i', 'c-av' + (cls ? ' ' + cls : ''), ini(n)), h = 0, i; for (i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 997; a.dataset.h = h % 6; return a; }
    function chip(t, tone) { var c = E('span', 'c-chip', t); c.dataset.t = tone || 'mute'; return c; }
    function btn(t, cls, fn, icon) { var b = B('', 'c-btn' + (cls ? ' ' + cls : ''), fn); if (icon) b.appendChild(ic(icon)); b.appendChild(E('span', '', t)); return b; }
    /* a button that changes records: it is busy for a moment, as a saved change is, then the screen is drawn again */
    function act(t, cls, fn, icon) {
      var b = btn(t, cls, function () { if (b.getAttribute('aria-busy')) return; if (fast) { fn(); return paint(); } b.setAttribute('aria-busy', 'true'); setTimeout(function () { fn(); paint(); }, 380); }, icon);
      return b;
    }
    function card(title, sub, right) { var c = E('section', 'c-card'), h; if (title || right) { h = E('header', 'c-ch'); A(h, A(E('div'), title ? E('h5', '', title) : null, sub ? E('p', '', sub) : null), right); c.appendChild(h); } return c; }
    function pad() { var b = E('div', 'c-cb'), i; for (i = 0; i < arguments.length; i++) if (arguments[i]) b.appendChild(arguments[i]); return b; }
    function who(n, sub) { return A(E('span', 'c-who'), av(n), A(E('span'), E('b', '', n), sub ? E('small', '', sub) : null)); }
    function two(a, b, keep) { var x = A(E('span', 'c-two'), E('b', '', a), b ? E('small', '', b) : null); if (keep) x.dataset.keep = 1; return x; }
    function code(t) { return E('code', 'c-code', t); }
    function per(n) { return A(E('span', 'c-per'), av(n, 'c-xs'), E('span', '', n)); }
    function day2(day) { return two(dstr(day), when(day)); }
    function empty(icon, title, text, b) { return A(E('div', 'c-empty'), A(E('i'), ic(icon || 'tray')), E('b', '', title), text ? E('p', '', text) : null, b); }
    function stat(l, v, sub, tone, icon, fn) { var s = fn ? B('', 'c-stat', fn) : E('div', 'c-stat'); if (tone) s.dataset.t = tone; return A(s, A(E('span'), icon ? ic(icon) : null, T(l)), E('b', '', v), sub ? E('small', '', sub) : null); }
    function stats(l) { var g = E('div', 'c-stats'); l.forEach(function (x) { if (x) g.appendChild(stat.apply(null, x)); }); g.style.setProperty('--n', g.children.length); return g; }
    function band(l) { var g = stats(l); g.classList.add('c-band'); return g; }      /* a row of totals that scrolls sideways on a phone, so it never pushes the list off the screen */
    function kv(l) { var g = E('dl', 'c-kv'); l.forEach(function (x) { if (x) A(g, E('dt', '', x[0]), A(E('dd'), typeof x[1] === 'string' ? T(x[1]) : x[1])); }); return g; }
    function tline(log) { var ol = E('ol', 'c-tl'); log.slice(0, 9).forEach(function (x) { ol.appendChild(A(E('li'), E('i'), E('b', '', x[1]), E('time', '', when(x[0]) + ' · ' + dstr(x[0])))); }); return ol; }
    function path(l) { var ol = E('ol', 'c-path'); l.forEach(function (x) { var li = E('li', '', x[0]); if (x[1]) li.dataset.on = 1; ol.appendChild(li); }); return ol; }
    function seg(l, cur, fn) { var g = E('div', 'c-seg'); l.forEach(function (x) { var b = B(x[1], '', function () { fn(x[0]); }); b.setAttribute('aria-pressed', x[0] === cur); if (x[2] !== undefined) b.appendChild(E('i', '', x[2])); g.appendChild(b); }); return g; }
    function check(on, lab, fn) { var b = B('', 'c-ck', fn); b.setAttribute('aria-pressed', !!on); b.setAttribute('aria-label', lab); if (on) b.appendChild(ic('check')); return b; }
    function missing(c, m, txt) { c.appendChild(A(card(), empty(NICON[m], 'Not in this setup yet', txt, btn('Add ' + modName(m), 'c-pri', function () { hook.add(m); }, 'plus')))); }
    /* a table: columns know how to draw, sort and label themselves; a search box filters the rows already on screen */
    function tbl(o) {
      var w = E('div', 'c-tw' + (o.cls ? ' ' + o.cls : '')), t = E('div', 'c-tbl'), cols = o.cols.filter(Boolean), gt = cols.map(function (c) { return c.w || 'minmax(0,1fr)'; }).join(' '), st = sorts[o.key], rows = o.rows.slice(), head = E('div', 'c-tr c-th'), body = E('div', 'c-tb'), foot = E('p', 'c-tf'), tools, si, none;
      function say() { var n = body.querySelectorAll('.c-tr:not([hidden])').length; foot.textContent = n && o.noun ? 'Showing 1 to ' + n + ' of ' + n + ' ' + o.noun : ''; if (none) none.hidden = !!n || !rows.length; }
      t.setAttribute('role', 'table'); head.setAttribute('role', 'row'); head.style.gridTemplateColumns = gt;
      if (st && cols[st.i] && cols[st.i].s) rows.sort(function (a, b) { var x = cols[st.i].s(a), y = cols[st.i].s(b); return (x < y ? -1 : x > y ? 1 : 0) * st.dir; });
      cols.forEach(function (c, i) {
        var h = c.s ? B(c.t, '', function () { sorts[o.key] = { i: i, dir: st && st.i === i ? -st.dir : 1 }; paint(); }) : E('span', '', c.t);
        h.setAttribute('role', 'columnheader'); if (c.r) h.dataset.r = 1; if (!c.m) h.dataset.hm = 1;
        if (c.s) { h.appendChild(ic('sort')); if (st && st.i === i) h.setAttribute('aria-sort', st.dir > 0 ? 'ascending' : 'descending'); }
        head.appendChild(h);
      });
      rows.forEach(function (x) {
        var r = E('div', 'c-tr'); r.setAttribute('role', 'row'); r.style.gridTemplateColumns = gt;
        cols.forEach(function (c, i) { var v = c.c(x), cell = E('span'); cell.setAttribute('role', 'cell'); if (c.r) cell.dataset.r = 1; if (!c.m) cell.dataset.hm = 1; if (o.lab && i && c.t) cell.dataset.l = c.t; if (v === null || v === undefined || v === '') { cell.textContent = '—'; cell.dataset.nil = 1; } else if (typeof v === 'object') cell.appendChild(v); else cell.textContent = v; r.appendChild(cell); });
        if (o.on) { r.tabIndex = 0; r.dataset.go = 1; r.addEventListener('click', function (e) { if (!e.target.closest('button,a,input')) o.on(x); }); r.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target === r) o.on(x); }); }
        if (o.q) r.dataset.q = o.q(x).toLowerCase(); if (o.mark && o.mark(x)) r.dataset.mark = o.mark(x);
        body.appendChild(r);
      });
      if (!rows.length) body.appendChild(empty.apply(null, o.empty || ['tray', 'Nothing here yet']));
      else if (o.q) { none = empty('search', 'No matches', 'Nothing here matches that search.'); none.hidden = true; body.appendChild(none); }
      if (o.q || o.left) {
        tools = E('div', 'c-tools'); if (o.left) tools.appendChild(o.left);
        if (o.q) { si = E('input'); si.type = 'search'; si.placeholder = 'Search ' + (o.noun || ''); si.setAttribute('aria-label', 'Search ' + (o.noun || 'this list')); si.addEventListener('input', function () { var v = si.value.trim().toLowerCase(); [].forEach.call(body.querySelectorAll('.c-tr'), function (r) { r.hidden = !!v && r.dataset.q.indexOf(v) < 0; }); say(); }); tools.appendChild(A(E('label', 'c-find'), ic('search'), si)); }
        w.appendChild(tools);
      }
      A(t, head, body, foot); say(); return A(w, t);
    }

    /* ---- status words ---- */
    function ist(v) { return v.st === 'paid' ? ['Paid', 'ok'] : v.over ? ['Overdue' + (v.rem ? ' · reminded' + (v.rem > 1 ? ' ×' + v.rem : '') : ''), 'bad'] : ['Sent · due ' + wl(v.due), 'info']; }
    function est(e) { return e.done ? ['Done', 'ok'] : e.on ? ['On site', 'acc'] : e.st === 'confirmed' ? ['Confirmed', 'info'] : ['Not confirmed', 'warn']; }
    function lst(l) { return [P.st[l.s], l.s === 2 ? 'ok' : l.s ? 'info' : 'mute']; }
    function bookNext(day, tm, what) { var n = M.who(), l = D.leads.filter(function (x) { return x.n === n; })[0]; M.book(n, P.w.book + ' · ' + (what || (l ? l.d : 'new walk-in')), day, tm); }
    function evCols(own) {
      return [{ t: 'When', w: '128px', m: 1, s: function (e) { return e.day * 1440 + tnum(e.tm); }, c: function (e) { return two(when(e.day) + ', ' + e.tm, dstr(e.day)); } }, { t: 'Customer', w: 'minmax(0,1.2fr)', m: 1, c: function (e) { return who(e.n, e.w); } },
        own ? { t: 'On site', w: '150px', c: function (e) { return per(e.who); } } : null, { t: 'Status', w: '130px', m: 1, c: function (e) { var s = est(e); return chip(s[0], s[1]); } }];
    }
    function openEv(e) { jump(['ev', e.id]); }

    /* ---- the first screen: a different product for every trade, laid out the way that business works ---- */
    function stockState(s, edit) {
      var i = D.stock.indexOf(s), free = s.q - s.res, po = M.openPO(i), w = E('span', 'c-row');
      w.appendChild(chip(free <= 0 ? 'Out of stock' : free <= s.min ? 'Low' : 'In stock', free <= 0 ? 'bad' : free <= s.min ? 'warn' : 'ok'));
      if (po) w.appendChild(E('small', '', po.id + (po.st === 'draft' ? ' drafted' : ' due ' + wl(po.eta)))); else if (free <= s.min && edit) w.appendChild(act('Reorder', '', function () { M.reorder(i); tab.stock = 'pos'; }));
      return w;
    }
    var HOME = {
      /* property: the listings on a map, the list beside it, and the one in hand */
      property: function (c, ph) {
        var s = P.pins[D.sel], k = D.stock[D.sel], mp = E('div', 'c-map'), w = E('div', 'c-split'), side = card('Listings', P.pins.length + ' on the map'), info = card(s[0], s[1]);
        mp.appendChild(mapSvg());
        P.pins.forEach(function (p, i) { var b = B('', 'c-pin', function () { D.sel = i; paint(); }); b.style.left = p[2] + '%'; b.style.top = p[3] + '%'; if (i === D.sel) b.setAttribute('aria-current', 'true'); A(b, ic('pin'), E('span', '', p[0].split(' · ')[1] || p[0])); mp.appendChild(b); });
        side.appendChild(tbl({ key: 'pins', cols: [{ t: 'Listing', m: 1, w: 'minmax(0,1.5fr)', c: function (p) { return two(p[0], p[1]); } }, C.mods.stock ? { t: 'Free', r: 1, m: 1, w: '54px', c: function (p) { var x = D.stock[P.pins.indexOf(p)]; return String(x.q - x.res); } } : null], rows: P.pins, on: function (p) { D.sel = P.pins.indexOf(p); paint(); }, mark: function (p) { return p === s ? 'sel' : ''; } }));
        info.appendChild(pad(kv([['Asking', s[1]], C.mods.stock ? ['Available', (k.q - k.res) + ' of ' + k.q + ' ' + k.u] : null, C.mods.stock && k.res ? ['Reserved', k.res + ' for won deals'] : null]), M.can('sell') ? act('Book a ' + P.w.book.toLowerCase() + ' for ' + M.peek(), 'c-pri', function () { bookNext(D.day + 1, '11:00 am', s[0]); }, 'cal') : null));
        A(c, A(w, mp, A(E('div', 'c-stack'), side, info)));
        ph.hint = 'Pick a listing on the map or in the list. The button books the next enquiry in for a visit.';
      },
      /* construction: the programme, the site log, and the materials the sites need next */
      build: function (c, ph) {
        var g = card('Programme', 'Eight weeks · the line is today'), gt = E('div', 'c-gantt'), hd = E('div', 'c-gh'), dy = card('Site log', 'What was recorded on site'), mt = card('Materials watch', 'Low, reserved or on order'), now = Math.min(100, 37.5 + D.day * 1.8), i, watch = D.stock.filter(function (s, j) { return s.q - s.res <= s.min || s.res || M.openPO(j); });
        hd.appendChild(E('span', '', 'Project')); for (i = 1; i <= 8; i++) hd.appendChild(E('span', '', 'W' + i)); gt.appendChild(hd); gt.style.setProperty('--now', now + '%');
        P.proj.forEach(function (p) { var r = E('div', 'c-gr'), t = E('i'), pc = Math.max(0, Math.min(100, Math.round((now / 12.5 - p[1]) / p[2] * 100))), b = E('b', '', pc + '%'); b.style.left = p[1] * 12.5 + '%'; b.style.width = p[2] * 12.5 + '%'; b.style.setProperty('--pc', pc + '%'); t.appendChild(b); A(r, A(E('span'), T(p[0]), E('small', '', p[2] + ' weeks')), t); gt.appendChild(r); });
        g.appendChild(pad(gt));
        if (M.can('site')) dy.firstChild.appendChild(act('Log a site entry', '', function () { D.photos.unshift('Week 3 · ' + P.proj[D.photos.length % 4][0]); if (C.mods.portal) note('The client portal shows the new entry'); }, 'plus'));
        dy.appendChild(tbl({ key: 'diary', cols: [{ t: 'Week', w: '84px', m: 1, c: function (x) { return x.split(' · ')[0]; } }, { t: 'Entry', m: 1, c: function (x) { return two(cap(x.split(' · ')[1]), 'Photos attached · ' + P.team.field[0]); } }], rows: D.photos.slice(0, 5) }));
        mt.appendChild(C.mods.stock ? tbl({ key: 'watch', cols: [{ t: 'Material', m: 1, c: function (s) { return two(s.n, (s.q - s.res) + ' ' + s.u + ' free' + (s.res ? ' · ' + s.res + ' reserved' : '')); } }, { t: 'Status', w: 'minmax(120px,auto)', r: 1, m: 1, c: function (s) { return stockState(s, C.role !== 'sales'); } }], rows: watch, on: function () { go('stock'); }, empty: ['box', 'Every material is in stock', 'Nothing is low, reserved or on order.'] })
          : empty('box', 'Materials are not in this setup', 'Add inventory to see what the sites need next.', btn('Add ' + modName('stock'), 'c-pri', function () { hook.add('stock'); }, 'plus')));
        A(c, g, A(E('div', 'c-split c-even'), dy, mt));
      },
      /* retail: a till. Items on the left, the sale on the right, and what the shelves are short of */
      retail: function (c, ph) {
        var g = E('div', 'c-pos'), tot = D.bill.reduce(function (s, i) { return s + P.price[i]; }, 0), bill = card('Current sale', D.bill.length ? D.bill.length + (D.bill.length > 1 ? ' items' : ' item') : 'Nothing rung up yet'), ls = E('ul', 'c-bill'), today = D.pays.filter(function (x) { return x.day === D.day; }), td = card('Today at the till', LONG[D.day % 7] + ', ' + dstr(D.day)), low = D.stock.filter(function (s) { return s.q - s.res <= s.min; }), lc = card('Running low', low.length ? low.length + ' to reorder' : '');
        D.stock.forEach(function (s, i) { var left = s.q - s.res - D.bill.filter(function (x) { return x === i; }).length, b = B('', 'c-posb', function () { D.bill.push(i); paint(); }), sw = E('i', 'c-sw', ini(s.n)); sw.style.setProperty('--h', HUE[i % 6]); b.disabled = left <= 0 || !M.can('sell'); if (left > 0 && left <= s.min) b.dataset.low = 1; A(b, sw, E('b', '', s.n), E('span', '', inr(P.price[i])), E('small', '', left > 0 ? left + ' left' : 'Sold out')); g.appendChild(b); });
        D.bill.forEach(function (i) { ls.appendChild(A(E('li'), E('span', '', D.stock[i].n), E('b', '', inr(P.price[i])))); });
        ls.appendChild(A(E('li', 'c-tot'), E('span', '', 'Total, GST included'), E('b', '', inr(tot))));
        bill.appendChild(pad(D.bill.length ? ls : empty('tag', 'Tap an item to add it'), M.can('sell') && tot ? A(E('div', 'c-row'), act('Charge ' + inr(tot), 'c-pri', function () { M.sale(D.bill.slice(), tot); D.bill = []; }, 'check'), btn('Clear', '', function () { D.bill = []; paint(); })) : null));
        td.appendChild(pad(kv([['Takings', inr(sum(today))], ['Sales', String(today.length)], ['Average sale', today.length ? inr(Math.round(sum(today) / today.length)) : 'No sales yet'], ['To collect', short(sum(invs().filter(unpaid)))]])));
        lc.appendChild(C.mods.stock ? tbl({ key: 'low', cols: [{ t: 'Item', m: 1, c: function (s) { return two(s.n, (s.q - s.res) + ' left · reorder at ' + s.min); } }, { t: 'Status', w: 'minmax(120px,auto)', r: 1, m: 1, c: function (s) { return stockState(s, C.role !== 'sales'); } }], rows: low, on: function () { go('stock'); }, empty: ['check', 'The shelves are full', 'Nothing is at its reorder level.'] }) : empty('box', 'Stock is not in this setup'));
        A(c, A(E('div', 'c-split c-till'), A(E('div', 'c-stack'), g, lc), A(E('div', 'c-stack'), bill, td))); ph.hint = 'Ring up a sale: stock drops and the invoice is filed as paid.';
      },
      /* hospitality: a front desk. Every room at a glance, the week's chart, who arrives and who is in house */
      stay: function (c, ph) {
        var rooms = E('div', 'c-rooms'), t = E('div', 'c-tape'), ws = Math.floor(D.day / 7) * 7, i, cd = card('This week', dstr(ws) + ' to ' + dstr(ws + 6)), arr = D.ev.filter(function (e) { return e.day === D.day && !e.job; }), inh = [], a = card('Arriving today', arr.length ? num(arr.length, 'guest') : ''), b = card('In house', '');
        P.rooms.forEach(function (r, ri) {
          var h = D.held.filter(function (x) { return x[0] === ri && D.day >= x[1] && D.day < x[1] + x[2]; })[0], nx = D.held.filter(function (x) { return x[0] === ri && x[1] > D.day; }).sort(function (x, y) { return x[1] - y[1]; })[0], el = E('div', 'c-room');
          if (h) inh.push([r, h]);
          A(el, E('span', '', r), E('b', '', h ? h[3] : 'Free tonight'), E('small', '', h ? 'Until ' + dn(h[1] + h[2]) + ', ' + dstr(h[1] + h[2]) : nx ? 'Next: ' + nx[3] + ', ' + dn(nx[1]) : 'Nothing booked this week'), chip(h ? 'Occupied' : 'Free', h ? 'acc' : 'ok')); rooms.appendChild(el);
        });
        t.appendChild(E('span', 'c-th0', 'Room'));
        for (i = 0; i < 7; i++) { var hh = A(E('span', 'c-th0'), T(dn(i) + ' '), E('b', '', dstr(ws + i).split(' ')[0])); if (ws + i === D.day) hh.dataset.now = 1; t.appendChild(hh); }
        P.rooms.forEach(function (r, ri) {
          t.appendChild(E('span', 'c-rm', r));
          for (var x = ws; x < ws + 7; x++) (function (dd) {
            var hl = D.held.filter(function (y) { return y[0] === ri && dd >= y[1] && dd < y[1] + y[2]; })[0], cell;
            if (hl) { cell = E('span', 'c-bk', dd === hl[1] || dd === ws ? hl[3] : ''); if (dd === hl[1]) cell.dataset.a = 1; if (dd === hl[1] + hl[2] - 1) cell.dataset.z = 1; }
            else if (dd < D.day || !M.can('sell')) cell = E('span', 'c-fc');
            else { cell = B('', 'c-fc', function () { M.book(M.who(), '', dd, '2:00 pm', ri); paint(); }); cell.setAttribute('aria-label', 'Free: ' + r + ', ' + LONG[dd % 7]); }
            t.appendChild(cell);
          })(x);
        });
        cd.appendChild(pad(t));
        a.appendChild(tbl({ key: 'arr', cols: [{ t: 'Guest', m: 1, c: function (e) { return who(e.n, e.w.split(' · ').pop()); } }, { t: 'From', w: '90px', m: 1, c: function (e) { return e.tm; } }, { t: 'Status', w: 'minmax(110px,auto)', r: 1, m: 1, c: function (e) { return chip(est(e)[0], est(e)[1]); } }], rows: arr, on: openEv, empty: ['cal', 'No arrivals today', 'Hold a night on the chart and it shows here on the day.'] }));
        b.appendChild(tbl({ key: 'inh', cols: [{ t: 'Guest', m: 1, c: function (x) { return who(x[1][3], x[0]); } }, { t: 'Leaves', w: '120px', r: 1, m: 1, c: function (x) { return dn(x[1][1] + x[1][2]) + ', ' + dstr(x[1][1] + x[1][2]); } }], rows: inh, empty: ['home', 'Nobody is in house tonight'] }));
        A(c, rooms, cd, A(E('div', 'c-split c-even'), a, b)); ph.hint = M.can('sell') ? 'Click a free night on the chart to hold it for ' + M.peek() + '.' : '';
      },
      /* services: today's appointments, and who is on the floor */
      service: function (c, ph) {
        var cd = card('Today', LONG[D.day % 7] + ', ' + dstr(D.day)), st = card('On the floor today', 'Who is working, and on what'), tr = card('Trials to follow up', 'People at “' + P.st[1] + '”'), sess = D.ev.filter(function (e) { return e.day === D.day; }), next = sess.filter(function (e) { return !e.done; })[0], L = leads(), due = invs().filter(unpaid);
        function slot(x) { return D.ev.filter(function (e) { return e.day === D.day && e.tm === x; })[0]; }
        cd.appendChild(tbl({ key: 'slots', cols: [{ t: 'Time', w: '84px', m: 1, c: function (x) { return x; } }, { t: 'Member', w: 'minmax(150px,1fr)', m: 1, c: function (x) { var e = slot(x); return e ? who(e.n, e.w.split(' · ')[0]) : null; } }, { t: 'Status', w: '116px', m: 1, c: function (x) { var e = slot(x); return e ? chip(est(e)[0], est(e)[1]) : chip('Free', 'mute'); } },
          { t: '', w: 'auto', r: 1, m: 1, c: function (x) { return slot(x) || !M.can('sell') ? null : act('Book ' + first(M.peek()), '', function () { bookNext(D.day, x); }); } }], rows: ['6:00 am', '7:00 am', '8:00 am', '5:00 pm', '6:00 pm', '7:00 pm'], on: function (x) { var e = slot(x); if (e) openEv(e); } }));
        [[P.team.field[0], P.team.field[1], num(sess.length, 'session') + ' today', next ? 'Next at ' + next.tm : 'Done for the day'],
          [P.team.sales[0], P.team.sales[1], num(L.filter(function (l) { return l.s === 0 && l.own === P.team.sales[0]; }).length, 'enquiry', 'enquiries') + ' to call', num(D.tasks.filter(function (k) { return !k.done && k.who === P.team.sales[0] && k.due <= D.day; }).length, 'task') + ' due'],
          [P.team.acct[0], P.team.acct[1], num(due.length, 'invoice') + ' open', due.filter(function (v) { return v.over; }).length + ' overdue']].forEach(function (x) { st.appendChild(A(E('div', 'c-staff'), av(x[0]), A(E('span'), E('b', '', x[0]), E('small', '', x[1])), A(E('span'), E('b', '', x[2]), E('small', '', x[3])))); });
        tr.appendChild(tbl({ key: 'trials', cols: [{ t: 'Member', m: 1, c: function (l) { return who(l.n, l.d); } }, { t: 'Value', w: '96px', r: 1, m: 1, c: function (l) { return inr(l.v); } }], rows: L.filter(function (l) { return l.s === 1; }), on: function (l) { jump(['lead', l.id]); }, empty: ['users', 'No trials to chase'] }));
        A(c, A(E('div', 'c-split'), cd, A(E('div', 'c-stack'), st, tr)));
      }
    };

    /* ---- reports: each one shows the evidence, then says in plain words what it means and what to do about it ---- */
    var LEADW = { property: 'enquiries', build: 'enquiries', retail: 'shoppers', stay: 'enquiries', service: 'enquiries' }, WONW = { property: 'deals', build: 'jobs', retail: 'orders', stay: 'bookings', service: 'members' };
    var OPSN = { property: 'Listings', build: 'Sites and materials', retail: 'Stock', stay: 'Rooms', service: 'Sessions' };
    var BRIEF = { property: ['follow', 'source', 'visits', 'age'], build: ['prog', 'stock', 'age', 'follow'], retail: ['sell', 'stock', 'age', 'source'], stay: ['occ', 'age', 'source', 'follow'], service: ['sess', 'visits', 'follow', 'age'] };
    var OPSR = { property: ['demand', 'stock'], build: ['prog', 'stock'], retail: ['sell', 'stock'], stay: ['occ', 'stock'], service: ['sess', 'stock'] };
    /* the middle step of each trade's sale: its name in the plural and the singular, what winning looks like, and the verb for doing it */
    var MIDW = { property: ['site visits', 'visit', 'closes', 'Book'], build: ['quotes sent', 'quote', 'is won', 'Send'], retail: ['checkouts', 'checkout', 'is paid for', 'Nudge'], stay: ['rooms held', 'hold', 'is confirmed', 'Hold a room for'], service: ['trials', 'trial', 'joins', 'Book'] };
    var JOBW = { property: ['site visit', 'site visits'], build: ['site job', 'site jobs'], retail: ['handover', 'handovers'], stay: ['arrival', 'arrivals'], service: ['session', 'sessions'] };
    var BILL = { property: ['Keep raising the brokerage invoice the day the deal is agreed.', 'ask for a token amount when the deal is agreed'], build: ['Keep billing each stage the day it is signed off.', 'take the advance on signing, before materials are ordered'], retail: ['Keep taking payment at the counter, and send wholesale invoices the same day.', 'take payment before goods leave the shop'], stay: ['Keep taking the advance when a room is held.', 'take the advance when the room is held, not at check-out'], service: ['Keep billing a membership on the day it starts.', 'bill before the first session, not after it'] };
    function pct(x) { return Math.round(x * 100) + '%'; }
    function isare(n) { return n === 1 ? 'is' : 'are'; }
    function bar(label, val, max, txt, tone) { var r = E('p'), b = E('i'); b.style.setProperty('--w', (max ? val / max * 100 : 0) + '%'); if (tone) r.dataset.t = tone; return A(r, E('span', '', label), b, E('b', '', txt)); }
    function rate(v, txt, tone) { var s = E('span', 'c-rate'), i = E('i'); i.style.setProperty('--w', Math.round(v) + '%'); if (tone) s.dataset.t = tone; return A(s, i, E('b', '', txt)); }
    function weeks() {      /* invoiced and collected by week: seven weeks of history, then the weeks lived through here */
      var w = P.hist.rev.map(function (x) { return x.slice(); }), n = Math.floor(D.day / 7), i, o = { ti: 0, tr: 0, mx: 1 };
      for (i = 0; i <= n; i++) w.push([D.invs.reduce(function (t, v) { return t + (v.made >= 0 && Math.floor(v.made / 7) === i ? v.v : 0); }, 0), D.pays.reduce(function (t, x) { return t + (x.day >= 0 && Math.floor(x.day / 7) === i ? x.v : 0); }, 0)]);
      o.w = w.slice(-8); o.w.forEach(function (x) { o.ti += x[0]; o.tr += x[1]; o.mx = Math.max(o.mx, x[0], x[1]); }); o.cur = o.w[o.w.length - 1]; o.rate = o.ti ? o.tr / o.ti : 1; return o;
    }
    function month() { var o = { e: D.leads.length, w: D.leads.filter(function (l) { return l.s === 2; }).length }, k; for (k in P.hist.src) { o.e += P.hist.src[k][0]; o.w += P.hist.src[k][1]; } return o; }
    function rcard(title, sub, body, means, todo, b) {
      var c = card(title, sub), f = E('div', 'c-say'); c.classList.add('c-ins');
      [].concat(body).forEach(function (x) { if (x) c.appendChild(x.classList.contains('c-tw') ? x : pad(x)); });
      A(f, A(E('p'), E('b', '', 'What this means'), E('span', '', means)), A(E('p'), E('b', '', 'What to do'), E('span', '', todo), b ? btn(b[0], '', b[1], 'arrow') : null)); f.lastChild.dataset.do = 1;
      c.appendChild(f); return { card: c, title: title, means: means, todo: todo, b: b };
    }
    var R = {
      source: function () {
        var m = {}, k, rows, big, best, lw = LEADW[C.trade], ww = WONW[C.trade];
        for (k in P.hist.src) m[k] = { n: k, c: P.hist.src[k][0], w: P.hist.src[k][1] };
        D.leads.forEach(function (l) { var x = m[l.src] || (m[l.src] = { n: l.src, c: 0, w: 0 }); x.c++; if (l.s === 2) x.w++; });
        rows = Object.keys(m).map(function (q) { m[q].r = m[q].c ? m[q].w / m[q].c : 0; return m[q]; }).sort(function (a, b) { return b.r - a.r; });
        best = rows.filter(function (x) { return x.c >= 5; })[0] || rows[0]; big = rows.slice().sort(function (a, b) { return b.c - a.c; })[0];
        return rcard('Where ' + lw + ' come from, and which become ' + ww, 'Last 30 days, with this week',
          tbl({ lab: 1, key: 'r-src', cols: [{ t: 'Source', m: 1, c: function (x) { return chip(x.n, SRC[x.n]); } }, { t: cap(lw), r: 1, w: '96px', m: 1, s: function (x) { return x.c; }, c: function (x) { return String(x.c); } }, { t: cap(ww), r: 1, w: '96px', s: function (x) { return x.w; }, c: function (x) { return String(x.w); } },
            { t: 'Conversion', w: 'minmax(150px,1.3fr)', m: 1, s: function (x) { return x.r; }, c: function (x) { return rate(x.r * 100, pct(x.r), x === best ? 'ok' : ''); } }], rows: rows }),
          best !== big ? best.n + ' turns ' + pct(best.r) + ' of its ' + lw + ' into ' + ww + ', the best of any source. ' + big.n + ' sends the most (' + big.c + ') but only ' + pct(big.r) + ' convert.' : best.n + ' sends the most ' + lw + ' (' + big.c + ') and also converts best, at ' + pct(best.r) + '.',
          best !== big ? 'Reply to ' + best.n + ' ' + lw + ' first: they are the likeliest to say yes.' + (best.n === 'Referral' ? ' Ask this month’s customers for an introduction each.' : '') + ' Before spending more on ' + big.n + ', read what those ' + lw + ' ask for and fix the first reply.' : 'Put more behind ' + best.n + ' before trying anything new.',
          sees('pipe') ? ['Open ' + P.w.pipe.toLowerCase(), function () { lf = 'all'; go('pipe', 'list'); }] : null);
      },
      follow: function () {
        var open = D.tasks.filter(function (k) { return !k.done; }), late = open.filter(function (k) { return k.due < D.day; }), today = open.filter(function (k) { return k.due === D.day; }), lw = LEADW[C.trade], first = late[0] || today[0];
        var quiet = D.leads.filter(function (l) { return l.s < 2 && D.day - l.last >= 2 && !open.some(function (k) { return k.ref && k.ref[1] === l.id; }); });
        return rcard('Follow-ups due', LONG[D.day % 7] + ', ' + dstr(D.day),
          tbl({ lab: 1, key: 'r-fu', cols: [{ t: 'Follow-up', m: 1, c: function (k) { return two(k.t, k.who); } }, { t: 'Due', w: 'minmax(110px,auto)', r: 1, m: 1, c: function (k) { return chip(k.due < D.day ? 'Late · ' + num(D.day - k.due, 'day') : 'Today', k.due < D.day ? 'bad' : 'warn'); } }], rows: late.concat(today).slice(0, 5), on: function (k) { if (k.ref && where(k.ref)) jump(k.ref); }, empty: ['check', 'All caught up', 'Nothing is late and nothing is due today.'] }),
          late.length || today.length || quiet.length ? (late.length ? num(late.length, 'follow-up') + ' ' + isare(late.length) + ' late' : 'No follow-up is late') + (today.length ? ', and ' + today.length + ' ' + isare(today.length) + ' due today.' : ', and none is due today.') + (quiet.length ? ' ' + num(quiet.length, one(lw), lw) + ' ' + (quiet.length === 1 ? 'has' : 'have') + ' had no contact for two days or more.' : '') : 'Every follow-up is done or not yet due, and nobody has been left waiting.',
          (first ? 'Start with “' + first.t + '” (' + first.who + ').' : quiet.length ? 'Call ' + quiet[0].n + ' today.' : 'Nothing to chase today.') + (C.autos.a6 ? '' : ' Switch on “when a lead goes quiet” and these are set without anyone having to remember.'),
          sees('pipe') ? ['Open tasks', function () { go('pipe', 'tasks'); }] : null);
      },
      money: function () {
        var o = weeks(), ch = E('div', 'c-cols');
        o.w.forEach(function (x, j) { var a = E('i'), b = E('i'); a.style.setProperty('--h', x[0] / o.mx * 100 + '%'); b.style.setProperty('--h', x[1] / o.mx * 100 + '%'); b.dataset.b = 1; ch.appendChild(A(E('div'), A(E('span'), a, b), E('small', '', j === o.w.length - 1 ? (phone() ? 'Now' : 'This week') : phone() ? '−' + (o.w.length - 1 - j) + 'w' : j === o.w.length - 2 ? 'Last week' : (o.w.length - 1 - j) + ' wk ago'))); });
        return rcard('Billed and collected', 'Eight weeks', A(E('div', 'c-fig'), A(E('p', 'c-leg'), A(E('span'), E('i'), T('Invoiced ' + short(o.ti))), A(E('span'), E('i'), T('Collected ' + short(o.tr)))), ch),
          'Over eight weeks ' + short(o.ti) + ' was invoiced and ' + short(o.tr) + ' collected: ' + pct(o.rate) + ' of what was billed. ' + (o.cur[0] || o.cur[1] ? 'This week so far, ' + short(o.cur[0]) + ' has gone out and ' + short(o.cur[1]) + ' has come in.' : 'Nothing has been billed or paid yet this week.'),
          o.rate < .86 ? 'Money is arriving slower than it is billed. Clear the late list first, then ' + BILL[C.trade][1] + '.' : 'Collections are keeping pace with billing. ' + BILL[C.trade][0],
          sees('inv') ? ['Open invoices', function () { filt = 'all'; go('inv'); }] : null);
      },
      age: function () {
        var due = D.invs.filter(unpaid), b = [['Not due yet', 0, 'ok'], ['1 to 3 days late', 0, 'warn'], ['4 to 7 days late', 0, 'bad'], ['Over a week late', 0, 'bad']], old = null, tot = sum(due), late, strip = E('div', 'c-stk'), leg = E('ul', 'c-stkl'), next = due.filter(function (v) { return v.due >= D.day; }).sort(function (x, y) { return x.due - y.due; })[0];
        due.forEach(function (v) { var dd = D.day - v.due, i = dd <= 0 ? 0 : dd <= 3 ? 1 : dd <= 7 ? 2 : 3; b[i][1] += v.v; if (dd > 0 && (!old || v.due < old.due)) old = v; });
        late = tot - b[0][1];
        b.forEach(function (x, i) { var s = E('i'), k = E('i'); s.dataset.t = k.dataset.t = x[2]; s.dataset.i = k.dataset.i = i; s.style.flexGrow = x[1]; if (x[1]) strip.appendChild(s); leg.appendChild(A(E('li'), A(E('span'), k, T(x[0])), E('b', '', inr(x[1])))); });
        return rcard('What is owed, by age', num(due.length, 'invoice') + ' unpaid', [A(E('div', 'c-fig'), strip, leg), due.length ? tbl({ lab: 1, key: 'r-age', cols: [{ t: 'Customer', m: 1, w: 'minmax(0,1.4fr)', c: function (v) { return two(v.n, v.lines[0][0]); } }, { t: 'Invoice', w: '112px', c: function (v) { return code(v.id); } }, { t: 'Due', w: '118px', s: function (v) { return v.due; }, c: function (v) { return day2(v.due); } },
            { t: 'Age', w: 'minmax(124px,auto)', m: 1, c: function (v) { var dd = D.day - v.due; return chip(dd <= 0 ? 'Not due yet' : num(dd, 'day') + ' late', dd <= 0 ? 'ok' : dd <= 3 ? 'warn' : 'bad'); } }, { t: 'Reminders', w: '96px', c: function (v) { return v.rem ? v.rem + ' sent' : 'None'; } }, { t: 'Amount', r: 1, w: '112px', m: 1, s: function (v) { return v.v; }, c: function (v) { return inr(v.v); } }],
            rows: due.slice().sort(function (x, y) { return x.due - y.due; }).slice(0, 6), on: function (v) { jump(['inv', v.id]); } }) : null],
          tot ? short(tot) + ' is owed across ' + num(due.length, 'invoice') + '. ' + (old ? (late === tot ? 'All' : short(late)) + ' of it is late; the oldest is ' + old.id + ' from ' + old.n + ', ' + num(D.day - old.due, 'day') + ' overdue.' : 'None of it is late yet.') : 'Nothing is owed: every invoice is paid.',
          old ? (old.rem ? old.n + ' has already had ' + num(old.rem, 'reminder') + ': phone them today rather than sending another.' : 'Send ' + old.n + ' a reminder now.') + (C.autos.a4 ? '' : ' Switch on the overdue automation so the first reminder sends itself.') : next ? 'Nothing to chase. The next to fall due is ' + next.id + ', ' + wl(next.due) + '.' : 'Nothing to do.',
          sees('inv') ? [late ? 'Open late invoices' : 'Open invoices', function () { filt = late ? 'over' : 'all'; go('inv'); }] : null);
      },
      stock: function () {
        var prop = C.trade === 'property', rows = D.stock.map(function (s, i) { var free = s.q - s.res, use = P.hist.use[i]; return { s: s, free: free, use: use, cover: use ? Math.max(0, Math.floor(free / use * 7)) : 999, turns: use * 4.3 / Math.max(1, s.q), po: M.openPO(i) }; });
        var risk = rows.filter(function (x) { return x.free <= x.s.min; }), tight = rows.slice().sort(function (a, b) { return a.cover - b.cover; })[0], slow = rows.slice().sort(function (a, b) { return a.turns - b.turns; })[0], draft = D.pos.filter(function (o) { return o.st === 'draft'; })[0], bare = risk.filter(function (x) { return !x.po; })[0], lvl = prop ? 'the level where you ask for more' : 'the reorder level';
        return rcard(prop ? 'What is left to let or sell' : 'How long stock lasts, and how fast it turns', prop ? 'At the usual rate of lettings and sales' : 'At the usual weekly rate',
          tbl({ lab: 1, key: 'r-stock', cols: [{ t: prop ? 'Listing' : 'Item', m: 1, w: 'minmax(0,1.3fr)', c: function (x) { return x.s.n; } }, { t: prop ? 'Available' : 'Free', r: 1, w: '112px', s: function (x) { return x.free; }, c: function (x) { return x.free + ' ' + x.s.u; } }, { t: prop ? 'Taken a week' : 'Used a week', r: 1, w: '112px', c: function (x) { return String(x.use); } },
            { t: 'Lasts', r: 1, w: '96px', m: 1, s: function (x) { return x.cover; }, c: function (x) { return x.cover > 365 ? null : E('b', '', num(x.cover, 'day')); } }, prop ? null : { t: 'Turns', r: 1, w: '112px', s: function (x) { return x.turns; }, c: function (x) { return x.turns.toFixed(1) + ' a month'; } },
            { t: 'Risk', w: 'minmax(150px,auto)', r: 1, m: 1, c: function (x) { return x.free <= x.s.min ? chip(x.po ? (x.po.st === 'draft' ? 'To approve · ' : 'On order · ') + x.po.id : prop ? 'Ask for more' : 'Reorder now', x.po ? (x.po.st === 'draft' ? 'warn' : 'info') : 'bad') : x.cover < 7 ? chip('Runs out this week', 'warn') : chip('Covered', 'ok'); } }], rows: rows }),
          (risk.length ? num(risk.length, prop ? 'listing' : 'item') + ' ' + isare(risk.length) + ' at or under ' + lvl + '. ' : 'Everything is above ' + lvl + '. ') + tight.s.n + ' is the tightest, with about ' + num(tight.cover, 'day') + ' left at the usual rate.' + (prop ? '' : ' ' + slow.s.n + ' moves slowest, turning ' + slow.turns.toFixed(1) + ' times a month.'),
          (draft ? 'Approve ' + draft.id + ' today: it is drafted and waiting' + (C.role === 'owner' ? ' for you.' : ' for ' + P.team.owner[0] + '.') : bare ? (prop ? 'Ask ' + bare.s.sup + ' for more of ' + bare.s.n + '.' : 'Reorder ' + bare.s.n + ' now, from ' + bare.s.sup + '.') : risk.length ? 'What is short is already on order. Nothing more to do until it arrives.' : 'No orders are needed this week.') + (!prop && slow.turns < .5 ? ' Order less of ' + slow.s.n + ' next time: money is sitting on the shelf.' : ''),
          sees('stock') ? ['Open ' + P.w.po.toLowerCase() + 's', function () { go('stock', C.role === 'sales' ? 'items' : 'pos'); }] : null);
      },
      visits: function () {
        var W = MIDW[C.trade], lw = LEADW[C.trade], ww = WONW[C.trade], v = P.hist.vis[0] + D.leads.filter(function (l) { return l.s >= 1; }).length, w = P.hist.vis[1] + D.leads.filter(function (l) { return l.s === 2; }).length, e30 = Math.max(month().e, v), wait = D.leads.filter(function (l) { return l.s === 0; }).sort(function (a, b) { return b.v - a.v; }), bars = E('div', 'c-bars'), k = Math.max(1, Math.round(v / Math.max(1, w)));
        [[cap(lw), e30, ''], [cap(W[0]), v, 'info'], [cap(ww), w, 'ok']].forEach(function (x) { bars.appendChild(bar(x[0], x[1], e30, String(x[1]), x[2])); });
        return rcard('From ' + one(lw) + ' to ' + W[1] + ' to ' + one(ww), 'Last 30 days, with this week', bars,
          v + ' ' + W[0] + ' led to ' + w + ' ' + ww + ': about one ' + W[1] + ' in ' + k + ' ' + W[2] + '. ' + pct(v / e30) + ' of ' + lw + ' get as far as a ' + W[1] + ', and ' + (wait.length ? num(wait.length, one(lw), lw) + ' ' + isare(wait.length) + ' waiting for one now.' : 'nobody is waiting for one now.'),
          wait.length ? 'The ' + W[1] + ' is the step that sells. ' + W[3] + ' the ' + (wait.length > 1 ? wait.length + ' waiting' : 'one waiting') + ', starting with ' + wait[0].n + ' (' + short(wait[0].v) + ').' : 'Nobody is waiting. Keep the confirmations and reminders going out.',
          sees('pipe') ? ['Open ' + P.w.pipe.toLowerCase(), function () { lf = '0'; go('pipe', 'list'); }] : null);
      },
      /* property: which listings the enquiries are for, against what there is to offer */
      demand: function () {
        var rows = D.stock.map(function (st, i) { var L = D.leads.filter(function (l) { return l.need[0] === i && l.s < 2; }); return { s: st, n: L.length, v: sum(L), free: st.q - st.res, vis: D.ev.filter(function (e) { var l = M.by(D.leads, e.lead); return l && l.need[0] === i && !e.job; }).length }; }).sort(function (a, b) { return b.n - a.n || b.v - a.v; });
        var top = rows[0], cold = rows.filter(function (x) { return !x.n; }), mx = Math.max(1, top.n);
        return rcard('Which listings the enquiries are for', 'Open enquiries, against what is available',
          tbl({ lab: 1, key: 'r-dem', cols: [{ t: 'Listing', m: 1, w: 'minmax(0,1.3fr)', c: function (x) { return x.s.n; } }, { t: 'Open enquiries', w: 'minmax(160px,1fr)', m: 1, s: function (x) { return x.n; }, c: function (x) { return rate(x.n / mx * 100, String(x.n), x === top ? 'ok' : ''); } }, { t: 'Worth', r: 1, w: '104px', s: function (x) { return x.v; }, c: function (x) { return x.v ? short(x.v) : null; } },
            { t: 'Visits booked', r: 1, w: '120px', c: function (x) { return String(x.vis); } }, { t: 'Available', r: 1, w: '112px', m: 1, c: function (x) { return x.free + ' ' + x.s.u; } }], rows: rows }),
          top.n ? top.s.n + ' draws the most interest: ' + num(top.n, 'open enquiry', 'open enquiries') + ' worth ' + short(top.v) + ', for ' + top.free + ' ' + top.s.u + ' available.' + (cold.length ? ' ' + cold.map(function (x) { return x.s.n; }).join(' and ') + ' ' + (cold.length > 1 ? 'have' : 'has') + ' none.' : '') : 'No enquiry is open on any listing.',
          cold.length ? 'Put ' + cold[0].s.n + ' at the top of this week’s posts and portal listings. If it stays quiet for another week, review the asking price.' : 'Every listing has interest. Keep visits moving on ' + top.s.n + ' while it is in demand.',
          ['Open the listings map', function () { go('home'); }]);
      },
      prog: function () {
        var now = Math.min(100, 37.5 + D.day * 1.8), rows = P.proj.map(function (p, i) { return { n: p[0], pc: Math.max(0, Math.min(100, Math.round((now / 12.5 - p[1]) / p[2] * 100))), slip: P.hist.slip[i], wk: p[2] }; }), on = rows.filter(function (x) { return x.slip <= 5; }).length, worst = rows.slice().sort(function (a, b) { return b.slip - a.slip; })[0], low = D.stock.filter(function (s) { return s.q - s.res <= s.min; })[0];
        return rcard('Projects against programme', num(rows.length, 'project') + ' on site or about to start',
          tbl({ lab: 1, key: 'r-prog', cols: [{ t: 'Project', m: 1, c: function (x) { return two(x.n, x.wk + ' weeks'); } }, { t: 'Done', w: 'minmax(150px,1fr)', m: 1, c: function (x) { return rate(x.pc, x.pc + '%'); } }, { t: 'Against plan', w: 'minmax(130px,auto)', r: 1, m: 1, c: function (x) { return chip(x.slip > 5 ? num(x.slip, 'day') + ' behind' : x.slip < 0 ? num(-x.slip, 'day') + ' ahead' : 'On programme', x.slip > 5 ? 'bad' : x.slip < 0 ? 'ok' : 'info'); } }], rows: rows }),
          on + ' of ' + rows.length + ' projects are on programme or ahead. ' + (worst.slip > 5 ? worst.n + ' is ' + num(worst.slip, 'day') + ' behind plan.' : 'None is more than a few days off plan.'),
          worst.slip > 5 ? 'Ask ' + P.team.field[0] + ' what is holding ' + worst.n + ' before the client asks you.' + (low ? ' Check materials first: ' + low.n + ' is at its reorder level.' : '') : 'Nothing to step in on. Log this week’s site entry so the client can see progress.',
          ['Open projects', function () { go('home'); }]);
      },
      sell: function () {
        var rows = D.stock.map(function (s, i) { var u = P.hist.use[i] + D.moves.filter(function (m) { return m.n === s.n && m.k === 'out'; }).reduce(function (t, m) { return t - m.q; }, 0); return { s: s, u: u, rev: u * P.price[i], cover: u ? Math.max(0, Math.floor((s.q - s.res) / u * 7)) : 999 }; }).sort(function (a, b) { return b.rev - a.rev; });
        var best = rows[0], slow = rows.slice().sort(function (a, b) { return a.u - b.u; })[0], bars = E('div', 'c-bars');
        rows.forEach(function (x) { bars.appendChild(bar(x.s.n, x.rev, best.rev || 1, x.u + ' sold · ' + short(x.rev), x === best ? 'ok' : '')); });
        return rcard('What sells', 'A usual week, with this week’s sales added', bars,
          best.s.n + ' brings in the most: about ' + short(best.rev) + ' a week from ' + best.u + ' sold. ' + slow.s.n + ' sells ' + slow.u + ' a week.',
          'Keep ' + best.s.n + ' in stock before anything else' + (best.cover < 10 ? ': there are about ' + num(best.cover, 'day') + ' left.' : '.') + ' Put ' + slow.s.n + ' by the till, or mark it down.',
          ['Open the till', function () { go('home'); }]);
      },
      occ: function () {
        var ws = Math.floor(D.day / 7) * 7, n = P.rooms.length, sold = 0, rev = 0, by = [0, 0, 0, 0, 0, 0, 0], g = E('div', 'c-heat'), i, big = D.leads.filter(function (l) { return l.s < 2; }).sort(function (a, b) { return b.v - a.v; })[0], adr, pc, per, we, mid, left;
        g.appendChild(E('span')); for (i = 0; i < 7; i++) g.appendChild(E('small', '', dn(i))); g.appendChild(E('small', '', 'Sold'));
        P.rooms.forEach(function (r, ri) { var c = 0, x, on, cell; g.appendChild(E('span', '', r)); for (x = ws; x < ws + 7; x++) { on = M.taken(ri, x); cell = E('i'); if (on) { cell.dataset.on = 1; c++; sold++; rev += P.rate[ri]; by[x - ws]++; } g.appendChild(cell); } g.appendChild(E('b', '', c + ' of 7')); });
        pc = sold / (n * 7); adr = sold ? Math.round(rev / sold) : 0; per = Math.round(rev / (n * 7)); we = n * 3 - by[4] - by[5] - by[6]; mid = n * 4 - by[0] - by[1] - by[2] - by[3]; left = D.day - ws < 4;
        return rcard('Occupancy this week', dstr(ws) + ' to ' + dstr(ws + 6), A(E('div', 'c-fig'), stats([['Occupancy', pct(pc), P.hist.occ[0] + '% last week', pc * 100 >= P.hist.occ[0] ? 'ok' : 'warn'], ['Average rate', inr(adr), inr(P.hist.occ[1]) + ' last week', 'info'], ['Earned per room, per night', inr(per), 'let or empty', 'acc']]), g),
          pct(pc) + ' of this week’s room nights are sold so far (' + sold + ' of ' + n * 7 + '); last week closed at ' + P.hist.occ[0] + '%. The average rate is ' + inr(adr) + ', so each room is earning ' + inr(per) + ' a night, let or empty.',
          we > 2 ? 'The weekend is the gap: ' + we + ' of ' + n * 3 + ' room nights from Friday to Sunday are unsold. Message past guests today' + (big ? ', and offer ' + big.n + ' a weekend date.' : '.') + (C.mods.chat ? '' : ' With WhatsApp in the system that message is one broadcast.') : mid > 4 && left ? 'The weekend is nearly full. The gap is midweek: ' + num(mid, 'room night') + ' unsold. Offer a two-night midweek rate.' : 'The week is nearly full. Hold the rate rather than discounting the last rooms.',
          ['Open the front desk', function () { go('home'); }]);
      },
      sess: function () {
        var slots = ['6:00 am', '7:00 am', '8:00 am', '5:00 pm', '6:00 pm', '7:00 pm'], today = D.ev.filter(function (e) { return e.day === D.day; }), free = slots.filter(function (t) { return !today.some(function (e) { return e.tm === t; }); }), trials = D.leads.filter(function (l) { return l.s === 1; }), g = E('div', 'c-slots');
        slots.forEach(function (t) { var e = today.filter(function (x) { return x.tm === t; })[0], c = A(E('p'), E('small', '', t), E('b', '', e ? e.n : 'Free')); if (e) c.dataset.on = 1; g.appendChild(c); });
        return rcard('How full today is', LONG[D.day % 7] + ' · ' + P.team.field[0], A(E('div', 'c-fig'), stats([['Booked today', today.length + ' of ' + slots.length, pct(today.length / slots.length) + ' of slots', today.length >= 4 ? 'ok' : 'warn'], ['Last week', P.hist.sess[0] + '%', P.hist.sess[1] + ' sessions run', 'info'], ['On trial', String(trials.length), 'to turn into members', 'acc']]), g),
          today.length + ' of ' + slots.length + ' slots are booked today (' + pct(today.length / slots.length) + '), against ' + P.hist.sess[0] + '% across last week.' + (free.length ? ' Free today: ' + free.join(', ') + '.' : ' Every slot is taken.'),
          free.length && trials.length ? 'Offer the free slots to the ' + num(trials.length, 'person', 'people') + ' on trial. A second session is what turns a trial into a member.' : free.length ? 'Post the free slots to members on WhatsApp this morning.' : 'Add a slot: the day is full and people are being turned away.',
          sees('cal') ? ['Open the calendar', function () { go('cal'); }] : null);
      },
      team: function () {
        var ppl = [P.team.sales[0], P.team.s2].map(function (x) { var L = D.leads.filter(function (l) { return l.own === x; }), h = P.hist.team[x] || [30, 75], W = L.filter(function (l) { return l.s === 2; }); return { n: x, open: L.length - W.length, won: W.length + (h[2] || 0), val: sum(W), reply: h[0], ontime: h[1], late: D.tasks.filter(function (k) { return !k.done && k.who === x && k.due < D.day; }).length }; });
        var a = ppl[0].ontime >= ppl[1].ontime ? ppl[0] : ppl[1], b = a === ppl[0] ? ppl[1] : ppl[0], J = D.ev.filter(function (e) { return e.who === P.team.field[0]; });
        return rcard('How the team is doing', 'Last 30 days, with this week',
          tbl({ lab: 1, key: 'r-team', cols: [{ t: 'Person', m: 1, w: 'minmax(0,1.3fr)', c: function (x) { return who(x.n, P.team.sales[1]); } }, { t: 'Open', r: 1, w: '64px', c: function (x) { return String(x.open); } }, { t: 'Won, 30 days', r: 1, w: '128px', m: 1, s: function (x) { return x.won; }, c: function (x) { return x.val ? two(String(x.won), short(x.val) + ' this week') : String(x.won); } }, { t: 'First reply', r: 1, w: '96px', m: 1, c: function (x) { return x.reply + ' min'; } },
            { t: 'Follow-ups on time', w: 'minmax(150px,1fr)', m: 1, c: function (x) { return rate(x.ontime, x.ontime + '%', x.ontime < 70 ? 'warn' : ''); } }, { t: 'Late now', r: 1, w: '86px', m: 1, c: function (x) { return x.late ? chip(String(x.late), 'bad') : chip('None', 'ok'); } }], rows: ppl }),
          a.n + ' replies in about ' + a.reply + ' minutes and keeps ' + a.ontime + '% of follow-ups on time. ' + b.n + ' takes ' + b.reply + ' minutes and keeps ' + b.ontime + '%. ' + P.team.field[0] + ' has ' + num(J.length, JOBW[C.trade][0], JOBW[C.trade][1]) + ' this week, ' + J.filter(function (e) { return e.done; }).length + ' done.',
          b.late ? b.n + ' has ' + num(b.late, 'follow-up') + ' late: clear them together today, or move one to ' + a.n + '.' : b.ontime < 70 ? 'Give ' + b.n + ' fewer new ' + LEADW[C.trade] + ' this week, until the follow-ups are back on time.' : 'Nothing to rebalance this week.',
          sees('pipe') ? ['Open tasks', function () { go('pipe', 'tasks'); }] : null);
      }
    };
    /* the person out on the job: this week's work, what is done, what is next */
    R.site = function () {
      var f = P.team.field, ws = Math.floor(D.day / 7) * 7, J = D.ev.filter(function (e) { return e.who === f[0] && e.day >= ws && e.day < ws + 7; }).sort(function (a, b) { return a.day - b.day || tnum(a.tm) - tnum(b.tm); }), done = J.filter(function (e) { return e.done; }), today = J.filter(function (e) { return e.day === D.day && !e.done; }), next = J.filter(function (e) { return !e.done && e.day >= D.day; })[0], w = JOBW[C.trade], open = J.filter(function (e) { return !e.done && e.st !== 'confirmed'; });
      return rcard(cap(w[1]) + ' this week', f[0] + ', ' + f[1].toLowerCase(),
        tbl({ lab: 1, key: 'r-site', cols: [{ t: 'When', w: '150px', m: 1, c: function (e) { return two(when(e.day) + ', ' + e.tm, dstr(e.day)); } }, { t: 'Customer', m: 1, w: 'minmax(0,1.3fr)', c: function (e) { return who(e.n, e.w); } }, { t: 'Checklist', w: 'minmax(140px,1fr)', c: function (e) { var n = e.done ? P.check.length : e.chk.filter(Boolean).length; return rate(n / P.check.length * 100, n + ' of ' + P.check.length, e.done ? 'ok' : ''); } }, { t: 'Status', w: '130px', r: 1, m: 1, c: function (e) { var x = est(e); return chip(x[0], x[1]); } }],
          rows: J, on: openEv, empty: ['cal', 'Nothing on site this week', 'Bookings and won deals put work here.'] }),
        J.length ? f[0] + ' has ' + num(J.length, w[0], w[1]) + ' this week: ' + done.length + ' done, ' + today.length + ' still to do today.' + (open.length ? ' ' + num(open.length, w[0], w[1]) + ' ' + (open.length === 1 ? 'is' : 'are') + ' not confirmed with the customer.' : '') : f[0] + ' has nothing booked this week.',
        open.length ? 'Send the confirmation for ' + open[0].n + ' before ' + f[0] + ' sets out.' : next ? 'Next is ' + next.n + ', ' + wl(next.day) + ' at ' + next.tm + '. ' + f[0] + ' checks in from the phone, so the office and the customer see it.' : J.length ? 'The week’s work is done. Book the next ' + w[0] + ' while the customer is pleased.' : 'Book a ' + P.w.book.toLowerCase() + ' and it appears on ' + f[0] + '’s phone.',
        C.mods.field ? ['See ' + f[0] + '’s phone', function () { hook.role('field'); }] : sees('cal') ? ['Open ' + P.w.cal.toLowerCase(), function () { go('cal'); }] : null);
    };
    function has(k) { return k === 'stock' ? C.mods.stock : k === 'age' || k === 'money' ? C.mods.inv : k === 'source' || k === 'follow' || k === 'team' || k === 'visits' ? C.mods.pipe : k === 'demand' ? C.mods.pipe && C.mods.stock : k === 'site' ? C.mods.cal || C.mods.field : true; }

    /* ---- the modules, tab by tab ---- */
    var S = {
      home: function (c, tb, ph) {
        var own = C.role === 'owner', L, due, l, s;
        if (C.role === 'field') return C.mods.field ? (tb === 'route' ? S.route(c, ph) : S.jobs(c, ph)) : missing(c, 'field', me() + ' has nothing on the phone until the field app is part of the system.');
        if (C.role === 'acct') return C.mods.inv ? S.desk(c, ph) : missing(c, 'inv', me() + ' has nothing to work on until invoices and payments are part of the system.');
        L = leads(); due = invs().filter(unpaid); l = own ? needs() : myday();
        if (l.length) { s = A(E('div', 'c-need'), A(E('b'), ic('bell'), T(own ? 'Needs you' : 'Your day'))); l.slice(0, 3).forEach(function (x) { s.appendChild(B(x[0], '', x[1])); }); if (l.length > 3) s.appendChild(E('span', '', '+' + (l.length - 3) + ' more')); c.appendChild(s); }
        if (C.trade !== 'retail' && C.trade !== 'stay') c.appendChild(stats([['New ' + P.w.pipe.toLowerCase(), L.filter(function (x) { return x.s === 0; }).length, L.length + ' open in all', 'info', 'users', sees('pipe') ? function () { go('pipe'); } : null],
          [P.w.cal + ' today', jobs(D.day).length, jobs(D.day + 1).length + ' tomorrow', 'acc', 'cal', sees('cal') ? function () { go('cal'); } : null],
          own ? ['To collect', short(sum(due)), due.filter(function (v) { return v.over; }).length + ' overdue', 'warn', 'receipt', sees('inv') ? function () { go('inv'); } : null] : ['Won by ' + me(), L.filter(function (x) { return x.s === 2; }).length, short(sum(L.filter(function (x) { return x.s === 2; }))), 'ok', 'check'],
          own ? ['Won this week', short(D.won), short(D.paid) + ' received', 'ok', 'check'] : null]));
        HOME[C.trade](c, ph);
      },
      desk: function (c) {
        var due = D.invs.filter(unpaid), over = due.filter(function (v) { return v.over; }), po = D.pos.filter(function (p) { return p.st !== 'received'; }), a = card('To chase', 'Overdue invoices, oldest first'), b;
        c.appendChild(stats([['Received', short(D.paid), D.pays.length + ' payments', 'ok', 'check'], ['To collect', short(sum(due)), due.length + ' open', 'info', 'receipt'], ['Overdue', short(sum(over)), over.length + ' to chase', over.length ? 'bad' : 'mute', 'clock']]));
        a.appendChild(tbl({ key: 'chase', noun: 'invoices', cols: [{ t: 'Invoice', w: '120px', m: 1, c: function (v) { return code(v.id); } }, { t: 'Customer', m: 1, c: function (v) { return who(v.n, v.lines[0][0]); } }, { t: 'Due', w: '120px', c: function (v) { return day2(v.due); } }, { t: 'Reminders', w: '100px', c: function (v) { return v.rem ? v.rem + ' sent' : 'None'; } }, { t: 'Amount', r: 1, w: '110px', m: 1, c: function (v) { return inr(v.v); } },
          { t: '', r: 1, w: '120px', m: 1, c: function (v) { return act('Remind', '', function () { M.remind(v); }, 'send'); } }], rows: over, on: function (v) { jump(['inv', v.id]); }, empty: ['check', 'Nothing is overdue', 'Every invoice is paid or still inside its terms.'] }));
        c.appendChild(a);
        if (C.mods.stock) { b = card('Orders to suppliers'); b.appendChild(poTbl(po)); c.appendChild(b); }
      },
      pipe: function (c, tb, ph) {
        var L = leads(), own = C.role === 'owner', sell = M.can('sell'), k;
        if (sell) ph.acts.appendChild(btn('New ' + one(P.w.pipe), 'c-cta', function () { modal = { n: '', i: 0, v: kinds()[0][2], src: 'Website', own: own ? P.team.sales[0] : me() }; paint(); }, 'plus'));
        if (tb !== 'tasks') (function () { var O = L.filter(function (l) { return l.s < 2; }), Wn = L.filter(function (l) { return l.s === 2; }), mine = tasks().filter(function (t) { return !t.done; }), late = mine.filter(function (t) { return t.due < D.day; }).length, td = mine.filter(function (t) { return t.due === D.day; }).length, pick = function (v) { return function () { lf = v; tab.pipe = 'list'; paint(); }; };
          c.appendChild(band([['Open', O.length, short(sum(O)) + ' in play', 'info', 'users', pick('all')], [P.st[0], L.filter(function (l) { return l.s === 0; }).length, 'not yet moved on', 'mute', 'tray', pick('0')], [P.st[1], L.filter(function (l) { return l.s === 1; }).length, short(sum(L.filter(function (l) { return l.s === 1; }))), 'acc', 'arrow', pick('1')], [P.st[2], Wn.length, short(sum(Wn)), 'ok', 'check', pick('2')], ['Follow-ups late', late, td + ' due today', late ? 'bad' : 'ok', 'clock', function () { tab.pipe = 'tasks'; paint(); }]])); })();
        if (tb === 'list') return c.appendChild(tbl({ key: 'leads', noun: P.w.pipe.toLowerCase(), q: function (l) { return l.n + ' ' + l.d + ' ' + l.src + ' ' + l.own + ' ' + P.st[l.s]; },
          left: seg([['all', 'All', L.length]].concat(P.st.map(function (s, i) { return [String(i), s, L.filter(function (l) { return l.s === i; }).length]; })), lf, function (v) { lf = v; paint(); }),
          cols: [{ t: 'Name', w: 'minmax(190px,1.6fr)', m: 1, s: function (l) { return l.n.toLowerCase(); }, c: function (l) { return who(l.n, l.d); } }, { t: 'Stage', w: '112px', m: 1, s: function (l) { return l.s; }, c: function (l) { return chip(lst(l)[0], lst(l)[1]); } },
            own ? { t: 'Owner', w: '112px', s: function (l) { return l.own; }, c: function (l) { return per(l.own); } } : { t: 'Source', w: '124px', c: function (l) { return chip(l.src, SRC[l.src]); } }, { t: 'Value', r: 1, w: '100px', m: 1, s: function (l) { return l.v; }, c: function (l) { return inr(l.v); } }, { t: 'Last activity', w: '136px', s: function (l) { return -l.last; }, c: function (l) { return day2(l.last); } },
            { t: 'Follow-up', w: 'minmax(128px,1fr)', c: function (l) { var x = D.tasks.filter(function (t) { return !t.done && t.ref && t.ref[1] === l.id; })[0], f = E('span', 'c-fu'); if (!x && l.s === 2) return null; f.appendChild(!x ? chip('Not scheduled', 'mute') : x.due < D.day ? chip('Overdue · ' + (D.day - x.due) + 'd', 'bad') : x.due === D.day ? chip('Today', 'warn') : chip('In ' + (x.due - D.day) + 'd', 'info')); if (x) f.appendChild(E('small', '', x.t)); return f; } }],
          rows: L.filter(function (l) { return lf === 'all' || l.s === +lf; }), on: function (l) { jump(['lead', l.id]); }, empty: ['users', 'No ' + P.w.pipe.toLowerCase() + ' here', 'New ones arrive from the website, WhatsApp and the counter.'] }));
        if (tb === 'tasks') {
          k = tasks(); if (!k.length) return c.appendChild(A(card(), empty('check', 'No tasks', 'Bookings and quiet leads create them.')));
          [['Overdue', 'bad', function (t) { return !t.done && t.due < D.day; }], ['Today', 'warn', function (t) { return !t.done && t.due === D.day; }], ['Upcoming', 'info', function (t) { return !t.done && t.due > D.day; }], ['Done', 'ok', function (t) { return t.done; }]].forEach(function (g) {
            var l = k.filter(g[2]), cd; if (!l.length) return; cd = card(g[0], '', chip(String(l.length), g[1])); cd.classList.add('c-tasks');
            l.slice(0, 8).forEach(function (t) { var r = E('div', 'c-task'); if (t.done) r.dataset.done = 1; A(r, check(t.done, 'Done: ' + t.t, function () { M.done(t); paint(); }), A(E('span'), link(t.t, t.ref), E('small', '', 'Due ' + wl(t.due) + ', ' + dstr(t.due))), own ? per(t.who) : null); cd.appendChild(r); });
            c.appendChild(cd);
          });
          return;
        }
        k = E('div', 'c-kb');
        P.st.forEach(function (s, i) {
          var col = E('div', 'c-kcol'), l = L.filter(function (x) { return x.s === i; }); col.dataset.s = i; col.dataset.t = i === 2 ? 'ok' : i ? 'info' : 'mute';
          col.appendChild(A(E('header'), E('i'), E('b', '', s), E('span', '', l.length), E('em', '', short(sum(l)))));
          l.slice(0, 6).forEach(function (x) { var e = E('div', 'c-kc'); e.tabIndex = 0; e.setAttribute('role', 'button'); A(e, A(E('p'), E('b', '', x.n), E('span', '', short(x.v))), E('small', '', x.d), A(E('footer'), chip(x.src, SRC[x.src]), E('time', '', wl(x.last)), own ? av(x.own, 'c-xs') : null)); drag(e, x); col.appendChild(e); });
          if (!l.length) col.appendChild(E('p', 'c-knone', 'Nothing in this stage'));
          if (l.length > 6) col.appendChild(B('+' + (l.length - 6) + ' more', 'c-lk', function () { tab.pipe = 'list'; paint(); }));
          k.appendChild(col);
        });
        c.appendChild(k); ph.hint = sell ? 'Drag a card to the next stage, or click it to open the record.' : 'Click a card to open the record.';
      },
      cal: function (c, tb, ph) {
        var L = evs(), ws = Math.floor(D.day / 7) * 7, g = E('div', 'c-wk'), i, sell = M.can('sell');
        if (sell) ph.acts.appendChild(act('Book a ' + P.w.book.toLowerCase(), 'c-cta', function () { if (P.rooms) M.book(M.who(), '', D.day + 1); else bookNext(D.day + 1, '11:00 am'); }, 'plus'));
        if (tb === 'agenda') return c.appendChild(tbl({ key: 'agenda', noun: P.w.cal.toLowerCase(), q: function (e) { return e.n + ' ' + e.w + ' ' + e.who; }, cols: evCols(C.role === 'owner'), rows: L, on: openEv, empty: ['cal', 'Nothing booked', 'Book from “' + P.home + '” or from a record.'] }));
        for (i = ws; i < ws + 7; i++) (function (day) {
          var col = E('div', 'c-wd'), l = L.filter(function (e) { return e.day === day; }), a;
          if (day === D.day) col.dataset.now = 1; else if (day < D.day) col.dataset.past = 1;
          col.appendChild(A(E('header'), E('span', '', dn(day)), E('b', '', dstr(day).split(' ')[0])));
          l.forEach(function (e) { var b = B('', 'c-ev', function () { openEv(e); }); b.dataset.t = e.done ? 'mute' : e.job ? 'ok' : e.st === 'confirmed' ? 'info' : 'warn'; A(b, E('small', '', e.tm), E('b', '', e.n), E('span', '', e.w.split(' · ')[0])); col.appendChild(b); });
          if (day >= D.day && sell) { a = B('', 'c-add', function () { if (P.rooms) M.book(M.who(), '', day); else bookNext(day, l.length ? '3:00 pm' : '11:00 am'); paint(); }); a.appendChild(ic('plus')); a.setAttribute('aria-label', 'Book ' + M.peek() + ' in on ' + LONG[day % 7]); col.appendChild(a); }
          g.appendChild(col);
        })(i);
        c.appendChild(g); ph.hint = sell ? 'The plus under a day books ' + M.peek() + ' in. Click a booking to open it.' : 'Click a booking to open it.';
      },
      stock: function (c, tb, ph) {
        var edit = C.role !== 'sales';
        if (tb === 'moves') return c.appendChild(tbl({ key: 'moves', noun: 'movements', q: function (m) { return m.n + ' ' + m.why; }, cols: [{ t: 'When', w: '128px', m: 1, c: function (m) { return day2(m.day); } }, { t: 'Item', m: 1, c: function (m) { return m.n; } }, { t: 'Change', w: '110px', r: 1, m: 1, c: function (m) { return chip(m.k === 'res' ? m.q + ' held' : (m.q > 0 ? '+' : '−') + Math.abs(m.q), m.k === 'res' ? 'warn' : m.q > 0 ? 'ok' : 'mute'); } }, { t: 'Reason', w: 'minmax(0,1.6fr)', c: function (m) { return m.why; } }],
          rows: D.moves.slice(0, 14), empty: ['box', 'Nothing has moved yet', 'Win a deal or approve an order and the ledger fills in.'] }));
        if (tb === 'pos') return c.appendChild(poTbl(D.pos, 1));
        c.appendChild(tbl({ key: 'stock', noun: 'items', q: function (s) { return s.n + ' ' + s.sup; }, cols: [{ t: 'Item', w: 'minmax(0,1.6fr)', m: 1, s: function (s) { return s.n.toLowerCase(); }, c: function (s) { return two(s.n, 'SKU-' + (101 + D.stock.indexOf(s)) + ' · ' + cap(s.sup)); } },
          edit ? { t: 'On hand', r: 1, w: '92px', s: function (s) { return s.q; }, c: function (s) { return String(s.q); } } : null, edit ? { t: 'Reserved', r: 1, w: '92px', c: function (s) { return s.res ? String(s.res) : null; } } : null,
          { t: 'Available', r: 1, w: '116px', m: 1, s: function (s) { return s.q - s.res; }, c: function (s) { return E('b', '', (s.q - s.res) + ' ' + s.u); } }, edit ? { t: 'Reorder at', r: 1, w: '104px', c: function (s) { return String(s.min); } } : null,
          { t: 'Level', w: '120px', c: function (s) { var b = E('i', 'c-lvl'); b.style.setProperty('--w', Math.min(100, s.q / s.of * 100) + '%'); b.style.setProperty('--f', Math.min(100, Math.max(0, s.q - s.res) / s.of * 100) + '%'); if (s.q - s.res <= s.min) b.dataset.low = 1; return b; } },
          { t: 'Status', w: 'minmax(0,1.3fr)', m: 1, c: function (s) { return stockState(s, edit); } }],
          rows: D.stock }));
        ph.hint = edit ? 'Available is what can still be promised: on hand, less what is reserved for won deals.' : '';
      },
      inv: function (c, tb, ph) {
        var L = invs(), due = L.filter(unpaid), n = function (f) { return L.filter(f).length; }, F = { all: function () { return true; }, due: unpaid, over: function (v) { return v.over; }, paid: function (v) { return v.st === 'paid'; } };
        c.appendChild(stats([['Received', short(D.paid), D.pays.length + ' payments', 'ok', 'check'], ['To collect', short(sum(due)), due.length + ' open', 'info', 'receipt'], ['Overdue', short(sum(due.filter(F.over))), n(F.over) + ' to chase', n(F.over) ? 'bad' : 'mute', 'clock']]));
        if (tb === 'pays') return c.appendChild(tbl({ key: 'pays', noun: 'payments', q: function (x) { return x.n + ' ' + x.id + ' ' + x.how; }, cols: [{ t: 'Received', w: '128px', m: 1, c: function (x) { return day2(x.day); } }, { t: 'Customer', m: 1, c: function (x) { return x.n; } }, { t: 'Invoice', w: '120px', c: function (x) { return code(x.id); } }, { t: 'Method', w: '170px', c: function (x) { return cap(x.how); } }, { t: 'Amount', r: 1, w: '120px', m: 1, c: function (x) { return inr(x.v); } }],
          rows: D.pays.slice(0, 12), on: function (x) { jump(['inv', x.id]); }, empty: ['receipt', 'No payments yet'] }));
        c.appendChild(tbl({ key: 'invs', noun: 'invoices', q: function (v) { return v.id + ' ' + v.n + ' ' + v.lines[0][0]; }, left: seg([['all', 'All', n(F.all)], ['due', 'Unpaid', n(F.due)], ['over', 'Overdue', n(F.over)], ['paid', 'Paid', n(F.paid)]], filt, function (v) { filt = v; paint(); }),
          cols: [{ t: 'Invoice', w: '112px', m: 1, s: function (v) { return v.id; }, c: function (v) { return code(v.id); } }, { t: 'Customer', w: 'minmax(0,1.5fr)', m: 1, s: function (v) { return v.n.toLowerCase(); }, c: function (v) { return two(v.n, v.lines[0][0]); } }, { t: 'Issued', w: '100px', c: function (v) { return dstr(v.made); } }, { t: 'Due', w: '118px', s: function (v) { return v.due; }, c: function (v) { return day2(v.due); } },
            { t: 'Amount', r: 1, w: '112px', m: 1, s: function (v) { return v.v; }, c: function (v) { return inr(v.v); } }, { t: 'Status', w: '170px', m: 1, c: function (v) { return chip(ist(v)[0], ist(v)[1]); } }],
          rows: L.filter(F[filt] || F.all), on: function (v) { jump(['inv', v.id]); }, empty: ['receipt', 'No invoices here', 'Nothing matches this filter.'] }));
      },
      chat: function (c, tb, ph) {
        var b = C.name || 'your business', cur = D.chats.filter(function (x) { return x.n === thr; })[0] || D.chats[0], w = E('div', 'c-inbox'), ls = E('div', 'c-il'), th = E('div', 'c-it'), info = E('aside', 'c-ii'), ms = E('div', 'c-msgs'), f = E('form', 'c-comp'), inp = E('input'), l, e, v;
        if (tb === 'tpl') return c.appendChild(tbl({ key: 'tpl', noun: 'templates', cols: [{ t: 'Template', w: 'minmax(0,1fr)', m: 1, c: function (x) { return two(x[0], 'Sent ' + AU[x[1]][1].charAt(0).toLowerCase() + AU[x[1]][1].slice(1)); } }, { t: 'Message', w: 'minmax(0,2fr)', c: function (x) { return E('span', 'c-wrap', x[2]); } }, { t: 'Status', w: '90px', m: 1, c: function (x) { var on = C.autos[AU[x[1]][0]]; return chip(on ? 'On' : 'Off', on ? 'ok' : 'mute'); } }],
          rows: [['Booking confirmation', 0, 'Confirmed: ' + P.w.book.toLowerCase() + ', {day} at {time}. Reply 1 to change it. Thank you, ' + b + '.'], ['Reminder on the day', 0, 'A reminder from ' + b + ': your ' + P.w.book.toLowerCase() + ' is today at {time}. See you then.'], ['Payment reminder', 3, 'A gentle reminder: {invoice} for {amount} was due on {day}. You can pay from your portal link.'], ['When the job is finished', 4, P.w.ty]] }));
        if (!cur) return c.appendChild(A(card(), empty('chat', 'No conversations yet', 'Messages from customers arrive here and file themselves as leads.')));
        D.chats.slice(0, 8).forEach(function (x) { var last = x.m[x.m.length - 1], t = B('', '', function () { thr = x.n; x.un = 0; paint(); }); if (x === cur) t.setAttribute('aria-current', 'true'); A(t, av(x.n), A(E('span'), E('b', '', x.n), E('small', '', last[1])), A(E('em'), T(wl(last[2]))), x.un && x !== cur ? E('i', 'c-cnt', x.un) : null); ls.appendChild(t); });
        cur.un = 0;
        th.appendChild(A(E('header'), who(cur.n, 'WhatsApp'), chip('Assistant on · scripted replies', 'ok')));
        cur.m.slice(-7).forEach(function (x) { var p = A(E('p'), T(x[1]), E('time', '', when(x[2]))); if (!x[0]) p.dataset.me = 1; ms.appendChild(p); });
        th.appendChild(ms);
        if (D.qr.length) { var q = A(E('div', 'c-try'), E('span', '', 'Preview a customer message')); D.qr.forEach(function (x, i) { q.appendChild(B(x[0], '', function () { thr = M.ask(i); paint(); })); }); th.appendChild(q); }
        inp.type = 'text'; inp.placeholder = 'Reply to ' + first(cur.n); inp.setAttribute('aria-label', 'Reply'); inp.maxLength = 160;
        f.addEventListener('submit', function (ev) { ev.preventDefault(); var t = inp.value.trim(); if (!t) return; M.send(cur.n, t); thr = cur.n; paint(); });
        A(f, inp, A(E('button', 'c-btn c-pri'), ic('send'), E('span', '', 'Send'))); th.appendChild(f);
        l = D.leads.filter(function (x) { return x.n === cur.n; })[0]; e = D.ev.filter(function (x) { return x.n === cur.n && !x.done; })[0]; v = D.invs.filter(function (x) { return x.n === cur.n && x.st !== 'paid'; })[0];
        A(info, E('h5', '', 'About ' + cur.n), kv([l ? [one(P.w.pipe).charAt(0).toUpperCase() + one(P.w.pipe).slice(1), link(l.d, ['lead', l.id])] : null, l ? ['Stage', chip(lst(l)[0], lst(l)[1])] : null, l ? ['Owner', l.own] : null, e ? [P.w.book, link(when(e.day) + ', ' + e.tm, ['ev', e.id])] : null, v ? ['Unpaid', link(v.id + ' · ' + inr(v.v), ['inv', v.id])] : null]), !l ? E('p', '', 'Not linked to a record yet.') : null);
        A(c, A(w, ls, th, info));
      },
      field: function (c, tb, ph) {
        ph.acts.appendChild(btn('See ' + P.team.field[0] + '’s phone', '', function () { hook.role('field'); }, 'phone'));
        if (tb === 'route') return S.route(c, ph);
        var t = jobs(D.day), n = jobs(D.day + 1), own = true, a = card('Today', LONG[D.day % 7] + ', ' + dstr(D.day)), b;
        a.appendChild(tbl({ key: 'ftoday', noun: 'jobs', cols: evCols(own), rows: t, on: openEv, empty: ['pin', 'Nobody is out today', 'Bookings and paid deals put jobs here.'] })); c.appendChild(a);
        if (n.length) { b = card('Tomorrow'); b.appendChild(tbl({ key: 'ftom', noun: 'jobs', cols: evCols(own), rows: n, on: openEv })); c.appendChild(b); }
      },
      jobs: function (c) {
        var t = jobs(D.day), n = jobs(D.day + 1), l = E('div', 'c-jobs');
        function row(e) { var s = est(e), b = B('', 'c-job', function () { openEv(e); }); return A(b, E('time', '', e.tm), A(E('span'), E('b', '', e.n), E('small', '', e.w)), chip(s[0], s[1])); }
        l.appendChild(E('h5', '', 'Today · ' + dstr(D.day))); if (t.length) t.forEach(function (e) { l.appendChild(row(e)); }); else l.appendChild(empty('check', 'Nothing today', 'Bookings and paid deals land here.'));
        if (n.length) { l.appendChild(E('h5', '', 'Tomorrow')); n.forEach(function (e) { l.appendChild(row(e)); }); }
        c.appendChild(l);
      },
      route: function (c) {
        var t = jobs(D.day), m = E('div', 'c-map c-sm'), cd = card('Route', t.length ? t.length + (t.length > 1 ? ' stops' : ' stop') + ', in time order' : 'No stops today');
        m.appendChild(mapSvg());
        t.forEach(function (e, i) { var x = E('i', 'c-stop', i + 1); if (e.done) x.dataset.done = 1; x.style.left = 14 + i * 37 % 72 + '%'; x.style.top = 24 + i * 53 % 54 + '%'; m.appendChild(x); });
        cd.appendChild(tbl({ key: 'route', noun: 'stops', cols: [{ t: '#', w: '26px', m: 1, c: function (e) { return String(t.indexOf(e) + 1); } }, { t: 'Stop', w: 'minmax(0,1fr)', m: 1, c: function (e) { return two(e.n, e.tm + ' · ' + e.w.split(' · ').pop()); } }, { t: 'Status', w: 'minmax(104px,auto)', r: 1, m: 1, c: function (e) { return chip(est(e)[0], est(e)[1]); } }], rows: t, on: openEv, empty: ['pin', 'No stops today'] }));
        A(c, A(E('div', 'c-split'), m, cd));
      },
      rep: function (c, tb, ph) {
        var o, m, a, br, n = 0;
        function put(keys) { keys.filter(has).forEach(function (k) { c.appendChild(R[k]().card); n++; }); if (!n) c.appendChild(A(card(), empty('chart', 'Nothing to report on yet', 'These reports read the modules in the system. Add leads, invoices or inventory and they fill in.'))); }
        if (tb === 'act') return c.appendChild(tbl({ key: 'log', noun: 'events', q: function (e) { return e.t; }, cols: [{ t: 'When', w: '118px', m: 1, c: function (e) { return day2(e.day); } }, { t: 'Event', w: 'minmax(0,1.3fr)', m: 1, c: function (e) { return A(E('span', 'c-row'), e.a ? chip('Automation', 'acc') : null, link(e.t, e.ref)); } }, { t: 'What happened', w: 'minmax(0,1.5fr)', c: function (e) { return e.s.length ? E('span', 'c-wrap', e.s.map(function (x) { return x[0]; }).join(' → ')) : null; } }],
          rows: D.log.slice(0, 16), empty: ['bolt', 'Nothing has happened yet', 'Book something, win a deal or move the day on.'] }));
        if (tb === 'sales') return put(['source', 'visits', 'follow']);
        if (tb === 'money') {
          if (C.mods.inv) { o = weeks(); a = D.invs.filter(unpaid); m = D.pays.map(function (x) { var v = M.by(D.invs, x.id); return v ? Math.max(0, x.day - v.made) : 0; });
            c.appendChild(stats([['Invoiced', short(o.ti), 'in 8 weeks · ' + short(o.cur[0]) + ' this week', 'info', 'receipt'], ['Collected', short(o.tr), pct(o.rate) + ' of what was billed', o.rate < .86 ? 'warn' : 'ok', 'check'], ['Owed now', short(sum(a)), num(a.length, 'invoice') + ' unpaid', a.some(function (v) { return v.over; }) ? 'bad' : 'mute', 'clock'], ['Paid in', m.length ? num(Math.round(m.reduce(function (t, x) { return t + x; }, 0) / m.length), 'day') : 'No payments yet', 'from invoice to payment', 'acc', 'cal']])); }
          return put(['money', 'age']);
        }
        if (tb === 'ops') return put(OPSR[C.trade]);
        if (tb === 'team') return put(['team', 'site']);
        o = weeks(); m = month(); a = D.invs.filter(function (v) { return v.over && v.st !== 'paid'; });
        br = band([C.mods.pipe ? [cap(LEADW[C.trade]), m.e, 'in 30 days · ' + m.w + ' ' + WONW[C.trade], 'info', 'users'] : null, C.mods.pipe ? ['Conversion', pct(m.w / m.e), 'of every ' + one(LEADW[C.trade]), 'acc', 'chart'] : null, C.mods.inv ? ['Collected', pct(o.rate), short(o.tr) + ' of ' + short(o.ti), o.rate < .86 ? 'warn' : 'ok', 'receipt'] : null, C.mods.inv ? ['Owed and late', short(sum(a)), a.length ? num(a.length, 'invoice') + ' to chase' : 'nothing to chase', a.length ? 'bad' : 'ok', 'clock'] : null, C.mods.pipe ? ['On time', (function () { var t = 0, n = 0, k; for (k in P.hist.team) { t += P.hist.team[k][1]; n++; } return Math.round(t / n) + '%'; })(), 'of follow-ups, as a team', 'vio', 'bolt'] : null]); if (br.children.length) c.appendChild(br);
        br = card('This week, in brief', 'What needs a decision, most pressing first'); br.classList.add('c-briefs');
        BRIEF[C.trade].filter(has).forEach(function (k) { var x = R[k](); br.appendChild(A(E('div', 'c-brief'), E('b', '', x.title), E('p', '', x.means), A(E('p'), E('span', 'c-lb', 'What to do'), T(x.todo)), x.b ? btn(x.b[0], '', x.b[1], 'arrow') : null)); });
        if (!br.querySelector('.c-brief')) br.appendChild(empty('chart', 'Nothing to brief on yet', 'These reports read the modules in the system. Add leads, invoices or inventory and they fill in.'));
        c.appendChild(br); if (C.mods.inv) c.appendChild(R.money().card);
      },
      portal: function (c, tb, ph) {
        var names = [], n, e, L, v, p = E('div', 'c-portal'), t, m, sel = E('select'), hd;
        D.ev.forEach(function (x) { if (names.indexOf(x.n) < 0) names.push(x.n); }); D.invs.forEach(function (x) { if (x.src !== 'sale' && names.indexOf(x.n) < 0) names.push(x.n); });
        n = names.indexOf(cust) >= 0 ? cust : names[0]; e = D.ev.filter(function (x) { return x.n === n; }).pop(); L = D.invs.filter(function (x) { return x.n === n; }); v = L.filter(unpaid)[0];
        names.forEach(function (x) { var o = E('option', '', x); o.selected = x === n; sel.appendChild(o); }); sel.setAttribute('aria-label', 'Customer to view the portal as'); sel.addEventListener('change', function () { cust = sel.value; paint(); });
        if (names.length) ph.acts.appendChild(A(E('label', 'c-pick'), E('span', '', 'Viewing as'), sel));
        hd = A(E('header'), E('i', 'c-logo', (C.name || 'Y').charAt(0).toUpperCase()), E('b', '', C.name || 'Your business'), E('span', '', label('portal')));
        if (tb === 'bills') { t = card('Your bills'); t.appendChild(C.mods.inv ? tbl({ key: 'bills', noun: 'bills', cols: [{ t: 'Bill', w: '110px', m: 1, c: function (x) { return code(x.id); } }, { t: 'For', m: 1, c: function (x) { return x.lines[0][0]; } }, { t: 'Status', w: '110px', m: 1, c: function (x) { return chip(ist(x)[0].split(' · ')[0], ist(x)[1]); } }, { t: 'Amount', r: 1, w: '150px', m: 1, c: function (x) { return x.st === 'paid' ? inr(x.v) : act('Pay ' + inr(x.v), 'c-pri', function () { M.pay(x, 'card, in the portal'); }); } }], rows: L, empty: ['receipt', 'Nothing to pay'] }) : empty('receipt', 'Bills are not switched on', 'They appear here once invoices and payments are part of the system.', btn('Add ' + modName('inv'), 'c-pri', function () { hook.add('inv'); }, 'plus'))); return c.appendChild(A(p, hd, t)); }
        t = card('Hello, ' + (n || 'there'), e ? e.w + ' · ' + when(e.day) + ', ' + e.tm : 'Nothing is booked yet');
        t.appendChild(pad(path([['Booked', !!e], ['Confirmed', !!e && e.st === 'confirmed'], ['Invoice sent', L.length > 0], ['Paid', L.length > 0 && !v], [P.w.fin, !!e && e.done]]), kv([e ? ['When', when(e.day) + ', ' + e.tm + ' · ' + dstr(e.day)] : null, e ? ['With', e.who + ', ' + P.team.field[1].toLowerCase()] : null, v ? ['To pay', inr(v.v) + ' by ' + dstr(v.due)] : L.length ? ['Bills', 'All paid, thank you'] : null]), e && e.on && !e.done ? A(E('p', 'c-live'), ic('pin'), T(e.who + ' is on site now.')) : null, v && C.mods.inv ? act('Pay ' + inr(v.v), 'c-pri', function () { M.pay(v, 'card, in the portal'); }, 'receipt') : null));
        A(p, hd, t); m = D.chats.filter(function (x) { return x.n === n; })[0];
        if (m) { var ms = E('div', 'c-msgs'); m.m.slice(-3).forEach(function (x) { var q = A(E('p'), T(x[1])); if (x[0]) q.dataset.me = 1; ms.appendChild(q); }); p.appendChild(A(card('Messages'), pad(ms))); }
        c.appendChild(p); ph.hint = 'What a customer sees when they follow their link. Pick whose portal to look at, top right.';
      },
      arch: function (c, tb, ph) { sysMap(c, ph); }
    };
    /* ---- the system map: the people and the parts across the top, and every chain of work as arrows between them, in the order a
       deal lives through them. It is drawn from the same rules the app runs on (the automations in biz.js and what the model does
       when an enquiry arrives, a link is opened or an invoice is paid), so switching a part or a rule off changes the drawing. ---- */
    var COLS = ['cust', 'chat', 'portal', 'pipe', 'cal', 'stock', 'field', 'inv', 'team'];
    var LANES = [['', 1], ['Customer side', 2], ['Sales', 2], ['Operations', 2], ['Money', 1], ['', 1]];
    function part(m) { return m === 'cust' || m === 'team' || !!C.mods[m]; }
    function partName(m) { return m === 'cust' ? label('portal').split(' ')[0] : m === 'team' ? 'Your team' : label(m); }
    function partNote(m) {
      var due, low;
      if (m === 'cust') return '';
      if (m === 'team') return needs().length ? needs().length + ' waiting' : 'all clear';
      if (!C.mods[m]) return '+ Add';
      if (m === 'chat') return num(D.chats.length, 'chat');
      if (m === 'portal') return 'status, bills';
      if (m === 'pipe') return D.leads.filter(function (l) { return l.s < 2; }).length + ' open';
      if (m === 'cal') return jobs(D.day).length + ' today';
      if (m === 'stock') { low = D.stock.filter(function (x) { return x.q - x.res <= x.min; }).length; return low ? low + ' low' : 'all in stock'; }
      if (m === 'field') return D.ev.filter(function (e) { return !e.done; }).length + ' to do';
      due = D.invs.filter(unpaid); return due.length ? short(sum(due)) + ' owed' : 'all paid';
    }
    /* every chain: its key, its name, the part that sets it off, and its steps as [from, to, what happens] */
    function chains() {
      var wa = C.mods.chat, msg = wa ? 'chat' : 'cust', who = partName('cust').toLowerCase(), end = C.mods.field ? 'field' : 'cal';
      function by(t) { return wa ? t : t.replace('on WhatsApp', 'by email'); }
      return [
        { k: 'ask', t: 'When an enquiry arrives on WhatsApp', need: 'chat', steps: [['cust', 'chat', 'asks, at any hour'], ['chat', 'pipe', 'answered and filed with an owner']].concat(P.mid ? [['pipe', 'cal', 'books the ' + P.w.book.toLowerCase() + ' when asked']] : []) },
        { k: 'a6', t: AU[5][1], need: 'pipe', steps: [['pipe', 'team', AU[5][2][0]]] },
        { k: 'a1', t: AU[0][1], need: 'cal', steps: [['cal', msg, by(AU[0][2][0])], P.fee ? ['cal', 'inv', AU[0][2][1]] : ['cal', 'team', AU[0][2][1]], ['cal', msg, AU[0][2][2]]] },
        { k: 'a2', t: AU[1][1], need: 'pipe', steps: [['pipe', 'inv', AU[1][2][0]], ['pipe', 'stock', AU[1][2][1]]] },
        { k: 'a3', t: AU[2][1], need: 'stock', steps: [['stock', 'team', AU[2][2][0]], ['stock', 'stock', AU[2][2][1]]] },
        { k: 'link', t: 'When a ' + who + ' opens their link', need: 'portal', steps: [['cust', 'portal', 'sees where things stand'], ['portal', 'inv', 'pays the bill online']] },
        { k: 'a4', t: AU[3][1], need: 'inv', steps: [['inv', msg, AU[3][2][0]], ['inv', 'team', AU[3][2][1]]] },
        { k: 'paid', t: 'When an invoice is paid', need: 'inv', steps: [['inv', 'cust', 'send the receipt'], ['inv', 'stock', 'issue the stock'], ['inv', 'field', 'set the ' + P.w.job.toLowerCase() + ' for ' + P.team.field[0]]] },
        { k: 'a5', t: AU[4][1], need: end, steps: [[end, msg, AU[4][2][0]], [end, 'inv', AU[4][2][1]]] }
      ];
    }
    function chainOf(e) { return e.a || (/^(Enquiry at|WhatsApp enquiry)/.test(e.t) && C.mods.chat && !/unanswered/.test(e.t) ? 'ask' : / paid · /.test(e.t) ? 'paid' : ''); }
    function sysMap(c, ph) {
      var F = chains(), tel = phone(), now = Date.now() - ticked < 500, cnt = {}, ran = {}, w = E('div', 'c-sys'), hd = E('div', 'c-sysh'), bd = E('div', 'c-sysb'), ft = E('footer', 'c-sysf'), leg = E('div', 'c-sysk');
      D.log.forEach(function (e) { var k = chainOf(e); if (!k) return; cnt[k] = (cnt[k] || 0) + 1; if (e.day === D.day && D.day > 0 && !ran[k]) ran[k] = e; });
      function visit(m) { return function () { if (m === 'team') go(sees('pipe') ? 'pipe' : 'home', sees('pipe') ? 'tasks' : null); else go(m); }; }
      function node(m) {
        var on = part(m), b = m === 'cust' ? E('div', 'c-nd') : B('', 'c-nd', on ? visit(m) : function () { hook.add(m); });
        if (m === 'cust' || m === 'team') b.dataset.who = 1; if (!on) { b.dataset.miss = 1; b.setAttribute('aria-label', 'Add ' + label(m) + ' to the system'); } else if (m !== 'cust' && m !== 'team' && !sees(m)) b.disabled = true;
        b.dataset.m = m; if (/\S{11,}/.test(partName(m))) b.dataset.long = 1; return A(b, E('b', '', partName(m)), partNote(m) ? E('small', '', partNote(m)) : null);
      }
      function state(f, on, miss) {
        var p = E('p'), auto = /^a\d$/.test(f.k), e = ran[f.k], t;
        if (miss) p.appendChild(B('Add ' + label(f.need), 'c-lk', function () { hook.add(f.need); }));
        else if (auto) { t = B(on ? 'On' : 'Off', 'c-tg', function () { if (hook.auto) hook.auto(f.k); else { C.autos[f.k] = on ? 0 : 1; paint(); } }); t.setAttribute('aria-pressed', on); t.setAttribute('aria-label', f.t + ': ' + (on ? 'on. Press to switch it off' : 'off. Press to switch it on')); p.appendChild(t); }
        else p.appendChild(E('span', 'c-bi', 'Built in'));
        if (!miss) p.appendChild(E('small', '', e ? 'ran this morning' + (e.ref && e.ref[0] !== 'lead' && e.ref[0] !== 'stock' ? ' · ' + e.ref[1] : '') : cnt[f.k] ? 'ran ' + cnt[f.k] + (cnt[f.k] > 1 ? ' times' : ' time') + ' this week' : on ? 'has not run yet' : ''));
        return p;
      }
      w.style.setProperty('--cols', COLS.length);
      F.forEach(function (f) {
        var auto = /^a\d$/.test(f.k), on = !auto || !!C.autos[f.k], miss = !C.mods[f.need], fr = E('section', 'c-fr'), ars = E(tel ? 'ol' : 'div', 'c-ars');
        fr.dataset.k = f.k; if (!on) fr.dataset.off = 1; if (miss) fr.dataset.miss = 1; if (ran[f.k] && on && !miss) fr.dataset.ran = 1;
        f.steps.forEach(function (st, i) {
          var a = COLS.indexOf(st[0]), b = COLS.indexOf(st[1]), lo = Math.min(a, b), hi = Math.max(a, b), need = [st[0], st[1]].filter(function (m) { return !part(m); })[0], p = E(tel ? 'li' : 'p', 'c-ar'), txt;
          if (need) p.dataset.need = 1;
          txt = need && !miss ? B(st[2] + ' · add ' + label(need), '', function () { hook.add(need); }) : E('span', '', st[2]);
          if (tel) return ars.appendChild(A(p, A(E('small'), T(partName(st[0])), a === b ? null : ic('arrow'), a === b ? null : T(partName(st[1]))), txt));
          p.style.gridColumn = (lo + 1) + ' / ' + (hi + 2); p.style.gridRow = String(i + 1); p.style.setProperty('--n', hi - lo + 1);
          p.dataset.dir = a === b ? 'self' : b > a ? 'r' : 'l'; p.dataset.al = lo + hi < COLS.length - 1 ? 'l' : 'r';
          ars.appendChild(A(p, txt, E('i')));
        });
        bd.appendChild(A(fr, A(E('header'), E('b', '', f.t), state(f, on, miss)), ars));
      });
      A(leg, E('b', '', 'How work moves'), A(E('p'), E('i'), T('a step that runs by itself')), A(E('p'), E('i'), T('needs a part that is not in the system')));
      if (tel) { hd.appendChild(E('p', 'c-ln', 'The parts')); COLS.forEach(function (m) { if (m !== 'cust' && m !== 'team') hd.appendChild(node(m)); }); }
      else { hd.appendChild(leg); LANES.forEach(function (l, i) { var e = E('span', 'c-ln', l[0]); e.style.gridColumn = 'span ' + l[1]; if (!l[0]) e.dataset.none = 1; hd.appendChild(e); }); COLS.forEach(function (m) { hd.appendChild(node(m)); });
        COLS.forEach(function (m, i) { var l = E('i', 'c-ll'); l.style.setProperty('--k', i); if (!part(m)) l.dataset.miss = 1; bd.insertBefore(l, bd.firstChild); }); }
      A(ft, C.mods.rep ? A(B('', 'c-nd', function () { go('rep'); }), E('b', '', label('rep')), E('small', '', 'counts every step above')) : A(B('', 'c-nd', function () { hook.add('rep'); }), E('b', '', label('rep')), E('small', '', '+ Add')),
        E('p', '', 'One set of records underneath. A step never copies anything from one screen to another: it changes the record, and every part that shows it changes with it.'));
      if (!C.mods.rep) ft.firstChild.dataset.miss = 1; else if (!sees('rep')) ft.firstChild.disabled = true;
      if (tel) w.dataset.tel = 1;
      c.appendChild(A(w, hd, bd, ft));
      ph.hint = 'Press a part to open it, or a rule to switch it. “Next day” sends the night’s work along these lines.';
      if (now && !still.matches) setTimeout(function () { flowNow(bd, tel); }, 80);
    }
    /* after the clock moves, what ran overnight travels along its lines, one chain after another */
    var NIGHT = { a1: [2], ask: [0, 1] };
    function flowNow(bd, tel) {
      var t = 0;
      [].forEach.call(bd.querySelectorAll('.c-fr[data-ran]'), function (fr) {
        var only = NIGHT[fr.dataset.k];
        [].forEach.call(fr.querySelectorAll('.c-ar'), function (p, i) {
          var line = p.querySelector('i'), dot, rev = p.dataset.dir === 'l';
          if (p.dataset.need || (only && only.indexOf(i) < 0)) return;
          if (tel || !line || p.dataset.dir === 'self') { p.animate([{ opacity: 1 }, { opacity: .35, offset: .4 }, { opacity: 1 }], { duration: 700, delay: t, easing: 'ease-in-out' }); t += 420; return; }
          dot = E('b', 'c-tok'); line.appendChild(dot);
          p.animate([{ '--lc': 'var(--c-ac-tx)' }, { '--lc': 'var(--c-ac-tx)' }], { duration: 950, delay: t });
          dot.animate([{ left: rev ? '100%' : '0%', opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: 1, offset: .85 }, { left: rev ? '0%' : '100%', opacity: 0 }], { duration: 950, delay: t, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'both' }).onfinish = function () { if (dot.parentNode) dot.parentNode.removeChild(dot); };
          t += 520;
        });
        t += 260;
      });
    }
    function poTbl(rows, tools) {
      return tbl({ key: 'pos', noun: P.w.po.toLowerCase() + 's', q: tools ? function (o) { return o.id + ' ' + o.n + ' ' + o.sup; } : null, cols: [{ t: 'Number', w: '108px', m: 1, c: function (o) { return code(o.id); } }, { t: 'Item', m: 1, c: function (o) { return two(o.n, o.q + ' ' + D.stock[o.i].u); } }, { t: 'Supplier', c: function (o) { return cap(o.sup); } }, { t: 'Why', c: function (o) { return o.why; } },
        { t: 'Status', w: '150px', m: 1, c: function (o) { return chip(o.st === 'draft' ? 'Waiting for approval' : o.st === 'ordered' ? 'Due ' + wl(o.eta) : 'Received', o.st === 'draft' ? 'warn' : o.st === 'ordered' ? 'info' : 'ok'); } },
        { t: '', r: 1, w: '170px', m: 1, c: function (o) { return o.st === 'draft' ? (M.can('approve') ? act('Approve and send', 'c-pri', function () { M.approve(o); }) : E('small', '', 'Only ' + P.team.owner[0] + ' approves')) : o.st === 'ordered' ? act('Mark received', '', function () { M.receive(o); }) : null; } }],
        rows: rows, empty: ['truck', 'No ' + P.w.po.toLowerCase() + 's', 'One is drafted when stock falls to its reorder level.'] });
    }

    /* ---- records: a lead, a booking, an invoice. Three regions (facts, work, activity); each look arranges them its own way ---- */
    var DET = {
      lead: function (c, l, ph) {
        var sell = M.can('sell'), s = D.stock[l.need[0]], po = M.openPO(l.need[0]), rows = [], K = D.tasks.filter(function (x) { return x.ref && x.ref[1] === l.id; }), a = E('aside', 'c-ra'), m = E('div', 'c-rm'), b = E('aside', 'c-rb'), lk = card('Linked records'), st = card('Stage'), tk;
        if (sell && l.s === 0) ph.acts.appendChild(act(P.mid ? 'Book a ' + P.w.book.toLowerCase() : 'Move to “' + P.st[1] + '”', 'c-pri', function () { M.stage(l, 1); }, P.mid ? 'cal' : 'arrow'));
        if (sell && l.s < 2) ph.acts.appendChild(act('Mark as ' + P.st[2].toLowerCase(), l.s ? 'c-ok' : '', function () { M.win(l); }, 'check'));
        if (sell && l.s === 2 && !l.inv && C.mods.inv) ph.acts.appendChild(act('Raise the invoice', 'c-pri', function () { M.raise(l); }, 'receipt'));
        if (sell && l.s === 2 && C.mods.stock && !l.res && !l.out && !l.short) ph.acts.appendChild(act('Reserve the stock', '', function () { M.hold(l); }, 'box'));
        A(a, A(E('div', 'c-id'), av(l.n, 'c-lg'), A(E('span'), E('b', '', l.n), code(l.id))), A(card('Details'), pad(kv([['Requirement', l.d], ['Value', inr(l.v)], ['Source', chip(l.src, SRC[l.src])], ['Owner', per(l.own)], ['Last activity', when(l.last) + ', ' + dstr(l.last)]]))));
        st.appendChild(pad(path(P.st.map(function (x, i) { return [x, i <= l.s]; })))); m.appendChild(st);
        D.ev.forEach(function (e) { if (e.lead === l.id) rows.push([e.job ? 'Job' : P.w.book, e.id, when(e.day) + ', ' + e.tm, est(e), '', ['ev', e.id]]); });
        [l.inv, l.bal].forEach(function (id) { var v = id && M.by(D.invs, id); if (v) rows.push(['Invoice', v.id, v.lines[0][0], ist(v), inr(v.v), ['inv', v.id]]); });
        if (C.mods.stock && (l.res || l.out || l.short)) rows.push(['Stock', l.need[1] + ' × ' + s.n, l.short ? l.short + ' short' + (po ? ' · ' + po.id + (po.st === 'draft' ? ' is waiting for approval' : ' is on its way') : '') : l.out ? 'Issued when the invoice was paid' : 'Held until the invoice is paid', [l.short ? 'Short' : l.out ? 'Issued' : 'Reserved', l.short ? 'warn' : l.out ? 'ok' : 'info'], '', ['stock', l.need[0]]]);
        lk.appendChild(tbl({ key: 'linked', cols: [{ t: 'Record', w: 'minmax(0,1fr)', m: 1, c: function (x) { return two(x[1], x[0] + (x[4] ? ' · ' + x[4] : '') + ' · ' + x[2]); } }, { t: 'Status', w: 'auto', r: 1, m: 1, c: function (x) { return chip(x[3][0], x[3][1]); } }], rows: rows, on: function (x) { if (where(x[5])) jump(x[5]); }, empty: ['file', 'Nothing linked yet', 'A booking, an invoice and reserved stock show up here as they are created.'] }));
        m.appendChild(lk);
        if (K.length) { tk = card('Tasks'); tk.classList.add('c-tasks'); K.forEach(function (k) { var r = E('div', 'c-task'); if (k.done) r.dataset.done = 1; A(r, check(k.done, 'Done: ' + k.t, function () { M.done(k); paint(); }), A(E('span'), E('b', '', k.t), E('small', '', 'Due ' + wl(k.due))), per(k.who)); tk.appendChild(r); }); m.appendChild(tk); }
        b.appendChild(A(card('Activity'), pad(tline(l.log)))); A(c, a, m, b);
      },
      ev: function (c, e, ph) {
        var v = e.inv && M.by(D.invs, e.inv), office = M.can('sell'), site = M.can('site'), a = E('aside', 'c-ra'), m = E('div', 'c-rm'), b = E('aside', 'c-rb'), ck, st = card('Progress');
        if (!e.done) {
          if (office && e.st !== 'confirmed') ph.acts.appendChild(act('Send the confirmation', 'c-pri', function () { M.confirm(e); }, 'send'));
          if (office && P.fee && !e.inv && !e.job && C.mods.inv) ph.acts.appendChild(act('Raise the advance invoice', '', function () { M.advance(e); }, 'receipt'));
          if (office && !e.rem) ph.acts.appendChild(act('Send a reminder', '', function () { M.nudge(e); }, 'bell'));
          if (site && !e.on) ph.acts.appendChild(act('Check in', 'c-pri', function () { M.checkin(e); }, 'pin'));
          if (site && e.on) ph.acts.appendChild(act('Finish', 'c-ok', function () { M.finish(e); }, 'check'));
        }
        A(a, A(E('div', 'c-id'), av(e.n, 'c-lg'), A(E('span'), E('b', '', e.n), code(e.id))), A(card('Details'), pad(kv([['What', e.w], ['When', when(e.day) + ', ' + e.tm], ['Date', dstr(e.day)], ['On site', per(e.who)], ['Booked by', cap(e.by)]]))));
        st.appendChild(pad(path([['Booked', 1], ['Confirmed', e.st === 'confirmed'], ['Reminded', e.rem], ['On site', e.on], ['Done', e.done]]))); m.appendChild(st);
        if (site) { ck = card('Checklist', e.done ? 'All done' : e.on ? '' : 'Check in to start'); ck.classList.add('c-tasks'); P.check.forEach(function (x, i) { var on = !!(e.chk[i] || e.done), r = E('div', 'c-task'); if (on) r.dataset.done = 1; A(r, check(on, x, function () { if (e.done || !e.on) return; e.chk[i] = !e.chk[i]; paint(); }), A(E('span'), E('b', '', x))); ck.appendChild(r); }); m.appendChild(ck); }
        if (v && C.role !== 'field') m.appendChild(A(card('Advance'), tbl({ key: 'adv', cols: [{ t: 'Invoice', w: '110px', m: 1, c: function (x) { return code(x.id); } }, { t: 'For', m: 1, c: function (x) { return x.lines[0][0]; } }, { t: 'Status', w: '170px', m: 1, c: function (x) { return chip(ist(x)[0], ist(x)[1]); } }, { t: 'Amount', r: 1, w: '110px', m: 1, c: function (x) { return inr(x.v); } }], rows: [v], on: function (x) { if (where(['inv', x.id])) jump(['inv', x.id]); } })));
        b.appendChild(A(card('Activity'), pad(tline(e.log)))); A(c, a, m, b);
      },
      inv: function (c, v, ph) {
        var doc = E('div', 'c-doc'), tb = E('div', 'c-lines'), r = v.src === 'deal' || v.src === 'bal' ? ['lead', v.ref] : v.src === 'booking' ? ['ev', v.ref] : null, x, m = E('div', 'c-rm'), b = E('aside', 'c-rb'), pay = card(v.st === 'paid' ? 'Paid' : 'Amount due', v.st === 'paid' ? 'Thank you' : 'Due ' + wl(v.due) + ', ' + dstr(v.due));
        A(doc, A(E('header'), A(E('div'), E('i', 'c-logo', (C.name || 'Y').charAt(0).toUpperCase()), E('b', '', C.name || 'Your business')), A(E('div'), E('h5', '', 'Tax invoice'), code(v.id))),
          A(E('div', 'c-meta'), A(E('p'), E('small', '', 'Billed to'), E('b', '', v.n)), A(E('p'), E('small', '', 'Issued'), E('b', '', dstr(v.made))), A(E('p'), E('small', '', 'Due'), E('b', '', dstr(v.due)))));
        A(tb, E('small', '', 'Description'), E('small', '', 'Amount'));
        v.lines.forEach(function (y) { A(tb, E('span', '', y[0]), E('b', '', (y[1] < 0 ? '− ' : '') + inr(Math.abs(y[1])))); });
        A(tb, E('span', 'c-sub', 'Includes GST at 18%'), E('b', 'c-sub', inr(v.v - Math.round(v.v / 1.18))), E('span', 'c-tot', 'Total'), E('b', 'c-tot', inr(v.v))); doc.appendChild(tb); m.appendChild(doc);
        pay.appendChild(pad(E('b', 'c-big', inr(v.v)), chip(ist(v)[0], ist(v)[1])));
        if (v.st !== 'paid') { if (M.can('pay')) pay.appendChild(pad(act('Record payment · UPI', 'c-pri', function () { M.pay(v, 'UPI'); }, 'check'), act('Bank transfer', '', function () { M.pay(v, 'bank transfer'); }), act('Send a reminder', '', function () { M.remind(v); }, 'send'))); else pay.appendChild(pad(E('p', 'c-fine', 'Only ' + P.team.acct[0] + ' and ' + P.team.owner[0] + ' record payments.'))); }
        b.appendChild(pay);
        if (r && where(r)) { x = find({ t: r[0], id: r[1] }); if (x) b.appendChild(A(card('Raised from'), pad(A(B('', 'c-ref', function () { jump(r); }), who(x.n, r[0] === 'lead' ? x.d : x.w), ic('chevr'))))); }
        b.appendChild(A(card('Activity'), pad(tline(v.log.slice().reverse())))); A(c, m, b);
      }
    };
    /* a card is clicked to open it, or dragged to move the lead on */
    function drag(el, x) {
      var can = M.can('sell') && x.s < 2;
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(['lead', x.id]); } });
      el.addEventListener('pointerdown', function (e) {
        if (e.button) return; var sx = e.clientX, sy = e.clientY, r = el.getBoundingClientRect(), ar = app.getBoundingClientRect(), z = ar.width / app.offsetWidth || 1, over = null, g = null;
        function mv(ev) {
          if (!g) { if (!can || Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) return; g = el.cloneNode(true); g.className = 'c-kc c-drag'; g.style.width = r.width / z + 'px'; app.appendChild(g); el.style.opacity = .3; }
          g.style.left = (r.left - ar.left + ev.clientX - sx) / z + 'px'; g.style.top = (r.top - ar.top + ev.clientY - sy) / z + 'px'; var k = d.elementFromPoint(ev.clientX, ev.clientY); k = k && k.closest('.c-kcol'); if (k !== over) { if (over) delete over.dataset.over; over = k; if (k) k.dataset.over = 1; }
        }
        function up(ev) {
          removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
          if (!g) { if (ev.type === 'pointerup') jump(['lead', x.id]); return; }
          g.remove(); var s = over ? +over.dataset.s : -1; if (s > x.s) { if (s === 2) M.win(x); else M.stage(x, s); } paint();
        }
        addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up);
      });
    }

    /* ---- what each flow did, shown as it happens, and kept under the bell ---- */
    function show(e) {
      var t = E('div', 'c-toast'); if (e.a) t.dataset.a = 1; if (e.dayc) t.dataset.day = 1;
      t.appendChild(A(E('p'), ic(e.dayc ? 'clock' : e.a ? 'bolt' : 'check'), E('b', '', e.t)));
      e.s.forEach(function (x, i) { var s = E('span', '', x[0]); if (!x[1]) s.dataset.no = 1; s.style.animationDelay = (.35 + i * .4) + 's'; t.appendChild(s); });
      toasts.appendChild(t); while (toasts.children.length > 3) toasts.firstChild.remove();
      setTimeout(function () { t.remove(); }, 3600 + e.s.length * 900);
    }
    function emit(e) { var now = Date.now(), at = Math.max(now, tAt); tAt = at + 750; unseen++; if (at === now) show(e); else setTimeout(show, at - now, e); }
    function note(txt) { emit({ a: '', t: txt, s: [] }); unseen--; }
    function notes() {
      var p = E('div', 'c-pop c-notes'); p.appendChild(A(E('header'), E('b', '', 'Notifications'), E('span', '', D.fired + ' automations have run')));
      if (!D.log.length) p.appendChild(empty('bell', 'All quiet', 'What the system does on its own is listed here.'));
      D.log.slice(0, 7).forEach(function (e) { var b = B('', '', function () { if (e.ref && where(e.ref)) jump(e.ref); else { pop = ''; paint(); } }); A(b, A(E('i'), ic(e.a ? 'bolt' : 'check')), A(E('span'), E('b', '', e.t), e.s.length ? E('small', '', e.s.map(function (x) { return x[0]; }).join(' → ')) : null), E('time', '', when(e.day))); if (e.a) b.dataset.a = 1; p.appendChild(b); });
      return p;
    }
    /* search across the records a role may see */
    function results(q) {
      var out = [], v = q.toLowerCase();
      function hit(s) { return s.toLowerCase().indexOf(v) >= 0; }
      if (sees('pipe')) leads().forEach(function (l) { if (hit(l.n + ' ' + l.d)) out.push(['users', l.n, l.d, one(P.w.pipe), ['lead', l.id]]); });
      if (sees('inv')) invs().forEach(function (x) { if (hit(x.id + ' ' + x.n)) out.push(['receipt', x.id, x.n + ' · ' + inr(x.v), 'invoice', ['inv', x.id]]); });
      evs().forEach(function (e) { if (hit(e.n + ' ' + e.w + ' ' + e.id)) out.push(['cal', e.n, e.w + ' · ' + when(e.day), e.job ? 'job' : one(P.w.cal), ['ev', e.id]]); });
      if (sees('stock')) D.stock.forEach(function (s, i) { if (hit(s.n)) out.push(['box', s.n, (s.q - s.res) + ' ' + s.u + ' available', 'stock', ['stock', i]]); });
      return out.slice(0, 7);
    }
    function form() {
      var f = E('form', 'c-modal'), w = E('div', 'c-scrim'), nm = E('input'), it = E('select'), vl = E('input'), sr = E('select'), ow = E('select'), own = C.role === 'owner', what = one(P.w.pipe), err = E('p', 'c-err'), K = kinds();
      function fld(l, el, wide) { var x = A(E('label', 'c-f' + (wide ? ' c-wide' : '')), E('span', '', l), el); return x; }
      function close() { modal = null; paint(); }
      nm.type = 'text'; nm.maxLength = 32; nm.placeholder = 'Customer or company'; nm.value = modal.n; nm.addEventListener('input', function () { modal.n = nm.value; });
      K.forEach(function (k, i) { var o = E('option', '', k[0]); o.value = i; o.selected = i === modal.i; it.appendChild(o); }); it.addEventListener('change', function () { modal.i = +it.value; modal.v = K[modal.i][2]; vl.value = modal.v; });
      vl.type = 'number'; vl.min = 0; vl.step = 500; vl.value = modal.v; vl.addEventListener('input', function () { modal.v = +vl.value || 0; });
      ['Website', 'WhatsApp', 'Referral', 'Walk-in', 'Instagram'].forEach(function (s) { var o = E('option', '', s); o.selected = s === modal.src; sr.appendChild(o); }); sr.addEventListener('change', function () { modal.src = sr.value; });
      [P.team.sales[0], P.team.s2].forEach(function (s) { var o = E('option', '', s); o.selected = s === modal.own; ow.appendChild(o); }); ow.addEventListener('change', function () { modal.own = ow.value; }); ow.disabled = !own;
      f.setAttribute('aria-label', 'New ' + what); f.noValidate = true;
      A(f, A(E('header'), A(E('i'), ic('users')), A(E('div'), E('h5', '', 'New ' + what), E('p', '', 'Filed in “' + P.st[0] + '” and given to its owner.')), A(B('', 'c-x', close), ic('x'))),
        A(E('div', 'c-fs'), fld('Name', nm, 1), fld('Interested in', it), fld('Value (₹)', vl), fld('Source', sr), fld('Owner', ow), err),
        A(E('footer'), btn('Cancel', '', close), A(E('button', 'c-btn c-pri'), E('span', '', 'Create ' + what))));
      f.querySelector('.c-x').setAttribute('aria-label', 'Close');
      f.addEventListener('submit', function (ev) {
        ev.preventDefault(); var n = nm.value.trim(), l; if (!n) { err.textContent = 'Give the ' + what + ' a name.'; nm.focus(); return; }
        l = M.add(n, K[modal.i][0], modal.v, K[modal.i][1], modal.src, modal.own); modal = null; if (M.mine(l)) jump(['lead', l.id]); else paint();
      });
      w.addEventListener('pointerdown', function (ev) { if (ev.target === w) close(); });
      return A(w, f);
    }
    function skel() { var w = E('div', 'c-skel'), i; w.appendChild(E('i', 'c-s1')); for (i = 0; i < 6; i++) w.appendChild(E('i')); return w; }

    /* ---- the shell: sidebar, top bar, page header, tabs, body ---- */
    function paint() {
      D = M.D; P = M.P; AU = Z.autos(C.trade); fit();
      var list = screens(), arch = C.view === 'arch', view = arch ? 'arch' : list.some(function (s) { return s[0] === scr; }) ? scr : (scr = list[0][0]);
      var tbs = arch ? [] : tabsOf(view), tb = !tbs.length ? '' : tbs.some(function (t) { return t[0] === tab[view]; }) ? tab[view] : (tab[view] = tbs[0][0]);
      var rec = !arch && open ? find(open) : null, name = arch ? 'System map' : list.filter(function (s) { return s[0] === view; })[0][1];
      if (!rec) open = null;
      var k = view + '/' + tb + '/' + (rec ? rec.id : ''), old = app.querySelector('.c-main'), y = old && k === key ? old.scrollTop : 0, GROUPS = NAV[C.trade], grp = arch ? '' : (GROUPS.filter(function (g) { return g[1].indexOf(view) >= 0; })[0] || [''])[0];
      var side = E('aside', 'c-side'), nav = E('nav', 'c-nav'), top = E('header', 'c-top'), main = E('div', 'c-main'), pt = E('div', 'c-pt'), ph = { acts: E('div', 'c-acts'), hint: '' }, body = E('div', 'c-body'), crumb = E('p', 'c-crumb'), sw = E('div', 'c-search'), si = E('input'), res = E('div', 'c-pop c-res'), bell, st, ts, ham, many = list.length > 5, shown = 0, extra = [], mb, sheet, sbtn, sx;
      if (k !== key) main.dataset.fresh = 1;
      /* sidebar */
      nav.setAttribute('aria-label', 'Screens');
      A(side, A(E('div', 'c-brand'), E('i', 'c-logo', (C.name || 'Y').charAt(0).toUpperCase()), A(E('span'), E('b', '', C.name || 'Your business'), E('small', '', P.n + ' workspace'))));
      side.appendChild(A(B('', 'c-jump', function () { var x = app.querySelector('.c-search input'); if (x) x.focus(); }), ic('search'), E('span', '', 'Search'), E('kbd', '', '/')));
      GROUPS.forEach(function (g) {
        var items = g[1].map(function (k) { return list.filter(function (s) { return s[0] === k; })[0]; }).filter(Boolean), el; if (!items.length) return;
        el = E('div', 'c-ng'); if (g[0]) { el.appendChild(A(B('', 'c-ngl', function () { shut[g[0]] = !shut[g[0]]; paint(); }), E('span', '', g[0]), ic('chevd'))); el.firstChild.setAttribute('aria-expanded', !shut[g[0]]); }
        if (shut[g[0]] && !phone() && !items.some(function (s) { return s[0] === view; })) { nav.appendChild(el); return; }
        items.forEach(function (s) { var n = count(s[0]), b = B('', '', function () { go(s[0]); }); A(b, ic(s[0] === 'home' && C.role === 'acct' ? 'receipt' : s[0] === 'home' && C.role === 'field' ? 'pin' : NICON[s[0]]), E('span', '', s[1])); if (n) b.appendChild(E('i', 'c-cnt', n)); if (s[0] === view) b.setAttribute('aria-current', 'page'); b.title = s[1]; b.dataset.s = s[0]; if (many && shown >= 4) { b.dataset.x = 1; extra.push(s); } shown++; el.appendChild(b); });
        if (many && !el.querySelector('button:not(.c-ngl):not([data-x])')) el.dataset.x = 1;
        nav.appendChild(el);
      });
      if (many) {
        mb = B('', '', function () { pop = pop === 'more' ? '' : 'more'; paint(); }); A(mb, ic('grid'), E('span', '', 'More')); st = extra.reduce(function (t, s) { return t + count(s[0]); }, 0); if (st) mb.appendChild(E('i', 'c-cnt', st));
        if (extra.some(function (s) { return s[0] === view; })) mb.setAttribute('aria-current', 'page'); mb.setAttribute('aria-expanded', pop === 'more'); mb.dataset.more = 1; nav.appendChild(A(E('div', 'c-ng c-mg'), mb));
        if (pop === 'more') { sheet = E('div', 'c-more'); sheet.appendChild(A(E('header'), av(me()), A(E('span'), E('b', '', me()), E('small', '', P.team[C.role][1] + ' · ' + (C.name || 'Your business')))));
          extra.forEach(function (s) { var n = count(s[0]), b = B('', '', function () { go(s[0]); }); A(b, ic(NICON[s[0]]), E('span', '', s[1]), n ? E('i', 'c-cnt', n) : null, ic('chevr')); if (s[0] === view) b.setAttribute('aria-current', 'page'); sheet.appendChild(b); }); }
      }
      A(side, nav, A(E('div', 'c-acct'), av(me()), A(E('span'), E('b', '', me()), E('small', '', P.team[C.role][1]))), sheet);
      /* top bar */
      ham = B('', 'c-ham', function () { rail = !rail; fit(); }); ham.appendChild(ic('menu')); ham.setAttribute('aria-label', 'Collapse the sidebar');
      var tl = tb && tbs.length > 1 ? tbs.filter(function (t) { return t[0] === tb; })[0][1] : '', sub = tl && tl !== name;
      A(crumb, grp && grp !== name ? E('span', '', grp) : null, rec ? B(name, '', function () { open = null; paint(); }) : E(sub ? 'span' : 'b', '', name), rec ? E('b', '', open.t === 'inv' ? rec.id : rec.n) : sub ? E('b', '', tl) : null);
      si.type = 'search'; si.placeholder = 'Search'; si.autocomplete = 'off'; si.value = gq; si.setAttribute('aria-label', 'Search ' + (C.name || 'the workspace'));
      function fill() {
        var q = si.value.trim(), out = q ? results(q) : []; gq = si.value; res.textContent = ''; res.hidden = !q;
        if (q && !out.length) res.appendChild(E('p', '', 'Nothing matches “' + q + '”.'));
        out.forEach(function (x) { res.appendChild(A(B('', '', function () { gq = ''; jump(x[4]); }), ic(x[0]), A(E('span'), E('b', '', x[1]), E('small', '', x[2])), E('em', '', x[3]))); });
      }
      si.addEventListener('input', fill); si.addEventListener('keydown', function (e) { if (e.key === 'Enter' && res.firstChild && res.firstChild.click) res.firstChild.click(); if (e.key === 'Escape') { si.value = ''; fill(); si.blur(); } });
      sx = B('', 'c-sx', function () { pop = ''; gq = ''; paint(); }); sx.appendChild(ic('x')); sx.setAttribute('aria-label', 'Close search');
      sbtn = B('', 'c-bell c-sbtn', function () { pop = pop === 'find' ? '' : 'find'; gq = ''; paint(); }); sbtn.appendChild(ic('search')); sbtn.setAttribute('aria-label', 'Search'); if (pop === 'find') top.dataset.find = 1;
      A(sw, ic('search'), si, E('kbd', '', '/'), sx, res); fill();
      bell = B('', 'c-bell', function () { pop = pop === 'bell' ? '' : 'bell'; unseen = 0; paint(); }); bell.appendChild(ic('bell')); bell.setAttribute('aria-label', 'Notifications'); if (unseen > 0) bell.appendChild(E('i', 'c-cnt', unseen > 9 ? '9+' : unseen));
      A(top, A(E('div', 'c-wm'), E('i', 'c-logo', (C.name || 'Y').charAt(0).toUpperCase()), E('b', '', C.name || 'Your business')), ham, E('b', 'c-tt', rec ? (open.t === 'inv' ? rec.id : rec.n) : name), crumb, sw, bell, sbtn, A(E('span', 'c-me'), av(me())), pop === 'bell' ? notes() : null);
      /* page header */
      pt.appendChild(A(E('p', 'c-bc'), E('span', '', name), ic('chevr'), E('b', '', rec ? (open.t === 'inv' ? rec.id : rec.n) : sub ? tl : tl ? 'All' : 'Overview')));
      if (rec) { st = open.t === 'lead' ? lst(rec) : open.t === 'ev' ? est(rec) : ist(rec); A(pt, A(B('', 'c-back', function () { open = null; paint(); }), ic('chevl'), T(name)), A(E('h4'), T(open.t === 'inv' ? rec.id : rec.n), chip(st[0], st[1])), E('p', '', open.t === 'lead' ? rec.d : open.t === 'ev' ? rec.w : rec.n)); }
      else A(pt, E('h4', '', name), E('p', '', arch ? P.n + ' · who and what is in the system, and every chain of work between them' : P.n + ' · ' + LONG[D.day % 7] + ', ' + dstr(D.day)));
      main.appendChild(A(E('div', 'c-ph'), pt, ph.acts));
      if (tbs.length > 1 && !rec) { ts = E('div', 'c-tabs'); tbs.forEach(function (t) { var b = B(t[1], '', function () { tab[view] = t[0]; paint(); }); b.setAttribute('aria-pressed', t[0] === tb); ts.appendChild(b); }); main.appendChild(ts); }
      main.appendChild(body);
      if (loading) body.appendChild(skel()); else if (rec) { body.classList.add('c-rec'); body.dataset.k = open.t; DET[open.t](body, rec, ph); } else { body.dataset.v = view + (tb ? '-' + tb : ''); S[view](body, tb, ph); }
      app.dataset.role = C.role; app.textContent = ''; A(app, side, top, main, toasts, modal ? form() : null); main.scrollTop = y; key = k; hint = ph.hint;
      if (pop === 'find' && phone()) si.focus({ preventScroll: true });
      if (modal) { var f1 = app.querySelector('.c-modal input'); if (f1 && d.activeElement !== f1 && !f1.value) f1.focus({ preventScroll: true }); }
      hook.url((slug(C.name).replace(/-/g, '') || 'yourbusiness') + '.app/' + (arch ? 'system-map' : slug(name) + (rec ? '/' + rec.id.toLowerCase() : tb && tb !== tbs[0][0] ? '/' + tb : '')));
      hook.after(hint);
    }
    /* desktop: the app is drawn at its working size (C.work, 1200 unless told otherwise) and scaled to the frame, never below C.zmin,
       so it keeps a real app's proportions. phone: drawn at the frame's own size; in a box (C.box) at C.pw wide and scaled to the box */
    function fit() {
      var w = box.clientWidth, ph = phone(), W = ph ? (C.box ? C.pw || 390 : 0) : C.work || 1200, z = W ? Math.max(C.zmin || (ph ? .2 : .78), Math.min(1, w / W)) : 1, h;
      app.dataset.dev = ph ? 'phone' : 'desk'; app.dataset.th = C.theme; if (C.box) app.dataset.box = 1;
      if (!W || !w) { app.style.width = app.style.height = app.style.transform = ''; delete app.dataset.nav; return; }
      h = box.clientHeight; app.style.width = (w / z).toFixed(1) + 'px'; app.style.height = (h / z).toFixed(1) + 'px'; app.style.transform = z === 1 ? '' : 'scale(' + z.toFixed(4) + ')';
      if (!ph && SIDE[C.theme] && (rail || w / z < 1000)) app.dataset.nav = 'rail'; else delete app.dataset.nav;
    }
    app.addEventListener('click', function (e) { if (pop && !e.target.closest('.c-notes,.c-bell,.c-search,.c-more,[data-more]')) { pop = ''; paint(); } });
    app.addEventListener('keydown', function (e) {
      var typing = /INPUT|SELECT|TEXTAREA/.test(e.target.tagName), x;
      if (e.key === 'Escape' && modal) { modal = null; paint(); } else if (e.key === 'Escape' && pop) { pop = ''; paint(); }
      else if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key === 'k')) { x = app.querySelector('.c-search input'); if (x) { e.preventDefault(); x.focus(); } }
    });
    if ('ResizeObserver' in window) new ResizeObserver(function () { fit(); }).observe(box); else addEventListener('resize', fit);
    function fresh(quiet) {
      scr = 'home'; open = null; thr = ''; cust = ''; filt = 'all'; lf = 'all'; tab = {}; sorts = {}; modal = null; pop = ''; gq = ''; unseen = 0; toasts.textContent = ''; tAt = 0;
      if (quiet || fast) return; loading = true; setTimeout(function () { loading = false; paint(); }, 420);
    }
    M.emit = emit;
    return { paint: paint, go: go, jump: jump, fresh: fresh, note: note, sees: sees, fit: fit, see: SEE, fast: function (v) { fast = v; }, tick: function () { M.tick(); ticked = Date.now(); paint(); }, day: function () { return LONG[M.D.day % 7] + ', ' + dstr(M.D.day) + (M.D.day > 6 ? ' · week ' + (Math.floor(M.D.day / 7) + 1) : ''); }, open: function (s) { scr = s; open = null; }, at: function () { return { scr: scr, tab: tab, open: open }; } };
  };
})();
