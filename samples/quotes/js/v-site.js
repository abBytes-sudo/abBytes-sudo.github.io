/* Studio OS: site engineer flows. Today, daily logs with photos, snags with close-out, deliveries. Phone-first. */
(function () {
  'use strict';
  var MR = window.MR, u = MR.u, esc = u.esc, ic = MR.ic;
  MR.views = MR.views || {}; MR.act = MR.act || {}; MR.bind = MR.bind || {};
  function S() { return MR.S; }
  var WX = [['Clear', 'sun'], ['Hazy', 'cloud'], ['Smog', 'smog'], ['Rain', 'rain'], ['Cool morning', 'cloud']];
  var CREW = [['carpenters', 'Carpenters'], ['electricians', 'Electricians'], ['painters', 'Painters'], ['masons', 'Masons'], ['helpers', 'Helpers']];
  var SEV = { high: 'High', medium: 'Medium', low: 'Low' };
  var SNST = { open: ['Open', 'bad'], progress: ['In progress', 'warn'], closed: ['Closed', 'ok'] };
  var TRADES = ['Carpentry', 'Electrical', 'Plumbing', 'False ceiling', 'Flooring', 'Painting', 'Civil & waterproofing', 'Furniture & lighting'];
  var SAMPLE = ['s-joinery.jpg', 's-gypsum-frame.jpg', 's-paint.jpg', 's-electrical.jpg', 's-tile.jpg', 's-putty.jpg', 's-partition.jpg', 's-niche.jpg', 's-marking.jpg', 's-services.jpg', 's-kitchen-wrap.jpg', 's-plaster-lights.jpg'];

  function myProjects() { var me = MR.me(); return S().projects.filter(function (p) { return p.status !== 'handed' && (MR.S.role !== 'site' || p.eng === me.id) && (MR.S.role !== 'pm' || p.pm === me.id); }); }
  function wxIcon(w) { w = w || ''; return /Smog/.test(w) ? 'smog' : /Rain/.test(w) ? 'rain' : /Hazy|Cool/.test(w) ? 'cloud' : 'sun'; }

  /* ---------------- shared renderers ---------------- */
  MR.logsHtml = function (list, showProject) {
    if (!list.length) return MR.empty('log', 'No daily logs yet', 'A daily log takes under a minute: crew, work done, a few photos. The PM and client updates are built from it.', MR.can('site.log') ? '<a class="btn pri" href="#/log/new">' + ic('camera') + '<span>New daily log</span></a>' : '');
    list = list.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : (a.at < b.at ? 1 : -1); });
    return '<div class="logs">' + list.map(function (l) {
      var p = MR.project(l.projectId), crew = CREW.filter(function (c) { return l.crew[c[0]]; });
      var tot = CREW.reduce(function (a, c) { return a + (l.crew[c[0]] || 0); }, 0);
      return '<article class="logc"><div class="logc-hd">' + MR.avatar(l.by) + '<span><span class="dt">' + u.fday(l.date) + '</span>' + (showProject ? ' · <a class="rowlink" href="#/project/' + p.id + '?tab=site">' + esc(p.name.split(',')[0]) + '</a>' : '') + '<br><span class="muted" style="font-size:12px">' + esc(MR.userById(l.by).name) + ' · ' + tot + ' on site</span></span><span class="wx">' + ic(wxIcon(l.weather)) + esc(l.weather) + '</span></div><div class="logc-bd"><p>' + esc(l.work) + '</p>' + (crew.length ? '<div class="crew">' + crew.map(function (c) { return '<span><b>' + l.crew[c[0]] + '</b> ' + c[1].toLowerCase() + '</span>'; }).join('') + '</div>' : '') + (l.next ? '<div class="remark"><span class="lb">For the next person</span>' + esc(l.next) + '</div>' : '') + (l.issues ? '<div class="issue">' + ic('flag') + '<span>' + esc(l.issues) + '</span></div>' : '') + (l.photos.length ? '<div class="photos">' + l.photos.map(function (ph, i) { return '<button type="button" data-act="lightbox" data-src="' + esc(ph) + '" data-cap="' + esc(p.name.split(',')[0] + ' · ' + u.fday(l.date)) + '" aria-label="Open photo ' + (i + 1) + ' from ' + esc(u.fday(l.date)) + '"><img src="' + MR.photoSrc(ph, true) + '" alt="Site progress photo, ' + esc(p.name.split(',')[0]) + '" loading="lazy" decoding="async" width="480" height="360"></button>'; }).join('') + '</div>' : '') + '</div></article>';
    }).join('') + '</div>';
  };
  MR.snagsHtml = function (list, showProject) {
    if (!list.length) return MR.empty('snag', 'No snags', 'Nothing to fix. Raise a snag with a photo the moment you see one; it stays open until it is closed with an after photo.');
    var order = { high: 0, medium: 1, low: 2 };
    list = list.slice().sort(function (a, b) { return (a.status === 'closed') - (b.status === 'closed') || order[a.sev] - order[b.sev] || (a.raised < b.raised ? 1 : -1); });
    return '<div class="panel"><div class="snags">' + list.map(function (s) {
      var p = MR.project(s.projectId), age = u.diffD(s.raised.slice(0, 10), u.today());
      return '<button type="button" class="snag" data-act="open-snag" data-id="' + s.id + '"><img src="' + MR.photoSrc(s.photo, true) + '" alt="" loading="lazy" width="64" height="48"><span style="min-width:0"><b>' + esc(s.title) + '</b><span class="sm">' + (showProject ? esc(p.name.split(',')[0]) + ' · ' : '') + esc(s.room) + ' · ' + esc(s.trade) + '</span><br><span class="sev sev-' + s.sev + '">' + ic('snag') + SEV[s.sev] + '</span> <span class="sm">· ' + esc(s.no) + ' · ' + (s.status === 'closed' ? 'closed ' + u.rel(s.closedAt) : age + 'd open') + '</span></span><span class="sr">' + MR.pill(s.status, SNST) + '</span></button>';
    }).join('') + '</div></div>';
  };

  /* ---------------- Today / site overview ---------------- */
  MR.views.site = function () {
    var me = MR.me(), r = MR.S.role, projs = myProjects(), t = u.today();
    var logsToday = S().logs.filter(function (l) { return l.date === t; });
    var openSn = S().snags.filter(function (s) { return s.status !== 'closed' && projs.some(function (p) { return p.id === s.projectId; }); });
    var due = S().pos.filter(function (o) { return (o.status === 'issued' || o.status === 'partial') && projs.some(function (p) { return p.id === o.projectId; }); }).sort(function (a, b) { return a.expected < b.expected ? -1 : 1; });
    var grap = S().notifs.filter(function (n) { return /GRAP/.test(n.text); })[0];
    var h = '<div class="page site-today">';
    if (r === 'site') {
      var hr = new Date().getHours(), g = hr < 12 ? 'Morning' : hr < 17 ? 'Afternoon' : 'Evening';
      h += '<div class="greet"><h1 id="hello" data-keep="hello">' + g + ', ' + esc(me.name.split(' ')[0]) + '</h1><p>' + u.fday(t) + ' · ' + projs.length + ' site' + (projs.length === 1 ? '' : 's') + ' today · ' + openSn.length + ' open snag' + (openSn.length === 1 ? '' : 's') + '</p></div>';
      if (grap) h += '<div class="banner warn">' + ic('smog') + '<div class="bt"><b>GRAP Stage III in Delhi NCR</b>Wet cutting only, dust screens up, no debris on the street. Note the AQI in today’s logs.</div></div>';
      h += '<div class="big-actions"><a href="#/log/new">' + ic('camera') + '<b>Daily log</b><span>Crew, work done, photos</span></a><button type="button" data-act="new-snag">' + ic('snag') + '<b>Raise snag</b><span>Photo, room, severity</span></button><a href="#/deliveries">' + ic('truck') + '<b>Deliveries</b><span>' + due.length + ' expected</span></a></div>';
    } else {
      h += '<div class="ph"><div><h1>Site &amp; snags</h1><p class="sub">What the site engineers logged, open snags across live projects, and deliveries due. Engineers see this on their phones.</p></div><div class="acts"><a class="btn" href="#/logs">' + ic('log') + '<span>All logs</span></a><a class="btn" href="#/snags">' + ic('snag') + '<span>All snags</span></a></div></div>';
    }
    h += '<h2 style="font-size:14px;font-weight:600;margin:0 0 10px">' + (r === 'site' ? 'Your sites today' : 'Live sites') + '</h2><div class="pcards" style="margin-bottom:24px">' + projs.map(function (p) {
      var cur = p.milestones.filter(function (m) { return m.progress > 0 && m.progress < 100; }).pop() || p.milestones.filter(function (m) { return m.progress < 100; })[0] || p.milestones[p.milestones.length - 1];
      var logged = logsToday.some(function (l) { return l.projectId === p.id; }), sn = openSn.filter(function (s) { return s.projectId === p.id; }).length;
      return '<div class="sitecard"><a href="#/project/' + p.id + '" class="cv" style="display:block">' + (p.cover ? '<img src="' + MR.photoSrc(p.cover, true) + '" alt="" loading="lazy" width="480" height="360">' : '') + '<span class="ph-t"><b>' + esc(p.name.split(',')[0]) + '</b><span>' + esc(p.site) + '</span></span></a><div class="bd"><div class="now"><span>' + esc(cur.name) + ' · <b>' + cur.progress + '%</b></span>' + (logged ? '<span class="ok">' + ic('check') + ' Logged today</span>' : '<span class="warn">No log yet today</span>') + '</div><div class="qa"><a class="btn" href="#/log/new?p=' + p.id + '">' + ic('camera') + 'Log</a><button type="button" class="btn" data-act="new-snag" data-id="' + p.id + '">' + ic('snag') + 'Snag' + (sn ? ' · ' + sn : '') + '</button><a class="btn" href="#/project/' + p.id + '?tab=timeline">' + ic('projects') + 'Plan</a></div></div></div>';
    }).join('') + '</div>';
    h += '<div class="cols-even"><section><div class="panel-hd" style="padding:0 0 10px;border:0;min-height:0"><h2>Open snags</h2><a class="btn ghost sm" href="#/snags">All</a></div>' + MR.snagsHtml(openSn.slice(0, 6), true) + '</section>';
    h += '<section><div class="panel-hd" style="padding:0 0 10px;border:0;min-height:0"><h2>Deliveries due</h2><a class="btn ghost sm" href="#/deliveries">All</a></div>' + deliveriesHtml(due.slice(0, 5)) + '</section></div>';
    var recent = S().logs.filter(function (l) { return projs.some(function (p) { return p.id === l.projectId; }); });
    h += '<h2 style="font-size:14px;font-weight:600;margin:24px 0 10px">Recent logs</h2>' + MR.logsHtml(recent.sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 4), true);
    return { html: h + '</div>', title: r === 'site' ? 'Today' : 'Site & snags', crumbs: [[r === 'site' ? 'Today' : 'Site & snags']], nav: 'site', tab: 'site' };
  };
  function deliveriesHtml(list) {
    if (!list.length) return MR.empty('truck', 'Nothing due', 'Purchase orders for your sites show up here with the expected date.');
    return '<div class="panel"><div class="snags">' + list.map(function (o) {
      var v = MR.vendor(o.vendorId), p = MR.project(o.projectId), st = MR.poState(o);
      return '<div class="snag" style="grid-template-columns:40px minmax(0,1fr) auto"><span class="ii" style="width:40px;height:40px;border-radius:10px;background:var(--hover);display:flex;align-items:center;justify-content:center">' + ic('truck') + '</span><span style="min-width:0"><b><a class="rowlink" href="#/po/' + o.id + '">' + esc(v.name) + '</a></b><span class="sm">' + esc(o.no) + ' · ' + esc(p.name.split(',')[0]) + ' · ' + o.lines.length + ' item' + (o.lines.length > 1 ? 's' : '') + '</span><br><span class="sm ' + (st === 'late' ? 'bad' : '') + '">' + (st === 'late' ? 'Late · was due ' + u.fshort(o.expected) : 'Expected ' + u.fday(o.expected)) + '</span></span><span class="sr">' + (MR.can('proc.receive') ? MR.btn('po-receive', 'Receive', { cls: 'sm', id: o.id }) : MR.pill(st, MR.POSTAT)) + '</span></div>';
    }).join('') + '</div></div>';
  }
  MR.views.deliveries = function () {
    var projs = MR.S.role === 'site' ? myProjects() : S().projects;
    var list = S().pos.filter(function (o) { return projs.some(function (p) { return p.id === o.projectId; }); });
    var open = list.filter(function (o) { return o.status === 'issued' || o.status === 'partial'; }).sort(function (a, b) { return a.expected < b.expected ? -1 : 1; });
    var done = list.filter(function (o) { return o.status === 'delivered'; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 8);
    var h = '<div class="page narrow"><div class="ph"><div><h1>Deliveries</h1><p class="sub">Count what arrives against the PO and challan. Short deliveries keep the PO open and tell the PM.</p></div></div>' + deliveriesHtml(open) + '<h2 style="font-size:14px;font-weight:600;margin:24px 0 10px">Recently received</h2>' + MR.poTable(done);
    return { html: h + '</div>', title: 'Deliveries', crumbs: [['Deliveries']], nav: 'deliveries', tab: 'deliveries' };
  };

  /* ---------------- logs ---------------- */
  MR.views.logs = function (r) {
    var projs = myProjects().concat(MR.S.role === 'site' ? [] : S().projects.filter(function (p) { return p.status === 'handed'; }));
    var pid = r.qs.p || '';
    var list = S().logs.filter(function (l) { return (!pid || l.projectId === pid) && projs.some(function (p) { return p.id === l.projectId; }); });
    var h = '<div class="page narrow"><div class="ph"><div><h1>Daily logs</h1><p class="sub">One entry per site per day: who was on site, what got done, what is blocking, with photos.</p></div><div class="acts">' + (MR.can('site.log') ? '<a class="btn pri" href="#/log/new' + (pid ? '?p=' + pid : '') + '">' + ic('camera') + '<span>New log</span></a>' : '') + '</div></div>';
    h += '<div class="tbar"><select class="sel" style="width:auto;max-width:100%" aria-label="Project" data-bind="logs-p"><option value="">All sites</option>' + projs.map(function (p) { return '<option value="' + p.id + '"' + (p.id === pid ? ' selected' : '') + '>' + esc(p.name.split(',')[0]) + '</option>'; }).join('') + '</select><span class="grow"></span><span class="muted">' + list.length + ' logs</span></div>';
    return { html: h + MR.logsHtml(list, !pid) + '</div>', title: 'Daily logs', crumbs: [['Daily logs']], nav: 'logs', tab: 'logs' };
  };
  MR.bind['logs-p'] = function (el) { MR.setQS('p', el.value); };

  /* daily log as a step flow: 1 Site → 2 Photos → 3 Progress per trade → 4 Snags → 5 Confirm */
  var LD = null, STEPS = ['Site', 'Photos', 'Progress', 'Snags', 'Confirm'];
  function freshLD(pid) {
    var last = pid && S().logs.filter(function (l) { return l.projectId === pid; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0];
    var smog = S().logs.some(function (l) { return /Smog/.test(l.weather) && u.diffD(l.date, u.today()) < 6; });
    return { step: pid ? 1 : 0, projectId: pid || null, date: u.today(), weather: smog ? 'Smog' : 'Clear', aqi: '', crew: last ? JSON.parse(JSON.stringify(last.crew)) : { carpenters: 2, electricians: 1, painters: 0, masons: 0, helpers: 2 }, photos: [], prog: {}, snag: null, work: '', next: '' };
  }
  function activeMs(p) { var t = u.addD(u.today(), 10); return p.milestones.filter(function (m) { return m.progress < 100 && m.start <= t; }); }
  MR.views.log = function (r) {
    if (r.p[1] !== 'new') return { html: MR.notFound(), title: 'Not found', crumbs: [] };
    if (!MR.can('site.log')) return { html: MR.notFound('Your role cannot add daily logs.'), title: 'Daily log', crumbs: [] };
    var projs = myProjects();
    if (!projs.length) return { html: '<div class="page narrow">' + MR.empty('site', 'No live sites', 'You are not assigned to any live site right now.') + '</div>', title: 'Daily log', crumbs: [['Daily log']], nav: 'logs', tab: 'log/new' };
    if (!LD || (r.qs.p && LD.projectId !== r.qs.p && LD.step === 0)) LD = freshLD(r.qs.p && MR.project(r.qs.p) ? r.qs.p : null);
    var p = LD.projectId && MR.project(LD.projectId), st = LD.step;
    var h = '<div class="page narrow form-page" style="max-width:640px"><div class="wiz-hd"><div class="eyebrow" style="margin:0">' + u.fday(LD.date) + (p ? ' · ' + esc(p.name.split(',')[0]) : '') + '</div><h1 style="font:500 30px/1.1 var(--serif)">' + ['Which site are you on?', 'Photos from today', 'How far did each trade get?', 'Any snags?', 'Check and save'][st] + '</h1><div class="wiz-steps" aria-hidden="true">' + STEPS.map(function (s, i) { return '<span class="' + (i < st ? 'done' : i === st ? 'on' : '') + '"></span>'; }).join('') + '</div><div class="wiz-lb"><span>Step <b>' + (st + 1) + ' of 5</b> · ' + STEPS[st] + '</span><span>' + STEPS.map(function (s, i) { return (i + 1) + ' ' + s; }).join(' → ') + '</span></div></div>';
    if (st === 0) {
      h += '<div class="pick" role="group" aria-label="Site">' + projs.map(function (x) { var nm = MR.nextMs(x), logged = S().logs.some(function (l) { return l.projectId === x.id && l.date === u.today(); }); return '<button type="button" data-act="ld-pick" data-id="' + x.id + '" aria-pressed="' + (LD.projectId === x.id) + '">' + (x.cover ? '<img src="' + MR.photoSrc(x.cover, true) + '" alt="" width="72" height="56">' : '<span></span>') + '<span style="min-width:0"><b>' + esc(x.name.split(',')[0]) + '</b><span>' + esc(nm ? nm.name + ' · ' + nm.progress + '%' : 'Handover') + '</span><br>' + (logged ? MR.tchip('logged today', 'ok', 'check') : MR.tchip('no log yet today', 'warn', 'clock')) + '</span>' + ic('chevr') + '</button>'; }).join('') + '</div>';
    } else if (st === 1) {
      h += '<div class="photos" id="ldPhotos">' + LD.photos.map(function (ph, i) { return '<div class="ph-i"><img src="' + MR.photoSrc(ph, true) + '" alt="Photo ' + (i + 1) + '"><button type="button" class="rm" data-act="ld-rm" data-i="' + i + '" aria-label="Remove photo ' + (i + 1) + '">' + ic('x') + '</button></div>'; }).join('') + '</div><div class="grid2" style="margin-top:10px"><label class="photo-pick" style="min-height:120px">' + ic('camera') + '<span>Take or upload photos</span><input type="file" accept="image/*" capture="environment" multiple id="ldFile"></label><button type="button" class="photo-pick" style="min-height:120px" data-act="ld-sample">' + ic('plus') + '<span>Pick from the site photo library<br><small class="faint">recent photos from this site</small></span></button></div><p class="callout" style="margin-top:12px">' + ic('camera') + 'Wide shot of each room you worked in, plus close-ups of anything the PM should see. ' + (LD.photos.length ? LD.photos.length + ' added.' : 'You can skip this.') + '</p>';
    } else if (st === 2) {
      var ms = activeMs(p);
      h += '<div class="stack" style="gap:10px">' + (ms.length ? ms.map(function (m) { var v = LD.prog[m.id] != null ? LD.prog[m.id] : m.progress; return '<div class="trade' + (v !== m.progress ? ' changed' : '') + '"><div class="tt"><b>' + esc(m.name) + '</b><output aria-live="polite">' + v + '%</output></div><div class="ctl"><button type="button" data-act="ld-pr" data-id="' + m.id + '" data-d="-5" aria-label="5% less on ' + esc(m.name) + '">−5</button><div class="bar ' + (v >= 100 ? 'ok' : 'brand') + '"><i style="width:' + v + '%"></i></div><button type="button" data-act="ld-pr" data-id="' + m.id + '" data-d="5" aria-label="5% more on ' + esc(m.name) + '">+5</button></div><span class="muted" style="font-size:12.5px">Was ' + m.progress + '% · planned finish ' + u.fshort(m.end) + (v >= 100 && m.progress < 100 ? ' · <b class="ok">marks it complete</b>' : '') + '</span></div>'; }).join('') : MR.empty('projects', 'No trade active this week', 'Nothing is scheduled on this site right now.')) + '</div>';
      h += '<div class="field" style="margin-top:18px"><span>Who was on site</span><div class="crewgrid">' + CREW.map(function (c) { return '<div class="cg"><span>' + c[1] + '</span><div class="stepper"><button type="button" data-act="ld-crew" data-k="' + c[0] + '" data-d="-1" aria-label="One fewer ' + c[1].toLowerCase() + '">' + ic('minus') + '</button><output aria-live="polite" aria-label="' + c[1] + '">' + (LD.crew[c[0]] || 0) + '</output><button type="button" data-act="ld-crew" data-k="' + c[0] + '" data-d="1" aria-label="One more ' + c[1].toLowerCase() + '">' + ic('plus') + '</button></div></div>'; }).join('') + '</div></div>';
    } else if (st === 3) {
      var rooms = (function () { var q = MR.quote(p.quoteId); return q.versions[q.versions.length - 1].sections.map(function (s) { return s.title; }); })();
      var open = S().snags.filter(function (s) { return s.projectId === p.id && s.status !== 'closed'; });
      h += '<div class="yn" role="group" aria-label="Any new snags"><button type="button" data-act="ld-snag" data-v="0" aria-pressed="' + (LD.snag === false) + '">No new snags</button><button type="button" data-act="ld-snag" data-v="1" aria-pressed="' + (!!LD.snag) + '">Yes, add one</button></div>';
      if (LD.snag) h += '<div class="stack" style="gap:12px;margin-top:14px"><label class="field"><span>What is wrong?</span><input class="inp" id="lsT" value="' + esc(LD.snag.title) + '" placeholder="e.g. Shutter gap 3 mm at top, wardrobe 2" data-bind="ld-sn" data-k="title"></label><label class="field"><span>Room</span><input class="inp" id="lsR" list="lsRooms" value="' + esc(LD.snag.room) + '" placeholder="Room or area" data-bind="ld-sn" data-k="room"><datalist id="lsRooms">' + rooms.map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist></label><div class="field"><span>Severity</span><div class="seg" role="group" aria-label="Severity">' + ['low', 'medium', 'high'].map(function (s) { return '<button type="button" data-act="ld-sev" data-v="' + s + '" aria-pressed="' + (LD.snag.sev === s) + '" style="height:40px;padding:0 16px">' + s[0].toUpperCase() + s.slice(1) + '</button>'; }).join('') + '</div></div><p class="callout">' + ic('camera') + (LD.photos.length ? 'Uses your first photo from step 2.' : 'Uses a library photo (add your own in step 2).') + '</p></div>';
      if (open.length) h += '<div style="margin-top:18px"><div class="wc-k" style="margin-bottom:6px">Already open on this site</div>' + MR.snagsHtml(open, false) + '</div>';
    } else {
      var ch = activeMs(p).filter(function (m) { return LD.prog[m.id] != null && LD.prog[m.id] !== m.progress; }), tot = CREW.reduce(function (a, c) { return a + (LD.crew[c[0]] || 0); }, 0);
      h += '<div class="field"><span>Weather</span><div class="wxpick" role="group" aria-label="Weather">' + WX.map(function (w) { return '<button type="button" data-act="ld-wx" data-v="' + w[0] + '" aria-pressed="' + (LD.weather === w[0]) + '">' + ic(w[1]) + w[0] + '</button>'; }).join('') + '</div>' + (LD.weather === 'Smog' ? '<input class="inp" style="margin-top:8px;height:44px;max-width:200px" inputmode="numeric" placeholder="AQI, e.g. 342" aria-label="AQI" value="' + esc(LD.aqi) + '" data-bind="ld" data-k="aqi">' : '') + '</div>';
      h += '<dl class="sumlist" style="margin:16px 0">' + [['Site', esc(p.name.split(',')[0])], ['Photos', LD.photos.length || 'none'], ['Progress', ch.length ? ch.map(function (m) { return esc(m.name) + ' ' + m.progress + '% → ' + LD.prog[m.id] + '%'; }).join('<br>') : 'no change'], ['Crew', tot + ' on site'], ['Snags', LD.snag ? esc(LD.snag.title || 'New snag') + ' (' + LD.snag.sev + ')' : 'none new']].map(function (x) { return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('') + '</dl>';
      h += '<label class="field"><span>Work done today</span><textarea class="ta" rows="3" id="ldWork" placeholder="e.g. Kitchen carcasses fixed and levelled. Wardrobe shutters in master." data-bind="ld" data-k="work">' + esc(LD.work) + '</textarea><span class="err" id="ldErr"></span></label>';
      h += '<label class="field"><span>Note for the next person <span class="faint">(optional, shown first on tomorrow’s log)</span></span><textarea class="ta" rows="2" placeholder="e.g. Keys with the guard. Lift booked 9–11 am for the sofa delivery." data-bind="ld" data-k="next">' + esc(LD.next) + '</textarea></label>';
    }
    h += '<div class="sticky-save">' + (st ? MR.btn('ld-step', 'Back', { attrs: ' data-d="-1"' }) : '<a class="btn" href="' + (MR.S.role === 'site' ? '#/site' : '#/logs') + '" data-act="ld-cancel">Cancel</a>') + (st < 4 ? MR.btn('ld-step', st === 3 && LD.snag === null ? 'Skip' : 'Next', { cls: 'pri', attrs: ' data-d="1"', disabled: st === 0 && !LD.projectId }) : MR.btn('ld-save', 'Save log', { cls: 'pri', icon: 'check' })) + '</div></div>';
    return { html: h, title: 'New daily log', crumbs: [['Daily logs', '#/logs'], ['New']], nav: 'logs', tab: 'log/new', primary: false, after: function () {
      var f = document.getElementById('ldFile'); if (f) f.addEventListener('change', function () { var files = Array.prototype.slice.call(f.files, 0, 6), left = files.length; if (!left) return; MR.toast('Adding ' + left + ' photo' + (left > 1 ? 's' : '') + '…', { plain: true }); files.forEach(function (file) { MR.downscale(file, 1000, function (d) { if (d) LD.photos.push(d); if (--left === 0) MR.render(); }); }); });
    } };
  };
  function rr() { var y = window.scrollY; MR.render(); window.scrollTo(0, y); }
  MR.act['ld-pick'] = function (el) { LD.projectId = el.dataset.id; LD.prog = {}; LD.snag = null; LD.step = 1; MR.render(); window.scrollTo(0, 0); };
  MR.act['ld-step'] = function (el) {
    var d = +el.dataset.d;
    if (d > 0 && LD.step === 3 && LD.snag && (LD.snag.title || '').trim().length < 5) { MR.toast('Describe the snag so the trade can fix it without a call, or choose “No new snags”.', { kind: 'bad' }); var t = document.getElementById('lsT'); if (t) t.focus(); return; }
    if (d > 0 && LD.step === 3 && LD.snag === null) LD.snag = false;
    LD.step = Math.max(0, Math.min(4, LD.step + d)); MR.render(); window.scrollTo(0, 0);
  };
  MR.bind.ld = function (el) { LD[el.dataset.k] = el.value; };
  MR.bind['ld-sn'] = function (el) { LD.snag[el.dataset.k] = el.value; };
  MR.act['ld-wx'] = function (el) { LD.weather = el.dataset.v; rr(); };
  MR.act['ld-crew'] = function (el) { var k = el.dataset.k; LD.crew[k] = Math.max(0, Math.min(40, (LD.crew[k] || 0) + +el.dataset.d)); el.parentNode.querySelector('output').textContent = LD.crew[k]; };
  MR.act['ld-pr'] = function (el) { var p = MR.project(LD.projectId), m = MR.find(p.milestones, el.dataset.id), cur = LD.prog[m.id] != null ? LD.prog[m.id] : m.progress; LD.prog[m.id] = Math.max(m.progress, Math.min(100, cur + +el.dataset.d)); rr(); };
  MR.act['ld-snag'] = function (el) { LD.snag = el.dataset.v === '1' ? (LD.snag || { title: '', room: '', sev: 'medium' }) : false; rr(); };
  MR.act['ld-sev'] = function (el) { LD.snag.sev = el.dataset.v; rr(); };
  MR.act['ld-rm'] = function (el) { LD.photos.splice(+el.dataset.i, 1); rr(); };
  MR.act['ld-sample'] = function () { var pool = SAMPLE.filter(function (x) { return LD.photos.indexOf(x) < 0; }); if (!pool.length) return; LD.photos.push(pool[Math.floor(Math.random() * pool.length)]); rr(); };
  MR.act['ld-cancel'] = function (el) { LD = null; MR.go(el.getAttribute('href')); };
  MR.act['ld-save'] = function () {
    var w = document.getElementById('ldWork'); LD.work = w.value.trim();
    if (LD.work.length < 8) { document.getElementById('ldErr').textContent = 'Write a line about what got done today. Even “No work: material awaited” helps.'; w.setAttribute('aria-invalid', 'true'); w.focus(); return; }
    var p = MR.project(LD.projectId), weather = LD.weather + (LD.weather === 'Smog' && parseInt(LD.aqi, 10) ? ' · AQI ' + parseInt(LD.aqi, 10) : '');
    var log = { id: u.uid('lg'), projectId: p.id, date: LD.date, by: MR.me().id, at: new Date().toISOString(), weather: weather, crew: LD.crew, work: LD.work, issues: '', next: (LD.next || '').trim(), photos: LD.photos.slice() };
    var undo = [];
    Object.keys(LD.prog).forEach(function (id) {
      var m = MR.find(p.milestones, id), old = m.progress, nv = LD.prog[id]; if (nv === old) return;
      m.progress = nv; m.doneAt = nv >= 100 ? u.today() : null; undo.push(function () { m.progress = old; m.doneAt = null; });
      MR.audit('project', p.code, 'milestone updated', m.name + ': ' + old + '% → ' + nv + '% (from daily log)');
      if (nv >= 100) { var due = p.schedule.filter(function (ps) { return ps.msId === m.id && !ps.invoiceId; }); if (due.length) MR.notify(['accounts', 'owner'], m.name + ' complete on ' + p.name.split(',')[0] + '. ' + due.map(function (x) { return x.pct + '%'; }).join(' + ') + ' ready to bill.', '#/project/' + p.id + '?tab=billing', 'ok'); }
    });
    if (LD.snag && LD.snag.title) {
      var sn = { id: u.uid('sn'), no: 'SN-' + u.pad(MR.next('snag'), 3), projectId: p.id, title: LD.snag.title.trim(), room: LD.snag.room || 'Site', trade: 'Carpentry', sev: LD.snag.sev, status: 'open', raised: new Date().toISOString(), by: MR.me().id, assignee: 'Carpentry', due: u.addD(u.today(), LD.snag.sev === 'high' ? 2 : 5), photo: LD.photos[0] || 's-niche.jpg', closeNote: '', closePhoto: '' };
      S().snags.push(sn); log.issues = 'New snag ' + sn.no + ': ' + sn.title; MR.audit('snag', sn.no, 'raised', sn.title + ' · ' + sn.room); undo.push(function () { S().snags.splice(S().snags.indexOf(sn), 1); });
      if (sn.sev === 'high') MR.notify(['pm', 'owner'], 'High snag on ' + p.name.split(',')[0] + ': ' + sn.title, '#/project/' + p.id + '?tab=snags', 'bad');
    }
    S().logs.push(log);
    MR.audit('site log', p.code, 'logged', u.fday(LD.date) + ' · ' + log.photos.length + ' photo' + (log.photos.length === 1 ? '' : 's') + (log.next ? ' · note for the next person' : ''));
    LD = null; MR.save(); MR.go(MR.S.role === 'site' ? '#/site' : '#/project/' + p.id + '?tab=site');
    MR.undoable('Daily log saved for ' + p.name.split(',')[0], function () { S().logs.splice(S().logs.indexOf(log), 1); undo.forEach(function (f) { f(); }); });
  };
  /* ---------------- snags ---------------- */
  MR.views.snags = function (r) {
    var projs = MR.S.role === 'site' ? myProjects() : S().projects, vk = r.qs.view || 'open';
    var all = S().snags.filter(function (s) { return projs.some(function (p) { return p.id === s.projectId; }); });
    var V = [['open', 'Open', function (s) { return s.status !== 'closed'; }], ['high', 'High', function (s) { return s.status !== 'closed' && s.sev === 'high'; }], ['closed', 'Closed', function (s) { return s.status === 'closed'; }], ['all', 'All', function () { return true; }]];
    var vd = V.filter(function (x) { return x[0] === vk; })[0] || V[0];
    var h = '<div class="page narrow"><div class="ph"><div><h1>Snags</h1><p class="sub">Defects found on site, with a photo, a room and a trade. Closed only with a note and an after photo.</p></div><div class="acts">' + (MR.can('snag.raise') ? MR.btn('new-snag', 'Raise snag', { cls: 'pri', icon: 'plus' }) : '') + '</div></div>';
    h += '<div class="views">' + V.map(function (v) { return '<a href="#/snags?view=' + v[0] + '"' + (vk === v[0] ? ' aria-current="page"' : '') + '>' + v[1] + ' <span class="ct">' + all.filter(v[2]).length + '</span></a>'; }).join('') + '</div>';
    return { html: h + MR.snagsHtml(all.filter(vd[2]), true) + '</div>', title: 'Snags', crumbs: [['Snags']], nav: MR.S.role === 'site' ? 'snags' : 'site', tab: 'snags' };
  };
  MR.act['new-snag'] = function (el) {
    var projs = myProjects(); if (!projs.length) projs = S().projects.filter(function (p) { return p.status !== 'handed'; });
    var pid = (el && el.dataset && el.dataset.id) || (MR.route().p[0] === 'project' ? MR.route().p[1] : projs[0].id);
    MR._snPhoto = null;
    function rooms(p) { var q = MR.quote(p.quoteId); return q.versions[q.versions.length - 1].sections.map(function (s) { return s.title; }); }
    var p = MR.project(pid);
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">Raise a snag</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><label class="field"><span>Site</span><select class="sel" id="snP">' + projs.map(function (x) { return '<option value="' + x.id + '"' + (x.id === pid ? ' selected' : '') + '>' + esc(x.name.split(',')[0]) + '</option>'; }).join('') + '</select></label><label class="field"><span>What is wrong?</span><input class="inp" id="snT" placeholder="e.g. Shutter gap 3 mm at top, wardrobe 2" autofocus></label><div class="grid2"><label class="field"><span>Room</span><input class="inp" id="snR" list="snRooms" placeholder="Room or area"><datalist id="snRooms">' + rooms(p).map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist></label><label class="field"><span>Trade</span><select class="sel" id="snTr">' + TRADES.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select></label></div><div class="field"><span>Severity</span><div class="seg" role="group" aria-label="Severity">' + ['low', 'medium', 'high'].map(function (s) { return '<button type="button" data-act="sn-sev" data-v="' + s + '" aria-pressed="' + (s === 'medium') + '" style="height:36px;padding:0 16px">' + SEV[s] + '</button>'; }).join('') + '</div></div><div class="grid2"><label class="photo-pick">' + ic('camera') + '<span id="snPhL">Take a photo</span><input type="file" accept="image/*" capture="environment" id="snF"></label><button type="button" class="photo-pick" data-act="sn-sample">' + ic('plus') + '<span>Pick from library</span></button></div><span class="err" id="snErr"></span></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('sn-save', 'Raise snag', { cls: 'pri' }) + '</div>');
    MR._snSev = 'medium';
    var f = document.getElementById('snF'); f.addEventListener('change', function () { if (f.files[0]) MR.downscale(f.files[0], 1000, function (d) { MR._snPhoto = d; document.getElementById('snPhL').textContent = d ? 'Photo attached ✓' : 'Could not read that image'; }); });
  };
  MR.act['sn-sev'] = function (el) { MR._snSev = el.dataset.v; el.parentNode.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b === el)); }); };
  MR.act['sn-sample'] = function (el) { MR._snPhoto = SAMPLE[Math.floor(Math.random() * SAMPLE.length)]; el.querySelector('span').textContent = 'Photo attached ✓'; };
  MR.act['sn-save'] = function () {
    var t = document.getElementById('snT').value.trim(), room = document.getElementById('snR').value.trim(), err = document.getElementById('snErr');
    if (t.length < 5) { err.textContent = 'Describe the defect so the trade can fix it without a call.'; document.getElementById('snT').focus(); return; }
    if (!room) { err.textContent = 'Which room? Pick from the list or type it.'; document.getElementById('snR').focus(); return; }
    if (!MR._snPhoto) { err.textContent = 'Add a photo. Snags without one get argued about.'; return; }
    var p = MR.project(document.getElementById('snP').value);
    var s = { id: u.uid('sn'), no: 'SN-' + u.pad(MR.next('snag'), 3), projectId: p.id, title: t, room: room, trade: document.getElementById('snTr').value, sev: MR._snSev, status: 'open', raised: new Date().toISOString(), by: MR.me().id, assignee: document.getElementById('snTr').value, due: u.addD(u.today(), MR._snSev === 'high' ? 2 : 5), photo: MR._snPhoto, closeNote: '', closePhoto: '' };
    S().snags.push(s); MR.audit('snag', s.no, 'raised', t + ' · ' + room);
    if (s.sev === 'high') MR.notify(['pm', 'owner'], 'High snag on ' + p.name.split(',')[0] + ': ' + t, '#/project/' + p.id + '?tab=snags', 'bad');
    MR.save(); MR.closeDlg(); MR.render(); MR.toast(s.no + ' raised · due ' + u.fshort(s.due));
  };
  MR.act['open-snag'] = function (el) {
    var s = MR.find(S().snags, el.dataset.id); if (!s) return; var p = MR.project(s.projectId);
    var h = '<div class="dlg-hd"><h2 id="drT">' + esc(s.no) + '</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><img src="' + MR.photoSrc(s.photo) + '" alt="Snag photo: ' + esc(s.title) + '" style="border-radius:8px;width:100%;aspect-ratio:4/3;object-fit:cover"><div><div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">' + MR.pill(s.status, SNST) + '<span class="sev sev-' + s.sev + '">' + ic('snag') + SEV[s.sev] + '</span></div><h3 style="font:500 20px/1.25 var(--serif)">' + esc(s.title) + '</h3></div><dl class="kvs">' + MR.kv('Site', '<a class="rowlink" href="#/project/' + p.id + '?tab=snags">' + esc(p.name) + '</a>') + MR.kv('Room', esc(s.room)) + MR.kv('Trade', esc(s.trade)) + MR.kv('Raised', esc(MR.userById(s.by).name) + ' · ' + u.fdate(s.raised.slice(0, 10))) + MR.kv('Due', '<span class="' + (s.status !== 'closed' && s.due < u.today() ? 'bad' : '') + '">' + u.fdate(s.due) + '</span>') + '</dl>';
    if (s.status === 'closed') h += '<div class="banner ok" style="margin:0">' + ic('check') + '<div class="bt"><b>Closed ' + u.fdate(s.closedAt.slice(0, 10)) + '</b>' + esc(s.closeNote) + '</div></div>' + (s.closePhoto ? '<figure><img src="' + MR.photoSrc(s.closePhoto) + '" alt="After photo" style="border-radius:8px;width:100%;aspect-ratio:4/3;object-fit:cover"><figcaption class="muted" style="font-size:12px;margin-top:4px">After</figcaption></figure>' : '') + (MR.can('snag.close') ? '<div>' + MR.btn('sn-reopen', 'Reopen', { id: s.id }) + '</div>' : '');
    else if (MR.can('snag.close')) h += (s.status === 'open' ? '<div>' + MR.btn('sn-progress', 'Mark in progress', { id: s.id, icon: 'clock' }) + '</div>' : '') + '<div class="panel"><div class="panel-hd"><h3>Close out</h3></div><div class="panel-bd" style="display:flex;flex-direction:column;gap:10px"><label class="field"><span>What was done?</span><textarea class="ta" id="scN" rows="2" placeholder="e.g. Hinges re-set, gap now 2 mm all round. Checked with client."></textarea></label><div class="grid2"><label class="photo-pick" style="min-height:80px">' + ic('camera') + '<span id="scPhL">After photo</span><input type="file" accept="image/*" capture="environment" id="scF"></label><button type="button" class="photo-pick" style="min-height:80px" data-act="sc-sample">' + ic('plus') + '<span>From library</span></button></div><span class="err" id="scErr"></span>' + MR.btn('sn-close', 'Close snag', { cls: 'pri okb', icon: 'check', id: s.id }) + '</div></div>';
    MR.openDrawer(h + '</div>');
    MR._scPhoto = null;
    var f = document.getElementById('scF'); if (f) f.addEventListener('change', function () { if (f.files[0]) MR.downscale(f.files[0], 1000, function (d) { MR._scPhoto = d; document.getElementById('scPhL').textContent = d ? 'After photo attached ✓' : 'Could not read that image'; }); });
  };
  MR.act['sc-sample'] = function (el) { MR._scPhoto = 's-niche.jpg'; el.querySelector('span').textContent = 'Photo attached ✓'; };
  MR.act['sn-progress'] = function (el) { var s = MR.find(S().snags, el.dataset.id); s.status = 'progress'; MR.audit('snag', s.no, 'in progress', s.title); MR.save(); MR.closeDrawer(); MR.render(); MR.undoable(s.no + ' marked in progress', function () { s.status = 'open'; }); };
  MR.act['sn-close'] = function (el) {
    var s = MR.find(S().snags, el.dataset.id), n = document.getElementById('scN').value.trim();
    if (n.length < 5) { document.getElementById('scErr').textContent = 'Add a short note on the fix, for the handover file.'; document.getElementById('scN').focus(); return; }
    var prev = s.status; s.status = 'closed'; s.closedAt = new Date().toISOString(); s.closeNote = n; s.closePhoto = MR._scPhoto || '';
    MR.audit('snag', s.no, 'closed', s.title + ' · ' + n.slice(0, 60)); MR.save(); MR.closeDrawer(); MR.render();
    MR.undoable(s.no + ' closed', function () { s.status = prev; s.closedAt = null; });
  };
  MR.act['sn-reopen'] = function (el) { var s = MR.find(S().snags, el.dataset.id); s.status = 'open'; MR.audit('snag', s.no, 'reopened', s.title); MR.save(); MR.closeDrawer(); MR.render(); };

  /* lightbox */
  MR.act.lightbox = function (el) {
    var d = MR.openDlg('<button type="button" class="icon-btn" data-act="dlg-close" aria-label="Close photo">' + ic('x') + '</button><img src="' + MR.photoSrc(el.dataset.src) + '" alt="' + esc(el.dataset.cap || 'Site photo') + '"><div class="lb-ft"><span>' + esc(el.dataset.cap || '') + '</span><span>Photo: Unsplash</span></div>', 'lightbox');
    d.setAttribute('aria-label', 'Photo viewer');
  };
})();
