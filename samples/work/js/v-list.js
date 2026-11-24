/* Ordwell — List view (grouping, inline edit, subtasks, bulk select) and Table view (spreadsheet cells with
   keyboard navigation, custom columns of every type including formulas, resize, sort, footer totals). */
(function () {
  'use strict';
  var OW = window.OW, UI = OW.UI, Q = OW.Q, D = OW.D, I = UI.I, esc = UI.esc, store = OW.store, app = OW.app, PR = OW.project, F = OW.F;

  /* =============================== LIST =============================== */
  function row(t, vt, child) {
    var subs = Q.subs(t.id), st = PR.state(PR.cur()), exp = st.exp && st.exp[t.id], cm = store.S.comments.filter(function (c) { return c.task === t.id && (!Q.isGuest() || !c.internal); }).length;
    var p = Q.project(t.project), done = Q.isDone(t), g = Q.isGuest();
    var h = '<div class="lr' + (child ? ' child' : '') + (done ? ' done' : '') + '" data-tid="' + t.id + '" role="row"' + (vt ? ' style="view-transition-name:t' + t.id + '"' : '') + '>' +
      '<span class="cbw">' + (g ? '' : '<input type="checkbox" class="cb" data-sel aria-label="Select ' + esc(t.title) + '">') + '</span>' +
      (g ? UI.sdot(Q.status(t)) : '<button type="button" class="sbtn" data-act="pick-status" data-id="' + t.id + '" aria-label="Status: ' + esc(Q.status(t).name) + '. Change">' + UI.sdot(Q.status(t)) + '</button>') +
      '<span class="tt">' + (subs.length ? '<button type="button" class="sub-tg" data-act="toggle-subs" data-id="' + t.id + '" aria-expanded="' + !!exp + '" aria-label="' + (exp ? 'Hide' : 'Show') + ' ' + subs.length + ' subtasks">' + I('chr', 's') + '</button>' : '') +
      '<span class="kid">' + esc(t.num) + '</span><span class="name" data-act="' + (g ? 'open-task' : 'edit-title') + '" data-id="' + t.id + '" tabindex="0" role="button" aria-label="' + esc(t.title) + (g ? '' : ' — press Enter to rename') + '">' + esc(t.title) + '</span>' +
      (app.route.args[0] === '*' && !child ? '<span class="tag" style="flex:none">' + UI.pdot(p) + esc(p.key) + '</span>' : '') +
      t.tags.slice(0, 2).map(UI.tag).join('') + '</span>' +
      '<span class="meta">' +
      (subs.length ? '<span class="mini due" title="Subtasks">' + I('sub', 's') + subs.filter(Q.isDone).length + '/' + subs.length + '</span>' : '') +
      (cm ? '<span class="due" title="Comments">' + I('msg', 's') + cm + '</span>' : '') +
      (Q.blockedOpen(t) && !done ? '<span class="due over" title="Blocked">' + I('blocked', 's') + 'Blocked</span>' : '') +
      (g ? UI.due(t) : '<button type="button" class="pv" data-act="pick-due" data-id="' + t.id + '" aria-label="Due date: ' + (t.due ? D.fmt(t.due) : 'none') + '">' + (t.due ? UI.due(t) : '<span class="due faint">' + I('calendar', 's') + '</span>') + '</button>') +
      (g ? UI.prio(t.priority) : '<button type="button" class="pv" data-act="pick-pri" data-id="' + t.id + '" aria-label="Priority: ' + UI.PRI[t.priority] + '">' + UI.prio(t.priority) + '</button>') +
      (g ? UI.avs(t.assignees, 3, 's') : '<button type="button" class="pv" data-act="pick-who" data-id="' + t.id + '" aria-label="Assignees: ' + (t.assignees.map(function (a) { return Q.user(a).name; }).join(', ') || 'none') + '">' + (t.assignees.length ? UI.avs(t.assignees, 3, 's') : '<span class="av s more">' + I('user', 's') + '</span>') + '</button>') +
      '<button type="button" class="ibtn open" data-act="open-task" data-id="' + t.id + '" aria-label="Open ' + esc(t.title) + '">' + I('expand', 's') + '</button></span></div>';
    if (exp) subs.forEach(function (s) { h += row(s, false, true); });
    return h;
  }
  OW.views.list = function (el, c) {
    var st = c.st; st.coll = st.coll || {}; st.exp = st.exp || {};
    var list = PR.sort(c.tasks, st.sort), groups = PR.groups(c.pid, list, st.group), vt = list.length < 90 && st.group !== 'assignee';
    var h = '<div class="list" role="treegrid" aria-label="Tasks">';
    groups.forEach(function (g) {
      var open = !st.coll[g.key], ids = g.tasks.map(function (t) { return t.id; });
      var head = g.st ? UI.sdot(g.st) : g.uid ? UI.av(g.uid, 's') : g.p ? UI.pdot(g.p) : g.pri != null ? UI.prio(g.pri) : '';
      h += '<div class="lg-h" aria-expanded="' + open + '">' + (Q.isGuest() ? '' : '<input type="checkbox" class="cb" data-selall="' + ids.join(',') + '" aria-label="Select all in ' + esc(g.name) + '"' + (ids.length ? '' : ' disabled') + '>') +
        '<button type="button" class="tg" data-act="toggle-grp" data-k="' + g.key + '" aria-expanded="' + open + '">' + I('chd', 's chev') + head + '<span>' + esc(g.name) + '</span><span class="cnt">' + g.tasks.length + '</span></button></div>';
      if (!open) return;
      g.tasks.forEach(function (t) { h += row(t, vt); });
      if (c.pid !== '*' && !Q.isGuest()) h += '<button type="button" class="ladd" data-act="list-add" data-k="' + g.key + '">' + I('plus', 's') + 'Add task</button>';
    });
    if (!list.length) h += '<div class="empty"><div class="art">' + I('list') + '</div><h3>' + (c.st.filter.q || c.st.filter.who.length || c.st.filter.due || c.st.filter.tags.length ? 'No tasks match these filters' : 'Nothing here yet') + '</h3><p>' + (c.pid === '*' ? 'Tasks you can see across every project show up here.' : 'Press C to create the first task, or start from a template.') + '</p><button type="button" class="btn" data-act="clear-all-f">Clear filters</button></div>';
    el.innerHTML = h + '</div>';
    PR.markSel();
    var L = el.querySelector('.list');
    L.addEventListener('change', function (e) {
      if (e.target.matches('[data-sel]')) PR.toggleSel(e.target.closest('[data-tid]').getAttribute('data-tid'), e.shiftKey);
      if (e.target.matches('[data-selall]')) PR.selAll(e.target.getAttribute('data-selall').split(',').filter(Boolean), e.target.checked);
    });
    L.addEventListener('click', function (e) { if (e.target.matches('[data-sel]') && e.shiftKey) { e.preventDefault(); PR.toggleSel(e.target.closest('[data-tid]').getAttribute('data-tid'), true); } });
    L.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.matches('.name[data-act=edit-title]')) { e.preventDefault(); UI.acts['edit-title'](e.target); } });
  };
  UI.act('toggle-grp', function (el) { var st = PR.state(PR.cur()); st.coll[el.getAttribute('data-k')] = !st.coll[el.getAttribute('data-k')]; app.render(); });
  UI.act('toggle-subs', function (el) { var st = PR.state(PR.cur()), id = el.getAttribute('data-id'); st.exp[id] = !st.exp[id]; app.render(); });
  UI.act('edit-title', function (el) {
    var t = Q.task(el.getAttribute('data-id')); if (!t) return;
    var inp = document.createElement('input'); inp.className = 'name'; inp.value = t.title; inp.setAttribute('aria-label', 'Task title');
    el.replaceWith(inp); inp.focus(); inp.select();
    var done = false;
    function fin(save) { if (done) return; done = true; var v = inp.value.trim(); if (save && v && v !== t.title) store.commit('Renamed ' + t.num, function () { store.log(t, 'renamed this to “' + v + '”'); t.title = v; t.updated = Date.now(); }); else app.render(); }
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); fin(true); } if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fin(false); } });
    inp.addEventListener('blur', function () { fin(true); });
  });
  UI.act('list-add', function (el) {
    var k = el.getAttribute('data-k'), pid = PR.cur(), st = PR.state(pid), p = Q.project(pid);
    var box = document.createElement('div'); box.className = 'ladd-in'; box.innerHTML = I('plus', 's') + '<input type="text" placeholder="Task title, then Enter (Esc to stop)" aria-label="New task title">';
    el.replaceWith(box); var inp = box.querySelector('input'); inp.focus();
    var extra = {};
    if (st.group === 'status') extra.status = k; else if (st.group === 'assignee') extra.assignees = k === 'none' ? [] : [k]; else if (st.group === 'priority') extra.priority = +k.slice(1);
    else if (st.group === 'due') extra.due = { over: D.today(), today: D.today(), week: D.add(D.today(), 3), later: D.add(D.today(), 14) }[k] || null;
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); app.render(); }
      if (e.key === 'Enter' && inp.value.trim()) { e.preventDefault(); PR.quickCreate(pid, inp.value.trim(), extra); setTimeout(function () { var b = document.querySelector('[data-act=list-add][data-k="' + k + '"]'); if (b) b.click(); }, 20); }
    });
    inp.addEventListener('blur', function () { if (!inp.value.trim()) setTimeout(function () { if (document.body.contains(inp)) app.render(); }, 120); });
  });
  /* quick pickers used by list + board + panel */
  UI.act('pick-status', function (el) { var t = Q.task(el.getAttribute('data-id')); UI.pickStatus(el, t, function (s) { store.commit(t.num + ' → ' + OW.byId(Q.project(t.project).statuses, s).name, function () { OW.A.setStatus(t, s); }); }); });
  UI.act('pick-due', function (el) { var t = Q.task(el.getAttribute('data-id')); UI.pickDate(el, t.due, function (d) { store.commit(d ? 'Due ' + D.fmt(d) : 'Cleared due date', function () { t.due = d; if (d && t.start && t.start > d) t.start = d; if (d && !t.start) t.start = D.add(d, -Math.max(1, Math.round((t.est || 8) / 8))); store.log(t, d ? 'set due date to ' + D.fmt(d) : 'cleared the due date'); t.updated = Date.now(); }); }); });
  UI.act('pick-pri', function (el) { var t = Q.task(el.getAttribute('data-id')); UI.pickPriority(el, t.priority, function (p) { store.commit('Priority → ' + UI.PRI[p], function () { t.priority = p; store.log(t, 'set priority to ' + UI.PRI[p]); }); }); });
  UI.act('pick-who', function (el) { var t = Q.task(el.getAttribute('data-id')); UI.pickPeople(el, t.assignees, function (l) { store.commit('Assignees updated', function () { OW.A.assign(t, l); }); }, { project: t.project }); });

  /* =============================== TABLE =============================== */
  var TYPES = [['text', 'Text', 'text'], ['number', 'Number', 'hash'], ['inr', 'Currency (₹)', 'hash'], ['pct', 'Percent', 'hash'], ['select', 'Dropdown', 'sel'], ['date', 'Date', 'calendar'], ['people', 'People', 'users'], ['check', 'Checkbox', 'cbox'], ['formula', 'Formula', 'fx']];
  function cols(c) {
    var base = [
      { k: 'title', name: 'Task', ty: 'text', w: 320, ic: 'text' },
      { k: 'status', name: 'Status', ty: 'status', w: 150, ic: 'target' },
      { k: 'who', name: 'Assignees', ty: 'people', w: 130, ic: 'users' },
      { k: 'start', name: 'Start', ty: 'date', w: 104, ic: 'calendar' },
      { k: 'due', name: 'Due', ty: 'date', w: 120, ic: 'calendar' },
      { k: 'pri', name: 'Priority', ty: 'pri', w: 110, ic: 'flag' },
      { k: 'est', name: 'Estimate (h)', ty: 'number', w: 110, ic: 'clock', n: true },
      { k: 'logged', name: 'Logged (h)', ty: 'ro', w: 104, ic: 'clock', n: true }
    ];
    if (c.pid === '*') base.splice(1, 0, { k: 'project', name: 'Project', ty: 'ro', w: 170, ic: 'folder' });
    else Q.fieldsFor(c.pid).forEach(function (f) { base.push({ k: 'f:' + f.id, f: f, name: f.name, ty: f.type, w: f.type === 'formula' ? 160 : f.type === 'people' ? 140 : 130, ic: { number: 'hash', select: 'sel', date: 'calendar', people: 'users', check: 'cbox', formula: 'fx', text: 'text' }[f.type], n: f.type === 'number' || (f.type === 'formula' && f.fmt !== 'text') }); });
    var hidden = c.st.hide || {};
    return base.filter(function (x) { return !hidden[x.k]; });
  }
  function val(t, col) {
    switch (col.k) {
      case 'title': return t.title; case 'status': return Q.status(t).name; case 'who': return t.assignees.map(function (a) { return Q.user(a).name; }).join(', ');
      case 'start': return t.start; case 'due': return t.due; case 'pri': return t.priority; case 'est': return t.est || 0; case 'logged': return Math.round(Q.logged(t) / 6) / 10;
      case 'project': return Q.project(t.project).name;
    }
    var f = col.f; if (f.type === 'formula') { var r = F.eval(f.formula, t); return r.err ? { err: r.err } : r.v; }
    return t.fields[f.id];
  }
  function cellHtml(t, col) {
    var v = val(t, col);
    switch (col.k) {
      case 'title': return '<span class="tname"><span class="kid">' + esc(t.num) + '</span><span class="t">' + esc(t.title) + '</span></span>';
      case 'status': return UI.pill(t);
      case 'who': return t.assignees.length ? UI.avs(t.assignees, 4, 's') + ' <span class="muted" style="font-size:12px">' + esc(Q.user(t.assignees[0]).name.split(' ')[0]) + (t.assignees.length > 1 ? ' +' + (t.assignees.length - 1) : '') + '</span>' : '<span class="faint">—</span>';
      case 'start': return v ? D.fmt(v) : '<span class="faint">—</span>';
      case 'due': return v ? UI.due(t, true) : '<span class="faint">—</span>';
      case 'pri': return UI.prio(t.priority) + ' <span style="font-size:12.5px">' + (t.priority ? UI.PRI[t.priority] : '<span class="faint">—</span>') + '</span>';
      case 'est': return v ? UI.n(v) : '<span class="faint">—</span>';
      case 'logged': var over = t.est && v > t.est; return '<span' + (over ? ' class="neg"' : '') + '>' + (v ? UI.n(v) : '0') + '</span>';
      case 'project': var p = Q.project(t.project); return UI.pdot(p) + ' ' + esc(p.name);
    }
    var f = col.f;
    if (v && v.err) return '<span class="neg" title="' + esc(v.err) + '">#ERROR</span>';
    if (f.type === 'check') return '<input type="checkbox" class="cb" tabindex="-1" aria-label="' + esc(f.name) + '"' + (v ? ' checked' : '') + ' data-chk>';
    if (f.type === 'people') return v ? UI.av(v, 's') + ' ' + esc(Q.user(v).name.split(' ')[0]) : '<span class="faint">—</span>';
    if (v == null || v === '') return '<span class="faint">—</span>';
    var s = UI.fmtField(f, v);
    return typeof v === 'number' && v < 0 ? '<span class="neg">' + esc(s) + '</span>' : esc(s);
  }
  OW.views.table = function (el, c) {
    var st = c.st; st.w = st.w || {}; var C = cols(c), list = PR.sort(c.tasks, st.sort);
    if (st.tsort) { var tc = C.filter(function (x) { return x.k === st.tsort.k; })[0]; if (tc) list.sort(function (a, b) { var x = val(a, tc), y = val(b, tc); if (x && x.err) x = ''; if (y && y.err) y = ''; if (x == null) x = ''; if (y == null) y = ''; var r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y)); return st.tsort.dir * r; }); }
    var vt = list.length < 90, g = Q.isGuest();
    var h = '<div class="tbl-wrap" data-keep="tbl"><table class="grid" role="grid" aria-label="Task table" aria-rowcount="' + (list.length + 1) + '"><thead><tr><th class="stick" style="width:40px;left:0">' + (g ? '' : '<input type="checkbox" class="cb" data-selall="' + list.map(function (t) { return t.id; }).join(',') + '" aria-label="Select all rows">') + '</th>';
    C.forEach(function (col, ci) {
      var w = st.w[col.k] || col.w, srt = st.tsort && st.tsort.k === col.k ? (st.tsort.dir > 0 ? ' ↑' : ' ↓') : '';
      h += '<th style="width:' + w + 'px;min-width:' + w + 'px;max-width:' + w + 'px' + (ci === 0 ? ';left:40px' : '') + '" class="' + (ci === 0 ? 'stick ' : '') + (col.ty === 'formula' ? 'fx' : '') + '" data-ck="' + col.k + '" aria-sort="' + (srt ? (st.tsort.dir > 0 ? 'ascending' : 'descending') : 'none') + '"><span class="th"><button type="button" class="sort" data-act="th-menu" data-k="' + col.k + '">' + I(col.ic, 'ty') + esc(col.name) + srt + '</button></span><span class="rz" data-rz="' + col.k + '" aria-hidden="true"></span></th>';
    });
    if (c.pid !== '*' && !g) h += '<th class="addc"><button type="button" data-act="add-col" aria-label="Add a column" title="Add a column">' + I('plus') + '</button></th>';
    h += '</tr></thead><tbody>';
    list.forEach(function (t, ri) {
      h += '<tr data-tid="' + t.id + '" aria-rowindex="' + (ri + 2) + '"' + (vt ? ' style="view-transition-name:t' + t.id + '"' : '') + '><td class="stick" style="left:0;width:40px">' + (g ? '' : '<input type="checkbox" class="cb" data-sel aria-label="Select ' + esc(t.title) + '">') + '</td>';
      C.forEach(function (col, ci) {
        var ro = col.ty === 'ro' || col.ty === 'formula';
        h += '<td class="cell' + (ci === 0 ? ' stick' : '') + (col.n ? ' n' : '') + (ro ? (col.ty === 'formula' ? ' fxv' : ' ro') : '') + '" data-r="' + ri + '" data-c="' + ci + '" tabindex="-1" role="gridcell"' + (ci === 0 ? ' style="left:40px"' : '') + '>' + cellHtml(t, col) + '</td>';
      });
      if (c.pid !== '*' && !g) h += '<td></td>';
      h += '</tr>';
    });
    h += '</tbody><tfoot><tr><td class="stick" style="left:0"></td>';
    C.forEach(function (col, ci) {
      var out = '';
      if (ci === 0) out = '<b>' + list.length + '</b> tasks';
      else if (col.n || col.k === 'est' || col.k === 'logged') {
        var sum = 0, ok = true; list.forEach(function (t) { var v = val(t, col); if (v && v.err) ok = false; else sum += +v || 0; });
        out = ok ? 'Sum <b>' + (col.f ? UI.fmtField(col.f, sum) : UI.n(sum)) + '</b>' : '';
      } else if (col.k === 'status') { var dn = list.filter(Q.isDone).length; out = '<b>' + (list.length ? Math.round(dn / list.length * 100) : 0) + '%</b> done'; }
      else if (col.ty === 'check') { out = '<b>' + list.filter(function (t) { return val(t, col); }).length + '</b> checked'; }
      else if (col.k === 'due') { out = '<b>' + list.filter(Q.overdue).length + '</b> overdue'; }
      h += '<td' + (ci === 0 ? ' class="stick" style="left:40px"' : '') + (col.n ? ' class="n"' : '') + '>' + out + '</td>';
    });
    if (c.pid !== '*' && !g) h += '<td></td>';
    h += '</tr></tfoot></table></div>';
    if (!list.length) h += '<div class="empty"><div class="art">' + I('table') + '</div><h3>No rows to show</h3><p>Clear filters or add a task.</p></div>';
    el.innerHTML = h; el.style.height = 'calc(100vh - var(--demo-h) - var(--top-h) - 150px)';
    PR.markSel();
    grid(el, c, C, list, st);
  };
  function grid(el, c, C, list, st) {
    var tbl = el.querySelector('table'); if (!tbl) return; var sel = st.cell || null;
    function td(r, ci) { return tbl.querySelector('td[data-r="' + r + '"][data-c="' + ci + '"]'); }
    function focus(r, ci) { r = Math.max(0, Math.min(list.length - 1, r)); ci = Math.max(0, Math.min(C.length - 1, ci)); tbl.querySelectorAll('td.on').forEach(function (x) { x.classList.remove('on'); }); var x = td(r, ci); if (!x) return; x.classList.add('on'); x.focus({ preventScroll: false }); st.cell = sel = [r, ci]; }
    if (sel && td(sel[0], sel[1]) && el.contains(document.activeElement) === false && st.keepCell) { focus(sel[0], sel[1]); st.keepCell = false; }
    tbl.addEventListener('click', function (e) {
      var cb = e.target.closest('[data-sel],[data-selall]'); if (cb) return;
      var x = e.target.closest('td.cell'); if (!x) return; var r = +x.getAttribute('data-r'), ci = +x.getAttribute('data-c');
      var was = x.classList.contains('on'); focus(r, ci);
      if (e.target.closest('[data-chk]')) { e.preventDefault(); edit(r, ci); return; }
      if (was || e.detail === 2) edit(r, ci);
    });
    tbl.addEventListener('dblclick', function (e) { var x = e.target.closest('td.cell'); if (x && C[+x.getAttribute('data-c')].k === 'title') app.openTask(list[+x.getAttribute('data-r')].id); });
    tbl.addEventListener('change', function (e) {
      if (e.target.matches('[data-sel]')) PR.toggleSel(e.target.closest('[data-tid]').getAttribute('data-tid'));
      if (e.target.matches('[data-selall]')) PR.selAll(e.target.getAttribute('data-selall').split(',').filter(Boolean), e.target.checked);
    });
    tbl.addEventListener('keydown', function (e) {
      var x = e.target.closest('td.cell'); if (!x || x.classList.contains('ed')) return;
      var r = +x.getAttribute('data-r'), ci = +x.getAttribute('data-c'), k = e.key;
      var mv = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[k];
      if (mv) { e.preventDefault(); e.stopPropagation(); focus(r + mv[0], ci + mv[1]); return; }
      if (k === 'Tab') { e.preventDefault(); focus(r, ci + (e.shiftKey ? -1 : 1)); return; }
      if (k === 'Enter' || k === 'F2') { e.preventDefault(); e.stopPropagation(); edit(r, ci); return; }
      if (k === ' ' && C[ci].k === 'title') { e.preventDefault(); app.openTask(list[r].id); return; }
      if ((k === 'Backspace' || k === 'Delete') && C[ci].f && C[ci].ty !== 'formula') { e.preventDefault(); var t = list[r]; store.commit('Cleared ' + C[ci].name, function () { delete t.fields[C[ci].f.id]; }); st.keepCell = true; return; }
      if (k.length === 1 && !e.metaKey && !e.ctrlKey && ['text', 'number'].indexOf(C[ci].ty) > -1) { e.preventDefault(); edit(r, ci, k); }
    });
    function edit(r, ci, seed) {
      if (Q.isGuest()) return;
      var t = list[r], col = C[ci], x = td(r, ci); if (!t || !x) return; st.keepCell = true;
      var set = function (label, fn) { store.commit(label, fn); };
      if (col.ty === 'ro' || col.ty === 'formula') { if (col.ty === 'formula') { var rr = val(t, col); UI.toast(rr && rr.err ? 'Formula error: ' + esc(rr.err) : 'Calculated by the formula <b>' + esc(col.f.formula) + '</b>', { icon: 'fx' }); } return; }
      if (col.k === 'status') return UI.pickStatus(x, t, function (s) { set(t.num + ' → ' + OW.byId(Q.project(t.project).statuses, s).name, function () { OW.A.setStatus(t, s); }); });
      if (col.k === 'who') return UI.pickPeople(x, t.assignees, function (l) { set('Assignees updated', function () { OW.A.assign(t, l); }); }, { project: t.project });
      if (col.k === 'pri') return UI.pickPriority(x, t.priority, function (p) { set('Priority → ' + UI.PRI[p], function () { t.priority = p; }); });
      if (col.ty === 'date') return UI.pickDate(x, col.f ? t.fields[col.f.id] : t[col.k], function (d) { set(col.name + ' → ' + (d ? D.fmt(d) : 'none'), function () { if (col.f) t.fields[col.f.id] = d; else { t[col.k] = d; if (col.k === 'due' && d && t.start && t.start > d) t.start = d; if (col.k === 'start' && d && t.due && t.due < d) t.due = d; } }); });
      if (col.ty === 'select') return UI.pickOption(x, col.f.options, t.fields[col.f.id], function (o) { set(col.name + ' → ' + (o || 'empty'), function () { if (o == null) delete t.fields[col.f.id]; else t.fields[col.f.id] = o; }); }, true);
      if (col.ty === 'people') return UI.pickPeople(x, [], function (u) { set(col.name + ' → ' + (u ? Q.user(u).name : 'nobody'), function () { if (u) t.fields[col.f.id] = u; else delete t.fields[col.f.id]; }); }, { single: true, clear: true });
      if (col.ty === 'check') return set(col.name + (t.fields[col.f.id] ? ' unchecked' : ' checked'), function () { t.fields[col.f.id] = !t.fields[col.f.id]; });
      // text / number inline editor
      var cur = col.k === 'title' ? t.title : col.k === 'est' ? (t.est || '') : (t.fields[col.f.id] == null ? '' : t.fields[col.f.id]);
      x.classList.add('ed'); x.innerHTML = '<input type="' + (col.ty === 'number' ? 'number' : 'text') + '" step="any" aria-label="' + esc(col.name) + '">';
      var inp = x.querySelector('input'); inp.value = seed != null ? seed : cur; inp.focus(); if (seed == null) inp.select();
      var fin = function (save, dir) {
        if (!inp) return; var v = inp.value.trim(), i2 = inp; inp = null;
        if (save && String(v) !== String(cur)) {
          if (col.ty === 'number' && v !== '' && isNaN(+v)) { UI.toast('“' + esc(v) + '” isn’t a number'); app.render(); return; }
          if (col.k === 'title' && !v) { UI.toast('A task needs a title'); app.render(); return; }
          st.cell = [r + (dir || 0), ci];
          set(col.name + ' updated', function () { var nv = col.ty === 'number' ? (v === '' ? null : +v) : v; if (col.k === 'title') t.title = nv; else if (col.k === 'est') t.est = nv || 0; else if (nv == null) delete t.fields[col.f.id]; else t.fields[col.f.id] = nv; t.updated = Date.now(); });
        } else { x.classList.remove('ed'); x.innerHTML = cellHtml(t, col); focus(r + (dir || 0), ci); }
        void i2;
      };
      inp.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); fin(true, 1); } if (e.key === 'Escape') { e.preventDefault(); fin(false); } if (e.key === 'Tab') { e.preventDefault(); fin(true, 0); } });
      inp.addEventListener('blur', function () { fin(true); });
    }
    // column resize
    tbl.addEventListener('pointerdown', function (e) {
      var rz = e.target.closest('[data-rz]'); if (!rz) return; e.preventDefault();
      var k = rz.getAttribute('data-rz'), th = rz.closest('th'), x0 = e.clientX, w0 = th.offsetWidth; rz.classList.add('on');
      function mv(ev) { var w = Math.max(80, w0 + ev.clientX - x0); th.style.width = th.style.minWidth = th.style.maxWidth = w + 'px'; st.w[k] = w; }
      function upp() { rz.classList.remove('on'); removeEventListener('pointermove', mv); removeEventListener('pointerup', upp); }
      addEventListener('pointermove', mv); addEventListener('pointerup', upp);
    });
  }
  UI.act('th-menu', function (el) {
    var pid = PR.cur(), st = PR.state(pid), k = el.getAttribute('data-k'), f = k.indexOf('f:') === 0 ? Q.field(k.slice(2)) : null;
    var items = [{ label: 'Sort ascending', icon: 'sort', fn: function () { st.tsort = { k: k, dir: 1 }; app.render(); } }, { label: 'Sort descending', icon: 'sort', fn: function () { st.tsort = { k: k, dir: -1 }; app.render(); } }];
    if (st.tsort) items.push({ label: 'Clear sort', icon: 'x', fn: function () { st.tsort = null; app.render(); } });
    if (k !== 'title') items.push({ sep: true }, { label: 'Hide column', icon: 'eye', fn: function () { st.hide = st.hide || {}; st.hide[k] = 1; app.render(); UI.toast('Column hidden', { action: { label: 'Show all', fn: function () { st.hide = {}; app.render(); } } }); } });
    if (f && !Q.isGuest()) items.push({ label: 'Edit field', icon: 'settings', fn: function () { fieldDialog(pid, f); } }, { label: 'Delete field', icon: 'trash', danger: true, fn: function () {
      UI.confirm('Delete “' + f.name + '”?', 'Values in this column are removed from every task in the project. Formulas that use {' + esc(f.name) + '} will show an error until you edit them. You can undo this.', 'Delete field', function () {
        store.commit('Deleted field ' + f.name, function (S) { var p = Q.project(pid); p.fields = p.fields.filter(function (x) { return x !== f.id; }); S.fields = S.fields.filter(function (x) { return x.id !== f.id; }); S.tasks.forEach(function (t) { delete t.fields[f.id]; }); });
      }, true);
    } });
    UI.menu(el, items);
  });
  UI.act('add-col', function () { fieldDialog(PR.cur(), null); });

  function fieldDialog(pid, f) {
    var p = Q.project(pid), isNew = !f, ty = f ? (f.type === 'number' && f.fmt === 'inr' ? 'inr' : f.type === 'number' && f.fmt === 'pct' ? 'pct' : f.type) : 'number';
    var sample = Q.tasks(pid).slice(0, 4);
    var fmt = f && f.type === 'formula' ? f.fmt : 'inr';
    var tokens = ['Estimate', 'Logged', 'Due', 'Start', 'Priority', 'Subtasks'].concat(Q.fieldsFor(pid).filter(function (x) { return !f || x.id !== f.id; }).map(function (x) { return x.name; }));
    UI.dialog({
      title: isNew ? 'Add a column to ' + p.name : 'Edit “' + f.name + '”', ok: isNew ? 'Add column' : 'Save', wide: true,
      body: '<div class="fld"><label class="lbl-t" for="fd-n">Column name</label><input id="fd-n" class="inp" autofocus value="' + esc(f ? f.name : '') + '" placeholder="e.g. Margin"><div class="err" id="fd-ne" hidden></div></div>' +
        '<div class="fld"><span class="lbl-t" id="fd-tl">Type</span><div class="type-grid" role="group" aria-labelledby="fd-tl">' + TYPES.map(function (x) { return '<button type="button" data-ty="' + x[0] + '" aria-pressed="' + (x[0] === ty) + '"' + (!isNew && x[0] !== ty ? ' disabled style="opacity:.45"' : '') + '>' + I(x[2]) + x[1] + '</button>'; }).join('') + '</div>' + (isNew ? '' : '<p class="hint">The type of an existing column can’t change; create a new one instead.</p>') + '</div>' +
        '<div class="fld" id="fd-opts" hidden><label class="lbl-t" for="fd-o">Options, one per line</label><textarea id="fd-o" class="inp" rows="4">' + esc(f && f.options ? f.options.join('\n') : 'Low\nMedium\nHigh') + '</textarea></div>' +
        '<div class="fld" id="fd-fx" hidden><label class="lbl-t" for="fd-f">Formula</label><textarea id="fd-f" class="inp fx-editor" rows="2" spellcheck="false" placeholder="{Budget} - {Spent}">' + esc(f && f.formula ? f.formula : '') + '</textarea>' +
        '<div class="fx-tokens" aria-label="Insert a field">' + tokens.map(function (n) { return '<button type="button" data-tok="{' + esc(n) + '}">{' + esc(n) + '}</button>'; }).join('') + ['IF(', 'ROUND(', 'DAYS(', 'TODAY()', 'PCT(', 'MAX('].map(function (n) { return '<button type="button" data-tok="' + n + '">' + n + '</button>'; }).join('') + '</div>' +
        '<div style="display:flex;gap:10px;align-items:center;margin-top:10px"><label class="lbl-t" for="fd-fm" style="margin:0">Show result as</label><select id="fd-fm" class="inp" style="width:auto"><option value="inr"' + (fmt === 'inr' ? ' selected' : '') + '>Currency (₹)</option><option value="num"' + (fmt === 'num' ? ' selected' : '') + '>Number</option><option value="pct"' + (fmt === 'pct' ? ' selected' : '') + '>Percent</option><option value="text"' + (fmt === 'text' ? ' selected' : '') + '>Text</option></select></div>' +
        '<div class="err" id="fd-fe" hidden></div><div class="fx-prev" id="fd-pv" aria-live="polite"></div><p class="hint">Use {Field name} for values, + − × ÷, & to join text, and IF(), ROUND(), DAYS(a, b), PCT(part, whole), MIN(), MAX(), TODAY().</p></div>',
      onMount: function (d) {
        var fx = d.querySelector('#fd-f');
        function sync() {
          d.querySelectorAll('[data-ty]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-ty') === ty); });
          d.querySelector('#fd-opts').hidden = ty !== 'select'; d.querySelector('#fd-fx').hidden = ty !== 'formula'; if (ty === 'formula') prev();
        }
        function prev() {
          var src = fx.value.trim(), err = src ? F.check(src, pid) : 'Write a formula, for example {Budget} - {Spent}', e = d.querySelector('#fd-fe'), pv = d.querySelector('#fd-pv');
          e.hidden = !err || !src; e.textContent = err || '';
          var fm = d.querySelector('#fd-fm').value;
          pv.innerHTML = !src || err ? '' : sample.map(function (t) { var r = F.eval(src, t); return '<div><span>' + esc(t.title.slice(0, 42)) + '</span><b>' + (r.err ? '<span class="neg">' + esc(r.err) + '</span>' : esc(UI.fmtField({ type: 'formula', fmt: fm }, r.v))) + '</b></div>'; }).join('');
        }
        d.addEventListener('click', function (e) {
          var b = e.target.closest('[data-ty]'); if (b && !b.disabled) { ty = b.getAttribute('data-ty'); sync(); }
          var tk = e.target.closest('[data-tok]'); if (tk) { var s = fx.selectionStart || fx.value.length; fx.value = fx.value.slice(0, s) + tk.getAttribute('data-tok') + fx.value.slice(fx.selectionEnd || s); fx.focus(); prev(); }
        });
        fx.addEventListener('input', prev); d.querySelector('#fd-fm').addEventListener('change', prev);
        sync();
      },
      onOk: function (d) {
        var name = d.querySelector('#fd-n').value.trim(), ne = d.querySelector('#fd-ne');
        if (!name) { ne.hidden = false; ne.textContent = 'Name the column so it reads well in the header.'; return false; }
        if (Q.fieldsFor(pid).some(function (x) { return x.name.toLowerCase() === name.toLowerCase() && x !== f; }) || ['estimate', 'logged', 'due', 'start', 'title', 'status', 'priority'].indexOf(name.toLowerCase()) > -1) { ne.hidden = false; ne.textContent = 'There’s already a column called “' + name + '”.'; return false; }
        var formula = d.querySelector('#fd-f').value.trim();
        if (ty === 'formula') { var er = formula ? F.check(formula, pid) : 'Write a formula first.'; if (er) { var e = d.querySelector('#fd-fe'); e.hidden = false; e.textContent = er; return false; } }
        var opts = d.querySelector('#fd-o').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
        store.commit(isNew ? 'Added column ' + name : 'Updated column ' + name, function (S) {
          if (isNew) {
            var nf = { id: store.uid('f'), project: pid, name: name, type: ty === 'inr' || ty === 'pct' ? 'number' : ty, fmt: ty === 'inr' ? 'inr' : ty === 'pct' ? 'pct' : ty === 'formula' ? d.querySelector('#fd-fm').value : 'num' };
            if (ty === 'select') nf.options = opts; if (ty === 'formula') nf.formula = formula;
            S.fields.push(nf); p.fields.push(nf.id);
          } else {
            var old = f.name; f.name = name; if (f.type === 'select') f.options = opts; if (f.type === 'formula') { f.formula = formula; f.fmt = d.querySelector('#fd-fm').value; }
            if (old !== name) S.fields.forEach(function (x) { if (x.formula) x.formula = x.formula.split('{' + old + '}').join('{' + name + '}'); });
          }
        });
      }
    });
  }
  OW.fieldDialog = fieldDialog;
})();
