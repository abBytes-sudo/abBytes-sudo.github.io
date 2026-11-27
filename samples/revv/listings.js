/* Revv listings: plain-words search (including a monthly budget), filters (sidebar / bottom sheet), quick chips, sort, compare. */
(function () {
  'use strict';
  var R = window.Revv, D = window.REVV_DATA, $ = R.$, $$ = R.$$;
  var ALL = R.listings();
  var BODIES = { bike: ['superbike', 'supersport', 'sport', 'naked', 'cafe', 'retro', 'cruiser', 'tourer', 'adventure', 'commuter', 'scooter', 'electric'], car: ['hatchback', 'hatch', 'sedan', 'csuv', 'suv', 'coupe', 'roadster', 'gt'] };
  var FUELS = ['Petrol', 'Diesel', 'Electric'], TRANS = ['Manual', 'Automatic'];
  var S = blank();
  function blank() { return { type: '', bodies: [], min: 0, max: 0, mo: 0, km: 0, year: 0, owners: 0, fuels: [], trans: [], cities: [], dealer: '', cc: 0, make: '', model3d: false, saved: false, drop: false, fresh: false, sort: 'rec' }; }

  // ---------- plain-words parser ----------
  var CITY_ALIAS = { bangalore: 'Bengaluru', bengaluru: 'Bengaluru', blr: 'Bengaluru', mumbai: 'Mumbai', bombay: 'Mumbai', delhi: 'Delhi NCR', ncr: 'Delhi NCR', gurgaon: 'Delhi NCR', gurugram: 'Delhi NCR', noida: 'Delhi NCR', pune: 'Pune', hyderabad: 'Hyderabad', chennai: 'Chennai', madras: 'Chennai', goa: 'Goa', panaji: 'Goa', panjim: 'Goa', kochi: 'Kochi', cochin: 'Kochi' };
  // matched in order; a phrase that matches is taken out so "hot hatch" is not also a plain hatchback, nor "compact SUV" a big one
  var BODY_WORDS = [[/super ?bikes?|litre ?bikes?/, 'superbike', 'bike'], [/supersports?|middleweight sport/, 'supersport', 'bike'], [/sport ?bikes?|faired/, 'sport', 'bike'], [/naked|streetfighter|street bike/, 'naked', 'bike'], [/caf[eé]( racer)?s?/, 'cafe', 'bike'], [/retro|classics?|thumpers?/, 'retro', 'bike'], [/cruisers?|bobbers?/, 'cruiser', 'bike'], [/tourers?|touring|sport[- ]tourers?/, 'tourer', 'bike'], [/adventure|adv\b|off[- ]?road|dual[- ]sport/, 'adventure', 'bike'], [/commuters?|daily rider/, 'commuter', 'bike'], [/scooters?|scooty|mopeds?/, 'scooter', 'bike'],
    [/sedans?|saloons?/, 'sedan', 'car'], [/hot ?hatch(back)?s?/, 'hatch', 'car'], [/hatch(back)?s?/, 'hatchback', 'car'], [/(compact|small|mini|sub[- ]?4m?) ?suvs?|crossovers?/, 'csuv', 'car'], [/suvs?|7[- ]seaters?|4x4/, 'suv', 'car'], [/coup[eé]s?/, 'coupe', 'car'], [/roadsters?|convertibles?|cabrio/, 'roadster', 'car'], [/\bgt\b|grand tourer/, 'gt', 'car']];
  function money(n, unit) { n = parseFloat(n); unit = (unit || '').toLowerCase(); if (/^c/.test(unit)) return n * 1e7; if (/^k/.test(unit)) return n * 1e3; if (/^l/.test(unit)) return n * 1e5; return n < 300 ? n * 1e5 : n; }
  function parse(q) {
    var s = ' ' + q.toLowerCase().replace(/(\d),(?=\d)/g, '$1').replace(/[,₹]/g, ' ').replace(/\s+/g, ' ') + ' ', o = blank(), m;
    var U = '(l|lakh|lakhs|lac|lacs|cr|crore|crores|k)?';
    // a monthly budget first: "under 12,000 a month", "12k per month", "emi under 15k", "8000 pm"
    if ((m = s.match(/(?:(?:under|below|less than|upto|up to|within|max|about|around|budget)\s*)?(\d+(?:\.\d+)?)\s*(k|thousand)?\s*(?:\/|a|per|every|each)?\s*(?:month|months|mo|mth|pm|monthly)\b/)) || (m = s.match(/\b(?:emi|monthly)\s*(?:of|under|below|upto|up to|within|max|around|about)?\s*(\d+(?:\.\d+)?)\s*(k|thousand)?/))) {
      var mv = parseFloat(m[1]) * (m[2] ? 1000 : 1); o.mo = mv < 1000 ? mv * 1000 : mv; s = s.replace(m[0], ' '); }
    if ((m = s.match(new RegExp('(\\d+(?:\\.\\d+)?)\\s*(?:-|to)\\s*(\\d+(?:\\.\\d+)?)\\s*' + U + '\\b')))) { o.min = money(m[1], m[3]); o.max = money(m[2], m[3]); s = s.replace(m[0], ' '); }
    if ((m = s.match(/(?:under|below|less than|upto|up to|within|max|<)\s*(\d+(?:\.\d+)?)\s*(?:k\s*)?(?:km|kms|kilometres|kilometers)\b/))) { o.km = parseFloat(m[1]) * (/\d\s*k/.test(m[0]) || parseFloat(m[1]) < 200 ? 1000 : 1); s = s.replace(m[0], ' '); }
    if ((m = s.match(new RegExp('(?:under|below|less than|upto|up to|within|max|budget|<)\\s*(\\d+(?:\\.\\d+)?)\\s*' + U + '\\b')))) { o.max = money(m[1], m[2]); s = s.replace(m[0], ' '); }
    if ((m = s.match(new RegExp('(?:over|above|more than|from|min|>)\\s*(\\d+(?:\\.\\d+)?)\\s*' + U + '\\b'))) && !/20\d\d/.test(m[1])) { o.min = money(m[1], m[2]); s = s.replace(m[0], ' '); }
    if ((m = s.match(/(?:after|from|since|newer than|or newer)\s*(20\d\d)|(20\d\d)\s*(?:\+|or newer|onwards)/))) { o.year = +(m[1] || m[2]); s = s.replace(m[0], ' '); }
    else if ((m = s.match(/\b(20[12]\d)\b/))) { o.year = +m[1]; s = s.replace(m[0], ' '); }
    if ((m = s.match(/\b(1st|first|single|one)[ -]owner\b/))) { o.owners = 1; s = s.replace(m[0], ' '); }
    if (/\b(electric|ev|battery)\b/.test(s)) { o.fuels = ['Electric']; s = s.replace(/\b(electric|ev|battery)\b/, ' '); }
    if (/\bdiesel\b/.test(s)) o.fuels.push('Diesel');
    if (/\bpetrol\b/.test(s)) o.fuels.push('Petrol');
    if (/\b(auto|automatic|dct|dsg|cvt)\b/.test(s)) o.trans = ['Automatic'];
    if (/\bmanual\b/.test(s)) o.trans = ['Manual'];
    Object.keys(CITY_ALIAS).forEach(function (k) { if (new RegExp('\\b' + k + '\\b').test(s) && o.cities.indexOf(CITY_ALIAS[k]) < 0) o.cities.push(CITY_ALIAS[k]); });
    BODY_WORDS.forEach(function (b) { var hit = s.match(b[0]); if (hit) { s = s.replace(hit[0], ' '); if (o.bodies.indexOf(b[1]) < 0) o.bodies.push(b[1]); o.type = o.type && o.type !== b[2] ? '' : b[2]; } });
    if (!o.type && /\b(bikes?|motorcycles?|motorbikes?)\b/.test(s)) o.type = 'bike';
    if (!o.type && /\bcars?\b/.test(s)) o.type = 'car';
    if (o.fuels.length === 1 && o.fuels[0] === 'Electric' && /\bbike|cafe|caf[eé]/.test(s)) { o.type = 'bike'; }
    if ((m = s.match(/\b(\d{3,4})\s*(?:cc)?\b/)) && +m[1] >= 100 && +m[1] <= 1500) { o.cc = +m[1]; if (!o.type) o.type = 'bike'; }
    if (/\b(3d|3-d|walk-?around|360)\b/.test(s)) o.model3d = true;
    ['kestrel', 'tessaro', 'halvard', 'ishiro', 'moreau', 'varno', 'aurex', 'arka', 'sarvo', 'kesari', 'ashwa', 'sarathi', 'rivetta'].forEach(function (mk) { if (s.indexOf(mk) > -1) o.make = mk; });
    if (/\b(price ?drop(ped)?|reduced|cheaper now)\b/.test(s)) o.drop = true;
    if (/\b(just in|new arrivals?|fresh(ly)? listed|this week)\b/.test(s)) o.fresh = true;
    return o;
  }
  function ccOf(l) { if (l.cc) return l.cc; var m = /(\d{3,4})cc/.exec(R.blurb(l)); return m ? +m[1] : 0; }

  // ---------- filtering ----------
  function match(l) {
    if (S.type && l.type !== S.type) return false;
    if (S.bodies.length && S.bodies.indexOf(l.body) < 0) return false;
    if (S.min && l.price < S.min) return false;
    if (S.max && l.price > S.max) return false;
    if (S.mo && R.monthly(l.price) > S.mo) return false;
    if (S.drop && !(l.was > l.price)) return false;
    if (S.fresh && !(l.age != null && l.age <= 3)) return false;
    if (S.km && l.km > S.km) return false;
    if (S.year && l.year < S.year) return false;
    if (S.owners && l.owners > S.owners) return false;
    if (S.fuels.length && S.fuels.indexOf(l.fuel) < 0) return false;
    if (S.trans.length && S.trans.indexOf(l.trans) < 0) return false;
    if (S.cities.length && S.cities.indexOf(l.city) < 0) return false;
    if (S.dealer && l.dealer !== S.dealer) return false;
    if (S.cc && Math.abs(ccOf(l) - S.cc) > 70) return false;
    if (S.make && l.make.toLowerCase() !== S.make) return false;
    if (S.model3d && !l.model3d) return false;
    if (S.saved && R.wish().indexOf(l.id) < 0) return false;
    return true;
  }
  var SORTS = { rec: function (a, b) { return (b.score - a.score) || (b.year - a.year); }, 'p-asc': function (a, b) { return a.price - b.price; }, 'p-desc': function (a, b) { return b.price - a.price; }, new: function (a, b) { return b.year - a.year || a.km - b.km; }, km: function (a, b) { return a.km - b.km; }, score: function (a, b) { return b.score - a.score; } };

  // ---------- render ----------
  var grid = $('#grid');
  function countWith(key, val) { var keep = S[key]; S[key] = Array.isArray(keep) ? [val] : val; var n = ALL.filter(match).length; S[key] = keep; return n; }
  function buildChecks() {
    var bodies = S.type ? BODIES[S.type] : BODIES.bike.concat(BODIES.car);
    $('#f-body').innerHTML = bodies.map(function (b) { return '<label><input type="checkbox" name="body" value="' + b + '"' + (S.bodies.indexOf(b) > -1 ? ' checked' : '') + '>' + D.BODY[b] + '<small>' + countWith('bodies', b) + '</small></label>'; }).join('');
    $('#f-fuel').innerHTML = FUELS.map(function (f) { return '<label><input type="checkbox" name="fuel" value="' + f + '"' + (S.fuels.indexOf(f) > -1 ? ' checked' : '') + '>' + f + '<small>' + countWith('fuels', f) + '</small></label>'; }).join('');
    $('#f-trans').innerHTML = TRANS.map(function (f) { return '<label><input type="checkbox" name="trans" value="' + f + '"' + (S.trans.indexOf(f) > -1 ? ' checked' : '') + '>' + f + '<small>' + countWith('trans', f) + '</small></label>'; }).join('');
    $('#f-city').innerHTML = D.CITIES.map(function (c) { return '<label><input type="checkbox" name="city" value="' + c + '"' + (S.cities.indexOf(c) > -1 ? ' checked' : '') + '>' + c + '<small>' + countWith('cities', c) + '</small></label>'; }).join('');
  }
  function syncForm() {
    var f = $('#ff');
    f.querySelector('[name=type][value="' + S.type + '"]').checked = true;
    f.querySelector('[name=owners][value="' + (S.owners || '') + '"]').checked = true;
    $('#f-min').value = S.min ? String(nearest($('#f-min'), S.min)) : '';
    $('#f-max').value = S.max ? String(nearest($('#f-max'), S.max)) : '';
    $('#f-mo').value = S.mo ? String(nearest($('#f-mo'), S.mo, true)) : '';
    $('#f-km').value = S.km || 50000; $('#f-kmv').textContent = S.km ? R.km(S.km) : 'Any';
    $('#f-year').value = S.year && S.year >= 2018 ? String(S.year) : '';
    f.querySelector('[name=model3d]').checked = S.model3d; f.querySelector('[name=saved]').checked = S.saved;
    $('#sort').value = S.sort;
    buildChecks();
  }
  function nearest(sel, v, full) { var opts = [].slice.call(sel.options).map(function (o) { return +o.value; }).filter(Boolean); if (opts.indexOf(v) > -1) return v; var o = document.createElement('option'); o.value = v; o.textContent = full ? R.inrFull(v) + ' a month' : R.inr(v); sel.appendChild(o); return v; }
  // quick chips above the results: price dropped, just in
  function quick() {
    var q = $('#qchips'); if (!q) return;
    var keep = [S.drop, S.fresh]; S.drop = true; S.fresh = false; var nd = ALL.filter(match).length; S.drop = false; S.fresh = true; var nf = ALL.filter(match).length; S.drop = keep[0]; S.fresh = keep[1];
    q.innerHTML = '<button type="button" class="chip" data-q="drop" aria-pressed="' + S.drop + '">Price dropped <b>' + nd + '</b></button><button type="button" class="chip" data-q="fresh" aria-pressed="' + S.fresh + '">Just in <b>' + nf + '</b></button>';
  }
  function chips() {
    var c = [];
    if (S.type) c.push(['type', S.type === 'bike' ? 'Bikes' : 'Cars']);
    S.bodies.forEach(function (b) { c.push(['bodies:' + b, D.BODY[b]]); });
    if (S.make) c.push(['make', S.make[0].toUpperCase() + S.make.slice(1)]);
    if (S.cc) c.push(['cc', '~' + S.cc + 'cc']);
    if (S.min && S.max) c.push(['price', R.inr(S.min) + '–' + R.inr(S.max).replace('₹', '')]); else if (S.max) c.push(['max', 'Under ' + R.inr(S.max)]); else if (S.min) c.push(['min', 'From ' + R.inr(S.min)]);
    if (S.mo) c.push(['mo', 'Under ' + R.inrFull(S.mo) + ' a month']);
    if (S.drop) c.push(['drop', 'Price dropped']); if (S.fresh) c.push(['fresh', 'Just in']);
    if (S.km) c.push(['km', 'Under ' + R.km(S.km)]);
    if (S.year) c.push(['year', S.year + ' or newer']);
    if (S.owners) c.push(['owners', S.owners === 1 ? '1st owner' : 'Up to 2 owners']);
    S.fuels.forEach(function (f) { c.push(['fuels:' + f, f]); });
    S.trans.forEach(function (f) { c.push(['trans:' + f, f]); });
    S.cities.forEach(function (f) { c.push(['cities:' + f, f]); });
    if (S.dealer) c.push(['dealer', R.dealer(S.dealer).name]);
    if (S.model3d) c.push(['model3d', '3D walk-around']);
    if (S.saved) c.push(['saved', 'Saved']);
    $('#und').innerHTML = c.length ? '<span class="k">Showing</span>' + c.map(function (x) { return '<span class="chip">' + R.esc(x[1]) + '<button type="button" data-un="' + x[0] + '" aria-label="Remove ' + R.esc(x[1]) + '">×</button></span>'; }).join('') + (c.length > 1 ? '<button type="button" class="chip" data-un="all">Clear all</button>' : '') : '';
  }
  var reduceM = matchMedia('(prefers-reduced-motion: reduce)').matches, rt = 0;
  function skel(n) { var h = ''; for (var i = 0; i < n; i++) h += '<div class="card sk" aria-hidden="true"><div class="card-img"></div><i></i><i></i><i></i><i></i></div>'; return h; }
  function render(animate) {
    if (animate && !reduceM) { grid.innerHTML = skel(Math.min(6, Math.max(3, ALL.filter(match).length))); grid.setAttribute('aria-busy', 'true'); clearTimeout(rt); rt = setTimeout(function () { grid.removeAttribute('aria-busy'); draw(true); }, 420); chips(); writeURL(); return; }
    draw(false);
  }
  function draw(animate) {
    var res = ALL.filter(match).sort(SORTS[S.sort] || SORTS.rec);
    $('#count').innerHTML = '<b>' + res.length + '</b> certified ' + (S.type === 'bike' ? 'bikes' : S.type === 'car' ? 'cars' : 'vehicles');
    $('#fdone-n').textContent = res.length;
    grid.innerHTML = res.length ? res.map(function (l, i) { return R.card(l, i); }).join('') :
      emptyState();
    chips(); quick(); R.refreshCounts(); writeURL();
    if (animate && window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.from(grid.children, { y: 30, autoAlpha: 0, duration: 0.8, ease: 'power4.out', stagger: 0.04, clearProps: 'all' });
  }
  function emptyState() {
    // relax the search step by step and show the nearest real stock instead of a dead end
    var near = ALL.filter(function (l) { return (!S.type || l.type === S.type); }).sort(function (a, b) { var t = S.max || S.min || (S.mo ? S.mo / 0.0172 : 0); return t ? Math.abs(a.price - t) - Math.abs(b.price - t) : b.score - a.score; }).slice(0, 3);
    var why = [];
    if (S.mo && ALL.filter(function (l) { return (!S.type || l.type === S.type) && R.monthly(l.price) <= S.mo; }).length === 0) why.push('nothing ' + (S.type ? 'of that type ' : '') + 'comes in under ' + R.inrFull(S.mo) + ' a month');
    if (S.max && ALL.filter(function (l) { return (!S.type || l.type === S.type) && l.price <= S.max; }).length === 0) why.push('nothing ' + (S.type === 'bike' ? 'on two wheels' : S.type === 'car' ? 'on four wheels' : '') + ' is certified under ' + R.inr(S.max) + ' right now');
    if (S.cities.length) why.push(S.cities.join(' and ') + ' has ' + ALL.filter(function (l) { return S.cities.indexOf(l.city) > -1; }).length + ' certified listings in total');
    grid.innerHTML = '<div class="empty"><p class="disp">Nothing yet.</p><p>No certified listing matches all of that' + (why.length ? ': ' + R.esc(why.join('; ')) : '') + '. Take a filter off above, or <a class="ul" href="sell.html">tell us what you want</a> and we\'ll alert you when one passes inspection.</p>' +
      (near.length ? '<p class="k" style="margin:36px 0 18px">Closest certified matches</p><div class="grid">' + near.map(function (l) { return R.card(l); }).join('') + '</div>' : '') + '</div>';
  }
  function writeURL() {
    var p = new URLSearchParams();
    if (S.type) p.set('type', S.type); if (S.bodies.length) p.set('body', S.bodies.join(',')); if (S.min) p.set('min', S.min); if (S.max) p.set('max', S.max); if (S.mo) p.set('mo', S.mo); if (S.drop) p.set('drop', 1); if (S.fresh) p.set('fresh', 1);
    if (S.km) p.set('km', S.km); if (S.year) p.set('year', S.year); if (S.owners) p.set('owners', S.owners); if (S.fuels.length) p.set('fuel', S.fuels.join(','));
    if (S.trans.length) p.set('trans', S.trans.join(',')); if (S.cities.length) p.set('city', S.cities.join(',')); if (S.dealer) p.set('dealer', S.dealer);
    if (S.cc) p.set('cc', S.cc); if (S.make) p.set('make', S.make); if (S.model3d) p.set('model3d', 1); if (S.saved) p.set('saved', 1); if (S.sort !== 'rec') p.set('sort', S.sort);
    var q = p.toString(); history.replaceState(null, '', q ? '?' + q : location.pathname);
  }
  function readURL() {
    var p = new URLSearchParams(location.search), arr = function (k) { return p.get(k) ? p.get(k).split(',') : []; };
    S.type = p.get('type') || ''; S.bodies = arr('body'); S.min = +p.get('min') || 0; S.max = +p.get('max') || 0; S.mo = +p.get('mo') || 0; S.drop = !!p.get('drop'); S.fresh = !!p.get('fresh'); S.km = +p.get('km') || 0; S.year = +p.get('year') || 0;
    S.owners = +p.get('owners') || 0; S.fuels = arr('fuel'); S.trans = arr('trans'); S.cities = arr('city'); S.dealer = p.get('dealer') || ''; S.cc = +p.get('cc') || 0;
    S.make = p.get('make') || ''; S.model3d = !!p.get('model3d'); S.saved = !!p.get('saved'); S.sort = p.get('sort') || 'rec';
    if (p.get('q')) { $('#q').value = p.get('q'); Object.assign(S, parse(p.get('q'))); }
  }

  // ---------- events ----------
  $('#nl').addEventListener('submit', function (e) { e.preventDefault(); var q = $('#q').value.trim(); var sort = S.sort; S = q ? parse(q) : blank(); S.sort = sort; syncForm(); render(true); });
  $$('[data-eg]').forEach(function (b) { b.addEventListener('click', function () { $('#q').value = b.dataset.eg; $('#nl').requestSubmit(); }); });
  $('#ff').addEventListener('change', function (e) {
    var t = e.target, n = t.name;
    if (n === 'type') { S.type = t.value; S.bodies = S.bodies.filter(function (b) { return !S.type || BODIES[S.type].indexOf(b) > -1; }); }
    else if (n === 'body' || n === 'fuel' || n === 'trans' || n === 'city') { var key = { body: 'bodies', fuel: 'fuels', trans: 'trans', city: 'cities' }[n]; S[key] = $$('#ff [name=' + n + ']:checked').map(function (x) { return x.value; }); }
    else if (n === 'min') S.min = +t.value || 0; else if (n === 'max') S.max = +t.value || 0; else if (n === 'mo') S.mo = +t.value || 0;
    else if (n === 'km') S.km = +t.value >= 50000 ? 0 : +t.value;
    else if (n === 'year') S.year = +t.value || 0; else if (n === 'owners') S.owners = +t.value || 0;
    else if (n === 'model3d') S.model3d = t.checked; else if (n === 'saved') S.saved = t.checked;
    if (n !== 'body' && n !== 'fuel' && n !== 'trans' && n !== 'city') syncForm(); else buildChecks();
    render(false);
  });
  $('#f-km').addEventListener('input', function (e) { $('#f-kmv').textContent = +e.target.value >= 50000 ? 'Any' : R.km(+e.target.value); });
  $('#sort').addEventListener('change', function (e) { S.sort = e.target.value; render(true); });
  $('#und').addEventListener('click', function (e) {
    var b = e.target.closest('[data-un]'); if (!b) return; var k = b.dataset.un;
    if (k === 'all') { var so = S.sort; S = blank(); S.sort = so; $('#q').value = ''; }
    else if (k.indexOf(':') > -1) { var kk = k.split(':'); S[kk[0]] = S[kk[0]].filter(function (x) { return x !== kk[1]; }); }
    else if (k === 'price') { S.min = 0; S.max = 0; } else if (k === 'type') { S.type = ''; } else if (k === 'model3d' || k === 'saved' || k === 'drop' || k === 'fresh') S[k] = false; else S[k] = typeof S[k] === 'number' ? 0 : '';
    syncForm(); render(true);
  });
  var qc = $('#qchips'); if (qc) qc.addEventListener('click', function (e) { var b = e.target.closest('[data-q]'); if (!b) return; S[b.dataset.q] = !S[b.dataset.q]; render(true); });
  // your showroom: one city and (often) one kind of vehicle, so those filters would only show zeros
  var shop = R.shop();
  if (shop) { var fc = $('#f-city'); if (fc) fc.closest('fieldset').hidden = true; if (shop.deals !== 'both') { var ft = $('#ff [name=type]'); if (ft) ft.closest('fieldset').hidden = true; } }
  // bottom sheet
  var fl = $('#filters'), scrim = $('#scrim'), fopen = $('#fopen');
  function sheet(open) { fl.classList.toggle('open', open); scrim.hidden = !open; fopen.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : ''; if (open) $('#fclose').focus(); else fopen.focus(); }
  fopen.addEventListener('click', function () { sheet(true); });
  $('#fclose').addEventListener('click', function () { sheet(false); });
  $('#fdone').addEventListener('click', function () { sheet(false); });
  scrim.addEventListener('click', function () { sheet(false); });
  $('#freset').addEventListener('click', function () { var so = S.sort; S = blank(); S.sort = so; $('#q').value = ''; syncForm(); render(true); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && fl.classList.contains('open')) sheet(false); });
  // re-render when the wishlist changes and "saved only" is on
  document.addEventListener('click', function (e) { if (S.saved && e.target.closest('[data-wish]')) setTimeout(function () { render(false); }, 0); });

  readURL(); syncForm(); render(false);
})();
