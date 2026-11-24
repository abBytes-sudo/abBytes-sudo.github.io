/* Sthira back office · shell, state, router and UI kit.
   Views register with BO.view(name, def) from admin-home.js, admin-pipe.js, admin-work.js and admin-chat.js.
   Data: 'sthira:crm' (leads, timeline, saved views), 'sthira:inbox' (site forms, estimator and chat leads),
   'sthira:portal' (shared with portal.html), 'sthira:apps' + 'sthira:appsState' (careers), 'orbit-leads' / 'orbit-convos' (chat). */
(function () {
  'use strict';
  var D = window.STHIRA, A = window.App, $ = A.$, $$ = A.$$, esc = A.esc, inr = D.inr, NOW = A.NOW;
  var BO = window.BO = { D: D, A: A, $: $, $$: $$, esc: esc, inr: inr, NOW: NOW, reduce: A.reduce };
  var mac = BO.mac = /Mac|iP(hone|ad)/.test(navigator.platform || navigator.userAgent);
  var MOD = mac ? '⌘' : 'Ctrl ';

  /* ───────── icons ───────── */
  var IC = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    pipe: '<rect x="3" y="4" width="5" height="16"/><rect x="10" y="4" width="5" height="11"/><rect x="17" y="4" width="4" height="7"/>',
    survey: '<path d="M8 4h8l-1 5H9z"/><path d="M12 9l-6 12M12 9l6 12M12 9v12"/>',
    project: '<path d="M4 21V9l8-5 8 5v12"/><path d="M9 21v-6h6v6M2 21h20"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    portal: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 2h6l1-2h5"/>',
    careers: '<rect x="3" y="7" width="18" height="13"/><path d="M9 7V4h6v3M3 12h18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    'chev-r': '<path d="M9 6l6 6-6 6"/>', 'chev-l': '<path d="M15 6l-6 6 6 6"/>', 'chev-d': '<path d="M6 9l6 6 6-6"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    more: '<path d="M5 12h.01M12 12h.01M19 12h.01" stroke-width="3" stroke-linecap="round"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/>',
    mail: '<rect x="3" y="5" width="18" height="14"/><path d="M3 7l9 6 9-6"/>',
    pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    cal: '<rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
    'arrow-r': '<path d="M5 12h14M13 6l6 6-6 6"/>', 'arrow-l': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>',
    photo: '<rect x="3" y="5" width="18" height="14"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>',
    rupee: '<path d="M7 4h10M7 9h10M8 4c7 0 7 9 0 9h-1l8 8"/>',
    doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    star: '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4l-5.5 2.9 1-6.2L3 9.7l6.2-.9z"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
    kbd: '<rect x="2" y="6" width="20" height="12"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
    reset: '<path d="M4 4v6h6"/><path d="M4.6 15a8 8 0 1 0 .4-6.5L4 10"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    board: '<rect x="3" y="4" width="5" height="16"/><rect x="10" y="4" width="5" height="16"/><rect x="17" y="4" width="4" height="16"/>',
    table: '<rect x="3" y="4" width="18" height="16"/><path d="M3 9h18M3 14h18M9 4v16"/>',
    send: '<path d="M4 12l16-8-6 16-2-7z"/>',
    hand: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 015 5v6"/>',
    play: '<path d="M7 4l13 8-13 8z"/>', pause: '<path d="M8 5v14M16 5v14"/>', skip: '<path d="M5 5l10 7-10 7z"/><path d="M19 5v14"/>',
    flag: '<path d="M5 21V4h12l-2 4 2 4H5"/>',
    stamp: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    cols: '<rect x="4" y="4" width="16" height="16"/><path d="M10 4v16M15 4v16"/>',
    cube: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/>',
    drag: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke-width="3" stroke-linecap="round"/>',
    dot: '<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
    rain: '<path d="M7 15a4 4 0 010-8 5 5 0 019.6 1.5A3.5 3.5 0 0117 15z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',
    copy: '<rect x="8" y="8" width="12" height="12"/><path d="M16 8V4H4v12h4"/>',
    logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>'
  };
  var ic = BO.ic = function (n, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || '') + '</svg>'; };

  /* ───────── small helpers ───────── */
  BO.clean = function (s) { return String(s == null ? '' : s).replace(/portal demo/gi, 'portal walk-through').replace(/,?\s*\bdemo\b/gi, '').replace(/\s{2,}/g, ' ').trim(); };
  BO.clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  BO.ini = function (n) { return String(n || '?').replace(/^(Dr|Mr|Mrs|Ms)\.?\s+/i, '').split(/\s+/).filter(function (w) { return /^[A-Za-z]/.test(w) && !/^(and|of|the)$/i.test(w); }).map(function (w) { return w[0].toUpperCase(); }).slice(0, 2).join(''); };
  BO.av = function (name, cls) { var h = 0; String(name).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) | 0; }); return '<span class="av av' + (Math.abs(h) % 4) + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + esc(BO.ini(name)) + '</span>'; };
  BO.num = function (n) { return Number(n || 0).toLocaleString('en-IN'); };
  BO.plural = function (n, w, p) { return n + ' ' + (n === 1 ? w : (p || w + 's')); };
  function hm(d) { d = new Date(d); var h = d.getHours(), m = d.getMinutes(); return ((h % 12) || 12) + (m ? ':' + String(m).padStart(2, '0') : '') + (h < 12 ? ' am' : ' pm'); }
  BO.hm = hm;
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  BO.dayName = function (d) { return DAYS[new Date(d).getDay()]; };
  BO.dur = function (ms) { ms = Math.abs(ms); var m = Math.max(1, Math.round(ms / 6e4)); return m < 60 ? m + ' m' : m < 48 * 60 ? Math.round(m / 60) + ' h' : Math.round(m / 1440) + ' d'; };
  BO.ymd = function (d) { d = new Date(d); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  BO.sameDay = function (a, b) { return new Date(a).toDateString() === new Date(b).toDateString(); };
  BO.due = function (iso) {
    if (!iso) return null; var d = new Date(iso); if (isNaN(d)) return null; var diff = d - NOW, tom = new Date(NOW.getTime() + 864e5);
    if (diff < 0) return { c: 'over', t: 'Overdue ' + BO.dur(diff) };
    if (BO.sameDay(d, NOW)) return { c: 'today', t: 'Today ' + hm(d) };
    if (BO.sameDay(d, tom)) return { c: 'soon', t: 'Tomorrow ' + hm(d) };
    return { c: '', t: BO.dayName(d) + ' ' + A.date(d) + (diff < 6 * 864e5 ? ', ' + hm(d) : '') };
  };
  BO.dueChip = function (iso) { var d = BO.due(iso); return d ? '<span class="due ' + d.c + '">' + esc(d.t) + '</span>' : ''; };
  // a stamp just after the fixed clock, so new activity sorts first and reads "just now"
  var tick = 0; BO.stamp = function () { tick++; return new Date(NOW.getTime() + Math.min(tick, 90) * 1000).toISOString(); };
  BO.rel = function (s) { return A.rel(s); };
  BO.spark = function (vals, cls) {
    var w = 72, h = 22, mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals), n = vals.length - 1 || 1;
    var pts = vals.map(function (v, i) { return [(i / n * w).toFixed(1), (h - 2 - (v - mn) / ((mx - mn) || 1) * (h - 4)).toFixed(1)]; });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(''), l = pts[pts.length - 1];
    return '<svg class="spark' + (cls ? ' ' + cls : '') + '" viewBox="-2 0 ' + (w + 4) + ' ' + h + '" aria-hidden="true"><path d="' + d + '"/><circle cx="' + l[0] + '" cy="' + l[1] + '" r="2"/></svg>';
  };
  BO.delta = function (a, b, opts) {
    opts = opts || {}; if (b == null) return ''; var d = a - b, up = d > 0, good = opts.invert ? !up : up;
    if (!d) return '<span class="dl">± 0 ' + esc(opts.vs || '') + '</span>';
    var v = opts.pct && b ? Math.round(Math.abs(d) / b * 100) + '%' : (opts.money ? inr(Math.abs(d)) : Math.abs(d));
    return '<span class="dl ' + (good ? 'up' : 'dn') + '">' + (up ? '↑ ' : '↓ ') + v + '</span><span class="dl-vs"> ' + esc(opts.vs || '') + '</span>';
  };
  BO.empty = function (title, body, action) {
    return '<div class="emp"><svg class="empty-art" viewBox="0 0 120 64" aria-hidden="true"><path d="M8 52h104M8 48v8M112 48v8" class="dim"/><rect x="30" y="14" width="60" height="30" class="ln"/><path d="M30 29h60M60 14v30" class="cl"/><circle cx="16" cy="29" r="7" class="bb"/><text x="16" y="32" text-anchor="middle">A</text></svg><h3>' + title + '</h3>' + (body ? '<p>' + body + '</p>' : '') + (action || '') + '</div>';
  };

  /* ───────── people and places ───────── */
  BO.TEAM = { Farah: ['Farah Siddiqui', 'Project manager'], Nikhil: ['Nikhil Menon', 'Pre-construction lead'], Rhea: ['Rhea Fernandes', 'Design lead'], Karthik: ['Karthik Gowda', 'Site engineer'] };
  BO.ME = 'Farah'; BO.MEN = 'Farah Siddiqui';
  BO.STUDIOS = ['Bengaluru', 'Pune', 'Hyderabad'];
  BO.studioOf = function (l) { return l.city === 'Pune' ? 'Pune' : l.city === 'Hyderabad' ? 'Hyderabad' : 'Bengaluru'; };
  BO.studio = A.store.get('studio', 'All');
  BO.inStudio = function (l) { return BO.studio === 'All' || BO.studioOf(l) === BO.studio; };
  BO.ST = [{ k: 'enquiry', l: 'Enquiry', g: 'A' }, { k: 'survey', l: 'Site survey', g: 'B' }, { k: 'quote', l: 'Quote', g: 'C' }, { k: 'project', l: 'Project', g: 'D' }];
  BO.SN = { enquiry: 'Enquiry', survey: 'Site survey', quote: 'Quote', project: 'Project', lost: 'Lost' };

  /* ───────── CRM state ───────── */
  var SEED_CHAT = [
    { id: 'L-2313', name: 'Naveen Reddy', city: 'Hyderabad', loc: 'Gachibowli', type: 'Residential', area: 3000, floors: 'G+2', budget: '₹1 – 1.15 Cr', stage: 'enquiry', source: 'Chat', convo: 'sthc-naveen', at: '2026-11-24T10:18', next: 'Confirm the Saturday site visit he asked for', due: '2026-11-24T13:00', owner: 'Nikhil', note: 'Asked the site assistant for a visit on Saturday morning. East-facing 40 × 60 plot, wants a home office on the top floor.', email: 'naveen.r@example.com' },
    { id: 'L-2312', name: 'Shalini Deshmukh', city: 'Pune', loc: 'Kothrud', type: 'Interiors', area: 1850, floors: 'Apartment', budget: '₹28 – 32 L', stage: 'enquiry', source: 'Chat', convo: 'sthc-shalini', at: '2026-11-23T21:05', next: 'Call to confirm the scope and book a measure-up', due: '2026-11-25T11:00', owner: 'Rhea', note: 'Got a fit-out estimate from the site assistant: 3 BHK, modular kitchen and wardrobes, ₹26.8 – 31.5 L. Keys from the builder in January.' }
  ];
  var DEFAULT_VIEWS = [
    { id: 'v1', name: 'My overdue', f: { owner: 'Farah', flag: 'overdue' } },
    { id: 'v2', name: 'From chat', f: { source: 'Chat' } },
    { id: 'v3', name: 'Quotes above ₹1 Cr', f: { stage: 'quote', flag: 'crore' }, layout: 'table' }
  ];
  var SEED_LOG = {
    'L-2311': [['2026-11-24T09:12', 'Came in from the cost estimator', 'in', 'Website']],
    'L-2310': [['2026-11-23T17:10', 'Call: connected. Has a sanctioned plan; wants us to build to it', 'call', 'Nikhil'], ['2026-11-23T16:40', 'Came in from the website form', 'in', 'Website']],
    'L-2309': [['2026-11-22T12:30', 'Email: sent the Banyan Court case study', 'note', 'Rhea'], ['2026-11-22T11:05', 'Referred by Rohit Kulkarni (Banyan Court)', 'in', 'Rhea']],
    'L-2306': [['2026-11-19T15:00', 'Site survey booked for 25 Nov, 10:30 am with Rhea Fernandes', 'move', 'Rhea'], ['2026-11-18T10:20', 'Came in from Instagram', 'in', 'Rhea']],
    'L-2305': [['2026-11-21T11:40', 'Survey done on site. Corner plot, old house to come down; photos in the survey folder', 'note', 'Karthik'], ['2026-11-17T10:00', 'Site survey booked for 21 Nov, 9 am with Karthik Gowda', 'move', 'Karthik']],
    'L-2301': [['2026-11-19T16:20', 'Quote v2 sent: ₹6,18,00,000', 'move', 'Nikhil'], ['2026-11-12T11:00', 'Quote v1 sent: ₹6,42,00,000', 'move', 'Nikhil'], ['2026-11-06T10:00', 'Site survey done at Bommasandra', 'note', 'Nikhil']],
    'L-2299': [['2026-11-15T13:00', 'Visited the Menon Residence with Farah. Loved the courtyard', 'note', 'Farah'], ['2026-11-12T18:00', 'Quote v1 sent: ₹1,16,50,000', 'move', 'Farah']],
    'L-2290': [['2026-11-20T18:10', 'Week 24 report published to the client portal', 'move', 'Farah'], ['2026-11-13T18:00', 'Week 23 report published to the client portal', 'move', 'Farah']],
    'L-2313': [['2026-11-24T10:24', 'Chat: asked for a person, waiting in Conversations', 'call', 'Site assistant'], ['2026-11-24T10:18', 'Came in from the site assistant (chat)', 'in', 'Site assistant']],
    'L-2312': [['2026-11-23T21:05', 'Came in from the site assistant (chat)', 'in', 'Site assistant']]
  };
  var crm = A.store.get('crm', null);
  if (!crm || !crm.leads) crm = { leads: BO.clone(D.LEADS), log: {}, views: [], seen: {} };
  if (!crm.v2) { // first run of this version: chat leads, a timeline and saved views
    SEED_CHAT.forEach(function (l) { if (!crm.leads.some(function (x) { return x.id === l.id; })) crm.leads.push(BO.clone(l)); });
    Object.keys(SEED_LOG).forEach(function (id) { if (!(crm.log[id] || []).length) crm.log[id] = SEED_LOG[id].map(function (e) { return { at: e[0], text: e[1], kind: e[2], by: e[3] }; }); });
    if (!crm.views || !crm.views.length) crm.views = BO.clone(DEFAULT_VIEWS);
    crm.v2 = true;
  }
  crm.log = crm.log || {}; crm.views = crm.views || []; crm.seen = crm.seen || {};
  crm.leads.forEach(function (l) { l.next = BO.clean(l.next); l.note = BO.clean(l.note); });
  BO.crm = crm;
  BO.save = function () { A.store.set('crm', crm); };
  BO.lead = function (id) { for (var i = 0; i < crm.leads.length; i++) if (crm.leads[i].id === id) return crm.leads[i]; return null; };
  BO.log = function (id, text, kind, by) { (crm.log[id] = crm.log[id] || []).unshift({ at: BO.stamp(), text: text, kind: kind || 'note', by: by || BO.ME }); };
  function nextId() { var mx = 2313; crm.leads.forEach(function (l) { var m = /^L-(\d+)$/.exec(l.id); if (m) mx = Math.max(mx, +m[1]); }); return 'L-' + (mx + 1); }
  BO.nextId = nextId;
  function readRaw(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  BO.raw = readRaw;
  // site forms, the estimator and the chat assistant drop leads into 'sthira:inbox'; the chat engine also keeps 'orbit-leads'
  BO.sync = function () {
    var added = [], inbox = A.store.get('inbox', []);
    inbox.slice().reverse().forEach(function (x) {
      var key = 'in|' + x.id + '|' + x.at; if (crm.seen[key]) return; crm.seen[key] = 1;
      var l = BO.clone(x); if (BO.lead(l.id)) l.id = nextId(); // the public forms number from the same range; never overwrite
      l.stage = 'enquiry'; l.fresh = true; l.note = BO.clean(l.note); l.owner = l.owner || 'Farah';
      if (l.source === 'Chat' && !l.convo && l.payload && l.payload.convo) l.convo = l.payload.convo;
      crm.leads.unshift(l); added.push(l);
      BO.logAt(l.id, l.at, l.source === 'Estimator' ? 'Came in from the cost estimator' : l.source === 'Chat' ? 'Came in from the site assistant (chat)' : 'Came in from the ' + (l.source || 'website').toLowerCase(), 'in', l.source === 'Chat' ? 'Site assistant' : 'Website');
    });
    var convos = readRaw('orbit-convos', []), ol = readRaw('orbit-leads', []).filter(function (x) { return x && x.agent === 'builder'; });
    ol.forEach(function (x, i) {
      var key = 'orbit|' + x.id + '|' + x.timestamp; if (crm.seen[key]) return;
      var p = x.payload || {}, cv = p.convo || (convos.filter(function (c) { return c.leadId === x.id; })[0] || {}).id;
      crm.seen[key] = 1;
      if (cv && crm.leads.some(function (l) { return l.convo === cv; })) return; // already arrived through the inbox
      var l = { id: nextId(), name: x.name || 'Chat visitor', email: x.email || '', phone: x.phone || '', city: p.city || 'Bengaluru', loc: p.area || p.loc || p.locality || '', type: p.type || (/fit|interior/i.test(x.intent || '') ? 'Interiors' : 'Residential'),
        area: +p.sqft || +p.area_sqft || +p.size || null, floors: p.floors || '', budget: p.budget || '', stage: 'enquiry', source: 'Chat', convo: cv || '', intent: x.intent || '', at: new Date(NOW.getTime() - (ol.length - i) * 60000).toISOString(),
        next: /visit|survey|book/i.test(x.intent || '') ? 'Confirm the site visit booked in chat' : 'Call back: lead from the site assistant', due: new Date(NOW.getTime() + 2 * 3600e3).toISOString(), owner: 'Farah', fresh: true,
        note: 'From the site assistant' + (x.intent ? ' (' + String(x.intent).replace(/_/g, ' ') + ')' : '') + ': ' + Object.keys(p).filter(function (k) { return k !== 'convo' && typeof p[k] !== 'object'; }).slice(0, 5).map(function (k) { return k.replace(/_/g, ' ') + ' ' + p[k]; }).join(', ') };
      crm.leads.unshift(l); added.push(l); BO.logAt(l.id, l.at, 'Came in from the site assistant (chat)', 'in', 'Site assistant');
    });
    if (added.length) BO.save();
    return added;
  };
  BO.logAt = function (id, at, text, kind, by) { (crm.log[id] = crm.log[id] || []).push({ at: at, text: text, kind: kind, by: by }); crm.log[id].sort(function (a, b) { return new Date(b.at) - new Date(a.at); }); };
  BO.timeline = function (l) { var t = (crm.log[l.id] || []).slice(); if (!t.some(function (e) { return e.kind === 'in'; })) t.push({ at: l.at, text: 'Lead created · ' + (l.source || ''), kind: 'in', by: 'System' }); return t; };

  /* portal (shared with portal.html) */
  BO.P = function () { var p = A.store.get('portal', {}) || {}; ['paid', 'snagStatus', 'co', 'seenStaff', 'recon', 'coAck', 'coAt', 'paidAt', 'payBy'].forEach(function (k) { p[k] = p[k] || {}; }); ['snags', 'msgs', 'updates', 'log'].forEach(function (k) { p[k] = p[k] || []; });
    if (!p.v2) { // the same first-open state the portal writes: one snag and one question from the Raos
      if (!p.snags.some(function (s) { return s.id === 'S-119'; })) p.snags.unshift({ id: 'S-119', title: 'Hairline crack in the plaster trial above the kitchen window', where: 'Ground floor · kitchen', trade: 'Masonry', by: 'Ananya Rao', date: '2026-11-23T19:40', at: '2026-11-23T19:40', status: 'open', detail: 'About 30 cm long, from the window corner upwards.', photo: 'kitchen-crack.jpg', mine: true });
      if (!p.msgs.some(function (m) { return m.at === '2026-11-23T21:10'; })) p.msgs.push({ from: 'Vikram Rao', role: 'Client', at: '2026-11-23T21:10', text: 'Can Karthik also show us the terrace waterproofing on Saturday? My father wants to see the root barrier.' });
      p.v2 = 1;
    }
    return p; };
  BO.saveP = function (p) { A.store.set('portal', p); };

  /* careers */
  BO.SEED_APPS = [
    { id: 'APP-477', at: '2026-11-22T14:10', role: 'Site Engineer, Civil', roleCity: 'Bengaluru', name: 'Pooja Hiremath', email: 'pooja.h@example.com', city: 'Hubballi', exp: '3–5 years', notice: '30 days', cv: 'Pooja_Hiremath_CV.pdf', proj: 'G+4 apartment block in Dharwad: ran the slab cycle for floors 2–4 and the rebar checks with the consultant.', stage: 'shortlisted' },
    { id: 'APP-476', at: '2026-11-21T09:40', role: 'Safety Officer', roleCity: 'Bengaluru', name: 'Joseph Mathew', email: 'joseph.m@example.com', city: 'Kochi', exp: '6–9 years', notice: '60 days', cv: 'JMathew_Safety.pdf', proj: 'Safety lead on a 14-storey residential tower; 1.2 M man-hours without an LTI.', stage: 'interview' },
    { id: 'APP-475', at: '2026-11-20T16:30', role: 'MEP Coordinator', roleCity: 'Hyderabad', name: 'Srinivas Rao Kota', email: 'srinivas.k@example.com', city: 'Vijayawada', exp: '6–9 years', notice: '90 days', cv: 'SKota_MEP.pdf', proj: 'MEP coordination on two IT office blocks in HITEC City; ran clash checks in Navisworks before every ceiling close.', stage: 'offer' },
    { id: 'APP-474', at: '2026-11-19T18:05', role: 'Quantity Surveyor', roleCity: 'Bengaluru', name: 'Sneha Kulkarni', email: 'sneha.k@example.com', city: 'Pune', exp: '3–5 years', notice: '30 days', cv: 'Sneha_QS.docx', proj: 'BOQs for three villa projects and a school, rate analysis to DSR.', stage: 'new' },
    { id: 'APP-472', at: '2026-11-17T12:00', role: 'Site Supervisor', roleCity: 'Mysuru', name: 'Manjunath Gowda', email: 'manju.g@example.com', city: 'Mandya', exp: '6–9 years', notice: '15 days', cv: null, proj: 'Supervised finishing gangs on a 40-bed hospital: plaster, tiling and false ceilings.', stage: 'rejected' },
    { id: 'APP-471', at: '2026-11-15T11:20', role: 'Graduate Trainee Engineer, 2027', roleCity: 'All offices', name: 'Aarav Deshpande', email: 'aarav.d@example.com', city: 'Belagavi', exp: 'Final year / fresher', notice: 'Immediate', cv: 'Aarav_D_resume.pdf', proj: 'Six-week internship on a G+2 residence: cube tests, BBS checks and the daily log.', stage: 'new' }
  ];
  BO.apps = function () { var st = A.store.get('appsState', {}); return A.store.get('apps', []).concat(BO.SEED_APPS).map(function (a) { var s = st[a.id]; return Object.assign({}, a, { stage: (s && s.stage) || (typeof s === 'string' ? s : a.stage), notes: (s && s.notes) || [] }); }); };
  BO.setApp = function (id, patch) { var st = A.store.get('appsState', {}); var cur = st[id]; if (typeof cur === 'string') cur = { stage: cur }; cur = Object.assign({}, cur || {}, patch); st[id] = cur; A.store.set('appsState', st); };

  /* chat: read straight from the shared store so counts work before the engine loads */
  BO.chats = function () { return readRaw('orbit-convos', []).filter(function (c) { return c && c.agent === 'builder' && !c.hidden && (c.engaged || c.status !== 'bot'); }); };
  BO.chatWaiting = function () { return BO.chats().filter(function (c) { return c.status === 'waiting'; }); };

  /* ───────── toasts ───────── */
  BO.toast = function (msg, o) {
    o = o || {}; var box = $('#toasts'); if (!box) return; var t = document.createElement('div'); t.className = 'tst' + (o.bad ? ' bad' : ''); t.setAttribute('role', 'status');
    t.innerHTML = ic(o.icon || (o.bad ? 'alert' : 'check')) + '<span class="tst-m">' + msg + '</span>' + (o.action ? '<button type="button" data-x>' + esc(o.action[0]) + '</button>' : '') + (o.undo ? '<button type="button" data-u>' + ic('undo') + 'Undo</button>' : '');
    box.appendChild(t); var gone = false;
    function kill() { if (gone) return; gone = true; t.classList.add('out'); setTimeout(function () { t.remove(); }, 220); }
    if (o.undo) $('[data-u]', t).addEventListener('click', function () { o.undo(); kill(); });
    if (o.action) $('[data-x]', t).addEventListener('click', function () { o.action[1](); kill(); });
    setTimeout(kill, o.ms || (o.undo ? 7000 : 4200)); return t;
  };

  /* ───────── modal (native dialog) ───────── */
  BO.modal = function (o) {
    var d = document.createElement('dialog'); d.className = 'md ' + (o.size || '');
    d.setAttribute('aria-labelledby', 'mdT');
    d.innerHTML = '<div class="md-h"><div><h2 id="mdT">' + o.title + '</h2>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div><button class="ib" type="button" data-close aria-label="Close">' + ic('x') + '</button></div><div class="md-b">' + (o.body || '') + '</div>' +
      (o.foot ? '<div class="md-f">' + (o.note ? '<span class="md-note">' + o.note + '</span>' : '') + o.foot.map(function (b, i) { return '<button type="button" class="b ' + (b.cls || '') + '" data-f="' + i + '">' + b.label + '</button>'; }).join('') + '</div>' : '');
    document.body.appendChild(d); d.showModal();
    var api = { el: d, close: function () { if (!d.open) return; d.close(); } };
    d.addEventListener('close', function () { d.remove(); if (o.onClose) o.onClose(); });
    d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-close]')) api.close(); var f = e.target.closest('[data-f]'); if (f) { var b = o.foot[+f.getAttribute('data-f')]; if (b.run) b.run(api); else api.close(); } });
    if (o.onOpen) o.onOpen(api);
    return api;
  };
  BO.confirm = function (o) { return new Promise(function (res) { var ok = false; BO.modal({ title: o.title, sub: o.sub, size: 'sm', body: o.body || '', foot: [{ label: o.cancel || 'Keep it' }, { label: o.ok || 'Confirm', cls: 'pri', run: function (api) { ok = true; api.close(); } }], onClose: function () { res(ok); } }); }); };

  /* ───────── popover menu ───────── */
  var openMenu = null;
  BO.menu = function (anchor, items, o) {
    o = o || {}; if (openMenu) { var same = openMenu.anchor === anchor; openMenu.close(); if (same) return; }
    var p = document.createElement('div'); p.className = 'pop'; p.setAttribute('role', 'menu');
    p.innerHTML = items.map(function (it, i) { if (it.sep) return '<div class="pop-sep"></div>'; if (it.head) return '<p class="pop-h">' + it.head + '</p>'; return '<button type="button" class="pop-i' + (it.on ? ' on' : '') + (it.danger ? ' danger' : '') + '" role="menuitem" data-i="' + i + '"' + (it.disabled ? ' disabled title="' + esc(it.disabled) + '"' : '') + '>' + (it.icon ? ic(it.icon) : it.av ? BO.av(it.av) : '') + '<span>' + it.label + '</span>' + (it.kbd ? '<kbd>' + it.kbd + '</kbd>' : it.meta != null ? '<small>' + it.meta + '</small>' : '') + (it.on ? ic('check', 'pop-ck') : '') + '</button>'; }).join('');
    document.body.appendChild(p);
    var r = anchor.getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight, x = o.right ? r.right - w : r.left, y = r.bottom + 4;
    if (x + w > innerWidth - 8) x = innerWidth - w - 8; if (x < 8) x = 8; if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - 4);
    p.style.left = x + 'px'; p.style.top = y + 'px';
    function close() { if (!p.parentNode) return; p.remove(); document.removeEventListener('mousedown', out, true); document.removeEventListener('keydown', key, true); openMenu = null; anchor.setAttribute('aria-expanded', 'false'); }
    function out(e) { if (!p.contains(e.target) && !anchor.contains(e.target)) close(); }
    function key(e) { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); anchor.focus(); return; } if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var b = $$('.pop-i:not([disabled])', p), i = b.indexOf(document.activeElement); i = e.key === 'ArrowDown' ? Math.min(b.length - 1, i + 1) : Math.max(0, i - 1); if (b[i]) b[i].focus(); } }
    document.addEventListener('mousedown', out, true); document.addEventListener('keydown', key, true);
    p.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (!b || b.disabled) return; var it = items[+b.getAttribute('data-i')]; close(); if (it.run) it.run(); });
    anchor.setAttribute('aria-expanded', 'true'); openMenu = { el: p, close: close, anchor: anchor };
    setTimeout(function () { var f = $('.pop-i:not([disabled])', p); if (f) f.focus(); }, 10);
  };

  /* ───────── slide-over ───────── */
  var so = null, soScrim = null, soOpener = null;
  BO.so = {
    acts: {}, onClose: null,
    open: function (html, o) {
      o = o || {}; so = so || $('#so'); soScrim = soScrim || $('#soScrim');
      var was = !so.hidden; if (!was) soOpener = document.activeElement;
      so.innerHTML = html; so.className = 'so' + (o.wide ? ' wide' : ''); so.hidden = false; soScrim.hidden = false;
      BO.so.acts = o.acts || {}; BO.so.onClose = o.onClose || null; BO.so.key = o.key || null;
      requestAnimationFrame(function () { so.classList.add('on'); soScrim.classList.add('on'); });
      document.body.classList.add('so-open');
      if (!was || o.focus) setTimeout(function () { var f = o.focus && $(o.focus, so) || $('.so-x', so); if (f) try { f.focus({ preventScroll: true }); } catch (e) {} }, 60);
    },
    close: function () {
      if (!so || so.hidden) return; so.classList.remove('on'); soScrim.classList.remove('on'); document.body.classList.remove('so-open');
      var cb = BO.so.onClose; BO.so.onClose = null; BO.so.key = null;
      setTimeout(function () { so.hidden = true; soScrim.hidden = true; so.innerHTML = ''; }, BO.reduce ? 0 : 260);
      if (soOpener && document.contains(soOpener)) try { soOpener.focus({ preventScroll: true }); } catch (e) {}
      if (cb) cb();
    },
    isOpen: function () { return so && !so.hidden; },
    el: function () { return so || $('#so'); }
  };
  function soInit() {
    so = $('#so'); soScrim = $('#soScrim');
    soScrim.addEventListener('click', BO.so.close);
    so.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !document.querySelector('.pop')) { e.preventDefault(); BO.so.close(); return; }
      if (e.key === 'Tab') { var f = $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])', so).filter(function (x) { return x.offsetParent !== null; }); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    });
    deleg(so, 'click', 'data-act', function () { return BO.so.acts; });
    deleg(so, 'change', 'data-ch', function () { return BO.so.acts; });
    deleg(so, 'input', 'data-in', function () { return BO.so.acts; });
    so.addEventListener('keydown', function (e) { var t = e.target.closest('[data-kd]'); if (t && BO.so.acts[t.getAttribute('data-kd')]) BO.so.acts[t.getAttribute('data-kd')](t, e); });
  }
  function deleg(root, type, attr, getActs) {
    root.addEventListener(type, function (e) {
      var t = e.target.closest('[' + attr + ']'); if (!t || !root.contains(t)) return; var acts = getActs(); var fn = acts && acts[t.getAttribute(attr)]; if (!fn) return;
      if (type === 'click' && t.tagName !== 'INPUT' && t.tagName !== 'LABEL' && t.tagName !== 'SELECT') e.preventDefault();
      fn(t, e);
    });
  }
  BO.deleg = deleg;

  /* ───────── router ───────── */
  var views = {}, cur = null, curName = '', curPath = '', view = null;
  BO.view = function (name, def) { views[name] = def; };
  BO.route = function () { var h = location.hash.replace(/^#\/?/, ''), q = '', i = h.indexOf('?'); if (i >= 0) { q = h.slice(i + 1); h = h.slice(0, i); } var p = h.split('/').filter(Boolean).map(function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } }); return { name: p[0] || 'home', id: p[1] || '', sub: p[2] || '', q: new URLSearchParams(q), path: h }; };
  BO.go = function (path) { var h = '#/' + String(path).replace(/^#?\/?/, ''); if (location.hash === h) BO.refresh(); else location.hash = h; };
  BO.setQ = function (obj) { var r = BO.route(); Object.keys(obj).forEach(function (k) { var v = obj[k]; if (v == null || v === '' || v === false) r.q.delete(k); else r.q.set(k, v); }); var s = r.q.toString(); history.replaceState(null, '', '#/' + r.path + (s ? '?' + s : '')); };
  BO.cur = function () { return cur; };
  function skel(kind) {
    var row = function (w) { return '<div class="sk-row"><span class="sk" style="width:22px;height:22px;border-radius:50%"></span><span class="sk" style="width:' + w + '%"></span><span class="sk" style="width:12%;margin-left:auto"></span></div>'; };
    var head = '<div class="vh-row"><span class="sk" style="width:180px;height:16px"></span></div>';
    if (kind === 'home') return '<div class="sk-hello"><span class="sk" style="width:320px;height:14px"></span></div><div class="kpis">' + [1, 2, 3, 4, 5].map(function () { return '<div class="kpi"><span class="sk" style="width:60%"></span><span class="sk" style="width:40%;height:20px;margin-top:10px"></span></div>'; }).join('') + '</div><div class="cd" style="margin-top:16px">' + [44, 30, 52, 38, 46].map(row).join('') + '</div>';
    if (kind === 'board') return head + '<div class="sk-board">' + [4, 3, 3, 2].map(function (n) { var s = ''; for (var i = 0; i < n; i++) s += '<div class="sk-card"><span class="sk" style="width:70%"></span><span class="sk" style="width:45%;margin-top:8px"></span><span class="sk" style="width:85%;margin-top:14px"></span></div>'; return '<div>' + s + '</div>'; }).join('') + '</div>';
    if (kind === 'focus') return head + '<div class="cd" style="max-width:720px;height:420px;padding:20px"><span class="sk" style="width:40%"></span><span class="sk" style="width:70%;height:20px;margin-top:16px"></span><span class="sk" style="width:90%;height:56px;margin-top:16px"></span></div>';
    return head + '<div class="cd">' + [42, 30, 50, 36, 44, 28, 40].map(row).join('') + '</div>';
  }
  function render(mode) {
    var r = BO.route(), v = views[r.name] || views.home; if (!v) return;
    var changed = r.path !== curPath;
    if (cur && cur.leave && changed) cur.leave();
    cur = v; curName = views[r.name] ? r.name : 'home'; curPath = r.path;
    document.body.setAttribute('data-view', curName);
    navState(v.nav || curName);
    $('#crumbs').innerHTML = (v.crumbs ? v.crumbs(r) : [[v.title || curName]]).map(function (c, i, a) { return i === a.length - 1 ? '<b>' + esc(c[0]) + '</b>' : '<a href="' + c[1] + '">' + esc(c[0]) + '</a>' + ic('chev-r'); }).join('');
    document.title = (v.docTitle ? v.docTitle(r) : (v.title || 'Back office')) + ' · Sthira back office';
    function paint() { var h = v.render(r, view); if (typeof h === 'string') view.innerHTML = h; if (v.mount) v.mount(r, view); counts(); }
    if (changed && mode === 'nav' && !BO.reduce && v.skeleton !== false) {
      view.innerHTML = skel(v.skeleton || 'list'); view.classList.remove('vin');
      setTimeout(function () { if (BO.route().path !== r.path) return; paint(); scrollTo(0, 0); view.classList.add('vin'); }, 160);
    } else { var y = scrollY; paint(); if (changed) scrollTo(0, 0); else scrollTo(0, y); view.classList.add('vin'); }
    if (changed) { closeMore(); if (mode === 'nav' && BO.so.isOpen()) BO.so.close(); if (mode === 'nav') try { view.focus({ preventScroll: true }); } catch (e) {} }
  }
  BO.refresh = function () { render('keep'); };
  addEventListener('hashchange', function () { if (BO.sync().length) BO.save(); render('nav'); });

  /* ───────── navigation ───────── */
  function liveProjects() { return crm.leads.filter(function (l) { return l.stage === 'project' && BO.inStudio(l) && (!l.project || l.project.pct < 100); }); }
  BO.portalUnread = function () { return BO.portalItems ? BO.portalItems().filter(function (x) { return x.needs; }).length : 0; };
  var NAV = [
    { h: 'Today' },
    { k: 'home', l: 'Home', i: 'home', key: 'h' },
    { k: 'surveys', l: 'Survey queue', i: 'survey', key: 's', ct: function () { return BO.surveyQueue ? BO.surveyQueue().length : 0; }, hot: 'blue' },
    { h: 'Sales' },
    { k: 'pipeline', l: 'Pipeline', i: 'pipe', key: 'p', ct: function () { return crm.leads.filter(function (l) { return l.stage !== 'lost' && l.stage !== 'project' && BO.inStudio(l); }).length; } },
    { k: 'chats', l: 'Conversations', i: 'chat', key: 'c', ct: function () { return BO.chatWaiting().length; }, hot: 'red' },
    { h: 'Delivery' },
    { k: 'projects', l: 'Projects', i: 'project', key: 'j', ct: function () { return liveProjects().length; } },
    { k: 'portal', l: 'Client portal', i: 'portal', key: 't', ct: BO.portalUnread, hot: 'red' },
    { h: 'People' },
    { k: 'careers', l: 'Careers', i: 'careers', key: 'a', ct: function () { return BO.apps().filter(function (a) { return a.stage === 'new'; }).length; }, hot: 'blue' }
  ];
  BO.NAV = NAV;
  var TABS = ['home', 'pipeline', 'surveys', 'chats'];
  function buildNav() {
    $('#nav').innerHTML = NAV.map(function (n, i) { if (n.h) return '<p class="nv-h">' + n.h + '</p>'; return '<a class="nv" href="#/' + (n.k === 'home' ? '' : n.k) + '" data-nav="' + n.k + '">' + ic(n.i) + '<span>' + n.l + '</span>' + (n.ct ? '<span class="ct" data-ct="' + i + '"></span>' : '') + '</a>'; }).join('');
    $('#tabs').innerHTML = TABS.map(function (k) { var n = NAV.filter(function (x) { return x.k === k; })[0], i = NAV.indexOf(n); return '<a class="tab" href="#/' + (k === 'home' ? '' : k) + '" data-nav="' + k + '">' + ic(n.i) + '<span>' + (k === 'surveys' ? 'Surveys' : k === 'chats' ? 'Chats' : n.l) + '</span>' + (n.ct ? '<i class="tb-ct" data-ct="' + i + '"></i>' : '') + '</a>'; }).join('') + '<button type="button" class="tab" id="tbMore" aria-expanded="false" aria-controls="more">' + ic('menu') + '<span>More</span><i class="tb-ct" id="tbMoreCt"></i></button>';
  }
  function navState(k) { $$('[data-nav]').forEach(function (a) { if (a.getAttribute('data-nav') === k) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); var more = TABS.indexOf(k) < 0; $('#tbMore').classList.toggle('on', more); }
  function counts() {
    $$('[data-ct]').forEach(function (el) { var n = NAV[+el.getAttribute('data-ct')], v = 0; try { v = n.ct(); } catch (e) {} el.textContent = v || ''; el.className = el.className.replace(/ (hot-\w+)/g, '') + (v && n.hot ? ' hot-' + n.hot : ''); el.hidden = !v; });
    var mv = 0; ['projects', 'portal', 'careers'].forEach(function (k) { var n = NAV.filter(function (x) { return x.k === k; })[0]; if (n.hot) try { mv += n.ct(); } catch (e) {} }); var mc = $('#tbMoreCt'); mc.textContent = mv || ''; mc.hidden = !mv;
    $('#studioBtn').innerHTML = ic('pin') + '<span class="sw-l">' + (BO.studio === 'All' ? 'All studios' : BO.studio) + '</span>' + ic('chev-d');
  }
  BO.counts = counts;
  function closeMore() { var m = $('#more'); if (m && !m.hidden) { m.hidden = true; $('#tbMore').setAttribute('aria-expanded', 'false'); } }

  /* ───────── + New ───────── */
  BO.newLead = function (pre) {
    pre = pre || {};
    var body = '<form id="nlF" class="fgrid" novalidate>' +
      '<label class="f2"><span>Name</span><input class="in" name="name" required autocomplete="off" placeholder="Who is it?"></label>' +
      '<label><span>Mobile</span><input class="in" name="phone" inputmode="tel" autocomplete="off" placeholder="Optional"></label>' +
      '<label><span>Source</span><select class="in" name="source">' + ['Phone call', 'Walk-in', 'Referral', 'Instagram', 'Tender', 'Chat'].map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select></label>' +
      '<label><span>City</span><select class="in" name="city">' + ['Bengaluru', 'Pune', 'Hyderabad', 'Mysuru', 'Chennai'].map(function (s) { return '<option' + ((BO.studio !== 'All' ? BO.studio : 'Bengaluru') === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label>' +
      '<label><span>Type</span><select class="in" name="type">' + ['Residential', 'Commercial', 'Interiors', 'Turnkey'].map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select></label>' +
      '<label><span>Owner</span><select class="in" name="owner">' + Object.keys(BO.TEAM).map(function (s) { return '<option value="' + s + '"' + (s === BO.ME ? ' selected' : '') + '>' + BO.TEAM[s][0] + '</option>'; }).join('') + '</select></label>' +
      '<label class="f2"><span>What did they ask for?</span><textarea class="in" name="note" rows="3" placeholder="Plot size, floors, budget, when they want to start"></textarea></label><p class="ferr f2" id="nlE" role="alert"></p></form>';
    BO.modal({ title: 'New lead', sub: 'Lands in Enquiry with a call-back due in 3 hours.', body: body, note: '<kbd>' + MOD + '↵</kbd> to add', foot: [{ label: 'Cancel' }, { label: 'Add lead', cls: 'pri', run: submit }], onOpen: function (api) {
      var f = $('#nlF', api.el); if (pre.name) f.name.value = pre.name; setTimeout(function () { f.name.focus(); }, 30);
      f.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); submit(api); } });
      f.addEventListener('submit', function (e) { e.preventDefault(); submit(api); });
    } });
    function submit(api) {
      var f = $('#nlF', api.el), d = Object.fromEntries(new FormData(f).entries()), err = $('#nlE', api.el);
      if (d.name.trim().length < 2) { err.textContent = 'Add a name so the team knows who to ask for.'; f.name.focus(); return; }
      if (d.phone && d.phone.replace(/\D/g, '').replace(/^91/, '').length !== 10) { err.textContent = 'A mobile number has 10 digits. Leave it blank if you don’t have it yet.'; f.phone.focus(); return; }
      var l = { id: nextId(), name: d.name.trim(), phone: d.phone.trim(), city: d.city, type: d.type, source: d.source, owner: d.owner, stage: 'enquiry', at: BO.stamp(), next: 'Call back to qualify', due: new Date(NOW.getTime() + 3 * 3600e3).toISOString(), note: d.note.trim(), fresh: true, loc: '', area: null, floors: '', budget: '' };
      crm.leads.unshift(l); BO.log(l.id, 'Added by hand (' + d.source.toLowerCase() + ')', 'in'); BO.save(); api.close();
      BO.toast('Lead <b>' + l.id + '</b> added for ' + esc(l.name) + '.', { undo: function () { crm.leads = crm.leads.filter(function (x) { return x.id !== l.id; }); BO.crm.leads = crm.leads; BO.save(); BO.so.close(); BO.refresh(); } });
      BO.refresh(); if (BO.openLead) BO.openLead(l.id);
    }
  };
  function newMenu(anchor) {
    BO.menu(anchor, [
      { label: 'Lead', icon: 'user', kbd: 'N', run: function () { BO.newLead(); } },
      { label: 'Site survey from the queue', icon: 'survey', run: function () { BO.go('surveys'); } },
      { label: 'Site update for a client', icon: 'photo', run: function () { BO.go('projects/STH-2611/update'); } },
      { label: 'Message to the Raos', icon: 'chat', run: function () { BO.go('portal?f=msg&compose=1'); } }
    ], { right: true });
  }

  /* ───────── command palette ───────── */
  var ck, ci, cl, items = [], ix = 0;
  function openK(q) { ci.value = q || ''; buildK(ci.value); ck.showModal(); ci.focus(); }
  function buildK(q) {
    q = q.toLowerCase().trim(); var res = [];
    var acts = [['Home', 'home', 'G H'], ['Pipeline', 'pipeline', 'G P'], ['Survey queue', 'surveys', 'G S'], ['Conversations', 'chats', 'G C'], ['Projects', 'projects', 'G J'], ['Client portal activity', 'portal', 'G T'], ['Careers applications', 'careers', 'G A'],
      ['Post the weekly site update · STH-2611', 'projects/STH-2611/update', ''], ['Overdue follow-ups', 'pipeline?flag=overdue&layout=table', ''], ['Leads from chat', 'pipeline?source=Chat', '']];
    acts.forEach(function (a) { if (!q || a[0].toLowerCase().indexOf(q) > -1) res.push({ g: 'Go to', t: a[0], k: a[2], ic: 'arrow-r', run: function () { BO.go(a[1]); } }); });
    if (!q || 'new lead'.indexOf(q) > -1) res.push({ g: 'Go to', t: 'New lead', k: 'N', ic: 'plus', run: function () { BO.newLead(); } });
    crm.leads.forEach(function (l) { var s = (l.name + ' ' + l.id + ' ' + l.city + ' ' + (l.loc || '') + ' ' + (l.project ? l.project.code : '')).toLowerCase(); if (q && s.indexOf(q) > -1 || (!q && l.fresh)) res.push({ g: 'Leads and projects', t: l.name, k: l.id + ' · ' + BO.SN[l.stage], av: l.name, run: function () { BO.openLead(l.id); } }); });
    if (q) BO.apps().forEach(function (a) { if ((a.name + ' ' + a.role + ' ' + a.id).toLowerCase().indexOf(q) > -1) res.push({ g: 'Applications', t: a.name, k: a.role, av: a.name, run: function () { BO.go('careers'); setTimeout(function () { if (BO.openApp) BO.openApp(a.id); }, 250); } }); });
    if (q) BO.chats().forEach(function (c) { var n = (c.user && c.user.name) || 'Site visitor'; if ((n + ' ' + c.messages.map(function (m) { return m.text; }).join(' ')).toLowerCase().indexOf(q) > -1) res.push({ g: 'Conversations', t: n, k: c.status, ic: 'chat', run: function () { BO.go('chats/' + c.id); } }); });
    items = res.slice(0, 40); ix = 0; drawK();
  }
  function drawK() {
    var g = null, h = '';
    items.forEach(function (it, i) { if (it.g !== g) { g = it.g; h += '<li class="ck-g" role="presentation">' + g + '</li>'; } h += '<li role="option" id="ck' + i + '" data-i="' + i + '" aria-selected="' + (i === ix) + '">' + (it.av ? BO.av(it.av, 'sm') : ic(it.ic || 'arrow-r')) + '<span>' + esc(it.t) + '</span>' + (it.k ? '<small>' + esc(it.k) + '</small>' : '') + '</li>'; });
    cl.innerHTML = h || '<li class="ck-none" role="presentation">No matches. Try a name, a city, a lead number like L-2305 or a project code.</li>';
    ci.setAttribute('aria-activedescendant', items.length ? 'ck' + ix : ''); var s = $('#ck' + ix); if (s) s.scrollIntoView({ block: 'nearest' });
  }
  function runK(i) { var it = items[i]; if (!it) return; ck.close(); it.run(); }
  BO.palette = openK;

  /* ───────── keyboard ───────── */
  var gPending = 0;
  function typing(e) { var t = e.target; return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); }
  function help() {
    var rows = [['Search or jump', MOD + 'K', '/'], ['New lead', 'N'], ['Home · Pipeline · Surveys', 'G H', 'G P', 'G S'], ['Conversations · Projects', 'G C', 'G J'], ['Client portal · Careers', 'G T', 'G A'], ['Next / previous record', 'J', 'K'], ['Survey queue: save and next', '↵'], ['Survey queue: skip', 'S'], ['Close a panel', 'Esc'], ['This list', '?']];
    BO.modal({ title: 'Keyboard shortcuts', size: 'sm', body: '<dl class="keys">' + rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r.slice(1).map(function (k) { return '<kbd>' + k + '</kbd>'; }).join(' ') + '</dd>'; }).join('') + '</dl>' });
  }
  addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (ck.open) ck.close(); else openK(); return; }
    if (e.key === 'Escape' && !e.defaultPrevented && BO.so.isOpen() && !document.querySelector('.pop,dialog[open]')) { e.preventDefault(); BO.so.close(); return; }
    if (typing(e) || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('dialog[open]')) return;
    var k = e.key.toLowerCase();
    if (gPending && Date.now() - gPending < 1200) { gPending = 0; var n = NAV.filter(function (x) { return x.key === k; })[0]; if (n) { e.preventDefault(); BO.go(n.k === 'home' ? '' : n.k); } return; }
    if (BO.so.isOpen() && BO.so.key && BO.so.key(e)) return;
    if (k === 'g') { gPending = Date.now(); return; }
    if (k === '/' ) { e.preventDefault(); openK(); return; }
    if (e.key === '?') { e.preventDefault(); help(); return; }
    if (k === 'n' && !BO.so.isOpen()) { e.preventDefault(); BO.newLead(); return; }
    if (cur && cur.keys && cur.keys[k]) cur.keys[k].call(cur, e);
  });

  /* ───────── boot ───────── */
  function boot() {
    view = $('#view'); soInit(); buildNav();
    var va = function () { return cur && cur.acts; };
    deleg(view, 'click', 'data-act', va); deleg(view, 'change', 'data-ch', va); deleg(view, 'input', 'data-in', va);
    view.addEventListener('keydown', function (e) { var t = e.target.closest('[data-kd]'); if (t && cur && cur.acts && cur.acts[t.getAttribute('data-kd')]) cur.acts[t.getAttribute('data-kd')](t, e); });
    ck = $('#ck'); ci = $('#ckIn'); cl = $('#ckList');
    $('#ckKbd').textContent = MOD + 'K'; $$('.mod').forEach(function (m) { m.textContent = MOD + 'K'; });
    ci.addEventListener('input', function () { buildK(ci.value); });
    ci.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); ix = Math.min(items.length - 1, ix + 1); drawK(); } if (e.key === 'ArrowUp') { e.preventDefault(); ix = Math.max(0, ix - 1); drawK(); } if (e.key === 'Enter') { e.preventDefault(); runK(ix); } });
    cl.addEventListener('click', function (e) { var li = e.target.closest('[data-i]'); if (li) runK(+li.getAttribute('data-i')); });
    ck.addEventListener('click', function (e) { if (e.target === ck) ck.close(); });
    $$('[data-k]').forEach(function (b) { b.addEventListener('click', function () { openK(); }); });
    $('#newBtn').addEventListener('click', function () { newMenu(this); });
    $('#studioBtn').addEventListener('click', function () {
      var c = {}; crm.leads.forEach(function (l) { if (l.stage !== 'lost') { var s = BO.studioOf(l); c[s] = (c[s] || 0) + 1; } });
      BO.menu(this, [{ head: 'Studio' }, { label: 'All studios', on: BO.studio === 'All', meta: crm.leads.filter(function (l) { return l.stage !== 'lost'; }).length, run: function () { setStudio('All'); } }].concat(BO.STUDIOS.map(function (s) { return { label: s, on: BO.studio === s, meta: c[s] || 0, run: function () { setStudio(s); } }; })).concat([{ sep: 1 }, { head: 'Bengaluru also covers Mysuru and Chennai' }]));
    });
    function setStudio(s) { BO.studio = s; A.store.set('studio', s); BO.refresh(); BO.toast(s === 'All' ? 'Showing all three studios.' : 'Showing the ' + s + ' studio.', { icon: 'pin' }); }
    $('#meBtn').addEventListener('click', function () { BO.menu(this, [{ head: 'Farah Siddiqui · Project manager' }, { label: 'Keyboard shortcuts', icon: 'kbd', kbd: '?', run: help }, { label: 'Open the client portal', icon: 'ext', run: function () { open('portal.html', '_blank'); } }, { label: 'Open the public site', icon: 'ext', run: function () { open('index.html', '_blank'); } }, { sep: 1 }, { label: 'Start fresh', icon: 'reset', run: fresh }], { right: true }); });
    $('#kbdBtn').addEventListener('click', help);
    $('#freshBtn').addEventListener('click', fresh);
    $('#tbMore').addEventListener('click', function () { var m = $('#more'), on = m.hidden; m.hidden = !on; this.setAttribute('aria-expanded', on); if (on) { m.innerHTML = '<div class="more-in"><p class="nv-h">More</p>' + ['projects', 'portal', 'careers'].map(function (k) { var n = NAV.filter(function (x) { return x.k === k; })[0], v = 0; try { v = n.ct(); } catch (e) {} return '<a class="nv" href="#/' + k + '">' + ic(n.i) + '<span>' + n.l + '</span>' + (v ? '<span class="ct' + (n.hot ? ' hot-' + n.hot : '') + '">' + v + '</span>' : '') + '</a>'; }).join('') + '<button type="button" class="nv" data-more="studio">' + ic('pin') + '<span>Studio: ' + (BO.studio === 'All' ? 'all' : BO.studio) + '</span></button><button type="button" class="nv" data-more="fresh">' + ic('reset') + '<span>Start fresh</span></button></div>'; } });
    $('#more').addEventListener('click', function (e) { if (e.target === this) closeMore(); var b = e.target.closest('[data-more]'); if (!b) { if (e.target.closest('a')) closeMore(); return; } closeMore(); if (b.getAttribute('data-more') === 'fresh') fresh(); else $('#studioBtn').click(); });
    // live: another tab (the public site, the portal or the chat) wrote something
    addEventListener('storage', function (e) {
      if (!e.key) return;
      if (e.key === 'sthira:inbox' || e.key === 'orbit-leads') { var a = BO.sync(); if (a.length) { announce(a); if (!BO.so.isOpen()) BO.refresh(); else counts(); } }
      else if (e.key === 'sthira:portal' || e.key === 'sthira:apps') { if (cur && cur.live !== false && !BO.so.isOpen() && !(cur.busy && cur.busy())) BO.refresh(); else counts(); if (e.key === 'sthira:portal') BO.toast('New activity from the client portal.', { icon: 'portal', action: ['Open', function () { BO.go('portal'); }] }); }
      else if (e.key === 'orbit-convos') { counts(); if (curName === 'home' && !BO.so.isOpen()) BO.refresh(); }
    });
    var added = BO.sync(); render('first');
    var fresh0 = crm.leads.filter(function (l) { return l.fresh; });
    if (fresh0.length) setTimeout(function () { announce(fresh0); }, 500);
  }
  function announce(list) { var chat = list.filter(function (l) { return l.source === 'Chat'; }).length; BO.toast('<b>' + list.length + ' new</b> ' + (list.length === 1 ? 'lead' : 'leads') + (chat === list.length ? ' from chat' : ' from the website') + ': ' + esc(list.slice(0, 3).map(function (l) { return l.name; }).join(', ')), { icon: 'bolt', ms: 7000, action: ['Open', function () { BO.openLead(list[0].id); }] }); }
  function fresh() {
    BO.confirm({ title: 'Start fresh?', sub: 'Clears every lead, note, application and portal change saved in this browser, and restores the starting data.', ok: 'Start fresh' }).then(function (ok) {
      if (!ok) return; ['crm', 'inbox', 'apps', 'appsState', 'portal', 'portal-session', 'studio', 'bo-pipe', 'bo-skip', 'chatseed'].forEach(A.store.del);
      try { var cv = readRaw('orbit-convos', []).filter(function (c) { return c.agent !== 'builder'; }); localStorage.setItem('orbit-convos', JSON.stringify(cv)); var ol = readRaw('orbit-leads', []).filter(function (l) { return l.agent !== 'builder'; }); localStorage.setItem('orbit-leads', JSON.stringify(ol)); } catch (e) {}
      location.hash = '#/'; location.reload();
    });
  }
  BO.fresh = fresh;
  if (document.readyState === 'complete') setTimeout(boot, 0); else document.addEventListener('DOMContentLoaded', boot);
})();
