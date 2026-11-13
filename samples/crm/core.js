/* Lumen CRM — core: state, icons, helpers, charts, tooltip, toasts, palette, shortcuts, router */
(function () {
  'use strict';
  var C = window.CRM;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); };
  C.$ = $; C.$$ = $$; C.esc = esc;
  C.views = {}; C.acts = {}; C.ins = {}; C.chs = {}; C.forms = {}; C.chartSpecs = {}; C.ui = {};

  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  C.motion = function () { return !mq.matches && !!window.gsap; };
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  C.mod = isMac ? '⌘' : 'Ctrl';

  C.SOURCES = {
    web: { label: 'Website form', color: '#2B59FF', icon: 'form' }, google: { label: 'Google search', color: '#0B8F9E', icon: 'search' },
    meta: { label: 'Meta ads', color: '#8454E8', icon: 'mega' }, whatsapp: { label: 'WhatsApp', color: '#1F9D57', icon: 'wa' },
    chatbot: { label: 'Chatbot', color: '#D9731F', icon: 'bot' }, phone: { label: 'Phone', color: '#667085', icon: 'phone' }
  };
  C.STAGES = [
    { id: 'new', label: 'New', color: '#2B59FF' }, { id: 'contacted', label: 'Contacted', color: '#8791A8' },
    { id: 'site', label: 'Site visit', color: '#5F6B86' }, { id: 'quote', label: 'Quote sent', color: '#323A4E' },
    { id: 'won', label: 'Won', color: '#1F9D57' }, { id: 'lost', label: 'Lost', color: '#C4C8D0' }
  ];
  C.stage = function (id) { return C.STAGES.filter(function (x) { return x.id === id; })[0]; };
  C.stageLabel = function (id) { var s = C.stage(id); return s ? s.label : id; };

  // ---- icons (simple inline SVG, no brand marks) ---------------------------
  var IC = {
    dash: '<rect x="3" y="3" width="7" height="9" rx="1.6"/><rect x="14" y="3" width="7" height="5" rx="1.6"/><rect x="14" y="12" width="7" height="9" rx="1.6"/><rect x="3" y="16" width="7" height="5" rx="1.6"/>',
    inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5.5 5h13l2.5 8v5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18v-5z"/>',
    pipe: '<rect x="3" y="4" width="5" height="16" rx="1.6"/><rect x="10" y="4" width="5" height="10" rx="1.6"/><rect x="17" y="4" width="4" height="6" rx="1.6"/>',
    tasks: '<circle cx="12" cy="12" r="9"/><path d="m8 12.4 2.7 2.7L16.4 9.4"/>',
    bot: '<rect x="4" y="8" width="16" height="12" rx="3.5"/><path d="M12 8V5M9 13.5v1.2M15 13.5v1.2M9.5 17.2h5"/><circle cx="12" cy="4" r="1"/>',
    link: '<path d="M10 13.5a4.5 4.5 0 0 0 6.4.4l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.4 1.4"/><path d="M14 10.5a4.5 4.5 0 0 0-6.4-.4l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.4-1.4"/>',
    plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="m6 6 12 12M18 6 6 18"/>', check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    phone: '<path d="M5 4h3.6l1.9 4.7-2.3 1.5a11 11 0 0 0 5.6 5.6l1.5-2.3L20 15.4V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    sms: '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9.5L4 21V6a1 1 0 0 1 0-1z"/><path d="M8 10h8M8 13h5"/>',
    wa: '<path d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2z"/><path d="M8.6 12h.01M12 12h.01M15.4 12h.01"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.6 7.4 8.4 6 8.4-6"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    note: '<path d="M6 3h8l4 4v14H6z"/><path d="M13.5 3v4.5H18M9 13h6M9 17h4"/>',
    form: '<rect x="3" y="4" width="18" height="16" rx="2.2"/><path d="M3 9h18M6.5 6.5h.01M9.5 6.5h.01M7 14h7M7 17h4"/>',
    mega: '<path d="M3.5 10v4l10.5 4.5V5.5z"/><path d="M17 8.5a4.5 4.5 0 0 1 0 7M6.5 14.5 8 20h2.6l-1-4.2"/>',
    'chev-r': '<path d="m9 6 6 6-6 6"/>', 'chev-l': '<path d="m15 6-6 6 6 6"/>', 'chev-d': '<path d="m6 9 6 6 6-6"/>',
    side: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M9.5 4.5v15"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6.5A1.5 1.5 0 0 1 6.5 5H15"/>',
    zin: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2M11 8.5v5M8.5 11h5"/>', zout: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2M8.5 11h5"/>',
    fit: '<path d="M4 9V4.5h4.5M20 9V4.5h-4.5M4 15v4.5h4.5M20 15v4.5h-4.5"/>', play: '<path d="M7 4.5v15l12-7.5z"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14-4M4 5v4h4M4 13a8 8 0 0 0 14 4M20 19v-4h-4"/>', send: '<path d="m4 12 16-8-6 16-3-7z"/>',
    bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>', user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    key: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M7 9h.01M10 9h.01M13 9h.01M16 9h.01M7 12.5h.01M10 12.5h.01M13 12.5h.01M16 12.5h.01M8 16h8"/>',
    flow: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="12" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8.5 6H12a3 3 0 0 1 3 3v0a3 3 0 0 0 .5 1.7M8.5 18H12a3 3 0 0 0 3-3v0"/>',
    grip: '<circle cx="9" cy="6" r="1.3"/><circle cx="15" cy="6" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="18" r="1.3"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>', pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'
  };
  C.ic = function (n, s) { s = s || 16; return '<svg class="ic" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || '') + '</svg>'; };
  C.srcIco = function (k, s) { var o = C.SOURCES[k]; return '<span class="sico" style="--c:' + o.color + '" title="' + esc(o.label) + '">' + C.ic(o.icon, s || 14) + '</span>'; };
  C.srcBadge = function (k) { var o = C.SOURCES[k]; return '<span class="src">' + C.srcIco(k) + '<span>' + o.label + '</span></span>'; };
  C.pill = function (st) { var s = C.stage(st); return '<span class="pill st-' + st + '"><i style="background:' + s.color + '"></i>' + esc(s.label) + '</span>'; };
  C.avatar = function (name, size) {
    var h = 0; for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    var ini = name.split(' ').map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase();
    return '<span class="av" style="--h:' + h + ';' + (size ? 'width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size * .38) + 'px' : '') + '" aria-hidden="true">' + ini + '</span>';
  };

  // ---- state --------------------------------------------------------------
  var KEY = 'lumen-crm-demo-v1', PKEY = 'lumen-crm-prefs-v2', S = null, P = { side: false, views: [] };
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var o = JSON.parse(raw); if (o && o.v === 1 && Date.now() - o.seedAt < 2 * 864e5) return o; }
    } catch (e) { }
    return C.seed();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  C.prefs = function () { return P; };
  C.savePrefs = function () { try { localStorage.setItem(PKEY, JSON.stringify(P)); } catch (e) { } };
  C.S = function () { return S; }; C.save = save;
  C.lead = function (id) { return S.leads.filter(function (l) { return l.id === id; })[0]; };

  // ---- formatting ---------------------------------------------------------
  C.money = function (n) { return n >= 100 ? '₹' + (n / 100).toFixed(2) + ' Cr' : '₹' + (Math.round(n * 10) / 10) + ' L'; };
  C.inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  C.num = function (n) { return Math.round(n).toLocaleString('en-IN'); };
  C.fmtMin = function (m) { return m == null ? '—' : m < 1 ? '<1m' : m < 60 ? Math.round(m) + 'm' : (m / 60).toFixed(1) + 'h'; };
  C.dt = function (ts) { return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }); };
  C.tm = function (ts) { return new Date(ts).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }); };
  C.dshort = function (ts) { return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); };
  C.rel = function (ts) {
    var m = (Date.now() - ts) / 6e4;
    if (m < 1) return 'just now'; if (m < 60) return Math.round(m) + 'm ago';
    if (m < 1440) return Math.round(m / 60) + 'h ago'; if (m < 10080) return Math.round(m / 1440) + 'd ago';
    return C.dshort(ts);
  };
  C.dayStart = function (ts) { var d = new Date(ts || Date.now()); d.setHours(0, 0, 0, 0); return d.getTime(); };
  C.page = function (h1, sub, actions) {
    return '<header class="page-h"><div><h1>' + h1 + '</h1>' + (sub ? '<p class="sub">' + sub + '</p>' : '') + '</div>' + (actions ? '<div class="page-a">' + actions + '</div>' : '') + '</header>';
  };
  C.simTag = '<span class="sim" title="No real API is called">Simulated data</span>';
  C.leadHref = function (id) { return '#/' + (C.cur ? C.cur.name : 'inbox') + '/' + id; };
  C.fmts = {
    int: C.num, pct: function (v) { return v.toFixed(0) + '%'; }, min: C.fmtMin, money: C.money, inr: C.inr,
    dec1: function (v) { return v.toFixed(1); }, pct1: function (v) { return v.toFixed(1) + '%'; }
  };

  // ---- actions on data ----------------------------------------------------
  C.log = function (lead, type, text) { lead.tl.push({ t: Date.now(), type: type, text: text }); };
  C.capi = function (lead, name) {
    var hex = ''; for (var i = 0; i < 12; i++) hex += Math.floor(Math.random() * 16).toString(16);
    S.capi.unshift({ id: 'evt_' + hex, t: Date.now(), name: name, leadId: lead ? lead.id : null, match: +(7 + Math.random() * 2).toFixed(1), status: 'Delivered', value: name === 'Purchase' && lead ? Math.round(lead.budget * 1e5) : null, fresh: true });
  };
  C.setStatus = function (lead, to) {
    if (lead.status === to) return false;
    var from = lead.status; lead.status = to;
    C.log(lead, 'status', 'Status changed from ' + C.stageLabel(from) + ' to ' + C.stageLabel(to));
    if (lead.resp == null && from === 'new') lead.resp = Math.max(1, Math.round((Date.now() - lead.created) / 6e4));
    if (to === 'won' || to === 'lost') S.tasks.forEach(function (t) { if (t.leadId === lead.id && !t.done) { t.done = true; t.doneAt = Date.now(); } });
    if (lead.source === 'meta') { var m = { contacted: 'Contact', site: 'Schedule', won: 'Purchase' }[to]; if (m) C.capi(lead, m); }
    save(); C.badges(); return true;
  };
  C.addTask = function (leadId, text, due) {
    var l = C.lead(leadId);
    S.tasks.push({ id: 'T-' + Date.now().toString(36) + Math.floor(Math.random() * 99), leadId: leadId, text: text, due: due, done: false, owner: l ? l.owner : C.TEAM[0] });
    if (l) C.log(l, 'task', 'Follow-up task added: ' + text);
    save(); C.badges();
  };
  C.newLead = function (o) {
    // Lead model (flat, so external sources can be merged later): id, name, phone, email, source, service, loc, budget (₹ lakh), status, owner, created (ms), resp (min|null), req, utm{source,medium,campaign}, tl[], notes[].
    var n = S.leads.reduce(function (m, l) { return Math.max(m, parseInt(String(l.id).replace(/[^0-9]/g, ''), 10) || 0); }, 1000) + 1;
    var lead = {
      id: 'L-' + n, name: o.name, phone: o.phone || '—', email: o.email || '', source: o.source, service: o.service, loc: o.loc || 'Delhi NCR',
      budget: o.budget || 3, status: 'new', owner: C.TEAM[n % 4], created: Date.now(), resp: o.source === 'chatbot' ? 1 : null,
      req: o.req || 'No details provided yet.', utm: o.utm || { source: 'manual', medium: 'entry', campaign: '' }, tl: [], notes: []
    };
    C.log(lead, 'in', 'Lead received via ' + C.SOURCES[o.source].label + (o.extra ? ' · ' + o.extra : ''));
    S.leads.unshift(lead); save(); C.badges(); return lead;
  };
  // how far down the funnel a lead got (0 new … 4 won)
  C.reached = function (l) {
    if (l.status === 'won') return 4;
    if (l.status !== 'lost') return { 'new': 0, contacted: 1, site: 2, quote: 3 }[l.status];
    var has = function (t) { return l.tl.some(function (e) { return e.type === t; }); };
    return has('quote') ? 3 : has('visit') ? 2 : l.resp != null ? 1 : 0;
  };

  // ---- toasts + tooltip ---------------------------------------------------
  C.toast = function (msg, opt) {
    opt = opt || {};
    var box = $('#toasts'), el = document.createElement('div'); el.className = 'toast';
    el.innerHTML = '<span class="t-ic">' + C.ic(opt.icon || 'check', 14) + '</span><span class="t-m">' + esc(msg) + '</span>' + (opt.undo ? '<button type="button" class="t-u">Undo</button>' : '');
    while (box.children.length > 3) box.removeChild(box.firstChild);
    box.appendChild(el);
    var gone = false, kill = function () {
      if (gone) return; gone = true;
      if (C.motion()) { gsap.to(el, { opacity: 0, y: 8, duration: .22, onComplete: function () { el.remove(); } }); setTimeout(function () { el.remove(); }, 500); } else el.remove();
    };
    if (opt.undo) $('.t-u', el).addEventListener('click', function () { opt.undo(); kill(); });
    if (C.motion()) gsap.fromTo(el, { opacity: 0, y: 14, scale: .98 }, { opacity: 1, y: 0, scale: 1, duration: .3, ease: 'power3.out' });
    setTimeout(kill, opt.undo ? 5200 : 3000);
  };
  var tipEl;
  function tipShow(html, x, y) {
    tipEl = tipEl || $('#tip'); tipEl.innerHTML = html; tipEl.classList.add('on');
    var w = tipEl.offsetWidth, h = tipEl.offsetHeight, nx = x + 14, ny = y - h - 12;
    if (nx + w > innerWidth - 8) nx = x - w - 14; if (nx < 8) nx = 8; if (ny < 8) ny = y + 18;
    tipEl.style.transform = 'translate(' + Math.round(nx) + 'px,' + Math.round(ny) + 'px)';
  }
  function tipHide() { tipEl = tipEl || $('#tip'); tipEl.classList.remove('on'); }
  C.tipRow = function (title, rows) { return '<div class="tt-h">' + esc(title) + '</div>' + rows.map(function (r) { return '<div class="tt-r">' + (r.c ? '<i style="background:' + r.c + '"></i>' : '') + '<span>' + esc(r.l) + '</span><b>' + esc(r.v) + '</b></div>'; }).join(''); };

  document.addEventListener('pointermove', function (e) {
    var t = e.target; if (!t.closest) return;
    var ch = t.closest('.chart');
    if (ch && ch._hv && e.pointerType !== undefined) {
      var hv = ch._hv, svg = $('svg', ch), r = svg.getBoundingClientRect(), x = e.clientX - r.left, best = 0, bd = 1e9;
      hv.pts.forEach(function (p, i) { var d = Math.abs(p.x - x); if (d < bd) { bd = d; best = i; } });
      var p = hv.pts[best], xh = $('.xh', svg);
      if (xh) { xh.setAttribute('x1', p.x); xh.setAttribute('x2', p.x); xh.style.opacity = 1; }
      $$('.xd', svg).forEach(function (c, si) { c.setAttribute('cx', p.x); c.setAttribute('cy', hv.ys[si][best]); c.style.opacity = 1; });
      tipShow(p.tip, e.clientX, r.top + hv.ys[0][best]); return;
    }
    var d = t.closest('[data-tip]');
    if (d) { tipShow(d.getAttribute('data-tip'), e.clientX, e.clientY); return; }
    if (tipEl && tipEl.classList.contains('on')) { tipHide(); $$('.xh,.xd').forEach(function (n) { n.style.opacity = 0; }); }
  });
  document.addEventListener('pointerleave', function () { tipHide(); }, true);
  document.addEventListener('scroll', function () { tipHide(); }, true);

  // ---- charts (hand-rolled SVG) -------------------------------------------
  var uid = 0, CH = C.chart = {};
  function nice(v) { if (v <= 0) return 1; var p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; }
  function fmtTick(v) { return v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : (Number.isInteger(v) ? String(v) : v.toFixed(1)); }
  function wrap(w, h, label, inner) { return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc(label) + '">' + inner + '</svg>'; }
  function mono(p) {
    var n = p.length, i; if (n < 2) return 'M' + p[0][0] + ',' + p[0][1];
    var dx = [], m = [], t = [];
    for (i = 0; i < n - 1; i++) { dx[i] = p[i + 1][0] - p[i][0]; m[i] = (p[i + 1][1] - p[i][1]) / dx[i]; }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = t[i + 1] = 0; continue; }
      var a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
      if (s > 9) { var tau = 3 / Math.sqrt(s); t[i] = tau * a * m[i]; t[i + 1] = tau * b * m[i]; }
    }
    var d = 'M' + p[0][0].toFixed(1) + ',' + p[0][1].toFixed(1);
    for (i = 0; i < n - 1; i++) { var h = dx[i] / 3; d += 'C' + (p[i][0] + h).toFixed(1) + ',' + (p[i][1] + t[i] * h).toFixed(1) + ' ' + (p[i + 1][0] - h).toFixed(1) + ',' + (p[i + 1][1] - t[i + 1] * h).toFixed(1) + ' ' + p[i + 1][0].toFixed(1) + ',' + p[i + 1][1].toFixed(1); }
    return d;
  }
  // series: [{values, color, label, dash, fill}]
  CH.area = function (o) {
    var w = o.w, h = o.h || 240, L = o.L || 34, R = 12, T = 12, B = 24, n = o.labels.length, iw = w - L - R, ih = h - T - B, id = 'g' + (++uid), i, all = [];
    o.series.forEach(function (s) { all = all.concat(s.values); });
    var lo, hi;
    if (o.invert) { lo = Math.floor(Math.min.apply(null, all)) - 1; hi = Math.ceil(Math.max.apply(null, all)) + 1; } else { lo = 0; hi = nice(Math.max.apply(null, all.concat([1])) * 1.05); }
    var X = function (i) { return L + (n === 1 ? iw / 2 : iw * i / (n - 1)); };
    var Y = function (v) { var f = (v - lo) / (hi - lo); return T + (o.invert ? ih * f : ih * (1 - f)); };
    var g = '<defs>' + o.series.map(function (s, k) { return s.fill === false ? '' : '<linearGradient id="' + id + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + s.color + '" stop-opacity=".2"/><stop offset="1" stop-color="' + s.color + '" stop-opacity="0"/></linearGradient>'; }).join('') + '</defs>';
    for (i = 0; i <= 4; i++) { var v = lo + (hi - lo) * i / 4, y = Y(v); g += '<line class="gl" x1="' + L + '" x2="' + (w - R) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/><text class="ax" x="' + (L - 8) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end">' + (o.tick ? o.tick(v) : fmtTick(v)) + '</text>'; }
    var step = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / 58))));
    for (i = 0; i < n; i++) if (i % step === 0 || i === n - 1 && (n - 1) % step >= step * .7) g += '<text class="ax" x="' + X(i).toFixed(1) + '" y="' + (h - 6) + '" text-anchor="' + (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') + '">' + esc(o.labels[i]) + '</text>';
    for (i = o.series.length - 1; i >= 0; i--) {
      var s = o.series[i], pts = s.values.map(function (v, j) { return [X(j), Y(v)]; }), d = mono(pts);
      if (s.fill !== false && !o.invert) g += '<path class="ar" d="' + d + ' L' + X(n - 1).toFixed(1) + ',' + (T + ih) + ' L' + X(0).toFixed(1) + ',' + (T + ih) + 'Z" fill="url(#' + id + i + ')"/>';
      g += '<path class="ln' + (s.dash ? ' dash' : '') + '"' + (s.dash ? '' : ' pathLength="1"') + ' d="' + d + '" stroke="' + s.color + '"/>';
    }
    g += '<line class="xh" y1="' + T + '" y2="' + (T + ih) + '" x1="0" x2="0"/>';
    o.series.forEach(function (s) { g += '<circle class="xd" r="4" stroke="' + s.color + '" cx="0" cy="0"/>'; });
    var hv = { pts: [], ys: o.series.map(function (s) { return s.values.map(Y); }) };
    for (i = 0; i < n; i++) hv.pts.push({ x: X(i), tip: C.tipRow((o.titles || o.labels)[i], o.series.map(function (s) { return { c: s.color, l: s.label, v: (o.fmt || String)(s.values[i]) }; })) });
    return { svg: wrap(w, h, o.label, g), hv: hv };
  };
  CH.bars = function (o) {
    var w = o.w, h = o.h || 220, L = 38, R = 8, T = 12, B = 24, n = o.values.length, max = nice(Math.max.apply(null, o.values.concat([1])) * 1.04), iw = w - L - R, ih = h - T - B, bw = iw / n, g = '', i;
    for (i = 0; i <= 4; i++) { var y = T + ih - ih * i / 4; g += '<line class="gl" x1="' + L + '" x2="' + (w - R) + '" y1="' + y + '" y2="' + y + '"/><text class="ax" x="' + (L - 8) + '" y="' + (y + 3.5) + '" text-anchor="end">' + (o.tick ? o.tick(max * i / 4) : fmtTick(max * i / 4)) + '</text>'; }
    var step = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / 58))));
    o.values.forEach(function (v, i) {
      var bh = Math.max(1, ih * v / max), x = L + i * bw + bw * .18;
      g += '<rect class="bar" data-tip="' + esc(C.tipRow(o.labels[i], [{ c: o.color, l: o.name || 'Value', v: (o.fmt || String)(v) }])) + '" x="' + x.toFixed(1) + '" y="' + (T + ih - bh).toFixed(1) + '" width="' + (bw * .64).toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="2" fill="' + o.color + '"/>';
      if (i % step === 0) g += '<text class="ax" x="' + (L + i * bw + bw / 2).toFixed(1) + '" y="' + (h - 6) + '" text-anchor="middle">' + esc(o.labels[i]) + '</text>';
    });
    return wrap(w, h, o.label, g);
  };
  CH.donut = function (o) {
    var s = o.size, sw = o.sw || s * .13, r = (s - sw) / 2 - 1, c = s / 2, tot = o.items.reduce(function (a, b) { return a + b.value; }, 0) || 1, acc = 0, g = '';
    g += '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="var(--line-2)" stroke-width="' + sw + '"/>';
    o.items.forEach(function (it) {
      if (!it.value) return;
      var len = it.value / tot * 100, gap = o.items.length > 1 ? .8 : 0;
      g += '<circle class="arc" data-len="' + Math.max(0, len - gap).toFixed(2) + '" data-tip="' + esc(C.tipRow(it.label, [{ c: it.color, l: Math.round(len) + '% of ' + tot, v: String(it.value) }])) + '" cx="' + c + '" cy="' + c + '" r="' + r + '" pathLength="100" fill="none" stroke="' + it.color + '" stroke-width="' + sw + '" stroke-dasharray="' + Math.max(0, len - gap).toFixed(2) + ' ' + (100 - Math.max(0, len - gap)).toFixed(2) + '" stroke-dashoffset="' + (-acc).toFixed(2) + '" transform="rotate(-90 ' + c + ' ' + c + ')"/>';
      acc += len;
    });
    g += '<text class="dn-big" x="' + c + '" y="' + (c + (o.sub ? 3 : 9)) + '" text-anchor="middle">' + esc(o.center) + '</text>';
    if (o.sub) g += '<text class="ax" x="' + c + '" y="' + (c + 20) + '" text-anchor="middle">' + esc(o.sub) + '</text>';
    return wrap(s, s, o.label, g);
  };
  CH.hbars = function (o) {
    var w = o.w, rh = o.rowH || 32, h = o.items.length * rh + 2, lw = o.lw || Math.min(130, Math.round(w * .38)), vw = o.vw || 58, bw = Math.max(20, w - lw - vw - 6), max = Math.max.apply(null, o.items.map(function (i) { return i.value; }).concat([1])), g = '';
    o.items.forEach(function (it, i) {
      var y = i * rh + 1, len = Math.max(2, bw * it.value / max);
      g += '<text class="ax2" x="0" y="' + (y + rh / 2 + 4) + '">' + esc(it.label) + '</text><rect x="' + lw + '" y="' + (y + 8) + '" width="' + bw + '" height="' + (rh - 16) + '" rx="3" fill="var(--line-2)"/><rect class="hb" data-tip="' + esc(C.tipRow(it.label, [{ c: it.color || 'var(--accent)', l: o.name || 'Value', v: it.text != null ? it.text : it.value }])) + '" x="' + lw + '" y="' + (y + 8) + '" width="' + len.toFixed(1) + '" height="' + (rh - 16) + '" rx="3" fill="' + (it.color || 'var(--accent)') + '"/><text class="ax2 b" x="' + (w) + '" y="' + (y + rh / 2 + 4) + '" text-anchor="end">' + esc(it.text != null ? it.text : it.value) + '</text>';
    });
    return wrap(w, h, o.label, g);
  };
  // Sankey-like funnel: columns joined by ribbons
  CH.funnel = function (o) {
    var w = o.w, h = o.h || 230, n = o.items.length, T = 34, B = 40, ph = h - T - B, pad = 6, colW = Math.max(22, Math.min(54, w / n * .38)), max = Math.max.apply(null, o.items.map(function (i) { return i.value; }).concat([1])), g = '', cols = [];
    o.items.forEach(function (it, i) {
      var x = pad + i * (w - 2 * pad - colW) / (n - 1), ch = Math.max(3, ph * it.value / max), y = T + (ph - ch) / 2;
      cols.push({ x: x, y: y, h: ch });
    });
    for (var i = 0; i < n - 1; i++) {
      var a = cols[i], b = cols[i + 1], x1 = a.x + colW, x2 = b.x, mx = (x1 + x2) / 2;
      g += '<path class="frib" d="M' + x1 + ',' + a.y + ' C' + mx + ',' + a.y + ' ' + mx + ',' + b.y + ' ' + x2 + ',' + b.y + ' L' + x2 + ',' + (b.y + b.h) + ' C' + mx + ',' + (b.y + b.h) + ' ' + mx + ',' + (a.y + a.h) + ' ' + x1 + ',' + (a.y + a.h) + 'Z"/>';
      var pc = o.items[i].value ? Math.round(o.items[i + 1].value / o.items[i].value * 100) : 0;
      g += '<text class="fpc" x="' + mx.toFixed(1) + '" y="' + (T + ph / 2 + 4) + '" text-anchor="middle">' + pc + '%</text>';
    }
    o.items.forEach(function (it, i) {
      var c = cols[i], last = i === n - 1;
      g += '<rect class="fcol" data-tip="' + esc(C.tipRow(it.label, [{ c: it.color, l: 'Leads reaching this stage', v: String(it.value) }])) + '" x="' + c.x.toFixed(1) + '" y="' + c.y.toFixed(1) + '" width="' + colW + '" height="' + c.h.toFixed(1) + '" rx="3" fill="' + it.color + '"/>' +
        '<text class="fn" x="' + (c.x + colW / 2).toFixed(1) + '" y="' + (T - 12) + '" text-anchor="middle">' + it.value + '</text>' +
        '<text class="ax" x="' + (c.x + colW / 2).toFixed(1) + '" y="' + (h - 14) + '" text-anchor="' + (i === 0 ? 'start' : last ? 'end' : 'middle') + '" transform="translate(' + (i === 0 ? -colW / 2 + 4 : last ? colW / 2 - 4 : 0) + ',0)">' + esc(it.label) + '</text>';
    });
    return wrap(w, h, o.label, g);
  };
  C.spark = function (vals, color, h) {
    h = h || 30; var n = vals.length, max = Math.max.apply(null, vals.concat([1])), min = Math.min.apply(null, vals.concat([max])), rng = (max - min) || 1;
    var pts = vals.map(function (v, i) { return [n === 1 ? 50 : 100 * i / (n - 1), 3 + (h - 6) * (1 - (v - min) / rng)]; });
    if (n === 1) pts.push([100, pts[0][1]]);
    var d = mono(pts), id = 'sp' + (++uid);
    return '<svg class="spk" viewBox="0 0 100 ' + h + '" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity=".18"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs><path class="sar" d="' + d + ' L100,' + h + ' L0,' + h + 'Z" fill="url(#' + id + ')"/><path class="sln" pathLength="1" d="' + d + '" stroke="' + color + '" vector-effect="non-scaling-stroke"/></svg>';
  };

  // GSAP entry choreography for freshly drawn charts
  C.fx = function (root) {
    if (!C.motion() || C.noFx) return;
    var q = function (s) { return $$(s, root); }, st = .06;
    q('path.ln:not(.dash)').forEach(function (p, i) { gsap.fromTo(p, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut', delay: .05 + i * .1, onComplete: function () { p.style.strokeDasharray = 'none'; } }); });
    q('path.ln.dash').forEach(function (p) { gsap.from(p, { opacity: 0, duration: .6, delay: .4 }); });
    q('path.ar').forEach(function (p) { gsap.from(p, { opacity: 0, duration: .8, delay: .5 }); });
    q('.sln').forEach(function (p) { gsap.fromTo(p, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .9, ease: 'power2.out', onComplete: function () { p.style.strokeDasharray = 'none'; } }); });
    q('.sar').forEach(function (p) { gsap.from(p, { opacity: 0, duration: .8, delay: .3 }); });
    var bars = q('rect.bar'); if (bars.length) gsap.from(bars, { scaleY: 0, transformOrigin: '50% 100%', duration: .6, ease: 'power3.out', stagger: Math.min(st / 2, .6 / bars.length) });
    var hb = q('rect.hb'); if (hb.length) gsap.from(hb, { scaleX: 0, transformOrigin: '0% 50%', duration: .7, ease: 'power3.out', stagger: .07 });
    var fc = q('.fcol'); if (fc.length) { gsap.from(fc, { scaleY: 0, transformOrigin: '50% 50%', duration: .7, ease: 'power3.out', stagger: .09 }); gsap.from(q('.frib'), { opacity: 0, duration: .7, delay: .35, stagger: .09 }); gsap.from(q('.fn,.fpc'), { opacity: 0, duration: .5, delay: .5, stagger: .06 }); }
    var arcs = q('.arc'); if (arcs.length) {
      var o = { p: 0 }; gsap.to(o, { p: 1, duration: 1, ease: 'power3.out', onUpdate: function () { arcs.forEach(function (a) { var l = +a.dataset.len * o.p; a.setAttribute('stroke-dasharray', l.toFixed(2) + ' ' + (100 - l).toFixed(2)); }); } });
    }
  };
  C.countUp = function (root) {
    $$('[data-count]', root).forEach(function (el) {
      var to = parseFloat(el.dataset.count), f = C.fmts[el.dataset.f || 'int'];
      if (!isFinite(to)) return;
      if (!C.motion() || C.noFx) { el.textContent = f(to); return; }
      var o = { v: 0 }; gsap.to(o, { v: to, duration: .9, ease: 'power3.out', onUpdate: function () { el.textContent = f(o.v); }, onComplete: function () { el.textContent = f(to); } });
    });
  };
  C.drawCharts = function () {
    $$('.chart[data-chart]').forEach(function (el) {
      var sp = C.chartSpecs[el.dataset.chart], w = Math.floor(el.clientWidth);
      if (!sp || w < 60) return;
      var r = sp(w), first = !el._drawn; el._drawn = true;
      if (typeof r === 'string') { el.innerHTML = r; el._hv = null; } else { el.innerHTML = r.svg; el._hv = r.hv; }
      if (first) C.fx(el);
    });
  };
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { C.drawCharts(); if (C.onResize) C.onResize(); }, 120); });

  // ---- dialogs ------------------------------------------------------------
  C.dialog = function (title, body, submit, cb, opt) {
    opt = opt || {};
    var d = $('#dlg');
    d.innerHTML = '<form class="dlg" data-form="dlg" aria-labelledby="dlg-t"><div class="dlg-h"><h2 id="dlg-t">' + title + '</h2><button type="button" class="ibtn" data-act="dlg-close" aria-label="Close">' + C.ic('x', 16) + '</button></div><div class="dlg-body">' + body + '</div><div class="dlg-foot"><button type="button" class="btn ghost" data-act="dlg-close">Cancel</button><button class="btn pri">' + submit + '</button></div></form>';
    C._dcb = cb; d.showModal();
    if (C.motion()) gsap.fromTo($('.dlg', d), { opacity: 0, y: 10, scale: .985 }, { opacity: 1, y: 0, scale: 1, duration: .26, ease: 'power3.out' });
    var f = d.querySelector('input,select,textarea'); if (f) f.focus();
  };
  C.forms.dlg = function (f) { var d = $('#dlg'); if (C._dcb && C._dcb(new FormData(f), f) === false) return; d.close(); };
  C.acts['dlg-close'] = function () { $('#dlg').close(); };

  // ---- command palette ----------------------------------------------------
  var PAGES = [['Dashboard', 'dashboard', 'dash', 'g d', 'overview kpi charts'], ['Lead inbox', 'inbox', 'inbox', 'g i', 'leads table'], ['Pipeline', 'pipeline', 'pipe', 'g p', 'kanban stages board'], ['Tasks', 'tasks', 'tasks', 'g t', 'follow-ups todo'], ['Chatbot manager', 'bot', 'bot', 'g b', 'flow editor transcripts'], ['UTM builder', 'utm', 'link', 'g u', 'campaign links tracking'], ['Integrations', 'integrations', 'plug', 'g n', 'search console meta ads']];
  var palSel = 0, palItems = [];
  function palBuild(q) {
    q = q.trim().toLowerCase(); var terms = q.split(/\s+/).filter(Boolean), out = [];
    var hit = function (s) { s = s.toLowerCase(); return terms.every(function (t) { return s.indexOf(t) > -1; }); };
    var pages = PAGES.filter(function (p) { return hit(p[0] + ' ' + p[4]); }).map(function (p) { return { g: 'Go to', ic: p[2], label: p[0], key: p[3], run: function () { location.hash = '#/' + p[1]; } }; });
    var acts = [
      { g: 'Actions', ic: 'plus', label: 'New lead', key: 'c', run: function () { C.acts['new-lead'](); } },
      { g: 'Actions', ic: 'play', label: 'Test the chatbot', key: '', kw: 'bot chat preview', run: function () { C.ui.botTab = 'flow'; C.ui.botSide = 'test'; C.ui.test = null; if (C.cur.name === 'bot') C.route(false, true); else location.hash = '#/bot'; } },
      { g: 'Actions', ic: 'link', label: 'Build a UTM link', key: '', kw: 'campaign tag', run: function () { location.hash = '#/utm'; } },
      { g: 'Actions', ic: 'search', label: 'Open Search Console panel', key: '', kw: 'google gsc', run: function () { C.ui.itab = 'gsc'; if (C.cur.name === 'integrations') C.route(false, true); else location.hash = '#/integrations'; } },
      { g: 'Actions', ic: 'mega', label: 'Open Meta Ads panel', key: '', kw: 'facebook capi', run: function () { C.ui.itab = 'meta'; if (C.cur.name === 'integrations') C.route(false, true); else location.hash = '#/integrations'; } },
      { g: 'Actions', ic: 'side', label: 'Toggle sidebar', key: '[', run: function () { C.acts['side-toggle'](); } },
      { g: 'Actions', ic: 'key', label: 'Keyboard shortcuts', key: '?', run: function () { C.acts.help(); } },
      { g: 'Actions', ic: 'refresh', label: 'Reset demo data', key: '', kw: 'restore seed', run: function () { C.acts.reset(); } }
    ].filter(function (a) { return hit(a.label + ' ' + (a.kw || '')); });
    var L = S.leads.slice().sort(function (a, b) { return b.created - a.created; });
    if (terms.length) L = L.filter(function (l) { return hit(l.name + ' ' + l.id + ' ' + l.service + ' ' + l.loc + ' ' + l.phone + ' ' + C.SOURCES[l.source].label + ' ' + l.status); }); else L = L.slice(0, 4);
    var leads = L.slice(0, 6).map(function (l) { return { g: terms.length ? 'Leads' : 'Recent leads', av: l.name, label: l.name, sub: l.id + ' · ' + l.service + ' · ' + C.stageLabel(l.status), run: function () { location.hash = '#/' + (C.cur.name === 'bot' || C.cur.name === 'utm' ? 'inbox' : C.cur.name) + '/' + l.id; } }; });
    return out.concat(terms.length ? leads.concat(pages, acts) : pages.concat(acts, leads));
  }
  function palPaint() {
    var q = $('#pal-q').value; palItems = palBuild(q); palSel = Math.min(palSel, Math.max(0, palItems.length - 1));
    var h = '', last = '';
    palItems.forEach(function (it, i) {
      if (it.g !== last) { h += '<li class="pal-g" role="presentation">' + it.g + '</li>'; last = it.g; }
      h += '<li role="option" id="pal-o' + i + '" class="pal-i' + (i === palSel ? ' on' : '') + '" data-i="' + i + '" aria-selected="' + (i === palSel) + '">' + (it.av ? C.avatar(it.av, 22) : '<span class="pal-ic">' + C.ic(it.ic, 15) + '</span>') + '<span class="pal-l">' + esc(it.label) + (it.sub ? '<small>' + esc(it.sub) + '</small>' : '') + '</span>' + (it.key ? '<kbd>' + it.key.split(' ').map(esc).join('</kbd><kbd>') + '</kbd>' : '') + '</li>';
    });
    $('#pal-list').innerHTML = h || '<li class="pal-empty">No matches. Try a lead name, a page, or “UTM”.</li>';
    $('#pal-q').setAttribute('aria-activedescendant', palItems.length ? 'pal-o' + palSel : '');
    var on = $('.pal-i.on'); if (on) on.scrollIntoView({ block: 'nearest' });
  }
  function palRun(i) { var it = palItems[i]; if (!it) return; $('#pal').close(); setTimeout(it.run, 20); }
  C.acts.palette = function () {
    var d = $('#pal'); if (d.open) return;
    d.innerHTML = '<div class="pal-box"><div class="pal-top">' + C.ic('search', 16) + '<input id="pal-q" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-autocomplete="list" placeholder="Search leads, jump to a page, run an action…" autocomplete="off" spellcheck="false"><kbd>esc</kbd></div><ul id="pal-list" role="listbox" aria-label="Results"></ul><div class="pal-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span></div></div>';
    palSel = 0; d.showModal(); palPaint();
    if (C.motion()) gsap.fromTo($('.pal-box', d), { opacity: 0, y: -8, scale: .985 }, { opacity: 1, y: 0, scale: 1, duration: .22, ease: 'power3.out' });
    $('#pal-q').focus();
  };
  document.addEventListener('input', function (e) { if (e.target.id === 'pal-q') { palSel = 0; palPaint(); } });
  document.addEventListener('keydown', function (e) {
    if (e.target.id !== 'pal-q') return;
    if (e.key === 'ArrowDown') { palSel = (palSel + 1) % Math.max(1, palItems.length); palPaint(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { palSel = (palSel - 1 + palItems.length) % Math.max(1, palItems.length); palPaint(); e.preventDefault(); }
    else if (e.key === 'Enter') { palRun(palSel); e.preventDefault(); }
  });
  document.addEventListener('mousemove', function (e) { var li = e.target.closest && e.target.closest('.pal-i'); if (li && +li.dataset.i !== palSel) { palSel = +li.dataset.i; $$('.pal-i').forEach(function (n, k) { n.classList.toggle('on', +n.dataset.i === palSel); n.setAttribute('aria-selected', +n.dataset.i === palSel); }); } });
  C.acts.help = function () {
    var rows = [['Command palette', C.mod + ' K'], ['Search', '/'], ['New lead', 'C'], ['Toggle sidebar', '['], ['Go to dashboard', 'G D'], ['Go to inbox', 'G I'], ['Go to pipeline', 'G P'], ['Go to tasks', 'G T'], ['Go to chatbot manager', 'G B'], ['Go to UTM builder', 'G U'], ['Go to integrations', 'G N'], ['Next / previous lead in inbox', 'J / K'], ['Move a pipeline card', '⇧ ← →'], ['Close drawer or dialog', 'Esc']];
    var d = $('#help'); d.innerHTML = '<div class="dlg"><div class="dlg-h"><h2>Keyboard shortcuts</h2><button type="button" class="ibtn" data-act="help-close" aria-label="Close">' + C.ic('x', 16) + '</button></div><div class="dlg-body"><ul class="kb">' + rows.map(function (r) { return '<li><span>' + r[0] + '</span><span>' + r[1].split(' ').map(function (k) { return k === '/' && r[1].indexOf(' / ') > -1 ? '<em>or</em>' : '<kbd>' + esc(k) + '</kbd>'; }).join('') + '</span></li>'; }).join('') + '</ul></div></div>';
    d.showModal();
  };
  C.acts['help-close'] = function () { $('#help').close(); };
  C.acts['side-toggle'] = function () {
    if (innerWidth <= 900) { C.acts.menu(); return; }
    P.side = !P.side; document.body.classList.toggle('side-off', P.side); C.savePrefs();
    $('#side-t').setAttribute('aria-expanded', String(!P.side)); setTimeout(function () { C.drawCharts(); if (C.onResize) C.onResize(); }, 260);
  };

  // ---- shortcuts ----------------------------------------------------------
  var chord = 0;
  document.addEventListener('keydown', function (e) {
    var t = e.target, typing = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if ($('#pal').open) $('#pal').close(); else C.acts.palette(); return; }
    if (e.key === 'Escape') {
      if (document.body.classList.contains('nav-open')) { C.acts.menu(); return; }
      if (!document.querySelector('dialog[open]') && C.cur && C.cur.lead) { C.closeDrawer(); }
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('dialog[open]')) return;
    var k = e.key;
    if (chord && Date.now() - chord < 1000) {
      var m = { d: 'dashboard', i: 'inbox', p: 'pipeline', t: 'tasks', b: 'bot', u: 'utm', n: 'integrations' }[k.toLowerCase()]; chord = 0;
      if (m) { location.hash = '#/' + m; e.preventDefault(); return; }
    }
    if (k === 'g') { chord = Date.now(); return; }
    if (k === '/') { e.preventDefault(); C.acts.palette(); }
    else if (k === 'c') { e.preventDefault(); C.acts['new-lead'](); }
    else if (k === '[') C.acts['side-toggle']();
    else if (k === '?') C.acts.help();
  });

  // ---- global events ------------------------------------------------------
  document.addEventListener('click', function (e) {
    var t = e.target;
    var el = t.closest('[data-act]'); if (el && C.acts[el.dataset.act]) C.acts[el.dataset.act](el, e);
    if ((t.id === 'dlg' || t.id === 'pal' || t.id === 'help') && t.close) t.close();
    var tr = t.closest('tr[data-href]'); if (tr && !t.closest('a,button,input,select,label')) { C._opener = tr; location.hash = tr.dataset.href; }
    if (t.id === 'scrim') C.acts.menu();
  });
  document.addEventListener('input', function (e) { var el = e.target.closest('[data-in]'); if (el && C.ins[el.dataset.in]) C.ins[el.dataset.in](el, e); });
  document.addEventListener('change', function (e) { var el = e.target.closest('[data-ch]'); if (el && C.chs[el.dataset.ch]) C.chs[el.dataset.ch](el, e); });
  document.addEventListener('submit', function (e) { var f = e.target.closest('[data-form]'); if (f && C.forms[f.dataset.form]) { e.preventDefault(); C.forms[f.dataset.form](f, e); } });
  document.addEventListener('keydown', function (e) {
    var tab = e.target.closest && e.target.closest('[role="tab"]');
    if (tab && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      var tabs = $$('[role="tab"]', tab.parentNode), i = tabs.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : -1);
      tabs[(i + tabs.length) % tabs.length].click(); e.preventDefault();
    }
  });
  C.acts.menu = function () {
    var open = document.body.classList.toggle('nav-open'); $('#menu').setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { var a = $('.nav a[aria-current]') || $('.nav a'); a && a.focus(); }
  };
  C.acts.reset = function () {
    try { localStorage.removeItem(KEY); } catch (e) { }
    S = C.seed(); save(); C.ui = {}; if (C.cur && C.cur.lead) location.hash = '#/' + C.cur.name; C.route(false, true); C.toast('Demo data reset', { icon: 'refresh' });
  };
  C.acts.tab = function (el) { C.ui[el.dataset.k] = el.dataset.v; C.rerender(true); var t = $('[role="tab"][aria-selected="true"]'); if (t) t.focus(); };

  // ---- router -------------------------------------------------------------
  C.badges = function () {
    var n = S.leads.filter(function (l) { return l.status === 'new'; }).length, open = S.leads.filter(function (l) { return l.status !== 'won' && l.status !== 'lost'; }).length;
    var end = C.dayStart() + 864e5, d = S.tasks.filter(function (t) { return !t.done && t.due < end; }).length;
    $$('[data-badge]').forEach(function (b) { var v = { inbox: n, tasks: d, pipeline: open }[b.dataset.badge]; b.textContent = v; b.hidden = !v; });
  };
  function paintView(v, anim, focus) {
    var main = $('#view'); main.innerHTML = v.render();
    if (v.mount) v.mount();
    C.drawCharts(); C.badges(); C.countUp(main);
    if (anim && C.motion()) gsap.fromTo(main.children, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .34, ease: 'power2.out', stagger: .04, clearProps: 'opacity,transform' });
    if (focus) { main.focus({ preventScroll: true }); main.scrollTop = 0; }
  }
  C.route = function (focusMain, force) {
    var parts = location.hash.replace(/^#\/?/, '').split('/'), name = parts[0] || 'dashboard';
    var arg = parts[1] ? decodeURIComponent(parts[1]) : null;
    if (name === 'lead' && arg) { history.replaceState(null, '', '#/inbox/' + arg); name = 'inbox'; }
    if (!C.views[name]) name = 'dashboard';
    var lead = arg && /^L-\d+$/.test(arg) && C.lead(arg) ? arg : null;
    var changed = !C.cur || C.cur.name !== name || force;
    C.cur = { name: name, lead: lead };
    document.title = C.views[name].title() + ' · Lumen CRM (design sample)';
    $$('.nav a').forEach(function (a) { if (a.dataset.nav === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $('#crumb').textContent = C.views[name].title();
    document.body.classList.remove('nav-open'); $('#menu').setAttribute('aria-expanded', 'false');
    if (changed) { C.noFx = false; tipHide(); paintView(C.views[name], !force || focusMain, focusMain); }
    C.syncDrawer(lead);
  };
  C.rerender = function (fx) {
    var main = $('#view'), y = main.scrollTop; C.noFx = !fx; var v = C.views[C.cur.name]; main.innerHTML = v.render(); if (v.mount) v.mount();
    C.drawCharts(); C.badges(); C.countUp(main);
    if (fx && C.motion()) gsap.from('#panel > *', { opacity: 0, y: 8, duration: .3, stagger: .04, ease: 'power2.out', clearProps: 'opacity,transform' });
    C.noFx = false; main.scrollTop = y;
  };
  window.addEventListener('hashchange', function () { C.route(true); });

  // ---- boot ---------------------------------------------------------------
  C.boot = function () {
    S = load(); save();
    try { var p = JSON.parse(localStorage.getItem(PKEY)); if (p && typeof p === 'object') P = { side: !!p.side, views: Array.isArray(p.views) ? p.views : [] }; } catch (e) { }
    if (P.side && innerWidth > 900) document.body.classList.add('side-off');
    $('#side-t').setAttribute('aria-expanded', String(!P.side));
    $('#kmod').textContent = C.mod + ' K';
    var dh = function () { var d = $('.demo'); if (d) document.documentElement.style.setProperty('--demo-h', d.offsetHeight + 'px'); };
    dh(); setTimeout(dh, 120); window.addEventListener('resize', dh);
    C.route(false);
    if (C.motion()) {
      gsap.from('.side .nav a', { opacity: 0, x: -8, duration: .4, stagger: .035, ease: 'power2.out', delay: .05 });
      gsap.from('.top', { opacity: 0, y: -6, duration: .4, ease: 'power2.out' });
    }
  };
})();
