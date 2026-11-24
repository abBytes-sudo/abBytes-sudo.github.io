/* Ordwell — Board view. Columns by status (or category across projects), assignee or priority.
   Pointer drag with live placeholder, auto-scroll, touch support; keyboard: [ and ] move a focused card. */
(function () {
  'use strict';
  var OW = window.OW, UI = OW.UI, Q = OW.Q, D = OW.D, I = UI.I, esc = UI.esc, store = OW.store, app = OW.app, PR = OW.project;

  function columns(c) {
    var pid = c.pid, g = c.st.group;
    if (g === 'assignee') return store.S.users.filter(function (u) { return u.role !== 'guest' && (pid === '*' || c.p.members.indexOf(u.id) > -1); }).map(function (u) {
      return { id: u.id, name: u.name, head: UI.av(u.id, 's'), match: function (t) { return t.assignees[0] === u.id; }, apply: function (t) { var a = t.assignees.filter(function (x) { return x !== u.id; }); a.unshift(u.id); if (t.assignees[0] && t.assignees[0] !== u.id) a.splice(a.indexOf(t.assignees[0]), 1); OW.A.assign(t, a); }, newTask: { assignees: [u.id] } };
    }).concat([{ id: 'none', name: 'Unassigned', head: I('user', 's'), match: function (t) { return !t.assignees.length; }, apply: function (t) { OW.A.assign(t, []); }, newTask: { assignees: [] } }]);
    if (g === 'priority') return [4, 3, 2, 1, 0].map(function (p) { return { id: 'p' + p, name: UI.PRI[p], head: UI.prio(p), match: function (t) { return t.priority === p; }, apply: function (t) { t.priority = p; store.log(t, 'set priority to ' + UI.PRI[p]); }, newTask: { priority: p } }; });
    if (pid === '*') return PR.CATS.filter(function (x) { return x[0] !== 'blocked' && x[0] !== 'backlog'; }).map(function (x) {
      var st = { cat: x[0], name: x[1] };
      return { id: x[0], name: x[1], head: UI.sdot(st), cat: x[0], match: function (t) { var k = Q.cat(t); return k === x[0] || (x[0] === 'todo' && (k === 'backlog' || k === 'blocked')); }, apply: function (t) { var s = Q.statusByCat(Q.project(t.project), x[0]); if (s) OW.A.setStatus(t, s); } };
    });
    return c.p.statuses.map(function (s) { return { id: s.id, name: s.name, head: UI.sdot(s), st: s, cat: s.cat, match: function (t) { return t.status === s.id; }, apply: function (t) { OW.A.setStatus(t, s.id); }, newTask: { status: s.id } }; });
  }

  function card(t, vt) {
    var subs = Q.subs(t.id), sd = subs.filter(Q.isDone).length, cm = store.S.comments.filter(function (c) { return c.task === t.id && (!Q.isGuest() || !c.internal); }).length;
    var p = Q.project(t.project), blocked = Q.blockedOpen(t) && !Q.isDone(t);
    return '<button type="button" class="kc" data-tid="' + t.id + '"' + (vt ? ' style="view-transition-name:t' + t.id + '"' : '') + '>' +
      (blocked ? '<span class="blk" title="Blocked by an open task">' + I('blocked', 's') + '</span>' : '') +
      '<span class="kid">' + (app.route.args[0] === '*' ? UI.pdot(p) : '') + esc(t.num) + (t.parent ? ' · subtask' : '') + '</span>' +
      '<span class="kt">' + esc(t.title) + '</span><span class="sr">, ' + esc(Q.status(t).name) + (t.assignees.length ? ', ' + esc(t.assignees.map(function (a) { return Q.user(a).name; }).join(' and ')) : '') + '</span>' +
      (t.tags.length ? '<span class="tags">' + t.tags.slice(0, 2).map(UI.tag).join('') + (t.tags.length > 2 ? '<span class="tag">+' + (t.tags.length - 2) + '</span>' : '') + '</span>' : '') +
      '<span class="km">' + UI.prio(t.priority) + UI.due(t) +
      (subs.length ? '<span class="mini" title="Subtasks">' + I('sub', 's') + sd + '/' + subs.length + '</span>' : '') +
      (cm ? '<span class="mini" title="Comments">' + I('msg', 's') + cm + '</span>' : '') +
      (t.attachments.length ? '<span class="mini" title="Attachments">' + I('clip', 's') + t.attachments.length + '</span>' : '') +
      '<span class="sp"></span>' + UI.avs(t.assignees, 3, 's') + '</span>' +
      (subs.length ? '<span class="subbar" aria-hidden="true"><i style="width:' + Math.round(sd / subs.length * 100) + '%"></i></span>' : '') +
      '</button>';
  }

  OW.views.board = function (el, c) {
    var cols = columns(c), list = PR.sort(c.tasks, c.st.sort), vt = list.length < 90;
    var h = '<div class="board" data-keep="board" role="list" aria-label="Board">';
    cols.forEach(function (col) {
      var ts = list.filter(col.match), done = col.cat === 'done';
      h += '<section class="col" data-col="' + col.id + '" role="listitem" aria-label="' + esc(col.name) + ', ' + ts.length + ' tasks">' +
        '<div class="col-h">' + col.head + '<span>' + esc(col.name) + '</span><span class="cnt">' + ts.length + '</span><span class="sp"></span>' +
        (done ? '<span class="wip">' + ts.filter(function (t) { return t.doneAt && Date.now() - t.doneAt < 7 * 864e5; }).length + ' this week</span>' : '') +
        (c.pid !== '*' && !Q.isGuest() ? '<button type="button" class="ibtn" data-act="col-add" data-col="' + col.id + '" aria-label="Add task to ' + esc(col.name) + '">' + I('plus', 's') + '</button>' : '') +
        (c.pid !== '*' && c.st.group === 'status' && !Q.isGuest() ? '<button type="button" class="ibtn" data-act="col-menu" data-col="' + col.id + '" aria-label="' + esc(col.name) + ' column options">' + I('more', 's') + '</button>' : '') + '</div>' +
        '<div class="col-body" data-keep="col-' + col.id + '">' + ts.map(function (t) { return card(t, vt); }).join('') +
        (ts.length ? '' : '<div class="faint" style="font-size:12px;text-align:center;padding:14px 6px;border:1px dashed var(--line-3);border-radius:6px">Drop tasks here</div>') + '</div>' +
        (c.pid !== '*' && !Q.isGuest() ? '<div style="padding:0 8px 8px" data-qa="' + col.id + '"><button type="button" class="add-card" data-act="col-add" data-col="' + col.id + '">' + I('plus', 's') + 'Add task</button></div>' : '') +
        '</section>';
    });
    if (c.pid !== '*' && c.st.group === 'status' && !Q.isGuest()) h += '<div class="col add-col"><button type="button" data-act="add-status">' + I('plus') + 'Add status</button></div>';
    h += '</div>';
    if (!c.tasks.length && (c.st.filter.q || c.st.filter.who.length || c.st.filter.due)) h = '<div class="empty"><div class="art">' + I('filter') + '</div><h3>No tasks match these filters</h3><p>Loosen a filter or clear the search to see the whole board.</p><button type="button" class="btn" data-act="clear-all-f">Clear filters</button></div>';
    el.innerHTML = h;
    PR.markSel();
    var board = el.querySelector('.board'); if (!board) return;
    drag(board, c, cols);
    board.addEventListener('keydown', function (e) {
      var k = e.target.closest('.kc'); if (!k || (e.key !== '[' && e.key !== ']')) return;
      e.preventDefault(); var colEl = k.closest('.col'), idx = cols.findIndex(function (x) { return x.id === colEl.getAttribute('data-col'); });
      var to = cols[idx + (e.key === ']' ? 1 : -1)]; if (!to) return; var t = Q.task(k.getAttribute('data-tid'));
      store.commit('Moved ' + t.num + ' to ' + to.name, function () { to.apply(t); });
      setTimeout(function () { var n = document.querySelector('.kc[data-tid="' + t.id + '"]'); if (n) n.focus(); }, 30);
    });
  };
  UI.act('clear-all-f', function () { var st = PR.state(PR.cur()); st.filter = { q: '', who: [], pri: [], tags: [], due: '', status: '' }; app.render(); });

  function drag(board, c, cols) {
    var s = null;
    board.addEventListener('pointerdown', function (e) {
      var k = e.target.closest('.kc'); if (!k || e.button !== 0 || Q.isGuest()) return;
      s = { k: k, x: e.clientX, y: e.clientY, id: k.getAttribute('data-tid'), on: false, pid: e.pointerId, touch: e.pointerType === 'touch' };
      if (s.touch) { var me = s; me.timer = setTimeout(function () { if (s === me) { me.armed = true; UI.dragLock = true; me.k.style.transform = 'scale(1.03)'; if (navigator.vibrate) navigator.vibrate(8); } }, 320); }
    });
    board.addEventListener('click', function (e) {
      var k = e.target.closest('.kc'); if (!k) return;
      if (board._justDragged) { board._justDragged = false; return; }
      if (e.shiftKey || e.metaKey || e.ctrlKey) { PR.toggleSel(k.getAttribute('data-tid'), e.shiftKey); return; }
      app.openTask(k.getAttribute('data-tid'));
    });
    addEventListener('pointermove', move, { passive: false });
    addEventListener('pointerup', up); addEventListener('pointercancel', cancel);
    var clone, ph, raf, lastPt;
    function move(e) {
      if (!s || e.pointerId !== s.pid) return;
      if (!s.on) {
        var dist = Math.abs(e.clientX - s.x) + Math.abs(e.clientY - s.y);
        if (s.touch && !s.armed) { if (dist > 8) { clearTimeout(s.timer); s = null; } return; }
        if (dist < 6) return;
        s.on = true; var r = s.k.getBoundingClientRect(); s.dx = e.clientX - r.left; s.dy = e.clientY - r.top;
        clone = s.k.cloneNode(true); clone.classList.add('drag'); clone.removeAttribute('style'); clone.style.width = r.width + 'px'; document.body.appendChild(clone);
        s.k.classList.add('ghost'); ph = s.k; document.body.style.cursor = 'grabbing';
        try { s.k.setPointerCapture && board.releasePointerCapture && 0; } catch (x) { }
      }
      e.preventDefault(); lastPt = e;
      clone.style.left = (e.clientX - s.dx) + 'px'; clone.style.top = (e.clientY - s.dy) + 'px';
      var under = document.elementFromPoint(e.clientX, e.clientY), col = under && under.closest('.col[data-col]');
      board.querySelectorAll('.col.over').forEach(function (x) { if (x !== col) x.classList.remove('over'); });
      if (col) {
        col.classList.add('over'); var body = col.querySelector('.col-body'), cards = Array.prototype.filter.call(body.querySelectorAll('.kc'), function (x) { return x !== ph; });
        var before = null; for (var i = 0; i < cards.length; i++) { var rr = cards[i].getBoundingClientRect(); if (e.clientY < rr.top + rr.height / 2) { before = cards[i]; break; } }
        var empty = body.querySelector('.faint'); if (empty) empty.remove();
        if (before) { if (ph.nextSibling !== before) body.insertBefore(ph, before); } else if (body.lastElementChild !== ph) body.appendChild(ph);
      }
      if (!raf) raf = requestAnimationFrame(autoscroll);
    }
    function autoscroll() {
      raf = null; if (!s || !s.on || !lastPt) return; var r = board.getBoundingClientRect(), e = lastPt, sp = 0;
      if (e.clientX > r.right - 60) sp = 14; else if (e.clientX < r.left + 60) sp = -14;
      if (sp) { board.scrollLeft += sp; raf = requestAnimationFrame(autoscroll); }
      var col = document.elementFromPoint(e.clientX, e.clientY); col = col && col.closest('.col-body');
      if (col) { var cr = col.getBoundingClientRect(); if (e.clientY > cr.bottom - 40) { col.scrollTop += 10; raf = raf || requestAnimationFrame(autoscroll); } else if (e.clientY < cr.top + 40) { col.scrollTop -= 10; raf = raf || requestAnimationFrame(autoscroll); } }
    }
    function cancel() { UI.dragLock = false; if (s && s.timer) clearTimeout(s.timer); if (s && s.on) { clone.remove(); s.k.classList.remove('ghost'); document.body.style.cursor = ''; app.render(); } s = null; }
    function up(e) {
      if (!s || e.pointerId !== s.pid) return; var st = s; s = null; clearTimeout(st.timer); UI.dragLock = false; st.k.style.transform = '';
      if (!st.on) return;
      board._justDragged = true; setTimeout(function () { board._justDragged = false; }, 50);
      document.body.style.cursor = '';
      var colEl = ph.closest('.col'); board.querySelectorAll('.col.over').forEach(function (x) { x.classList.remove('over'); });
      var tr = ph.getBoundingClientRect(); clone.style.transition = 'left .18s var(--ease), top .18s var(--ease), transform .18s'; clone.style.left = tr.left + 'px'; clone.style.top = tr.top + 'px'; clone.style.transform = 'none';
      setTimeout(function () { clone.remove(); }, 170);
      var col = colEl && cols.filter(function (x) { return x.id === colEl.getAttribute('data-col'); })[0];
      var t = Q.task(st.id); if (!col || !t) { app.render(); return; }
      var ids = Array.prototype.map.call(colEl.querySelectorAll('.kc'), function (x) { return x.getAttribute('data-tid'); });
      var moved = !col.match(t);
      setTimeout(function () {
        store.commit(moved ? t.num + ' → ' + col.name : 'Reordered ' + col.name, function () {
          if (moved) col.apply(t);
          ids.forEach(function (id, i) { var x = Q.task(id); if (x) x.order = i; });
          t.updated = Date.now();
        }, { quiet: !moved });
      }, 150);
    }
    // detach global listeners when board is replaced
    var obs = new MutationObserver(function () { if (!document.body.contains(board)) { removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', cancel); obs.disconnect(); } });
    obs.observe(document.getElementById('view'), { childList: true, subtree: true });
  }

  /* quick add in a column */
  UI.act('col-add', function (el) {
    var colId = el.getAttribute('data-col'), wrap = document.querySelector('[data-qa="' + colId + '"]'), pid = PR.cur(), st = PR.state(pid);
    if (!wrap) return;
    wrap.innerHTML = '<div class="qadd"><textarea rows="2" placeholder="Task title — Enter to add, Esc to close" aria-label="New task title"></textarea><div class="qa-f"><span class="faint" style="font-size:11.5px">' + I('user', 's') + ' You · no due date</span><span class="sp"></span><button type="button" class="btn sm ghost" data-x>Cancel</button><button type="button" class="btn sm pri" data-ok>Add</button></div></div>';
    var ta = wrap.querySelector('textarea'); ta.focus();
    wrap.closest('.col').querySelector('.col-body').scrollTop = 1e6;
    var cols = columns({ pid: pid, p: Q.project(pid), st: st }), col = cols.filter(function (x) { return x.id === colId; })[0];
    function add() {
      var v = ta.value.trim(); if (!v) { ta.focus(); return; }
      var n = Q.tasks(pid).filter(col.match).length, extra = Object.assign({ order: n }, col.newTask || {});
      PR.quickCreate(pid, v, extra);
      setTimeout(function () { var b = document.querySelector('[data-qa="' + colId + '"] .add-card'); if (b) b.click(); }, 30);
    }
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add(); } if (e.key === 'Escape') { e.stopPropagation(); app.render(); } });
    wrap.querySelector('[data-ok]').addEventListener('click', add);
    wrap.querySelector('[data-x]').addEventListener('click', function () { app.render(); });
  });
  UI.act('col-menu', function (el) {
    var p = Q.project(PR.cur()), s = OW.byId(p.statuses, el.getAttribute('data-col'));
    var n = Q.tasks(p.id, true).filter(function (t) { return t.status === s.id; }).length;
    UI.menu(el, [
      { label: 'Rename status', icon: 'text', fn: function () { UI.dialog({ title: 'Rename “' + s.name + '”', ok: 'Save', body: '<label class="lbl-t" for="rs">Status name</label><input id="rs" class="inp" autofocus value="' + esc(s.name) + '">', onOk: function (d) { var v = d.querySelector('#rs').value.trim(); if (!v) return false; store.commit('Renamed status to ' + v, function () { s.name = v; }); } }); } },
      { label: 'Add a status after this', icon: 'plus', fn: function () { addStatus(p, p.statuses.indexOf(s) + 1); } },
      { sep: true }, { label: n ? 'Delete (move ' + n + ' tasks first)' : 'Delete status', icon: 'trash', danger: true, fn: function () { if (n) { UI.toast('Move the ' + n + ' tasks out of ' + esc(s.name) + ' first', { icon: 'blocked' }); return; } if (p.statuses.length < 3) { UI.toast('A project needs at least two statuses'); return; } store.commit('Deleted status ' + s.name, function () { p.statuses.splice(p.statuses.indexOf(s), 1); }); } }
    ], { alignRight: true });
  });
  function addStatus(p, at) {
    UI.dialog({ title: 'Add a status', ok: 'Add status',
      body: '<div class="fld"><label class="lbl-t" for="ns">Name</label><input id="ns" class="inp" autofocus placeholder="e.g. Ready for QA"></div><label class="lbl-t" for="nc">Behaves like</label><select id="nc" class="inp"><option value="todo">Not started</option><option value="active" selected>In progress</option><option value="review">Review</option><option value="review2">Waiting on someone</option><option value="blocked">Blocked</option><option value="done">Done</option></select><p class="hint">Dashboards and automations use this to know what “done” or “in review” means.</p>',
      onOk: function (d) { var v = d.querySelector('#ns').value.trim(); if (!v) return false; store.commit('Added status ' + v, function () { p.statuses.splice(at == null ? p.statuses.length : at, 0, { id: store.uid('s'), name: v, cat: d.querySelector('#nc').value }); }); } });
  }
  UI.act('add-status', function () { var p = Q.project(PR.cur()); addStatus(p, p.statuses.length - 1); });
  OW.views.card = card;
})();
