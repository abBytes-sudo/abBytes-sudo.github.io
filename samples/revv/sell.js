/* Revv sell flow: type -> model -> year -> km -> condition -> estimate -> book inspection (lands in Admin as a seller booking). */
(function () {
  'use strict';
  var R = window.Revv, D = window.REVV_DATA, $ = R.$, $$ = R.$$;
  var MODELS = {
    bike: [['Tessaro V4 R', 'V4 superbike', 3200000], ['Halvard RR 1000', 'Inline-four superbike', 2650000], ['Tessaro SS 950', 'Sport-tourer', 1700000], ['Ishiro R6 S', '600 supersport', 1450000], ['Ishiro N9', 'Triple naked', 1120000], ['Varno 790 Street', 'Twin naked', 1050000], ['Halvard Bolt 950', 'V-twin bobber', 900000], ['Aurex E-Café', 'Electric café racer', 650000], ['Moreau 650 Café', '650 twin café racer', 390000], ['Varno 390 Street', '390 single naked', 310000], ['Moreau 350 Classic', '350 single roadster', 220000]],
    car: [['Kestrel GT Coupé', 'Electric GT', 9500000], ['Halvard Q Coupé 50', 'Luxury SUV coupé', 12500000], ['Tessaro C Wide 4.0', 'V8 coupé', 14000000], ['Varno Atlas V6', '3-row SUV', 4800000], ['Ishiro Type-S', 'Hot hatch', 4500000], ['Varno Vela N', 'Performance sedan', 3200000], ['Moreau Terra 7', '7-seat SUV', 3200000], ['Aurex S4 1.6T', 'Mid-size sedan', 2100000], ['Ishiro City 1.5', 'Compact sedan', 1300000], ['Moreau Urban 1.2T', 'Compact SUV', 1100000], ['Aurex Mini 1.2', 'Hatchback', 750000]]
  };
  var COND = [['showroom', 'Showroom', 'No marks, every service on time, original parts.', 1.04], ['good', 'Good', 'Minor scuffs, everything works, service book mostly stamped.', 1], ['fair', 'Fair', 'Visible wear, one or two things due, a panel repainted.', 0.89], ['work', 'Needs work', 'Accident history, warning lights or overdue major service.', 0.76]];
  var S = { type: '', model: null, year: 0, km: 0, cond: '' };
  var STEPS = ['Type', 'Model', 'Year', 'Kilometres', 'Condition', 'Estimate', 'Inspection'];
  var step = 0;

  function value() {
    var base = S.model[2], age = Math.max(0, new Date().getFullYear() - S.year);
    var dep = S.type === 'bike' ? (age ? 0.85 * Math.pow(0.9, age - 1) : 0.92) : (age ? 0.82 * Math.pow(0.89, age - 1) : 0.9);
    var exp = (S.type === 'bike' ? 6000 : 11000) * Math.max(1, age), r = S.km / exp;
    var kmF = r < 0.6 ? 1.04 : r < 1.2 ? 1 : r < 1.8 ? 0.94 : 0.86;
    var c = COND.filter(function (x) { return x[0] === S.cond; })[0][3];
    var mid = base * dep * kmF * c; return { lo: Math.round(mid * 0.94 / 1000) * 1000, hi: Math.round(mid * 1.06 / 1000) * 1000, mid: mid, kmF: kmF, age: age };
  }
  function renderSteps() {
    var vals = [S.type === 'bike' ? 'Bike' : S.type === 'car' ? 'Car' : '', S.model ? S.model[0] : '', S.year || '', S.km ? R.km(S.km) : (step > 3 ? R.km(S.km) : ''), S.cond ? COND.filter(function (x) { return x[0] === S.cond; })[0][1] : '', '', ''];
    $('#steps').innerHTML = STEPS.map(function (s, i) { return '<li class="' + (i === step ? 'on' : i < step ? 'done' : '') + '"' + (i === step ? ' aria-current="step"' : '') + '><b>' + (i < step ? '✓' : i + 1) + '</b>' + s + '<span class="v">' + R.esc(vals[i]) + '</span></li>'; }).join('');
  }
  function nav(canNext, nextLabel) { return '<div class="wiz-nav">' + (step ? '<button type="button" class="btn ghost" data-back>← Back</button>' : '') + (nextLabel !== false ? '<button type="button" class="btn" data-next' + (canNext ? '' : ' disabled') + '>' + (nextLabel || 'Continue') + ' <span class="ar" aria-hidden="true">→</span></button>' : '') + '</div>'; }
  var userNav = false;
  function pane(html) { $('#panes').innerHTML = '<div class="pane on">' + html + '</div>'; renderSteps(); var h = $('#panes h2'); if (h && userNav) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }

  var VIEWS = [
    function () { pane('<h2 class="disp">Two wheels <span class="ser">or four?</span></h2><div class="opts" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))">' +
      '<button type="button" class="opt big" data-type="bike" aria-pressed="' + (S.type === 'bike') + '"><img src="photos/b-noir-s.jpg" alt="" width="720" height="480"><b>Bike</b><span>Superbikes, nakeds, café racers, cruisers, electric</span></button>' +
      '<button type="button" class="opt big" data-type="car" aria-pressed="' + (S.type === 'car') + '"><img src="photos/c-sage-s.jpg" alt="" width="720" height="415"><b>Car</b><span>Hatchbacks to grand tourers</span></button></div>' + nav(!!S.type)); },
    function () { pane('<h2 class="disp">Which <span class="ser">model?</span></h2><div class="fld" style="max-width:520px;margin-bottom:18px"><label for="ms">Search models</label><input class="inp" id="ms" type="search" placeholder="Type a make or model" autocomplete="off"></div><div class="opts" id="mlist"></div>' + nav(!!S.model));
      function list(q) { q = (q || '').toLowerCase(); $('#mlist').innerHTML = MODELS[S.type].filter(function (m) { return !q || (m[0] + ' ' + m[1]).toLowerCase().indexOf(q) > -1; }).map(function (m) { return '<button type="button" class="opt" data-model="' + R.esc(m[0]) + '" aria-pressed="' + (S.model && S.model[0] === m[0]) + '"><b>' + R.esc(m[0]) + '</b><span>' + R.esc(m[1]) + ' · new from ' + R.inr(m[2]) + '</span></button>'; }).join('') || '<p class="k">No match. Try a make: Tessaro, Halvard, Ishiro, Moreau, Varno, Aurex, Kestrel.</p>'; }
      list(); $('#ms').addEventListener('input', function (e) { list(e.target.value); }); },
    function () { var y = new Date().getFullYear(), ys = []; for (var i = 0; i < 11; i++) ys.push(y - i);
      pane('<h2 class="disp">Registered <span class="ser">in…</span></h2><div class="opts" style="grid-template-columns:repeat(auto-fill,minmax(110px,1fr))">' + ys.map(function (v) { return '<button type="button" class="opt" style="min-height:76px" data-year="' + v + '" aria-pressed="' + (S.year === v) + '"><b>' + v + '</b></button>'; }).join('') + '</div>' + nav(!!S.year)); },
    function () { if (!S.km) S.km = S.type === 'bike' ? 12000 : 30000; var max = S.type === 'bike' ? 80000 : 150000;
      pane('<h2 class="disp">How far <span class="ser">has it been?</span></h2><div style="max-width:640px"><p class="disp" style="font-size:clamp(48px,7vw,104px);color:var(--sig)" id="kmv" aria-hidden="true">' + R.km(S.km) + '</p><label class="sr" for="kmr">Odometer reading in kilometres</label><input type="range" id="kmr" min="500" max="' + max + '" step="500" value="' + S.km + '"><div class="rv"><span>500 km</span><span>' + R.km(max) + '</span></div><p class="k" style="margin-top:16px">Typical for its age: about ' + R.km((S.type === 'bike' ? 6000 : 11000) * Math.max(1, new Date().getFullYear() - S.year)) + '</p></div>' + nav(true));
      $('#kmr').addEventListener('input', function (e) { S.km = +e.target.value; $('#kmv').textContent = R.km(S.km); renderSteps(); }); },
    function () { pane('<h2 class="disp">Honestly, <span class="ser">how is it?</span></h2><div class="opts" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))">' + COND.map(function (c) { return '<button type="button" class="opt" data-cond="' + c[0] + '" aria-pressed="' + (S.cond === c[0]) + '"><b>' + c[1] + '</b><span>' + c[2] + '</span></button>'; }).join('') + '</div><p class="k" style="margin-top:18px">The inspection confirms this, so there\'s no advantage in rounding up.</p>' + nav(!!S.cond, 'See my range')); },
    function () { var v = value(), lo = v.lo * 0.8, hi = v.hi * 1.15, pos = function (x) { return ((x - lo) / (hi - lo) * 100).toFixed(1) + '%'; };
      pane('<h2 class="disp">Your <span class="ser">range.</span></h2><div class="est"><p class="k">' + R.esc(S.year + ' ' + S.model[0]) + ' · ' + R.km(S.km) + ' · ' + COND.filter(function (x) { return x[0] === S.cond; })[0][1].toLowerCase() + '</p>' +
        '<p class="est-r">' + R.inr(v.lo) + ' <small>to</small> ' + R.inr(v.hi) + '</p>' +
        '<div class="est-bar" aria-hidden="true"><i style="left:' + pos(v.lo) + ';right:calc(100% - ' + pos(v.hi) + ')"></i></div><div class="est-l"><span>Quick sale ' + R.inr(lo) + '</span><span>Private, patient ' + R.inr(hi) + '</span></div>' +
        '<ul><li>— Age: ' + v.age + ' year' + (v.age === 1 ? '' : 's') + ', ' + (S.type === 'bike' ? 'bikes' : 'cars') + ' in this class lose about ' + (S.type === 'bike' ? '10' : '11') + '% a year after the first.</li><li>— Kilometres: ' + (v.kmF > 1 ? 'below average, adds about 4%.' : v.kmF === 1 ? 'about average for its age.' : 'above average, takes ' + Math.round((1 - v.kmF) * 100) + '% off.') + '</li><li>— A clean report usually lands you in the top third of the range.</li></ul>' +
        '<p class="k" style="margin-top:18px">Indicative estimate · not a quote</p></div>' + nav(true, 'Book a free inspection')); },
    function () { var t = new Date(), days = []; for (var i = 1; i <= 5; i++) days.push(new Date(t.getTime() + i * 864e5));
      pane('<h2 class="disp">Book the <span class="ser">inspection.</span></h2><form class="form" id="insf" novalidate style="max-width:720px">' +
        '<div class="row"><div class="fld"><label for="i-city">City</label><select class="sel" id="i-city">' + D.CITIES.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></div><div class="fld"><label for="i-area">Area or pin code</label><input class="inp" id="i-area" autocomplete="postal-code" placeholder="Indiranagar or 560038" aria-describedby="i-area-e"><p class="ferr" id="i-area-e"></p></div></div>' +
        '<div class="fld"><span class="lab" id="i-day-l">Day</span><div class="days" role="group" aria-labelledby="i-day-l" style="grid-template-columns:repeat(5,1fr)" id="i-days">' + days.map(function (d, i) { return '<button type="button" data-d="' + d.toDateString() + '" aria-pressed="' + (i === 0) + '">' + d.toLocaleDateString('en-IN', { weekday: 'short' }) + '<b>' + d.getDate() + '</b></button>'; }).join('') + '</div></div>' +
        '<div class="fld"><span class="lab" id="i-win-l">Window</span><div class="radio-row" role="radiogroup" aria-labelledby="i-win-l"><label><input type="radio" name="win" value="9–12" checked>9 am – 12 pm</label><label><input type="radio" name="win" value="12–3">12 – 3 pm</label><label><input type="radio" name="win" value="3–6">3 – 6 pm</label></div></div>' +
        '<div class="row"><div class="fld"><label for="i-name">Your name</label><input class="inp" id="i-name" autocomplete="name" aria-describedby="i-name-e"><p class="ferr" id="i-name-e"></p></div><div class="fld"><label for="i-phone">Mobile number</label><input class="inp" id="i-phone" inputmode="tel" autocomplete="tel" placeholder="98xxx xxxxx" aria-describedby="i-phone-e"><p class="ferr" id="i-phone-e"></p></div></div>' +
        '<div class="wiz-nav"><button type="button" class="btn ghost" data-back>← Back</button><button type="submit" class="btn">Confirm the visit <span class="ar" aria-hidden="true">→</span></button></div></form>');
      $('#i-days').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; $$('#i-days button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); });
      $('#insf').addEventListener('submit', function (e) {
        e.preventDefault(); var name = $('#i-name').value.trim();
        if (!R.validate([[$('#i-area'), 'area'], [$('#i-name'), 'name'], [$('#i-phone'), 'phone']])) return;
        var v = value(), rec = { id: 'S' + Date.now().toString(36).toUpperCase().slice(-5), type: S.type, model: S.model[0], year: S.year, km: S.km, cond: S.cond, lo: v.lo, hi: v.hi, city: $('#i-city').value, area: $('#i-area').value.trim(), day: $('#i-days [aria-pressed=true]').dataset.d, win: $('#insf [name=win]:checked').value, name: name, at: Date.now(), status: 'booked' };
        var all = R.get(R.K.sellers, []); all.unshift(rec); R.set(R.K.sellers, all);
        step = 7; renderSteps();
        $('#panes').innerHTML = '<div class="pane on"><h2 class="disp" tabindex="-1">See you <span class="ser">' + R.esc(new Date(rec.day).toLocaleDateString('en-IN', { weekday: 'long' })) + '.</span></h2><div class="ok-msg" style="max-width:640px"><b>Booking ' + rec.id + ' confirmed.</b> An inspector will reach ' + R.esc(rec.area + ', ' + rec.city) + ' between ' + rec.win + '. It takes about two hours; you don\'t need to be there for all of it.<br><br>After the report, verified dealers bid within 48 hours. Your instant range was ' + R.inr(rec.lo) + ' to ' + R.inr(rec.hi) + '.</div><div class="wiz-nav"><a class="btn" href="admin.html#sellers">See it in the admin queue →</a><a class="btn ghost" href="listings.html">Browse while you wait</a></div></div>';
        $('#panes h2').focus();
      });
    }
  ];
  function go(i) { step = i; VIEWS[i](); if (i > 0) { var top = $('.wiz').getBoundingClientRect().top + scrollY - 90; if (scrollY > top) scrollTo({ top: top, behavior: 'smooth' }); } }
  $('#panes').addEventListener('click', function (e) {
    userNav = true;
    var t = e.target.closest('[data-type],[data-model],[data-year],[data-cond],[data-next],[data-back]'); if (!t) return;
    if (t.hasAttribute('data-back')) return go(step - 1);
    if (t.hasAttribute('data-next')) return go(step + 1);
    if (t.dataset.type) { if (S.type !== t.dataset.type) { S.model = null; S.km = 0; } S.type = t.dataset.type; return go(1); }
    if (t.dataset.model) { S.model = MODELS[S.type].filter(function (m) { return m[0] === t.dataset.model; })[0]; return go(2); }
    if (t.dataset.year) { S.year = +t.dataset.year; return go(3); }
    if (t.dataset.cond) { S.cond = t.dataset.cond; return go(5); }
  });
  var pre = new URLSearchParams(location.search).get('type'); if (pre === 'bike' || pre === 'car') { S.type = pre; go(1); } else go(0);
})();
