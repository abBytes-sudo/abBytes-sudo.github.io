/* Ordwell — task panel (slide-over) and full task page: properties with "+ Add …" gaps, latest-remark callout,
   subtasks, checklist, dependencies, attachments (demo), time tracking with timer, comments with @mentions,
   internal comments, reactions, activity log. Also the simulated teammate replies (demo). */
(function () {
  'use strict';
  var OW = window.OW, UI = OW.UI, Q = OW.Q, D = OW.D, I = UI.I, esc = UI.esc, store = OW.store, app = OW.app, F = OW.F;
  var T = OW.task = { id: null, tab: 'comments' };
  var host = null;

  function panelEl() { return document.getElementById('panel'); }
  T.show = function (id) { T.id = id; host = panelEl(); T.tab = T.tab || 'comments'; render(host, false); setTimeout(function () { var t = host.querySelector('.tp-title'); if (t && document.activeElement && !host.contains(document.activeElement)) host.focus({ preventScroll: true }); }, 40); };
  T.hide = function () { T.id = null; };
  T.refresh = function () { if (T.id && host) { if (!Q.task(T.id) || Q.task(T.id).archived) { app.closeTask(); return; } var sc = host.querySelector('.tp-body'), top = sc ? sc.scrollTop : 0; var a = document.activeElement, keepId = a && a.id; render(host, host.classList.contains('page-mode')); var sc2 = host.querySelector('.tp-body'); if (sc2) sc2.scrollTop = top; if (keepId && document.getElementById(keepId)) document.getElementById(keepId).focus(); } };

  OW.routes.t = function (main, args) {
    var t = Q.task(args[0]); if (!t || !Q.canSee(t)) { main.innerHTML = '<div class="empty"><div class="art">' + I('search') + '</div><h3>This task isn’t here</h3><p>It may have been archived, or you don’t have access.</p><a class="btn" href="#/home">Back to My work</a></div>'; return; }
    main.innerHTML = '<h1 class="sr">' + esc(t.num + ' ' + t.title) + '</h1><div class="panel page-mode" id="tpage" tabindex="-1"></div>';
    T.id = t.id; host = main.querySelector('#tpage'); render(host, true);
  };

  function prop(icon, label, val, id) { return '<div class="k" id="' + (id || '') + '">' + I(icon) + label + '</div><div class="v">' + val + '</div>'; }

  function render(el, pageMode) {
    var t = Q.task(T.id); if (!t) return;
    var S = store.S, p = Q.project(t.project), st = Q.status(t), g = Q.isGuest(), parent = t.parent && Q.task(t.parent);
    var subs = Q.subs(t.id), comments = S.comments.filter(function (c) { return c.task === t.id && (!g || !c.internal); }).sort(function (a, b) { return a.at - b.at; });
    var acts = S.activity.filter(function (a) { return a.task === t.id; }).sort(function (a, b) { return b.at - a.at; });
    var logged = Q.logged(t), running = S.timer && S.timer.task === t.id;
    var h = '<div class="tp-top"><div class="crumb">' + UI.pdot(p) + '<a href="#/p/' + p.id + '">' + esc(p.name) + '</a>' + (parent ? '<span class="faint">/</span><button type="button" data-act="open-task" data-id="' + parent.id + '" style="color:inherit">' + esc(parent.num) + '</button>' : '') + '<span class="faint">/</span><span class="mono">' + esc(t.num) + '</span></div>' +
      (g ? '' : '<button type="button" class="btn sm' + (running ? ' rec on' : '') + '" data-act="tp-timer" data-id="' + t.id + '" aria-pressed="' + !!running + '">' + I(running ? 'stop' : 'play') + (running ? '<span data-live-timer>' + UI.clock(Date.now() - S.timer.start) + '</span>' : 'Start timer') + '</button>') +
      '<button type="button" class="ibtn" data-act="tp-copy" data-id="' + t.id + '" aria-label="Copy link" title="Copy link">' + I('link') + '</button>' +
      (pageMode ? '' : '<a class="ibtn" href="#/t/' + t.id + '" aria-label="Open as full page" title="Open as full page">' + I('expand') + '</a>') +
      (g ? '' : '<button type="button" class="ibtn" data-act="tp-more" data-id="' + t.id + '" aria-label="More actions">' + I('more') + '</button>') +
      (pageMode ? '' : '<button type="button" class="ibtn" data-act="close-panel" aria-label="Close panel (Esc)">' + I('x') + '</button>') + '</div>';
    h += '<div class="tp-body">';
    h += '<label class="sr" for="tp-title">Task title</label><textarea id="tp-title" class="tp-title" rows="1"' + (g ? ' readonly' : '') + '>' + esc(t.title) + '</textarea>';
    // context first: blockers + latest remark
    var blockers = Q.blockers(t).filter(function (b) { return !Q.isDone(b); });
    if (blockers.length && !Q.isDone(t)) h += '<div class="callout bad">' + I('blocked') + '<span><b>Blocked by ' + blockers.length + ' task' + (blockers.length > 1 ? 's' : '') + ':</b> ' + blockers.map(function (b) { return '<button type="button" data-act="open-task" data-id="' + b.id + '" style="color:inherit;text-decoration:underline;text-underline-offset:2px">' + esc(b.num) + ' ' + esc(b.title) + '</button> (' + esc(Q.status(b).name) + ')'; }).join(', ') + '</span></div>';
    var last = comments[comments.length - 1];
    if (last) { var lu = Q.user(last.uid); h += '<div class="callout' + (last.uid === 'u11' || last.uid === 'u12' ? '' : ' acc') + '">' + I('msg') + '<span><b>Latest from ' + esc(lu ? lu.name.split(' ')[0] : 'automation') + (lu && lu.role === 'guest' ? ' (client)' : '') + ', ' + D.ago(last.at) + ':</b> ' + fmtText(last.text.length > 170 ? last.text.slice(0, 170) + '…' : last.text) + '</span></div>'; }
    // properties
    var ed = !g;
    h += '<div class="props">';
    h += prop('target', 'Status', ed ? '<button type="button" class="pill" style="--c:' + UI.CAT[st.cat] + '" data-act="pick-status" data-id="' + t.id + '">' + UI.sdot(st) + esc(st.name) + I('chd', 's') + '</button>' + (Q.isDone(t) && t.doneAt ? '<span class="faint" style="font-size:12px">done ' + D.ago(t.doneAt) + '</span>' : '') : UI.pill(t));
    h += prop('users', 'Assignees', (ed ? '<button type="button" class="pv' + (t.assignees.length ? '' : ' add') + '" data-act="pick-who" data-id="' + t.id + '">' : '<span class="pv">') + (t.assignees.length ? UI.avs(t.assignees, 4) + ' ' + t.assignees.map(function (a) { return esc(Q.user(a).name.split(' ')[0]); }).join(', ') : '+ Add assignee') + (ed ? '</button>' : '</span>'));
    var dates = (t.start || t.due) ? '<span>' + (t.start ? D.fmt(t.start) : '—') + ' → </span>' + UI.due(t, true) : '';
    h += prop('calendar', 'Dates', ed ? '<button type="button" class="pv' + (t.start ? '' : ' add') + '" data-act="tp-start" data-id="' + t.id + '">' + (t.start ? 'Start ' + D.fmt(t.start) : '+ Add start') + '</button><span class="faint">→</span><button type="button" class="pv' + (t.due ? '' : ' add') + '" data-act="pick-due" data-id="' + t.id + '">' + (t.due ? UI.due(t, true) : '+ Add due date') + '</button>' : dates || '<span class="faint">No dates</span>');
    h += prop('flag', 'Priority', ed ? '<button type="button" class="pv' + (t.priority ? '' : ' add') + '" data-act="pick-pri" data-id="' + t.id + '">' + UI.prio(t.priority) + (t.priority ? UI.PRI[t.priority] : '+ Set priority') + '</button>' : UI.prio(t.priority) + ' ' + UI.PRI[t.priority]);
    h += prop('clock', 'Estimate', ed ? '<span class="pv"><input type="number" min="0" step="0.5" id="tp-est" value="' + (t.est || '') + '" placeholder="+ Add hours" aria-label="Estimate in hours" style="width:52px">' + (t.est ? '<span class="faint">hours</span>' : '') + '</span>' : (t.est ? t.est + ' h' : '—'));
    h += prop('tag', 'Tags', t.tags.map(UI.tag).join(' ') + (ed ? '<button type="button" class="pv add" data-act="tp-tags" data-id="' + t.id + '">+ ' + (t.tags.length ? 'Edit' : 'Add tag') + '</button>' : ''));
    if (!g) h += prop('folder', 'Project', '<button type="button" class="pv" data-act="tp-move" data-id="' + t.id + '">' + UI.pdot(p) + esc(p.name) + '</button>');
    Q.fieldsFor(t.project).forEach(function (f) {
      if (g && (f.type === 'number' && f.fmt === 'inr' || f.type === 'formula' && f.fmt === 'inr')) return; // money fields stay internal
      var v = f.type === 'formula' ? F.eval(f.formula, t) : { v: t.fields[f.id] }, has = v.v != null && v.v !== '' && !(f.type === 'check' && !v.v && false);
      var ic = { number: 'hash', select: 'sel', date: 'calendar', people: 'users', check: 'cbox', formula: 'fx', text: 'text' }[f.type];
      var shown;
      if (f.type === 'formula') shown = v.err ? '<span class="due over" title="' + esc(v.err) + '">Formula error</span>' : '<span class="pv" title="' + esc(f.formula) + '">' + esc(UI.fmtField(f, v.v)) + ' <span class="faint" style="font-size:11.5px">· formula</span></span>';
      else if (f.type === 'check') shown = ed ? '<label class="pv"><input type="checkbox" class="cb" data-change="tp-field-chk" data-f="' + f.id + '"' + (v.v ? ' checked' : '') + '> ' + (v.v ? 'Yes' : 'Not yet') + '</label>' : (v.v ? 'Yes' : 'Not yet');
      else if (!has) shown = ed ? '<button type="button" class="pv add" data-act="tp-field" data-f="' + f.id + '">+ Add ' + esc(f.name.toLowerCase()) + '</button>' : '<span class="faint">—</span>';
      else shown = ed ? '<button type="button" class="pv" data-act="tp-field" data-f="' + f.id + '">' + (f.type === 'people' ? UI.av(v.v, 's') + ' ' : '') + esc(UI.fmtField(f, v.v)) + '</button>' : esc(UI.fmtField(f, v.v));
      h += prop(ic, esc(f.name), shown);
    });
    h += '</div>';
    // description
    h += '<div class="tp-sec"><h3>Description</h3><label class="sr" for="tp-desc">Description</label><textarea id="tp-desc" class="desc" rows="3" placeholder="' + (g ? 'No description' : 'Add context, links and what “done” looks like…') + '"' + (g ? ' readonly' : '') + '>' + esc(t.desc) + '</textarea></div>';
    // subtasks
    if (!t.parent) {
      var sd = subs.filter(Q.isDone).length;
      h += '<div class="tp-sec"><h3>Subtasks <small>' + (subs.length ? sd + ' of ' + subs.length + ' done' : '') + '</small><span class="sp"></span>' + (subs.length ? '<span class="meter ok" style="width:120px"><i style="width:' + Math.round(sd / subs.length * 100) + '%"></i></span>' : '') + '</h3><div class="subs">';
      subs.forEach(function (s) {
        h += '<div class="sr-row' + (Q.isDone(s) ? ' done' : '') + '" data-tid="' + s.id + '">' + (g ? UI.sdot(Q.status(s)) : '<input type="checkbox" class="cb" data-change="tp-sub-done" data-id="' + s.id + '"' + (Q.isDone(s) ? ' checked' : '') + ' aria-label="Mark ' + esc(s.title) + ' done">') +
          '<button type="button" class="t" data-act="open-task" data-id="' + s.id + '">' + esc(s.title) + '</button>' + UI.pill(s) + UI.avs(s.assignees, 2, 's') + '</div>';
      });
      h += '</div>' + (g ? '' : '<label class="inl-add">' + I('plus', 's') + '<input type="text" id="tp-addsub" placeholder="Add a subtask, then Enter" aria-label="Add a subtask"></label>') + '</div>';
    }
    // checklist
    var cd = t.checklist.filter(function (c) { return c.done; }).length;
    if (t.checklist.length || !g) {
      h += '<div class="tp-sec"><h3>Checklist <small>' + (t.checklist.length ? cd + ' of ' + t.checklist.length + ' checked' : '') + '</small><span class="sp"></span>' + (t.checklist.length ? '<span class="meter" style="width:120px"><i style="width:' + Math.round(cd / t.checklist.length * 100) + '%"></i></span>' : '') + '</h3>';
      t.checklist.forEach(function (c) { h += '<div class="ck-row' + (c.done ? ' done' : '') + '"><input type="checkbox" class="cb" id="ck-' + c.id + '" data-change="tp-ck" data-c="' + c.id + '"' + (c.done ? ' checked' : '') + (g ? ' disabled' : '') + '><label for="ck-' + c.id + '">' + esc(c.t) + '</label>' + (g ? '' : '<button type="button" class="ibtn x" data-act="tp-ck-del" data-c="' + c.id + '" aria-label="Remove ' + esc(c.t) + '">' + I('x', 's') + '</button>') + '</div>'; });
      if (!g) h += '<label class="inl-add">' + I('plus', 's') + '<input type="text" id="tp-addck" placeholder="Add an item, then Enter" aria-label="Add a checklist item"></label>';
      h += '</div>';
    }
    // dependencies
    var blocking = Q.blocking(t);
    if (t.deps.length || blocking.length || !g) {
      h += '<div class="tp-sec"><h3>Dependencies<span class="sp"></span>' + (g ? '' : '<button type="button" class="btn sm ghost" data-act="tp-dep" data-id="' + t.id + '">' + I('plus', 's') + 'Add</button>') + '</h3>';
      Q.blockers(t).forEach(function (b) { h += '<div class="dep-row"><span class="lbl">Blocked by</span>' + UI.sdot(Q.status(b)) + '<button type="button" class="t" data-act="open-task" data-id="' + b.id + '">' + esc(b.num) + ' · ' + esc(b.title) + '</button>' + (b.due ? UI.due(b) : '') + (g ? '' : '<button type="button" class="ibtn" data-act="tp-dep-del" data-a="' + b.id + '" data-b="' + t.id + '" aria-label="Remove dependency">' + I('x', 's') + '</button>') + '</div>'; });
      blocking.forEach(function (b) { h += '<div class="dep-row"><span class="lbl">Blocking</span>' + UI.sdot(Q.status(b)) + '<button type="button" class="t" data-act="open-task" data-id="' + b.id + '">' + esc(b.num) + ' · ' + esc(b.title) + '</button>' + (b.start ? '<span class="due">starts ' + D.fmt(b.start) + '</span>' : '') + (g ? '' : '<button type="button" class="ibtn" data-act="tp-dep-del" data-a="' + t.id + '" data-b="' + b.id + '" aria-label="Remove dependency">' + I('x', 's') + '</button>') + '</div>'; });
      if (!t.deps.length && !blocking.length) h += '<p class="faint" style="font-size:12.5px">No dependencies. Link tasks here or drag between bars on the timeline.</p>';
      h += '</div>';
    }
    // attachments
    h += '<div class="tp-sec"><h3>Attachments <small>' + (t.attachments.length || '') + '</small></h3><div class="atts">';
    t.attachments.forEach(function (a) { h += '<div class="att">' + UI.fileIcon(a) + '<span style="min-width:0;flex:1"><b>' + esc(a.name) + '</b><small>' + UI.kb(a.kb) + ' · ' + esc((Q.user(a.by) || { name: 'You' }).name.split(' ')[0]) + ' · ' + D.ago(a.at) + '</small></span>' + (g ? '' : '<button type="button" class="ibtn" data-act="tp-att-del" data-a="' + a.id + '" aria-label="Remove ' + esc(a.name) + '">' + I('x', 's') + '</button>') + '</div>'; });
    if (!g) h += '<label class="drop-z" id="tp-drop">' + I('upload') + '<span>Drop files or <u>browse</u></span><input type="file" multiple class="sr" id="tp-file"></label>';
    h += '</div></div>';
    // time
    var pct = t.est ? Math.round(logged / 60 / t.est * 100) : 0;
    h += '<div class="tp-sec"><h3>Time<span class="sp"></span>' + (g ? '' : '<button type="button" class="btn sm ghost" data-act="tp-log" data-id="' + t.id + '">' + I('plus', 's') + 'Log time</button>') + '</h3>' +
      '<div class="time-box"><div class="tm"><span class="big">' + UI.hm(logged) + '</span> <span class="muted">logged' + (t.est ? ' of ' + t.est + 'h estimate' : '') + '</span>' +
      (t.est ? '<div class="meter' + (pct > 100 ? ' bad' : pct > 80 ? '' : ' ok') + '" style="margin-top:8px"><i style="width:' + Math.min(100, pct) + '%"></i></div><small>' + (pct > 100 ? 'Over the estimate by ' + UI.hm(logged - t.est * 60) : '≈ ' + UI.hm(Math.max(0, t.est * 60 - logged)) + ' left') + (subs.length ? ' · includes subtasks' : '') + '</small>' : '<small>Add an estimate to see time left.</small>') + '</div>' +
      (g ? '' : '<button type="button" class="btn rec' + (running ? ' on' : '') + '" data-act="tp-timer" data-id="' + t.id + '">' + I(running ? 'stop' : 'play') + (running ? 'Stop · <span data-live-timer>' + UI.clock(Date.now() - S.timer.start) + '</span>' : 'Start') + '</button>') + '</div>';
    var logs = t.time.slice().sort(function (a, b) { return b.at - a.at; });
    if (logs.length) h += '<div class="tlog">' + logs.slice(0, 5).map(function (l) { return '<div class="tr">' + UI.av(l.uid, 's') + '<b style="font-weight:500">' + esc(Q.user(l.uid).name.split(' ')[0]) + '</b><span class="sp">' + esc(l.note || 'Logged') + ' · ' + D.ago(l.at) + '</span><b class="num" style="font-weight:600">' + UI.hm(l.mins) + '</b></div>'; }).join('') + (logs.length > 5 ? '<p class="faint" style="font-size:12px;padding-top:6px">+ ' + (logs.length - 5) + ' earlier entries</p>' : '') + '</div>';
    h += '</div>';
    // comments / activity
    h += '<div class="tp-sec"><div class="tabs" role="tablist"><button type="button" role="tab" data-act="tp-tab" data-k="comments" aria-selected="' + (T.tab === 'comments') + '">Comments<small>' + comments.length + '</small></button><button type="button" role="tab" data-act="tp-tab" data-k="activity" aria-selected="' + (T.tab === 'activity') + '">Activity<small>' + acts.length + '</small></button></div>';
    if (T.tab === 'activity') {
      h += acts.map(function (a) { var u = Q.user(a.uid); return '<div class="act"><span class="ad">' + (u ? UI.av(a.uid, 's') : UI.av('bot', 's')) + '</span><span><b>' + esc(u ? u.name : 'Automation') + '</b> ' + esc(a.text) + '<time>' + D.ago(a.at) + '</time></span></div>'; }).join('') || '<p class="faint">No activity yet.</p>';
    } else {
      h += comments.map(function (c) {
        var u = Q.user(c.uid), mine = c.uid === Q.me(), rx = c.reactions || {};
        return '<div class="cmt">' + (u ? UI.av(c.uid, 'l') : UI.av('bot', 'l')) + '<div class="cb-body"><div class="ch"><b>' + esc(u ? u.name : 'Automation') + '</b>' + (u && u.role === 'guest' ? '<span class="tag">Client</span>' : '') + (c.internal && !g ? '<span class="int">Internal</span>' : '') + '<small>' + D.ago(c.at) + '</small></div><div class="ct">' + fmtText(c.text) + '</div>' +
          '<div class="reacts">' + ['👍', '🎉', '👀'].map(function (e) { var who = rx[e] || [], on = who.indexOf(Q.me()) > -1; return '<button type="button" data-act="tp-react" data-c="' + c.id + '" data-e="' + e + '" aria-pressed="' + on + '" aria-label="React ' + e + '">' + e + (who.length ? ' ' + who.length : '') + '</button>'; }).join('') + (mine && !g ? '' : '') + '</div></div></div>';
      }).join('') || '<p class="faint" style="padding:6px 0 12px">No comments yet. Start the conversation — type @ to mention someone.</p>';
      h += '<div class="compose"><label class="sr" for="tp-cmt">Write a comment</label><textarea id="tp-cmt" placeholder="Write a comment… type @ to mention someone"></textarea><div class="cf">' + (g ? '<span class="faint" style="font-size:12px">The Fernhill team will see this.</span>' : '<label><input type="checkbox" class="cb" id="tp-int"' + (p.members.some(function (m) { return Q.user(m).role === 'guest'; }) ? '' : ' checked') + '> Internal — hidden from client guests</label>') + '<span class="sp"></span><span class="faint" style="font-size:11.5px"><kbd>⌘</kbd><kbd>↵</kbd></span><button type="button" class="btn sm pri" data-act="tp-send" data-id="' + t.id + '">Comment</button></div></div>';
    }
    h += '</div></div>';
    el.innerHTML = h;
    wire(el, t);
  }
  function fmtText(s) {
    var out = esc(s);
    store.S.users.forEach(function (u) { out = out.split('@' + esc(u.name)).join('<span class="mn">@' + esc(u.name) + '</span>'); });
    return out;
  }
  function grow(ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }

  function wire(el, t) {
    var ti = el.querySelector('#tp-title'); grow(ti);
    ti.addEventListener('input', function () { grow(ti); });
    ti.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); ti.blur(); } if (e.key === 'Escape') { ti.value = t.title; ti.blur(); e.stopPropagation(); } });
    ti.addEventListener('blur', function () { var v = ti.value.trim(); if (v && v !== t.title && !Q.isGuest()) store.commit('Renamed ' + t.num, function () { store.log(t, 'renamed this to “' + v + '”'); t.title = v; t.updated = Date.now(); }); else ti.value = t.title; });
    var de = el.querySelector('#tp-desc');
    de.addEventListener('blur', function () { var v = de.value; if (v !== t.desc && !Q.isGuest()) store.commit('Updated description', function () { t.desc = v; store.log(t, 'updated the description'); }, { quiet: true }); });
    var es = el.querySelector('#tp-est');
    if (es) es.addEventListener('change', function () { var v = es.value === '' ? 0 : Math.max(0, +es.value); store.commit('Estimate ' + v + 'h', function () { t.est = v; store.log(t, 'set the estimate to ' + v + 'h'); }); });
    var sb = el.querySelector('#tp-addsub');
    if (sb) sb.addEventListener('keydown', function (e) { if (e.key === 'Enter' && sb.value.trim()) { var v = sb.value.trim(); store.commit('Added subtask', function () { var s = OW.A.create({ project: t.project, parent: t.id, title: v, status: Q.firstStatus(Q.project(t.project)), assignees: t.assignees.slice(0, 1), due: t.due, start: t.start, order: Q.subs(t.id).length }); return s; }); setTimeout(function () { var n = document.getElementById('tp-addsub'); if (n) n.focus(); }, 30); } });
    var ck = el.querySelector('#tp-addck');
    if (ck) ck.addEventListener('keydown', function (e) { if (e.key === 'Enter' && ck.value.trim()) { var v = ck.value.trim(); store.commit('Added checklist item', function () { t.checklist.push({ id: store.uid('k'), t: v, done: false }); }, { quiet: true }); setTimeout(function () { var n = document.getElementById('tp-addck'); if (n) n.focus(); }, 30); } });
    var fi = el.querySelector('#tp-file'), dz = el.querySelector('#tp-drop');
    function addFiles(files) {
      if (!files || !files.length) return;
      var arr = Array.prototype.slice.call(files, 0, 8);
      store.commit('Attached ' + arr.length + ' file' + (arr.length > 1 ? 's' : ''), function () { arr.forEach(function (f) { var ext = (f.name.split('.').pop() || '').toLowerCase(); t.attachments.push({ id: store.uid('at'), name: f.name, kb: Math.max(1, Math.round(f.size / 1024)), kind: /png|jpe?g|gif|webp|svg/.test(ext) ? 'image' : /pdf/.test(ext) ? 'pdf' : /mp4|mov|webm/.test(ext) ? 'video' : /xlsx?|csv/.test(ext) ? 'sheet' : /fig/.test(ext) ? 'fig' : 'doc', by: Q.me(), at: Date.now() }); }); store.log(t, 'attached ' + arr.map(function (f) { return f.name; }).join(', ')); });
    }
    if (fi) fi.addEventListener('change', function () { addFiles(fi.files); });
    if (dz) { ['dragenter', 'dragover'].forEach(function (k) { dz.addEventListener(k, function (e) { e.preventDefault(); dz.classList.add('on'); }); }); ['dragleave', 'drop'].forEach(function (k) { dz.addEventListener(k, function (e) { e.preventDefault(); dz.classList.remove('on'); if (k === 'drop') addFiles(e.dataTransfer.files); }); }); }
    var cm = el.querySelector('#tp-cmt');
    if (cm) {
      cm.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(t); } });
      cm.addEventListener('input', function () { mention(cm); });
    }
  }

  /* @mention autocomplete */
  function mention(ta) {
    var pos = ta.selectionStart, before = ta.value.slice(0, pos), m = /@([A-Za-z]*)$/.exec(before);
    if (!m) { if (UI._mpop) { UI.closePop(); UI._mpop = false; } return; }
    var q = m[1].toLowerCase(), t = Q.task(T.id), p = Q.project(t.project);
    var users = store.S.users.filter(function (u) { return u.id !== Q.me() && p.members.indexOf(u.id) > -1 && u.name.toLowerCase().indexOf(q) > -1; }).slice(0, 6);
    if (!users.length) { UI.closePop(); return; }
    var r = ta.getBoundingClientRect();
    var el = UI.menu({ getBoundingClientRect: function () { return { left: r.left + 10, right: r.left + 210, top: r.top, bottom: r.top + 26 }; }, contains: function () { return false; } }, users.map(function (u) { return { label: u.name, hint: u.role === 'guest' ? 'client' : u.title.split(' ')[0], html: UI.av(u.id, 's'), fn: function () {
      var s = ta.value, start = pos - m[0].length; ta.value = s.slice(0, start) + '@' + u.name + ' ' + s.slice(pos); var c = start + u.name.length + 2; ta.focus(); ta.setSelectionRange(c, c);
      if (u.role === 'guest') { var ic = document.getElementById('tp-int'); if (ic && ic.checked) { ic.checked = false; UI.toast('Unticked “Internal” so ' + esc(u.name.split(' ')[0]) + ' can see this comment', { icon: 'eye' }); } }
    } }; }), {});
    UI._mpop = true;
    // keep typing in the textarea while the list is open
    setTimeout(function () { ta.focus(); }, 15);
    ta.onkeydown = function (e) {
      if (!document.body.contains(el)) { ta.onkeydown = null; return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var its = el.querySelectorAll('.mi'), i = Array.prototype.findIndex.call(its, function (x) { return x.classList.contains('hl'); }); its.forEach(function (x) { x.classList.remove('hl'); }); i = e.key === 'ArrowDown' ? (i + 1) % its.length : (i - 1 + its.length) % its.length; its[i].classList.add('hl'); }
      if (e.key === 'Enter' || e.key === 'Tab') { var hl = el.querySelector('.mi.hl') || el.querySelector('.mi'); if (hl) { e.preventDefault(); e.stopImmediatePropagation(); hl.click(); ta.onkeydown = null; } }
      if (e.key === 'Escape') { e.stopPropagation(); UI.closePop(); ta.onkeydown = null; }
    };
  }

  function send(t) {
    var cm = document.getElementById('tp-cmt'); if (!cm) return; var text = cm.value.trim();
    if (!text) { cm.focus(); UI.toast('Write something first'); return; }
    var internal = !!(document.getElementById('tp-int') && document.getElementById('tp-int').checked);
    var res = store.commit('Comment posted', function () { return OW.A.comment(t, text, internal); }, { quiet: true });
    var names = (res && res.mentioned || []).filter(function (u) { return u !== Q.me(); });
    UI.toast(names.length ? 'Comment posted · notified ' + names.map(function (u) { return esc(Q.user(u).name.split(' ')[0]); }).join(', ') : 'Comment posted', { icon: 'msg', undo: true });
    if (OW.sim) names.forEach(function (u) { OW.sim.reply(u, t.id, text); });
    T.tab = 'comments';
    setTimeout(function () { var b = host && host.querySelector('.tp-body'); if (b) b.scrollTop = b.scrollHeight; }, 30);
  }

  /* ---------- actions ---------- */
  UI.act('tp-send', function (el) { send(Q.task(el.getAttribute('data-id'))); });
  UI.act('tp-tab', function (el) { T.tab = el.getAttribute('data-k'); T.refresh(); });
  UI.act('tp-timer', function (el) { var t = Q.task(el.getAttribute('data-id')); if (store.S.timer && store.S.timer.task === t.id) app.stopTimer(); else app.startTimer(t); });
  UI.act('tp-copy', function (el) {
    var url = location.href.split('#')[0] + '#/t/' + el.getAttribute('data-id');
    try { navigator.clipboard.writeText(url).then(function () { UI.toast('Link copied', { icon: 'link' }); }, function () { UI.toast('Link: ' + esc(url)); }); } catch (e) { UI.toast('Link: ' + esc(url)); }
  });
  UI.act('tp-start', function (el) { var t = Q.task(el.getAttribute('data-id')); UI.pickDate(el, t.start, function (d) { store.commit(d ? 'Start ' + D.fmt(d) : 'Cleared start', function () { t.start = d; if (d && t.due && t.due < d) t.due = d; store.log(t, d ? 'set start date to ' + D.fmt(d) : 'cleared the start date'); }); }); });
  UI.act('tp-tags', function (el) { var t = Q.task(el.getAttribute('data-id')); UI.pickTags(el, t.tags, function (l) { store.commit('Tags updated', function () { t.tags = l; store.log(t, 'set tags to ' + (l.join(', ') || 'none')); }); }); });
  UI.act('tp-move', function (el) {
    var t = Q.task(el.getAttribute('data-id'));
    UI.menu(el, Q.projectsVisible().map(function (p) { return { label: p.name, html: UI.pdot(p), checked: p.id === t.project, fn: function () {
      if (p.id === t.project) return;
      store.commit('Moved ' + t.num + ' to ' + p.name, function () { var from = Q.project(t.project).name; t.project = p.id; if (!OW.byId(p.statuses, t.status)) t.status = Q.statusByCat(p, Q.cat(t)) || Q.firstStatus(p); Q.subs(t.id).forEach(function (s) { s.project = p.id; s.status = OW.byId(p.statuses, s.status) ? s.status : Q.firstStatus(p); }); store.log(t, 'moved this from ' + from + ' to ' + p.name); });
    } }; }), { search: 'Move to…' });
  });
  UI.act('tp-field', function (el) {
    var t = Q.task(T.id), f = Q.field(el.getAttribute('data-f')), set = function (v, label) { store.commit(f.name + ' → ' + label, function () { if (v == null || v === '') delete t.fields[f.id]; else t.fields[f.id] = v; store.log(t, 'set ' + f.name + ' to ' + label); }); };
    if (f.type === 'select') return UI.pickOption(el, f.options, t.fields[f.id], function (o) { set(o, o || 'empty'); }, true);
    if (f.type === 'people') return UI.pickPeople(el, [], function (u) { set(u, u ? Q.user(u).name : 'nobody'); }, { single: true, clear: true });
    if (f.type === 'date') return UI.pickDate(el, t.fields[f.id], function (d) { set(d, d ? D.fmt(d) : 'none'); });
    var pop = UI.pop(el, '<div style="padding:8px;width:240px"><label class="lbl-t" for="tf">' + esc(f.name) + (f.fmt === 'inr' ? ' (₹)' : f.fmt === 'pct' ? ' (%)' : '') + '</label><input id="tf" class="inp" type="' + (f.type === 'number' ? 'number' : 'text') + '" step="any" value="' + esc(t.fields[f.id] == null ? '' : t.fields[f.id]) + '"><p class="hint">Enter to save</p></div>');
    var inp = pop.querySelector('input'); inp.select();
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var v = inp.value.trim(); UI.closePop(); if (f.type === 'number') { if (v !== '' && isNaN(+v)) { UI.toast('That isn’t a number'); return; } set(v === '' ? null : +v, v === '' ? 'empty' : UI.fmtField(f, +v)); } else set(v, v || 'empty'); } });
  });
  UI.act('tp-field-chk', function (el) { var t = Q.task(T.id), f = Q.field(el.getAttribute('data-f')); store.commit(f.name + (el.checked ? ' ✓' : ' cleared'), function () { t.fields[f.id] = el.checked; store.log(t, (el.checked ? 'ticked ' : 'unticked ') + f.name); }); });
  UI.act('tp-sub-done', function (el) {
    var s = Q.task(el.getAttribute('data-id')), p = Q.project(s.project);
    var to = el.checked ? Q.doneStatus(p) : (Q.statusByCat(p, 'active') || Q.firstStatus(p));
    store.commit((el.checked ? 'Completed ' : 'Reopened ') + s.title, function () { OW.A.setStatus(s, to); });
  });
  UI.act('tp-ck', function (el) { var t = Q.task(T.id), c = OW.byId(t.checklist, el.getAttribute('data-c')); store.commit((el.checked ? 'Checked ' : 'Unchecked ') + c.t, function () { c.done = el.checked; }, { quiet: true }); });
  UI.act('tp-ck-del', function (el) { var t = Q.task(T.id), id = el.getAttribute('data-c'); store.commit('Removed checklist item', function () { t.checklist = t.checklist.filter(function (c) { return c.id !== id; }); }); });
  UI.act('tp-att-del', function (el) { var t = Q.task(T.id), id = el.getAttribute('data-a'); store.commit('Removed attachment', function () { t.attachments = t.attachments.filter(function (a) { return a.id !== id; }); }); });
  UI.act('tp-dep-del', function (el) { var a = el.getAttribute('data-a'), b = Q.task(el.getAttribute('data-b')); store.commit('Removed dependency', function () { b.deps = b.deps.filter(function (x) { return x !== a; }); store.log(b, 'is no longer blocked by ' + Q.task(a).num); }); });
  UI.act('tp-dep', function (el) {
    var t = Q.task(el.getAttribute('data-id'));
    var cands = Q.tasks(t.project).filter(function (x) { return x.id !== t.id && t.deps.indexOf(x.id) < 0 && x.deps.indexOf(t.id) < 0; });
    UI.menu(el, [{ head: 'This task is blocked by…' }].concat(cands.map(function (x) { return { label: x.num + ' ' + x.title, html: UI.sdot(Q.status(x)), fn: function () { store.commit(t.num + ' blocked by ' + x.num, function () { t.deps.push(x.id); store.log(t, 'is now blocked by ' + x.num); }); } }; })), { search: 'Find a task…' });
  });
  UI.act('tp-react', function (el) {
    var c = OW.byId(store.S.comments, el.getAttribute('data-c')), e = el.getAttribute('data-e');
    store.commit('Reaction', function () { c.reactions = c.reactions || {}; var l = c.reactions[e] = c.reactions[e] || [], i = l.indexOf(Q.me()); if (i > -1) l.splice(i, 1); else l.push(Q.me()); }, { quiet: true });
  });
  UI.act('tp-log', function (el) {
    var t = Q.task(el.getAttribute('data-id'));
    var pop = UI.pop(el, '<div style="padding:10px;width:280px"><div class="fld"><label class="lbl-t" for="lg-t">Time spent</label><input id="lg-t" class="inp" placeholder="e.g. 1h 30m or 45m" autocomplete="off"><div class="err" hidden id="lg-e"></div></div><div class="fld"><label class="lbl-t" for="lg-n">Note <span class="faint">(optional)</span></label><input id="lg-n" class="inp" placeholder="What you worked on"></div><button type="button" class="btn pri" style="width:100%" id="lg-ok">Log time</button></div>', { alignRight: true });
    function ok() {
      var v = pop.querySelector('#lg-t').value.trim().toLowerCase(), m = 0, mt;
      if ((mt = /(\d+(?:\.\d+)?)\s*h/.exec(v))) m += parseFloat(mt[1]) * 60; if ((mt = /(\d+)\s*m/.exec(v))) m += +mt[1]; if (!m && /^\d+(\.\d+)?$/.test(v)) m = parseFloat(v) * 60;
      if (!m || m > 24 * 60) { var e = pop.querySelector('#lg-e'); e.hidden = false; e.textContent = m > 24 * 60 ? 'That’s more than a day — split it across days.' : 'Try “1h 30m”, “45m” or “2”.'; return; }
      var note = pop.querySelector('#lg-n').value.trim(); UI.closePop();
      store.commit('Logged ' + UI.hm(m), function () { t.time.push({ id: store.uid('l'), uid: Q.me(), mins: Math.round(m), at: Date.now(), note: note }); store.log(t, 'logged ' + UI.hm(m)); });
    }
    pop.querySelector('#lg-ok').addEventListener('click', ok);
    pop.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); ok(); } });
  });
  UI.act('tp-more', function (el) {
    var t = Q.task(el.getAttribute('data-id'));
    UI.menu(el, [
      { label: 'Duplicate', icon: 'copy', fn: function () { var n = store.commit('Duplicated ' + t.num, function () { var x = OW.A.create({ project: t.project, title: t.title + ' (copy)', status: t.status, assignees: t.assignees.slice(), due: t.due, start: t.start, priority: t.priority, tags: t.tags.slice(), desc: t.desc, fields: JSON.parse(JSON.stringify(t.fields)), est: t.est }); x.checklist = t.checklist.map(function (c) { return { id: store.uid('k'), t: c.t, done: false }; }); return x; }); if (n && n.id) app.openTask(n.id); } },
      { label: t.tags.indexOf('client-visible') > -1 ? 'Hide from client guests' : 'Show to client guests', icon: 'eye', fn: function () { store.commit(t.tags.indexOf('client-visible') > -1 ? 'Hidden from clients' : 'Visible to clients', function () { var i = t.tags.indexOf('client-visible'); if (i > -1) t.tags.splice(i, 1); else t.tags.push('client-visible'); }); } },
      { label: 'Focus on this task', icon: 'focus', fn: function () { OW.pages.focus([t], t.title); } },
      { sep: true }, { label: 'Archive task', icon: 'archive', danger: true, fn: function () { store.commit('Archived ' + t.num, function () { OW.A.remove(t); }); app.closeTask(); } }
    ], { alignRight: true });
  });

  /* ---------- simulated teammates (demo) ---------- */
  var LINES = {
    u2: ['Looks good. Ship it once the client has seen it.', 'Let\'s keep the hero calmer — fewer words above the fold.', 'On it — I\'ll review before lunch.'],
    u3: ['On it! Will share a revised frame by evening.', 'Updated the file — check v4 in the attachments.', 'Got it, adding the annotations now.'],
    u4: ['Pushed a fix to staging, have a look.', 'Will pick this up right after standup.', 'Done on my side — needs a QA pass.'],
    u5: ['Copy is in the doc, two options for the headline.', 'Tightened it to 40 words.', 'Sending the final copy in an hour.'],
    u6: ['Rendering the new cut now, ~20 minutes.', 'Swapped the music track, much better pace.', 'Exported both ratios.'],
    u7: ['I\'ll take this to the client call at 4.', 'Client confirmed — we\'re good to proceed.', 'Added it to Friday\'s status note.'],
    u8: ['API side is ready; webhook retries are on.', 'Looked at the logs — it\'s a timeout, fixing.', 'Merged. Should be live after the next deploy.'],
    u9: ['Scheduled for Thursday 7 pm, best slot for this audience.', 'Replied to the top 30 comments.', 'Will post the story tonight.'],
    u10: ['Tested on Android and iOS, two small bugs logged.', 'Regression pass is green.', 'Retesting after the fix.'],
    u11: ['Thanks! Approved from our side.', 'Can we see one more option before we approve?', 'Shared with our founder, will revert by tomorrow.'],
    u12: ['Compliance is fine with this version.', 'Looping in our dev lead for the API part.', 'Approved — please go ahead.']
  };
  OW.sim = {
    start: function () { },
    reply: function (uid, taskId, text) {
      var lines = LINES[uid]; if (!lines) return;
      var line = lines[(text.length + taskId.length) % lines.length];
      setTimeout(function () {
        var t = Q.task(taskId); if (!t) return;
        store.commit('Reply from ' + Q.user(uid).name, function (S) {
          S.comments.push({ id: store.uid('c'), task: t.id, uid: uid, at: Date.now(), text: '@' + Q.user(S.me).name + ' ' + line, internal: Q.user(uid).role !== 'guest' && false, reactions: {} });
          S.notifs.push({ id: store.uid('n'), to: S.me, kind: 'mention', from: uid, at: Date.now(), task: t.id, text: 'replied: "' + line + '"', read: false });
        }, { quiet: true, noUndo: true });
        UI.toast('<b>' + esc(Q.user(uid).name.split(' ')[0]) + '</b> replied on ' + esc(t.num) + '', { icon: 'msg', action: { label: 'Open', fn: function () { app.openTask(t.id); } } });
      }, 4200 + Math.round(Math.random() * 2500));
    }
  };
})();
