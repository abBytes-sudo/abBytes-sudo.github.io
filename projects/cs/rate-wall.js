/* Interiors CRM / ERP: the rate card as a wall. 569 items in 33 sections (the studio's real counts) drawn as
   small tiles on a canvas, one tile per item, grouped by section. Typing a word lights the matching tiles, lifts
   them off the wall and stacks them into a line under it; the best match becomes a priced BOQ line.
   Item names and rates are representative of an interiors rate card (the studio's own list is not shown);
   the twelve lines of the quote at the top of the page exist here at the same rates.
   Each section: s name, u main unit, q quantity for a priced line in that unit, a items ("name|unit|=rate"),
   v variants ("label|rate factor"). Items = every variant of every item, so counts are a.length × v.length. */
(function () {
  'use strict';
  var d = document, fig = d.getElementById('rw'), cv = d.getElementById('rw-c');
  if (!fig || !cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, hasIO = 'IntersectionObserver' in window;
  var input = d.getElementById('rw-in'), out = d.getElementById('rw-out'), read = d.getElementById('rw-read');
  var tries = [].slice.call(fig.querySelectorAll('.rw-try button'));
  var touch = matchMedia('(hover: none), (pointer: coarse)').matches || navigator.maxTouchPoints > 0;

  var S = [
    { s: 'Dismantling work', u: 'sqft', q: 300, v: ['', 'after hours|1.3'], a: ['Dismantling of brick walls (labour)|sqft|=32', 'Dismantling of floor tiles|sqft|=22', 'Dismantling of wall tiles|sqft|=20', 'Dismantling of false ceiling|sqft|=18', 'Dismantling of old wardrobe|no.|=2500', 'Cleaning of site (labour)|sqft|=6', 'Removing malba, per trolley|trolley|=1800', 'Dismantling of kitchen platform|rft|=240', 'Removing old doors and frames|no.|=900'] },
    { s: 'Site packing & protection', u: 'sqft', q: 900, v: ['', 'double layer|1.6'], a: ['Packing of floor work, polythene and POP sheets|sqft|=14', 'Packing of wood work, bubble packs|sqft|=16', 'Protection of marble floors, ply boards|sqft|=24', 'Corner guards for doors and frames|rft|=35', 'Dust screens for lived-in rooms|sqft|=22'] },
    { s: 'Masonry & plaster', u: 'sqft', q: 200, v: ['', 'on a tight site|1.15'], a: ['Brick wall, 4.5 in|sqft|=95', 'Brick wall, 9 in|sqft|=170', 'AAC block wall, 4 in|sqft|=90', 'AAC block wall, 6 in|sqft|=118', 'Internal plaster, 12 mm|sqft|=42', 'External plaster, 20 mm|sqft|=58', 'POP punning|sqft|=34', 'Gypsum plaster|sqft|=38', 'Chasing and filling for conduits|rft|=28', 'RCC lintel|rft|=240', 'Door opening in an existing wall|no.|=3600'] },
    { s: 'Waterproofing', u: 'sqft', q: 120, v: ['cementitious', 'polyurethane|1.6'], a: ['Waterproofing of bathroom floor|sqft|=65', 'Waterproofing under bathroom tiles|sqft|=70', 'Waterproofing of terrace|sqft|=58', 'Waterproofing of kitchen sink area|sqft|=62', 'Waterproofing of planter boxes|sqft|=75', 'Waterproofing of balcony|sqft|=60'] },
    { s: 'Flooring: tiles', u: 'sqft', q: 380, v: ['supplied and laid', 'laying only|.36', 'with epoxy grout|1.12', 'on a raised base|1.3'], a: ['Vitrified tiles 600×600|sqft|=190', 'Vitrified tiles 800×800|sqft|=215', 'Vitrified tiles 1200×600|sqft|=245', 'Large-format tiles 1200×1200|sqft|=320', 'Anti-skid tiles for bathrooms|sqft|=170', 'Wood-look tiles|sqft|=225', 'Tile skirting, 100 mm|rft|=75'] },
    { s: 'Marble & granite', u: 'sqft', q: 380, v: ['supplied and laid', 'diamond polishing only|.22', 'with an inlay border|1.4', 'mirror polish|1.1'], a: ['Italian marble flooring|sqft|=760', 'Indian marble flooring|sqft|=420', 'Granite flooring|sqft|=320', 'Marble staircase treads|rft|=850', 'Granite window sills|rft|=290', 'Marble skirting|rft|=160'] },
    { s: 'Wooden flooring', u: 'sqft', q: 300, v: ['', 'with underlay and beading|1.12', 'herringbone pattern|1.3'], a: ['Laminate wooden flooring|sqft|=260', 'Engineered wood flooring|sqft|=560', 'Solid oak flooring|sqft|=940', 'Vinyl plank flooring|sqft|=155'] },
    { s: 'Wall tiles & dado', u: 'sqft', q: 48, v: ['', 'full height|1.08', 'laying only|.4'], a: ['Bathroom wall tiles, ceramic|sqft|=190', 'Kitchen dado tiles|sqft|=220', 'Highlighter tiles|sqft|=260', 'Mosaic tiles|sqft|=360', 'Subway tiles|sqft|=230', 'Wall tile trims|rft|=60'] },
    { s: 'False ceiling', u: 'sqft', q: 420, v: ['', 'double height|1.35', 'with an access panel|1.1'], a: ['Gypsum false ceiling, plain|sqft|=165', 'Gypsum false ceiling with cove|sqft|=185', 'Grid false ceiling, mineral fibre|sqft|=115', 'Wooden slat false ceiling|sqft|=420', 'Calcium silicate false ceiling, bathrooms|sqft|=150', 'Cut-outs for lights in the false ceiling|no.|=120'] },
    { s: 'Electrical wiring', u: 'point', q: 12, v: ['', 'in a lived-in home|1.2'], a: ['Light point wiring, copper FR wire|point|=950', 'Power point wiring, 16 A|point|=1400', 'AC point wiring|point|=2100', 'Wiring for false ceiling lights|point|=1050', 'Distribution board, 8-way|no.|=8500', 'Earthing pit|no.|=12500', 'Data and TV point|point|=1150', 'Concealed conduit|rmt|=110', 'Main cable, 4 core|rmt|=560', 'Inverter wiring|point|=1250', 'Doorbell point|point|=750', 'Geyser point|point|=1600', 'Exhaust fan point|point|=850'] },
    { s: 'Lights & fixtures', u: 'no.', q: 12, v: ['warm white', 'neutral white|1', 'dimmable|1.35'], a: ['LED downlight, 9 W|no.|=1450', 'LED downlight, 15 W|no.|=1850', 'COB spotlight, adjustable|no.|=2100', 'LED strip in cove|rft|=360', 'Wardrobe profile light|rft|=650', 'Pendant light|no.|=6500', 'Wall washer|no.|=3100', 'Mirror light|no.|=2600'] },
    { s: 'Switches & sockets', u: 'no.', q: 24, v: ['white', 'matt black|1.25'], a: ['Modular switch, 6 A|no.|=260', 'Modular socket, 16 A|no.|=420', 'Switch plate, 8 module|no.|=620', 'USB charging socket|no.|=830', 'Dimmer switch|no.|=1050', 'Bell push|no.|=210', 'TV and data socket|no.|=360', 'Floor socket|no.|=1550'] },
    { s: 'Plumbing', u: 'point', q: 8, v: ['', 'in an existing floor|1.3'], a: ['Water supply point, CPVC|point|=1850', 'Drain point, uPVC|point|=1500', 'Hot water line|point|=2200', 'Kitchen sink point|point|=2000', 'Washing machine point|point|=1700', 'Floor trap with jali|no.|=1100', 'Overhead tank connection|no.|=4400', 'Pressure pump, fitting only|no.|=2800', 'Concealed cistern, fitting|no.|=2400', 'Water purifier point|point|=1300', 'Gas pipeline point|point|=3000'] },
    { s: 'Sanitary ware & CP fittings', u: 'no.', q: 2, v: ['standard range', 'premium range|1.8', 'fitting only|.12'], a: ['Wall-hung WC with seat|no.|=17000', 'Counter-top wash basin|no.|=6500', 'Concealed diverter with spout|no.|=6500', 'Rain shower head|no.|=9000', 'Health faucet|no.|=1650', 'Basin mixer|no.|=5800', 'Towel rail|no.|=3200', 'Glass shower enclosure|sqft|=1150'] },
    { s: 'Air-conditioning (HVAC)', u: 'no.', q: 3, v: ['', 'installation only|.12'], a: ['AHU air-conditioning (owner’s scope of work)|no.|=98000', 'AC cassette (owner’s scope of work)|no.|=56000', 'AC split 1.0 ton, supply of split|no.|=36000', 'AC split 1.5 ton, supply of split|no.|=42000', 'Ducted AC, 2 ton|no.|=78000', 'VRV indoor unit|no.|=67000', 'Copper piping for AC|rft|=850', 'Drain line for AC|rft|=260'] },
    { s: 'Painting', u: 'sqft', q: 620, v: ['', 'repainting an old finish|.85'], a: ['Premium emulsion, two coats|sqft|=38', 'Luxury emulsion, two coats|sqft|=52', 'Texture paint|sqft|=82', 'Paint on false ceiling|sqft|=32', 'Enamel on doors and grilles|sqft|=55', 'Wall putty, two coats|sqft|=19', 'Exterior weatherproof paint|sqft|=44', 'Duco finish on panels|sqft|=210', 'PU polish on veneer|sqft|=190', 'Primer coat|sqft|=12'] },
    { s: 'Wallpaper & wall finishes', u: 'sqft', q: 110, v: ['', 'feature wall only|1.15'], a: ['Imported wallpaper|sqft|=140', 'Textured wallpaper|sqft|=110', 'Fabric wall panel|sqft|=310', 'Lime plaster finish|sqft|=195', 'Microcement on walls|sqft|=360', 'Stone cladding|sqft|=265', 'Wallpaper removal|sqft|=28'] },
    { s: 'Wall panelling', u: 'sqft', q: 96, v: ['on a ply base', 'with a hidden door|1.4', 'with an LED groove|1.18'], a: ['Fluted wall panel, veneer|sqft|=1450', 'Laminate wall panel|sqft|=980', 'Fabric panel with beading|sqft|=1180', 'Mirror panel with frame|sqft|=1080', 'Grooved MDF panel, duco|sqft|=1560', 'Charcoal louvre panel|sqft|=880'] },
    { s: 'Modular kitchen', u: 'rft', q: 14, v: ['', 'premium range|1.3'], a: ['Base units, acrylic shutters|rft|=9800', 'Base units, laminate shutters|rft|=8200', 'Wall units, acrylic shutters|rft|=7800', 'Wall units, laminate shutters|rft|=6600', 'Tall pantry unit|no.|=46000', 'Loft units|rft|=4200', 'Breakfast counter|rft|=8900', 'Corner carousel|no.|=26000', 'Kitchen island|rft|=13500', 'Appliance housing|no.|=19500', 'Quartz countertop, 15 mm|sqft|=1250', 'Granite countertop, 18 mm|sqft|=820', 'Acrylic backsplash|sqft|=950'] },
    { s: 'Wardrobes', u: 'sqft', q: 64, v: ['laminate', 'veneer with PU polish|1.35'], a: ['Sliding wardrobe, 8 ft|sqft|=2150', 'Hinged wardrobe|sqft|=1850', 'Walk-in wardrobe|sqft|=2300', 'Wardrobe loft|sqft|=1100', 'Wardrobe internal drawers|no.|=7800', 'Wardrobe with dresser|sqft|=2050', 'Kids’ wardrobe|sqft|=1650', 'Wardrobe glass shutters|sqft|=2400', 'Wardrobe shoe pull-out|no.|=6300', 'Wardrobe trouser rack|no.|=5200', 'Wardrobe mirror shutter|sqft|=2250'] },
    { s: 'Loose furniture', u: 'no.', q: 1, v: ['', 'made to measure|1.25', 'premium range|1.5'], a: ['Three-seater sofa|no.|=68000', 'L-shaped sofa|no.|=112000', 'Dining table, six seats|no.|=54000', 'Dining chair|no.|=9500', 'Coffee table|no.|=18500', 'Side table|no.|=8200', 'Accent chair|no.|=24000', 'Study table|no.|=21000'] },
    { s: 'TV & media units', u: 'no.', q: 1, v: ['laminate', 'veneer|1.3', 'lacquer|1.5'], a: ['TV unit, BWP ply|no.|=68000', 'Fluted TV back panel|sqft|=1350', 'Floating media console|no.|=52000', 'Home theatre cabinet|no.|=88000'] },
    { s: 'Beds & headboards', u: 'no.', q: 1, v: ['', 'premium fabric|1.3'], a: ['King bed with hydraulic storage|no.|=58000', 'Queen bed with box storage|no.|=49000', 'Upholstered bed back panel|no.|=42000', 'Bedside table|no.|=11500', 'Kids’ bunk bed|no.|=52000', 'Daybed|no.|=34000', 'Headboard with side lights|no.|=46000'] },
    { s: 'Doors & frames', u: 'no.', q: 4, v: ['7 ft', '8 ft|1.15', 'with mortise lock and hinges|1.12'], a: ['Flush door with laminate|no.|=16500', 'Main door, solid wood|no.|=56000', 'Sliding glass door with frame|no.|=31000', 'Bathroom door, PVC|no.|=8200', 'Door frame, sal wood|no.|=7400', 'Pocket door|no.|=26500'] },
    { s: 'Windows', u: 'sqft', q: 60, v: ['', 'with acoustic glass|1.45'], a: ['uPVC sliding window|sqft|=780', 'uPVC casement window|sqft|=860', 'Aluminium sliding window|sqft|=940', 'Slim-frame aluminium door|sqft|=1250', 'Fixed glass window|sqft|=620', 'Ventilator with glass louvres|no.|=6200', 'Bay window frame|sqft|=980'] },
    { s: 'Glass & mirrors', u: 'sqft', q: 40, v: ['', 'with polished edges|1.1'], a: ['Toughened glass partition, 12 mm|sqft|=420', 'Frosted glass partition|sqft|=460', 'Bevelled bathroom mirror|sqft|=380', 'Back-painted glass|sqft|=510', 'Fluted glass shutter|sqft|=590', 'Glass shelf|rft|=260', 'Mirror with LED backlight|sqft|=920'] },
    { s: 'Railings', u: 'rft', q: 24, v: ['', 'gold PVD finish|1.4'], a: ['Glass railing with SS posts|rft|=2400', 'MS railing, powder coated|rft|=1300', 'Wooden handrail|rft|=1650', 'Balcony grille|sqft|=720', 'Wrought iron stair railing|rft|=2150'] },
    { s: 'Hardware & fittings', u: 'no.', q: 12, v: ['standard', 'premium range|1.7'], a: ['Soft-close hinges|no.|=220', 'Tandem drawer channels|pair|=2750', 'Wardrobe pull-down hanger|no.|=5800', 'Wardrobe lift|no.|=7600', 'Profile handles|rft|=390', 'Knobs and pulls|no.|=380', 'Door stopper|no.|=320', 'Mortise lock set|no.|=2850', 'Tower bolt|no.|=260', 'Sliding door channel|set|=3900', 'Gas spring for flaps|no.|=720'] },
    { s: 'Curtains & blinds', u: 'sqft', q: 120, v: ['', 'made to measure|1.15'], a: ['Sheer curtains|sqft|=160', 'Blackout curtains|sqft|=210', 'Roman blinds|sqft|=240', 'Roller blinds|sqft|=175', 'Wooden venetian blinds|sqft|=350', 'Motorised curtain track|rft|=1300', 'Curtain rod with finials|rft|=420', 'Pelmet box|rft|=540'] },
    { s: 'Home automation', u: 'no.', q: 4, v: ['', 'with app set-up|1.15'], a: ['Smart switch panel|no.|=9500', 'Curtain motor|no.|=13500', 'Video door phone|no.|=15500', 'Smart lock|no.|=19500', 'Scene controller|no.|=8800', 'Wi-Fi mesh point|no.|=7600'] },
    { s: 'Pooja unit', u: 'no.', q: 1, v: ['veneer', 'duco|1.2'], a: ['Pooja unit, CNC jaali with backlight|no.|=62000', 'Pooja unit, marble back panel|no.|=74000', 'Wall-mounted pooja shelf|no.|=21500', 'Pooja door with bells|no.|=38000'] },
    { s: 'Storage & shoe racks', u: 'no.', q: 1, v: ['laminate', 'veneer|1.3'], a: ['Shoe rack with seat|no.|=24000', 'Crockery unit|no.|=43000', 'Bar unit|no.|=53000', 'Book shelf|sqft|=980', 'Utility cabinet|no.|=26000', 'Under-stair storage|sqft|=1450'] },
    { s: 'Cleaning & handover', u: 'sqft', q: 1800, v: [''], a: ['Deep cleaning before handover|sqft|=9', 'Acid wash of tiles|sqft|=14', 'Snag list closure visit|no.|=2500'] }
  ];
  var UQ = { sqft: 100, rft: 12, 'no.': 1, point: 10, rmt: 40, pair: 6, set: 1, trolley: 4 };

  function money(n) { return '₹' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function roundRate(r) { return r < 100 ? Math.round(r) : r < 1000 ? Math.round(r / 5) * 5 : r < 20000 ? Math.round(r / 50) * 50 : Math.round(r / 500) * 500; }

  /* the items, in section order: every variant of every item */
  var items = [], secs = [];
  S.forEach(function (s, si) {
    var sec = { name: s.s, start: items.length, n: 0 };
    s.v.forEach(function (v) {
      var vp = v.split('|'), vn = vp[0], vf = +(vp[1] || 1);
      s.a.forEach(function (a) {
        var ap = a.split('|'), u = ap[1];
        items.push({ name: ap[0] + (vn ? ', ' + vn : ''), unit: u, rate: roundRate(+ap[2].slice(1) * vf), si: si, q: u === s.u ? s.q : (UQ[u] || 1), hay: (s.s + ' ' + ap[0] + ' ' + vn).toLowerCase(), hayN: (ap[0] + ' ' + vn).toLowerCase(), hayS: s.s.toLowerCase(), x: 0, y: 0, m: false, mi: -1 });
      });
    });
    sec.n = items.length - sec.start; secs.push(sec);
  });

  /* ---- layout: section blocks laid in courses like a wall, each line justified ---- */
  var W = 0, H = 0, dpr = 1, t = 12, g = 3, p = 15, R = 6, wallH = 0, trayY = 0, trayCols = 0, trayRows = 2, PAD = 5;
  function layout() {
    W = Math.max(200, Math.round(cv.parentNode.clientWidth));
    var wide = W >= 520;
    t = wide ? 12 : 7; g = wide ? 3 : 2; p = t + g; R = 6;
    var G = wide ? 8 : 5, LG = wide ? 14 : 10, lineH = R * p - g, lines, total = -G;
    secs.forEach(function (sec) { sec.cols = Math.ceil(sec.n / R); sec.w = sec.cols * p - g; total += sec.w + G; });
    /* balanced courses: the fewest lines that fit, each about as long as the others, then justified */
    function brk(limit) {
      var ls = [[]], x = 0;
      secs.forEach(function (sec) { if (x > 0 && x + sec.w > limit) { ls.push([]); x = 0; } ls[ls.length - 1].push(sec); x += sec.w + G; });
      return ls;
    }
    for (var k = Math.max(1, Math.ceil(total / W)); ; k++) {
      var lim = total / k; lines = brk(lim);
      while (lines.length > k && lim < W) { lim = Math.min(W, lim + p); lines = brk(lim); }
      if (lines.length <= k) break;
    }
    lines.forEach(function (ln, li) {
      var used = ln.reduce(function (a, s) { return a + s.w; }, 0), gap = G;
      if (ln.length > 1) gap = Math.min((W - used) / (ln.length - 1), G * 4);
      var xx = 0, yy = li * (lineH + LG);
      ln.forEach(function (sec) {
        sec.x = Math.round(xx); sec.y = yy; sec.h = lineH;
        for (var k = 0; k < sec.n; k++) { var it = items[sec.start + k]; it.hx = sec.x + Math.floor(k / R) * p; it.hy = yy + (k % R) * p; }
        xx += sec.w + gap;
      });
    });
    wallH = lines.length * (lineH + LG) - LG;
    trayY = wallH + (wide ? 34 : 30);
    trayCols = Math.floor((W - 2 * PAD + g) / p);
    H = trayY + trayRows * p - g + PAD + 1;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.height = H + 'px';
    place(false);
  }

  /* ---- search ---- */
  var query = '', matches = [], sel = 0, hover = -1;
  function tokens(q) {
    return q.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(function (w) { return w.length > 3 && /s$/.test(w) && !/ss$/.test(w) ? w.slice(0, -1) : w; });
  }
  function has(hay, toks) {
    return toks.every(function (w) { return new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(hay); });
  }
  function search(q) {
    query = q.trim().replace(/\s+/g, ' ');
    var toks = tokens(query);
    items.forEach(function (it) { it.m = false; it.mi = -1; });
    matches = [];
    if (toks.length) {
      items.forEach(function (it, i) { if (has(it.hay, toks)) { it.sc = (has(it.hayS, toks) ? 2 : 0) + (has(it.hayN, toks) ? 1 : 0); it.i = i; matches.push(it); } });
      matches.sort(function (a, b) { return b.sc - a.sc || a.i - b.i; });
      matches.forEach(function (it, k) { it.m = true; it.mi = k; });
    }
    sel = 0;
    tries.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.q === query.toLowerCase())); });
    place(true);
    results();
  }

  /* ---- motion: tiles fly between the wall and the line under it ---- */
  var raf = 0, revealAt = -1, revealed = false;
  function place(animate) {
    var now = performance.now(), cap = trayCols * trayRows;
    items.forEach(function (it) {
      var tx = it.hx, ty = it.hy;
      if (it.m && it.mi < cap) { tx = PAD + (it.mi % trayCols) * p; ty = trayY + Math.floor(it.mi / trayCols) * p; }
      if (animate && !reduce && revealed && (tx !== it.x || ty !== it.y)) {
        it.fx = it.x; it.fy = it.y; it.t0 = now + (it.m ? Math.min(it.mi * 10, 450) : 0); it.dur = it.m ? 700 : 520; it.lift = it.m ? -26 : 0;
      } else { it.x = tx; it.y = ty; it.t0 = 0; }
      it.tx = tx; it.ty = ty;
    });
    kick();
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  function frame(now) {
    raf = 0;
    var busy = false;
    items.forEach(function (it) {
      if (!it.t0) return;
      var e = (now - it.t0) / it.dur;
      if (e < 0) { busy = true; return; }
      if (e >= 1) { it.x = it.tx; it.y = it.ty; it.t0 = 0; return; }
      var q = 1 - Math.pow(1 - e, 3);
      it.x = it.fx + (it.tx - it.fx) * q;
      it.y = it.fy + (it.ty - it.fy) * q + Math.sin(Math.PI * q) * (it.lift || 0);
      busy = true;
    });
    if (revealAt >= 0 && !revealed) { if (now - revealAt > 1500) revealed = true; else busy = true; }
    draw(now);
    if (busy) kick();
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var on = !!query, cap = trayCols * trayRows, hs = hover >= 0 ? items[hover].si : -1;
    /* the line under the wall */
    ctx.save();
    ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.strokeStyle = on && matches.length ? '#c4470c' : '#c3c6c0';
    ctx.strokeRect(.5, trayY - PAD + .5, W - 1, trayRows * p - g + 2 * PAD - 1);
    ctx.restore();
    ctx.fillStyle = on && matches.length ? '#a63a08' : '#7a7f85';
    ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(on && matches.length ? 'BOQ line · ' + matches.length + ' from the rate card' : 'BOQ line', 0, trayY - PAD - 7);
    if (!on || !matches.length) {
      ctx.fillStyle = '#9a9fa5'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(on ? 'Nothing matches yet' : 'Matching items stack here', W / 2, trayY + (trayRows * p - g) / 2);
      ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    }
    /* the hovered tile's section, outlined at its place in the wall */
    if (hs >= 0) {
      var sc = secs[hs];
      ctx.strokeStyle = '#15171a'; ctx.lineWidth = 1;
      ctx.strokeRect(sc.x - 2.5, sc.y - 2.5, sc.w + 5, sc.h + 5);
    }
    for (var i = 0; i < items.length; i++) {
      var it = items[i], a = 1;
      if (!revealed) {
        if (revealAt < 0) continue;
        a = Math.max(0, Math.min(1, (now - revealAt - it.si * 28 - (i - secs[it.si].start) * 3) / 260));
        if (!a) continue;
      }
      var col;
      if (i === hover) col = '#15171a';
      else if (on && it.m) col = it.mi === sel ? '#15171a' : '#c4470c';
      else if (on) col = '#e1e3de';
      else if (it.si === hs) col = '#9fa49c';
      else col = it.si % 2 ? '#c4c8c0' : '#d6d9d3';
      ctx.globalAlpha = a;
      ctx.fillStyle = col;
      ctx.fillRect(it.x, it.y, t, t);
      if (on && it.m && it.mi >= cap) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(it.x + 2, it.y + 2, t - 4, t - 4); }
    }
    ctx.globalAlpha = 1;
  }

  /* ---- reading a tile ---- */
  var idle = touch ? 'Tap a tile to read it.' : 'Point at a tile to read it.';
  function readTile(i) {
    if (i < 0) { read.textContent = idle; return; }
    var it = items[i];
    read.innerHTML = '';
    var b = d.createElement('b'); b.textContent = secs[it.si].name;
    read.appendChild(b);
    read.appendChild(d.createTextNode(' · ' + it.name + ' · ' + it.unit + ' · ' + money(it.rate)));
  }
  function hit(e) {
    var r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * (W / r.width), y = (e.clientY - r.top) * (H / r.height);
    for (var i = items.length - 1; i >= 0; i--) { var it = items[i]; if (x >= it.x - 1 && x <= it.x + t + 1 && y >= it.y - 1 && y <= it.y + t + 1) return i; }
    return -1;
  }
  cv.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; var i = hit(e); if (i !== hover) { hover = i; readTile(i); kick(); } });
  cv.addEventListener('pointerleave', function () { if (hover !== -1) { hover = -1; readTile(-1); kick(); } });
  cv.addEventListener('pointerdown', function (e) { var i = hit(e); hover = i; readTile(i); kick(); });

  /* ---- the results under the wall: the stack and the priced line ---- */
  function el(tag, cls, text) { var n = d.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function results() {
    out.textContent = '';
    if (!query) { out.appendChild(el('p', 'rw-sum', 'Type a word: the matching tiles leave the wall and stack into a priced BOQ line.')); return; }
    if (!matches.length) { out.appendChild(el('p', 'rw-sum', 'No item matches “' + query + '”. Try wardrobe, false ceiling or tile.')); return; }
    var nSec = {}; matches.forEach(function (m) { nSec[m.si] = 1; });
    var sum = el('p', 'rw-sum'), b = el('b', null, matches.length + (matches.length === 1 ? ' item' : ' items'));
    sum.appendChild(b);
    sum.appendChild(d.createTextNode(' match “' + query + '”, in ' + Object.keys(nSec).length + ' of 33 sections.'));
    out.appendChild(sum);
    var ul = el('ul', 'rw-list');
    matches.slice(0, 5).forEach(function (m, k) {
      var li = el('li'), bt = el('button');
      bt.type = 'button'; bt.setAttribute('aria-pressed', String(k === sel));
      bt.appendChild(d.createTextNode(m.name));
      bt.appendChild(el('span', null, m.unit + ' · ' + money(m.rate)));
      bt.addEventListener('click', function () { sel = k; [].forEach.call(ul.querySelectorAll('button'), function (x, j) { x.setAttribute('aria-pressed', String(j === k)); }); line(); kick(); });
      if (!reduce) { li.className = 'in'; li.style.setProperty('animation-delay', (0.35 + k * 0.06).toFixed(2) + 's'); }
      li.appendChild(bt); ul.appendChild(li);
    });
    out.appendChild(ul);
    out.appendChild(el('p', 'rw-line'));
    line();
  }
  function line() {
    var box = out.querySelector('.rw-line'), m = matches[sel];
    if (!box || !m) return;
    box.textContent = '';
    box.appendChild(el('i', null, 'Priced line, straight from the rate card'));
    box.appendChild(el('b', null, m.name));
    box.appendChild(el('span', null, m.q + ' ' + m.unit + ' × ' + money(m.rate)));
    box.appendChild(el('span', 'am', money(m.q * m.rate)));
  }

  var deb = 0;
  input.addEventListener('input', function () { clearTimeout(deb); deb = setTimeout(function () { search(input.value); }, 140); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(deb); search(input.value); } });
  tries.forEach(function (b) {
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () { var q = b.dataset.q; input.value = q === query ? '' : q; search(input.value); });
  });

  /* ---- draw on view, re-lay on resize ---- */
  layout();
  if (reduce || !hasIO) { revealed = true; kick(); }
  else {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { revealAt = performance.now(); kick(); io.disconnect(); } }, { threshold: .2 });
    io.observe(cv);
  }
  var rq = 0, lastW = 0;
  addEventListener('resize', function () {
    if (rq) return;
    rq = requestAnimationFrame(function () { rq = 0; var w = Math.round(cv.parentNode.clientWidth); if (w !== lastW) { lastW = w; layout(); kick(); } });
  });
  lastW = W;
  fig.dataset.items = String(items.length); fig.dataset.sections = String(secs.length);
})();
