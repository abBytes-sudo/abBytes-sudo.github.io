/* Stockroom — the warehouse, drawn. An isometric rack plan in plain SVG: every bin is a bay, every bay holds cartons
   stacked to its real fill level, and a bin's state (to pick, low, receiving, to count) is the colour of its cartons
   and the tag on its beam. Used as the hero of the page about the app and as the map on Today and Locations.

   Wh.render(host, { bins, onBin, label, dock, compact }) -> { set(bins), glow(ids), pick(ids, done), clear(), destroy() }
   bins: [{ id: 'BHW-A-01', zone: 'A', n: 1, fill: 0..1, state: '' | 'pick' | 'low' | 'out' | 'recv' | 'count', note: '' }]
   Colours come from CSS custom properties on the host (see .wh in stockroom.css / product.css). */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', C30 = Math.cos(Math.PI / 6), S30 = .5;
  function iso(x, y, z) { return [(x - y) * C30, (x + y) * S30 - z]; }
  function pt(p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
  function poly(ps, cls) { return '<path class="' + cls + '" d="M' + ps.map(pt).join('L') + 'Z"/>'; }
  /* a box from (x,y,z) with size (w,d,h): top, left (front-left) and right (front-right) faces */
  function box(x, y, z, w, d, h, cls, extra) {
    var t = [iso(x, y, z + h), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z + h)];
    var l = [iso(x, y + d, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x, y + d, z)];
    var r = [iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x + w, y, z)];
    return '<g class="' + cls + '">' + poly(t, 'f-t') + poly(l, 'f-l') + poly(r, 'f-r') + (extra ? extra(t, l, r) : '') + '</g>';
  }
  function carton(x, y, z, w, d, h, k) {
    return box(x, y, z, w, d, h, 'wh-c', function (t, l) {
      // the tape along the top, and the label on the front face
      var a = iso(x + w / 2 - 1.2, y, z + h), b = iso(x + w / 2 + 1.2, y, z + h), c = iso(x + w / 2 + 1.2, y + d, z + h), e = iso(x + w / 2 - 1.2, y + d, z + h);
      var l0 = iso(x + w * .18, y + d, z + h * .72), l1 = iso(x + w * .62, y + d, z + h * .72), l2 = iso(x + w * .62, y + d, z + h * .3), l3 = iso(x + w * .18, y + d, z + h * .3);
      return poly([a, b, c, e], 'f-tape') + (k % 2 === 0 ? poly([l0, l1, l2, l3], 'f-lab') : '');
    });
  }
  var BW = 26, BD = 20, BH = 44, GAP = 3; // one bay: width, depth, height (three levels), and the gap between bays

  function render(host, o) {
    o = o || {}; var bins = o.bins || [], by = {}, zones = {}, order = [];
    bins.forEach(function (b) { by[b.id] = b; if (!zones[b.zone]) { zones[b.zone] = []; order.push(b.zone); } zones[b.zone].push(b); });
    // rows: the first zone along the back wall, the others along the front, an aisle between
    var rows = [], back = order[0], front = order.slice(1), x = 0;
    (zones[back] || []).forEach(function (b, i) { rows.push({ b: b, x: i * (BW + GAP), y: 0 }); });
    var backW = (zones[back] || []).length * (BW + GAP);
    front.forEach(function (z, zi) { zones[z].forEach(function (b, i) { rows.push({ b: b, x: x + i * (BW + GAP), y: BD + 46 }); }); x += zones[z].length * (BW + GAP) + 16; });
    var W = Math.max(backW, x - 16), D = BD * 2 + 46, pad = 26;
    function bay(r) {
      var b = r.b, s = '', n = Math.round(Math.max(0, Math.min(1, b.fill || 0)) * 6), k = 0, lvl, i, cw = (BW - 4) / 2, ch = 11, x0 = r.x, y0 = r.y;
      // the frame: back uprights first, then cartons level by level, then the front uprights and beams
      s += '<path class="wh-up" d="M' + pt(iso(x0, y0, 0)) + 'L' + pt(iso(x0, y0, BH)) + 'M' + pt(iso(x0 + BW, y0, 0)) + 'L' + pt(iso(x0 + BW, y0, BH)) + '"/>';
      for (lvl = 0; lvl < 3; lvl++) {
        var z = lvl * 15;
        s += poly([iso(x0, y0, z), iso(x0 + BW, y0, z), iso(x0 + BW, y0 + BD, z), iso(x0, y0 + BD, z)], 'wh-deck');
        for (i = 0; i < 2 && k < n; i++, k++) s += carton(x0 + 2 + i * cw, y0 + 3, z + .6, cw - 1.2, BD - 6, ch, k);
        s += '<path class="wh-beam" d="M' + pt(iso(x0, y0 + BD, z)) + 'L' + pt(iso(x0 + BW, y0 + BD, z)) + '"/>';
      }
      s += '<path class="wh-up" d="M' + pt(iso(x0, y0 + BD, 0)) + 'L' + pt(iso(x0, y0 + BD, BH)) + 'M' + pt(iso(x0 + BW, y0 + BD, 0)) + 'L' + pt(iso(x0 + BW, y0 + BD, BH)) + '"/>';
      // the shelf label on the lowest beam, and the bin code on the floor in front
      var t0 = iso(x0 + BW / 2, y0 + BD + 9, 0), tag = iso(x0 + BW / 2, y0 + BD, 2.5);
      s += '<g class="wh-tag" transform="translate(' + pt(tag).replace(' ', ',') + ')"><rect x="-6" y="-3.2" width="12" height="6.4" rx="1"/></g>';
      s += '<text class="wh-code" x="' + t0[0].toFixed(1) + '" y="' + (t0[1] + 3).toFixed(1) + '">' + String(b.zone) + '-' + (b.n < 10 ? '0' : '') + b.n + '</text>';
      var hit = [iso(x0, y0, BH), iso(x0 + BW, y0, BH), iso(x0 + BW, y0 + BD, BH), iso(x0 + BW, y0 + BD, 0), iso(x0, y0 + BD, 0), iso(x0, y0 + BD, BH)];
      return '<g class="wh-bay' + (b.state ? ' s-' + b.state : '') + (n ? '' : ' empty') + '" data-bin="' + b.id + '"' + (o.onBin ? ' tabindex="0" role="button"' : '') + ' aria-label="' + (b.id + ', ' + (b.note || (n ? Math.round((b.fill || 0) * 100) + '% full' : 'empty'))).replace(/"/g, '') + '">' + s + poly(hit, 'wh-hit') + '</g>';
    }
    rows.sort(function (a, b) { return (a.y - b.y) || (a.x - b.x); });
    // floor, aisle marking and the dock
    var f = [iso(-pad, -pad, 0), iso(W + pad, -pad, 0), iso(W + pad, D + pad + 14, 0), iso(-pad, D + pad + 14, 0)];
    var a0 = iso(-pad + 6, BD + 23, 0), a1 = iso(W + pad - 6, BD + 23, 0), e0 = iso(-pad + 6, D + 20, 0), e1 = iso(W + pad - 6, D + 20, 0);
    var dk = iso(W + pad, BD + 23, 0), minX = f[3][0] - 6, maxX = f[1][0] + 6, minY = iso(0, 0, BH + 16)[1] - pad * S30 - 6, maxY = f[2][1] + 10;
    var svg = '<svg class="wh-svg" viewBox="' + [minX, minY, maxX - minX, maxY - minY].map(function (v) { return v.toFixed(0); }).join(' ') + '" role="group" aria-label="' + (o.label || 'Warehouse plan').replace(/"/g, '') + '">' +
      poly(f.map(function (p) { return [p[0], p[1] + 5]; }), 'wh-slab') + poly(f, 'wh-floor') +
      '<path class="wh-aisle" d="M' + pt(a0) + 'L' + pt(a1) + '"/><path class="wh-edge" d="M' + pt(e0) + 'L' + pt(e1) + '"/>' +
      '<path class="wh-route" pathLength="100" d=""/>' +
      (o.dock === false ? '' : '<g class="wh-dock" transform="translate(' + pt(dk).replace(' ', ',') + ')"><path d="M0 0l14 8v-26l-14-8z"/><text x="20" y="-2">DOCK</text></g>') +
      rows.map(bay).join('') + '<g class="wh-fx"></g></svg>';
    host.classList.add('wh'); host.innerHTML = svg;
    var root = host.firstChild, route = root.querySelector('.wh-route'), timers = [];
    function el(id) { return root.querySelector('[data-bin="' + id + '"]'); }
    function frontOf(id) { var r = rows.filter(function (q) { return q.b.id === id; })[0]; return r ? iso(r.x + BW / 2, r.y + BD + 16, 0) : null; }
    function clear() { timers.forEach(clearTimeout); timers = []; [].forEach.call(root.querySelectorAll('.glow,.gone'), function (n) { n.classList.remove('glow', 'gone'); }); route.setAttribute('d', ''); route.classList.remove('on'); }
    function glow(ids) { ids.forEach(function (id, i) { var n = el(id); if (n) timers.push(setTimeout(function () { n.classList.add('glow'); }, i * 260)); }); }
    /* the pick walk: a route from the dock past each bin in order; each bin's cartons leave as the walk reaches it */
    function pick(ids, done) {
      var ps = [dk].concat(ids.map(frontOf).filter(Boolean)).concat([dk]); if (ps.length < 3) return;
      route.setAttribute('d', 'M' + ps.map(pt).join('L')); route.getBoundingClientRect(); route.classList.add('on');
      ids.forEach(function (id, i) { timers.push(setTimeout(function () { var n = el(id); if (n) n.classList.add('gone'); }, 500 + (i + 1) * (2200 / (ids.length + 1)))); });
      if (done) timers.push(setTimeout(done, 3000));
    }
    if (o.onBin) {
      root.addEventListener('click', function (e) { var g = e.target.closest && e.target.closest('.wh-bay'); if (g) o.onBin(g.getAttribute('data-bin'), g); });
      root.addEventListener('keydown', function (e) { if (e.key !== 'Enter' && e.key !== ' ') return; var g = e.target.closest && e.target.closest('.wh-bay'); if (g) { e.preventDefault(); o.onBin(g.getAttribute('data-bin'), g); } });
    }
    return { glow: glow, pick: pick, clear: clear, set: function (b2) { o.bins = b2; return render(host, o); }, destroy: function () { clear(); host.innerHTML = ''; } };
  }
  window.Wh = { render: render };
})();
