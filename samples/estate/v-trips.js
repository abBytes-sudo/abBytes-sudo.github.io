/* Fieldwise — Calling (queues, call mode) and Trips (list, week, planner, trip out now, visit outcome). */
(function () {
  'use strict';
  var CK = window.CK, esc = CK.esc, ic = CK.ic;
  function S() { return CK.S(); }
  function eod() { return CK.dayStart(CK.now()) + CK.DAY - 1; }

  /* ============ CALLING ============ */
  CK.queueItems = function (q) {
    var s = S(), now = CK.now();
    if (q.rule === 'new') return s.leads.filter(function (L) { return L.stage === 'new'; }).sort(function (a, b) { return a.created - b.created; }).map(function (L) { return { lead: L }; });
    if (q.rule === 'due') { var seen = {}; return s.tasks.filter(function (t) { return !t.done && t.lead && (t.kind === 'call' || t.kind === 'followup') && t.due <= eod() && CK.lead(t.lead).stage !== 'new'; }).sort(function (a, b) { return a.due - b.due; }).filter(function (t) { if (seen[t.lead]) return false; seen[t.lead] = 1; return true; }).map(function (t) { return { lead: CK.lead(t.lead), task: t }; }); }
    if (q.rule === 'confirm') { var tm = CK.dayStart(now) + CK.DAY, ids = []; s.trips.forEach(function (t) { if (CK.dayStart(t.start) === tm && t.status !== 'cancelled') t.leads.forEach(function (l) { if (ids.indexOf(l) < 0) ids.push(l); }); }); return ids.map(function (l) { return { lead: CK.lead(l) }; }); }
    if (q.rule === 'owners') return s.props.filter(function (p) { var v = CK.ver(p); return (v === 'overdue' || v === 'due') && p.status !== 'let' && p.status !== 'sold'; }).sort(function (a, b) { return a.ver.at - b.ver.at; }).map(function (p) { return { prop: p, owner: CK.owner(p.ownerId) }; });
    if (q.rule === 'quiet') return s.leads.filter(function (L) { return ['requirement', 'matched', 'visit'].indexOf(L.stage) >= 0 && L.last && now - L.last > 10 * CK.DAY; }).map(function (L) { return { lead: L }; });
    if (q.rule === 'campaign') return q.fixed.map(CK.lead).filter(Boolean).map(function (L) { return { lead: L }; });
    return [];
  };
  function calledToday(q) { var d0 = CK.dayStart(CK.now()); return CK.queueItems(q).filter(function (it) { return it.lead ? it.lead.tl.some(function (e) { return e.kind === 'call' && e.at >= d0; }) : it.prop.ownerLastReply >= d0; }).length; }
  var CS = { out: null, note: '', next: null, dial: 0, timer: null };
  CK.V.calling = {
    title: 'Calling',
    render: function (r) {
      if (r.id) return callMode(r);
      var qs = S().queues;
      return '<div class="ph"><div><h1>Calling queues</h1><p class="muted">Automatic queues are worked out fresh each time; campaign lists are fixed. Missed calls come back in ' + S().settings.missedCallRetryH + ' h; after ' + S().settings.maxMisses + ' misses a person decides. No outgoing calls between 7 pm and 9 am.</p></div></div><div class="queues">' + qs.map(function (q) {
        var items = CK.queueItems(q), done = calledToday(q), tot = items.length;
        return '<article class="queue"><div class="q-l"><span class="q-ic">' + ic(q.rule === 'owners' ? 'key' : q.kind === 'campaign' ? 'bookmark' : 'phone', 18) + '</span><div><h2>' + esc(q.name) + '</h2><p class="muted sm">' + esc(q.desc) + '</p></div></div><div class="q-m"><span class="pill ' + (q.kind === 'auto' ? 't-blue' : 't-violet') + '">' + (q.kind === 'auto' ? 'Automatic' : 'Campaign') + '</span>' + (q.sla ? '<span class="pill t-accent">SLA ' + q.sla + '</span>' : '') + '<span class="avs">' + q.who.map(function (w) { return CK.av(CK.agent(w), 's'); }).join('') + '</span></div><div class="q-n"><b>' + tot + '</b><span class="muted sm">' + (q.rule === 'owners' ? 'owners' : 'to call') + '</span><div class="prog sm"><span style="width:' + (tot ? Math.min(100, done / tot * 100) : 0) + '%"></span></div><small class="muted">' + done + ' done today</small></div>' + (tot ? '<a class="btn primary" href="#/calling/' + q.id + '">' + ic('play', 15) + 'Start</a>' : '<span class="muted sm">Empty</span>') + '</article>';
      }).join('') + '</div>';
    },
    mount: function (el, r) { if (r.id) mountCall(el, r); },
    unmount: function () { clearInterval(CS.timer); CS.timer = null; }
  };
  function scriptFor(q, it) {
    var me = CK.me().name.split(' ')[0];
    if (it.prop) { var p = it.prop; return ['“Namaste ' + esc(it.owner.name.replace(/\s*\(.*\)/, '')) + ' ji, ' + me + ' from Amaltas Estates.”', 'Is your ' + esc(CK.cfg(p)) + ' at ' + esc(p.plot) + ' still available?', 'Same ' + (p.deal === 'rent' ? 'rent' : 'price') + ' — ' + CK.priceLong(p) + '? Any change in the free-from date (' + CK.date(p.availFrom) + ')?', 'Can our agent come by this week for fresh photos? (keeps the Verified badge on)']; }
    var L = it.lead, n = CK.matches(L).length;
    if (q.rule === 'new') return ['“Namaste, ' + me + ' from Amaltas Estates — you enquired on ' + esc(L.src) + ' a few minutes ago. Is this a good time?”', 'Confirm: <b>' + L.req.bhk.join('/') + ' BHK</b>, budget <b>' + CK.budget(L) + '</b>, areas, move-in date, family, pets.', 'Offer: “I have <b>' + n + ' verified homes</b> that fit — can I WhatsApp them right now?”', 'Book: a visit slot this week (mornings are fastest for owners).'];
    if (q.rule === 'confirm') return ['“Confirming tomorrow’s visit with ' + esc(CK.agent(L.field).name.split(' ')[0]) + '.”', 'Share the first stop and time; ask them to carry an ID for society gates.', 'If they can’t make it, offer the next slot before cancelling.'];
    if (q.rule === 'quiet') return ['“We last spoke ' + CK.ago(L.last) + ' — are you still looking?”', 'Two new homes match since then: mention the best one.', 'If plans changed, mark lost with a reason (it improves reports).'];
    return ['Pick up from the last call: <i>' + esc((L.tl.filter(function (e) { return e.kind === 'call'; })[0] || { text: 'first contact' }).text.replace(/^Call · /, '')) + '</i>', 'Ask what they thought of the shortlist; offer a visit slot.', 'Book the next step before you hang up.'];
  }
  function callMode(r) {
    var q = S().queues.filter(function (x) { return x.id === r.id; })[0]; if (!q) return CK.empty('Queue not found', '');
    var items = CK.queueItems(q);
    var idx = 0; if (r.sub) items.forEach(function (it, i) { if ((it.lead && it.lead.id === r.sub) || (it.prop && it.prop.id === r.sub)) idx = i; });
    if (r.sub && !items.some(function (it) { return (it.lead && it.lead.id === r.sub) || (it.prop && it.prop.id === r.sub); })) { var L0 = CK.lead(r.sub); if (L0) { items.unshift({ lead: L0 }); idx = 0; } }
    var it = items[idx];
    if (!it) return '<div class="ph"><div><h1>' + esc(q.name) + '</h1></div></div>' + CK.empty('Queue finished', 'Nobody left to call in this queue. Nice work.', '<a class="btn" href="#/calling">Back to queues</a>');
    CS.it = it; CS.q = q; CS.items = items; CS.idx = idx;
    var left = '<aside class="cm-q" aria-label="In this queue"><div class="cm-qh"><a class="btn ghost sm" href="#/calling">' + ic('left', 14) + 'Queues</a><b>' + items.length + '</b></div><ol>' + items.map(function (x, i) { var nm = x.lead ? x.lead.name : x.owner.name, sub = x.lead ? x.lead.id + ' · ' + CK.stageLabel(x.lead.stage) : x.prop.code + ' · ' + CK.verAge(x.prop) + 'd since check'; return '<li><a href="#/calling/' + q.id + '/' + (x.lead ? x.lead.id : x.prop.id) + '" class="' + (i === idx ? 'on' : '') + '"' + (i === idx ? ' aria-current="true"' : '') + '>' + CK.av(x.lead || x.owner, 's') + '<span><b>' + esc(nm) + '</b><small>' + esc(sub) + '</small></span></a></li>'; }).join('') + '</ol></aside>';
    var center;
    if (it.lead) {
      var L = it.lead, ms = CK.matches(L).slice(0, 3), calls = L.tl.filter(function (e) { return e.kind === 'call' || e.kind === 'note' || e.kind === 'wa' || e.kind === 'visit'; }).slice(0, 4);
      center = '<header class="cm-h">' + CK.av(L, 'l') + '<div class="grow"><p class="muted sm">' + esc(q.name) + ' · call ' + (idx + 1) + ' of ' + items.length + '</p><h1>' + esc(L.name) + '</h1><p>' + CK.wants(L) + '</p></div><div class="cm-hp">' + CK.stagePill(L) + CK.srcChip(L.src) + '<button type="button" class="btn sm ghost" data-peek="lead:' + L.id + '">Open lead</button></div></header>' +
        '<div class="cm-g"><section class="card script"><div class="card-h"><h3>' + ic('spark', 14) + 'Script</h3></div><ol>' + scriptFor(q, it).map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol></section>' +
        '<section class="card"><div class="card-h"><h3>Last time</h3></div>' + (calls.length ? '<ol class="tl">' + calls.map(function (e) { return '<li><span class="tl-ic">' + ic(e.kind === 'call' ? 'phone' : e.kind === 'wa' ? 'chat' : e.kind === 'visit' ? 'pin' : 'edit', 14) + '</span><div><p>' + esc(e.text) + '</p><small class="muted">' + CK.ago(e.at) + '</small></div></li>'; }).join('') + '</ol>' : '<p class="muted">First conversation. ' + esc(L.req.note) + '</p>') + '</section>' +
        '<section class="card cm-ms"><div class="card-h"><h3>Homes to mention</h3><span class="muted sm">' + CK.matches(L).length + ' match</span></div>' + (ms.map(function (m) { return '<div class="row-b">' + CK.chipProp(m.p) + '<span class="muted sm">' + CK.price(m.p) + '</span><span class="grow"></span>' + CK.score(m.score) + '</div>'; }).join('') || '<p class="muted">No match yet — capture the requirement first.</p>') + '</section></div>';
    } else {
      var p = it.prop, o = it.owner;
      center = '<header class="cm-h">' + CK.av(o, 'l') + '<div class="grow"><p class="muted sm">' + esc(q.name) + ' · call ' + (idx + 1) + ' of ' + items.length + ' · target 3 min</p><h1>' + esc(o.name) + '</h1><p>' + CK.chipProp(p) + ' ' + esc(CK.cfg(p)) + ' · ' + CK.priceLong(p) + '</p></div><div class="cm-hp">' + CK.verPill(p) + '</div></header><div class="cm-g"><section class="card script"><div class="card-h"><h3>' + ic('spark', 14) + 'Script</h3></div><ol>' + scriptFor(q, it).map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol></section><section class="card"><div class="card-h"><h3>Last remark</h3></div><p>' + esc((o.comms[0] || { text: 'No remark yet' }).text) + '</p><p class="muted sm">' + esc(o.pref) + '</p></section><section class="card"><img class="cm-img" src="' + CK.ph(p.photos[0], 1) + '" alt="" width="440" height="300"></section></div>';
    }
    var outs = it.lead ? [['connected', 'Connected', '1'], ['callback', 'Call back later', '2'], ['noanswer', 'Didn’t pick up', '3'], ['busy', 'Busy / switched off', '4'], ['wrong', 'Wrong number', '5'], ['notint', 'Not interested', '6']] : [['same', 'Available · same price', '1'], ['changed', 'Price or date changed', '2'], ['gone', 'Let out / sold', '3'], ['noanswer', 'Didn’t pick up', '4']];
    var nexts = it.lead ? [['visit', 'Book a site visit'], ['fu', 'Follow up tomorrow 11 am'], ['cb', 'Call back in 2 hours'], ['none', 'No next step']] : [];
    var right = '<aside class="cm-r" aria-label="Call controls"><div class="dial"><p class="muted sm">' + (CS.dial ? 'On call' : 'Ready to dial') + '</p><b class="dial-n">' + esc(it.lead ? it.lead.phone : it.owner.phone) + '</b><p class="dial-t" id="dial-t" aria-live="off">' + (CS.dial ? fmtT(Date.now() - CS.dial) : '00:00') + '</p><div class="btnrow"><button type="button" class="btn ' + (CS.dial ? 'danger' : 'primary') + '" data-cm="dial">' + ic('phone', 15) + (CS.dial ? 'Hang up' : 'Dial') + '</button><button type="button" class="btn ghost" data-cm="skip">' + ic('skip', 15) + 'Skip</button></div><p class="muted xs">Calls go out through your phone; the call is logged here.</p></div>' +
      '<fieldset class="outs"><legend>Outcome</legend>' + outs.map(function (o) { return '<button type="button" data-out="' + o[0] + '" aria-pressed="' + (CS.out === o[0]) + '" class="' + (CS.out === o[0] ? 'on' : '') + '"><kbd>' + o[2] + '</kbd>' + esc(o[1]) + '</button>'; }).join('') + '</fieldset>' +
      '<div class="fld"><label for="cm-note">Note</label><textarea id="cm-note" rows="3" placeholder="What did they say?">' + esc(CS.note) + '</textarea></div>' +
      (nexts.length ? '<fieldset class="nexts-f"><legend>Next step</legend>' + nexts.map(function (n) { return '<label class="radio"><input type="radio" name="cm-next" value="' + n[0] + '"' + (CS.next === n[0] ? ' checked' : '') + '><span>' + n[1] + '</span></label>'; }).join('') + '</fieldset>' : '') +
      '<p class="err" id="cm-err" role="alert"></p><button type="button" class="btn primary big" data-cm="save">Save &amp; next call<kbd>N</kbd></button></aside>';
    return '<div class="callmode">' + left + '<section class="cm-c" aria-label="Current call">' + center + '</section>' + right + '</div>';
  }
  function fmtT(ms) { var s = Math.floor(ms / 1000); return (s / 60 < 10 ? '0' : '') + Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + s % 60; }
  function mountCall(el, r) {
    clearInterval(CS.timer); CS.timer = setInterval(function () { var t = document.getElementById('dial-t'); if (t && CS.dial) t.textContent = fmtT(Date.now() - CS.dial); }, 1000);
    if (CS.forItem !== (CS.it && (CS.it.lead || CS.it.prop).id)) { CS.out = null; CS.note = ''; CS.next = null; CS.dial = 0; CS.forItem = CS.it && (CS.it.lead || CS.it.prop).id; }
    el.addEventListener('input', function (e) { if (e.target.id === 'cm-note') CS.note = e.target.value; });
    el.addEventListener('change', function (e) { if (e.target.name === 'cm-next') CS.next = e.target.value; });
    el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-out],[data-cm]'); if (!t) return;
      if (t.dataset.out) { CS.out = t.dataset.out; el.querySelectorAll('[data-out]').forEach(function (b) { var on = b === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); return; }
      if (t.dataset.cm === 'dial') { CS.dial = CS.dial ? 0 : Date.now(); if (!CS.dial && !CS.out) CS.out = 'connected'; CK.render(); }
      if (t.dataset.cm === 'skip') nextItem();
      if (t.dataset.cm === 'save') save();
    });
    CK.keyHandler = function (e) {
      if (e.target.closest('input,textarea,select')) return;
      var bs = el.querySelectorAll('[data-out]'); var n = +e.key; if (n >= 1 && n <= bs.length) { bs[n - 1].click(); e.preventDefault(); }
      if (e.key === 'n' || e.key === 'N') { save(); e.preventDefault(); }
    };
  }
  function nextItem() { var nx = CS.items[CS.idx + 1]; CS.out = null; CS.note = ''; CS.next = null; CS.dial = 0; if (nx) CK.go('#/calling/' + CS.q.id + '/' + (nx.lead || nx.prop).id); else CK.go('#/calling/' + CS.q.id); }
  function save() {
    var it = CS.it, err = document.getElementById('cm-err');
    if (!CS.out) { if (err) err.textContent = 'Pick an outcome first (keys 1–' + (it.lead ? 6 : 4) + ').'; return; }
    if (it.lead) {
      var L = it.lead, now = CK.now(), nx = null;
      if (CS.next === 'fu') nx = { kind: 'followup', title: 'Follow up after call', due: CK.dayStart(now) + CK.DAY + 11 * 36e5 };
      if (CS.next === 'cb') nx = { kind: 'call', title: 'Call back', due: now + 2 * 36e5 };
      if (CS.out === 'connected' && L.stage === 'new') CK.act.bump(L, 'contacted');
      CK.act.call(L, CS.out, CS.note.trim(), nx);
      if (CS.next === 'visit') { CK.ui.plan = { leads: [L.id], pids: (L.shortlist.length ? L.shortlist : CK.matches(L).slice(0, 3).map(function (m) { return m.p.id; })).slice(0, 4), r: L.req.r }; CK.saveUI(); CK.toast('Call saved — now plan the visit'); CK.go('#/trips/new'); return; }
      CK.toast('Call saved · ' + L.name.split(' ')[0]);
    } else {
      var p = it.prop, o = it.owner;
      if (CS.out === 'same') { p.ownerLastReply = CK.now(); p.ver.at = Math.max(p.ver.at, CK.now() - (CK.window(p) - 7) * CK.DAY); o.comms.unshift({ at: CK.now(), kind: 'call', text: 'Call — ' + p.code + ' still available at the same price' + (CS.note ? '. ' + CS.note : ''), by: CK.me().id }); CK.audit('Owner check call', p.code, 'Still available'); }
      if (CS.out === 'changed') { o.comms.unshift({ at: CK.now(), kind: 'call', text: 'Call — ' + p.code + ' terms changed: ' + (CS.note || 'see notes'), by: CK.me().id }); CK.act.ownerRequest(p); }
      if (CS.out === 'gone') { p.status = p.deal === 'rent' ? 'let' : 'sold'; o.comms.unshift({ at: CK.now(), kind: 'call', text: 'Call — ' + p.code + ' already ' + (p.deal === 'rent' ? 'let out' : 'sold'), by: CK.me().id }); CK.audit('Marked let out after owner call', p.code); }
      if (CS.out === 'noanswer') { o.comms.unshift({ at: CK.now(), kind: 'call', text: 'Call — no answer about ' + p.code + '; retry in ' + S().settings.missedCallRetryH + ' h. Listing stays live.', by: CK.me().id }); }
      CK.emit('owner'); CK.toast('Saved · ' + o.name);
    }
    nextItem();
  }

  /* ============ TRIPS ============ */
  var TV = { mode: 'list', week: 0 };
  CK.V.trips = {
    title: 'Trips',
    render: function (r) {
      if (r.id === 'new') return planner();
      if (r.id) return tripDetail(CK.trip(r.id));
      var s = S(), role = CK.role(), me = CK.me();
      var trips = s.trips.filter(function (t) { return role !== 'field' || t.agent === me.id; });
      var head = '<div class="ph"><div><h1>Trips</h1><p class="muted">A trip is one agent, one afternoon, several homes in walking or short-drive order. It turns <b>Out now</b> when the first stop is checked in.</p></div><div class="ph-a"><div class="seg" role="group" aria-label="Layout"><button type="button" data-tmode="list" aria-pressed="' + (TV.mode === 'list') + '">' + ic('list', 15) + '<span>List</span></button><button type="button" data-tmode="week" aria-pressed="' + (TV.mode === 'week') + '">' + ic('cal', 15) + '<span>Week</span></button></div>' + (CK.can('trips.plan') ? '<a class="btn primary" href="#/trips/new">' + ic('plus', 16) + 'Plan a trip</a>' : '') + '</div></div>';
      return head + (TV.mode === 'week' ? week(trips) : tripList(trips));
    },
    mount: function (el, r) {
      el.addEventListener('click', function (e) { var t = e.target.closest('[data-tmode],[data-wk]'); if (!t) return; if (t.dataset.tmode) TV.mode = t.dataset.tmode; else TV.week += +t.dataset.wk; CK.render(); });
      if (r.id === 'new') mountPlanner(el);
      else if (r.id) mountDetail(el, CK.trip(r.id));
    },
    unmount: function () { clearInterval(TD.sim); TD.sim = null; }
  };
  function tripRow(t) {
    var done = t.stops.filter(function (s) { return s.st === 'done' || s.st === 'missed'; }).length, a = CK.agent(t.agent), areas = [];
    t.stops.forEach(function (s) { var n = CK.area(CK.prop(s.pid).area).short; if (areas.indexOf(n) < 0) areas.push(n); });
    return '<a class="trow" href="#/trips/' + t.id + '"><span class="mono tid">' + t.id + '</span>' + CK.av(a) + '<span class="tr-m"><b>' + esc(a.name) + (t.kind === 'verify' ? ' · verification run' : '') + '</b><small>' + CK.dayLabel(t.start) + ' · ' + CK.time(t.start) + ' · ' + esc(areas.slice(0, 3).join(', ')) + '</small></span><span class="tr-c">' + t.leads.slice(0, 2).map(function (l) { var L = CK.lead(l); return L ? '<span class="chip chip-s">' + CK.av(L, 's') + esc(L.name.split(' ')[0]) + '</span>' : ''; }).join('') + '</span><span class="tr-p"><span class="prog sm"><span style="width:' + (done / t.stops.length * 100) + '%"></span></span><small>' + done + '/' + t.stops.length + ' stops</small></span>' + CK.tripPill(t) + '</a>';
  }
  function tripList(trips) {
    var now = CK.now(), g = [['out', 'Out now'], ['waiting', 'Waiting for client'], ['planned', 'Planned'], ['done', 'Done'], ['cancelled', 'Cancelled']];
    return g.map(function (x) { var ts = trips.filter(function (t) { return t.status === x[0]; }).sort(function (a, b) { return x[0] === 'done' ? b.start - a.start : a.start - b.start; }); if (!ts.length) return ''; return '<section class="tgroup"><h2 class="sh">' + x[1] + '<b>' + ts.length + '</b></h2><div class="trows">' + ts.map(tripRow).join('') + '</div></section>'; }).join('') || CK.empty('No trips yet', 'Plan one from a lead’s matches.');
  }
  function week(trips) {
    var now = CK.now(), d0 = CK.dayStart(now), wd = new Date(d0).getDay(), mon = d0 - ((wd + 6) % 7) * CK.DAY + TV.week * 7 * CK.DAY;
    var days = [0, 1, 2, 3, 4, 5, 6].map(function (i) { return mon + i * CK.DAY; });
    var H0 = 9, H1 = 20, hh = 54;
    var grid = '<div class="wk"><div class="wk-h"><button type="button" class="ibtn" data-wk="-1" aria-label="Previous week">' + ic('left', 16) + '</button><b>' + CK.date(days[0]) + ' – ' + CK.date(days[6]) + '</b><button type="button" class="ibtn" data-wk="1" aria-label="Next week">' + ic('right', 16) + '</button>' + (TV.week ? '<button type="button" class="btn sm ghost" data-wk="' + (-TV.week) + '">This week</button>' : '') + '</div><div class="wk-g" style="--hh:' + hh + 'px"><div class="wk-t">' + [9, 11, 13, 15, 17, 19].map(function (h) { return '<span style="top:' + ((h - H0) * hh) + 'px">' + ((h + 11) % 12 + 1) + (h < 12 ? ' am' : ' pm') + '</span>'; }).join('') + '</div>' + days.map(function (d) {
      var ts = trips.filter(function (t) { return CK.dayStart(t.start) === d && t.status !== 'cancelled'; });
      return '<div class="wk-d' + (d === d0 ? ' today' : '') + '"><div class="wk-dh">' + CK.WD[new Date(d).getDay()] + ' <b>' + new Date(d).getDate() + '</b></div><div class="wk-col" style="height:' + ((H1 - H0) * hh) + 'px">' + ts.map(function (t, i) { var sc = CK.schedule(t), st = new Date(t.start), top = ((st.getHours() + st.getMinutes() / 60) - H0) * hh, ht = Math.max(40, (sc.end - t.start) / 36e5 * hh); return '<a class="wk-ev s-' + t.status + '" href="#/trips/' + t.id + '" style="top:' + top + 'px;height:' + ht + 'px;--col:' + (CK.agent(t.agent).hue) + ';left:' + (ts.length > 1 ? i * 12 : 0) + 'px"><b>' + esc(CK.agent(t.agent).name.split(' ')[0]) + '</b><small>' + CK.hm(t.start) + ' · ' + t.stops.length + ' stops</small></a>'; }).join('') + (d === d0 ? '<span class="wk-now" style="top:' + ((new Date(now).getHours() + new Date(now).getMinutes() / 60 - H0) * hh) + 'px"></span>' : '') + '</div></div>';
    }).join('') + '</div></div>';
    return grid;
  }

  /* ---------- planner ---------- */
  var PL = null;
  function initPlan() {
    var u = CK.ui.plan || {};
    var r = u.r || 'sd', fieldA = S().agents.filter(function (a) { return a.role === 'field' && (a.zone === r || !a.zone); });
    var L0 = u.leads && u.leads[0] ? CK.lead(u.leads[0]) : null;
    var tm = CK.dayStart(CK.now()) + CK.DAY + 11 * 36e5;
    PL = { r: r, kind: u.kind || 'visit', agent: L0 ? L0.field : (r === 'ggn' ? 'A8' : fieldA[0].id), start: tm, leads: (u.leads || []).slice(), pids: (u.pids || []).slice(), optimised: false, saved: 0 };
    if (PL.kind === 'verify') PL.agent = r === 'ggn' ? 'A8' : 'A10';
    if (!PL.pids.length && L0) PL.pids = CK.matches(L0).slice(0, 3).map(function (m) { return m.p.id; });
    CK.ui.plan = null; CK.saveUI();
  }
  function planner() {
    if (!PL) initPlan();
    var R = CK.REGIONS[PL.r], stops = PL.pids.map(function (pid) { return { pid: pid, st: 'togo' }; });
    var fake = { r: PL.r, start: PL.start, stops: stops, kind: PL.kind }, sch = CK.schedule(fake);
    var clash = S().trips.filter(function (t) { return t.agent === PL.agent && t.status !== 'cancelled' && t.status !== 'done' && t.start < sch.end && CK.schedule(t).end > PL.start; });
    var agents = S().agents.filter(function (a) { return a.role === 'field'; });
    var tot = sch.legs.reduce(function (a, l) { return a + l.leg; }, 0);
    var opt = PL.pids.length > 2 ? CK.routeLen(R.office, CK.orderStops(R.office, PL.pids.map(CK.prop))) : tot;
    var leadsHtml = PL.leads.map(function (l) { var L = CK.lead(l); return '<span class="tag">' + CK.av(L, 's') + esc(L.name) + '<button type="button" data-pl-rml="' + l + '" aria-label="Remove ' + esc(L.name) + '">' + ic('x', 11) + '</button></span>'; }).join('') + '<button type="button" class="tag add" data-pl="addlead">' + ic('plus', 12) + 'Client</button>';
    var dt = new Date(PL.start - new Date().getTimezoneOffset() * 6e4).toISOString();
    var form = '<div class="pl-f"><div class="f2"><div class="fld"><label for="pl-a">Field agent</label><select id="pl-a">' + agents.map(function (a) { return '<option value="' + a.id + '"' + (a.id === PL.agent ? ' selected' : '') + '>' + esc(a.name) + ' — ' + esc(a.title.replace('Field agent · ', '')) + '</option>'; }).join('') + '</select></div><div class="fld"><label for="pl-d">Start</label><input id="pl-d" type="datetime-local" value="' + dt.slice(0, 16) + '" step="900"></div></div>' +
      '<div class="fld"><span class="lbl">' + (PL.kind === 'verify' ? 'Kind' : 'Clients') + '</span><div class="tags">' + (PL.kind === 'verify' ? '<span class="pill t-amber">Verification run — no clients</span>' : leadsHtml) + '</div></div>' +
      (clash.length ? '<p class="warn-n">' + ic('flag', 14) + esc(CK.agent(PL.agent).name.split(' ')[0]) + ' already has ' + clash.map(function (c) { return c.id + ' at ' + CK.time(c.start); }).join(', ') + ' — times overlap.</p>' : '') + '</div>';
    var list = '<ol class="pl-stops" aria-label="Stops in order">' + (stops.length ? '' : '<li class="muted pad">Add homes from the clients’ shortlists below.</li>') + '<li class="pl-o">' + ic('building', 15) + '<span>Start · ' + esc(R.office.name) + '</span><b>' + CK.time(PL.start) + '</b></li>' + stops.map(function (s, i) {
      var p = CK.prop(s.pid);
      return '<li class="pl-s" draggable="true" data-pli="' + i + '"><span class="grip" aria-hidden="true">' + ic('grip', 14) + '</span><span class="leg">' + sch.legs[i].leg + ' min</span><span class="pl-n">' + (i + 1) + '</span><img src="' + CK.ph(p.photos[0], 1) + '" alt="" width="44" height="32"><span class="grow"><b class="mono">' + p.code + '</b> ' + esc(CK.cfg(p)) + '<small>' + esc(CK.area(p.area).short) + ' · ' + CK.price(p) + ' · owner ' + esc(CK.owner(p.ownerId).name.split(' ').slice(0, 2).join(' ')) + '</small></span><b class="eta">' + CK.time(sch.legs[i].eta) + '</b><span class="pl-btns"><button type="button" class="ibtn" data-pl-up="' + i + '" aria-label="Move up"' + (i ? '' : ' disabled') + '>' + ic('up', 14) + '</button><button type="button" class="ibtn" data-pl-dn="' + i + '" aria-label="Move down"' + (i < stops.length - 1 ? '' : ' disabled') + '>' + ic('down', 14) + '</button><button type="button" class="ibtn" data-pl-rm="' + i + '" aria-label="Remove ' + p.code + '">' + ic('x', 14) + '</button></span></li>';
    }).join('') + (stops.length ? '<li class="pl-o">' + ic('check', 15) + '<span>Last visit ends</span><b>' + CK.time(sch.end) + '</b></li>' : '') + '</ol>';
    var add0 = '';
    var cand = []; PL.leads.forEach(function (l) { var L = CK.lead(l); L.shortlist.concat(CK.matches(L).slice(0, 6).map(function (m) { return m.p.id; })).forEach(function (pid) { if (PL.pids.indexOf(pid) < 0 && cand.indexOf(pid) < 0 && CK.prop(pid).r === PL.r) cand.push(pid); }); });
    if (PL.kind === 'verify') S().props.forEach(function (p) { var v = CK.ver(p); if (p.r === PL.r && (v === 'pending' || v === 'overdue' || v === 'due') && PL.pids.indexOf(p.id) < 0) cand.push(p.id); });
    if (!PL.leads.length && PL.kind !== 'verify') {
      var sug = S().leads.filter(function (L) { return ['requirement', 'matched', 'visit'].indexOf(L.stage) >= 0 && L.req.r === PL.r; }).slice(0, 8);
      add0 = '<section class="pl-add"><h3>Start with a client <small class="muted">their shortlist and best matches come along</small></h3><div class="pl-cand">' + sug.map(function (L) { return '<button type="button" class="cand" data-pl-lead="' + L.id + '">' + CK.av(L) + '<span><b>' + esc(L.name) + '</b><small>' + L.req.bhk.join('/') + ' BHK · ' + CK.budget(L) + ' · ' + esc(CK.stageLabel(L.stage)) + '</small></span>' + ic('plus', 14) + '</button>'; }).join('') + '</div><p class="muted sm" style="margin-top:8px">Or switch to a <button type="button" class="link-btn" data-pl="verifyrun">verification run</button> (no clients, listings due a check).</p></section>';
    }
    var add = (add0 || '') + '<section class="pl-add"><h3>Add homes <small class="muted">' + (PL.kind === 'verify' ? 'listings due for a check' : 'from the clients’ shortlists and matches') + '</small></h3><div class="pl-cand">' + (cand.slice(0, 10).map(function (pid) { var p = CK.prop(pid), m = PL.leads[0] ? CK.match(CK.lead(PL.leads[0]), p) : null; return '<button type="button" class="cand" data-pl-add="' + pid + '"><img src="' + CK.ph(p.photos[0], 1) + '" alt="" width="56" height="40" loading="lazy"><span><b class="mono">' + p.code + '</b><small>' + esc(CK.area(p.area).short) + ' · ' + CK.price(p) + '</small></span>' + (m ? CK.score(m.score) : '') + ic('plus', 14) + '</button>'; }).join('') || '<p class="muted sm">Nothing else to add.</p>') + '</div></section>';
    var sum = '<div class="pl-sum"><div><span class="muted sm">Driving</span><b>' + tot + ' min</b></div><div><span class="muted sm">Visits</span><b>' + stops.length + ' × ' + (PL.kind === 'verify' ? 25 : S().settings.visitMinutes) + ' min</b></div><div><span class="muted sm">Back by</span><b>' + CK.time(sch.end + (stops.length ? CK.legMin(CK.prop(PL.pids[PL.pids.length - 1]), R.office) * 6e4 : 0)) + '</b></div>' + (PL.pids.length > 2 ? '<button type="button" class="btn sm' + (opt < tot ? ' primary' : '') + '" data-pl="opt"' + (opt < tot ? '' : ' disabled') + '>' + ic('sparkles', 14) + (opt < tot ? 'Optimise route · saves ' + (tot - opt) + ' min' : 'Route is optimal') + '</button>' : '') + '</div>';
    return '<div class="ph"><div><a class="btn ghost sm" href="#/trips">' + ic('left', 14) + 'Trips</a><h1>Plan a ' + (PL.kind === 'verify' ? 'verification run' : 'trip') + '</h1><p class="muted">Pick the homes, put them in a sensible order, send it to the agent’s phone. Owners get a heads-up automatically.</p></div></div>' +
      '<div class="planner"><div class="pl-l">' + form + sum + list + add + '<div class="pl-go"><p class="err" id="pl-err" role="alert"></p><button type="button" class="btn primary big" data-pl="create">' + ic('nav', 16) + 'Create trip &amp; send to ' + esc(CK.agent(PL.agent).name.split(' ')[0]) + '’s phone</button></div></div><div class="pl-map" data-tour="tripmap">' + CK.map(PL.r, { stops: stops, legs: sch.legs.map(function (l) { return l.leg; }), label: 'Planned route', aspect: 0.85, pad: 140, minW: 520 }) + '<p class="map-cap">' + ic('pin', 13) + 'Stylised map · leg times assume city traffic (about 14 km/h) plus parking</p></div></div>';
  }
  function mountPlanner(el) {
    el.addEventListener('change', function (e) {
      if (e.target.id === 'pl-a') { PL.agent = e.target.value; CK.render(); }
      if (e.target.id === 'pl-d') { var t = new Date(e.target.value).getTime(); if (t) { PL.start = t; CK.render(); } }
    });
    el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-pl],[data-pl-up],[data-pl-dn],[data-pl-rm],[data-pl-add],[data-pl-rml],[data-pl-lead]'); if (!t) return; var d = t.dataset;
      if (d.plLead) { var Ln = CK.lead(d.plLead); PL.leads.push(Ln.id); PL.agent = Ln.field; if (!PL.pids.length) PL.pids = (Ln.shortlist.length ? Ln.shortlist : CK.matches(Ln).slice(0, 3).map(function (m) { return m.p.id; })).slice(0, 4); }
      if (d.pl === 'verifyrun') { PL.kind = 'verify'; PL.agent = PL.r === 'ggn' ? 'A8' : 'A10'; }
      if (d.plUp) { var i = +d.plUp; PL.pids.splice(i - 1, 0, PL.pids.splice(i, 1)[0]); }
      if (d.plDn) { var j = +d.plDn; PL.pids.splice(j + 1, 0, PL.pids.splice(j, 1)[0]); }
      if (d.plRm) PL.pids.splice(+d.plRm, 1);
      if (d.plAdd) PL.pids.push(d.plAdd);
      if (d.plRml) PL.leads = PL.leads.filter(function (x) { return x !== d.plRml; });
      if (d.pl === 'opt') { var R = CK.REGIONS[PL.r], before = PL.pids.slice(), b = CK.routeLen(R.office, PL.pids.map(CK.prop)); PL.pids = CK.orderStops(R.office, PL.pids.map(CK.prop)).map(function (p) { return p.id; }); var a = CK.routeLen(R.office, PL.pids.map(CK.prop)); CK.toast('Reordered — ' + (b - a) + ' min less driving', { icon: 'sparkles', undo: function () { PL.pids = before; CK.render(); } }); }
      if (d.pl === 'addlead') { CK.menu(t, S().leads.filter(function (L) { return L.req.r === PL.r && PL.leads.indexOf(L.id) < 0 && L.stage !== 'lost' && L.stage !== 'new'; }).slice(0, 12).map(function (L) { return { label: L.name + ' · ' + L.req.bhk.join('/') + ' BHK', id: L.id }; }), function (it) { PL.leads.push(it.id); CK.render(); }); return; }
      if (d.pl === 'create') {
        var err = el.querySelector('#pl-err');
        if (!PL.pids.length) { err.textContent = 'Add at least one home.'; return; }
        if (PL.kind !== 'verify' && !PL.leads.length) { err.textContent = 'Add the client this trip is for.'; return; }
        if (PL.start < CK.now() - 30 * 6e4) { err.textContent = 'That start time has passed — pick a time later today or another day.'; return; }
        var trip = CK.act.planTrip({ agent: PL.agent, start: PL.start, r: PL.r, leads: PL.leads, pids: PL.pids, kind: PL.kind });
        PL = null; CK.toast(trip.id + ' sent to ' + CK.agent(trip.agent).name.split(' ')[0] + '’s phone · ' + trip.stops.length + ' owners to notify', { icon: 'nav' }); CK.go('#/trips/' + trip.id); return;
      }
      CK.render();
    });
    var from = null;
    el.addEventListener('dragstart', function (e) { var li = e.target.closest('[data-pli]'); if (li) { from = +li.dataset.pli; li.classList.add('dragging'); } });
    el.addEventListener('dragover', function (e) { if (from != null && e.target.closest('[data-pli]')) e.preventDefault(); });
    el.addEventListener('drop', function (e) { var li = e.target.closest('[data-pli]'); if (!li || from == null) return; e.preventDefault(); var to = +li.dataset.pli; PL.pids.splice(to, 0, PL.pids.splice(from, 1)[0]); from = null; CK.render(); });
  }
  CK.resetPlanner = function () { PL = null; };

  /* ---------- trip detail / out now ---------- */
  var TD = { sim: null, live: true };
  function agentPos(t) {
    var R = CK.REGIONS[t.r], here = t.stops.filter(function (s) { return s.st === 'here'; })[0];
    if (here) return CK.xy(CK.prop(here.pid), t.r);
    var done = t.stops.filter(function (s) { return s.st === 'done' || s.st === 'missed'; }), next = t.stops.filter(function (s) { return s.st === 'togo'; })[0];
    var a = done.length ? CK.xy(CK.prop(done[done.length - 1].pid), t.r) : CK.xy(R.office, t.r);
    if (!next) return a; var b = CK.xy(CK.prop(next.pid), t.r);
    return [a[0] + (b[0] - a[0]) * .45, a[1] + (b[1] - a[1]) * .45];
  }
  function tripDetail(t) {
    if (!t) return CK.empty('Trip not found', '', '<a class="btn" href="#/trips">Back to trips</a>');
    var a = CK.agent(t.agent), sch = CK.schedule(t), now = CK.now();
    var cnt = { done: 0, togo: 0, missed: 0, here: 0 }; t.stops.forEach(function (s) { cnt[s.st]++; });
    var photos = t.stops.reduce(function (x, s) { return x + (s.photos || 0); }, 0);
    var verifyRun = t.kind === 'verify';
    var stepIdx = { planned: 0, waiting: 0, out: 1, done: 2, cancelled: 0 }[t.status];
    var eta = sch.end; if (t.status === 'out') { var remain = t.stops.filter(function (s) { return s.st === 'togo' || s.st === 'here'; }).length; eta = now + remain * (S().settings.visitMinutes + 9) * 6e4; }
    var canEdit = CK.can('trips.update') && (CK.role() !== 'field' || t.agent === CK.me().id);
    var head = '<div class="ph"><div><a class="btn ghost sm" href="#/trips">' + ic('left', 14) + 'Trips</a><h1><span class="mono">' + t.id + '</span> · ' + esc(a.name) + '</h1><p class="muted">' + CK.dayLabel(t.start) + ' ' + CK.time(t.start) + ' · ' + t.stops.length + ' stops' + (verifyRun ? ' · verification run' : ' · for ' + t.leads.map(function (l) { return esc(CK.lead(l).name); }).join(', ')) + ' · planned by ' + esc(CK.agent(t.by).name) + '</p></div><div class="ph-a">' + CK.tripPill(t) + (canEdit && (t.status === 'planned' || t.status === 'waiting') ? '<button type="button" class="btn" data-td="cancel">Cancel trip</button>' : '') + (canEdit && t.status === 'out' ? '<button type="button" class="btn" data-td="finish">Finish trip</button>' : '') + '<a class="btn" href="field.html#/trip/' + t.id + '">' + ic('phone', 15) + 'Open on phone</a></div></div>' +
      CK.stepper([{ label: 'Planned' }, { label: 'Out now' }, { label: 'Done' }], stepIdx, { label: 'Trip status' });
    var tiles = '<div class="tiles"><div class="tile"><span>' + (verifyRun ? 'Checked' : 'Visited') + '</span><b>' + cnt.done + '<small> of ' + t.stops.length + '</small></b></div><div class="tile"><span>At a stop now</span><b>' + cnt.here + '</b></div><div class="tile"><span>Couldn’t get in</span><b>' + cnt.missed + '</b></div><div class="tile"><span>Photos</span><b>' + photos + '</b></div></div>';
    var prog = '<div class="trip-prog"><div class="prog"><span style="width:' + ((cnt.done + cnt.missed) / t.stops.length * 100) + '%"></span></div>' + (t.status === 'out' ? '<p><b class="tx-ok">On track — done by about ' + CK.time(eta) + '</b> · ' + (cnt.togo + cnt.here) + ' to go · ' + Math.max(0, Math.round((CK.dayStart(now) + 18.5 * 36e5 - now) / 6e4 / 60 * 10) / 10) + ' h of daylight left</p>' : t.status === 'done' ? '<p class="muted">Finished ' + (t.endedAt ? CK.time(t.endedAt) : '') + '</p>' : t.status === 'cancelled' ? '<p class="muted">' + esc(t.cancelReason || 'Cancelled') + '</p>' : '<p class="muted">Leaves ' + CK.time(t.start) + ' · back by ' + CK.time(sch.end + 20 * 6e4) + '</p>') + '</div>';
    var stops = '<ol class="stops">' + t.stops.map(function (s, i) {
      var p = CK.prop(s.pid), res;
      if (s.st === 'done') res = verifyRun ? (s.out.verify && s.out.verify.v === 'notavail' ? '<b class="tx-bad">Not available</b>' : '<b class="tx-ok">Verified ' + CK.hm(s.doneAt || s.at) + '</b>') : Object.keys(s.out).map(function (lid) { var o = s.out[lid]; return CK.pill({ liked: 'Liked', short: 'Shortlisted', rejected: 'Rejected · ' + (o.reason || ''), novisit: 'Not visited' }[o.v], { liked: 'green', short: 'violet', rejected: 'red', novisit: 'grey' }[o.v]); }).join('');
      else if (s.st === 'missed') res = '<b class="tx-bad">Couldn’t get in</b>';
      else if (s.st === 'here') res = '<b class="tx-live">● ' + esc(a.name.split(' ')[0]) + ' is here · ' + CK.ago(s.at) + '</b>';
      else res = '<span class="muted">ETA ' + CK.time(sch.legs[i].eta) + '</span>';
      return '<li class="stop st-' + s.st + '"><span class="snum">' + (s.st === 'done' ? ic('check', 13) : i + 1) + '</span><img src="' + CK.ph(p.photos[0], 1) + '" alt="" width="56" height="40" loading="lazy"><div class="grow"><button type="button" class="linkish" data-peek="prop:' + p.id + '"><b class="mono">' + p.code + '</b> · ' + esc(CK.cfg(p)) + '</button><small class="muted">' + esc(p.plot) + ', ' + esc(CK.area(p.area).short) + ' · ' + CK.price(p) + (s.geo ? ' · pin ' + s.geo + ' m' : '') + (s.photos ? ' · ' + s.photos + ' photos' : '') + '</small></div><div class="sres">' + res + '</div>' + (canEdit && t.status !== 'cancelled' ? '<div class="sact">' + (s.st === 'togo' ? '<button type="button" class="btn sm" data-td="checkin" data-i="' + i + '">' + ic('pin', 14) + 'Check in</button>' : '') + (s.st === 'here' || s.st === 'togo' ? '<button type="button" class="btn sm primary" data-td="outcome" data-i="' + i + '">' + (verifyRun ? 'Verify' : 'Visit outcome') + '</button>' : '<button type="button" class="btn sm ghost" data-td="outcome" data-i="' + i + '">Edit</button>') + '</div>' : '') + '</li>';
    }).join('') + '</ol>';
    var feed = '<section class="card"><div class="card-h"><h3>Live from the field</h3>' + (t.status === 'out' ? '<label class="switch"><input type="checkbox" data-td="live"' + (TD.live ? ' checked' : '') + '><span></span>Auto-refresh</label>' : '') + '</div><ol class="feed" aria-live="polite">' + (t.feed.length ? t.feed.slice(0, 12).map(function (f) { return '<li><time>' + CK.hm(f.at) + '</time><span>' + esc(f.text) + '</span></li>'; }).join('') : '<li class="muted">Nothing yet — the feed fills in as ' + esc(a.name.split(' ')[0]) + ' checks in.</li>') + '</ol></section>';
    var who = verifyRun ? '' : '<section class="card"><div class="card-h"><h3>Who it’s for</h3></div>' + t.leads.map(function (l) { var L = CK.lead(l); return '<div class="row-b">' + CK.chipLead(L) + '<span class="grow"></span>' + CK.stagePill(L) + '</div><p class="muted sm">' + CK.wants(L) + '</p>'; }).join('') + '</section>';
    var steps = '<section class="card"><div class="card-h"><h3>At every stop</h3></div><ol class="howto"><li>Check in — the pin is saved even with no signal</li><li>Photos and the main details go straight onto the listing</li><li>Visit result: liked, shortlisted or rejected with a reason</li></ol></section>';
    return head + '<div class="trip-g"><div>' + tiles + prog + stops + '</div><aside><div class="trip-map">' + CK.map(t.r, { stops: t.stops, legs: sch.legs.map(function (l) { return l.leg; }), agent: t.status === 'out' ? agentPos(t) : null, label: 'Route of ' + t.id, aspect: 1.45 }) + '</div>' + feed + who + steps + '</aside></div>';
  }
  function mountDetail(el, t) {
    if (!t) return;
    clearInterval(TD.sim);
    if (t.status === 'out' && TD.live) TD.sim = setInterval(function () { simStep(t.id); }, 9000);
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-td]'); if (!b || b.tagName === 'INPUT') return; var i = +b.dataset.i;
      if (b.dataset.td === 'checkin') { CK.act.checkIn(t, i, 10 + Math.round(Math.random() * 40)); CK.toast('Checked in at ' + CK.prop(t.stops[i].pid).code, { icon: 'pin' }); }
      if (b.dataset.td === 'outcome') CK.outcomeForm(t, i);
      if (b.dataset.td === 'finish') CK.confirm('Finish ' + t.id + '?', 'Stops still “to go” are marked as not visited.', 'Finish trip', function () { t.stops.forEach(function (s, k) { if (s.st === 'togo' || s.st === 'here') { var out = {}; (s.leads.length ? s.leads : ['verify']).forEach(function (l) { out[l] = { v: 'novisit' }; }); CK.act.outcome(t, k, out, 'Trip finished early'); } }); CK.act.tripStatus(t, 'done'); });
      if (b.dataset.td === 'cancel') CK.confirm('Cancel ' + t.id + '?', 'The client and owners will need a new slot.', 'Cancel trip', function () { t.cancelReason = 'Cancelled by ' + CK.me().name; CK.act.tripStatus(t, 'cancelled'); CK.toast(t.id + ' cancelled', { undo: function () { t.status = 'planned'; CK.emit('trip'); } }); }, 'danger');
    });
    el.addEventListener('change', function (e) { if (e.target.dataset.td === 'live') { TD.live = e.target.checked; CK.render(); } });
  }
  function simStep(id) {
    var t = CK.trip(id); if (!t || t.status !== 'out' || document.hidden) return;
    var here = t.stops.map(function (s, i) { return [s, i]; }).filter(function (x) { return x[0].st === 'here'; })[0];
    if (here) {
      var s = here[0];
      if ((s.photos || 0) < 4) { CK.act.photo(t, here[1], 2); return; }
      if (t.kind === 'verify') { CK.act.outcome(t, here[1], { verify: { v: 'verified' } }); var p = CK.prop(s.pid); p.ver.at = CK.now(); p.ver.by = t.agent; p.ver.photos = s.photos; CK.emit('verify'); return; }
      var out = {}; s.leads.forEach(function (l, k) { out[l] = { v: k % 2 ? 'liked' : (Math.random() < .5 ? 'short' : 'rejected'), reason: 'Poor light' }; });
      CK.act.outcome(t, here[1], out); return;
    }
    var nx = t.stops.map(function (s, i) { return [s, i]; }).filter(function (x) { return x[0].st === 'togo'; })[0];
    if (nx) CK.act.checkIn(t, nx[1], 8 + Math.round(Math.random() * 40));
  }

  /* ---------- visit outcome (shared with the field app) ---------- */
  CK.outcomeForm = function (t, i, opts) {
    opts = opts || {};
    var s = t.stops[i], p = CK.prop(s.pid), verifyRun = t.kind === 'verify';
    var st = {}; (s.leads || []).forEach(function (l) { st[l] = s.out[l] ? JSON.parse(JSON.stringify(s.out[l])) : { v: null, reason: '' }; });
    function body() {
      if (verifyRun) return '<fieldset class="oc"><legend>Result</legend><div class="oc-b">' + [['verified', 'Verified'], ['notavail', 'Not available'], ['novisit', 'Couldn’t get in']].map(function (x) { return '<button type="button" data-v="' + x[0] + '" data-l="verify" class="' + ((st.verify || {}).v === x[0] ? 'on' : '') + '" aria-pressed="' + ((st.verify || {}).v === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div></fieldset>';
      return Object.keys(st).map(function (l) {
        var L = CK.lead(l), o = st[l];
        return '<fieldset class="oc"><legend>' + CK.av(L, 's') + esc(L.name) + '</legend><div class="oc-b two"><button type="button" data-v="visited" data-l="' + l + '" class="' + (o.v && o.v !== 'novisit' ? 'on' : '') + '" aria-pressed="' + !!(o.v && o.v !== 'novisit') + '">' + ic('check', 15) + 'Visited</button><button type="button" data-v="novisit" data-l="' + l + '" class="' + (o.v === 'novisit' ? 'on' : '') + '" aria-pressed="' + (o.v === 'novisit') + '">' + ic('x', 15) + 'Not visited</button></div>' +
          (o.v && o.v !== 'novisit' ? '<div class="oc-b three">' + [['liked', 'Liked it', 'heart'], ['short', 'Shortlist', 'star'], ['rejected', 'Rejected', 'thumbsdown']].map(function (x) { return '<button type="button" data-v="' + x[0] + '" data-l="' + l + '" class="' + (o.v === x[0] ? 'on v-' + x[0] : '') + '" aria-pressed="' + (o.v === x[0]) + '">' + ic(x[2], 15) + x[1] + '</button>'; }).join('') + '</div>' : '') +
          (o.v === 'rejected' ? '<div class="reasons" role="group" aria-label="Reason">' + CK.REJECT_REASONS.map(function (r) { return '<button type="button" data-r="' + r + '" data-l="' + l + '" class="' + (o.reason === r ? 'on' : '') + '" aria-pressed="' + (o.reason === r) + '">' + r + '</button>'; }).join('') + '</div>' : '') + '</fieldset>';
      }).join('');
    }
    var m = CK.modal('<h2 id="modal-t">' + (verifyRun ? 'Verify ' : 'Visit outcome · ') + p.code + '</h2><p class="muted sm">' + esc(CK.cfg(p)) + ' · ' + esc(p.plot) + ', ' + esc(CK.area(p.area).short) + ' · nothing is pre-picked</p><div id="oc-body">' + body() + '</div><div class="fld"><label for="oc-n">Closing note <span class="muted">· optional</span></label><textarea id="oc-n" rows="2" placeholder="Anything the next person needs to know…">' + esc(s.note || '') + '</textarea></div><div class="oc-ph"><button type="button" class="btn sm" id="oc-ph">' + ic('camera', 14) + 'Add photos</button><span class="muted sm" id="oc-phn">' + (s.photos || 0) + ' photos</span></div>' + (verifyRun ? '' : '<div class="owner-note">' + ic('chat', 14) + '<span>The owner, ' + esc(CK.owner(p.ownerId).name) + ', gets a WhatsApp template with the result — review it under Owners.</span></div>') + '<p class="err" id="oc-err" role="alert"></p><div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn primary" id="oc-ok">Save outcome</button></div>', { wide: !opts.sheet });
    if (opts.sheet) m.classList.add('sheet');
    m.addEventListener('click', function (e) {
      var b = e.target.closest('[data-v],[data-r]'); if (b) { var l = b.dataset.l; if (!st[l]) st[l] = { v: null }; if (b.dataset.r) st[l].reason = b.dataset.r; else if (b.dataset.v === 'visited') st[l].v = st[l].v && st[l].v !== 'novisit' ? st[l].v : 'liked'; else st[l].v = b.dataset.v; m.querySelector('#oc-body').innerHTML = body(); return; }
      if (e.target.closest('#oc-ph')) { CK.act.photo(t, i, 3); m.querySelector('#oc-phn').textContent = (s.photos || 0) + ' photos'; }
      if (e.target.closest('#oc-ok')) {
        var miss = Object.keys(st).filter(function (l) { return !st[l].v; }); if (verifyRun && !st.verify) miss = ['x'];
        if (miss.length) { m.querySelector('#oc-err').textContent = verifyRun ? 'Pick a result.' : 'Mark Visited or Not visited for everyone.'; return; }
        var rj = Object.keys(st).filter(function (l) { return st[l].v === 'rejected' && !st[l].reason; }); if (rj.length) { m.querySelector('#oc-err').textContent = 'Pick a reason for the rejection — it helps the next match.'; return; }
        var note = m.querySelector('#oc-n').value.trim();
        CK.act.outcome(t, i, st, note);
        if (verifyRun && st.verify.v === 'verified') { p.ver = { status: 'verified', at: CK.now(), by: t.agent, checks: { owner: 1, config: 1, photos: 1, price: 1, avail: 1, geo: 1, docs: p.deal === 'sale' ? 1 : 0, parking: 1 }, geo: { m: s.geo || 20 }, photos: Math.max(6, s.photos || 0) }; CK.emit('verify'); }
        if (verifyRun && st.verify.v === 'notavail') { p.status = p.deal === 'rent' ? 'let' : 'sold'; CK.emit('prop'); }
        CK.closeModal(); CK.toast('Outcome saved · ' + p.code + (verifyRun ? '' : ' · owner message ready'));
        if (opts.done) opts.done();
      }
    });
  };
})();
