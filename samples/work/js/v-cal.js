/* Ordwell — Calendar (month grid, drag to reschedule, drag in unscheduled work, quick add on a day)
   and Workload (hours per person per day against capacity, drill-down, drag to reassign, rebalance suggestion). */
(function () {
  'use strict';
  var OW = window.OW, UI = OW.UI, Q = OW.Q, D = OW.D, I = UI.I, esc = UI.esc, store = OW.store, app = OW.app, PR = OW.project;
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  /* =============================== CALENDAR =============================== */
  function chip(t, cls) { var st = Q.status(t); return '<button type="button" class="ce' + (Q.isDone(t) ? ' done' : '') + (cls ? ' ' + cls : '') + '" data-tid="' + t.id + '" data-ce="' + t.id + '" style="--c:' + UI.CAT[st.cat] + '" aria-label="' + esc(t.title) + ', ' + esc(st.name) + '">' + (t.tags.indexOf('milestone') > -1 ? I('diamond', 's') : '') + '<span>' + esc(t.title) + '</span></button>'; }
  OW.views.calendar = function (el, c) {
    var st = c.st, today = D.today();
    if (!st.month) st.month = today.slice(0, 7);
    var y = +st.month.slice(0, 4), m = +st.month.slice(5, 7) - 1;
    var first = new Date(y, m, 1, 12), start = OW.dateUtil.iso(new Date(y, m, 1 - ((first.getDay() + 6) % 7), 12));
    var byDay = {}; c.tasks.forEach(function (t) { if (t.due) (byDay[t.due] = byDay[t.due] || []).push(t); });
    var unsched = c.tasks.filter(function (t) { return !t.due && !Q.isDone(t); });
    var max = innerWidth < 640 ? 2 : 3;
    var h = '<div class="cal-wrap"><div class="cal"><div class="cal-h"><h2>' + MONTHS[m] + ' ' + y + '</h2>' +
      '<button type="button" class="ibtn" data-act="cal-nav" data-d="-1" aria-label="Previous month">' + I('chl') + '</button><button type="button" class="ibtn" data-act="cal-nav" data-d="1" aria-label="Next month">' + I('chr') + '</button><button type="button" class="btn sm" data-act="cal-nav" data-d="0">Today</button><span style="flex:1"></span><span class="faint hide-s" style="font-size:12px">Drag a task to reschedule · tasks show on their due date</span></div>' +
      '<div class="cal-grid" role="grid" aria-label="' + MONTHS[m] + ' ' + y + '">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (d) { return '<div class="cal-dow" role="columnheader">' + d + '</div>'; }).join('');
    for (var i = 0; i < 42; i++) {
      var d = D.add(start, i), dt = D.parse(d), inM = dt.getMonth() === m, ts = (byDay[d] || []).sort(function (a, b) { return Q.isDone(a) - Q.isDone(b) || b.priority - a.priority; });
      if (i === 35 && !inM) break;
      h += '<div class="cal-d' + (D.wkend(d) ? ' we' : '') + (inM ? '' : ' out') + (d === today ? ' td' : '') + '" data-day="' + d + '" role="gridcell" aria-label="' + D.fmt(d, 'long') + ', ' + ts.length + ' tasks"><div class="dn"><b>' + dt.getDate() + '</b>' + (Q.isGuest() ? '' : '<button type="button" class="add" data-act="cal-add" data-day="' + d + '" aria-label="Add task due ' + D.fmt(d) + '">' + I('plus', 's') + '</button>') + '</div>' +
        ts.slice(0, max).map(function (t) { return chip(t); }).join('') + (ts.length > max ? '<button type="button" class="cal-more" data-act="cal-more" data-day="' + d + '">+' + (ts.length - max) + ' more</button>' : '') + '</div>';
    }
    h += '</div></div><aside class="unsched" aria-label="Unscheduled tasks"><h3>Unscheduled · ' + unsched.length + '</h3><p>Drag onto a day to set the due date.</p>' + (unsched.length ? unsched.map(function (t) { return chip(t); }).join('') : '<p class="faint">Everything open has a date. Nice.</p>') + '</aside></div>';
    el.innerHTML = h;
    dragChips(el, '.ce[data-ce]', function (target) { return target.closest('[data-day]'); }, function (t, cell) {
      var d = cell.getAttribute('data-day'); if (t.due === d) return;
      var delta = t.due ? D.diff(t.due, d) : 0;
      store.commit(t.num + ' due ' + D.fmt(d), function () { if (t.start && t.due) t.start = D.add(t.start, delta); else if (!t.start) t.start = D.add(d, -Math.max(0, Math.round((t.est || 8) / 8) - 1)); t.due = d; if (t.start > d) t.start = d; t.updated = Date.now(); store.log(t, 'moved due date to ' + D.fmt(d)); });
    }, 'over');
  };
  UI.act('cal-nav', function (el) {
    var st = PR.state(PR.cur()), d = +el.getAttribute('data-d');
    if (!d) st.month = D.today().slice(0, 7); else { var y = +st.month.slice(0, 4), m = +st.month.slice(5, 7) - 1 + d; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } st.month = y + '-' + (m < 9 ? '0' : '') + (m + 1); }
    app.render();
  });
  UI.act('cal-more', function (el) {
    var d = el.getAttribute('data-day'), pid = PR.cur(), ts = PR.filtered(pid, PR.state(pid)).filter(function (t) { return t.due === d; });
    var p = UI.pop(el, '<div class="mh">' + D.fmt(d, 'long') + '</div>' + ts.map(function (t) { return '<button type="button" class="mi" data-act="open-task" data-id="' + t.id + '">' + UI.sdot(Q.status(t)) + '<span class="sp">' + esc(t.title) + '</span>' + UI.avs(t.assignees, 2, 's') + '</button>'; }).join(''));
    p.addEventListener('click', function (e) { if (e.target.closest('.mi')) UI.closePop(); });
  });
  UI.act('cal-add', function (el) {
    var d = el.getAttribute('data-day'), pid = PR.cur();
    if (pid === '*') { app.newTask({ due: d }); return; }
    var p = UI.pop(el, '<div style="padding:8px;width:280px"><label class="lbl-t" for="ca">New task due ' + D.fmt(d, 'long') + '</label><input id="ca" class="inp" placeholder="Title, then Enter"></div>');
    var inp = p.querySelector('input');
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && inp.value.trim()) { var v = inp.value.trim(); UI.closePop(); PR.quickCreate(pid, v, { due: d, start: d }); } });
  });

  /* generic pointer drag for chips (calendar + workload) */
  function dragChips(root, sel, findTarget, onDrop, overCls) {
    var s = null, clone = null, last = null;
    root.addEventListener('pointerdown', function (e) {
      var k = e.target.closest(sel); if (!k || e.button !== 0 || Q.isGuest()) return;
      s = { k: k, x: e.clientX, y: e.clientY, pid: e.pointerId, on: false, touch: e.pointerType === 'touch' };
      if (s.touch) { var me = s; me.timer = setTimeout(function () { if (s === me) { me.armed = true; UI.dragLock = true; k.style.outline = '2px solid var(--accent)'; } }, 300); }
    });
    root.addEventListener('click', function (e) { var k = e.target.closest(sel); if (!k) return; if (root._jd) { root._jd = false; e.preventDefault(); return; } app.openTask(k.getAttribute('data-tid')); });
    function mv(e) {
      if (!s || e.pointerId !== s.pid) return; var dist = Math.abs(e.clientX - s.x) + Math.abs(e.clientY - s.y);
      if (!s.on) { if (s.touch && !s.armed) { if (dist > 8) { clearTimeout(s.timer); s = null; } return; } if (dist < 6) return; s.on = true; var r = s.k.getBoundingClientRect(); clone = s.k.cloneNode(true); clone.classList.add('drag'); clone.style.width = Math.max(140, r.width) + 'px'; document.body.appendChild(clone); s.k.style.opacity = '.35'; }
      e.preventDefault(); clone.style.left = (e.clientX - 20) + 'px'; clone.style.top = (e.clientY - 14) + 'px';
      var under = document.elementFromPoint(e.clientX, e.clientY), tg = under && findTarget(under);
      if (last && last !== tg) last.classList.remove(overCls); if (tg) tg.classList.add(overCls); last = tg;
    }
    function up(e) {
      if (!s || e.pointerId !== s.pid) return; var st = s; s = null; clearTimeout(st.timer); UI.dragLock = false; st.k.style.outline = '';
      if (!st.on) return; root._jd = true; setTimeout(function () { root._jd = false; }, 60);
      clone.remove(); st.k.style.opacity = ''; if (last) last.classList.remove(overCls);
      var t = Q.task(st.k.getAttribute('data-tid')); if (last && t) onDrop(t, last); last = null;
    }
    addEventListener('pointermove', mv, { passive: false }); addEventListener('pointerup', up);
    var obs = new MutationObserver(function () { if (!document.body.contains(root.firstElementChild)) { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); obs.disconnect(); } });
    obs.observe(document.getElementById('view'), { childList: true, subtree: true });
  }

  /* =============================== WORKLOAD =============================== */
  // hours a task puts on a person on a given day: estimate spread across its working days, split between assignees
  function load(t, uid, day) {
    if (Q.isDone(t) || !t.est || t.assignees.indexOf(uid) < 0) return 0;
    var s = t.start || t.due, e = t.due || t.start; if (!s || D.wkend(day) || day < s || day > e) return 0;
    return t.est / Math.max(1, D.workdays(s, e)) / t.assignees.length;
  }
  OW.workload = { load: load };
  OW.views.workload = function (el, c) {
    var st = c.st, today = D.today(), S = store.S;
    var mon = D.add(today, -((D.dow(today) + 6) % 7)); if (!st.wl) st.wl = mon;
    var days = []; for (var i = 0; i < 14; i++) days.push(D.add(st.wl, i));
    var people = S.users.filter(function (u) { return u.role !== 'guest' && (c.pid === '*' || c.p.members.indexOf(u.id) > -1); });
    var all = c.pid === '*' ? Q.tasks('*', true) : Q.tasks(c.pid, true); // workload counts all open work, filters only narrow the list below
    st.wlOpen = st.wlOpen || {};
    var cols = '220px repeat(14,minmax(44px,1fr))';
    var h = '<div class="wl"><div class="wl-h"><button type="button" class="ibtn" data-act="wl-nav" data-d="-7" aria-label="Previous week">' + I('chl') + '</button><b style="font-size:14px">' + D.fmt(days[0]) + ' – ' + D.fmt(days[13]) + '</b><button type="button" class="ibtn" data-act="wl-nav" data-d="7" aria-label="Next week">' + I('chr') + '</button><button type="button" class="btn sm" data-act="wl-nav" data-d="0">This week</button>' +
      '<span style="flex:1"></span><span class="wl-legend"><span><i style="background:color-mix(in srgb,var(--ok) 30%,var(--surface))"></i>Under 80%</span><span><i style="background:color-mix(in srgb,var(--warn) 35%,var(--surface))"></i>Near capacity</span><span><i style="background:color-mix(in srgb,var(--bad) 35%,var(--surface))"></i>Over</span></span>' +
      (Q.isGuest() ? '' : '<button type="button" class="btn sm" data-act="wl-balance">' + I('spark') + 'Suggest a rebalance</button>') + '</div>';
    h += '<div class="wl-grid" style="grid-template-columns:' + cols + '" role="table" aria-label="Workload by person and day">';
    h += '<div class="wl-cell hd who" role="columnheader">Person · hours / capacity</div>';
    days.forEach(function (d) { var dt = D.parse(d); h += '<div class="wl-cell hd' + (d === today ? ' td' : '') + '" role="columnheader">' + ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dt.getDay()] + '<b style="font-weight:500">' + dt.getDate() + '</b></div>'; });
    people.forEach(function (u) {
      var daily = u.cap / 5, tot = 0, wk1 = 0;
      var cells = days.map(function (d, i) { var hrs = 0; all.forEach(function (t) { hrs += load(t, u.id, d); }); tot += hrs; if (i < 7) wk1 += hrs; return hrs; });
      var open = st.wlOpen[u.id];
      h += '<div class="wl-cell who" data-wl-row="' + u.id + '" role="rowheader"><button type="button" data-act="wl-open" data-id="' + u.id + '" aria-expanded="' + !!open + '" style="display:flex;align-items:center;gap:10px;text-align:left;min-width:0">' + UI.av(u.id, 'l') + '<span style="min-width:0"><b style="font-weight:500;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(u.name) + '</b><small>' + esc(u.title.split(',')[0]) + '</small></span></button><span class="wl-sum"><b style="color:' + (wk1 > u.cap ? 'var(--bad)' : 'var(--ink)') + '">' + Math.round(wk1) + 'h</b><br>of ' + u.cap + 'h</span></div>';
      cells.forEach(function (hrs, i) {
        var d = days[i], pct = hrs / daily, cls = pct > 1.001 ? 'over' : pct > 0.8 ? 'mid' : '';
        h += '<div class="wl-cell' + (D.wkend(d) ? ' we' : '') + '" data-wl-drop="' + u.id + '" role="cell">' + (hrs > 0.05 && !D.wkend(d) ? '<button type="button" class="blk ' + cls + '" data-act="wl-cell" data-u="' + u.id + '" data-d="' + d + '" aria-label="' + esc(u.name) + ', ' + D.fmt(d) + ': ' + UI.n(hrs) + ' of ' + UI.n(daily) + ' hours">' + UI.n(Math.round(hrs * 2) / 2) + '</button>' : '') + '</div>';
      });
      if (open) {
        var mine = c.tasks.filter(function (t) { return t.assignees.indexOf(u.id) > -1 && !Q.isDone(t); });
        h += '<div class="wl-tasks" role="row"><span class="faint" style="font-size:12px;width:100%">Drag a task onto another person to reassign it.</span>' + (mine.length ? mine.map(function (t) { return '<button type="button" class="wl-chip" data-tid="' + t.id + '" data-from="' + u.id + '">' + UI.sdot(Q.status(t)) + '<span>' + esc(t.title) + '</span><small class="faint">' + (t.est || 0) + 'h</small></button>'; }).join('') : '<span class="faint">No open tasks in this view.</span>') + '</div>';
      }
    });
    h += '</div></div>';
    el.innerHTML = h;
    dragChips(el, '.wl-chip', function (target) { var c2 = target.closest('[data-wl-drop],[data-wl-row]'); return c2; }, function (t, cell) {
      var to = cell.getAttribute('data-wl-drop') || cell.getAttribute('data-wl-row'), from = el.querySelector('.wl-chip[data-tid="' + t.id + '"]').getAttribute('data-from');
      if (to === from || t.assignees.indexOf(to) > -1) return;
      store.commit(t.num + ' → ' + Q.user(to).name.split(' ')[0], function () { OW.A.assign(t, t.assignees.map(function (a) { return a === from ? to : a; })); });
    }, 'drop');
  };
  UI.act('wl-nav', function (el) { var st = PR.state(PR.cur()), d = +el.getAttribute('data-d'); if (!d) st.wl = null; else st.wl = D.add(st.wl, d); app.render(); });
  UI.act('wl-open', function (el) { var st = PR.state(PR.cur()); st.wlOpen[el.getAttribute('data-id')] = !st.wlOpen[el.getAttribute('data-id')]; app.render(); });
  UI.act('wl-cell', function (el) {
    var u = el.getAttribute('data-u'), d = el.getAttribute('data-d'), pid = PR.cur(), ts = (pid === '*' ? Q.tasks('*', true) : Q.tasks(pid, true)).filter(function (t) { return load(t, u, d) > 0; });
    var pop = UI.pop(el, '<div class="mh">' + esc(Q.user(u).name) + ' · ' + D.fmt(d, 'long') + '</div>' + ts.map(function (t) { return '<button type="button" class="mi" data-act="open-task" data-id="' + t.id + '">' + UI.sdot(Q.status(t)) + '<span class="sp">' + esc(t.title) + '</span><small class="faint">' + UI.n(Math.round(load(t, u, d) * 10) / 10) + 'h</small></button>'; }).join(''));
    pop.addEventListener('click', function (e) { if (e.target.closest('.mi')) UI.closePop(); });
  });
  UI.act('wl-balance', function () {
    var pid = PR.cur(), st = PR.state(pid), S = store.S, today = D.today(), mon = st.wl || D.add(today, -((D.dow(today) + 6) % 7));
    var days = []; for (var i = 0; i < 7; i++) days.push(D.add(mon, i));
    var tasks = (pid === '*' ? Q.tasks('*', true) : Q.tasks(pid, true));
    var people = S.users.filter(function (u) { return u.role !== 'guest' && u.cap && (pid === '*' || Q.project(pid).members.indexOf(u.id) > -1); });
    var wk = function (uid) { var s = 0; days.forEach(function (d) { tasks.forEach(function (t) { s += load(t, uid, d); }); }); return s; };
    var ranked = people.map(function (u) { return { u: u, h: wk(u.id), r: wk(u.id) / u.cap }; }).sort(function (a, b) { return b.r - a.r; });
    var hi = ranked[0], lo = ranked[ranked.length - 1];
    if (!hi || hi.r <= 1) { UI.toast('Nobody is over capacity this week — no changes needed', { icon: 'check' }); return; }
    var cand = tasks.filter(function (t) { return t.assignees.indexOf(hi.u.id) > -1 && !Q.isDone(t) && t.priority < 4 && t.assignees.indexOf(lo.u.id) < 0; }).sort(function (a, b) { return a.priority - b.priority || b.est - a.est; })[0];
    if (!cand) { UI.toast('No movable task found for ' + esc(hi.u.name)); return; }
    var moved = 0; days.forEach(function (d) { moved += load(cand, hi.u.id, d); });
    UI.dialog({
      title: 'Suggested rebalance', ok: 'Reassign task',
      body: '<p class="muted" style="font-size:13px;margin-bottom:12px">' + esc(hi.u.name) + ' is at <b>' + Math.round(hi.r * 100) + '%</b> this week (' + Math.round(hi.h) + 'h of ' + hi.u.cap + 'h). ' + esc(lo.u.name) + ' has the most room at ' + Math.round(lo.r * 100) + '%.</p>' +
        '<div class="preview-list"><div class="pr"><span class="mono">' + esc(cand.num) + '</span><span style="flex:1">' + esc(cand.title) + '</span><span>' + UI.av(hi.u.id, 's') + '</span><span class="arrow">' + I('arr', 's') + '</span><span>' + UI.av(lo.u.id, 's') + '</span></div></div>' +
        '<div class="psum" style="margin-top:12px"><span class="tag">' + esc(hi.u.name.split(' ')[0]) + ': ' + Math.round(hi.h) + 'h → ' + Math.round(hi.h - moved) + 'h</span><span class="tag">' + esc(lo.u.name.split(' ')[0]) + ': ' + Math.round(lo.h) + 'h → ' + Math.round(lo.h + moved) + 'h</span><span class="tag cv">lowest-priority task picked first</span></div>',
      onOk: function () { store.commit(cand.num + ' → ' + lo.u.name.split(' ')[0], function () { OW.A.assign(cand, cand.assignees.map(function (a) { return a === hi.u.id ? lo.u.id : a; })); }); }
    });
  });
})();
