/* Lumen CRM Pro — Calendar: a week view of meetings, site visits and calls tied to deals, contacts and companies.
   Business-hours shading, a now-line, owner filter, create from a slot or from any record (C.calNew), details panel
   (mark done with outcome, reschedule, cancel with undo), drag or Shift+arrows to move, agenda list on phones.
   Everything logs to the record timeline (C.pact), the audit log and the bell. Exposes C.calNew and C.eventsFor. */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$;
  var P = function () { return C.P(); };
  var D = 864e5, H0 = 8, H1 = 21, HH = 52; // grid from 8 am to 9 pm, 52 px per hour
  var TYPES = { meeting: { label: 'Meeting', ic: 'cal' }, visit: { label: 'Site visit', ic: 'pin' }, call: { label: 'Call', ic: 'phone' } };
  var OUTCOME = {
    meeting: ['Agreed next steps', 'Needs another meeting', 'Client postponed', 'No decision yet'],
    visit: C.DFIELDS ? C.DFIELDS.visitOutcome.opts.slice() : ['Measured — client keen'],
    call: ['Connected', 'No answer', 'Call back later', 'Wrong number']
  };

  function monday(ts) { var d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.getTime(); }
  function dayStart(ts) { var d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function addDays(ts, n) { var d = new Date(ts); d.setDate(d.getDate() + n); return d.getTime(); }
  function minsOf(ts) { var d = new Date(ts); return d.getHours() * 60 + d.getMinutes(); }
  function U() { var u = C.ui.cal || (C.ui.cal = { week: monday(Date.now()), owner: 'all', showCx: false }); return u; }
  function ev(id) { return (P().events || []).filter(function (e) { return e.id === id; })[0] || null; }
  function hm(m) { return C.hm ? C.hm(m) : Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); }
  function timeRange(e) { return hm(minsOf(e.t)) + ' – ' + hm(minsOf(e.t) + e.dur); }
  function recRefs(ref) {
    if (!ref) return {};
    if (ref.t === 'deal') { var d = C.deal(ref.id); return d ? { c: d.c, co: d.co, d: d.id } : {}; }
    if (ref.t === 'contact') { var c = C.contact(ref.id); return c ? { c: c.id, co: c.co } : {}; }
    if (ref.t === 'company') return { co: ref.id };
    return {};
  }
  function recAudRef(ref) { var r = ref && C.recOf(ref.t, ref.id); return r ? C.refOf(ref.t, r) : null; }
  function recLabel(ref) {
    var r = ref && C.recOf(ref.t, ref.id); if (!r) return '';
    return ({ deal: 'Deal', contact: 'Contact', company: 'Company' }[ref.t] || '') + ' · ' + r.name + ' · ' + r.id;
  }
  function parseRec(s) {
    var m = String(s || '').match(/(D-\d+|P-\d+|CO-\d+)\s*$/); if (!m) return null;
    var id = m[1], t = id.indexOf('D-') === 0 ? 'deal' : id.indexOf('CO-') === 0 ? 'company' : 'contact';
    return C.recOf(t, id) ? { t: t, id: id } : null;
  }
  function visibleEvents() { return (P().events || []).filter(function (e) { return C.visibleOwner(e.owner); }); }
  function canEdit(e) { return C.can('edit', { owner: e.owner }); }

  // ---- seed: ~26 events this week and next, tied to real deals and contacts -----------------------------
  C.seeders.push(function (Pp) {
    if (Pp.events && Pp.evV === 2) return;
    Pp.evV = 2;
    var R = C.rng(91), W = monday(Date.now()), now = Date.now(), out = [], n = 100;
    var hrs = Pp.hours || { days: [1, 2, 3, 4, 5, 6], start: 570, end: 1170 };
    var days = []; for (var k = 0; k < 14; k++) { var ds = addDays(W, k); if (hrs.days.indexOf(new Date(ds).getDay()) > -1) days.push(ds); }
    var slots = [600, 690, 780, 870, 960, 1050], used = {};
    function place(owner, i, dur) {
      for (var g = 0; g < days.length * slots.length; g++) {
        var j = i * 7 + g, d = days[j % days.length], s = slots[Math.floor(j / days.length + i) % slots.length], key = d + ':' + s;
        if (!used[key]) { used[key] = 1; return d + s * 6e4; }
      }
      return days[i % days.length] + slots[i % slots.length] * 6e4;
    }
    function short(d) { return d.name.split(' — ').pop(); }
    var picks = [];
    Pp.deals.forEach(function (d) {
      var co = d.co ? Pp.companies.filter(function (c) { return c.id === d.co; })[0] : null, ct = Pp.contacts.filter(function (c) { return c.id === d.c; })[0];
      var city = co ? co.city : ct ? ct.city : 'Gurugram';
      if (d.pipe === 'sales' && d.stage === 'visit') picks.push({ type: 'visit', dur: 90, title: 'Site visit — ' + short(d), d: d, loc: 'On site, ' + city });
      else if (d.pipe === 'sales' && d.stage === 'design') picks.push({ type: 'meeting', dur: 60, title: 'Design review — ' + short(d), d: d, loc: 'Lumen studio, Sector 44' });
      else if (d.pipe === 'sales' && d.stage === 'proposal') picks.push({ type: 'meeting', dur: 45, title: 'Proposal walk-through — ' + short(d), d: d, loc: co ? co.name + ' office' : 'Video call' });
      else if (d.pipe === 'sales' && d.stage === 'negotiation') picks.push({ type: 'call', dur: 30, title: 'Negotiation call — ' + short(d), d: d, loc: 'Phone' });
      else if (d.pipe === 'sales' && d.stage === 'won' && R() < .4) picks.push({ type: 'visit', dur: 60, title: 'Handover check — ' + short(d), d: d, loc: 'On site, ' + city });
      else if (d.pipe === 'partner' && (d.stage === 'pilot' || d.stage === 'intro')) picks.push({ type: 'meeting', dur: 45, title: 'Partner review — ' + (co ? co.name : short(d)), d: d, loc: co ? co.name + ' office' : 'Video call' });
    });
    picks = picks.slice(0, 22);
    Pp.contacts.filter(function (c) { return c.leadId && c.life !== 'Customer'; }).slice(0, 4).forEach(function (c) { picks.push({ type: 'call', dur: 15, title: 'Follow-up call — ' + c.name, c: c, loc: 'Phone' }); });
    picks.forEach(function (p, i) {
      var owner = p.d ? p.d.owner : p.c.owner, t = place(owner, i, p.dur), status = 'scheduled';
      if (t + p.dur * 6e4 < now) status = i % 7 === 3 ? 'cancelled' : 'done';
      out.push({ id: 'EV-' + (n++), t: t, dur: p.dur, type: p.type, title: p.title, ref: p.d ? { t: 'deal', id: p.d.id } : { t: 'contact', id: p.c.id }, owner: owner, loc: p.loc,
        notes: p.type === 'visit' ? 'Carry the laser measure and the Halden Supply swatch kit.' : p.type === 'meeting' ? 'Bring printed moodboard and the revised quote.' : '', status: status,
        outcome: status === 'done' ? OUTCOME[p.type][0] : '', created: t - (3 + i % 5) * D, by: owner });
    });
    out.sort(function (a, b) { return a.t - b.t; });
    Pp.events = out;
  });

  // ---- public API for record pages ------------------------------------------------------------------
  C.eventsFor = function (t, id) {
    var now = Date.now() - 36e5;
    return (P().events || []).filter(function (e) { return e.ref && e.ref.t === t && e.ref.id === id && e.status === 'scheduled' && e.t >= now; }).sort(function (a, b) { return a.t - b.t; });
  };
  function nextSlot() {
    var H = P().hours || { days: [1, 2, 3, 4, 5, 6], start: 570, end: 1170 }, t = Date.now() + 60 * 6e4, d = new Date(t);
    d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0); t = d.getTime();
    for (var g = 0; g < 14; g++) {
      var ds = dayStart(t), m = minsOf(t), dow = new Date(ds).getDay();
      if (H.days.indexOf(dow) > -1 && m >= H.start && m + 60 <= H.end) return t;
      t = addDays(ds, m >= H.start ? 1 : 0) + Math.max(H.start, 600) * 6e4;
    }
    return t;
  }
  function ownerOpts(cur) {
    var me = C.me().name, list = C.perm('scope') === 'own' ? [me] : P().users.map(function (u) { return u.name; }).filter(C.visibleOwner);
    if (list.indexOf(cur) < 0) cur = me;
    return list.map(function (n) { return '<option' + (n === cur ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('');
  }
  function recDatalist() {
    var p = P(), o = [];
    p.deals.filter(C.visible).forEach(function (d) { o.push(recLabel({ t: 'deal', id: d.id })); });
    p.contacts.filter(C.visible).forEach(function (c) { o.push(recLabel({ t: 'contact', id: c.id })); });
    p.companies.filter(C.visible).forEach(function (c) { o.push(recLabel({ t: 'company', id: c.id })); });
    return '<datalist id="cal-recs">' + o.map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>';
  }
  function iso(ts) { var d = new Date(ts), z = function (x) { return String(x).padStart(2, '0'); }; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }
  function hhmm(ts) { var d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function readTime(fd) { var d = fd.get('date'), tm = fd.get('time'); if (!d || !tm) return null; var t = new Date(d + 'T' + tm).getTime(); return isNaN(t) ? null : t; }

  // C.calNew({ ref, type, title, t, owner }) — opens the create dialog, prefilled
  C.calNew = function (o) {
    o = o || {};
    var ref = o.ref || null, rec = ref && C.recOf(ref.t, ref.id), type = o.type || (ref && ref.t === 'deal' && rec && rec.stage === 'visit' ? 'visit' : 'meeting');
    var t = o.t || nextSlot(), owner = o.owner || (rec && C.visibleOwner(rec.owner) ? rec.owner : C.me().name);
    var title = o.title || (rec ? TYPES[type].label + ' — ' + (ref.t === 'deal' ? rec.name.split(' — ').pop() : rec.name) : '');
    var loc = o.loc || (type === 'visit' ? 'On site' : type === 'call' ? 'Phone' : 'Lumen studio, Sector 44');
    C.dialog('Schedule', '<div class="row2"><div class="field"><label for="ce-ty">Type</label><select id="ce-ty" name="type">' + Object.keys(TYPES).map(function (k) { return '<option value="' + k + '"' + (k === type ? ' selected' : '') + '>' + TYPES[k].label + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="ce-ow">Owner</label><select id="ce-ow" name="owner">' + ownerOpts(owner) + '</select></div></div>' +
      '<div class="field"><label for="ce-ti">Title</label><input id="ce-ti" name="title" required maxlength="90" autocomplete="off" value="' + esc(title) + '" placeholder="e.g. Site visit — rooftop seating"></div>' +
      '<div class="field"><label for="ce-re">Related record</label><input id="ce-re" name="rec" list="cal-recs" autocomplete="off" value="' + esc(ref ? recLabel(ref) : '') + '" placeholder="Search a deal, contact or company…">' + recDatalist() + '<small class="hint">Start typing a name or an ID like D-2044. The event and its outcome will appear on that record’s timeline.</small></div>' +
      '<div class="row3 cal-row3"><div class="field"><label for="ce-da">Date</label><input id="ce-da" name="date" type="date" required value="' + iso(t) + '"></div><div class="field"><label for="ce-tm">Start</label><input id="ce-tm" name="time" type="time" step="900" required value="' + hhmm(t) + '"></div>' +
      '<div class="field"><label for="ce-du">Duration</label><select id="ce-du" name="dur">' + [15, 30, 45, 60, 90, 120].map(function (m) { return '<option value="' + m + '"' + (m === (o.dur || (type === 'call' ? 30 : type === 'visit' ? 90 : 60)) ? ' selected' : '') + '>' + (m < 60 ? m + ' min' : m / 60 + ' h') + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="field"><label for="ce-lo">Location</label><input id="ce-lo" name="loc" autocomplete="off" value="' + esc(loc) + '"></div>' +
      '<div class="field"><label for="ce-no">Notes</label><textarea id="ce-no" name="notes" rows="2" placeholder="What to bring, who will be there"></textarea></div>' +
      '<p class="hint cal-bh-hint" id="ce-warn" role="status"></p>', 'Schedule', function (fd) {
        var title2 = String(fd.get('title') || '').trim(), t2 = readTime(fd), r2 = parseRec(fd.get('rec'));
        if (!title2 || !t2) return false;
        if (String(fd.get('rec') || '').trim() && !r2) { var w = $('#ce-warn'); if (w) w.textContent = 'Pick a record from the list, or leave it empty.'; return false; }
        create({ type: fd.get('type'), title: title2, t: t2, dur: +fd.get('dur') || 60, owner: fd.get('owner') || C.me().name, loc: String(fd.get('loc') || '').trim(), notes: String(fd.get('notes') || '').trim(), ref: r2 });
      });
    warnHours();
  };
  function warnHours() {
    var w = $('#ce-warn'), d = $('#ce-da'), tm = $('#ce-tm'); if (!w || !d || !tm) return;
    var t = new Date(d.value + 'T' + tm.value).getTime(); if (isNaN(t)) { w.textContent = ''; return; }
    w.textContent = C.inHours && !C.inHours(t) ? 'Heads up: this is outside business hours (' + hoursText() + ').' : '';
  }
  document.addEventListener('change', function (e) { if (e.target && (e.target.id === 'ce-da' || e.target.id === 'ce-tm')) warnHours(); });
  function hoursText() { var H = P().hours; if (!H || !H.on) return 'not set'; var nm = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; return nm[H.days[0]] + '–' + nm[H.days[H.days.length - 1]] + ' ' + hm(H.start) + '–' + hm(H.end); }

  function create(o) {
    var p = P(); p.events = p.events || [];
    var n = p.events.reduce(function (m, e) { return Math.max(m, parseInt(String(e.id).replace(/\D/g, ''), 10) || 0); }, 100) + 1;
    var e = { id: 'EV-' + n, t: o.t, dur: o.dur, type: o.type, title: o.title, ref: o.ref, owner: o.owner, loc: o.loc, notes: o.notes, status: 'scheduled', outcome: '', created: Date.now(), by: C.me().name };
    p.events.push(e); p.events.sort(function (a, b) { return a.t - b.t; });
    var me = C.me().name;
    if (o.ref) C.pact(o.type, 'Scheduled: ' + o.title + ' · ' + C.dt(o.t) + (o.loc ? ' · ' + o.loc : '') + (o.owner !== me ? ' · with ' + o.owner.split(' ')[0] : ''), recRefs(o.ref), me);
    C.audit('create', recAudRef(o.ref) || { t: 'calendar', id: e.id, name: e.title }, 'Calendar event', '', e.title + ' · ' + C.dt(e.t));
    if (o.owner !== me) C.notify(me.split(' ')[0] + ' scheduled “' + o.title + '” for ' + o.owner.split(' ')[0] + ' · ' + C.dt(o.t), '#/calendar/' + e.id, 'cal');
    C.save(); C.badges();
    C.toast('Scheduled · ' + C.dt(o.t), { icon: 'cal', undo: function () { p.events = p.events.filter(function (x) { return x.id !== e.id; }); C.audit('delete', recAudRef(o.ref) || { t: 'calendar', id: e.id, name: e.title }, 'Calendar event', e.title, ''); C.save(); C.badges(); C.rerender(); } });
    U().week = monday(o.t);
    if (C.cur && C.cur.name === 'calendar') { if (C.cur.arg === e.id) C.rerender(); else location.hash = '#/calendar/' + e.id; } else C.rerender();
    return e;
  }

  // ---- layout helpers ---------------------------------------------------------------------------------
  function lanes(list) {
    var sorted = list.slice().sort(function (a, b) { return a.t - b.t || b.dur - a.dur; }), out = [], cluster = [], ends = [], cEnd = 0;
    function flush() { var w = ends.length || 1; cluster.forEach(function (x) { x.w = w; }); cluster = []; ends = []; }
    sorted.forEach(function (e) {
      var s = e.t, f = e.t + e.dur * 6e4;
      if (cluster.length && s >= cEnd) flush();
      var lane = -1; for (var i = 0; i < ends.length; i++) if (ends[i] <= s) { lane = i; break; }
      if (lane < 0) { lane = ends.length; ends.push(f); } else ends[lane] = f;
      cEnd = Math.max(cEnd, f); var o = { e: e, lane: lane }; cluster.push(o); out.push(o);
    });
    flush(); return out;
  }
  function weekEvents(w) { var u = U(); return visibleEvents().filter(function (e) { return e.t >= w && e.t < addDays(w, 7) && (u.owner === 'all' || e.owner === u.owner) && (u.showCx || e.status !== 'cancelled'); }); }
  function isMobile() { return window.innerWidth <= 700; }
  function evBtn(o, w) {
    var e = o.e, top = (minsOf(e.t) - H0 * 60) / 60 * HH, h = Math.max(20, e.dur / 60 * HH - 2), r = e.ref && C.recOf(e.ref.t, e.ref.id), sel = C.cur && C.cur.arg === e.id;
    var left = o.lane / o.w * 100, width = 100 / o.w;
    return '<button type="button" class="cal-ev t-' + e.type + ' s-' + e.status + (sel ? ' sel' : '') + (h < 34 ? ' tiny' : '') + '" data-ev="' + e.id + '" style="top:' + top.toFixed(1) + 'px;height:' + h.toFixed(1) + 'px;left:calc(' + left + '% + 2px);width:calc(' + width + '% - 4px)" aria-label="' + esc(TYPES[e.type].label + ': ' + e.title + ', ' + C.dt(e.t) + ', ' + e.dur + ' minutes, ' + e.owner + (e.status !== 'scheduled' ? ', ' + e.status : '') + '. Enter opens details. Shift plus arrow keys move it.') + '">' +
      '<span class="cal-ev-t">' + hm(minsOf(e.t)) + (e.status === 'done' ? ' · done' : '') + '</span><b>' + esc(e.title) + '</b>' + (h >= 50 && r ? '<span class="cal-ev-r">' + esc(e.ref.t === 'deal' ? (r.name.split(' — ')[0]) : r.name) + '</span>' : '') + '<span class="cal-ev-o" aria-hidden="true">' + C.avatar(e.owner, 16) + '</span></button>';
  }
  function grid(w) {
    var H = P().hours || { on: false }, today = dayStart(Date.now()), E = weekEvents(w), head = '<div class="cal-hc" aria-hidden="true"></div>', cols = '';
    var names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (var i = 0; i < 7; i++) {
      var ds = addDays(w, i), d = new Date(ds), isT = ds === today, dow = d.getDay(), open = H.on && H.days.indexOf(dow) > -1;
      var dayE = E.filter(function (e) { return dayStart(e.t) === ds; }), cnt = dayE.filter(function (e) { return e.status === 'scheduled'; }).length;
      head += '<div class="cal-hd' + (isT ? ' today' : '') + (!open ? ' closed' : '') + '"><span>' + names[i] + '</span><b>' + d.getDate() + '</b>' + (cnt ? '<i title="' + cnt + ' scheduled">' + cnt + '</i>' : '') + '</div>';
      var bh = open ? '<div class="cal-bh" style="top:' + ((Math.max(H.start, H0 * 60) - H0 * 60) / 60 * HH) + 'px;height:' + ((Math.min(H.end, H1 * 60) - Math.max(H.start, H0 * 60)) / 60 * HH) + 'px" aria-hidden="true"></div>' : '';
      var nowL = isT ? (function () { var m = minsOf(Date.now()); return m >= H0 * 60 && m <= H1 * 60 ? '<div class="cal-now" style="top:' + ((m - H0 * 60) / 60 * HH) + 'px" aria-hidden="true"></div>' : ''; })() : '';
      cols += '<div class="cal-day' + (isT ? ' today' : '') + '" data-day="' + ds + '" role="group" aria-label="' + esc(d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })) + ', ' + dayE.length + ' events">' + bh + nowL + lanes(dayE).map(function (o) { return evBtn(o, w); }).join('') + '</div>';
    }
    var hrs = ''; for (var h = H0; h < H1; h++) hrs += '<div class="cal-hr" style="top:' + ((h - H0) * HH) + 'px"><span>' + hm(h * 60).replace(':00', '') + '</span></div>';
    return '<div class="cal-grid" role="region" aria-label="Week grid"><div class="cal-head">' + head + '</div><div class="cal-scroll" id="cal-scroll"><div class="cal-body" style="height:' + ((H1 - H0) * HH) + 'px"><div class="cal-gut">' + hrs + '</div>' + cols + '</div></div></div>';
  }
  function agenda(w) {
    var E = weekEvents(w), today = dayStart(Date.now()), html = '';
    for (var i = 0; i < 7; i++) {
      var ds = addDays(w, i), dayE = E.filter(function (e) { return dayStart(e.t) === ds; }).sort(function (a, b) { return a.t - b.t; });
      html += '<section class="cal-ag-d' + (ds === today ? ' today' : '') + '"><h2>' + new Date(ds).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }) + (ds === today ? ' <span class="pill">Today</span>' : '') + '</h2>' +
        (dayE.length ? '<ul>' + dayE.map(function (e) {
          var r = e.ref && C.recOf(e.ref.t, e.ref.id);
          return '<li><button type="button" class="cal-ag-i t-' + e.type + ' s-' + e.status + '" data-ev="' + e.id + '"><span class="cal-ag-t">' + hm(minsOf(e.t)) + '<small>' + (e.dur < 60 ? e.dur + ' min' : e.dur / 60 + ' h') + '</small></span><span class="cal-ag-b"><b>' + esc(e.title) + '</b><small>' + TYPES[e.type].label + (r ? ' · ' + esc(r.name.split(' — ')[0]) : '') + ' · ' + esc(e.owner.split(' ')[0]) + (e.status !== 'scheduled' ? ' · ' + e.status : '') + '</small></span></button></li>';
        }).join('') + '</ul>' : '<p class="cal-ag-e">Nothing scheduled.</p>') + '</section>';
    }
    return '<div class="cal-ag">' + html + '</div>';
  }
  function side() {
    var e = C.cur && C.cur.arg && ev(C.cur.arg);
    if (e && C.visibleOwner(e.owner)) return detail(e);
    var now = Date.now(), up = visibleEvents().filter(function (x) { return x.status === 'scheduled' && x.t + x.dur * 6e4 >= now && (U().owner === 'all' || x.owner === U().owner); }).sort(function (a, b) { return a.t - b.t; });
    var w = U().week, wk = weekEvents(w).filter(function (x) { return x.status !== 'cancelled'; }), cnt = function (t) { return wk.filter(function (x) { return x.type === t; }).length; };
    return '<aside class="cal-side card" aria-label="This week"><h2 class="rbox-h">This week</h2><dl class="cal-sum"><div><dt>Site visits</dt><dd>' + cnt('visit') + '</dd></div><div><dt>Meetings</dt><dd>' + cnt('meeting') + '</dd></div><div><dt>Calls</dt><dd>' + cnt('call') + '</dd></div></dl>' +
      '<h2 class="rbox-h">Up next</h2>' + (up.length ? '<ul class="cal-up">' + up.slice(0, 6).map(function (x) { return '<li><button type="button" data-ev="' + x.id + '" class="t-' + x.type + '"><i aria-hidden="true"></i><span><b>' + esc(x.title) + '</b><small>' + C.dt(x.t) + ' · ' + esc(x.owner.split(' ')[0]) + '</small></span></button></li>'; }).join('') + '</ul>' : '<p class="empty sm">Nothing coming up. Schedule a site visit from any deal, or click an empty slot.</p>') +
      '<p class="hint cal-tip">' + C.ic('cal', 12) + ' Click an empty slot to schedule. Open a deal and use “Schedule” to book a visit that logs to its timeline. Grey columns are outside business hours (' + esc(hoursText()) + ').</p></aside>';
  }
  function detail(e) {
    var r = e.ref && C.recOf(e.ref.t, e.ref.id), st = r && e.ref.t === 'deal' && C.pstage(r.pipe, r.stage), ed = canEdit(e);
    var acts = e.status === 'scheduled' ? '<button type="button" class="btn sm pri" data-act="cal-done"' + (ed ? '' : ' aria-disabled="true"') + '>' + C.ic('check', 13) + 'Mark done</button><button type="button" class="btn sm" data-act="cal-move">' + C.ic('clock', 13) + 'Reschedule</button><button type="button" class="btn sm ghost" data-act="cal-cancel">' + C.ic('x', 13) + 'Cancel</button>'
      : e.status === 'cancelled' ? '<button type="button" class="btn sm" data-act="cal-restore">' + C.ic('refresh', 13) + 'Restore</button>' : '<button type="button" class="btn sm" data-act="cal-follow">' + C.ic('plus', 13) + 'Schedule follow-up</button>';
    return '<aside class="cal-side card cal-det t-' + e.type + '" aria-labelledby="cal-dt"><div class="cal-det-h"><span class="cal-type"><i aria-hidden="true"></i>' + TYPES[e.type].label + '</span><button type="button" class="ibtn" data-act="cal-close" aria-label="Close details">' + C.ic('x', 15) + '</button></div>' +
      '<h2 id="cal-dt">' + esc(e.title) + '</h2><p class="cal-when">' + new Date(e.t).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) + '<br>' + timeRange(e) + ' · ' + (e.dur < 60 ? e.dur + ' min' : e.dur / 60 + ' h') + '</p>' +
      (e.status !== 'scheduled' ? '<p class="cal-st s-' + e.status + '">' + (e.status === 'done' ? C.ic('check', 13) + 'Done' + (e.outcome ? ' · ' + esc(e.outcome) : '') : C.ic('x', 13) + 'Cancelled') + '</p>' : '') +
      '<dl class="dlist"><dt>Owner</dt><dd><span class="own">' + C.avatar(e.owner, 18) + esc(e.owner) + '</span></dd><dt>Location</dt><dd>' + esc(e.loc || '—') + '</dd>' +
      (r ? '<dt>Related</dt><dd><a href="' + C.refHref(e.ref) + '">' + esc(r.name) + '</a>' + (st ? ' <span class="pill"><i style="background:' + st.color + '"></i>' + esc(st.label) + '</span>' : '') + '</dd>' : '<dt>Related</dt><dd class="muted">No record</dd>') +
      (e.notes ? '<dt>Notes</dt><dd>' + esc(e.notes) + '</dd>' : '') + '<dt>Created</dt><dd class="muted">' + esc((e.by || e.owner).split(' ')[0]) + ' · ' + C.dshort(e.created || e.t) + '</dd></dl>' +
      '<div class="cal-det-a">' + acts + (r ? '<a class="btn sm ghost" href="' + C.refHref(e.ref) + '">' + C.ic('ext', 13) + 'Open record</a>' : '') + '</div>' + (ed ? '' : '<p class="hint">' + C.ic('lock', 12) + ' Owned by ' + esc(e.owner.split(' ')[0]) + '. Your role can view it but not change it.</p>') + '</aside>';
  }

  C.views.calendar = {
    title: function () { var e = C.cur && C.cur.arg && ev(C.cur.arg); return e ? e.title : 'Calendar'; },
    render: function () {
      var u = U(), e = C.cur.arg && ev(C.cur.arg);
      if (e && C.visibleOwner(e.owner) && u._opened !== C.cur.arg) { u.week = monday(e.t); }
      u._opened = C.cur.arg || '';
      var w = u.week, end = addDays(w, 6), E = weekEvents(w);
      var range = new Date(w).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' – ' + new Date(end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      var owners = C.perm('scope') === 'own' ? [C.me().name] : P().users.map(function (x) { return x.name; }).filter(C.visibleOwner);
      var acts = '<div class="cal-nav" role="group" aria-label="Week"><button type="button" class="ibtn" data-act="cal-wk" data-d="-1" aria-label="Previous week">' + C.ic('chev-l', 16) + '</button><button type="button" class="btn sm" data-act="cal-wk" data-d="0">Today</button><button type="button" class="ibtn" data-act="cal-wk" data-d="1" aria-label="Next week">' + C.ic('chev-r', 16) + '</button></div>' +
        '<label class="sr" for="cal-ow">Show calendar of</label><select id="cal-ow" class="sel" data-ch="cal-owner"><option value="all">' + (owners.length > 1 ? 'Everyone' : 'My calendar') + '</option>' + owners.map(function (n) { return '<option value="' + esc(n) + '"' + (u.owner === n ? ' selected' : '') + '>' + esc(n === C.me().name ? n + ' (me)' : n) + '</option>'; }).join('') + '</select>' +
        '<button type="button" class="btn pri" data-act="cal-new">' + C.ic('plus', 14) + 'New event <kbd>N</kbd></button>';
      var visits = E.filter(function (x) { return x.type === 'visit' && x.status !== 'cancelled'; }).length;
      var body = !E.length && !visibleEvents().length ? '<div class="empty-st">' + C.ic('cal', 22) + '<b>No events yet</b><span>Site visits, meetings and calls you schedule from deals and contacts land here, with outcomes logged to each record.</span><button type="button" class="btn pri" data-act="cal-new">Schedule the first one</button></div>'
        : (isMobile() ? agenda(w) : grid(w));
      return C.page('Calendar', range + ' · ' + E.filter(function (x) { return x.status !== 'cancelled'; }).length + ' events · ' + visits + ' site visit' + (visits === 1 ? '' : 's'), acts) +
        '<div class="cal-bar"><ul class="cal-leg" aria-label="Legend">' + Object.keys(TYPES).map(function (k) { return '<li class="t-' + k + '"><i aria-hidden="true"></i>' + TYPES[k].label + '</li>'; }).join('') + '<li class="bh"><i aria-hidden="true"></i>Outside business hours</li></ul><label class="chk"><input type="checkbox" data-ch="cal-cx"' + (u.showCx ? ' checked' : '') + '> Show cancelled</label></div>' +
        '<div class="cal-wrap' + (isMobile() ? ' mob' : '') + '"><div class="cal-main">' + body + '</div>' + side() + '</div><p class="sr" id="cal-live" role="status" aria-live="polite"></p>';
    },
    mount: function () {
      var sc = $('#cal-scroll'); if (sc && !C.noFx) { var tgt = $('.cal-ev.sel') ? parseFloat($('.cal-ev.sel').style.top) - 80 : ((P().hours && P().hours.on ? P().hours.start : 570) - H0 * 60) / 60 * HH - 20; sc.scrollTop = Math.max(0, tgt); }
      if (C.motion() && !C.noFx) gsap.from('.cal-ev', { opacity: 0, y: 6, duration: .35, stagger: .015, ease: 'power2.out', clearProps: 'opacity,transform' });
    }
  };

  // ---- actions ----------------------------------------------------------------------------------------
  function cur() { return C.cur && C.cur.arg && ev(C.cur.arg); }
  function keepScroll(fn) { var sc = $('#cal-scroll'), y = sc ? sc.scrollTop : 0; fn(); var s2 = $('#cal-scroll'); if (s2) s2.scrollTop = y; }
  C.acts['cal-wk'] = function (el) { var u = U(), d = +el.dataset.d; u.week = d ? addDays(u.week, 7 * d) : monday(Date.now()); C.rerender(true); var b = $('[data-act="cal-wk"][data-d="' + d + '"]'); if (b) b.focus(); };
  C.chs['cal-owner'] = function (el) { U().owner = el.value; C.rerender(); var s = $('#cal-ow'); if (s) s.focus(); };
  C.chs['cal-cx'] = function (el) { U().showCx = el.checked; keepScroll(C.rerender); };
  C.acts['cal-new'] = function () { C.calNew({}); };
  C.acts['cal-close'] = function () { location.hash = '#/calendar'; };
  C.acts['cal-follow'] = function () { var e = cur(); if (e) C.calNew({ ref: e.ref, type: e.type === 'visit' ? 'meeting' : e.type, owner: e.owner, title: 'Follow-up — ' + e.title.replace(/^[^—]+— /, '') }); };
  C.acts['cal-done'] = function () {
    var e = cur(); if (!e || !C.guard('edit', 'complete someone else’s event', { owner: e.owner })) return;
    C.dialog('Mark as done', '<p class="hint">' + esc(e.title) + ' · ' + C.dt(e.t) + '</p><div class="field"><label for="cd-o">Outcome</label><select id="cd-o" name="o">' + OUTCOME[e.type].map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select></div><div class="field"><label for="cd-n">Notes for the timeline</label><textarea id="cd-n" name="n" rows="3" placeholder="What was decided, who was there"></textarea></div>' +
      (e.type === 'visit' && e.ref && e.ref.t === 'deal' ? '<p class="hint">' + C.ic('unlock', 12) + ' The outcome is also saved as the deal’s “Site-visit outcome”, which unlocks its Proposal stage.</p>' : '') +
      '<label class="chk"><input type="checkbox" name="fu"' + (e.type !== 'call' ? ' checked' : '') + '> Create a follow-up task for tomorrow</label>', 'Save outcome', function (fd) {
        var oc = fd.get('o'), note = String(fd.get('n') || '').trim();
        e.status = 'done'; e.outcome = oc; e.doneAt = Date.now();
        var label = { visit: 'Site visit', meeting: 'Meeting', call: 'Call' }[e.type];
        if (e.ref) {
          C.pact(e.type, label + ' done: ' + oc + (note ? ' — ' + note : '') + ' (' + e.title + ')', recRefs(e.ref), e.owner);
          if (e.type === 'visit' && e.ref.t === 'deal') { var d = C.deal(e.ref.id); if (d) { var from = (d.fields || {}).visitOutcome || ''; d.fields = d.fields || {}; d.fields.visitOutcome = oc; C.audit('update', C.refOf('deal', d), 'Site-visit outcome', from, oc); } }
          if (fd.get('fu') && C.addRefTask) { var t = new Date(); t.setDate(t.getDate() + 1); t.setHours(11, 0, 0, 0); C.addRefTask(e.ref, 'Follow up after ' + label.toLowerCase() + ': ' + e.title.replace(/^[^—]+— /, ''), t.getTime(), 15, e.owner); }
        }
        C.audit('status', recAudRef(e.ref) || { t: 'calendar', id: e.id, name: e.title }, 'Calendar event', 'Scheduled', 'Done · ' + oc);
        C.save(); C.badges(); keepScroll(C.rerender); C.toast(label + ' logged to the timeline', { icon: 'check' });
      });
  };
  function reschedule(e, t, why) {
    var old = e.t; e.t = t; P().events.sort(function (a, b) { return a.t - b.t; });
    if (e.ref) C.pact(e.type, 'Rescheduled ' + e.title + ': ' + C.dt(old) + ' → ' + C.dt(t), recRefs(e.ref), C.me().name);
    C.audit('update', recAudRef(e.ref) || { t: 'calendar', id: e.id, name: e.title }, 'Event time', C.dt(old), C.dt(t));
    if (e.owner !== C.me().name) C.notify(C.me().name.split(' ')[0] + ' moved “' + e.title + '” to ' + C.dt(t), '#/calendar/' + e.id, 'cal');
    C.save(); C.badges(); U().week = monday(t);
    keepScroll(C.rerender);
    var live = $('#cal-live'); if (live) live.textContent = e.title + ' moved to ' + C.dt(t);
    C.toast((why || 'Moved') + ' to ' + C.dt(t), { icon: 'clock', undo: function () { e.t = old; P().events.sort(function (a, b) { return a.t - b.t; }); C.audit('update', recAudRef(e.ref) || { t: 'calendar', id: e.id, name: e.title }, 'Event time', C.dt(t), C.dt(old)); C.save(); C.badges(); U().week = monday(old); keepScroll(C.rerender); } });
  }
  C.acts['cal-move'] = function () {
    var e = cur(); if (!e || !C.guard('edit', 'reschedule someone else’s event', { owner: e.owner })) return;
    C.dialog('Reschedule', '<p class="hint">' + esc(e.title) + '</p><div class="row2"><div class="field"><label for="ce-da">Date</label><input id="ce-da" name="date" type="date" required value="' + iso(e.t) + '"></div><div class="field"><label for="ce-tm">Start</label><input id="ce-tm" name="time" type="time" step="900" required value="' + hhmm(e.t) + '"></div></div><p class="hint" id="ce-warn" role="status"></p>', 'Reschedule', function (fd) {
      var t = readTime(fd); if (!t) return false; if (t !== e.t) reschedule(e, t, 'Rescheduled');
    });
    warnHours();
  };
  C.acts['cal-cancel'] = function () {
    var e = cur(); if (!e || !C.guard('edit', 'cancel someone else’s event', { owner: e.owner })) return;
    e.status = 'cancelled';
    if (e.ref) C.pact(e.type, 'Cancelled: ' + e.title + ' (' + C.dt(e.t) + ')', recRefs(e.ref), C.me().name);
    C.audit('status', recAudRef(e.ref) || { t: 'calendar', id: e.id, name: e.title }, 'Calendar event', 'Scheduled', 'Cancelled');
    C.save(); C.badges(); location.hash = '#/calendar';
    C.toast('Event cancelled', { icon: 'x', undo: function () { e.status = 'scheduled'; C.audit('status', recAudRef(e.ref) || { t: 'calendar', id: e.id, name: e.title }, 'Calendar event', 'Cancelled', 'Scheduled'); C.save(); C.badges(); location.hash = '#/calendar/' + e.id; } });
  };
  C.acts['cal-restore'] = function () { var e = cur(); if (!e || !C.guard('edit', 'restore someone else’s event', { owner: e.owner })) return; e.status = 'scheduled'; C.audit('status', recAudRef(e.ref) || { t: 'calendar', id: e.id, name: e.title }, 'Calendar event', 'Cancelled', 'Scheduled'); C.save(); C.badges(); C.rerender(); C.toast('Event restored', { icon: 'refresh' }); };

  // open an event (click or Enter); ignore the click that ends a drag
  document.addEventListener('click', function (e) {
    if (!C.cur || C.cur.name !== 'calendar') return;
    var b = e.target.closest && e.target.closest('[data-ev]');
    if (b) { if (Date.now() - drop < 250) return; C._opener = b; location.hash = '#/calendar/' + b.dataset.ev; return; }
    var day = e.target.closest && e.target.closest('.cal-day');
    if (day && (e.target === day || e.target.classList.contains('cal-bh') || e.target.classList.contains('cal-now'))) {
      var r = day.getBoundingClientRect(), m = H0 * 60 + Math.floor((e.clientY - r.top) / HH * 60 / 30) * 30;
      C.calNew({ t: +day.dataset.day + Math.max(H0 * 60, Math.min(H1 * 60 - 30, m)) * 6e4 });
    }
  });
  // keyboard: N new event, Esc closes details, Shift+arrows move the focused event (15 min / 1 day)
  document.addEventListener('keydown', function (e) {
    if (!C.cur || C.cur.name !== 'calendar' || document.querySelector('dialog[open]')) return;
    var t = e.target, typing = t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
    if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && (e.key === 'n' || e.key === 'N') && !e.shiftKey) { e.preventDefault(); C.calNew({}); return; }
    if (e.key === 'Escape' && C.cur.arg && !document.querySelector('#bell-pop:not([hidden])')) { location.hash = '#/calendar'; return; }
    var b = t.closest && t.closest('.cal-ev[data-ev]');
    if (b && e.shiftKey && /^Arrow/.test(e.key)) {
      var x = ev(b.dataset.ev); if (!x) return; e.preventDefault();
      if (!C.guard('edit', 'move someone else’s event', { owner: x.owner })) return;
      var nt = x.t + ({ ArrowUp: -15 * 6e4, ArrowDown: 15 * 6e4, ArrowLeft: -D, ArrowRight: D }[e.key] || 0);
      var m = minsOf(nt); if (m < H0 * 60 || m + x.dur > H1 * 60) return;
      reschedule(x, nt, 'Moved'); var again = $('.cal-ev[data-ev="' + x.id + '"]'); if (again) again.focus({ preventScroll: false });
    }
  });
  // drag an event to another slot (mouse/pen; touch uses Reschedule so the grid can scroll)
  var drag = null, drop = 0;
  document.addEventListener('pointerdown', function (e) {
    if (!C.cur || C.cur.name !== 'calendar' || e.button !== 0 || e.pointerType === 'touch') return;
    var b = e.target.closest('.cal-ev[data-ev]'); if (!b) return; var x = ev(b.dataset.ev); if (!x || x.status !== 'scheduled' || !canEdit(x)) return;
    drag = { el: b, e: x, sx: e.clientX, sy: e.clientY, on: false, oy: e.clientY - b.getBoundingClientRect().top };
  });
  document.addEventListener('pointermove', function (e) {
    if (!drag) return;
    if (!drag.on) { if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return; drag.on = true; drag.el.classList.add('dragging'); document.body.classList.add('dragging'); }
    var col = null; $$('.cal-day').forEach(function (c) { var r = c.getBoundingClientRect(); var on = e.clientX >= r.left && e.clientX < r.right; c.classList.toggle('over', on); if (on) col = c; });
    if (!col) return;
    var r = col.getBoundingClientRect(), m = H0 * 60 + Math.round((e.clientY - drag.oy - r.top) / HH * 60 / 15) * 15;
    m = Math.max(H0 * 60, Math.min(H1 * 60 - drag.e.dur, m));
    drag.t = +col.dataset.day + m * 6e4;
    var orig = drag.el.parentNode.getBoundingClientRect();
    drag.el.style.transform = 'translate(' + (r.left - orig.left) + 'px,' + ((m - minsOf(drag.e.t)) / 60 * HH) + 'px)';
    drag.el.querySelector('.cal-ev-t').textContent = hm(m);
  });
  document.addEventListener('pointerup', function () {
    if (!drag) return; var d = drag; drag = null; document.body.classList.remove('dragging'); $$('.cal-day.over').forEach(function (c) { c.classList.remove('over'); });
    if (!d.on) return; drop = Date.now(); d.el.classList.remove('dragging');
    if (d.t && d.t !== d.e.t) reschedule(d.e, d.t, 'Moved'); else { d.el.style.transform = ''; d.el.querySelector('.cal-ev-t').textContent = hm(minsOf(d.e.t)); }
  });
  document.addEventListener('pointercancel', function () { if (drag) { drag.el.style.transform = ''; drag.el.classList.remove('dragging'); document.body.classList.remove('dragging'); drag = null; } });
  // switch between grid and agenda when crossing the phone breakpoint
  var wasMob = null;
  window.addEventListener('resize', function () { var m = isMobile(); if (wasMob !== null && m !== wasMob && C.cur && C.cur.name === 'calendar') C.rerender(); wasMob = m; });
  // keep the now-line moving
  setInterval(function () {
    var n = $('.cal-day.today .cal-now'); if (!n || document.hidden) return; var m = minsOf(Date.now()); n.style.top = ((m - H0 * 60) / 60 * HH) + 'px';
  }, 60000);

  // ---- search + badge -----------------------------------------------------------------------------
  C.searchers.push(function (terms, hit) {
    return visibleEvents().filter(function (e) { var r = e.ref && C.recOf(e.ref.t, e.ref.id); return e.status !== 'cancelled' && hit(e.title + ' ' + (e.loc || '') + ' ' + (r ? r.name : '') + ' ' + TYPES[e.type].label); }).slice(0, 4).map(function (e) {
      return { g: 'Calendar', ic: 'cal', label: e.title, sub: C.dt(e.t) + ' · ' + e.owner.split(' ')[0] + (e.status === 'done' ? ' · done' : ''), run: function () { location.hash = '#/calendar/' + e.id; } };
    });
  });
  C.badgeFns.push(function () {
    var a = dayStart(Date.now()), b = a + D;
    return { cal: (P().events || []).filter(function (e) { return e.status === 'scheduled' && e.t >= a && e.t < b && C.visibleOwner(e.owner); }).length };
  });
})();
