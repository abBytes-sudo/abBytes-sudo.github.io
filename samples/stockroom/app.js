/* Stockroom app controller: routing, actions with undo, keyboard shortcuts, the command palette, saved views,
   bulk actions, inline editing, pick mode, the camera scanner, printing and the Lumen CRM bridge. */
(function () {
  'use strict';
  if (window.SR_APP) return; // already running (boot.js may have re-fetched this file)
  window.SR_APP = true;
  /* Boot guard. The four scripts below load with defer; if the network drops one (a flaky server, a train tunnel),
     re-fetch it and everything after it, in order, before starting. Each check looks for the script's finished export. */
  var DEPS = [
    ['data.js', function () { return window.HALDEN && window.HALDEN.seed; }],
    ['engine.js', function () { return window.SR && window.SR.init && window.SR.syncDeals; }],
    ['code128.js', function () { return window.Code128 && window.Code128.draw; }],
    ['wh.js', function () { return window.Wh && window.Wh.render; }],
    ['views.js', function () { return window.SRV && window.SRV.overview && window.SRV.pick; }],
    ['depth.js', function () { return window.SRV && window.SRV.floorBins; }],
    ['papers.js', function () { return window.SRV && window.SRV.docHTML; }]
  ];
  function ensure(i, tries, forced, done) {
    if (i >= DEPS.length) return done();
    if (!forced && DEPS[i][1]()) return ensure(i + 1, 0, false, done);
    if (tries >= 5) return failed();
    var s = document.createElement('script');
    s.src = DEPS[i][0] + '?r=' + Date.now() + tries;
    // once one script is re-fetched, re-fetch the ones after it too: engine.js and views.js capture earlier globals
    s.onload = function () { if (DEPS[i][1]()) ensure(i + 1, 0, true, done); else setTimeout(function () { ensure(i, tries + 1, true, done); }, 250 * (tries + 1)); };
    s.onerror = function () { s.remove(); setTimeout(function () { ensure(i, tries + 1, true, done); }, 250 * (tries + 1)); };
    document.head.appendChild(s);
  }
  function failed() {
    var v = document.getElementById('view');
    if (!v) return;
    v.innerHTML = '<div class="page"><div class="empty2"><b>Stockroom couldn\'t finish loading</b><span>Part of the app didn\'t arrive over the network. Reloading usually fixes it.</span><button class="btn primary" type="button" id="boot-reload">Reload</button></div></div>';
    document.getElementById('boot-reload').addEventListener('click', function () { location.reload(); });
  }
  ensure(0, 0, false, boot);

  function boot() {
  var E = window.SR, V = window.SRV;
  E.init();

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var view = $('#view'), sheetWrap = $('#sheet-wrap'), sheet = $('#sheet'), modal = $('#modal'), toasts = $('#toasts'), bulk = $('#bulk');
  var esc = V.esc, PKEY = 'stockroom:prefs';
  var DEFAULT_VIEWS = [{ name: 'Needs reorder', status: 'low' }, { name: 'Lighting · low', cat: 'Lighting', status: 'low' }, { name: 'Seating', cat: 'Seating' }];
  var U = { wh: '', q: '', cat: '', status: '', locView: 'map', scans: [], lblSel: {}, selItems: {}, selSO: {}, selPO: {}, views: DEFAULT_VIEWS.slice(), pkSkip: {}, range: 30 };
  try {
    var p = JSON.parse(localStorage.getItem(PKEY) || '{}');
    if (p.wh === 'BHW' || p.wh === 'BLR') U.wh = p.wh;
    if (V.ROLES[p.role]) V.who = p.role;
    if (p.itemView === 'cards' || p.itemView === 'table') U.itemView = p.itemView;
    if (p.cols && typeof p.cols === 'object') U.cols = p.cols;
    if (Array.isArray(p.views)) U.views = DEFAULT_VIEWS.concat(p.views.filter(function (v) { return v && v.name; }).map(function (v) { v.custom = true; return v; }));
  } catch (e) { }
  function savePrefs() { try { localStorage.setItem(PKEY, JSON.stringify({ wh: U.wh, itemView: U.itemView || '', cols: U.cols || null, role: V.who, views: U.views.filter(function (v) { return v.custom; }) })); } catch (e) { } }

  var TITLES = { suppliers: 'Suppliers', settings: 'Settings', doc: 'Papers', count: 'Count', receive: 'Receive', overview: 'Today', items: 'Items', locations: 'Locations', ledger: 'Stock ledger', sales: 'Pick and pack', purchasing: 'Purchase orders', scan: 'Scan', labels: 'Labels', reports: 'Reports', pick: 'Pick mode' };
  var SELKEY = { items: 'selItems', sales: 'selSO', purchasing: 'selPO' };
  var route = { name: 'overview', id: null, qs: {} };
  function parse() {
    var h = location.hash.replace(/^#\/?/, ''), qi = h.indexOf('?'), qs = {};
    if (qi >= 0) { h.slice(qi + 1).split('&').forEach(function (kv) { var a = kv.split('='); qs[decodeURIComponent(a[0])] = decodeURIComponent(a[1] || ''); }); h = h.slice(0, qi); }
    var parts = h.split('/');
    if (parts[0] === 'doc') return { name: 'doc', kind: parts[1] || '', id: parts[2] ? decodeURIComponent(parts[2]) : null, qs: qs };
    return { name: TITLES[parts[0]] ? parts[0] : 'overview', id: parts[1] ? decodeURIComponent(parts[1]) : null, qs: qs };
  }

  /* ---------- render ---------- */
  var lastBase = null, kb = -1;
  var h1 = $('#title'), topBar = $('.top');
  function homeTitle() { if (h1.parentNode !== topBar) topBar.insertBefore(h1, $('.sp', topBar)); h1.className = ''; }
  /* what the current person may open: the others go back to Today */
  function allowed(r) {
    if (r.name === 'doc') return r.kind === 'po' ? V.can('purchasing') : r.kind === 'grn' ? true : V.can('sales');
    return V.can(r.name);
  }
  function applyRole() {
    var me = V.me();
    $$('.nav a[data-nav], .tabbar a[data-nav]').forEach(function (a) { a.hidden = !V.can(a.dataset.nav); });
    $$('.nav [data-g="buying"]').forEach(function (el) { if (el.tagName !== 'A') el.hidden = !V.can('purchasing'); });
    $('.nav').setAttribute('data-first', me.first);
    $('#me-av').textContent = me.ini; $('#me-name').textContent = me.name; $('#me-role').textContent = me.title;
    var ta = $('#top-av'); ta.textContent = me.ini; ta.title = me.name + ' · ' + me.title;
  }
  function render(keepScroll) {
    homeTitle();
    var r = route, top = view.scrollTop;
    if (r.name === 'items' && r.qs.status) U.status = r.qs.status;
    if (r.name === 'purchasing' && r.qs.tab) U.potab = r.qs.tab;
    if (r.name === 'ledger' && r.qs.sku != null) U.lsku = r.qs.sku;
    if (r.name === 'scan') U.scanSO = r.qs.so || null;
    if (r.name === 'locations') U.bin = r.id;
    if (r.name === 'pick') U.pickId = r.id;
    if (r.name === 'count' && (!U.cnt || U.cnt.wh !== (U.wh || 'BHW'))) { var cw = U.wh || 'BHW'; U.cnt = { wh: cw, plan: E.countPlan(cw, 8), i: 0, res: {}, step: 'count' }; }
    if (r.name === 'receive') { if (!r.id) U.rcv = null; else if (!U.rcv || U.rcv.id !== r.id) { var rp = E.po(r.id); U.rcv = rp ? { id: r.id, step: 0, q: {}, bin: {}, wh: rp.wh, dn: '', dmg: false, note: '' } : null; } }
    U.sel = r.id;
    if (r.name === 'doc') U.doc = { kind: r.kind, id: r.id };
    view.innerHTML = V[r.name](U);
    if (keepScroll || lastBase === r.name) view.scrollTop = top;
    lastBase = r.name;
    var slot = r.name === 'overview' ? $('#h1-slot', view) : null;
    if (slot) { slot.replaceWith(h1); h1.className = 'today-h1'; h1.textContent = V.headline(V.lastX); }
    else h1.innerHTML = TITLES[r.name] + (r.id && r.name !== 'locations' && r.name !== 'overview' ? ' <span class="crumb">/ ' + esc(r.id) + '</span>' : '');
    document.title = (r.name === 'doc' ? (V.docName(r.kind) || 'Papers') : TITLES[r.name]) + (r.id ? ' ' + r.id : '') + ' · Stockroom';
    document.body.classList.toggle('on-doc', r.name === 'doc');
    mountFloors();
    if (r.name === 'doc') { loadPapers(); fitDoc(); }
    var navName = r.name;
    $$('.nav a, .tabbar a').forEach(function (a) { a.setAttribute('aria-current', a.dataset.nav === navName || (navName === 'pick' && a.dataset.nav === 'sales') ? 'page' : 'false'); });
    $$('[data-act="wh"]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === U.wh)); });
    document.body.classList.toggle('in-pick', r.name === 'pick');
    badges(); drawBarcodes(view); flashTouched(); renderSheet(); updateBulk(); bindArea();
    if (kb >= 0) markKb(kb, true);
    if ((r.name === 'scan' || r.name === 'pick') && stream) attachVideo();
    if (coach) setTimeout(coachPlace, 60);
  }
  var paperCss = false;
  function loadPapers() { if (paperCss) return; paperCss = true; var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'papers.css?v=67'; l.onload = function () { if (route.name === 'doc') fitDoc(); }; document.head.appendChild(l); }
  function mountFloors() { V.mountFloors(view, function (bin) { location.hash = '#/' + (route.name === 'locations' ? 'locations' : 'overview') + '/' + bin; if (route.name === 'locations') setTimeout(function () { flashBin(bin); }, 60); }); }
  function flashBin(bin) {
    var el = $('tr[data-href="#/locations/' + bin + '"]', view) || $('.bin[href="#/locations/' + bin + '"]', view); if (!el) return;
    $$('.locflash', view).forEach(function (x) { x.classList.remove('locflash'); });
    el.classList.add('locflash'); el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  function fitDoc() {
    var f = $('#docfit'), sc = $('#docscale'); if (!f || !sc) return;
    sc.style.transform = ''; sc.style.marginBottom = ''; sc.classList.remove('fit');
    var cs = getComputedStyle(f), inner = f.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), w = sc.offsetWidth, k = Math.min(1, inner / w);
    if (k < 1) { sc.classList.add('fit'); sc.style.transform = 'scale(' + k.toFixed(4) + ')'; sc.style.marginBottom = (-(sc.offsetHeight * (1 - k))).toFixed(1) + 'px'; }
  }
  addEventListener('resize', function () { if (route.name === 'doc') fitDoc(); });
  function renderSheet() {
    var r = route, s = null;
    if (r.id && (r.name === 'locations' || r.name === 'overview')) s = V.binSheet(r.id);
    if (r.id && r.name === 'suppliers') s = V.supplierSheet(r.id);
    if (r.id && r.name === 'items' && E.item(r.id)) s = V.itemSheet(r.id, U);
    if (r.id && r.name === 'purchasing') s = V.poSheet(r.id);
    if (r.id && r.name === 'sales') s = V.soSheet(r.id);
    if (!s) { if (sheetWrap.classList.contains('open')) { sheetWrap.classList.remove('open'); if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); } return; }
    var wasOpen = sheetWrap.classList.contains('open'), body = $('.body', sheet), st = body ? body.scrollTop : 0, sameDoc = sheet.dataset.doc === r.id;
    sheet.dataset.doc = r.id;
    sheet.innerHTML = '<header><h2 id="sheet-t">' + s.title + '</h2><span class="sp"></span><span class="kbd hide-m" aria-hidden="true">Esc</span><a class="ibtn" href="' + baseHref() + '" aria-label="Close">' + V.icon('x') + '</a></header><div class="body">' + s.body + '</div>' + (s.foot ? '<div class="foot">' + s.foot + '</div>' : '');
    if (sameDoc) $('.body', sheet).scrollTop = st;
    drawBarcodes(sheet);
    if (!wasOpen) { sheetWrap.classList.add('open'); lastFocus = document.activeElement; setTimeout(function () { var c = $('.ibtn', sheet); if (c) c.focus({ preventScroll: true }); }, 30); }
  }
  var lastFocus = null;
  function baseHref() { return '#/' + route.name; }
  function badges() {
    var drafts = E.pos().filter(function (p) { return p.status === 'draft'; }).length;
    var toPick = E.sos().filter(function (s) { return s.status === 'reserved' || s.status === 'picking' || s.status === 'picked'; }).length;
    var openPO = E.pos().filter(function (p) { return p.status === 'approved' || p.status === 'partial'; }), lateN = openPO.filter(function (p) { return p.eta && p.eta < Date.now() - 12 * 36e5; }).length;
    setBadge('purchasing-open', openPO.length, lateN > 0);
    setBadge('purchasing', drafts, drafts > 0); setBadge('sales', toPick, false); setBadge('items', E.lowItems().length, false);
    var deals = E.bridgeDeals().length;
    $('#crm-dot').className = 'dot' + (deals ? ' on' : '');
    $('#crm-state').textContent = deals ? 'Connected · ' + deals + ' won deal' + (deals === 1 ? '' : 's') + ' read' : 'Listening for won deals';
  }
  function setBadge(k, v, hot) { $$('[data-badge="' + k + '"]').forEach(function (b) { b.textContent = v || ''; b.hidden = !v; b.classList.toggle('hot', !!hot); }); }
  function drawBarcodes(root) { $$('canvas[data-bc]', root).forEach(function (c) { if (c.dataset.drawn) return; window.Code128.draw(c, c.dataset.bc, { module: 2, height: 56, label: !c.hasAttribute('data-nolabel') }); c.dataset.drawn = 1; }); }
  var touchedBefore = {};
  function flashTouched() {
    Object.keys(touchedBefore).forEach(function (sku) { $$('tr[data-sku="' + sku + '"]', view).forEach(function (el) { el.classList.add('flash'); }); });
    touchedBefore = {};
  }

  /* ---------- toasts with undo ---------- */
  var lastUndo = null;
  function toast(html, opt) {
    opt = opt || {};
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
    t.innerHTML = '<span class="tx">' + html + '</span>' + (opt.undo ? '<button type="button" class="undo">Undo <span class="kbd">⌘Z</span></button>' : '');
    toasts.appendChild(t);
    while (toasts.children.length > 3) toasts.firstChild.remove();
    if (opt.undo) {
      var u = lastUndo = { snap: opt.undo, el: t, label: opt.label || 'change' };
      $('.undo', t).addEventListener('click', function () { doUndo(u); });
    }
    var ms = opt.ms || (opt.undo ? 7000 : 4200);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); if (lastUndo && lastUndo.el === t) lastUndo = null; }, 320); }, ms);
  }
  function doUndo(u) {
    u = u || lastUndo; if (!u) return;
    E.restore(u.snap); lastUndo = null;
    if (u.el) u.el.remove();
    toast('Undone: ' + u.label);
  }
  // run a state change and offer undo
  function act(label, fn, msg) {
    var snap = E.snapshot(), out = fn();
    if (out === false) return false;
    toast(typeof msg === 'function' ? msg(out) : msg, { undo: snap, label: label });
    return out;
  }

  /* ---------- modal helpers ---------- */
  function openModal(html, onSubmit, wide) {
    modal.className = 'modal' + (wide ? ' wide' : '');
    modal.innerHTML = '<form method="dialog">' + html + '</form>';
    var f = $('form', modal);
    f.addEventListener('submit', function (e) {
      var btn = e.submitter;
      if (btn && btn.value === 'cancel') return;
      e.preventDefault();
      if (onSubmit(new FormData(f), f, btn) !== false) modal.close();
    });
    $$('[data-close]', modal).forEach(function (b) { b.addEventListener('click', function () { modal.close(); }); });
    if (modal.showModal) modal.showModal(); else modal.setAttribute('open', '');
    drawBarcodes(modal);
    var first = $('[autofocus], input:not([type=hidden]):not([type=checkbox]), select', modal); if (first) first.focus();
    return f;
  }
  function whOptions(sel) { return E.warehouses().map(function (w) { return '<option value="' + w.id + '"' + (w.id === sel ? ' selected' : '') + '>' + w.name + '</option>'; }).join(''); }
  function binOptions(wh, sel) { return E.bins(wh).map(function (b) { return '<option' + (b.id === sel ? ' selected' : '') + '>' + b.id + '</option>'; }).join(''); }
  function stepper(name, val, max, label) {
    return '<span class="stepper"><button type="button" class="st-btn" data-step="-1" aria-label="Fewer">−</button><input class="input num" type="number" inputmode="numeric" min="0"' + (max != null ? ' max="' + max + '"' : '') + ' name="' + name + '" value="' + val + '" aria-label="' + esc(label) + '"><button type="button" class="st-btn" data-step="1" aria-label="More">+</button></span>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.st-btn'); if (!b) return;
    var i = b.parentNode.querySelector('input'), mx = i.max === '' ? Infinity : +i.max, lo = i.min === '' ? -Infinity : +i.min;
    i.value = Math.max(lo, Math.min(mx, (parseInt(i.value, 10) || 0) + +b.dataset.step)); i.dispatchEvent(new Event('input', { bubbles: true }));
  });

  function adjustModal(sku) {
    var it = E.item(sku), wh = U.wh || (E.onHand(sku, 'BHW') ? 'BHW' : 'BLR');
    openModal('<header><h2>Adjust stock</h2><p>' + esc(it.name) + ' · <span class="mono">' + sku + '</span>. Adjustments post to the ledger at FIFO cost.</p></header><div class="body">' +
      '<div class="row2"><label class="field">Warehouse<select class="select" name="wh" id="adj-wh">' + whOptions(wh) + '</select></label><label class="field">Bin<select class="select" name="bin" id="adj-bin">' + binOptions(wh, E.primaryBin(sku, wh)) + '</select></label></div>' +
      '<div class="row2"><label class="field">Change (use − to remove)' + stepper('qty', -1, null, 'Change in ' + it.uom) + '</label><label class="field">Reason<select class="select" name="note"><option>Cycle count</option><option>Damaged</option><option>Found during count</option><option>Showroom display</option><option>Returned by customer</option></select></label></div>' +
      '<p class="faint" style="margin:0;font-size:12px" id="adj-now">On hand now: ' + V.n(E.onHand(sku, wh)) + ' at ' + E.wh(wh).short + '.</p></div><footer><button class="btn" data-close type="button">Cancel</button><button class="btn primary" type="submit">Post adjustment</button></footer>',
    function (fd) {
      var q = parseInt(fd.get('qty'), 10); if (!q) { toast('Enter a change other than zero.'); return false; }
      var w = fd.get('wh');
      if (q < 0 && -q > E.onHand(sku, w)) { toast('Only ' + E.onHand(sku, w) + ' on hand at ' + E.wh(w).short + '.'); return false; }
      touchedBefore[sku] = 1;
      act('adjustment', function () { return E.adjust({ sku: sku, wh: w, bin: fd.get('bin'), qty: q, note: fd.get('note') }); },
        function (m) { return 'Posted <span class="mono">' + m.ref + '</span> · ' + (q > 0 ? '+' : '−') + Math.abs(q) + ' ' + esc(it.name) + ' · balance ' + m.bal; });
    });
    $('[name="qty"]', modal).removeAttribute('min');
    $('#adj-wh', modal).addEventListener('change', function (e) { $('#adj-bin', modal).innerHTML = binOptions(e.target.value, E.primaryBin(sku, e.target.value)); $('#adj-now', modal).textContent = 'On hand now: ' + V.n(E.onHand(sku, e.target.value)) + ' at ' + E.wh(e.target.value).short + '.'; });
  }
  function transferModal(sku, fromBin) {
    var it = E.item(sku), from = fromBin ? fromBin.slice(0, 3) : (E.onHand(sku, 'BHW') ? 'BHW' : 'BLR');
    var to = fromBin ? from : (from === 'BHW' ? 'BLR' : 'BHW'), bins = E.binsOf(sku);
    if (!bins.length) { toast(esc(it.name) + ' has no stock to move.'); return; }
    openModal('<header><h2>' + (fromBin ? 'Move between bins' : 'Transfer stock') + '</h2><p>' + esc(it.name) + ' · <span class="mono">' + sku + '</span>. Cost layers travel with the stock, so FIFO value is unchanged.</p></header><div class="body">' +
      '<div class="row2"><label class="field">From<select class="select" name="from">' + bins.map(function (b) { return '<option value="' + b.bin + '"' + (b.bin === (fromBin || (E.binsOf(sku, from)[0] || bins[0]).bin) ? ' selected' : '') + '>' + b.bin + ' · ' + b.q + ' on hand</option>'; }).join('') + '</select></label>' +
      '<label class="field">To<select class="select" name="to">' + E.bins().map(function (b) { return '<option' + (b.id === E.primaryBin(sku, to) && b.id !== fromBin ? ' selected' : '') + '>' + b.id + '</option>'; }).join('') + '</select></label></div>' +
      '<label class="field">Quantity' + stepper('qty', Math.max(1, Math.min(4, E.available(sku, from))), null, 'Quantity to move') + '</label></div><footer><button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="submit">Post transfer</button></footer>',
    function (fd) {
      var f = fd.get('from'), t = fd.get('to'), q = parseInt(fd.get('qty'), 10);
      if (!f || !q || f === t) { toast('Choose two different bins.'); return false; }
      touchedBefore[sku] = 1;
      var r = act('transfer', function () { return E.transfer({ sku: sku, fromWh: f.slice(0, 3), toWh: t.slice(0, 3), fromBin: f, toBin: t, qty: q }) || false; },
        function (ref) { return 'Posted <span class="mono">' + ref + '</span> · ' + q + ' × ' + esc(it.name) + ' ' + f + ' → ' + t; });
      if (r === false) { toast('Nothing free to move from ' + f + '.'); return false; }
    });
  }
  function pickItemModal(then, title) {
    openModal('<header><h2>' + title + '</h2><p>Choose an item.</p></header><div class="body"><label class="field">Item<select class="select" name="sku" autofocus>' + E.items().map(function (s) { return '<option value="' + s.sku + '">' + s.sku + ' · ' + esc(s.name) + ' (' + E.onHand(s.sku) + ' on hand)</option>'; }).join('') + '</select></label></div><footer><button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="submit">Continue</button></footer>',
      function (fd) { setTimeout(function () { then(fd.get('sku')); }, 30); });
  }
  function receiveModal(id) {
    var po = E.po(id);
    openModal('<header><h2>Receive goods · <span class="mono">' + po.id + '</span></h2><p>' + esc(E.supplier(po.supplier).name) + ' · count what arrived; anything short stays open on the PO.</p></header><div class="body">' +
      '<label class="field">Into warehouse<select class="select" name="wh" id="rcv-wh">' + whOptions(po.wh) + '</select></label>' +
      '<div class="rcv-bar"><span class="muted">' + po.lines.filter(function (l) { return l.recv < l.pq; }).length + ' of ' + po.lines.length + ' lines open</span><button type="button" class="btn sm" id="rcv-all">Everything arrived</button></div>' +
      '<ul class="rcv">' + po.lines.map(function (l) {
        var it = E.item(l.sku), left = l.pq - l.recv;
        return '<li class="' + (left ? '' : 'done') + '"><div class="rcv-it">' + V.thumb(l.sku, 'lg') + '<div class="grow"><b>' + esc(it.name) + '</b><span class="mono faint">' + it.sku + '</span><span class="muted">' + (left ? 'Open: ' + V.buyLabel(it, left) : 'Fully received') + '</span></div></div>' +
          (left ? '<div class="rcv-ctl"><label class="field">Received' + (it.buy.unit !== 'each' ? ' (' + it.buy.unit + (it.buy.unit === 'box' ? 'es' : 's') + ')' : '') + stepper('q-' + l.sku, left, left, 'Received ' + it.buy.unit + 's of ' + it.name) + '</label><label class="field">Put away in<select class="select" name="b-' + l.sku + '" data-sku="' + l.sku + '">' + binOptions(po.wh, E.primaryBin(l.sku, po.wh)) + '</select></label></div>' : '') + '</li>';
      }).join('') + '</ul></div><footer><button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="submit">' + V.icon('receipt') + 'Post goods receipt</button></footer>',
    function (fd) {
      var wh = fd.get('wh');
      var lines = po.lines.map(function (l) { touchedBefore[l.sku] = 1; return { sku: l.sku, pq: parseInt(fd.get('q-' + l.sku), 10) || 0, bin: fd.get('b-' + l.sku) }; });
      if (!lines.some(function (l) { return l.pq > 0; })) { toast('Enter at least one quantity.'); return false; }
      act('goods receipt', function () { return E.receive(po.id, lines, wh) || false; }, function (gr) {
        var units = 0; gr.lines.forEach(function (x) { units += x.units; });
        return 'Posted <span class="mono">' + gr.id + '</span> · ' + units + ' units into ' + E.wh(wh).short + (E.po(po.id).status === 'partial' ? ' · rest still open' : ' · PO complete');
      });
    }, true);
    $('#rcv-wh', modal).addEventListener('change', function (e) { $$('select[data-sku]', modal).forEach(function (s) { s.innerHTML = binOptions(e.target.value, E.primaryBin(s.dataset.sku, e.target.value)); }); });
    $('#rcv-all', modal).addEventListener('click', function () { $$('.stepper input', modal).forEach(function (i) { i.value = i.max; }); });
  }
  function newPOModal(presetSup) {
    var sups = E.suppliers();
    function lines(sid) { return E.items().filter(function (s) { return s.supplier === sid; }).map(function (s) { return '<tr><td>' + V.itemCell(s.sku, true) + '<div class="faint" style="font-size:11.5px;margin-left:32px">' + V.n(E.available(s.sku)) + ' available · reorder at ' + E.rop(s.sku) + '</div></td><td class="num">' + stepper('q-' + s.sku, E.status(s.sku) !== 'ok' ? E.suggestQty(s.sku) : 0, null, s.buy.unit + 's of ' + s.name) + (s.buy.per > 1 ? '<div class="faint" style="font-size:11px">' + s.buy.unit + 's of ' + s.buy.per + '</div>' : '') + '</td></tr>'; }).join(''); }
    openModal('<header><h2>New purchase order</h2><p>Quantities are in the supplier\'s buying unit. Items below their reorder point are pre-filled.</p></header><div class="body"><div class="row2"><label class="field">Supplier<select class="select" name="sup" id="np-sup">' + sups.map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + ' · ' + s.lead + ' days</option>'; }).join('') + '</select></label><label class="field">Deliver to<select class="select" name="wh">' + whOptions('BHW') + '</select></label></div>' +
      '<div class="boxed scroll-x"><table class="tbl"><thead><tr><th>Item</th><th class="num">Order</th></tr></thead><tbody id="np-lines">' + lines(sups[0].id) + '</tbody></table></div></div><footer><button class="btn" type="button" data-close>Cancel</button><button class="btn" type="submit" name="mode" value="draft">Save draft</button><button class="btn primary" type="submit" name="mode" value="send">Approve and send</button></footer>',
    function (fd, f, btn) {
      var sid = fd.get('sup'), ls = E.items().filter(function (s) { return s.supplier === sid; }).map(function (s) { return { sku: s.sku, pq: parseInt(fd.get('q-' + s.sku), 10) || 0 }; }).filter(function (l) { return l.pq > 0; });
      if (!ls.length) { toast('Add a quantity to at least one line.'); return false; }
      var send = !!(btn && btn.value === 'send');
      var po = act('new purchase order', function () { var p = E.createPO({ supplier: sid, wh: fd.get('wh'), lines: ls }); if (send) E.approvePO(p.id); else E.commit(); return p; },
        function (p) { return (send ? 'Sent ' : 'Saved draft ') + '<span class="mono">' + p.id + '</span> to ' + esc(E.supplier(sid).name); });
      location.hash = '#/purchasing/' + po.id;
    }, true);
    $('#np-sup', modal).addEventListener('change', function (e) { $('#np-lines', modal).innerHTML = lines(e.target.value); });
    if (presetSup) { $('#np-sup', modal).value = presetSup; $('#np-lines', modal).innerHTML = lines(presetSup); }
  }
  function shortcutsModal() {
    modal.className = 'modal wide';
    modal.innerHTML = '<form method="dialog"><header><h2>Keyboard shortcuts</h2><p>Stockroom is built to be driven from the keyboard.</p></header><div class="body">' + V.shortcuts() + '</div><footer><button class="btn primary" value="ok">Done</button></footer></form>';
    modal.showModal();
  }

  /* ---------- bulk actions ---------- */
  function selected() { var k = SELKEY[route.name]; if (!k) return []; return Object.keys(U[k]).filter(function (x) { return U[k][x]; }); }
  function updateBulk() {
    var ids = selected();
    if (!ids.length) { bulk.hidden = true; bulk.innerHTML = ''; return; }
    var b = '<span class="bk-n"><b>' + ids.length + '</b> selected</span>';
    if (route.name === 'items') b += '<button class="btn sm" data-act="bk-draft">' + V.icon('purchasing') + 'Add to draft POs</button><button class="btn sm" data-act="bk-rop">Set reorder point</button><button class="btn sm" data-act="bk-labels">' + V.icon('labels') + 'Labels</button><button class="btn sm" data-act="export-items">Export</button>';
    if (route.name === 'sales') {
      var sos = ids.map(E.so).filter(Boolean);
      var canPick = sos.filter(function (s) { return s.status === 'reserved' && !E.shortfall(s); }).length, canShip = sos.filter(function (s) { return s.status === 'picked'; }).length, canPrint = sos.filter(function (s) { return s.status !== 'dispatched' && s.status !== 'cancelled'; }).length;
      b += '<button class="btn sm" data-act="bk-pick"' + (canPick ? '' : ' disabled title="Only fully reserved orders can start picking"') + '>Start picking' + (canPick ? ' · ' + canPick : '') + '</button><button class="btn sm" data-act="bk-print"' + (canPrint ? '' : ' disabled title="Dispatched orders have no pick list"') + '>' + V.icon('print') + 'Pick lists</button><button class="btn sm primary" data-act="bk-ship"' + (canShip ? '' : ' disabled title="Pick every line first; only picked orders can be dispatched"') + '>Dispatch' + (canShip ? ' · ' + canShip : '') + '</button>' + (!canShip && !canPick ? '<span class="bk-why">Nothing selected is ready yet</span>' : '');
    }
    if (route.name === 'purchasing') {
      var dr = ids.map(E.po).filter(function (p) { return p && p.status === 'draft'; }).length;
      b += '<button class="btn sm primary" data-act="bk-approve"' + (dr ? '' : ' disabled title="Only drafts can be approved"') + '>Approve' + (dr ? ' · ' + dr : '') + '</button><button class="btn sm danger" data-act="bk-discard"' + (dr ? '' : ' disabled title="Only drafts can be discarded"') + '>Discard drafts</button>' + (dr ? '' : '<span class="bk-why">Only drafts can be approved or discarded</span>');
    }
    b += '<button class="ibtn" data-act="bk-clear" aria-label="Clear selection">' + V.icon('x') + '</button>';
    bulk.innerHTML = b; bulk.hidden = false;
  }
  function clearSel() { U.selItems = {}; U.selSO = {}; U.selPO = {}; }
  function exportItems() {
    var ids = route.name === 'items' && selected().length ? selected() : V.itemMatches(U).map(function (s) { return s.sku; });
    var rows = [['SKU', 'Name', 'Category', 'Supplier', 'On hand', 'Reserved', 'Available', 'Reorder point', 'On order', 'Value (FIFO, INR)', 'Status']];
    ids.forEach(function (k) { var s = E.item(k); rows.push([k, s.name, s.category, E.supplier(s.supplier).name, E.onHand(k, U.wh), E.reserved(k, U.wh), E.available(k, U.wh), E.rop(k), E.onOrder(k), Math.round(E.value(k, U.wh)), E.status(k)]); });
    var csv = rows.map(function (r) { return r.map(function (c) { c = String(c); return /[",]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'halden-stock-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('Exported ' + ids.length + ' items to CSV');
  }
  function draftFor(skus) {
    var by = {};
    skus.forEach(function (k) { var s = E.item(k); (by[s.supplier] = by[s.supplier] || []).push(k); });
    var made = [];
    Object.keys(by).forEach(function (sid) {
      var po = E.pos().filter(function (p) { return p.status === 'draft' && p.supplier === sid; })[0] || E.createPO({ supplier: sid, wh: 'BHW', lines: [], note: 'Drafted from Items' });
      by[sid].forEach(function (k) { if (!po.lines.some(function (l) { return l.sku === k; })) po.lines.push({ sku: k, pq: E.suggestQty(k), recv: 0, cost: E.lastCost(k) }); });
      made.push(po.id);
    });
    E.commit(); return made;
  }

  /* ---------- printing ---------- */
  function printHTML(html) {
    var p = $('#print'); p.innerHTML = html; drawBarcodes(p);
    document.body.classList.add('printing'); window.print();
    setTimeout(function () { document.body.classList.remove('printing'); }, 500);
  }
  function printLabels() {
    var chosen = Object.keys(U.lblSel).filter(function (k) { return U.lblSel[k]; });
    if (!chosen.length) { toast('Select at least one label.'); return; }
    printHTML('<div class="labels">' + chosen.map(V.labelHTML).join('') + '</div>');
  }
  function printPicks(ids) { printHTML(ids.map(function (id) { return V.pickPrint(E.so(id)); }).join('')); }

  addEventListener('beforeprint', function () { if (route.name === 'doc' && !document.body.classList.contains('printing')) { $('#print').innerHTML = V.docHTML(route.kind, route.id); drawBarcodes($('#print')); document.body.classList.add('printing'); } });
  addEventListener('afterprint', function () { document.body.classList.remove('printing'); });

  /* ---------- scanning ---------- */
  var stream = null, detector = null, scanning = false, lastCode = '', lastAt = 0, torch = false, camErr = '';
  function resolve(code) {
    code = String(code || '').trim().toUpperCase();
    if (E.item(code)) return { kind: 'item', code: code };
    if (/^(BHW|BLR)-[ABC]-\d\d$/.test(code)) return { kind: 'bin', code: code };
    if (E.so(code)) return { kind: 'so', code: code };
    if (E.po(code)) return { kind: 'po', code: code };
    return { kind: 'none', code: code };
  }
  function bump(sel) { var i = $(sel); if (!i) return false; var mx = i.max === '' ? Infinity : +i.max; i.value = Math.min(mx, (parseInt(i.value, 10) || 0) + 1); i.dispatchEvent(new Event('input', { bubbles: true })); i.closest('li').classList.remove('flash'); void i.offsetWidth; i.closest('li').classList.add('flash'); return true; }
  function handleScan(code) {
    var hit = resolve(code), ok = hit.kind !== 'none';
    if (route.name === 'count' && hit.kind === 'item') { var hitc = bump('input[data-cnt="' + hit.code + '"]'); beep(hitc); if (!hitc) toast(hit.code + ' isn’t expected in this bin. Add it with Adjust after the count.'); return; }
    if (route.name === 'receive' && hit.kind === 'item') { var hitr = bump('input[data-rq="' + hit.code + '"]'); beep(hitr); if (!hitr) toast(hit.code + ' isn’t on this purchase order.'); return; }
    if (route.name === 'pick') {
      var so = E.so(U.pickId), i = V.pickIndex(so, U.pkSkip);
      if (so && i >= 0 && hit.kind === 'item') {
        var p = so.pick[i];
        if (p.sku === hit.code) { U.pkMsg = null; pickConfirm(so.id, i); beep(true); flashCam(true); return; }
        var other = -1; so.pick.forEach(function (q, k) { if (other < 0 && !q.done && q.sku === hit.code) other = k; });
        U.pkMsg = other >= 0 ? { k: 'warn', t: hit.code + ' is on this list, but at ' + so.pick[other].bin + '. Finish ' + p.bin + ' first, or skip it.' } : { k: 'err', t: hit.code + ' is not on this pick list. Expected ' + p.sku + '.' };
      } else U.pkMsg = { k: 'err', t: ok ? 'That label is a ' + hit.kind + '. Scan the item label.' : 'Unknown code ' + hit.code + '.' };
      beep(false); flashCam(false); render(true); return;
    }
    var so2 = U.scanSO && E.so(U.scanSO);
    if (hit.kind === 'item' && so2 && so2.status === 'picking') {
      var idx = -1; so2.pick.forEach(function (q, k) { if (idx < 0 && !q.done && q.sku === hit.code) idx = k; });
      if (idx >= 0) { E.pickLine(so2.id, idx, true); hit.picked = so2.pick[idx].qty; hit.so = so2.id; }
      else { hit.miss = 'Not on ' + so2.id + '’s pick list'; ok = false; }
    }
    beep(ok); flashCam(ok);
    U.scanHit = hit;
    U.scans.unshift({ code: hit.code, kind: hit.kind === 'none' ? 'unknown' : hit.kind, t: Date.now() });
    if (route.name === 'scan') render(true);
    var last = $('#cam .cam-last'); if (last) { last.textContent = hit.kind === 'item' ? E.item(hit.code).name : hit.code; last.className = 'cam-last on ' + (ok ? '' : 'bad'); }
  }
  function flashCam(ok) { var cam = $('#cam'); if (cam) { cam.classList.remove('hit', 'miss'); void cam.offsetWidth; cam.classList.add(ok ? 'hit' : 'miss'); } if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) try { navigator.vibrate(ok ? 30 : [40, 60, 40]); } catch (e) { } }
  var actx = null;
  function beep(ok) {
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); var o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = ok ? 1560 : 320; g.gain.value = .04; o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + (ok ? .08 : .2)); } catch (e) { }
  }
  function attachVideo() {
    var cam = $('#cam'); if (!cam || !stream) return;
    var track = stream.getVideoTracks()[0], caps = track && track.getCapabilities ? track.getCapabilities() : {};
    cam.classList.add('live');
    cam.innerHTML = '<video playsinline muted autoplay aria-label="Camera preview"></video><div class="frame" aria-hidden="true"></div><span class="cam-state"><i></i>Scanning</span><span class="cam-last" aria-live="polite"></span>' +
      '<div class="cam-ctl">' + (caps.torch ? '<button type="button" class="btn sm" data-act="cam-torch" aria-pressed="' + torch + '">Torch</button>' : '') + '<button type="button" class="btn sm" data-act="cam-stop">Stop</button></div>';
    var v = $('video', cam); v.srcObject = stream; v.play().catch(function () { });
  }
  function camMessage(html) { var cam = $('#cam'); if (cam) { cam.classList.remove('live'); cam.innerHTML = '<div class="msg">' + html + '</div>'; } }
  function startCam() {
    if (!('BarcodeDetector' in window)) { camMessage(V.icon('camera') + '<span>This browser can\'t read barcodes from the camera. Type the code below instead.</span>'); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { camMessage('<span>No camera access on this page. Type the code below instead.</span>'); return; }
    camMessage('<span class="spin" aria-hidden="true"></span><span>Waiting for camera permission…</span>');
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false }).then(function (s) {
      stream = s; camErr = ''; attachVideo();
      window.BarcodeDetector.getSupportedFormats().then(function (f) {
        detector = new window.BarcodeDetector({ formats: f.filter(function (x) { return ['code_128', 'qr_code', 'ean_13', 'code_39'].indexOf(x) >= 0; }) });
        scanning = true; loop();
      });
    }).catch(function (err) {
      var n = err && err.name;
      camMessage(V.icon('camera') + '<span>' + (n === 'NotAllowedError' ? 'Camera permission was declined. Allow it in the browser\'s site settings, or type the code below.' : n === 'NotFoundError' ? 'No camera was found on this device. Type the code below.' : 'The camera couldn\'t start. Type the code below.') + '</span><button class="btn sm" data-act="cam-start">Try again</button>');
    });
  }
  function loop() {
    if (!scanning || !stream) return;
    var v = $('#cam video');
    if (v && v.readyState >= 2) detector.detect(v).then(function (codes) {
      if (codes.length) { var c = codes[0].rawValue; if (c !== lastCode || Date.now() - lastAt > 2500) { lastCode = c; lastAt = Date.now(); handleScan(c); } }
      setTimeout(loop, 160);
    }).catch(function () { setTimeout(loop, 400); }); else setTimeout(loop, 200);
  }
  function stopCam() { scanning = false; torch = false; if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
  function scanSample(code, btn) {
    var c = $('canvas', btn);
    if ('BarcodeDetector' in window && c) new window.BarcodeDetector({ formats: ['code_128'] }).detect(c).then(function (r) { handleScan(r.length ? r[0].rawValue : code); }).catch(function () { handleScan(code); });
    else handleScan(code);
  }

  /* ---------- pick mode ---------- */
  function pickConfirm(id, i) {
    var so = E.so(id), p = so.pick[i], it = E.item(p.sku);
    act('pick', function () { E.pickLine(id, i, true); delete U.pkSkip[i]; return E.so(id); }, function (s) {
      return s.status === 'picked' ? 'All lines picked for <span class="mono">' + id + '</span> · ready to dispatch' : 'Picked ' + p.qty + ' × ' + esc(it.name) + ' from <span class="mono">' + p.bin + '</span>';
    });
  }

  /* ---------- command palette ---------- */
  function cmdk() {
    var all = [];
    var actions = [
      ['New order from a won deal', function () { simDeal(); }], ['New purchase order', newPOModal],
      ['Approve all draft purchase orders', function () { var d = E.pos().filter(function (p) { return p.status === 'draft'; }); if (!d.length) return toast('No drafts to approve.'); act('approve drafts', function () { d.forEach(function (p) { E.approvePO(p.id, true); }); E.commit(); return d; }, 'Approved and sent ' + d.length + ' purchase orders'); }],
      ['Transfer stock…', function () { pickItemModal(transferModal, 'Transfer stock'); }], ['Adjust stock…', function () { pickItemModal(adjustModal, 'Adjust stock'); }],
      ['Show Bhiwandi only', function () { setWh('BHW'); }], ['Show Hoskote only', function () { setWh('BLR'); }], ['Show both warehouses', function () { setWh(''); }],
      ['Take the tour', function () { startCoach('tour'); }], ['Try the full flow', function () { startCoach('flow'); }], ['Count bins', function () { location.hash = '#/count'; }], ['Receive a delivery', function () { location.hash = '#/receive'; }], ['Keyboard shortcuts', shortcutsModal], ['Start fresh', resetDemo]];
    actions.forEach(function (a) { all.push({ t: a[0], k: 'Action', run: a[1], ic: 'bolt' }); });
    Object.keys(TITLES).forEach(function (k) { if (k !== 'pick' && k !== 'doc' && V.can(k)) all.push({ t: 'Go to ' + TITLES[k], k: 'Page', h: '#/' + k, ic: k }); });
    if (V.can('sales')) E.sos().slice(-40).reverse().forEach(function (so) { V.docsFor('so', so.id).forEach(function (d) { if (d.ok) all.push({ t: 'Print ' + d.label.toLowerCase().replace('tax invoice', 'invoice') + ' for ' + so.id, k: 'Paper', h: '#/doc/' + d.k + '/' + so.id, ic: 'print' }); }); });
    E.pos().slice(-24).reverse().forEach(function (po) { V.docsFor('po', po.id).forEach(function (d) { if (d.ok && (d.k === 'grn' || V.can('purchasing'))) all.push({ t: 'Print ' + d.label.toLowerCase() + ' for ' + po.id, k: 'Paper', h: '#/doc/' + d.k + '/' + po.id, ic: 'print' }); }); });
    E.items().forEach(function (s) { all.push({ t: s.name, k: s.sku, h: '#/items/' + s.sku, img: s.thumb }); });
    E.sos().slice(-40).reverse().forEach(function (s) { all.push({ t: s.customer + ' · ' + s.status, k: s.id, h: '#/sales/' + s.id, ic: 'sales' }); });
    if (V.can('purchasing')) E.pos().slice(-20).reverse().forEach(function (p) { all.push({ t: E.supplier(p.supplier).name + ' · ' + p.status, k: p.id, h: '#/purchasing/' + p.id, ic: 'purchasing' }); });
    if (V.can('suppliers')) E.suppliers().forEach(function (su) { all.push({ t: 'Supplier ' + su.name, k: su.city, h: '#/suppliers/' + su.id, ic: 'purchasing' }); });
    E.bins().forEach(function (b) { all.push({ t: 'Bin ' + b.id, k: 'Bin', h: '#/locations/' + b.id, ic: 'locations' }); });
    modal.className = 'modal cmdk';
    modal.innerHTML = '<label><span class="vh">Search Stockroom</span><input class="q" placeholder="Type a command, item, order or bin…" autocomplete="off" role="combobox" aria-expanded="true" aria-controls="cmdk-list"></label><ul id="cmdk-list" role="listbox"></ul><div class="cmdk-f"><span><span class="kbd">↑</span><span class="kbd">↓</span> move</span><span><span class="kbd">↵</span> open</span><span><span class="kbd">Esc</span> close</span></div>';
    var q = $('.q', modal), ul = $('ul', modal), sel = 0, cur = [];
    function draw() {
      var s = q.value.toLowerCase().trim();
      cur = all.filter(function (x) { return !s || (x.t + ' ' + x.k).toLowerCase().indexOf(s) >= 0; }).slice(0, s ? 14 : 9);
      sel = Math.min(sel, Math.max(0, cur.length - 1));
      ul.innerHTML = cur.map(function (x, i) { return '<li role="none"><a role="option" data-i="' + i + '" href="' + (x.h || '#') + '" aria-selected="' + (i === sel) + '">' + (x.img ? '<img class="thumb xs" src="' + x.img + '" alt="">' : '<span class="ci">' + V.icon(x.ic || 'right', 'sm') + '</span>') + esc(x.t) + '<span class="k mono">' + esc(x.k) + '</span></a></li>'; }).join('') || '<li class="empty">No matches</li>';
    }
    function run(x) { modal.close(); if (x.run) setTimeout(x.run, 30); else location.hash = x.h; }
    q.addEventListener('input', function () { sel = 0; draw(); });
    q.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { sel = Math.min(cur.length - 1, sel + 1); draw(); e.preventDefault(); }
      if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); }
      if (e.key === 'Enter' && cur[sel]) { e.preventDefault(); run(cur[sel]); }
    });
    ul.addEventListener('click', function (e) { var a = e.target.closest('a[data-i]'); if (!a) return; e.preventDefault(); run(cur[+a.dataset.i]); });
    draw(); modal.showModal(); q.focus();
  }
  function setWh(v) { U.wh = v; savePrefs(); render(); toast(v ? 'Showing ' + E.wh(v).name : 'Showing both warehouses'); }
  function simDeal() { var nso = E.simulateDeal(); nso.lines.forEach(function (l) { touchedBefore[l.sku] = 1; }); toast('<span class="crm"><i></i>Lumen CRM</span> Deal won: ' + esc(nso.customer) + ' · ' + (E.shortfall(nso) ? E.shortfall(nso) + ' units backordered' : 'all lines reserved') + ' <a href="#/sales/' + nso.id + '">Open</a>', { ms: 6500 }); }
  function resetDemo() {
    openModal('<header><h2>Start fresh?</h2><p>Stockroom goes back to its starting 90 days of history. Changes you have made are lost.</p></header><footer><button class="btn" type="button" data-close>Keep my changes</button><button class="btn primary" type="submit" autofocus>Start fresh</button></footer>',
      function () { E.reset(); U.scans = []; U.scanHit = null; clearSel(); toast('Started fresh'); });
  }

  /* ---------- area chart hover ---------- */
  function bindArea() {
    var svg = $('#hv-area'); if (!svg) return;
    var vals = svg.dataset.vals.split(',').map(Number), num = $('#hv-num'), w = $('#hv-when'), base = num.textContent, baseW = w.textContent, xh = $('.xh', svg);
    function at(e) {
      var r = svg.getBoundingClientRect(), f = Math.max(0, Math.min(1, ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width)), i = Math.round(f * (vals.length - 1));
      num.textContent = V.inr(vals[i]); w.textContent = i === vals.length - 1 ? 'Today' : V.day(Date.now() - (vals.length - 1 - i) * 864e5);
      var x = i / (vals.length - 1) * 720; xh.setAttribute('x1', x); xh.setAttribute('x2', x); xh.setAttribute('opacity', '.6');
    }
    function off() { num.textContent = base; w.textContent = baseW; xh.setAttribute('opacity', '0'); }
    svg.addEventListener('mousemove', at); svg.addEventListener('touchmove', at, { passive: true }); svg.addEventListener('mouseleave', off); svg.addEventListener('touchend', off);
  }

  /* ---------- keyboard row navigation ---------- */
  function rows() { return $$('table[data-kb] tbody tr[data-row]', view); }
  function markKb(i, quiet) {
    var r = rows(); if (!r.length) { kb = -1; return; }
    kb = Math.max(0, Math.min(r.length - 1, i));
    r.forEach(function (x, k) { x.classList.toggle('kb', k === kb); });
    if (!quiet) r[kb].scrollIntoView({ block: 'nearest' });
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-act]');
    var row = !a && e.target.closest('[data-href]');
    if (row && !e.target.closest('a,button,input,label,select')) { location.hash = row.dataset.href; return; }
    if (!a || a.disabled) return;
    var act_ = a.dataset.act, id = a.dataset.id, v = a.dataset.v;
    switch (act_) {
      case 'wh': U.wh = v; savePrefs(); render(); break;
      case 'cat': U.cat = v; render(); break;
      case 'status': U.status = v; if (route.qs.status != null) { history.replaceState(null, '', '#/items'); route.qs = {}; } render(); break;
      case 'clear-filters': U.q = ''; U.cat = ''; U.status = ''; render(); break;
      case 'view': { var vi = +a.dataset.i, vw = vi < 0 ? {} : U.views[vi]; U.q = vw.q || ''; U.cat = vw.cat || ''; U.status = vw.status || ''; if (route.qs.status != null) { history.replaceState(null, '', '#/items'); route.qs = {}; } render(); break; }
      case 'view-save': saveViewModal(); break;
      case 'view-del': { var dv = U.views[+a.dataset.i]; U.views.splice(+a.dataset.i, 1); savePrefs(); render(); toast('Deleted view “' + esc(dv.name) + '”'); break; }
      case 'locwh': U.locWh = v; render(); break;
      case 'locview': U.locView = v; render(); break;
      case 'ltype': U.ltype = v; U.llimit = 60; render(); break;
      case 'potab': U.potab = v; if (route.qs.tab) { history.replaceState(null, '', '#/purchasing'); route.qs = {}; } render(); break;
      case 'sotab': U.sotab = v; render(); break;
      case 'chart': U.chart = v; render(true); break;
      case 'range': U.range = +v; render(true); break;
      case 'more': U[a.dataset.k] = (U[a.dataset.k] || (a.dataset.k === 'llimit' ? 60 : 40)) + 60; render(true); break;
      case 'sel': U[a.dataset.k][v] = a.checked; render(true); break;
      case 'selall': { var k = a.dataset.k, ids = route.name === 'items' ? V.itemMatches(U).map(function (s) { return s.sku; }) : $$('input[data-act="sel"]', view).map(function (c) { return c.dataset.v; }); ids.forEach(function (x) { U[k][x] = a.checked; }); render(true); break; }
      case 'bk-clear': clearSel(); render(true); break;
      case 'bk-draft': previewDraft(selected()); break;
      case 'bk-rop': bulkRopModal(); break;
      case 'bk-labels': U.lblMode = 'items'; U.lblSel = {}; selected().forEach(function (x) { U.lblSel[x] = true; }); clearSel(); location.hash = '#/labels'; break;
      case 'export-items': exportItems(); break;
      case 'bk-pick': { var ps = selected().map(E.so).filter(function (s) { return s && s.status === 'reserved' && !E.shortfall(s); }); act('start picking', function () { ps.forEach(function (s) { E.startPicking(s.id); }); return ps; }, 'Pick lists ready for ' + ps.length + ' orders'); clearSel(); render(true); break; }
      case 'bk-print': printPicks(selected().filter(function (x) { var s = E.so(x); return s && s.status !== 'dispatched' && s.status !== 'cancelled'; })); break;
      case 'bk-ship': previewShip(selected().map(E.so).filter(function (s) { return s && s.status === 'picked'; })); break;
      case 'bk-approve': { var pa = selected().map(E.po).filter(function (p) { return p && p.status === 'draft'; }); act('approve', function () { pa.forEach(function (p) { E.approvePO(p.id, true); }); E.commit(); return pa; }, 'Approved and sent ' + pa.length + ' purchase orders'); clearSel(); render(true); break; }
      case 'bk-discard': { var pd = selected().map(E.po).filter(function (p) { return p && p.status === 'draft'; }); act('discard drafts', function () { pd.forEach(function (p) { E.cancelPO(p.id); }); return pd; }, 'Discarded ' + pd.length + ' drafts'); clearSel(); render(true); break; }
      case 'inl-rop': editRop(a.dataset.sku); break;
      case 'po-approve': { var po = E.po(id); act('approval', function () { E.approvePO(id); return po; }, function () { return 'Approved <span class="mono">' + id + '</span> · sent to ' + esc(E.supplier(po.supplier).name) + ' · expected ' + V.whenLc(po.eta); }); break; }
      case 'po-receive': if (modal.open) modal.close(); location.hash = '#/receive/' + id; break;
      case 'po-cancel': { var p2 = E.po(id), wasDraft = p2.status === 'draft'; act(wasDraft ? 'discard draft' : 'cancel PO', function () { E.cancelPO(id); }, (wasDraft ? 'Discarded draft ' : 'Cancelled ') + '<span class="mono">' + id + '</span>'); if (wasDraft) location.hash = '#/purchasing'; break; }
      case 'po-new': newPOModal(); break;
      case 'so-pick': act('start picking', function () { E.startPicking(id); }, 'Pick list ready for <span class="mono">' + id + '</span> · <a href="#/pick/' + id + '">Pick mode</a>'); break;
      case 'so-split': act('split order', function () { E.startPicking(id, { split: true }); }, 'Picking the reserved lines; the rest is on backorder <span class="mono">' + id + '-B</span>'); break;
      case 'so-pickall': { var s = E.so(id); act('pick all', function () { s.pick.forEach(function (q, i) { if (!q.done) E.pickLine(id, i, true); }); }, 'All lines picked for <span class="mono">' + id + '</span>'); break; }
      case 'pickline': E.pickLine(id, +a.dataset.i, a.checked); break;
      case 'pk-confirm': U.pkMsg = null; pickConfirm(id, +a.dataset.i); break;
      case 'pk-skip': U.pkSkip[+a.dataset.i] = true; U.pkMsg = null; render(true); break;
      case 'print-pick': printPicks([id]); break;
      case 'so-dispatch': { var so = E.so(id); so.lines.forEach(function (l) { touchedBefore[l.sku] = 1; }); act('dispatch', function () { E.dispatch(id); return E.so(id); }, function (d) { return 'Dispatched <span class="mono">' + id + '</span> · waybill <span class="mono">' + d.waybill + '</span> · COGS ' + V.inr(d.cogs) + ' at FIFO'; }); if (route.name === 'pick') location.hash = '#/sales/' + id; break; }
      case 'so-cancel': act('cancel order', function () { E.cancelSO(id); }, 'Cancelled <span class="mono">' + id + '</span>; reservations released'); break;
      case 'so-transfer': {
        var o = E.so(id), other = o.wh === 'BHW' ? 'BLR' : 'BHW';
        act('transfer', function () { var moved = 0; o.lines.forEach(function (l) { var gap = l.qty - l.res; if (gap > 0) { var q = Math.min(gap, Math.max(0, E.available(l.sku, other))); if (q > 0 && E.transfer({ sku: l.sku, fromWh: other, toWh: o.wh, qty: q, note: 'For ' + id, silent: true })) moved += q; } }); E.reallocate(id); return moved; },
          function (m) { return 'Transferred ' + m + ' units from ' + E.wh(other).short + ' and reserved them for <span class="mono">' + id + '</span>'; });
        break;
      }
      case 'adjust': adjustModal(a.dataset.sku); break;
      case 'transfer': transferModal(a.dataset.sku); break;
      case 'transfer-pick': pickItemModal(transferModal, 'Transfer stock'); break;
      case 'binmove': transferModal(a.dataset.sku, a.dataset.bin); break;
      case 'label': U.lblMode = 'items'; U.lblSel = {}; U.lblSel[a.dataset.sku] = true; if (modal.open) modal.close(); location.hash = '#/labels'; break;
      case 'label-bin': U.lblMode = 'bins'; U.lblSel = {}; U.lblSel[a.dataset.bin] = true; if (a.dataset.bin.indexOf('BLR') === 0) U.wh = 'BLR'; location.hash = '#/labels'; break;
      case 'lblmode': U.lblMode = v; U.lblSel = {}; render(); break;
      case 'lbl': U.lblSel[a.dataset.code] = a.checked; render(true); break;
      case 'lblall': $$('[data-act="lbl"]').forEach(function (c) { U.lblSel[c.dataset.code] = true; }); render(true); break;
      case 'lblnone': U.lblSel = {}; render(true); break;
      case 'print': printLabels(); break;
      case 'sim-deal': simDeal(); break;
      case 'who': { var wm = $('#whomenu'), open = wm.hidden; wm.hidden = !open; a.setAttribute('aria-expanded', String(open)); if (open) { wm.innerHTML = V.whoMenu(); var cur = $('[aria-checked="true"]', wm); if (cur) cur.focus({ preventScroll: true }); wm.scrollIntoView({ block: 'nearest' }); } break; }
      case 'who-set': { V.who = v; savePrefs(); $('#whomenu').hidden = true; $('#me-btn').setAttribute('aria-expanded', 'false'); applyRole(); if (!allowed(route)) { location.hash = '#/overview'; } render(); toast('Now working as ' + esc(V.me().name) + ' · ' + V.me().title); break; }
      case 'settab': U.settab = v; render(true); break;
      case 'po-new-sup': newPOModal(id); break;
      case 'doc-print': { var dk = route.kind, di = route.id; printHTML(V.docHTML(dk, di)); break; }
      case 'reset': resetDemo(); break;
      case 'cam-start': startCam(); break;
      case 'cam-stop': stopCam(); render(true); break;
      case 'cam-torch': { torch = !torch; var tr = stream && stream.getVideoTracks()[0]; if (tr) tr.applyConstraints({ advanced: [{ torch: torch }] }).catch(function () { }); a.setAttribute('aria-pressed', torch); break; }
      case 'scan-sample': scanSample(a.dataset.code, a); break;
      case 'menu': $('#side').classList.toggle('open'); break;
      case 'cmdk': cmdk(); break;
      case 'keys': shortcutsModal(); break;
      case 'itemview': U.itemView = v; savePrefs(); render(true); break;
      case 'sort': { var cur = U.sort || {}; U.sort = { k: v, d: cur.k === v ? -cur.d : (v === 'name' || v === 'customer' || v === 'supplier' || v === 'category' ? 1 : -1) }; render(true); break; }
      case 'col': { U.cols = U.cols || { bin: 1, rop: 1 }; U.cols[v] = a.checked ? 1 : 0; savePrefs(); render(true); var cm = $('.colmenu'); if (cm) cm.open = true; break; }
      case 'cols-all': U.cols = { category: 1, bin: 1, onhand: 1, reserved: 1, rop: 1, onorder: 1, value: 1 }; savePrefs(); render(true); break;
      case 'cols-min': U.cols = { bin: 1, rop: 1 }; savePrefs(); render(true); break;
      case 'newmenu': toggleNew(a); break;
      case 'new-po': closeNew(); newPOModal(); break;
      case 'new-receive': closeNew(); location.hash = '#/receive'; break;
      case 'new-count': closeNew(); location.hash = '#/count'; break;
      case 'new-adjust': closeNew(); pickItemModal(adjustModal, 'Adjust stock'); break;
      case 'new-transfer': closeNew(); pickItemModal(transferModal, 'Transfer stock'); break;
      case 'new-deal': closeNew(); simDeal(); break;
      case 'detail': U.detail = !U.detail; render(true); break;
      case 'qadj': quickAdjust(a.dataset.sku, +a.dataset.d); break;
      case 'pk-short': U.pkShort = +a.dataset.i; render(true); setTimeout(function () { var f = $('#pk-found'); if (f) f.focus(); }, 30); break;
      case 'pk-short-x': U.pkShort = null; render(true); break;
      case 'pk-short-ok': shortPick(id, +a.dataset.i, parseInt(($('#pk-found') || {}).value, 10) || 0, 'short'); break;
      case 'pk-none': shortPick(id, +a.dataset.i, 0, 'empty'); break;
      case 'pk-dmg': { var pso = E.so(id), pp = pso.pick[+a.dataset.i]; shortPick(id, +a.dataset.i, pp.qty - 1, 'damaged'); break; }
      case 'cnt-next': case 'cnt-skip': countStep(act_ === 'cnt-next'); break;
      case 'cnt-back': U.cnt.step = 'count'; U.cnt.i = Math.max(0, U.cnt.plan.length - 1); render(true); break;
      case 'cnt-apply': applyCount(); break;
      case 'rc-wh': U.rcv.wh = v; U.rcv.bin = {}; render(true); break;
      case 'rc-all': { var rpo = E.po(U.rcv.id); rpo.lines.forEach(function (l) { U.rcv.q[l.sku] = l.pq - l.recv; }); render(true); break; }
      case 'rc-next': rcSave(); if (U.rcv.step === 1 && !Object.keys(U.rcv.q).some(function (k) { return U.rcv.q[k] > 0; })) { toast('Enter what arrived, or press Everything arrived.'); break; } U.rcv.step++; render(true); view.scrollTop = 0; break;
      case 'rc-back': rcSave(); U.rcv.step = Math.max(0, U.rcv.step - 1); render(true); break;
      case 'rc-post': rcPost(); break;
      case 'rc-labels': { var lp = E.po(U.rcv.id); U.lblMode = 'items'; U.lblSel = {}; lp.lines.forEach(function (l) { if (U.rcv.q[l.sku] > 0) U.lblSel[l.sku] = true; }); location.hash = '#/labels'; break; }
      case 'po-bill': billModal(id); break;
      case 'tour': startCoach('tour'); break;
      case 'flow': startCoach('flow'); break;
      case 'coach-next': coachGo(1); break;
      case 'coach-back': coachGo(-1); break;
      case 'coach-do': coachDo(); break;
      case 'coach-end': endCoach(); break;
      case 'coach-reset': endCoach(); E.reset(); U.scans = []; U.scanHit = null; U.cnt = null; U.rcv = null; clearSel(); toast('Started fresh'); location.hash = '#/overview'; break;
    }
  });
  function saveViewModal() {
    var desc = [U.cat, U.status === 'low' ? 'low stock' : U.status === 'out' ? 'out of stock' : '', U.q ? '“' + U.q + '”' : ''].filter(Boolean).join(' · ');
    openModal('<header><h2>Save view</h2><p>Saves the current filters: ' + esc(desc) + '.</p></header><div class="body"><label class="field">Name<input class="input" name="name" maxlength="28" required value="' + esc(desc.replace(/“|”/g, '')) + '"></label></div><footer><button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="submit">Save view</button></footer>',
      function (fd) { var nm = String(fd.get('name') || '').trim(); if (!nm) return false; U.views.push({ name: nm, q: U.q, cat: U.cat, status: U.status, custom: true }); savePrefs(); render(true); toast('Saved view “' + esc(nm) + '”'); });
  }
  function bulkRopModal() {
    var ids = selected();
    function prev(r) { var ch = 0, newLow = 0; var rows = ids.map(function (k) { var o = E.rop(k), av = E.available(k); if (o !== r) ch++; if (av <= r && av > o) newLow++; return '<tr><td>' + V.itemCell(k, true) + '</td><td class="num">' + av + '</td><td class="num">' + o + '</td><td class="num"><b>' + r + '</b></td><td>' + (av <= r ? '<span class="pill low">Low</span>' : '<span class="pill ok">OK</span>') + '</td></tr>'; }).join('');
      return '<div class="prev-h"><b>What this does</b><span>' + ch + ' of ' + ids.length + ' items change' + (newLow ? ' · ' + newLow + ' become low and will get a draft order' : '') + '</span></div><div class="boxed scroll-x"><table class="tbl"><thead><tr><th>Item</th><th class="num">Available</th><th class="num">Now</th><th class="num">New</th><th>Status after</th></tr></thead><tbody>' + rows + '</tbody></table></div>'; }
    openModal('<header><h2>Set reorder point</h2><p>We warn you, and draft an order, when available stock drops to this number.</p></header><div class="body"><label class="field">Reorder point' + stepper('rop', E.rop(ids[0]), null, 'Reorder point') + '</label><div id="rop-prev">' + prev(E.rop(ids[0])) + '</div></div><footer><button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="submit">Apply to ' + ids.length + '</button></footer>',
      function (fd) { var r = parseInt(fd.get('rop'), 10); if (isNaN(r)) return false; act('reorder points', function () { ids.forEach(function (k) { touchedBefore[k] = 1; E.setReorder(k, r, E.roq(k)); }); }, 'Reorder point set to ' + r + ' for ' + ids.length + ' items'); clearSel(); render(true); });
    $('[name="rop"]', modal).addEventListener('input', function (e) { var r = parseInt(e.target.value, 10); if (!isNaN(r)) $('#rop-prev', modal).innerHTML = prev(r); });
  }
  function previewDraft(skus) {
    var by = {}; skus.forEach(function (k) { var sid = E.item(k).supplier; (by[sid] = by[sid] || []).push(k); });
    var total = 0, rows = '';
    Object.keys(by).forEach(function (sid) {
      var ex = E.pos().filter(function (p) { return p.status === 'draft' && p.supplier === sid; })[0];
      by[sid].forEach(function (k) { var it = E.item(k), q = E.suggestQty(k), dup = ex && ex.lines.some(function (l) { return l.sku === k; }); if (!dup) total += q * it.buy.per * E.lastCost(k); rows += '<tr><td>' + V.itemCell(k, true) + '</td><td>' + esc(E.supplier(sid).name) + '</td><td>' + (dup ? '<span class="pill plain">Already on ' + ex.id + '</span>' : ex ? '<span class="pill acc">Add to ' + ex.id + '</span>' : '<span class="pill ok">New draft</span>') + '</td><td class="num">' + (dup ? '—' : V.buyLabel(it, q)) + '</td></tr>'; });
    });
    openModal('<header><h2>Add to draft purchase orders</h2><p>Nothing is sent to suppliers yet: drafts wait for your approval.</p></header><div class="body"><div class="prev-h"><b>What this does</b><span>' + plural2(skus.length, 'item') + ' across ' + plural2(Object.keys(by).length, 'supplier') + ' · about ' + V.inr(total) + ' at last cost</span></div><div class="boxed scroll-x"><table class="tbl"><thead><tr><th>Item</th><th>Supplier</th><th>Draft</th><th class="num">Quantity</th></tr></thead><tbody>' + rows + '</tbody></table></div></div><footer><button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="submit">Apply</button></footer>',
      function () { act('draft POs', function () { return draftFor(skus); }, function (m) { return 'Added ' + skus.length + ' items to ' + m.length + ' draft PO' + (m.length > 1 ? 's' : '') + ' · <a href="#/purchasing?tab=drafts">Review</a>'; }); clearSel(); render(true); }, true);
  }
  function previewShip(sh) {
    if (!sh.length) return;
    var units = 0, val = 0; sh.forEach(function (s) { s.lines.forEach(function (l) { units += l.res; val += l.res * E.item(l.sku).price; }); });
    openModal('<header><h2>Dispatch ' + plural2(sh.length, 'order') + '</h2><p>Stock leaves the shelves, the ledger records it at cost, and Lumen CRM sees the new numbers.</p></header><div class="body"><div class="prev-h"><b>What this does</b><span>' + units + ' units · ' + V.inr(val) + ' of orders</span></div><ul class="list boxed">' + sh.map(function (s) { return '<li><div class="grow"><div class="t">' + esc(s.customer) + ' ' + V.chipSO(s.id) + '</div><div class="s">' + s.lines.map(function (l) { return l.res + ' × ' + esc(E.item(l.sku).name); }).join(', ') + '</div></div></li>'; }).join('') + '</ul></div><footer><button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="submit">Dispatch ' + sh.length + '</button></footer>',
      function () { act('dispatch', function () { sh.forEach(function (s) { s.lines.forEach(function (l) { touchedBefore[l.sku] = 1; }); E.dispatch(s.id); }); return sh; }, 'Dispatched ' + sh.length + ' orders · stock and ledger updated'); clearSel(); render(true); });
  }
  function toggleNew(btn) {
    var m = $('#newmenu'); if (!m) return;
    var open = m.hidden; m.hidden = !open; btn.setAttribute('aria-expanded', String(open));
    if (open) { var f = $('button', m); if (f) f.focus(); }
  }
  function closeNew() { var m = $('#newmenu'); if (m) m.hidden = true; var b = $('[data-act="newmenu"]'); if (b) b.setAttribute('aria-expanded', 'false'); }
  document.addEventListener('click', function (e) { if (!e.target.closest('#newmenu, [data-act="newmenu"]')) closeNew(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNew(); });
  function closeWho() { var m = $('#whomenu'); if (m && !m.hidden) { m.hidden = true; $('#me-btn').setAttribute('aria-expanded', 'false'); } }
  document.addEventListener('click', function (e) { if (!e.target.closest('.mewrap')) closeWho(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var m = $('#whomenu'); if (m && !m.hidden) { closeWho(); $('#me-btn').focus(); } } });
  function plural2(k, w) { return k + ' ' + w + (k === 1 ? '' : 's'); }
  function quickAdjust(sku, d) {
    var it = E.item(sku), wh = U.wh || (E.onHand(sku, 'BHW') || d > 0 ? 'BHW' : 'BLR'), bin = (E.binsOf(sku, wh)[0] || {}).bin || E.primaryBin(sku, wh);
    if (d < 0 && E.onHand(sku, wh) <= 0) { toast('No ' + esc(it.name) + ' on the shelf at ' + E.wh(wh).short + '.'); return; }
    touchedBefore[sku] = 1;
    act('adjustment', function () { return E.adjust({ sku: sku, wh: wh, bin: bin, qty: d, note: d < 0 ? 'Quick adjust: removed 1' : 'Quick adjust: added 1' }); }, function (m) { return (d > 0 ? 'Added 1 ' : 'Removed 1 ') + esc(it.name) + ' at <span class="mono">' + bin + '</span> · ' + E.available(sku) + ' available'; });
  }
  function shortPick(id, i, found, why) {
    var so = E.so(id), p = so.pick[i], it = E.item(p.sku), miss = p.qty - found;
    U.pkShort = null; U.pkMsg = null;
    act('short pick', function () { return E.shortPick(id, i, found, why); }, function (b) {
      return (why === 'damaged' ? '1 damaged ' + esc(it.name) + ' written off' : 'Picked ' + found + ' of ' + (found + miss) + ' ' + esc(it.name)) + (b ? ' · ' + miss + ' moved to backorder <span class="mono">' + b.id + '</span>' : '') + (why !== 'damaged' ? ' · ' + p.bin + ' flagged for a count' : '');
    });
  }
  function readCount() {
    var C = U.cnt, bin = C.plan[C.i]; if (!bin) return;
    C.res[bin] = $$('input[data-cnt]', view).map(function (i) { return { sku: i.dataset.cnt, expected: +i.dataset.exp, counted: Math.max(0, parseInt(i.value, 10) || 0) }; });
  }
  function countStep(save) {
    var C = U.cnt; if (save) readCount();
    if (C.i < C.plan.length - 1) C.i++; else C.step = 'review';
    render(true); view.scrollTop = 0;
  }
  function applyCount() {
    var C = U.cnt, results = C.plan.filter(function (b) { return C.res[b]; }).map(function (b) { return { bin: b, lines: C.res[b] }; });
    var r = act('cycle count', function () { return E.applyCount(results); }, function (x) { return 'Count ' + x.ref + ' applied · ' + plural2(results.length, 'bin') + ' counted · ' + plural2(x.moves.length, 'adjustment'); });
    U.cnt = null; location.hash = '#/overview';
  }
  function rcSave() {
    var R = U.rcv; if (!R) return;
    $$('input[data-rq]', view).forEach(function (i) { R.q[i.dataset.rq] = Math.max(0, parseInt(i.value, 10) || 0); });
    $$('select[data-rb]', view).forEach(function (sel) { R.bin[sel.dataset.rb] = sel.value; });
    var dn = $('#rc-dn'); if (dn) R.dn = dn.value; var dm = $('#rc-dmg'); if (dm) R.dmg = dm.checked; var nt = $('#rc-note'); if (nt) R.note = nt.value;
  }
  function rcPost() {
    rcSave(); var R = U.rcv, po = E.po(R.id);
    var lines = po.lines.map(function (l) { touchedBefore[l.sku] = 1; return { sku: l.sku, pq: R.q[l.sku] || 0, bin: R.bin[l.sku] || E.primaryBin(l.sku, R.wh) }; });
    var gr = act('goods receipt', function () { var g = E.receive(po.id, lines, R.wh); if (g && (R.note || R.dn)) { g.note = R.note; g.dn = R.dn; E.commit(); } return g || false; }, function (g) { return 'Posted <span class="mono">' + g.id + '</span> · ' + g.lines.reduce(function (a, x) { return a + x.units; }, 0) + ' units put away'; });
    if (gr) { R.gr = gr; R.step = 4; render(true); view.scrollTop = 0; }
  }
  function billModal(id) {
    var po = E.po(id), rv = Math.round(E.receivedValue(po));
    openModal('<header><h2>Record supplier bill · ' + po.id + '</h2><p>' + esc(E.supplier(po.supplier).name) + ' · purchase → receive → bill. The amount should match what was received.</p></header><div class="body"><div class="row2"><label class="field">Bill number<input class="input" name="no" required placeholder="e.g. INV-2611-084" autocomplete="off"></label><label class="field">Amount (₹)<input class="input num" name="amt" type="number" min="0" inputmode="numeric" value="' + rv + '"></label></div><p class="faint" style="margin:0;font-size:12.5px">Received so far: ' + V.inr(rv) + (po.status === 'partial' ? ' · the rest of the PO is still open' : '') + '</p></div><footer><button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="submit">Record bill</button></footer>',
      function (fd) { var no = String(fd.get('no') || '').trim(); if (!no) return false; act('bill', function () { E.billPO(id, { no: no, amount: +fd.get('amt') || 0 }); }, 'Bill ' + esc(no) + ' recorded on <span class="mono">' + id + '</span>'); });
  }

  /* ---------- guided tour and "Try the full flow" ---------- */
  var coach = null, TKEY = 'stockroom:toured';
  var TOUR = [
    { r: '#/overview', sel: '.todo', t: 'This is Today', b: 'What needs you now, in plain words, most urgent first; each row is one click. The tiles above filter, and on a phone Scan, Receive, Pick and Count are big buttons at the top.' },
    { r: '#/receive', sel: '.tasks', t: '1 · Receive stock', b: 'When a delivery arrives, choose its purchase order. Stockroom walks you through it: check the paperwork, count, put it on a shelf, confirm.' },
    { r: '#/sales', sel: 'table[data-kb] tbody tr', t: '2 · Pick an order', b: 'Won orders are reserved straight away. Pick mode shows one bin at a time, in walking order; scan each label to confirm.' },
    { r: '#/sales?tab=ready', sel: '.panel', t: '3 · Dispatch', b: 'Once everything is picked, dispatch hands it to the courier. The stock leaves at its oldest purchase cost, so profit is always right.' },
    { r: '#/items', sel: '#item-rows', t: '4 · See stock update', b: 'Every movement updates these numbers at once, and Lumen CRM sees the new availability too. Tap the ? next to any word you don’t know.' }
  ];
  function flowSteps() {
    var po = E.pos().filter(function (p) { return p.status === 'approved' || p.status === 'partial'; }).sort(function (a, b) { return (a.eta || 0) - (b.eta || 0); })[0];
    var so = E.sos().filter(function (s) { return s.status === 'reserved' && !E.shortfall(s) && s.lines.length <= 3; })[0] || E.sos().filter(function (s) { return s.status === 'picking'; })[0];
    var sku = so && so.lines[0].sku, before = sku ? E.available(sku) : 0;
    return [
      { r: po ? '#/receive/' + po.id : '#/receive', sel: '.focus, .tasks', t: '1 · Receive a delivery', b: po ? esc(E.supplier(po.supplier).name) + ' just delivered ' + po.id + '. Count it in and put it on the shelves.' : 'No deliveries are open right now.', go: po && function () { var R = U.rcv; po.lines.forEach(function (l) { R.q[l.sku] = l.pq - l.recv; }); R.step = 3; rcPost(); } },
      { r: so ? '#/pick/' + so.id : '#/sales', sel: '.focus, .page-h', t: '2 · Pick an order', b: so ? 'Pick ' + so.id + ' for ' + esc(so.customer) + ': walk the bins in order and confirm each line.' : 'No orders are ready to pick.', go: so && function () { if (so.status === 'reserved') E.startPicking(so.id); E.so(so.id).pick.forEach(function (q, i) { if (!q.done) E.pickLine(so.id, i, true); }); E.commit(); render(true); } },
      { r: so ? '#/pick/' + so.id : '#/sales', sel: '.focus', t: '3 · Dispatch it', b: 'Everything is picked. Dispatch hands it to the courier and records the cost of goods.', go: so && function () { var d = E.so(so.id); if (d.status === 'picked') { d.lines.forEach(function (l) { touchedBefore[l.sku] = 1; }); E.dispatch(so.id); } location.hash = '#/sales/' + so.id; } },
      { r: sku ? '#/items/' + sku : '#/items', sel: '.minis', t: '4 · See stock update', b: sku ? function () { return esc(E.item(sku).name) + ': available went from ' + before + ' to ' + E.available(sku) + '. The ledger has the movement at cost, and Lumen CRM was told.'; } : 'Stock numbers update after every step.' },
      { r: '#/overview', sel: '.todo', t: 'That’s the whole loop', b: 'Receive → pick → dispatch → stock updates. Today shows what’s next. Use Start fresh in the sidebar any time to run it again.', last: true }
    ];
  }
  function startCoach(kind) {
    endCoach(true);
    coach = { kind: kind, i: 0, steps: kind === 'tour' ? TOUR : flowSteps(), did: {} };
    var el = document.createElement('div'); el.className = 'coach'; el.id = 'coach'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'false'); el.setAttribute('aria-labelledby', 'coach-t');
    var sp = document.createElement('div'); sp.className = 'spot'; sp.id = 'spot'; sp.setAttribute('aria-hidden', 'true');
    document.body.appendChild(sp); document.body.appendChild(el);
    coachShow();
  }
  function coachShow() {
    var st = coach.steps[coach.i], el = $('#coach');
    if (location.hash !== st.r) location.hash = st.r;
    var body = typeof st.b === 'function' ? st.b() : st.b, isFlow = coach.kind === 'flow';
    el.innerHTML = '<div class="co-k">' + (isFlow ? 'Try the full flow' : 'Quick tour') + ' · ' + (coach.i + 1) + ' of ' + coach.steps.length + '</div><h2 id="coach-t">' + st.t + '</h2><p>' + body + '</p>' +
      '<div class="co-a">' + (coach.i ? '<button class="btn sm ghost" data-act="coach-back">Back</button>' : '') + '<span class="sp"></span>' +
      (st.last ? (isFlow ? '<button class="btn sm" data-act="coach-reset">Start fresh</button>' : '<button class="btn sm" data-act="flow">Try the full flow</button>') + '<button class="btn sm primary" data-act="coach-end">Done</button>' :
        '<button class="btn sm ghost" data-act="coach-end">' + (isFlow ? 'Stop' : 'Skip tour') + '</button>' + (st.go && !coach.did[coach.i] ? '<button class="btn sm primary" data-act="coach-do">Do it for me</button>' : '<button class="btn sm primary" data-act="coach-next">Next</button>')) + '</div>';
    setTimeout(coachPlace, 80);
    var b = $('.co-a .primary', el); if (b) b.focus({ preventScroll: true });
  }
  function coachPlace() {
    if (!coach) return;
    var st = coach.steps[coach.i], sp = $('#spot'), t = $$(st.sel).filter(function (x) { return x.offsetParent; })[0];
    if (!t || !sp) { if (sp) sp.style.opacity = 0; return; }
    if (t.getBoundingClientRect().top > innerHeight - 120 || t.getBoundingClientRect().bottom < 60) t.scrollIntoView({ block: 'center' });
    var r = t.getBoundingClientRect(), pad = 6, h = Math.min(r.height, innerHeight * .62);
    // moved with transform (not left/top) so the spotlight never counts as a layout shift
    var first = !sp.dataset.placed; sp.dataset.placed = 1;
    sp.style.transition = first ? 'none' : '';
    sp.style.width = (r.width + pad * 2) + 'px'; sp.style.height = (h + pad * 2) + 'px';
    sp.style.transform = 'translate(' + Math.round(r.left - pad) + 'px,' + Math.round(r.top - pad) + 'px)'; sp.style.opacity = 1;
  }
  function coachGo(d) { coach.i = Math.max(0, Math.min(coach.steps.length - 1, coach.i + d)); coachShow(); }
  function coachDo() { var st = coach.steps[coach.i]; if (st.go) { st.go(); coach.did[coach.i] = 1; } setTimeout(function () { coachGo(1); }, 350); }
  function endCoach(silent) {
    ['#coach', '#spot'].forEach(function (k) { var x = $(k); if (x) x.remove(); });
    if (coach && !silent) { try { localStorage.setItem(TKEY, '1'); } catch (e) { } }
    coach = null;
  }
  addEventListener('resize', function () { if (coach) coachPlace(); });
  view.addEventListener('scroll', function () { if (coach) coachPlace(); }, { passive: true });

  function editRop(sku) {
    U.editRop = sku; var tb = $('#item-rows'); if (tb) tb.innerHTML = V.itemRows(U);
    var i = $('.inl-in'); if (i) { i.focus(); i.select(); }
  }
  function commitRop(i) {
    var sku = i.dataset.sku, val = parseInt(i.value, 10), old = E.rop(sku);
    U.editRop = null;
    if (isNaN(val) || val === old) { render(true); return; }
    touchedBefore[sku] = 1;
    act('reorder point', function () { E.setReorder(sku, val, E.roq(sku)); }, 'Reorder point for ' + esc(E.item(sku).name) + ': ' + old + ' → ' + val);
  }
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t.classList && t.classList.contains('inl-in')) {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); commitRop(t); }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); U.editRop = null; render(true); }
    }
  }, true);
  document.addEventListener('focusout', function (e) { if (e.target.classList && e.target.classList.contains('inl-in') && U.editRop) commitRop(e.target); });
  document.addEventListener('input', function (e) {
    var t = e.target, k = t.dataset && t.dataset.in;
    if (k === 'q') { U.q = t.value; var tb = $('#item-rows'); if (tb) tb.innerHTML = V.itemRows(U); kb = -1; }
  });
  document.addEventListener('change', function (e) {
    var t = e.target, k = t.dataset && t.dataset.in;
    if (k === 'lsku') { U.lsku = t.value; U.llimit = 60; history.replaceState(null, '', '#/ledger'); route.qs = {}; render(); }
    if (k === 'poline') E.setPOLine(t.dataset.id, t.dataset.sku, parseInt(t.value, 10) || 0);
    if (k === 'policy') { var pc = E.policy(), nv = parseInt(t.value, 10); if (isNaN(nv) || nv === pc[t.dataset.k]) return; var np = { lead: pc.lead, safety: pc.safety }; np[t.dataset.k] = nv; E.setPolicy(np.lead, np.safety); toast('Reorder policy saved · ' + (E.policy().lead + E.policy().safety) + ' days of cover'); }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target, k = f.dataset.form;
    if (!k) return;
    e.preventDefault();
    if (k === 'note') { var tx = f.text.value.trim(); if (tx) { E.addNote(f.dataset.id, tx); toast('Note added'); } return; }
    if (k === 'vsku') { var code = f.code.value.trim(); if (code) { E.setVendorSku(f.dataset.sku, code); toast('Supplier’s code saved'); } return; }
    if (k === 'scan') { var c = f.code.value; if (c.trim()) handleScan(c); var i = $('#scan-in'); if (i) { i.value = ''; i.focus(); } }
    if (k === 'reorder') { var sku = f.dataset.sku, a = +f.rop.value, b = +f.roq.value; act('reorder settings', function () { E.setReorder(sku, a, b); }, 'Reorder settings saved for ' + esc(E.item(sku).name)); }
  });

  // keyboard: Linear-style single keys and G-sequences
  var gWait = 0, GO = { t: 'overview', n: 'count', e: 'receive', o: 'overview', i: 'items', l: 'locations', d: 'ledger', s: 'sales', p: 'purchasing', c: 'scan', b: 'labels', r: 'reports' };
  document.addEventListener('keydown', function (e) {
    var tag = document.activeElement && document.activeElement.tagName, typing = /INPUT|TEXTAREA|SELECT/.test(tag) || (document.activeElement && document.activeElement.isContentEditable);
    var mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); if (!modal.open) cmdk(); return; }
    if (mod && e.key.toLowerCase() === 'z' && !typing && lastUndo) { e.preventDefault(); doUndo(); return; }
    if (e.key === 'Escape' && !modal.open) {
      if (sheetWrap.classList.contains('open')) { location.hash = baseHref(); return; }
      if (selected().length) { clearSel(); render(true); return; }
      if (route.name === 'pick') { location.hash = '#/sales/' + U.pickId; return; }
    }
    if (typing || mod || e.altKey || modal.open) return;
    var key = e.key.toLowerCase();
    if (gWait && Date.now() - gWait < 900 && GO[key]) { gWait = 0; e.preventDefault(); location.hash = '#/' + GO[key]; return; }
    gWait = 0;
    if (key === 'g') { gWait = Date.now(); return; }
    if (e.key === '/') { e.preventDefault(); cmdk(); return; }
    if (e.key === '?') { e.preventDefault(); shortcutsModal(); return; }
    if (key === 'w') { setWh(U.wh === '' ? 'BHW' : U.wh === 'BHW' ? 'BLR' : ''); return; }
    if (key === 'n' && route.name === 'purchasing') { e.preventDefault(); newPOModal(); return; }
    if (sheetWrap.classList.contains('open')) return;
    if (key === 'j' || e.key === 'ArrowDown' && rows().length && kb >= 0) { e.preventDefault(); markKb(kb + 1); return; }
    if (key === 'k' || e.key === 'ArrowUp' && kb >= 0) { e.preventDefault(); markKb(kb - 1); return; }
    var r = rows()[kb];
    if (!r) return;
    if (e.key === 'Enter') { e.preventDefault(); location.hash = r.dataset.href; }
    if (key === 'x') { var cb = $('input[data-act="sel"]', r); if (cb) { cb.checked = !cb.checked; U[cb.dataset.k][cb.dataset.v] = cb.checked; render(true); } }
    if (key === 'e' && route.name === 'items') { e.preventDefault(); editRop(r.dataset.sku); }
  });
  $('#sheet-scrim').addEventListener('click', function () { location.hash = baseHref(); });
  $('#side-scrim').addEventListener('click', function () { $('#side').classList.remove('open'); });

  /* ---------- routing & bridge ---------- */
  function go() {
    var prev = route.name;
    route = parse();
    if (!allowed(route)) { route = { name: 'overview', id: null, qs: {} }; history.replaceState(null, '', '#/overview'); }
    if ((prev === 'scan' || prev === 'pick') && route.name !== prev) stopCam();
    if (prev !== route.name) { kb = -1; clearSel(); U.pkMsg = null; U.sort = null; if (route.name === 'pick') U.pkSkip = {}; }
    $('#side').classList.remove('open');
    render(prev === route.name);
    if (prev !== route.name) { view.scrollTop = 0; view.focus({ preventScroll: true }); }
  }
  addEventListener('hashchange', go);
  E.on(function () { render(true); });
  function pullDeals() {
    var r = E.syncDeals(), tag = '<span class="crm"><i></i>Lumen CRM</span> ';
    r.fresh.forEach(function (so) {
      so.lines.forEach(function (l) { touchedBefore[l.sku] = 1; });
      toast(tag + 'Deal won: ' + esc(so.customer) + ' · ' + (E.shortfall(so) ? E.shortfall(so) + ' units backordered' : 'all lines reserved') + ' <a href="#/sales/' + so.id + '">Open</a>', { ms: 6500 });
    });
    r.updated.forEach(function (so) { so.lines.forEach(function (l) { touchedBefore[l.sku] = 1; }); toast(tag + 'Deal changed: <span class="mono">' + so.id + '</span> re-reserved for ' + esc(so.customer) + ' <a href="#/sales/' + so.id + '">Open</a>', { ms: 6500 }); });
    r.released.forEach(function (so) { so.lines.forEach(function (l) { touchedBefore[l.sku] = 1; }); toast(tag + 'Deal re-opened: <span class="mono">' + so.id + '</span> cancelled and its stock released', { ms: 6500 }); });
    r.locked.forEach(function (so) { toast(tag + 'Deal changed, but <span class="mono">' + so.id + '</span> is already being picked. Update it by hand. <a href="#/sales/' + so.id + '">Open</a>', { ms: 8000 }); });
  }
  addEventListener('storage', function (e) { if (e.key === 'demo-bridge:won-deals') pullDeals(); });
  addEventListener('focus', pullDeals);
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopCam(); });

  setTimeout(loadPapers, 2500);
  route = parse();
  applyRole();
  if (!allowed(route)) { route = { name: 'overview', id: null, qs: {} }; history.replaceState(null, '', '#/overview'); }
  render();
  pullDeals();
  E.writeBridge();
  }
})();
