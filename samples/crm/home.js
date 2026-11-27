/* Lumen CRM Pro — Home that starts the day: a headline from live counts, the reply clock (every enquiry that has not had a
   first reply, by how long it has waited), the agent's one-card Home, and the seed that keeps the clock alive on any day. */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$, V = C.views;
  var P = function () { return C.P(); }, S = function () { return C.S(); }, MIN = 6e4;
  var SEL_TIP = 0;

  // ---- seed: eight enquiries waiting, offsets in minutes before "now", re-armed on every boot ----------------------
  var CLK = [['Neha Gupta', 2.5, 'Isha Bedi'], ['Lavanya Pillai', 6, 'Meera Joshi'], ['Zoya Hussain', 9.5, 'Kabir Anand'], ['Mohit Rawat', 13, 'Isha Bedi'],
    ['Aisha Khan', 27, 'Isha Bedi'], ['Pooja Verma', 52, 'Isha Bedi'], ['Rhea Kapoor', 96, 'Kabir Anand'], ['Jai Malhotra', 214, 'Meera Joshi']];
  var EXTRA = {
    'Rhea Kapoor': { source: 'meta', service: 'Smart lighting', loc: 'Noida', budget: 2.1, req: 'Wants app-controlled lighting in a 3BHK. Customer is flexible on timing.', utm: { source: 'facebook', medium: 'paid_social', campaign: 'kitchen-leadform-ncr' } },
    'Jai Malhotra': { source: 'google', service: 'Modular kitchen', loc: 'Dwarka', budget: 5.4, req: 'Wants a parallel kitchen with a hob and chimney. Customer plans to start within a month.', utm: { source: 'google', medium: 'cpc', campaign: 'kitchen-search-ncr' } }
  };
  C.seeders.push(function (p, S0) {
    var now = Date.now();
    CLK.forEach(function (c) {
      var l = S0.leads.filter(function (x) { return x.name === c[0]; })[0], x = EXTRA[c[0]];
      if (!l && x) {
        var n = S0.leads.reduce(function (m, q) { return Math.max(m, parseInt(String(q.id).replace(/[^0-9]/g, ''), 10) || 0); }, 1000) + 1;
        l = { id: 'L-' + n, name: c[0], phone: '+91 98••• ••' + (210 + n % 90), email: c[0].toLowerCase().replace(/[^a-z ]/g, '').replace(/ +/g, '.') + '@example.com', source: x.source, service: x.service, loc: x.loc, budget: x.budget, status: 'new', owner: c[2], created: now, resp: null, req: x.req, utm: x.utm, tl: [{ t: now, type: 'in', text: 'Lead received via ' + (C.SOURCES[x.source] ? C.SOURCES[x.source].label : x.source) + (x.utm.campaign ? ' · campaign ' + x.utm.campaign : '') }], notes: [] };
        S0.leads.push(l);
      }
      if (!l || l.status !== 'new' || l.resp != null) return;
      if (l.clk == null) { l.owner = c[2]; (S0.tasks || []).forEach(function (t) { if (t.leadId === l.id) t.owner = c[2]; }); }
      l.clk = c[1]; l.created = now - Math.round(c[1] * MIN);
      if (l.tl && l.tl[0]) l.tl[0].t = l.created;
    });
  });

  // ---- the data ---------------------------------------------------------------------------------------------------
  function tgt() { var r = P().route; return (r && r.sla) || 15; }
  function waiting() {
    var now = Date.now();
    return S().leads.filter(function (l) { return l.status === 'new' && l.resp == null && (!C.visibleLead || C.visibleLead(l)); })
      .map(function (l) { return { l: l, w: Math.max(0, (now - l.created) / MIN) }; }).sort(function (a, b) { return a.w - b.w; });
  }
  function wf(m) {
    if (m < 1) return 'under a minute';
    if (m < 60) return Math.round(m) + ' min';
    if (m < 1440) { var h = Math.floor(m / 60), r = Math.round(m % 60); return h + ' h' + (r ? ' ' + r + ' min' : ''); }
    return Math.round(m / 1440) + ' days';
  }
  function ini(n) { return n.split(/\s+/).map(function (x) { return x.charAt(0); }).join('').slice(0, 2).toUpperCase(); }
  function plural(n, a, b) { return n + ' ' + (n === 1 ? a : b); }

  // ---- headline ----------------------------------------------------------------------------------------------------
  C.homeHeadline = function () {
    var me = C.me(), now = Date.now(), day = new Date().toLocaleDateString('en-GB', { weekday: 'long' }), T = tgt(), parts = [];
    var W = waiting(), past = W.filter(function (x) { return x.w >= T; }).length;
    if (past) parts.push(plural(past, 'lead', 'leads') + ' past the ' + T + '-minute reply');
    if (me.role !== 'agent' && P().apr) { var ap = P().apr.reqs.filter(function (r) { return r.st === 'pending' && (me.role === 'admin' || r.who === 'manager'); }).length; if (ap) parts.push(plural(ap, 'approval', 'approvals') + ' waiting'); }
    var od = S().tasks.filter(function (t) { return !t.done && t.due && t.due < now - 36e5 && t.owner === me.name; }).length;
    if (od) parts.push(plural(od, 'task', 'tasks') + ' overdue');
    var qx = (P().quotes || []).filter(function (q) { return q.status === 'sent' && q.valid > now && q.valid < now + 3 * 864e5; }).length;
    if (qx && me.role !== 'agent') parts.push(plural(qx, 'quote', 'quotes') + ' expiring soon');
    if (!parts.length) { return day + ' · ' + (W.length ? plural(W.length, 'lead', 'leads') + ' waiting, all inside ' + T + ' minutes' : 'every lead answered inside ' + T + ' minutes'); }
    return day + ' · ' + parts.slice(0, 2).join(' · ');
  };
  C.homeHead = function (actions) {
    var me = C.me(), d = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    return '<header class="page-h home-h"><div><h1 id="home-h1">' + esc(C.homeHeadline()) + '</h1><p class="sub" id="home-sub">' + d + ' · ' + esc(me.name) + ' · ' + C.ROLE_TITLE[me.role] + '</p></div>' + (actions ? '<div class="page-a">' + actions + '</div>' : '') + '</header>';
  };

  // ---- the reply clock ---------------------------------------------------------------------------------------------
  C.homeClock = function (opt) {
    opt = opt || {};
    var T = tgt(), W = waiting(), inside = W.filter(function (x) { return x.w < T; }), past = W.filter(function (x) { return x.w >= T; });
    var pts = inside.map(function (x) { return { x: x.w / T * 75, o: x }; }).concat(past.map(function (x, i) { return { x: 75 + (i + 1) / (past.length + 1) * 25, o: x }; }));
    var h = '<section class="rc" id="rc" aria-labelledby="rc-t"><div class="rc-h"><div><h2 id="rc-t">Reply clock</h2><p class="sub">every enquiry that has not had a first reply, by how long it has waited</p></div>' +
      '<div class="rc-r">' + (W.length ? '<span class="rc-n"><b class="late">' + past.length + '</b> past target · <b>' + inside.length + '</b> inside</span>' : '<span class="rc-n">0 waiting</span>') +
      (W.length && !opt.noBtn ? '<button type="button" class="btn pri" data-act="rc-start">Start the queue</button>' : '') + '</div></div>';
    h += '<div class="rc-track" role="group" aria-label="Waiting enquiries on a ' + T + '-minute track">';
    h += '<i class="rc-zone" aria-hidden="true"></i><span class="rc-zl" aria-hidden="true">past target' + (past.length ? '<span class="rc-lg"> · longest ' + wf(past[past.length - 1].w) + '</span>' : '') + '</span>';
    h += '<i class="rc-line" aria-hidden="true"></i>';
    [0, 5, 10, 15].forEach(function (m) { var x = m / T * 75; h += '<i class="rc-tick' + (m === T ? ' tg' : '') + '" style="left:' + x + '%" aria-hidden="true"></i><span class="rc-tl" style="left:' + x + '%" aria-hidden="true">' + (m === T ? m + ' min' : m) + '</span>'; });
    h += '<span class="rc-tg" aria-hidden="true">target</span>';
    if (!W.length) h += '<p class="rc-empty">Nobody is waiting. The next enquiry starts a ' + T + '-minute clock.</p>';
    pts.forEach(function (p) {
      var l = p.o.l, late = p.o.w >= T, src = C.SOURCES[l.source] ? C.SOURCES[l.source].label : l.source;
      h += '<button type="button" class="rc-pt' + (late ? ' late' : '') + '" data-act="rc-open" data-id="' + esc(l.id) + '" data-x="' + p.x.toFixed(2) + '" style="left:' + p.x.toFixed(2) + '%" aria-label="' + esc(l.name + ', ' + src + ', waiting ' + wf(p.o.w) + (late ? ', past target' : ', inside target') + '. Open lead') + '"><i></i>' +
        '<span class="rc-tip" aria-hidden="true"><span class="rc-av">' + esc(ini(l.name)) + '</span><span><b>' + esc(l.name) + '</b><small>' + esc(src) + ' · waited ' + wf(p.o.w) + '</small></span></span></button>';
    });
    return h + '</div></section>';
  };
  function layout() {
    var tr = $('.rc-track'); if (!tr) return;
    var w = tr.clientWidth || 300, pts = $$('.rc-pt', tr), last = [-99, -99, -99], gap = 26, lane = [0, -22, 22];
    pts.forEach(function (b) {
      var x = parseFloat(b.dataset.x) / 100 * w, k = -1, best = 0, bd = -1e9;
      for (var i = 0; i < 3; i++) { var d = x - last[i]; if (d >= gap) { k = i; break; } if (d > bd) { bd = d; best = i; } }
      if (k < 0) k = best;
      last[k] = x; b.style.setProperty('--ly', lane[k] + 'px');
      var p = parseFloat(b.dataset.x); b.classList.toggle('edl', p < 20); b.classList.toggle('edr', p > 80);
    });
  }
  C.acts['rc-open'] = function (el) { location.hash = '#/inbox/' + el.dataset.id; };
  C.acts['rc-start'] = function (el) {
    var now = Date.now(), n = 0;
    waiting().forEach(function (x) {
      var l = x.l; if (S().tasks.some(function (t) { return t.leadId === l.id && !t.done && (t.type === 'call' || t.type === 'wa'); })) return;
      S().tasks.push({ id: 'T-R' + l.id.replace(/\D/g, '') + n++, leadId: l.id, text: 'Call ' + l.name.split(' ')[0] + ' — first reply on ' + l.service.toLowerCase(), due: l.created + tgt() * MIN, done: false, doneAt: null, owner: l.owner, type: 'call', prio: x.w >= tgt() ? 'Urgent' : 'High', remind: null, reminded: false });
    });
    if (n) C.save();
    var b = document.createElement('button'); b.dataset.q = 'fresh'; C.acts['cq-start'](b);
  };
  function repaintClock() {
    var r = $('#rc'); if (!r || !C.cur || C.cur.name !== 'dashboard') return;
    if (document.activeElement && document.activeElement.closest && document.activeElement.closest('#rc')) return;
    var agent = C.me().role === 'agent', t = document.createElement('div'); t.innerHTML = C.homeClock({ noBtn: agent });
    r.parentNode.replaceChild(t.firstChild, r); layout();
    var h = $('#home-h1'); if (h && h.firstChild) h.firstChild.nodeValue = C.homeHeadline();
  }
  setInterval(function () { if (!document.hidden) repaintClock(); }, 20000);
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(layout, 100); });
  var om = V.dashboard && V.dashboard.mount;
  if (V.dashboard) V.dashboard.mount = function () { if (om) om(); layout(); };

  // ---- agent Home: the clock, one focus card, the day ---------------------------------------------------------------
  C.homeFocus = function () {
    var W = waiting(), T = tgt(), past = W.filter(function (x) { return x.w >= T; }).length, n = W.length, mins = Math.max(2, Math.round(n * 2.5));
    var title, act = 'rc-start', lab = 'Start the queue', ab = 'about ' + mins + ' min';
    if (past) title = '<b>' + (past === 1 ? '1 lead is' : past + ' leads are') + ' past target.</b> Start the queue.';
    else if (n) title = '<b>' + plural(n, 'lead is', 'leads are') + ' waiting, all inside target.</b> Reply while they are warm.';
    else { title = '<b>Every lead is answered.</b> The call list below is your next job.'; lab = 'Start call queue'; act = 'cq-start'; ab = ''; }
    return '<section class="card focus" aria-label="Your next step"><p class="fc-t">' + title + '</p><div class="fc-a">' + (ab ? '<span class="muted">' + ab + '</span>' : '') + '<button type="button" class="btn pri lg" data-act="' + act + '">' + C.ic('play', 13) + lab + '</button></div></section>';
  };
  C.homeAgent = function () {
    return C.homeHead('') + C.homeClock({ noBtn: true }) + C.homeFocus() + (C.homeNN ? '<div class="home-w one">' + C.homeNN({ noBtn: true }) + '</div>' : '');
  };
})();
