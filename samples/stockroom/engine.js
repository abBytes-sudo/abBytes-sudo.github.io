/* Stockroom engine: stock ledger, FIFO valuation, bins, reservations, purchase and sales orders, low-stock drafts,
   and the demo bridge to Lumen CRM Pro. Pure state + functions; views.js renders it. All data is local demo data. */
(function () {
  'use strict';
  var H = window.HALDEN, KEY = 'stockroom:v1', VERSION = 8;
  if (!H || !H.SKUS) return; // data.js didn't arrive; app.js re-fetches it and then this file
  var BRIDGE_DEALS = 'demo-bridge:won-deals', BRIDGE_STOCK = 'demo-bridge:stock', BRIDGE_ORDERS = 'demo-bridge:orders';
  var E = window.SR = {}, S = null, simNow = null, listeners = [];
  var ITEM = {}; H.SKUS.forEach(function (s) { ITEM[s.sku] = s; });
  var SUP = {}; H.SUPPLIERS.forEach(function (s) { SUP[s.id] = s; });
  var DAY = 864e5;

  function now() { return simNow == null ? Date.now() : simNow; }
  function nextId(k) { var n = S.seq[k]++; return k + '-' + n; }
  function sum(a, f) { var t = 0; for (var i = 0; i < a.length; i++) t += f(a[i]); return t; }
  E.clock = function (t) { simNow = t; };
  E.now = now;
  E.DAY = DAY;

  function blank() {
    return { v: VERSION, created: Date.now(), seq: { PO: 1001, SO: 2001, GR: 5001, TR: 401, ADJ: 801, MV: 1 },
      layers: {}, bins: {}, moves: [], pos: [], sos: [], deals: {}, cfg: {}, outs: {}, outLog: [], lost: [], dismissed: {}, snSeq: {}, counted: {}, countFlags: {} };
  }

  /* ---------- master data ---------- */
  E.items = function () { return H.SKUS; };
  E.item = function (sku) { return ITEM[sku]; };
  E.supplier = function (id) { return SUP[id]; };
  E.suppliers = function () { return H.SUPPLIERS; };
  E.warehouses = function () { return H.WAREHOUSES; };
  E.wh = function (id) { return H.WAREHOUSES.filter(function (w) { return w.id === id; })[0]; };
  E.bins = function (wh) { return H.BINS.filter(function (b) { return !wh || b.wh === wh; }); };
  /* reorder policy: every item's reorder point was set for 10 days of lead time plus 3 days of safety stock.
     Changing either number stretches or shrinks the reorder point of every item that has no hand-set number. */
  var BASE_LEAD = 10, BASE_SAFETY = 3;
  E.policy = function () { var p = (S && S.policy) || {}; return { lead: p.lead != null ? p.lead : BASE_LEAD, safety: p.safety != null ? p.safety : BASE_SAFETY, baseLead: BASE_LEAD, baseSafety: BASE_SAFETY }; };
  E.setPolicy = function (lead, safety) { S.policy = { lead: Math.max(1, Math.min(60, lead | 0)), safety: Math.max(0, Math.min(30, safety | 0)) }; commit(); };
  E.rop = function (sku) {
    var c = S.cfg[sku]; if (c && c.rop != null) return c.rop;
    var p = E.policy(); return Math.max(1, Math.round(ITEM[sku].rop * (p.lead + p.safety) / (BASE_LEAD + BASE_SAFETY)));
  };
  E.roq = function (sku) { var c = S.cfg[sku]; return c && c.roq != null ? c.roq : ITEM[sku].roq; };
  E.setReorder = function (sku, rop, roq) { S.cfg[sku] = { rop: Math.max(0, rop | 0), roq: Math.max(1, roq | 0) }; commit(); };
  E.family = function (sku) { var f = ITEM[sku].family; return H.SKUS.filter(function (s) { return s.family === f; }); };

  /* ---------- quantities ---------- */
  function lay(sku, wh) { var a = S.layers[sku] || (S.layers[sku] = {}); return a[wh] || (a[wh] = []); }
  E.onHand = function (sku, wh) {
    var a = S.layers[sku]; if (!a) return 0;
    if (wh) return sum(a[wh] || [], function (l) { return l.q; });
    var t = 0; for (var w in a) t += sum(a[w], function (l) { return l.q; }); return t;
  };
  E.value = function (sku, wh) {
    var a = S.layers[sku]; if (!a) return 0;
    var ws = wh ? [wh] : Object.keys(a), t = 0;
    ws.forEach(function (w) { t += sum(a[w] || [], function (l) { return l.q * l.c; }); }); return t;
  };
  E.fifoLayers = function (sku, wh) {
    var out = [], a = S.layers[sku] || {};
    Object.keys(a).forEach(function (w) { if (!wh || w === wh) a[w].forEach(function (l) { if (l.q > 0) out.push({ wh: w, q: l.q, c: l.c, t: l.t, ref: l.ref, lot: l.lot, sn: l.sn ? l.sn.slice() : null }); }); });
    return out.sort(function (x, y) { return x.t - y.t; });
  };
  function openSO(so) { return so.status === 'reserved' || so.status === 'picking' || so.status === 'picked'; }
  E.reserved = function (sku, wh) {
    var t = 0;
    S.sos.forEach(function (so) { if (!openSO(so) || (wh && so.wh !== wh)) return; so.lines.forEach(function (l) { if (l.sku === sku) t += l.res; }); });
    return t;
  };
  E.reservedCRM = function (sku) {
    var t = 0;
    S.sos.forEach(function (so) { if (!openSO(so) || so.source !== 'crm') return; so.lines.forEach(function (l) { if (l.sku === sku) t += l.res; }); });
    return t;
  };
  E.available = function (sku, wh) { return E.onHand(sku, wh) - E.reserved(sku, wh); };
  E.onOrder = function (sku, drafts) {
    var t = 0;
    S.pos.forEach(function (po) {
      var live = po.status === 'approved' || po.status === 'partial' || (drafts && po.status === 'draft');
      if (!live) return;
      po.lines.forEach(function (l) { if (l.sku === sku) t += (l.pq - l.recv) * ITEM[sku].buy.per; });
    });
    return t;
  };
  E.status = function (sku) {
    var a = E.available(sku);
    if (E.onHand(sku) <= 0 || a <= 0) return 'out';
    return a <= E.rop(sku) ? 'low' : 'ok';
  };
  E.binQty = function (bin) {
    var out = [];
    Object.keys(S.bins).forEach(function (sku) { var q = S.bins[sku][bin] || 0; if (q > 0) out.push({ sku: sku, q: q }); });
    return out;
  };
  E.binsOf = function (sku, wh) {
    var b = S.bins[sku] || {};
    return Object.keys(b).filter(function (k) { return b[k] > 0 && (!wh || k.indexOf(wh + '-') === 0); }).map(function (k) { return { bin: k, q: b[k] }; })
      .sort(function (x, y) { return x.bin < y.bin ? -1 : 1; });
  };
  E.carried = function (sku, wh) { return wh === 'BHW' || H.BLR_RANGE.indexOf(sku) >= 0; };
  E.primaryBin = function (sku, wh) { return wh + '-' + ITEM[sku].bin; };

  /* ---------- batches (lots) and serial numbers ---------- */
  // every receipt creates a batch named after the supplier and the goods receipt (KW-5042); high-value items also get
  // one serial number per unit, and serials travel FIFO with their batch through transfers and dispatch
  E.isSerial = function (sku) { return !!ITEM[sku].serial; };
  function lotFor(ref, sku) {
    if (!ref) return 'ADJ';
    if (ref === 'OPENING') return 'OPEN';
    var m = /^GR-(\d+)$/.exec(ref); if (m) return SUP[ITEM[sku].supplier].id.slice(4) + '-' + m[1];
    return ref;
  }
  function newSerials(sku, q) {
    if (!ITEM[sku].serial) return null;
    var out = [], k = sku.slice(3).replace('-', ''), n = S.snSeq[sku] || 0;
    for (var i = 0; i < q; i++) { n++; out.push(k + '-' + String(n).padStart(4, '0')); }
    S.snSeq[sku] = n; return out;
  }
  E.serials = function (sku, wh) { var out = []; E.fifoLayers(sku, wh).forEach(function (l) { (l.sn || []).forEach(function (x) { out.push({ sn: x, wh: l.wh, lot: l.lot, t: l.t }); }); }); return out; };

  /* ---------- posting (every movement goes through here) ---------- */
  function binAdd(sku, bin, q) { var b = S.bins[sku] || (S.bins[sku] = {}); b[bin] = (b[bin] || 0) + q; if (b[bin] <= 0) delete b[bin]; }
  function binTake(sku, wh, q, prefer) {
    var took = [], b = S.bins[sku] || {};
    var order = Object.keys(b).filter(function (k) { return k.indexOf(wh + '-') === 0 && b[k] > 0; })
      .sort(function (x, y) { return (x === prefer ? -1 : y === prefer ? 1 : b[y] - b[x]); });
    for (var i = 0; i < order.length && q > 0; i++) { var t = Math.min(q, b[order[i]]); binAdd(sku, order[i], -t); took.push({ bin: order[i], q: t }); q -= t; }
    if (q > 0) { binAdd(sku, prefer || E.primaryBin(sku, wh), -q); took.push({ bin: prefer || E.primaryBin(sku, wh), q: q }); }
    return took;
  }
  function consume(sku, wh, q) {
    var L = lay(sku, wh), cost = 0, pieces = [];
    while (q > 0 && L.length) {
      var l = L[0], t = Math.min(q, l.q);
      cost += t * l.c; pieces.push({ q: t, c: l.c, t: l.t, ref: l.ref, lot: l.lot, sn: l.sn ? l.sn.splice(0, t) : null }); l.q -= t; q -= t;
      if (l.q <= 0) L.shift();
    }
    if (q > 0) { var c = ITEM[sku].cost; cost += q * c; pieces.push({ q: q, c: c, t: now(), ref: 'NEG' }); L.unshift({ q: -q, c: c, t: now(), ref: 'NEG' }); }
    return { cost: cost, pieces: pieces };
  }
  function addLayer(sku, wh, q, c, t, ref, lot, sn) {
    var L = lay(sku, wh);
    if (L.length && L[0].q < 0) { var fix = Math.min(q, -L[0].q); L[0].q += fix; q -= fix; if (sn) sn = sn.slice(fix); if (L[0].q === 0) L.shift(); }
    if (q > 0) { var o = { q: q, c: c, t: t, ref: ref, lot: lot || lotFor(ref, sku) }; if (ITEM[sku].serial) o.sn = sn || newSerials(sku, q); L.push(o); L.sort(function (a, b) { return a.t - b.t; }); }
  }
  function record(m) {
    m.id = S.seq.MV++; m.t = m.t || now();
    m.bal = E.onHand(m.sku); m.whBal = E.onHand(m.sku, m.wh); m.val = Math.round(E.value(m.sku));
    S.moves.push(m);
    // stock-out tracking (company-wide on hand)
    // stock-out tracking per warehouse (bin moves inside a warehouse don't count)
    var k = m.sku + '|' + m.wh;
    if (!m.internal && m.whBal <= 0 && S.outs[k] == null && E.carried(m.sku, m.wh)) S.outs[k] = m.t;
    if (m.whBal > 0 && S.outs[k] != null) { S.outLog.push({ sku: m.sku, wh: m.wh, from: S.outs[k], to: m.t }); delete S.outs[k]; }
    return m;
  }
  E.post = function (o) {
    var sku = o.sku, wh = o.wh, q = o.qty, bin = o.bin || E.primaryBin(sku, wh), t = now();
    if (!q) return null;
    if (q > 0) {
      var c = o.cost != null ? o.cost : lastCost(sku);
      var lot = o.lot || lotFor(o.ref, sku), sns = newSerials(sku, q);
      addLayer(sku, wh, q, c, t, o.ref, lot, sns); binAdd(sku, bin, q);
      return record({ type: o.type, sku: sku, wh: wh, bin: bin, qty: q, unit: c, value: q * c, ref: o.ref, note: o.note, doc: o.doc, lot: lot, sn: sns });
    }
    var r = consume(sku, wh, -q), took = binTake(sku, wh, -q, bin);
    return record({ type: o.type, sku: sku, wh: wh, bin: took.map(function (x) { return x.bin; }).join(', '), qty: q, unit: Math.round(r.cost / -q), value: -r.cost, ref: o.ref, note: o.note, doc: o.doc, pieces: r.pieces, lot: lotsOf(r.pieces), sn: snOf(r.pieces) });
  };
  function lotsOf(p) { return p.map(function (x) { return x.lot; }).filter(function (x, i, a) { return x && a.indexOf(x) === i; }).join(', '); }
  function snOf(p) { var o = []; p.forEach(function (x) { if (x.sn) o = o.concat(x.sn); }); return o.length ? o : null; }
  E._noop = function () {
  };
  function lastCost(sku) {
    for (var i = S.moves.length - 1; i >= 0; i--) { var m = S.moves[i]; if (m.sku === sku && m.type === 'receipt') return m.unit; }
    return ITEM[sku].cost;
  }
  E.lastCost = lastCost;

  E.adjust = function (o) {
    var ref = nextId('ADJ');
    var m = E.post({ type: 'adjustment', sku: o.sku, wh: o.wh, bin: o.bin, qty: o.qty, ref: ref, note: o.note || 'Stock adjustment' });
    commit(); return m;
  };

  E.transfer = function (o) {
    var sku = o.sku, q = Math.min(o.qty, Math.max(0, o.fromWh === o.toWh && o.fromBin ? (S.bins[sku] || {})[o.fromBin] || 0 : E.available(sku, o.fromWh)));
    if (q <= 0) return null;
    var ref = nextId('TR'), t = now();
    var fromBin = o.fromBin || E.primaryBin(sku, o.fromWh), toBin = o.toBin || E.primaryBin(sku, o.toWh);
    if (o.fromWh === o.toWh) { // bin to bin: same warehouse, value unchanged
      var took = binTake(sku, o.fromWh, q, fromBin); binAdd(sku, toBin, q);
      var src = took.map(function (x) { return x.bin; }).join(', ');
      record({ type: 'transfer', sku: sku, wh: o.fromWh, bin: src, qty: -q, unit: 0, value: 0, ref: ref, note: 'Bin move to ' + toBin, internal: true });
      record({ type: 'transfer', sku: sku, wh: o.toWh, bin: toBin, qty: q, unit: 0, value: 0, ref: ref, note: 'Bin move from ' + src, internal: true });
      if (!o.silent) commit(); return ref;
    }
    var r = consume(sku, o.fromWh, q), tk = binTake(sku, o.fromWh, q, fromBin);
    record({ type: 'transfer', sku: sku, wh: o.fromWh, bin: tk.map(function (x) { return x.bin; }).join(', '), qty: -q, unit: Math.round(r.cost / q), value: -r.cost, ref: ref, note: o.note || ('To ' + E.wh(o.toWh).short), pieces: r.pieces });
    r.pieces.forEach(function (p) { addLayer(sku, o.toWh, p.q, p.c, p.t, p.ref, p.lot, p.sn); });
    binAdd(sku, toBin, q);
    record({ type: 'transfer', sku: sku, wh: o.toWh, bin: toBin, qty: q, unit: Math.round(r.cost / q), value: r.cost, ref: ref, note: o.note || ('From ' + E.wh(o.fromWh).short), t: t });
    if (!o.silent) commit();
    return ref;
  };

  /* ---------- purchase orders → goods receipt ---------- */
  E.pos = function () { return S.pos; };
  E.po = function (id) { return S.pos.filter(function (p) { return p.id === id; })[0]; };
  E.createPO = function (o) {
    var po = { id: nextId('PO'), supplier: o.supplier, wh: o.wh || 'BHW', status: 'draft', created: now(), auto: !!o.auto, note: o.note || '',
      lines: o.lines.map(function (l) { return { sku: l.sku, pq: l.pq, recv: 0, cost: l.cost != null ? l.cost : lastCost(l.sku) }; }), receipts: [], eta: null };
    S.pos.push(po); return po;
  };
  E.poTotal = function (po) { return sum(po.lines, function (l) { return l.pq * ITEM[l.sku].buy.per * l.cost; }); };
  E.approvePO = function (id, silent) {
    var po = E.po(id); if (!po || po.status !== 'draft') return;
    po.lines = po.lines.filter(function (l) { return l.pq > 0; });
    po.status = 'approved'; po.approvedAt = now(); po.eta = now() + SUP[po.supplier].lead * DAY;
    if (!silent && simNow == null) commit();
  };
  // purchase → receive → bill: record the supplier's invoice against what was received
  E.billPO = function (id, o) { var po = E.po(id); if (!po) return; po.bill = { no: o.no, amount: o.amount, t: now() }; if (simNow == null) commit(); };
  E.receivedValue = function (po) { return sum(po.lines, function (l) { return l.recv * ITEM[l.sku].buy.per * l.cost; }); };
  E.setEta = function (id, t) { var po = E.po(id); if (po) po.eta = t; };
  E.cancelPO = function (id) { var po = E.po(id); if (!po) return; if (po.status === 'draft') S.pos.splice(S.pos.indexOf(po), 1); else po.status = 'cancelled'; if (po.auto) po.lines.forEach(function (l) { S.dismissed[l.sku] = now(); }); commit(); };
  E.setPOLine = function (id, sku, pq) { var po = E.po(id); if (!po || po.status !== 'draft') return; po.lines.forEach(function (l) { if (l.sku === sku) l.pq = Math.max(0, pq | 0); }); save(); emit(); };
  E.receive = function (id, lines, wh) {
    var po = E.po(id); if (!po || (po.status !== 'approved' && po.status !== 'partial')) return null;
    var gr = { id: nextId('GR'), t: now(), lines: [] };
    lines.forEach(function (x) {
      var l = po.lines.filter(function (k) { return k.sku === x.sku; })[0]; if (!l) return;
      var pq = Math.max(0, Math.min(x.pq | 0, l.pq - l.recv)); if (!pq) return;
      var units = pq * ITEM[l.sku].buy.per, bin = x.bin || E.primaryBin(l.sku, wh || po.wh);
      var mv = E.post({ type: 'receipt', sku: l.sku, wh: wh || po.wh, bin: bin, qty: units, cost: l.cost, ref: gr.id, doc: po.id, note: SUP[po.supplier].name + ' · ' + po.id });
      l.recv += pq; gr.lines.push({ sku: l.sku, pq: pq, units: units, bin: bin, lot: mv.lot, sn: mv.sn });
    });
    if (!gr.lines.length) { S.seq.GR--; return null; }
    po.receipts.push(gr);
    po.status = po.lines.every(function (l) { return l.recv >= l.pq; }) ? 'received' : 'partial';
    allocateBackorders(wh || po.wh);
    if (simNow == null) commit();
    return gr;
  };

  /* ---------- sales orders → pick list → dispatch ---------- */
  E.sos = function () { return S.sos; };
  E.so = function (id) { return S.sos.filter(function (p) { return p.id === id; })[0]; };
  E.createSO = function (o) {
    var lines = [];
    o.lines.forEach(function (l) {
      if (!ITEM[l.sku] || !(l.qty > 0)) return;
      var free = Math.max(0, E.available(l.sku, o.wh)), res = Math.min(l.qty, free);
      if (!o.partial) {
        if (res < l.qty) S.lost.push({ sku: l.sku, q: l.qty - res, t: now() });
        if (res > 0) lines.push({ sku: l.sku, qty: res, res: res, picked: 0 });
      } else lines.push({ sku: l.sku, qty: l.qty, res: res, picked: 0 });
    });
    if (!lines.length) return null;
    var so = { id: nextId('SO'), customer: o.customer, wh: o.wh || 'BHW', source: o.source || 'direct', crmId: o.crmId || null, ref: o.ref || '',
      created: now(), status: 'reserved', lines: lines, pick: null, wonAt: o.wonAt || null, note: o.note || '' };
    S.sos.push(so);
    return so;
  };
  E.shortfall = function (so) { return sum(so.lines, function (l) { return l.qty - l.res; }); };
  function allocateBackorders(wh) {
    S.sos.filter(function (so) { return so.status === 'reserved' && so.wh === wh; }).sort(function (a, b) { return a.created - b.created; }).forEach(function (so) {
      so.lines.forEach(function (l) { if (l.res < l.qty) { var free = Math.max(0, E.available(l.sku, wh)); l.res += Math.min(free, l.qty - l.res); } });
    });
  }
  E.reallocate = function (id) { var so = E.so(id); if (so) { allocateBackorders(so.wh); commit(); } };
  E.startPicking = function (id, opt) {
    var so = E.so(id); if (!so || so.status !== 'reserved') return;
    if (E.shortfall(so) > 0) {
      if (!(opt && opt.split)) return 'short';
      var back = so.lines.filter(function (l) { return l.qty > l.res; }).map(function (l) { return { sku: l.sku, qty: l.qty - l.res, res: 0, picked: 0 }; });
      so.lines = so.lines.filter(function (l) { l.qty = l.res; return l.res > 0; });
      S.sos.push({ id: so.id + '-B', customer: so.customer, wh: so.wh, source: so.source, crmId: so.crmId, ref: 'Backorder of ' + so.id, created: now(), status: 'reserved', lines: back, pick: null });
      if (!so.lines.length) { so.status = 'cancelled'; commit(); return; }
    }
    // claim bins: primary bin first, then the fullest; skip quantities already claimed by other open pick lists
    var claimed = {};
    S.sos.forEach(function (o) { if (o.status === 'picking' && o.pick) o.pick.forEach(function (p) { if (!p.done) claimed[p.sku + '@' + p.bin] = (claimed[p.sku + '@' + p.bin] || 0) + p.qty; }); });
    var pick = [];
    so.lines.forEach(function (l) {
      var need = l.res, prim = E.primaryBin(l.sku, so.wh);
      var bins = E.binsOf(l.sku, so.wh).map(function (b) { return { bin: b.bin, q: b.q - (claimed[l.sku + '@' + b.bin] || 0) }; }).filter(function (b) { return b.q > 0; })
        .sort(function (x, y) { return x.bin === prim ? -1 : y.bin === prim ? 1 : y.q - x.q; });
      bins.forEach(function (b) { if (need <= 0) return; var t = Math.min(need, b.q); pick.push({ sku: l.sku, bin: b.bin, qty: t, done: false }); need -= t; });
      if (need > 0) pick.push({ sku: l.sku, bin: prim, qty: need, done: false });
    });
    pick.sort(function (a, b) { return a.bin < b.bin ? -1 : a.bin > b.bin ? 1 : 0; });
    so.pick = pick; so.status = 'picking'; so.pickAt = now();
    if (simNow == null) commit();
  };
  E.pickLine = function (id, i, done) {
    var so = E.so(id); if (!so || !so.pick || !so.pick[i]) return;
    so.pick[i].done = done !== false; so.pick[i].at = now();
    so.status = so.pick.every(function (p) { return p.done; }) ? 'picked' : 'picking';
    if (simNow == null) commit();
  };
  E.pickAll = function (id) { var so = E.so(id); if (!so || !so.pick) return; so.pick.forEach(function (p) { p.done = true; p.at = now(); }); so.status = 'picked'; };
  E.dispatch = function (id) {
    var so = E.so(id); if (!so || so.status !== 'picked') return;
    var cogs = 0, rev = 0;
    so.pick.forEach(function (p) {
      var line = so.lines.filter(function (l) { return l.sku === p.sku; })[0];
      line.res -= p.qty; line.picked += p.qty; // release the reservation as the stock leaves
      if (!p.qty) return;
      var m = E.post({ type: 'sale', sku: p.sku, wh: so.wh, bin: p.bin, qty: -p.qty, ref: so.id, note: so.customer });
      p.lot = m.lot; p.sn = m.sn;
      cogs += -m.value;
    });
    so.lines.forEach(function (l) { rev += l.picked * ITEM[l.sku].price; l.res = 0; });
    so.cogs = cogs; so.revenue = rev; so.status = 'dispatched'; so.dispatchedAt = now();
    so.waybill = 'HLD' + String(48210 + S.seq.SO * 7 + so.lines.length).slice(-6);
    if (simNow == null) commit();
  };
  /* short pick: fewer found in the bin than the list says. The order ships what was found, the rest goes to a
     backorder, and the bin is flagged for a count (the system thought the stock was there). */
  E.shortPick = function (id, i, found, why) {
    var so = E.so(id); if (!so || !so.pick || !so.pick[i]) return null;
    var p = so.pick[i], miss = p.qty - Math.max(0, Math.min(found, p.qty));
    if (miss <= 0) { E.pickLine(id, i, true); return null; }
    if (why === 'damaged') E.post({ type: 'adjustment', sku: p.sku, wh: so.wh, bin: p.bin, qty: -miss, ref: nextId('ADJ'), note: 'Damaged at pick · ' + so.id });
    p.qty -= miss; p.done = true; p.at = now(); p.short = miss; p.why = why || 'short';
    var line = so.lines.filter(function (l) { return l.sku === p.sku; })[0];
    line.qty -= miss; line.res = Math.max(0, line.res - miss);
    var bid = so.id + '-B', b = E.so(bid);
    if (!b) { b = { id: bid, customer: so.customer, wh: so.wh, source: so.source, crmId: so.crmId, ref: 'Backorder of ' + so.id, created: now(), status: 'reserved', lines: [], pick: null, note: so.note }; S.sos.push(b); }
    var bl = b.lines.filter(function (l) { return l.sku === p.sku; })[0];
    if (bl) bl.qty += miss; else b.lines.push({ sku: p.sku, qty: miss, res: 0, picked: 0 });
    if (why !== 'damaged') S.countFlags[p.bin] = now();
    so.pick = so.pick.filter(function (q) { return q.qty > 0 || q === p; });
    so.status = so.pick.every(function (q) { return q.done; }) ? 'picked' : 'picking';
    if (!so.lines.some(function (l) { return l.qty > 0; })) so.status = 'cancelled';
    commit(); return b;
  };

  /* ---------- cycle counts ---------- */
  E.lastCounted = function (bin) { return S.counted[bin] || 0; };
  E.countFlag = function (bin) { return S.countFlags[bin] || 0; };
  E.setCounted = function (bin, t) { S.counted[bin] = t; };
  // today's plan: flagged bins first, then the bins counted longest ago (only bins holding stock)
  E.countPlan = function (wh, n) {
    return E.bins(wh).filter(function (b) { return E.binQty(b.id).length; })
      .sort(function (a, b) { return (E.countFlag(b.id) - E.countFlag(a.id)) || (E.lastCounted(a.id) - E.lastCounted(b.id)); })
      .slice(0, n || 8).map(function (b) { return b.id; });
  };
  // apply a finished count: one adjustment per variance, all under one count reference
  E.applyCount = function (results) {
    var ref = nextId('ADJ').replace('ADJ', 'CC'), posted = [];
    results.forEach(function (r) {
      r.lines.forEach(function (l) {
        var d = l.counted - l.expected;
        if (d) posted.push(E.post({ type: 'adjustment', sku: l.sku, wh: r.bin.slice(0, 3), bin: r.bin, qty: d, ref: ref, note: 'Cycle count ' + r.bin + (d < 0 ? ': ' + -d + ' short' : ': ' + d + ' found') }));
      });
      S.counted[r.bin] = now(); delete S.countFlags[r.bin];
    });
    commit(); return { ref: ref, moves: posted };
  };

  E.cancelSO = function (id) { var so = E.so(id); if (!so || !openSO(so)) return; so.status = 'cancelled'; so.lines.forEach(function (l) { l.res = 0; }); commit(); };

  /* ---------- low stock → draft purchase order ---------- */
  E.lowItems = function () { return H.SKUS.filter(function (s) { return E.status(s.sku) !== 'ok'; }); };
  E.suggestQty = function (sku) {
    var it = ITEM[sku], proj = E.available(sku) + E.onOrder(sku);
    var units = Math.max(E.roq(sku), E.rop(sku) * 2 - proj);
    return Math.ceil(units / it.buy.per);
  };
  E.draftFor = function (sku) {
    return S.pos.filter(function (p) { return p.status === 'draft' && p.lines.some(function (l) { return l.sku === sku && l.pq > 0; }); })[0];
  };
  function autoDraft() {
    var made = [];
    H.SKUS.forEach(function (s) {
      var proj = E.available(s.sku) + E.onOrder(s.sku, true);
      if (proj > E.rop(s.sku)) { delete S.dismissed[s.sku]; return; }
      if (S.dismissed[s.sku]) return;
      var po = S.pos.filter(function (p) { return p.status === 'draft' && p.auto && p.supplier === s.supplier; })[0];
      if (!po) { po = E.createPO({ supplier: s.supplier, wh: 'BHW', auto: true, lines: [], note: 'Drafted by low-stock alert' }); }
      if (!po.lines.some(function (l) { return l.sku === s.sku; })) { po.lines.push({ sku: s.sku, pq: E.suggestQty(s.sku), recv: 0, cost: lastCost(s.sku) }); made.push(s.sku); }
    });
    S.pos = S.pos.filter(function (p) { return !(p.status === 'draft' && p.auto && !p.lines.length); });
    return made;
  }
  E.approveDraft = function (id) { E.approvePO(id); };

  /* ---------- demo bridge (Lumen CRM Pro) ---------- */
  function readJSON(k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  E.bridgeDeals = function () { var d = readJSON(BRIDGE_DEALS); return Array.isArray(d) ? d : []; };
  E.writeBridge = function () {
    var out = {};
    H.SKUS.forEach(function (s) { out[s.sku] = { name: s.name, available: Math.max(0, E.available(s.sku)), onHand: E.onHand(s.sku), reserved: E.reserved(s.sku) }; });
    try { localStorage.setItem(BRIDGE_STOCK, JSON.stringify(out)); } catch (e) { }
    // demo-bridge:orders: each CRM deal's orders rolled into one entry, so the CRM can show "reserved for this deal"
    // { [dealId]: { so, status, orders: [ids], lines: [{ sku, qty, res, shipped }] } }; status is the main order's
    var orders = {};
    S.sos.forEach(function (so) {
      if (so.source !== 'crm' || !so.crmId || /^(demo-|seed-)/.test(so.crmId)) return;
      var main = S.deals[so.crmId], o = orders[so.crmId];
      if (!o) o = orders[so.crmId] = { so: main && main !== 'skip' ? main : so.id, status: '', orders: [], lines: [] };
      if (so.id === o.so) o.status = so.status;
      if (so.status === 'cancelled' && so.id !== o.so) return;
      o.orders.push(so.id);
      so.lines.forEach(function (l) {
        var x = o.lines.filter(function (y) { return y.sku === l.sku; })[0];
        if (!x) { x = { sku: l.sku, qty: 0, res: 0, shipped: 0 }; o.lines.push(x); }
        if (so.status === 'cancelled') return;
        x.qty += l.qty; x.shipped += so.status === 'dispatched' ? l.picked : 0; x.res += so.status === 'dispatched' ? 0 : l.res;
      });
    });
    try { localStorage.setItem(BRIDGE_ORDERS, JSON.stringify(orders)); } catch (e) { }
  };
  function bestWh(lines) {
    var score = function (wh) { return sum(lines, function (l) { return Math.min(l.qty, Math.max(0, E.available(l.sku, wh))); }); };
    return score('BLR') > score('BHW') ? 'BLR' : 'BHW';
  }
  /* Reads demo-bridge:won-deals (written by Lumen CRM Pro: an upsert by deal id).
     New id → a reserved sales order. Changed lines on a deal not yet being picked → the order is re-reserved.
     An id that disappears (deal re-opened in the CRM) → its open order is cancelled and the stock released.
     Returns { fresh, updated, released, locked } so the UI can say what happened. */
  function dealLines(d) {
    return (Array.isArray(d.items) ? d.items : []).filter(function (i) { return i && ITEM[i.sku] && i.qty > 0; })
      .map(function (i) { return { sku: i.sku, qty: Math.round(+i.qty) }; });
  }
  function sig(lines) { return lines.map(function (l) { return l.sku + ':' + l.qty; }).sort().join('|'); }
  E.syncDeals = function () {
    var out = { fresh: [], updated: [], released: [], locked: [] }, seen = {};
    S.dealSig = S.dealSig || {};
    E.bridgeDeals().forEach(function (d) {
      if (!d || d.id == null) return;
      var id = String(d.id), lines = dealLines(d), sg = sig(lines);
      seen[id] = 1;
      var soId = S.deals[id], so = soId && soId !== 'skip' ? E.so(soId) : null;
      if (!soId || (so && so.status === 'cancelled' && S.dealSig[id] === 'released')) {
        // new deal (or a deal won again after being re-opened)
        S.dealSig[id] = sg; S.deals[id] = 'skip';
        if (!lines.length) return;
        var won = typeof d.wonAt === 'number' ? d.wonAt : Date.parse(d.wonAt) || now();
        var nso = E.createSO({ customer: String(d.customer || 'Lumen CRM customer').slice(0, 60), wh: bestWh(lines), lines: lines, source: 'crm', crmId: id, ref: 'Lumen deal ' + id.slice(0, 24), partial: true, wonAt: won, note: String(d.note || d.remark || '').slice(0, 200) });
        if (nso) { S.deals[id] = nso.id; out.fresh.push(nso); }
        return;
      }
      if (S.dealSig[id] === sg) return;
      if (!so) { S.dealSig[id] = sg; return; }
      if (so.status === 'reserved') {
        // quantities edited in the CRM: release, then reserve the new lines
        so.lines.forEach(function (l) { l.res = 0; });
        so.lines = lines.map(function (l) { return { sku: l.sku, qty: l.qty, res: 0, picked: 0 }; });
        so.lines.forEach(function (l) { l.res = Math.min(l.qty, Math.max(0, E.available(l.sku, so.wh))); });
        if (!so.lines.length) { so.status = 'cancelled'; out.released.push(so); } else out.updated.push(so);
        S.dealSig[id] = sg;
      } else if (so.status === 'picking' || so.status === 'picked') {
        if (S.dealSig[id] !== 'locked:' + sg) { out.locked.push(so); S.dealSig[id] = 'locked:' + sg; }
      } else S.dealSig[id] = sg;
    });
    // deals that left the bridge were re-opened in the CRM: release what is still open
    Object.keys(S.dealSig).forEach(function (id) {
      if (seen[id] || S.dealSig[id] === 'released') return;
      S.sos.forEach(function (so) {
        if (so.source !== 'crm' || so.crmId !== id) return;
        if (so.status === 'reserved' || so.status === 'picking' || so.status === 'picked') {
          so.status = 'cancelled'; so.lines.forEach(function (l) { l.res = 0; }); so.cancelNote = 'Deal re-opened in Lumen CRM';
          out.released.push(so);
        }
      });
      S.dealSig[id] = 'released';
    });
    if (out.fresh.length || out.updated.length || out.released.length) commit(); else if (out.locked.length) save();
    return out;
  };
  // standalone demo: behaves like a deal arriving from the CRM, without writing the CRM's key
  E.simulateDeal = function () {
    var picks = [['Saffron Residences', [['HS-CH-001', 12], ['HS-TB-006', 2], ['HS-LT-014', 4]]], ['Ember & Oak Cafés', [['HS-CH-003', 8], ['HS-LT-013', 6], ['HS-LT-017', 10]]], ['Teal House Architects', [['HS-SF-008', 1], ['HS-RG-019', 2], ['HS-TX-020', 12]]]];
    var n = Object.keys(S.deals).filter(function (k) { return k.indexOf('demo-') === 0; }).length, p = picks[n % picks.length];
    var id = 'demo-' + (n + 1);
    var lines = p[1].map(function (x) { return { sku: x[0], qty: x[1] }; });
    var so = E.createSO({ customer: p[0], wh: bestWh(lines), lines: lines, source: 'crm', crmId: id, ref: 'Lumen deal', partial: true, wonAt: now() });
    S.deals[id] = so.id; commit(); return so;
  };

  /* ---------- reports ---------- */
  E.moves = function () { return S.moves; };
  E.totalValue = function (wh) { return sum(H.SKUS, function (s) { return E.value(s.sku, wh); }); };
  E.weekly = function (weeks) {
    var end = new Date(); end.setHours(0, 0, 0, 0); end = end.getTime() + DAY;
    var start = end - weeks * 7 * DAY, rows = [];
    for (var i = 0; i < weeks; i++) rows.push({ from: start + i * 7 * DAY, rin: 0, out: 0, vin: 0, vout: 0 });
    S.moves.forEach(function (m) {
      if (m.t < start || m.t >= end) return;
      var r = rows[Math.floor((m.t - start) / (7 * DAY))];
      if (m.type === 'receipt' && m.ref !== 'OPENING') { r.rin += m.qty; r.vin += m.value; }
      if (m.type === 'sale') { r.out += -m.qty; r.vout += -m.value; }
    });
    return rows;
  };
  E.salesStats = function (sku, days) {
    var since = now() - days * DAY, q = 0, last = null;
    S.moves.forEach(function (m) { if (m.sku === sku && m.type === 'sale') { if (m.t >= since) q += -m.qty; if (!last || m.t > last) last = m.t; } });
    return { q: q, last: last };
  };
  E.stockouts = function () {
    var cur = Object.keys(S.outs).filter(function (k) { return E.onHand(k.split('|')[0], k.split('|')[1]) <= 0; }).map(function (k) { var a = k.split('|'); return { sku: a[0], wh: a[1], from: S.outs[k], to: null }; });
    return cur.concat(S.outLog.slice().reverse());
  };
  E.lost = function () { return S.lost; };

  /* ---------- persistence & events ---------- */
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  function emit() { listeners.forEach(function (f) { try { f(); } catch (e) { if (window.console) console.error(e); } }); }
  function commit() { if (simNow != null) return; autoDraft(); save(); E.writeBridge(); emit(); }
  E.commit = commit;
  E.on = function (f) { listeners.push(f); };
  /* supplier record from purchase-order history: lead time, on-time share, open orders, last six deliveries */
  E.supplierStats = function (id) {
    var pos = S.pos.filter(function (p) { return p.supplier === id && p.status !== 'draft' && p.status !== 'cancelled'; }), leads = [], dl = [], open = 0, last = 0;
    pos.forEach(function (p) {
      if (p.status === 'approved' || p.status === 'partial') open++;
      p.receipts.forEach(function (g, i) {
        if (i === 0 && p.approvedAt) leads.push((g.t - p.approvedAt) / DAY);
        var late = p.eta ? g.t > p.eta + DAY : false;
        dl.push({ po: p.id, gr: g.id, t: g.t, late: late, lateDays: late ? Math.max(1, Math.round((g.t - p.eta) / DAY)) : 0, units: g.lines.reduce(function (a, x) { return a + x.units; }, 0), value: g.lines.reduce(function (a, x) { var l = p.lines.filter(function (k) { return k.sku === x.sku; })[0]; return a + x.units * (l ? l.cost : 0); }, 0) });
        if (g.t > last) last = g.t;
      });
    });
    dl.sort(function (a, b) { return b.t - a.t; });
    var onTime = dl.length ? Math.round(dl.filter(function (d) { return !d.late; }).length / dl.length * 100) : null;
    var lead = leads.length ? leads.reduce(function (a, b) { return a + b; }, 0) / leads.length : SUP[id].lead;
    return { lead: Math.round(lead), onTime: onTime, open: open, last: last || null, deliveries: dl.slice(0, 6), count: dl.length, pos: pos.length };
  };
  E.fresh = function () { S = blank(); H.seed(E); autoDraft(); S.created = Date.now(); };
  E.reset = function () { try { localStorage.removeItem(KEY); } catch (e) { } E.fresh(); save(); E.writeBridge(); E.syncDeals(); emit(); };
  E.init = function (opt) {
    opt = opt || {};
    var raw = opt.ephemeral ? null : readJSON(KEY);
    if (raw && raw.v === VERSION && raw.moves && Date.now() - raw.created < 30 * DAY) S = raw; else E.fresh();
    if (!opt.ephemeral) { save(); E.writeBridge(); }
    return E;
  };
  E.state = function () { return S; };
  // notes on any record (order, PO or item), and the supplier's own code for an item
  E.notes = function (id) { return ((S.notes || {})[id] || []).slice(); };
  E.addNote = function (id, text, who) { S.notes = S.notes || {}; (S.notes[id] = S.notes[id] || []).push({ t: now(), text: String(text).slice(0, 240), who: who || 'Meera Rao', ini: (who || 'Meera Rao').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2) }); commit(); };
  E.vendorSku = function (sku) { var c = S.cfg[sku]; return c && c.vsku || ''; };
  E.setVendorSku = function (sku, code) { S.cfg[sku] = S.cfg[sku] || {}; S.cfg[sku].vsku = String(code).slice(0, 24); commit(); };
  // undo: a snapshot of the whole demo state, restored as-is
  E.snapshot = function () { return JSON.stringify(S); };
  E.restore = function (j) { try { S = JSON.parse(j); } catch (e) { return; } save(); E.writeBridge(); emit(); };
})();
