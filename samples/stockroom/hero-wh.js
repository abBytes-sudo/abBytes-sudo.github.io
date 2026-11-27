/* Stockroom — the hero: the shelf lights up. A deal is won in the CRM, its ticket is stamped, the bins that hold the
   stock glow, the pick walk is drawn from the dock and the cartons leave. Three orders, in turn. */
(function () {
  'use strict';
  var host = document.getElementById('hero-wh'); if (!host || !window.Wh) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); }, ticket = $('ticket'), stamp = $('stamp');
  // Bhiwandi: pallet racking A (8 bins), shelving B (6), textiles C (4); fill levels as on an ordinary Tuesday
  var FILL = { A: [.83, .5, 1, .67, .33, .83, .17, .67], B: [.67, 1, .5, .83, .33, .67], C: [.83, .5, .67, .33] }, bins = [];
  Object.keys(FILL).forEach(function (z) { FILL[z].forEach(function (f, i) { bins.push({ id: 'BHW-' + z + '-0' + (i + 1), zone: z, n: i + 1, fill: f }); }); });
  var ORDERS = [
    { id: 'SO-2265', to: 'Kora Hotels · Pune', lines: [['12 × Oak dining chair', 'A-03'], ['4 × Brass pendant lamp', 'B-02'], ['2 × Linen floor cushion', 'C-01']] },
    { id: 'SO-2266', to: 'Asha Interiors · Mumbai', lines: [['6 × Walnut side table', 'A-06'], ['8 × Opal wall sconce', 'B-04'], ['10 × Wool throw', 'C-03']] },
    { id: 'SO-2267', to: 'Terrace Café Co. · Thane', lines: [['20 × Cane bar stool', 'A-01'], ['3 × Arc floor lamp', 'B-06'], ['12 × Seat pad', 'C-02']] }
  ];
  var wh = window.Wh.render(host, { bins: bins, label: 'The Bhiwandi warehouse: three rows of racking, eighteen bins, cartons stacked to each bin’s stock' });
  var k = 0, timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function show(o) {
    $('tk-id').textContent = o.id; $('tk-to').textContent = o.to;
    $('tk-l').innerHTML = o.lines.map(function (l) { return '<li><i></i><span></span><code></code></li>'; }).join('');
    [].forEach.call($('tk-l').children, function (li, i) { li.children[1].textContent = o.lines[i][0]; li.children[2].textContent = o.lines[i][1]; });
  }
  function run() {
    var o = ORDERS[k % ORDERS.length], ids = o.lines.map(function (l) { return 'BHW-' + l[1]; }); k++;
    wh.clear(); show(o); ticket.className = 'ticket'; $('tk-st').textContent = 'Listening for won deals';
    if (reduce) { ticket.className = 'ticket won held'; $('tk-st').textContent = 'Stock held · 3 bins'; ids.forEach(function (id) { var n = host.querySelector('[data-bin="' + id + '"]'); if (n) n.classList.add('glow'); }); return; }
    later(function () { ticket.classList.add('won'); $('tk-st').textContent = 'Won in the CRM · 11:02'; }, 900);
    later(function () { wh.glow(ids); ticket.classList.add('held'); $('tk-st').textContent = 'Stock held · 3 bins'; }, 1700);
    later(function () { $('tk-st').textContent = 'Picking · walk order from the dock'; wh.pick(ids); }, 3600);
    o.lines.forEach(function (_, i) { later(function () { var li = $('tk-l').children[i]; if (li) li.classList.add('done'); }, 3600 + 500 + (i + 1) * 550); });
    later(function () { ticket.classList.add('out'); $('tk-st').textContent = 'Packed · on the 4 pm truck'; }, 6600);
    later(run, 9400);
  }
  var started = false;
  function go() { if (started) return; started = true; run(); }
  if (window.IntersectionObserver && !reduce) {
    new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) go(); else { started = false; timers.forEach(clearTimeout); timers = []; } }); }, { threshold: .2 }).observe(host);
  } else go();
})();
