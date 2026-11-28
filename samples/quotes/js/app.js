/* Marlow & Reed Studio OS: shell, router, palette, keyboard. */
(function () {
  'use strict';
  var MR = window.MR, u = MR.u, esc = u.esc, ic = MR.ic;
  MR.views = MR.views || {}; MR.act = MR.act || {}; MR.bind = MR.bind || {}; MR.live = MR.live || {};

  var main, appEl, sideEl, scrim, navEl, crumbsEl;
  var MOBILE = matchMedia('(max-width: 820px)');

  /* ---------------- navigation model ---------------- */
  function navModel() {
    var S = MR.S, r = S.role, can = MR.can;
    var openQ = S.quotes.filter(function (q) { return ['draft', 'review', 'approved', 'sent', 'viewed', 'changes', 'rejected'].indexOf(q.status) > -1; }).length;
    var review = S.quotes.filter(function (q) { return q.status === 'review'; }).length;
    var active = S.projects.filter(function (p) { return p.status !== 'handed'; }).length;
    var overdue = S.invoices.filter(function (iv) { return MR.invState(iv).key === 'overdue'; }).length;
    var openSn = S.snags.filter(function (s) { return s.status !== 'closed' && (r !== 'site' || MR.project(s.projectId).eng === MR.me().id); }).length;
    var pend = S.pos.filter(function (o) { return o.status === 'issued' || o.status === 'partial'; }).length;
    if (r === 'site') return [
      ['', [['site', 'Today', 'helmet'], ['logs', 'Daily logs', 'log'], ['snags', 'Snags', 'snag', openSn], ['deliveries', 'Deliveries', 'truck', pend], ['projects', 'My sites', 'projects']]]
    ];
    if (r === 'client') return [['', [['portal', 'My project', 'home'], ['d/dz-iyer', 'Design approvals', 'eye']]]];
    var leadsOpen = (S.leads || []).filter(function (l) { return l.stage !== 'won' && l.stage !== 'lost'; }).length;
    var callsDue = MR.callQueue ? MR.callQueue().filter(function (l) { var x = l.remarks[l.remarks.length - 1]; return !(x && x.at.slice(0, 10) === MR.u.today()); }).length : (S.leads || []).filter(function (l) { return l.next && l.next.at.slice(0, 10) <= MR.u.today() && l.stage !== 'won' && l.stage !== 'lost'; }).length + (S.leads || []).filter(function (l) { return l.stage === 'new' && !l.remarks.length; }).length;
    var dzN = 0; (S.boards || []).forEach(function (b) { b.rooms.forEach(function (x) { if (x.status === 'changes') dzN++; }); });
    var bidN = (S.bids || []).filter(function (b) { return b.status !== 'awarded' && Object.keys(b.quotes).length >= b.vendors.length; }).length;
    var g = [['', [['', 'Home', 'home']]]];
    var crm = [['leads', 'Leads', 'clients', leadsOpen], ['calls', 'Calls', 'phone', callsDue, callsDue > 0], ['design', 'Design boards', 'eye', dzN, dzN > 0]];
    if (r === 'design') { g.push(['CRM & design', crm]); g.push(['Sales', [['quotes', 'Quotes', 'quotes', openQ], ['rates', 'Rate library', 'rates'], ['clients', 'Clients', 'building']]]); g.push(['Delivery', [['projects', 'Projects', 'projects', active]]]); g.push(['', [['settings', 'Settings', 'keys']]]); return g; }
    var sales = [['clients', 'Clients', 'building'], ['quotes', 'Quotes', 'quotes', openQ]];
    if (r === 'owner') { var apN = MR.approvalItems ? MR.approvalItems().pend.length : review; sales.push(['approvals', 'Approvals', 'approve', apN, apN > 0]); }
    if (can('rates.view')) sales.push(['rates', 'Rate library', 'rates']);
    var del = [['projects', 'Projects', 'projects', active], ['site', 'Site & snags', 'helmet', openSn], ['bids', 'Vendor bids', 'vendor', bidN, bidN > 0], ['pos', 'Purchase orders', 'truck', pend], ['vendors', 'Vendors', 'building']];
    var colN = MR.collectQueue ? MR.collectQueue().filter(function (x) { return !x.done && x.st.key === 'overdue'; }).length : 0;
    var fin = [['collect', 'Collections', 'phone', colN, colN > 0], ['invoices', 'Invoices', 'invoice'], ['payments', 'Payments', 'pay'], ['receivables', 'Receivables', 'ageing']];
    if (r === 'accounts') { g.push(['Finance', fin]); g.push(['Sales', sales]); g.push(['Delivery', del]); }
    else { g.push(['CRM & design', crm]); g.push(['Sales', sales]); g.push(['Delivery', del]); if (can('finance.view')) g.push(['Finance', fin]); }
    var ins = []; if (can('reports.view')) ins.push(['reports', 'Reports', 'reports']); if (r === 'owner') ins.push(['audit', 'Audit log', 'audit']);
    ins.push(['settings', 'Settings', 'keys']);
    if (ins.length) g.push(['Insights', ins]);
    return g;
  }
  function navHtml(active) {
    return navModel().map(function (grp) {
      return (grp[0] ? '<h4>' + esc(grp[0]) + '</h4>' : '') + grp[1].map(function (it) {
        var cur = active === it[0];
        return '<a href="#/' + it[0] + '"' + (cur ? ' aria-current="page"' : '') + '>' + ic(it[2]) + '<span>' + esc(it[1]) + '</span>' + (it[3] ? '<span class="ct' + (it[4] ? ' hot' : '') + '">' + it[3] + '</span>' : '') + '</a>';
      }).join('');
    }).join('');
  }
  function tabbarHtml(active) {
    var r = MR.S.role;
    if (r === 'client') return '';
    if (r !== 'site') {
      var T = { owner: [['', 'Home', 'home'], ['leads', 'Leads', 'clients'], 0, ['collect', 'Money', 'pay'], 1],
        pm: [['', 'Home', 'home'], ['leads', 'Leads', 'clients'], 0, ['projects', 'Projects', 'projects'], 1],
        design: [['', 'Home', 'home'], ['design', 'Boards', 'eye'], 0, ['leads', 'Leads', 'clients'], 1],
        accounts: [['', 'Home', 'home'], ['collect', 'Collect', 'pay'], 0, ['invoices', 'Invoices', 'invoice'], 1] }[r] || [];
      var cur = active === 'home' ? '' : active;
      return T.map(function (x) {
        if (x === 0) return '<button type="button" class="fab" data-act="new-menu" aria-haspopup="menu" aria-label="Create new">' + ic('plus') + '<span>New</span></button>';
        if (x === 1) return '<button type="button" data-act="toggle-side" aria-controls="side">' + ic('more') + '<span>More</span></button>';
        return '<a href="#/' + x[0] + '"' + (cur === x[0] ? ' aria-current="page"' : '') + '>' + ic(x[2]) + '<span>' + x[1] + '</span></a>';
      }).join('');
    }
    var t = [['site', 'Today', 'helmet'], ['log/new', 'Log', 'camera', 1], ['snags', 'Snags', 'snag'], ['deliveries', 'Deliveries', 'truck']];
    return t.map(function (x) { return '<a href="#/' + x[0] + '"' + (x[3] ? ' class="fab"' : '') + (active === x[0] ? ' aria-current="page"' : '') + '>' + ic(x[2]) + '<span>' + x[1] + '</span></a>'; }).join('');
  }
  MR.home = function () { return MR.S.role === 'site' ? '#/site' : MR.S.role === 'client' ? '#/portal' : '#/'; };

  /* ---------------- routing ---------------- */
  function parse() {
    var raw = location.hash.replace(/^#\/?/, ''), path = raw.split('?')[0], qs = {};
    (raw.split('?')[1] || '').split('&').forEach(function (kv) { if (!kv) return; var p = kv.split('='); qs[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); });
    return { raw: raw, path: path, p: path.split('/').filter(Boolean), qs: qs };
  }
  MR.route = parse;
  MR.go = function (hash) { if (location.hash === hash) MR.render(); else location.hash = hash; };
  MR.setQS = function (k, v) {
    var r = parse(); if (v == null || v === '') delete r.qs[k]; else r.qs[k] = v;
    var q = Object.keys(r.qs).map(function (x) { return encodeURIComponent(x) + '=' + encodeURIComponent(r.qs[x]); }).join('&');
    history.replaceState(null, '', '#/' + r.path + (q ? '?' + q : '')); MR.render();
  };

  var ACCESS = {
    rates: 'rates.view', approvals: 'owner', audit: 'owner', invoices: 'finance.view', invoice: 'finance.view', collect: 'finance.view', payments: 'finance.view', receivables: 'finance.view', reports: 'reports.view',
    clients: 'notsite', client: 'notsite', quotes: 'notsite', quote: 'notsite', vendors: 'notsite',
    leads: 'crm', lead: 'crm', calls: 'crm', design: 'crm', board: 'crm', bids: 'bids', bid: 'bids', settings: 'staff'
  };
  function allowed(k) {
    if (MR.S.role === 'client') return k === 'portal';
    var a = ACCESS[k]; if (!a) return true;
    if (a === 'owner') return MR.S.role === 'owner';
    if (MR.S.role === 'client') return false;
    if (a === 'notsite') return MR.S.role !== 'site';
    if (a === 'crm') return ['owner', 'pm', 'design'].indexOf(MR.S.role) > -1;
    if (a === 'bids') return ['owner', 'pm', 'accounts'].indexOf(MR.S.role) > -1;
    if (a === 'staff') return true;
    return MR.can(a);
  }
  function noAccess(k) {
    var role = MR.ROLES[MR.S.role].label;
    return '<div class="page narrow">' + MR.empty('lock', 'Not available to ' + role + 's', 'This part of Studio OS is hidden for your role. Switch role from the bottom of the sidebar to see it the way ' + (k === 'audit' || k === 'approvals' ? 'the owner' : 'accounts or the owner') + ' does.', '<button type="button" class="btn" data-act="role-menu">' + ic('user') + '<span>Switch role</span></button>') + '</div>';
  }
  MR.notFound = function (msg) { return '<div class="page narrow"><div class="nf"><h1 tabindex="-1">Not found</h1><p class="muted" style="margin-bottom:16px">' + esc(msg || 'That page does not exist.') + '</p><a class="btn" href="' + MR.home() + '">Back home</a></div></div>'; };

  var lastPath = null, seenSk = {}, renderSeq = 0;
  var SKEL = { quotes: 1, clients: 1, projects: 1, invoices: 1, payments: 1, pos: 1, reports: 1, audit: 1, rates: 1, receivables: 1, vendors: 1 };
  MR.render = function (opts) {
    opts = opts || {};
    var r = parse(), k = r.p[0] || (MR.S.role === 'site' ? 'site' : MR.S.role === 'client' ? 'portal' : 'home');
    if (k === 'home' && MR.S.role === 'site' && !r.p.length) k = 'site';
    var portal = k === 'q' || k === 'c' || k === 'd' || k === 'portal';
    var res;
    var keepY = !opts.nav && r.path === lastPath ? window.scrollY : 0;
    var focusId = !opts.nav && r.path === lastPath && document.activeElement && main.contains(document.activeElement) ? document.activeElement.id : null;
    try {
      if (!portal && !allowed(k)) res = { html: noAccess(k), title: 'No access', crumbs: [['No access']], nav: k };
      else if (MR.views[k]) res = MR.views[k](r);
      else if (!MR.restReady) {
        MR.loadRest().then(function () { MR.render(opts); }, function () { MR.toast('This page did not load. Check the connection and try again.', { kind: 'bad' }); });
        if (document.getElementById('shell')) return;   // keep the static shell on screen while the views arrive
        res = { html: MR.skeleton(8), title: 'Loading', crumbs: [['Loading…']], nav: k };
      }
      else res = { html: MR.notFound(), title: 'Not found', crumbs: [['Not found']] };
    } catch (e) {
      if (window.console) console.error(e);
      res = { html: MR.notFound('Something went wrong drawing this page. If it keeps happening, choose Start fresh in the sidebar.'), title: 'Error', crumbs: [['Error']] };
    }
    document.body.classList.toggle('portal', portal);
    document.body.className = document.body.className.replace(/\brole-\w+/g, '').trim() + ' role-' + MR.S.role;
    navEl.innerHTML = navHtml(res.nav != null ? res.nav : k === 'home' ? '' : k);
    var tb = document.getElementById('tabbar'); tb.innerHTML = portal ? '' : tabbarHtml(res.tab || k); tb.setAttribute('aria-label', MR.S.role === 'site' ? 'Site engineer' : 'Main'); document.body.classList.toggle('has-tabs', !!tb.innerHTML);
    crumbsEl.innerHTML = (res.crumbs || []).map(function (c, i, a) { return (i ? '<span class="sep">/</span>' : '') + (c[1] && i < a.length - 1 ? '<a href="' + c[1] + '">' + esc(c[0]) + '</a>' : '<b>' + esc(c[0]) + '</b>'); }).join('');
    renderMe(); renderBell();
    var newBtn = document.getElementById('topNew');
    var na = res.primary === false ? null : (res.primary || defaultPrimary());
    newBtn.hidden = MR.S.role === 'client'; newBtn.dataset.act = 'new-menu'; newBtn.querySelector('.lb').textContent = 'New'; newBtn.setAttribute('aria-label', 'Create new (C)'); newBtn.setAttribute('aria-haspopup', 'menu');
    var changed = r.path !== lastPath;
    var doSkel = changed && SKEL[k] && !seenSk[k] && !MR.still();
    var mySeq = ++renderSeq;
    function paint() {
      if (mySeq !== renderSeq) return;
      var keep = main.querySelector('[data-keep]');
      main.innerHTML = res.html;
      if (keep) { var nk = main.querySelector('[data-keep="' + keep.getAttribute('data-keep') + '"]'); if (nk) { if (keep.innerHTML !== nk.innerHTML) keep.innerHTML = nk.innerHTML; if (keep.className !== nk.className) keep.className = nk.className; keep.removeAttribute('aria-busy'); nk.parentNode.replaceChild(keep, nk); } }
      document.title = (res.title || 'Studio OS') + ' · ' + MR.studio() + ' Studio OS';
      if (changed) {
        if (lastPath !== null) window.scrollTo(0, 0);
        var h = main.querySelector('h1'); if (h && lastPath !== null) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
        closeSide(true);
      } else { window.scrollTo(0, keepY); if (focusId) { var f = document.getElementById(focusId); if (f) f.focus({ preventScroll: true }); } }
      lastPath = r.path;
      if (res.after) try { res.after(main, changed); } catch (e) { if (window.console) console.error(e); }
      MR.emit('rendered', { k: k, changed: changed });
    }
    if (doSkel) {
      seenSk[k] = 1; main.innerHTML = MR.skeleton(9); setTimeout(paint, 260);
    } else if (changed && lastPath !== null && document.startViewTransition && !MR.still() && !opts.instant) {
      var vt = document.startViewTransition(paint); ['ready', 'finished', 'updateCallbackDone'].forEach(function (k) { if (vt[k]) vt[k].catch(function () {}); });
    } else paint();
  };
  var NEWM = { lead: ['new-lead', 'Lead', 'clients', 'crm'], quote: ['new-quote', 'Quote', 'quotes', 'quote.edit'], client: ['new-client', 'Client', 'building', 'client.edit'], bid: ['bid-new', 'Vendor bid request', 'vendor', 'bid.edit'], po: ['new-po', 'Purchase order', 'truck', 'proc.edit'], log: ['new-log', 'Daily log', 'camera', 'site.log'], snag: ['new-snag', 'Snag', 'snag', 'snag.raise'], pay: ['record-payment', 'Payment received', 'pay', 'finance.edit'] };
  MR.act['new-menu'] = function (el) {
    var items = Object.keys(NEWM).map(function (k) { return NEWM[k]; }).filter(function (x) { return x[3] === 'crm' ? ['owner', 'pm', 'design'].indexOf(MR.S.role) > -1 : MR.can(x[3]); });
    MR.menu(el, '<div class="mh">Create</div>' + items.map(function (x) { return '<button type="button" data-act="' + x[0] + '">' + ic(x[2]) + '<span>' + x[1] + '</span></button>'; }).join(''), { right: true });
  };
  MR.act['new-log'] = function () { MR.closeMenu(); MR.go('#/log/new'); };
  function defaultPrimary() {
    var r = MR.S.role;
    if (r === 'site') return ['new-log', 'New daily log'];
    if (r === 'accounts') return ['record-payment', 'Record payment'];
    return ['new-quote', 'New quote'];
  }

  /* ---------------- me / role ---------------- */
  function renderMe() {
    var me = MR.me(), el = document.getElementById('me');
    el.innerHTML = MR.avatar(me.id, 'lg') + '<span class="who"><b>' + esc(me.name) + '</b><small>' + esc(MR.ROLES[MR.S.role].label) + ' · switch role</small></span>' + ic('chev');
  }
  MR.setRole = function (role) {
    if (!MR.ROLES[role] || MR.S.role === role) return;
    MR.S.role = role; MR.save(); MR.prefs.role = role; MR.savePrefs();
    var me = MR.me();
    MR.toast('You are now ' + me.name + ', ' + MR.ROLES[role].label.toLowerCase() + '. The interface follows.');
    var k = parse().p[0] || 'home';
    if (role === 'client') { MR.go('#/portal'); MR.render({ nav: true }); return; }
    if (role === 'site' && ['site', 'logs', 'log', 'snags', 'deliveries', 'projects', 'project', 'q', 'c'].indexOf(k) < 0) { MR.go('#/site'); return; }
    if (k === 'portal') { MR.go(MR.home()); return; }
    if (!allowed(k)) { MR.go(MR.home()); return; }
    if (role !== 'site' && k === 'site' && !parse().p.length) { MR.go('#/'); return; }
    MR.render({ nav: true });
  };
  MR.act['role-menu'] = function (el) {
    var btn = el.closest('button') || el;
    var html = '<div class="mh">View Studio OS as</div>' + Object.keys(MR.ROLES).map(function (k) {
      var u2 = MR.userById(MR.ROLES[k].who);
      return '<button type="button" data-act="set-role" data-id="' + k + '"' + (MR.S.role === k ? ' class="on"' : '') + '>' + MR.avatar(u2.id) + '<span><b style="font-weight:550">' + esc(MR.ROLES[k].label) + '</b> <span class="faint">· ' + esc(u2.name.split(' ')[0]) + '</span></span></button>';
    }).join('') + '<hr><button type="button" data-act="tour">' + ic('spark') + '<span>Take the tour</span></button><button type="button" data-act="shortcuts">' + ic('keys') + '<span>Keyboard shortcuts</span></button><button type="button" data-act="reset">' + ic('reset') + '<span>Start fresh</span></button>';
    MR.menu(btn, html, { up: btn.id === 'me' });
  };
  MR.act['set-role'] = function (el) { closeMenu(); MR.setRole(el.dataset.id); };

  /* ---------------- popover menus ---------------- */
  var menuEl = null, menuFor = null;
  MR.menu = function (anchor, html, opt) {
    opt = opt || {};
    if (menuEl && menuFor === anchor) { closeMenu(); return; }
    closeMenu();
    menuEl = document.createElement('div'); menuEl.className = 'menu ' + (opt.cls || ''); menuEl.setAttribute('role', 'menu'); menuEl.innerHTML = html;
    document.body.appendChild(menuEl); menuFor = anchor;
    var r = anchor.getBoundingClientRect(), mw = menuEl.offsetWidth, mh = menuEl.offsetHeight;
    var left = Math.min(Math.max(8, opt.right ? r.right - mw : r.left), innerWidth - mw - 8);
    var top = opt.up ? r.top - mh - 6 : r.bottom + 6;
    if (!opt.up && top + mh > innerHeight - 8) top = Math.max(8, r.top - mh - 6);
    menuEl.style.left = left + window.scrollX + 'px'; menuEl.style.top = Math.max(8, top) + window.scrollY + 'px';
    var f = menuEl.querySelector('button,a'); if (f) f.focus({ preventScroll: true });
    anchor.setAttribute('aria-expanded', 'true');
  };
  function closeMenu() { if (menuEl) { menuEl.remove(); if (menuFor) menuFor.setAttribute('aria-expanded', 'false'); menuEl = null; menuFor = null; } }
  MR.closeMenu = closeMenu;

  /* ---------------- notifications ---------------- */
  function renderBell() {
    var n = MR.unread(), b = document.getElementById('bell');
    b.innerHTML = ic('bell') + (n ? '<span class="dot" aria-hidden="true"></span>' : '');
    b.setAttribute('aria-label', 'Notifications' + (n ? ', ' + n + ' unread' : ''));
  }
  MR.on('notifs', renderBell);
  var NK = { approve: ['approve', 'violet'], warn: ['flag', 'warn'], bad: ['snag', 'bad'], ok: ['check', 'ok'], comment: ['comment', 'info'], info: ['bell', 'info'] };
  MR.act.bell = function (el) {
    var r = MR.S.role, list = MR.myNotifs().slice(0, 14);
    var html = '<div class="nh"><b>Notifications</b>' + (MR.unread() ? '<button type="button" class="btn ghost sm" data-act="notif-read" style="width:auto;height:28px">Mark all read</button>' : '<span class="faint" style="font-size:12px">All caught up</span>') + '</div><ul>' + (list.length ? list.map(function (n) {
      var k = NK[n.kind] || NK.info;
      return '<li><a href="' + esc(n.href || '#/') + '" data-act="notif-open" data-id="' + n.id + '" class="' + (n.read.indexOf(r) < 0 ? 'unread' : '') + '"><span class="inbox"><span class="ii ' + k[1] + '">' + ic(k[0]) + '</span></span><span><span class="nt">' + esc(n.text) + '</span><br><span class="nw">' + u.rel(n.at) + '</span></span></a></li>';
    }).join('') : '<li class="pal-empty">Nothing yet. Approvals, overdue invoices and client comments land here.</li>') + '</ul>';
    MR.menu(el, html, { cls: 'notif', right: true });
  };
  MR.act['notif-read'] = function () { var r = MR.S.role; MR.myNotifs().forEach(function (n) { if (n.read.indexOf(r) < 0) n.read.push(r); }); MR.save(); closeMenu(); renderBell(); MR.toast('All notifications marked read'); };
  MR.act['notif-open'] = function (el, ev) { var n = MR.find(MR.S.notifs, el.dataset.id); if (n && n.read.indexOf(MR.S.role) < 0) { n.read.push(MR.S.role); MR.save(); } closeMenu(); renderBell(); };

  /* ---------------- palette ---------------- */
  var PAL = { items: [], sel: 0 };
  function palItems(term) {
    var S = MR.S, out = [], t = term.trim().toLowerCase(), toks = t.split(/\s+/).filter(Boolean), r = S.role;
    function m(s) { s = s.toLowerCase(); return toks.every(function (x) { return s.indexOf(x) > -1; }); }
    function add(group, icon, label, hint, fn, extra) { if (!t || m(label + ' ' + (hint || '') + ' ' + (extra || ''))) out.push({ g: group, icon: icon, label: label, hint: hint, fn: fn }); }
    function goTo(h) { return function () { MR.go(h); }; }
    // actions
    if (r !== 'site') { add('Actions', 'plus', 'New quote', 'C', function () { MR.act['new-quote'](); }); add('Actions', 'clients', 'New client', '', function () { MR.act['new-client'](); }); }
    if (MR.can('site.log')) { add('Actions', 'camera', 'New daily log', '', goTo('#/log/new')); add('Actions', 'snag', 'Raise a snag', '', function () { MR.act['new-snag']({ dataset: {} }); }); }
    if (MR.can('finance.edit')) add('Actions', 'pay', 'Record a payment', '', function () { MR.act['record-payment']({ dataset: {} }); });
    if (MR.can('proc.edit')) add('Actions', 'truck', 'New purchase order', '', function () { MR.act['new-po']({ dataset: {} }); });
    Object.keys(MR.ROLES).forEach(function (k) { if (k !== r) add('Actions', 'user', 'Switch role to ' + MR.ROLES[k].label, MR.userById(MR.ROLES[k].who).name, function () { MR.setRole(k); }); });
    if (MR.can('finance.view')) add('Actions', 'phone', 'Start collections', 'focus mode', goTo('#/collect'));
    add('Actions', 'spark', 'Take the tour', 'quote to paid', function () { MR.act.tour(); });
    add('Actions', 'eye', 'See it as your studio', '', function () { if (window.StudioBrand) window.StudioBrand.open(); }, 'brand name colour logo your own');
    add('Actions', 'sun', 'Toggle dark theme', '', function () { MR.act.theme(); });
    add('Actions', 'keys', 'Keyboard shortcuts', '?', openShortcuts);
    add('Actions', 'undo', 'Undo last change', '⌘Z', MR.undo);
    add('Actions', 'reset', 'Start fresh', '', function () { MR.act.reset(); });
    // navigation
    navModel().forEach(function (g) { g[1].forEach(function (it) { add('Go to', it[2], it[1], '', goTo('#/' + it[0]), 'go open'); }); });
    if (!t) return out.slice(0, 14);
    // records
    var lim = 6;
    if (r !== 'site') {
      S.clients.filter(function (c) { return m(c.name + ' ' + c.contact + ' ' + c.city); }).slice(0, lim).forEach(function (c) { out.push({ g: 'Clients', icon: 'clients', label: c.name, hint: c.city, fn: goTo('#/client/' + c.id) }); });
      S.quotes.filter(function (q) { return m(q.no + ' ' + q.name + ' ' + MR.client(q.clientId).name); }).slice(0, lim).forEach(function (q) { out.push({ g: 'Quotes', icon: 'quotes', label: q.no + '  ' + q.name, hint: MR.QSTATUS[q.status][0], fn: goTo('#/quote/' + q.id) }); });
    }
    S.projects.filter(function (p) { return (r !== 'site' || p.eng === MR.me().id) && m(p.code + ' ' + p.name + ' ' + p.city); }).slice(0, lim).forEach(function (p) { out.push({ g: 'Projects', icon: 'projects', label: p.name, hint: p.code, fn: goTo('#/project/' + p.id) }); });
    if (MR.can('finance.view')) S.invoices.filter(function (iv) { return m(iv.no + ' ' + MR.client(iv.clientId).name); }).slice(0, lim).forEach(function (iv) { out.push({ g: 'Invoices', icon: 'invoice', label: iv.no + '  ' + MR.client(iv.clientId).name, hint: MR.invState(iv).label, fn: goTo('#/invoice/' + iv.id) }); });
    S.pos.filter(function (o) { return m(o.no + ' ' + MR.vendor(o.vendorId).name); }).slice(0, lim).forEach(function (o) { out.push({ g: 'Purchase orders', icon: 'truck', label: o.no + '  ' + MR.vendor(o.vendorId).name, hint: o.status, fn: goTo('#/po/' + o.id) }); });
    if (MR.can('rates.view')) S.rates.filter(function (x) { return m(x.code + ' ' + x.name + ' ' + x.cat); }).slice(0, lim).forEach(function (x) { out.push({ g: 'Rate library', icon: 'rates', label: x.code + '  ' + x.name, hint: MR.can('money.view') ? u.inr(MR.sell(x)) + '/' + x.unit : x.unit, fn: goTo('#/rates?q=' + encodeURIComponent(x.code)) }); });
    S.snags.filter(function (s) { return m(s.no + ' ' + s.title + ' ' + s.room); }).slice(0, 4).forEach(function (s) { out.push({ g: 'Snags', icon: 'snag', label: s.no + '  ' + s.title, hint: s.status, fn: function () { MR.go('#/snags'); setTimeout(function () { MR.act['open-snag']({ dataset: { id: s.id } }); }, 60); } }); });
    S.vendors.filter(function (v) { return r !== 'site' && m(v.name + ' ' + v.cat); }).slice(0, 4).forEach(function (v) { out.push({ g: 'Vendors', icon: 'vendor', label: v.name, hint: v.cat, fn: goTo('#/vendors?v=' + v.id) }); });
    return out;
  }
  function hl(text, term) {
    var s = esc(text), toks = term.trim().toLowerCase().split(/\s+/).filter(Boolean);
    toks.forEach(function (t) { var i = s.toLowerCase().indexOf(esc(t)); if (i > -1) s = s.slice(0, i) + '<mark>' + s.slice(i, i + esc(t).length) + '</mark>' + s.slice(i + esc(t).length); });
    return s;
  }
  function palRender(term) {
    PAL.items = palItems(term); PAL.sel = 0; PAL.term = term;
    var list = document.getElementById('palList'), g = null, h = '';
    if (!PAL.items.length) { list.innerHTML = '<div class="pal-empty">No matches for “' + esc(term) + '”. Try a client name, a quote number like Q-1049, or an action like “record payment”.</div>'; return; }
    PAL.items.forEach(function (it, i) {
      if (it.g !== g) { h += '<h5>' + esc(it.g) + '</h5>'; g = it.g; }
      h += '<button type="button" class="pal-it" role="option" id="po' + i + '" data-n="' + i + '" aria-selected="' + (i === 0) + '">' + ic(it.icon) + '<span class="pt">' + hl(it.label, term) + '</span>' + (it.hint ? '<span class="ph">' + esc(it.hint) + '</span>' : '') + '</button>';
    });
    list.innerHTML = h;
  }
  function palSel(n) {
    var b = document.querySelectorAll('#palList .pal-it'); if (!b.length) return;
    PAL.sel = (n + b.length) % b.length;
    b.forEach(function (x, i) { x.setAttribute('aria-selected', String(i === PAL.sel)); });
    b[PAL.sel].scrollIntoView({ block: 'nearest' });
    document.getElementById('palIn').setAttribute('aria-activedescendant', 'po' + PAL.sel);
  }
  function palRun(n) { var it = PAL.items[n]; if (!it) return; document.getElementById('pal').close(); MR.loadRest().then(function () { setTimeout(it.fn, 10); }); }
  MR.openPalette = function (prefill) {
    MR.loadRest();
    var d = document.getElementById('pal');
    d.innerHTML = '<div class="pal-in">' + ic('search') + '<input id="palIn" type="text" role="combobox" aria-expanded="true" aria-controls="palList" aria-label="Search Studio OS or run an action" placeholder="Search clients, quotes, invoices, rates, or type an action…" autocomplete="off" spellcheck="false"><span class="pal-scope">' + esc(MR.ROLES[MR.S.role].label) + '</span></div><div class="pal-list" id="palList" role="listbox"></div><div class="pal-ft"><span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div>';
    if (!d.open) d.showModal();
    var inp = document.getElementById('palIn'); inp.value = prefill || ''; palRender(inp.value); inp.focus();
    inp.addEventListener('input', function () { palRender(inp.value); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); palSel(PAL.sel + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); palSel(PAL.sel - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); palRun(PAL.sel); }
    });
    d.querySelector('#palList').addEventListener('click', function (e) { var b = e.target.closest('.pal-it'); if (b) palRun(+b.dataset.n); });
  };

  /* ---------------- shortcuts ---------------- */
  var SHORT = [['⌘ K', 'Search and command palette'], ['/', 'Search'], ['C', 'Create (new quote, log or payment for your role)'], ['G then H', 'Go home'], ['G then Q', 'Quotes'], ['G then P', 'Projects'], ['G then I', 'Invoices'], ['G then R', 'Reports'], ['G then S', 'Site & snags'], ['J / K', 'Move through rows, Enter to open'], ['⌘ Z', 'Undo the last edit'], ['⌘ P', 'Print the current document'], ['?', 'This list'], ['Esc', 'Close dialogs and menus']];
  function openShortcuts() { MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">Keyboard shortcuts</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><dl class="shortcuts">' + SHORT.map(function (s) { return '<dt>' + s[0].split(' ').map(function (k) { return k === 'then' ? '<span class="faint" style="font-size:11px">then</span>' : '<kbd>' + k + '</kbd>'; }).join('') + '</dt><dd>' + s[1] + '</dd>'; }).join('') + '</dl></div>', 'sm'); }
  MR.act.shortcuts = function () { closeMenu(); openShortcuts(); };
  MR.act.palette = function () { MR.openPalette(); };
  MR.act.reset = function () { closeMenu(); MR.confirm('Start fresh?', 'This restores the studio’s leads, clients, quotes, projects, invoices and site logs as they were, and discards your changes in this browser.', 'Start fresh', function () { MR.reset(); MR.go(MR.home()); MR.render({ nav: true }); MR.toast('Started fresh'); }, true); };
  MR.act['dlg-close'] = function (el) { var d = el.closest('dialog'); if (d) d.close(); };
  MR.act['confirm-ok'] = function () { var fn = MR._confirmFn; MR.closeDlg(); if (fn) fn(); };
  MR.act['toggle-side'] = function () { if (MOBILE.matches) { if (sideEl.classList.contains('open')) closeSide(); else openSide(); } else { MR.prefs.side = !MR.prefs.side; MR.savePrefs(); applySide(); } };
  MR.act.print = function () { window.print(); };
  MR.act.theme = function () { MR.prefs.theme = MR.prefs.theme === 'dark' ? 'light' : 'dark'; MR.savePrefs(); MR.applyTheme(); var b = document.getElementById('themeBtn'); if (b) b.setAttribute('aria-label', MR.prefs.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'); };
  MR.act.undo = function () { MR.undo(); };

  function applySide() { appEl.classList.toggle('collapsed', !!MR.prefs.side && !MOBILE.matches); }
  function openSide() { sideEl.classList.add('open'); scrim.hidden = false; var f = sideEl.querySelector('a,button'); if (f) f.focus(); }
  function closeSide() { sideEl.classList.remove('open'); scrim.hidden = true; }

  /* ---------------- tooltips ---------------- */
  var tipEl, tipT;
  function showTip(t) { var r = t.getBoundingClientRect(); tipEl.textContent = t.dataset.tip; tipEl.hidden = false; var w = tipEl.offsetWidth; tipEl.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px'; tipEl.style.top = (r.top - tipEl.offsetHeight - 8 < 40 ? r.bottom + 8 : r.top - tipEl.offsetHeight - 8) + 'px'; }

  /* ---------------- boot ---------------- */
  function boot() {
    main = document.getElementById('main'); appEl = document.getElementById('app'); sideEl = document.getElementById('side'); scrim = document.getElementById('scrim');
    navEl = document.getElementById('nav'); crumbsEl = document.getElementById('crumbs'); tipEl = document.getElementById('tip');
    MR.load();
    var asRole = /[?&]as=(owner|pm|accounts|site|design|client)\b/.exec(location.search); if (asRole && MR.S.role !== asRole[1]) { MR.S.role = asRole[1]; MR.save(true); }
    if (MR.prefs.role !== MR.S.role) { MR.prefs.role = MR.S.role; MR.savePrefs(); }
    MR.applyTheme();
    if (!location.hash && MR.S.role === 'site') history.replaceState(null, '', '#/site');
    applySide();
    MOBILE.addEventListener && MOBILE.addEventListener('change', function () { applySide(); closeSide(); });
    document.querySelectorAll('.k-mod').forEach(function (e) { e.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl '; });

    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]');
      if (menuEl && !e.target.closest('.menu') && (!t || t !== menuFor)) closeMenu();
      if (t && !t.disabled) {
        var fn = MR.act[t.dataset.act];
        if (fn) { if (t.tagName === 'A' && t.dataset.act !== 'notif-open') e.preventDefault(); fn(t, e); }
        else if (!MR.restReady) { e.preventDefault(); MR.loadRest().then(function () { var f2 = MR.act[t.dataset.act]; if (f2) f2(t, e); }); }
      }
      if (e.target.closest('.menu a')) closeMenu();
      var row = !t && e.target.closest('tr[data-href]');
      if (row && !e.target.closest('a,button,input,select,label,textarea')) { if (e.metaKey || e.ctrlKey) window.open(row.dataset.href); else MR.go(row.dataset.href); }
      if (e.target === scrim) closeSide();
    });
    // dialogs close on backdrop click
    ['dlg', 'drawer', 'pal'].forEach(function (id) { var d = document.getElementById(id); d.addEventListener('click', function (e) { if (e.target === d) d.close(); }); });
    document.addEventListener('change', function (e) { var t = e.target.closest('[data-bind]'); if (t && MR.bind[t.dataset.bind]) MR.bind[t.dataset.bind](t, e); });
    document.addEventListener('input', function (e) { var t = e.target.closest('[data-live]'); if (t && MR.live[t.dataset.live]) MR.live[t.dataset.live](t, e); });
    document.addEventListener('keydown', function (e) {
      var t = e.target, typing = /INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable;
      if (t.classList && (t.classList.contains('ed') || t.classList.contains('cell')) && e.key === 'Enter' && t.tagName === 'INPUT') { e.preventDefault(); t.blur(); return; }
      if (t.classList && (t.classList.contains('ed') || t.classList.contains('cell')) && e.key === 'Escape' && t.dataset.orig != null) { t.value = t.dataset.orig; t.blur(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); var p = document.getElementById('pal'); if (p.open) p.close(); else MR.openPalette(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey && !typing) { e.preventDefault(); MR.undo(); return; }
      if (e.key === 'Escape') { if (menuEl) { closeMenu(); return; } if (sideEl.classList.contains('open')) closeSide(); }
      if (typing || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('dialog[open]')) return;
      var k = e.key.toLowerCase();
      if (MR._g) { MR._g = false; var map = { h: MR.home(), q: '#/quotes', p: '#/projects', i: '#/invoices', r: '#/reports', s: '#/site', c: '#/clients', a: '#/approvals', l: '#/logs', m: '#/collect' }; if (map[k]) { e.preventDefault(); MR.go(map[k]); } return; }
      if (k === 'g') { MR._g = true; setTimeout(function () { MR._g = false; }, 1200); return; }
      if (e.key === '/') { e.preventDefault(); MR.openPalette(); }
      else if (e.key === '?') { e.preventDefault(); openShortcuts(); }
      else if (k === 'c') { e.preventDefault(); var b = document.getElementById('topNew'); if (!b.hidden) MR.act['new-menu'](b); }
      else if (k === 'j' || k === 'k') {
        var rows = Array.prototype.slice.call(main.querySelectorAll('tr[data-href]')); if (!rows.length) return;
        var cur = rows.indexOf(main.querySelector('tr.kb')); rows.forEach(function (x) { x.classList.remove('kb'); });
        cur = k === 'j' ? Math.min(rows.length - 1, cur + 1) : Math.max(0, cur - 1);
        rows[cur].classList.add('kb'); rows[cur].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') { var kb = main.querySelector('tr.kb'); if (kb) MR.go(kb.dataset.href); }
    });
    // inline edit: remember original value for Esc
    document.addEventListener('focusin', function (e) { var t = e.target; if (t.classList && (t.classList.contains('ed') || t.classList.contains('cell'))) t.dataset.orig = t.value; });
    document.addEventListener('mouseover', function (e) { var t = e.target.closest('[data-tip]'); if (!t) { clearTimeout(tipT); tipEl.hidden = true; return; } clearTimeout(tipT); tipT = setTimeout(function () { showTip(t); }, 350); });
    document.addEventListener('focusin', function (e) { var t = e.target.closest && e.target.closest('[data-tip]'); if (t && t.matches(':focus-visible')) showTip(t); else tipEl.hidden = true; });
    window.addEventListener('scroll', function () { tipEl.hidden = true; }, { passive: true });
    window.addEventListener('hashchange', function () { closeMenu(); ['dlg', 'drawer', 'pal'].forEach(function (id) { var d = document.getElementById(id); if (d.open) d.close(); }); MR.render({ nav: true }); });
    window.addEventListener('storage', function (e) { if (e.key === MR.KEY && e.newValue) { try { MR.S = JSON.parse(e.newValue); MR.render(); } catch (x) { /* ignore */ } } });
    MR.render({ nav: true, instant: true });
    var sh = document.getElementById('shell'); if (sh && MR.views[MR.route().p[0] || 'home']) sh.removeAttribute('aria-busy');
    var idle = window.requestIdleCallback || function (f) { setTimeout(f, 1200); };
    function warm() { idle(function () { MR.loadGsap(); if (!MR.restReady && window.MR_BOOT) { var l = document.createElement('link'); l.rel = 'prefetch'; l.as = 'script'; l.href = window.MR_BOOT.rest[0]; document.head.appendChild(l); } }); }
    // warm-up waits well past first render so GSAP and the rest-bundle prefetch never compete with the first screen
    var warmLater = function () { setTimeout(warm, 3500); };
    if (document.readyState === 'complete') warmLater(); else window.addEventListener('load', warmLater);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
