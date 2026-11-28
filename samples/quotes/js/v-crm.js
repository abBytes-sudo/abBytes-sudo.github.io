/* Studio OS: CRM front end. Leads (table + board), lead record slide-over, calls focus mode, site measurements, brief, design fee. */
(function () {
  'use strict';
  var MR = window.MR, u = MR.u, esc = u.esc, ic = MR.ic;
  MR.views = MR.views || {}; MR.act = MR.act || {}; MR.bind = MR.bind || {};
  function S() { return MR.S; }
  var SCORE = { hot: ['Hot', 'bad'], warm: ['Warm', 'warn'], cold: ['Cold', 'info'] };
  var LOUT = { connected: 'Connected', noanswer: 'No answer', busy: 'Busy', callback: 'Call back', notinterested: 'Not interested', wrong: 'Wrong number' };
  MR.LOUT = LOUT;
  function stages(track) { return S().config.stages[track] || []; }
  function stageName(l) { var s = stages(l.track).filter(function (x) { return x[0] === l.stage; })[0]; return s ? s[1] : l.stage; }
  function stageIdx(l) { return stages(l.track).map(function (s) { return s[0]; }).indexOf(l.stage); }
  function open(l) { return l.stage !== 'won' && l.stage !== 'lost'; }
  MR.lead = function (id) { return MR.find(S().leads, id); };
  function lastRemark(l) { return l.remarks[l.remarks.length - 1] || null; }
  function sla(l) {
    if (l.stage !== 'new' || l.remarks.length) return null;
    var due = new Date(new Date(l.created).getTime() + 30 * 60e3), m = Math.round((due - Date.now()) / 60e3);
    return m >= 0 ? MR.tchip('first call due in ' + m + ' m', m < 15 ? 'warn' : 'info', 'clock') : MR.tchip('SLA missed by ' + (m < -90 ? Math.round(-m / 60) + ' h' : -m + ' m'), 'bad', 'clock');
  }
  MR.leadSla = sla;
  function nextChip(l) {
    if (!l.next) return '';
    var d = new Date(l.next.at), today = u.today(), ds = l.next.at.slice(0, 10);
    var t = ((d.getHours() % 12) || 12) + (d.getMinutes() ? ':' + ('0' + d.getMinutes()).slice(-2) : '') + (d.getHours() < 12 ? ' am' : ' pm');
    if (ds < today || (ds === today && d < new Date())) return MR.tchip('overdue · ' + u.fshort(ds), 'bad', 'clock');
    return MR.tchip(ds === today ? 'today ' + t : ds === u.addD(today, 1) ? 'tomorrow ' + t : u.fshort(ds) + ' ' + t, ds === today ? 'warn' : 'info', 'clock');
  }
  MR.leadNext = nextChip;
  function scoreChip(l) { var s = SCORE[l.score] || SCORE.cold; return MR.tchip(s[0], s[1]); }
  function chipLead(l) { return '<a class="chip" href="#/leads?open=' + l.id + '" data-act="open-lead" data-id="' + l.id + '"><span class="mono" style="--h:' + MR.hueOf(l.name) + '">' + esc(u.initials(l.name)) + '</span><span>' + esc(l.name) + '</span></a>'; }
  MR.chipLead = chipLead;
  function money(n) { return MR.money(n); }

  /* =============================== LEADS: table + board =============================== */
  var LV = [
    ['open', 'Open', function (l) { return open(l); }],
    ['mine', 'Mine', function (l) { return open(l) && l.owner === MR.me().id; }],
    ['hot', 'Hot', function (l) { return open(l) && l.score === 'hot'; }],
    ['sla', 'SLA risk', function (l) { return l.stage === 'new' && !l.remarks.length; }],
    ['week', 'New this week', function (l) { return l.created.slice(0, 10) >= u.addD(u.today(), -7); }],
    ['won', 'Won', function (l) { return l.stage === 'won'; }],
    ['lost', 'Lost', function (l) { return l.stage === 'lost'; }],
    ['all', 'All', function () { return true; }]
  ];
  var COLS = [['track', 'Track'], ['stage', 'Stage'], ['score', 'Score'], ['source', 'Source'], ['owner', 'Owner'], ['next', 'Next step'], ['budget', 'Budget'], ['created', 'Created']];
  var sel = {};
  MR.views.leads = function (r) {
    var vk = r.qs.view || 'open', track = r.qs.track || '', q = (r.qs.q || '').toLowerCase(), layout = r.qs.layout || MR.prefs.llayout || 'table', sort = r.qs.sort || 'next';
    var vd = LV.filter(function (x) { return x[0] === vk; })[0] || LV[0];
    var list = S().leads.filter(function (l) { return vd[2](l) && (!track || l.track === track) && (!q || (l.name + ' ' + l.city + ' ' + l.source + ' ' + l.no).toLowerCase().indexOf(q) > -1); });
    var so = { next: function (l) { return l.next ? l.next.at : (l.stage === 'new' ? '0' : 'z'); }, created: function (l) { return '~' + (9e15 - new Date(l.created).getTime()); }, score: function (l) { return { hot: 0, warm: 1, cold: 2 }[l.score]; }, stage: function (l) { return l.track + stageIdx(l); }, name: function (l) { return l.name; } }[sort.replace('-', '')] || function (l) { return l.created; };
    list.sort(function (a, b) { var x = so(a), y = so(b); return (x < y ? -1 : x > y ? 1 : 0) * (sort[0] === '-' ? -1 : 1); });
    var all = S().leads, wk = u.addD(u.today(), -7);
    var newWk = all.filter(function (l) { return l.created.slice(0, 10) >= wk; }).length, hot = all.filter(function (l) { return open(l) && l.score === 'hot'; }).length, breach = all.filter(function (l) { return sla(l) && /missed/.test(sla(l)); }).length;
    var decided = all.filter(function (l) { return l.stage === 'won' || l.stage === 'lost'; }), conv = decided.length ? all.filter(function (l) { return l.stage === 'won'; }).length / decided.length : 0;
    var h = '<div class="page"><div class="ph"><div><h1>Leads</h1><p class="sub">Every enquiry, by track and stage. Stages, fields, sources, SLAs and task templates are set in <a href="#/settings/stages">Settings</a>.</p></div><div class="acts">' + '<a class="btn" href="#/calls">' + ic('phone') + '<span>Calls mode</span></a>' + MR.btn('new-lead', 'New lead', { cls: 'pri', icon: 'plus' }) + '</div></div>';
    var wk2 = u.addD(u.today(), -14), prevWk = all.filter(function (l) { return l.created.slice(0, 10) >= wk2 && l.created.slice(0, 10) < wk; }).length;
    var hotNow = all.filter(function (l) { return l.score === 'hot' && l.created.slice(0, 10) >= wk; }).length, hotPrev = all.filter(function (l) { return l.score === 'hot' && l.created.slice(0, 10) >= wk2 && l.created.slice(0, 10) < wk; }).length;
    var made = function (f) { return MR.perDay ? MR.perDay(all.filter(f || function () { return true; }), function (l) { return l.created; }, 14) : null; };
    var wonM = all.filter(function (l) { return l.stage === 'won' && (l.fee && l.fee.paidAt || l.created).slice(0, 7) === u.today().slice(0, 7); }).length;
    var LT = [['sla', 'SLA risk', breach ? breach + ' missed' : 'On time', S().leads.filter(function (l) { return l.stage === 'new' && !l.remarks.length; }).length + ' waiting for a first call', breach > 0, made(function (l) { return l.stage === 'new'; }), breach ? '<span class="delta down">first call due in 30 min</span>' : '<span class="delta up">every lead called</span>'],
      ['hot', 'Hot leads', hot, 'open, scored hot', false, made(function (l) { return l.score === 'hot'; }), MR.delta ? MR.delta(hotNow, hotPrev) : ''],
      ['week', 'New this week', newWk, 'across both tracks', false, made(), MR.delta ? MR.delta(newWk, prevWk) : ''],
      ['won', 'Lead to win', u.pct(conv * 100), decided.length + ' decided this year', false, null, '<span class="delta flat">' + wonM + ' won this month</span>']];
    h += '<div class="tiles" role="group" aria-label="Filter leads">' + LT.map(function (t) { return '<button type="button" class="tile" data-act="qs" data-k="view" data-v="' + t[0] + '" aria-pressed="' + (vk === t[0]) + '"><span class="tl">' + t[1] + '</span><span class="tdl"><span class="tv' + (t[4] ? ' bad' : '') + '">' + t[2] + '</span>' + (t[5] && MR.spark ? MR.spark(t[5]) : '') + '</span>' + (t[6] || '') + '<span class="td">' + t[3] + '</span></button>'; }).join('') + '</div>';
    h += '<div class="views">' + LV.map(function (v) { return '<a href="#/leads?view=' + v[0] + (track ? '&track=' + encodeURIComponent(track) : '') + '&layout=' + layout + '"' + (vk === v[0] ? ' aria-current="page"' : '') + '>' + v[1] + ' <span class="ct">' + all.filter(v[2]).length + '</span></a>'; }).join('') + '</div>';
    h += '<div class="tbar"><div class="tsearch">' + ic('search') + '<input class="inp" type="search" placeholder="Search name, city, source" aria-label="Search leads" value="' + esc(r.qs.q || '') + '" data-bind="qs-q"></div><select class="sel" style="width:auto" aria-label="Track" data-bind="lead-track"><option value="">Both tracks</option>' + S().config.tracks.map(function (t) { return '<option' + (t === track ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select><span class="grow"></span>' + (layout === 'table' ? MR.btn('lead-cols', 'Columns', { cls: 'ghost sm', icon: 'filter' }) : '') + '<div class="seg" role="group" aria-label="Layout"><button type="button" data-act="lead-layout" data-v="table" aria-pressed="' + (layout === 'table') + '">Table</button><button type="button" data-act="lead-layout" data-v="board" aria-pressed="' + (layout === 'board') + '">Board</button></div></div>';
    if (layout === 'board') h += boardHtml(list, track || 'Turnkey');
    else if (!list.length) h += '<section class="panel">' + MR.empty('clients', 'No leads here', 'Try another view, or add one: enquiries from Instagram, the website or a walk-in all start here.', MR.btn('new-lead', 'New lead', { cls: 'pri', icon: 'plus' })) + '</section>';
    else {
      var hide = MR.prefs.lcols || ['budget'];
      var th = function (k, n, cls) { if (hide.indexOf(k) > -1) return ''; var s = sort.replace('-', '') === k, dir = s && sort[0] !== '-' ? '-' : ''; return '<th class="' + (cls || '') + '"><button type="button" class="th-sort" data-act="qs" data-k="sort" data-v="' + dir + k + '" aria-label="Sort by ' + n + '">' + n + (s ? (sort[0] === '-' ? ' ↓' : ' ↑') : '') + '</button></th>'; };
      var td = function (k, html, cls) { return hide.indexOf(k) > -1 ? '' : '<td class="' + (cls || '') + '">' + html + '</td>'; };
      h += '<div class="tw"><table class="tbl" id="ltbl"><thead><tr><th class="chkc"><input type="checkbox" aria-label="Select all leads" data-act="l-all"></th>' + th('name', 'Lead') + th('track', 'Track', 'hide-sm') + th('stage', 'Stage') + th('score', 'Score', 'hide-sm') + th('source', 'Source', 'hide-sm') + th('owner', 'Owner', 'hide-sm') + th('next', 'Next step') + th('budget', 'Budget', 'hide-sm') + th('created', 'Created', 'hide-sm') + '<th class="w0"></th></tr></thead><tbody>' + list.map(function (l) {
        var lr = lastRemark(l);
        return '<tr class="click" data-act="open-lead" data-id="' + l.id + '"><td class="chkc"><input type="checkbox" aria-label="Select ' + esc(l.name) + '" data-act="l-sel" data-id="' + l.id + '"' + (sel[l.id] ? ' checked' : '') + '></td><td><b style="font-weight:600">' + esc(l.name) + '</b><span class="sub">' + esc(l.no + ' · ' + (l.f.property || l.kind) + ' · ' + l.city) + '</span></td>' + td('track', '<span class="tag">' + esc(l.track) + '</span>', 'hide-sm') + td('stage', MR.pill(l.stage, { new: ['Enquiry', 'violet'], discovery: ['Discovery call', 'info'], visit: ['Site visit', 'info'], brief: ['Brief', 'warn'], fee: ['Design fee', 'warn'], package: ['Package', 'warn'], quote: ['Quote', 'brand'], won: ['Won', 'ok'], lost: ['Lost', 'grey'] })) + td('score', scoreChip(l), 'hide-sm') + td('source', esc(l.source), 'hide-sm nowrap') + td('owner', MR.avatar(l.owner), 'hide-sm') + td('next', (sla(l) || nextChip(l) || '<span class="faint">' + (open(l) ? MR.addIn('lead', l.id, 'next', 'next step', '') : '—') + '</span>') + (l.next ? '<span class="sub">' + esc(l.next.text) + '</span>' : lr ? '<span class="sub">' + esc(lr.note.slice(0, 48)) + '</span>' : '')) + td('budget', esc(l.f.budget || '—'), 'hide-sm') + td('created', u.rel(l.created), 'hide-sm muted nowrap') + '<td class="w0"><span class="row-acts">' + MR.iconBtn('lead-call', 'phone', 'Log a call', { cls: 'sm', id: l.id }) + '</span></td></tr>';
      }).join('') + '</tbody></table></div>';
      h += '<div class="bulk" id="lbulk" role="region" aria-label="Bulk actions"><b id="lbulkN"></b>' + MR.btn('lb-owner', 'Assign') + MR.btn('lb-stage', 'Move stage') + MR.btn('lb-lost', 'Mark lost') + '<button type="button" class="icon-btn" style="color:#fff" data-act="lb-clear" aria-label="Clear selection">' + ic('x') + '</button></div>';
    }
    return { html: h + '</div>', title: 'Leads', crumbs: [['Leads']], nav: 'leads', primary: ['new-lead', 'New lead'], after: function () { syncBulk(); if (r.qs.open) { var l = MR.lead(r.qs.open); if (l && !document.getElementById('drawer').open) openLead(l); } if (layout === 'board') wireDnD(); } };
  };
  MR.bind['lead-track'] = function (el) { MR.setQS('track', el.value); };
  MR.act['lead-layout'] = function (el) { MR.prefs.llayout = el.dataset.v; MR.savePrefs(); MR.setQS('layout', el.dataset.v); };
  MR.act['lead-cols'] = function (el) {
    var hide = MR.prefs.lcols || ['budget'];
    MR.menu(el, '<div class="mh">Show columns</div>' + COLS.map(function (c) { return '<label class="chk" style="padding:6px 10px"><input type="checkbox" data-act="lead-col" data-v="' + c[0] + '"' + (hide.indexOf(c[0]) < 0 ? ' checked' : '') + '><span>' + c[1] + '</span></label>'; }).join(''), { right: true });
  };
  MR.act['lead-col'] = function (el) { var hide = (MR.prefs.lcols || ['budget']).slice(), k = el.dataset.v, i = hide.indexOf(k); if (el.checked && i > -1) hide.splice(i, 1); if (!el.checked && i < 0) hide.push(k); MR.prefs.lcols = hide; MR.savePrefs(); var y = window.scrollY; MR.render(); window.scrollTo(0, y); };
  function syncBulk() { var n = Object.keys(sel).filter(function (k) { return sel[k]; }).length, b = document.getElementById('lbulk'); if (!b) return; b.classList.toggle('on', n > 0); document.getElementById('lbulkN').textContent = n + ' selected'; }
  MR.act['l-sel'] = function (el, e) { e.stopPropagation(); sel[el.dataset.id] = el.checked; syncBulk(); };
  MR.act['l-all'] = function (el) { document.querySelectorAll('#ltbl tbody input[type=checkbox]').forEach(function (c) { c.checked = el.checked; sel[c.dataset.id] = el.checked; }); syncBulk(); };
  MR.act['lb-clear'] = function () { sel = {}; MR.render(); };
  function chosen() { return S().leads.filter(function (l) { return sel[l.id]; }); }
  MR.act['lb-owner'] = function (el) { MR.menu(el, '<div class="mh">Assign ' + chosen().length + ' leads to</div>' + MR.USERS.filter(function (x) { return ['pm', 'owner', 'design'].indexOf(x.role) > -1; }).map(function (x) { return '<button type="button" data-act="lb-owner-set" data-id="' + x.id + '">' + MR.avatar(x.id) + esc(x.name) + '</button>'; }).join(''), { up: true }); };
  MR.act['lb-owner-set'] = function (el) { var L = chosen(), prev = L.map(function (l) { return l.owner; }); L.forEach(function (l) { l.owner = el.dataset.id; MR.audit('lead', l.no, 'reassigned', 'Owner → ' + MR.userById(el.dataset.id).name); }); MR.closeMenu(); sel = {}; MR.save(); MR.render(); MR.undoable(L.length + ' leads assigned to ' + MR.userById(el.dataset.id).name.split(' ')[0], function () { L.forEach(function (l, i) { l.owner = prev[i]; }); }); };
  MR.act['lb-stage'] = function (el) { var st = stages('Turnkey'); MR.menu(el, '<div class="mh">Move ' + chosen().length + ' leads to</div>' + st.filter(function (s) { return s[0] !== 'won' && s[0] !== 'lost'; }).map(function (s) { return '<button type="button" data-act="lb-stage-set" data-v="' + s[0] + '">' + esc(s[1]) + '</button>'; }).join(''), { up: true }); };
  MR.act['lb-stage-set'] = function (el) { var L = chosen().filter(function (l) { return stages(l.track).some(function (s) { return s[0] === el.dataset.v; }); }), prev = L.map(function (l) { return l.stage; }); L.forEach(function (l) { setStage(l, el.dataset.v, true); }); MR.closeMenu(); sel = {}; MR.save(); MR.render(); MR.undoable(L.length + ' leads moved', function () { L.forEach(function (l, i) { l.stage = prev[i]; }); }); };
  MR.act['lb-lost'] = function () { var L = chosen().filter(open); if (!L.length) return; MR.confirm('Mark ' + L.length + ' lead' + (L.length > 1 ? 's' : '') + ' lost?', 'They leave the open views and count against the conversion rate. You can undo straight after.', 'Mark lost', function () { var prev = L.map(function (l) { return l.stage; }); L.forEach(function (l) { l.stage = 'lost'; l.lostWhy = 'Bulk: no response'; MR.audit('lead', l.no, 'marked lost', 'Bulk action'); }); sel = {}; MR.save(); MR.render(); MR.undoable(L.length + ' marked lost', function () { L.forEach(function (l, i) { l.stage = prev[i]; }); }); }, true); };

  function boardHtml(list, track) {
    var st = stages(track).filter(function (s) { return s[0] !== 'lost'; }), mv = MR.can('money.view');
    return '<p class="callout" style="margin-bottom:10px">' + ic('grip') + 'Drag a card to move it to the next stage, or use its ⋯ menu. Showing the <b>' + esc(track) + '</b> track.</p><div class="board" role="list">' + st.map(function (s) {
      var cards = list.filter(function (l) { return l.track === track && l.stage === s[0]; });
      return '<section class="bcol" data-stage="' + s[0] + '" aria-label="' + esc(s[1]) + '"><header><b>' + esc(s[1]) + '</b><span class="ct">' + cards.length + '</span>' + (s[2] ? '<span class="faint" style="font-size:11px;margin-left:auto">SLA ' + (s[2] < 1 ? Math.round(s[2] * 60) + ' m' : s[2] + ' h') + '</span>' : '') + '</header><div class="bcards">' + cards.map(function (l) {
        var lr = lastRemark(l);
        return '<article class="bcard" draggable="true" data-id="' + l.id + '" role="listitem"><div class="bc-hd"><button type="button" class="bc-t" data-act="open-lead" data-id="' + l.id + '">' + esc(l.name) + '</button>' + MR.iconBtn('lead-menu', 'more', 'Actions for ' + l.name, { cls: 'sm', id: l.id }) + '</div><div class="bc-m">' + esc((l.f.property || l.kind) + (l.f.area ? ' · ' + u.fnum(l.f.area) + ' sqft' : '')) + '</div>' + (lr ? '<div class="bc-r">' + esc(lr.note.slice(0, 80)) + '</div>' : l.note ? '<div class="bc-r">' + esc(l.note.slice(0, 80)) + '</div>' : '') + '<div class="bc-f">' + scoreChip(l) + (sla(l) || nextChip(l)) + '<span style="margin-left:auto">' + MR.avatar(l.owner) + '</span></div></article>';
      }).join('') + (cards.length ? '' : '<div class="bc-empty">Drop a lead here</div>') + '</div></section>';
    }).join('') + '</div>';
  }
  function wireDnD() {
    var dragId = null;
    document.querySelectorAll('.bcard').forEach(function (c) { c.addEventListener('dragstart', function (e) { dragId = c.dataset.id; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (x) { /* ignore */ } }); c.addEventListener('dragend', function () { c.classList.remove('dragging'); }); });
    document.querySelectorAll('.bcol').forEach(function (col) {
      col.addEventListener('dragover', function (e) { e.preventDefault(); col.classList.add('over'); });
      col.addEventListener('dragleave', function () { col.classList.remove('over'); });
      col.addEventListener('drop', function (e) { e.preventDefault(); col.classList.remove('over'); var l = MR.lead(dragId); if (!l || l.stage === col.dataset.stage) return; var prev = l.stage; setStage(l, col.dataset.stage); MR.save(); MR.render(); MR.undoable(l.name + ' → ' + stageName(l), function () { l.stage = prev; }); });
    });
  }
  MR.act['lead-menu'] = function (el) {
    var l = MR.lead(el.dataset.id);
    MR.menu(el, '<button type="button" data-act="open-lead" data-id="' + l.id + '">' + ic('eye') + 'Open</button><button type="button" data-act="lead-call" data-id="' + l.id + '">' + ic('phone') + 'Log a call</button><hr><div class="mh">Move to</div>' + stages(l.track).filter(function (s) { return s[0] !== l.stage; }).map(function (s) { return '<button type="button" data-act="lead-stage" data-id="' + l.id + '" data-v="' + s[0] + '">' + esc(s[1]) + '</button>'; }).join(''), { right: true });
  };
  function setStage(l, k, quiet) {
    var prev = stageName(l); l.stage = k;
    var created = new Date().toISOString();
    S().config.tasks.filter(function (t) { return t[0] === l.track && t[1] === k; }).forEach(function (t) { if (!l.tasks.some(function (x) { return x.stage === k && x.title === t[2]; })) l.tasks.push({ id: u.uid('tk'), stage: k, title: t[2], sla: t[3], who: t[4], due: new Date(Date.now() + t[3] * 3600e3).toISOString(), done: false }); });
    MR.audit('lead', l.no, 'stage', prev + ' → ' + stageName(l));
    if (!quiet && k === 'won' && !l.clientId) MR.toast(l.name + ' marked won. Create the quote from the lead to keep the trail.', { plain: true });
  }
  MR.act['lead-stage'] = function (el) { var l = MR.lead(el.dataset.id), prev = l.stage; MR.closeMenu(); if (el.dataset.v === 'lost') { lostDlg(l); return; } setStage(l, el.dataset.v); MR.save(); MR.render(); if (document.getElementById('drawer').open) openLead(l); MR.undoable(l.name + ' → ' + stageName(l), function () { l.stage = prev; }); };

  /* =============================== LEAD RECORD (slide-over first) =============================== */
  function primaryFor(l) {
    var lr = l.remarks.length;
    if (l.stage === 'new') return MR.btn('lead-call', lr ? 'Log a call' : 'Log first call', { cls: 'pri', icon: 'phone', id: l.id });
    if (l.stage === 'discovery') return MR.btn('lead-call', 'Log discovery call', { cls: 'pri', icon: 'phone', id: l.id });
    if (l.stage === 'visit') return l.visit && l.visit.done ? MR.btn('lead-measure', 'Record measurements', { cls: 'pri', icon: 'edit', id: l.id }) : MR.btn('lead-visit-done', 'Mark visit done', { cls: 'pri', icon: 'check', id: l.id });
    if (l.stage === 'brief') return MR.btn('lead-brief', l.brief ? 'Approve brief' : 'Write brief', { cls: 'pri', icon: 'edit', id: l.id });
    if (l.stage === 'fee') return l.fee && !l.fee.paidAt ? MR.btn('lead-fee-paid', 'Mark fee received', { cls: 'pri', icon: 'pay', id: l.id }) : MR.btn('lead-fee', 'Request design fee', { cls: 'pri', icon: 'pay', id: l.id });
    if (l.stage === 'package') return MR.btn('lead-stage', 'Fee link sent', { cls: 'pri', icon: 'send', id: l.id, attrs: ' data-v="fee"' });
    if (l.stage === 'quote') return l.quoteId ? '<a class="btn pri" href="#/quote/' + l.quoteId + '">' + ic('quotes') + '<span>Open quote</span></a>' : MR.btn('lead-quote', 'Create quote', { cls: 'pri', icon: 'plus', id: l.id });
    if (l.stage === 'won') { var p = l.quoteId && MR.quote(l.quoteId) && MR.quote(l.quoteId).projectId; return p ? '<a class="btn pri" href="#/project/' + p + '">' + ic('projects') + '<span>Open project</span></a>' : ''; }
    return MR.btn('lead-stage', 'Reopen', { id: l.id, attrs: ' data-v="new"' });
  }
  function areas(m) { var f = 0, w = 0; m.rooms.forEach(function (r) { f += r.l * r.w; w += Math.max(0, 2 * (r.l + r.w) * r.h - r.doors * 21 - r.windows * 16); }); return { floor: f, wall: w }; }
  MR.areas = areas;
  MR.measureHtml = function (m, editAct, id) {
    if (!m) return '<div class="remark quiet"><span class="lb">Site measurements</span>Not measured yet.' + (editAct ? ' ' + MR.btn(editAct, 'Record measurements', { cls: 'sm', icon: 'edit', id: id }) : '') + '</div>';
    var a = areas(m);
    return '<div class="preview"><div class="preview-hd" style="display:flex;justify-content:space-between;align-items:center"><span>Site measurements · ' + esc(MR.userById(m.by).name.split(' ')[0]) + ', ' + u.fshort(m.at.slice(0, 10)) + '</span>' + (editAct ? '<button type="button" class="btn ghost sm" data-act="' + editAct + '" data-id="' + id + '">Edit</button>' : '') + '</div><table class="tbl" style="font-size:13px"><thead><tr><th>Room</th><th class="num">L × W × H (ft)</th><th class="num hide-sm">Openings</th><th class="num">Floor sqft</th><th class="num hide-sm">Wall sqft</th></tr></thead><tbody>' + m.rooms.map(function (r) { return '<tr><td>' + esc(r.name) + '</td><td class="num">' + r.l + ' × ' + r.w + ' × ' + r.h + '</td><td class="num hide-sm">' + r.doors + 'D ' + r.windows + 'W</td><td class="num">' + u.fnum(r.l * r.w) + '</td><td class="num hide-sm">' + u.fnum(Math.max(0, 2 * (r.l + r.w) * r.h - r.doors * 21 - r.windows * 16)) + '</td></tr>'; }).join('') + '</tbody><tfoot><tr><td>Total</td><td></td><td class="hide-sm"></td><td class="num">' + u.fnum(a.floor) + '</td><td class="num hide-sm">' + u.fnum(a.wall) + '</td></tr></tfoot></table>' + (m.note ? '<div style="padding:10px 14px;font-size:13px" class="muted">' + esc(m.note) + '</div>' : '') + '</div>';
  };
  function leadBody(l, wide) {
    var lr = lastRemark(l), st = stages(l.track).filter(function (s) { return s[0] !== 'lost'; }), si = stageIdx(l);
    var h = '<div class="chips">' + scoreChip(l) + MR.tchip(l.track, '') + MR.tchip(l.source, 'info') + (sla(l) || '') + (l.stage === 'lost' ? MR.tchip('Lost: ' + (l.lostWhy || ''), 'bad') : '') + '</div>';
    if (l.stage !== 'lost') h += MR.stepper(st.map(function (s) { return s[1]; }), si, 'Lead stage');
    h += lr ? '<div class="remark"><span class="lb">Last remark · ' + esc(LOUT[lr.outcome] || lr.outcome) + ' <span>· ' + esc(MR.userById(lr.by).name.split(' ')[0]) + ', ' + u.rel(lr.at) + '</span></span>' + esc(lr.note) + '</div>' : '<div class="remark"><span class="lb">' + (l.note ? 'Enquiry' : 'Last remark') + ' <span>· ' + u.rel(l.created) + '</span></span>' + esc(l.note || 'No remark yet. The note you add on the first call lands here.') + '</div>';
    h += '<div class="nextms"><span>Next: <b>' + esc(l.next ? l.next.text : 'nothing scheduled') + '</b></span>' + (l.next ? nextChip(l) : MR.btn('lead-call', 'Schedule', { cls: 'ghost sm', id: l.id })) + '</div>';
    h += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' + primaryFor(l) + MR.iconBtn('lead-more', 'more', 'More actions', { id: l.id }) + '<span class="grow"></span>' + (wide ? '' : '<a class="btn ghost sm" href="#/lead/' + l.id + '">Full record ' + ic('arrow') + '</a>') + '</div>';
    var fields = S().config.fields;
    h += '<dl class="pgrid">' + [['Phone', l.phone ? esc(l.phone) : MR.addIn('lead', l.id, 'phone', 'phone', '+91 98xxx xxxxx')], ['Email', l.email ? '<span class="em" title="' + esc(l.email) + '">' + esc(l.email) + '</span>' : MR.addIn('lead', l.id, 'email', 'email', 'name@example.com')], ['City', esc(l.city)], ['Owner', MR.chipUser(l.owner)]].concat(fields.map(function (f) { var v = l.f[f.k]; return [f.n, v ? esc(f.type === 'date' ? u.fdate(v) : f.type === 'number' ? u.fnum(v) : v) : MR.addIn('leadf', l.id, f.k, f.n.toLowerCase(), f.type === 'date' ? 'YYYY-MM-DD' : '')]; })).map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>';
    var open2 = l.tasks.filter(function (t) { return !t.done; }), done = l.tasks.filter(function (t) { return t.done; });
    h += '<div><div class="wc-k" style="margin-bottom:6px;display:flex;justify-content:space-between"><span>Tasks for this stage</span><span>' + done.length + ' of ' + l.tasks.length + ' done</span></div><ul class="tasks">' + (l.tasks.length ? l.tasks.slice().sort(function (a, b) { return (a.done - b.done) || (a.due < b.due ? -1 : 1); }).map(function (t) { var late = !t.done && t.due < new Date().toISOString(); return '<li class="' + (t.done ? 'done' : '') + '"><label class="chk"><input type="checkbox" data-act="lead-task" data-id="' + l.id + '" data-t="' + t.id + '"' + (t.done ? ' checked' : '') + '><span>' + esc(t.title) + '<br><span class="faint" style="font-size:12px">' + esc(t.who) + ' · SLA ' + (t.sla < 1 ? Math.round(t.sla * 60) + ' m' : t.sla + ' h') + '</span></span></label>' + (t.done ? MR.tchip('done', 'ok') : late ? MR.tchip('late', 'bad', 'clock') : MR.tchip('due ' + u.rel(t.due).replace('in ', ''), 'info', 'clock')) + '</li>'; }).join('') : '<li class="faint">No tasks configured for this stage.</li>') + '</ul></div>';
    if (l.visit) h += '<div class="nextms"><span>Site visit · <b>' + esc(MR.userById(l.visit.by).name) + '</b> · ' + u.fdate(l.visit.at.slice(0, 10)) + '</span>' + (l.visit.done ? MR.tchip('done', 'ok', 'check') : MR.tchip('scheduled', 'info', 'clock')) + '</div>';
    if (l.track === 'Turnkey' && si >= 2) h += MR.measureHtml(l.measure, MR.can('lead.edit') ? 'lead-measure' : null, l.id);
    if (l.brief) h += '<div class="preview"><div class="preview-hd">Requirement brief · ' + (l.brief.status === 'approved' ? 'approved by client' : 'draft') + '</div><dl class="pgrid" style="border:0;border-radius:0">' + [['Rooms', esc(l.brief.rooms.join(', '))], ['Style', esc(l.brief.style)], ['Must have', esc(l.brief.must || '—')], ['Avoid', esc(l.brief.avoid || '—')]].map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl></div>';
    if (l.pkg) h += '<div class="nextms"><span>Virtual Design package · <b>' + esc(l.pkg) + '</b></span>' + MR.tchip(u.inr((S().config.packages.filter(function (p) { return p[0] === l.pkg; })[0] || [0, 0, 0])[2]) + ' + GST', 'info') + '</div>';
    if (l.fee) h += '<div class="nextms"><span>Design fee · <b>' + money(l.fee.amount) + '</b> + GST, adjusted against the quote</span>' + (l.fee.paidAt ? MR.tchip('paid ' + u.fshort(l.fee.paidAt.slice(0, 10)), 'ok', 'check') : MR.dueChip(l.fee.due || u.today())) + '</div>';
    var b = S().boards.filter(function (x) { return x.ref === l.quoteId; })[0];
    if (b) h += '<div class="nextms"><span>Design board · <b>' + b.rooms.length + ' rooms</b>, ' + b.rooms.filter(function (r) { return r.status === 'approved'; }).length + ' approved</span><a class="btn ghost sm" href="#/board/' + b.id + '">Open</a></div>';
    if (l.quoteId) { var q = MR.quote(l.quoteId); h += '<div class="chips">' + MR.chipQuote(q) + MR.pill(q.status) + (l.clientId ? MR.chipClient(MR.client(l.clientId)) : '') + '</div>'; }
    h += '<div><div class="wc-k" style="margin-bottom:6px">Timeline</div><ul class="timeline">' + l.remarks.slice().reverse().map(function (m) { return '<li><span class="dot ' + (m.outcome === 'connected' ? 'ok' : m.outcome === 'notinterested' ? 'bad' : 'info') + '"></span><span><b>' + esc(LOUT[m.outcome] || m.outcome) + '</b> · ' + esc(m.note) + '</span><span class="when">' + u.rel(m.at) + '</span></li>'; }).join('') + '<li><span class="dot brand"></span><span><b>Created</b> from ' + esc(l.source) + ' · ' + esc(l.no) + '</span><span class="when">' + u.rel(l.created) + '</span></li></ul></div>';
    return h;
  }
  function openLead(l) {
    MR._openLead = l.id;
    MR.openDrawer('<div class="dlg-hd"><h2 id="drT" style="display:flex;gap:10px;align-items:center"><span class="av av-lg" style="--h:' + MR.hueOf(l.name) + '">' + esc(u.initials(l.name)) + '</span><span>' + esc(l.name) + '<br><span class="muted" style="font:400 12.5px var(--f)">' + esc(l.no + ' · ' + (l.f.property || l.kind) + ' · ' + l.city) + '</span></span></h2>' + MR.xBtn() + '</div><div class="dlg-bd">' + leadBody(l, false) + '</div>');
  }
  MR.openLead = openLead;
  function refreshLead(l) { MR.save(); if (MR.route().p[0] === 'lead') MR.render(); else { MR.render(); if (document.getElementById('drawer').open || MR._openLead === l.id) openLead(l); } }
  MR.act['open-lead'] = function (el, e) { if (e && e.target.closest('input,button:not([data-act=open-lead])')) return; var l = MR.lead(el.dataset.id); if (l) openLead(l); };
  MR.views.lead = function (r) {
    var l = MR.lead(r.p[1]); if (!l) return { html: MR.notFound('That lead does not exist.'), title: 'Lead', crumbs: [['Leads', '#/leads'], ['Not found']], nav: 'leads' };
    var h = '<div class="page narrow" style="max-width:980px"><div class="ph"><div><div class="eyebrow">' + esc(l.no + ' · ' + l.track) + '</div><h1>' + esc(l.name) + '</h1><p class="sub">' + esc((l.f.property || l.kind) + (l.f.area ? ' · ' + u.fnum(l.f.area) + ' sqft' : '') + ' · ' + l.city) + '</p></div></div><section class="panel"><div class="panel-bd stack" style="gap:16px">' + leadBody(l, true) + '</div></section></div>';
    return { html: h, title: l.name, crumbs: [['Leads', '#/leads'], [l.no]], nav: 'leads' };
  };
  MR.act['lead-more'] = function (el) {
    var l = MR.lead(el.dataset.id), msgs = S().config.messages;
    MR.menu(el, '<button type="button" data-act="lead-call" data-id="' + l.id + '">' + ic('phone') + 'Log a call</button><button type="button" data-act="lead-visit" data-id="' + l.id + '">' + ic('pin') + 'Schedule site visit</button><button type="button" data-act="lead-measure" data-id="' + l.id + '">' + ic('edit') + 'Record measurements</button><button type="button" data-act="lead-brief" data-id="' + l.id + '">' + ic('log') + 'Requirement brief</button>' + (l.quoteId ? '' : '<button type="button" data-act="lead-quote" data-id="' + l.id + '">' + ic('quotes') + 'Create quote</button>') + '<hr><div class="mh">Message templates</div>' + msgs.map(function (m, i) { return '<button type="button" data-act="lead-msg" data-id="' + l.id + '" data-i="' + i + '">' + ic('comment') + esc(m[0]) + '</button>'; }).join('') + '<hr><div class="mh">Owner</div>' + MR.USERS.filter(function (x) { return ['pm', 'owner', 'design'].indexOf(x.role) > -1; }).map(function (x) { return '<button type="button" data-act="lead-owner" data-id="' + l.id + '" data-v="' + x.id + '"' + (x.id === l.owner ? ' class="on"' : '') + '>' + MR.avatar(x.id) + esc(x.name) + '</button>'; }).join('') + (open(l) ? '<hr><button type="button" data-act="lead-stage" data-id="' + l.id + '" data-v="lost" style="color:var(--bad)">' + ic('x') + 'Mark lost…</button>' : ''), { right: true });
  };
  MR.act['lead-owner'] = function (el) { var l = MR.lead(el.dataset.id), prev = l.owner; MR.closeMenu(); l.owner = el.dataset.v; MR.audit('lead', l.no, 'reassigned', 'Owner → ' + MR.userById(l.owner).name); refreshLead(l); MR.undoable('Assigned to ' + MR.userById(l.owner).name.split(' ')[0], function () { l.owner = prev; }); };
  MR.act['lead-msg'] = function (el) { var l = MR.lead(el.dataset.id), m = S().config.messages[+el.dataset.i], first = l.name.split(/ & | /)[0]; MR.closeMenu(); MR.copy(MR.sub(m[1]).replace('{first}', first).replace('{me}', MR.me().name.split(' ')[0]).replace('{date}', l.visit ? u.fdate(l.visit.at.slice(0, 10)) : 'Saturday 11 am').replace('{amount}', u.inr((l.fee || {}).amount || 45000)), '“' + m[0] + '” copied for ' + first + '. Paste it into WhatsApp.'); };
  MR.act['lead-task'] = function (el, e) { e.stopPropagation(); var l = MR.lead(el.dataset.id), t = MR.find(l.tasks, el.dataset.t); t.done = el.checked; t.doneAt = el.checked ? new Date().toISOString() : null; MR.audit('lead', l.no, el.checked ? 'task done' : 'task reopened', t.title); refreshLead(l); };
  function lostDlg(l) {
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">Mark ' + esc(l.name) + ' lost</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><label class="field"><span>Reason</span><select class="sel" id="llWhy"><option>Budget below our minimum</option><option>Chose another studio</option><option>Chose a modular-kitchen showroom</option><option>Project postponed</option><option>No response after follow-ups</option></select></label></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('lead-lost-ok', 'Mark lost', { cls: 'pri danger', id: l.id }) + '</div>', 'sm');
  }
  MR.act['lead-lost-ok'] = function (el) { var l = MR.lead(el.dataset.id), prev = l.stage; l.stage = 'lost'; l.lostWhy = document.getElementById('llWhy').value; MR.audit('lead', l.no, 'marked lost', l.lostWhy); MR.closeDlg(); refreshLead(l); MR.undoable(l.name + ' marked lost', function () { l.stage = prev; }); };

  /* ---- call outcome (from the record, the table or calls mode) ---- */
  var OG = [['connected', 'Connected', 'check', 'ok'], ['noanswer', 'No answer', 'phone', 'warn'], ['busy', 'Busy', 'clock', 'warn'], ['callback', 'Call back later', 'clock', 'info'], ['notinterested', 'Not interested', 'x', 'bad'], ['wrong', 'Wrong number', 'flag', 'bad']];
  MR.LOG = OG;
  MR.act['lead-call'] = function (el) {
    var l = MR.lead(el.dataset.id); MR.closeMenu();
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">How did it go with ' + esc(l.name.split(/ & /)[0]) + '?</h2>' + MR.xBtn() + '</div><div class="dlg-bd">' + callForm(l, 'dlg') + '</div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('call-save', 'Save', { cls: 'pri', id: l.id, attrs: ' data-from="dlg"' }) + '</div>');
  };
  function callForm(l, from) {
    var ci = MR._co || {};
    var st = stages(l.track).filter(function (s) { return s[0] !== 'lost'; }), si = stageIdx(l), nxt = st[Math.min(st.length - 2, si + 1)];
    return '<div class="outcomes" role="group" aria-label="Call outcome">' + OG.map(function (o) { return '<button type="button" class="outcome o-' + o[3] + '" data-act="call-out" data-v="' + o[0] + '" aria-pressed="' + (ci.out === o[0]) + '">' + ic(o[2]) + '<span>' + o[1] + '</span></button>'; }).join('') + '</div>' +
      (ci.out === 'connected' && nxt && nxt[0] !== l.stage ? '<label class="chk" style="margin-top:4px"><input type="checkbox" id="callAdv" checked><span>Move to <b>' + esc(nxt[1]) + '</b> and create its tasks</span></label>' : '') +
      (ci.out !== 'notinterested' && ci.out !== 'wrong' ? '<div class="grid2"><label class="field"><span>Next step</span><input class="inp" id="callNext" value="' + esc(ci.out === 'connected' ? ({ new: 'Discovery call', discovery: 'Site visit and measurements', visit: 'Share the scope document', brief: 'Design-fee request', package: 'Send the fee link', fee: 'Check design-fee transfer', quote: 'Walk through the quote' })[l.stage] || 'Follow up' : 'Call again') + '"></label><label class="field"><span>When</span><input class="inp" type="datetime-local" id="callWhen" value="' + localDT(ci.out === 'noanswer' || ci.out === 'busy' ? 3 : 24) + '"></label></div>' : '') +
      '<label class="field"><span>Note for the next person</span><textarea class="ta" id="callNote" rows="3" placeholder="What was said, what they want, anything to watch for"></textarea></label><span class="err" id="callErr" role="alert"></span>';
  }
  function localDT(hours) { var d = new Date(Date.now() + hours * 3600e3); d.setMinutes(0); var p = function (n) { return ('0' + n).slice(-2); }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':00'; }
  MR.act['call-out'] = function (el) {
    MR._co = { out: (MR._co || {}).out === el.dataset.v ? null : el.dataset.v };
    var host = el.closest('.dlg-bd') || el.closest('.side-card');
    var l = MR.lead((document.querySelector('[data-act=call-save]') || {}).dataset ? document.querySelector('[data-act=call-save]').dataset.id : MR._callId);
    var note = (document.getElementById('callNote') || {}).value || '';
    if (host && host.classList.contains('dlg-bd')) { host.innerHTML = callForm(l, 'dlg'); } else { var y = window.scrollY; MR.render(); window.scrollTo(0, y); }
    var n = document.getElementById('callNote'); if (n) { n.value = note; n.focus({ preventScroll: true }); }
  };
  MR.act['call-save'] = function (el) {
    var l = MR.lead(el.dataset.id), co = MR._co || {}, err = document.getElementById('callErr'), note = document.getElementById('callNote').value.trim();
    if (!co.out) { err.textContent = 'Pick how the call went first.'; return; }
    if (note.length < 4 && co.out === 'connected') { err.textContent = 'Add a line for the next person: what they said and what they want.'; document.getElementById('callNote').focus(); return; }
    var nx = document.getElementById('callNext'), wh = document.getElementById('callWhen'), adv = document.getElementById('callAdv');
    var rem = { id: u.uid('rm'), at: new Date().toISOString(), by: MR.me().id, outcome: co.out, note: note || LOUT[co.out] + '.' }, prev = { stage: l.stage, next: l.next, score: l.score };
    l.remarks.push(rem);
    if (nx && wh && wh.value) l.next = { at: new Date(wh.value).toISOString(), text: nx.value.trim() || 'Follow up' };
    if (co.out === 'notinterested' || co.out === 'wrong') { l.stage = 'lost'; l.lostWhy = co.out === 'wrong' ? 'Wrong number' : 'Not interested'; l.next = null; }
    if (adv && adv.checked) { var st = stages(l.track).filter(function (s) { return s[0] !== 'lost'; }); setStage(l, st[Math.min(st.length - 2, stageIdx(l) + 1)][0], true); }
    if (co.out === 'connected' && l.score === 'cold') l.score = 'warm';
    l.tasks.forEach(function (t) { if (!t.done && /Acknowledge|first/i.test(t.title) && co.out === 'connected') { t.done = true; t.doneAt = rem.at; } });
    MR.audit('lead', l.no, 'call logged', LOUT[co.out] + (note ? ': ' + note.slice(0, 80) : ''));
    MR._co = null; MR.save();
    MR.undoable('Call logged for ' + l.name.split(/ & /)[0], function () { l.remarks.pop(); l.stage = prev.stage; l.next = prev.next; l.score = prev.score; });
    if (el.dataset.from === 'dlg') { MR.closeDlg(); refreshLead(l); return; }
    var q = callQueue(), i = q.map(function (x) { return x.id; }).indexOf(l.id), nl = null;
    for (var k = 1; k <= q.length; k++) { var c = q[(i + k) % q.length]; if (c && !doneToday(c)) { nl = c; break; } }
    if (el.dataset.next === '1' && nl) MR.go('#/calls?l=' + nl.id); else MR.render();
  };

  /* =============================== CALLS MODE =============================== */
  function doneToday(l) { var r = lastRemark(l); return !!(r && r.at.slice(0, 10) === u.today()); }
  function callQueue() {
    var end = u.addD(u.today(), 1) + 'T00:00:00', mine = MR.S.role === 'pm' || MR.S.role === 'design';
    return S().leads.filter(function (l) { return open(l) && l.stage !== 'quote' && (!mine || l.owner === MR.me().id || MR.S.role === 'pm') && ((l.stage === 'new' && !l.remarks.length) || (l.next && l.next.at < end) || doneToday(l)); })
      .sort(function (a, b) { var x = a.stage === 'new' && !a.remarks.length ? '0' : a.next ? a.next.at : '9', y = b.stage === 'new' && !b.remarks.length ? '0' : b.next ? b.next.at : '9'; return x < y ? -1 : 1; });
  }
  MR.callQueue = callQueue;
  MR.views.calls = function (r) {
    var q = callQueue();
    if (!q.length) return { html: '<div class="page narrow"><section class="panel">' + MR.empty('phone', 'No calls due today', 'Follow-ups you schedule on leads land here, oldest first. New enquiries jump to the top.', '<a class="btn" href="#/leads">Open leads</a>') + '</section></div>', title: 'Calls', crumbs: [['Calls']], nav: 'calls' };
    var idx = 0; q.forEach(function (x, j) { if (x.id === r.qs.l) idx = j; }); if (!r.qs.l) { var ft = q.map(doneToday).indexOf(false); if (ft > -1) idx = ft; }
    var l = q[idx]; MR._callId = l.id; if (MR._coFor !== l.id) { MR._co = null; MR._coFor = l.id; }
    var done = q.filter(doneToday).length;
    var h = '<div class="page wide" style="max-width:1480px"><div class="fbar"><a class="btn ghost sm" href="#/leads">' + ic('chevl') + '<span>Leads</span></a><h1 class="ft" style="font:600 15px var(--f)">Calls</h1><span class="tchip t-info">Call ' + (idx + 1) + ' of ' + q.length + '</span><span class="fp">' + done + ' of ' + q.length + ' done today</span>' + MR.tchip('≈ ' + Math.max(1, (q.length - done) * 5) + ' m left', '', 'clock') + '<span class="grow"></span><a class="btn sm" href="#/calls?l=' + q[(idx - 1 + q.length) % q.length].id + '">' + ic('chevl') + '<span>Prev</span></a><a class="btn sm" href="#/calls?l=' + q[(idx + 1) % q.length].id + '"><span>Next</span>' + ic('chevr') + '</a></div><div class="focus">';
    h += '<nav class="fq" aria-label="Call list"><div class="fq-hd"><b>Due today <span class="muted" style="font-weight:400">' + q.length + '</span></b><span class="tchip t-ok">' + done + ' done</span></div><div class="fq-list">' + q.map(function (x, j) { return '<a class="fq-it' + (doneToday(x) ? ' done' : '') + '" href="#/calls?l=' + x.id + '" aria-current="' + (j === idx) + '"><b>' + esc(x.name) + '</b><span class="fs"><span>' + esc(stageName(x)) + ' · ' + esc(x.source) + '</span>' + (doneToday(x) ? MR.tchip('done', 'ok', 'check') : sla(x) || nextChip(x)) + '</span></a>'; }).join('') + '</div></nav>';
    h += '<section class="fcard" aria-labelledby="clT"><div class="fcard-hd"><span class="av av-xl" style="--h:' + MR.hueOf(l.name) + '">' + esc(u.initials(l.name)) + '</span><div class="who"><b id="clT">' + esc(l.name) + '</b><span>' + esc(l.no + ' · ' + (l.f.property || l.kind) + ' · ' + l.city) + '</span></div>' + scoreChip(l) + '</div><div class="fcard-bd">' + leadBody(l, true).replace(/<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">.*?<\/div>/, '') + '</div></section>';
    h += '<aside class="stack" style="gap:12px"><div class="dial"><span class="dk">' + (MR._onCall ? 'On the call' : 'Ready to call') + '</span><span class="dn">' + esc(l.name.split(/ & /)[0]) + '</span><span class="dp">' + esc(l.phone || 'No number') + '</span>' + MR.btn('call-dial', MR._onCall ? 'End call' : 'Call ' + esc(l.name.split(/ & | /)[0]), { cls: 'go', icon: 'phone' }) + '<div class="drow">' + MR.btn('lead-msg', 'WhatsApp', { icon: 'comment', id: l.id, attrs: ' data-i="0"' }) + '<a class="btn" href="#/calls?l=' + q[(idx + 1) % q.length].id + '">Skip</a></div><span class="dh">Dial from your phone, then pick how it went.</span></div>';
    h += '<div class="side-card"><h3>How did it go?</h3>' + callForm(l, 'focus') + '<div style="display:flex;gap:8px">' + MR.btn('call-save', 'Save', { id: l.id }) + MR.btn('call-save', 'Save & next', { cls: 'pri', icon: 'arrow', id: l.id, attrs: ' data-next="1" style="flex:1"' }) + '</div></div></aside></div></div>';
    return { html: h, title: 'Calls · ' + l.name, crumbs: [['Leads', '#/leads'], ['Calls']], nav: 'calls', primary: false };
  };
  MR.act['call-dial'] = function () { MR._onCall = !MR._onCall; var y = window.scrollY; MR.render(); window.scrollTo(0, y); };

  /* =============================== NEW LEAD (with assignment rules) =============================== */
  function assign(f) {
    if (f.budget === '₹60 L+') return ['u-kabir', 'Budget band is ₹60 L+'];
    if (f.kind === 'Commercial') return ['u-kabir', 'Project is commercial'];
    if (f.source === 'Instagram') return ['u-naina', 'Source is Instagram'];
    if (f.track === 'Virtual Design') return ['u-tanvi', 'Track is Virtual Design'];
    var n = S().leads.length % 2; return [n ? 'u-naina' : 'u-kabir', 'Round robin'];
  }
  MR.act['new-lead'] = function () {
    MR.closeMenu && MR.closeMenu();
    var c = S().config;
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">New lead</h2>' + MR.xBtn() + '</div><form class="dlg-bd" id="nlForm" novalidate><div class="grid2"><label class="field span2"><span>Name</span><input class="inp" id="nlName" placeholder="Person or company" autofocus></label><label class="field"><span>Phone</span><input class="inp" id="nlPhone" inputmode="tel" placeholder="+91 98xxx xxxxx"></label><label class="field"><span>City or sector</span><input class="inp" id="nlCity" placeholder="Sector 84, Gurugram"></label><label class="field"><span>Track</span><select class="sel" id="nlTrack" data-bind="nl-re">' + c.tracks.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label><label class="field"><span>Source</span><select class="sel" id="nlSource" data-bind="nl-re">' + c.sources.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label><label class="field"><span>Property</span><select class="sel" id="nlProp" data-bind="nl-re">' + c.fields[0].opts.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label><label class="field"><span>Budget band</span><select class="sel" id="nlBudget" data-bind="nl-re"><option value="">Not known yet</option>' + c.fields[2].opts.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label><label class="field span2"><span>What did they ask for?</span><textarea class="ta" id="nlNote" rows="2" placeholder="e.g. Full interiors for a 3BHK, possession in March"></textarea></label></div><p class="callout" id="nlRule"></p><span class="err" id="nlErr"></span></form><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('nl-create', 'Create lead', { cls: 'pri' }) + '</div>');
    MR.bind['nl-re'](); document.getElementById('nlForm').addEventListener('submit', function (e) { e.preventDefault(); MR.act['nl-create'](); });
  };
  function nlVals() { var g = function (id) { return document.getElementById(id).value.trim(); }, prop = g('nlProp'); return { name: g('nlName'), phone: g('nlPhone'), city: g('nlCity'), track: g('nlTrack'), source: g('nlSource'), property: prop, budget: g('nlBudget'), note: g('nlNote'), kind: /Office|Clinic|Café|Preschool/.test(prop) ? 'Commercial' : 'Residential' }; }
  MR.bind['nl-re'] = function () { var v = nlVals(), a = assign(v); document.getElementById('nlRule').innerHTML = ic('user') + 'Will be assigned to <b>' + esc(MR.userById(a[0]).name) + '</b> by the rule “' + esc(a[1]) + '”. First call due within 30 minutes.'; };
  MR.act['nl-create'] = function () {
    var v = nlVals(), err = document.getElementById('nlErr');
    if (v.name.length < 2) { err.textContent = 'Add a name so the team can find this lead.'; document.getElementById('nlName').focus(); return; }
    if (v.phone && !/^\+?[\d\s-]{10,16}$/.test(v.phone)) { err.textContent = 'That phone number looks incomplete.'; document.getElementById('nlPhone').focus(); return; }
    var a = assign(v), n = MR.next('lead'), now = new Date().toISOString();
    var l = { id: 'l-' + u.uid(''), no: 'LD-' + u.pad(n, 4), name: v.name, track: v.track, stage: 'new', source: v.source, owner: a[0], city: v.city || 'Gurugram', state: /Noida|Ghaziabad/i.test(v.city) ? 'UP' : /Delhi/i.test(v.city) ? 'DL' : 'HR', kind: v.kind, created: now, score: v.budget === '₹60 L+' ? 'hot' : v.budget ? 'warm' : 'cold', f: { property: v.property, budget: v.budget }, phone: v.phone, email: '', note: v.note, remarks: [], visit: null, measure: null, brief: null, fee: null, pkg: null, clientId: null, quoteId: null, next: null, lostWhy: '', tasks: [] };
    S().config.tasks.filter(function (t) { return t[0] === l.track && t[1] === 'new'; }).forEach(function (t) { l.tasks.push({ id: u.uid('tk'), stage: 'new', title: t[2], sla: t[3], who: t[4], due: new Date(Date.now() + t[3] * 3600e3).toISOString(), done: false }); });
    S().leads.unshift(l); MR.audit('lead', l.no, 'created', l.name + ' · ' + l.source + ' · assigned by rule “' + a[1] + '”');
    if (a[0] !== MR.me().id) MR.notify(['pm', 'owner'], 'New lead for ' + MR.userById(a[0]).name.split(' ')[0] + ': ' + l.name + ' (' + l.source + '). First call within 30 minutes.', '#/leads?open=' + l.id, 'warn');
    MR.save(); MR.closeDlg(); MR.go('#/leads?open=' + l.id); MR.toast(l.no + ' created and assigned to ' + MR.userById(a[0]).name.split(' ')[0]);
  };

  /* =============================== VISIT, MEASUREMENTS, BRIEF, FEE, QUOTE =============================== */
  MR.act['lead-visit'] = function (el) { var l = MR.lead(el.dataset.id); MR.closeMenu(); MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">Schedule a site visit</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><div class="grid2"><label class="field"><span>When</span><input class="inp" type="datetime-local" id="lvWhen" value="' + localDT(26) + '"></label><label class="field"><span>Site engineer</span><select class="sel" id="lvBy">' + MR.USERS.filter(function (x) { return x.role === 'site'; }).map(function (x) { return '<option value="' + x.id + '">' + esc(x.name) + '</option>'; }).join('') + '</select></label></div><p class="callout">' + ic('clock') + 'The engineer gets it on their Today screen with the address and the survey template.</p></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('lead-visit-ok', 'Schedule visit', { cls: 'pri', id: l.id }) + '</div>', 'sm'); };
  MR.act['lead-visit-ok'] = function (el) { var l = MR.lead(el.dataset.id), at = new Date(document.getElementById('lvWhen').value).toISOString(), by = document.getElementById('lvBy').value; l.visit = { at: at, by: by, done: false }; l.next = { at: at, text: 'Site visit and measurements', kind: 'visit' }; if (stageIdx(l) < 2 && l.track === 'Turnkey') setStage(l, 'visit', true); MR.audit('lead', l.no, 'visit scheduled', u.fdate(at.slice(0, 10)) + ' · ' + MR.userById(by).name); MR.notify(['site'], 'Site visit: ' + l.name + ', ' + l.city + ' on ' + u.fday(at.slice(0, 10)), '#/leads?open=' + l.id, 'info'); MR.closeDlg(); refreshLead(l); MR.toast('Site visit scheduled'); };
  MR.act['lead-visit-done'] = function (el) { var l = MR.lead(el.dataset.id); if (!l.visit) l.visit = { at: new Date().toISOString(), by: 'u-imran' }; l.visit.done = true; MR.audit('lead', l.no, 'visit done', ''); refreshLead(l); MR.act['lead-measure'](el); };
  var MEAS = null;
  function measDlg(title, target) {
    MEAS = { target: target, rooms: JSON.parse(JSON.stringify((target.obj.measure || { rooms: [] }).rooms)), note: (target.obj.measure || {}).note || '' };
    if (!MEAS.rooms.length) MEAS.rooms = (target.obj.brief ? target.obj.brief.rooms : ['Living & dining', 'Kitchen', 'Master bedroom']).map(function (n) { return { name: n, l: 12, w: 10, h: 10, doors: 1, windows: 1, note: '' }; });
    drawMeas(title);
  }
  function drawMeas(title) {
    var a = areas(MEAS);
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">' + esc(title || 'Site measurements') + '</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><p class="muted" style="font-size:13px">Feet, wall to wall. Floor and paint areas update as you type and feed the BOQ quantities.</p><div class="tw"><table class="tbl meas"><thead><tr><th>Room</th><th class="num">L</th><th class="num">W</th><th class="num">H</th><th class="num">Doors</th><th class="num">Win</th><th class="num">Floor</th><th></th></tr></thead><tbody>' + MEAS.rooms.map(function (r, i) { function c(k, w) { return '<td style="width:' + w + 'px"><input class="cell" inputmode="decimal" value="' + r[k] + '" data-bind="meas" data-i="' + i + '" data-k="' + k + '" aria-label="' + k + ' for ' + esc(r.name) + '"></td>'; } return '<tr><td><input class="cell l" value="' + esc(r.name) + '" data-bind="meas" data-i="' + i + '" data-k="name" aria-label="Room name"></td>' + c('l', 60) + c('w', 60) + c('h', 56) + c('doors', 56) + c('windows', 56) + '<td class="num">' + u.fnum(r.l * r.w) + '</td><td class="w0">' + MR.iconBtn('meas-del', 'trash', 'Remove room', { cls: 'sm', attrs: ' data-i="' + i + '"' }) + '</td></tr>'; }).join('') + '</tbody><tfoot><tr><td>' + MEAS.rooms.length + ' rooms</td><td colspan="5" class="num muted">Paint area ' + u.fnum(a.wall) + ' sqft</td><td class="num">' + u.fnum(a.floor) + '</td><td></td></tr></tfoot></table></div><button type="button" class="btn ghost sm" data-act="meas-add">' + ic('plus') + '<span>Add room</span></button><label class="field"><span>Notes</span><textarea class="ta" id="measNote" rows="2" placeholder="Beams, levels, existing wiring, society rules">' + esc(MEAS.note) + '</textarea></label></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('meas-save', 'Save measurements', { cls: 'pri' }) + '</div>', 'lg');
  }
  MR.bind.meas = function (el) { var r = MEAS.rooms[+el.dataset.i], k = el.dataset.k; r[k] = k === 'name' ? el.value : Math.max(0, u.num(el.value)); MEAS.note = document.getElementById('measNote').value; drawMeas(); };
  MR.act['meas-add'] = function () { MEAS.note = document.getElementById('measNote').value; MEAS.rooms.push({ name: 'Room ' + (MEAS.rooms.length + 1), l: 10, w: 10, h: 10, doors: 1, windows: 1, note: '' }); drawMeas(); };
  MR.act['meas-del'] = function (el) { MEAS.note = document.getElementById('measNote').value; MEAS.rooms.splice(+el.dataset.i, 1); drawMeas(); };
  MR.act['meas-save'] = function () {
    var t = MEAS.target, prev = t.obj.measure;
    t.obj.measure = { at: new Date().toISOString(), by: MR.me().id, rooms: MEAS.rooms, photos: (prev || {}).photos || [], note: document.getElementById('measNote').value.trim() };
    MR.audit(t.kind, t.ref, 'measured', MEAS.rooms.length + ' rooms · ' + u.fnum(areas(MEAS).floor) + ' sqft floor');
    if (t.kind === 'lead' && t.obj.stage === 'visit') setStage(t.obj, 'brief', true);
    MR.closeDlg(); MR.save(); if (t.kind === 'lead') refreshLead(t.obj); else MR.render();
    MR.undoable('Measurements saved', function () { t.obj.measure = prev; });
  };
  MR.act['lead-measure'] = function (el) { var l = MR.lead(el.dataset.id); MR.closeMenu(); measDlg('Measurements · ' + l.name, { kind: 'lead', ref: l.no, obj: l }); };
  MR.act['project-measure'] = function (el) { var p = MR.project(el.dataset.id); measDlg('Measurements · ' + p.name.split(',')[0], { kind: 'project', ref: p.code, obj: p }); };
  MR.act['lead-brief'] = function (el) {
    var l = MR.lead(el.dataset.id), b = l.brief || { rooms: (l.measure ? l.measure.rooms.map(function (r) { return r.name; }) : ['Living & dining', 'Kitchen', 'Master bedroom']), style: l.f.style || 'Warm modern', must: '', avoid: '', status: 'draft' }; MR.closeMenu();
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">Requirement brief · ' + esc(l.name) + '</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><label class="field"><span>Rooms in scope</span><input class="inp" id="brRooms" value="' + esc(b.rooms.join(', ')) + '"></label><label class="field"><span>Style</span><select class="sel" id="brStyle">' + S().config.fields[4].opts.map(function (o) { return '<option' + (o === b.style ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select></label><label class="field"><span>Must have</span><textarea class="ta" id="brMust" rows="2" placeholder="Storage, grab rails, puja niche, home office…">' + esc(b.must) + '</textarea></label><label class="field"><span>Avoid</span><input class="inp" id="brAvoid" value="' + esc(b.avoid) + '" placeholder="Glossy laminates, dark wood…"></label></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('brief-save', 'Save draft', { id: l.id }) + MR.btn('brief-save', 'Client approved it', { cls: 'pri', icon: 'check', id: l.id, attrs: ' data-ok="1"' }) + '</div>');
  };
  MR.act['brief-save'] = function (el) {
    var l = MR.lead(el.dataset.id), prev = l.brief, g = function (id) { return document.getElementById(id).value.trim(); };
    l.brief = { rooms: g('brRooms').split(/\s*,\s*/).filter(Boolean), style: g('brStyle'), must: g('brMust'), avoid: g('brAvoid'), status: el.dataset.ok ? 'approved' : 'draft' };
    MR.audit('lead', l.no, el.dataset.ok ? 'brief approved' : 'brief drafted', l.brief.rooms.length + ' rooms · ' + l.brief.style);
    if (el.dataset.ok && l.stage === 'brief') setStage(l, 'fee', true);
    MR.closeDlg(); refreshLead(l); MR.undoable('Brief saved', function () { l.brief = prev; });
  };
  MR.act['lead-fee'] = function (el) { var l = MR.lead(el.dataset.id); MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">Design-fee request</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><label class="field"><span>Amount ₹ (+ 18% GST, SAC 998391)</span><input class="inp" id="feeAmt" inputmode="decimal" value="' + (l.f.area ? Math.round(l.f.area * 30 / 1000) * 1000 : 45000) + '"><small>Studio default: ₹30 per sqft, adjusted against the final quote.</small></label></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('lead-fee-ok', 'Send request', { cls: 'pri', icon: 'send', id: l.id }) + '</div>', 'sm'); };
  MR.act['lead-fee-ok'] = function (el) { var l = MR.lead(el.dataset.id), amt = u.num(document.getElementById('feeAmt').value); if (amt <= 0) return; l.fee = { amount: amt, requestedAt: new Date().toISOString(), paidAt: null, due: u.addD(u.today(), 3) }; MR.audit('lead', l.no, 'design fee requested', u.inr(amt) + ' + GST'); MR.notify(['accounts'], 'Design-fee request sent to ' + l.name + ': ' + u.inr(amt) + ' + GST', '#/leads?open=' + l.id, 'info'); MR.closeDlg(); refreshLead(l); MR.act['lead-msg']({ dataset: { id: l.id, i: '2' } }); };
  MR.act['lead-fee-paid'] = function (el) { var l = MR.lead(el.dataset.id), prev = l.fee.paidAt; l.fee.paidAt = new Date().toISOString(); MR.audit('lead', l.no, 'design fee received', u.inr(l.fee.amount)); if (l.stage === 'fee') setStage(l, l.track === 'Turnkey' ? 'quote' : 'won', true); refreshLead(l); MR.undoable('Design fee marked received', function () { l.fee.paidAt = prev; }); };
  MR.act['lead-quote'] = function (el) {
    var l = MR.lead(el.dataset.id); MR.closeMenu(); MR.closeDrawer();
    var c = l.clientId && MR.client(l.clientId);
    if (!c) { c = { id: 'c' + u.uid(''), name: l.name, kind: l.kind, contact: l.name.split(/ & /)[0], email: l.email, phone: l.phone, addr: l.city, city: l.city.split(',').pop().trim(), state: l.state, gstin: '', source: l.source, note: l.brief ? 'Brief: ' + l.brief.must : '', created: u.today(), owner: l.owner }; S().clients.unshift(c); l.clientId = c.id; MR.audit('client', c.name, 'created', 'From lead ' + l.no); }
    MR._fromLead = l.id; MR.save();
    MR.act['new-quote']({ dataset: { id: c.id } });
    var n = document.getElementById('nqName'); if (n) n.value = l.name.split(/ & | /).pop() + ' residence, ' + (l.f.property || '').replace(' apartment', '');
  };
})();
