/* Aaranya sales office. An app shell with routes: Today, Call queue (focus mode), Enquiries (table + slide-over records),
   Site visits (slot board with drag to reschedule), Conversations (the website concierge's chats: take over, reply, hand back,
   resolve) and Units & holds (hold or release a home; the public unit picker updates live, in this tab or another). */
(function () {
  'use strict';
  var A = window.AAR, $ = A.$, $$ = A.$$, DAY = A.DAY, now = function () { return Date.now(); };
  var view = 'today', ctxTower = A.get('so-tower', ''), picked = [], selLeads = [], visitDay = A.dayStart(now());
  var main = $('#main');
  var ICON = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    na: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M6 18L18 6M8 6h10v10"/></svg>',
    busy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M8 12h8"/></svg>',
    wrong: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>',
    off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M5 5l14 14"/></svg>',
    later: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6.6 3.5h2.2l1.4 4-2 1.3a11 11 0 0 0 7 7l1.3-2 4 1.4v2.2a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="5" y="3" width="6" height="18"/><rect x="13" y="8" width="6" height="13"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    chev: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>'
  };
  var OUTCOMES = [['connected', 'Connected', 'ok'], ['noanswer', 'No answer', 'na'], ['busy', 'Busy', 'busy'], ['wrong', 'Wrong number', 'wrong'], ['off', 'Switched off', 'off'], ['later', 'Call back later', 'later']];
  var MODE = { lounge: 'Lounge', pickup: 'Metro pickup', video: 'Video' };

  /* ---------------- helpers ---------------- */
  function leads() { return A.leads(); }
  function lead(id) { return leads().filter(function (l) { return l.id === id; })[0]; }
  function saveLead(l, entry) { var ls = leads(), i = ls.findIndex(function (x) { return x.id === l.id; }); if (entry) l.log.push(Object.assign({ t: now() }, entry)); ls[i] = l; A.saveLeads(ls); }
  function d0() { return A.dayStart(now()); }
  function dueCls(t) { if (!t) return ''; return t < d0() ? 'over' : t < d0() + DAY ? 'today' : ''; }
  function dueTxt(t) { if (!t) return '—'; if (t < d0()) return 'Overdue · ' + A.fmtDay(t, { day: 'numeric', month: 'short' }); if (t < d0() + DAY) return 'Today ' + A.fmtTime(t); if (t < d0() + 2 * DAY) return 'Tomorrow ' + A.fmtTime(t); return A.fmtDay(t); }
  function stage(s) { return '<span class="so-stage s-' + s + '">' + A.STAGES[s] + '</span>'; }
  function unitTag(id) { if (!id) return ''; var st = A.status(id); return '<span class="so-tag ' + (st === 'avail' ? 'gr' : st === 'hold' ? 'g' : '') + '"><span class="dot"></span>' + id + '</span>'; }
  function srcTag(l) { return /chat/i.test(l.source) ? '<span class="so-tag b">Chat</span>' : /brochure|picker|booking|nri|cost/i.test(l.source) ? '<span class="so-tag g">Website</span>' : '<span class="so-tag">' + A.esc(l.source) + '</span>'; }
  function holds() { var inv = A.inv(), out = []; Object.keys(inv).forEach(function (k) { var o = inv[k]; if (o.s === 'hold' && o.until && o.until > now()) out.push({ id: k, o: o }); }); return out.sort(function (a, b) { return a.o.until - b.o.until; }); }
  function inCtx(unitId) { return !ctxTower || (unitId && unitId[0] === ctxTower); }
  function undo(msg, fn) { A.toast(msg, { label: 'Undo', fn: fn }, 6500); }
  function spark(seed, last, up) { var r = A.rng(seed), v = [], x = Math.max(1, last * 0.6); for (var i = 0; i < 13; i++) { x = Math.max(0, x + (r() - (up ? 0.38 : 0.55)) * Math.max(1, last * 0.25)); v.push(x); } v.push(last); var mx = Math.max.apply(0, v) || 1; var pts = v.map(function (y, i) { return (i * 70 / 13).toFixed(1) + ' ' + (22 - y / mx * 20).toFixed(1); }); return '<svg viewBox="0 0 70 24" aria-hidden="true"><path class="a" d="M0 24L' + pts.join('L') + 'L70 24Z"/><path d="M' + pts.join('L') + '"/></svg>'; }
  function greet() { var h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
  function initials(n) { return n.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2); }
  function prop(k, v) { return '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>'; }

  /* ---------------- queue: visit confirmations first, then new and due enquiries ---------------- */
  var queue = [], qi = 0, paused = false, qOutcome = null;
  function buildQueue() {
    var t1 = d0() + 2 * DAY, list = [];
    A.visits().filter(function (v) { return v.lead && !v.confirmed && !v.outcome && A.slotTime(v.slot) > now() && A.slotTime(v.slot) < t1; }).sort(function (a, b) { return A.slotTime(a.slot) - A.slotTime(b.slot); })
      .forEach(function (v) { list.push({ kind: 'confirm', lead: v.lead, visit: v.id }); });
    leads().filter(function (l) { return l.stage !== 'lost' && l.stage !== 'booked' && (l.stage === 'new' || (l.next && l.next < d0() + DAY)); })
      .sort(function (a, b) { return (a.stage === 'new' ? 0 : 1) - (b.stage === 'new' ? 0 : 1) || (a.next || 0) - (b.next || 0); })
      .forEach(function (l) { if (!list.some(function (x) { return x.lead === l.id; })) list.push({ kind: 'call', lead: l.id }); });
    queue = list; qi = 0;
  }

  /* ---------------- routing ---------------- */
  var TITLES = { today: 'Today', queue: 'Call queue', leads: 'Enquiries', visits: 'Site visits', inbox: 'Conversations', units: 'Units & holds' };
  function route() {
    var h = (location.hash || '#today').slice(1).split('/'); view = TITLES[h[0]] ? h[0] : 'today';
    if (h[1] && view === 'inbox') { inboxSel = h[1]; inboxOpenM = true; }
    $$('.so-nav a[data-v], .so-tabs a[data-v]').forEach(function (a) { if (a.dataset.v === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $('#so-title').textContent = TITLES[view]; document.title = TITLES[view] + ' · Aaranya sales office';
    closePop(); closeMenu(); render();
    if (h[1] && view === 'leads') openLead(h[1]);
  }
  addEventListener('hashchange', route);
  function render() { counts(); ({ today: today, queue: focus, leads: leadsView, visits: visitsView, inbox: inboxView, units: unitsView })[view](); }
  function counts() {
    var ls = leads(), nNew = ls.filter(function (l) { return l.stage === 'new'; }).length, tv = A.visits().filter(function (v) { return A.dayStart(A.slotTime(v.slot)) === d0(); }).length;
    var waiting = convos().filter(function (c) { return c.status === 'waiting'; }).length;
    var set = function (id, n, hot) { var e = $('#c-' + id); if (e) { e.textContent = n || ''; e.classList.toggle('hot', !!hot && n > 0); } var t = $('#t-' + id); if (t) { t.textContent = n; t.hidden = !(hot && n); } };
    set('queue', Math.max(0, queue.length - qi), true); set('leads', nNew, false); set('visits', tv, false); set('inbox', waiting, true); set('units', holds().length, false);
  }

  /* ================= the three towers tonight: the one thing only a launch sales office has ================= */
  function towersCard() {
    var list = A.TOWERS.filter(function (T) { return !ctxTower || T.id === ctxTower; });
    var cols = list.map(function (T) {
      var rows = '';
      for (var f = T.floors; f >= 1; f--) rows += '<div class="so-tw-r">' + T.units.map(function (p) { var id = T.id + '-' + f + p[0], st = A.status(id), m = A.statusMeta(id); return '<i class="' + st + (st === 'hold' && m && m.partner && m.pending ? ' pend' : '') + '" data-gounit="' + id + '"></i>'; }).join('') + '</div>';
      var c = A.counts(function (u) { return u.tower === T.id; });
      return '<div class="so-tw"><div class="so-tw-s" style="--n:' + T.units.length + '" aria-hidden="true"><span class="crown"></span>' + rows + '</div><p><b>' + T.name + '</b><span>' + c.avail + ' open · ' + c.hold + ' on hold · ' + c.sold + ' sold</span><span>Slab ' + A.PROGRESS[T.id] + ' of ' + T.floors + '</span></p></div>';
    }).join('');
    var pend = holds().filter(function (h) { return h.o.partner && h.o.pending && inCtx(h.id); });
    return '<div class="so-card so-towers"><div class="so-ch"><h2>The towers tonight</h2><span class="sp"></span><span class="so-legend"><span><i style="background:var(--so-green)"></i>Open</span><span><i style="background:var(--so-gold)"></i>On hold</span><span><i class="pend-key"></i>Partner hold to approve</span><span><i style="background:#3A4A3F"></i>Sold</span></span></div>' +
      '<div class="so-tw-wrap">' + cols + '<div class="so-tw-side"><p class="so-tw-big"><b>' + A.counts(function (u) { return inCtx(u.id); }).avail + '</b><span>homes open tonight</span></p>' +
      (pend.length ? '<p class="so-tw-note">' + pend.length + ' partner hold' + (pend.length > 1 ? 's' : '') + ' from ' + A.esc(A.PARTNER.name) + ' waiting for you: ' + pend.map(function (h) { return '<button type="button" class="so-tag g" data-gounit="' + h.id + '">' + h.id + '</button>'; }).join(' ') + '</p>' : '<p class="so-tw-note">No partner holds waiting.</p>') +
      '<p class="so-tw-note">Click any home to open it in Units &amp; holds.</p></div></div></div>';
  }

  /* ================= TODAY: what needs me now ================= */
  function today() {
    var ls = leads(), vs = A.visits(), nNew = ls.filter(function (l) { return l.stage === 'new'; });
    var over = ls.filter(function (l) { return l.next && l.next < d0() && l.stage !== 'lost' && l.stage !== 'booked'; });
    var tv = vs.filter(function (v) { return A.dayStart(A.slotTime(v.slot)) === d0(); });
    var hx = holds().filter(function (h) { return h.o.until - now() < DAY && inCtx(h.id); });
    var waiting = convos().filter(function (c) { return c.status === 'waiting'; });
    var tomorrowUnconf = vs.filter(function (v) { return v.lead && !v.confirmed && !v.outcome && A.dayStart(A.slotTime(v.slot)) === d0() + DAY; });
    var open = A.counts(function (u) { return inCtx(u.id); });
    var att = [];
    waiting.forEach(function (c) { att.push(['b', ICON.chat, (c.user && c.user.name ? c.user.name : 'A website visitor') + ' is waiting in chat', 'Asked for a person · ' + (c.channel === 'whatsapp' ? 'WhatsApp' : 'website'), '<a class="so-btn pri" href="#inbox/' + c.id + '">Reply</a>']); });
    if (tomorrowUnconf.length) att.push(['g', ICON.cal, tomorrowUnconf.length + ' visit' + (tomorrowUnconf.length > 1 ? 's' : '') + ' tomorrow not confirmed', tomorrowUnconf.map(function (v) { return v.name; }).slice(0, 3).join(', ') + ' · a call the day before halves no-shows', '<a class="so-btn pri" href="#queue">Confirm</a>']);
    if (nNew.length) att.push(['g', ICON.phone, nNew.length + ' new enquiries not called yet', 'Oldest: ' + A.esc(nNew[nNew.length - 1].name) + ', ' + A.ago(nNew[nNew.length - 1].created) + ' · ' + A.esc(nNew[nNew.length - 1].source.toLowerCase()), '<a class="so-btn pri" href="#queue">Call</a>']);
    if (over.length) att.push(['r', ICON.clock, over.length + ' follow-up' + (over.length > 1 ? 's' : '') + ' overdue', over.map(function (l) { return l.name; }).slice(0, 3).join(', '), '<button type="button" class="so-btn" data-kpi="over">Show</button>']);
    holds().filter(function (h) { return h.o.partner && h.o.pending && inCtx(h.id); }).forEach(function (h) { var hrs = Math.max(0, Math.round((h.o.until - now()) / 36e5)); att.unshift(['g', ICON.home, h.id + ' · partner hold to approve', A.esc(A.PARTNER.name + ' for ' + (h.o.client || 'a client')) + ' · ends in ' + hrs + ' h', '<button type="button" class="so-btn pri" data-approve="' + h.id + '">Approve</button>']); });
    hx.forEach(function (h) { if (h.o.partner && h.o.pending) return; var hrs = Math.max(0, Math.round((h.o.until - now()) / 36e5)); att.push(['g', ICON.home, h.id + ' hold ends in ' + hrs + ' h', A.esc(h.o.by || '') + (h.o.note ? ' · ' + A.esc(h.o.note) : ''), '<button type="button" class="so-btn" data-release="' + h.id + '">Release</button>']); });
    var pendN = holds().filter(function (h) { return h.o.partner && h.o.pending && inCtx(h.id); }).length, endN = hx.filter(function (h) { return !(h.o.partner && h.o.pending); }).length, parts = [];
    if (pendN) parts.push(pendN + ' partner hold' + (pendN > 1 ? 's' : '') + ' to approve');
    parts.push(tv.length + ' visit' + (tv.length === 1 ? '' : 's') + ' at the lounge');
    if (endN) parts.push(endN + ' hold' + (endN > 1 ? 's' : '') + ' ending'); else if (nNew.length) parts.push(nNew.length + ' new enquiries to call');
    var html = '<div class="so-hello"><p><b>' + new Date(now()).toLocaleDateString('en-IN', { weekday: 'long' }) + '</b> · ' + parts.join(' · ') + '</p><small>' + A.fmtDay(now(), { day: 'numeric', month: 'long' }) + ' · Ritika Menon, sales manager' + (ctxTower ? ' · ' + A.tower(ctxTower).name + ' only' : ' · all towers') + '</small></div>' + towersCard();
    html += '<div class="so-kpis">' +
      kpi('new', 'New enquiries', nNew.length, '+' + Math.min(nNew.length, 4) + ' since yesterday', 'up', 11) +
      kpi('over', 'Calls overdue', over.length, over.length ? 'promised, not made' : 'none overdue', over.length ? 'dn' : 'up', 12, over.length ? 'bad' : '') +
      kpi('visits', 'Visits today', tv.length, tv.filter(function (v) { return v.outcome; }).length + ' done · ' + vs.filter(function (v) { return A.dayStart(A.slotTime(v.slot)) === d0() + DAY; }).length + ' tomorrow', '', 13) +
      kpi('holds', 'Holds ending in 24 h', hx.length, hx.length ? 'release or convert' : 'nothing ending', '', 14, hx.length ? 'warn' : '') +
      kpi('units', 'Homes open' + (ctxTower ? ' in ' + A.tower(ctxTower).name : ''), open.avail, open.hold + ' on hold · ' + Math.round(open.sold / open.total * 100) + '% sold', 'up', 15) + '</div>';
    var attHtml = att.length ? att.map(function (a) { return '<li><span class="ic ' + a[0] + '">' + a[1] + '</span><span><b>' + a[2] + '</b><small>' + a[3] + '</small></span>' + a[4] + '</li>'; }).join('') : '<li><span></span><span><b>All clear</b><small>Nothing needs you right now. New website enquiries appear here the moment they land.</small></span><span></span></li>';
    var nn = A.SLOTS.map(function (s) {
      var k = A.slotKey(d0(), s), list = tv.filter(function (v) { return v.slot === k; }), t = A.slotTime(k), past = t + 90 * 6e4 < now(), cur2 = t <= now() && !past;
      var used = list.filter(function (v) { return v.mode !== 'video'; }).length;
      return '<div class="' + (past ? 'past' : cur2 ? 'cur' : '') + '"><h3><span>' + s + '</span><span>' + used + '/' + A.SLOT_CAP + '</span></h3><span class="cap"><i style="width:' + Math.round(used / A.SLOT_CAP * 100) + '%"></i></span>' +
        list.map(function (v) { return '<button type="button" class="so-pill" data-visit="' + v.id + '"><i class="' + (/chat/i.test(v.source) ? 'chat' : /booking|website/i.test(v.source) ? 'web' : '') + '"></i>' + A.esc(v.name.split(' ')[0]) + (v.unit ? ' · ' + v.unit : '') + '</button>'; }).join('') + '</div>';
    }).join('');
    var left = Math.max(0, queue.length - qi), nx = queue[qi] && lead(queue[qi].lead);
    var qcard = '<div class="so-card"><div class="so-ch"><h2>Call queue</h2><span class="sp"></span><small>' + left + ' left · ≈ ' + left * 4 + ' min</small></div><div class="so-queue-card"><span class="meter"><i style="width:' + (queue.length ? Math.round(qi / queue.length * 100) : 100) + '%"></i></span>' +
      (nx ? '<p><b style="font-weight:500">Next: ' + A.esc(nx.name) + '</b><br><small style="color:var(--so-mute)">' + (queue[qi].kind === 'confirm' ? 'Confirm the visit' : A.esc(nx.source)) + ' · ' + A.esc(nx.city) + '</small></p><a class="so-btn pri lg" href="#queue">' + ICON.phone + 'Start calling</a>' : '<p style="color:var(--so-mute)">Queue cleared.</p>') + '</div></div>';
    html += '<div class="so-grid"><div><div class="so-card"><div class="so-ch"><h2>Needs your attention</h2><span class="sp"></span><small>' + att.length + '</small></div><ul class="so-att">' + attHtml + '</ul></div>' +
      '<div class="so-card"><div class="so-ch"><h2>Now and next at the lounge</h2><span class="sp"></span><a class="so-btn ghost" href="#visits">Board ' + ICON.chev + '</a></div><div class="so-now">' + nn + '</div></div></div>' +
      '<div>' + qcard + '<div class="so-card"><div class="so-ch"><h2>Activity</h2></div><ul class="so-feed">' + feed() + '</ul></div></div></div>';
    main.innerHTML = html;
  }
  function kpi(id, label, val, sub, dir, seed, cls) { return '<button type="button" class="so-kpi ' + (cls || '') + '" data-kpi="' + id + '"><span>' + label + '</span><b class="so-n">' + val + '</b><small class="' + (dir || '') + '">' + sub + '</small>' + spark(seed, val, dir !== 'dn') + '</button>'; }
  function feed() {
    var items = [];
    leads().slice(0, 30).forEach(function (l) { items.push({ t: l.created, i: /chat/i.test(l.source) ? 'b' : 'g', h: '<b style="font-weight:500">' + A.esc(l.name) + '</b> · ' + A.esc(l.source) + (l.unit ? ' ' + unitTag(l.unit) : '') }); });
    A.get('log', []).slice(0, 20).forEach(function (e) { if (e.kind === 'inv') items.push({ t: e.t, i: '', h: unitTag(e.unit) + ' ' + A.STATUS[e.from].label.toLowerCase() + ' → ' + A.STATUS[e.to].label.toLowerCase() + ' · ' + A.esc(e.by) }); });
    return items.sort(function (a, b) { return b.t - a.t; }).slice(0, 8).map(function (i) { return '<li><span class="so-av sm' + (i.i === 'g' ? ' g' : '') + '">' + (i.i === 'b' ? '◐' : i.i === 'g' ? '+' : '⇄') + '</span><span>' + i.h + '</span><small>' + A.ago(i.t) + '</small></li>'; }).join('');
  }

  /* ================= CALL QUEUE (focus mode) ================= */
  function focus() {
    if (paused) { main.innerHTML = '<div class="so-focus"><div class="so-fcard"><h2>Queue paused</h2><p style="color:var(--so-mute)">' + (queue.length - qi) + ' calls waiting. Back when you are.</p><div class="so-factions"><button type="button" class="so-btn pri lg" data-q="resume">Resume calling</button></div></div></div>'; return; }
    if (qi >= queue.length) { main.innerHTML = '<div class="so-focus"><div class="so-fcard"><h2>Queue cleared</h2><p style="color:var(--so-mute)">Every confirmation and new enquiry has had its call. New website enquiries join the end of the queue as they land.</p><div class="so-factions"><a class="so-btn" href="#today">Back to Today</a><span class="sp"></span><button type="button" class="so-btn pri" data-q="restart">Run it again</button></div></div></div>'; return; }
    var item = queue[qi], l = lead(item.lead); if (!l) { qi++; return focus(); }
    var v = item.visit ? A.visits().filter(function (x) { return x.id === item.visit; })[0] : null;
    var left = queue.length - qi;
    var title = item.kind === 'confirm' && v ? 'Confirm the visit on ' + A.slotLabel(v.slot) : (l.stage === 'new' ? 'New enquiry, first call' : 'Follow-up call');
    main.innerHTML = '<div class="so-focuswrap"><div class="so-focus"><div class="bar"><span>Ready to call · <b style="color:var(--so-ink)">' + (qi + 1) + ' of ' + queue.length + '</b></span><span class="meter"><i style="width:' + Math.round(qi / queue.length * 100) + '%"></i></span><span>≈ ' + left * 4 + ' min left · aim ≈ 4 min</span></div>' +
      '<article class="so-fcard" aria-live="polite"><div class="who"><span class="so-av">' + initials(l.name) + '</span><div><h2>' + A.esc(l.name) + '</h2><small>' + title + ' · ' + A.esc(l.city) + (l.nri ? ' · NRI' : '') + '</small></div></div>' +
      '<div class="so-remark"><small>Last remark</small>' + A.esc(l.remark) + '</div>' +
      '<dl class="so-props">' + prop('Phone', A.esc(l.phone)) + prop('Source', srcTag(l)) + prop('Stage', stage(l.stage)) + prop('Interest', l.interest ? A.esc(l.interest) : '<button type="button" class="so-add" data-gap="interest" data-lead="' + l.id + '">+ Add interest</button>') + prop('Budget', l.budget ? A.esc(l.budget) : '<button type="button" class="so-add" data-gap="budget" data-lead="' + l.id + '">+ Add budget</button>') + prop('Home', l.unit ? unitTag(l.unit) : '<button type="button" class="so-add" data-gap="unit" data-lead="' + l.id + '">+ Add a home</button>') + '</dl>' +
      '<div><p style="font-size:12.5px;color:var(--so-mute);margin-bottom:8px">How did it go? <span>(keys 1–6)</span></p><div class="so-out" role="group" aria-label="Call outcome">' + OUTCOMES.map(function (o) { return '<button type="button" data-out="' + o[0] + '" aria-pressed="' + (qOutcome === o[0]) + '">' + ICON[o[2]] + o[1] + '</button>'; }).join('') + '</div></div>' +
      '<p class="so-next" id="so-next"' + (qOutcome ? '' : ' hidden') + '>' + nextStep(item, l, qOutcome) + '</p>' +
      '<div class="so-factions"><button type="button" class="so-btn" data-q="skip">Skip</button><button type="button" class="so-btn ghost" data-q="pause">Pause</button><span class="sp"></span><button type="button" class="so-btn ghost" data-open="' + l.id + '">Open record</button><button type="button" class="so-btn pri lg" data-q="save"' + (qOutcome ? '' : ' disabled') + '>Save &amp; next</button></div></article></div>' + queueRail() + '</div>';
  }
  /* the right-hand rail of focus mode: how the day is going, and who is next */
  function queueRail() {
    var t0 = d0(), made = 6, conn = 3, booked = 1;       // this morning's calls, before the queue was opened
    leads().forEach(function (l) { l.log.forEach(function (e) { if (e.t >= t0) { if (e.k === 'call') { made++; if (/Connected/.test(e.s)) conn++; } if (e.k === 'visit' && /booked/i.test(e.s)) booked++; } }); });
    var target = 24, up = queue.slice(qi + 1, qi + 8).map(function (it, i) {
      var l = lead(it.lead); if (!l) return '';
      var why = it.kind === 'confirm' ? 'Confirm the visit' : l.stage === 'new' ? 'New · ' + l.source.toLowerCase() : 'Follow-up · ' + dueTxt(l.next).toLowerCase();
      return '<li><button type="button" class="so-up" data-upnext="' + (qi + 1 + i) + '"><span class="so-av sm">' + initials(l.name) + '</span><span><b>' + A.esc(l.name) + '</b><small>' + A.esc(why) + '</small></span><span class="so-due">≈ 4 min</span></button></li>';
    }).join('');
    return '<aside class="so-rail" aria-label="Up next"><div class="so-card"><div class="so-ch"><h2>Your day so far</h2></div><div class="so-day"><div class="row"><span>Calls made</span><b class="so-n">' + made + ' of ' + target + '</b></div><span class="meter"><i style="width:' + Math.min(100, Math.round(made / target * 100)) + '%"></i></span><div class="row"><span>Connected</span><b class="so-n">' + conn + '</b></div><div class="row"><span>Visits booked</span><b class="so-n">' + booked + '</b></div></div></div>' +
      '<div class="so-card"><div class="so-ch"><h2>Up next</h2><span class="sp"></span><small>' + Math.max(0, queue.length - qi - 1) + ' more</small></div><ul>' + (up || '<li><span class="so-empty" style="padding:18px 14px;justify-items:start;text-align:left">That is the last call in the queue.</span></li>') + '</ul></div></aside>';
  }
  function nextStep(item, l, o) {
    if (!o) return '';
    if (o === 'connected') return item.kind === 'confirm' ? '✓ Visit confirmed. A WhatsApp reminder goes the evening before.' : 'Suggested next step: <button type="button" class="so-btn" data-open="' + l.id + '">Book a site visit</button><button type="button" class="so-btn" data-open="' + l.id + '">Hold a home</button>';
    if (o === 'later' || o === 'busy' || o === 'noanswer') return l.name.split(' ')[0] + ' goes back in the queue ' + (o === 'busy' ? 'in an hour' : o === 'noanswer' ? 'in three hours' : 'tomorrow at the same time') + '.';
    if (o === 'wrong') return 'Marked lost unless an email reply comes in: ' + A.esc(l.email);
    return 'Try again tomorrow morning; a switched-off phone often means travel.';
  }
  function saveOutcome() {
    var item = queue[qi], l = lead(item.lead), o = qOutcome, label = OUTCOMES.filter(function (x) { return x[0] === o; })[0][1];
    var next = { connected: now() + 2 * DAY, noanswer: now() + 3 * 36e5, busy: now() + 36e5, wrong: null, off: now() + DAY, later: now() + 20 * 36e5 }[o];
    var before = JSON.parse(JSON.stringify(l));
    if (o === 'connected' && l.stage === 'new') l.stage = 'contacted';
    if (o === 'wrong') l.stage = 'lost';
    l.next = next;
    if (o === 'connected') l.remark = item.kind === 'confirm' ? 'Confirmed the visit on ' + A.fmtDay(now(), { day: 'numeric', month: 'short' }) + '.' : 'Connected ' + A.fmtDay(now(), { day: 'numeric', month: 'short' }) + '. ' + (l.unit ? 'Discussed ' + l.unit + '. ' : '') + 'Next: site visit or cost sheet.';
    saveLead(l, { k: 'call', s: (item.kind === 'confirm' ? 'Confirmation call · ' : 'Call · ') + label });
    if (item.kind === 'confirm' && o === 'connected') { var vs = A.visits(); vs.forEach(function (v) { if (v.id === item.visit) v.confirmed = true; }); A.saveVisits(vs); }
    var at = qi; qi++; qOutcome = null; focus(); counts();
    undo(label + ' saved for ' + l.name.split(' ')[0] + '.', function () { var ls = leads(); ls.forEach(function (x, i) { if (x.id === before.id) ls[i] = before; }); A.saveLeads(ls); qi = at; focus(); counts(); });
  }

  /* ================= ENQUIRIES ================= */
  var FILTERS = [['all', 'All'], ['new', 'New'], ['due', 'Due today'], ['over', 'Overdue'], ['chat', 'From chat'], ['web', 'Website'], ['nri', 'NRI'], ['visit', 'Visit booked']];
  var COLS = [['stage', 'Stage'], ['interest', 'Interest'], ['source', 'Source'], ['next', 'Next call'], ['owner', 'Owner'], ['created', 'Came in']];
  var lf = 'all', q = '', sortK = 'created', sortD = -1, cols = A.get('so-cols', { stage: 1, interest: 1, source: 1, next: 1, owner: 1, created: 1 });
  function lmatch(l) {
    if (q && (l.name + ' ' + l.city + ' ' + (l.unit || '') + ' ' + l.source + ' ' + l.phone).toLowerCase().indexOf(q.toLowerCase()) < 0) return false;
    if (ctxTower && l.unit && l.unit[0] !== ctxTower) return false;
    switch (lf) { case 'new': return l.stage === 'new'; case 'due': return l.next && l.next >= d0() && l.next < d0() + DAY; case 'over': return l.next && l.next < d0() && l.stage !== 'lost' && l.stage !== 'booked';
      case 'chat': return /chat/i.test(l.source); case 'web': return /brochure|picker|booking|nri|cost/i.test(l.source); case 'nri': return l.nri; case 'visit': return l.stage === 'visit'; }
    return true;
  }
  function leadsView() {
    var all = leads(), rows = all.filter(lmatch);
    rows.sort(function (a, b) { var x = a[sortK], y = b[sortK]; if (sortK === 'stage') { x = Object.keys(A.STAGES).indexOf(x); y = Object.keys(A.STAGES).indexOf(y); } if (x == null) x = Infinity; if (y == null) y = Infinity; return (x > y ? 1 : x < y ? -1 : 0) * sortD; });
    var saved = A.get('saved-filters', []);
    var countFor = function (k) { var o = lf; lf = k; var n = all.filter(lmatch).length; lf = o; return n; };
    var th = function (k, label, m) { if (!cols[k] && k !== 'name') return ''; var s = sortK === k; return '<th scope="col"' + (s ? ' aria-sort="' + (sortD > 0 ? 'ascending' : 'descending') + '"' : '') + ' class="' + (m || '') + '"><button type="button" data-sort="' + k + '">' + label + (s ? (sortD > 0 ? ' ↑' : ' ↓') : '') + '</button></th>'; };
    var html = '<div class="so-toolbar"><div class="so-seg" role="group" aria-label="Views">' + FILTERS.map(function (f) { return '<button type="button" data-lf="' + f[0] + '" aria-pressed="' + (lf === f[0]) + '">' + f[1] + '<span class="n">' + countFor(f[0]) + '</span></button>'; }).join('') +
      saved.map(function (s, i) { return '<button type="button" data-saved="' + i + '" aria-pressed="false">★ ' + A.esc(s.name) + '</button>'; }).join('') + '</div><span class="sp"></span>' +
      '<label class="vh" for="so-lq">Search enquiries</label><input class="so-in" id="so-lq" placeholder="Search name, phone, unit…" value="' + A.esc(q) + '" style="width:210px">' +
      '<button type="button" class="so-btn" id="so-save">Save view</button><button type="button" class="so-btn" id="so-cols" aria-haspopup="menu">Columns</button></div>';
    if (selLeads.length) html += '<div class="so-bulk"><b>' + selLeads.length + ' selected</b><label class="vh" for="so-ba">Assign to</label><select class="so-in" id="so-ba">' + A.TEAM.map(function (m) { return '<option value="' + m.id + '">Assign to ' + m.name + '</option>'; }).join('') + '</select><button type="button" class="so-btn pri" id="so-bap">Preview</button><span class="so-preview" id="so-bpv"></span><span style="flex:1"></span><button type="button" class="so-btn" id="so-bclr">Clear</button></div>';
    html += '<div class="so-tablewrap"><table class="so-table"><caption class="vh">Enquiries</caption><thead><tr><th scope="col" style="width:34px"><input type="checkbox" id="so-all" aria-label="Select all"' + (rows.length && rows.every(function (l) { return selLeads.indexOf(l.id) >= 0; }) ? ' checked' : '') + '></th>' + th('name', 'Buyer') + th('stage', 'Stage') + th('interest', 'Interest', 'hide-m') + th('source', 'Source', 'hide-m') + th('next', 'Next call') + th('owner', 'Owner', 'hide-m') + th('created', 'Came in', 'hide-m') + '<th scope="col" class="ra"><span class="vh">Actions</span></th></tr></thead><tbody>' +
      (rows.map(function (l) {
        var c = function (k, v, m) { return cols[k] ? '<td class="' + (m || '') + '">' + v + '</td>' : ''; };
        return '<tr class="' + (selLeads.indexOf(l.id) >= 0 ? 'sel' : '') + '" data-lead="' + l.id + '"><td><input type="checkbox" data-pick="' + l.id + '" aria-label="Select ' + A.esc(l.name) + '"' + (selLeads.indexOf(l.id) >= 0 ? ' checked' : '') + '></td>' +
          '<td class="nm"><b>' + A.esc(l.name) + '</b><small class="hide-m">' + A.esc(l.city) + '</small>' + (l.nri ? ' <span class="so-tag g">NRI</span>' : '') + '</td>' +
          c('stage', stage(l.stage)) + c('interest', A.esc(l.interest || '') + ' ' + unitTag(l.unit), 'hide-m') + c('source', srcTag(l), 'hide-m') + c('next', '<span class="so-due ' + dueCls(l.next) + '">' + dueTxt(l.next) + '</span>') +
          c('owner', '<span class="so-av sm" title="' + A.member(l.owner).name + '">' + A.member(l.owner).init + '</span>', 'hide-m') + c('created', '<span class="so-due">' + A.ago(l.created) + '</span>', 'hide-m') +
          '<td class="ra"><span class="rowact"><button type="button" class="so-btn" data-call="' + l.id + '">' + ICON.phone + '<span class="hide-m">Call</span></button><button type="button" class="so-ib" data-more="' + l.id + '" aria-label="More actions for ' + A.esc(l.name) + '">' + ICON.more + '</button></span></td></tr>';
      }).join('') || '<tr><td colspan="9"><div class="so-empty"><b>No enquiries in this view</b><span>Try All, or clear the search. New website and chat enquiries land here first.</span><button type="button" class="so-btn" data-lf="all">Show all</button></div></td></tr>') +
      '</tbody></table></div>';
    main.innerHTML = html;
    var inp = $('#so-lq'); inp.addEventListener('input', function () { q = inp.value; var p = inp.selectionStart; leadsView(); var n = $('#so-lq'); n.focus(); n.setSelectionRange(p, p); });
  }

  /* ---------------- record slide-over ---------------- */
  var slide = $('#so-slide'), scrim = $('#so-scrim'), cur = null, lastFocus = null;
  function openLead(id, focusOn) {
    var l = lead(id); if (!l) return; cur = id; lastFocus = document.activeElement;
    var vs = A.visits().filter(function (v) { return v.lead === id; });
    var suggest = A.UNITS.filter(function (u) { return A.status(u.id) === 'avail' && (!l.interest || A.TYPES[u.type].short === l.interest); }).slice(0, 30);
    var slots = ''; for (var i = 0; i < 7; i++) A.SLOTS.forEach(function (s) { var k = A.slotKey(d0() + i * DAY, s); if (A.slotTime(k) > now() + 36e5 && A.slotUsed(k) < A.SLOT_CAP) slots += '<option value="' + k + '">' + A.slotLabel(k) + ' · ' + (A.SLOT_CAP - A.slotUsed(k)) + ' free</option>'; });
    slide.innerHTML = '<div class="so-sh"><span class="so-av">' + initials(l.name) + '</span><div style="flex:1;min-width:0"><h2>' + A.esc(l.name) + '</h2><small>' + l.id + ' · ' + A.esc(l.source) + ' · ' + A.ago(l.created) + '</small></div><button type="button" class="so-btn pri" data-call="' + l.id + '">' + ICON.phone + 'Log a call</button><button type="button" class="so-ib" data-close aria-label="Close">' + ICON.x + '</button></div>' +
      '<div class="so-sb"><div class="so-remark"><small>Last remark</small>' + A.esc(l.remark) + '</div>' +
      '<dl class="so-props" style="grid-template-columns:1fr 1fr">' + prop('Phone', A.esc(l.phone)) + prop('Email', '<span style="word-break:break-all">' + A.esc(l.email || '—') + '</span>') +
      prop('Stage', '<label class="vh" for="so-st">Stage</label><select class="so-in" id="so-st" style="min-height:28px">' + Object.keys(A.STAGES).map(function (k) { return '<option value="' + k + '"' + (k === l.stage ? ' selected' : '') + '>' + A.STAGES[k] + '</option>'; }).join('') + '</select>') + prop('Owner', A.member(l.owner).name) +
      prop('Interest', l.interest ? A.esc(l.interest) : '<button type="button" class="so-add" data-gap="interest" data-lead="' + l.id + '">+ Add interest</button>') + prop('Budget', l.budget ? A.esc(l.budget) : '<button type="button" class="so-add" data-gap="budget" data-lead="' + l.id + '">+ Add budget</button>') +
      prop('Home', l.unit ? unitTag(l.unit) + ' <a class="so-add" href="picker.html?unit=' + l.unit + '" target="_blank" rel="noopener">open ↗</a>' : '<button type="button" class="so-add" data-gap="unit" data-lead="' + l.id + '">+ Add a home</button>') + prop('Next call', '<span class="so-due ' + dueCls(l.next) + '">' + dueTxt(l.next) + '</span>') + '</dl>' +
      (l.convo ? '<a class="so-btn" href="#inbox/' + l.convo + '">' + ICON.chat + 'Read the chat transcript</a>' : '') +
      '<div><h3>Book a site visit</h3><div style="display:flex;gap:6px;flex-wrap:wrap"><label class="vh" for="so-sl">Slot</label><select class="so-in" id="so-sl" style="flex:1;min-width:180px">' + slots + '</select><label class="vh" for="so-md">Mode</label><select class="so-in" id="so-md"><option value="lounge">Lounge</option><option value="pickup">Metro pickup</option><option value="video">Video</option></select><button type="button" class="so-btn" id="so-book">Book</button></div></div>' +
      '<div><h3>Hold a home for ' + A.esc(l.name.split(' ')[0]) + '</h3><div style="display:flex;gap:6px"><label class="vh" for="so-hu">Home</label><select class="so-in" id="so-hu" style="flex:1">' + (l.unit && A.status(l.unit) === 'avail' ? '<option>' + l.unit + '</option>' : '') + suggest.map(function (u) { return '<option value="' + u.id + '">' + u.id + ' · ' + A.TYPES[u.type].short + ' · ' + A.inr(A.price(u).total) + '</option>'; }).join('') + '</select><button type="button" class="so-btn" id="so-hold">Hold 48 h</button></div></div>' +
      (vs.length ? '<div><h3>Visits</h3><ul class="so-related">' + vs.map(function (v) { return '<li>' + A.slotLabel(v.slot) + ' · ' + MODE[v.mode] + (v.outcome ? ' · <span class="so-tag">' + A.esc(v.outcome) + '</span>' : v.confirmed ? ' · <span class="so-tag gr">Confirmed</span>' : '') + '</li>'; }).join('') + '</ul></div>' : '') +
      '<div><h3>Add a note</h3><form class="so-note" id="so-nf"><label class="vh" for="so-nt">Note</label><input class="so-in" id="so-nt" placeholder="Prefers calls after 6 pm…"><button class="so-btn" type="submit">Add</button></form></div>' +
      '<div><h3>Timeline</h3><ul class="so-tl">' + l.log.slice().reverse().map(function (e) { return '<li><span>' + A.esc(e.s) + '<small>' + A.fmtDay(e.t, { day: 'numeric', month: 'short' }) + ' ' + A.fmtTime(e.t) + '</small></span></li>'; }).join('') + '</ul></div>' +
      '<div style="display:flex;gap:6px"><button type="button" class="so-btn" data-stage="booked">Mark booked</button><button type="button" class="so-btn ghost" data-stage="lost">Mark lost</button></div></div>';
    slide.classList.add('on'); scrim.classList.add('on'); slide.setAttribute('aria-hidden', 'false');
    var f = focusOn === 'visit' ? $('#so-sl') : slide.querySelector('[data-close]'); f && f.focus();
  }
  function closeSlide() { if (!cur) return; slide.classList.remove('on'); scrim.classList.remove('on'); slide.setAttribute('aria-hidden', 'true'); cur = null; if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); if (/^#leads\//.test(location.hash)) history.replaceState(null, '', '#leads'); }
  scrim.addEventListener('click', function () { closeSlide(); closePop(); });
  slide.addEventListener('change', function (e) { if (e.target.id !== 'so-st') return; var l = lead(cur), prev = l.stage; l.stage = e.target.value; saveLead(l, { k: 'stage', s: 'Stage changed to ' + A.STAGES[l.stage] }); render(); undo('Stage changed to ' + A.STAGES[l.stage] + '.', function () { var x = lead(l.id); x.stage = prev; saveLead(x); openLead(x.id); render(); }); });
  slide.addEventListener('submit', function (e) { if (e.target.id !== 'so-nf') return; e.preventDefault(); var v = $('#so-nt').value.trim(); if (!v) return; var l = lead(cur); l.remark = v; saveLead(l, { k: 'note', s: 'Note: ' + v }); openLead(l.id); A.toast('Note saved and pinned as the last remark.'); });
  function gap(btn) {
    var k = btn.dataset.gap, id = btn.dataset.lead, dd = btn.parentNode, l = lead(id);
    var opts = { interest: ['2 BHK', '3 BHK', '3 BHK + study', '4 BHK'], budget: ['Under ₹2.5 Cr', '₹2.5–3.5 Cr', '₹3.5–5 Cr', '₹5 Cr +'] }[k];
    dd.innerHTML = k === 'unit' ? '<input class="so-in" style="min-height:28px;width:120px" aria-label="Unit" placeholder="A-4002" id="so-gap">' : '<select class="so-in" style="min-height:28px" id="so-gap" aria-label="' + k + '"><option value="">Choose…</option>' + opts.map(function (o) { return '<option>' + o + '</option>'; }).join('') + '</select>';
    var inp = $('#so-gap'); inp.focus();
    var done = false, commit = function () {
      if (done) return; done = true; var v = inp.value.trim(); if (k === 'unit') { v = v.toUpperCase(); if (v && !A.unit(v)) { A.toast('There is no home called ' + v + '.'); render(); if (cur) openLead(cur); return; } }
      if (!v) { render(); if (cur) openLead(cur); return; } var prev = l[k]; l[k] = v; saveLead(l, { k: 'edit', s: k + ' set to ' + v }); render(); if (cur) openLead(cur);
      undo(k.charAt(0).toUpperCase() + k.slice(1) + ' saved.', function () { var x = lead(id); x[k] = prev; saveLead(x); render(); if (cur) openLead(cur); });
    };
    inp.addEventListener('change', commit); inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { done = true; render(); } });
  }

  /* ================= SITE VISITS: slot board, drag to reschedule ================= */
  function visitsView() {
    var tabs = ''; for (var i = -1; i < 7; i++) { var d = d0() + i * DAY, n = A.visits().filter(function (v) { return A.dayStart(A.slotTime(v.slot)) === d; }).length; tabs += '<button type="button" data-vday="' + d + '" aria-pressed="' + (d === visitDay) + '">' + (i === 0 ? 'Today' : i === -1 ? 'Yesterday' : i === 1 ? 'Tomorrow' : A.fmtDay(d)) + '<span class="n">' + n + '</span></button>'; }
    var vs = A.visits().filter(function (v) { return A.dayStart(A.slotTime(v.slot)) === visitDay; });
    var cols2 = A.SLOTS.map(function (s) {
      var k = A.slotKey(visitDay, s), list = vs.filter(function (v) { return v.slot === k; }), used = list.filter(function (v) { return v.mode !== 'video'; }).length;
      return '<div class="so-col" data-slot="' + k + '"><h3>' + A.fmtTime(A.slotTime(k)) + '<small>' + used + ' of ' + A.SLOT_CAP + '</small></h3><span class="cap"><i style="width:' + Math.round(used / A.SLOT_CAP * 100) + '%"></i></span>' +
        list.map(function (v) {
          var src = /chat/i.test(v.source) ? '<span class="so-tag b">Chat</span>' : /booking|website/i.test(v.source) ? '<span class="so-tag g">Website</span>' : '';
          return '<button type="button" class="so-vc" draggable="true" data-visit="' + v.id + '"><b>' + A.esc(v.name) + '</b><span class="m">' + MODE[v.mode] + ' · ' + (v.party || 2) + ' people · ' + A.member(v.rm).init + '</span><span class="so-chip-row">' + (v.unit ? unitTag(v.unit) : '') + src + (v.outcome ? '<span class="so-tag">' + A.esc(v.outcome) + '</span>' : v.confirmed ? '<span class="so-tag gr">Confirmed</span>' : '') + '</span></button>';
        }).join('') + (used < A.SLOT_CAP ? '<div class="so-free">' + (A.SLOT_CAP - used) + ' free</div>' : '') + '</div>';
    }).join('');
    main.innerHTML = '<div class="so-toolbar"><div class="so-seg" role="group" aria-label="Day">' + tabs + '</div><span class="sp"></span><span class="hide-m" style="color:var(--so-mute);font-size:12.5px">Drag a card to another time to reschedule</span></div><div class="so-board">' + cols2 + '</div>' + weekHeat();
  }
  /* the week at a glance: every slot, how full it is, and where the visits come from */
  function weekHeat() {
    var days = []; for (var i = 0; i < 7; i++) days.push(d0() + i * DAY);
    var head = '<tr><th></th>' + days.map(function (d, i) { return '<th scope="col">' + (i === 0 ? 'Today' : A.fmtDay(d, { weekday: 'short', day: 'numeric' })) + '</th>'; }).join('') + '</tr>';
    var open = 0, busiest = { n: -1, k: '' };
    var rows = A.SLOTS.map(function (s) {
      return '<tr><th scope="row">' + A.fmtTime(A.slotTime(A.slotKey(d0(), s))) + '</th>' + days.map(function (d) {
        var k = A.slotKey(d, s), used = A.slotUsed(k), past = A.slotTime(k) < now();
        if (!past) { open += Math.max(0, A.SLOT_CAP - used); if (used > busiest.n) busiest = { n: used, k: k }; }
        return '<td><button type="button" class="so-heat l' + Math.min(3, used) + '" data-vday="' + d + '"' + (past ? ' disabled' : '') + ' aria-label="' + (past ? 'Passed' : used + ' of ' + A.SLOT_CAP) + ', ' + A.slotLabel(k) + '">' + (past ? '·' : used + '/' + A.SLOT_CAP) + '</button></td>';
      }).join('') + '</tr>';
    }).join('');
    var wk = A.visits().filter(function (v) { var t = A.slotTime(v.slot); return t >= d0() && t < d0() + 7 * DAY; });
    var web = wk.filter(function (v) { return /booking|website|picker|nri/i.test(v.source || ''); }).length, chat = wk.filter(function (v) { return /chat/i.test(v.source || ''); }).length;
    var video = wk.filter(function (v) { return v.mode === 'video'; }).length, pickup = wk.filter(function (v) { return v.mode === 'pickup'; }).length;
    var stat = function (k, v) { return '<div class="so-stat"><span>' + k + '</span><b class="so-n">' + v + '</b></div>'; };
    return '<div class="so-grid" style="margin-top:16px"><div class="so-card so-heatcard"><div class="so-ch"><h2>The week at a glance</h2><span class="sp"></span><small>Click a slot to open its day</small></div><div style="padding:8px 10px 12px;overflow-x:auto"><table><caption class="vh">Booked places per slot for the next seven days</caption><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="so-card"><div class="so-ch"><h2>This week</h2></div>' + stat('Visits booked', wk.length) + stat('From the website', web) + stat('From chat', chat) + stat('Metro pickups · video', pickup + ' · ' + video) + stat('Open places', open) + stat('Busiest slot', busiest.n > 0 ? A.slotLabel(busiest.k).replace(/^[A-Za-z]+, /, '') : '—') + '</div></div>';
  }
  var dragV = null;
  main.addEventListener('dragstart', function (e) { var c = e.target.closest && e.target.closest('.so-vc'); if (!c) return; dragV = c.dataset.visit; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragV); } catch (x) { } });
  main.addEventListener('dragend', function () { dragV = null; $$('.so-col').forEach(function (c) { c.classList.remove('drop'); }); });
  main.addEventListener('dragover', function (e) { var c = e.target.closest && e.target.closest('.so-col'); if (!c || !dragV) return; e.preventDefault(); $$('.so-col').forEach(function (x) { x.classList.toggle('drop', x === c); }); });
  main.addEventListener('drop', function (e) {
    var c = e.target.closest && e.target.closest('.so-col'); if (!c || !dragV) return; e.preventDefault();
    var vs = A.visits(), v = vs.filter(function (x) { return x.id === dragV; })[0], to = c.dataset.slot; if (!v || v.slot === to) return;
    if (v.mode !== 'video' && A.slotUsed(to) >= A.SLOT_CAP) { A.toast('That time is full: three relationship managers, three visits.'); return; }
    var from = v.slot; v.slot = to; v.confirmed = false; A.saveVisits(vs); visitsView(); counts();
    undo(v.name + ' moved to ' + A.fmtTime(A.slotTime(to)) + '. A new confirmation goes on WhatsApp.', function () { var vv = A.visits(); vv.forEach(function (x) { if (x.id === v.id) x.slot = from; }); A.saveVisits(vv); visitsView(); });
  });

  var pop = $('#so-pop');
  function closePop() { pop.hidden = true; }
  function placePop(anchor) { var r = anchor.getBoundingClientRect(); pop.hidden = false; var x = Math.min(innerWidth - 316, Math.max(12, r.left)), y = r.bottom + 8; if (y + pop.offsetHeight > innerHeight - 12) y = Math.max(12, r.top - pop.offsetHeight - 8); pop.style.left = x + 'px'; pop.style.top = y + 'px'; var f = pop.querySelector('button,select,input'); f && f.focus(); }
  function visitPop(id, anchor) {
    var v = A.visits().filter(function (x) { return x.id === id; })[0]; if (!v) return;
    pop.innerHTML = '<h3>' + A.esc(v.name) + '</h3><p>' + A.slotLabel(v.slot) + ' · ' + MODE[v.mode] + (v.unit ? ' · ' + v.unit : '') + ' · with ' + A.member(v.rm).name + '</p><div class="so-chip-row">' + ['Checked in', 'Interested', 'Thinking', 'Not interested', 'No-show'].map(function (o) { return '<button type="button" class="so-btn" data-vout="' + o + '"' + (v.outcome === o ? ' style="border-color:var(--so-gold);color:var(--so-gold)"' : '') + '>' + o + '</button>'; }).join('') + '</div>' + (v.lead ? '<button type="button" class="so-btn pri" data-open="' + v.lead + '">Open the buyer</button>' : '<p>Booked by phone; no enquiry attached.</p>');
    pop.dataset.visit = id; delete pop.dataset.cell; placePop(anchor);
  }

  /* ================= CONVERSATIONS (the website concierge) ================= */
  var inboxSel = null, inboxF = 'open', orbitReady = false, inboxOpenM = false, orbitLoading = false;
  function convos() { var O = window.Orbit; if (!O || !O.convos) return []; return O.convos.list().filter(function (c) { return c.agent === 'launch' && (c.engaged || c.status !== 'bot'); }); }
  function loadOrbit(cb) {
    if (window.Orbit && Orbit.convos && Orbit.agents && Orbit.agents.launch) { orbitReady = true; return cb && cb(); }
    if (orbitLoading) { setTimeout(function () { loadOrbit(cb); }, 200); return; } orbitLoading = true;
    var list = ['../assets/bots/engine.js?v=1', '../assets/bots/agents/launch.js?v=3'], n = 0;
    list.forEach(function (src) { var s = document.createElement('script'); s.src = src; s.async = false; s.onload = s.onerror = function () { if (++n === list.length) { orbitReady = !!window.Orbit; seedChats(); if (window.Orbit) Orbit.convos.on(function () { if (view === 'inbox') inboxView(); counts(); }); cb && cb(); } }; document.head.appendChild(s); });
  }
  function seedChats() {
    if (!window.Orbit || !Orbit.createSession || A.get('chats-seeded', 0)) return; A.set('chats-seeded', 1);
    try {
      var a = Orbit.createSession('launch', { channel: 'web', context: { page: 'picker', unit: 'B-3403' }, source: 'Google search' }); a.start(); a.send('3 bhk under 3.5 cr east facing'); a.send('can someone call me about B-3403?'); a.send('talk to a person');
      var b = Orbit.createSession('launch', { channel: 'whatsapp', context: { page: 'nri' }, source: 'Instagram ad' }); b.start(); b.send('I live in Dubai, kitne ka hai 3 bhk'); b.send('EMI on 3.1 crore for 20 years');
    } catch (e) { }
  }
  function inboxView() {
    if (!orbitReady) { main.innerHTML = '<div class="so-inbox"><div class="l" style="padding:14px;gap:10px;display:grid;align-content:start"><span class="so-skel" style="width:70%"></span><span class="so-skel"></span><span class="so-skel" style="width:85%"></span><span class="so-skel" style="width:60%"></span></div><div class="r"></div></div>'; loadOrbit(inboxView); return; }
    var cs = convos().filter(function (c) { return inboxF === 'all' || (inboxF === 'open' ? c.status !== 'resolved' : c.status === inboxF); }).sort(function (x, y) { return (y.updated || 0) - (x.updated || 0); });
    if (!inboxSel || !cs.some(function (c) { return c.id === inboxSel; })) inboxSel = (cs.filter(function (c) { return c.status === 'waiting'; })[0] || cs[0] || {}).id || null;
    var c = inboxSel ? Orbit.convos.get(inboxSel) : null;
    var stTag = function (s) { return s === 'waiting' ? '<span class="so-tag g">Waiting</span>' : s === 'human' ? '<span class="so-tag b">With you</span>' : s === 'resolved' ? '<span class="so-tag">Resolved</span>' : '<span class="so-tag gr">Concierge</span>'; };
    var list = cs.map(function (x) { var m = x.messages[x.messages.length - 1], nm = x.user && x.user.name ? x.user.name : 'Website visitor'; return '<button type="button" data-cv="' + x.id + '" aria-current="' + (x.id === inboxSel) + '"><span class="so-av sm">' + A.esc(initials(nm).toUpperCase()) + '</span><span style="min-width:0"><b>' + A.esc(nm) + '</b><small>' + A.esc(String(m && m.text || '').replace(/\*\*/g, '').slice(0, 80)) + '</small></span><span>' + stTag(x.status) + '</span></button>'; }).join('') || '<div class="so-empty"><b>No conversations yet</b><span>Chats from the website concierge appear here, newest first.</span><a class="so-btn" href="index.html" target="_blank" rel="noopener">Open the website</a></div>';
    var right = '<div class="so-empty"><b>Pick a conversation</b><span>Waiting chats are at the top.</span></div>';
    if (c) {
      var lead1 = leads().filter(function (l) { return l.convo === c.id; })[0];
      right = '<div class="so-ch"><button type="button" class="so-ib" data-cvback aria-label="Back to the list"' + (innerWidth < 900 ? '' : ' hidden') + '>‹</button><div style="flex:1;min-width:0"><h2>' + A.esc(c.user && c.user.name ? c.user.name : 'Website visitor') + '</h2><small>' + (c.channel === 'whatsapp' ? 'WhatsApp' : 'Website chat') + ' · ' + A.esc(c.source || '') + (c.handoverReason ? ' · asked for a person' : '') + '</small></div>' + stTag(c.status) + (lead1 ? '<button type="button" class="so-btn" data-open="' + lead1.id + '">Open the enquiry</button>' : '') + '</div>' +
        '<div class="so-tx" data-lenis-prevent>' + c.messages.map(function (m) { var cls = m.from === 'user' ? 'u' : m.from === 'agent' ? 'a' : (m.kind === 'system' || m.from === 'system') ? 's' : ''; return '<div class="so-msg ' + cls + '">' + A.esc(String(m.text || '').replace(/\*\*/g, '')) + '<small>' + (m.from === 'agent' ? A.esc(m.name || 'Ritika') + ' · ' : m.from === 'bot' ? 'Concierge · ' : '') + (m.ts ? A.fmtTime(m.ts) : '') + '</small></div>'; }).join('') + '</div>' +
        '<div class="so-reply">' + (c.status === 'human' ? '<form id="so-rf" style="display:flex;gap:8px;flex:1;flex-wrap:wrap"><label class="vh" for="so-rt">Reply</label><input class="so-in" id="so-rt" placeholder="Reply as Ritika…" autocomplete="off" style="flex:1;min-width:160px"><button class="so-btn pri" type="submit">Send</button></form><button type="button" class="so-btn" data-cvact="bot">Hand back</button><button type="button" class="so-btn" data-cvact="resolve">Resolve</button>'
          : c.status === 'resolved' ? '<span style="color:var(--so-mute);font-size:12.5px">Resolved. If they write again it reopens here.</span>' : '<button type="button" class="so-btn pri" data-cvact="take">' + (c.status === 'waiting' ? 'Take over this chat' : 'Join this chat') + '</button><button type="button" class="so-btn" data-cvact="resolve">Resolve</button>') + '</div>';
    }
    main.innerHTML = '<div class="so-inbox' + (c && inboxOpenM ? ' open' : '') + '"><div class="l"><div class="so-seg" role="group" aria-label="Filter">' + [['open', 'Open'], ['waiting', 'Waiting'], ['all', 'All']].map(function (f) { return '<button type="button" data-cvf="' + f[0] + '" aria-pressed="' + (inboxF === f[0]) + '">' + f[1] + '</button>'; }).join('') + '</div><div class="so-clist">' + list + '</div></div><div class="r">' + right + '</div></div>';
    var tx = $('.so-tx'); if (tx) tx.scrollTop = tx.scrollHeight;
  }
  main.addEventListener('submit', function (e) {
    if (e.target.id !== 'so-rf') return; e.preventDefault(); var v = $('#so-rt').value.trim(); if (!v) return;
    Orbit.convos.append(inboxSel, { from: 'agent', name: 'Ritika', text: v }); try { Orbit.events.log('agent_reply', { agent: 'launch', convo: inboxSel }); } catch (x) { } inboxView(); var i = $('#so-rt'); if (i) i.focus();
  });

  /* ================= UNITS & HOLDS ================= */
  function unitsView() {
    var tid = ctxTower || A.get('so-units-t', 'A'), T = A.tower(tid), c = A.counts(function (u) { return u.tower === tid; }), hx = holds();
    var units = T.units.map(function (u) { return u[0]; }), rows = '';
    for (var f = T.floors; f >= 1; f--) rows += '<tr><th scope="row">' + f + '</th>' + units.map(function (p) { var id = T.id + '-' + f + p, st = A.status(id), m = A.statusMeta(id), exp = st === 'hold' && m && m.until && m.until - now() < DAY; return '<td><button type="button" class="so-cell st-' + st + (picked.indexOf(id) >= 0 ? ' picked' : '') + (exp ? ' exp' : '') + '" data-cell="' + id + '" aria-label="' + id + ', ' + A.TYPES[A.unit(id).type].short + ', ' + A.STATUS[st].label + (exp ? ', hold ends within a day' : '') + '">' + f + p + '</button></td>'; }).join('') + '</tr>';
    var html = '<div class="so-toolbar">' + (ctxTower ? '' : '<div class="so-seg" role="group" aria-label="Tower">' + A.TOWERS.map(function (t) { var cc = A.counts(function (u) { return u.tower === t.id; }); return '<button type="button" data-tower="' + t.id + '" aria-pressed="' + (t.id === tid) + '">' + t.name + '<span class="n">' + cc.avail + ' open</span></button>'; }).join('') + '</div>') +
      '<span class="so-legend"><span><i style="background:var(--so-green)"></i>Open ' + c.avail + '</span><span><i style="background:var(--so-gold)"></i>On hold ' + c.hold + '</span><span><i style="background:#3A4A3F"></i>Sold ' + c.sold + '</span></span><span class="sp"></span><span class="hide-m" style="color:var(--so-mute);font-size:12.5px">Click a home · shift-click to select several</span><a class="so-btn" href="picker.html?tower=' + tid + '" target="_blank" rel="noopener">Public picker ↗</a></div>';
    if (picked.length) html += '<div class="so-bulk"><b>' + picked.length + ' selected</b><span>' + picked.slice(0, 8).join(', ') + (picked.length > 8 ? '…' : '') + '</span><span style="flex:1"></span><button type="button" class="so-btn pri" data-bulk="hold">Hold for a partner…</button><button type="button" class="so-btn" data-bulk="release">Release</button><button type="button" class="so-btn" data-bulk="clear">Clear</button></div>';
    html += '<div class="so-grid"><div class="so-card"><div class="so-ch"><h2>' + T.name + ' · ' + T.floors + ' floors × ' + units.length + ' homes</h2></div><div class="so-inv-wrap" style="padding:8px"><table class="so-inv"><caption class="vh">' + T.name + ' inventory</caption><thead><tr><th></th>' + units.map(function (p) { return '<th scope="col">' + p + ' · ' + A.TYPES[A.unit(T.id + '-1' + p).type].short + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div><div class="so-card"><div class="so-ch"><h2>Live holds</h2><span class="sp"></span><small>' + hx.length + '</small></div><ul class="so-feed">' + (hx.map(function (h) { var hrs = Math.round((h.o.until - now()) / 36e5); return '<li><button type="button" class="so-tag ' + (hrs < 24 ? 'g' : '') + '" data-cellbtn="' + h.id + '" style="border:0">' + h.id + '</button><span>' + A.esc(h.o.by || '') + (h.o.client ? ' · for ' + A.esc(h.o.client) : '') + '<br><small style="color:var(--so-mute)">' + A.esc(h.o.note || '') + '</small>' + (h.o.partner && h.o.pending ? '<br><button type="button" class="so-btn pri sm" data-approve="' + h.id + '" style="margin-top:6px">Approve partner hold</button>' : '') + '</span><small>' + hrs + ' h</small></li>'; }).join('') || '<li><span></span><span style="color:var(--so-mute)">No timed holds right now.</span><span></span></li>') + '</ul></div>' +
      '<div class="so-card"><div class="so-ch"><h2>Changes</h2></div><ul class="so-feed">' + (A.get('log', []).filter(function (e) { return e.kind === 'inv'; }).slice(0, 8).map(function (e) { return '<li><span>' + unitTag(e.unit) + '</span><span>' + A.STATUS[e.from].label + ' → ' + A.STATUS[e.to].label + '<br><small style="color:var(--so-mute)">' + A.esc(e.by) + '</small></span><small>' + A.ago(e.t) + '</small></li>'; }).join('') || '<li><span></span><span style="color:var(--so-mute)">Hold or release a home: it shows here and on the public picker at once.</span><span></span></li>') + '</ul></div></div></div>';
    main.innerHTML = html;
  }
  function restore(id, prev, prevO) { var inv = A.inv(); if (prevO) inv[id] = prevO; else delete inv[id]; A.set('inv', inv); A.log({ kind: 'inv', unit: id, from: A.status(id), to: prev, by: 'Undo' }); A.emit('inv', {}); render(); }
  function holdUnit(id, by, hours, note) { var prev = A.status(id), prevO = A.statusMeta(id); A.setStatus(id, 'hold', { by: by, until: now() + hours * 36e5, note: note, keep: true }); render(); undo(id + ' is on hold for ' + hours + ' h, on the public picker too.', function () { restore(id, prev, prevO); }); }
  function cellPop(id, anchor) {
    var u = A.unit(id), st = A.status(id), m = A.statusMeta(id);
    pop.innerHTML = '<h3>' + id + ' · ' + A.TYPES[u.type].short + '</h3><p>' + A.sqft(A.TYPES[u.type].carpet) + ' · ' + u.facing + ' · ' + u.view + '<br><b style="color:var(--so-ink)">' + A.inr(A.price(u).total) + '</b> all-inclusive</p><p>' + A.STATUS[st].label + (m && m.by ? ' · ' + A.esc(m.by) + (m.until && st === 'hold' ? ', until ' + A.fmtDay(m.until) + ' ' + A.fmtTime(m.until) : '') : '') + '</p>' +
      (st === 'avail' ? '<div style="display:grid;gap:6px"><label class="vh" for="so-pb">Held for</label><input class="so-in" id="so-pb" placeholder="Buyer or channel partner"><div style="display:flex;gap:6px"><label class="vh" for="so-ph">How long</label><select class="so-in" id="so-ph" style="flex:1"><option value="24">24 hours</option><option value="48" selected>48 hours</option><option value="72">72 hours</option><option value="168">7 days</option></select><button type="button" class="so-btn pri" data-act="hold">Hold</button></div></div>' : '') +
      '<div class="so-chip-row">' + (st === 'hold' ? '<button type="button" class="so-btn pri" data-act="release">Release</button><button type="button" class="so-btn" data-act="extend">+24 h</button>' : '') + (st !== 'sold' ? '<button type="button" class="so-btn" data-act="sold">Mark sold</button>' : '<button type="button" class="so-btn" data-act="release">Cancel the sale</button>') + '</div>';
    pop.dataset.cell = id; delete pop.dataset.visit; placePop(anchor);
  }
  pop.addEventListener('click', function (e) {
    var t = e.target, k;
    if (pop.dataset.visit && (k = t.closest('[data-vout]'))) {
      var vs = A.visits(), v = vs.filter(function (x) { return x.id === pop.dataset.visit; })[0]; v.outcome = k.dataset.vout; A.saveVisits(vs);
      if (v.lead) { var l = lead(v.lead); if (l) { if (v.outcome === 'Interested') l.stage = 'negotiation'; if (v.outcome === 'Not interested') l.stage = 'lost'; l.next = now() + DAY; saveLead(l, { k: 'visit', s: 'Visit outcome: ' + v.outcome }); } }
      A.toast(v.name + ': ' + v.outcome.toLowerCase() + (v.outcome === 'Interested' ? '. Suggest holding ' + (v.unit || 'a home') + ' for 48 h.' : '.')); closePop(); render(); return;
    }
    if ((k = t.closest('[data-open]'))) { closePop(); openLead(k.dataset.open); return; }
    if (!(k = t.closest('[data-act]'))) return;
    var id = pop.dataset.cell, prev = A.status(id), prevO = A.statusMeta(id), a = k.dataset.act;
    if (a === 'hold') holdUnit(id, ($('#so-pb').value || '').trim() || 'Ritika Menon', +$('#so-ph').value, 'Held from the sales office');
    else if (a === 'release') { A.setStatus(id, 'avail', { by: 'Ritika Menon', note: 'Released', keep: true }); render(); undo(id + ' is open again, on the public picker too.', function () { restore(id, prev, prevO); }); }
    else if (a === 'extend') { var m = A.statusMeta(id); A.setStatus(id, 'hold', Object.assign({}, m, { until: (m.until || now()) + DAY, keep: true })); render(); A.toast(id + ' hold extended by 24 hours.'); }
    else if (a === 'sold') { A.setStatus(id, 'sold', { by: 'Ritika Menon', note: 'Marked sold', keep: true }); render(); undo(id + ' marked sold.', function () { restore(id, prev, prevO); }); }
    closePop();
  });
  function bulkHold(anchor) {
    var ok = picked.filter(function (id) { return A.status(id) === 'avail'; }), skip = picked.length - ok.length;
    pop.innerHTML = '<h3>Hold ' + picked.length + ' homes</h3><div class="so-card" style="padding:10px;font-size:12.5px;display:grid;gap:4px"><span>What this does:</span><span><b>' + ok.length + '</b> open → on hold for 72 h</span>' + (skip ? '<span><b>' + skip + '</b> skipped (already held or sold)</span>' : '') + '<span>The public picker shows them as on hold at once.</span></div>' +
      '<label class="vh" for="so-bp">Channel partner</label><select class="so-in" id="so-bp"><option>Arora Homes Desk</option><option>Singh Property Point</option><option>Chauhan &amp; Sons Realty</option><option>Bansal Leasing</option></select><div style="display:flex;gap:6px"><button type="button" class="so-btn pri" id="so-bgo"' + (ok.length ? '' : ' disabled') + '>Apply to ' + ok.length + '</button><button type="button" class="so-btn" id="so-bx">Cancel</button></div>';
    delete pop.dataset.cell; delete pop.dataset.visit; placePop(anchor);
    $('#so-bgo').addEventListener('click', function () { var partner = $('#so-bp').value, by = 'Channel partner · ' + partner, before = ok.map(function (id) { return [id, A.status(id), A.statusMeta(id)]; }); ok.forEach(function (id) { A.setStatus(id, 'hold', { by: by, until: now() + 72 * 36e5, note: 'Block for partner clients', keep: true }); }); picked = []; closePop(); render(); undo(ok.length + ' homes on hold for ' + partner + ' for 72 h.', function () { before.forEach(function (b) { restore(b[0], b[1], b[2]); }); }); });
    $('#so-bx').addEventListener('click', closePop);
  }

  /* ---------------- menus: + New, columns, row ⋯, workspace ---------------- */
  var menu = $('#so-menu'), menuAct = {};
  function closeMenu() { menu.hidden = true; }
  function openMenu(anchor, items, alignLeft) {
    menu.innerHTML = items.map(function (it) { return it === '-' ? '<hr>' : '<button type="button" role="menuitem" data-mi="' + it[0] + '">' + it[1] + (it[2] ? '<small>' + it[2] + '</small>' : '') + '</button>'; }).join('');
    var r = anchor.getBoundingClientRect(); menu.hidden = false; menu.style.position = 'absolute'; menu.style.top = (r.bottom + 6 + scrollY) + 'px';
    menu.style.left = (alignLeft ? r.left : Math.min(innerWidth - menu.offsetWidth - 10, Math.max(10, r.right - menu.offsetWidth))) + 'px';
    var f = menu.querySelector('button,input'); f && f.focus();
  }
  $('#so-new').addEventListener('click', function (e) { e.stopPropagation(); menuAct = { enq: newEnquiry, visit: function () { location.hash = '#leads'; A.toast('Open a buyer, then “Book a site visit” on their record.'); }, hold: function () { location.hash = '#units'; } }; openMenu(this, [['enq', 'New enquiry', 'N'], ['visit', 'Book a site visit'], ['hold', 'Hold a home']]); });
  $('#so-ws').addEventListener('click', function (e) { e.stopPropagation(); var r = function (t) { return function () { ctxTower = t; A.set('so-tower', t); $('#so-ws-l').textContent = (t ? A.tower(t).name : 'All towers') + ' · Sector 109'; render(); }; }; menuAct = { all: r(''), A: r('A'), B: r('B'), C: r('C') }; openMenu(this, [['all', 'All towers'], '-', ['A', 'Tower A', '46 floors'], ['B', 'Tower B', '44 floors'], ['C', 'Tower C', '42 floors']], true); });
  menu.addEventListener('click', function (e) { var b = e.target.closest('[data-mi]'); if (!b) return; var f = menuAct[b.dataset.mi]; closeMenu(); if (f) f(); });
  menu.addEventListener('change', function (e) { var k = e.target.dataset.col; if (!k) return; cols[k] = e.target.checked ? 1 : 0; A.set('so-cols', cols); leadsView(); });
  function newEnquiry() {
    var name = prompt('Buyer’s name?'); if (!name) return; var phone = prompt('Phone number?') || '';
    var l = A.addLead({ name: name.trim(), phone: phone.trim(), city: 'Gurugram', source: 'Walk-in', remark: 'Walk-in at the sales lounge.' });
    buildQueue(); location.hash = '#leads/' + l.id; A.toast(name.trim() + ' added, at the front of the call queue.');
  }
  $('#so-k').addEventListener('click', openCmd); $('#so-k2').addEventListener('click', openCmd);
  $('#so-keys').addEventListener('click', function (e) { e.preventDefault(); A.toast('⌘K search · G then T, Q, E, V, C or U to jump · N new enquiry · 1–6 call outcomes · Esc closes.', null, 8000); });

  /* ---------------- one delegated click handler ---------------- */
  var lastPick = null;
  document.addEventListener('click', function (e) {
    var t = e.target, k;
    if (!menu.hidden && !menu.contains(t)) closeMenu();
    if (!pop.hidden && !pop.contains(t) && !t.closest('[data-cell],[data-visit],[data-bulk],[data-cellbtn]')) closePop();
    if (t.closest('#so-menu, #so-pop')) return;
    if ((k = t.closest('[data-close]'))) return closeSlide();
    if ((k = t.closest('[data-kpi]'))) { var kp = k.dataset.kpi; if (kp === 'visits') { visitDay = d0(); location.hash = '#visits'; } else if (kp === 'holds' || kp === 'units') location.hash = '#units'; else { lf = kp; if (view === 'leads') leadsView(); else location.hash = '#leads'; } return; }
    if ((k = t.closest('[data-approve]'))) { var aid = k.dataset.approve; A.approveHold(aid, 'Ritika Menon'); render(); undo(aid + ' approved for ' + A.PARTNER.name + '.', function () { var inv = A.inv(); if (inv[aid]) { inv[aid].pending = true; delete inv[aid].approvedAt; A.set('inv', inv); A.emit('inv', {}); } render(); }); return; }
    if ((k = t.closest('[data-gounit]'))) { var gid = k.dataset.gounit; A.set('so-units-t', gid[0]); if (ctxTower && ctxTower !== gid[0]) { ctxTower = ''; A.set('so-tower', ''); } history.replaceState(null, '', '#units'); view = 'units'; render(); var gc = document.querySelector('[data-cell="' + gid + '"]'); if (gc) { gc.scrollIntoView({ block: 'center' }); cellPop(gid, gc); } return; }
    if ((k = t.closest('[data-release]'))) { var id = k.dataset.release, prev = A.status(id), pO = A.statusMeta(id); A.setStatus(id, 'avail', { by: 'Ritika Menon', note: 'Released', keep: true }); render(); undo(id + ' released.', function () { restore(id, prev, pO); }); return; }
    if ((k = t.closest('[data-q]'))) { var qq = k.dataset.q; if (qq === 'skip') { qi++; qOutcome = null; focus(); counts(); } else if (qq === 'pause') { paused = true; focus(); } else if (qq === 'resume') { paused = false; focus(); } else if (qq === 'restart') { buildQueue(); focus(); counts(); } else if (qq === 'save') saveOutcome(); return; }
    if ((k = t.closest('[data-out]'))) { qOutcome = k.dataset.out; $$('.so-out button').forEach(function (b) { b.setAttribute('aria-pressed', String(b === k)); }); var nx = $('#so-next'); if (nx) { nx.hidden = false; nx.innerHTML = nextStep(queue[qi], lead(queue[qi].lead), qOutcome); } var sv = $('[data-q="save"]'); if (sv) { sv.disabled = false; sv.focus(); } return; }
    if ((k = t.closest('[data-gap]'))) return gap(k);
    if ((k = t.closest('[data-upnext]'))) { var ui = +k.dataset.upnext, uit = queue.splice(ui, 1)[0]; if (uit) queue.splice(qi, 0, uit); qOutcome = null; focus(); window.scrollTo(0, 0); return; }
    if ((k = t.closest('[data-call]'))) { var lid = k.dataset.call, at = queue.findIndex(function (x, i) { return i >= qi && x.lead === lid; }); if (at < 0) { queue.splice(qi, 0, { kind: 'call', lead: lid }); } else { var it = queue.splice(at, 1)[0]; queue.splice(qi, 0, it); } qOutcome = null; closeSlide(); if (view === 'queue') focus(); else location.hash = '#queue'; return; }
    if ((k = t.closest('[data-more]'))) { e.stopPropagation(); var ml = k.dataset.more; menuAct = { open: function () { openLead(ml); }, visit: function () { openLead(ml, 'visit'); }, lost: function () { var l = lead(ml), p = l.stage; l.stage = 'lost'; saveLead(l, { k: 'stage', s: 'Marked lost' }); render(); undo(l.name + ' marked lost.', function () { var x = lead(ml); x.stage = p; saveLead(x); render(); }); } }; openMenu(k, [['open', 'Open record'], ['visit', 'Book a site visit'], '-', ['lost', 'Mark lost']]); return; }
    if ((k = t.closest('[data-open]'))) return openLead(k.dataset.open);
    if (t.id === 'so-book') { var l = lead(cur), slot = $('#so-sl').value; if (!slot) return A.toast('No free slots in the next 7 days.'); var v = A.addVisit({ lead: l.id, name: l.name, unit: l.unit, slot: slot, mode: $('#so-md').value, party: 2, source: 'Phone' }); l.stage = 'visit'; l.next = A.slotTime(slot); saveLead(l, { k: 'visit', s: 'Visit booked for ' + A.slotLabel(slot) }); A.toast('Visit ' + v.id + ' booked for ' + A.slotLabel(slot) + '. Confirmation goes on WhatsApp.'); openLead(l.id); render(); return; }
    if (t.id === 'so-hold') { var l2 = lead(cur), u = $('#so-hu').value; if (!u) return; holdUnit(u, 'Ritika Menon for ' + l2.name, 48, 'For ' + l2.name + ' (' + l2.id + ')'); l2.unit = u; saveLead(l2, { k: 'hold', s: u + ' held for 48 hours' }); openLead(l2.id); return; }
    if ((k = t.closest('[data-stage]')) && cur) { var l3 = lead(cur), ps = l3.stage; l3.stage = k.dataset.stage; if (l3.stage === 'booked' && l3.unit) A.setStatus(l3.unit, 'sold', { by: 'Ritika Menon', note: 'Booked · ' + l3.name, keep: true }); saveLead(l3, { k: 'stage', s: 'Marked ' + A.STAGES[l3.stage].toLowerCase() }); openLead(l3.id); render(); undo(l3.name + ' marked ' + A.STAGES[l3.stage].toLowerCase() + '.', function () { var x = lead(l3.id); x.stage = ps; saveLead(x); openLead(x.id); render(); }); return; }
    if ((k = t.closest('[data-lf]'))) { lf = k.dataset.lf; selLeads = []; return leadsView(); }
    if ((k = t.closest('[data-saved]'))) { var sf = A.get('saved-filters', [])[+k.dataset.saved]; lf = sf.f; q = sf.q; return leadsView(); }
    if ((k = t.closest('[data-sort]'))) { var sk = k.dataset.sort; if (sortK === sk) sortD = -sortD; else { sortK = sk; sortD = sk === 'name' || sk === 'next' ? 1 : -1; } return leadsView(); }
    if (t.id === 'so-save') { var nm = (q ? '"' + q + '"' : '') + (lf !== 'all' ? (q ? ' · ' : '') + FILTERS.filter(function (f) { return f[0] === lf; })[0][1] : '') || 'All'; var arr = A.get('saved-filters', []); arr.push({ name: nm, f: lf, q: q }); A.set('saved-filters', arr.slice(-5)); A.toast('Saved “' + nm + '” to your views.'); return leadsView(); }
    if (t.id === 'so-cols') { e.stopPropagation(); menu.innerHTML = '<div class="so-colmenu">' + COLS.map(function (c) { return '<label><input type="checkbox" data-col="' + c[0] + '"' + (cols[c[0]] ? ' checked' : '') + '> ' + c[1] + '</label>'; }).join('') + '</div>'; var r = t.getBoundingClientRect(); menu.hidden = false; menu.style.position = 'absolute'; menu.style.left = Math.max(10, r.right - 220) + 'px'; menu.style.top = (r.bottom + 6 + scrollY) + 'px'; return; }
    if (t.id === 'so-all') { var vis = leads().filter(lmatch).map(function (l) { return l.id; }); selLeads = t.checked ? vis : []; return leadsView(); }
    if ((k = t.closest('[data-pick]'))) { var pid = k.dataset.pick, i = selLeads.indexOf(pid); if (i >= 0) selLeads.splice(i, 1); else selLeads.push(pid); return leadsView(); }
    if (t.id === 'so-bclr') { selLeads = []; return leadsView(); }
    if (t.id === 'so-bap') {
      var to = $('#so-ba').value, chg = selLeads.filter(function (id) { return lead(id).owner !== to; });
      if (t.dataset.ready !== '1') { $('#so-bpv').textContent = chg.length + ' will move to ' + A.member(to).name + (selLeads.length - chg.length ? ', ' + (selLeads.length - chg.length) + ' already theirs' : ''); t.textContent = 'Apply to ' + chg.length; t.dataset.ready = '1'; return; }
      var before = chg.map(function (id) { return [id, lead(id).owner]; }), ls = leads(); ls.forEach(function (l) { if (chg.indexOf(l.id) >= 0) { l.owner = to; l.log.push({ t: now(), k: 'assign', s: 'Assigned to ' + A.member(to).name }); } }); A.saveLeads(ls); selLeads = []; leadsView();
      undo(chg.length + ' enquiries assigned to ' + A.member(to).name + '.', function () { var l2 = leads(); before.forEach(function (b) { l2.forEach(function (l) { if (l.id === b[0]) l.owner = b[1]; }); }); A.saveLeads(l2); leadsView(); }); return;
    }
    if ((k = t.closest('tbody tr[data-lead]')) && !t.closest('input,button,a')) { history.replaceState(null, '', '#leads/' + k.dataset.lead); return openLead(k.dataset.lead); }
    if ((k = t.closest('[data-vday]'))) { var fromHeat = !!t.closest('.so-heatcard'); visitDay = +k.dataset.vday; visitsView(); if (fromHeat) window.scrollTo(0, 0); return; }
    if ((k = t.closest('[data-visit]'))) { e.stopPropagation(); return visitPop(k.dataset.visit, k); }
    if ((k = t.closest('[data-cvf]'))) { inboxF = k.dataset.cvf; return inboxView(); }
    if ((k = t.closest('[data-cv]'))) { inboxSel = k.dataset.cv; inboxOpenM = true; history.replaceState(null, '', '#inbox/' + inboxSel); return inboxView(); }
    if (t.closest('[data-cvback]')) { inboxOpenM = false; return inboxView(); }
    if ((k = t.closest('[data-cvact]'))) { var a = k.dataset.cvact, O = window.Orbit; if (a === 'take') { O.convos.setStatus(inboxSel, 'human', { person: 'Ritika (sales)' }); O.convos.append(inboxSel, { from: 'system', kind: 'system', text: 'Ritika from the sales lounge has joined the chat.' }); } else if (a === 'bot') { O.convos.setStatus(inboxSel, 'bot', { person: null }); O.convos.append(inboxSel, { from: 'system', kind: 'system', text: 'You are back with the concierge. Anything else I can help with?' }); } else if (a === 'resolve') { O.convos.setStatus(inboxSel, 'resolved'); O.convos.append(inboxSel, { from: 'system', kind: 'system', text: 'Conversation resolved by Ritika.' }); } inboxView(); counts(); var r1 = $('#so-rt'); if (r1) r1.focus(); return; }
    if ((k = t.closest('[data-tower]'))) { A.set('so-units-t', k.dataset.tower); picked = []; return unitsView(); }
    if ((k = t.closest('[data-cellbtn]'))) { var cid = k.dataset.cellbtn; if (cid[0] !== (ctxTower || A.get('so-units-t', 'A'))) { A.set('so-units-t', cid[0]); unitsView(); } var cb = document.querySelector('[data-cell="' + cid + '"]'); if (cb) { cb.scrollIntoView({ block: 'center' }); cellPop(cid, cb); } return; }
    if ((k = t.closest('[data-cell]'))) {
      var c = k.dataset.cell;
      if (e.shiftKey || e.metaKey || e.ctrlKey || picked.length) {
        if (e.shiftKey && lastPick && lastPick[0] === c[0]) { var ua = A.unit(lastPick), ub = A.unit(c); if (ua.pos === ub.pos) { for (var f = Math.min(ua.floor, ub.floor); f <= Math.max(ua.floor, ub.floor); f++) { var x = ua.tower + '-' + f + ua.pos; if (picked.indexOf(x) < 0) picked.push(x); } } else if (picked.indexOf(c) < 0) picked.push(c); }
        else { var j = picked.indexOf(c); if (j >= 0) picked.splice(j, 1); else picked.push(c); }
        lastPick = c; closePop(); return unitsView();
      }
      lastPick = c; e.stopPropagation(); return cellPop(c, k);
    }
    if ((k = t.closest('[data-bulk]'))) { var bk = k.dataset.bulk; if (bk === 'clear') { picked = []; return unitsView(); } if (bk === 'hold') { e.stopPropagation(); return bulkHold(k); } if (bk === 'release') { var rel = picked.filter(function (id) { return A.status(id) === 'hold'; }), bf = rel.map(function (id) { return [id, A.status(id), A.statusMeta(id)]; }); rel.forEach(function (id) { A.setStatus(id, 'avail', { by: 'Ritika Menon', note: 'Bulk release', keep: true }); }); picked = []; render(); undo(rel.length + ' released.', function () { bf.forEach(function (b) { restore(b[0], b[1], b[2]); }); }); } return; }
  });

  /* ---------------- keyboard ---------------- */
  var gPending = 0;
  addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (cmdk.open) cmdk.close(); else openCmd(); return; }
    if (e.key === 'Escape') { if (!menu.hidden) closeMenu(); else if (!pop.hidden) closePop(); else if (cur) closeSlide(); return; }
    if (/input|select|textarea/i.test(e.target.tagName || '') || e.metaKey || e.ctrlKey || e.altKey || cmdk.open) return;
    if (e.key === 'g') { gPending = now(); return; }
    if (now() - gPending < 900) { var map = { t: 'today', q: 'queue', e: 'leads', v: 'visits', c: 'inbox', u: 'units' }; if (map[e.key]) { location.hash = '#' + map[e.key]; gPending = 0; return; } }
    if (e.key === 'n') { newEnquiry(); return; }
    if (view === 'queue' && /^[1-6]$/.test(e.key)) { var b = $$('.so-out button')[+e.key - 1]; if (b) b.click(); }
  });

  /* ---------------- command palette ---------------- */
  var cmdk = $('#so-cmdk'), cq = $('#so-q'), cl = $('#so-l'), items = [], ci = 0;
  function cmdItems(s) {
    s = s.trim().toLowerCase(); var out = [];
    [['Today', '#today'], ['Call queue', '#queue'], ['Enquiries', '#leads'], ['Site visits', '#visits'], ['Conversations', '#inbox'], ['Units & holds', '#units']].forEach(function (a) { if (!s || ('go to ' + a[0]).toLowerCase().indexOf(s) >= 0) out.push({ label: 'Go to ' + a[0], hint: 'view', run: function () { location.hash = a[1]; } }); });
    [['Show overdue follow-ups', function () { lf = 'over'; if (view === 'leads') leadsView(); else location.hash = '#leads'; }], ['Show chat enquiries', function () { lf = 'chat'; if (view === 'leads') leadsView(); else location.hash = '#leads'; }], ['New enquiry', newEnquiry], ['Open the public unit picker', function () { open('picker.html', '_blank'); }]].forEach(function (a) { if (!s || a[0].toLowerCase().indexOf(s) >= 0) out.push({ label: a[0], hint: 'action', run: a[1] }); });
    if (s) {
      var uq = s.toUpperCase().replace(/[\s-]/g, '');
      A.UNITS.forEach(function (u) { if (out.length < 14 && u.id.replace('-', '').indexOf(uq) === 0) out.push({ label: u.id + ' · ' + A.TYPES[u.type].short + ' · ' + A.STATUS[A.status(u.id)].label, hint: 'home', run: function () { A.set('so-units-t', u.tower); if (ctxTower && ctxTower !== u.tower) { ctxTower = ''; A.set('so-tower', ''); } location.hash = '#units'; setTimeout(function () { var cb = document.querySelector('[data-cell="' + u.id + '"]'); if (cb) { cb.scrollIntoView({ block: 'center' }); cellPop(u.id, cb); } }, 80); } }); });
      leads().forEach(function (l) { if (out.length < 16 && (l.name + ' ' + l.city + ' ' + l.phone).toLowerCase().indexOf(s) >= 0) out.push({ label: l.name + ' · ' + l.city, hint: 'buyer', run: function () { location.hash = '#leads/' + l.id; } }); });
    }
    return out.slice(0, 12);
  }
  function paintCmd() { cl.innerHTML = items.map(function (it, i) { return '<li><button type="button" role="option" data-ci="' + i + '" aria-selected="' + (i === ci) + '">' + A.esc(it.label) + '<small>' + it.hint + '</small></button></li>'; }).join('') || '<li style="padding:14px;color:var(--so-mute)">No match. Try a home like A-4002 or a buyer’s name.</li>'; }
  function openCmd() { cq.value = ''; items = cmdItems(''); ci = 0; paintCmd(); cmdk.showModal(); cq.focus(); }
  function runCmd(i) { var it = items[i]; if (!it) return; cmdk.close(); it.run(); }
  cq.addEventListener('input', function () { items = cmdItems(cq.value); ci = 0; paintCmd(); });
  cq.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); ci = Math.min(items.length - 1, ci + 1); paintCmd(); } else if (e.key === 'ArrowUp') { e.preventDefault(); ci = Math.max(0, ci - 1); paintCmd(); } else if (e.key === 'Enter') { e.preventDefault(); runCmd(ci); } });
  cl.addEventListener('click', function (e) { var b = e.target.closest('[data-ci]'); if (b) runCmd(+b.dataset.ci); });
  cmdk.addEventListener('click', function (e) { if (e.target === cmdk) cmdk.close(); });

  $('#reset').addEventListener('click', function (e) { e.preventDefault(); if (!confirm('Start fresh? Enquiries, visits and holds go back to this morning.')) return; A.reset(); A.set('chats-seeded', 0); buildQueue(); picked = []; render(); A.toast('Back to this morning’s data.'); });

  /* ---------------- live: the website (another tab) adds enquiries, visits and holds ---------------- */
  A.on('leads', function (d) { if (d && d.remote) { A.toast('New enquiry from the website.'); buildQueue(); render(); } });
  A.on('inv', function (d) { if (d && d.remote) { A.toast('A home was held from the website.'); render(); } });
  A.on('visits', function (d) { if (d && d.remote) render(); });

  $('#so-ws-l').textContent = (ctxTower ? A.tower(ctxTower).name : 'All towers') + ' · Sector 109';
  buildQueue(); route();
  // the concierge engine loads quietly after the first paint, so the inbox and its count are ready
  setTimeout(function () { loadOrbit(function () { counts(); if (view === 'today') today(); }); }, 1200);
})();
