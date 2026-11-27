/* Small QR code generator for the windscreen sheet and the share card (byte mode, error correction M, versions 1-20).
   Written for Revv from the QR specification (ISO/IEC 18004). window.RevvQR.make(text) -> { size, dark(x, y) };
   RevvQR.svg(text, opts) -> SVG markup; RevvQR.draw(ctx, text, x, y, px) paints it on a canvas. */
(function () {
  'use strict';
  // per version, level M: [EC codewords per block, blocks in group 1, data codewords each, blocks in group 2, data codewords each]
  var EC = [null, [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0], [18, 2, 32, 0, 0], [24, 2, 43, 0, 0], [16, 4, 27, 0, 0], [18, 4, 31, 0, 0], [22, 2, 38, 2, 39], [22, 3, 36, 2, 37], [26, 4, 43, 1, 44],
    [30, 1, 50, 4, 51], [22, 6, 36, 2, 37], [22, 8, 37, 1, 38], [24, 4, 40, 5, 41], [24, 5, 41, 5, 42], [28, 7, 45, 3, 46], [28, 10, 46, 1, 47], [26, 9, 43, 4, 44], [26, 3, 44, 11, 45], [26, 3, 41, 13, 42]];
  var ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90]];

  function mul(x, y) { var z = 0; for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 255; }
  function divisor(deg) { var r = []; for (var i = 0; i < deg - 1; i++) r.push(0); r.push(1); var root = 1;
    for (i = 0; i < deg; i++) { for (var j = 0; j < r.length; j++) { r[j] = mul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; } root = mul(root, 2); } return r; }
  function remainder(data, div) { var r = div.map(function () { return 0; });
    data.forEach(function (b) { var f = b ^ r.shift(); r.push(0); div.forEach(function (c, i) { r[i] ^= mul(c, f); }); }); return r; }
  function utf8(s) { var out = [], e = unescape(encodeURIComponent(s)); for (var i = 0; i < e.length; i++) out.push(e.charCodeAt(i)); return out; }

  function make(text) {
    var bytes = utf8(text), ver = 0, e;
    for (var v = 1; v <= 20; v++) { e = EC[v]; var cap = e[1] * e[2] + e[3] * e[4], head = 4 + (v < 10 ? 8 : 16); if (Math.ceil((head + bytes.length * 8) / 8) <= cap) { ver = v; break; } }
    if (!ver) throw new Error('Text too long for a QR code here');
    e = EC[ver]; var capBytes = e[1] * e[2] + e[3] * e[4], size = ver * 4 + 17;
    // bit stream: byte mode, length, data, terminator, padding
    var bits = [];
    function put(val, n) { for (var i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(4, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach(function (b) { put(b, 8); });
    put(0, Math.min(4, capBytes * 8 - bits.length)); while (bits.length % 8) bits.push(0);
    var data = []; for (var i = 0; i < bits.length; i += 8) { var b = 0; for (var j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; data.push(b); }
    for (var pad = 0xEC; data.length < capBytes; pad ^= 0xEC ^ 0x11) data.push(pad);
    // split into blocks, add error correction, interleave
    var blocks = [], k = 0, div = divisor(e[0]);
    for (i = 0; i < e[1] + e[3]; i++) { var len = i < e[1] ? e[2] : e[4], d = data.slice(k, k + len); k += len; blocks.push({ d: d, c: remainder(d, div) }); }
    var cw = [], maxD = Math.max(e[2], e[4]);
    for (i = 0; i < maxD; i++) blocks.forEach(function (bl) { if (i < bl.d.length) cw.push(bl.d[i]); });
    for (i = 0; i < e[0]; i++) blocks.forEach(function (bl) { cw.push(bl.c[i]); });

    var mod = [], fn = [];
    for (i = 0; i < size; i++) { mod.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function set(x, y, dark) { mod[y][x] = dark; fn[y][x] = true; }
    for (i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(function (c) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) { var x = c[0] + dx, y = c[1] + dy, dist = Math.max(Math.abs(dx), Math.abs(dy)); if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, dist !== 2 && dist !== 4); } });
    var al = ALIGN[ver], n = al.length;
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) { if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
      for (var ay = -2; ay <= 2; ay++) for (var ax = -2; ax <= 2; ax++) set(al[i] + ax, al[j] + ay, Math.max(Math.abs(ax), Math.abs(ay)) !== 1); }
    function format(mask) { var dat = (0 << 3) | mask, rem = dat; for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537); var f = ((dat << 10) | rem) ^ 0x5412;
      var bit = function (i) { return ((f >>> i) & 1) === 1; };
      for (i = 0; i <= 5; i++) set(8, i, bit(i)); set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8)); for (i = 9; i < 15; i++) set(14 - i, 8, bit(i));
      for (i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i)); for (i = 8; i < 15; i++) set(8, size - 15 + i, bit(i)); set(8, size - 8, true); }
    format(0);
    if (ver >= 7) { var rem = ver; for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25); var vb = (ver << 12) | rem;
      for (i = 0; i < 18; i++) { var c = ((vb >>> i) & 1) === 1, a = size - 11 + i % 3, bb = Math.floor(i / 3); set(a, bb, c); set(bb, a, c); } }
    // codewords in the zigzag
    var bi = 0;
    for (var right = size - 1; right >= 1; right -= 2) { if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (j = 0; j < 2; j++) { var x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!fn[y][x]) { mod[y][x] = bi < cw.length * 8 ? ((cw[bi >>> 3] >>> (7 - (bi & 7))) & 1) === 1 : false; bi++; } } }
    var MASK = [function (x, y) { return (x + y) % 2 === 0; }, function (x, y) { return y % 2 === 0; }, function (x) { return x % 3 === 0; }, function (x, y) { return (x + y) % 3 === 0; },
      function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; }, function (x, y) { return x * y % 2 + x * y % 3 === 0; }, function (x, y) { return (x * y % 2 + x * y % 3) % 2 === 0; }, function (x, y) { return ((x + y) % 2 + x * y % 3) % 2 === 0; }];
    function apply(m) { for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) if (!fn[y][x] && MASK[m](x, y)) mod[y][x] = !mod[y][x]; }
    function penalty() {
      var p = 0, x, y, run, dark = 0;
      function line(get) { for (var a = 0; a < size; a++) { run = 1; for (var b = 1; b < size; b++) { if (get(a, b) === get(a, b - 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; }
        for (b = 0; b + 10 < size; b++) { var s = ''; for (var t = 0; t < 11; t++) s += get(a, b + t) ? '1' : '0'; if (s === '10111010000' || s === '00001011101') p += 40; } } }
      line(function (a, b) { return mod[a][b]; }); line(function (a, b) { return mod[b][a]; });
      for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) { var c = mod[y][x]; if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) p += 3; }
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (mod[y][x]) dark++;
      return p + Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
    }
    var best = 0, bestP = Infinity;
    for (var m = 0; m < 8; m++) { apply(m); format(m); var pp = penalty(); if (pp < bestP) { bestP = pp; best = m; } apply(m); }
    apply(best); format(best);
    return { size: size, version: ver, dark: function (x, y) { return mod[y][x]; } };
  }

  function svg(text, o) {
    o = o || {}; var q = make(text), quiet = o.quiet == null ? 4 : o.quiet, n = q.size + quiet * 2, d = '';
    for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.dark(x, y)) d += 'M' + (x + quiet) + ' ' + (y + quiet) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges"' + (o.label ? ' role="img" aria-label="' + String(o.label).replace(/"/g, '&quot;') + '"' : ' aria-hidden="true"') + '><rect width="' + n + '" height="' + n + '" fill="' + (o.bg || '#fff') + '"/><path d="' + d + '" fill="' + (o.fg || '#000') + '"/></svg>';
  }
  function draw(ctx, text, x0, y0, px, fg, bg) {
    var q = make(text), quiet = 4, n = q.size + quiet * 2;
    ctx.fillStyle = bg || '#fff'; ctx.fillRect(x0, y0, n * px, n * px); ctx.fillStyle = fg || '#000';
    for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.dark(x, y)) ctx.fillRect(x0 + (x + quiet) * px, y0 + (y + quiet) * px, px, px);
    return n * px;
  }
  window.RevvQR = { make: make, svg: svg, draw: draw };
})();
