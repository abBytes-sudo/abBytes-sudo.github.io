/* Fieldwise — Today, Leads (table, board, saved views, bulk), the lead panel (requirement, matches, timeline). */
(function () {
  'use strict';
  var CK = window.CK, esc = CK.esc, ic = CK.ic;
  function S() { return CK.S(); }
  var SRC_IC = { Basera: 'building', KeyHaat: 'key', Website: 'ext', WhatsApp: 'chat', 'Walk-in': 'door', Partner: 'partner', 'Website chat': 'sparkles', 'Launch site': 'flag' };
  CK.srcChip = function (s) { return '<span class="src">' + ic(SRC_IC[s] || 'spark', 14) + esc(s) + '</span>'; };
  function endOfToday() { return CK.dayStart(CK.now()) + CK.DAY - 1; }
  function openTasks(who) { return S().tasks.filter(function (t) { return !t.done && (!who || t.who === who); }); }
  CK.openTasks = openTasks;
  function greet() { var h = new Date(CK.now()).getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }

  /* ============ TODAY ============ */
  CK.V.today = {
    title: 'Today',
    render: function () {
      var role = CK.role(), me = CK.me(), s = S(), now = CK.now(), eod = endOfToday(), d0 = CK.dayStart(now);
      if (role === 'partner') { location.hash = '#/partner'; return ''; }
      var mine = role === 'telecaller' || role === 'field' ? me.id : null;
      var tasks = openTasks(mine);
      var callsDue = tasks.filter(function (t) { return (t.kind === 'call' || t.kind === 'followup') && t.due <= eod; });
      var overdue = callsDue.filter(function (t) { return t.due < now; });
      var newLeads = s.leads.filter(function (L) { return L.stage === 'new' && (role !== 'telecaller' || L.owner === me.id); });
      var todayTrips = s.trips.filter(function (t) { return CK.dayStart(t.start) === d0 && t.status !== 'cancelled' && (role !== 'field' || t.agent === me.id); });
      var verifs = s.props.filter(function (p) { var v = CK.ver(p); return (v === 'pending' || v === 'overdue' || v === 'due') && p.status !== 'let' && p.status !== 'sold'; });
      var dealsDocs = s.deals.filter(function (d) { return ['token', 'agreement', 'movein', 'registry'].indexOf(d.stage) >= 0 && CK.docsFor(d.kind).some(function (x) { return !d.docs[x[0]]; }) && (role !== 'field' || d.agent === me.id); });
      var msgs = s.msgs.filter(function (m) { return !m.sent; });
      var out = todayTrips.filter(function (t) { return t.status === 'out'; });
      var dd = new Date(now);
      function kpi(o) { var up = o.delta > 0, tone = o.goodUp ? (up ? 'ok' : 'bad') : (up ? 'bad' : 'ok'); return '<a class="ktile' + (o.tone ? ' k-' + o.tone : '') + '" href="' + o.href + '"' + (o.tour ? ' data-tour="' + o.tour + '"' : '') + '><span class="kt-l">' + ic(o.icon, 15) + esc(o.t) + '</span><span class="kt-n">' + o.n + '</span><span class="kt-d">' + (o.delta ? '<b class="tx-' + tone + '">' + (up ? '▲' : '▼') + Math.abs(o.delta) + '</b> ' : '') + esc(o.sub) + '</span>' + CK.spark(o.spark, 76, 22) + '</a>'; }
      var y = function (n) { return Math.max(0, n); };
      var tiles = {
        newl: kpi({ icon: 'sparkles', t: 'New leads', n: newLeads.length, delta: newLeads.length - 7, sub: 'vs yesterday', spark: [5, 8, 6, 9, 7, 7, newLeads.length], href: '#/leads/v:new', tone: 'accent', tour: 'newleads', goodUp: true }),
        calls: kpi({ icon: 'phone', t: 'Calls due', n: callsDue.length, delta: 0, sub: overdue.length + ' overdue', spark: [30, 28, 35, 31, 29, 33, callsDue.length], href: '#/calling', tone: overdue.length ? 'bad' : '' }),
        trips: kpi({ icon: 'route', t: 'Trips today', n: todayTrips.length, delta: 0, sub: out.length + ' out now', spark: [2, 3, 2, 4, 3, 2, todayTrips.length], href: '#/trips' }),
        ver: kpi({ icon: 'shield', t: 'To verify', n: verifs.length, delta: y(verifs.length - 22), sub: 'new + past the check', spark: [18, 20, 21, 19, 22, 22, verifs.length], href: '#/verify', tone: 'amber' }),
        docs: kpi({ icon: 'file', t: 'Papers pending', n: dealsDocs.length, delta: 0, sub: 'deals past token', spark: [4, 5, 5, 6, 6, 7, dealsDocs.length], href: '#/deals' }),
        msgs: kpi({ icon: 'chat', t: 'Owner updates', n: msgs.length, delta: 0, sub: 'visit feedback to send', spark: [2, 1, 3, 2, 4, 3, msgs.length], href: '#/owners' })
      };
      var order = role === 'telecaller' ? ['newl', 'calls', 'trips', 'msgs'] : role === 'field' ? ['trips', 'ver', 'docs', 'msgs'] : ['newl', 'calls', 'trips', 'ver', 'docs', 'msgs'];

      // needs you now: one line each, with the reason
      var needs = [];
      newLeads.filter(function (L) { return now - L.created > 15 * 6e4; }).sort(function (a, b) { return a.created - b.created; }).slice(0, 3).forEach(function (L) { needs.push({ who: CK.chipLead(L), why: 'New lead from ' + L.src + ', ' + CK.ago(L.created).replace(' ago', '') + ' without a first call', act: '<a class="btn sm primary" href="#/calling/Q1/' + L.id + '">' + ic('phone', 14) + 'Call</a>', tone: 'bad' }); });
      s.props.filter(function (p) { return p.status === 'hold' && p.holdUntil && p.holdUntil - now < 8 * 36e5; }).slice(0, 2).forEach(function (p) { var L = CK.lead(p.holdFor); needs.push({ who: CK.chipProp(p), why: 'Hold for ' + (L ? L.name.split(' ')[0] : 'a client') + ' auto-releases ' + CK.ago(p.holdUntil), act: '<button type="button" class="btn sm" data-peek="prop:' + p.id + '">Review hold</button>', tone: 'amber' }); });
      dealsDocs.filter(function (d) { return !d.docs[d.kind === 'rent' ? 'police' : 'title']; }).slice(0, 2).forEach(function (d) { needs.push({ who: CK.chipDeal(d), why: (d.kind === 'rent' ? 'Police verification' : 'Title check') + ' still open, token paid ' + (d.token ? CK.ago(d.token.at) : ''), act: '<button type="button" class="btn sm" data-peek="deal:' + d.id + '">Open deal</button>', tone: 'amber' }); });
      verifs.filter(function (p) { return CK.ver(p) === 'pending'; }).sort(function (a, b) { return a.created - b.created; }).slice(0, 2).forEach(function (p) { needs.push({ who: CK.chipProp(p), why: 'New listing waiting ' + CK.ago(p.created).replace(' ago', '') + ' for a field check — off the website till then', act: '<a class="btn sm" href="#/verify/' + p.id + '">Check</a>' }); });
      msgs.slice(0, 1).forEach(function (m) { needs.push({ who: CK.chipOwner(CK.owner(m.owner)), why: 'Visit feedback on ' + CK.prop(m.pid).code + ' not sent yet', act: '<a class="btn sm" href="#/owners">Send</a>' }); });
      var needHtml = needs.length ? '<ul class="needs">' + needs.slice(0, 8).map(function (n) { return '<li class="' + (n.tone ? 'n-' + n.tone : '') + '"><span class="nd-dot"></span><span class="nd-w">' + n.who + '</span><span class="nd-r">' + esc(n.why) + '</span>' + n.act + '</li>'; }).join('') + '</ul>' : '<p class="muted pad">Nothing urgent. Good time to work the callback queue.</p>';

      // now and next
      var nn = [];
      todayTrips.forEach(function (t) { nn.push({ at: t.start, t: CK.agent(t.agent).name.split(' ')[0] + ' · ' + t.stops.length + ' stops', k: t.status === 'out' ? 'live' : t.status, href: '#/trips/' + t.id, ic: 'route' }); });
      tasks.filter(function (t) { return t.due >= now - 30 * 6e4 && t.due <= eod; }).sort(function (a, b) { return a.due - b.due; }).slice(0, 6).forEach(function (t) { var L = t.lead ? CK.lead(t.lead) : null; nn.push({ at: t.due, t: t.title + (L ? ' · ' + L.name.split(' ')[0] : ''), k: 'task', href: L ? '#/today~lead:' + L.id : '#/today', ic: t.kind === 'verify' ? 'shield' : 'phone' }); });
      nn.sort(function (a, b) { return a.at - b.at; });
      var strip = '<ul class="nownext">' + (nn.length ? nn.slice(0, 9).map(function (x) { return '<li><a class="nn' + (x.at < now ? ' past' : '') + (x.k === 'live' ? ' live' : '') + '" href="' + x.href + '"><time>' + CK.hm(x.at) + '</time>' + ic(x.ic, 14) + '<span>' + esc(x.t) + '</span></a></li>'; }).join('') : '<li class="muted">Nothing else scheduled today.</li>') + '</ul>';

      // queue
      var grp = { Overdue: [], Today: [], Later: [] };
      tasks.filter(function (t) { return role !== 'admin' && role !== 'manager' ? true : t.kind !== 'verify'; }).sort(function (a, b) { return a.due - b.due; }).forEach(function (t) { (t.due < now ? grp.Overdue : t.due <= eod ? grp.Today : grp.Later).push(t); });
      grp.Later = grp.Later.slice(0, 5);
      var q = Object.keys(grp).map(function (g) {
        if (!grp[g].length) return ''; var list = grp[g].slice(0, g === 'Overdue' ? 5 : 7);
        return '<div class="tgrp"><div class="tgrp-h"><span>' + g + '</span><b>' + grp[g].length + '</b>' + (g === 'Overdue' && grp[g].length > 1 ? '<button type="button" class="link-btn" data-act="resched-all">Reschedule all to 5 pm</button>' : '') + '</div>' + list.map(taskRow).join('') + '</div>';
      }).join('') || CK.empty('All clear', 'No open tasks. New leads and trip feedback will land here.');

      var live = out.length ? out.map(function (t) {
        var done = t.stops.filter(function (x) { return x.st === 'done' || x.st === 'missed'; }).length, here = t.stops.filter(function (x) { return x.st === 'here'; })[0];
        return '<a class="live" href="#/trips/' + t.id + '"><div class="live-map">' + CK.map(t.r, { stops: t.stops, label: 'Route for ' + t.id, aspect: 1.25, pad: 60, minW: 260 }) + '</div><div class="live-b"><div class="row-b">' + CK.av(CK.agent(t.agent)) + '<b>' + esc(CK.agent(t.agent).name) + '</b>' + CK.tripPill(t) + '</div><div class="prog"><span style="width:' + (done / t.stops.length * 100) + '%"></span></div><p class="muted sm">' + done + ' of ' + t.stops.length + ' stops' + (here ? ' · at ' + CK.prop(here.pid).code + ' now' : '') + (t.kind === 'verify' ? ' · verification run' : '') + '</p><p class="feed1">' + esc((t.feed[0] || {}).text || '') + ' <span class="muted">· ' + CK.ago((t.feed[0] || {}).at || now) + '</span></p></div></a>';
      }).join('') : '<p class="muted pad">No one is out right now.</p>';
      var acts = s.audit.slice(0, 8).map(function (a) { var w = CK.agent(a.who) || CK.partner(a.who); return '<li>' + (w ? CK.av(w, 's') : '') + '<span><b>' + esc(w ? w.name.split(' ')[0] : 'System') + '</b> ' + esc(a.action.toLowerCase()) + ' <span class="mono">' + esc(a.ref || '') + '</span></span><time>' + CK.ago(a.at) + '</time></li>'; }).join('');

      return '<div class="today">' +
        '<header class="greet"><div><h1>' + greet() + ', ' + esc(me.name.split(' ')[0]) + '</h1><p class="muted">' + CK.WD[dd.getDay()] + ' ' + dd.getDate() + ' ' + CK.MON[dd.getMonth()] + ' · ' + esc(me.title) + (out.length ? ' · ' + out.length + ' trip' + (out.length > 1 ? 's' : '') + ' out now' : '') + '</p></div>' +
        '<div class="hello-a">' + (role === 'field' ? '<a class="btn primary" href="field.html">' + ic('phone', 16) + 'Open field app</a>' : role === 'telecaller' ? '<a class="btn primary" href="#/calling">' + ic('play', 16) + 'Start calling</a>' : '<a class="btn" href="#/trips/new">' + ic('route', 16) + 'Plan a trip</a><button type="button" class="btn primary" data-act="new-lead">' + ic('plus', 16) + 'New lead</button>') + '</div></header>' +
        '<section aria-label="Key numbers" class="ktiles">' + order.map(function (k) { return tiles[k]; }).join('') + '</section>' +
        '<section class="nn-wrap" aria-labelledby="nn-h"><h2 id="nn-h" class="sr">Now and next</h2>' + strip + '</section>' +
        '<div class="today-g"><div class="col"><section class="panel" aria-labelledby="nd-h"><div class="panel-h"><h2 id="nd-h">Needs you now</h2><span class="muted sm">' + needs.length + ' items · oldest first</span></div>' + needHtml + '</section>' +
        '<section class="panel" aria-labelledby="q-h"><div class="panel-h"><h2 id="q-h">' + (mine ? 'Your queue' : 'Team queue') + '</h2><span class="muted sm">' + tasks.length + ' open</span></div><div class="tasks">' + q + '</div></section></div>' +
        '<div class="col"><section class="panel" aria-labelledby="lv-h" data-tour="live"><div class="panel-h"><h2 id="lv-h">Live from the field</h2><a class="link-btn" href="#/trips">All trips' + ic('right', 14) + '</a></div>' + live + '</section>' +
        '<section class="panel" aria-labelledby="ac-h"><div class="panel-h"><h2 id="ac-h">Activity</h2><a class="link-btn" href="#/audit">Full log' + ic('right', 14) + '</a></div><ol class="acts">' + acts + '</ol></section></div></div></div>';
    },
    mount: function (el) {
      el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act="resched-all"]'); if (!b) return;
        var now = CK.now(), ids = openTasks(CK.role() === 'telecaller' || CK.role() === 'field' ? CK.me().id : null).filter(function (t) { return t.due < now; }).map(function (t) { return t.id; });
        var old = {}; S().tasks.forEach(function (t) { if (ids.indexOf(t.id) >= 0) old[t.id] = t.due; });
        CK.act.reschedule(ids, CK.dayStart(now) + 17 * 36e5);
        CK.toast(ids.length + ' tasks moved to today, 5 pm', { undo: function () { S().tasks.forEach(function (t) { if (old[t.id]) t.due = old[t.id]; }); CK.emit('task'); } });
      });
    }
  };
  function taskRow(t) {
    var L = t.lead ? CK.lead(t.lead) : null, p = t.prop ? CK.prop(t.prop) : null, now = CK.now();
    var kic = { call: 'phone', followup: 'chat', visit: 'route', verify: 'shield', docs: 'file', owner: 'key', collect: 'rupee' }[t.kind] || 'check';
    var late = t.due < now;
    var lastCall = L ? L.tl.filter(function (e) { return e.kind === 'call'; })[0] : null;
    return '<div class="task' + (t.done ? ' is-done' : '') + '"><label class="tcheck"><input type="checkbox" data-task="' + t.id + '"' + (t.done ? ' checked' : '') + '><span class="sr">Mark “' + esc(t.title) + '” done</span><span class="box">' + ic('check', 12) + '</span></label><span class="task-ic">' + ic(kic, 15) + '</span><div class="task-b"><span class="task-t">' + esc(t.title) + '</span><span class="task-m">' + (L ? CK.chipLead(L) : '') + (p ? CK.chipProp(p) : '') + (t.trip ? CK.chipTrip(CK.trip(t.trip)) : '') + (t.deal ? CK.chipDeal(CK.deal(t.deal)) : '') + (lastCall && !t.done ? '<span class="muted sm tr">Last: ' + esc(lastCall.text.replace(/^Call · /, '')) + '</span>' : '') + '</span></div><span class="due' + (late ? ' late' : '') + '">' + (late ? CK.ago(t.due).replace(' ago', ' late') : CK.dayLabel(t.due) === 'Today' ? CK.time(t.due) : CK.dayLabel(t.due)) + '</span>' + CK.chipAgent(CK.agent(t.who)) + (L && (t.kind === 'call' || t.kind === 'followup') ? '<a class="ibtn hov" href="#/calling/Q2/' + L.id + '" aria-label="Call ' + esc(L.name) + '">' + ic('phone', 15) + '</a>' : '') + '</div>';
  }
  CK.taskRow = taskRow;
  document.addEventListener('change', function (e) {
    var cb = e.target.closest('input[data-task]'); if (!cb) return;
    var t = S().tasks.filter(function (x) { return x.id === cb.dataset.task; })[0]; if (!t) return;
    CK.act.task(t, cb.checked);
    if (cb.checked) CK.toast('Done — “' + t.title + '”', { undo: function () { CK.act.task(t, false); } });
  });

  /* ============ LEADS ============ */
  var LV = { q: '', stage: '', src: '', owner: '', region: '', view: 'all', mode: 'table', sel: {} };
  var VIEWS = [
    { id: 'all', label: 'All open', f: function (L) { return L.stage !== 'lost'; } },
    { id: 'mine', label: 'My leads', f: function (L) { return L.owner === CK.me().id || L.field === CK.me().id; } },
    { id: 'new', label: 'New today', f: function (L) { return L.created >= CK.dayStart(CK.now()); } },
    { id: 'visit', label: 'Visiting this week', f: function (L) { return S().trips.some(function (t) { return t.leads.indexOf(L.id) >= 0 && t.start >= CK.dayStart(CK.now()) && t.start < CK.now() + 7 * CK.DAY && t.status !== 'cancelled'; }); } },
    { id: 'rent', label: 'Rent', f: function (L) { return L.intent === 'rent' && L.stage !== 'lost'; } },
    { id: 'buy', label: 'Buy', f: function (L) { return L.intent === 'buy' && L.stage !== 'lost'; } },
    { id: 'partner', label: 'From partners', f: function (L) { return !!L.partnerId; } },
    { id: 'lost', label: 'Lost', f: function (L) { return L.stage === 'lost'; } }
  ];
  function saved() { return CK.ui.views || []; }
  function filtered() {
    var v = VIEWS.filter(function (x) { return x.id === LV.view; })[0], sv = saved().filter(function (x) { return x.id === LV.view; })[0];
    var role = CK.role(), me = CK.me();
    return S().leads.filter(function (L) {
      if (role === 'telecaller' && L.owner !== me.id && LV.view !== 'all') { }
      if (v && !v.f(L)) return false;
      if (sv) { var f = sv.f; if (f.stage && L.stage !== f.stage) return false; if (f.src && L.src !== f.src) return false; if (f.owner && L.owner !== f.owner) return false; if (f.region && L.req.r !== f.region) return false; if (f.q && (L.name + L.id).toLowerCase().indexOf(f.q) < 0) return false; }
      if (LV.stage && L.stage !== LV.stage) return false; if (LV.src && L.src !== LV.src) return false; if (LV.owner && L.owner !== LV.owner && L.field !== LV.owner) return false; if (LV.region && L.req.r !== LV.region) return false;
      if (LV.q) { var hay = (L.name + ' ' + L.id + ' ' + L.req.sectors.map(function (s) { return CK.area(s).name; }).join(' ') + ' ' + L.src + ' ' + L.req.bhk.join(' ') + 'bhk').toLowerCase(); if (!LV.q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; })) return false; }
      return true;
    }).sort(function (a, b) { return (b.last || b.created) - (a.last || a.created); });
  }
  function wants(L) { var sec = L.req.sectors.map(function (s) { return CK.area(s).short; }); return '<span class="wants"><b>' + L.req.bhk.join('/') + ' BHK</b> · ' + (L.intent === 'rent' ? 'rent' : 'buy') + ' ≤ ' + CK.budget(L) + '<span class="muted"> · ' + esc(sec.slice(0, 2).join(', ')) + (sec.length > 2 ? ' +' + (sec.length - 2) : '') + '</span></span>'; }
  CK.wants = wants;
  function miniStep(L) { var i = ['new', 'contacted', 'requirement', 'matched', 'visit', 'deal'].indexOf(L.stage); return '<span class="ministep" aria-hidden="true">' + [0, 1, 2, 3, 4, 5].map(function (k) { return '<i class="' + (k <= i ? 'on' : '') + '"></i>'; }).join('') + '</span>'; }
  function sel(name, label, opts, val) { return '<label class="fsel"><span class="sr">' + label + '</span><select data-f="' + name + '"><option value="">' + label + '</option>' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>'; }

  CK.V.leads = {
    title: 'Leads',
    render: function (r) {
      if (r.id && r.id.indexOf('v:') === 0 && LV.fromHash !== r.id) { LV.view = r.id.slice(2); LV.fromHash = r.id; }
      var list = filtered(), allViews = VIEWS.concat(saved().map(function (s) { return { id: s.id, label: s.label, saved: 1 }; }));
      var counts = {}; VIEWS.forEach(function (v) { counts[v.id] = S().leads.filter(v.f).length; });
      var dirty = LV.q || LV.stage || LV.src || LV.owner || LV.region;
      var head = '<div class="ph"><div><h1>Leads</h1><p class="muted">' + list.length + ' of ' + S().leads.length + ' · every enquiry from Basera, KeyHaat, the website, WhatsApp, walk-ins and partners</p></div><div class="ph-a"><div class="seg" role="group" aria-label="Layout"><button type="button" data-mode="table" aria-pressed="' + (LV.mode === 'table') + '">' + ic('list', 15) + '<span>Table</span></button><button type="button" data-mode="board" aria-pressed="' + (LV.mode === 'board') + '">' + ic('board', 15) + '<span>Board</span></button></div>' + (CK.can('leads.create') ? '<button type="button" class="btn primary" data-act="new-lead">' + ic('plus', 16) + 'New lead</button>' : '') + '</div></div>';
      var tabs = '<div class="tabs scrollx" role="tablist" aria-label="Saved views">' + allViews.map(function (v) { return '<button type="button" role="tab" data-view="' + v.id + '" aria-selected="' + (LV.view === v.id) + '">' + (v.saved ? ic('bookmark', 13) : '') + esc(v.label) + (counts[v.id] != null ? '<span class="cnt">' + counts[v.id] + '</span>' : '') + '</button>'; }).join('') + '</div>';
      var bar = '<div class="fbar"><label class="search"><span class="sr">Search leads</span>' + ic('search', 15) + '<input data-f="q" value="' + esc(LV.q) + '" placeholder="Search name, colony, “3 bhk”"></label>' +
        sel('stage', 'Any stage', CK.LEAD_STAGES.map(function (s) { return [s.id, s.label]; }).concat([['lost', 'Lost']]), LV.stage) + sel('src', 'Any source', CK.SOURCES.map(function (s) { return [s, s]; }), LV.src) +
        sel('owner', 'Anyone', S().agents.filter(function (a) { return a.role === 'telecaller' || a.role === 'field'; }).map(function (a) { return [a.id, a.name]; }), LV.owner) + sel('region', 'All areas', [['sd', 'South Delhi'], ['ggn', 'Gurugram']], LV.region) +
        (dirty ? '<button type="button" class="btn ghost sm" data-act="save-view">' + ic('bookmark', 14) + 'Save view</button><button type="button" class="btn ghost sm" data-act="clear-f">Clear</button>' : '') + '</div>';
      var body = LV.mode === 'board' ? board(list) : table(list);
      var n = Object.keys(LV.sel).filter(function (k) { return LV.sel[k]; }).length;
      var bulk = '<div class="bulk' + (n ? ' on' : '') + '" role="region" aria-label="Bulk actions"><b>' + n + ' selected</b><button type="button" class="btn sm" data-bulk="assign">' + ic('users', 14) + 'Assign</button><button type="button" class="btn sm" data-bulk="stage">' + ic('layers', 14) + 'Move stage</button><button type="button" class="btn sm" data-bulk="queue">' + ic('phone', 14) + 'Add to calling list</button><button type="button" class="btn sm" data-bulk="partner">' + ic('partner', 14) + 'Share with partner</button><button type="button" class="btn sm" data-bulk="csv">' + ic('upload', 14) + 'Export CSV</button><button type="button" class="ibtn" data-bulk="clear" aria-label="Clear selection">' + ic('x', 15) + '</button></div>';
      return head + tabs + bar + body + bulk;
    },
    mount: function (el) {
      el.addEventListener('click', function (e) {
        var t = e.target.closest('[data-view],[data-mode],[data-act],[data-bulk],[data-sel-all]'); if (!t) return;
        if (t.dataset.view) { LV.view = t.dataset.view; LV.sel = {}; CK.render(); }
        else if (t.dataset.mode) { LV.mode = t.dataset.mode; CK.render(); }
        else if (t.dataset.act === 'clear-f') { LV.q = LV.stage = LV.src = LV.owner = LV.region = ''; CK.render(); }
        else if (t.dataset.act === 'save-view') {
          var m = CK.modal('<h2 id="modal-t">Save this view</h2><p class="muted">It appears as a tab for you. Filters: ' + esc([LV.q && '“' + LV.q + '”', LV.stage && CK.stageLabel(LV.stage), LV.src, LV.owner && CK.agent(LV.owner).name, LV.region && CK.REGIONS[LV.region].name].filter(Boolean).join(' · ')) + '</p><div class="fld"><label for="sv-n">Name</label><input id="sv-n" value="' + esc([LV.src, LV.stage && CK.stageLabel(LV.stage), LV.region && CK.REGIONS[LV.region].name].filter(Boolean).join(' · ') || 'My view') + '"></div><div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn primary" id="sv-ok">Save view</button></div>');
          m.querySelector('#sv-ok').addEventListener('click', function () { var nm = m.querySelector('#sv-n').value.trim() || 'My view'; var id = 'sv' + Date.now(); CK.ui.views = saved().concat([{ id: id, label: nm, f: { q: LV.q.toLowerCase(), stage: LV.stage, src: LV.src, owner: LV.owner, region: LV.region } }]); CK.saveUI(); LV.view = id; LV.q = LV.stage = LV.src = LV.owner = LV.region = ''; CK.closeModal(); CK.render(); CK.toast('View “' + nm + '” saved'); });
        }
        else if (t.dataset.selAll !== undefined) { var on = t.checked; filtered().forEach(function (L) { LV.sel[L.id] = on; }); CK.render(); }
        else if (t.dataset.bulk) bulk(t.dataset.bulk, t);
      });
      el.addEventListener('input', function (e) { var f = e.target.dataset.f; if (f === 'q') { LV.q = e.target.value; clearTimeout(LV.tm); LV.tm = setTimeout(function () { var pos = e.target.selectionStart; CK.render(); var i = document.querySelector('[data-f="q"]'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } }, 160); } });
      el.addEventListener('change', function (e) { var f = e.target.dataset.f; if (f && f !== 'q') { LV[f] = e.target.value; CK.render(); } var c = e.target.closest('[data-sel]'); if (c) { LV.sel[c.dataset.sel] = c.checked; CK.render(); } });
      // board drag and drop
      var drag = null;
      el.addEventListener('dragstart', function (e) { var c = e.target.closest('[data-drag]'); if (c) { drag = c.dataset.drag; e.dataTransfer.effectAllowed = 'move'; c.classList.add('dragging'); } });
      el.addEventListener('dragover', function (e) { var col = e.target.closest('[data-col]'); if (col && drag) { e.preventDefault(); col.classList.add('over'); } });
      el.addEventListener('dragleave', function (e) { var col = e.target.closest('[data-col]'); if (col) col.classList.remove('over'); });
      el.addEventListener('drop', function (e) { var col = e.target.closest('[data-col]'); if (!col || !drag) return; e.preventDefault(); var L = CK.lead(drag), from = L.stage; if (from !== col.dataset.col) { CK.act.stage(L, col.dataset.col); CK.toast(L.name + ' → ' + CK.stageLabel(col.dataset.col), { undo: function () { CK.act.stage(L, from); } }); } drag = null; });
    }
  };
  function table(list) {
    if (!list.length) return CK.empty('No leads in this view', 'Change a filter or switch views. New enquiries from portals and WhatsApp arrive here on their own.');
    var now = CK.now();
    return '<div class="tbl-wrap"><table class="tbl leads-t"><thead><tr><th class="c-sel"><label><span class="sr">Select all</span><input type="checkbox" data-sel-all></label></th><th>Lead</th><th>Wants</th><th>Stage</th><th class="hide-m">Source</th><th class="hide-m">Owner</th><th>Next</th><th class="hide-m">Best match</th><th class="c-act"><span class="sr">Actions</span></th></tr></thead><tbody>' +
      list.slice(0, 120).map(function (L) {
        var best = CK.matches(L, 0)[0], nx = L.next || (L.stage === 'new' ? { title: 'First call', due: L.created + 15 * 6e4 } : null);
        return '<tr class="' + (LV.sel[L.id] ? 'is-sel' : '') + '"><td class="c-sel"><label><span class="sr">Select ' + esc(L.name) + '</span><input type="checkbox" data-sel="' + L.id + '"' + (LV.sel[L.id] ? ' checked' : '') + '></label></td>' +
          '<td><button type="button" class="lead-cell" data-peek="lead:' + L.id + '">' + CK.av(L) + '<span><b>' + esc(L.name) + '</b><small class="mono">' + L.id + (L.tags.length ? ' · ' + esc(L.tags.join(' · ')) : '') + '</small></span></button></td>' +
          '<td>' + wants(L) + '</td><td><span class="stg">' + CK.stagePill(L) + miniStep(L) + '</span></td><td class="hide-m">' + CK.srcChip(L.src) + '</td><td class="hide-m">' + CK.chipAgent(CK.agent(L.owner)) + '</td>' +
          '<td>' + (nx ? '<span class="nx' + (nx.due < now ? ' late' : '') + '">' + esc(nx.title) + '<small>' + (nx.due < now ? CK.ago(nx.due).replace(' ago', ' late') : CK.dayLabel(nx.due) + ' ' + CK.time(nx.due)) + '</small></span>' : '<span class="muted">—</span>') + '</td>' +
          '<td class="hide-m">' + (best ? '<span class="bm">' + CK.score(best.score) + '<span class="muted sm">' + best.p.code + '</span></span>' : '<span class="muted sm">No match yet</span>') + '</td>' +
          '<td class="c-act"><span class="hov-acts"><a class="ibtn" href="#/calling/Q2/' + L.id + '" aria-label="Call ' + esc(L.name) + '">' + ic('phone', 15) + '</a><button type="button" class="ibtn" data-peek="lead:' + L.id + '" data-tab="matches" aria-label="Matches for ' + esc(L.name) + '">' + ic('target', 15) + '</button></span></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function board(list) {
    var cols = CK.LEAD_STAGES.map(function (s) { return s.id; });
    return '<div class="kanban">' + cols.map(function (c) {
      var items = list.filter(function (L) { return L.stage === c; });
      return '<section class="kcol" data-col="' + c + '" aria-label="' + CK.stageLabel(c) + '"><header><span>' + CK.stageLabel(c) + '</span><b>' + items.length + '</b></header><div class="kcards">' + items.map(function (L) {
        return '<article class="kcard" draggable="true" data-drag="' + L.id + '"><button type="button" class="kc-h" data-peek="lead:' + L.id + '">' + CK.av(L) + '<b>' + esc(L.name) + '</b></button><p>' + wants(L) + '</p><footer>' + CK.srcChip(L.src) + '<span class="grow"></span>' + CK.av(CK.agent(L.owner), 's') + '</footer></article>';
      }).join('') + (items.length ? '' : '<p class="muted sm pad">Drop a lead here</p>') + '</div></section>';
    }).join('') + '</div>';
  }
  function bulk(kind, btn) {
    var ids = Object.keys(LV.sel).filter(function (k) { return LV.sel[k]; }), leads = ids.map(CK.lead);
    if (kind === 'clear') { LV.sel = {}; CK.render(); return; }
    if (kind === 'assign') CK.menu(btn, [{ head: 'Assign owner' }].concat(S().agents.filter(function (a) { return a.role === 'telecaller'; }).map(function (a) { return { label: a.name, id: a.id, icon: 'users' }; })), function (it) { var old = leads.map(function (L) { return L.owner; }); leads.forEach(function (L) { L.owner = it.id; L.tl.unshift({ at: CK.now(), kind: 'system', text: 'Owner → ' + it.label + ' (bulk)', by: CK.me().id }); }); CK.audit('Bulk reassigned', ids.length + ' leads', it.label); CK.emit('lead'); CK.toast(ids.length + ' leads assigned to ' + it.label, { undo: function () { leads.forEach(function (L, i) { L.owner = old[i]; }); CK.emit('lead'); } }); });
    if (kind === 'stage') CK.menu(btn, [{ head: 'Move to stage' }].concat(CK.LEAD_STAGES.map(function (s) { return { label: s.label, id: s.id }; })).concat([{ label: 'Lost', id: 'lost' }]), function (it) { var old = leads.map(function (L) { return L.stage; }); leads.forEach(function (L) { CK.act.stage(L, it.id, true); }); CK.emit('lead'); CK.toast(ids.length + ' leads → ' + it.label, { undo: function () { leads.forEach(function (L, i) { L.stage = old[i]; }); CK.emit('lead'); } }); });
    if (kind === 'queue') { var q = S().queues.filter(function (x) { return x.id === 'Q6'; })[0]; ids.forEach(function (id) { if (q.fixed.indexOf(id) < 0) q.fixed.push(id); }); CK.audit('Added to calling list', ids.length + ' leads', q.name); CK.emit('queue'); CK.toast(ids.length + ' added to “' + q.name + '”'); }
    if (kind === 'partner') CK.menu(btn, [{ head: 'Share with partner' }].concat(S().partners.map(function (p) { return { label: p.name + ' · ' + CK.area(p.area).short, id: p.id }; })), function (it) { var pt = CK.partner(it.id); leads.forEach(function (L) { CK.act.shareLead(pt, L); }); CK.toast(ids.length + ' leads shared with ' + pt.name); });
    if (kind === 'csv') { var rows = [['id', 'name', 'stage', 'source', 'bhk', 'budget', 'areas', 'owner']].concat(leads.map(function (L) { return [L.id, L.name, L.stage, L.src, L.req.bhk.join('/'), L.req.budget, L.req.sectors.map(function (s) { return CK.area(s).name; }).join('; '), CK.agent(L.owner).name]; })); var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'); var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'amaltas-leads.csv'; a.click(); CK.audit('Exported CSV', ids.length + ' leads'); CK.toast('Exported ' + ids.length + ' leads'); }
  }

  /* ============ LEAD PANEL ============ */
  var LP = { tab: 'overview', pick: {} };
  CK.D = CK.D || {};
  CK.D.lead = {
    render: function (id) {
      var L = CK.lead(id); if (!L) return CK.empty('Lead not found', 'It may have been removed.');
      if (LP.id !== id) { LP.id = id; LP.pick = {}; LP.tab = CK.peekTab || 'overview'; } CK.peekTab = null;
      var ms = CK.matches(L), stIdx = ['new', 'contacted', 'requirement', 'matched', 'visit', 'deal'].indexOf(L.stage);
      var head = '<header class="dh"><div class="dh-top">' + CK.av(L, 'l') + '<div class="grow"><h2 id="drawer-t">' + esc(L.name) + '</h2><p class="muted sm"><span class="mono">' + L.id + '</span> · <span class="nwp">' + esc(L.phone) + '</span> · ' + CK.srcChip(L.src) + ' · came in ' + CK.ago(L.created) + '</p></div>' +
        '<a class="ibtn" href="#/calling/Q2/' + L.id + '" aria-label="Call">' + ic('phone', 16) + '</a><button type="button" class="ibtn" data-lp="wa" aria-label="WhatsApp">' + ic('chat', 16) + '</button><button type="button" class="ibtn" data-lp="more" aria-label="More">' + ic('more', 16) + '</button><button type="button" class="ibtn" data-close-drawer aria-label="Close panel">' + ic('x', 16) + '</button></div>' +
        (L.stage === 'lost' ? '<p class="lost-n">' + ic('flag', 14) + 'Lost — ' + esc(L.lostReason || '') + ' <button type="button" class="link-btn" data-lp="reopen">Reopen</button></p>' : CK.stepper(CK.LEAD_STAGES, stIdx, { label: 'Lead stage', compact: true })) + '</header>';
      var tabs = [['overview', 'Overview'], ['matches', 'Matches', ms.length], ['timeline', 'Timeline', L.tl.length], ['visits', 'Visits & deals']];
      var tb = '<div class="tabs dtabs" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" data-lptab="' + t[0] + '" aria-selected="' + (LP.tab === t[0]) + '"' + (t[0] === 'matches' ? ' data-tour="matches"' : '') + '>' + t[1] + (t[2] != null ? '<span class="cnt">' + t[2] + '</span>' : '') + '</button>'; }).join('') + '</div>';
      var body = LP.tab === 'matches' ? matchesTab(L, ms) : LP.tab === 'timeline' ? timeline(L) : LP.tab === 'visits' ? visitsTab(L) : overview(L, ms);
      return head + tb + '<div class="dbody">' + body + '</div>';
    },
    mount: function (el, id) {
      var L = CK.lead(id);
      el.onclick = function (e) {
        var t = e.target.closest('[data-lptab],[data-lp],[data-ed],[data-short],[data-pick],[data-rmsec]'); if (!t) return;
        if (t.dataset.lptab) { LP.tab = t.dataset.lptab; CK.renderDrawer(); return; }
        if (t.dataset.short) { var on = L.shortlist.indexOf(t.dataset.short) < 0; CK.act.shortlist(L, t.dataset.short, on); CK.toast(on ? 'Shortlisted ' + CK.prop(t.dataset.short).code : 'Removed from shortlist', { undo: function () { CK.act.shortlist(L, t.dataset.short, !on); } }); return; }
        if (t.dataset.pick) { LP.pick[t.dataset.pick] = !LP.pick[t.dataset.pick]; CK.renderDrawer(); return; }
        if (t.dataset.rmsec) { var old = L.req.sectors.slice(); CK.act.setReq(L, 'sectors', L.req.sectors.filter(function (s) { return s !== t.dataset.rmsec; })); CK.toast(CK.area(t.dataset.rmsec).short + ' removed — matches updated', { undo: function () { CK.act.setReq(L, 'sectors', old); } }); return; }
        if (t.dataset.ed) return editField(L, t.dataset.ed, t);
        var a = t.dataset.lp;
        if (a === 'plan') { var pids = Object.keys(LP.pick).filter(function (k) { return LP.pick[k]; }); CK.ui.plan = { leads: [L.id], pids: pids, r: L.req.r }; CK.saveUI(); CK.go('#/trips/new'); }
        if (a === 'wa') waCompose(L);
        if (a === 'sendmatches') { var ps = Object.keys(LP.pick).filter(function (k) { return LP.pick[k]; }).map(CK.prop); waCompose(L, ps); }
        if (a === 'reopen') { L.stage = 'contacted'; L.lostReason = null; CK.act.stage(L, 'contacted'); }
        if (a === 'note') { var i = el.querySelector('#lp-note'); if (!i.value.trim()) { i.focus(); i.setAttribute('aria-invalid', 'true'); el.querySelector('#lp-note-err').textContent = 'Write something first — even “called, no answer” helps the next person.'; return; } CK.act.note(L, i.value.trim()); CK.toast('Note added to timeline'); }
        if (a === 'deal') { var d = CK.act.newDeal(L, t.dataset.pid); CK.toast('Deal ' + d.id + ' opened'); CK.peek('deal', d.id); }
        if (a === 'more') CK.menu(t, [{ label: 'Mark as lost', icon: 'flag', id: 'lost' }, { label: 'Reassign telecaller', icon: 'users', id: 'own' }, { label: 'Change field agent', icon: 'route', id: 'fld' }, { label: 'Share with a partner', icon: 'partner', id: 'pt' }], function (it) {
          if (it.id === 'lost') { var m = CK.modal('<h2 id="modal-t">Mark ' + esc(L.name) + ' as lost</h2><div class="fld"><label for="lr">Why?</label><select id="lr"><option>Went with another broker</option><option>Budget too low for the area</option><option>Plan postponed</option><option>Not reachable after 3 tries</option><option>Bought / rented directly from owner</option></select></div><div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn danger" id="lr-ok">Mark lost</button></div>'); m.querySelector('#lr-ok').onclick = function () { var from = L.stage; L.lostReason = m.querySelector('#lr').value; CK.act.stage(L, 'lost'); CK.closeModal(); CK.toast('Marked lost', { undo: function () { CK.act.stage(L, from); } }); }; }
          if (it.id === 'own' || it.id === 'fld') CK.menu(t, S().agents.filter(function (a) { return it.id === 'own' ? a.role === 'telecaller' : a.role === 'field'; }).map(function (a) { return { label: a.name, id: a.id, on: L[it.id === 'own' ? 'owner' : 'field'] === a.id }; }), function (x) { CK.act.assign(L, x.id, it.id === 'own' ? 'owner' : 'field'); CK.toast('Assigned to ' + x.label); });
          if (it.id === 'pt') CK.menu(t, S().partners.map(function (p) { return { label: p.name, id: p.id }; }), function (x) { CK.act.shareLead(CK.partner(x.id), L); CK.toast('Shared with ' + x.label); });
        });
      };
    }
  };
  function overview(L, ms) {
    var q = L.req, a = CK.agent(L.owner), f = CK.agent(L.field);
    var sec = q.sectors.map(function (s) { return '<span class="tag">' + esc(CK.area(s).short) + '<button type="button" data-rmsec="' + s + '" aria-label="Remove ' + esc(CK.area(s).short) + '">' + ic('x', 11) + '</button></span>'; }).join('') + '<button type="button" class="tag add" data-ed="sectors">' + ic('plus', 12) + 'Add area</button>';
    var req = '<section class="card req" aria-labelledby="req-h"><div class="card-h"><h3 id="req-h">Requirement</h3><span class="muted sm">Click any value to edit · matches update live</span></div>' + CK.kv([
      ['Looking to', '<button type="button" class="ed" data-ed="intent">' + (L.intent === 'rent' ? 'Rent' : 'Buy') + '</button>'],
      ['Configuration', '<button type="button" class="ed" data-ed="bhk">' + q.bhk.join(' or ') + ' BHK</button>'],
      ['Budget', '<button type="button" class="ed" data-ed="budget">' + (L.intent === 'rent' ? CK.inr(q.budget) + ' a month' : CK.money(q.budget)) + '</button><small class="muted"> ±10% fits, +20% close</small>'],
      ['Areas', '<span class="tags">' + sec + '</span>'],
      ['Move-in by', '<button type="button" class="ed" data-ed="moveIn">' + CK.date(q.moveIn, true) + '</button>'],
      ['Household', '<button type="button" class="ed" data-ed="family">' + esc(q.family) + '</button>'],
      ['Furnishing', '<button type="button" class="ed" data-ed="furn">' + esc(q.furn) + '</button>']
    ]) + '<p class="req-note">' + ic('spark', 14) + esc(q.note) + '</p></section>';
    var top = ms.slice(0, 3).map(function (m) { return '<button type="button" class="mini-m" data-lptab="matches"><img src="' + CK.ph(m.p.photos[0], 1) + '" alt="" width="64" height="48" loading="lazy"><span><b>' + m.p.code + '</b><small>' + esc(CK.area(m.p.area).short) + ' · ' + CK.price(m.p) + '</small></span>' + CK.score(m.score) + '</button>'; }).join('');
    var next = L.next ? '<p class="nx-line">' + ic('clock', 14) + 'Next: <b>' + esc(L.next.title) + '</b> · ' + CK.dayLabel(L.next.due) + ' ' + CK.time(L.next.due) + '</p>' : '';
    return req + '<section class="card"><div class="card-h"><h3>Best matches</h3><button type="button" class="link-btn" data-lptab="matches">All ' + ms.length + ic('right', 14) + '</button></div>' + (top || '<p class="muted">No home fits yet. Widen the areas or budget.</p>') + '</section>' +
      (CK.cfBlock ? CK.cfBlock(L) : '') + '<section class="card"><div class="card-h"><h3>People</h3></div>' + CK.kv([['Telecaller', CK.chipAgent(a)], ['Field agent', CK.chipAgent(f)], ['How they found us', esc(L.found)], L.partnerId ? ['Partner', esc(CK.partner(L.partnerId).name) + ' · ' + esc(CK.partner(L.partnerId).firm)] : null, ['Last contact', L.last ? CK.ago(L.last) : 'Not yet']]) + next + '</section>';
  }
  function editField(L, f, btn) {
    var q = L.req, old;
    function done(v, label) { old = f === 'intent' ? L.intent : q[f]; if (f === 'intent') { L.intent = v; CK.act.setReq(L, 'intent', v); } else CK.act.setReq(L, f, v); CK.toast(label + ' updated — matches re-ranked', { undo: function () { if (f === 'intent') L.intent = old; q[f] = old; CK.emit('lead'); } }); }
    if (f === 'intent') return CK.menu(btn, [{ label: 'Rent', id: 'rent', on: L.intent === 'rent' }, { label: 'Buy', id: 'buy', on: L.intent === 'buy' }], function (it) { done(it.id, 'Intent'); });
    if (f === 'bhk') return CK.menu(btn, [[1], [2], [3], [4], [2, 3], [3, 4], [4, 5]].map(function (b) { return { label: b.join(' or ') + ' BHK', v: b, on: b.join() === q.bhk.join() }; }), function (it) { done(it.v, 'Configuration'); });
    if (f === 'family') return CK.menu(btn, ['Family', 'Couple', 'Working professionals', 'Corporate lease'].map(function (x) { return { label: x, on: q.family === x }; }), function (it) { done(it.label, 'Household'); });
    if (f === 'furn') return CK.menu(btn, ['Any', 'Unfurnished', 'Semi-furnished', 'Fully furnished'].map(function (x) { return { label: x, on: q.furn === x }; }), function (it) { done(it.label, 'Furnishing'); });
    if (f === 'sectors') return CK.menu(btn, CK.AREAS.filter(function (a) { return a.r === q.r && q.sectors.indexOf(a.id) < 0; }).map(function (a) { return { label: a.name, id: a.id }; }), function (it) { done(q.sectors.concat([it.id]), 'Areas'); });
    if (f === 'budget' || f === 'moveIn') {
      var isB = f === 'budget';
      var m = CK.modal('<h2 id="modal-t">' + (isB ? 'Budget' : 'Move-in by') + '</h2><div class="fld"><label for="ed-v">' + (isB ? (L.intent === 'rent' ? 'Rent a month, in ₹' : 'Total budget, in ₹') : 'Date') + '</label><input id="ed-v" ' + (isB ? 'inputmode="numeric" value="' + q.budget + '"' : 'type="date" value="' + new Date(q.moveIn - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10) + '"') + '><p class="hint" id="ed-h">' + (isB ? 'Now ' + CK.money(q.budget) : '') + '</p></div><div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn primary" id="ed-ok">Save</button></div>');
      var inp = m.querySelector('#ed-v'), hint = m.querySelector('#ed-h');
      if (isB) inp.addEventListener('input', function () { var n = +inp.value.replace(/[^\d]/g, ''); hint.textContent = n ? 'Reads as ' + CK.money(n) : 'Numbers only, like 110000 or 25000000'; });
      m.querySelector('#ed-ok').onclick = function () { var v; if (isB) { v = +inp.value.replace(/[^\d]/g, ''); if (!v || v < 5000) { inp.setAttribute('aria-invalid', 'true'); hint.textContent = 'That looks too low — rent is usually ₹15,000 or more.'; return; } } else { v = new Date(inp.value).getTime(); if (!v) { hint.textContent = 'Pick a date'; return; } } CK.closeModal(); done(v, isB ? 'Budget' : 'Move-in'); };
    }
  }
  function matchesTab(L, ms) {
    var picked = Object.keys(LP.pick).filter(function (k) { return LP.pick[k]; });
    if (!ms.length) return CK.empty('No homes match yet', 'Try adding a neighbouring colony or raising the budget band. New listings are scored against this brief as soon as they’re verified.');
    return '<p class="muted sm mtop">' + ms.length + ' homes ranked by fit to the brief · budget is a band, so ±10% still fits · owner preferences lower a score but never hide a home</p><div class="matches">' + ms.map(function (m) {
      var p = m.p, inS = L.shortlist.indexOf(p.id) >= 0, pk = !!LP.pick[p.id];
      return '<article class="match' + (pk ? ' picked' : '') + '"><button type="button" class="m-img" data-peek="prop:' + p.id + '" aria-label="Open ' + p.code + '"><img src="' + CK.ph(p.photos[0], 1) + '" alt="' + esc(CK.cfg(p) + ' in ' + CK.area(p.area).name) + '" loading="lazy" decoding="async" width="220" height="150">' + (CK.ver(p) === 'fresh' ? '<span class="vbadge">' + ic('shield', 12) + 'Verified</span>' : '') + '</button>' +
        '<div class="m-b"><div class="m-top"><div><b class="mono">' + p.code + '</b> <span class="muted">· ' + esc(CK.area(p.area).name) + '</span><p class="m-cfg">' + esc(CK.cfg(p)) + ' · ' + esc(p.floor) + ' · ' + CK.grp(p.sqft) + ' sq ft</p></div><div class="m-sc">' + CK.score(m.score) + '<b>' + CK.price(p) + '</b></div></div>' +
        '<ul class="why">' + m.why.map(function (w) { return '<li class="' + (w[0] ? 'ok' : 'meh') + '">' + ic(w[0] ? 'check' : 'spark', 12) + esc(w[1]) + '</li>'; }).join('') + '</ul>' +
        '<div class="m-a"><button type="button" class="btn sm' + (inS ? ' on' : '') + '" data-short="' + p.id + '" aria-pressed="' + inS + '">' + ic('star', 14) + (inS ? 'Shortlisted' : 'Shortlist') + '</button><button type="button" class="btn sm' + (pk ? ' on' : '') + '" data-pick="' + p.id + '" aria-pressed="' + pk + '">' + ic(pk ? 'check' : 'plus', 14) + (pk ? 'In trip' : 'Add to trip') + '</button>' + CK.ring(CK.fresh(p), 28) + '</div></div></article>';
    }).join('') + '</div>' + '<div class="pickbar' + (picked.length ? ' on' : '') + '"><span><b>' + picked.length + '</b> home' + (picked.length === 1 ? '' : 's') + ' picked</span><button type="button" class="btn sm" data-lp="sendmatches">' + ic('chat', 14) + 'Send on WhatsApp</button><button type="button" class="btn primary sm" data-lp="plan" data-tour="plantrip">' + ic('route', 14) + 'Plan a trip' + ic('arrow', 14) + '</button></div>';
  }
  function waCompose(L, props) {
    props = props || L.shortlist.map(CK.prop).slice(0, 3);
    var first = L.name.split(' ')[0];
    var txt = props.length ? 'Hi ' + first + ', here are ' + props.length + ' homes that fit what you asked for:\n' + props.map(function (p, i) { return (i + 1) + '. ' + CK.cfg(p) + ', ' + CK.area(p.area).name + ' — ' + CK.price(p) + (CK.ver(p) === 'fresh' ? ' (verified ' + CK.verAge(p) + ' days ago)' : ''); }).join('\n') + '\nShall we see them on ' + CK.WD[new Date(CK.now() + CK.DAY).getDay()] + '? — ' + CK.me().name.split(' ')[0] + ', Amaltas Estates' : 'Hi ' + first + ', this is ' + CK.me().name.split(' ')[0] + ' from Amaltas Estates. Is now a good time to talk about the homes you were looking at?';
    var m = CK.modal('<h2 id="modal-t">WhatsApp to ' + esc(L.name) + '</h2><p class="muted sm">Opens WhatsApp click-to-chat; the message is logged on the timeline.</p><div class="fld"><label for="wa-t">Message</label><textarea id="wa-t" rows="8">' + esc(txt) + '</textarea></div><div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn primary" id="wa-ok">' + ic('chat', 15) + 'Mark as sent</button></div>');
    m.querySelector('#wa-ok').onclick = function () { CK.act.wa(L, m.querySelector('#wa-t').value); CK.closeModal(); CK.toast('Logged on ' + L.name.split(' ')[0] + '’s timeline'); };
  }
  CK.waCompose = waCompose;
  var TL_IC = { created: 'sparkles', system: 'settings', call: 'phone', wa: 'chat', note: 'edit', edit: 'sliders', match: 'target', trip: 'route', visit: 'pin', deal: 'deal', stage: 'layers', task: 'clock' };
  function timeline(L) {
    var byDay = {}, order = [];
    L.tl.forEach(function (e) { var k = CK.dayLabel(e.at); if (!byDay[k]) { byDay[k] = []; order.push(k); } byDay[k].push(e); });
    var auto = L.tl.filter(function (e) { return e.kind === 'system' || e.kind === 'match' || e.kind === 'stage' || e.kind === 'created'; }).length;
    return '<div class="composer"><label class="sr" for="lp-note">Add a note</label><textarea id="lp-note" rows="2" placeholder="Add a note — what did they say, what’s next?"></textarea><p class="err" id="lp-note-err" role="alert"></p><div class="composer-a"><span class="muted sm">' + Math.round(auto / Math.max(1, L.tl.length) * 100) + '% of this timeline was written by the system</span><button type="button" class="btn sm primary" data-lp="note">Add note</button></div></div>' +
      order.map(function (k) { return '<div class="tl-day"><h4>' + k + '</h4><ol class="tl">' + byDay[k].map(function (e) { var who = e.by ? CK.agent(e.by) : null; return '<li class="tl-' + e.kind + '"><span class="tl-ic">' + ic(TL_IC[e.kind] || 'spark', 14) + '</span><div><p>' + esc(e.text) + '</p><small class="muted">' + CK.time(e.at) + (who ? ' · ' + esc(who.name) : ' · Fieldwise') + '</small></div></li>'; }).join('') + '</ol></div>'; }).join('');
  }
  function visitsTab(L) {
    var trips = S().trips.filter(function (t) { return t.leads.indexOf(L.id) >= 0; }).sort(function (a, b) { return b.start - a.start; });
    var deals = S().deals.filter(function (d) { return d.lead === L.id; });
    var tv = trips.map(function (t) { return '<div class="vt"><div class="vt-h">' + CK.chipTrip(t) + '<span class="muted sm">' + CK.dayLabel(t.start) + ' · ' + CK.time(t.start) + ' · ' + esc(CK.agent(t.agent).name) + '</span></div><ul class="vt-s">' + t.stops.map(function (s) { var o = s.out[L.id], p = CK.prop(s.pid); return '<li>' + CK.chipProp(p) + '<span class="grow"></span>' + (o ? CK.pill({ liked: 'Liked', short: 'Shortlisted', rejected: 'Rejected · ' + (o.reason || ''), novisit: 'Not visited' }[o.v], { liked: 'green', short: 'violet', rejected: 'red', novisit: 'grey' }[o.v]) : CK.pill(s.st === 'here' ? 'Agent there now' : 'To go', s.st === 'here' ? 'live' : 'grey')) + '</li>'; }).join('') + '</ul></div>'; }).join('');
    var sl = L.shortlist.map(CK.prop).filter(Boolean);
    var canDeal = CK.can('deals.edit');
    return '<section class="card"><div class="card-h"><h3>Deals</h3></div>' + (deals.length ? deals.map(function (d) { return '<div class="row-b">' + CK.chipDeal(d) + CK.chipProp(CK.prop(d.pid)) + '<span class="grow"></span><b>' + CK.money(d.value, true) + '</b></div>'; }).join('') : '<p class="muted">No deal yet.</p>') +
      (sl.length && canDeal ? '<div class="sl-deal"><p class="muted sm">Open a deal on a shortlisted home:</p>' + sl.map(function (p) { return '<button type="button" class="btn sm" data-lp="deal" data-pid="' + p.id + '">' + ic('deal', 14) + p.code + ' · ' + CK.price(p) + '</button>'; }).join('') + '</div>' : '') + '</section>' +
      '<section class="card"><div class="card-h"><h3>Site visits</h3><span class="muted sm">' + trips.length + ' trips</span></div>' + (tv || '<p class="muted">No visits yet. Pick homes on the Matches tab and plan a trip.</p>') + '</section>';
  }

  /* ============ NEW LEAD ============ */
  CK.newLeadForm = function (preset) {
    preset = preset || {};
    var areas = CK.AREAS.map(function (a) { return '<label class="cb"><input type="checkbox" name="sec" value="' + a.id + '" data-r="' + a.r + '"><span>' + esc(a.short) + '</span></label>'; }).join('');
    var m = CK.modal('<h2 id="modal-t">New lead</h2><p class="muted sm">Round-robin assigns a telecaller; the first call is due in 15 minutes.</p><form id="nl-f" novalidate><div class="f2"><div class="fld"><label for="nl-n">Name</label><input id="nl-n" autocomplete="off" placeholder="e.g. Ritu Malhotra"></div><div class="fld"><label for="nl-p">Phone</label><input id="nl-p" inputmode="tel" placeholder="98XXX XX123"></div></div>' +
      '<div class="f3"><div class="fld"><label for="nl-s">Source</label><select id="nl-s">' + CK.SOURCES.map(function (s) { return '<option' + (preset.src === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div><div class="fld"><label for="nl-i">Looking to</label><select id="nl-i"><option value="rent">Rent</option><option value="buy">Buy</option></select></div><div class="fld"><label for="nl-b">BHK</label><select id="nl-b"><option>2</option><option selected>3</option><option>4</option><option>1</option></select></div></div>' +
      '<div class="f2"><div class="fld"><label for="nl-bud">Budget (₹)</label><input id="nl-bud" inputmode="numeric" placeholder="90000 a month, or 40000000"><p class="hint" id="nl-bh"></p></div><div class="fld"><label for="nl-m">Move-in by</label><input id="nl-m" type="date"></div></div>' +
      '<fieldset class="fld"><legend>Areas</legend><div class="cbs">' + areas + '</div></fieldset><div class="fld"><label for="nl-note">Anything else</label><input id="nl-note" placeholder="Two kids, needs a lift, school nearby…"></div><p class="err" id="nl-err" role="alert"></p>' +
      '<div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="submit" class="btn primary">Create lead</button></div></form>', { wide: true });
    var f = m.querySelector('#nl-f'), bud = m.querySelector('#nl-bud');
    bud.addEventListener('input', function () { var n = +bud.value.replace(/[^\d]/g, ''); m.querySelector('#nl-bh').textContent = n ? 'Reads as ' + CK.money(n) : ''; });
    var d = new Date(CK.now() + 30 * CK.DAY); m.querySelector('#nl-m').value = d.toISOString().slice(0, 10);
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var err = m.querySelector('#nl-err'), n = m.querySelector('#nl-n'), b = +bud.value.replace(/[^\d]/g, '');
      var secs = [].slice.call(m.querySelectorAll('input[name=sec]:checked')).map(function (x) { return x.value; });
      [n, bud].forEach(function (x) { x.removeAttribute('aria-invalid'); });
      if (n.value.trim().length < 2) { n.setAttribute('aria-invalid', 'true'); n.focus(); err.textContent = 'Add the client’s name so the telecaller knows who they’re calling.'; return; }
      if (!b) { bud.setAttribute('aria-invalid', 'true'); bud.focus(); err.textContent = 'A rough budget is enough — it drives the matching.'; return; }
      if (!secs.length) { err.textContent = 'Pick at least one area (you can add more later).'; return; }
      var r = CK.area(secs[0]).r; secs = secs.filter(function (s) { return CK.area(s).r === r; });
      var L = CK.act.newLead({ name: n.value.trim(), phone: m.querySelector('#nl-p').value || null, src: m.querySelector('#nl-s').value, intent: m.querySelector('#nl-i').value, partnerId: m.querySelector('#nl-s').value === 'Partner' ? 'PT1' : null, req: { r: r, bhk: [+m.querySelector('#nl-b').value], budget: b, sectors: secs, moveIn: new Date(m.querySelector('#nl-m').value).getTime() || CK.now() + 30 * CK.DAY, type: 'Any', furn: 'Any', family: 'Family', note: m.querySelector('#nl-note').value || 'Captured at the desk.' }, reqDone: true });
      CK.closeModal(); CK.toast(L.name + ' added · ' + CK.matches(L).length + ' homes match already'); CK.peekTab = 'matches'; CK.peek('lead', L.id);
    });
  };
})();
