/* Ghatika back office (staff.html): the Today queue, orders through the atelier, boutique viewings,
   the service bench, the warranty register and the concierge inbox. Runs in the browser: it reads and writes
   the shared Ghatika collections in localStorage through window.GH (app.js) and the Orbit chat engine. */
(function () {
  'use strict';
  var D = window.GH_DATA, G = window.GH;
  if (!D || !G) return;
  var $ = G.$, $$ = G.$$, esc = G.esc, inr = G.inr;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ME = 'Kavya Paliwal', STAFF = D.STAFF;
  var MIN = 6e4, HOUR = 36e5, DAY = 864e5;
  var main = $('#main'), scroller = $('#scroller'), liveEl = $('#live');
  var isMac = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || '');
  var mobile = matchMedia('(max-width: 900px)');

  // ------------------------------------------------------------------ icons
  var P = {
    today: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    orders: '<path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z"/><path d="M4 8.5 12 13l8-4.5M12 13v7"/>',
    appointments: '<rect x="4" y="5.5" width="16" height="14.5" rx="1.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    service: '<circle cx="10" cy="10" r="5.5"/><path d="m14 14 6 6M10 7.5V10h2"/>',
    warranty: '<path d="M12 3.5 19 6v5.5c0 4.2-3 7.4-7 9-4-1.6-7-4.8-7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    left: '<path d="M14.5 6l-6 6 6 6"/>', right: '<path d="M9.5 6l6 6-6 6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    note: '<path d="M6 4.5h12v15H6z"/><path d="M9 9h6M9 12.5h6M9 16h3"/>',
    download: '<path d="M12 4.5v11M7 11l5 5 5-5M5 19.5h14"/>',
    grip: '<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
    bag: '<path d="M5.5 8.5h13l-1 11h-11z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>',
    think: '<path d="M12 4a6 6 0 0 0-3.4 11V18h6.8v-3A6 6 0 0 0 12 4z"/><path d="M10 21h4"/>',
    noshow: '<circle cx="10" cy="8.5" r="3.5"/><path d="M3.5 19.5c.8-3.4 3.4-5.5 6.5-5.5 1.3 0 2.5.3 3.5 1M16 15l5 5M21 15l-5 5"/>',
    resched: '<rect x="4" y="5.5" width="16" height="14.5" rx="1.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4M9 15h6M13 13l2 2-2 2"/>',
    cancel: '<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',
    bell: '<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2h-14z"/><path d="M10 20.5h4"/>',
    truck: '<path d="M3.5 6.5h10v10h-10zM13.5 10h4l3 3.5v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    pay: '<rect x="3.5" y="6" width="17" height="12" rx="1.5"/><path d="M3.5 10h17M7 14.5h4"/>',
    bench: '<path d="M4 19.5h16M6 19.5v-6h12v6M9 13.5V9l3-4.5L15 9v4.5"/>',
    print: '<path d="M7 9V4.5h10V9M7 16.5H4.5V9h15v7.5H17"/><path d="M7 13.5h10v6H7z"/>',
    flag: '<path d="M5.5 20.5v-16M5.5 4.5h11l-2 4 2 4h-11"/>',
    user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 19.5c1-3.6 3.8-5.5 7-5.5s6 1.9 7 5.5"/>',
    reset: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4"/>',
    ext: '<path d="M14 4.5h5.5V10M19.5 4.5 11 13M17 14v5.5H4.5V7H10"/>',
    columns: '<rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="M9.5 5v14M14.5 5v14"/>',
    views: '<path d="M4 6.5h16M7 12h10M10 17.5h4"/>',
    kbd: '<rect x="3" y="6.5" width="18" height="11" rx="1.5"/><path d="M7 10h1M10.5 10h1M14 10h1M17 10h.5M7.5 14h9"/>',
    spark: '<path d="M12 3.5l1.8 6.7 6.7 1.8-6.7 1.8L12 20.5l-1.8-6.7L3.5 12l6.7-1.8z"/>',
    send: '<path d="M20.5 3.5 10 14M20.5 3.5l-6.5 17-4-6.5-6.5-4z"/>',
    loupe: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5M8.5 11h5"/>'
  };
  function ic(n, cls) { return '<svg viewBox="0 0 24 24" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '>' + (P[n] || '') + '</svg>'; }

  // ------------------------------------------------------------------ data
  var NAMES = ['orders', 'appts', 'service', 'warranty'];
  var DB = {};
  NAMES.forEach(function (n) { DB[n] = G.db(n) || []; });
  DB.enquiries = G.store.get('enquiries', []) || [];
  var SEEDIDS = {};
  try { var s0 = D.seed(); NAMES.forEach(function (n) { s0[n].forEach(function (x) { SEEDIDS[x.id] = 1; }); }); } catch (e) { /* ids only */ }
  function fromChat(x) { return x.source === 'chat' || x.src === 'chat'; }
  function fromWeb(x) { return !fromChat(x) && (x.src === 'web' || x.source === 'web' || (!SEEDIDS[x.id] && x.src !== 'staff')); }
  function nm(r) { return r ? r.customer || r.name || '' : ''; }
  function save(n) { G.store.set(n, DB[n]); counts(); }
  function byId(n, id) { var a = DB[n]; for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function coll(id) { return /^GH-O-/.test(id) ? 'orders' : /^GH-A-/.test(id) ? 'appts' : /^GH-S-/.test(id) ? 'service' : /^GH-W-/.test(id) ? 'warranty' : /^GH-E-/.test(id) ? 'enquiries' : null; }
  function nextNum(n, base) { var m = base; DB[n].forEach(function (x) { var k = +String(x.id).split('-').pop(); if (k >= m) m = k + 1; }); return m; }

  var LOG = G.store.get('staff-log', []);
  if (!Array.isArray(LOG)) LOG = [];
  function log(t, ref, i) { LOG.unshift({ at: new Date().toISOString(), by: ME, t: t, ref: ref || '', i: i || 'check' }); if (LOG.length > 80) LOG.length = 80; G.store.set('staff-log', LOG); }

  var CTX = G.store.get('staff-ctx', 'all');
  function inCtx(list) { return CTX === 'all' ? list : list.filter(function (x) { return x.boutique === CTX; }); }

  // ------------------------------------------------------------------ vocab
  var OST = ['new', 'paid', 'atelier', 'qc', 'dispatched', 'delivered'];
  var OL = { 'new': 'Awaiting payment', paid: 'Paid', atelier: 'In atelier', qc: 'QC', dispatched: 'Dispatched', delivered: 'Delivered' };
  var ONEXT = { 'new': 'Confirm payment', paid: 'Send to the bench', atelier: 'Move to QC', qc: 'Mark dispatched', dispatched: 'Mark delivered' };
  var OTL = [['paid', 'Paid', 'Payment confirmed', 0], ['atelier', 'In atelier', '38-day build at one bench', 1], ['qc', 'QC', '72-hour run on the winding machine', 39], ['dispatched', 'Dispatched', 'Insured courier, signature on delivery', 42], ['delivered', 'Delivered', 'On the wrist; warranty clock starts', 44]];
  var AST = ['requested', 'confirmed', 'visited', 'no-show', 'cancelled'];
  var AL = { requested: 'Requested', confirmed: 'Confirmed', visited: 'Visited', 'no-show': 'No-show', cancelled: 'Cancelled' };
  var SST = ['received', 'diagnosis', 'quote', 'approved', 'service', 'qc', 'ready', 'returned'];
  var SL = { received: 'Received', diagnosis: 'Diagnosis', quote: 'Quote', approved: 'Approved', service: 'On the bench', qc: 'QC', ready: 'Ready', returned: 'Returned' };
  var SD = { received: 'Logged, photographed, sealed in a pouch', diagnosis: 'Timegrapher in five positions', quote: 'Priced and waiting on the client', approved: 'Parts called from the atelier', service: 'Strip, clean, oil, regulate', qc: 'Pressure test and a 72-hour run', ready: 'Boxed for collection or courier', returned: 'Back on the wrist' };
  var SNEXT = { received: 'Start diagnosis', diagnosis: 'Write the quote', quote: 'Client approved', approved: 'Put on the bench', service: 'Send to QC', qc: 'Passed QC', ready: 'Mark returned' };
  var SVOID = { received: 'Nothing waiting at intake.', diagnosis: 'No watches on the timegrapher.', quote: 'No quotes waiting on clients.', approved: 'Nothing approved and waiting for parts.', service: 'No watches on the bench right now.', qc: 'No service tickets in QC. The bench is clear.', ready: 'Nothing boxed and waiting to go home.', returned: 'No watches handed back yet.' };
  var WL = { pending: 'To verify', verified: 'Verified', query: 'Invoice requested' };
  var CLOSED = { udaipur: [1], mumbai: [0], delhi: [1], bengaluru: [0] };
  var DAYN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var ISSUE_LINE = { 'Full service': 'Full service: strip, clean, oil, regulate', 'Running slow': 'Demagnetise and regulate in five positions', 'Moisture under crystal': 'Dry the movement, new gaskets, pressure test', 'Crown stiff': 'New crown tube and stem, lubricate keyless works', 'Strap replacement': 'Replacement strap, fitted with new spring bars', 'Polish and pressure test': 'Case refinish by hand and pressure test' };

  // ------------------------------------------------------------------ helpers
  function M(id) { return D.MODELS[id] || D.MODELS.prahar; }
  function opt(list, id) { return D[list].filter(function (x) { return x.id === id; })[0] || D[list][0]; }
  function bq(id) { return D.BOUTIQUES.filter(function (b) { return b.id === id; })[0] || D.BOUTIQUES[0]; }
  function bqName(id) { var b = bq(id); return b.name + ', ' + b.city; }
  function money(n) { return n >= 1e7 ? '₹' + (n / 1e7).toFixed(2) + ' Cr' : G.lakh(n); }
  function first(n) { return String(n || '').split(' ')[0]; }
  function initials(n) { return String(n || '?').split(' ').map(function (p) { return p.charAt(0); }).join('').slice(0, 2).toUpperCase(); }
  function av(n) { var i = STAFF.indexOf(n); return '<span class="av" data-p="' + (i < 0 ? 0 : i) + '" title="' + esc(n) + '" aria-hidden="true">' + initials(n) + '</span>'; }
  function T(iso) { return new Date(iso).getTime(); }
  function sod(t) { var d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function dayDiff(t) { return Math.round((sod(t) - sod(Date.now())) / DAY); }
  function hm(t) { var d = new Date(t); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function dshort(t) { return new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
  function dlong(t) { return new Date(t).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); }
  function dfull(t) { return new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); }
  function isoDate(t) { var d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function rel(t) {
    var d = t - Date.now(), a = Math.abs(d), dd = dayDiff(t);
    if (a < MIN) return 'just now';
    if (d > 0) { if (a < HOUR) return 'in ' + Math.round(a / MIN) + ' min'; if (dd === 0) return 'in ' + Math.round(a / HOUR) + ' h'; if (dd === 1) return 'tomorrow ' + hm(t); return 'in ' + dd + ' d'; }
    if (a < HOUR) return Math.round(a / MIN) + ' min ago'; if (dd === 0) return Math.round(a / HOUR) + ' h ago'; if (dd === -1) return 'yesterday'; return (-dd) + ' d ago';
  }
  function ago(t) { return t > Date.now() ? 'today' : rel(t); }
  function tc(cls, txt, icon) { return '<span class="tc ' + (cls || '') + '">' + (icon === false ? '' : ic(icon || 'clock')) + esc(txt) + '</span>'; }
  function timeChip(t) {
    var d = t - Date.now();
    if (d < -30 * MIN) return tc('over', dayDiff(t) < 0 ? 'overdue ' + (-dayDiff(t)) + ' d' : 'started ' + rel(t));
    if (d < 0) return tc('soon', 'started ' + rel(t));
    if (d < 2 * HOUR) return tc('soon', rel(t));
    return tc('', rel(t));
  }
  function dueChip(r) {
    if (r.stage === 'ready' || r.stage === 'returned') return '';
    var t = T(r.due), dd = dayDiff(t);
    if (dd < 0) return tc('over', 'overdue ' + (-dd) + ' d');
    if (dd === 0) return tc(t < Date.now() ? 'over' : 'soon', t < Date.now() ? 'overdue today' : 'due today');
    if (dd <= 2) return tc('soon', 'due in ' + dd + ' d');
    return tc('', 'due ' + dshort(t));
  }
  function overdue(r) { return r.stage !== 'ready' && r.stage !== 'returned' && T(r.due) < Date.now(); }
  function st(s, label) { return '<span class="st" data-s="' + esc(s) + '">' + esc(label) + '</span>'; }
  function webChip(x) { return fromChat(x) ? tc('chat', 'from chat', 'chat') + (x.convo ? '<a class="tlink" href="#inbox?c=' + encodeURIComponent(x.convo) + '">Transcript</a>' : '') : fromWeb(x) ? tc('web', 'from website', false) : ''; }
  function dialC(id) { return opt('DIALS', id).c; }
  function obj(model, dial, extra) { return '<span class="obj"><i style="--c:' + dialC(dial || M(model).sig.dial) + '"></i>' + esc(M(model).name) + (extra ? ' <small>' + esc(extra) + '</small>' : '') + '</span>'; }
  function watchSvg(cfg, cls) {
    var m = M(cfg.model), dial = dialC(cfg.dial || m.sig.dial), metal = opt('METALS', cfg.metal || m.sig.metal).c, strap = opt('STRAPS', cfg.strap || m.sig.strap).c;
    var light = (cfg.dial || m.sig.dial) === 'ivory' || (cfg.dial || m.sig.dial) === 'sandstone', hand = light ? '#151517' : '#efe8dc';
    var ticks = ''; for (var i = 0; i < 12; i++) ticks += '<rect x="23.5" y="12.4" width="1" height="' + (i % 3 ? 1.6 : 2.6) + '" fill="' + hand + '" opacity=".75" transform="rotate(' + (i * 30) + ' 24 24)"/>';
    return '<svg class="wg ' + (cls || '') + '" viewBox="0 0 48 48" aria-hidden="true"><rect x="16.5" y="0" width="15" height="11" rx="2" fill="' + strap + '"/><rect x="16.5" y="37" width="15" height="11" rx="2" fill="' + strap + '"/><circle cx="24" cy="24" r="15.6" fill="' + metal + '"/><rect x="38.6" y="21.8" width="3.6" height="4.4" rx="1" fill="' + metal + '"/><circle cx="24" cy="24" r="12.8" fill="' + dial + '"/><circle cx="24" cy="24" r="8.6" fill="none" stroke="' + hand + '" stroke-opacity=".14" stroke-width=".5"/><circle cx="24" cy="24" r="5.4" fill="none" stroke="' + hand + '" stroke-opacity=".12" stroke-width=".5"/>' + ticks + '<path d="M24 24 23.4 15.2h1.2z" fill="' + hand + '"/><path d="M24 24l6.4 3.4" stroke="' + hand + '" stroke-width="1.5" stroke-linecap="round"/><circle cx="24" cy="24" r="1.3" fill="#c9a25a"/></svg>';
  }
  function ensureNotes(r) {
    if (!Array.isArray(r.notes)) r.notes = r.note ? [{ at: r.at && T(r.at) < Date.now() ? r.at : r.registered || new Date(Date.now() - 2 * DAY).toISOString(), by: fromChat(r) ? 'Concierge' : r.owner || r.host || r.tech || 'Front desk', t: r.note }] : [];
    return r.notes;
  }
  function addNote(r, t) { if (!t) return; ensureNotes(r).push({ at: new Date().toISOString(), by: ME, t: t }); r.note = t; }
  function lastNote(r) { var n = ensureNotes(r); return n.length ? n[n.length - 1] : null; }
  function say(m) { liveEl.textContent = ''; setTimeout(function () { liveEl.textContent = m; }, 30); }
  function cssq(s) { return String(s).replace(/["\\]/g, '\\$&'); }
  function keepFocus(fn) {
    var a = document.activeElement, k = a && a.getAttribute && a.getAttribute('data-k');
    fn();
    if (k && (!document.activeElement || document.activeElement === document.body || !document.contains(a))) { var n = document.querySelector('[data-k="' + cssq(k) + '"]'); if (n) n.focus({ preventScroll: true }); }
  }
  function match(hay, q) { return q.split(/\s+/).filter(Boolean).every(function (t) { return hay.indexOf(t) > -1; }); }
  function spark(vals) {
    var w = 64, h = 22, mx = Math.max.apply(null, vals.concat([1])), n = vals.length - 1;
    var pts = vals.map(function (v, i) { return (i / n * w).toFixed(1) + ',' + (h - 2 - v / mx * (h - 5)).toFixed(1); });
    return '<svg class="spk" viewBox="0 0 64 22" aria-hidden="true" preserveAspectRatio="none"><path class="area" d="M0,' + h + ' L' + pts.join(' L') + ' L' + w + ',' + h + 'Z"/><polyline points="' + pts.join(' ') + '"/></svg>';
  }
  function series(list, key) { var out = [], t0 = sod(Date.now()); for (var i = 13; i >= 0; i--) { var a = t0 - i * DAY, b = a + DAY; out.push(list.filter(function (x) { var t = T(x[key]); return t >= a && t < b; }).length); } return out; }

  // change records with an undo in the toast
  function change(n, ids, fn, msg, onUndo) {
    var snap = ids.map(function (id) { return JSON.stringify(byId(n, id)); }), logLen = LOG.length;
    ids.forEach(function (id) { var r = byId(n, id); if (r) fn(r); });
    save(n); refresh();
    if (msg) {
      say(msg);
      G.toast(msg, function () {
        ids.forEach(function (id, i) { var r = byId(n, id); if (!r || snap[i] === 'null') return; var o = JSON.parse(snap[i]); Object.keys(r).forEach(function (k) { delete r[k]; }); Object.assign(r, o); });
        var added = LOG.length - logLen; if (added > 0) { LOG.splice(0, added); G.store.set('staff-log', LOG); }
        save(n); if (onUndo) onUndo(); refresh(); say('Undone.');
      });
    }
  }

  // ------------------------------------------------------------------ Today queue
  var Q = null, FNOTE = {}, PEND = {};
  function buildQueue() {
    var now = Date.now(), t0 = sod(now), t1 = t0 + DAY, jobs = [];
    var ap = inCtx(DB.appts);
    ap.filter(function (a) { var t = T(a.at); return t < t1 && t >= t0 - 3 * DAY && (a.status === 'confirmed' || (a.status === 'requested' && t >= t0)); })
      .sort(function (a, b) { return T(a.at) - T(b.at); }).forEach(function (a) { jobs.push({ k: 'view', n: 'appts', id: a.id }); });
    DB.service.filter(overdue).sort(function (a, b) { return T(a.due) - T(b.due); }).forEach(function (s) { jobs.push({ k: 'late', n: 'service', id: s.id, s0: s.stage }); });
    DB.orders.filter(function (o) { return o.status === 'qc'; }).sort(function (a, b) { return T(a.at) - T(b.at); }).forEach(function (o) { jobs.push({ k: 'ship', n: 'orders', id: o.id }); });
    ap.filter(function (a) { var t = T(a.at); return a.status === 'requested' && t >= t1 && t < t1 + 4 * DAY; }).sort(function (a, b) { return T(a.at) - T(b.at); }).forEach(function (a) { jobs.push({ k: 'req', n: 'appts', id: a.id }); });
    DB.service.filter(function (s) { return (s.stage === 'quote' || s.stage === 'diagnosis') && !overdue(s); }).forEach(function (s) { jobs.push({ k: 'quote', n: 'service', id: s.id }); });
    inCtx(DB.warranty).filter(function (w) { return w.status === 'pending'; }).forEach(function (w) { jobs.push({ k: 'wty', n: 'warranty', id: w.id }); });
    DB.orders.filter(function (o) { return o.status === 'new'; }).forEach(function (o) { jobs.push({ k: 'pay', n: 'orders', id: o.id }); });
    DB.enquiries.filter(function (e) { return e.status === 'new'; }).sort(function (a, b) { return T(a.at) - T(b.at); }).forEach(function (e) { jobs.splice(Math.min(jobs.length, 2), 0, { k: 'enq', n: 'enquiries', id: e.id }); });
    jobs.forEach(function (j) { j.key = j.k + ':' + j.id; });
    Q = { jobs: jobs, i: 0, done: {}, skip: {}, ctx: CTX, last: null };
  }
  function needs(j) {
    var r = byId(j.n, j.id); if (!r) return false;
    switch (j.k) {
      case 'view': case 'req': return r.status === 'requested' || r.status === 'confirmed';
      case 'late': return r.stage === j.s0;
      case 'ship': return r.status === 'qc';
      case 'pay': return r.status === 'new';
      case 'quote': return r.stage === 'diagnosis' || r.stage === 'quote';
      case 'wty': return r.status === 'pending';
      case 'enq': return r.status === 'new';
    }
    return false;
  }
  function settled(j) { return Q.done[j.key] || Q.skip[j.key] || !needs(j); }
  function remaining() { if (!Q) buildQueue(); return Q.jobs.filter(function (j) { return !settled(j); }).length; }
  function nextOpen(from) { var n = Q.jobs.length; for (var s = 1; s <= n; s++) { var k = (from + s) % n; if (!settled(Q.jobs[k])) return k; } return -1; }

  function jobInfo(j) {
    var r = byId(j.n, j.id); if (!r) return null;
    var o = { r: r, chips: '', props: [], outcome: false };
    if (j.n === 'appts') {
      var t = T(r.at), b = bq(r.boutique);
      o.kind = j.k === 'req' ? 'Viewing request' : t < sod(Date.now()) ? 'Viewing to close' : 'Viewing today'; o.icon = 'appointments';
      o.chips = timeChip(t) + webChip(r) + (r.rescheduled ? tc('', 'rescheduled', false) : '');
      o.sub = esc(r.purpose) + ' at ' + esc(b.name + ', ' + b.city) + ' · ' + r.guests + (r.guests > 1 ? ' guests' : ' guest') + ' · interested in ' + obj(r.interest);
      o.props = [['When', dlong(t) + ', ' + hm(t)], ['Host', '<select class="fsel" data-k="fc-host" data-fc-host aria-label="Host">' + STAFF.map(function (s) { return '<option' + (s === r.host ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>'], ['Phone', esc(r.phone)], ['Ref', '<span class="mono">' + r.id + '</span>']];
      if (r.status === 'requested') o.primary = { label: 'Confirm viewing', act: 'confirm' };
      else if (t > Date.now()) { o.primary = r.reminded ? { label: 'Reminder sent ' + hm(T(r.reminded)), act: 'remind', disabled: true, why: 'Already reminded. Log the outcome once the client has left.' } : { label: 'Send day-of reminder', act: 'remind' }; o.outcome = true; o.ogh = 'After the viewing: how did it go?'; }
      else { o.primary = { label: 'Save outcome', act: 'outcome' }; o.outcome = true; o.ogh = 'How did it go?'; }
    } else if (j.n === 'orders') {
      var it = r.items[0] || {};
      o.icon = j.k === 'ship' ? 'truck' : 'pay'; o.kind = j.k === 'ship' ? 'Ready to dispatch' : 'Payment to confirm';
      o.chips = tc(j.k === 'pay' && dayDiff(T(r.at)) < -1 ? 'over' : '', 'placed ' + ago(T(r.at))) + webChip(r);
      o.sub = obj(it.model, it.dial, G.cfgLine(it)) + (it.engraving ? ' · engraved “' + esc(it.engraving) + '”' : '');
      o.props = j.k === 'ship' ? [['Total', inr(r.total)], ['Delivery', esc(r.delivery)], ['City', esc(r.city)], ['Ref', '<span class="mono">' + r.id + '</span>']] : [['Total', inr(r.total)], ['Method', esc(r.pay)], ['Owner', esc(r.owner)], ['Ref', '<span class="mono">' + r.id + '</span>']];
      o.primary = j.k === 'ship' ? { label: 'Mark dispatched', act: 'ship' } : { label: 'Confirm payment received', act: 'pay' };
      o.cfg = it;
    } else if (j.n === 'service') {
      o.icon = 'service'; o.kind = j.k === 'late' ? 'Overdue at ' + SL[r.stage] : r.stage === 'diagnosis' ? 'Quote to write' : r.sentAt ? 'Quote with the client' : 'Quote to send';
      o.chips = dueChip(r) + (r.warranty ? tc('wty', 'under warranty', false) : '');
      o.sub = obj(r.model, null, r.serial) + ' · ' + esc(r.issue) + ': ' + esc(r.detail.charAt(0).toLowerCase() + r.detail.slice(1));
      o.props = [['Quote', r.quote ? inr(r.quote) : '<span class="add">+ Add quote</span>'], ['Technician', esc(r.tech)], ['Logistics', esc(r.logistics)], ['Ref', '<span class="mono">' + r.id + '</span>']];
      if (j.k === 'late') o.primary = { label: SNEXT[r.stage] || 'Open ticket', act: r.stage === 'diagnosis' ? 'flow' : 'stage' };
      else if (r.stage === 'diagnosis') o.primary = { label: 'Write the quote', act: 'flow' };
      else if (!r.sentAt) o.primary = { label: 'Send quote · ' + inr(r.quote), act: 'sendq' };
      else o.primary = { label: 'Client approved', act: 'stage' };
      o.cfg = { model: r.model };
    } else if (j.n === 'enquiries') {
      var cf = enqCfg(r);
      o.icon = 'chat'; o.kind = 'Concierge enquiry';
      o.chips = tc(dayDiff(T(r.at)) < 0 ? 'over' : 'soon', 'asked ' + ago(T(r.at))) + webChip(r);
      o.sub = obj(cf.model, cf.dial, G.cfgLine(cf)) + ' · about ' + inr(D.price(cf));
      o.props = [['Budget', r.budget ? esc(r.budget) : '<span class="add">+ Ask</span>'], ['Wrist', r.wrist ? esc(r.wrist) : '<span class="add">+ Ask</span>'], ['Occasion', r.occasion ? esc(r.occasion) : '—'], ['Phone', esc(r.phone || 'Not given')]];
      o.primary = { label: 'Log call-back', act: 'ecall' };
      o.cfg = cf;
    } else {
      o.icon = 'warranty'; o.kind = 'Warranty to verify';
      o.chips = tc(dayDiff(T(r.registered)) < -7 ? 'over' : '', 'registered ' + rel(T(r.registered))) + webChip(r);
      o.sub = obj(r.model, null, r.serial) + ' · bought ' + dshort(T(r.bought)) + ' at ' + esc(bqName(r.boutique)) + ' · ' + r.years + '-year cover';
      o.props = [['Serial', '<span class="mono">' + esc(r.serial) + '</span>'], ['Bought', dshort(T(r.bought))], ['City', esc(r.city)], ['Ref', '<span class="mono">' + r.id + '</span>']];
      o.primary = { label: 'Verify warranty', act: 'verify' };
      o.cfg = { model: r.model };
    }
    return o;
  }

  // outcome grid, shared by the focus card and the appointment panel
  var OUT = [['bought', 'Visited · bought', 'bag'], ['thinking', 'Visited · thinking', 'think'], ['no-show', 'No-show', 'noshow'], ['rescheduled', 'Rescheduled', 'resched'], ['cancelled', 'Cancelled', 'cancel']];
  function outcomeHTML(a, heading) {
    var p = PEND[a.id] || {};
    return '<p class="og-h" id="ogh-' + a.id + '">' + esc(heading || 'How did it go?') + '</p><div class="og" role="group" aria-labelledby="ogh-' + a.id + '">' + OUT.map(function (o) {
      return '<button type="button" data-out="' + o[0] + '" data-aid="' + a.id + '" data-k="out:' + a.id + ':' + o[0] + '" aria-pressed="' + (p.o === o[0]) + '">' + ic(o[2]) + '<span>' + o[1] + '</span></button>';
    }).join('') + '</div>' + suggHTML(a, p);
  }
  function suggHTML(a, p) {
    if (!p.o) return '';
    var fu = sod(Date.now()) + 3 * DAY + 11 * HOUR;
    switch (p.o) {
      case 'bought': return '<div class="sugg"><span class="k">Next</span><span>Draft the order while the client is still in the salon.</span><button type="button" class="b sm primary" data-sugg="order" data-aid="' + a.id + '">Draft ' + esc(M(a.interest).name) + ' order</button></div>';
      case 'thinking': return '<div class="sugg"><span class="k">Next</span><span>A short note, then a follow-up call on ' + dlong(fu) + '.</span><button type="button" class="b sm" data-sugg="follow" data-aid="' + a.id + '" aria-pressed="' + (p.follow !== false) + '">' + (p.follow !== false ? ic('check') + 'Follow-up set' : 'Set follow-up') + '</button></div>';
      case 'no-show': return '<div class="sugg"><span class="k">Next</span><span>Send a reschedule link on WhatsApp.</span><button type="button" class="b sm" data-sugg="link" data-aid="' + a.id + '" aria-pressed="' + (p.link !== false) + '">' + (p.link !== false ? ic('check') + 'Link queued' : 'Queue link') + '</button></div>';
      case 'rescheduled': return '<div class="sugg"><span class="k">New time</span><label class="sr" for="rs-d-' + a.id + '">New date</label><input class="inp2 rs" type="date" id="rs-d-' + a.id + '" data-rs="date" data-aid="' + a.id + '" data-k="rsd:' + a.id + '" min="' + isoDate(Date.now()) + '" value="' + esc(p.date || '') + '"><label class="sr" for="rs-s-' + a.id + '">Slot</label><select class="inp2 rs" id="rs-s-' + a.id + '" data-rs="slot" data-aid="' + a.id + '" data-k="rss:' + a.id + '"><option value="">Slot</option>' + D.SLOTS.map(function (s) { return '<option' + (p.slot === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div>';
      case 'cancelled': return '<div class="sugg"><span class="k">Reason</span><div class="seg2">' + ['Travel plans', 'Bought elsewhere', 'Price', 'Not given'].map(function (x) { return '<button type="button" data-reason="' + x + '" data-aid="' + a.id + '" aria-pressed="' + (p.reason === x) + '">' + x + '</button>'; }).join('') + '</div></div>';
    }
    return '';
  }
  function applyOutcome(a, p, dry) { // returns an error message or ''
    if (!p || !p.o) return 'Pick how the viewing went first.';
    if (p.o === 'rescheduled') {
      if (!p.date || !p.slot) return 'Pick the new date and slot.';
      var nt = new Date(p.date + 'T' + p.slot).getTime();
      if (nt < Date.now()) return 'That time has already passed. Pick a later slot.';
      if ((CLOSED[a.boutique] || []).indexOf(new Date(nt).getDay()) > -1) return bq(a.boutique).name + ' is closed on ' + DAYN[new Date(nt).getDay()] + 's. Pick another day.';
      a.at = new Date(nt).toISOString(); a.status = 'confirmed'; a.rescheduled = (a.rescheduled || 0) + 1; a.reminded = '';
      if (!dry) log('Rescheduled ' + first(a.customer) + '’s viewing to ' + dlong(nt) + ', ' + p.slot, a.id, 'resched');
      return '';
    }
    if (p.o !== 'cancelled' && T(a.at) - Date.now() > 15 * MIN) return 'The viewing starts at ' + hm(T(a.at)) + '. Log how it went afterwards, or reschedule or cancel it now.';
    if (p.o === 'bought' || p.o === 'thinking') { a.status = 'visited'; a.outcome = p.o; }
    if (p.o === 'thinking' && p.follow !== false) a.followUp = new Date(sod(Date.now()) + 3 * DAY + 11 * HOUR).toISOString();
    if (p.o === 'no-show') { a.status = 'no-show'; if (p.link !== false) a.linkSent = new Date().toISOString(); }
    if (p.o === 'cancelled') { a.status = 'cancelled'; a.cancelReason = p.reason || 'Not given'; }
    var lbl = OUT.filter(function (x) { return x[0] === p.o; })[0][1];
    if (!dry) log(first(a.customer) + ': ' + lbl + (p.o === 'thinking' && a.followUp ? ', follow-up ' + dlong(T(a.followUp)) : ''), a.id, p.o === 'bought' ? 'bag' : 'appointments');
    return '';
  }

  // ------------------------------------------------------------------ router
  var VIEWS = {}, cur = null;
  var TITLES = { today: 'Today', confirm: 'Confirm viewings', inbox: 'Conversations', orders: 'Orders', appointments: 'Appointments', service: 'Service', warranty: 'Warranty' };
  function parseHash() { var h = decodeURIComponent((location.hash || '').slice(1)), q = h.split('?'); return { v: VIEWS[q[0]] ? q[0] : 'today', p: new URLSearchParams(q[1] || '') }; }
  function go(h) { if (location.hash === '#' + h) route(); else location.hash = h; }
  function route(firstRun) {
    var r = parseHash(), v = VIEWS[r.v], same = cur === r.v;
    if (!SO.el.hidden && !r.p.get('open')) closeSO(true);
    closePop(false);
    if (v.params) v.params(r.p);
    var paint = function () {
      cur = r.v; main.innerHTML = ''; v.mount(main); main.removeAttribute('aria-busy');
      $$('[data-nav]').forEach(function (a) { if (a.dataset.nav === r.v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
      $('#trail').innerHTML = '<span>Ghatika</span><span aria-hidden="true">/</span><b>' + TITLES[r.v] + '</b>';
      document.title = TITLES[r.v] + ' · Ghatika back office';
      paintSideViews();
      if (!firstRun && !same) { scroller.scrollTop = 0; if (mobile.matches) scrollTo(0, 0); main.focus({ preventScroll: true }); }
    };
    if (!firstRun && !same && document.startViewTransition && !reduce) document.startViewTransition(paint); else paint();
    var open = r.p.get('open'); if (open && coll(open)) setTimeout(function () { openRecord(open); }, firstRun ? 0 : 60);
  }
  function syncHash(v, params) { var qs = params ? new URLSearchParams(params).toString() : ''; try { history.replaceState(null, '', '#' + v + (qs ? '?' + qs : '')); } catch (e) {} }
  function refresh() { keepFocus(function () { if (cur && VIEWS[cur].paint) VIEWS[cur].paint(); paintSO(); paintSideViews(); }); }

  function counts() {
    var t0 = sod(Date.now());
    var c = {
      today: remaining(),
      orders: DB.orders.filter(function (o) { return o.status === 'new' || o.status === 'qc'; }).length,
      appointments: inCtx(DB.appts).filter(function (a) { return a.status === 'requested' && T(a.at) >= t0; }).length,
      service: DB.service.filter(overdue).length,
      warranty: inCtx(DB.warranty).filter(function (w) { return w.status === 'pending'; }).length,
      confirm: inCtx(DB.appts).filter(function (a) { return a.status === 'requested' && T(a.at) >= t0; }).length,
      inbox: waitingChats()
    };
    var why = { today: ' jobs left in your queue', orders: ' orders to act on', appointments: ' viewing requests to confirm', service: ' overdue service tickets', warranty: ' warranties to verify', confirm: ' viewings to confirm', inbox: ' chats waiting for a person' };
    $$('[data-cnt]').forEach(function (el) { var k = el.dataset.cnt, n = c[k]; el.textContent = n || ''; el.title = n ? n + why[k] : ''; el.classList.toggle('hot', !!n && (k === 'today' || k === 'service' || k === 'inbox' || k === 'confirm')); });
  }

  // ================================================================== TODAY
  VIEWS.today = {
    mount: function (el) {
      if (!Q || Q.ctx !== CTX) buildQueue();
      var h = new Date().getHours(), gr = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
      el.innerHTML = '<div class="vh"><div><p class="hello">' + new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + gr + ', ' + first(ME) + '</p><h1>Today</h1><p class="sub" id="t-sub"></p></div>' +
        '<div class="vh-r"><span class="tc web">' + ic('spark') + 'Website and concierge bookings arrive here live</span></div></div>' +
        '<div class="kpis" id="t-kpis"></div>' +
        '<div class="today-grid"><section class="focus" id="focus" aria-labelledby="fc-h"></section><div class="col-r"><section class="card" id="t-queue" aria-labelledby="q-h"></section><section class="card" id="t-enq" aria-labelledby="enq-h"></section><section class="card" id="t-nn" aria-labelledby="nn-h"></section></div></div>' +
        '<div class="lower"><section class="card" id="t-att" aria-labelledby="att-h"></section><section class="card" id="t-feed" aria-labelledby="feed-h"></section></div>';
      this.paint(true);
    },
    paint: function (initial) {
      paintKpis(); paintFocus(initial); paintQueue(); paintEnq(); paintNN(); paintAtt(); paintFeed();
    }
  };
  function paintKpis() {
    var t0 = sod(Date.now()), now = Date.now();
    var ship = DB.orders.filter(function (o) { return o.status === 'qc'; });
    var views = inCtx(DB.appts).filter(function (a) { var t = T(a.at); return t >= t0 && t < t0 + DAY && a.status !== 'cancelled'; });
    var nextV = views.filter(function (a) { return T(a.at) > now && (a.status === 'confirmed' || a.status === 'requested'); }).sort(function (a, b) { return T(a.at) - T(b.at); })[0];
    var quotes = DB.service.filter(function (s) { return s.stage === 'quote'; });
    var toConf = inCtx(DB.appts).filter(function (a) { return a.status === 'requested' && T(a.at) >= t0; }).sort(function (a, b) { return T(a.at) - T(b.at); });
    var unsent = quotes.filter(function (s) { return !s.sentAt; }).length;
    var wp = inCtx(DB.warranty).filter(function (w) { return w.status === 'pending'; });
    var oldestW = wp.reduce(function (m, w) { return Math.max(m, -dayDiff(T(w.registered))); }, 0);
    var lateS = DB.service.filter(overdue), lateA = inCtx(DB.appts).filter(function (a) { return a.status === 'requested' && T(a.at) < now; });
    var over = lateS.length + lateA.length;
    var K = [
      ['orders?status=qc', 'To dispatch', ship.length, 'orders', ship.length ? ship.length + ' passed the 72-hour run' : 'Nothing waiting at QC', series(DB.orders, 'at')],
      ['confirm', 'Viewings to confirm', toConf.length, 'appointments', toConf.length ? 'Next ' + dlong(T(toConf[0].at)) + ' · ' + first(toConf[0].customer) : 'Every request has an answer', series(inCtx(DB.appts), 'at')],
      ['service?stage=quote', 'Quotes awaiting approval', quotes.length, 'service', quotes.length ? inr(quotes.reduce(function (s, x) { return s + (x.quote || 0); }, 0)) + ' on the table' + (unsent ? ' · ' + unsent + ' unsent' : '') : 'No quotes with clients', series(DB.service, 'at')],
      ['warranty?status=pending', 'Warranties to verify', wp.length, 'warranty', wp.length ? 'Serial, invoice and caseback checks' : 'Register is up to date', series(inCtx(DB.warranty), 'registered')],
      ['service?overdue=1', 'Overdue', over, 'flag', over ? lateS.length + ' on the bench · ' + lateA.length + ' viewing request' + (lateA.length === 1 ? '' : 's') : 'Nothing late. Well kept.', series(DB.service, 'due')]
    ];
    $('#t-kpis').innerHTML = K.map(function (k, i) {
      return '<button type="button" class="kpi fade-in' + (i === 4 && over ? ' over' : '') + '" data-go="' + k[0] + '" style="animation-delay:' + (i * 40) + 'ms"><span class="kl">' + k[1] + '</span><span class="kv">' + k[2] + '</span><span class="ks">' + esc(k[4]) + '</span>' + spark(k[5]) + '<span class="go" aria-hidden="true">Open →</span></button>';
    }).join('');
    var rem = remaining();
    $('#t-sub').innerHTML = rem ? '<b>' + rem + ' job' + (rem === 1 ? '' : 's') + '</b> in your queue · about ' + Math.max(4, rem * 4) + ' minutes of desk work' : 'Your queue is clear. The floor is yours.';
  }

  function paintFocus(initial) {
    var el = $('#focus'); if (!el) return;
    var total = Q.jobs.length, doneN = Q.jobs.filter(function (j) { return Q.done[j.key] || (!needs(j) && !Q.skip[j.key]); }).length, skipN = Q.jobs.filter(function (j) { return Q.skip[j.key] && needs(j); }).length;
    if (Q.i >= total || settled(Q.jobs[Q.i])) { var nx = nextOpen(Q.i < total ? Q.i : -1); if (nx > -1) Q.i = nx; else Q.i = -1; }
    var top = '<div class="fc-top">' + ring(total ? doneN / total : 1) + '<span class="k">Next up</span><span class="n">' + (Q.i > -1 ? 'Job ' + (Q.i + 1) + ' of ' + total : total + ' of ' + total + ' handled') + '</span><span class="fc-prog" role="progressbar" aria-label="Queue progress" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + doneN + '"><i style="transform:scaleX(' + (total ? doneN / total : 1).toFixed(3) + ')"></i></span><span class="fc-left">' + (Q.i > -1 ? '≈ ' + Math.max(4, remaining() * 4) + ' m left' : 'done') + '</span></div>';
    if (Q.i < 0) {
      el.innerHTML = top + '<div class="fc-done fade-in"><svg class="big" viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="33" fill="none" stroke="#c9a25a" stroke-width="1"/><circle cx="36" cy="36" r="26" fill="none" stroke="#c9a25a" stroke-opacity=".4" stroke-width=".6"/><path d="M36 36V16" stroke="#efe8dc" stroke-width="2" stroke-linecap="round"/><path d="M36 36l12 7" stroke="#efe8dc" stroke-width="2" stroke-linecap="round"/><circle cx="36" cy="36" r="2.4" fill="#c9a25a"/></svg><h2 id="fc-h">' + (total ? 'Queue clear.' : 'Nothing needs you.') + '</h2><p>' + (total ? doneN + ' handled' : 'No viewings, dispatches, quotes or warranties are waiting') + (skipN ? ', ' + skipN + ' skipped' : '') + '. Every viewing, quote and dispatch for today has an owner and a next step.</p>' + (skipN ? '<button type="button" class="b primary lg" data-fc="review">Review ' + skipN + ' skipped</button> ' : '') + '<button type="button" class="b ghost lg" data-fc="rebuild">Rebuild the queue</button></div>';
      return;
    }
    var j = Q.jobs[Q.i], o = jobInfo(j), r = o.r, ln = lastNote(r), swap = Q.last !== j.key && !initial;
    Q.last = j.key;
    var props = '<dl class="fc-props">' + o.props.map(function (p) { return '<div><dt>' + p[0] + '</dt><dd>' + p[1] + '</dd></div>'; }).join('') + '</dl>';
    var pr = o.primary, pend = PEND[r.id] || {};
    var dis = pr.disabled || (pr.act === 'outcome' && !pend.o);
    var why = pr.why || (pr.act === 'outcome' && !pend.o ? 'Pick how the viewing went to save it.' : '');
    el.innerHTML = top + '<div class="fc-body' + (swap ? ' swap' : '') + '">' +
      '<div class="fc-kind"><span class="kd">' + ic(o.icon) + esc(o.kind) + '</span>' + o.chips + '</div>' +
      '<div class="fc-head">' + watchSvg(o.cfg || (r.interest ? { model: r.interest } : { model: 'prahar' })) + '<div><h2 id="fc-h">' + esc(nm(r)) + '</h2></div></div>' +
      '<p class="fc-sub">' + o.sub + '</p>' +
      (ln ? '<div class="fc-note"><span class="k">Last note · ' + esc(first(ln.by)) + ', ' + rel(T(ln.at)) + '</span><p>' + esc(ln.t) + '</p></div>' : '<div class="fc-note none"><span class="k">Last note</span><p>No notes yet. The one you leave below lands here for the next person.</p></div>') +
      props +
      (o.outcome ? outcomeHTML(r, o.ogh) : '') +
      '<div class="fc-noteinp"><label for="fc-note">Note for the next person</label><textarea id="fc-note" data-k="fc-note" rows="1" placeholder="' + esc(j.n === 'appts' ? 'e.g. Loved the Sandstone dial in daylight; wife prefers rose gold' : j.n === 'service' ? 'e.g. Client asked for the old strap back in the box' : 'e.g. Called, prefers delivery after 6 pm') + '">' + esc(FNOTE[j.key] || '') + '</textarea></div>' +
      '<div class="fc-act"><button type="button" class="b primary" data-fc="primary"' + (dis ? ' aria-disabled="true"' : '') + ' aria-describedby="fc-why">' + esc(pr.label) + ' <span class="ar" aria-hidden="true">→</span></button><button type="button" class="b ghost" data-fc="skip">Skip</button><button type="button" class="b ghost" data-fc="save">Save &amp; next</button><button type="button" class="b ghost" data-fc="open" aria-label="Open full record">' + ic('ext') + '</button></div>' +
      '<p class="fc-why" id="fc-why" aria-live="polite">' + esc(why) + '</p></div>';
  }
  function fcWhy(m) { var w = $('#fc-why'); if (w) w.textContent = m; }
  function advance() { refresh(); var b = $('[data-fc="primary"]') || $('[data-fc="rebuild"]'); if (b && document.activeElement === document.body) b.focus({ preventScroll: true }); }
  function fcAction(kind) {
    if (kind === 'rebuild') { buildQueue(); refresh(); return; }
    if (kind === 'review') { Object.keys(Q.skip).forEach(function (k) { delete Q.skip[k]; }); Q.i = nextOpen(-1); refresh(); return; }
    var j = Q.jobs[Q.i]; if (!j) return;
    var o = jobInfo(j), r = o.r, ta = $('#fc-note'), note = ta ? ta.value.trim() : '', idx = Q.i;
    var undo = function () { delete Q.done[j.key]; Q.i = idx; FNOTE[j.key] = note; };
    if (kind === 'skip') { Q.skip[j.key] = 1; FNOTE[j.key] = note; advance(); say('Skipped. ' + remaining() + ' jobs left.'); return; }
    if (kind === 'open') { openRecord(r.id); return; }
    if (kind === 'save') {
      var p = PEND[r.id];
      if (!note && !(p && p.o)) { fcWhy(o.outcome ? 'Add a note or pick an outcome first, or press Skip to come back to it.' : 'Add a note first, or press Skip to come back to it.'); if (ta) ta.focus(); return; }
      var err = '';
      if (p && p.o) { var tmp = JSON.parse(JSON.stringify(r)); err = applyOutcome(tmp, p, true); }
      if (err) { fcWhy(err); return; }
      Q.done[j.key] = 1; delete FNOTE[j.key];
      change(j.n, [r.id], function (x) { if (p && p.o) applyOutcome(x, p); addNote(x, note); if (note) log('Note on ' + first(nm(x)) + ': “' + note + '”', x.id, 'note'); }, 'Saved for ' + first(nm(r)) + '. Next job.', undo);
      delete PEND[r.id]; advance(); return;
    }
    // primary
    var pr = o.primary;
    if (pr.disabled) { fcWhy(pr.why || ''); return; }
    if (pr.act === 'outcome' && !(PEND[r.id] && PEND[r.id].o)) { fcWhy('Pick how the viewing went to save it.'); var g = $('.og button', $('#focus')); if (g) g.focus(); return; }
    if (pr.act === 'flow') { openRecord(r.id, { flow: true }); return; }
    var msg = '', fn;
    switch (pr.act) {
      case 'confirm': fn = function (x) { x.status = 'confirmed'; log('Confirmed ' + first(x.customer) + '’s viewing, ' + dlong(T(x.at)) + ' ' + hm(T(x.at)), x.id, 'appointments'); }; msg = 'Viewing confirmed: ' + r.customer + ', ' + dlong(T(r.at)) + ' ' + hm(T(r.at)); break;
      case 'remind': fn = function (x) { x.reminded = new Date().toISOString(); log('Sent ' + first(x.customer) + ' a day-of reminder on WhatsApp', x.id, 'bell'); }; msg = 'Reminder sent to ' + first(r.customer) + ' on WhatsApp.'; break;
      case 'outcome': var pe = PEND[r.id], e2 = applyOutcome(JSON.parse(JSON.stringify(r)), pe, true); if (e2) { fcWhy(e2); return; } fn = function (x) { applyOutcome(x, pe); }; msg = 'Outcome saved for ' + first(r.customer) + '.'; delete PEND[r.id]; break;
      case 'ship': fn = function (x) { setOrderStatus(x, 'dispatched'); log('Dispatched ' + x.id + ' to ' + x.city + ' by insured courier', x.id, 'truck'); }; msg = r.id + ' marked dispatched. Courier pick-up booked.'; break;
      case 'pay': fn = function (x) { setOrderStatus(x, 'paid'); log('Payment confirmed for ' + x.id + ' (' + x.pay + ')', x.id, 'pay'); }; msg = 'Payment confirmed for ' + r.id + '. The build slot is held.'; break;
      case 'sendq': fn = function (x) { x.sentAt = new Date().toISOString(); x.sentVia = 'Email'; log('Sent quote ' + inr(x.quote) + ' to ' + first(x.customer) + ' for ' + x.id, x.id, 'send'); }; msg = 'Quote of ' + inr(r.quote) + ' sent to ' + first(r.customer) + '.'; break;
      case 'stage': var to = SST[SST.indexOf(r.stage) + 1]; fn = function (x) { setStage(x, to); }; msg = r.id + ' moved to ' + SL[to] + '.'; break;
      case 'ecall': fn = function (x) { x.status = 'called'; x.calledAt = new Date().toISOString(); x.calledBy = ME; log('Called back ' + first(x.name) + ' about the ' + M((x.interest || {}).model).name, x.id, 'phone'); }; msg = 'Call-back logged for ' + first(r.name) + '. Book the viewing from their enquiry when they’re ready.'; break;
      case 'verify': fn = function (x) { x.status = 'verified'; x.verifiedBy = ME; x.verifiedAt = new Date().toISOString(); log('Verified warranty for ' + x.serial + ' (' + first(x.customer) + ')', x.id, 'warranty'); }; msg = 'Warranty ' + r.serial + ' verified. Certificate is ready to send.'; break;
    }
    Q.done[j.key] = 1; delete FNOTE[j.key];
    change(j.n, [r.id], function (x) { fn(x); addNote(x, note); }, msg, undo);
    advance();
  }
  function paintQueue() {
    var el = $('#t-queue'); if (!el) return;
    var total = Q.jobs.length, d = Q.jobs.filter(function (j) { return Q.done[j.key] || (!needs(j) && !Q.skip[j.key]); }).length, s = Q.jobs.filter(function (j) { return Q.skip[j.key] && needs(j); }).length;
    el.innerHTML = '<div class="qhead"><h2 id="q-h">' + ic('today') + new Date().toLocaleDateString('en-IN', { weekday: 'long' }) + ' floor queue</h2><p>Owner ' + esc(first(ME)) + ' · ' + d + ' of ' + total + ' done' + (s ? ' · ' + s + ' skipped' : '') + ' · due by close, 19:30</p><div class="qmeter" aria-hidden="true"><i class="d" style="width:' + (total ? d / total * 100 : 0) + '%"></i><i class="s" style="width:' + (total ? s / total * 100 : 0) + '%"></i></div></div>' +
      (total ? '<ol class="ql">' + Q.jobs.map(function (j, i) {
        var o = jobInfo(j); if (!o) return '';
        var cls = Q.done[j.key] || (!needs(j) && !Q.skip[j.key]) ? 'done' : Q.skip[j.key] ? 'skip' : '';
        return '<li class="' + cls + '"' + (i === Q.i ? ' aria-current="true"' : '') + '><button type="button" data-qi="' + i + '" data-k="qi:' + j.key + '"><span class="qi">' + (cls === 'done' ? ic('check') : i + 1) + '</span><span><span class="qt">' + esc(nm(o.r)) + '</span><span class="qr2">' + esc(o.kind) + ' · ' + esc(o.primary.label) + '</span></span>' + (cls === 'done' ? '' : cls === 'skip' ? '<span class="tc">skipped</span>' : '') + '</button></li>';
      }).join('') + '</ol>' : '<div class="void"><p>Nothing in the queue for this boutique.</p></div>');
  }
  function paintNN() {
    var el = $('#t-nn'); if (!el) return;
    var t0 = sod(Date.now()), now = Date.now();
    var list = inCtx(DB.appts).filter(function (a) { var t = T(a.at); return t >= t0 && t < t0 + DAY; }).sort(function (a, b) { return T(a.at) - T(b.at); });
    var rows = '', placed = false;
    list.forEach(function (a) {
      var t = T(a.at);
      if (!placed && t > now) { rows += '<li class="now"><span>' + hm(now) + '</span><span></span></li>'; placed = true; }
      rows += '<li class="' + (t < now ? 'past' : '') + '"><time>' + hm(t) + '</time><span style="min-width:0"><button type="button" data-open="' + a.id + '">' + esc(a.customer) + '</button><small>' + esc(bq(a.boutique).name) + ' · ' + esc(a.purpose) + '</small></span>' + st(a.status, AL[a.status]) + '</li>';
    });
    if (list.length && !placed) rows += '<li class="now"><span>' + hm(now) + '</span><span></span></li>';
    el.innerHTML = '<div class="qhead"><h2 id="nn-h">' + ic('appointments') + 'Now and next</h2><p>' + (CTX === 'all' ? 'All four boutiques' : esc(bqName(CTX))) + ' · ' + list.length + ' viewing' + (list.length === 1 ? '' : 's') + ' today</p></div>' +
      (list.length ? '<ul class="nn">' + rows + '</ul>' : '<div class="void"><p>No viewings booked today. Walk-ins welcome; the strap wall could use a tidy.</p></div>');
  }
  function paintAtt() {
    var el = $('#t-att'); if (!el) return;
    var now = Date.now(), items = [];
    DB.service.filter(overdue).forEach(function (s) { var d = -dayDiff(T(s.due)); items.push([d + 3, s.id, s.customer, obj(s.model, null, s.serial), 'Overdue ' + (d || 'today') + (d ? ' d' : '') + ' at ' + SL[s.stage] + '. Promised back ' + dshort(T(s.due)) + '.', tc('over', d ? 'overdue ' + d + ' d' : 'today')]); });
    DB.orders.filter(function (o) { return o.status === 'new' && dayDiff(T(o.at)) <= -1; }).forEach(function (o) { var d = -dayDiff(T(o.at)); items.push([d, o.id, o.customer, obj(o.items[0].model, o.items[0].dial), 'Payment pending ' + d + ' d. Nudge, or release the build slot.', tc('soon', d + ' d')]); });
    DB.orders.filter(function (o) { return o.status === 'paid' && dayDiff(T(o.at)) <= -4; }).forEach(function (o) { var d = -dayDiff(T(o.at)); items.push([d - 2, o.id, o.customer, obj(o.items[0].model, o.items[0].dial), 'Paid ' + d + ' days ago and not on a bench yet.', tc('soon', d + ' d')]); });
    inCtx(DB.warranty).filter(function (w) { return w.status === 'pending' && dayDiff(T(w.registered)) <= -5; }).forEach(function (w) { var d = -dayDiff(T(w.registered)); items.push([Math.min(d, 10) / 5, w.id, w.customer, obj(w.model, null, w.serial), 'Registered ' + d + ' days ago, still unverified.', tc('', d + ' d')]); });
    inCtx(DB.appts).filter(function (a) { return a.status === 'requested' && T(a.at) < now; }).forEach(function (a) { items.push([9, a.id, a.customer, obj(a.interest), 'Asked for a viewing on ' + dlong(T(a.at)) + '; nobody confirmed it.', tc('over', 'missed')]); });
    items.sort(function (a, b) { return b[0] - a[0]; });
    el.innerHTML = '<div class="qhead"><h2 id="att-h">' + ic('flag') + 'Needs attention</h2><p>' + (items.length ? items.length + ' item' + (items.length === 1 ? '' : 's') + ', most urgent first' : 'Nothing slipping') + '</p></div>' +
      (items.length ? '<ul class="att">' + items.slice(0, 7).map(function (x) { return '<li><button type="button" data-open="' + x[1] + '">' + x[3] + '<span style="min-width:0"><span class="who">' + esc(x[2]) + ' <small class="mono" style="color:var(--muted-p);font-weight:400">' + x[1] + '</small></span><span class="why">' + esc(x[4]) + '</span></span>' + x[5] + '</button></li>'; }).join('') + '</ul>' : '<div class="void"><b>Nothing slipping.</b><p>Every promise date is in the future and every payment is in.</p></div>');
  }
  function paintFeed() {
    var el = $('#t-feed'); if (!el) return;
    var ev = LOG.slice(0, 12).map(function (l) { return { at: T(l.at), i: l.i, t: '<b>' + esc(first(l.by)) + '</b> · ' + esc(l.t), ref: l.ref }; });
    DB.orders.slice().sort(function (a, b) { return T(b.at) - T(a.at); }).slice(0, 4).forEach(function (o) { ev.push({ at: T(o.at), i: 'orders', t: '<b>' + esc(o.customer) + '</b> ordered a ' + esc(M(o.items[0].model).name) + ' · ' + inr(o.total) + (fromWeb(o) ? ' on the website' : ''), ref: o.id }); });
    DB.service.slice().sort(function (a, b) { return T(b.at) - T(a.at); }).slice(0, 2).forEach(function (s) { ev.push({ at: T(s.at), i: 'service', t: '<b>' + esc(s.customer) + '</b>’s ' + esc(M(s.model).name) + ' received for service: ' + esc(s.issue.toLowerCase()), ref: s.id }); });
    DB.enquiries.slice().sort(function (a, b) { return T(b.at) - T(a.at); }).slice(0, 2).forEach(function (e) { ev.push({ at: T(e.at), i: 'chat', t: '<b>' + esc(e.name) + '</b> asked the concierge about the ' + esc(M((e.interest || {}).model).name), ref: e.id }); });
    inCtx(DB.warranty).slice().sort(function (a, b) { return T(b.registered) - T(a.registered); }).slice(0, 2).forEach(function (w) { ev.push({ at: T(w.registered), i: 'warranty', t: '<b>' + esc(w.customer) + '</b> registered ' + esc(w.serial), ref: w.id }); });
    ev = ev.filter(function (e) { return e.at <= Date.now() + MIN; }).sort(function (a, b) { return b.at - a.at; }).slice(0, 8);
    el.innerHTML = '<div class="qhead"><h2 id="feed-h">' + ic('spark') + 'Activity</h2><p>Your actions and what came in from the website</p></div><ul class="feed">' + ev.map(function (e) { return '<li><span class="fi">' + ic(e.i) + '</span><span>' + e.t + (e.ref ? ' <button type="button" class="lk mono" data-open="' + esc(e.ref) + '">' + esc(e.ref) + '</button>' : '') + '<small>' + rel(e.at) + '</small></span></li>'; }).join('') + '</ul>';
  }

  // ================================================================== ORDERS
  var SO_ = { q: '', st: 'all', owner: 'all', sort: 'at', dir: -1, sel: {}, view: null, last: null };
  var DEFAULT_VIEWS = [{ id: 'v-dispatch', name: 'Ready to dispatch', q: '', st: 'qc', owner: 'all' }, { id: 'v-mehul', name: 'Mehul’s bench', q: '', st: 'atelier', owner: 'Mehul Soni' }, { id: 'v-engraved', name: 'Engraved gifts', q: 'engraved', st: 'all', owner: 'all' }];
  function getViews() { var v = G.store.get('staff-views', null); return Array.isArray(v) ? v : DEFAULT_VIEWS.slice(); }
  function setViews(v) { G.store.set('staff-views', v); paintSideViews(); }
  var COLS = G.store.get('staff-cols', null) || { placed: true, pay: false, owner: true, note: true };
  function oHay(o) { var it = o.items[0] || {}; return [o.id, o.customer, o.email, o.city, M(it.model).name, G.cfgLine(it), it.engraving, it.engraving ? 'engraved engraving' : '', o.pay, o.delivery, OL[o.status], o.owner, o.note].join(' ').toLowerCase(); }
  function oFilter(ignoreSt) { var q = SO_.q.trim().toLowerCase(); return DB.orders.filter(function (o) { return (ignoreSt || SO_.st === 'all' || o.status === SO_.st) && (SO_.owner === 'all' || o.owner === SO_.owner) && (!q || match(oHay(o), q)); }); }
  function oSorted(list) {
    var k = SO_.sort, d = SO_.dir;
    return list.slice().sort(function (a, b) {
      var x, y;
      if (k === 'customer') { x = a.customer; y = b.customer; return x.localeCompare(y) * d; }
      if (k === 'total') { x = a.total; y = b.total; } else if (k === 'status') { x = OST.indexOf(a.status); y = OST.indexOf(b.status); } else { x = T(a.at); y = T(b.at); }
      return (x - y) * d;
    });
  }
  function setOrderStatus(o, s) { o.status = s; o.hist = o.hist || {}; o.hist[s] = new Date().toISOString(); }
  function viewMatches(v) { return v.q === SO_.q && v.st === SO_.st && v.owner === SO_.owner; }
  function curView() { var vs = getViews(); for (var i = 0; i < vs.length; i++) if (viewMatches(vs[i])) return vs[i]; return null; }

  VIEWS.orders = {
    params: function (p) {
      if (p.get('view')) { var v = getViews().filter(function (x) { return x.id === p.get('view'); })[0]; if (v) { SO_.q = v.q; SO_.st = v.st; SO_.owner = v.owner; } }
      if (p.get('status')) SO_.st = OST.indexOf(p.get('status')) > -1 ? p.get('status') : 'all';
      if (p.get('owner')) SO_.owner = p.get('owner');
      if (p.has('q')) SO_.q = p.get('q');
      SO_.sel = {};
    },
    mount: function (el) {
      var booked = DB.orders.filter(function (o) { return o.status !== 'new'; }).reduce(function (s, o) { return s + o.total; }, 0);
      el.innerHTML = '<div class="vh"><div><h1>Orders <small id="o-n"></small></h1><p class="sub">' + money(booked) + ' booked · <b>' + DB.orders.filter(function (o) { return o.status === 'atelier'; }).length + '</b> on the benches · each watch is built over 38 days by one watchmaker</p></div><div class="vh-r"><button type="button" class="b" data-export="filtered" aria-label="Export CSV">' + ic('download') + '<span class="lbl-l">Export CSV</span></button><button type="button" class="b primary" data-new="order">' + ic('plus') + 'Manual order</button></div></div>' +
        '<div class="tool"><div class="srch">' + ic('search') + '<label class="sr" for="o-q">Search orders</label><input id="o-q" type="search" data-search placeholder="Search client, order, dial, city…" value="' + esc(SO_.q) + '" autocomplete="off"><kbd>/</kbd></div>' +
        '<div class="fchips" role="group" aria-label="Filter by status" id="o-chips"></div><span class="sp"></span>' +
        '<label class="sr" for="o-owner">Owner</label><select class="selx" id="o-owner"><option value="all">Any owner</option>' + STAFF.map(function (s) { return '<option' + (SO_.owner === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>' +
        '<div class="popwrap"><button type="button" class="b" id="o-vbtn" aria-label="Views" aria-haspopup="menu" aria-expanded="false" aria-controls="o-vpop">' + ic('views') + '<span class="lbl-l">Views</span></button><div class="pop" id="o-vpop" role="menu" aria-label="Saved views" hidden></div></div>' +
        '<div class="popwrap"><button type="button" class="b" id="o-cbtn" aria-label="Columns" title="Choose columns" aria-haspopup="true" aria-expanded="false" aria-controls="o-cpop">' + ic('columns') + '</button><div class="pop" id="o-cpop" role="group" aria-label="Show columns" hidden></div></div></div>' +
        '<div class="viewbar" id="o-vb"></div>' +
        '<div class="tblw"><table class="tbl" id="o-tbl"><caption class="sr">Orders, filtered</caption><thead id="o-th"></thead><tbody id="o-tb"></tbody></table><div class="tbl-foot" id="o-foot"></div></div><div id="o-bulk"></div>';
      var q = $('#o-q');
      q.addEventListener('input', function () { SO_.q = q.value; VIEWS.orders.paint(); syncO(); });
      $('#o-owner').addEventListener('change', function (e) { SO_.owner = e.target.value; VIEWS.orders.paint(); syncO(); });
      $('#o-vbtn').addEventListener('click', function () { paintViewsPop(); togglePop($('#o-vbtn'), $('#o-vpop')); });
      $('#o-cbtn').addEventListener('click', function () { paintColsPop(); togglePop($('#o-cbtn'), $('#o-cpop')); });
      this.paint();
    },
    paint: function () {
      var base = oFilter(true), list = oSorted(oFilter(false));
      $('#o-n').textContent = DB.orders.length;
      $('#o-chips').innerHTML = [['all', 'All']].concat(OST.map(function (s) { return [s, s === 'new' ? 'New' : OL[s]]; })).map(function (c) { var n = c[0] === 'all' ? base.length : base.filter(function (o) { return o.status === c[0]; }).length; return '<button type="button" class="fchip"' + (c[0] !== 'all' ? ' data-s="' + c[0] + '"' : '') + ' data-ost="' + c[0] + '" data-k="ost:' + c[0] + '" aria-pressed="' + (SO_.st === c[0]) + '">' + c[1] + ' <span>' + n + '</span></button>'; }).join('');
      $('#o-owner').value = SO_.owner;
      var cv = curView(), dirty = SO_.q || SO_.st !== 'all' || SO_.owner !== 'all';
      $('#o-vb').innerHTML = cv ? '<span>View</span><span class="vtag">' + esc(cv.name) + '<button type="button" data-clearf aria-label="Clear view">' + ic('x') + '</button></span><span>· ' + list.length + ' of ' + DB.orders.length + '</span>' : dirty ? '<span>' + list.length + ' of ' + DB.orders.length + ' match</span><button type="button" class="lk" data-saveview>Save as a view</button><button type="button" class="lk" data-clearf>Clear filters</button>' : '';
      var th = '<tr><th class="ck" scope="col"><label class="ckw"><input type="checkbox" class="cb" id="o-all" data-k="o-all" aria-label="Select all ' + list.length + ' shown orders"></label></th>' + sortTh('customer', 'Client') + '<th scope="col">Watch</th>' + sortTh('total', 'Total', 'r') + (COLS.placed ? sortTh('at', 'Placed', 'opt-c') : '') + (COLS.pay ? '<th scope="col" class="opt-c">Payment</th>' : '') + sortTh('status', 'Status') + (COLS.owner ? '<th scope="col" class="c-ow">Owner</th>' : '') + (COLS.note ? '<th scope="col" class="c-nt">Note for the next person</th>' : '') + '</tr>';
      $('#o-th').innerHTML = th;
      var tb = $('#o-tb');
      tb.innerHTML = list.length ? list.map(oRow).join('') : '<tr class="no-ck"><td colspan="9"><div class="void">' + ic('orders') + '<b>No orders match.</b><p>Nothing ' + (SO_.st !== 'all' ? 'is ' + esc(OL[SO_.st]).toLowerCase() : 'matches') + (SO_.q ? ' for “' + esc(SO_.q) + '”' : '') + (SO_.owner !== 'all' ? ' with ' + esc(first(SO_.owner)) : '') + '. Try a different filter.</p><button type="button" class="b" data-clearf>Clear filters</button></div></td></tr>';
      var selN = Object.keys(SO_.sel).length, allSel = list.length && list.every(function (o) { return SO_.sel[o.id]; });
      var ca = $('#o-all'); ca.checked = !!allSel; ca.indeterminate = !allSel && list.some(function (o) { return SO_.sel[o.id]; });
      var sum = list.reduce(function (s, o) { return s + o.total; }, 0);
      $('#o-foot').innerHTML = '<span>' + list.length + ' order' + (list.length === 1 ? '' : 's') + ' · ' + inr(sum) + '</span><span>Click a row for the full order · <kbd>/</kbd> to search</span>';
      $('#o-bulk').innerHTML = selN ? '<div class="bulk" role="region" aria-label="Bulk actions"><span class="n">' + selN + ' selected</span><button type="button" class="b sm" data-bulk="advance">' + ic('arrow') + 'Advance status</button><button type="button" class="b sm" data-bulk="assign">' + ic('user') + 'Assign owner</button><button type="button" class="b sm" data-bulk="csv">' + ic('download') + 'Export CSV</button><span class="sepv"></span><button type="button" class="b sm" data-bulk="clear">Clear</button></div>' : '';
    }
  };
  function syncO() { var p = {}; if (SO_.st !== 'all') p.status = SO_.st; if (SO_.owner !== 'all') p.owner = SO_.owner; if (SO_.q) p.q = SO_.q; syncHash('orders', p); }
  function sortTh(k, label, cls) { var on = SO_.sort === k; return '<th scope="col"' + (cls ? ' class="' + cls + '"' : '') + (on ? ' aria-sort="' + (SO_.dir > 0 ? 'ascending' : 'descending') + '"' : '') + '><button type="button" data-sort="' + k + '" data-k="sort:' + k + '">' + label + '</button></th>'; }
  function oRow(o) {
    var it = o.items[0] || {}, sel = !!SO_.sel[o.id];
    return '<tr data-id="' + o.id + '" class="' + (sel ? 'sel' : '') + (SO_.flash === o.id ? ' flash' : '') + '">' +
      '<td class="ck"><label class="ckw"><input type="checkbox" class="cb" data-ck="' + o.id + '" data-k="ck:' + o.id + '" aria-label="Select ' + o.id + ', ' + esc(o.customer) + '"' + (sel ? ' checked' : '') + '></label></td>' +
      '<td class="c-main"><span class="c-id"><b><button type="button" class="rowopen" data-open="' + o.id + '" data-k="open:' + o.id + '">' + esc(o.customer) + '</button></b><small>' + o.id + ' · ' + esc(o.city) + (fromWeb(o) ? ' · website' : '') + '</small></span></td>' +
      '<td class="c-wide">' + obj(it.model, it.dial) + (it.engraving ? ' <span class="tc" title="Engraved: ' + esc(it.engraving) + '">engraved</span>' : '') + '<span class="c-sub">' + esc(G.cfgLine(it)) + '</span></td>' +
      '<td class="c-amt r">' + inr(o.total) + '</td>' +
      (COLS.placed ? '<td class="opt-c" style="white-space:nowrap">' + dshort(T(o.at)) + '<span class="c-sub">' + ago(T(o.at)) + '</span></td>' : '') +
      (COLS.pay ? '<td class="opt-c">' + esc(o.pay) + '<span class="c-sub">' + esc(o.delivery) + '</span></td>' : '') +
      '<td class="c-st"><span class="ps" data-s="' + o.status + '"><select data-f="status" data-id="' + o.id + '" data-k="st:' + o.id + '" aria-label="Status of ' + o.id + '">' + OST.map(function (s) { return '<option value="' + s + '"' + (s === o.status ? ' selected' : '') + '>' + OL[s] + '</option>'; }).join('') + '</select></span></td>' +
      (COLS.owner ? '<td class="c-ow"><select class="os" data-f="owner" data-id="' + o.id + '" data-k="ow:' + o.id + '" aria-label="Owner of ' + o.id + '">' + STAFF.map(function (s) { return '<option' + (s === o.owner ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select></td>' : '') +
      (COLS.note ? '<td class="c-nt notec">' + (o.note ? '<button type="button" class="notebtn" data-note="' + o.id + '" data-k="nt:' + o.id + '" title="' + esc(o.note) + '" aria-label="Edit note for ' + o.id + ': ' + esc(o.note) + '">' + esc(o.note) + '</button>' : '<button type="button" class="notebtn empty-n" data-note="' + o.id + '" data-k="nt:' + o.id + '" aria-label="Add a note to ' + o.id + '">+ Add note</button>') + '</td>' : '') +
      '</tr>';
  }
  function paintViewsPop() {
    var vs = getViews(), cv = curView(), dirty = SO_.q || SO_.st !== 'all' || SO_.owner !== 'all';
    $('#o-vpop').innerHTML = '<p class="pk">Saved views</p>' + (vs.length ? vs.map(function (v) { var n = DB.orders.filter(function (o) { return (v.st === 'all' || o.status === v.st) && (v.owner === 'all' || o.owner === v.owner) && (!v.q || match(oHay(o), v.q.toLowerCase())); }).length; return '<div class="pvrow"><button type="button" role="menuitem" data-view="' + v.id + '"' + (cv && cv.id === v.id ? ' aria-current="true"' : '') + '>' + esc(v.name) + '<small style="margin-left:auto;color:var(--muted-p)">' + n + '</small></button><button type="button" role="menuitem" class="pvx" data-delview="' + v.id + '" aria-label="Delete view ' + esc(v.name) + '">' + ic('x') + '</button></div>'; }).join('') : '<p class="pk">No saved views yet.</p>') + '<hr><button type="button" role="menuitem" data-saveview' + (dirty && !cv ? '' : ' aria-disabled="true" title="Change a filter first; this view is already saved or unfiltered"') + '>' + ic('plus') + 'Save current filters…</button>';
  }
  function paintColsPop() {
    $('#o-cpop').innerHTML = '<p class="pk">Show columns</p>' + [['placed', 'Placed'], ['pay', 'Payment and delivery'], ['owner', 'Owner'], ['note', 'Note']].map(function (c) { return '<label class="pi"><input type="checkbox" data-col="' + c[0] + '"' + (COLS[c[0]] ? ' checked' : '') + '>' + c[1] + '</label>'; }).join('') + '<p class="pk" style="padding-bottom:6px">Client, watch, total and status always show.</p>';
  }
  function saveViewDialog() {
    var parts = []; if (SO_.st !== 'all') parts.push('Status: ' + OL[SO_.st]); if (SO_.owner !== 'all') parts.push('Owner: ' + SO_.owner); if (SO_.q) parts.push('Search: “' + SO_.q + '”');
    if (!parts.length) { G.toast('Set a filter first; there is nothing to save yet.'); return; }
    dialog({
      title: 'Save this view', sub: parts.join(' · '),
      body: '<div class="fl"><label for="vname">Name</label><input class="inp2" id="vname" maxlength="32" autocomplete="off" placeholder="e.g. Diwali dispatches"><p class="er" id="vname-e"></p><p class="hint2">It appears in the sidebar for everyone on this browser.</p></div>',
      ok: 'Save view',
      onOk: function () {
        var i = $('#vname'), n = i.value.trim(), vs = getViews();
        var e = !n ? 'Give the view a name, like “Diwali dispatches”.' : n.length < 3 ? 'A little longer, please: at least three letters.' : vs.some(function (v) { return v.name.toLowerCase() === n.toLowerCase(); }) ? 'You already have a view called “' + n + '”.' : '';
        if (e) { $('#vname-e').textContent = e; i.setAttribute('aria-invalid', 'true'); i.focus(); return false; }
        vs.push({ id: 'v-' + Date.now().toString(36), name: n, q: SO_.q, st: SO_.st, owner: SO_.owner }); setViews(vs);
        refresh(); G.toast('Saved “' + n + '”. It’s in the sidebar now.');
      }
    });
  }
  function bulkAdvance() {
    var ids = Object.keys(SO_.sel), groups = {}, skip = [];
    ids.forEach(function (id) { var o = byId('orders', id); if (!o) return; if (o.status === 'delivered') skip.push(id); else (groups[o.status] = groups[o.status] || []).push(id); });
    var move = ids.length - skip.length;
    var body = '<div class="pv">' + OST.filter(function (s) { return groups[s]; }).map(function (s) { var to = OST[OST.indexOf(s) + 1]; return '<div class="pv-row"><b class="n">' + groups[s].length + '</b><div><span class="arrow">' + st(s, OL[s]) + ic('arrow') + st(to, OL[to]) + '</span><small>' + (to === 'atelier' ? 'Each goes to a bench for its 38-day build' : to === 'qc' ? 'Starts the 72-hour run on the winding machine' : to === 'dispatched' ? 'Books an insured courier' : to === 'delivered' ? 'Starts the warranty clock' : 'Holds the build slot') + '</small><small class="pv-ids mono">' + groups[s].join(', ') + '</small></div></div>'; }).join('') +
      (skip.length ? '<div class="pv-row skip"><b class="n">' + skip.length + '</b><div>Stay as they are<small>Already delivered; there is no next step.</small><small class="pv-ids mono">' + skip.join(', ') + '</small></div></div>' : '') + '</div>';
    dialog({
      title: 'Advance ' + ids.length + ' order' + (ids.length === 1 ? '' : 's'), sub: 'Here is what will change before anything does.', body: body, wide: true,
      ok: move ? 'Apply to ' + move + ' order' + (move === 1 ? '' : 's') : 'Nothing to apply', okDisabled: !move,
      onOk: function () {
        var mv = ids.filter(function (id) { return skip.indexOf(id) < 0; }); SO_.sel = {};
        change('orders', mv, function (o) { setOrderStatus(o, OST[OST.indexOf(o.status) + 1]); }, mv.length + ' order' + (mv.length === 1 ? '' : 's') + ' advanced.');
        log('Advanced ' + mv.length + ' orders in bulk', '', 'orders');
      }
    });
  }
  function bulkAssign() {
    var ids = Object.keys(SO_.sel), pick = STAFF[0];
    function pv() {
      var already = ids.filter(function (id) { return byId('orders', id).owner === pick; }), from = {};
      ids.forEach(function (id) { var o = byId('orders', id); if (o.owner !== pick) from[o.owner] = (from[o.owner] || 0) + 1; });
      var mv = ids.length - already.length;
      $('#as-pv').innerHTML = '<div class="pv-row"><b class="n">' + mv + '</b><div>Move to ' + av(pick) + ' <b>' + esc(pick) + '</b><small>' + (Object.keys(from).map(function (k) { return 'from ' + esc(first(k)) + ' ×' + from[k]; }).join(' · ') || 'Nothing to move') + '</small></div></div>' + (already.length ? '<div class="pv-row skip"><b class="n">' + already.length + '</b><div>Already with ' + esc(first(pick)) + '<small>No change</small></div></div>' : '');
      var ok = $('[data-ok]', $('#dlg')); ok.textContent = mv ? 'Assign ' + mv + ' to ' + first(pick) : 'Nothing to change'; ok.setAttribute('aria-disabled', mv ? 'false' : 'true');
    }
    dialog({
      title: 'Assign an owner', sub: ids.length + ' order' + (ids.length === 1 ? '' : 's') + ' selected. The owner sees them in their queue.', wide: true,
      body: '<div class="fl"><span class="lb" id="as-l">New owner</span><div class="seg2" role="group" aria-labelledby="as-l">' + STAFF.map(function (s, i) { return '<button type="button" data-pick="' + esc(s) + '" aria-pressed="' + (i === 0) + '">' + esc(s) + '</button>'; }).join('') + '</div></div><div class="pv" id="as-pv" style="margin-top:14px"></div>',
      ok: 'Assign',
      onMount: function (d) { d.addEventListener('click', function (e) { var b = e.target.closest('[data-pick]'); if (!b) return; pick = b.dataset.pick; $$('[data-pick]', d).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); pv(); }); pv(); },
      onOk: function () {
        var mv = ids.filter(function (id) { return byId('orders', id).owner !== pick; }); if (!mv.length) return false; SO_.sel = {};
        change('orders', mv, function (o) { o.owner = pick; }, mv.length + ' order' + (mv.length === 1 ? '' : 's') + ' assigned to ' + pick + '.');
      }
    });
  }
  function csv(rows, name) {
    var text = rows.map(function (r) { return r.map(function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\r\n');
    var url = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' })), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function exportOrders(list) {
    if (!list.length) { G.toast('Nothing to export: no orders match these filters.'); return; }
    var rows = [['Order', 'Placed', 'Client', 'Email', 'City', 'Model', 'Dial', 'Case', 'Strap', 'Engraving', 'Total INR', 'Payment', 'Delivery', 'Status', 'Owner', 'Note']];
    list.forEach(function (o) { var it = o.items[0] || {}; rows.push([o.id, isoDate(T(o.at)), o.customer, o.email, o.city, M(it.model).name, G.optName('DIALS', it.dial), G.optName('METALS', it.metal), G.optName('STRAPS', it.strap), it.engraving, o.total, o.pay, o.delivery, OL[o.status], o.owner, o.note]); });
    var name = 'ghatika-orders-' + isoDate(Date.now()) + '.csv'; csv(rows, name);
    G.toast('Exported ' + list.length + ' order' + (list.length === 1 ? '' : 's') + ' as ' + name);
  }
  function editNote(btn) {
    var id = btn.dataset.note, o = byId('orders', id), td = btn.parentNode, done = false;
    td.innerHTML = '<label class="sr" for="ni-' + id + '">Note for ' + id + '</label><input class="notein" id="ni-' + id + '" maxlength="120" value="' + esc(o.note || '') + '" placeholder="Note for the next person · Enter to save">';
    var i = $('input', td); i.focus(); i.select();
    function commit(save) {
      if (done) return; done = true;
      var v = i.value.trim();
      if (!save || v === (o.note || '')) { VIEWS.orders.paint(); var b = $('[data-k="nt:' + id + '"]'); if (b && save !== null) b.focus(); return; }
      change('orders', [id], function (x) { if (v) addNote(x, v); else x.note = ''; }, v ? 'Note saved on ' + id + '.' : 'Note cleared on ' + id + '.');
      var b2 = $('[data-k="nt:' + id + '"]'); if (b2) b2.focus();
    }
    i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(true); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); commit(false); } });
    i.addEventListener('blur', function () { setTimeout(function () { commit(true); }, 0); });
  }
  var lastCk = null;
  main.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('[data-ck]')) {
      var id = t.dataset.ck, list = oSorted(oFilter(false)).map(function (o) { return o.id; });
      if (e.shiftKey && lastCk && list.indexOf(lastCk) > -1) { var a = list.indexOf(lastCk), b = list.indexOf(id); list.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(function (x) { if (t.checked) SO_.sel[x] = 1; else delete SO_.sel[x]; }); }
      else if (t.checked) SO_.sel[id] = 1; else delete SO_.sel[id];
      lastCk = id; refresh(); return;
    }
    if (t.id === 'o-all') { oFilter(false).forEach(function (o) { if (t.checked) SO_.sel[o.id] = 1; else delete SO_.sel[o.id]; }); refresh(); return; }
    if (t.matches('[data-f="status"]')) { var o = byId('orders', t.dataset.id), prev = OL[o.status]; change('orders', [o.id], function (x) { setOrderStatus(x, t.value); log(x.id + ': ' + prev + ' → ' + OL[t.value], x.id, 'orders'); }, o.id + ' moved to ' + OL[t.value] + '.'); return; }
    if (t.matches('[data-f="owner"]')) { var o2 = byId('orders', t.dataset.id); change('orders', [o2.id], function (x) { x.owner = t.value; }, o2.id + ' is now with ' + t.value + '.'); return; }
    if (t.matches('[data-col]')) { COLS[t.dataset.col] = t.checked; G.store.set('staff-cols', COLS); VIEWS.orders.paint(); return; }
  });

  // ================================================================== APPOINTMENTS
  var SA = { wk: 0, st: 'all', q: '', lay: G.store.get('staff-alay', 'week') };
  function wkStart(off) { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + off * 7); return d.getTime(); }
  function aHay(a) { return [a.id, a.customer, a.email, a.purpose, M(a.interest).name, bqName(a.boutique), a.host, a.note, AL[a.status]].join(' ').toLowerCase(); }
  VIEWS.appointments = {
    params: function (p) { if (p.get('status')) SA.st = AST.indexOf(p.get('status')) > -1 ? p.get('status') : 'all'; if (p.get('week')) SA.wk = +p.get('week') || 0; },
    mount: function (el) {
      el.innerHTML = '<div class="vh"><div><h1>Appointments</h1><p class="sub" id="a-sub"></p></div><div class="vh-r"><div class="seg2" role="group" aria-label="Week"><button type="button" data-wk="-1" aria-label="Previous week">' + ic('left') + '</button><button type="button" data-wk="0" id="a-this">This week</button><button type="button" data-wk="1" aria-label="Next week">' + ic('right') + '</button></div><div class="seg2 lay-seg" role="group" aria-label="Layout"><button type="button" data-lay="week">Week</button><button type="button" data-lay="list">List</button></div><button type="button" class="b primary" data-new="appt" aria-label="New viewing">' + ic('plus') + '<span class="lbl-l">New viewing</span></button></div></div>' +
        '<div class="tool"><div class="srch">' + ic('search') + '<label class="sr" for="a-q">Search appointments</label><input id="a-q" type="search" data-search placeholder="Search client, boutique, purpose…" value="' + esc(SA.q) + '" autocomplete="off"><kbd>/</kbd></div><div class="fchips" role="group" aria-label="Filter by status" id="a-chips"></div></div>' +
        '<div id="a-body"></div><div class="legend" aria-hidden="true">' + AST.map(function (s) { return '<span data-s="' + s + '"><i></i>' + AL[s] + '</span>'; }).join('') + '<span><i class="w"></i>From the website</span><span><i class="w c"></i>From the concierge</span></div>';
      $('#a-q').addEventListener('input', function (e) { SA.q = e.target.value; VIEWS.appointments.paint(); });
      this.paint();
    },
    paint: function () {
      var s0 = wkStart(SA.wk), s1 = s0 + 7 * DAY, q = SA.q.trim().toLowerCase(), t0 = sod(Date.now());
      var inWeek = inCtx(DB.appts).filter(function (a) { var t = T(a.at); return t >= s0 && t < s1 && (!q || match(aHay(a), q)); });
      var list = inWeek.filter(function (a) { return SA.st === 'all' || a.status === SA.st; }).sort(function (a, b) { return T(a.at) - T(b.at); });
      var req = inWeek.filter(function (a) { return a.status === 'requested'; }).length;
      $('#a-sub').innerHTML = dshort(s0) + ' – ' + dshort(s1 - DAY) + ' · ' + inWeek.length + ' viewing' + (inWeek.length === 1 ? '' : 's') + (CTX === 'all' ? ' across four boutiques' : ' at ' + esc(bqName(CTX))) + (req ? ' · <b>' + req + ' to confirm</b>' : '');
      $('#a-this').setAttribute('aria-pressed', SA.wk === 0);
      $$('[data-lay]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lay === SA.lay); });
      $('#a-chips').innerHTML = [['all', 'All']].concat(AST.map(function (s) { return [s, AL[s]]; })).map(function (c) { var n = c[0] === 'all' ? inWeek.length : inWeek.filter(function (a) { return a.status === c[0]; }).length; return '<button type="button" class="fchip"' + (c[0] !== 'all' ? ' data-s="' + c[0] + '"' : '') + ' data-ast="' + c[0] + '" data-k="ast:' + c[0] + '" aria-pressed="' + (SA.st === c[0]) + '">' + c[1] + ' <span>' + n + '</span></button>'; }).join('');
      var days = []; for (var i = 0; i < 7; i++) days.push(s0 + i * DAY);
      var bqs = CTX === 'all' ? D.BOUTIQUES : [bq(CTX)];
      var grid = '<div class="wk"><div class="wh">Boutique</div>' + days.map(function (d) { return '<div class="wh' + (d === t0 ? ' td' : '') + '">' + new Date(d).toLocaleDateString('en-IN', { weekday: 'short' }) + (d === t0 ? ' · today' : '') + '<b>' + new Date(d).getDate() + '</b></div>'; }).join('') +
        bqs.map(function (b) {
          return '<div class="wb"><b>' + esc(b.name) + '</b><small>' + esc(b.city) + ' · ' + esc(b.hours.split(' · ')[1]) + '</small></div>' + days.map(function (d) {
            var items = list.filter(function (a) { return a.boutique === b.id && sod(T(a.at)) === d; }), cl = (CLOSED[b.id] || []).indexOf(new Date(d).getDay()) > -1;
            return '<div class="wc' + (d === t0 ? ' td' : '') + (cl && !items.length ? ' cl' : '') + '">' + items.map(function (a) { return '<button type="button" class="ap' + (a.status === 'cancelled' || a.status === 'no-show' ? ' dim' : '') + '" data-s="' + a.status + '" data-open="' + a.id + '" data-k="ap:' + a.id + '" aria-label="' + esc(dlong(T(a.at)) + ' ' + hm(T(a.at)) + ', ' + b.name + ': ' + a.customer + ', ' + AL[a.status] + (fromWeb(a) ? ', from website' : '')) + '">' + (fromWeb(a) ? '<i class="w"></i>' : fromChat(a) ? '<i class="w c"></i>' : '') + '<b>' + hm(T(a.at)) + '</b><span>' + esc(a.customer) + '</span></button>'; }).join('') + '</div>';
          }).join('');
        }).join('') + '</div>';
      var byDay = days.map(function (d) { return [d, list.filter(function (a) { return sod(T(a.at)) === d; })]; }).filter(function (x) { return x[1].length; });
      var agenda = byDay.length ? byDay.map(function (x) {
        return '<section><h2>' + dlong(x[0]) + (x[0] === t0 ? ' <span class="tc soon" style="height:20px">today</span>' : '') + ' <small>' + x[1].length + ' viewing' + (x[1].length === 1 ? '' : 's') + '</small></h2><div class="card">' + x[1].map(function (a) {
          return '<div class="ag" data-row="' + a.id + '"><time>' + hm(T(a.at)) + '<small>' + esc(bq(a.boutique).city) + '</small></time><span style="min-width:0"><button type="button" class="who" data-open="' + a.id + '" data-k="ag:' + a.id + '">' + esc(a.customer) + '</button><span class="c-sub">' + esc(a.purpose) + ' · ' + esc(M(a.interest).name) + ' · host ' + esc(first(a.host)) + '</span></span><span class="ac">' + st(a.status, AL[a.status]) + webChip(a) + (a.status === 'requested' ? '<button type="button" class="b sm primary" data-aconfirm="' + a.id + '" data-k="ac:' + a.id + '">Confirm</button>' : '') + '</span></div>';
        }).join('') + '</div></section>';
      }).join('') : '';
      var empty = !list.length ? '<div class="void card">' + ic('appointments') + '<b>' + (inWeek.length ? 'No ' + esc(AL[SA.st] || '').toLowerCase() + ' viewings this week.' : 'No viewings this week.') + '</b><p>' + (q ? 'Nothing matches “' + esc(SA.q) + '”.' : 'The salons are quiet. A good week to re-dress the strap wall and call last month’s “thinking” clients.') + '</p><button type="button" class="b" data-new="appt">' + ic('plus') + 'Book a viewing</button></div>' : '';
      $('#a-body').className = 'layout-' + SA.lay;
      $('#a-body').innerHTML = (list.length ? '<div class="wkw">' + grid + '</div><div class="agenda">' + agenda + '</div>' : empty);
    }
  };

  // ================================================================== SERVICE
  var SS = { q: '', tech: 'all', wty: false, over: false, hl: '' };
  function sHay(s) { return [s.id, s.customer, s.email, s.serial, M(s.model).name, s.issue, s.detail, s.logistics, s.tech, SL[s.stage]].join(' ').toLowerCase(); }
  function setStage(s, to) { var from = s.stage; s.stage = to; s.hist = s.hist || {}; s.hist[to] = new Date().toISOString(); log(s.id + ' (' + first(s.customer) + '): ' + SL[from] + ' → ' + SL[to], s.id, 'service'); }
  VIEWS.service = {
    params: function (p) { SS.over = p.get('overdue') === '1'; SS.hl = p.get('stage') || ''; },
    mount: function (el) {
      el.innerHTML = '<div class="vh"><div><h1>Service</h1><p class="sub" id="s-sub"></p></div><div class="vh-r"><button type="button" class="b primary" data-new="ticket" aria-label="New service ticket">' + ic('plus') + '<span class="lbl-l">New service ticket</span></button></div></div>' +
        '<div class="tool"><div class="srch">' + ic('search') + '<label class="sr" for="s-q">Search service tickets</label><input id="s-q" type="search" data-search placeholder="Search client, serial, issue…" value="' + esc(SS.q) + '" autocomplete="off"><kbd>/</kbd></div><label class="sr" for="s-tech">Technician</label><select class="selx" id="s-tech"><option value="all">Any technician</option>' + STAFF.map(function (s) { return '<option' + (SS.tech === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select><div class="fchips" id="s-chips" role="group" aria-label="Filters"></div><span class="sp"></span><p class="hint2 hint-d">Drag cards between stages, or use “Move to” on each card.</p></div>' +
        '<div class="stagejump" id="s-jump" role="group" aria-label="Jump to stage"></div><div class="board" id="board" role="list" aria-label="Service board"></div>';
      $('#s-q').addEventListener('input', function (e) { SS.q = e.target.value; VIEWS.service.paint(); });
      $('#s-tech').addEventListener('change', function (e) { SS.tech = e.target.value; VIEWS.service.paint(); });
      $('#board').addEventListener('scroll', jumpSync, { passive: true });
      initDrag($('#board'));
      this.paint();
      if (SS.hl) { var c = $('.bcol[data-stage="' + SS.hl + '"]'); if (c) { c.scrollIntoView({ block: 'nearest', inline: 'start' }); c.classList.add('over'); setTimeout(function () { c.classList.remove('over'); }, 1400); } SS.hl = ''; }
    },
    paint: function () {
      var q = SS.q.trim().toLowerCase();
      var list = DB.service.filter(function (s) { return (SS.tech === 'all' || s.tech === SS.tech) && (!SS.wty || s.warranty) && (!SS.over || overdue(s)) && (!q || match(sHay(s), q)); });
      var open = DB.service.filter(function (s) { return s.stage !== 'returned'; }), ov = DB.service.filter(overdue).length, qs = DB.service.filter(function (s) { return s.stage === 'quote'; }).length;
      $('#s-sub').innerHTML = '<b>' + open.length + '</b> watches with us · ' + (ov ? '<b style="color:var(--warn-t)">' + ov + ' overdue</b>' : 'none overdue') + ' · ' + qs + ' quote' + (qs === 1 ? '' : 's') + ' with clients';
      $('#s-chips').innerHTML = '<button type="button" class="fchip" data-sf="wty" data-k="sf:wty" aria-pressed="' + SS.wty + '">Under warranty <span>' + DB.service.filter(function (s) { return s.warranty; }).length + '</span></button><button type="button" class="fchip warn" data-sf="over" data-k="sf:over" aria-pressed="' + SS.over + '">Overdue <span>' + ov + '</span></button>';
      var filtered = q || SS.tech !== 'all' || SS.wty || SS.over;
      $('#s-jump').innerHTML = SST.map(function (s) { return '<button type="button" data-jump="' + s + '"><span class="st solid" data-s="' + s + '" style="height:auto;padding:0;background:none">' + SL[s] + '</span><span>' + list.filter(function (x) { return x.stage === s; }).length + '</span></button>'; }).join('');
      $('#board').innerHTML = SST.map(function (s, si) {
        var items = list.filter(function (x) { return x.stage === s; }).sort(function (a, b) { return T(a.due) - T(b.due); });
        return '<section class="bcol" data-stage="' + s + '" data-s="' + s + '" role="listitem" aria-labelledby="bh-' + s + '"><div class="bcol-h"><h2 id="bh-' + s + '">' + SL[s] + '<span>' + items.length + '</span></h2><p>' + SD[s] + '</p></div><div class="bcol-b">' +
          (items.length ? items.map(function (x) { return tkCard(x, si); }).join('') : '<div class="void">' + ic(s === 'qc' || s === 'service' ? 'bench' : 'loupe') + '<p>' + (filtered ? 'No tickets match these filters here.' : SVOID[s]) + '</p></div>') + '</div></section>';
      }).join('');
      jumpSync();
    }
  };
  function tkCard(x, si) {
    return '<article class="tk" data-tk="' + x.id + '" aria-label="' + esc(x.customer + ', ' + M(x.model).name + ', ' + SL[x.stage]) + '">' +
      '<div class="tk-top"><span class="mono">' + x.id + '</span>' + dueChip(x) + '</div>' +
      '<h3><button type="button" class="rowopen" data-open="' + x.id + '" data-k="tko:' + x.id + '">' + esc(x.customer) + '</button></h3>' +
      '<div class="tk-mid">' + obj(x.model, null) + '<span class="mono" style="color:var(--muted-p);font-size:11.5px">' + esc(x.serial) + '</span></div>' +
      '<p class="iss">' + esc(x.issue) + ' · ' + esc(x.detail) + '</p>' +
      '<div class="tk-mid">' + (x.warranty ? tc('wty', 'warranty', false) : '') + '<span class="qcell">' + (x.quote ? '<button type="button" class="qamt" data-qamt="' + x.id + '" data-k="qa:' + x.id + '" aria-label="Quote for ' + x.id + ': ' + inr(x.quote) + '. Edit">' + inr(x.quote) + '</button>' : '<button type="button" class="add" data-qamt="' + x.id + '" data-k="qa:' + x.id + '">+ Add quote</button>') + '</span>' + (x.sentAt && x.stage === 'quote' ? tc('soon', 'sent ' + rel(T(x.sentAt)), false) : '') + '</div>' +
      '<div class="tk-ft">' + av(x.tech) + '<label class="sr" for="mv-' + x.id + '">Move ' + x.id + ' to</label><select class="mv" id="mv-' + x.id + '" data-mv="' + x.id + '" data-k="mv:' + x.id + '"><option value="">Move to…</option>' + SST.map(function (s) { return s === x.stage ? '' : '<option value="' + s + '">' + SL[s] + '</option>'; }).join('') + '</select><span class="grip" aria-hidden="true" title="Drag to another stage">' + ic('grip') + '</span></div></article>';
  }
  function jumpSync() {
    var b = $('#board'), j = $('#s-jump'); if (!b || !j || !mobile.matches) return;
    var cols = $$('.bcol', b), x = b.scrollLeft, idx = 0;
    cols.forEach(function (c, i) { if (c.offsetLeft - b.offsetLeft - 20 <= x) idx = i; });
    $$('button', j).forEach(function (bt, i) { bt.setAttribute('aria-current', i === idx); });
  }
  function moveTicket(id, to) {
    var s = byId('service', id); if (!s || s.stage === to) return;
    change('service', [id], function (x) { setStage(x, to); }, id + ' moved to ' + SL[to] + '.');
    var c = $('[data-tk="' + id + '"]'); if (c) { c.classList.add('landed'); }
  }
  var dragJust = false;
  function initDrag(board) {
    board.addEventListener('pointerdown', function (e) {
      var card = e.target.closest('.tk'); if (!card || e.button !== 0) return;
      if (e.target.closest('select,input,a,.qamt,.add,.rowopen')) return;
      if (e.pointerType !== 'mouse' && !e.target.closest('.grip')) return;
      var sx = e.clientX, sy = e.clientY, started = false, ghost = null, over = null, id = card.dataset.tk, raf = 0, lx = sx;
      if (e.pointerType === 'mouse') e.preventDefault();
      function edge() { var r = board.getBoundingClientRect(); if (lx > r.right - 60) board.scrollLeft += 14; else if (lx < r.left + 60) board.scrollLeft -= 14; if (started) raf = requestAnimationFrame(edge); }
      function mv(ev) {
        var dx = ev.clientX - sx, dy = ev.clientY - sy; lx = ev.clientX;
        if (!started) {
          if (Math.abs(dx) + Math.abs(dy) < 6) return;
          started = true; var r = card.getBoundingClientRect(); ghost = card.cloneNode(true); ghost.classList.add('ghost'); ghost.removeAttribute('data-tk'); $$('[id]', ghost).forEach(function (n) { n.removeAttribute('id'); });
          ghost.style.width = r.width + 'px'; ghost.style.left = r.left + 'px'; ghost.style.top = r.top + 'px'; document.body.appendChild(ghost); card.classList.add('src'); raf = requestAnimationFrame(edge);
        }
        ghost.style.transform = 'translate(' + dx + 'px,' + dy + 'px)' + (reduce ? '' : ' rotate(1.5deg)');
        var el = document.elementFromPoint(ev.clientX, ev.clientY), col = el && el.closest('.bcol');
        if (col !== over) { if (over) over.classList.remove('over'); over = col; if (over) over.classList.add('over'); }
      }
      function up() {
        document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
        cancelAnimationFrame(raf);
        if (!started) return;
        started = false; dragJust = true; setTimeout(function () { dragJust = false; }, 60);
        if (ghost) ghost.remove(); card.classList.remove('src');
        if (over) { over.classList.remove('over'); moveTicket(id, over.dataset.stage); }
      }
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
    });
    board.addEventListener('click', function (e) {
      if (dragJust) { e.stopPropagation(); e.preventDefault(); return; }
      var card = e.target.closest('.tk'); if (!card || e.target.closest('button,select,input,a,label')) return;
      openRecord(card.dataset.tk);
    }, true);
  }
  function editQuote(btn) {
    var id = btn.dataset.qamt, s = byId('service', id), cell = btn.parentNode, done = false;
    cell.innerHTML = '<label class="sr" for="qi-' + id + '">Quote in rupees for ' + id + '</label><input class="qamt-in" id="qi-' + id + '" inputmode="numeric" value="' + (s.quote || '') + '" placeholder="₹">';
    var i = $('input', cell); i.focus(); i.select();
    function commit(ok) {
      if (done) return;
      var v = +String(i.value).replace(/[^\d]/g, '');
      if (ok && i.value.trim() && (!v || v > 500000)) { G.toast(!v ? 'Enter the quote in rupees, for example 18500.' : 'That is more than a new Prahar. Check the amount.'); i.setAttribute('aria-invalid', 'true'); i.focus(); return; }
      done = true;
      if (!ok || v === (s.quote || 0)) { refresh(); var b = $('[data-k="qa:' + id + '"]'); if (b) b.focus(); return; }
      change('service', [id], function (x) { x.quote = v; log('Quote for ' + id + ' set to ' + inr(v), id, 'pay'); }, 'Quote for ' + id + ' set to ' + inr(v) + '.');
      var b2 = $('[data-k="qa:' + id + '"]'); if (b2) b2.focus();
    }
    i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(true); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); commit(false); } });
    i.addEventListener('blur', function () { setTimeout(function () { if (!done) commit(true); }, 0); });
  }

  // ================================================================== WARRANTY
  var SW = { q: '', st: 'all', sort: 'bought', dir: -1 };
  function wHay(w) { return [w.id, w.serial, w.customer, w.email, w.city, M(w.model).name, bqName(w.boutique), WL[w.status]].join(' ').toLowerCase(); }
  function coverEnd(w) { var d = new Date(w.bought); d.setFullYear(d.getFullYear() + (w.years || 5)); return d.getTime(); }
  VIEWS.warranty = {
    params: function (p) { if (p.get('status')) SW.st = WL[p.get('status')] ? p.get('status') : 'all'; },
    mount: function (el) {
      var all = inCtx(DB.warranty), eight = all.filter(function (w) { return w.years === 8; }).length;
      el.innerHTML = '<div class="vh"><div><h1>Warranty register</h1><p class="sub">' + all.length + ' watches registered' + (CTX === 'all' ? '' : ' at ' + esc(bqName(CTX))) + ' · ' + (all.length ? Math.round(eight / all.length * 100) : 0) + '% on eight-year cover · certificates are issued once verified</p></div></div>' +
        '<div class="tool"><div class="srch">' + ic('search') + '<label class="sr" for="w-q">Search the register</label><input id="w-q" type="search" data-search placeholder="Serial, owner, model…" value="' + esc(SW.q) + '" autocomplete="off"><kbd>/</kbd></div><div class="fchips" role="group" aria-label="Filter by status" id="w-chips"></div></div>' +
        '<div class="tblw"><table class="tbl"><caption class="sr">Warranty register</caption><thead id="w-th"></thead><tbody id="w-tb"></tbody></table><div class="tbl-foot" id="w-foot"></div></div>';
      $('#w-q').addEventListener('input', function (e) { SW.q = e.target.value; VIEWS.warranty.paint(); });
      this.paint();
    },
    paint: function () {
      var q = SW.q.trim().toLowerCase(), base = inCtx(DB.warranty).filter(function (w) { return !q || match(wHay(w), q); });
      var list = base.filter(function (w) { return SW.st === 'all' || w.status === SW.st; }).sort(function (a, b) { var k = SW.sort; if (k === 'serial') return a.serial.localeCompare(b.serial) * SW.dir; if (k === 'customer') return a.customer.localeCompare(b.customer) * SW.dir; return (T(a.bought) - T(b.bought)) * SW.dir; });
      if (SW.st === 'all') list.sort(function (a, b) { return (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1); });
      $('#w-chips').innerHTML = [['all', 'All'], ['pending', 'To verify'], ['verified', 'Verified'], ['query', 'Invoice requested']].map(function (c) { var n = c[0] === 'all' ? base.length : base.filter(function (w) { return w.status === c[0]; }).length; return '<button type="button" class="fchip"' + (c[0] !== 'all' ? ' data-s="' + c[0] + '"' : '') + ' data-wst="' + c[0] + '" data-k="wst:' + c[0] + '" aria-pressed="' + (SW.st === c[0]) + '">' + c[1] + ' <span>' + n + '</span></button>'; }).join('');
      var sth = function (k, l, cls) { var on = SW.sort === k; return '<th scope="col"' + (cls ? ' class="' + cls + '"' : '') + (on ? ' aria-sort="' + (SW.dir > 0 ? 'ascending' : 'descending') + '"' : '') + '><button type="button" data-wsort="' + k + '" data-k="wsort:' + k + '">' + l + '</button></th>'; };
      $('#w-th').innerHTML = '<tr>' + sth('serial', 'Serial') + '<th scope="col">Watch</th>' + sth('customer', 'Owner') + sth('bought', 'Bought', 'opt-c') + '<th scope="col" class="opt-c">Boutique</th><th scope="col">Cover</th><th scope="col">Status</th><th scope="col"><span class="sr">Action</span></th></tr>';
      $('#w-tb').innerHTML = list.length ? list.map(function (w) {
        return '<tr class="no-ck" data-wid="' + w.id + '"><td class="c-main"><b class="mono">' + esc(w.serial) + '</b><span class="c-sub">' + w.id + '</span></td><td class="c-wide c-hide-m">' + obj(w.model, null, M(w.model).ref) + '</td>' +
          '<td class="c-wide"><button type="button" class="rowopen" data-open="' + w.id + '" data-k="wo:' + w.id + '" style="font-weight:500">' + esc(w.customer) + '</button><span class="c-sub">' + esc(M(w.model).name) + ' · ' + esc(w.city) + ' · bought ' + dshort(T(w.bought)) + '</span></td>' +
          '<td class="opt-c">' + dshort(T(w.bought)) + '<span class="c-sub">' + new Date(w.bought).getFullYear() + '</span></td><td class="opt-c">' + esc(bq(w.boutique).name) + '<span class="c-sub">' + esc(bq(w.boutique).city) + '</span></td>' +
          '<td class="c-hide-m">' + w.years + ' years<span class="c-sub">until ' + new Date(coverEnd(w)).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) + '</span></td>' +
          '<td class="c-end">' + st(w.status, WL[w.status]) + '</td><td class="c-row" style="text-align:right">' + (w.status !== 'verified' ? '<button type="button" class="b sm primary" data-open="' + w.id + '" data-k="wv:' + w.id + '">Verify</button>' : '<button type="button" class="b sm" data-open="' + w.id + '" data-k="wv:' + w.id + '">Certificate</button>') + '</td></tr>';
      }).join('') : '<tr class="no-ck"><td colspan="8"><div class="void">' + ic('warranty') + '<b>' + (SW.st === 'pending' && !q ? 'Nothing to verify.' : 'No watches match.') + '</b><p>' + (SW.st === 'pending' && !q ? 'Every registration has been checked against the movement register.' : 'Serials look like GH01-0043, engraved between the lugs at six.') + '</p></div></td></tr>';
      $('#w-foot').innerHTML = '<span>' + list.length + ' of ' + inCtx(DB.warranty).length + '</span><span>Serials are checked against the movement register before a certificate is issued</span>';
    }
  };
  // chapter ring: 60 minute ticks and a champagne hand that turns with progress (the maison's section marker, used here as a progress dial)
  function ring(f) { var t = ''; for (var i = 0; i < 60; i++) t += '<line x1="20" y1="' + (i % 15 ? 2.6 : 1.6) + '" x2="20" y2="' + (i % 5 ? 4.2 : 5.6) + '" transform="rotate(' + i * 6 + ' 20 20)"/>'; return '<svg class="ring2" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="none"/><g class="tks">' + t + '</g><line class="hnd" x1="20" y1="20" x2="20" y2="7" style="transform:rotate(' + Math.round(Math.max(0, Math.min(1, f)) * 360) + 'deg)"/><circle cx="20" cy="20" r="1.6" class="pin"/></svg>'; }
  function sigName(n) { var p = String(n).split(' '); return p[0] + (p[1] ? ' ' + p[1].charAt(0) + '.' : ''); }
  function rose() { var s = '<svg class="rose" viewBox="-100 -100 200 200" aria-hidden="true">'; for (var i = 0; i < 36; i++) s += '<ellipse rx="96" ry="30" transform="rotate(' + (i * 5) + ')" fill="none" stroke="currentColor" stroke-width=".35"/>'; return s + '<circle r="30" fill="none" stroke="currentColor" stroke-width=".4"/></svg>'; }

  // ================================================================== slide-over
  var SO = { el: $('#so'), scrim: $('#so-scrim'), ctx: null, last: null };
  var FLOW = {};
  function openRecord(id, opts) {
    var n = coll(id); if (!n || !byId(n, id)) { G.toast('That record has been removed.'); return; }
    openSO({ type: n, id: id, flow: opts && opts.flow });
  }
  function openSO(ctx) {
    var wasHidden = SO.el.hidden;
    SO.ctx = ctx;
    if (wasHidden) {
      SO.last = document.activeElement;
      SO.el.hidden = false; SO.scrim.hidden = false;
      requestAnimationFrame(function () { SO.el.classList.add('on'); SO.scrim.classList.add('on'); });
      if (mobile.matches) document.documentElement.style.overflow = 'hidden';
    }
    paintSO(true);
    var x = $('.so-x', SO.el); if (x) x.focus({ preventScroll: true });
    if (ctx.type !== 'form' && cur) { var p = new URLSearchParams((location.hash.split('?')[1]) || ''); p.set('open', ctx.id); syncHash(cur, Object.fromEntries ? Object.fromEntries(p) : {}); }
  }
  function closeSO(silent) {
    if (SO.el.hidden) return;
    SO.el.classList.remove('on'); SO.scrim.classList.remove('on');
    var el = SO.el, sc = SO.scrim;
    setTimeout(function () { if (!el.classList.contains('on')) { el.hidden = true; sc.hidden = true; el.innerHTML = ''; } }, reduce ? 0 : 320);
    document.documentElement.style.overflow = '';
    SO.ctx = null;
    if (!silent && cur) { var p = new URLSearchParams((location.hash.split('?')[1]) || ''); p.delete('open'); syncHash(cur, Object.fromEntries ? Object.fromEntries(p) : {}); }
    if (!silent && SO.last && document.contains(SO.last)) SO.last.focus({ preventScroll: true });
  }
  SO.scrim.addEventListener('click', function () { closeSO(); });
  SO.el.addEventListener('keydown', function (e) { if (e.key === 'Tab') G.trap(e, SO.el); });
  function paintSO(initial) {
    if (!SO.ctx || SO.el.hidden) return;
    if (SO.ctx.type === 'form' && !initial) return;
    var b = $('.so-b', SO.el), sc = b ? b.scrollTop : 0, r;
    if (SO.ctx.type === 'form') { SO.el.innerHTML = FORMS[SO.ctx.kind].html(SO.ctx.pre || {}); FORMS[SO.ctx.kind].bind(SO.el, SO.ctx.pre || {}); return; }
    r = byId(SO.ctx.type, SO.ctx.id); if (!r) { closeSO(); return; }
    SO.el.innerHTML = RENDER[SO.ctx.type](r);
    var nb = $('.so-b', SO.el); if (nb && !initial) nb.scrollTop = sc;
    if (initial && SO.ctx.flow) { var f = $('#flow', SO.el); if (f) setTimeout(function () { f.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' }); }, 80); }
  }
  function soHead(r, chips) { return '<div class="so-h"><span class="mono">' + esc(r.id) + '</span>' + chips + '<span class="sp"></span><button type="button" class="ib so-x" data-k="so-x" aria-label="Close panel (Esc)">' + ic('x') + '</button></div>'; }
  function calloutHTML(r) { var ln = lastNote(r); return ln ? '<div class="callout"><span class="k">Last note · ' + esc(first(ln.by)) + ', ' + rel(T(ln.at)) + '</span><p>' + esc(ln.t) + '</p></div>' : '<div class="callout none"><span class="k">Last note</span><p>No notes yet. Leave one below for the next person.</p></div>'; }
  function notesHTML(r) {
    var n = ensureNotes(r).slice().reverse();
    return '<section class="so-sec"><h3>Notes for the next person <span style="font-weight:400;letter-spacing:0;text-transform:none">' + n.length + '</span></h3>' + (n.length ? '<ul class="notes">' + n.map(function (x) { return '<li>' + av(x.by) + '<div><small>' + esc(x.by) + ' · ' + rel(T(x.at)) + '</small><p>' + esc(x.t) + '</p></div></li>'; }).join('') + '</ul>' : '') +
      '<div class="noteform"><label class="sr" for="so-note">Add a note</label><textarea class="inp2" id="so-note" data-k="so-note" placeholder="What should the next person know?"></textarea><div class="row"><p class="er" id="so-note-e"></p><button type="button" class="b sm" data-addnote="' + r.id + '">Add note</button></div></div></section>';
  }
  var RENDER = {};
  RENDER.orders = function (o) {
    var it = o.items[0] || {}, si = OST.indexOf(o.status), t = T(o.at), next = ONEXT[o.status], nstep = OTL.filter(function (x) { return x[0] === OST[si + 1]; })[0];
    var nDone = OTL.filter(function (s) { return si >= OST.indexOf(s[0]); }).length, now = Date.now(), times = [];
    OTL.forEach(function (s, i) {
      if (o.hist && o.hist[s[0]]) times[i] = T(o.hist[s[0]]);
      else if (i < nDone) times[i] = Math.min(t + s[3] * DAY, t + (now - t) * (nDone > 1 ? i / (nDone - 1) : 0));
      else { var base = nDone ? Math.max(times[nDone - 1], now) : now, off0 = nDone ? OTL[nDone - 1][3] : 0; times[i] = base + (s[3] - off0) * DAY; }
    });
    var tl = OTL.map(function (s, i) {
      var idx = OST.indexOf(s[0]), done = si >= idx, isCur = si + 1 === idx || (o.status === 'new' && i === 0), when = times[i];
      return '<li class="' + (done ? 'done' : isCur ? 'cur' : '') + '"><span class="tn">' + (done ? ic('check') : i + 1) + '</span><div><b>' + (s[0] === 'paid' && o.status === 'new' ? 'Awaiting payment' : s[1]) + '</b><small>' + s[2] + '</small></div><time>' + (done ? dshort(when) : 'est. ' + dshort(when)) + '</time></li>';
    }).join('');
    return soHead(o, st(o.status, OL[o.status]) + webChip(o)) +
      '<div class="so-b"><div class="so-title"><div><h2 id="so-h">' + esc(o.customer) + '</h2><p>Placed ' + dfull(t) + ', ' + hm(t) + ' · ' + ago(t) + '</p></div></div>' + calloutHTML(o) +
      '<section class="so-sec"><h3>The watch</h3><div class="cfg-card">' + watchSvg(it) + '<div><h4>' + esc(M(it.model).name) + ' <span style="font:400 13px var(--sans);color:var(--muted)">' + esc(M(it.model).ref) + '</span></h4><p>' + esc(G.cfgLine(it)) + '</p><p>' + esc(M(it.model).line) + '</p>' + (it.engraving ? '<p class="eng">Engraved: “' + esc(it.engraving) + '”</p>' : '<p style="color:var(--muted)">No engraving</p>') + '<p class="amt" style="margin-top:6px">' + inr(o.total) + '</p></div></div></section>' +
      '<section class="so-sec"><h3>Build timeline</h3><ol class="tl">' + tl + '</ol></section>' +
      '<section class="so-sec"><h3>Client</h3><dl class="props"><dt>Name</dt><dd>' + esc(o.customer) + '</dd><dt>Phone</dt><dd>' + esc(o.phone) + ' <span class="hint2">masked</span></dd><dt>Email</dt><dd>' + esc(o.email) + '</dd><dt>City</dt><dd>' + esc(o.city) + '</dd></dl></section>' +
      '<section class="so-sec"><h3>Payment and delivery</h3><dl class="props"><dt>Method</dt><dd>' + esc(o.pay) + '</dd><dt>Amount</dt><dd>' + inr(o.total) + ' incl. GST</dd><dt>Delivery</dt><dd>' + esc(o.delivery) + '</dd><dt><label for="so-own">Owner</label></dt><dd><select class="selx" id="so-own" data-k="so-own" data-soown="' + o.id + '">' + STAFF.map(function (s) { return '<option' + (s === o.owner ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select></dd></dl></section>' +
      notesHTML(o) + '</div>' +
      '<div class="so-f">' + (next ? '<span class="why">Next: ' + esc(nstep ? nstep[2] : '') + '</span><button type="button" class="b primary" data-oadv="' + o.id + '" data-k="oadv">' + esc(next) + ' <span class="ar" aria-hidden="true">→</span></button>' : '<span class="why">Delivered. The warranty clock is running.</span><button type="button" class="b" data-go="warranty">Open the warranty register</button>') + '</div>';
  };
  RENDER.appts = function (a) {
    var t = T(a.at), b = bq(a.boutique), fin = a.status === 'visited' || a.status === 'no-show' || a.status === 'cancelled', started = t < Date.now();
    var outcome = a.status === 'visited' ? (a.outcome === 'bought' ? 'Visited and bought' : a.outcome === 'thinking' ? 'Visited, thinking it over' + (a.followUp ? '; follow-up ' + dlong(T(a.followUp)) : '') : 'Visited the boutique') : a.status === 'no-show' ? 'Did not arrive' + (a.linkSent ? '; reschedule link queued' : '') : a.status === 'cancelled' ? 'Cancelled · ' + (a.cancelReason || 'no reason given') : '';
    return soHead(a, st(a.status, AL[a.status]) + webChip(a)) +
      '<div class="so-b"><div class="so-title">' + watchSvg({ model: a.interest }) + '<div><h2 id="so-h">' + esc(a.customer) + '</h2><p>' + esc(a.purpose) + ' · ' + dlong(t) + ', ' + hm(t) + ' · ' + rel(t) + '</p></div></div>' + calloutHTML(a) +
      (outcome ? '<div class="callout" style="background:var(--sunk);border-left-color:var(--ink)"><span class="k" style="color:var(--muted-p)">Outcome</span><p>' + esc(outcome) + '</p></div>' : '') +
      (a.status === 'confirmed' ? '<section class="so-sec paper-og">' + outcomeHTML(a, started ? 'How did it go?' : 'After the viewing: how did it go?') + '<p class="er" id="og-e"></p></section>' : '') +
      '<section class="so-sec"><h3>Viewing</h3><dl class="props"><dt>When</dt><dd>' + dlong(t) + ', ' + hm(t) + ' ' + (fin ? tc('', rel(t)) : timeChip(t)) + '</dd><dt>Boutique</dt><dd>' + esc(b.name + ', ' + b.city) + '<span class="hint2">' + esc(b.hours) + '</span></dd><dt>Purpose</dt><dd>' + esc(a.purpose) + '</dd><dt>Interested in</dt><dd>' + obj(a.interest, null, M(a.interest).line) + '</dd><dt>Guests</dt><dd>' + a.guests + '</dd><dt><label for="so-host">Host</label></dt><dd><select class="selx" id="so-host" data-k="so-host" data-sohost="' + a.id + '">' + STAFF.map(function (s) { return '<option' + (s === a.host ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select></dd></dl></section>' +
      '<section class="so-sec"><h3>Client</h3><dl class="props"><dt>Phone</dt><dd>' + esc(a.phone) + ' <span class="hint2">masked</span></dd><dt>Email</dt><dd>' + esc(a.email) + '</dd><dt>Source</dt><dd>' + (fromChat(a) ? 'The concierge chat' + (a.convo ? ' <a class="tlink" href="#inbox?c=' + encodeURIComponent(a.convo) + '">Transcript</a>' : '') : fromWeb(a) ? 'Booked on the website' : a.src === 'staff' ? 'Booked by staff' : 'Boutique diary') + '</dd></dl></section>' +
      (!fin ? '<section class="so-sec" id="rs-sec"><h3>Reschedule</h3><div class="fgrid"><div class="fl"><label for="rs2-d">New date</label><input class="inp2" type="date" id="rs2-d" data-k="rs2-d" min="' + isoDate(Date.now()) + '"></div><div class="fl"><label for="rs2-s">Slot</label><select class="inp2" id="rs2-s" data-k="rs2-s"><option value="">Choose a slot</option>' + D.SLOTS.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select></div></div><p class="er" id="rs2-e"></p><div style="display:flex;justify-content:flex-end;margin-top:8px"><button type="button" class="b sm" data-resched="' + a.id + '">Move the viewing</button></div></section>' : '') +
      notesHTML(a) + '</div>' +
      '<div class="so-f">' + (a.status === 'requested' ? '<button type="button" class="b danger" data-acancel="' + a.id + '">Cancel viewing</button><button type="button" class="b primary" data-aconfirm="' + a.id + '" data-k="so-conf">Confirm viewing <span class="ar" aria-hidden="true">→</span></button>' : a.status === 'confirmed' ? '<button type="button" class="b danger" data-acancel="' + a.id + '">Cancel viewing</button><button type="button" class="b primary" data-asave="' + a.id + '" data-k="so-asave">Save outcome</button>' : '<span class="why">This viewing is closed.</span><button type="button" class="b" data-new="appt" data-for="' + a.id + '">Book another viewing</button>') + '</div>';
  };
  RENDER.service = function (s) {
    var si = SST.indexOf(s.stage), f = FLOW[s.id] || (FLOW[s.id] = { step: s.stage === 'received' || s.stage === 'diagnosis' ? 1 : 2, checks: (s.dx && s.dx.checks) || [], finding: (s.dx && s.dx.finding) || '', lines: s.lines ? s.lines.slice() : [[ISSUE_LINE[s.issue] || s.issue, s.quote || 0]], cover: !!s.warranty && s.issue !== 'Strap replacement' && s.issue !== 'Polish and pressure test', via: 'Email', closing: '' });
    var flowOpen = si <= 2 && !s.sentAt;
    var mini = '<div class="mini-stages" aria-hidden="true">' + SST.map(function (x, i) { return '<i class="' + (i < si ? 'on' : i === si ? 'cur' : '') + '"></i>'; }).join('') + '</div><div class="mini-lab"><span>Received ' + dshort(T(s.at)) + '</span><span>Stage ' + (si + 1) + ' of 8 · ' + SL[s.stage] + '</span></div>';
    var flow;
    if (flowOpen) {
      var tot = f.lines.reduce(function (a, l) { return a + (+l[1] || 0); }, 0), pay = f.cover ? 0 : tot;
      var steps = '<div class="steps2" role="list">' + [[1, 'Diagnose'], [2, 'Quote'], [3, 'Send']].map(function (x, i) { return (i ? '<span class="arr" aria-hidden="true">→</span>' : '') + '<button type="button" role="listitem" data-step="' + x[0] + '" data-k="step:' + x[0] + '" class="' + (f.step > x[0] ? 'done' : '') + '"' + (f.step === x[0] ? ' aria-current="step"' : '') + '><i>' + (f.step > x[0] ? '✓' : x[0]) + '</i>' + x[1] + '</button>'; }).join('') + '</div>';
      var body;
      if (f.step === 1) body = '<div class="checks" role="group" aria-label="Bench checks">' + ['Timegrapher in five positions', 'Amplitude, dial up and crown down', 'Pressure test at 5 bar', 'Crystal, gaskets and crown seal'].map(function (c, i) { return '<label><input type="checkbox" data-chk="' + i + '"' + (f.checks.indexOf(i) > -1 ? ' checked' : '') + '>' + c + '</label>'; }).join('') + '</div><div class="fl"><label for="fx">What you found</label><textarea class="inp2" id="fx" data-k="fx" placeholder="e.g. Amplitude 212° dial up, mainspring tired; rate −38 s/day">' + esc(f.finding) + '</textarea><p class="er" id="fx-e"></p></div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button type="button" class="b dark" data-fgo="2">Continue to quote <span class="ar" aria-hidden="true">→</span></button></div>';
      else if (f.step === 2) body = '<div class="qlines">' + f.lines.map(function (l, i) { return '<div class="qline"><label class="sr" for="ql-t' + i + '">Line ' + (i + 1) + '</label><input class="inp2" id="ql-t' + i + '" data-ql="' + i + '" data-qf="0" data-k="ql:' + i + ':0" value="' + esc(l[0]) + '"><label class="sr" for="ql-a' + i + '">Amount for line ' + (i + 1) + '</label><input class="inp2" id="ql-a' + i + '" data-ql="' + i + '" data-qf="1" data-k="ql:' + i + ':1" inputmode="numeric" value="' + (l[1] || '') + '" placeholder="₹"><button type="button" class="ib" data-qldel="' + i + '" aria-label="Remove line ' + (i + 1) + '"' + (f.lines.length < 2 ? ' disabled' : '') + '>' + ic('x') + '</button></div>'; }).join('') + '</div><button type="button" class="add" data-qladd>+ Add a line</button><p class="hint2" style="margin-top:4px">Pressure test and a 72-hour run on the winding machine are always included.</p>' + (s.warranty ? '<label class="togg"><input type="checkbox" data-cover' + (f.cover ? ' checked' : '') + '>Covered under warranty: client pays nothing</label>' : '') + '<div class="qtotal"><span>Client pays' + (f.cover ? ' <span class="tc ok">warranty</span>' : '') + '</span><b id="qtot">' + inr(pay) + '</b></div><p class="er" id="ql-e"></p><div style="display:flex;justify-content:space-between;margin-top:10px"><button type="button" class="b ghost" data-fgo="1">Back</button><button type="button" class="b dark" data-fgo="3">Preview the message <span class="ar" aria-hidden="true">→</span></button></div>';
      else body = '<div class="fl"><span class="lb" id="via-l">Send by</span><div class="seg2" role="group" aria-labelledby="via-l">' + ['Email', 'WhatsApp'].map(function (v) { return '<button type="button" data-via="' + v + '" aria-pressed="' + (f.via === v) + '">' + v + '</button>'; }).join('') + '</div></div><p class="lb" style="font-size:12.5px;font-weight:500;margin:14px 0 6px">Message preview</p><div class="msg">' + esc(quoteMsg(s, f)) + '</div><div class="fl" style="margin-top:14px"><label for="fclose">Closing note for the next person <small>(optional)</small></label><textarea class="inp2" id="fclose" data-k="fclose" placeholder="e.g. Client wants the cognac strap kept; call before courier">' + esc(f.closing) + '</textarea></div><div style="display:flex;justify-content:space-between;margin-top:12px"><button type="button" class="b ghost" data-fgo="2">Back</button><button type="button" class="b primary" data-fsend="' + s.id + '">' + ic('send') + 'Send quote</button></div>';
      flow = '<section class="so-sec" id="flow"><h3>Quote</h3>' + steps + '<div class="flow">' + body + '</div></section>';
    } else {
      flow = s.sentAt || s.stage !== 'received' ? '<section class="so-sec"><h3>Quote</h3><dl class="props"><dt>Amount</dt><dd><b>' + inr(s.quote || 0) + '</b>' + (s.cover ? ' <span class="tc ok">covered by warranty</span>' : '') + '</dd>' + (s.sentAt ? '<dt>Sent</dt><dd>' + dlong(T(s.sentAt)) + ' by ' + esc(s.sentVia || 'Email') + '</dd>' : '') + (s.dx && s.dx.finding ? '<dt>Finding</dt><dd>' + esc(s.dx.finding) + '</dd>' : '') + '<dt>Status</dt><dd>' + (si > 2 ? 'Approved by the client' : 'Waiting on the client') + '</dd></dl></section>' : '';
    }
    var nxt = SNEXT[s.stage], footer;
    if (s.stage === 'received') footer = '<span class="why">' + SD.diagnosis + '</span><button type="button" class="b primary" data-smove="' + s.id + '" data-to="diagnosis" data-k="smove">Start diagnosis <span class="ar" aria-hidden="true">→</span></button>';
    else if (flowOpen) footer = '<span class="why">Work through Diagnose → Quote → Send above.</span>' + (s.stage === 'quote' ? '<button type="button" class="b" data-smove="' + s.id + '" data-to="approved">Approved by phone</button>' : '');
    else if (nxt) footer = '<span class="why">' + SD[SST[si + 1]] + '</span><button type="button" class="b primary" data-smove="' + s.id + '" data-to="' + SST[si + 1] + '" data-k="smove">' + esc(nxt) + ' <span class="ar" aria-hidden="true">→</span></button>';
    else footer = '<span class="why">Returned to the client. Next service due in five to seven years.</span>';
    return soHead(s, st(s.stage, SL[s.stage]) + dueChip(s) + (s.warranty ? tc('wty', 'warranty', false) : '')) +
      '<div class="so-b"><div class="so-title">' + watchSvg({ model: s.model }) + '<div><h2 id="so-h">' + esc(s.customer) + '</h2><p>' + esc(M(s.model).name) + ' · <span class="mono">' + esc(s.serial) + '</span> · ' + esc(s.issue) + '</p></div></div>' + mini + calloutHTML(s) +
      '<section class="so-sec"><h3>Ticket</h3><dl class="props"><dt>Issue</dt><dd>' + esc(s.issue) + '</dd><dt>Client says</dt><dd>“' + esc(s.detail) + '”</dd><dt>Logistics</dt><dd>' + esc(s.logistics) + '</dd><dt><label for="so-tech">Technician</label></dt><dd><select class="selx" id="so-tech" data-k="so-tech" data-sotech="' + s.id + '">' + STAFF.map(function (x) { return '<option' + (x === s.tech ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select></dd><dt><label for="so-due">Promised by</label></dt><dd><input class="inp2" type="date" id="so-due" data-k="so-due" data-sodue="' + s.id + '" value="' + isoDate(T(s.due)) + '" style="width:auto"></dd><dt>Client</dt><dd>' + esc(s.email) + ' · ' + esc(s.phone) + '</dd>' + (fromChat(s) ? '<dt>Source</dt><dd>The concierge chat' + (s.convo ? ' <a class="tlink" href="#inbox?c=' + encodeURIComponent(s.convo) + '">Transcript</a>' : '') + '</dd>' : '') + '</dl></section>' +
      flow + notesHTML(s) + '</div><div class="so-f">' + footer + '</div>';
  };
  function quoteMsg(s, f) {
    var tot = f.lines.reduce(function (a, l) { return a + (+l[1] || 0); }, 0);
    var days = s.issue === 'Full service' ? 21 : s.issue === 'Strap replacement' ? 3 : 10;
    return 'Dear ' + first(s.customer) + ',\n\nYour ' + M(s.model).name + ' (' + s.serial + ') has been through diagnosis at the atelier.' + (f.finding ? ' ' + f.finding.replace(/\.?$/, '.') : '') + '\n\nWe recommend: ' + f.lines.filter(function (l) { return l[0]; }).map(function (l) { return l[0] + ' (' + inr(+l[1] || 0) + ')'; }).join('; ') + '. ' + (f.cover ? 'This is covered by your Ghatika warranty, so there is nothing to pay.' : 'Total ' + inr(tot) + ', including GST, a pressure test and a 72-hour run before it leaves us.') + '\n\nReply YES to approve and we will begin. It will be back on your wrist in about ' + days + ' days.\n\n' + s.tech + '\nGhatika service bench, Udaipur';
  }
  RENDER.warranty = function (w) {
    var m = M(w.model), end = coverEnd(w), pend = w.status !== 'verified', chk = FLOW[w.id] || (FLOW[w.id] = { c: [] });
    var cert = '<div class="cert">' + rose() + '<svg class="mono-m" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="none" stroke="#7a5c22" stroke-width="1"/><path d="M6.5 13.5h19a9.5 9.5 0 0 1-19 0z" fill="#7a5c22"/><circle cx="16" cy="26.6" r="1.3" fill="#7a5c22"/></svg><p class="ck">Ghatika · Udaipur</p><h3>Certificate of origin and warranty</h3><p class="model">' + esc(m.name) + ' · ' + esc(m.ref) + '</p>' +
      '<dl><div><dt>Serial</dt><dd class="mono">' + esc(w.serial) + '</dd></div><div><dt>Owner</dt><dd>' + esc(w.customer) + '</dd></div><div><dt>Purchased</dt><dd>' + dfull(T(w.bought)) + '</dd></div><div><dt>Boutique</dt><dd>' + esc(bqName(w.boutique)) + '</dd></div><div><dt>Movement</dt><dd>' + esc(m.specs[1][1].split(' · ')[0]) + '</dd></div><div><dt>Cover</dt><dd>' + (w.years === 8 ? 'Eight' : 'Five') + ' years, until ' + dfull(end) + '</dd></div></dl>' +
      '<div class="sig"><span>Assembled, regulated in five positions and cased by one watchmaker at the atelier on Lal Ghat.</span><span style="text-align:right"><b>' + esc(pend ? '—' : sigName(w.verifiedBy || 'Anjali Purohit')) + '</b>' + (pend ? 'Awaiting verification' : 'Verified ' + dshort(T(w.verifiedAt || w.registered))) + '</span></div><span class="stamp' + (pend ? ' p' : '') + '">' + (pend ? (w.status === 'query' ? 'Invoice requested' : 'Pending') : 'Verified') + '</span></div>';
    var ver = pend ? '<section class="so-sec"><h3>Verify</h3><div class="checks" role="group" aria-label="Verification checks">' + ['Serial matches the movement register', 'Invoice or boutique receipt is on file', 'Caseback number photographed and matched'].map(function (c, i) { return '<label><input type="checkbox" data-wchk="' + i + '"' + (chk.c.indexOf(i) > -1 ? ' checked' : '') + '>' + c + '</label>'; }).join('') + '</div><p class="hint2" id="wv-why">' + (chk.c.length === 3 ? 'All three checks done. Ready to verify.' : 'Tick all three checks to verify. ' + (3 - chk.c.length) + ' to go.') + '</p></section>' : '';
    return soHead(w, st(w.status, WL[w.status]) + webChip(w)) +
      '<div class="so-b"><div class="so-title">' + watchSvg({ model: w.model }) + '<div><h2 id="so-h">' + esc(w.customer) + '</h2><p>' + esc(m.name) + ' · ' + esc(w.city) + ' · registered ' + rel(T(w.registered)) + '</p></div></div>' + calloutHTML(w) +
      '<section class="so-sec"><h3>Digital certificate ' + (pend ? '<span class="tag">Preview</span>' : '') + '</h3>' + cert + '</section>' + ver +
      '<section class="so-sec"><h3>Owner</h3><dl class="props"><dt>Email</dt><dd>' + esc(w.email) + '</dd><dt>City</dt><dd>' + esc(w.city) + '</dd><dt>Registered</dt><dd>' + dfull(T(w.registered)) + '</dd></dl></section>' + notesHTML(w) + '</div>' +
      '<div class="so-f">' + (pend ? (w.status === 'pending' ? '<button type="button" class="b" data-wquery="' + w.id + '">Ask for invoice</button>' : '') + '<button type="button" class="b primary" data-wverify="' + w.id + '" data-k="wverify"' + (chk.c.length < 3 ? ' aria-disabled="true"' : '') + ' aria-describedby="wv-why">Verify warranty</button>' : '<button type="button" class="b" data-print>' + ic('print') + 'Print certificate</button><button type="button" class="b primary" data-wsend="' + w.id + '">' + ic('send') + 'Email to owner</button>') + '</div>';
  };

  // slide-over interactions
  SO.el.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    var c = SO.ctx; if (!c) return;
    if (t.classList.contains('so-x')) { closeSO(); return; }
    var d = t.dataset;
    if (d.new) { openForm(d.new, d['for'] ? { forAppt: d['for'] } : null); return; }
    if (d.go) { closeSO(true); go(d.go); return; }
    if (d.open) { openRecord(d.open); return; }
    if (d.addnote) { var ta = $('#so-note'), v = ta.value.trim(); if (!v) { $('#so-note-e').textContent = 'Write something first: a preference, a promise, a phone call.'; ta.setAttribute('aria-invalid', 'true'); ta.focus(); return; } change(c.type, [d.addnote], function (x) { addNote(x, v); log('Note on ' + first(nm(x)) + ': “' + v + '”', x.id, 'note'); }, 'Note added.'); var nn = $('#so-note'); if (nn) nn.focus(); return; }
    if (d.oadv) { var o = byId('orders', d.oadv), to = OST[OST.indexOf(o.status) + 1]; change('orders', [o.id], function (x) { setOrderStatus(x, to); log(x.id + ': ' + OL[o.status] + ' → ' + OL[to], x.id, 'orders'); }, o.id + ' moved to ' + OL[to] + '.'); return; }
    if (d.aconfirm) { change('appts', [d.aconfirm], function (x) { x.status = 'confirmed'; log('Confirmed ' + first(x.customer) + '’s viewing, ' + dlong(T(x.at)) + ' ' + hm(T(x.at)), x.id, 'appointments'); }, 'Viewing confirmed. A confirmation goes out by email and WhatsApp.'); return; }
    if (d.acancel) { cancelAppt(d.acancel); return; }
    if (d.asave) { var a = byId('appts', d.asave), p = PEND[a.id], err = applyOutcome(JSON.parse(JSON.stringify(a)), p, true); if (err) { $('#og-e').textContent = err; return; } change('appts', [a.id], function (x) { applyOutcome(x, p); }, 'Outcome saved for ' + first(a.customer) + '.'); delete PEND[a.id]; return; }
    if (d.resched) {
      var a2 = byId('appts', d.resched), dv = $('#rs2-d').value, sv = $('#rs2-s').value, e2 = applyOutcome(JSON.parse(JSON.stringify(a2)), { o: 'rescheduled', date: dv, slot: sv }, true);
      if (e2) { $('#rs2-e').textContent = e2; return; }
      change('appts', [a2.id], function (x) { applyOutcome(x, { o: 'rescheduled', date: dv, slot: sv }); }, 'Moved to ' + dlong(new Date(dv + 'T' + sv).getTime()) + ', ' + sv + '. The client gets a new confirmation.'); return;
    }
    if (d.smove) { var s = byId('service', d.smove); change('service', [s.id], function (x) { setStage(x, d.to); }, s.id + ' moved to ' + SL[d.to] + '.'); return; }
    if (d.step || d.fgo) { flowGo(c.id, +(d.step || d.fgo)); return; }
    if (d.qladd !== undefined && t.hasAttribute('data-qladd')) { FLOW[c.id].lines.push(['', '']); paintSO(); var nl = $('[data-k="ql:' + (FLOW[c.id].lines.length - 1) + ':0"]'); if (nl) nl.focus(); return; }
    if (d.qldel) { FLOW[c.id].lines.splice(+d.qldel, 1); paintSO(); return; }
    if (d.via) { FLOW[c.id].via = d.via; paintSO(); return; }
    if (d.fsend) { sendQuote(d.fsend); return; }
    if (d.wverify) { var w = byId('warranty', d.wverify), ck = FLOW[w.id]; if (!ck || ck.c.length < 3) { var why = $('#wv-why'); why.textContent = 'Tick all three checks to verify. ' + (3 - (ck ? ck.c.length : 0)) + ' to go.'; why.style.color = 'var(--bad-t)'; return; } change('warranty', [w.id], function (x) { x.status = 'verified'; x.verifiedBy = ME; x.verifiedAt = new Date().toISOString(); log('Verified warranty for ' + x.serial + ' (' + first(x.customer) + ')', x.id, 'warranty'); }, 'Warranty ' + w.serial + ' verified. Certificate issued.'); return; }
    if (d.wquery) { change('warranty', [d.wquery], function (x) { x.status = 'query'; log('Asked ' + first(x.customer) + ' for the purchase invoice', x.id, 'send'); }, 'Invoice requested from the owner.'); return; }
    if (d.wsend) { var w2 = byId('warranty', d.wsend); log('Emailed the certificate for ' + w2.serial + ' to ' + first(w2.customer), w2.id, 'send'); G.toast('Certificate emailed to ' + w2.email + '.'); refresh(); return; }
    if (t.hasAttribute('data-print')) { window.print(); return; }
    if (d.out || d.sugg || d.reason) { outcomeClick(t); return; }
  });
  SO.el.addEventListener('change', function (e) {
    var t = e.target, c = SO.ctx; if (!c) return;
    if (t.dataset.soown) { change('orders', [c.id], function (x) { x.owner = t.value; }, c.id + ' is now with ' + t.value + '.'); return; }
    if (t.dataset.sohost) { change('appts', [c.id], function (x) { x.host = t.value; }, t.value + ' will host ' + first(byId('appts', c.id).customer) + '.'); return; }
    if (t.dataset.sotech) { change('service', [c.id], function (x) { x.tech = t.value; }, c.id + ' is now on ' + first(t.value) + '’s bench.'); return; }
    if (t.dataset.sodue) { if (!t.value) return; var nd = new Date(t.value + 'T18:00').getTime(); change('service', [c.id], function (x) { x.due = new Date(nd).toISOString(); }, 'Promise date moved to ' + dlong(nd) + '.'); return; }
    if (t.dataset.chk !== undefined) { var f = FLOW[c.id], i = +t.dataset.chk; if (t.checked) { if (f.checks.indexOf(i) < 0) f.checks.push(i); } else f.checks = f.checks.filter(function (x) { return x !== i; }); return; }
    if (t.hasAttribute('data-cover')) { FLOW[c.id].cover = t.checked; paintSO(); return; }
    if (t.dataset.wchk !== undefined) { var ck = FLOW[c.id], j = +t.dataset.wchk; if (t.checked) { if (ck.c.indexOf(j) < 0) ck.c.push(j); } else ck.c = ck.c.filter(function (x) { return x !== j; }); var b = $('[data-wverify]', SO.el); if (b) b.setAttribute('aria-disabled', ck.c.length < 3 ? 'true' : 'false'); var why = $('#wv-why'); if (why) { why.style.color = ''; why.textContent = ck.c.length === 3 ? 'All three checks done. Ready to verify.' : 'Tick all three checks to verify. ' + (3 - ck.c.length) + ' to go.'; } return; }
    if (t.dataset.rs) { var p = PEND[t.dataset.aid] = PEND[t.dataset.aid] || {}; p[t.dataset.rs] = t.value; return; }
  });
  SO.el.addEventListener('input', function (e) {
    var t = e.target, c = SO.ctx; if (!c) return;
    if (t.id === 'fx') FLOW[c.id].finding = t.value;
    if (t.id === 'fclose') FLOW[c.id].closing = t.value;
    if (t.dataset.ql !== undefined) { var f = FLOW[c.id]; f.lines[+t.dataset.ql][+t.dataset.qf] = t.dataset.qf === '1' ? String(t.value).replace(/[^\d]/g, '') : t.value; var tot = f.lines.reduce(function (a, l) { return a + (+l[1] || 0); }, 0); var q = $('#qtot'); if (q) q.textContent = inr(f.cover ? 0 : tot); }
    if (t.id === 'so-note' || t.id === 'fx') { t.removeAttribute('aria-invalid'); var er = $('#' + t.id + '-e'); if (er) er.textContent = ''; }
  });
  function flowGo(id, step) {
    var f = FLOW[id];
    if (step > 1 && f.step === 1) {
      if (!f.checks.length) { $('#fx-e').textContent = 'Tick at least one bench check, so the next person knows what was tested.'; return; }
      if ((f.finding || '').trim().length < 8) { $('#fx-e').textContent = 'Write one line on what you found, for example “Amplitude 212° dial up, mainspring tired”.'; var fx = $('#fx'); fx.setAttribute('aria-invalid', 'true'); fx.focus(); return; }
    }
    if (step > 2 && f.step === 2) {
      var bad = f.lines.filter(function (l) { return !String(l[0]).trim() || !(+l[1] > 0); });
      if (!f.lines.length || bad.length) { $('#ql-e').textContent = 'Every line needs a description and an amount in rupees. Remove lines you don’t need.'; return; }
    }
    f.step = Math.min(step, 3); paintSO(); var cs = $('[aria-current="step"]', SO.el); if (cs) cs.focus();
  }
  function sendQuote(id) {
    var f = FLOW[id], tot = f.lines.reduce(function (a, l) { return a + (+l[1] || 0); }, 0);
    change('service', [id], function (x) {
      x.dx = { checks: f.checks.slice(), finding: f.finding.trim() }; x.lines = f.lines.map(function (l) { return [l[0], +l[1] || 0]; }); x.quote = tot; x.cover = f.cover;
      x.sentAt = new Date().toISOString(); x.sentVia = f.via; if (x.stage !== 'quote') setStage(x, 'quote');
      log('Sent quote ' + inr(x.quote) + ' to ' + first(x.customer) + ' by ' + f.via + ' (' + x.id + ')', x.id, 'send');
      addNote(x, f.closing.trim());
    }, 'Quote sent to ' + first(byId('service', id).customer) + ' by ' + f.via + '.', function () { delete FLOW[id]; });
    delete FLOW[id]; if (Q) { Q.done['quote:' + id] = 1; }
  }
  function cancelAppt(id) {
    var a = byId('appts', id), reason = 'Not given';
    dialog({
      title: 'Cancel ' + first(a.customer) + '’s viewing?', sub: dlong(T(a.at)) + ', ' + hm(T(a.at)) + ' at ' + bqName(a.boutique) + '. The slot opens for others.',
      body: '<div class="fl"><span class="lb" id="cr-l">Reason</span><div class="seg2" role="group" aria-labelledby="cr-l">' + ['Travel plans', 'Bought elsewhere', 'Price', 'Not given'].map(function (x) { return '<button type="button" data-cr="' + x + '" aria-pressed="' + (x === reason) + '">' + x + '</button>'; }).join('') + '</div></div>',
      ok: 'Cancel viewing', danger: true, cancel: 'Keep it',
      onMount: function (d) { d.addEventListener('click', function (e) { var b = e.target.closest('[data-cr]'); if (!b) return; reason = b.dataset.cr; $$('[data-cr]', d).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }); },
      onOk: function () { change('appts', [id], function (x) { x.status = 'cancelled'; x.cancelReason = reason; log('Cancelled ' + first(x.customer) + '’s viewing (' + reason.toLowerCase() + ')', x.id, 'cancel'); }, 'Viewing cancelled.'); }
    });
  }
  function outcomeClick(t) {
    var id = t.dataset.aid, p = PEND[id] = PEND[id] || {};
    if (t.dataset.out) { p.o = p.o === t.dataset.out ? '' : t.dataset.out; }
    else if (t.dataset.reason) p.reason = t.dataset.reason;
    else if (t.dataset.sugg === 'follow') p.follow = p.follow === false;
    else if (t.dataset.sugg === 'link') p.link = p.link === false;
    else if (t.dataset.sugg === 'order') {
      var a = byId('appts', id);
      var err = applyOutcome(JSON.parse(JSON.stringify(a)), { o: 'bought' }, true); if (err) { fcWhy(err); var oe = $('#og-e'); if (oe) oe.textContent = err; return; }
      if (Q && Q.jobs[Q.i] && Q.jobs[Q.i].id === id) Q.done[Q.jobs[Q.i].key] = 1;
      change('appts', [id], function (x) { applyOutcome(x, { o: 'bought' }); }, 'Marked as bought. Drafting the order…');
      delete PEND[id];
      if (cur === 'today') advance();
      openForm('order', { customer: a.customer, email: a.email, model: a.interest, owner: a.host, note: 'From the viewing at ' + bq(a.boutique).name + ' on ' + dshort(T(a.at)) });
      return;
    }
    keepFocus(function () { if (cur === 'today') paintFocus(); paintSO(); });
    var k = t.getAttribute('data-k'); if (k) { var n = document.querySelector('[data-k="' + cssq(k) + '"]'); if (n) n.focus({ preventScroll: true }); }
    var w = $('#og-e'); if (w) w.textContent = '';
  }

  // ================================================================== CONCIERGE ENQUIRIES (leads from the chat)
  P.chat = '<path d="M4.5 5.5h15v10h-8l-4.5 3.5v-3.5h-2.5z"/><path d="M8.5 9.5h7M8.5 12.5h4"/>';
  P.dots = '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>';
  P.phone = '<path d="M6.5 4h3l1.5 4-2 1.5a10 10 0 0 0 5.5 5.5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 5 5.6 1.5 1.5 0 0 1 6.5 4z"/>';
  P.noanswer = '<path d="M6.5 4h3l1.5 4-2 1.5a10 10 0 0 0 5.5 5.5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 5 5.6 1.5 1.5 0 0 1 6.5 4z"/><path d="M15 4l5 5M20 4l-5 5"/>';
  P.wa = '<path d="M5 19l1.2-3.6A7.5 7.5 0 1 1 9 18.3z"/><path d="M9.5 9.5c.5 2 2 3.5 4 4l1-1.2 1.6.8-.3 1.3c-3 .3-6.5-3-6.2-6.2l1.3-.3.8 1.6z"/>';
  var EL = { 'new': 'New', called: 'Called back', booked: 'Viewing booked', closed: 'Closed' };
  function enqCfg(e) { var i = e.interest || {}, m = M(i.model || 'prahar'); var c = { model: m.id, dial: i.dial || m.sig.dial, metal: i.metal || m.sig.metal, strap: i.strap || m.sig.strap }; if (c.strap === 'bracelet' && (c.metal === 'rose' || c.metal === 'yellow')) c.strap = m.sig.strap; return c; }
  function enqLine(e) { var c = enqCfg(e); return M(c.model).name + ' · ' + G.optName('DIALS', c.dial) + ' · ' + G.optName('METALS', c.metal); }
  function openEnq() { return DB.enquiries.filter(function (e) { return e.status === 'new' || e.status === 'called'; }).sort(function (a, b) { return (a.status === 'new' ? 0 : 1) - (b.status === 'new' ? 0 : 1) || T(b.at) - T(a.at); }); }
  function paintEnq() {
    var el = $('#t-enq'); if (!el) return;
    var list = openEnq(), nNew = list.filter(function (e) { return e.status === 'new'; }).length;
    el.innerHTML = '<div class="qhead"><h2 id="enq-h">' + ic('chat') + 'Concierge enquiries</h2><p>' + (list.length ? nNew + ' to call back · ' + (list.length - nNew) + ' waiting on a viewing' : 'Nobody is waiting on a call-back') + '</p></div>' +
      (list.length ? '<ul class="enq">' + list.map(function (e) {
        var c = enqCfg(e);
        return '<li><span class="enq-w">' + watchSvg(c) + '</span><span class="enq-m"><button type="button" class="rowopen" data-open="' + e.id + '" data-k="eo:' + e.id + '">' + esc(e.name) + '</button><span class="c-sub">' + esc(enqLine(e)) + (e.budget ? ' · ' + esc(e.budget) : '') + '</span><span class="enq-c">' + tc(e.status === 'new' ? (dayDiff(T(e.at)) < 0 ? 'over' : 'soon') : '', (e.status === 'new' ? 'asked ' : 'called ') + ago(T(e.status === 'called' && e.calledAt ? e.calledAt : e.at))) + webChip(e) + '</span></span>' +
          '<span class="enq-a">' + (e.status === 'new' ? '<button type="button" class="b sm primary" data-ecall="' + e.id + '" data-k="ec:' + e.id + '">' + ic('phone') + 'Call back</button>' : '<button type="button" class="b sm" data-ebook="' + e.id + '" data-k="eb:' + e.id + '">Book viewing</button>') +
          '<button type="button" class="ib kebab" data-emenu="' + e.id + '" data-k="em:' + e.id + '" aria-label="More for ' + esc(e.name) + '" aria-haspopup="menu" aria-expanded="false">' + ic('dots') + '</button></span></li>';
      }).join('') + '</ul>' : '<div class="void"><p>No open enquiries. When the concierge hands a client over, they land here with the whole conversation.</p></div>');
  }
  function enqCall(id) { change('enquiries', [id], function (x) { x.status = 'called'; x.calledAt = new Date().toISOString(); x.calledBy = ME; log('Called back ' + first(x.name) + ' about the ' + M((x.interest || {}).model).name, x.id, 'phone'); }, 'Call-back logged for ' + first(byId('enquiries', id).name) + '.'); if (Q) Q.done['enq:' + id] = 1; }
  function enqBook(id) { var e = byId('enquiries', id); if (!e) return; openForm('appt', { customer: e.name, email: e.email, interest: (e.interest || {}).model, enq: e.id, convo: e.convo, note: [e.occasion, e.wrist ? 'wrist ' + e.wrist : '', e.budget ? 'budget ' + e.budget : ''].filter(Boolean).join(' · ') }); }
  function enqClose(id) { change('enquiries', [id], function (x) { x.status = 'closed'; log('Closed the enquiry from ' + first(x.name), x.id, 'check'); }, 'Enquiry closed.'); }
  function enqReopen(id) { change('enquiries', [id], function (x) { x.status = 'new'; }, 'Enquiry reopened.'); }
  RENDER.enquiries = function (e) {
    var c = enqCfg(e), m = M(c.model), foot;
    if (e.status === 'new') foot = '<button type="button" class="b ghost" data-eclose="' + e.id + '">Close enquiry</button><button type="button" class="b primary" data-ecall="' + e.id + '" data-k="so-ec">' + ic('phone') + 'Log call-back</button>';
    else if (e.status === 'called') foot = '<button type="button" class="b ghost" data-eclose="' + e.id + '">Close enquiry</button><button type="button" class="b primary" data-ebook="' + e.id + '" data-k="so-eb">Book a viewing <span class="ar" aria-hidden="true">→</span></button>';
    else if (e.status === 'booked') foot = '<span class="why">Viewing booked' + (e.bookedAppt ? ' · ' + esc(e.bookedAppt) : '') + '.</span>' + (e.bookedAppt ? '<button type="button" class="b" data-open="' + e.bookedAppt + '">Open the viewing</button>' : '');
    else foot = '<span class="why">Closed.</span><button type="button" class="b" data-ereopen="' + e.id + '">Reopen</button>';
    return soHead(e, st(e.status === 'new' ? 'requested' : e.status === 'called' ? 'confirmed' : e.status === 'booked' ? 'visited' : 'cancelled', EL[e.status]) + webChip(e)) +
      '<div class="so-b"><div class="so-title"><div><h2 id="so-h">' + esc(e.name) + '</h2><p>Concierge enquiry · asked ' + ago(T(e.at)) + (e.calledAt ? ' · called back ' + ago(T(e.calledAt)) : '') + '</p></div></div>' + calloutHTML(e) +
      '<section class="so-sec"><h3>Interested in</h3><div class="cfg-card">' + watchSvg(c) + '<div><h4>' + esc(m.name) + ' <span class="ref">' + esc(m.ref) + '</span></h4><p>' + esc(G.cfgLine(c)) + '</p><p>' + esc(m.line) + '</p><p class="amt">' + inr(D.price(c)) + '</p></div></div></section>' +
      '<section class="so-sec"><h3>What they told the concierge</h3><dl class="props"><dt>Budget</dt><dd>' + (e.budget ? esc(e.budget) : '<span class="hint2">Not given</span>') + '</dd><dt>Wrist</dt><dd>' + (e.wrist ? esc(e.wrist) : '<span class="hint2">Not given</span>') + '</dd><dt>Occasion</dt><dd>' + (e.occasion ? esc(e.occasion) : '<span class="hint2">Not given</span>') + '</dd><dt>Phone</dt><dd>' + esc(e.phone || 'Not given') + '</dd><dt>Email</dt><dd>' + esc(e.email || 'Not given') + '</dd><dt>Conversation</dt><dd>' + (e.convo ? '<a class="tlink" href="#inbox?c=' + encodeURIComponent(e.convo) + '">Open the transcript</a>' : '—') + '</dd></dl></section>' +
      notesHTML(e) + '</div><div class="so-f">' + foot + '</div>';
  };
  // a small "⋯" menu for secondary actions on a row
  function rowMenu(btn, items) {
    closePop(false);
    var pop = document.createElement('div'); pop.className = 'pop rowpop'; pop.setAttribute('role', 'menu'); pop.dataset.tmp = '1';
    pop.innerHTML = items.map(function (it, i) { return '<button type="button" role="menuitem" data-ri="' + i + '">' + (it.icon ? ic(it.icon) : '') + esc(it.label) + '</button>'; }).join('');
    document.body.appendChild(pop);
    var r = btn.getBoundingClientRect();
    pop.style.position = 'fixed'; pop.style.right = 'auto';
    pop.style.top = Math.max(8, Math.min(innerHeight - pop.offsetHeight - 8, r.bottom + 6)) + 'px';
    pop.style.left = Math.max(8, Math.min(innerWidth - pop.offsetWidth - 8, r.right - pop.offsetWidth)) + 'px';
    pop.addEventListener('click', function (e) { var b = e.target.closest('[data-ri]'); if (!b) return; closePop(false); items[+b.dataset.ri].run(); });
    btn.setAttribute('aria-expanded', 'true'); POP = { btn: btn, pop: pop };
    var f = $('[role="menuitem"]', pop); if (f) f.focus();
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return; var d = t.dataset;
    if (d.ecall) { enqCall(d.ecall); return; }
    if (d.ebook) { enqBook(d.ebook); return; }
    if (d.eclose) { enqClose(d.eclose); return; }
    if (d.ereopen) { enqReopen(d.ereopen); return; }
    if (d.emenu) { var en = byId('enquiries', d.emenu); if (!en) return; rowMenu(t, [{ label: 'Book a viewing', icon: 'appointments', run: function () { enqBook(en.id); } }, { label: 'Open the transcript', icon: 'chat', run: function () { go('inbox?c=' + encodeURIComponent(en.convo || '')); } }, { label: 'Open the enquiry', icon: 'ext', run: function () { openRecord(en.id); } }, { label: 'Close enquiry', icon: 'x', run: function () { enqClose(en.id); } }]); return; }
  });

  // ================================================================== CONFIRM VIEWINGS (a call queue in focus mode)
  var CQ = null, CP = {}, CNOTE = {};
  var COUT = [['confirmed', 'Confirmed', 'check'], ['moved', 'Moved', 'resched'], ['noanswer', 'No answer', 'noanswer'], ['cancelled', 'Cancelled', 'cancel']];
  var CLAB = { confirmed: 'Confirmed', moved: 'Moved', noanswer: 'No answer', cancelled: 'Cancelled' };
  function buildCQ() { var t0 = sod(Date.now()); CQ = { ids: inCtx(DB.appts).filter(function (a) { return a.status === 'requested' && T(a.at) >= t0; }).sort(function (a, b) { return T(a.at) - T(b.at); }).map(function (a) { return a.id; }), i: 0, res: {}, skip: {}, ctx: CTX, last: null }; }
  function cqSettled(id) { var a = byId('appts', id); return !!(CQ.res[id] || CQ.skip[id] || !a || a.status !== 'requested'); }
  function cqNext(from) { var n = CQ.ids.length; for (var s = 1; s <= n; s++) { var k = (from + s) % n; if (!cqSettled(CQ.ids[k])) return k; } return -1; }
  function cqTally() { var t = { confirmed: 0, moved: 0, noanswer: 0, cancelled: 0 }; Object.keys(CQ.res).forEach(function (k) { t[CQ.res[k]]++; }); return t; }
  function nextTry() { var d = new Date(), h = d.getHours(); if (h < 13) { d.setHours(13, 30, 0, 0); } else if (h < 18) { d.setHours(18, 0, 0, 0); } else { d.setDate(d.getDate() + 1); d.setHours(11, 0, 0, 0); } return d.getTime(); }
  VIEWS.confirm = {
    mount: function (el) {
      if (!CQ || CQ.ctx !== CTX) buildCQ();
      el.innerHTML = '<div class="vh"><div><h1>Confirm viewings</h1><p class="sub" id="c-sub"></p></div><div class="vh-r"><button type="button" class="b" data-go="appointments">' + ic('appointments') + 'Open the diary</button></div></div>' +
        '<div class="today-grid"><section class="focus" id="cfocus" aria-labelledby="cf-h"></section><div class="col-r"><section class="card" id="c-script" aria-labelledby="cs-h"></section><section class="card" id="c-list" aria-labelledby="cl-h"></section></div></div>';
      this.paint(true);
    },
    paint: function (initial) {
      var total = CQ.ids.length, tl = cqTally(), done = Object.keys(CQ.res).length;
      if (CQ.i < 0 || CQ.i >= total || cqSettled(CQ.ids[CQ.i])) CQ.i = cqNext(CQ.i >= 0 && CQ.i < total ? CQ.i : -1);
      var tallyTxt = [tl.confirmed + ' confirmed', tl.moved + ' moved', tl.noanswer + ' no answer', tl.cancelled + ' cancelled'].join(' · ');
      $('#c-sub').innerHTML = total ? '<b>' + total + ' request' + (total === 1 ? '' : 's') + '</b> to call · ' + tallyTxt : 'No viewing requests waiting for a call.';
      var top = '<div class="fc-top">' + ring(total ? done / total : 1) + '<span class="k">Confirm viewings</span><span class="n">' + (CQ.i > -1 ? (CQ.i + 1) + ' of ' + total : total + ' of ' + total) + '</span><span class="fc-prog" role="progressbar" aria-label="Calls made" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + done + '"><i style="transform:scaleX(' + (total ? done / total : 1).toFixed(3) + ')"></i></span><span class="fc-left">' + (CQ.i > -1 ? '≈ ' + Math.max(3, (total - done) * 3) + ' m of calls' : 'done') + '</span></div>';
      var el = $('#cfocus');
      if (CQ.i < 0) {
        el.innerHTML = top + '<div class="fc-done fade-in"><h2 id="cf-h">' + (total ? 'Every request has an answer.' : 'No requests to confirm.') + '</h2><p>' + (total ? tallyTxt + '. No-answers come back at the next try.' : 'New requests from the website and the concierge land here.') + '</p><button type="button" class="b ghost lg" data-cf="rebuild">Rebuild the queue</button></div>';
      } else {
        var id = CQ.ids[CQ.i], a = byId('appts', id), t = T(a.at), b = bq(a.boutique), p = CP[id] || {}, ln = lastNote(a), swap = CQ.last !== id && !initial;
        CQ.last = id;
        var sugg = '';
        if (p.o === 'confirmed') sugg = '<div class="sugg"><span class="k">Next</span><span>A confirmation goes out by email and WhatsApp with the address and where to park.</span><button type="button" class="b sm" data-csugg="remind" aria-pressed="' + (p.remind !== false) + '">' + (p.remind !== false ? ic('check') + 'Reminder the day before' : 'Add a reminder') + '</button></div>';
        else if (p.o === 'moved') sugg = '<div class="sugg"><span class="k">New time</span><label class="sr" for="cm-d">New date</label><input class="inp2 rs" type="date" id="cm-d" data-crs="date" data-k="cm-d" min="' + isoDate(Date.now()) + '" value="' + esc(p.date || '') + '"><label class="sr" for="cm-s">Slot</label><select class="inp2 rs" id="cm-s" data-crs="slot" data-k="cm-s"><option value="">Slot</option>' + D.SLOTS.map(function (s) { return '<option' + (p.slot === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div>';
        else if (p.o === 'noanswer') sugg = '<div class="sugg"><span class="k">Next try</span><span>' + (dayDiff(nextTry()) ? 'Tomorrow ' : 'Today ') + hm(nextTry()) + '. Leave a WhatsApp so they can reply in their own time.</span><button type="button" class="b sm" data-csugg="wa" aria-pressed="' + (p.wa !== false) + '">' + (p.wa !== false ? ic('check') + 'WhatsApp queued' : 'Queue WhatsApp') + '</button></div>';
        else if (p.o === 'cancelled') sugg = '<div class="sugg"><span class="k">Reason</span><div class="seg2">' + ['Travel plans', 'Bought elsewhere', 'Price', 'Not given'].map(function (x) { return '<button type="button" data-creason="' + x + '" aria-pressed="' + (p.reason === x) + '">' + x + '</button>'; }).join('') + '</div></div>';
        var props = [['Guests', a.guests + (a.guests > 1 ? ' people' : ' person')], ['Watch', obj(a.interest)], ['Boutique', esc(b.name) + ', ' + esc(b.city)], ['When', dlong(t) + ', ' + hm(t)], ['Host', '<select class="fsel" data-k="cf-host" data-cf-host="' + a.id + '" aria-label="Host">' + STAFF.map(function (s) { return '<option' + (s === a.host ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>'], ['Phone', esc(a.phone)], ['Purpose', esc(a.purpose)], ['Tries', a.attempts ? a.attempts + ', last ' + rel(T(a.lastTry)) : 'First call']];
        el.innerHTML = top + '<div class="fc-body' + (swap ? ' swap' : '') + '">' +
          '<div class="fc-kind"><span class="kd">' + ic('phone') + 'Viewing request</span>' + timeChip(t) + webChip(a) + (a.attempts ? tc('over', a.attempts + (a.attempts > 1 ? ' tries' : ' try'), 'noanswer') : '') + '</div>' +
          (ln ? '<div class="fc-note"><span class="k">Last note · ' + esc(first(ln.by)) + ', ' + rel(T(ln.at)) + '</span><p>' + esc(ln.t) + '</p></div>' : '<div class="fc-note none"><span class="k">Last note</span><p>No notes yet. What you write below lands here for whoever calls next.</p></div>') +
          '<div class="fc-head">' + watchSvg({ model: a.interest }) + '<div><h2 id="cf-h">' + esc(a.customer) + '</h2></div></div>' +
          '<p class="fc-sub">' + esc(a.purpose) + ' · ' + dlong(t) + ' at ' + hm(t) + ' · ' + esc(b.name) + '</p>' +
          '<dl class="fc-props">' + props.map(function (x) { return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('') + '</dl>' +
          '<p class="og-h" id="cog">How did the call go?</p><div class="og og4" role="group" aria-labelledby="cog">' + COUT.map(function (o) { return '<button type="button" data-cout="' + o[0] + '" data-k="co:' + o[0] + '" aria-pressed="' + (p.o === o[0]) + '">' + ic(o[2]) + '<span>' + o[1] + '</span></button>'; }).join('') + '</div>' + sugg +
          '<div class="fc-noteinp"><label for="cf-note">Note for the next person</label><textarea id="cf-note" data-k="cf-note" rows="1" placeholder="e.g. Coming with her father; prefers the corner table by the window">' + esc(CNOTE[id] || '') + '</textarea></div>' +
          '<div class="fc-act"><button type="button" class="b primary" data-cf="save"' + (p.o ? '' : ' aria-disabled="true"') + ' aria-describedby="cf-why">Save &amp; next <span class="ar" aria-hidden="true">→</span></button><button type="button" class="b ghost" data-cf="skip">Skip</button><button type="button" class="b ghost" data-cf="open" aria-label="Open the full viewing">' + ic('ext') + '</button></div>' +
          '<p class="fc-why" id="cf-why" aria-live="polite">' + (p.o ? '' : 'Pick how the call went to save it.') + '</p></div>';
      }
      // call script
      var cs = $('#c-script'), ca = CQ.i > -1 ? byId('appts', CQ.ids[CQ.i]) : null;
      cs.innerHTML = '<div class="qhead"><h2 id="cs-h">' + ic('phone') + 'What to say</h2><p>' + (ca ? 'Calling ' + esc(first(ca.customer)) + ' · ' + esc(ca.phone) : 'Nothing to call right now') + '</p></div>' + (ca ? '<div class="script"><p>“Namaste ' + esc(first(ca.customer)) + ', this is ' + esc(first(ME)) + ' from Ghatika. You asked to see the <b>' + esc(M(ca.interest).name) + '</b> at ' + esc(bq(ca.boutique).name) + ' on <b>' + dlong(T(ca.at)) + ' at ' + hm(T(ca.at)) + '</b>' + (ca.guests > 1 ? ', with a guest' : '') + '. Shall I hold that for you?”</p><ul><li>' + (ca.purpose === 'Configure a commission' ? 'Ask for a wrist measurement and a budget, so the bench can lay out straps.' : ca.purpose === 'Service or repair' ? 'Ask them to bring the box and papers; the watch stays with us.' : 'Offer to lay out the ' + esc(M(ca.interest).name) + ' in two dials before they arrive.') + '</li><li>' + esc(bq(ca.boutique).name) + ' is open ' + esc(bq(ca.boutique).hours) + '.</li><li>If they ask about price: from ' + inr(M(ca.interest).price) + ', built in 38 days.</li></ul></div>' : '');
      // list
      var cl = $('#c-list');
      cl.innerHTML = '<div class="qhead"><h2 id="cl-h">' + ic('appointments') + 'Requests</h2><p>' + done + ' of ' + total + ' called · ' + tallyTxt + '</p><div class="qmeter" aria-hidden="true"><i class="d" style="width:' + (total ? done / total * 100 : 0) + '%"></i></div></div>' +
        (total ? '<ol class="ql">' + CQ.ids.map(function (id2, i) { var x = byId('appts', id2); if (!x) return ''; var r = CQ.res[id2], sk = CQ.skip[id2]; return '<li class="' + (r ? 'done' : sk ? 'skip' : '') + '"' + (i === CQ.i ? ' aria-current="true"' : '') + '><button type="button" data-ci="' + i + '" data-k="ci:' + id2 + '"><span class="qi">' + (r ? ic('check') : i + 1) + '</span><span><span class="qt">' + esc(x.customer) + '</span><span class="qr2">' + dlong(T(x.at)) + ' ' + hm(T(x.at)) + ' · ' + esc(bq(x.boutique).name) + '</span></span>' + (r ? '<span class="tc">' + CLAB[r] + '</span>' : sk ? '<span class="tc">skipped</span>' : '') + '</button></li>'; }).join('') + '</ol>' : '<div class="void"><p>No requests in this boutique.</p></div>');
    }
  };
  function cfAction(k) {
    if (k === 'rebuild') { buildCQ(); refresh(); return; }
    var id = CQ.ids[CQ.i]; if (!id) return; var a = byId('appts', id), idx = CQ.i, ta = $('#cf-note'), note = ta ? ta.value.trim() : '', p = CP[id] || {};
    var why = function (m) { var w = $('#cf-why'); if (w) w.textContent = m; };
    if (k === 'open') { openRecord(id); return; }
    if (k === 'skip') { CQ.skip[id] = 1; CNOTE[id] = note; refresh(); say('Skipped.'); return; }
    if (!p.o) { why('Pick how the call went to save it.'); var g = $('[data-cout]'); if (g) g.focus(); return; }
    if (p.o === 'moved') { var err = applyOutcome(JSON.parse(JSON.stringify(a)), { o: 'rescheduled', date: p.date, slot: p.slot }, true); if (err) { why(err); return; }
      var nt = new Date(p.date + 'T' + p.slot).getTime(); if (DB.appts.some(function (x) { return x.id !== id && x.boutique === a.boutique && x.status !== 'cancelled' && Math.abs(T(x.at) - nt) < 30 * MIN; })) { why(bq(a.boutique).name + ' already has a viewing at ' + p.slot + ' that day. Pick another slot.'); return; } }
    var msg = { confirmed: 'Confirmed: ' + a.customer + ', ' + dlong(T(a.at)) + ' ' + hm(T(a.at)) + '.', moved: 'Moved to ' + (p.date ? dlong(new Date(p.date + 'T12:00').getTime()) : '') + ', ' + p.slot + '.', noanswer: 'No answer logged. Next try ' + hm(nextTry()) + '.', cancelled: 'Viewing cancelled.' }[p.o];
    CQ.res[id] = p.o; delete CNOTE[id];
    change('appts', [id], function (x) {
      if (p.o === 'confirmed') { x.status = 'confirmed'; x.confirmedBy = ME; if (p.remind !== false) x.remindDayBefore = true; log('Confirmed ' + first(x.customer) + '’s viewing by phone, ' + dlong(T(x.at)) + ' ' + hm(T(x.at)), x.id, 'phone'); }
      else if (p.o === 'moved') { applyOutcome(x, { o: 'rescheduled', date: p.date, slot: p.slot }); }
      else if (p.o === 'noanswer') { x.attempts = (x.attempts || 0) + 1; x.lastTry = new Date().toISOString(); if (p.wa !== false) x.waSent = x.lastTry; log('No answer from ' + first(x.customer) + (p.wa !== false ? '; left a WhatsApp' : ''), x.id, 'noanswer'); }
      else { x.status = 'cancelled'; x.cancelReason = p.reason || 'Not given'; log('Cancelled ' + first(x.customer) + '’s viewing on the phone (' + (p.reason || 'no reason').toLowerCase() + ')', x.id, 'cancel'); }
      addNote(x, note);
    }, msg, function () { delete CQ.res[id]; CQ.i = idx; CNOTE[id] = note; });
    delete CP[id];
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t || cur !== 'confirm' || t.closest('#so, #dlg, #pal')) return; var d = t.dataset;
    if (d.cf) { cfAction(d.cf); return; }
    if (d.ci !== undefined) { CQ.i = +d.ci; delete CQ.skip[CQ.ids[CQ.i]]; refresh(); var f = $('#cfocus'); if (f && mobile.matches) f.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' }); return; }
    var id = CQ && CQ.ids[CQ.i]; if (!id) return; var p = CP[id] = CP[id] || {};
    if (d.cout) { p.o = p.o === d.cout ? '' : d.cout; }
    else if (d.creason) p.reason = d.creason;
    else if (d.csugg === 'remind') p.remind = p.remind === false;
    else if (d.csugg === 'wa') p.wa = p.wa === false;
    else return;
    var k = t.getAttribute('data-k'); refresh(); if (k) { var n = document.querySelector('[data-k="' + cssq(k) + '"]'); if (n) n.focus({ preventScroll: true }); }
  });
  main.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset.crs && CQ) { var id = CQ.ids[CQ.i], p = CP[id] = CP[id] || {}; p[t.dataset.crs] = t.value; var w = $('#cf-why'); if (w) w.textContent = ''; }
    if (t.dataset.cfHost) { change('appts', [t.dataset.cfHost], function (x) { x.host = t.value; }, t.value + ' will host this viewing.'); }
  });
  main.addEventListener('input', function (e) { if (e.target.id === 'cf-note' && CQ && CQ.ids[CQ.i]) CNOTE[CQ.ids[CQ.i]] = e.target.value; });

  // ================================================================== CONVERSATIONS (the Orbit concierge, agent "watch")
  var orbit = null, IB = { sel: null, f: 'open' };
  function loadOrbit(cb) {
    if (orbit === true) { if (cb) cb(); return; }
    if (orbit) { if (cb) orbit.push(cb); return; }
    orbit = cb ? [cb] : [];
    var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '../assets/bots/bots.css'; document.head.appendChild(css);
    var list = ['../assets/bots/engine.js', '../assets/bots/ui.js', '../assets/bots/agents/watch.js'], n = 0;
    list.forEach(function (src) {
      var s = document.createElement('script'); s.src = src; s.async = false;
      s.onload = s.onerror = function () { if (++n !== list.length) return; var w = orbit; orbit = true; seedConvos(); if (window.Orbit) Orbit.convos.on(function () { if (cur === 'inbox') drawInbox(); counts(); }); w.forEach(function (f) { f(); }); counts(); };
      document.head.appendChild(s);
    });
  }
  function rawConvos() { try { return (JSON.parse(localStorage.getItem('orbit-convos') || '[]') || []).filter(function (c) { return c.agent === 'watch' && !c.hidden; }); } catch (e) { return []; } }
  function convos() { var all = window.Orbit ? Orbit.convos.list() : rawConvos(); return all.filter(function (c) { return c.agent === 'watch' && (c.engaged || c.status !== 'bot'); }).sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); }); }
  function waitingChats() { return convos().filter(function (c) { return c.status === 'waiting'; }).length; }
  function cname(c) { return (c && c.user && c.user.name) || 'Visitor'; }
  function linked(cid) { var out = []; DB.enquiries.forEach(function (x) { if (x.convo === cid) out.push(['enquiries', x]); }); DB.appts.forEach(function (x) { if (x.convo === cid) out.push(['appts', x]); }); DB.service.forEach(function (x) { if (x.convo === cid) out.push(['service', x]); }); DB.orders.forEach(function (x) { if (x.convo === cid) out.push(['orders', x]); }); return out; }
  function fmtMsg(t) { return esc(String(t || '')).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); }
  function msgHTML(g, c) {
    var k = g.kind === 'system' || g.from === 'system' ? 'sys' : g.from === 'user' ? 'user' : g.from === 'agent' ? 'agent' : 'bot';
    if (k === 'sys') return '<li class="msg sys"><span>' + esc(g.text) + ' · ' + hm(g.ts) + '</span></li>';
    var who = k === 'user' ? cname(c) : k === 'agent' ? (g.name || 'Team') : 'Concierge';
    var cards = g.cards && g.cards.length ? '<span class="msg-cards">' + g.cards.map(function (cd) { return '<span>' + esc(cd.title || '') + (cd.price ? ' · ' + esc(cd.price) : '') + '</span>'; }).join('') + '</span>' : '';
    var btns = g.buttons && g.buttons.length && k === 'bot' ? '<span class="msg-btns">' + g.buttons.slice(0, 4).map(function (b2) { return '<span>' + esc(b2.label) + '</span>'; }).join('') + '</span>' : '';
    return '<li class="msg ' + k + '"><div class="bub">' + fmtMsg(g.text) + cards + btns + '</div><small>' + esc(who) + ' · ' + hm(g.ts) + '</small></li>';
  }
  var CST = { bot: ['Concierge', 'bot'], waiting: ['Waiting', 'waiting'], human: ['With us', 'human'], resolved: ['Resolved', 'resolved'] };
  function seedConvos() {
    if (!window.Orbit) return; var O = window.Orbit;
    if (O.convos.get('watch-seed-1')) return;
    var e1 = DB.enquiries.filter(function (x) { return x.convo === 'watch-seed-1'; })[0], s2 = DB.service.filter(function (x) { return x.convo === 'watch-seed-2'; })[0], e3 = DB.enquiries.filter(function (x) { return x.convo === 'watch-seed-3'; })[0], a4 = DB.appts.filter(function (x) { return x.convo === 'watch-seed-4'; })[0];
    var now = Date.now(), t1 = e1 ? T(e1.at) : now - 50 * MIN, t2 = s2 ? T(s2.at) : now - 5 * HOUR, t3 = e3 ? T(e3.at) : now - 3 * DAY, t4 = now - 26 * HOUR;
    var nim = { model: 'nimisha', dial: 'sandstone', metal: 'rose', strap: 'ink' };
    var C = [
      { id: 'watch-seed-1', status: 'waiting', user: 'Ira Banerjee', ch: 'web', src: 'Website chat', page: 'watch.html?m=nimisha', at: t1, reason: 'Asked for a call-back about an anniversary gift', msgs: [
        ['bot', 'Good evening. I’m the Ghatika concierge. You’re looking at the **Nimisha** in Sandstone. I can price a configuration, book a viewing or tell you about the tithi moon.', 0],
        ['user', 'how much in rose gold with the ink strap', 40],
        ['bot', 'The Nimisha in 18k rose gold on the ink alligator-grain strap is **' + inr(D.price(nim)) + '**, with GST and insured delivery included. Built to order in 38 days.', 46],
        ['user', 'it’s for our anniversary in feb. my wrist is small, 15.5 cm. can someone call me?', 120],
        ['bot', 'Of course. The 36 mm Nimisha sits beautifully on a 15.5 cm wrist; we would fit the short strap. I’ve passed this to the boutique team with your number.', 128],
        ['system', 'Handed to the team: asked for a call-back', 130]] },
      { id: 'watch-seed-2', status: 'human', user: 'Manav Chopra', ch: 'whatsapp', src: 'WhatsApp', at: t2, person: 'Kavya', reason: 'Asked how long the service takes', msgs: [
        ['user', 'Hi, my Prahar is losing almost a minute a day since I flew back from London', 0],
        ['bot', 'I’m sorry to hear that. Airport scanners and magnetic phone cases can magnetise the hairspring. It’s a quick fix at the bench. Shall I arrange a free courier pick-up?', 8],
        ['user', 'yes please. serial GH01-0148', 70],
        ['bot', 'Found it: **Prahar GH01-0148**, covered until 2032. I’ve opened service ticket **' + (s2 ? s2.id : 'GH-S-896') + '** and booked a courier for tomorrow, 11:00 to 14:00.', 78],
        ['user', 'Can I talk to someone about how long it will take?', 140],
        ['system', 'Connected to Kavya at The Atelier', 300],
        ['agent', 'Hello Manav, Kavya here at the atelier. Demagnetising and regulating in five positions takes about ten days, including a 72-hour run before it comes home to you.', 360],
        ['user', 'Perfect, thank you. Please keep the old strap in the box', 420]] },
      { id: 'watch-seed-3', status: 'resolved', user: 'Leela Pillai', ch: 'web', src: 'Website chat', page: 'watch.html?m=prahar', at: t3, person: 'Anjali', reason: 'Engraving question', msgs: [
        ['bot', 'Good afternoon. I’m the Ghatika concierge. The **Prahar** is our hand-wound three-hander. How can I help?', 0],
        ['user', 'graduation gift for my daughter. can you engrave in malayalam?', 30],
        ['bot', 'Engraving is free, up to 24 characters on the caseback. Let me check the script with the engraver.', 36],
        ['system', 'Connected to Anjali at The Atelier', 200],
        ['agent', 'Hi Leela, Anjali here. We engrave in Latin and Devanagari today; Malayalam needs a new font plate, about three weeks. I’ll call you tomorrow with a proof.', 260],
        ['user', 'lovely, thank you', 300],
        ['system', 'Conversation resolved by Anjali', 330]] },
      { id: 'watch-seed-4', status: 'bot', user: 'Siddharth Goenka', ch: 'web', src: 'Website chat', page: 'watch.html?m=yantra', at: t4, msgs: [
        ['bot', 'Hello. You’re looking at the **Yantra GMT**. Two time zones, one sundial. Shall I book a viewing?', 0],
        ['user', 'can I see it in titanium with the bracelet this week, in mumbai', 25],
        ['bot', 'Kala Ghoda has both on the table. I have **' + (a4 ? dlong(T(a4.at)) + ' at ' + hm(T(a4.at)) : 'Saturday at 12:00') + '** free. Shall I hold it?', 31],
        ['user', 'yes. and can the second hand be set to singapore time before delivery', 80],
        ['bot', 'Booked: **Kala Ghoda, ' + (a4 ? dlong(T(a4.at)) + ' at ' + hm(T(a4.at)) : 'Saturday at 12:00') + '**. Rafiq will host you. And yes: every Yantra is set at the atelier to Udaipur on the main hands and to your second zone on the 24-hour hand.', 88]] }
    ];
    C.forEach(function (c) {
      var msgs = c.msgs.map(function (m, k) { return { id: c.id + '-' + k, from: m[0] === 'system' ? 'system' : m[0], kind: m[0] === 'system' ? 'system' : undefined, name: m[0] === 'agent' ? c.person : undefined, ts: c.at + m[2] * 1000, text: m[1] }; });
      O.convos.put({ id: c.id, seed: true, agent: 'watch', agentName: 'Ghatika concierge', channel: c.ch, source: c.src, status: c.status, person: c.person || null, startedAt: c.at, handoverReason: c.reason || null, engaged: true, user: { name: c.user }, mem: {}, context: { page: c.page || '' }, messages: msgs });
    });
    try { var raw = JSON.parse(localStorage.getItem('orbit-convos') || '[]'); raw.forEach(function (c) { var s = C.filter(function (x) { return x.id === c.id; })[0]; if (s) c.updatedAt = c.messages.length ? c.messages[c.messages.length - 1].ts : s.at; }); localStorage.setItem('orbit-convos', JSON.stringify(raw)); O.convos.reload(); } catch (e) {}
  }
  function seedChatRecords() {
    if (G.store.get('staff-chatseed', 0)) return;
    var now = Date.now(), iso = function (t) { return new Date(t).toISOString(); };
    var d4 = new Date(now + 2 * DAY); d4.setHours(12, 0, 0, 0); if (d4.getDay() === 0) d4.setDate(d4.getDate() + 1);
    if (!DB.enquiries.some(function (e) { return e.convo === 'watch-seed-1'; })) {
      DB.enquiries.unshift(
        { id: 'GH-E-1003', at: iso(now - 50 * MIN), name: 'Ira Banerjee', email: 'ira.banerjee@example.in', phone: '+91 98••• •214', interest: { model: 'nimisha', dial: 'sandstone', metal: 'rose', strap: 'ink' }, budget: '₹8–9 L', wrist: '15.5 cm', occasion: 'Anniversary in February', note: 'Wants to see the moon disc in daylight before deciding; asked for the short strap.', status: 'new', source: 'chat', convo: 'watch-seed-1' },
        { id: 'GH-E-1002', at: iso(now - 26 * HOUR), name: 'Siddharth Goenka', email: 'siddharth.goenka@example.in', phone: '+91 99••• •507', interest: { model: 'yantra', dial: 'monsoon', metal: 'titanium', strap: 'bracelet' }, budget: 'Around ₹6 L', wrist: '18 cm', occasion: 'For himself; flies to Singapore monthly', note: 'Asked for the 24-hour hand set to Singapore before delivery.', status: 'new', source: 'chat', convo: 'watch-seed-4' },
        { id: 'GH-E-1001', at: iso(now - 3 * DAY), name: 'Leela Pillai', email: 'leela.pillai@example.in', phone: '+91 94••• •630', interest: { model: 'prahar', dial: 'ivory', metal: 'steel', strap: 'sand' }, budget: 'Under ₹4 L', wrist: '14 cm', occasion: 'Graduation gift for her daughter', note: 'Engraving in Malayalam: needs a new font plate, about three weeks. Proof promised.', status: 'called', calledAt: iso(now - 2 * DAY), calledBy: 'Anjali Purohit', source: 'chat', convo: 'watch-seed-3' });
      G.store.set('enquiries', DB.enquiries);
    }
    if (!DB.service.some(function (s) { return s.convo === 'watch-seed-2'; })) {
      DB.service.unshift({ id: 'GH-S-' + nextNum('service', 896), at: iso(now - 5 * HOUR), customer: 'Manav Chopra', email: 'manav.chopra@example.in', phone: '+91 97••• •118', model: 'prahar', serial: 'GH01-0148', issue: 'Running slow', detail: 'Loses about a minute a day since a flight from London', stage: 'received', warranty: true, quote: 8500, logistics: 'Courier pick-up', tech: 'Mehul Soni', due: iso(now + 10 * DAY), source: 'chat', convo: 'watch-seed-2', note: 'Keep the old cognac strap in the box.' });
      G.store.set('service', DB.service);
    }
    if (!DB.appts.some(function (a) { return a.convo === 'watch-seed-4'; })) {
      DB.appts.push({ id: 'GH-A-' + nextNum('appts', 5140), boutique: 'mumbai', at: d4.toISOString(), customer: 'Siddharth Goenka', email: 'siddharth.goenka@example.in', phone: '+91 99••• •507', purpose: 'Private viewing', interest: 'yantra', guests: 1, status: 'requested', host: 'Rafiq Khan', note: 'Booked by the concierge. Lay out titanium on the bracelet and steel on calf.', source: 'chat', convo: 'watch-seed-4' });
      G.store.set('appts', DB.appts);
    }
    G.store.set('staff-chatseed', 1);
  }
  VIEWS.inbox = {
    params: function (p) { if (p.get('c')) { IB.sel = p.get('c'); IB.f = 'open'; } },
    mount: function (el) {
      el.innerHTML = '<div class="vh"><div><h1>Conversations</h1><p class="sub">The Ghatika concierge on the website and WhatsApp. Take over any chat, reply as yourself, then hand it back or resolve it.</p></div></div>' +
        '<div class="ibx" id="ibx"><div class="ibx-l"><div class="ibx-lh"><div class="seg2 ibf" role="group" aria-label="Filter conversations">' + [['open', 'Open'], ['waiting', 'Waiting'], ['human', 'With us'], ['resolved', 'Resolved']].map(function (f) { return '<button type="button" data-if="' + f[0] + '" data-k="if:' + f[0] + '" aria-pressed="' + (IB.f === f[0]) + '">' + f[1] + ' <span data-ifn="' + f[0] + '"></span></button>'; }).join('') + '</div></div><ul class="ibx-list" id="ibx-list" aria-label="Conversations">' + '<li class="ibx-sk"><span class="skl" style="width:70%"></span><span class="skl" style="width:90%;margin-top:8px"></span></li>'.repeat(4) + '</ul></div><section class="ibx-m" id="ibx-m" aria-label="Transcript"></section><aside class="ibx-r" id="ibx-r" aria-label="Client and linked records"></aside></div>';
      loadOrbit(function () { if (cur === 'inbox') drawInbox(true); });
    },
    paint: function () { drawInbox(); }
  };
  function drawInbox(scroll) {
    var el = $('#ibx'); if (!el) return;
    if (!window.Orbit) { if (orbit === true) $('#ibx-list').innerHTML = '<li class="void"><p>The concierge didn’t load. Reload the page to try again.</p></li>'; return; }
    var O = window.Orbit, all = convos(), F = { open: function (c) { return c.status !== 'resolved'; }, waiting: function (c) { return c.status === 'waiting'; }, human: function (c) { return c.status === 'human'; }, resolved: function (c) { return c.status === 'resolved'; } };
    $$('[data-if]', el).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.if === IB.f); });
    $$('[data-ifn]', el).forEach(function (s) { s.textContent = all.filter(F[s.dataset.ifn]).length; });
    var list = all.filter(F[IB.f]);
    if (IB.sel && !O.convos.get(IB.sel)) IB.sel = null;
    if (!IB.sel && list.length && !mobile.matches) IB.sel = list[0].id;
    var c = IB.sel ? O.convos.get(IB.sel) : null;
    el.classList.toggle('has-sel', !!c);
    $('#ibx-list').innerHTML = list.length ? list.map(function (x) {
      var m = x.messages[x.messages.length - 1] || {}, s = CST[x.status] || CST.bot;
      return '<li><button type="button" class="ibx-it" data-c="' + esc(x.id) + '" data-k="c:' + esc(x.id) + '" aria-current="' + (x.id === IB.sel) + '"><span class="av" aria-hidden="true">' + initials(cname(x)) + '</span><span class="ibx-t"><b>' + esc(cname(x)) + '</b><time>' + ago2(x.updatedAt) + '</time></span><span class="ibx-p"><span class="cst" data-cs="' + s[1] + '">' + s[0] + '</span>' + (x.channel === 'whatsapp' ? '<span class="chn">' + ic('wa') + '</span>' : '') + '<span class="pv2">' + esc(String(m.text || '').replace(/\*\*/g, '')) + '</span></span></button></li>';
    }).join('') : '<li class="void"><p>' + (IB.f === 'waiting' ? 'Nobody is waiting for a person. Chats the concierge hands over land here.' : IB.f === 'human' ? 'No chats with the team right now.' : IB.f === 'resolved' ? 'Nothing resolved yet.' : 'No open conversations. Ask the concierge something on any Ghatika page and it appears here.') + '</p></li>';
    var mEl = $('#ibx-m'), rEl = $('#ibx-r');
    if (!c) { mEl.innerHTML = '<div class="void">' + ic('chat') + '<b>Pick a conversation</b><p>Waiting chats need a person. Everything the concierge said is in the transcript, so clients never repeat themselves.</p></div>'; rEl.innerHTML = ''; return; }
    var draft = $('#ibx-in') ? $('#ibx-in').value : '', hadFocus = document.activeElement && document.activeElement.id === 'ibx-in';
    var s0 = CST[c.status] || CST.bot, who = first(ME);
    var foot;
    if (c.status === 'human') foot = '<div class="qrs">' + ['Let me check with the bench and come back in two minutes.', 'I’ve booked that for you; details on WhatsApp.', 'Would you like to see it in person this week?', 'The quote is on its way by email.'].map(function (t) { return '<button type="button" class="fchip" data-qr="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div><form class="reply" id="ibx-form"><label class="sr" for="ibx-in">Reply to ' + esc(cname(c)) + '</label><input class="inp2" id="ibx-in" autocomplete="off" placeholder="Reply as ' + esc(who) + '…" value="' + esc(draft) + '"><button type="submit" class="b primary">' + ic('send') + 'Send</button></form>';
    else if (c.status === 'resolved') foot = '<p class="hint2">Resolved' + (c.person ? ' by ' + esc(c.person) : '') + '. A new message from the client reopens it.</p><button type="button" class="b sm" data-ia="reopen">Reopen</button>';
    else foot = '<button type="button" class="b primary" data-ia="take">' + (c.status === 'waiting' ? 'Take over this chat' : 'Join this chat') + '</button><span class="hint2">' + (c.status === 'waiting' ? 'Waiting ' + ago2(c.handoverAt || c.updatedAt) + '. ' + esc(c.handoverReason || 'Asked for a person') + '.' : 'The concierge is handling this. Join to reply as yourself.') + '</span>';
    mEl.innerHTML = '<div class="ibx-mh"><button type="button" class="ib ibx-back" data-ibback aria-label="Back to the list">' + ic('left') + '</button><span class="av" aria-hidden="true">' + initials(cname(c)) + '</span><div class="ibx-who"><b>' + esc(cname(c)) + '</b><small>' + esc(c.source || (c.channel === 'whatsapp' ? 'WhatsApp' : 'Website chat')) + ' · started ' + ago2(c.startedAt) + '</small></div><span class="cst" data-cs="' + s0[1] + '">' + s0[0] + '</span>' +
      (c.status === 'human' ? '<button type="button" class="b sm ghost" data-ia="back">Hand back</button>' : '') + (c.status !== 'resolved' ? '<button type="button" class="b sm ghost" data-ia="resolve">Resolve</button>' : '') + '</div>' +
      '<ol class="ibx-log" role="log" aria-live="polite" aria-label="Messages">' + c.messages.map(function (g) { return msgHTML(g, c); }).join('') + '</ol><div class="ibx-f">' + foot + '</div>';
    var lk = linked(c.id), enq = lk.filter(function (x) { return x[0] === 'enquiries'; })[0], hasAppt = lk.some(function (x) { return x[0] === 'appts'; });
    var cfg = enq ? enqCfg(enq[1]) : null, pg = c.context && c.context.page ? String(c.context.page) : '', pm = /m=(\w+)/.exec(pg);
    if (!cfg && pm && D.MODELS[pm[1]]) cfg = { model: pm[1] };
    rEl.innerHTML = '<h3>Client</h3><dl class="props sm"><dt>Name</dt><dd>' + esc(cname(c)) + '</dd><dt>Channel</dt><dd>' + (c.channel === 'whatsapp' ? 'WhatsApp' : 'Website chat') + '</dd><dt>Started</dt><dd>' + dlong(c.startedAt) + ', ' + hm(c.startedAt) + '</dd>' + (pg ? '<dt>Was viewing</dt><dd>' + esc(pg.replace('.html', '').replace('?m=', ': ')) + '</dd>' : '') + '</dl>' +
      (cfg ? '<h3>Interested in</h3><div class="mini-cfg">' + watchSvg(cfg) + '<span><b>' + esc(M(cfg.model).name) + '</b><small>' + esc(cfg.dial ? G.cfgLine(enqCfg({ interest: cfg })) : M(cfg.model).line) + '</small><small>' + inr(D.price(enqCfg({ interest: cfg }))) + '</small></span></div>' : '') +
      '<h3>Linked records</h3>' + (lk.length ? '<ul class="lnk-l">' + lk.map(function (x) { var r = x[1], lab = x[0] === 'enquiries' ? 'Enquiry · ' + EL[r.status] : x[0] === 'appts' ? 'Viewing · ' + AL[r.status] + ', ' + dshort(T(r.at)) : x[0] === 'service' ? 'Service · ' + SL[r.stage] : 'Order · ' + OL[r.status]; return '<li><button type="button" data-open="' + r.id + '"><span class="mono">' + r.id + '</span><span>' + esc(lab) + '</span></button></li>'; }).join('') + '</ul>' : '<p class="hint2">Nothing linked yet. The concierge creates enquiries, viewings and service tickets as it goes.</p>') +
      (!hasAppt ? '<button type="button" class="b sm" data-ibbook>' + ic('appointments') + 'Book a viewing</button>' : '');
    var log2 = $('.ibx-log', mEl); log2.scrollTop = log2.scrollHeight;
    if (hadFocus) { var inp = $('#ibx-in'); if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } }
    if (scroll && mobile.matches && c) $('#ibx').scrollIntoView({ block: 'start' });
  }
  function ago2(ts) { return ts ? ago(ts) : ''; }
  function ibSend(text) {
    var O = window.Orbit, c = IB.sel && O && O.convos.get(IB.sel); if (!c || !text) return;
    if (c.status !== 'human') O.convos.setStatus(c.id, 'human', { person: first(ME) });
    O.convos.append(c.id, { from: 'agent', name: first(ME), text: text });
    log('Replied to ' + cname(c) + ' in the concierge chat', '', 'chat');
    var i = $('#ibx-in'); if (i) { i.value = ''; i.focus(); }
  }
  main.addEventListener('submit', function (e) { if (e.target.id !== 'ibx-form') return; e.preventDefault(); var i = $('#ibx-in'), t = i.value.trim(); if (!t) { i.setAttribute('aria-invalid', 'true'); i.placeholder = 'Write a reply first'; return; } i.removeAttribute('aria-invalid'); ibSend(t); });
  main.addEventListener('click', function (e) {
    if (cur !== 'inbox') return;
    var t = e.target.closest('button'); if (!t) return; var d = t.dataset, O = window.Orbit;
    if (d.if) { IB.f = d.if; if (mobile.matches) IB.sel = null; drawInbox(); return; }
    if (d.c) { IB.sel = d.c; syncHash('inbox', { c: d.c }); drawInbox(true); var lg = $('.ibx-log'); if (lg && !mobile.matches) { var hb = $('[data-ia]', $('#ibx-m')); if (hb) hb.focus({ preventScroll: true }); } return; }
    if (t.hasAttribute('data-ibback')) { IB.sel = null; syncHash('inbox'); drawInbox(); var f = $('.ibx-it'); if (f) f.focus(); return; }
    if (d.qr) { ibSend(d.qr); return; }
    if (t.hasAttribute('data-ibbook')) { var c0 = O && O.convos.get(IB.sel); if (c0) openForm('appt', { customer: cname(c0) === 'Visitor' ? '' : cname(c0), convo: c0.id, note: 'From the concierge chat.' }); return; }
    if (!d.ia || !O) return;
    var c = O.convos.get(IB.sel), who = first(ME); if (!c) return;
    if (d.ia === 'take') { O.convos.setStatus(c.id, 'human', { person: who }); O.convos.append(c.id, { from: 'system', kind: 'system', text: 'Connected to ' + who + ' at The Atelier' }); log('Took over the chat with ' + cname(c), '', 'chat'); G.toast('You’re in the chat with ' + cname(c) + '.'); setTimeout(function () { var i = $('#ibx-in'); if (i) i.focus(); }, 30); }
    if (d.ia === 'back') { O.convos.setStatus(c.id, 'bot', { person: null }); O.convos.append(c.id, { from: 'system', kind: 'system', text: 'You’re back with the Ghatika concierge. Ask anything.' }); log('Handed ' + cname(c) + ' back to the concierge', '', 'chat'); G.toast('Handed back to the concierge.'); }
    if (d.ia === 'resolve') { O.convos.setStatus(c.id, 'resolved', { person: c.person || who }); O.convos.append(c.id, { from: 'system', kind: 'system', text: 'Conversation resolved by ' + who }); log('Resolved the chat with ' + cname(c), '', 'check'); G.toast('Resolved. A new message from ' + first(cname(c)) + ' reopens it.'); }
    if (d.ia === 'reopen') { O.convos.setStatus(c.id, 'human', { person: who }); O.convos.append(c.id, { from: 'system', kind: 'system', text: 'Reopened by ' + who }); }
    drawInbox();
  });

  // ================================================================== forms (new order, viewing, ticket)
  function fld(id, label, input, hint, cls) { return '<div class="fl' + (cls ? ' ' + cls : '') + '"><label for="' + id + '">' + label + '</label>' + input + (hint ? '<p class="hint2">' + hint + '</p>' : '') + '<p class="er" id="' + id + '-e"></p></div>'; }
  function opts(list, sel, val, lab) { return list.map(function (x) { var v = val ? x[val] : x, l = lab ? x[lab] : x; return '<option value="' + esc(v) + '"' + (v === sel ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join(''); }
  function formShell(title, sub, body, submit) { return '<div class="so-h"><span class="mono">New</span><span class="sp"></span><button type="button" class="ib so-x" aria-label="Close panel (Esc)">' + ic('x') + '</button></div><form class="so-b" novalidate id="nf"><div class="so-title"><div><h2 id="so-h">' + title + '</h2><p>' + sub + '</p></div></div><div class="fgrid" style="margin-top:18px">' + body + '</div></form><div class="so-f"><span class="why" id="nf-why"></span><button type="button" class="b" data-fcancel>Cancel</button><button type="submit" form="nf" class="b primary">' + submit + '</button></div>'; }
  function fErr(root, id, msg) { var i = $('#' + id, root), e = $('#' + id + '-e', root); if (e) e.textContent = msg || ''; if (i) { if (msg) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid'); } return !!msg; }
  function emailErr(v) { return !v ? 'Add an email so the confirmation has somewhere to go.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? 'That email looks incomplete. Try name@domain.com.' : ''; }
  function maskPhone(v) { var d = String(v).replace(/\D/g, ''); if (d.length > 10 && d.indexOf('91') === 0) d = d.slice(2); return d.length === 10 ? '+91 ' + d.slice(0, 2) + '••• •' + d.slice(-3) : null; }
  function bindCommon(root, onSubmit) {
    $('[data-fcancel]', root).addEventListener('click', function () { closeSO(); });
    $('#nf', root).addEventListener('submit', function (e) { e.preventDefault(); onSubmit(); });
    $('#nf', root).addEventListener('input', function (e) { if (e.target.id) fErr(root, e.target.id, ''); });
    setTimeout(function () { var f = $('#nf input', root); if (f) f.focus(); }, 60);
  }
  var FORMS = {
    order: {
      html: function (p) {
        var m = p.model || 'prahar', sig = M(m).sig;
        return formShell('Manual order', 'For a client buying in the boutique or on the phone. Status starts at “Awaiting payment” unless you mark it paid.',
          fld('nf-name', 'Client name', '<input class="inp2" id="nf-name" autocomplete="off" value="' + esc(p.customer || '') + '">') +
          fld('nf-email', 'Email', '<input class="inp2" id="nf-email" type="email" autocomplete="off" value="' + esc(p.email || '') + '">') +
          fld('nf-phone', 'Mobile <small>(optional; stored masked)</small>', '<input class="inp2" id="nf-phone" inputmode="tel" autocomplete="off" placeholder="+91">') +
          fld('nf-city', 'City', '<input class="inp2" id="nf-city" autocomplete="off" value="' + esc(p.city || 'Udaipur') + '">') +
          '<div class="fl full"><span class="lb" id="nf-m-l">Model</span><div class="seg2" role="group" aria-labelledby="nf-m-l">' + Object.keys(D.MODELS).map(function (k) { return '<button type="button" data-model="' + k + '" aria-pressed="' + (k === m) + '">' + esc(D.MODELS[k].name) + '</button>'; }).join('') + '</div></div>' +
          fld('nf-dial', 'Dial', '<select class="inp2" id="nf-dial">' + opts(D.DIALS, sig.dial, 'id', 'name') + '</select>') +
          fld('nf-metal', 'Case', '<select class="inp2" id="nf-metal">' + opts(D.METALS, sig.metal, 'id', 'name') + '</select>') +
          fld('nf-strap', 'Strap', '<select class="inp2" id="nf-strap">' + opts(D.STRAPS, sig.strap, 'id', 'name') + '</select>') +
          fld('nf-eng', 'Engraving <small>(optional, up to 24 characters)</small>', '<input class="inp2" id="nf-eng" maxlength="40" autocomplete="off">') +
          fld('nf-pay', 'Payment', '<select class="inp2" id="nf-pay">' + opts(['UPI', 'Card', 'EMI · 12 mo', 'Bank transfer'], 'UPI') + '</select>', 'Recorded here; payment is taken at the boutique.') +
          fld('nf-del', 'Delivery', '<select class="inp2" id="nf-del">' + opts(['Insured courier', 'Boutique pick-up'], 'Insured courier') + '</select>') +
          fld('nf-own', 'Owner', '<select class="inp2" id="nf-own">' + opts(STAFF, p.owner || ME) + '</select>') +
          '<div class="fl"><span class="lb">Price</span><p id="nf-price" style="font:400 26px var(--serif);margin:0"></p></div>' +
          '<label class="togg full"><input type="checkbox" id="nf-paid">Payment already received</label>' +
          fld('nf-note', 'Note for the next person <small>(optional)</small>', '<textarea class="inp2" id="nf-note">' + esc(p.note || '') + '</textarea>', '', 'full'),
          'Create order');
      },
      bind: function (root, p) {
        var model = p.model || 'prahar';
        function price() { var c = { model: model, dial: $('#nf-dial').value, metal: $('#nf-metal').value, strap: $('#nf-strap').value }; $('#nf-price').textContent = inr(D.price(c)); }
        $('#nf', root).addEventListener('click', function (e) { var b = e.target.closest('[data-model]'); if (!b) return; model = b.dataset.model; $$('[data-model]', root).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); var s = M(model).sig; $('#nf-dial').value = s.dial; $('#nf-metal').value = s.metal; $('#nf-strap').value = s.strap; price(); });
        $('#nf', root).addEventListener('change', function () { price(); });
        price();
        bindCommon(root, function () {
          var name = $('#nf-name').value.trim(), email = $('#nf-email').value.trim(), ph = $('#nf-phone').value.trim(), eng = $('#nf-eng').value.trim(), metal = $('#nf-metal').value, strap = $('#nf-strap').value;
          var bad = false;
          bad = fErr(root, 'nf-name', !name ? 'Add the client’s name, as it should appear on the invoice.' : name.length < 3 ? 'That name looks short. First and last name, please.' : '') || bad;
          bad = fErr(root, 'nf-email', emailErr(email)) || bad;
          bad = fErr(root, 'nf-phone', ph && !maskPhone(ph) ? 'Indian mobiles have ten digits after +91. Check the number.' : '') || bad;
          bad = fErr(root, 'nf-eng', eng.length > 24 ? 'The caseback fits 24 characters. This one is ' + eng.length + '.' : '') || bad;
          bad = fErr(root, 'nf-strap', strap === 'bracelet' && (metal === 'rose' || metal === 'yellow') ? 'The Rann bracelet comes in steel and titanium only. Choose a strap for gold.' : '') || bad;
          if (bad) { $('#nf-why').textContent = 'A few fields need a look.'; var f = $('[aria-invalid="true"]', root); if (f) f.focus(); return; }
          var cfg = { model: model, dial: $('#nf-dial').value, metal: metal, strap: strap }, id = 'GH-O-' + nextNum('orders', 24181), paid = $('#nf-paid').checked, note = $('#nf-note').value.trim();
          var rec = { id: id, at: new Date().toISOString(), customer: name, email: email, phone: ph ? maskPhone(ph) : '+91 •••• not given', city: $('#nf-city').value.trim() || 'Udaipur', items: [Object.assign({ qty: 1, engraving: eng }, cfg)], total: D.price(cfg), pay: $('#nf-pay').value, delivery: $('#nf-del').value, status: paid ? 'paid' : 'new', owner: $('#nf-own').value, note: note, src: 'staff' };
          if (note) rec.notes = [{ at: rec.at, by: ME, t: note }];
          DB.orders.unshift(rec); save('orders'); log('Created manual order ' + id + ' for ' + name + ' · ' + inr(rec.total), id, 'orders');
          closeSO(true); SO_.flash = id; if (cur !== 'orders') go('orders'); else refresh();
          G.toast('Order ' + id + ' created for ' + name + '.', function () { DB.orders = DB.orders.filter(function (x) { return x.id !== id; }); LOG.shift(); G.store.set('staff-log', LOG); save('orders'); refresh(); });
          setTimeout(function () { SO_.flash = null; }, 1600);
        });
      }
    },
    appt: {
      html: function (p) {
        var d0 = new Date(Date.now() + DAY);
        return formShell('New viewing', 'Book a client into a boutique. Staff bookings are confirmed straight away.',
          fld('na-name', 'Client name', '<input class="inp2" id="na-name" autocomplete="off" value="' + esc(p.customer || '') + '">') +
          fld('na-email', 'Email', '<input class="inp2" id="na-email" type="email" autocomplete="off" value="' + esc(p.email || '') + '">') +
          fld('na-bq', 'Boutique', '<select class="inp2" id="na-bq">' + D.BOUTIQUES.map(function (b) { return '<option value="' + b.id + '"' + (b.id === (p.boutique || (CTX !== 'all' ? CTX : 'udaipur')) ? ' selected' : '') + '>' + esc(b.name + ', ' + b.city) + '</option>'; }).join('') + '</select>') +
          fld('na-date', 'Date', '<input class="inp2" id="na-date" type="date" min="' + isoDate(Date.now()) + '" value="' + isoDate(d0) + '">') +
          '<div class="fl full"><span class="lb" id="na-s-l">Slot</span><div class="seg2" role="group" aria-labelledby="na-s-l" id="na-slots">' + D.SLOTS.map(function (s) { return '<button type="button" data-slot="' + s + '" aria-pressed="false">' + s + '</button>'; }).join('') + '</div><p class="er" id="na-slot-e"></p></div>' +
          fld('na-purpose', 'Purpose', '<select class="inp2" id="na-purpose">' + opts(D.PURPOSES, D.PURPOSES[0]) + '</select>') +
          fld('na-int', 'Interested in', '<select class="inp2" id="na-int">' + Object.keys(D.MODELS).map(function (k) { return '<option value="' + k + '"' + (k === (p.interest || 'prahar') ? ' selected' : '') + '>' + esc(D.MODELS[k].name + ' · ' + D.MODELS[k].line) + '</option>'; }).join('') + '</select>') +
          fld('na-guests', 'Guests', '<select class="inp2" id="na-guests">' + opts(['1', '2', '3', '4'], '1') + '</select>') +
          fld('na-host', 'Host', '<select class="inp2" id="na-host">' + opts(STAFF, p.host || ME) + '</select>') +
          fld('na-note', 'Note for the host <small>(optional)</small>', '<textarea class="inp2" id="na-note">' + esc(p.note || '') + '</textarea>', '', 'full'),
          'Book viewing');
      },
      bind: function (root, p) {
        var slot = ''; p = p || {};
        function avail() {
          var b = $('#na-bq').value, dv = $('#na-date').value;
          $$('[data-slot]', root).forEach(function (x) { var t = dv ? new Date(dv + 'T' + x.dataset.slot).getTime() : 0, taken = DB.appts.some(function (a) { return a.boutique === b && a.status !== 'cancelled' && Math.abs(T(a.at) - t) < 30 * MIN; }); x.disabled = taken || (t && t < Date.now()); x.title = taken ? 'Already booked' : ''; if (x.disabled && slot === x.dataset.slot) { slot = ''; x.setAttribute('aria-pressed', 'false'); } });
        }
        $('#nf', root).addEventListener('click', function (e) { var b = e.target.closest('[data-slot]'); if (!b || b.disabled) return; slot = b.dataset.slot; $$('[data-slot]', root).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); fErr(root, 'na-slot', ''); });
        $('#nf', root).addEventListener('change', function (e) { if (e.target.id === 'na-bq' || e.target.id === 'na-date') avail(); });
        avail();
        bindCommon(root, function () {
          var name = $('#na-name').value.trim(), email = $('#na-email').value.trim(), b = $('#na-bq').value, dv = $('#na-date').value, bad = false;
          var t = dv && slot ? new Date(dv + 'T' + slot).getTime() : 0, dow = dv ? new Date(dv + 'T12:00').getDay() : -1;
          bad = fErr(root, 'na-name', !name ? 'Add the client’s name so the host knows who to greet.' : '') || bad;
          bad = fErr(root, 'na-email', emailErr(email)) || bad;
          bad = fErr(root, 'na-date', !dv ? 'Pick a date.' : sod(new Date(dv + 'T12:00').getTime()) < sod(Date.now()) ? 'That date has passed. Pick today or later.' : (CLOSED[b] || []).indexOf(dow) > -1 ? bq(b).name + ' is closed on ' + DAYN[dow] + 's. Try the next day.' : '') || bad;
          bad = fErr(root, 'na-slot', !slot ? 'Choose a slot. Greyed-out ones are taken or past.' : '') || bad;
          if (bad) { $('#nf-why').textContent = 'A few fields need a look.'; return; }
          var id = 'GH-A-' + nextNum('appts', 5140), note = $('#na-note').value.trim();
          var rec = { id: id, boutique: b, at: new Date(t).toISOString(), customer: name, email: email, phone: '+91 •••• not given', purpose: $('#na-purpose').value, interest: $('#na-int').value, guests: +$('#na-guests').value, status: 'confirmed', host: $('#na-host').value, note: note, src: 'staff' };
          if (note) rec.notes = [{ at: new Date().toISOString(), by: ME, t: note }];
          if (p.convo) { rec.source = 'chat'; rec.convo = p.convo; delete rec.src; }
          if (p.enq && byId('enquiries', p.enq)) { var eq = byId('enquiries', p.enq); eq.status = 'booked'; eq.bookedAppt = id; save('enquiries'); }
          DB.appts.push(rec); save('appts'); log('Booked ' + name + ' into ' + bq(b).name + ', ' + dlong(t) + ' ' + slot, id, 'appointments');
          closeSO(true); SA.wk = Math.floor((sod(t) - wkStart(0)) / (7 * DAY)); if (cur !== 'appointments') go('appointments'); else refresh();
          G.toast('Viewing booked: ' + name + ', ' + dlong(t) + ' ' + slot + '.', function () { DB.appts = DB.appts.filter(function (x) { return x.id !== id; }); save('appts'); refresh(); });
        });
      }
    },
    ticket: {
      html: function () {
        return formShell('New service ticket', 'Log a watch at intake. Photograph it, seal it in a pouch, then create the ticket.',
          fld('nt-name', 'Client name', '<input class="inp2" id="nt-name" autocomplete="off">') +
          fld('nt-email', 'Email', '<input class="inp2" id="nt-email" type="email" autocomplete="off">') +
          fld('nt-serial', 'Serial', '<input class="inp2 mono" id="nt-serial" autocomplete="off" placeholder="GH01-0043" style="text-transform:uppercase">', 'Engraved between the lugs at six.') +
          fld('nt-model', 'Model', '<select class="inp2" id="nt-model">' + Object.keys(D.MODELS).map(function (k) { return '<option value="' + k + '">' + esc(D.MODELS[k].name) + '</option>'; }).join('') + '</select>') +
          fld('nt-issue', 'Issue', '<select class="inp2" id="nt-issue">' + opts(Object.keys(ISSUE_LINE), 'Full service') + '</select>') +
          fld('nt-log', 'Logistics', '<select class="inp2" id="nt-log">' + opts(['Courier pick-up', 'Boutique drop-off · Udaipur', 'Boutique drop-off · Mumbai'], 'Boutique drop-off · Udaipur') + '</select>') +
          fld('nt-detail', 'In the client’s words', '<textarea class="inp2" id="nt-detail" placeholder="e.g. Loses about 40 seconds a day since a flight"></textarea>', '', 'full') +
          '<p class="hint2 full" id="nt-reg" aria-live="polite"></p>' +
          fld('nt-tech', 'Technician', '<select class="inp2" id="nt-tech">' + opts(STAFF, 'Mehul Soni') + '</select>') +
          fld('nt-due', 'Promised by', '<input class="inp2" id="nt-due" type="date" min="' + isoDate(Date.now()) + '" value="' + isoDate(Date.now() + 14 * DAY) + '">', 'Usually 14 days; 21 for a full service.'),
          'Create ticket');
      },
      bind: function (root) {
        var found = null;
        $('#nf', root).addEventListener('input', function (e) {
          if (e.target.id !== 'nt-serial') return;
          var v = e.target.value.trim().toUpperCase(); found = DB.warranty.filter(function (w) { return w.serial === v; })[0] || null;
          var r = $('#nt-reg');
          if (found) { $('#nt-model').value = found.model; if (!$('#nt-name').value) $('#nt-name').value = found.customer; if (!$('#nt-email').value) $('#nt-email').value = found.email; r.innerHTML = ic('check') + ' Found in the register: ' + esc(M(found.model).name) + ' bought ' + dshort(T(found.bought)) + ', ' + (coverEnd(found) > Date.now() ? 'covered until ' + dfull(coverEnd(found)) : 'out of warranty') + '.'; }
          else r.textContent = '';
        });
        bindCommon(root, function () {
          var name = $('#nt-name').value.trim(), email = $('#nt-email').value.trim(), ser = $('#nt-serial').value.trim().toUpperCase(), det = $('#nt-detail').value.trim(), dv = $('#nt-due').value, bad = false;
          bad = fErr(root, 'nt-name', !name ? 'Add the client’s name for the pouch label.' : '') || bad;
          bad = fErr(root, 'nt-email', emailErr(email)) || bad;
          bad = fErr(root, 'nt-serial', !/^GH\d{2}-\d{4}$/.test(ser) ? 'Serials look like GH01-0043: “GH”, two digits, a dash, four digits.' : '') || bad;
          bad = fErr(root, 'nt-detail', det.length < 6 ? 'A few words from the client help the bench: what happened, and since when.' : '') || bad;
          bad = fErr(root, 'nt-due', !dv ? 'Pick the date you promised the client.' : '') || bad;
          if (bad) { $('#nf-why').textContent = 'A few fields need a look.'; return; }
          var issue = $('#nt-issue').value, id = 'GH-S-' + nextNum('service', 896);
          var rec = { id: id, at: new Date().toISOString(), customer: name, email: email, phone: '+91 •••• not given', model: $('#nt-model').value, serial: ser, issue: issue, detail: det, stage: 'received', warranty: !!(found && coverEnd(found) > Date.now()), quote: issue === 'Strap replacement' ? 9500 : issue === 'Full service' ? 38000 : 0, logistics: $('#nt-log').value, tech: $('#nt-tech').value, due: new Date(dv + 'T18:00').toISOString(), src: 'staff' };
          DB.service.unshift(rec); save('service'); log('Logged ' + M(rec.model).name + ' ' + ser + ' for service (' + issue.toLowerCase() + ')', id, 'service');
          closeSO(true); if (cur !== 'service') go('service'); else refresh();
          G.toast('Ticket ' + id + ' created. It’s in Received.', function () { DB.service = DB.service.filter(function (x) { return x.id !== id; }); save('service'); refresh(); });
        });
      }
    }
  };
  function openForm(kind, pre) {
    if (kind === 'appt' && pre && pre.forAppt) { var a = byId('appts', pre.forAppt); pre = { customer: a.customer, email: a.email, boutique: a.boutique, interest: a.interest, host: a.host, convo: a.convo }; }
    openSO({ type: 'form', kind: kind, pre: pre || {} });
  }

  // ================================================================== dialog
  var DLG = { el: $('#dlg'), last: null, cfg: null };
  function dialog(o) {
    DLG.last = document.activeElement; DLG.cfg = o;
    DLG.el.innerHTML = '<div class="dlg' + (o.wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="dlg-h"' + (o.sub ? ' aria-describedby="dlg-p"' : '') + '><div class="dlg-h"><h2 id="dlg-h">' + esc(o.title) + '</h2>' + (o.sub ? '<p id="dlg-p">' + esc(o.sub) + '</p>' : '') + '</div><div class="dlg-b">' + (o.body || '') + '</div><div class="dlg-f"><button type="button" class="b" data-x>' + esc(o.cancel || 'Cancel') + '</button>' + (o.ok ? '<button type="button" class="b ' + (o.danger ? 'dark' : 'primary') + '" data-ok' + (o.okDisabled ? ' aria-disabled="true"' : '') + '>' + esc(o.ok) + '</button>' : '') + '</div></div>';
    DLG.el.hidden = false;
    var d = $('.dlg', DLG.el);
    if (o.onMount) o.onMount(d);
    setTimeout(function () { var f = $('input', d) || $('[data-ok]', d) || $('[data-x]', d); if (f) f.focus(); }, 30);
  }
  function closeDlg() { DLG.el.hidden = true; DLG.el.innerHTML = ''; DLG.cfg = null; if (DLG.last && document.contains(DLG.last)) DLG.last.focus({ preventScroll: true }); }
  DLG.el.addEventListener('click', function (e) {
    if (e.target === DLG.el || e.target.closest('[data-x]')) { closeDlg(); return; }
    var ok = e.target.closest('[data-ok]'); if (!ok) return;
    if (ok.getAttribute('aria-disabled') === 'true') return;
    var cfg = DLG.cfg; if (cfg && cfg.onOk && cfg.onOk() === false) return;
    closeDlg();
  });
  DLG.el.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') G.trap(e, DLG.el);
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); var ok = $('[data-ok]', DLG.el); if (ok) ok.click(); }
  });
  function help() {
    var mk = isMac ? '⌘' : 'Ctrl';
    dialog({ title: 'Keyboard shortcuts', sub: 'Everything here works without a mouse.', cancel: 'Close', body: '<dl class="keys">' + [[[mk, 'K'], 'Search records or jump anywhere'], [['G', 'T'], 'Go to Today'], [['G', 'C'], 'Confirm viewings, one call at a time'], [['G', 'I'], 'Go to Conversations'], [['G', 'O'], 'Go to Orders'], [['G', 'A'], 'Go to Appointments'], [['G', 'S'], 'Go to Service'], [['G', 'W'], 'Go to Warranty'], [['/'], 'Search the current list'], [['N'], 'New manual order'], [['Shift', 'click'], 'Select a range of orders'], [['Esc'], 'Close a panel, menu or dialog'], [['?'], 'Show this list']].map(function (k) { return '<dt>' + k[0].map(function (x) { return '<kbd>' + x + '</kbd>'; }).join('') + '</dt><dd>' + k[1] + '</dd>'; }).join('') + '</dl>' });
  }
  function startFresh() {
    dialog({ title: 'Start fresh?', sub: 'Orders, viewings, service tickets, warranties and concierge enquiries go back to the opening set, and the activity log is cleared. Saved views stay.', ok: 'Start fresh', danger: true, onOk: function () { NAMES.concat(['enquiries', 'staff-log', 'staff-chatseed']).forEach(function (n) { G.store.del(n); }); try { var cv = JSON.parse(localStorage.getItem('orbit-convos') || '[]').filter(function (c) { return String(c.id).indexOf('watch-seed-') !== 0; }); localStorage.setItem('orbit-convos', JSON.stringify(cv)); } catch (e) {} location.reload(); } });
  }
  function more() {
    dialog({
      title: 'More', cancel: 'Close',
      body: '<div class="pop more-nav" style="position:static;box-shadow:none;border:0;padding:0;margin:0 0 14px;animation:none"><p class="pk">Go to</p>' + [['appointments', 'Appointments'], ['warranty', 'Warranty register'], ['orders', 'Orders'], ['confirm', 'Confirm viewings']].map(function (x) { return '<a class="pi" href="#' + x[0] + '">' + ic(x[0] === 'confirm' ? 'phone' : x[0]) + esc(x[1]) + '</a>'; }).join('') + '</div><div class="fl"><label for="ctx-m">Boutique</label><select class="inp2" id="ctx-m">' + ctxOptions() + '</select></div><div class="pop" style="position:static;box-shadow:none;border:0;padding:0;margin-top:14px;animation:none"><p class="pk">Saved views</p>' + getViews().map(function (v) { return '<button type="button" data-mview="' + v.id + '">' + ic('views') + esc(v.name) + '</button>'; }).join('') + '<hr><a href="index.html" target="_blank" rel="noopener" class="pi">' + ic('ext') + 'View site <span class="sr">(opens in a new tab)</span></a><button type="button" data-mhelp>' + ic('kbd') + 'Keyboard shortcuts</button><button type="button" data-mfresh>' + ic('reset') + 'Start fresh</button></div><div class="me" style="padding:14px 0 0"><span class="av av-lg" aria-hidden="true">KP</span><span><b>' + ME + '</b><small style="color:var(--muted-p)">Client advisor · The Atelier</small></span></div>',
      onMount: function (d) {
        $('#ctx-m', d).addEventListener('change', function (e) { setCtx(e.target.value); }); d.addEventListener('click', function (e) { if (e.target.closest('a[href^="#"]')) closeDlg(); });
        d.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; if (b.dataset.mview) { closeDlg(); go('orders?view=' + b.dataset.mview); } else if (b.hasAttribute('data-mhelp')) { closeDlg(); help(); } else if (b.hasAttribute('data-mfresh')) { closeDlg(); startFresh(); } });
      }
    });
  }

  // ================================================================== command palette
  var PAL = { el: $('#pal'), items: [], sel: 0, last: null };
  function openPal() {
    if (!PAL.el.hidden) return;
    closePop(false);
    PAL.last = document.activeElement;
    PAL.el.innerHTML = '<div class="bp-box" role="dialog" aria-modal="true" aria-label="Search or jump to"><div class="bp-in">' + ic('search') + '<label class="sr" for="bp-q">Search records, sections and actions</label><input id="bp-q" role="combobox" aria-expanded="true" aria-controls="bp-l" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="Order, client, serial, or a section…"><kbd>Esc</kbd></div><ul class="bp-l" id="bp-l" role="listbox" aria-label="Results"></ul><div class="bp-f"><span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div></div>';
    PAL.el.hidden = false;
    var i = $('#bp-q'); i.addEventListener('input', function () { palRender(i.value); });
    palRender(''); i.focus();
  }
  function closePal() { PAL.el.hidden = true; PAL.el.innerHTML = ''; if (PAL.last && document.contains(PAL.last)) PAL.last.focus({ preventScroll: true }); }
  function hl(s, q) { s = esc(s); if (!q) return s; var t = q.split(/\s+/)[0]; if (!t) return s; var i = s.toLowerCase().indexOf(esc(t).toLowerCase()); return i < 0 ? s : s.slice(0, i) + '<mark>' + s.slice(i, i + esc(t).length) + '</mark>' + s.slice(i + esc(t).length); }
  function palRender(raw) {
    var q = raw.trim().toLowerCase(), groups = [];
    var nav = [['today', 'Today', 'Your queue, KPIs and what needs you', 'G T'], ['confirm', 'Confirm viewings', 'Call each request, one at a time', 'G C'], ['inbox', 'Conversations', 'Concierge chats on the website and WhatsApp', 'G I'], ['orders', 'Orders', DB.orders.length + ' orders through the atelier', 'G O'], ['appointments', 'Appointments', 'Viewings by boutique and day', 'G A'], ['service', 'Service', 'The bench, stage by stage', 'G S'], ['warranty', 'Warranty', 'Register and certificates', 'G W']].map(function (n) { return { g: 'Go to', ic: n[0], t: n[1], s: n[2], k: n[3], run: function () { go(n[0]); } }; });
    var acts = [
      { g: 'Actions', ic: 'plus', t: 'New manual order', s: 'For a boutique or phone sale', k: 'N', run: function () { openForm('order'); } },
      { g: 'Actions', ic: 'appointments', t: 'New viewing appointment', s: 'Book a client into a boutique', run: function () { openForm('appt'); } },
      { g: 'Actions', ic: 'service', t: 'New service ticket', s: 'Log a watch at intake', run: function () { openForm('ticket'); } },
      { g: 'Actions', ic: 'kbd', t: 'Keyboard shortcuts', s: '', k: '?', run: help },
      { g: 'Actions', ic: 'reset', t: 'Start fresh', s: 'Restore the opening records', run: startFresh }
    ].concat(getViews().map(function (v) { return { g: 'Saved views', ic: 'views', t: v.name, s: 'Orders view', run: function () { go('orders?view=' + v.id); } }; }));
    var pick = function (list) { return q ? list.filter(function (x) { return match((x.t + ' ' + x.s + ' ' + x.g).toLowerCase(), q); }) : list; };
    var recs = [];
    if (q) {
      DB.orders.forEach(function (o) { var it = o.items[0] || {}; if (match(oHay(o), q)) recs.push({ g: 'Orders', ic: 'orders', t: o.id + ' · ' + o.customer, s: M(it.model).name + ' · ' + G.optName('DIALS', it.dial) + ' · ' + inr(o.total) + ' · ' + OL[o.status], run: function () { openRecord(o.id); } }); });
      DB.appts.forEach(function (a) { if (match(aHay(a), q)) recs.push({ g: 'Appointments', ic: 'appointments', t: a.id + ' · ' + a.customer, s: bq(a.boutique).name + ' · ' + dlong(T(a.at)) + ' ' + hm(T(a.at)) + ' · ' + AL[a.status], run: function () { openRecord(a.id); } }); });
      DB.service.forEach(function (s) { if (match(sHay(s), q)) recs.push({ g: 'Service', ic: 'service', t: s.id + ' · ' + s.customer, s: M(s.model).name + ' ' + s.serial + ' · ' + s.issue + ' · ' + SL[s.stage], run: function () { openRecord(s.id); } }); });
      DB.enquiries.forEach(function (e) { if (match([e.id, e.name, e.email, enqLine(e), e.budget, e.occasion, e.note].join(' ').toLowerCase(), q)) recs.push({ g: 'Concierge enquiries', ic: 'chat', t: e.id + ' · ' + e.name, s: enqLine(e) + ' · ' + EL[e.status], run: function () { openRecord(e.id); } }); });
      if (window.Orbit) convos().forEach(function (c) { var n = (c.user && c.user.name) || 'Visitor', last = c.messages[c.messages.length - 1] || {}; if (match((n + ' ' + c.messages.map(function (m) { return m.text || ''; }).join(' ')).toLowerCase(), q)) recs.push({ g: 'Conversations', ic: 'chat', t: n, s: String(last.text || '').replace(/\*\*/g, '').slice(0, 70), run: function () { go('inbox?c=' + encodeURIComponent(c.id)); } }); });
      DB.warranty.forEach(function (w) { if (match(wHay(w), q)) recs.push({ g: 'Warranty', ic: 'warranty', t: w.serial + ' · ' + w.customer, s: M(w.model).name + ' · ' + w.years + ' years · ' + WL[w.status], run: function () { openRecord(w.id); } }); });
      recs = recs.slice(0, 14);
    } else {
      if (!Q) buildQueue();
      var nx = Q.jobs.filter(function (j) { return !settled(j); })[0];
      if (nx) { var o = jobInfo(nx); recs.push({ g: 'Next up', ic: o.icon, t: nm(o.r), s: o.kind + ' · ' + o.primary.label, run: function () { go('today'); } }); }
    }
    PAL.items = recs.concat(pick(nav), pick(acts));
    PAL.sel = 0;
    var ul = $('#bp-l'), last = '', html = '';
    PAL.items.forEach(function (x, n) {
      if (x.g !== last) { html += '<li role="presentation" class="g">' + esc(x.g) + '</li>'; last = x.g; }
      html += '<li role="option" id="bpo-' + n + '" data-n="' + n + '" aria-selected="' + (n === 0) + '"><span class="ic">' + ic(x.ic) + '</span><span><b>' + hl(x.t, q) + '</b>' + (x.s ? '<small>' + esc(x.s) + '</small>' : '') + '</span>' + (x.k ? '<span>' + x.k.split(' ').map(function (k) { return '<kbd>' + k + '</kbd>'; }).join(' ') + '</span>' : '<span></span>') + '</li>';
    });
    ul.innerHTML = PAL.items.length ? html : '<li role="presentation" class="bp-none">Nothing matches “' + esc(raw) + '”. Try an order number like 24170, a serial like GH01, or a client’s first name.</li>';
    palSel(0);
  }
  function palSel(n) {
    if (!PAL.items.length) { $('#bp-q').removeAttribute('aria-activedescendant'); return; }
    PAL.sel = (n + PAL.items.length) % PAL.items.length;
    $$('[role="option"]', PAL.el).forEach(function (o) { o.setAttribute('aria-selected', +o.dataset.n === PAL.sel); });
    var cur2 = $('#bpo-' + PAL.sel); $('#bp-q').setAttribute('aria-activedescendant', 'bpo-' + PAL.sel); if (cur2) cur2.scrollIntoView({ block: 'nearest' });
  }
  function palRun(n) { var it = PAL.items[n]; if (!it) return; PAL.last = null; closePal(); it.run(); }
  PAL.el.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); palSel(PAL.sel + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); palSel(PAL.sel - 1); }
    else if (e.key === 'Home' && e.ctrlKey) { e.preventDefault(); palSel(0); }
    else if (e.key === 'Enter') { e.preventDefault(); palRun(PAL.sel); }
    else if (e.key === 'Tab') { e.preventDefault(); palSel(PAL.sel + (e.shiftKey ? -1 : 1)); }
  });
  PAL.el.addEventListener('click', function (e) { if (e.target === PAL.el) { closePal(); return; } var o = e.target.closest('[role="option"]'); if (o) palRun(+o.dataset.n); });
  PAL.el.addEventListener('mousemove', function (e) { var o = e.target.closest('[role="option"]'); if (o && +o.dataset.n !== PAL.sel) palSel(+o.dataset.n); });

  // ================================================================== pop menus
  var POP = null;
  function togglePop(btn, pop) {
    if (POP && POP.pop === pop) { closePop(); return; }
    closePop(false);
    pop.hidden = false; btn.setAttribute('aria-expanded', 'true'); POP = { btn: btn, pop: pop };
    var f = $('[role="menuitem"]:not([aria-disabled="true"]), input', pop); if (f) f.focus();
  }
  function closePop(ret) { if (!POP) return; var p = POP; POP = null; p.pop.hidden = true; if (p.pop.dataset.tmp) p.pop.remove(); p.btn.setAttribute('aria-expanded', 'false'); if (ret !== false && document.contains(p.btn)) p.btn.focus(); }
  document.addEventListener('click', function (e) { if (POP && !POP.pop.contains(e.target) && !POP.btn.contains(e.target)) closePop(false); });
  document.addEventListener('keydown', function (e) {
    if (!POP || !POP.pop.contains(e.target)) return;
    var items = $$('[role="menuitem"], input', POP.pop), i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if (e.key === 'Tab') closePop(false);
  });

  // ================================================================== shell wiring
  function ctxOptions() { return '<option value="all"' + (CTX === 'all' ? ' selected' : '') + '>All boutiques</option>' + D.BOUTIQUES.map(function (b) { return '<option value="' + b.id + '"' + (CTX === b.id ? ' selected' : '') + '>' + esc(b.name + ' · ' + b.city) + '</option>'; }).join(''); }
  function setCtx(v) { CTX = v; G.store.set('staff-ctx', v); $('#ctx').value = v; if (Q && Q.ctx !== v) Q = null; counts(); if (cur) { main.innerHTML = ''; VIEWS[cur].mount(main); } G.toast(v === 'all' ? 'Showing all four boutiques.' : 'Showing ' + bqName(v) + ' only.'); }
  $('#ctx').innerHTML = ctxOptions();
  $('#ctx').addEventListener('change', function (e) { setCtx(e.target.value); });
  $$('[data-modk]').forEach(function (k) { k.textContent = isMac ? '⌘K' : 'Ctrl K'; });
  $$('[data-open-pal]').forEach(function (b) { b.addEventListener('click', openPal); });
  $$('[data-open-help]').forEach(function (b) { b.addEventListener('click', help); });
  $$('[data-reset]').forEach(function (b) { b.addEventListener('click', startFresh); });
  $('#more-btn').addEventListener('click', more);
  $('#new-btn').addEventListener('click', function () { togglePop($('#new-btn'), $('#new-pop')); });
  function paintSideViews() {
    var vs = getViews(), cv = cur === 'orders' ? curView() : null;
    $('#side-views').innerHTML = vs.length ? vs.map(function (v) { return '<li><a href="#orders?view=' + v.id + '"' + (cv && cv.id === v.id ? ' aria-current="true"' : '') + '><span>' + esc(v.name) + '</span><small>' + DB.orders.filter(function (o) { return (v.st === 'all' || o.status === v.st) && (v.owner === 'all' || o.owner === v.owner) && (!v.q || match(oHay(o), v.q.toLowerCase())); }).length + '</small></a></li>'; }).join('') : '<li class="none">Save filters on Orders to pin them here.</li>';
  }

  // one delegated click handler for the whole document
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button, a'); if (!t) return;
    if (t.closest('#so') || t.closest('#dlg') || t.closest('#pal')) return;
    var d = t.dataset;
    if (d.go) { e.preventDefault(); go(d.go); return; }
    if (d.new) { closePop(false); openForm(d.new, d['for'] ? { forAppt: d['for'] } : null); return; }
    if (d.open) { e.preventDefault(); openRecord(d.open); return; }
    if (d.fc) { fcAction(d.fc); return; }
    if (d.qi !== undefined) { Q.i = +d.qi; Q.skip[Q.jobs[Q.i].key] && delete Q.skip[Q.jobs[Q.i].key]; refresh(); var f = $('#focus'); if (f && mobile.matches) f.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' }); return; }
    if (d.out || d.sugg || d.reason) { outcomeClick(t); return; }
    // orders
    if (d.ost) { SO_.st = d.ost; SO_.sel = {}; refresh(); syncO(); return; }
    if (d.sort) { if (SO_.sort === d.sort) SO_.dir *= -1; else { SO_.sort = d.sort; SO_.dir = d.sort === 'customer' ? 1 : -1; } refresh(); return; }
    if (d.note) { editNote(t); return; }
    if (t.hasAttribute('data-clearf')) { SO_.q = ''; SO_.st = 'all'; SO_.owner = 'all'; var q = $('#o-q'); if (q) q.value = ''; refresh(); syncO(); return; }
    if (t.hasAttribute('data-saveview')) { if (t.getAttribute('aria-disabled') === 'true') return; closePop(false); saveViewDialog(); return; }
    if (d.view) { var v = getViews().filter(function (x) { return x.id === d.view; })[0]; closePop(false); if (v) { SO_.q = v.q; SO_.st = v.st; SO_.owner = v.owner; SO_.sel = {}; var qq = $('#o-q'); if (qq) qq.value = v.q; refresh(); syncO(); } return; }
    if (d.delview) { var vs = getViews(), i = vs.findIndex(function (x) { return x.id === d.delview; }), gone = vs.splice(i, 1)[0]; setViews(vs); paintViewsPop(); refresh(); var fm = $('#o-vpop [role="menuitem"]'); if (fm) fm.focus(); G.toast('Deleted the view “' + gone.name + '”.', function () { var a = getViews(); a.splice(i, 0, gone); setViews(a); refresh(); }); return; }
    if (d.export) { exportOrders(oSorted(oFilter(false))); return; }
    if (d.bulk) { if (d.bulk === 'clear') { SO_.sel = {}; refresh(); } else if (d.bulk === 'advance') bulkAdvance(); else if (d.bulk === 'assign') bulkAssign(); else exportOrders(oSorted(DB.orders.filter(function (o) { return SO_.sel[o.id]; }))); return; }
    // appointments
    if (d.wk !== undefined) { SA.wk = +d.wk === 0 ? 0 : SA.wk + +d.wk; refresh(); return; }
    if (d.lay) { SA.lay = d.lay; G.store.set('staff-alay', d.lay); refresh(); return; }
    if (d.ast) { SA.st = d.ast; refresh(); return; }
    if (d.aconfirm) { change('appts', [d.aconfirm], function (x) { x.status = 'confirmed'; log('Confirmed ' + first(x.customer) + '’s viewing, ' + dlong(T(x.at)) + ' ' + hm(T(x.at)), x.id, 'appointments'); }, 'Viewing confirmed for ' + first(byId('appts', d.aconfirm).customer) + '.'); return; }
    // service
    if (d.sf) { SS[d.sf] = !SS[d.sf]; refresh(); return; }
    if (d.qamt) { editQuote(t); return; }
    if (d.jump) { var c = $('.bcol[data-stage="' + d.jump + '"]'), b = $('#board'); if (c && b) b.scrollTo({ left: c.offsetLeft - b.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' }); return; }
    // warranty
    if (d.wst) { SW.st = d.wst; refresh(); return; }
    if (d.wsort) { if (SW.sort === d.wsort) SW.dir *= -1; else { SW.sort = d.wsort; SW.dir = d.wsort === 'bought' ? -1 : 1; } refresh(); return; }
  });
  // row clicks open the record (tables)
  main.addEventListener('click', function (e) {
    if (e.target.closest('button, a, select, input, label, textarea')) return;
    var tr = e.target.closest('tr[data-id], tr[data-wid], .ag[data-row]'); if (!tr) return;
    openRecord(tr.dataset.id || tr.dataset.wid || tr.dataset.row);
  });
  main.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset.mv) { if (t.value) moveTicket(t.dataset.mv, t.value); return; }
    if (t.hasAttribute('data-fc-host')) { var j = Q.jobs[Q.i]; change('appts', [j.id], function (x) { x.host = t.value; }, t.value + ' will host this viewing.'); return; }
    if (t.dataset.rs) { var p = PEND[t.dataset.aid] = PEND[t.dataset.aid] || {}; p[t.dataset.rs] = t.value; fcWhy(''); }
  });
  main.addEventListener('input', function (e) { if (e.target.id === 'fc-note' && Q && Q.jobs[Q.i]) { FNOTE[Q.jobs[Q.i].key] = e.target.value; fcWhy(''); } });

  // keyboard
  var gAt = 0, GK = { t: 'today', c: 'confirm', i: 'inbox', o: 'orders', a: 'appointments', s: 'service', w: 'warranty' };
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') { e.preventDefault(); if (PAL.el.hidden) openPal(); else closePal(); return; }
    if (e.key === 'Escape') {
      if (!PAL.el.hidden) { e.preventDefault(); closePal(); }
      else if (!DLG.el.hidden) { e.preventDefault(); closeDlg(); }
      else if (POP) { e.preventDefault(); closePop(); }
      else if (SO.ctx) { e.preventDefault(); closeSO(); }
      return;
    }
    var t = e.target;
    if (e.metaKey || e.ctrlKey || e.altKey || (t.closest && t.closest('input, textarea, select, [contenteditable]'))) return;
    if (!PAL.el.hidden || !DLG.el.hidden) return;
    if (SO.ctx && e.key !== 'g' && !(gAt && GK[e.key.toLowerCase()])) return;
    if (e.key === '/') { var s = $('[data-search]', main); if (s) { e.preventDefault(); s.focus(); s.select(); } return; }
    if (e.key === '?') { e.preventDefault(); help(); return; }
    if (gAt && Date.now() - gAt < 1500 && GK[e.key.toLowerCase()]) { e.preventDefault(); gAt = 0; go(GK[e.key.toLowerCase()]); return; }
    gAt = 0;
    if (e.key === 'g' || e.key === 'G') { gAt = Date.now(); return; }
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); openForm('order'); }
  });

  // website records arrive in another tab: pick them up live
  addEventListener('storage', function (e) {
    if (e.key === 'orbit-convos') { if (!window.Orbit) counts(); return; }
    if (!e.key || e.key.indexOf('ghatika:') !== 0) return;
    var n = e.key.slice(8); if (!DB[n]) return;
    var seen = {}; DB[n].forEach(function (x) { seen[x.id] = 1; });
    DB[n] = G.store.get(n, DB[n]) || [];
    var fresh = DB[n].filter(function (x) { return !seen[x.id]; });
    if (Q) fresh.length && (Q = Q.ctx === CTX ? Q : null);
    counts(); refresh();
    if (fresh.length) { var x = fresh[0]; G.toast((n === 'orders' ? 'New order from the website: ' + x.customer + ', ' + M((x.items && x.items[0] || {}).model).name : n === 'appts' ? 'New viewing request: ' + x.customer + ', ' + dlong(T(x.at)) : n === 'service' ? 'New service request: ' + x.customer : n === 'enquiries' ? 'New concierge enquiry: ' + x.name : 'New warranty registration: ' + x.serial) + '.'); }
  });
  mobile.addEventListener && mobile.addEventListener('change', function () { refresh(); });

  // first paint: a short skeleton, then the view
  seedChatRecords();
  counts(); paintSideViews();
  setTimeout(function () { route(true); }, 300);
  setTimeout(function () { loadOrbit(); }, 1200);
  addEventListener('hashchange', function () { route(false); });
})();
