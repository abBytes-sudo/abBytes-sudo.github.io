/* Northlane store admin (design sample). Orders and stock live in this browser's localStorage and are shared with track.html. */
(function () {
  'use strict';
  var N = window.NLO, $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var S = N.load(), esc = N.esc, money = N.money, by = N.byId;
  var ui = { range: 14, status: 'all', q: '', page: 10, open: null, opener: null };
  var LOWAT = 5;

  function thumbs(o, max) {
    return '<span class="thumbs" aria-hidden="true">' + o.items.slice(0, max || 3).map(function (it) { var p = by[it.id], c = p.colors[it.c] || p.colors[0]; return '<span class="thumb">' + N.img(p) + '</span>'; }).join('') + '</span>';
  }
  function pill(st) { return '<span class="pill s-' + st + '">' + N.LABEL[st] + '</span>'; }
  function itemNames(o) { return o.items.map(function (it) { return by[it.id].name; }).join(', '); }
  function paid(o) { return o.pay.status !== 'Refunded'; }
  function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('on'); }, 2600); }

  /* ── KPIs ── */
  function kpis() {
    var d0 = N.dayStart(Date.now()), y0 = d0 - N.DAYMS, os = S.orders;
    var today = os.filter(function (o) { return o.ev.placed >= d0; }), yest = os.filter(function (o) { return o.ev.placed >= y0 && o.ev.placed < d0; });
    var rev = today.filter(paid).reduce(function (a, o) { return a + N.total(o); }, 0);
    var r14 = os.filter(function (o) { return o.ev.placed >= d0 - 13 * N.DAYMS && paid(o); }).reduce(function (a, o) { return a + N.total(o); }, 0);
    var np = os.filter(function (o) { return o.status === 'placed'; }), pk = os.filter(function (o) { return o.status === 'packed'; });
    var late = np.filter(function (o) { return Date.now() - o.ev.placed > 24 * 36e5; }).length;
    var sh = os.filter(function (o) { return o.status === 'shipped'; }).length, out = os.filter(function (o) { return o.status === 'out'; }).length;
    var diff = today.length - yest.length;
    var cards = [
      ["Today’s orders", today.length, '<span class="' + (diff >= 0 ? 'up' : 'dn') + '">' + (diff >= 0 ? '▲ ' : '▼ ') + Math.abs(diff) + '</span> vs yesterday (' + yest.length + ')'],
      ['Revenue today', money(rev), money(r14) + ' in the last 14 days'],
      ['To fulfil', np.length + pk.length, np.length + ' to pack · ' + pk.length + ' to ship' + (late ? ' · <span class="warn">' + late + ' overdue</span>' : '')],
      ['Shipped', sh + out, out + ' out for delivery today']
    ];
    $('#kpis').innerHTML = cards.map(function (c) { return '<div class="card kpi"><p class="kpi-l">' + c[0] + '</p><p class="kpi-v">' + c[1] + '</p><p class="kpi-s">' + c[2] + '</p></div>'; }).join('');
  }

  /* ── sales chart (SVG) ── */
  function chart() {
    var box = $('#chart'), w = Math.max(280, Math.round(box.clientWidth)), h = w < 520 ? 230 : 290, n = ui.range, d0 = N.dayStart(Date.now());
    var days = [], i;
    for (i = n - 1; i >= 0; i--) days.push({ t: d0 - i * N.DAYMS, rev: 0, n: 0 });
    S.orders.forEach(function (o) { var k = Math.floor((o.ev.placed - days[0].t) / N.DAYMS); if (k >= 0 && k < n && paid(o)) { days[k].rev += N.total(o); days[k].n++; } });
    var max = Math.max.apply(null, days.map(function (d) { return d.rev; })), step = max > 1500 ? 500 : max > 600 ? 200 : 100, top = Math.max(step, Math.ceil(max / step) * step);
    var L = 44, R = 6, T = 14, B = 30, cw = w - L - R, ch = h - T - B, bw = cw / n, tot = days.reduce(function (a, d) { return a + d.rev; }, 0), cnt = days.reduce(function (a, d) { return a + d.n; }, 0);
    var g = '', ticks = 4;
    for (i = 0; i <= ticks; i++) { var y = T + ch - ch * i / ticks; g += '<line x1="' + L + '" x2="' + (w - R) + '" y1="' + y + '" y2="' + y + '" stroke="rgba(19,17,15,' + (i ? .08 : .25) + ')"/><text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + (top * i / ticks >= 1000 ? '$' + (top * i / ticks / 1000) + 'k' : '$' + top * i / ticks) + '</text>'; }
    var avg = tot / n, ya = T + ch - ch * avg / top;
    days.forEach(function (d, k) {
      var bh = ch * d.rev / top, x = L + k * bw + bw * .18, ww = bw * .64, dt = new Date(d.t), isT = k === n - 1;
      var lbl = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ': ' + money(d.rev) + ', ' + d.n + ' order' + (d.n === 1 ? '' : 's');
      g += '<g class="bar' + (isT ? ' today' : '') + '" tabindex="0" role="img" aria-label="' + esc(lbl) + '" data-tip="' + esc(dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + '|' + money(d.rev) + ' · ' + d.n + ' order' + (d.n === 1 ? '' : 's')) + '" data-x="' + (x + ww / 2) + '" data-y="' + (T + ch - bh) + '" style="--i:' + k + '"><rect class="hit" x="' + (L + k * bw) + '" y="' + T + '" width="' + bw + '" height="' + ch + '" fill="transparent"/>' +
        (d.rev ? '<rect class="b" x="' + x + '" y="' + (T + ch - bh) + '" width="' + ww + '" height="' + bh + '" rx="0"/>' : '<rect x="' + x + '" y="' + (T + ch - 2) + '" width="' + ww + '" height="2" fill="rgba(19,17,15,.15)"/>') + '</g>';
      if (n <= 7 || w >= 560 || k % 2 === (n - 1) % 2) g += '<text x="' + (L + k * bw + bw / 2) + '" y="' + (h - 8) + '" text-anchor="middle"' + (isT ? ' style="fill:#13110F;font-weight:600"' : '') + '>' + (n <= 7 ? dt.toLocaleDateString('en-US', { weekday: 'short' }) : dt.getDate()) + '</text>';
    });
    g += '<line x1="' + L + '" x2="' + (w - R) + '" y1="' + ya + '" y2="' + ya + '" stroke="#13110F" stroke-dasharray="4 5" opacity=".55"/><text x="' + (w - R) + '" y="' + (ya - 6) + '" text-anchor="end" style="fill:#13110F">avg ' + money(Math.round(avg)) + '/day</text>';
    box.className = 'chart' + (document.visibilityState === 'visible' ? ' anim' : '');
    box.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" role="group" aria-label="Revenue per day, last ' + n + ' days">' + g + '</svg><div class="tip" id="tip" aria-hidden="true"></div>';
    $('#chSum').textContent = 'Last ' + n + ' days: ' + money(tot) + ' from ' + cnt + ' paid orders · average order ' + money(cnt ? Math.round(tot / cnt) : 0);
  }
  function tip(el, on) {
    var t = $('#tip'); if (!t) return;
    if (!on) { t.classList.remove('on'); return; }
    var p = el.getAttribute('data-tip').split('|'), svg = el.ownerSVGElement, sc = svg.clientWidth / svg.viewBox.baseVal.width;
    t.innerHTML = '<b>' + esc(p[0]) + '</b><br>' + esc(p[1]); t.style.left = Math.min(Math.max(+el.dataset.x * sc, 70), svg.clientWidth - 70) + 'px'; t.style.top = (+el.dataset.y * sc - 8) + 'px'; t.classList.add('on');
  }

  /* ── fulfilment queue + stock ── */
  function queue() {
    var list = S.orders.filter(function (o) { return o.status === 'placed' || o.status === 'packed'; }).sort(function (a, b) { return a.ev.placed - b.ev.placed; });
    $('#fqN').textContent = list.length + ' open · oldest first';
    $('#queue').innerHTML = list.length ? list.map(function (o) {
      var age = Date.now() - o.ev.placed, late = age > 24 * 36e5 && o.status === 'placed';
      return '<div class="q-r">' + thumbs(o, 3) + '<div class="q-m"><b>' + o.id + '</b> · ' + esc(o.name) + '<span class="' + (late ? 'late' : '') + '">' + N.count(o) + ' item' + (N.count(o) > 1 ? 's' : '') + ' · ' + (o.method === 'Express' ? 'Express · ' : '') + N.ago(o.ev.placed) + ' waiting' + (late ? ' · overdue' : '') + (o.pay.status === 'Pending' ? ' · awaiting payment' : '') + '</span></div>' +
        (o.status === 'placed' ? '<button class="btn sm" type="button" data-pack="' + o.id + '" aria-label="Pack order ' + o.id + '">Pack</button>' : '<button class="btn sm acc" type="button" data-open="' + o.id + '" aria-label="Ship order ' + o.id + '">Ship…</button>') + '</div>';
    }).join('') : '<p class="empty">Nothing waiting. Every order is on its way.</p>';
  }
  function low() {
    var rows = [];
    N.P.forEach(function (p) { p.colors.forEach(function (c, ci) { var k = p.id + '|' + ci, a = N.avail(S, k); if (a <= LOWAT) rows.push({ p: p, c: c, k: k, a: a }); }); });
    rows.sort(function (x, y) { return x.a - y.a; });
    $('#lsN').textContent = rows.length ? rows.length + ' variant' + (rows.length > 1 ? 's' : '') + ' at ' + LOWAT + ' or fewer' : 'All healthy';
    $('#low').innerHTML = rows.length ? rows.slice(0, 7).map(function (r) {
      return '<div class="lo-r"><div class="thumb">' + N.img(r.p) + '</div><div class="q-m"><b>' + esc(r.p.name) + '</b> · ' + esc(r.c.n) + '<span class="' + (r.a <= 0 ? 'late' : '') + '">' + (r.a <= 0 ? 'Out of stock' : 'Only ' + r.a + ' available') + '</span><div class="meter" aria-hidden="true"><i class="' + (r.a <= 0 ? 'zero' : '') + '" style="width:' + Math.max(r.a <= 0 ? 100 : 6, r.a / LOWAT * 100) + '%"></i></div></div><button class="btn ghost sm" type="button" data-restock="' + r.k + '" aria-label="Restock 24 of ' + esc(r.p.name) + ' ' + esc(r.c.n) + '">Restock +24</button></div>';
    }).join('') : '<p class="empty">No variants are running low.</p>';
  }

  /* ── orders table ── */
  function filtered() {
    var q = ui.q.trim().toLowerCase();
    return S.orders.filter(function (o) { return (ui.status === 'all' || o.status === ui.status) && (!q || (o.id + ' ' + o.name + ' ' + o.email + ' ' + itemNames(o)).toLowerCase().indexOf(q) >= 0); }).sort(function (a, b) { return b.ev.placed - a.ev.placed; });
  }
  function chips() {
    var all = [{ k: 'all', l: 'All' }].concat(N.STEPS);
    $('#chips').innerHTML = all.map(function (s) {
      var n = s.k === 'all' ? S.orders.length : S.orders.filter(function (o) { return o.status === s.k; }).length;
      return '<button type="button" data-st="' + s.k + '" aria-pressed="' + (ui.status === s.k) + '">' + s.l + ' <b>' + n + '</b></button>';
    }).join('');
  }
  function table() {
    var list = filtered(), shown = list.slice(0, ui.page);
    $('#oCount').textContent = list.length + ' order' + (list.length === 1 ? '' : 's');
    $('#rows').innerHTML = shown.length ? shown.map(function (o) {
      return '<tr data-id="' + o.id + '"><td data-l="Order"><button type="button" class="oid" data-open="' + o.id + '" aria-label="Open order ' + o.id + '">' + o.id + '</button></td><td data-l="Placed">' + N.fmtD(o.ev.placed) + ', ' + N.fmtT(o.ev.placed) + '</td>' +
        '<td data-l="Customer" class="cell-c">' + esc(o.name) + '<small>' + esc(o.addr.city) + '</small></td><td data-l="Items"><div class="cell-i">' + thumbs(o, 3) + '<span>' + N.count(o) + ' item' + (N.count(o) > 1 ? 's' : '') + '</span></div></td>' +
        '<td data-l="Total" class="num">' + money(N.total(o)) + '</td><td data-l="Payment"><span class="p-' + o.pay.status + '">' + o.pay.status + '</span></td><td data-l="Status">' + pill(o.status) + '</td></tr>';
    }).join('') : '<tr><td colspan="7"><p class="empty">No orders match “' + esc(ui.q) + '”.</p></td></tr>';
    $('#moreN').textContent = 'Showing ' + shown.length + ' of ' + list.length;
    $('#moreBtn').hidden = list.length <= ui.page;
  }

  /* ── order drawer ── */
  var NEXT = { placed: ['packed', 'Pack order'], packed: ['shipped', 'Ship with tracking'], shipped: ['out', 'Mark out for delivery'], out: ['delivered', 'Mark delivered'] };
  function drawer() {
    var o = S.orders.filter(function (x) { return x.id === ui.open; })[0]; if (!o) return;
    var i = N.IDX[o.status];
    $('#dwT').textContent = o.id;
    $('#dwSub').innerHTML = pill(o.status) + '<span>Placed ' + N.fmtDT(o.ev.placed) + '</span>';
    var items = o.items.map(function (it) { var p = by[it.id], c = p.colors[it.c] || p.colors[0]; return '<li class="it"><div class="thumb">' + N.img(p) + '</div><div class="it-tx"><b>' + esc(p.name) + '</b><span>' + esc(c.n) + ' · ' + esc(it.s) + ' · Qty ' + it.q + '</span></div><span class="it-p">' + money(p.price * it.q) + '</span></li>'; }).join('');
    var tl = N.STEPS.map(function (s, j) { return '<li class="' + (j <= i ? 'done' : '') + (j === i ? ' cur' : '') + '"' + (j === i ? ' aria-current="step"' : '') + '><i></i><div><b>' + s.l + '</b><span>' + (o.ev[s.k] ? N.fmtDT(o.ev[s.k]) : 'Not yet') + '</span></div></li>'; }).join('');
    var act;
    if (i === 4) act = '<p class="hintl">This order is complete. Delivered ' + N.fmtDT(o.ev.delivered) + '.</p>';
    else if (o.status === 'packed') {
      act = '<form id="shipF" novalidate><label class="fld"><span>Tracking number (' + esc(N.carrierFor(o)) + ')</span><input id="trkIn" value="' + esc(o.tracking || N.genTrack(o)) + '" autocomplete="off" spellcheck="false" required aria-describedby="trkE"><span class="e" id="trkE" role="alert"></span></label><button class="btn acc" type="submit">Ship with tracking</button></form>';
    } else act = '<button class="btn' + (o.status === 'out' ? ' acc' : '') + '" type="button" id="advBtn" data-to="' + NEXT[o.status][0] + '">' + NEXT[o.status][1] + '</button>' + (o.status === 'placed' ? '<p class="hintl">Packing reserves stock: ' + o.items.map(function (it) { return it.q + ' × ' + by[it.id].name; }).join(', ') + '.</p>' : '');
    var mail = esc(o.email);
    $('#dwBd').innerHTML =
      '<section class="card act" aria-label="Update status"><h3>Next step</h3>' + act + '</section>' +
      '<section class="card" aria-label="Progress"><h3>Timeline</h3><ol class="vt">' + tl + '</ol></section>' +
      '<section class="card" aria-label="Items"><h3>Items</h3><ul class="items">' + items + '</ul><div class="sum"><div><span>Subtotal</span><span>' + money(N.sub(o)) + '</span></div><div><span>Shipping (' + o.method + ')</span><span>' + (o.ship ? money(o.ship) : 'Free') + '</span></div><div class="tot"><span>Total</span><span>' + money(N.total(o)) + '</span></div></div></section>' +
      '<section class="card" aria-label="Customer and payment"><h3>Customer &amp; payment</h3><dl class="kv"><div><dt>Customer</dt><dd>' + esc(o.name) + '</dd></div><div><dt>Email</dt><dd>' + mail + '</dd></div><div><dt>Ship to</dt><dd>' + esc(o.addr.l1) + ', ' + esc(o.addr.city) + ' ' + esc(o.addr.pc) + ', ' + esc(o.addr.cn) + '</dd></div><div><dt>Payment</dt><dd><span class="p-' + o.pay.status + '">' + o.pay.status + '</span> · ' + esc(o.pay.method) + '</dd></div>' +
      (o.tracking ? '<div><dt>Shipment</dt><dd>' + esc(o.carrier) + '<br><span class="mono">' + esc(o.tracking) + '</span></dd></div>' : '') + '</dl></section>' +
      '<p class="dw-lk"><a class="lnk" href="track.html?o=' + o.id + '&amp;e=' + encodeURIComponent(o.email) + '">See what the customer sees →</a></p>';
    var f = $('#shipF');
    if (f) f.addEventListener('submit', function (e) {
      e.preventDefault(); var v = $('#trkIn').value.trim().toUpperCase();
      if (!/^[A-Z0-9]{8,20}$/.test(v)) { $('#trkE').textContent = 'Enter 8 to 20 letters or numbers.'; $('#trkIn').setAttribute('aria-invalid', 'true'); $('#trkIn').focus(); return; }
      act1(o, 'shipped', { tracking: v });
    });
    var a = $('#advBtn'); if (a) a.addEventListener('click', function () { act1(o, a.getAttribute('data-to')); });
  }
  function act1(o, to, opts) {
    if (N.advance(S, o, to, opts)) { all(); if (ui.open === o.id) { drawer(); $('#dwT').focus(); } var msg = { packed: 'packed. Stock reserved.', shipped: 'shipped with tracking ' + (opts && opts.tracking) + '.', out: 'out for delivery.', delivered: 'delivered.' }; toast(o.id + ' ' + msg[to]); }
  }
  function openDw(id) {
    ui.open = id; ui.opener = document.activeElement; var d = $('#dw'); drawer(); d.hidden = false; $('#dwPn').scrollTop = 0;
    requestAnimationFrame(function () { d.classList.add('open'); $('#dwT').focus(); });
  }
  function closeDw() {
    var d = $('#dw'); d.classList.remove('open'); ui.open = null;
    setTimeout(function () { d.hidden = true; }, 350);
    var o = ui.opener; if (o && document.contains(o)) o.focus(); else $('#rows .oid') && $('#rows .oid').focus();
  }

  function all() { kpis(); chart(); queue(); low(); chips(); table(); }

  /* ── events ── */
  document.addEventListener('click', function (e) {
    var t = e.target, b;
    if ((b = t.closest('[data-open]'))) { openDw(b.getAttribute('data-open')); return; }
    if ((b = t.closest('[data-pack]'))) { var o = S.orders.filter(function (x) { return x.id === b.getAttribute('data-pack'); })[0]; act1(o, 'packed'); return; }
    if ((b = t.closest('[data-restock]'))) { var k = b.getAttribute('data-restock'); S.stock[k] = (S.stock[k] || 0) + 24; N.save(S); all(); toast('Restocked 24 units.'); return; }
    if ((b = t.closest('[data-st]'))) { ui.status = b.getAttribute('data-st'); ui.page = 10; chips(); table(); return; }
    if ((b = t.closest('[data-r]'))) { ui.range = +b.getAttribute('data-r'); $$('[data-r]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); chart(); return; }
    if (t.closest('#dwSh') || t.closest('#dwX')) { closeDw(); return; }
    var tr = t.closest('#rows tr[data-id]'); if (tr && !t.closest('button')) openDw(tr.getAttribute('data-id'));
  });
  $('#q').addEventListener('input', function (e) { ui.q = e.target.value; ui.page = 10; table(); });
  $('#moreBtn').addEventListener('click', function () { ui.page += 10; table(); });
  $('#resetBtn').addEventListener('click', function () { if (confirm('Reset all demo orders and stock to the starting data?')) { S = N.reset(); all(); toast('Demo data reset.'); } });
  document.addEventListener('keydown', function (e) {
    var d = $('#dw');
    if (d.hidden) return;
    if (e.key === 'Escape') { closeDw(); return; }
    if (e.key === 'Tab') {
      var f = $$('button,[href],input,select,[tabindex="0"]', $('#dwPn')).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
      if (!f.length) return; var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === $('#dwT'))) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  var chartEl = $('#chart');
  chartEl.addEventListener('mouseover', function (e) { var b = e.target.closest('.bar'); if (b) tip(b, true); });
  chartEl.addEventListener('mouseleave', function () { tip(null, false); });
  chartEl.addEventListener('focusin', function (e) { var b = e.target.closest('.bar'); if (b) tip(b, true); });
  chartEl.addEventListener('focusout', function () { tip(null, false); });
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(chart, 150); });
  addEventListener('storage', function (e) { if (e.key === 'nl-orders-v1') { S = N.load(true); all(); if (ui.open) drawer(); } });

  $('#today').textContent = 'Back office · ' + N.fmtD(Date.now());
  var qs = ''; try { qs = new URLSearchParams(location.search).get('o') || ''; } catch (e) {}
  all(); if (qs && S.orders.some(function (o) { return o.id === qs; })) openDw(qs);
})();
