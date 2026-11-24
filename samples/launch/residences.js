/* Aaranya · residences: plans drawn from the shared room data, live "from" prices, a comparison table. */
(function () {
  'use strict';
  var A = window.AAR, $ = A.$, $$ = A.$$;
  var PH = { A: ['i-family', 'A living room with a deep green sofa and tall windows', 1600, 1000], B: ['i-bed-study', 'A bedroom with a timber platform bed and a desk by the window', 1600, 1067], C: ['i-living', 'A living room with a marble wall and floor-to-ceiling glass', 1600, 1067], D: ['i-sunroom', 'Low sun crossing a living room with a sofa and plants', 1600, 1067] };
  var TOW = { A: 'Arjun', B: 'Kadamb, Arjun', C: 'Sal, Kadamb', D: 'Sal' };
  var BATH = { A: 2, B: 2, C: 2, D: 3 };
  var box = $('#plans'), furn = true;

  function towersOf(k) { var s = {}; A.UNITS.forEach(function (u) { if (u.type === k) s[A.tower(u.tower).name] = 1; }); return Object.keys(s).join(', '); }
  function stats(k) { var t = 0, a = 0; A.UNITS.forEach(function (u) { if (u.type === k) { t++; if (A.status(u.id) === 'avail') a++; } }); return { t: t, a: a }; }

  function render() {
    box.innerHTML = ['A', 'B', 'C', 'D'].map(function (k, i) {
      var t = A.TYPES[k], st = stats(k), m = A.minPrice(k), ph = PH[k];
      var rooms = t.rooms.filter(function (r) { return r[0] !== 'foy'; }).map(function (r) { var w = (r[4] - r[2]) * t.w, d = (r[5] - r[3]) * t.d; return '<li>' + r[1] + '<span>' + w.toFixed(1) + ' × ' + d.toFixed(1) + ' m · ' + A.ftin(w) + ' × ' + A.ftin(d) + '</span></li>'; }).join('');
      return '<section class="res" id="type-' + k.toLowerCase() + '" aria-labelledby="rh-' + k + '">' +
        '<div><div class="plan"><div class="tools"><button type="button" class="chip" data-furn aria-pressed="' + furn + '">Furniture</button></div>' + A.unitPlanSVG(k, { furn: furn, label: t.short + ' plan, ' + t.w + ' by ' + t.d + ' metres, RERA carpet ' + t.carpet + ' square feet' }) + '</div>' +
        '<p class="cap"><span>Typical plan · mirrored on some floors</span><span>Not to scale for construction</span></p></div>' +
        '<div><h2 id="rh-' + k + '"><small>0' + (i + 1) + ' · ' + t.short + ' · ' + towersOf(k) + '</small>' + t.name.replace(' + ', ' <em>+ ') + (t.name.indexOf('+') > 0 ? '</em>' : '') + '</h2>' +
        '<p class="line">' + t.line + '</p>' +
        '<dl class="spec"><div><dt>Carpet (RERA)</dt><dd>' + t.carpet.toLocaleString('en-IN') + '<small>sq ft · ' + A.sqm(t.carpet) + '</small></dd></div><div><dt>Balconies</dt><dd>' + t.bal + '<small>sq ft</small></dd></div>' +
        '<div><dt>From, all-inclusive</dt><dd>' + (m ? A.inr(m) : 'Sold out') + '</dd></div><div><dt>Available now</dt><dd>' + st.a + '<small>of ' + st.t + ' homes</small></dd></div></dl>' +
        '<ul class="roomlist">' + rooms + '</ul>' +
        '<div class="acts"><a class="btn" href="picker.html?type=' + k + '">See the ' + st.a + ' available <span class="ar" aria-hidden="true">→</span></a><a class="btn ghost" href="brochure.html">Brochure</a><a class="btn ghost" href="visit.html">Visit the show apartment</a></div>' +
        '<figure class="ph" data-clip><img src="photos/' + ph[0] + '.webp" srcset="photos/' + ph[0] + '-s.webp 800w, photos/' + ph[0] + '.webp 1600w" sizes="(max-width: 900px) 100vw, 40vw" alt="' + ph[1] + '" width="' + ph[2] + '" height="' + ph[3] + '" loading="lazy" decoding="async"></figure></div>' +
        '</section>';
    }).join('');
    $$('[data-furn]', box).forEach(function (b) { b.addEventListener('click', function () { furn = !furn; var y = scrollY; render(); scrollTo(0, y); }); });
    var rows = [
      ['Carpet area (RERA)', function (k) { return A.sqft(A.TYPES[k].carpet); }],
      ['Balconies', function (k) { return A.sqft(A.TYPES[k].bal); }],
      ['Bedrooms', function (k) { return A.TYPES[k].bhk + (k === 'C' ? ' + study' : k === 'D' ? ' + staff room' : ''); }],
      ['Bathrooms', function (k) { return BATH[k] + (k === 'D' ? ' + powder' : ''); }],
      ['Plan size', function (k) { return A.TYPES[k].w + ' × ' + A.TYPES[k].d + ' m'; }],
      ['Covered parking', function (k) { return A.TYPES[k].parking; }],
      ['Towers', function (k) { return towersOf(k); }],
      ['Homes in total', function (k) { return stats(k).t; }],
      ['Available now', function (k) { return stats(k).a; }],
      ['From, all-inclusive', function (k) { var m = A.minPrice(k); return m ? '<b>' + A.inr(m) + '</b>' : 'Sold out'; }]
    ];
    $('#cmp').innerHTML = '<caption class="vh">The four residence types compared</caption><thead><tr><th scope="col"></th>' + ['A', 'B', 'C', 'D'].map(function (k) { return '<th scope="col">' + A.TYPES[k].short + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><th scope="row">' + r[0] + '</th>' + ['A', 'B', 'C', 'D'].map(function (k) { return '<td>' + r[1](k) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody>';
  }
  render();
  A.on('inv', render);
  if (location.hash) { var t = $(location.hash); if (t) setTimeout(function () { t.scrollIntoView(); }, 50); }
})();
