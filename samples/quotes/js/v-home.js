/* Studio OS: home (role-aware), approvals queue, audit log, shared charts. */
(function () {
  'use strict';
  var MR = window.MR, u = MR.u, esc = u.esc, ic = MR.ic;
  MR.views = MR.views || {}; MR.act = MR.act || {}; MR.bind = MR.bind || {}; MR.live = MR.live || {};

  /* ---------------- shared metrics ---------------- */
  MR.metrics = function () {
    var S = MR.S, t = u.today(), m = {};
    var open = S.quotes.filter(function (q) { return ['draft', 'review', 'approved', 'sent', 'viewed', 'changes', 'rejected'].indexOf(q.status) > -1; });
    m.pipeline = open.reduce(function (a, q) { return a + MR.qTotal(q); }, 0); m.pipelineN = open.length;
    var qStart = (function () { var d = u.pd(t); var qm = Math.floor(d.getMonth() / 3) * 3; return u.ds(new Date(d.getFullYear(), qm, 1)); })();
    var won = S.quotes.filter(function (q) { return q.sig; }), lost = S.quotes.filter(function (q) { return q.status === 'lost'; });
    m.wonQ = won.filter(function (q) { return q.sig.at.slice(0, 10) >= qStart; }).reduce(function (a, q) { return a + MR.calc(q, q.versions[q.sig.v - 1]).taxable; }, 0);
    m.winRate = won.length / Math.max(1, won.length + lost.length); m.wonN = won.length; m.decided = won.length + lost.length;
    m.recv = 0; m.overdue = 0; m.overdueN = 0;
    S.invoices.forEach(function (iv) { var st = MR.invState(iv); m.recv += st.balance; if (st.key === 'overdue') { m.overdue += st.balance; m.overdueN++; } });
    m.next30 = MR.forecast(5).slice(0, 5).reduce(function (a, w) { return a + w.inflow; }, 0);
    m.active = S.projects.filter(function (p) { return p.status !== 'handed'; });
    m.collectedMonth = S.payments.filter(function (p) { return p.date.slice(0, 7) === t.slice(0, 7); }).reduce(function (a, p) { return a + p.amount; }, 0);
    return m;
  };

  // weekly cash forecast: inflows from open invoices + upcoming schedule; outflows from open POs
  MR.forecast = function (weeks) {
    var S = MR.S, t = u.today(), out = [];
    var mon = u.pd(t); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
    for (var i = 0; i < weeks; i++) { var s = u.ds(new Date(mon.getTime() + i * 7 * 864e5)); out.push({ start: s, end: u.addD(s, 6), inflow: 0, outflow: 0, items: [] }); }
    function slot(date) { if (date < out[0].start) return out[0]; for (var i = 0; i < out.length; i++) if (date <= out[i].end) return out[i]; return null; }
    S.invoices.forEach(function (iv) {
      var st = MR.invState(iv); if (!st.balance) return;
      var exp = st.key === 'overdue' ? u.addD(t, Math.min(21, 3 + Math.round(st.overdue / 4))) : iv.due;
      var w = slot(exp); if (w) { w.inflow += st.balance; w.items.push({ k: 'in', t: iv.no + ' · ' + MR.client(iv.clientId).name, a: st.balance }); }
    });
    S.projects.forEach(function (p) {
      if (p.status === 'handed') return;
      var intra = p.state === 'HR';
      p.schedule.forEach(function (ps) {
        if (ps.invoiceId || !ps.msId) return;
        var m = MR.find(p.milestones, ps.msId); if (!m) return;
        var c = MR.client(p.clientId), due = u.addD(m.end < t ? t : m.end, c.kind === 'Commercial' ? 20 : 10);
        var w = slot(due); if (w) { var a = Math.round(ps.amount * 1.18); w.inflow += a; w.items.push({ k: 'in', t: p.name.split(',')[0] + ' · ' + ps.pct + '% milestone', a: a, f: 1 }); }
      });
    });
    S.pos.forEach(function (o) {
      if (o.status === 'cancelled' || o.paid) return;
      var v = MR.vendor(o.vendorId), days = /Net (\d+)/.exec(v.terms); days = days ? +days[1] : 0;
      var amt = MR.poTotal(o).total;
      var due = u.addD(o.status === 'delivered' ? (o.deliveries[o.deliveries.length - 1] || {}).date || o.expected : o.expected, days);
      if (due < u.addD(t, -10)) return; // older bills assumed settled
      var w = slot(due < t ? t : due); if (w) { w.outflow += amt; w.items.push({ k: 'out', t: o.no + ' · ' + v.name, a: amt }); }
    });
    return out;
  };
  MR.poTotal = function (o) { var sub = o.lines.reduce(function (a, l) { return a + l.qty * l.rate; }, 0); return { sub: sub, gst: sub * 0.18, total: Math.round(sub * 1.18) }; };

  /* inbox: what needs this role */
  MR.inbox = function () {
    var S = MR.S, r = S.role, me = MR.me(), out = [], t = u.today();
    function add(icon, tone, title, sub, href) { out.push({ icon: icon, tone: tone, title: title, sub: sub, href: href }); }
    if (r === 'owner') S.quotes.filter(function (q) { return q.status === 'review'; }).forEach(function (q) { var v = MR.ver(q), c = MR.calc(q); add('approve', 'violet', 'Approve ' + q.no + ' v' + v.n + ' · ' + MR.client(q.clientId).name, MR.userById(q.owner).name.split(' ')[0] + ' submitted ' + u.rel(v.submittedAt) + ' · ' + u.lakh(c.taxable) + ' · margin ' + u.pct(c.margin * 100, 1) + (MR.policy(q).fails ? ' · policy flag' : ''), '#/quote/' + q.id); });
    if (r === 'owner' || r === 'pm') {
      S.quotes.forEach(function (q) {
        if (r === 'pm' && q.owner !== me.id) return;
        if (q.status === 'rejected') add('flag', 'bad', q.no + ' returned with comments', 'Ira: “' + (q.approvals[q.approvals.length - 1].comment || '').slice(0, 80) + '…”', '#/quote/' + q.id);
        if (q.status === 'approved') add('send', 'info', 'Send ' + q.no + ' to ' + MR.client(q.clientId).contact.split(' (')[0], 'Approved ' + u.rel(q.approvals[q.approvals.length - 1].at) + '. Ready for the client link.', '#/quote/' + q.id);
        var cm = q.comments.filter(function (c) { return c.by === 'client' && !c.resolved && c.v === MR.ver(q).n; });
        if (cm.length && ['viewed', 'sent', 'changes'].indexOf(q.status) > -1) add('comment', 'info', MR.client(q.clientId).contact.split(' (')[0] + ' left ' + cm.length + ' comment' + (cm.length > 1 ? 's' : '') + ' on ' + q.no, '“' + cm[cm.length - 1].text.slice(0, 70) + '…”', '#/quote/' + q.id);
        if (q.status === 'changes') add('edit', 'warn', 'Client asked for changes on ' + q.no, 'Make v' + (q.versions.length + 1) + ' from v' + q.versions.length, '#/quote/' + q.id);
        if (q.followUp && q.followUp <= u.addD(t, 1) && q.status === 'viewed') add('clock', 'warn', 'Follow up on ' + q.no + ' · ' + MR.client(q.clientId).name, 'Viewed ' + u.rel(MR.ver(q).viewedAt) + ', no reply since', '#/quote/' + q.id);
      });
      S.projects.forEach(function (p) {
        if (r === 'pm' && p.pm !== me.id) return;
        (p.cos || []).forEach(function (co) { if (co.status === 'sent') add('sign', 'warn', co.no + ' awaiting ' + MR.client(p.clientId).name, co.title + ' · sent ' + u.rel(co.sentAt), '#/project/' + p.id + '?tab=cos'); });
        S.pos.forEach(function (o) { if (o.projectId === p.id && o.status !== 'delivered' && o.status !== 'cancelled' && o.expected < t) add('truck', 'warn', o.no + ' delivery is ' + u.diffD(o.expected, t) + ' days late', MR.vendor(o.vendorId).name + ' · ' + p.name.split(',')[0], '#/po/' + o.id); });
      });
    }
    if (r === 'owner' || r === 'accounts') {
      MR.readyToBill().forEach(function (x) { add('invoice', 'ok', 'Ready to bill: ' + x.p.name.split(',')[0] + ' · ' + x.ps.pct + '%', x.ps.label + ' · ' + u.inr(x.ps.amount) + ' + GST', '#/project/' + x.p.id + '?tab=billing'); });
      S.invoices.forEach(function (iv) { var st = MR.invState(iv); if (st.key === 'overdue') add('ageing', 'bad', iv.no + ' overdue ' + st.overdue + ' days', MR.client(iv.clientId).name + ' · ' + u.inr(st.balance) + ' outstanding', '#/invoice/' + iv.id); });
    }
    if (r === 'pm' || r === 'owner') S.snags.filter(function (s) { var p = MR.project(s.projectId); return s.status !== 'closed' && s.sev === 'high' && (r === 'owner' || p.pm === me.id); }).forEach(function (s) { add('snag', 'bad', 'High snag: ' + s.title, MR.project(s.projectId).name.split(',')[0] + ' · ' + s.room, '#/project/' + s.projectId + '?tab=snags'); });
    return out;
  };
  MR.readyToBill = function () {
    var out = [];
    MR.S.projects.forEach(function (p) { if (p.status === 'handed') return; p.schedule.forEach(function (ps) { if (ps.invoiceId) return; var m = ps.msId && MR.find(p.milestones, ps.msId); if ((m && m.progress >= 100) || ps.onSign || (!ps.msId && ps.coId)) out.push({ p: p, ps: ps }); }); });
    return out;
  };
  MR.policy = function (q) {
    var v = MR.ver(q), c = MR.calc(q, v), checks = [];
    checks.push([c.margin >= 0.22, 'Gross margin ' + u.pct(c.margin * 100, 1) + (c.margin >= 0.22 ? ' (floor 22%)' : ', below the 22% floor')]);
    checks.push([(v.discPct || 0) <= 7.5, 'Discount ' + (v.discPct || 0) + '%' + ((v.discPct || 0) <= 7.5 ? ' (limit 7.5%)' : ', above the 7.5% limit')]);
    var custom = 0, stale = 0; v.sections.forEach(function (s) { s.items.forEach(function (i) { if (!i.rateId) custom++; var r = i.rateId && MR.rate(i.rateId); if (r && i.rv < r.hist.length) stale++; }); });
    checks.push([custom <= 3, custom ? custom + ' custom line' + (custom > 1 ? 's' : '') + ' outside the rate library' : 'Every line priced from the rate library']);
    checks.push([stale === 0, stale ? stale + ' line' + (stale > 1 ? 's use' : ' uses') + ' an older rate version' : 'All rates current']);
    return { checks: checks, fails: checks.filter(function (x) { return !x[0]; }).length };
  };

  /* ---------------- charts ---------------- */
  MR.barsChart = function (series, opt) {
    // series: [{label, a, b}] two bars per group
    opt = opt || {}; var W = opt.w || 640, H = opt.h || 220, pl = 44, pb = 26, pt = 10;
    var max = Math.max.apply(null, series.map(function (s) { return Math.max(s.a, s.b || 0); }).concat([1]));
    var step = Math.pow(10, Math.floor(Math.log10(max))), nice = Math.ceil(max / step) * step; if (nice / step < 3) { step /= 2; }
    var gw = (W - pl) / series.length, bw = Math.min(22, gw / 3.2);
    var h = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(opt.label || 'Chart') + '">';
    for (var y = 0; y <= nice; y += step) { var yy = pt + (H - pb - pt) * (1 - y / nice); h += '<line class="gl" x1="' + pl + '" x2="' + W + '" y1="' + yy + '" y2="' + yy + '"/><text x="' + (pl - 8) + '" y="' + (yy + 3) + '" text-anchor="end">' + (opt.fmt ? opt.fmt(y) : y) + '</text>'; }
    series.forEach(function (s, i) {
      var x = pl + gw * i + gw / 2, ha = (H - pb - pt) * s.a / nice, hb = (H - pb - pt) * (s.b || 0) / nice;
      h += '<rect class="gb" x="' + (x - bw - 1) + '" y="' + (H - pb - ha) + '" width="' + bw + '" height="' + ha + '" rx="2" fill="' + (opt.ca || '#C9D0C8') + '"><title>' + esc(s.label + ': ' + (opt.fmt ? opt.fmt(s.a) : s.a)) + '</title></rect>';
      if (s.b != null) h += '<rect class="gb" x="' + (x + 1) + '" y="' + (H - pb - hb) + '" width="' + bw + '" height="' + hb + '" rx="2" fill="' + (opt.cb || 'var(--brand)') + '"><title>' + esc(s.label + ': ' + (opt.fmt ? opt.fmt(s.b) : s.b)) + '</title></rect>';
      h += '<text x="' + x + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(s.label) + '</text>';
    });
    return h + '</svg>';
  };
  MR.growBars = function (root) {
    if (MR.still()) return;
    var bars = root.querySelectorAll('.gb'); if (!bars.length) return;
    window.gsap.from(bars, { scaleY: 0, transformOrigin: '50% 100%', duration: .7, ease: 'expo.out', stagger: .025 });
  };
  MR.monthSeries = function (n) {
    var S = MR.S, out = [], d = u.pd(u.today());
    for (var i = n - 1; i >= 0; i--) {
      var md = new Date(d.getFullYear(), d.getMonth() - i, 1), key = u.ds(md).slice(0, 7);
      var sent = 0, won = 0, wonN = 0, lostN = 0;
      S.quotes.forEach(function (q) {
        var v1 = q.versions[0]; if (v1.sentAt && v1.sentAt.slice(0, 7) === key) sent += MR.calc(q, v1).taxable;
        if (q.sig && q.sig.at.slice(0, 7) === key) { won += MR.calc(q, q.versions[q.sig.v - 1]).taxable; wonN++; }
      });
      S.audit.forEach(function (a) { if (a.action === 'marked lost' && a.at.slice(0, 7) === key) lostN++; });
      out.push({ label: u.MON[md.getMonth()], a: sent, b: won, wonN: wonN, lostN: lostN });
    }
    return out;
  };

  function greet() { var h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
  MR.greet = greet;
  function kpi(label, val, sub, href, icon) { return '<a class="kpi" href="' + href + '"><span class="lb">' + (icon ? ic(icon) : '') + esc(label) + '</span><div class="v" data-count="' + val.n + '" data-fmt="' + (val.f || 'lakh') + '">' + (val.f === 'pct' ? u.pct(val.n * 100) : u.lakh(val.n)) + '</div><div class="d">' + sub + '</div></a>'; }
  function inboxHtml(items, empty) {
    if (!items.length) return MR.empty('check', 'Inbox zero', empty || 'Nothing is waiting on you. New approvals, comments and overdue items land here.');
    return '<ul class="inbox">' + items.slice(0, 8).map(function (x) { return '<li><a href="' + x.href + '"><span class="ii ' + x.tone + '">' + ic(x.icon) + '</span><span class="it"><b>' + esc(x.title) + '</b><span>' + esc(x.sub) + '</span></span>' + ic('chevr', 'faint') + '</a></li>'; }).join('') + '</ul>' + (items.length > 8 ? '<div class="panel-ft"><span class="muted">' + (items.length - 8) + ' more</span></div>' : '');
  }
  MR.feedHtml = function (list, n) {
    var dot = { created: 'brand', sent: 'info', signed: 'ok', approved: 'violet', rejected: 'bad', recorded: 'ok', raised: 'info', delivery: 'ok', closed: 'ok', 'marked lost': 'bad', viewed: 'info', submitted: 'violet', edited: '', 'changes requested': 'warn' };
    return '<ul class="feed">' + list.slice(0, n || 12).map(function (a) {
      var who = a.by === 'client' ? 'Client' : MR.userById(a.by).name.split(' ')[0];
      return '<li>' + (a.by === 'client' ? '<span class="av" style="--h:200">C</span>' : MR.avatar(a.by)) + '<span><b>' + esc(who) + '</b> ' + esc(a.action) + ' <b>' + esc(a.ref) + '</b>' + (a.detail ? '<br><span class="muted">' + esc(a.detail) + '</span>' : '') + '</span><span class="t" title="' + esc(new Date(a.at).toLocaleString('en-IN')) + '">' + u.rel(a.at) + '</span></li>';
    }).join('') + '</ul>';
  };
  /* ---------------- shared queues (used by home, collections mode and approvals) ---------------- */
  MR.collectQueue = function () {
    var t = u.today();
    var list = MR.S.invoices.map(function (iv) { return { iv: iv, st: MR.invState(iv) }; }).filter(function (x) { return x.st.balance > 0; });
    list.sort(function (a, b) { return (b.st.overdue - a.st.overdue) || (a.iv.due < b.iv.due ? -1 : 1); });
    list.forEach(function (x) { var r = (x.iv.remarks || []); x.last = r[r.length - 1] || null; x.done = !!(x.last && x.last.at.slice(0, 10) === t); });
    return list;
  };
  MR.approvalItems = function () {
    var S = MR.S, pend = [], done = 0, wk = u.addD(u.today(), -7);
    S.quotes.forEach(function (q) { if (q.status === 'review') pend.push({ type: 'quote', id: 'aq-' + q.id, q: q, at: MR.ver(q).submittedAt }); q.approvals.forEach(function (a) { if (a.at.slice(0, 10) >= wk) done++; }); });
    (S.discReqs || []).forEach(function (d) { if (d.status === 'pending') pend.push({ type: 'disc', id: 'ad-' + d.id, d: d, q: MR.quote(d.quoteId), at: d.at }); else if ((d.decidedAt || '').slice(0, 10) >= wk) done++; });
    S.projects.forEach(function (p) { (p.cos || []).forEach(function (co) { if (co.internal === 'pending') pend.push({ type: 'co', id: 'ac-' + co.id, co: co, p: p, at: co.submittedAt || co.created }); else if (co.internalAt && co.internalAt.slice(0, 10) >= wk) done++; }); });
    pend.sort(function (a, b) { return a.at < b.at ? -1 : 1; });
    return { pend: pend, done: done, total: pend.length + done };
  };
  function nextMs(p) { return p.milestones.filter(function (m) { return m.progress < 100; })[0] || null; }
  MR.nextMs = nextMs;
  MR.billedOf = function (p) {
    var b = 0, r = 0; MR.S.invoices.forEach(function (iv) { if (iv.projectId === p.id) { b += iv.total; r += MR.invPaid(iv); } });
    var stages = p.schedule.filter(function (ps) { return ps.pct; });
    return { billed: b, recv: r, stages: stages.filter(function (ps) { return ps.invoiceId; }).length, of: stages.length, contract: MR.projValue(p) * 1.18 };
  };
  function meter(label, right, segs) { return '<div class="meter"><div class="mt"><span>' + label + '</span><b>' + right + '</b></div><div class="segbar" aria-hidden="true">' + segs.map(function (s) { return '<i style="width:' + Math.max(0, Math.min(100, s[0])) + '%;background:' + s[1] + '"></i>'; }).join('') + '</div></div>'; }
  MR.meter = meter;

  /* ---------------- project card: health meter, next milestone, billed vs received, site photo ---------------- */
  MR.projCard = function (p) {
    var h = MR.health(p), c = MR.client(p.clientId), nm = nextMs(p), b = MR.billedOf(p), mv = MR.can('money.view'), pr = MR.projProgress(p);
    var out = '<article class="pj"><a class="pj-cv" href="#/project/' + p.id + '" tabindex="-1" aria-hidden="true">' + (p.cover ? '<img src="' + MR.photoSrc(p.cover, true) + '" alt="" loading="lazy" decoding="async" width="480" height="225">' : '') + MR.healthDot(h) + '<span class="code">' + esc(p.code.replace('MR-P-', '')) + '</span></a><div class="pj-bd">';
    out += '<div><h3><a href="#/project/' + p.id + '">' + esc(p.name.split(',')[0]) + '</a></h3><div class="chips" style="margin-top:8px">' + MR.chipClient(c, { short: true }) + '<span class="avs" title="PM and site engineer">' + MR.avatar(p.pm) + MR.avatar(p.eng) + '</span></div></div>';
    out += '<div><div class="hmeter h-' + h.key + '" role="img" aria-label="Health: ' + esc(h.label) + '"><i></i><i></i><i></i></div><div class="muted" style="font-size:12.5px;margin-top:6px">' + esc(h.reasons[0]) + '</div></div>';
    out += nm ? '<div class="nextms"><span>Next: <b>' + esc(nm.name) + '</b> · ' + nm.progress + '%</span>' + MR.dueChip(nm.end) + '</div>' : '<div class="nextms"><span><b>Handed over</b></span>' + MR.tchip(u.fdate(p.handedAt || p.end), 'ok', 'check') + '</div>';
    if (mv) out += '<div class="bb"><div class="row"><span>Billed</span><div class="bar"><i style="width:' + (b.billed / b.contract * 100).toFixed(1) + '%;background:#D08A16"></i></div><b>' + u.lakh(b.billed) + '</b></div><div class="row"><span>Received</span><div class="bar ok"><i style="width:' + (b.recv / b.contract * 100).toFixed(1) + '%"></i></div><b>' + u.lakh(b.recv) + '</b></div></div>';
    out += '<div class="pj-ft"><span class="muted" style="font-size:12.5px">' + (mv ? b.stages + ' of ' + b.of + ' stages billed · ' : '') + Math.round(pr * 100) + '% built</span>' + (mv ? '<span style="font-weight:600">' + u.lakh(MR.projValue(p)) + '</span>' : '') + '</div>';
    return out + '</div></article>';
  };

  /* ---------------- work cards ---------------- */
  function wcard(o) {
    return '<article class="wcard" id="wc-' + o.id + '" data-g="' + o.g + '"><div class="wc-hd"><span class="wc-ic ' + (o.tone || '') + '" aria-hidden="true">' + ic(o.icon) + '</span><div style="min-width:0"><div class="wc-k">' + esc(o.k) + '</div><h3 class="wc-t">' + (o.href ? '<a href="' + o.href + '">' + esc(o.title) + '</a>' : esc(o.title)) + '</h3>' + (o.chips ? '<div class="chips wc-sub">' + o.chips + '</div>' : '') + '</div><div class="wc-time">' + (o.time || '') + '</div></div>' +
      (o.remark ? '<div class="remark' + (o.remark.quiet ? ' quiet' : '') + '"><span class="lb">' + esc(o.remark.lb) + (o.remark.who ? ' <span>· ' + esc(o.remark.who) + '</span>' : '') + '</span>' + esc(o.remark.text) + '</div>' : '') +
      (o.meta ? '<div class="wc-meta">' + o.meta + '</div>' : '') + (o.extra || '') +
      '<div class="wc-ft">' + (o.foot || '') + '<span class="grow"></span>' + (o.sec ? '<span class="wc-sec">' + o.sec + '</span>' + MR.iconBtn('wc-more', 'more', 'More actions', { cls: 'wc-more', id: o.id }) : '') + o.pri + '</div></article>';
  }
  MR.wcard = wcard;
  MR.act['wc-more'] = function (el) { var sec = document.querySelector('#wc-' + el.dataset.id + ' .wc-sec'); if (sec) MR.menu(el, sec.innerHTML.replace(/class="btn[^"]*"/g, ''), { right: true }); };
  MR.act['wc-focus'] = function (el) { MR._wf = Math.max(0, +el.dataset.i || 0); MR.render(); var w = document.getElementById('wlist'); if (w) w.scrollIntoView({ block: 'start', behavior: 'smooth' }); };
  if (window.matchMedia) { var mq = matchMedia('(max-width:640px)'), onMq = function () { if (MR.S && !MR.route().p.length && MR.S.role !== 'site' && MR.S.role !== 'client') MR.render(); }; if (mq.addEventListener) mq.addEventListener('change', onMq); }
  var OUT = { promised: 'Promised to pay', paid: 'Paid', dispute: 'Dispute', callback: 'Call back', noanswer: 'No answer', wrong: 'Wrong person', partial: 'Part paid' };
  MR.OUTCOMES = OUT;
  MR.workCards = function () {
    var S = MR.S, r = S.role, me = MR.me(), t = u.today(), out = [], mv = MR.can('money.view');
    var mine = function (uid) { return r !== 'pm' || uid === me.id; };
    // approvals (owner acts; pm sees what is waiting on Ira)
    if (r === 'owner') MR.approvalItems().pend.forEach(function (a) {
      if (a.type === 'quote') {
        var q = a.q, v = MR.ver(q), c = MR.calc(q, v), pol = MR.policy(q), prev = q.versions[v.n - 2], pc = prev && MR.calc(q, prev);
        var cr = q.comments.filter(function (x) { return x.kind === 'changes'; }).pop();
        out.push({ id: a.id, g: 'approve', icon: 'approve', tone: 'violet', k: 'Quote approval', title: q.no + ' v' + v.n + ' · ' + q.name, href: '#/quote/' + q.id, chips: MR.chipClient(MR.client(q.clientId)) + MR.chipUser(q.owner),
          time: MR.agoChip(v.submittedAt, 'sent', 'violet') + (pol.fails ? MR.tchip(pol.fails + ' policy flag' + (pol.fails > 1 ? 's' : ''), 'bad', 'flag') : MR.tchip('passes policy', 'ok', 'check')),
          remark: v.submitNote ? { lb: 'Note from ' + MR.userById(q.owner).name.split(' ')[0], text: v.submitNote } : cr ? { lb: 'Client asked', who: cr.who + ', ' + u.rel(cr.at), text: cr.text } : { lb: 'Version note', text: v.note || '', quiet: true },
          meta: meter('Margin vs 22% floor', u.pct(c.margin * 100, 1) + (pc ? ' (' + (c.margin >= pc.margin ? '+' : '−') + Math.abs((c.margin - pc.margin) * 100).toFixed(1) + ' pts vs v' + prev.n + ')' : ''), [[c.margin / 0.4 * 100, c.margin < 0.22 ? 'var(--bad)' : 'var(--ok)']]) + '<span>' + u.lakh(c.taxable) + ' + GST' + (pc ? ' · ' + (c.taxable >= pc.taxable ? '+' : '−') + u.lakh(Math.abs(c.taxable - pc.taxable)) + ' vs v' + prev.n : '') + '</span><span>Discount <b>' + (v.discPct || 0) + '%</b></span>',
          pri: MR.btn('wc-approve', 'Approve', { cls: 'pri', icon: 'check', id: q.id }), sec: (prev ? '<a class="btn ghost" href="#/quote/' + q.id + '/diff?a=' + prev.n + '&b=' + v.n + '">' + ic('diff') + '<span>What changed</span></a>' : '') + '<a class="btn" href="#/approvals">Review in queue</a>' });
      } else if (a.type === 'disc') {
        var q2 = a.q, c2 = MR.calc(q2), nm = (c2.taxable * (1 - a.d.pct / 100) - c2.cost) / (c2.taxable * (1 - a.d.pct / 100));
        out.push({ id: a.id, g: 'approve', icon: 'pay', tone: 'violet', k: 'Discount request · ' + a.d.pct + '%', title: q2.no + ' · ' + q2.name, href: '#/quote/' + q2.id, chips: MR.chipClient(MR.client(q2.clientId)) + MR.chipUser(a.d.by), time: MR.agoChip(a.at, 'asked', 'violet'),
          remark: { lb: 'Why', who: MR.userById(a.d.by).name.split(' ')[0], text: a.d.reason },
          meta: meter('Margin after discount', u.pct(c2.margin * 100, 1) + ' → ' + u.pct(nm * 100, 1), [[nm / 0.4 * 100, nm < 0.22 ? 'var(--bad)' : 'var(--ok)']]) + '<span>Value <b>−' + u.lakh(c2.taxable * a.d.pct / 100) + '</b></span>',
          pri: MR.btn('wc-disc', 'Approve ' + a.d.pct + '%', { cls: 'pri', icon: 'check', id: a.d.id }), sec: '<a class="btn" href="#/approvals">Review in queue</a>' });
      } else {
        out.push({ id: a.id, g: 'approve', icon: 'edit', tone: 'violet', k: 'Change order sign-off', title: a.co.no + ' · ' + a.co.title, href: '#/project/' + a.p.id + '?tab=cos', chips: MR.chipProject(a.p) + MR.chipUser(a.co.by), time: MR.agoChip(a.at, 'raised', 'violet'),
          remark: { lb: 'Reason', text: a.co.reason }, meta: '<span>Adds <b>' + u.lakh(a.co.amount) + '</b> + GST</span><span>Contract ' + u.lakh(MR.projValue(a.p)) + ' → <b>' + u.lakh(MR.projValue(a.p) + a.co.amount) + '</b></span>',
          pri: '<a class="btn pri" href="#/approvals">Review</a>' });
      }
    });
    // collections
    if (r === 'owner' || r === 'accounts') MR.collectQueue().forEach(function (x) {
      if (x.st.key !== 'overdue' && r === 'owner') return;
      var iv = x.iv, p = MR.project(iv.projectId), b = MR.billedOf(p);
      out.push({ id: 'col-' + iv.id, g: 'money', icon: 'ageing', tone: x.st.key === 'overdue' ? 'bad' : 'info', k: x.st.key === 'overdue' ? 'Collection · overdue' : 'Collection · coming due', title: u.inr(x.st.balance) + ' from ' + MR.client(iv.clientId).name, href: '#/invoice/' + iv.id,
        chips: MR.chipClient(MR.client(iv.clientId), { short: true }) + MR.chipProject(p) + MR.chipInvoice(iv), time: (x.st.key === 'overdue' ? MR.tchip(u.lakh(x.st.balance) + ' overdue ' + x.st.overdue + ' days', 'bad', 'clock') : MR.dueChip(iv.due)) + (x.done ? MR.tchip('followed up today', 'ok', 'check') : ''),
        remark: x.last ? { lb: 'Last remark · ' + OUT[x.last.outcome], who: u.rel(x.last.at), text: x.last.note } : { lb: 'Last remark', text: 'Nothing logged yet. The note you add in collections mode lands here.', quiet: true },
        meta: meter(b.stages + ' of ' + b.of + ' stages billed', u.lakh(b.recv) + ' received of ' + u.lakh(b.contract), [[b.recv / b.contract * 100, 'var(--ok)'], [(b.billed - b.recv) / b.contract * 100, '#D08A16']]) + (x.last && x.last.next ? '<span>Next follow-up <b>' + u.fshort(x.last.next) + '</b></span>' : ''),
        pri: '<a class="btn pri" href="#/collect?i=' + iv.id + '">' + ic('phone') + '<span>Follow up</span></a>', sec: MR.can('finance.edit') ? MR.btn('inv-remind', 'Reminder', { cls: 'ghost', icon: 'mail', id: iv.id }) : '' });
    });
    if (r === 'owner' || r === 'accounts') MR.readyToBill().forEach(function (x) {
      var m = x.ps.msId && MR.find(x.p.milestones, x.ps.msId), b = MR.billedOf(x.p);
      out.push({ id: 'bill-' + x.ps.id, g: r === 'accounts' ? 'bill' : 'money', icon: 'invoice', tone: 'ok', k: 'Ready to bill', title: x.p.name.split(',')[0] + ' · ' + (x.ps.pct ? x.ps.pct + '% ' : '') + x.ps.label.replace(/ \(100% on approval\)/, ''), href: '#/project/' + x.p.id + '?tab=billing', chips: MR.chipClient(MR.client(x.p.clientId), { short: true }) + MR.chipProject(x.p),
        time: MR.tchip(m && m.doneAt ? 'milestone done ' + u.rel(m.doneAt) : 'approved', 'ok', 'check'), remark: m ? { lb: 'Milestone', text: m.name + ' marked 100% by ' + MR.userById(x.p.eng).name.split(' ')[0] + '. Raise the invoice so the money clock starts.', quiet: true } : null,
        meta: meter(b.stages + ' of ' + b.of + ' stages billed', u.inr(x.ps.amount) + ' + GST', [[b.billed / b.contract * 100, '#D08A16'], [x.ps.amount * 1.18 / b.contract * 100, 'var(--ok)']]),
        pri: MR.can('invoice.raise') ? MR.btn('inv-raise', 'Raise invoice', { cls: 'pri', icon: 'invoice', id: x.ps.id, attrs: ' data-p="' + x.p.id + '"' }) : '<a class="btn pri" href="#/project/' + x.p.id + '?tab=billing">Open billing</a>' });
    });
    // client replies, follow-ups, quotes to send
    if (r === 'owner' || r === 'pm') S.quotes.forEach(function (q) {
      if (!mine(q.owner)) return;
      var v = MR.ver(q), cl = MR.client(q.clientId);
      q.comments.filter(function (c) { return c.by === 'client' && !c.answered && !c.resolved && c.key && c.v === v.n; }).forEach(function (c) {
        var line = MR.findLine ? MR.findLine(q, c.key) : null, it = null; v.sections.forEach(function (s) { s.items.forEach(function (i) { if (i.key === c.key) it = i; }); });
        var answered = q.comments.some(function (x) { return x.key === c.key && x.by !== 'client' && x.at > c.at; });
        if (answered) return;
        out.push({ id: 'cm-' + c.id, g: 'client', icon: 'comment', tone: 'info', k: 'Client comment', title: (it ? it.name : 'Quote line') + ' · ' + q.no, href: '#/quote/' + q.id, chips: MR.chipClient(cl) + MR.chipQuote(q), time: MR.tchip('waiting ' + u.rel(c.at).replace(' ago', ''), u.diffD(c.at.slice(0, 10), t) >= 2 ? 'warn' : 'info', 'clock'),
          remark: { lb: 'Last remark', who: c.who + ', ' + u.rel(c.at), text: c.text }, meta: it && mv ? '<span>Line <b>' + u.inr(MR.lineAmt(it)) + '</b> · ' + u.fnum(it.qty) + ' ' + esc(it.unit) + '</span><span>Quote ' + u.lakh(MR.calc(q).taxable) + '</span>' : '',
          extra: '<div class="wc-reply" id="rpw-' + c.id + '" hidden><label class="vh" for="rp-' + c.id + '">Reply to ' + esc(c.who) + '</label><textarea class="ta" id="rp-' + c.id + '" rows="2" placeholder="Reply on the client link, e.g. Yes, walnut adds ₹14,000. I will put it in v4."></textarea></div>',
          pri: MR.btn('wc-reply', 'Reply', { cls: 'pri', icon: 'comment', id: c.id, attrs: ' data-q="' + q.id + '"' }), sec: '<a class="btn ghost" href="#/quote/' + q.id + '">Open quote</a>' });
      });
      if (q.status === 'changes') { var cr = q.comments.filter(function (x) { return x.kind === 'changes'; }).pop(); out.push({ id: 'ch-' + q.id, g: 'client', icon: 'edit', tone: 'warn', k: 'Client asked for changes', title: q.no + ' · ' + q.name, href: '#/quote/' + q.id, chips: MR.chipClient(cl), time: cr ? MR.agoChip(cr.at, '', 'warn') : '', remark: cr ? { lb: 'Last remark', who: cr.who, text: cr.text } : null, pri: '<a class="btn pri" href="#/quote/' + q.id + '">Make v' + (v.n + 1) + '</a>' }); }
      if (q.status === 'approved') out.push({ id: 'snd-' + q.id, g: 'client', icon: 'send', tone: 'info', k: 'Ready to send', title: q.no + ' · ' + q.name, href: '#/quote/' + q.id, chips: MR.chipClient(cl), time: MR.agoChip(q.approvals[q.approvals.length - 1].at, 'approved', 'ok'), remark: q.approvals[q.approvals.length - 1].comment ? { lb: 'From Ira', text: q.approvals[q.approvals.length - 1].comment } : null, pri: '<a class="btn pri" href="#/quote/' + q.id + '">' + ic('send') + '<span>Send link</span></a>' });
      if (q.status === 'rejected' && r === 'pm') { var ap = q.approvals[q.approvals.length - 1]; out.push({ id: 'rj-' + q.id, g: 'client', icon: 'flag', tone: 'bad', k: 'Returned by Ira', title: q.no + ' · ' + q.name, href: '#/quote/' + q.id, chips: MR.chipClient(cl), time: MR.agoChip(ap.at, '', 'bad'), remark: { lb: 'Ira’s note', text: ap.comment }, pri: '<a class="btn pri" href="#/quote/' + q.id + '">Fix and resubmit</a>' }); }
      if (q.followUp && q.followUp <= u.addD(t, 1) && q.status === 'viewed') out.push({ id: 'fu-' + q.id, g: 'client', icon: 'clock', tone: 'warn', k: 'Follow up', title: q.no + ' · ' + q.name, href: '#/quote/' + q.id, chips: MR.chipClient(cl), time: MR.agoChip(v.viewedAt, 'opened', 'warn'), remark: { lb: 'Last activity', text: cl.contact.split(' (')[0] + ' opened v' + v.n + ' ' + u.rel(v.viewedAt) + ' and has not replied.', quiet: true }, pri: MR.btn('wc-follow', 'Log follow-up', { cls: 'pri', icon: 'phone', id: q.id }) });
    });
    // change orders waiting on the client, late deliveries, high snags
    if (r === 'owner' || r === 'pm') S.projects.forEach(function (p) {
      if (!mine(p.pm)) return;
      (p.cos || []).forEach(function (co) { if (co.status !== 'sent') return; out.push({ id: 'co-' + co.id, g: 'client', icon: 'sign', tone: 'warn', k: 'Change order · waiting on client', title: co.no + ' · ' + co.title, href: '#/project/' + p.id + '?tab=cos', chips: MR.chipClient(MR.client(p.clientId), { short: true }) + MR.chipProject(p), time: MR.agoChip(co.sentAt, 'sent', u.diffD(co.sentAt.slice(0, 10), t) > 2 ? 'warn' : 'info'), remark: { lb: 'Why', text: co.reason }, meta: mv ? '<span>Adds <b>' + u.lakh(co.amount) + '</b> + GST</span><span>Contract ' + u.lakh(MR.projValue(p)) + ' → ' + u.lakh(MR.projValue(p) + co.amount) + '</span>' : '', pri: MR.btn('wc-nudge', 'Nudge client', { cls: 'pri', icon: 'send', id: co.id }), sec: '<a class="btn ghost" href="#/c/' + co.token + '?preview=1">Client view</a>' }); });
      S.pos.forEach(function (o) { if (o.projectId !== p.id || o.status === 'delivered' || o.status === 'cancelled' || o.expected >= t) return; out.push({ id: 'po-' + o.id, g: 'site', icon: 'truck', tone: 'warn', k: 'Delivery late', title: o.no + ' · ' + MR.vendor(o.vendorId).name, href: '#/po/' + o.id, chips: MR.chipProject(p), time: MR.tchip(u.diffD(o.expected, t) + ' days late', 'bad', 'clock'), remark: o.note ? { lb: 'Last remark', text: o.note } : null, pri: '<a class="btn pri" href="#/po/' + o.id + '">Open PO</a>' }); });
    });
    if (r === 'owner' || r === 'pm') S.snags.forEach(function (s) {
      var p = MR.project(s.projectId); if (s.status === 'closed' || s.sev !== 'high' || !mine(p.pm)) return;
      out.push({ id: 'sn-' + s.id, g: 'site', icon: 'snag', tone: 'bad', k: 'Snag · high', title: s.title, chips: MR.chipProject(p) + '<span class="chip plain">' + esc(s.room) + '</span>' + MR.chipUser(s.by), time: MR.dueChip(s.due), remark: { lb: 'On site', who: u.rel(s.raised), text: MR.userById(s.by).name.split(' ')[0] + ' raised it with a photo. ' + (s.status === 'progress' ? 'The ' + s.trade.toLowerCase() + ' crew is on it.' : 'Nobody has picked it up yet.'), quiet: true },
        extra: '<div class="wc-photo"><img src="' + MR.photoSrc(s.photo, true) + '" alt="Snag photo: ' + esc(s.title) + '" width="132" height="88" loading="lazy"><span class="muted" style="font-size:13px">' + esc(s.trade) + ' · due ' + u.fdate(s.due) + '</span></div>', pri: MR.btn('open-snag', 'Open snag', { cls: 'pri', id: s.id }) });
    });
    // CRM: new enquiries (SLA) and follow-ups due
    if (r === 'owner' || r === 'pm' || r === 'design') (S.leads || []).forEach(function (l) {
      if (l.stage === 'won' || l.stage === 'lost' || l.stage === 'quote' || (r !== 'owner' && r !== 'pm' && l.owner !== me.id)) return;
      var fresh = l.stage === 'new' && !l.remarks.length, due = l.next && l.next.at.slice(0, 10) <= t;
      if (!fresh && !due) return;
      var lr = l.remarks[l.remarks.length - 1];
      out.push({ id: 'ld-' + l.id, g: 'leads', icon: fresh ? 'bolt' : 'phone', tone: fresh ? 'brand' : 'warn', k: fresh ? 'New enquiry · ' + l.source : 'Follow-up · ' + l.next.text, title: l.name + ' · ' + (l.f.property || l.kind), href: '#/leads?open=' + l.id, chips: MR.chipUser(l.owner) + MR.tchip(l.track, '') + MR.tchip((l.score || 'cold').replace(/^./, function (c) { return c.toUpperCase(); }), l.score === 'hot' ? 'bad' : l.score === 'warm' ? 'warn' : 'info'), time: MR.leadSla(l) || MR.leadNext(l),
        remark: lr ? { lb: 'Last remark', who: u.rel(lr.at), text: lr.note } : { lb: 'Enquiry', who: u.rel(l.created), text: l.note || 'No message came with the enquiry.' },
        meta: '<span>' + esc(l.city) + '</span>' + (l.f.budget ? '<span>Budget <b>' + esc(l.f.budget) + '</b></span>' : '') + (l.f.area ? '<span><b>' + u.fnum(l.f.area) + '</b> sqft</span>' : ''),
        pri: '<a class="btn pri" href="#/calls?l=' + l.id + '">' + ic('phone') + '<span>' + (fresh ? 'Call now' : 'Call') + '</span></a>', sec: MR.btn('open-lead', 'Open lead', { cls: 'ghost', id: l.id }) });
    });
    // design changes asked by clients
    if (r === 'owner' || r === 'pm' || r === 'design') (S.boards || []).forEach(function (b) { b.rooms.forEach(function (rm, i) {
      if (rm.status !== 'changes') return; var pin = rm.pins.filter(function (p) { return p.by === 'client' && !p.resolved; }).pop(), nm = b.refType === 'project' ? MR.project(b.ref).name.split(',')[0] : MR.quote(b.ref).name.split(',')[0];
      out.push({ id: 'dz-' + rm.id, g: 'client', icon: 'eye', tone: 'warn', k: 'Design · changes asked', title: rm.name + ' · ' + nm, href: '#/board/' + b.id + '?room=' + i, chips: MR.tchip(rm.pins.filter(function (p) { return p.by === 'client' && !p.resolved; }).length + ' pinned comments', 'warn') + MR.tchip('render v' + rm.renders.length, ''), time: pin ? MR.agoChip(pin.at, '', 'warn') : '', remark: pin ? { lb: 'Last remark', who: pin.who, text: pin.text } : null,
        extra: '<div class="wc-photo"><img src="' + MR.photoSrc(rm.renders[rm.renders.length - 1].photo, true) + '" alt="" width="132" height="88" loading="lazy"><span class="muted" style="font-size:13px">Make v' + (rm.renders.length + 1) + ' and send it back; approvals are room by room.</span></div>', pri: '<a class="btn pri" href="#/board/' + b.id + '?room=' + i + '">Open board</a>' });
    }); });
    // procurement: bids ready to award
    if (r === 'owner' || r === 'pm' || r === 'accounts' || r === 'design') (S.bids || []).forEach(function (b) {
      if (b.status === 'awarded' || Object.keys(b.quotes).length < b.vendors.length || r === 'design') return; var p = MR.project(b.projectId);
      out.push({ id: 'bd-' + b.id, g: 'ops', icon: 'vendor', tone: 'ok', k: 'Vendor bid · ready to award', title: b.title, href: '#/bid/' + b.id, chips: MR.chipProject(p) + MR.tchip(b.trade, ''), time: MR.tchip('all ' + b.vendors.length + ' quotes in', 'ok', 'check'), remark: { lb: 'Bid', text: b.lines.length + ' BOQ lines sent to ' + b.vendors.map(function (v) { return MR.vendor(v).name; }).join(', ') + '.', quiet: true }, pri: '<a class="btn pri" href="#/bid/' + b.id + '">Compare and award</a>' });
    });
    // handovers in progress
    if (r === 'owner' || r === 'pm') S.projects.forEach(function (p) {
      if (p.status !== 'snagging' || !mine(p.pm) || !p.handover) return; var dn = p.handover.items.filter(function (i) { return i.done; }).length, tot = p.handover.items.length;
      out.push({ id: 'ho-' + p.id, g: 'site', icon: 'check', tone: 'info', k: 'Handover', title: p.name.split(',')[0] + ' · ' + (tot - dn) + ' items left', href: '#/project/' + p.id + '?tab=handover', chips: MR.chipProject(p) + MR.chipUser(p.eng), time: MR.dueChip(p.end), meta: MR.meter(dn + ' of ' + tot + ' checklist items', Math.round(dn / tot * 100) + '%', [[dn / tot * 100, 'var(--ok)']]), pri: '<a class="btn pri" href="#/project/' + p.id + '?tab=handover">Open checklist</a>' });
    });
    var ord = { approve: 0, money: 1, bill: 2, client: 3, site: 4 };
    return out;
  };
  /* ---------------- tiles: value, delta vs last week, sparkline ---------------- */
  function spark(vals) {
    var max = Math.max.apply(null, vals.concat([1])), min = Math.min.apply(null, vals.concat([0])), W = 84, H = 26, n = vals.length;
    var pts = vals.map(function (v, i) { return [(i / (n - 1)) * W, H - 3 - ((v - min) / Math.max(1, max - min)) * (H - 6)]; });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    return '<svg class="spk" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><path class="ar" d="' + d + ' L' + W + ' ' + H + ' L0 ' + H + ' Z"/><path d="' + d + '"/></svg>';
  }
  function perDay(list, dateOf, days) { var out = []; for (var i = days - 1; i >= 0; i--) { var d = u.addD(u.today(), -i); out.push(list.filter(function (x) { return (dateOf(x) || '').slice(0, 10) === d; }).length); } return out; }
  function overdueOn(day) { var tot = 0; MR.S.invoices.forEach(function (iv) { if (iv.date > day || iv.due >= day) return; var paid = 0; MR.S.payments.forEach(function (p) { if (p.invoiceId === iv.id && p.date <= day) paid += p.amount + (p.tds || 0); }); tot += Math.max(0, iv.total - paid); }); return tot; }
  MR.spark = spark; MR.perDay = perDay;
  MR.delta = function () { return delta.apply(null, arguments); };
  function delta(now, prev, money, lowerIsBetter) {
    var d = now - prev; if (Math.abs(d) < (money ? 1000 : 0.5)) return '<span class="delta flat">same as last week</span>';
    var good = lowerIsBetter ? d < 0 : d > 0;
    return '<span class="delta ' + (good ? 'up' : 'down') + '">' + (d > 0 ? '▲ ' : '▼ ') + (money ? u.lakh(Math.abs(d)) : Math.abs(d)) + ' vs last week</span>';
  }
  MR.leadSla = MR.leadSla || function (l) {
    if (l.stage !== 'new' || l.remarks.length) return '';
    var m = Math.round((new Date(l.created).getTime() + 30 * 60e3 - Date.now()) / 60e3);
    return m >= 0 ? MR.tchip('first call due in ' + m + ' m', m < 15 ? 'warn' : 'info', 'clock') : MR.tchip('SLA missed by ' + (m < -90 ? Math.round(-m / 60) + ' h' : -m + ' m'), 'bad', 'clock');
  };
  MR.leadNext = MR.leadNext || function (l) { if (!l.next) return ''; var ds = l.next.at.slice(0, 10), late = l.next.at < new Date().toISOString(); return MR.tchip(late ? 'overdue' : ds === u.today() ? 'today ' + u.ftime(l.next.at) : u.fshort(ds) + ' ' + u.ftime(l.next.at), late ? 'bad' : ds === u.today() ? 'warn' : 'info', 'clock'); };
  MR.tilesFor = function (cards) {
    var S = MR.S, r = S.role, n = function (g) { return cards.filter(function (c) { return c.g === g; }).length; }, wk = u.addD(u.today(), -7), wk2 = u.addD(u.today(), -14);
    var q = MR.collectQueue(), od = q.filter(function (x) { return x.st.key === 'overdue'; }), odAmt = od.reduce(function (a, x) { return a + x.st.balance; }, 0), ap = MR.approvalItems();
    var leads = S.leads || [], newL = leads.filter(function (l) { return l.created.slice(0, 10) > wk; }).length, newPrev = leads.filter(function (l) { return l.created.slice(0, 10) > wk2 && l.created.slice(0, 10) <= wk; }).length;
    var sn = S.snags.filter(function (s) { return s.status !== 'closed'; }).length, snPrev = S.snags.filter(function (s) { return s.raised.slice(0, 10) <= wk && (!s.closedAt || s.closedAt.slice(0, 10) > wk); }).length;
    var T = {
      approve: { k: 'approve', l: 'Needs your approval', v: ap.pend.length, d: ap.done + ' of ' + ap.total + ' reviewed this week', sp: perDay(S.audit.filter(function (a) { return a.action === 'submitted' || a.action === 'approved'; }), function (a) { return a.at; }, 14), dl: delta(ap.pend.length, Math.max(0, ap.pend.length - 2), false, true) },
      money: { k: 'money', l: 'Collections due', v: u.lakh(odAmt), d: od.length + ' invoices · oldest ' + (od.length ? od[0].st.overdue : 0) + ' days', bad: odAmt > 0, sp: [42, 35, 28, 21, 14, 7, 0].map(function (x) { return overdueOn(u.addD(u.today(), -x)); }), dl: delta(odAmt, overdueOn(wk), true, true) },
      leads: { k: 'leads', l: 'Leads to call', v: n('leads'), d: newL + ' new enquiries this week', sp: perDay(leads, function (l) { return l.created; }, 14), dl: delta(newL, newPrev) },
      client: { k: 'client', l: 'Waiting on you', v: n('client'), d: 'client comments, design changes, sends', sp: perDay(S.audit.filter(function (a) { return a.by === 'client'; }), function (a) { return a.at; }, 14), dl: '' },
      site: { k: 'site', l: 'Site issues', v: n('site'), d: 'high snags, late deliveries, handovers', sp: perDay(S.snags, function (s) { return s.raised; }, 14), dl: delta(sn, snPrev, false, true) },
      ops: { k: 'ops', l: 'Procurement', v: n('ops'), d: 'bids to award, POs to chase', sp: perDay(S.bids || [], function (b) { return b.created; }, 14), dl: '' },
      bill: { k: 'bill', l: 'Ready to bill', v: u.lakh(MR.readyToBill().reduce(function (a, x) { return a + x.ps.amount; }, 0)), d: MR.readyToBill().length + ' milestones done, not invoiced', sp: perDay(S.invoices, function (i) { return i.date; }, 14), dl: '' },
      paid: { k: null, href: '#/payments', l: 'Collected this month', v: u.lakh(MR.metrics().collectedMonth), d: 'all modes, before TDS', sp: perDay(S.payments, function (p) { return p.date; }, 14), dl: '' }
    };
    var pick = { owner: ['approve', 'money', 'leads', 'site'], pm: ['leads', 'client', 'site', 'ops'], design: ['leads', 'client', 'site', 'ops'], accounts: ['money', 'bill', 'ops', 'paid'] }[r] || ['client', 'site', 'ops', 'leads'];
    return pick.map(function (k) { return T[k]; });
  };
  function nowNext() {
    var S = MR.S, r = S.role, me = MR.me(), t = u.today(), tm = u.addD(t, 1), ev = [], now = Date.now();
    (S.leads || []).forEach(function (l) { if (!l.next || l.stage === 'won' || l.stage === 'lost') return; var ds = l.next.at.slice(0, 10); if ((ds === t || ds === tm) && (r === 'owner' || l.owner === me.id || r === 'pm')) ev.push({ at: l.next.at, t: l.next.text, s: l.name + ' · ' + l.city, href: '#/leads?open=' + l.id, ic: l.next.kind === 'visit' ? 'pin' : 'phone' }); });
    S.pos.forEach(function (o) { if ((o.status === 'issued' || o.status === 'partial') && (o.expected === t || o.expected === tm)) ev.push({ at: o.expected + 'T10:00:00', t: 'Delivery · ' + MR.vendor(o.vendorId).name, s: MR.project(o.projectId).name.split(',')[0], href: '#/po/' + o.id, ic: 'truck', day: 1 }); });
    S.projects.forEach(function (p) { p.milestones.forEach(function (m) { if (m.progress < 100 && (m.end === t || m.end === tm)) ev.push({ at: m.end + 'T18:00:00', t: m.name + ' due', s: p.name.split(',')[0] + ' · ' + m.progress + '%', href: '#/project/' + p.id + '?tab=timeline', ic: 'projects', day: 1 }); }); });
    MR.collectQueue().forEach(function (x) { if (x.last && x.last.next && (x.last.next === t || x.last.next === tm)) ev.push({ at: x.last.next + 'T11:30:00', t: 'Collection follow-up', s: MR.client(x.iv.clientId).name + ' · ' + u.lakh(x.st.balance), href: '#/collect?i=' + x.iv.id, ic: 'pay', day: 1 }); });
    ev.sort(function (a, b) { return a.at < b.at ? -1 : 1; });
    if (!ev.length) return '';
    return '<ul class="nownext" aria-label="Now and next">' + ev.slice(0, 10).map(function (e) { var d = new Date(e.at), isT = e.at.slice(0, 10) === t, soon = isT && Math.abs(d - now) < 90 * 60e3 && !e.day; return '<li><a class="nn' + (soon ? ' now' : '') + '" href="' + e.href + '"><span class="nt">' + (e.day ? (isT ? 'Today' : 'Tmrw') : u.ftime(e.at).replace(' ', '')) + '<small>' + (e.day ? 'all day' : isT ? 'today' : 'tomorrow') + '</small></span><div><b>' + esc(e.t) + '</b><span>' + esc(e.s) + '</span></div></a></li>'; }).join('') + '</ul>';
  }
  function queuesHtml() {
    var r = MR.S.role, q = MR.collectQueue(), ap = MR.approvalItems(), h = '';
    var qs = [];
    if (r === 'owner' || r === 'accounts') { var done = q.filter(function (x) { return x.done; }).length; qs.push({ n: 'Collections', who: 'u-rakesh', p: done, of: q.length, due: q.some(function (x) { return x.st.key === 'overdue'; }) ? MR.tchip('today', 'warn') : MR.tchip('this week', 'info'), href: '#/collect', s: done + ' of ' + q.length + ' followed up today' }); }
    if (r === 'owner') qs.push({ n: 'Approvals', who: 'u-ira', p: ap.done, of: ap.total, due: ap.pend.length ? MR.tchip(ap.pend.length + ' waiting', 'violet') : MR.tchip('clear', 'ok'), href: '#/approvals', s: ap.done + ' of ' + ap.total + ' reviewed this week' });
    if (r === 'owner' || r === 'pm') { var sn = MR.S.snags.filter(function (s) { return s.status !== 'closed'; }), cl = MR.S.snags.filter(function (s) { return s.status === 'closed'; }); qs.push({ n: 'Snag walk', who: 'u-imran', p: cl.length, of: cl.length + sn.length, due: MR.tchip(sn.filter(function (s) { return s.sev === 'high'; }).length + ' high', 'bad'), href: '#/snags', s: cl.length + ' of ' + (cl.length + sn.length) + ' closed' }); var fu = MR.S.quotes.filter(function (x) { return ['sent', 'viewed'].indexOf(x.status) > -1 && (r !== 'pm' || x.owner === MR.me().id); }); qs.push({ n: 'Quote follow-ups', who: r === 'pm' ? MR.me().id : 'u-kabir', p: 0, of: fu.length, due: MR.tchip('this week', 'info'), href: '#/quotes?view=waiting', s: fu.length + ' quotes with clients' }); }
    return '<section class="panel"><div class="panel-hd"><h2>Queues</h2><span class="muted">Work through one at a time</span></div><div class="queues">' + qs.map(function (x) { return '<div class="queue"><div><div class="qn">' + esc(x.n) + '</div></div><a class="btn sm play" href="' + x.href + '">' + ic('chevr') + '<span>Play</span></a><div class="qs">' + MR.avatar(x.who) + '<div class="bar ok"><i style="width:' + (x.of ? x.p / x.of * 100 : 0) + '%"></i></div><span>' + esc(x.s) + '</span>' + x.due + '</div></div>'; }).join('') + '</div></section>';
  }

  /* ---------------- home ---------------- */
  MR.views.home = function (rt) {
    var S = MR.S, r = S.role, me = MR.me(), cards = MR.workCards(), f = (rt && rt.qs.f) || '', tiles = MR.tilesFor(cards);
    var shown = f ? cards.filter(function (c) { return c.g === f; }) : cards;
    var first = me.name.split(' ')[0], h = '<div class="page">';
    var sub = cards.length ? cards.length + ' thing' + (cards.length > 1 ? 's need' : ' needs') + ' you today.' : 'Nothing is waiting on you.';
    h += '<div class="greet"><h1 id="hello" data-keep="hello">' + greet() + ', ' + esc(first) + '</h1><p>' + u.fday(u.today()) + ' · ' + esc(MR.ROLES[r].label) + ' · ' + esc(sub) + '</p></div>';
    h += '<div class="tiles" role="group" aria-label="Filter what needs you">' + tiles.map(function (t) { var inner = '<span class="tl">' + esc(t.l) + '</span><span class="tdl"><span class="tv' + (t.bad ? ' bad' : '') + '">' + esc(String(t.v)) + '</span>' + (t.sp ? spark(t.sp) : '') + '</span>' + (t.dl || '') + '<span class="td">' + esc(t.d) + '</span>'; return t.k ? '<button type="button" class="tile" data-act="home-f" data-v="' + t.k + '" aria-pressed="' + (f === t.k) + '">' + inner + '</button>' : '<a class="tile" href="' + t.href + '">' + inner + '</a>'; }).join('') + '</div>' + nowNext();
    h += '<div class="cols"><div class="stack"><div class="panel-hd" style="padding:0;border:0;min-height:0"><h2>' + (f ? esc((tiles.filter(function (t) { return t.k === f; })[0] || {}).l || 'Filtered') : 'What needs you') + ' <span class="muted" style="font-weight:400">' + shown.length + '</span></h2>' + (f ? MR.btn('home-f', 'Show everything', { cls: 'ghost sm', attrs: ' data-v=""' }) : '') + '</div>';
    var GL = { approve: 'Approvals', money: 'Money', bill: 'Ready to bill', leads: 'Enquiries and follow-ups', client: 'Clients, quotes and design', ops: 'Procurement', site: 'Site and handover' };
    var grouped = f ? shown.map(wcard).join('') : ['approve', 'money', 'bill', 'leads', 'client', 'ops', 'site'].map(function (g) { var cs = shown.filter(function (c) { return c.g === g; }); return cs.length ? '<h3 class="wgrp">' + GL[g] + ' <span>' + cs.length + '</span></h3>' + cs.map(wcard).join('') : ''; }).join('');
    var narrow = window.matchMedia && matchMedia('(max-width:640px)').matches;
    if (narrow && shown.length) {
      var fi = Math.min(MR._wf || 0, shown.length - 1), fc = shown[fi];
      grouped = '<div class="wf-bar"><span><b>' + (fi + 1) + '</b> of ' + shown.length + '</span>' + MR.iconBtn('wc-focus', 'chevl', 'Previous card', { attrs: ' data-i="' + (fi - 1) + '"' + (fi ? '' : ' disabled') }) + MR.iconBtn('wc-focus', 'chevr', 'Next card', { attrs: ' data-i="' + (fi + 1) + '"' + (fi < shown.length - 1 ? '' : ' disabled') }) + '</div>' + wcard(fc) +
        '<h3 class="wgrp">Up next <span>' + (shown.length - 1) + '</span></h3><ul class="wmini">' + shown.map(function (c, i) { return i === fi ? '' : '<li><button type="button" data-act="wc-focus" data-i="' + i + '"><span class="wc-ic ' + (c.tone || '') + '" aria-hidden="true">' + ic(c.icon) + '</span><span class="wm-t"><small>' + esc(c.k) + '</small>' + esc(c.title) + '</span>' + ic('chevr') + '</button></li>'; }).join('') + '</ul>';
    }
    h += shown.length ? '<div class="wlist' + (narrow ? ' is-focus' : '') + '" id="wlist">' + grouped + '</div>' : '<section class="panel">' + MR.empty('check', 'All clear here', f ? 'Nothing in this group. Pick another tile or show everything.' : 'Nothing is waiting on you. New approvals, overdue money and client comments land here.') + '</section>';
    if (r !== 'accounts' && !narrow) { var ms = MR.monthSeries(6); h += '<section class="panel"><div class="panel-hd"><h2>Quoted vs won</h2><div class="legend"><span><i style="background:#C9D0C8"></i>Quoted (v1 sent)</span><span><i style="background:var(--brand)"></i>Won</span></div></div><div class="panel-bd chart-box">' + MR.barsChart(ms, { w: (function () { var mw = (document.getElementById('main') || {}).clientWidth || 1000; return Math.max(320, Math.min(1000, mw > 1180 ? mw - 470 : mw > 640 ? mw - 110 : mw - 66)); })(), h: 220, label: 'Quoted versus won by month', fmt: function (v) { return v ? u.lakh(v).replace('₹', '') : '0'; } }) + '</div></section>'; }
    else h += MR.ageingPanel ? MR.ageingPanel() : '';
    h += '</div><aside class="stack">';
    if (!MR.prefs.toured) h += '<section class="panel" style="background:var(--brand-t2)"><div class="panel-bd" style="display:flex;gap:12px;align-items:flex-start">' + ic('spark') + '<div style="flex:1"><b style="font-weight:600">New here?</b><p class="muted" style="font-size:13px;margin:2px 0 10px">A 60-second tour of how one job moves: enquiry, design, approvals, bids, build, handover, paid.</p>' + MR.btn('tour', 'Take the tour', { cls: 'sm' }) + '</div></div></section>';
    h += queuesHtml();
    var projs = S.projects.filter(function (p) { return p.status !== 'handed' && (r !== 'pm' || p.pm === me.id); }).sort(function (a, b) { return MR.health(b).lvl - MR.health(a).lvl; });
    h += '<section class="panel"><div class="panel-hd"><h3>Live projects</h3><a class="btn ghost sm" href="#/projects">All</a></div><ul class="feed" style="padding:4px 16px">' + projs.map(function (p) { var hh = MR.health(p), nm = nextMs(p); return '<li style="grid-template-columns:minmax(0,1fr) auto;align-items:center">' + '<span>' + MR.chipProject(p) + '<br><span class="muted" style="font-size:12px;margin-left:4px">' + esc(nm ? nm.name : 'Handover') + '</span></span><span style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">' + MR.healthDot(hh) + (nm ? MR.dueChip(nm.end) : '') + '</span></li>'; }).join('') + '</ul></section>';
    h += '<section class="panel"><div class="panel-hd"><h3>Activity</h3>' + (r === 'owner' ? '<a class="btn ghost sm" href="#/audit">Audit log</a>' : '') + '</div><div class="panel-bd" style="padding-top:4px;padding-bottom:4px">' + MR.feedHtml(S.audit.filter(function (a) { return r !== 'accounts' || /invoice|payment|purchase/.test(a.entity); }), 6) + '</div></section>';
    h += '</aside></div></div>';
    if (r === 'accounts' && !MR.ageingPanel) MR.loadRest().then(function () { if (!MR.route().p.length) MR.render(); });
    return { html: h, title: 'Home', crumbs: [['Home']], nav: '', after: function (root, changed) { if (changed) MR.growBars(root);  } };
  };
  function countUp(root) {
    root.querySelectorAll('[data-count]').forEach(function (el) { var n = +el.dataset.count, f = el.dataset.fmt; MR.countTo(el, n, f === 'pct' ? function (v) { return u.pct(v * 100); } : u.lakh); });
  }
  MR.countUp = countUp;
  MR.act['home-f'] = function (el) { var cur = MR.route().qs.f || ''; MR.setQS('f', cur === el.dataset.v ? '' : el.dataset.v); };

  /* in-place actions on work cards */
  function doneCard(id, msg, undo) { var c = document.getElementById('wc-' + id); MR.save(); if (c && !MR.still()) { c.style.transition = 'opacity .2s, transform .2s'; c.style.opacity = '0'; c.style.transform = 'translateX(12px)'; setTimeout(MR.render, 200); } else MR.render(); MR.undoable(msg, undo); }
  MR.approveQuote = function (q, note) {
    var v = MR.ver(q); q.approvals.push({ v: v.n, by: MR.me().id, at: new Date().toISOString(), decision: 'approved', comment: note || '' }); q.status = 'approved';
    MR.audit('quote', q.no, 'approved', 'v' + v.n + (note ? ': ' + note : '')); MR.notify(['pm'], 'Ira approved ' + q.no + ' v' + v.n + '. Ready to send.', '#/quote/' + q.id, 'ok');
  };
  MR.act['wc-approve'] = function (el) { var q = MR.quote(el.dataset.id), prev = q.status; MR.approveQuote(q, ''); doneCard('aq-' + q.id, q.no + ' approved', function () { q.status = prev; q.approvals.pop(); }); };
  MR.decideDisc = function (d, ok, note) { d.status = ok ? 'approved' : 'declined'; d.decidedAt = new Date().toISOString(); d.note = note || ''; var q = MR.quote(d.quoteId); MR.audit('quote', q.no, ok ? 'discount approved' : 'discount declined', d.pct + '%' + (note ? ': ' + note : '')); MR.notify(['pm'], 'Ira ' + (ok ? 'approved' : 'declined') + ' the ' + d.pct + '% discount on ' + q.no + (ok ? '. Put it in the next version.' : ''), '#/quote/' + q.id, ok ? 'ok' : 'warn'); };
  MR.act['wc-disc'] = function (el) { var d = MR.find(MR.S.discReqs, el.dataset.id); MR.decideDisc(d, true); doneCard('ad-' + d.id, d.pct + '% discount approved', function () { d.status = 'pending'; }); };
  MR.act['wc-reply'] = function (el) {
    var id = el.dataset.id, box = document.getElementById('rpw-' + id), ta = document.getElementById('rp-' + id);
    if (box.hidden) { box.hidden = false; el.querySelector('span').textContent = 'Post reply'; ta.focus(); return; }
    var txt = ta.value.trim(); if (txt.length < 3) { ta.setAttribute('aria-invalid', 'true'); ta.focus(); return; }
    var q = MR.quote(el.dataset.q), c = MR.find(q.comments, id), me = MR.me();
    var rep = { id: u.uid('cm'), v: c.v, key: c.key, by: me.id, who: me.name, at: new Date().toISOString(), text: txt }; q.comments.push(rep); c.answered = true;
    MR.audit('quote', q.no, 'replied', txt.slice(0, 80)); doneCard('cm-' + id, 'Reply posted to ' + c.who.split(' ')[0] + '’s link', function () { q.comments.splice(q.comments.indexOf(rep), 1); c.answered = false; });
  };
  MR.act['wc-nudge'] = function (el) {
    var co = null, p = null; MR.S.projects.forEach(function (x) { (x.cos || []).forEach(function (c) { if (c.id === el.dataset.id) { co = c; p = x; } }); });
    MR.copy(location.origin + location.pathname + '#/c/' + co.token, 'Approval link copied. Paste it into WhatsApp.'); co.nudges = (co.nudges || 0) + 1; MR.audit('change order', p.code + ' ' + co.no, 'nudged', 'Reminder sent to client'); MR.save();
  };
  MR.act['wc-follow'] = function (el) { var q = MR.quote(el.dataset.id), prev = q.followUp; q.followUp = u.addD(u.today(), 3); MR.audit('quote', q.no, 'followed up', 'Called client; next follow-up ' + u.fshort(q.followUp)); doneCard('fu-' + q.id, 'Follow-up logged. Next one ' + u.fshort(q.followUp), function () { q.followUp = prev; }); };

  /* guided tour of the core loop */
  var TOUR = [
    ['clients', 'Enquiry', 'Every enquiry lands with an owner', 'Leads come in by source and get assigned by rule. A first call is due in 30 minutes, and Calls mode walks the list one person at a time.', '#/calls'],
    ['eye', 'Design', 'Design by room, approved by room', 'Moodboards, finishes with SKUs from the rate library, and 2D and 3D renders. The client pins comments on the image and approves each room.', '#/board/b-iyer?room=1'],
    ['approve', 'Approvals', 'Quote, then Ira approves', 'Quotes build from the brief. Margin under 22% or a discount over 7.5% is flagged, and Ira approves or returns it from a card.', '#/approvals'],
    ['box', 'Bids', 'Three vendors, one comparison', 'Send BOQ lines to up to three vendors, compare rates side by side against budget, and award. The purchase order writes itself.', '#/bid/bd-14'],
    ['helmet', 'Build', 'Milestones, site logs, snags', 'A Gantt by trade, a five-step daily log from the site engineer’s phone, snags with photos, and change orders the client signs.', '#/project/p-kestrel?tab=timeline'],
    ['check', 'Handover', 'Hand over with a checklist', 'Every item ticked, the client signs, and the warranty register starts its clocks on the same day.', '#/project/p-kapoor?tab=handover'],
    ['pay', 'Paid', 'Bill each milestone, chase until paid', 'GST invoices raise from milestones: CGST + SGST in Haryana, IGST for Delhi and UP. Collections mode works the overdue list.', '#/collect']
  ];
  var TI = 0;
  function tourHtml() {
    var s = TOUR[TI];
    return '<div class="dlg-hd"><h2 id="dlgT">How one job moves</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><div class="tour-loop" aria-hidden="true">' + TOUR.map(function (x, i) { return '<span class="' + (i < TI ? 'done' : i === TI ? 'on' : '') + '"><i>' + (i < TI ? '✓' : ic(x[0])) + '</i>' + x[1] + '</span>'; }).join('') + '</div><div class="tour-body" aria-live="polite"><h3>' + (TI + 1) + '. ' + esc(s[2]) + '</h3><p>' + esc(s[3]) + '</p><p class="tip-k">Tip: press <kbd>⌘</kbd> <kbd>K</kbd> anywhere to search or run a command.</p></div></div><div class="dlg-ft"><span class="tour-dots left" aria-hidden="true">' + TOUR.map(function (x, i) { return '<i class="' + (i === TI ? 'on' : '') + '"></i>'; }).join('') + '</span><button type="button" class="btn ghost" data-act="tour-go">Show me</button>' + (TI ? '<button type="button" class="btn" data-act="tour-step" data-v="-1">Back</button>' : '') + (TI < TOUR.length - 1 ? '<button type="button" class="btn pri" data-act="tour-step" data-v="1" autofocus>Next</button>' : '<button type="button" class="btn pri" data-act="tour-end" autofocus>Done</button>') + '</div>';
  }
  MR.act.tour = function () { MR.closeMenu && MR.closeMenu(); TI = 0; var d = MR.openDlg(tourHtml(), 'tour'); d.addEventListener('close', endTour, { once: true }); };
  function endTour() { if (!MR.prefs.toured) { MR.prefs.toured = 1; MR.savePrefs(); if (!MR.route().p.length) MR.render(); } }
  MR.act['tour-step'] = function (el) { TI = Math.max(0, Math.min(TOUR.length - 1, TI + +el.dataset.v)); document.getElementById('dlg').innerHTML = tourHtml(); var b = document.querySelector('#dlg [autofocus]'); if (b) b.focus(); };
  MR.act['tour-go'] = function () { var href = TOUR[TI][4]; MR.closeDlg(); MR.go(href); };
  MR.act['tour-end'] = function () { MR.closeDlg(); };

  /* ---------------- audit log ---------------- */
  MR.views.audit = function (r) {
    var S = MR.S, f = r.qs.e || '', who = r.qs.by || '', q = (r.qs.q || '').toLowerCase();
    var ents = {}; S.audit.forEach(function (a) { ents[a.entity] = (ents[a.entity] || 0) + 1; });
    var list = S.audit.filter(function (a) { return (!f || a.entity === f) && (!who || a.by === who) && (!q || (a.ref + ' ' + a.detail + ' ' + a.action).toLowerCase().indexOf(q) > -1); });
    var h = '<div class="page"><div class="ph"><div><h1>Audit log</h1><p class="sub">Every change in Studio OS, who made it and when. Read-only, kept for the life of the account. Edits to rates and quote lines record the old and new value.</p></div><div class="acts">' + MR.btn('audit-csv', 'Export CSV', { icon: 'download' }) + '</div></div>';
    h += '<div class="tbar"><div class="tsearch">' + ic('search') + '<input class="inp" type="search" placeholder="Filter by reference or detail" aria-label="Filter audit log" value="' + esc(r.qs.q || '') + '" data-bind="audit-q"></div><select class="sel" style="width:auto" aria-label="Entity" data-bind="audit-e"><option value="">All records</option>' + Object.keys(ents).sort().map(function (k) { return '<option value="' + esc(k) + '"' + (k === f ? ' selected' : '') + '>' + esc(k[0].toUpperCase() + k.slice(1)) + ' (' + ents[k] + ')</option>'; }).join('') + '</select><select class="sel" style="width:auto" aria-label="Person" data-bind="audit-by"><option value="">Everyone</option><option value="client"' + (who === 'client' ? ' selected' : '') + '>Clients (portal)</option>' + MR.USERS.map(function (x) { return '<option value="' + x.id + '"' + (x.id === who ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select><span class="grow"></span><span class="muted">' + list.length + ' events</span></div>';
    h += list.length ? '<div class="tw"><table class="tbl"><thead><tr><th>When</th><th>Who</th><th>Record</th><th>Action</th><th class="hide-sm">Detail</th></tr></thead><tbody>' + list.slice(0, 250).map(function (a) {
      var who2 = a.by === 'client' ? 'Client portal' : MR.userById(a.by).name;
      return '<tr><td class="nowrap"><span title="' + esc(new Date(a.at).toLocaleString('en-IN')) + '">' + u.fshort(a.at.slice(0, 10)) + ' · ' + u.ftime(a.at) + '</span></td><td class="nowrap">' + (a.by === 'client' ? '<span class="av" style="--h:200">C</span>' : MR.avatar(a.by)) + ' ' + esc(who2) + '</td><td class="nowrap"><span class="tag">' + esc(a.entity) + '</span> ' + esc(a.ref) + '</td><td class="nowrap">' + esc(a.action) + '</td><td class="hide-sm muted">' + esc(a.detail) + '</td></tr>';
    }).join('') + '</tbody></table></div>' : MR.empty('audit', 'No events match', 'Try clearing the filters.');
    return { html: h + '</div>', title: 'Audit log', crumbs: [['Audit log']], nav: 'audit' };
  };
  MR.bind['audit-q'] = function (el) { MR.setQS('q', el.value); };
  MR.bind['audit-e'] = function (el) { MR.setQS('e', el.value); };
  MR.bind['audit-by'] = function (el) { MR.setQS('by', el.value); };
  MR.csv = function (name, rows) {
    var s = rows.map(function (r) { return r.map(function (c) { c = String(c == null ? '' : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([s], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    MR.toast('Exported ' + (rows.length - 1) + ' rows to ' + name);
  };
  MR.act['audit-csv'] = function () { MR.csv('studio-os-audit.csv', [['When', 'Who', 'Entity', 'Reference', 'Action', 'Detail']].concat(MR.S.audit.map(function (a) { return [a.at, a.by === 'client' ? 'Client' : MR.userById(a.by).name, a.entity, a.ref, a.action, a.detail]; }))); };
})();
