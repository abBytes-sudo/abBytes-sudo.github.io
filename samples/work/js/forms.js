/* Ordwell — Forms that create tasks: list, builder (questions mapped to task fields), live branded preview that
   really submits, submissions table, and a public link (form.html?f=ID) that clients use. */
(function () {
  'use strict';
  var OW = window.OW, UI = OW.UI, Q = OW.Q, D = OW.D, I = UI.I, esc = UI.esc, store = OW.store, app = OW.app;
  var FB = { tab: 'build' };
  var QT = [['text', 'Short answer'], ['long', 'Paragraph'], ['select', 'Dropdown'], ['date', 'Date'], ['email', 'Email'], ['number', 'Number'], ['file', 'File upload']];

  OW.routes.forms = function (main, args) {
    var S = store.S;
    if (args[0]) return builder(main, OW.byId(S.forms, args[0]));
    var h = '<div class="page"><div class="page-h"><div><h1>Forms</h1><p>Clients and teammates fill a branded form; each answer lands as a task with the right fields, owner and automations.</p></div><span class="sp"></span><button type="button" class="btn pri" data-act="fm-new">' + I('plus') + 'New form</button></div><div class="au-grid">';
    S.forms.forEach(function (f) {
      var p = Q.project(f.project), wk = f.subs.filter(function (s) { return Date.now() - s.at < 7 * 864e5; }).length;
      h += '<a class="au-card" href="#/forms/' + f.id + '"><div class="ah"><span class="nb" style="width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:var(--accent-bg);color:var(--accent)">' + I('form') + '</span><b>' + esc(f.name) + '</b><span class="tag" style="' + (f.on ? 'background:var(--ok-bg);color:var(--ok)' : '') + '">' + (f.on ? 'Live' : 'Paused') + '</span></div>' +
        '<p class="au-sent">' + f.fields.length + ' questions → new task in <em>' + esc(p.name) + '</em>' + (S.automations.some(function (a) { return a.on && a.trigger.type === 'created' && (a.project === p.id || a.project === '*'); }) ? ', then routed by an automation' : '') + '.</p>' +
        '<div class="af"><span>' + f.subs.length + ' submissions · ' + wk + ' this week</span><span class="sp"></span><span class="mono" style="font-size:11px">' + esc((S.brand.domain || 'forms.ordwell.app') + '/f/' + f.slug) + '</span></div></a>';
    });
    main.innerHTML = h + '</div></div>';
  };

  function builder(main, f) {
    if (!f) { app.go('#/forms'); return; }
    var S = store.S, p = Q.project(f.project), maps = [['title', 'Task title'], ['desc', 'Description'], ['due', 'Due date'], ['priority', 'Priority'], ['email', 'Requester email'], ['attach', 'Attachments'], ['none', 'Description (as a line)']].concat(Q.fieldsFor(p.id).filter(function (x) { return x.type !== 'formula'; }).map(function (x) { return [x.id, 'Field: ' + x.name]; }));
    var h = '<div class="page" style="max-width:1280px"><div class="page-h"><div><div class="eyebrow"><a href="#/forms">' + I('chl', 's') + ' Forms</a></div><h1>' + esc(f.name) + '</h1><p>Answers become tasks in ' + UI.pdot(p) + ' <b>' + esc(p.name) + '</b>.</p></div><span class="sp"></span>' +
      '<div class="seg" role="tablist"><button type="button" role="tab" data-act="fm-tab" data-k="build" aria-selected="' + (FB.tab === 'build') + '" aria-pressed="' + (FB.tab === 'build') + '">Build</button><button type="button" role="tab" data-act="fm-tab" data-k="subs" aria-pressed="' + (FB.tab === 'subs') + '" aria-selected="' + (FB.tab === 'subs') + '">Submissions · ' + f.subs.length + '</button></div>' +
      '<a class="btn" href="form.html?f=' + f.id + '" target="_blank" rel="noopener">' + I('globe') + 'Open public form</a><button type="button" class="btn" data-act="fm-copy" data-id="' + f.id + '">' + I('link') + 'Copy link</button></div>';
    if (FB.tab === 'subs') {
      h += '<div class="card" style="overflow:auto"><table class="runlog"><thead><tr><th>Received</th><th>From</th><th>Task created</th><th>Now</th><th>Assignee</th></tr></thead><tbody>';
      if (!f.subs.length) h += '<tr><td colspan="5"><div class="empty" style="padding:30px"><h3>No submissions yet</h3><p>Share the link or try the preview on the Build tab.</p></div></td></tr>';
      f.subs.forEach(function (s) { var t = Q.task(s.task); h += '<tr><td><b style="font-weight:500">' + D.ago(s.at) + '</b></td><td>' + esc(s.email || '—') + '</td><td>' + (t ? '<button type="button" data-act="open-task" data-id="' + t.id + '" style="text-align:left"><span class="mono">' + esc(t.num) + '</span> ' + esc(t.title) + '</button>' : esc(s.title) + ' <span class="faint">(archived)</span>') + '</td><td>' + (t ? UI.pill(t) : '') + '</td><td>' + (t ? UI.avs(t.assignees, 3, 's') : '') + '</td></tr>'; });
      main.innerHTML = h + '</tbody></table></div></div>'; return;
    }
    h += '<div class="fb"><div>';
    h += '<div class="card" style="padding:16px;margin-bottom:14px"><div class="fld"><label class="lbl-t" for="fm-n">Form name</label><input id="fm-n" class="inp" data-change="fm-set" data-k="name" value="' + esc(f.name) + '"></div>' +
      '<div class="fld"><label class="lbl-t" for="fm-i">Intro shown to people filling it</label><textarea id="fm-i" class="inp" rows="2" data-change="fm-set" data-k="intro">' + esc(f.intro) + '</textarea></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><label class="lbl-t" for="fm-p">Creates tasks in</label><select id="fm-p" class="inp" data-change="fm-set" data-k="project">' + Q.projectsVisible().map(function (x) { return '<option value="' + x.id + '"' + (x.id === f.project ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select></div>' +
      '<div><label class="lbl-t" for="fm-s">With status</label><select id="fm-s" class="inp" data-change="fm-set" data-k="status">' + p.statuses.map(function (s) { return '<option value="' + s.id + '"' + (s.id === f.status ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') + '</select></div></div>' +
      '<label class="switch" style="margin-top:14px"><input type="checkbox" data-change="fm-on"' + (f.on ? ' checked' : '') + '><i></i>Accepting responses</label></div>';
    f.fields.forEach(function (q, i) {
      h += '<div class="fq"><span class="grip" aria-hidden="true">' + I('grip', 's') + '</span><div class="fqb"><input class="inp" data-change="fm-q" data-i="' + i + '" data-k="label" value="' + esc(q.label) + '" aria-label="Question ' + (i + 1) + ' label"><select class="inp" data-change="fm-q" data-i="' + i + '" data-k="type" aria-label="Answer type">' + QT.map(function (t) { return '<option value="' + t[0] + '"' + (t[0] === q.type ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select>' +
        (q.type === 'select' ? '<input class="inp full" style="grid-column:1/-1" data-change="fm-q" data-i="' + i + '" data-k="options" value="' + esc((q.options || []).join(', ')) + '" placeholder="Options, comma separated" aria-label="Options">' : '') +
        '<div class="full"><label style="display:inline-flex;align-items:center;gap:6px">Maps to <select class="inp" style="width:auto;height:28px;font-size:12.5px" data-change="fm-q" data-i="' + i + '" data-k="map" aria-label="Maps to task field">' + maps.map(function (m) { return '<option value="' + m[0] + '"' + (m[0] === (q.map || 'none') ? ' selected' : '') + '>' + esc(m[1]) + '</option>'; }).join('') + '</select></label>' +
        '<label style="display:inline-flex;align-items:center;gap:6px"><input type="checkbox" class="cb" data-change="fm-q" data-i="' + i + '" data-k="req"' + (q.req ? ' checked' : '') + '>Required</label><span style="flex:1"></span>' +
        (i > 0 ? '<button type="button" class="ibtn" data-act="fm-mv" data-i="' + i + '" data-d="-1" aria-label="Move up">' + I('chu', 's') + '</button>' : '') + (i < f.fields.length - 1 ? '<button type="button" class="ibtn" data-act="fm-mv" data-i="' + i + '" data-d="1" aria-label="Move down">' + I('chd', 's') + '</button>' : '') +
        '<button type="button" class="ibtn" data-act="fm-rm" data-i="' + i + '" aria-label="Delete question">' + I('trash', 's') + '</button></div></div></div>';
    });
    h += '<button type="button" class="btn" data-act="fm-addq">' + I('plus') + 'Add question</button>';
    var titled = f.fields.some(function (q) { return q.map === 'title'; });
    if (!titled) h += '<div class="callout bad" style="margin-top:12px">' + I('blocked') + '<span>Map one question to <b>Task title</b> so every submission gets a readable name.</span></div>';
    h += '</div><div><div class="eyebrow" style="margin-bottom:8px">' + I('eye', 's') + 'Live preview — this really submits</div>' + OW.formHtml(f, 'pv') + '</div></div></div>';
    main.innerHTML = h;
    OW.formWire(main.querySelector('form[data-form]'), f, function (t) {
      UI.toast('Submitted — created <b>' + esc(t.num) + '</b> in ' + esc(Q.project(t.project).name), { icon: 'form', action: { label: 'Open', fn: function () { app.openTask(t.id); } } });
    });
  }

  UI.act('fm-tab', function (el) { FB.tab = el.getAttribute('data-k'); app.render(); });
  function curF() { return OW.byId(store.S.forms, app.route.args[0]); }
  UI.act('fm-set', function (el) { var f = curF(), k = el.getAttribute('data-k'); store.commit('Form updated', function () { f[k] = el.value; if (k === 'project') { var p = Q.project(el.value); f.status = Q.firstStatus(p); f.fields.forEach(function (q) { if (/^f\d+/.test(q.map)) q.map = 'none'; }); } }, { quiet: true }); });
  UI.act('fm-on', function (el) { var f = curF(); store.commit(el.checked ? 'Form is live' : 'Form paused', function () { f.on = el.checked; }); });
  UI.act('fm-q', function (el) {
    var f = curF(), q = f.fields[+el.getAttribute('data-i')], k = el.getAttribute('data-k');
    store.commit('Question updated', function () { if (k === 'req') q.req = el.checked; else if (k === 'options') q.options = el.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean); else q[k] = el.value; if (k === 'type' && el.value === 'select' && !q.options) q.options = ['Option 1', 'Option 2']; }, { quiet: true });
  });
  UI.act('fm-addq', function () { var f = curF(); store.commit('Added question', function () { f.fields.push({ id: store.uid('q'), label: 'New question', type: 'text', map: 'none', req: false }); }, { quiet: true }); setTimeout(function () { var all = document.querySelectorAll('.fq input[data-k=label]'); var l = all[all.length - 1]; if (l) { l.focus(); l.select(); } }, 40); });
  UI.act('fm-rm', function (el) { var f = curF(), i = +el.getAttribute('data-i'); store.commit('Deleted question', function () { f.fields.splice(i, 1); }); });
  UI.act('fm-mv', function (el) { var f = curF(), i = +el.getAttribute('data-i'), j = i + +el.getAttribute('data-d'); store.commit('Moved question', function () { var q = f.fields.splice(i, 1)[0]; f.fields.splice(j, 0, q); }, { quiet: true }); });
  UI.act('fm-copy', function (el) { var url = location.href.split('#')[0].replace(/index\.html$/, '') + 'form.html?f=' + el.getAttribute('data-id'); try { navigator.clipboard.writeText(url).then(function () { UI.toast('Public link copied', { icon: 'link' }); }); } catch (e) { UI.toast(esc(url)); } });
  UI.act('fm-new', function () {
    var id; store.commit('New form', function (S) { id = store.uid('fm'); S.forms.push({ id: id, name: 'Untitled request form', project: 'p1', status: 'brief', slug: 'request-' + id, intro: 'Tell us what you need and when. We reply within one working day.', on: true, fields: [{ id: 'q1', label: 'What do you need?', type: 'text', map: 'title', req: true }, { id: 'q2', label: 'Details', type: 'long', map: 'desc', req: false }, { id: 'q3', label: 'Your email', type: 'email', map: 'email', req: true }], subs: [] }); }, { quiet: true });
    FB.tab = 'build'; app.go('#/forms/' + id);
  });
})();
