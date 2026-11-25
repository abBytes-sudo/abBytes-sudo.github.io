/* Northlane Back Office: the order journey.
   A clean vector map of India (inline SVG, no tiles, no APIs): the country outline, the cities we ship to, the parcel's route drawn
   from its carrier scans, a parcel marker that travels to where it is now, and scan points that match the timeline beside it.
   The same component renders small on the home card (A.journeyCard) and large on #/journey. Light and dark themes follow the app tokens. */
(function () {
  'use strict';
  var NL = window.NL, A = window.A, $ = A.$, esc = A.esc, ic = A.ic;

  /* India: the official outline, simplified (about 140 points), as [lon, lat], clockwise from the northern tip. */
  var OUT = [[74.55, 37.05], [75.45, 36.95], [76.2, 36.3], [76.9, 36.05], [77.8, 35.6], [79.0, 36.1], [80.3, 35.6], [80.3, 35.0], [80.2, 34.2], [79.5, 33.3], [78.85, 32.55], [78.55, 32.25], [78.75, 31.95], [78.95, 31.15],
    [79.45, 30.95], [80.25, 30.45], [80.95, 30.2], [80.55, 29.65], [80.25, 29.15], [80.05, 28.8], [80.95, 28.45], [81.65, 28.05], [82.55, 27.55], [83.35, 27.35], [84.1, 27.45], [84.65, 27.05], [85.2, 26.8], [86.1, 26.55],
    [87.05, 26.4], [88.05, 26.4], [88.15, 27.1], [88.05, 27.7], [88.55, 28.1], [88.85, 27.85], [88.95, 27.15], [89.85, 26.75], [90.7, 26.75], [91.55, 26.8], [92.1, 26.9], [91.65, 27.75], [92.4, 27.95], [93.2, 28.3],
    [93.95, 28.7], [94.55, 29.2], [95.4, 29.05], [96.15, 29.4], [96.6, 28.95], [97.25, 28.35], [97.4, 27.85], [96.95, 27.4], [96.25, 27.2], [95.7, 26.85], [95.2, 26.6], [95.15, 26.0], [94.9, 25.6], [94.6, 25.1],
    [94.75, 24.5], [94.2, 23.9], [93.6, 24.0], [93.4, 23.7], [93.35, 23.0], [93.15, 22.3], [92.75, 22.0], [92.45, 22.6], [92.3, 23.4], [92.05, 23.95], [91.65, 23.1], [91.5, 22.95], [91.2, 23.55], [91.3, 24.15],
    [91.95, 24.25], [92.25, 24.85], [91.85, 25.15], [90.45, 25.15], [89.85, 25.3], [89.85, 25.95], [89.1, 26.4], [88.4, 26.45], [88.1, 25.85], [88.45, 25.2], [88.85, 25.05], [88.7, 24.25], [88.95, 23.85],
    [88.8, 23.2], [88.95, 22.7], [89.05, 22.05], [89.05, 21.65], [88.25, 21.6], [87.55, 21.62], [86.95, 21.05], [86.55, 20.25], [85.8, 19.75], [85.05, 19.25], [84.45, 18.7], [83.95, 18.25], [83.35, 17.7],
    [82.3, 16.85], [82.3, 16.55], [81.35, 16.3], [80.95, 15.75], [80.1, 15.3], [80.25, 14.2], [80.3, 13.1], [79.95, 12.2], [79.85, 11.25], [79.85, 10.3], [79.25, 10.25], [78.95, 9.45], [78.25, 8.95], [77.55, 8.07],
    [77.05, 8.35], [76.55, 8.95], [76.2, 9.95], [75.8, 11.2], [75.3, 12.1], [74.85, 12.95], [74.55, 14.1], [74.15, 14.85], [73.75, 15.75], [73.35, 16.95], [73.05, 17.95], [72.85, 18.95], [72.8, 19.85],
    [72.75, 20.75], [72.6, 21.35], [72.75, 21.85], [72.45, 22.25], [72.1, 21.55], [71.35, 20.95], [70.55, 20.8], [69.85, 21.35], [69.05, 22.3], [69.6, 22.7], [68.9, 22.9], [68.3, 23.5], [68.2, 23.9], [68.8, 24.2],
    [69.7, 24.2], [70.6, 24.3], [71.05, 24.4], [70.55, 25.1], [70.25, 25.75], [69.55, 26.55], [70.1, 27.25], [70.75, 27.8], [71.85, 28.25], [72.45, 28.85], [73.3, 29.65], [73.95, 30.2], [74.55, 30.95],
    [74.55, 31.55], [74.95, 32.1], [74.6, 32.5], [74.05, 32.85], [73.55, 33.25], [73.45, 34.0], [73.75, 34.35], [73.25, 34.65], [73.5, 35.35], [72.55, 35.85], [72.85, 36.35], [73.75, 36.75]];
  var ISL = [[[92.7, 13.6], [93.05, 12.9], [92.95, 12.0], [92.75, 11.3], [92.55, 10.8], [92.5, 11.8], [92.65, 12.9]], [[93.55, 9.3], [93.75, 8.4], [93.95, 7.2], [93.75, 7.0], [93.5, 8.1], [93.4, 9.0]]];
  var LAK = [[72.6, 11.2], [72.7, 10.6], [73.0, 10.1], [72.2, 11.7], [72.9, 8.3]];
  var FIX = ['New Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Lucknow', 'Guwahati', 'Kochi'];
  function P(lat, lon) { return [(lon - 67.6) * 33, (37.4 - lat) * 36]; }
  function ring(pts) { return pts.map(function (q, i) { var p = P(q[1], q[0]); return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('') + 'Z'; }
  var LAND = ring(OUT) + ISL.map(ring).join(''), GRAT = '';
  (function () { for (var lo = 70; lo <= 95; lo += 5) { var a = P(36, lo), b = P(7, lo); GRAT += 'M' + a[0].toFixed(0) + ' ' + a[1].toFixed(0) + 'V' + b[1].toFixed(0); } for (var la = 10; la <= 35; la += 5) { var c = P(la, 68), d = P(la, 97); GRAT += 'M' + c[0].toFixed(0) + ' ' + c[1].toFixed(0) + 'H' + d[0].toFixed(0); } })();
  function km(a, b) { var R = 6371, dLa = (b.lat - a.lat) * Math.PI / 180, dLo = (b.lon - a.lon) * Math.PI / 180, s = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLo / 2) * Math.sin(dLo / 2); return 2 * R * Math.asin(Math.sqrt(s)); }
  function pathStr(pts) { return pts.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(''); }

  /* the route: unique scan locations, joined by gentle arcs; progress = where the last completed scan happened */
  function route(o, sh) {
    var E = NL.scans(o, sh), W = [];
    E.forEach(function (e, i) { var l = W[W.length - 1]; if (!l || Math.abs(l.lat - e.lat) > .03 || Math.abs(l.lon - e.lon) > .03) W.push({ lat: e.lat, lon: e.lon, place: e.place, ev: [i], done: !!e.done }); else { l.ev.push(i); l.done = l.done || !!e.done; } });
    W.forEach(function (w) { var p = P(w.lat, w.lon); w.x = p[0]; w.y = p[1]; });
    var pts = [[W[0].x, W[0].y]], at = [0], dist = 0;
    for (var k = 1; k < W.length; k++) {
      var a = W[k - 1], b = W[k], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, bend = Math.min(70, len * .14), cx = (a.x + b.x) / 2 - dy / len * bend, cy = (a.y + b.y) / 2 + dx / len * bend;
      for (var s = 1; s <= 18; s++) { var t = s / 18, u = 1 - t; pts.push([u * u * a.x + 2 * u * t * cx + t * t * b.x, u * u * a.y + 2 * u * t * cy + t * t * b.y]); }
      at[k] = pts.length - 1; dist += km(a, b);
    }
    var cum = [0]; for (var i = 1; i < pts.length; i++) cum[i] = cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    var di = -1; E.forEach(function (e, i2) { if (e.done) di = i2; });
    var wi = 0; W.forEach(function (w, k2) { if (di >= 0 && w.ev.indexOf(di) >= 0) wi = k2; });
    var upto = at[wi], tot = cum[cum.length - 1] || 1;
    return { E: E, W: W, pts: pts, done: pts.slice(0, upto + 1), p: cum[upto] / tot, wi: wi, di: di, dist: dist };
  }
  function labelSet(o, R, big) {
    var out = [], boxes = [], fs = big ? 24 : 40;
    function add(n, lat, lon, cls, force) {
      var p = P(lat, lon), w = n.length * fs * .56, x = p[0] + fs * .45, y = p[1] + fs * .35, left = x + w > 990;
      if (left) x = p[0] - fs * .45 - w;
      var bx = { x0: x - 4, x1: x + w + 4, y0: y - fs, y1: y + 4 };
      if (!force && boxes.some(function (b) { return !(bx.x1 < b.x0 || bx.x0 > b.x1 || bx.y1 < b.y0 || bx.y0 > b.y1); })) return;
      boxes.push(bx); out.push('<text class="' + cls + '" x="' + x.toFixed(0) + '" y="' + y.toFixed(0) + '">' + esc(n) + '</text>');
    }
    var org = R.W[0], dst = R.W[R.W.length - 1];
    add('Jaipur', org.lat, org.lon, 'o', true);
    if (o.addr.city !== 'Jaipur') add(o.addr.city, dst.lat, dst.lon, 'd', true);
    if (big) R.W.slice(1, -1).forEach(function (w) { if (w.place && w.place !== 'Jaipur facility') add(w.place, w.lat, w.lon, 'h'); });
    if (big) FIX.forEach(function (c) { var C = NL.CITY[c]; if (C && c !== o.addr.city) add(c, C[3], C[4], ''); });
    return '<g class="im-lab" font-size="' + fs + '">' + out.join('') + '</g>';
  }
  /* A.indiaMap(order, shipment, big) -> inline SVG */
  A.indiaMap = function (o, sh, big) {
    var R = route(o, sh), d = pathStr(R.pts), dd = pathStr(R.done), cur = R.done[R.done.length - 1], move = !A.reduce && R.done.length > 1;
    var cities = Object.keys(NL.CITY).map(function (c) { var C = NL.CITY[c], p = P(C[3], C[4]); return '<circle cx="' + p[0].toFixed(0) + '" cy="' + p[1].toFixed(0) + '" r="' + (big ? 3.5 : 6) + '"/>'; }).join('');
    var lak = LAK.map(function (q) { var p = P(q[1], q[0]); return '<circle cx="' + p[0].toFixed(0) + '" cy="' + p[1].toFixed(0) + '" r="4"/>'; }).join('');
    var wpts = R.W.map(function (w, k) { var r = big ? (k === 0 || k === R.W.length - 1 ? 11 : 8) : 14; return k === 0 ? '<rect class="w on o" x="' + (w.x - r).toFixed(1) + '" y="' + (w.y - r).toFixed(1) + '" width="' + 2 * r + '" height="' + 2 * r + '"/>' : '<circle class="w' + (w.done ? ' on' : '') + (k === R.W.length - 1 ? ' d' : '') + '" cx="' + w.x.toFixed(1) + '" cy="' + w.y.toFixed(1) + '" r="' + r + '"/>'; }).join('');
    var s = big ? 1 : 1.7, parcel = '<g class="im-pcl"' + (move ? '' : ' transform="translate(' + cur[0].toFixed(1) + ' ' + cur[1].toFixed(1) + ')"') + '>' + (move ? '<animateMotion dur="2.4s" begin="0.3s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".35 0 .2 1" path="' + dd + '"/>' : '') +
      '<g transform="scale(' + s + ')"><circle class="im-ring" r="20"/><rect x="-10" y="-10" width="20" height="20" rx="2"/><path d="M-10 -2.5H10M0 -10V10"/></g></g>';
    var label = 'Map of India: ' + o.id + ' from the Jaipur studio to ' + o.addr.city + ', ' + Math.round(R.dist).toLocaleString('en-IN') + ' km by road and rail';
    return '<svg class="imap' + (big ? ' big' : '') + '" viewBox="0 0 1000 1110" role="img" aria-label="' + esc(label) + '">' +
      '<path class="im-grat" d="' + GRAT + '"/><path class="im-land" d="' + LAND + '"/><g class="im-isl">' + lak + '</g><g class="im-city">' + cities + '</g>' +
      '<path class="im-plan" d="' + d + '"/><path class="im-done" pathLength="1" style="--p:' + R.p.toFixed(4) + '" d="' + d + '"/>' +
      '<g class="im-w">' + wpts + '</g>' + labelSet(o, R, big) + parcel + '</svg>';
  };

  function pickOrders() { var D = NL.db(), live = [], done = [];
    D.orders.forEach(function (o) { if (o.cancelled || o.m === 'pickup') return; var s = o.ships.filter(function (x) { return x.awb; }); if (!s.length) return; var st = NL.stage(o); if (st === 'delivered') { if (done.length < 6) done.push(o); } else live.push(o); });
    live.sort(function (a, b) { return (a.addr.city === 'Jaipur') - (b.addr.city === 'Jaipur') || NL.STG.indexOf(NL.stage(b)) - NL.STG.indexOf(NL.stage(a)) || b.t - a.t; }); return { live: live, done: done }; }
  function steps(o, R) {
    var ICON = { packed: 'package', pickup: 'truck', origin: 'inventory', depart: 'truck', hub: 'inventory', hubdep: 'truck', dest: 'pin', out: 'truck', delivered: 'home' };
    var head = '<div class="js done" data-i="-1"><span class="d">' + ic('orders') + '</span><div><b>Order placed</b><span>' + esc(o.name) + ' in ' + esc(o.addr.city) + ' · ' + esc(o.ch) + '</span><time>' + NL.fDT(o.t) + '</time></div></div>';
    return head + R.E.map(function (e, i) { var lbl = { packed: 'Packed', pickup: 'Collected', origin: 'At origin facility', depart: 'Departed Jaipur', hub: 'At sort centre', hubdep: 'Left sort centre', dest: 'At delivery centre', out: 'Out for delivery', delivered: e.done ? 'Delivered' : 'Arriving' }[e.k];
      return '<div class="js' + (e.done ? ' done' : '') + (i === R.di ? ' cur' : '') + '" data-i="' + i + '"><span class="d">' + ic(ICON[e.k] || 'check') + '</span><div><b>' + lbl + ' · ' + esc(e.place) + '</b><span>' + esc(e.msg) + '</span><time>' + (e.done ? NL.fDT(e.t) : 'Expected ' + NL.fDT(e.t)) + '</time></div></div>'; }).join('');
  }
  function shipOf(o, sid) { var S = o.ships.filter(function (s) { return s.awb; }); return S.filter(function (s) { return s.id === sid; })[0] || S.filter(function (s) { return s.stage !== 'delivered'; })[0] || S[S.length - 1]; }

  A.page('journey', {
    title: 'Order journey', nav: 'journey', wide: true,
    crumbs: function (r) { return [['Order journey', '#/journey']].concat(r.id ? [[r.id, '']] : []); },
    docTitle: function (r) { return 'Journey ' + (r.id || ''); },
    render: function (r) {
      var lists = pickOrders(), id = r.id || (lists.live[0] || lists.done[0] || {}).id, o = id && NL.order(id);
      if (!o) return A.empty('journey', 'No parcels on the move', 'Ship an order and its journey appears here, live.', '<a class="b pri" href="#/orders?v=unfulfilled">Fulfil an order</a>');
      var sh = shipOf(o, r.q.get('s'));
      if (!sh || o.m === 'pickup') return '<a class="back" href="#/orders/' + o.id + '">' + ic('arrow-l') + o.id + '</a>' + A.empty('package', o.m === 'pickup' ? o.id + ' was collected at the pop-up' : o.id + ' hasn’t shipped yet', o.m === 'pickup' ? 'No courier journey to show for this one.' : 'Once it’s packed and handed to the carrier, you can follow it here.', o.m === 'pickup' ? '' : '<button class="b pri" type="button" data-act="fulfil">' + ic('truck') + 'Fulfil it now</button>');
      var R = route(o, sh), opts = lists.live.concat(lists.done); if (opts.indexOf(o) < 0) opts.unshift(o);
      var next = { packed: ['shipped', 'Hand to carrier'], shipped: ['out', 'Mark out for delivery'], out: ['delivered', 'Mark delivered'] }[sh.stage], live = sh.stage !== 'delivered', e = R.E[Math.max(0, R.di)];
      return '<div class="ph"><div><h1>' + (o.addr.city === 'Jaipur' ? 'Across Jaipur' : esc(o.addr.city) + ', from Jaipur') + '</h1><p>' + esc(o.id) + ' · ' + esc(o.name) + ' · ' + esc(NL.ORIGIN.name) + ' → ' + esc(o.addr.l2.split(',').pop().trim()) + ', ' + esc(o.addr.city) + '</p></div>' +
        '<div class="ph-a"><label class="vh" for="jsel">Choose an order</label><select class="sel" id="jsel" data-ch="pick">' + opts.map(function (x) { return '<option value="' + x.id + '"' + (x === o ? ' selected' : '') + '>' + x.id + ' · ' + esc(x.addr.city) + ' · ' + NL.STGL[NL.stage(x)] + '</option>'; }).join('') + '</select><button class="b" type="button" data-act="replay">' + ic('reset') + 'Replay</button></div></div>' +
        '<div class="jv"><section class="jv-map" aria-label="Route map"><div class="jv-hd"><span class="st ' + (live ? 'c-acc' : 'c-ok') + '"><i class="lv" aria-hidden="true"></i>' + (live ? 'Live · ' + esc(NL.STGL[NL.stage(o)]) : 'Delivered') + '</span><b>' + esc(e ? e.place : 'Jaipur') + '</b><span class="mute">' + esc(e ? e.msg : '') + '</span></div>' +
        '<div class="jv-cv" id="jcv">' + A.indiaMap(o, sh, true) + '</div>' +
        '<p class="jv-leg"><span><i class="l-done"></i>Travelled</span><span><i class="l-plan"></i>Still to go</span><span><i class="l-o"></i>Jaipur studio</span><span><i class="l-w"></i>Carrier scan</span></p></section>' +
        '<aside class="jv-side" aria-label="Shipment details"><div class="jv-meta"><div><span class="k">Customer</span><b>' + esc(o.name) + '</b></div><div><span class="k">' + (live ? 'Arriving' : 'Delivered') + '</span><b>' + esc(NL.etaText(o)) + '</b></div><div><span class="k">Carrier</span><b>' + esc(sh.carrier) + '</b></div><div><span class="k">AWB</span><b class="mono">' + esc(sh.awb) + '</b></div><div><span class="k">Distance</span><b>' + Math.round(R.dist).toLocaleString('en-IN') + ' km</b></div><div><span class="k">Order</span><b>' + NL.money(o.total) + '</b></div></div>' +
        '<div><p class="k" style="margin:20px 0 12px">Scans</p><div class="jv-steps" id="jsteps">' + steps(o, R) + '</div></div>' +
        '<div class="row"><a class="b sm" href="#/orders/' + o.id + '">' + ic('orders') + 'Open order</a><a class="b sm" href="track.html?o=' + o.id + '&e=' + encodeURIComponent(o.email) + '" target="_blank" rel="noopener">' + ic('ext') + 'Customer view</a>' + (next ? '<button class="b sm pri" type="button" data-act="adv" data-to="' + next[0] + '">' + ic('bolt') + next[1] + '</button>' : '') + '</div></aside></div>';
    },
    keys: { r: function () { replay(); } },
    acts: {
      replay: function () { replay(); },
      pick: function (s) { A.go('journey/' + s.value); },
      fulfil: function () { var o = NL.order(A.parse().id); A.go('orders/' + o.id); setTimeout(function () { if (A.fulfilModal) A.fulfilModal(NL.order(o.id)); }, 400); },
      adv: function (b) { var r = A.parse(), o = NL.order(r.id) || NL.order(($('#jsel') || {}).value), sh = o && shipOf(o, r.q.get('s')), to = b.getAttribute('data-to'); if (!sh) return; NL.advance(o, sh.id, to); A.refresh(); A.toast({ shipped: 'Handed to the carrier', out: 'Out for delivery.', delivered: 'Delivered.' }[to], { icon: 'truck' }); }
    },
    remote: function () { A.refresh(); }
  });
  function replay() { var c = $('#jcv'), r = A.parse(), o = NL.order(r.id) || NL.order(($('#jsel') || {}).value); if (!c || !o) return; c.innerHTML = A.indiaMap(o, shipOf(o, r.q.get('s')), true); }

  /* the home card: the same map, small */
  A.journeyCard = function (o) {
    var sh = o.ships.filter(function (s) { return s.awb && s.stage !== 'delivered'; })[0] || o.ships[o.ships.length - 1]; if (!sh || !sh.awb) return '';
    var E = NL.scans(o, sh), di = -1; E.forEach(function (e, i) { if (e.done) di = i; }); var e = E[Math.max(0, di)];
    return '<a class="livecard" href="#/journey/' + o.id + '"><div class="lc-t"><span class="st c-acc"><i class="lv" aria-hidden="true"></i>' + (NL.stage(o) === 'out' ? 'Out for delivery' : 'In transit') + ' · ' + o.id + '</span><b>' + esc(e.place) + '</b><span class="lc-s">' + esc(o.name) + ' · ' + esc(o.addr.city) + '<br>' + esc(NL.etaText(o)) + '</span><span class="lc-go">Watch the journey ' + ic('arrow-r') + '</span></div><div class="lc-m">' + A.indiaMap(o, sh, false) + '</div></a>';
  };
  A.cmd({ label: 'Watch a live delivery', icon: 'journey', keys: 'map tracking journey courier', run: function () { A.go('journey'); } });
})();
