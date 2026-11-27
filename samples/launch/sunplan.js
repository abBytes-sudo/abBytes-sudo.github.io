/* Aaranya · sun on the plan: the floor plan of one home, drawn the way it really sits (facade at the top, north arrow true),
   with the patches of direct sun that fall through its glass for a date and an hour.
   Same sun model as the 3D massing model (data.js A.sunAt). Overhangs count: the balcony slab above and the window ledges.
   AAR.sunPlan(box, { unit, hour, season, controls, presets, onChange }) -> { set({ unit, hour, season }), state } */
(function () {
  'use strict';
  var A = window.AAR, $ = A.$, $$ = A.$$;
  var SILL = { liv: 0, std: 0.45, bed: 0.45, kit: 0.9, foy: 9, wet: 9, bal: 9 };
  var HEAD = 2.55, SLAB = 2.9, LEDGE = 0.45;
  function r2(n) { return Math.round(n * 100) / 100; }
  var NAMES16 = ['north', 'north-north-east', 'north-east', 'east-north-east', 'east', 'east-south-east', 'south-east', 'south-south-east', 'south', 'south-south-west', 'south-west', 'west-south-west', 'west', 'west-north-west', 'north-west', 'north-north-west'];

  // the home in plan coordinates: x across the facade, y from the facade inwards (metres)
  function geometry(u) {
    var T = A.tower(u.tower), r = u.rect, s = u.face === 'n' ? 1 : -1;
    var map = function (x, z) { return s > 0 ? [x - r[0], z - r[1]] : [r[2] - x, r[3] - z]; };
    var dir = function (x, z) { var l = A.rotXZ(x, z, -T.rot); return s > 0 ? [l[0], l[1]] : [-l[0], -l[1]]; };   // world xz -> plan xy
    var rooms = A.unitRoomRects(u).map(function (rm) {
      var a = map(rm.x0, rm.z0), b = map(rm.x1, rm.z1);
      return { k: rm.k, name: rm.name, x0: Math.min(a[0], b[0]), x1: Math.max(a[0], b[0]), y0: Math.min(a[1], b[1]), y1: Math.max(a[1], b[1]) };
    });
    // which plan edge is the tower's end wall (glass on the side), if any
    rooms.forEach(function (rm) {
      var lx = rm.x0, rx = rm.x1, outerL = false, outerR = false;
      if (s > 0) { outerL = Math.abs(r[0] + lx + T.w / 2) < 0.3; outerR = Math.abs(r[0] + rx - T.w / 2) < 0.3; }
      else { outerL = Math.abs(r[2] - lx - T.w / 2) < 0.3; outerR = Math.abs(r[2] - rx + T.w / 2) < 0.3; }
      rm.sideEdge = outerL ? 'L' : outerR ? 'R' : null;
    });
    return { T: T, W: r[2] - r[0], D: r[3] - r[1], rooms: rooms, dir: dir };
  }

  // glass lines: [x0, y0, x1, y1, inward normal, sill, head, overhang depth, overhang height, room]
  function windows(g) {
    var out = [], bals = g.rooms.filter(function (q) { return q.k === 'bal'; });
    g.rooms.forEach(function (rm) {
      if (rm.k === 'bal' || SILL[rm.k] > 5) return;
      if (rm.y0 < 0.05) out.push([rm.x0 + 0.3, 0, rm.x1 - 0.3, 0, [0, 1], SILL[rm.k], HEAD, LEDGE, HEAD + 0.15, rm]);
      bals.forEach(function (b) {
        if (Math.abs(b.y1 - rm.y0) > 0.06) return;
        var a = Math.max(b.x0, rm.x0) + 0.2, c = Math.min(b.x1, rm.x1) - 0.2; if (c - a < 0.6) return;
        out.push([a, rm.y0, c, rm.y0, [0, 1], rm.k === 'liv' ? 0 : SILL[rm.k], HEAD, b.y1 - b.y0, SLAB, rm]);
      });
      if (rm.sideEdge) {
        var x = rm.sideEdge === 'L' ? rm.x0 : rm.x1, n = rm.sideEdge === 'L' ? [1, 0] : [-1, 0];
        out.push([x, Math.max(rm.y0, 0.2) + 0.3, x, rm.y1 - 0.3, n, SILL[rm.k], HEAD, LEDGE, HEAD + 0.15, rm]);
      }
    });
    return out;
  }

  function patches(g, sun) {
    var hl = Math.hypot(sun.x, sun.z); if (sun.y <= 0.03 || hl < 1e-6) return { list: [], bal: [], el: 0 };
    var tan = sun.y / hl, d = g.dir(-sun.x / hl, -sun.z / hl), l = [d[0], d[1]];                 // light travels away from the sun
    var list = [], reach = {};
    windows(g).forEach(function (w) {
      var c = l[0] * w[4][0] + l[1] * w[4][1]; if (c < 0.05) return;                          // the sun is behind this glass
      var top = Math.min(w[6], w[8] - (w[7] / c) * tan); if (top <= w[5] + 0.05) return;     // the overhang shades it all
      var dS = w[5] / tan, dT = Math.min(top / tan, 40);
      var p = [[w[0] + l[0] * dS, w[1] + l[1] * dS], [w[2] + l[0] * dS, w[3] + l[1] * dS], [w[2] + l[0] * dT, w[3] + l[1] * dT], [w[0] + l[0] * dT, w[1] + l[1] * dT]];
      list.push({ pts: p, room: w[9] });
      var into = Math.min(dT * c, w[4][1] ? w[9].y1 - w[9].y0 : w[9].x1 - w[9].x0);
      reach[w[9].name] = Math.max(reach[w[9].name] || 0, into);
    });
    // the balcony floor catches what gets under the slab above
    var bal = [];
    g.rooms.forEach(function (b) { if (b.k !== 'bal' || l[1] <= 0.05) return; var dep = Math.min(b.y1 - b.y0, l[1] * SLAB / tan); if (dep > 0.05) bal.push([b.x0, b.y0, b.x1 - b.x0, dep]); });
    return { list: list, bal: bal, reach: reach, el: Math.atan(tan) * 180 / Math.PI, l: l };
  }

  function svg(u, hour, season) {
    var g = geometry(u), sun = A.sunAt(hour, A.DECL[season]), P = patches(g, sun), W = g.W, D = g.D;
    var s = '<svg class="uplan sunplan" viewBox="' + [-1.6, -2.2, r2(W + 3.2), r2(D + 3.4)].join(' ') + '" role="img" aria-label="' + A.esc(planLabel(u, hour, season, P)) + '"><defs>';
    g.rooms.forEach(function (rm, i) { s += '<clipPath id="spc' + i + '"><rect x="' + r2(rm.x0) + '" y="' + r2(rm.y0) + '" width="' + r2(rm.x1 - rm.x0) + '" height="' + r2(rm.y1 - rm.y0) + '"/></clipPath>'; });
    s += '</defs>';
    g.rooms.forEach(function (rm) { s += '<rect class="r-' + rm.k + '" x="' + r2(rm.x0) + '" y="' + r2(rm.y0) + '" width="' + r2(rm.x1 - rm.x0) + '" height="' + r2(rm.y1 - rm.y0) + '"/>'; });
    // sun on the floor
    P.list.forEach(function (p) { var i = g.rooms.indexOf(p.room); s += '<path class="sp-sun" clip-path="url(#spc' + i + ')" d="M' + p.pts.map(function (q) { return r2(q[0]) + ' ' + r2(q[1]); }).join('L') + 'Z"/>'; });
    P.bal.forEach(function (b) { s += '<rect class="sp-sun b" x="' + r2(b[0]) + '" y="' + r2(b[1]) + '" width="' + r2(b[2]) + '" height="' + r2(b[3]) + '"/>'; });
    g.rooms.forEach(function (rm) {
      s += '<rect class="part" x="' + r2(rm.x0) + '" y="' + r2(rm.y0) + '" width="' + r2(rm.x1 - rm.x0) + '" height="' + r2(rm.y1 - rm.y0) + '"/>';
      var w = rm.x1 - rm.x0, h = rm.y1 - rm.y0, fs = w < 2.6 || h < 2.2 ? 0.72 : 1;
      if (rm.k !== 'wet' || w > 1.6) s += '<text class="lbl" x="' + r2(rm.x0 + w / 2) + '" y="' + r2(rm.y0 + h / 2 + 0.14) + '" style="font-size:' + r2(0.42 * fs) + 'px">' + A.esc(rm.name) + '</text>';
    });
    windows(g).forEach(function (w) { s += '<path class="win" d="M' + r2(w[0]) + ' ' + r2(w[1]) + 'L' + r2(w[2]) + ' ' + r2(w[3]) + '"/>'; });
    s += '<rect class="wall" x="0" y="0" width="' + r2(W) + '" height="' + r2(D) + '"/>';
    s += '<text class="dim" x="0" y="-.55" style="text-anchor:start">↑ Facade · ' + A.esc(u.facing.toLowerCase()) + '</text>';
    // north arrow, true for this home
    var n = g.dir(0, -1), na = Math.atan2(n[0], -n[1]) * 180 / Math.PI;
    s += '<g class="sp-n" transform="translate(' + r2(W + 0.6) + ' -1.1) rotate(' + r2(na) + ')"><circle r=".62"/><path d="M0 -.46L.2 .14L0 .04L-.2 .14Z"/><text y="-.72">N</text></g>';
    // where the sun stands
    if (P.l) { var cx = W / 2 - P.l[0] * (W / 2 + 1), cy = D / 2 - P.l[1] * (D / 2 + 1.2); cx = Math.max(-1.1, Math.min(W + 1.1, cx)); cy = Math.max(-1.7, Math.min(D + 0.9, cy)); s += '<g class="sp-sunmark" transform="translate(' + r2(cx) + ' ' + r2(cy) + ')"><circle r=".42"/><path d="M0 -.75v.18M0 .57v.18M-.75 0h.18M.57 0h.18M-.53 -.53l.13 .13M.4 .4l.13 .13M-.53 .53l.13 -.13M.4 -.4l.13 -.13"/></g>'; }
    return { svg: s + '</svg>', P: P };
  }

  function compassName(sun) { var a = Math.atan2(sun.x, -sun.z) * 180 / Math.PI; a = (a + 360) % 360; return NAMES16[Math.round(a / 22.5) % 16]; }
  var DAYS = { dec: '21 December', mar: '20 March', jun: '21 June' };
  function planLabel(u, hour, season, P) { return 'Floor plan of ' + u.id + ', ' + A.TYPES[u.type].short + ', with the direct sun at ' + A.fmtHour(hour) + ' on ' + DAYS[season] + ': ' + fact(u, hour, season, P); }
  function fact(u, hour, season, P) {
    var sun = A.sunAt(hour, A.DECL[season]);
    if (sun.y <= 0.03) return 'the sun is down.';
    var keys = Object.keys(P.reach || {});
    if (!keys.length) {
      var hl = Math.hypot(sun.x, sun.z), b = A.balcony(u), front = (sun.x * b.nx + sun.z * b.nz) / hl;
      return front > 0.05 ? 'the sun is high and stays on the balcony; the rooms are in shade.' : 'the sun is behind the tower; the rooms get soft daylight only.';
    }
    keys.sort(function (a, b) { return P.reach[b] - P.reach[a]; });
    var first = keys[0], nm = function (k) { return k.toLowerCase().replace(' · ', ' and ') + (/ · /.test(k) ? ' room' : ''); };
    return 'sun from the ' + compassName(sun) + ', ' + Math.round(P.el) + '° up, reaching ' + P.reach[first].toFixed(1) + ' m into the ' + nm(first) + (keys.length > 1 ? ', and into the ' + keys.slice(1, 3).map(nm).join(' and ') : '') + '.';
  }

  A.sunPlanFact = function (id, hour, season) { var u = A.unit(id); return fact(u, hour, season, svg(u, hour, season).P); };

  A.sunPlan = function (box, o) {
    o = o || {};
    var st = { unit: o.unit, hour: o.hour != null ? o.hour : 15.67, season: o.season || 'dec' };
    var PRE = [['dec', 15.67, '21 Dec · 3:40 pm'], ['mar', 10.5, '20 Mar · 10:30 am'], ['jun', 12.5, '21 Jun · 12:30 pm']];
    var uid = 'sp' + Math.random().toString(36).slice(2, 7);
    box.classList.add('sp');
    box.innerHTML = '<div class="sp-draw"></div><div class="sp-side">' +
      (o.presets !== false ? '<div class="sp-pre" role="group" aria-label="Moments to compare">' + PRE.map(function (p, i) { return '<button type="button" class="chip" data-i="' + i + '" aria-pressed="false">' + p[2] + '</button>'; }).join('') + '</div>' : '') +
      (o.controls !== false ? '<div class="sp-ctl"><label for="' + uid + '">Time of day</label><input id="' + uid + '" type="range" min="6" max="19" step="0.05" value="' + st.hour + '"><output for="' + uid + '"></output>' +
        '<div class="seg" role="group" aria-label="Day of the year"><button type="button" data-s="dec">Dec 21</button><button type="button" data-s="mar">Mar 20</button><button type="button" data-s="jun">Jun 21</button></div></div>' : '') +
      '<p class="sp-fact" aria-live="polite"></p></div>';
    var draw = $('.sp-draw', box), factEl = $('.sp-fact', box), range = $('input[type=range]', box), out = $('output', box);
    function paint(silent) {
      var u = A.unit(st.unit); if (!u) return;
      var r = svg(u, st.hour, st.season);
      draw.innerHTML = r.svg;
      factEl.innerHTML = '<b>' + A.fmtHour(st.hour) + ', ' + DAYS[st.season] + '.</b> ' + A.esc(fact(u, st.hour, st.season, r.P).replace(/^./, function (c) { return c.toUpperCase(); }));
      if (range) { range.value = st.hour; out.textContent = A.fmtHour(st.hour); range.setAttribute('aria-valuetext', A.fmtHour(st.hour) + ' on ' + DAYS[st.season]); }
      $$('.seg button', box).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.s === st.season)); });
      $$('.sp-pre .chip', box).forEach(function (b) { var p = PRE[+b.dataset.i]; b.setAttribute('aria-pressed', String(p[0] === st.season && Math.abs(p[1] - st.hour) < 0.05)); });
      if (!silent && o.onChange) o.onChange(st);
    }
    if (range) range.addEventListener('input', function () { st.hour = +range.value; paint(); });
    $$('.seg button', box).forEach(function (b) { b.addEventListener('click', function () { st.season = b.dataset.s; paint(); }); });
    $$('.sp-pre .chip', box).forEach(function (b) { b.addEventListener('click', function () { var p = PRE[+b.dataset.i]; st.season = p[0]; st.hour = p[1]; paint(); }); });
    paint(true);
    return { state: st, set: function (n) { Object.keys(n || {}).forEach(function (k) { if (n[k] != null) st[k] = n[k]; }); paint(true); } };
  };
})();
