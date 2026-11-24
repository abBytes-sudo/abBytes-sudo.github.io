/* Lumen CRM Pro — engine: records, timeline, stage gates, workflow runner, scoring, round-robin,
   SLA timers, reminders, notifications, demo bridge, CSV parsing. */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$;
  var P = function () { return C.S().pro; };
  C.P = P;

  // ---- icons --------------------------------------------------------------
  var add = {
    deal: '<path d="M4 7.5h16v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M8.5 7.5V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5v2M4 12.5h16"/>',
    building: '<path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h7A1.5 1.5 0 0 1 14 5.5V21M14 9h4.5A1.5 1.5 0 0 1 20 10.5V21M3 21h18M7.5 8h3M7.5 11.5h3M7.5 15h3M17 13h.01M17 16.5h.01"/>',
    gauge: '<path d="M4.5 17a8.5 8.5 0 1 1 15 0"/><path d="m12 13 4-4.5"/><circle cx="12" cy="13" r="1.4"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>',
    unlock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 6.8-1.2"/>',
    clip: '<path d="m20 11.5-7.8 7.8a5 5 0 0 1-7.1-7.1l8-8a3.4 3.4 0 0 1 4.8 4.8l-8 8a1.7 1.7 0 0 1-2.4-2.4l7.4-7.4"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v3a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-3"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
    split: '<path d="M6 4v5a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4v3M18 4v5a4 4 0 0 1-4 4"/><path d="m15 18 3 3 3-3"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
    'arr-u': '<path d="m6 15 6-6 6 6"/>', 'arr-d': '<path d="m6 9 6 6 6-6"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    reply: '<path d="M9 7 4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 6 6v1"/>',
    pause: '<path d="M8 5v14M16 5v14"/>', move: '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>',
    widen: '<path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"/>'
  };
  Object.keys(add).forEach(function (k) { C.IC[k] = add[k]; });

  // ---- formatting -----------------------------------------------------------
  C.rs = function (v) {
    v = Math.round(v || 0);
    if (v >= 1e7) return '₹' + (v / 1e7).toFixed(2).replace(/\.00$/, '') + ' Cr';
    if (v >= 1e5) return '₹' + (v / 1e5).toFixed(v >= 1e6 ? 1 : 2).replace(/\.0+$/, '').replace(/(\.\d)0$/, '$1') + ' L';
    return '₹' + v.toLocaleString('en-IN');
  };
  C.dur = function (m) { m = Math.round(m || 0); return m < 60 ? m + ' min' : m < 1440 ? Math.round(m / 60) + (m < 120 ? ' hour' : ' hours') : Math.round(m / 1440) + (m < 2880 ? ' day' : ' days'); };
  C.bytes = function (b) { return b >= 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB'; };
  C.dfull = function (ts) { return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
  C.until = function (ts) {
    var d = Math.round((C.dayStart(ts) - C.dayStart()) / 864e5);
    return d === 0 ? 'today' : d === 1 ? 'tomorrow' : d === -1 ? 'yesterday' : d > 0 ? 'in ' + d + ' days' : Math.abs(d) + ' days ago';
  };

  // ---- record access ------------------------------------------------------
  var by = function (arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; };
  C.contact = function (id) { return by(P().contacts, id); };
  C.company = function (id) { return by(P().companies, id); };
  C.deal = function (id) { return by(P().deals, id); };
  C.dealVal = function (d) { return d.items && d.items.length ? d.items.reduce(function (s, i) { return s + i.qty * i.price; }, 0) : (d.amount || 0); };
  C.dealProb = function (d) { if (d.prob != null) return d.prob; var s = C.pstage(d.pipe, d.stage); return s ? s.p : 0; };
  C.dealOpen = function (d) { var s = C.pstage(d.pipe, d.stage); return s && !s.won && !s.lost; };
  C.refName = function (r) {
    if (!r) return '—'; if (r.name && ['deal', 'contact', 'company', 'lead'].indexOf(r.t) < 0) return r.name;
    var o = r.t === 'deal' ? C.deal(r.id) : r.t === 'contact' ? C.contact(r.id) : r.t === 'company' ? C.company(r.id) : r.t === 'lead' ? C.lead(r.id) : null;
    return o ? o.name : r.name || r.id;
  };
  C.refHref = function (r) {
    var m = { deal: 'deals', contact: 'contacts', company: 'companies', convo: 'conversations', event: 'calendar', calendar: 'calendar', quote: 'quotes', ticket: 'tickets', workflow: 'workflows', settings: 'settings' }[r.t];
    return m ? '#/' + m + (r.id ? '/' + r.id : '') : '#/inbox/' + r.id;
  };
  C.contactOfLead = function (lid) { return P().contacts.filter(function (c) { return c.leadId === lid; })[0] || null; };
  C.dealOfLead = function (lid) { return P().deals.filter(function (d) { return d.leadId === lid; })[0] || null; };
  C.uid = function (p) { return p + Date.now().toString(36).slice(-5) + Math.floor(Math.random() * 90 + 10); };
  C.nextId = function (arr, pre, min) { return pre + (arr.reduce(function (m, x) { return Math.max(m, parseInt(String(x.id).replace(/[^0-9]/g, ''), 10) || 0); }, min) + 1); };

  // ---- activity and timeline ---------------------------------------------
  C.ATYPE = { call: ['Call', 'phone'], wa: ['WhatsApp', 'wa'], email: ['Email', 'mail'], note: ['Note', 'note'], stage: ['Stage change', 'flag'], visit: ['Site visit', 'pin'], task: ['Task', 'tasks'], file: ['Attachment', 'clip'], system: ['Record', 'bolt'], seq: ['Sequence', 'flow'], msg: ['Message', 'sms'], auto: ['Automation', 'bolt'] };
  C.pact = function (type, text, ref, who) {
    P().acts.unshift({ id: C.uid('A'), t: Date.now(), type: type, text: text, by: who || 'Aarav Khanna', c: ref.c || null, co: ref.co || null, d: ref.d || null });
  };
  var LMAP = { 'in': 'system', call: 'call', note: 'note', status: 'stage', visit: 'visit', quote: 'email', task: 'task' };
  C.timeline = function (q) {
    var out = P().acts.filter(function (a) { return (q.d && a.d === q.d) || (q.c && a.c === q.c) || (q.co && a.co === q.co); });
    if (q.lead) { var l = C.lead(q.lead); if (l) l.tl.forEach(function (e) { out.push({ id: 'lt' + e.t, t: e.t, type: e.type === 'msg' ? (/^WhatsApp|WhatsApp/.test(e.text) ? 'wa' : 'msg') : (LMAP[e.type] || 'note'), text: e.text, by: l.owner, lead: true }); }); }
    return out.sort(function (a, b) { return b.t - a.t; });
  };

  // ---- notifications --------------------------------------------------------
  // to: a user name (only they see it) or empty (everyone sees it)
  C.notify = function (text, href, icon, to) {
    var p = P(); p.notifs = p.notifs || []; p.notifs.unshift({ t: Date.now(), text: text, href: href || '', icon: icon || 'bell', seen: false, to: to || '' });
    p.notifs = p.notifs.slice(0, 30); C.bell();
  };
  function mine() { var me = C.me ? C.me().name : ''; return (P().notifs || []).filter(function (x) { return !x.to || x.to === me; }); }
  C.myNotifs = mine;
  C.bell = function () { var n = mine().filter(function (x) { return !x.seen; }).length, b = $('#bell-n'); if (b) { b.textContent = n; b.hidden = !n; } var bl = $('#bell'); if (bl) bl.setAttribute('aria-label', n ? 'Notifications, ' + n + ' unread' : 'Notifications'); };
  C.acts.bell = function (el) {
    var pop = $('#bell-pop'), open = pop.hidden; pop.hidden = !open; el.setAttribute('aria-expanded', String(open));
    if (!open) return;
    var L = mine();
    pop.innerHTML = '<div class="bp-h"><b>Notifications</b><span class="muted sm">Reminders, automations and assignments</span></div>' + (L.length ? '<ul>' + L.map(function (x) { return '<li class="' + (x.seen ? '' : 'new') + '">' + C.ic(x.icon, 14) + '<div>' + (x.href ? '<a href="' + esc(x.href) + '">' + esc(x.text) + '</a>' : '<span>' + esc(x.text) + '</span>') + '<time class="muted sm">' + C.rel(x.t) + '</time></div></li>'; }).join('') + '</ul>' : '<p class="empty">Nothing yet. Reminders and automation alerts land here.</p>');
    L.forEach(function (x) { x.seen = true; }); C.save(); C.bell();
  };
  document.addEventListener('click', function (e) { var pop = $('#bell-pop'); if (pop && !pop.hidden && !e.target.closest('#bell-pop,#bell')) { pop.hidden = true; $('#bell').setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('keydown', function (e) { var pop = $('#bell-pop'); if (e.key === 'Escape' && pop && !pop.hidden) { pop.hidden = true; $('#bell').setAttribute('aria-expanded', 'false'); $('#bell').focus(); } });

  // ---- stage gates ------------------------------------------------------------
  C.fieldSet = function (d, f) { var v = d.fields[f]; return f === 'advance' ? +v > 0 : !!(v && String(v).trim()); };
  C.gateFor = function (d, to) {
    var st = C.PIPES[d.pipe].stages, ids = st.map(function (s) { return s.id; }), ti = ids.indexOf(to), fi = ids.indexOf(d.stage), tS = st[ti];
    if (!tS || tS.lost) return null;
    var g = P().gates.filter(function (g) {
      if (!g.on || g.pipe !== d.pipe) return false; var gi = ids.indexOf(g.stage);
      return ti >= gi && (fi < gi || st[fi].lost) && !C.fieldSet(d, g.field);
    });
    return g[0] || null;
  };
  C.gateText = function (g) { return C.pstage(g.pipe, g.stage).label + ' needs “' + C.DFIELDS[g.field].label + '”'; };
  C.fieldInput = function (f, val, id) {
    var F = C.DFIELDS[f];
    if (F.kind === 'select') return '<select id="' + id + '" name="v" required><option value="">Choose…</option>' + F.opts.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
    if (F.kind === 'money') return '<input id="' + id + '" name="v" type="number" min="1000" step="1000" required inputmode="numeric" placeholder="e.g. 50000" value="' + (+val || '') + '">';
    return '<textarea id="' + id + '" name="v" rows="3" required>' + esc(val || '') + '</textarea>';
  };
  C.gateDialog = function (d, to, g, after) {
    var F = C.DFIELDS[g.field], st = C.pstage(d.pipe, to);
    P().gateLog.unshift({ t: Date.now(), d: d.name, gate: g.id, by: d.owner, res: 'blocked' });
    C.dialog('<span class="gate-t">' + C.ic('lock', 16) + 'Stage gate</span>',
      '<p class="gate-why"><b>' + esc(d.name) + '</b> can’t move to <b>' + esc(st.label) + '</b> yet. ' + esc(C.gateText(g)) + '.</p><p class="hint">' + esc(g.why) + '</p>' +
      '<div class="gate-path">' + C.PIPES[d.pipe].stages.filter(function (s) { return !s.lost; }).map(function (s) { var cls = s.id === d.stage ? 'now' : s.id === g.stage ? 'lock' : ''; return '<span class="' + cls + '">' + (s.id === g.stage ? C.ic('lock', 11) : '') + esc(s.label) + '</span>'; }).join('<i aria-hidden="true"></i>') + '</div>' +
      '<div class="field"><label for="gt-v">' + esc(F.label) + '</label>' + C.fieldInput(g.field, d.fields[g.field], 'gt-v') + '</div>',
      'Save and move to ' + esc(st.label), function (fd) {
        var v = fd.get('v'); if (!v || (g.field === 'advance' && !(+v > 0))) return false;
        d.fields[g.field] = g.field === 'advance' ? +v : v;
        C.pact('note', F.label + ': ' + (g.field === 'advance' ? C.inr(+v) : v), { c: d.c, co: d.co, d: d.id }, d.owner);
        P().gateLog[0].res = 'passed';
        setTimeout(function () { var ok = C.moveDeal(d, to, { after: after }); if (ok && after) after(true); }, 30);
      });
  };
  C.moveDeal = function (d, to, o) {
    o = o || {}; if (d.stage === to) return false;
    var g = C.gateFor(d, to); if (g && !o.force) { C.gateDialog(d, to, g, o.after); return false; }
    var from = d.stage, fs = C.pstage(d.pipe, from), ts = C.pstage(d.pipe, to);
    d.stage = to; d.moved = Date.now(); d.prob = null;
    C.pact('stage', 'Stage: ' + fs.label + ' → ' + ts.label, { c: d.c, co: d.co, d: d.id }, d.owner);
    if (C.audit) C.audit('stage', { t: 'deal', id: d.id, name: d.name }, 'Stage', fs.label, ts.label);
    if (ts.won && !o.quiet) C.notify('Deal won: ' + d.name + ' · ' + C.rs(C.dealVal(d)), '#/deals/' + d.id, 'check');
    if (ts.won) { d.wonAt = Date.now(); if (d.pipe === 'sales') C.bridgeWon(d); }
    else if (fs.won) { d.wonAt = null; C.bridge.pullWon(d.id); }
    C.save();
    if (!o.quiet) {
      C.fire('deal.stage', { t: 'deal', rec: d }, { stage: to });
      if (ts.won) C.fire('deal.won', { t: 'deal', rec: d });
    }
    return true;
  };
  C.bridgeWon = function (d) {
    var c = d.c && C.contact(d.c), co = d.co && C.company(d.co);
    var rec = { id: d.id, customer: co ? co.name : c ? c.name : d.name, wonAt: new Date(d.wonAt || Date.now()).toISOString(), items: d.items.filter(function (i) { return i.sku; }).map(function (i) { return { sku: i.sku, name: i.name, qty: i.qty }; }) };
    if (rec.items.length) C.bridge.pushWon(rec);
    return rec;
  };

  // ---- scoring ----------------------------------------------------------------
  function leadVal(l, f) {
    if (f === 'budget') return l.budget; if (f === 'resp') return l.resp; if (f === 'reached') return C.reached(l);
    if (f === 'stale') return l.resp == null && Date.now() - l.created > 864e5 ? 'yes' : 'no';
    if (f === 'score') return C.score(l).pts; if (f === 'priority') return l.priority || 'Normal';
    return l[f];
  }
  function dealFieldVal(d, f) { if (f === 'value') return C.dealVal(d); if (f === 'pipeline') return d.pipe; if (f === 'owner') return d.owner; return d.fields[f]; }
  function test(v, op, want) {
    if (v == null || v === '') return op === 'not';
    var n = parseFloat(want);
    switch (op) {
      case 'is': return String(v).toLowerCase() === String(want).toLowerCase();
      case 'not': return String(v).toLowerCase() !== String(want).toLowerCase();
      case 'gte': return +v >= n; case 'lte': return +v <= n;
      case 'in': return String(want).toLowerCase().split(',').map(function (s) { return s.trim(); }).indexOf(String(v).toLowerCase()) > -1;
      case 'contains': return String(v).toLowerCase().indexOf(String(want).toLowerCase()) > -1;
    }
    return false;
  }
  C.score = function (l) {
    var hits = [], pts = 0;
    P().score.forEach(function (r) { if (!r.on) return; if (test(r.f === 'score' ? 0 : leadVal(l, r.f), r.op, r.v)) { hits.push(r); pts += r.pts; } });
    pts = Math.max(0, Math.min(100, pts));
    return { pts: pts, hits: hits, band: pts >= 60 ? 'hot' : pts >= 35 ? 'warm' : 'cold' };
  };
  C.scoreChip = function (l) { var s = C.score(l); return '<span class="score ' + s.band + '" title="Lead score ' + s.pts + ' of 100">' + s.pts + '</span>'; };

  // ---- round-robin + SLA ------------------------------------------------------
  C.rrNext = function (peek) {
    var R = P().route, pool = R.pool.filter(function (p) { return p.on; }); if (!pool.length) return C.TEAM[0];
    var load = function (nm) { return C.S().leads.filter(function (l) { return l.owner === nm && l.status === 'new'; }).length; };
    for (var k = 0; k < pool.length; k++) {
      var i = (R.ptr + k) % pool.length, p = pool[i];
      if (load(p.name) < p.cap) { if (!peek) R.ptr = (i + 1) % pool.length; return p.name; }
    }
    var p0 = pool[R.ptr % pool.length]; if (!peek) R.ptr = (R.ptr + 1) % pool.length; return p0.name;
  };
  C.sla = function (l) {
    var tgt = P().route.sla;
    if (l.resp != null) return { state: l.resp <= tgt ? 'met' : 'late', min: l.resp, tgt: tgt };
    var m = (Date.now() - l.created) / 6e4;
    return { state: m < tgt * .5 ? 'ok' : m < tgt ? 'risk' : 'breach', min: m, tgt: tgt };
  };
  C.clock = function (min) {
    var s = Math.max(0, Math.floor(min * 60)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60;
    return h >= 24 ? Math.floor(h / 24) + 'd ' + (h % 24) + 'h' : h ? h + 'h ' + String(m).padStart(2, '0') + 'm' : String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  };

  // ---- templates ----------------------------------------------------------------
  C.tpl = function (id) { return P().tpls.filter(function (t) { return t.id === id; })[0]; };
  C.fill = function (txt, who) {
    who = who || {}; var nm = who.name || 'there';
    return String(txt || '').replace(/\{\{first_name\}\}/g, nm.split(' ')[0]).replace(/\{\{owner\}\}/g, (who.owner || 'Aarav Khanna').split(' ')[0]).replace(/\{\{service\}\}/g, (who.service || 'your project').toLowerCase()).replace(/\{\{city\}\}/g, who.city || who.loc || 'NCR');
  };

  // ---- workflow engine -----------------------------------------------------------
  C.EVENTS = {
    'lead.created': { label: 'A new lead arrives', obj: 'lead', ic: 'inbox' },
    'deal.stage': { label: 'A deal enters a stage', obj: 'deal', ic: 'flag' },
    'deal.won': { label: 'A deal is won', obj: 'deal', ic: 'check' },
    'contact.created': { label: 'A contact is created', obj: 'contact', ic: 'user' }
  };
  C.CFIELDS = {
    lead: { source: ['Source', 'sel', Object.keys(C.SOURCES).map(function (k) { return [k, C.SOURCES[k].label]; })], budget: ['Budget (₹ lakh)', 'num'], service: ['Service', 'sel', C.SERVICES.map(function (s) { return [s, s]; })], loc: ['Area', 'sel', C.AREAS.map(function (s) { return [s, s]; })], score: ['Lead score', 'num'], owner: ['Owner', 'sel', C.TEAM.map(function (s) { return [s, s]; })] },
    deal: { pipeline: ['Pipeline', 'sel', [['sales', 'Sales'], ['partner', 'Partnerships']]], value: ['Deal value (₹)', 'num'], owner: ['Owner', 'sel', C.TEAM.map(function (s) { return [s, s]; })], priority: ['Priority', 'sel', C.DFIELDS.priority.opts.map(function (s) { return [s, s]; })] },
    contact: { city: ['City', 'text'], owner: ['Owner', 'sel', C.TEAM.map(function (s) { return [s, s]; })] }
  };
  C.OPS = { is: 'is', not: 'is not', gte: 'is at least', lte: 'is at most', contains: 'contains', 'in': 'is one of' };
  C.ACTIONS = { assign: ['Assign an owner', 'user'], task: ['Create a task', 'tasks'], template: ['Send a template', 'send'], field: ['Update a field', 'note'], notify: ['Notify someone', 'bell'], sequence: ['Enrol in a sequence', 'flow'], reserve: ['Reserve stock in Stockroom', 'box'] };
  C.actText = function (a) {
    if (a.type === 'assign') return a.v === 'round-robin' ? 'Assign by round-robin' : 'Assign to ' + a.v;
    if (a.type === 'task') return 'Task “' + a.v + '”, due in ' + C.dur(a.due || 60);
    if (a.type === 'template') { var t = C.tpl(a.v); return 'Send ' + (t ? (t.ch === 'wa' ? 'WhatsApp' : 'email') + ' “' + t.name + '”' : 'a template'); }
    if (a.type === 'field') return 'Set ' + (C.DFIELDS[a.f] ? C.DFIELDS[a.f].label.toLowerCase() : a.f) + ' to ' + a.v;
    if (a.type === 'notify') return 'Notify ' + a.v;
    if (a.type === 'sequence') { var s = P().seqs.filter(function (x) { return x.id === a.v; })[0]; return 'Enrol in “' + (s ? s.name : a.v) + '”'; }
    if (a.type === 'reserve') return 'Reserve the line items in Stockroom';
    return a.type;
  };
  C.condText = function (obj, c) { var F = (C.CFIELDS[obj] || {})[c.f]; if (!F) return c.f; var v = c.v; if (F[1] === 'sel') { var o = F[2].filter(function (x) { return x[0] === c.v; })[0]; if (o) v = o[1]; } if (c.f === 'budget') v = '₹' + v + ' L'; if (c.f === 'value') v = C.rs(+v); return F[0] + ' ' + C.OPS[c.op] + ' ' + v; };
  function getVal(obj, rec, f) { return obj === 'lead' ? leadVal(rec, f) : obj === 'deal' ? dealFieldVal(rec, f) : rec[f]; }

  C.enrol = function (seqId, who) {
    var s = P().seqs.filter(function (x) { return x.id === seqId; })[0]; if (!s) return false;
    if (s.enr.some(function (e) { return (who.c && e.c === who.c) || (who.lead && e.lead === who.lead); })) return false;
    s.enr.unshift({ c: who.c || null, lead: who.lead || null, step: 0, status: 'active', at: Date.now(), next: Date.now() + 5 * 6e4, log: [] });
    return true;
  };
  C.enrolName = function (e) { var r = e.c ? C.contact(e.c) : e.lead ? C.lead(e.lead) : null; return r ? r.name : '—'; };

  function run(wf, obj, rec) {
    var steps = [], who = obj === 'lead' ? rec : obj === 'deal' ? (C.contact(rec.c) || { name: rec.name }) : rec;
    var ref = obj === 'deal' ? { c: rec.c, co: rec.co, d: rec.id } : obj === 'contact' ? { c: rec.id, co: rec.co } : null;
    wf.acts.forEach(function (a) {
      try {
        if (a.type === 'assign') { var o = a.v === 'round-robin' ? C.rrNext() : a.v; rec.owner = o; if (obj === 'lead') { C.log(rec, 'status', 'Owner set to ' + o + ' by workflow'); C.S().tasks.forEach(function (t) { if (t.leadId === rec.id && !t.done) t.owner = o; }); } steps.push('Assigned to ' + o + (a.v === 'round-robin' ? ' (round-robin)' : '')); }
        else if (a.type === 'task') {
          var due = Date.now() + (a.due || 60) * 6e4;
          if (obj === 'lead') C.addTask(rec.id, a.v, due);
          else C.S().tasks.push({ id: C.uid('T-'), leadId: null, ref: obj === 'deal' ? { t: 'deal', id: rec.id } : { t: 'contact', id: rec.id }, text: a.v, due: due, done: false, owner: rec.owner || C.TEAM[0], remind: 15, reminded: false });
          steps.push('Created task “' + a.v + '”, due in ' + C.dur(a.due || 60));
        } else if (a.type === 'template') {
          var t = C.tpl(a.v), body = C.fill(t.body, { name: who.name, owner: rec.owner, service: rec.service, city: who.city || rec.loc }), ch = t.ch === 'wa' ? 'WhatsApp' : 'Email';
          if (obj === 'lead') C.log(rec, 'msg', ch + ' template “' + t.name + '” sent: ' + body); else C.pact(t.ch === 'wa' ? 'wa' : 'email', ch + ' “' + t.name + '” sent by workflow', ref, rec.owner);
          steps.push('Sent ' + ch + ' template “' + t.name + '”');
        } else if (a.type === 'field') {
          if (obj === 'deal') rec.fields[a.f] = a.v; else rec[a.f] = a.v;
          steps.push('Set ' + (C.DFIELDS[a.f] ? C.DFIELDS[a.f].label.toLowerCase() : a.f) + ' to ' + a.v);
        } else if (a.type === 'notify') {
          C.notify(a.v + ': “' + wf.name + '” ran on ' + rec.name, obj === 'lead' ? '#/inbox/' + rec.id : obj === 'deal' ? '#/deals/' + rec.id : '#/contacts/' + rec.id, 'bolt');
          steps.push('Notified ' + a.v);
        } else if (a.type === 'sequence') {
          var ok = C.enrol(a.v, obj === 'lead' ? { lead: rec.id } : obj === 'deal' ? { c: rec.c } : { c: rec.id }), sq = P().seqs.filter(function (x) { return x.id === a.v; })[0];
          steps.push(ok ? 'Enrolled in sequence “' + sq.name + '”' : 'Already in “' + sq.name + '”, not enrolled twice');
        } else if (a.type === 'reserve') {
          if (obj !== 'deal') { steps.push('Skipped: only deals have line items'); return; }
          var r = C.bridgeWon(rec); steps.push(r.items.length ? 'Reserved ' + r.items.reduce(function (s, i) { return s + i.qty; }, 0) + ' units across ' + r.items.length + ' SKUs in Stockroom' : 'No stock items on this deal');
        }
      } catch (e) { steps.push('Failed: ' + C.actText(a)); }
    });
    return steps;
  }
  C.fire = function (ev, x, ctx) {
    ctx = ctx || {}; var p = P(), obj = C.EVENTS[ev].obj, rec = x.rec, ran = [];
    p.wf.forEach(function (wf) {
      if (!wf.on || wf.when.ev !== ev) return;
      if (ev === 'deal.stage' && wf.when.stage && wf.when.stage !== ctx.stage) return;
      var miss = wf.conds.filter(function (c) { return !test(getVal(obj, rec, c.f), c.op, c.v); });
      var r = { id: C.uid('R'), t: Date.now(), wf: wf.id, rec: { t: obj, id: rec.id, name: rec.name }, ok: !miss.length, skip: !!miss.length, steps: [] };
      if (miss.length) r.steps.push('Condition not met: ' + C.condText(obj, miss[0]) + ' — skipped');
      else { r.steps = run(wf, obj, rec); wf.runs = (wf.runs || 0) + 1; ran.push(wf); }
      p.runs.unshift(r);
    });
    p.runs = p.runs.slice(0, 80); C.save();
    if (ran.length && !ctx.silent) {
      C.toast(ran.length === 1 ? 'Workflow “' + ran[0].name + '” ran on ' + rec.name : ran.length + ' workflows ran on ' + rec.name, { icon: 'bolt' });
      C.ui.wfPulse = ran.map(function (w) { return w.id; }); C.ui.wfPulseAt = Date.now();
    }
    return ran;
  };
  // lead creation runs the lead workflows
  var newLead0 = C.newLead;
  C.newLead = function (o) { var l = newLead0(o); C.fire('lead.created', { t: 'lead', rec: l }); return l; };

  // ---- tasks with reminders ------------------------------------------------------
  C.taskRefHtml = function (t) {
    if (t.leadId) { var l = C.lead(t.leadId); return '<a href="' + C.leadHref(t.leadId) + '">' + esc(l ? l.name : t.leadId) + '</a>'; }
    if (t.ref) return '<a href="' + C.refHref(t.ref) + '">' + esc(C.refName(t.ref)) + '</a>';
    return '';
  };
  C.addRefTask = function (ref, text, due, remind, owner) {
    var t = { id: C.uid('T-'), leadId: null, ref: ref, text: text, due: due, done: false, owner: owner || 'Aarav Khanna', remind: remind || null, reminded: false };
    C.S().tasks.push(t);
    var r = ref.t === 'deal' ? (function (d) { return { c: d.c, co: d.co, d: d.id }; })(C.deal(ref.id)) : ref.t === 'contact' ? { c: ref.id, co: (C.contact(ref.id) || {}).co } : { co: ref.id };
    C.pact('task', 'Task added: ' + text + ' · due ' + C.dt(due) + (remind ? ' · reminder ' + C.dur(remind) + ' before' : ''), r, owner);
    C.save(); C.badges(); return t;
  };
  function remindTick() {
    var S = C.S(); if (!S) return; var now = Date.now(), hit = false;
    S.tasks.forEach(function (t) {
      if (t.done || !t.remind || t.reminded || now < t.due - t.remind * 6e4) return;
      t.reminded = true; hit = true; var mins = Math.round((t.due - now) / 6e4);
      var msg = 'Reminder · ' + (mins > 0 ? 'due in ' + mins + ' min' : 'due now') + ': ' + t.text;
      C.toast(msg, { icon: 'clock' }); C.notify(msg, t.ref ? C.refHref(t.ref) : t.leadId ? '#/inbox/' + t.leadId : '#/tasks', 'clock');
    });
    S.leads.forEach(function (l) {
      if (l.resp != null || l.status !== 'new' || l.slaNote || now - l.created > 864e5 || !C.bizMin) return;
      var s = C.sla(l); if (s.state === 'breach') { l.slaNote = 1; hit = true; C.notify('SLA breach: ' + l.name + ' has waited over ' + s.tgt + ' business minutes', '#/inbox/' + l.id, 'clock', l.owner); }
    });
    if (hit) { C.save(); C.badges(); }
    // live SLA timers
    $$('[data-sla]').forEach(function (el) { var l = C.lead(el.dataset.sla); if (!l) return; var s = C.sla(l); el.textContent = C.clock(s.min); el.className = 'slat ' + s.state; var bar = el.parentNode.querySelector('.slab i'); if (bar) bar.style.width = Math.min(100, s.min / s.tgt * 100) + '%'; });
  }
  setTimeout(function () { setInterval(remindTick, 1000); }, 4000);
  C.remindTick = remindTick;

  // ---- CSV ---------------------------------------------------------------------------
  C.csvParse = function (txt) {
    var rows = [], row = [], f = '', q = false, i = 0, ch;
    txt = String(txt || '').replace(/^﻿/, '');
    for (; i < txt.length; i++) {
      ch = txt[i];
      if (q) { if (ch === '"') { if (txt[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; continue; }
      if (ch === '"') q = true; else if (ch === ',') { row.push(f); f = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && txt[i + 1] === '\n') i++; row.push(f); f = ''; if (row.some(function (x) { return x.trim(); })) rows.push(row); row = []; } else f += ch;
    }
    row.push(f); if (row.some(function (x) { return x.trim(); })) rows.push(row);
    return rows.map(function (r) { return r.map(function (x) { return x.trim(); }); });
  };

  // ---- lead drawer additions ---------------------------------------------------------
  C.drawerExtra = function (l) {
    var s = C.score(l), sla = C.sla(l), d = C.dealOfLead(l.id), c = C.contactOfLead(l.id);
    return '<div class="dr-pro"><a class="dp-score ' + s.band + '" href="#/routing" title="See the scoring rules"><b>' + s.pts + '</b><span>' + { hot: 'Hot', warm: 'Warm', cold: 'Cold' }[s.band] + ' lead</span></a>' +
      '<div class="dp-sla"><span class="muted sm">First reply</span>' + (sla.state === 'met' || sla.state === 'late' ? '<b class="slat ' + (sla.state === 'met' ? 'ok' : 'breach') + '">' + C.fmtMin(sla.min) + '</b>' : '<b class="slat ' + sla.state + '" data-sla="' + l.id + '">' + C.clock(sla.min) + '</b>') + '</div>' +
      '<div class="dp-links">' + (c ? '<a class="btn sm ghost" href="#/contacts/' + c.id + '">' + C.ic('user', 13) + 'Contact</a>' : '') + (d ? '<a class="btn sm" href="#/deals/' + d.id + '">' + C.ic('deal', 13) + esc(d.id) + ' · ' + esc(C.pstage(d.pipe, d.stage).label) + '</a>' : (l.status !== 'lost' ? '<button type="button" class="btn sm pri" data-act="convert" data-id="' + l.id + '">' + C.ic('deal', 13) + 'Convert to deal</button>' : '')) + '</div></div>';
  };
  C.acts.convert = function (el) {
    var l = C.lead(el.dataset.id), p = P(); if (!l) return;
    var c = C.contactOfLead(l.id);
    if (!c) { c = { id: C.nextId(p.contacts, 'P-', 300), name: l.name, co: null, role: 'Homeowner', phone: l.phone, email: l.email, city: l.loc, owner: l.owner, leadId: l.id, created: Date.now(), tags: [] }; p.contacts.unshift(c); }
    var stage = C.reached(l) >= 2 ? 'visit' : 'qualified';
    var d = { id: C.nextId(p.deals, 'D-', 2040), name: l.name.split(' ').slice(-1)[0] + ' residence — ' + l.service, pipe: 'sales', stage: stage, items: [{ sku: null, name: l.service + ' — design and execution', qty: 1, price: Math.round(l.budget * 1e5) }], amount: 0, close: Date.now() + 30 * 864e5, owner: l.owner, c: c.id, co: null, leadId: l.id, created: Date.now(), moved: Date.now(), wonAt: null, fields: {}, prob: null };
    p.deals.unshift(d);
    C.pact('system', 'Deal created from lead ' + l.id + ' in Sales · ' + C.pstage('sales', stage).label, { c: c.id, d: d.id }, l.owner);
    C.log(l, 'status', 'Converted to deal ' + d.id); C.save();
    C.toast('Deal ' + d.id + ' created', { icon: 'deal' });
    C.fire('deal.stage', { t: 'deal', rec: d }, { stage: stage });
    location.hash = '#/deals/' + d.id;
  };

  // simulated incoming lead (the system-flow demo)
  var FIRST = ['Simran', 'Kunal', 'Rhea', 'Arnav', 'Tara', 'Vivek', 'Naina', 'Sameer', 'Ira', 'Dhruv'], LAST = ['Gill', 'Bhalla', 'Chawla', 'Saini', 'Khatri', 'Puri', 'Wadhwa', 'Narang'];
  C.acts['sim-lead'] = function (el) {
    var n = (P().simN = (P().simN || 0) + 1), src = el && el.dataset.src || (n % 2 ? 'whatsapp' : 'web');
    var name = FIRST[n % FIRST.length] + ' ' + LAST[(n * 3) % LAST.length], svc = C.SERVICES[(n * 2) % C.SERVICES.length];
    var l = C.newLead({ name: name, phone: '+91 98••• ••' + (300 + n * 7), source: src, service: svc, loc: C.AREAS[n % C.AREAS.length], budget: src === 'whatsapp' && n % 4 === 1 ? 12 : 4.5, req: C.SOURCES[src].label + ' enquiry. Wants ' + svc.toLowerCase() + '.', utm: src === 'whatsapp' ? { source: 'whatsapp', medium: 'click-to-chat', campaign: 'festive-offer' } : { source: 'website', medium: 'form', campaign: '' } });
    C.notify('New ' + C.SOURCES[src].label + ' lead: ' + l.name + ' → ' + l.owner, '#/inbox/' + l.id, 'inbox');
    if (C.cur) C.rerender(true);
  };
})();
