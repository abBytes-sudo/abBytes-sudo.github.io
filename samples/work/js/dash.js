/* Ordwell — Dashboards: KPI strip, burn-up, by-status donut, overdue by person, workload vs capacity,
   project health, time by project and budget vs spent. Every number is computed from the live task data;
   bars and segments are clickable filters into All tasks. Widgets can be added, moved, resized and removed. */
(function () {
  'use strict';
  var OW = window.OW, UI = OW.UI, Q = OW.Q, D = OW.D, I = UI.I, esc = UI.esc, store = OW.store, app = OW.app;
  var DB = { edit: false };
  var KINDS = {
    kpis: ['Headline numbers', 'Open, overdue, done this week, hours logged'],
    burnup: ['Burn-up', 'Scope vs completed over time for one project'],
    status: ['Tasks by status', 'Donut of where work sits right now'],
    overdue: ['Overdue by person', 'Who has the most late work'],
    workload: ['Workload this week', 'Planned hours against capacity'],
    health: ['Project health', 'Progress, overdue and budget for every project'],
    time: ['Time by project', 'Hours logged in the last 7 days'],
    budget: ['Budget vs spent', 'Money fields summed by a dropdown field']
  };
  var CATC = { backlog: 'var(--c-backlog)', todo: 'var(--c-todo)', active: 'var(--c-active)', review: 'var(--c-review)', review2: 'var(--c-review2)', done: 'var(--c-done)', blocked: 'var(--c-blocked)' };

  function scopeTasks(pid) { return pid && pid !== '*' ? Q.tasks(pid) : Q.tasks('*'); }
  function goFilter(f, pid) { var st = OW.project.state(pid || '*'); st.filter = Object.assign({ q: '', who: [], pri: [], tags: [], due: '', status: '' }, f); st.view = 'list'; st.saved = null; app.go('#/p/' + (pid || '*') + '/list'); }

  OW.routes.dash = function (main, args) {
    var S = store.S, d = args[0] ? OW.byId(S.dashboards, args[0]) : S.dashboards[0];
    var h = '<div class="page" style="max-width:1320px"><div class="page-h"><div><h1>' + esc(d.name) + '</h1><p>Live from ' + (d.scope.charAt(0) === 'p' ? esc(Q.project(d.scope).name) : 'every project in ' + esc(OW.byId(S.workspaces, S.ws).name)) + '. Click any bar or segment to see the tasks behind it.</p></div><span class="sp"></span>' +
      '<div class="seg" role="group" aria-label="Dashboards">' + S.dashboards.map(function (x) { return '<button type="button" data-act="db-go" data-id="' + x.id + '" aria-pressed="' + (x.id === d.id) + '">' + esc(x.name) + '</button>'; }).join('') + '</div>' +
      '<button type="button" class="btn" data-act="db-edit" aria-pressed="' + DB.edit + '">' + I(DB.edit ? 'check' : 'settings') + (DB.edit ? 'Done editing' : 'Edit layout') + '</button><button type="button" class="btn pri" data-act="db-add" data-id="' + d.id + '">' + I('plus') + 'Add widget</button></div>';
    h += '<div class="dash-grid">';
    d.widgets.forEach(function (w, i) {
      var k = KINDS[w.type] || ['Widget', ''], body = '';
      try { body = R[w.type] ? R[w.type](w) : ''; } catch (e) { body = '<p class="faint">This widget couldn’t load.</p>'; console.error(e); }
      var sub = w.project && w.project !== '*' && Q.project(w.project) ? esc(Q.project(w.project).name) : (w.type === 'kpis' || w.type === 'health' ? '' : 'All projects');
      h += '<section class="wg w' + (w.w || 1) + '" aria-label="' + esc(k[0]) + '"><div class="wg-h"><h3>' + esc(k[0]) + (sub ? '<small>' + sub + '</small>' : '') + '</h3>' +
        (DB.edit ? '<button type="button" class="ibtn" style="opacity:1" data-act="db-move" data-i="' + i + '" data-d="-1" aria-label="Move left">' + I('chl', 's') + '</button><button type="button" class="ibtn" style="opacity:1" data-act="db-move" data-i="' + i + '" data-d="1" aria-label="Move right">' + I('chr', 's') + '</button><button type="button" class="ibtn" style="opacity:1" data-act="db-size" data-i="' + i + '" aria-label="Change width">' + I('expand', 's') + '</button><button type="button" class="ibtn" style="opacity:1" data-act="db-del" data-i="' + i + '" aria-label="Remove widget">' + I('x', 's') + '</button>' :
          (['burnup', 'status', 'budget'].indexOf(w.type) > -1 ? '<button type="button" class="ibtn" data-act="db-proj" data-i="' + i + '" aria-label="Change project">' + I('folder', 's') + '</button>' : '')) + '</div>' + body + '</section>';
    });
    h += '</div></div>';
    main.innerHTML = h;
  };

  var R = {};
  R.kpis = function () {
    var ts = Q.tasks('*', true), now = Date.now(), wk = 7 * 864e5;
    var open = ts.filter(function (t) { return !Q.isDone(t) && !t.parent; }), over = open.filter(Q.overdue);
    var done = ts.filter(function (t) { return t.doneAt && now - t.doneAt < wk; }).length, doneP = ts.filter(function (t) { return t.doneAt && now - t.doneAt >= wk && now - t.doneAt < 2 * wk; }).length;
    var m = 0, mp = 0; ts.forEach(function (t) { t.time.forEach(function (l) { if (now - l.at < wk) m += l.mins; else if (now - l.at < 2 * wk) mp += l.mins; }); });
    function delta(a, b, good) { if (!b) return '<span>first week</span>'; var p = Math.round((a - b) / b * 100); return '<span class="' + ((p >= 0) === good ? 'up' : 'dn') + '">' + (p >= 0 ? '▲ ' : '▼ ') + Math.abs(p) + '% vs last week</span>'; }
    return '<div class="kpis"><button type="button" data-act="db-f" data-f="open"><small>Open tasks</small><b>' + open.length + '</b><span>' + open.filter(function (t) { return Q.cat(t) === 'active'; }).length + ' in progress</span></button>' +
      '<button type="button" data-act="db-f" data-f="overdue"><small>Overdue</small><b style="color:' + (over.length ? 'var(--bad)' : 'inherit') + '">' + over.length + '</b><span>' + (open.length ? Math.round(over.length / open.length * 100) : 0) + '% of open work</span></button>' +
      '<button type="button" data-act="db-f" data-f="done"><small>Done this week</small><b>' + done + '</b>' + delta(done, doneP, true) + '</button>' +
      '<button type="button" data-act="db-f" data-f="time"><small>Hours logged · 7 days</small><b>' + Math.round(m / 60) + 'h</b>' + delta(m, mp, true) + '</button></div>';
  };
  R.burnup = function (w) {
    var p = Q.project(w.project) || Q.project('p1'), ts = Q.tasks(p.id, true), W = 560, H = 210, pad = { l: 30, r: 12, t: 12, b: 26 };
    var start = p.start, end = p.end, today = D.today(), n = D.diff(start, end);
    var step = Math.max(1, Math.round(n / 24)), pts = [];
    for (var i = 0; i <= n; i += step) pts.push(D.add(start, i)); if (pts[pts.length - 1] !== end) pts.push(end);
    var ms = function (d) { return D.parse(d).getTime() + 12 * 36e5; };
    var scope = function (d) { return ts.filter(function (t) { return t.created <= ms(d); }).length; };
    var doneC = function (d) { return ts.filter(function (t) { return t.doneAt && t.doneAt <= ms(d); }).length; };
    var maxY = Math.max(ts.length, 1) * 1.1, X = function (d) { return pad.l + D.diff(start, d) / n * (W - pad.l - pad.r); }, Y = function (v) { return H - pad.b - v / maxY * (H - pad.t - pad.b); };
    var past = pts.filter(function (d) { return d <= today; }); if (past[past.length - 1] !== today && today < end && today > start) past.push(today);
    var sc = past.map(function (d) { return X(d) + ',' + Y(scope(d)); }).join(' '), dn = past.map(function (d) { return X(d) + ',' + Y(doneC(d)); }).join(' ');
    var last = past[past.length - 1], back = D.add(last, -21) < start ? start : D.add(last, -21), rate = (doneC(last) - doneC(back)) / Math.max(1, D.diff(back, last));
    var projEnd = Math.min(ts.length, doneC(last) + rate * D.diff(last, end));
    var g = '';
    for (var k = 0; k <= 4; k++) { var v = Math.round(maxY / 4 * k); g += '<line class="gl" x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text x="' + (pad.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + '</text>'; }
    [start, D.add(start, Math.round(n / 2)), end].forEach(function (d, j) { g += '<text x="' + X(d) + '" y="' + (H - 6) + '" text-anchor="' + ['start', 'middle', 'end'][j] + '">' + D.fmt(d) + '</text>'; });
    g += '<line class="gl" x1="' + X(today) + '" x2="' + X(today) + '" y1="' + pad.t + '" y2="' + (H - pad.b) + '" style="stroke:var(--accent);stroke-dasharray:2 3"/><text x="' + (X(today) + 4) + '" y="' + (pad.t + 10) + '" style="fill:var(--accent-ink)">Today</text>';
    g += '<polyline class="ideal" points="' + X(start) + ',' + Y(0) + ' ' + X(end) + ',' + Y(ts.length) + '"/>';
    g += '<polygon class="doneA" points="' + X(start) + ',' + Y(0) + ' ' + dn + ' ' + X(last) + ',' + Y(0) + '"/>';
    g += '<polyline class="scope" points="' + sc + '"/><polyline class="doneL" points="' + dn + '"/>';
    g += '<polyline class="doneL" style="stroke-dasharray:3 4;opacity:.6" points="' + X(last) + ',' + Y(doneC(last)) + ' ' + X(end) + ',' + Y(projEnd) + '"/><circle class="pt" cx="' + X(last) + '" cy="' + Y(doneC(last)) + '" r="4"/>';
    var gap = ts.length - Math.round(projEnd);
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Burn-up for ' + esc(p.name) + ': ' + doneC(last) + ' of ' + ts.length + ' tasks done">' + g + '</svg>' +
      '<div class="legend"><span><i style="background:var(--accent)"></i>Completed (' + doneC(last) + ')</span><span><i style="background:var(--ink-2)"></i>Scope (' + ts.length + ')</span><span><i style="background:var(--line-3)"></i>Ideal</span><span style="margin-left:auto;color:' + (gap > 0 ? 'var(--warn)' : 'var(--ok)') + '">' + (gap > 0 ? 'At this pace, ' + gap + ' tasks will be open on ' + D.fmt(end) : 'On pace to finish by ' + D.fmt(end)) + '</span></div>';
  };
  R.status = function (w) {
    var ts = scopeTasks(w.project), cats = OW.project.CATS, tot = ts.length || 1, a = 0, segs = '', leg = '';
    cats.forEach(function (c) {
      var n = ts.filter(function (t) { return Q.cat(t) === c[0]; }).length; if (!n) return;
      var frac = n / tot, r = 52, C = 2 * Math.PI * r;
      segs += '<circle r="' + r + '" cx="66" cy="66" fill="none" stroke="' + CATC[c[0]] + '" stroke-width="16" stroke-dasharray="' + (frac * C - 2) + ' ' + C + '" stroke-dashoffset="' + (-a * C) + '" transform="rotate(-90 66 66)"><title>' + c[1] + ': ' + n + '</title></circle>';
      a += frac; leg += '<button type="button" data-act="db-f" data-f="cat:' + c[0] + '" data-p="' + (w.project || '*') + '"><span class="sdot" data-cat="' + c[0] + '" style="--c:' + CATC[c[0]] + '"></span>' + c[1] + '<b>' + n + '</b></button>';
    });
    var done = ts.filter(Q.isDone).length;
    return '<div class="donut-w"><svg viewBox="0 0 132 132" role="img" aria-label="' + done + ' of ' + ts.length + ' tasks done">' + segs + '<text x="66" y="64" text-anchor="middle" style="font:600 22px var(--font);fill:var(--ink)">' + Math.round(done / tot * 100) + '%</text><text x="66" y="82" text-anchor="middle" style="font:11px var(--font);fill:var(--faint)">done</text></svg><div class="donut-l">' + leg + '</div></div>';
  };
  R.overdue = function () {
    var ts = Q.tasks('*', true).filter(Q.overdue), by = {};
    ts.forEach(function (t) { t.assignees.forEach(function (a) { by[a] = (by[a] || 0) + 1; }); });
    var rows = Object.keys(by).map(function (u) { return [u, by[u]]; }).sort(function (a, b) { return b[1] - a[1]; }), max = rows.length ? rows[0][1] : 1;
    if (!rows.length) return '<div class="empty" style="padding:24px"><h3>Nothing overdue</h3><p>Every open task is on schedule.</p></div>';
    return rows.slice(0, 7).map(function (r) { var u = Q.user(r[0]); return '<button type="button" class="hbar" data-act="db-f" data-f="over:' + r[0] + '"><span class="hn">' + UI.av(r[0], 's') + esc(u.name.split(' ')[0]) + '</span><span class="hb"><i style="width:' + (r[1] / max * 100) + '%;background:var(--bad)"></i></span><span class="hv">' + r[1] + '</span></button>'; }).join('') + '<p class="faint" style="font-size:12px;margin-top:8px">' + ts.length + ' overdue tasks · subtasks included</p>';
  };
  R.workload = function () {
    var S = store.S, today = D.today(), mon = D.add(today, -((D.dow(today) + 6) % 7)), days = [0, 1, 2, 3, 4].map(function (i) { return D.add(mon, i); }), ts = Q.tasks('*', true);
    var rows = S.users.filter(function (u) { return u.role !== 'guest' && u.cap; }).map(function (u) { var h = 0; days.forEach(function (d) { ts.forEach(function (t) { h += OW.workload.load(t, u.id, d); }); }); return { u: u, h: h }; }).sort(function (a, b) { return b.h / b.u.cap - a.h / a.u.cap; });
    var max = Math.max.apply(null, rows.map(function (r) { return Math.max(r.h, r.u.cap); }));
    return rows.slice(0, 8).map(function (r) { var pct = r.h / r.u.cap, col = pct > 1 ? 'var(--bad)' : pct > 0.8 ? 'var(--warn)' : 'var(--ok)'; return '<button type="button" class="hbar" data-act="db-f" data-f="who:' + r.u.id + '" style="grid-template-columns:110px minmax(0,1fr) 64px"><span class="hn">' + UI.av(r.u.id, 's') + esc(r.u.name.split(' ')[0]) + '</span><span class="hb" style="overflow:visible"><i style="width:' + (r.h / max * 100) + '%;background:color-mix(in srgb,' + col + ' 70%,var(--surface));border-radius:4px"></i><span class="cap-line" style="left:' + (r.u.cap / max * 100) + '%" title="Capacity ' + r.u.cap + 'h"></span></span><span class="hv">' + Math.round(r.h) + ' / ' + r.u.cap + 'h</span></button>'; }).join('') +
      '<p class="faint" style="font-size:12px;margin-top:8px">Estimates spread over each task’s working days · black line = weekly capacity · <a href="#/p/*/workload" style="text-decoration:underline">open workload view</a></p>';
  };
  R.health = function () {
    var ps = Q.projectsVisible().filter(function (p) { return p.client !== 'Internal' || p.budget; });
    return '<div style="overflow-x:auto"><table class="htable"><thead><tr><th>Project</th><th>Health</th><th>Progress</th><th>Overdue</th><th>Budget used</th><th>Ends</th><th>Owner</th></tr></thead><tbody>' + ps.map(function (p) {
      var ts = Q.tasks(p.id), dn = ts.filter(Q.isDone).length, ov = ts.filter(Q.overdue).length, pct = ts.length ? Math.round(dn / ts.length * 100) : 0;
      var fs = Q.fieldsFor(p.id), fb = fs.filter(function (f) { return /budget|contract value/i.test(f.name); })[0], fsp = fs.filter(function (f) { return /spent|paid/i.test(f.name); })[0], used = '';
      if (fb && fsp) { var b = 0, s = 0; Q.tasks(p.id).forEach(function (t) { b += +t.fields[fb.id] || 0; s += +t.fields[fsp.id] || 0; }); used = b ? '<span class="meter' + (s / b > 0.9 ? ' bad' : '') + '" style="width:70px"><i style="width:' + Math.min(100, s / b * 100) + '%"></i></span>' + Math.round(s / b * 100) + '% of ' + UI.inrS(b) : '—'; }
      else used = '<span class="faint">—</span>';
      return '<tr class="click" data-act="db-goto" data-id="' + p.id + '" tabindex="0"><td><span style="display:inline-flex;align-items:center;gap:8px">' + UI.pdot(p) + '<b style="font-weight:500">' + esc(p.name) + '</b></span></td><td><span class="health ' + p.health + '" style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:500"><i></i>' + { on: 'On track', risk: 'At risk', off: 'Off track' }[p.health] + '</span></td><td><span class="meter ok"><i style="width:' + pct + '%"></i></span>' + pct + '%</td><td>' + (ov ? '<span class="due over">' + ov + '</span>' : '<span class="faint">0</span>') + '</td><td>' + used + '</td><td>' + D.fmt(p.end) + '</td><td>' + UI.av(p.owner, 's') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  };
  R.time = function () {
    var now = Date.now(), by = {};
    Q.tasks('*', true).forEach(function (t) { t.time.forEach(function (l) { if (now - l.at < 7 * 864e5) by[t.project] = (by[t.project] || 0) + l.mins; }); });
    var rows = Object.keys(by).map(function (k) { return [k, by[k]]; }).sort(function (a, b) { return b[1] - a[1]; }), max = rows.length ? rows[0][1] : 1;
    if (!rows.length) return '<p class="faint">No time logged in the last 7 days.</p>';
    return rows.map(function (r) { var p = Q.project(r[0]); return '<button type="button" class="hbar" data-act="db-goto" data-id="' + p.id + '"><span class="hn">' + UI.pdot(p) + esc(p.key) + '</span><span class="hb"><i style="width:' + (r[1] / max * 100) + '%;background:hsl(' + p.hue + ' 55% 55%)"></i></span><span class="hv">' + Math.round(r[1] / 60) + 'h</span></button>'; }).join('');
  };
  R.budget = function (w) {
    var p = Q.project(w.project) || Q.project('p1'), fs = Q.fieldsFor(p.id);
    var fb = fs.filter(function (f) { return /budget|contract value/i.test(f.name); })[0], fsp = fs.filter(function (f) { return /spent|paid/i.test(f.name); })[0], fg = fs.filter(function (f) { return f.type === 'select'; })[0];
    if (!fb || !fsp) return '<p class="faint">This project has no Budget and Spent columns. Add them in the table view to see this chart.</p>';
    var by = {}, tb = 0, ts = 0;
    Q.tasks(p.id).forEach(function (t) { var k = fg ? t.fields[fg.id] || 'Other' : 'All'; by[k] = by[k] || [0, 0]; by[k][0] += +t.fields[fb.id] || 0; by[k][1] += +t.fields[fsp.id] || 0; tb += +t.fields[fb.id] || 0; ts += +t.fields[fsp.id] || 0; });
    var rows = Object.keys(by).filter(function (k) { return by[k][0] || by[k][1]; }).sort(function (a, b) { return by[b][0] - by[a][0]; }), max = Math.max.apply(null, rows.map(function (k) { return Math.max(by[k][0], by[k][1]); }));
    return '<div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:12px"><div><small class="muted" style="font-size:12px">Budget</small><div style="font-size:22px;font-weight:600;letter-spacing:-.02em">' + UI.inrS(tb) + '</div></div><div><small class="muted" style="font-size:12px">Spent</small><div style="font-size:22px;font-weight:600;letter-spacing:-.02em">' + UI.inrS(ts) + '</div></div><div><small class="muted" style="font-size:12px">Remaining (formula)</small><div style="font-size:22px;font-weight:600;letter-spacing:-.02em;color:' + (tb - ts < 0 ? 'var(--bad)' : 'var(--ok)') + '">' + UI.inrS(tb - ts) + '</div></div></div>' +
      rows.map(function (k) { var b = by[k][0], s = by[k][1], over = s > b; return '<div class="hbar" style="grid-template-columns:110px minmax(0,1fr) 120px"><span class="hn">' + esc(k) + '</span><span class="hb" style="position:relative"><i style="position:absolute;left:0;top:0;bottom:0;width:' + (b / max * 100) + '%;background:var(--sunk);border:1px solid var(--line-3);border-radius:4px"></i><i style="position:absolute;left:0;top:4px;bottom:4px;width:' + (s / max * 100) + '%;background:' + (over ? 'var(--bad)' : 'var(--accent)') + ';border-radius:3px"></i></span><span class="hv" style="font-size:12px">' + UI.inrS(s) + ' / ' + UI.inrS(b) + '</span></div>'; }).join('') +
      '<p class="faint" style="font-size:12px;margin-top:8px">Grouped by ' + esc(fg ? fg.name : 'project') + ' · outline = budget, fill = spent</p>';
  };
  OW.dashR = R;

  UI.act('db-go', function (el) { app.go('#/dash/' + el.getAttribute('data-id')); });
  UI.act('db-edit', function () { DB.edit = !DB.edit; app.render(); });
  UI.act('db-goto', function (el) { app.go('#/p/' + el.getAttribute('data-id')); });
  UI.act('db-f', function (el) {
    var f = el.getAttribute('data-f');
    if (f === 'open') return goFilter({ status: 'open' });
    if (f === 'overdue') return goFilter({ due: 'overdue' });
    if (f === 'done') return goFilter({ status: 'done' });
    if (f === 'time') return app.go('#/p/*/table');
    if (f.indexOf('cat:') === 0) return goFilter({ status: f.slice(4) }, el.getAttribute('data-p'));
    if (f.indexOf('over:') === 0) return goFilter({ due: 'overdue', who: [f.slice(5)] });
    if (f.indexOf('who:') === 0) { var st = OW.project.state('*'); st.filter = { q: '', who: [f.slice(4)], pri: [], tags: [], due: '', status: 'open' }; st.saved = null; app.go('#/p/*/workload'); }
  });
  function curD() { return OW.byId(store.S.dashboards, app.route.args[0]) || store.S.dashboards[0]; }
  UI.act('db-move', function (el) { var d = curD(), i = +el.getAttribute('data-i'), j = i + +el.getAttribute('data-d'); if (j < 0 || j >= d.widgets.length) return; store.commit('Moved widget', function () { var w = d.widgets.splice(i, 1)[0]; d.widgets.splice(j, 0, w); }, { quiet: true }); });
  UI.act('db-size', function (el) { var d = curD(), w = d.widgets[+el.getAttribute('data-i')]; store.commit('Resized widget', function () { w.w = (w.w || 1) % 3 + 1; }, { quiet: true }); });
  UI.act('db-del', function (el) { var d = curD(), i = +el.getAttribute('data-i'), w = d.widgets[i]; store.commit('Removed ' + KINDS[w.type][0], function () { d.widgets.splice(i, 1); }); });
  UI.act('db-proj', function (el) {
    var d = curD(), w = d.widgets[+el.getAttribute('data-i')];
    var items = Q.projectsVisible().map(function (p) { return { label: p.name, html: UI.pdot(p), checked: w.project === p.id, fn: function () { store.commit('Widget shows ' + p.name, function () { w.project = p.id; }, { quiet: true }); } }; });
    if (w.type === 'status') items.unshift({ label: 'All projects', icon: 'layers', checked: w.project === '*', fn: function () { store.commit('Widget shows all projects', function () { w.project = '*'; }, { quiet: true }); } });
    UI.menu(el, items, { alignRight: true });
  });
  UI.act('db-add', function (el) {
    var d = OW.byId(store.S.dashboards, el.getAttribute('data-id'));
    var dl = UI.dialog({ title: 'Add a widget', foot: false, body: '<div class="wg-pick">' + Object.keys(KINDS).map(function (k) { return '<button type="button" data-k="' + k + '"><b>' + KINDS[k][0] + '</b><small>' + KINDS[k][1] + '</small></button>'; }).join('') + '</div>' });
    dl.el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-k]'); if (!b) return; var k = b.getAttribute('data-k');
      store.commit('Added ' + KINDS[k][0], function () { d.widgets.push({ id: store.uid('wg'), type: k, project: ['burnup', 'budget'].indexOf(k) > -1 ? 'p1' : k === 'status' ? '*' : undefined, w: k === 'kpis' || k === 'health' ? 3 : k === 'burnup' || k === 'budget' || k === 'workload' ? 2 : 1 }); });
      dl.close(); setTimeout(function () { var v = document.getElementById('view'); v.scrollTo({ top: v.scrollHeight, behavior: UI.reduced() ? 'auto' : 'smooth' }); }, 60);
    });
  });
})();
