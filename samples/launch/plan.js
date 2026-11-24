/* Aaranya Residences · unit plans drawn from the same room data the 3D drawer and picker use.
   AAR.unitPlanSVG(typeId, { mini, dims, furn, label }) -> SVG string (1 unit = 1 metre; facade at the top). */
(function () {
  'use strict';
  var A = window.AAR;
  function r2(n) { return Math.round(n * 100) / 100; }
  function ftin(m) { var inch = Math.round(m * 39.3701), f = Math.floor(inch / 12), i = inch % 12; return f + "'" + (i ? i + '"' : ''); }
  A.ftin = ftin;

  function furniture(k, x, y, w, h) {
    var s = '', cx = x + w / 2;
    if (k === 'bed') {
      var bw = Math.min(1.8, w - 0.9), bl = Math.min(2.0, h - 0.9);
      if (bw > 0.9 && bl > 1.2) {
        var bx = cx - bw / 2, by = y + h - bl - 0.35;
        s += '<rect class="furn" x="' + r2(bx) + '" y="' + r2(by) + '" width="' + r2(bw) + '" height="' + r2(bl) + '" rx=".08"/>';
        s += '<rect class="furn" x="' + r2(bx + 0.12) + '" y="' + r2(by + bl - 0.55) + '" width="' + r2(bw / 2 - 0.18) + '" height=".4" rx=".08"/><rect class="furn" x="' + r2(cx + 0.06) + '" y="' + r2(by + bl - 0.55) + '" width="' + r2(bw / 2 - 0.18) + '" height=".4" rx=".08"/>';
        s += '<rect class="furn" x="' + r2(bx - 0.5) + '" y="' + r2(by + bl - 0.45) + '" width=".42" height=".42"/><rect class="furn" x="' + r2(bx + bw + 0.08) + '" y="' + r2(by + bl - 0.45) + '" width=".42" height=".42"/>';
        s += '<rect class="furn" x="' + r2(x + 0.15) + '" y="' + r2(y + 0.3) + '" width=".6" height="' + r2(Math.min(2.4, h - 0.8)) + '"/>';
      }
    } else if (k === 'liv') {
      var sw = Math.min(2.6, w - 1.2);
      if (sw > 1.4) {
        s += '<rect class="furn" x="' + r2(x + 0.4) + '" y="' + r2(y + h * 0.18) + '" width=".9" height="' + r2(sw) + '" rx=".12"/>';
        s += '<rect class="furn" x="' + r2(x + 1.6) + '" y="' + r2(y + h * 0.18 + sw / 2 - 0.45) + '" width=".9" height=".9" rx=".45"/>';
        var tx = x + w - 2.2, ty = y + h - 1.9;
        if (w > 4.2) {
          s += '<rect class="furn" x="' + r2(tx) + '" y="' + r2(ty) + '" width="1.6" height=".9" rx=".06"/>';
          [[0.3, -0.32], [1.0, -0.32], [0.3, 1.22], [1.0, 1.22]].forEach(function (c) { s += '<circle class="furn" cx="' + r2(tx + c[0] + 0.15) + '" cy="' + r2(ty + c[1] + 0.15) + '" r=".2"/>'; });
        }
      }
    } else if (k === 'kit') {
      s += '<path class="furn" d="M' + r2(x + 0.1) + ' ' + r2(y + 0.1) + 'h' + r2(w - 0.2) + 'v.6h-' + r2(w - 0.8) + 'v' + r2(h - 0.8) + 'h-.6z"/>';
      s += '<circle class="furn" cx="' + r2(x + w * 0.6) + '" cy="' + r2(y + 0.4) + '" r=".16"/><circle class="furn" cx="' + r2(x + w * 0.6 + 0.4) + '" cy="' + r2(y + 0.4) + '" r=".16"/>';
    } else if (k === 'wet') {
      s += '<ellipse class="furn" cx="' + r2(x + w - 0.45) + '" cy="' + r2(y + h - 0.45) + '" rx=".22" ry=".3"/>';
      s += '<rect class="furn" x="' + r2(x + 0.15) + '" y="' + r2(y + h - 0.6) + '" width=".7" height=".45" rx=".1"/>';
      s += '<path class="furn" d="M' + r2(x + 0.1) + ' ' + r2(y + 1.0) + 'h' + r2(Math.min(1.1, w - 0.2)) + '"/>';
    } else if (k === 'bal') {
      s += '<circle class="furn" cx="' + r2(x + 0.8) + '" cy="' + r2(y + h / 2) + '" r=".3"/><circle class="furn" cx="' + r2(x + 1.6) + '" cy="' + r2(y + h / 2) + '" r=".3"/>';
      s += '<rect class="furn" x="' + r2(x + w - 1.6) + '" y="' + r2(y + 0.12) + '" width="1.4" height=".34" rx=".17"/>';
    } else if (k === 'std') {
      s += '<rect class="furn" x="' + r2(x + 0.15) + '" y="' + r2(y + 0.2) + '" width="' + r2(Math.min(1.5, w - 0.3)) + '" height=".6"/><circle class="furn" cx="' + r2(x + 0.75) + '" cy="' + r2(y + 1.1) + '" r=".24"/>';
    }
    return s;
  }

  A.unitPlanSVG = function (tid, o) {
    o = o || {}; var T = A.TYPES[tid], W = T.w, D = T.d, P = o.mini ? 0.3 : 1.4;
    var vb = (-P) + ' ' + (-P) + ' ' + r2(W + P * 2) + ' ' + r2(D + P * 2);
    var s = '<svg class="uplan" viewBox="' + vb + '" role="img" aria-label="' + A.esc(o.label || (T.short + ' floor plan, RERA carpet ' + T.carpet + ' square feet')) + '">';
    var rooms = T.rooms.map(function (rm) { return { k: rm[0], name: rm[1], x: rm[2] * W, y: rm[3] * D, w: (rm[4] - rm[2]) * W, h: (rm[5] - rm[3]) * D }; });
    rooms.forEach(function (r) {
      s += '<g class="rm"><rect class="r-' + r.k + '" x="' + r2(r.x) + '" y="' + r2(r.y) + '" width="' + r2(r.w) + '" height="' + r2(r.h) + '"/>';
      if (!o.mini && o.furn !== false) s += furniture(r.k, r.x, r.y, r.w, r.h);
      if (!o.mini) {
        var fs = r.w < 2.6 || r.h < 2.2 ? 0.75 : 1;
        s += '<text class="lbl" x="' + r2(r.x + r.w / 2) + '" y="' + r2(r.y + r.h / 2 - (o.dims === false ? 0 : 0.12)) + '" style="font-size:' + r2(0.42 * fs) + 'px">' + A.esc(r.name) + '</text>';
        if (o.dims !== false && r.k !== 'foy') s += '<text class="dim" x="' + r2(r.x + r.w / 2) + '" y="' + r2(r.y + r.h / 2 + 0.42) + '" style="font-size:' + r2(0.3 * fs) + 'px">' + r2(r.w).toFixed(1) + ' × ' + r2(r.h).toFixed(1) + ' m</text>';
      }
      s += '</g>';
    });
    rooms.forEach(function (r) { s += '<rect class="part" x="' + r2(r.x) + '" y="' + r2(r.y) + '" width="' + r2(r.w) + '" height="' + r2(r.h) + '"/>'; });
    // windows along the facade (top edge), skipping wet areas
    rooms.forEach(function (r) {
      if (r.y > 0.01 || r.k === 'wet') return;
      if (r.k === 'bal') s += '<path class="win" d="M' + r2(r.x + 0.1) + ' 0h' + r2(r.w - 0.2) + '" style="stroke-dasharray:.25 .12"/>';
      else s += '<path class="win" d="M' + r2(r.x + 0.4) + ' 0h' + r2(r.w - 0.8) + '"/>';
    });
    // sliding wall from living to balcony
    rooms.forEach(function (r) { if (r.k === 'liv') { var b = rooms.filter(function (q) { return q.k === 'bal'; })[0]; if (b) s += '<path class="win" d="M' + r2(r.x + 0.5) + ' ' + r2(r.y) + 'h' + r2(Math.min(r.w, b.w) - 1) + '" style="stroke-width:.08"/>'; } });
    s += '<rect class="wall" x="0" y="0" width="' + W + '" height="' + D + '"/>';
    // main door in the foyer (bottom edge)
    var fy = rooms.filter(function (q) { return q.k === 'foy'; })[0];
    if (fy && !o.mini) { var dx = fy.x + fy.w / 2 - 0.5; s += '<path class="door" d="M' + r2(dx) + ' ' + r2(D) + 'v-1a1 1 0 0 1 1 1"/>'; s += '<text class="dim" x="' + r2(fy.x + fy.w / 2) + '" y="' + r2(D + 0.62) + '">Entry</text>'; }
    if (!o.mini && o.dims !== false) {
      s += '<path class="dline" d="M0 ' + r2(-0.6) + 'h' + W + 'M0 -.75v.3M' + W + ' -.75v.3"/>';
      s += '<text class="dim" x="' + r2(W / 2) + '" y="-.8">' + W.toFixed(1) + ' m · ' + ftin(W) + '</text>';
      s += '<path class="dline" d="M' + r2(W + 0.6) + ' 0v' + D + 'M' + r2(W + 0.45) + ' 0h.3M' + r2(W + 0.45) + ' ' + D + 'h.3"/>';
      s += '<text class="dim" transform="translate(' + r2(W + 0.95) + ' ' + r2(D / 2) + ') rotate(90)">' + D.toFixed(1) + ' m · ' + ftin(D) + '</text>';
      s += '<text class="dim" x="0" y="-.8" style="text-anchor:start">↑ Facade</text>';
    }
    return s + '</svg>';
  };
})();
