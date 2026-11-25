/* Fieldwise — admin depth: team & roles (permissions matrix, territories, hours), settings (sources, distribution, pipeline,
   custom fields, templates, SLAs, export), projects (towers, units, hold/block with auto-release, price lists, cost sheets) and the rate card. */
(function () {
  'use strict';
  var CK = window.CK, esc = CK.esc, ic = CK.ic;
  function S() { return CK.S(); }

  /* ---------- extra seed, added once to an existing store ---------- */
  var PERMS = [
    ['Leads', [['leads.view', 'See all leads'], ['leads.own', 'See own leads'], ['leads.create', 'Create leads'], ['leads.assign', 'Reassign leads'], ['leads.export', 'Export leads']]],
    ['Calling', [['calling.use', 'Work calling queues'], ['calling.build', 'Build campaign lists']]],
    ['Inventory', [['props.view', 'See inventory'], ['props.create', 'Add listings'], ['props.edit', 'Edit listings and prices'], ['props.import', 'Bulk import'], ['props.hold', 'Hold and block units']]],
    ['Field', [['verify', 'Verify listings'], ['trips.plan', 'Plan trips'], ['trips.update', 'Update trips and outcomes']]],
    ['Deals', [['deals.view', 'See deals'], ['deals.edit', 'Move deals'], ['deals.money', 'Record collections']]],
    ['Partners', [['partners.view', 'See partners'], ['partners.pay', 'Pay partner commission']]],
    ['Admin', [['reports', 'See reports'], ['users', 'Manage users and roles'], ['settings', 'Change settings'], ['export', 'Export data']]]
  ];
  CK.PERMS = PERMS;
  var DEF = {
    admin: '*',
    manager: ['leads.view', 'leads.own', 'leads.create', 'leads.assign', 'leads.export', 'calling.use', 'calling.build', 'props.view', 'props.create', 'props.edit', 'props.import', 'props.hold', 'verify', 'trips.plan', 'trips.update', 'deals.view', 'deals.edit', 'deals.money', 'partners.view', 'reports', 'export'],
    telecaller: ['leads.own', 'leads.create', 'calling.use', 'props.view', 'props.create'],
    field: ['leads.own', 'props.view', 'props.create', 'props.hold', 'verify', 'trips.update', 'deals.view'],
    partner: ['leads.own']
  };
  CK.ensure = function () {
    var s = S(); if (!s) return; if (s.stageNames) s.stageNames.forEach(function (n, i) { if (CK.LEAD_STAGES[i]) CK.LEAD_STAGES[i].label = n; }); if (s.ext === 2) return;
    var r = CK.rng(99), now = CK.now(), today = CK.dayStart(now), DAY = CK.DAY;
    var terr = { A3: ['VV', 'SN', 'AN', 'SE'], A4: ['G1', 'G2', 'CR', 'PP'], A5: ['S42', 'S43', 'S54', 'S57', 'S65'], A6: ['VV', 'SN', 'AN', 'SE', 'VK'], A7: ['G1', 'G2', 'CR', 'LN', 'DC'], A8: ['S42', 'S43', 'S54', 'S57', 'S65'], A9: ['HK', 'SV', 'PP', 'MN', 'SK'], A10: ['GP', 'HK', 'SV', 'JB', 'DC'] };
    var langs = { A1: 'Hindi, English', A2: 'Hindi, English, Punjabi', A3: 'English, Malayalam, Hindi', A4: 'Hindi, Urdu, English', A5: 'Punjabi, Hindi', A6: 'Hindi, English', A7: 'Hindi, Haryanvi', A8: 'Hindi, English', A9: 'Hindi, English', A10: 'Hindi, Garhwali' };
    s.agents.forEach(function (a, i) { a.active = true; a.email = a.name.split(' ')[0].toLowerCase() + '@amaltas.example'; a.terr = terr[a.id] || []; a.langs = langs[a.id]; a.hours = a.role === 'field' ? '10:00–19:00 · Mon–Sat' : '09:30–18:30 · Mon–Sat'; a.cap = a.role === 'telecaller' ? 60 : a.role === 'field' ? 8 : 0; a.seen = now - CK.int(r, 2, 300) * 6e4; a.since = 2021 + (i % 5); });
    s.invites = [{ email: 'farah.kidwai@amaltas.example', role: 'telecaller', at: now - 2 * DAY, by: 'A1' }];
    s.perm = {}; Object.keys(DEF).forEach(function (k) { s.perm[k] = DEF[k] === '*' ? '*' : DEF[k].slice(); }); s.permOv = { A9: { 'trips.plan': true } };
    s.sources = [{ id: 'Basera', on: true, cost: 18000, sla: 15 }, { id: 'KeyHaat', on: true, cost: 12000, sla: 15 }, { id: 'Website', on: true, cost: 0, sla: 15 }, { id: 'Website chat', on: true, cost: 0, sla: 10 }, { id: 'WhatsApp', on: true, cost: 0, sla: 10 }, { id: 'Walk-in', on: true, cost: 0, sla: 30 }, { id: 'Partner', on: true, cost: 0, sla: 60 }, { id: 'Launch site', on: true, cost: 0, sla: 15 }];
    s.rules = [
      { id: 'R1', name: 'West colonies → Pooja', when: 'Areas: Vasant Vihar, Shanti Niketan, Anand Niketan, Safdarjung Encl.', mode: 'Fixed', to: ['A3'], on: true, hits: 41 },
      { id: 'R2', name: 'GK, CR Park, Panchsheel → Imran', when: 'Areas: GK I, GK II, CR Park, Panchsheel Park', mode: 'Fixed', to: ['A4'], on: true, hits: 37 },
      { id: 'R3', name: 'Gurugram sectors → Simran', when: 'Region: Gurugram', mode: 'Fixed', to: ['A5'], on: true, hits: 22 },
      { id: 'R4', name: 'Punjabi speakers → Simran', when: 'Language asked for: Punjabi', mode: 'Fixed', to: ['A5'], on: true, hits: 6 },
      { id: 'R5', name: 'Everyone else', when: 'Anything not matched above', mode: 'Round-robin, least loaded first', to: ['A3', 'A4', 'A5'], on: true, hits: 58 }
    ];
    s.fields = [
      { id: 'F1', on: 'lead', label: 'Office location', type: 'Text' }, { id: 'F2', on: 'lead', label: 'Best time to visit', type: 'Choice', opts: ['Weekday mornings', 'Weekday evenings', 'Weekends'] },
      { id: 'F3', on: 'lead', label: 'Cars to park', type: 'Number' }, { id: 'F4', on: 'property', label: 'Lift', type: 'Yes / no' }, { id: 'F5', on: 'property', label: 'Servant room', type: 'Yes / no' }, { id: 'F6', on: 'property', label: 'Plot size (sq yd)', type: 'Number' }
    ];
    s.leads.forEach(function (L, i) { L.cf = {}; if (i % 3 === 0) L.cf.F1 = ['Cyber City', 'Saket District Centre', 'Nehru Place', 'Connaught Place', 'Okhla Phase III'][i % 5]; if (i % 4 === 0) L.cf.F2 = ['Weekday mornings', 'Weekday evenings', 'Weekends'][i % 3]; });
    s.tpl = [
      { id: 'T1', ch: 'wa', name: 'Homes that fit', body: 'Hi {{first_name}}, here are {{count}} homes that fit your brief: {{list}}. Shall we see them on {{day}}? — {{agent}}, Amaltas Estates', uses: 212 },
      { id: 'T2', ch: 'wa', name: 'Visit confirmation', body: 'Hi {{first_name}}, confirming your visit {{day}} at {{time}} with {{field_agent}}. First stop: {{first_stop}}. Please carry an ID for the society gate.', uses: 164 },
      { id: 'T3', ch: 'wa', name: 'Owner — visit feedback', body: 'Namaste {{owner}} ji, we showed your {{config}} at {{plot}} today. {{outcome}} — Amaltas Estates', uses: 131 },
      { id: 'T4', ch: 'wa', name: 'Owner — update your listing', body: 'Namaste {{owner}} ji, is {{plot}} still available at {{price}}? Update it here in one minute: {{link}}', uses: 88 },
      { id: 'T5', ch: 'sms', name: 'Missed call', body: 'Amaltas Estates tried to reach you about homes in {{area}}. Call back any time 9am–7pm. -AMLTS', uses: 402, dlt: 'Registered' },
      { id: 'T6', ch: 'sms', name: 'Visit reminder', body: 'Reminder: site visit {{day}} {{time}} with {{field_agent}}. Reply 1 to confirm. -AMLTS', uses: 255, dlt: 'Registered' }
    ];
    s.sla = [{ id: 'S1', name: 'First call on a new lead', min: 15, met: 86 }, { id: 'S2', name: 'Matches sent after the brief', min: 120, met: 79 }, { id: 'S3', name: 'Visit feedback to the owner', min: 24 * 60, met: 91 }, { id: 'S4', name: 'Check on a new listing', min: 48 * 60, met: 72 }, { id: 'S5', name: 'Reply on WhatsApp', min: 10, met: 83 }];
    // projects (new launches) with towers and units
    s.projects = [mkProject('PJ1', 'Kesar Greens Phase 2', 'S65', 'Sector 65, Gurugram', 'New launch · RERA registered', 7800, ['A', 'B'], 14, 4, r, now), mkProject('PJ2', 'Palash Residency', 'S54', 'Sector 54, Gurugram', 'Ready to move · OC received', 11200, ['T1', 'T2'], 12, 4, r, now)];
    s.convos = seedConvos(r, now);
    s.imports = [{ id: 'IM-41', at: now - 6 * DAY, file: 'Partner sheet · CR Park', rows: 18, added: 5, refreshed: 9, skipped: 4, by: 'A2' }, { id: 'IM-40', at: now - 13 * DAY, file: 'Amaltas desk sheet · November week 2', rows: 31, added: 7, refreshed: 19, skipped: 5, by: 'A2' }];
    s.ext = 2; CK.save();
  };
  function mkProject(id, name, area, where, status, rate, towers, floors, per, r, now) {
    var units = [];
    towers.forEach(function (t) { for (var f = floors; f >= 1; f--) for (var u = 1; u <= per; u++) {
      var bhk = u === 1 || u === 4 ? 3 : u === 2 ? 4 : 2, sqft = bhk === 4 ? 2650 : bhk === 3 ? 1980 : 1380;
      var x = r(), st = x < .5 ? 'sold' : x < .78 ? 'available' : x < .88 ? 'hold' : 'blocked';
      var un = { id: id + '-' + t + '-' + f + '0' + u, t: t, f: f, n: f + '0' + u, bhk: bhk, sqft: sqft, facing: u === 1 ? 'Park facing' : u === 4 ? 'Corner' : 'Inner', st: st };
      if (st === 'hold') { un.by = CK.pick(r, ['A8', 'A2', 'PT4']); un.lead = 'L-20' + CK.int(r, 10, 79); un.until = now + CK.int(r, -3, 40) * 36e5; }
      if (st === 'blocked') { un.by = 'A8'; un.lead = 'L-20' + CK.int(r, 10, 79); un.token = 200000; }
      units.push(un);
    } });
    return { id: id, name: name, area: area, where: where, status: status, rate: rate, towers: towers, floors: floors, per: per, units: units, price: { floorRise: 45, floorFrom: 5, plc: { 'Park facing': 250, 'Corner': 200, 'Inner': 0 }, parking: 450000, club: 200000, ifms: 100, gst: 5 }, by: 'A8', photo: id === 'PJ1' ? 'ext-07' : 'ext-20' };
  }
  function seedConvos(r, now) {
    var names = ['Kavya Menon', 'Rohit Bajaj', 'Sara Thomas', 'Akhil Verma', 'Nidhi Rastogi', 'Faisal Khan', 'Ishaan Kapoor', 'Meera Pillai', 'Tarun Sethi', 'Gauri Joshi', 'Arjun Nanda', 'Pallavi Dsouza'];
    var opener = [
      ['Hi, is the 3 BHK on the GK II listing still available?', 'wa'], ['Looking for a 2 BHK in Hauz Khas under 70k, semi-furnished', 'web'], ['Can I see the Vasant Vihar floor this Saturday?', 'wa'], ['kitne ka hai Sector 54 wala 3 bhk?', 'web'],
      ['We have a labrador, are pets OK in Panchsheel?', 'wa'], ['Need office space ~2000 sq ft near Saket', 'web'], ['Is brokerage one month?', 'wa'], ['kal subah visit ho sakta hai CR Park?', 'wa'],
      ['Price negotiable on SK-279?', 'web'], ['I want to list my flat in Green Park for rent', 'wa'], ['Ready to move 4 BHK in Sector 65, budget 3 Cr', 'web'], ['Following up on yesterday’s visit, we liked the second one', 'wa']
    ];
    return names.map(function (n, i) {
      var st = i < 3 ? 'open' : i < 6 ? 'bot' : i < 9 ? 'mine' : 'resolved', at = now - (i * 37 + 4) * 6e4, ch = opener[i][1];
      var msgs = [{ from: 'them', text: opener[i][0], at: at }];
      if (ch === 'web' || st === 'bot') msgs.push({ from: 'bot', text: i % 2 ? 'I found 4 homes that fit. Want me to book a visit slot?' : 'Happy to help! Which area and budget are you thinking of?', at: at + 2e4 });
      if (st === 'mine' || st === 'resolved') msgs.push({ from: 'us', text: 'Hi ' + n.split(' ')[0] + ', Pooja from Amaltas here. Yes — sharing the details now.', at: at + 4 * 6e4, by: 'A3' });
      if (st === 'resolved') msgs.push({ from: 'them', text: 'Thanks, see you tomorrow!', at: at + 9 * 6e4 });
      return { id: 'CV-' + (300 + i), name: n, ch: ch, phone: '9' + (7 + i % 3) + (1 + i % 8) + 'XX XX' + (120 + i * 37), st: st, who: st === 'mine' || st === 'resolved' ? 'A3' : st === 'open' ? null : null, unread: st === 'open' ? 1 + i % 2 : 0, msgs: msgs, page: ch === 'web' ? ['/rent/hauz-khas', '/buy/sector-54-gurugram', '/commercial/saket', '/listing/SK-279', '/new-projects/sector-65'][i % 5] : null, lead: null };
    });
  }

  CK.releaseHolds = function () { var s = S(); if (!s) return; var now = CK.now(), n = 0; s.props.forEach(function (p) { if (p.status === 'hold' && p.holdUntil && p.holdUntil < now) { var L = p.holdFor ? CK.lead(p.holdFor) : null; p.status = 'available'; p.holdFor = null; p.holdUntil = null; n++; CK.audit('Hold auto-released', p.code, L ? 'was held for ' + L.name : ''); } }); if (n) CK.save(); };

  /* ---------- permissions now come from the editable matrix ---------- */
  var MAP = { 'leads.create': 'leads.create', 'props.create': 'props.create', 'props.edit': 'props.edit', 'verify': 'verify', 'trips.plan': 'trips.plan', 'trips.update': 'trips.update', 'deals.edit': 'deals.edit', 'partners.pay': 'partners.pay' };
  CK.can = function (p) {
    var s = S(), role = CK.role(); if (!s || !s.perm) return true; var set = s.perm[role]; var me = CK.me();
    var ov = s.permOv && me && s.permOv[me.id]; if (ov && ov[p] != null && role !== 'partner') return ov[p];
    return set === '*' || (set || []).indexOf(MAP[p] || p) >= 0;
  };

  /* ============ TEAM & ROLES ============ */
  var TV = { tab: 'people', role: 'telecaller', q: '' };
  CK.V.team = {
    title: 'Team & roles',
    render: function () {
      CK.ensure(); var s = S();
      var tabs = [['people', 'People', s.agents.length], ['roles', 'Roles & permissions'], ['territory', 'Territories'], ['invites', 'Invites', s.invites.length]];
      var head = '<div class="ph"><div><h1>Team &amp; roles</h1><p class="muted">' + s.agents.filter(function (a) { return a.active; }).length + ' active people · ' + s.partners.length + ' partner logins · roles decide what each person sees; a person can be given one extra permission without a new role</p></div><div class="ph-a"><button type="button" class="btn primary" data-tm="invite">' + ic('plus', 16) + 'Invite someone</button></div></div>';
      var tb = '<div class="tabs" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" data-ttab="' + t[0] + '" aria-selected="' + (TV.tab === t[0]) + '">' + t[1] + (t[2] != null ? '<span class="cnt">' + t[2] + '</span>' : '') + '</button>'; }).join('') + '</div>';
      var body = TV.tab === 'roles' ? roles(s) : TV.tab === 'territory' ? territory(s) : TV.tab === 'invites' ? invites(s) : people(s);
      return head + tb + body;
    },
    mount: function (el) {
      el.addEventListener('click', function (e) {
        var t = e.target.closest('[data-ttab],[data-tm],[data-prole],[data-pk],[data-user]'); if (!t) return; var s = S();
        if (t.dataset.ttab) { TV.tab = t.dataset.ttab; CK.render(); return; }
        if (t.dataset.prole) { TV.role = t.dataset.prole; CK.render(); return; }
        if (t.dataset.user) { CK.peek('user', t.dataset.user); return; }
        if (t.dataset.pk) { var k = t.dataset.pk, set = s.perm[TV.role]; if (set === '*') { CK.toast('Admin always has every permission', { icon: 'flag' }); return; } var i = set.indexOf(k), on = i < 0; if (on) set.push(k); else set.splice(i, 1); CK.audit('Changed role permission', CK.ROLE_NAME[TV.role], (on ? '+ ' : '− ') + k); CK.emit('settings'); CK.toast((on ? 'Granted' : 'Removed') + ' for every ' + CK.ROLE_NAME[TV.role], { undo: function () { if (on) set.splice(set.indexOf(k), 1); else set.push(k); CK.emit('settings'); } }); return; }
        var a = t.dataset.tm;
        if (a === 'invite') inviteForm();
        if (a === 'revoke') { var iv = s.invites[+t.dataset.i]; s.invites.splice(+t.dataset.i, 1); CK.audit('Revoked invite', iv.email); CK.emit('settings'); CK.toast('Invite revoked', { undo: function () { s.invites.splice(+t.dataset.i, 0, iv); CK.emit('settings'); } }); }
      });
      el.addEventListener('input', function (e) { if (e.target.matches('[data-tq]')) { TV.q = e.target.value; clearTimeout(TV.t); TV.t = setTimeout(function () { var p = e.target.selectionStart; CK.render(); var i = document.querySelector('[data-tq]'); i.focus(); i.setSelectionRange(p, p); }, 150); } });
    }
  };
  function load(a) { var s = S(); return { leads: s.leads.filter(function (L) { return (L.owner === a.id || L.field === a.id) && L.stage !== 'lost'; }).length, tasks: s.tasks.filter(function (t) { return !t.done && t.who === a.id; }).length }; }
  function people(s) {
    var list = s.agents.filter(function (a) { return !TV.q || (a.name + a.title + a.terr.map(function (x) { return CK.area(x).short; }).join(' ')).toLowerCase().indexOf(TV.q.toLowerCase()) >= 0; });
    return '<div class="fbar"><label class="search"><span class="sr">Search people</span>' + ic('search', 15) + '<input data-tq value="' + esc(TV.q) + '" placeholder="Name, role or colony"></label></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Person</th><th>Role</th><th class="hide-m">Territory</th><th class="hide-m">Hours</th><th class="num">Open work</th><th class="hide-m">Last seen</th><th>Status</th></tr></thead><tbody>' + list.map(function (a) { var l = load(a); return '<tr><td><button type="button" class="lead-cell" data-user="' + a.id + '">' + CK.av(a) + '<span><b>' + esc(a.name) + '</b><small>' + esc(a.email) + '</small></span></button></td><td>' + CK.pill(CK.ROLE_NAME[a.role], { admin: 'accent', manager: 'violet', telecaller: 'blue', field: 'green' }[a.role]) + '</td><td class="hide-m"><span class="tags">' + (a.terr.length ? a.terr.slice(0, 3).map(function (x) { return '<span class="tag">' + esc(CK.area(x).short) + '</span>'; }).join('') + (a.terr.length > 3 ? '<span class="muted sm">+' + (a.terr.length - 3) + '</span>' : '') : '<span class="muted sm">All areas</span>') + '</span></td><td class="hide-m sm">' + esc(a.hours) + '</td><td class="num">' + l.leads + ' leads · ' + l.tasks + ' tasks</td><td class="hide-m muted sm">' + CK.ago(a.seen) + '</td><td>' + (a.active ? CK.pill('Active', 'green') : CK.pill('Deactivated', 'grey')) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function roles(s) {
    var set = s.perm[TV.role], roles = ['admin', 'manager', 'telecaller', 'field', 'partner'];
    var people = s.agents.filter(function (a) { return a.role === TV.role; });
    return '<div class="roles-g"><nav class="role-list" aria-label="Roles">' + roles.map(function (r) { var n = r === 'partner' ? s.partners.length : s.agents.filter(function (a) { return a.role === r; }).length, cnt = s.perm[r] === '*' ? 'all' : s.perm[r].length; return '<button type="button" data-prole="' + r + '" class="' + (TV.role === r ? 'on' : '') + '" aria-pressed="' + (TV.role === r) + '"><b>' + CK.ROLE_NAME[r] + '</b><small>' + n + ' ' + (n === 1 ? 'person' : 'people') + ' · ' + cnt + ' permissions</small></button>'; }).join('') + '</nav><section class="panel"><div class="panel-h"><h2>' + CK.ROLE_NAME[TV.role] + '</h2><span class="muted sm">Changes apply to everyone with this role at once · “View as” in the sidebar shows the result</span></div>' +
      PERMS.map(function (g) { return '<div class="pgroup"><h3>' + g[0] + '</h3>' + g[1].map(function (p) { var on = set === '*' || set.indexOf(p[0]) >= 0; return '<button type="button" class="prow' + (on ? ' on' : '') + '" data-pk="' + p[0] + '" role="switch" aria-checked="' + on + '"' + (set === '*' ? ' aria-disabled="true"' : '') + '><span>' + esc(p[1]) + '<small class="mono">' + p[0] + '</small></span><span class="sw" aria-hidden="true"></span></button>'; }).join('') + '</div>'; }).join('') +
      (people.length ? '<p class="muted sm" style="margin-top:10px">People with this role: ' + people.map(function (a) { return esc(a.name) + (s.permOv[a.id] ? ' (has ' + Object.keys(s.permOv[a.id]).length + ' personal override)' : ''); }).join(', ') + '</p>' : '') + '</section></div>';
  }
  function territory(s) {
    var areas = CK.AREAS;
    var flds = s.agents.filter(function (a) { return a.role === 'field' || a.role === 'telecaller'; });
    return '<p class="muted sm mtop">Territories drive lead routing, trip suggestions and who gets a listing’s re-check. Tap a cell to assign or remove.</p><div class="tbl-wrap"><table class="tbl terr"><thead><tr><th>Area</th>' + flds.map(function (a) { return '<th title="' + esc(a.name) + '">' + CK.av(a, 's') + '<span class="sr">' + esc(a.name) + '</span></th>'; }).join('') + '<th class="num">Listings</th></tr></thead><tbody>' + areas.map(function (ar) { var n = s.props.filter(function (p) { return p.area === ar.id && p.status !== 'let' && p.status !== 'sold'; }).length; var cov = flds.filter(function (a) { return a.terr.indexOf(ar.id) >= 0; }).length; return '<tr' + (cov ? '' : ' class="gap"') + '><td>' + esc(ar.name) + (cov ? '' : ' <span class="pill t-amber">No one covers it</span>') + '</td>' + flds.map(function (a) { var on = a.terr.indexOf(ar.id) >= 0; return '<td><button type="button" class="tcell' + (on ? ' on' : '') + '" data-ter="' + a.id + ':' + ar.id + '" aria-pressed="' + on + '" aria-label="' + esc(a.name + ' covers ' + ar.name) + '">' + (on ? ic('check', 13) : '') + '</button></td>'; }).join('') + '<td class="num">' + n + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-ter]'); if (!b) return; var k = b.dataset.ter.split(':'), a = CK.agent(k[0]), i = a.terr.indexOf(k[1]); if (i >= 0) a.terr.splice(i, 1); else a.terr.push(k[1]); CK.audit('Changed territory', a.name, (i >= 0 ? '− ' : '+ ') + CK.area(k[1]).short); CK.emit('settings'); });
  function invites(s) {
    return '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Email</th><th>Role</th><th>Sent</th><th></th></tr></thead><tbody>' + (s.invites.length ? s.invites.map(function (v, i) { return '<tr><td>' + esc(v.email) + '</td><td>' + CK.pill(CK.ROLE_NAME[v.role], 'blue') + '</td><td class="muted sm">' + CK.ago(v.at) + ' by ' + esc(CK.agent(v.by).name.split(' ')[0]) + '</td><td class="num"><button type="button" class="btn sm ghost" data-tm="revoke" data-i="' + i + '">Revoke</button></td></tr>'; }).join('') : '<tr><td colspan="4">' + CK.empty('No pending invites', 'Invite a teammate and they get a sign-in link with their role already set.') + '</td></tr>') + '</tbody></table></div>';
  }
  function inviteForm() {
    var m = CK.modal('<h2 id="modal-t">Invite someone</h2><p class="muted sm">They get a sign-in link; the role decides what they see on day one.</p><div class="fld"><label for="iv-n">Full name</label><input id="iv-n" autocomplete="off"></div><div class="fld"><label for="iv-e">Work email</label><input id="iv-e" type="email" autocomplete="off" placeholder="name@amaltas.example"></div><div class="f2"><div class="fld"><label for="iv-r">Role</label><select id="iv-r"><option value="telecaller">Telecaller</option><option value="field">Field agent</option><option value="manager">Sales manager</option><option value="admin">Admin</option></select></div><div class="fld"><label for="iv-a">Territory</label><select id="iv-a"><option value="">All areas</option>' + CK.AREAS.map(function (a) { return '<option value="' + a.id + '">' + esc(a.name) + '</option>'; }).join('') + '</select></div></div><p class="err" id="iv-err" role="alert"></p><div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn primary" id="iv-ok">Send invite</button></div>');
    m.querySelector('#iv-ok').onclick = function () { var e = m.querySelector('#iv-e'), n = m.querySelector('#iv-n'); if (n.value.trim().length < 2) { n.setAttribute('aria-invalid', 'true'); m.querySelector('#iv-err').textContent = 'Add their name.'; return; } if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.value)) { e.setAttribute('aria-invalid', 'true'); m.querySelector('#iv-err').textContent = 'That email doesn’t look complete — it needs an @ and a domain.'; return; } S().invites.unshift({ email: e.value.trim(), name: n.value.trim(), role: m.querySelector('#iv-r').value, at: CK.now(), by: CK.me().id }); CK.audit('Invited user', e.value.trim(), CK.ROLE_NAME[m.querySelector('#iv-r').value]); CK.emit('settings'); CK.closeModal(); TV.tab = 'invites'; CK.render(); CK.toast('Invite sent to ' + e.value.trim()); };
  }
  CK.D.user = {
    render: function (id) {
      CK.ensure(); var a = CK.agent(id), s = S(), l = load(a), ov = s.permOv[id] || {};
      return '<header class="dh"><div class="dh-top">' + CK.av(a, 'l') + '<div class="grow"><h2 id="drawer-t">' + esc(a.name) + '</h2><p class="muted sm">' + esc(a.title) + ' · ' + esc(a.email) + ' · since ' + a.since + '</p></div><button type="button" class="ibtn" data-close-drawer aria-label="Close panel">' + ic('x', 16) + '</button></div><div class="pills">' + (a.active ? CK.pill('Active', 'green') : CK.pill('Deactivated', 'grey')) + CK.pill(CK.ROLE_NAME[a.role], 'blue') + '</div></header><div class="dbody">' +
        '<section class="card">' + CK.kv([['Role', '<button type="button" class="ed" data-ua="role">' + CK.ROLE_NAME[a.role] + '</button>'], ['Territory', '<span class="tags">' + a.terr.map(function (x) { return '<span class="tag">' + esc(CK.area(x).short) + '</span>'; }).join('') + '<button type="button" class="tag add" data-ua="terr">' + ic('plus', 12) + 'Add area</button></span>'], ['Languages', esc(a.langs)], ['Working hours', '<button type="button" class="ed" data-ua="hours">' + esc(a.hours) + '</button>'], ['Daily capacity', a.cap ? a.cap + (a.role === 'field' ? ' visits' : ' calls') : '—'], ['Open work', l.leads + ' leads · ' + l.tasks + ' tasks']]) + '</section>' +
        '<section class="card"><div class="card-h"><h3>Personal overrides</h3><span class="muted sm">on top of the ' + CK.ROLE_NAME[a.role] + ' role</span></div>' + (Object.keys(ov).length ? Object.keys(ov).map(function (k) { return '<div class="row-b">' + CK.pill(ov[k] ? 'Granted' : 'Removed', ov[k] ? 'green' : 'red') + '<span class="mono sm">' + k + '</span><span class="grow"></span><button type="button" class="btn sm ghost" data-ua="ovx" data-k="' + k + '">Remove</button></div>'; }).join('') : '<p class="muted sm">None. Everything comes from the role.</p>') + '<div class="btnrow"><button type="button" class="btn sm" data-ua="ov">' + ic('plus', 14) + 'Add an override</button></div></section>' +
        '<section class="card"><div class="card-h"><h3>Access</h3></div><div class="btnrow">' + (a.id === 'A1' ? '<p class="muted sm">The founder account can’t be deactivated.</p>' : a.active ? '<button type="button" class="btn danger-ghost" data-ua="off">Deactivate</button>' : '<button type="button" class="btn" data-ua="on">Reactivate</button>') + '<button type="button" class="btn ghost" data-ua="reset">Send a new sign-in link</button></div>' + (!a.active ? '<p class="muted sm">Their ' + l.leads + ' leads stay with them until you reassign; nobody new is routed to them.</p>' : '') + '</section></div>';
    },
    mount: function (el, id) {
      el.onclick = function (e) {
        var b = e.target.closest('[data-ua]'); if (!b) return; var a = CK.agent(id), s = S(), k = b.dataset.ua;
        if (k === 'off' || k === 'on') { var lc = load(a).leads; CK.confirm(k === 'off' ? 'Deactivate ' + a.name + '?' : 'Reactivate ' + a.name + '?', k === 'off' ? 'They can’t sign in and get no new leads. Their ' + lc + ' open leads stay put until you reassign them.' : 'They can sign in again with their role and territory.', k === 'off' ? 'Deactivate' : 'Reactivate', function () { a.active = k === 'on'; CK.audit(k === 'off' ? 'Deactivated user' : 'Reactivated user', a.name); CK.emit('settings'); CK.toast(a.name + (k === 'off' ? ' deactivated' : ' reactivated'), { undo: function () { a.active = k !== 'on'; CK.emit('settings'); } }); }, k === 'off' ? 'danger' : 'primary'); }
        if (k === 'reset') CK.toast('Sign-in link sent to ' + a.email);
        if (k === 'role') CK.menu(b, ['admin', 'manager', 'telecaller', 'field'].map(function (r) { return { label: CK.ROLE_NAME[r], id: r, on: a.role === r }; }), function (it) { var old = a.role; a.role = it.id; CK.audit('Changed role', a.name, CK.ROLE_NAME[old] + ' → ' + it.label); CK.emit('settings'); CK.toast(a.name + ' is now ' + it.label, { undo: function () { a.role = old; CK.emit('settings'); } }); });
        if (k === 'terr') CK.menu(b, CK.AREAS.filter(function (x) { return a.terr.indexOf(x.id) < 0; }).map(function (x) { return { label: x.name, id: x.id }; }), function (it) { a.terr.push(it.id); CK.audit('Changed territory', a.name, '+ ' + it.label); CK.emit('settings'); });
        if (k === 'hours') CK.menu(b, ['09:30–18:30 · Mon–Sat', '10:00–19:00 · Mon–Sat', '11:00–20:00 · Tue–Sun', '10:00–17:00 · Mon–Fri'].map(function (h) { return { label: h, on: a.hours === h }; }), function (it) { a.hours = it.label; CK.emit('settings'); CK.toast('Working hours updated — routing skips them outside these hours'); });
        if (k === 'ov') { var items = []; PERMS.forEach(function (g) { g[1].forEach(function (p) { items.push({ label: p[1], id: p[0], hint: g[0] }); }); }); CK.menu(b, [{ head: 'Grant one extra permission' }].concat(items), function (it) { s.permOv[id] = s.permOv[id] || {}; s.permOv[id][it.id] = true; CK.audit('Added personal permission', a.name, it.id); CK.emit('settings'); }); }
        if (k === 'ovx') { delete s.permOv[id][b.dataset.k]; if (!Object.keys(s.permOv[id]).length) delete s.permOv[id]; CK.emit('settings'); }
      };
    }
  };

  /* ============ SETTINGS (replaces the short version) ============ */
  var SV = { tab: 'routing' };
  CK.V.settings = {
    title: 'Settings',
    render: function () {
      CK.ensure(); var s = S(), st = s.settings;
      var tabs = [['routing', 'Lead sources & routing'], ['pipeline', 'Pipeline'], ['fields', 'Custom fields'], ['tpl', 'Message templates'], ['sla', 'SLA timers'], ['rules', 'Freshness & calling'], ['data', 'Data & export']];
      var head = '<div class="ph"><div><h1>Settings</h1><p class="muted">Rules, not code — what the business changes without a developer. Every change lands in the activity log.</p></div></div>';
      var tb = '<div class="tabs scrollx" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" data-stab="' + t[0] + '" aria-selected="' + (SV.tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>';
      var b = '';
      if (SV.tab === 'routing') {
        var bySrc = {}; s.leads.forEach(function (L) { bySrc[L.src] = (bySrc[L.src] || 0) + 1; });
        b = '<div class="set-g"><section class="panel"><div class="panel-h"><h2>Lead sources</h2><span class="muted sm">turn one off and its form stops creating leads</span></div><table class="tbl mini"><thead><tr><th>Source</th><th class="num">Leads · 30 d</th><th class="num">Cost / mo</th><th class="num">First call within</th><th>On</th></tr></thead><tbody>' + s.sources.map(function (x, i) { return '<tr><td>' + CK.srcChip(x.id) + '</td><td class="num">' + (bySrc[x.id] || 0) + '</td><td class="num">' + (x.cost ? CK.inr(x.cost) : '—') + '</td><td class="num">' + x.sla + ' min</td><td><button type="button" class="sw-b' + (x.on ? ' on' : '') + '" role="switch" aria-checked="' + x.on + '" aria-label="' + esc(x.id) + ' on" data-src="' + i + '"><span></span></button></td></tr>'; }).join('') + '</tbody></table></section>' +
          '<section class="panel"><div class="panel-h"><h2>Who gets a new lead</h2><span class="muted sm">first matching rule wins · drag order matters</span></div><ol class="rules">' + s.rules.map(function (x, i) { return '<li class="' + (x.on ? '' : 'off') + '"><span class="rn">' + (i + 1) + '</span><div class="grow"><b>' + esc(x.name) + '</b><small>' + esc(x.when) + ' · ' + esc(x.mode) + ' → ' + x.to.map(function (w) { return esc(CK.agent(w).name.split(' ')[0]); }).join(', ') + '</small></div><span class="muted sm">' + x.hits + ' this month</span><button type="button" class="sw-b' + (x.on ? ' on' : '') + '" role="switch" aria-checked="' + x.on + '" aria-label="Rule ' + esc(x.name) + ' on" data-rule="' + i + '"><span></span></button></li>'; }).join('') + '</ol><div class="btnrow"><button type="button" class="btn sm" data-sa="rule">' + ic('plus', 14) + 'Add a rule</button></div></section></div>';
      }
      if (SV.tab === 'pipeline') {
        b = '<div class="set-g"><section class="panel"><div class="panel-h"><h2>Lead stages</h2><span class="muted sm">rename to your words; the order is the stepper</span></div><ol class="stage-ed">' + CK.LEAD_STAGES.map(function (x, i) { return '<li><span class="rn">' + (i + 1) + '</span><input aria-label="Stage ' + (i + 1) + ' name" value="' + esc(x.label) + '" data-stg="' + i + '"><span class="muted sm">' + s.leads.filter(function (L) { return L.stage === x.id; }).length + ' leads</span></li>'; }).join('') + '</ol></section>' +
          '<section class="panel"><div class="panel-h"><h2>Deal gates</h2><span class="muted sm">what must be true before a deal can move</span></div><ul class="gates">' + [['Token before agreement', 'A home is blocked only once money changes hands', 1], ['Site visit before token', 'The client must have seen the home', 1], ['Signed agreement before move-in or registry', '', 1], ['KYC + police verification before closing a rental', 'Delhi Police tenant verification', 1], ['Title check + sale deed before closing a sale', '', 1], ['Manager approval for brokerage under 1 month', 'Discounts go to Arjun', 0]].map(function (g, i) { return '<li><div><b>' + g[0] + '</b>' + (g[1] ? '<small>' + g[1] + '</small>' : '') + '</div><button type="button" class="sw-b' + (g[2] ? ' on' : '') + '" role="switch" aria-checked="' + !!g[2] + '" aria-label="' + esc(g[0]) + '" data-gate="' + i + '"><span></span></button></li>'; }).join('') + '</ul></section></div>';
      }
      if (SV.tab === 'fields') {
        b = '<section class="panel"><div class="panel-h"><h2>Custom fields</h2><span class="muted sm">appear on the record with “+ Add” until someone fills them</span><button type="button" class="btn sm" data-sa="field">' + ic('plus', 14) + 'New field</button></div><table class="tbl mini"><thead><tr><th>Field</th><th>On</th><th>Type</th><th class="num">Filled</th></tr></thead><tbody>' + s.fields.map(function (f) { var tot = f.on === 'lead' ? s.leads.length : s.props.length, n = f.on === 'lead' ? s.leads.filter(function (L) { return L.cf && L.cf[f.id] != null; }).length : s.props.filter(function (p) { return p.cf && p.cf[f.id] != null; }).length; return '<tr><td><b>' + esc(f.label) + '</b>' + (f.opts ? '<small class="muted"> · ' + esc(f.opts.join(' / ')) + '</small>' : '') + '</td><td>' + (f.on === 'lead' ? 'Leads' : 'Listings') + '</td><td>' + esc(f.type) + '</td><td class="num">' + n + ' of ' + tot + '</td></tr>'; }).join('') + '</tbody></table></section>';
      }
      if (SV.tab === 'tpl') {
        b = '<div class="tpl-g">' + s.tpl.map(function (t, i) { return '<article class="tpl"><div class="row-b">' + CK.pill(t.ch === 'wa' ? 'WhatsApp' : 'SMS', t.ch === 'wa' ? 'green' : 'blue') + '<b>' + esc(t.name) + '</b><span class="grow"></span><span class="muted sm">' + t.uses + ' sent</span></div><p class="tpl-b">' + esc(t.body).replace(/\{\{(\w+)\}\}/g, '<span class="ph-v">$1</span>') + '</p><div class="row-b">' + (t.dlt ? CK.pill('DLT ' + t.dlt, 'grey') : '') + '<span class="grow"></span><button type="button" class="btn sm ghost" data-tpl="' + i + '">' + ic('edit', 14) + 'Edit</button></div></article>'; }).join('') + '</div><p class="muted sm" style="margin-top:12px">SMS only goes out on registered templates, never between 7 pm and 9 am. WhatsApp opens click-to-chat with the text filled in.</p>';
      }
      if (SV.tab === 'sla') {
        b = '<section class="panel"><div class="panel-h"><h2>SLA timers</h2><span class="muted sm">a clock starts on the record; breaches show red on Today</span></div><table class="tbl mini"><thead><tr><th>Promise</th><th class="num">Target</th><th>Met · 30 d</th></tr></thead><tbody>' + s.sla.map(function (x, i) { return '<tr><td><b>' + esc(x.name) + '</b></td><td class="num"><button type="button" class="ed" data-sla="' + i + '">' + (x.min >= 60 ? x.min / 60 + ' h' : x.min + ' min') + '</button></td><td><span class="bm"><span class="fbar-c"><span style="width:' + x.met + '%"></span></span><b class="' + (x.met < 80 ? 'tx-bad' : 'tx-ok') + '">' + x.met + '%</b></span></td></tr>'; }).join('') + '</tbody></table></section>';
      }
      if (SV.tab === 'rules') {
        function num(k, label, hint, min, max) { return '<div class="set-row"><div><label for="st-' + k + '"><b>' + label + '</b></label><p class="muted sm">' + hint + '</p></div><input id="st-' + k + '" type="number" min="' + min + '" max="' + max + '" value="' + st[k] + '" data-st="' + k + '"></div>'; }
        b = '<div class="set-g"><section class="panel"><div class="panel-h"><h2>Freshness and verification</h2></div>' + num('rentWindow', 'Re-verify rentals after', 'days · drives the Verified badge, matching and the desk', 7, 90) + num('saleWindow', 'Re-verify resale after', 'days', 7, 120) + num('visitMinutes', 'Minutes per site visit', 'used for trip ETAs', 10, 60) + '</section><section class="panel"><div class="panel-h"><h2>Calling</h2></div>' + num('missedCallRetryH', 'Retry a missed call after', 'hours', 1, 24) + num('maxMisses', 'Hand to a person after', 'missed calls', 1, 6) + '<div class="set-row"><div><b>Quiet hours</b><p class="muted sm">No calls or messages go out</p></div><span>7 pm – 9 am</span></div></section></div>';
      }
      if (SV.tab === 'data') {
        b = '<div class="set-g"><section class="panel"><div class="panel-h"><h2>Export</h2><span class="muted sm">CSV, opens in Excel or Sheets</span></div><div class="exp">' + [['leads', 'Leads', s.leads.length], ['props', 'Listings', s.props.length], ['owners', 'Owners', s.owners.length], ['deals', 'Deals', s.deals.length], ['audit', 'Activity log', s.audit.length]].map(function (x) { return '<button type="button" class="cand" data-exp="' + x[0] + '">' + ic('upload', 16) + '<span><b>' + x[1] + '</b><small>' + x[2] + ' rows</small></span></button>'; }).join('') + '</div></section><section class="panel"><div class="panel-h"><h2>This browser</h2></div><p class="muted sm">Everything here is kept in this browser. The field app on the same browser shares it live.</p><div class="btnrow"><button type="button" class="btn" data-act="tour">' + ic('sparkles', 15) + 'Replay the tour</button><button type="button" class="btn danger-ghost" data-sa="reset">Start fresh</button></div></section></div>';
      }
      return head + tb + b;
    },
    mount: function (el) {
      el.addEventListener('click', function (e) {
        var t = e.target.closest('[data-stab],[data-src],[data-rule],[data-gate],[data-sa],[data-tpl],[data-sla],[data-exp]'); if (!t) return; var s = S();
        if (t.dataset.stab) { SV.tab = t.dataset.stab; CK.render(); return; }
        if (t.dataset.src) { var x = s.sources[+t.dataset.src]; x.on = !x.on; CK.audit('Lead source ' + (x.on ? 'on' : 'off'), x.id); CK.emit('settings'); return; }
        if (t.dataset.rule) { var ru = s.rules[+t.dataset.rule]; ru.on = !ru.on; CK.audit('Routing rule ' + (ru.on ? 'on' : 'off'), ru.name); CK.emit('settings'); return; }
        if (t.dataset.gate) { t.classList.toggle('on'); t.setAttribute('aria-checked', t.classList.contains('on')); CK.audit('Changed deal gate', t.getAttribute('aria-label')); CK.toast('Gate updated'); return; }
        if (t.dataset.sla) { var sl = s.sla[+t.dataset.sla]; CK.menu(t, [5, 10, 15, 30, 60, 120, 240, 1440, 2880].map(function (m) { return { label: m >= 60 ? m / 60 + ' h' : m + ' min', v: m, on: sl.min === m }; }), function (it) { var old = sl.min; sl.min = it.v; CK.audit('Changed SLA', sl.name, it.label); CK.emit('settings'); CK.toast('Target updated', { undo: function () { sl.min = old; CK.emit('settings'); } }); }); return; }
        if (t.dataset.tpl) { var tp = s.tpl[+t.dataset.tpl]; var m = CK.modal('<h2 id="modal-t">' + esc(tp.name) + '</h2><p class="muted sm">Use {{first_name}}, {{area}}, {{day}} and the like; they fill from the record.</p><div class="fld"><label for="tp-b">Text</label><textarea id="tp-b" rows="5">' + esc(tp.body) + '</textarea></div>' + (tp.ch === 'sms' ? '<p class="muted sm">SMS changes need re-registration before they send.</p>' : '') + '<div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn primary" id="tp-ok">Save</button></div>'); m.querySelector('#tp-ok').onclick = function () { var old = tp.body; tp.body = m.querySelector('#tp-b').value; if (tp.ch === 'sms') tp.dlt = 'Pending re-registration'; CK.audit('Edited template', tp.name); CK.closeModal(); CK.emit('settings'); CK.toast('Template saved', { undo: function () { tp.body = old; CK.emit('settings'); } }); }; return; }
        if (t.dataset.exp) { exportCsv(t.dataset.exp); return; }
        var a = t.dataset.sa;
        if (a === 'reset') CK.confirm('Start fresh?', 'Every change made in this browser goes back to the start of the day.', 'Start fresh', function () { CK.reset(); CK.ensure(); CK.toast('Started fresh'); });
        if (a === 'rule') { var m2 = CK.modal('<h2 id="modal-t">New routing rule</h2><div class="fld"><label for="ru-n">Name</label><input id="ru-n" value="Lajpat Nagar → Imran"></div><div class="f2"><div class="fld"><label for="ru-a">When the area is</label><select id="ru-a">' + CK.AREAS.map(function (x) { return '<option value="' + x.id + '">' + esc(x.name) + '</option>'; }).join('') + '</select></div><div class="fld"><label for="ru-t">Send to</label><select id="ru-t">' + s.agents.filter(function (x) { return x.role === 'telecaller'; }).map(function (x) { return '<option value="' + x.id + '">' + esc(x.name) + '</option>'; }).join('') + '</select></div></div><div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn primary" id="ru-ok">Add above “Everyone else”</button></div>'); m2.querySelector('#ru-ok').onclick = function () { var ar = CK.area(m2.querySelector('#ru-a').value); s.rules.splice(s.rules.length - 1, 0, { id: 'R' + Date.now(), name: m2.querySelector('#ru-n').value, when: 'Area: ' + ar.name, mode: 'Fixed', to: [m2.querySelector('#ru-t').value], on: true, hits: 0 }); CK.audit('Added routing rule', m2.querySelector('#ru-n').value); CK.closeModal(); CK.emit('settings'); }; }
        if (a === 'field') { var m3 = CK.modal('<h2 id="modal-t">New custom field</h2><div class="fld"><label for="cf-n">Label</label><input id="cf-n" placeholder="e.g. School the kids go to"></div><div class="f2"><div class="fld"><label for="cf-o">On</label><select id="cf-o"><option value="lead">Leads</option><option value="property">Listings</option></select></div><div class="fld"><label for="cf-t">Type</label><select id="cf-t"><option>Text</option><option>Number</option><option>Yes / no</option></select></div></div><p class="err" id="cf-err" role="alert"></p><div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn primary" id="cf-ok">Add field</button></div>'); m3.querySelector('#cf-ok').onclick = function () { var n = m3.querySelector('#cf-n'); if (n.value.trim().length < 2) { m3.querySelector('#cf-err').textContent = 'Give it a label people will understand.'; return; } s.fields.push({ id: 'F' + Date.now(), on: m3.querySelector('#cf-o').value, label: n.value.trim(), type: m3.querySelector('#cf-t').value }); CK.audit('Added custom field', n.value.trim()); CK.closeModal(); CK.emit('settings'); CK.toast('Field added — it shows as “+ Add” on every record'); }; }
      });
      el.addEventListener('change', function (e) {
        if (e.target.dataset.stg != null) { var i = +e.target.dataset.stg, old = CK.LEAD_STAGES[i].label; CK.LEAD_STAGES[i].label = e.target.value || old; S().stageNames = CK.LEAD_STAGES.map(function (x) { return x.label; }); CK.audit('Renamed stage', old, '→ ' + e.target.value); CK.emit('settings'); }
        var k = e.target.dataset.st; if (k) { var v = Math.max(+e.target.min, Math.min(+e.target.max, +e.target.value || 0)); var old2 = S().settings[k]; S().settings[k] = v; CK.audit('Changed setting', k, old2 + ' → ' + v); CK.emit('settings'); CK.toast('Saved — everything that uses it has updated', { undo: function () { S().settings[k] = old2; CK.emit('settings'); } }); }
      });
    }
  };
  function exportCsv(kind) {
    var s = S(), rows;
    if (kind === 'leads') rows = [['id', 'name', 'stage', 'source', 'bhk', 'budget', 'areas']].concat(s.leads.map(function (L) { return [L.id, L.name, L.stage, L.src, L.req.bhk.join('/'), L.req.budget, L.req.sectors.join(' ')]; }));
    if (kind === 'props') rows = [['code', 'type', 'bhk', 'deal', 'price', 'area', 'status', 'verified']].concat(s.props.map(function (p) { return [p.code, p.type, p.bhk, p.deal, p.price, CK.area(p.area).name, p.status, CK.ver(p)]; }));
    if (kind === 'owners') rows = [['id', 'name', 'listings']].concat(s.owners.map(function (o) { return [o.id, o.name, s.props.filter(function (p) { return p.ownerId === o.id; }).length]; }));
    if (kind === 'deals') rows = [['id', 'lead', 'home', 'stage', 'value']].concat(s.deals.map(function (d) { return [d.id, CK.lead(d.lead).name, CK.prop(d.pid).code, d.stage, d.value]; }));
    if (kind === 'audit') rows = [['when', 'who', 'action', 'record', 'detail']].concat(s.audit.map(function (a) { var w = CK.agent(a.who) || CK.partner(a.who); return [new Date(a.at).toISOString(), w ? w.name : '', a.action, a.ref, a.detail]; }));
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'amaltas-' + kind + '.csv'; a.click(); CK.audit('Exported data', kind, rows.length - 1 + ' rows'); CK.toast('Exported ' + (rows.length - 1) + ' rows');
  }

  /* ============ PROJECTS, UNITS, PRICE LISTS, COST SHEETS, RATE CARD ============ */
  var PV = { id: null, tab: 'units', tower: null, unit: null, rc: 'rent' };
  function release(pj) { var now = CK.now(), n = 0; pj.units.forEach(function (u) { if (u.st === 'hold' && u.until && u.until < now) { u.st = 'available'; u.relAt = now; n++; CK.audit('Hold auto-released', u.id, 'expired'); } }); if (n) CK.save(); return n; }
  CK.costSheet = function (pj, u) {
    var p = pj.price, base = pj.rate * u.sqft, rise = u.f >= p.floorFrom ? (u.f - p.floorFrom + 1) * p.floorRise * u.sqft : 0, plc = (p.plc[u.facing] || 0) * u.sqft;
    var sub = base + rise + plc + p.parking + p.club, gst = Math.round((base + rise + plc) * p.gst / 100), ifms = p.ifms * u.sqft, stamp = Math.round(sub * 0.06), reg = Math.round(sub * 0.01);
    return { rows: [['Basic price', pj.rate + ' × ' + CK.grp(u.sqft) + ' sq ft', base], ['Floor rise', u.f >= p.floorFrom ? '₹' + p.floorRise + '/sq ft × ' + (u.f - p.floorFrom + 1) + ' floors' : 'below floor ' + p.floorFrom, rise], ['Preferred location', u.facing + (p.plc[u.facing] ? ' · ₹' + p.plc[u.facing] + '/sq ft' : ''), plc], ['Covered parking', '1 slot', p.parking], ['Club membership', '', p.club], ['GST', p.gst + '% on the unit price', gst], ['Maintenance deposit (IFMS)', '₹' + p.ifms + '/sq ft', ifms], ['Stamp duty', '6% (estimate)', stamp], ['Registration', '1%', reg]], total: sub + gst + ifms + stamp + reg, unit: sub + gst };
  };
  CK.V.projects = {
    title: 'Projects & pricing',
    render: function (r) {
      CK.ensure(); var s = S();
      if (r.id === 'rates') { PV.tab = 'rates'; }
      if (r.id && r.id !== 'rates') PV.id = r.id;
      var tabsTop = '<div class="tabs" role="tablist"><a role="tab" href="#/projects" aria-selected="' + (PV.tab !== 'rates') + '">Projects &amp; units</a><a role="tab" href="#/projects/rates" aria-selected="' + (PV.tab === 'rates') + '">Rate card</a></div>';
      if (PV.tab === 'rates' && r.id === 'rates') return '<div class="ph"><div><h1>Rate card</h1><p class="muted">What each colony actually rents and sells for, from live inventory. Gaps show where the desk has no fresh number.</p></div></div>' + tabsTop + rateCard(s);
      PV.tab = 'units';
      var pj = s.projects.filter(function (x) { return x.id === PV.id; })[0] || s.projects[0]; PV.id = pj.id;
      var freed = release(pj);
      var cnt = { available: 0, hold: 0, blocked: 0, sold: 0 }; pj.units.forEach(function (u) { cnt[u.st]++; });
      var head = '<div class="ph"><div><h1>Projects &amp; pricing</h1><p class="muted">New launches and ready societies the desk sells unit by unit — availability with holds that release themselves, price lists and a cost sheet per unit.</p></div></div>' + tabsTop;
      var pick = '<div class="pj-pick">' + s.projects.map(function (x) { var c = x.units.filter(function (u) { return u.st === 'available'; }).length; return '<a href="#/projects/' + x.id + '" class="pj' + (x.id === pj.id ? ' on' : '') + '"><img src="' + CK.ph(x.photo, 1) + '" alt="" width="72" height="54"><span><b>' + esc(x.name) + '</b><small>' + esc(x.where) + ' · ' + esc(x.status) + '</small><small>' + c + ' of ' + x.units.length + ' units available · from ' + CK.money(x.rate * 1380) + '</small></span></a>'; }).join('') + '</div>';
      var meter = '<div class="umeter" aria-label="Unit availability">' + ['available', 'hold', 'blocked', 'sold'].map(function (k) { return '<span class="u-' + k + '" style="flex:' + cnt[k] + '"></span>'; }).join('') + '</div><p class="sm umeter-l">' + ['available', 'hold', 'blocked', 'sold'].map(function (k) { return '<span><i class="lg u-' + k + '"></i>' + cnt[k] + ' ' + { available: 'available', hold: 'on hold', blocked: 'blocked (token)', sold: 'sold' }[k] + '</span>'; }).join('') + (freed ? '<span class="tx-ok">' + freed + ' expired hold' + (freed > 1 ? 's' : '') + ' released just now</span>' : '') + '</p>';
      var grids = '<div class="towers">' + pj.towers.map(function (t) { var us = pj.units.filter(function (u) { return u.t === t; }); return '<section class="tower"><h3>Tower ' + t + '</h3><div class="ugrid" style="grid-template-columns:28px repeat(' + pj.per + ',1fr)">' + (function () { var h = ''; for (var f = pj.floors; f >= 1; f--) { h += '<span class="fl">' + f + '</span>'; us.filter(function (u) { return u.f === f; }).forEach(function (u) { var tip = u.n + ' · ' + u.bhk + ' BHK · ' + CK.grp(u.sqft) + ' sq ft · ' + { available: 'available', hold: 'on hold until ' + CK.time(u.until) + ' ' + CK.dayLabel(u.until).toLowerCase(), blocked: 'blocked, token paid', sold: 'sold' }[u.st]; h += '<button type="button" class="unit u-' + u.st + (PV.unit === u.id ? ' sel' : '') + '" data-unit="' + u.id + '" title="' + esc(tip) + '" aria-label="' + esc(tip) + '">' + u.bhk + '</button>'; }); } return h; })() + '</div></section>'; }).join('') + '</div>';
      var u = pj.units.filter(function (x) { return x.id === PV.unit; })[0];
      var side = u ? unitPanel(pj, u) : '<section class="panel"><div class="panel-h"><h2>Price list</h2><span class="muted sm">effective ' + CK.date(CK.now() - 12 * CK.DAY) + '</span></div>' + CK.kv([['Basic rate', CK.inr(pj.rate) + ' / sq ft'], ['Floor rise', '₹' + pj.price.floorRise + ' / sq ft per floor from floor ' + pj.price.floorFrom], ['Preferred location', 'Park facing ₹' + pj.price.plc['Park facing'] + ' · Corner ₹' + pj.price.plc.Corner + ' / sq ft'], ['Parking', CK.inr(pj.price.parking)], ['Club', CK.inr(pj.price.club)], ['GST', pj.price.gst + '%'], ['IFMS', '₹' + pj.price.ifms + ' / sq ft']]) + '<p class="muted sm" style="margin-top:10px">Pick a unit on the grid for its cost sheet, or to hold it for a client.</p></section>';
      return head + pick + '<div class="pj-g"><section class="panel"><div class="panel-h"><h2>' + esc(pj.name) + '</h2><span class="muted sm">tap a unit · number = BHK</span></div>' + meter + grids + '</section><div class="col">' + side + '</div></div>';
    },
    mount: function (el) {
      el.addEventListener('click', function (e) {
        var t = e.target.closest('[data-unit],[data-ua2]'); if (!t) return; var s = S(), pj = s.projects.filter(function (x) { return x.id === PV.id; })[0];
        if (t.dataset.unit) { PV.unit = PV.unit === t.dataset.unit ? null : t.dataset.unit; CK.render(); return; }
        var u = pj.units.filter(function (x) { return x.id === PV.unit; })[0], a = t.dataset.ua2;
        if (a === 'hold') CK.menu(t, [{ head: 'Hold 48 h for…' }].concat(s.leads.filter(function (L) { return L.intent === 'buy' && L.req.r === 'ggn' && L.stage !== 'lost'; }).slice(0, 8).map(function (L) { return { label: L.name + ' · ' + CK.budget(L), id: L.id }; })), function (it) { var prev = JSON.stringify(u); u.st = 'hold'; u.lead = it.id; u.by = CK.me().id; u.until = CK.now() + 48 * 36e5; CK.audit('Held unit', u.id, it.label.split(' · ')[0] + ' · 48 h'); CK.emit('prop'); CK.toast('Held until ' + CK.date(u.until, true) + ' ' + CK.time(u.until) + ' — releases itself after that', { undo: function () { Object.assign(u, JSON.parse(prev)); CK.emit('prop'); } }); });
        if (a === 'release') { var p2 = JSON.stringify(u); u.st = 'available'; delete u.lead; delete u.until; CK.audit('Released unit', u.id); CK.emit('prop'); CK.toast('Released', { undo: function () { Object.assign(u, JSON.parse(p2)); CK.emit('prop'); } }); }
        if (a === 'extend') { u.until += 24 * 36e5; CK.audit('Extended hold', u.id, '+24 h'); CK.emit('prop'); CK.toast('Hold extended by 24 h'); }
        if (a === 'block') CK.confirm('Block ' + u.n + ' for ' + (CK.lead(u.lead) || { name: 'this client' }).name + '?', 'Record a token of ₹2,00,000 and take it off the market. It stays blocked until the agreement or a cancellation.', 'Block unit', function () { u.st = 'blocked'; u.token = 200000; delete u.until; CK.audit('Blocked unit (token)', u.id); CK.emit('prop'); CK.celebrate && CK.celebrate(); CK.toast('Blocked · token recorded'); });
        if (a === 'share') { var cs = CK.costSheet(pj, u); var L = CK.lead(u.lead); CK.toast('Cost sheet for ' + u.n + ' (' + CK.money(cs.total) + ') shared' + (L ? ' with ' + L.name.split(' ')[0] : '') + ' on WhatsApp'); CK.audit('Shared cost sheet', u.id); }
        if (a === 'print') window.print();
      });
    }
  };
  function unitPanel(pj, u) {
    var cs = CK.costSheet(pj, u), L = u.lead ? CK.lead(u.lead) : null, who = u.by ? (CK.agent(u.by) || CK.partner(u.by)) : null, can = CK.can('props.hold');
    var state = { available: CK.pill('Available', 'green'), hold: CK.pill('On hold · releases ' + CK.ago(u.until), 'amber'), blocked: CK.pill('Blocked · token ' + CK.money(u.token || 200000), 'accent'), sold: CK.pill('Sold', 'grey') }[u.st];
    return '<section class="panel"><div class="panel-h"><h2>Unit ' + esc(u.t + '-' + u.n) + '</h2>' + state + '</div><p class="sm">' + u.bhk + ' BHK · ' + CK.grp(u.sqft) + ' sq ft · floor ' + u.f + ' · ' + esc(u.facing) + '</p>' + (L || who ? '<p class="sm muted" style="margin-top:6px">' + (L ? 'For ' + CK.chipLead(L) + ' ' : '') + (who ? 'by ' + esc(who.name) : '') + '</p>' : '') +
      (can ? '<div class="btnrow">' + (u.st === 'available' ? '<button type="button" class="btn sm primary" data-ua2="hold">' + ic('clock', 14) + 'Hold 48 h</button>' : '') + (u.st === 'hold' ? '<button type="button" class="btn sm primary" data-ua2="block">' + ic('rupee', 14) + 'Block with token</button><button type="button" class="btn sm" data-ua2="extend">+24 h</button><button type="button" class="btn sm ghost" data-ua2="release">Release</button>' : '') + '<button type="button" class="btn sm ghost" data-ua2="share">' + ic('chat', 14) + 'Share cost sheet</button></div>' : '<p class="muted sm">Your role can see availability but not hold units.</p>') + '</section>' +
      '<section class="panel cost"><div class="panel-h"><h2>Cost sheet</h2><span class="muted sm">indicative, ' + CK.date(CK.now()) + '</span></div><table class="tbl mini"><tbody>' + cs.rows.map(function (r) { return '<tr><td>' + esc(r[0]) + '<small class="muted"> ' + esc(r[1]) + '</small></td><td class="num">' + (r[2] ? CK.inr(r[2]) : '—') + '</td></tr>'; }).join('') + '<tr class="tot"><td><b>All-in cost</b></td><td class="num"><b>' + CK.inr(cs.total) + '</b></td></tr></tbody></table><p class="muted sm">≈ ' + CK.money(cs.total) + ' · ' + CK.inr(Math.round(cs.total / u.sqft)) + ' per sq ft all-in</p></section>';
  }
  function rateCard(s) {
    var deal = PV.rc, cfgs = deal === 'rent' ? [2, 3, 4] : [3, 4, 5];
    var rows = CK.AREAS.map(function (a) {
      return '<tr><td><b>' + esc(a.name) + '</b></td>' + cfgs.map(function (b) {
        var ps = s.props.filter(function (p) { return p.area === a.id && p.deal === deal && p.bhk === b && p.type !== 'Office'; }).map(function (p) { return p.price; }).sort(function (x, y) { return x - y; });
        if (!ps.length) return '<td class="gap-c"><a class="add-in" href="#/survey">+ Survey it</a></td>';
        var med = ps[Math.floor(ps.length / 2)];
        return '<td><b>' + CK.money(med, true) + (deal === 'rent' ? '/mo' : '') + '</b><small class="muted"> ' + (ps.length > 1 ? CK.money(ps[0], true) + '–' + CK.money(ps[ps.length - 1], true) : '1 listing') + '</small></td>';
      }).join('') + '</tr>';
    }).join('');
    return '<div class="fbar"><div class="seg" role="group" aria-label="Rent or sale"><button type="button" data-rc="rent" aria-pressed="' + (deal === 'rent') + '">Rent</button><button type="button" data-rc="sale" aria-pressed="' + (deal === 'sale') + '">Sale</button></div><span class="muted sm">Median of live listings · range in grey · empty cells are gaps to fill from the next survey</span></div><div class="tbl-wrap"><table class="tbl rate"><thead><tr><th>Colony / sector</th>' + cfgs.map(function (b) { return '<th>' + b + ' BHK</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-rc]'); if (b) { PV.rc = b.dataset.rc; CK.render(); } });

  /* custom fields on the lead panel: "+ Add" in place */
  CK.cfBlock = function (L) {
    CK.ensure(); var fs = S().fields.filter(function (f) { return f.on === 'lead'; }); L.cf = L.cf || {};
    return '<section class="card"><div class="card-h"><h3>More about them</h3></div>' + CK.kv(fs.map(function (f) { var v = L.cf[f.id]; return [f.label, v != null && v !== '' ? '<button type="button" class="ed" data-cf="' + f.id + '">' + esc(v) + '</button>' : '<button type="button" class="add-in" data-cf="' + f.id + '">+ Add ' + esc(f.label.toLowerCase()) + '</button>']; })) + '</section>';
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cf]'); if (!b) return; var r = CK.route(); if (!r.peek || r.peek.kind !== 'lead') return; var L = CK.lead(r.peek.id), f = S().fields.filter(function (x) { return x.id === b.dataset.cf; })[0];
    function set(v) { var old = L.cf[f.id]; L.cf[f.id] = v; L.tl.unshift({ at: CK.now(), kind: 'edit', text: f.label + ' · ' + v, by: CK.me().id }); CK.audit('Filled field', L.id, f.label); CK.emit('lead'); CK.toast(f.label + ' saved', { undo: function () { L.cf[f.id] = old; CK.emit('lead'); } }); }
    if (f.opts) return CK.menu(b, f.opts.map(function (o) { return { label: o, on: L.cf[f.id] === o }; }), function (it) { set(it.label); });
    var m = CK.modal('<h2 id="modal-t">' + esc(f.label) + '</h2><div class="fld"><label for="cf-v">' + esc(f.label) + '</label><input id="cf-v" ' + (f.type === 'Number' ? 'inputmode="numeric"' : '') + ' value="' + esc(L.cf[f.id] || '') + '"></div><div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn primary" id="cf-ok2">Save</button></div>');
    m.querySelector('#cf-ok2').onclick = function () { var v = m.querySelector('#cf-v').value.trim(); if (!v) return; CK.closeModal(); set(v); };
  });
})();
