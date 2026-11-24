/* Ordwell — Timeline (Gantt): bars from start to due, drag to move, drag edges to resize, drag the dot to link a
   dependency, dependency arrows with conflict detection, optional auto-shift of dependents, milestones, zoom. */
(function () {
  'use strict';
  var OW = window.OW, UI = OW.UI, Q = OW.Q, D = OW.D, I = UI.I, esc = UI.esc, store = OW.store, app = OW.app, PR = OW.project;
  var ZOOM = { week: 34, month: 16, quarter: 6 }, RH = 40, GH = 32, HEAD = 56;

  function isMs(t) { return t.tags.indexOf('milestone') > -1; }
  function span(t) { var s = t.start || t.due, e = t.due || t.start; if (s && e && e < s) e = s; return [s, e]; }

  OW.views.timeline = function (el, c) {
    var st = c.st, dw = ZOOM[st.zoom] || 34, S = store.S, mobile = innerWidth < 640, LW = mobile ? 148 : 300;
    var list = PR.sort(c.tasks, 'manual');
    var groups = PR.groups(c.pid, list.sort(function (a, b) { var x = span(a)[0] || '9999', y = span(b)[0] || '9999'; return x < y ? -1 : x > y ? 1 : 0; }), st.group === 'priority' || st.group === 'due' ? st.group : st.group === 'none' ? 'none' : st.group);
    // date range
    var lo = null, hi = null; list.forEach(function (t) { var sp = span(t); if (sp[0] && (!lo || sp[0] < lo)) lo = sp[0]; if (sp[1] && (!hi || sp[1] > hi)) hi = sp[1]; });
    var today = D.today(); lo = lo && lo < D.add(today, -14) ? lo : D.add(today, -14); hi = hi && hi > D.add(today, 30) ? hi : D.add(today, 30);
    var o = D.add(lo, -((D.dow(lo) + 6) % 7) - 7), days = D.diff(o, hi) + 21, W = days * dw;
    var X = function (d) { return D.diff(o, d) * dw; };
    // rows
    var rows = [], y = 0;
    groups.forEach(function (g) { if (groups.length > 1 || g.key !== 'all') { rows.push({ g: g, y: y, h: GH }); y += GH; } g.tasks.forEach(function (t) { rows.push({ t: t, y: y, h: RH }); y += RH; }); });
    var H = Math.max(y, 200);
    var pos = {};
    rows.forEach(function (r) { if (r.t) pos[r.t.id] = r; });

    var h = '<div class="tl2" data-keep="tl" style="--lw:' + LW + 'px"><div class="tl2-in" style="width:' + (LW + W) + 'px">';
    // header
    h += '<div class="tl2-head"><div class="tl2-corner"><span>' + list.length + ' tasks</span><span class="seg" role="group" aria-label="Zoom">' + [['week', 'Week'], ['month', 'Month'], ['quarter', 'Quarter']].map(function (z) { return '<button type="button" data-act="tl-zoom" data-z="' + z[0] + '" aria-pressed="' + (st.zoom === z[0]) + '">' + z[1] + '</button>'; }).join('') + '</span></div><div class="tl-head" style="width:' + W + 'px;position:relative">';
    for (var i = 0; i < days; i++) {
      var d = D.add(o, i), dt = D.parse(d);
      if (dt.getDate() === 1 || i === 0) h += '<div class="mo" style="left:' + i * dw + 'px">' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][dt.getMonth()] + ' ' + dt.getFullYear() + '</div>';
      if (dw >= 16 || dt.getDay() === 1) h += '<div class="dy' + (D.wkend(d) ? ' we' : '') + (d === today ? ' td' : '') + '" style="left:' + i * dw + 'px;width:' + (dw >= 16 ? dw : dw * 7) + 'px">' + (dw >= 16 ? dt.getDate() : D.fmt(d)) + '</div>';
    }
    h += '</div></div>';
    // body
    h += '<div class="tl2-body" style="height:' + H + 'px">';
    h += '<div class="tl2-left">';
    rows.forEach(function (r) {
      if (r.g) { h += '<div class="tl-row grp" style="height:' + GH + 'px">' + (r.g.st ? UI.sdot(r.g.st) : r.g.uid ? UI.av(r.g.uid, 's') : r.g.p ? UI.pdot(r.g.p) : '') + '<span class="name">' + esc(r.g.name) + '</span><span class="faint" style="font-size:11.5px">' + r.g.tasks.length + '</span></div>'; return; }
      var t = r.t; h += '<div class="tl-row" data-tid="' + t.id + '" tabindex="0" role="button" data-act="open-task" data-id="' + t.id + '" aria-label="' + esc(t.title) + (t.due ? ', due ' + D.fmt(t.due) : ', not scheduled') + '">' + UI.sdot(Q.status(t)) + '<span class="name">' + esc(t.title) + '</span>' + (mobile ? '' : UI.avs(t.assignees, 2, 's')) + '</div>';
    });
    h += '</div><div class="tl2-chart" style="width:' + W + 'px;height:' + H + 'px"><div class="tl-bg">';
    for (var j = 0; j < days; j++) { var dd = D.add(o, j); if (D.wkend(dd) && dw >= 6) h += '<div class="we" style="left:' + j * dw + 'px;width:' + dw + 'px"></div>'; }
    rows.forEach(function (r) { h += '<div class="hl" style="top:' + (r.y + r.h - 1) + 'px"></div>'; });
    h += '<div class="today" style="left:' + (X(today) + dw / 2 - 1) + 'px"></div></div>';
    // project window
    if (c.p) h += '<div class="tl-proj" style="left:' + X(c.p.start) + 'px;width:' + (D.diff(c.p.start, c.p.end) + 1) * dw + 'px" title="Project window"></div>';
    // bars
    var conflicts = {};
    list.forEach(function (t) { var sp = span(t); if (!sp[0]) return; Q.blockers(t).forEach(function (b) { var bs = span(b); if (bs[1] && sp[0] <= bs[1] && pos[b.id]) conflicts[t.id] = 1; }); });
    rows.forEach(function (r) {
      if (!r.t) return; var t = r.t, sp = span(t), top = r.y + (RH - 26) / 2;
      if (!sp[0]) { h += '<button type="button" class="tl-sched" data-sched="' + t.id + '" style="top:' + (r.y + 7) + 'px;padding-left:' + Math.max(8, X(today) - 40) + 'px" aria-label="Schedule ' + esc(t.title) + '">' + I('plus', 's') + 'Not scheduled — click a day to place it</button>'; return; }
      var st2 = Q.status(t), left = X(sp[0]), w = (D.diff(sp[0], sp[1]) + 1) * dw, logged = Q.logged(t) / 60, subs = Q.subs(t.id);
      var prog = Q.isDone(t) ? 100 : subs.length ? Math.round(subs.filter(Q.isDone).length / subs.length * 100) : t.est ? Math.min(95, Math.round(logged / t.est * 100)) : 0;
      if (isMs(t)) { h += '<div class="bar ms" data-bar="' + t.id + '" style="--c:' + UI.CAT[st2.cat] + ';left:' + (left + dw / 2) + 'px;top:' + (r.y + 10) + 'px" tabindex="0" role="button" aria-label="Milestone ' + esc(t.title) + ' on ' + D.fmt(sp[1]) + '"' + (list.length < 90 ? '' : '') + '><span class="bt"></span></div><span class="ms-lbl" style="left:' + (left + dw / 2 + 16) + 'px;top:' + (r.y + 12) + 'px">' + I('diamond', 's') + ' ' + esc(t.title) + ' · ' + D.fmt(sp[1]) + '</span>'; return; }
      h += '<div class="bar' + (conflicts[t.id] ? ' conflict' : '') + '" data-bar="' + t.id + '" style="--c:' + UI.CAT[st2.cat] + ';left:' + left + 'px;width:' + w + 'px;top:' + top + 'px' + (list.length < 90 ? ';view-transition-name:t' + t.id : '') + '" tabindex="0" role="button" aria-label="' + esc(t.title) + ', ' + D.fmt(sp[0]) + ' to ' + D.fmt(sp[1]) + (conflicts[t.id] ? ', starts before its blocker ends' : '') + '. Arrow keys move, Shift+arrows resize.">' +
        '<span class="prog" style="width:' + prog + '%"></span>' + (Q.isGuest() ? '' : '<span class="h l" data-h="l"></span>') + '<span class="bt">' + esc(t.title) + '</span>' + (w > 120 ? UI.avs(t.assignees, 2, 's') : '') + (Q.isGuest() ? '' : '<span class="h r" data-h="r"></span><span class="lk" data-h="k" title="Drag to another bar to add a dependency"></span>') + '</div>';
      if (w < 140 && !isMs(t)) h += '<span class="ms-lbl" style="left:' + (left + w + 22) + 'px;top:' + (r.y + 12) + 'px;color:var(--muted)">' + esc(t.title) + '</span>';
    });
    // dependency arrows
    h += '<svg class="deps" width="' + W + '" height="' + H + '" aria-hidden="true">';
    list.forEach(function (t) {
      var b = pos[t.id]; if (!b) return; var sp = span(t); if (!sp[0]) return;
      t.deps.forEach(function (id) {
        var a = pos[id], src = Q.task(id); if (!a || !src) return; var ss = span(src); if (!ss[1]) return;
        var x1 = X(ss[1]) + dw + (isMs(src) ? -dw / 2 + 10 : 0), y1 = a.y + RH / 2, x2 = X(sp[0]) + (isMs(t) ? dw / 2 - 10 : 0), y2 = b.y + RH / 2, bad = !!conflicts[t.id] && sp[0] <= ss[1];
        var mx = Math.max(x1 + 10, Math.min(x2 - 10, x1 + 14));
        var dpath = x2 - 14 > x1 ? 'M' + x1 + ' ' + y1 + ' H' + mx + ' V' + y2 + ' H' + (x2 - 2) : 'M' + x1 + ' ' + y1 + ' h10 V' + (y1 + (y2 > y1 ? RH / 2 : -RH / 2)) + ' H' + (x2 - 12) + ' V' + y2 + ' H' + (x2 - 2);
        h += '<path class="' + (bad ? 'bad' : '') + '" d="' + dpath + '" data-dep="' + id + '>' + t.id + '" marker-end="url(#arr' + (bad ? 'b' : '') + ')"/>';
      });
    });
    h += '<defs><marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 8 4 0 8z" fill="var(--line-3)"/></marker><marker id="arrb" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 8 4 0 8z" fill="var(--bad)"/></marker></defs><path class="live" id="live-dep" d="" style="display:none"/></svg>';
    h += '</div></div></div></div>';
    var nConf = Object.keys(conflicts).length;
    var bar = '<div class="tl-bar">' + (nConf ? '<span class="due over">' + I('blocked', 's') + nConf + ' task' + (nConf > 1 ? 's start' : ' starts') + ' before a blocker ends</span>' : '<span class="due">' + I('dep', 's') + 'Dependencies are on track</span>') +
      '<span class="sp"></span>' + (Q.isGuest() ? '' : '<label class="switch" style="font-size:12.5px"><input type="checkbox" data-change="auto-shift"' + (S.prefs.autoShift ? ' checked' : '') + '><i></i>Move dependent tasks with their blocker</label>') +
      '<button type="button" class="btn sm ghost" data-act="tl-today">' + I('target') + 'Today</button></div>';
    el.innerHTML = bar + h;
    var sc = el.querySelector('.tl2');
    sc.style.height = 'calc(100vh - var(--demo-h) - var(--top-h) - 190px)';
    if (c.fresh || !st.tlScrolled) { sc.scrollLeft = Math.max(0, X(today) - 160); st.tlScrolled = true; }
    interact(el, sc, c, { o: o, dw: dw, pos: pos, X: X, LW: LW });
  };
  UI.act('tl-zoom', function (el) { var st = PR.state(PR.cur()); st.zoom = el.getAttribute('data-z'); st.tlScrolled = false; app.render(); });
  UI.act('tl-today', function () { var sc = document.querySelector('.tl2'), t = document.querySelector('.tl-bg .today'); if (sc && t) sc.scrollTo({ left: t.offsetLeft - 160, behavior: UI.reduced() ? 'auto' : 'smooth' }); });
  UI.act('auto-shift', function (el) { store.commit(el.checked ? 'Dependents will follow their blockers' : 'Dependents stay put', function (S) { S.prefs.autoShift = el.checked; }); });

  // shift dependents forward so none starts before its blocker ends; returns count
  function cascade(t, seen) {
    var n = 0; seen = seen || {}; if (seen[t.id]) return 0; seen[t.id] = 1;
    Q.blocking(t).forEach(function (x) {
      var te = t.due || t.start; if (!te || !x.start) return;
      if (x.start <= te) { var by = D.diff(x.start, te) + 1; x.start = D.add(x.start, by); if (x.due) x.due = D.add(x.due, by); n++; store.log(x, 'was rescheduled by ' + by + ' day' + (by > 1 ? 's' : '') + ' because a blocker moved'); n += cascade(x, seen); }
    });
    return n;
  }
  function hasPath(from, to, seen) { if (from === to) return true; seen = seen || {}; if (seen[from]) return false; seen[from] = 1; var f = Q.task(from); return !!f && Q.blocking(f).some(function (x) { return hasPath(x.id, to, seen); }); }

  function interact(root, sc, c, g) {
    var s = null, tip = null;
    function showTip(x, y, txt) { if (!tip) { tip = document.createElement('div'); tip.className = 'tl-tip'; document.body.appendChild(tip); } tip.textContent = txt; tip.style.left = (x + 14) + 'px'; tip.style.top = (y - 34) + 'px'; }
    function hideTip() { if (tip) { tip.remove(); tip = null; } }
    sc.addEventListener('pointerdown', function (e) {
      if (Q.isGuest() || e.button !== 0) return;
      var b = e.target.closest('[data-bar]'); if (!b) return;
      var t = Q.task(b.getAttribute('data-bar')), sp = span(t), h = e.target.getAttribute('data-h');
      s = { b: b, t: t, mode: h === 'l' ? 'l' : h === 'r' ? 'r' : h === 'k' ? 'k' : 'm', x: e.clientX, y: e.clientY, s0: sp[0], e0: sp[1], left0: b.offsetLeft, w0: b.offsetWidth, on: false, pid: e.pointerId, touch: e.pointerType === 'touch' };
      if (s.mode === 'm' && b.classList.contains('ms')) s.left0 = parseFloat(b.style.left);
      if (s.touch) { var me = s; me.timer = setTimeout(function () { if (s === me) { me.armed = true; UI.dragLock = true; b.classList.add('dragging'); } }, 300); }
      else e.preventDefault();
    });
    function move(e) {
      if (!s || e.pointerId !== s.pid) return;
      var dx = e.clientX - s.x;
      if (!s.on) { if (s.touch && !s.armed) { if (Math.abs(dx) + Math.abs(e.clientY - s.y) > 8) { clearTimeout(s.timer); s = null; } return; } if (Math.abs(dx) + Math.abs(e.clientY - s.y) < 4) return; s.on = true; s.b.classList.add('dragging'); document.body.style.cursor = s.mode === 'm' ? 'grabbing' : s.mode === 'k' ? 'crosshair' : 'ew-resize'; }
      e.preventDefault();
      var dd = Math.round(dx / g.dw);
      if (s.mode === 'k') {
        var r = sc.querySelector('.tl2-chart').getBoundingClientRect(), live = sc.querySelector('#live-dep'), x1 = s.left0 + s.w0 + 4, y1 = g.pos[s.t.id].y + RH / 2;
        live.style.display = ''; live.setAttribute('d', 'M' + x1 + ' ' + y1 + ' L' + (e.clientX - r.left) + ' ' + (e.clientY - r.top));
        sc.querySelectorAll('.bar.drop-t').forEach(function (x) { x.classList.remove('drop-t'); });
        var under = document.elementFromPoint(e.clientX, e.clientY), tb = under && under.closest('[data-bar]'); if (tb && tb !== s.b) tb.classList.add('drop-t');
        showTip(e.clientX, e.clientY, tb && tb !== s.b ? 'Blocks “' + Q.task(tb.getAttribute('data-bar')).title.slice(0, 36) + '”' : 'Drop on the task this one blocks'); return;
      }
      var ns = s.s0, ne = s.e0;
      if (s.mode === 'm') { ns = D.add(s.s0, dd); ne = D.add(s.e0, dd); s.b.style.left = (s.left0 + dd * g.dw) + 'px'; }
      if (s.mode === 'l') { ns = D.add(s.s0, Math.min(dd, D.diff(s.s0, s.e0))); s.b.style.left = g.X(ns) + 'px'; s.b.style.width = (D.diff(ns, ne) + 1) * g.dw + 'px'; }
      if (s.mode === 'r') { ne = D.add(s.e0, Math.max(dd, -D.diff(s.s0, s.e0))); s.b.style.width = (D.diff(ns, ne) + 1) * g.dw + 'px'; }
      s.ns = ns; s.ne = ne;
      showTip(e.clientX, e.clientY, D.fmt(ns) + ' → ' + D.fmt(ne) + ' · ' + D.workdays(ns, ne) + ' working day' + (D.workdays(ns, ne) === 1 ? '' : 's'));
      var r2 = sc.getBoundingClientRect(); if (e.clientX > r2.right - 40) sc.scrollLeft += 12; else if (e.clientX < r2.left + g.LW + 30) sc.scrollLeft -= 12;
    }
    function up(e) {
      if (!s || e.pointerId !== s.pid) return; var st = s; s = null; clearTimeout(st.timer); UI.dragLock = false; hideTip(); document.body.style.cursor = ''; st.b.classList.remove('dragging');
      if (!st.on) { if (!st.armed) app.openTask(st.t.id); return; }
      var t = st.t;
      if (st.mode === 'k') {
        sc.querySelector('#live-dep').style.display = 'none';
        var under = document.elementFromPoint(e.clientX, e.clientY), tb = under && under.closest('[data-bar]');
        if (!tb || tb === st.b) return; var to = Q.task(tb.getAttribute('data-bar'));
        if (to.deps.indexOf(t.id) > -1) { UI.toast('That dependency already exists'); return; }
        if (hasPath(to.id, t.id)) { UI.toast('That would create a loop — ' + esc(to.num) + ' already leads to ' + esc(t.num), { icon: 'blocked' }); return; }
        store.commit(t.num + ' now blocks ' + to.num, function () { to.deps.push(t.id); store.log(to, 'is now blocked by ' + t.num); });
        return;
      }
      if (!st.ns || (st.ns === st.s0 && st.ne === st.e0)) { app.render(); return; }
      var shifted = 0;
      store.commit(t.num + ': ' + D.fmt(st.ns) + ' → ' + D.fmt(st.ne), function (S) {
        t.start = st.ns; t.due = st.ne; t.updated = Date.now(); store.log(t, 'rescheduled to ' + D.fmt(st.ns) + ' – ' + D.fmt(st.ne));
        if (S.prefs.autoShift) shifted = cascade(t);
      });
      if (shifted) setTimeout(function () { UI.toast('Moved ' + shifted + ' dependent task' + (shifted > 1 ? 's' : '') + ' so nothing starts before its blocker', { icon: 'dep' }); }, 300);
    }
    addEventListener('pointermove', move, { passive: false }); addEventListener('pointerup', up); addEventListener('pointercancel', function () { if (s) { clearTimeout(s.timer); UI.dragLock = false; s = null; hideTip(); app.render(); } });
    var obs = new MutationObserver(function () { if (!document.body.contains(sc)) { removeEventListener('pointermove', move); removeEventListener('pointerup', up); hideTip(); obs.disconnect(); } });
    obs.observe(document.getElementById('view'), { childList: true, subtree: true });
    // keyboard: arrows move, shift+arrows resize
    sc.addEventListener('keydown', function (e) {
      var b = e.target.closest('[data-bar]'); if (!b) return;
      var t = Q.task(b.getAttribute('data-bar')), sp = span(t);
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); app.openTask(t.id); return; }
      if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || Q.isGuest()) return;
      e.preventDefault(); var d = e.key === 'ArrowRight' ? 1 : -1;
      store.commit(t.num + (e.shiftKey ? ' resized' : ' moved'), function (S) { if (e.shiftKey) { var ne = D.add(sp[1], d); if (ne >= sp[0]) t.due = ne; } else { t.start = D.add(sp[0], d); t.due = D.add(sp[1], d); if (S.prefs.autoShift && d > 0) cascade(t); } }, { quiet: true });
      setTimeout(function () { var n = document.querySelector('[data-bar="' + t.id + '"]'); if (n) n.focus(); }, 20);
    });
    // schedule an unscheduled task by clicking the lane
    sc.addEventListener('click', function (e) {
      var sb = e.target.closest('[data-sched]'); if (!sb || Q.isGuest()) return;
      var t = Q.task(sb.getAttribute('data-sched')), r = sc.querySelector('.tl2-chart').getBoundingClientRect(), day = D.add(g.o, Math.floor((e.clientX - r.left) / g.dw));
      store.commit('Scheduled ' + t.num, function () { t.start = day; t.due = D.add(day, Math.max(1, Math.round((t.est || 8) / 8)) - 1); });
    });
  }
})();
