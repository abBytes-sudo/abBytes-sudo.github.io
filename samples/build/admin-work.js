/* Sthira back office · Projects (list, project sheet, the weekly site-update step flow that publishes to the client portal),
   Client portal activity (snags, approvals, payments and messages from the portal, with reply and resolve) and Careers. */
(function () {
  'use strict';
  var BO = window.BO, D = BO.D, A = BO.A, $ = BO.$, $$ = BO.$$, esc = BO.esc, inr = BO.inr, NOW = BO.NOW, ic = BO.ic, DAY = 864e5;
  var KEYS = ['foundation', 'columns', 'slabs', 'walls', 'glazing', 'landscape'];
  var STN = {}; D.STAGES.forEach(function (s) { STN[s.key] = s.name; });
  var PHOTOS = [['site-blockwork', 'Second-floor blockwork, grid A–B'], ['site-scaffold', 'Scaffold, east elevation'], ['site-plaster', 'Internal plaster trial, ground floor'], ['site-engineer', 'Line and level check'], ['site-crew', 'Toolbox talk, 8:15 am'], ['site-frame', 'Frame from the street'], ['site-rebar', 'Lintel steel over W10'], ['site-formwork', 'Stair core shuttering'], ['site-glazing', 'Window frame mock-up'], ['site-pour', 'Lintel pour'], ['site-crane', 'Material hoist'], ['site-excavation', 'Sump excavation']];

  function projects() { return BO.crm.leads.filter(function (l) { return l.stage === 'project' && l.project && BO.inStudio(l); }); }
  function byCode(code) { return BO.crm.leads.filter(function (l) { return l.project && l.project.code === code; })[0]; }
  function updatesFor(code) { var u = BO.P().updates.filter(function (x) { return (x.code || 'STH-2611') === code; }); return code === 'STH-2611' ? u.concat(D.WEEKS) : u; }
  function stagesFor(code) {
    var u = updatesFor(code)[0];
    if (u && u.stages) return u.stages;
    if (code === 'STH-2611') return { foundation: 100, columns: 100, slabs: 100, walls: D.LIVE.stagePct, glazing: 0, landscape: 0 };
    var l = byCode(code), p = l ? l.project.pct : 0, o = {}; KEYS.forEach(function (k, i) { o[k] = p >= 100 ? 100 : 0; }); return o;
  }
  function dayOf(code) { var u = updatesFor(code)[0], l = byCode(code); return Math.max(l ? l.project.day : 0, u && u.day && !u.stages0 ? (u.by ? u.day : 0) : 0); }
  BO.stagesFor = stagesFor;

  /* ───────── projects ───────── */
  function projList() {
    var P = projects();
    if (!P.length) return BO.empty('No live projects' + (BO.studio !== 'All' ? ' in ' + BO.studio : ''), 'Win a quote in the pipeline and it becomes a project here, with a programme and a client-portal sign-in.', '<a class="b" href="#/pipeline?stage=quote&layout=table">Open quotes</a>');
    return '<div class="tw"><table class="tbl proj"><thead><tr><th>Project</th><th>Site</th><th>Stage</th><th>Programme</th><th>Last site update</th><th class="num">Value</th><th class="act"><span class="sr">Action</span></th></tr></thead><tbody>' + P.map(function (l) {
      var p = l.project, u = updatesFor(p.code)[0], day = dayOf(p.code), done = p.pct >= 100, stale = !done && (!u || new Date(u.date) < NOW - 7 * DAY);
      return '<tr data-href="projects/' + esc(p.code) + '"><td><b class="nm">' + esc(p.code) + '</b><small>' + esc(l.name) + '</small></td><td>' + esc(l.loc || '') + '<small>' + esc(l.city) + '</small></td><td>' + esc(p.stage) + (p.pct && !done ? ' <span class="mono faint">' + (p.code === 'STH-2611' ? stagesFor(p.code).walls : p.pct) + '%</span>' : '') + '</td><td class="prog"><span class="meter"><i style="width:' + Math.round(day / p.total * 100) + '%"></i></span><small>Day ' + day + ' of ' + p.total + '</small></td><td>' + (u ? 'Week ' + u.w + ' · ' + A.date(u.date) + (stale ? ' <span class="tg red sm">due</span>' : '') : '<span class="faint">None yet</span>') + '</td><td class="num">' + (p.code === 'STH-2611' ? inr(D.LIVE.value) : esc(l.budget || (p.value ? inr(p.value) : '—'))) + '</td><td class="act">' + (done ? '<a class="b sm" href="#/projects/' + esc(p.code) + '">Open</a>' : '<a class="b sm pri" href="#/projects/' + esc(p.code) + '/update">' + ic('photo') + 'Post update</a>') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  function stageBars(st, prev) {
    return '<ol class="stg">' + KEYS.map(function (k, i) { var v = st[k] || 0, pv = prev ? prev[k] || 0 : v; return '<li class="' + (v >= 100 ? 'done' : v > 0 ? 'cur' : '') + '"><span class="mono">0' + (i + 1) + '</span><b>' + esc(STN[k].replace(' & ', ' and ')) + '</b><span class="meter"><i style="width:' + v + '%"></i>' + (v > pv ? '<i class="gain" style="left:' + pv + '%;width:' + (v - pv) + '%"></i>' : '') + '</span><span class="mono">' + (v >= 100 ? 'Done' : v ? v + '%' + (v > pv ? ' <em>+' + (v - pv) + '</em>' : '') : '—') + '</span></li>'; }).join('') + '</ol>';
  }
  function weekCard(u, opts) {
    opts = opts || {}; var ph = (u.photos && u.photos.length ? u.photos : [u.photo]).filter(Boolean);
    return '<article class="wk"><div class="wk-ph">' + ph.slice(0, 3).map(function (p, i) { var s = String(p), c = s.indexOf('wk-') === 0 ? 'model view from the gate, day ' + u.day : s.indexOf('data:') === 0 ? 'photo ' + (i + 1) : 'typical of this stage'; return '<img src="' + (s.indexOf('data:') === 0 ? p : 'photos/' + p + '-s.jpg') + '" alt="' + esc('Week ' + u.w + ', ' + c) + '" loading="lazy" decoding="async" width="720" height="540">'; }).join('') + (ph.length > 3 ? '<span class="more-ph">+' + (ph.length - 3) + '</span>' : '') + '</div><div class="wk-b"><p class="wk-m"><span>Week ' + u.w + '</span><span>' + A.date(u.date) + '</span><span>Day ' + u.day + '</span><span>' + (u.crew || '—') + ' on site</span><span>' + esc(u.weather || '') + '</span>' + (u.by ? '<span>' + esc(u.by) + '</span>' : '') + (opts.fresh ? '<span class="tg blue sm">published</span>' : '') + '</p><h3>' + esc(u.title) + '</h3>' + (u.note ? '<p class="wk-n">' + esc(u.note) + '</p>' : '') + '<div class="wk-c"><div><p class="k">Done</p><ul>' + (u.done || []).map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul></div><div><p class="k">Next</p><ul>' + (u.next || []).map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul></div></div></div></article>';
  }
  function projSheet(code) {
    var l = byCode(code); if (!l) return BO.empty('No project called ' + esc(code), 'It may have been reset. Pick one from the list.', '<a class="b" href="#/projects">All projects</a>');
    var p = l.project, rao = code === 'STH-2611', L = D.LIVE, U = updatesFor(code), st = stagesFor(code), day = dayOf(code), Pp = BO.P();
    var dm = rao ? BO.dueMilestones()[0] : null, pc = rao ? BO.pendingCO() : [], openSn = rao ? D.SNAGS.concat(Pp.snags).filter(function (s) { var x = Pp.snagStatus[s.id] || s.status; return x !== 'fixed'; }).length : 0;
    var paid = rao ? D.PAYMENTS.filter(function (m) { return m.status === 'paid' || Pp.paid[m.n]; }).reduce(function (a, m) { return a + m.pct; }, 0) : 0;
    return '<div class="vh-row"><h1>' + esc(code) + ' · ' + esc(rao ? L.name : l.name) + '</h1><p class="meta">' + esc(rao ? L.plot : (l.loc ? l.loc + ', ' : '') + l.city) + '</p><span class="grow"></span>' + (rao ? '<a class="b" href="portal.html" target="_blank" rel="noopener">' + ic('ext') + 'Client portal</a>' : '') + (p.pct < 100 ? '<a class="b pri" href="#/projects/' + esc(code) + '/update">' + ic('photo') + 'Post site update</a>' : '') + '</div>' +
      '<div class="kpis k4"><div class="kpi st"><span class="kpi-l">Programme</span><span class="kpi-v">Day ' + day + '<small> / ' + p.total + '</small></span><span class="meter"><i style="width:' + Math.round(day / p.total * 100) + '%"></i></span></div><div class="kpi st"><span class="kpi-l">Collected</span><span class="kpi-v">' + (rao ? paid + '%' : '—') + '</span><span class="kpi-d">' + (dm ? '<span class="dl">' + inr(L.value * dm.pct / 100) + ' due ' + A.date(dm.date) + '</span>' : '<span class="dl up">Nothing due</span>') + '</span></div><a class="kpi" href="#/portal"><span class="kpi-l">Open snags</span><span class="kpi-v">' + openSn + '</span><span class="kpi-d"><span class="dl">From the site team and the client</span></span></a><a class="kpi" href="#/portal"><span class="kpi-l">Approvals with the client</span><span class="kpi-v">' + pc.length + '</span><span class="kpi-d"><span class="dl">' + (pc.length ? pc.map(function (c) { return c.id; }).join(', ') : 'None waiting') + '</span></span></a></div>' +
      '<div class="home-g"><div><section class="cd"><div class="cd-h"><h2>Stages</h2><span class="meta">' + esc(p.stage) + '</span></div><div class="cd-b">' + stageBars(st) + '</div></section>' +
      '<section class="cd"><div class="cd-h"><h2>Weekly site updates</h2><span class="meta">' + U.length + ' in the portal</span></div>' + (U.length ? U.slice(0, 4).map(function (u, i) { return weekCard(u, { fresh: i === 0 && u.by && u.at }); }).join('') : BO.empty('No updates yet', 'The first one goes out on the Friday after mobilisation.', '<a class="b pri" href="#/projects/' + esc(code) + '/update">Post the first update</a>')) + '</section></div>' +
      '<div class="home-r"><section class="cd"><div class="cd-h"><h2><span class="bub">D</span>Title block</h2></div><dl class="tb2 cols1">' + [['Client', rao ? L.client : l.name], ['Type', rao ? L.type : l.type + (l.floors ? ', ' + l.floors : '')], ['Built-up', BO.num(rao ? L.area : l.area) + ' sq ft'], ['Contract', rao ? inr(L.value) : (p.value ? inr(p.value) : l.budget || '—')], ['Start', A.date(rao ? L.start : p.start || l.at) + (rao ? ' 2026' : '')], ['Handover', rao ? A.date(L.handover) : p.pct >= 100 ? 'Handed over' : '320-day programme'], ['Project manager', rao ? L.pm : BO.TEAM[p.pm || l.owner] ? BO.TEAM[p.pm || l.owner][0] : l.owner], ['Site engineer', rao ? L.se : 'To assign'], ['Architect', rao ? L.architect : 'Sthira design team']].map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('') + '</dl></section>' +
      '<section class="cd"><div class="cd-h"><h2>Lead record</h2></div><div class="cd-b"><button type="button" class="rel" data-act="lead" data-id="' + l.id + '">' + ic('user') + '<span><b>' + esc(l.name) + '</b><small>' + l.id + ' · ' + esc(l.source) + ' · timeline and notes</small></span>' + ic('chev-r') + '</button></div></section></div></div>';
  }

  /* the site-update step flow */
  var drafts = {};
  function draft(code) {
    if (drafts[code]) return drafts[code];
    var last = updatesFor(code)[0], st = BO.clone(stagesFor(code));
    return (drafts[code] = { step: 1, photos: [], uploads: [], stages: st, prev: BO.clone(st), crew: last ? last.crew || 30 : 24, weather: 'Dry, 27°', title: '', done: '', next: '', note: '', w: last ? last.w + 1 : 1, day: last ? Math.max(last.day + 7, dayOf(code) + 3) : dayOf(code) + 3 });
  }
  function stepsNav(d) { return '<ol class="ufs" aria-label="Steps">' + ['Pick photos', 'Progress per stage', 'Notes for the client', 'Publish'].map(function (t, i) { var n = i + 1, c = n < d.step ? 'done' : n === d.step ? 'cur' : ''; return '<li class="' + c + '"' + (n === d.step ? ' aria-current="step"' : '') + '><button type="button" data-act="goStep" data-v="' + n + '"' + (n > d.step && !canGo(d, n) ? ' disabled' : '') + '><span class="bub">' + (c === 'done' ? '✓' : n) + '</span>' + t + '</button></li>'; }).join('') + '</ol>'; }
  function why(d, n) { if (n >= 2 && !d.photos.length && !d.uploads.length) return 'Pick at least one photo for the Raos first.'; if (n >= 4 && d.title.trim().length < 6) return 'Write a headline: one line on what changed this week.'; if (n >= 4 && !lines(d.done).length) return 'Add at least one line under “Done this week”.'; return ''; }
  function canGo(d, n) { return !why(d, n); }
  function lines(s) { return String(s || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); }
  function stepBody(d, code) {
    if (d.step === 1) {
      var lib = PHOTOS.map(function (p) { var i = d.photos.indexOf(p[0]); return '<button type="button" class="ph' + (i >= 0 ? ' on' : '') + '" data-act="ph" data-v="' + p[0] + '" aria-pressed="' + (i >= 0) + '"><img src="photos/' + p[0] + '-s.jpg" alt="" loading="lazy" decoding="async" width="720" height="540"><span class="ph-n">' + (i >= 0 ? (i === 0 ? 'Cover' : i + 1) : '') + '</span><small>' + esc(p[1]) + '</small></button>'; }).join('');
      var up = d.uploads.map(function (u, i) { return '<div class="ph on up"><img src="' + u + '" alt="Uploaded photo ' + (i + 1) + '"><button type="button" class="ib" data-act="unup" data-i="' + i + '" aria-label="Remove uploaded photo ' + (i + 1) + '">' + ic('x') + '</button><small>From your phone</small></div>'; }).join('');
      return '<h2 class="st-h">Pick the photos <span class="meta">' + (d.photos.length + d.uploads.length) + ' picked · the first is the cover</span></h2><p class="hint">This week’s site camera, fixed points first. Tap again to drop one.</p><div class="phs">' + up + lib + '<label class="ph add-ph"><input type="file" accept="image/*" data-ch="upload" class="sr">' + ic('plus') + '<b>Add from phone</b><small>Resized here, never uploaded elsewhere</small></label></div>';
    }
    if (d.step === 2) {
      return '<h2 class="st-h">Progress per stage <span class="meta">Week ' + d.w + ' · day ' + d.day + '</span></h2><div class="rng">' + KEYS.map(function (k, i) { var v = d.stages[k], pv = d.prev[k]; return '<div class="rg' + (v !== pv ? ' ch' : '') + '"><label for="rg' + k + '"><span class="mono">0' + (i + 1) + '</span>' + esc(STN[k]) + '</label><input type="range" min="0" max="100" step="1" id="rg' + k + '" data-in="rg" data-k="' + k + '" value="' + v + '"' + (pv >= 100 ? ' disabled title="Signed off: reopening a finished stage needs the PM"' : '') + '><output class="mono">' + v + '%' + (v > pv ? ' <em>+' + (v - pv) + '</em>' : v < pv ? ' <em class="red">' + (v - pv) + '</em>' : '') + '</output></div>'; }).join('') + '</div>' +
        '<div class="q-in"><label class="fl"><span>Crew on site this week</span><input class="in" type="number" min="0" max="200" id="crew" data-in="crew" value="' + d.crew + '"></label><div class="fl"><span>Weather</span><div class="sg sm" role="group" aria-label="Weather">' + ['Dry, 27°', 'Showers', 'Heavy rain'].map(function (w) { return '<button type="button" data-act="wx" data-v="' + w + '" aria-pressed="' + (d.weather === w) + '">' + w + '</button>'; }).join('') + '</div></div></div>';
    }
    if (d.step === 3) {
      var sug = KEYS.filter(function (k) { return d.stages[k] > d.prev[k]; }).map(function (k) { return STN[k] + ' to ' + d.stages[k] + '%'; });
      return '<h2 class="st-h">Notes for the client <span class="meta">Plain words; the Raos read this on Friday evening</span></h2>' +
        '<label class="fl"><span>Headline</span><input class="in" id="uT" data-in="uT" maxlength="80" value="' + esc(d.title) + '" placeholder="' + esc(sug.length ? sug[0] + '; third floor started' : 'Third-floor blockwork under way') + '"></label>' +
        '<div class="q-in"><label class="fl"><span>Done this week · one per line</span><textarea class="in" rows="4" id="uD" data-in="uD" placeholder="' + esc(sug.concat(['Lintels cast over W13 to W18']).join('\n')) + '">' + esc(d.done) + '</textarea></label><label class="fl"><span>Next week · one per line</span><textarea class="in" rows="4" id="uN" data-in="uN" placeholder="Plumbing sleeves through the terrace slab">' + esc(d.next) + '</textarea></label></div>' +
        '<label class="fl"><span>A note from you (optional)</span><textarea class="in" rows="2" id="uO" data-in="uO" placeholder="Anything they should decide or come and see">' + esc(d.note) + '</textarea></label>' + (sug.length && !d.done ? '<button type="button" class="lnk" data-act="useSug">Fill “Done” from the progress you set</button>' : '');
    }
    var w = why(d, 4);
    return '<h2 class="st-h">Ready to publish</h2><dl class="kvg"><div><dt>Goes to</dt><dd>' + (code === 'STH-2611' ? 'Ananya and Vikram Rao, client portal' : 'The client portal for ' + esc(code)) + '</dd></div><div><dt>Photos</dt><dd>' + (d.photos.length + d.uploads.length) + '</dd></div><div><dt>Stages changed</dt><dd>' + (KEYS.filter(function (k) { return d.stages[k] !== d.prev[k]; }).map(function (k) { return STN[k] + ' ' + d.prev[k] + '→' + d.stages[k] + '%'; }).join(', ') || 'None') + '</dd></div><div><dt>Notifies</dt><dd>Portal badge and an email at 6 pm</dd></div></dl>' + (w ? '<p class="hint red">' + esc(w) + '</p>' : '');
  }
  function previewCard(d) {
    var u = { w: d.w, date: '2026-11-27', day: d.day, crew: d.crew, weather: d.weather, title: d.title || 'Your headline appears here', note: d.note, done: lines(d.done).length ? lines(d.done) : ['…'], next: lines(d.next), photos: d.uploads.concat(d.photos), by: 'Farah Siddiqui' };
    return '<aside class="pv"><p class="pv-h">' + ic('portal') + 'How the client sees it</p>' + (u.photos.length ? weekCard(u) : '<div class="pv-none">' + BO.empty('No photos yet', 'The cover photo leads the update.', '') + '</div>') + '<div class="pv-st">' + stageBars(d.stages, d.prev) + '</div></aside>';
  }
  function flow(code) {
    var l = byCode(code); if (!l) return projSheet(code); var d = draft(code), w = why(d, d.step + 1);
    return '<div class="vh-row"><h1>Site update · week ' + d.w + '</h1><p class="meta">' + esc(code) + ' · ' + esc(code === 'STH-2611' ? D.LIVE.name : l.name) + ' · for Fri 27 Nov</p></div>' + stepsNav(d) +
      '<div class="flow-g"><section class="cd flow"><div class="cd-b">' + stepBody(d, code) + '</div><div class="flow-f"><button type="button" class="b ghost" data-act="back"' + (d.step === 1 ? ' disabled' : '') + '>' + ic('arrow-l') + 'Back</button><span class="grow hint' + (w ? ' red' : '') + '">' + esc(w || (d.step < 4 ? 'Draft saved on this device.' : '')) + '</span>' + (d.step < 4 ? '<button type="button" class="b pri" data-act="nextStep"' + (w ? ' disabled' : '') + '>Next' + ic('arrow-r') + '</button>' : '<button type="button" class="b pri" data-act="publish"' + (w ? ' disabled' : '') + '>' + ic('send') + 'Publish to the portal</button>') + '</div></section>' + previewCard(d) + '</div>';
  }
  function repaintFlow(code) { var y = scrollY; BO.refresh(); scrollTo(0, y); }
  function shrink(file, cb) { var r = new FileReader(); r.onload = function () { var img = new Image(); img.onload = function () { var s = Math.min(1, 640 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); try { cb(c.toDataURL('image/jpeg', 0.72)); } catch (e) { cb(null); } }; img.onerror = function () { cb(null); }; img.src = r.result; }; r.readAsDataURL(file); }

  BO.view('projects', {
    title: 'Projects', nav: 'projects', skeleton: 'list',
    crumbs: function (r) { var c = [['Projects', '#/projects']]; if (r.id) c.push([r.id, '#/projects/' + r.id]); if (r.sub === 'update') c.push(['Site update', '']); return c; },
    busy: function () { return BO.route().sub === 'update'; },
    render: function (r) {
      if (r.id && r.sub === 'update') return flow(r.id);
      if (r.id) return projSheet(r.id);
      return '<div class="vh-row"><h1>Projects</h1><p class="meta">' + BO.plural(projects().length, 'project') + ' on site or in defects period' + (BO.studio !== 'All' ? ' · ' + BO.studio : '') + '</p></div>' + projList();
    },
    mount: function (r, el) { $$('tr[data-href]', el).forEach(function (tr) { tr.addEventListener('click', function (e) { if (!e.target.closest('a,button')) BO.go(tr.getAttribute('data-href')); }); }); },
    acts: {
      lead: function (b) { BO.openLead(b.getAttribute('data-id')); },
      goStep: function (b) { var d = draft(BO.route().id), n = +b.getAttribute('data-v'); if (n <= d.step || canGo(d, n)) { d.step = n; repaintFlow(); } },
      back: function () { var d = draft(BO.route().id); d.step = Math.max(1, d.step - 1); repaintFlow(); },
      nextStep: function () { var d = draft(BO.route().id); if (!canGo(d, d.step + 1)) return; d.step++; repaintFlow(); var h = $('.st-h'); if (h && innerWidth < 900) h.scrollIntoView({ block: 'start' }); },
      ph: function (b) { var d = draft(BO.route().id), v = b.getAttribute('data-v'), i = d.photos.indexOf(v); if (i >= 0) d.photos.splice(i, 1); else d.photos.push(v); repaintFlow(); },
      unup: function (b) { var d = draft(BO.route().id); d.uploads.splice(+b.getAttribute('data-i'), 1); repaintFlow(); },
      upload: function (inp) { var d = draft(BO.route().id), f = inp.files && inp.files[0]; if (!f) return; if (!/^image\//.test(f.type)) return BO.toast('That file isn’t a photo. Pick a JPG or PNG.', { bad: true }); shrink(f, function (u) { if (!u) return BO.toast('Couldn’t read that photo. Try another one.', { bad: true }); d.uploads.push(u); repaintFlow(); BO.toast('Photo added and resized for the portal.', { icon: 'photo' }); }); },
      rg: function (i) { var d = draft(BO.route().id), k = i.getAttribute('data-k'); d.stages[k] = +i.value; var o = i.nextElementSibling, pv = d.prev[k], v = d.stages[k]; o.innerHTML = v + '%' + (v > pv ? ' <em>+' + (v - pv) + '</em>' : v < pv ? ' <em class="red">' + (v - pv) + '</em>' : ''); i.closest('.rg').classList.toggle('ch', v !== pv); var pvst = $('.pv-st'); if (pvst) pvst.innerHTML = stageBars(d.stages, d.prev); },
      crew: function (i) { draft(BO.route().id).crew = +i.value || 0; },
      wx: function (b) { draft(BO.route().id).weather = b.getAttribute('data-v'); repaintFlow(); },
      uT: function (i) { var d = draft(BO.route().id); d.title = i.value; livePv(d); },
      uD: function (i) { var d = draft(BO.route().id); d.done = i.value; livePv(d); },
      uN: function (i) { var d = draft(BO.route().id); d.next = i.value; livePv(d); },
      uO: function (i) { var d = draft(BO.route().id); d.note = i.value; livePv(d); },
      useSug: function () { var d = draft(BO.route().id); d.done = KEYS.filter(function (k) { return d.stages[k] > d.prev[k]; }).map(function (k) { return STN[k] + ' now at ' + d.stages[k] + '%'; }).join('\n'); repaintFlow(); },
      publish: function () {
        var code = BO.route().id, d = draft(code); if (!canGo(d, 4)) return;
        var P = BO.P(), u = { code: code, w: d.w, day: d.day, date: '2026-11-27T18:00', at: BO.stamp(), photo: d.uploads[0] || d.photos[0], photos: d.uploads.concat(d.photos), crew: d.crew, weather: d.weather, title: d.title.trim(), done: lines(d.done), next: lines(d.next), note: d.note.trim(), by: 'Farah Siddiqui', stages: BO.clone(d.stages) };
        P.updates.unshift(u); BO.saveP(P); var l = byCode(code); if (l) { BO.log(l.id, 'Week ' + u.w + ' site update published to the client portal: ' + u.title, 'move'); if (code === 'STH-2611') { l.next = 'Weekly report due next Friday'; l.due = '2026-12-04T18:00'; } BO.save(); }
        delete drafts[code];
        BO.go('projects/' + code);
        BO.toast('Week ' + u.w + ' is live in the ' + (code === 'STH-2611' ? 'Raos’' : 'client') + ' portal.', { icon: 'send', action: code === 'STH-2611' ? ['View in portal', function () { open('portal.html#updates', '_blank'); }] : null, undo: function () { var P2 = BO.P(); P2.updates = P2.updates.filter(function (x) { return x.at !== u.at; }); BO.saveP(P2); drafts[code] = d; BO.go('projects/' + code + '/update'); } });
      }
    }
  });
  function livePv(d) { var pv = $('.pv'); if (pv) { var t = document.createElement('div'); t.innerHTML = previewCard(d); pv.replaceWith(t.firstChild); } var f = $('.flow-f .hint'), w = why(d, d.step + 1); if (f) { f.textContent = w || 'Draft saved on this device.'; f.classList.toggle('red', !!w); } var n = $('[data-act="nextStep"],[data-act="publish"]'); if (n) n.disabled = !!w; }

  /* ───────── client portal activity ───────── */
  BO.portalItems = function () {
    var P = BO.P(), out = [], coAt = P.coAt || {}, paidAt = P.paidAt || {};
    P.snags.forEach(function (s) { var st = P.snagStatus[s.id] || s.status || 'open'; out.push({ k: 'snag', id: s.id, ic: 'flag', at: s.at || s.date, title: (s.by || 'Ananya Rao') + ' reported ' + s.id + ': ' + s.title, why: [s.where, s.trade !== 'Not sure' ? s.trade : '', s.photo ? 'photo attached' : '', s.detail].filter(Boolean).join(' · '), needs: st === 'open', status: st, s: s, cta: 'Resolve' }); });
    var msgs = D.MESSAGES.concat(P.msgs).sort(function (a, b) { return new Date(a.at) - new Date(b.at); });
    msgs.forEach(function (m, i) { if (m.role !== 'Client' || !P.msgs.some(function (x) { return x.at === m.at; })) return; var answered = msgs.slice(i + 1).some(function (x) { return x.role !== 'Client'; }); out.push({ k: 'msg', id: m.at, ic: 'chat', at: m.at, title: 'Message from ' + m.from, why: m.text, needs: !answered && !P.seenStaff['m' + m.at], status: answered ? 'answered' : 'open', cta: 'Reply' }); });
    Object.keys(P.co).forEach(function (id) { var c = D.CHANGES.filter(function (x) { return x.id === id; })[0]; if (!c) return; out.push({ k: 'co', id: id, ic: 'stamp', at: coAt[id] || BO.stamp(), title: id + ' ' + P.co[id] + ' by the Raos', why: c.title + ' · ' + (c.amount >= 0 ? '+' : '−') + inr(Math.abs(c.amount)) + (c.days ? ' · +' + c.days + ' days' : ''), needs: !P.coAck[id], status: P.coAck[id] ? 'done' : 'open', decision: P.co[id], cta: P.co[id] === 'approved' ? 'Schedule' : 'Acknowledge' }); });
    Object.keys(P.paid).forEach(function (n) { var m = D.PAYMENTS.filter(function (x) { return x.n === +n; })[0]; out.push({ k: 'pay', id: n, ic: 'rupee', at: paidAt[n] || BO.stamp(), title: 'Milestone ' + n + ' paid in the portal · ' + inr(D.LIVE.value * (m ? m.pct : 0) / 100), why: (m ? m.name : '') + ' · receipt ' + P.paid[n] + ' · ' + (P.payBy && P.payBy[n] ? P.payBy[n] : 'UPI'), needs: !P.recon[n], status: P.recon[n] ? 'done' : 'open', cta: 'Reconcile' }); });
    return out.sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
  };
  var pf = 'all', replyTo = null, resolveId = null;
  function waiting() {
    var P = BO.P(), out = [];
    BO.pendingCO().forEach(function (c) { out.push({ ic: 'stamp', t: c.id + ' · ' + c.title, why: (c.amount >= 0 ? '+' : '−') + inr(Math.abs(c.amount)) + ' · sent to the Raos 18 Nov', a: 'Nudge', act: 'nudge' }); });
    BO.dueMilestones().forEach(function (m) { out.push({ ic: 'rupee', t: 'Milestone ' + m.n + ' · ' + inr(D.LIVE.value * m.pct / 100), why: m.name + ' · due ' + A.date(m.date), a: 'Remind', act: 'remind', n: m.n }); });
    D.SNAGS.filter(function (s) { return (P.snagStatus[s.id] || s.status) === 'open'; }).forEach(function (s) { out.push({ ic: 'flag', t: s.id + ' · ' + s.title, why: BO.clean(s.fix), a: 'Open', act: 'snagSeed' }); });
    return out;
  }
  function pRow(x, i) {
    var st = x.status, rp = replyTo === x.id && x.k === 'msg', rs = resolveId === x.id && x.k === 'snag';
    var badge = x.needs ? '<span class="dot-n" aria-label="Needs you"></span>' : '';
    var acts = x.needs || (x.k === 'snag' && st === 'review') ? '<button type="button" class="b sm pri" data-act="' + (x.k === 'snag' ? 'resolveOpen' : x.k === 'msg' ? 'replyOpen' : x.k === 'co' ? 'ack' : 'recon') + '" data-id="' + esc(x.id) + '">' + esc(x.cta) + '</button>' : '<span class="tg ' + (x.k === 'co' && x.decision === 'declined' ? '' : 'ok') + ' sm">' + (x.k === 'snag' ? (st === 'fixed' ? 'Fixed' : 'In review') : x.k === 'msg' ? 'Answered' : x.k === 'co' ? (x.decision === 'approved' ? 'Scheduled' : 'Noted') : 'Reconciled') + '</span>';
    var more = x.k === 'snag' && st === 'open' ? '<button type="button" class="ib" data-act="snagMore" data-id="' + esc(x.id) + '" aria-label="More for ' + esc(x.id) + '">' + ic('more') + '</button>' : '';
    var form = rp ? '<div class="inl"><label class="sr" for="rpT">Reply</label><textarea class="in" id="rpT" rows="2" placeholder="Reply to Ananya and Vikram">Thanks, ' + esc('Ananya') + '. </textarea><div class="nx-f"><button type="button" class="b pri sm" data-act="replySend" data-id="' + esc(x.id) + '">' + ic('send') + 'Send to the portal</button><button type="button" class="b ghost sm" data-act="cancelInl">Cancel</button></div></div>'
      : rs ? '<div class="inl"><label class="fl"><span>What was done · the client sees this</span><textarea class="in" id="rsT" rows="2">Checked on site by Karthik and fixed. Photo in this week’s update.</textarea></label><div class="nx-f"><button type="button" class="b pri sm" data-act="resolve" data-id="' + esc(x.id) + '">' + ic('check') + 'Mark fixed</button><button type="button" class="b sm" data-act="review" data-id="' + esc(x.id) + '">Mark in review</button><button type="button" class="b ghost sm" data-act="cancelInl">Cancel</button></div></div>' : '';
    return '<li class="pi' + (x.needs ? ' needs' : '') + '"><span class="att-i' + (x.needs ? ' red' : '') + '">' + ic(x.ic) + '</span><div class="pi-b"><b>' + badge + esc(x.title) + '</b><small>' + esc(x.why) + '</small>' + form + '</div><time>' + esc(BO.rel(x.at)) + '</time><span class="pi-a">' + acts + more + '</span></li>';
  }
  BO.view('portal', {
    title: 'Client portal', skeleton: 'list',
    render: function (r) {
      if (r.q.get('f')) pf = r.q.get('f'); var R = BO.lead('L-2290');
      if (R && !BO.inStudio(R)) return '<div class="vh-row"><h1>Client portal</h1></div>' + BO.empty('No portal clients in ' + BO.studio, 'The Rao Residence portal belongs to the Bengaluru studio.', '<button type="button" class="b" data-act="allStudios">Show all studios</button>');
      var I = BO.portalItems(), K = { all: 'All', snag: 'Snags', co: 'Approvals', pay: 'Payments', msg: 'Messages' }, map = { pay: 'pay', msg: 'msg', snag: 'snag', co: 'co' };
      var F = I.filter(function (x) { return pf === 'all' || x.k === map[pf]; }), needs = F.filter(function (x) { return x.needs || (x.k === 'snag' && x.status === 'review'); }), done = F.filter(function (x) { return needs.indexOf(x) < 0; }), W = pf === 'all' ? waiting() : [];
      if (r.q.get('compose')) { replyTo = '__new'; }
      return '<div class="vh-row"><h1>Client portal</h1><p class="meta">Rao Residence · STH-2611 · everything Ananya and Vikram do in the portal lands here</p><span class="grow"></span><a class="b" href="portal.html" target="_blank" rel="noopener">' + ic('ext') + 'Open as the client</a></div>' +
        '<div class="fbar"><div class="sg" role="group" aria-label="Filter">' + Object.keys(K).map(function (k) { var n = k === 'all' ? I.filter(function (x) { return x.needs; }).length : I.filter(function (x) { return x.k === k && x.needs; }).length; return '<button type="button" data-act="pf" data-v="' + k + '" aria-pressed="' + (pf === k) + '">' + K[k] + (n ? ' <span class="ct hot-red">' + n + '</span>' : '') + '</button>'; }).join('') + '</div><span class="grow"></span><button type="button" class="b" data-act="compose">' + ic('chat') + 'Message the Raos</button></div>' +
        (replyTo === '__new' ? '<section class="cd"><div class="cd-b"><label class="fl"><span>New message to Ananya and Vikram</span><textarea class="in" id="rpT" rows="3" placeholder="It appears under Messages in their portal"></textarea></label><div class="nx-f"><button type="button" class="b pri sm" data-act="replySend" data-id="__new">' + ic('send') + 'Send</button><button type="button" class="b ghost sm" data-act="cancelInl">Cancel</button></div></div></section>' : '') +
        '<section class="cd"><div class="cd-h"><h2>Needs you</h2><span class="meta' + (needs.length ? ' red' : '') + '">' + needs.length + '</span></div>' + (needs.length ? '<ul class="pis">' + needs.map(pRow).join('') + '</ul>' : BO.empty('Nothing from the portal needs you', 'When the Raos report a snag, approve a change, pay a milestone or write in, it shows up here with one button to finish it.', '<a class="b" href="portal.html" target="_blank" rel="noopener">Open the portal</a>')) + '</section>' +
        (W.length ? '<section class="cd"><div class="cd-h"><h2>Waiting on the client</h2><span class="meta">' + W.length + '</span></div><ul class="pis">' + W.map(function (w, i) { return '<li class="pi"><span class="att-i">' + ic(w.ic) + '</span><div class="pi-b"><b>' + esc(w.t) + '</b><small>' + esc(w.why) + '</small></div><span class="pi-a"><button type="button" class="b sm" data-act="' + w.act + '" data-n="' + (w.n || '') + '">' + w.a + '</button></span></li>'; }).join('') + '</ul></section>' : '') +
        (done.length ? '<section class="cd"><div class="cd-h"><h2>Done</h2><span class="meta">' + done.length + '</span></div><ul class="pis">' + done.map(pRow).join('') + '</ul></section>' : '');
    },
    acts: {
      allStudios: function () { BO.studio = 'All'; A.store.set('studio', 'All'); BO.refresh(); },
      pf: function (b) { pf = b.getAttribute('data-v'); BO.setQ({ f: pf === 'all' ? '' : pf, compose: '' }); BO.refresh(); },
      compose: function () { replyTo = '__new'; BO.refresh(); var t = $('#rpT'); if (t) t.focus(); },
      replyOpen: function (b) { replyTo = b.getAttribute('data-id'); resolveId = null; BO.refresh(); var t = $('#rpT'); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } },
      resolveOpen: function (b) { resolveId = b.getAttribute('data-id'); replyTo = null; BO.refresh(); var t = $('#rsT'); if (t) t.focus(); },
      cancelInl: function () { replyTo = resolveId = null; BO.setQ({ compose: '' }); BO.refresh(); },
      replySend: function (b) {
        var t = $('#rpT'), v = t.value.trim(); if (v.length < 2) { BO.toast('Write a reply first.', { bad: true }); return t.focus(); }
        var P = BO.P(), m = { from: 'Farah Siddiqui', role: 'Project manager', at: BO.stamp(), text: v }; P.msgs.push(m); if (b.getAttribute('data-id') !== '__new') P.seenStaff['m' + b.getAttribute('data-id')] = true; BO.saveP(P); BO.log('L-2290', 'Replied in the portal: ' + v.slice(0, 80), 'note'); BO.save(); replyTo = null; BO.setQ({ compose: '' }); BO.refresh();
        BO.toast('Sent. It’s under Messages in the Raos’ portal.', { icon: 'send', undo: function () { var P2 = BO.P(); P2.msgs = P2.msgs.filter(function (x) { return x.at !== m.at; }); BO.saveP(P2); BO.refresh(); } });
      },
      resolve: function (b) { var id = b.getAttribute('data-id'), note = ($('#rsT') || {}).value || 'Fixed on site.'; setSnag(id, 'fixed', note.trim()); },
      review: function (b) { setSnag(b.getAttribute('data-id'), 'review', 'Karthik will check it on site this week and reply here.'); },
      snagMore: function (b) { var id = b.getAttribute('data-id'); BO.menu(b, [{ label: 'Mark in review', icon: 'clock', run: function () { setSnag(id, 'review', 'Karthik will check it on site this week and reply here.'); } }, { label: 'Mark fixed…', icon: 'check', run: function () { resolveId = id; BO.refresh(); } }], { right: true }); },
      ack: function (b) { var id = b.getAttribute('data-id'), P = BO.P(), dec = P.co[id]; P.coAck[id] = BO.stamp(); P.msgs.push({ from: 'Farah Siddiqui', role: 'Project manager', at: BO.stamp(), text: dec === 'approved' ? 'Thanks for approving ' + id + '. It’s in next week’s programme; you’ll see it in the Friday update.' : 'Noted that you declined ' + id + '. We’ll build to the original drawing.' }); BO.saveP(P); BO.log('L-2290', id + ' ' + dec + ' by the client; ' + (dec === 'approved' ? 'scheduled' : 'acknowledged'), 'move'); BO.save(); BO.refresh();
        BO.toast(id + (dec === 'approved' ? ' scheduled and the Raos told.' : ' acknowledged.'), { undo: function () { var P2 = BO.P(); delete P2.coAck[id]; P2.msgs.pop(); BO.saveP(P2); BO.refresh(); } }); },
      recon: function (b) { var n = b.getAttribute('data-id'), P = BO.P(); P.recon[n] = BO.stamp(); BO.saveP(P); BO.log('L-2290', 'Milestone ' + n + ' payment reconciled with the bank statement', 'move'); BO.save(); BO.refresh(); BO.toast('Milestone ' + n + ' reconciled.', { icon: 'rupee', undo: function () { var P2 = BO.P(); delete P2.recon[n]; BO.saveP(P2); BO.refresh(); } }); },
      nudge: function () { var P = BO.P(), pc = BO.pendingCO(), m = { from: 'Farah Siddiqui', role: 'Project manager', at: BO.stamp(), text: 'A gentle reminder: ' + pc.map(function (c) { return c.id; }).join(' and ') + ' are waiting for your yes or no under Approvals.' }; P.msgs.push(m); BO.saveP(P); BO.refresh(); BO.toast('Reminder posted in the portal.', { icon: 'send', undo: function () { var P2 = BO.P(); P2.msgs = P2.msgs.filter(function (x) { return x.at !== m.at; }); BO.saveP(P2); BO.refresh(); } }); },
      remind: function (b) { var P = BO.P(), n = b.getAttribute('data-n'), mm = D.PAYMENTS.filter(function (x) { return x.n === +n; })[0], m = { from: 'Farah Siddiqui', role: 'Project manager', at: BO.stamp(), text: 'Milestone ' + n + ' (' + mm.name.toLowerCase() + ') is signed off and due on ' + A.date(mm.date) + '. You can pay it from the Payments tab.' }; P.msgs.push(m); BO.saveP(P); BO.refresh(); BO.toast('Payment reminder posted in the portal.', { icon: 'send', undo: function () { var P2 = BO.P(); P2.msgs = P2.msgs.filter(function (x) { return x.at !== m.at; }); BO.saveP(P2); BO.refresh(); } }); },
      snagSeed: function () { BO.toast('S-117 waits on the Raos choosing a low-height floor trap. It’s in their Snags tab.', { icon: 'flag' }); }
    }
  });
  function setSnag(id, st, note) {
    var P = BO.P(), prev = P.snagStatus[id], s = P.snags.filter(function (x) { return x.id === id; })[0], pfix = s ? s.fix : '';
    P.snagStatus[id] = st; if (s) s.fix = note; BO.saveP(P); BO.log('L-2290', 'Snag ' + id + (st === 'fixed' ? ' fixed: ' : ' in review: ') + note, 'move'); BO.save(); resolveId = null; BO.refresh();
    BO.toast(id + (st === 'fixed' ? ' marked fixed. The Raos see your note.' : ' marked in review.'), { icon: 'flag', undo: function () { var P2 = BO.P(); if (prev) P2.snagStatus[id] = prev; else delete P2.snagStatus[id]; P2.snags.forEach(function (x) { if (x.id === id) x.fix = pfix; }); BO.saveP(P2); BO.refresh(); } });
  }

  /* ───────── careers ───────── */
  var AST = [['new', 'New'], ['shortlisted', 'Shortlisted'], ['interview', 'Interview'], ['offer', 'Offer'], ['rejected', 'Not this time']];
  var NEXT = { new: ['shortlisted', 'Shortlist'], shortlisted: ['interview', 'Book interview'], interview: ['offer', 'Make offer'], offer: null, rejected: null };
  var cs = 'all';
  function stL(s) { return (AST.filter(function (x) { return x[0] === s; })[0] || [s, s])[1]; }
  function setStage(a, to) {
    var prev = a.stage; BO.setApp(a.id, { stage: to, notes: a.notes.concat([{ at: BO.stamp(), by: 'Farah', text: 'Moved to ' + stL(to) }]) }); BO.refresh(); if (BO.so.isOpen()) openApp(a.id);
    BO.toast(esc(a.name) + ' · ' + stL(to) + '.', { undo: function () { BO.setApp(a.id, { stage: prev, notes: a.notes }); BO.refresh(); if (BO.so.isOpen()) openApp(a.id); } });
  }
  function openApp(id) {
    var a = BO.apps().filter(function (x) { return x.id === id; })[0]; if (!a) return; var nx = NEXT[a.stage];
    var html = '<header class="so-h"><div class="so-hr"><span class="mono">' + a.id + '</span><span class="tg st-' + a.stage + '">' + stL(a.stage) + '</span><span class="grow"></span><button type="button" class="ib" data-act="more" aria-label="More actions" aria-haspopup="menu">' + ic('more') + '</button><button type="button" class="ib so-x" data-act="close" aria-label="Close">' + ic('x') + '</button></div><h2 id="soT">' + esc(a.name) + '</h2><p class="so-sub">' + esc(a.role) + ' · ' + esc(a.roleCity) + ' · applied ' + A.date(a.at, true) + '</p></header><div class="so-b">' +
      '<blockquote class="remark"><p>' + esc(a.proj || 'No project described.') + '</p><footer>Best project, in their words</footer></blockquote>' +
      (nx ? '<section class="nx"><h3><span class="bub">→</span>Next step · ' + nx[1] + '</h3><div class="nx-f"><button type="button" class="b pri" data-act="adv">' + nx[1] + '</button><button type="button" class="b ghost" data-act="rej">Not this time</button><span class="hint">' + (a.stage === 'new' ? 'Shortlisting sends a 30-minute call invite.' : a.stage === 'shortlisted' ? 'Books a slot with the ' + esc(a.roleCity) + ' PM.' : 'Drafts the offer letter for HR.') + '</span></div></section>' : '') +
      '<section class="so-s"><h3>Details</h3><dl class="props">' + [['Lives in', a.city], ['Experience', a.exp], ['Notice', a.notice], ['Email', a.email], ['Mobile', a.phone]].map(function (r) { return '<div class="pr"><dt>' + r[0] + '</dt><dd class="ro">' + (r[1] ? esc(r[1]) : '<span class="faint">Not given</span>') + '</dd></div>'; }).join('') + '<div class="pr"><dt>CV</dt><dd class="ro">' + (a.cv ? ic('doc') + esc(a.cv) : '<span class="faint">None attached</span>') + '</dd></div></dl></section>' +
      '<section class="so-s"><h3>Add a note</h3><textarea class="in" id="apN" rows="2" placeholder="How did the call go?"></textarea><div class="nx-f"><button type="button" class="b" data-act="note">Save note</button></div></section>' +
      '<section class="so-s"><h3>Timeline</h3><ol class="tl">' + a.notes.slice().reverse().map(function (n) { return '<li class="tl-note"><span class="tl-i">' + ic('doc') + '</span><p>' + esc(n.text) + '</p><small>' + esc(n.by) + ' · ' + A.date(n.at, true) + '</small></li>'; }).join('') + '<li class="tl-in"><span class="tl-i">' + ic('bolt') + '</span><p>Applied through the careers page</p><small>' + A.date(a.at, true) + '</small></li></ol></section></div>';
    BO.so.open(html, { acts: {
      close: BO.so.close, adv: function () { setStage(a, nx[0]); }, rej: function () { setStage(a, 'rejected'); },
      more: function (b) { BO.menu(b, AST.filter(function (s) { return s[0] !== a.stage; }).map(function (s) { return { label: 'Move to ' + s[1], run: function () { setStage(a, s[0]); } }; }), { right: true }); },
      note: function () { var t = $('#apN').value.trim(); if (!t) return $('#apN').focus(); BO.setApp(a.id, { notes: a.notes.concat([{ at: BO.stamp(), by: 'Farah', text: t }]) }); openApp(a.id); BO.toast('Note saved.'); }
    } });
  }
  BO.openApp = openApp;
  BO.view('careers', {
    title: 'Careers', skeleton: 'list',
    render: function (r) {
      if (r.q.get('s')) cs = r.q.get('s'); var all = BO.apps(), V = all.filter(function (a) { return cs === 'all' || a.stage === cs; });
      return '<div class="vh-row"><h1>Careers applications</h1><p class="meta">' + all.length + ' applications · ' + D.JOBS.length + ' open roles</p><span class="grow"></span><a class="b" href="careers.html" target="_blank" rel="noopener">' + ic('ext') + 'Careers page</a></div>' +
        '<div class="fbar"><div class="sg" role="group" aria-label="Stage"><button type="button" data-act="cs" data-v="all" aria-pressed="' + (cs === 'all') + '">All <span class="ct">' + all.length + '</span></button>' + AST.map(function (s) { var n = all.filter(function (a) { return a.stage === s[0]; }).length; return '<button type="button" data-act="cs" data-v="' + s[0] + '" aria-pressed="' + (cs === s[0]) + '">' + s[1] + ' <span class="ct' + (s[0] === 'new' && n ? ' hot-blue' : '') + '">' + n + '</span></button>'; }).join('') + '</div></div>' +
        (V.length ? '<div class="tw"><table class="tbl"><thead><tr><th>Applicant</th><th>Role</th><th>Experience</th><th>Notice</th><th>Received</th><th>Stage</th><th class="act"><span class="sr">Action</span></th></tr></thead><tbody>' + V.map(function (a) { var nx = NEXT[a.stage]; return '<tr data-app="' + a.id + '" class="' + (a.fresh && a.stage === 'new' ? 'fresh' : '') + '"><td><b class="nm">' + esc(a.name) + '</b><small>' + a.id + ' · ' + esc(a.city || '') + '</small></td><td>' + esc(a.role) + '<small>' + esc(a.roleCity) + '</small></td><td>' + esc(a.exp || '') + '</td><td>' + esc(a.notice || '') + '</td><td>' + A.date(a.at) + '</td><td><span class="tg st-' + a.stage + '">' + stL(a.stage) + '</span></td><td class="act">' + (nx ? '<button type="button" class="b sm" data-act="adv" data-id="' + a.id + '">' + nx[1] + '</button>' : '') + '<button type="button" class="ib" data-act="more" data-id="' + a.id + '" aria-label="More for ' + esc(a.name) + '">' + ic('more') + '</button></td></tr>'; }).join('') + '</tbody></table></div>'
          : '<section class="cd">' + BO.empty('No applications here', cs === 'new' ? 'Every new application has been looked at. New ones from the careers page land here.' : 'Nobody is at this stage right now.', '<button type="button" class="b" data-act="cs" data-v="all">Show all</button>') + '</section>');
    },
    mount: function (r, el) { $$('tr[data-app]', el).forEach(function (tr) { tr.addEventListener('click', function (e) { if (!e.target.closest('button,a')) openApp(tr.getAttribute('data-app')); }); }); },
    acts: {
      cs: function (b) { cs = b.getAttribute('data-v'); BO.setQ({ s: cs === 'all' ? '' : cs }); BO.refresh(); },
      adv: function (b) { var a = BO.apps().filter(function (x) { return x.id === b.getAttribute('data-id'); })[0]; setStage(a, NEXT[a.stage][0]); },
      more: function (b) { var a = BO.apps().filter(function (x) { return x.id === b.getAttribute('data-id'); })[0]; BO.menu(b, [{ label: 'Open application', icon: 'arrow-r', run: function () { openApp(a.id); } }, { sep: 1 }].concat(AST.filter(function (s) { return s[0] !== a.stage; }).map(function (s) { return { label: 'Move to ' + s[1], run: function () { setStage(a, s[0]); } }; })), { right: true }); }
    }
  });
})();
