/* A small QR Code generator: byte mode, error correction M, versions 1 to 9 (up to 180 bytes). No library, no network.
   QR.encode(text) → { size, ver, mask, get(x, y) }   QR.draw(canvas, text, { scale, quiet })   QR.svg(text, { quiet }) */
(function () {
  'use strict';
  var ECC = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];   // error-correction codewords per block, level M
  var BLK = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];             // number of blocks, level M

  // arithmetic in GF(256), primitive polynomial 0x11D
  var EXP = [], LOG = [], x = 1, i;
  for (i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11D; }
  for (i = 255; i < 510; i++) EXP[i] = EXP[i - 255];
  function mul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }
  function generator(deg) {
    var r = [1];
    for (var i = 0; i < deg; i++) {
      var t = []; for (var j = 0; j <= r.length; j++) t[j] = 0;
      for (j = 0; j < r.length; j++) { t[j] ^= r[j]; t[j + 1] ^= mul(r[j], EXP[i]); }
      r = t;
    }
    return r;
  }
  function remainder(data, gen) {
    var d = gen.length - 1, res = []; for (var i = 0; i < d; i++) res[i] = 0;
    data.forEach(function (b) { var f = b ^ res.shift(); res.push(0); for (var k = 0; k < d; k++) res[k] ^= mul(gen[k + 1], f); });
    return res;
  }

  function rawModules(v) {
    var r = (16 * v + 128) * v + 64;
    if (v >= 2) { var n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
    return r;
  }
  function dataCodewords(v) { return Math.floor(rawModules(v) / 8) - ECC[v] * BLK[v]; }
  function alignPos(v) {
    if (v === 1) return [];
    var n = Math.floor(v / 7) + 2, size = v * 4 + 17, step = Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2, r = [6];
    for (var p = size - 7; r.length < n; p -= step) r.splice(1, 0, p);
    return r;
  }

  function toBytes(text) {
    var s = unescape(encodeURIComponent(text)), out = [];
    for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
    return out;
  }

  function encode(text) {
    var bytes = toBytes(text), v = 1;
    while (v <= 9 && dataCodewords(v) * 8 < 12 + bytes.length * 8) v++;
    if (v > 9) throw new Error('QR: text too long');
    var cap = dataCodewords(v), bits = [];
    function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(4, 4); put(bytes.length, 8); bytes.forEach(function (b) { put(b, 8); });
    put(0, Math.min(4, cap * 8 - bits.length)); while (bits.length % 8) bits.push(0);
    var cw = []; for (var k = 0; k < bits.length; k += 8) { var b = 0; for (var q = 0; q < 8; q++) b = b << 1 | bits[k + q]; cw.push(b); }
    for (var pad = 0xEC; cw.length < cap; pad ^= 0xEC ^ 0x11) cw.push(pad);

    // split into blocks, add Reed-Solomon codewords, interleave
    var nb = BLK[v], ec = ECC[v], raw = Math.floor(rawModules(v) / 8), nShort = nb - raw % nb, shortLen = Math.floor(raw / nb), blocks = [], gen = generator(ec), pos = 0;
    for (var bi = 0; bi < nb; bi++) {
      var len = shortLen - ec + (bi < nShort ? 0 : 1), d = cw.slice(pos, pos + len); pos += len;
      blocks.push({ d: d, e: remainder(d, gen) });
    }
    var all = [];
    for (var c = 0; c <= shortLen - ec; c++) blocks.forEach(function (bl) { if (c < bl.d.length) all.push(bl.d[c]); });
    for (c = 0; c < ec; c++) blocks.forEach(function (bl) { all.push(bl.e[c]); });

    // matrix
    var size = v * 4 + 17, M = [], F = [];
    for (var y = 0; y < size; y++) { M.push([]); F.push([]); for (var xx = 0; xx < size; xx++) { M[y].push(false); F[y].push(false); } }
    function fn(x, y, dark) { M[y][x] = dark; F[y][x] = true; }
    for (i = 0; i < size; i++) { fn(6, i, i % 2 === 0); fn(i, 6, i % 2 === 0); }
    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var X = cx + dx, Y = cy + dy; if (X < 0 || Y < 0 || X >= size || Y >= size) continue;
        var dist = Math.max(Math.abs(dx), Math.abs(dy)); fn(X, Y, dist !== 2 && dist !== 4);
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var ap = alignPos(v), an = ap.length;
    ap.forEach(function (ay, a) { ap.forEach(function (ax, b) {
      if ((a === 0 && b === 0) || (a === 0 && b === an - 1) || (a === an - 1 && b === 0)) return;
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) fn(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }); });
    function formatBits(mask) {
      var data = mask, rem = data; // level M = 00
      for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      return ((data << 10) | rem) ^ 0x5412;
    }
    function drawFormat(mask) {
      var f = formatBits(mask), bit = function (i) { return ((f >>> i) & 1) !== 0; }, i;
      for (i = 0; i <= 5; i++) fn(8, i, bit(i));
      fn(8, 7, bit(6)); fn(8, 8, bit(7)); fn(7, 8, bit(8));
      for (i = 9; i < 15; i++) fn(14 - i, 8, bit(i));
      for (i = 0; i < 8; i++) fn(size - 1 - i, 8, bit(i));
      for (i = 8; i < 15; i++) fn(8, size - 15 + i, bit(i));
      fn(8, size - 8, true);
    }
    drawFormat(0);
    if (v >= 7) {
      var rem = v; for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      var vb = (v << 12) | rem;
      for (i = 0; i < 18; i++) { var bt = ((vb >>> i) & 1) !== 0, a = size - 11 + i % 3, b2 = Math.floor(i / 3); fn(a, b2, bt); fn(b2, a, bt); }
    }
    // place codewords in the zigzag
    var n = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (var j = 0; j < 2; j++) {
        var X = right - j, up = ((right + 1) & 2) === 0, Y = up ? size - 1 - vert : vert;
        if (!F[Y][X] && n < all.length * 8) { M[Y][X] = ((all[n >>> 3] >>> (7 - (n & 7))) & 1) !== 0; n++; }
      }
    }
    // masks
    function invert(mask) {
      for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
        var m;
        switch (mask) {
          case 0: m = (x + y) % 2 === 0; break; case 1: m = y % 2 === 0; break; case 2: m = x % 3 === 0; break; case 3: m = (x + y) % 3 === 0; break;
          case 4: m = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break; case 5: m = x * y % 2 + x * y % 3 === 0; break;
          case 6: m = (x * y % 2 + x * y % 3) % 2 === 0; break; default: m = ((x + y) % 2 + x * y % 3) % 2 === 0;
        }
        if (m && !F[y][x]) M[y][x] = !M[y][x];
      }
    }
    function penalty() {
      var p = 0, dark = 0, x, y, run, line, s;
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (M[y][x]) dark++;
      for (var pass = 0; pass < 2; pass++) for (y = 0; y < size; y++) {
        line = ''; run = 1;
        for (x = 0; x < size; x++) {
          var cur = pass ? M[x][y] : M[y][x]; line += cur ? '1' : '0';
          if (x > 0 && cur === (pass ? M[x - 1][y] : M[y][x - 1])) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1;
        }
        s = line; for (var k = 0; k + 11 <= s.length; k++) { var w = s.substr(k, 11); if (w === '10111010000' || w === '00001011101') p += 40; }
      }
      for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) { var c0 = M[y][x]; if (c0 === M[y][x + 1] && c0 === M[y + 1][x] && c0 === M[y + 1][x + 1]) p += 3; }
      p += (Math.ceil(Math.abs(dark * 20 - size * size * 10) / (size * size)) - 1) * 10;
      return p;
    }
    var best = 0, bestP = Infinity;
    for (var mk = 0; mk < 8; mk++) { invert(mk); drawFormat(mk); var pn = penalty(); if (pn < bestP) { bestP = pn; best = mk; } invert(mk); }
    invert(best); drawFormat(best);
    return { size: size, ver: v, mask: best, get: function (x, y) { return M[y][x]; } };
  }

  function draw(canvas, text, opt) {
    opt = opt || {};
    var q = encode(text), quiet = opt.quiet == null ? 4 : opt.quiet, sc = opt.scale || 6, n = q.size + quiet * 2, W = n * sc;
    canvas.width = W; canvas.height = W;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, W); ctx.fillStyle = opt.color || '#111';
    for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.get(x, y)) ctx.fillRect((x + quiet) * sc, (y + quiet) * sc, sc, sc);
    return canvas;
  }
  function svg(text, opt) {
    opt = opt || {};
    var q = encode(text), quiet = opt.quiet == null ? 4 : opt.quiet, n = q.size + quiet * 2, d = '';
    for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.get(x, y)) d += 'M' + (x + quiet) + ' ' + (y + quiet) + 'h1v1h-1z';
    return '<svg viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="' + n + '" height="' + n + '" fill="#fff"/><path d="' + d + '" fill="#111"/></svg>';
  }
  window.QR = { encode: encode, draw: draw, svg: svg };
})();
