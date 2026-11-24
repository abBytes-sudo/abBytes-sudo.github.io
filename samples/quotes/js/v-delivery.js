/* Studio OS: projects, Gantt, payment schedule, change orders, procurement. */
(function () {
  'use strict';
  var MR = window.MR, u = MR.u, esc = u.esc, ic = MR.ic;
  MR.views = MR.views || {}; MR.act = MR.act || {}; MR.bind = MR.bind || {};
  function S() { return MR.S; }
  var PSTAT = { active: ['In progress', 'info'], snagging: ['Snagging', 'warn'], handed: ['Handed over', 'ok'], hold: ['On hold', 'grey'] };
  var POSTAT = { draft: ['Draft', 'grey'], issued: ['Issued', 'info'], partial: ['Part received', 'warn'], delivered: ['Delivered', 'ok'], cancelled: ['Cancelled', 'grey'], late: ['Late', 'bad'] };
  MR.PSTAT = PSTAT; MR.POSTAT = POSTAT;
  function poState(o) { return (o.status === 'issued' || o.status === 'partial') && o.expected < u.today() ? 'late' : o.status; }
  MR.poState = poState;
  function curMs(p) { return p.milestones.filter(function (m) { return m.progress > 0 && m.progress < 100; }).pop() || p.milestones.filter(function (m) { return m.progress < 100; })[0] || p.milestones[p.milestones.length - 1]; }
  function billed(p) { var b = 0, rcv = 0; S().invoices.forEach(function (iv) { if (iv.projectId === p.id) { b += iv.total; rcv += MR.invPaid(iv); } }); return { billed: b, received: rcv }; }
  function mine(p) { var me = MR.me(); return MR.S.role === 'site' ? p.eng === me.id : MR.S.role === 'pm' ? p.pm === me.id : true; }
  MR.canProgress = function () { return MR.can('project.edit') || MR.S.role === 'site'; };

  /* =============================== PROJECT LIST =============================== */
  MR.views.projects = function (r) {
    var vk = r.qs.view || (MR.S.role === 'site' ? 'mine' : 'live'), mv = MR.can('money.view');
    var V = [['live', 'Live', function (p) { return p.status !== 'handed'; }], ['mine', MR.S.role === 'site' ? 'My sites' : 'Mine', mine], ['handed', 'Handed over', function (p) { return p.status === 'handed'; }], ['all', 'All', function () { return true; }]];
    if (MR.S.role === 'site') V = V.filter(function (x) { return x[0] === 'mine' || x[0] === 'handed'; }).map(function (x) { return x[0] === 'handed' ? [x[0], x[1], function (p) { return p.status === 'handed' && mine(p); }] : x; });
    var vd = V.filter(function (x) { return x[0] === vk; })[0] || V[0];
    var list = S().projects.filter(vd[2]).sort(function (a, b) { return MR.health(b).lvl - MR.health(a).lvl || (a.start < b.start ? 1 : -1); });
    var layout = r.qs.layout || MR.prefs.playout || 'cards';
    var h = '<div class="page"><div class="ph"><div><h1>' + (MR.S.role === 'site' ? 'My sites' : 'Projects') + '</h1><p class="sub">Signed quotes become projects with milestones, a payment schedule tied to them, change orders and site logs.</p></div><div class="acts"><div class="seg" role="group" aria-label="Layout"><button type="button" data-act="p-layout" data-v="table" aria-pressed="' + (layout === 'table') + '">Table</button><button type="button" data-act="p-layout" data-v="cards" aria-pressed="' + (layout === 'cards') + '">Cards</button></div></div></div>';
    h += '<div class="views">' + V.map(function (v) { return '<a href="#/projects?view=' + v[0] + '"' + (vk === v[0] ? ' aria-current="page"' : '') + '>' + v[1] + ' <span class="ct">' + S().projects.filter(v[2]).length + '</span></a>'; }).join('') + '</div>';
    if (!list.length) h += MR.empty('projects', 'No projects here', 'Projects appear when a signed quote is converted.');
    else if (layout === 'cards') h += '<div class="pjgrid">' + list.map(MR.projCard).join('') + '</div>';
    else h += '<div class="tw"><table class="tbl"><thead><tr><th>Project</th><th>Health</th><th class="hide-sm">Stage</th><th>Progress</th>' + (mv ? '<th class="num hide-sm">Contract</th><th class="num hide-sm">Received</th>' : '') + '<th class="hide-sm">Team</th><th class="hide-sm">Handover</th></tr></thead><tbody>' + list.map(function (p) {
      var hh = MR.health(p), pr = MR.projProgress(p), b = billed(p), cv = MR.projValue(p);
      return '<tr class="click" data-href="#/project/' + p.id + '"><td><a class="rl" href="#/project/' + p.id + '">' + esc(p.name) + '</a><span class="sub">' + esc(p.code) + ' · ' + esc(MR.client(p.clientId).name) + '</span></td><td>' + MR.healthDot(hh) + '</td><td class="hide-sm">' + esc(curMs(p).name) + '</td><td style="min-width:120px"><div class="progress-cell"><div class="bar ' + (hh.key === 'ok' || hh.key === 'done' ? 'ok' : '') + '"><i style="width:' + Math.round(pr * 100) + '%"></i></div><span class="muted" style="font-size:12px;width:32px;text-align:right">' + Math.round(pr * 100) + '%</span></div></td>' + (mv ? '<td class="num hide-sm">' + u.lakh(cv) + '</td><td class="num hide-sm">' + u.pct(b.received / (cv * 1.18) * 100) + '</td>' : '') + '<td class="hide-sm"><span class="avs">' + MR.avatar(p.pm) + MR.avatar(p.eng) + '</span></td><td class="hide-sm nowrap">' + (p.status === 'handed' ? '<span class="muted">' + u.fdate(p.handedAt) + '</span>' : u.fdate(p.end)) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
    return { html: h + '</div>', title: 'Projects', crumbs: [['Projects']], nav: 'projects' };
  };
  MR.act['p-layout'] = function (el) { MR.prefs.playout = el.dataset.v; MR.savePrefs(); MR.setQS('layout', el.dataset.v); };

  /* =============================== PROJECT RECORD =============================== */
  MR.views.project = function (r) {
    var p = MR.project(r.p[1]);
    if (!p) return { html: MR.notFound('That project does not exist.'), title: 'Project', crumbs: [['Projects', '#/projects'], ['Not found']], nav: 'projects' };
    var tab = r.qs.tab || 'overview', c = MR.client(p.clientId), hh = MR.health(p), mv = MR.can('money.view'), b = billed(p), cv = MR.projValue(p), pr = MR.projProgress(p);
    var snN = S().snags.filter(function (s) { return s.projectId === p.id && s.status !== 'closed'; }).length;
    var h = '<div class="page">';
    h += '<div class="ph" style="margin-bottom:14px"><div><div class="eyebrow">' + esc(p.code) + ' <span class="sep-dot"></span>' + MR.pill(p.status, PSTAT) + '</div><h1>' + esc(p.name) + '</h1><div class="qmeta">' + MR.chipClient(c) + '<span>' + ic('pin') + ' ' + esc(p.site) + ', ' + esc(p.city) + '</span><span>' + MR.avatar(p.pm) + ' PM ' + esc(MR.userById(p.pm).name) + '</span><span>' + MR.avatar(p.eng) + ' Site ' + esc(MR.userById(p.eng).name) + '</span>' + (MR.S.role !== 'site' ? '<a href="#/quote/' + p.quoteId + '">' + ic('quotes') + ' From ' + esc(MR.quote(p.quoteId).no) + '</a>' : '') + '</div></div><div class="acts">' + MR.healthDot(hh) + (MR.can('site.log') ? '<a class="btn" href="#/log/new?p=' + p.id + '">' + ic('camera') + '<span>Daily log</span></a>' : '') + (MR.can('project.edit') && p.status !== 'handed' ? MR.iconBtn('p-more', 'more', 'More actions', { id: p.id }) : '') + '</div></div>';
    h += '<div class="kpis">';
    if (mv) h += '<div class="kpi"><span class="lb">Contract value</span><div class="v">' + u.lakh(cv) + '</div><div class="d">' + (cv !== p.value ? 'incl. ' + u.lakh(cv - p.value) + ' change orders' : '+ GST') + '</div></div><div class="kpi"><span class="lb">Billed</span><div class="v">' + u.lakh(b.billed) + '</div><div class="d">' + u.pct(b.billed / (cv * 1.18) * 100) + ' of contract incl. GST</div></div><div class="kpi"><span class="lb">Received</span><div class="v">' + u.lakh(b.received) + '</div><div class="d">' + (b.billed - b.received > 1 ? '<b class="' + (hh.reasons.join().indexOf('overdue') > -1 ? 'bad' : '') + '">' + u.lakh(b.billed - b.received) + '</b> outstanding' : 'Nothing outstanding') + '</div></div>';
    else h += '<div class="kpi"><span class="lb">Stage</span><div class="v" style="font-size:22px">' + esc(curMs(p).name) + '</div><div class="d">' + curMs(p).progress + '% done</div></div><div class="kpi"><span class="lb">Open snags</span><div class="v">' + snN + '</div><div class="d">' + S().snags.filter(function (s) { return s.projectId === p.id && s.status !== 'closed' && s.sev === 'high'; }).length + ' high severity</div></div><div class="kpi"><span class="lb">Site logs</span><div class="v">' + S().logs.filter(function (l) { return l.projectId === p.id; }).length + '</div><div class="d">Last ' + u.rel((S().logs.filter(function (l) { return l.projectId === p.id; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0] || {}).date) + '</div></div>';
    var left = p.status === 'handed' ? 'Handed over ' + u.fdate(p.handedAt) : u.diffD(u.today(), p.end) >= 0 ? u.diffD(u.today(), p.end) + ' days to handover' : Math.abs(u.diffD(u.today(), p.end)) + ' days past plan';
    h += '<div class="kpi"><span class="lb">Progress</span><div class="v">' + Math.round(pr * 100) + '%</div><div class="d">' + left + '</div></div></div>';
    var tabs = [['overview', 'Overview'], ['timeline', 'Timeline'], ['billing', 'Billing', null, 'money.view'], ['cos', 'Change orders', (p.cos || []).length, 'money.view'], ['purchase', 'Purchase', S().pos.filter(function (o) { return o.projectId === p.id; }).length], ['site', 'Site log', S().logs.filter(function (l) { return l.projectId === p.id; }).length], ['snags', 'Snags', snN], ['design', 'Design'], ['handover', 'Handover', (p.handover ? p.handover.items.filter(function (i) { return !i.done; }).length : 0) || null]];
    var PS = ['Signed', 'Mobilise', 'Build', 'Snagging', 'Handed over'], nmx = MR.nextMs(p), pi = p.status === 'handed' ? 5 : p.status === 'snagging' ? 3 : (nmx && nmx.ph <= 1 ? 1 : 2);
    h += MR.stepper(PS, pi, 'Project stage');
    h += '<nav class="tabs" aria-label="Project sections">' + tabs.filter(function (t) { return !t[3] || MR.can(t[3]); }).map(function (t) { return '<a href="#/project/' + p.id + '?tab=' + t[0] + '"' + (tab === t[0] ? ' aria-current="page"' : '') + '>' + t[1] + (t[2] ? ' <span class="ct">' + t[2] + '</span>' : '') + '</a>'; }).join('') + '</nav>';
    if (tab === 'timeline') h += ganttHtml(p, true);
    else if (tab === 'billing') h += billingHtml(p);
    else if (tab === 'cos') h += cosHtml(p);
    else if (tab === 'purchase') h += '<div class="tbar"><span class="grow"></span>' + (MR.can('proc.edit') ? MR.btn('new-po', 'New PO from BOQ', { icon: 'plus', id: p.id }) : '') + '</div>' + MR.poTable(S().pos.filter(function (o) { return o.projectId === p.id; }), true);
    else if (tab === 'site') h += '<div class="tbar"><span class="grow"></span>' + (MR.can('site.log') ? '<a class="btn pri" href="#/log/new?p=' + p.id + '">' + ic('camera') + '<span>New daily log</span></a>' : '') + '</div>' + MR.logsHtml(S().logs.filter(function (l) { return l.projectId === p.id; }));
    else if (tab === 'design') h += MR.projectDesignHtml ? MR.projectDesignHtml(p) : '';
    else if (tab === 'handover') h += MR.handoverHtml ? MR.handoverHtml(p) : '';
    else if (tab === 'snags') h += '<div class="tbar"><span class="grow"></span>' + (MR.can('snag.raise') ? MR.btn('new-snag', 'Raise snag', { icon: 'plus', id: p.id }) : '') + '</div>' + MR.snagsHtml(S().snags.filter(function (s) { return s.projectId === p.id; }));
    else h += overviewHtml(p, hh);
    return { html: h + '</div>', title: p.name, crumbs: [['Projects', '#/projects'], [p.code]], nav: 'projects', tab: MR.S.role === 'site' ? '' : null, after: function (root, ch) { if (tab === 'timeline' && ch) animGantt(root); if (ch && tab === 'overview') animGantt(root); } };
  };
  function overviewHtml(p, hh) {
    var logs = S().logs.filter(function (l) { return l.projectId === p.id; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var photos = []; logs.forEach(function (l) { l.photos.forEach(function (ph) { if (photos.length < 8) photos.push({ src: ph, date: l.date }); }); });
    var h = '<div class="cols"><div class="stack">' + ganttHtml(p, false);
    h += '<section class="panel"><div class="panel-hd"><h2>Latest from site</h2><a class="btn ghost sm" href="#/project/' + p.id + '?tab=site">All logs</a></div><div class="panel-bd">' + (logs[0] ? '<p style="margin-bottom:10px"><b style="font-weight:600">' + u.fday(logs[0].date) + '</b> · ' + esc(MR.userById(logs[0].by).name) + '<br>' + esc(logs[0].work) + '</p>' : '<p class="muted">No logs yet.</p>') + (photos.length ? '<div class="photos">' + photos.map(function (x, i) { return '<button type="button" data-act="lightbox" data-src="' + esc(x.src) + '" data-cap="' + esc(p.name + ' · ' + u.fday(x.date)) + '" aria-label="Open site photo ' + (i + 1) + '"><img src="' + MR.photoSrc(x.src, true) + '" alt="Site photo, ' + esc(u.fday(x.date)) + '" loading="lazy" decoding="async" width="480" height="360"></button>'; }).join('') + '</div>' : '') + '</div></section></div>';
    h += '<aside class="stack"><section class="panel"><div class="panel-hd"><h3>Health</h3>' + MR.healthDot(hh) + '</div><div class="panel-bd"><ul class="feed">' + hh.reasons.map(function (x) { return '<li style="grid-template-columns:16px 1fr">' + ic(hh.lvl ? 'flag' : 'check', hh.lvl ? 'warn' : 'ok') + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul></div></section>';
    h += '<section class="panel"><div class="panel-hd"><h3>Key dates</h3></div><div class="panel-bd"><dl class="kvs">' + MR.kv('Signed', u.fdate(MR.quote(p.quoteId).sig.at.slice(0, 10))) + MR.kv('Site start', u.fdate(p.start)) + MR.kv('Handover plan', u.fdate(p.end)) + (p.handedAt ? MR.kv('Handed over', u.fdate(p.handedAt)) : '') + MR.kv('Site contact', MR.val('project', p, 'siteContact', 'site contact', 'Name and role')) + MR.kv('Terms', esc(p.terms).replace('5', '5') + ' · last 5% is ' + MR.term('Retention', 'retention')) + MR.kv('GST', p.state === 'HR' ? 'CGST + SGST (Haryana)' : 'IGST (' + esc(MR.STATE[p.state].name) + ')') + '</dl></div></section>';
    var refs = [p.code, MR.quote(p.quoteId).no];
    var acts = S().audit.filter(function (a) { return refs.some(function (x) { return a.ref.indexOf(x) === 0; }) || (a.entity === 'invoice' && a.detail.indexOf(p.code) === 0); });
    h += '<section class="panel"><div class="panel-hd"><h3>Activity</h3></div><div class="panel-bd" style="padding-top:4px;padding-bottom:4px">' + MR.feedHtml(acts, 8) + '</div></section></aside></div>';
    return h;
  }

  /* ---------------- gantt ---------------- */
  function ganttHtml(p, full) {
    var ms = p.milestones, t = u.today();
    var start = ms.reduce(function (a, m) { return m.start < a ? m.start : a; }, ms[0].start), end = ms.reduce(function (a, m) { return m.end > a ? m.end : a; }, ms[0].end);
    start = u.addD(start, -3); end = u.addD(end, 6); if (t > end) end = u.addD(t, 4);
    var span = u.diffD(start, end), pctx = function (d) { return (u.diffD(start, d) / span * 100).toFixed(3) + '%'; };
    var scale = '', grid = '', d0 = u.pd(start); d0.setDate(d0.getDate() + ((8 - d0.getDay()) % 7));
    for (var d = u.ds(d0); d <= end; d = u.addD(d, 7)) { scale += '<span style="left:' + pctx(d) + '">' + u.fshort(d) + '</span>'; grid += '<i style="left:' + pctx(d) + '"></i>'; }
    var pays = {}; p.schedule.forEach(function (ps) { if (!ps.msId) return; (pays[ps.msId] = pays[ps.msId] || []).push(ps); });
    var editable = MR.canProgress() && p.status !== 'handed', mv = MR.can('money.view');
    var h = (full ? '' : '<section class="panel"><div class="panel-hd"><h2>Timeline</h2><a class="btn ghost sm" href="#/project/' + p.id + '?tab=timeline">Open Gantt</a></div><div style="padding:0">') + '<div class="gantt-wrap"' + (full ? '' : ' style="border:0;border-radius:0 0 10px 10px"') + '><div class="gantt"><div class="g-head"><div class="g-l">Milestone</div><div class="g-scale">' + scale + '</div></div>';
    ms.forEach(function (m) {
      var late = m.progress < 100 && m.end < t, done = m.progress >= 100;
      var w = Math.max(1.2, u.diffD(m.start, m.end) / span * 100);
      h += '<div class="g-row"><div class="g-l"><b>' + esc(m.name) + '</b><span>' + u.fshort(m.start) + ' → ' + u.fshort(m.end) + (late ? ' · <span class="bad">' + u.diffD(m.end, t) + 'd late</span>' : '') + '</span></div><div class="g-track"><div class="g-grid">' + grid + '</div>';
      h += '<button type="button" class="g-bar' + (done ? ' done' : '') + (late ? ' late' : '') + (m.progress === 0 ? ' zero' : '') + '" style="left:' + pctx(m.start) + ';width:' + w + '%" ' + (editable ? 'data-act="ms-edit" data-id="' + m.id + '"' : 'data-act="noop" aria-disabled="true"') + ' aria-label="' + esc(m.name) + ', ' + m.progress + '% complete' + (editable ? ', edit' : '') + '" data-tip="' + esc(m.name + ' · ' + m.progress + '%' + (mv && m.value ? ' · ' + u.lakh(m.value) + ' of work' : '')) + '"><i style="width:' + m.progress + '%"></i><span>' + m.progress + '%</span></button>';
      (pays[m.id] || []).forEach(function (ps) { var iv = ps.invoiceId && MR.invoice(ps.invoiceId), st = iv ? MR.invState(iv).key : null; h += '<span class="g-pay ' + (st === 'paid' ? 'paid' : iv ? 'inv' : '') + '" style="left:' + pctx(m.end) + '" data-tip="' + esc(ps.pct + '% payment · ' + (st === 'paid' ? 'paid' : iv ? 'invoiced ' + iv.no : 'due on completion')) + '" tabindex="0" aria-label="' + esc(ps.pct + '% payment milestone') + '"></span>'; });
      h += '</div></div>';
    });
    if (t >= start && t <= end) h += '<div class="g-today" style="left:calc(230px + (100% - 230px) * ' + (u.diffD(start, t) / span).toFixed(4) + ')"><b>Today</b></div>';
    h += '</div></div>';
    if (full) h += '<div class="g-legend"><span><i style="background:var(--ink-2)"></i>In progress</span><span><i style="background:var(--ok)"></i>Complete</span><span><i style="background:var(--bad)"></i>Late</span><span><i style="background:var(--brand);transform:rotate(45deg)"></i>Payment due</span><span><i style="background:#D08A16;transform:rotate(45deg)"></i>Invoiced</span><span><i style="background:var(--ok);transform:rotate(45deg)"></i>Paid</span>' + (editable ? '<span>Click a bar to update progress or dates.</span>' : '') + '</div>';
    return h + (full ? '' : '</div></section>');
  }
  function animGantt(root) { if (MR.still()) return; var bars = root.querySelectorAll('.g-bar'); if (bars.length) window.gsap.from(bars, { scaleX: 0, duration: .8, ease: 'expo.out', stagger: .05 }); }
  MR.act.noop = function () {};
  MR.act['ms-edit'] = function (el) {
    var p = MR.project(MR.route().p[1]), m = MR.find(p.milestones, el.dataset.id), pays = p.schedule.filter(function (ps) { return ps.msId === m.id; });
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">' + esc(m.name) + '</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><label class="field"><span>Progress <output id="msOut" style="float:right;font-weight:600">' + m.progress + '%</output></span><input type="range" id="msPr" min="0" max="100" step="5" value="' + m.progress + '" style="accent-color:var(--brand);width:100%;height:32px"></label><div class="grid2"><label class="field"><span>Start</span><input class="inp" type="date" id="msS" value="' + m.start + '"' + (MR.can('project.edit') ? '' : ' disabled') + '></label><label class="field"><span>Finish</span><input class="inp" type="date" id="msE" value="' + m.end + '"' + (MR.can('project.edit') ? '' : ' disabled') + '></label></div>' + (pays.length && MR.can('money.view') ? '<p class="banner info" style="margin:0">' + ic('invoice') + '<span class="bt">Completing this milestone makes the <b>' + pays.map(function (x) { return x.pct + '%'; }).join(' + ') + '</b> payment (' + u.inr(pays.reduce(function (a, x) { return a + x.amount; }, 0)) + ' + GST) ready to bill. Accounts is notified.</span></p>' : '') + '<span class="err" id="msErr"></span></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('ms-save', 'Save', { cls: 'pri', id: m.id }) + '</div>', 'sm');
    var r = document.getElementById('msPr'); r.addEventListener('input', function () { document.getElementById('msOut').textContent = r.value + '%'; });
  };
  MR.act['ms-save'] = function (el) {
    var p = MR.project(MR.route().p[1]), m = MR.find(p.milestones, el.dataset.id), pr = +document.getElementById('msPr').value, s = document.getElementById('msS').value, e = document.getElementById('msE').value;
    if (!s || !e || e < s) { document.getElementById('msErr').textContent = 'The finish date has to be on or after the start.'; return; }
    var old = { progress: m.progress, start: m.start, end: m.end, doneAt: m.doneAt };
    m.progress = pr; m.start = s; m.end = e; m.doneAt = pr >= 100 ? (m.doneAt || u.today()) : null;
    p.end = p.milestones.reduce(function (a, x) { return x.end > a ? x.end : a; }, p.milestones[0].end);
    MR.audit('project', p.code, 'milestone updated', m.name + ': ' + old.progress + '% → ' + pr + '%' + (old.end !== e ? ', finish ' + u.fshort(old.end) + ' → ' + u.fshort(e) : ''));
    if (pr >= 100 && old.progress < 100) {
      var due = p.schedule.filter(function (ps) { return ps.msId === m.id && !ps.invoiceId; });
      if (due.length) MR.notify(['accounts', 'owner'], m.name + ' complete on ' + p.name.split(',')[0] + '. ' + due.map(function (x) { return x.pct + '%'; }).join(' + ') + ' is ready to bill.', '#/project/' + p.id + '?tab=billing', 'ok');
    }
    MR.save(); MR.closeDlg(); MR.render();
    MR.undoable(m.name + ' updated to ' + pr + '%', function () { Object.keys(old).forEach(function (k) { m[k] = old[k]; }); });
  };
  MR.act['p-more'] = function (el) {
    var p = MR.project(el.dataset.id);
    MR.menu(el, '<a href="#/project/' + p.id + '?tab=cos">' + ic('plus') + 'New change order</a>' + (MR.can('proc.edit') ? '<button type="button" data-act="new-po" data-id="' + p.id + '">' + ic('truck') + 'New purchase order</button>' : '') + '<hr>' + (p.status === 'active' ? '<button type="button" data-act="p-status" data-v="snagging">' + ic('snag') + 'Move to snagging</button>' : '') + (p.status !== 'handed' ? '<button type="button" data-act="p-status" data-v="handed">' + ic('check') + 'Mark handed over</button>' : ''), { right: true });
  };
  MR.act['p-status'] = function (el) {
    var p = MR.project(MR.route().p[1]), v = el.dataset.v, prev = p.status, prevH = p.handedAt; MR.closeMenu();
    var open = S().snags.filter(function (s) { return s.projectId === p.id && s.status !== 'closed'; }).length;
    function apply() { p.status = v; if (v === 'handed') { p.handedAt = u.today(); p.milestones.forEach(function (m) { m.progress = 100; m.doneAt = m.doneAt || u.today(); }); } MR.audit('project', p.code, 'status', PSTAT[prev][0] + ' → ' + PSTAT[v][0]); if (v === 'handed') MR.notify(['accounts', 'owner'], p.name.split(',')[0] + ' handed over. Raise the final invoice.', '#/project/' + p.id + '?tab=billing', 'ok'); MR.save(); MR.render(); MR.undoable(p.code + ' is now ' + PSTAT[v][0].toLowerCase(), function () { p.status = prev; p.handedAt = prevH; }); }
    if (v === 'handed' && open) MR.confirm('Hand over with ' + open + ' open snag' + (open > 1 ? 's' : '') + '?', 'Clients usually expect a clean snag list at handover. You can still hand over and close them during the defect liability period.', 'Hand over anyway', apply);
    else apply();
  };

  /* ---------------- billing ---------------- */
  function billingHtml(p) {
    var cv = MR.projValue(p), b = billed(p), contract = cv * 1.18, h = '';
    h += '<div class="cols"><div class="stack"><section class="panel"><div class="panel-hd"><h2>Payment schedule</h2><span class="tag">' + esc(p.terms) + ' tied to milestones</span></div>';
    h += '<div class="panel-bd" style="padding-bottom:4px"><div class="stackbar" aria-hidden="true"><i style="width:' + (b.received / contract * 100) + '%;background:var(--ok)"></i><i style="width:' + (Math.max(0, b.billed - b.received) / contract * 100) + '%;background:#D08A16"></i><i style="flex:1;background:var(--hover)"></i></div><div class="legend"><span><i style="background:var(--ok)"></i>Received ' + u.lakh(b.received) + '</span><span><i style="background:#D08A16"></i>Invoiced, unpaid ' + u.lakh(b.billed - b.received) + '</span><span><i style="background:var(--hover);box-shadow:inset 0 0 0 1px var(--line-2)"></i>To bill ' + u.lakh(Math.max(0, contract - b.billed)) + '</span></div></div><div class="psched">';
    p.schedule.forEach(function (ps) {
      var m = ps.msId && MR.find(p.milestones, ps.msId), iv = ps.invoiceId && MR.invoice(ps.invoiceId), st = iv && MR.invState(iv);
      var ready = !iv && ((m && m.progress >= 100) || ps.onSign || ps.coId);
      var status = iv ? '<a href="#/invoice/' + iv.id + '" class="pill p-' + st.tone + '" style="text-decoration:none"><i></i>' + esc(iv.no.split('/').pop()) + ' · ' + esc(st.label) + '</a>' : ready ? '<span class="pill p-ok"><i></i>Ready to bill</span>' : '<span class="pill p-grey"><i></i>' + (m ? m.progress + '% · due ' + u.fshort(m.end) : 'Pending') + '</span>';
      h += '<div class="ps"><span class="pc">' + (ps.pct ? ps.pct + '%' : 'CO') + '</span><span class="pl"><b>' + esc(ps.label) + '</b><span>' + (m ? 'Milestone: ' + esc(m.name) : 'Change order, billed on approval') + '</span></span><span class="pa">' + u.inr(ps.amount) + '<br><span class="faint" style="font-weight:400;font-size:11px">+ GST ' + u.inr(ps.amount * 0.18) + '</span></span><span class="pst">' + status + (ready && MR.can('invoice.raise') ? ' ' + MR.btn('inv-raise', 'Raise invoice', { cls: 'sm pri', id: ps.id, attrs: ' data-p="' + p.id + '"' }) : '') + '</span></div>';
    });
    h += '</div></section>';
    var ivs = S().invoices.filter(function (iv) { return iv.projectId === p.id; });
    h += '<section><h2 style="font-size:14px;font-weight:600;margin:4px 0 10px">Invoices</h2>' + (ivs.length ? MR.invoiceTable(ivs, true) : MR.empty('invoice', 'No invoices yet', 'The booking advance can be billed as soon as the project starts.')) + '</section></div>';
    h += '<aside class="stack"><section class="panel"><div class="panel-hd"><h3>Contract</h3></div><div class="panel-bd"><dl class="kvs">' + MR.kv('Signed quote', u.inr(p.value)) + ((p.cos || []).filter(function (c) { return c.status === 'approved'; }).map(function (c) { return MR.kv(c.no, '+ ' + u.inr(c.amount)); }).join('')) + MR.kv('Contract value', '<b>' + u.inr(cv) + '</b>') + MR.kv(p.state === 'HR' ? 'CGST + SGST' : 'IGST', u.inr(cv * 0.18)) + MR.kv('With GST', '<b>' + u.inr(contract) + '</b>') + '</dl></div></section>';
    var cost = p.cost, poC = S().pos.filter(function (o) { return o.projectId === p.id && o.status !== 'cancelled'; }).reduce(function (a, o) { return a + MR.poTotal(o).sub; }, 0);
    h += '<section class="panel"><div class="panel-hd"><h3>Margin</h3></div><div class="panel-bd"><dl class="kvs">' + MR.kv('Budget cost', u.inr(cost)) + MR.kv('Committed on POs', u.inr(poC)) + MR.kv('Quoted margin', u.pct((p.value - p.cost) / p.value * 100, 1)) + MR.kv('Forecast margin', '<b>' + u.pct(MR.forecastMargin(p) * 100, 1) + '</b>') + '</dl><p class="callout" style="margin-top:8px">' + ic('spark') + 'Forecast swaps budgeted material for the actual PO rates you have committed.</p></div></section></aside></div>';
    return h;
  }
  MR.forecastMargin = function (p) {
    var q = MR.quote(p.quoteId), v = q.versions[(q.sig ? q.sig.v : q.versions.length) - 1], matBudget = 0, lab = 0;
    v.sections.forEach(function (s) { s.items.forEach(function (i) { matBudget += MR.lineQty(i) * i.mat; lab += MR.lineQty(i) * i.lab; }); });
    var poByKey = 0, budgetCovered = 0;
    S().pos.forEach(function (o) { if (o.projectId !== p.id || o.status === 'cancelled') return; o.lines.forEach(function (l) { poByKey += l.qty * l.rate; var it = null; v.sections.forEach(function (s) { s.items.forEach(function (i) { if (l.keys && l.keys.indexOf(i.key) > -1) it = i; }); }); budgetCovered += l.qty * (it ? it.mat : l.rate); }); });
    var coVal = 0, coCost = 0; (p.cos || []).forEach(function (c) { if (c.status === 'approved') { coVal += c.amount; c.items.forEach(function (i) { coCost += MR.lineCost(i); }); } });
    var cost = matBudget - budgetCovered + poByKey + lab + coCost, val = p.value + coVal;
    return val ? (val - cost) / val : 0;
  };

  /* ---------------- change orders ---------------- */
  var COS = { draft: ['Draft', 'grey'], sent: ['Awaiting client', 'warn'], approved: ['Approved', 'ok'], rejected: ['Declined', 'bad'] };
  function cosHtml(p) {
    var list = p.cos || [], h = '<div class="tbar"><p class="muted" style="max-width:620px">Anything outside the signed scope becomes a change order. The client approves it on a link; approved changes revise the contract value and are billed 100% on approval.</p><span class="grow"></span>' + (MR.can('co.create') ? MR.btn('co-new', 'New change order', { cls: 'pri', icon: 'plus', id: p.id }) : '') + '</div>';
    if (!list.length) return h + MR.empty('edit', 'No change orders', 'Scope is exactly as signed. When the client asks for something extra, raise it here first.');
    return h + list.slice().reverse().map(function (co) {
      var link = location.origin + location.pathname + '#/c/' + co.token;
      return '<article class="co-card"><div class="hd"><span class="tag">' + esc(co.no) + '</span><b>' + esc(co.title) + '</b>' + MR.pill(co.status, COS) + '<span class="amt">+' + u.inr(co.amount) + '</span></div><div class="bd"><p class="muted" style="margin-bottom:8px">' + esc(co.reason) + '</p><table class="tbl" style="font-size:12px"><tbody>' + co.items.map(function (i) { return '<tr><td style="height:30px">' + esc(i.code || '') + ' ' + esc(i.name) + '</td><td class="num">' + u.fnum(i.qty) + ' ' + esc(i.unit) + '</td><td class="num">' + u.inr(MR.lineAmt(i)) + '</td></tr>'; }).join('') + '</tbody></table><div style="display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap"><span class="muted" style="font-size:12px;flex:1">Raised ' + u.rel(co.created) + ' by ' + esc(MR.userById(co.by).name) + (co.decidedAt ? ' · ' + (co.status === 'approved' ? 'approved' : 'declined') + ' by ' + esc(co.signedBy) + ' ' + u.rel(co.decidedAt) : '') + (co.clientNote ? ' · “' + esc(co.clientNote) + '”' : '') + '</span>' + (co.status === 'draft' && co.internal === 'pending' ? MR.tchip('waiting for Ira’s sign-off', 'violet', 'approve') : '') + (co.status === 'draft' && co.internal === 'returned' ? MR.tchip('returned: ' + (co.internalNote || ''), 'bad', 'flag') : '') + (co.status === 'draft' && co.internal !== 'pending' && MR.can('co.create') ? MR.btn('co-send', 'Send to client', { cls: 'sm pri', icon: 'send', id: co.id }) : '') + (co.status === 'sent' ? MR.btn('co-copy', 'Copy link', { cls: 'sm', icon: 'link', attrs: ' data-link="' + esc(link) + '"' }) : '') + '<a class="btn sm" href="#/c/' + co.token + '?preview=1">' + ic('eye') + '<span>Client view</span></a></div></div></article>';
    }).join('');
  }
  MR.act['co-new'] = function (el) {
    var p = MR.project(el.dataset.id);
    MR._coRows = [{ id: S().rates.filter(function (r) { return r.code === 'CP-406'; })[0].id, qty: 40 }];
    MR.openDlg(coForm(p), 'lg');
  };
  function coForm(p) {
    var rows = MR._coRows, items = rows.map(function (r) { var x = MR.rate(r.id), it = MR.lineFrom(x, r.qty, null); return it; }), amt = items.reduce(function (a, i) { return a + MR.lineAmt(i); }, 0);
    return '<div class="dlg-hd"><h2 id="dlgT">New change order · ' + esc(p.code) + '</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><label class="field"><span>Title</span><input class="inp" id="coT" placeholder="e.g. Walnut veneer on study wall" value="' + esc(MR._coT || '') + '"></label><label class="field"><span>Why (the client sees this)</span><input class="inp" id="coR" placeholder="e.g. Requested by client during site visit on 18 Nov" value="' + esc(MR._coR || '') + '"></label><div><b style="font-weight:600;font-size:12px">Lines</b><table class="tbl" style="margin-top:6px"><tbody>' + rows.map(function (r, i) { return '<tr><td><select class="sel" data-bind="co-rate" data-i="' + i + '" aria-label="Rate">' + S().rates.map(function (x) { return '<option value="' + x.id + '"' + (x.id === r.id ? ' selected' : '') + '>' + esc(x.code + ' · ' + x.name) + '</option>'; }).join('') + '</select></td><td style="width:110px"><input class="inp num" inputmode="decimal" value="' + r.qty + '" data-bind="co-qty" data-i="' + i + '" aria-label="Quantity"></td><td class="num" style="width:110px">' + u.inr(MR.lineAmt(items[i])) + '</td><td class="w0">' + MR.iconBtn('co-row-del', 'trash', 'Remove line', { cls: 'sm', attrs: ' data-i="' + i + '"' }) + '</td></tr>'; }).join('') + '</tbody></table><button type="button" class="btn ghost sm" style="margin-top:6px" data-act="co-row-add">' + ic('plus') + '<span>Add line</span></button></div>' + (MR.coPreview ? MR.coPreview(p, items) : '') + '<span class="err" id="coErr"></span></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('co-create', 'Save draft', { id: p.id }) + (MR.S.role === 'owner' ? MR.btn('co-create', 'Apply and send to client', { cls: 'pri', id: p.id, attrs: ' data-send="1"' }) : MR.btn('co-create', 'Send to Ira for sign-off', { cls: 'pri', id: p.id, attrs: ' data-ask="1"' })) + '</div>';
  }
  function coRedraw() { MR._coT = document.getElementById('coT').value; MR._coR = document.getElementById('coR').value; var p = MR.project(MR.route().p[1]); document.getElementById('dlg').innerHTML = coForm(p); }
  MR.bind['co-rate'] = function (el) { MR._coRows[+el.dataset.i].id = el.value; coRedraw(); };
  MR.bind['co-qty'] = function (el) { MR._coRows[+el.dataset.i].qty = Math.max(1, u.num(el.value)); coRedraw(); };
  MR.act['co-row-add'] = function () { MR._coRows.push({ id: S().rates[0].id, qty: 1 }); coRedraw(); };
  MR.act['co-row-del'] = function (el) { MR._coRows.splice(+el.dataset.i, 1); coRedraw(); };
  MR.act['co-create'] = function (el) {
    var p = MR.project(el.dataset.id), t = document.getElementById('coT').value.trim(), rsn = document.getElementById('coR').value.trim();
    if (!t) { document.getElementById('coErr').textContent = 'Give the change a short title the client will understand.'; document.getElementById('coT').focus(); return; }
    if (!MR._coRows.length) { document.getElementById('coErr').textContent = 'Add at least one line.'; return; }
    var items = MR._coRows.map(function (r) { return MR.lineFrom(MR.rate(r.id), r.qty, null); }), amt = Math.round(items.reduce(function (a, i) { return a + MR.lineAmt(i); }, 0));
    p.cos = p.cos || []; var n = p.cos.length + 1;
    var co = { id: u.uid('co'), projectId: p.id, no: 'CO-' + u.pad(n, 2), title: t, reason: rsn || 'Requested by client', items: items, amount: amt, status: 'draft', created: new Date().toISOString(), by: MR.me().id, token: 'co' + p.code.slice(-3) + n + Math.random().toString(36).slice(2, 5) };
    p.cos.push(co); MR._coT = MR._coR = '';
    MR.audit('change order', p.code + ' ' + co.no, 'created', t + ' · ' + u.lakh(amt));
    if (el.dataset.send) { co.internal = 'approved'; co.internalAt = new Date().toISOString(); sendCO(co, p); }
    if (el.dataset.ask) { co.internal = 'pending'; co.submittedAt = new Date().toISOString(); MR.notify(['owner'], MR.me().name.split(' ')[0] + ' raised ' + co.no + ' on ' + p.name.split(',')[0] + ' for your sign-off', '#/approvals', 'approve'); }
    MR.save(); MR.closeDlg(); MR.go('#/project/' + p.id + '?tab=cos'); MR.render(); MR.toast(co.no + (el.dataset.send ? ' sent to the client' : el.dataset.ask ? ' sent to Ira for sign-off' : ' saved as draft'));
  };
  function sendCO(co, p) { co.status = 'sent'; co.sentAt = new Date().toISOString(); MR.audit('change order', p.code + ' ' + co.no, 'sent', 'Sent to client for approval'); }
  MR.act['co-send'] = function (el) { var p = MR.project(MR.route().p[1]), co = MR.find(p.cos, el.dataset.id); sendCO(co, p); MR.save(); MR.render(); MR.copy(location.origin + location.pathname + '#/c/' + co.token, co.no + ' sent. Approval link copied.'); };
  MR.act['co-copy'] = function (el) { MR.copy(el.dataset.link, 'Approval link copied'); };

  /* =============================== CONVERT =============================== */
  MR.act['q-convert'] = function () {
    var q = MR.quote(MR.route().p[1]), d = u.pd(u.addD(u.today(), 5)); while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
    var start = u.ds(d), v = q.versions[q.sig.v - 1], val = MR.calc(q, v).taxable, ms = MR.makeMilestones(v.sections, start, val), sch = MR.makeSchedule(q.terms || '40/30/25/5', ms, val);
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">Convert ' + esc(q.no) + ' to a project</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><p class="muted">Builds ' + ms.length + ' milestones from the signed BOQ (by trade, not by room), and ties the ' + esc(q.terms) + ' payment schedule to them.</p><div class="grid2"><label class="field"><span>Site start</span><input class="inp" type="date" id="cvStart" value="' + start + '"></label><label class="field"><span>Payment terms</span><select class="sel" id="cvTerms">' + Object.keys(MR.SCHEDULES).map(function (k) { return '<option' + (k === q.terms ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select></label><label class="field"><span>Project manager</span><select class="sel" id="cvPm">' + MR.USERS.filter(function (x) { return x.role === 'pm'; }).map(function (x) { return '<option value="' + x.id + '"' + (x.id === q.owner ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select></label><label class="field"><span>Site engineer</span><select class="sel" id="cvEng">' + MR.USERS.filter(function (x) { return x.role === 'site'; }).map(function (x) { var n = S().projects.filter(function (p) { return p.eng === x.id && p.status !== 'handed'; }).length; return '<option value="' + x.id + '">' + esc(x.name) + ' · ' + n + ' live site' + (n === 1 ? '' : 's') + '</option>'; }).join('') + '</select></label></div><div class="panel"><div class="panel-bd" style="padding:10px 14px">' + sch.map(function (s) { var m = MR.find(ms, s.msId); return '<div class="row" style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px"><span><b>' + s.pct + '%</b> · ' + esc(s.label) + ' <span class="faint">(' + esc(m.name) + ', ' + u.fshort(m.end) + ')</span></span><span>' + u.inr(s.amount) + '</span></div>'; }).join('') + '</div></div></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('q-convert-ok', 'Create project', { cls: 'pri', icon: 'arrow' }) + '</div>');
  };
  MR.act['q-convert-ok'] = function () {
    var q = MR.quote(MR.route().p[1]), v = q.versions[q.sig.v - 1], c = MR.calc(q, v), start = document.getElementById('cvStart').value || u.today(), terms = document.getElementById('cvTerms').value;
    var cl = MR.client(q.clientId), n = MR.next('p');
    var p = { id: 'p' + u.uid(''), code: 'MR-P-' + u.today().slice(2, 4) + '-' + u.pad(n, 3), quoteId: q.id, clientId: cl.id, name: q.name, site: q.site, city: q.city, state: q.state, pm: document.getElementById('cvPm').value, eng: document.getElementById('cvEng').value, start: start, value: Math.round(c.taxable), cost: Math.round(c.cost), status: 'active', cover: null, terms: terms, cos: [], handedAt: null, created: new Date().toISOString() };
    p.milestones = MR.makeMilestones(v.sections, start, p.value); p.end = p.milestones[p.milestones.length - 1].end;
    p.schedule = MR.makeSchedule(terms, p.milestones, p.value); p.schedule[0].onSign = true;
    S().projects.unshift(p); q.status = 'converted'; q.projectId = p.id;
    MR.audit('project', p.code, 'created', 'Converted from ' + q.no + ' v' + v.n + ' · ' + u.lakh(p.value) + ' + GST');
    MR.notify(['accounts', 'owner'], p.name.split(',')[0] + ' is now project ' + p.code + '. The ' + p.schedule[0].pct + '% booking advance is ready to bill.', '#/project/' + p.id + '?tab=billing', 'ok');
    MR.notify(['site'], 'New site assigned: ' + p.name + ', starts ' + u.fdate(start), '#/project/' + p.id, 'info');
    MR.save(); MR.closeDlg(); MR.go('#/project/' + p.id + '?tab=timeline'); MR.toast(p.code + ' created with ' + p.milestones.length + ' milestones');
  };

  /* =============================== PROCUREMENT =============================== */
  MR.poTable = function (list, inProject) {
    if (!list.length) return MR.empty('truck', 'No purchase orders', 'Raise POs to vendors straight from BOQ lines; deliveries are tracked against them.', MR.can('proc.edit') ? MR.btn('new-po', 'New purchase order', { cls: 'pri', icon: 'plus' }) : '');
    var mv = MR.can('money.view');
    return '<div class="tw"><table class="tbl"><thead><tr><th>PO</th><th>Vendor</th>' + (inProject ? '' : '<th class="hide-sm">Project</th>') + '<th class="hide-sm">Issued</th><th>Expected</th><th>Status</th><th class="hide-sm">Received</th>' + (mv ? '<th class="num">Amount</th>' : '') + '</tr></thead><tbody>' + list.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).map(function (o) {
      var st = poState(o), v = MR.vendor(o.vendorId), q = 0, rc = 0; o.lines.forEach(function (l) { q += l.qty; rc += l.recd; });
      return '<tr class="click" data-href="#/po/' + o.id + '"><td><a class="rl" href="#/po/' + o.id + '">' + esc(o.no) + '</a><span class="sub">' + o.lines.length + ' line' + (o.lines.length > 1 ? 's' : '') + ' · ' + esc(v.cat) + '</span></td><td>' + esc(v.name) + '</td>' + (inProject ? '' : '<td class="hide-sm">' + esc(MR.project(o.projectId).name.split(',')[0]) + '</td>') + '<td class="hide-sm nowrap">' + u.fshort(o.date) + '</td><td class="nowrap' + (st === 'late' ? ' bad' : '') + '">' + u.fshort(o.expected) + '</td><td>' + MR.pill(st, POSTAT) + '</td><td class="hide-sm" style="min-width:90px"><div class="bar ok"><i style="width:' + Math.round(rc / Math.max(1, q) * 100) + '%"></i></div></td>' + (mv ? '<td class="num">' + u.inr(MR.poTotal(o).total) + '</td>' : '') + '</tr>';
    }).join('') + '</tbody></table></div>';
  };
  MR.views.pos = function (r) {
    var vk = r.qs.view || 'open', V = [['open', 'Open', function (o) { return o.status === 'issued' || o.status === 'partial'; }], ['late', 'Late', function (o) { return poState(o) === 'late'; }], ['delivered', 'Delivered', function (o) { return o.status === 'delivered'; }], ['all', 'All', function () { return true; }]];
    var vd = V.filter(function (x) { return x[0] === vk; })[0] || V[0], list = S().pos.filter(vd[2]);
    var h = '<div class="page"><div class="ph"><div><h1>Purchase orders</h1><p class="sub">Material ordered against BOQ lines, so every rupee spent maps back to a room and a quote. Delivery is confirmed on site by the engineer.</p></div><div class="acts">' + (MR.can('proc.edit') ? MR.btn('new-po', 'New purchase order', { cls: 'pri', icon: 'plus' }) : '') + '</div></div>';
    h += '<div class="views">' + V.map(function (v) { return '<a href="#/pos?view=' + v[0] + '"' + (vk === v[0] ? ' aria-current="page"' : '') + '>' + v[1] + ' <span class="ct">' + S().pos.filter(v[2]).length + '</span></a>'; }).join('') + '</div>';
    return { html: h + MR.poTable(list) + '</div>', title: 'Purchase orders', crumbs: [['Purchase orders']], nav: 'pos' };
  };
  MR.views.po = function (r) {
    MR.loadHand();
    var o = MR.po(r.p[1]); if (!o) return { html: MR.notFound('That purchase order does not exist.'), title: 'PO', crumbs: [['Purchase orders', '#/pos'], ['Not found']], nav: 'pos' };
    var v = MR.vendor(o.vendorId), p = MR.project(o.projectId), co = S().company, t = MR.poTotal(o), intra = v.state === 'HR', st = poState(o), mv = MR.can('money.view');
    var h = '<div class="page narrow"><div class="ph noprint"><div><div class="eyebrow">' + MR.pill(st, POSTAT) + '</div><h1>' + esc(o.no) + '</h1><p class="sub">' + esc(v.name) + ' · for <a class="rowlink" href="#/project/' + p.id + '?tab=purchase">' + esc(p.name) + '</a></p></div><div class="acts">' + (MR.can('proc.receive') && (o.status === 'issued' || o.status === 'partial') ? MR.btn('po-receive', 'Record delivery', { cls: 'pri', icon: 'truck', id: o.id }) : '') + MR.btn('print', 'Print', { icon: 'print' }) + '</div></div>';
    if (o.note) h += '<div class="banner warn noprint">' + ic('flag') + '<div class="bt"><b>Note</b>' + esc(o.note) + '</div></div>';
    h += '<article class="doc"><header class="doc-hd">' + MR.companyBlock() + '<div class="dt"><h2>Purchase order</h2><span>' + esc(o.no) + '</span><span>Dated ' + u.fdate(o.date) + '</span><span>Deliver by ' + u.fdate(o.expected) + '</span></div></header>';
    h += '<div class="doc-parties"><div><h4>Vendor</h4><b>' + esc(v.name) + '</b><br>' + esc(v.city) + '<br>GSTIN ' + esc(v.gstin) + '<br>' + esc(v.contact) + '</div><div><h4>Ship to</h4><b>' + esc(p.name) + '</b><br>' + esc(p.site) + ', ' + esc(p.city) + '<br>Site engineer: ' + esc(MR.userById(p.eng).name) + '</div><div><h4>Terms</h4>Payment ' + esc(v.terms) + '<br>Delivery to site, unloading by vendor<br>Quote ref ' + esc(MR.quote(p.quoteId).no) + '</div></div>';
    h += '<table><thead><tr><th>Item</th><th class="hide-sm">For</th><th class="num">Qty</th><th class="num">Received</th>' + (mv ? '<th class="num hide-sm">Rate</th><th class="num">Amount</th>' : '') + '</tr></thead><tbody>' + o.lines.map(function (l) { var uniq = l.rooms.filter(function (x, i, a) { return a.indexOf(x) === i; }); return '<tr><td><span class="mono faint">' + esc(l.code) + '</span> ' + esc(l.desc) + '</td><td class="hide-sm muted" style="font-size:12px">' + esc(uniq.slice(0, 2).join(', ') + (uniq.length > 2 ? ' +' + (uniq.length - 2) : '')) + '</td><td class="num">' + u.fnum(l.qty) + ' ' + esc(l.unit) + '</td><td class="num ' + (l.recd >= l.qty ? 'ok' : l.recd ? 'warn' : 'faint') + '">' + u.fnum(l.recd) + '</td>' + (mv ? '<td class="num hide-sm">' + u.fnum(l.rate) + '</td><td class="num">' + u.inr(l.qty * l.rate) + '</td>' : '') + '</tr>'; }).join('') + '</tbody></table>';
    if (mv) h += '<div class="doc-tot"><dl><div class="r"><dt>Subtotal</dt><dd>' + u.inr(t.sub) + '</dd></div>' + (intra ? '<div class="r"><dt>CGST 9%</dt><dd>' + u.inr(t.gst / 2) + '</dd></div><div class="r"><dt>SGST 9%</dt><dd>' + u.inr(t.gst / 2) + '</dd></div>' : '<div class="r"><dt>IGST 18%</dt><dd>' + u.inr(t.gst) + '</dd></div>') + '<div class="r g"><dt>PO total</dt><dd>' + u.inr(t.total) + '</dd></div></dl></div><p class="doc-words">' + esc(u.words(t.total)) + '</p>';
    h += '<div class="doc-sign"><div class="muted" style="font-size:12px">Please quote ' + esc(o.no) + ' on your challan and tax invoice.</div><div class="sigbox"><div class="sg"><span class="typed" style="font-size:24px;color:var(--ink-2)">' + esc(MR.userById(o.by).name) + '</span></div><small>For ' + esc(co.name) + '</small></div></div></article>';
    h += '<section class="panel noprint" style="margin-top:20px"><div class="panel-hd"><h2>Delivery tracking</h2></div><div class="panel-bd"><ul class="timeline"><li><span class="dot brand"></span><span><b>Issued</b> by ' + esc(MR.userById(o.by).name) + '</span><span class="when">' + u.fdate(o.date) + '</span></li>' + o.deliveries.map(function (d) { return '<li><span class="dot ok"></span><span><b>Received</b> by ' + esc(MR.userById(d.by).name) + (d.challan ? ' · challan ' + esc(d.challan) : '') + '<br><span class="muted">' + esc(d.note) + '</span>' + (d.photo ? '<br><img src="' + MR.photoSrc(d.photo, true) + '" alt="Delivery photo" style="width:120px;border-radius:6px;margin-top:6px">' : '') + '</span><span class="when">' + u.fdate(d.date) + '</span></li>'; }).join('') + (o.status !== 'delivered' ? '<li><span class="dot ' + (st === 'late' ? 'bad' : '') + '"></span><span><b>' + (st === 'late' ? 'Late · expected ' + u.diffD(o.expected, u.today()) + ' days ago' : 'Expected') + '</b></span><span class="when">' + u.fdate(o.expected) + '</span></li>' : '') + '</ul></div></section>';
    return { html: h + '</div>', title: o.no, crumbs: [['Purchase orders', '#/pos'], [o.no]], nav: MR.S.role === 'site' ? 'deliveries' : 'pos' };
  };
  MR.act['po-receive'] = function (el) {
    var o = MR.po(el.dataset.id);
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">Record delivery · ' + esc(o.no) + '</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><p class="muted">Count what arrived against the challan. Short deliveries keep the PO open.</p><table class="tbl"><thead><tr><th>Item</th><th class="num">Pending</th><th class="num">Received now</th></tr></thead><tbody>' + o.lines.map(function (l, i) { var pend = Math.max(0, l.qty - l.recd); return '<tr><td>' + esc(l.desc) + '</td><td class="num">' + u.fnum(pend) + ' ' + esc(l.unit) + '</td><td style="width:120px"><input class="inp num" inputmode="decimal" id="rc' + i + '" value="' + pend + '" aria-label="Received quantity for ' + esc(l.desc) + '"></td></tr>'; }).join('') + '</tbody></table><div class="grid2"><label class="field"><span>Challan number</span><input class="inp" id="rcCh" placeholder="e.g. DC-4471"></label><label class="field"><span>Note</span><input class="inp" id="rcNote" placeholder="e.g. Two boards chipped, kept aside"></label></div><label class="photo-pick" style="min-height:80px">' + ic('camera') + '<span id="rcPhL">Add a photo of the delivery (optional)</span><input type="file" accept="image/*" capture="environment" id="rcPh"></label><span class="err" id="rcErr"></span></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('po-receive-ok', 'Save delivery', { cls: 'pri', id: o.id }) + '</div>');
    var f = document.getElementById('rcPh'); f.addEventListener('change', function () { if (!f.files[0]) return; MR.downscale(f.files[0], 900, function (d) { MR._rcPhoto = d; document.getElementById('rcPhL').textContent = d ? 'Photo attached ✓' : 'Could not read that image'; }); });
    MR._rcPhoto = null;
  };
  MR.act['po-receive-ok'] = function (el) {
    var o = MR.po(el.dataset.id), any = 0, qtys = [], bad = false;
    o.lines.forEach(function (l, i) { var n = u.num(document.getElementById('rc' + i).value); if (n < 0 || n > l.qty - l.recd + 0.001) bad = true; qtys.push(n); any += n; });
    if (bad) { document.getElementById('rcErr').textContent = 'Received quantity cannot be more than what is pending.'; return; }
    if (!any) { document.getElementById('rcErr').textContent = 'Enter at least one received quantity.'; return; }
    var prev = { status: o.status, recd: o.lines.map(function (l) { return l.recd; }) };
    o.lines.forEach(function (l, i) { l.recd += qtys[i]; });
    var full = o.lines.every(function (l) { return l.recd >= l.qty; });
    o.status = full ? 'delivered' : 'partial';
    var d = { id: u.uid('dl'), date: u.today(), by: MR.me().id, note: document.getElementById('rcNote').value.trim() || (full ? 'Received in full.' : 'Part delivery received.'), challan: document.getElementById('rcCh').value.trim(), qtys: qtys, photo: MR._rcPhoto };
    o.deliveries.push(d);
    MR.audit('purchase order', o.no, 'delivery', (full ? 'Full' : 'Part') + ' delivery recorded' + (d.challan ? ' · ' + d.challan : ''));
    MR.notify(['pm', 'accounts'], o.no + ' (' + MR.vendor(o.vendorId).name + ') ' + (full ? 'delivered in full' : 'part delivered') + ' at ' + MR.project(o.projectId).name.split(',')[0], '#/po/' + o.id, 'ok');
    MR.save(); MR.closeDlg(); MR.render();
    MR.undoable('Delivery recorded on ' + o.no, function () { o.status = prev.status; o.lines.forEach(function (l, i) { l.recd = prev.recd[i]; }); o.deliveries.pop(); });
  };
  MR.act['new-po'] = function (el) {
    MR.closeMenu();
    var pid = (el.dataset && el.dataset.id) || (MR.route().p[0] === 'project' ? MR.route().p[1] : '') || S().projects.filter(function (p) { return p.status !== 'handed'; })[0].id;
    MR._po = { pid: pid, vid: null, sel: {} };
    poDlg();
  };
  function poLines(p, vid) {
    var v = MR.vendor(vid), q = MR.quote(p.quoteId), ver = q.versions[(q.sig ? q.sig.v : q.versions.length) - 1], out = {};
    ver.sections.forEach(function (s) { s.items.forEach(function (i) { if (i.cat !== v.cat || !i.mat) return; var g = out[i.code] || (out[i.code] = { code: i.code, desc: i.name, unit: i.unit, qty: 0, rate: i.mat, keys: [], rooms: [] }); g.qty += Math.round(MR.lineQty(i)); g.keys.push(i.key); g.rooms.push(s.title); }); });
    var ordered = {}; S().pos.forEach(function (o) { if (o.projectId === p.id && o.status !== 'cancelled') o.lines.forEach(function (l) { ordered[l.code] = (ordered[l.code] || 0) + l.qty; }); });
    return Object.keys(out).map(function (k) { var g = out[k]; g.ordered = ordered[k] || 0; g.pending = Math.max(0, g.qty - g.ordered); return g; });
  }
  function poDlg() {
    var st = MR._po, p = MR.project(st.pid), live = S().projects.filter(function (x) { return x.status !== 'handed'; });
    var cats = {}; MR.quote(p.quoteId).versions[0].sections.forEach(function (s) { s.items.forEach(function (i) { if (i.mat) cats[i.cat] = 1; }); });
    var vendors = S().vendors.filter(function (v) { return cats[v.cat]; });
    if (!st.vid || !MR.find(vendors, st.vid)) st.vid = vendors[0].id;
    var lines = poLines(p, st.vid), v = MR.vendor(st.vid);
    var h = '<div class="dlg-hd"><h2 id="dlgT">New purchase order</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><div class="grid2"><label class="field"><span>Project</span><select class="sel" data-bind="po-p">' + live.map(function (x) { return '<option value="' + x.id + '"' + (x.id === p.id ? ' selected' : '') + '>' + esc(x.code + ' · ' + x.name.split(',')[0]) + '</option>'; }).join('') + '</select></label><label class="field"><span>Vendor</span><select class="sel" data-bind="po-v">' + vendors.map(function (x) { return '<option value="' + x.id + '"' + (x.id === st.vid ? ' selected' : '') + '>' + esc(x.name + ' · ' + MR.CAT_SHORT[x.cat]) + '</option>'; }).join('') + '</select><small>' + esc(v.terms) + ' · usual lead time ' + v.lead + ' days · ★ ' + v.rating + '</small></label></div>';
    h += '<b style="font-weight:600;font-size:12px">BOQ lines for ' + esc(v.cat.toLowerCase()) + ' from the signed quote</b>';
    h += lines.length ? '<div class="tw"><table class="tbl"><thead><tr><th class="chkc"></th><th>Item</th><th class="num">BOQ</th><th class="num">On POs</th><th class="num">Order</th><th class="num">Rate ₹</th></tr></thead><tbody>' + lines.map(function (l, i) { var s = st.sel[l.code]; return '<tr><td class="chkc"><input type="checkbox" id="pl' + i + '" data-code="' + esc(l.code) + '"' + (s || (!Object.keys(st.sel).length && l.pending) ? ' checked' : '') + ' aria-label="Include ' + esc(l.desc) + '"></td><td>' + esc(l.desc) + '<span class="sub">' + esc(l.rooms.filter(function (x, j, a) { return a.indexOf(x) === j; }).join(', ')) + '</span></td><td class="num">' + u.fnum(l.qty) + '</td><td class="num faint">' + u.fnum(l.ordered) + '</td><td style="width:96px"><input class="inp num" id="pq' + i + '" inputmode="decimal" value="' + (l.pending || l.qty) + '" aria-label="Order quantity"></td><td style="width:96px"><input class="inp num" id="pr' + i + '" inputmode="decimal" value="' + l.rate + '" aria-label="Rate"></td></tr>'; }).join('') + '</tbody></table></div>' : MR.empty('box', 'Nothing to order from this vendor', 'The signed BOQ has no ' + esc(v.cat.toLowerCase()) + ' material. Pick another vendor.');
    h += '<label class="field"><span>Deliver by</span><input class="inp" type="date" id="poExp" value="' + u.addD(u.today(), Math.min(v.lead, 21)) + '" style="max-width:200px"></label><span class="err" id="poErr"></span></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('po-create', 'Issue PO', { cls: 'pri', icon: 'send' }) + '</div>';
    MR._poLines = lines;
    MR.openDlg(h, 'lg');
  }
  MR.bind['po-p'] = function (el) { MR._po.pid = el.value; MR._po.sel = {}; poDlg(); };
  MR.bind['po-v'] = function (el) { MR._po.vid = el.value; MR._po.sel = {}; poDlg(); };
  MR.act['po-create'] = function () {
    var st = MR._po, p = MR.project(st.pid), lines = [];
    MR._poLines.forEach(function (l, i) { var c = document.getElementById('pl' + i); if (!c || !c.checked) return; var q = u.num(document.getElementById('pq' + i).value), r = u.num(document.getElementById('pr' + i).value); if (q > 0) lines.push({ id: u.uid('pl'), code: l.code, desc: l.desc, unit: l.unit, qty: q, rate: r, keys: l.keys, rooms: l.rooms, recd: 0 }); });
    if (!lines.length) { document.getElementById('poErr').textContent = 'Tick at least one line with a quantity above zero.'; return; }
    var exp = document.getElementById('poExp').value || u.addD(u.today(), 7);
    var o = { id: u.uid('po'), no: 'MR-PO-' + MR.next('po'), vendorId: st.vid, projectId: p.id, date: u.today(), expected: exp, lines: lines, status: 'issued', deliveries: [], by: MR.me().id, note: '' };
    S().pos.unshift(o); MR.audit('purchase order', o.no, 'issued', MR.vendor(st.vid).name + ' · ' + p.code + ' · ' + u.inr(MR.poTotal(o).total));
    MR.notify(['site'], o.no + ' issued to ' + MR.vendor(st.vid).name + ' for ' + p.name.split(',')[0] + ', delivery by ' + u.fdate(exp), '#/po/' + o.id, 'info');
    MR.save(); MR.closeDlg(); MR.go('#/po/' + o.id); MR.toast(o.no + ' issued');
  };

  /* vendors */
  MR.views.vendors = function (r) {
    var sel = r.qs.v, mv = MR.can('money.view'), t = u.today().slice(0, 4);
    var h = '<div class="page"><div class="ph"><div><h1>Vendors</h1><p class="sub">The workshops, depots and suppliers behind every site. Rated after each delivery.</p></div></div><div class="tw"><table class="tbl"><thead><tr><th>Vendor</th><th class="hide-sm">Category</th><th class="hide-sm">Location</th><th class="hide-sm">GSTIN</th><th>Terms</th><th class="num hide-sm">Lead time</th><th class="num">Rating</th><th class="num">Open POs</th>' + (mv ? '<th class="num hide-sm">Spend this FY</th>' : '') + '</tr></thead><tbody>' + S().vendors.map(function (v) {
      var pos = S().pos.filter(function (o) { return o.vendorId === v.id; }), open = pos.filter(function (o) { return o.status === 'issued' || o.status === 'partial'; }).length, spend = pos.reduce(function (a, o) { return a + MR.poTotal(o).total; }, 0);
      return '<tr class="click' + (sel === v.id ? ' kb' : '') + '" data-href="#/vendors?v=' + v.id + '"><td><b style="font-weight:550">' + esc(v.name) + '</b><span class="sub">' + esc(v.contact) + ' · ' + esc(v.phone) + '</span></td><td class="hide-sm"><span class="tag">' + esc(MR.CAT_SHORT[v.cat]) + '</span></td><td class="hide-sm">' + esc(v.city) + '</td><td class="hide-sm mono">' + esc(v.gstin) + '</td><td class="nowrap">' + esc(v.terms) + '</td><td class="num hide-sm">' + v.lead + ' d</td><td class="num nowrap">★ ' + v.rating.toFixed(1) + '</td><td class="num">' + (open || '<span class="faint">0</span>') + '</td>' + (mv ? '<td class="num hide-sm">' + u.lakh(spend) + '</td>' : '') + '</tr>' + (sel === v.id ? '<tr><td colspan="9" style="background:var(--surface-2);padding:12px">' + (pos.length ? MR.poTable(pos) : '<p class="muted">No purchase orders yet.</p>') + '</td></tr>' : '');
    }).join('') + '</tbody></table></div></div>';
    return { html: h, title: 'Vendors', crumbs: [['Vendors']], nav: 'vendors' };
  };
})();
