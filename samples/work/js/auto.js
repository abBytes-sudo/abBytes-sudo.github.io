/* Ordwell — Automations: list with plain-English sentences, recipes, a visual When → If → Then builder with a
   dry-run "Test on a task", and the run log. The engine itself lives in store.js (OW.fire). */
(function () {
  'use strict';
  var OW = window.OW, UI = OW.UI, Q = OW.Q, D = OW.D, I = UI.I, esc = UI.esc, store = OW.store, app = OW.app;
  var B = { draft: null, test: null, logF: '' };
  var CATN = { done: 'Done', review: 'In review', review2: 'Waiting on client', active: 'In progress', blocked: 'Blocked', todo: 'To do', backlog: 'Backlog' };
  var TRIG = [['status', 'Status changes'], ['created', 'A task is created'], ['assigned', 'Someone is assigned'], ['comment', 'A comment is added'], ['subtasks-done', 'All subtasks are done'], ['due-soon', 'Due date is tomorrow']];
  var ACTS = [['move', 'Move to project', 'folder'], ['notify', 'Send a notification', 'bell'], ['assign', 'Assign someone', 'user'], ['priority', 'Set priority', 'flag'], ['tag', 'Add a tag', 'tag'], ['comment', 'Post a comment', 'msg'], ['status', 'Change status', 'target'], ['due', 'Set due date', 'calendar']];

  function pname(id) { return id === '*' ? 'any project' : (Q.project(id) || { name: '?' }).name; }
  function uname(id) { return id === 'owner' ? 'the project owner' : id === 'assignees' ? 'the assignees' : (Q.user(id) || { name: '?' }).name; }
  function statusLabel(au) { var to = au.trigger.to; if (CATN[to]) return CATN[to]; var p = au.project !== '*' && Q.project(au.project); var s = p && OW.byId(p.statuses, to); return s ? s.name : to; }
  function sentence(au) {
    var tr = au.trigger, w;
    switch (tr.type) {
      case 'status': w = 'When status changes to <em>' + esc(statusLabel(au)) + '</em>'; break;
      case 'created': w = 'When a task is created' + (tr.via === 'form' ? ' <em>from a form</em>' : ''); break;
      case 'assigned': w = 'When ' + (tr.who ? '<em>' + esc(uname(tr.who)) + '</em> is' : 'someone is') + ' assigned'; break;
      case 'comment': w = 'When a comment is added'; break;
      case 'subtasks-done': w = 'When <em>all subtasks</em> are done'; break;
      case 'due-soon': w = 'When a task is <em>due tomorrow</em>'; break;
      default: w = 'When something happens';
    }
    w += ' in <em>' + esc(pname(au.project)) + '</em>';
    if (au.conds.length) w += ', if ' + au.conds.map(condText).join(' and ');
    w += ', then ' + au.actions.map(actText).join(', then ') + '.';
    return w;
  }
  function condText(c) { if (c.field === 'priority') return 'priority is <em>' + UI.PRI[c.value] + ' or higher</em>'; if (c.field === 'status') return 'it’s <em>not done</em>'; if (c.field === 'tag') return 'it’s tagged <em>' + esc(c.value) + '</em>'; if (c.field === 'assignee') return '<em>' + esc(uname(c.value)) + '</em> is assigned'; return ''; }
  function actText(a) {
    switch (a.type) {
      case 'move': return 'move to <em>' + esc(pname(a.project)) + '</em>'; case 'notify': return 'notify <em>' + esc(uname(a.who)) + '</em>';
      case 'assign': return 'assign <em>' + esc(uname(a.who)) + '</em>'; case 'priority': return 'set priority to <em>' + UI.PRI[a.value] + '</em>';
      case 'tag': return 'add tag <em>' + esc(a.value || '…') + '</em>'; case 'comment': return 'post “' + esc((a.text || '').slice(0, 40)) + '”';
      case 'status': return 'move it to <em>' + esc(CATN[a.to] || a.to) + '</em>'; case 'due': return 'set due date to <em>today + ' + (a.days || 0) + ' days</em>';
    }
    return a.type;
  }
  OW.autoSentence = sentence;

  OW.routes.auto = function (main, args) {
    if (args[0] === 'log') return log(main);
    if (args[0]) return builder(main, args[0]);
    var S = store.S, ws = S.automations.filter(function (a) { return a.project === '*' || Q.projectsVisible().indexOf(Q.project(a.project)) > -1; });
    var runs7 = S.runs.filter(function (r) { return Date.now() - r.at < 7 * 864e5 && r.status === 'ok'; }).length;
    var h = '<div class="page"><div class="page-h"><div><h1>Automations</h1><p>' + ws.filter(function (a) { return a.on; }).length + ' active · ran ' + runs7 + ' times in the last 7 days, saving roughly ' + UI.hm(runs7 * 3) + ' of clicking.</p></div><span class="sp"></span><a class="btn" href="#/auto/log">' + I('list') + 'Run log</a><a class="btn pri" href="#/auto/new">' + I('plus') + 'New automation</a></div>';
    h += '<div class="au-grid">';
    ws.forEach(function (a) {
      var rs = S.runs.filter(function (r) { return r.auto === a.id; }).sort(function (x, y) { return y.at - x.at; });
      h += '<div class="au-card"><div class="ah"><span class="nb" style="width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:' + (a.on ? 'var(--accent-bg)' : 'var(--sunk)') + ';color:' + (a.on ? 'var(--accent)' : 'var(--faint)') + '">' + I('bolt') + '</span><b>' + esc(a.name) + '</b><label class="switch" title="' + (a.on ? 'On' : 'Off') + '"><input type="checkbox" data-change="au-toggle" data-id="' + a.id + '"' + (a.on ? ' checked' : '') + ' aria-label="' + esc(a.name) + ' is ' + (a.on ? 'on' : 'off') + '"><i></i></label></div>' +
        '<p class="au-sent">' + sentence(a) + '</p><div class="af">' + UI.av(a.by, 's') + '<span>' + esc(Q.user(a.by).name.split(' ')[0]) + '</span><span>·</span><span>' + (rs.length ? rs.length + ' runs · last ' + D.ago(rs[0].at) : 'Hasn’t run yet') + '</span><span class="sp"></span><a class="btn sm" href="#/auto/' + a.id + '">Edit</a></div></div>';
    });
    h += '</div><div class="sec-h" style="margin-top:34px"><h2>Start from a recipe</h2><span class="faint" style="font-size:12.5px">One click fills the builder; change anything before you save.</span></div><div class="recipes">';
    RECIPES.forEach(function (r, i) { h += '<button type="button" class="recipe" data-act="au-recipe" data-i="' + i + '"><b>' + esc(r.name) + '</b>' + sentence(r).replace(/<\/?em>/g, '') + '</button>'; });
    h += '</div></div>';
    main.innerHTML = h;
  };
  var RECIPES = [
    { name: 'Archive approved work', project: 'p2', trigger: { type: 'status', to: 'done' }, conds: [], actions: [{ type: 'move', project: 'p7' }, { type: 'notify', who: 'owner' }] },
    { name: 'Urgent bugs to the top', project: 'p8', trigger: { type: 'created', via: 'form' }, conds: [{ field: 'priority', op: 'gte', value: 3 }], actions: [{ type: 'assign', who: 'u8' }, { type: 'tag', value: 'bug' }, { type: 'notify', who: 'u4' }] },
    { name: 'Client review hand-off', project: 'p1', trigger: { type: 'status', to: 'client' }, conds: [], actions: [{ type: 'tag', value: 'client-visible' }, { type: 'comment', text: 'This is ready for your review — reply here with approval or changes.' }, { type: 'due', days: 2 }] },
    { name: 'Snag list escalation', project: 'p9', trigger: { type: 'status', to: 'snag' }, conds: [], actions: [{ type: 'priority', value: 4 }, { type: 'notify', who: 'owner' }] },
    { name: 'Welcome new assignees', project: '*', trigger: { type: 'assigned' }, conds: [], actions: [{ type: 'comment', text: 'You’re on this now — the brief and latest files are above.' }] }
  ];
  UI.act('au-toggle', function (el) { var a = OW.byId(store.S.automations, el.getAttribute('data-id')); store.commit(a.name + (el.checked ? ' turned on' : ' turned off'), function () { a.on = el.checked; }); });
  UI.act('au-recipe', function (el) { var r = RECIPES[+el.getAttribute('data-i')]; B.draft = JSON.parse(JSON.stringify(r)); B.draft.id = null; B.draft.on = true; B.test = null; app.go('#/auto/new'); });

  /* ---------- builder ---------- */
  function builder(main, id) {
    var S = store.S;
    if (id === 'new') { if (!B.draft || B.draft.id) { B.draft = { id: null, name: '', project: 'p1', on: true, trigger: { type: 'status', to: 'done' }, conds: [], actions: [{ type: 'notify', who: 'owner' }] }; B.test = null; } }
    else { var src = OW.byId(S.automations, id); if (!src) { app.go('#/auto'); return; } if (!B.draft || B.draft.id !== id) { B.draft = JSON.parse(JSON.stringify(src)); B.test = null; } }
    var a = B.draft, ps = Q.projectsVisible(), p = a.project !== '*' && Q.project(a.project);
    var statusOpts = (p ? p.statuses.map(function (s) { return [s.id, s.name]; }) : []).concat([['done', 'Any “done” status'], ['review', 'Any review status']]);
    var sel = function (k, opts, cur, extra) { return '<select class="inp" data-change="au-set" data-k="' + k + '"' + (extra || '') + ' aria-label="' + k + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; };
    var people = S.users.filter(function (u) { return u.role !== 'guest'; }).map(function (u) { return [u.id, u.name]; });
    var h = '<div class="page"><div class="page-h"><div><div class="eyebrow"><a href="#/auto">' + I('chl', 's') + ' Automations</a></div><h1>' + (a.id ? 'Edit automation' : 'New automation') + '</h1><p class="au-sent" style="max-width:640px;margin-top:8px">' + sentence(a) + '</p></div><span class="sp"></span>' +
      (a.id ? '<button type="button" class="btn ghost danger" data-act="au-del">' + I('trash') + 'Delete</button>' : '') + '<button type="button" class="btn" data-act="au-test">' + I('play', 's') + 'Test on a task</button><button type="button" class="btn pri" data-act="au-save">' + I('check') + 'Save</button></div>';
    h += '<div class="builder">';
    h += '<div class="fld" style="display:flex;gap:10px;align-items:flex-end"><div style="flex:1"><label class="lbl-t" for="au-n">Name</label><input id="au-n" class="inp" data-input="au-name" value="' + esc(a.name) + '" placeholder="e.g. Archive approved work"><div class="err" id="au-ne" hidden></div></div><label class="switch" style="height:34px"><input type="checkbox" data-change="au-on"' + (a.on ? ' checked' : '') + '><i></i>On</label></div>';
    h += '<div class="node when" data-node="when"><div class="nh"><span class="nb">' + I('bolt', 's') + '</span><b>When <small>— the trigger</small></b></div><div class="nrow">' +
      sel('trigger.type', TRIG, a.trigger.type) +
      (a.trigger.type === 'status' ? '<span class="muted">to</span>' + sel('trigger.to', statusOpts, a.trigger.to) : '') +
      (a.trigger.type === 'created' ? '<span class="muted">from</span>' + sel('trigger.via', [['any', 'anywhere'], ['form', 'a form'], ['app', 'the app']], a.trigger.via || 'any') : '') +
      (a.trigger.type === 'assigned' ? sel('trigger.who', [['', 'anyone']].concat(people), a.trigger.who || '') : '') +
      '</div><div class="nrow" style="margin-top:8px"><span class="muted">in</span>' + sel('project', [['*', 'Any project in this workspace']].concat(ps.map(function (x) { return [x.id, x.name]; })), a.project) + '</div>' +
      (a.trigger.type === 'due-soon' ? '<p class="hint">Checked once a day at 9:00 IST for every open task.</p>' : '') + '</div>';
    h += '<div class="link-l"></div><div class="node if" data-node="if"><div class="nh"><span class="nb">' + I('filter', 's') + '</span><b>Only if <small>— optional conditions</small></b></div>';
    a.conds.forEach(function (c, i) {
      h += '<div class="nrow" style="margin-bottom:6px">' + sel('conds.' + i + '.field', [['priority', 'Priority is at least'], ['status', 'Task is not done'], ['tag', 'Task has tag'], ['assignee', 'Assignee includes']], c.field) +
        (c.field === 'priority' ? sel('conds.' + i + '.value', [[4, 'Urgent'], [3, 'High'], [2, 'Medium'], [1, 'Low']], c.value) : c.field === 'tag' ? '<input class="inp" data-input="au-set-in" data-k="conds.' + i + '.value" value="' + esc(c.value || '') + '" placeholder="tag" aria-label="Tag">' : c.field === 'assignee' ? sel('conds.' + i + '.value', people, c.value) : '') +
        '<button type="button" class="ibtn" data-act="au-rm" data-k="conds" data-i="' + i + '" aria-label="Remove condition">' + I('x', 's') + '</button></div>';
    });
    h += '<button type="button" class="btn sm ghost" data-act="au-add-cond">' + I('plus', 's') + 'Add condition</button></div>';
    a.actions.forEach(function (x, i) {
      h += '<div class="link-l"></div><div class="node then" data-node="a' + i + '"><div class="nh"><span class="nb">' + I((ACTS.filter(function (y) { return y[0] === x.type; })[0] || [0, 0, 'spark'])[2], 's') + '</span><b>Then <small>— step ' + (i + 1) + '</small></b>' +
        (i > 0 ? '<button type="button" class="ibtn" data-act="au-mv" data-i="' + i + '" data-d="-1" aria-label="Move step up">' + I('chu', 's') + '</button>' : '') + (i < a.actions.length - 1 ? '<button type="button" class="ibtn" data-act="au-mv" data-i="' + i + '" data-d="1" aria-label="Move step down">' + I('chd', 's') + '</button>' : '') +
        '<button type="button" class="ibtn" data-act="au-rm" data-k="actions" data-i="' + i + '" aria-label="Remove step">' + I('x', 's') + '</button></div><div class="nrow">' + sel('actions.' + i + '.type', ACTS.map(function (y) { return [y[0], y[1]]; }), x.type);
      if (x.type === 'move') h += sel('actions.' + i + '.project', S.projects.filter(function (y) { var sp = Q.space(y.space); return sp && sp.ws === S.ws; }).map(function (y) { return [y.id, y.name]; }), x.project);
      if (x.type === 'notify') h += sel('actions.' + i + '.who', [['owner', 'Project owner'], ['assignees', 'Assignees']].concat(people), x.who);
      if (x.type === 'assign') h += sel('actions.' + i + '.who', people, x.who);
      if (x.type === 'priority') h += sel('actions.' + i + '.value', [[4, 'Urgent'], [3, 'High'], [2, 'Medium'], [1, 'Low'], [0, 'None']], x.value);
      if (x.type === 'tag') h += '<input class="inp" data-input="au-set-in" data-k="actions.' + i + '.value" value="' + esc(x.value || '') + '" placeholder="tag name" aria-label="Tag">';
      if (x.type === 'status') h += sel('actions.' + i + '.to', [['active', 'In progress'], ['review', 'In review'], ['review2', 'Waiting on client'], ['done', 'Done']], x.to);
      if (x.type === 'due') h += '<span class="muted">today +</span><input class="inp" type="number" min="0" max="60" style="max-width:90px;min-width:0" data-input="au-set-in" data-k="actions.' + i + '.days" value="' + (x.days || 0) + '" aria-label="Days from today"><span class="muted">days</span>';
      h += '</div>' + (x.type === 'comment' ? '<textarea class="inp" style="margin-top:8px" rows="2" data-input="au-set-in" data-k="actions.' + i + '.text" placeholder="Comment text" aria-label="Comment text">' + esc(x.text || '') + '</textarea>' : '') + '</div>';
    });
    h += '<div class="add-step"><button type="button" data-act="au-add-act">' + I('plus', 's') + 'Add a step</button></div>';
    if (B.test) {
      var tt = Q.task(B.test.task);
      h += '<div class="callout acc" style="margin-top:18px" role="status">' + I('play') + '<div><b>Test run on ' + esc(tt ? tt.num + ' ' + tt.title : 'task') + '</b> — nothing was changed:<ol style="margin:6px 0 0 18px;padding:0">' + B.test.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div></div>';
    }
    h += '</div></div>';
    main.innerHTML = h;
    if (B.pulse) { var nodes = main.querySelectorAll('.node'); nodes.forEach(function (n, i) { setTimeout(function () { n.classList.add('pulse'); }, i * 180); }); B.pulse = false; }
  }
  function setPath(obj, path, v) { var ks = path.split('.'), o = obj; for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = v; }
  UI.act('au-set', function (el) {
    var k = el.getAttribute('data-k'), v = el.value;
    if (/\.value$/.test(k) && v !== '' && !isNaN(+v)) v = +v;
    setPath(B.draft, k, v);
    if (k === 'trigger.type') B.draft.trigger = { type: v, to: v === 'status' ? 'done' : undefined };
    if (/actions\.\d+\.type/.test(k)) { var i = +k.split('.')[1]; B.draft.actions[i] = { type: v, project: 'p7', who: 'owner', value: v === 'priority' ? 3 : '', to: 'review', days: 2, text: '' }; if (v === 'assign') B.draft.actions[i].who = 'u7'; }
    if (/conds\.\d+\.field/.test(k)) { var j = +k.split('.')[1]; B.draft.conds[j] = { field: v, op: v === 'priority' ? 'gte' : v === 'status' ? 'notdone' : 'eq', value: v === 'priority' ? 3 : v === 'assignee' ? 'u1' : '' }; }
    if (k === 'project' && B.draft.trigger.type === 'status' && ['done', 'review'].indexOf(B.draft.trigger.to) < 0) B.draft.trigger.to = 'done';
    B.test = null; app.render();
  });
  UI.act('au-set-in', function (el) { var k = el.getAttribute('data-k'), v = el.value; if (/days$/.test(k)) v = +v || 0; setPath(B.draft, k, v); var s = document.querySelector('.page-h .au-sent'); if (s) s.innerHTML = sentence(B.draft); });
  UI.act('au-name', function (el) { B.draft.name = el.value; });
  UI.act('au-on', function (el) { B.draft.on = el.checked; });
  UI.act('au-add-cond', function () { B.draft.conds.push({ field: 'priority', op: 'gte', value: 3 }); app.render(); });
  UI.act('au-add-act', function () {
    var btn = document.querySelector('[data-act=au-add-act]');
    UI.menu(btn, ACTS.map(function (y) { return { label: y[1], icon: y[2], fn: function () { B.draft.actions.push({ type: y[0], project: 'p7', who: y[0] === 'assign' ? 'u7' : 'owner', value: y[0] === 'priority' ? 3 : '', to: 'review', days: 2, text: '' }); B.test = null; app.render(); } }; }));
  });
  UI.act('au-rm', function (el) { var k = el.getAttribute('data-k'), i = +el.getAttribute('data-i'); if (k === 'actions' && B.draft.actions.length < 2) { UI.toast('An automation needs at least one step'); return; } B.draft[k].splice(i, 1); B.test = null; app.render(); });
  UI.act('au-mv', function (el) { var i = +el.getAttribute('data-i'), j = i + +el.getAttribute('data-d'), a = B.draft.actions; var x = a.splice(i, 1)[0]; a.splice(j, 0, x); app.render(); });
  UI.act('au-test', function (el) {
    var a = B.draft, ts = (a.project === '*' ? Q.tasks('*') : Q.tasks(a.project)).filter(function (t) { return !Q.isDone(t); }).slice(0, 30);
    UI.menu(el, [{ head: 'Run against… (dry run, nothing changes)' }].concat(ts.map(function (t) { return { label: t.num + ' ' + t.title, html: UI.sdot(Q.status(t)), fn: function () { B.test = { task: t.id, steps: store.dryRun(a, t) }; B.pulse = true; app.render(); } }; })), { search: 'Find a task…' });
  });
  UI.act('au-save', function () {
    var a = B.draft; if (!a.name.trim()) { var e = document.getElementById('au-ne'); e.hidden = false; e.textContent = 'Name it after what it does, like “Archive approved work”.'; document.getElementById('au-n').focus(); return; }
    if (a.actions.some(function (x) { return x.type === 'tag' && !String(x.value || '').trim(); })) { UI.toast('Give the “Add a tag” step a tag name'); return; }
    var id = a.id;
    store.commit((id ? 'Saved ' : 'Created ') + a.name, function (S) {
      if (id) { var src = OW.byId(S.automations, id); Object.keys(a).forEach(function (k) { src[k] = JSON.parse(JSON.stringify(a[k])); }); }
      else { id = store.uid('au'); var n = JSON.parse(JSON.stringify(a)); n.id = id; n.by = Q.me(); n.created = Date.now(); S.automations.push(n); }
    });
    B.draft = null; app.go('#/auto');
  });
  UI.act('au-del', function () { var a = B.draft; UI.confirm('Delete “' + a.name + '”?', 'It stops running straight away. Past runs stay in the log.', 'Delete automation', function () { store.commit('Deleted ' + a.name, function (S) { S.automations = S.automations.filter(function (x) { return x.id !== a.id; }); }); B.draft = null; app.go('#/auto'); }, true); });

  /* ---------- run log ---------- */
  function log(main) {
    var S = store.S, runs = S.runs.slice().sort(function (a, b) { return b.at - a.at; }).filter(function (r) { return !B.logF || r.auto === B.logF; });
    var h = '<div class="page"><div class="page-h"><div><div class="eyebrow"><a href="#/auto">' + I('chl', 's') + ' Automations</a></div><h1>Run log</h1><p>Every time a rule fires: what triggered it, what it did, and how long it took.</p></div><span class="sp"></span><select class="inp" style="width:auto" data-change="au-logf" aria-label="Filter by automation"><option value="">All automations</option>' + S.automations.map(function (a) { return '<option value="' + a.id + '"' + (B.logF === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('') + '</select></div>';
    h += '<div class="card" style="overflow:auto"><table class="runlog"><thead><tr><th>When</th><th>Automation</th><th>Task</th><th>Result</th><th>Steps</th><th style="text-align:right">Time</th></tr></thead><tbody>';
    if (!runs.length) h += '<tr><td colspan="6"><div class="empty" style="padding:30px"><h3>No runs yet</h3><p>Change a task’s status to see rules fire here.</p></div></td></tr>';
    runs.slice(0, 120).forEach(function (r) {
      var a = OW.byId(S.automations, r.auto), t = Q.task(r.task);
      h += '<tr><td style="white-space:nowrap"><b style="font-weight:500">' + D.ago(r.at) + '</b><br><small class="faint">' + new Date(r.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</small></td><td>' + (a ? '<a href="#/auto/' + a.id + '" style="font-weight:500">' + esc(a.name) + '</a>' : '<span class="faint">Deleted rule</span>') + '</td><td>' + (t ? '<button type="button" data-act="open-task" data-id="' + t.id + '" style="text-align:left"><span class="mono">' + esc(t.num) + '</span> ' + esc(t.title) + '</button>' : '<span class="faint">—</span>') + '</td>' +
        '<td><span class="st ' + r.status + '"><i></i>' + (r.status === 'ok' ? 'Succeeded' : 'Skipped') + '</span></td><td class="steps">' + r.steps.map(esc).join('<br>') + '</td><td style="text-align:right" class="mono">' + r.ms + ' ms</td></tr>';
    });
    h += '</tbody></table></div></div>';
    main.innerHTML = h;
  }
  UI.act('au-logf', function (el) { B.logF = el.value; app.render(); });
})();
