/* Sthira · the plot layout and its site plan.
   One file, used three ways, so the drawing and the model can never disagree:
   - the home page shows the plan as SVG and draws it line by line while the 3D loads (window.SthiraPlan);
   - the 3D bundle imports layout() for the model and paint() for the site-plan texture it stands on;
   - make.py runs svg() in node to put Plot 14's plan into the page itself, so the first paint already has a drawing.
   Units are metres; x runs right, z runs toward the street (the front, the bottom of the sheet). */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SthiraPlan = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  var FT = 0.3048;
  var INK = '#16202A', BLUE = '#1F4FD8', RED = '#D2342A', PAPER = '#F4F6F7';
  var FONT = '"IBM Plex Mono", ui-monospace, Menlo, monospace';
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function r2(v) { return Math.round(v * 100) / 100; }
  function mm(v) { return String(Math.round(v * 1000)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---- the plot and the column grid ----
  // Plot 14 (the default): 3 × 2 bays of 5.4 × 6.0 m on a 32.2 × 25.5 m plot.
  // A visitor's plot (plotW × plotD in metres): setbacks follow the plot, the grid stays near 4.2 × 4.6 m and the bays follow.
  function layout(cfg) {
    cfg = cfg || {};
    var L;
    if (cfg.plotW && cfg.plotD) {
      var side = clamp(cfg.plotW * 0.075, 0.9, 3), front = clamp(cfg.plotD * 0.15, 1.5, 6), rear = clamp(cfg.plotD * 0.07, 0.9, 3);
      var W = cfg.plotW - 2 * side, D = cfg.plotD - front - rear;
      var bx = Math.max(1, Math.round(W / 4.2)), bz = Math.max(1, Math.round(D / 4.6));
      L = { custom: true, W: W, D: D, baysX: bx, baysZ: bz, bay: W / bx, depth: D / bz, side: side, front: front, rear: rear, plotW: cfg.plotW, plotD: cfg.plotD };
    } else {
      var baysX = cfg.baysX || 3, baysZ = cfg.baysZ || 2, bay = cfg.bay || 5.4, depth = cfg.depth || 6;
      var W2 = baysX * bay, D2 = baysZ * depth, PX = cfg.plotX || W2 / 2 + 8;
      L = { custom: false, W: W2, D: D2, baysX: baysX, baysZ: baysZ, bay: bay, depth: depth, side: PX - W2 / 2, front: 9, rear: 4.5, plotW: PX * 2, plotD: D2 + 13.5 };
    }
    L.PX = L.plotW / 2; L.PZ0 = -(L.D / 2 + L.rear); L.PZ1 = L.D / 2 + L.front;
    L.floors = cfg.floors || 4;
    L.top = 0.75 + L.floors * 3.3 + 2.8;
    L.X0 = -L.W / 2; L.Z0 = -L.D / 2;
    L.xs = []; for (var i = 0; i <= L.baysX; i++) L.xs.push(L.X0 + i * L.bay);
    L.zs = []; for (var j = 0; j <= L.baysZ; j++) L.zs.push(L.Z0 + j * L.depth);
    var xe = L.xs[L.baysX];
    L.core = { x0: xe - L.bay * 0.82, x1: xe - 0.6, z0: L.Z0 + 0.5, z1: L.Z0 + L.depth * 0.62 };
    L.label = cfg.label || (L.custom ? Math.round(L.plotW / FT) + ' × ' + Math.round(L.plotD / FT) + ' FT' : 'PLOT 14');
    L.sqft = Math.round(L.W * L.D * L.floors / 0.09290304);
    return L;
  }

  // ---- how each kind of line is drawn: widths, dashes and type sizes in metres, shared by the SVG and the 3D texture ----
  var STYLE = {
    g1: { s: BLUE, w: 0.03, so: 0.1 }, g5: { s: BLUE, w: 0.045, so: 0.22 },
    bd: { s: INK, w: 0.094, so: 0.55, dash: [0.56, 0.31] },
    ax: { s: INK, w: 0.05, so: 0.42, dash: [0.75, 0.25, 0.125, 0.25] },
    bb: { s: BLUE, w: 0.0625, so: 0.85, f: PAPER, fo: 1 },
    fp: { s: INK, w: 0.1, so: 0.85 },
    cr: { s: INK, w: 0.05, so: 0.7 },
    cl: { f: INK, fo: 0.9 },
    ht: { s: INK, w: 0.0375, so: 0.35 },
    dm: { s: INK, w: 0.044, so: 0.6 },
    nc: { s: INK, w: 0.0625, so: 0.8 },
    na: { f: INK, fo: 0.85 },
    rc: { s: RED, w: 0.081, so: 0.9 },
    bt: { f: INK, fo: 0.85, fs: 1 }, dt: { f: INK, fo: 0.75, fs: 1 }, tx: { f: INK, fo: 0.85, fs: 1 },
    tt: { f: INK, fo: 0.7, fs: 0.83 }, rt: { f: RED, fo: 0.95, fs: 0.72 }, rl: { f: RED, fo: 0.95, fs: 0.9 },
  };

  // ---- the drawing as a list of primitives, and the box that holds it ----
  // k: 'w' a dashed line revealed by a wipe, 'd' a line drawn along its length, 'f' a fill that fades in, 't' text.
  // g is the draw group: the order the plan is drawn in (see GROUPS).
  var memo = { key: '', v: null };
  function build(cfg) {
    var key = JSON.stringify(cfg || {});
    if (memo.key === key) return memo.v;
    var L = layout(cfg), P = [], bb = [Infinity, Infinity, -Infinity, -Infinity];
    function ext(x, z) { if (x < bb[0]) bb[0] = x; if (z < bb[1]) bb[1] = z; if (x > bb[2]) bb[2] = x; if (z > bb[3]) bb[3] = z; }
    function mv(x, z) { ext(x, z); return 'M' + r2(x) + ' ' + r2(z); }
    function ln(x, z) { ext(x, z); return 'L' + r2(x) + ' ' + r2(z); }
    function line(xa, za, xb, zb) { return mv(xa, za) + ln(xb, zb); }
    function rect(xa, za, xb, zb) { ext(xa, za); ext(xb, zb); return 'M' + r2(xa) + ' ' + r2(za) + 'H' + r2(xb) + 'V' + r2(zb) + 'H' + r2(xa) + 'Z'; }
    function circ(cx, cz, r) { ext(cx - r, cz - r); ext(cx + r, cz + r); return 'M' + r2(cx - r) + ' ' + r2(cz) + 'a' + r + ' ' + r + ' 0 1 0 ' + r2(2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + r2(-2 * r) + ' 0'; }
    function path(k, d, g, c) { P.push({ k: k, d: d, g: g, c: c }); }
    function tw(t, c) { return t.length * 0.6 * STYLE[c].fs; }
    function text(x, z, t, g, c, a, rot) {
      var fs = STYLE[c].fs, w = tw(t, c); a = a || 'middle';
      if (rot) { ext(x - 0.8 * fs, z - w / 2); ext(x + 0.2 * fs, z + w / 2); }
      else { var xa = a === 'start' ? x : a === 'end' ? x - w : x - w / 2; ext(xa, z - 0.75 * fs); ext(xa + w, z + 0.2 * fs); }
      P.push({ k: 't', x: x, z: z, t: t, g: g, c: c, a: a, rot: rot || 0 });
    }
    var c = L.core, F = L.floors;
    // 1 · the plot boundary
    path('w', rect(-L.PX, L.PZ0, L.PX, L.PZ1), 1, 'bd');
    // 3 · column grid axes, 4 · their bubbles
    var axes = '';
    L.xs.forEach(function (x) { axes += line(x, L.Z0 - 3, x, -L.Z0 + 3); });
    L.zs.forEach(function (z) { axes += line(L.X0 - 3, z, -L.X0 + 3, z); });
    path('w', axes, 3, 'ax');
    L.xs.forEach(function (x, i) { var z = L.Z0 - 3.9; path('d', circ(x, z, 0.9), 4, 'bb'); text(x, z + 0.34, String(i + 1), 4, 'bt'); });
    L.zs.forEach(function (z, j) { var x = L.X0 - 3.9; path('d', circ(x, z, 0.9), 4, 'bb'); text(x, z + 0.34, 'ABCDEFGHIJKLMNOP'.charAt(j), 4, 'bt'); });
    // 5 · the footprint, 6 · columns, 7 · the stair and lift core, hatched
    path('d', rect(L.X0, L.Z0, -L.X0, -L.Z0), 5, 'fp');
    var cols = '';
    L.xs.forEach(function (x) { L.zs.forEach(function (z) { cols += rect(x - 0.21, z - 0.21, x + 0.21, z + 0.21); }); });
    path('f', cols, 6, 'cl');
    path('d', rect(c.x0, c.z0, c.x1, c.z1), 7, 'cr');
    var hatch = '', cw = c.x1 - c.x0, cd = c.z1 - c.z0;
    for (var d = -cd + 0.19; d < cw; d += 0.375) {
      var a0 = Math.max(c.x0 + d, c.x0), a1 = Math.min(c.x0 + d + cd, c.x1);
      if (a1 > a0 + 0.02) hatch += line(a0, c.z0 + (a0 - c.x0 - d), a1, c.z0 + (a1 - c.x0 - d));
    }
    path('d', hatch, 7, 'ht');
    // 8 · dimension strings: each bay and the overall width along the front, the depth down the right
    // outside the boundary when the setback is too tight to hold them
    var dz = L.front < 3.7 ? L.PZ1 + 1.5 : -L.Z0 + 2.2, dz2 = dz + 1.375, dims = '';
    function tick(x, z) { return line(x - 0.22, z + 0.22, x + 0.22, z - 0.22); }
    for (var b = 0; b < L.baysX; b++) {
      var xa = L.xs[b], xb = L.xs[b + 1];
      dims += line(xa, dz, xb, dz) + tick(xa, dz) + tick(xb, dz);
      text((xa + xb) / 2, dz - 0.5, mm(L.bay), 8, 'dt');
    }
    dims += line(L.X0, dz2, -L.X0, dz2) + tick(L.X0, dz2) + tick(-L.X0, dz2);
    text(0, dz2 - 0.5, mm(L.W), 8, 'dt');
    var dx = L.side < 3.7 ? L.PX + 1.5 : -L.X0 + 2.2;
    dims += line(dx, L.Z0, dx, -L.Z0) + tick(dx, L.Z0) + tick(dx, -L.Z0);
    text(dx - 0.5, 0, mm(L.D), 8, 'dt', 'middle', -90);
    path('d', dims, 8, 'dm');
    // 9 · north point (on the lawn when there is room, else beside the plot) and the drawing title
    var inside = L.front >= 7 && L.side >= 5;
    var nx = inside ? L.PX - 3 : Math.max(L.PX, dx + 0.4) + 2.4, nz = inside ? L.PZ1 - 3.4 : L.PZ1 - 1.6;
    path('d', circ(nx, nz, 1.4), 9, 'nc');
    path('f', mv(nx, nz - 1.92) + ln(nx + 0.64, nz + 0.77) + ln(nx, nz + 0.26) + 'Z', 9, 'na');
    text(nx, nz - 2.55, 'N', 9, 'tx');
    var ty = Math.max(L.PZ1, dz2 + 0.3) + 1.4;
    text(-L.PX + 0.6, ty, 'SITE PLAN · ' + L.label + ' · ' + (F > 1 ? 'G+' + (F - 1) : 'G'), 9, 'tt', 'start');
    text(-L.PX + 0.6, ty + 1.0, 'GRID ' + mm(L.bay) + ' × ' + mm(L.depth) + ' · SCALE 1:200', 9, 'tt', 'start');
    // 10 · red pencil: a revision cloud round the core and its note, to the left of the cloud inside the footprint
    var cx = (c.x0 + c.x1) / 2, cz = (c.z0 + c.z1) / 2, rx = cw * 0.95, rz = cd, cloud = '';
    for (var k = 0; k < 14; k++) {
      var t0 = (k / 14) * Math.PI * 2, t1 = ((k + 1) / 14) * Math.PI * 2, tm = (t0 + t1) / 2;
      var x0 = cx + Math.cos(t0) * rx, z0 = cz + Math.sin(t0) * rz, x1 = cx + Math.cos(t1) * rx, z1 = cz + Math.sin(t1) * rz;
      cloud += (k ? '' : mv(x0, z0)) + 'Q' + r2((x0 + x1) / 2 + Math.cos(tm) * 0.28) + ' ' + r2((z0 + z1) / 2 + Math.sin(tm) * 0.28) + ln(x1, z1).replace('L', ' ');
    }
    path('d', cloud, 10, 'rc');
    var note = L.custom ? ['REV A', 'FIRST ISSUE'] : ['REV C', 'CORE SHIFTED 600', 'LIFT PIT 1 500 DEEP'];
    var nxe = cx - rx - 0.25, wmax = Math.max.apply(null, note.map(function (t, i) { return tw(t, i ? 'rt' : 'rl'); }));
    if (nxe - wmax < L.X0 + 0.2) note = [note[0]];
    if (nxe - tw(note[0], 'rl') < L.X0 + 0.2) text(cx, cz - rz - 0.45, note[0], 10, 'rl');
    else note.forEach(function (t, i) { text(nxe, cz - (note.length - 1) * 0.42 + i * 0.86 + 0.3, t, 10, i ? 'rt' : 'rl', 'end'); });
    var v = { L: L, prims: P, box: { x0: bb[0] - 0.8, z0: bb[1] - 0.8, x1: bb[2] + 0.8, z1: bb[3] + 0.8 } };
    memo = { key: key, v: v };
    return v;
  }

  // the sheet's metre grid inside the box (every fifth line heavier)
  function gridPaths(b) {
    var g1 = '', g5 = '';
    for (var x = Math.ceil(b.x0); x <= b.x1; x++) { var s = 'M' + x + ' ' + r2(b.z0) + 'V' + r2(b.z1); if (x % 5 === 0) g5 += s; else g1 += s; }
    for (var z = Math.ceil(b.z0); z <= b.z1; z++) { var t = 'M' + r2(b.x0) + ' ' + z + 'H' + r2(b.x1); if (z % 5 === 0) g5 += t; else g1 += t; }
    return [g1, g5];
  }

  // ---- the order and timing of the draw: group → [start, end] on 0..1 of DRAW seconds ----
  var GROUPS = { 0: [0, 0.12], 1: [0.04, 0.2], 3: [0.14, 0.36], 4: [0.24, 0.42], 5: [0.36, 0.56], 6: [0.5, 0.62], 7: [0.56, 0.72], 8: [0.66, 0.86], 9: [0.76, 0.92], 10: [0.86, 1] };
  var DRAW = 2.6, DELAY = 0.15;
  var CSS = (function () {
    var s = '@property --k{syntax:"\\3c number\\3e";inherits:false;initial-value:1}' +
      '@keyframes plan-k{from{--k:0}to{--k:1}}' +
      '.plan-svg{overflow:visible}' +
      '.plan-svg [data-g]{animation:plan-k var(--dur,1s) cubic-bezier(.45,0,.25,1) var(--del,0s) both}' +
      '.plan-svg .d{fill:none;stroke-dasharray:1;stroke-dashoffset:calc(1 - var(--k))}' +
      '.plan-svg .f,.plan-svg text{opacity:var(--k)}' +
      '.plan-svg .wipe{-webkit-mask:linear-gradient(90deg,#000 calc(var(--k) * 100%),transparent calc(var(--k) * 100% + .5%));mask:linear-gradient(90deg,#000 calc(var(--k) * 100%),transparent calc(var(--k) * 100% + .5%))}' +
      '.plan-svg text{font-family:' + FONT.replace(/"/g, "'") + ';font-weight:500}';
    Object.keys(STYLE).forEach(function (c) {
      var t = STYLE[c], r = [];
      if (t.fs) { r.push('font-size:' + t.fs + 'px', 'fill:' + t.f, 'fill-opacity:' + t.fo); }
      else {
        r.push('fill:' + (t.f || 'none')); if (t.f) r.push('fill-opacity:' + t.fo);
        if (t.s) { r.push('stroke:' + t.s, 'stroke-width:' + t.w, 'stroke-opacity:' + t.so); if (t.dash) r.push('stroke-dasharray:' + t.dash.join(' ')); }
      }
      s += '.plan-svg .' + c + '{' + r.join(';') + '}';
    });
    Object.keys(GROUPS).forEach(function (g) { s += '.plan-svg [data-g="' + g + '"]{--del:' + r2(DELAY + GROUPS[g][0] * DRAW) + 's;--dur:' + r2((GROUPS[g][1] - GROUPS[g][0]) * DRAW) + 's}'; });
    s += '@media (prefers-reduced-motion:reduce){.plan-svg [data-g]{animation:none}}.plan-svg.still [data-g]{animation:none}';
    return s;
  })();

  function describe(L) {
    return 'Site plan of ' + (L.custom ? 'your ' + Math.round(L.plotW / FT) + ' by ' + Math.round(L.plotD / FT) + ' foot plot' : 'Plot 14') + ': the plot boundary, a column grid of ' + L.baysX + ' by ' + L.baysZ + ' bays, a footprint of ' + (Math.round(L.W * 10) / 10) + ' by ' + (Math.round(L.D * 10) / 10) + ' metres and the stair core';
  }

  // ---- the plan as SVG (draws itself on insertion; .still draws it complete) ----
  function svg(cfg, opts) {
    opts = opts || {};
    var B = build(cfg), b = B.box, out = [], g = gridPaths(b);
    out.push('<g class="wipe" data-g="0"><path class="g1" d="' + g[0] + '"/><path class="g5" d="' + g[1] + '"/></g>');
    B.prims.forEach(function (p) {
      if (p.k === 'w') out.push('<g class="wipe" data-g="' + p.g + '"><path class="' + p.c + '" d="' + p.d + '"/></g>');
      else if (p.k === 'd') out.push('<path class="d ' + p.c + '" pathLength="1" data-g="' + p.g + '" d="' + p.d + '"/>');
      else if (p.k === 'f') out.push('<path class="f ' + p.c + '" data-g="' + p.g + '" d="' + p.d + '"/>');
      else out.push('<text class="' + p.c + '" data-g="' + p.g + '" x="' + r2(p.x) + '" y="' + r2(p.z) + '"' + (p.a !== 'start' ? ' text-anchor="' + p.a + '"' : '') + (p.rot ? ' transform="rotate(' + p.rot + ' ' + r2(p.x) + ' ' + r2(p.z) + ')"' : '') + '>' + esc(p.t) + '</text>');
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" class="plan-svg' + (opts.cls ? ' ' + opts.cls : '') + '"' + (opts.id ? ' id="' + opts.id + '"' : '') +
      ' viewBox="' + [r2(b.x0), r2(b.z0), r2(b.x1 - b.x0), r2(b.z1 - b.z0)].join(' ') + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(describe(B.L)) + '">' +
      '<style>' + CSS + '</style>' + out.join('') + '</svg>';
  }

  // ---- the same plan painted on a canvas (the 3D's ground texture): k px a metre, world origin at (ox, oz) px ----
  function paint(ctx, cfg, o) {
    var B = build(cfg), k = o.k, g = gridPaths(B.box);
    function stroke(d, s) {
      var p = new Path2D(d);
      if (s.f) { ctx.globalAlpha = s.fo; ctx.fillStyle = s.f; ctx.fill(p); }
      if (s.s) { ctx.globalAlpha = s.so; ctx.strokeStyle = s.s; ctx.lineWidth = s.w; ctx.setLineDash(s.dash || []); ctx.stroke(p); }
    }
    ctx.save();
    ctx.setTransform(k, 0, 0, k, o.ox, o.oz);
    stroke(g[0], STYLE.g1); stroke(g[1], STYLE.g5);
    B.prims.forEach(function (p) {
      var s = STYLE[p.c];
      if (p.k !== 't') { stroke(p.d, s); return; }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, o.ox + p.x * k, o.oz + p.z * k); if (p.rot) ctx.rotate(p.rot * Math.PI / 180);
      ctx.font = '500 ' + r2(s.fs * k) + 'px ' + FONT; ctx.textAlign = p.a === 'middle' ? 'center' : p.a === 'end' ? 'right' : 'left'; ctx.textBaseline = 'alphabetic';
      ctx.globalAlpha = s.fo; ctx.fillStyle = s.f; ctx.fillText(p.t, 0, 0); ctx.restore();
    });
    ctx.restore();
  }

  // ---- placing the plan on screen, and the 3D's first frame looking straight down on it ----
  // the content box fitted (centred, uniform scale) into a region { x0, y0, x1, y1 } in CSS px
  function fitRect(cfg, region) {
    var b = build(cfg).box, w = b.x1 - b.x0, h = b.z1 - b.z0;
    var s = Math.max(1, Math.min((region.x1 - region.x0) / w, (region.y1 - region.y0) / h));
    return { left: (region.x0 + region.x1) / 2 - (w * s) / 2, top: (region.y0 + region.y1) / 2 - (h * s) / 2, width: w * s, height: h * s, s: s };
  }
  // camera distance and target (y = 0) that put the content box exactly on `rect` for a W × H view shifted by frameX/frameY
  function topCamera(cfg, rect, Wpx, Hpx, frameX, frameY, fovDeg) {
    var b = build(cfg).box, s = rect.width / (b.x1 - b.x0);
    var cx = Wpx / 2 + (frameX || 0) * Wpx, cy = Hpx / 2 - (frameY || 0) * Hpx;
    return {
      r: Hpx / (2 * s * Math.tan((fovDeg * Math.PI) / 360)),
      tx: (b.x0 + b.x1) / 2 - (rect.left + rect.width / 2 - cx) / s,
      tz: (b.z0 + b.z1) / 2 - (rect.top + rect.height / 2 - cy) / s,
    };
  }
  // the orbit's distance and target height for a plot, relative to Plot 14
  function camScale(L) {
    if (!L.custom) return { r: 1, ty: 1 };
    var ext = Math.max(L.plotW * 0.95, L.plotD * 1.05, L.top * 1.6);
    return { r: clamp(ext / 28, 0.5, 1.25), ty: clamp(L.top / 16.75, 0.4, 1.3) };
  }

  return { FT: FT, layout: layout, build: build, svg: svg, paint: paint, fitRect: fitRect, topCamera: topCamera, camScale: camScale, describe: describe, GROUPS: GROUPS, DRAW: DRAW + DELAY };
});
