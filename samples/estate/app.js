/* Fieldwise — app shell: roles and "View as", navigation, render loop, drawer, keyboard, theme, guided tour, boot. */
(function () {
  'use strict';
  var CK = window.CK, esc = CK.esc, ic = CK.ic;

  CK.ROLE_NAME = { admin: 'Admin', manager: 'Sales manager', telecaller: 'Telecaller', field: 'Field agent', partner: 'Partner' };
  CK.ROLES = {
    admin: { as: 'A1', nav: ['today', 'inbox', 'leads', 'calling', 'trips', 'deals', 'inventory', 'projects', 'map', 'verify', 'survey', 'owners', 'import', 'print', 'web', 'seo', 'partners', 'reports', 'team', 'settings', 'audit'], can: '*' },
    manager: { as: 'A2', nav: ['today', 'inbox', 'leads', 'calling', 'trips', 'deals', 'inventory', 'projects', 'map', 'verify', 'survey', 'owners', 'import', 'print', 'web', 'seo', 'partners', 'reports', 'audit'], can: ['leads.create', 'props.create', 'props.edit', 'verify', 'trips.plan', 'trips.update', 'deals.edit'] },
    telecaller: { as: 'A3', nav: ['today', 'inbox', 'leads', 'calling', 'trips', 'inventory', 'projects', 'map', 'survey', 'owners'], can: ['leads.create', 'props.create'] },
    field: { as: 'A6', nav: ['today', 'trips', 'verify', 'survey', 'inventory', 'projects', 'map', 'deals'], can: ['props.create', 'verify', 'trips.update'] },
    partner: { as: 'A1', nav: ['partner'], can: [] }
  };
  CK.can = function (p) { var r = CK.ROLES[CK.role()]; return r.can === '*' || r.can.indexOf(p) >= 0; };
  CK.setRole = function (r) { CK.ui.role = r; CK.ui.as = CK.ROLES[r].as; if (r === 'partner') CK.ui.partner = 'PT1'; CK.saveUI(); CK.resetPlanner && CK.resetPlanner(); location.hash = r === 'partner' ? '#/partner' : '#/today'; CK.render(); CK.toast('Viewing as ' + CK.ROLE_NAME[r] + (r === 'partner' ? ' · Harpreet Singh' : ' · ' + CK.me().name), { icon: 'eye' }); };

  var NAV = [
    { g: 'Work' }, { id: 'today', label: 'Today', icon: 'home' }, { id: 'inbox', label: 'Conversations', icon: 'chat', badge: function (S) { return (S.convos || []).filter(function (c) { return c.st === 'open'; }).length; } },
    { id: 'leads', label: 'Leads', icon: 'users', badge: function (S) { return S.leads.filter(function (L) { return L.stage === 'new'; }).length; } },
    { id: 'calling', label: 'Calling', icon: 'phone' }, { id: 'trips', label: 'Trips', icon: 'route', badge: function (S) { return S.trips.filter(function (t) { return t.status === 'out'; }).length; }, live: 1 },
    { id: 'deals', label: 'Deals', icon: 'deal' },
    { g: 'Homes' }, { id: 'inventory', label: 'Inventory', icon: 'building' }, { id: 'projects', label: 'Projects & pricing', icon: 'layers' }, { id: 'map', label: 'Map', icon: 'pin' },
    { id: 'verify', label: 'Verification desk', icon: 'shield', badge: function (S) { return S.props.filter(function (p) { var v = CK.ver(p); return (v === 'pending' || v === 'overdue') && p.status !== 'let' && p.status !== 'sold'; }).length; } },
    { id: 'survey', label: 'Survey master', icon: 'target' }, { id: 'owners', label: 'Owners', icon: 'key', badge: function (S) { return S.msgs.filter(function (m) { return !m.sent; }).length; } },
    { id: 'import', label: 'Import listings', icon: 'upload' }, { id: 'print', label: 'Print listings', icon: 'print' },
    { g: 'Growth' }, { id: 'web', label: 'Website analytics', icon: 'chart' }, { id: 'seo', label: 'Search rankings', icon: 'search' }, { id: 'partners', label: 'Partners', icon: 'partner' }, { id: 'reports', label: 'Reports', icon: 'activity' },
    { g: 'Admin' }, { id: 'team', label: 'Team & roles', icon: 'users' }, { id: 'settings', label: 'Settings', icon: 'settings' }, { id: 'audit', label: 'Activity log', icon: 'list' },
    { id: 'partner', label: 'Partner portal', icon: 'partner' }
  ];
  function navHTML() {
    var S = CK.S(), allowed = CK.ROLES[CK.role()].nav, cur = CK.route().view, out = '', pendingG = null;
    NAV.forEach(function (n) {
      if (n.g) { pendingG = n.g; return; }
      if (allowed.indexOf(n.id) < 0) return;
      if (pendingG) { out += '<div class="ngrp">' + pendingG + '</div>'; pendingG = null; }
      var b = n.badge ? n.badge(S) : 0;
      out += '<a href="#/' + n.id + '" class="' + (cur === n.id ? 'on' : '') + '"' + (cur === n.id ? ' aria-current="page"' : '') + '>' + ic(n.icon, 17) + '<span>' + n.label + '</span>' + (b ? '<span class="nbadge' + (n.live ? ' is-live' : '') + '">' + b + '</span>' : '') + '</a>';
    });
    return out;
  }
  function asHTML() {
    var r = CK.role(), who = r === 'partner' ? CK.partner(CK.ui.partner || 'PT1') : CK.me();
    return '<button type="button" class="asbtn" id="asbtn" aria-haspopup="menu">' + CK.av(who) + '<span><small>View as</small><b>' + esc(CK.ROLE_NAME[r]) + '</b></span>' + ic('down', 14) + '</button>';
  }
  function bellCount() { var S = CK.S(), now = CK.now(); return S.msgs.filter(function (m) { return !m.sent; }).length + S.leads.filter(function (L) { return L.stage === 'new' && now - L.created > 15 * 6e4; }).length + S.trips.filter(function (t) { return t.status === 'out'; }).length; }

  /* ---------- render loop ---------- */
  var curView = null;
  CK.render = function () {
    var r = CK.route(), view = document.getElementById('view'); if (!view) return;
    if (CK.releaseHolds) CK.releaseHolds();
    var allowed = CK.ROLES[CK.role()].nav;
    if (r.view === 'partner' && CK.role() !== 'partner') allowed = allowed.concat(['partner']);
    var V = CK.V[r.view];
    var ae = document.activeElement, keep = ae && ae.id && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA') ? { id: ae.id, v: ae.value, s: ae.selectionStart } : null;
    if (curView && curView.unmount && curView !== V) curView.unmount();
    if (curView && curView.unmount && curView === V) curView.unmount();
    CK.keyHandler = null;
    var main = document.getElementById('main'), st = main.scrollTop, same = view.dataset.v === r.view + '/' + (r.id || '');
    var inner = document.createElement('div'); inner.className = 'vin v-' + r.view;
    if (!V && !CK.restLoaded) inner.innerHTML = '<div class="boot" aria-hidden="true"><i></i><i></i><i></i><i></i></div>';
    else if (!V) inner.innerHTML = CK.empty('Page not found', 'That address doesn’t lead anywhere.', '<a class="btn" href="#/today">Go to Today</a>');
    else if (allowed.indexOf(r.view) < 0) inner.innerHTML = CK.empty('Not part of the ' + CK.ROLE_NAME[CK.role()] + ' view', 'Each role sees only what it needs. Switch “View as” in the sidebar to open this.', '<a class="btn" href="#/' + allowed[0] + '">Go to ' + esc((NAV.filter(function (n) { return n.id === allowed[0]; })[0] || {}).label || 'start') + '</a>');
    else inner.innerHTML = V.render(r);
    view.replaceChildren(inner); view.dataset.v = r.view + '/' + (r.id || '');
    if (V && allowed.indexOf(r.view) >= 0 && V.mount) V.mount(inner, r);
    curView = V;
    main.scrollTop = same ? st : 0;
    document.getElementById('nav').innerHTML = navHTML();
    document.getElementById('as').innerHTML = asHTML();
    var t = V ? V.title : 'Fieldwise'; document.getElementById('crumb').textContent = t; document.title = t + ' · Amaltas Estates · Fieldwise';
    var bc = bellCount(), bb = document.getElementById('bell-n'); bb.textContent = bc > 9 ? '9+' : bc; bb.hidden = !bc;
    CK.renderDrawer();
    if (keep) { var el = document.getElementById(keep.id); if (el && el !== document.activeElement) { el.value = keep.v; el.focus(); try { el.setSelectionRange(keep.s, keep.s); } catch (e) { } } }
  };

  /* ---------- drawer ---------- */
  var drawerKey = null;
  CK.renderDrawer = function () {
    var r = CK.route(), dw = document.getElementById('drawer'), panel = document.getElementById('drawer-p');
    if (!r.peek || !CK.D[r.peek.kind]) { if (dw.classList.contains('on')) { dw.classList.remove('on'); setTimeout(function () { if (!dw.classList.contains('on')) { dw.hidden = true; panel.innerHTML = ''; } }, 220); if (drawerKey && CK.lastOpener && document.contains(CK.lastOpener)) CK.lastOpener.focus(); } drawerKey = null; return; }
    var key = r.peek.kind + ':' + r.peek.id, sc = panel.scrollTop, first = key !== drawerKey;
    panel.innerHTML = CK.D[r.peek.kind].render(r.peek.id);
    if (CK.D[r.peek.kind].mount) CK.D[r.peek.kind].mount(panel, r.peek.id);
    panel.scrollTop = first ? 0 : sc;
    if (first) { dw.hidden = false; requestAnimationFrame(function () { dw.classList.add('on'); var h = panel.querySelector('h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }); }
    drawerKey = key;
  };
  CK.closeDrawer = function () { CK.peek(null); };

  /* ---------- theme ---------- */
  function applyTheme() { var t = CK.ui.theme || 'light'; document.documentElement.dataset.theme = t; var b = document.getElementById('theme-b'); if (b) { b.innerHTML = ic(t === 'dark' ? 'sun' : 'moon', 17) + '<span>' + (t === 'dark' ? 'Light theme' : 'Dark theme') + '</span>'; } }
  CK.toggleTheme = function () { CK.ui.theme = (CK.ui.theme === 'dark' ? 'light' : 'dark'); CK.saveUI(); applyTheme(); };

  /* ---------- guided tour ---------- */
  var TOUR = [
    { go: '#/today', at: '[data-tour="newleads"]', t: 'Every role starts on Today', b: 'It says what to do next: calls due, trips out, listings to verify, deals waiting on papers. Ananya Iyer messaged on WhatsApp at 10:02; she was assigned to Pooja and a 15-minute first-call clock started.' },
    { go: 'lead', at: '[data-tour="matches"]', t: 'Her brief is matched to every verified home', b: 'Budget is a band (±10% fits), areas and move-in date count, and owner preferences lower a score but never hide a home. Each match says why.' },
    { go: 'pick', at: '[data-tour="plantrip"]', t: 'Pick homes, plan a trip', b: 'Three homes are picked. One click carries them, and Ananya, into the trip planner.' },
    { go: 'plan', at: '[data-tour="tripmap"]', t: 'Route, drive times, one tap to the agent’s phone', b: 'Stops are ordered to cut driving, each leg shows minutes, and owners get a heads-up. The agent sees it in the field app.' },
    { go: 'trip', at: '.trip-map', t: 'Trip out now', b: 'The trip turns “Out now” when the first stop is checked in. Results land stop by stop: liked, shortlisted or rejected with a reason, and the owner gets the feedback on WhatsApp.' },
    { go: '#/deals', at: '[data-tour="deals"]', t: 'From shortlist to move-in', b: 'Token blocks the home, the document checklist (KYC, police verification) gates closing, and the commission split and collections are tracked to the rupee.' }
  ];
  CK.tour = function (i) {
    var host = document.getElementById('tour'); var S = CK.S(); var L = S.leads[0];
    if (i >= TOUR.length || i < 0) { host.hidden = true; host.innerHTML = ''; CK.ui.toured = 1; CK.saveUI(); if (i >= TOUR.length) CK.toast('That’s the core loop. ⌘K finds anything.', { icon: 'sparkles' }); return; }
    if (CK.role() !== 'admin') { CK.ui.role = 'admin'; CK.ui.as = 'A1'; CK.saveUI(); }
    var s = TOUR[i];
    if (s.go === 'lead') { CK.peekTab = 'matches'; location.hash = '#/leads~lead:' + L.id; }
    else if (s.go === 'pick') { location.hash = '#/leads~lead:' + L.id; setTimeout(function () { var bs = document.querySelectorAll('#drawer [data-pick]'); [0, 1, 2].forEach(function (k) { if (bs[k] && !bs[k].classList.contains('on')) bs[k].click(); }); }, 60); }
    else if (s.go === 'plan') { CK.resetPlanner && CK.resetPlanner(); CK.ui.plan = { leads: [L.id], pids: CK.matches(L).slice(0, 3).map(function (m) { return m.p.id; }), r: 'sd' }; CK.saveUI(); location.hash = '#/trips/new'; }
    else if (s.go === 'trip') location.hash = '#/trips/' + (S.focusTrip || S.trips[0].id);
    else location.hash = s.go;
    host.hidden = false;
    setTimeout(function () { place(i); }, 320);
  };
  function place(i) {
    var s = TOUR[i], host = document.getElementById('tour'), a = document.querySelector(s.at);
    var r = a ? a.getBoundingClientRect() : { left: innerWidth / 2 - 100, top: 120, width: 200, height: 60, right: innerWidth / 2 + 100, bottom: 180 };
    if (a && (r.top < 60 || r.bottom > innerHeight)) { a.scrollIntoView({ block: 'center' }); r = a.getBoundingClientRect(); }
    var pad = 6, w = Math.min(340, innerWidth - 32);
    var left = Math.min(Math.max(16, r.left), innerWidth - w - 16), top = r.bottom + 14;
    if (top + 220 > innerHeight) top = Math.max(16, r.top - 230);
    host.innerHTML = '<div class="tour-ring" style="left:' + (r.left - pad) + 'px;top:' + (r.top - pad) + 'px;width:' + (r.width + pad * 2) + 'px;height:' + (r.height + pad * 2) + 'px"></div><div class="tour-card" role="dialog" aria-labelledby="tour-t" style="left:' + left + 'px;top:' + top + 'px;width:' + w + 'px"><p class="muted xs">Step ' + (i + 1) + ' of ' + TOUR.length + '</p><h2 id="tour-t">' + esc(s.t) + '</h2><p>' + esc(s.b) + '</p><div class="tour-a"><button type="button" class="btn ghost sm" data-tour-x>Skip tour</button><span class="grow"></span>' + (i ? '<button type="button" class="btn sm" data-tour-go="' + (i - 1) + '">Back</button>' : '') + '<button type="button" class="btn primary sm" data-tour-go="' + (i + 1) + '">' + (i === TOUR.length - 1 ? 'Finish' : 'Next') + '</button></div><div class="tour-dots" aria-hidden="true">' + TOUR.map(function (x, k) { return '<i class="' + (k === i ? 'on' : '') + '"></i>'; }).join('') + '</div></div>';
    var nb = host.querySelector('[data-tour-go="' + (i + 1) + '"]'); if (nb) nb.focus();
  }

  /* ---------- notifications ---------- */
  function bellMenu(btn) {
    var S = CK.S(), now = CK.now(), items = [];
    S.msgs.filter(function (m) { return !m.sent; }).slice(0, 4).forEach(function (m) { items.push({ label: 'Owner feedback ready · ' + CK.prop(m.pid).code, hint: CK.ago(m.at), icon: 'chat', go: '#/owners' }); });
    S.trips.filter(function (t) { return t.status === 'out'; }).forEach(function (t) { items.push({ label: CK.agent(t.agent).name.split(' ')[0] + ' is out · ' + (t.feed[0] || {}).text, hint: CK.ago((t.feed[0] || {}).at || now), icon: 'route', go: '#/trips/' + t.id }); });
    S.leads.filter(function (L) { return L.stage === 'new'; }).slice(0, 3).forEach(function (L) { items.push({ label: 'New lead · ' + L.name + ' (' + L.src + ')', hint: CK.ago(L.created), icon: 'sparkles', go: '#/leads~lead:' + L.id }); });
    CK.menu(btn, [{ head: 'Notifications' }].concat(items.length ? items : [{ label: 'All caught up', icon: 'check' }]), function (it) { if (it.go) location.hash = it.go; });
  }

  /* ---------- boot ---------- */
  function boot() {
    CK.load();
    if (!CK.ui.role) { CK.ui.role = 'admin'; CK.ui.as = 'A1'; }
    applyTheme();
    var S = CK.S();
    document.getElementById('brand-sub').textContent = 'Fieldwise · ' + S.agents.length + ' people';
    CK.on(function (what) { clearTimeout(CK._rt); CK._rt = setTimeout(CK.render, what === 'sync' ? 0 : 10); });
    addEventListener('hashchange', function () { CK.closeMenu(); var sb = document.getElementById('side'); sb.classList.remove('open'); CK.render(); });

    document.addEventListener('click', function (e) {
      var pk = e.target.closest('[data-peek]');
      if (pk) { e.preventDefault(); var k = pk.dataset.peek.split(':'); CK.lastOpener = pk; if (pk.dataset.tab) CK.peekTab = pk.dataset.tab; CK.peek(k[0], k[1]); return; }
      if (e.target.closest('[data-close-drawer]') || e.target.matches('.drawer-bg')) { CK.closeDrawer(); return; }
      if (e.target.closest('[data-close-modal]')) { CK.closeModal(); return; }
      var a = e.target.closest('[data-act]');
      if (a) { var act = a.dataset.act; if (act === 'new-lead') CK.newLeadForm(); if (act === 'new-prop') CK.newPropForm(); if (act === 'palette') CK.palette(); if (act === 'theme') CK.toggleTheme(); if (act === 'tour') CK.tour(0); if (act === 'menu') document.getElementById('side').classList.toggle('open'); if (act === 'bell') bellMenu(a); if (act === 'new') CK.menu(a, [{ label: 'New lead', icon: 'users', id: 'l' }, { label: 'New listing', icon: 'building', id: 'p' }, { label: 'Plan a trip', icon: 'route', id: 't' }], function (it) { if (it.id === 'l') CK.newLeadForm(); if (it.id === 'p') CK.newPropForm(); if (it.id === 't') { CK.resetPlanner && CK.resetPlanner(); location.hash = '#/trips/new'; } }); }
      if (e.target.closest('#asbtn')) CK.menu(e.target.closest('#asbtn'), [{ head: 'View as — what each role sees' }].concat(['admin', 'manager', 'telecaller', 'field', 'partner'].map(function (r) { var who = r === 'partner' ? 'Harpreet Singh' : CK.agent(CK.ROLES[r].as).name; return { label: CK.ROLE_NAME[r], hint: who, id: r, on: CK.role() === r, icon: { admin: 'settings', manager: 'chart', telecaller: 'phone', field: 'route', partner: 'partner' }[r] }; })), function (it) { CK.setRole(it.id); });
      var tg = e.target.closest('[data-tour-go]'); if (tg) CK.tour(+tg.dataset.tourGo);
      if (e.target.closest('[data-tour-x]')) CK.tour(-1);
      if (e.target.closest('[data-welcome="go"]')) { document.getElementById('welcome').remove(); CK.tour(0); }
      if (e.target.closest('[data-welcome="skip"]')) { document.getElementById('welcome').remove(); CK.ui.toured = 1; CK.saveUI(); }
    });
    var gKey = 0;
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); CK.palette(); return; }
      if (e.key === 'Escape') { if (document.getElementById('menu')) { CK.closeMenu(); return; } if (document.getElementById('modal')) { CK.closeModal(); return; } if (!document.getElementById('tour').hidden) { CK.tour(-1); return; } if (CK.route().peek) { CK.closeDrawer(); return; } document.getElementById('side').classList.remove('open'); }
      if (document.getElementById('modal')) {
        if (e.key === 'Tab') { var m = document.querySelector('#modal .modal'), f = m.querySelectorAll('button,input,select,textarea,a[href]'); if (f.length) { var first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } } }
        return;
      }
      if (e.target.closest('input,textarea,select,[contenteditable]')) return;
      if (CK.keyHandler) { CK.keyHandler(e); if (e.defaultPrevented) return; }
      if (e.key === '/') { var s = document.querySelector('#view .search input'); if (s) { e.preventDefault(); s.focus(); } return; }
      if (e.key === '?') { CK.modal('<h2 id="modal-t">Keyboard</h2><dl class="keys"><div><dt><kbd>⌘</kbd><kbd>K</kbd></dt><dd>Search and commands</dd></div><div><dt><kbd>/</kbd></dt><dd>Filter the current list</dd></div><div><dt><kbd>G</kbd> then <kbd>T</kbd> <kbd>L</kbd> <kbd>C</kbd> <kbd>I</kbd> <kbd>V</kbd> <kbd>D</kbd></dt><dd>Today, Leads, Calling, Inventory, Verification, Deals</dd></div><div><dt><kbd>1</kbd>–<kbd>6</kbd>, <kbd>N</kbd></dt><dd>In call mode: outcome, save and next</dd></div><div><dt><kbd>Esc</kbd></dt><dd>Close a panel</dd></div></dl><div class="m-actions"><button type="button" class="btn" data-close-modal>Close</button></div>'); return; }
      if (e.key === 'g') { gKey = Date.now(); return; }
      if (Date.now() - gKey < 900) { var map = { t: 'today', l: 'leads', c: 'calling', i: 'inventory', v: 'verify', d: 'deals', r: 'reports', p: 'trips' }; if (map[e.key]) { location.hash = '#/' + map[e.key]; gKey = 0; } }
    });
    addEventListener('resize', function () { var host = document.getElementById('tour'); if (!host.hidden) { var dots = host.querySelectorAll('.tour-dots i'); dots.forEach(function (d, k) { if (d.classList.contains('on')) place(k); }); } });
    if (!location.hash) location.replace(CK.role() === 'partner' ? '#/partner' : '#/today');
    CK.render();
    document.documentElement.classList.add('ready');
    // the rest of the views load after the first screen has painted
    if (CK.V.inventory) { CK.restLoaded = true; if (CK.ensure) { CK.ensure(); CK.syncBridges(); CK.render(); } }
    else { var rs = document.createElement('script'); rs.src = 'app-rest.min.js?v=10'; rs.onload = function () { CK.restLoaded = true; if (CK.ensure) { CK.ensure(); CK.syncBridges(); } CK.render(); }; setTimeout(function () { document.head.appendChild(rs); }, 0); }
    if (!CK.ui.toured) {
      var w = document.createElement('div'); w.id = 'welcome'; w.className = 'welcome'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-labelledby', 'wl-t');
      w.innerHTML = '<p class="muted xs">Welcome to Fieldwise</p><h2 id="wl-t">See a lead become a deal in six steps.</h2><p class="sm">Lead → matched homes → trip → visit outcome → deal. About a minute.</p><div class="btnrow"><button type="button" class="btn primary sm" data-welcome="go">' + ic('sparkles', 14) + 'Take the tour</button><button type="button" class="btn ghost sm" data-welcome="skip">Skip</button></div>';
      document.body.appendChild(w);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
