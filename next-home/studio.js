/* The product configurator. Four steps on the left (business, modules, theme, team and automations) drive a working app on the right.
   The business itself, its data and its flows, lives in biz.js. This file draws it: a home screen for every trade, tabs inside every
   module, records you can open, role views that show only what that person would see, a clock that moves the week on, five themes,
   a phone view, an architecture view with the flows drawn out, and a spec you can share or send. Plain DOM, styles through CSSOM only. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, W = window.WORK, Z = window.Biz, $ = function (s) { return d.querySelector(s); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, small = matchMedia('(max-width: 640px)');
  function E(tag, cls, txt) { var e = d.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; }
  function B(txt, cls, fn) { var b = E('button', cls, txt); b.type = 'button'; b.addEventListener('click', fn); return b; }
  function A(p) { for (var i = 1; i < arguments.length; i++) if (arguments[i]) p.appendChild(arguments[i]); return p; }
  var inr = Z.inr, short = Z.short, dn = Z.dn, LONG = Z.LONG, MODS = Z.MODS, PACK = Z.PACK;
  var THEMES = [['clean', 'Clean SaaS'], ['midnight', 'Midnight Pro'], ['boutique', 'Boutique'], ['bold', 'Bold'], ['soft', 'Soft']];
  var COLS = ['#6a3df0', '#2563eb', '#0d9f6e', '#e5482d', '#c98a00', '#d6249f'], ROLES = ['owner', 'sales', 'field', 'acct'];
  /* which modules each role can open at all; what they see inside is decided screen by screen */
  var SEE = { owner: 'pipe cal stock inv chat field rep portal', sales: 'pipe cal stock inv chat', field: 'cal', acct: 'stock inv rep' };
  var DEEP = { pipe: 4, cal: 3, stock: 3, inv: 3, chat: 2, field: 3, rep: 4, portal: 2 };
  var C = { name: '', trade: 'property', mods: {}, theme: 'clean', color: COLS[0], role: 'owner', autos: { a1: 1, a2: 1, a3: 1, a4: 1, a5: 1, a6: 0 }, dev: 'desk', view: 'app' };
  var M, D, P, AU, scr = 'home', tab = {}, open = null, touched = false, keep = '', key = '', filt = 'all', thr = '', cust = '', tAt = 0;
  var fr = $('#fr'), app = $('#app2'), toasts = $('#pvT'), cfg = $('#cfg');

  function defaults() { C.mods = {}; PACK[C.trade].def.split(' ').forEach(function (m) { C.mods[m] = 1; }); }
  function fresh() { M.reset(); D = M.D; P = M.P; AU = Z.autos(C.trade); open = null; thr = ''; cust = ''; filt = 'all'; tab = {}; toasts.textContent = ''; tAt = 0; }
  function me() { return P.team[C.role][0]; }
  function when(day) { var x = day - D.day; return x === 0 ? 'Today' : x === 1 ? 'Tomorrow' : x === -1 ? 'Yesterday' : x < -6 ? 'Last week' : x < 0 ? -x + ' days ago' : LONG[day % 7]; }
  function wl(day) { var x = day - D.day; return x >= -6 && x <= 1 ? when(day).toLowerCase() : when(day); }
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function modName(m) { return MODS.filter(function (x) { return x[0] === m; })[0][1]; }
  function add(m) { C.mods[m] = 1; touched = true; sync(); paint(); save(); }

  /* ---- what each flow did, shown as it happens ---- */
  function show(e) {
    var t = E('div', 'at' + (e.a ? '' : ' n') + (e.dayc ? ' dy' : ''));
    t.appendChild(E('b', '', e.t));
    e.s.forEach(function (x, i) { var s = E('span', x[1] ? '' : 'no', (e.dayc ? '' : x[1] ? '→ ' : '· ') + x[0]); s.style.animationDelay = (.4 + i * .45) + 's'; t.appendChild(s); });
    toasts.appendChild(t); while (toasts.children.length > 3) toasts.firstChild.remove();
    setTimeout(function () { t.remove(); }, 3400 + e.s.length * 900);
  }
  function emit(e) { var now = Date.now(), at = Math.max(now, tAt); tAt = at + 750; if (at === now) show(e); else setTimeout(show, at - now, e); }
  function note(txt) { emit({ a: '', t: txt, s: [] }); }
  function confetti() {
    if (reduce) return; var r = fr.getBoundingClientRect(), i, c, a, q;
    for (i = 0; i < 22; i++) { c = E('i', 'cf'); a = Math.random() * 6.283; q = 60 + Math.random() * 150; c.style.left = r.left + r.width * .7 + 'px'; c.style.top = r.top + r.height * .45 + 'px'; c.style.background = [C.color, '#0e0c12', '#f4b556'][i % 3]; c.style.setProperty('--x', Math.cos(a) * q + 'px'); c.style.setProperty('--y', Math.sin(a) * q - 60 + 'px'); c.style.setProperty('--r', Math.random() * 720 - 360 + 'deg'); d.body.appendChild(c); setTimeout(function (n) { n.remove(); }, 1000, c); }
  }

  /* ---- who sees what ---- */
  function label(m) { return P.w[m] || { inv: 'Invoices', chat: 'WhatsApp', field: 'Field app', rep: 'Reports', portal: 'Customer portal' }[m]; }
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
      field: [['today', 'Jobs'], ['route', 'Route']],
      rep: r === 'acct' ? [['money', 'Money'], ['act', 'Activity']] : [['over', 'Overview'], ['money', 'Money'], ['team', 'Team'], ['act', 'Activity']],
      portal: [['status', 'Status'], ['bills', 'Bills']]
    })[s] || [];
  }
  function lens() {
    var n = me();
    return C.role === 'sales' ? n + ' sees ' + leads().length + ' of ' + D.leads.length + ' ' + P.w.pipe.toLowerCase() + '; the rest belong to ' + P.team.s2 + '. No approvals, no company totals.'
      : C.role === 'field' ? n + ' sees the day’s jobs and the checklist for each. No prices, no pipeline.'
        : n + ' sees invoices, payments and orders to suppliers. No leads, no chats.';
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
  function badge(s) {
    var r = C.role;
    return s === 'inv' ? invs().filter(function (v) { return v.over; }).length
      : s === 'stock' ? (r === 'sales' ? 0 : D.pos.filter(function (p) { return p.st === 'draft'; }).length)
        : s === 'chat' ? D.chats.reduce(function (t, c) { return t + c.un; }, 0)
          : s === 'pipe' ? D.tasks.filter(function (k) { return !k.done && k.who === me() && k.due <= D.day; }).length
            : s === 'home' && r === 'field' ? jobs(D.day).filter(function (e) { return !e.done; }).length : 0;
  }

  /* ---- getting around ---- */
  function go(s, t, o) { scr = s; if (t) tab[s] = t; open = o || null; C.view = 'app'; sync(); paint(); }
  function where(r) {
    var x;
    if (r[0] === 'lead') { x = M.by(D.leads, r[1]); return x && M.mine(x) && sees('pipe') ? 'pipe' : ''; }
    if (r[0] === 'inv') { x = M.by(D.invs, r[1]); return x && mineN(x.n) && sees('inv') ? 'inv' : ''; }
    if (r[0] === 'ev') return M.by(D.ev, r[1]) ? (C.role === 'field' ? 'home' : sees('cal') ? 'cal' : sees('field') ? 'field' : 'home') : '';
    return sees('stock') ? 'stock' : '';
  }
  function jump(r) { var m = where(r); if (!m) return; if (r[0] === 'po' || r[0] === 'stock') go('stock', r[0] === 'po' && C.role !== 'sales' ? 'pos' : 'items'); else go(m, null, { t: r[0], id: r[1] }); }
  function link(txt, r) { return r && where(r) ? B(txt, 'lk', function () { jump(r); }) : E('b', '', txt); }
  function find(o) { return M.by(o.t === 'lead' ? D.leads : o.t === 'ev' ? D.ev : D.invs, o.id); }

  /* ---- small parts ---- */
  function panel(t, sub) { var p = E('div', 'pn'); if (t) p.appendChild(E('h5', '', t)); if (sub) p.appendChild(E('p', 'mu', sub)); return p; }
  function pill(t, k) { return E('span', 'pl' + (k ? ' ' + k : ''), t); }
  function list(arr, fn, empty) { var w = E('div', 'tb'); if (!arr.length) { if (empty) w.appendChild(E('p', 'mu', empty)); return w; } arr.forEach(function (x, i) { var r = fn(x, i); if (r) w.appendChild(r); }); return w; }
  function tr(title, sub, mid, end, fn) { var r = fn ? B('', 'tr', fn) : E('div', 'tr'); A(r, A(E('span', 't1'), typeof title === 'string' ? E('b', '', title) : title, sub ? E('small', '', sub) : null), mid, end ? (typeof end === 'string' ? E('span', 't3', end) : end) : null); return r; }
  function kv(l) { var g = E('div', 'kv'); l.forEach(function (x) { if (x) g.appendChild(A(E('p'), E('small', '', x[0]), E('b', '', x[1]))); }); return g; }
  function tl(log) { var ol = E('ol', 'tl'); log.slice(0, 8).forEach(function (x) { ol.appendChild(A(E('li'), E('span', '', when(x[0])), E('b', '', x[1]))); }); return ol; }
  function steps(l) { var ol = E('ol', 'stp2'); l.forEach(function (x) { ol.appendChild(E('li', x[1] ? 'on' : '', x[0])); }); return ol; }
  function kpis(l, cls) { var k = E('div', 'kpi' + (cls || '')); l.forEach(function (x) { k.appendChild(A(E('p'), E('b', '', x[1]), E('span', '', x[0]))); }); return k; }
  function sum(l) { return l.reduce(function (s, v) { return s + v.v; }, 0); }
  function ist(v) { return v.st === 'paid' ? ['Paid', 'ok'] : v.over ? ['Overdue' + (v.rem ? ' · reminded' + (v.rem > 1 ? ' ×' + v.rem : '') : ''), 'bad'] : ['Sent · due ' + wl(v.due), '']; }
  function est(e) { return e.done ? ['Done', 'ok'] : e.on ? ['On site', 'b'] : e.st === 'confirmed' ? ['Confirmed', 'b'] : ['Not confirmed', 'warn']; }
  function evRow(e) { var s = est(e); return tr(e.n, e.w + ' · ' + when(e.day) + ', ' + e.tm, pill(s[0], s[1]), C.role === 'owner' ? e.who : '', function () { jump(['ev', e.id]); }); }
  function jobRow(e) { var s = est(e); return tr(e.n, e.tm + ' · ' + e.w, pill(s[0], s[1]), null, function () { jump(['ev', e.id]); }); }
  function bookNext(day, tm, what) { var n = M.who(), l = D.leads.filter(function (x) { return x.n === n; })[0]; M.book(n, P.w.book + ' · ' + (what || (l ? l.d : 'new walk-in')), day, tm); paint(); }
  function won(l) { M.win(l); confetti(); paint(); }
  function missing(c, m, txt) { var p = panel('Not in this setup yet', txt); p.appendChild(B('Add ' + modName(m), 'pb', function () { add(m); })); c.appendChild(p); }
  function strip(c) {
    var own = C.role === 'owner', l = own ? needs() : myday(), s = E('div', 'need');
    s.appendChild(E('b', '', own ? (l.length ? 'Needs you' : 'Nothing needs you right now') : (l.length ? 'Your day' : 'Nothing due today')));
    l.slice(0, 3).forEach(function (x) { s.appendChild(B(x[0], 'nb', x[1])); }); if (l.length > 3) s.appendChild(E('span', 'mu', '+' + (l.length - 3) + ' more'));
    c.appendChild(s);
  }
  function feed(l) {
    if (!l.length) return E('p', 'mu', 'Nothing yet. Book something, win a deal or move the day on.');
    var ul = E('ul', 'lg'); l.forEach(function (e) { ul.appendChild(A(E('li', e.a ? 'au' : ''), E('span', '', when(e.day)), A(E('div'), link(e.t, e.ref), e.s.length ? E('small', '', e.s.map(function (x) { return x[0]; }).join(' → ')) : null))); }); return ul;
  }

  /* ---- the home screen: a different product for every trade ---- */
  var HOME = {
    property: function (c) {
      var m = E('div', 'mapx'), s = P.pins[D.sel], k = D.stock[D.sel], info = panel(s[0], s[1] + (C.mods.stock ? ' · ' + (k.q - k.res) + ' ' + P.w.free : '') + ' · tap a pin to switch');
      P.pins.forEach(function (p, i) { var b = B('', 'pin' + (i === D.sel ? ' on' : ''), function () { D.sel = i; paint(); }); b.style.left = p[2] + '%'; b.style.top = p[3] + '%'; b.setAttribute('aria-label', p[0]); m.appendChild(b); });
      if (M.can('sell')) info.appendChild(B('Book a site visit for ' + M.peek(), 'pb', function () { bookNext(D.day + 1, '11:00 am', s[0]); })); A(c, m, info);
    },
    build: function (c) {
      var g = panel('Programme', 'Eight weeks · the line is today'), ph = panel('Site photo log'), tl2 = E('div', 'tiles');
      P.proj.forEach(function (p) { var r = E('div', 'gn'), t = E('i'), b = E('b'); b.style.left = p[1] * 12.5 + '%'; b.style.width = p[2] * 12.5 + '%'; t.style.setProperty('--now', Math.min(100, 37.5 + D.day * 1.8) + '%'); t.appendChild(b); A(r, E('span', '', p[0]), t); g.appendChild(r); });
      D.photos.slice(0, 4).forEach(function (p, i) { tl2.appendChild(E('span', 'tile t' + i % 3, p)); });
      A(ph, tl2, M.can('site') ? B('Log a site photo', 'pb', function () { D.photos.unshift('Week 3 · ' + P.proj[D.photos.length % 4][0]); if (C.mods.portal) note('The client portal shows the new photo'); paint(); }) : null); A(c, g, ph);
    },
    retail: function (c) {
      var g = E('div', 'pos'), tot = D.bill.reduce(function (s, i) { return s + P.price[i]; }, 0), bill = panel('Bill', D.bill.length ? D.bill.map(function (i) { return D.stock[i].n; }).join(', ') : 'Tap items to add them');
      D.stock.forEach(function (s, i) { var left = s.q - s.res - D.bill.filter(function (x) { return x === i; }).length, b = B('', 'posb', function () { D.bill.push(i); paint(); }); b.disabled = left <= 0 || !M.can('sell'); A(b, E('b', '', s.n), E('span', '', inr(P.price[i]) + ' · ' + left + ' left')); g.appendChild(b); });
      if (M.can('sell')) bill.appendChild(A(E('div', 'rw wrap'), B(tot ? 'Charge ' + inr(tot) + ' · test mode' : 'Nothing to charge yet', 'pb', function () { if (!tot) return; M.sale(D.bill.slice(), tot); D.bill = []; paint(); }), D.bill.length ? B('Clear', 'pb g', function () { D.bill = []; paint(); }) : null));
      A(c, g, bill);
    },
    stay: function (c) {
      var t = E('div', 'tp'), ws = Math.floor(D.day / 7) * 7, i; t.appendChild(E('span'));
      for (i = 0; i < 7; i++) t.appendChild(E('span', 'th' + (ws + i === D.day ? ' tdy' : ''), dn(i)));
      P.rooms.forEach(function (r, ri) {
        t.appendChild(E('span', 'rm', r));
        for (var x = ws; x < ws + 7; x++) (function (dd) {
          var h = D.held.filter(function (b) { return b[0] === ri && dd >= b[1] && dd < b[1] + b[2]; })[0], cell;
          if (h) cell = E('span', 'bk' + (dd === h[1] || dd === ws ? ' s' : ''), dd === h[1] || dd === ws ? h[3] : '');
          else if (dd < D.day || !M.can('sell')) cell = E('span', 'fc x');
          else { cell = B('', 'fc', function () { M.book(M.who(), '', dd, '2:00 pm', ri); paint(); }); cell.setAttribute('aria-label', 'Free: ' + r + ', ' + LONG[dd % 7]); }
          t.appendChild(cell);
        })(x);
      });
      c.appendChild(A(panel('This week', M.can('sell') ? 'Tap a free night to hold it for ' + M.peek() : 'Rooms held this week'), t));
    },
    service: function (c) {
      var p = panel('Today', M.can('sell') ? 'Tap a free slot to book ' + M.peek() + ' in' : LONG[D.day % 7]);
      p.appendChild(list(['6:00 am', '7:00 am', '8:00 am', '5:00 pm', '6:00 pm', '7:00 pm'], function (t) {
        var e = D.ev.filter(function (x) { return x.day === D.day && x.tm === t; })[0];
        return e ? tr(t, e.n + ' · ' + e.w.split(' · ')[0], pill(est(e)[0], est(e)[1]), null, function () { jump(['ev', e.id]); }) : tr(t, 'Free', null, M.can('sell') ? B('Book ' + M.peek(), 'pb s', function () { bookNext(D.day, t); }) : null);
      })); c.appendChild(p);
    }
  };

  /* ---- the modules, tab by tab ---- */
  var S = {
    home: function (c, tb) {
      if (C.role === 'field') { if (!C.mods.field) return missing(c, 'field', P.team.field[0] + ' has no phone view until the Field app is part of the system.'); return tb === 'route' ? S.route(c) : S.jobs(c); }
      if (C.role === 'acct') return C.mods.inv ? S.desk(c) : missing(c, 'inv', P.team.acct[0] + ' has nothing to work on until Invoices & payments is part of the system.');
      strip(c); HOME[C.trade](c);
      var L = leads(), due = invs().filter(function (v) { return v.st !== 'paid'; });
      c.appendChild(kpis([['New ' + P.w.pipe.toLowerCase(), L.filter(function (l) { return l.s === 0; }).length], [P.w.cal + ' today', jobs(D.day).length], C.role === 'owner' ? ['To collect', short(sum(due))] : ['Won by ' + me(), L.filter(function (l) { return l.s === 2; }).length]], ' k3'));
    },
    desk: function (c) {
      var due = D.invs.filter(function (v) { return v.st !== 'paid'; }), over = due.filter(function (v) { return v.over; }), po = D.pos.filter(function (p) { return p.st !== 'received'; });
      A(c, kpis([['Received', short(D.paid)], ['To collect', short(sum(due))], ['Overdue', short(sum(over))]], ' k3'),
        A(panel('To chase', over.length ? '' : 'Nothing is overdue.'), list(over, function (v) { return tr(link(v.id + ' · ' + v.n, ['inv', v.id]), 'Due ' + wl(v.due) + (v.rem ? ' · reminded ' + v.rem + (v.rem > 1 ? ' times' : ' time') : ''), null, B('Remind · ' + short(v.v), 'pb s', function () { M.remind(v); paint(); })); })),
        C.mods.stock ? A(panel('Orders to suppliers'), list(po, function (p) { return tr(p.id + ' · ' + p.n, p.q + ' ' + D.stock[p.i].u + ' from ' + p.sup, pill(p.st === 'draft' ? 'Waiting for ' + P.team.owner[0] : 'Due ' + wl(p.eta), p.st === 'draft' ? 'warn' : 'b'), null, function () { go('stock', 'pos'); }); }, 'None open.')) : null);
    },
    pipe: function (c, tb) {
      var L = leads(), own = C.role === 'owner';
      if (tb === 'list') return c.appendChild(A(panel(), list(L, function (l) { return tr(l.n, l.d + ' · ' + l.src + ' · ' + wl(l.last), pill(P.st[l.s], l.s === 2 ? 'ok' : l.s ? 'b' : ''), short(l.v) + (own ? ' · ' + l.own : ''), function () { jump(['lead', l.id]); }); }, 'Nothing here yet.')));
      if (tb === 'tasks') return c.appendChild(A(panel(), list(tasks().slice().sort(function (a, b) { return a.done - b.done || a.due - b.due; }).slice(0, 12), function (k) {
        var r = E('div', 'tr' + (k.done ? ' dn' : '')), ck = B(k.done ? '✓' : '', 'ck', function () { M.done(k); paint(); }); ck.setAttribute('aria-pressed', !!k.done); ck.setAttribute('aria-label', 'Done: ' + k.t);
        return A(r, ck, A(E('span', 't1'), link(k.t, k.ref), E('small', '', (own ? k.who + ' · ' : '') + 'due ' + wl(k.due))), !k.done && k.due < D.day ? pill('Late', 'bad') : null);
      }, 'No tasks. Bookings and quiet leads create them.')));
      var k = E('div', 'kb');
      P.st.forEach(function (s, i) {
        var col = E('div', 'kcol'), l = L.filter(function (x) { return x.s === i; }); col.dataset.s = i; col.appendChild(E('h6', '', s + ' · ' + l.length));
        l.slice(0, 5).forEach(function (x) { var e = E('div', 'kcard'); e.tabIndex = 0; e.setAttribute('role', 'button'); A(e, E('b', '', x.n), E('span', '', x.d), A(E('i', '', short(x.v)), own ? E('em', '', x.own) : null)); drag(e, x); col.appendChild(e); });
        if (l.length > 5) col.appendChild(B('+' + (l.length - 5) + ' more', 'lk', function () { tab.pipe = 'list'; paint(); }));
        k.appendChild(col);
      });
      A(c, k, E('p', 'mu', M.can('sell') ? 'Drag a card to the next stage, or click it to open the record.' : 'Click a card to open the record.'));
    },
    cal: function (c, tb) {
      var L = evs(), ws = Math.floor(D.day / 7) * 7, g = E('div', 'wk'), i;
      if (tb === 'agenda') return A(c, A(panel('Coming up'), list(L.filter(function (e) { return !e.done; }).slice(0, 8), evRow, 'Nothing booked. Book from “' + P.home + '”.')), A(panel('Done'), list(L.filter(function (e) { return e.done; }).reverse().slice(0, 5), evRow, 'Nothing finished yet.')));
      for (i = ws; i < ws + 7; i++) (function (day) {
        var col = E('div', day === D.day ? 'tdy' : day < D.day ? 'past' : ''), l = L.filter(function (e) { return e.day === day; }), a;
        col.appendChild(E('h6', '', dn(day) + (day === D.day ? ' · today' : '')));
        l.forEach(function (e) { var b = B('', 'evc' + (e.done ? ' dn' : '') + (e.job ? ' jb' : ''), function () { jump(['ev', e.id]); }); A(b, E('b', '', e.tm.replace(':00', '')), E('span', '', e.n)); col.appendChild(b); });
        if (day >= D.day && M.can('sell')) { a = B('+', 'ad', function () { if (P.rooms) { M.book(M.who(), '', day); paint(); } else bookNext(day, l.length ? '3:00 pm' : '11:00 am'); }); a.setAttribute('aria-label', 'Book ' + M.peek() + ' in on ' + LONG[day % 7]); col.appendChild(a); }
        g.appendChild(col);
      })(i);
      A(c, g, E('p', 'mu', M.can('sell') ? 'Plus books ' + M.peek() + ' in on that day. Click a booking to open it.' : 'Click a booking to open it.'));
    },
    stock: function (c, tb) {
      var edit = C.role !== 'sales', p;
      if (tb === 'moves') return c.appendChild(A(panel('', 'Every unit in, out or reserved, with the reason.'), list(D.moves.slice(0, 12), function (m) { return tr(m.n, when(m.day) + ' · ' + m.why, null, E('span', 't3 k' + m.k, m.k === 'res' ? m.q + ' held' : (m.q > 0 ? '+' : '−') + Math.abs(m.q))); }, 'Nothing has moved yet. Win a deal or approve an order.')));
      if (tb === 'pos') return c.appendChild(A(panel('', M.can('approve') ? 'Drafted when stock runs low. Nothing is sent until you approve it.' : 'Only ' + P.team.owner[0] + ' can approve these.'), list(D.pos, function (o) {
        var s = o.st === 'draft' ? ['Draft', 'warn'] : o.st === 'ordered' ? ['Due ' + wl(o.eta), 'b'] : ['Received', 'ok'];
        return tr(o.id + ' · ' + o.q + ' ' + D.stock[o.i].u + ' · ' + o.n, 'From ' + o.sup + ' · ' + o.why.toLowerCase(), pill(s[0], s[1]), o.st === 'draft' ? (M.can('approve') ? B('Approve and send', 'pb s', function () { M.approve(o); paint(); }) : null) : o.st === 'ordered' ? B('Mark received', 'pb s g', function () { M.receive(o); paint(); }) : null);
      }, 'None yet. They are drafted when stock falls to its reorder level.')));
      p = panel('', edit ? 'Solid is free to promise. Striped is reserved for won deals.' : 'What you can promise a customer today.');
      D.stock.forEach(function (s, i) {
        var free = s.q - s.res, lo = free <= s.min, po = M.openPO(i), r = E('div', 'sk' + (lo ? ' lo' : '')), bar = E('i');
        bar.style.setProperty('--w', Math.min(100, s.q / s.of * 100) + '%'); bar.style.setProperty('--f', Math.min(100, Math.max(0, free) / s.of * 100) + '%');
        A(r, E('span', '', s.n), E('b', '', edit ? free + ' free' + (s.res ? ' · ' + s.res + ' reserved' : '') + ' · ' + s.q + ' of ' + s.of : free + ' ' + P.w.free), bar);
        if (lo || po) r.appendChild(A(E('em'), d.createTextNode(po ? (lo ? 'Low · ' : '') + po.id + (po.st === 'draft' ? ' drafted, waiting for approval' : ' on its way, due ' + wl(po.eta)) : 'Low stock'), !po && edit ? B('Reorder', 'pb s', function () { M.reorder(i); tab.stock = 'pos'; paint(); }) : null));
        p.appendChild(r);
      });
      c.appendChild(p);
    },
    inv: function (c, tb) {
      var L = invs(), due = L.filter(function (v) { return v.st !== 'paid'; }), p = panel(), f = E('div', 'seg');
      if (tb === 'pays') return A(c, kpis([['Received', short(D.paid)], ['To collect', short(sum(due))], ['Overdue', short(sum(due.filter(function (v) { return v.over; })))]], ' k3'), A(panel('Payments received'), list(D.pays.slice(0, 8), function (x) { return tr(x.n, x.id + ' · ' + x.how + ' · ' + wl(x.day), null, inr(x.v), function () { jump(['inv', x.id]); }); }, 'No payments yet.')));
      p.appendChild(E('em', 'tm', 'Test mode · no real payments'));
      [['all', 'All'], ['due', 'Unpaid'], ['over', 'Overdue'], ['paid', 'Paid']].forEach(function (x) { var b = B(x[1], '', function () { filt = x[0]; paint(); }); b.setAttribute('aria-pressed', filt === x[0]); f.appendChild(b); });
      L = L.filter(function (v) { return filt === 'all' || (filt === 'paid' ? v.st === 'paid' : filt === 'over' ? v.over : v.st !== 'paid'); });
      A(p, f, list(L.slice(0, 9), function (v) { var s = ist(v); return tr(v.id + ' · ' + v.n, v.lines[0][0], pill(s[0], s[1]), inr(v.v), function () { jump(['inv', v.id]); }); }, 'Nothing here.')); c.appendChild(p);
    },
    chat: function (c, tb) {
      var b = C.name || 'your business', w = E('div', 'thr'), ls = E('div', 'thl'), cur = D.chats.filter(function (x) { return x.n === thr; })[0] || D.chats[0], p, m = E('div', 'bub'), q = E('div', 'qrs');
      if (tb === 'tpl') return [['Booking confirmation', 0, 'Confirmed: ' + P.w.book.toLowerCase() + ', {day} at {time}. Reply 1 to change it. Thank you, ' + b + '.'], ['Reminder on the day', 0, 'A reminder from ' + b + ': your ' + P.w.book.toLowerCase() + ' is today at {time}. See you then.'], ['Payment reminder', 3, 'A gentle reminder: {invoice} for {amount} was due on {day}. You can pay from your portal link.'], ['When the job is finished', 4, P.w.ty]].forEach(function (x) {
        var a = AU[x[1]], t = panel(x[0], 'Sent ' + a[1].charAt(0).toLowerCase() + a[1].slice(1) + '.'); t.insertBefore(pill(C.autos[a[0]] ? 'On' : 'Off', C.autos[a[0]] ? 'ok' : ''), t.firstChild); t.classList.add('tpc'); t.appendChild(A(E('div', 'bub'), E('p', 'u', x[2]))); c.appendChild(t);
      });
      D.chats.slice(0, 6).forEach(function (x) { var t = B('', x === cur ? 'on' : '', function () { thr = x.n; x.un = 0; paint(); }); A(t, E('b', '', x.n), E('span', '', x.m[x.m.length - 1][1])); if (x.un) t.appendChild(E('i', 'bg', x.un)); ls.appendChild(t); });
      p = panel(cur ? cur.n : 'No chats yet', 'Scripted replies, not AI. It answers at night and files the lead.');
      if (cur) { cur.un = 0; cur.m.slice(-5).forEach(function (x) { m.appendChild(E('p', x[0] ? '' : 'u', x[1])); }); }
      if (D.qr.length) q.appendChild(E('span', 'mu', 'Try a customer message:'));
      D.qr.forEach(function (x, i) { q.appendChild(B(x[0], 'pb s g', function () { thr = M.ask(i); paint(); })); });
      A(p, m, q); A(w, ls, p); c.appendChild(w);
    },
    field: function (c, tb) { var ph = E('div', C.dev === 'phone' || small.matches ? 'ap-b' : 'ph ap-b'); if (tb === 'route') S.route(ph); else S.jobs(ph); A(c, E('p', 'mu', 'What ' + P.team.field[0] + ', ' + P.team.field[1].toLowerCase() + ', sees on the phone:'), ph); },
    jobs: function (c) { var n = jobs(D.day + 1); A(c, A(panel('Today', LONG[D.day % 7]), list(jobs(D.day), jobRow, 'Nothing today. Bookings and paid deals land here.')), n.length ? A(panel('Tomorrow'), list(n, jobRow)) : null); },
    route: function (c) {
      var t = jobs(D.day), m = E('div', 'mapx sm');
      t.forEach(function (e, i) { var x = E('i', 'stopn' + (e.done ? ' dn' : ''), i + 1); x.style.left = 14 + i * 37 % 72 + '%'; x.style.top = 24 + i * 53 % 54 + '%'; m.appendChild(x); });
      A(c, m, A(panel('Route', t.length ? t.length + (t.length > 1 ? ' stops' : ' stop') + ', in time order' : ''), list(t, function (e, i) { var s = est(e); return tr(i + 1 + '. ' + e.n, e.tm + ' · ' + e.w.split(' · ').pop(), pill(s[0], s[1]), null, function () { jump(['ev', e.id]); }); }, 'No stops today.')));
    },
    rep: function (c, tb) {
      var due = D.invs.filter(function (v) { return v.st !== 'paid'; }), tot = sum(D.invs), bars = E('div', 'bar2'), g = E('div', 'ch'), p = panel('Pipeline'), n, mx;
      if (tb === 'act') return c.appendChild(A(panel('', D.fired + ' automations have run. Each line changed real records; click one to open it.'), feed(D.log.slice(0, 14))));
      if (tb === 'team') return c.appendChild(A(panel('', 'This week, by person.'), list([P.team.sales[0], P.team.s2, P.team.field[0]], function (x, i) {
        var L = D.leads.filter(function (l) { return l.own === x; }), w = L.filter(function (l) { return l.s === 2; }), J = D.ev.filter(function (e) { return e.who === x; });
        return i < 2 ? tr(x, P.team.sales[1] + ' · ' + L.filter(function (l) { return l.s < 2; }).length + ' open · ' + D.tasks.filter(function (k) { return k.who === x && !k.done; }).length + ' tasks to do', pill(w.length + ' won', w.length ? 'ok' : ''), short(sum(w)))
          : tr(x, P.team.field[1] + ' · ' + J.length + ' jobs this week', pill(J.filter(function (e) { return e.done; }).length + ' done', 'b'), '');
      })));
      if (tb === 'money') {
        [['Invoiced', tot], ['Received', sum(D.invs.filter(function (v) { return v.st === 'paid'; }))], ['To collect', sum(due)], ['Overdue', sum(due.filter(function (v) { return v.over; }))]].forEach(function (x, i) { var r = E('p', i === 3 ? 'bad' : ''), b = E('i'); b.style.setProperty('--w', (tot ? x[1] / tot * 100 : 0) + '%'); A(r, E('span', '', x[0]), b, E('b', '', short(x[1]))); bars.appendChild(r); });
        return A(c, A(panel('Money'), bars), A(panel('Who owes what'), list(due.slice().sort(function (a, b) { return b.over - a.over || a.due - b.due; }).slice(0, 6), function (v) { var s = ist(v); return tr(v.n, v.id + ' · due ' + wl(v.due), pill(s[0], s[1]), inr(v.v), function () { jump(['inv', v.id]); }); }, 'Nobody owes anything.')));
      }
      n = P.st.map(function (s, i) { return D.leads.filter(function (x) { return x.s === i; }).length; }); mx = Math.max.apply(0, n.concat(1));
      P.st.forEach(function (s, i) { var b = E('div'), bar = E('i'); bar.style.height = n[i] / mx * 100 + '%'; A(b, bar, E('b', '', n[i]), E('span', '', s)); g.appendChild(b); }); p.appendChild(g);
      A(c, kpis([['Won', short(D.won)], ['Received', short(D.paid)], ['To collect', short(sum(due))], [P.w.cal, D.ev.length], ['Automations run', D.fired]]), p);
    },
    portal: function (c, tb) {
      var names = [], n, e, L, v, sw, p, t, m;
      D.ev.forEach(function (x) { if (names.indexOf(x.n) < 0) names.push(x.n); }); D.invs.forEach(function (x) { if (x.src !== 'sale' && names.indexOf(x.n) < 0) names.push(x.n); });
      n = names.indexOf(cust) >= 0 ? cust : names[0]; e = D.ev.filter(function (x) { return x.n === n; }).pop(); L = D.invs.filter(function (x) { return x.n === n; }); v = L.filter(function (x) { return x.st !== 'paid'; })[0];
      sw = A(E('p', 'mu rw'), d.createTextNode('What a customer sees when they log in. Viewing as ' + (n || 'nobody yet') + '.'), names.length > 1 ? B('Switch customer', 'lk', function () { cust = names[(names.indexOf(n) + 1) % names.length]; paint(); }) : null);
      if (tb === 'bills') return A(c, sw, C.mods.inv ? A(panel('Your bills'), list(L, function (x) { var s = ist(x); return tr(x.id, x.lines[0][0], pill(s[0].split(' · ')[0], s[1]), x.st === 'paid' ? inr(x.v) : B('Pay ' + inr(x.v), 'pb s', function () { M.pay(x, 'card, in the portal'); paint(); })); }, 'Nothing to pay.')) : A(panel('Your bills', 'Bills appear here once Invoices & payments is part of the system.'), B('Add Invoices & payments', 'pb', function () { add('inv'); })));
      p = panel('Hello, ' + (n || 'there'), e ? e.w + ' · ' + when(e.day) + ', ' + e.tm : 'Nothing booked yet');
      p.appendChild(steps([['Booked', !!e], ['Confirmed', !!e && e.st === 'confirmed'], ['Invoice sent', L.length > 0], ['Paid', L.length > 0 && !v], [P.w.fin, !!e && e.done]]));
      if (e && e.on && !e.done) p.appendChild(E('p', 'ok', e.who + ' is on site now.'));
      if (v && C.mods.inv) p.appendChild(B('Pay ' + inr(v.v) + ' · test mode', 'pb', function () { M.pay(v, 'card, in the portal'); paint(); }));
      t = D.chats.filter(function (x) { return x.n === n; })[0]; if (t) { m = E('div', 'bub'); t.m.slice(-3).forEach(function (x) { m.appendChild(E('p', x[0] ? 'u' : '', x[1])); }); }
      A(c, sw, p, t ? A(panel('Messages'), m) : null);
    },
    arch: function (c) {
      var w = E('div', 'ar'), ids = MODS.filter(function (m) { return C.mods[m[0]]; }), n = ids.length, f = panel('Flows', 'What sets off what. A dashed step needs a module you have not added: click it to add.');
      w.appendChild(E('b', 'hubn', (C.name || 'Your business').charAt(0).toUpperCase()));
      var NS = 'http://www.w3.org/2000/svg', svg = d.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true'); w.appendChild(svg);
      ids.forEach(function (m, i) { var a = i / n * 6.283 - 1.57, e = E('span', '', label(m[0])), l = d.createElementNS(NS, 'line'), x = 50 + Math.cos(a) * 38, y = 50 + Math.sin(a) * 36; e.style.left = x + '%'; e.style.top = y + '%'; l.setAttribute('x1', 50); l.setAttribute('y1', 50); l.setAttribute('x2', x); l.setAttribute('y2', y); svg.appendChild(l); w.appendChild(e); });
      AU.forEach(function (a) {
        var r = E('div', 'fl' + (C.autos[a[0]] ? '' : ' off')); r.appendChild(E('b', '', a[1]));
        a[2].forEach(function (s, i) { var m = a[3][i]; r.appendChild(!m || C.mods[m] ? E('span', '', C.mods.chat ? s : s.replace('on WhatsApp', 'by email')) : B(s + ' · add ' + modName(m), 'miss', function () { add(m); })); });
        f.appendChild(r);
      });
      A(c, w, E('p', 'mu', 'One database in the middle; every module reads and writes to it.'), f);
    }
  };

  /* ---- records: a lead, a booking, an invoice ---- */
  var DET = {
    lead: function (c, l) {
      var sell = M.can('sell'), p = panel(), acts = E('div', 'rw wrap'), s = D.stock[l.need[0]], po = M.openPO(l.need[0]), lk = panel('Linked records'), rows = [], K = D.tasks.filter(function (x) { return x.ref && x.ref[1] === l.id; });
      A(p, kv([['What', l.d], ['Worth', inr(l.v)], ['Source', l.src], ['Owner', l.own], ['Last touch', when(l.last)]]), steps(P.st.map(function (x, i) { return [x, i <= l.s]; })));
      if (sell && l.s === 0) acts.appendChild(B(P.mid ? 'Book a ' + P.w.book.toLowerCase() : 'Move to “' + P.st[1] + '”', 'pb', function () { M.stage(l, 1); paint(); }));
      if (sell && l.s < 2) acts.appendChild(B('Mark as ' + P.st[2].toLowerCase(), 'pb' + (l.s ? '' : ' g'), function () { won(l); }));
      if (sell && l.s === 2 && !l.inv && C.mods.inv) acts.appendChild(B('Raise the invoice', 'pb', function () { M.raise(l); paint(); }));
      if (sell && l.s === 2 && C.mods.stock && !l.res && !l.out && !l.short) acts.appendChild(B('Reserve the stock', 'pb g', function () { M.hold(l); paint(); }));
      if (acts.firstChild) p.appendChild(acts); c.appendChild(p);
      D.ev.forEach(function (e) { if (e.lead === l.id) rows.push(evRow(e)); });
      [l.inv, l.bal].forEach(function (id) { var v = id && M.by(D.invs, id), st; if (v) { st = ist(v); rows.push(tr(v.id, v.lines[0][0], pill(st[0], st[1]), inr(v.v), where(['inv', v.id]) ? function () { jump(['inv', v.id]); } : null)); } });
      if (C.mods.stock && (l.res || l.out || l.short)) rows.push(tr(l.need[1] + ' × ' + s.n, l.short ? l.short + ' short' + (po ? ' · ' + po.id + (po.st === 'draft' ? ' is waiting for approval' : ' is on its way') : '') : l.out ? 'Issued from stock when the invoice was paid' : 'Held until the invoice is paid', pill(l.short ? 'Short' : l.out ? 'Issued' : 'Reserved', l.short ? 'warn' : l.out ? 'ok' : 'b'), null, function () { go('stock', 'items'); }));
      rows.forEach(function (r) { lk.appendChild(r); }); if (!rows.length) lk.appendChild(E('p', 'mu', 'Nothing yet. A booking, an invoice and reserved stock show up here as they are created.')); lk.classList.add('tbp'); c.appendChild(lk);
      if (K.length) c.appendChild(A(panel('Tasks'), list(K, function (k) { var r = E('div', 'tr' + (k.done ? ' dn' : '')), ck = B(k.done ? '✓' : '', 'ck', function () { M.done(k); paint(); }); ck.setAttribute('aria-pressed', !!k.done); ck.setAttribute('aria-label', 'Done: ' + k.t); return A(r, ck, A(E('span', 't1'), E('b', '', k.t), E('small', '', k.who + ' · due ' + wl(k.due)))); })));
      c.appendChild(A(panel('Timeline'), tl(l.log)));
    },
    ev: function (c, e) {
      var p = panel(), acts = E('div', 'rw wrap'), v = e.inv && M.by(D.invs, e.inv), office = M.can('sell'), site = M.can('site'), ck, s;
      A(p, kv([['What', e.w], ['When', when(e.day) + ', ' + e.tm], ['On site', e.who], ['Booked by', e.by]]), steps([['Booked', 1], ['Confirmed', e.st === 'confirmed'], ['Reminded', e.rem], ['On site', e.on], ['Done', e.done]]));
      if (!e.done) {
        if (office && e.st !== 'confirmed') acts.appendChild(B('Send the confirmation', 'pb', function () { M.confirm(e); paint(); }));
        if (office && P.fee && !e.inv && !e.job && C.mods.inv) acts.appendChild(B('Raise the advance invoice', 'pb g', function () { M.advance(e); paint(); }));
        if (office && !e.rem) acts.appendChild(B('Send a reminder now', 'pb g', function () { M.nudge(e); paint(); }));
        if (site && !e.on) acts.appendChild(B('Check in', 'pb', function () { M.checkin(e); paint(); }));
        if (site && e.on) acts.appendChild(B('Finish', 'pb', function () { M.finish(e); paint(); }));
      }
      if (acts.firstChild) p.appendChild(acts); c.appendChild(p);
      if (site) { ck = panel('Checklist', e.on || e.done ? '' : 'Check in to start.'); P.check.forEach(function (x, i) { var on = !!(e.chk[i] || e.done), b = B(on ? '✓' : '', 'ck', function () { if (e.done || !e.on) return; e.chk[i] = !e.chk[i]; paint(); }); b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', x); ck.appendChild(A(E('div', 'tr'), b, A(E('span', 't1'), E('b', '', x)))); }); c.appendChild(ck); }
      if (v && C.role !== 'field') { s = ist(v); c.appendChild(A(panel('Advance'), tr(v.id, v.lines[0][0], pill(s[0], s[1]), inr(v.v), where(['inv', v.id]) ? function () { jump(['inv', v.id]); } : null))); }
      c.appendChild(A(panel('Timeline'), tl(e.log)));
    },
    inv: function (c, v) {
      var p = panel(), t = E('div', 'bill'), acts = E('div', 'rw wrap'), r = v.src === 'deal' || v.src === 'bal' ? ['lead', v.ref] : v.src === 'booking' ? ['ev', v.ref] : null, x;
      p.appendChild(E('em', 'tm', 'Test mode · no real payments'));
      p.appendChild(kv([['Billed to', v.n], ['Raised', when(v.made)], ['Due', when(v.due)]]));
      v.lines.forEach(function (y) { A(t, E('span', '', y[0]), E('b', '', (y[1] < 0 ? '− ' : '') + inr(Math.abs(y[1])))); });
      A(t, E('span', 'mu', 'Of which GST at 18%'), E('b', 'mu', inr(v.v - Math.round(v.v / 1.18))), E('span', 'tot', 'Total'), E('b', 'tot', inr(v.v))); p.appendChild(t);
      if (v.st !== 'paid') {
        if (M.can('pay')) A(acts, B('Record payment · UPI', 'pb', function () { M.pay(v, 'UPI'); paint(); }), B('Bank transfer', 'pb g', function () { M.pay(v, 'bank transfer'); paint(); }), B('Send a reminder', 'pb g', function () { M.remind(v); paint(); }));
        else p.appendChild(E('p', 'mu', 'Only ' + P.team.acct[0] + ' and ' + P.team.owner[0] + ' record payments.'));
      }
      if (acts.firstChild) p.appendChild(acts); c.appendChild(p);
      if (r && where(r)) { x = find({ t: r[0], id: r[1] }); if (x) c.appendChild(A(panel('Raised from'), tr(x.n, r[0] === 'lead' ? x.d : x.w, null, null, function () { jump(r); }))); }
      c.appendChild(A(panel('Timeline'), tl(v.log)));
    }
  };
  /* a card is clicked to open it, or dragged to move the lead on */
  function drag(el, x) {
    var can = M.can('sell') && x.s < 2;
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jump(['lead', x.id]); } });
    el.addEventListener('pointerdown', function (e) {
      if (e.button) return; var sx = e.clientX, sy = e.clientY, r = el.getBoundingClientRect(), over = null, g = null;
      function mv(ev) {
        if (!g) { if (!can || Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) return; g = el.cloneNode(true); g.className = 'kcard drag'; g.style.width = r.width + 'px'; d.body.appendChild(g); el.style.opacity = .3; }
        g.style.left = r.left + ev.clientX - sx + 'px'; g.style.top = r.top + ev.clientY - sy + 'px'; var c = d.elementFromPoint(ev.clientX, ev.clientY); c = c && c.closest('.kcol'); if (c !== over) { if (over) over.classList.remove('over'); over = c; if (c) c.classList.add('over'); }
      }
      function up(ev) {
        removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
        if (!g) { if (ev.type === 'pointerup') jump(['lead', x.id]); return; }
        g.remove(); var s = over ? +over.dataset.s : -1; if (s > x.s) { if (s === 2) return won(x); M.stage(x, s); } paint();
      }
      addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    });
  }
  function paint() {
    D = M.D; P = M.P;
    var list2 = screens(), arch = C.view === 'arch', view = arch ? 'arch' : list2.some(function (s) { return s[0] === scr; }) ? scr : (scr = list2[0][0]);
    var tabs = arch ? [] : tabsOf(view), tb = !tabs.length ? '' : tabs.some(function (t) { return t[0] === tab[view]; }) ? tab[view] : (tab[view] = tabs[0][0]);
    var rec = !arch && open ? find(open) : null, name = arch ? 'Architecture' : list2.filter(function (s) { return s[0] === view; })[0][1];
    if (!rec) open = null;
    var k = view + '/' + tb + '/' + (rec ? rec.id : ''), old = app.querySelector('.ap-main'), y = old && k === key ? old.scrollTop : 0;
    var sb = E('nav', 'ap-sb'), main = E('div', 'ap-main' + (k === key ? '' : ' fresh')), head = E('div', 'ap-h'), body = E('div', 'ap-b'), st, ts;
    sb.setAttribute('aria-label', 'Screens');
    A(sb, A(E('div', 'ap-brand'), E('i', 'ap-logo', (C.name || 'Y').charAt(0).toUpperCase()), E('b', '', C.name || 'Your business')));
    list2.forEach(function (s) { var n = badge(s[0]), b = B(s[1], '', function () { go(s[0]); }); if (n) b.appendChild(E('i', 'bg', n)); if (s[0] === view) b.setAttribute('aria-current', 'page'); sb.appendChild(b); });
    if (rec) { st = open.t === 'lead' ? [P.st[rec.s], rec.s === 2 ? 'ok' : rec.s ? 'b' : ''] : open.t === 'ev' ? est(rec) : ist(rec); A(head, A(E('div', 'ap-t'), B('‹ ' + name, 'bk2', function () { open = null; paint(); }), A(E('h4'), d.createTextNode(open.t === 'inv' ? rec.id : rec.n), pill(st[0], st[1])))); }
    else head.appendChild(E('h4', '', name));
    A(head, A(E('span', 'ap-role'), E('i', '', me().charAt(0)), E('span', '', me() + ' · ' + P.team[C.role][1])));
    main.appendChild(head);
    if (!arch && C.role !== 'owner') main.appendChild(E('p', 'lens', lens()));
    if (tabs.length > 1 && !rec) { ts = E('div', 'tbs'); tabs.forEach(function (t) { var b = B(t[1], '', function () { tab[view] = t[0]; paint(); }); b.setAttribute('aria-pressed', t[0] === tb); ts.appendChild(b); }); main.appendChild(ts); }
    main.appendChild(body);
    if (rec) DET[open.t](body, rec); else S[view](body, tb);
    app.textContent = ''; A(app, sb, main); main.scrollTop = y; key = k;
    $('#frUrl').textContent = (slug(C.name).replace(/-/g, '') || 'yourbusiness') + '.app/' + (arch ? 'architecture' : slug(name) + (rec ? '/' + rec.id.toLowerCase() : tb && tb !== tabs[0][0] ? '/' + tb : ''));
    ckT.textContent = LONG[D.day % 7] + (D.day > 6 ? ', week ' + (Math.floor(D.day / 7) + 1) : ''); summary();
  }

  /* ---- the configurator ---- */
  function step(n, title) { var f = E('fieldset', 'stp'), l = E('legend'); A(l, E('b', '', n), d.createTextNode(title)); f.appendChild(l); cfg.appendChild(f); return f; }
  function group(parent, key2, items, fn) { var g = E('div', 'chips'); g.dataset.g = key2; items.forEach(function (it) { var b = B(it[1], '', function () { touched = true; fn(it[0]); sync(); paint(); save(); }); b.dataset.v = it[0]; g.appendChild(b); }); parent.appendChild(g); return g; }
  var s1 = step(1, 'Business'), nameIn = E('input'); nameIn.type = 'text'; nameIn.maxLength = 28; nameIn.placeholder = 'Type its name'; nameIn.id = 'biz'; nameIn.setAttribute('aria-label', 'Your business name'); nameIn.autocomplete = 'off'; s1.appendChild(nameIn);
  nameIn.addEventListener('input', function () { C.name = nameIn.value.trim(); touched = true; paint(); save(); });
  group(s1, 'trade', Object.keys(PACK).map(function (k) { return [k, PACK[k].n]; }), function (v) { if (v !== C.trade) { C.trade = v; defaults(); fresh(); scr = 'home'; C.view = 'app'; index(); } });
  var s2 = step(2, 'Modules'); group(s2, 'mods', MODS, function (v) { C.mods[v] = C.mods[v] ? 0 : 1; if (C.mods[v] && (' ' + SEE[C.role] + ' ').indexOf(' ' + v + ' ') >= 0) { scr = v; open = null; C.view = 'app'; } }).classList.add('pick');
  var s3 = step(3, 'Theme'), tg = group(s3, 'theme', THEMES, function (v) { C.theme = v; }); tg.classList.add('ths'); [].forEach.call(tg.children, function (b) { b.classList.add('th-' + b.dataset.v); });
  var cg = E('div', 'swt'); cg.dataset.g = 'color'; COLS.forEach(function (c) { var b = B('', '', function () { C.color = c; touched = true; sync(); save(); }); b.dataset.v = c; b.style.setProperty('--c', c); b.setAttribute('aria-label', 'Brand colour ' + c); cg.appendChild(b); });
  var pick = E('input'); pick.type = 'color'; pick.setAttribute('aria-label', 'Pick any brand colour'); pick.addEventListener('input', function () { C.color = pick.value; touched = true; sync(); save(); }); cg.appendChild(pick); s3.appendChild(cg);
  var s4 = step(4, 'Team and automations'); s4.appendChild(E('p', 'l', 'See it as'));
  var rg = group(s4, 'role', ROLES.map(function (k) { return [k, k]; }), function (v) {
    if (v === 'field' && C.dev !== 'phone' && !small.matches) { keep = C.dev; C.dev = 'phone'; } else if (v !== 'field' && keep) { C.dev = keep; keep = ''; }
    C.role = v; C.view = 'app'; scr = 'home'; open = null;
  }), roleP = E('p', 'rolep'); s4.appendChild(roleP);
  s4.appendChild(E('p', 'l', 'Automations'));
  var ag = E('div', 'autos'); ag.dataset.g = 'autos'; Z.AUTOS.forEach(function (a) { var b = B('', '', function () { var k = a[0]; C.autos[k] = C.autos[k] ? 0 : 1; touched = true; if (C.autos[k] && (k === 'a3' || k === 'a4')) M.sweep(); sync(); paint(); save(); }); b.dataset.v = a[0]; A(b, E('b'), E('span')); ag.appendChild(b); }); s4.appendChild(ag);
  var sum2 = E('div', 'spec'); cfg.appendChild(sum2);
  group($('#vView'), 'view', [['app', 'App'], ['arch', 'Architecture']], function (v) { C.view = v; }); group($('#vDev'), 'dev', [['desk', 'Desktop'], ['phone', 'Phone']], function (v) { C.dev = v; keep = ''; });
  /* the clock sits with the view switches: it belongs to the preview, not to the product */
  var ck2 = E('div', 'clk'), ckT = E('b'), ckB = B('Next day →', '', function () { M.tick(); paint(); }); ckB.setAttribute('aria-label', 'Move the sample week on by a day'); A(ck2, ckT, ckB); $('#vDev').parentNode.insertBefore(ck2, $('#vDev'));
  var tip = $('.st-pv .tip'); if (tip) { tip.appendChild(d.createTextNode(' ')); tip.appendChild(B('Start the week again', 'rst', function () { fresh(); scr = 'home'; note('Sample data is back to Monday morning'); paint(); })); }
  function tint(hex) { var n = parseInt(hex.slice(1), 16), m = function (v) { return Math.round(v + (255 - v) * .88); }; return 'rgb(' + m(n >> 16) + ',' + m(n >> 8 & 255) + ',' + m(n & 255) + ')'; }
  function sync() {
    [].forEach.call(d.querySelectorAll('#build [data-g]'), function (g) { var k = g.dataset.g; [].forEach.call(g.querySelectorAll('button'), function (b) { var v = b.dataset.v; b.setAttribute('aria-pressed', k === 'mods' || k === 'autos' ? !!C[k][v] : C[k] === v); }); });
    [].forEach.call(rg.children, function (b) { b.textContent = P.team[b.dataset.v][1]; });
    [].forEach.call(ag.children, function (b, i) { b.firstChild.textContent = AU[i][1]; b.lastChild.textContent = '→ ' + AU[i][2].join(' → '); });
    roleP.textContent = C.role === 'owner' ? me() + ' sees everything and approves what leaves the business.' : lens();
    fr.dataset.th = C.theme; fr.classList.toggle('phone', C.dev === 'phone'); root.style.setProperty('--b', C.color); root.style.setProperty('--bs', tint(C.color)); pick.value = C.color; if (nameIn.value.trim() !== C.name) nameIn.value = C.name;
  }
  function spec() { var m = MODS.filter(function (x) { return C.mods[x[0]]; }), a = AU.filter(function (x) { return C.autos[x[0]]; }), w = Math.round(2 + m.reduce(function (s, x) { return s + x[2]; }, 0)); return { m: m, a: a, lo: w, hi: w + 2, n: m.reduce(function (s, x) { return s + DEEP[x[0]]; }, 1), th: THEMES.filter(function (t) { return t[0] === C.theme; })[0][1], r: ROLES.map(function (r) { return P.team[r][1]; }).join(', ') }; }
  function summary() {
    var s = spec(), n = C.name || 'my business', mess = window.MESS && window.MESS.length ? window.MESS.join(', ') : '';
    var body = 'Business: ' + n + '\nTrade: ' + P.n + '\nHome screen: ' + P.home + '\nModules: ' + s.m.map(function (x) { return x[1]; }).join(', ') + '\nScreens: ' + s.n + '\nTheme: ' + s.th + ', brand colour ' + C.color + '\nRoles: ' + s.r + '\nAutomations: ' + (s.a.length ? s.a.map(function (x) { return x[1] + ' → ' + x[2].join(' → '); }).join('; ') : 'none yet') + '\nTypical timeline: ' + s.lo + ' to ' + s.hi + ' weeks' + (mess ? '\nOur mess: ' + mess : '') + '\nLink to this configuration: ' + location.href.split('#')[0] + '#b=' + pack() + '\n\nHow we work today:\n';
    var href = 'mailto:abhimasih0505@gmail.com?subject=' + encodeURIComponent('A system for ' + n) + '&body=' + encodeURIComponent(body);
    sum2.textContent = ''; A(sum2, E('h4', '', (C.name || 'Your') + (C.name ? '’s' : '') + ' system, as specified'));
    var dl = E('dl'); [['Product', P.n + ' · home screen: ' + P.home], ['Modules', s.m.length ? s.m.map(function (x) { return x[1]; }).join(', ') : 'None yet'], ['Screens', s.n + ', with records you can open'], ['Theme', s.th], ['Roles', s.r], ['Automations', s.a.length + ' on'], ['Typical timeline', s.lo + ' to ' + s.hi + ' weeks']].forEach(function (x) { A(dl, E('dt', '', x[0]), E('dd', '', x[1])); }); sum2.appendChild(dl);
    sum2.appendChild(E('small', '', 'Two weeks to listen and map, the rest to build, test and launch. A first estimate, not a quote.'));
    var go2 = E('a', 'btn b', C.name ? 'Build ' + C.name + ' for real →' : 'Build this for real →'); go2.href = href; var sh = B('Copy a link to this setup', 'btn', function () { var u = location.href.split('#')[0] + '#b=' + pack(), ok = function () { sh.textContent = 'Link copied'; setTimeout(function () { sh.textContent = 'Copy a link to this setup'; }, 1800); }; try { history.replaceState(null, '', '#b=' + pack()); } catch (e) { /* file: or sandboxed */ } if (navigator.clipboard) navigator.clipboard.writeText(u).then(ok, ok); else ok(); });
    A(sum2, A(E('p', 'acts'), go2, sh)); $('#endH').textContent = C.name ? 'Let’s build ' + C.name + ' its own system.' : 'Let’s build yours.'; $('#cta2').href = $('#mail').href = href;
  }
  /* ---- save, share, restore ---- */
  function pack() { return [C.trade, C.theme, C.color.slice(1), MODS.map(function (m) { return C.mods[m[0]] ? 1 : 0; }).join(''), Z.AUTOS.map(function (a) { return C.autos[a[0]] ? 1 : 0; }).join(''), C.role, C.dev, encodeURIComponent(C.name)].join('.'); }
  function unpack(s) {
    var p = s.split('.'); if (p.length < 7 || !PACK[p[0]]) return false; C.trade = p[0]; if (THEMES.some(function (t) { return t[0] === p[1]; })) C.theme = p[1]; if (/^[0-9a-f]{6}$/i.test(p[2])) C.color = '#' + p[2];
    C.mods = {}; MODS.forEach(function (m, i) { if (p[3].charAt(i) === '1') C.mods[m[0]] = 1; });
    if (p[4].length >= Z.AUTOS.length) Z.AUTOS.forEach(function (a, i) { C.autos[a[0]] = p[4].charAt(i) === '1' ? 1 : 0; });   /* an older link carries four switches: keep today's defaults */
    if (ROLES.indexOf(p[5]) >= 0) C.role = p[5]; C.dev = p[6] === 'phone' ? 'phone' : 'desk'; try { C.name = decodeURIComponent(p.slice(7).join('.')).slice(0, 28); } catch (e) { C.name = ''; } return true;
  }
  function save() { if (!touched) return; try { localStorage.setItem('am-build', pack()); } catch (e) { /* private mode */ } }
  var ok = false; if (location.hash.indexOf('#b=') === 0) ok = unpack(location.hash.slice(3)); if (!ok) { try { var st0 = localStorage.getItem('am-build'); if (st0) ok = unpack(st0); } catch (e) { /* private mode */ } } if (!ok) defaults();
  addEventListener('mess', function () { var m = window.MESS; if (m && m.length) note('Your mess arrived: “' + m[m.length - 1] + '”'); summary(); });

  /* the real projects: closest to the chosen trade first, with a preview that plays the page */
  var ix = $('#ix'), pv = $('#pv');
  var plain = false;
  function index() {
    var like = P.like, order = plain ? W.slice() : like.map(function (id) { return W.filter(function (w) { return w.id === id; })[0]; }).concat(W.filter(function (w) { return like.indexOf(w.id) < 0; })), nt = $('#like');
    ix.textContent = ''; nt.textContent = plain ? 'Showing all 23 in the usual order.' : 'Showing ' + P.n.toLowerCase() + ' projects first, to match the trade you picked in the builder.';
    nt.appendChild(B(plain ? 'Show ' + P.n.toLowerCase() + ' first' : 'Show all in the usual order', '', function () { plain = !plain; index(); }));
    order.forEach(function (w, i) {
      var a = E('a'), b = E('b', '', w.name); a.href = w.href;
      a.appendChild(E('span', 'n', (i < 9 ? '0' : '') + (i + 1))); a.appendChild(b); a.appendChild(E('span', 'k', w.kind)); a.appendChild(E('span', 's', w.status)); a.appendChild(E('span', 'g', '→'));
      function on() { pv.textContent = ''; if (!w.img && !w.card) { pv.classList.remove('on'); return; } var im = new Image(); im.alt = ''; if (w.img) im.addEventListener('load', function () { var dy = pv.clientHeight - im.clientHeight; if (dy < 0 && !reduce) { im.style.setProperty('--y', dy + 'px'); im.style.setProperty('--t', Math.max(6, w.a * 3.4) + 's'); im.classList.add('pan'); } }); im.src = (root.dataset.base || '') + (w.img ? 'img/' + w.img + '.webp' : 'img/cards/' + w.card + '.webp'); pv.appendChild(im); pv.classList.add('on'); }
      a.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') on(); }); a.addEventListener('focus', on); if (!i) on();
      ix.appendChild(a);
    });
  }
  M = Z.make(C); M.emit = emit; fresh(); sync(); paint(); index();
  if (location.hash.indexOf('#b=') === 0) setTimeout(function () { $('#build').scrollIntoView(); }, 300);
  window.__studio = { C: C, M: M, paint: paint, go: go, jump: jump, book: function (n, w) { M.book(n, w); paint(); } };
})();
