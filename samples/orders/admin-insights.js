/* Northlane Back Office: home, analytics and audit log (design sample). Sessions, carts and checkouts are simulated; orders are real demo data. */
(function () {
  'use strict';
  var NL = window.NL, A = window.A, $ = A.$, $$ = A.$$, esc = A.esc, money = A.money, ic = A.ic;
  var DAY = NL.DAY;

  /* ───────── metrics ───────── */
  function windowStats(from, to) {
    var D = NL.db(), O = D.orders.filter(function (o) { return o.t >= from && o.t < to && !o.cancelled; }), gross = 0, net = 0, items = 0, ret = 0, rep = 0, seen = {};
    D.orders.slice().sort(function (a, b) { return a.t - b.t; }).forEach(function (o) { if (o.t < from && !o.cancelled) seen[o.email] = 1; });
    O.slice().sort(function (a, b) { return a.t - b.t; }).forEach(function (o) { gross += o.total; net += o.total - NL.refunded(o); items += NL.liveQty(o); ret += o.rets.reduce(function (a, r) { return a + (r.st !== 'rejected' ? r.lines.reduce(function (b, l) { return b + l.q; }, 0) : 0); }, 0); if (seen[o.email]) rep++; seen[o.email] = 1; });
    var s = 0, c = 0, k = 0, d0 = NL.dayStart(); Object.keys(D.traffic).forEach(function (t) { t = +t; if (t >= NL.dayStart(from) && t < to) { var r = D.traffic[t], f = t === d0 ? 1 : Math.max(0, Math.min(1, (to - t) / DAY)); s += r[0] * f; c += r[1] * f; k += r[2] * f; } }); s = Math.round(s); c = Math.round(c); k = Math.round(k);
    return { orders: O, n: O.length, gross: gross, net: net, aov: O.length ? gross / O.length : 0, ses: s, carts: c, chk: k, conv: s ? O.length / s : 0, items: items, ret: ret, rrate: items ? ret / items : 0, rep: O.length ? rep / O.length : 0 };
  }
  function daily(n, end) { var out = [], d0 = NL.dayStart(end || Date.now()); for (var i = n - 1; i >= 0; i--) { var a = d0 - i * DAY; out.push({ t: a, s: 0, n: 0 }); } var D = NL.db();
    D.orders.forEach(function (o) { if (o.cancelled) return; var k = Math.round((NL.dayStart(o.t) - out[0].t) / DAY); if (k >= 0 && k < n) { out[k].s += o.total; out[k].n++; } });
    out.forEach(function (x) { var tr = D.traffic[x.t]; x.ses = tr ? tr[0] : 0; }); return out; }

  /* ───────── chart ───────── */
  function lineChart(el, cur, prev, opt) {
    opt = opt || {}; var w = Math.max(280, el.clientWidth), h = opt.h || 240, pl = 48, pr = 12, pt = 14, pb = 26, iw = w - pl - pr, ih = h - pt - pb;
    var mx = Math.max.apply(null, cur.map(function (d) { return d.s; }).concat(prev ? prev.map(function (d) { return d.s; }) : []).concat([1])), step = Math.pow(10, Math.floor(Math.log10(mx))), top = Math.ceil(mx / step) * step; if (top / step < 3) { step /= 2; top = Math.ceil(mx / step) * step; }
    var X = function (i) { return pl + (cur.length < 2 ? iw / 2 : i / (cur.length - 1) * iw); }, Y = function (v) { return pt + ih - v / top * ih; };
    var path = function (L) { return L.map(function (d, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(d.s).toFixed(1); }).join(''); };
    var g = '', lab = '', ticks = Math.round(top / step); for (var k = 0; k <= ticks; k++) { var v = k * step; g += '<line class="gl" x1="' + pl + '" x2="' + (w - pr) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/>'; lab += '<text class="ax" x="' + (pl - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + (v >= 1e5 ? (v / 1e5).toFixed(v % 1e5 ? 1 : 0) + 'L' : v >= 1000 ? Math.round(v / 1000) + 'k' : v) + '</text>'; }
    var every = Math.ceil(cur.length / (w < 520 ? 4 : 8)); cur.forEach(function (d, i) { var last = i === cur.length - 1; if (last || (i % every === 0 && X(cur.length - 1) - X(i) > 58)) lab += '<text class="ax" x="' + X(i) + '" y="' + (h - 6) + '" text-anchor="' + (last ? 'end' : 'middle') + '">' + NL.fDs(d.t) + '</text>'; });
    el.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" height="' + h + '" role="img" aria-label="' + esc(opt.label || 'Sales by day') + '"><defs><linearGradient id="chg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--acc);stop-opacity:.22"/><stop offset="1" style="stop-color:var(--acc);stop-opacity:0"/></linearGradient></defs>' + g + lab +
      (prev ? '<path class="ln2" d="' + path(prev) + '"/>' : '') + '<path class="ar" d="' + path(cur) + 'L' + X(cur.length - 1) + ' ' + (pt + ih) + 'L' + X(0) + ' ' + (pt + ih) + 'Z"/><path class="ln" d="' + path(cur) + '" id="lnp"/>' +
      '<line class="hl" id="hl" y1="' + pt + '" y2="' + (pt + ih) + '" style="display:none"/><circle class="dot" id="hd" r="4" style="display:none"/><rect x="' + pl + '" y="0" width="' + iw + '" height="' + h + '" fill="transparent" id="hz"/></svg><div class="tip" id="tip" hidden></div>';
    if (!A.reduce) { var ln = $('#lnp', el), L = ln.getTotalLength(); ln.style.strokeDasharray = L; ln.style.strokeDashoffset = L; ln.getBoundingClientRect(); ln.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)'; ln.style.strokeDashoffset = 0; }
    var hz = $('#hz', el), tip = $('#tip', el), hl = $('#hl', el), hd = $('#hd', el);
    function show(e) { var r = el.getBoundingClientRect(), x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left, sx = x * (w / r.width), i = Math.max(0, Math.min(cur.length - 1, Math.round((sx - pl) / iw * (cur.length - 1)))), d = cur[i];
      hl.setAttribute('x1', X(i)); hl.setAttribute('x2', X(i)); hl.style.display = ''; hd.setAttribute('cx', X(i)); hd.setAttribute('cy', Y(d.s)); hd.style.display = '';
      tip.hidden = false; tip.style.left = (X(i) / w * r.width) + 'px'; tip.style.top = (Y(d.s) / h * r.height) + 'px';
      tip.innerHTML = '<b>' + money(d.s) + '</b>' + NL.fD(d.t) + ' · ' + NL.plural(d.n, 'order') + (prev && prev[i] ? '<br><span style="opacity:.7">Previous: ' + money(prev[i].s) + '</span>' : ''); }
    function hide() { tip.hidden = true; hl.style.display = 'none'; hd.style.display = 'none'; }
    hz.addEventListener('mousemove', show); hz.addEventListener('touchstart', show, { passive: true }); hz.addEventListener('touchmove', show, { passive: true }); hz.addEventListener('mouseleave', hide);
  }
  function hbars(rows, fmt) { var mx = Math.max.apply(null, rows.map(function (r) { return r[1]; }).concat([1])); return '<div class="hbars">' + rows.map(function (r, i) { return '<div class="hbar"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(r[0]) + '</span><i><b style="width:' + (r[1] / mx * 100) + '%;animation-delay:' + i * 60 + 'ms"></b></i><span class="num" style="min-width:64px">' + (fmt ? fmt(r[1]) : r[1]) + '</span></div>'; }).join('') + '</div>'; }
  function groupSum(O, key, val) { var m = {}; O.forEach(function (o) { var k = key(o); m[k] = (m[k] || 0) + val(o); }); return Object.keys(m).map(function (k) { return [k, m[k]]; }).sort(function (a, b) { return b[1] - a[1]; }); }

  /* ───────── home: the day's headline, every parcel on the map, then what needs you ───────── */
  var pickup = A.pickup, dur = A.dur;
  function kpi(href, l, v, d) { return '<a class="kpi" href="' + href + '"><span class="l">' + l + '</span><span class="v">' + v + '</span><span class="d">' + d + '</span></a>'; }
  A.page('home', {
    title: 'Home', nav: 'home', skeleton: 'none',
    crumbs: function () { return [['Home', '#/']]; },
    render: function () {
      var D = NL.db(), now = Date.now(), d0 = NL.dayStart(), today = windowStats(d0, now + 1), yday = windowStats(d0 - DAY, now - DAY), pk = pickup(now);
      var unf = D.orders.filter(function (o) { return !o.cancelled && NL.fulfilment(o) !== 'fulfilled' && o.pay.st !== 'pending'; }), oldest = unf.reduce(function (a, o) { return Math.min(a, o.t); }, now);
      var pend = D.orders.filter(function (o) { return o.pay.st === 'pending'; }), cod = D.orders.filter(function (o) { return NL.payStatus(o) === 'cod' && !o.cancelled; });
      var rq = [], rr = []; D.orders.forEach(function (o) { o.rets.forEach(function (r) { if (r.st === 'requested') rq.push(o); if (r.st === 'received') rr.push(o); }); });
      var low = 0, out = 0, waiting = 0; NL.products({ all: true }).forEach(function (p) { NL.variants(p).forEach(function (v) { if (v.state === 'low') low++; if (v.state === 'out') out++; waiting += v.alerts; }); });
      var po = D.po.filter(function (p) { return p.st !== 'received' && p.eta < now + 3 * DAY; }).sort(function (a, b) { return a.eta - b.eta; }), sched = D.disc.filter(function (d) { return NL.discStatus(d) === 'scheduled'; });
      var todo = [];
      if (unf.length) todo.push(['#/bench', 'package', 'acc', NL.plural(unf.length, 'order') + ' to pack' + (pk.today ? ' before 4 pm' : ''), 'Oldest has waited ' + NL.ago(oldest).replace(' ago', '') + ' · ' + money(unf.reduce(function (a, o) { return a + o.total; }, 0)) + ' · open the packing bench']);
      var cw = A.chatWaiting && A.chatWaiting(); if (cw && cw.n) todo.push(['#/chats' + (cw.first ? '/' + cw.first.id : ''), 'chat', 'acc', NL.plural(cw.n, 'customer') + ' waiting in chat', (cw.first && cw.first.user && cw.first.user.name ? cw.first.user.name.split(' ')[0] + ' has waited ' : 'Longest wait ') + Math.max(1, Math.round(cw.longest / 6e4)) + ' min · the concierge handed it over']);
      if (rq.length) todo.push(['#/orders?v=returns', 'return', 'vio', NL.plural(rq.length, 'return') + ' to approve', rq.slice(0, 2).map(function (o) { return o.name.split(' ')[0]; }).join(', ') + (rq.length > 2 ? ' and others' : '') + ' asked to send something back']);
      if (rr.length) todo.push(['#/orders/' + rr[0].id, 'refund', 'vio', NL.plural(rr.length, 'return') + ' received, ready to refund', 'Inspected and back at the studio']);
      if (pend.length) todo.push(['#/orders?pay=pending', 'clock', 'warn', NL.plural(pend.length, 'payment') + ' waiting for UPI approval', pend.map(function (o) { return o.id; }).join(', ')]);
      if (cod.length) todo.push(['#/orders?pay=cod', 'cash', 'info', money(cod.reduce(function (a, o) { return a + o.total; }, 0)) + ' cash on delivery to collect', NL.plural(cod.length, 'order') + ' in the courier’s hands']);
      if (low + out) todo.push(['#/inventory?t=' + (out ? 'out' : 'low'), 'alert', 'warn', (out ? out + ' sold out, ' : '') + low + ' running low', waiting ? NL.plural(waiting, 'customer') + ' waiting for a restock email' : 'Check thresholds in Inventory']);
      po.forEach(function (p) { todo.push(['#/inventory?t=po', 'package', 'info', p.id + ' arrives ' + NL.rel(p.eta).replace(/, .*/, '').toLowerCase(), p.lines.reduce(function (a, l) { return a + l.q; }, 0) + ' units from ' + p.sup.split(',')[0]]); });
      sched.forEach(function (d) { todo.push(['#/discounts?code=' + d.code, 'discounts', 'ok', d.code + ' starts ' + NL.fD(d.starts), NL.discText(d)]); });
      var feed = D.audit.slice(0, 9), spark = daily(14).map(function (d) { return d.s; });
      var wd = new Date(now).toLocaleDateString('en-IN', { weekday: 'long' }), when = pk.today ? 'the 4 pm pickup' : pk.tomorrow ? 'tomorrow’s 4 pm pickup' : pk.day + '’s 4 pm pickup';
      var title = wd + ' · ' + (todo.length ? NL.plural(todo.length, 'thing') + ' before ' + when : 'all clear before ' + when);
      var sub = NL.fD(now) + ' · ' + (pk.today ? '<span class="pk">' + ic('clock') + NL.CARRIER.std.name + ' collects in ' + dur(pk.t - now) + '</span>' : 'Today’s pickup has gone; the next is ' + (pk.tomorrow ? 'tomorrow' : pk.day) + ' at 4 pm') + ' · ' + (unf.length ? NL.plural(unf.length, 'order') + ' to pack' : 'nothing left to pack');
      return '<div class="day"><div><h1>' + esc(title) + '</h1><p>' + sub + '</p></div><div class="ph-a"><button class="b" type="button" data-act="pal">' + ic('search') + 'Jump to… <kbd>' + (A.mac ? '⌘' : 'Ctrl') + ' K</kbd></button><a class="b pri" href="#/bench">' + ic('package') + 'Open the packing bench</a></div></div>' +
        '<section class="cd pm" id="pm" aria-label="Every parcel this week"></section>' +
        '<div class="kpis">' + kpi('#/analytics', 'Sales today', money(today.gross), yday.gross ? A.delta(today.gross, yday.gross) + ' vs this time yesterday' : '<span class="mute">' + (today.gross ? 'nothing by this time yesterday' : 'the first order is still to come') + '</span>') +
        kpi('#/orders', 'Orders', today.n, (yday.n ? A.delta(today.n, yday.n) + ' · ' : '') + '<span class="mute">' + (yday.n ? yday.n : 'none') + ' by now yesterday</span>') +
        kpi('#/analytics', 'Sessions', today.ses.toLocaleString('en-IN'), yday.ses ? A.delta(today.ses, yday.ses) + ' vs yesterday' : '<span class="mute">quiet so far</span>') +
        kpi('#/analytics', 'Conversion', (today.conv * 100).toFixed(2) + '%', yday.conv ? A.delta(today.conv, yday.conv) + ' vs yesterday' : '<span class="mute">' + NL.plural(today.n, 'order') + ' from ' + today.ses.toLocaleString('en-IN') + ' visits</span>') +
        '<a class="kpi" href="#/analytics"><span class="l">Last 14 days</span><span class="v">' + NL.compact(spark.reduce(function (a, b) { return a + b; }, 0)) + '</span>' + A.spark(spark) + '</a></div>' +
        '<div class="hm-g"><div><section class="cd"><div class="cd-h"><h2>Needs your attention</h2><span class="sub">' + todo.length + '</span></div><div class="todo">' +
        (todo.length ? todo.map(function (t) { return '<a href="' + t[0] + '"><span class="ico ' + t[2] + '">' + ic(t[1]) + '</span><span><b>' + t[3] + '</b><small>' + esc(t[4]) + '</small></span><span class="go">' + ic('chev-r') + '</span></a>'; }).join('') : A.empty('check', 'Nothing waiting', 'Every paid order is packed and nothing is running low.', '')) + '</div></section>' +
        '</div>' +
        '<div><section class="cd"><div class="cd-h"><h2>Activity</h2><a class="sub lnk" href="#/audit">Audit log</a></div><div class="feed">' + feed.map(function (e) { return '<div class="fe">' + A.av(e.who) + '<p><b>' + esc(e.who) + '</b> ' + esc(e.a.toLowerCase()) + ' ' + (/^NL-/.test(e.o) ? '<a class="lnk" href="#/orders/' + esc(e.o) + '">' + esc(e.o) + '</a>' : '<b>' + esc(e.o) + '</b>') + '<small class="mute" style="display:block;font-size:12px;margin-top:2px">' + esc(e.d) + '</small></p><time>' + NL.ago(e.t) + '</time></div>'; }).join('') + '</div></section></div></div>' +
        '<section class="cd hm-sales"><div class="cd-h"><h2>Sales, last 30 days</h2><a class="sub lnk" href="#/analytics">Analytics</a></div><div class="cd-b"><div class="chart" id="hch"></div></div></section>';
    },
    mount: function () {
      var host = $('#pm'); if (!A.pm || A.pm.host !== host) { if (A.pm) A.pm.destroy(); A.pm = host && A.parcelMap ? A.parcelMap(host) : null; }
      var el = $('#hch'); if (el) lineChart(el, daily(30), null, { h: innerWidth < 700 ? 200 : 230, label: 'Sales per day, last 30 days' });
    },
    leave: function () { if (A.pm) { A.pm.destroy(); A.pm = null; } },
    acts: { pal: function () { A.palette(); } },
    remote: function () { A.refresh(); }
  });

  /* ───────── analytics ───────── */
  A.page('analytics', {
    title: 'Analytics', nav: 'analytics', skeleton: 'table',
    render: function (r) {
      var n = +A.qs(r, 'r', 30), now = Date.now(), end = NL.dayStart() + DAY, cur = windowStats(end - n * DAY, end), prev = windowStats(end - 2 * n * DAY, end - n * DAY);
      var dc = daily(n), dp = daily(n, end - n * DAY - 1);
      var kp = function (l, v, d, sp, tip) { return '<div class="kpi"><span class="l">' + l + (tip ? ' <span class="tag" style="height:18px;font-size:10.5px">' + tip + '</span>' : '') + '</span><span class="v">' + v + '</span><span class="d">' + d + ' vs previous ' + n + ' days</span>' + (sp ? A.spark(sp) : '') + '</div>'; };
      var top = {}; cur.orders.forEach(function (o) { o.items.forEach(function (it) { var t = top[it.pid] = top[it.pid] || { u: 0, rev: 0, ret: 0 }; var q = it.q - (it.cq || 0); t.u += q; t.rev += q * it.price; }); o.rets.forEach(function (rt) { rt.lines.forEach(function (l) { top[o.items[l.i].pid].ret += l.q; }); }); });
      var TL = Object.keys(top).map(function (k) { return [k, top[k]]; }).sort(function (a, b) { return b[1].rev - a[1].rev; }), trev = TL.reduce(function (a, x) { return a + x[1].rev; }, 0);
      var reasons = {}; cur.orders.forEach(function (o) { o.rets.forEach(function (rt) { rt.lines.forEach(function (l) { reasons[l.reason] = (reasons[l.reason] || 0) + l.q; }); }); });
      var codes = {}; cur.orders.forEach(function (o) { if (o.disc) { var c = codes[o.disc.code] = codes[o.disc.code] || { n: 0, g: 0, rev: 0 }; c.n++; c.g += o.disc.amt || o.shipFee; c.rev += o.total; } });
      var f = [['Sessions', cur.ses], ['Added to bag', cur.carts], ['Reached checkout', cur.chk], ['Paid', cur.n]], fmax = f[0][1] || 1;
      return '<div class="ph"><div><h1>Analytics</h1><p>Orders and revenue from the store. Sessions, carts and checkouts tick up as people browse the storefront.</p></div><div class="ph-a"><div class="seg" role="group" aria-label="Date range">' + [7, 30, 90].map(function (x) { return '<button type="button" data-act="rng" data-r="' + x + '" aria-pressed="' + (n === x) + '">' + x + ' days</button>'; }).join('') + '</div><button class="b" type="button" data-act="csv">' + ic('download') + 'Export</button></div></div>' +
        '<div class="kpis">' + kp('Gross sales', NL.compact(cur.gross), A.delta(cur.gross, prev.gross), dc.map(function (d) { return d.s; })) + kp('Orders', cur.n, A.delta(cur.n, prev.n), dc.map(function (d) { return d.n; })) + kp('Average order', money(Math.round(cur.aov)), A.delta(cur.aov, prev.aov)) +
        kp('Conversion', (cur.conv * 100).toFixed(2) + '%', A.delta(cur.conv, prev.conv)) + kp('Returning customers', Math.round(cur.rep * 100) + '%', A.delta(cur.rep, prev.rep)) + kp('Returns rate', (cur.rrate * 100).toFixed(1) + '%', A.delta(cur.rrate, prev.rrate, true)) + '</div>' +
        '<section class="cd" style="margin-top:16px"><div class="cd-h"><h2>Sales over time</h2><span class="sub row" style="gap:14px"><span><i style="display:inline-block;width:14px;height:2px;background:var(--acc);vertical-align:3px"></i> Last ' + n + ' days · ' + money(cur.gross) + '</span><span><i style="display:inline-block;width:14px;border-top:1.5px dashed var(--line3);vertical-align:3px"></i> Previous · ' + money(prev.gross) + '</span></span></div><div class="cd-b"><div class="chart" id="ach"></div></div></section>' +
        '<div class="gcols" style="margin-top:16px"><section class="cd" style="grid-column:span 2;min-width:0"><div class="cd-h"><h2>Conversion funnel</h2><span class="sub">sessions to orders</span></div><div class="cd-b"><div class="funnel">' +
        f.map(function (x, i) { var hgt = Math.max(6, Math.round(Math.sqrt(x[1] / fmax) * 150)); return '<div class="fn"><div class="bx" style="height:' + hgt + 'px;animation-delay:' + i * 90 + 'ms"></div><b>' + x[1].toLocaleString('en-IN') + '</b><small>' + x[0] + (i ? ' · ' + (x[1] / f[i - 1][1] * 100).toFixed(1) + '%' : '') + '</small>' + (i ? '<span class="drop">−' + ((1 - x[1] / f[i - 1][1]) * 100).toFixed(0) + '% drop-off</span>' : '<span class="drop" style="color:var(--mute)">' + (cur.ses / n).toFixed(0) + ' a day</span>') + '</div>'; }).join('') + '</div></div></section>' +
        '<section class="cd"><div class="cd-h"><h2>Sales by channel</h2></div><div class="cd-b">' + hbars(groupSum(cur.orders, function (o) { return o.ch; }, function (o) { return o.total; }), NL.compact) + '</div></section></div>' +
        '<section class="cd" style="margin-top:16px"><div class="cd-h"><h2>Top products</h2><span class="sub">by revenue, last ' + n + ' days</span></div><div class="tws"><table class="tb stack"><thead><tr><th>Product</th><th class="num">Units</th><th class="num">Revenue</th><th>Share</th><th class="num">Returned</th></tr></thead><tbody>' +
        TL.map(function (x) { var p = NL.product(x[0]), t = x[1], rr = t.u ? t.ret / t.u : 0; return '<tr data-href="#/products/' + x[0] + '"><td data-m="a"><span class="row" style="gap:10px;flex-wrap:nowrap">' + A.thumb(x[0]) + '<b style="font-weight:500">' + esc(p ? p.name : x[0]) + '</b></span></td><td data-m="hide" class="num">' + t.u + '</td><td data-m="r" class="num"><b style="font-weight:600">' + money(t.rev) + '</b></td><td data-m="hide"><span class="bar-s" style="width:120px"><b style="width:' + (t.rev / (trev || 1) * 100) + '%;background:var(--acc)"></b></span></td><td data-m="f" class="num ' + (rr > .12 ? 'c-warn' : 'mute') + '">' + t.ret + ' · ' + (rr * 100).toFixed(0) + '%</td></tr>'; }).join('') + '</tbody></table></div></section>' +
        '<div class="gcols" style="margin-top:16px"><section class="cd"><div class="cd-h"><h2>Top cities</h2></div><div class="cd-b">' + hbars(groupSum(cur.orders, function (o) { return o.addr.city; }, function (o) { return o.total; }).slice(0, 7), NL.compact) + '</div></section>' +
        '<section class="cd"><div class="cd-h"><h2>Payment methods</h2></div><div class="cd-b">' + hbars(groupSum(cur.orders, function (o) { return o.pay.m; }, function () { return 1; }), function (v) { return Math.round(v / (cur.n || 1) * 100) + '%'; }) + '</div></section>' +
        '<section class="cd"><div class="cd-h"><h2>Why things come back</h2><span class="sub">' + NL.plural(cur.ret, 'item') + '</span></div><div class="cd-b">' + (Object.keys(reasons).length ? hbars(Object.keys(reasons).map(function (k) { return [k, reasons[k]]; }).sort(function (a, b) { return b[1] - a[1]; })) : '<p class="mute" style="font-size:12.5px">No returns in this period.</p>') + '</div></section>' +
        '<section class="cd"><div class="cd-h"><h2>Discount codes</h2></div><div class="cd-b">' + (Object.keys(codes).length ? '<table class="vgrid"><thead><tr><th>Code</th><th class="num">Orders</th><th class="num">Given</th><th class="num">Revenue</th></tr></thead><tbody>' + Object.keys(codes).sort(function (a, b) { return codes[b].rev - codes[a].rev; }).map(function (k) { var c = codes[k]; return '<tr><td class="mono">' + esc(k) + '</td><td class="num">' + c.n + '</td><td class="num mute">' + money(c.g) + '</td><td class="num">' + NL.compact(c.rev) + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="mute" style="font-size:12.5px">No codes used in this period.</p>') + '</div></section></div>';
    },
    mount: function (r) { var n = +A.qs(r, 'r', 30), end = NL.dayStart() + DAY, el = $('#ach'); if (el) lineChart(el, daily(n), daily(n, end - n * DAY - 1), { h: 260, label: 'Sales per day compared with the previous period' }); },
    acts: {
      rng: function (b) { A.setQ({ r: b.getAttribute('data-r') === '30' ? '' : b.getAttribute('data-r') }); A.refresh(); },
      csv: function () { var n = +A.qs(A.parse(), 'r', 30), rows = [['Date', 'Orders', 'Gross sales', 'Sessions']]; daily(n).forEach(function (d) { rows.push([new Date(d.t).toISOString().slice(0, 10), d.n, d.s, d.ses]); }); A.csv('northlane-sales-' + n + 'd.csv', rows); }
    },
    remote: function () { A.refresh(); }
  });
  var rt, rw = innerWidth; addEventListener('resize', function () { if (innerWidth === rw) return; rw = innerWidth; clearTimeout(rt); rt = setTimeout(function () { var c = A.cur(); if (c && (c === null || /home|analytics/.test(document.body.getAttribute('data-page'))) && c.mount) c.mount(A.parse()); }, 200); });

  /* ───────── audit log ───────── */
  A.page('audit', {
    title: 'Audit log', nav: 'audit', skeleton: 'table',
    render: function (r) {
      var D = NL.db(), who = A.qs(r, 'who', ''), q = A.qs(r, 'q', ''), people = {};
      D.audit.forEach(function (e) { people[e.who] = (people[e.who] || 0) + 1; });
      var L = D.audit.filter(function (e) { return (!who || e.who === who) && (!q || A.fuzzy(q, e.a + ' ' + e.o + ' ' + e.d + ' ' + e.who) > 0); });
      return '<div class="ph"><div><h1>Audit log</h1><p>Every change, by whom and when.</p></div><div class="ph-a"><button class="b" type="button" data-act="csv">' + ic('download') + 'Export CSV</button></div></div>' +
        '<div class="fbar"><div class="srch">' + ic('search') + '<label class="vh" for="aq">Search the log</label><input class="in" id="aq" data-search data-in="q" type="search" placeholder="Search action, order, SKU" value="' + esc(q) + '" autocomplete="off"></div><label class="vh" for="aw">Person</label><select class="sel" id="aw" data-ch="who" style="width:auto;height:32px;font-size:12.5px"><option value="">Everyone</option>' + Object.keys(people).sort().map(function (p) { return '<option' + (p === who ? ' selected' : '') + '>' + esc(p) + '</option>'; }).join('') + '</select><span class="grow"></span><span class="mute" style="font-size:12.5px">' + NL.plural(L.length, 'event') + '</span></div>' +
        '<div class="tw"><div class="tws"><table class="tb stack"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>On</th><th>Details</th></tr></thead><tbody>' +
        L.slice(0, 250).map(function (e) { var link = /^NL-/.test(e.o) ? '#/orders/' + e.o : /^PO-/.test(e.o) ? '#/inventory?t=po' : /^[A-Z]{3}-[A-Z]{3}-/.test(e.o) ? '#/inventory?q=' + e.o : NL.db().disc.some(function (d) { return d.code === e.o; }) ? '#/discounts?code=' + e.o : '';
          return '<tr' + (link ? ' data-href="' + esc(link) + '"' : ' style="cursor:default"') + '><td data-m="r" class="mute"><span title="' + esc(NL.fDT(e.t)) + '">' + NL.ago(e.t) + '</span></td><td data-m="a"><span class="row" style="gap:8px;flex-wrap:nowrap">' + A.av(e.who) + '<b style="font-weight:500">' + esc(e.who) + '</b></span></td><td data-m="f">' + esc(e.a) + '</td><td data-m="f">' + (link ? '<span class="lnk">' + esc(e.o) + '</span>' : esc(e.o)) + '</td><td data-m="f" class="mute wrap" style="max-width:420px">' + esc(e.d) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        (L.length ? '' : A.empty('audit', 'No events match', 'Try another word or person.', '')) + '</div>';
    },
    acts: {
      q: function (i) { clearTimeout(i._t); i._t = setTimeout(function () { A.setQ({ q: i.value.trim() }); A.refresh(); var n = $('#aq'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 150); },
      who: function (s) { A.setQ({ who: s.value }); A.refresh(); },
      csv: function () { var rows = [['Time', 'Who', 'Action', 'On', 'Details']]; NL.db().audit.forEach(function (e) { rows.push([new Date(e.t).toISOString(), e.who, e.a, e.o, e.d]); }); A.csv('northlane-audit-log.csv', rows); }
    },
    remote: function () { A.refresh(); }
  });
  A.cmd({ label: 'Sales for the last 7 days', icon: 'analytics', keys: 'revenue week report', run: function () { A.go('analytics?r=7'); } });
  A.cmd({ label: 'Export the audit log', icon: 'download', keys: 'history log csv', run: function () { A.go('audit'); } });
})();
