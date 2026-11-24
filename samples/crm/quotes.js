/* Lumen CRM Pro — quotes (from deal line items: discount capped by role, GST split by place of supply, HSN/SAC,
   amount in words, printable PDF-style document, status workflow, revisions) and after-sales tickets. */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$, V = C.views, page = C.page;
  var P = function () { return C.P(); };
  var D = 864e5;
  var SELLER = { name: 'Lumen Homes Interiors Pvt. Ltd.', addr: 'Plot 18, Sector 44, Gurugram, Haryana 122003', gstin: '06AAKCL4821M1Z9', state: 'Haryana', code: '06', email: 'quotes@lumenhomes.example', bank: 'Account and IFSC shared on request' };
  var STATE = { Gurugram: ['Haryana', '06'], Faridabad: ['Haryana', '06'], Noida: ['Uttar Pradesh', '09'], 'Greater Noida': ['Uttar Pradesh', '09'], Indirapuram: ['Uttar Pradesh', '09'], 'New Delhi': ['Delhi', '07'], Saket: ['Delhi', '07'], Dwarka: ['Delhi', '07'], 'Vasant Kunj': ['Delhi', '07'], Rohini: ['Delhi', '07'], Pitampura: ['Delhi', '07'] };
  var HSN = { Seating: '9401', Sofas: '9401', Tables: '9403', Storage: '9403', Lighting: '9405', Textiles: '5705' };
  function hsn(it) { if (!it.sku) return '998391'; var s = C.sku(it.sku); return s ? (it.sku === 'HS-TX-020' ? '6304' : HSN[s.cat] || '9403') : '9403'; }
  function quote(id) { return P().quotes.filter(function (q) { return q.id === id; })[0]; }
  function billTo(q) { var d = C.deal(q.d) || {}, co = d.co && C.company(d.co), c = d.c && C.contact(d.c); return { co: co, c: c, city: (co && co.city) || (c && c.city) || 'Gurugram' }; }
  C.quoteTotal = function (q) {
    var sub = q.items.reduce(function (s, i) { return s + i.qty * i.price; }, 0), disc = Math.round(sub * (q.disc || 0) / 100), taxable = sub - disc;
    var st = (STATE[billTo(q).city] || ['Haryana', '06']), intra = st[1] === SELLER.code, tax = Math.round(taxable * (q.gst || 18) / 100);
    return { sub: sub, disc: disc, taxable: taxable, intra: intra, state: st[0], code: st[1], cgst: intra ? Math.round(tax / 2) : 0, sgst: intra ? tax - Math.round(tax / 2) : 0, igst: intra ? 0 : tax, tax: tax, total: taxable + tax };
  };
  // Indian-system amount in words: "Seven lakh twenty thousand two hundred seventy-two"
  function words(n) {
    var a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'], b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    var two = function (x) { return x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? '-' + a[x % 10] : ''); };
    var three = function (x) { return (x >= 100 ? a[Math.floor(x / 100)] + ' hundred' + (x % 100 ? ' ' : '') : '') + (x % 100 ? two(x % 100) : ''); };
    n = Math.round(n); if (!n) return 'zero';
    var out = [], cr = Math.floor(n / 1e7), lk = Math.floor(n / 1e5) % 100, th = Math.floor(n / 1e3) % 100, rest = n % 1000;
    if (cr) out.push(three(cr) + ' crore'); if (lk) out.push(two(lk) + ' lakh'); if (th) out.push(two(th) + ' thousand'); if (rest) out.push(three(rest));
    var s = out.join(' '); return s.charAt(0).toUpperCase() + s.slice(1);
  }
  C.amountWords = words;
  function refreshStatus() { var now = Date.now(); P().quotes.forEach(function (q) { if (q.status === 'sent' && q.valid < now) q.status = 'expired'; }); }
  var QST = { draft: 'Draft', sent: 'Sent', accepted: 'Accepted', declined: 'Declined', expired: 'Expired', superseded: 'Superseded' };

  // ---- create / revise -------------------------------------------------------------------------------
  function nextNo() { var n = P().quotes.reduce(function (m, q) { return Math.max(m, parseInt(q.id.split('-').pop(), 10) || 0); }, 0) + 1; return 'Q-' + new Date().getFullYear() + '-' + String(n).padStart(3, '0'); }
  C.acts['quote-new'] = function (el) {
    var d = C.deal(el.dataset.id); if (!d) return; if (!C.can('edit', d)) { C.deny('create quotes on deals owned by others'); return; }
    if (!d.items.length) { C.toast('Add line items to the deal first', { icon: 'x' }); return; }
    var prev = P().quotes.filter(function (q) { return q.d === d.id && q.status !== 'superseded'; }), ver = P().quotes.filter(function (q) { return q.d === d.id; }).reduce(function (m, q) { return Math.max(m, q.ver); }, 0) + 1;
    prev.forEach(function (q) { if (q.status === 'draft' || q.status === 'sent' || q.status === 'expired') q.status = 'superseded'; });
    var q = { id: nextNo(), d: d.id, ver: ver, status: 'draft', items: JSON.parse(JSON.stringify(d.items)), disc: 0, gst: 18, valid: Date.now() + 15 * D, created: Date.now(), sentAt: null, by: C.me().name, note: 'Prices include delivery within Delhi NCR. Installation by Lumen Homes. 40% advance, 40% on material delivery, 20% on handover.' };
    P().quotes.push(q);
    C.pact('quote', 'Quote ' + q.id + ' v' + ver + ' drafted from the deal’s line items', { c: d.c, co: d.co, d: d.id }, C.me().name); C.audit('create', { t: 'quote', id: q.id, name: q.id + ' · ' + d.name }); C.save();
    location.hash = '#/quotes/' + q.id; C.toast('Draft quote ' + q.id + ' created', { icon: 'quote' });
  };
  function setStatus(q, st, note) {
    var d = C.deal(q.d), from = q.status; q.status = st; if (st === 'sent') { q.sentAt = Date.now(); q.valid = Math.max(q.valid, Date.now() + 15 * D); }
    C.pact('quote', 'Quote ' + q.id + ' v' + q.ver + ' ' + (st === 'sent' ? 'sent on WhatsApp and email' : st) + (note ? ' — ' + note : ''), { c: d.c, co: d.co, d: d.id }, C.me().name);
    C.audit('status', { t: 'quote', id: q.id, name: q.id + ' · ' + d.name }, 'Quote status', QST[from], QST[st]); C.save();
    return from;
  }
  function cur() { return quote(C.cur.arg); }
  C.acts['q-send'] = function () { var q = cur(); var from = setStatus(q, 'sent'); C.rerender(); C.toast(q.id + ' sent', { icon: 'send', undo: function () { q.status = from; q.sentAt = null; C.save(); C.rerender(); } }); };
  C.acts['q-accept'] = function () {
    var q = cur(), d = C.deal(q.d); setStatus(q, 'accepted'); d.items = JSON.parse(JSON.stringify(q.items)); C.save(); C.rerender();
    var won = C.PIPES[d.pipe].stages.filter(function (s) { return s.won; })[0];
    C.toast('Accepted · deal line items updated from the quote', { icon: 'check' });
    if (C.dealOpen(d)) C.dialog('Quote accepted', '<p><b>' + esc(d.name) + '</b> is in ' + esc(C.pstage(d.pipe, d.stage).label) + '. Mark it as won now? Stage gates still apply (Won needs the token advance).</p>', 'Mark deal as won', function () { setTimeout(function () { if (C.moveDeal(d, won.id, { after: function () { C.rerender(); } })) C.rerender(); }, 30); });
  };
  C.acts['q-decline'] = function () { var q = cur(); C.dialog('Mark as declined', '<div class="field"><label for="qd-r">Reason</label><select id="qd-r" name="r"><option>Price too high</option><option>Chose another vendor</option><option>Scope changed</option><option>Project on hold</option></select></div>', 'Mark declined', function (fd) { setStatus(q, 'declined', fd.get('r')); setTimeout(C.rerender, 20); }); };
  C.acts['q-revise'] = function () { var q = cur(); C.acts['quote-new']({ dataset: { id: q.d } }); };
  C.acts['q-print'] = function () { document.body.classList.add('printing'); setTimeout(function () { window.print(); document.body.classList.remove('printing'); }, 60); };
  C.acts['q-refresh'] = function () { var q = cur(), d = C.deal(q.d); q.items = JSON.parse(JSON.stringify(d.items)); C.audit('update', { t: 'quote', id: q.id, name: q.id }, 'Line items', '', 'refreshed from deal'); C.save(); C.rerender(); C.toast('Line items refreshed from the deal'); };
  C.chs['q-disc'] = function (el) {
    var q = cur(), v = Math.max(0, +el.value || 0), cap = C.perm('discount') || 0;
    if (v > cap) { C.toast('Your role (' + C.ROLE_LABEL[C.me().role] + ') can give up to ' + cap + '% discount. Ask a manager for more.', { icon: 'lock' }); v = cap; }
    var ov = q.disc; q.disc = v; C.audit('update', { t: 'quote', id: q.id, name: q.id }, 'Discount', ov + '%', v + '%'); C.save(); C.rerender(); var x = $('#q-disc'); if (x) x.focus();
  };
  C.chs['q-valid'] = function (el) { var q = cur(); q.valid = q.created + (+el.value) * D; C.save(); C.rerender(); };
  C.ins['q-note'] = function (el) { var q = cur(); q.note = el.value; clearTimeout(C._qn); C._qn = setTimeout(C.save, 400); };

  // ---- quotes list ----------------------------------------------------------------------------------------
  function QS() { return C.ui.ql || (C.ui.ql = { st: 'open' }); }
  function quotesList() {
    refreshStatus();
    var u = QS(), L = P().quotes.filter(function (q) { var d = C.deal(q.d); return d && C.visible(d); }), F = L.filter(function (q) { return u.st === 'all' ? q.status !== 'superseded' : u.st === 'open' ? q.status === 'draft' || q.status === 'sent' : q.status === u.st; }).sort(function (a, b) { return b.created - a.created; });
    var sum = function (st) { return L.filter(function (q) { return q.status === st; }).reduce(function (s, q) { return s + C.quoteTotal(q).total; }, 0); };
    return page('Quotes', 'Every quote with GST, discount and status · created from a deal’s Halden Supply line items', C.can('export') ? '<button type="button" class="btn" data-act="q-export">' + C.ic('down', 14) + 'Export</button>' : '') + C.scopeNote() +
      '<div class="kpis"><div><span>Out for decision</span><b>' + C.rs(sum('sent')) + '</b><small>' + L.filter(function (q) { return q.status === 'sent'; }).length + ' sent</small></div><div><span>Accepted</span><b>' + C.rs(sum('accepted')) + '</b><small>incl. GST</small></div><div><span>Drafts</span><b>' + L.filter(function (q) { return q.status === 'draft'; }).length + '</b><small>not sent yet</small></div><div><span>Acceptance rate</span><b>' + (function () { var dec = L.filter(function (q) { return ['accepted', 'declined', 'expired'].indexOf(q.status) > -1; }); return dec.length ? Math.round(L.filter(function (q) { return q.status === 'accepted'; }).length / dec.length * 100) : 0; })() + '%</b><small>of decided quotes</small></div></div>' +
      '<section class="card flush"><div class="toolbar"><div class="seg" role="group" aria-label="Status">' + [['open', 'Open'], ['accepted', 'Accepted'], ['declined', 'Declined'], ['expired', 'Expired'], ['all', 'All']].map(function (x) { return '<button type="button" data-act="ql-st" data-v="' + x[0] + '" aria-pressed="' + (u.st === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div><span class="count">' + F.length + ' quotes</span></div>' +
      (F.length ? '<div class="tablewrap"><table class="tbl dense"><thead><tr><th scope="col">Quote</th><th scope="col">Deal</th><th scope="col">Status</th><th scope="col" class="num">Discount</th><th scope="col" class="num">Total incl. GST</th><th scope="col">Valid until</th><th scope="col">Owner</th></tr></thead><tbody>' + F.map(function (q) { var d = C.deal(q.d), t = C.quoteTotal(q); return '<tr tabindex="0" data-href="#/quotes/' + q.id + '"><td><a class="lname mono" href="#/quotes/' + q.id + '">' + q.id + '</a> <span class="muted sm">v' + q.ver + '</span></td><td class="tr">' + esc(d.name) + '</td><td><span class="qst ' + q.status + '">' + QST[q.status] + '</span></td><td class="num">' + (q.disc ? q.disc + '%' : '—') + '</td><td class="num"><b>' + C.inr(t.total) + '</b></td><td class="muted nw ' + (q.status === 'sent' && q.valid - Date.now() < 3 * D ? 'late' : '') + '">' + C.dshort(q.valid) + '</td><td><span class="own">' + C.avatar(q.by, 18) + esc(q.by.split(' ')[0]) + '</span></td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="empty-st">' + C.ic('quote', 22) + '<b>No quotes here</b><span>Open a deal in Proposal, check its line items, and press “Create quote”.</span><a class="btn" href="#/deals">Go to deals</a></div>') + '</section>';
  }
  C.acts['ql-st'] = function (el) { QS().st = el.dataset.v; C.rerender(); var b = $('[data-act="ql-st"][data-v="' + el.dataset.v + '"]'); if (b) b.focus(); };
  C.acts['q-export'] = function () { C.exportCSV('quotes', [['Quote', function (q) { return q.id; }], ['Version', function (q) { return q.ver; }], ['Deal', function (q) { return (C.deal(q.d) || {}).name; }], ['Status', function (q) { return QST[q.status]; }], ['Subtotal', function (q) { return C.quoteTotal(q).sub; }], ['Discount', function (q) { return C.quoteTotal(q).disc; }], ['GST', function (q) { return C.quoteTotal(q).tax; }], ['Total', function (q) { return C.quoteTotal(q).total; }], ['Valid until', function (q) { return new Date(q.valid).toISOString().slice(0, 10); }], ['Owner', function (q) { return q.by; }]], P().quotes.filter(function (q) { return q.status !== 'superseded'; })); };

  // ---- quote document ------------------------------------------------------------------------------------
  function quotePage(q) {
    refreshStatus();
    var d = C.deal(q.d); if (!d || !C.visible(d)) return C.noAccess('quote');
    var t = C.quoteTotal(q), b = billTo(q), canE = C.can('edit', d), draft = q.status === 'draft', vdays = Math.round((q.valid - q.created) / D);
    var others = P().quotes.filter(function (x) { return x.d === q.d && x.id !== q.id; }).sort(function (a, b2) { return b2.ver - a.ver; });
    var actions = !canE ? '' : draft ? '<button type="button" class="btn pri" data-act="q-send">' + C.ic('send', 14) + 'Send to customer</button>' : q.status === 'sent' ? '<button type="button" class="btn pri" data-act="q-accept">' + C.ic('check', 14) + 'Mark accepted</button><button type="button" class="btn" data-act="q-decline">Declined</button><button type="button" class="btn" data-act="q-revise">Revise</button>' : q.status === 'expired' || q.status === 'declined' ? '<button type="button" class="btn" data-act="q-revise">' + C.ic('refresh', 14) + 'Create a revised version</button>' : '';
    var side = '<aside class="q-side"><section class="card"><div class="card-h"><div><h2>Status</h2><p class="sub">' + (q.sentAt ? 'Sent ' + C.dt(q.sentAt) : 'Not sent yet') + '</p></div><span class="qst ' + q.status + '">' + QST[q.status] + '</span></div><ol class="qflow">' + ['draft', 'sent', 'accepted'].map(function (s, i) { var order = { draft: 0, sent: 1, accepted: 2, declined: 2, expired: 2, superseded: 1 }[q.status]; return '<li class="' + (i < order ? 'done' : i === order ? 'now' : '') + '">' + QST[s] + '</li>'; }).join('') + '</ol><div class="q-acts">' + actions + '<button type="button" class="btn" data-act="q-print">' + C.ic('print', 14) + 'Print or save PDF</button></div></section>' +
      (draft && canE ? '<section class="card"><div class="card-h"><div><h2>Edit draft</h2><p class="sub">Your role allows up to ' + (C.perm('discount') || 0) + '% discount</p></div></div><div class="row2"><div class="field"><label for="q-disc">Discount %</label><input id="q-disc" type="number" min="0" max="100" step="0.5" value="' + q.disc + '" data-ch="q-disc"></div><div class="field"><label for="q-valid">Valid for</label><select id="q-valid" data-ch="q-valid">' + [7, 15, 30].map(function (n) { return '<option value="' + n + '"' + (n === vdays ? ' selected' : '') + '>' + n + ' days</option>'; }).join('') + '</select></div></div><div class="field"><label for="q-note">Terms shown on the quote</label><textarea id="q-note" rows="4" data-in="q-note">' + esc(q.note || '') + '</textarea></div><button type="button" class="btn sm" data-act="q-refresh">' + C.ic('refresh', 13) + 'Refresh items from the deal</button></section>' : '') +
      '<section class="card"><div class="card-h"><div><h2>Versions</h2></div></div><ul class="mlist">' + [q].concat(others).map(function (x) { return '<li><a href="#/quotes/' + x.id + '" class="mono"' + (x.id === q.id ? ' aria-current="page"' : '') + '>' + x.id + ' · v' + x.ver + '</a><span class="qst ' + x.status + '">' + QST[x.status] + '</span><b class="nw">' + C.rs(C.quoteTotal(x).total) + '</b></li>'; }).join('') + '</ul></section></aside>';
    var doc = '<article class="qdoc" aria-label="Quotation ' + q.id + '"><header class="qd-h"><div class="qd-brand"><span class="qd-logo" aria-hidden="true">L</span><div><b>' + SELLER.name + '</b><span>' + SELLER.addr + '</span><span>GSTIN ' + SELLER.gstin + ' · ' + SELLER.email + '</span></div></div><div class="qd-t"><h1>Quotation</h1><dl><dt>Number</dt><dd class="mono">' + q.id + (q.ver > 1 ? ' (rev. ' + q.ver + ')' : '') + '</dd><dt>Date</dt><dd>' + C.dfull(q.created) + '</dd><dt>Valid until</dt><dd>' + C.dfull(q.valid) + '</dd></dl></div></header>' +
      '<section class="qd-parties"><div><h2>Bill to</h2><b>' + esc(b.co ? b.co.name : b.c ? b.c.name : '—') + '</b>' + (b.co && b.c ? '<span>Attn: ' + esc(b.c.name) + ', ' + esc(b.c.role) + '</span>' : '') + '<span>' + esc(b.city) + ', ' + esc(t.state) + '</span>' + (b.co && b.co.cf && b.co.cf.gstin ? '<span>GSTIN ' + esc(b.co.cf.gstin) + '</span>' : '') + '</div><div><h2>Project</h2><b>' + esc(d.name.split(' — ').pop()) + '</b><span>Deal ' + d.id + ' · ' + esc(d.owner) + '</span><span>Place of supply: ' + esc(t.state) + ' (' + t.code + ')</span></div></section>' +
      '<div class="tablewrap"><table class="qd-tbl"><thead><tr><th scope="col">#</th><th scope="col">Description</th><th scope="col">HSN/SAC</th><th scope="col" class="num">Qty</th><th scope="col" class="num">Rate</th><th scope="col" class="num">Amount</th></tr></thead><tbody>' + q.items.map(function (it, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc(it.name) + (it.sku ? '<small class="mono">' + it.sku + ' · Halden Supply</small>' : '<small>Service</small>') + '</td><td class="mono">' + hsn(it) + '</td><td class="num">' + it.qty + '</td><td class="num">' + C.inr(it.price) + '</td><td class="num">' + C.inr(it.qty * it.price) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<section class="qd-sum"><div class="qd-words"><h2>Amount in words</h2><p>' + words(t.total) + ' rupees only</p><h2>Terms</h2><p>' + esc(q.note || '').replace(/\n/g, '<br>') + '</p></div><dl class="qd-tot"><dt>Subtotal</dt><dd>' + C.inr(t.sub) + '</dd>' + (t.disc ? '<dt>Discount (' + q.disc + '%)</dt><dd>− ' + C.inr(t.disc) + '</dd><dt>Taxable value</dt><dd>' + C.inr(t.taxable) + '</dd>' : '') + (t.intra ? '<dt>CGST 9%</dt><dd>' + C.inr(t.cgst) + '</dd><dt>SGST 9%</dt><dd>' + C.inr(t.sgst) + '</dd>' : '<dt>IGST 18%</dt><dd>' + C.inr(t.igst) + '</dd>') + '<dt class="tot">Total</dt><dd class="tot">' + C.inr(t.total) + '</dd></dl></section>' +
      '<footer class="qd-f"><span>Prepared by ' + esc(q.by) + ' · Lumen Homes</span><span>' + SELLER.bank + '</span></footer></article>';
    return C.recBack('#/deals/' + d.id, esc(d.name.split(' — ').pop())) + '<div class="q-wrap">' + doc + side + '</div>';
  }
  V.quotes = {
    title: function () { var q = C.cur && C.cur.arg && quote(C.cur.arg); return q ? 'Quote ' + q.id : 'Quotes'; },
    render: function () { var q = C.cur.arg && quote(C.cur.arg); return q ? quotePage(q) : quotesList(); }
  };

  // ===== tickets =============================================================================================
  var TST = { open: 'Open', pending: 'Pending', closed: 'Closed' }, PRIO = ['Low', 'Normal', 'High', 'Urgent'];
  function ticket(id) { return P().tickets.filter(function (t) { return t.id === id; })[0]; }
  function TSs() { return C.ui.tk || (C.ui.tk = { st: 'active', prio: 'all' }); }
  C.acts['tk-new'] = function (el) {
    var key = (el.dataset.key || '').split(':'), t0 = key[0], id0 = key[1], deals = P().deals.filter(function (d) { return C.visible(d) && C.pstage(d.pipe, d.stage).won; });
    var pre = t0 === 'deal' ? id0 : t0 === 'contact' ? (deals.filter(function (d) { return d.c === id0; })[0] || {}).id : t0 === 'company' ? (deals.filter(function (d) { return d.co === id0; })[0] || {}).id : '';
    C.dialog('New service ticket', '<div class="field"><label for="tk-s">Issue</label><input id="tk-s" name="subj" required autocomplete="off" placeholder="e.g. Wardrobe shutter hinge loose"></div><div class="row2"><div class="field"><label for="tk-d">Project (won deal)</label><select id="tk-d" name="d">' + deals.map(function (d) { return '<option value="' + d.id + '"' + (d.id === pre ? ' selected' : '') + '>' + esc(d.name) + '</option>'; }).join('') + '</select></div><div class="field"><label for="tk-p">Priority</label><select id="tk-p" name="prio">' + PRIO.map(function (p) { return '<option' + (p === 'Normal' ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></div></div><div class="row2"><div class="field"><label for="tk-c">Reported via</label><select id="tk-c" name="ch"><option value="whatsapp">WhatsApp</option><option value="phone">Phone</option><option value="email">Email</option></select></div><div class="field"><label for="tk-o">Owner</label><select id="tk-o" name="owner">' + P().users.map(function (u) { return '<option' + (u.name === C.me().name ? ' selected' : '') + '>' + esc(u.name) + '</option>'; }).join('') + '</select></div></div>', 'Create ticket', function (fd) {
      var subj = (fd.get('subj') || '').trim(), d = C.deal(fd.get('d')); if (!subj || !d) return false;
      var t = { id: C.nextId(P().tickets, 'TK-', 300), subj: subj, prio: fd.get('prio'), status: 'open', ch: fd.get('ch'), d: d.id, c: d.c, co: d.co, owner: fd.get('owner'), created: Date.now(), updated: Date.now(), log: [] };
      P().tickets.unshift(t); C.pact('ticket', 'Ticket ' + t.id + ' opened: ' + subj, { c: d.c, co: d.co, d: d.id }, C.me().name); C.audit('create', { t: 'ticket', id: t.id, name: t.subj });
      if (t.owner !== C.me().name) C.notify(C.me().name.split(' ')[0] + ' assigned you ticket ' + t.id + ': ' + subj, '#/tickets/' + t.id, 'ticket', t.owner);
      C.save(); location.hash = '#/tickets/' + t.id;
    });
  };
  function ticketsList() {
    var u = TSs(), L = P().tickets.filter(function (t) { return C.visibleOwner(t.owner); }), F = L.filter(function (t) { return (u.st === 'all' || (u.st === 'active' ? t.status !== 'closed' : t.status === u.st)) && (u.prio === 'all' || t.prio === u.prio); }).sort(function (a, b) { return PRIO.indexOf(b.prio) - PRIO.indexOf(a.prio) || b.updated - a.updated; });
    var age = function (t) { return Math.round((Date.now() - t.created) / 36e5); };
    return page('Tickets', 'After-sales service for won projects · snags, replacements and paperwork', '<button type="button" class="btn pri" data-act="tk-new">' + C.ic('plus', 14) + 'New ticket</button>') + C.scopeNote() +
      '<div class="kpis"><div><span>Open</span><b>' + L.filter(function (t) { return t.status === 'open'; }).length + '</b><small>' + L.filter(function (t) { return t.status === 'open' && (t.prio === 'High' || t.prio === 'Urgent'); }).length + ' high or urgent</small></div><div><span>Waiting on customer</span><b>' + L.filter(function (t) { return t.status === 'pending'; }).length + '</b><small>pending</small></div><div><span>Closed</span><b>' + L.filter(function (t) { return t.status === 'closed'; }).length + '</b><small>all time</small></div><div><span>Oldest open</span><b>' + (function () { var o = L.filter(function (t) { return t.status !== 'closed'; }).sort(function (a, b) { return a.created - b.created; })[0]; return o ? Math.round(age(o) / 24) + ' days' : '—'; })() + '</b><small>since reported</small></div></div>' +
      '<section class="card flush"><div class="toolbar"><div class="seg" role="group" aria-label="Status">' + [['active', 'Active'], ['open', 'Open'], ['pending', 'Pending'], ['closed', 'Closed'], ['all', 'All']].map(function (x) { return '<button type="button" data-act="tk-st" data-v="' + x[0] + '" aria-pressed="' + (u.st === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div><label class="sr" for="tk-pf">Priority</label><select id="tk-pf" class="sel" data-ch="tk-prio"><option value="all">Any priority</option>' + PRIO.map(function (p) { return '<option' + (u.prio === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select><span class="count">' + F.length + ' tickets</span></div>' +
      (F.length ? '<div class="tablewrap"><table class="tbl dense"><thead><tr><th scope="col">Ticket</th><th scope="col">Project</th><th scope="col">Priority</th><th scope="col">Status</th><th scope="col">Via</th><th scope="col">Owner</th><th scope="col">Updated</th></tr></thead><tbody>' + F.map(function (t) { var d = C.deal(t.d) || {}; return '<tr tabindex="0" data-href="#/tickets/' + t.id + '"><td class="c-main"><a class="lname" href="#/tickets/' + t.id + '">' + esc(t.subj) + '</a><div class="muted sm mono">' + t.id + '</div></td><td class="tr muted">' + esc((d.name || '').split(' — ')[0]) + '</td><td><span class="prio p-' + t.prio.toLowerCase() + '">' + t.prio + '</span></td><td><span class="tst ' + t.status + '">' + TST[t.status] + '</span></td><td class="muted">' + { whatsapp: 'WhatsApp', phone: 'Phone', email: 'Email' }[t.ch] + '</td><td><span class="own">' + C.avatar(t.owner, 18) + esc(t.owner.split(' ')[0]) + '</span></td><td class="muted nw">' + C.rel(t.updated) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="empty-st">' + C.ic('ticket', 22) + '<b>No tickets match</b><span>When a customer reports a snag after handover, log it here so it gets an owner and a fix date.</span></div>') + '</section>';
  }
  C.acts['tk-st'] = function (el) { TSs().st = el.dataset.v; C.rerender(); var b = $('[data-act="tk-st"][data-v="' + el.dataset.v + '"]'); if (b) b.focus(); };
  C.chs['tk-prio'] = function (el) { TSs().prio = el.value; C.rerender(); var x = $('#tk-pf'); if (x) x.focus(); };
  function ticketPage(t) {
    if (!C.visibleOwner(t.owner)) return C.noAccess('ticket');
    var d = C.deal(t.d) || {}, c = t.c && C.contact(t.c), canE = C.can('edit', t), log = (t.log || []).slice().reverse();
    var acts = C.timeline({ d: t.d }).filter(function (a) { return a.type === 'ticket' && a.text.indexOf(t.id) > -1; });
    var sel = function (ch, opts, curv, lab) { return '<label class="sr" for="tk-' + ch + '">' + lab + '</label><select id="tk-' + ch + '" class="sel sm" data-ch="tk-set" data-f="' + ch + '"' + (canE ? '' : ' disabled') + '>' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === curv ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; };
    return C.recBack('#/tickets', 'Tickets') + '<header class="rec-h"><div class="rec-id"><span class="deal-ic">' + C.ic('ticket', 20) + '</span><div><h1>' + esc(t.subj) + '</h1><p class="muted">' + C.idChip(t.id) + ' · reported via ' + { whatsapp: 'WhatsApp', phone: 'phone', email: 'email' }[t.ch] + ' ' + C.rel(t.created) + (d.id ? ' · <a href="#/deals/' + d.id + '">' + esc(d.name) + '</a>' : '') + '</p></div></div><div class="rec-act">' + sel('status', Object.keys(TST).map(function (k) { return [k, TST[k]]; }), t.status, 'Status') + sel('prio', PRIO.map(function (p) { return [p, p + ' priority']; }), t.prio, 'Priority') + sel('owner', P().users.map(function (u) { return [u.name, u.name]; }), t.owner, 'Owner') + '</div></header>' +
      '<div class="tk-g"><section class="card"><div class="card-h"><div><h2>Updates</h2><p class="sub">Internal notes and messages to the customer</p></div></div>' +
      (canE ? '<form class="comp" data-form="tk-upd"><div class="seg" role="group" aria-label="Update type"><button type="button" data-act="tk-mode" data-v="note" aria-pressed="' + (C.ui.tkm !== 'wa') + '">' + C.ic('note', 13) + 'Internal note</button><button type="button" data-act="tk-mode" data-v="wa" aria-pressed="' + (C.ui.tkm === 'wa') + '">' + C.ic('wa', 13) + 'Reply on WhatsApp</button></div><label class="sr" for="tk-u">Update</label><textarea id="tk-u" name="u" rows="2" required placeholder="' + (C.ui.tkm === 'wa' ? 'e.g. Our carpenter will visit tomorrow between 11 and 1.' : 'e.g. Ordered a replacement channel from Halden Supply.') + '"></textarea><div class="comp-f"><label class="chk"><input type="checkbox" name="close"> Mark as closed</label><button class="btn pri sm">Post update</button></div></form>' : '') +
      '<ol class="tl rtl">' + log.map(function (x) { return '<li class="tl-' + (x.wa ? 'wa' : 'note') + '"><span class="tl-i">' + C.ic(x.wa ? 'wa' : 'note', 13) + '</span><div class="tl-b"><div class="tl-h"><b>' + (x.wa ? 'WhatsApp to customer' : 'Internal note') + '</b><span class="muted sm">' + esc(x.by.split(' ')[0]) + '</span><time>' + C.dt(x.t) + '</time></div><p>' + esc(x.text) + '</p></div></li>'; }).join('') + acts.map(function (a) { return '<li class="tl-ticket"><span class="tl-i">' + C.ic('flag', 13) + '</span><div class="tl-b"><div class="tl-h"><b>Ticket</b><span class="muted sm">' + esc((a.by || '').split(' ')[0]) + '</span><time>' + C.dt(a.t) + '</time></div><p>' + esc(a.text) + '</p></div></li>'; }).join('') + '</ol></section>' +
      '<aside class="rec-side">' + (c ? '<section class="rbox"><h2 class="rbox-h">' + C.ic('user', 14) + 'Customer</h2><a class="lead-card" href="#/contacts/' + c.id + '">' + C.avatar(c.name, 28) + '<span><b>' + esc(c.name) + '</b><small class="muted"> ' + esc(c.phone) + '</small></span></a></section>' : '') +
      '<section class="rbox"><h2 class="rbox-h">' + C.ic('box', 14) + 'Items on the project</h2>' + ((d.items || []).filter(function (i) { return i.sku; }).length ? '<ul class="mlist">' + d.items.filter(function (i) { return i.sku; }).map(function (i) { return '<li><span class="tr"><span class="idc">' + i.sku + '</span> ' + esc(i.name) + '</span><span class="muted sm">× ' + i.qty + '</span></li>'; }).join('') + '</ul>' : '<p class="empty sm">Service-only project.</p>') + '</section>' + C.recHistory('ticket', t.id).replace('<ol class="hist">', '<section class="rbox"><h2 class="rbox-h">' + C.ic('clock', 14) + 'History</h2><ol class="hist">').replace(/<\/ol>$/, '</ol></section>') + '</aside></div>';
  }
  C.acts['tk-mode'] = function (el) { C.ui.tkm = el.dataset.v; C.rerender(); var x = $('#tk-u'); if (x) x.focus(); };
  C.chs['tk-set'] = function (el) {
    var t = ticket(C.cur.arg), f = el.dataset.f, map = { status: 'status', prio: 'prio', owner: 'owner' }, ov = t[map[f]];
    t[map[f]] = el.value; t.updated = Date.now();
    C.audit(f === 'owner' ? 'assign' : 'status', { t: 'ticket', id: t.id, name: t.subj }, { status: 'Status', prio: 'Priority', owner: 'Owner' }[f], ov, el.value);
    if (f === 'status') C.pact('ticket', 'Ticket ' + t.id + ' ' + TST[el.value].toLowerCase() + ': ' + t.subj, { c: t.c, co: t.co, d: t.d }, C.me().name);
    if (f === 'owner' && el.value !== C.me().name) C.notify(C.me().name.split(' ')[0] + ' assigned you ticket ' + t.id, '#/tickets/' + t.id, 'ticket', el.value);
    C.save(); C.rerender(); C.toast(({ status: 'Status', prio: 'Priority', owner: 'Owner' })[f] + ' updated', { undo: function () { t[map[f]] = ov; C.save(); C.rerender(); } });
  };
  C.forms['tk-upd'] = function (f) {
    var t = ticket(C.cur.arg), txt = f.elements.u.value.trim(), wa = C.ui.tkm === 'wa'; if (!txt) return;
    t.log = t.log || []; t.log.push({ t: Date.now(), by: C.me().name, text: txt, wa: wa }); t.updated = Date.now();
    if (wa) C.pact('wa', 'WhatsApp on ticket ' + t.id + ': ' + txt, { c: t.c, co: t.co, d: t.d }, C.me().name);
    if (f.elements.close.checked) { var ov = t.status; t.status = 'closed'; C.audit('status', { t: 'ticket', id: t.id, name: t.subj }, 'Status', TST[ov], 'Closed'); C.pact('ticket', 'Ticket ' + t.id + ' closed: ' + t.subj, { c: t.c, co: t.co, d: t.d }, C.me().name); }
    C.save(); C.rerender(); C.toast(wa ? 'WhatsApp sent' : 'Note added', { icon: wa ? 'wa' : 'note' });
  };
  V.tickets = {
    title: function () { var t = C.cur && C.cur.arg && ticket(C.cur.arg); return t ? t.id : 'Tickets'; },
    render: function () { var t = C.cur.arg && ticket(C.cur.arg); return t ? ticketPage(t) : ticketsList(); }
  };
  C.badgeFns.push(function () { return { tickets: P().tickets.filter(function (t) { return t.status === 'open' && C.visibleOwner(t.owner); }).length }; });
  C.searchers.push(function (terms, hit) {
    var out = [];
    P().quotes.filter(function (q) { return q.status !== 'superseded' && hit(q.id + ' ' + ((C.deal(q.d) || {}).name || '')); }).slice(0, 3).forEach(function (q) { out.push({ g: 'Quotes', ic: 'quote', label: q.id + ' · ' + (C.deal(q.d) || {}).name, sub: QST[q.status] + ' · ' + C.rs(C.quoteTotal(q).total), run: function () { location.hash = '#/quotes/' + q.id; } }); });
    P().tickets.filter(function (t) { return hit(t.id + ' ' + t.subj); }).slice(0, 3).forEach(function (t) { out.push({ g: 'Tickets', ic: 'ticket', label: t.subj, sub: t.id + ' · ' + TST[t.status], run: function () { location.hash = '#/tickets/' + t.id; } }); });
    return out;
  });
})();
