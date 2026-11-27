/* Revv sell flow: type -> model -> year -> km -> condition -> estimate -> book inspection (lands in Admin as a seller booking),
   or the second ending: exchange it for a listing (hands the valuation to the vehicle page's exchange block). */
(function () {
  'use strict';
  var R = window.Revv, D = window.REVV_DATA, $ = R.$, $$ = R.$$;
  var MODELS = D.MODELS, COND = D.COND; // shared with the exchange block and the chat agent
  var S = { type: '', model: null, year: 0, km: 0, cond: '' };
  var STEPS = ['Type', 'Model', 'Year', 'Kilometres', 'Condition', 'Estimate', 'Inspection'];
  var step = 0;

  function value() { return R.valuate({ type: S.type, model: S.model, year: S.year, km: S.km, cond: S.cond }); }
  function renderSteps() {
    var vals = [S.type === 'bike' ? 'Bike' : S.type === 'car' ? 'Car' : '', S.model ? S.model[0] : '', S.year || '', S.km ? R.km(S.km) : (step > 3 ? R.km(S.km) : ''), S.cond ? COND.filter(function (x) { return x[0] === S.cond; })[0][1] : '', '', ''];
    $('#steps').innerHTML = STEPS.map(function (s, i) { return '<li class="' + (i === step ? 'on' : i < step ? 'done' : '') + '"' + (i === step ? ' aria-current="step"' : '') + '><b>' + (i < step ? '✓' : i + 1) + '</b>' + s + '<span class="v">' + R.esc(vals[i]) + '</span></li>'; }).join('');
  }
  function nav(canNext, nextLabel) { return '<div class="wiz-nav">' + (step ? '<button type="button" class="btn ghost" data-back>← Back</button>' : '') + (nextLabel !== false ? '<button type="button" class="btn" data-next' + (canNext ? '' : ' disabled') + '>' + (nextLabel || 'Continue') + ' <span class="ar" aria-hidden="true">→</span></button>' : '') + '</div>'; }
  var userNav = false;
  function pane(html) { $('#panes').innerHTML = '<div class="pane on">' + html + '</div>'; renderSteps(); var h = $('#panes h2'); if (h && userNav) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }

  var VIEWS = [
    function () { pane('<h2 class="disp">Two wheels or four?</h2><div class="opts" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))">' +
      '<button type="button" class="opt big" data-type="bike" aria-pressed="' + (S.type === 'bike') + '"><img src="photos/b-noir-s.jpg" alt="" width="720" height="480"><b>Bike</b><span>Scooters and commuters to superbikes</span></button>' +
      '<button type="button" class="opt big" data-type="car" aria-pressed="' + (S.type === 'car') + '"><img src="photos/c-sage-s.jpg" alt="" width="720" height="415"><b>Car</b><span>Hatchbacks to grand tourers</span></button></div>' + nav(!!S.type)); },
    function () { pane('<h2 class="disp">Which model?</h2><div class="fld" style="max-width:520px;margin-bottom:18px"><label for="ms">Search models</label><input class="inp" id="ms" type="search" placeholder="Type a make or model" autocomplete="off"></div><div class="opts" id="mlist"></div>' + nav(!!S.model));
      function list(q) { q = (q || '').toLowerCase(); $('#mlist').innerHTML = MODELS[S.type].filter(function (m) { return !q || (m[0] + ' ' + m[1]).toLowerCase().indexOf(q) > -1; }).map(function (m) { return '<button type="button" class="opt" data-model="' + R.esc(m[0]) + '" aria-pressed="' + (S.model && S.model[0] === m[0]) + '"><b>' + R.esc(m[0]) + '</b><span>' + R.esc(m[1]) + ' · new from ' + R.inr(m[2]) + '</span></button>'; }).join('') || '<p class="k">No match. Try a make: Arka, Ashwa, Aurex, Halvard, Ishiro, Kesari, Moreau, Rivetta, Sarathi, Sarvo, Tessaro, Varno.</p>'; }
      list(); $('#ms').addEventListener('input', function (e) { list(e.target.value); }); },
    function () { var y = new Date().getFullYear(), ys = []; for (var i = 0; i < 11; i++) ys.push(y - i);
      pane('<h2 class="disp">Registered in…</h2><div class="opts" style="grid-template-columns:repeat(auto-fill,minmax(110px,1fr))">' + ys.map(function (v) { return '<button type="button" class="opt" style="min-height:76px" data-year="' + v + '" aria-pressed="' + (S.year === v) + '"><b>' + v + '</b></button>'; }).join('') + '</div>' + nav(!!S.year)); },
    function () { if (!S.km) S.km = S.type === 'bike' ? 12000 : 30000; var max = S.type === 'bike' ? 80000 : 150000;
      pane('<h2 class="disp">How far has it been?</h2><div style="max-width:640px"><p class="disp" style="font-size:clamp(48px,7vw,104px);color:var(--sig)" id="kmv" aria-hidden="true">' + R.km(S.km) + '</p><label class="sr" for="kmr">Odometer reading in kilometres</label><input type="range" id="kmr" min="500" max="' + max + '" step="500" value="' + S.km + '"><div class="rv"><span>500 km</span><span>' + R.km(max) + '</span></div><p class="k" style="margin-top:16px">Typical for its age: about ' + R.km((S.type === 'bike' ? 6000 : 11000) * Math.max(1, new Date().getFullYear() - S.year)) + '</p></div>' + nav(true));
      $('#kmr').addEventListener('input', function (e) { S.km = +e.target.value; $('#kmv').textContent = R.km(S.km); renderSteps(); }); },
    function () { pane('<h2 class="disp">Honestly, how is it?</h2><div class="opts" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))">' + COND.map(function (c) { return '<button type="button" class="opt" data-cond="' + c[0] + '" aria-pressed="' + (S.cond === c[0]) + '"><b>' + c[1] + '</b><span>' + c[2] + '</span></button>'; }).join('') + '</div><p class="k" style="margin-top:18px">The inspection confirms this, so there\'s no advantage in rounding up.</p>' + nav(!!S.cond, 'See my range')); },
    function () { var v = value(), lo = v.lo * 0.8, hi = v.hi * 1.15, pos = function (x) { return ((x - lo) / (hi - lo) * 100).toFixed(1) + '%'; };
      pane('<h2 class="disp">Your range.</h2><div class="est"><p class="k">' + R.esc(S.year + ' ' + S.model[0]) + ' · ' + R.km(S.km) + ' · ' + COND.filter(function (x) { return x[0] === S.cond; })[0][1].toLowerCase() + '</p>' +
        '<p class="est-r">' + R.inr(v.lo) + ' <small>to</small> ' + R.inr(v.hi) + '</p>' +
        '<div class="est-bar" aria-hidden="true"><i style="left:' + pos(v.lo) + ';right:calc(100% - ' + pos(v.hi) + ')"></i></div><div class="est-l"><span>Quick sale ' + R.inr(lo) + '</span><span>Private, patient ' + R.inr(hi) + '</span></div>' +
        '<ul><li>— Age: ' + v.age + ' year' + (v.age === 1 ? '' : 's') + ', ' + (S.type === 'bike' ? 'bikes' : 'cars') + ' in this class lose about ' + (S.type === 'bike' ? '10' : '11') + '% a year after the first.</li><li>— Kilometres: ' + (v.kmF > 1 ? 'below average, adds about 4%.' : v.kmF === 1 ? 'about average for its age.' : 'above average, takes ' + Math.round((1 - v.kmF) * 100) + '% off.') + '</li><li>— A clean report usually lands you in the top third of the range.</li></ul>' +
        '<p class="k" style="margin-top:18px">Indicative estimate · not a quote</p></div>' + nav(true, 'Book a free inspection') +
        '<div class="xend"><p class="k">Or put it towards something on the floor</p><button type="button" class="btn ghost" data-xfor>Exchange it for… <span class="ar" aria-hidden="true">→</span></button></div>'); },
    function () { var t = new Date(), days = []; for (var i = 1; i <= 5; i++) days.push(new Date(t.getTime() + i * 864e5));
      pane('<h2 class="disp">Book the inspection.</h2><form class="form" id="insf" novalidate style="max-width:720px">' +
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
        $('#panes').innerHTML = '<div class="pane on"><h2 class="disp" tabindex="-1">See you ' + R.esc(new Date(rec.day).toLocaleDateString('en-IN', { weekday: 'long' })) + '.</h2><div class="ok-msg" style="max-width:640px"><b>Booking ' + rec.id + ' confirmed.</b> An inspector will reach ' + R.esc(rec.area + ', ' + rec.city) + ' between ' + rec.win + '. It takes about two hours; you don\'t need to be there for all of it.<br><br>After the report, verified dealers bid within 48 hours. Your instant range was ' + R.inr(rec.lo) + ' to ' + R.inr(rec.hi) + '.</div><div class="wiz-nav"><a class="btn" href="admin.html#sellers">See it in the admin queue →</a><a class="btn ghost" href="listings.html">Browse while you wait</a></div></div>';
        $('#panes h2').focus();
      });
    }
  ];
  // ---------- second ending: exchange it for a listing ----------
  function exchangeFor() {
    var v = value(), pool = R.listings().filter(function (l) { return l.status !== 'sold' && l.price > v.lo * 1.15; });
    var near = pool.sort(function (a, b) { return Math.abs(a.price - v.lo * 2.2) - Math.abs(b.price - v.lo * 2.2); }).slice(0, 6).sort(function (a, b) { return a.price - b.price; });
    try { sessionStorage.setItem('revv:xdraft', JSON.stringify({ type: S.type, model: S.model[0], year: S.year, km: S.km, cond: S.cond, low: v.lo, high: v.hi })); } catch (e) {}
    $('#panes').innerHTML = '<div class="pane on"><h2 class="disp" tabindex="-1">Exchange it for…</h2>' +
      '<p class="lead" style="max-width:62ch;margin:0 0 28px">Your ' + R.esc(S.year + ' ' + S.model[0]) + ' counts as at least <b>' + R.inr(v.lo) + '</b>, and up to ' + R.inr(v.hi) + ' once it is inspected. Here is what that leaves to pay on a few listings. Pick one to see the full sum on its page.</p>' +
      '<div class="xgrid">' + near.map(function (l) { var net = l.price - v.lo; return '<a class="xpick" href="vehicle.html?id=' + l.id + '#exchange"><img src="' + R.img(l, true) + '" alt="" width="720" height="480" loading="lazy"><span class="xp-t">' + R.esc(R.title(l)) + '</span><span class="xp-p"><s>' + R.inr(l.price) + '</s> <b>' + R.inr(net) + '</b> after yours</span><span class="xp-m">' + R.inrFull(R.monthly(net)) + ' a month</span></a>'; }).join('') + '</div>' +
      '<div class="wiz-nav"><button type="button" class="btn ghost" data-back5>← Back to my range</button><a class="btn" href="listings.html">Browse everything</a></div></div>';
    $('#panes h2').focus({ preventScroll: true });
  }
  function go(i) { step = i; VIEWS[i](); if (i > 0) { var top = $('.wiz').getBoundingClientRect().top + scrollY - 90; if (scrollY > top) scrollTo({ top: top, behavior: 'smooth' }); } }
  $('#panes').addEventListener('click', function (e) {
    userNav = true;
    var t = e.target.closest('[data-type],[data-model],[data-year],[data-cond],[data-next],[data-back],[data-back5],[data-xfor]'); if (!t) return;
    if (t.hasAttribute('data-back')) return go(step - 1);
    if (t.hasAttribute('data-back5')) return go(5);
    if (t.hasAttribute('data-xfor')) return exchangeFor();
    if (t.hasAttribute('data-next')) return go(step + 1);
    if (t.dataset.type) { if (S.type !== t.dataset.type) { S.model = null; S.km = 0; } S.type = t.dataset.type; return go(1); }
    if (t.dataset.model) { S.model = MODELS[S.type].filter(function (m) { return m[0] === t.dataset.model; })[0]; return go(2); }
    if (t.dataset.year) { S.year = +t.dataset.year; return go(3); }
    if (t.dataset.cond) { S.cond = t.dataset.cond; return go(5); }
  });
  var pre = new URLSearchParams(location.search).get('type'); if (pre === 'bike' || pre === 'car') { S.type = pre; go(1); } else go(0);
})();
