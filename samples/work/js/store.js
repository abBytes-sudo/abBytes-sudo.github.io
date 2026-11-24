/* Ordwell — store: state, persistence (localStorage, try/catch), date re-basing, undo/redo, mutations,
   the automation engine and the formula engine. No DOM here. */
(function () {
  'use strict';
  var OW = window.OW, KEY = 'ordwell-demo-v3', S, undo = [], redo = [], subs = [];
  var DAY = 864e5;

  /* ---------- dates ---------- */
  var D = OW.D = {
    today: function () { return OW.dateUtil.dayStr(0); },
    parse: function (s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); },
    add: function (s, n) { var d = D.parse(s); d.setDate(d.getDate() + n); return OW.dateUtil.iso(d); },
    diff: function (a, b) { return Math.round((D.parse(b) - D.parse(a)) / DAY); }, // b - a in days
    dow: function (s) { return D.parse(s).getDay(); },
    wkend: function (s) { var w = D.dow(s); return w === 0 || w === 6; },
    fmt: function (s, o) {
      if (!s) return '';
      var d = D.parse(s), m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
      if (o === 'long') return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()] + ', ' + d.getDate() + ' ' + m;
      return d.getDate() + ' ' + m + (o === 'y' ? ' ' + d.getFullYear() : '');
    },
    rel: function (s) {
      if (!s) return ''; var n = D.diff(D.today(), s);
      if (n === 0) return 'Today'; if (n === 1) return 'Tomorrow'; if (n === -1) return 'Yesterday';
      if (n < 0) return Math.abs(n) + 'd overdue'; if (n < 7) return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][D.dow(s)];
      return D.fmt(s);
    },
    ago: function (ms) {
      var s = (Date.now() - ms) / 1000; if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago';
      if (s < 86400) return Math.floor(s / 3600) + 'h ago'; if (s < 172800) return 'yesterday'; return Math.floor(s / 86400) + 'd ago';
    },
    workdays: function (a, b) { var n = 0, s = a; for (var i = 0; i < 400 && D.diff(s, b) >= 0; i++) { if (!D.wkend(s)) n++; s = D.add(s, 1); } return n; }
  };

  /* ---------- persistence ---------- */
  function load() {
    var raw = null; try { raw = localStorage.getItem(KEY); } catch (e) { }
    if (raw) { try { S = JSON.parse(raw); } catch (e) { S = null; } }
    if (!S || S.v !== 3) S = OW.seed();
    rebase();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  // shift every date so "today" in the demo stays today
  function rebase() {
    var t = D.today(), n = D.diff(S.base, t); if (!n) return;
    var ms = n * DAY, sd = function (s) { return s ? D.add(s, n) : s; };
    S.tasks.forEach(function (x) { x.start = sd(x.start); x.due = sd(x.due); x.created += ms; x.updated += ms; if (x.doneAt) x.doneAt += ms; x.time.forEach(function (l) { l.at += ms; }); x.attachments.forEach(function (a) { a.at += ms; }); });
    S.projects.forEach(function (p) { p.start = sd(p.start); p.end = sd(p.end); });
    ['comments', 'activity', 'notifs', 'runs'].forEach(function (k) { S[k].forEach(function (x) { x.at += ms; }); });
    S.docs.forEach(function (d) { d.updated += ms; });
    S.forms.forEach(function (f) { f.subs.forEach(function (s) { s.at += ms; }); });
    S.views.forEach(function (v) { if (v.due) v.due = sd(v.due); });
    S.invites.forEach(function (i) { i.at += ms; });
    S.base = t; save();
  }

  /* ---------- commit / undo ---------- */
  function emit(info) { subs.forEach(function (f) { try { f(info || {}); } catch (e) { console.error(e); } }); }
  var batching = 0;
  function commit(label, fn, opts) {
    opts = opts || {};
    var snap = JSON.stringify(S);
    var res = fn(S);
    if (res === false) return false;
    S.rev = (S.rev || 0) + 1;
    if (!opts.noUndo) { undo.push({ s: snap, label: label }); if (undo.length > 60) undo.shift(); redo = []; }
    save(); emit({ label: label, quiet: opts.quiet, autos: lastRuns.splice(0) });
    return res === undefined ? true : res;
  }
  function doUndo() {
    var u = undo.pop(); if (!u) return null;
    redo.push({ s: JSON.stringify(S), label: u.label }); S = JSON.parse(u.s); save(); emit({ undo: true }); return u.label;
  }
  function doRedo() {
    var r = redo.pop(); if (!r) return null;
    undo.push({ s: JSON.stringify(S), label: r.label }); S = JSON.parse(r.s); save(); emit({ redo: true }); return r.label;
  }

  /* ---------- selectors ---------- */
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  var Q = {
    me: function () { return S.viewAs || S.me; },
    user: function (id) { return byId(S.users, id); },
    project: function (id) { return byId(S.projects, id); },
    space: function (id) { return byId(S.spaces, id); },
    task: function (id) { return byId(S.tasks, id); },
    field: function (id) { return byId(S.fields, id); },
    status: function (t) { var p = Q.project(t.project); return (p && byId(p.statuses, t.status)) || { id: t.status, name: t.status, cat: 'todo' }; },
    cat: function (t) { return Q.status(t).cat; },
    isDone: function (t) { return Q.cat(t) === 'done'; },
    isGuest: function () { var u = Q.user(Q.me()); return u && u.role === 'guest'; },
    canSee: function (t) {
      var u = Q.user(Q.me()); if (!u || u.role !== 'guest') return true;
      return (u.guestOf || []).indexOf(t.project) > -1 && (t.tags.indexOf('client-visible') > -1 || (t.parent && Q.task(t.parent) && Q.task(t.parent).tags.indexOf('client-visible') > -1));
    },
    projectsVisible: function () {
      var u = Q.user(Q.me());
      return S.projects.filter(function (p) {
        var sp = Q.space(p.space); if (!sp || sp.ws !== S.ws) return false;
        return !u || u.role !== 'guest' || (u.guestOf || []).indexOf(p.id) > -1;
      });
    },
    tasks: function (pid, inclSubs) {
      return S.tasks.filter(function (t) { return !t.archived && (pid === '*' ? Q.project(t.project) && Q.space(Q.project(t.project).space).ws === S.ws : t.project === pid) && (inclSubs || !t.parent) && Q.canSee(t); });
    },
    subs: function (id) { return S.tasks.filter(function (t) { return t.parent === id && !t.archived; }).sort(function (a, b) { return a.order - b.order; }); },
    logged: function (t) { var m = 0; t.time.forEach(function (l) { m += l.mins; }); Q.subs(t.id).forEach(function (s) { s.time.forEach(function (l) { m += l.mins; }); }); return m; },
    overdue: function (t) { return t.due && !Q.isDone(t) && D.diff(D.today(), t.due) < 0; },
    unread: function () { var me = Q.me(); return S.notifs.filter(function (n) { return n.to === me && !n.read && !(n.snooze && n.snooze > Date.now()); }).length; },
    blockers: function (t) { return t.deps.map(Q.task).filter(Boolean); },
    blocking: function (t) { return S.tasks.filter(function (x) { return x.deps.indexOf(t.id) > -1; }); },
    blockedOpen: function (t) { return Q.blockers(t).some(function (b) { return !Q.isDone(b); }); },
    fieldsFor: function (pid) { var p = Q.project(pid); return p ? p.fields.map(Q.field).filter(Boolean) : []; },
    doneStatus: function (p) { for (var i = 0; i < p.statuses.length; i++) if (p.statuses[i].cat === 'done') return p.statuses[i].id; return p.statuses[p.statuses.length - 1].id; },
    firstStatus: function (p) { return p.statuses[0].id; },
    statusByCat: function (p, cat) { for (var i = 0; i < p.statuses.length; i++) if (p.statuses[i].cat === cat) return p.statuses[i].id; return null; }
  };

  function uid(p) { S.seq = (S.seq || 1000) + 1; return (p || 'x') + S.seq; }
  function log(t, text, who) { S.activity.push({ id: uid('a'), task: t.id, uid: who || Q.me(), at: Date.now(), text: text }); }
  function notify(to, kind, task, text, from) {
    if (!to) return;
    S.notifs.push({ id: uid('n'), to: to, kind: kind, from: from === undefined ? Q.me() : from, at: Date.now(), task: task ? task.id : null, text: text, read: false });
  }

  /* ---------- formula engine ---------- */
  // Grammar: expr := cmp ; cmp := cat (op cat)? ; cat := add ('&' add)* ; add := mul (('+'|'-') mul)* ; mul := un (('*'|'/') un)* ; un := '-' un | prim
  // prim := number | "string" | {Field} | NAME '(' args ')' | TRUE | FALSE | '(' expr ')'
  var F = OW.F = {};
  function tokenize(src) {
    var out = [], i = 0, c;
    while (i < src.length) {
      c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === '{') { var j = src.indexOf('}', i); if (j < 0) throw new Error('Missing } after field name'); out.push({ k: 'f', v: src.slice(i + 1, j).trim() }); i = j + 1; continue; }
      if (c === '"') { var e = src.indexOf('"', i + 1); if (e < 0) throw new Error('Missing closing quote'); out.push({ k: 's', v: src.slice(i + 1, e) }); i = e + 1; continue; }
      if (/[0-9.]/.test(c)) { var m = /^[0-9]*\.?[0-9]+/.exec(src.slice(i)); out.push({ k: 'n', v: parseFloat(m[0]) }); i += m[0].length; continue; }
      if (/[A-Za-z_]/.test(c)) { var w = /^[A-Za-z_][A-Za-z_0-9]*/.exec(src.slice(i))[0]; out.push({ k: 'id', v: w.toUpperCase() }); i += w.length; continue; }
      var two = src.substr(i, 2);
      if (two === '<=' || two === '>=' || two === '!=' || two === '<>') { out.push({ k: 'op', v: two === '<>' ? '!=' : two }); i += 2; continue; }
      if ('+-*/&(),<>='.indexOf(c) > -1) { out.push({ k: 'op', v: c }); i++; continue; }
      throw new Error('Unexpected "' + c + '"');
    }
    return out;
  }
  function parse(src) {
    var tk = tokenize(src), p = 0;
    function peek(v) { return tk[p] && tk[p].k === 'op' && tk[p].v === v; }
    function expect(v) { if (!peek(v)) throw new Error('Expected "' + v + '"'); p++; }
    function prim() {
      var t = tk[p++]; if (!t) throw new Error('Formula ends too early');
      if (t.k === 'n') return { n: t.v }; if (t.k === 's') return { s: t.v }; if (t.k === 'f') return { f: t.v };
      if (t.k === 'id') {
        if (t.v === 'TRUE' || t.v === 'FALSE') return { bool: t.v === 'TRUE' };
        expect('('); var args = []; if (!peek(')')) { args.push(cmp()); while (peek(',')) { p++; args.push(cmp()); } } expect(')');
        if (!FN[t.v]) throw new Error('Unknown function ' + t.v + '()'); return { fn: t.v, args: args };
      }
      if (t.k === 'op' && t.v === '(') { var e = cmp(); expect(')'); return e; }
      if (t.k === 'op' && t.v === '-') return { op: 'neg', a: prim() };
      throw new Error('Unexpected "' + t.v + '"');
    }
    function mul() { var a = prim(); while (peek('*') || peek('/')) { var o = tk[p++].v; a = { op: o, a: a, b: prim() }; } return a; }
    function add() { var a = mul(); while (peek('+') || peek('-')) { var o = tk[p++].v; a = { op: o, a: a, b: mul() }; } return a; }
    function cat() { var a = add(); while (peek('&')) { p++; a = { op: '&', a: a, b: add() }; } return a; }
    function cmp() { var a = cat(); var t = tk[p]; if (t && t.k === 'op' && ['<', '>', '<=', '>=', '=', '!='].indexOf(t.v) > -1) { p++; a = { op: t.v, a: a, b: cat() }; } return a; }
    var r = cmp(); if (p < tk.length) throw new Error('Unexpected "' + (tk[p].v) + '"'); return r;
  }
  var FN = {
    IF: function (a) { return a[0] ? a[1] : (a.length > 2 ? a[2] : ''); },
    ROUND: function (a) { var k = Math.pow(10, a[1] || 0); return Math.round(num(a[0]) * k) / k; },
    MIN: function (a) { return Math.min.apply(null, a.map(num)); }, MAX: function (a) { return Math.max.apply(null, a.map(num)); },
    SUM: function (a) { return a.reduce(function (s, x) { return s + num(x); }, 0); }, ABS: function (a) { return Math.abs(num(a[0])); },
    AND: function (a) { return a.every(Boolean); }, OR: function (a) { return a.some(Boolean); }, NOT: function (a) { return !a[0]; },
    TODAY: function () { return D.today(); }, CONCAT: function (a) { return a.join(''); },
    DAYS: function (a) { if (!a[0] || !a[1]) return 0; return D.diff(String(a[1]), String(a[0])); },
    PCT: function (a) { return num(a[1]) ? Math.round(num(a[0]) / num(a[1]) * 100) : 0; }
  };
  function num(v) { if (typeof v === 'number') return v; if (typeof v === 'boolean') return v ? 1 : 0; var n = parseFloat(v); return isNaN(n) ? 0 : n; }
  function ev(n, ctx) {
    if ('n' in n) return n.n; if ('s' in n) return n.s; if ('bool' in n) return n.bool;
    if ('f' in n) { var key = n.f.toLowerCase(); if (!(key in ctx)) throw new Error('No field called {' + n.f + '}'); return ctx[key]; }
    if (n.fn) return FN[n.fn](n.args.map(function (a) { return ev(a, ctx); }));
    var a = ev(n.a, ctx); if (n.op === 'neg') return -num(a);
    var b = ev(n.b, ctx);
    switch (n.op) {
      case '+': return num(a) + num(b); case '-': return num(a) - num(b); case '*': return num(a) * num(b);
      case '/': return num(b) === 0 ? 0 : num(a) / num(b); case '&': return String(a) + String(b);
      case '<': return num(a) < num(b); case '>': return num(a) > num(b); case '<=': return num(a) <= num(b); case '>=': return num(a) >= num(b);
      case '=': return String(a) === String(b); case '!=': return String(a) !== String(b);
    }
  }
  var cache = {};
  F.ctx = function (t) {
    var c = { title: t.title, status: Q.status(t).name, priority: t.priority, estimate: t.est || 0, logged: Math.round(Q.logged(t) / 6) / 10, due: t.due || '', start: t.start || '', subtasks: Q.subs(t.id).length };
    Q.fieldsFor(t.project).forEach(function (f) { if (f.type !== 'formula') { var v = t.fields[f.id]; c[f.name.toLowerCase()] = v == null ? (f.type === 'number' ? 0 : '') : (f.type === 'people' ? (Q.user(v) || {}).name || '' : v); } });
    return c;
  };
  F.compile = function (src) { if (!cache[src]) cache[src] = parse(src); return cache[src]; };
  F.eval = function (src, t, extraCtx) {
    try { var c = F.ctx(t); if (extraCtx) for (var k in extraCtx) c[k] = extraCtx[k]; return { v: ev(F.compile(src), c) }; }
    catch (e) { return { err: e.message }; }
  };
  F.check = function (src, pid) {
    try { var tree = parse(src); var names = {}; (function walk(n) { if (!n) return; if ('f' in n) names[n.f.toLowerCase()] = 1; if (n.args) n.args.forEach(walk); walk(n.a); walk(n.b); })(tree);
      var known = ['title', 'status', 'priority', 'estimate', 'logged', 'due', 'start', 'subtasks'].concat(Q.fieldsFor(pid).map(function (f) { return f.name.toLowerCase(); }));
      for (var k in names) if (known.indexOf(k) < 0) return 'No field called {' + k + '} in this project';
      return null;
    } catch (e) { return e.message; }
  };

  /* ---------- automations ---------- */
  var lastRuns = [], depth = 0;
  function matchCond(c, t) {
    if (c.field === 'priority') { var v = t.priority; return c.op === 'gte' ? v >= c.value : c.op === 'eq' ? v === c.value : v <= c.value; }
    if (c.field === 'status' && c.op === 'notdone') return !Q.isDone(t);
    if (c.field === 'tag') return t.tags.indexOf(c.value) > -1;
    if (c.field === 'assignee') return t.assignees.indexOf(c.value) > -1;
    return true;
  }
  function triggerMatches(tr, ev) {
    if (tr.type !== ev.type) return false;
    if (tr.type === 'status') { var p = Q.project(ev.task.project); var st = p && byId(p.statuses, ev.to); if (tr.to === 'done') return st && st.cat === 'done'; if (tr.to === 'review') return st && st.cat === 'review'; return ev.to === tr.to; }
    if (tr.type === 'created') return !tr.via || tr.via === 'any' || tr.via === ev.via;
    if (tr.type === 'assigned') return !tr.who || tr.who === ev.who;
    return true;
  }
  function runAction(a, t) {
    var p = Q.project(t.project);
    switch (a.type) {
      case 'move': {
        var dest = Q.project(a.project); if (!dest) return 'Project not found';
        var from = p.name; t.project = dest.id; if (!byId(dest.statuses, t.status)) t.status = Q.isDone(t) ? Q.doneStatus(dest) : Q.firstStatus(dest);
        Q.subs(t.id).forEach(function (s) { s.project = dest.id; s.status = t.status; });
        log(t, 'moved this from ' + from + ' to ' + dest.name + ' (automation)', null); return 'Moved to ' + dest.name;
      }
      case 'notify': {
        var to = a.who === 'owner' ? [Q.project(t.project).owner] : a.who === 'assignees' ? t.assignees : [a.who];
        to.forEach(function (u) { notify(u, 'auto', t, a.msg || ('Automation update on ' + t.num + ': ' + Q.status(t).name), null); });
        return 'Notified ' + to.map(function (u) { return (Q.user(u) || {}).name; }).join(', ');
      }
      case 'assign': if (t.assignees.indexOf(a.who) < 0) t.assignees.push(a.who); log(t, 'assigned ' + Q.user(a.who).name + ' (automation)', null); notify(a.who, 'assign', t, 'An automation assigned you to ' + t.title, null); return 'Assigned ' + Q.user(a.who).name;
      case 'priority': t.priority = a.value; return 'Set priority to ' + ['None', 'Low', 'Medium', 'High', 'Urgent'][a.value];
      case 'tag': if (t.tags.indexOf(a.value) < 0) t.tags.push(a.value); return 'Added tag ' + a.value;
      case 'comment': S.comments.push({ id: uid('c'), task: t.id, uid: 'bot', at: Date.now(), text: a.text, internal: true, reactions: {} }); return 'Posted a comment';
      case 'status': {
        var sid = byId(p.statuses, a.to) ? a.to : Q.statusByCat(p, a.to) || a.to; if (t.status === sid) return 'Already ' + Q.status(t).name;
        var old = t.status; t.status = sid; log(t, 'changed status to ' + Q.status(t).name + ' (automation)', null);
        if (Q.isDone(t)) t.doneAt = Date.now(); fire({ type: 'status', task: t, from: old, to: sid }); return 'Changed status to ' + Q.status(t).name;
      }
      case 'due': t.due = D.add(D.today(), a.days || 0); return 'Set due date to ' + D.fmt(t.due);
    }
    return a.type;
  }
  function fire(ev) {
    if (depth > 3) return; depth++;
    try {
      S.automations.forEach(function (au) {
        if (!au.on) return;
        var t = ev.task; if (!t) return;
        if (au.project !== '*' && au.project !== t.project) return;
        if (!triggerMatches(au.trigger, ev)) return;
        var t0 = performance.now(), steps, status = 'ok';
        if (!au.conds.every(function (c) { return matchCond(c, t); })) { status = 'skipped'; steps = ['Conditions not met']; }
        else steps = au.actions.map(function (a) { return runAction(a, t); });
        var run = { id: uid('r'), auto: au.id, at: Date.now(), task: t.id, status: status, ms: Math.max(12, Math.round(performance.now() - t0 + 24)), steps: steps };
        S.runs.push(run); if (status === 'ok') lastRuns.push({ name: au.name, id: au.id });
      });
    } finally { depth--; }
  }
  OW.fire = fire;
  // test-run an automation against a task without keeping changes (returns steps)
  function dryRun(au, t) {
    var snap = JSON.stringify(S), steps;
    try {
      if (!au.conds.every(function (c) { return matchCond(c, t); })) steps = ['Conditions not met — nothing would change'];
      else steps = au.actions.map(function (a) { return runAction(a, Q.task(t.id)); });
    } finally { S = JSON.parse(snap); lastRuns.length = 0; }
    return steps;
  }
  // daily scheduled check ("due soon"), once per day per task
  function scheduled() {
    var key = 'ordwell-sched', last = null; try { last = localStorage.getItem(key); } catch (e) { }
    if (last === D.today()) return;
    try { localStorage.setItem(key, D.today()); } catch (e) { }
    var hits = S.tasks.filter(function (t) { return t.due && !t.archived && !t.parent && D.diff(D.today(), t.due) === 1 && !Q.isDone(t); });
    if (!hits.length) return;
    commit('Daily reminders', function () { hits.forEach(function (t) { fire({ type: 'due-soon', task: t }); }); }, { quiet: true });
    undo.pop();
  }

  /* ---------- actions ---------- */
  var A = {
    setStatus: function (t, sid) {
      if (t.status === sid) return; var old = t.status; t.status = sid; t.updated = Date.now();
      log(t, 'changed status to ' + Q.status(t).name);
      if (Q.isDone(t)) { t.doneAt = Date.now(); } else t.doneAt = null;
      t.assignees.forEach(function (u) { if (u !== Q.me()) notify(u, 'status', t, 'moved ' + t.title + ' to ' + Q.status(t).name); });
      fire({ type: 'status', task: t, from: old, to: sid });
      if (t.parent) { var par = Q.task(t.parent); if (par && Q.subs(par.id).every(Q.isDone) && !Q.isDone(par)) fire({ type: 'subtasks-done', task: par }); }
    },
    create: function (o) {
      var p = Q.project(o.project), seq = S.tasks.filter(function (t) { return t.project === p.id; }).length;
      var max = 100; S.tasks.forEach(function (t) { if (t.num.indexOf(p.key + '-') === 0) max = Math.max(max, +t.num.split('-')[1]); });
      var t = { id: uid('t'), num: p.key + '-' + (max + 1), project: p.id, title: o.title || 'Untitled task', status: o.status || Q.firstStatus(p), assignees: o.assignees || [], priority: o.priority || 0,
        start: o.start || null, due: o.due || null, est: o.est || 0, tags: o.tags || [], fields: o.fields || {}, parent: o.parent || null, desc: o.desc || '', checklist: [], deps: [], attachments: o.attachments || [], time: [],
        order: o.order != null ? o.order : seq, created: Date.now(), updated: Date.now(), doneAt: null, archived: false };
      S.tasks.push(t); log(t, o.via === 'form' ? 'created this task from a form submission' : 'created this task', o.via === 'form' ? null : undefined);
      t.assignees.forEach(function (u) { if (u !== Q.me()) notify(u, 'assign', t, 'assigned you to ' + t.title); });
      fire({ type: 'created', task: t, via: o.via || 'app' });
      return t;
    },
    assign: function (t, list) {
      var added = list.filter(function (u) { return t.assignees.indexOf(u) < 0; });
      t.assignees = list.slice(); t.updated = Date.now();
      added.forEach(function (u) { if (u !== Q.me()) notify(u, 'assign', t, 'assigned you to ' + t.title); fire({ type: 'assigned', task: t, who: u }); });
      log(t, list.length ? 'set assignees to ' + list.map(function (u) { return Q.user(u).name.split(' ')[0]; }).join(', ') : 'removed all assignees');
    },
    comment: function (t, text, internal) {
      var c = { id: uid('c'), task: t.id, uid: Q.me(), at: Date.now(), text: text, internal: !!internal, reactions: {} };
      S.comments.push(c);
      var mentioned = [];
      S.users.forEach(function (u) { if (text.indexOf('@' + u.name) > -1) { mentioned.push(u.id); if (u.id !== Q.me()) notify(u.id, 'mention', t, 'mentioned you: "' + text.replace(/@/g, '').slice(0, 70) + (text.length > 70 ? '…' : '') + '"'); } });
      t.assignees.forEach(function (u) { if (u !== Q.me() && mentioned.indexOf(u) < 0) notify(u, 'comment', t, 'commented: "' + text.slice(0, 60) + '"'); });
      fire({ type: 'comment', task: t });
      return { c: c, mentioned: mentioned };
    },
    // a public form submission becomes a task (and fires "created via form" automations)
    submitForm: function (f, vals) {
      var p = Q.project(f.project), o = { project: p.id, status: f.status && byId(p.statuses, f.status) ? f.status : Q.firstStatus(p), via: 'form', fields: {}, assignees: [], attachments: [] };
      var desc = [], email = '';
      f.fields.forEach(function (q) {
        var v = vals[q.id]; if (v == null || v === '') return;
        if (q.map === 'title') o.title = String(v).slice(0, 160);
        else if (q.map === 'desc') desc.unshift(String(v));
        else if (q.map === 'due') { o.due = v; o.start = D.add(v, -2) < D.today() ? D.today() : D.add(v, -2); }
        else if (q.map === 'priority') o.priority = Math.max(1, ['Low', 'Medium', 'High', 'Urgent'].indexOf(v) + 1);
        else if (q.map === 'email') { email = v; desc.push('From: ' + v); }
        else if (q.map === 'attach') (v || []).forEach(function (a) { o.attachments.push({ id: uid('at'), name: a.name, kb: a.kb, kind: a.kind || 'doc', by: null, at: Date.now() }); });
        else if (byId(S.fields, q.map)) o.fields[q.map] = v;
        else desc.push(q.label + ': ' + v);
      });
      o.desc = desc.join('\n\n'); o.tags = ['via-form'];
      var t = A.create(o);
      f.subs.unshift({ id: uid('sb'), at: Date.now(), email: email, task: t.id, title: t.title });
      notify(p.owner, 'form', t, 'New request from “' + f.name + '”: ' + t.title, null);
      return t;
    },
    remove: function (t) { t.archived = true; Q.subs(t.id).forEach(function (s) { s.archived = true; }); log(t, 'archived this task'); }
  };

  OW.store = {
    load: load, save: save, get S() { return S; }, commit: commit, undo: doUndo, redo: doRedo,
    canUndo: function () { return undo.length > 0; }, undoLabel: function () { return undo.length ? undo[undo.length - 1].label : ''; },
    on: function (f) { subs.push(f); },
    markUndo: function (snap, label) { undo.push({ s: snap, label: label }); if (undo.length > 60) undo.shift(); redo = []; },
    snap: function () { return JSON.stringify(S); }, uid: uid, log: log, notify: notify, fire: fire, dryRun: dryRun, scheduled: scheduled,
    reset: function () { S = OW.seed(); undo = []; redo = []; save(); try { localStorage.removeItem('ordwell-sched'); } catch (e) { } emit({ reset: true }); },
    replace: function (obj) { S = obj; save(); }
  };
  OW.Q = Q; OW.A = A; OW.byId = byId;
})();
