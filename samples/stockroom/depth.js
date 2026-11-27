/* Stockroom depth: the warehouse drawing on Today and Locations, the day's headline, people and roles,
   suppliers, settings, the bin sheet and the "Papers" row on orders. Loaded after views.js; adds to window.SRV. */
(function () {
  'use strict';
  var E = window.SR, V = window.SRV;
  if (!E || !V) return;
  var esc = V.esc, n = V.n, inr = V.inr, inrS = V.inrS, icon = V.icon, when = V.when, whenLc = V.whenLc;
  function plural(k, w, pl) { return k + ' ' + (k === 1 ? w : pl || w + 's'); }
  var DAYN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAY = 864e5;
  function eod() { var d = new Date(); d.setHours(23, 59, 59, 999); return d.getTime(); }

  /* ---------- people and roles ---------- */
  V.ROLES = {
    meera: { key: 'meera', name: 'Meera Rao', ini: 'MR', title: 'Inventory lead', blurb: 'Sees everything', hide: [], noValue: false, first: '' },
    arjun: { key: 'arjun', name: 'Arjun Das', ini: 'AD', title: 'Storekeeper', blurb: 'Floor work only', hide: ['purchasing', 'labels', 'suppliers', 'settings'], noValue: true, first: '' },
    farah: { key: 'farah', name: 'Farah Sheikh', ini: 'FS', title: 'Buyer', blurb: 'Buying first, no pick or count', hide: ['sales', 'pick', 'count'], noValue: false, first: 'buying' }
  };
  V.who = 'meera';
  V.me = function () { return V.ROLES[V.who] || V.ROLES.meera; };
  V.can = function (name) { return V.me().hide.indexOf(name) < 0; };

  /* ---------- the floor, from the engine ---------- */
  function addTo(o, k, q) { o[k] = (o[k] || 0) + q; }
  /* the bins of one warehouse in the shape wh.js draws */
  V.floorBins = function (wh) {
    var bins = E.bins(wh), qty = {}, names = {}, pickQ = {}, recvQ = {}, lowS = {}, end = eod(), maxQ = 1;
    E.bins().forEach(function (b) { var t = 0; E.binQty(b.id).forEach(function (x) { t += x.q; }); if (t > maxQ) maxQ = t; });
    E.sos().forEach(function (so) {
      if (so.wh !== wh) return;
      if (so.status === 'picking' && so.pick) so.pick.forEach(function (p) { if (!p.done) addTo(pickQ, p.bin, p.qty); });
      else if (so.status === 'reserved' && !E.shortfall(so)) so.lines.forEach(function (l) { if (l.res > 0) addTo(pickQ, E.primaryBin(l.sku, wh), l.res); });
    });
    E.pos().forEach(function (po) {
      if (po.wh !== wh || !(po.status === 'approved' || po.status === 'partial') || !po.eta || po.eta > end) return;
      po.lines.forEach(function (l) { if (l.recv < l.pq) addTo(recvQ, E.primaryBin(l.sku, wh), (l.pq - l.recv) * E.item(l.sku).buy.per); });
    });
    E.items().forEach(function (s) {
      var st = E.status(s.sku); if (st === 'ok' || !E.carried(s.sku, wh)) return;
      lowS[E.primaryBin(s.sku, wh)] = lowS[E.primaryBin(s.sku, wh)] === 'out' ? 'out' : st;
      E.binsOf(s.sku, wh).forEach(function (b) { if (lowS[b.bin] !== 'out') lowS[b.bin] = st; });
    });
    return bins.map(function (b) {
      var c = E.binQty(b.id), q = 0; c.forEach(function (x) { q += x.q; });
      var state = pickQ[b.id] ? 'pick' : E.countFlag(b.id) ? 'count' : recvQ[b.id] ? 'recv' : lowS[b.id] || '';
      var note = c.length ? c.slice(0, 2).map(function (x) { return E.item(x.sku).name + ', ' + plural(x.q, 'unit'); }).join('; ') + (c.length > 2 ? '; and ' + (c.length - 2) + ' more' : '') : 'empty';
      if (pickQ[b.id]) note += '; ' + pickQ[b.id] + ' to pick';
      if (E.countFlag(b.id)) note += '; flagged for a recount';
      if (recvQ[b.id]) note += '; ' + recvQ[b.id] + ' arriving today';
      if (lowS[b.id]) note += lowS[b.id] === 'out' ? '; out of stock' : '; running low';
      return { id: b.id, zone: b.zone, n: b.n, fill: Math.min(1, q / maxQ), state: state, note: note };
    });
  };
  V.floorCounts = function (whs) {
    var c = { pick: 0, count: 0, recv: 0, low: 0 };
    whs.forEach(function (w) { V.floorBins(w).forEach(function (b) { if (b.state === 'pick') c.pick++; else if (b.state === 'recv') c.recv++; else if (b.state === 'low' || b.state === 'out') c.low++; if (E.countFlag(b.id)) c.count++; }); });
    return c;
  };
  V.floorKey = function () {
    return '<ul class="fl-key" aria-label="Key to the drawing"><li><i class="k-pick"></i>to pick</li><li><i class="k-count"></i>to recount</li><li><i class="k-recv"></i>receiving today</li><li><i class="k-low"></i>running low</li></ul>';
  };
  /* the host elements; app.js calls V.mountFloors(root) after rendering */
  V.floorHosts = function (whs) {
    return '<div class="fl-grid fl-' + whs.length + '">' + whs.map(function (w) {
      return '<figure class="fl-one"><figcaption class="fl-cap mono">' + w + ' · ' + esc(E.wh(w).name) + '</figcaption><div class="fl-host" data-wh="' + w + '"></div></figure>';
    }).join('') + '</div>';
  };
  V.mountFloors = function (root, onBin) {
    if (!window.Wh) return;
    [].forEach.call(root.querySelectorAll('.fl-host[data-wh]'), function (h) {
      var w = h.getAttribute('data-wh');
      h.__wh = window.Wh.render(h, { bins: V.floorBins(w), onBin: onBin, label: E.wh(w).name + ' floor plan' });
    });
  };

  /* ---------- Today: the day's headline in a storekeeper's words ---------- */
  V.headline = function (X) {
    var day = DAYN[new Date().getDay()], who = V.me().key, parts = [];
    var P = {
      pick: X.toPick.length ? plural(X.toPick.length, 'order') + ' to pick before the 4 pm truck' : '',
      ready: X.ready.length ? plural(X.ready.length, 'order') + ' packed and waiting' : '',
      late: X.late.length ? plural(X.late.length, 'delivery', 'deliveries') + ' late' : '',
      low: X.low.length ? plural(X.low.length, 'item') + ' below reorder' : '',
      count: X.flagged.length ? plural(X.flagged.length, 'bin') + ' to recount' : ''
    };
    var order = who === 'farah' ? ['low', 'late', 'ready'] : ['pick', 'ready', 'late', 'low', 'count'];
    order.forEach(function (k) { if (P[k] && parts.length < 2) parts.push(P[k]); });
    if (!parts.length) return day + ' · every order is picked and the dock is clear';
    return day + ' · ' + parts.join(' · ');
  };
  V.todayLine = function (U) {
    var d = new Date(), m = V.me();
    return DAYN[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' + MON[d.getMonth()] + ' · ' + m.name + ' · ' + m.title + ' · ' + (U.wh ? E.wh(U.wh).name : 'Both warehouses');
  };
  V.floorPanel = function (U, X) {
    var whs = U.wh ? [U.wh] : E.warehouses().map(function (w) { return w.id; }), c = V.floorCounts(whs), role = V.me().key, bits = [];
    if (role === 'farah') { if (c.recv) bits.push(plural(c.recv, 'bin') + ' receiving'); if (c.low) bits.push(c.low + ' running low'); }
    else { if (c.pick) bits.push(plural(c.pick, 'bin') + ' to pick'); if (c.count) bits.push(c.count + ' to recount'); if (!bits.length && c.recv) bits.push(plural(c.recv, 'bin') + ' receiving today'); }
    var btn = role === 'farah'
      ? '<a class="btn primary" href="#/purchasing?tab=' + (X.drafts.length ? 'drafts' : 'open') + '">' + (X.drafts.length ? 'Review draft orders' : 'Open purchase orders') + '</a>'
      : '<a class="btn primary" href="#/pick/' + (X.next ? X.next.id : '') + '">Start picking</a>';
    return '<section class="fl-panel" aria-labelledby="fl-h"><header><h2 id="fl-h">The floor, now</h2><span class="sp"></span><span class="fl-counts">' + (bits.join(' · ') || 'Nothing flagged on the floor') + '</span>' + btn + '</header>' +
      '<div class="fl-scroll" tabindex="0" role="region" aria-label="Warehouse drawing, scrolls sideways on small screens">' + V.floorHosts(whs) + '</div>' + V.floorKey() + '</section>';
  };

  /* ---------- the bin sheet ---------- */
  V.binSheet = function (id) {
    var b = E.bins().filter(function (x) { return x.id === id; })[0]; if (!b) return null;
    var fb = V.floorBins(b.wh).filter(function (x) { return x.id === id; })[0], c = E.binQty(id), pills = '', zone = window.HALDEN.ZONES.filter(function (z) { return z.id === b.zone; })[0];
    if (fb.state === 'pick') pills += '<span class="pill acc">To pick</span> ';
    if (E.countFlag(id)) pills += '<span class="pill plain">To recount</span> ';
    if (fb.note.indexOf('arriving today') > 0) pills += '<span class="pill ok">Receiving today</span> ';
    if (fb.state === 'low') pills += '<span class="pill low">Running low</span> '; if (fb.state === 'out') pills += '<span class="pill out">Out of stock</span> ';
    var h = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' + (pills || '<span class="pill ok">Nothing flagged</span>') + '<span class="muted" style="font-size:12.5px">' + esc(E.wh(b.wh).name) + ' · zone ' + b.zone + ', ' + esc(zone.name) + '</span></div>';
    h += '<dl class="kv"><dt>Last counted</dt><dd>' + (E.lastCounted(id) ? when(E.lastCounted(id)) : 'Never') + '</dd><dt>Holds</dt><dd>' + (c.length ? plural(c.length, 'item') + ', ' + n(c.reduce(function (a, x) { return a + x.q; }, 0)) + ' units' : 'Empty') + '</dd></dl>';
    if (c.length) h += '<div><h3>Stock in this bin</h3><ul class="list boxed">' + c.map(function (x) { return '<li><a href="#/items/' + x.sku + '" class="grow" style="text-decoration:none">' + V.itemCell(x.sku, true) + '</a><span class="num" style="font-weight:500">' + n(x.q) + '</span><button class="btn sm" data-act="binmove" data-sku="' + x.sku + '" data-bin="' + id + '">Move</button></li>'; }).join('') + '</ul></div>';
    var need = [];
    E.sos().forEach(function (so) { if (so.wh !== b.wh) return; if (so.status === 'picking' && so.pick) so.pick.forEach(function (p) { if (!p.done && p.bin === id) need.push('<li>' + V.chipSO(so.id) + '<span>' + esc(so.customer) + ' · ' + p.qty + ' × ' + esc(E.item(p.sku).name) + '</span></li>'); }); else if (so.status === 'reserved' && !E.shortfall(so)) so.lines.forEach(function (l) { if (l.res > 0 && E.primaryBin(l.sku, b.wh) === id) need.push('<li>' + V.chipSO(so.id) + '<span>' + esc(so.customer) + ' · ' + l.res + ' × ' + esc(E.item(l.sku).name) + '</span></li>'); }); });
    if (need.length) h += '<div><h3>Waiting to be picked from here</h3><ul class="rel">' + need.join('') + '</ul></div>';
    var rec = [];
    E.pos().forEach(function (po) { if (po.wh === b.wh && (po.status === 'approved' || po.status === 'partial') && po.eta && po.eta <= eod()) po.lines.forEach(function (l) { if (l.recv < l.pq && E.primaryBin(l.sku, b.wh) === id) rec.push('<li>' + V.chipPO(po.id) + '<span>' + esc(E.supplier(po.supplier).name) + ' · ' + (l.pq - l.recv) * E.item(l.sku).buy.per + ' × ' + esc(E.item(l.sku).name) + ' · ' + whenLc(po.eta) + '</span></li>'); }); });
    if (rec.length) h += '<div><h3>Arriving here today</h3><ul class="rel">' + rec.join('') + '</ul></div>';
    return { title: '<span class="mono">' + id + '</span>', body: h, foot: '<button class="btn" data-act="label-bin" data-bin="' + id + '">' + icon('labels') + 'Bin label</button>' + (V.can('count') ? '<a class="btn" href="#/count">' + icon('scan') + 'Count bins</a>' : '') };
  };

  /* ---------- the Papers row on an order ---------- */
  V.docsFor = function (kind, id) {
    var out = [];
    if (kind === 'so') {
      var so = E.so(id), st = so && so.status, calc = so && V.invoiceCalc ? V.invoiceCalc(so) : null;
      out.push({ k: 'challan', label: 'Delivery challan', ok: st === 'picked' || st === 'dispatched', why: 'once it is packed' });
      out.push({ k: 'invoice', label: 'Tax invoice', ok: st === 'dispatched', why: 'after dispatch' });
      out.push({ k: 'eway', label: 'E-way bill', ok: st === 'dispatched' && calc && calc.eway, why: st === 'dispatched' ? 'only over ₹50,000' : 'after dispatch, over ₹50,000' });
    } else {
      var po = E.po(id);
      out.push({ k: 'po', label: 'Purchase order', ok: !!po && po.status !== 'cancelled', why: 'not for a cancelled order' });
      out.push({ k: 'grn', label: 'Goods receipt note', ok: !!po && po.receipts.length > 0, why: 'after the first delivery' });
    }
    return out;
  };
  V.papersRow = function (kind, id) {
    var list = V.docsFor(kind, id);
    return '<div><h3>Papers</h3><ul class="papers">' + list.map(function (d) {
      return d.ok ? '<li><a class="paper" href="#/doc/' + d.k + '/' + id + '">' + icon('print', 'sm') + d.label + '</a></li>'
        : '<li class="off"><span class="paper" aria-disabled="true">' + icon('print', 'sm') + d.label + '</span><small>' + d.why + '</small></li>';
    }).join('') + '</ul></div>';
  };

  /* ---------- suppliers ---------- */
  function onTimePill(p) { return p == null ? '<span class="faint">No deliveries yet</span>' : '<span class="num' + (p < 70 ? ' ot-lo' : '') + '">' + p + '%</span>'; }
  V.suppliers = function (U) {
    var rows = E.suppliers().map(function (s) { return { s: s, st: E.supplierStats(s.id) }; });
    var h = '<div class="page"><div class="page-h"><div><h2>Suppliers</h2><p>' + plural(rows.length, 'supplier') + ' · lead time and on-time share come from the purchase orders you have already received.</p></div><span class="sp"></span></div>';
    h += '<section class="panel sup-tbl"><div class="scroll-x"><table class="tbl"><thead><tr><th>Supplier</th><th>City</th><th class="num">Lead time</th><th class="num">On time</th><th class="num">Open POs</th><th>Last delivery</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr data-href="#/suppliers/' + r.s.id + '"><td><a class="sup-name" href="#/suppliers/' + r.s.id + '">' + esc(r.s.name) + '</a><div class="faint" style="font-size:11.5px">' + esc(r.s.person) + '</div></td><td>' + esc(r.s.city) + '</td><td class="num">' + r.st.lead + ' days</td><td class="num">' + onTimePill(r.st.onTime) + '</td><td class="num">' + r.st.open + '</td><td>' + (r.st.last ? when(r.st.last) : '<span class="faint">None yet</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';
    h += '<ul class="sup-cards" aria-label="Suppliers">' + rows.map(function (r) {
      return '<li><a href="#/suppliers/' + r.s.id + '"><b>' + esc(r.s.name) + '</b><span class="faint">' + esc(r.s.city) + '</span><dl><div><dt>Lead time</dt><dd class="num">' + r.st.lead + ' days</dd></div><div><dt>On time</dt><dd>' + onTimePill(r.st.onTime) + '</dd></div><div><dt>Open POs</dt><dd class="num">' + r.st.open + '</dd></div><div><dt>Last delivery</dt><dd>' + (r.st.last ? when(r.st.last) : 'None yet') + '</dd></div></dl></a></li>';
    }).join('') + '</ul>';
    return h + '</div>';
  };
  V.supplierSheet = function (id) {
    var s = E.supplier(id); if (!s) return null;
    var st = E.supplierStats(id), skus = E.items().filter(function (x) { return x.supplier === id; });
    var h = '<div class="minis" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div><span>Lead time</span><b>' + st.lead + ' days</b></div><div><span>On time</span><b>' + (st.onTime == null ? '—' : st.onTime + '%') + '</b></div><div><span>Open POs</span><b>' + st.open + '</b></div></div>';
    h += '<dl class="kv"><dt>Contact</dt><dd>' + esc(s.person) + '</dd><dt>Phone</dt><dd class="mono">' + esc(s.phone) + '</dd><dt>Email</dt><dd class="mono">' + esc(s.contact) + '</dd><dt>GSTIN</dt><dd class="mono">' + s.gstin + '</dd><dt>Address</dt><dd>' + esc(s.addr) + ', ' + esc(s.city) + ', ' + esc(s.state) + ' ' + s.pin + '</dd><dt>Terms</dt><dd>' + esc(s.terms) + '</dd></dl>';
    h += '<div><h3>Price list</h3><div class="boxed scroll-x"><table class="tbl"><thead><tr><th>Item</th><th class="num">HSN</th><th class="num">Buy unit</th><th class="num">Cost</th></tr></thead><tbody>' + skus.map(function (x) {
      return '<tr><td>' + V.itemCell(x.sku, true) + '</td><td class="num mono">' + x.hsn + '</td><td class="num">' + (x.buy.per > 1 ? x.buy.unit + ' of ' + x.buy.per : x.buy.unit) + '</td><td class="num">' + inr(E.lastCost(x.sku) * x.buy.per) + '</td></tr>';
    }).join('') + '</tbody></table></div></div>';
    h += '<div><h3>Last ' + (st.deliveries.length || 'six') + ' deliveries</h3>' + (st.deliveries.length ? '<ul class="list boxed">' + st.deliveries.map(function (d) {
      return '<li><div class="grow"><div class="t">' + when(d.t) + ' ' + V.chipPO(d.po) + '</div><div class="s">' + n(d.units) + ' units · ' + inr(d.value) + '</div></div>' + (d.late ? '<span class="pill out">Late by ' + plural(d.lateDays, 'day') + '</span>' : '<span class="pill ok">On time</span>') + '</li>';
    }).join('') + '</ul>' : '<p class="faint">Nothing received from this supplier yet.</p>') + '</div>';
    return { title: esc(s.name), body: h, foot: '<button class="btn primary" data-act="po-new-sup" data-id="' + id + '">Raise a PO</button>' };
  };

  /* ---------- settings ---------- */
  V.settings = function (U) {
    var tab = U.settab || 'wh', p = E.policy();
    var h = '<div class="page"><div class="page-h"><div><h2>Settings</h2><p>How Halden Supply’s warehouses, reordering and tax are set up.</p></div></div>';
    h += '<div class="bar"><div class="seg scroll-x set-tabs" role="tablist" aria-label="Settings">' + [['wh', 'Warehouses'], ['rop', 'Reorder policy'], ['tax', 'Units and tax']].map(function (k) { return '<button role="tab" data-act="settab" data-v="' + k[0] + '" aria-selected="' + (tab === k[0]) + '" aria-pressed="' + (tab === k[0]) + '">' + k[1] + '</button>'; }).join('') + '</div></div>';
    if (tab === 'wh') {
      h += '<div class="set-grid">' + E.warehouses().map(function (w) {
        var a = window.HALDEN.WH_ADDR[w.id], bins = E.bins(w.id), used = 0; bins.forEach(function (b) { if (E.binQty(b.id).length) used++; });
        return '<section class="panel"><header><h2>' + esc(w.name) + '</h2><span class="sp"></span><span class="mono faint">' + w.id + '</span></header><div class="pad"><dl class="kv"><dt>Address</dt><dd>' + esc(a.addr) + ', ' + esc(a.city) + ', ' + esc(a.state) + ' ' + a.pin + '</dd><dt>GSTIN</dt><dd class="mono">' + a.gstin + '</dd><dt>Bins</dt><dd>' + bins.length + ' in all · ' + used + ' in use</dd></dl>' +
          '<table class="tbl set-zones"><thead><tr><th>Zone</th><th>Kind</th><th class="num">Bins</th></tr></thead><tbody>' + window.HALDEN.ZONES.map(function (z) { return '<tr><td class="mono">' + z.id + '</td><td>' + esc(z.name) + '</td><td class="num">' + z.bins + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
      }).join('') + '</div>';
    } else if (tab === 'rop') {
      var low = E.lowItems().length;
      h += '<section class="panel"><header><h2>Reorder policy</h2></header><div class="pad"><p class="set-rule">An item is low when what is free to sell falls to its reorder point, and a draft purchase order is raised for it. Reorder points grow and shrink with the days of cover you set here.</p>' +
        '<div class="set-fields"><label class="field">Default lead time, days<input class="input num" type="number" min="1" max="60" inputmode="numeric" data-in="policy" data-k="lead" value="' + p.lead + '"></label><label class="field">Safety days<input class="input num" type="number" min="0" max="30" inputmode="numeric" data-in="policy" data-k="safety" value="' + p.safety + '"></label></div>' +
        '<p class="faint" style="margin:10px 0 0;font-size:13px">Reorder points were set for ' + p.baseLead + ' days of lead time plus ' + p.baseSafety + ' safety days. Now: <b>' + (p.lead + p.safety) + ' days of cover</b>, so ' + plural(low, 'item') + ' ' + (low === 1 ? 'is' : 'are') + ' below reorder.</p></div></section>';
      h += '<section class="panel"><header><h2>Reorder points by item</h2></header><div class="scroll-x"><table class="tbl"><thead><tr><th>Item</th><th class="num">Reorder at</th><th class="num">Free now</th><th>Status</th></tr></thead><tbody>' + E.items().map(function (x) {
        return '<tr><td>' + V.itemCell(x.sku, true) + '</td><td class="num">' + n(E.rop(x.sku)) + (E.rop(x.sku) !== x.rop ? ' <span class="faint">was ' + x.rop + '</span>' : '') + '</td><td class="num">' + n(E.available(x.sku)) + '</td><td>' + V.pill(E.status(x.sku)) + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';
    } else {
      var uoms = {}, gst = { 12: [], 18: [] };
      E.items().forEach(function (x) { var k = x.uom + '|' + (x.buy.per > 1 ? x.buy.unit + ' of ' + x.buy.per : x.buy.unit); uoms[k] = (uoms[k] || 0) + 1; (gst[x.gst] = gst[x.gst] || []).push(x); });
      h += '<div class="set-grid"><section class="panel"><header><h2>Units of measure</h2></header><div class="scroll-x"><table class="tbl"><thead><tr><th>Sold and stocked as</th><th>Bought as</th><th class="num">Items</th></tr></thead><tbody>' + Object.keys(uoms).sort().map(function (k) { var a = k.split('|'); return '<tr><td>' + a[0] + '</td><td>' + a[1] + '</td><td class="num">' + uoms[k] + '</td></tr>'; }).join('') + '</tbody></table></div></section>' +
        '<section class="panel"><header><h2>GST rates in use</h2></header><div class="scroll-x"><table class="tbl"><thead><tr><th>Rate</th><th>HSN</th><th class="num">Items</th></tr></thead><tbody>' + [18, 12].map(function (r) { var hs = {}; gst[r].forEach(function (x) { hs[x.hsn] = 1; }); return '<tr><td class="num">' + r + '%</td><td class="mono">' + Object.keys(hs).sort().join(', ') + '</td><td class="num">' + gst[r].length + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<div class="pad"><p class="faint" style="margin:0;font-size:13px">Sales within Maharashtra (Bhiwandi) or Karnataka (Hoskote) split into CGST and SGST, half each. Sales to any other state carry IGST at the full rate.</p></div></section></div>';
    }
    return h + '</div>';
  };

  /* ---------- who is working ---------- */
  V.whoMenu = function () {
    return '<div class="who-t" id="who-t">Who is working?</div>' + Object.keys(V.ROLES).map(function (k) {
      var r = V.ROLES[k];
      return '<button type="button" role="menuitemradio" aria-checked="' + (V.who === k) + '" data-act="who-set" data-v="' + k + '"><span class="av">' + r.ini + '</span><span><b>' + r.name + '</b><small>' + r.title + ' · ' + r.blurb + '</small></span></button>';
    }).join('');
  };
})();
