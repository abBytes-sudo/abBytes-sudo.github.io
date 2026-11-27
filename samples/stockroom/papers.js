/* Stockroom papers: delivery challan, GST tax invoice, e-way bill summary, purchase order, goods receipt note.
   Each is one A4 sheet. Money is kept in paise (integers) until it is set on the page. Adds V.doc, V.docHTML, V.invoiceCalc. */
(function () {
  'use strict';
  var E = window.SR, V = window.SRV, H = window.HALDEN;
  if (!E || !V || !H) return;
  var esc = V.esc, MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], DAY = 864e5;
  var CO = H.COMPANY;
  var FMT2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), FMT0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  function p2(paise) { return FMT2.format(paise / 100); }                       // 279200.5 -> 2,79,200.50
  function money(x) { return '<span class="mn">' + x + '</span>'; }
  function mn(x) { return '<span class="mn">' + x + '</span>'; }
  function dstr(t) { var d = new Date(t); return (d.getDate() < 10 ? '0' : '') + d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); }
  function fy(t) { var d = new Date(t), y = d.getFullYear() % 100, s = d.getMonth() >= 3 ? y : y - 1; return (s < 10 ? '0' : '') + s + '-' + (((s + 1) % 100) < 10 ? '0' : '') + ((s + 1) % 100); }
  function seqOf(id) { return id.replace(/^[A-Z]+-/, '').replace(/-B$/, 'B'); }
  var HSN_NAME = { '9401': 'Seats and chairs', '9403': 'Other furniture', '9405': 'Lamps and lighting fittings', '6304': 'Furnishing articles', '5702': 'Carpets and floor coverings' };

  /* ---------- amount in words, Indian system ---------- */
  var ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'],
    TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function w100(x) { return x < 20 ? ONES[x] : TENS[Math.floor(x / 10)] + (x % 10 ? '-' + ONES[x % 10] : ''); }
  function w1000(x) { var h = Math.floor(x / 100), r = x % 100; return (h ? ONES[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? w100(r) : ''); }
  V.rupeesInWords = function (rs) {
    rs = Math.round(rs); if (rs === 0) return 'Rupees Zero Only';
    var p = [], cr = Math.floor(rs / 1e7), lk = Math.floor(rs % 1e7 / 1e5), th = Math.floor(rs % 1e5 / 1e3), r = rs % 1e3;
    if (cr) p.push(w1000(cr) + ' Crore'); if (lk) p.push(w100(lk) + ' Lakh'); if (th) p.push(w100(th) + ' Thousand'); if (r) p.push(w1000(r));
    return 'Rupees ' + p.join(' ') + ' Only';
  };

  /* ---------- parties ---------- */
  var FALLBACK = [['Pune', 'Maharashtra', '27', '411001', 18.52, 73.86], ['Bengaluru', 'Karnataka', '29', '560001', 12.97, 77.59], ['Surat', 'Gujarat', '24', '395003', 21.17, 72.83], ['Chennai', 'Tamil Nadu', '33', '600034', 13.06, 80.25], ['Mumbai', 'Maharashtra', '27', '400069', 19.12, 72.85]];
  V.buyerOf = function (name) {
    if (H.BUYERS[name]) return H.BUYERS[name];
    var h = 0; for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    var f = FALLBACK[h % FALLBACK.length];
    return { person: 'Purchase desk', addr: 'Registered office, ' + name, city: f[0], state: f[1], code: f[2], pin: f[3], gstin: f[2] + 'AAHCX0000Z1Z' + (h % 9 + 1), lat: f[4], lon: f[5] };
  };
  function km(a, b) { var R = 6371, t = Math.PI / 180, dl = (b.lat - a.lat) * t, dn = (b.lon - a.lon) * t, x = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dn / 2) * Math.sin(dn / 2); return Math.max(5, Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)) * 1.28 / 5) * 5); }

  /* ---------- tax ---------- */
  /* lines: [{ sku, it, qty, rate (paise per unit), taxable (paise), gst, cg, sg, ig, tax }] */
  function taxLines(src, intra) {
    return src.map(function (l) {
      var it = E.item(l.sku), taxable = l.qty * l.rate, half = intra ? Math.round(taxable * it.gst / 200) : 0, ig = intra ? 0 : Math.round(taxable * it.gst / 100);
      return { sku: l.sku, it: it, qty: l.qty, rate: l.rate, taxable: taxable, gst: it.gst, cg: half, sg: half, ig: ig, tax: half * 2 + ig, sn: l.sn };
    });
  }
  function totals(ls) {
    var t = { taxable: 0, cg: 0, sg: 0, ig: 0, tax: 0 };
    ls.forEach(function (l) { t.taxable += l.taxable; t.cg += l.cg; t.sg += l.sg; t.ig += l.ig; t.tax += l.tax; });
    t.sub = t.taxable + t.tax; t.grand = Math.round(t.sub / 100) * 100; t.round = t.grand - t.sub; t.rupees = t.grand / 100;
    return t;
  }
  function soUnits(so) {
    var bySku = {};
    if (so.status === 'dispatched') so.lines.forEach(function (l) { if (l.picked > 0) bySku[l.sku] = l.picked; });
    else (so.pick || []).forEach(function (p) { bySku[p.sku] = (bySku[p.sku] || 0) + p.qty; });
    var sn = {}; (so.pick || []).forEach(function (p) { if (p.sn && p.sn.length) sn[p.sku] = (sn[p.sku] || []).concat(p.sn); });
    return Object.keys(bySku).map(function (k) { return { sku: k, qty: bySku[k], rate: E.item(k).price * 100, sn: sn[k] }; });
  }
  V.invoiceCalc = function (so) {
    var from = H.WH_ADDR[so.wh], buyer = V.buyerOf(so.customer), intra = from.code === buyer.code;
    var ls = taxLines(soUnits(so), intra), t = totals(ls);
    return { from: from, buyer: buyer, intra: intra, lines: ls, t: t, grand: t.rupees, eway: t.rupees > 50000, km: km(from, buyer) };
  };

  /* ---------- shared sheet pieces ---------- */
  function letterhead(docNo, label) {
    return '<header class="lh"><div class="lh-co"><div class="lh-name">' + CO.name + '</div><div class="lh-addr">' + esc(CO.addr) + ', ' + CO.city + ', ' + CO.state + ' ' + mn(CO.pin) + '</div>' +
      '<div class="lh-ids"><span>GSTIN ' + mn(CO.gstin) + '</span><span>CIN ' + mn(CO.cin) + '</span><span>PAN ' + mn(CO.pan) + '</span></div><div class="lh-addr">' + esc(CO.mail) + ' · ' + mn(CO.phone) + '</div></div>' +
      '<div class="lh-bc"><canvas class="doc-bc" data-bc="' + esc(docNo) + '" aria-label="Barcode of ' + esc(docNo) + '" role="img"></canvas></div></header>' +
      '<div class="dt"><h2 class="dt-t">' + label[0] + '</h2><span class="dt-s">' + (label[1] || '') + '</span></div>';
  }
  function meta(rows) { return '<dl class="meta">' + rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>'; }
  function party(title, name, lines, ids) {
    return '<div class="pty"><h3>' + title + '</h3><b>' + esc(name) + '</b><p>' + lines.map(esc).join('<br>') + '</p>' + (ids ? '<p class="pty-ids">' + ids + '</p>' : '') + '</div>';
  }
  function sign(boxes) { return '<div class="signs">' + boxes.map(function (b) { return '<div class="sg"><div class="sg-box"></div><span>' + b + '</span></div>'; }).join('') + '</div>'; }
  function foot() { return '<footer class="df"><span>This is a computer-generated document.</span><span class="mn">Page 1 of 1</span></footer>'; }
  function sheet(kind, inner) { return '<article class="a4 doc-' + kind + '">' + inner + '</article>'; }
  function notFound(txt) { return '<article class="a4"><div class="dt"><h2 class="dt-t">Paper not available</h2></div><p class="nf">' + esc(txt) + '</p></article>'; }
  var STATE_ADDR = function (a) { return [a.addr, a.city + ', ' + a.state + ' ' + a.pin]; };

  /* ---------- delivery challan ---------- */
  function challan(so) {
    var calc = V.invoiceCalc(so), ls = calc.lines, no = 'DC/' + fy(so.dispatchedAt || E.now()) + '/' + seqOf(so.id), when = so.dispatchedAt || (so.pick || []).reduce(function (a, p) { return Math.max(a, p.at || 0); }, 0) || E.now();
    var units = 0; ls.forEach(function (l) { units += l.qty; });
    var h = letterhead(no, ['Delivery challan', 'Goods sent for delivery · not a tax invoice'])
      + meta([['Challan no.', mn(no)], ['Date', mn(dstr(when))], ['Order', mn(so.id)], ['Dispatched from', esc(calc.from.name)], ['Waybill', so.waybill ? mn(so.waybill) : 'To be issued'], ['Status', so.status === 'dispatched' ? 'Dispatched' : 'Packed, waiting for the truck']])
      + '<div class="ptys">' + party('Deliver to', so.customer, STATE_ADDR(calc.buyer).concat(['Attn: ' + calc.buyer.person]), 'GSTIN ' + mn(calc.buyer.gstin)) + party('Dispatched from', calc.from.name, [calc.from.addr, calc.from.city + ', ' + calc.from.state + ' ' + calc.from.pin], 'GSTIN ' + mn(calc.from.gstin)) + '</div>'
      + '<table class="lines"><thead><tr><th class="c-n">#</th><th>Description of goods</th><th class="c-m">HSN</th><th class="c-r">Qty</th><th>Unit</th><th class="c-r">Goods value (₹)</th></tr></thead><tbody>' +
      ls.map(function (l, i) { return '<tr><td class="c-n">' + mn(i + 1) + '</td><td><b>' + esc(l.it.name) + '</b><span class="sub">' + mn(l.sku) + (l.sn && l.sn.length ? ' · serial ' + l.sn.map(mn).join(', ') : '') + '</span></td><td class="c-m">' + mn(l.it.hsn) + '</td><td class="c-r">' + mn(l.qty) + '</td><td>' + (l.it.uom === 'pack' ? 'pack' : 'nos') + '</td><td class="c-r">' + mn(p2(l.taxable)) + '</td></tr>'; }).join('') +
      '<tr class="tot"><td></td><td colspan="2">Total</td><td class="c-r">' + mn(units) + '</td><td></td><td class="c-r">' + mn(p2(calc.t.taxable)) + '</td></tr></tbody></table>'
      + '<p class="note">Goods value is shown for transport only. The tax invoice follows once the order is dispatched. Please check the goods against this challan on receipt and note any damage on the receiver’s copy.</p>'
      + (so.note ? '<p class="note"><b>Delivery note:</b> ' + esc(so.note) + '</p>' : '')
      + '<dl class="meta m2"><div><dt>Vehicle</dt><dd>' + mn(so.wh === 'BLR' ? 'KA 53 XX 0000' : 'MH 04 XX 0000') + '</dd></div><div><dt>Packages</dt><dd>' + mn(units) + ' units, ' + mn((so.pick || []).length || ls.length) + ' bin picks</dd></div></dl>'
      + sign(['Prepared by · Arjun Das, Storekeeper', 'Driver’s signature', 'Receiver’s signature and stamp']) + foot();
    return sheet('challan', h);
  }

  /* ---------- GST tax invoice ---------- */
  function invoice(so) {
    var c = V.invoiceCalc(so), t = c.t, no = 'HS/' + fy(so.dispatchedAt) + '/' + seqOf(so.id), terms = 'Net 30';
    var rows = c.lines.map(function (l, i) {
      return '<tr><td class="c-n">' + mn(i + 1) + '</td><td><b>' + esc(l.it.name) + '</b><span class="sub">' + mn(l.sku) + (l.sn && l.sn.length ? ' · serial ' + l.sn.map(mn).join(', ') : '') + '</span></td><td class="c-m">' + mn(l.it.hsn) + '</td><td class="c-r">' + mn(l.qty) + '</td><td class="c-r">' + mn(p2(l.rate)) + '</td><td class="c-r">' + mn(p2(l.taxable)) + '</td><td class="c-r">' + mn(l.gst + '%') + '</td></tr>';
    }).join('');
    var byRate = {}; c.lines.forEach(function (l) { var k = l.it.hsn + '|' + l.gst; var r = byRate[k] || (byRate[k] = { hsn: l.it.hsn, gst: l.gst, taxable: 0, cg: 0, sg: 0, ig: 0 }); r.taxable += l.taxable; r.cg += l.cg; r.sg += l.sg; r.ig += l.ig; });
    var sumRows = Object.keys(byRate).sort().map(function (k) {
      var r = byRate[k];
      return '<tr><td class="c-m">' + mn(r.hsn) + '</td><td class="c-r">' + mn(p2(r.taxable)) + '</td>' + (c.intra ? '<td class="c-r">' + mn(r.gst / 2 + '%') + '</td><td class="c-r">' + mn(p2(r.cg)) + '</td><td class="c-r">' + mn(r.gst / 2 + '%') + '</td><td class="c-r">' + mn(p2(r.sg)) + '</td>' : '<td class="c-r">' + mn(r.gst + '%') + '</td><td class="c-r">' + mn(p2(r.ig)) + '</td>') + '<td class="c-r">' + mn(p2(r.cg + r.sg + r.ig)) + '</td></tr>';
    }).join('');
    var h = letterhead(no, ['Tax invoice', 'Original for recipient'])
      + meta([['Invoice no.', mn(no)], ['Invoice date', mn(dstr(so.dispatchedAt))], ['Order', mn(so.id)], ['Place of supply', esc(c.buyer.state) + ' (' + mn(c.buyer.code) + ')'], ['Payment terms', terms], ['Reverse charge', 'No']])
      + '<div class="ptys">' + party('Billed to', so.customer, STATE_ADDR(c.buyer), 'GSTIN ' + mn(c.buyer.gstin) + ' · State code ' + mn(c.buyer.code)) + party('Shipped to', so.customer, STATE_ADDR(c.buyer).concat(['Attn: ' + c.buyer.person]), 'Dispatched from ' + esc(c.from.name) + ' · GSTIN ' + mn(c.from.gstin)) + '</div>'
      + '<table class="lines"><thead><tr><th class="c-n">#</th><th>Description of goods</th><th class="c-m">HSN</th><th class="c-r">Qty</th><th class="c-r">Rate (₹)</th><th class="c-r">Taxable value (₹)</th><th class="c-r">GST</th></tr></thead><tbody>' + rows + '</tbody></table>'
      + '<div class="botm"><table class="lines sm taxsum"><thead><tr><th class="c-m">HSN</th><th class="c-r">Taxable (₹)</th>' + (c.intra ? '<th class="c-r">CGST</th><th class="c-r">Amount (₹)</th><th class="c-r">SGST</th><th class="c-r">Amount (₹)</th>' : '<th class="c-r">IGST</th><th class="c-r">Amount (₹)</th>') + '<th class="c-r">Tax (₹)</th></tr></thead><tbody>' + sumRows + '</tbody></table>'
      + '<dl class="tots"><div><dt>Taxable value</dt><dd>' + mn(p2(t.taxable)) + '</dd></div>' + (c.intra ? '<div><dt>CGST</dt><dd>' + mn(p2(t.cg)) + '</dd></div><div><dt>SGST</dt><dd>' + mn(p2(t.sg)) + '</dd></div>' : '<div><dt>IGST</dt><dd>' + mn(p2(t.ig)) + '</dd></div>') + '<div><dt>Round off</dt><dd>' + mn((t.round < 0 ? '−' : '') + p2(Math.abs(t.round))) + '</dd></div><div class="gt"><dt>Total</dt><dd>' + mn('₹' + FMT2.format(t.rupees)) + '</dd></div></dl></div>'
      + '<p class="words"><span>Amount in words</span><b>' + V.rupeesInWords(t.rupees) + '</b></p>'
      + '<div class="cols2"><div class="terms"><h3>Terms</h3><ol><li>Payment is due within ' + terms.replace('Net ', '') + ' days of the invoice date.</li><li>Goods are carried at the buyer’s risk once handed to the carrier.</li><li>Any shortage or damage must be reported within 48 hours of delivery.</li><li>Disputes are subject to Thane jurisdiction.</li></ol></div>'
      + '<div class="terms"><h3>Declaration</h3><p>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p><p>Dispatched ' + mn(dstr(so.dispatchedAt)) + ' · waybill ' + mn(so.waybill) + '</p></div></div>'
      + sign(['Receiver’s signature', 'For ' + CO.name + ' · Authorised signatory']) + foot();
    return sheet('invoice', h);
  }

  /* ---------- e-way bill summary ---------- */
  function eway(so) {
    var c = V.invoiceCalc(so), t = c.t, inv = 'HS/' + fy(so.dispatchedAt) + '/' + seqOf(so.id), no = 'EWB/' + fy(so.dispatchedAt) + '/' + seqOf(so.id), days = Math.max(1, Math.ceil(c.km / 200));
    var byHsn = {}; c.lines.forEach(function (l) { var r = byHsn[l.it.hsn] || (byHsn[l.it.hsn] = { hsn: l.it.hsn, qty: 0, taxable: 0, gst: l.gst, tax: 0 }); r.qty += l.qty; r.taxable += l.taxable; r.tax += l.tax; });
    var veh = so.wh === 'BLR' ? 'KA 53 XX 0000' : 'MH 04 XX 0000';
    var h = letterhead(no, ['E-way bill summary', 'For goods moving by road · invoice value over ₹50,000'])
      + meta([['Document no.', mn(no)], ['Supply document', 'Tax invoice ' + mn(inv)], ['Document date', mn(dstr(so.dispatchedAt))], ['Supply type', 'Outward · sale'], ['Transport mode', 'Road'], ['Valid for', mn(days) + (days === 1 ? ' day' : ' days') + ' from dispatch']])
      + '<div class="ptys">' + party('From · dispatch', CO.name, [c.from.addr, c.from.city + ', ' + c.from.state + ' ' + c.from.pin], 'GSTIN ' + mn(c.from.gstin) + ' · PIN ' + mn(c.from.pin)) + party('To · delivery', so.customer, STATE_ADDR(c.buyer), 'GSTIN ' + mn(c.buyer.gstin) + ' · PIN ' + mn(c.buyer.pin)) + '</div>'
      + '<h3 class="sec">Transport details</h3>'
      + '<dl class="meta m3"><div><dt>Distance</dt><dd>' + mn(c.km) + ' km</dd></div><div><dt>Vehicle no.</dt><dd>' + mn(veh) + '</dd></div><div><dt>Transporter</dt><dd>Halden fleet</dd></div><div><dt>Waybill</dt><dd>' + mn(so.waybill) + '</dd></div><div><dt>Transaction</dt><dd>' + (c.intra ? 'Within the state' : 'Between states') + '</dd></div><div><dt>Tax charged</dt><dd>' + (c.intra ? 'CGST and SGST' : 'IGST') + '</dd></div></dl>'
      + '<h3 class="sec">Goods, by HSN</h3>'
      + '<table class="lines"><thead><tr><th class="c-m">HSN</th><th>Product group</th><th class="c-r">Quantity</th><th class="c-r">Taxable value (₹)</th><th class="c-r">GST</th><th class="c-r">Tax (₹)</th></tr></thead><tbody>' +
      Object.keys(byHsn).sort().map(function (k) { var r = byHsn[k]; return '<tr><td class="c-m">' + mn(r.hsn) + '</td><td>' + (HSN_NAME[r.hsn] || 'Goods') + '</td><td class="c-r">' + mn(r.qty) + '</td><td class="c-r">' + mn(p2(r.taxable)) + '</td><td class="c-r">' + mn(r.gst + '%') + '</td><td class="c-r">' + mn(p2(r.tax)) + '</td></tr>'; }).join('') +
      '<tr class="tot"><td colspan="3">Total</td><td class="c-r">' + mn(p2(t.taxable)) + '</td><td></td><td class="c-r">' + mn(p2(t.tax)) + '</td></tr></tbody></table>'
      + '<dl class="tots wide"><div class="gt"><dt>Total invoice value</dt><dd>' + mn('₹' + FMT2.format(t.rupees)) + '</dd></div></dl>'
      + '<p class="words"><span>Amount in words</span><b>' + V.rupeesInWords(t.rupees) + '</b></p>'
      + '<p class="note">This summary carries the particulars needed to generate the e-way bill on the GST portal. The driver carries this page, the tax invoice and the delivery challan for the whole journey. Fill in the real vehicle number before the vehicle leaves.</p>'
      + sign(['Dispatch clerk', 'Driver’s signature', 'For ' + CO.name + ' · Authorised signatory']) + foot();
    return sheet('eway', h);
  }

  /* ---------- purchase order ---------- */
  function purchaseOrder(po) {
    var s = E.supplier(po.supplier), to = H.WH_ADDR[po.wh], intra = to.code === s.code, d = po.created;
    var src = po.lines.map(function (l) { return { sku: l.sku, qty: l.pq * E.item(l.sku).buy.per, rate: l.cost * 100 }; }), ls = taxLines(src, intra), t = totals(ls);
    var rows = ls.map(function (l, i) {
      var pl = po.lines[i], it = l.it, bq = it.buy.unit === 'each' ? pl.pq + ' pcs' : it.buy.per > 1 ? pl.pq + ' ' + it.buy.unit + (pl.pq === 1 ? '' : (it.buy.unit === 'box' ? 'es' : 's')) + ' of ' + it.buy.per : pl.pq + ' ' + it.buy.unit + (pl.pq === 1 ? '' : 's'), vs = E.vendorSku(l.sku);
      return '<tr><td class="c-n">' + mn(i + 1) + '</td><td><b>' + esc(it.name) + '</b><span class="sub">' + mn(l.sku) + (vs ? ' · supplier code ' + mn(esc(vs)) : '') + '</span></td><td class="c-m">' + mn(it.hsn) + '</td><td>' + mn(bq.split(' ')[0]) + ' ' + esc(bq.split(' ').slice(1).join(' ')) + '</td><td class="c-r">' + mn(l.qty) + '</td><td class="c-r">' + mn(p2(l.rate)) + '</td><td class="c-r">' + mn(l.gst + '%') + '</td><td class="c-r">' + mn(p2(l.taxable)) + '</td></tr>';
    }).join('');
    var h = letterhead(po.id, ['Purchase order', po.status === 'draft' ? 'Draft · not yet sent to the supplier' : 'Original for supplier'])
      + meta([['PO no.', mn(po.id)], ['Date', mn(dstr(d))], ['Expected by', po.eta ? mn(dstr(po.eta)) : 'On approval + ' + mn(s.lead) + ' days'], ['Payment terms', esc(s.terms)], ['Deliver to', esc(to.name)], ['Place of supply', esc(to.state) + ' (' + mn(to.code) + ')']])
      + '<div class="ptys">' + party('Supplier', s.name, [s.addr, s.city + ', ' + s.state + ' ' + s.pin, 'Attn: ' + s.person + ' · ' + s.phone], 'GSTIN ' + mn(s.gstin)) + party('Deliver to', CO.name + ' · ' + to.name, [to.addr, to.city + ', ' + to.state + ' ' + to.pin], 'GSTIN ' + mn(to.gstin)) + '</div>'
      + '<table class="lines"><thead><tr><th class="c-n">#</th><th>Item</th><th class="c-m">HSN</th><th>Order</th><th class="c-r">Units</th><th class="c-r">Rate (₹)</th><th class="c-r">GST</th><th class="c-r">Amount (₹)</th></tr></thead><tbody>' + rows + '</tbody></table>'
      + '<dl class="tots"><div><dt>Order value</dt><dd>' + mn(p2(t.taxable)) + '</dd></div>' + (intra ? '<div><dt>CGST</dt><dd>' + mn(p2(t.cg)) + '</dd></div><div><dt>SGST</dt><dd>' + mn(p2(t.sg)) + '</dd></div>' : '<div><dt>IGST</dt><dd>' + mn(p2(t.ig)) + '</dd></div>') + '<div><dt>Round off</dt><dd>' + mn((t.round < 0 ? '−' : '') + p2(Math.abs(t.round))) + '</dd></div><div class="gt"><dt>Total</dt><dd>' + mn('₹' + FMT2.format(t.rupees)) + '</dd></div></dl>'
      + '<p class="words"><span>Amount in words</span><b>' + V.rupeesInWords(t.rupees) + '</b></p>'
      + '<div class="cols2"><div class="terms"><h3>Terms</h3><ol><li>Deliver to the address above, with a delivery challan and tax invoice for each consignment.</li><li>Cartons carry the item code and our PO number on the outside.</li><li>Short or damaged goods are returned at the supplier’s cost.</li><li>Rates are fixed for this order. Tax is shown at the rate in force.</li></ol></div>'
      + '<div class="terms"><h3>Send invoices to</h3><p>' + esc(CO.mail) + '</p><p>Quote the PO number on every invoice.</p></div></div>'
      + sign(['Prepared by · Meera Rao, Inventory lead', 'For ' + CO.name + ' · Authorised signatory']) + foot();
    return sheet('po', h);
  }

  /* ---------- goods receipt note ---------- */
  function grn(po) {
    var s = E.supplier(po.supplier), to = H.WH_ADDR[po.wh], last = po.receipts.reduce(function (a, g) { return Math.max(a, g.t); }, 0), no = 'GRN/' + fy(last) + '/' + seqOf(po.id);
    var ordered = 0, got = 0, short = 0;
    var rows = po.lines.map(function (l, i) {
      var it = E.item(l.sku), ord = l.pq * it.buy.per, rec = l.recv * it.buy.per, bins = {}, lots = {};
      po.receipts.forEach(function (g) { g.lines.forEach(function (x) { if (x.sku === l.sku) { bins[x.bin] = 1; if (x.lot) lots[x.lot] = 1; } }); });
      ordered += ord; got += rec; short += Math.max(0, ord - rec);
      return '<tr><td class="c-n">' + mn(i + 1) + '</td><td><b>' + esc(it.name) + '</b><span class="sub">' + mn(l.sku) + (Object.keys(lots).length ? ' · lot ' + Object.keys(lots).map(mn).join(', ') : '') + '</span></td><td class="c-r">' + mn(ord) + '</td><td class="c-r">' + mn(rec) + '</td><td class="c-r' + (ord > rec ? ' short' : '') + '">' + (ord > rec ? mn(ord - rec) : mn('–')) + '</td><td>' + (Object.keys(bins).map(mn).join('<br>') || '–') + '</td></tr>';
    }).join('');
    var val = 0; po.lines.forEach(function (l) { val += l.recv * E.item(l.sku).buy.per * l.cost * 100; });
    var h = letterhead(no, ['Goods receipt note', short ? 'Part delivery · ' + short + ' units still to come' : 'Delivery complete'])
      + meta([['GRN no.', mn(no)], ['Date received', mn(dstr(last))], ['Purchase order', mn(po.id)], ['Supplier', esc(s.name)], ['Received at', esc(to.name)], ['Received by', 'Ravi Kumar, dock']])
      + '<div class="ptys">' + party('Supplier', s.name, [s.addr, s.city + ', ' + s.state + ' ' + s.pin], 'GSTIN ' + mn(s.gstin)) + party('Received at', to.name, [to.addr, to.city + ', ' + to.state + ' ' + to.pin], 'GSTIN ' + mn(to.gstin)) + '</div>'
      + '<table class="lines"><thead><tr><th class="c-n">#</th><th>Item</th><th class="c-r">Ordered</th><th class="c-r">Received</th><th class="c-r">Short</th><th>Put away to bin</th></tr></thead><tbody>' + rows +
      '<tr class="tot"><td></td><td>Total units</td><td class="c-r">' + mn(ordered) + '</td><td class="c-r">' + mn(got) + '</td><td class="c-r">' + mn(short || '–') + '</td><td></td></tr></tbody></table>'
      + '<h3 class="sec">Deliveries booked against this order</h3><table class="lines sm"><thead><tr><th>Receipt</th><th>Date</th><th class="c-r">Lines</th><th class="c-r">Units</th><th>Received by</th></tr></thead><tbody>' +
      po.receipts.map(function (g) { return '<tr><td>' + mn(g.id) + '</td><td>' + mn(dstr(g.t)) + '</td><td class="c-r">' + mn(g.lines.length) + '</td><td class="c-r">' + mn(g.lines.reduce(function (a, x) { return a + x.units; }, 0)) + '</td><td>Ravi Kumar</td></tr>'; }).join('') + '</tbody></table>'
      + '<dl class="tots wide"><div class="gt"><dt>Value received, at cost, before tax</dt><dd>' + mn('₹' + FMT2.format(val / 100)) + '</dd></div></dl>'
      + '<p class="note">' + (short ? 'The supplier owes ' + mn(short) + ' more units against ' + mn(po.id) + '. Stock received so far is on the shelves and counted in Stockroom.' : 'Every unit ordered has arrived and been put away.') + ' Condition on arrival: checked against the delivery challan; any damage is recorded in the stock ledger.</p>'
      + sign(['Received by · Ravi Kumar, dock', 'Checked by · storekeeper', 'Approved by · Inventory lead']) + foot();
    return sheet('grn', h);
  }

  /* ---------- entry points ---------- */
  var NAMES = { challan: 'Delivery challan', invoice: 'Tax invoice', eway: 'E-way bill summary', po: 'Purchase order', grn: 'Goods receipt note' };
  V.docName = function (k) { return NAMES[k]; };
  V.docHTML = function (kind, id) {
    var so = (kind === 'challan' || kind === 'invoice' || kind === 'eway') ? E.so(id) : null, po = (kind === 'po' || kind === 'grn') ? E.po(id) : null;
    if (kind === 'challan') return so && (so.status === 'picked' || so.status === 'dispatched') ? challan(so) : notFound('A delivery challan is made once the order is packed.');
    if (kind === 'invoice') return so && so.status === 'dispatched' ? invoice(so) : notFound('A tax invoice is made once the order is dispatched.');
    if (kind === 'eway') return so && so.status === 'dispatched' && V.invoiceCalc(so).eway ? eway(so) : notFound('An e-way bill is needed only when the invoice is over ₹50,000 and the order is dispatched.');
    if (kind === 'po') return po && po.status !== 'cancelled' ? purchaseOrder(po) : notFound('This purchase order is not available.');
    if (kind === 'grn') return po && po.receipts.length ? grn(po) : notFound('A goods receipt note is made after the first delivery is received.');
    return notFound('There is no such paper.');
  };
  V.docBack = function (kind, id) { return (kind === 'po' || kind === 'grn') ? '#/purchasing/' + id : '#/sales/' + id; };
  V.docOthers = function (kind, id) {
    var isSO = kind === 'challan' || kind === 'invoice' || kind === 'eway';
    return V.docsFor(isSO ? 'so' : 'po', id).filter(function (d) { return d.ok && d.k !== kind; });
  };
  V.doc = function (U) {
    var r = U.doc, kind = r.kind, id = r.id, html = V.docHTML(kind, id), back = V.docBack(kind, id), others = V.docOthers(kind, id);
    return '<div class="page docpage"><div class="docbar"><a class="btn" href="' + back + '">' + V.icon('right', 'sm').replace('<svg', '<svg style="transform:scaleX(-1)"') + 'Back to the order</a><span class="docbar-t"><b>' + (NAMES[kind] || 'Paper') + '</b> <span class="mono">' + esc(id) + '</span></span>' +
      (others.length ? '<span class="docbar-o">' + others.map(function (d) { return '<a class="btn ghost sm" href="#/doc/' + d.k + '/' + id + '">' + d.label + '</a>'; }).join('') + '</span>' : '') +
      '<button type="button" class="btn primary docbar-p" data-act="doc-print">' + V.icon('print') + 'Print</button></div>' +
      '<div class="docfit" id="docfit"><div class="docscale" id="docscale">' + html + '</div></div></div>';
  };
})();
