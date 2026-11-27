/* Ordwell — My work (greeting, focus card, KPI tiles that filter, my tasks, queues, team pulse),
   Focus mode (one task at a time, Save & next, timer, closing note) and the Inbox. */
(function () {
  'use strict';
  var OW = window.OW, UI = OW.UI, Q = OW.Q, D = OW.D, I = UI.I, esc = UI.esc, store = OW.store, app = OW.app;
  var P = OW.pages = {}, home = { tile: '' };

  function myOpen() { var me = Q.me(); return Q.tasks('*', true).filter(function (t) { return t.assignees.indexOf(me) > -1 && !Q.isDone(t); }); }
  function bucket(t) { if (!t.due) return 'none'; var n = D.diff(D.today(), t.due); return n < 0 ? 'over' : n === 0 ? 'today' : n <= 7 ? 'week' : 'later'; }
  P.todayQueue = function () {
    return myOpen().filter(function (t) { var b = bucket(t); return b === 'over' || b === 'today' || (Q.cat(t) === 'active' && b === 'week'); })
      .sort(function (a, b) { return (a.due || '9') < (b.due || '9') ? -1 : (a.due || '9') > (b.due || '9') ? 1 : b.priority - a.priority; });
  };

  /* ---------- home helpers: sparklines, attention reasons ---------- */
  function spark(vals, cls) {
    var max = Math.max.apply(null, vals.concat([1])), w = 72, h = 22, step = w / (vals.length - 1);
    var pts = vals.map(function (v, i) { return (i * step).toFixed(1) + ',' + (h - 2 - v / max * (h - 4)).toFixed(1); }).join(' ');
    return '<svg class="spk ' + (cls || '') + '" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" aria-hidden="true"><polyline points="' + pts + '"/><circle cx="' + w + '" cy="' + (h - 2 - vals[vals.length - 1] / max * (h - 4)).toFixed(1) + '" r="2.2"/></svg>';
  }
  function dayEnd(d) { return D.parse(d).getTime() + 12 * 36e5; }
  function series(fn) { var out = []; for (var i = 6; i >= 0; i--) out.push(fn(D.add(D.today(), -i))); return out; }
  function attention() {
    var S = store.S, me = Q.me(), out = [], seen = {};
    function add(t, kind, reason, act, label, w) { if (!t || seen[t.id + kind]) return; seen[t.id + kind] = 1; out.push({ t: t, kind: kind, reason: reason, act: act, label: label, w: w }); }
    var mine = myOpen();
    S.notifs.filter(function (n) { return n.to === me && !n.read && n.kind === 'mention' && n.task; }).forEach(function (n) { var t = Q.task(n.task), u = Q.user(n.from); if (t && Q.canSee(t)) add(t, 'mention', (u ? u.name.split(' ')[0] : 'Someone') + ' mentioned you ' + D.ago(n.at) + ' — “' + n.text.replace(/^mentioned you: "|^replied: "|"$/g, '').slice(0, 64) + '”', 'reply', 'Reply', 90); });
    mine.filter(Q.overdue).forEach(function (t) { var n = Math.abs(D.diff(D.today(), t.due)), c = S.comments.filter(function (x) { return x.task === t.id; }).sort(function (a, b) { return b.at - a.at; })[0]; add(t, 'over', 'Overdue ' + (n === 1 ? '1 day' : n + ' days') + (c ? ' · last note from ' + (Q.user(c.uid) || { name: 'automation' }).name.split(' ')[0] + ' ' + D.ago(c.at) : ''), 'resched', 'Reschedule', 80 + n); });
    Q.tasks('*').filter(function (t) { return Q.cat(t) === 'review' && !Q.isDone(t) && (t.fields.f6 === me || (Q.project(t.project).owner === me && t.assignees.indexOf(me) < 0)); }).forEach(function (t) { add(t, 'review', 'Ready for your review · ' + t.assignees.map(function (a) { return Q.user(a).name.split(' ')[0]; }).join(', ') + ' handed it over', 'open', 'Review', 70); });
    mine.filter(function (t) { return t.due === D.today(); }).forEach(function (t) { var logged = t.time.some(function (l) { return l.uid === me && Date.now() - l.at < 864e5; }); add(t, 'today', 'Due today' + (logged ? '' : ' · nothing logged yet') + (t.est ? ' · ≈ ' + UI.hm(Math.max(0, t.est * 60 - Q.logged(t))) + ' left' : ''), 'timer', 'Start timer', 60); });
    mine.filter(function (t) { return Q.blockedOpen(t); }).forEach(function (t) { var b = Q.blockers(t).filter(function (x) { return !Q.isDone(x); })[0]; add(t, 'blocked', 'Blocked by ' + b.num + ' (' + Q.status(b).name + ') · ' + Q.user(b.assignees[0] || me).name.split(' ')[0] + ' owns it', 'open', 'Open', 40); });
    return out.sort(function (a, b) { return b.w - a.w; });
  }
  var AKIND = { mention: ['at', 'var(--accent)'], over: ['clock', 'var(--bad)'], review: ['eye', 'var(--c-review)'], today: ['calendar', 'var(--warn)'], blocked: ['blocked', 'var(--bad)'] };

  /* ---------- the week, as the client will see it ---------- */
  var wk = { view: 'my', client: '', open: {}, focus: null, jd: false };
  function clientOf(t) { var c = (Q.project(t.project) || {}).client || ''; return c && c !== 'Internal' && c.indexOf('Fernhill') !== 0 ? c : ''; }
  function tagged(t) { var par = t.parent && Q.task(t.parent); return t.tags.indexOf('client-visible') > -1 || !!(par && par.tags.indexOf('client-visible') > -1); }
  function seenBy(t) { return tagged(t) && clientOf(t) === wk.client; }
  function wkChip(t) {
    var p = Q.project(t.project), st = Q.status(t), ci = wk.view === 'client', ok = !ci || seenBy(t), guest = Q.isGuest();
    var why = ok ? '' : (tagged(t) ? 'other client' : 'internal');
    return '<div class="wk-chip' + (ok ? '' : ' int') + '" data-tid="' + t.id + '"><button type="button" class="wk-o" data-act="wk-open" data-id="' + t.id + '">' +
      '<span class="wk-k"><span class="pdot" style="--h:' + p.hue + '"></span><span class="mono">' + esc(t.num) + '</span><span class="sp"></span>' + UI.sdot(st) + '</span>' +
      '<span class="wk-t">' + esc(t.title) + '</span>' + (ok ? '' : '<span class="wk-i mono">' + why + '</span>') + '<span class="sr">, ' + esc(st.name + ', due ' + D.fmt(t.due) + (guest ? '' : '. Left and right arrow keys change the due date')) + '</span></button>' +
      (guest ? '' : '<button type="button" class="wk-mv" data-act="wk-move" data-id="' + t.id + '">Move to…</button>') + '</div>';
  }
  function weekPanel() {
    var today = D.today(), mine = myOpen().filter(function (t) { return t.due; }), days = [], over = [], i;
    for (i = 0; i < 7; i++) days.push({ d: D.add(today, i), ts: [] });
    mine.forEach(function (t) { var n = D.diff(today, t.due); if (n < 0) over.push(t); else if (n < 7) days[n].ts.push(t); });
    var srt = function (a, b) { return b.priority - a.priority || (a.num < b.num ? -1 : 1); };
    over.sort(function (a, b) { return a.due < b.due ? -1 : a.due > b.due ? 1 : srt(a, b); }); days.forEach(function (d) { d.ts.sort(srt); });
    var cnt = {}; myOpen().forEach(function (t) { var c = clientOf(t); if (c) cnt[c] = (cnt[c] || 0) + 1; });
    var clients = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; });
    if (clients.indexOf(wk.client) < 0) wk.client = clients[0] || '';
    var all = over.slice(); days.forEach(function (d) { all = all.concat(d.ts); });
    var compact = matchMedia('(max-width:1180px)').matches, ci = wk.view === 'client', guest = Q.isGuest(), seen = all.filter(seenBy).length;
    var count = ci ? seen + ' of ' + all.length + ' visible to ' + (wk.client || 'the client') : all.length + (all.length === 1 ? ' task' : ' tasks') + (over.length ? ' · ' + over.length + ' overdue' : '');
    var h = '<section class="wk" aria-labelledby="wk-h"><div class="wk-hd"><h2 id="wk-h">The week, as the client will see it</h2><span class="wk-cnt mono" role="status">' + esc(count) + '</span><span class="sp"></span>' +
      (ci && clients.length > 1 ? '<button type="button" class="wk-cl" data-act="wk-client" aria-haspopup="menu">' + esc(wk.client) + I('chd', 's') + '</button>' : '') +
      '<div class="kswitch" role="group" aria-label="Whose view"><button type="button" class="kcap" data-act="wk-view" data-v="my" aria-pressed="' + !ci + '">My view</button><button type="button" class="kcap" data-act="wk-view" data-v="client" aria-pressed="' + ci + '">Client view</button></div></div>';
    h += '<div class="wk-strip' + (over.length ? ' has-od' : '') + '">';
    if (over.length) h += '<div class="wk-day od"><div class="wk-dh"><span class="wk-dn">Overdue</span><span class="wk-dc">' + over.length + '</span></div><div class="wk-body">' + over.map(wkChip).join('') + '</div></div>';
    days.forEach(function (d, k) {
      var dt = D.parse(d.d), open = wk.open[d.d] != null ? wk.open[d.d] : k === 0, nm = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dt.getDay()];
      var dh = '<span class="wk-dn">' + nm + '</span><span class="wk-dd">' + dt.getDate() + '<small> ' + D.fmt(d.d).split(' ')[1] + '</small></span>' + (k === 0 ? '<span class="wk-td">Today</span>' : '') + '<span class="wk-dc">' + (d.ts.length || '') + '</span>';
      h += '<div class="wk-day' + (k === 0 ? ' td' : '') + (compact && !open ? ' shut' : '') + (D.wkend(d.d) ? ' we' : '') + '" data-day="' + d.d + '">' +
        (compact ? '<button type="button" class="wk-dh" data-act="wk-tog" data-d="' + d.d + '" aria-expanded="' + open + '">' + dh + I('chd', 's chev') + '</button>' : '<div class="wk-dh">' + dh + '</div>') + '<div class="wk-body">' +
        (d.ts.length ? d.ts.map(wkChip).join('') : (guest ? '<span class="wk-none">Nothing due</span>' : '<button type="button" class="wk-add" data-act="wk-add" data-day="' + d.d + '" aria-label="Add a task due ' + esc(D.fmt(d.d, 'long')) + '">' + I('plus', 's') + '<span>Add a task</span></button>')) + '</div></div>';
    });
    h += '</div>';
    if (!all.length) h += '<div class="wk-empty"><b>Nothing of yours lands this week.</b><span>Plan it: add a task on a day above, or pull one forward from the backlog.</span><a class="btn sm" href="#/p/*/list">Open all tasks</a></div>';
    else h += '<p class="wk-foot">' + (guest ? 'Open a task to see the detail.' : 'Drag a task to another day to change its due date, or focus it and use <kbd>←</kbd> <kbd>→</kbd>. <kbd>⌘</kbd> <kbd>Z</kbd> undoes.') + '</p>';
    return h + '</section>';
  }
  function wkMove(t, d) {
    if (!t || t.due === d || Q.isGuest()) return; wk.focus = t.id;
    store.commit(t.num + ' due ' + D.fmt(d), function () { var delta = t.due ? D.diff(t.due, d) : 0; if (t.start && t.due) t.start = D.add(t.start, delta); else if (!t.start) t.start = D.add(d, -Math.max(0, Math.round((t.est || 8) / 8) - 1)); t.due = d; if (t.start > d) t.start = d; t.updated = Date.now(); store.log(t, 'moved due date to ' + D.fmt(d)); });
  }
  UI.act('wk-open', function (el) { if (wk.jd) return; app.openTask(el.getAttribute('data-id')); });
  UI.act('wk-view', function (el) { wk.view = el.getAttribute('data-v'); app.render(); var b = document.querySelector('.kcap[data-v="' + wk.view + '"]'); if (b) b.focus({ preventScroll: true }); });
  UI.act('wk-tog', function (el) { var d = el.getAttribute('data-d'); wk.open[d] = el.getAttribute('aria-expanded') !== 'true'; app.render(); var b = document.querySelector('.wk-dh[data-d="' + d + '"]'); if (b) b.focus({ preventScroll: true }); });
  UI.act('wk-add', function (el) { app.newTask({ due: el.getAttribute('data-day') }); });
  UI.act('wk-client', function (el) {
    var cnt = {}; myOpen().forEach(function (t) { var c = clientOf(t); if (c) cnt[c] = 1; });
    UI.menu(el, [{ head: 'Show the week as seen by' }].concat(Object.keys(cnt).map(function (c) { return { label: c, checked: c === wk.client, fn: function () { wk.client = c; app.render(); } }; })));
  });
  UI.act('wk-move', function (el) {
    var t = Q.task(el.getAttribute('data-id')), items = [{ head: 'Move ' + t.num + ' to' }];
    for (var i = 0; i < 7; i++) (function (d, i) { items.push({ label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : D.fmt(d, 'long'), hint: i < 2 ? D.fmt(d) : '', checked: t.due === d, fn: function () { wkMove(t, d); } }); })(D.add(D.today(), i), i);
    items.push({ sep: true }, { label: 'Pick a date…', icon: 'calendar', fn: function () { UI.pickDate(el, t.due, function (d) { if (d) wkMove(t, d); }); } });
    UI.menu(el, items);
  });
  // drag a chip to another day (mouse and pen; touch uses "Move to…")
  var wd = null, wmq = matchMedia('(max-width:1180px)');
  wmq.addEventListener('change', function () { if (app.route && app.route.name === 'home') app.render(); });
  document.addEventListener('pointerdown', function (e) {
    var c = e.target.closest && e.target.closest('.wk-chip'); if (!c || e.button !== 0 || e.pointerType === 'touch' || Q.isGuest() || e.target.closest('.wk-mv')) return;
    wd = { c: c, x: e.clientX, y: e.clientY, id: e.pointerId, on: false, clone: null, last: null };
  });
  document.addEventListener('pointermove', function (e) {
    if (!wd || e.pointerId !== wd.id) return;
    if (!wd.on) { if (Math.abs(e.clientX - wd.x) + Math.abs(e.clientY - wd.y) < 6) return; wd.on = true; var r = wd.c.getBoundingClientRect(); wd.clone = wd.c.cloneNode(true); wd.clone.classList.add('wk-drag'); wd.clone.style.width = r.width + 'px'; document.body.appendChild(wd.clone); wd.c.classList.add('lift'); }
    e.preventDefault(); wd.clone.style.left = (e.clientX - 24) + 'px'; wd.clone.style.top = (e.clientY - 18) + 'px';
    var u = document.elementFromPoint(e.clientX, e.clientY), tg = u && u.closest('.wk-day[data-day]');
    if (wd.last && wd.last !== tg) wd.last.classList.remove('over'); if (tg) tg.classList.add('over'); wd.last = tg;
  }, { passive: false });
  function wkEnd(e, cancel) {
    if (!wd || e.pointerId !== wd.id) return; var s = wd; wd = null;
    if (!s.on) return; wk.jd = true; setTimeout(function () { wk.jd = false; }, 80);
    s.clone.remove(); s.c.classList.remove('lift'); if (s.last) s.last.classList.remove('over');
    if (!cancel && s.last) wkMove(Q.task(s.c.getAttribute('data-tid')), s.last.getAttribute('data-day'));
  }
  document.addEventListener('pointerup', function (e) { wkEnd(e); });
  document.addEventListener('pointercancel', function (e) { wkEnd(e, true); });
  document.addEventListener('keydown', function (e) {
    var b = e.target.closest && e.target.closest('.wk-o'); if (!b || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.metaKey || e.ctrlKey || e.altKey || Q.isGuest()) return;
    var t = Q.task(b.getAttribute('data-id')); if (!t || !t.due) return; e.preventDefault(); wkMove(t, D.add(t.due, e.key === 'ArrowLeft' ? -1 : 1));
  });

  OW.routes.home = function (main) {
    var S = store.S, me = Q.user(Q.me()), mine = myOpen(), hr = new Date().getHours();
    var over = mine.filter(function (t) { return bucket(t) === 'over'; }), today = mine.filter(function (t) { return bucket(t) === 'today'; }), week = mine.filter(function (t) { return bucket(t) === 'week'; });
    var queue = P.todayQueue(), est = queue.reduce(function (s, t) { return s + Math.max(0, (t.est || 0) * 60 - Q.logged(t)); }, 0);
    var allMine = Q.tasks('*', true).filter(function (t) { return t.assignees.indexOf(Q.me()) > -1; });
    var sOver = series(function (d) { return allMine.filter(function (t) { return t.due && t.due < d && (!t.doneAt || t.doneAt > dayEnd(d)); }).length; });
    var sToday = series(function (d) { return allMine.filter(function (t) { return t.due === d; }).length; });
    var sDone = series(function (d) { return allMine.filter(function (t) { return t.doneAt && OW.dateUtil.iso(new Date(t.doneAt)) === d; }).length; });
    var sMins = series(function (d) { var m = 0; S.tasks.forEach(function (t) { t.time.forEach(function (l) { if (l.uid === Q.me() && OW.dateUtil.iso(new Date(l.at)) === d) m += l.mins; }); }); return m; });
    var doneWk = sDone.reduce(function (a, b) { return a + b; }, 0), mins = sMins.reduce(function (a, b) { return a + b; }, 0);
    function delta(now, prev, goodUp, unit) { var d = now - prev; if (!d) return '<span class="dl">same as last week</span>'; var good = goodUp ? d > 0 : d < 0; return '<span class="dl ' + (good ? 'up' : 'dn') + '">' + (d > 0 ? '▲ ' : '▼ ') + Math.abs(Math.round(d)) + (unit || '') + ' vs last week</span>'; }
    var att = attention();
    var h = '';
    // the day's headline, from live data (weekday first)
    var waiting = mine.filter(function (t) { return Q.cat(t) === 'review2'; }).length, bits = [];
    if (today.length) bits.push(today.length + ' due today'); if (over.length) bits.push(over.length + ' overdue');
    var head = D.fmt(D.today(), 'long').split(',')[0] + ' · ' + (bits.length ? bits.join(', ') : 'nothing due, nothing overdue') + (waiting ? ' · ' + waiting + ' waiting on a client' : '');
    var sub = D.fmt(D.today(), 'long') + ' · ' + me.name + ' · ' + ((OW.byId(S.workspaces, S.ws) || {}).name || '');
    var act = queue.length ? '<button type="button" class="btn pri" data-act="focus-start">' + I('play', 's') + 'Start my day <kbd class="kbd-on">F</kbd></button>' : '';
    h += weekPanel();
    // now and next
    var run = S.timer && Q.task(S.timer.task), nowT = run || mine.filter(function (t) { return Q.cat(t) === 'active'; }).sort(function (a, b) { return (a.due || '9') < (b.due || '9') ? -1 : 1; })[0];
    var nexts = queue.filter(function (t) { return t !== nowT; }).slice(0, 2);
    h += '<div class="nownext" role="group" aria-label="Now and next">' +
      '<button type="button" class="nn now" data-act="open-task" data-id="' + (nowT ? nowT.id : '') + '"' + (nowT ? '' : ' disabled') + '><small>' + (run ? '<i class="rec"></i>Now · timer running' : 'Now') + '</small><b>' + (nowT ? esc(nowT.title) : 'Nothing in progress') + '</b><span>' + (nowT ? esc(Q.project(nowT.project).name.split(' — ')[0]) + ' · ' + (run ? '<time data-live-timer>' + UI.clock(Date.now() - S.timer.start) + '</time>' : esc(Q.status(nowT).name)) : 'Pick something from the queue') + '</span></button>';
    nexts.forEach(function (t, i) { h += '<button type="button" class="nn" data-act="open-task" data-id="' + t.id + '"><small>' + (i ? 'Then' : 'Next') + '</small><b>' + esc(t.title) + '</b><span>' + esc(Q.project(t.project).name.split(' — ')[0]) + ' · ' + D.rel(t.due) + '</span></button>'; });
    h += '<div class="nn q"><small>Queue</small><b>' + queue.length + ' task' + (queue.length === 1 ? '' : 's') + '</b><span>≈ ' + UI.hm(est) + ' of work left</span></div></div>';
    // KPI tiles that filter
    var tiles = [
      ['over', 'Overdue', over.length, 'bad', spark(sOver, 'bad'), delta(sOver[6], sOver[0], false)],
      ['today', 'Due today', today.length, 'warn', spark(sToday, 'warn'), '<span class="dl">' + (week.length ? week.length + ' more in 7 days' : 'clear after today') + '</span>'],
      ['done', 'Done this week', doneWk, '', spark(sDone, 'ok'), '<span class="dl">' + (doneWk ? 'nice pace' : 'first one today?') + '</span>'],
      ['time', 'Logged this week', UI.hm(mins), '', spark(sMins.map(function (m) { return m / 60; })), '<span class="dl">of ' + (me.cap || 40) + 'h capacity</span>']
    ];
    h += '<div class="tiles" role="group" aria-label="Filter my work">' + tiles.map(function (x) { return '<button type="button" class="tile ' + (x[2] ? x[3] : '') + '" data-act="home-tile" data-k="' + x[0] + '" aria-pressed="' + (home.tile === x[0]) + '"><small>' + x[1] + '</small><span class="tv"><b>' + x[2] + '</b>' + x[4] + '</span>' + x[5] + '</button>'; }).join('') + '</div>';
    h += '<div class="work-grid"><div>';
    // needs you now / filtered list
    if (!home.tile) {
      h += '<div class="wbox"><div class="wbox-h">Needs you now <small>' + att.length + '</small><span class="sp"></span><a class="btn sm ghost" href="#/p/*/list">All my tasks ' + I('arr', 's') + '</a></div>';
      if (!att.length) h += '<div class="empty" style="padding:36px 20px"><div class="art">' + I('check') + '</div><h3>Nothing needs you right now</h3><p>Mentions, reviews, overdue and due-today work will show up here with the reason.</p><button type="button" class="btn" data-act="ask" data-q="what is due this week">See what’s due this week</button></div>';
      att.slice(0, 9).forEach(function (a) {
        var t = a.t, p = Q.project(t.project), k = AKIND[a.kind];
        h += '<div class="nyn" data-tid="' + t.id + '"><span class="nyn-ic" style="--c:' + k[1] + '">' + I(k[0], 's') + '</span><div class="nyn-b"><button type="button" class="t" data-act="open-task" data-id="' + t.id + '">' + esc(t.title) + '</button><span class="nyn-r">' + esc(a.reason) + '</span></div><span class="pj hide-s">' + UI.pdot(p) + esc(p.key) + '</span>' +
          '<button type="button" class="btn sm nyn-go" data-act="att-' + a.act + '" data-id="' + t.id + '">' + a.label + '</button></div>';
      });
      h += '</div>';
    } else {
      var list = home.tile === 'over' ? over : home.tile === 'today' ? today : home.tile === 'done' ? allMine.filter(function (t) { return t.doneAt && Date.now() - t.doneAt < 7 * 864e5; }) : allMine.filter(function (t) { return t.time.some(function (l) { return l.uid === Q.me() && Date.now() - l.at < 7 * 864e5; }); });
      var tl = tiles.filter(function (x) { return x[0] === home.tile; })[0];
      h += '<div class="wbox"><div class="wbox-h">' + tl[1] + ' <small>' + list.length + '</small><span class="sp"></span><button type="button" class="btn sm ghost" data-act="home-tile" data-k="">' + I('x', 's') + 'Clear filter</button></div>';
      if (!list.length) h += '<div class="empty" style="padding:30px 20px"><div class="art">' + I('check') + '</div><h3>Nothing here</h3><p>' + (home.tile === 'over' ? 'Every task you own is on schedule.' : 'Tasks show up here as they happen.') + '</p></div>';
      list.sort(function (a, b) { return (a.due || '') < (b.due || '') ? -1 : 1; }).forEach(function (t) {
        var p = Q.project(t.project), lg = home.tile === 'time' ? t.time.filter(function (l) { return l.uid === Q.me() && Date.now() - l.at < 7 * 864e5; }).reduce(function (s, l) { return s + l.mins; }, 0) : 0;
        h += '<div class="wrow" data-tid="' + t.id + '"><button type="button" class="sbtn" data-act="pick-status" data-id="' + t.id + '" aria-label="Status: ' + esc(Q.status(t).name) + '">' + UI.sdot(Q.status(t)) + '</button><button type="button" class="t" data-act="open-task" data-id="' + t.id + '">' + esc(t.title) + '</button><span class="pj hide-s">' + UI.pdot(p) + esc(p.name.split(' — ')[0]) + '</span>' + (lg ? '<b class="num" style="font-weight:600">' + UI.hm(lg) + '</b>' : UI.prio(t.priority) + UI.due(t)) + '</div>';
      });
      h += '</div>';
    }
    h += '</div><div class="side-col">';
    var qs = S.views.filter(function (v) { return v.queue && (v.shared || v.by === Q.me()); });
    h += '<div class="wbox"><div class="wbox-h">Queues<span class="sp"></span><small>play one to work through it</small></div>';
    h += queueRow({ name: 'Today', owner: Q.me(), due: D.today() }, queue, 'today');
    qs.forEach(function (v) { var st = { filter: Object.assign({ q: '', who: [], pri: [], tags: [], due: '', status: '' }, v.filter) }; var ts = OW.project.filtered(v.project, st); h += queueRow({ name: v.name, owner: v.by, due: v.due, id: v.id, project: v.project }, ts, v.id); });
    h += '</div>';
    var acts = S.activity.slice().sort(function (a, b) { return b.at - a.at; }).filter(function (a) { var t = Q.task(a.task); return t && Q.canSee(t) && a.uid !== Q.me() && Q.projectsVisible().indexOf(Q.project(t.project)) > -1; }).slice(0, 7);
    h += '<div class="wbox"><div class="wbox-h">Activity<span class="sp"></span><a class="btn sm ghost" href="#/inbox">Inbox</a></div><div style="padding:6px 14px 10px">' + (acts.map(function (a) { var t = Q.task(a.task), u = Q.user(a.uid); return '<div class="act"><span class="ad">' + (u ? UI.av(a.uid, 's') : UI.av('bot', 's')) + '</span><span><b>' + esc(u ? u.name.split(' ')[0] : 'Automation') + '</b> ' + esc(a.text) + ' · <button type="button" data-act="open-task" data-id="' + t.id + '" class="lnk">' + esc(t.num) + '</button><time>' + D.ago(a.at) + '</time></span></div>'; }).join('') || '<p class="faint" style="padding:10px 0">Quiet so far today.</p>') + '</div></div>';
    h += '</div></div></div>';
    // the headline lives in the static shell (index.html) and is updated in place, never replaced
    var pg = main.querySelector(':scope > .page'), hd = pg && pg.querySelector('#home-hd');
    if (hd) {
      while (pg.lastChild !== hd) pg.removeChild(pg.lastChild);
      var h1 = hd.querySelector('#home-h1'); if (h1.firstChild && h1.firstChild.nodeType === 3) h1.firstChild.data = head; else h1.textContent = head;
      hd.querySelector('#home-sub').textContent = sub; hd.querySelector('#home-act').innerHTML = act;
      pg.className = 'page home'; pg.insertAdjacentHTML('beforeend', h);
    } else {
      main.innerHTML = '<div class="page home"><div class="home-h" id="home-hd"><div class="home-t"><h1 id="home-h1">' + esc(head) + '</h1><p class="muted" id="home-sub">' + esc(sub) + '</p></div><span class="sp"></span><span id="home-act">' + act + '</span></div>' + h + '</div>';
    }
    if (wk.focus) { var fc = main.querySelector('.wk-chip[data-tid="' + wk.focus + '"] .wk-o'); wk.focus = null; if (fc) fc.focus({ preventScroll: true }); }
  };
  UI.act('att-reply', function (el) { var id = el.getAttribute('data-id'); app.openTask(id); setTimeout(function () { var c = document.getElementById('tp-cmt'); if (c) { c.scrollIntoView({ block: 'center' }); c.focus(); } }, 340); });
  UI.act('att-open', function (el) { app.openTask(el.getAttribute('data-id')); });
  UI.act('att-timer', function (el) { var t = Q.task(el.getAttribute('data-id')); if (store.S.timer && store.S.timer.task === t.id) app.stopTimer(); else app.startTimer(t); });
  UI.act('att-resched', function (el) { var t = Q.task(el.getAttribute('data-id')); UI.pickDate(el, t.due, function (d) { if (!d) return; store.commit(t.num + ' due ' + D.fmt(d), function () { var delta = D.diff(t.due, d); t.due = d; if (t.start) t.start = D.add(t.start, delta); if (t.start > d) t.start = d; store.log(t, 'moved due date to ' + D.fmt(d)); }); }); });
  function queueRow(q, ts, key) {
    var open = ts.filter(function (t) { return !Q.isDone(t); }), done = ts.length - open.length;
    return '<div class="queue"><button type="button" class="play" data-act="queue-play" data-k="' + key + '" aria-label="Play queue ' + esc(q.name) + '"' + (open.length ? '' : ' disabled style="opacity:.4"') + '>' + I('play') + '</button><div class="qi"><b>' + esc(q.name) + '</b><small>' + (q.owner ? esc(Q.user(q.owner).name.split(' ')[0]) + ' · ' : '') + open.length + ' open' + (done ? ' · ' + done + ' done' : '') + (q.due ? ' · due ' + D.rel(q.due) : '') + (q.project && q.project !== '*' ? ' · ' + esc(Q.project(q.project).key) : '') + '</small><div class="meter ok"><i style="width:' + (ts.length ? Math.round(done / ts.length * 100) : 0) + '%"></i></div></div>' + (q.id ? '<a class="ibtn" href="#/p/' + q.project + '/v:' + q.id + '" aria-label="Open ' + esc(q.name) + ' as a list">' + I('list', 's') + '</a>' : '') + '</div>';
  }
  UI.act('home-tile', function (el) { var k = el.getAttribute('data-k'); home.tile = home.tile === k ? '' : k; app.render(); });
  UI.act('focus-start', function () { P.focus(); });
  UI.act('queue-play', function (el) {
    var k = el.getAttribute('data-k');
    if (k === 'today') return P.focus();
    var v = OW.byId(store.S.views, k), st = { filter: Object.assign({ q: '', who: [], pri: [], tags: [], due: '', status: '' }, v.filter) };
    P.focus(OW.project.filtered(v.project, st).filter(function (t) { return !Q.isDone(t); }), v.name);
  });

  /* ---------- focus mode ---------- */
  var F = { el: null };
  P.focus = function (tasks, name) {
    tasks = tasks || P.todayQueue();
    if (!tasks.length) { UI.toast('Nothing in this queue right now', { icon: 'check' }); return; }
    if (!F.el) { F.el = document.createElement('div'); F.el.className = 'focus'; F.el.setAttribute('role', 'dialog'); F.el.setAttribute('aria-modal', 'true'); F.el.setAttribute('aria-label', 'Focus mode'); document.body.appendChild(F.el); F.el.addEventListener('click', fclick); F.el.addEventListener('keydown', fkey); }
    F.q = tasks.map(function (t) { return t.id; }); F.i = 0; F.res = {}; F.name = name || 'Today'; F.t0 = Date.now(); F.prev = document.activeElement;
    F.el.classList.add('on'); fdraw();
  };
  function fdraw() {
    var S = store.S, h = '<div class="fx-top"><span>' + I('focus', 's') + ' Focus · ' + esc(F.name) + '</span><span class="fprog" aria-hidden="true">' + F.q.map(function (id, i) { return '<i class="' + (F.res[id] === 'done' ? 'd' : i === F.i ? 'c' : '') + '"></i>'; }).join('') + '</span><span class="sp"></span>' +
      (F.i < F.q.length ? '<span>Task ' + (F.i + 1) + ' of ' + F.q.length + '</span>' : '') + '<button type="button" data-f="exit">' + I('x', 's') + 'Exit <kbd>Esc</kbd></button></div>';
    if (F.i >= F.q.length) {
      var done = F.q.filter(function (id) { return F.res[id] === 'done'; }).length, skipped = F.q.length - done;
      h += '<div class="fdone"><div style="font-size:42px">' + (done ? '✦' : '·') + '</div><h2>' + (done ? done + ' done' : 'Queue finished') + (skipped ? ', ' + skipped + ' left for later' : '') + '</h2><p>' + UI.hm((Date.now() - F.t0) / 60000) + ' in focus. Leave a closing note so tomorrow starts with context.</p>' +
        '<label class="sr" for="f-note">Closing note</label><textarea id="f-note" placeholder="Where you stopped, what’s blocked, who to chase…"></textarea><button type="button" class="btn pri lg" data-f="note" style="background:var(--accent);color:var(--on-accent);border:0">Save note and finish</button> <button type="button" class="btn lg" data-f="exit" style="background:#1F232A;color:#E6E9EE;border-color:#3A404A">Finish without a note</button></div>';
      F.el.innerHTML = h; setTimeout(function () { var n = F.el.querySelector('#f-note'); if (n) n.focus(); }, 30); return;
    }
    var t = Q.task(F.q[F.i]); if (!t) { F.i++; return fdraw(); }
    var p = Q.project(t.project), last = S.comments.filter(function (c) { return c.task === t.id; }).sort(function (a, b) { return b.at - a.at; })[0], running = S.timer && S.timer.task === t.id;
    var left = Math.max(0, (t.est || 0) * 60 - Q.logged(t));
    h += '<div class="fcard"><div class="fk">' + UI.pdot(p) + esc(t.num) + ' · ' + esc(p.name) + '<span class="ftime">' + (running ? '<span class="rec" style="width:8px;height:8px;border-radius:50%;background:var(--bad);display:inline-block"></span><span data-live-timer>' + UI.clock(Date.now() - S.timer.start) + '</span>' : '') + '</span></div>' +
      '<h2>' + esc(t.title) + '</h2><div class="fmeta"><span>' + UI.sdot(Q.status(t)) + esc(Q.status(t).name) + '</span>' + (t.due ? '<span>' + I('calendar', 's') + (Q.overdue(t) ? '<b style="color:#EE6A62">' + D.rel(t.due) + '</b>' : 'Due ' + D.rel(t.due).toLowerCase()) + '</span>' : '') + '<span>' + UI.prio(t.priority) + UI.PRI[t.priority] + '</span>' + (t.est ? '<span>' + I('clock', 's') + (left ? '≈ ' + UI.hm(left) + ' left' : 'over estimate') + ' · aim ≈ ' + UI.hm(Math.min(left || 30, 90)) + '</span>' : '') + '</div>' +
      (last ? '<div class="fnote"><small>Latest note · ' + esc((Q.user(last.uid) || { name: 'Automation' }).name) + ', ' + D.ago(last.at) + '</small>' + esc(last.text.length > 220 ? last.text.slice(0, 220) + '…' : last.text) + '</div>' : (t.desc ? '<div class="fnote"><small>Brief</small>' + esc(t.desc.slice(0, 220)) + '</div>' : '')) +
      (t.checklist.length ? '<div class="fchk">' + t.checklist.map(function (c) { return '<label><input type="checkbox" class="cb" data-fck="' + c.id + '"' + (c.done ? ' checked' : '') + '>' + esc(c.t) + '</label>'; }).join('') + '</div>' : '') +
      '<div class="fout"><small>How did it go? One tap logs it and moves on</small><div>' + [['approved', '✓', 'Client approved'], ['changes', '↺', 'Changes requested'], ['noreply', '…', 'No reply yet'], ['blocked', '⦸', 'Blocked']].map(function (o) { return '<button type="button" data-o="' + o[0] + '"><span aria-hidden="true">' + o[1] + '</span>' + o[2] + '</button>'; }).join('') + '</div></div>' +
      '<div class="fact"><button type="button" class="btn pri" data-f="done">' + I('check') + 'Mark done · Save & next <kbd style="background:transparent;border-color:rgba(255,255,255,.35);color:inherit;box-shadow:none;margin-left:4px">D</kbd></button>' +
      '<button type="button" class="btn" data-f="timer">' + I(running ? 'pause' : 'play') + (running ? 'Pause' : 'Start timer') + ' <kbd style="background:transparent;border-color:#454B55;color:#B4BAC4;box-shadow:none">T</kbd></button>' +
      '<button type="button" class="btn" data-f="skip">Skip <kbd style="background:transparent;border-color:#454B55;color:#B4BAC4;box-shadow:none">S</kbd></button>' +
      '<button type="button" class="btn" data-f="tomorrow">' + I('calendar', 's') + 'Move to tomorrow</button>' +
      '<button type="button" class="btn" data-f="open">' + I('expand', 's') + 'Open</button></div></div>' +
      '<div class="fhint"><span><kbd>D</kbd> done</span><span><kbd>S</kbd> skip</span><span><kbd>T</kbd> timer</span><span><kbd>Esc</kbd> exit</span></div>';
    F.el.innerHTML = h;
    var b = F.el.querySelector('[data-f=done]'); if (b) b.focus();
  }
  function fnext() { F.i++; fdraw(); }
  function fclick(e) {
    var ck = e.target.closest('[data-fck]');
    if (ck) { var t0 = Q.task(F.q[F.i]), c = OW.byId(t0.checklist, ck.getAttribute('data-fck')); store.commit('Checklist', function () { c.done = ck.checked; }, { quiet: true }); return; }
    var oc = e.target.closest('[data-o]');
    if (oc) {
      var tt = Q.task(F.q[F.i]), pp = Q.project(tt.project), o = oc.getAttribute('data-o');
      var msg = { approved: 'Client approved this.', changes: 'Client asked for changes — back in progress.', noreply: 'No reply yet — nudging again tomorrow.', blocked: 'Blocked — needs someone else before it can move.' }[o];
      store.commit(tt.num + ': ' + msg, function () {
        OW.A.comment(tt, msg, true);
        if (o === 'approved') OW.A.setStatus(tt, Q.doneStatus(pp));
        if (o === 'changes') OW.A.setStatus(tt, Q.statusByCat(pp, 'active') || tt.status);
        if (o === 'noreply') { tt.due = D.add(D.today(), 1); if (tt.start && tt.start > tt.due) tt.start = tt.due; }
        if (o === 'blocked') { var bs = Q.statusByCat(pp, 'blocked'); if (bs) OW.A.setStatus(tt, bs); tt.priority = Math.max(tt.priority, 3); }
      }, { quiet: true });
      UI.toast(esc(tt.num) + ' · ' + esc(msg) + (o === 'noreply' ? ' Due tomorrow.' : ''), { icon: 'check', undo: true });
      F.res[tt.id] = o === 'approved' ? 'done' : o; return fnext();
    }
    var b = e.target.closest('[data-f]'); if (!b) return; var k = b.getAttribute('data-f'), t = Q.task(F.q[F.i]);
    if (k === 'exit') return fexit();
    if (k === 'note') {
      var v = F.el.querySelector('#f-note').value.trim(), target = F.q.map(Q.task).filter(function (x) { return x && !Q.isDone(x); })[0] || Q.task(F.q[F.q.length - 1]);
      if (v && target) { store.commit('Closing note saved', function () { OW.A.comment(target, 'Hand-over note: ' + v, true); }, { quiet: true }); UI.toast('Closing note saved on ' + esc(target.num) + ' — it’ll be the first thing you see tomorrow', { icon: 'msg' }); }
      return fexit();
    }
    if (k === 'done') {
      if (store.S.timer && store.S.timer.task === t.id) app.stopTimer(true);
      var p = Q.project(t.project); store.commit('Done: ' + t.title, function () { OW.A.setStatus(t, Q.doneStatus(p)); }, { quiet: true });
      F.res[t.id] = 'done'; return fnext();
    }
    if (k === 'skip') { F.res[t.id] = 'skip'; return fnext(); }
    if (k === 'tomorrow') { store.commit(t.num + ' moved to tomorrow', function () { var n = D.add(D.today(), 1); if (t.start && t.start > n) t.start = n; t.due = n; if (t.start && t.start > t.due) t.start = t.due; store.log(t, 'moved due date to tomorrow from focus mode'); }, { quiet: true }); F.res[t.id] = 'moved'; UI.toast(esc(t.num) + ' is now due tomorrow', { icon: 'calendar', undo: true }); return fnext(); }
    if (k === 'timer') { if (store.S.timer && store.S.timer.task === t.id) app.stopTimer(); else app.startTimer(t); return fdraw(); }
    if (k === 'open') { fexit(); app.openTask(t.id); }
  }
  function fkey(e) {
    if (e.target.tagName === 'TEXTAREA') { if (e.key === 'Escape') fexit(); return; }
    var map = { d: 'done', D: 'done', s: 'skip', S: 'skip', t: 'timer', T: 'timer', Escape: 'exit' };
    var k = map[e.key]; if (!k) return; e.preventDefault(); var b = F.el.querySelector('[data-f=' + k + ']'); if (b) b.click(); else if (k === 'exit') fexit();
  }
  function fexit() { F.el.classList.remove('on'); app.render(); if (F.prev && document.body.contains(F.prev)) try { F.prev.focus(); } catch (e) { } }

  /* ---------- inbox ---------- */
  var ib = { f: 'all', sel: null };
  var KIND = { mention: ['at', 'mentioned you'], comment: ['msg', 'comment'], assign: ['user', 'assigned'], status: ['target', 'status'], due: ['clock', 'due'], auto: ['bolt', 'automation'], form: ['form', 'form'] };
  OW.routes.inbox = function (main, args) {
    var S = store.S, me = Q.me();
    if (args[0]) ib.sel = args[0];
    var all = S.notifs.filter(function (n) { return n.to === me && !(n.snooze && n.snooze > Date.now()); }).sort(function (a, b) { return b.at - a.at; });
    var list = all.filter(function (n) { return ib.f === 'all' || (ib.f === 'unread' ? !n.read : ib.f === 'assign' ? n.kind === 'assign' : n.kind === 'mention'); });
    var unread = all.filter(function (n) { return !n.read; }).length, snoozed = S.notifs.filter(function (n) { return n.to === me && n.snooze && n.snooze > Date.now(); }).length;
    var sel = ib.sel && OW.byId(S.notifs, ib.sel);
    var h = '<div class="inbox' + (sel ? ' has-sel' : '') + '"><div class="ib-list"><div class="ib-h"><h1>' + I('inbox') + 'Inbox <span class="faint" style="font-size:13px;font-weight:500">' + (unread ? unread + ' unread' : 'all caught up') + '</span></h1><div class="row"><div class="seg" role="group" aria-label="Filter">' +
      [['all', 'All'], ['mention', 'Mentions'], ['assign', 'Assigned'], ['unread', 'Unread']].map(function (f) { return '<button type="button" data-act="ib-f" data-k="' + f[0] + '" aria-pressed="' + (ib.f === f[0]) + '">' + f[1] + '</button>'; }).join('') + '</div><span style="flex:1"></span>' +
      (unread ? '<button type="button" class="btn sm ghost" data-act="ib-all">' + I('check', 's') + 'Mark all read</button>' : '') + '</div></div><div class="ib-items" data-keep="ib">';
    if (!list.length) h += '<div class="empty"><div class="art">' + I('inbox') + '</div><h3>' + (ib.f === 'unread' ? 'You’re all caught up' : 'Nothing here') + '</h3><p>Mentions, assignments, automation results and form submissions land here.' + (snoozed ? ' ' + snoozed + ' snoozed until tomorrow.' : '') + '</p></div>';
    list.forEach(function (n) {
      var t = n.task && Q.task(n.task), u = n.from && Q.user(n.from), k = KIND[n.kind] || KIND.comment;
      h += '<button type="button" class="ni' + (n.read ? '' : ' unread') + '" data-act="ib-open" data-id="' + n.id + '" aria-current="' + (sel && sel.id === n.id) + '">' + (u ? UI.av(n.from, 'l') : '<span class="nic">' + I(k[0]) + '</span>') +
        '<span class="nb"><span class="nt"><b>' + esc(u ? u.name : n.kind === 'auto' ? 'Automation' : n.kind === 'form' ? 'Form' : 'Reminder') + '</b> ' + esc(n.kind === 'due' && t ? t.title + ' ' + n.text : n.text) + '</span><span class="ns">' + I(k[0], 's') + (t ? '<span class="t">' + esc(t.num) + ' · ' + esc(t.title) + '</span>' : '') + '<span>· ' + D.ago(n.at) + '</span></span></span></button>';
    });
    h += '</div></div><div class="ib-detail">';
    if (sel) {
      var t = sel.task && Q.task(sel.task);
      h += '<div class="page narrow" style="padding-top:20px"><button type="button" class="btn sm ghost" data-act="ib-back" style="margin-bottom:12px">' + I('chl', 's') + 'Inbox</button>';
      if (t) {
        var p = Q.project(t.project), cms = S.comments.filter(function (c) { return c.task === t.id; }).sort(function (a, b) { return a.at - b.at; }).slice(-4);
        h += '<div class="eyebrow">' + UI.pdot(p) + esc(p.name) + ' · <span class="mono">' + esc(t.num) + '</span></div><h2 style="font-size:22px;letter-spacing:-.02em;margin-bottom:10px">' + esc(t.title) + '</h2>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:16px">' + UI.pill(t, 'button') + UI.due(t, true) + UI.avs(t.assignees, 4) + '<span style="flex:1"></span><button type="button" class="btn sm" data-act="open-task" data-id="' + t.id + '">' + I('expand', 's') + 'Open task</button>' +
          (Q.isDone(t) ? '' : '<button type="button" class="btn sm" data-act="ib-done" data-id="' + t.id + '">' + I('check', 's') + 'Mark done</button>') + '<button type="button" class="btn sm ghost" data-act="ib-snooze" data-id="' + sel.id + '">' + I('clock', 's') + 'Snooze till tomorrow</button></div>';
        h += '<div class="card" style="padding:4px 16px 14px">' + (cms.length ? cms.map(function (c) { var cu = Q.user(c.uid); return '<div class="cmt">' + (cu ? UI.av(c.uid, 'l') : UI.av('bot', 'l')) + '<div class="cb-body"><div class="ch"><b>' + esc(cu ? cu.name : 'Automation') + '</b>' + (cu && cu.role === 'guest' ? '<span class="tag">Client</span>' : '') + (c.internal ? '<span class="int">Internal</span>' : '') + '<small>' + D.ago(c.at) + '</small></div><div class="ct">' + esc(c.text) + '</div></div></div>'; }).join('') : '<p class="faint" style="padding:14px 0 4px">No comments on this task yet.</p>') +
          '<div class="compose" style="margin-top:8px"><label class="sr" for="ib-r">Reply</label><textarea id="ib-r" placeholder="Reply on ' + esc(t.num) + '…"></textarea><div class="cf"><label><input type="checkbox" class="cb" id="ib-int"> Internal</label><span class="sp"></span><button type="button" class="btn sm pri" data-act="ib-reply" data-id="' + t.id + '">Reply</button></div></div></div>';
      } else {
        h += '<h2 style="font-size:20px;margin-bottom:8px">' + esc(sel.text) + '</h2><p class="muted">From the website brief form. The task was created in the intake project and routed by an automation.</p><a class="btn" style="margin-top:14px" href="#/forms/fm1">' + I('form') + 'Open the form’s submissions</a>';
      }
      h += '</div>';
    } else h += '<div class="empty" style="margin-top:12vh"><div class="art">' + I('inbox') + '</div><h3>Pick a notification</h3><p>Reply, mark done or snooze right here without leaving the inbox. <kbd>J</kbd>/<kbd>K</kbd> to move.</p></div>';
    h += '</div></div>';
    main.innerHTML = h;
    var r = main.querySelector('#ib-r'); if (r) r.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); main.querySelector('[data-act=ib-reply]').click(); } });
    main.querySelector('.ib-items').addEventListener('keydown', function (e) {
      if (e.key !== 'j' && e.key !== 'k' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return; var its = Array.prototype.slice.call(main.querySelectorAll('.ni')), i = its.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault(); var n = its[Math.max(0, Math.min(its.length - 1, i + (e.key === 'j' || e.key === 'ArrowDown' ? 1 : -1)))]; n.focus();
    });
  };
  UI.act('ib-f', function (el) { ib.f = el.getAttribute('data-k'); app.render(); });
  UI.act('ib-open', function (el) { var n = OW.byId(store.S.notifs, el.getAttribute('data-id')); ib.sel = n.id; if (!n.read) store.commit('Read', function () { n.read = true; }, { quiet: true, noUndo: true }); else app.render(); setTimeout(function () { var x = document.querySelector('.ni[data-id="' + n.id + '"]'); if (x && innerWidth > 860) x.focus(); }, 20); });
  UI.act('ib-back', function () { ib.sel = null; app.render(); });
  UI.act('ib-all', function () { store.commit('Marked all as read', function (S) { S.notifs.forEach(function (n) { if (n.to === Q.me()) n.read = true; }); }); });
  UI.act('ib-snooze', function (el) { var n = OW.byId(store.S.notifs, el.getAttribute('data-id')); store.commit('Snoozed until tomorrow', function () { var d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); n.snooze = d.getTime(); n.read = true; }); ib.sel = null; });
  UI.act('ib-done', function (el) { var t = Q.task(el.getAttribute('data-id')); store.commit('Done: ' + t.title, function () { OW.A.setStatus(t, Q.doneStatus(Q.project(t.project))); }); });
  UI.act('ib-reply', function (el) {
    var t = Q.task(el.getAttribute('data-id')), ta = document.getElementById('ib-r'), v = ta.value.trim();
    if (!v) { ta.focus(); UI.toast('Write a reply first'); return; }
    var res = store.commit('Replied on ' + t.num, function () { return OW.A.comment(t, v, document.getElementById('ib-int').checked); });
    (res && res.mentioned || []).forEach(function (u) { if (u !== Q.me()) OW.sim.reply(u, t.id, v); });
  });
})();
