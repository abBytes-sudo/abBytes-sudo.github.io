/* Chaukhat — Inventory, property panel, verification desk, owners, partners and the partner portal. */
(function () {
  'use strict';
  var CK = window.CK, esc = CK.esc, ic = CK.ic;
  function S() { return CK.S(); }

  /* ============ INVENTORY ============ */
  var IV = { tab: 'all', q: '', area: '', bhk: '', mode: 'grid' };
  var ITABS = [
    ['all', 'All', function (p) { return p.status !== 'inactive'; }], ['rent', 'Rent', function (p) { return p.deal === 'rent' && p.status === 'available'; }], ['sale', 'Sale', function (p) { return p.deal === 'sale' && p.status === 'available'; }],
    ['check', 'Needs a check', function (p) { var v = CK.ver(p); return v !== 'fresh' && p.status !== 'let' && p.status !== 'sold'; }], ['held', 'On hold / blocked', function (p) { return p.status === 'hold' || p.status === 'blocked'; }], ['closed', 'Let out / sold', function (p) { return p.status === 'let' || p.status === 'sold' || p.status === 'inactive'; }]
  ];
  function invList() {
    var t = ITABS.filter(function (x) { return x[0] === IV.tab; })[0];
    return S().props.filter(function (p) {
      if (!t[2](p)) return false; if (IV.area && p.area !== IV.area) return false; if (IV.bhk && String(p.bhk) !== IV.bhk) return false;
      if (IV.q) { var h = (p.code + ' ' + p.addr + ' ' + p.type + ' ' + p.bhk + 'bhk ' + p.deal + ' ' + CK.owner(p.ownerId).name).toLowerCase(); if (!IV.q.toLowerCase().split(/\s+/).every(function (w) { return h.indexOf(w) >= 0; })) return false; }
      return true;
    });
  }
  function leadsFor(p) { return S().leads.filter(function (L) { if (L.stage === 'lost' || L.stage === 'deal') return false; var m = CK.match(L, p); return m && m.score >= 60; }).length; }
  CK.V.inventory = {
    title: 'Inventory',
    render: function () {
      var all = S().props, list = invList(), avail = all.filter(function (p) { return p.status === 'available'; }).length;
      var avgF = Math.round(all.filter(function (p) { return p.status === 'available'; }).reduce(function (a, p) { return a + CK.fresh(p); }, 0) / Math.max(1, avail));
      var head = '<div class="ph"><div><h1>Inventory</h1><p class="muted">' + all.length + ' listings · ' + avail + ' available · average freshness ' + avgF + '/100 · rent re-checked every ' + S().settings.rentWindow + ' days, sale every ' + S().settings.saleWindow + '</p></div><div class="ph-a"><div class="seg" role="group" aria-label="Layout"><button type="button" data-imode="grid" aria-pressed="' + (IV.mode === 'grid') + '">' + ic('board', 15) + '<span>Cards</span></button><button type="button" data-imode="table" aria-pressed="' + (IV.mode === 'table') + '">' + ic('list', 15) + '<span>Table</span></button></div>' + (CK.can('props.create') ? '<button type="button" class="btn primary" data-act="new-prop">' + ic('plus', 16) + 'Add listing</button>' : '') + '</div></div>';
      var tabs = '<div class="tabs scrollx" role="tablist" aria-label="Inventory views">' + ITABS.map(function (t) { return '<button type="button" role="tab" data-itab="' + t[0] + '" aria-selected="' + (IV.tab === t[0]) + '">' + t[1] + '<span class="cnt">' + all.filter(t[2]).length + '</span></button>'; }).join('') + '</div>';
      var bar = '<div class="fbar"><label class="search"><span class="sr">Search listings</span>' + ic('search', 15) + '<input data-if="q" value="' + esc(IV.q) + '" placeholder="Code, colony, owner, “3 bhk rent”"></label><label class="fsel"><span class="sr">Area</span><select data-if="area"><option value="">All areas</option>' + CK.AREAS.map(function (a) { return '<option value="' + a.id + '"' + (IV.area === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('') + '</select></label><label class="fsel"><span class="sr">BHK</span><select data-if="bhk"><option value="">Any BHK</option>' + ['1', '2', '3', '4', '5', '6'].map(function (b) { return '<option' + (IV.bhk === b ? ' selected' : '') + '>' + b + '</option>'; }).join('') + '</select></label></div>';
      var body = !list.length ? CK.empty('No listings here', 'Clear a filter, or add a listing — it goes straight to the verification desk.') : IV.mode === 'grid' ? '<div class="pgrid">' + list.map(card).join('') + '</div>' : tableP(list);
      return head + tabs + bar + body;
    },
    mount: function (el) {
      el.addEventListener('click', function (e) { var t = e.target.closest('[data-itab],[data-imode]'); if (!t) return; if (t.dataset.itab) IV.tab = t.dataset.itab; else IV.mode = t.dataset.imode; CK.render(); });
      el.addEventListener('input', function (e) { if (e.target.dataset.if === 'q') { IV.q = e.target.value; clearTimeout(IV.tm); IV.tm = setTimeout(function () { var pos = e.target.selectionStart; CK.render(); var i = document.querySelector('[data-if="q"]'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } }, 160); } });
      el.addEventListener('change', function (e) { var f = e.target.dataset.if; if (f && f !== 'q') { IV[f] = e.target.value; CK.render(); } });
    }
  };
  function card(p) {
    var f = CK.fresh(p), a = CK.area(p.area);
    return '<article class="pcard"><button type="button" class="pc-img" data-peek="prop:' + p.id + '" aria-label="Open ' + p.code + ', ' + esc(CK.cfg(p)) + ' in ' + esc(a.name) + '"><img src="' + CK.ph(p.photos[0], 1) + '" alt="" loading="lazy" decoding="async" width="440" height="300">' + (CK.ver(p) === 'fresh' ? '<span class="vbadge">' + ic('shield', 12) + 'Verified</span>' : '') + '<span class="pc-deal">' + (p.deal === 'rent' ? 'Rent' : 'Sale') + '</span></button>' +
      '<div class="pc-b"><div class="pc-t"><b>' + CK.price(p) + '</b>' + CK.ring(f, 28) + '</div><p class="pc-c">' + esc(CK.cfg(p)) + ' · ' + esc(p.floor) + '</p><p class="muted sm">' + esc(a.name) + ' · <span class="mono">' + p.code + '</span></p><div class="pc-f">' + (p.status !== 'available' ? CK.statusPill(p) : CK.verPill(p)) + '<span class="grow"></span><span class="muted sm" title="Open leads this home fits">' + ic('users', 13) + leadsFor(p) + '</span></div></div></article>';
  }
  function tableP(list) {
    return '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Listing</th><th>Configuration</th><th>Price</th><th class="hide-m">Owner</th><th>Check</th><th>Fresh</th><th class="hide-m">Status</th><th class="hide-m">Fits</th></tr></thead><tbody>' + list.map(function (p) {
      var h = p.hist, dir = h.length > 1 ? (h[h.length - 1].price < h[h.length - 2].price ? '↓' : h[h.length - 1].price > h[h.length - 2].price ? '↑' : '') : '';
      return '<tr><td><button type="button" class="lead-cell" data-peek="prop:' + p.id + '"><img class="thumb" src="' + CK.ph(p.photos[0], 1) + '" alt="" width="44" height="32" loading="lazy"><span><b class="mono">' + p.code + '</b><small>' + esc(CK.area(p.area).name) + '</small></span></button></td><td>' + esc(CK.cfg(p)) + '<small class="muted"> · ' + esc(p.floor) + '</small></td><td><b>' + CK.price(p) + '</b> <span class="muted" title="Last price change">' + dir + '</span></td><td class="hide-m">' + CK.chipOwner(CK.owner(p.ownerId)) + '</td><td>' + CK.verPill(p) + '</td><td>' + CK.ring(CK.fresh(p), 26) + '</td><td class="hide-m">' + CK.statusPill(p) + '</td><td class="hide-m">' + leadsFor(p) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }

  /* ============ PROPERTY PANEL ============ */
  var PP = { tab: 'details', img: 0 };
  CK.D.prop = {
    render: function (id) {
      var p = CK.prop(id); if (!p) return CK.empty('Listing not found', '');
      if (PP.id !== id) { PP.id = id; PP.tab = 'details'; PP.img = 0; }
      var o = CK.owner(p.ownerId), a = CK.area(p.area), f = CK.fresh(p);
      var gal = '<div class="gal"><img class="gal-main" src="' + CK.ph(p.photos[PP.img]) + '" alt="' + esc(CK.cfg(p) + ', ' + a.name + ' — photo ' + (PP.img + 1) + ' of ' + p.photos.length) + '" width="640" height="420"><div class="gal-th" role="group" aria-label="Photos">' + p.photos.map(function (ph, i) { return '<button type="button" data-img="' + i + '" aria-pressed="' + (i === PP.img) + '" aria-label="Photo ' + (i + 1) + '"><img src="' + CK.ph(ph, 1) + '" alt="" width="64" height="44" loading="lazy"></button>'; }).join('') + '</div></div>';
      var head = '<header class="dh"><div class="dh-top"><div class="grow"><p class="muted sm mono">' + p.code + ' · ' + esc(p.src) + '</p><h2 id="drawer-t">' + esc(CK.cfg(p)) + ' · ' + esc(a.name) + '</h2><p class="dh-price"><b>' + CK.priceLong(p) + '</b>' + (p.maint ? ' <span class="muted">+ ' + CK.inr(p.maint) + ' maintenance</span>' : '') + '</p></div>' + CK.ring(f, 44) + '<button type="button" class="ibtn" data-close-drawer aria-label="Close panel">' + ic('x', 16) + '</button></div><div class="pills">' + CK.statusPill(p) + CK.verPill(p) + (p.holdFor ? '<span class="muted sm">for ' + CK.chipLead(CK.lead(p.holdFor)) + (p.holdUntil ? ' until ' + CK.time(p.holdUntil) + ' ' + CK.dayLabel(p.holdUntil).toLowerCase() : '') + '</span>' : '') + '</div></header>';
      var tabs = [['details', 'Details'], ['verify', 'Verification'], ['leads', 'Interested'], ['history', 'History']];
      var tb = '<div class="tabs dtabs" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" data-pptab="' + t[0] + '" aria-selected="' + (PP.tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>';
      var body = PP.tab === 'verify' ? verTab(p) : PP.tab === 'leads' ? leadsTab(p) : PP.tab === 'history' ? histTab(p) : details(p, o);
      return head + gal + tb + '<div class="dbody">' + body + '</div>';
    },
    mount: function (el, id) {
      var p = CK.prop(id);
      el.onclick = function (e) {
        var t = e.target.closest('[data-pptab],[data-img],[data-pa]'); if (!t) return;
        if (t.dataset.pptab) { PP.tab = t.dataset.pptab; CK.renderDrawer(); return; }
        if (t.dataset.img) { PP.img = +t.dataset.img; CK.renderDrawer(); return; }
        var a = t.dataset.pa;
        if (a === 'price') { var m = CK.modal('<h2 id="modal-t">Change price · ' + p.code + '</h2><div class="fld"><label for="pr-v">' + (p.deal === 'rent' ? 'Rent a month (₹)' : 'Asking price (₹)') + '</label><input id="pr-v" inputmode="numeric" value="' + p.price + '"><p class="hint" id="pr-h">Now ' + CK.money(p.price) + '. The old price stays in the history.</p></div><div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn primary" id="pr-ok">Save</button></div>'); var inp = m.querySelector('#pr-v'); inp.oninput = function () { var n = +inp.value.replace(/\D/g, ''); m.querySelector('#pr-h').textContent = n ? 'Reads as ' + CK.money(n) + ' (' + (n >= p.price ? '+' : '') + Math.round((n / p.price - 1) * 100) + '%)' : 'Numbers only'; }; m.querySelector('#pr-ok').onclick = function () { var n = +inp.value.replace(/\D/g, ''); if (!n) return; CK.closeModal(); var old = CK.act.setPrice(p, n); CK.toast('Price now ' + CK.money(n) + ' — matches re-scored', { undo: function () { p.hist.pop(); p.price = old; CK.emit('prop'); } }); }; }
        if (a === 'hold') { var ls = S().leads.map(function (L) { var mm = CK.match(L, p); return mm && L.stage !== 'lost' ? { label: L.name + ' · ' + mm.score + '%', id: L.id } : null; }).filter(Boolean).slice(0, 8); CK.menu(t, [{ head: 'Hold 48 h for…' }].concat(ls.length ? ls : [{ label: 'No matching leads', id: '' }]), function (it) { if (!it.id) return; CK.act.propStatus(p, 'hold', it.id); CK.toast('Held for ' + it.label.split(' · ')[0] + ' until ' + CK.time(p.holdUntil) + ' ' + CK.dayLabel(p.holdUntil).toLowerCase(), { undo: function () { CK.act.propStatus(p, 'available'); } }); }); }
        if (a === 'release') { var prev = { st: p.status, h: p.holdFor, u: p.holdUntil }; CK.act.propStatus(p, 'available'); CK.toast('Released — available again', { undo: function () { p.status = prev.st; p.holdFor = prev.h; p.holdUntil = prev.u; CK.emit('prop'); } }); }
        if (a === 'request') { CK.act.ownerRequest(p); CK.toast('“Update your listing” link sent to ' + CK.owner(p.ownerId).name); }
        if (a === 'desk') CK.go('#/verify/' + p.id);
        if (a === 'let') CK.confirm('Mark ' + p.code + ' as ' + (p.deal === 'rent' ? 'let out' : 'sold') + '?', 'It leaves matching and the website. You can bring it back from Inventory › Let out / sold.', 'Mark ' + (p.deal === 'rent' ? 'let out' : 'sold'), function () { var prev = p.status; CK.act.propStatus(p, p.deal === 'rent' ? 'let' : 'sold'); CK.toast(p.code + ' marked ' + (p.deal === 'rent' ? 'let out' : 'sold'), { undo: function () { CK.act.propStatus(p, prev); } }); });
        if (a === 'reactivate') { CK.act.propStatus(p, 'available'); CK.toast(p.code + ' is back in inventory'); }
      };
    }
  };
  function details(p, o) {
    var canEdit = CK.can('props.edit');
    var act = '<div class="btnrow">' + (canEdit ? '<button type="button" class="btn sm" data-pa="price">' + ic('rupee', 14) + 'Change price</button>' : '') + (p.status === 'available' && canEdit ? '<button type="button" class="btn sm" data-pa="hold">' + ic('clock', 14) + 'Hold for a client</button>' : '') + (p.status === 'hold' && canEdit ? '<button type="button" class="btn sm" data-pa="release">' + ic('undo', 14) + 'Release hold</button>' : '') + (canEdit && (p.status === 'available' || p.status === 'hold') ? '<button type="button" class="btn sm ghost" data-pa="let">' + ic('door', 14) + (p.deal === 'rent' ? 'Mark let out' : 'Mark sold') + '</button>' : '') + (canEdit && (p.status === 'let' || p.status === 'sold' || p.status === 'inactive') ? '<button type="button" class="btn sm" data-pa="reactivate">' + ic('undo', 14) + 'Back in inventory</button>' : '') + '</div>';
    return act + '<section class="card">' + CK.kv([
      ['Address', esc(p.addr)], ['Type', esc(p.type) + ' · ' + esc(p.floor) + (p.type === 'Apartment' ? ' floor' : '')], ['Size', CK.grp(p.sqft) + ' sq ft' + (p.bhk ? ' · ' + p.baths + ' baths · ' + p.balconies + ' balcon' + (p.balconies === 1 ? 'y' : 'ies') : '')],
      ['Furnishing', esc(p.furn)], ['Facing', esc(p.facing)], ['Parking', esc(p.parking)], ['Power backup', esc(p.backup)],
      p.deal === 'rent' ? ['Owner prefers', esc(p.pref || 'Any') + ' · ' + (p.pets ? 'pets allowed' : 'no pets')] : null,
      ['Available from', CK.date(p.availFrom, true) + (p.availFrom < CK.now() ? ' <span class="muted">(vacant now)</span>' : '')],
      ['Owner', CK.chipOwner(o) + '<span class="muted sm"> ' + esc(o.pref) + '</span>'], ['Portal', p.views + ' views · ' + p.enquiries + ' enquiries']
    ]) + '</section>';
  }
  function verTab(p) {
    var v = p.ver, st = CK.ver(p), win = CK.window(p);
    var due = v.at ? v.at + win * CK.DAY : null;
    var head = '<section class="card vcard v-' + st + '"><div class="row-b">' + ic('shield', 20) + '<div class="grow"><b>' + ({ pending: 'Not verified yet', fresh: 'Verified — badge is on', due: 'Check due', overdue: 'Overdue — badge is off', rejected: 'Rejected at the last check' }[st]) + '</b><p class="muted sm">' + (v.at ? 'Last check ' + CK.date(v.at, true) + ' by ' + esc(CK.agent(v.by).name) + ' · ' + (v.geo ? 'pin ' + v.geo.m + ' m from the listing · ' : '') + (v.photos || 0) + ' photos' : 'Added ' + CK.ago(p.created) + ' · waiting for a field check') + '</p></div></div>' + (due ? '<p class="sm">Re-verify after ' + win + ' days (' + (p.deal === 'rent' ? 'rent' : 'sale') + ' rule) → ' + (due < CK.now() ? '<b class="tx-bad">was due ' + CK.date(due) + '</b>' : 'next ' + CK.date(due, true)) + '</p>' : '') + (v.reject ? '<p class="sm tx-bad">Reason: ' + esc(v.reject) + '</p>' : '') + '<div class="btnrow">' + (CK.can('verify') ? '<button type="button" class="btn sm primary" data-pa="desk">' + ic('shield', 14) + 'Open in verification desk</button>' : '') + '<button type="button" class="btn sm" data-pa="request">' + ic('chat', 14) + 'Ask owner to update</button></div></section>';
    var list = '<section class="card"><div class="card-h"><h3>Checklist</h3></div><ul class="cl">' + CK.CHECKLIST.map(function (c) { var ok = v.checks && v.checks[c.id]; return '<li class="' + (ok ? 'ok' : '') + '">' + ic(ok ? 'check' : 'x', 14) + '<span>' + esc(c.label) + '<small>' + esc(c.hint) + '</small></span></li>'; }).join('') + '</ul></section>';
    var mp = '<section class="card"><div class="card-h"><h3>Pin</h3><span class="muted sm">' + p.lat.toFixed(4) + ', ' + p.lng.toFixed(4) + '</span></div><div class="mini-map">' + CK.map(p.r, { pins: [{ lat: p.lat, lng: p.lng, on: 1, r: p.r }], office: false, label: 'Location of ' + p.code, aspect: 2.6, minW: 600 }) + '</div></section>';
    return head + list + mp;
  }
  function leadsTab(p) {
    var ms = S().leads.map(function (L) { return L.stage === 'lost' ? null : CK.match(L, p) && { L: L, m: CK.match(L, p) }; }).filter(Boolean).sort(function (a, b) { return b.m.score - a.m.score; });
    var visited = []; S().trips.forEach(function (t) { t.stops.forEach(function (s) { if (s.pid === p.id) Object.keys(s.out).forEach(function (lid) { if (CK.lead(lid)) visited.push({ L: CK.lead(lid), o: s.out[lid], t: t }); }); }); });
    return '<section class="card"><div class="card-h"><h3>Visited</h3><span class="muted sm">' + visited.length + '</span></div>' + (visited.length ? visited.map(function (x) { return '<div class="row-b">' + CK.chipLead(x.L) + '<span class="muted sm">' + CK.date(x.t.start) + '</span><span class="grow"></span>' + CK.pill({ liked: 'Liked', short: 'Shortlisted', rejected: 'Rejected · ' + (x.o.reason || ''), novisit: 'Not visited' }[x.o.v], { liked: 'green', short: 'violet', rejected: 'red', novisit: 'grey' }[x.o.v]) + '</div>'; }).join('') : '<p class="muted">No visits yet.</p>') + '</section>' +
      '<section class="card"><div class="card-h"><h3>Open leads it fits</h3><span class="muted sm">' + ms.length + '</span></div>' + (ms.slice(0, 12).map(function (x) { return '<div class="row-b">' + CK.chipLead(x.L) + '<span class="muted sm">' + CK.stageLabel(x.L.stage) + '</span><span class="grow"></span>' + CK.score(x.m.score) + '</div>'; }).join('') || '<p class="muted">No open brief fits this home right now.</p>') + '</section>';
  }
  function histTab(p) {
    var vals = p.hist.map(function (h) { return h.price; });
    var o = CK.owner(p.ownerId), comms = o.comms.filter(function (c) { return c.text.indexOf(p.code) >= 0; });
    return '<section class="card"><div class="card-h"><h3>Price history</h3>' + (vals.length > 1 ? CK.spark(vals, 120, 30) : '') + '</div><ol class="ph-list">' + p.hist.slice().reverse().map(function (h, i, arr) { var prev = arr[i + 1]; var d = prev ? Math.round((h.price / prev.price - 1) * 100) : null; return '<li><span>' + CK.date(h.at) + ' ' + new Date(h.at).getFullYear() + '</span><b>' + CK.money(h.price) + '</b>' + (d ? '<span class="' + (d < 0 ? 'tx-ok' : 'tx-bad') + '">' + (d > 0 ? '+' : '') + d + '%</span>' : '<span class="muted">listed</span>') + '</li>'; }).join('') + '</ol></section>' +
      '<section class="card"><div class="card-h"><h3>Owner conversation</h3></div>' + (comms.length ? '<ol class="tl">' + comms.map(function (c) { return '<li><span class="tl-ic">' + ic(c.kind === 'call' ? 'phone' : c.kind === 'form' ? 'edit' : 'chat', 14) + '</span><div><p>' + esc(c.text) + '</p><small class="muted">' + CK.date(c.at) + '</small></div></li>'; }).join('') + '</ol>' : '<p class="muted">Nothing logged for this listing yet.</p>') + '</section>';
  }

  CK.newPropForm = function () {
    var m = CK.modal('<h2 id="modal-t">Add a listing</h2><p class="muted sm">It goes to the verification desk; it stays off the website and out of matching until a field check is approved.</p><form id="np-f" novalidate><div class="f3"><div class="fld"><label for="np-a">Area</label><select id="np-a">' + CK.AREAS.map(function (a) { return '<option value="' + a.id + '">' + esc(a.name) + '</option>'; }).join('') + '</select></div><div class="fld"><label for="np-pl">Plot / house no.</label><input id="np-pl" placeholder="e.g. C-214"></div><div class="fld"><label for="np-fl">Floor</label><select id="np-fl"><option>Ground</option><option selected>First</option><option>Second</option><option>Third</option><option>Fourth</option></select></div></div>' +
      '<div class="f3"><div class="fld"><label for="np-t">Type</label><select id="np-t"><option>Builder floor</option><option>Apartment</option><option>Independent house</option><option>Studio</option></select></div><div class="fld"><label for="np-d">For</label><select id="np-d"><option value="rent">Rent</option><option value="sale">Sale</option></select></div><div class="fld"><label for="np-b">BHK</label><select id="np-b"><option>2</option><option selected>3</option><option>4</option><option>1</option><option>5</option></select></div></div>' +
      '<div class="f3"><div class="fld"><label for="np-s">Size (sq ft)</label><input id="np-s" inputmode="numeric" value="1800"></div><div class="fld"><label for="np-p">Price (₹)</label><input id="np-p" inputmode="numeric" placeholder="95000"><p class="hint" id="np-ph"></p></div><div class="fld"><label for="np-o">Owner</label><select id="np-o">' + S().owners.map(function (o) { return '<option value="' + o.id + '">' + esc(o.name) + '</option>'; }).join('') + '</select></div></div><p class="err" id="np-err" role="alert"></p><div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="submit" class="btn primary">Add and send to desk</button></div></form>', { wide: true });
    var pr = m.querySelector('#np-p'); pr.oninput = function () { var n = +pr.value.replace(/\D/g, ''); m.querySelector('#np-ph').textContent = n ? 'Reads as ' + CK.money(n) : ''; };
    m.querySelector('#np-f').onsubmit = function (e) {
      e.preventDefault(); var err = m.querySelector('#np-err'), pl = m.querySelector('#np-pl'), n = +pr.value.replace(/\D/g, '');
      if (!pl.value.trim()) { pl.setAttribute('aria-invalid', 'true'); pl.focus(); err.textContent = 'Add the plot or house number — the field agent needs it to find the gate.'; return; }
      if (!n) { pr.setAttribute('aria-invalid', 'true'); pr.focus(); err.textContent = 'Add a price, even an approximate one.'; return; }
      var p = CK.act.newProp({ area: m.querySelector('#np-a').value, plot: pl.value.trim(), floor: m.querySelector('#np-fl').value, type: m.querySelector('#np-t').value, deal: m.querySelector('#np-d').value, bhk: m.querySelector('#np-b').value, sqft: +m.querySelector('#np-s').value || 1500, price: n, ownerId: m.querySelector('#np-o').value });
      CK.closeModal(); CK.toast(p.code + ' added · waiting at the verification desk'); CK.go('#/verify/' + p.id);
    };
  };

  /* ============ VERIFICATION DESK ============ */
  var VD = { checks: {}, photos: {} };
  function deskQueue() {
    var g = { pending: [], overdue: [], due: [], rejected: [] };
    S().props.forEach(function (p) { if (p.status === 'let' || p.status === 'sold' || p.status === 'inactive') return; var v = CK.ver(p); if (g[v]) g[v].push(p); });
    g.overdue.sort(function (a, b) { return a.ver.at - b.ver.at; }); g.pending.sort(function (a, b) { return a.created - b.created; });
    return g;
  }
  CK.V.verify = {
    title: 'Verification desk',
    render: function (r) {
      var g = deskQueue(), all = g.pending.concat(g.overdue, g.due, g.rejected);
      var cur = r.id ? CK.prop(r.id) : all[0];
      var fresh = S().props.filter(function (p) { return CK.ver(p) === 'fresh'; }).length;
      var head = '<div class="ph"><div><h1>Verification desk</h1><p class="muted">' + all.length + ' to check · ' + fresh + ' listings carry the Verified badge · rent re-checked after ' + S().settings.rentWindow + ' days, sale after ' + S().settings.saleWindow + '</p></div></div>';
      var ql = [['pending', 'New listings'], ['overdue', 'Overdue — badge off'], ['due', 'Due this week'], ['rejected', 'Rejected']].map(function (x) {
        if (!g[x[0]].length) return '';
        return '<div class="vq-g"><h3>' + x[1] + '<b>' + g[x[0]].length + '</b></h3>' + g[x[0]].map(function (p) { return '<a class="vq-it' + (cur && cur.id === p.id ? ' on' : '') + '" href="#/verify/' + p.id + '"' + (cur && cur.id === p.id ? ' aria-current="true"' : '') + '><img src="' + CK.ph(p.photos[0], 1) + '" alt="" width="48" height="36" loading="lazy"><span class="grow"><b class="mono">' + p.code + '</b><small>' + esc(CK.cfg(p)) + ' · ' + esc(CK.area(p.area).short) + '</small></span><small class="muted">' + (x[0] === 'pending' ? CK.ago(p.created) : CK.verAge(p) + 'd') + '</small></a>'; }).join('') + '</div>';
      }).join('');
      return head + '<div class="vdesk"><nav class="vq" aria-label="Verification queue">' + (ql || CK.empty('Desk is clear', 'Every listing carries a fresh check.')) + '</nav><section class="vd" aria-label="Selected listing">' + (cur ? deskItem(cur) : '') + '</section></div>';
    },
    mount: function (el, r) {
      var g = deskQueue(), cur = r.id ? CK.prop(r.id) : g.pending.concat(g.overdue, g.due, g.rejected)[0]; if (!cur) return;
      el.addEventListener('click', function (e) {
        var t = e.target.closest('[data-ck],[data-vd]'); if (!t) return;
        var ch = VD.checks[cur.id] = VD.checks[cur.id] || {};
        if (t.dataset.ck) { ch[t.dataset.ck] = !ch[t.dataset.ck]; CK.render(); return; }
        var a = t.dataset.vd;
        if (a === 'all') { CK.CHECKLIST.forEach(function (c) { if (c.id !== 'docs' || cur.deal === 'sale') ch[c.id] = 1; }); CK.render(); }
        if (a === 'photos') { VD.photos[cur.id] = (VD.photos[cur.id] || 0) + 4; cur.ver.newPhotos = VD.photos[cur.id]; CK.render(); CK.toast('4 field photos attached', { icon: 'camera' }); }
        if (a === 'approve') {
          var need = CK.CHECKLIST.filter(function (c) { return c.id !== 'docs' || cur.deal === 'sale'; }).filter(function (c) { return !ch[c.id]; });
          if (need.length) { var er = el.querySelector('#vd-err'); er.textContent = need.length + ' item' + (need.length > 1 ? 's' : '') + ' still open: ' + need.map(function (c) { return c.label.toLowerCase(); }).join(', ') + '.'; return; }
          var prev = JSON.parse(JSON.stringify(cur.ver)); CK.act.verify(cur, ch, true); delete VD.checks[cur.id];
          CK.toast(cur.code + ' verified — badge on for ' + CK.window(cur) + ' days', { undo: function () { cur.ver = prev; CK.emit('verify'); } });
          var nx = deskQueue(); var n = nx.pending.concat(nx.overdue, nx.due)[0]; if (n) CK.go('#/verify/' + n.id);
        }
        if (a === 'reject') { var m = CK.modal('<h2 id="modal-t">Reject ' + cur.code + '</h2><p class="muted sm">The listing leaves matching and the website. The owner gets a message.</p><div class="fld"><label for="rj">Reason</label><select id="rj"><option>Already let out / sold</option><option>Owner not reachable at the gate</option><option>Rooms don’t match the listing</option><option>Price far above what the owner confirms</option><option>Duplicate of another listing</option></select></div><div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn danger" id="rj-ok">Reject listing</button></div>'); m.querySelector('#rj-ok').onclick = function () { var prev = JSON.parse(JSON.stringify(cur.ver)); CK.act.verify(cur, ch, false, m.querySelector('#rj').value); CK.closeModal(); CK.toast(cur.code + ' rejected', { undo: function () { cur.ver = prev; CK.emit('verify'); } }); }; }
        if (a === 'trip') { CK.ui.plan = { leads: [], pids: [cur.id], r: cur.r, kind: 'verify' }; CK.saveUI(); CK.go('#/trips/new'); }
        if (a === 'owner') { CK.act.ownerRequest(cur); CK.toast('“Update your listing” link sent'); }
      });
    }
  };
  function deskItem(p) {
    var ch = VD.checks[p.id] = VD.checks[p.id] || {}, st = CK.ver(p), o = CK.owner(p.ownerId);
    var shots = (p.ver.photos || 0) + (VD.photos[p.id] || 0);
    var photos = p.photos.slice(0, Math.max(0, Math.min(p.photos.length, st === 'pending' ? (VD.photos[p.id] ? p.photos.length : 0) : p.photos.length)));
    var items = CK.CHECKLIST.filter(function (c) { return c.id !== 'docs' || p.deal === 'sale'; });
    var done = items.filter(function (c) { return ch[c.id]; }).length;
    var canAct = CK.can('verify');
    return '<header class="vd-h"><div><p class="muted sm mono">' + p.code + ' · added ' + CK.date(p.created) + ' · ' + esc(p.src) + '</p><h2>' + esc(CK.cfg(p)) + ' · ' + esc(p.addr) + '</h2><p>' + CK.priceLong(p) + ' · owner ' + CK.chipOwner(o) + '</p></div>' + CK.verPill(p) + '</header>' +
      '<div class="vd-g"><div><section class="card"><div class="card-h"><h3>Field photos</h3><span class="muted sm">' + shots + ' taken · geo-tagged</span></div>' + (photos.length ? '<div class="vd-ph">' + photos.map(function (ph, i) { return '<figure><img src="' + CK.ph(ph, 1) + '" alt="Field photo ' + (i + 1) + ' of ' + p.code + '" loading="lazy" width="220" height="150"><figcaption>' + ic('pin', 11) + (12 + i * 3) + ' m · ' + CK.hm(CK.now() - (40 - i * 4) * 6e4) + '</figcaption></figure>'; }).join('') + '</div>' : '<div class="vd-none">' + ic('camera', 22) + '<p>No field photos yet.</p>' + (canAct ? '<div class="btnrow"><button type="button" class="btn sm" data-vd="photos">' + ic('upload', 14) + 'Attach field photos</button><button type="button" class="btn sm" data-vd="trip">' + ic('route', 14) + 'Add to a verification trip</button></div>' : '') + '</div>') + '</section>' +
      '<section class="card"><div class="card-h"><h3>Pin check</h3><span class="muted sm">listing pin vs. where the agent stood</span></div><div class="mini-map">' + CK.map(p.r, { pins: [{ lat: p.lat, lng: p.lng, on: 1 }, { lat: p.lat + 0.00018, lng: p.lng - 0.00012 }], office: false, label: 'Pin check for ' + p.code, aspect: 2, minW: 240, pad: 60 }) + '</div><p class="sm">' + (st === 'pending' && !VD.photos[p.id] ? 'No pin dropped yet.' : ic('check', 13) + ' Agent pin is <b>' + (p.ver.geo ? p.ver.geo.m : 22) + ' m</b> from the listing — inside the 150 m rule.') + '</p></section></div>' +
      '<section class="card vd-cl"><div class="card-h"><h3>Checklist</h3><span class="muted sm">' + done + ' of ' + items.length + '</span>' + (canAct ? '<button type="button" class="link-btn" data-vd="all">Tick all</button>' : '') + '</div><div class="prog"><span style="width:' + (done / items.length * 100) + '%"></span></div><ul class="cl cl-ed">' + items.map(function (c) { return '<li><button type="button" class="' + (ch[c.id] ? 'ok' : '') + '" data-ck="' + c.id + '" aria-pressed="' + !!ch[c.id] + '"' + (canAct ? '' : ' disabled') + '><span class="box">' + ic('check', 12) + '</span><span>' + esc(c.label) + '<small>' + esc(c.hint) + '</small></span></button></li>'; }).join('') + '</ul><p class="err" id="vd-err" role="alert"></p>' +
      (canAct ? '<div class="btnrow"><button type="button" class="btn primary" data-vd="approve">' + ic('shield', 15) + 'Approve · Verified badge</button><button type="button" class="btn danger-ghost" data-vd="reject">Reject</button><button type="button" class="btn ghost" data-vd="owner">' + ic('chat', 15) + 'Ask owner</button></div>' : '<p class="muted sm">View only for your role.</p>') + '<p class="muted sm">A missed owner call never unpublishes a listing; the call comes back in ' + S().settings.missedCallRetryH + ' h, and after ' + S().settings.maxMisses + ' misses it goes to a person.</p></section></div>';
  }

  /* ============ OWNERS ============ */
  CK.V.owners = {
    title: 'Owners',
    render: function () {
      var s = S(), msgs = s.msgs.filter(function (m) { return !m.sent; });
      var port = s.owners.filter(function (o) { return o.portfolio; }), rest = s.owners.filter(function (o) { return !o.portfolio; });
      function ocard(o) { var ps = s.props.filter(function (p) { return p.ownerId === o.id; }); var stale = ps.filter(function (p) { var v = CK.ver(p); return v === 'overdue' || v === 'due'; }).length; return '<article class="ocard"><button type="button" class="oc-h" data-peek="owner:' + o.id + '">' + CK.av(o, 'l') + '<span><b>' + esc(o.name) + '</b><small class="muted">' + ps.length + ' listing' + (ps.length === 1 ? '' : 's') + ' · with us since ' + o.since + '</small></span></button><div class="oc-ph">' + ps.slice(0, 4).map(function (p) { return '<img src="' + CK.ph(p.photos[0], 1) + '" alt="" width="60" height="44" loading="lazy">'; }).join('') + '</div><p class="sm muted">' + esc(o.pref) + (stale ? ' · <b class="tx-warn">' + stale + ' need a check</b>' : '') + '</p></article>'; }
      return '<div class="ph"><div><h1>Owners</h1><p class="muted">' + s.owners.length + ' landlords and sellers · one owner, one call: their listings stay together</p></div></div>' +
        (msgs.length ? '<section class="panel" aria-labelledby="om-h"><div class="panel-h"><h2 id="om-h">Visit feedback to send</h2><span class="muted sm">Templates filled from the visit outcome · sent by click-to-chat</span></div><div class="omsgs">' + msgs.slice(0, 6).map(function (m, i) { var o = CK.owner(m.owner), p = CK.prop(m.pid); return '<div class="omsg">' + CK.chipOwner(o) + CK.chipProp(p) + '<p>' + esc(m.text) + '</p><div class="btnrow"><button type="button" class="btn sm primary" data-om="' + i + '">' + ic('chat', 14) + 'Send on WhatsApp</button><span class="muted sm">' + CK.ago(m.at) + '</span></div></div>'; }).join('') + '</div></section>' : '') +
        '<h2 class="sh">Portfolio owners</h2><div class="ogrid">' + port.map(ocard).join('') + '</div><h2 class="sh">Single-listing owners</h2><div class="ogrid sm">' + rest.map(ocard).join('') + '</div>';
    },
    mount: function (el) { el.addEventListener('click', function (e) { var b = e.target.closest('[data-om]'); if (!b) return; var m = S().msgs.filter(function (x) { return !x.sent; })[+b.dataset.om]; CK.act.msgSent(m); CK.toast('Sent to ' + CK.owner(m.owner).name + ' — logged on their record', { undo: function () { m.sent = false; var o = CK.owner(m.owner); o.comms.shift(); CK.emit('owner'); } }); }); }
  };
  CK.D.owner = {
    render: function (id) {
      var o = CK.owner(id), ps = S().props.filter(function (p) { return p.ownerId === id; });
      return '<header class="dh"><div class="dh-top">' + CK.av(o, 'l') + '<div class="grow"><h2 id="drawer-t">' + esc(o.name) + '</h2><p class="muted sm">' + esc(o.phone) + ' · ' + esc(o.lang) + ' · ' + esc(o.pref) + '</p></div><button type="button" class="ibtn" data-close-drawer aria-label="Close panel">' + ic('x', 16) + '</button></div></header><div class="dbody">' +
        '<section class="card"><div class="card-h"><h3>Listings</h3><span class="muted sm">' + ps.length + '</span></div>' + ps.map(function (p) { var rq = o.requests.filter(function (r) { return r.pid === p.id; })[0]; return '<div class="row-b">' + CK.chipProp(p) + '<span class="muted sm">' + CK.price(p) + '</span><span class="grow"></span>' + (rq ? CK.pill(rq.st === 'updated' ? 'Owner updated' : rq.st === 'opened' ? 'Link opened' : 'Link sent', rq.st === 'updated' ? 'green' : 'amber') : CK.verPill(p)) + (rq && rq.st !== 'updated' ? '<button type="button" class="btn sm" data-ow="sim" data-pid="' + p.id + '">Owner’s reply</button>' : '<button type="button" class="btn sm ghost" data-ow="req" data-pid="' + p.id + '">Ask to update</button>') + '</div>'; }).join('') + '</section>' +
        '<section class="card"><div class="card-h"><h3>Conversation</h3><span class="muted sm">' + o.comms.length + '</span></div>' + (o.comms.length ? '<ol class="tl">' + o.comms.map(function (c) { return '<li><span class="tl-ic">' + ic(c.kind === 'call' ? 'phone' : c.kind === 'form' ? 'edit' : 'chat', 14) + '</span><div><p>' + esc(c.text) + '</p><small class="muted">' + CK.date(c.at) + ' · ' + CK.time(c.at) + (c.by ? ' · ' + esc(CK.agent(c.by).name) : ' · owner') + '</small></div></li>'; }).join('') + '</ol>' : '<p class="muted">Nothing yet.</p>') + '</section></div>';
    },
    mount: function (el, id) {
      el.onclick = function (e) {
        var b = e.target.closest('[data-ow]'); if (!b) return; var p = CK.prop(b.dataset.pid);
        if (b.dataset.ow === 'req') { CK.act.ownerRequest(p); CK.toast('Link sent — the owner can update price, availability and photos without calling'); }
        if (b.dataset.ow === 'sim') { var m = CK.modal('<h2 id="modal-t">Owner’s update form (what they see)</h2><p class="muted sm">' + esc(CK.owner(p.ownerId).name) + ' · ' + p.code + ' · ' + esc(CK.cfg(p)) + '</p><div class="fld"><label for="ou-p">' + (p.deal === 'rent' ? 'Rent a month (₹)' : 'Price (₹)') + '</label><input id="ou-p" inputmode="numeric" value="' + p.price + '"></div><div class="fld"><label for="ou-d">Free from</label><input id="ou-d" type="date" value="' + new Date(p.availFrom).toISOString().slice(0, 10) + '"></div><div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn primary" id="ou-ok">Submit as owner</button></div>'); m.querySelector('#ou-ok').onclick = function () { CK.act.ownerUpdate(p, +m.querySelector('#ou-p').value.replace(/\D/g, ''), new Date(m.querySelector('#ou-d').value).getTime()); CK.closeModal(); CK.toast('Owner updated ' + p.code + ' — freshness back up'); }; }
      };
    }
  };

  /* ============ PARTNERS ============ */
  function ledgerSum(pt, st) { return pt.ledger.filter(function (e) { return !st || e.st === st; }).reduce(function (a, e) { return a + e.amt; }, 0); }
  CK.V.partners = {
    title: 'Partners',
    render: function () {
      var s = S();
      return '<div class="ph"><div><h1>Partner network</h1><p class="muted">Independent field partners who bring leads and listings in their colonies · split agreed per partner · ledger settles monthly</p></div></div><div class="ptgrid">' + s.partners.map(function (pt) {
        var inL = pt.shared.filter(function (x) { return x.dir === 'in'; }).length, outL = pt.shared.filter(function (x) { return x.dir === 'out'; }).length;
        return '<article class="ptcard"><button type="button" class="oc-h" data-peek="partner:' + pt.id + '">' + CK.av(pt, 'l') + '<span><b>' + esc(pt.name) + '</b><small class="muted">' + esc(pt.firm) + ' · ' + esc(CK.area(pt.area).name) + '</small></span></button><dl class="ptstats"><div><dt>Leads in</dt><dd>' + inL + '</dd></div><div><dt>Shared out</dt><dd>' + outL + '</dd></div><div><dt>Listings</dt><dd>' + pt.listings + '</dd></div><div><dt>Split</dt><dd>' + pt.split + '%</dd></div></dl><div class="ptmoney"><span>Earned <b>' + CK.money(ledgerSum(pt)) + '</b></span><span>Due <b class="' + (ledgerSum(pt, 'due') ? 'tx-warn' : '') + '">' + CK.money(ledgerSum(pt, 'due')) + '</b></span></div></article>';
      }).join('') + '</div><section class="panel note-panel"><p>' + ic('phone', 16) + ' Partners work from their own phone app (a capability in build): they refer leads, see what happened to each one, and watch their ledger. Use <b>View as → Partner</b> to see that side.</p></section>';
    }
  };
  CK.D.partner = {
    render: function (id) {
      var pt = CK.partner(id);
      return '<header class="dh"><div class="dh-top">' + CK.av(pt, 'l') + '<div class="grow"><h2 id="drawer-t">' + esc(pt.name) + '</h2><p class="muted sm">' + esc(pt.firm) + ' · ' + esc(CK.area(pt.area).name) + ' · partner since ' + pt.since + ' · ' + pt.split + '% split</p></div><button type="button" class="ibtn" data-close-drawer aria-label="Close panel">' + ic('x', 16) + '</button></div></header><div class="dbody">' + ledgerTable(pt, true) + sharedList(pt) + '</div>';
    },
    mount: function (el, id) { el.onclick = function (e) { var b = e.target.closest('[data-pay]'); if (!b) return; var pt = CK.partner(id), en = pt.ledger[+b.dataset.pay]; CK.act.partnerPay(pt, en); CK.toast('Marked paid · ' + CK.inr(en.amt), { undo: function () { en.st = 'due'; CK.emit('partner'); } }); }; }
  };
  function ledgerTable(pt, canPay) {
    return '<section class="card"><div class="card-h"><h3>Commission ledger</h3><span class="muted sm">Earned ' + CK.inr(ledgerSum(pt)) + ' · due ' + CK.inr(ledgerSum(pt, 'due')) + '</span></div><table class="tbl mini"><thead><tr><th>Date</th><th>For</th><th class="num">Amount</th><th>Status</th></tr></thead><tbody>' + pt.ledger.map(function (e, i) { return '<tr><td>' + CK.date(e.at) + '</td><td>' + esc(e.text) + '<small class="muted mono"> ' + e.deal + '</small></td><td class="num">' + CK.inr(e.amt) + '</td><td>' + (e.st === 'paid' ? CK.pill('Paid', 'green') : canPay && CK.can('partners.pay') ? '<button type="button" class="btn sm" data-pay="' + i + '">Mark paid</button>' : CK.pill('Due', 'amber')) + '</td></tr>'; }).join('') + '</tbody></table></section>';
  }
  function sharedList(pt) {
    return '<section class="card"><div class="card-h"><h3>Leads</h3></div>' + (pt.shared.length ? pt.shared.map(function (x) { var L = CK.lead(x.lead); return L ? '<div class="row-b">' + CK.pill(x.dir === 'in' ? 'Referred by partner' : 'Shared with partner', x.dir === 'in' ? 'violet' : 'blue') + CK.chipLead(L) + '<span class="grow"></span>' + CK.stagePill(L) + '</div>' : ''; }).join('') : '<p class="muted">No leads yet.</p>') + '</section>';
  }

  /* ============ PARTNER PORTAL (role: partner) ============ */
  CK.V.partner = {
    title: 'Partner portal',
    render: function () {
      var pt = CK.partner(CK.ui.partner || 'PT1'), mine = S().leads.filter(function (L) { return L.partnerId === pt.id || L.partnerShared === pt.id; });
      var listings = S().props.filter(function (p) { return p.status === 'available' && CK.ver(p) === 'fresh' && CK.km(p, CK.area(pt.area)) < 3.5; }).slice(0, 6);
      return '<header class="greet"><div><h1>Namaste, ' + esc(pt.name.split(' ')[0]) + '</h1><p class="muted">' + esc(pt.firm) + ' · partner of Amaltas Estates · ' + mine.length + ' leads in play · ' + CK.money(ledgerSum(pt, 'due')) + ' due to you this month</p></div><div class="hello-a"><button type="button" class="btn primary" data-pt="refer">' + ic('plus', 16) + 'Refer a lead</button></div></header>' +
        '<div class="today-g"><section class="panel"><div class="panel-h"><h2>Your leads</h2><span class="muted sm">what happened to each one</span></div><div class="pt-leads">' + (mine.map(function (L) { var last = L.tl[0]; return '<div class="pt-l">' + CK.av(L) + '<div class="grow"><b>' + esc(L.name) + '</b><p class="muted sm">' + esc(CK.wants(L).replace(/<[^>]+>/g, '')) + '</p><p class="sm">' + esc(last ? last.text : '') + '</p></div>' + CK.stagePill(L) + '</div>'; }).join('') || CK.empty('No leads yet', 'Refer your first lead — you’ll see every step here.')) + '</div></section>' +
        '<div class="col">' + ledgerTable(pt, false) + '<section class="panel"><div class="panel-h"><h2>Verified homes near ' + esc(CK.area(pt.area).short) + '</h2></div><div class="pgrid sm">' + listings.map(function (p) { return '<article class="pcard"><div class="pc-img"><img src="' + CK.ph(p.photos[0], 1) + '" alt="" loading="lazy" width="440" height="300"><span class="vbadge">' + ic('shield', 12) + 'Verified</span></div><div class="pc-b"><b>' + CK.price(p) + '</b><p class="pc-c">' + esc(CK.cfg(p)) + '</p><p class="muted sm">' + esc(CK.area(p.area).name) + '</p></div></article>'; }).join('') + '</div></section></div></div>';
    },
    mount: function (el) {
      el.addEventListener('click', function (e) {
        if (!e.target.closest('[data-pt="refer"]')) return; var pt = CK.partner(CK.ui.partner || 'PT1');
        var m = CK.modal('<h2 id="modal-t">Refer a lead</h2><p class="muted sm">Amaltas calls them within 15 minutes; you get ' + pt.split + '% of the brokerage if it closes.</p><div class="fld"><label for="rf-n">Client name</label><input id="rf-n"></div><div class="f2"><div class="fld"><label for="rf-b">BHK</label><select id="rf-b"><option>2</option><option selected>3</option><option>4</option></select></div><div class="fld"><label for="rf-bud">Rent budget (₹ a month)</label><input id="rf-bud" inputmode="numeric" value="80000"></div></div><p class="err" id="rf-err" role="alert"></p><div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn primary" id="rf-ok">Send to Amaltas</button></div>');
        m.querySelector('#rf-ok').onclick = function () { var n = m.querySelector('#rf-n'); if (n.value.trim().length < 2) { n.setAttribute('aria-invalid', 'true'); m.querySelector('#rf-err').textContent = 'Add the client’s name.'; n.focus(); return; } var a = CK.area(pt.area); var near = CK.AREAS.filter(function (x) { return x.r === a.r; }).sort(function (x, y) { return CK.km(a, x) - CK.km(a, y); }).slice(0, 3).map(function (x) { return x.id; }); var L = CK.act.newLead({ name: n.value.trim(), src: 'Partner', partnerId: pt.id, intent: 'rent', req: { r: a.r, bhk: [+m.querySelector('#rf-b').value], budget: +m.querySelector('#rf-bud').value.replace(/\D/g, '') || 80000, sectors: near, moveIn: CK.now() + 30 * CK.DAY, type: 'Any', furn: 'Any', family: 'Family', note: 'Referred by ' + pt.name + '.' }, reqDone: true }); pt.shared.unshift({ at: CK.now(), lead: L.id, dir: 'in' }); CK.emit('partner'); CK.closeModal(); CK.toast('Sent — ' + CK.agent(L.owner).name + ' will call them'); };
      });
    }
  };
})();
