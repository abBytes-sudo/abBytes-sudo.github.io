/* Ordwell — Docs: a block editor (text, headings, lists, to-dos, quote, callout, divider) with "/" commands,
   markdown shortcuts, block menu (turn into, move, duplicate, delete, convert to task) and live task embeds. */
(function () {
  'use strict';
  var OW = window.OW, UI = OW.UI, Q = OW.Q, D = OW.D, I = UI.I, esc = UI.esc, store = OW.store, app = OW.app;
  var DOC = { focus: null, listMode: false };
  var TYPES = [
    ['p', 'Text', 'text', 'Plain paragraph'], ['h1', 'Heading 1', 'h1', 'Big section title'], ['h2', 'Heading 2', 'h2', 'Medium heading'], ['h3', 'Heading 3', 'h1', 'Small heading'],
    ['todo', 'To-do', 'cbox', 'Checkbox item'], ['bullet', 'Bulleted list', 'bullet', 'Simple list'], ['numbered', 'Numbered list', 'numbered', 'Ordered steps'],
    ['quote', 'Quote', 'quote', 'Pull quote'], ['callout', 'Callout', 'callout', 'Highlighted note'], ['divider', 'Divider', 'hr', 'Thin rule'],
    ['task', 'Task embed', 'target', 'One live task'], ['tasks', 'Task list embed', 'list', 'Live list of a project’s tasks']
  ];
  var TEXTY = ['p', 'h1', 'h2', 'h3', 'todo', 'bullet', 'numbered', 'quote', 'callout'];

  function docProject(d) { var ps = Q.projectsVisible().filter(function (p) { return p.space === d.space; }); return ps[0] || Q.projectsVisible()[0]; }

  OW.routes.docs = function (main, args) {
    var S = store.S, docs = S.docs.filter(function (d) { var sp = Q.space(d.space); return sp && sp.ws === S.ws; });
    var d = args[0] ? OW.byId(S.docs, args[0]) : docs[0];
    var h = '<div class="docs' + (DOC.listMode || !args[0] && innerWidth < 860 ? ' list-mode' : '') + '"><nav class="doc-list" aria-label="Docs"><div style="display:flex;align-items:center;padding:0 8px 10px"><b style="flex:1;font-size:13px">Docs</b><button type="button" class="btn sm" data-act="doc-new">' + I('plus', 's') + 'New</button></div>';
    S.spaces.filter(function (s) { return s.ws === S.ws; }).forEach(function (sp) {
      var ds = docs.filter(function (x) { return x.space === sp.id; }); if (!ds.length) return;
      h += '<div class="mh">' + esc(sp.name) + '</div>' + ds.map(function (x) { return '<a href="#/docs/' + x.id + '"' + (d && x.id === d.id ? ' aria-current="page"' : '') + '><span class="doc-ico">' + esc(x.icon || x.title.charAt(0)) + '</span><span style="min-width:0"><span style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(x.title || 'Untitled') + '</span><small>' + esc(Q.user(x.by).name.split(' ')[0]) + ' · ' + D.ago(x.updated) + '</small></span></a>'; }).join('');
    });
    h += '</nav><div class="doc-page" data-keep="doc">';
    if (!d) h += '<div class="empty"><div class="art">' + I('doc') + '</div><h3>No docs yet</h3><p>Briefs, SOPs and retros live next to the work they describe.</p><button type="button" class="btn pri" data-act="doc-new">New doc</button></div>';
    else {
      var sp = Q.space(d.space), num = 0;
      h += '<article class="doc"><div class="dmeta"><button type="button" class="btn sm ghost" data-act="doc-lists" style="display:none" id="doc-back">' + I('chl', 's') + 'Docs</button>' + I('folder', 's') + esc(sp.name) + ' · ' + esc(Q.user(d.by).name) + ' · edited ' + D.ago(d.updated) + '<span style="flex:1"></span>' + (Q.isGuest() ? '' : '<button type="button" class="ibtn" data-act="doc-more" data-id="' + d.id + '" aria-label="Doc options">' + I('more') + '</button>') + '</div>' +
        '<h1 class="sr">' + esc(d.title || 'Untitled doc') + '</h1><label class="sr" for="doc-t">Doc title</label><input id="doc-t" class="doc-title" value="' + esc(d.title) + '" placeholder="Untitled"' + (Q.isGuest() ? ' readonly' : '') + '><div class="doc-body" role="textbox" aria-multiline="true" aria-label="Doc body">';
      d.blocks.forEach(function (b, i) {
        if (b.t === 'numbered') num++; else num = 0;
        h += block(d, b, num);
      });
      h += '</div>' + (Q.isGuest() ? '' : '<button type="button" class="inl-add" data-act="doc-add-end" style="margin-top:8px">' + I('plus', 's') + 'Add a block — or type “/” in any empty line</button>') + '</article>';
    }
    h += '</div></div>';
    main.innerHTML = h;
    if (innerWidth < 860) { var bb = main.querySelector('#doc-back'); if (bb) bb.style.display = ''; }
    if (d) wire(main, d);
  };
  function block(d, b, num) {
    var ro = Q.isGuest() ? '' : ' contenteditable="true"';
    var handle = Q.isGuest() ? '' : '<span class="bh"><button type="button" data-act="blk-add" data-b="' + b.id + '" aria-label="Add block below" tabindex="-1">' + I('plus') + '</button><button type="button" data-act="blk-menu" data-b="' + b.id + '" aria-label="Block options">' + I('grip') + '</button></span>';
    var cls = 'dblk t-' + b.t + (b.t === 'todo' && b.d ? ' done' : '');
    if (b.t === 'divider') return '<div class="' + cls + '" data-b="' + b.id + '">' + handle + '<hr></div>';
    if (b.t === 'task') {
      var t = Q.task(b.ref);
      if (!t || !Q.canSee(t)) return '<div class="' + cls + '" data-b="' + b.id + '">' + handle + '<div class="emb"><div class="emb-r faint">This task was archived or isn’t shared with you.</div></div></div>';
      return '<div class="' + cls + '" data-b="' + b.id + '">' + handle + '<div class="emb"><div class="emb-h">' + I('target', 's') + 'Linked task · ' + esc(Q.project(t.project).name) + '<span class="sp"></span>' + UI.due(t, true) + '</div>' + embRow(t) + (t.desc ? '<div style="padding:8px 12px 12px;font-size:13px;color:var(--muted)">' + esc(t.desc) + '</div>' : '') + '</div></div>';
    }
    if (b.t === 'tasks') {
      var q = b.q || {}, p = Q.project(q.project); if (!p) return '';
      var ts = Q.tasks(p.id).filter(function (x) { return q.status === 'all' || !Q.isDone(x); }).sort(function (a, c) { return (a.due || '9') < (c.due || '9') ? -1 : 1; });
      var shown = ts.slice(0, b.more ? 50 : 6);
      return '<div class="' + cls + '" data-b="' + b.id + '">' + handle + '<div class="emb"><div class="emb-h">' + I('list', 's') + '<b>' + esc(b.x || p.name) + '</b> · live from ' + UI.pdot(p) + esc(p.name) + '<span class="sp"></span><span>' + (q.status === 'all' ? ts.filter(Q.isDone).length + '/' + ts.length + ' done' : ts.length + ' open') + '</span><a class="btn sm ghost" href="#/p/' + p.id + '/list">Open</a></div>' +
        shown.map(embRow).join('') + (ts.length > shown.length ? '<button type="button" class="emb-r" data-act="emb-more" data-b="' + b.id + '" style="width:100%;color:var(--muted);font-size:12.5px">Show ' + (ts.length - shown.length) + ' more</button>' : '') +
        (Q.isGuest() ? '' : '<label class="inl-add" style="padding:0 12px">' + I('plus', 's') + '<input type="text" data-emb-add="' + p.id + '" placeholder="Add a task to ' + esc(p.name) + '" aria-label="Add a task to ' + esc(p.name) + '"></label>') + '</div></div>';
    }
    var lead = b.t === 'bullet' ? '<span class="lead" aria-hidden="true">•</span>' : b.t === 'numbered' ? '<span class="lead" aria-hidden="true">' + num + '.</span>' : b.t === 'todo' ? '<span class="lead"><input type="checkbox" class="cb" data-todo="' + b.id + '"' + (b.d ? ' checked' : '') + ' aria-label="Done"' + (Q.isGuest() ? ' disabled' : '') + '></span>' : '';
    return '<div class="' + cls + '" data-b="' + b.id + '">' + handle + lead + '<div class="be"' + ro + ' data-be="' + b.id + '" data-ph="' + (b.t === 'p' ? '' : esc((TYPES.filter(function (x) { return x[0] === b.t; })[0] || [0, ''])[1])) + '">' + esc(b.x || '') + '</div></div>';
  }
  function embRow(t) {
    return '<div class="emb-r' + (Q.isDone(t) ? ' done' : '') + '">' + (Q.isGuest() ? UI.sdot(Q.status(t)) : '<input type="checkbox" class="cb" data-emb-done="' + t.id + '"' + (Q.isDone(t) ? ' checked' : '') + ' aria-label="Mark ' + esc(t.title) + ' done">') +
      '<button type="button" class="t" data-act="open-task" data-id="' + t.id + '">' + esc(t.title) + '</button>' + UI.pill(t, Q.isGuest() ? 'span' : 'button') + UI.due(t) + UI.avs(t.assignees, 2, 's') + '</div>';
  }

  function wire(main, d) {
    var snap = null, dirty = false;
    var ti = main.querySelector('#doc-t');
    ti.addEventListener('focus', function () { snap = store.snap(); });
    ti.addEventListener('input', function () { d.title = ti.value; d.updated = Date.now(); dirty = true; store.save(); });
    ti.addEventListener('blur', function () { if (dirty) { store.markUndo(snap, 'Renamed doc'); dirty = false; } var a = document.querySelector('.doc-list a[aria-current] span span'); if (a) a.textContent = d.title || 'Untitled'; });
    ti.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); var f = main.querySelector('.be'); if (f) caret(f, 0); } });
    var body = main.querySelector('.doc-body'); if (!body) return;
    body.addEventListener('focusin', function (e) { if (e.target.matches('.be')) { snap = store.snap(); dirty = false; } });
    body.addEventListener('focusout', function (e) { if (e.target.matches('.be') && dirty) { store.markUndo(snap, 'Edited ' + (d.title || 'doc')); dirty = false; } });
    body.addEventListener('input', function (e) {
      var el = e.target.closest('.be'); if (!el) return; var b = OW.byId(d.blocks, el.getAttribute('data-be')); if (!b) return;
      var txt = el.innerText.replace(/\n$/, '');
      // markdown shortcuts
      var md = [[/^#\s$/, 'h1'], [/^##\s$/, 'h2'], [/^###\s$/, 'h3'], [/^[-*]\s$/, 'bullet'], [/^1\.\s$/, 'numbered'], [/^\[\]\s$/, 'todo'], [/^>\s$/, 'quote'], [/^---$/, 'divider'], [/^!\s$/, 'callout']];
      for (var i = 0; i < md.length; i++) if (md[i][0].test(txt.replace(/ /g, ' '))) { turn(d, b, md[i][1], ''); return; }
      b.x = txt; d.updated = Date.now(); dirty = true; store.save();
      if (txt === '/' || /\s\/$/.test(txt) || (txt.charAt(0) === '/' && UI._slash)) slash(d, b, el);
      else if (UI._slash && txt.indexOf('/') < 0) { UI.closePop(); UI._slash = false; }
    });
    body.addEventListener('keydown', function (e) {
      var el = e.target.closest('.be'); if (!el) return; var b = OW.byId(d.blocks, el.getAttribute('data-be')), idx = d.blocks.indexOf(b);
      if (UI._slash && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) {
        var pop = document.querySelector('.pop.slash'); if (pop) { e.preventDefault(); var its = Array.prototype.filter.call(pop.querySelectorAll('.mi'), function (x) { return !x.hidden; }), i2 = its.findIndex(function (x) { return x.classList.contains('hl'); }); if (e.key === 'Enter') { (its[i2] || its[0]).click(); return; } its.forEach(function (x) { x.classList.remove('hl'); }); i2 = e.key === 'ArrowDown' ? (i2 + 1) % its.length : (i2 - 1 + its.length) % its.length; its[i2].classList.add('hl'); its[i2].scrollIntoView({ block: 'nearest' }); return; }
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        var pos = offset(el), txt = el.innerText.replace(/\n$/, '');
        if (!txt && ['bullet', 'numbered', 'todo', 'quote', 'callout'].indexOf(b.t) > -1) { turn(d, b, 'p', ''); return; }
        var before = txt.slice(0, pos), after = txt.slice(pos), nt = ['bullet', 'numbered', 'todo'].indexOf(b.t) > -1 ? b.t : 'p';
        structural(d, 'New block', function () { b.x = before; var nb = { id: store.uid(d.id + 'b'), t: nt, x: after, d: false }; d.blocks.splice(idx + 1, 0, nb); DOC.focus = { id: nb.id, pos: 0 }; });
      }
      if (e.key === 'Backspace' && offset(el) === 0 && selLen() === 0) {
        if (b.t !== 'p') { e.preventDefault(); turn(d, b, 'p', b.x); return; }
        var prev = d.blocks[idx - 1];
        if (prev && TEXTY.indexOf(prev.t) > -1) { e.preventDefault(); var pl = (prev.x || '').length; structural(d, 'Merged blocks', function () { prev.x = (prev.x || '') + (b.x || ''); d.blocks.splice(idx, 1); DOC.focus = { id: prev.id, pos: pl }; }); }
        else if (prev && !b.x) { e.preventDefault(); structural(d, 'Removed block', function () { d.blocks.splice(idx, 1); DOC.focus = null; }); }
      }
      if ((e.key === 'ArrowUp' && offset(el) === 0) || (e.key === 'ArrowDown' && offset(el) >= el.innerText.replace(/\n$/, '').length)) {
        var all = Array.prototype.slice.call(body.querySelectorAll('.be')), j = all.indexOf(el) + (e.key === 'ArrowUp' ? -1 : 1);
        if (all[j]) { e.preventDefault(); caret(all[j], e.key === 'ArrowUp' ? all[j].innerText.length : 0); }
      }
      if (e.key === 'Escape' && UI._slash) { UI.closePop(); UI._slash = false; }
    });
    body.addEventListener('change', function (e) {
      var td = e.target.closest('[data-todo]');
      if (td) { var b = OW.byId(d.blocks, td.getAttribute('data-todo')); structural(d, td.checked ? 'Checked to-do' : 'Unchecked to-do', function () { b.d = td.checked; }); }
      var ed = e.target.closest('[data-emb-done]');
      if (ed) { var t = Q.task(ed.getAttribute('data-emb-done')), p = Q.project(t.project); store.commit((ed.checked ? 'Done: ' : 'Reopened ') + t.title, function () { OW.A.setStatus(t, ed.checked ? Q.doneStatus(p) : (Q.statusByCat(p, 'active') || Q.firstStatus(p))); }); }
    });
    body.addEventListener('keydown', function (e) {
      var inp = e.target.closest('[data-emb-add]'); if (!inp || e.key !== 'Enter' || !inp.value.trim()) return;
      e.preventDefault(); var pid = inp.getAttribute('data-emb-add'), v = inp.value.trim();
      OW.project.quickCreate(pid, v, {});
      setTimeout(function () { var n = document.querySelector('[data-emb-add="' + pid + '"]'); if (n) n.focus(); }, 30);
    });
    body.addEventListener('paste', function (e) { var el = e.target.closest('.be'); if (!el) return; e.preventDefault(); var text = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, text.replace(/\r/g, '')); });
    if (DOC.focus) { var f = main.querySelector('[data-be="' + DOC.focus.id + '"]'); if (f) caret(f, DOC.focus.pos); DOC.focus = null; }
  }
  function structural(d, label, fn) { store.commit(label, function () { fn(); d.updated = Date.now(); }, { quiet: true }); }
  function turn(d, b, t, x) {
    if (t === 'task' || t === 'tasks') return embed(d, b, t);
    structural(d, 'Turned into ' + t, function () {
      b.t = t; if (x != null) b.x = x;
      if (t === 'divider') { b.x = ''; var nb = { id: store.uid(d.id + 'b'), t: 'p', x: '' }; d.blocks.splice(d.blocks.indexOf(b) + 1, 0, nb); DOC.focus = { id: nb.id, pos: 0 }; }
      else DOC.focus = { id: b.id, pos: (b.x || '').length };
    });
  }
  function embed(d, b, t) {
    var p = docProject(d);
    if (t === 'tasks') {
      UI.menu(document.querySelector('[data-b="' + b.id + '"]') || document.body, [{ head: 'Embed a live task list from…' }].concat(Q.projectsVisible().map(function (x) { return { label: x.name, html: UI.pdot(x), fn: function () { structural(d, 'Embedded ' + x.name, function () { b.t = 'tasks'; b.q = { project: x.id, status: 'open' }; b.x = 'Open work'; }); } }; })), { search: 'Find a project…' });
      return;
    }
    var cands = Q.tasks('*').filter(function (x) { return x.project === p.id; }).concat(Q.tasks('*').filter(function (x) { return x.project !== p.id; }));
    UI.menu(document.querySelector('[data-b="' + b.id + '"]') || document.body, [{ head: 'Embed a task' }].concat(cands.slice(0, 80).map(function (x) { return { label: x.num + ' ' + x.title, html: UI.sdot(Q.status(x)), fn: function () { structural(d, 'Embedded ' + x.num, function () { b.t = 'task'; b.ref = x.id; b.x = ''; }); } }; })), { search: 'Find a task…' });
  }
  function slash(d, b, el) {
    var r = window.getSelection().rangeCount ? window.getSelection().getRangeAt(0).getBoundingClientRect() : el.getBoundingClientRect();
    if (!r.width && !r.height) r = el.getBoundingClientRect();
    var anchor = { getBoundingClientRect: function () { return { left: r.left, right: r.left + 260, top: r.top, bottom: r.bottom }; }, contains: function () { return false; } };
    var q = (el.innerText.split('/').pop() || '').trim().toLowerCase();
    if (!UI._slash || !document.querySelector('.pop.slash')) {
      UI.menu(anchor, [{ head: 'Turn into' }].concat(TYPES.map(function (x) { return { label: x[1], icon: x[2], hint: x[3], fn: function () { var keep = (b.x || '').replace(/\s?\/[^/]*$/, ''); UI._slash = false; turn(d, b, x[0], keep); } }; })), { cls: 'slash' });
      UI._slash = true; setTimeout(function () { el.focus(); placeEnd(el); }, 10);
    }
    var pop = document.querySelector('.pop.slash'); if (!pop) return;
    var any = false; pop.querySelectorAll('.mi').forEach(function (m) { var hide = q && m.getAttribute('data-s').indexOf(q) < 0; m.hidden = hide; m.classList.remove('hl'); if (!hide) any = true; });
    var first = pop.querySelector('.mi:not([hidden])'); if (first) first.classList.add('hl');
    if (!any) { UI.closePop(); UI._slash = false; }
  }
  function offset(el) { var s = window.getSelection(); if (!s.rangeCount) return 0; var r = s.getRangeAt(0), pre = r.cloneRange(); pre.selectNodeContents(el); pre.setEnd(r.startContainer, r.startOffset); return pre.toString().length; }
  function selLen() { var s = window.getSelection(); return s.rangeCount ? s.getRangeAt(0).toString().length : 0; }
  function caret(el, pos) {
    el.focus(); var s = window.getSelection(), r = document.createRange(), n = el.firstChild;
    if (!n) { r.setStart(el, 0); } else { pos = Math.min(pos, n.textContent.length); r.setStart(n, pos); }
    r.collapse(true); s.removeAllRanges(); s.addRange(r);
  }
  function placeEnd(el) { caret(el, el.textContent.length); }

  /* ---------- actions ---------- */
  UI.act('doc-lists', function () { DOC.listMode = true; app.render(); DOC.listMode = false; });
  UI.act('doc-new', function () {
    var S = store.S, sp = S.spaces.filter(function (s) { return s.ws === S.ws; })[0], id;
    store.commit('New doc', function (S) { id = store.uid('d'); S.docs.unshift({ id: id, space: sp.id, title: '', icon: '·', by: Q.me(), updated: Date.now(), blocks: [{ id: id + 'b0', t: 'p', x: '' }] }); }, { quiet: true });
    app.go('#/docs/' + id); setTimeout(function () { var t = document.getElementById('doc-t'); if (t) t.focus(); }, 60);
  });
  function curDoc() { return OW.byId(store.S.docs, app.route.args[0]) || store.S.docs[0]; }
  UI.act('doc-add-end', function () { var d = curDoc(); structural(d, 'New block', function () { var nb = { id: store.uid(d.id + 'b'), t: 'p', x: '' }; d.blocks.push(nb); DOC.focus = { id: nb.id, pos: 0 }; }); });
  UI.act('blk-add', function (el) { var d = curDoc(), b = OW.byId(d.blocks, el.getAttribute('data-b')); structural(d, 'New block', function () { var nb = { id: store.uid(d.id + 'b'), t: 'p', x: '' }; d.blocks.splice(d.blocks.indexOf(b) + 1, 0, nb); DOC.focus = { id: nb.id, pos: 0 }; }); });
  UI.act('emb-more', function (el) { var d = curDoc(), b = OW.byId(d.blocks, el.getAttribute('data-b')); b.more = true; app.render(); });
  UI.act('blk-menu', function (el) {
    var d = curDoc(), b = OW.byId(d.blocks, el.getAttribute('data-b')), i = d.blocks.indexOf(b);
    var items = [{ head: 'Turn into' }].concat(TYPES.filter(function (x) { return x[0] !== b.t; }).slice(0, 9).map(function (x) { return { label: x[1], icon: x[2], fn: function () { turn(d, b, x[0], b.x); } }; }));
    items.push({ sep: true });
    if (TEXTY.indexOf(b.t) > -1 && (b.x || '').trim()) items.push({ label: 'Convert to task', icon: 'target', hint: docProject(d).key, fn: function () {
      var p = docProject(d), t;
      structural(d, 'Converted to task', function () { t = OW.A.create({ project: p.id, title: b.x.trim().slice(0, 140), status: p.statuses[Math.min(1, p.statuses.length - 1)].id, assignees: [Q.me()] }); store.log(t, 'created this from the doc “' + d.title + '”'); b.t = 'task'; b.ref = t.id; b.x = ''; });
      UI.toast('Created ' + esc(t.num) + ' in ' + esc(p.name) + ' — it stays linked here', { icon: 'target', action: { label: 'Open', fn: function () { app.openTask(t.id); } } });
    } });
    items.push({ label: 'Move up', icon: 'chu', fn: function () { if (i > 0) structural(d, 'Moved block', function () { d.blocks.splice(i, 1); d.blocks.splice(i - 1, 0, b); }); } },
      { label: 'Move down', icon: 'chd', fn: function () { if (i < d.blocks.length - 1) structural(d, 'Moved block', function () { d.blocks.splice(i, 1); d.blocks.splice(i + 1, 0, b); }); } },
      { label: 'Duplicate', icon: 'copy', fn: function () { structural(d, 'Duplicated block', function () { var c = JSON.parse(JSON.stringify(b)); c.id = store.uid(d.id + 'b'); d.blocks.splice(i + 1, 0, c); }); } },
      { label: 'Delete block', icon: 'trash', danger: true, fn: function () { store.commit('Deleted block', function () { d.blocks.splice(i, 1); if (!d.blocks.length) d.blocks.push({ id: store.uid(d.id + 'b'), t: 'p', x: '' }); }); } });
    UI.menu(el, items);
  });
  UI.act('doc-more', function (el) {
    var d = OW.byId(store.S.docs, el.getAttribute('data-id'));
    UI.menu(el, [
      { label: 'Move to space…', icon: 'folder', fn: function () { UI.menu(el, store.S.spaces.filter(function (s) { return s.ws === store.S.ws; }).map(function (s) { return { label: s.name, checked: s.id === d.space, fn: function () { store.commit('Moved doc to ' + s.name, function () { d.space = s.id; }); } }; })); } },
      { label: 'Copy as Markdown', icon: 'copy', fn: function () {
        var n = 0, md = '# ' + d.title + '\n\n' + d.blocks.map(function (b) { if (b.t === 'numbered') n++; else n = 0; var t = b.t === 'task' && Q.task(b.ref) ? Q.task(b.ref) : null; return { p: b.x, h1: '# ' + b.x, h2: '## ' + b.x, h3: '### ' + b.x, bullet: '- ' + b.x, numbered: n + '. ' + b.x, todo: '- [' + (b.d ? 'x' : ' ') + '] ' + b.x, quote: '> ' + b.x, callout: '> **Note:** ' + b.x, divider: '---', task: t ? '- [' + (Q.isDone(t) ? 'x' : ' ') + '] ' + t.num + ' ' + t.title : '', tasks: '_(live task list)_' }[b.t]; }).join('\n\n');
        try { navigator.clipboard.writeText(md).then(function () { UI.toast('Copied as Markdown', { icon: 'copy' }); }); } catch (e) { UI.toast('Copying isn’t available here'); }
      } },
      { sep: true }, { label: 'Delete doc', icon: 'trash', danger: true, fn: function () { store.commit('Deleted ' + (d.title || 'doc'), function (S) { S.docs = S.docs.filter(function (x) { return x.id !== d.id; }); }); app.go('#/docs'); } }
    ], { alignRight: true });
  });
})();
