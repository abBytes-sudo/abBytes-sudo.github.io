/* Code 128 (set B) encoder, drawn on canvas or as SVG. No external service. */
(function () {
  'use strict';
  var P = ('212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 ' +
    '221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 ' +
    '231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 ' +
    '314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 ' +
    '111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 ' +
    '114131 311141 411131 211412 211214 211232 2331112').split(' ');

  function encode(text) {
    text = String(text);
    var codes = [104], sum = 104;
    for (var i = 0; i < text.length; i++) {
      var v = text.charCodeAt(i) - 32;
      if (v < 0 || v > 94) v = 0; // outside set B → space
      codes.push(v); sum += v * (i + 1);
    }
    codes.push(sum % 103, 106);
    var widths = [];
    codes.forEach(function (c) { P[c].split('').forEach(function (w) { widths.push(+w); }); });
    return widths; // alternating bar, space, bar … starting with a bar
  }
  function modules(text) { return encode(text).reduce(function (a, b) { return a + b; }, 0); }

  // draw into a canvas context at x,y; returns drawn width
  function drawAt(ctx, text, x, y, h, mod, color) {
    var w = encode(text), cx = x;
    ctx.fillStyle = color || '#111';
    for (var i = 0; i < w.length; i++) { if (i % 2 === 0) ctx.fillRect(Math.round(cx), y, Math.round(cx + w[i] * mod) - Math.round(cx), h); cx += w[i] * mod; }
    return cx - x;
  }
  function draw(canvas, text, opt) {
    opt = opt || {};
    var mod = opt.module || 2, quiet = 10 * mod, h = opt.height || 60, label = opt.label !== false, fs = opt.fontSize || 13 * (mod / 2);
    var W = modules(text) * mod + quiet * 2, Hh = h + (label ? fs + 10 : 0) + 8;
    canvas.width = W; canvas.height = Hh;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, Hh);
    drawAt(ctx, text, quiet, 4, h, mod);
    if (label) { ctx.fillStyle = '#111'; ctx.font = '500 ' + fs + 'px "Geist Mono", ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.fillText(text, W / 2, h + fs + 8); }
    return canvas;
  }
  function svg(text, opt) {
    opt = opt || {};
    var w = encode(text), h = opt.height || 40, x = 0, rects = '';
    for (var i = 0; i < w.length; i++) { if (i % 2 === 0) rects += '<rect x="' + x + '" y="0" width="' + w[i] + '" height="' + h + '"/>'; x += w[i]; }
    return '<svg class="' + (opt.cls || 'bc') + '" viewBox="0 0 ' + x + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true" fill="currentColor">' + rects + '</svg>';
  }
  window.Code128 = { encode: encode, modules: modules, draw: draw, drawAt: drawAt, svg: svg };
})();
