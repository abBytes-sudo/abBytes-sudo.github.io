/* Northlane Back Office: orders list, order detail, fulfilment, refunds, returns, printing (design sample). */
(function () {
  'use strict';
  var NL = window.NL, A = window.A, $ = A.$, $$ = A.$$, esc = A.esc, money = A.money, ic = A.ic;
  var PER = 25;
  var CH = { online: 'Online store', instagram: 'Instagram', whatsapp: 'WhatsApp', popup: 'Pop-up store' };
  var VIEWS = [
    { k: 'all', l: 'All', f: {} },
    { k: 'unfulfilled', l: 'Unfulfilled', f: { st: ['unfulfilled', 'partial'] } },
    { k: 'unpaid', l: 'Unpaid', f: { pay: ['pending', 'cod'] } },
    { k: 'ready', l: 'Ready to ship', f: { dl: ['packed'] } },
    { k: 'transit', l: 'In transit', f: { dl: ['shipped', 'out'] } },
    { k: 'returns', l: 'Returns', f: { ret: true } },
    { k: 'cancelled', l: 'Cancelled', f: { st: ['cancelled'] } }
  ];
  var FIELDS = {
    st: { l: 'Fulfilment', o: [['unfulfilled', 'Unfulfilled'], ['partial', 'Partially fulfilled'], ['fulfilled', 'Fulfilled'], ['cancelled', 'Cancelled']] },
    dl: { l: 'Delivery', o: [['placed', 'Not shipped'], ['packed', 'Packed'], ['shipped', 'In transit'], ['out', 'Out for delivery'], ['delivered', 'Delivered']] },
    pay: { l: 'Payment', o: [['paid', 'Paid'], ['pending', 'Payment pending'], ['cod', 'COD to collect'], ['partial_refund', 'Partially refunded'], ['refunded', 'Refunded'], ['voided', 'Voided']] },
    ch: { l: 'Channel', o: [['online', 'Online store'], ['instagram', 'Instagram'], ['whatsapp', 'WhatsApp'], ['popup', 'Pop-up store']] }
  };
  var DATES = [['', 'Any time'], ['today', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days']];
  var SORTS = [['new', 'Newest first'], ['old', 'Oldest first'], ['hi', 'Total, high to low'], ['lo', 'Total, low to high']];
  var sel = {}, keys = null;

  function readF(r) { var v = r.q.get('v') || 'all', base = (VIEWS.filter(function (x) { return x.k === v; })[0] || VIEWS[0]).f, F = { v: v, q: r.q.get('q') || '', d: r.q.get('d') || '', s: r.q.get('s') || 'new', p: +(r.q.get('p') || 1), ret: !!base.ret };
    ['st', 'dl', 'pay', 'ch'].forEach(function (k) { var x = r.q.get(k); F[k] = x === '-' ? [] : x ? x.split(',') : (base[k] || []).slice(); }); return F; }
  function match(o, F) {
    if (F.st.length && F.st.indexOf(NL.fulfilment(o)) < 0) return false;
    if (F.dl.length && F.dl.indexOf(NL.stage(o)) < 0) return false;
    if (F.pay.length && F.pay.indexOf(NL.payStatus(o)) < 0) return false;
    if (F.ch.length && F.ch.map(function (c) { return CH[c]; }).indexOf(o.ch) < 0) return false;
    if (F.ret && !NL.openReturn(o)) return false;
    if (F.d) { var since = F.d === 'today' ? NL.dayStart() : Date.now() - (+F.d) * NL.DAY; if (o.t < since) return false; }
    if (F.q) { var q = F.q.toLowerCase().replace(/^#/, ''), n = q.replace(/[^0-9]/g, '');
      var hay = (o.id + ' ' + o.name + ' ' + o.email + ' ' + o.addr.city + ' ' + o.items.map(function (it) { return it.name; }).join(' ') + ' ' + o.ships.map(function (s) { return s.awb; }).join(' ') + ' ' + (o.disc ? o.disc.code : '') + ' ' + o.tags.join(' ')).toLowerCase();
      if (hay.indexOf(q) < 0 && !(n.length >= 3 && String(o.num).indexOf(n) >= 0)) return false; }
    return true;
  }
  function list(F) {
    var L = NL.db().orders.filter(function (o) { return match(o, F); });
    var sorts = { new: function (a, b) { return b.t - a.t; }, old: function (a, b) { return a.t - b.t; }, hi: function (a, b) { return b.total - a.total; }, lo: function (a, b) { return a.total - b.total; } };
    return L.sort(sorts[F.s] || sorts.new);
  }
  function viewQuery(F) { var q = new URLSearchParams(); if (F.v !== 'all') q.set('v', F.v); var base = (VIEWS.filter(function (x) { return x.k === F.v; })[0] || VIEWS[0]).f;
    ['st', 'dl', 'pay', 'ch'].forEach(function (k) { if (F[k].join(',') !== (base[k] || []).join(',')) q.set(k, F[k].length ? F[k].join(',') : '-'); }); if (F.q) q.set('q', F.q); if (F.d) q.set('d', F.d); if (F.s !== 'new') q.set('s', F.s); return q; }
  function isCustom(F) { var q = viewQuery(F); q.delete('v'); q.delete('s'); return q.toString() !== ''; }

  /* ───────── orders list ───────── */
  function row(o, fresh) {
    var st = NL.stage(o), rt = NL.openReturn(o), live = o.ships.filter(function (s) { return s.stage !== 'delivered'; })[0];
    var flags = (o.gift ? ic('gift') : '') + (o.tl.some(function (e) { return e.k === 'note'; }) ? ic('note') : '') + (o.ships.length > 1 || NL.fulfilment(o) === 'partial' ? ic('split') : '');
    var deliv = rt ? A.retPill(rt) : A.stagePill(st);
    return '<tr data-href="#/orders/' + o.id + '" class="' + (sel[o.id] ? 'sel' : '') + (fresh ? ' fresh' : '') + '" data-id="' + o.id + '">' +
      '<td class="cb"><label class="ck"><input type="checkbox" data-ch="pick" value="' + o.id + '"' + (sel[o.id] ? ' checked' : '') + ' aria-label="Select ' + o.id + '"></label></td>' +
      '<td data-m="a"><a class="id" href="#/orders/' + o.id + '">' + o.id + '</a><span class="ics" aria-hidden="true">' + flags + '</span><small class="show-s mute" style="display:block;font-size:12px">' + esc(o.name) + ' · ' + NL.rel(o.t) + '</small></td>' +
      '<td data-m="hide" class="mute">' + NL.rel(o.t) + '</td>' +
      '<td data-m="hide" class="who"><b>' + esc(o.name) + '</b><small>' + esc(o.addr.city) + '</small></td>' +
      '<td data-m="hide" class="mute c-opt">' + esc(o.ch) + '</td>' +
      '<td data-m="r" class="num"><b style="font-weight:600">' + money(o.total) + '</b></td>' +
      '<td data-m="hide">' + A.payPill(o) + '</td>' +
      '<td data-m="hide">' + A.fulfilPill(o) + '</td>' +
      '<td data-m="hide">' + deliv + (live && live.eta && st !== 'out' ? '<small class="mute" style="display:block;font-size:11.5px">ETA ' + NL.fDs(live.eta) + '</small>' : '') + '</td>' +
      '<td data-m="hide" class="c-opt">' + A.thumbs(o) + '</td>' +
      '<td class="show-s" data-m="f"><span class="row" style="gap:10px;margin-top:4px">' + A.payPill(o) + A.fulfilPill(o) + deliv + '</span></td></tr>';
  }
  function filterBtns(F) {
    return ['st', 'dl', 'pay', 'ch'].map(function (k) { var on = F[k].length, lab = FIELDS[k].l;
      var val = on ? (on === 1 ? FIELDS[k].o.filter(function (o) { return o[0] === F[k][0]; })[0][1] : on + ' selected') : '';
      return '<button type="button" class="fbtn' + (on ? ' on' : '') + '" data-act="filter" data-k="' + k + '" aria-haspopup="true" aria-expanded="false">' + ic(on ? 'filter' : 'plus') + lab + (on ? ': <b>' + esc(val) + '</b>' : '') + '</button>'; }).join('') +
      '<button type="button" class="fbtn' + (F.d ? ' on' : '') + '" data-act="date" aria-haspopup="true">' + ic('clock') + 'Date' + (F.d ? ': <b>' + DATES.filter(function (d) { return d[0] === F.d; })[0][1] + '</b>' : '') + '</button>';
  }
  A.page('orders', {
    title: 'Orders', nav: 'orders', wide: true,
    crumbs: function (r) { return r.id ? [['Orders', '#/orders'], [r.id, '']] : [['Orders', '#/orders']].concat(r.q.get('v') === 'returns' ? [['Returns', '']] : []); },
    docTitle: function (r) { return r.id || 'Orders'; },
    skeleton: 'table',
    render: function (r, el) {
      if (r.id) return detail.render(r, el);
      var F = readF(r), L = list(F), D = NL.db(), pages = Math.max(1, Math.ceil(L.length / PER)); if (F.p > pages) F.p = pages;
      var slice = L.slice((F.p - 1) * PER, F.p * PER); A.lastList = L.map(function (o) { return o.id; });
      Object.keys(sel).forEach(function (id) { if (!NL.order(id)) delete sel[id]; });
      var custom = D.views || [], cnt = function (f) { var G = { st: f.st || [], dl: f.dl || [], pay: f.pay || [], ch: [], d: '', q: '', ret: !!f.ret }; return D.orders.filter(function (o) { return match(o, G); }).length; };
      var tabs = VIEWS.map(function (v) { var n = v.k === 'all' || v.k === 'cancelled' ? '' : cnt(v.f); return '<button type="button" role="tab" data-act="view" data-v="' + v.k + '" aria-selected="' + (F.v === v.k && !matchCustom(r)) + '">' + v.l + (n ? ' <span class="ct">' + n + '</span>' : '') + '</button>'; }).join('') +
        custom.map(function (v) { return '<button type="button" role="tab" data-act="cview" data-q="' + esc(v.q) + '" aria-selected="' + (r.q.toString() === v.q) + '">' + ic('filter') + esc(v.name) + '<span class="tab-x" data-act="dview" data-id="' + v.id + '" aria-label="Delete view ' + esc(v.name) + '" role="button">' + ic('x') + '</span></button>'; }).join('');
      var ret = F.v === 'returns';
      return '<div class="ph"><div><h1>' + (ret ? 'Returns' : 'Orders') + '</h1><p>' + (ret ? 'Open return requests, from request to refund and restock.' : NL.plural(D.orders.length, 'order') + ' · ' + NL.plural(D.orders.filter(function (o) { return o.t >= NL.dayStart(); }).length, 'order') + ' today · synced with the storefront in this browser') + '</p></div>' +
        '<div class="ph-a"><button class="b" type="button" data-act="export">' + ic('download') + 'Export CSV</button><a class="b" href="#/journey">' + ic('journey') + 'Live journeys</a><a class="b pri" href="../store/shop.html" target="_blank" rel="noopener">' + ic('store') + 'Place a test order</a></div></div>' +
        '<div class="tabs" role="tablist" aria-label="Saved views">' + tabs + '</div>' +
        '<div class="fbar"><div class="srch">' + ic('search') + '<label class="vh" for="oq">Search orders</label><input class="in" id="oq" data-search data-in="q" type="search" placeholder="Search number, name, email, AWB, SKU…" value="' + esc(F.q) + '" autocomplete="off"></div>' + filterBtns(F) +
        (isCustom(F) ? '<button class="b ghost sm" type="button" data-act="clear">Clear</button>' + (matchCustom(r) ? '' : '<button class="b sm" type="button" data-act="saveview">' + ic('plus') + 'Save view</button>') : '') +
        '<span class="grow"></span><label class="vh" for="osort">Sort</label><select class="sel" id="osort" data-ch="sort" style="width:auto;height:32px;font-size:12.5px">' + SORTS.map(function (s) { return '<option value="' + s[0] + '"' + (F.s === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></div>' +
        '<div class="tw"><div class="tws"><table class="tb stack" aria-label="Orders"><thead><tr><th class="cb"><label class="ck"><input type="checkbox" data-ch="all" aria-label="Select all on this page"' + (slice.length && slice.every(function (o) { return sel[o.id]; }) ? ' checked' : '') + '></label></th><th>Order</th><th>Date</th><th>Customer</th><th class="c-opt">Channel</th><th class="num">Total</th><th>Payment</th><th>Fulfilment</th><th>Delivery</th><th class="c-opt">Items</th><th class="show-s"><span class="vh">Status</span></th></tr></thead><tbody id="orows">' +
        (slice.length ? slice.map(function (o) { return row(o, A.fresh && A.fresh.indexOf(o.id) >= 0); }).join('') : '') + '</tbody></table></div>' +
        (slice.length ? '' : (F.q || isCustom(F) ? A.empty('search', 'No orders match these filters', 'Try a different search or clear a filter. Order numbers work with or without “NL-”.', '<button class="b" type="button" data-act="clear">Clear filters</button>') : A.empty(ret ? 'return' : 'orders', ret ? 'No open returns' : 'Nothing here right now', ret ? 'When a customer starts a return from their account, it lands here for approval.' : 'Orders that match this view will appear here as they come in.', ''))) +
        '<div class="tfoot"><span>' + (L.length ? ((F.p - 1) * PER + 1) + '–' + Math.min(L.length, F.p * PER) + ' of ' + L.length : '0 orders') + ' · ' + money(L.reduce(function (a, o) { return a + o.total; }, 0)) + '</span><span class="row"><button class="b sm" type="button" data-act="page" data-p="' + (F.p - 1) + '"' + (F.p <= 1 ? ' disabled' : '') + '>' + ic('chev-l') + 'Prev</button><button class="b sm" type="button" data-act="page" data-p="' + (F.p + 1) + '"' + (F.p >= pages ? ' disabled' : '') + '>Next' + ic('chev-r') + '</button></span></div></div>' + bulkBar();
    },
    mount: function (r) { if (r.id) return detail.mount(r); keys = A.listKeys('#orows tr'); A.fresh = null; },
    leave: function () { if (A.parse().name !== 'orders') sel = {}; },
    remote: function () { A.refresh(); },
    get keys() { var r = A.parse(); if (r.id) return detail.keys; return keys && { j: keys.j, k: keys.k, x: keys.x, Enter: keys.Enter, A: function () { var c = $('[data-ch=all]'); if (c) c.click(); } }; },
    get acts() { return A.parse().id ? detail.acts : listActs; }
  });
  function matchCustom(r) { return (NL.db().views || []).some(function (v) { return v.q === r.q.toString(); }); }
  var qT;
  var listActs = {
    view: function (b) { A.go('orders' + (b.getAttribute('data-v') === 'all' ? '' : '?v=' + b.getAttribute('data-v'))); },
    cview: function (b, e) { if (e.target.closest('[data-act=dview]')) return; A.go('orders?' + b.getAttribute('data-q')); },
    dview: function (b, e) { e.stopPropagation(); var D = NL.db(), id = b.getAttribute('data-id'), v = D.views.filter(function (x) { return x.id === id; })[0], ix = D.views.indexOf(v); D.views.splice(ix, 1); NL.save('views');
      A.toast('Deleted the view “' + esc(v.name) + '”', { undo: function () { D.views.splice(ix, 0, v); NL.save('views'); A.refresh(); } }); A.go('orders'); },
    q: function (inp) { clearTimeout(qT); qT = setTimeout(function () { A.setQ({ q: inp.value.trim(), p: '' }); var pos = inp.selectionStart; A.refresh(); var n = $('#oq'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } }, 160); },
    sort: function (s) { A.setQ({ s: s.value === 'new' ? '' : s.value, p: '' }); A.refresh(); },
    page: function (b) { A.setQ({ p: b.getAttribute('data-p') }); A.refresh(); scrollTo(0, 0); },
    clear: function () { var v = A.parse().q.get('v'); A.go('orders' + (v ? '?v=' + v : '')); },
    filter: function (b) { var k = b.getAttribute('data-k'), F = readF(A.parse()), f = FIELDS[k], counts = {};
      NL.db().orders.forEach(function (o) { var val = k === 'st' ? NL.fulfilment(o) : k === 'dl' ? NL.stage(o) : k === 'pay' ? NL.payStatus(o) : Object.keys(CH).filter(function (c) { return CH[c] === o.ch; })[0]; counts[val] = (counts[val] || 0) + 1; });
      var m = A.menu(b, '<h4>' + f.l + '</h4>' + f.o.map(function (o) { return '<label class="ck"><input type="checkbox" value="' + o[0] + '"' + (F[k].indexOf(o[0]) >= 0 ? ' checked' : '') + '>' + o[1] + '<small>' + (counts[o[0]] || 0) + '</small></label>'; }).join('') + '<div class="pop-f"><button type="button" class="b ghost sm" data-x>Clear</button><button type="button" class="b pri sm" data-ok>Apply</button></div>');
      if (!m) return;
      function apply(clear) { var v = clear ? [] : $$('input:checked', m.el).map(function (i) { return i.value; }), base = (VIEWS.filter(function (x) { return x.k === F.v; })[0] || VIEWS[0]).f[k] || [], o = { p: '' };
        o[k] = v.length ? v : (base.length ? '-' : ''); m.close(); A.setQ(o); A.refresh(); }
      $('[data-ok]', m.el).addEventListener('click', function () { apply(false); }); $('[data-x]', m.el).addEventListener('click', function () { apply(true); }); },
    date: function (b) { var F = readF(A.parse()); A.menu(b, DATES.map(function (d) { return { label: d[1], icon: F.d === d[0] ? 'check' : '', run: function () { A.setQ({ d: d[0], p: '' }); A.refresh(); } }; })); },
    saveview: function () { var q = A.parse().q; q.delete('p');
      A.modal({ title: 'Save this view', sub: 'It appears as a tab here and in the sidebar, and keeps these filters and sort.', size: 'sm', body: '<label class="fl"><span>Name</span><input class="in" id="vn" maxlength="28" placeholder="e.g. Express, not shipped" autofocus></label><p class="err" id="vErr" style="color:var(--bad);font-size:12px"></p>',
        foot: [{ label: 'Cancel' }, { label: 'Save view', cls: 'pri', run: function (api) { var n = $('#vn', api.el).value.trim(); if (!n) { $('#vErr', api.el).textContent = 'Give the view a short name.'; $('#vn', api.el).classList.add('bad'); return; }
          var D = NL.db(); D.views = D.views || []; D.views.push({ id: 'v' + Date.now().toString(36), name: n, q: q.toString() }); NL.log('Saved view', n, q.toString()); NL.save('views'); api.close(); A.toast('Saved the view “' + esc(n) + '”'); A.go('orders?' + q.toString()); } }],
        onOpen: function (api) { $('#vn', api.el).addEventListener('keydown', function (e) { if (e.key === 'Enter') $('.md-f .pri', api.el).click(); }); } }); },
    pick: function (c) { if (c.checked) sel[c.value] = 1; else delete sel[c.value]; c.closest('tr').classList.toggle('sel', c.checked); updBulk(); },
    all: function (c) { $$('#orows input[data-ch=pick]').forEach(function (x) { x.checked = c.checked; if (c.checked) sel[x.value] = 1; else delete sel[x.value]; x.closest('tr').classList.toggle('sel', c.checked); }); updBulk(); },
    export: function () { var L = list(readF(A.parse())); exportCsv(L, 'northlane-orders.csv'); },
    bfulfil: function () { bulkFulfil(true); }, bpack: function () { bulkFulfil(false); },
    bslip: function () { var L = picked(); A.print(L.map(slipHTML).join('<div style="page-break-after:always"></div>')); NL.log('Printed packing slips', L.length + ' orders', L.map(function (o) { return o.id; }).join(', ')); },
    blabel: function () { var L = picked().filter(function (o) { return o.ships.some(function (s) { return s.awb; }); }); if (!L.length) { A.toast('None of the selected orders has a shipping label yet. Fulfil them first.', { bad: true }); return; } A.print(L.map(function (o) { return o.ships.filter(function (s) { return s.awb; }).map(function (s) { return labelHTML(o, s); }).join(''); }).join('')); },
    bcsv: function () { exportCsv(picked(), 'northlane-orders-selected.csv'); },
    btag: function (b) { var L = picked(); A.menu(b, ['Priority', 'VIP', 'Gift', 'Check address', 'Influencer'].map(function (t) { return { label: t, icon: 'tagi', run: function () { L.forEach(function (o) { if (o.tags.indexOf(t) < 0) o.tags.push(t); }); NL.bump(); NL.log('Tagged orders', t, L.length + ' orders'); NL.save('orders'); A.toast('Tagged ' + NL.plural(L.length, 'order') + ' “' + t + '”', { undo: function () { L.forEach(function (o) { o.tags = o.tags.filter(function (x) { return x !== t; }); }); NL.save('orders'); A.refresh(); } }); A.refresh(); } }; })); },
    bclear: function () { sel = {}; A.refresh(); }
  };
  function picked() { return Object.keys(sel).map(NL.order).filter(Boolean); }
  function bulkBar() { var n = Object.keys(sel).length; if (!n) return '<div id="bulk"></div>'; var L = picked(), canF = L.filter(function (o) { return !o.cancelled && NL.fulfilment(o) !== 'fulfilled'; }).length;
    return '<div id="bulk"><div class="bulk" role="toolbar" aria-label="Bulk actions"><b>' + n + ' selected</b>' +
      '<button class="b acc" type="button" data-act="bfulfil"' + (canF ? '' : ' disabled') + '>' + ic('truck') + 'Fulfil & ship' + (canF && canF < n ? ' (' + canF + ')' : '') + '</button>' +
      '<button class="b" type="button" data-act="bpack"' + (canF ? '' : ' disabled') + '>' + ic('package') + 'Mark packed</button>' +
      '<button class="b" type="button" data-act="bslip">' + ic('printer') + 'Packing slips</button><button class="b" type="button" data-act="blabel">' + ic('printer') + 'Labels</button>' +
      '<button class="b" type="button" data-act="btag">' + ic('tagi') + 'Tag</button><button class="b" type="button" data-act="bcsv">' + ic('download') + 'CSV</button><button class="b" type="button" data-act="bclear" aria-label="Clear selection">' + ic('x') + '</button></div></div>'; }
  function updBulk() { var b = $('#bulk'); if (b) b.outerHTML = bulkBar(); var all = $('[data-ch=all]'), P = $$('#orows input[data-ch=pick]'); if (all) { var k = P.filter(function (x) { return x.checked; }).length; all.checked = k && k === P.length; all.indeterminate = k > 0 && k < P.length; } }
  function bulkFulfil(ship) {
    var L = picked().filter(function (o) { return !o.cancelled && NL.fulfilment(o) !== 'fulfilled'; }), n = 0, short = [];
    L.forEach(function (o) { var lines = o.items.map(function (it, i) { return { i: i, q: NL.remaining(o, i) }; }).filter(function (l) { return l.q > 0; });
      var ok = lines.filter(function (l) { var it = o.items[l.i]; return NL.stock(NL.skuKey(it.pid, it.c, it.s)).on >= l.q; });
      if (ok.length < lines.length) short.push(o.id); if (!ok.length) return; NL.fulfil(o, ok, { ship: ship }); n++; });
    sel = {}; A.refresh();
    A.toast((ship ? 'Fulfilled and shipped ' : 'Packed ') + NL.plural(n, 'order') + (short.length ? '. ' + short.join(', ') + ' had items short on the shelf, so those lines stay unfulfilled.' : '. Customers were notified.'), { icon: 'truck', ms: 6000, action: ship && n ? ['Print labels', function () { var O = L.filter(function (o) { return o.ships.length; }); A.print(O.map(function (o) { return labelHTML(o, o.ships[o.ships.length - 1]); }).join('')); }] : null });
  }
  function exportCsv(L, name) { var rows = [['Order', 'Placed', 'Customer', 'Email', 'City', 'Pincode', 'Channel', 'Items', 'Subtotal', 'Discount', 'Shipping', 'Total', 'Payment method', 'Payment status', 'Fulfilment', 'Delivery', 'AWB', 'Refunded']];
    L.forEach(function (o) { rows.push([o.id, new Date(o.t).toISOString().slice(0, 16).replace('T', ' '), o.name, o.email, o.addr.city, o.addr.pin, o.ch, o.items.map(function (it) { return it.name + ' (' + it.col + ', ' + it.s + ') x' + it.q; }).join('; '), o.sub, o.disc ? o.disc.amt + ' ' + o.disc.code : 0, o.shipFee, o.total, o.pay.m, NL.PAYL[NL.payStatus(o)], NL.fulfilment(o), NL.STGL[NL.stage(o)], o.ships.map(function (s) { return s.awb; }).filter(Boolean).join(' '), NL.refunded(o)]); });
    A.csv(name, rows); NL.log('Exported orders', name, NL.plural(L.length, 'order')); NL.save('audit'); }

  /* ───────── order detail ───────── */
  var TLI = { placed: 'orders', pay: 'cash', disc: 'discounts', notify: 'mail', fulfil: 'package', ship: 'truck', out: 'truck', deliver: 'check', refund: 'refund', return: 'return', cancel: 'x', note: 'note' };
  function lineRow(o, i, q, extra) { var it = o.items[i]; return '<div class="line">' + A.thumb(it.pid) + '<div><b>' + esc(it.name) + '</b><small>' + esc(it.col) + (it.s !== 'One size' ? ' · ' + esc(it.s) : '') + ' · <span class="mono">' + NL.skuCode(NL.skuKey(it.pid, it.c, it.s)) + '</span></small>' + (extra || '') + '</div><span class="mute nowrap">' + money(it.price) + ' × ' + q + '</span><b class="nowrap" style="font-weight:500">' + money(it.price * q) + '</b></div>'; }
  function stageBar(sh) { var S = ['packed', 'shipped', 'out', 'delivered'], i = S.indexOf(sh.stage);
    return '<div class="stages" style="grid-template-columns:repeat(4,minmax(0,1fr))">' + S.map(function (s, k) { return '<div class="' + (k <= i ? 'on' : '') + (k === i + 1 && s !== 'delivered' && i >= 1 ? ' now' : '') + '"><i></i>' + { packed: 'Packed', shipped: 'Shipped', out: 'Out for delivery', delivered: 'Delivered' }[s] + '<small>' + (sh.ev[s] ? NL.fDs(sh.ev[s]) + ', ' + NL.fT(sh.ev[s]) : s === 'delivered' && sh.eta ? 'ETA ' + NL.fDs(sh.eta) : '—') + '</small></div>'; }).join('') + '</div>'; }
  function nextStage(sh) { return { packed: ['shipped', 'Mark as shipped', 'truck'], shipped: ['out', 'Out for delivery', 'truck'], out: ['delivered', 'Mark delivered', 'check'] }[sh.stage]; }
  var detail = {
    render: function (r) {
      var o = NL.order(r.id); if (!o) return A.empty('orders', 'We couldn’t find ' + esc(r.id), 'It may have been removed when the data was started fresh.', '<a class="b" href="#/orders">Back to orders</a>');
      var f = NL.fulfilment(o), st = NL.stage(o), c = NL.custByEmail(o.email), cs = NL.custStats()[o.email] || { orders: 1, ltv: o.total, seg: [] }, ix = (A.lastList || []).indexOf(o.id);
      var rem = o.items.map(function (it, i) { return { i: i, q: NL.remaining(o, i) }; }).filter(function (l) { return l.q > 0; });
      var canShipAny = o.ships.some(function (s) { return s.stage !== 'delivered'; }), delivered = o.items.some(function (it, i) { return NL.shippedQ(o, i) - (it.rq || 0) > 0; }) && o.ships.some(function (s) { return s.stage === 'delivered'; });
      var head = '<a class="back" href="#/orders' + (A.lastQ || '') + '">' + ic('arrow-l') + 'Orders</a><div class="ph"><div><h1 class="row" style="gap:12px">' + o.id + ' <span class="row" style="gap:12px;font-size:13px;font-weight:400">' + A.payPill(o) + A.fulfilPill(o) + (NL.openReturn(o) ? A.retPill(NL.openReturn(o)) : '') + '</span></h1><p>' + NL.fDT(o.t) + ' · ' + esc(o.ch) + ' · ' + NL.METHOD_LABEL(o) + (o.tags.length ? ' · ' + o.tags.map(function (t) { return '<span class="tag" style="height:20px">' + esc(t) + '</span>'; }).join(' ') : '') + '</p></div>' +
        '<div class="ph-a">' + (ix >= 0 ? '<span class="bgrp"><button class="b" type="button" data-act="nav" data-d="-1" aria-label="Previous order"' + (ix <= 0 ? ' disabled' : '') + '>' + ic('chev-u') + '</button><button class="b" type="button" data-act="nav" data-d="1" aria-label="Next order"' + (ix >= A.lastList.length - 1 ? ' disabled' : '') + '>' + ic('chev-d') + '</button></span>' : '') +
        '<button class="b" type="button" data-act="refund"' + (NL.refundable(o) > 0 ? '' : ' disabled') + '>' + ic('refund') + 'Refund <kbd>R</kbd></button>' +
        '<button class="b" type="button" data-act="more" aria-haspopup="true">' + ic('more') + 'More</button>' +
        (rem.length && !o.cancelled ? '<button class="b pri" type="button" data-act="fulfil">' + ic('truck') + 'Fulfil items <kbd>E</kbd></button>' : canShipAny ? '<a class="b pri" href="#/journey/' + o.id + '">' + ic('journey') + 'Watch the journey</a>' : '') + '</div></div>';
      var left = '';
      if (o.cancelled) left += '<div class="note-box bad" style="margin-bottom:16px">' + ic('x') + '<div><b>Cancelled ' + (o.cancelledAt ? NL.rel(o.cancelledAt) : '') + '.</b> ' + esc(o.cancelReason || '') + (NL.refunded(o) ? ' · ' + money(NL.refunded(o)) + ' refunded.' : '') + '</div></div>';
      if (o.pay.st === 'pending') left += '<div class="note-box warn" style="margin-bottom:16px">' + ic('clock') + '<div><b>Waiting for the UPI approval.</b> The customer has a payment request on their phone. Hold fulfilment until it’s paid, or <button class="lnk" type="button" data-act="markpaid">mark it paid</button>.</div></div>';
      if (rem.length && !o.cancelled) left += '<section class="cd"><div class="cd-h"><h2 class="row"><span class="st ' + (f === 'partial' ? 'half' : 'ring') + ' c-warn">' + (f === 'partial' ? 'Still to fulfil' : 'Unfulfilled') + '</span><span class="sub">' + NL.plural(rem.reduce(function (a, l) { return a + l.q; }, 0), 'item') + '</span></h2><span class="sub">' + NL.METHOD_LABEL(o) + ' · ETA ' + esc(NL.etaText(o)) + '</span></div><div class="cd-b"><div class="lines">' +
        rem.map(function (l) { var it = o.items[l.i], stk = NL.stock(NL.skuKey(it.pid, it.c, it.s)); return lineRow(o, l.i, l.q, stk.on < l.q ? '<small class="c-warn" style="font-weight:500">' + ic('alert') + ' Only ' + stk.on + ' on the shelf' + (stk.inc.n ? ' · ' + stk.inc.n + ' arriving ' + NL.fDs(stk.inc.eta) : '') + '</small>' : '<small class="c-ok">' + stk.on + ' on the shelf</small>'); }).join('') +
        '</div></div><div class="cd-f"><button class="b" type="button" data-act="slip">' + ic('printer') + 'Packing slip</button><button class="b pri" type="button" data-act="fulfil">' + ic('truck') + 'Fulfil ' + (rem.length > 1 || rem[0].q > 1 ? 'items' : 'item') + '</button></div></section>';
      o.ships.forEach(function (sh, k) { var nx = nextStage(sh), n = sh.lines.reduce(function (a, l) { return a + l.q; }, 0);
        left += '<section class="cd"><div class="cd-h"><h2 class="row">' + A.stagePill(sh.stage) + '<span class="sub">Shipment ' + (k + 1) + ' · ' + NL.plural(n, 'item') + '</span></h2><span class="sub">' + esc(sh.carrier) + (sh.awb ? ' · <span class="mono">' + sh.awb + '</span> <button class="ib" type="button" data-act="copy" data-v="' + sh.awb + '" aria-label="Copy AWB" style="width:24px;height:24px">' + ic('copy') + '</button>' : '') + '</span></div><div class="cd-b">' + stageBar(sh) + '<div class="lines" style="margin-top:14px">' +
          sh.lines.map(function (l) { return lineRow(o, l.i, l.q); }).join('') + '</div></div><div class="cd-f">' + (sh.awb ? '<button class="b" type="button" data-act="label" data-s="' + sh.id + '">' + ic('printer') + 'Shipping label</button>' : '') +
          (sh.awb && o.m !== 'pickup' ? '<a class="b" href="#/journey/' + o.id + (o.ships.length > 1 ? '?s=' + sh.id : '') + '">' + ic('journey') + 'Journey</a>' : '') +
          (nx ? '<button class="b ' + (nx[0] === 'shipped' ? 'pri' : '') + '" type="button" data-act="adv" data-s="' + sh.id + '" data-to="' + nx[0] + '">' + ic(nx[2]) + nx[1] + '</button>' : '') + '</div></section>'; });
      (o.rets || []).slice().reverse().forEach(function (rt) {
        var val = NL.returnValue(o, rt), acts = { requested: '<button class="b danger" type="button" data-act="rdecline" data-r="' + rt.id + '">Decline</button><button class="b pri" type="button" data-act="rapprove" data-r="' + rt.id + '">' + ic('check') + 'Approve and book pickup</button>',
          approved: '<button class="b pri" type="button" data-act="rreceive" data-r="' + rt.id + '">' + ic('package') + 'Mark received</button>',
          received: '<button class="b pri" type="button" data-act="rrefund" data-r="' + rt.id + '">' + ic('refund') + 'Refund ' + money(val) + (rt.method === 'credit' ? ' as credit' : '') + '</button>' }[rt.st] || '';
        var S = ['requested', 'approved', 'received', 'refunded'], si = S.indexOf(rt.st);
        left += '<section class="cd"><div class="cd-h"><h2 class="row">' + A.retPill(rt) + '<span class="sub mono">' + rt.id + '</span></h2><span class="sub">' + (rt.by === 'customer' ? 'Requested by the customer' : 'Created by staff') + ' · ' + NL.rel(rt.t) + '</span></div><div class="cd-b">' +
          (rt.st !== 'rejected' ? '<div class="stages" style="grid-template-columns:repeat(4,minmax(0,1fr))">' + S.map(function (s, k) { return '<div class="' + (k <= si ? 'on' : '') + '"><i></i>' + { requested: 'Requested', approved: 'Pickup booked', received: 'Received', refunded: 'Refunded' }[s] + '<small>' + (rt.ev[s] ? NL.fDs(rt.ev[s]) : s === 'approved' && rt.pickup ? 'Pickup ' + NL.fDs(rt.pickup) : '—') + '</small></div>'; }).join('') + '</div>' : '') +
          '<div class="lines" style="margin-top:14px">' + rt.lines.map(function (l) { return lineRow(o, l.i, l.q, '<small class="c-vio" style="font-weight:500">Reason: ' + esc(l.reason) + '</small>'); }).join('') + '</div>' +
          (rt.note ? '<div class="note-box" style="margin-top:12px">' + ic('chat') + '<div>“' + esc(rt.note) + '”</div></div>' : '') +
          '<dl class="kv" style="margin-top:12px"><dt>Refund to</dt><dd>' + (rt.method === 'credit' ? 'Store credit' : esc(o.pay.d)) + '</dd><dt>Value</dt><dd>' + money(val) + '</dd>' + (rt.awb ? '<dt>Pickup AWB</dt><dd class="mono">' + rt.awb + '</dd>' : '') + '</dl></div>' + (acts ? '<div class="cd-f">' + acts + '</div>' : '') + '</section>'; });
      // payment summary
      var paidL = o.pay.st === 'cod' ? 'To collect on delivery' : o.pay.st === 'pending' ? 'Awaiting payment' : o.pay.st === 'voided' ? 'Voided' : 'Paid by customer';
      left += '<section class="cd"><div class="cd-h"><h2 class="row">' + A.payPill(o) + '</h2><span class="sub">' + ic(o.pay.m === 'Card' ? 'card' : o.pay.m === 'COD' ? 'cash' : 'bolt') + ' ' + esc(o.pay.m) + ' · ' + esc(o.pay.d) + '</span></div><div class="cd-b"><div class="sum">' +
        '<div><span>Subtotal · ' + NL.plural(NL.qty(o), 'item') + '</span><span>' + money(o.sub) + '</span></div>' +
        (o.disc ? '<div class="neg"><span>Discount · <span class="mono">' + esc(o.disc.code) + '</span></span><span>' + (o.disc.amt ? '−' + money(o.disc.amt) : 'Free shipping') + '</span></div>' : '') +
        '<div><span>Shipping · ' + NL.METHOD_LABEL(o) + '</span><span>' + (o.shipFee ? money(o.shipFee) : 'Free') + '</span></div>' +
        (o.gift && o.gift.fee ? '<div><span>Gift wrap</span><span>' + money(o.gift.fee) + '</span></div>' : '') + (o.codFee ? '<div><span>Cash on delivery fee</span><span>' + money(o.codFee) + '</span></div>' : '') +
        '<div class="t"><span>Total <small class="mute" style="font-weight:400">incl. ' + money(Math.round(o.total - o.total / 1.12)) + ' GST</small></span><span>' + money(o.total) + '</span></div>' +
        '<div><span>' + paidL + '</span><span>' + money(o.pay.st === 'cod' || o.pay.st === 'pending' ? o.total : o.pay.amt) + '</span></div>' +
        o.refunds.map(function (rf) { return '<div class="neg"><span>Refund · ' + NL.fDs(rf.t) + ' · ' + esc(rf.reason) + (rf.method === 'Store credit' ? ' (credit)' : '') + '</span><span>−' + money(rf.amt) + '</span></div>'; }).join('') +
        (o.refunds.length ? '<div class="t"><span>Net</span><span>' + money(o.pay.amt - NL.refunded(o)) + '</span></div>' : '') + '</div></div></section>';
      // timeline
      var days = {}, order = []; o.tl.slice().sort(function (a, b) { return b.t - a.t; }).forEach(function (e) { var d = NL.dayStart(e.t); if (!days[d]) { days[d] = []; order.push(d); } days[d].push(e); });
      left += '<section class="cd"><div class="cd-h"><h2>Timeline</h2><span class="sub">' + NL.plural(o.tl.length, 'event') + '</span></div><div class="cd-b"><div class="compose"><label class="vh" for="tlNote">Add a note</label><textarea class="ta" id="tlNote" placeholder="Leave a note for the team… (⌘↵ to post)" data-kd="notekey"></textarea><button class="b" type="button" data-act="note">Post</button></div><div class="tl">' +
        order.map(function (d) { return '<p class="tl-day">' + (d === NL.dayStart() ? 'Today' : d === NL.dayStart() - NL.DAY ? 'Yesterday' : NL.fD(d)) + '</p>' + days[d].map(function (e) { return '<div class="tl-e k-' + e.k + '"><span class="dt">' + ic(TLI[e.k] || 'check') + '</span><p>' + esc(e.m) + (e.by !== 'System' ? '<small>' + esc(e.by) + '</small>' : '') + '</p><time datetime="' + new Date(e.t).toISOString() + '">' + NL.fT(e.t) + '</time></div>'; }).join(''); }).join('') + '</div></div></section>';
      // right column
      var segs = cs.seg.filter(function (s) { return s !== 'Subscriber'; });
      var right = '<section class="cd"><div class="cd-h"><h3>Customer</h3>' + (c ? '<a class="sub lnk" href="#/customers/' + c.id + '">Profile</a>' : '') + '</div><div class="cd-b"><div class="row" style="gap:12px;flex-wrap:nowrap">' + A.av(o.name) + '<div style="min-width:0"><b style="font-weight:500;display:block">' + esc(o.name) + '</b><small class="mute">' + NL.plural(cs.orders, 'order') + ' · ' + money(cs.ltv) + ' lifetime</small></div></div>' +
        (segs.length ? '<div class="row" style="margin-top:10px">' + segs.map(A.segTag).join('') + '</div>' : '') +
        '<dl class="kv" style="margin-top:14px"><dt>Email</dt><dd><button class="lnk" type="button" data-act="copy" data-v="' + esc(o.email) + '">' + esc(o.email) + '</button></dd><dt>Phone</dt><dd>' + esc(NL.maskPhone(o.addr.phone)) + '</dd></dl></div></section>' +
        '<section class="cd"><div class="cd-h"><h3>Delivery address</h3><button class="ib" type="button" data-act="copy" data-v="' + esc([o.addr.name, o.addr.l1, o.addr.l2, o.addr.city + ' ' + o.addr.pin, o.addr.state].join(', ')) + '" aria-label="Copy address" style="width:26px;height:26px">' + ic('copy') + '</button></div><div class="cd-b"><address style="font-style:normal;font-size:13px;line-height:1.6">' + esc(o.addr.name) + '<br>' + esc(o.addr.l1) + '<br>' + esc(o.addr.l2) + '<br>' + esc(o.addr.city) + ' ' + esc(o.addr.pin) + '<br>' + esc(o.addr.state) + '</address>' +
        '<p class="mute" style="font-size:12px;margin-top:8px">' + ic('pin') + ' ' + esc((NL.pin(o.addr.pin).zone || 'tier').replace('tier', 'Tier 2 city').replace('metro', 'Metro').replace('local', 'Jaipur, local').replace('remote', 'Remote zone, no COD')) + '</p></div></section>' +
        (o.gift ? '<section class="cd"><div class="cd-h"><h3>' + ic('gift') + ' Gift' + (o.gift.wrap ? ', wrapped' : '') + '</h3></div><div class="cd-b"><p class="serif" style="font-size:20px;line-height:1.25">“' + esc(o.gift.note || 'No note') + '”</p><p class="mute" style="font-size:12px;margin-top:8px">Printed on a card in the parcel. Prices are left off the packing slip.</p></div></section>' : '') +
        '<section class="cd"><div class="cd-h"><h3>Tags</h3></div><div class="cd-b"><div class="chips" id="tags">' + o.tags.map(function (t) { return '<span class="chipb">' + esc(t) + '<button type="button" data-act="untag" data-t="' + esc(t) + '" aria-label="Remove tag ' + esc(t) + '">' + ic('x') + '</button></span>'; }).join('') + '</div><label class="vh" for="tagIn">Add a tag</label><input class="in" id="tagIn" data-kd="tagkey" placeholder="Add a tag and press Enter" style="margin-top:' + (o.tags.length ? 10 : 0) + 'px;height:30px;font-size:12.5px"></div></section>' +
        '<section class="cd"><div class="cd-h"><h3>' + ic('shield') + ' Risk</h3><span class="st c-ok">Low</span></div><div class="cd-b"><ul class="mute" style="font-size:12.5px;display:grid;gap:6px"><li>' + ic('check') + ' ' + (o.pay.m === 'COD' ? 'Phone number matches previous orders' : o.pay.m === 'UPI' ? 'UPI handle verified by the bank' : 'Card passed 3-D Secure') + '</li><li>' + ic('check') + ' ' + (cs.orders > 1 ? NL.plural(cs.orders - 1, 'earlier order') + ', none charged back' : 'Pincode is serviceable and matches the city') + '</li><li>' + ic('check') + ' Billing and delivery address match</li></ul><p class="faint" style="font-size:11.5px;margin-top:8px">Checks run on every new order.</p></div></section>' +
        (o.ships.some(function (s) { return s.awb; }) && o.m !== 'pickup' ? miniJourney(o) : '');
      return head + '<div class="g2"><div>' + left + '</div><div>' + right + '</div></div>' +
        (rem.length && !o.cancelled ? '<div class="mobar show-s"><button class="b" type="button" data-act="more">' + ic('more') + 'More</button><button class="b pri" type="button" data-act="fulfil">' + ic('truck') + 'Fulfil items</button></div>' : canShipAny && o.ships.filter(function (s) { return nextStage(s); }).length ? (function () { var s = o.ships.filter(function (x) { return nextStage(x); })[0], nx = nextStage(s); return '<div class="mobar show-s"><a class="b" href="#/journey/' + o.id + '">' + ic('journey') + 'Journey</a><button class="b pri" type="button" data-act="adv" data-s="' + s.id + '" data-to="' + nx[0] + '">' + ic(nx[2]) + nx[1] + '</button></div>'; })() : '');
    },
    mount: function (r) { var q = A.parse(); },
    keys: {
      e: function () { var b = $('[data-act=fulfil]'); if (b) b.click(); }, r: function () { var b = $('[data-act=refund]:not([disabled])'); if (b) b.click(); },
      p: function () { detail.acts.slip(); }, '[': function () { var b = $('[data-act=nav][data-d="-1"]:not([disabled])'); if (b) b.click(); }, ']': function () { var b = $('[data-act=nav][data-d="1"]:not([disabled])'); if (b) b.click(); }
    },
    acts: {
      nav: function (b) { var ix = A.lastList.indexOf(A.parse().id) + +b.getAttribute('data-d'); if (A.lastList[ix]) A.go('orders/' + A.lastList[ix]); },
      copy: function (b) { A.copy(b.getAttribute('data-v')); },
      fulfil: function () { fulfilModal(NL.order(A.parse().id)); },
      refund: function () { refundModal(NL.order(A.parse().id)); },
      slip: function () { var o = NL.order(A.parse().id); A.print(slipHTML(o)); NL.log('Printed packing slip', o.id, ''); NL.save('audit'); },
      label: function (b) { var o = NL.order(A.parse().id), sh = o.ships.filter(function (s) { return s.id === b.getAttribute('data-s'); })[0]; printPreview('Shipping label', labelHTML(o, sh), o.id + ' · ' + sh.awb); },
      adv: function (b) { var o = NL.order(A.parse().id), sid = b.getAttribute('data-s'), to = b.getAttribute('data-to'), sh = o.ships.filter(function (s) { return s.id === sid; })[0];
        if (to === 'shipped') { A.modal({ title: 'Hand shipment ' + sid.slice(1) + ' to ' + esc(sh.carrier) + '?', sub: 'We’ll generate the AWB, start tracking and message the customer.', size: 'sm', body: '<label class="fl"><span>AWB / tracking number</span><input class="in mono" id="awb" value="' + (sh.awb || NL.CARRIER[o.m === 'exp' ? 'exp' : o.m === 'same' ? 'same' : 'std'].code + String(Math.floor(1e8 + Math.random() * 9e8))) + '"></label><label class="sw"><input type="checkbox" id="ntf" checked>Send the “Order shipped” email and WhatsApp</label>',
          foot: [{ label: 'Cancel' }, { label: 'Mark as shipped', cls: 'pri', run: function (api) { var awb = $('#awb', api.el).value.trim().toUpperCase(); if (!/^[A-Z]{2}\d{6,12}$/.test(awb)) { $('#awb', api.el).classList.add('bad'); api.note('<span class="c-bad">AWBs here are two letters and 6–12 digits, like PW480219337.</span>'); return; } NL.advance(o, sid, 'shipped', { awb: awb, notify: $('#ntf', api.el).checked }); api.close(); A.refresh(); A.toast('Shipped with ' + esc(sh.carrier) + ' · ' + awb, { icon: 'truck', action: ['Print label', function () { A.print(labelHTML(o, sh)); }] }); } }], footNote: '' }); return; }
        NL.advance(o, sid, to); A.refresh(); A.toast({ out: 'Out for delivery. The customer got a WhatsApp.', delivered: 'Delivered. ' + (NL.payStatus(o) === 'paid' && o.pay.m === 'COD' ? 'Cash collected and marked paid.' : 'Delivery confirmation sent.') }[to], { icon: to === 'delivered' ? 'check' : 'truck' }); },
      more: function (b) { var o = NL.order(A.parse().id), canCancel = !o.cancelled && !o.ships.some(function (s) { return NL.STG.indexOf(s.stage) >= 2; }), canRet = !NL.openReturn(o) && o.ships.some(function (s) { return s.stage === 'delivered'; }) && o.m !== 'pickup';
        A.menu(b, [{ label: 'Print packing slip', icon: 'printer', kbd: 'P', run: detail.acts.slip }, { label: 'Print shipping labels', icon: 'printer', run: function () { var S = o.ships.filter(function (s) { return s.awb; }); if (!S.length) { A.toast('No labels yet. Ship the order first.', { bad: true }); return; } printPreview('Shipping labels', S.map(function (s) { return labelHTML(o, s); }).join(''), o.id); } },
          { label: 'Open the customer’s tracking page', icon: 'ext', run: function () { open('track.html?o=' + o.id + '&e=' + encodeURIComponent(o.email), '_blank'); } }, { label: 'Watch the journey', icon: 'journey', run: function () { A.go('journey/' + o.id); } },
          { label: 'Copy order link', icon: 'link', run: function () { A.copy(location.href.split('#')[0] + '#/orders/' + o.id, 'Link'); } }, { sep: 1 },
          { label: 'Create a return', icon: 'return', run: function () { if (!canRet) { A.toast(NL.openReturn(o) ? 'There’s already an open return on this order.' : 'Returns open once something has been delivered.', { bad: true }); return; } returnModal(o); } },
          { label: 'Resend confirmation', icon: 'mail', run: function () { NL.notify('placed', o); NL.save('orders'); A.refresh(); A.toast('Confirmation resent by email and WhatsApp', { icon: 'mail' }); } },
          { label: 'Cancel order', icon: 'x', danger: true, run: function () { if (!canCancel) { A.toast(o.cancelled ? 'This order is already cancelled.' : 'Part of this order has shipped. Refund or return those items instead.', { bad: true }); return; } cancelModal(o); } }], { right: true }); },
      note: function () { var t = $('#tlNote'), v = t.value.trim(); if (!v) { t.focus(); return; } NL.addNote(NL.order(A.parse().id), v); A.refresh(); A.toast('Note added to the timeline', { icon: 'note' }); },
      notekey: function (t, e) { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); detail.acts.note(); } },
      tagkey: function (t, e) { if (e.key !== 'Enter') return; e.preventDefault(); var v = t.value.trim().slice(0, 24), o = NL.order(A.parse().id); if (!v || o.tags.indexOf(v) >= 0) return; o.tags.push(v); NL.bump(); NL.log('Tagged order', o.id, v); NL.save('orders'); A.refresh(); var n = $('#tagIn'); if (n) n.focus(); },
      untag: function (b) { var o = NL.order(A.parse().id), t = b.getAttribute('data-t'), ix = o.tags.indexOf(t); o.tags.splice(ix, 1); NL.bump(); NL.save('orders'); A.refresh(); A.toast('Removed the tag “' + esc(t) + '”', { undo: function () { o.tags.splice(ix, 0, t); NL.save('orders'); A.refresh(); } }); },
      markpaid: function () { var o = NL.order(A.parse().id); o.pay.st = 'paid'; o.pay.amt = o.total; o.pay.at = Date.now(); o.tl.push({ t: Date.now(), k: 'pay', m: 'Payment of ' + money(o.total) + ' approved via UPI · ' + o.pay.d, by: 'System' }); NL.bump(); NL.log('Marked paid', o.id, 'UPI approved'); NL.save('orders'); A.refresh(); A.toast('Payment approved. Ready to fulfil.'); },
      rapprove: function (b) { var o = NL.order(A.parse().id), id = b.getAttribute('data-r'), tm = NL.addBiz(Date.now(), 1);
        A.modal({ title: 'Approve return ' + id + '?', sub: 'A Parcelwise rider collects it from the customer and brings it to the studio.', size: 'sm', body: '<label class="fl"><span>Pickup date</span><select class="sel" id="pk">' + [1, 2, 3].map(function (n) { var d = NL.addBiz(Date.now(), n); return '<option value="' + d + '">' + NL.fD(d) + (n === 1 ? ' (next working day)' : '') + '</option>'; }).join('') + '</select></label><label class="sw"><input type="checkbox" id="ntf" checked>Send the “Return approved” message</label>',
          foot: [{ label: 'Cancel' }, { label: 'Approve return', cls: 'pri', run: function (api) { NL.updateReturn(o, id, 'approved', { pickup: +$('#pk', api.el).value, notify: $('#ntf', api.el).checked }); api.close(); A.refresh(); A.toast('Return approved · pickup booked'); } }] }); },
      rdecline: function (b) { var o = NL.order(A.parse().id), id = b.getAttribute('data-r');
        A.modal({ title: 'Decline return ' + id + '?', size: 'sm', body: '<label class="fl"><span>Reason the customer will see</span><select class="sel" id="why"><option>Outside the 30-day return window</option><option>Item shows signs of wear</option><option>Final sale item</option><option>Missing original packaging</option></select></label>',
          foot: [{ label: 'Keep it open' }, { label: 'Decline return', cls: 'danger pri', run: function (api) { NL.updateReturn(o, id, 'rejected', { reason: $('#why', api.el).value }); api.close(); A.refresh(); A.toast('Return declined'); } }] }); },
      rreceive: function (b) { var o = NL.order(A.parse().id), id = b.getAttribute('data-r'), rt = o.rets.filter(function (x) { return x.id === id; })[0];
        A.modal({ title: 'Receive and inspect ' + id, sub: 'Check each item before it goes back on the shelf.', size: 'sm', body: '<div class="lines">' + rt.lines.map(function (l) { return lineRow(o, l.i, l.q); }).join('') + '</div><label class="sw"><input type="checkbox" id="rs" checked>Condition is good, restock ' + NL.plural(rt.lines.reduce(function (a, l) { return a + l.q; }, 0), 'item') + '</label><p class="mute" style="font-size:12.5px">Unticked items are logged as not restockable and stay out of inventory.</p>',
          foot: [{ label: 'Cancel' }, { label: 'Mark received', cls: 'pri', run: function (api) { var rs = $('#rs', api.el).checked; NL.updateReturn(o, id, 'received', { restock: rs }); api.close(); A.refresh(); A.toast(rs ? 'Received and restocked. Inventory updated.' : 'Received, not restocked.', { icon: 'package', action: rs ? ['View stock', function () { A.go('inventory?q=' + NL.skuCode(NL.skuKey(o.items[rt.lines[0].i].pid, o.items[rt.lines[0].i].c, o.items[rt.lines[0].i].s))); }] : null }); } }] }); },
      rrefund: function (b) { var o = NL.order(A.parse().id), id = b.getAttribute('data-r'), rt = o.rets.filter(function (x) { return x.id === id; })[0], val = NL.returnValue(o, rt);
        A.confirm({ title: 'Refund ' + money(val) + ' for ' + id + '?', sub: 'To ' + (rt.method === 'credit' ? 'the customer’s store credit' : o.pay.d) + '. The discount on the order is shared across items, so this is the price they actually paid.', ok: 'Refund ' + money(val) }).then(function (y) { if (!y) return; var res = NL.updateReturn(o, id, 'refunded'); if (!res.ok) { A.toast(res.msg, { bad: true }); return; } A.refresh(); A.toast('Refunded ' + money(val) + '. Return closed.', { icon: 'refund' }); }); }
    }
  };
  NL.METHOD_LABEL = function (o) { return o.m === 'pickup' ? 'Collected at the pop-up' : (NL.METHOD[o.m] || 'Standard') + ' delivery'; };

  function miniJourney(o) {
    var sh = o.ships.filter(function (s) { return s.awb && s.stage !== 'delivered'; })[0] || o.ships[o.ships.length - 1], E = NL.scans(o, sh), done = E.filter(function (e) { return e.done; }), last = done[done.length - 1] || E[0];
    var P = E.map(function (e) { return [(e.lon - 68) * 9, (37 - e.lat) * 9]; }), xs = P.map(function (p) { return p[0]; }), ys = P.map(function (p) { return p[1]; });
    var x0 = Math.min.apply(null, xs) - 30, x1 = Math.max.apply(null, xs) + 30, y0 = Math.min.apply(null, ys) - 30, y1 = Math.max.apply(null, ys) + 30, w = Math.max(x1 - x0, (y1 - y0) * 1.6), h = w / 1.6;
    var d = P.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(''), li = E.indexOf(last);
    var dd = P.slice(0, li + 1).map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
    return '<a class="livecard" href="#/journey/' + o.id + '" style="margin-top:16px"><svg viewBox="' + x0 + ' ' + (y0 - (h - (y1 - y0)) / 2) + ' ' + w + ' ' + h + '" aria-hidden="true"><path d="' + d + '" fill="none" stroke="rgba(237,231,220,.22)" stroke-width="1.5" stroke-dasharray="2 4" vector-effect="non-scaling-stroke"/><path d="' + dd + '" fill="none" stroke="#D9825A" stroke-width="2" vector-effect="non-scaling-stroke"/>' +
      P.map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i === li ? 5 : 2.5) + '" fill="' + (i <= li ? '#D9825A' : 'rgba(237,231,220,.4)') + '"/>'; }).join('') + '</svg><div class="lc-t"><small><i></i>' + (sh.stage === 'delivered' ? 'Delivered' : 'Live journey') + '</small><b>' + esc(last.place) + '</b><span>' + esc(last.msg) + ' · ' + NL.rel(last.t) + '</span></div><span class="lc-go">Watch ' + ic('arrow-r') + '</span></a>';
  }

  /* ───────── modals ───────── */
  function stepper(name, max, val, label) { return '<span class="stepper"><button type="button" data-st="-1" aria-label="One fewer">−</button><input type="text" inputmode="numeric" name="' + name + '" value="' + val + '" data-max="' + max + '" aria-label="' + esc(label) + '"><small>/ ' + max + '</small><button type="button" data-st="1" aria-label="One more">+</button></span>'; }
  function wireSteppers(root, onChange) { root.addEventListener('click', function (e) { var b = e.target.closest('[data-st]'); if (!b) return; var inp = $('input', b.parentNode), mx = +inp.getAttribute('data-max'); inp.value = Math.max(0, Math.min(mx, (+inp.value || 0) + +b.getAttribute('data-st'))); onChange(); });
    root.addEventListener('input', function (e) { if (e.target.closest('.stepper')) { var inp = e.target, mx = +inp.getAttribute('data-max'); inp.value = Math.max(0, Math.min(mx, parseInt(inp.value.replace(/\D/g, ''), 10) || 0)); onChange(); } }); }
  function fulfilModal(o) {
    var rem = o.items.map(function (it, i) { return { i: i, q: NL.remaining(o, i), on: NL.stock(NL.skuKey(it.pid, it.c, it.s)).on }; }).filter(function (l) { return l.q > 0; });
    var m = o.m === 'pickup' ? 'std' : o.m, carriers = [['std', 'Parcelwise · Standard'], ['exp', 'Arrowpost Express']].concat(o.addr.city === 'Jaipur' ? [['same', 'Swiftline Same-day']] : []);
    var awb = NL.CARRIER[m].code + String(Math.floor(1e8 + Math.random() * 9e8));
    var T = NL.db().tpl.shipped, chs = [T.email.on && 'email', T.wa.on && 'WhatsApp'].filter(Boolean).join(' and ') || 'no channels (both are switched off)';
    A.modal({ title: 'Fulfil ' + o.id, sub: esc(o.name) + ' · ' + esc(o.addr.city) + ' ' + esc(o.addr.pin) + ' · customer chose ' + NL.METHOD_LABEL(o).toLowerCase(), size: 'lg',
      body: '<div class="lines">' + rem.map(function (l) { var it = o.items[l.i]; return '<div class="line" style="grid-template-columns:44px minmax(0,1fr) auto">' + A.thumb(it.pid) + '<div><b>' + esc(it.name) + '</b><small>' + esc(it.col) + (it.s !== 'One size' ? ' · ' + esc(it.s) : '') + ' · <span class="mono">' + NL.skuCode(NL.skuKey(it.pid, it.c, it.s)) + '</span></small><small class="' + (l.on < l.q ? 'c-warn' : 'c-ok') + '" style="font-weight:500">' + (l.on < l.q ? 'Only ' + l.on + ' on the shelf' : l.on + ' on the shelf') + '</small></div>' + stepper('q' + l.i, l.q, Math.min(l.q, l.on), 'Quantity of ' + it.name + ' to ship') + '</div>'; }).join('') + '</div>' +
        '<div class="fgrid"><label class="fl"><span>Carrier</span><select class="sel" id="car">' + carriers.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === m ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('') + '</select></label><label class="fl"><span>AWB / tracking number</span><input class="in mono" id="awb" value="' + awb + '"></label></div>' +
        '<label class="sw"><input type="checkbox" id="shipNow" checked>Hand to the carrier now (mark as shipped)</label><label class="sw"><input type="checkbox" id="ntf" checked>Notify the customer by ' + chs + '</label><div id="fnote"></div>',
      foot: [{ label: 'Cancel' }, { label: 'Packing slip', run: function () { A.print(slipHTML(o)); } }, { label: 'Fulfil', cls: 'pri', id: 'fgo', run: function (api) {
        var lines = rem.map(function (l) { return { i: l.i, q: +$('[name=q' + l.i + ']', api.el).value || 0 }; }).filter(function (l) { return l.q > 0; });
        if (!lines.length) { api.note('<span class="c-bad">Choose at least one item to ship.</span>'); return; }
        var ship = $('#shipNow', api.el).checked, awbV = $('#awb', api.el).value.trim().toUpperCase();
        if (ship && !/^[A-Z]{2}\d{6,12}$/.test(awbV)) { $('#awb', api.el).classList.add('bad'); api.note('<span class="c-bad">AWBs are two letters and 6–12 digits, like PW480219337.</span>'); return; }
        var car = $('#car', api.el).value, sh = NL.fulfil(o, lines, { carrier: NL.CARRIER[car].name, awb: awbV, ship: ship, notify: $('#ntf', api.el).checked });
        api.close(); A.refresh();
        A.toast((NL.fulfilment(o) === 'partial' ? 'Partial shipment created. ' : 'Fulfilled. ') + (ship ? 'Handed to ' + esc(sh.carrier) + ' · ' + sh.awb : 'Packed and waiting for pickup.'), { icon: 'truck', action: ship ? ['Print label', function () { A.print(labelHTML(o, sh)); }] : null, ms: 6500 });
      } }],
      footNote: '',
      onOpen: function (api) { function upd() { var tot = 0, all = 0; rem.forEach(function (l) { var v = +$('[name=q' + l.i + ']', api.el).value || 0; tot += v; all += l.q; });
          $('#fgo', api.el).textContent = tot === all ? 'Fulfil ' + NL.plural(tot, 'item') : tot ? 'Ship ' + tot + ' of ' + all + ' (partial)' : 'Fulfil';
          $('#fnote', api.el).innerHTML = tot && tot < all ? '<div class="note-box warn">' + A.ic('split') + '<div><b>Partial shipment.</b> ' + NL.plural(all - tot, 'item') + ' stay unfulfilled and keep their stock reserved. You can ship them later as a second parcel.</div></div>' : '';
          api.note(tot ? NL.plural(tot, 'item') + ' leave the shelf · inventory updates right away' : ''); }
        wireSteppers(api.el, upd); upd();
        $('#car', api.el).addEventListener('change', function () { $('#awb', api.el).value = NL.CARRIER[this.value].code + String(Math.floor(1e8 + Math.random() * 9e8)); });
        $('#shipNow', api.el).addEventListener('change', function () { $('#awb', api.el).disabled = !this.checked; }); }
    });
  }
  function refundModal(o) {
    var max = NL.refundable(o), refQ = {}; o.refunds.forEach(function (rf) { rf.lines.forEach(function (l) { refQ[l.i] = (refQ[l.i] || 0) + l.q; }); });
    var L = o.items.map(function (it, i) { return { i: i, max: Math.max(0, it.q - (refQ[i] || 0) - Math.max(0, (it.cq || 0) - (refQ[i] || 0))) , unit: NL.unitNet(o, i) }; }).filter(function (l) { return l.max > 0; });
    if (o.pay.st === 'cod' || o.pay.st === 'pending') { A.modal({ title: 'Nothing to refund yet', size: 'sm', body: '<div class="note-box warn">' + ic('cash') + '<div>' + (o.pay.st === 'cod' ? 'This is a cash-on-delivery order and the cash hasn’t been collected. Cancel the order or remove items instead.' : 'The UPI payment is still pending.') + '</div></div>', foot: [{ label: 'Close' }] }); return; }
    A.modal({ title: 'Refund ' + o.id, sub: money(max) + ' refundable of ' + money(o.pay.amt) + ' paid by ' + esc(o.pay.d), size: 'lg',
      body: (L.length ? '<div><p class="lbl" style="margin-bottom:6px">Items</p><div class="lines">' + L.map(function (l) { var it = o.items[l.i], shipped = NL.shippedQ(o, l.i) > 0; return '<div class="line" style="grid-template-columns:44px minmax(0,1fr) auto">' + A.thumb(it.pid) + '<div><b>' + esc(it.name) + '</b><small>' + esc(it.col) + (it.s !== 'One size' ? ' · ' + esc(it.s) : '') + ' · ' + money(l.unit) + ' each after discount' + (shipped ? '' : ' · not shipped, will be removed from the order') + '</small></div>' + stepper('r' + l.i, l.max, 0, 'Quantity of ' + it.name + ' to refund') + '</div>'; }).join('') + '</div></div>' : '') +
        '<div class="fgrid">' + (o.shipFee ? '<label class="ck"><input type="checkbox" id="rship">Refund shipping (' + money(o.shipFee) + ')</label>' : '<span></span>') + '<label class="sw"><input type="checkbox" id="rstock">Restock shipped items that come back</label></div>' +
        '<div class="fgrid"><label class="fl"><span>Refund amount</span><span class="pre"><i>₹</i><input class="in" id="ramt" inputmode="decimal" value="0"></span><span class="hint" id="rhint">Up to ' + money(max) + '</span></label><label class="fl"><span>Reason</span><select class="sel" id="rwhy"><option>Customer return</option><option>Damaged in transit</option><option>Item missing from parcel</option><option>Goodwill gesture</option><option>Price adjustment</option><option>Order cancelled</option></select></label>' +
        '<label class="fl"><span>Refund to</span><select class="sel" id="rmeth"><option value="Original payment">Original payment · ' + esc(o.pay.d) + '</option><option value="Store credit">Northlane store credit</option></select></label><label class="sw" style="align-self:end;padding-bottom:8px"><input type="checkbox" id="ntf" checked>Notify the customer</label></div>',
      foot: [{ label: 'Cancel' }, { label: 'Refund', cls: 'pri', id: 'rgo', run: function (api) {
        var amt = parseFloat(($('#ramt', api.el).value || '').replace(/[^0-9.]/g, '')) || 0, lines = L.map(function (l) { return { i: l.i, q: +$('[name=r' + l.i + ']', api.el).value || 0 }; }).filter(function (l) { return l.q > 0; });
        if (amt <= 0) { $('#ramt', api.el).classList.add('bad'); api.note('<span class="c-bad">Enter an amount above zero, or pick the items to refund.</span>'); return; }
        if (amt > max + .001) { $('#ramt', api.el).classList.add('bad'); api.note('<span class="c-bad">That’s more than the ' + money(max) + ' left to refund on this order.</span>'); return; }
        var res = NL.refund(o, { amt: amt, lines: lines, reason: $('#rwhy', api.el).value, restock: $('#rstock', api.el).checked, method: $('#rmeth', api.el).value, notify: $('#ntf', api.el).checked });
        if (!res.ok) { api.note('<span class="c-bad">' + esc(res.msg) + '</span>'); return; } api.close(); A.refresh();
        A.toast((amt >= max - .5 ? 'Refunded in full: ' : 'Partial refund: ') + money(amt) + (res.refund.method === 'Store credit' ? ' as store credit' : ' to ' + esc(o.pay.d)), { icon: 'refund' }); } }],
      footNote: '',
      onOpen: function (api) { var manual = false;
        function calc() { if (manual) return; var s = 0; L.forEach(function (l) { s += (+$('[name=r' + l.i + ']', api.el).value || 0) * l.unit; }); if ($('#rship', api.el) && $('#rship', api.el).checked) s += o.shipFee; s = Math.min(s, max); $('#ramt', api.el).value = s ? s.toFixed(s % 1 ? 2 : 0) : 0; upd(); }
        function upd() { var v = parseFloat(($('#ramt', api.el).value || '').replace(/[^0-9.]/g, '')) || 0; $('#ramt', api.el).classList.toggle('bad', v > max + .001); $('#rgo', api.el).textContent = v ? 'Refund ' + money(Math.min(v, max)) : 'Refund'; api.note(v ? (v >= max - .5 ? 'Full refund · the order will show as refunded' : money(max - v) + ' stays refundable afterwards') : 'Pick items or type an amount'); }
        wireSteppers(api.el, function () { manual = false; calc(); }); if ($('#rship', api.el)) $('#rship', api.el).addEventListener('change', function () { manual = false; calc(); });
        $('#ramt', api.el).addEventListener('input', function () { manual = true; upd(); }); calc(); }
    });
  }
  function cancelModal(o) {
    var packed = o.ships.length > 0, paid = o.pay.st === 'paid' && NL.refundable(o) > 0;
    A.modal({ title: 'Cancel ' + o.id + '?', sub: 'This can’t be undone. The customer is told by email and WhatsApp.', size: 'sm',
      body: '<label class="fl"><span>Reason</span><select class="sel" id="cwhy"><option>Customer changed their mind</option><option>Ordered the wrong size</option><option>Item out of stock</option><option>Payment flagged as risky</option><option>Address not serviceable</option></select></label>' +
        (packed ? '<label class="sw"><input type="checkbox" id="crs" checked>Put the packed items back on the shelf</label>' : '') +
        '<div class="note-box ' + (paid ? 'warn' : '') + '">' + ic(paid ? 'refund' : 'cash') + '<div>' + (paid ? money(NL.refundable(o)) + ' is refunded in full to ' + esc(o.pay.d) + '.' : o.pay.st === 'cod' ? 'Cash on delivery, nothing was collected. The order is voided.' : 'Nothing was charged.') + '</div></div>',
      foot: [{ label: 'Keep the order' }, { label: 'Cancel order', cls: 'danger pri', run: function (api) { var res = NL.cancel(o, { reason: $('#cwhy', api.el).value, restock: !$('#crs', api.el) || $('#crs', api.el).checked }); api.close(); if (!res.ok) { A.toast(res.msg, { bad: true }); return; } A.refresh(); A.toast('Order cancelled' + (paid ? ' and refunded' : ''), { icon: 'x' }); } }] });
  }
  function returnModal(o) {
    var L = o.items.map(function (it, i) { return { i: i, max: NL.shippedQ(o, i) - (it.rq || 0) }; }).filter(function (l) { return l.max > 0; });
    A.modal({ title: 'Create a return for ' + o.id, sub: 'For returns the customer arranged by phone or WhatsApp. Customers can also start one from their account.', size: 'lg',
      body: '<div class="lines">' + L.map(function (l) { var it = o.items[l.i]; return '<div class="line" style="grid-template-columns:44px minmax(0,1fr) auto auto">' + A.thumb(it.pid) + '<div><b>' + esc(it.name) + '</b><small>' + esc(it.col) + (it.s !== 'One size' ? ' · ' + esc(it.s) : '') + '</small></div><select class="sel" name="why' + l.i + '" style="width:auto;height:30px;font-size:12.5px" aria-label="Reason">' + NL.RETR.map(function (r) { return '<option>' + r + '</option>'; }).join('') + '</select>' + stepper('t' + l.i, l.max, L.length === 1 ? 1 : 0, 'Quantity of ' + it.name + ' to return') + '</div>'; }).join('') + '</div>' +
        '<div class="fgrid"><label class="fl"><span>Refund to</span><select class="sel" id="tmeth"><option value="original">Original payment</option><option value="credit">Store credit</option></select></label><label class="sw" style="align-self:end;padding-bottom:8px"><input type="checkbox" id="tapp" checked>Approve and book the pickup now</label></div><label class="fl"><span>Note (optional)</span><input class="in" id="tnote" placeholder="e.g. Wants to exchange for size L"></label>',
      foot: [{ label: 'Cancel' }, { label: 'Create return', cls: 'pri', run: function (api) { var lines = L.map(function (l) { return { i: l.i, q: +$('[name=t' + l.i + ']', api.el).value || 0, reason: $('[name=why' + l.i + ']', api.el).value }; }).filter(function (l) { return l.q > 0; });
        if (!lines.length) { api.note('<span class="c-bad">Choose at least one item to return.</span>'); return; }
        var res = NL.requestReturn(o, { lines: lines, method: $('#tmeth', api.el).value, note: $('#tnote', api.el).value.trim(), by: 'staff' }); if (!res.ok) { api.note('<span class="c-bad">' + esc(res.msg) + '</span>'); return; }
        if ($('#tapp', api.el).checked) NL.updateReturn(o, res.rma.id, 'approved'); api.close(); A.refresh(); A.toast('Return ' + res.rma.id + ' created', { icon: 'return' }); } }], footNote: '',
      onOpen: function (api) { wireSteppers(api.el, function () {}); } });
  }
  function printPreview(title, html, sub) { A.modal({ title: title, sub: esc(sub || '') + ' · packing label', size: 'lg', body: '<div class="prpv">' + html + '</div>', foot: [{ label: 'Close' }, { label: ic('printer') + ' Print', cls: 'pri', run: function (api) { api.close(); A.print(html); } }] }); }

  /* ───────── printables ───────── */
  function slipHTML(o) {
    var items = o.items.map(function (it, i) { var q = it.q - (it.cq || 0); if (!q) return ''; return '<tr><td><span class="box"></span></td><td><b>' + esc(it.name) + '</b><br>' + esc(it.col) + (it.s !== 'One size' ? ', ' + esc(it.s) : '') + '</td><td style="font-family:monospace">' + NL.skuCode(NL.skuKey(it.pid, it.c, it.s)) + '</td><td>' + q + '</td>' + (o.gift ? '' : '<td style="text-align:right">' + money(it.price * q) + '</td>') + '</tr>'; }).join('');
    return '<div class="slip"><div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #000;padding-bottom:12px"><div><div class="wm">Northlane</div><div style="margin-top:6px">Studio &amp; warehouse · Sanganer, Jaipur 302029</div></div><div style="text-align:right"><b style="font-size:18px">Packing slip</b><br>' + o.id + ' · ' + NL.fD(o.t) + '</div></div>' +
      '<div style="display:flex;gap:40px;margin-top:14px"><div><b>Ship to</b><br>' + esc(o.addr.name) + '<br>' + esc(o.addr.l1) + '<br>' + esc(o.addr.l2) + '<br>' + esc(o.addr.city) + ' ' + esc(o.addr.pin) + ', ' + esc(o.addr.state) + '</div><div><b>Delivery</b><br>' + NL.METHOD_LABEL(o) + '<br>' + esc(o.pay.m === 'COD' ? 'Collect ' + money(o.total) + ' in cash' : 'Prepaid') + '</div></div>' +
      '<table><thead><tr><th></th><th>Item</th><th>SKU</th><th>Qty</th>' + (o.gift ? '' : '<th style="text-align:right">Price</th>') + '</tr></thead><tbody>' + items + '</tbody></table>' +
      (o.gift ? '<div style="margin-top:16px;padding:14px;border:1px dashed #000"><b>Gift note</b> (prices left off)<br><span style="font:italic 18px Georgia,serif">“' + esc(o.gift.note || '') + '”</span></div>' : '') +
      '<p style="margin-top:18px">Thank you for choosing fewer, better things. Returns are free for 30 days: start one from your Northlane account. Free repairs for two years.</p><p style="margin-top:6px;color:#555">Packed by ' + esc(NL.who()) + ' · Northlane, Jaipur studio</p></div>';
  }
  function bars(s) { var x = 0, out = '', h = 0; for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; } var str = '11010010000' + s.split('').map(function (c) { var n = c.charCodeAt(0) * 7 + 13; return ((n % 64) + 64).toString(2).slice(1) + '0' + ((n * 3 % 32) + 32).toString(2).slice(1); }).join('') + '1100011101011';
    for (var k = 0; k < str.length; k++) { if (str[k] === '1') out += '<rect x="' + x + '" y="0" width="1" height="60"/>'; x++; } return '<svg class="bc" viewBox="0 0 ' + x + ' 60" preserveAspectRatio="none" aria-hidden="true">' + out + '</svg>'; }
  function qr(s) { var n = 25, h = 2166136261, cells = ''; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    function fin(x, y) { return '<rect x="' + x + '" y="' + y + '" width="7" height="7"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3"/>'; }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) { if ((x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)) continue; h ^= h << 13; h ^= h >>> 17; h ^= h << 5; if ((h >>> 0) % 100 < 46) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>'; }
    return '<svg viewBox="-1 -1 ' + (n + 2) + ' ' + (n + 2) + '" width="84" height="84" aria-hidden="true"><rect x="-1" y="-1" width="' + (n + 2) + '" height="' + (n + 2) + '" fill="#fff"/>' + fin(0, 0) + fin(n - 7, 0) + fin(0, n - 7) + cells + '</svg>'; }
  function labelHTML(o, sh) {
    var g = NL.geo(o.addr.city), hub = g ? NL.HUB[g.region] : NL.HUB.C, w = (sh.lines.reduce(function (a, l) { return a + l.q; }, 0) * .6 + .2).toFixed(1);
    return '<div class="label"><div style="display:flex;justify-content:space-between;align-items:center"><span class="big">' + esc(sh.carrier.toUpperCase()) + '</span><b style="font-size:13px">' + (o.m === 'exp' ? 'EXPRESS' : o.m === 'same' ? 'SAME DAY' : 'SURFACE') + '</b></div>' +
      '<div>' + bars(sh.awb) + '<div style="text-align:center;font:700 15px monospace;letter-spacing:3px;margin-top:4px">' + sh.awb + '</div></div>' +
      '<div><b>DELIVER TO</b><br><span style="font-size:14px;font-weight:700">' + esc(o.addr.name) + '</span><br>' + esc(o.addr.l1) + '<br>' + esc(o.addr.l2) + '<br><b style="font-size:16px">' + esc(o.addr.city.toUpperCase()) + ' ' + esc(o.addr.pin) + '</b><br>' + esc(o.addr.state) + ' · ' + esc(NL.maskPhone(o.addr.phone)) + '</div>' +
      '<div class="two"><div><b>FROM</b><br>Northlane Studio<br>Plot 14, Sanganer Industrial Area<br>Jaipur 302029, Rajasthan</div><div><b>' + (o.pay.m === 'COD' && o.pay.st === 'cod' ? 'COLLECT CASH' : 'PREPAID') + '</b><br><span class="big">' + (o.pay.m === 'COD' && o.pay.st === 'cod' ? money(o.total) : '₹0') + '</span><br>Weight ' + w + ' kg · ' + NL.plural(sh.lines.reduce(function (a, l) { return a + l.q; }, 0), 'pc') + '</div></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div>Order <b>' + o.id + '</b> · Shipment ' + sh.id.slice(1) + '<br>Route: JAI → ' + esc((hub.short || '').toUpperCase().slice(0, 3)) + ' → ' + esc(o.addr.city.toUpperCase().slice(0, 3)) + '<br><span style="font-size:9px">NORTHLANE · JAIPUR STUDIO</span></div>' + qr(sh.awb + o.id) + '</div></div>';
  }
  A.slipHTML = slipHTML; A.labelHTML = labelHTML;

  /* palette commands for orders */
  A.cmd({ label: 'Fulfil the oldest unfulfilled order', icon: 'truck', keys: 'ship pack next', pin: true, run: function () { var L = NL.db().orders.filter(function (o) { return !o.cancelled && NL.fulfilment(o) !== 'fulfilled' && o.pay.st !== 'pending'; }).sort(function (a, b) { return a.t - b.t; }); if (!L.length) { A.toast('Nothing waiting to be fulfilled. Nice.'); return; } A.go('orders/' + L[0].id); setTimeout(function () { fulfilModal(NL.order(L[0].id)); }, 420); } });
  A.cmd({ label: 'View unfulfilled orders', icon: 'orders', keys: 'to do pending', run: function () { A.go('orders?v=unfulfilled'); } });
  A.cmd({ label: 'View COD orders to collect', icon: 'cash', keys: 'cash on delivery unpaid', run: function () { A.go('orders?pay=cod'); } });
  A.cmd({ label: 'Export all orders as CSV', icon: 'download', keys: 'download spreadsheet', run: function () { exportCsv(NL.db().orders, 'northlane-orders.csv'); } });
  A.fulfilModal = fulfilModal;
  addEventListener('hashchange', function () { var r = A.parse(); if (r.name === 'orders' && !r.id) A.lastQ = location.hash.indexOf('?') >= 0 ? '?' + location.hash.split('?')[1] : ''; });
})();
