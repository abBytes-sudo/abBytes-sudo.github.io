/* Lumen CRM Pro — Tasks: the screen a sales team lives in.
   Summary strip · grouped list (Overdue / Today / Tomorrow / This week / Later / No date / Done today) · rich rows with
   hover actions (complete, snooze, reassign, open) · List, Board and Calendar views · filters, saved views, bulk actions
   with undo · keyboard (j k x s a Enter) · swipe on phones · and the Call queue: a focused mode that walks through
   today's calls and WhatsApps, logs the outcome to the record, creates the follow-up and applies stage gates. */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$, V = C.views, page = C.page;
  var P = function () { return C.P(); }, T = function () { return C.S().tasks; };
  var H = 36e5, D = 864e5;
  var TYPES = { call: ['Call', 'phone'], wa: ['WhatsApp', 'wa'], email: ['Email', 'mail'], visit: ['Site visit', 'pin'], todo: ['To-do', 'tasks'] };
  var PRIO = ['Urgent', 'High', 'Normal', 'Low'];

  function guessType(t) { var x = (t.text || '').toLowerCase(); return /whatsapp|\bwa\b/.test(x) ? 'wa' : /\bcall|ring|phone/.test(x) ? 'call' : /email|send .*(pdf|quote|form)|share .*(schedule|drawing)/.test(x) ? 'email' : /visit|site|measure/.test(x) ? 'visit' : 'todo'; }
  // seed: every task gets a type and priority; a realistic day of calls and WhatsApps; a few days of completions (streak)
  C.seeders.push(function (p, S) {
    if (p.tk2) return; p.tk2 = 1;
    var now = Date.now(), td = new Date(); td.setHours(0, 0, 0, 0); var t0 = td.getTime(), R = C.rng(91);
    S.tasks.forEach(function (t) { if (!t.type) t.type = guessType(t); if (!t.prio) t.prio = /urgent|asap/i.test(t.text) ? 'Urgent' : R() < .22 ? 'High' : 'Normal'; });
    var add = function (o) { S.tasks.push(Object.assign({ id: 'T-Q' + (700 + S.tasks.length), done: false, doneAt: null, remind: null, reminded: false, prio: 'Normal' }, o)); };
    var leads = S.leads.filter(function (l) { return l.status === 'new' || l.status === 'contacted'; }).slice(0, 7);
    leads.forEach(function (l, i) { add({ leadId: l.id, ref: null, type: i % 3 === 2 ? 'wa' : 'call', text: (i % 3 === 2 ? 'WhatsApp ' : 'Call ') + l.name.split(' ')[0] + ' — ' + (l.status === 'new' ? 'first reply on ' + l.service.toLowerCase() : 'confirm a site-visit slot'), due: t0 + (9.5 + i * 1.1) * H, owner: l.owner, prio: l.budget >= 10 ? 'High' : 'Normal' }); });
    p.deals.filter(function (d) { return C.dealOpen(d) && d.pipe === 'sales' && ['proposal', 'negotiation', 'design'].indexOf(d.stage) > -1; }).slice(0, 5).forEach(function (d, i) {
      var c = C.contact(d.c); add({ leadId: null, ref: { t: 'deal', id: d.id }, type: i % 2 ? 'wa' : 'call', text: (i % 2 ? 'WhatsApp ' : 'Call ') + (c ? c.name.replace(/^(Mr|Dr)\. /, '').split(' ')[0] : 'the client') + ' — ' + (d.stage === 'negotiation' ? 'close the discount question' : d.stage === 'proposal' ? 'walk through the quote' : 'moodboard feedback'), due: t0 + (11 + i * 1.6) * H, owner: d.owner, prio: d.stage === 'negotiation' ? 'Urgent' : 'High' });
    });
    for (var k = 1; k <= 3; k++) for (var j = 0; j < 3 + k; j++) add({ leadId: null, ref: { t: 'deal', id: p.deals[(j * 3 + k) % p.deals.length].id }, type: j % 2 ? 'email' : 'call', text: ['Send revised layout', 'Check-in call', 'Share fabric swatches', 'Confirm delivery window'][j % 4], due: t0 - k * D + 11 * H, owner: C.TEAM[j % 4], done: true, doneAt: t0 - k * D + (12 + j) * H });
    [0, 1, 2].forEach(function (j) { add({ leadId: null, ref: { t: 'deal', id: p.deals[j + 4].id }, type: 'call', text: ['Morning check-in with site supervisor', 'Confirm carpenter visit', 'Approve tile swatches'][j], due: t0 + (8.5 + j * .5) * H, owner: C.me().name, done: true, doneAt: Math.min(now - (3 - j) * 20 * 6e4, t0 + (9 + j) * H) }); });
    p.taskViews = [{ id: 'tv1', name: 'My calls today', f: { scope: 'mine', type: 'call' } }, { id: 'tv2', name: 'Urgent and high', f: { prio: 'hi' } }, { id: 'tv3', name: 'Deals only', f: { rel: 'deal' } }];
  });

  // ---- helpers ---------------------------------------------------------------------------------------------------------
  function U() { return C.ui.tk2 || (C.ui.tk2 = { scope: C.perm('scope') === 'own' ? 'mine' : 'team', type: 'all', prio: 'all', rel: 'all', q: '', view: 'list', board: 'due', sv: '', showDone: false, wk: 0, sel: {} }); }
  function sod(t) { var d = new Date(t == null ? Date.now() : t); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function eow() { var d = new Date(sod()), w = (d.getDay() + 6) % 7; d.setDate(d.getDate() + (6 - w) + 1); return d.getTime(); }
  function bucket(t) { if (t.done) return 'done'; if (t.due == null) return 'none'; var a = sod(); return t.due < a ? 'over' : t.due < a + D ? 'today' : t.due < a + 2 * D ? 'tom' : t.due < eow() ? 'week' : 'later'; }
  var BK = [['over', 'Overdue'], ['today', 'Today'], ['tom', 'Tomorrow'], ['week', 'This week'], ['later', 'Later'], ['none', 'No date']];
  function hm(t) { return C.tm(t).replace(':00', ''); }
  function dueChip(t) {
    if (t.done) return '<span class="due done">Done ' + C.rel(t.doneAt || Date.now()) + '</span>';
    if (t.due == null) return '<span class="due">No date</span>';
    var n = Date.now(), d = t.due - n, a = sod();
    if (d < 0) { var late = -d; if (t.due >= a) return '<span class="due late-a">' + (late < H ? Math.max(1, Math.round(late / 6e4)) + ' min late' : Math.round(late / H) + ' h late') + '</span>'; var days = Math.max(1, Math.round((a - sod(t.due)) / D)); return '<span class="due late-r">' + days + (days === 1 ? ' day' : ' days') + ' late</span>'; }
    if (t.due < a + D) return '<span class="due soon">' + (d < H ? 'in ' + Math.max(1, Math.round(d / 6e4)) + ' min' : d < 6 * H ? 'in ' + Math.round(d / H) + ' h' : 'today ' + hm(t.due)) + '</span>';
    if (t.due < a + 2 * D) return '<span class="due">tomorrow ' + hm(t.due) + '</span>';
    return '<span class="due">' + new Date(t.due).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + '</span>';
  }
  function recOf(t) {
    if (t.leadId) { var l = C.lead(t.leadId); return l ? { kind: 'lead', rec: l, name: l.name, phone: l.phone, href: '#/tasks/' + l.id } : null; }
    if (!t.ref) return null; var o = C.recOf(t.ref.t, t.ref.id); if (!o) return null;
    var c = t.ref.t === 'deal' ? C.contact(o.c) : t.ref.t === 'contact' ? o : null;
    return { kind: t.ref.t, rec: o, name: o.name, phone: c ? c.phone : '', contact: c, href: C.refHref(t.ref) };
  }
  function recChip(t) {
    var r = recOf(t); if (!r) return '';
    if (r.kind === 'lead') return '<span class="ochip">' + C.avatar(r.name, 18) + esc(r.name) + '</span>' + C.pill(r.rec.status) + '<span class="mono muted sm">' + C.money(r.rec.budget) + '</span>';
    if (r.kind === 'deal') { var s = C.pstage(r.rec.pipe, r.rec.stage); return '<span class="ochip">' + (r.rec.co ? C.logo(C.company(r.rec.co).name, 18) : C.avatar((r.contact || r.rec).name, 18)) + esc(r.rec.name.split(' — ').pop()) + '</span><span class="pill" style="--c:' + s.color + '"><i style="background:' + s.color + '"></i>' + esc(s.label) + '</span><span class="mono muted sm">' + C.rs(C.dealVal(r.rec)) + '</span>'; }
    return '<span class="ochip">' + (r.kind === 'company' ? C.logo(r.name, 18) : C.avatar(r.name, 18)) + esc(r.name) + '</span>';
  }
  function visible(t) { return C.visibleOwner(t.owner); }
  function filtered() {
    var u = U(), me = C.me().name, q = u.q.toLowerCase();
    return T().filter(function (t) {
      if (!visible(t)) return false;
      if (u.scope === 'mine' && t.owner !== me) return false; if (u.scope !== 'mine' && u.scope !== 'team' && t.owner !== u.scope) return false;
      var ty = t.type || guessType(t); if (u.type !== 'all' && ty !== u.type) return false;
      var pr = t.prio || 'Normal'; if (u.prio === 'hi' && pr !== 'Urgent' && pr !== 'High') return false; if (u.prio !== 'all' && u.prio !== 'hi' && pr !== u.prio) return false;
      var rk = t.leadId ? 'lead' : t.ref ? t.ref.t : 'none'; if (u.rel !== 'all' && rk !== u.rel) return false;
      if (q) { var r = recOf(t); if ((t.text + ' ' + (r ? r.name : '')).toLowerCase().indexOf(q) < 0) return false; }
      return true;
    });
  }
  function find(id) { return T().filter(function (t) { return t.id === id; })[0]; }
  function actRef(t) { var r = recOf(t); if (!r) return null; if (r.kind === 'deal') return { c: r.rec.c, co: r.rec.co, d: r.rec.id }; if (r.kind === 'contact') return { c: r.rec.id, co: r.rec.co }; if (r.kind === 'company') return { co: r.rec.id }; return null; }
  function logTo(t, type, text) { var r = recOf(t); if (!r) return; if (r.kind === 'lead') C.log(r.rec, type === 'wa' ? 'msg' : type, text); else C.pact(type, text, actRef(t), C.me().name); }
  function auditRef(t) { var r = recOf(t); return r ? (r.kind === 'lead' ? { t: 'lead', id: r.rec.id, name: r.name } : C.refOf(r.kind, r.rec)) : null; }

  // ---- complete / snooze / reassign (optimistic, with undo) ---------------------------------------------------------------
  function complete(ids, outcome) {
    var L = ids.map(find).filter(function (t) { return t && !t.done && C.can('edit', t); }); if (!L.length) return;
    var snap = L.map(function (t) { return [t, t.done, t.doneAt]; });
    L.forEach(function (t) { t.done = true; t.doneAt = Date.now(); logTo(t, 'task', 'Completed: ' + t.text + (outcome ? ' · ' + outcome : '')); C.audit('update', auditRef(t), 'Task completed', '', t.text); });
    C.save(); C.badges();
    animateOut(L.map(function (t) { return t.id; }), function () { C.rerender(); });
    C.toast(L.length === 1 ? 'Done: ' + L[0].text : L.length + ' tasks completed', { icon: 'check', undo: function () { snap.forEach(function (x) { x[0].done = x[1]; x[0].doneAt = x[2]; }); C.save(); C.badges(); C.rerender(); } });
  }
  function animateOut(ids, done) {
    var rows = ids.map(function (id) { return $('[data-task="' + id + '"]'); }).filter(Boolean);
    if (!rows.length || !C.motion()) { done(); return; }
    rows.forEach(function (r) { r.classList.add('completing'); });
    setTimeout(function () { rows.forEach(function (r) { r.style.height = r.offsetHeight + 'px'; r.offsetHeight; r.classList.add('collapse'); }); setTimeout(done, 240); }, 360);
  }
  var SNZ = [['1h', '1 hour', function () { return Date.now() + H; }], ['tom', 'Tomorrow, 10 am', function () { return sod() + D + 10 * H; }], ['mon', 'Next Monday, 10 am', function () { var d = new Date(sod()); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return d.getTime() + 10 * H; }]];
  function snooze(ids, due, label) {
    var L = ids.map(find).filter(function (t) { return t && !t.done && C.can('edit', t); }); if (!L.length) return;
    var snap = L.map(function (t) { return [t, t.due, t.reminded]; });
    L.forEach(function (t) { C.audit('update', auditRef(t), 'Task due', t.due ? C.dt(t.due) : '', C.dt(due)); t.due = due; t.reminded = false; });
    C.save(); C.badges(); animateOut(L.map(function (t) { return t.id; }), function () { C.rerender(); });
    C.toast((L.length === 1 ? 'Snoozed' : L.length + ' tasks snoozed') + ' to ' + label.toLowerCase(), { icon: 'clock', undo: function () { snap.forEach(function (x) { x[0].due = x[1]; x[0].reminded = x[2]; }); C.save(); C.badges(); C.rerender(); } });
  }
  function reassign(ids, who) {
    var L = ids.map(find).filter(function (t) { return t && C.can('edit', t); }); if (!L.length) return;
    var snap = L.map(function (t) { return [t, t.owner]; });
    L.forEach(function (t) { C.audit('assign', auditRef(t), 'Task owner', t.owner, who); t.owner = who; });
    if (who !== C.me().name) C.notify(C.me().name.split(' ')[0] + ' assigned you ' + (L.length === 1 ? 'the task “' + L[0].text + '”' : L.length + ' tasks'), '#/tasks', 'tasks', who);
    C.save(); C.badges(); C.rerender();
    C.toast((L.length === 1 ? 'Task' : L.length + ' tasks') + ' assigned to ' + who.split(' ')[0], { icon: 'user', undo: function () { snap.forEach(function (x) { x[0].owner = x[1]; }); C.save(); C.badges(); C.rerender(); } });
  }

  // ---- menus (fixed position, never clipped) ---------------------------------------------------------------------------------
  var menuFor = null;
  function closeMenu() { var m = $('#tmenu'); if (m) m.remove(); menuFor = null; }
  function openMenu(anchor, html, ids) {
    closeMenu(); var r = anchor.getBoundingClientRect(), m = document.createElement('div'); m.id = 'tmenu'; m.className = 'tmenu'; m.setAttribute('role', 'menu'); m.innerHTML = html; document.body.appendChild(m);
    var w = m.offsetWidth, h = m.offsetHeight; m.style.left = Math.max(8, Math.min(r.right - w, innerWidth - w - 8)) + 'px'; m.style.top = (r.bottom + h + 8 > innerHeight ? Math.max(8, r.top - h - 6) : r.bottom + 6) + 'px';
    menuFor = { ids: ids, anchor: anchor }; var f = m.querySelector('button,input'); if (f) f.focus();
  }
  document.addEventListener('click', function (e) { if ($('#tmenu') && !e.target.closest('#tmenu,[data-act^="tk-m-"],[data-act="tk-done"]')) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#tmenu')) { e.stopPropagation(); var a = menuFor && menuFor.anchor; closeMenu(); if (a && document.contains(a)) a.focus(); } }, true);
  function idsOf(el) { return el.dataset.ids ? el.dataset.ids.split(',') : [el.dataset.id]; }
  C.acts['tk-m-snooze'] = function (el) { var ids = idsOf(el); openMenu(el, '<div class="tm-h">Snooze until</div>' + SNZ.map(function (s, i) { return '<button type="button" role="menuitem" data-act="tk-snz" data-k="' + s[0] + '">' + C.ic('clock', 14) + s[1] + '<kbd>' + (i + 1) + '</kbd></button>'; }).join('') + '<label class="tm-date">' + C.ic('cal', 14) + '<span>Pick a date</span><input type="date" data-ch="tk-snz-date" min="' + new Date().toISOString().slice(0, 10) + '" aria-label="Snooze to a date"></label>', ids); };
  C.acts['tk-snz'] = function (el) { var s = SNZ.filter(function (x) { return x[0] === el.dataset.k; })[0], ids = menuFor.ids; closeMenu(); snooze(ids, s[2](), s[1]); };
  C.chs['tk-snz-date'] = function (el) { if (!el.value) return; var ids = menuFor.ids, t = new Date(el.value + 'T10:00').getTime(); closeMenu(); snooze(ids, t, new Date(t).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }) + ', 10 am'); };
  C.acts['tk-m-assign'] = function (el) { var ids = idsOf(el); openMenu(el, '<div class="tm-h">Assign to</div>' + P().users.map(function (u) { return '<button type="button" role="menuitem" data-act="tk-asg" data-name="' + esc(u.name) + '">' + C.avatar(u.name, 20) + esc(u.name) + '<small>' + C.ROLE_LABEL[u.role] + '</small></button>'; }).join(''), ids); };
  C.acts['tk-asg'] = function (el) { var ids = menuFor.ids; closeMenu(); reassign(ids, el.dataset.name); };
  C.acts['tk-done'] = function (el) {
    var t = find(el.dataset.id); if (!t) return; if (!C.can('edit', t)) { C.deny('complete tasks owned by others'); return; }
    if (t.done) { t.done = false; t.doneAt = null; C.save(); C.badges(); C.rerender(); C.toast('Task re-opened', { icon: 'refresh' }); return; }
    if ((t.type || guessType(t)) === 'call') { openMenu(el, '<div class="tm-h">How did the call go?</div>' + OUT.map(function (o, i) { return '<button type="button" role="menuitem" data-act="tk-out" data-i="' + i + '">' + C.ic(o[2], 14) + o[0] + '<kbd>' + (i + 1) + '</kbd></button>'; }).join(''), [t.id]); return; }
    complete([t.id]);
  };
  C.acts['tk-out'] = function (el) { var t = find(menuFor.ids[0]), o = OUT[+el.dataset.i]; closeMenu(); logTo(t, 'call', o[0] + ' — ' + t.text); C.save(); complete([t.id], o[0]); };
  C.acts['tk-open'] = function (el) { var t = find(el.dataset.id), r = t && recOf(t); if (!r) return; if (r.kind === 'lead') { location.hash = '#/tasks/' + r.rec.id; return; } if (C.peek) C.peek(r.kind, r.rec.id, el); else location.hash = r.href; };
  document.addEventListener('keydown', function (e) { var m = $('#tmenu'); if (!m || !/^[1-8]$/.test(e.key)) return; var b = $$('button[role=menuitem]', m)[+e.key - 1]; if (b) { e.preventDefault(); b.click(); } });

  // ---- rows ---------------------------------------------------------------------------------------------------------------------------
  function row(t) {
    var ty = t.type || guessType(t), u = U(), sel = !!u.sel[t.id], canE = C.can('edit', t), pr = t.prio || 'Normal';
    return '<li class="trow' + (t.done ? ' done' : '') + (sel ? ' sel' : '') + '" data-task="' + t.id + '" tabindex="0" aria-label="' + esc(TYPES[ty][0] + ': ' + t.text) + '">' +
      '<span class="tsel"><input type="checkbox" data-ch="tk-sel" data-id="' + t.id + '"' + (sel ? ' checked' : '') + ' aria-label="Select ' + esc(t.text) + '"></span>' +
      '<button type="button" class="tchk" data-act="tk-done" data-id="' + t.id + '" aria-label="' + (t.done ? 'Re-open' : 'Complete') + ' ' + esc(t.text) + '"' + (canE ? '' : ' disabled') + '><svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><circle cx="10" cy="10" r="8.25"/><path d="m6.2 10.4 2.5 2.5 5.2-5.6"/></svg></button>' +
      '<span class="tty t-' + ty + '" title="' + TYPES[ty][0] + '">' + C.ic(TYPES[ty][1], 14) + '</span>' +
      '<span class="tmain"><span class="ttxt">' + (pr === 'Urgent' || pr === 'High' ? '<span class="tflag p-' + pr.toLowerCase() + '" title="' + pr + ' priority">' + C.ic('flag', 12) + '</span>' : '') + esc(t.text) + '</span><span class="trec">' + recChip(t) + '</span></span>' +
      '<span class="tmeta">' + dueChip(t) + '<span class="tav" title="' + esc(t.owner) + '">' + C.avatar(t.owner, 22) + '</span></span>' +
      '<span class="rowact">' + (t.done ? '' : '<button type="button" class="ibtn" data-act="tk-m-snooze" data-id="' + t.id + '" aria-label="Snooze" title="Snooze (S)">' + C.ic('clock', 15) + '</button><button type="button" class="ibtn" data-act="tk-m-assign" data-id="' + t.id + '" aria-label="Reassign" title="Assign (A)">' + C.ic('user', 15) + '</button>') + '<button type="button" class="ibtn" data-act="tk-open" data-id="' + t.id + '" aria-label="Open record" title="Open (Enter)">' + C.ic('ext', 15) + '</button></span>' +
      '<span class="swipe-ok" aria-hidden="true">' + C.ic('check', 18) + 'Done</span><span class="swipe-snz" aria-hidden="true">Snooze' + C.ic('clock', 18) + '</span></li>';
  }
  function groups(L) {
    var u = U(), out = '', anyOpen = false;
    BK.forEach(function (b) {
      var G = L.filter(function (t) { return bucket(t) === b[0]; }).sort(function (x, y) { return (x.due || 0) - (y.due || 0) || PRIO.indexOf(x.prio || 'Normal') - PRIO.indexOf(y.prio || 'Normal'); });
      if (b[0] === 'today' && !G.length) { out += '<section class="tgrp" aria-label="Today"><h2 class="tg-h"><span>Today</span><span class="count-b">0</span></h2><div class="empty-st zero">' + C.ic('check', 22) + '<b>Inbox zero for today</b><span>Everything due today is done. Pull tomorrow’s work forward, or take the evening off.</span></div></section>'; return; }
      if (!G.length) return; anyOpen = true;
      out += '<section class="tgrp g-' + b[0] + '" aria-label="' + b[1] + '"><h2 class="tg-h"><span>' + b[1] + '</span><span class="count-b">' + G.length + '</span>' + (b[0] === 'over' ? '<button type="button" class="lnk sm" data-act="tk-m-snooze" data-ids="' + G.map(function (t) { return t.id; }).join(',') + '">' + C.ic('clock', 12) + ' Snooze all</button>' : '') + '</h2><ul class="tlist">' + G.map(row).join('') + '</ul></section>';
    });
    var done = L.filter(function (t) { return t.done && t.doneAt >= sod(); }).sort(function (a, b) { return b.doneAt - a.doneAt; });
    if (done.length) out += '<section class="tgrp g-done"><h2 class="tg-h"><button type="button" class="tg-tog" data-act="tk-done-tog" aria-expanded="' + u.showDone + '">' + C.ic(u.showDone ? 'chev-d' : 'chev-r', 14) + 'Done today</button><span class="count-b">' + done.length + '</span></h2>' + (u.showDone ? '<ul class="tlist">' + done.map(row).join('') + '</ul>' : '') + '</section>';
    return out || '<div class="empty-st">' + C.ic('tasks', 22) + '<b>No tasks match these filters</b><span>Clear the filters, or add a task from any record’s Tasks panel.</span><button type="button" class="btn" data-act="tk-clear">Clear filters</button></div>';
  }
  C.acts['tk-done-tog'] = function () { U().showDone = !U().showDone; C.rerender(); var b = $('[data-act="tk-done-tog"]'); if (b) b.focus(); };
  C.acts['tk-clear'] = function () { C.ui.tk2 = null; C.rerender(); };

  // ---- board + calendar ----------------------------------------------------------------------------------------------------------------
  function board(L) {
    var u = U(), cols = u.board === 'status' ? [['open', 'To do'], ['done', 'Done today']] : BK.filter(function (b) { return b[0] !== 'none'; });
    return '<div class="tboard">' + cols.map(function (c) {
      var G = L.filter(function (t) { return u.board === 'status' ? (c[0] === 'done' ? t.done && t.doneAt >= sod() : !t.done) : bucket(t) === c[0]; }).sort(function (a, b) { return (a.due || 0) - (b.due || 0); });
      return '<section class="tcol" data-col="' + c[0] + '" aria-label="' + c[1] + '"><h2 class="tg-h"><span>' + c[1] + '</span><span class="count-b">' + G.length + '</span></h2><ul class="tcards">' + G.map(function (t) { var ty = t.type || guessType(t); return '<li class="tcard' + (t.done ? ' done' : '') + '" data-task="' + t.id + '" draggable="' + (!t.done && u.board === 'due') + '" tabindex="0"><div class="tc-top"><span class="tty t-' + ty + '">' + C.ic(TYPES[ty][1], 13) + '</span><span class="ttxt">' + esc(t.text) + '</span></div><div class="trec">' + recChip(t) + '</div><div class="tc-f">' + dueChip(t) + C.avatar(t.owner, 20) + '</div></li>'; }).join('') + (G.length ? '' : '<li class="kempty">' + (u.board === 'due' ? 'Drop a task here to reschedule' : 'Nothing here') + '</li>') + '</ul></section>';
    }).join('') + '</div>';
  }
  var DROPDUE = { over: function (t) { return t.due; }, today: function () { return Math.max(Date.now() + H, sod() + 18 * H); }, tom: function () { return sod() + D + 10 * H; }, week: function () { return Math.min(eow() - D + 10 * H, sod() + 3 * D + 10 * H); }, later: function () { return eow() + D + 10 * H; } };
  var dragId = null;
  document.addEventListener('dragstart', function (e) { var c = e.target.closest && e.target.closest('.tcard[draggable=true]'); if (!c) return; dragId = c.dataset.task; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (x) { } c.classList.add('lifted'); });
  document.addEventListener('dragend', function () { dragId = null; $$('.tcard.lifted,.tcol.over').forEach(function (x) { x.classList.remove('lifted', 'over'); }); });
  document.addEventListener('dragover', function (e) { var col = dragId && e.target.closest && e.target.closest('.tcol'); if (!col) return; e.preventDefault(); $$('.tcol.over').forEach(function (x) { if (x !== col) x.classList.remove('over'); }); col.classList.add('over'); });
  document.addEventListener('drop', function (e) { var col = dragId && e.target.closest && e.target.closest('.tcol'); if (!col) return; e.preventDefault(); var k = col.dataset.col, t = find(dragId); if (!t || bucket(t) === k || k === 'over') return; var nd = DROPDUE[k](t); snooze([t.id], nd, BK.filter(function (b) { return b[0] === k; })[0][1] + ' (' + hm(nd) + ')'); });
  function calendar(L) {
    var u = U(), d0 = new Date(sod()); d0.setDate(d0.getDate() - ((d0.getDay() + 6) % 7) + u.wk * 7); var days = [];
    for (var i = 0; i < 7; i++) { var a = d0.getTime() + i * D; days.push({ a: a, L: L.filter(function (t) { return t.due >= a && t.due < a + D; }).sort(function (x, y) { return x.due - y.due; }) }); }
    return '<div class="tcal-h"><button type="button" class="ibtn" data-act="tk-wk" data-d="-1" aria-label="Previous week">' + C.ic('chev-l', 16) + '</button><b>' + new Date(days[0].a).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' – ' + new Date(days[6].a).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + '</b><button type="button" class="ibtn" data-act="tk-wk" data-d="1" aria-label="Next week">' + C.ic('chev-r', 16) + '</button>' + (u.wk ? '<button type="button" class="btn sm" data-act="tk-wk" data-d="0">This week</button>' : '') + '</div><div class="tcal">' + days.map(function (d) {
      var today = d.a === sod();
      return '<section class="tday' + (today ? ' today' : '') + '"><h2 class="tday-h"><span>' + new Date(d.a).toLocaleDateString('en-GB', { weekday: 'short' }) + '</span><b>' + new Date(d.a).getDate() + '</b></h2><ul>' + d.L.map(function (t) { var ty = t.type || guessType(t); return '<li class="tcc t-' + ty + (t.done ? ' done' : '') + '" data-task="' + t.id + '" tabindex="0"><time>' + hm(t.due) + '</time>' + esc(t.text) + '</li>'; }).join('') + '</ul></section>';
    }).join('') + '</div>';
  }
  C.acts['tk-wk'] = function (el) { var u = U(); u.wk = +el.dataset.d === 0 ? 0 : u.wk + +el.dataset.d; C.rerender(); };

  // ---- the page ----------------------------------------------------------------------------------------------------------------------------
  function strip() {
    var vis = T().filter(visible), me = C.me().name, u = U(), mine = u.scope === 'mine' ? vis.filter(function (t) { return t.owner === me; }) : vis;
    var over = mine.filter(function (t) { return bucket(t) === 'over'; }), today = mine.filter(function (t) { return bucket(t) === 'today'; }), done = mine.filter(function (t) { return t.done && t.doneAt >= sod(); });
    var by = {}; over.forEach(function (t) { by[t.owner] = (by[t.owner] || 0) + 1; });
    var streak = 0; for (var k = 0; k < 30; k++) { var a = sod() - k * D; if (mine.some(function (t) { return t.done && t.doneAt >= a && t.doneAt < a + D; })) streak++; else if (k) break; }
    var sla = C.S().leads.filter(function (l) { return l.resp == null && l.status === 'new' && C.visibleLead(l) && C.sla(l).state !== 'ok'; }).length;
    var q = queue().length;
    return '<div class="tstrip">' +
      '<div class="ts ts-over" tabindex="0"><span>Overdue</span><b>' + over.length + '</b>' + (over.length ? '<div class="ts-break" role="tooltip"><b>Overdue by owner</b>' + Object.keys(by).sort(function (a, b) { return by[b] - by[a]; }).map(function (n) { return '<span>' + C.avatar(n, 18) + esc(n) + '<i>' + by[n] + '</i></span>'; }).join('') + '</div>' : '') + '</div>' +
      '<div class="ts"><span>Due today</span><b>' + today.length + '</b></div>' +
      '<div class="ts"><span>Done today</span><b>' + done.length + '</b><small class="streak">' + (streak > 1 ? C.ic('bolt', 12) + streak + '-day streak' : 'keep going') + '</small></div>' +
      '<a class="ts ts-sla" href="#/routing"><span>SLA at risk</span><b>' + sla + '</b><small>leads waiting on a first reply</small></a>' +
      '<div class="ts-cta"><button type="button" class="btn pri lg" data-act="cq-start"' + (q ? '' : ' disabled') + '>' + C.ic('phone', 16) + 'Start call queue<span class="cq-n">' + q + '</span></button><small class="muted">Today’s calls and WhatsApps, one at a time</small></div></div>';
  }
  function views() {
    var u = U(), V0 = P().taskViews || [];
    return '<div class="vtabs" role="group" aria-label="Saved views"><button type="button" class="vtab' + (!u.sv ? ' on' : '') + '" data-act="tv-pick" data-id="" aria-pressed="' + !u.sv + '">All tasks</button>' + V0.map(function (v) { return '<span class="vt"><button type="button" class="vtab' + (u.sv === v.id ? ' on' : '') + '" data-act="tv-pick" data-id="' + v.id + '" aria-pressed="' + (u.sv === v.id) + '">' + esc(v.name) + '</button><button type="button" class="vx" data-act="tv-del" data-id="' + v.id + '" aria-label="Delete saved view ' + esc(v.name) + '">' + C.ic('x', 11) + '</button></span>'; }).join('') + '<button type="button" class="vtab save" data-act="tv-save">' + C.ic('plus', 12) + ' Save view</button></div>';
  }
  function toolbar() {
    var u = U(), opt = function (v, t, c) { return '<option value="' + esc(v) + '"' + (v === c ? ' selected' : '') + '>' + esc(t) + '</option>'; };
    return '<div class="ttool" role="search"><div class="seg" role="group" aria-label="Whose tasks"><button type="button" data-act="tk-scope" data-v="mine" aria-pressed="' + (u.scope === 'mine') + '">My tasks</button><button type="button" data-act="tk-scope" data-v="team" aria-pressed="' + (u.scope === 'team') + '">Team</button></div>' +
      '<label class="sr" for="tk-person">Person</label><select id="tk-person" class="sel sm" data-ch="tk-f" data-f="scope">' + opt('', 'Person…', u.scope === 'mine' || u.scope === 'team' ? '' : u.scope) + P().users.filter(function (x) { return C.visibleOwner(x.name); }).map(function (x) { return opt(x.name, x.name, u.scope); }).join('') + '</select>' +
      '<div class="sfield sm">' + C.ic('search', 14) + '<label class="sr" for="tk-q">Search tasks</label><input id="tk-q" type="search" data-in="tk-q" value="' + esc(u.q) + '" placeholder="Search tasks or records…" autocomplete="off"></div>' +
      '<label class="sr" for="tk-ty">Type</label><select id="tk-ty" class="sel sm" data-ch="tk-f" data-f="type">' + opt('all', 'Any type', u.type) + Object.keys(TYPES).map(function (k) { return opt(k, TYPES[k][0], u.type); }).join('') + '</select>' +
      '<label class="sr" for="tk-pr">Priority</label><select id="tk-pr" class="sel sm" data-ch="tk-f" data-f="prio">' + opt('all', 'Any priority', u.prio) + opt('hi', 'Urgent and high', u.prio) + PRIO.map(function (k) { return opt(k, k, u.prio); }).join('') + '</select>' +
      '<label class="sr" for="tk-rel">Related to</label><select id="tk-rel" class="sel sm" data-ch="tk-f" data-f="rel">' + opt('all', 'Related to anything', u.rel) + [['lead', 'Leads'], ['deal', 'Deals'], ['contact', 'Contacts'], ['company', 'Companies']].map(function (k) { return opt(k[0], k[1], u.rel); }).join('') + '</select>' +
      '<span class="grow"></span><div class="seg" role="group" aria-label="Layout">' + [['list', 'List'], ['board', 'Board'], ['cal', 'Calendar']].map(function (x) { return '<button type="button" data-act="tk-view" data-v="' + x[0] + '" aria-pressed="' + (u.view === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      (u.view === 'board' ? '<label class="sr" for="tk-bd">Board by</label><select id="tk-bd" class="sel sm" data-ch="tk-f" data-f="board">' + opt('due', 'By due date', u.board) + opt('status', 'By status', u.board) + '</select>' : '') + '</div>';
  }
  function bulk() {
    var ids = Object.keys(U().sel).filter(find); if (!ids.length) return '';
    return '<div class="bulk" role="region" aria-label="Bulk actions"><b>' + ids.length + ' selected</b><button type="button" class="btn sm" data-act="tk-b-done">' + C.ic('check', 13) + 'Complete</button><button type="button" class="btn sm" data-act="tk-m-snooze" data-ids="' + ids.join(',') + '">' + C.ic('clock', 13) + 'Snooze</button><button type="button" class="btn sm" data-act="tk-m-assign" data-ids="' + ids.join(',') + '">' + C.ic('user', 13) + 'Reassign</button><button type="button" class="btn sm ghost" data-act="tk-b-clear">Clear</button></div>';
  }
  V.tasks = {
    title: function () { return 'Tasks'; },
    render: function () {
      var u = U(), L = filtered();
      u.sel = Object.keys(u.sel).reduce(function (o, k) { var t = find(k); if (t && !t.done) o[k] = 1; return o; }, {});
      return page('Tasks', 'Calls, WhatsApps, visits and follow-ups · <kbd>J</kbd><kbd>K</kbd> move · <kbd>X</kbd> complete · <kbd>S</kbd> snooze · <kbd>A</kbd> assign') + strip() + (u.view === 'list' ? queuesCard() : '') + views() + toolbar() +
        '<div class="tbody v-' + u.view + '">' + (u.view === 'board' ? board(L) : u.view === 'cal' ? calendar(L) : groups(L)) + '</div><div id="bulkw">' + bulk() + '</div><p class="sr" id="tk-live" role="status" aria-live="polite"></p>';
    },
    mount: function () { if (C.motion() && !C.noFx) gsap.from('.tgrp .trow', { opacity: 0, y: 6, duration: .3, stagger: .015, ease: 'power2.out', clearProps: 'all' }); }
  };
  C.acts['tk-scope'] = function (el) { var u = U(); u.scope = el.dataset.v; u.sv = ''; C.rerender(); var b = $('[data-act="tk-scope"][data-v="' + el.dataset.v + '"]'); if (b) b.focus(); };
  C.acts['tk-view'] = function (el) { U().view = el.dataset.v; C.rerender(true); var b = $('[data-act="tk-view"][data-v="' + el.dataset.v + '"]'); if (b) b.focus(); };
  C.chs['tk-f'] = function (el) { var u = U(); u[el.dataset.f] = el.value || (el.dataset.f === 'scope' ? 'team' : 'all'); u.sv = ''; C.rerender(); var x = $('#' + el.id); if (x) x.focus(); };
  C.ins['tk-q'] = function (el) { U().q = el.value; U().sv = ''; clearTimeout(C._tkq); C._tkq = setTimeout(function () { C.rerender(); var x = $('#tk-q'); if (x) { x.focus(); x.setSelectionRange(x.value.length, x.value.length); } }, 160); };
  C.chs['tk-sel'] = function (el) { var u = U(); if (el.checked) u.sel[el.dataset.id] = 1; else delete u.sel[el.dataset.id]; var li = el.closest('.trow'); if (li) li.classList.toggle('sel', el.checked); $('#bulkw').innerHTML = bulk(); };
  C.acts['tk-b-done'] = function () { var ids = Object.keys(U().sel); U().sel = {}; complete(ids); };
  C.acts['tk-b-clear'] = function () { U().sel = {}; C.rerender(); };
  C.acts['tv-pick'] = function (el) { var v = (P().taskViews || []).filter(function (x) { return x.id === el.dataset.id; })[0], keep = U().view; C.ui.tk2 = null; var u = U(); u.view = keep; if (v) { Object.keys(v.f).forEach(function (k) { u[k] = v.f[k]; }); u.sv = v.id; } C.rerender(); var b = $('[data-act="tv-pick"][data-id="' + el.dataset.id + '"]'); if (b) b.focus(); };
  C.acts['tv-save'] = function () { var u = U(); C.dialog('Save task view', '<div class="field"><label for="tv-n">View name</label><input id="tv-n" name="name" required maxlength="28" placeholder="e.g. Kabir’s WhatsApps" autocomplete="off"></div>', 'Save view', function (fd) { var n = (fd.get('name') || '').trim(); if (!n) return false; var v = { id: C.uid('tv'), name: n, f: { scope: u.scope, type: u.type, prio: u.prio, rel: u.rel, q: u.q } }; (P().taskViews = P().taskViews || []).push(v); u.sv = v.id; C.audit('settings', null, 'Saved view (tasks)', '', n); C.save(); setTimeout(C.rerender, 20); }); };
  C.acts['tv-del'] = function (el) { var L = P().taskViews, v = L.filter(function (x) { return x.id === el.dataset.id; })[0]; P().taskViews = L.filter(function (x) { return x !== v; }); if (U().sv === v.id) U().sv = ''; C.save(); C.rerender(); C.toast('View removed', { icon: 'trash', undo: function () { P().taskViews.push(v); C.save(); C.rerender(); } }); };
  // row click / card click opens the record; keyboard: j k x s a Enter
  document.addEventListener('click', function (e) {
    if (!C.cur || C.cur.name !== 'tasks') return; var li = e.target.closest && e.target.closest('.trow,.tcard,.tcc'); if (!li || e.target.closest('button,input,a,label,.rowact')) return;
    C.acts['tk-open']({ dataset: { id: li.dataset.task } });
  });
  document.addEventListener('keydown', function (e) {
    if (!C.cur || C.cur.name !== 'tasks' || document.querySelector('dialog[open]') || $('#cq') || $('#tmenu')) return;
    var t = e.target, typing = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName); if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    var rows = $$('.trow,.tcard'), li = t.closest && t.closest('.trow,.tcard'), i = rows.indexOf(li), k = e.key.toLowerCase();
    if (k === 'j' || k === 'arrowdown' && li) { var n = rows[Math.min(rows.length - 1, i + 1)]; if (n) { n.focus(); e.preventDefault(); } return; }
    if (k === 'k' || k === 'arrowup' && li) { var p = rows[Math.max(0, i - 1)]; if (p) { p.focus(); e.preventDefault(); } return; }
    if (!li) return; var id = li.dataset.task;
    if (k === 'x') { e.preventDefault(); C.acts['tk-done']($('.tchk', li) || { dataset: { id: id } }); var nx = rows[i + 1] || rows[i - 1]; if (nx) setTimeout(function () { var f = $('[data-task="' + nx.dataset.task + '"]'); if (f) f.focus(); }, 700); }
    else if (k === 's') { e.preventDefault(); C.acts['tk-m-snooze']($('[data-act="tk-m-snooze"]', li) || li); }
    else if (k === 'a') { e.preventDefault(); C.acts['tk-m-assign']($('[data-act="tk-m-assign"]', li) || li); }
    else if (k === 'enter' && t === li) { e.preventDefault(); C.acts['tk-open']({ dataset: { id: id } }); }
  });
  // swipe on touch: right = complete, left = snooze to tomorrow 10 am
  var sw = null;
  document.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'touch' || !C.cur || C.cur.name !== 'tasks') return; var li = e.target.closest('.trow:not(.done)'); if (!li || e.target.closest('button,input')) return; sw = { li: li, x: e.clientX, y: e.clientY, dx: 0, on: false }; });
  document.addEventListener('pointermove', function (e) {
    if (!sw) return; var dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    if (!sw.on) { if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { sw = null; return; } if (Math.abs(dx) < 10) return; sw.on = true; sw.li.classList.add('swiping'); }
    sw.dx = Math.max(-140, Math.min(140, dx)); sw.li.style.setProperty('--sx', sw.dx + 'px'); sw.li.classList.toggle('sw-r', sw.dx > 70); sw.li.classList.toggle('sw-l', sw.dx < -70);
  });
  function swEnd() { if (!sw) return; var s = sw; sw = null; if (!s.on) return; s.li.classList.remove('swiping'); s.li.style.removeProperty('--sx'); var id = s.li.dataset.task; if (s.dx > 70) C.acts['tk-done']($('.tchk', s.li)); else if (s.dx < -70) snooze([id], SNZ[1][2](), SNZ[1][1]); s.li.classList.remove('sw-r', 'sw-l'); }
  document.addEventListener('pointerup', swEnd); document.addEventListener('pointercancel', swEnd);

  // ===== queues + call focus mode (work cards: one job at a time, outcome grid, last remark first, Save & next) ==================
  var OUT = [['Connected', 'conn', 'check'], ['No answer', 'na', 'x'], ['Busy', 'busy', 'clock'], ['Switched off', 'off', 'pause'], ['Wrong number', 'wrong', 'flag'], ['Call back later', 'cb', 'refresh'], ['Not interested', 'ni', 'x'], ['Visit booked', 'meet', 'cal']];
  var NEXT = { conn: 'Next: send what was agreed on WhatsApp (task for tomorrow, 11 am)', na: 'Next: retry in 2 hours (task created)', busy: 'Next: retry in 1 hour (task created)', off: 'Next: retry tomorrow at 10 am (task created)', wrong: 'Next: verify the number (flagged on the record)', cb: 'Next: call back tomorrow at 10 am (task created)', ni: 'Closed out · no follow-up', meet: 'Next: confirm the slot on WhatsApp (task created)' };
  var AIM = 4;
  function isCall(t) { var ty = t.type || guessType(t); return ty === 'call' || ty === 'wa'; }
  function mineOrScope(t) { var u = U(), me = C.me().name; return visible(t) && (u.scope === 'team' ? true : u.scope === 'mine' ? t.owner === me : t.owner === u.scope); }
  var QUEUES = [
    { id: 'today', name: 'Today’s calls and WhatsApps', kind: 'auto', sub: 'Due today, priority first', due: 'Today', f: function (t) { return t.due != null && t.due < sod() + D && t.due >= sod(); } },
    { id: 'over', name: 'Overdue callbacks', kind: 'auto', sub: 'Missed yesterday or earlier', due: 'Overdue', f: function (t) { return t.due != null && t.due < sod(); } },
    { id: 'fresh', name: 'New leads · first reply', kind: 'auto', sub: 'Leads that haven’t heard from us', due: 'Within SLA', f: function (t) { var r = recOf(t); return r && r.kind === 'lead' && r.rec.status === 'new'; } },
    { id: 'close', name: 'Proposal and negotiation follow-ups', kind: 'campaign', sub: 'Deals one call from a decision', due: 'This week', f: function (t) { var r = recOf(t); return r && r.kind === 'deal' && ['proposal', 'negotiation'].indexOf(r.rec.stage) > -1; } }
  ];
  function qOpen(q) { return T().filter(function (t) { return !t.done && isCall(t) && mineOrScope(t) && q.f(t); }).sort(function (a, b) { return PRIO.indexOf(a.prio || 'Normal') - PRIO.indexOf(b.prio || 'Normal') || (a.due || 0) - (b.due || 0); }); }
  function qDone(q) { return T().filter(function (t) { return t.done && t.doneAt >= sod() && isCall(t) && mineOrScope(t) && q.f(t); }); }
  function queue() { return qOpen(QUEUES[0]).concat(qOpen(QUEUES[1])).filter(function (t, i, a) { return a.indexOf(t) === i; }); }
  function queuesCard() {
    return '<section class="card flush qcard"><div class="card-h pad"><div><h2>Queues</h2><p class="sub">Named lists you work one at a time · press Play</p></div></div><div class="tablewrap"><table class="tbl qtbl"><thead><tr><th scope="col">Queue</th><th scope="col">Assigned</th><th scope="col">Progress</th><th scope="col">Due</th><th scope="col">Status</th><th scope="col"><span class="sr">Play</span></th></tr></thead><tbody>' +
      QUEUES.map(function (q) {
        var o = qOpen(q), d = qDone(q), tot = o.length + d.length, owners = o.map(function (t) { return t.owner; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
        return '<tr><th scope="row"><b>' + esc(q.name) + '</b> <span class="qk ' + q.kind + '">' + (q.kind === 'auto' ? 'Auto' : 'Campaign') + '</span><small class="muted">' + esc(q.sub) + '</small></th><td>' + (owners.length ? '<span class="avs">' + owners.slice(0, 3).map(function (n) { return C.avatar(n, 22); }).join('') + '</span><small class="muted"> ' + (owners.length === 1 ? owners[0].split(' ')[0] : owners.length + ' callers') + '</small>' : '<span class="muted">—</span>') + '</td>' +
          '<td><span class="qprog"><i style="width:' + (tot ? d.length / tot * 100 : 0) + '%"></i></span><small class="mono">' + d.length + '/' + tot + '</small></td><td><span class="due ' + (q.id === 'over' ? 'late-r' : q.id === 'today' ? 'soon' : '') + '">' + q.due + '</span></td><td><span class="hst ' + (o.length ? 'ok' : '') + '">' + (o.length ? 'Active' : 'Clear') + '</span></td>' +
          '<td class="num"><button type="button" class="btn sm pri" data-act="cq-start" data-q="' + q.id + '"' + (o.length ? '' : ' disabled') + ' aria-label="Play ' + esc(q.name) + '">' + C.ic('play', 13) + 'Play</button></td></tr>';
      }).join('') + '</tbody></table></div></section>';
  }
  var Q = null, tickT = null;
  function script(t, r) {
    var ty = t.type || guessType(t), first = (r.contact || r.rec).name.replace(/^(Mr|Dr)\. /, '').split(' ')[0], me = C.me().name.split(' ')[0];
    if (ty === 'wa') { var tp = r.kind === 'lead' ? C.tpl(r.rec.status === 'new' ? 'intro' : 'slots') : C.tpl(r.rec.stage === 'proposal' || r.rec.stage === 'negotiation' ? 'quotewalk' : 'moodboard'); return { kind: 'WhatsApp template · ' + (tp ? tp.name : ''), lines: [C.fill(tp ? tp.body : 'Hi {{first_name}}', { name: first, owner: me, service: r.rec.service, city: (r.contact || r.rec).city || r.rec.loc })] }; }
    if (r.kind === 'lead') return r.rec.status === 'new' ? { kind: 'Call script · first reply', lines: ['“Hi ' + first + ', this is ' + me + ' from ' + (C.WS ? C.WS.name : 'Lumen Homes') + ' — you asked about ' + r.rec.service.toLowerCase() + '. Is now a good time?”', 'Ask: site address, possession date, budget band (' + C.money(r.rec.budget) + ' noted), who decides.', 'Offer a free site visit: Saturday 11 am or 4 pm.'] } : { kind: 'Call script · book the visit', lines: ['Confirm the requirement hasn’t changed.', 'Lock a site-visit slot and send the WhatsApp confirmation.'] };
    var s = r.rec.stage;
    if (s === 'negotiation') return { kind: 'Call script · close', lines: ['Recap the scope and the ' + C.rs(C.dealVal(r.rec)) + ' quote.', 'If they ask for a discount: ' + ((C.perm('discount') || 0) >= 100 ? 'you can approve it, but' : 'your cap is ' + (C.perm('discount') || 0) + '%;') + ' offer a value add (cove lighting) before price.', 'Next step: the token advance — that unlocks Won.'] };
    if (s === 'proposal') return { kind: 'Call script · quote walk-through', lines: ['Walk the quote line by line; flag items short in Stockroom.', 'Note any changes, then revise the quote from the deal.', 'Agree a decision date.'] };
    return { kind: 'Call script · check-in', lines: ['Confirm the last action and the next step.', 'Log what was agreed.'] };
  }
  function lastRemark(t, r) {
    var L = r.kind === 'lead' ? r.rec.tl.filter(function (e) { return e.type === 'note' || e.type === 'call' || e.type === 'msg'; }).sort(function (a, b) { return b.t - a.t; }).map(function (e) { return { t: e.t, text: e.text, by: r.rec.owner, type: e.type }; }) : C.timeline(r.kind === 'deal' ? { d: r.rec.id } : { c: r.rec.id }).filter(function (a) { return a.type === 'note' || a.type === 'call' || a.type === 'wa' || a.type === 'email'; });
    var all = r.kind === 'lead' ? r.rec.tl.slice().sort(function (a, b) { return b.t - a.t; }) : C.timeline(r.kind === 'deal' ? { d: r.rec.id } : { c: r.rec.id });
    return { rem: L[0] || null, act: all[0] || null };
  }
  function mmss(ms) { var s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function tickTimer() { var el = $('#cq-timer'); if (!el || !Q) return; var ms = (Q.paused ? Q.pausedAt : Date.now()) - Q.t0; el.textContent = mmss(ms); el.parentNode.classList.toggle('over', ms > AIM * 6e4); }
  function prop(label, val, add, key) { return '<div class="cqp"><dt>' + label + '</dt><dd>' + (val ? val : '<button type="button" class="addf" data-act="cq-add" data-k="' + key + '">+ Add ' + esc(add) + '</button>') + '</dd></div>'; }
  function cqPaint(flash) {
    var box = $('#cq'); if (!box || !Q) return;
    if (Q.i >= Q.ids.length) {
      clearInterval(tickT);
      var conn = Q.log.filter(function (x) { return x === 'Connected' || x === 'Visit booked'; }).length;
      box.innerHTML = '<div class="cq-in cq-end"><div class="empty-st zero">' + C.ic('check', 22) + '<b>' + esc(Q.q.name) + ' · done</b><span>' + Q.log.length + ' worked · ' + conn + ' connected · ' + Q.fu + ' follow-ups created · ' + mmss(Date.now() - Q.start) + ' in total. Everything is on the timelines and in the audit log.</span><label class="sr" for="cq-hand">Note for the next person</label><textarea id="cq-hand" rows="2" placeholder="Note for the next person on this queue (optional)"></textarea><button type="button" class="btn pri" data-act="cq-exit">Back to tasks</button></div></div>'; $('[data-act="cq-exit"]', box).focus(); return;
    }
    var t = find(Q.ids[Q.i]), r = recOf(t); if (!t || !r) { Q.i++; cqPaint(); return; }
    var ty = t.type || guessType(t), sc = script(t, r), who = r.contact || r.rec, deal = r.kind === 'deal' ? r.rec : null, st = deal ? C.pstage(deal.pipe, deal.stage) : null, lr = lastRemark(t, r);
    var nextStage = deal ? C.PIPES[deal.pipe].stages[C.PIPES[deal.pipe].stages.map(function (s) { return s.id; }).indexOf(deal.stage) + 1] : null; if (nextStage && nextStage.lost) nextStage = null;
    var left = Q.ids.length - Q.i, phone = r.phone || who.phone || '', email = (r.contact || r.rec).email, city = (r.contact || r.rec).city || r.rec.loc;
    var list = '<aside class="cq-list" aria-label="In this queue"><div class="cql-h"><b>In this queue</b><span class="count-b">' + Q.ids.length + '</span></div><ol>' + Q.ids.map(function (id, i) { var x = find(id), rr = x && recOf(x); if (!rr) return ''; var w = rr.contact || rr.rec, done = Q.res[id]; return '<li class="' + (i === Q.i ? 'now' : done ? 'done' : '') + '"><button type="button" data-act="cq-jump" data-i="' + i + '"' + (i === Q.i ? ' aria-current="true"' : '') + '>' + C.avatar(w.name, 26) + '<span><b>' + esc(w.name) + '</b><small>' + esc(done || (i === Q.i ? 'On the call' : x.text.replace(/^(Call|WhatsApp) [^—]*— /, ''))) + '</small></span>' + (done ? C.ic('check', 13) : '') + '</button></li>'; }).join('') + '</ol></aside>';
    box.innerHTML = '<div class="cq-in" role="document"><div class="cq-h"><button type="button" class="btn sm ghost" data-act="cq-exit">' + C.ic('chev-l', 14) + 'Tasks</button><span class="cq-qn"><b>' + esc(Q.q.name) + '</b></span><span class="cq-prog">' + (ty === 'wa' ? 'Message ' : 'Call ') + '<b>' + (Q.i + 1) + '</b> of ' + Q.ids.length + '</span><span class="cq-bar"><i style="width:' + (Q.i / Q.ids.length * 100) + '%"></i></span><span class="tchip">≈ ' + left * AIM + ' m left</span><span class="tchip">aim ≈ ' + AIM + ' m</span><span class="tchip tim"><span id="cq-timer">0:00</span> on this one</span><button type="button" class="btn sm" data-act="cq-pause" aria-pressed="' + !!Q.paused + '">' + C.ic(Q.paused ? 'play' : 'pause', 13) + (Q.paused ? 'Resume' : 'Pause') + '</button><button type="button" class="ibtn" data-act="cq-exit" aria-label="Exit the queue">' + C.ic('x', 18) + '</button></div>' +
      (flash ? '<p class="cq-flash" role="status">' + C.ic('check', 13) + esc(flash) + '</p>' : '<p class="cq-flash" role="status"></p>') +
      '<div class="cq-g3">' + list +
      '<section class="cq-card"><div class="cq-who">' + C.avatar(who.name, 48) + '<div><h2 id="cq-t">' + esc(who.name) + '</h2><p>' + (r.contact && r.contact.role ? esc(r.contact.role) + ' · ' : '') + (deal && deal.co ? '<span class="ochip">' + C.logo(C.company(deal.co).name, 18) + esc(C.company(deal.co).name) + '</span>' : r.kind === 'lead' ? C.srcBadge(r.rec.source) : '') + '</p></div></div>' +
      '<div class="cq-rem"><b>Last remark</b> · ' + (lr.rem ? esc(lr.rem.text.slice(0, 180)) + ' <span class="muted">· ' + C.rel(lr.rem.t) + '</span>' : 'none on file. The note you add on this call lands here.') + (lr.act ? '<small>Last activity · ' + esc((C.ATYPE[lr.act.type] || ['Activity'])[0]) + ' · ' + C.rel(lr.act.t) + '</small>' : '') + '</div>' +
      '<div class="cq-task"><span class="tty t-' + ty + '">' + C.ic(TYPES[ty][1], 14) + '</span><b>' + esc(t.text) + '</b>' + dueChip(t) + '</div>' +
      '<dl class="cqps">' + prop('Phone', phone ? '<span class="mono">' + esc(phone) + '</span>' : '', 'phone', 'phone') + prop('Email', email && email !== '—' ? esc(email) : '', 'email', 'email') + prop(deal ? 'Stage' : 'Status', deal ? '<span class="pill" style="--c:' + st.color + '"><i style="background:' + st.color + '"></i>' + esc(st.label) + '</span>' : C.pill(r.rec.status), '', '') + prop(deal ? 'Value' : 'Budget', '<b class="mono">' + (deal ? C.rs(C.dealVal(deal)) : C.money(r.rec.budget)) + '</b>' + (deal ? ' <span class="muted sm">' + C.dealProb(deal) + '%</span>' : ''), '', '') + prop('City', city && city !== '—' ? esc(city) : '', 'city', 'city') + prop('Owner', '<span class="own">' + C.avatar(t.owner, 18) + esc(t.owner) + '</span>', '', '') + '</dl>' +
      '<details class="cq-sc"' + (Q.i === 0 ? ' open' : '') + '><summary>' + esc(sc.kind) + '</summary>' + sc.lines.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') + '</details></section>' +
      '<section class="cq-act"><div class="dial"><small>' + (ty === 'wa' ? 'READY TO MESSAGE' : 'READY TO DIAL') + '</small><b>' + esc(who.name) + '</b><span class="mono">' + esc(phone || '—') + '</span><button type="button" class="btn dial-b" data-act="cq-dial">' + C.ic(ty === 'wa' ? 'wa' : 'phone', 16) + (Q.live ? 'On the call · ' + '<span id="cq-live">0:00</span>' : ty === 'wa' ? 'Open WhatsApp' : 'Call ' + esc(who.name.split(' ')[0])) + '</button><div class="dial-r"><button type="button" class="btn sm" data-act="cq-wa">' + C.ic('wa', 13) + 'WhatsApp</button><button type="button" class="btn sm" data-act="cq-skip">Skip ' + C.ic('chev-r', 12) + '</button></div><small class="muted">Dial on your phone, then pick how it went.</small></div>' +
      '<div class="cq-how"><h3>How did it go?</h3><div class="cq-outs" role="group" aria-label="Outcome">' + OUT.map(function (o, i) { return '<button type="button" class="cq-o o-' + o[1] + '" data-act="cq-out" data-i="' + i + '">' + C.ic(o[2], 18) + '<span>' + o[0] + '</span><kbd>' + (i + 1) + '</kbd></button>'; }).join('') + '</div>' +
      '<label class="sr" for="cq-note">Quick note</label><textarea id="cq-note" rows="2" placeholder="Note (N): what was agreed?"></textarea>' +
      (nextStage ? '<label class="chk cq-adv"><input type="checkbox" id="cq-adv"> If connected, move the deal to <b>' + esc(nextStage.label) + '</b>' + (C.gateFor(deal, nextStage.id) ? ' <span class="gate-f">' + C.ic('lock', 11) + ' gate: ' + esc(C.DFIELDS[C.gateFor(deal, nextStage.id).field].label.toLowerCase()) + '</span>' : '') + '</label>' : '') +
      '<div class="cq-nav"><button type="button" class="btn sm ghost" data-act="cq-prev"' + (Q.i ? '' : ' disabled') + '>' + C.ic('chev-l', 13) + 'Back</button><span class="muted sm">1–8 outcome · N note · → skip · Esc exit</span></div></div></section></div>' + (Q.paused ? '<div class="cq-paused"><b>Paused</b><button type="button" class="btn pri" data-act="cq-pause">' + C.ic('play', 14) + 'Resume</button></div>' : '') + '</div>';
    C.tintPills(box); tickTimer(); var f = $('.cq-o', box); if (f && !Q.paused) f.focus();
  }
  C.acts['cq-start'] = function (el) {
    var q = QUEUES.filter(function (x) { return x.id === ((el && el.dataset && el.dataset.q) || 'today'); })[0] || QUEUES[0], L = q.id === 'today' ? queue() : qOpen(q), ids = L.map(function (t) { return t.id; });
    if (!ids.length) { C.toast('Nothing in this queue', { icon: 'phone' }); return; }
    Q = { q: q, ids: ids, i: 0, log: [], res: {}, fu: 0, opener: document.activeElement, t0: Date.now(), start: Date.now() };
    var box = document.createElement('div'); box.id = 'cq'; box.className = 'cq'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'cq-t'); document.body.appendChild(box); document.body.classList.add('cq-on');
    cqPaint(); clearInterval(tickT); tickT = setInterval(function () { tickTimer(); var lv = $('#cq-live'); if (lv && Q && Q.live) lv.textContent = mmss(Date.now() - Q.live); }, 1000);
    if (C.motion()) gsap.from('.cq-in', { opacity: 0, y: 16, duration: .26, ease: 'power3.out', clearProps: 'all' });
  };
  function cqExit() { clearInterval(tickT); var b = $('#cq'); var hand = $('#cq-hand'); if (hand && hand.value.trim() && Q) { C.audit('update', null, 'Queue hand-over: ' + Q.q.name, '', hand.value.trim()); C.save(); } if (b) b.remove(); document.body.classList.remove('cq-on'); var o = Q && Q.opener; Q = null; C.rerender(); var s = $('[data-act="cq-start"]') || o; if (s && document.contains(s)) s.focus(); }
  C.acts['cq-exit'] = cqExit;
  function go(i, flash) { Q.i = i; Q.t0 = Date.now(); Q.live = null; cqPaint(flash); if (C.motion()) gsap.from('#cq .cq-card,#cq .cq-act', { opacity: 0, x: 14, duration: .22, ease: 'power2.out', stagger: .04, clearProps: 'all' }); }
  C.acts['cq-prev'] = function () { if (Q.i) go(Q.i - 1); };
  C.acts['cq-skip'] = function () { Q.res[Q.ids[Q.i]] = Q.res[Q.ids[Q.i]] || 'Skipped'; go(Q.i + 1, 'Skipped'); };
  C.acts['cq-jump'] = function (el) { go(+el.dataset.i); };
  C.acts['cq-pause'] = function () { if (Q.paused) { Q.t0 += Date.now() - Q.pausedAt; Q.paused = false; } else { Q.paused = true; Q.pausedAt = Date.now(); } cqPaint(); var b = $('.cq-paused .btn') || $('[data-act="cq-pause"]'); if (b) b.focus(); };
  C.acts['cq-dial'] = function () { if (!Q.live) { Q.live = Date.now(); var b = $('[data-act="cq-dial"]'); if (b) { b.classList.add('live'); b.innerHTML = C.ic('phone', 16) + 'On the call · <span id="cq-live">0:00</span>'; } var o = $('.cq-o'); if (o) o.focus(); } };
  C.acts['cq-wa'] = function () { var t = find(Q.ids[Q.i]); logTo(t, 'wa', 'WhatsApp opened from the call queue'); C.save(); C.toast('WhatsApp opened · logged', { icon: 'wa' }); };
  C.acts['cq-add'] = function (el) {
    var t = find(Q.ids[Q.i]), r = recOf(t), k = el.dataset.k, target = r.contact || r.rec, lab = { phone: 'Phone', email: 'Email', city: 'City' }[k];
    var dd = el.parentNode; dd.innerHTML = '<form class="pe" data-form="cq-add" data-k="' + k + '"><label class="sr" for="cq-af">' + lab + '</label><input id="cq-af" name="v" ' + (k === 'email' ? 'type="email" ' : '') + 'required autocomplete="off"></form>'; $('#cq-af').focus();
    C.forms['cq-add'] = function (f) { var v = new FormData(f).get('v').trim(); if (!v) return; var key = k === 'city' && r.kind === 'lead' && !r.contact ? 'loc' : k; var was = target[key]; target[key] = v; C.audit('update', auditRef(t), lab, was || '', v); C.save(); cqPaint('Saved ' + lab.toLowerCase()); };
  };
  C.acts['cq-out'] = function (el) {
    var t = find(Q.ids[Q.i]), r = recOf(t), o = OUT[+el.dataset.i], note = ($('#cq-note') || {}).value || '', ty = t.type || guessType(t), adv = $('#cq-adv') && $('#cq-adv').checked, k = o[1];
    var dur = Q.live ? ' · ' + mmss(Date.now() - Q.live) : '';
    logTo(t, ty === 'wa' ? 'wa' : 'call', (ty === 'wa' ? 'WhatsApp · ' : 'Call · ') + o[0] + dur + (note.trim() ? ' — ' + note.trim() : ''));
    if (note.trim()) logTo(t, 'note', note.trim());
    t.done = true; t.doneAt = Date.now(); C.audit('update', auditRef(t), 'Task completed (queue: ' + Q.q.name + ')', '', o[0]);
    var first = (r.contact || r.rec).name.split(' ')[0], base = sod(), FU = { conn: ['Follow up: send what was agreed', base + D + 11 * H, 'wa'], na: ['Try again — ' + first + ' didn’t answer', Date.now() + 2 * H, 'call'], busy: ['Try again — ' + first + ' was busy', Date.now() + H, 'call'], off: ['Try again — ' + first + '’s phone was off', base + D + 10 * H, 'call'], cb: ['Call back — ' + first + ' asked', base + D + 10 * H, 'call'], meet: ['Confirm the visit slot with ' + first, Date.now() + 30 * 6e4, 'wa'] }[k];
    if (FU) { if (r.kind === 'lead') C.addTask(r.rec.id, FU[0], FU[1]); else C.addRefTask({ t: r.kind, id: r.rec.id }, FU[0], FU[1], 15, t.owner); var nt = T()[r.kind === 'lead' ? T().length - 1 : T().length - 1]; if (nt) { nt.type = FU[2]; nt.prio = t.prio; } Q.fu++; }
    if (k === 'wrong') { var tg = r.contact || null; if (tg) { tg.tags = [].concat(tg.tags || []); if (tg.tags.indexOf('Wrong number') < 0) tg.tags.push('Wrong number'); } C.notify('Wrong number on ' + (r.contact || r.rec).name + ' · verify it', r.kind === 'lead' ? '#/inbox/' + r.rec.id : C.refHref({ t: r.kind, id: r.rec.id }), 'flag', t.owner); }
    var msg = o[0] + ' · logged · ' + NEXT[k];
    if (r.kind === 'lead' && (k === 'conn' || k === 'cb') && r.rec.status === 'new') { C.setStatus(r.rec, 'contacted'); msg += ' · lead → Contacted'; }
    if (r.kind === 'lead' && k === 'meet') { if (r.rec.status === 'new') C.setStatus(r.rec, 'contacted'); C.setStatus(r.rec, 'site'); msg += ' · lead → Site visit'; }
    if (r.kind === 'lead' && k === 'ni') { C.setStatus(r.rec, 'lost'); msg += ' · lead → Lost'; }
    C.save(); C.badges(); Q.log.push(o[0]); Q.res[t.id] = o[0];
    var next = function () { go(Q.i + 1, msg); };
    if (adv && (k === 'conn' || k === 'meet') && r.kind === 'deal') {
      var d = r.rec, sts = C.PIPES[d.pipe].stages, ns = sts[sts.map(function (s) { return s.id; }).indexOf(d.stage) + 1], went = false;
      var gofn = function (moved) { if (went) return; went = true; if (moved) msg += ' · deal → ' + ns.label; else if (moved === false) msg += ' · stage not changed'; next(); };
      if (!ns) gofn();
      else if (C.moveDeal(d, ns.id, { after: function () { gofn(true); } })) gofn(true);
      else { var dlg = $('#dlg'); if (dlg && dlg.open) dlg.addEventListener('close', function () { setTimeout(function () { gofn(d.stage === ns.id); }, 80); }, { once: true }); else gofn(); }
    } else next();
  };
  document.addEventListener('keydown', function (e) {
    if (!$('#cq') || !Q || document.querySelector('dialog[open]')) return; var typing = /^(cq-note|cq-af|cq-hand)$/.test(e.target.id);
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (typing) { e.target.blur(); return; } cqExit(); return; }
    if (typing) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && e.target.id === 'cq-note') { e.preventDefault(); var b = $('.cq-o'); if (b) b.click(); } return; }
    if (Q.paused) return;
    if (/^[1-8]$/.test(e.key) && Q.i < Q.ids.length) { e.preventDefault(); var ob = $$('.cq-o')[+e.key - 1]; if (ob) ob.click(); }
    else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); var n = $('#cq-note'); if (n) n.focus(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); C.acts['cq-skip'](); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); C.acts['cq-prev'](); }
    else if (e.key === 'Tab') { var f = $$('#cq button:not([disabled]),#cq textarea,#cq input,#cq summary'), i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
  }, true);
  C.searchers.push(function (terms, hit) { return T().filter(function (t) { return !t.done && visible(t) && hit(t.text); }).slice(0, 4).map(function (t) { return { g: 'Tasks', ic: 'tasks', label: t.text, sub: (t.owner || '').split(' ')[0] + ' · ' + (t.due ? C.dshort(t.due) : 'no date'), run: function () { location.hash = '#/tasks'; } }; }); });
})();
