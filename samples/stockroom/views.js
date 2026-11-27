/* Stockroom views: pure HTML renderers over the engine (window.SR). app.js wires routing and actions. */
(function () {
  'use strict';
  var E = window.SR, V = window.SRV = {};

  /* ---------- helpers ---------- */
  var esc = V.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var NF = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  var inr = V.inr = function (n) { return '₹' + NF.format(Math.round(n)); };
  var inrS = V.inrS = function (n) {
    var a = Math.abs(n), s = n < 0 ? '−' : '';
    if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(2) + ' Cr';
    if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(a >= 1e6 ? 1 : 2) + ' L';
    return s + '₹' + NF.format(a);
  };
  var n = V.n = function (x) { return NF.format(x); };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function hm(d) { return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }
  var when = V.when = function (t, withTime) {
    if (!t) return '—';
    var d = new Date(t), today = new Date(); today.setHours(0, 0, 0, 0);
    var diff = Math.floor((today.getTime() - new Date(d).setHours(0, 0, 0, 0)) / 864e5);
    if (diff === 0) return 'Today ' + hm(d);
    if (diff === 1) return 'Yesterday ' + hm(d);
    if (diff === -1) return 'Tomorrow';
    if (diff < -1 && diff > -7) return 'In ' + -diff + ' days';
    return d.getDate() + ' ' + MON[d.getMonth()] + (withTime ? ' ' + hm(d) : '');
  };
  // lower-case relative words mid-sentence ("today 11:20") but keep dates ("4 Dec")
  var whenLc = V.whenLc = function (t) { var x = when(t); return /^(Today|Yesterday|Tomorrow|In )/.test(x) ? x.charAt(0).toLowerCase() + x.slice(1) : x; };
  var day = V.day = function (t) { var d = new Date(t); return d.getDate() + ' ' + MON[d.getMonth()]; };
  function plural(k, w) { return k + ' ' + w + (k === 1 ? '' : 's'); }

  var P = {
    overview: 'M3.5 3.5h7v7h-7zM13.5 3.5h7v4h-7zM13.5 10.5h7v10h-7zM3.5 13.5h7v7h-7z',
    items: 'M12 3 4 7.5v9L12 21l8-4.5v-9zM4 7.5 12 12l8-4.5M12 12v9',
    locations: 'M3 20.5V9l9-5.5L21 9v11.5M7 20.5V13h10v7.5M7 16.8h10',
    ledger: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
    sales: 'M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3.2v2.8h-7M6.5 18.5a1.8 1.8 0 1 0 0-.01M17 18.5a1.8 1.8 0 1 0 0-.01',
    purchasing: 'M9 3.5h6v3H9zM7.5 5H5v15.5h14V5h-2.5M8.5 11.5h7M8.5 15.5h4.5',
    scan: 'M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M8 9v6M11 9v6M13.5 9v6M16.5 9v6',
    labels: 'M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1 1 0 0 1 0 1.4l-7.3 7.3a1 1 0 0 1-1.4 0zM8 8h.01',
    reports: 'M4 20V11M10 20V5M16 20v-6M2.5 20.5h19',
    search: 'M10.5 17.5a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20.5 20.5l-4.6-4.6',
    plus: 'M12 5v14M5 12h14', x: 'M6 6l12 12M18 6 6 18', check: 'M5 12.5l4.5 4.5L19 7.5', right: 'M9 6l6 6-6 6', left: 'M15 6l-6 6 6 6',
    receipt: 'M12 4v11M7 10.5l5 5 5-5M5 20h14', sale: 'M12 19V8M7 12.5l5-5 5 5M5 4h14', transfer: 'M7 4 3.5 7.5 7 11M3.5 7.5H17M17 13l3.5 3.5L17 20M20.5 16.5H7', adjustment: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
    menu: 'M4 7h16M4 12h16M4 17h16', camera: 'M4 8.5h3l1.8-2.5h6.4L17 8.5h3v10H4zM12 16.2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    print: 'M7 9V3.5h10V9M7 17H4v-7.5h16V17h-3M7 14h10v6.5H7z', alert: 'M12 4 2.8 19.5h18.4zM12 10v4M12 17h.01', bolt: 'M13 3 5 13.5h6L10 21l8-10.5h-6z',
    link: 'M10 13.5a4.5 4.5 0 0 0 6.4.4l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2M14 10.5a4.5 4.5 0 0 0-6.4-.4l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2',
    reset: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5', box: 'M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5zM3.5 7.5 12 12l8.5-4.5M12 12v9'
  };
  var icon = V.icon = function (k, cls) { return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + P[k] + '"/></svg>'; };
  V.markSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6.5h14M5 12h9.5M5 17.5h12" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg>';
  var thumb = V.thumb = function (sku, cls) { var it = E.item(sku); return '<img class="thumb' + (cls ? ' ' + cls : '') + '" src="' + it.thumb + '" alt="" loading="lazy" decoding="async" width="32" height="32">'; };
  var STAT = { ok: 'In stock', low: 'Below reorder', out: 'Out of stock' };
  var pill = V.pill = function (st) { return '<span class="pill ' + st + '" title="' + STAT[st] + '"><span class="pl">' + STAT[st] + '</span></span>'; };
  var crm = V.crm = function () { return '<span class="crm" title="Reserved from a deal won in Lumen CRM"><i aria-hidden="true"></i>from Lumen CRM</span>'; };
  var MV = { receipt: 'Receipt', sale: 'Sale', transfer: 'Transfer', adjustment: 'Adjustment' };
  var mv = V.mv = function (t) { return '<span class="mv ' + t + '"><b>' + icon(t) + '</b>' + MV[t] + '</span>'; };
  function itemCell(sku, small) { var it = E.item(sku); return '<div class="it">' + thumb(sku, small ? 'xs' : '') + '<span><b>' + esc(it.name) + '</b><small>' + it.sku + '</small></span></div>'; }
  V.itemCell = itemCell;
  function whName(id) { return E.wh(id).short; }
  function uom(it, q) { return it.uom === 'pack' ? plural(q, 'pack') : n(q); }
  function buyLabel(it, pq) { return it.buy.per > 1 ? n(pq) + ' ' + it.buy.unit + (pq === 1 ? '' : (it.buy.unit === 'box' ? 'es' : 's')) + ' <span class="faint">(' + n(pq * it.buy.per) + ' ' + it.uom + ')</span>' : n(pq); }
  V.buyLabel = buyLabel;

  var SOST = { reserved: 'Reserved', picking: 'Picking', picked: 'Ready to dispatch', dispatched: 'Dispatched', cancelled: 'Cancelled' };
  function soPill(so) {
    if (so.status === 'reserved' && E.shortfall(so) > 0) return '<span class="pill low">Backordered</span>';
    var c = { reserved: '', picking: 'acc', picked: 'ok', dispatched: 'plain', cancelled: 'plain' }[so.status];
    return '<span class="pill ' + c + '">' + SOST[so.status] + '</span>';
  }
  V.soPill = soPill;
  function soValue(so) { var t = 0; so.lines.forEach(function (l) { t += l.qty * E.item(l.sku).price; }); return t; }
  function soSteps(so) {
    var i = { reserved: 0, picking: 1, picked: 2, dispatched: 3, cancelled: -1 }[so.status];
    return '<span class="steps" role="img" aria-label="Progress: ' + SOST[so.status] + '">' + [0, 1, 2, 3].map(function (k) { return '<i class="' + (k < i || i === 3 ? 'on' : k === i ? 'now' : '') + '"></i>'; }).join('') + '</span>';
  }
  var POST = { draft: 'Draft', approved: 'Sent', partial: 'Partly received', received: 'Received', cancelled: 'Cancelled' };
  function poPill(po) {
    var late = (po.status === 'approved' || po.status === 'partial') && po.eta && po.eta < E.now() - 36e5 * 12;
    if (late) return '<span class="pill out">Late</span>';
    var c = { draft: 'acc', approved: 'plain', partial: 'low', received: 'ok', cancelled: 'plain' }[po.status];
    return '<span class="pill ' + c + '">' + POST[po.status] + '</span>';
  }
  V.poPill = poPill;

  /* value of the whole stock at the end of each of the last `days` days, by walking the ledger backwards */
  function valueSeries(days, wh) {
    var cur = E.totalValue(wh), moves = E.moves(), out = [], end = new Date(); end.setHours(23, 59, 59, 999);
    var i = moves.length - 1, v = cur;
    for (var d = 0; d < days; d++) {
      var t = end.getTime() - d * 864e5;
      while (i >= 0 && moves[i].t > t) { if (!wh || moves[i].wh === wh) v -= moves[i].value; i--; }
      out.unshift(v);
    }
    return out;
  }
  function spark(vals) {
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals), W = 200, Hh = 26, r = max - min || 1;
    var pts = vals.map(function (v, i) { return (i / (vals.length - 1) * W).toFixed(1) + ',' + (Hh - 2 - (v - min) / r * (Hh - 4)).toFixed(1); });
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + Hh + '" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + pts.join(' ') + '" fill="none" stroke="var(--accent)" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>';
  }

  /* ---------- chart: receipts vs dispatches ---------- */
  V.weeklyChart = function (mode, weeks) {
    var rows = E.weekly(weeks || 12), k1 = mode === 'value' ? 'vin' : 'rin', k2 = mode === 'value' ? 'vout' : 'out';
    var max = 0; rows.forEach(function (r) { max = Math.max(max, r[k1], r[k2]); });
    var step = niceStep(max / 4), top = Math.ceil(max / step) * step || 1;
    var W = 640, Hh = 220, L = 44, B = 24, T = 8, cw = (W - L - 4) / rows.length, bw = Math.min(14, cw * .3);
    var g = '';
    for (var y = 0; y <= top; y += step) {
      var yy = T + (Hh - T - B) * (1 - y / top);
      g += '<line x1="' + L + '" x2="' + W + '" y1="' + yy + '" y2="' + yy + '" stroke="var(--rule)"/><text x="' + (L - 8) + '" y="' + (yy + 4) + '" text-anchor="end">' + (mode === 'value' ? inrS(y).replace('₹', '') : n(y)) + '</text>';
    }
    rows.forEach(function (r, i) {
      var x = L + i * cw + cw / 2, h1 = (Hh - T - B) * r[k1] / top, h2 = (Hh - T - B) * r[k2] / top, base = Hh - B;
      g += '<rect x="' + (x - bw - 1.5) + '" y="' + (base - h1) + '" width="' + bw + '" height="' + Math.max(0, h1) + '" rx="2" fill="var(--ink)"><title>Week of ' + day(r.from) + ': received ' + (mode === 'value' ? inr(r[k1]) : n(r[k1]) + ' units') + '</title></rect>';
      g += '<rect x="' + (x + 1.5) + '" y="' + (base - h2) + '" width="' + bw + '" height="' + Math.max(0, h2) + '" rx="2" fill="var(--accent)"><title>Week of ' + day(r.from) + ': dispatched ' + (mode === 'value' ? inr(r[k2]) : n(r[k2]) + ' units') + '</title></rect>';
      if (i % 2 === 0 || rows.length <= 8) g += '<text x="' + x + '" y="' + (Hh - 6) + '" text-anchor="middle">' + day(r.from) + '</text>';
    });
    var tin = 0, tout = 0; rows.forEach(function (r) { tin += r[k1]; tout += r[k2]; });
    var desc = 'Receipts versus dispatches, last ' + rows.length + ' weeks: received ' + (mode === 'value' ? inr(tin) : n(tin) + ' units') + ', dispatched ' + (mode === 'value' ? inr(tout) : n(tout) + ' units') + '.';
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="' + esc(desc) + '">' + g + '</svg>';
  };
  function niceStep(x) { var p = Math.pow(10, Math.floor(Math.log10(x || 1))), f = x / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }

  /* ---------- overview (one big number, a quick-action row and a warehouse list) ---------- */
  function areaChart(vals, id) {
    var W = 720, Hh = 190, P = 6, min = Math.min.apply(null, vals), max = Math.max.apply(null, vals), pad = (max - min) * .25 || 1;
    min -= pad; max += pad * .4;
    var X = function (i) { return (i / (vals.length - 1) * W).toFixed(1); }, Y = function (v) { return (P + (Hh - 2 * P) * (1 - (v - min) / (max - min))).toFixed(1); };
    var line = vals.map(function (v, i) { return (i ? 'L' : 'M') + X(i) + ' ' + Y(v); }).join(' ');
    var desc = 'Stock value over the last ' + vals.length + ' days, from ' + inr(vals[0]) + ' to ' + inr(vals[vals.length - 1]) + '.';
    return '<svg class="area" id="' + id + '" viewBox="0 0 ' + W + ' ' + Hh + '" preserveAspectRatio="none" role="img" aria-label="' + esc(desc) + '" data-vals="' + vals.map(Math.round).join(',') + '">' +
      '<defs><linearGradient id="' + id + '-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9A374" stop-opacity=".5"/><stop offset="1" stop-color="#C9A374" stop-opacity="0"/></linearGradient></defs>' +
      [.25, .5, .75].map(function (f) { return '<line x1="0" x2="' + W + '" y1="' + (Hh * f) + '" y2="' + (Hh * f) + '" stroke="var(--rule)" stroke-dasharray="2 4" vector-effect="non-scaling-stroke"/>'; }).join('') +
      '<path d="' + line + ' L' + W + ' ' + Hh + ' L0 ' + Hh + 'Z" fill="url(#' + id + '-g)"/><path d="' + line + '" fill="none" stroke="var(--accent)" stroke-width="1.8" vector-effect="non-scaling-stroke"/>' +
      '<line class="xh" x1="0" x2="0" y1="0" y2="' + Hh + '" stroke="var(--ink-3)" stroke-width="1" vector-effect="non-scaling-stroke" opacity="0"/></svg>';
  }
  function greet() { var h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
  V.overview = function (U) {
    var wh = U.wh, items = E.items(), units = 0, value = E.totalValue(wh), range = U.range || 30;
    items.forEach(function (s) { units += E.onHand(s.sku, wh); });
    var open = E.sos().filter(function (s) { return (s.status === 'reserved' || s.status === 'picking' || s.status === 'picked') && (!wh || s.wh === wh); });
    var low = E.lowItems(), drafts = E.pos().filter(function (p) { return p.status === 'draft'; });
    var vs = valueSeries(range, wh), delta = vs[vs.length - 1] - vs[0], pct = vs[0] ? delta / vs[0] * 100 : 0;
    var crmSOs = E.sos().filter(function (s) { return s.source === 'crm'; }).sort(function (a, b) { return b.created - a.created; });
    var deals = E.bridgeDeals(), d = new Date();
    var incoming = 0; E.pos().forEach(function (p) { if (p.status === 'approved' || p.status === 'partial') p.lines.forEach(function (l) { incoming += (l.pq - l.recv) * E.item(l.sku).buy.per * l.cost; }); });
    var resVal = 0; items.forEach(function (s) { resVal += E.reserved(s.sku, wh) * E.lastCost(s.sku); });
    var nextPick = open.filter(function (s) { return s.status === 'picking'; })[0] || open.filter(function (s) { return s.status === 'reserved' && !E.shortfall(s); })[0];
    var late = E.pos().filter(function (p) { return (p.status === 'approved' || p.status === 'partial') && p.eta && p.eta < Date.now() - 12 * 36e5; });

    var h = '<div class="page"><div class="page-h"><div><h2>' + greet() + ', Meera</h2><p>' + ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] + ' ' + day(d) + ' · ' + (wh ? E.wh(wh).name : 'Halden Supply, both warehouses') + '</p></div></div>';
    h += '<div class="qa" role="group" aria-label="Quick actions"><a class="qbtn" href="#/scan">' + icon('scan') + 'Scan</a>' +
      (nextPick ? '<a class="qbtn" href="#/pick/' + nextPick.id + '">' + icon('box') + 'Pick next order</a>' : '') +
      '<a class="qbtn" href="#/purchasing?tab=open">' + icon('receipt') + 'Receive goods</a><button class="qbtn" data-act="po-new">' + icon('plus') + 'New PO</button>' +
      '<button class="qbtn" data-act="transfer-pick">' + icon('transfer') + 'Transfer</button><a class="qbtn" href="#/labels">' + icon('labels') + 'Labels</a>' +
      '<button class="qbtn" data-act="sim-deal">' + icon('bolt') + 'Add a won deal</button></div>';
    h += '<div class="hero2"><section class="panel hv"><header><h2>Stock value <span class="faint" style="font-weight:400">· FIFO cost</span></h2><span class="sp"></span><div class="seg" role="group" aria-label="Range"><button data-act="range" data-v="30" aria-pressed="' + (range === 30) + '">30D</button><button data-act="range" data-v="90" aria-pressed="' + (range === 90) + '">90D</button></div></header>' +
      '<div class="pad"><div class="big num" id="hv-num">' + inr(value) + '</div><div class="hv-sub"><span class="chip ' + (delta >= 0 ? 'up' : 'dn') + '">' + (delta >= 0 ? '▲' : '▼') + ' ' + Math.abs(pct).toFixed(1) + '%</span><span class="muted" id="hv-when">' + (delta >= 0 ? '+' : '−') + inrS(Math.abs(delta)).replace('−', '') + ' in ' + range + ' days</span></div>' +
      '<div class="area-wrap">' + areaChart(vs, 'hv-area') + '<div class="area-x"><span>' + day(Date.now() - (range - 1) * 864e5) + '</span><span>Today</span></div></div></div></section>';
    h += '<section class="panel acct"><header><h2>Where it sits</h2><span class="sp"></span><a class="btn sm ghost" href="#/locations">Locations ' + icon('right', 'sm') + '</a></header><ul class="list">' +
      E.warehouses().map(function (w) { var v = E.totalValue(w.id), u = 0, b = 0; items.forEach(function (s) { u += E.onHand(s.sku, w.id); }); E.bins(w.id).forEach(function (x) { if (E.binQty(x.id).length) b++; }); return '<li data-href="#/locations"><span class="wh-ic">' + w.id + '</span><div class="grow"><div class="t">' + w.name + '</div><div class="s">' + n(u) + ' units · ' + b + ' bins in use</div></div><b class="num">' + inrS(v) + '</b></li>'; }).join('') +
      '<li data-href="#/purchasing?tab=open"><span class="wh-ic in">' + icon('receipt', 'sm') + '</span><div class="grow"><div class="t">Incoming</div><div class="s">' + plural(E.pos().filter(function (p) { return p.status === 'approved' || p.status === 'partial'; }).length, 'open PO') + (late.length ? ' · <span style="color:var(--out)">' + late.length + ' late</span>' : '') + '</div></div><b class="num">' + inrS(incoming) + '</b></li>' +
      '<li data-href="#/sales"><span class="wh-ic res">' + icon('sales', 'sm') + '</span><div class="grow"><div class="t">Reserved for orders</div><div class="s">' + plural(open.length, 'open order') + '</div></div><b class="num">' + inrS(resVal) + '</b></li></ul></section></div>';
    h += '<section class="panel stats" aria-label="Key figures">' +
      '<a class="stat" href="#/items"><div class="k">Units on hand</div><div class="v">' + n(units) + '</div><div class="d">' + items.length + ' SKUs · ' + (wh ? '1 warehouse' : '2 warehouses') + '</div></a>' +
      '<a class="stat" href="#/sales"><div class="k">Open sales orders</div><div class="v">' + open.length + '</div><div class="d">' + open.filter(function (s) { return s.status === 'picked'; }).length + ' ready to dispatch · ' + open.filter(function (s) { return s.source === 'crm'; }).length + ' from Lumen CRM</div></a>' +
      '<a class="stat" href="#/items?status=low"><div class="k">Below reorder point</div><div class="v">' + low.length + '<small>of ' + items.length + '</small></div><div class="d">' + plural(drafts.length, 'draft PO') + ' ready to approve</div></a>' +
      '<a class="stat" href="#/reports"><div class="k">Dispatched, 7 days</div><div class="v">' + n(E.weekly(1)[0].out) + '<small>units</small></div><div class="d">' + inrS(E.weekly(1)[0].vout) + ' at cost</div></a></section>';

    // needs attention
    var att = '';
    drafts.forEach(function (po) {
      var sup = E.supplier(po.supplier), anyOut = po.lines.some(function (l) { return E.status(l.sku) === 'out'; });
      att += '<li><span class="mv adjustment"><b>' + icon('alert') + '</b></span><div class="grow"><div class="t">' + po.lines.map(function (l) { return esc(E.item(l.sku).name); }).join(', ') + ' <span class="pill ' + (anyOut ? 'out' : 'low') + '">' + (anyOut ? 'Out of stock' : 'Below reorder') + '</span></div>' +
        '<div class="s">Draft <a href="#/purchasing/' + po.id + '" class="obj">' + po.id + '</a> · ' + esc(sup.name) + ' · ' + inr(E.poTotal(po)) + '</div></div>' +
        '<button class="btn sm primary" data-act="po-approve" data-id="' + po.id + '">Approve</button></li>';
    });
    E.sos().filter(function (s) { return s.status === 'reserved' && E.shortfall(s) > 0; }).forEach(function (so) {
      att += '<li><span class="mv sale"><b>' + icon('sales') + '</b></span><div class="grow"><div class="t">' + esc(so.customer) + (so.source === 'crm' ? ' ' + crm() : '') + '</div><div class="s"><a href="#/sales/' + so.id + '" class="obj">' + so.id + '</a> · ' + n(E.shortfall(so)) + ' units backordered</div></div><a class="btn sm" href="#/sales/' + so.id + '">Resolve</a></li>';
    });
    E.pos().filter(function (p) { return (p.status === 'approved' || p.status === 'partial') && p.eta && p.eta < Date.now() + 2 * 864e5; }).slice(0, 4).forEach(function (po) {
      att += '<li><span class="mv receipt"><b>' + icon('receipt') + '</b></span><div class="grow"><div class="t">' + esc(E.supplier(po.supplier).name) + ' ' + poPill(po) + '</div><div class="s"><a href="#/purchasing/' + po.id + '" class="obj">' + po.id + '</a> · ' + (po.eta < Date.now() ? 'was due ' : 'expected ') + whenLc(po.eta) + '</div></div><button class="btn sm" data-act="po-receive" data-id="' + po.id + '">Receive</button></li>';
    });
    h += '<div class="grid2"><section class="panel"><header><h2>Needs attention</h2><span class="sp"></span><a class="btn sm ghost" href="#/items?status=low">All low stock ' + icon('right', 'sm') + '</a></header><ul class="list">' + (att || '<li>' + V.empty('check', 'All clear', 'Nothing needs you right now.') + '</li>') + '</ul></section>';

    var c = '<section class="panel"><header><h2>Reservations from Lumen CRM</h2><span class="sp"></span><span class="faint" style="font-size:12px">' + (deals.length ? deals.length + ' won deals read' : 'Listening for won deals') + '</span></header><ul class="list">';
    crmSOs.slice(0, 5).forEach(function (so) {
      var units = 0, res = 0; so.lines.forEach(function (l) { units += l.qty; res += Math.min(l.res + l.picked, l.qty); });
      c += '<li data-href="#/sales/' + so.id + '"><div class="grow"><div class="t"><a href="#/sales/' + so.id + '">' + esc(so.customer) + '</a> ' + soPill(so) + '</div><div class="s"><span class="mono">' + so.id + '</span> · ' + plural(so.lines.length, 'line') + ' · ' + (so.status === 'dispatched' ? 'dispatched ' + whenLc(so.dispatchedAt) : n(res) + ' of ' + n(units) + ' reserved') + '</div></div>' + soSteps(so) + '</li>';
    });
    if (!crmSOs.length) c += '<li>' + V.empty('link', 'No won deals yet', 'Mark a deal Won in Lumen CRM and it lands here, already reserved.') + '</li>';
    c += '</ul><div class="pad" style="border-top:1px solid var(--rule);display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn sm" data-act="sim-deal">' + icon('bolt') + 'Add a won deal</button><a class="btn sm ghost" href="../crm/">Open Lumen CRM ' + icon('right', 'sm') + '</a></div></section></div>';
    h += c;

    h += '<div class="grid2 even"><section class="panel"><header><h2>Receipts vs dispatches</h2><span class="sp"></span><div class="legend"><span><i style="background:var(--ink)"></i>Received</span><span><i style="background:var(--accent)"></i>Dispatched</span></div></header><div class="pad">' + V.weeklyChart('units', 12) + '</div></section>';
    var mvs = E.moves().filter(function (m) { return !wh || m.wh === wh; }).slice(-8).reverse();
    h += '<section class="panel"><header><h2>Latest movements</h2><span class="sp"></span><a class="btn sm ghost" href="#/ledger">Stock ledger ' + icon('right', 'sm') + '</a></header><div class="scroll-x"><table class="tbl"><thead><tr><th>Item</th><th class="hide-m">Type</th><th class="num">Qty</th><th class="num hide-m">Balance</th><th class="r">When</th></tr></thead><tbody>' +
      mvs.map(function (m) { return '<tr data-href="#/items/' + m.sku + '"><td>' + itemCell(m.sku, true) + '</td><td class="hide-m">' + mv(m.type) + '</td><td class="num ' + (m.qty < 0 ? 'neg' : 'pos') + '">' + (m.qty > 0 ? '+' : '−') + n(Math.abs(m.qty)) + '</td><td class="num hide-m">' + n(m.bal) + '</td><td class="r faint">' + when(m.t) + '</td></tr>'; }).join('') + '</tbody></table></div></section></div>';
    return h + '</div>';
  };

  /* ---------- empty state ---------- */
  V.empty = function (ic, title, text, action) {
    return '<div class="empty2"><span class="eic">' + icon(ic) + '</span><b>' + esc(title) + '</b><span>' + text + '</span>' + (action || '') + '</div>';
  };

  /* ---------- items (saved views, bulk select, inline reorder point) ---------- */
  var CATS = ['Seating', 'Tables', 'Sofas', 'Storage', 'Lighting', 'Textiles'];
  function itemMatches(U) {
    var q = (U.q || '').toLowerCase();
    return E.items().filter(function (s) {
      if (U.cat && s.category !== U.cat) return false;
      if (U.status && (U.status === 'low' ? E.status(s.sku) === 'ok' : E.status(s.sku) !== U.status)) return false;
      if (q && (s.name + ' ' + s.sku + ' ' + s.family + ' ' + E.supplier(s.supplier).name).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }
  V.itemMatches = itemMatches;
  V.itemRows = function (U) {
    var wh = U.wh, rows = itemMatches(U), sel = U.selItems || {};
    if (!rows.length) return '<tr><td colspan="10">' + V.empty('search', 'No items match', 'Try another category or clear the search.', '<button class="btn sm" data-act="clear-filters">Clear filters</button>') + '</td></tr>';
    return rows.map(function (s) {
      var oh = E.onHand(s.sku, wh), rs = E.reserved(s.sku, wh), av = oh - rs, crmR = E.reservedCRM(s.sku);
      var editing = U.editRop === s.sku;
      return '<tr data-href="#/items/' + s.sku + '" data-sku="' + s.sku + '" data-row' + (U.sel === s.sku || sel[s.sku] ? ' class="on"' : '') + '><td class="ck"><input type="checkbox" class="chk" data-act="sel" data-k="selItems" data-v="' + s.sku + '" aria-label="Select ' + esc(s.name) + '"' + (sel[s.sku] ? ' checked' : '') + '></td><td>' + '<div class="it"><img class="thumb" src="' + s.thumb + '" alt="" loading="lazy" decoding="async" width="32" height="32"><span><b><a href="#/items/' + s.sku + '" style="text-decoration:none">' + esc(s.name) + '</a></b><small>' + s.sku + '</small></span></div></td>' +
        '<td class="hide-m muted">' + s.category + '</td><td class="num hide-m">' + n(oh) + '</td><td class="num hide-m">' + (rs ? n(rs) + (crmR ? ' <span class="crm" title="' + n(crmR) + ' reserved from Lumen CRM deals"><i aria-hidden="true"></i>' + n(crmR) + '</span>' : '') : '<span class="faint">—</span>') + '</td>' +
        '<td class="num"><b style="font-weight:500">' + n(av) + '</b></td><td class="num hide-m">' + (editing ? '<input class="input num inl-in" data-in="rop" data-sku="' + s.sku + '" type="number" min="0" inputmode="numeric" value="' + E.rop(s.sku) + '" aria-label="Reorder point for ' + esc(s.name) + '">' : '<button class="inl" data-act="inl-rop" data-sku="' + s.sku + '" title="Edit reorder point (press E)">' + n(E.rop(s.sku)) + '</button>') + '</td><td class="num hide-m">' + (E.onOrder(s.sku) ? n(E.onOrder(s.sku)) : '<span class="faint">—</span>') + '</td><td class="num hide-m">' + inrS(E.value(s.sku, wh)) + '</td><td class="r">' + pill(E.status(s.sku)) + '</td></tr>';
    }).join('');
  };
  V.items = function (U) {
    var counts = { low: 0, out: 0 }; E.items().forEach(function (s) { var st = E.status(s.sku); if (st !== 'ok') counts.low++; if (st === 'out') counts.out++; });
    var views = U.views || [], rows = itemMatches(U), sel = U.selItems || {}, allOn = rows.length && rows.every(function (s) { return sel[s.sku]; });
    var cur = JSON.stringify([U.q || '', U.cat || '', U.status || '']);
    var h = '<div class="page"><div class="page-h"><div><h2>Items</h2><p>20 SKUs across 6 categories · quantities ' + (U.wh ? 'at ' + E.wh(U.wh).name : 'across both warehouses') + '</p></div><span class="sp"></span><button class="btn" data-act="export-items">Export CSV</button><a class="btn" href="#/labels">' + icon('labels') + 'Print labels</a></div>';
    h += '<div class="views" role="group" aria-label="Saved views"><button data-act="view" data-i="-1" aria-pressed="' + (cur === '["","",""]') + '">All items</button>' +
      views.map(function (v, i) { var on = JSON.stringify([v.q || '', v.cat || '', v.status || '']) === cur; return '<span class="vchip"><button data-act="view" data-i="' + i + '" aria-pressed="' + on + '">' + esc(v.name) + '</button>' + (v.custom ? '<button class="vx" data-act="view-del" data-i="' + i + '" aria-label="Delete view ' + esc(v.name) + '">' + icon('x', 'sm') + '</button>' : '') + '</span>'; }).join('') +
      (cur !== '["","",""]' && !views.some(function (v) { return JSON.stringify([v.q || '', v.cat || '', v.status || '']) === cur; }) ? '<button class="vsave" data-act="view-save">' + icon('plus', 'sm') + 'Save view</button>' : '') + '</div>';
    h += '<div class="bar"><label class="search" style="width:min(320px,100%)"><span class="vh">Search items</span>' + icon('search') + '<input class="input" type="search" placeholder="Search name, SKU, supplier" data-in="q" value="' + esc(U.q || '') + '"></label>' +
      '<div class="seg scroll-x" role="group" aria-label="Category"><button data-act="cat" data-v="" aria-pressed="' + !U.cat + '">All</button>' + CATS.map(function (c) { return '<button data-act="cat" data-v="' + c + '" aria-pressed="' + (U.cat === c) + '">' + c + '</button>'; }).join('') + '</div><span class="sp"></span>' +
      '<div class="seg" role="group" aria-label="Stock status"><button data-act="status" data-v="" aria-pressed="' + !U.status + '">Any status</button><button data-act="status" data-v="low" aria-pressed="' + (U.status === 'low') + '">Low <span class="c">' + counts.low + '</span></button><button data-act="status" data-v="out" aria-pressed="' + (U.status === 'out') + '">Out <span class="c">' + counts.out + '</span></button></div></div>';
    h += '<section class="panel"><div class="scroll-x"><table class="tbl" data-kb><thead><tr><th class="ck"><input type="checkbox" class="chk" data-act="selall" data-k="selItems" aria-label="Select all items in view"' + (allOn ? ' checked' : '') + '></th><th>Item</th><th class="hide-m">Category</th><th class="num hide-m">On hand</th><th class="num hide-m">Reserved</th><th class="num">Available</th><th class="num hide-m">Reorder at</th><th class="num hide-m">On order</th><th class="num hide-m">Value</th><th class="r">Status</th></tr></thead><tbody id="item-rows">' + V.itemRows(U) + '</tbody></table></div></section>' +
      '<p class="hint hide-m"><span class="kbd">J</span> <span class="kbd">K</span> move · <span class="kbd">X</span> select · <span class="kbd">E</span> edit reorder point · <span class="kbd">↵</span> open · <span class="kbd">?</span> all shortcuts</p></div>';
    return h;
  };

  V.itemSheet = function (sku, U) {
    var it = E.item(sku), sup = E.supplier(it.supplier), st = E.status(sku), fam = E.family(sku);
    var oh = E.onHand(sku), rs = E.reserved(sku), oo = E.onOrder(sku), margin = (it.price - E.lastCost(sku)) / it.price * 100;
    var h = '<div class="hero-item"><img src="' + it.photo + '" alt="' + esc(it.name) + ', product photo" width="148" height="148"><div><div class="mono faint">' + it.sku + '</div><h3>' + esc(it.name) + '</h3><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">' + pill(st) + '<span class="tag">' + it.category + '</span><span class="tag">' + esc(it.family) + '</span></div>' +
      '<div class="muted" style="font-size:12.5px">' + Object.keys(it.variant).map(function (k) { return k + ': ' + esc(it.variant[k]); }).join(' · ') + ' · ' + it.dims + ' · ' + it.kg + ' kg</div></div></div>';
    if (fam.length > 1) h += '<div><h3>Variants of ' + esc(it.family) + '</h3><div class="variants">' + fam.map(function (f) { var k = Object.keys(f.variant)[0]; return '<a href="#/items/' + f.sku + '" aria-current="' + (f.sku === sku) + '">' + thumb(f.sku, 'xs') + esc(f.variant[k]) + ' <span class="faint num">' + n(E.available(f.sku)) + '</span></a>'; }).join('') + '</div></div>';
    h += '<div class="minis"><div class="hi"><span>Available ' + tip('available', 'available') + '</span><b>' + n(oh - rs) + '</b></div><div><span>On the shelf ' + tip('onhand', 'on hand') + '</span><b>' + n(oh) + '</b></div><div><span>Reserved ' + tip('reserved', 'reserved') + '</span><b>' + n(rs) + '</b></div><div><span>On its way ' + tip('onorder', 'on order') + '</span><b>' + n(oo) + '</b></div></div>';
    // by warehouse and bin
    h += '<div><h3>Where it is ' + tip('bin', 'bin') + '</h3><div class="boxed"><table class="tbl"><thead><tr><th>Warehouse · bin</th><th class="num">On hand</th><th class="num">Reserved</th><th class="num">Value</th></tr></thead><tbody>';
    E.warehouses().forEach(function (w) {
      var bins = E.binsOf(sku, w.id);
      h += '<tr><td><b style="font-weight:500">' + w.name + '</b></td><td class="num">' + n(E.onHand(sku, w.id)) + '</td><td class="num">' + n(E.reserved(sku, w.id)) + '</td><td class="num">' + inr(E.value(sku, w.id)) + '</td></tr>';
      bins.forEach(function (b) { h += '<tr data-href="#/locations/' + b.bin + '"><td style="padding-left:26px"><a class="obj bin-c" href="#/locations/' + b.bin + '">' + b.bin + '</a></td><td class="num muted">' + n(b.q) + '</td><td></td><td></td></tr>'; });
    });
    h += '</tbody></table></div></div>';
    // details
    h += '<div class="grid2 even" style="gap:18px"><div><h3>Purchasing</h3><dl class="kv"><dt>Supplier</dt><dd>' + esc(sup.name) + '</dd><dt>Lead time</dt><dd>' + sup.lead + ' days</dd><dt>Buy unit</dt><dd>' + (it.buy.per > 1 ? it.buy.unit + ' of ' + it.buy.per : it.buy.unit) + '</dd><dt>Last cost</dt><dd>' + inr(E.lastCost(sku)) + ' / ' + it.uom + '</dd></dl></div>' +
      '<div><h3>Selling</h3><dl class="kv"><dt>Unit</dt><dd>' + it.uom + '</dd><dt>List price</dt><dd>' + inr(it.price) + '</dd><dt>Margin at last cost</dt><dd>' + margin.toFixed(1) + '%</dd><dt>Sold, 30 days</dt><dd>' + n(E.salesStats(sku, 30).q) + '</dd></dl></div></div>';
    h += '<form class="row2" data-form="reorder" data-sku="' + sku + '" style="align-items:end;grid-template-columns:1fr 1fr auto"><label class="field"><span>Reorder point ' + tip('rop', 'reorder point') + '</span><span class="faint hint2">We’ll warn you, and draft an order, when available stock drops to this.</span><input class="input num" name="rop" type="number" min="0" inputmode="numeric" value="' + E.rop(sku) + '"></label><label class="field"><span>Order this many</span><span class="faint hint2">How much a draft order tops up by.</span><input class="input num" name="roq" type="number" min="1" inputmode="numeric" value="' + E.roq(sku) + '"></label><button class="btn" type="submit">Save</button></form>';
    h += '<details class="more"' + (U && U.detail ? ' open' : '') + '><summary>More detail <span class="faint">· batches, serial numbers, FIFO cost and movement history</span></summary><div class="more-b">';
    // FIFO layers
    var layers = E.fifoLayers(sku), seenWh = {};
    h += '<div><h3>Batches and cost ' + tip('batch', 'batch') + ' <span class="faint">· the oldest batch in each warehouse ships first ' + tip('fifo', 'FIFO') + '</span></h3><div class="boxed"><table class="tbl"><thead><tr><th>Received</th><th>Batch</th><th>Where</th><th class="num">Qty</th><th class="num">Unit cost</th><th class="num">Value</th></tr></thead><tbody>' +
      (layers.length ? layers.map(function (l) { var first = !seenWh[l.wh]; seenWh[l.wh] = 1; return '<tr><td>' + day(l.t) + (first ? ' <span class="pill acc plain">Next out</span>' : '') + '</td><td><span class="skup">' + esc(l.lot || '—') + '</span></td><td class="muted">' + whName(l.wh) + ' · <span class="mono">' + esc(l.ref) + '</span></td><td class="num">' + n(l.q) + '</td><td class="num">' + inr(l.c) + '</td><td class="num">' + inr(l.q * l.c) + '</td></tr>'; }).join('') : '<tr><td colspan="6" class="empty">No stock on hand.</td></tr>') +
      '</tbody></table></div></div>';
    if (it.serial) { var sl = E.serials(sku); h += '<div><h3>Serial numbers in stock ' + tip('serial', 'serial number') + ' <span class="faint">· ' + sl.length + '</span></h3><div class="sn-list">' + (sl.length ? sl.map(function (x) { return '<span class="skup" title="' + whName(x.wh) + ' · batch ' + esc(x.lot) + '">' + x.sn + '</span>'; }).join(' ') : '<span class="faint">None in stock</span>') + '</div></div>'; }
    // ledger for item
    var mvs = E.moves().filter(function (m) { return m.sku === sku; }).slice(-12).reverse();
    h += '<div><h3>Recent movements <a href="#/ledger?sku=' + sku + '" style="float:right;color:var(--accent-ink);text-decoration:none">Full ledger →</a></h3><div class="boxed scroll-x"><table class="tbl"><thead><tr><th>When</th><th>Type</th><th>Ref</th><th class="num">Qty</th><th class="num">Balance</th></tr></thead><tbody>' +
      mvs.map(function (m) { return '<tr><td class="muted">' + when(m.t) + '</td><td>' + mv(m.type) + '</td><td class="mono muted">' + esc(m.ref) + '</td><td class="num ' + (m.qty < 0 ? 'neg' : 'pos') + '">' + (m.qty > 0 ? '+' : '−') + n(Math.abs(m.qty)) + '</td><td class="num">' + n(m.bal) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
    h += '</div></details>';
    return { title: '<span class="mono faint">' + sku + '</span>', body: h,
      foot: '<button class="btn" data-act="label" data-sku="' + sku + '">' + icon('labels') + 'Label</button><button class="btn" data-act="transfer" data-sku="' + sku + '">' + icon('transfer') + 'Transfer</button><button class="btn" data-act="adjust" data-sku="' + sku + '">' + icon('adjustment') + 'Adjust</button>' + (st !== 'ok' && E.draftFor(sku) ? '<a class="btn primary" href="#/purchasing/' + E.draftFor(sku).id + '">Review draft PO</a>' : '') };
  };

  /* ---------- locations ---------- */
  var CAP = { A: 40, B: 80, C: 160 };
  V.locations = function (U) {
    var wh = U.wh || U.locWh || 'BHW', w = E.wh(wh), used = 0, units = 0;
    E.bins(wh).forEach(function (b) { var c = E.binQty(b.id); if (c.length) used++; c.forEach(function (x) { units += x.q; }); });
    var h = '<div class="page"><div class="page-h"><div><h2>Locations</h2><p>' + w.name + ' · ' + w.city + ' · ' + used + ' of ' + E.bins(wh).length + ' bins in use · ' + n(units) + ' units · ' + inrS(E.totalValue(wh)) + '</p></div><span class="sp"></span>' +
      (U.wh ? '' : '<div class="seg" role="group" aria-label="Warehouse">' + E.warehouses().map(function (x) { return '<button data-act="locwh" data-v="' + x.id + '" aria-pressed="' + (x.id === wh) + '">' + x.name + '</button>'; }).join('') + '</div>') +
      '<div class="seg" role="group" aria-label="View"><button data-act="locview" data-v="map" aria-pressed="' + (U.locView !== 'list') + '">Bin map</button><button data-act="locview" data-v="list" aria-pressed="' + (U.locView === 'list') + '">Stock by bin</button></div></div>';
    var fc = V.floorCounts([wh]);
    h += '<div class="loc-map"><section class="fl-panel" aria-labelledby="fl-h2"><header><h3 id="fl-h2">The floor · ' + esc(w.name) + '</h3><span class="sp"></span><span class="fl-counts">' + [fc.pick ? plural(fc.pick, 'bin') + ' to pick' : '', fc.count ? fc.count + ' to recount' : '', fc.recv ? fc.recv + ' receiving' : '', fc.low ? fc.low + ' running low' : ''].filter(Boolean).join(' · ') + '</span></header>' +
      '<div class="fl-scroll" tabindex="0" role="region" aria-label="Warehouse drawing, scrolls sideways on small screens">' + V.floorHosts([wh]) + '</div>' + V.floorKey() + '</section></div>';
    if (U.locView === 'list') {
      h += '<section class="panel"><div class="scroll-x"><table class="tbl"><thead><tr><th>Bin</th><th>Item</th><th class="num">Qty</th><th class="num hide-m">Value at FIFO</th><th class="r hide-m">Zone</th></tr></thead><tbody>';
      E.bins(wh).forEach(function (b) {
        E.binQty(b.id).forEach(function (x) {
          var share = E.onHand(x.sku, wh) ? E.value(x.sku, wh) * x.q / E.onHand(x.sku, wh) : 0;
          h += '<tr data-href="#/locations/' + b.id + '"><td><a class="obj" href="#/locations/' + b.id + '">' + b.id + '</a></td><td>' + itemCell(x.sku, true) + '</td><td class="num">' + n(x.q) + '</td><td class="num hide-m">' + inr(share) + '</td><td class="r hide-m muted">' + zoneName(b.zone) + '</td></tr>';
        });
      });
      return h + '</tbody></table></div></section></div>';
    }
    h += '<div class="grid2"><section class="panel"><header><h2>Every bin</h2><span class="sp"></span><span class="faint" style="font-size:12px">Bar shows how full each bin is</span></header><div class="pad floor">';
    window.HALDEN.ZONES.forEach(function (z) {
      h += '<div class="zone"><h4>Zone ' + z.id + ' <span>' + z.name + '</span></h4><div class="bins" style="--n:' + z.bins + '">';
      E.bins(wh).filter(function (b) { return b.zone === z.id; }).forEach(function (b) {
        var c = E.binQty(b.id), q = 0; c.forEach(function (x) { q += x.q; });
        var low = c.some(function (x) { return E.status(x.sku) !== 'ok'; });
        h += '<a class="bin' + (c.length ? '' : ' empty') + (low ? ' lowb' : '') + '" href="#/locations/' + b.id + '" aria-current="' + (U.bin === b.id) + '" aria-label="Bin ' + b.id + ': ' + (c.length ? plural(c.length, 'SKU') + ', ' + q + ' units' : 'empty') + '"><span class="c">' + b.id.slice(4) + '</span>' +
          '<span class="dots">' + c.slice(0, 3).map(function (x) { return '<img src="' + E.item(x.sku).thumb + '" alt="" loading="lazy" width="18" height="18">'; }).join('') + '</span><span class="q">' + (c.length ? n(q) + ' u' : 'Empty') + '</span><span class="f" style="width:' + Math.min(100, q / CAP[z.id] * 100) + '%"></span></a>';
      });
      h += '</div></div>';
    });
    h += '</div></section>';
    h += '<section class="panel" id="bin-panel">' + V.binPanel(U.bin && U.bin.indexOf(wh) === 0 ? U.bin : null) + '</section></div>';
    return h + '</div>';
  };
  function zoneName(z) { return window.HALDEN.ZONES.filter(function (x) { return x.id === z; })[0].name; }
  V.binPanel = function (bin) {
    if (!bin) return '<header><h2>Bin contents</h2></header><div class="empty">Choose a bin on the floor plan to see what\'s in it.</div>';
    var c = E.binQty(bin);
    var h = '<header><h2 class="mono">' + bin + '</h2><span class="sp"></span><button class="btn sm" data-act="label-bin" data-bin="' + bin + '">' + icon('labels') + 'Bin label</button></header>';
    if (!c.length) return h + '<div class="empty">This bin is empty.</div>';
    return h + '<ul class="list">' + c.map(function (x) {
      return '<li><a href="#/items/' + x.sku + '" class="grow" style="text-decoration:none">' + itemCell(x.sku) + '</a><span class="num" style="font-weight:500">' + n(x.q) + '</span><button class="btn sm" data-act="binmove" data-sku="' + x.sku + '" data-bin="' + bin + '">Move</button></li>';
    }).join('') + '</ul>';
  };

  /* ---------- stock ledger ---------- */
  V.ledger = function (U) {
    var all = E.moves(), t = U.ltype, sku = U.lsku, wh = U.wh;
    var rows = [];
    for (var i = all.length - 1; i >= 0; i--) { var m = all[i]; if (t && m.type !== t) continue; if (sku && m.sku !== sku) continue; if (wh && m.wh !== wh) continue; rows.push(m); }
    var lim = U.llimit || 60, shown = rows.slice(0, lim);
    var h = '<div class="page"><div class="page-h"><div><h2>Stock ledger</h2><p>Every movement, with the running balance and FIFO value after it. ' + n(rows.length) + ' entries.</p></div></div>';
    h += '<div class="bar"><div class="seg scroll-x" role="group" aria-label="Movement type"><button data-act="ltype" data-v="" aria-pressed="' + !t + '">All</button>' + ['receipt', 'transfer', 'sale', 'adjustment'].map(function (k) { return '<button data-act="ltype" data-v="' + k + '" aria-pressed="' + (t === k) + '">' + MV[k] + 's</button>'; }).join('') + '</div>' +
      '<label class="field" style="min-width:220px"><span class="vh">Item</span><select class="select" data-in="lsku"><option value="">All items</option>' + E.items().map(function (s) { return '<option value="' + s.sku + '"' + (s.sku === sku ? ' selected' : '') + '>' + s.sku + ' · ' + esc(s.name) + '</option>'; }).join('') + '</select></label></div>';
    h += '<section class="panel"><div class="scroll-x"><table class="tbl" id="ledger"><thead><tr><th>When</th><th>Type</th><th class="hide-m">Reference</th><th>Item</th><th class="hide-m">Location</th><th class="num">Qty</th><th class="num hide-m">Unit cost</th><th class="num hide-m">Value</th><th class="num">Balance</th><th class="num hide-m">Item value</th></tr></thead><tbody>' +
      shown.map(function (m) {
        return '<tr data-mv="' + m.id + '"><td class="muted" style="white-space:nowrap">' + when(m.t, true) + '</td><td>' + mv(m.type) + '</td><td class="hide-m"><span class="mono">' + esc(m.ref) + '</span>' + (m.note ? '<div class="faint" style="font-size:11.5px;white-space:nowrap;max-width:220px;overflow:hidden;text-overflow:ellipsis">' + esc(m.note) + '</div>' : '') + '</td>' +
          '<td><a href="#/items/' + m.sku + '" style="text-decoration:none">' + itemCell(m.sku, true) + '</a></td><td class="hide-m muted"><span class="mono" style="font-size:11.5px">' + esc(m.bin || m.wh) + '</span></td>' +
          '<td class="num ' + (m.qty < 0 ? 'neg' : 'pos') + '">' + (m.qty > 0 ? '+' : '−') + n(Math.abs(m.qty)) + '</td><td class="num hide-m">' + (m.unit ? inr(m.unit) : '<span class="faint">—</span>') + '</td><td class="num hide-m">' + (m.value ? (m.value < 0 ? '−' : '') + inr(Math.abs(m.value)) : '<span class="faint">—</span>') + '</td><td class="num"><b style="font-weight:500">' + n(m.bal) + '</b></td><td class="num hide-m muted">' + inr(m.val) + '</td></tr>';
      }).join('') + '</tbody></table></div>' + (rows.length > lim ? '<button class="more" data-act="more" data-k="llimit">Show 60 more · ' + n(rows.length - lim) + ' older</button>' : '') + '</section></div>';
    return h;
  };

  /* ---------- purchasing ---------- */
  V.purchasing = function (U) {
    var tab = U.potab || 'open', all = E.pos().slice().reverse(), sel = U.selPO || {};
    var groups = { drafts: all.filter(function (p) { return p.status === 'draft'; }), open: all.filter(function (p) { return p.status === 'approved' || p.status === 'partial'; }), received: all.filter(function (p) { return p.status === 'received'; }), all: all };
    if (!U.potab && groups.drafts.length) tab = 'drafts';
    var list = V.sortRows(U, groups[tab], V.PO_GET), shown = list.slice(0, U.polimit || 40), allOn = shown.length && shown.every(function (p) { return sel[p.id]; });
    var h = '<div class="page"><div class="page-h"><div><h2>Purchase orders</h2><p>Low-stock alerts draft these automatically. Approve, then receive into a bin, in full or in part.</p></div><span class="sp"></span><button class="btn primary" data-act="po-new">' + icon('plus') + 'New PO <span class="kbd hide-m">N</span></button></div>';
    h += '<div class="bar"><div class="seg" role="group" aria-label="Filter">' + [['drafts', 'Drafts'], ['open', 'Open'], ['received', 'Received'], ['all', 'All']].map(function (k) { return '<button data-act="potab" data-v="' + k[0] + '" aria-pressed="' + (tab === k[0]) + '">' + k[1] + ' <span class="c">' + groups[k[0]].length + '</span></button>'; }).join('') + '</div></div>';
    h += '<section class="panel"><div class="scroll-x"><table class="tbl" data-kb><thead><tr><th class="ck"><input type="checkbox" class="chk" data-act="selall" data-k="selPO" aria-label="Select all purchase orders in view"' + (allOn ? ' checked' : '') + '></th><th>PO</th><th>Supplier</th><th class="hide-m">Items</th><th class="num hide-m">Total</th><th class="hide-m">Expected</th><th>Status</th><th class="r"><span class="vh">Action</span></th></tr></thead><tbody>' +
      (shown.length ? shown.map(function (po) {
        return '<tr data-href="#/purchasing/' + po.id + '" data-row' + (U.sel === po.id || sel[po.id] ? ' class="on"' : '') + '><td class="ck"><input type="checkbox" class="chk" data-act="sel" data-k="selPO" data-v="' + po.id + '" aria-label="Select ' + po.id + '"' + (sel[po.id] ? ' checked' : '') + '></td><td><a class="obj" href="#/purchasing/' + po.id + '">' + po.id + '</a>' + (po.auto ? '<div class="faint" style="font-size:11.5px">Auto-drafted</div>' : '') + '</td><td>' + esc(E.supplier(po.supplier).name) + '</td><td class="hide-m"><div style="display:flex;gap:4px;align-items:center">' + po.lines.slice(0, 4).map(function (l) { return thumb(l.sku, 'xs'); }).join('') + '<span class="muted" style="margin-left:4px">' + plural(po.lines.length, 'line') + '</span></div></td><td class="num hide-m">' + inr(E.poTotal(po)) + '</td><td class="hide-m muted">' + (po.status === 'received' ? 'Received ' + whenLc(po.receipts[po.receipts.length - 1].t) : po.eta ? when(po.eta) : po.status === 'draft' ? E.supplier(po.supplier).lead + ' days after approval' : '—') + '</td><td>' + poPill(po) + '</td><td class="r">' +
          (po.status === 'draft' ? '<button class="btn sm primary" data-act="po-approve" data-id="' + po.id + '">Approve</button>' : po.status === 'approved' || po.status === 'partial' ? '<button class="btn sm" data-act="po-receive" data-id="' + po.id + '">Receive</button>' : '') + '</td></tr>';
      }).join('') : '<tr><td colspan="8">' + (tab === 'drafts' ? V.empty('purchasing', 'No drafts', 'When an item drops below its reorder point, a draft PO appears here for one-click approval.') : V.empty('purchasing', 'Nothing here', 'No purchase orders in this view.', '<button class="btn sm" data-act="po-new">New PO</button>')) + '</td></tr>') + '</tbody></table></div>' + (list.length > (U.polimit || 40) ? '<button class="more" data-act="more" data-k="polimit">Show more</button>' : '') + '</section></div>';
    return h;
  };
  V.poSheet = function (id) {
    var po = E.po(id); if (!po) return null;
    var sup = E.supplier(po.supplier), draft = po.status === 'draft', open = po.status === 'approved' || po.status === 'partial';
    var h = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' + poPill(po) + (po.auto ? '<span class="tag">Drafted by low-stock alert</span>' : '') + (po.bill ? '<span class="pill ok">Billed</span>' : '') + '<span class="muted" style="font-size:12.5px">Created ' + when(po.created, true) + '</span></div>';
    if (po.status !== 'cancelled') h += V.stepper4(['Draft', 'Sent', 'Partly received', 'Received'], po.status === 'received' ? 4 : V.poStep(po));
    if (po.bill) h += '<div class="callout ok">' + icon('check', 'sm') + '<div><b>Supplier bill ' + esc(po.bill.no) + '</b><span>' + inr(po.bill.amount) + ' recorded ' + whenLc(po.bill.t) + (Math.abs(po.bill.amount - E.receivedValue(po)) > 1 ? ' · differs from received value ' + inr(E.receivedValue(po)) : ' · matches what was received') + '</span></div></div>';
    h += '<dl class="kv"><dt>Supplier</dt><dd>' + esc(sup.name) + ', ' + sup.city + '</dd><dt>Deliver to</dt><dd>' + E.wh(po.wh).name + '</dd><dt>Terms</dt><dd>' + sup.terms + ' · lead time ' + sup.lead + ' days</dd><dt>Expected</dt><dd>' + (po.eta ? when(po.eta) : 'On approval + ' + sup.lead + ' days') + '</dd></dl>';
    h += '<div><h3>Lines</h3><div class="boxed scroll-x"><table class="tbl"><thead><tr><th>Item</th><th class="num">Ordered</th><th class="num">Received</th><th class="num">Unit cost</th><th class="num">Total</th></tr></thead><tbody>' +
      po.lines.map(function (l) {
        var it = E.item(l.sku);
        return '<tr><td>' + itemCell(l.sku, true) + (draft ? '<div class="faint" style="font-size:11.5px;margin:2px 0 0 32px">Available ' + n(E.available(l.sku)) + ' · reorder at ' + n(E.rop(l.sku)) + '</div>' : '') + '</td><td class="num">' + (draft ? '<label><span class="vh">Quantity in ' + it.buy.unit + 's</span><input class="input num" style="width:76px;height:30px" type="number" min="0" inputmode="numeric" data-in="poline" data-id="' + po.id + '" data-sku="' + l.sku + '" value="' + l.pq + '"></label>' + (it.buy.per > 1 ? '<div class="faint" style="font-size:11.5px">' + it.buy.unit + 's of ' + it.buy.per + '</div>' : '') : buyLabel(it, l.pq)) + '</td>' +
          '<td class="num">' + (l.recv >= l.pq ? '<span class="pos">' + n(l.recv) + ' ✓</span>' : n(l.recv)) + '</td><td class="num">' + inr(l.cost) + '</td><td class="num">' + inr(l.pq * it.buy.per * l.cost) + '</td></tr>';
      }).join('') + '<tr><td colspan="4" class="r muted">Total</td><td class="num"><b style="font-weight:600">' + inr(E.poTotal(po)) + '</b></td></tr></tbody></table></div></div>';
    if (po.receipts.length) h += '<div><h3>Goods receipts ' + tip('receipt', 'goods receipt') + '</h3><ul class="list boxed">' + po.receipts.map(function (g) { return '<li><span class="mv receipt"><b>' + icon('receipt') + '</b></span><div class="grow"><div class="t mono">' + g.id + '</div><div class="s">' + g.lines.map(function (x) { return n(x.units) + ' × ' + esc(E.item(x.sku).name) + ' → <span class="mono">' + x.bin + '</span>'; }).join('<br>') + '</div></div><span class="faint" style="font-size:12px">' + when(g.t, true) + '</span></li>'; }).join('') + '</ul></div>';
    return { title: '<span class="mono">' + po.id + '</span>', body: h,
      foot: (draft || open ? '<button class="btn ghost danger" data-act="po-cancel" data-id="' + po.id + '">' + (draft ? 'Discard draft' : 'Cancel PO') + '</button>' : '') + ((po.status === 'received' || po.status === 'partial') && !po.bill ? '<button class="btn" data-act="po-bill" data-id="' + po.id + '">Record supplier bill</button>' : '') + (draft ? '<button class="btn primary" data-act="po-approve" data-id="' + po.id + '">Approve and send</button>' : open ? '<button class="btn primary" data-act="po-receive" data-id="' + po.id + '">' + icon('receipt') + 'Receive goods</button>' : '') };
  };

  /* ---------- sales ---------- */
  V.sales = function (U) {
    var all = E.sos().slice().reverse(), wh = U.wh, sel = U.selSO || {};
    if (wh) all = all.filter(function (s) { return s.wh === wh; });
    var groups = { open: all.filter(function (s) { return s.status === 'reserved'; }), picking: all.filter(function (s) { return s.status === 'picking'; }), ready: all.filter(function (s) { return s.status === 'picked'; }), done: all.filter(function (s) { return s.status === 'dispatched'; }), crm: all.filter(function (s) { return s.source === 'crm'; }) };
    var tab = U.sotab || 'open', list = V.sortRows(U, groups[tab] || all, V.SO_GET), shown = list.slice(0, U.solimit || 40), allOn = shown.length && shown.every(function (s) { return sel[s.id]; });
    var h = '<div class="page"><div class="page-h"><div><h2>Pick and pack</h2><p>Every customer order, from reserved to dispatched. Orders won in Lumen CRM arrive already reserved.</p></div><span class="sp"></span><button class="btn" data-act="sim-deal">' + icon('bolt') + 'New order from a won deal</button></div>';
    h += '<div class="bar"><div class="seg scroll-x" role="group" aria-label="Filter">' + [['open', 'To pick'], ['picking', 'Picking'], ['ready', 'Ready to dispatch'], ['done', 'Dispatched'], ['crm', 'From CRM']].map(function (k) { return '<button data-act="sotab" data-v="' + k[0] + '" aria-pressed="' + (tab === k[0]) + '">' + k[1] + ' <span class="c">' + groups[k[0]].length + '</span></button>'; }).join('') + '</div></div>';
    h += '<section class="panel"><div class="scroll-x"><table class="tbl" data-kb><thead><tr><th class="ck"><input type="checkbox" class="chk" data-act="selall" data-k="selSO" aria-label="Select all orders in view"' + (allOn ? ' checked' : '') + '></th><th>Order</th><th>Customer</th><th class="hide-m">Items</th><th class="num hide-m">Value</th><th class="hide-m">Ship from</th><th>Status</th><th class="r hide-m">Next</th></tr></thead><tbody>' +
      (shown.length ? shown.map(function (so) {
        var next = so.status === 'reserved' ? (E.shortfall(so) ? '<a class="btn sm" href="#/sales/' + so.id + '">Resolve</a>' : '<button class="btn sm" data-act="so-pick" data-id="' + so.id + '">Start picking</button>') : so.status === 'picking' ? '<a class="btn sm" href="#/pick/' + so.id + '">Continue pick</a>' : so.status === 'picked' ? '<button class="btn sm primary" data-act="so-dispatch" data-id="' + so.id + '">Dispatch</button>' : soSteps(so);
        return '<tr data-href="#/sales/' + so.id + '" data-row' + (U.sel === so.id || sel[so.id] ? ' class="on"' : '') + '><td class="ck"><input type="checkbox" class="chk" data-act="sel" data-k="selSO" data-v="' + so.id + '" aria-label="Select ' + so.id + '"' + (sel[so.id] ? ' checked' : '') + '></td><td><a class="obj" href="#/sales/' + so.id + '">' + so.id + '</a><div class="faint" style="font-size:11.5px">' + when(so.created) + '</div></td><td><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' + esc(so.customer) + (so.source === 'crm' ? crm() : '') + '</div></td><td class="hide-m"><div style="display:flex;gap:4px;align-items:center">' + so.lines.slice(0, 4).map(function (l) { return thumb(l.sku, 'xs'); }).join('') + '<span class="muted" style="margin-left:4px">' + plural(so.lines.length, 'line') + '</span></div></td><td class="num hide-m">' + inr(soValue(so)) + '</td><td class="hide-m muted">' + whName(so.wh) + '</td><td>' + soPill(so) + '</td><td class="r hide-m">' + next + '</td></tr>';
      }).join('') : '<tr><td colspan="8">' + V.empty('sales', tab === 'ready' ? 'Nothing staged' : 'Nothing here', tab === 'ready' ? 'Orders appear here once every line is picked.' : 'No orders in this view.') + '</td></tr>') + '</tbody></table></div>' + (list.length > (U.solimit || 40) ? '<button class="more" data-act="more" data-k="solimit">Show more</button>' : '') + '</section></div>';
    return h;
  };
  V.soSheet = function (id) {
    var so = E.so(id); if (!so) return null;
    var steps = ['reserved', 'picking', 'picked', 'dispatched'], si = steps.indexOf(so.status), short = E.shortfall(so);
    var h = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' + soPill(so) + (so.source === 'crm' ? crm() : '') + '<span class="muted" style="font-size:12.5px">' + esc(so.customer) + ' · ships from ' + E.wh(so.wh).name + ' · ' + inr(soValue(so)) + '</span></div>';
    if (so.note) h += '<div class="callout">' + icon('alert', 'sm') + '<div><b>Note from sales</b><span>' + esc(so.note) + '</span></div></div>';
    if (so.status === 'cancelled' && so.cancelNote) h += '<div class="callout">' + icon('alert', 'sm') + '<div><b>Cancelled</b><span>' + esc(so.cancelNote) + '. Its stock was released.</span></div></div>';
    if (so.status !== 'cancelled') h += V.stepper4(['Reserved', 'Picking', 'Picked', 'Dispatched'], so.status === 'dispatched' ? 4 : si);
    if (false) h += '<div class="track">' + [['Reserved', so.created], ['Picking', so.pickAt], ['Picked', so.status === 'picked' || so.status === 'dispatched' ? (so.pick || []).reduce(function (a, p) { return Math.max(a, p.at || 0); }, 0) : null], ['Dispatched', so.dispatchedAt]].map(function (s, i) { return '<div class="' + (i < si || si === 3 ? 'on' : i === si ? 'now' : '') + '"><b>' + s[0] + '</b>' + (s[1] && i <= si ? when(s[1]) : '&nbsp;') + '</div>'; }).join('') + '</div>';
    if (so.source === 'crm') h += '<div class="muted" style="font-size:12.5px">' + esc(so.ref || 'Lumen CRM deal') + (so.wonAt ? ' · won ' + whenLc(so.wonAt) : '') + '. Availability is written back to the CRM after every change.</div>';
    // lines
    h += '<div><h3>Lines</h3><div class="boxed scroll-x"><table class="tbl"><thead><tr><th>Item</th><th class="num">Ordered</th><th class="num">' + (so.status === 'dispatched' ? 'Shipped' : 'Reserved') + '</th><th class="num hide-m">Price</th></tr></thead><tbody>' +
      so.lines.map(function (l) {
        var it = E.item(l.sku), gap = l.qty - l.res - l.picked;
        var other = so.wh === 'BHW' ? 'BLR' : 'BHW', there = Math.max(0, E.available(l.sku, other));
        return '<tr><td>' + itemCell(l.sku, true) + (so.status === 'reserved' && gap > 0 ? '<div style="font-size:11.5px;margin:3px 0 0 32px;color:var(--low)">' + n(gap) + ' on backorder ' + tip('backorder', 'backorder') + (there ? ' · ' + n(there) + ' free at ' + E.wh(other).short : '') + (E.onOrder(l.sku) ? ' · ' + n(E.onOrder(l.sku)) + ' on order' : '') + '</div>' : '') + '</td><td class="num">' + uom(it, l.qty) + '</td><td class="num">' + (so.status === 'dispatched' ? n(l.picked) : n(l.res)) + '</td><td class="num hide-m">' + inr(it.price * l.qty) + '</td></tr>';
      }).join('') + '<tr class="hide-m"><td colspan="3" class="r muted">Order value</td><td class="num"><b style="font-weight:600">' + inr(soValue(so)) + '</b></td></tr></tbody></table></div></div>';
    // pick list
    if (so.pick && so.status !== 'dispatched') {
      var done = so.pick.filter(function (p) { return p.done; }).length;
      h += '<div><h3>Pick list · walk order <span class="faint">· ' + done + ' of ' + so.pick.length + ' picked</span></h3><div class="boxed"><ul class="list">' + so.pick.map(function (p, i) {
        return '<li><input type="checkbox" class="chk" id="pk-' + i + '" data-act="pickline" data-id="' + so.id + '" data-i="' + i + '"' + (p.done ? ' checked' : '') + '><label for="pk-' + i + '" class="grow" style="cursor:pointer"><div class="t"><span class="mono">' + p.bin + '</span><span style="font-weight:400">' + esc(E.item(p.sku).name) + '</span></div><div class="s mono">' + p.sku + '</div></label><b class="num" style="font-weight:500">× ' + n(p.qty) + '</b></li>';
      }).join('') + '</ul></div><p class="faint" style="font-size:12px;margin:8px 0 0">Tick each line here, or walk it bin by bin in <a href="#/pick/' + so.id + '" style="color:var(--accent-ink)">pick mode</a> and scan each label.</p></div>';
    }
    if (so.status === 'dispatched') {
      h += '<div class="minis" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div><span>Revenue</span><b>' + inrS(so.revenue) + '</b></div><div><span>Cost of goods ' + tip('cogs', 'cost of goods') + '</span><b>' + inrS(so.cogs) + '</b></div><div><span>Gross margin</span><b>' + (so.revenue ? ((so.revenue - so.cogs) / so.revenue * 100).toFixed(1) : '0') + '%</b></div></div>';
      var sns = []; so.pick.forEach(function (p) { if (p.sn) sns = sns.concat(p.sn); });
      if (sns.length) h += '<div><h3>Serial numbers shipped ' + tip('serial', 'serial number') + '</h3><div class="sn-list">' + sns.map(function (x) { return '<span class="skup">' + x + '</span>'; }).join(' ') + '</div></div>';
      h += '<dl class="kv"><dt>Waybill</dt><dd class="mono">' + so.waybill + '</dd><dt>Dispatched</dt><dd>' + when(so.dispatchedAt, true) + '</dd><dt>Picked from</dt><dd class="mono" style="font-size:12px">' + so.pick.map(function (p) { return p.bin; }).filter(function (b, i, a) { return a.indexOf(b) === i; }).join(', ') + '</dd></dl>';
    }
    var f = '';
    if (so.status === 'reserved') {
      f += '<button class="btn ghost danger" data-act="so-cancel" data-id="' + so.id + '">Cancel order</button>';
      if (short > 0) {
        var other = so.wh === 'BHW' ? 'BLR' : 'BHW', can = so.lines.some(function (l) { return l.qty - l.res > 0 && E.available(l.sku, other) > 0; });
        if (can) f += '<button class="btn" data-act="so-transfer" data-id="' + so.id + '">' + icon('transfer') + 'Transfer from ' + E.wh(other).short + '</button>';
        if (so.lines.some(function (l) { return l.res > 0; })) f += '<button class="btn" data-act="so-split" data-id="' + so.id + '">Pick what\'s reserved</button>';
      } else f += '<button class="btn primary" data-act="so-pick" data-id="' + so.id + '">Start picking</button>';
    }
    if (so.status === 'picking') f += '<button class="btn" data-act="print-pick" data-id="' + so.id + '">' + icon('print') + 'Print</button><a class="btn" href="#/pick/' + so.id + '">' + icon('scan') + 'Continue in pick mode</a><button class="btn primary" data-act="so-pickall" data-id="' + so.id + '">Mark all picked</button>';
    if (so.status === 'picked') f += '<button class="btn" data-act="print-pick" data-id="' + so.id + '">' + icon('print') + 'Print pick list</button>';
    if (so.status === 'picked') f += '<button class="btn primary" data-act="so-dispatch" data-id="' + so.id + '">' + icon('sales') + 'Dispatch</button>';
    return { title: '<span class="mono">' + so.id + '</span>', body: h, foot: f };
  };

  /* ---------- scan ---------- */
  V.scan = function (U) {
    var so = U.scanSO && E.so(U.scanSO), supported = 'BarcodeDetector' in window;
    var h = '<div class="page"><div class="page-h"><div><h2>Scan</h2><p>Point the camera at a Stockroom label: an item, a bin or an order. ' + (so ? 'Scanning items picks them for <span class="mono">' + so.id + '</span>.' : '') + '</p></div></div>';
    h += '<div class="scan"><div class="scol"><div class="cam s1" id="cam"><div class="msg">' + icon('camera') +
      (supported ? '<span>Reads Code 128 and QR labels with your camera. Video never leaves this device.</span><button class="btn accent big" data-act="cam-start">' + icon('camera') + 'Start camera</button>' : '<b>Camera scanning isn\'t available here</b><span>This browser has no built-in barcode reader (Safari on iPhone, Firefox). Type the code below, or use a USB or Bluetooth scanner: it types into the same box.</span>') + '</div></div>' +
      '<form class="bar s2" data-form="scan"><label class="search" style="flex:1"><span class="vh">Code</span>' + icon('scan') + '<input class="input" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Type a code: HS-LT-014, BHW-A-01 or SO-2201" id="scan-in"></label><button class="btn primary" type="submit">Look up</button></form>' +
      '<div class="s4"><h3 style="font-size:12px;font-weight:500;color:var(--ink-2);margin:6px 0 8px">No label handy? Try one of these' + (supported ? ' (decoded by the same detector)' : '') + '</h3><div class="samples" id="samples">' +
      (so && so.pick ? so.pick.filter(function (p) { return !p.done; }).slice(0, 3).map(function (p) { return p.sku; }) : ['HS-LT-014', 'HS-CH-001', 'BHW-B-02']).concat(so ? [] : ['SO-' + (E.sos().filter(function (s) { return s.status === 'picking'; })[0] || E.sos()[0]).id.slice(3)]).map(function (c) { return '<button type="button" data-act="scan-sample" data-code="' + c + '" aria-label="Scan sample label ' + c + '"><canvas data-bc="' + c + '" data-nolabel width="240" height="70"></canvas>' + c + '</button>'; }).join('') + '</div></div></div>';
    h += '<div class="scol"><section class="panel s3" id="scan-result">' + (U.scanHit ? V.scanResult(U.scanHit, U) : '<header><h2>Result</h2></header>' + V.empty('scan', 'Ready to scan', 'Items, bins and orders open here as soon as a label is read.')) + '</section>' +
      (so ? '<section class="panel s3"><header><h2>Picking <span class="mono">' + so.id + '</span></h2><span class="sp"></span>' + soPill(so) + '</header><ul class="list">' + (so.pick || []).map(function (p) { return '<li><span class="mv ' + (p.done ? 'receipt' : 'transfer') + '"><b>' + icon(p.done ? 'check' : 'box') + '</b></span><div class="grow"><div class="t"><span class="mono">' + p.bin + '</span> ' + esc(E.item(p.sku).name) + '</div></div><b class="num">× ' + p.qty + '</b></li>'; }).join('') + '</ul>' + (so.status === 'picked' ? '<div class="pad"><button class="btn primary" data-act="so-dispatch" data-id="' + so.id + '">Dispatch ' + so.id + '</button></div>' : '') + '</section>' : '') +
      '<section class="panel s5"><header><h2>History</h2></header><ul class="list">' + ((U.scans || []).length ? U.scans.slice(0, 6).map(function (s) { return '<li><span class="mono grow">' + esc(s.code) + '</span><span class="faint" style="font-size:12px">' + esc(s.kind) + ' · ' + when(s.t) + '</span></li>'; }).join('') : '<li class="empty">No scans yet.</li>') + '</ul></section></div></div></div>';
    return h;
  };
  V.scanResult = function (hit, U) {
    if (hit.kind === 'item') {
      var it = E.item(hit.code);
      return '<header><h2>Item</h2><span class="sp"></span>' + pill(E.status(it.sku)) + '</header><div class="pad" style="display:grid;gap:14px"><div class="it">' + thumb(it.sku, 'lg') + '<span><b style="font-size:15px">' + esc(it.name) + '</b><small>' + it.sku + '</small></span></div>' +
        '<div class="minis"><div><span>On hand</span><b>' + n(E.onHand(it.sku)) + '</b></div><div><span>Reserved</span><b>' + n(E.reserved(it.sku)) + '</b></div><div><span>Available</span><b>' + n(E.available(it.sku)) + '</b></div><div><span>Bins</span><b style="font-size:13px;font-family:var(--mono)">' + E.binsOf(it.sku).map(function (b) { return b.bin.slice(4) + (b.bin.indexOf('BLR') === 0 ? '·H' : ''); }).join(' ') + '</b></div></div>' +
        (hit.picked ? '<div class="pill ok" style="height:28px;justify-self:start">Picked × ' + hit.picked + ' for ' + hit.so + '</div>' : hit.miss ? '<div class="pill low" style="height:28px;justify-self:start">' + esc(hit.miss) + '</div>' : '') +
        '<div class="bar"><a class="btn" href="#/items/' + it.sku + '">Open item</a><button class="btn" data-act="adjust" data-sku="' + it.sku + '">Adjust</button><button class="btn" data-act="label" data-sku="' + it.sku + '">Label</button></div></div>';
    }
    if (hit.kind === 'bin') return '<header><h2>Bin <span class="mono">' + hit.code + '</span></h2><span class="sp"></span><a class="btn sm" href="#/locations/' + hit.code + '">Open on floor plan</a></header>' + V.binPanel(hit.code).replace(/^<header>[\s\S]*?<\/header>/, '');
    if (hit.kind === 'so') { var so = E.so(hit.code); return '<header><h2>Order <span class="mono">' + so.id + '</span></h2><span class="sp"></span>' + soPill(so) + '</header><div class="pad" style="display:grid;gap:10px"><div>' + esc(so.customer) + ' ' + (so.source === 'crm' ? crm() : '') + '</div><div class="bar"><a class="btn primary" href="#/sales/' + so.id + '">Open order</a>' + (so.status === 'picking' ? '<a class="btn" href="#/scan?so=' + so.id + '">Pick by scanning</a>' : '') + '</div></div>'; }
    if (hit.kind === 'po') { var po = E.po(hit.code); return '<header><h2>Purchase order <span class="mono">' + po.id + '</span></h2><span class="sp"></span>' + poPill(po) + '</header><div class="pad bar"><a class="btn primary" href="#/purchasing/' + po.id + '">Open</a>' + (po.status === 'approved' || po.status === 'partial' ? '<button class="btn" data-act="po-receive" data-id="' + po.id + '">Receive</button>' : '') + '</div>'; }
    return '<header><h2>Not found</h2></header><div class="empty">No item, bin or order matches <span class="mono">' + esc(hit.code) + '</span>.</div>';
  };

  /* ---------- labels ---------- */
  V.labels = function (U) {
    var mode = U.lblMode || 'items', sel = U.lblSel || {};
    var h = '<div class="page"><div class="page-h"><div><h2>Labels</h2><p>Code 128 barcodes, drawn in your browser. Print on 62 × 29 mm label stock or plain A4.</p></div><span class="sp"></span><button class="btn primary" data-act="print">' + icon('print') + 'Print ' + Object.keys(sel).filter(function (k) { return sel[k]; }).length + '</button></div>';
    h += '<div class="bar"><div class="seg" role="group" aria-label="Label type"><button data-act="lblmode" data-v="items" aria-pressed="' + (mode === 'items') + '">Items</button><button data-act="lblmode" data-v="bins" aria-pressed="' + (mode === 'bins') + '">Bins</button></div><button class="btn sm ghost" data-act="lblall">Select all</button><button class="btn sm ghost" data-act="lblnone">Clear</button></div>';
    var codes = mode === 'items' ? E.items().map(function (s) { return s.sku; }) : E.bins(U.wh || 'BHW').map(function (b) { return b.id; });
    h += '<div class="grid2"><section class="panel"><header><h2>' + (mode === 'items' ? 'Items' : 'Bins at ' + E.wh(U.wh || 'BHW').name) + '</h2></header><ul class="list" style="max-height:620px;overflow:auto">' + codes.map(function (c) {
      return '<li style="min-height:48px;padding:6px 16px"><input type="checkbox" class="chk" id="lb-' + c + '" data-act="lbl" data-code="' + c + '"' + (sel[c] ? ' checked' : '') + '><label for="lb-' + c + '" class="grow" style="cursor:pointer">' + (mode === 'items' ? itemCell(c, true) : '<span class="mono">' + c + '</span> <span class="faint">' + zoneName(c.split('-')[1]) + '</span>') + '</label></li>';
    }).join('') + '</ul></section>';
    var chosen = codes.filter(function (c) { return sel[c]; });
    h += '<section class="panel"><header><h2>Preview</h2><span class="sp"></span><span class="faint" style="font-size:12px">' + plural(chosen.length, 'label') + '</span></header><div class="pad"><div class="labels" id="label-sheet">' + (chosen.length ? chosen.map(labelHTML).join('') : '<div class="empty">Select items or bins to preview their labels.</div>') + '</div></div></section></div>';
    return h + '</div>';
  };
  function labelHTML(c) {
    var it = E.item(c);
    if (it) return '<div class="label"><div class="b"><span>Halden Supply</span><span>' + it.category + '</span></div><div class="n">' + esc(it.name) + '</div><div class="v">' + esc(Object.keys(it.variant).map(function (k) { return it.variant[k]; }).join(' · ')) + ' · bin ' + it.bin + '</div><canvas data-bc="' + c + '" width="300" height="80" role="img" aria-label="Barcode ' + c + '"></canvas></div>';
    return '<div class="label"><div class="b"><span>Halden Supply</span><span>Bin</span></div><div class="n mono" style="font-size:20px">' + c + '</div><div class="v">' + E.wh(c.slice(0, 3)).name + ' · ' + zoneName(c.split('-')[1]) + '</div><canvas data-bc="' + c + '" width="300" height="80" role="img" aria-label="Barcode ' + c + '"></canvas></div>';
  }
  V.labelHTML = labelHTML;

  /* ---------- reports ---------- */
  V.reports = function (U) {
    var wh = U.wh, total = E.totalValue(wh), mode = U.chart || 'units';
    var cats = {}; E.items().forEach(function (s) { cats[s.category] = (cats[s.category] || 0) + E.value(s.sku, wh); });
    var catMax = Math.max.apply(null, Object.keys(cats).map(function (k) { return cats[k]; }));
    var h = '<div class="page"><div class="page-h"><div><h2>Reports</h2><p>Valued at FIFO cost · ' + (wh ? E.wh(wh).name : 'both warehouses') + '</p></div></div>';
    h += '<div class="grid2"><section class="panel"><header><h2>Receipts vs dispatches · 12 weeks</h2><span class="sp"></span><div class="seg" role="group" aria-label="Measure"><button data-act="chart" data-v="units" aria-pressed="' + (mode === 'units') + '">Units</button><button data-act="chart" data-v="value" aria-pressed="' + (mode === 'value') + '">Value</button></div></header><div class="pad"><div class="legend" style="margin-bottom:8px"><span><i style="background:var(--ink)"></i>Received</span><span><i style="background:var(--accent)"></i>Dispatched</span></div>' + V.weeklyChart(mode, 12) + '</div></section>';
    h += '<section class="panel"><header><h2>Stock value</h2><span class="sp"></span><b class="num" style="font-weight:600">' + inr(total) + '</b></header><div class="pad">' +
      (wh ? '' : E.warehouses().map(function (w) { var v = E.totalValue(w.id); return '<div class="hbar"><span>' + w.short + '</span><span class="meter"><i style="width:' + (v / total * 100) + '%;background:var(--ink)"></i></span><span class="num">' + inrS(v) + '</span></div>'; }).join('') + '<hr style="border:0;border-top:1px solid var(--rule);margin:8px 0">') +
      Object.keys(cats).sort(function (a, b) { return cats[b] - cats[a]; }).map(function (k) { return '<div class="hbar"><span>' + k + '</span><span class="meter"><i style="width:' + (cats[k] / catMax * 100) + '%"></i></span><span class="num">' + inrS(cats[k]) + '</span></div>'; }).join('') + '</div></section></div>';
    // slow movers
    var slow = E.items().map(function (s) {
      var st = E.salesStats(s.sku, 60), oh = E.onHand(s.sku, wh), rate = st.q / 60;
      return { s: s, sold: st.q, last: st.last, oh: oh, cover: rate ? oh / rate : Infinity, val: E.value(s.sku, wh) };
    }).filter(function (x) { return x.oh > 0; }).sort(function (a, b) { return b.cover - a.cover; }).slice(0, 6);
    h += '<div class="grid2 even"><section class="panel"><header><h2>Slow movers</h2><span class="sp"></span><span class="faint" style="font-size:12px">Days of cover at the 60-day sales rate</span></header><div class="scroll-x"><table class="tbl"><thead><tr><th>Item</th><th class="num">On hand</th><th class="num hide-m">Sold, 60 d</th><th class="num">Cover</th><th class="num hide-m">Tied up</th></tr></thead><tbody>' +
      slow.map(function (x) { return '<tr data-href="#/items/' + x.s.sku + '"><td>' + itemCell(x.s.sku, true) + '<div class="faint" style="font-size:11.5px;margin-left:32px">Last sale ' + (x.last ? whenLc(x.last) : 'never') + '</div></td><td class="num">' + n(x.oh) + '</td><td class="num hide-m">' + n(x.sold) + '</td><td class="num"><b style="font-weight:500">' + (x.cover === Infinity ? '∞' : n(x.cover) + ' d') + '</b></td><td class="num hide-m">' + inrS(x.val) + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
    // stock-outs
    var outs = E.stockouts().slice(0, 8), since = Date.now() - 30 * 864e5, lost = {};
    E.lost().forEach(function (l) { if (l.t >= since) lost[l.sku] = (lost[l.sku] || 0) + l.q; });
    var lostList = Object.keys(lost).sort(function (a, b) { return lost[b] - lost[a]; }).slice(0, 4);
    h += '<section class="panel"><header><h2>Stock-outs</h2><span class="sp"></span><span class="faint" style="font-size:12px">A warehouse ran out</span></header><ul class="list">' +
      (outs.length ? outs.map(function (o) { var d = Math.max(1, Math.round(((o.to || Date.now()) - o.from) / 864e5)); return '<li data-href="#/items/' + o.sku + '"><div class="grow">' + itemCell(o.sku, true) + '</div><span class="muted num" style="font-size:12.5px">' + (o.wh ? whName(o.wh) + ' · ' : '') + day(o.from) + ' → ' + (o.to ? day(o.to) : 'now') + '</span>' + (o.to ? '<span class="pill plain">' + plural(d, 'day') + '</span>' : '<span class="pill out">Out now</span>') + '</li>'; }).join('') : '<li class="empty">No stock-outs in the last 90 days.</li>') + '</ul>' +
      (lostList.length ? '<div class="pad" style="border-top:1px solid var(--rule)"><h3 style="font-size:12px;font-weight:500;color:var(--ink-2);margin:0 0 8px">Demand we couldn\'t fill, last 30 days</h3>' + lostList.map(function (k) { return '<div class="hbar" style="grid-template-columns:1fr auto"><span>' + esc(E.item(k).name) + '</span><span class="num neg" style="color:var(--out)">' + n(lost[k]) + ' units · ' + inrS(lost[k] * E.item(k).price) + '</span></div>'; }).join('') + '</div>' : '') + '</section></div>';
    return h + '</div>';
  };

  /* ---------- pick mode (phone-first, one bin at a time) ---------- */
  V.pickIndex = function (so, skipped) {
    if (!so || !so.pick) return -1;
    skipped = skipped || {};
    for (var i = 0; i < so.pick.length; i++) if (!so.pick[i].done && !skipped[i]) return i;
    for (i = 0; i < so.pick.length; i++) if (!so.pick[i].done) return i;
    return -1;
  };
  V.pick = function (U) {
    var so = E.so(U.pickId);
    if (!so) return '<div class="page">' + V.empty('sales', 'Order not found', 'It may have been dispatched or cancelled.', '<a class="btn sm" href="#/sales">Sales orders</a>') + '</div>';
    var done = so.pick ? so.pick.filter(function (p) { return p.done; }).length : 0, total = so.pick ? so.pick.length : 0;
    var h = '<div class="page pickmode"><div class="pk-h"><a class="ibtn" href="#/sales/' + so.id + '" aria-label="Back to the order">' + icon('left') + '</a><div class="grow"><b class="mono">' + so.id + '</b><span>' + esc(so.customer) + ' · ' + E.wh(so.wh).short + '</span></div>' + (so.source === 'crm' ? crm() : '') + '<span class="pk-count num">' + done + '/' + total + '</span></div>' +
      '<div class="pk-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + done + '" aria-label="Lines picked"><i style="width:' + (total ? done / total * 100 : 0) + '%"></i></div>';
    if (so.status === 'reserved') {
      return h + V.empty('box', 'Not started', E.shortfall(so) ? 'Some lines are backordered. Resolve them on the order first.' : 'Create the pick list to start walking the bins.', E.shortfall(so) ? '<a class="btn primary" href="#/sales/' + so.id + '">Open order</a>' : '<button class="btn primary" data-act="so-pick" data-id="' + so.id + '">Start picking</button>') + '</div>';
    }
    if (so.status === 'dispatched') return h + V.empty('check', 'Dispatched', 'Waybill ' + so.waybill + ' · ' + when(so.dispatchedAt) + '.', '<a class="btn" href="#/sales">Back to orders</a>') + '</div>';
    var i = V.pickIndex(so, U.pkSkip);
    if (i < 0) {
      h += '<div class="pk-done"><span class="eic ok">' + icon('check') + '</span><b>All ' + plural(total, 'line') + ' picked</b><span>Staged for dispatch from ' + E.wh(so.wh).name + '.</span><div class="pk-actions"><button class="btn primary big" data-act="so-dispatch" data-id="' + so.id + '">' + icon('sales') + 'Dispatch ' + so.id + '</button><button class="btn big" data-act="print-pick" data-id="' + so.id + '">' + icon('print') + 'Print pick list</button></div></div>';
    } else {
      var p = so.pick[i], it = E.item(p.sku), z = p.bin.split('-')[1];
      h += '<section class="pk-now" aria-live="polite"><div class="pk-bin"><span>Go to</span><b class="mono">' + p.bin + '</b><small>' + E.wh(p.bin.slice(0, 3)).short + ' · zone ' + z + ' · ' + zoneName(z).toLowerCase() + '</small></div>' +
        '<div class="pk-item"><img src="' + it.photo + '" alt="' + esc(it.name) + '" width="88" height="88"><div class="grow"><b>' + esc(it.name) + '</b><span class="mono">' + it.sku + '</span><span class="faint">' + esc(Object.keys(it.variant).map(function (k) { return it.variant[k]; }).join(' · ')) + '</span></div><div class="pk-qty num">× ' + p.qty + '<small>' + it.uom + '</small></div></div>' +
        '<div class="cam pk-cam" id="cam"><div class="msg">' + ('BarcodeDetector' in window ? '<span>Scan the item label to confirm the pick.</span><button class="btn accent" data-act="cam-start">' + icon('camera') + 'Scan label</button>' : '<span>Camera scanning isn\'t available on this device. Type the SKU below, or confirm by hand.</span>') + '</div></div>' +
        '<form class="pk-type" data-form="scan"><label class="search grow"><span class="vh">Item code</span>' + icon('scan') + '<input class="input" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Or type the SKU, e.g. ' + it.sku + '" id="scan-in"></label><button class="btn" type="submit">Check</button></form>' +
        (U.pkMsg ? '<div class="pk-msg ' + U.pkMsg.k + '" role="status">' + esc(U.pkMsg.t) + '</div>' : '') +
        '<div class="pk-actions"><button class="btn primary big" data-act="pk-confirm" data-id="' + so.id + '" data-i="' + i + '">' + icon('check') + 'Picked ' + p.qty + '</button><button class="btn big" data-act="pk-skip" data-i="' + i + '">Skip for now</button></div></section>';
    }
    h += '<section class="panel"><header><h2>Pick list · walk order</h2><span class="sp"></span><button class="btn sm ghost" data-act="print-pick" data-id="' + so.id + '">' + icon('print') + 'Print</button></header><ul class="list">' + so.pick.map(function (q, k) {
      return '<li class="' + (k === i ? 'cur' : '') + '"><input type="checkbox" class="chk" id="pm-' + k + '" data-act="pickline" data-id="' + so.id + '" data-i="' + k + '"' + (q.done ? ' checked' : '') + '><label for="pm-' + k + '" class="grow" style="cursor:pointer"><div class="t"><span class="mono">' + q.bin + '</span><span style="font-weight:400' + (q.done ? ';text-decoration:line-through;color:var(--ink-3)' : '') + '">' + esc(E.item(q.sku).name) + '</span></div></label><b class="num">× ' + q.qty + '</b></li>';
    }).join('') + '</ul></section></div>';
    return h;
  };

  /* ---------- printable pick list ---------- */
  V.pickPrint = function (so) {
    var rows = (so.pick || so.lines.map(function (l) { return { sku: l.sku, bin: E.primaryBin(l.sku, so.wh), qty: l.res || l.qty }; }));
    return '<article class="pp-sheet"><header><div><div class="pp-brand">Halden Supply · Stockroom</div><h1>Pick list ' + so.id + '</h1><div>' + esc(so.customer) + (so.source === 'crm' ? ' · from Lumen CRM' : '') + '</div><div>' + E.wh(so.wh).name + ' · printed ' + when(Date.now(), true) + '</div></div><canvas data-bc="' + so.id + '" width="300" height="80" role="img" aria-label="Barcode ' + so.id + '"></canvas></header>' +
      '<table><thead><tr><th>#</th><th>Bin</th><th>Item</th><th>SKU</th><th class="r">Qty</th><th>Picked</th></tr></thead><tbody>' +
      rows.map(function (p, k) { var it = E.item(p.sku); return '<tr><td>' + (k + 1) + '</td><td class="mono b">' + p.bin + '</td><td>' + esc(it.name) + '<div class="v">' + esc(Object.keys(it.variant).map(function (x) { return it.variant[x]; }).join(' · ')) + '</div></td><td><canvas data-bc="' + p.sku + '" width="200" height="50" role="img" aria-label="Barcode ' + p.sku + '"></canvas></td><td class="r b">' + p.qty + ' ' + it.uom + '</td><td><span class="box"></span></td></tr>'; }).join('') +
      '</tbody></table><footer><span>Picked by ____________________</span><span>Checked by ____________________</span><span>Cartons ______</span></footer></article>';
  };

  /* ---------- keyboard shortcuts ---------- */
  V.shortcuts = function () {
    var g = [['Anywhere', [['⌘ K', 'Command palette'], ['/', 'Search'], ['?', 'This list'], ['W', 'Cycle warehouse'], ['⌘ Z', 'Undo last change'], ['Esc', 'Close panel']]],
      ['Go to', [['G O', 'Overview'], ['G I', 'Items'], ['G L', 'Locations'], ['G D', 'Stock ledger'], ['G S', 'Sales orders'], ['G P', 'Purchase orders'], ['G C', 'Scan'], ['G B', 'Labels'], ['G R', 'Reports']]],
      ['Lists', [['J  K', 'Next / previous row'], ['↵', 'Open row'], ['X', 'Select row'], ['E', 'Edit reorder point (items)'], ['N', 'New purchase order']]]];
    return '<div class="keys">' + g.map(function (s) { return '<section><h3>' + s[0] + '</h3><dl>' + s[1].map(function (k) { return '<dt>' + k[0].split(' ').filter(Boolean).map(function (x) { return '<span class="kbd">' + x + '</span>'; }).join(' ') + '</dt><dd>' + k[1] + '</dd>'; }).join('') + '</dl></section>'; }).join('') + '</div>';
  };

  /* ======================= v3: easy to understand ======================= */

  /* ---------- jargon, explained in place ---------- */
  var TIPS = {
    available: 'What you can still promise to a customer: stock on the shelf minus what is already reserved for orders.',
    onhand: 'Everything physically on the shelves, including stock already reserved for orders.',
    reserved: 'Held for open orders, so the same piece can’t be promised twice.',
    rop: 'We warn you, and draft a purchase order, when available stock drops to this number.',
    onorder: 'On its way from suppliers on purchase orders that have been sent.',
    fifo: 'First in, first out: the oldest stock ships first, so its purchase price is what we count as the cost of goods.',
    bin: 'A numbered shelf or rack slot. BHW-A-03 means Bhiwandi, zone A, slot 3.',
    backorder: 'The part of an order we couldn’t reserve yet. It fills itself when new stock arrives.',
    batch: 'Stock that arrived together on one delivery, so any piece can be traced back to its supplier and date.',
    serial: 'A unique number for each high-value piece, recorded when it arrives and again when it ships.',
    picklist: 'The bins to visit, in walking order, to collect everything on an order.',
    cogs: 'What the dispatched stock cost us to buy, worked out first in, first out.',
    receipt: 'The record that a delivery arrived and was put away on a shelf.',
    cyclecount: 'Counting a few bins every day instead of closing the warehouse for one big stocktake.',
    value: 'What the stock on hand cost to buy, oldest purchase prices first.'
  };
  var tipN = 0;
  var tip = V.tip = function (k, label) {
    var id = 'tip-' + k + '-' + (++tipN);
    return '<span class="tipw"><button type="button" class="tip" aria-label="What does ' + esc(label || k) + ' mean?" aria-describedby="' + id + '">?</button><span class="tipb" role="tooltip" id="' + id + '">' + TIPS[k] + '</span></span>';
  };

  /* ---------- illustrated empty states ---------- */
  var ILLO = {
    done: '<rect x="20" y="30" width="56" height="34" rx="4" fill="var(--accent-soft)" stroke="var(--accent)"/><path d="M20 38h56" stroke="var(--accent)"/><path d="M38 50l7 7 13-14" stroke="var(--accent)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="82" cy="18" r="3" fill="var(--accent)"/><circle cx="14" cy="22" r="2" fill="var(--ink-3)"/>',
    shelf: '<path d="M14 26h68M14 46h68M14 66h68M18 18v52M78 18v52" stroke="var(--ink-3)" stroke-width="2"/><rect x="26" y="32" width="14" height="14" rx="2" fill="var(--accent-soft)" stroke="var(--accent)"/><rect x="44" y="52" width="18" height="14" rx="2" fill="var(--paper-2)" stroke="var(--ink-3)" stroke-dasharray="3 3"/>',
    truck: '<rect x="12" y="28" width="44" height="28" rx="3" fill="var(--accent-soft)" stroke="var(--accent)"/><path d="M56 36h14l10 10v10H56z" fill="var(--sheet)" stroke="var(--accent)"/><circle cx="26" cy="60" r="6" fill="var(--sheet)" stroke="var(--ink)" stroke-width="2"/><circle cx="70" cy="60" r="6" fill="var(--sheet)" stroke="var(--ink)" stroke-width="2"/><path d="M4 70h88" stroke="var(--ink-3)" stroke-dasharray="4 4"/>',
    clipboard: '<rect x="26" y="16" width="44" height="56" rx="4" fill="var(--sheet)" stroke="var(--ink-3)" stroke-width="2"/><rect x="38" y="12" width="20" height="9" rx="2" fill="var(--accent-soft)" stroke="var(--accent)"/><path d="M34 34h28M34 44h28M34 54h18" stroke="var(--ink-3)" stroke-width="2" stroke-linecap="round"/>',
    scan: '<path d="M20 30v-8h8M68 22h8v8M76 58v8h-8M28 66h-8v-8" stroke="var(--ink)" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M32 32v24M37 32v24M43 32v24M47 32v24M53 32v24M58 32v24M63 32v24" stroke="var(--ink-3)" stroke-width="2"/><path d="M24 44h48" stroke="var(--accent)" stroke-width="2.5"/>',
    search: '<circle cx="42" cy="40" r="18" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2.5"/><path d="M55 53l14 14" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/><path d="M35 40h14" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/>'
  };
  var ILLOMAP = { check: 'done', box: 'shelf', sales: 'truck', purchasing: 'clipboard', scan: 'scan', search: 'search', link: 'truck' };
  V.empty = function (ic, title, text, action) {
    var il = ILLO[ILLOMAP[ic] || ic] || ILLO.shelf;
    return '<div class="empty2"><svg class="illo" viewBox="0 0 96 80" aria-hidden="true" fill="none">' + il + '</svg><b>' + esc(title) + '</b><span>' + text + '</span>' + (action || '') + '</div>';
  };

  /* ---------- small building blocks ---------- */
  function chipSO(id) { return '<a class="obj" href="#/sales/' + id + '">' + icon('sales', 'sm') + id + '</a>'; }
  function chipPO(id) { return '<a class="obj" href="#/purchasing/' + id + '">' + icon('purchasing', 'sm') + id + '</a>'; }
  function chipBin(b) { return '<a class="obj bin-c" href="#/locations/' + b + '">' + b + '</a>'; }
  V.chipSO = chipSO; V.chipPO = chipPO; V.chipBin = chipBin;
  function mins(m) { return m < 1 ? '< 1 m' : m < 60 ? '≈ ' + Math.round(m) + ' m' : '≈ ' + Math.floor(m / 60) + ' h ' + Math.round(m % 60) + ' m'; }
  function meter(done, total, tone) { var p = total ? Math.round(done / total * 100) : 0; return '<span class="meter2' + (tone ? ' ' + tone : '') + '" role="img" aria-label="' + done + ' of ' + total + ' done"><i style="width:' + p + '%"></i></span>'; }
  function stepper4(steps, cur) {
    return '<ol class="stepper4" aria-label="Status">' + steps.map(function (s, i) { return '<li class="' + (i < cur ? 'done' : i === cur ? 'now' : '') + '"' + (i === cur ? ' aria-current="step"' : '') + '><span class="dotn">' + (i < cur ? icon('check', 'sm') : i + 1) + '</span>' + s + '</li>'; }).join('') + '</ol>';
  }
  V.stepper4 = stepper4;
  V.poStep = function (po) { return { draft: 0, approved: 1, partial: 2, received: 3, cancelled: -1 }[po.status]; };
  var openSOs = function () { return E.sos().filter(function (s) { return s.status === 'reserved' || s.status === 'picking' || s.status === 'picked'; }); };

  /* ---------- Today: what to do next, in plain language ---------- */
  V.todayTasks = function (U) {
    var today = new Date(); today.setHours(23, 59, 59, 999);
    var sos = openSOs(), toPick = sos.filter(function (s) { return (s.status === 'reserved' && !E.shortfall(s)) || s.status === 'picking'; });
    var ready = sos.filter(function (s) { return s.status === 'picked'; }), short = sos.filter(function (s) { return s.status === 'reserved' && E.shortfall(s) > 0; });
    var crmWait = sos.filter(function (s) { return s.source === 'crm' && s.status === 'reserved'; });
    var openPO = E.pos().filter(function (p) { return p.status === 'approved' || p.status === 'partial'; });
    var late = openPO.filter(function (p) { return p.eta && p.eta < Date.now() - 12 * 36e5; }), arriving = openPO.filter(function (p) { return p.eta && p.eta <= today.getTime() + 864e5 && late.indexOf(p) < 0; });
    var drafts = E.pos().filter(function (p) { return p.status === 'draft'; }), low = E.lowItems();
    var flagged = E.bins().filter(function (b) { return E.countFlag(b.id); }), plan = E.countPlan('BHW', 8);
    var lines = 0; toPick.forEach(function (s) { lines += (s.pick ? s.pick.filter(function (p) { return !p.done; }).length : s.lines.length); });
    var next = toPick.filter(function (s) { return s.status === 'picking'; })[0] || toPick[0];
    var T = [];
    if (toPick.length) T.push({ k: 'pick', ic: 'box', t: plural(toPick.length, 'order') + ' to pick', s: (next ? next.id + ' for ' + esc(next.customer) + ' is next' : '') + ' · ' + plural(lines, 'line') + ' in all', time: mins(lines * 1.5), btn: 'Start picking', href: '#/pick/' + (next && next.id), tone: 'acc' });
    if (ready.length) T.push({ k: 'ship', ic: 'sales', t: plural(ready.length, 'order') + ' packed and ready to go', s: 'Everything is picked. Dispatch to hand them to the courier.', time: mins(ready.length * 2), btn: 'Dispatch', href: '#/sales?tab=ready' });
    if (late.length) T.push({ k: 'late', ic: 'alert', t: plural(late.length, 'delivery', 'deliveries') + ' running late', s: late.map(function (p) { return esc(E.supplier(p.supplier).name); }).join(', ') + ' · was due ' + whenLc(late[0].eta), btn: 'Receive anyway', href: '#/receive/' + late[0].id, tone: 'out' });
    var arr = arriving.filter(function (p) { return late.indexOf(p) < 0; });
    if (arr.length) T.push({ k: 'recv', ic: 'receipt', t: plural(arr.length, 'delivery', 'deliveries') + ' arriving', s: arr.map(function (p) { return esc(E.supplier(p.supplier).name) + ' ' + whenLc(p.eta); }).join(' · '), time: mins(arr.length * 8), btn: 'Receive', href: '#/receive/' + arr[0].id });
    if (low.length) T.push({ k: 'low', ic: 'alert', t: plural(low.length, 'item') + ' running low', s: drafts.length ? plural(drafts.length, 'draft order') + ' ready: review and send with one click' : 'Create a purchase order to top them up', btn: drafts.length ? 'Review draft orders' : 'See low stock', href: drafts.length ? '#/purchasing?tab=drafts' : '#/items?status=low', tone: 'low' });
    if (crmWait.length) T.push({ k: 'crm', ic: 'link', t: plural(crmWait.length, 'order') + ' from Lumen CRM waiting', s: crmWait.map(function (s) { return esc(s.customer); }).join(', ') + (crmWait.some(function (s) { return E.shortfall(s); }) ? ' · some stock is short' : ' · stock already reserved'), btn: 'Open', href: '#/sales/' + crmWait[0].id, crm: true });
    else if (short.length) T.push({ k: 'short', ic: 'alert', t: plural(short.length, 'order') + ' short of stock', s: 'Move stock from the other warehouse, or ship what we have.', btn: 'Resolve', href: '#/sales/' + short[0].id, tone: 'low' });
    if (flagged.length) T.push({ k: 'recount', ic: 'scan', t: plural(flagged.length, 'bin') + ' need a recount', s: 'A pick came up short at ' + flagged.map(function (b) { return b.id; }).join(', ') + '. Count it so the numbers stay honest.', time: mins(flagged.length * 2), btn: 'Count now', href: '#/count' });
    else if (plan.length) T.push({ k: 'count', ic: 'scan', t: plural(plan.length, 'bin') + ' due for a count', s: 'Counting a few bins a day keeps stock accurate without a shutdown.', time: mins(plan.length * 1.5), btn: 'Start count', href: '#/count' });
    var role = V.me && V.me().key;
    if (role === 'farah') T = T.filter(function (t) { return ['pick', 'ship', 'recount', 'count'].indexOf(t.k) < 0; });
    if (role === 'arjun') T = T.filter(function (t) { return t.k !== 'low'; });
    return { list: T, toPick: toPick, ready: ready, arriving: arriving, late: late, drafts: drafts, low: low, plan: plan, flagged: flagged, next: next, lines: lines, openPO: openPO };
  };
  V.overview = function (U) {
    var wh = U.wh, d = new Date(), X = V.todayTasks(U), value = E.totalValue(wh), range = U.range || 30;
    var vs = valueSeries(range, wh), delta = vs[vs.length - 1] - vs[0], pct = vs[0] ? delta / vs[0] * 100 : 0;
    var h = '<div class="page today"><div class="page-h"><div><div class="eyebrow2">Today · ' + ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()] + ' ' + day(d) + '</div><h2>' + greet() + ', Meera</h2><p>' + (X.list.length ? 'Here’s what needs doing at Halden Supply, most urgent first.' : 'Nothing needs you right now.') + '</p></div><span class="sp"></span>' +
      '<button class="btn" data-act="tour">' + icon('bolt') + 'Take the tour</button><button class="btn primary" data-act="flow">Try the full flow ' + icon('right', 'sm') + '</button></div>';
    // warehouse actions: big, tappable, always here
    h += '<nav class="bigacts" aria-label="Warehouse actions">' +
      '<a href="#/scan" class="ba ba-scan">' + icon('scan') + '<b>Scan</b><span>Any label</span></a>' +
      '<a href="#/receive' + (X.openPO[0] ? '/' + (X.late[0] || X.arriving[0] || X.openPO[0]).id : '') + '" class="ba">' + icon('receipt') + '<b>Receive</b><span>' + plural(X.openPO.length, 'delivery', 'deliveries') + ' open</span></a>' +
      '<a href="#/pick/' + (X.next ? X.next.id : '') + '" class="ba">' + icon('box') + '<b>Pick</b><span>' + plural(X.toPick.length, 'order') + ' waiting</span></a>' +
      '<a href="#/count" class="ba">' + icon('ledger') + '<b>Count</b><span>' + plural(X.plan.length, 'bin') + ' planned</span></a></nav>';
    // to do: work cards
    h += '<section class="todo" aria-labelledby="todo-h"><header class="sec-h2"><h3 id="todo-h">To do</h3><span class="faint">' + plural(X.list.length, 'thing') + '</span></header>';
    h += X.list.length ? '<ul class="tasks">' + X.list.map(function (t) {
      return '<li class="task ' + (t.tone || '') + '"><span class="tic">' + icon(t.ic) + '</span><div class="grow"><b>' + t.t + (t.crm ? ' ' + crm() : '') + '</b><span>' + t.s + '</span></div>' + (t.time ? '<span class="tchip">' + t.time + '</span>' : '') + '<a class="btn ' + (t.tone === 'acc' || t.k === 'pick' ? 'primary' : '') + '" href="' + t.href + '">' + t.btn + '</a></li>';
    }).join('') + '</ul>' : V.empty('check', 'All done for today', 'New orders from Lumen CRM and deliveries will appear here as they come in.');
    h += '</section>';
    // queues
    var pickDone = 0, pickAll = 0; X.toPick.concat(X.ready).forEach(function (s) { (s.pick || s.lines).forEach(function (p) { pickAll++; if (p.done || s.status === 'picked') pickDone++; }); });
    var rcvDone = 0, rcvAll = 0; X.openPO.forEach(function (p) { p.lines.forEach(function (l) { rcvAll += l.pq; rcvDone += l.recv; }); });
    var counted = 0, since = new Date().setHours(0, 0, 0, 0); E.bins('BHW').forEach(function (b) { if (E.lastCounted(b.id) >= since) counted++; });
    var Q = [
      { n: 'Pick and pack', s: 'Every open order, walk order', a: 'Auto', done: pickDone, all: pickAll, due: 'Today', st: X.toPick.length ? 'active' : 'clear', href: '#/pick/' + (X.next ? X.next.id : '') },
      { n: 'Receiving', s: 'Sent purchase orders', a: 'Dock team', done: rcvDone, all: rcvAll, due: X.late.length ? 'Overdue' : 'This week', st: X.late.length ? 'late' : 'active', href: '#/receive/' + ((X.late[0] || X.arriving[0] || X.openPO[0]) || {}).id },
      { n: 'Cycle count · Bhiwandi', s: 'Flagged bins first, then the oldest counts', a: 'Meera', done: counted, all: counted + X.plan.length, due: 'Today', st: X.flagged.length ? 'flagged' : 'active', href: '#/count' },
      { n: 'Reorder review', s: 'Drafts raised by low-stock alerts', a: 'Auto', done: 0, all: X.drafts.length, due: X.drafts.length ? 'Today' : '—', st: X.drafts.length ? 'active' : 'clear', href: '#/purchasing?tab=drafts' }
    ];
    h += '<section aria-labelledby="q-h"><header class="sec-h2"><h3 id="q-h">Queues</h3>' + tip('picklist', 'queue') + '</header><div class="scroll-x"><table class="tbl queues"><thead><tr><th>Queue</th><th class="hide-m">Owner</th><th>Progress</th><th class="hide-m">Due</th><th class="hide-m">Status</th><th class="r"><span class="vh">Start</span></th></tr></thead><tbody>' +
      Q.map(function (q) {
        return '<tr data-href="' + q.href + '"><td><b class="qn">' + q.n + '</b><div class="faint qs">' + q.s + '</div></td><td class="hide-m muted">' + q.a + '</td><td><div class="qp">' + meter(q.done, q.all, q.st === 'late' ? 'out' : '') + '<span class="num faint">' + q.done + '/' + q.all + '</span></div></td><td class="hide-m"><span class="pill plain ' + (q.due === 'Overdue' ? 'out' : '') + '">' + q.due + '</span></td><td class="hide-m"><span class="pill ' + ({ active: 'acc', clear: 'ok', late: 'out', flagged: 'low' })[q.st] + '">' + ({ active: 'Active', clear: 'Clear', late: 'Late', flagged: 'Flagged' })[q.st] + '</span></td><td class="r"><a class="btn sm play" href="' + q.href + '" aria-label="Start ' + q.n + '">' + icon('right', 'sm') + 'Play</a></td></tr>';
      }).join('') + '</tbody></table></div></section>';
    // at a glance
    h += '<section aria-labelledby="g-h"><header class="sec-h2"><h3 id="g-h">At a glance</h3><span class="sp"></span><div class="seg" role="group" aria-label="Range"><button data-act="range" data-v="30" aria-pressed="' + (range === 30) + '">30D</button><button data-act="range" data-v="90" aria-pressed="' + (range === 90) + '">90D</button></div></header>' +
      '<div class="hero2 flat"><div class="hv"><div class="k2">Stock value ' + tip('value', 'stock value') + '</div><div class="big num" id="hv-num">' + inr(value) + '</div><div class="hv-sub"><span class="chip ' + (delta >= 0 ? 'up' : 'dn') + '">' + (delta >= 0 ? '▲' : '▼') + ' ' + Math.abs(pct).toFixed(1) + '%</span><span class="muted" id="hv-when">' + (delta >= 0 ? '+' : '−') + inrS(Math.abs(delta)).replace('−', '') + ' in ' + range + ' days</span></div>' +
      '<div class="area-wrap">' + areaChart(vs, 'hv-area') + '<div class="area-x"><span>' + day(Date.now() - (range - 1) * 864e5) + '</span><span>Today</span></div></div></div>' +
      '<div class="acct"><div class="k2">Where it sits</div><ul class="list">' + E.warehouses().map(function (w) { var v = E.totalValue(w.id), u = 0; E.items().forEach(function (s) { u += E.onHand(s.sku, w.id); }); return '<li data-href="#/locations"><span class="wh-ic">' + w.id + '</span><div class="grow"><div class="t">' + w.name + '</div><div class="s">' + n(u) + ' units on the shelves</div></div><b class="num">' + inrS(v) + '</b></li>'; }).join('') +
      '<li data-href="#/purchasing?tab=open"><span class="wh-ic in">' + icon('receipt', 'sm') + '</span><div class="grow"><div class="t">On its way</div><div class="s">' + plural(X.openPO.length, 'open purchase order') + '</div></div><b class="num">' + inrS(E.pos().reduce(function (a, p) { return a + (p.status === 'approved' || p.status === 'partial' ? E.poTotal(p) - E.receivedValue(p) : 0); }, 0)) + '</b></li></ul></div></div></section>';
    // lumen
    var crmSOs = E.sos().filter(function (s) { return s.source === 'crm'; }).sort(function (a, b) { return b.created - a.created; }).slice(0, 4), deals = E.bridgeDeals();
    h += '<section aria-labelledby="crm-h"><header class="sec-h2"><h3 id="crm-h">From Lumen CRM</h3><span class="faint">' + (deals.length ? deals.length + ' won deals read' : 'Listening for won deals') + '</span><span class="sp"></span><button class="btn sm" data-act="sim-deal">' + icon('bolt') + 'Add a won deal</button></header><ul class="list">' +
      (crmSOs.length ? crmSOs.map(function (so) { var units = 0, res = 0; so.lines.forEach(function (l) { units += l.qty; res += Math.min(l.res + l.picked, l.qty); }); return '<li data-href="#/sales/' + so.id + '"><div class="grow"><div class="t">' + esc(so.customer) + ' ' + chipSO(so.id) + '</div><div class="s">' + (so.status === 'dispatched' ? 'Dispatched ' + whenLc(so.dispatchedAt) : n(res) + ' of ' + n(units) + ' units reserved') + '</div></div>' + soPill(so) + '</li>'; }).join('') : '<li>' + V.empty('truck', 'No won deals yet', 'Mark a deal Won in Lumen CRM and it lands here, already reserved.') + '</li>') + '</ul></section>';
    return h + '</div>';
  };
  function greet() { var hh = new Date().getHours(); return hh < 12 ? 'Good morning' : hh < 17 ? 'Good afternoon' : 'Good evening'; }

  /* ---------- items: essentials first, cards or table, more detail on request ---------- */
  V.itemRows = function (U) {
    var wh = U.wh, rows = itemMatches(U), sel = U.selItems || {}, more = !!U.detail;
    if (!rows.length) return '<tr><td colspan="12">' + V.empty('search', 'No items match', 'Try another category or clear the search.', '<button class="btn sm" data-act="clear-filters">Clear filters</button>') + '</td></tr>';
    return rows.map(function (s) {
      var oh = E.onHand(s.sku, wh), rs = E.reserved(s.sku, wh), av = oh - rs, crmR = E.reservedCRM(s.sku), editing = U.editRop === s.sku, bin = E.binsOf(s.sku, wh || 'BHW')[0];
      return '<tr data-href="#/items/' + s.sku + '" data-sku="' + s.sku + '" data-row' + (U.sel === s.sku || sel[s.sku] ? ' class="on"' : '') + '><td class="ck"><input type="checkbox" class="chk" data-act="sel" data-k="selItems" data-v="' + s.sku + '" aria-label="Select ' + esc(s.name) + '"' + (sel[s.sku] ? ' checked' : '') + '></td>' +
        '<td><div class="it"><img class="thumb" src="' + s.thumb + '" alt="" loading="lazy" decoding="async" width="32" height="32"><span><b><a href="#/items/' + s.sku + '">' + esc(s.name) + '</a></b><small><span class="skup">' + s.sku + '</span>' + (s.serial ? '<span class="skup sn">Serial</span>' : '') + '</small></span></div></td>' +
        (more ? '<td class="hide-m muted">' + s.category + '</td>' : '') +
        '<td class="hide-m">' + (bin ? '<span class="obj bin-c">' + bin.bin + '</span>' : '<span class="faint">—</span>') + '</td>' +
        (more ? '<td class="num hide-m">' + n(oh) + '</td><td class="num hide-m">' + (rs ? n(rs) + (crmR ? ' <span class="crm" title="' + n(crmR) + ' reserved from Lumen CRM deals"><i aria-hidden="true"></i>' + n(crmR) + '</span>' : '') : '<span class="faint">—</span>') + '</td>' : '') +
        '<td class="num"><b class="avail">' + n(av) + '</b></td>' +
        '<td class="num hide-m">' + (editing ? '<input class="input num inl-in" data-in="rop" data-sku="' + s.sku + '" type="number" min="0" inputmode="numeric" value="' + E.rop(s.sku) + '" aria-label="Reorder point for ' + esc(s.name) + '">' : '<button class="inl" data-act="inl-rop" data-sku="' + s.sku + '" title="Edit (press E)">' + n(E.rop(s.sku)) + '</button>') + '</td>' +
        (more ? '<td class="num hide-m">' + (E.onOrder(s.sku) ? n(E.onOrder(s.sku)) : '<span class="faint">—</span>') + '</td><td class="num hide-m">' + inrS(E.value(s.sku, wh)) + '</td>' : '') +
        '<td>' + pill(E.status(s.sku)) + '</td>' +
        '<td class="ra hide-m"><span class="racts"><button class="ibtn" data-act="qadj" data-sku="' + s.sku + '" data-d="-1" aria-label="Remove one ' + esc(s.name) + '" title="Remove one">−</button><button class="ibtn" data-act="qadj" data-sku="' + s.sku + '" data-d="1" aria-label="Add one ' + esc(s.name) + '" title="Add one">+</button><button class="ibtn" data-act="transfer" data-sku="' + s.sku + '" aria-label="Move ' + esc(s.name) + '" title="Move">' + icon('transfer', 'sm') + '</button><button class="ibtn" data-act="label" data-sku="' + s.sku + '" aria-label="Label for ' + esc(s.name) + '" title="Print label">' + icon('labels', 'sm') + '</button></span></td></tr>';
    }).join('');
  };
  V.itemCards = function (U) {
    var wh = U.wh, rows = itemMatches(U);
    if (!rows.length) return V.empty('search', 'No items match', 'Try another category or clear the search.', '<button class="btn sm" data-act="clear-filters">Clear filters</button>');
    return '<ul class="cards">' + rows.map(function (s) {
      var av = E.available(s.sku, wh), st = E.status(s.sku), bin = E.binsOf(s.sku, wh || 'BHW')[0];
      return '<li class="icard" data-sku="' + s.sku + '"><a class="ic-img" href="#/items/' + s.sku + '" aria-label="' + esc(s.name) + '"><img src="' + s.photo + '" alt="" loading="lazy" decoding="async" width="320" height="320"></a>' +
        '<div class="ic-b"><a class="ic-n" href="#/items/' + s.sku + '">' + esc(s.name) + '</a><div class="ic-c"><span class="skup">' + s.sku + '</span>' + (bin ? '<span class="obj bin-c">' + bin.bin + '</span>' : '') + '</div>' +
        '<div class="ic-q"><div><b class="num">' + n(av) + '</b><span>available</span></div>' + pill(st) + '</div>' +
        '<div class="ic-a"><button class="qb" data-act="qadj" data-sku="' + s.sku + '" data-d="-1" aria-label="Remove one ' + esc(s.name) + '">−</button><span class="muted">Adjust</span><button class="qb" data-act="qadj" data-sku="' + s.sku + '" data-d="1" aria-label="Add one ' + esc(s.name) + '">+</button></div></div></li>';
    }).join('') + '</ul>';
  };
  V.items = function (U) {
    var counts = { low: 0, out: 0 }; E.items().forEach(function (s) { var st = E.status(s.sku); if (st !== 'ok') counts.low++; if (st === 'out') counts.out++; });
    var views = U.views || [], rows = itemMatches(U), sel = U.selItems || {}, allOn = rows.length && rows.every(function (s) { return sel[s.sku]; });
    var mode = U.itemView || (window.innerWidth < 860 ? 'cards' : 'table'), more = !!U.detail;
    var cur = JSON.stringify([U.q || '', U.cat || '', U.status || '']);
    var h = '<div class="page"><div class="page-h"><div><h2>Items</h2><p>20 products ' + (U.wh ? 'at ' + E.wh(U.wh).name : 'across both warehouses') + '. <b>Available</b> ' + tip('available', 'available') + ' is what you can still promise.</p></div><span class="sp"></span>' +
      '<div class="seg" role="group" aria-label="Layout"><button data-act="itemview" data-v="cards" aria-pressed="' + (mode === 'cards') + '">Cards</button><button data-act="itemview" data-v="table" aria-pressed="' + (mode === 'table') + '">Table</button></div>' +
      (mode === 'table' ? '<button class="btn" data-act="detail" aria-pressed="' + more + '">' + (more ? 'Less detail' : 'More detail') + '</button>' : '') + '<button class="btn hide-m" data-act="export-items">Export CSV</button></div>';
    h += '<div class="views" role="group" aria-label="Saved views"><button data-act="view" data-i="-1" aria-pressed="' + (cur === '["","",""]') + '">All items</button>' +
      views.map(function (v, i) { var on = JSON.stringify([v.q || '', v.cat || '', v.status || '']) === cur; return '<span class="vchip"><button data-act="view" data-i="' + i + '" aria-pressed="' + on + '">' + esc(v.name) + '</button>' + (v.custom ? '<button class="vx" data-act="view-del" data-i="' + i + '" aria-label="Delete view ' + esc(v.name) + '">' + icon('x', 'sm') + '</button>' : '') + '</span>'; }).join('') +
      (cur !== '["","",""]' && !views.some(function (v) { return JSON.stringify([v.q || '', v.cat || '', v.status || '']) === cur; }) ? '<button class="vsave" data-act="view-save">' + icon('plus', 'sm') + 'Save view</button>' : '') + '</div>';
    h += '<div class="bar"><label class="search" style="width:min(320px,100%)"><span class="vh">Search items</span>' + icon('search') + '<input class="input" type="search" placeholder="Search name, SKU, supplier" data-in="q" value="' + esc(U.q || '') + '"></label>' +
      '<div class="seg scroll-x" role="group" aria-label="Category"><button data-act="cat" data-v="" aria-pressed="' + !U.cat + '">All</button>' + CATS.map(function (c) { return '<button data-act="cat" data-v="' + c + '" aria-pressed="' + (U.cat === c) + '">' + c + '</button>'; }).join('') + '</div><span class="sp"></span>' +
      '<div class="seg" role="group" aria-label="Stock status"><button data-act="status" data-v="" aria-pressed="' + !U.status + '">Any</button><button data-act="status" data-v="low" aria-pressed="' + (U.status === 'low') + '">Running low <span class="c">' + counts.low + '</span></button><button data-act="status" data-v="out" aria-pressed="' + (U.status === 'out') + '">Out <span class="c">' + counts.out + '</span></button></div></div>';
    if (mode === 'cards') return h + '<div id="item-rows">' + V.itemCards(U) + '</div></div>';
    h += '<section class="panel"><div class="scroll-x"><table class="tbl" data-kb><thead><tr><th class="ck"><input type="checkbox" class="chk" data-act="selall" data-k="selItems" aria-label="Select all items in view"' + (allOn ? ' checked' : '') + '></th><th>Item</th>' + (more ? '<th class="hide-m">Category</th>' : '') + '<th class="hide-m">Bin ' + tip('bin', 'bin') + '</th>' +
      (more ? '<th class="num hide-m">On hand ' + tip('onhand', 'on hand') + '</th><th class="num hide-m">Reserved ' + tip('reserved', 'reserved') + '</th>' : '') + '<th class="num">Available</th><th class="num hide-m">Reorder at ' + tip('rop', 'reorder point') + '</th>' +
      (more ? '<th class="num hide-m">On order ' + tip('onorder', 'on order') + '</th><th class="num hide-m">Value ' + tip('value', 'value') + '</th>' : '') + '<th>Status</th><th class="ra hide-m"><span class="vh">Actions</span></th></tr></thead><tbody id="item-rows">' + V.itemRows(U) + '</tbody></table></div></section>' +
      '<p class="hint hide-m"><span class="kbd">J</span> <span class="kbd">K</span> move · <span class="kbd">X</span> select · <span class="kbd">E</span> edit reorder point · <span class="kbd">↵</span> open · <span class="kbd">?</span> all shortcuts</p></div>';
    return h;
  };

  /* ---------- pick mode as a work card: one line at a time ---------- */
  V.pick = function (U) {
    var so = E.so(U.pickId);
    if (!U.pickId) {
      var nx = V.todayTasks(U).next;
      return '<div class="page">' + V.empty('check', nx ? 'Pick the next order' : 'Nothing to pick', nx ? nx.id + ' for ' + esc(nx.customer) + ' is next in the queue.' : 'Orders appear here once stock is reserved for them.', nx ? '<a class="btn primary" href="#/pick/' + nx.id + '">Start ' + nx.id + '</a>' : '<a class="btn" href="#/sales">All orders</a>') + '</div>';
    }
    if (!so) return '<div class="page">' + V.empty('truck', 'Order not found', 'It may have been dispatched or cancelled.', '<a class="btn sm" href="#/sales">Sales orders</a>') + '</div>';
    var total = so.pick ? so.pick.length : so.lines.length, done = so.pick ? so.pick.filter(function (p) { return p.done; }).length : 0, left = total - done;
    var h = '<div class="page pickmode"><div class="pk-h"><a class="ibtn" href="#/sales/' + so.id + '" aria-label="Pause and go back to the order">' + icon('left') + '</a><div class="grow"><b>' + esc(so.customer) + '</b><span>' + so.id + ' · ' + E.wh(so.wh).short + (so.source === 'crm' ? ' · from Lumen CRM' : '') + '</span></div><span class="tchip">' + (left ? mins(left * 1.5) + ' left' : 'Done') + '</span></div>' +
      '<div class="pk-prog"><span class="num">' + (so.status === 'reserved' ? 'Not started' : 'Item ' + Math.min(done + 1, total) + ' of ' + total) + '</span>' + meter(done, total) + '</div>';
    if (so.note) h += '<div class="callout">' + icon('alert', 'sm') + '<div><b>Note from sales</b><span>' + esc(so.note) + '</span></div></div>';
    if (so.status === 'reserved') return h + V.empty('box', 'Ready to start', E.shortfall(so) ? 'Some lines are short of stock. Resolve them on the order first.' : 'Stockroom will list the bins in walking order. Scan each label as you go.', E.shortfall(so) ? '<a class="btn primary" href="#/sales/' + so.id + '">Open order</a>' : '<button class="btn primary big" data-act="so-pick" data-id="' + so.id + '">Start picking</button>') + '</div>';
    if (so.status === 'dispatched') return h + V.empty('done', 'Dispatched', 'Waybill ' + so.waybill + ' · ' + when(so.dispatchedAt) + '.', '<a class="btn" href="#/overview">Back to Today</a>') + '</div>';
    var i = V.pickIndex(so, U.pkSkip);
    if (i < 0) {
      var nx2 = V.todayTasks(U).toPick.filter(function (s) { return s.id !== so.id; })[0];
      h += '<section class="focus done-f"><span class="eic ok">' + icon('check') + '</span><b>All ' + plural(total, 'line') + ' picked</b><span>Everything for ' + esc(so.customer) + ' is staged at the dispatch bay.</span><div class="pk-actions"><button class="btn primary big" data-act="so-dispatch" data-id="' + so.id + '">' + icon('sales') + 'Dispatch now</button><button class="btn big" data-act="print-pick" data-id="' + so.id + '">' + icon('print') + 'Print pick list</button></div>' +
        (nx2 ? '<a class="nextup" href="#/pick/' + nx2.id + '">Next in queue: <b>' + esc(nx2.customer) + '</b> ' + nx2.id + ' ' + icon('right', 'sm') + '</a>' : '') + '</section>';
    } else {
      var p = so.pick[i], it = E.item(p.sku), z = p.bin.split('-')[1], sh = U.pkShort === i;
      h += '<section class="focus" aria-live="polite"><div class="fx-top"><span class="fx-k">Go to bin</span><b class="fx-bin">' + p.bin + '</b><span class="fx-s">' + E.wh(p.bin.slice(0, 3)).short + ' · zone ' + z + ' · ' + zoneName(z).toLowerCase() + '</span></div>' +
        '<div class="fx-item"><img src="' + it.photo + '" alt="' + esc(it.name) + '" width="88" height="88"><div class="grow"><b>' + esc(it.name) + '</b><span class="skup">' + it.sku + '</span><span class="fx-v">' + esc(Object.keys(it.variant).map(function (k) { return it.variant[k]; }).join(' · ')) + (it.serial ? ' · scan the serial label' : '') + '</span></div><div class="fx-q num">× ' + p.qty + '<small>' + it.uom + '</small></div></div>' +
        (sh ? '<div class="fx-short"><label class="field">How many did you find?<span class="stepper"><button type="button" class="st-btn" data-step="-1" data-for="pk-found" aria-label="Fewer">−</button><input class="input num" id="pk-found" type="number" min="0" max="' + (p.qty - 1) + '" inputmode="numeric" value="' + Math.max(0, p.qty - 1) + '" aria-label="Quantity found"><button type="button" class="st-btn" data-step="1" data-for="pk-found" aria-label="More">+</button></span></label><p class="faint">The rest goes on a backorder, and ' + p.bin + ' is flagged for a recount.</p><div class="pk-actions"><button class="btn primary big" data-act="pk-short-ok" data-id="' + so.id + '" data-i="' + i + '">Save &amp; next</button><button class="btn big" data-act="pk-short-x">Cancel</button></div></div>' :
          '<div class="cam pk-cam" id="cam"><div class="msg">' + ('BarcodeDetector' in window ? '<span>Scan the item label to confirm.</span><button class="btn accent" data-act="cam-start">' + icon('camera') + 'Scan label</button>' : '<span>No camera scanning on this device. Type the code, or confirm by hand.</span>') + '</div></div>' +
          '<form class="pk-type" data-form="scan"><label class="search grow"><span class="vh">Item code</span>' + icon('scan') + '<input class="input" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Or type the code, e.g. ' + it.sku + '" id="scan-in"></label><button class="btn" type="submit">Check</button></form>' +
          (U.pkMsg ? '<div class="pk-msg ' + U.pkMsg.k + '" role="status">' + esc(U.pkMsg.t) + '</div>' : '') +
          '<div class="pk-actions"><button class="btn primary big" data-act="pk-confirm" data-id="' + so.id + '" data-i="' + i + '">' + icon('check') + 'Picked ' + p.qty + ' · Save &amp; next</button></div>' +
          '<div class="outcomes" role="group" aria-label="Something wrong?"><span class="faint">Something wrong?</span><button class="oc" data-act="pk-short" data-i="' + i + '">' + icon('alert', 'sm') + 'Found fewer</button><button class="oc" data-act="pk-dmg" data-id="' + so.id + '" data-i="' + i + '">' + icon('x', 'sm') + 'Damaged</button><button class="oc" data-act="pk-none" data-id="' + so.id + '" data-i="' + i + '">' + icon('box', 'sm') + 'Bin empty</button><button class="oc" data-act="pk-skip" data-i="' + i + '">' + icon('right', 'sm') + 'Skip for now</button></div>') + '</section>';
    }
    h += '<section><header class="sec-h2"><h3>Pick list ' + tip('picklist', 'pick list') + '</h3><span class="sp"></span><button class="btn sm ghost" data-act="print-pick" data-id="' + so.id + '">' + icon('print') + 'Print</button></header><ul class="list">' + so.pick.map(function (q, k) {
      return '<li class="' + (k === i ? 'cur' : '') + '"><input type="checkbox" class="chk" id="pm-' + k + '" data-act="pickline" data-id="' + so.id + '" data-i="' + k + '"' + (q.done ? ' checked' : '') + '><label for="pm-' + k + '" class="grow" style="cursor:pointer"><div class="t"><span class="obj bin-c">' + q.bin + '</span><span style="font-weight:400' + (q.done ? ';text-decoration:line-through;color:var(--ink-3)' : '') + '">' + esc(E.item(q.sku).name) + '</span>' + (q.short ? '<span class="pill low">' + q.short + ' short</span>' : '') + '</div></label><b class="num">× ' + q.qty + '</b></li>';
    }).join('') + '</ul></section></div>';
    return h;
  };

  /* ---------- count mode: bin by bin, then preview the adjustments ---------- */
  V.count = function (U) {
    var C = U.cnt;
    var h = '<div class="page pickmode"><div class="page-h"><div><div class="eyebrow2">Cycle count ' + tip('cyclecount', 'cycle count') + '</div><h2>Count · ' + E.wh(C.wh).name + '</h2><p>Count what’s really in each bin. Stockroom shows what it expects; change the number if the shelf disagrees.</p></div></div>';
    var var_ = 0; Object.keys(C.res).forEach(function (b) { C.res[b].forEach(function (l) { if (l.counted !== l.expected) var_++; }); });
    var doneN = Object.keys(C.res).length, total = C.plan.length;
    h += '<div class="pk-prog"><span class="num">' + (C.step === 'review' ? 'Review' : 'Bin ' + Math.min(C.i + 1, total) + ' of ' + total) + ' · ' + doneN + ' counted · ' + plural(var_, 'difference') + '</span>' + meter(doneN, total, var_ ? 'low' : '') + '<span class="tchip">' + mins((total - doneN) * 1.5) + ' left</span></div>';
    if (!total) return h + V.empty('done', 'Nothing to count', 'Every bin with stock has been counted recently.') + '</div>';
    if (C.step === 'review') {
      var rows = [], val = 0;
      C.plan.forEach(function (b) { (C.res[b] || []).forEach(function (l) { var d = l.counted - l.expected; if (d) { var c = E.lastCost(l.sku); val += d * c; rows.push('<tr><td>' + itemCell(l.sku, true) + '</td><td><span class="obj bin-c">' + b + '</span></td><td class="num">' + l.expected + '</td><td class="num">' + l.counted + '</td><td class="num ' + (d < 0 ? 'neg' : 'pos') + '">' + (d > 0 ? '+' : '−') + Math.abs(d) + '</td><td class="num">' + (d < 0 ? '−' : '+') + inr(Math.abs(d * c)) + '</td></tr>'); } }); });
      h += '<section class="focus light"><div class="prev-h"><b>What applying this count does</b><span>' + doneN + ' bins counted · ' + plural(rows.length, 'adjustment') + ' · stock value ' + (val < 0 ? '−' : '+') + inr(Math.abs(val)) + '</span></div>' +
        (rows.length ? '<div class="boxed scroll-x"><table class="tbl"><thead><tr><th>Item</th><th>Bin</th><th class="num">System</th><th class="num">Counted</th><th class="num">Change</th><th class="num">Value</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' : V.empty('done', 'Everything matched', 'No adjustments needed. The bins are marked as counted today.')) +
        '<div class="pk-actions"><button class="btn primary big" data-act="cnt-apply">' + (rows.length ? 'Apply ' + plural(rows.length, 'adjustment') : 'Mark bins counted') + '</button><button class="btn big" data-act="cnt-back">Back to counting</button></div></section></div>';
      return h;
    }
    var bin = C.plan[C.i], contents = E.binQty(bin), saved = C.res[bin], flag = E.countFlag(bin), last = E.lastCounted(bin);
    h += '<section class="focus light"><div class="fx-top dark"><span class="fx-k">Count bin</span><b class="fx-bin">' + bin + '</b><span class="fx-s">' + zoneName(bin.split('-')[1]) + ' · last counted ' + (last ? whenLc(last) : 'never') + '</span></div>' +
      (flag ? '<div class="callout">' + icon('alert', 'sm') + '<div><b>Flagged for a recount</b><span>A pick came up short here ' + whenLc(flag) + '. Count carefully.</span></div></div>' : '') +
      '<ul class="cnt-l">' + contents.map(function (x) {
        var it = E.item(x.sku), v = saved ? (saved.filter(function (s) { return s.sku === x.sku; })[0] || {}).counted : x.q;
        return '<li><img class="thumb lg" src="' + it.thumb + '" alt="" width="44" height="44"><div class="grow"><b>' + esc(it.name) + '</b><span class="faint">System says ' + x.q + ' ' + it.uom + '</span></div><span class="stepper"><button type="button" class="st-btn" data-step="-1" aria-label="Fewer ' + esc(it.name) + '">−</button><input class="input num" type="number" min="0" inputmode="numeric" data-cnt="' + x.sku + '" data-exp="' + x.q + '" value="' + (v == null ? x.q : v) + '" aria-label="Counted ' + esc(it.name) + '"><button type="button" class="st-btn" data-step="1" aria-label="More ' + esc(it.name) + '">+</button></span></li>';
      }).join('') + '</ul>' +
      '<div class="pk-actions"><button class="btn primary big" data-act="cnt-next">' + icon('check') + 'Save &amp; next bin</button><button class="btn big" data-act="cnt-skip">Skip</button></div></section>';
    h += '<section><header class="sec-h2"><h3>Today’s plan</h3><span class="faint">Flagged bins first, then the oldest counts</span></header><ul class="list">' + C.plan.map(function (b, k) {
      var r = C.res[b], d = r ? r.filter(function (l) { return l.counted !== l.expected; }).length : 0;
      return '<li class="' + (k === C.i ? 'cur' : '') + '"><span class="obj bin-c">' + b + '</span><div class="grow"><div class="s">' + plural(E.binQty(b).length, 'item') + (E.countFlag(b) ? ' · <span style="color:var(--low)">flagged</span>' : '') + '</div></div>' + (r ? (d ? '<span class="pill low">' + plural(d, 'difference') + '</span>' : '<span class="pill ok">Matches</span>') : k === C.i ? '<span class="pill acc">Counting</span>' : '<span class="faint">To do</span>') + '</li>';
    }).join('') + '</ul></section></div>';
    return h;
  };

  /* ---------- receiving as a step flow ---------- */
  var RSTEPS = ['Check delivery', 'Count', 'Put away', 'Confirm'];
  V.receive = function (U) {
    var R = U.rcv, po = R && E.po(R.id);
    if (!po) {
      var open = E.pos().filter(function (p) { return p.status === 'approved' || p.status === 'partial'; }).sort(function (a, b) { return (a.eta || 0) - (b.eta || 0); });
      return '<div class="page"><div class="page-h"><div><div class="eyebrow2">Receive ' + tip('receipt', 'goods receipt') + '</div><h2>Which delivery arrived?</h2><p>Pick the purchase order on the delivery note. Late ones are first.</p></div></div>' +
        (open.length ? '<ul class="tasks">' + open.map(function (p) { var late = p.eta && p.eta < Date.now() - 12 * 36e5; return '<li class="task' + (late ? ' out' : '') + '"><span class="tic">' + icon('receipt') + '</span><div class="grow"><b>' + esc(E.supplier(p.supplier).name) + ' ' + chipPO(p.id) + '</b><span>' + plural(p.lines.length, 'line') + ' · ' + (late ? 'was due ' : 'due ') + whenLc(p.eta) + (p.status === 'partial' ? ' · partly received' : '') + '</span></div><a class="btn primary" href="#/receive/' + p.id + '">Receive</a></li>'; }).join('') + '</ul>' : V.empty('clipboard', 'No deliveries expected', 'Send a purchase order and it will show up here.', '<a class="btn" href="#/purchasing">Purchase orders</a>')) + '</div>';
    }
    if (po.status !== 'approved' && po.status !== 'partial' && R.step < 4) return '<div class="page">' + V.empty('done', 'Already received', po.id + ' has nothing left to receive.', '<a class="btn" href="#/purchasing/' + po.id + '">Open ' + po.id + '</a>') + '</div>';
    var sup = E.supplier(po.supplier), open2 = po.lines.filter(function (l) { return l.recv < l.pq; });
    var h = '<div class="page pickmode"><div class="pk-h"><a class="ibtn" href="#/receive" aria-label="Back to deliveries">' + icon('left') + '</a><div class="grow"><b>' + esc(sup.name) + '</b><span>' + po.id + ' · into ' + E.wh(R.wh).name + '</span></div>' + V.poPill(po) + '</div>';
    if (R.step < 4) h += stepper4(RSTEPS, R.step);
    var body = '';
    if (R.step === 0) {
      body = '<p class="lead2">Check the paperwork matches before you count anything.</p><dl class="kv"><dt>Supplier</dt><dd>' + esc(sup.name) + ', ' + sup.city + '</dd><dt>Purchase order</dt><dd>' + po.id + '</dd><dt>Expected</dt><dd>' + when(po.eta) + '</dd><dt>Lines still open</dt><dd>' + open2.length + ' of ' + po.lines.length + '</dd></dl>' +
        '<label class="field">Delivery note number (optional)<input class="input" id="rc-dn" value="' + esc(R.dn || '') + '" placeholder="e.g. DN-48213" autocomplete="off"></label>' +
        '<label class="checkrow"><input type="checkbox" class="chk" id="rc-dmg"' + (R.dmg ? ' checked' : '') + '> Outer packaging is damaged</label>' +
        '<div class="field">Delivering to<div class="seg" role="group" aria-label="Warehouse">' + E.warehouses().map(function (w) { return '<button type="button" data-act="rc-wh" data-v="' + w.id + '" aria-pressed="' + (R.wh === w.id) + '">' + w.short + '</button>'; }).join('') + '</div></div>';
    }
    if (R.step === 1) {
      body = '<p class="lead2">Count each line as it comes off the truck. Scan a label to add one.</p><form class="pk-type" data-form="rc-scan"><label class="search grow"><span class="vh">Scan to count</span>' + icon('scan') + '<input class="input" name="code" autocomplete="off" autocapitalize="characters" placeholder="Scan or type a SKU to add 1" id="scan-in"></label><button class="btn" type="submit">Add</button></form>' +
        '<div class="rcv-bar"><span class="muted">' + plural(open2.length, 'line') + ' to count</span><button type="button" class="btn sm" data-act="rc-all">Everything arrived</button></div><ul class="cnt-l">' + open2.map(function (l) {
          var it = E.item(l.sku), left = l.pq - l.recv, v = R.q[l.sku] == null ? 0 : R.q[l.sku];
          return '<li><img class="thumb lg" src="' + it.thumb + '" alt="" width="44" height="44"><div class="grow"><b>' + esc(it.name) + '</b><span class="faint">Expected ' + buyLabel(it, left) + '</span></div><span class="stepper"><button type="button" class="st-btn" data-step="-1" aria-label="Fewer">−</button><input class="input num" type="number" min="0" max="' + left + '" inputmode="numeric" data-rq="' + l.sku + '" value="' + v + '" aria-label="Received ' + esc(it.name) + '"><button type="button" class="st-btn" data-step="1" aria-label="More">+</button></span></li>';
        }).join('') + '</ul>';
    }
    if (R.step === 2) {
      var got = open2.filter(function (l) { return R.q[l.sku] > 0; });
      body = '<p class="lead2">Choose a bin for each line. Stockroom suggests the usual one.</p><ul class="cnt-l">' + got.map(function (l) {
        var it = E.item(l.sku), units = R.q[l.sku] * it.buy.per, b = R.bin[l.sku] || E.primaryBin(l.sku, R.wh), inBin = E.binQty(b).reduce(function (a, x) { return a + x.q; }, 0);
        return '<li><img class="thumb lg" src="' + it.thumb + '" alt="" width="44" height="44"><div class="grow"><b>' + esc(it.name) + ' × ' + units + '</b><span class="faint">Batch ' + tip('batch', 'batch') + ' ' + sup.id.slice(4) + '-' + E.state().seq.GR + (it.serial ? ' · ' + units + ' serial numbers ' + tip('serial', 'serial number') + ' will be assigned' : '') + '</span></div><label><span class="vh">Bin for ' + esc(it.name) + '</span><select class="select" data-rb="' + l.sku + '">' + E.bins(R.wh).map(function (x) { return '<option' + (x.id === b ? ' selected' : '') + '>' + x.id + '</option>'; }).join('') + '</select><span class="faint bin-now">' + inBin + ' units in ' + b.slice(4) + ' now</span></label></li>';
      }).join('') + '</ul>';
      if (!got.length) body = V.empty('clipboard', 'Nothing counted yet', 'Go back a step and enter what arrived.');
    }
    if (R.step === 3) {
      var tot = 0, units2 = 0;
      body = '<p class="lead2">Last look before it goes on the shelves.</p><div class="boxed scroll-x"><table class="tbl"><thead><tr><th>Item</th><th class="num">Receiving</th><th>Into bin</th><th class="num">Value</th></tr></thead><tbody>' +
        open2.filter(function (l) { return R.q[l.sku] > 0; }).map(function (l) { var it = E.item(l.sku), u = R.q[l.sku] * it.buy.per; tot += u * l.cost; units2 += u; return '<tr><td>' + itemCell(l.sku, true) + '</td><td class="num">' + u + ' ' + it.uom + '</td><td><span class="obj bin-c">' + (R.bin[l.sku] || E.primaryBin(l.sku, R.wh)) + '</span></td><td class="num">' + inr(u * l.cost) + '</td></tr>'; }).join('') +
        '</tbody></table></div><dl class="kv"><dt>Units</dt><dd>' + units2 + '</dd><dt>Value at cost</dt><dd>' + inr(tot) + '</dd>' + (R.dn ? '<dt>Delivery note</dt><dd class="mono">' + esc(R.dn) + '</dd>' : '') + '</dl>' +
        '<label class="field">Note for whoever records the bill (optional)<textarea class="input ta" id="rc-note" rows="2" placeholder="e.g. 2 cartons dented, photos on the delivery note">' + esc(R.note || (R.dmg ? 'Outer packaging damaged on arrival.' : '')) + '</textarea></label>';
    }
    if (R.step === 4) {
      var gr = R.gr;
      return h + '<section class="focus done-f light"><span class="eic ok">' + icon('check') + '</span><b>Received and put away</b><span>' + (gr ? gr.id + ' · ' + gr.lines.reduce(function (a, x) { return a + x.units; }, 0) + ' units into ' + E.wh(R.wh).short : '') + (po.status === 'partial' ? ' · the rest stays open on ' + po.id : ' · ' + po.id + ' is complete') + '.</span>' +
        (gr && gr.lines.some(function (x) { return x.sn; }) ? '<div class="sn-list">' + gr.lines.filter(function (x) { return x.sn; }).map(function (x) { return '<b>' + esc(E.item(x.sku).name) + '</b> ' + x.sn.map(function (s) { return '<span class="skup">' + s + '</span>'; }).join(' '); }).join('<br>') + '</div>' : '') +
        '<div class="pk-actions"><button class="btn primary big" data-act="po-bill" data-id="' + po.id + '">Record supplier bill</button><button class="btn big" data-act="rc-labels">' + icon('labels') + 'Print labels</button></div><a class="nextup" href="#/overview">Back to Today ' + icon('right', 'sm') + '</a></section></div>';
    }
    h += '<section class="focus light">' + body + '<div class="pk-actions">' + (R.step < 3 ? '<button class="btn primary big" data-act="rc-next"' + (R.step === 2 && !open2.some(function (l) { return R.q[l.sku] > 0; }) ? ' disabled' : '') + '>Next · ' + RSTEPS[R.step + 1] + '</button>' : '<button class="btn primary big" data-act="rc-post">' + icon('receipt') + 'Post goods receipt</button>') + (R.step > 0 ? '<button class="btn big" data-act="rc-back">Back</button>' : '<a class="btn big" href="#/purchasing/' + po.id + '">Cancel</a>') + '</div></section></div>';
    return h;
  };

  function plural(k, w, pl) { return k + ' ' + (k === 1 ? w : pl || w + 's'); }

  /* ======================= v4: back-office standard ======================= */
  var PEOPLE = { receipt: ['Ravi Kumar', 'RK', 'dock'], sale: ['Arjun Das', 'AD', 'dispatch'], transfer: ['Sana Iqbal', 'SI', 'floor'], adjustment: ['Meera Rao', 'MR', 'inventory'] };
  function dayStart(t) { var d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
  // per-day series for the last `days` days (oldest first)
  V.daySeries = function (days, fn) {
    var t0 = dayStart(Date.now()) - (days - 1) * 864e5, out = []; for (var i = 0; i < days; i++) out.push(0);
    fn(function (t, v) { var k = Math.floor((t - t0) / 864e5); if (k >= 0 && k < days) out[k] += v; });
    return out;
  };
  function kpi(o) {
    return '<a class="kpi" href="' + o.href + '"><span class="kk">' + o.k + '</span><b class="kv num">' + o.v + '</b><span class="kd ' + (o.tone || '') + '">' + o.d + '</span>' + (o.s ? spark(o.s) : '') + '</a>';
  }
  /* activity: what people (and Lumen CRM) did, newest first */
  V.activity = function (n) {
    var ev = [], mv = E.moves(), seen = {};
    for (var i = mv.length - 1; i >= 0 && ev.length < 40; i--) {
      var m = mv[i]; if (seen[m.ref] || m.ref === 'OPENING') continue;
      var grp = mv.filter(function (x) { return x.ref === m.ref; }), units = grp.reduce(function (a, x) { return a + Math.abs(x.qty); }, 0), p = PEOPLE[m.type];
      seen[m.ref] = 1;
      var who = p[0], ini = p[1], line, sub;
      if (m.type === 'receipt') { var po = m.doc && E.po(m.doc); line = '<b>' + who + '</b> received ' + units + ' units' + (po ? ' from ' + esc(E.supplier(po.supplier).name) + ' ' + chipPO(po.id) : ''); sub = grp.map(function (x) { return x.qty + ' × ' + esc(E.item(x.sku).name); }).slice(0, 2).join(', '); }
      else if (m.type === 'sale') { var so = E.so(m.ref); line = '<b>' + who + '</b> dispatched ' + (so ? chipSO(so.id) + ' to ' + esc(so.customer) : m.ref); sub = units + ' units' + (so && so.waybill ? ' · waybill ' + so.waybill : ''); }
      else if (m.type === 'transfer') { units = units / 2; line = '<b>' + who + '</b> moved ' + units + ' × ' + esc(E.item(m.sku).name); sub = esc(m.note || ''); }
      else { line = '<b>' + who + '</b> ' + (/^CC/.test(m.ref) ? 'counted ' + esc(m.bin) : 'adjusted ' + esc(E.item(m.sku).name)); sub = esc(m.note || ''); }
      ev.push({ t: m.t, ini: ini, line: line, sub: sub });
    }
    E.sos().forEach(function (so) { if (so.source === 'crm') ev.push({ t: so.created, ini: 'L', crm: true, line: '<b>Lumen CRM</b> deal won by ' + esc(so.customer) + ' → ' + chipSO(so.id) + ' reserved', sub: plural(so.lines.length, 'line') + (E.shortfall(so) ? ' · ' + E.shortfall(so) + ' on backorder' : '') }); });
    ev.sort(function (a, b) { return b.t - a.t; });
    return ev.slice(0, n || 8);
  };
  V.overview = function (U) {
    var X = V.lastX = V.todayTasks(U), d = new Date(), wh = U.wh, value = E.totalValue(wh);
    var t0 = dayStart(Date.now()), yest = t0 - 864e5;
    var shipS = V.daySeries(14, function (add) { E.moves().forEach(function (m) { if (m.type === 'sale' && (!wh || m.wh === wh)) add(m.t, -m.qty); }); });
    var recS = V.daySeries(14, function (add) { E.moves().forEach(function (m) { if (m.type === 'receipt' && m.ref !== 'OPENING' && (!wh || m.wh === wh)) add(m.t, m.qty); }); });
    var ordS = V.daySeries(14, function (add) { E.sos().forEach(function (s) { if (!wh || s.wh === wh) add(s.created, 1); }); });
    var vs = valueSeries(14, wh), dv = vs[vs.length - 1] - vs[0];
    function pct(a, b) { return b ? Math.round((a - b) / b * 100) : 0; }
    var shipT = shipS[13], shipY = shipS[12], ordT = ordS[13], ordY = ordS[12];
    var role = V.me().key, noValue = V.me().noValue, packed = X.ready.length;
    var sentToday = 0; E.sos().forEach(function (so) { if (so.status === 'dispatched' && so.dispatchedAt >= t0 && (!wh || so.wh === wh)) sentToday++; });
    if (wh) packed = X.ready.filter(function (so) { return so.wh === wh; }).length;
    var h = '<div class="page today"><div class="page-h slim"><div><span id="h1-slot"></span><p>' + esc(V.todayLine(U)) + '</p></div><span class="sp"></span>' +
      '<button class="btn" data-act="tour">' + icon('bolt') + 'Take the tour</button><button class="btn" data-act="flow">Try the full flow ' + icon('right', 'sm') + '</button></div>';
    h += V.floorPanel(U, X);
    // phones: big warehouse actions first
    h += '<nav class="bigacts" aria-label="Warehouse actions">' +
      '<a href="#/scan" class="ba ba-scan">' + icon('scan') + '<b>Scan</b><span>Any label</span></a>' +
      '<a href="#/receive' + (X.openPO[0] ? '/' + (X.late[0] || X.arriving[0] || X.openPO[0]).id : '') + '" class="ba">' + icon('receipt') + '<b>Receive</b><span>' + plural(X.openPO.length, 'delivery', 'deliveries') + ' open</span></a>' +
      (V.can('pick') ? '<a href="#/pick/' + (X.next ? X.next.id : '') + '" class="ba">' + icon('box') + '<b>Pick</b><span>' + plural(X.toPick.length, 'order') + ' waiting</span></a>' : '<a href="#/purchasing?tab=drafts" class="ba">' + icon('purchasing') + '<b>Buy</b><span>' + plural(X.drafts.length, 'draft') + ' to review</span></a>') +
      (V.can('count') ? '<a href="#/count" class="ba">' + icon('ledger') + '<b>Count</b><span>' + plural(X.plan.length, 'bin') + ' planned</span></a>' : '<a href="#/suppliers" class="ba">' + icon('receipt') + '<b>Suppliers</b><span>Lead times</span></a>') + '</nav>';
    // KPI tiles: clickable, each with a delta and a sparkline
    h += '<section class="kpis" aria-label="Key figures">' +
      (role === 'farah' ? kpi({ k: 'Items below reorder', v: X.low.length, d: X.drafts.length ? plural(X.drafts.length, 'draft order') + ' ready to review' : 'No drafts waiting', href: '#/items?status=low' }) : kpi({ k: 'Orders to pick', v: X.toPick.length, d: X.lines + ' lines · ' + ordT + ' new today', s: ordS, href: '#/sales' })) +
      (role === 'farah' ? kpi({ k: 'Open purchase orders', v: X.openPO.length, d: X.late.length ? X.late.length + ' running late' : 'All on schedule', tone: '', href: '#/purchasing?tab=open' }) : kpi({ k: 'Dispatched today', v: sentToday + ' of ' + (sentToday + packed), d: packed ? packed + ' packed, waiting for the 4 pm truck' : 'Nothing waiting for the truck', tone: '', s: shipS, href: '#/sales?tab=done' })) +
      kpi({ k: 'Deliveries due', v: X.arriving.length + X.late.length, d: (X.late.length ? X.late.length + ' late · ' : '') + (recS[13] ? n(recS[13]) + ' units in today' : 'none in yet'), tone: X.late.length ? 'dn' : '', s: recS, href: '#/receive' }) +
      (noValue ? kpi({ k: 'Items below reorder', v: X.low.length, d: X.flagged.length ? plural(X.flagged.length, 'bin') + ' to recount' : 'No bins to recount', tone: '', href: '#/items?status=low' }) : kpi({ k: 'Stock value · at cost', v: inrS(value), d: (dv >= 0 ? '↑ ' : '↓ ') + inrS(Math.abs(dv)).replace('−', '') + ' in 14 days', tone: dv >= 0 ? 'up' : '', s: vs, href: '#/reports' })) + '</section>';
    // main: needs attention + queues | now & next + activity
    h += '<div class="home-grid"><div class="col-main">';
    h += '<section class="todo" aria-labelledby="todo-h"><header class="sec-h2"><h3 id="todo-h">Needs your attention</h3><span class="faint">' + X.list.length + '</span></header>';
    h += X.list.length ? '<ul class="tasks">' + X.list.map(function (t) {
      return '<li class="task ' + (t.tone || '') + '"><span class="tic">' + icon(t.ic) + '</span><div class="grow"><b>' + t.t + (t.crm ? ' ' + crm() : '') + '</b><span>' + t.s + '</span></div>' + (t.time ? '<span class="tchip">' + t.time + '</span>' : '') + '<a class="btn sm" href="' + t.href + '">' + t.btn + '</a></li>';
    }).join('') + '</ul>' : V.empty('check', 'All done for today', 'New orders from Lumen CRM and deliveries will appear here as they come in.');
    h += '</section>';
    var pickDone = 0, pickAll = 0; X.toPick.concat(X.ready).forEach(function (s) { (s.pick || s.lines).forEach(function (p) { pickAll++; if (p.done || s.status === 'picked') pickDone++; }); });
    var rcvDone = 0, rcvAll = 0; X.openPO.forEach(function (p) { p.lines.forEach(function (l) { rcvAll += l.pq; rcvDone += l.recv; }); });
    var counted = 0; E.bins('BHW').forEach(function (b) { if (E.lastCounted(b.id) >= t0) counted++; });
    var Q = [
      { n: 'Pick and pack', s: 'Open orders, in walk order', a: 'AD', done: pickDone, all: pickAll, due: 'Today', st: X.toPick.length ? 'active' : 'clear', href: '#/pick/' + (X.next ? X.next.id : ''), time: mins(X.lines * 1.5) },
      { n: 'Receiving', s: 'Sent purchase orders', a: 'RK', done: rcvDone, all: rcvAll, due: X.late.length ? 'Overdue' : 'This week', st: X.late.length ? 'late' : 'active', href: '#/receive/' + ((X.late[0] || X.arriving[0] || X.openPO[0]) || {}).id, time: mins(X.openPO.length * 8) },
      { n: 'Cycle count · Bhiwandi', s: 'Flagged bins first', a: 'MR', done: counted, all: counted + X.plan.length, due: 'Today', st: X.flagged.length ? 'flagged' : 'active', href: '#/count', time: mins(X.plan.length * 1.5) },
      { n: 'Reorder review', s: 'Drafts from low-stock alerts', a: 'MR', done: 0, all: X.drafts.length, due: X.drafts.length ? 'Today' : '—', st: X.drafts.length ? 'active' : 'clear', href: '#/purchasing?tab=drafts', time: mins(X.drafts.length * 1) }
    ];
    if (V.me().key === 'farah') Q = Q.filter(function (q) { return q.n === 'Receiving' || q.n === 'Reorder review'; });
    if (V.me().key === 'arjun') Q = Q.filter(function (q) { return q.n !== 'Reorder review'; });
    h += '<section aria-labelledby="q-h"><header class="sec-h2"><h3 id="q-h">Queues</h3><span class="faint">Press Play to work through one</span></header><div class="scroll-x"><table class="tbl queues"><thead><tr><th>Queue</th><th class="hide-m">Owner</th><th>Progress</th><th class="hide-m">Due</th><th class="r"><span class="vh">Start</span></th></tr></thead><tbody>' +
      Q.map(function (q) {
        return '<tr data-href="' + q.href + '"><td><b class="qn">' + q.n + '</b><div class="faint qs">' + q.s + '</div></td><td class="hide-m"><span class="av sm">' + q.a + '</span></td><td><div class="qp">' + meter(q.done, q.all, q.st === 'late' ? 'out' : '') + '<span class="num faint">' + q.done + '/' + q.all + '</span></div></td><td class="hide-m"><span class="pill plain' + (q.due === 'Overdue' ? ' out' : '') + '">' + q.due + '</span> <span class="faint qt">' + q.time + '</span></td><td class="r"><a class="btn sm play" href="' + q.href + '" aria-label="Start ' + q.n + '">' + icon('right', 'sm') + 'Play</a></td></tr>';
      }).join('') + '</tbody></table></div></section></div>';
    // right column: now & next, activity
    var now = X.toPick.filter(function (s) { return s.status === 'picking'; })[0];
    var nx = [];
    X.arriving.concat(X.late).sort(function (a, b) { return a.eta - b.eta; }).slice(0, 2).forEach(function (p) { nx.push({ t: p.eta < Date.now() ? 'Late' : hmT(p.eta), s: esc(E.supplier(p.supplier).name) + ' delivery', c: chipPO(p.id) }); });
    if (X.ready.length) nx.push({ t: '16:00', s: 'Courier collection · ' + plural(X.ready.length, 'order') + ' packed', c: '' });
    if (X.plan.length) nx.push({ t: '17:30', s: 'Cycle count · ' + plural(X.plan.length, 'bin'), c: '' });
    h += '<aside class="col-side"><section class="nownext" aria-labelledby="nn-h"><div class="nn-k" id="nn-h"><i></i>Now</div>' +
      (now ? '<b class="nn-t">Picking ' + esc(now.customer) + '</b><span class="nn-s">' + now.id + ' · ' + now.pick.filter(function (p) { return p.done; }).length + ' of ' + now.pick.length + ' lines · ' + E.wh(now.wh).short + '</span><a class="btn sm nn-b" href="#/pick/' + now.id + '">Continue ' + icon('right', 'sm') + '</a>' : '<b class="nn-t">Nothing in progress</b><span class="nn-s">Start the next order from the pick queue.</span>') +
      '<div class="nn-k nx">Next</div><ul class="nn-l">' + (nx.length ? nx.map(function (x) { return '<li><span class="nn-time num">' + x.t + '</span><span>' + x.s + ' ' + x.c + '</span></li>'; }).join('') : '<li><span>Nothing else scheduled today</span></li>') + '</ul></section>';
    h += '<section class="activity" aria-labelledby="act-h"><header class="sec-h2"><h3 id="act-h">Activity</h3><span class="sp"></span><a class="btn sm ghost" href="#/ledger">Stock ledger ' + icon('right', 'sm') + '</a></header><ul class="feed">' +
      V.activity(7).map(function (e) { return '<li><span class="av sm' + (e.crm ? ' crm-av' : '') + '">' + e.ini + '</span><div class="grow"><div class="fl">' + e.line + '</div>' + (e.sub ? '<div class="fs">' + e.sub + '</div>' : '') + '</div><span class="ft faint">' + agoT(e.t) + '</span></li>'; }).join('') + '</ul></section></aside></div>';
    return h + '</div>';
  };
  function hmT(t) { var x = new Date(t), today = dayStart(Date.now()); return (dayStart(t) === today ? '' : dayStart(t) === today + 864e5 ? 'Tmrw ' : day(t) + ' ') + String(x.getHours()).padStart(2, '0') + ':' + String(x.getMinutes()).padStart(2, '0'); }
  function agoT(t) { var m = Math.round((Date.now() - t) / 6e4); return m < 1 ? 'just now' : m < 60 ? m + 'm ago' : m < 1440 ? Math.round(m / 60) + 'h ago' : Math.round(m / 1440) + 'd ago'; }

  /* ---------- sortable headers and the column chooser ---------- */
  V.sortTh = function (U, key, label, cls) {
    var s = U.sort || {}, on = s.k === key, dir = on ? s.d : 0;
    return '<th class="' + (cls || '') + '" aria-sort="' + (on ? (dir > 0 ? 'ascending' : 'descending') : 'none') + '"><button class="sortb" data-act="sort" data-v="' + key + '">' + label + '<span class="sarr" aria-hidden="true">' + (on ? (dir > 0 ? '↑' : '↓') : '↕') + '</span></button></th>';
  };
  V.sortRows = function (U, rows, getters) {
    var s = U.sort; if (!s || !getters[s.k]) return rows;
    var g = getters[s.k];
    return rows.slice().sort(function (a, b) { var x = g(a), y = g(b); return (x < y ? -1 : x > y ? 1 : 0) * s.d; });
  };
  V.COLS = [['category', 'Category'], ['bin', 'Bin'], ['onhand', 'On hand'], ['reserved', 'Reserved'], ['rop', 'Reorder at'], ['onorder', 'On order'], ['value', 'Value']];
  V.colOn = function (U, k) { var c = U.cols || { bin: 1, rop: 1 }; return !!c[k]; };
  var ITEM_GET = {
    name: function (s) { return s.name.toLowerCase(); }, available: function (s) { return E.available(s.sku); }, rop: function (s) { return E.rop(s.sku); },
    onhand: function (s) { return E.onHand(s.sku); }, reserved: function (s) { return E.reserved(s.sku); }, onorder: function (s) { return E.onOrder(s.sku); },
    value: function (s) { return E.value(s.sku); }, category: function (s) { return s.category; }, bin: function (s) { return s.bin; },
    status: function (s) { return { out: 0, low: 1, ok: 2 }[E.status(s.sku)]; }
  };
  V.itemRows = function (U) {
    var wh = U.wh, rows = V.sortRows(U, itemMatches(U), ITEM_GET), sel = U.selItems || {}, C = function (k) { return V.colOn(U, k); };
    if (!rows.length) return '<tr><td colspan="12">' + V.empty('search', 'No items match', 'Try another category or clear the search.', '<button class="btn sm" data-act="clear-filters">Clear filters</button>') + '</td></tr>';
    return rows.map(function (s) {
      var oh = E.onHand(s.sku, wh), rs = E.reserved(s.sku, wh), av = oh - rs, crmR = E.reservedCRM(s.sku), editing = U.editRop === s.sku, bin = E.binsOf(s.sku, wh || 'BHW')[0];
      return '<tr data-href="#/items/' + s.sku + '" data-sku="' + s.sku + '" data-row' + (U.sel === s.sku || sel[s.sku] ? ' class="on"' : '') + '><td class="ck"><input type="checkbox" class="chk" data-act="sel" data-k="selItems" data-v="' + s.sku + '" aria-label="Select ' + esc(s.name) + '"' + (sel[s.sku] ? ' checked' : '') + '></td>' +
        '<td><div class="it"><img class="thumb" src="' + s.thumb + '" alt="" loading="lazy" decoding="async" width="32" height="32"><span><b><a href="#/items/' + s.sku + '">' + esc(s.name) + '</a></b><small><span class="skup">' + s.sku + '</span>' + (s.serial ? '<span class="skup sn">Serial</span>' : '') + '</small></span></div></td>' +
        (C('category') ? '<td class="hide-m muted">' + s.category + '</td>' : '') +
        (C('bin') ? '<td class="hide-m">' + (bin ? '<span class="obj bin-c">' + bin.bin + '</span>' : '<span class="faint">—</span>') + '</td>' : '') +
        (C('onhand') ? '<td class="num hide-m">' + n(oh) + '</td>' : '') +
        (C('reserved') ? '<td class="num hide-m">' + (rs ? n(rs) + (crmR ? ' <span class="crm" title="' + n(crmR) + ' reserved from Lumen CRM deals"><i aria-hidden="true"></i>' + n(crmR) + '</span>' : '') : '<span class="faint">—</span>') + '</td>' : '') +
        '<td class="num"><b class="avail">' + n(av) + '</b></td>' +
        (C('rop') ? '<td class="num hide-m">' + (editing ? '<input class="input num inl-in" data-in="rop" data-sku="' + s.sku + '" type="number" min="0" inputmode="numeric" value="' + E.rop(s.sku) + '" aria-label="Reorder point for ' + esc(s.name) + '">' : '<button class="inl" data-act="inl-rop" data-sku="' + s.sku + '" title="Edit (press E)">' + n(E.rop(s.sku)) + '</button>') + '</td>' : '') +
        (C('onorder') ? '<td class="num hide-m">' + (E.onOrder(s.sku) ? n(E.onOrder(s.sku)) : '<span class="faint">—</span>') + '</td>' : '') +
        (C('value') ? '<td class="num hide-m">' + inrS(E.value(s.sku, wh)) + '</td>' : '') +
        '<td>' + pill(E.status(s.sku)) + '</td>' +
        '<td class="ra hide-m"><span class="racts"><button class="ibtn" data-act="qadj" data-sku="' + s.sku + '" data-d="-1" aria-label="Remove one ' + esc(s.name) + '" title="Remove one">−</button><button class="ibtn" data-act="qadj" data-sku="' + s.sku + '" data-d="1" aria-label="Add one ' + esc(s.name) + '" title="Add one">+</button><button class="ibtn" data-act="transfer" data-sku="' + s.sku + '" aria-label="Move ' + esc(s.name) + '" title="Move">' + icon('transfer', 'sm') + '</button><button class="ibtn" data-act="label" data-sku="' + s.sku + '" aria-label="Label for ' + esc(s.name) + '" title="Print label">' + icon('labels', 'sm') + '</button></span></td></tr>';
    }).join('');
  };
  var itemsV3 = V.items;
  V.items = function (U) {
    var mode = U.itemView || (window.innerWidth < 860 ? 'cards' : 'table');
    var h = itemsV3(U);
    if (mode !== 'table') return h.replace(/<button class="btn" data-act="detail"[^>]*>[^<]*<\/button>/, '');
    var C = function (k) { return V.colOn(U, k); }, rows = itemMatches(U), sel = U.selItems || {}, allOn = rows.length && rows.every(function (s) { return sel[s.sku]; });
    var menu = '<details class="colmenu"><summary class="btn">' + icon('ledger', 'sm') + 'Columns</summary><div class="menu" role="group" aria-label="Choose columns">' + V.COLS.map(function (c) { return '<label><input type="checkbox" class="chk" data-act="col" data-v="' + c[0] + '"' + (C(c[0]) ? ' checked' : '') + '> ' + c[1] + '</label>'; }).join('') + '<button type="button" class="textbtn" data-act="cols-all">Show all</button><button type="button" class="textbtn" data-act="cols-min">Essentials only</button></div></details>';
    h = h.replace(/<button class="btn" data-act="detail"[^>]*>[^<]*<\/button>/, menu);
    var head = '<thead><tr><th class="ck"><input type="checkbox" class="chk" data-act="selall" data-k="selItems" aria-label="Select all items in view"' + (allOn ? ' checked' : '') + '></th>' + V.sortTh(U, 'name', 'Item') +
      (C('category') ? V.sortTh(U, 'category', 'Category', 'hide-m') : '') + (C('bin') ? '<th class="hide-m">Bin ' + tip('bin', 'bin') + '</th>' : '') +
      (C('onhand') ? V.sortTh(U, 'onhand', 'On hand', 'num hide-m') : '') + (C('reserved') ? V.sortTh(U, 'reserved', 'Reserved', 'num hide-m') : '') +
      V.sortTh(U, 'available', 'Available', 'num') + (C('rop') ? V.sortTh(U, 'rop', 'Reorder at', 'num hide-m') : '') +
      (C('onorder') ? V.sortTh(U, 'onorder', 'On order', 'num hide-m') : '') + (C('value') ? V.sortTh(U, 'value', 'Value', 'num hide-m') : '') +
      V.sortTh(U, 'status', 'Status') + '<th class="ra hide-m"><span class="vh">Actions</span></th></tr></thead>';
    return h.replace(/<thead>[\s\S]*?<\/thead>/, head);
  };
  /* sales and purchase lists: sortable headers */
  var salesV3 = V.sales, purchV3 = V.purchasing;
  V.sales = function (U) {
    var h = salesV3(U);
    return h.replace('<th>Order</th>', V.sortTh(U, 'created', 'Order')).replace('<th>Customer</th>', V.sortTh(U, 'customer', 'Customer')).replace('<th class="num hide-m">Value</th>', V.sortTh(U, 'value', 'Value', 'num hide-m'));
  };
  V.purchasing = function (U) {
    var h = purchV3(U);
    return h.replace('<th>PO</th>', V.sortTh(U, 'created', 'PO')).replace('<th>Supplier</th>', V.sortTh(U, 'supplier', 'Supplier')).replace('<th class="num hide-m">Total</th>', V.sortTh(U, 'total', 'Total', 'num hide-m')).replace('<th class="hide-m">Expected</th>', V.sortTh(U, 'eta', 'Expected', 'hide-m'));
  };
  V.SO_GET = { created: function (s) { return s.created; }, customer: function (s) { return s.customer.toLowerCase(); }, value: function (s) { return soValue(s); } };
  V.PO_GET = { created: function (p) { return p.created; }, supplier: function (p) { return E.supplier(p.supplier).name; }, total: function (p) { return E.poTotal(p); }, eta: function (p) { return p.eta || 0; } };
  /* ---------- record panels: summary, timeline, related, notes ---------- */
  function timeline(ev) {
    ev.sort(function (a, b) { return a.t - b.t; });
    return '<div><h3>Timeline</h3><ol class="tl">' + ev.map(function (e) { return '<li class="' + (e.tone || '') + '"><span class="tl-d" aria-hidden="true"></span><div><b>' + e.what + '</b>' + (e.sub ? '<span>' + e.sub + '</span>' : '') + '</div><time class="faint">' + when(e.t, true) + '</time></li>'; }).join('') + '</ol></div>';
  }
  function notesBlock(id) {
    var ns = E.notes(id);
    return '<div><h3>Notes</h3>' + (ns.length ? '<ul class="notes">' + ns.map(function (x) { return '<li><span class="av sm">' + x.ini + '</span><div><b>' + esc(x.who) + '</b> <span class="faint">' + when(x.t, true) + '</span><p>' + esc(x.text) + '</p></div></li>'; }).join('') + '</ul>' : '') +
      '<form class="addnote" data-form="note" data-id="' + id + '"><label class="vh" for="nt-' + id + '">Add a note</label><input class="input" id="nt-' + id + '" name="text" placeholder="+ Add a note for the team" autocomplete="off" maxlength="240"><button class="btn sm" type="submit">Add</button></form></div>';
  }
  function related(items) { return items.length ? '<div><h3>Related</h3><ul class="rel">' + items.join('') + '</ul></div>' : ''; }
  var soSheetV3 = V.soSheet, poSheetV3 = V.poSheet, itemSheetV3 = V.itemSheet;
  V.soSheet = function (id) {
    var r = soSheetV3(id); if (!r) return r;
    var so = E.so(id), ev = [{ t: so.wonAt || so.created, what: so.source === 'crm' ? 'Deal won in Lumen CRM' : 'Order placed', sub: esc(so.customer) }, { t: so.created, what: 'Stock reserved', sub: plural(so.lines.reduce(function (a, l) { return a + l.res + l.picked; }, 0), 'unit') + (E.shortfall(so) ? ' · ' + E.shortfall(so) + ' on backorder' : ''), tone: 'acc' }];
    if (so.pickAt) ev.push({ t: so.pickAt, what: 'Picking started', sub: 'Arjun Das · ' + plural((so.pick || []).length, 'bin') });
    (so.pick || []).forEach(function (p) { if (p.short) ev.push({ t: p.at, what: (p.why === 'damaged' ? 'Damaged at ' : 'Short at ') + p.bin, sub: p.short + ' × ' + esc(E.item(p.sku).name) + ' to backorder', tone: 'low' }); });
    if (so.dispatchedAt) ev.push({ t: so.dispatchedAt, what: 'Dispatched', sub: 'Waybill ' + so.waybill, tone: 'ok' });
    if (so.status === 'cancelled') ev.push({ t: Date.now(), what: 'Cancelled', sub: esc(so.cancelNote || ''), tone: 'out' });
    var rel = [];
    if (so.source === 'crm') rel.push('<li><span class="crm"><i aria-hidden="true"></i>Lumen CRM</span> <span>' + esc(so.ref || 'Won deal') + '</span></li>');
    var b = E.so(so.id + '-B'); if (b) rel.push('<li>' + chipSO(b.id) + '<span>Backorder · ' + plural(b.lines.reduce(function (a, l) { return a + l.qty; }, 0), 'unit') + '</span>' + soPill(b) + '</li>');
    var m = /^(SO-\d+)-B$/.exec(so.id); if (m) rel.push('<li>' + chipSO(m[1]) + '<span>Original order</span></li>');
    so.lines.forEach(function (l) { if (l.qty - l.res - l.picked > 0) E.pos().forEach(function (p) { if ((p.status === 'approved' || p.status === 'partial') && p.lines.some(function (x) { return x.sku === l.sku && x.recv < x.pq; })) rel.push('<li>' + chipPO(p.id) + '<span>Brings ' + esc(E.item(l.sku).name) + ' · ' + whenLc(p.eta) + '</span>' + poPill(p) + '</li>'); }); });
    r.body += V.papersRow('so', id) + timeline(ev) + related(rel) + notesBlock(id);
    return r;
  };
  V.poSheet = function (id) {
    var r = poSheetV3(id); if (!r) return r;
    var po = E.po(id), ev = [{ t: po.created, what: po.auto ? 'Drafted by a low-stock alert' : 'Draft created', sub: esc(E.supplier(po.supplier).name) }];
    if (po.approvedAt) ev.push({ t: po.approvedAt, what: 'Approved and sent', sub: 'Expected ' + whenLc(po.eta), tone: 'acc' });
    po.receipts.forEach(function (g) { ev.push({ t: g.t, what: 'Received ' + g.id, sub: g.lines.reduce(function (a, x) { return a + x.units; }, 0) + ' units · Ravi Kumar' + (g.note ? ' · “' + esc(g.note) + '”' : ''), tone: 'ok' }); });
    if (po.bill) ev.push({ t: po.bill.t, what: 'Bill ' + esc(po.bill.no) + ' recorded', sub: inr(po.bill.amount) });
    var rel = [];
    E.sos().forEach(function (s) { if (s.status === 'reserved' && s.lines.some(function (l) { return l.qty > l.res && po.lines.some(function (x) { return x.sku === l.sku; }); })) rel.push('<li>' + chipSO(s.id) + '<span>' + esc(s.customer) + ' is waiting on this</span>' + soPill(s) + '</li>'); });
    r.body += V.papersRow('po', id) + timeline(ev) + related(rel) + notesBlock(id);
    return r;
  };
  V.itemSheet = function (sku, U) {
    var r = itemSheetV3(sku, U), it = E.item(sku), rel = [];
    E.sos().forEach(function (s) { if ((s.status === 'reserved' || s.status === 'picking' || s.status === 'picked') && s.lines.some(function (l) { return l.sku === sku; })) { var l = s.lines.filter(function (x) { return x.sku === sku; })[0]; rel.push('<li>' + chipSO(s.id) + '<span>' + esc(s.customer) + ' · ' + l.qty + ' ' + it.uom + '</span>' + soPill(s) + '</li>'); } });
    E.pos().forEach(function (p) { if ((p.status === 'approved' || p.status === 'partial' || p.status === 'draft') && p.lines.some(function (l) { return l.sku === sku && l.recv < l.pq; })) rel.push('<li>' + chipPO(p.id) + '<span>' + esc(E.supplier(p.supplier).name) + ' · ' + (p.status === 'draft' ? 'draft' : whenLc(p.eta)) + '</span>' + poPill(p) + '</li>'); });
    var vs = E.vendorSku(sku);
    var fill = '<dl class="kv fillgaps"><dt>Supplier’s code</dt><dd>' + (vs ? '<span class="skup">' + esc(vs) + '</span>' : '<form class="addin" data-form="vsku" data-sku="' + sku + '"><label class="vh" for="vs-' + sku + '">Supplier’s code</label><input class="input" id="vs-' + sku + '" name="code" placeholder="+ Add" autocomplete="off" maxlength="24"></form>') + '</dd><dt>Barcode</dt><dd><span class="skup">' + sku + '</span> <span class="faint">Code 128</span></dd></dl>';
    var at = r.body.indexOf('<details class="more"');
    var extra = fill + related(rel) + notesBlock(sku);
    r.body = at > 0 ? r.body.slice(0, at) + extra + r.body.slice(at) : r.body + extra;
    return r;
  };
})();
