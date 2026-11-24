/* Taradhura cottage page: facts, gallery + lightbox, 360° look-around, floor plan, the next 30 nights of live rates. */
(function () {
  'use strict';
  var TD = window.TD, ui = TD.ui, $ = ui.$, esc = ui.esc, D = TD.date;
  var id = document.documentElement.dataset.cot || 'ridge', t = TD.type(id) || TD.types[1];
  var today = D.today(), tonight = TD.nightly(t.id, today);

  $('#cp-h').textContent = t.plural;
  $('#cp-crumb').textContent = t.plural;
  $('#cp-from').textContent = 'from ' + TD.inr(t.base);
  $('#cp-from-s').textContent = 'a night with breakfast · tonight ' + (TD.availOn(t.id, today) ? TD.inr(tonight) : 'full');
  $('#cta-p').textContent = 'from ' + TD.inr(t.base);
  var book = 'book.html?type=' + t.id; $('#cta-b').href = book; $('#rates-book').href = book;
  $('#cp-facts').innerHTML = [['Size', t.size + ' m²'], ['Sleeps', t.sleeps], ['Bed', t.bed], ['View', t.view], ['On the ridge', t.rooms.length > 1 ? t.rooms.length + ' of them: ' + t.rooms.join(', ') : 'Just one']]
    .map(function (f) { return '<div><span>' + f[0] + '</span><b>' + esc(f[1]) + '</b></div>'; }).join('');
  $('#cp-lede').innerHTML = '<p>' + esc(t.line) + '</p><p class="muted" style="font:400 17px/1.65 var(--sans);margin-top:20px;max-width:60ch">' + esc(t.body) + '</p>';
  $('#cp-feat').innerHTML = t.features.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('');

  // ---------- gallery + lightbox ----------
  $('#gal').innerHTML = t.gallery.map(function (g, i) { return '<button type="button" data-i="' + i + '">' + ui.photo(g, '', i === 0 || i === 3 ? '(max-width:760px) 100vw, 60vw' : '(max-width:760px) 50vw, 40vw') + '<figcaption><span class="sr">Open photograph: </span>' + esc(t.captions[i]) + '</figcaption></button>'; }).join('');
  var lb = $('#lb'), li = 0, opener = null;
  function show(i) { li = (i + t.gallery.length) % t.gallery.length; var im = $('#lb-img'); im.src = 'photos/' + t.gallery[li] + '.jpg'; im.alt = t.captions[li]; $('#lb-t').textContent = t.captions[li]; $('#lb-c').textContent = (li + 1) + ' / ' + t.gallery.length; }
  function openLb(i) { opener = document.activeElement; show(i); lb.hidden = false; requestAnimationFrame(function () { lb.classList.add('on'); }); $('#lb-x').focus(); if (window.Motion && Motion.lenis) Motion.lenis.stop(); }
  function closeLb() { lb.classList.remove('on'); setTimeout(function () { lb.hidden = true; }, 350); if (window.Motion && Motion.lenis) Motion.lenis.start(); opener && opener.focus(); }
  $('#gal').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) openLb(+b.dataset.i); });
  $('#lb-x').onclick = closeLb; $('#lb-p').onclick = function () { show(li - 1); }; $('#lb-n').onclick = function () { show(li + 1); };
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-stage')) closeLb(); });
  document.addEventListener('keydown', function (e) { if (lb.hidden) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') show(li - 1); if (e.key === 'ArrowRight') show(li + 1);
    if (e.key === 'Tab') { var f = [$('#lb-x'), $('#lb-p'), $('#lb-n')]; var k = f.indexOf(document.activeElement); e.preventDefault(); f[(k + (e.shiftKey ? -1 : 1) + 3) % 3].focus(); } });
  var sx = 0; lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(li + (dx < 0 ? 1 : -1)); });

  // ---------- 360 ----------
  var pano = $('#pano'), started = false;
  $('#pano-h').textContent = t.panoNote;
  $('#pano-note').textContent = 'Drag to look around, or use the arrow keys. Scroll or pinch to zoom.';
  $('#pano-poster').src = 'pano/' + t.pano + '-poster.jpg'; $('#pano-poster').alt = t.panoNote + ', a still from the 360° view';
  function startPano() {
    if (started) return; started = true; $('#pano-start').querySelector('span').textContent = 'Loading the room…';
    var v = TD.pano(pano, 'pano/' + t.pano + '.jpg', { yaw: t.panoSky ? 0.6 : 0, pitch: t.panoSky ? 0.42 : 0, minPitch: t.panoSky ? 0.05 : null, onReady: function () { pano.focus({ preventScroll: true }); }, onTurn: function (y) { $('#compass').style.transform = 'rotate(' + (-y * 57.3) + 'deg)'; } });
    if (!v) { $('#pano-start').querySelector('span').textContent = 'This browser can’t show 360° views'; }
  }
  $('#pano-start').addEventListener('click', startPano);

  // ---------- floor plan ----------
  var PLANS = {
    deodar: { w: 9, h: 6.4, note: 'One room, well used: the bed faces the forest window, the stove sits where the walls are thickest, and the sit-out catches the first sun.', rooms: [[0, 0, 5.4, 4.6, 'Bedroom', 1], [5.4, 0, 3.6, 2.6, 'Bath'], [5.4, 2.6, 3.6, 2, 'Wardrobe'], [0, 4.6, 9, 1.8, 'Stone sit-out', 2]], marks: [[1.2, 0.6, 'Stove'], [2.4, 3, 'King bed']] },
    ridge: { w: 10, h: 7.6, note: 'Every Ridge Cottage turns its long wall to the range. The fireplace anchors the room; the deck is cantilevered over the old terrace.', rooms: [[0, 0, 6.4, 5, 'Bed and fireplace', 1], [6.4, 0, 3.6, 3, 'Bath'], [6.4, 3, 3.6, 2, 'Rain shower (outdoor)'], [0, 5, 10, 2.6, 'Valley deck', 2]], marks: [[0.9, 0.6, 'Fireplace'], [3, 2.6, 'King bed'], [5, 4, 'Window seat']] },
    orchard: { w: 13, h: 9, note: 'Two bedrooms at either end, the long room in the middle, and a deck that steps down into the orchard.', rooms: [[0, 0, 4.4, 5, 'Bedroom 1', 1], [4.4, 0, 4.2, 5, 'Living + wood-burner', 1], [8.6, 0, 4.4, 5, 'Bedroom 2'], [0, 5, 2.6, 2, 'Bath'], [10.4, 5, 2.6, 2, 'Bath'], [2.6, 5, 7.8, 2, 'Kitchenette + dining'], [0, 7, 13, 2, 'Orchard deck', 2]], marks: [[5.4, 1, 'Wood-burner'], [1, 2, 'King'], [9.6, 2, 'Twin']] },
    star: { w: 10, h: 8.4, note: 'An A-frame: the bed sits in the loft under the glass gable; below is the fire, the tub and the doors to the telescope deck.', rooms: [[0, 0, 10, 3.2, 'Loft under the glass gable', 1], [0, 3.2, 6, 3, 'Living + hanging fire', 1], [6, 3.2, 4, 3, 'Soaking tub'], [0, 6.2, 10, 2.2, 'Telescope deck', 2]], marks: [[4, 1.4, 'King bed'], [2, 4.4, 'Fireplace'], [7.6, 7.2, 'Telescope']] }
  };
  var P = PLANS[t.id], S = 46, pad = 30, W = P.w * S + pad * 2, H = P.h * S + pad * 2 + 30;
  var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
  svg += '<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(25,27,29,.18)" stroke-width="1"/></pattern></defs>';
  P.rooms.forEach(function (r) {
    var x = pad + r[0] * S, y = pad + r[1] * S, w = r[2] * S, h = r[3] * S;
    svg += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" class="' + (r[5] === 2 ? 'thin' : 'wall') + '" style="fill:' + (r[5] === 2 ? 'url(#hatch)' : r[5] === 1 ? 'var(--white)' : 'var(--paper-2)') + '"/>';
    svg += '<text x="' + (x + 10) + '" y="' + (y + 20) + '">' + esc(r[4]) + '</text>';
  });
  P.marks.forEach(function (m) { svg += '<circle cx="' + (pad + m[0] * S) + '" cy="' + (pad + m[1] * S) + '" r="6" class="lampf"/><circle cx="' + (pad + m[0] * S) + '" cy="' + (pad + m[1] * S) + '" r="2.5" fill="var(--ember)"/><text x="' + (pad + m[0] * S + 10) + '" y="' + (pad + m[1] * S + 4) + '" style="text-transform:none;letter-spacing:0">' + esc(m[2]) + '</text>'; });
  svg += '<g transform="translate(' + (W - pad - 70) + ',' + (H - 22) + ')"><line x1="0" y1="0" x2="' + S + '" y2="0" class="thin"/><line x1="0" y1="-4" x2="0" y2="4" class="thin"/><line x1="' + S + '" y1="-4" x2="' + S + '" y2="4" class="thin"/><text x="' + (S + 8) + '" y="4">1 m</text></g>';
  svg += '<text x="' + pad + '" y="' + (H - 18) + '">↓ The range, ' + (t.id === 'deodar' ? 'through the deodars' : '300 km') + '</text></svg>';
  $('#plan').innerHTML = svg; $('#plan').setAttribute('aria-label', 'Floor plan of the ' + t.name + ', ' + t.size + ' square metres: ' + P.rooms.map(function (r) { return r[4]; }).join(', '));
  $('#plan-note').textContent = P.note;
  $('#plan-list').innerHTML = [['Floor area', t.size + ' m² inside' + (t.id === 'deodar' ? ' + 16 m² sit-out' : ' + deck')], ['Check-in', '2 pm (9 am on request)'], ['Check-out', '11 am · 2 pm when you book direct'], ['Accessibility', t.id === 'deodar' ? 'D1 and D2 are step-free from the car' : t.id === 'star' ? '42 stone steps up from the lodge' : 'Six steps from the path']]
    .map(function (r) { return '<li style="display:flex;justify-content:space-between;gap:16px;padding:13px 0;border-bottom:1px solid var(--line);font-size:15px"><span class="muted">' + r[0] + '</span><b style="font-weight:500;text-align:right">' + esc(r[1]) + '</b></li>'; }).join('');

  // ---------- rates: next 30 nights ----------
  var html = '';
  for (var i = 0; i < 30; i++) {
    var d = D.add(today, i), left = TD.availOn(t.id, d), r = TD.nightly(t.id, d);
    var cls = (TD.isWeekend(d) ? ' we' : '') + (!left ? ' full' : left === 1 && t.rooms.length > 1 ? ' low' : '');
    html += '<a class="' + cls.trim() + '" href="book.html?type=' + t.id + '&in=' + d + '&out=' + D.add(d, Math.max(TD.minStay(d), 2)) + '" data-left="' + left + '"><b data-left="' + left + '">' + D.wd(d).replace(',', '') + '</b><span class="d">' + D.parse(d).getUTCDate() + '</span><span>' + (left ? TD.inr(r) : 'Full') + '</span></a>';
  }
  $('#rates').innerHTML = html;

  // ---------- the other three ----------
  $('#others').innerHTML = TD.types.filter(function (x) { return x.id !== t.id; }).map(function (x) {
    return '<a href="cottage.html?id=' + x.id + '" data-cot="' + x.id + '"><figure>' + ui.photo(x.hero, x.captions[0], '(max-width:760px) 100vw, 33vw') + '</figure><h3>' + esc(x.plural) + '</h3><p class="muted small">from ' + TD.inr(x.base) + ' · sleeps ' + esc(x.sleeps) + '</p></a>';
  }).join('');
})();
