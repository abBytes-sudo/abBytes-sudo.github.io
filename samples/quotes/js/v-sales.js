/* Studio OS: clients, quotes, BOQ builder, versions & diff, approvals, rate library. */
(function () {
  'use strict';
  var MR = window.MR, u = MR.u, esc = u.esc, ic = MR.ic;
  MR.views = MR.views || {}; MR.act = MR.act || {}; MR.bind = MR.bind || {}; MR.live = MR.live || {};
  function S() { return MR.S; }
  function money(n) { return MR.money(n); }
  function stateName(k) { return (MR.STATE[k] || { name: k }).name; }

  /* =============================== CLIENTS =============================== */
  function clientStats(c) {
    var s = S(), o = { quotes: 0, open: 0, projects: 0, ltv: 0, due: 0 };
    s.quotes.forEach(function (q) { if (q.clientId !== c.id) return; o.quotes++; if (['draft', 'review', 'approved', 'sent', 'viewed', 'changes', 'rejected'].indexOf(q.status) > -1) o.open++; });
    s.projects.forEach(function (p) { if (p.clientId === c.id) { o.projects++; o.ltv += MR.projValue(p); } });
    s.invoices.forEach(function (iv) { if (iv.clientId === c.id) o.due += MR.invState(iv).balance; });
    return o;
  }
  MR.views.clients = function (r) {
    var kind = r.qs.k || '', q = (r.qs.q || '').toLowerCase();
    var list = S().clients.filter(function (c) { return (!kind || c.kind === kind) && (!q || (c.name + ' ' + c.contact + ' ' + c.city + ' ' + c.email).toLowerCase().indexOf(q) > -1); });
    list.sort(function (a, b) { return a.created < b.created ? 1 : -1; });
    var h = '<div class="page"><div class="ph"><div><h1>Clients</h1><p class="sub">Homeowners and businesses across Delhi NCR. Place of supply decides CGST + SGST or IGST on every quote and invoice.</p></div><div class="acts">' + MR.btn('new-client', 'New client', { icon: 'plus' }) + '</div></div>';
    h += '<div class="views">' + [['', 'All'], ['Residential', 'Residential'], ['Commercial', 'Commercial']].map(function (v) { var n = S().clients.filter(function (c) { return !v[0] || c.kind === v[0]; }).length; return '<button type="button" data-act="qs" data-k="k" data-v="' + v[0] + '" aria-pressed="' + (kind === v[0]) + '">' + v[1] + ' <span class="ct">' + n + '</span></button>'; }).join('') + '</div>';
    h += '<div class="tbar"><div class="tsearch">' + ic('search') + '<input class="inp" type="search" placeholder="Search name, contact, city" aria-label="Search clients" value="' + esc(r.qs.q || '') + '" data-bind="qs-q"></div><span class="grow"></span><span class="muted">' + list.length + ' clients</span></div>';
    if (!list.length) h += MR.empty('clients', 'No clients match', 'Clear the search, or add the client now. You can start a quote for them straight away.', MR.btn('new-client', 'New client', { icon: 'plus', cls: 'pri' }));
    else h += '<div class="tw"><table class="tbl"><thead><tr><th>Client</th><th class="hide-sm">Type</th><th class="hide-sm">City</th><th class="num">Open quotes</th><th class="num hide-sm">Projects</th><th class="num">Contract value</th><th class="num hide-sm">Outstanding</th><th class="hide-sm">Owner</th></tr></thead><tbody>' + list.map(function (c) {
      var st = clientStats(c);
      return '<tr class="click" data-href="#/client/' + c.id + '"><td><a class="rl" href="#/client/' + c.id + '">' + esc(c.name) + '</a><span class="sub">' + esc(c.contact) + '</span></td><td class="hide-sm"><span class="tag">' + esc(c.kind) + '</span></td><td class="hide-sm">' + esc(c.city) + ' <span class="faint">' + esc(c.state) + '</span></td><td class="num">' + (st.open || '<span class="faint">0</span>') + '</td><td class="num hide-sm">' + (st.projects || '<span class="faint">0</span>') + '</td><td class="num">' + (st.ltv ? money(st.ltv) : '<span class="faint">—</span>') + '</td><td class="num hide-sm' + (st.due ? '' : ' faint') + '">' + (st.due ? money(st.due) : '—') + '</td><td class="hide-sm">' + MR.avatar(c.owner) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
    return { html: h + '</div>', title: 'Clients', crumbs: [['Clients']], nav: 'clients' };
  };
  MR.act.qs = function (el) { MR.setQS(el.dataset.k, el.dataset.v); };
  MR.bind['qs-q'] = function (el) { MR.setQS('q', el.value); };

  function attr(c, k, label, type, opts) {
    var v = c[k] == null ? '' : c[k], id = 'ca-' + k, ro = !MR.can('client.edit');
    var ctl;
    if (ro) ctl = '<span>' + (esc(v) || '<span class="faint">Not on file</span>') + '</span>';
    else if (!v && type !== 'area' && type !== 'select') ctl = (k === 'gstin' && c.kind !== 'Commercial') ? '<span class="muted">Unregistered (homeowner)</span> ' + MR.addIn('client', c.id, k, 'GSTIN', '07AAKFS4417M1Z3') : MR.addIn('client', c.id, k, label.toLowerCase(), '');
    else if (type === 'select') ctl = '<select id="' + id + '" class="ed" data-bind="client-attr" data-id="' + c.id + '" data-k="' + k + '" aria-label="' + esc(label) + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === v ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
    else if (type === 'area') ctl = '<textarea id="' + id + '" class="ed" rows="3" data-bind="client-attr" data-id="' + c.id + '" data-k="' + k + '" aria-label="' + esc(label) + '" placeholder="Add a note">' + esc(v) + '</textarea>';
    else ctl = '<input id="' + id + '" class="ed" type="text" value="' + esc(v) + '" data-bind="client-attr" data-id="' + c.id + '" data-k="' + k + '" aria-label="' + esc(label) + '" placeholder="Empty">';
    return MR.kv(label, ctl);
  }
  MR.bind['client-attr'] = function (el) {
    var c = MR.client(el.dataset.id), k = el.dataset.k, v = el.value.trim();
    if (k === 'email' && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { MR.toast('That email looks incomplete. Check for a missing @ or domain.', { kind: 'bad' }); el.value = c[k]; return; }
    if (k === 'gstin' && v && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v.toUpperCase())) { MR.toast('A GSTIN has 15 characters, like 07AAKFS4417M1Z3.', { kind: 'bad' }); el.value = c[k]; return; }
    if (k === 'gstin') v = v.toUpperCase();
    if (k === 'name' && !v) { el.value = c.name; MR.toast('A client needs a name.', { kind: 'bad' }); return; }
    MR.setField(c, k, v, ({ contact: 'Contact', email: 'Email', phone: 'Phone', addr: 'Address', city: 'City', state: 'State', gstin: 'GSTIN', source: 'Source', owner: 'Owner', note: 'Note', name: 'Name', kind: 'Type' })[k] || k, 'client', c.name);
    MR.render();
  };
  MR.views.client = function (r) {
    var c = MR.client(r.p[1]); if (!c) return { html: MR.notFound('That client does not exist.'), title: 'Client', crumbs: [['Clients', '#/clients'], ['Not found']], nav: 'clients' };
    var st = clientStats(c), tab = r.qs.tab || 'quotes';
    var qs = S().quotes.filter(function (q) { return q.clientId === c.id; }), ps = S().projects.filter(function (p) { return p.clientId === c.id; }), ivs = S().invoices.filter(function (iv) { return iv.clientId === c.id; });
    var h = '<div class="page"><div class="cols" style="grid-template-columns:340px minmax(0,1fr)"><aside class="stack">';
    h += '<section class="panel"><div class="panel-bd"><div style="display:flex;gap:12px;align-items:center;margin-bottom:12px"><span class="av av-xl" style="--h:' + (c.kind === 'Commercial' ? 210 : 24) + '">' + esc(u.initials(c.name)) + '</span><div style="min-width:0"><h1 style="font:500 22px/1.15 var(--serif)">' + esc(c.name) + '</h1><span class="muted" style="font-size:12px">' + esc(c.kind) + ' · client since ' + u.fdate(c.created) + '</span></div></div>';
    h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:4px 0 8px">' + [['Quotes', st.quotes], ['Projects', st.projects], ['Value', MR.can('money.view') ? u.lakh(st.ltv) : '—']].map(function (x) { return '<div style="background:var(--surface-2);border:1px solid var(--line);border-radius:6px;padding:8px 10px"><div class="muted" style="font-size:11px">' + x[0] + '</div><div style="font:500 18px/1.2 var(--serif)">' + x[1] + '</div></div>'; }).join('') + '</div>';
    h += '<dl class="kvs">' + attr(c, 'contact', 'Contact') + attr(c, 'email', 'Email') + attr(c, 'phone', 'Phone') + attr(c, 'addr', 'Site address') + attr(c, 'city', 'City') + attr(c, 'state', 'State', 'select', [['HR', 'Haryana (06)'], ['DL', 'Delhi (07)'], ['UP', 'Uttar Pradesh (09)']]) + attr(c, 'kind', 'Type', 'select', [['Residential', 'Residential'], ['Commercial', 'Commercial']]) + attr(c, 'gstin', 'GSTIN') + attr(c, 'source', 'Source') + attr(c, 'owner', 'Owner', 'select', MR.USERS.filter(function (x) { return x.role === 'pm' || x.role === 'owner'; }).map(function (x) { return [x.id, x.name]; })) + attr(c, 'note', 'Notes', 'area') + '</dl>';
    h += '<p class="callout" style="margin-top:10px">' + ic('edit') + 'Click any value to edit. Changes are logged and can be undone with ⌘Z.</p></div></section></aside><div style="min-width:0">';
    h += '<div class="ph" style="margin-bottom:8px"><div><div class="eyebrow">' + esc(c.city) + ' · ' + esc(stateName(c.state)) + (c.gstin ? ' · GSTIN ' + esc(c.gstin) : '') + '</div></div><div class="acts">' + MR.btn('new-quote', 'New quote', { icon: 'plus', cls: 'pri', id: c.id }) + '</div></div>';
    h += '<nav class="tabs" aria-label="Client sections">' + [['quotes', 'Quotes', qs.length], ['projects', 'Projects', ps.length], ['invoices', 'Invoices', ivs.length], ['activity', 'Activity']].filter(function (t) { return t[0] !== 'invoices' || MR.can('finance.view'); }).map(function (t) { return '<a href="#/client/' + c.id + '?tab=' + t[0] + '"' + (tab === t[0] ? ' aria-current="page"' : '') + '>' + t[1] + (t[2] != null ? ' <span class="ct">' + t[2] + '</span>' : '') + '</a>'; }).join('') + '</nav>';
    if (tab === 'quotes') h += qs.length ? quoteTable(qs, true) : MR.empty('quotes', 'No quotes yet', 'Start one from a template. It takes about four minutes for a 3BHK.', MR.btn('new-quote', 'New quote', { cls: 'pri', icon: 'plus', id: c.id }));
    else if (tab === 'projects') h += ps.length ? '<div class="pjgrid">' + ps.map(MR.projCard).join('') + '</div>' : MR.empty('projects', 'No projects yet', 'A project appears here when a quote is signed and converted.');
    else if (tab === 'invoices') h += ivs.length ? MR.invoiceTable(ivs) : MR.empty('invoice', 'No invoices', 'Invoices are raised from a project’s payment schedule.');
    else {
      var refs = qs.map(function (q) { return q.no; }).concat(ps.map(function (p) { return p.code; })).concat(ivs.map(function (i) { return i.no; }));
      var acts = S().audit.filter(function (a) { return a.ref === c.name || refs.some(function (x) { return a.ref.indexOf(x) === 0; }); });
      h += '<section class="panel"><div class="panel-bd">' + (acts.length ? MR.feedHtml(acts, 60) : '<p class="muted">No activity yet.</p>') + '</div></section>';
    }
    h += '</div></div></div>';
    return { html: h, title: c.name, crumbs: [['Clients', '#/clients'], [c.name]], nav: 'clients' };
  };

  /* =============================== QUOTES LIST =============================== */
  var OPEN = ['draft', 'review', 'approved', 'sent', 'viewed', 'changes', 'rejected'];
  var QVIEWS = [
    ['open', 'Open', function (q) { return OPEN.indexOf(q.status) > -1; }],
    ['mine', 'Mine', function (q) { return q.owner === MR.me().id && OPEN.indexOf(q.status) > -1; }],
    ['review', 'In review', function (q) { return q.status === 'review'; }],
    ['waiting', 'With client', function (q) { return ['sent', 'viewed', 'changes'].indexOf(q.status) > -1; }],
    ['won', 'Won', function (q) { return q.status === 'signed' || q.status === 'converted'; }],
    ['lost', 'Lost', function (q) { return q.status === 'lost'; }],
    ['all', 'All', function () { return true; }]
  ];
  function quoteTable(list, compact) {
    var mv = MR.can('money.view');
    return '<div class="tw"><table class="tbl" id="qtbl"><thead><tr>' + (compact ? '' : '<th class="chkc"><input type="checkbox" aria-label="Select all quotes" data-act="q-all"></th>') + '<th>Quote</th>' + (compact ? '' : '<th class="hide-sm">Client</th>') + '<th>Status</th><th class="hide-sm">Version</th><th class="num">Value</th>' + (mv ? '<th class="num hide-sm">Margin</th>' : '') + '<th class="hide-sm">Owner</th><th class="hide-sm">Updated</th></tr></thead><tbody>' + list.map(function (q) {
      var c = MR.calc(q), cl = MR.client(q.clientId), v = MR.ver(q), upd = v.signedAt || v.viewedAt || v.sentAt || v.submittedAt || v.created;
      if (q.sig) upd = q.sig.at;
      var cm = q.comments.filter(function (x) { return x.by === 'client' && x.v === v.n; }).length;
      return '<tr class="click" data-href="#/quote/' + q.id + '" data-id="' + q.id + '">' + (compact ? '' : '<td class="chkc"><input type="checkbox" aria-label="Select ' + esc(q.no) + '" data-act="q-sel" data-id="' + q.id + '"' + (selQ[q.id] ? ' checked' : '') + '></td>') + '<td><a class="rl" href="#/quote/' + q.id + '">' + esc(q.name) + '</a><span class="sub">' + esc(q.no) + (cm ? ' · ' + cm + ' client comment' + (cm > 1 ? 's' : '') : '') + '</span></td>' + (compact ? '' : '<td class="hide-sm">' + esc(cl.name) + '</td>') + '<td>' + MR.pill(q.status) + '</td><td class="hide-sm"><span class="tag">v' + v.n + '</span></td><td class="num">' + money(c.taxable) + '</td>' + (mv ? '<td class="num hide-sm ' + (c.margin < 0.22 ? 'bad' : '') + '">' + u.pct(c.margin * 100, 1) + '</td>' : '') + '<td class="hide-sm">' + MR.avatar(q.owner) + '</td><td class="hide-sm muted nowrap">' + u.rel(upd) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  var selQ = {};
  MR.views.quotes = function (r) {
    var saved = (MR.prefs.qviews || []);
    var vk = r.qs.view || 'open', q = (r.qs.q || '').toLowerCase(), owner = r.qs.owner || '';
    var vdef = QVIEWS.filter(function (v) { return v[0] === vk; })[0], sv = saved.filter(function (s) { return s.id === vk; })[0];
    if (sv) { q = q || sv.q; owner = owner || sv.owner; vdef = QVIEWS.filter(function (v) { return v[0] === sv.base; })[0]; }
    vdef = vdef || QVIEWS[0];
    var list = S().quotes.filter(function (x) { var cl = MR.client(x.clientId); return vdef[2](x) && (!owner || x.owner === owner) && (!q || (x.no + ' ' + x.name + ' ' + cl.name + ' ' + x.city).toLowerCase().indexOf(q) > -1); });
    list.sort(function (a, b) { return a.created < b.created ? 1 : -1; });
    var tot = list.reduce(function (a, x) { return a + MR.qTotal(x); }, 0);
    var h = '<div class="page"><div class="ph"><div><h1>Quotes</h1><p class="sub">BOQ quotes by room, versioned. Every version is approved internally before the client link goes out.</p></div><div class="acts">' + MR.btn('new-quote', 'New quote', { icon: 'plus', cls: 'pri', kbd: 'C' }) + '</div></div>';
    h += '<div class="views" role="toolbar" aria-label="Saved views">' + QVIEWS.map(function (v) { return '<a href="#/quotes?view=' + v[0] + '"' + (vk === v[0] ? ' aria-current="page"' : '') + '>' + v[1] + ' <span class="ct">' + S().quotes.filter(v[2]).length + '</span></a>'; }).join('') + saved.map(function (s) { return '<a href="#/quotes?view=' + s.id + '"' + (vk === s.id ? ' aria-current="page"' : '') + '>' + ic('star') + esc(s.name) + '</a>'; }).join('') + '</div>';
    h += '<div class="tbar"><div class="tsearch">' + ic('search') + '<input class="inp" type="search" placeholder="Search quote, client, city" aria-label="Search quotes" value="' + esc(r.qs.q || '') + '" data-bind="qs-q"></div><select class="sel" style="width:auto" aria-label="Owner" data-bind="q-owner"><option value="">Any owner</option>' + MR.USERS.filter(function (x) { return x.role === 'pm' || x.role === 'owner'; }).map(function (x) { return '<option value="' + x.id + '"' + (owner === x.id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select>' + ((r.qs.q || r.qs.owner) && !sv ? MR.btn('save-view', 'Save view', { icon: 'star', cls: 'ghost sm' }) : '') + (sv ? MR.btn('del-view', 'Remove view', { cls: 'ghost sm', id: sv.id }) : '') + '<span class="grow"></span><span class="muted">' + list.length + ' quotes' + (MR.can('money.view') ? ' · ' + u.lakh(tot) + ' + GST' : '') + '</span></div>';
    h += list.length ? quoteTable(list) : MR.empty('quotes', vk === 'review' ? 'Nothing waiting for approval' : 'No quotes here', vk === 'review' ? 'Submitted quotes show up here for the owner.' : 'Try another view, or start a new quote from a template.', MR.btn('new-quote', 'New quote', { cls: 'pri', icon: 'plus' }));
    h += '<div class="bulk" id="bulk" role="region" aria-label="Bulk actions"><b id="bulkN"></b>' + MR.btn('bulk-owner', 'Assign') + MR.btn('bulk-lost', 'Mark lost') + MR.btn('bulk-csv', 'Export CSV') + '<button type="button" class="icon-btn" style="color:#fff" data-act="bulk-clear" aria-label="Clear selection">' + ic('x') + '</button></div>';
    return { html: h + '</div>', title: 'Quotes', crumbs: [['Quotes']], nav: 'quotes', after: function () { syncBulk(); } };
  };
  MR.bind['q-owner'] = function (el) { MR.setQS('owner', el.value); };
  function syncBulk() { var n = Object.keys(selQ).filter(function (k) { return selQ[k]; }).length, b = document.getElementById('bulk'); if (!b) return; b.classList.toggle('on', n > 0); document.getElementById('bulkN').textContent = n + ' selected'; document.querySelectorAll('#qtbl tbody tr').forEach(function (tr) { tr.classList.toggle('selrow', !!selQ[tr.dataset.id]); }); }
  MR.act['q-sel'] = function (el, e) { e.stopPropagation(); selQ[el.dataset.id] = el.checked; syncBulk(); };
  MR.act['q-all'] = function (el) { document.querySelectorAll('#qtbl tbody input[type=checkbox]').forEach(function (c) { c.checked = el.checked; selQ[c.dataset.id] = el.checked; }); syncBulk(); };
  MR.act['bulk-clear'] = function () { selQ = {}; MR.render(); };
  function selected() { return S().quotes.filter(function (q) { return selQ[q.id]; }); }
  MR.act['bulk-csv'] = function () { MR.csv('quotes.csv', [['Quote', 'Project', 'Client', 'Status', 'Version', 'Taxable value', 'GST', 'Total', 'Margin %', 'Owner']].concat(selected().map(function (q) { var c = MR.calc(q); return [q.no, q.name, MR.client(q.clientId).name, MR.QSTATUS[q.status][0], 'v' + MR.ver(q).n, Math.round(c.taxable), Math.round(c.gst), Math.round(c.total), (c.margin * 100).toFixed(1), MR.userById(q.owner).name]; }))); };
  MR.act['bulk-owner'] = function (el) {
    MR.menu(el, '<div class="mh">Assign ' + selected().length + ' quotes to</div>' + MR.USERS.filter(function (x) { return x.role === 'pm' || x.role === 'owner'; }).map(function (x) { return '<button type="button" data-act="bulk-owner-set" data-id="' + x.id + '">' + MR.avatar(x.id) + esc(x.name) + '</button>'; }).join(''), { up: true });
  };
  MR.act['bulk-owner-set'] = function (el) {
    var list = selected(), prev = list.map(function (q) { return q.owner; }), to = el.dataset.id;
    list.forEach(function (q) { q.owner = to; MR.audit('quote', q.no, 'reassigned', 'Owner → ' + MR.userById(to).name); });
    MR.closeMenu(); selQ = {}; MR.save(); MR.render();
    MR.undoable(list.length + ' quotes assigned to ' + MR.userById(to).name.split(' ')[0], function () { list.forEach(function (q, i) { q.owner = prev[i]; }); });
  };
  MR.act['bulk-lost'] = function () {
    var list = selected().filter(function (q) { return OPEN.indexOf(q.status) > -1; });
    if (!list.length) { MR.toast('Only open quotes can be marked lost.', { kind: 'bad' }); return; }
    MR.confirm('Mark ' + list.length + ' quote' + (list.length > 1 ? 's' : '') + ' lost?', 'They move to the Lost view and count against the win rate. You can undo this straight after.', 'Mark lost', function () {
      var prev = list.map(function (q) { return q.status; });
      list.forEach(function (q) { q.status = 'lost'; q.lostWhy = 'Bulk: no response'; MR.audit('quote', q.no, 'marked lost', 'Bulk action'); });
      selQ = {}; MR.save(); MR.render();
      MR.undoable(list.length + ' marked lost', function () { list.forEach(function (q, i) { q.status = prev[i]; }); });
    }, true);
  };
  MR.act['save-view'] = function () {
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">Save this view</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><label class="field"><span>Name</span><input class="inp" id="svName" placeholder="e.g. Gurugram villas" autofocus></label><p class="muted" style="font-size:12px">Saves the current search and owner filter as a tab. Stored in this browser.</p></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('save-view-ok', 'Save view', { cls: 'pri' }) + '</div>', 'sm');
  };
  MR.act['save-view-ok'] = function () {
    var n = document.getElementById('svName').value.trim(); if (!n) { document.getElementById('svName').setAttribute('aria-invalid', 'true'); return; }
    var r = MR.route(), id = 'sv' + Date.now().toString(36);
    MR.prefs.qviews = (MR.prefs.qviews || []).concat([{ id: id, name: n, base: r.qs.view && r.qs.view.indexOf('sv') !== 0 ? r.qs.view : 'open', q: r.qs.q || '', owner: r.qs.owner || '' }]);
    MR.savePrefs(); MR.closeDlg(); MR.go('#/quotes?view=' + id); MR.toast('View “' + n + '” saved');
  };
  MR.act['del-view'] = function (el) { MR.prefs.qviews = (MR.prefs.qviews || []).filter(function (s) { return s.id !== el.dataset.id; }); MR.savePrefs(); MR.go('#/quotes'); };

  /* =============================== NEW QUOTE / CLIENT =============================== */
  MR.act['new-quote'] = function (el) {
    if (MR.S.role === 'site') return;
    var pre = el && el.dataset && el.dataset.id, cls = S().clients.slice().sort(function (a, b) { return a.name < b.name ? -1 : 1; });
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">New quote</h2>' + MR.xBtn() + '</div><form class="dlg-bd" id="nqForm" novalidate>' +
      '<label class="field"><span>Client</span><select class="sel" id="nqClient" autofocus><option value="">Choose a client…</option>' + cls.map(function (c) { return '<option value="' + c.id + '"' + (c.id === pre ? ' selected' : '') + '>' + esc(c.name) + ' · ' + esc(c.city) + '</option>'; }).join('') + '<option value="__new">+ New client…</option></select><span class="err" id="nqErr1"></span></label>' +
      '<label class="field"><span>Project name</span><input class="inp" id="nqName" placeholder="e.g. Gill residence, 3BHK"><span class="err" id="nqErr2"></span></label>' +
      '<div class="grid2"><label class="field"><span>Start from</span><select class="sel" id="nqTpl">' + Object.keys(MR.TPL).map(function (k) { return '<option value="' + k + '">' + esc(MR.TPL[k].name) + '</option>'; }).join('') + '<option value="blank">Blank quote</option></select></label>' +
      '<label class="field"><span>Size</span><select class="sel" id="nqScale"><option value="0.75">Compact (about 0.75×)</option><option value="1" selected>Standard</option><option value="1.3">Large (1.3×)</option><option value="1.6">Very large (1.6×)</option></select></label></div>' +
      '<label class="field"><span>Owner</span><select class="sel" id="nqOwner">' + MR.USERS.filter(function (x) { return x.role === 'pm' || x.role === 'owner'; }).map(function (x) { return '<option value="' + x.id + '"' + (x.id === MR.me().id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select><small>Quantities scale with size. Every line comes from the current rate library, so margin and GST are right from the first draft.</small></label>' +
      '</form><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('nq-create', 'Create draft', { cls: 'pri' }) + '</div>');
    var sel = document.getElementById('nqClient');
    sel.addEventListener('change', function () { if (sel.value === '__new') { MR.act['new-client']({ dataset: { then: 'quote' } }); } else { var c = MR.client(sel.value), n = document.getElementById('nqName'); if (c && !n.value) n.placeholder = c.name.split(/ & | /)[c.kind === 'Commercial' ? 0 : c.name.split(' ').length - 1] + ' residence'; } });
    document.getElementById('nqForm').addEventListener('submit', function (e) { e.preventDefault(); MR.act['nq-create'](); });
  };
  MR.act['nq-create'] = function () {
    var cid = document.getElementById('nqClient').value, name = document.getElementById('nqName').value.trim();
    var e1 = document.getElementById('nqErr1'), e2 = document.getElementById('nqErr2'); e1.textContent = e2.textContent = '';
    if (!cid || cid === '__new') { e1.textContent = 'Pick who this quote is for.'; document.getElementById('nqClient').focus(); return; }
    if (!name) { e2.textContent = 'Give it a name the client will recognise, like “Gill residence, 3BHK”.'; document.getElementById('nqName').setAttribute('aria-invalid', 'true'); document.getElementById('nqName').focus(); return; }
    var c = MR.client(cid), tpl = document.getElementById('nqTpl').value, sc = +document.getElementById('nqScale').value;
    var n = MR.next('q'), q = { id: 'q' + u.uid(''), no: 'Q-' + n, clientId: cid, name: name, tpl: tpl, site: c.addr, city: c.city, state: c.state, owner: document.getElementById('nqOwner').value, status: 'draft', created: new Date().toISOString(), validDays: 30, token: 'mr' + n + Math.random().toString(36).slice(2, 5), versions: [{ n: 1, created: new Date().toISOString(), by: MR.me().id, sections: tpl === 'blank' ? [{ id: u.uid('s'), key: 's-' + u.uid(''), title: 'Living & dining', items: [] }] : MR.buildSections(tpl, sc), discPct: 0, note: 'First draft' }], approvals: [], comments: [], log: [], sig: null, projectId: null, terms: '40/30/25/5' };
    S().quotes.unshift(q);
    if (MR._fromLead) { var fl = MR.lead(MR._fromLead); if (fl) { fl.quoteId = q.id; fl.clientId = cid; if (fl.stage !== 'quote') fl.stage = 'quote'; MR.audit('lead', fl.no, 'quote created', q.no); } MR._fromLead = null; }
    MR.audit('quote', q.no, 'created', 'v1 from ' + (tpl === 'blank' ? 'a blank quote' : 'template “' + MR.TPL[tpl].name + '”'));
    MR.save(); MR.closeDlg(); MR.go('#/quote/' + q.id); MR.toast(q.no + ' created · ' + u.lakh(MR.qTotal(q)) + ' + GST');
  };
  MR.act['new-client'] = function (el) {
    var then = el && el.dataset && el.dataset.then;
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">New client</h2>' + MR.xBtn() + '</div><form class="dlg-bd" id="ncForm" novalidate><div class="grid2"><label class="field span2"><span>Name</span><input class="inp" id="ncName" placeholder="Household or company name" autofocus><span class="err" id="ncErr"></span></label>' +
      '<label class="field"><span>Type</span><select class="sel" id="ncKind"><option>Residential</option><option>Commercial</option></select></label><label class="field"><span>Contact person</span><input class="inp" id="ncContact" placeholder="Who signs off"></label>' +
      '<label class="field"><span>Email</span><input class="inp" id="ncEmail" type="email" placeholder="name@example.com"></label><label class="field"><span>Phone</span><input class="inp" id="ncPhone" inputmode="tel" placeholder="+91 98xxx xxxxx"></label>' +
      '<label class="field span2"><span>Site address</span><input class="inp" id="ncAddr" placeholder="Flat, tower, sector"></label><label class="field"><span>City</span><input class="inp" id="ncCity" placeholder="Gurugram"></label><label class="field"><span>State (place of supply)</span><select class="sel" id="ncState"><option value="HR">Haryana · CGST + SGST</option><option value="DL">Delhi · IGST</option><option value="UP">Uttar Pradesh · IGST</option></select></label>' +
      '<label class="field span2"><span>GSTIN <span class="faint">(commercial clients)</span></span><input class="inp" id="ncGst" placeholder="07AAKFS4417M1Z3" maxlength="15"></label></div></form><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('nc-create', then ? 'Create and continue' : 'Create client', { cls: 'pri', attrs: then ? ' data-then="quote"' : '' }) + '</div>');
    document.getElementById('ncForm').addEventListener('submit', function (e) { e.preventDefault(); MR.act['nc-create']({ dataset: { then: then } }); });
  };
  MR.act['nc-create'] = function (el) {
    var g = function (id) { return document.getElementById(id).value.trim(); }, err = document.getElementById('ncErr');
    if (!g('ncName')) { err.textContent = 'Add a name so the team can find this client.'; document.getElementById('ncName').setAttribute('aria-invalid', 'true'); document.getElementById('ncName').focus(); return; }
    if (g('ncEmail') && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(g('ncEmail'))) { err.textContent = 'That email looks incomplete.'; document.getElementById('ncEmail').focus(); return; }
    var gst = g('ncGst').toUpperCase();
    if (gst && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst)) { err.textContent = 'A GSTIN has 15 characters, like 07AAKFS4417M1Z3.'; document.getElementById('ncGst').focus(); return; }
    var c = { id: 'c' + u.uid(''), name: g('ncName'), kind: g('ncKind'), contact: g('ncContact') || g('ncName'), email: g('ncEmail'), phone: g('ncPhone'), addr: g('ncAddr'), city: g('ncCity') || 'Gurugram', state: g('ncState'), gstin: gst, source: 'Manual', note: '', created: u.today(), owner: MR.me().id };
    S().clients.unshift(c); MR.audit('client', c.name, 'created', c.kind + ' · ' + c.city); MR.save();
    if (el.dataset.then === 'quote') { MR.act['new-quote']({ dataset: { id: c.id } }); MR.toast(c.name + ' added'); }
    else { MR.closeDlg(); MR.go('#/client/' + c.id); MR.toast(c.name + ' added'); }
  };

  /* =============================== QUOTE BUILDER =============================== */
  function editable(q, v) { return v === MR.ver(q) && (q.status === 'draft' || q.status === 'rejected') && MR.can('quote.edit'); }
  MR.qEditable = editable;
  function lineRow(q, v, s, it, ed, idx) {
    var r = it.rateId && MR.rate(it.rateId), stale = r && it.rv < r.hist.length && ed;
    var cms = q.comments.filter(function (c) { return c.key === it.key && c.v === v.n; });
    var mv = MR.can('money.view');
    var h = '<tr id="row-' + it.id + '"' + (MR._flash === it.id ? ' class="flash"' : '') + '><td class="faint" style="width:34px;font-size:11px">' + idx + '</td><td class="it-name">' + (it.code ? '<span class="code">' + esc(it.code) + '</span>' : '<span class="code">CUSTOM</span>') + (ed && !it.rateId ? '<input class="cell l" style="width:calc(100% - 70px)" id="nm-' + it.id + '" value="' + esc(it.name) + '" data-bind="line" data-k="name" data-id="' + it.id + '" aria-label="Item description">' : '<span class="nm">' + esc(it.name) + '</span>') +
      (cms.length ? '<button type="button" class="cm-dot" data-act="line-thread" data-id="' + it.key + '" aria-label="' + cms.length + ' comments on this line">' + ic('comment') + cms.length + '</button>' : '') +
      (stale ? '<button type="button" class="rate-up" data-act="rate-refresh" data-id="' + it.id + '" data-tip="Library rate is now ' + u.inr(MR.sell(r)) + ' (v' + r.hist.length + '). Click to update this line.">' + ic('bolt') + 'v' + r.hist.length + '</button>' : '') + '</td>';
    h += '<td class="faint">' + esc(it.unit) + '</td>';
    function cell(k, val, w, step) { return ed ? '<td style="width:' + w + 'px"><input class="cell" id="' + k + '-' + it.id + '" inputmode="decimal" value="' + val + '" data-bind="line" data-live="line" data-k="' + k + '" data-id="' + it.id + '" aria-label="' + k + '"></td>' : '<td class="num" style="width:' + w + 'px">' + val + '</td>'; }
    h += cell('qty', u.fnum(it.qty), 76) + cell('wst', it.wst || 0, 54) + (mv ? cell('rate', ed ? it.rate : u.fnum(it.rate), 88) + cell('disc', it.disc || 0, 52) + '<td class="amt" id="amt-' + it.id + '">' + u.inr(MR.lineAmt(it)) + '</td>' : '<td></td><td></td><td></td>');
    h += '<td style="width:40px">' + (ed ? MR.iconBtn('line-del', 'trash', 'Remove line', { id: it.id, cls: 'sm' }) : '') + '</td></tr>';
    return h;
  }
  function boqHtml(q, v, ed) {
    var mv = MR.can('money.view'), n = 0;
    var h = '<div class="boq"><div class="boq-wrap"><table><thead><tr><th></th><th>Item</th><th>Unit</th><th class="num">Qty</th><th class="num">' + MR.term('Wastage', 'Wst %') + '</th>' + (mv ? '<th class="num">Rate ₹</th><th class="num">Disc %</th><th class="num">Amount</th>' : '<th></th><th></th><th></th>') + '<th></th></tr></thead><tbody>';
    v.sections.forEach(function (s, si) {
      var tot = MR.secTotal(s);
      h += '<tr class="sec"><td></td><td colspan="6"><div class="st">' + (ed ? '<input class="cell l" style="max-width:320px" id="sec-' + s.id + '" value="' + esc(s.title) + '" data-bind="sec-title" data-id="' + s.id + '" aria-label="Room or area name">' : esc(s.title)) + '<span class="faint" style="font-weight:400;font-size:12px">' + s.items.length + ' items</span></div></td><td class="amt" id="st-' + s.id + '">' + (mv ? u.inr(tot) : '') + '</td><td>' + (ed ? MR.iconBtn('sec-menu', 'more', 'Room actions', { id: s.id, cls: 'sm' }) : '') + '</td></tr>';
      s.items.forEach(function (it) { n++; h += lineRow(q, v, s, it, ed, n); });
      if (ed) h += '<tr class="add-row"><td></td><td colspan="8"><button type="button" class="btn ghost sm" data-act="pick-open" data-id="' + s.id + '">' + ic('plus') + '<span>Add from rate library</span></button> <button type="button" class="btn ghost sm" data-act="line-custom" data-id="' + s.id + '">' + ic('edit') + '<span>Custom line</span></button></td></tr>';
    });
    if (!v.sections.length) h += '<tr><td colspan="9">' + MR.empty('quotes', 'No rooms yet', 'Add a room or area, then pull lines from the rate library.') + '</td></tr>';
    h += '</tbody></table></div>' + (ed ? '<div style="padding:12px;border-top:1px solid var(--line);display:flex;gap:8px;flex-wrap:wrap">' + MR.btn('sec-add', 'Add room or area', { icon: 'plus', cls: 'sm' }) + '<span class="muted" style="font-size:12px;align-self:center">Tip: Tab moves across cells, Enter commits, Esc reverts, ⌘Z undoes.</span></div>' : '') + '</div>';
    return h;
  }
  function summaryHtml(q, v, ed) {
    var c = MR.calc(q, v), mv = MR.can('money.view'), pol = MR.policy(q);
    var h = '<section class="panel sumcard"><div class="panel-hd"><h2>Summary</h2><span class="tag">v' + v.n + '</span></div><div class="panel-bd">';
    if (mv) {
      h += '<div class="row"><span>Subtotal (' + c.lines + ' lines)</span><span id="sumSub">' + u.inr(c.sub) + '</span></div>';
      h += '<div class="row"><span>Discount ' + (ed ? '<input class="cell" style="width:58px;height:24px;display:inline-block" id="discPct" inputmode="decimal" value="' + (v.discPct || 0) + '" data-bind="disc" data-live="disc" aria-label="Discount percent"> %' : (v.discPct || 0) + '%') + '</span><span id="sumDisc">− ' + u.inr(c.disc) + '</span></div>';
      h += '<div class="row"><span>Taxable value</span><span id="sumTax">' + u.inr(c.taxable) + '</span></div>';
      h += c.intra ? '<div class="row"><span>' + MR.term('CGST + SGST', 'CGST 9%') + '</span><span id="sumC">' + u.inr(c.cgst) + '</span></div><div class="row"><span>SGST 9%</span><span id="sumS">' + u.inr(c.sgst) + '</span></div>' : '<div class="row"><span>' + MR.term('IGST', 'IGST 18%') + ' <span class="faint">(' + esc(stateName(q.state)) + ')</span></span><span id="sumI">' + u.inr(c.igst) + '</span></div>';
      h += '<div class="row tot"><span>Total</span><span id="sumTot">' + u.inr(c.total) + '</span></div>';
      h += '<div style="margin-top:14px"><div class="row" style="padding:0"><span>Cost</span><span>' + u.inr(c.cost) + '</span></div><div class="marg" aria-hidden="true"><i style="width:' + Math.max(0, Math.min(100, (1 - c.margin) * 100)) + '%;background:var(--line-3)"></i><i style="width:' + Math.max(0, c.margin * 100) + '%;background:' + (c.margin < 0.22 ? 'var(--bad)' : 'var(--ok)') + '"></i></div><div class="row" style="padding:0"><span>Gross margin</span><b id="sumMarg" class="' + (c.margin < 0.22 ? 'bad' : 'ok') + '">' + u.pct(c.margin * 100, 1) + ' · ' + u.lakh(c.taxable - c.cost) + '</b></div></div>';
    } else h += '<p class="muted">Amounts are hidden for your role. You can see scope, quantities and rooms.</p>';
    h += '</div>';
    if (mv && MR.S.role !== 'accounts') h += '<div class="panel-ft" style="display:block"><b style="font-size:12px;font-weight:600">Approval policy</b><ul class="policy">' + pol.checks.map(function (x) { return '<li class="' + (x[0] ? 'ok' : 'bad') + '">' + ic(x[0] ? 'check' : 'flag') + '<span>' + esc(x[1]) + '</span></li>'; }).join('') + '</ul></div>';
    if (mv) {
      var sch = MR.SCHEDULES[q.terms || '40/30/25/5'];
      h += '<div class="panel-ft" style="display:block"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:12px;font-weight:600">Payment schedule</b>' + (ed ? '<select class="sel" style="width:auto;height:26px;font-size:12px" data-bind="q-terms" data-id="' + q.id + '" aria-label="Payment terms">' + Object.keys(MR.SCHEDULES).map(function (k) { return '<option' + (k === q.terms ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select>' : '<span class="tag">' + esc(q.terms) + '</span>') + '</div><div class="stackbar">' + sch.map(function (s, i) { return '<i style="width:' + s[1] + '%;background:' + ['var(--brand)', '#D88A6A', '#E9B9A3', '#F3DCD0'][i] + '"></i>'; }).join('') + '</div>' + sch.map(function (s) { return '<div class="row" style="padding:3px 0;font-size:12px"><span>' + s[1] + '% · ' + esc(s[0]) + '</span><span>' + u.lakh(c.total * s[1] / 100) + '</span></div>'; }).join('') + '</div>';
    }
    return h + '</section>';
  }
  function statusBanner(q, v) {
    var cl = MR.client(q.clientId), last = q.approvals[q.approvals.length - 1], r = MR.S.role, cur = MR.ver(q);
    if (v !== cur) return '<div class="banner">' + ic('lock') + '<div class="bt"><b>v' + v.n + ' is a locked snapshot</b>' + (v.sentAt ? 'Sent ' + u.fdate(v.sentAt.slice(0, 10)) + '. ' : '') + esc(v.note || '') + '</div><div class="acts"><a class="btn sm" href="#/quote/' + q.id + '/diff?a=' + v.n + '&b=' + cur.n + '">' + ic('diff') + '<span>Compare with v' + cur.n + '</span></a><a class="btn sm" href="#/quote/' + q.id + '">Open v' + cur.n + '</a></div></div>';
    switch (q.status) {
      case 'draft': return '<div class="banner">' + ic('edit') + '<div class="bt"><b>Draft v' + v.n + '</b>' + (r === 'owner' ? 'As owner you can approve your own quote and send it.' : 'Submit for approval when it is ready. Ira reviews margin and discount before the client sees it.') + '</div></div>';
      case 'review': return '<div class="banner violet">' + ic('approve') + '<div class="bt"><b>Waiting for approval</b>' + esc(MR.userById(q.owner).name) + ' submitted v' + v.n + ' ' + u.rel(v.submittedAt) + '.' + (v.submitNote ? ' “' + esc(v.submitNote) + '”' : '') + '</div>' + (r === 'owner' ? '<div class="acts">' + MR.btn('q-reject', 'Return with comments', { cls: 'sm' }) + MR.btn('q-approve', 'Approve', { cls: 'sm pri', icon: 'check' }) + '</div>' : '') + '</div>';
      case 'rejected': return '<div class="banner bad">' + ic('flag') + '<div class="bt"><b>Returned by ' + esc(MR.userById(last.by).name) + ' ' + u.rel(last.at) + '</b>“' + esc(last.comment) + '”</div></div>';
      case 'approved': return '<div class="banner info">' + ic('check') + '<div class="bt"><b>Approved by ' + esc(MR.userById(last.by).name) + '</b>' + (last.comment ? '“' + esc(last.comment) + '” ' : '') + 'Send the client link when you are ready.</div><div class="acts">' + MR.btn('q-send', 'Send to client', { cls: 'sm pri', icon: 'send' }) + '</div></div>';
      case 'sent': return '<div class="banner info">' + ic('send') + '<div class="bt"><b>Sent to ' + esc(cl.contact.split(' (')[0]) + ' ' + u.rel(v.sentAt) + '</b>Not opened yet. The link shows v' + v.n + ' with line comments, change requests and e-sign.</div><div class="acts">' + MR.btn('q-copy', 'Copy link', { cls: 'sm', icon: 'link' }) + '</div></div>';
      case 'viewed': var cm = q.comments.filter(function (c) { return c.v === v.n && c.by === 'client'; }).length; return '<div class="banner info">' + ic('eye') + '<div class="bt"><b>' + esc(cl.contact.split(' (')[0]) + ' opened v' + v.n + ' ' + u.rel(v.viewedAt) + '</b>' + (cm ? cm + ' line comment' + (cm > 1 ? 's' : '') + ' so far. Reply in the thread or make v' + (v.n + 1) + '.' : 'No comments yet.') + '</div><div class="acts">' + MR.btn('q-copy', 'Copy link', { cls: 'sm', icon: 'link' }) + (MR.can('quote.edit') ? MR.btn('q-newver', 'Make v' + (v.n + 1), { cls: 'sm' }) : '') + '</div></div>';
      case 'changes': var cr = q.comments.filter(function (c) { return c.kind === 'changes' && c.v === v.n; }).pop(); return '<div class="banner warn">' + ic('edit') + '<div class="bt"><b>' + esc(cl.contact.split(' (')[0]) + ' asked for changes</b>' + (cr ? '“' + esc(cr.text) + '”' : '') + '</div><div class="acts">' + (MR.can('quote.edit') ? MR.btn('q-newver', 'Make v' + (v.n + 1), { cls: 'sm pri' }) : '') + '</div></div>';
      case 'signed': return '<div class="banner ok">' + ic('sign') + '<div class="bt"><b>Signed by ' + esc(q.sig.name) + ' ' + u.rel(q.sig.at) + '</b>e-signed v' + q.sig.v + ' (' + q.sig.mode + ' signature). Convert it to a project to plan milestones and billing.</div><div class="acts">' + (MR.can('project.edit') ? MR.btn('q-convert', 'Convert to project', { cls: 'sm pri', icon: 'arrow' }) : '') + '</div></div>';
      case 'converted': return '<div class="banner ok">' + ic('check') + '<div class="bt"><b>Signed by ' + esc(q.sig.name) + ' and converted</b>Now project ' + esc(MR.project(q.projectId).code) + '.</div><div class="acts"><a class="btn sm" href="#/project/' + q.projectId + '">Open project ' + ic('arrow') + '</a></div></div>';
      case 'lost': return '<div class="banner">' + ic('x') + '<div class="bt"><b>Lost</b>' + esc(q.lostWhy || '') + '</div><div class="acts">' + (MR.can('quote.edit') ? MR.btn('q-reopen', 'Reopen', { cls: 'sm' }) : '') + '</div></div>';
    }
    return '';
  }
  function threadHtml(q) {
    var items = [];
    q.comments.forEach(function (c) { items.push({ at: c.at, who: c.by === 'client' ? 'client' : c.by, name: c.who, text: c.text, key: c.key, v: c.v, kind: c.kind }); });
    q.approvals.forEach(function (a) { if (a.comment) items.push({ at: a.at, who: a.by, name: MR.userById(a.by).name, text: (a.decision === 'approved' ? 'Approved v' + a.v + ': ' : 'Returned v' + a.v + ': ') + a.comment }); });
    items.sort(function (a, b) { return a.at < b.at ? -1 : 1; });
    if (!items.length) return '<p class="muted" style="font-size:12px">No comments yet. Client comments on lines and approval notes collect here.</p>';
    return '<div class="thread">' + items.slice(-8).map(function (m) {
      var line = m.key && findLine(q, m.key);
      return '<div class="msg ' + (m.who === 'client' ? 'client' : '') + '">' + (m.who === 'client' ? '<span class="av" style="--h:200">' + esc(u.initials(m.name)) + '</span>' : MR.avatar(m.who)) + '<div class="mb"><div class="mh"><b>' + esc(m.name) + '</b><span>' + u.rel(m.at) + '</span></div>' + (line ? '<div class="faint" style="font-size:11px;margin-bottom:2px">On ' + esc(line.code || '') + ' ' + esc(line.name.slice(0, 40)) + ' · v' + m.v + '</div>' : '') + esc(m.text) + '</div></div>';
    }).join('') + '</div>';
  }
  function findLine(q, key) { var v = MR.ver(q); for (var i = 0; i < v.sections.length; i++) for (var j = 0; j < v.sections[i].items.length; j++) if (v.sections[i].items[j].key === key) return v.sections[i].items[j]; for (var a = 0; a < q.versions.length; a++) { var vv = q.versions[a]; for (var b = 0; b < vv.sections.length; b++) for (var c = 0; c < vv.sections[b].items.length; c++) if (vv.sections[b].items[c].key === key) return vv.sections[b].items[c]; } return null; }
  MR.findLine = findLine;

  MR.views.quote = function (r) {
    var q = MR.quote(r.p[1]); if (!q) return { html: MR.notFound('That quote does not exist.'), title: 'Quote', crumbs: [['Quotes', '#/quotes'], ['Not found']], nav: 'quotes' };
    if (r.p[2] === 'diff') return diffView(q, r);
    var v = r.qs.v ? q.versions[+r.qs.v - 1] || MR.ver(q) : MR.ver(q), ed = editable(q, v), cl = MR.client(q.clientId);
    var h = '<div class="page wide" style="max-width:1480px"><div class="qhead"><div><div class="eyebrow">' + esc(q.no) + ' <span class="sep-dot"></span>' + MR.term('BOQ', 'BOQ quote') + ' <span class="sep-dot"></span>' + esc(cl.kind) + ' <span class="sep-dot"></span>' + esc(q.city) + ' (' + esc(q.state) + ')</div>';
    h += (ed ? '<h1><input class="ed" style="font:inherit;margin:0 -7px;width:100%" id="qName" value="' + esc(q.name) + '" data-bind="q-name" data-id="' + q.id + '" aria-label="Quote name"></h1>' : '<h1>' + esc(q.name) + '</h1>');
    h += '<div class="qmeta">' + MR.pill(q.status) + MR.chipClient(cl) + '<span>' + ic('pin') + ' ' + esc(q.site) + '</span><span>' + MR.avatar(q.owner) + ' ' + esc(MR.userById(q.owner).name) + '</span><span>' + ic('clock') + ' Valid till ' + u.fdate(u.addD((v.sentAt || v.created).slice(0, 10), q.validDays)) + '</span></div></div>';
    h += '<div class="acts" style="display:flex;gap:8px;flex-wrap:wrap">' + primaryActs(q) + '<a class="btn" href="#/q/' + q.token + '?preview=1">' + ic('eye') + '<span>Client view</span></a>' + MR.iconBtn('q-more', 'more', 'More actions', { id: q.id }) + '</div></div>';
    h += '<div class="vtabs" role="tablist" aria-label="Versions">' + q.versions.map(function (x) { var st = x.sentAt ? 'sent ' + u.fshort(x.sentAt.slice(0, 10)) : x === MR.ver(q) ? MR.QSTATUS[q.status][0].toLowerCase() : 'draft'; if (q.sig && q.sig.v === x.n) st = 'signed'; return '<a class="vtab" role="tab" href="#/quote/' + q.id + (x === MR.ver(q) ? '' : '?v=' + x.n) + '"' + (x === v ? ' aria-current="page" aria-selected="true"' : ' aria-selected="false"') + '>v' + x.n + ' <span class="vt-s">' + esc(st) + '</span>' + (MR.can('money.view') ? ' <span class="vt-s">· ' + u.lakh(MR.calc(q, x).taxable) + '</span>' : '') + '</a>'; }).join('') + (q.versions.length > 1 ? '<a class="btn sm ghost" href="#/quote/' + q.id + '/diff?a=1&b=' + q.versions.length + '">' + ic('diff') + '<span>Compare versions</span></a>' : '') + '</div>';
    var QS = ['Draft', 'Ira approves', 'With client', 'Signed', 'Project'], qi = { draft: 0, rejected: 0, review: 1, approved: 1, sent: 2, viewed: 2, changes: 2, signed: 3, converted: 4, lost: 2 }[q.status];
    if (v === MR.ver(q)) h += MR.stepper(QS, qi === 1 && q.status === 'approved' ? 2 : qi, 'Quote progress');
    h += statusBanner(q, v);
    h += '<div class="cols qcols"><div style="min-width:0">' + boqHtml(q, v, ed) + (v.note ? '<p class="callout" style="margin-top:10px">' + ic('comment') + 'v' + v.n + ' note: ' + esc(v.note) + '</p>' : '') + '</div>';
    h += '<aside class="stack" style="position:sticky;top:calc(var(--dh) + var(--th) + 16px)">' + summaryHtml(q, v, ed) + '<section class="panel"><div class="panel-hd"><h3>Conversation</h3><span class="muted">' + q.comments.length + '</span></div><div class="panel-bd">' + threadHtml(q) + '</div></section></aside></div></div>';
    var prim = MR.S.role === 'site' ? null : ['new-quote', 'New quote'];
    return { html: h, title: q.no + ' · ' + q.name, crumbs: [['Quotes', '#/quotes'], [q.no + (v !== MR.ver(q) ? ' v' + v.n : '')]], nav: 'quotes', primary: prim, after: function () { MR._flash = null; } };
  };
  function primaryActs(q) {
    var r = MR.S.role, s = q.status, a = '';
    if (!MR.can('quote.edit')) return '';
    if (s === 'draft' || s === 'rejected') a += r === 'owner' ? MR.btn('q-approve', 'Approve', { cls: 'pri', icon: 'check' }) : MR.btn('q-submit', 'Submit for approval', { cls: 'pri', icon: 'approve' });
    if (s === 'approved') a += MR.btn('q-send', 'Send to client', { cls: 'pri', icon: 'send' });
    if (s === 'sent' || s === 'viewed') a += MR.btn('q-copy', 'Copy client link', { icon: 'link' });
    if (s === 'changes') a += MR.btn('q-newver', 'Make v' + (q.versions.length + 1), { cls: 'pri', icon: 'plus' });
    if (s === 'signed' && MR.can('project.edit')) a += MR.btn('q-convert', 'Convert to project', { cls: 'pri', icon: 'arrow' });
    if (s === 'converted') a += '<a class="btn pri" href="#/project/' + q.projectId + '">' + ic('projects') + '<span>Open project</span></a>';
    return a;
  }
  function curQ() { return MR.quote(MR.route().p[1]); }

  /* ---- line editing ---- */
  function itemById(q, id) { var v = MR.ver(q); for (var a = 0; a < v.sections.length; a++) for (var b = 0; b < v.sections[a].items.length; b++) if (v.sections[a].items[b].id === id) return { s: v.sections[a], i: v.sections[a].items[b] }; return null; }
  function secById(q, id) { return MR.ver(q).sections.filter(function (s) { return s.id === id; })[0]; }
  function refreshSummary(q) {
    var v = MR.ver(q), c = MR.calc(q, v), set = function (id, t) { var e = document.getElementById(id); if (e) e.textContent = t; };
    set('sumSub', u.inr(c.sub)); set('sumDisc', '− ' + u.inr(c.disc)); set('sumTax', u.inr(c.taxable)); set('sumC', u.inr(c.cgst)); set('sumS', u.inr(c.sgst)); set('sumI', u.inr(c.igst)); set('sumTot', u.inr(c.total));
    var m = document.getElementById('sumMarg'); if (m) { m.textContent = u.pct(c.margin * 100, 1) + ' · ' + u.lakh(c.taxable - c.cost); m.className = c.margin < 0.22 ? 'bad' : 'ok'; }
    v.sections.forEach(function (s) { set('st-' + s.id, u.inr(MR.secTotal(s))); });
  }
  MR.live.line = function (el) {
    var q = curQ(); if (!q) return; var f = itemById(q, el.dataset.id); if (!f) return;
    var k = el.dataset.k, n = u.num(el.value); if (k === 'name') return;
    var old = f.i[k]; f.i[k] = n; var a = document.getElementById('amt-' + f.i.id); if (a) a.textContent = u.inr(MR.lineAmt(f.i)); refreshSummary(q); f.i[k] = old;
  };
  MR.bind.line = function (el) {
    var q = curQ(); if (!q) return; var f = itemById(q, el.dataset.id); if (!f) return;
    var k = el.dataset.k, val = k === 'name' ? el.value.trim() : u.num(el.value);
    if (k !== 'name' && val < 0) { MR.toast('Quantities and rates cannot be negative.', { kind: 'bad' }); el.value = f.i[k]; return; }
    if ((k === 'wst' || k === 'disc') && val > 50) { MR.toast((k === 'wst' ? 'Wastage' : 'Line discount') + ' above 50% looks like a typo. Check it.', { kind: 'bad' }); el.value = f.i[k]; return; }
    if (k === 'name' && !val) { el.value = f.i.name; return; }
    var label = ({ qty: 'Quantity', wst: 'Wastage', rate: 'Rate', disc: 'Line discount', name: 'Description' })[k];
    MR.setField(f.i, k, val, label + ' on ' + (f.i.code || 'custom line'), 'quote', q.no);
    MR.render();
  };
  MR.bind.disc = function (el) { var q = curQ(), v = MR.ver(q), n = u.num(el.value); if (n < 0 || n > 40) { MR.toast('Keep the overall discount between 0 and 40%.', { kind: 'bad' }); el.value = v.discPct; return; } MR.setField(v, 'discPct', n, 'Quote discount', 'quote', q.no); MR.render(); };
  MR.live.disc = function (el) { var q = curQ(), v = MR.ver(q), o = v.discPct; v.discPct = u.num(el.value); refreshSummary(q); v.discPct = o; };
  MR.bind['q-name'] = function (el) { var q = curQ(); if (!el.value.trim()) { el.value = q.name; return; } MR.setField(q, 'name', el.value.trim(), 'Quote name', 'quote', q.no); MR.render(); };
  MR.bind['q-terms'] = function (el) { var q = curQ(); MR.setField(q, 'terms', el.value, 'Payment terms', 'quote', q.no); MR.render(); };
  MR.bind['sec-title'] = function (el) { var q = curQ(), s = secById(q, el.dataset.id); if (!el.value.trim()) { el.value = s.title; return; } MR.setField(s, 'title', el.value.trim(), 'Room name', 'quote', q.no); MR.render(); };
  MR.act['line-del'] = function (el) {
    var q = curQ(), f = itemById(q, el.dataset.id), idx = f.s.items.indexOf(f.i);
    f.s.items.splice(idx, 1); MR.audit('quote', q.no, 'line removed', (f.i.code || 'Custom') + ' ' + f.i.name); MR.save(); MR.render();
    MR.undoable('Removed ' + (f.i.code || 'line'), function () { f.s.items.splice(idx, 0, f.i); });
  };
  MR.act['rate-refresh'] = function (el) {
    var q = curQ(), f = itemById(q, el.dataset.id), r = MR.rate(f.i.rateId), old = { rate: f.i.rate, mat: f.i.mat, lab: f.i.lab, rv: f.i.rv };
    f.i.rate = MR.sell(r); f.i.mat = r.mat; f.i.lab = r.lab; f.i.rv = r.hist.length;
    MR.audit('quote', q.no, 'rate updated', f.i.code + ' → ' + u.inr(f.i.rate) + ' (library v' + r.hist.length + ')'); MR.save(); MR._flash = f.i.id; MR.render();
    MR.undoable('Rate updated on ' + f.i.code, function () { Object.keys(old).forEach(function (k) { f.i[k] = old[k]; }); });
  };
  MR.act['line-custom'] = function (el) {
    var q = curQ(), s = secById(q, el.dataset.id);
    var it = { id: u.uid('i'), key: 'k' + u.uid(''), rateId: null, code: '', cat: 'Carpentry', name: 'New custom item', unit: 'nos', qty: 1, wst: 0, rate: 0, mat: 0, lab: 0, rv: 0, disc: 0, note: '' };
    s.items.push(it); MR.audit('quote', q.no, 'line added', 'Custom line in ' + s.title); MR.save(); MR._flash = it.id; MR.render();
    var n = document.getElementById('nm-' + it.id); if (n) { n.focus(); n.select(); }
    MR.undoable('Added a custom line', function () { s.items.splice(s.items.indexOf(it), 1); });
  };
  var ROOM_IDEAS = ['Balcony', 'Study', 'Powder room', 'Puja room', 'Servant room', 'Terrace', 'Home theatre', 'Walk-in wardrobe'];
  MR.act['sec-add'] = function () {
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">Add a room or area</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><label class="field"><span>Name</span><input class="inp" id="secName" placeholder="e.g. Balcony" autofocus list="roomIdeas"><datalist id="roomIdeas">' + ROOM_IDEAS.map(function (x) { return '<option value="' + x + '">'; }).join('') + '</datalist></label><div style="display:flex;gap:6px;flex-wrap:wrap">' + ROOM_IDEAS.slice(0, 6).map(function (x) { return '<button type="button" class="tag" style="height:28px;cursor:pointer" data-act="sec-idea">' + x + '</button>'; }).join('') + '</div></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('sec-add-ok', 'Add room', { cls: 'pri' }) + '</div>', 'sm');
    document.getElementById('secName').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); MR.act['sec-add-ok'](); } });
  };
  MR.act['sec-idea'] = function (el) { document.getElementById('secName').value = el.textContent; MR.act['sec-add-ok'](); };
  MR.act['sec-add-ok'] = function () {
    var n = document.getElementById('secName').value.trim(); if (!n) { document.getElementById('secName').setAttribute('aria-invalid', 'true'); return; }
    var q = curQ(), v = MR.ver(q), s = { id: u.uid('s'), key: 's-' + u.uid(''), title: n, items: [] };
    var at = Math.max(0, v.sections.length - (/design/i.test((v.sections[v.sections.length - 1] || {}).title) ? 1 : 0));
    v.sections.splice(at, 0, s); MR.audit('quote', q.no, 'room added', n); MR.save(); MR.closeDlg(); MR.render();
    MR.undoable('Added ' + n, function () { v.sections.splice(v.sections.indexOf(s), 1); });
    setTimeout(function () { MR.act['pick-open']({ dataset: { id: s.id } }); }, 120);
  };
  MR.act['sec-menu'] = function (el) {
    MR.menu(el, '<button type="button" data-act="sec-up" data-id="' + el.dataset.id + '">' + ic('chevl') + 'Move up</button><button type="button" data-act="sec-dup" data-id="' + el.dataset.id + '">' + ic('copy') + 'Duplicate room</button><hr><button type="button" data-act="sec-del" data-id="' + el.dataset.id + '" style="color:var(--bad)">' + ic('trash') + 'Remove room</button>', { right: true });
  };
  MR.act['sec-up'] = function (el) { var q = curQ(), v = MR.ver(q), s = secById(q, el.dataset.id), i = v.sections.indexOf(s); MR.closeMenu(); if (i > 0) { v.sections.splice(i, 1); v.sections.splice(i - 1, 0, s); MR.save(); MR.render(); MR.undoable('Moved ' + s.title, function () { v.sections.splice(i - 1, 1); v.sections.splice(i, 0, s); }); } };
  MR.act['sec-dup'] = function (el) { var q = curQ(), v = MR.ver(q), s = secById(q, el.dataset.id), c = JSON.parse(JSON.stringify(s)); MR.closeMenu(); c.id = u.uid('s'); c.key = 's-' + u.uid(''); c.title = s.title + ' (copy)'; c.items.forEach(function (i) { i.id = u.uid('i'); i.key = 'k' + u.uid(''); }); v.sections.splice(v.sections.indexOf(s) + 1, 0, c); MR.save(); MR.render(); MR.undoable('Duplicated ' + s.title, function () { v.sections.splice(v.sections.indexOf(c), 1); }); };
  MR.act['sec-del'] = function (el) { var q = curQ(), v = MR.ver(q), s = secById(q, el.dataset.id), i = v.sections.indexOf(s); MR.closeMenu(); v.sections.splice(i, 1); MR.audit('quote', q.no, 'room removed', s.title + ' (' + s.items.length + ' lines)'); MR.save(); MR.render(); MR.undoable('Removed ' + s.title, function () { v.sections.splice(i, 0, s); }); };

  /* ---- picker ---- */
  var PICK = { sid: null, cat: '' };
  function pickList(term) {
    var t = (term || '').toLowerCase();
    var list = S().rates.filter(function (r) { return r.active && (!PICK.cat || r.cat === PICK.cat) && (!t || (r.code + ' ' + r.name + ' ' + r.cat).toLowerCase().indexOf(t) > -1); });
    if (!list.length) return '<div class="pal-empty">Nothing in the library matches. Add a custom line instead, or ask the owner to add a rate.</div>';
    var g = null;
    return list.map(function (r) { var hd = r.cat !== g ? '<h5>' + esc(r.cat) + '</h5>' : ''; g = r.cat; return hd + '<button type="button" class="pal-it" data-act="pick" data-id="' + r.id + '"><span class="mono faint" style="width:52px">' + esc(r.code) + '</span><span class="pt">' + esc(r.name) + '</span><span class="ph">' + (MR.can('money.view') ? u.inr(MR.sell(r)) + ' / ' : '') + esc(r.unit) + '</span></button>'; }).join('');
  }
  MR.act['pick-open'] = function (el) {
    PICK.sid = el.dataset.id; var q = curQ(), s = secById(q, PICK.sid);
    MR.openDrawer('<div class="dlg-hd"><h2 id="drT">Add to ' + esc(s.title) + '</h2>' + MR.xBtn() + '</div><div class="dlg-bd" style="gap:10px"><div class="tsearch" style="width:100%">' + ic('search') + '<input class="inp" id="pickQ" type="search" placeholder="Search 58 rates: “wardrobe”, “FC-30”, “paint”" aria-label="Search rate library" autofocus></div><div style="display:flex;gap:4px;flex-wrap:wrap">' + [''].concat(MR.CATS).map(function (c) { return '<button type="button" class="tag" style="height:26px;cursor:pointer' + (PICK.cat === c ? ';border-color:var(--ink);color:var(--ink)' : '') + '" data-act="pick-cat" data-v="' + esc(c) + '">' + esc(c ? MR.CAT_SHORT[c] : 'All') + '</button>'; }).join('') + '</div><div class="pal-list" id="pickList" style="max-height:none;padding:0">' + pickList('') + '</div></div>');
    var inp = document.getElementById('pickQ');
    inp.addEventListener('input', function () { document.getElementById('pickList').innerHTML = pickList(inp.value); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); var b = document.querySelector('#pickList .pal-it'); if (b) b.click(); } });
  };
  MR.act['pick-cat'] = function (el) { PICK.cat = el.dataset.v; var t = document.getElementById('pickQ').value; MR.act['pick-open']({ dataset: { id: PICK.sid } }); var i = document.getElementById('pickQ'); i.value = t; document.getElementById('pickList').innerHTML = pickList(t); };
  MR.act.pick = function (el) {
    var q = curQ(), s = secById(q, PICK.sid), r = MR.rate(el.dataset.id), it = MR.lineFrom(r, 1, null);
    s.items.push(it); MR.audit('quote', q.no, 'line added', r.code + ' in ' + s.title); MR.save();
    el.style.background = 'var(--ok-t)'; el.querySelector('.ph').textContent = 'Added ✓';
    MR._flash = it.id; MR.render();
    MR.undoable('Added ' + r.code + ' to ' + s.title, function () { s.items.splice(s.items.indexOf(it), 1); });
  };

  /* ---- comment thread on a line (internal side) ---- */
  MR.act['line-thread'] = function (el) {
    var q = curQ(), key = el.dataset.id, line = findLine(q, key), list = q.comments.filter(function (c) { return c.key === key; });
    MR.openDrawer('<div class="dlg-hd"><h2 id="drT">' + esc(line.code || 'Line') + ' · comments</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><p class="muted">' + esc(line.name) + ' · ' + u.fnum(line.qty) + ' ' + esc(line.unit) + (MR.can('money.view') ? ' · ' + u.inr(MR.lineAmt(line)) : '') + '</p><div class="thread">' + list.map(function (m) { return '<div class="msg ' + (m.by === 'client' ? 'client' : '') + '">' + (m.by === 'client' ? '<span class="av" style="--h:200">' + esc(u.initials(m.who)) + '</span>' : MR.avatar(m.by)) + '<div class="mb"><div class="mh"><b>' + esc(m.who) + '</b><span>' + u.rel(m.at) + ' · v' + m.v + '</span></div>' + esc(m.text) + '</div></div>'; }).join('') + '</div><label class="field"><span>Reply (the client sees this on their link)</span><textarea class="ta" id="replyT" placeholder="e.g. Walnut adds ₹14,000. I will add it in v4."></textarea></label><div style="display:flex;justify-content:flex-end">' + MR.btn('line-reply', 'Reply', { cls: 'pri', attrs: ' data-k="' + key + '"' }) + '</div></div>');
  };
  MR.act['line-reply'] = function (el) {
    var t = document.getElementById('replyT').value.trim(); if (!t) { document.getElementById('replyT').setAttribute('aria-invalid', 'true'); return; }
    var q = curQ(), me = MR.me(); q.comments.push({ id: u.uid('cm'), v: MR.ver(q).n, key: el.getAttribute('data-k'), by: me.id, who: me.name, at: new Date().toISOString(), text: t });
    MR.audit('quote', q.no, 'replied', t.slice(0, 80)); MR.save(); MR.closeDrawer(); MR.render(); MR.toast('Reply posted to the client link');
  };

  /* ---- workflow ---- */
  MR.act['q-submit'] = function () {
    var q = curQ(), pol = MR.policy(q);
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">Submit ' + esc(q.no) + ' v' + MR.ver(q).n + ' for approval</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><ul class="sumcard"><li style="list-style:none"><ul class="policy">' + pol.checks.map(function (x) { return '<li class="' + (x[0] ? 'ok' : 'bad') + '">' + ic(x[0] ? 'check' : 'flag') + '<span>' + esc(x[1]) + '</span></li>'; }).join('') + '</ul></li></ul>' + (pol.fails ? '<p class="banner warn" style="margin:0">' + ic('flag') + '<span class="bt">This version breaks ' + pol.fails + ' policy rule' + (pol.fails > 1 ? 's' : '') + '. You can still submit it; Ira will see the flags.</span></p>' : '') + '<label class="field"><span>Note for Ira <span class="faint">(optional)</span></span><textarea class="ta" id="subNote" placeholder="e.g. Client is comparing with one other studio; the 4% discount closes it this week."></textarea></label></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('q-submit-ok', 'Submit for approval', { cls: 'pri' }) + '</div>');
  };
  MR.act['q-submit-ok'] = function () {
    var q = curQ(), v = MR.ver(q), note = document.getElementById('subNote').value.trim();
    q.status = 'review'; v.submittedAt = new Date().toISOString(); v.submitNote = note;
    MR.audit('quote', q.no, 'submitted', 'v' + v.n + ' submitted for approval');
    MR.notify(['owner'], MR.me().name.split(' ')[0] + ' submitted ' + q.no + ' v' + v.n + ' (' + q.name.split(',')[0] + ') for approval', '#/quote/' + q.id, 'approve');
    MR.save(); MR.closeDlg(); MR.render(); MR.toast('Submitted. Ira has been notified.');
  };
  MR.act['q-approve'] = function () {
    var q = curQ(), pol = MR.policy(q);
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">Approve ' + esc(q.no) + ' v' + MR.ver(q).n + '</h2>' + MR.xBtn() + '</div><div class="dlg-bd">' + (pol.fails ? '<div class="banner warn" style="margin:0">' + ic('flag') + '<div class="bt"><b>' + pol.fails + ' policy flag' + (pol.fails > 1 ? 's' : '') + '</b>' + pol.checks.filter(function (x) { return !x[0]; }).map(function (x) { return esc(x[1]); }).join('. ') + '. Approving records that you accepted the exception.</div></div>' : '<p class="muted">Passes every policy check. ' + u.lakh(MR.calc(q).taxable) + ' + GST at ' + u.pct(MR.calc(q).margin * 100, 1) + ' margin.</p>') + '<label class="field"><span>Comment <span class="faint">(optional, visible to the team)</span></span><textarea class="ta" id="apNote" placeholder="e.g. Fine to send. Mention the 10-year ply warranty."></textarea></label></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('q-approve-ok', 'Approve', { cls: 'pri', icon: 'check' }) + '</div>');
  };
  MR.act['q-approve-ok'] = function () {
    var q = curQ(), v = MR.ver(q), note = document.getElementById('apNote').value.trim();
    q.approvals.push({ v: v.n, by: MR.me().id, at: new Date().toISOString(), decision: 'approved', comment: note }); q.status = 'approved';
    if (!v.submittedAt) v.submittedAt = new Date().toISOString();
    MR.audit('quote', q.no, 'approved', 'v' + v.n + (note ? ': ' + note : ''));
    if (q.owner !== MR.me().id) MR.notify(['pm'], 'Ira approved ' + q.no + ' v' + v.n + '. Ready to send.', '#/quote/' + q.id, 'ok');
    MR.save(); MR.closeDlg(); MR.render(); MR.toast(q.no + ' v' + v.n + ' approved');
  };
  MR.act['q-reject'] = function () {
    var q = curQ();
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">Return ' + esc(q.no) + ' with comments</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><label class="field"><span>What needs to change?</span><textarea class="ta" id="rjNote" rows="4" placeholder="Be specific: which lines, what margin, what to add." autofocus></textarea><span class="err" id="rjErr"></span></label></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('q-reject-ok', 'Return to ' + MR.userById(q.owner).name.split(' ')[0], { cls: 'pri danger' }) + '</div>');
  };
  MR.act['q-reject-ok'] = function () {
    var note = document.getElementById('rjNote').value.trim();
    if (note.length < 8) { document.getElementById('rjErr').textContent = 'Tell ' + MR.userById(curQ().owner).name.split(' ')[0] + ' what to change, so the next version is right first time.'; document.getElementById('rjNote').setAttribute('aria-invalid', 'true'); return; }
    var q = curQ(), v = MR.ver(q);
    q.approvals.push({ v: v.n, by: MR.me().id, at: new Date().toISOString(), decision: 'rejected', comment: note }); q.status = 'rejected';
    MR.audit('quote', q.no, 'rejected', note.slice(0, 120)); MR.notify(['pm'], 'Ira returned ' + q.no + ' v' + v.n + ' with comments', '#/quote/' + q.id, 'bad');
    MR.save(); MR.closeDlg(); MR.render(); MR.toast('Returned with comments');
  };
  MR.qLink = function (q) { return location.origin + location.pathname + '#/q/' + q.token; };
  MR.act['q-send'] = function () {
    var q = curQ(), v = MR.ver(q), cl = MR.client(q.clientId);
    if (q.status !== 'approved') { MR.toast('Only approved versions can be sent.', { kind: 'bad' }); return; }
    v.sentAt = new Date().toISOString(); q.status = 'sent';
    MR.audit('quote', q.no, 'sent', 'v' + v.n + ' sent to ' + cl.contact); MR.save(); MR.render();
    var link = MR.qLink(q), first = cl.contact.split(' (')[0].replace(/^Dr\s+/, 'Dr ').split(' ')[0];
    var msg = 'Hi ' + first + ', your quote for ' + q.name.split(',')[0] + ' is ready: ' + u.lakh(MR.calc(q).taxable) + ' + GST, version ' + v.n + '. You can comment on any line, ask for changes, or sign online here: ' + link + ' · Kabir, Marlow & Reed';
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">Link ready for ' + esc(first) + '</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><label class="field"><span>Client link</span><input class="inp mono" id="lnk" readonly value="' + esc(link) + '"></label><label class="field"><span>Message (WhatsApp or email)</span><textarea class="ta" id="lnkMsg" rows="4">' + esc(msg) + '</textarea><small>Copy it into WhatsApp or email, or open the link to see what the client sees.</small></label></div><div class="dlg-ft"><a class="btn left" href="#/q/' + q.token + '" target="_blank" rel="noopener">' + ic('eye') + '<span>Open as client</span></a>' + MR.btn('copy-msg', 'Copy message', { icon: 'copy' }) + MR.btn('copy-link', 'Copy link', { cls: 'pri', icon: 'link' }) + '</div>');
  };
  function copy(text, ok) { try { navigator.clipboard.writeText(text).then(function () { MR.toast(ok); }, function () { MR.toast(text, { plain: true }); }); } catch (e) { MR.toast(text, { plain: true }); } }
  MR.copy = copy;
  MR.act['copy-link'] = function () { copy(document.getElementById('lnk').value, 'Client link copied'); };
  MR.act['copy-msg'] = function () { copy(document.getElementById('lnkMsg').value, 'Message copied'); };
  MR.act['q-copy'] = function () { copy(MR.qLink(curQ()), 'Client link copied'); };
  MR.act['q-newver'] = function () {
    var q = curQ(), cur = MR.ver(q), cr = q.comments.filter(function (c) { return c.by === 'client' && c.v === cur.n; }).map(function (c) { return c.text; }).join(' ');
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">Make v' + (cur.n + 1) + ' from v' + cur.n + '</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><p class="muted">v' + cur.n + ' stays locked as it was sent. v' + (cur.n + 1) + ' starts as an exact copy you can edit; the diff view shows the client exactly what changed.</p><label class="field"><span>What will change?</span><textarea class="ta" id="nvNote" rows="3" placeholder="e.g. Walnut TV unit; 10 downlights instead of 16" autofocus>' + esc(cr ? 'Client asked: ' + cr.slice(0, 160) : '') + '</textarea></label></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('q-newver-ok', 'Create v' + (cur.n + 1), { cls: 'pri' }) + '</div>');
  };
  MR.act['q-newver-ok'] = function () {
    var q = curQ(), cur = MR.ver(q), note = document.getElementById('nvNote').value.trim();
    var nv = { n: cur.n + 1, created: new Date().toISOString(), by: MR.me().id, sections: MR.cloneSections(cur.sections), discPct: cur.discPct, note: note || 'Revised' };
    q.versions.push(nv); q.status = 'draft'; q.comments.forEach(function (c) { if (c.v === cur.n) c.resolved = true; });
    MR.audit('quote', q.no, 'new version', 'v' + nv.n + ' from v' + cur.n + (note ? ': ' + note : '')); MR.save(); MR.closeDlg(); MR.go('#/quote/' + q.id); MR.render(); MR.toast('v' + nv.n + ' created as a draft');
  };
  MR.act['q-reopen'] = function () { var q = curQ(); q.status = 'draft'; MR.audit('quote', q.no, 'reopened', ''); MR.save(); MR.render(); MR.undoable('Reopened ' + q.no, function () { q.status = 'lost'; }); };
  MR.act['q-more'] = function (el) {
    var q = curQ(), open = OPEN.indexOf(q.status) > -1;
    MR.menu(el, (q.versions.length > 1 ? '<a href="#/quote/' + q.id + '/diff?a=1&b=' + q.versions.length + '">' + ic('diff') + 'Compare versions</a>' : '') + '<a href="#/q/' + q.token + '?preview=1&print=1">' + ic('print') + 'Print or save as PDF</a>' + (MR.can('quote.edit') ? '<button type="button" data-act="q-dup">' + ic('copy') + 'Duplicate as new quote</button>' + (['sent', 'viewed'].indexOf(q.status) > -1 ? '<button type="button" data-act="q-newver">' + ic('plus') + 'Make v' + (q.versions.length + 1) + '</button>' : '') + (open ? '<hr><button type="button" data-act="q-lost" style="color:var(--bad)">' + ic('x') + 'Mark lost…</button>' : '') : ''), { right: true });
  };
  MR.act['q-dup'] = function () {
    var q = curQ(), n = MR.next('q'), c = JSON.parse(JSON.stringify(q)); MR.closeMenu();
    c.id = 'q' + u.uid(''); c.no = 'Q-' + n; c.token = 'mr' + n + Math.random().toString(36).slice(2, 5); c.status = 'draft'; c.created = new Date().toISOString(); c.approvals = []; c.comments = []; c.sig = null; c.projectId = null; c.name = q.name + ' (copy)';
    c.versions = [{ n: 1, created: c.created, by: MR.me().id, sections: MR.cloneSections(MR.ver(q).sections), discPct: MR.ver(q).discPct, note: 'Duplicated from ' + q.no }];
    S().quotes.unshift(c); MR.audit('quote', c.no, 'created', 'Duplicated from ' + q.no); MR.save(); MR.go('#/quote/' + c.id); MR.toast(c.no + ' created from ' + q.no);
  };
  MR.act['q-lost'] = function () {
    MR.closeMenu();
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">Mark ' + esc(curQ().no) + ' lost</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><label class="field"><span>Main reason</span><select class="sel" id="lsWhy"><option>Price: went with a lower bid</option><option>Timeline did not work</option><option>Chose a modular-kitchen brand showroom</option><option>Project postponed</option><option>No response after follow-ups</option></select></label><label class="field"><span>Note <span class="faint">(feeds the win/loss report)</span></span><input class="inp" id="lsNote" placeholder="e.g. About 14% cheaper, local contractor"></label></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('q-lost-ok', 'Mark lost', { cls: 'pri danger' }) + '</div>', 'sm');
  };
  MR.act['q-lost-ok'] = function () {
    var q = curQ(), prev = q.status, why = document.getElementById('lsWhy').value + (document.getElementById('lsNote').value.trim() ? ' (' + document.getElementById('lsNote').value.trim() + ')' : '');
    q.status = 'lost'; q.lostWhy = why; MR.audit('quote', q.no, 'marked lost', why); MR.save(); MR.closeDlg(); MR.render();
    MR.undoable(q.no + ' marked lost', function () { q.status = prev; });
  };

  /* =============================== DIFF =============================== */
  function diffView(q, r) {
    var n = q.versions.length, a = Math.max(1, Math.min(n, +r.qs.a || 1)), b = Math.max(1, Math.min(n, +r.qs.b || n));
    var A = q.versions[a - 1], B = q.versions[b - 1], ca = MR.calc(q, A), cb = MR.calc(q, B), d = cb.taxable - ca.taxable, all = r.qs.all === '1', mv = MR.can('money.view');
    var keys = {}, order = [];
    function idx(v, side) { v.sections.forEach(function (s) { if (!keys[s.key]) { keys[s.key] = { title: s.title, a: null, b: null, items: {} }; order.push(s.key); } keys[s.key][side] = s; s.items.forEach(function (i) { var o = keys[s.key].items[i.key] = keys[s.key].items[i.key] || { a: null, b: null }; o[side] = i; }); }); }
    idx(A, 'a'); idx(B, 'b');
    var counts = { add: 0, rem: 0, chg: 0 };
    var rows = '', wf = [];
    order.forEach(function (k) {
      var g = keys[k], ta = g.a ? MR.secTotal(g.a) : 0, tb = g.b ? MR.secTotal(g.b) : 0, sec = '', any = false;
      Object.keys(g.items).forEach(function (ik) {
        var o = g.items[ik], kind = !o.a ? 'add' : !o.b ? 'rem' : (o.a.qty !== o.b.qty || o.a.rate !== o.b.rate || (o.a.wst || 0) !== (o.b.wst || 0) || (o.a.disc || 0) !== (o.b.disc || 0) || o.a.code !== o.b.code) ? 'chg' : 'same';
        if (kind !== 'same') { counts[kind]++; any = true; }
        if (kind === 'same' && !all) return;
        var it = o.b || o.a, amA = o.a ? MR.lineAmt(o.a) : 0, amB = o.b ? MR.lineAmt(o.b) : 0, dd = amB - amA;
        var qtyCell = kind === 'chg' && o.a.qty !== o.b.qty ? '<span class="was">' + u.fnum(o.a.qty) + '</span>' + u.fnum(o.b.qty) : u.fnum(it.qty);
        var rateCell = kind === 'chg' && o.a.rate !== o.b.rate ? '<span class="was">' + u.fnum(o.a.rate) + '</span>' + u.fnum(o.b.rate) : u.fnum(it.rate);
        var nm = kind === 'chg' && o.a.code !== o.b.code ? '<span class="was">' + esc(o.a.name) + '</span><br>' + esc(o.b.name) : esc(it.name);
        sec += '<tr class="' + kind + '"><td class="mk">' + ({ add: '+', rem: '−', chg: '~', same: '' })[kind] + '</td><td><span class="mono faint" style="margin-right:6px">' + esc(it.code || 'CUSTOM') + '</span><span class="nm">' + nm + '</span></td><td class="num">' + qtyCell + ' <span class="faint">' + esc(it.unit) + '</span></td>' + (mv ? '<td class="num">' + rateCell + '</td><td class="num">' + (o.a ? u.inr(amA) : '<span class="faint">—</span>') + '</td><td class="num">' + (o.b ? u.inr(amB) : '<span class="faint">—</span>') + '</td><td class="num ' + (dd > 0 ? 'dpos' : dd < 0 ? 'dneg' : '') + '">' + (dd ? (dd > 0 ? '+' : '−') + u.inr(Math.abs(dd)).replace('₹', '₹') : '') + '</td>' : '') + '</tr>';
      });
      if (any || all) rows += '<tr class="sech"><td></td><td colspan="' + (mv ? 6 : 2) + '">' + esc(g.b ? g.b.title : g.a.title) + (!g.a ? ' <span class="pill p-ok" style="margin-left:6px">New room</span>' : !g.b ? ' <span class="pill p-bad" style="margin-left:6px">Removed</span>' : '') + (mv ? '<span style="float:right" class="' + (tb - ta > 0 ? 'dpos' : tb - ta < 0 ? 'dneg' : 'faint') + '">' + (tb - ta ? (tb - ta > 0 ? '+' : '−') + u.inr(Math.abs(tb - ta)) : 'no change') + '</span>' : '') + '</td></tr>' + sec;
      if (tb - ta) wf.push({ t: g.b ? g.b.title : g.a.title, d: tb - ta });
    });
    if ((B.discPct || 0) !== (A.discPct || 0)) wf.push({ t: 'Discount ' + (A.discPct || 0) + '% → ' + (B.discPct || 0) + '%', d: -(cb.disc - ca.disc) });
    var maxd = Math.max.apply(null, wf.map(function (x) { return Math.abs(x.d); }).concat([1]));
    function vsel(name, val) { return '<select class="sel" style="width:auto;height:28px" aria-label="Version ' + name + '" data-bind="diff-v" data-k="' + name + '">' + q.versions.map(function (x) { return '<option value="' + x.n + '"' + (x.n === val ? ' selected' : '') + '>v' + x.n + '</option>'; }).join('') + '</select>'; }
    var h = '<div class="page"><div class="ph"><div><div class="eyebrow">' + esc(q.no) + ' · ' + esc(q.name) + '</div><h1>What changed, v' + a + ' <em>to</em> v' + b + '</h1><p class="sub">Lines are matched across versions, so a swapped finish shows as a change, not a delete and an add.</p></div><div class="acts">' + vsel('a', a) + ic('arrow', 'faint') + vsel('b', b) + '<a class="btn" href="#/quote/' + q.id + '">Back to quote</a></div></div>';
    h += '<div class="diffhead"><div class="dcard"><span class="tag">v' + a + '</span> <span class="muted" style="font-size:12px">' + (A.sentAt ? 'sent ' + u.fdate(A.sentAt.slice(0, 10)) : 'draft') + '</span><div class="vv">' + (mv ? u.inr(ca.taxable) : A.sections.length + ' rooms') + '</div><div class="meta">' + ca.lines + ' lines · ' + esc(A.note || '') + '</div></div>';
    h += '<div class="ddelta">' + (mv ? '<div class="big ' + (d < 0 ? 'down' : d > 0 ? 'up' : '') + '">' + (d < 0 ? '−' : d > 0 ? '+' : '') + u.lakh(Math.abs(d)) + '</div><div class="muted" style="font-size:12px;margin-top:4px">' + (ca.taxable ? (d > 0 ? '+' : '') + u.pct(d / ca.taxable * 100, 1) : '') + ' · margin ' + u.pct(ca.margin * 100, 1) + ' → ' + u.pct(cb.margin * 100, 1) + '</div>' : '') + '<div style="display:flex;gap:6px;justify-content:center;margin-top:8px"><span class="pill p-ok">+' + counts.add + ' added</span><span class="pill p-warn">~' + counts.chg + ' changed</span><span class="pill p-bad">−' + counts.rem + ' removed</span></div></div>';
    h += '<div class="dcard"><span class="tag">v' + b + '</span> <span class="muted" style="font-size:12px">' + (B.sentAt ? 'sent ' + u.fdate(B.sentAt.slice(0, 10)) : 'draft') + '</span><div class="vv">' + (mv ? u.inr(cb.taxable) : B.sections.length + ' rooms') + '</div><div class="meta">' + cb.lines + ' lines · ' + esc(B.note || '') + '</div></div></div>';
    if (mv && wf.length) h += '<section class="panel" style="margin-bottom:20px"><div class="panel-hd"><h2>Where the money moved</h2><div class="legend"><span><i style="background:#9BC5AE"></i>Cheaper</span><span><i style="background:#E3A79C"></i>Costlier</span></div></div><div class="panel-bd"><div class="waterfall">' + wf.map(function (x) { var w = Math.abs(x.d) / maxd * 50; return '<div class="wf"><span>' + esc(x.t) + '</span><div class="track"><i class="' + (x.d > 0 ? 'up' : 'down') + '" style="width:' + w + '%"></i></div><span class="n ' + (x.d > 0 ? 'bad' : 'ok') + '">' + (x.d > 0 ? '+' : '−') + u.lakh(Math.abs(x.d)) + '</span></div>'; }).join('') + '</div></div></section>';
    h += '<div class="tbar"><span class="grow"></span><label class="chk"><input type="checkbox" data-act="diff-all"' + (all ? ' checked' : '') + '><span>Show unchanged lines</span></label></div>';
    h += rows ? '<div class="tw"><table class="tbl dtable"><thead><tr><th></th><th>Item</th><th class="num">Qty</th>' + (mv ? '<th class="num">Rate</th><th class="num">v' + a + '</th><th class="num">v' + b + '</th><th class="num">Change</th>' : '') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' : MR.empty('diff', 'These versions are identical', 'Pick two different versions to compare.');
    return { html: h + '</div>', title: q.no + ' v' + a + ' → v' + b, crumbs: [['Quotes', '#/quotes'], [q.no, '#/quote/' + q.id], ['v' + a + ' → v' + b]], nav: 'quotes', after: function (root, ch) { if (ch && !MR.still()) window.gsap.from(root.querySelectorAll('.wf .track i'), { scaleX: 0, transformOrigin: function (i, el) { return el.classList.contains('up') ? 'left' : 'right'; }, duration: .8, ease: 'expo.out', stagger: .04 }); } };
  }
  MR.bind['diff-v'] = function (el) { MR.setQS(el.dataset.k, el.value); };
  MR.act['diff-all'] = function (el) { MR.setQS('all', el.checked ? '1' : ''); };

  /* =============================== RATE LIBRARY =============================== */
  MR.views.rates = function (r) {
    var cat = r.qs.cat || '', q = (r.qs.q || '').toLowerCase(), ed = MR.S.role === 'owner', mv = MR.can('money.view');
    var list = S().rates.filter(function (x) { return (!cat || x.cat === cat) && (!q || (x.code + ' ' + x.name + ' ' + x.cat).toLowerCase().indexOf(q) > -1); });
    var used = {}; S().quotes.forEach(function (qq) { var seen = {}; MR.ver(qq).sections.forEach(function (s) { s.items.forEach(function (i) { if (i.rateId && !seen[i.rateId]) { seen[i.rateId] = 1; used[i.rateId] = (used[i.rateId] || 0) + 1; } }); }); });
    var revised = S().rates.filter(function (x) { return x.hist.length > 1; }).length;
    var h = '<div class="page"><div class="ph"><div><h1>Rate library</h1><p class="sub">' + S().rates.length + ' rates split into material and labour, with a margin on top. Every change is a new version; quotes keep the version they were priced on and flag newer rates.</p></div><div class="acts">' + (ed ? MR.btn('rate-new', 'New rate', { icon: 'plus' }) : '') + (ed ? MR.btn('rates-import', 'Import price list', { icon: 'download' }) : '') + MR.btn('rates-csv', 'Export CSV', { icon: 'download' }) + '</div></div>';
    h += '<div class="views">' + [''].concat(MR.CATS).map(function (c) { var n = S().rates.filter(function (x) { return !c || x.cat === c; }).length; return '<button type="button" data-act="qs" data-k="cat" data-v="' + esc(c) + '" aria-pressed="' + (cat === c) + '">' + esc(c ? MR.CAT_SHORT[c] : 'All') + ' <span class="ct">' + n + '</span></button>'; }).join('') + '</div>';
    h += '<div class="tbar"><div class="tsearch">' + ic('search') + '<input class="inp" type="search" placeholder="Search code or item" aria-label="Search rates" value="' + esc(r.qs.q || '') + '" data-bind="qs-q"></div><span class="grow"></span><span class="muted">' + revised + ' rates revised this year' + (ed ? ' · click material, labour or margin to edit' : '') + '</span></div>';
    if (!ed && MR.S.role === 'pm') h += '<div class="banner info">' + ic('lock') + '<div class="bt"><b>Read-only for project managers</b>Only Ira changes rates, so every quote prices off one book. Spot something stale? Suggest a change from the history panel.</div></div>';
    h += list.length ? '<div class="tw"><table class="tbl"><thead><tr><th>Code</th><th>Item</th><th class="hide-sm">Unit</th>' + (mv ? '<th class="num">Material</th><th class="num">Labour</th><th class="num">Margin</th><th class="num">Sell rate</th>' : '') + '<th class="hide-sm">Version</th><th class="num hide-sm">Used in</th><th></th></tr></thead><tbody>' + list.map(function (x) {
      var last = x.hist[x.hist.length - 1];
      function cell(k, val) { return ed ? '<td class="num" style="width:108px"><input class="ed num" id="rt-' + k + '-' + x.id + '" inputmode="decimal" value="' + val + '" data-bind="rate-edit" data-k="' + k + '" data-id="' + x.id + '" aria-label="' + k + ' for ' + esc(x.code) + '"></td>' : '<td class="num">' + (k === 'margin' ? val + '%' : u.inr(val)) + '</td>'; }
      return '<tr' + (q && x.code.toLowerCase() === q ? ' class="kb"' : '') + '><td class="mono">' + esc(x.code) + '</td><td>' + esc(x.name) + '<span class="sub">' + esc(x.cat) + ' · SAC ' + esc(x.sac) + '</span></td><td class="hide-sm">' + esc(x.unit) + '</td>' + (mv ? cell('mat', x.mat) + cell('lab', x.lab) + cell('margin', x.margin) + '<td class="num" style="font-weight:600">' + u.inr(MR.sell(x)) + '</td>' : '') + '<td class="hide-sm"><button type="button" class="tag" style="cursor:pointer;height:24px" data-act="rate-hist" data-id="' + x.id + '">v' + x.hist.length + ' · ' + u.fshort(last.at) + '</button></td><td class="num hide-sm">' + (used[x.id] ? used[x.id] + ' quote' + (used[x.id] > 1 ? 's' : '') : '<span class="faint">—</span>') + '</td><td class="w0">' + MR.iconBtn('rate-hist', 'clock', 'Version history', { id: x.id, cls: 'sm' }) + '</td></tr>';
    }).join('') + '</tbody></table></div>' : MR.empty('rates', 'No rates match', 'Try a code like “CP-40” or a word like “wardrobe”.');
    return { html: h + '</div>', title: 'Rate library', crumbs: [['Rate library']], nav: 'rates' };
  };
  MR.bind['rate-edit'] = function (el) {
    var x = MR.rate(el.dataset.id), k = el.dataset.k, v = u.num(el.value);
    if (v < 0 || (k === 'margin' && v > 150)) { MR.toast(k === 'margin' ? 'Margin between 0 and 150%.' : 'Rates cannot be negative.', { kind: 'bad' }); el.value = x[k]; return; }
    if (v === x[k]) return;
    var old = x[k], before = MR.sell(x); x[k] = v;
    var h = { v: x.hist.length + 1, at: u.today(), mat: x.mat, lab: x.lab, margin: x.margin, by: MR.me().id, note: ({ mat: 'Material', lab: 'Labour', margin: 'Margin' })[k] + ' ' + (k === 'margin' ? old + '% → ' + v + '%' : u.inr(old) + ' → ' + u.inr(v)) };
    x.hist.push(h);
    MR.audit('rate', x.code, 'revised', 'v' + h.v + ': ' + h.note + ' · sell ' + u.inr(before) + ' → ' + u.inr(MR.sell(x)));
    MR.save(); MR.render();
    MR.undoable(x.code + ' v' + h.v + ' · sell ' + u.inr(MR.sell(x)), function () { x[k] = old; x.hist.pop(); MR.audit('rate', x.code, 'undo', 'Reverted to v' + x.hist.length); });
  };
  MR.act['rate-hist'] = function (el) {
    var x = MR.rate(el.dataset.id), mv = MR.can('money.view');
    var h = '<div class="dlg-hd"><h2 id="drT">' + esc(x.code) + ' history</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><div><b style="font-weight:600">' + esc(x.name) + '</b><div class="muted" style="font-size:12px">' + esc(x.cat) + ' · per ' + esc(x.unit) + ' · SAC ' + esc(x.sac) + '</div></div>';
    h += '<ul class="hist">' + x.hist.slice().reverse().map(function (v, i) { var cur = i === 0, sell = MR.sell(v); return '<li class="' + (cur ? 'cur' : '') + '"><span class="vv">v' + v.v + '</span><span><b style="font-weight:550">' + esc(v.note) + '</b><br><span class="muted">' + esc(MR.userById(v.by).name) + ' · ' + u.fdate(v.at) + '</span>' + (mv ? '<br><span class="muted">Material ' + u.inr(v.mat) + ' · labour ' + u.inr(v.lab) + ' · margin ' + v.margin + '%</span>' : '') + '</span><span style="text-align:right">' + (mv ? '<b style="font-weight:600">' + u.inr(sell) + '</b>' : '') + (cur ? '<br><span class="pill p-ok">Current</span>' : MR.S.role === 'owner' ? '<br><button type="button" class="btn ghost sm" data-act="rate-revert" data-id="' + x.id + '" data-v="' + v.v + '">Restore</button>' : '') + '</span></li>'; }).join('') + '</ul>';
    if (MR.S.role === 'pm') h += '<label class="field"><span>Suggest a change to Ira</span><textarea class="ta" id="rsug" placeholder="e.g. Vendor quoted ₹1,610/sqft for BWP ply this week"></textarea></label><div style="display:flex;justify-content:flex-end">' + MR.btn('rate-suggest', 'Send suggestion', { cls: 'pri', id: x.id }) + '</div>';
    MR.openDrawer(h + '</div>');
  };
  MR.act['rate-revert'] = function (el) {
    var x = MR.rate(el.dataset.id), v = x.hist[+el.dataset.v - 1], prev = { mat: x.mat, lab: x.lab, margin: x.margin };
    x.mat = v.mat; x.lab = v.lab; x.margin = v.margin; x.hist.push({ v: x.hist.length + 1, at: u.today(), mat: v.mat, lab: v.lab, margin: v.margin, by: MR.me().id, note: 'Restored v' + v.v });
    MR.audit('rate', x.code, 'revised', 'Restored v' + v.v); MR.save(); MR.closeDrawer(); MR.render();
    MR.undoable(x.code + ' restored to v' + v.v, function () { x.mat = prev.mat; x.lab = prev.lab; x.margin = prev.margin; x.hist.pop(); });
  };
  MR.act['rate-suggest'] = function (el) {
    var t = document.getElementById('rsug').value.trim(); if (!t) { document.getElementById('rsug').setAttribute('aria-invalid', 'true'); return; }
    var x = MR.rate(el.dataset.id); MR.notify(['owner'], MR.me().name.split(' ')[0] + ' suggests a change to ' + x.code + ': “' + t.slice(0, 90) + '”', '#/rates?q=' + x.code, 'info');
    MR.audit('rate', x.code, 'suggested', t.slice(0, 100)); MR.save(); MR.closeDrawer(); MR.toast('Suggestion sent to Ira');
  };
  MR.act['rate-new'] = function () {
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">New rate</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><div class="grid2"><label class="field span2"><span>Description</span><input class="inp" id="rnName" placeholder="e.g. Fluted glass partition, aluminium frame" autofocus></label><label class="field"><span>Category</span><select class="sel" id="rnCat">' + MR.CATS.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></label><label class="field"><span>Unit</span><select class="sel" id="rnUnit">' + MR.UNITS.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></label><label class="field"><span>Material ₹</span><input class="inp" id="rnMat" inputmode="decimal" value="0"></label><label class="field"><span>Labour ₹</span><input class="inp" id="rnLab" inputmode="decimal" value="0"></label><label class="field"><span>Margin %</span><input class="inp" id="rnMg" inputmode="decimal" value="36"></label><div class="field"><span>Sell rate</span><output id="rnSell" class="serif" style="font-size:22px">₹0</output></div></div><span class="err" id="rnErr"></span></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('rate-new-ok', 'Add to library', { cls: 'pri' }) + '</div>');
    function up() { document.getElementById('rnSell').textContent = u.inr(MR.sell({ mat: u.num(document.getElementById('rnMat').value), lab: u.num(document.getElementById('rnLab').value), margin: u.num(document.getElementById('rnMg').value) })); }
    ['rnMat', 'rnLab', 'rnMg'].forEach(function (id) { document.getElementById(id).addEventListener('input', up); });
  };
  MR.act['rate-new-ok'] = function () {
    var name = document.getElementById('rnName').value.trim(), cat = document.getElementById('rnCat').value;
    var mat = u.num(document.getElementById('rnMat').value), lab = u.num(document.getElementById('rnLab').value), mg = u.num(document.getElementById('rnMg').value);
    if (!name) { document.getElementById('rnErr').textContent = 'Describe the item the way it should read on a quote.'; return; }
    if (mat + lab <= 0) { document.getElementById('rnErr').textContent = 'Add a material or labour cost; a zero rate would quote it free.'; return; }
    var pre = { 'Civil & waterproofing': 'CV', 'Plumbing': 'PL', 'Electrical': 'EL', 'False ceiling': 'FC', 'Carpentry': 'CP', 'Flooring': 'FL', 'Painting': 'PT', 'Furniture & lighting': 'FN', 'Design & supervision': 'DS' }[cat];
    var nums = S().rates.filter(function (x) { return x.code.indexOf(pre) === 0; }).map(function (x) { return +x.code.slice(3); });
    var code = pre + '-' + (Math.max.apply(null, nums.concat([100])) + 1);
    var x = { id: 'r' + u.uid(''), code: code, cat: cat, name: name, unit: document.getElementById('rnUnit').value, mat: mat, lab: lab, margin: mg, sac: MR.SAC[cat] || '995472', hist: [{ v: 1, at: u.today(), mat: mat, lab: lab, margin: mg, by: MR.me().id, note: 'Added to library' }], active: true };
    S().rates.push(x); MR.audit('rate', code, 'created', name + ' · ' + u.inr(MR.sell(x)) + '/' + x.unit); MR.save(); MR.closeDlg(); MR.go('#/rates?q=' + code); MR.toast(code + ' added');
  };
  MR.act['rates-csv'] = function () { MR.csv('rate-library.csv', [['Code', 'Category', 'Item', 'Unit', 'Material', 'Labour', 'Margin %', 'Sell rate', 'Version', 'SAC']].concat(S().rates.map(function (x) { return [x.code, x.cat, x.name, x.unit, x.mat, x.lab, x.margin, MR.sell(x), x.hist.length, x.sac]; }))); };
})();
