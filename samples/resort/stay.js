/* Taradhura stay: a live site plan of the ridge (free tonight = lit), the four cards, a comparison and a "who's coming" guide. */
(function () {
  'use strict';
  var TD = window.TD, ui = TD.ui, $ = ui.$, $$ = ui.$$, esc = ui.esc, D = TD.date, today = D.today();
  $('#cots').innerHTML = TD.types.map(ui.keyCard).join('');

  // ---------- site plan ----------
  var POS = { D1: [250, 352, -8], D2: [312, 368, -4], D3: [376, 378, 2], D4: [214, 300, -12], D5: [282, 300, -6], D6: [350, 312, 0],
    R1: [560, 238, -6], R2: [640, 226, -2], R3: [720, 220, 2], R4: [800, 222, 6], O1: [930, 300, 4], O2: [1020, 316, 8], S1: [1080, 160, 10] };
  var tw = function (p) { return 'translate(' + p[0] + ' ' + p[1] + ') rotate(' + p[2] + ')'; };
  var sz = { deodar: [38, 26], ridge: [46, 30], orchard: [64, 40], star: [44, 40] };
  var svg = '<svg viewBox="0 0 1200 520" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Site plan of Taradhura on the ridge">';
  // contours
  for (var i = 0; i < 9; i++) { var o = i * 26; svg += '<path class="ct" d="M-20 ' + (470 - o * .2) + ' C 200 ' + (420 - o) + ', 380 ' + (360 - o) + ', 600 ' + (300 - o * 1.1) + ' S 1000 ' + (250 - o * 1.2) + ', 1220 ' + (210 - o * .9) + '"/>'; }
  svg += '<path class="path" d="M120 470 C 200 420, 230 380, 300 340 S 470 270, 560 262 S 760 250, 840 256 S 960 300, 1000 300 M 840 256 C 920 230, 1000 200, 1070 186"/>';
  svg += '<text class="lb" x="60" y="500">Gate and car park · 9 km to Mukteshwar</text><text class="lb" x="900" y="400">Orchard lawn</text><text class="lb" x="160" y="250">Deodar grove</text><text class="lb" x="1040" y="120">Star deck</text><text class="lb" x="520" y="170">The range, 300 km north ↑</text>';
  // lodge + garden
  svg += '<g transform="translate(462 270) rotate(-4)"><rect class="lodge" x="-60" y="-20" width="120" height="40"/><text class="lb" x="0" y="44" text-anchor="middle">Long Room · library · kitchen</text></g>';
  svg += '<g transform="translate(470 352)"><rect class="garden" x="-70" y="-14" width="140" height="28"/><text class="lb" x="0" y="34" text-anchor="middle">Kitchen garden</text></g>';
  TD.allRooms.forEach(function (r) {
    var p = POS[r.id], s = sz[r.type], free = !TD.roomTaken(r.id, today), t = TD.type(r.type);
    svg += '<a href="cottage.html?id=' + r.type + '" class="unit' + (free ? ' free' : '') + '" aria-label="' + t.name + ' ' + r.id + ': ' + (free ? 'free tonight, ' + TD.inr(TD.nightly(r.type, today)) : 'booked tonight') + '"><g transform="' + tw(p) + '"><rect x="' + (-s[0] / 2) + '" y="' + (-s[1] / 2) + '" width="' + s[0] + '" height="' + s[1] + '"/><text x="0" y="4" text-anchor="middle">' + r.id + '</text></g></a>';
  });
  svg += '</svg>';
  var free = TD.allRooms.filter(function (r) { return !TD.roomTaken(r.id, today); }).length;
  $('#siteplan').innerHTML = svg + '<div class="sp-legend"><span><i class="f"></i>Free tonight (' + free + ')</span><span><i></i>Booked tonight (' + (13 - free) + ')</span><span>Contours every 10 m · not to scale</span></div>';

  // ---------- comparison ----------
  var rows = [['From, a night', function (t) { return TD.inr(t.base); }], ['Size', function (t) { return t.size + ' m²'; }], ['Sleeps', function (t) { return t.sleeps; }], ['Bed', function (t) { return t.bed; }], ['View', function (t) { return t.view; }], ['Heat', function (t) { return { deodar: 'Wood stove', ridge: 'Stone fireplace', orchard: 'Wood-burner + heaters', star: 'Hanging fireplace' }[t.id]; }], ['Outdoors', function (t) { return { deodar: 'Garden sit-out', ridge: 'Valley deck, rain shower', orchard: 'Orchard deck', star: 'Telescope deck' }[t.id]; }], ['Children', function (t) { return t.maxKids ? 'Welcome' : 'Adults only'; }], ['Dogs', function (t) { return t.id === 'deodar' ? 'D1 and D2' : 'No'; }]];
  $('#cmp').innerHTML = '<thead><tr><th scope="col"><span class="sr">Compared on</span></th>' + TD.types.map(function (t) { return '<th scope="col"><a class="ul" href="cottage.html?id=' + t.id + '">' + esc(t.plural) + '</a></th>'; }).join('') + '</tr></thead><tbody>' +
    rows.map(function (r) { return '<tr><th scope="row">' + r[0] + '</th>' + TD.types.map(function (t) { return '<td>' + esc(r[1](t)) + '</td>'; }).join('') + '</tr>'; }).join('') +
    '<tr><th scope="row"><span class="sr">Next step</span></th>' + TD.types.map(function (t) { return '<td><a class="lnk" href="book.html?type=' + t.id + '"><span>Check dates</span><span class="ar" aria-hidden="true">→</span></a></td>'; }).join('') + '</tr></tbody>';

  // ---------- who's coming ----------
  var WHO = {
    couple: ['ridge', 'A Ridge Cottage, or the Star House for an occasion.', 'Ridge Cottages put the bed in front of the range and the fire beside it. If it is an anniversary or a proposal, the Star House has the glass gable and a private dinner on the deck.'],
    family: ['orchard', 'An Orchard House.', 'Two bedrooms with their own baths, a kitchenette for the small hours, and an orchard with a swing. Children under 6 stay and eat free; 6 to 11 are half price on meal plans.'],
    friends: ['orchard', 'An Orchard House, or two Ridge Cottages side by side.', 'Four adults share an Orchard House comfortably. If you would rather have a door each, R3 and R4 are next to each other and share a stretch of deck.'],
    dog: ['deodar', 'Deodar Room D1 or D2.', 'Both open straight onto the garden, step-free from the car. We provide a bed, bowls and a towel for muddy paws; ₹1,500 a night. Dogs stay out of the Long Room at meals.'],
    work: ['ridge', 'A Ridge Cottage, for the desk at the window.', 'Fibre with a backup line, a proper desk facing the range, and the Library bookable for calls. Stays of 5 nights or more are 15% off.']
  };
  function who(k) {
    var w = WHO[k], t = TD.type(w[0]);
    $('#who').innerHTML = '<div class="who-in"><a class="who-img" href="cottage.html?id=' + t.id + '" data-cot="' + t.id + '">' + ui.photo(t.ext === 'star-sky' ? t.hero : t.ext, t.name, '(max-width:900px) 100vw, 40vw') + '</a><div><p class="h3" style="margin-bottom:14px">' + esc(w[1]) + '</p><p class="muted">' + esc(w[2]) + '</p><div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:24px"><a class="btn sm" href="book.html?type=' + t.id + '"><span class="lbl">Check ' + esc(t.plural) + '</span> <span class="ar" aria-hidden="true">→</span></a><a class="btn sm line" href="cottage.html?id=' + t.id + '" data-cot="' + t.id + '"><span class="lbl">See the cottage</span></a></div></div></div>';
  }
  $$('#who-tabs button').forEach(function (b) { b.addEventListener('click', function () { $$('#who-tabs button').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); }); who(b.dataset.k); }); });
  who('couple');
})();
