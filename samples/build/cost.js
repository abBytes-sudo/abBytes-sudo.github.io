/* Sthira · the build-cost formula, shared by the estimator, the home page's mini estimate and "Scroll to build yours".
   Rates are what we charged on projects handed over in the last twelve months; the programme is in weeks. */
(function () {
  'use strict';
  var D = window.STHIRA;

  function calc(s) {
    var city = D.CITIES.filter(function (c) { return c.id === s.city; })[0], tier = D.TIERS.filter(function (t) { return t.id === s.tier; })[0];
    var rate = tier.rate * city.k * (s.type === 'commercial' ? 1.06 : 1) * (1 + Math.max(0, s.floors - 2) * 0.025);
    var build = rate * s.area, extras = [];
    var plate = s.area / s.floors;
    if (s.x.indexOf('basement') > -1) extras.push(['Basement (one level)', plate * 2400 * city.k]);
    if (s.x.indexOf('lift') > -1) extras.push(['Passenger lift, ' + (s.floors + 1) + ' stops', 900000 + s.floors * 85000]);
    if (s.x.indexOf('interiors') > -1) extras.push(['Interiors and joinery', s.area * tier.int * city.k * 0.85]);
    if (s.x.indexOf('solar') > -1) extras.push(['Rooftop solar, 5 kW', 340000]);
    if (s.x.indexOf('landscape') > -1) extras.push(['Landscape', Math.max(250000, plate * 0.6 * 420)]);
    if (s.x.indexOf('design') > -1) extras.push(['Design and approvals', build * 0.045]);
    var total = build + extras.reduce(function (a, e) { return a + e[1]; }, 0);
    // programme in weeks
    var w = {
      design: s.x.indexOf('design') > -1 ? 10 : 0,
      found: 4 + Math.ceil(plate / 1500) + (s.x.indexOf('basement') > -1 ? 6 : 0),
      frame: s.floors * 3 + 1,
      walls: 4 + Math.ceil(s.area / 1800),
      mep: 8 + Math.ceil(s.area / 1500),
      facade: 4 + Math.ceil(s.floors * 0.8),
      finish: 8 + Math.ceil(s.area / 1400) + (s.x.indexOf('interiors') > -1 ? 6 : 0),
      land: s.x.indexOf('landscape') > -1 ? 4 : 2,
    };
    var tasks = [], t = 0;
    function add(name, start, len, hv) { tasks.push({ name: name, s: start, l: len, hv: hv }); return start + len; }
    var a = add('Design and approvals', 0, w.design, false);
    var b = add('Foundation', a, w.found);
    var c = add('Frame: columns and slabs', b, w.frame);
    var d = add('Walls', c - 1, w.walls);
    var e = add('MEP rough-in', d - Math.ceil(w.walls / 2), w.mep);
    add('Windows and facade', d, w.facade);
    var g = add('Flooring and finishes', e - 3, w.finish);
    var h = add('Landscape, snag, handover', g - 1, w.land + 2, true);
    var weeks = h, months = Math.ceil(weeks / 4.33);
    var pays = [0, a + 0.1, b, b + Math.round(w.frame / 2), c, d + 1, e, g, h].map(function (x) { return x; });
    return { rate: rate, total: total, build: build, extras: extras, tasks: tasks, weeks: weeks, months: months, pays: pays, city: city, tier: tier };
  }

  function range(lo, hi) {
    if (hi >= 1e7) return '₹' + (lo / 1e7).toFixed(2) + '–' + (hi / 1e7).toFixed(2) + ' Cr';
    return '₹' + Math.round(lo / 1e5) + '–' + Math.round(hi / 1e5) + ' L';
  }

  // the nine stage payments, at the milestones in calc().pays, as shares of the contract (they add up to 100)
  var PAYS = [['Contract signed', 10], ['Approvals in, site starts', 10], ['Foundation complete', 15], ['Frame half way', 10], ['Roof slab cast', 15], ['Walls complete', 10], ['Services roughed in', 10], ['Finishes complete', 12], ['Handover and keys', 8]];

  window.SthiraCost = { calc: calc, range: range, PAYS: PAYS };
})();
