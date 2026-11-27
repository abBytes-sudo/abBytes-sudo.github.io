/* Fieldwise — Deals (board, stage gates, documents, commission split, collections), print issue, reports, activity log, settings. */
(function () {
  'use strict';
  var CK = window.CK, esc = CK.esc, ic = CK.ic;
  function S() { return CK.S(); }

  /* ============ DEALS ============ */
  var DV = { kind: '' };
  var COLS = ['shortlist', 'negotiation', 'token', 'agreement', 'closing', 'closed'];
  var COL_LABEL = { shortlist: 'Shortlist', negotiation: 'Negotiation', token: 'Token', agreement: 'Agreement', closing: 'Move-in / Registry', closed: 'Closed' };
  function colOf(d) { return d.stage === 'movein' || d.stage === 'registry' ? 'closing' : d.stage; }
  CK.V.deals = {
    title: 'Deals',
    render: function () {
      var role = CK.role(), me = CK.me();
      var ds = S().deals.filter(function (d) { return d.stage !== 'lost' && (!DV.kind || d.kind === DV.kind) && (role !== 'field' || d.agent === me.id); });
      var open = ds.filter(function (d) { return d.stage !== 'closed'; });
      var pipe = open.reduce(function (a, d) { return a + CK.dealFees(d).total; }, 0);
      var coll = 0, due = 0; S().deals.forEach(function (d) { d.coll.forEach(function (c) { if (!/brokerage/.test(c.from)) return; if (c.st === 'received') coll += c.amt; else if (c.st === 'invoiced') due += c.amt; }); });
      var head = '<div class="ph"><div><h1>Deals</h1><p class="muted">' + open.length + ' open · ' + CK.money(pipe) + ' brokerage in play · ' + CK.money(coll) + ' collected · ' + CK.money(due) + ' invoiced, awaiting payment</p></div><div class="ph-a"><div class="seg" role="group" aria-label="Filter"><button type="button" data-dk="" aria-pressed="' + (!DV.kind) + '">All</button><button type="button" data-dk="rent" aria-pressed="' + (DV.kind === 'rent') + '">Rentals</button><button type="button" data-dk="sale" aria-pressed="' + (DV.kind === 'sale') + '">Resale</button></div></div></div>';
      var board = '<div class="kanban deals-k" data-tour="deals">' + COLS.map(function (c) {
        var items = ds.filter(function (d) { return colOf(d) === c; }), sum = items.reduce(function (a, d) { return a + CK.dealFees(d).total; }, 0);
        return '<section class="kcol" data-dcol="' + c + '" aria-label="' + COL_LABEL[c] + '"><header><span>' + COL_LABEL[c] + '</span><b>' + items.length + '</b><small class="muted">' + (sum ? CK.money(sum, true) : '') + '</small></header><div class="kcards">' + items.map(dcard).join('') + (items.length ? '' : '<p class="muted sm pad">Nothing here</p>') + '</div></section>';
      }).join('') + '</div>';
      return head + board;
    },
    mount: function (el) {
      el.addEventListener('click', function (e) { var t = e.target.closest('[data-dk]'); if (t) { DV.kind = t.dataset.dk; CK.render(); } });
      var drag = null;
      el.addEventListener('dragstart', function (e) { var c = e.target.closest('[data-ddrag]'); if (c) { drag = c.dataset.ddrag; c.classList.add('dragging'); } });
      el.addEventListener('dragover', function (e) { var col = e.target.closest('[data-dcol]'); if (col && drag) { e.preventDefault(); col.classList.add('over'); } });
      el.addEventListener('dragleave', function (e) { var col = e.target.closest('[data-dcol]'); if (col) col.classList.remove('over'); });
      el.addEventListener('drop', function (e) { var col = e.target.closest('[data-dcol]'); if (!col || !drag) return; e.preventDefault(); var d = CK.deal(drag); drag = null; var c = col.dataset.dcol; var st = c === 'closing' ? (d.kind === 'rent' ? 'movein' : 'registry') : c; moveDeal(d, st); });
    }
  };
  function dcard(d) {
    var L = CK.lead(d.lead), p = CK.prop(d.pid), docs = CK.docsFor(d.kind), n = docs.filter(function (x) { return d.docs[x[0]]; }).length, f = CK.dealFees(d);
    var got = d.coll.filter(function (c) { return /brokerage/.test(c.from) && c.st === 'received'; }).reduce(function (a, c) { return a + c.amt; }, 0);
    return '<article class="kcard dcard" draggable="' + CK.can('deals.edit') + '" data-ddrag="' + d.id + '"><button type="button" class="dc-img" data-peek="deal:' + d.id + '" aria-label="Open deal ' + d.id + '"><img src="' + CK.ph(p.photos[0], 1) + '" alt="" width="260" height="110" loading="lazy"><span class="pc-deal">' + (d.kind === 'rent' ? 'Rent' : 'Sale') + '</span></button><div class="dc-b"><div class="row-b"><b>' + esc(L.name) + '</b><span class="grow"></span><span class="mono muted sm">' + d.id + '</span></div><p class="sm">' + p.code + ' · ' + esc(CK.area(p.area).short) + ' · <b>' + CK.money(d.value, true) + (d.kind === 'rent' ? '/mo' : '') + '</b></p><div class="dc-f"><span class="docs-m" title="Documents">' + ic('file', 13) + n + '/' + docs.length + '</span><span title="Brokerage collected">' + ic('rupee', 13) + CK.money(got, true) + ' / ' + CK.money(f.total, true) + '</span><span class="grow"></span>' + CK.av(CK.agent(d.agent), 's') + (d.partner ? CK.av(CK.partner(d.partner), 's') : '') + '</div></div></article>';
  }
  function moveDeal(d, st) {
    if (!CK.can('deals.edit')) { CK.toast('Your role can view deals but not move them', { tone: 'bad', icon: 'flag' }); return; }
    if (d.stage === st) return;
    var why = CK.act.dealGate(d, st);
    if (why) { CK.modal('<h2 id="modal-t">' + ic('flag', 18) + ' Not yet</h2><p>' + esc(why) + '.</p><p class="muted sm">Stage gates keep the board honest: a home is blocked only after money changes hands, and nothing closes without its paperwork.</p><div class="m-actions"><button type="button" class="btn" data-close-modal>OK</button><button type="button" class="btn primary" id="g-open">Open the deal</button></div>').querySelector('#g-open').onclick = function () { CK.closeModal(); CK.peek('deal', d.id); }; return; }
    var from = d.stage; CK.act.dealStage(d, st);
    if (st === 'token' || st === 'closed') CK.celebrate();
    CK.toast(d.id + ' → ' + CK.DEAL_LABEL[st], { undo: function () { d.stage = from; d.hist.pop(); CK.emit('deal'); } });
  }
  CK.moveDeal = moveDeal;
  CK.D.deal = {
    render: function (id) {
      var d = CK.deal(id), L = CK.lead(d.lead), p = CK.prop(d.pid), stages = CK.dealStages(d), idx = d.stage === 'closed' ? stages.length : stages.indexOf(d.stage), f = CK.dealFees(d), docs = CK.docsFor(d.kind);
      var can = CK.can('deals.edit');
      var head = '<header class="dh"><div class="dh-top"><img class="dh-img" src="' + CK.ph(p.photos[0], 1) + '" alt="" width="64" height="48"><div class="grow"><p class="muted sm mono">' + d.id + ' · opened ' + CK.date(d.created) + '</p><h2 id="drawer-t">' + esc(L.name) + ' · ' + p.code + '</h2><p class="sm">' + esc(CK.cfg(p)) + ', ' + esc(CK.area(p.area).name) + ' · ' + (d.kind === 'rent' ? 'rental' : 'resale') + '</p></div><button type="button" class="ibtn" data-close-drawer aria-label="Close panel">' + ic('x', 16) + '</button></div>' +
        CK.stepper(stages.map(function (s) { return { label: CK.DEAL_LABEL[s] }; }), idx, { label: 'Deal stage', compact: true }) +
        (can && d.stage !== 'closed' ? '<div class="btnrow">' + (idx < stages.length - 1 ? '<button type="button" class="btn sm primary" data-dd="adv">Move to ' + CK.DEAL_LABEL[stages[idx + 1]] + ic('arrow', 14) + '</button>' : '<button type="button" class="btn sm primary" data-dd="close">' + ic('check', 14) + 'Close deal</button>') + '<button type="button" class="btn sm ghost" data-dd="lose">Mark lost</button></div>' : '') + '</header>';
      var money = '<section class="card"><div class="card-h"><h3>Price</h3><span class="muted sm">asked ' + CK.money(d.ask, true) + '</span></div><p class="big-n">' + CK.inr(d.value) + (d.kind === 'rent' ? '<small> a month</small>' : '') + '</p>' + (d.offers.length ? '<ol class="offers">' + d.offers.map(function (o) { return '<li>' + ic(o.by === 'owner' ? 'key' : 'users', 13) + (o.by === 'owner' ? 'Owner' : 'Client') + ' · <b>' + CK.money(o.amt, true) + '</b><small class="muted"> ' + CK.ago(o.at) + '</small></li>'; }).join('') + '</ol>' : '') + (can && (d.stage === 'shortlist' || d.stage === 'negotiation') ? '<div class="btnrow"><button type="button" class="btn sm" data-dd="offer" data-by="client">Log client offer</button><button type="button" class="btn sm" data-dd="offer" data-by="owner">Log owner counter</button></div>' : '') +
        (d.token ? '<p class="token-l">' + ic('check', 14) + 'Token ' + CK.inr(d.token.amt) + ' paid ' + CK.date(d.token.at) + ' — home blocked</p>' : can && (d.stage === 'negotiation' || d.stage === 'token') ? '<button type="button" class="btn sm primary" data-dd="token">' + ic('rupee', 14) + 'Record token</button>' : '') + '</section>';
      var docsH = '<section class="card"><div class="card-h"><h3>Documents</h3><span class="muted sm">' + docs.filter(function (x) { return d.docs[x[0]]; }).length + ' of ' + docs.length + '</span></div><ul class="cl cl-ed">' + docs.map(function (x) { var on = !!d.docs[x[0]]; var req = (d.kind === 'rent' ? ['tkyc', 'okyc', 'police', 'signed'] : ['bkyc', 'skyc', 'title', 'deed']).indexOf(x[0]) >= 0; return '<li><button type="button" class="' + (on ? 'ok' : '') + '" data-doc="' + x[0] + '" aria-pressed="' + on + '"' + (can || CK.role() === 'field' ? '' : ' disabled') + '><span class="box">' + ic('check', 12) + '</span><span><span>' + esc(x[1]) + (req ? ' <em class="req">needed to close</em>' : '') + '</span><small>' + (on ? 'Done ' + CK.date(d.docs[x[0]]) : 'Open') + '</small></span></button></li>'; }).join('') + '</ul></section>';
      var split = '<section class="card"><div class="card-h"><h3>Commission split</h3><span class="muted sm">' + (d.kind === 'rent' ? 'one month’s rent from each side' : '1% from each side') + ' · total ' + CK.inr(f.total) + '</span></div><div class="split-bar" aria-hidden="true"><span style="flex:' + d.split.agent + '" class="sb-a"></span>' + (d.split.partner ? '<span style="flex:' + d.split.partner + '" class="sb-p"></span>' : '') + '<span style="flex:' + d.split.company + '" class="sb-c"></span></div><div class="split-g"><div><span class="lg sb-a"></span>Agent · ' + esc(CK.agent(d.agent).name.split(' ')[0]) + '<b>' + d.split.agent + '% · ' + CK.inr(f.agent) + '</b></div>' + (d.partner ? '<div><span class="lg sb-p"></span>Partner · ' + esc(CK.partner(d.partner).name.split(' ')[0]) + '<b>' + d.split.partner + '% · ' + CK.inr(f.partner) + '</b></div>' : '') + '<div><span class="lg sb-c"></span>Amaltas<b>' + d.split.company + '% · ' + CK.inr(f.company) + '</b></div></div>' + (can ? '<div class="fld"><label for="sp-a">Agent share: <b id="sp-av">' + d.split.agent + '%</b></label><input type="range" id="sp-a" min="10" max="40" step="5" value="' + d.split.agent + '"></div>' : '') + '</section>';
      var coll = '<section class="card"><div class="card-h"><h3>Collections</h3></div><table class="tbl mini"><tbody>' + d.coll.map(function (c, i) { return '<tr><td>' + esc(c.from) + (c.note ? '<small class="muted"> · ' + esc(c.note) + '</small>' : '') + '</td><td class="num">' + CK.inr(c.amt) + '</td><td>' + (c.st === 'received' ? CK.pill('Received ' + CK.date(c.at), 'green') : c.st === 'passed' ? CK.pill('Paid to owner', 'grey') : c.st === 'invoiced' ? (can ? '<button type="button" class="btn sm" data-col="' + i + '" data-st="received">Mark received</button>' : CK.pill('Invoiced', 'amber')) : (can ? '<button type="button" class="btn sm ghost" data-col="' + i + '" data-st="invoiced">Raise invoice</button>' : CK.pill('Due', 'grey'))) + '</td></tr>'; }).join('') + '</tbody></table></section>';
      var hist = '<section class="card"><div class="card-h"><h3>History</h3></div><ol class="tl">' + d.hist.slice().reverse().map(function (h) { return '<li><span class="tl-ic">' + ic('layers', 13) + '</span><div><p>' + CK.DEAL_LABEL[h.stage] + '</p><small class="muted">' + CK.date(h.at, true) + '</small></div></li>'; }).join('') + '</ol></section>';
      var people = '<section class="card">' + CK.kv([['Client', CK.chipLead(L)], ['Home', CK.chipProp(p)], ['Owner', CK.chipOwner(CK.owner(p.ownerId))], ['Agent', CK.chipAgent(CK.agent(d.agent))], d.partner ? ['Partner', esc(CK.partner(d.partner).name)] : null]) + '</section>';
      return head + '<div class="dbody">' + money + docsH + split + coll + people + hist + '</div>';
    },
    mount: function (el, id) {
      var d = CK.deal(id);
      el.onclick = function (e) {
        var t = e.target.closest('[data-dd],[data-doc],[data-col]'); if (!t) return;
        if (t.dataset.doc) { var k = t.dataset.doc, on = !d.docs[k]; CK.act.doc(d, k, on); CK.toast(on ? 'Ticked' : 'Unticked', { undo: function () { CK.act.doc(d, k, !on); } }); return; }
        if (t.dataset.col) { var c = d.coll[+t.dataset.col], prev = c.st; CK.act.collect(d, c, t.dataset.st); CK.toast(t.dataset.st === 'received' ? CK.inr(c.amt) + ' received' : 'Invoice raised', { icon: 'rupee', undo: function () { c.st = prev; CK.emit('deal'); } }); return; }
        var a = t.dataset.dd, stages = CK.dealStages(d), idx = stages.indexOf(d.stage);
        if (a === 'adv') moveDeal(d, stages[idx + 1]);
        if (a === 'close') moveDeal(d, 'closed');
        if (a === 'lose') CK.confirm('Mark ' + d.id + ' lost?', 'The hold on ' + CK.prop(d.pid).code + ' is released so others can see it.', 'Mark lost', function () { CK.act.dealStage(d, 'lost'); CK.closeDrawer(); }, 'danger');
        if (a === 'token') { var m = CK.modal('<h2 id="modal-t">Record token</h2><p class="muted sm">Paid by the client directly to the owner; Amaltas keeps the receipt.</p><div class="fld"><label for="tk">Amount (₹)</label><input id="tk" inputmode="numeric" value="' + (d.kind === 'rent' ? Math.round(d.value / 2 / 1000) * 1000 : 500000) + '"></div><div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn primary" id="tk-ok">Record &amp; block the home</button></div>'); m.querySelector('#tk-ok').onclick = function () { var v = +m.querySelector('#tk').value.replace(/\D/g, ''); if (!v) return; CK.closeModal(); CK.act.token(d, v); if (d.stage === 'negotiation') CK.act.dealStage(d, 'token'); CK.celebrate(); CK.toast('Token recorded — ' + CK.prop(d.pid).code + ' is blocked'); }; }
        if (a === 'offer') { var by = t.dataset.by; var m2 = CK.modal('<h2 id="modal-t">' + (by === 'owner' ? 'Owner’s counter' : 'Client’s offer') + '</h2><div class="fld"><label for="of">Amount (₹)</label><input id="of" inputmode="numeric" value="' + d.value + '"></div><div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn primary" id="of-ok">Log it</button></div>'); m2.querySelector('#of-ok').onclick = function () { var v = +m2.querySelector('#of').value.replace(/\D/g, ''); if (!v) return; CK.closeModal(); CK.act.offer(d, v, by); if (d.stage === 'shortlist') CK.act.dealStage(d, 'negotiation'); CK.toast('Logged · brokerage recalculated'); }; }
      };
      var r = el.querySelector('#sp-a'); if (r) { r.oninput = function () { el.querySelector('#sp-av').textContent = r.value + '%'; }; r.onchange = function () { var old = d.split.agent; CK.act.split(d, +r.value, d.split.partner); CK.toast('Split updated', { undo: function () { CK.act.split(d, old, d.split.partner); } }); }; }
    }
  };
  CK.celebrate = function () {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var c = document.createElement('div'); c.className = 'confetti'; c.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 26; i++) { var s = document.createElement('i'); s.style.left = (10 + Math.random() * 80) + '%'; s.style.animationDelay = (Math.random() * .25) + 's'; s.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg'); s.style.setProperty('--x', (Math.random() * 160 - 80) + 'px'); c.appendChild(s); }
    document.body.appendChild(c); setTimeout(function () { c.remove(); }, 1800);
  };

  /* ============ PRINT ISSUE ============ */
  var PV = { id: null, picking: false };
  CK.V.print = {
    title: 'Print listings',
    render: function () {
      var s = S(), iss = s.issues.filter(function (x) { return x.id === (PV.id || s.issues[0].id); })[0];
      var props = iss.pids.map(CK.prop).filter(Boolean);
      var stale = props.filter(function (p) { var v = CK.ver(p); return v !== 'fresh' || p.status !== 'available'; });
      var byArea = {}; props.forEach(function (p) { (byArea[p.area] = byArea[p.area] || []).push(p); });
      var head = '<div class="ph noprint"><div><h1>Print listings</h1><p class="muted">A monthly magazine built from verified inventory. Every listing is checked again before it goes to print.</p></div><div class="ph-a"><label class="fsel"><span class="sr">Issue</span><select data-iss>' + s.issues.map(function (x) { return '<option value="' + x.id + '"' + (x.id === iss.id ? ' selected' : '') + '>' + esc(x.title) + ' · ' + x.status + '</option>'; }).join('') + '</select></label>' + (iss.status !== 'printed' ? '<button type="button" class="btn" data-pr="pick">' + ic('plus', 15) + 'Add listings</button>' : '') + '<button type="button" class="btn primary" data-pr="print">' + ic('print', 15) + 'Print / save PDF</button></div></div>';
      var review = '<section class="panel noprint review"><div class="panel-h"><h2>Review before print</h2>' + CK.stepper([{ label: 'Draft' }, { label: 'Review' }, { label: 'Printed' }], { draft: 0, review: 1, printed: 2 }[iss.status], { compact: true, label: 'Issue status' }) + '</div>' + (stale.length ? '<p class="warn-n">' + ic('flag', 14) + stale.length + ' listing' + (stale.length > 1 ? 's need' : ' needs') + ' attention: ' + stale.map(function (p) { return p.code + ' (' + (p.status !== 'available' ? CK.statusPill(p).replace(/<[^>]+>/g, '') : 'check ' + CK.ver(p)) + ')'; }).join(', ') + '</p><div class="btnrow"><button type="button" class="btn sm" data-pr="drop">Remove them from this issue</button></div>' : '<p class="tx-ok">' + ic('check', 14) + 'All ' + props.length + ' listings are verified and available.</p>') + (iss.status === 'draft' ? '<div class="btnrow"><button type="button" class="btn sm primary" data-pr="review">Send for review</button></div>' : iss.status === 'review' ? '<div class="btnrow"><button type="button" class="btn sm primary" data-pr="printed">Approve · mark printed</button></div>' : '<p class="muted sm">Printed ' + CK.date(iss.printedAt) + ' · ' + CK.grp(iss.copies || 1500) + ' copies</p>') + '</section>';
      var mag = '<article class="mag" aria-label="Magazine preview"><header class="mag-cover"><div class="mag-mast"><span class="mag-logo">' + ic('door', 22) + 'Amaltas Homes</span><span>' + esc(iss.title.split('·')[1] || '') + '</span></div><h2 class="serif">' + esc(iss.sub) + '</h2><p>' + props.length + ' homes · each one visited and photographed by our team in the last month. Call the Green Park office and quote the code.</p><img src="' + CK.ph((props[0] || s.props[0]).photos[0]) + '" alt="" width="900" height="500"></header>' +
        Object.keys(byArea).map(function (a) { return '<section class="mag-sec"><h3>' + esc(CK.area(a).name) + '<small>' + byArea[a].length + '</small></h3><div class="mag-grid">' + byArea[a].map(function (p) { return '<div class="mag-it"><img src="' + CK.ph(p.photos[0], 1) + '" alt="" width="300" height="200" loading="lazy"><div><b>' + CK.price(p) + '</b><span>' + esc(CK.cfg(p)) + ' · ' + esc(p.floor) + '</span><span>' + CK.grp(p.sqft) + ' sq ft · ' + esc(p.furn) + '</span><span class="mono">' + p.code + (CK.ver(p) === 'fresh' ? ' · ✓ verified ' + CK.date(p.ver.at) : '') + '</span></div>' + (iss.status !== 'printed' ? '<button type="button" class="ibtn noprint" data-rm="' + p.id + '" aria-label="Remove ' + p.code + '">' + ic('x', 14) + '</button>' : '') + '</div>'; }).join('') + '</div></section>'; }).join('') +
        '<footer class="mag-foot">Amaltas Estates · Green Park, New Delhi · Rentals and resale in South Delhi and Gurugram · Listings change fast; we confirm availability on the phone.</footer></article>';
      return head + review + mag + (PV.picking ? picker(iss) : '');
    },
    mount: function (el) {
      el.addEventListener('change', function (e) { if (e.target.matches('[data-iss]')) { PV.id = e.target.value; CK.render(); } });
      el.addEventListener('click', function (e) {
        var iss = S().issues.filter(function (x) { return x.id === (PV.id || S().issues[0].id); })[0];
        var t = e.target.closest('[data-pr],[data-rm],[data-addp]'); if (!t) return;
        if (t.dataset.rm) { var pid = t.dataset.rm, i = iss.pids.indexOf(pid); CK.act.issue(iss, { pids: iss.pids.filter(function (x) { return x !== pid; }) }); CK.toast('Removed from the issue', { undo: function () { iss.pids.splice(i, 0, pid); CK.emit('issue'); } }); return; }
        if (t.dataset.addp) { CK.act.issue(iss, { pids: iss.pids.concat([t.dataset.addp]) }); return; }
        var a = t.dataset.pr;
        if (a === 'print') window.print();
        if (a === 'pick') { PV.picking = !PV.picking; CK.render(); }
        if (a === 'review') CK.act.issue(iss, { status: 'review' });
        if (a === 'printed') { CK.act.issue(iss, { status: 'printed', printedAt: CK.now(), copies: 1500 }); CK.toast('Issue marked printed'); }
        if (a === 'drop') { var old = iss.pids.slice(); CK.act.issue(iss, { pids: iss.pids.filter(function (pid) { var p = CK.prop(pid); return CK.ver(p) === 'fresh' && p.status === 'available'; }) }); CK.toast('Removed ' + (old.length - iss.pids.length) + ' listings', { undo: function () { iss.pids = old; CK.emit('issue'); } }); }
      });
    }
  };
  function picker(iss) {
    var c = S().props.filter(function (p) { return iss.pids.indexOf(p.id) < 0 && p.status === 'available' && CK.ver(p) === 'fresh'; });
    return '<section class="panel noprint"><div class="panel-h"><h2>Verified and available · ' + c.length + '</h2><button type="button" class="btn sm" data-pr="pick">Done</button></div><div class="pick-g">' + c.map(function (p) { return '<button type="button" class="cand" data-addp="' + p.id + '"><img src="' + CK.ph(p.photos[0], 1) + '" alt="" width="56" height="40" loading="lazy"><span><b class="mono">' + p.code + '</b><small>' + esc(CK.area(p.area).short) + ' · ' + CK.price(p) + '</small></span>' + ic('plus', 14) + '</button>'; }).join('') + '</div></section>';
  }

  /* ============ REPORTS ============ */
  CK.V.reports = {
    title: 'Reports',
    render: function () {
      var s = S(), now = CK.now();
      var funnel = CK.SOURCES.map(function (src) { var ls = s.leads.filter(function (L) { return L.src === src; }); var ord = ['new', 'contacted', 'requirement', 'matched', 'visit', 'deal']; function atl(st) { return ls.filter(function (L) { return ord.indexOf(L.stage) >= ord.indexOf(st); }).length; } return { src: src, n: ls.length, req: atl('requirement'), visit: atl('visit'), deal: atl('deal'), won: s.deals.filter(function (d) { return d.stage === 'closed' && CK.lead(d.lead).src === src; }).length }; });
      var maxN = Math.max.apply(null, funnel.map(function (f) { return f.n; }));
      var fun = '<table class="tbl funnel"><thead><tr><th>Source</th><th>Leads</th><th>Requirement</th><th>Visited</th><th>Deal</th><th class="num">Lead → deal</th></tr></thead><tbody>' + funnel.map(function (f) { function cell(v) { return '<td><span class="fbar-c"><span style="width:' + (v / maxN * 100) + '%"></span></span><b>' + v + '</b></td>'; } return '<tr><td>' + CK.srcChip(f.src) + '</td>' + cell(f.n) + cell(f.req) + cell(f.visit) + cell(f.deal) + '<td class="num"><b>' + (f.n ? Math.round(f.deal / f.n * 100) : 0) + '%</b></td></tr>'; }).join('') + '</tbody></table>';
      var people = s.agents.filter(function (a) { return a.role !== 'admin'; }).map(function (a, i) {
        var calls = 0; s.leads.forEach(function (L) { L.tl.forEach(function (e) { if (e.kind === 'call' && e.by === a.id) calls++; }); });
        calls += { telecaller: 140, manager: 30, field: 18 }[a.role] + (i * 13) % 40;
        var visits = 0; s.trips.forEach(function (t) { if (t.agent === a.id) t.stops.forEach(function (st) { if (st.st === 'done') visits++; }); });
        var deals = s.deals.filter(function (d) { return (d.agent === a.id || CK.lead(d.lead).owner === a.id) && ['token', 'agreement', 'movein', 'registry', 'closed'].indexOf(d.stage) >= 0; }).length;
        var comm = s.deals.filter(function (d) { return d.agent === a.id && d.stage === 'closed'; }).reduce(function (x, d) { return x + CK.dealFees(d).agent; }, 0);
        return { a: a, calls: calls, visits: visits, deals: deals, comm: comm };
      }).sort(function (x, y) { return (y.deals * 50 + y.visits * 3 + y.calls / 10) - (x.deals * 50 + x.visits * 3 + x.calls / 10); });
      var lb = '<table class="tbl"><thead><tr><th>#</th><th>Person</th><th class="num">Calls · 30 d</th><th class="num">Visits</th><th class="num">Tokens+</th><th class="num">Agent share</th></tr></thead><tbody>' + people.map(function (x, i) { return '<tr><td class="muted">' + (i + 1) + '</td><td><span class="row-b">' + CK.av(x.a) + '<span><b>' + esc(x.a.name) + '</b><small class="muted"> ' + esc(x.a.title) + '</small></span></span></td><td class="num">' + x.calls + '</td><td class="num">' + x.visits + '</td><td class="num">' + x.deals + '</td><td class="num">' + (x.comm ? CK.money(x.comm) : '—') + '</td></tr>'; }).join('') + '</tbody></table>';
      var fb = { Fresh: 0, Ageing: 0, Stale: 0 }; s.props.forEach(function (p) { if (p.status === 'available' || p.status === 'hold') fb[CK.freshLabel(CK.fresh(p))]++; });
      var byArea = {}; s.props.forEach(function (p) { if (p.status !== 'available') return; byArea[p.area] = byArea[p.area] || []; byArea[p.area].push(CK.fresh(p)); });
      var areaRows = Object.keys(byArea).map(function (k) { var v = byArea[k]; return { label: CK.area(k).short, value: Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length), tone: '' }; }).sort(function (a, b) { return a.value - b.value; }).slice(0, 8).map(function (r) { r.tone = r.value >= 70 ? 'ok' : r.value >= 45 ? 'warn' : 'bad'; return r; });
      var closed = s.deals.filter(function (d) { return d.stage === 'closed'; });
      var ttc = { rent: [], sale: [] }; s.deals.forEach(function (d) { var L = CK.lead(d.lead); var end = d.closedAt || now; ttc[d.kind].push(Math.max(4, Math.round((end - L.created) / CK.DAY))); });
      function med(a) { if (!a.length) return 0; a = a.slice().sort(function (x, y) { return x - y; }); return a[Math.floor(a.length / 2)]; }
      var stageDays = [['Lead → first call', '11 min'], ['First call → requirement', '1.6 days'], ['Requirement → first visit', '3.2 days'], ['Visit → token', '6 days'], ['Token → move-in', '9 days']];
      return '<div class="ph"><div><h1>Reports</h1><p class="muted">Last 30 days unless marked · every number is computed from the same records you see elsewhere</p></div><div class="ph-a"><button type="button" class="btn" data-act="print">' + ic('print', 15) + 'Print</button></div></div>' +
        '<div class="rep-g"><section class="panel span2"><div class="panel-h"><h2>Lead funnel by source</h2><span class="muted sm">how far leads from each source get</span></div><div class="tbl-scroll">' + fun + '</div></section>' +
        '<section class="panel"><div class="panel-h"><h2>Inventory freshness</h2><span class="muted sm">available listings</span></div><div class="fresh-donut">' + donut(fb) + '<ul class="legend">' + Object.keys(fb).map(function (k) { return '<li><span class="lg t-' + { Fresh: 'ok', Ageing: 'warn', Stale: 'bad' }[k] + '"></span>' + k + '<b>' + fb[k] + '</b></li>'; }).join('') + '</ul></div><h3 class="sh sm">Least fresh areas</h3>' + CK.bars(areaRows, { fmt: function (v) { return v + '/100'; } }) + '</section>' +
        '<section class="panel span2"><div class="panel-h"><h2>Agent leaderboard</h2><span class="muted sm">calls, visits and deals that reached token or beyond</span></div><div class="tbl-scroll">' + lb + '</div></section>' +
        '<section class="panel"><div class="panel-h"><h2>Time to close</h2></div><div class="ttc"><div><span class="muted sm">Rentals · median</span><b>' + med(ttc.rent) + ' days</b></div><div><span class="muted sm">Resale · median</span><b>' + med(ttc.sale) + ' days</b></div></div><ol class="stage-t">' + stageDays.map(function (x) { return '<li><span>' + x[0] + '</span><b>' + x[1] + '</b></li>'; }).join('') + '</ol><p class="muted sm">' + closed.length + ' closed this month · ' + s.deals.filter(function (d) { return d.stage !== 'closed' && d.stage !== 'lost'; }).length + ' open</p></section></div>';
    },
    mount: function (el) { el.addEventListener('click', function (e) { if (e.target.closest('[data-act="print"]')) window.print(); }); }
  };
  function donut(o) {
    var tot = o.Fresh + o.Ageing + o.Stale || 1, r = 52, c = 2 * Math.PI * r, off = 0, col = { Fresh: 'var(--ok)', Ageing: 'var(--warn)', Stale: 'var(--bad)' };
    return '<svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label="' + o.Fresh + ' fresh, ' + o.Ageing + ' ageing, ' + o.Stale + ' stale"><circle cx="70" cy="70" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="16"/>' + Object.keys(o).map(function (k) { var len = o[k] / tot * c; var s = '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="' + col[k] + '" stroke-width="16" stroke-dasharray="' + Math.max(0, len - 2).toFixed(1) + ' ' + c.toFixed(1) + '" stroke-dashoffset="' + (-off).toFixed(1) + '" transform="rotate(-90 70 70)"/>'; off += len; return s; }).join('') + '<text x="70" y="68" text-anchor="middle" class="d-n">' + Math.round(o.Fresh / tot * 100) + '%</text><text x="70" y="86" text-anchor="middle" class="d-l">fresh</text></svg>';
  }

  /* ============ ACTIVITY LOG ============ */
  var AV = { q: '' };
  CK.V.audit = {
    title: 'Activity log',
    render: function () {
      var rows = S().audit.filter(function (a) { return !AV.q || (a.action + ' ' + a.ref + ' ' + a.detail + ' ' + whoName(a.who)).toLowerCase().indexOf(AV.q.toLowerCase()) >= 0; }).slice(0, 200);
      return '<div class="ph"><div><h1>Activity log</h1><p class="muted">Every change, by whom and when. Read-only; kept for 12 months.</p></div></div><div class="fbar"><label class="search"><span class="sr">Filter log</span>' + ic('search', 15) + '<input data-aq value="' + esc(AV.q) + '" placeholder="Filter: a code, a person, “token”"></label></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>When</th><th>Who</th><th>What</th><th>Record</th><th class="hide-m">Detail</th></tr></thead><tbody>' + rows.map(function (a) { var w = CK.agent(a.who) || CK.partner(a.who); return '<tr><td class="nw">' + CK.dayLabel(a.at) + ' ' + CK.time(a.at) + '</td><td>' + (w ? '<span class="row-b">' + CK.av(w, 's') + esc(w.name) + '</span>' : 'System') + '</td><td>' + esc(a.action) + '</td><td class="mono">' + esc(a.ref || '') + '</td><td class="hide-m muted">' + esc(a.detail || '') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    },
    mount: function (el) { el.addEventListener('input', function (e) { if (e.target.matches('[data-aq]')) { AV.q = e.target.value; clearTimeout(AV.t); AV.t = setTimeout(function () { var p = e.target.selectionStart; CK.render(); var i = document.querySelector('[data-aq]'); i.focus(); i.setSelectionRange(p, p); }, 160); } }); }
  };
  function whoName(id) { var w = CK.agent(id) || CK.partner(id); return w ? w.name : ''; }

})();
