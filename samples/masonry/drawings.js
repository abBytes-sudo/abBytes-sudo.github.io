/* Ashlar & Co. · drawings in ink, with clay for the brick.
   · "The part you don't see": a garden wall in section, built layer by layer as you scroll (excavation, the drain, a footing
     below the 42-inch frost line, the courses, the coping), each with its share of the cost.
   · "How it was built" beside the two case-study photographs: the Beacon terrace in section and the Cold Spring hearth in elevation. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rnd(seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 0x3C6EF35F) >>> 0; return s / 0x100000000; }; }
  var DEFS = '<defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#1E2124" stroke-width=".7"/></pattern>' +
    '<pattern id="dots" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="#1E2124"/><circle cx="6.5" cy="6" r="1" fill="#1E2124"/></pattern>' +
    '<pattern id="conc" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="3" cy="4" r=".9" fill="#7A7D80"/><circle cx="10" cy="9" r=".7" fill="#7A7D80"/><path d="M6 12l2-1.5" stroke="#7A7D80" stroke-width=".7"/></pattern></defs>';
  function lbl(x, y, t, sub, anchor) { return '<text class="lbl" x="' + x + '" y="' + y + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + t + '</text>' + (sub ? '<text class="lbs" x="' + x + '" y="' + (y + 15) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + sub + '</text>' : ''); }
  function lead(x1, y1, x2, y2) { return '<path class="lt" d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '"/><circle cx="' + x1 + '" cy="' + y1 + '" r="2.2" fill="#1E2124"/>'; }

  function terrace() {
    var s = DEFS, x0 = 70, x1 = 500;
    s += '<rect x="34" y="40" width="36" height="200" fill="url(#hatch)" stroke="#1E2124" stroke-width="1.2"/>' + lbl(52, 30, 'House', '', 'middle');
    s += '<rect x="' + x0 + '" y="150" width="' + (x1 - x0) + '" height="80" fill="url(#dots)" stroke="#1E2124" stroke-width="1"/>';
    s += '<path class="dsh" d="M' + x0 + ' 232H' + (x1 + 70) + '"/>';
    s += '<rect x="' + x0 + '" y="142" width="' + (x1 - x0) + '" height="8" fill="#E9E5DB" stroke="#1E2124" stroke-width=".8"/>';
    for (var x = x0, i = 0; x < x1; i++) { var w = i % 2 ? 22 : 40; w = Math.min(w, x1 - x); s += '<rect x="' + x + '" y="' + (120 + (x - x0) * .012) + '" width="' + (w - 2) + '" height="22" fill="#B3604B" stroke="#1E2124" stroke-width=".8"/>'; x += w; }
    s += '<path class="ln" d="M' + x1 + ' 126V170H560V196H640"/><rect x="' + x1 + '" y="150" width="60" height="80" fill="url(#dots)" stroke="#1E2124" stroke-width=".8"/>';
    s += '<path class="ln" d="M' + x0 + ' 240H34M560 240H640" /><rect x="34" y="240" width="606" height="56" fill="url(#hatch)" opacity=".55"/>';
    s += '<circle cx="530" cy="214" r="11" fill="#F5F3EE" stroke="#1E2124" stroke-width="1.2"/><circle cx="530" cy="214" r="3" fill="#1E2124"/>';
    s += lead(220, 128, 220, 70) + lbl(226, 66, 'Reclaimed brick, 2¼ in.', 'herringbone, falls ¼ in. per foot');
    s += lead(150, 146, 120, 100) + lbl(126, 96, '1 in. stone dust', '', 'end');
    s += lead(300, 190, 330, 270) + lbl(336, 276, '8 in. crushed stone', 'three lifts, each compacted');
    s += lead(110, 232, 90, 270) + lbl(96, 280, 'Filter fabric', '');
    s += lead(530, 214, 596, 126) + lbl(632, 112, 'Drain', 'to daylight', 'end');
    return s;
  }

  function hearth() {
    var s = DEFS, r = rnd(42), bx0 = 200, bx1 = 440, by0 = 36, by1 = 280;
    function inBox(x, y) { return x > 258 && x < 382 && y > 150; }
    var stones = '', y = by1;
    while (y > by0 + 2) { var h = 22 + Math.round(r() * 16); if (y - h < by0) h = y - by0; var x = bx0 - r() * 30; while (x < bx1) { var w = 30 + r() * 46, cx = x + w / 2, cy = y - h / 2; if (!inBox(cx, cy)) { var a = Math.max(bx0, x + 2), b = Math.min(bx1, x + w - 2); if (b - a > 8) { var t = ['#CFC8BA', '#BDB5A6', '#D9D2C4', '#C4BCAE', '#B3AA9A'][Math.floor(r() * 5)];
      stones += '<path d="M' + a.toFixed(1) + ' ' + (y - 2 - r() * 3).toFixed(1) + 'Q' + ((a + b) / 2).toFixed(1) + ' ' + (y - r() * 2).toFixed(1) + ' ' + b.toFixed(1) + ' ' + (y - 3 - r() * 2).toFixed(1) + 'L' + (b - r() * 3).toFixed(1) + ' ' + (y - h + 3 + r() * 3).toFixed(1) + 'Q' + ((a + b) / 2).toFixed(1) + ' ' + (y - h + r() * 2).toFixed(1) + ' ' + (a + r() * 3).toFixed(1) + ' ' + (y - h + 2 + r() * 3).toFixed(1) + 'Z" fill="' + t + '" stroke="#1E2124" stroke-width=".9"/>'; } } x += w; } y -= h; }
    s += '<rect x="' + bx0 + '" y="' + by0 + '" width="' + (bx1 - bx0) + '" height="' + (by1 - by0) + '" fill="#8E8A82"/>' + stones;
    s += '<path d="M262 280V196Q320 140 378 196V280Z" fill="#2B2623" stroke="#1E2124" stroke-width="1.4"/>';
    for (var k = 0; k < 5; k++) s += '<path class="lt" d="M266 ' + (208 + k * 15) + 'H374" stroke="#8E4A36"/>';
    s += '<path class="dsh" d="M305 34V158M335 34V158"/>';
    s += '<rect x="160" y="280" width="320" height="12" fill="#3C4045" stroke="#1E2124"/><path class="ln" d="M20 292H620"/>';
    s += '<rect x="176" y="306" width="288" height="44" fill="url(#hatch)" stroke="#1E2124" stroke-width="1.2"/><path class="dsh" d="M20 300H620"/>';
    s += lead(420, 110, 500, 80) + lbl(506, 76, 'Fieldstone', 'laid in lime');
    s += lead(320, 120, 500, 150) + lbl(506, 146, 'Clay flue liner', '');
    s += lead(368, 236, 500, 214) + lbl(506, 210, 'Firebrick lining', '');
    s += lead(460, 286, 520, 262) + lbl(526, 258, 'Slate hearth', '');
    s += lead(190, 330, 120, 330) + lbl(114, 326, 'Footing', '42 in. below grade', 'end');
    s += lbl(24, 288, 'Floor', '');
    return s;
  }


  /* a garden wall in section: 5 px to the inch, grade at y 250 */
  function wall() {
    var s = DEFS, G = 250, FL = G + 42 * 5, k;
    s += '<rect x="0" y="0" width="900" height="640" fill="#F5F1E8"/>';
    s += '<rect x="36" y="' + G + '" width="828" height="360" fill="url(#hatch)" opacity=".42"/>';
    // the cut: excavation and the compacted base under the footing
    s += '<g class="ly" data-k="1"><path d="M318 ' + G + 'V510H588V' + G + '" fill="#F5F1E8" stroke="#1E2124" stroke-width="1.2" stroke-dasharray="7 5"/><rect x="372" y="490" width="156" height="18" fill="url(#dots)" stroke="#1E2124" stroke-width=".8"/>' + lead(330, 500, 270, 548) + lbl(264, 552, 'Excavation and base', '12% of the cost', 'end') + '</g>';
    // the drain, wrapped in gravel, beside the footing
    s += '<g class="ly" data-k="2"><rect x="532" y="404" width="52" height="104" fill="url(#dots)" stroke="#1E2124" stroke-width=".8"/><circle cx="558" cy="478" r="13" fill="#F5F1E8" stroke="#1E2124" stroke-width="1.3"/><circle cx="552" cy="474" r="1.6" fill="#1E2124"/><circle cx="563" cy="482" r="1.6" fill="#1E2124"/>' + lead(584, 470, 640, 440) + lbl(646, 436, 'Drain tile to daylight', '9% of the cost') + '</g>';
    // the footing, its bottom 48 in. down, below the frost line
    s += '<g class="ly" data-k="3"><rect x="380" y="430" width="140" height="60" fill="url(#conc)" stroke="#1E2124" stroke-width="1.4"/><rect x="380" y="430" width="140" height="60" fill="#CFCBC2" opacity=".45"/><circle cx="410" cy="476" r="3" fill="#1E2124"/><circle cx="490" cy="476" r="3" fill="#1E2124"/>' + lead(382, 452, 270, 452) + lbl(264, 448, 'Footing, 48 in. down', '21% of the cost', 'end') + '</g>';
    s += '<path class="dsh" d="M36 ' + FL + 'H864" stroke="#B04C27" stroke-width="1.3"/>' + '<text class="lbl" x="864" y="' + (FL - 8) + '" text-anchor="end" fill="#B04C27" style="fill:#8A3518">Frost line · 42 in.</text>';
    s += '<path class="lt" d="M300 ' + G + 'V490M294 ' + G + 'H306M294 490H306"/><text class="lbs" x="292" y="' + (G + 130) + '" text-anchor="end">48 in.</text>';
    // the courses: brick in lime, two wythes, laid from the footing up
    var c = '', top = 96, ch = 40 / 3, n = Math.round((430 - top) / ch);
    for (k = 0; k < n; k++) { var y = 430 - (k + 1) * ch; c += '<g class="cr" style="--d:' + (k * 45) + 'ms"><rect x="420" y="' + (y + 1.2).toFixed(1) + '" width="28" height="' + (ch - 2.4).toFixed(1) + '" fill="#B3604B" stroke="#1E2124" stroke-width=".6"/><rect x="452" y="' + (y + 1.2).toFixed(1) + '" width="28" height="' + (ch - 2.4).toFixed(1) + '" fill="#A65B40" stroke="#1E2124" stroke-width=".6"/></g>'; }
    s += '<g class="ly" data-k="4">' + c + lead(422, 300, 270, 300) + lbl(264, 296, 'Courses, reclaimed brick in lime', '46% of the cost', 'end') + '</g>';
    // the coping, with a drip each side
    s += '<g class="ly" data-k="5"><path d="M406 96V80H494V96H488V90H412V96Z" fill="#8A949B" stroke="#1E2124" stroke-width="1.2"/>' + lead(410, 86, 270, 120) + lbl(264, 116, 'Coping, bluestone, 2 in.', '12% of the cost', 'end') + '</g>';
    // grade, with a little lawn either side
    s += '<path class="ln" d="M36 ' + G + 'H318M588 ' + G + 'H864"/>';
    for (k = 0; k < 26; k++) { var gx = 46 + k * 31 + (k > 8 ? 300 : 0); if (gx > 300 && gx < 600) continue; if (gx > 856) break; s += '<path class="lt" d="M' + gx + ' ' + G + 'l3 -8M' + (gx + 5) + ' ' + G + 'l-1 -9M' + (gx + 9) + ' ' + G + 'l-3 -7"/>'; }
    s += '<text class="lbl" x="864" y="' + (G - 8) + '" text-anchor="end">Grade</text>';
    return s;
  }

  var dw = { dwgWall: wall, dwgTerrace: terrace, dwgHearth: hearth };
  // each drawing gets its own pattern ids, so no two elements on the page share one
  Object.keys(dw).forEach(function (id) { var e = document.getElementById(id); if (e) e.innerHTML = dw[id]().replace(/id="(hatch|dots|conc)"/g, 'id="$1-' + id + '"').replace(/url\(#(hatch|dots|conc)\)/g, 'url(#$1-' + id + ')'); });

  /* the wall is built as the section scrolls through the screen: one layer at a time */
  var sec = document.getElementById('below'), svg = document.getElementById('dwgWall'); if (!sec || !svg) return;
  var layers = [].slice.call(svg.querySelectorAll('.ly'));
  function show(n) { layers.forEach(function (g) { g.classList.toggle('on', +g.getAttribute('data-k') <= n); }); }
  if (reduce || !('IntersectionObserver' in window)) { show(5); return; }
  var raf = 0;
  function frame() { raf = 0; var r = svg.getBoundingClientRect(), p = (innerHeight * .92 - r.top) / (r.height * .85 + innerHeight * .25); show(Math.max(0, Math.min(5, Math.floor(p * 6)))); }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  new IntersectionObserver(function (es) { if (es[0].isIntersecting) { addEventListener('scroll', kick, { passive: true }); kick(); } else removeEventListener('scroll', kick); }, { rootMargin: '200px 0px' }).observe(sec);
})();
