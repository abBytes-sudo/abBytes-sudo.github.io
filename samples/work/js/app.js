/* Ordwell — app shell: router, sidebar, top bar, white-label branding, theme, view-as, timer, command palette,
   keyboard shortcuts, new-task dialog. Pages register themselves in OW.routes. */
(function () {
  'use strict';
  var OW = window.OW, UI = OW.UI, Q = OW.Q, D = OW.D, I = UI.I, esc = UI.esc, store = OW.store;
  var app = OW.app = { route: { name: 'home', args: [] }, vstate: {}, collapsed: {} };
  OW.routes = {};
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* ---------- branding ---------- */
  app.applyBrand = function () {
    var S = store.S, b = S.brand, root = document.documentElement;
    root.style.setProperty('--accent', b.accent);
    root.style.setProperty('--on-accent', UI.contrastOn(b.accent));
    root.setAttribute('data-theme', S.prefs.theme === 'dark' ? 'dark' : 'light');
    var ws = OW.byId(S.workspaces, S.ws);
    var logo = b.logo ? '<img src="' + esc(b.logo) + '" alt="">' : esc((b.name || 'O').trim().charAt(0).toUpperCase());
    document.querySelectorAll('[data-brand-logo]').forEach(function (el) { el.innerHTML = logo; });
    document.querySelectorAll('[data-brand-name]').forEach(function (el) { el.textContent = b.name || 'Ordwell'; });
    var wsn = $('#ws-name'); if (wsn) wsn.textContent = ws ? ws.name : '';
    var pw = $('#powered'); if (pw) pw.hidden = !b.poweredBy || (b.name || '').toLowerCase() === 'ordwell';
    // favicon follows the brand
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="' + b.accent + '"/><text x="16" y="22" font-family="Arial,sans-serif" font-weight="700" font-size="17" text-anchor="middle" fill="' + UI.contrastOn(b.accent) + '">' + esc((b.name || 'O').trim().charAt(0).toUpperCase()) + '</text></svg>';
    var fav = $('link[rel=icon]'); if (fav && !b.logo) fav.href = 'data:image/svg+xml,' + encodeURIComponent(svg); else if (fav && b.logo) fav.href = b.logo;
    var mt = $('meta[name=theme-color]'); if (mt) mt.content = S.prefs.theme === 'dark' ? '#121212' : '#F6F7F9';
  };

  /* ---------- router ---------- */
  function parse() {
    var h = location.hash.replace(/^#\/?/, ''), q = {};
    var qi = h.indexOf('?'); if (qi > -1) { h.slice(qi + 1).split('&').forEach(function (kv) { var p = kv.split('='); q[p[0]] = decodeURIComponent(p[1] || ''); }); h = h.slice(0, qi); }
    var parts = h.split('/').filter(Boolean).map(decodeURIComponent);
    return { name: parts[0] || 'home', args: parts.slice(1), q: q };
  }
  app.go = function (hash) { if (location.hash === hash) render(); else location.hash = hash; };
  var lastRouteKey = '';
  function render(info) {
    var r = parse(); app.route = r;
    var key = r.name + '/' + r.args.join('/');
    var main = $('#view');
    var keep = {};
    if (key === lastRouteKey) main.querySelectorAll('[data-keep]').forEach(function (el) { keep[el.getAttribute('data-keep')] = [el.scrollTop, el.scrollLeft]; });
    var fresh = key !== lastRouteKey; lastRouteKey = key;
    var fn = OW.routes[r.name] || OW.routes.home;
    if (Q.isGuest() && ['auto', 'forms', 'settings', 'templates', 'dash'].indexOf(r.name) > -1) { fn = OW.routes.home; }
    main.setAttribute('aria-busy', 'true');
    fn(main, r.args, r.q, { fresh: fresh, info: info || {} });
    main.removeAttribute('aria-busy');
    Object.keys(keep).forEach(function (k) { var el = main.querySelector('[data-keep="' + k + '"]'); if (el) { el.scrollTop = keep[k][0]; el.scrollLeft = keep[k][1]; } });
    if (fresh) { main.scrollTop = 0; document.body.classList.remove('nav-open'); }
    renderSide(); renderTop();
    if (r.q.t && app.panelOpen === r.q.t) OW.task.refresh(); else if (r.q.t) app.openTask(r.q.t, true); else if (app.panelOpen && fresh && !app.panelSticky) app.closeTask(true);
    else if (app.panelOpen) OW.task.refresh();
    if (fresh && !info) { var h1 = main.querySelector('h1'); if (h1 && document.activeElement === document.body) { h1.setAttribute('tabindex', '-1'); } }
  }
  app.render = render;
  app.refresh = function (info) { render(info); };
  addEventListener('hashchange', function () { if (document.startViewTransition && !UI.reduced() && app.vtNext) { app.vtNext = false; UI.vt(function () { render(); }); } else render(); });

  /* ---------- sidebar ---------- */
  function renderSide() {
    var S = store.S, r = app.route, nav = $('#nav'), guest = Q.isGuest();
    var cur = function (n, a) { return r.name === n && (a == null || r.args[0] === a) ? ' aria-current="page"' : ''; };
    var unread = Q.unread();
    var h = '';
    h += '<a href="#/home"' + cur('home') + '>' + I('home') + '<span class="lbl">My work</span><span class="cnt" id="mw-cnt"></span></a>';
    h += '<a href="#/inbox"' + cur('inbox') + '>' + I('inbox') + '<span class="lbl">Inbox</span>' + (unread ? '<span class="badge" aria-label="' + unread + ' unread">' + unread + '</span>' : '') + '</a>';
    h += '<a href="#/p/*/list"' + (r.name === 'p' && r.args[0] === '*' ? ' aria-current="page"' : '') + '>' + I('layers') + '<span class="lbl">All tasks</span></a>';
    if (!guest) {
      h += '<a href="#/docs"' + cur('docs') + '>' + I('doc') + '<span class="lbl">Docs</span></a>';
      h += '<a href="#/dash"' + cur('dash') + '>' + I('dash') + '<span class="lbl">Dashboards</span></a>';
      h += '<a href="#/auto"' + cur('auto') + '>' + I('bolt') + '<span class="lbl">Automations</span><span class="cnt">' + S.automations.filter(function (a) { return a.on; }).length + '</span></a>';
      h += '<a href="#/forms"' + cur('forms') + '>' + I('form') + '<span class="lbl">Forms</span></a>';
      h += '<a href="#/templates"' + cur('templates') + '>' + I('template') + '<span class="lbl">Templates</span></a>';
    }
    var vis = Q.projectsVisible();
    var favs = S.favs.map(Q.project).filter(function (p) { return p && vis.indexOf(p) > -1; });
    if (favs.length) {
      h += '<div class="ngrp">Favourites</div>';
      favs.forEach(function (p) { h += projLink(p, r, false); });
    }
    h += '<div class="ngrp"><span>Spaces</span>' + (guest ? '' : '<button type="button" class="ibtn" data-act="new-project" aria-label="New project" title="New project">' + I('plus', 's') + '</button>') + '</div>';
    S.spaces.filter(function (s) { return s.ws === S.ws; }).forEach(function (sp) {
      var ps = vis.filter(function (p) { return p.space === sp.id; }); if (!ps.length) return;
      var open = !app.collapsed[sp.id];
      h += '<button type="button" class="sp-head" data-act="toggle-space" data-id="' + sp.id + '" aria-expanded="' + open + '">' + I('chd', 's chev') + '<span class="sp-dot" style="--h:' + sp.hue + '"></span><span>' + esc(sp.name) + '</span></button>';
      if (open) ps.forEach(function (p) { h += projLink(p, r, true); });
    });
    nav.innerHTML = h;
    var me = Q.user(S.me);
    $('#me-btn').innerHTML = UI.av(S.me, 'l') + '<span><b>' + esc(me.name) + '</b><small>' + esc(me.title) + '</small></span>';
    var mine = Q.tasks('*').filter(function (t) { return t.assignees.indexOf(Q.me()) > -1 && !Q.isDone(t) && t.due && D.diff(D.today(), t.due) <= 0; }).length;
    var c = $('#mw-cnt'); if (c) c.textContent = mine || '';
  }
  function projLink(p, r, indent) {
    var on = r.name === 'p' && r.args[0] === p.id;
    var h = '<a href="#/p/' + p.id + '" class="' + (indent ? 'pj' : '') + '"' + (on && !(r.args[1] || '').indexOf('v:') === 0 ? ' aria-current="page"' : on ? ' aria-current="page"' : '') + ' title="' + esc(p.name) + '"><span class="pdot" style="--h:' + p.hue + '"></span><span class="lbl">' + esc(p.name) + '</span>' + (p.health === 'risk' ? '<span class="cnt" title="At risk" style="color:var(--warn)">●</span>' : '') + '</a>';
    if (on && indent) store.S.views.filter(function (v) { return v.project === p.id; }).forEach(function (v) {
      h += '<a href="#/p/' + p.id + '/v:' + v.id + '" class="sv"' + (r.args[1] === 'v:' + v.id ? ' aria-current="page"' : '') + '>' + I(viewIcon(v.type)) + '<span class="lbl">' + esc(v.name) + '</span></a>';
    });
    return h;
  }
  function viewIcon(t) { return { board: 'board', list: 'list', table: 'table', timeline: 'timeline', calendar: 'calendar', workload: 'workload' }[t] || 'list'; }
  app.viewIcon = viewIcon;
  UI.act('toggle-space', function (el) { var id = el.getAttribute('data-id'); app.collapsed[id] = !app.collapsed[id]; renderSide(); });

  /* ---------- top bar ---------- */
  function renderTop() {
    var r = app.route, c = $('#crumbs'), S = store.S, h = '';
    var ws = OW.byId(S.workspaces, S.ws);
    h += '<span class="hide-s">' + esc(ws.name) + '</span><span class="sep hide-s">/</span>';
    if (r.name === 'p' && r.args[0] !== '*') { var p = Q.project(r.args[0]); if (p) { var sp = Q.space(p.space); h += '<span class="hide-s">' + esc(sp.name) + '</span><span class="sep hide-s">/</span><b>' + esc(p.name) + '</b>'; } }
    else h += '<b>' + ({ home: 'My work', inbox: 'Inbox', p: 'All tasks', docs: 'Docs', dash: 'Dashboards', auto: 'Automations', forms: 'Forms', templates: 'Templates', settings: 'Settings', t: 'Task' }[r.name] || 'My work') + '</b>';
    c.innerHTML = h;
    $('#bell-dot').hidden = !Q.unread();
    var tb = $('#tabbar'); if (tb) { tb.querySelectorAll('[data-tb]').forEach(function (x) { var on = x.getAttribute('data-tb') === r.name; if (on) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current'); }); var bd = $('#tb-badge'), n = Q.unread(); bd.hidden = !n; bd.textContent = n; }
    var va = $('#view-as');
    if (S.viewAs) { var u = Q.user(S.viewAs); va.classList.add('on'); va.querySelector('span').innerHTML = I('eye') + ' Viewing as <b>' + esc(u.name) + '</b> · ' + (u.role === 'guest' ? 'Guest — sees only client-visible work in ' + u.guestOf.map(function (id) { return esc(Q.project(id).name); }).join(', ') : u.role.charAt(0).toUpperCase() + u.role.slice(1)); }
    else va.classList.remove('on');
    $('#new-task').hidden = false;
    timerPill();
  }

  /* ---------- timer ---------- */
  var tick = null;
  function timerPill() {
    var S = store.S, p = $('#timer'), t = S.timer && Q.task(S.timer.task);
    if (!t) { p.classList.remove('on'); clearInterval(tick); tick = null; return; }
    p.classList.add('on'); p.querySelector('span').textContent = t.title;
    var upd = function () { var tm = $('#timer time'); if (tm && store.S.timer) tm.textContent = UI.clock(Date.now() - store.S.timer.start); document.querySelectorAll('[data-live-timer]').forEach(function (el) { if (store.S.timer) el.textContent = UI.clock(Date.now() - store.S.timer.start); }); };
    upd(); if (!tick) tick = setInterval(upd, 1000);
  }
  app.startTimer = function (t) {
    var S = store.S;
    if (S.timer) app.stopTimer(true);
    store.commit('Started timer', function (S) { S.timer = { task: t.id, start: Date.now() }; if (Q.isGuest()) return false; }, { quiet: true });
    UI.toast('Timer started on <b>' + esc(t.title) + '</b>', { icon: 'clock' });
  };
  app.stopTimer = function (silent) {
    var S = store.S; if (!S.timer) return;
    var t = Q.task(S.timer.task), mins = Math.max(1, Math.round((Date.now() - S.timer.start) / 60000));
    store.commit('Logged ' + UI.hm(mins), function (S) {
      if (t) { t.time.push({ id: store.uid('l'), uid: Q.me(), mins: mins, at: Date.now(), note: 'Timer' }); store.log(t, 'logged ' + UI.hm(mins)); }
      S.timer = null;
    });
    if (!silent) UI.toast('Logged <b>' + UI.hm(mins) + '</b> on ' + esc(t ? t.title : 'task'), { icon: 'clock', undo: true });
  };
  UI.act('timer', function (el) {
    var S = store.S; if (!S.timer) return; var t = Q.task(S.timer.task);
    UI.menu(el, [{ label: 'Stop and log time', icon: 'stop', fn: function () { app.stopTimer(); } }, { label: 'Open task', icon: 'expand', fn: function () { app.openTask(t.id); } }, { label: 'Discard timer', icon: 'trash', danger: true, fn: function () { store.commit('Discarded timer', function (S) { S.timer = null; }); } }], { alignRight: true });
  });

  /* ---------- task panel ---------- */
  app.panelOpen = false;
  app.openTask = function (id, fromRoute) {
    var t = Q.task(id); if (!t) return;
    app.panelOpen = id; OW.task.show(id);
    $('#panel').classList.add('on'); $('#panel-scrim').classList.add('on');
    if (!fromRoute) { var h = location.hash.replace(/[?&]t=[^&]*/, ''); history.replaceState(null, '', h + (h.indexOf('?') > -1 ? '&' : '?') + 't=' + id); }
  };
  app.closeTask = function (fromRoute) {
    if (!app.panelOpen) return; var id = app.panelOpen; app.panelOpen = false;
    $('#panel').classList.remove('on'); $('#panel-scrim').classList.remove('on');
    if (!fromRoute) history.replaceState(null, '', location.hash.replace(/[?&]t=[^&]*/, ''));
    var back = document.querySelector('[data-tid="' + id + '"]'); if (back) try { back.focus({ preventScroll: true }); } catch (e) { }
    OW.task.hide();
  };
  UI.act('close-panel', function () { app.closeTask(); });
  UI.act('open-task', function (el, e) { if (e && (e.metaKey || e.ctrlKey)) { location.hash = '#/t/' + el.getAttribute('data-id'); return; } app.openTask(el.getAttribute('data-id')); });

  /* ---------- undo / redo ---------- */
  app.undo = function () { var l = store.undo(); UI.toast(l ? 'Undid: ' + esc(l) : 'Nothing to undo', { icon: 'undo', ms: 2600, action: l ? { label: 'Redo', fn: app.redo } : null }); };
  app.redo = function () { var l = store.redo(); UI.toast(l ? 'Redid: ' + esc(l) : 'Nothing to redo', { icon: 'redo', ms: 2400 }); };

  store.on(function (info) {
    if (info.reset) { app.vstate = {}; }
    app.applyBrand(); render(info);
    if (info.label && !info.quiet && !info.undo && !info.redo) UI.toast(esc(info.label), { undo: true, icon: 'check' });
    var au = info.autos || [];
    if (au.length) setTimeout(function () {
      var names = {}; au.forEach(function (a) { names[a.name] = (names[a.name] || 0) + 1; });
      var keys = Object.keys(names), txt = keys.length === 1 ? '<b>' + esc(keys[0]) + '</b>' + (names[keys[0]] > 1 ? ' ×' + names[keys[0]] : '') : '<b>' + au.length + ' automations</b>';
      UI.toast('<span class="auto">' + I('bolt', 's') + '</span> Automation ran: ' + txt, { action: { label: 'View log', fn: function () { app.go('#/auto/log'); } }, ms: 6000 });
    }, 380);
  });

  /* ---------- new task ---------- */
  app.newTask = function (o) {
    o = o || {}; var S = store.S, r = app.route;
    var pid = o.project || (r.name === 'p' && r.args[0] !== '*' ? r.args[0] : 'p1');
    var vis = Q.projectsVisible(); if (!Q.project(pid) || vis.indexOf(Q.project(pid)) < 0) pid = vis[0].id;
    var st = { project: pid, status: o.status || null, assignees: o.assignees || [Q.me()], due: o.due || null, priority: o.priority || 0 };
    UI.dialog({
      title: 'New task', ok: 'Create task',
      body: '<div class="fld"><label class="lbl-t" for="nt-title">Title</label><input id="nt-title" class="inp" autofocus placeholder="e.g. Diwali banner set for the homepage" autocomplete="off"><div class="err" id="nt-err" hidden></div></div>' +
        '<div class="fld"><label class="lbl-t" for="nt-desc">Description <span class="faint">(optional)</span></label><textarea id="nt-desc" class="inp" rows="3" placeholder="Context, links, acceptance criteria"></textarea></div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap" id="nt-chips"></div>',
      footLeft: '<span class="faint" style="font-size:12px"><kbd>⌘</kbd> <kbd>↵</kbd> to create</span>',
      onMount: function (d) {
        var chips = d.querySelector('#nt-chips');
        function draw() {
          var p = Q.project(st.project); if (!st.status || !OW.byId(p.statuses, st.status)) st.status = p.statuses[Math.min(1, p.statuses.length - 1)].id;
          var s = OW.byId(p.statuses, st.status);
          chips.innerHTML = '<button type="button" class="chip" data-k="project">' + UI.pdot(p) + esc(p.name) + '</button>' +
            '<button type="button" class="chip" data-k="status">' + UI.sdot(s) + esc(s.name) + '</button>' +
            '<button type="button" class="chip" data-k="who">' + (st.assignees.length ? UI.avs(st.assignees, 3, 's') + esc(Q.user(st.assignees[0]).name.split(' ')[0]) + (st.assignees.length > 1 ? ' +' + (st.assignees.length - 1) : '') : I('user') + 'Assignee') + '</button>' +
            '<button type="button" class="chip' + (st.due ? '' : ' dash') + '" data-k="due">' + I('calendar') + (st.due ? D.fmt(st.due) : 'Due date') + '</button>' +
            '<button type="button" class="chip' + (st.priority ? '' : ' dash') + '" data-k="pri">' + UI.prio(st.priority) + (st.priority ? UI.PRI[st.priority] : 'Priority') + '</button>';
        }
        draw();
        chips.addEventListener('click', function (e) {
          var b = e.target.closest('[data-k]'); if (!b) return; var k = b.getAttribute('data-k');
          if (k === 'project') UI.menu(b, vis.map(function (p) { return { label: p.name, html: UI.pdot(p), checked: p.id === st.project, fn: function () { st.project = p.id; st.status = null; draw(); } }; }), { search: 'Find a project…' });
          if (k === 'status') UI.pickStatus(b, { project: st.project, status: st.status }, function (s) { st.status = s; draw(); });
          if (k === 'who') UI.pickPeople(b, st.assignees, function (l) { st.assignees = l; draw(); });
          if (k === 'due') UI.pickDate(b, st.due, function (v) { st.due = v; draw(); });
          if (k === 'pri') UI.pickPriority(b, st.priority, function (v) { st.priority = v; draw(); });
        });
      },
      onOk: function (d) {
        var title = d.querySelector('#nt-title').value.trim(), err = d.querySelector('#nt-err');
        if (!title) { err.hidden = false; err.textContent = 'Give the task a title so your team knows what it is.'; d.querySelector('#nt-title').setAttribute('aria-invalid', 'true'); d.querySelector('#nt-title').focus(); return false; }
        var t = store.commit('Created ' + title, function () { return OW.A.create({ project: st.project, title: title, desc: d.querySelector('#nt-desc').value.trim(), status: st.status, assignees: st.assignees, due: st.due, start: st.due ? D.add(st.due, -2) : null, priority: st.priority }); });
        if (t && t.id) setTimeout(function () { app.openTask(t.id); }, 60);
      }
    });
  };
  UI.act('new-task', function () { app.newTask(); });
  UI.act('new-menu', function (el) {
    var g = Q.isGuest();
    UI.menu(el, [{ label: 'Task', icon: 'check', kbd: 'C', fn: function () { app.newTask(); } }].concat(g ? [] : [
      { label: 'Project from a template', icon: 'template', fn: function () { app.go('#/templates'); } },
      { label: 'Blank project', icon: 'folder', fn: function () { UI.acts['new-project'](el); } },
      { label: 'Doc', icon: 'doc', fn: function () { UI.acts['doc-new'](el); } },
      { label: 'Automation', icon: 'bolt', fn: function () { app.go('#/auto/new'); } },
      { label: 'Form', icon: 'form', fn: function () { UI.acts['fm-new'](el); } },
      { sep: true }, { label: 'Ask Ordwell to create it', icon: 'spark', kbd: '⌘J', fn: function () { window.OrdwellAssistant && OrdwellAssistant.open(); } }]), { alignRight: true });
  });

  /* ---------- workspace + me menus ---------- */
  UI.act('ws', function (el) {
    var S = store.S;
    var items = [{ head: 'Workspaces' }].concat(S.workspaces.map(function (w) { return { label: w.name, checked: w.id === S.ws, fn: function () { store.commit('Switched to ' + w.name, function (S) { S.ws = w.id; }, { quiet: true }); app.go('#/home'); } }; }));
    if (!Q.isGuest()) items.push({ sep: true }, { label: 'Branding and white-label', icon: 'brush', fn: function () { app.go('#/settings/brand'); } }, { label: 'Members and guests', icon: 'users', fn: function () { app.go('#/settings/members'); } }, { label: 'Workspace settings', icon: 'settings', fn: function () { app.go('#/settings/workspace'); } });
    UI.menu(el, items);
  });
  UI.act('me', function (el) {
    var S = store.S;
    var items = [{ head: 'View as (preview permissions)' }];
    [S.me, 'u7', 'u3', 'u11', 'u12'].forEach(function (id) { var u = Q.user(id); items.push({ label: u.name + (id === S.me ? ' (you)' : ''), hint: u.role, html: UI.av(id, 's'), checked: (S.viewAs || S.me) === id, fn: function () { app.viewAs(id === S.me ? null : id); } }); });
    items.push({ sep: true }, { label: S.prefs.theme === 'dark' ? 'Light theme' : 'Dark theme', icon: S.prefs.theme === 'dark' ? 'sun' : 'moon', kbd: '⇧D', fn: app.toggleTheme },
      { label: 'Keyboard shortcuts', icon: 'keyb', kbd: '?', fn: app.shortcuts },
      { label: 'Product site', icon: 'globe', fn: function () { location.href = 'product.html'; } },
      { sep: true }, { label: 'Start fresh', icon: 'refresh', danger: true, fn: app.resetDemo });
    UI.menu(el, items, { alignRight: false });
  });
  app.viewAs = function (id) {
    store.commit(id ? 'Viewing as ' + Q.user(id).name : 'Back to your own view', function (S) { S.viewAs = id; }, { quiet: true });
    app.closeTask(); app.go('#/home');
    UI.toast(id ? 'Previewing as <b>' + esc(Q.user(id).name) + '</b>' : 'Back to your own view', { icon: 'eye' });
  };
  UI.act('exit-view-as', function () { app.viewAs(null); });
  app.toggleTheme = function () { store.commit('Theme', function (S) { S.prefs.theme = S.prefs.theme === 'dark' ? 'light' : 'dark'; }, { quiet: true }); };
  app.resetDemo = function () { UI.confirm('Start fresh?', 'This puts back the original Fernhill Digital projects, tasks, docs and settings. Changes you made to tasks, docs and settings are cleared.', 'Start fresh', function () { store.reset(); app.go('#/home'); UI.toast('Workspace restored', { icon: 'refresh' }); }, true); };
  UI.act('side-toggle', function () { var a = $('.app'); var c = a.classList.toggle('collapsed'); $('#side-t').setAttribute('aria-expanded', String(!c)); });
  UI.act('ham', function () { document.body.classList.toggle('nav-open'); });
  UI.act('scrim', function () { document.body.classList.remove('nav-open'); });

  /* ---------- shortcuts sheet ---------- */
  app.shortcuts = function () {
    var rows = [['Command palette', '⌘ K'], ['Search', '/'], ['New task', 'C'], ['Undo', '⌘ Z'], ['Redo', '⌘ ⇧ Z'], ['My work', 'G H'], ['Inbox', 'G I'], ['All tasks', 'G A'], ['Docs', 'G D'], ['Dashboards', 'G B'], ['Automations', 'G U'], ['Settings', 'G S'],
      ['Board / List / Table', '1 2 3'], ['Timeline / Calendar / Workload', '4 5 6'], ['Next / previous task', 'J K'], ['Select task', 'X'], ['Open task', '↵'], ['Focus mode', 'F'], ['Start / stop timer', 'T'], ['Toggle dark theme', '⇧ D'], ['Close panel', 'Esc'], ['This sheet', '?']];
    UI.dialog({ title: 'Keyboard shortcuts', wide: true, foot: false, body: '<div class="kb-list">' + rows.map(function (r) { return '<div><span>' + r[0] + '</span><span class="kbd-row">' + r[1].split(' ').map(function (k) { return '<kbd>' + k + '</kbd>'; }).join('') + '</span></div>'; }).join('') + '</div>' });
  };

  /* ---------- command palette ---------- */
  var pal = { el: null, items: [], i: 0 };
  app.palette = function (scope) {
    if (!pal.el) {
      pal.el = document.createElement('div'); pal.el.className = 'pal'; pal.el.setAttribute('role', 'dialog'); pal.el.setAttribute('aria-modal', 'true'); pal.el.setAttribute('aria-label', 'Command palette');
      pal.el.innerHTML = '<div class="pal-box"><div class="pal-in">' + I('search', 'l') + '<input type="text" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-autocomplete="list" placeholder="Search tasks, projects, docs, people — or type a command" aria-label="Search or run a command"><span class="pal-scope" data-brand-name>Ordwell</span></div><div class="pal-list" id="pal-list" role="listbox"></div><div class="pal-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span><span style="margin-left:auto">Tip: “&gt;” for commands only</span></div></div>';
      document.body.appendChild(pal.el);
      var inp = pal.el.querySelector('input');
      inp.addEventListener('input', function () { pal.i = 0; palDraw(inp.value); });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); pal.i = Math.min(pal.items.length - 1, pal.i + 1); palSel(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); pal.i = Math.max(0, pal.i - 1); palSel(); }
        else if (e.key === 'Enter') { e.preventDefault(); var it = pal.items[pal.i]; if (it) { app.closePalette(); it.fn(); } }
        else if (e.key === 'Escape') { e.preventDefault(); app.closePalette(); }
      });
      pal.el.addEventListener('click', function (e) { if (e.target === pal.el) app.closePalette(); var b = e.target.closest('[data-pi]'); if (b) { var it = pal.items[+b.getAttribute('data-pi')]; app.closePalette(); it.fn(); } });
      pal.el.addEventListener('mousemove', function (e) { var b = e.target.closest('[data-pi]'); if (b && +b.getAttribute('data-pi') !== pal.i) { pal.i = +b.getAttribute('data-pi'); palSel(); } });
    }
    app.applyBrand();
    pal.prev = document.activeElement; pal.el.classList.add('on');
    var inp = pal.el.querySelector('input'); inp.value = scope || ''; pal.i = 0; palDraw(inp.value); inp.focus();
  };
  app.closePalette = function () { if (pal.el) pal.el.classList.remove('on'); if (pal.prev && document.body.contains(pal.prev)) try { pal.prev.focus(); } catch (e) { } };
  function hl(text, q) { if (!q) return esc(text); var i = text.toLowerCase().indexOf(q.toLowerCase()); if (i < 0) return esc(text); return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length)); }
  function commands() {
    var r = app.route, S = store.S, list = [
      { g: 'Commands', icon: 'plus', label: 'Create task', kbd: 'C', fn: function () { app.newTask(); } },
      { g: 'Commands', icon: 'spark', label: 'Ask Ordwell — overdue, summaries, quick edits', kbd: '⌘J', fn: function () { window.OrdwellAssistant && OrdwellAssistant.open(); } },
      { g: 'Commands', icon: 'focus', label: 'Start focus mode — my work today', kbd: 'F', fn: function () { OW.pages.focus(); } },
      { g: 'Commands', icon: 'inbox', label: 'Go to Inbox', kbd: 'G I', fn: function () { app.go('#/inbox'); } },
      { g: 'Commands', icon: 'home', label: 'Go to My work', kbd: 'G H', fn: function () { app.go('#/home'); } },
      { g: 'Commands', icon: 'dash', label: 'Open dashboards', fn: function () { app.go('#/dash'); } },
      { g: 'Commands', icon: 'bolt', label: 'Automations and run log', fn: function () { app.go('#/auto'); } },
      { g: 'Commands', icon: 'brush', label: 'Change brand name, logo or accent', fn: function () { app.go('#/settings/brand'); } },
      { g: 'Commands', icon: S.prefs.theme === 'dark' ? 'sun' : 'moon', label: 'Toggle dark theme', kbd: '⇧D', fn: app.toggleTheme },
      { g: 'Commands', icon: 'undo', label: 'Undo ' + (store.undoLabel() ? '“' + store.undoLabel() + '”' : ''), kbd: '⌘Z', fn: app.undo },
      { g: 'Commands', icon: 'template', label: 'New project from a template', fn: function () { app.go('#/templates'); } },
      { g: 'Commands', icon: 'eye', label: S.viewAs ? 'Stop viewing as someone else' : 'View as a client guest (Farhan Ali)', fn: function () { app.viewAs(S.viewAs ? null : 'u11'); } },
      { g: 'Commands', icon: 'keyb', label: 'Keyboard shortcuts', kbd: '?', fn: app.shortcuts }
    ];
    if (r.name === 'p') ['board', 'list', 'table', 'timeline', 'calendar', 'workload'].forEach(function (v, i) { list.push({ g: 'Commands', icon: viewIcon(v), label: 'Switch to ' + v + ' view', kbd: String(i + 1), fn: function () { OW.project.setView(v); } }); });
    if (app.panelOpen) { var t = Q.task(app.panelOpen); list.unshift({ g: 'This task', icon: 'clock', label: (S.timer && S.timer.task === t.id ? 'Stop timer on ' : 'Start timer on ') + t.title, kbd: 'T', fn: function () { if (S.timer && S.timer.task === t.id) app.stopTimer(); else app.startTimer(t); } }); }
    return list;
  }
  function palDraw(q) {
    var S = store.S, out = [], cmdOnly = q.charAt(0) === '>'; q = q.replace(/^>\s*/, '').trim(); var ql = q.toLowerCase();
    var cm = commands().filter(function (c) { return !ql || c.label.toLowerCase().indexOf(ql) > -1; });
    if (!cmdOnly) {
      var tasks = S.tasks.filter(function (t) { return !t.archived && Q.canSee(t) && Q.projectsVisible().indexOf(Q.project(t.project)) > -1 && (!ql || (t.title + ' ' + t.num).toLowerCase().indexOf(ql) > -1); });
      tasks.sort(function (a, b) { return (Q.isDone(a) - Q.isDone(b)) || (b.updated - a.updated); });
      if (!ql) tasks = tasks.filter(function (t) { return t.assignees.indexOf(Q.me()) > -1 && !Q.isDone(t); });
      tasks.slice(0, ql ? 8 : 5).forEach(function (t) { out.push({ g: ql ? 'Tasks' : 'Your open tasks', html: UI.sdot(Q.status(t)), label: t.title, sub: t.num, fn: function () { app.openTask(t.id); } }); });
      Q.projectsVisible().filter(function (p) { return !ql || p.name.toLowerCase().indexOf(ql) > -1; }).slice(0, ql ? 5 : 4).forEach(function (p) { out.push({ g: 'Projects', html: UI.pdot(p), label: p.name, sub: p.client, fn: function () { app.go('#/p/' + p.id); } }); });
      if (ql) {
        S.docs.filter(function (d) { return d.title.toLowerCase().indexOf(ql) > -1; }).slice(0, 4).forEach(function (d) { out.push({ g: 'Docs', icon: 'doc', label: d.title, fn: function () { app.go('#/docs/' + d.id); } }); });
        S.users.filter(function (u) { return u.name.toLowerCase().indexOf(ql) > -1; }).slice(0, 4).forEach(function (u) { out.push({ g: 'People', html: UI.av(u.id, 's'), label: u.name, sub: u.title, fn: function () { var v = OW.project.state('*'); v.filter.who = [u.id]; app.go('#/p/*/list'); } }); });
      }
    }
    out = cm.slice(0, ql ? 6 : (cmdOnly ? 20 : 6)).concat(out);
    if (!ql && !cmdOnly) out = out.slice(0, 6).concat(out.slice(6)); // commands then tasks
    pal.items = out;
    var h = '', g = null;
    out.forEach(function (it, i) {
      if (it.g !== g) { g = it.g; h += '<div class="mh" role="presentation">' + esc(g) + '</div>'; }
      h += '<button type="button" class="pal-it" role="option" id="pi' + i + '" data-pi="' + i + '" aria-selected="' + (i === pal.i) + '">' + (it.html || I(it.icon || 'spark')) + '<span class="sp">' + hl(it.label, q) + (it.sub ? ' <small>' + esc(it.sub) + '</small>' : '') + '</span>' + (it.kbd ? '<kbd>' + esc(it.kbd) + '</kbd>' : '') + '</button>';
    });
    if (!out.length) h = '<div class="empty" style="padding:28px">' + '<h3>Nothing matches “' + esc(q) + '”</h3><p>Try a task number like CEW-106, a client name, or press <kbd>C</kbd> to create it.</p></div>';
    pal.el.querySelector('.pal-list').innerHTML = h; palSel();
  }
  function palSel() {
    pal.el.querySelectorAll('[data-pi]').forEach(function (b) { var on = +b.getAttribute('data-pi') === pal.i; b.setAttribute('aria-selected', on); if (on) b.scrollIntoView({ block: 'nearest' }); });
    pal.el.querySelector('input').setAttribute('aria-activedescendant', 'pi' + pal.i);
  }
  UI.act('palette', function () { app.palette(); });

  /* ---------- keyboard ---------- */
  var gMode = 0;
  function typing(e) { var t = e.target; return t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName); }
  document.addEventListener('keydown', function (e) {
    var k = e.key, mod = e.metaKey || e.ctrlKey;
    if (mod && (k === 'k' || k === 'K')) { e.preventDefault(); if (pal.el && pal.el.classList.contains('on')) app.closePalette(); else app.palette(); return; }
    if (pal.el && pal.el.classList.contains('on')) return;
    if (document.querySelector('dialog[open]') || $('.focus.on')) return;
    if (mod && (k === 'z' || k === 'Z') && !typing(e)) { e.preventDefault(); if (e.shiftKey) app.redo(); else app.undo(); return; }
    if (mod && k === 'y' && !typing(e)) { e.preventDefault(); app.redo(); return; }
    if (typing(e) || mod || e.altKey) return;
    if (k === 'Escape') { if (app.panelOpen) { app.closeTask(); e.preventDefault(); } else if (OW.project && OW.project.clearSel()) e.preventDefault(); return; }
    if (gMode) {
      gMode = 0; var map = { h: '#/home', i: '#/inbox', a: '#/p/*/list', d: '#/docs', b: '#/dash', u: '#/auto', s: '#/settings/brand', f: '#/forms', t: '#/templates' };
      if (map[k.toLowerCase()]) { e.preventDefault(); app.go(map[k.toLowerCase()]); } return;
    }
    if (k === 'g') { gMode = 1; setTimeout(function () { gMode = 0; }, 1200); return; }
    if (k === '/') { e.preventDefault(); app.palette(); return; }
    if (k === '?') { e.preventDefault(); app.shortcuts(); return; }
    if (k === 'c' || k === 'C') { e.preventDefault(); app.newTask(); return; }
    if (k === 'f' || k === 'F') { e.preventDefault(); OW.pages.focus(); return; }
    if (k === 'D' && e.shiftKey) { e.preventDefault(); app.toggleTheme(); return; }
    if ((k === 't' || k === 'T') && app.panelOpen) { e.preventDefault(); var t = Q.task(app.panelOpen); if (store.S.timer && store.S.timer.task === t.id) app.stopTimer(); else app.startTimer(t); return; }
    if (OW.project && app.route.name === 'p' && OW.project.key(e)) return;
  });

  /* ---------- boot ---------- */
  app.boot = function () {
    store.load(); app.applyBrand();
    $('#side').hidden = false;
    render();
    // opened as a client workspace from the reseller console: offer the way back
    var rb = store.S.rebrand;
    if (rb && rb.prev) setTimeout(function () { UI.toast('Showing the workspace as <b>' + esc(store.S.brand.name) + '</b>', { icon: 'eye', ms: 9000, action: { label: 'Undo', fn: function () { store.commit('Restored the previous brand', function (S) { Object.keys(rb.prev).forEach(function (k) { S.brand[k] = rb.prev[k]; }); delete S.rebrand; }, { quiet: true }); app.applyBrand(); } } }); }, 600);
    store.scheduled();
    // simulated teammates: replies to @mentions arrive a little later (demo)
    OW.sim && OW.sim.start();
    document.documentElement.classList.add('ready');
  };
})();
