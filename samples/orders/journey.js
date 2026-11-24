/* Northlane Back Office: the live order journey (signature moment, design sample).
   A night map of India drawn only from city lights (real coordinates, no borders), a camera that follows the parcel
   from the Jaipur studio through the carrier hub to the customer's street, and a timeline that ticks in sync. */
(function () {
  'use strict';
  var NL = window.NL, A = window.A, $ = A.$, $$ = A.$$, esc = A.esc, ic = A.ic;
  var KX = 9.3, KY = 10;
  function P(lat, lon) { return { x: (lon - 68) * KX, y: (37 - lat) * KY }; }
  // [name, lat, lon, weight 1-5, label at wide zoom]
  var LIGHTS = [['New Delhi', 28.61, 77.21, 5, 1], ['Mumbai', 19.08, 72.88, 5, 1], ['Kolkata', 22.57, 88.36, 5, 1], ['Chennai', 13.08, 80.27, 5, 1], ['Bengaluru', 12.97, 77.59, 5, 1], ['Hyderabad', 17.39, 78.49, 5, 1], ['Ahmedabad', 23.02, 72.57, 4, 1], ['Pune', 18.52, 73.86, 4, 0], ['Jaipur', 26.91, 75.79, 4, 1], ['Lucknow', 26.85, 80.95, 4, 1], ['Kanpur', 26.45, 80.33, 3, 0], ['Nagpur', 21.15, 79.09, 3, 1], ['Indore', 22.72, 75.86, 3, 0], ['Bhopal', 23.26, 77.41, 3, 1], ['Patna', 25.59, 85.14, 3, 1], ['Surat', 21.17, 72.83, 4, 0], ['Vadodara', 22.31, 73.18, 3, 0], ['Ludhiana', 30.9, 75.86, 3, 0], ['Agra', 27.18, 78.01, 3, 0], ['Varanasi', 25.32, 82.97, 3, 0], ['Kochi', 9.93, 76.27, 3, 1], ['Coimbatore', 11.02, 76.96, 3, 0], ['Madurai', 9.93, 78.12, 3, 0], ['Visakhapatnam', 17.69, 83.22, 3, 0], ['Vijayawada', 16.51, 80.65, 3, 0], ['Guwahati', 26.14, 91.74, 3, 1], ['Bhubaneswar', 20.3, 85.82, 3, 1], ['Chandigarh', 30.73, 76.78, 3, 1], ['Srinagar', 34.08, 74.8, 2, 1], ['Jammu', 32.73, 74.86, 2, 0], ['Amritsar', 31.63, 74.87, 2, 0], ['Dehradun', 30.32, 78.03, 2, 0], ['Gurugram', 28.46, 77.03, 4, 0], ['Noida', 28.54, 77.39, 4, 0], ['Meerut', 28.98, 77.71, 2, 0], ['Ranchi', 23.34, 85.31, 2, 0], ['Raipur', 21.25, 81.63, 2, 0], ['Jodhpur', 26.24, 73.02, 2, 0], ['Udaipur', 24.58, 73.71, 2, 0], ['Kota', 25.21, 75.86, 2, 0], ['Ajmer', 26.45, 74.64, 2, 0], ['Bikaner', 28.02, 73.31, 1, 0], ['Jaisalmer', 26.92, 70.91, 1, 0], ['Barmer', 25.75, 71.39, 1, 0], ['Rajkot', 22.3, 70.8, 2, 0], ['Jamnagar', 22.47, 70.06, 2, 0], ['Bhavnagar', 21.76, 72.15, 1, 0], ['Bhuj', 23.24, 69.67, 1, 0], ['Porbandar', 21.64, 69.61, 1, 0], ['Dwarka', 22.24, 68.97, 1, 0], ['Nashik', 20.0, 73.79, 2, 0], ['Aurangabad', 19.88, 75.34, 2, 0], ['Solapur', 17.66, 75.91, 2, 0], ['Kolhapur', 16.7, 74.24, 2, 0], ['Panaji', 15.49, 73.83, 2, 0], ['Belagavi', 15.85, 74.5, 1, 0], ['Hubballi', 15.36, 75.12, 2, 0], ['Mangaluru', 12.91, 74.86, 2, 0], ['Udupi', 13.34, 74.74, 1, 0], ['Mysuru', 12.3, 76.64, 2, 0], ['Shivamogga', 13.93, 75.57, 1, 0], ['Davangere', 14.46, 75.92, 1, 0], ['Kozhikode', 11.26, 75.78, 2, 0], ['Kannur', 11.87, 75.37, 1, 0], ['Thrissur', 10.53, 76.21, 2, 0], ['Kollam', 8.89, 76.61, 1, 0], ['Thiruvananthapuram', 8.52, 76.94, 2, 0], ['Kanyakumari', 8.09, 77.54, 1, 0], ['Tirunelveli', 8.71, 77.76, 1, 0], ['Salem', 11.66, 78.15, 2, 0], ['Tiruchirappalli', 10.79, 78.7, 2, 0], ['Vellore', 12.92, 79.13, 1, 0], ['Puducherry', 11.94, 79.81, 1, 0], ['Nellore', 14.44, 79.99, 1, 0], ['Tirupati', 13.63, 79.42, 1, 0], ['Kurnool', 15.83, 78.04, 1, 0], ['Warangal', 17.97, 79.59, 1, 0], ['Jabalpur', 23.18, 79.99, 2, 0], ['Gwalior', 26.22, 78.18, 2, 0], ['Bareilly', 28.37, 79.43, 1, 0], ['Gorakhpur', 26.76, 83.37, 1, 0], ['Prayagraj', 25.44, 81.85, 2, 0], ['Dhanbad', 23.8, 86.43, 1, 0], ['Jamshedpur', 22.8, 86.2, 2, 0], ['Cuttack', 20.46, 85.88, 1, 0], ['Rourkela', 22.26, 84.85, 1, 0], ['Durgapur', 23.52, 87.31, 1, 0], ['Siliguri', 26.73, 88.4, 1, 0], ['Gangtok', 27.33, 88.61, 1, 0], ['Shillong', 25.58, 91.89, 1, 0], ['Silchar', 24.83, 92.78, 1, 0], ['Agartala', 23.83, 91.29, 1, 0], ['Aizawl', 23.73, 92.72, 1, 0], ['Imphal', 24.82, 93.94, 1, 0], ['Kohima', 25.67, 94.11, 1, 0], ['Dibrugarh', 27.47, 94.91, 1, 0], ['Itanagar', 27.08, 93.61, 1, 0], ['Shimla', 31.1, 77.17, 1, 0], ['Haridwar', 29.95, 78.16, 1, 0], ['Panipat', 29.39, 76.96, 1, 0], ['Jalandhar', 31.33, 75.58, 1, 0], ['Bathinda', 30.21, 74.95, 1, 0], ['Leh', 34.15, 77.58, 1, 0], ['Bilaspur', 22.08, 82.14, 1, 0], ['Satna', 24.6, 80.83, 1, 0], ['Jhansi', 25.45, 78.57, 1, 0], ['Muzaffarpur', 26.12, 85.39, 1, 0], ['Bhagalpur', 25.24, 86.98, 1, 0], ['Asansol', 23.68, 86.98, 1, 0], ['Sambalpur', 21.47, 83.97, 1, 0], ['Berhampur', 19.31, 84.79, 1, 0], ['Rajahmundry', 17.0, 81.8, 1, 0], ['Guntur', 16.31, 80.44, 1, 0], ['Anantapur', 14.68, 77.6, 1, 0], ['Bellary', 15.14, 76.92, 1, 0], ['Gulbarga', 17.33, 76.83, 1, 0], ['Latur', 18.4, 76.56, 1, 0], ['Akola', 20.7, 77.0, 1, 0], ['Amravati', 20.93, 77.75, 1, 0], ['Ujjain', 23.18, 75.78, 1, 0], ['Ratlam', 23.33, 75.04, 1, 0], ['Sagar', 23.84, 78.74, 1, 0], ['Alwar', 27.55, 76.6, 1, 0], ['Bhilwara', 25.35, 74.63, 1, 0], ['Sikar', 27.61, 75.14, 1, 0], ['Hisar', 29.15, 75.72, 1, 0], ['Rohtak', 28.9, 76.61, 1, 0], ['Moradabad', 28.84, 78.77, 1, 0], ['Aligarh', 27.88, 78.08, 1, 0], ['Mathura', 27.49, 77.67, 1, 0], ['Port Blair', 11.62, 92.73, 1, 0]];
  var BASE = null, DOTS = null, SPR = null; // static layers, computed once
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gauss(r) { return (r() + r() + r() - 1.5) / 1.5; }
  function dot(x, y, rr) { return 'M' + (x - rr).toFixed(2) + ' ' + y.toFixed(2) + 'a' + rr + ' ' + rr + ' 0 1 0 ' + (2 * rr) + ' 0a' + rr + ' ' + rr + ' 0 1 0 ' + (-2 * rr) + ' 0'; }
  // DOTS: [x, y, size 0..1, tone 0..3] in map units; drawn on a canvas so lights stay pin-sharp at every zoom
  function base() {
    if (BASE) return BASE; var r = rng(1947), D = [], net = '', grat = '', labs = '';
    var pts = LIGHTS.map(function (c) { var p = P(c[1], c[2]); return { n: c[0], x: p.x, y: p.y, w: c[3], lab: c[4] }; });
    pts.forEach(function (c) { var n = 4 + c.w * c.w * 9, sg = .25 + c.w * .38;
      D.push([c.x, c.y, c.w / 5, 3]);
      for (var i = 0; i < n; i++) { var rad = Math.abs(gauss(r)) * sg * (1 + r() * 1.4), th = r() * 6.283, k = r(); D.push([c.x + Math.cos(th) * rad, c.y + Math.sin(th) * rad, r(), rad < sg * .6 ? (k < .5 ? 2 : 1) : (k < .3 ? 1 : 0)]); } });
    // countryside: faint scatter along the roads between nearby towns, so the subcontinent reads as one lit landmass
    pts.forEach(function (a, i) { var near = pts.map(function (b, j) { return { b: b, d: i === j ? 1e9 : Math.hypot(a.x - b.x, a.y - b.y) }; }).sort(function (p, q) { return p.d - q.d; }).slice(0, 3);
      near.forEach(function (nb) { if (nb.d > 44) return; var b = nb.b; if (a.n < b.n) net += 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + 'L' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
        var m = Math.round(nb.d / 2.4); for (var k = 0; k < m; k++) { var t = r(); D.push([a.x + (b.x - a.x) * t + gauss(r) * 3.4, a.y + (b.y - a.y) * t + gauss(r) * 3.4, r() * .5, r() < .08 ? 1 : 0]); } }); });
    for (var lo = 70; lo <= 95; lo += 5) { var a1 = P(36, lo), b1 = P(7, lo); grat += 'M' + a1.x + ' ' + a1.y + 'L' + b1.x + ' ' + b1.y; }
    for (var la = 10; la <= 35; la += 5) { var a2 = P(la, 67), b2 = P(la, 98); grat += 'M' + a2.x + ' ' + a2.y + 'L' + b2.x + ' ' + b2.y; labs += '<text class="gl" x="' + (P(la, 67.4).x) + '" y="' + (a2.y - 1) + '">' + la + '°N</text>'; }
    pts.forEach(function (c) { if (c.lab) labs += '<text class="cl" x="' + (c.x + 1.4) + '" y="' + (c.y - 1.2) + '">' + esc(c.n) + '</text>'; });
    DOTS = D; BASE = '<path class="jg-grat" d="' + grat + '"/>' + '<path class="jg-net" d="' + net + '"/>' + '<g class="jg-labs">' + labs + '</g>';
    return BASE;
  }
  function lightsSVG() { base(); var L = [[], [], [], []]; DOTS.forEach(function (d) { L[d[3]].push(dot(d[0], d[1], d[3] === 3 ? .5 + d[2] * .4 : .14 + d[2] * .2)); });
    return '<path d="' + L[0].join('') + '" fill="#E7B98F" opacity=".3"/><path d="' + L[1].join('') + '" fill="#F0C79E" opacity=".5"/><path d="' + L[2].join('') + '" fill="#FFE2BF" opacity=".75"/><path d="' + L[3].join('') + '" fill="#FFF3E2"/>'; }
  function sprites() { if (SPR) return SPR; SPR = [['231,185,143', .9], ['240,199,158', 1], ['255,226,191', 1], ['255,243,226', 1]].map(function (c) { var cv = document.createElement('canvas'); cv.width = cv.height = 64; var g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(' + c[0] + ',1)'); gr.addColorStop(.12, 'rgba(' + c[0] + ',.72)'); gr.addColorStop(.34, 'rgba(' + c[0] + ',.2)'); gr.addColorStop(1, 'rgba(' + c[0] + ',0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return cv; }); return SPR; }
  var TONE_A = [.3, .5, .72, .86];
  function drawLights(cv, c, vw, vh, pw, ph, fade) {
    var dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(pw * dpr), H = Math.round(ph * dpr); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var g = cv.getContext('2d'), S = sprites(), x0 = c.x - vw / 2, y0 = c.y - vh / 2, k = W / vw, zf = Math.max(1, Math.min(1.9, Math.pow(300 / vw, .28))), m = 12 * dpr;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); if (fade <= .01) return; g.globalCompositeOperation = 'lighter';
    for (var i = 0; i < DOTS.length; i++) { var d = DOTS[i], sx = (d[0] - x0) * k, sy = (d[1] - y0) * k; if (sx < -m || sy < -m || sx > W + m || sy > H + m) continue;
      var R = (d[3] === 3 ? 1.2 + d[2] * d[2] * 5.5 : .9 + d[2] * 1.3 + d[3] * .45) * zf * dpr * 1.7; g.globalAlpha = TONE_A[d[3]] * fade; g.drawImage(S[d[3]], sx - R, sy - R, R * 2, R * 2); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  /* ───────── route model ───────── */
  function km(a, b) { var R = 6371, dLa = (b.lat - a.lat) * Math.PI / 180, dLo = (b.lon - a.lon) * Math.PI / 180, s = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLo / 2) * Math.sin(dLo / 2); return 2 * R * Math.asin(Math.sqrt(s)); }
  function model(o, sh) {
    var E = NL.scans(o, sh), g = NL.geo(o.addr.city) || { lat: E[E.length - 1].lat, lon: E[E.length - 1].lon }, local = o.addr.city === 'Jaipur';
    // waypoints: distinct consecutive places
    var W = [], evW = [];
    E.forEach(function (e) { var last = W[W.length - 1]; if (!last || Math.abs(last.lat - e.lat) > .001 || Math.abs(last.lon - e.lon) > .001) W.push({ lat: e.lat, lon: e.lon, place: e.place }); evW.push(W.length - 1); });
    W.forEach(function (w) { var p = P(w.lat, w.lon); w.x = p.x; w.y = p.y; });
    // polyline: arcs between long-haul waypoints, a street route for the last mile
    var pts = [], cum = [], segStart = [], lastMile = W.length - 2;
    for (var k = 0; k < W.length - 1; k++) {
      var a = W[k], b = W[k + 1]; segStart.push(pts.length);
      if (k === lastMile) { var dx = b.x - a.x, dy = b.y - a.y, m = [[a.x, a.y], [a.x, a.y + dy * .42], [a.x + dx * .55, a.y + dy * .42], [a.x + dx * .55, b.y - dy * .12], [b.x, b.y - dy * .12], [b.x, b.y]];
        for (var q = 0; q < m.length - 1; q++) for (var s = 0; s < 10; s++) { var t = s / 10; pts.push([m[q][0] + (m[q + 1][0] - m[q][0]) * t, m[q][1] + (m[q + 1][1] - m[q][1]) * t]); } }
      else { var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, d = Math.hypot(b.x - a.x, b.y - a.y), cx = mx + (-(b.y - a.y) / (d || 1)) * d * .18, cy = my + ((b.x - a.x) / (d || 1)) * d * .18;
        for (var i = 0; i < 48; i++) { var u = i / 48; pts.push([(1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * cx + u * u * b.x, (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * cy + u * u * b.y]); } }
    }
    pts.push([W[W.length - 1].x, W[W.length - 1].y]); segStart.push(pts.length - 1);
    var tot = 0; cum.push(0); for (var j = 1; j < pts.length; j++) { tot += Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]); cum.push(tot); }
    var wLen = W.map(function (_, k2) { return cum[segStart[k2]]; });
    // story: each event gets a moment; travel time grows with distance, dwell time at each stop
    var ts = [], t = 2.2, prevW = 0;
    E.forEach(function (e, i) { var w = evW[i]; if (i > 0) { if (w !== prevW) { var dd = wLen[w] - wLen[prevW]; t += w === W.length - 1 && W.length > 1 ? 3.0 : Math.max(1.3, Math.min(3.6, dd / 26)); } else t += .85; } ts.push(t); prevW = w; });
    var T = t + 3.4, now = Date.now(), di = -1; E.forEach(function (e, i) { if (e.done) di = i; });
    var tEnd, frac = 0;
    if (di === E.length - 1) tEnd = T;
    else if (di < 0) tEnd = 1.6;
    else { var nx = di + 1, span = E[nx].t - E[di].t; frac = span > 0 ? Math.max(0, Math.min(.9, (now - E[di].t) / span)) : 0; if (NL.STG.indexOf(sh.stage) < 2) frac = 0; tEnd = ts[di] + frac * (ts[nx] - ts[di]); }
    var dist = 0; for (var z = 1; z < W.length; z++) dist += km(W[z - 1], W[z]) * (z === W.length - 1 ? 1.35 : 1.12);
    var xs = W.map(function (w) { return w.x; }), ys = W.map(function (w) { return w.y; }), bb = { x0: Math.min.apply(null, xs), x1: Math.max.apply(null, xs), y0: Math.min.apply(null, ys), y1: Math.max.apply(null, ys) };
    return { o: o, sh: sh, E: E, W: W, evW: evW, pts: pts, cum: cum, tot: tot, wLen: wLen, ts: ts, T: T, tEnd: tEnd, di: di, local: local, dist: dist, bb: bb, dest: W[W.length - 1], origin: W[0], start: E[0].t };
  }
  function lenAt(M, t) { // distance along the route at story time t
    var E = M.E, ts = M.ts; if (t <= ts[0]) return 0; if (t >= ts[ts.length - 1]) return M.tot;
    for (var i = 1; i < ts.length; i++) if (t < ts[i]) { var a = M.wLen[M.evW[i - 1]], b = M.wLen[M.evW[i]], k = (t - ts[i - 1]) / (ts[i] - ts[i - 1]); k = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; return a + (b - a) * k; }
    return M.tot;
  }
  function ptAt(M, L) { var c = M.cum, lo = 0, hi = c.length - 1; while (lo < hi - 1) { var mid = (lo + hi) >> 1; if (c[mid] < L) lo = mid; else hi = mid; } var seg = c[hi] - c[lo] || 1, k = (L - c[lo]) / seg, a = M.pts[lo], b = M.pts[hi]; return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) }; }
  function clockAt(M, t) { var ts = M.ts, E = M.E; if (t <= ts[0]) return M.o.t + (E[0].t - M.o.t) * Math.max(0, t / ts[0]); for (var i = 1; i < ts.length; i++) if (t < ts[i]) return E[i - 1].t + (E[i].t - E[i - 1].t) * (t - ts[i - 1]) / (ts[i] - ts[i - 1]); return E[E.length - 1].t; }
  function evIndex(M, t) { var k = -1; M.ts.forEach(function (x, i) { if (t >= x - .001) k = i; }); return k; }
  function camAt(M, t, pxw) { // where the camera wants to be at story time t
    var bb = M.bb, rw = Math.max(bb.x1 - bb.x0, (bb.y1 - bb.y0) * 1.3), wide = { x: (bb.x0 + bb.x1) / 2, y: (bb.y0 + bb.y1) / 2, w: Math.max(70, Math.min(300, rw * 1.75)) };
    var ts = M.ts, k = evIndex(M, t), L = lenAt(M, t), p = ptAt(M, L), lastW = M.W.length - 1;
    if (t < ts[0] - .35) return t < .9 ? { x: 132, y: 150, w: 300 } : wide;
    if (t > ts[ts.length - 1] + 1.4) return wide;
    var w0 = M.evW[Math.max(0, k)], w1 = M.evW[Math.min(ts.length - 1, k + 1)], moving = k >= 0 && k < ts.length - 1 && w0 !== w1;
    if (moving && w1 === lastW) return { x: p.x, y: p.y, w: M.local ? 3.6 : 4.2 };
    if (moving) { var a = M.W[w0], b = M.W[w1], d = Math.hypot(b.x - a.x, b.y - a.y); return { x: p.x * .55 + (a.x + b.x) / 2 * .45, y: p.y * .55 + (a.y + b.y) / 2 * .45, w: Math.max(36, Math.min(240, d * 1.9)) }; }
    if (w0 === lastW) return { x: p.x, y: p.y, w: 3.2 };
    if (w0 === lastW - 1) return { x: p.x, y: p.y, w: M.local ? 6 : 9 };
    return { x: p.x, y: p.y, w: w0 === 0 ? 22 : 30 };
  }

  /* ───────── view ───────── */
  var J = null; // live state
  function pickOrders() { var D = NL.db(), live = [], done = [];
    D.orders.forEach(function (o) { if (o.cancelled || o.m === 'pickup') return; var s = o.ships.filter(function (x) { return x.awb; }); if (!s.length) return; var st = NL.stage(o); if (st === 'delivered') { if (done.length < 12) done.push(o); } else live.push(o); });
    live.sort(function (a, b) { return NL.STG.indexOf(NL.stage(b)) - NL.STG.indexOf(NL.stage(a)) || b.t - a.t; }); return { live: live, done: done }; }
  function streets(M) { if (!M) return ''; var d = M.dest, a = M.W[M.W.length - 2] || d, s = .13, g = '', x0 = Math.min(a.x, d.x) - 1.6, x1 = Math.max(a.x, d.x) + 1.6, y0 = Math.min(a.y, d.y) - 1.3, y1 = Math.max(a.y, d.y) + 1.3, r = rng(M.o.num);
    var dx = d.x - a.x, dy = d.y - a.y, xs = [a.x, a.x + dx * .55, d.x], ys = [a.y + dy * .42, d.y - dy * .12, a.y, d.y];
    for (var x = x0; x < x1; x += s * (0.8 + r() * .7)) xs.push(x); for (var y = y0; y < y1; y += s * (0.8 + r() * .7)) ys.push(y);
    xs.forEach(function (x) { g += 'M' + x.toFixed(3) + ' ' + y0.toFixed(3) + 'V' + y1.toFixed(3); }); ys.forEach(function (y) { g += 'M' + x0.toFixed(3) + ' ' + y.toFixed(3) + 'H' + x1.toFixed(3); });
    var blocks = ''; for (var i = 0; i < 70; i++) { var bx = x0 + r() * (x1 - x0), by = y0 + r() * (y1 - y0); blocks += '<rect x="' + bx.toFixed(3) + '" y="' + by.toFixed(3) + '" width="' + (.03 + r() * .06).toFixed(3) + '" height="' + (.03 + r() * .05).toFixed(3) + '" rx=".006"/>'; }
    return '<path d="' + g + '"/><g class="jg-blk">' + blocks + '</g>'; }
  function svgFor(M) {
    var W = M.W, d = M.pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join('');
    var wp = W.map(function (w, i) { var isO = i === 0, isD = i === W.length - 1; return '<g class="jw' + (isO ? ' o' : isD ? ' d' : '') + '" data-w="' + i + '" transform="translate(' + w.x + ' ' + w.y + ')"><g class="sc"><circle class="ring" r="9"/><circle class="core" r="' + (isO || isD ? 4.6 : 3.6) + '"/>' + (isD ? '<path class="home" d="M-2.6 .6L0-2.2l2.6 2.8M-1.8-.2v2.6h3.6v-2.6"/>' : isO ? '<path class="home" d="M-2 -1h4v3h-4zM-1 -1v-1h2v1"/>' : '') + '<text' + (isO || isD ? ' class="big"' : '') + ' x="9" y="-7">' + esc(isO ? 'Northlane studio' : isD ? M.o.addr.l2.split(',').pop().trim() + ', ' + M.o.addr.city : w.place) + '</text></g></g>'; }).join('');
    return '<canvas id="jcv" aria-hidden="true"></canvas><svg id="jsvg" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Map of the parcel’s route from the Northlane studio in Jaipur to ' + esc(M.o.addr.city) + '"><defs><radialGradient id="jstg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><mask id="jstm" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#jstg)"/></mask></defs>' +
      '<g id="jbase">' + base() + '</g><g id="jst" opacity="0" mask="url(#jstm)">' + streets(M) + '</g>' +
      '<path id="jping" class="jr-ping" d=""/>' +
      '<path id="jplan" class="jr-plan" d="' + d + '"/><path class="jr-glow" id="jglow" d="' + d + '"/><path class="jr-prog" id="jprog" d="' + d + '"/>' + wp +
      '<g id="jpar"><g class="sc"><circle class="pulse" r="10"/><circle class="halo" r="7"/><circle class="body" r="4.4"/><path class="box" d="M-2 -1.2l2 -1 2 1v2.4l-2 1 -2 -1zM-2 -1.2l2 1 2 -1M0 -.2v2.4"/></g></g></svg>';
  }
  function steps(M) {
    var ICON = { packed: 'package', pickup: 'truck', origin: 'inventory', depart: 'truck', hub: 'inventory', hubdep: 'truck', dest: 'pin', out: 'truck', delivered: 'home' };
    var head = '<div class="js done" data-i="-1"><span class="d">' + ic('orders') + '</span><div><b>Order placed</b><span>' + esc(M.o.name) + ' in ' + esc(M.o.addr.city) + ' · ' + esc(M.o.ch) + '</span><time>' + NL.fDT(M.o.t) + '</time></div></div>';
    return head + M.E.map(function (e, i) { var lbl = { packed: 'Packed', pickup: 'Collected', origin: 'At origin facility', depart: 'Departed Jaipur', hub: 'At sort centre', hubdep: 'Left sort centre', dest: 'At delivery centre', out: 'Out for delivery', delivered: e.done ? 'Delivered' : 'Arriving' }[e.k];
      return '<div class="js" data-i="' + i + '"><span class="d">' + ic(ICON[e.k] || 'check') + '</span><div><b>' + lbl + ' · ' + esc(e.place) + '</b><span>' + esc(e.msg) + '</span><time>' + (e.done ? NL.fDT(e.t) : 'Expected ' + NL.fDT(e.t)) + '</time></div></div>'; }).join('');
  }
  A.page('journey', {
    title: 'Order journey', nav: 'journey', flush: true, skeleton: 'none',
    crumbs: function (r) { return [['Order journey', '#/journey']].concat(r.id ? [[r.id, '']] : []); },
    docTitle: function (r) { return 'Journey ' + (r.id || ''); },
    render: function (r) {
      var lists = pickOrders(), id = r.id || (lists.live[0] || lists.done[0] || {}).id, o = id && NL.order(id);
      if (!o) return '<div class="view">' + A.empty('journey', 'No parcels on the move', 'Ship an order and its journey appears here, live.', '<a class="b pri" href="#/orders?v=unfulfilled">Fulfil an order</a>') + '</div>';
      var S = o.ships.filter(function (s) { return s.awb; }), sh = S.filter(function (s) { return s.id === r.q.get('s'); })[0] || S.filter(function (s) { return s.stage !== 'delivered'; })[0] || S[S.length - 1];
      if (!sh || o.m === 'pickup') return '<div class="view"><a class="back" href="#/orders/' + o.id + '">' + ic('arrow-l') + o.id + '</a>' + A.empty('package', o.m === 'pickup' ? o.id + ' was collected at the pop-up' : o.id + ' hasn’t shipped yet', o.m === 'pickup' ? 'No courier journey to show for this one.' : 'Once it’s packed and handed to the carrier, you can follow it here in real time.', o.m === 'pickup' ? '' : '<button class="b pri" type="button" data-act="fulfil">' + ic('truck') + 'Fulfil it now</button>') + '</div>';
      var M = model(o, sh), st = NL.stage(o), opts = lists.live.concat(lists.done); if (opts.indexOf(o) < 0) opts.unshift(o);
      J = { M: M, t: 0, playing: false, speed: 1, cam: null, raf: 0, last: 0, follow: true, ended: false };
      var next = { packed: ['shipped', 'Hand to carrier'], shipped: ['out', 'Simulate: out for delivery'], out: ['delivered', 'Simulate: delivered'] }[sh.stage];
      return '<div class="jv"><div class="jv-map" id="jmap">' + svgFor(M) + '<div class="jv-vig" aria-hidden="true"></div>' +
        '<div class="jv-hd"><div><small><i></i><span id="jkick">' + (sh.stage === 'delivered' ? 'Delivered · replay' : 'Live journey') + ' · ' + o.id + '</span></small><h1 id="jh"><em>' + esc(o.addr.city) + '</em>, here it comes.</h1><p id="jp">' + esc(NL.ORIGIN.name) + ' → ' + esc(o.addr.l2.split(',').pop().trim()) + ', ' + esc(o.addr.city) + '</p></div>' +
        '<div class="jv-sel"><label class="vh" for="jsel">Choose an order</label><select class="sel" id="jsel" data-ch="pick">' + opts.map(function (x) { return '<option value="' + x.id + '"' + (x === o ? ' selected' : '') + '>' + x.id + ' · ' + esc(x.addr.city) + ' · ' + NL.STGL[NL.stage(x)] + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="jv-ctl" role="group" aria-label="Playback"><button type="button" class="pp" data-act="play" id="jplay" aria-label="Play">' + ic('play') + '</button><button type="button" data-act="replay" class="hide-s" aria-label="Replay from the start">' + ic('reset') + '</button>' +
        '<label class="vh" for="jscrub">Scrub the journey</label><input type="range" id="jscrub" min="0" max="1000" value="0" step="1" data-in="scrub"><output id="jclock" for="jscrub">—</output><button type="button" data-act="speed" id="jspd" title="Playback speed">1×</button><button type="button" data-act="live" id="jlive" class="hide-s" aria-pressed="false">' + (sh.stage === 'delivered' ? 'End' : 'Now') + '</button></div></div>' +
        '<aside class="jv-side" aria-label="Shipment details"><div class="jv-meta"><div><span class="k">Customer</span><b>' + esc(o.name) + '</b></div><div><span class="k">' + (sh.stage === 'delivered' ? 'Delivered' : 'Arriving') + '</span><b>' + esc(NL.etaText(o)) + '</b></div><div><span class="k">Carrier</span><b>' + esc(sh.carrier) + '</b></div><div><span class="k">AWB</span><b class="mono">' + esc(sh.awb) + '</b></div><div><span class="k">Distance</span><b>' + Math.round(M.dist).toLocaleString('en-IN') + ' km</b></div><div><span class="k">In this parcel</span><b>' + A.thumbs({ items: sh.lines.map(function (l) { return o.items[l.i]; }) }, 4) + '</b></div></div>' +
        '<div><p class="k" style="margin-bottom:12px">Scans</p><div class="jv-steps" id="jsteps">' + steps(M) + '</div></div>' +
        '<div class="row"><a class="b sm" href="#/orders/' + o.id + '">' + ic('orders') + 'Open order</a><a class="b sm" href="track.html?o=' + o.id + '&e=' + encodeURIComponent(o.email) + '" target="_blank" rel="noopener">' + ic('ext') + 'Customer view</a>' + (next ? '<button class="b sm" type="button" data-act="adv" data-to="' + next[0] + '">' + ic('bolt') + next[1] + '</button>' : '') + '</div>' +
        '<p class="jv-leg"><span><i style="background:#D9825A"></i>Travelled</span><span><i style="background:rgba(237,231,220,.35)"></i>Planned</span><span><i style="background:#FFE2BF"></i>City lights</span></p><p style="font-size:11.5px;color:#7F786D">Carrier scans are placed from the shipment’s timestamps. The map shows city lights only.</p></aside></div>';
    },
    mount: function () { if (!J) return; var svg = $('#jsvg'); if (!svg) return; var hide = ['Jaipur', J.M.o.addr.city, (NL.HUB[(NL.geo(J.M.o.addr.city) || {}).region] || {}).short].concat(J.M.o.addr.city === 'New Delhi' || J.M.o.addr.city === 'Gurugram' ? ['New Delhi'] : []); A.$$('.jg-labs .cl', svg).forEach(function (tx) { if (hide.indexOf(tx.textContent) >= 0) tx.style.display = 'none'; }); J.svg = svg; J.vb = { x: 132, y: 150, w: 300 }; frame(0, true); if (A.reduce) { J.t = J.M.tEnd; J.vb = camAt(J.M, J.t); frame(0, true); } else setTimeout(function () { play(true); }, 350); },
    leave: function () { if (J) { cancelAnimationFrame(J.raf); J = null; } },
    theme: function () {},
    keys: { ' ': function (e) { e.preventDefault(); toggle(); }, r: function () { replay(); }, ArrowRight: function () { seek(J.t + 1); }, ArrowLeft: function () { seek(J.t - 1); } },
    acts: {
      play: function () { toggle(); }, replay: function () { replay(); },
      speed: function (b) { J.speed = J.speed === 1 ? 2 : J.speed === 2 ? .5 : 1; b.textContent = (J.speed === .5 ? '½' : J.speed) + '×'; b.setAttribute('title', 'Playback speed ' + b.textContent); },
      live: function () { seek(J.M.tEnd); pause(); },
      scrub: function (i) { pause(); seek(+i.value / 1000 * J.M.T, true); },
      pick: function (s) { A.go('journey/' + s.value); },
      fulfil: function () { var o = NL.order(A.parse().id); A.go('orders/' + o.id); setTimeout(function () { if (A.fulfilModal) A.fulfilModal(NL.order(o.id)); }, 400); },
      adv: function (b) { var M = J.M, to = b.getAttribute('data-to'); var from = J.t; NL.advance(M.o, M.sh.id, to); var y = scrollY; A.refresh(); scrollTo(0, y); if (J) { J.t = Math.min(from, J.M.tEnd); J.vb = camAt(J.M, J.t); frame(0, true); play(false); } A.toast({ shipped: 'Handed to the carrier', out: 'Out for delivery. Watch it go.', delivered: 'Delivered.' }[to], { icon: 'truck' }); }
    },
    remote: function () { var t = J ? J.t : 0; A.refresh(); if (J) { J.t = Math.min(t, J.M.tEnd); frame(0, true); play(false); } }
  });
  function toggle() { if (!J) return; if (J.playing) pause(); else { if (J.t >= J.M.tEnd - .05) J.t = J.t >= J.M.T - .05 || J.M.tEnd >= J.M.T ? 0 : J.t; play(J.t === 0); } }
  function replay() { if (!J) return; J.t = 0; J.ended = false; J.vb = { x: 132, y: 150, w: 300 }; play(true); }
  function pause() { if (!J) return; J.playing = false; playBtn(); }
  function seek(t, scrubbing) { if (!J) return; J.t = Math.max(0, Math.min(J.M.T, t)); J.scrub = scrubbing; kick(); }
  function play(fromStart) { if (!J) return; if (fromStart) J.t = 0; J.playing = true; J.target = J.M.tEnd >= J.M.T - .01 ? J.M.T : J.M.tEnd; playBtn(); kick(); }
  function playBtn() { var b = $('#jplay'); if (b) { b.innerHTML = ic(J.playing ? 'pause' : 'play'); b.setAttribute('aria-label', J.playing ? 'Pause' : 'Play'); } }
  function kick() { if (!J || J.raf) return; J.last = performance.now(); J.raf = requestAnimationFrame(tick); }
  function tick(now) {
    if (!J || !document.contains(J.svg)) { if (J) J.raf = 0; return; }
    var real = Math.max(0, (now - J.last) / 1000), dt = Math.min(.05, real); J.last = now;
    if (J.playing) { J.t += Math.min(real, .5) * J.speed; var stop = J.target || J.M.tEnd; if (J.t >= stop) { J.t = stop; J.playing = false; playBtn(); } }
    var moving = frame(dt, false);
    if (J.playing || moving) J.raf = requestAnimationFrame(tick); else J.raf = 0;
  }
  var lastHead = '', lastI = -9;
  function frame(dt, snap) {
    var M = J.M, svg = J.svg, t = J.t, tgt = camAt(M, t), r = svg.getBoundingClientRect(), pw = Math.max(1, r.width), ph = Math.max(1, r.height), asp = ph / pw;
    // critically damped camera: position eases linearly, zoom eases in log space
    var k = snap || A.reduce ? 1 : 1 - Math.exp(-dt * (J.scrub ? 9 : 2.4) * Math.max(1, J.speed * .8)), c = J.vb;
    c.x += (tgt.x - c.x) * k; c.y += (tgt.y - c.y) * k; c.w = Math.exp(Math.log(c.w) + (Math.log(tgt.w) - Math.log(c.w)) * k);
    var moving = Math.abs(tgt.x - c.x) > .02 * c.w || Math.abs(Math.log(tgt.w / c.w)) > .004;
    var vw = c.w, vh = c.w * asp; svg.setAttribute('viewBox', (c.x - vw / 2).toFixed(3) + ' ' + (c.y - vh / 2).toFixed(3) + ' ' + vw.toFixed(3) + ' ' + vh.toFixed(3));
    var px = vw / pw; svg.style.setProperty('--px', px); // one screen pixel in map units
    $$('.sc', svg).forEach(function (g) { g.setAttribute('transform', 'scale(' + px.toFixed(5) + ')'); });
    var labs = $('.jg-labs', svg); labs.setAttribute('font-size', (10.5 * px).toFixed(4)); labs.style.opacity = Math.max(0, Math.min(1, (vw - 20) / 60)) * .9;
    var fade = vw < 14 ? Math.max(.1, (vw - 3) / 11) : 1; $('#jbase', svg).style.opacity = fade; $('#jst', svg).style.opacity = Math.max(0, Math.min(1, (14 - vw) / 8)); var cv = $('#jcv'); if (cv) drawLights(cv, c, vw, vh, pw, ph, fade);
    // route progress
    var L = lenAt(M, t), p = ptAt(M, L), ahead = t > M.tEnd + .01, prog = $('#jprog', svg), glow = $('#jglow', svg), shown = Math.min(L, lenAt(M, M.tEnd));
    [prog, glow].forEach(function (el) { el.style.strokeDasharray = M.tot + ' ' + M.tot; el.style.strokeDashoffset = M.tot - shown; });
    prog.setAttribute('stroke-width', (2.4 * px).toFixed(4)); glow.setAttribute('stroke-width', (9 * px).toFixed(4)); var plan = $('#jplan', svg); plan.setAttribute('stroke-width', (1.5 * px).toFixed(4)); plan.setAttribute('stroke-dasharray', (1.5 * px).toFixed(4) + ' ' + (5 * px).toFixed(4));
    var par = $('#jpar', svg); par.setAttribute('transform', 'translate(' + p.x.toFixed(3) + ' ' + p.y.toFixed(3) + ')'); par.classList.toggle('ghost', ahead); par.style.opacity = t < M.ts[0] - .6 ? 0 : 1;
    // the order "ping": a signal from the customer's city to the studio before anything moves
    var ping = $('#jping', svg); ping.setAttribute('stroke-width', (1.3 * px).toFixed(4)); ping.setAttribute('stroke-dasharray', (1 * px).toFixed(4) + ' ' + (4 * px).toFixed(4)); var pk = Math.max(0, Math.min(1, (t - .5) / 1.4));
    if (t < M.ts[0] + .3 && !M.local) { var a = M.dest, b = M.origin, mx = (a.x + b.x) / 2 - (b.y - a.y) * .25, my = (a.y + b.y) / 2 + (b.x - a.x) * .25, pts = ''; for (var i = 0; i <= 30 * pk; i++) { var u = i / 30; pts += (i ? 'L' : 'M') + ((1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * mx + u * u * b.x).toFixed(2) + ' ' + ((1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * my + u * u * b.y).toFixed(2); } ping.setAttribute('d', pts); ping.style.opacity = t > M.ts[0] - .2 ? Math.max(0, 1 - (t - M.ts[0] + .2) * 2) : 1; }
    else ping.style.opacity = 0;
    // waypoints light up as the parcel reaches them
    var ei = evIndex(M, Math.min(t, M.tEnd + (ahead ? 999 : 0)));
    $$('.jw', svg).forEach(function (g) { var w = +g.getAttribute('data-w'), reached = M.evW.some(function (x, j) { return x === w && j <= ei && (j <= evIndex(M, M.tEnd) || ahead); }); g.classList.toggle('on', reached || (w === M.W.length - 1 && t < M.ts[0])); var curW = M.evW[Math.max(0, evIndex(M, t))]; var lastW = M.W.length - 1; g.classList.toggle('lab', (w === curW && !(w === lastW - 1 && vw < 6 && curW !== lastW && t > M.ts[M.ts.length - 2])) || (w === lastW && (curW !== lastW - 1 || vw < 6)) || (w === 0 && curW === 0)); });
    // header + timeline
    var ci = evIndex(M, t), e = ci >= 0 ? M.E[ci] : null, planned = e && !e.done;
    var nxt = ci >= 0 && ci < M.E.length - 1 && M.evW[ci + 1] !== M.evW[ci] ? M.E[ci + 1] : null, onRoad = nxt && t > M.ts[ci] + .15;
    var head = onRoad ? (nxt.k === 'delivered' ? '<em>Nearly there.</em> ' + esc(M.o.addr.l2.split(',').pop().trim()) + '.' : 'On the way to <em>' + esc(nxt.place) + '</em>.') : e ? (e.k === 'delivered' && e.done ? '<em>Delivered</em> in ' + esc(M.o.addr.city) + '.' : e.k === 'out' ? '<em>Out for delivery</em> in ' + esc(M.o.addr.city) + '.' : '<em>' + esc(e.place) + '</em>' + (planned ? ', expected.' : '.')) : '<em>' + esc(M.o.addr.city) + '</em>, an order comes in.';
    if (head !== lastHead) { var h = $('#jh'); if (h) h.innerHTML = head; var pe = $('#jp'); if (pe) pe.textContent = onRoad ? (nxt.k === 'delivered' ? M.sh.rider + ' is a few streets away' : (M.evW[ci] <= 1 ? 'Linehaul truck, ' : 'Feeder van, ') + Math.round(Math.hypot(M.W[M.evW[ci + 1]].x - p.x, M.W[M.evW[ci + 1]].y - p.y) * 11) + ' km to go') + (planned ? ' (projected)' : '') : e ? e.msg + (planned ? ' (projected)' : '') : 'Placed on ' + M.o.ch + ' by ' + M.o.name; lastHead = head; }
    if (ci !== lastI) { $$('#jsteps .js').forEach(function (s) { var i2 = +s.getAttribute('data-i'); s.classList.toggle('done', i2 <= ci && (i2 < 0 || M.E[i2].done)); s.classList.toggle('cur', i2 === ci); if (i2 === ci && J.playing) { var box = s.closest('.jv-side'); if (box && box.scrollHeight > box.clientHeight) box.scrollTo({ top: s.offsetTop - box.clientHeight / 2, behavior: A.reduce ? 'auto' : 'smooth' }); } }); lastI = ci; }
    var ck = $('#jclock'); if (ck) { var ts = clockAt(M, t); ck.textContent = NL.fDs(ts) + ' · ' + NL.fT(ts) + (ahead ? ' · ETA' : ''); }
    var sc = $('#jscrub'); if (sc && document.activeElement !== sc) sc.value = Math.round(t / M.T * 1000);
    var lv = $('#jlive'); if (lv) lv.setAttribute('aria-pressed', Math.abs(t - M.tEnd) < .05);
    if (!J.playing) J.scrub = false;
    return moving;
  }

  /* compact card for the home page */
  // The home card uses a pre-rendered night map (india-lights.webp, made with A.bakeLights) instead of drawing ~5,000 dots on first paint.
  var MAPF = { x: -6, y: -2, w: 290, h: 300 };
  A.bakeLights = function (pxW) { base(); var cv = document.createElement('canvas'), pw = pxW, ph = Math.round(pxW * MAPF.h / MAPF.w); cv.style.width = pw + 'px'; drawLights(cv, { x: MAPF.x + MAPF.w / 2, y: MAPF.y + MAPF.h / 2 }, MAPF.w, MAPF.h, pw, ph, 1); var g = cv.getContext('2d'); g.globalCompositeOperation = 'destination-over'; g.fillStyle = '#0E0D0C'; g.fillRect(0, 0, cv.width, cv.height); return cv.toDataURL('image/png'); };
  A.journeyCard = function (o) {
    var sh = o.ships.filter(function (s) { return s.awb && s.stage !== 'delivered'; })[0] || o.ships[o.ships.length - 1]; if (!sh || !sh.awb) return '';
    var M = model(o, sh), bb = M.bb, w = Math.max(60, Math.max(bb.x1 - bb.x0, (bb.y1 - bb.y0) * 1.6) * 1.5), h = w / 1.7, cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2, L = lenAt(M, M.tEnd), p = ptAt(M, L), e = M.E[Math.max(0, M.di)];
    var d = M.pts.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(''), done = M.pts.filter(function (_, i) { return M.cum[i] <= L; }).map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('');
    return '<a class="livecard" href="#/journey/' + o.id + '"><svg viewBox="' + (cx - w / 2) + ' ' + (cy - h / 2 + 6) + ' ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href="india-lights.webp" x="' + MAPF.x + '" y="' + MAPF.y + '" width="' + MAPF.w + '" height="' + MAPF.h + '" preserveAspectRatio="none"/><path d="' + d + '" fill="none" stroke="rgba(237,231,220,.3)" stroke-width="1.2" stroke-dasharray="2 3" vector-effect="non-scaling-stroke"/><path d="' + done + '" fill="none" stroke="#D9825A" stroke-width="2.2" vector-effect="non-scaling-stroke"/><circle cx="' + p.x + '" cy="' + p.y + '" r="' + (w / 70) + '" fill="#D9825A"/><circle cx="' + p.x + '" cy="' + p.y + '" r="' + (w / 34) + '" fill="none" stroke="#D9825A" stroke-width="1" vector-effect="non-scaling-stroke" class="lc-pulse"/></svg>' +
      '<div class="lc-t"><small><i></i>' + (NL.stage(o) === 'out' ? 'Out for delivery' : 'In transit') + ' · ' + o.id + '</small><b>' + esc(e.place) + '</b><span>' + esc(o.name) + ' · ' + esc(o.addr.city) + ' · ' + esc(NL.etaText(o)) + '</span></div><span class="lc-go">Watch the journey ' + ic('arrow-r') + '</span></a>';
  };
  A.cmd({ label: 'Watch a live delivery', icon: 'journey', keys: 'map tracking journey courier', run: function () { A.go('journey'); } });
})();
