/* Ordwell — project page: header, view tabs (incl. saved views), toolbar (search, filters, group, sort),
   shared filtering/grouping used by every view, selection + bulk edit with preview, project keyboard. */
(function () {
  'use strict';
  var OW = window.OW, UI = OW.UI, Q = OW.Q, D = OW.D, I = UI.I, esc = UI.esc, store = OW.store, app = OW.app;
  var PR = OW.project = {}; OW.views = OW.views || {};
  var VIEWS = [['board', 'Board'], ['list', 'List'], ['table', 'Table'], ['timeline', 'Timeline'], ['calendar', 'Calendar'], ['workload', 'Workload']];
  var CATS = [['backlog', 'Backlog'], ['todo', 'To do'], ['active', 'In progress'], ['review', 'In review'], ['review2', 'Waiting on client'], ['blocked', 'Blocked'], ['done', 'Done']];
  PR.CATS = CATS;

  PR.state = function (pid) {
    var v = app.vstate[pid];
    if (!v) v = app.vstate[pid] = { view: pid === '*' ? 'list' : 'board', filter: { q: '', who: [], pri: [], tags: [], due: '', status: '' }, group: pid === '*' ? 'project' : 'status', sort: 'manual', sel: [], zoom: 'week', saved: null, subs: false };
    return v;
  };
  function cur() { var r = app.route; return r.name === 'p' ? r.args[0] : null; }
  PR.cur = cur;

  /* ---------- filtering / grouping ---------- */
  PR.filtered = function (pid, st) {
    var f = st.filter, list = Q.tasks(pid), today = D.today(), q = f.q.trim().toLowerCase();
    return list.filter(function (t) {
      if (q && (t.title + ' ' + t.num + ' ' + t.tags.join(' ')).toLowerCase().indexOf(q) < 0) return false;
      if (f.who.length && !f.who.some(function (w) { return w === 'none' ? !t.assignees.length : t.assignees.indexOf(w) > -1; })) return false;
      if (f.pri.length && f.pri.indexOf(t.priority) < 0) return false;
      if (f.tags.length && !f.tags.every(function (g) { return t.tags.indexOf(g) > -1; })) return false;
      if (f.status === 'open' && Q.isDone(t)) return false;
      if (f.status && f.status !== 'open' && Q.cat(t) !== f.status) return false;
      if (f.due) {
        var n = t.due ? D.diff(today, t.due) : null;
        if (f.due === 'overdue' && !(n !== null && n < 0 && !Q.isDone(t))) return false;
        if (f.due === 'today' && n !== 0) return false;
        if (f.due === 'week' && !(n !== null && n >= 0 && n <= 7)) return false;
        if (f.due === 'nodate' && t.due) return false;
      }
      return true;
    });
  };
  PR.sort = function (list, how) {
    var s = list.slice();
    var by = {
      manual: function (a, b) { return a.order - b.order; },
      due: function (a, b) { return (a.due || '9999') < (b.due || '9999') ? -1 : (a.due || '9999') > (b.due || '9999') ? 1 : 0; },
      priority: function (a, b) { return b.priority - a.priority; },
      updated: function (a, b) { return b.updated - a.updated; },
      title: function (a, b) { return a.title.localeCompare(b.title); }
    }[how] || function () { return 0; };
    return s.sort(by);
  };
  PR.groups = function (pid, list, how) {
    var g = [], map = {};
    function add(key, name, extra) { if (!map[key]) { map[key] = { key: key, name: name, tasks: [] }; for (var k in extra) map[key][k] = extra[k]; g.push(map[key]); } return map[key]; }
    if (how === 'status' && pid !== '*') { var p = Q.project(pid); p.statuses.forEach(function (s) { add(s.id, s.name, { st: s }); }); list.forEach(function (t) { (map[t.status] || add(t.status, t.status, {})).tasks.push(t); }); }
    else if (how === 'status' || how === 'cat') { CATS.forEach(function (c) { add(c[0], c[1], { st: { cat: c[0], name: c[1] } }); }); list.forEach(function (t) { map[Q.cat(t)].tasks.push(t); }); g = g.filter(function (x) { return x.tasks.length || ['todo', 'active', 'review', 'done'].indexOf(x.key) > -1; }); }
    else if (how === 'assignee') { store.S.users.filter(function (u) { return u.role !== 'guest'; }).forEach(function (u) { add(u.id, u.name, { uid: u.id }); }); add('none', 'Unassigned', {}); list.forEach(function (t) { if (!t.assignees.length) map.none.tasks.push(t); t.assignees.forEach(function (a) { (map[a] || add(a, Q.user(a).name, { uid: a })).tasks.push(t); }); }); g = g.filter(function (x) { return x.tasks.length; }); }
    else if (how === 'priority') { [4, 3, 2, 1, 0].forEach(function (p) { add('p' + p, UI.PRI[p], { pri: p }); }); list.forEach(function (t) { map['p' + t.priority].tasks.push(t); }); g = g.filter(function (x) { return x.tasks.length; }); }
    else if (how === 'due') {
      [['over', 'Overdue'], ['today', 'Today'], ['week', 'Next 7 days'], ['later', 'Later'], ['none', 'No due date']].forEach(function (d) { add(d[0], d[1], {}); });
      list.forEach(function (t) { var n = t.due ? D.diff(D.today(), t.due) : null; var k = n === null ? 'none' : n < 0 && !Q.isDone(t) ? 'over' : n === 0 ? 'today' : n > 0 && n <= 7 ? 'week' : 'later'; map[k].tasks.push(t); });
      g = g.filter(function (x) { return x.tasks.length; });
    }
    else if (how === 'project') { Q.projectsVisible().forEach(function (p) { add(p.id, p.name, { p: p }); }); list.forEach(function (t) { if (map[t.project]) map[t.project].tasks.push(t); }); g = g.filter(function (x) { return x.tasks.length; }); }
    else { add('all', 'All tasks', {}); list.forEach(function (t) { map.all.tasks.push(t); }); }
    return g;
  };

  /* ---------- page ---------- */
  OW.routes.p = function (main, args, q, ctx) {
    var pid = args[0] || 'p1', S = store.S;
    if (pid !== '*' && (!Q.project(pid) || Q.projectsVisible().indexOf(Q.project(pid)) < 0)) { var vp = Q.projectsVisible()[0]; app.go('#/p/' + (vp ? vp.id : '*')); return; }
    var st = PR.state(pid), p = pid === '*' ? null : Q.project(pid);
    var vArg = args[1] || '';
    if (vArg.indexOf('v:') === 0) {
      var sv = OW.byId(S.views, vArg.slice(2));
      if (sv && st.saved !== sv.id) { st.saved = sv.id; st.view = sv.type; st.filter = JSON.parse(JSON.stringify(sv.filter)); st.filter.q = st.filter.q || ''; st.filter.status = st.filter.status || ''; st.group = sv.group || st.group; st.sel = []; }
    } else if (vArg) { if (st.saved) { st.saved = null; } st.view = vArg; }
    else if (st.saved) st.saved = null;
    if (pid === '*' && st.view === 'board' && st.group === 'project') st.group = 'status';
    var tasks = PR.filtered(pid, st);

    var h = '<div class="ph">';
    if (p) {
      var all = Q.tasks(pid), done = all.filter(Q.isDone).length, sp = Q.space(p.space);
      var fav = S.favs.indexOf(pid) > -1;
      h += '<div class="ph-row"><h1><span class="pdot" style="--h:' + p.hue + '"></span>' + esc(p.name) + '</h1>' +
        '<button type="button" class="ibtn" data-act="fav" data-id="' + pid + '" aria-pressed="' + fav + '" aria-label="' + (fav ? 'Remove from favourites' : 'Add to favourites') + '">' + I('star') + '</button><span class="sp"></span>' +
        '<span class="avs" aria-label="Members">' + UI.avs(p.members.filter(function (m) { return Q.user(m).role !== 'guest'; }), 5) + '</span>' +
        (Q.isGuest() ? '' : '<button type="button" class="btn sm" data-act="share" data-id="' + pid + '">' + I('users') + 'Share</button>') +
        '<button type="button" class="btn sm pri" data-act="new-task">' + I('plus') + 'New task</button></div>';
      h += '<div class="ph-meta"><button type="button" class="health ' + p.health + '" data-act="health" data-id="' + pid + '"' + (Q.isGuest() ? ' disabled' : '') + '><i></i>' + { on: 'On track', risk: 'At risk', off: 'Off track' }[p.health] + '</button><span>·</span><span>' + esc(p.client) + '</span><span>·</span><span>' + D.fmt(p.start) + ' → ' + D.fmt(p.end) + '</span><span>·</span><span>' + done + ' of ' + all.length + ' done</span>' +
        (p.budget && !Q.isGuest() ? '<span>·</span><span>Budget ' + UI.inrS(p.budget) + '</span>' : '') + '<span class="hide-s" style="color:var(--faint)">· ' + esc(sp.name) + '</span></div>';
    } else {
      h += '<div class="ph-row"><h1>' + I('layers', 'l') + 'All tasks</h1><span class="sp"></span><button type="button" class="btn sm pri" data-act="new-task">' + I('plus') + 'New task</button></div><div class="ph-meta">Every project in ' + esc(OW.byId(S.workspaces, S.ws).name) + ' you can see · ' + Q.tasks('*').length + ' tasks</div>';
    }
    h += '<div class="vtabs" role="tablist" aria-label="Views">';
    VIEWS.forEach(function (v, i) {
      var on = !st.saved && st.view === v[0];
      h += '<a class="vtab" role="tab" href="#/p/' + pid + '/' + v[0] + '" aria-selected="' + on + '" data-vt="' + v[0] + '" title="' + v[1] + ' (' + (i + 1) + ')">' + I(app.viewIcon(v[0])) + v[1] + '</a>';
    });
    var saved = S.views.filter(function (v) { return v.project === pid; });
    if (saved.length) h += '<span class="vtab-sep" aria-hidden="true"></span>';
    saved.forEach(function (v) { h += '<a class="vtab saved" role="tab" href="#/p/' + pid + '/v:' + v.id + '" aria-selected="' + (st.saved === v.id) + '">' + I(app.viewIcon(v.type)) + esc(v.name) + (v.queue ? ' ' + I('play', 's') : '') + '</a>'; });
    h += '</div></div>';
    h += toolbar(pid, st, tasks);
    h += '<div class="vcanvas" id="vcanvas"></div>';
    main.innerHTML = h;
    var canvas = main.querySelector('#vcanvas');
    var fn = OW.views[st.view] || OW.views.list;
    fn(canvas, { pid: pid, p: p, st: st, tasks: tasks, fresh: ctx.fresh });
    bulkBar(st, pid);
    var vtLinks = main.querySelectorAll('[data-vt]');
    vtLinks.forEach(function (a) { a.addEventListener('click', function () { app.vtNext = true; }); });
  };

  function toolbar(pid, st, tasks) {
    var f = st.filter, chips = '';
    function chip(label, key) { return '<span class="fchip">' + label + '<button type="button" data-act="clr-f" data-k="' + key + '" aria-label="Remove filter: ' + esc(label.replace(/<[^>]+>/g, '')) + '">' + I('x', 's') + '</button></span>'; }
    if (f.who.length) chips += chip('Assignee: ' + f.who.map(function (w) { return w === 'none' ? 'Unassigned' : esc(Q.user(w).name.split(' ')[0]); }).join(', '), 'who');
    if (f.pri.length) chips += chip('Priority: ' + f.pri.map(function (p) { return UI.PRI[p]; }).join(', '), 'pri');
    if (f.tags.length) chips += chip('Tag: ' + f.tags.map(esc).join(', '), 'tags');
    if (f.due) chips += chip({ overdue: 'Overdue', today: 'Due today', week: 'Due in 7 days', nodate: 'No due date' }[f.due], 'due');
    if (f.status) chips += chip(f.status === 'open' ? 'Open only' : 'Status: ' + (CATS.filter(function (c) { return c[0] === f.status; })[0] || [0, f.status])[1], 'status');
    var mine = f.who.length === 1 && f.who[0] === Q.me();
    var dirty = chips || f.q;
    var sv = st.saved && OW.byId(store.S.views, st.saved);
    return '<div class="tbar" role="toolbar" aria-label="View options">' +
      '<label class="tsearch">' + I('search', 's') + '<input type="search" placeholder="Search ' + (tasks.length) + ' tasks" value="' + esc(f.q) + '" data-input="fq" aria-label="Search tasks in this view"></label>' +
      '<button type="button" class="btn sm ghost" data-act="filter-menu" aria-haspopup="menu">' + I('filter') + 'Filter</button>' +
      '<button type="button" class="btn sm ghost' + (mine ? '' : '') + '" data-act="only-me" aria-pressed="' + mine + '" style="' + (mine ? 'color:var(--accent-ink);background:var(--accent-bg)' : '') + '">' + I('user') + 'Mine</button>' +
      (['list', 'board', 'timeline'].indexOf(st.view) > -1 ? '<button type="button" class="btn sm ghost" data-act="group-menu" aria-haspopup="menu">' + I('group') + 'Group: ' + groupName(st.group) + '</button>' : '') +
      (['list', 'board', 'table'].indexOf(st.view) > -1 ? '<button type="button" class="btn sm ghost" data-act="sort-menu" aria-haspopup="menu">' + I('sort') + 'Sort: ' + { manual: 'Manual', due: 'Due date', priority: 'Priority', updated: 'Last updated', title: 'Title' }[st.sort] + '</button>' : '') +
      '<span class="fchips">' + chips + '</span><span class="sp"></span>' +
      (sv ? '<span class="faint" style="font-size:12px">Saved view' + (sv.by ? ' by ' + esc(Q.user(sv.by).name.split(' ')[0]) : '') + '</span>' : '') +
      (sv ? '<button type="button" class="btn sm ghost" data-act="view-menu" aria-haspopup="menu">' + I('more') + '<span class="sr">Saved view options</span></button>' : '') +
      (!sv && (dirty || st.view !== 'board' || st.group !== 'status') && !Q.isGuest() ? '<button type="button" class="btn sm" data-act="save-view">' + I('star') + 'Save view</button>' : '') +
      '</div>';
  }
  function groupName(g) { return { status: 'Status', assignee: 'Assignee', priority: 'Priority', due: 'Due date', project: 'Project', none: 'None', cat: 'Status' }[g] || g; }

  var ft = null;
  UI.act('fq', function (el) {
    var pid = cur(); if (!pid) return; PR.state(pid).filter.q = el.value; clearTimeout(ft);
    ft = setTimeout(function () { var pos = el.selectionStart; app.render(); var i = document.querySelector('[data-input=fq]'); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch (e) { } } }, 140);
  });
  UI.act('clr-f', function (el) { var st = PR.state(cur()), k = el.getAttribute('data-k'); st.filter[k] = Array.isArray(st.filter[k]) ? [] : ''; app.render(); });
  UI.act('only-me', function () { var st = PR.state(cur()), f = st.filter; f.who = f.who.length === 1 && f.who[0] === Q.me() ? [] : [Q.me()]; app.render(); });
  UI.act('filter-menu', function (el) {
    var pid = cur(), st = PR.state(pid), f = st.filter;
    UI.menu(el, [
      { head: 'Due' }, { label: 'Overdue', checked: f.due === 'overdue', fn: function () { f.due = f.due === 'overdue' ? '' : 'overdue'; app.render(); } },
      { label: 'Due today', checked: f.due === 'today', fn: function () { f.due = f.due === 'today' ? '' : 'today'; app.render(); } },
      { label: 'Due in the next 7 days', checked: f.due === 'week', fn: function () { f.due = f.due === 'week' ? '' : 'week'; app.render(); } },
      { label: 'No due date', checked: f.due === 'nodate', fn: function () { f.due = f.due === 'nodate' ? '' : 'nodate'; app.render(); } },
      { head: 'Status' }, { label: 'Hide done', checked: f.status === 'open', fn: function () { f.status = f.status === 'open' ? '' : 'open'; app.render(); } },
      { label: 'Waiting on client', checked: f.status === 'review2', fn: function () { f.status = f.status === 'review2' ? '' : 'review2'; app.render(); } },
      { head: 'More' }, { label: 'Assignee…', icon: 'user', fn: function () { UI.pickPeople(el, f.who, function (l) { f.who = l; app.render(); }); } },
      { label: 'Priority…', icon: 'flag', fn: function () { UI.menu(el, [4, 3, 2, 1, 0].map(function (p) { return { label: UI.PRI[p], html: UI.prio(p), checked: f.pri.indexOf(p) > -1, fn: function () { var i = f.pri.indexOf(p); if (i > -1) f.pri.splice(i, 1); else f.pri.push(p); } }; }), { keepOpen: true, onClose: function () { app.render(); } }); } },
      { label: 'Tag…', icon: 'tag', fn: function () { UI.pickTags(el, f.tags, function (l) { f.tags = l; app.render(); }); } }
    ]);
  });
  UI.act('group-menu', function (el) {
    var pid = cur(), st = PR.state(pid);
    var opts = st.view === 'board' ? ['status', 'assignee', 'priority'] : ['status', 'assignee', 'priority', 'due', 'none'];
    if (pid === '*' && st.view !== 'board') opts.unshift('project');
    UI.menu(el, opts.map(function (g) { return { label: groupName(g), checked: st.group === g, fn: function () { st.group = g; app.render(); } }; }));
  });
  UI.act('sort-menu', function (el) {
    var st = PR.state(cur());
    UI.menu(el, [['manual', 'Manual'], ['due', 'Due date'], ['priority', 'Priority'], ['updated', 'Last updated'], ['title', 'Title']].map(function (s) { return { label: s[1], checked: st.sort === s[0], fn: function () { st.sort = s[0]; app.render(); } }; }));
  });
  UI.act('save-view', function () {
    var pid = cur(), st = PR.state(pid);
    UI.dialog({
      title: 'Save this view', ok: 'Save view',
      body: '<div class="fld"><label class="lbl-t" for="sv-n">Name</label><input id="sv-n" class="inp" autofocus placeholder="e.g. My overdue work" value=""><div class="err" hidden id="sv-e"></div></div>' +
        '<p class="hint" style="margin-bottom:12px">Saves the ' + st.view + ' layout with its filters and grouping. It shows up under the project in the sidebar.</p>' +
        '<label class="switch"><input type="checkbox" id="sv-s" checked><i></i>Share with everyone on the project</label><br><br><label class="switch"><input type="checkbox" id="sv-q"><i></i>Make it a queue (adds a Play button for focus mode)</label>',
      onOk: function (d) {
        var n = d.querySelector('#sv-n').value.trim(); if (!n) { var e = d.querySelector('#sv-e'); e.hidden = false; e.textContent = 'A short name helps teammates find it.'; return false; }
        var id; store.commit('Saved view ' + n, function (S) { id = store.uid('v'); S.views.push({ id: id, project: pid, name: n, type: st.view, filter: JSON.parse(JSON.stringify(st.filter)), group: st.group, by: Q.me(), shared: d.querySelector('#sv-s').checked, queue: d.querySelector('#sv-q').checked, due: D.add(D.today(), 2) }); });
        st.saved = null; app.go('#/p/' + pid + '/v:' + id);
      }
    });
  });
  UI.act('view-menu', function (el) {
    var pid = cur(), st = PR.state(pid), v = OW.byId(store.S.views, st.saved);
    UI.menu(el, [
      { label: 'Update with current filters', icon: 'refresh', fn: function () { store.commit('Updated view ' + v.name, function () { v.filter = JSON.parse(JSON.stringify(st.filter)); v.group = st.group; v.type = st.view; }); } },
      { label: v.queue ? 'Play queue in focus mode' : 'Turn into a queue', icon: v.queue ? 'play' : 'focus', fn: function () { if (v.queue) OW.pages.focus(PR.filtered(pid, st).filter(function (t) { return !Q.isDone(t); }), v.name); else store.commit('Made ' + v.name + ' a queue', function () { v.queue = true; }); } },
      { label: 'Rename', icon: 'text', fn: function () { UI.dialog({ title: 'Rename view', ok: 'Save', body: '<label class="lbl-t" for="rv">Name</label><input id="rv" class="inp" autofocus value="' + esc(v.name) + '">', onOk: function (d) { var n = d.querySelector('#rv').value.trim(); if (n) store.commit('Renamed view', function () { v.name = n; }); } }); } },
      { sep: true }, { label: 'Delete view', icon: 'trash', danger: true, fn: function () { store.commit('Deleted view ' + v.name, function (S) { S.views = S.views.filter(function (x) { return x.id !== v.id; }); }); st.saved = null; app.go('#/p/' + pid + '/' + st.view); } }
    ], { alignRight: true });
  });
  PR.setView = function (v) { var pid = cur(); if (!pid) return; app.vtNext = true; location.hash = '#/p/' + pid + '/' + v; };

  /* ---------- header actions ---------- */
  UI.act('fav', function (el) { var id = el.getAttribute('data-id'); store.commit('Favourites', function (S) { var i = S.favs.indexOf(id); if (i > -1) S.favs.splice(i, 1); else S.favs.push(id); }, { quiet: true }); });
  UI.act('health', function (el) {
    var p = Q.project(el.getAttribute('data-id'));
    UI.menu(el, [['on', 'On track'], ['risk', 'At risk'], ['off', 'Off track']].map(function (h) { return { label: h[1], checked: p.health === h[0], fn: function () { store.commit('Health: ' + h[1], function () { p.health = h[0]; }); } }; }));
  });
  UI.act('share', function (el) {
    var p = Q.project(el.getAttribute('data-id')), S = store.S;
    var guests = S.users.filter(function (u) { return u.role === 'guest' && (u.guestOf || []).indexOf(p.id) > -1; });
    UI.dialog({
      title: 'Share ' + p.name, ok: 'Send invite',
      body: '<p class="muted" style="margin-bottom:14px;font-size:13px">Guests see only tasks tagged <span class="tag cv">' + I('eye', 's') + 'client-visible</span> and comments not marked internal. They can comment and approve, not edit.</p>' +
        '<div class="fld"><label class="lbl-t" for="sh-e">Invite a client guest by email</label><input id="sh-e" class="inp" type="email" placeholder="name@client.com" autofocus><div class="err" hidden id="sh-err"></div></div>' +
        '<div class="mh" style="padding-left:0">People with access</div>' +
        p.members.map(function (m) { var u = Q.user(m); return '<div style="display:flex;align-items:center;gap:10px;padding:6px 0">' + UI.av(m, 'l') + '<span style="flex:1"><b style="font-weight:500">' + esc(u.name) + '</b><br><small class="muted">' + esc(u.title) + '</small></span><span class="tag">' + (u.role === 'guest' ? 'Guest' : u.role === 'owner' ? 'Owner' : u.role === 'admin' ? 'Admin' : 'Member') + '</span></div>'; }).join('') +
        '<div class="callout acc" style="margin-top:14px">' + I('globe') + '<span>Guests sign in at <b>' + esc(S.brand.domain || 'your custom domain') + '</b> and see your brand, not ours.</span></div>',
      onOk: function (d) {
        var e = d.querySelector('#sh-e').value.trim(), err = d.querySelector('#sh-err');
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { err.hidden = false; err.textContent = e ? 'That email looks incomplete — check the part after @.' : 'Add an email address to invite someone.'; return false; }
        store.commit('Invited ' + e + ' as a guest', function (S) { S.invites.push({ id: store.uid('i'), email: e, role: 'guest', project: p.id, at: Date.now(), by: Q.me() }); });
      }
    });
  });

  /* ---------- selection & bulk ---------- */
  PR.toggleSel = function (id, range) {
    var pid = cur(); if (!pid) return; var st = PR.state(pid), i = st.sel.indexOf(id);
    if (range && st.lastSel) {
      var ids = Array.prototype.map.call(document.querySelectorAll('[data-tid]'), function (e) { return e.getAttribute('data-tid'); });
      var a = ids.indexOf(st.lastSel), b = ids.indexOf(id); if (a > -1 && b > -1) { ids.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(function (x) { if (st.sel.indexOf(x) < 0) st.sel.push(x); }); }
    } else if (i > -1) st.sel.splice(i, 1); else st.sel.push(id);
    st.lastSel = id; markSel(st); bulkBar(st, pid);
  };
  PR.selAll = function (ids, on) { var st = PR.state(cur()); ids.forEach(function (id) { var i = st.sel.indexOf(id); if (on && i < 0) st.sel.push(id); if (!on && i > -1) st.sel.splice(i, 1); }); markSel(st); bulkBar(st, cur()); };
  PR.clearSel = function () { var pid = cur(); if (!pid) return false; var st = PR.state(pid); if (!st.sel.length) return false; st.sel = []; markSel(st); bulkBar(st, pid); return true; };
  function markSel(st) {
    document.querySelectorAll('[data-tid]').forEach(function (el) { var on = st.sel.indexOf(el.getAttribute('data-tid')) > -1; el.classList.toggle('sel', on); var cb = el.querySelector('.cb[data-sel]'); if (cb) cb.checked = on; });
    document.querySelectorAll('[data-selall]').forEach(function (cb) { var ids = cb.getAttribute('data-selall').split(','); var n = ids.filter(function (i) { return st.sel.indexOf(i) > -1; }).length; cb.checked = n === ids.length && n > 0; cb.indeterminate = n > 0 && n < ids.length; });
    var v = document.querySelector('.list'); if (v) v.classList.toggle('bulk-on', st.sel.length > 0);
  }
  PR.markSel = function () { var pid = cur(); if (pid) markSel(PR.state(pid)); };
  function bulkBar(st, pid) {
    var b = document.getElementById('bulk'); if (!b) return;
    st.sel = st.sel.filter(function (id) { var t = Q.task(id); return t && !t.archived; });
    if (!st.sel.length || Q.isGuest()) { b.classList.remove('on'); return; }
    b.innerHTML = '<b>' + st.sel.length + ' selected</b><span class="bsep"></span>' +
      '<button type="button" data-act="bulk" data-k="status">' + I('target') + 'Status</button>' +
      '<button type="button" data-act="bulk" data-k="who">' + I('user') + 'Assign</button>' +
      '<button type="button" data-act="bulk" data-k="pri">' + I('flag') + 'Priority</button>' +
      '<button type="button" data-act="bulk" data-k="due">' + I('calendar') + 'Reschedule</button>' +
      '<button type="button" data-act="bulk" data-k="tag">' + I('tag') + 'Tag</button>' +
      '<button type="button" data-act="bulk" data-k="move">' + I('folder') + 'Move</button>' +
      '<button type="button" data-act="bulk" data-k="archive">' + I('archive') + 'Archive</button><span class="bsep"></span>' +
      '<button type="button" data-act="bulk-clear" aria-label="Clear selection">' + I('x') + '</button>';
    b.classList.add('on');
  }
  UI.act('bulk-clear', function () { PR.clearSel(); });
  function preview(title, rows, apply, note) {
    var changed = rows.filter(function (r) { return !r.same; }).length;
    UI.dialog({
      title: title, ok: changed ? 'Apply to ' + changed + ' task' + (changed === 1 ? '' : 's') : 'Nothing to change',
      body: '<p class="muted" style="font-size:13px">Here is what this will do before anything changes. You can undo afterwards with <kbd>⌘</kbd><kbd>Z</kbd>.</p>' +
        '<div class="psum"><span class="tag">' + changed + ' will change</span>' + (rows.length - changed ? '<span class="tag">' + (rows.length - changed) + ' already set</span>' : '') + (note ? '<span class="tag cv">' + note + '</span>' : '') + '</div>' +
        '<div class="preview-list">' + rows.map(function (r) { return '<div class="pr' + (r.same ? ' same' : '') + '"><span class="mono">' + esc(r.t.num) + '</span><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(r.t.title) + '</span><span>' + r.from + '</span><span class="arrow">' + I('arr', 's') + '</span><span>' + r.to + '</span></div>'; }).join('') + '</div>',
      onOk: function () { if (!changed) return; apply(); PR.clearSel(); }
    });
  }
  UI.act('bulk', function (el) {
    var pid = cur(), st = PR.state(pid), ts = st.sel.map(Q.task).filter(Boolean), k = el.getAttribute('data-k'), n = ts.length;
    if (k === 'status') {
      var opts = pid === '*' ? CATS.map(function (c) { return { id: c[0], name: c[1], cat: c[0] }; }) : Q.project(pid).statuses;
      UI.menu(el, opts.map(function (s) { return { label: s.name, html: UI.sdot(s), fn: function () {
        var target = function (t) { if (pid !== '*') return s.id; return Q.statusByCat(Q.project(t.project), s.cat) || t.status; };
        preview('Change status of ' + n + ' tasks', ts.map(function (t) { var to = target(t); return { t: t, same: to === t.status, from: esc(Q.status(t).name), to: esc((OW.byId(Q.project(t.project).statuses, to) || {}).name || to) }; }),
          function () { store.commit('Status → ' + s.name + ' on ' + n + ' tasks', function () { ts.forEach(function (t) { OW.A.setStatus(t, target(t)); }); }); });
      } }; }));
    }
    if (k === 'who') UI.pickPeople(el, [], function (u) { if (!u) return; store.commit('Assigned ' + Q.user(u).name.split(' ')[0] + ' to ' + n + ' tasks', function () { ts.forEach(function (t) { if (t.assignees.indexOf(u) < 0) OW.A.assign(t, t.assignees.concat([u])); }); }); }, { single: true });
    if (k === 'pri') UI.pickPriority(el, -1, function (p) { store.commit('Priority → ' + UI.PRI[p] + ' on ' + n + ' tasks', function () { ts.forEach(function (t) { t.priority = p; store.log(t, 'set priority to ' + UI.PRI[p]); }); }); });
    if (k === 'tag') UI.pickTags(el, [], function (tags) { if (!tags.length) return; store.commit('Tagged ' + n + ' tasks', function () { ts.forEach(function (t) { tags.forEach(function (g) { if (t.tags.indexOf(g) < 0) t.tags.push(g); }); }); }); });
    if (k === 'due') {
      var shift = function (days, label) {
        preview('Reschedule ' + n + ' tasks ' + label, ts.map(function (t) { return { t: t, same: !t.due, from: t.due ? D.fmt(t.due) : 'No date', to: t.due ? D.fmt(D.add(t.due, days)) : 'No date' }; }),
          function () { store.commit('Rescheduled ' + n + ' tasks ' + label, function () { ts.forEach(function (t) { if (t.due) { t.due = D.add(t.due, days); if (t.start) t.start = D.add(t.start, days); store.log(t, 'moved due date to ' + D.fmt(t.due)); } }); }); }, 'start dates shift too');
      };
      UI.menu(el, [{ label: '+1 day', fn: function () { shift(1, 'by a day'); } }, { label: '+1 week', fn: function () { shift(7, 'by a week'); } }, { label: '−1 day', fn: function () { shift(-1, 'a day earlier'); } },
        { label: 'Set one date…', icon: 'calendar', fn: function () { UI.pickDate(el, null, function (d) { if (!d) return; preview('Set due date to ' + D.fmt(d), ts.map(function (t) { return { t: t, same: t.due === d, from: t.due ? D.fmt(t.due) : 'No date', to: D.fmt(d) }; }), function () { store.commit('Due ' + D.fmt(d) + ' on ' + n + ' tasks', function () { ts.forEach(function (t) { t.due = d; if (t.start && t.start > d) t.start = d; }); }); }); }); } }]);
    }
    if (k === 'move') UI.menu(el, Q.projectsVisible().map(function (p) { return { label: p.name, html: UI.pdot(p), fn: function () {
      preview('Move ' + n + ' tasks to ' + p.name, ts.map(function (t) { return { t: t, same: t.project === p.id, from: esc(Q.project(t.project).key), to: esc(p.key) }; }),
        function () { store.commit('Moved ' + n + ' tasks to ' + p.name, function () { ts.forEach(function (t) { if (t.project === p.id) return; t.project = p.id; if (!OW.byId(p.statuses, t.status)) t.status = Q.statusByCat(p, Q.cat(t)) || Q.firstStatus(p); Q.subs(t.id).forEach(function (s) { s.project = p.id; s.status = t.status; }); store.log(t, 'moved this to ' + p.name); }); }); }, 'status kept where it exists');
    } }; }), { search: 'Move to project…' });
    if (k === 'archive') preview('Archive ' + n + ' tasks', ts.map(function (t) { return { t: t, same: false, from: esc(Q.status(t).name), to: 'Archived' }; }), function () { store.commit('Archived ' + n + ' tasks', function () { ts.forEach(OW.A.remove); }); }, 'subtasks are archived too');
  });

  /* ---------- keyboard inside a project ---------- */
  PR.key = function (e) {
    var k = e.key, st = PR.state(cur());
    if (/^[1-6]$/.test(k)) { e.preventDefault(); PR.setView(VIEWS[+k - 1][0]); return true; }
    var rows = Array.prototype.slice.call(document.querySelectorAll('#vcanvas [data-tid]'));
    if (!rows.length) return false;
    var i = rows.indexOf(document.activeElement.closest && document.activeElement.closest('[data-tid]'));
    if (k === 'j' || k === 'k' || k === 'ArrowDown' && i > -1 || k === 'ArrowUp' && i > -1) {
      e.preventDefault(); var down = k === 'j' || k === 'ArrowDown'; i = i < 0 ? 0 : Math.max(0, Math.min(rows.length - 1, i + (down ? 1 : -1)));
      rows.forEach(function (r) { r.classList.remove('kfocus'); }); rows[i].classList.add('kfocus'); var f = rows[i].matches('button,a,[tabindex]') ? rows[i] : rows[i].querySelector('[data-act=open-task],.name,button') || rows[i]; f.focus(); rows[i].scrollIntoView({ block: 'nearest' }); return true;
    }
    if ((k === 'x' || k === 'X') && i > -1) { e.preventDefault(); PR.toggleSel(rows[i].getAttribute('data-tid'), e.shiftKey); return true; }
    if (k === 'Enter' && i > -1 && !document.activeElement.matches('button,a')) { e.preventDefault(); app.openTask(rows[i].getAttribute('data-tid')); return true; }
    return false;
  };

  /* ---------- quick inline create (shared) ---------- */
  PR.quickCreate = function (pid, title, extra) {
    extra = extra || {}; var p = Q.project(pid);
    return store.commit('Created ' + title, function () { return OW.A.create({ project: pid, title: title, status: extra.status || p.statuses[Math.min(1, p.statuses.length - 1)].id, assignees: extra.assignees || [Q.me()], due: extra.due || null, start: extra.start || null, priority: extra.priority || 0, order: extra.order }); });
  };
})();
