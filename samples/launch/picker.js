/* Aaranya · unit picker: tower -> floor -> home, filters in the URL, live availability, a 48-hour hold that lands in the back office. */
(function () {
  'use strict';
  var A = window.AAR, $ = A.$, $$ = A.$$;
  var stage = $('#stage'), canvas = $('#pk3d'), tipEl = $('#pktip');
  var stack = $('#stack'), floorbox = $('#floorbox'), unitbox = $('#unitbox');
  var api = null;
  var S = { tower: A.PROJECT.story.tower, floor: A.PROJECT.story.floor, unit: null, f: { type: '', budget: '', facing: '', band: '' } };

  /* ---------- state <-> URL ---------- */
  var q = new URLSearchParams(location.search);
  ['type', 'budget', 'facing', 'band'].forEach(function (k) { if (q.get(k)) S.f[k] = q.get(k); });
  if (q.get('tower') && A.tower(q.get('tower'))) S.tower = q.get('tower');
  if (q.get('floor')) S.floor = Math.max(1, Math.min(A.tower(S.tower).floors, +q.get('floor') || A.PROJECT.story.floor));
  if (q.get('unit') && A.unit(q.get('unit'))) { var u0 = A.unit(q.get('unit')); S.tower = u0.tower; S.floor = u0.floor; S.unit = u0.id; }
  function syncURL() {
    var p = new URLSearchParams();
    p.set('tower', S.tower); p.set('floor', S.floor); if (S.unit) p.set('unit', S.unit);
    Object.keys(S.f).forEach(function (k) { if (S.f[k]) p.set(k, S.f[k]); });
    history.replaceState(null, '', '?' + p.toString());
  }

  /* ---------- filters ---------- */
  function match(u) {
    var f = S.f;
    if (f.type && u.type !== f.type) return false;
    if (f.budget) { var b = f.budget.split('-'), pr = A.price(u).total; if (pr < +b[0] || pr >= +b[1]) return false; }
    if (f.facing) { if (f.facing === 'garden') { if (!u.garden) return false; } else if (u.facingFull.indexOf(f.facing) < 0) return false; }
    if (f.band) { var r = f.band.split('-'); if (u.floor < +r[0] || u.floor > +r[1]) return false; }
    return true;
  }
  var anyFilter = function () { return Object.keys(S.f).some(function (k) { return S.f[k]; }); };
  $$('#filters .chips').forEach(function (g) {
    var k = g.dataset.f;
    $$('.chip', g).forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.v === S.f[k])); });
    g.addEventListener('click', function (e) {
      var c = e.target.closest('.chip'); if (!c) return;
      S.f[k] = c.dataset.v; $$('.chip', g).forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
      // keep the floor if it still has a match, else jump to the best floor in this tower
      if (anyFilter() && !A.floorUnits(S.tower, S.floor).some(function (u) { return A.status(u.id) === 'avail' && match(u); })) {
        var best = bestFloor(S.tower); if (best) { S.floor = best; S.unit = null; if (api) api.selectFloor(S.tower, S.floor); }
      }
      render(); if (api) api.setMatch(anyFilter() ? match : null);
    });
  });
  $('#clear').addEventListener('click', function () {
    Object.keys(S.f).forEach(function (k) { S.f[k] = ''; });
    $$('#filters .chips').forEach(function (g) { $$('.chip', g).forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.v === '')); }); });
    render(); if (api) api.setMatch(null);
  });
  $('#share').addEventListener('click', function () {
    syncURL(); var url = location.href;
    var ok = function () { A.toast('Link copied. It opens this tower, floor and filter.'); };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(ok, function () { A.toast('Copy this link: ' + url); }); else A.toast('Copy this link: ' + url);
  });
  function bestFloor(t) {
    var T = A.tower(t);
    for (var f = T.floors; f >= 1; f--) if (A.floorUnits(t, f).some(function (u) { return A.status(u.id) === 'avail' && match(u); })) return f;
    return null;
  }

  /* ---------- towers ---------- */
  $$('.pk-towers button').forEach(function (b) {
    b.addEventListener('click', function () { setTower(b.dataset.t); });
  });
  function setTower(t, keepFloor) {
    S.tower = t; var T = A.tower(t);
    if (!keepFloor) { S.floor = (anyFilter() && bestFloor(t)) || Math.min(T.floors, Math.round(T.floors * 0.55)); S.unit = null; }
    $$('.pk-towers button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.t === t)); });
    if (api) api.selectFloor(t, S.floor);
    render();
  }

  /* ---------- render ---------- */
  function render() {
    var T = A.tower(S.tower);
    // count
    var n = 0; A.UNITS.forEach(function (u) { if (A.status(u.id) === 'avail' && match(u)) n++; });
    $('#cnt').textContent = n; $('#cnt-l').textContent = anyFilter() ? (n === 1 ? 'home available that matches' : 'homes available that match') : 'homes available across three towers';
    $('#stack-h').textContent = T.name + ' · ' + T.floors + ' floors';
    // stack
    var rows = '';
    for (var f = T.floors; f >= 1; f--) {
      var us = A.floorUnits(S.tower, f), open = 0, m = 0;
      var cells = us.map(function (u) { var st = A.status(u.id), mm = match(u); if (st === 'avail') { open++; if (mm) m++; } return '<i class="st-' + st + (anyFilter() && !mm ? ' dim' : '') + '"></i>'; }).join('');
      var fa = anyFilter() ? m + ' match' : open + ' open';
      var lab = String(f).padStart(2, '0') + ' ' + fa + ': ' + A.ord(f) + ' floor, ' + open + ' of ' + us.length + ' available';
      rows += '<button type="button" class="fl-row' + (anyFilter() && !m ? ' nomatch' : '') + '" data-f="' + f + '"' + (f === S.floor ? ' aria-current="true"' : '') + '><span class="fn">' + String(f).padStart(2, '0') + '<span class="vh"> floor</span></span> <span class="cells" style="grid-template-columns:repeat(' + us.length + ',1fr)">' + cells + '</span> <span class="fa">' + fa + '<span class="vh">, ' + open + ' of ' + us.length + ' available</span></span></button>';
    }
    stack.innerHTML = rows;
    var cur = stack.querySelector('[aria-current]'); if (cur) { var top = cur.offsetTop - stack.clientHeight / 2; stack.scrollTop = top; }
    // floor plan
    var fu = A.floorUnits(S.tower, S.floor), c = { avail: 0, hold: 0, sold: 0 }; fu.forEach(function (u) { c[A.status(u.id)]++; });
    floorbox.innerHTML = '<div class="stack-h"><h2>' + T.name + ', ' + A.ord(S.floor) + ' floor</h2><span class="k">' + c.avail + ' open · ' + c.hold + ' hold · ' + c.sold + ' sold</span></div>' +
      '<div class="fplan-box">' + A.floorSVG(S.tower, S.floor, { match: anyFilter() ? match : null, selected: S.unit }) + '</div>' +
      '<p class="muted" style="font-size:12.5px;margin-top:8px">' + T.note + ' Plate ' + T.w + ' × ' + T.d + ' m. Tap a home for its price.</p>';
    renderUnit();
    syncURL();
  }
  stack.addEventListener('click', function (e) { var b = e.target.closest('.fl-row'); if (!b) return; S.floor = +b.dataset.f; S.unit = null; if (api) api.selectFloor(S.tower, S.floor); render(); });
  floorbox.addEventListener('click', function (e) { var g = e.target.closest('[data-unit]'); if (g) selectUnit(g.dataset.unit, true); });
  floorbox.addEventListener('keydown', function (e) { var g = e.target.closest('[data-unit]'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selectUnit(g.dataset.unit, true); } });

  function selectUnit(id, scroll) {
    var u = A.unit(id); if (!u) return;
    var towerChanged = u.tower !== S.tower;
    S.unit = id; S.floor = u.floor;
    if (towerChanged) setTower(u.tower, true); else render();
    if (api) { api.selectFloor(u.tower, u.floor, { keepAngle: true }); api.selectUnit(id); }
    if (scroll && innerWidth < 1000) unitbox.scrollIntoView({ behavior: A.reduce ? 'auto' : 'smooth', block: 'start' });
  }

  var short = A.get('short', []);
  function renderUnit() {
    if (!S.unit) { unitbox.innerHTML = '<div class="empty"><b>Choose a home on the plan</b><span>Its carpet area, facing, view and the all-inclusive price will show here.</span></div>'; return; }
    var u = A.unit(S.unit), t = A.TYPES[u.type], st = A.status(u.id), pr = A.price(u), meta = A.statusMeta(u.id);
    var inShort = short.indexOf(u.id) >= 0;
    var holdNote = '';
    if (st === 'hold') {
      var until = meta && meta.until ? ' until ' + A.fmtDay(meta.until) + ', ' + A.fmtTime(meta.until) : '';
      holdNote = '<p class="hold-note"><span aria-hidden="true">◷</span><span>Someone is holding this home' + until + '. If it is released, you\'ll be the first to know: <a class="link" href="visit.html?unit=' + u.id + '">join the waitlist</a>.</span></p>';
    }
    unitbox.innerHTML = '<article class="unit-card" aria-live="polite">' +
      '<div class="uc-h"><div><h2>' + u.id + '<small>' + A.tower(u.tower).name + ' · ' + A.ord(u.floor) + ' floor · ' + t.name + '</small></h2></div><span class="status st-' + st + '">' + A.STATUS[st].label + '</span></div>' +
      (st !== 'sold' ? '<div class="price"><b>' + A.inr(pr.total) + '</b><span>all-inclusive · ' + A.inrFull(pr.rate) + ' per sq ft carpet</span></div>' : '<div class="price"><b>Sold</b><span>Similar homes: <a class="link" href="#" data-similar>show the nearest available ' + t.short + '</a></span></div>') +
      '<dl class="kv"><div><dt>Carpet (RERA)</dt><dd>' + A.sqft(t.carpet) + '</dd></div><div><dt>Balconies</dt><dd>' + A.sqft(t.bal) + '</dd></div><div><dt>Facing</dt><dd>' + u.facing + '</dd></div><div><dt>View</dt><dd>' + u.view + '</dd></div><div><dt>Parking</dt><dd>' + t.parking + ' covered</dd></div><div><dt>Floor</dt><dd>' + A.ord(u.floor) + ' of ' + A.tower(u.tower).floors + '</dd></div></dl>' +
      holdNote +
      (st !== 'sold' ? '<details class="breakdown"><summary>How the price adds up</summary><table><tr><td>Basic price (' + A.sqft(t.carpet) + ' × ' + A.inrFull(pr.base) + ')</td><td>' + A.inrFull(t.carpet * pr.base) + '</td></tr>' +
        (pr.floorPLC ? '<tr><td>Floor rise (' + A.inrFull(pr.floorPLC) + '/sq ft)</td><td>' + A.inrFull(pr.floorPLC * t.carpet) + '</td></tr>' : '') +
        (pr.plc ? '<tr><td>Location premium (' + (u.garden ? 'garden view' : '') + (u.garden && u.corner ? ', ' : '') + (u.corner ? 'corner' : '') + ')</td><td>' + A.inrFull(pr.plc * t.carpet) + '</td></tr>' : '') +
        '<tr><td>Covered parking × ' + t.parking + '</td><td>' + A.inrFull(pr.parking) + '</td></tr><tr><td>Club membership</td><td>' + A.inrFull(pr.club) + '</td></tr><tr><td>Maintenance security (IFMS)</td><td>' + A.inrFull(pr.ifms) + '</td></tr><tr><td>GST at 5%</td><td>' + A.inrFull(pr.gst) + '</td></tr><tr class="t"><td>All-inclusive</td><td>' + A.inrFull(pr.total) + '</td></tr></table><p class="muted" style="font-size:12.5px;margin-top:8px">Stamp duty and registration are extra and paid to the government. Indicative until your cost sheet is signed.</p></details>' : '') +
      '<div class="acts">' + (st === 'avail' ? '<button type="button" class="btn" id="hold-btn">Hold it for 48 hours <span class="ar" aria-hidden="true">→</span></button>' : '') +
      '<a class="btn ghost" href="visit.html?unit=' + u.id + '">Book a visit for ' + u.id + '</a>' +
      '<a class="btn ghost" href="payment.html?unit=' + u.id + '">Cost sheet &amp; EMI</a>' +
      '<button type="button" class="btn ghost" id="short-btn" aria-pressed="' + inShort + '">' + (inShort ? '♥ Shortlisted' : '♡ Shortlist') + '</button>' +
      '<a class="tbtn" href="residences.html#type-' + u.type.toLowerCase() + '">See the ' + t.short + ' plan →</a></div></article>';
    var hb = $('#hold-btn'); if (hb) hb.addEventListener('click', openHold);
    $('#short-btn').addEventListener('click', function () {
      var i = short.indexOf(u.id); if (i >= 0) short.splice(i, 1); else short.push(u.id); A.set('short', short);
      A.toast(i >= 0 ? u.id + ' removed from your shortlist' : u.id + ' added to your shortlist · ' + short.length + ' saved'); renderUnit();
    });
    var sim = unitbox.querySelector('[data-similar]');
    if (sim) sim.addEventListener('click', function (e) {
      e.preventDefault();
      var near = A.UNITS.filter(function (x) { return x.type === u.type && A.status(x.id) === 'avail'; }).sort(function (a, b) { return (Math.abs(a.floor - u.floor) + (a.tower === u.tower ? 0 : 6)) - (Math.abs(b.floor - u.floor) + (b.tower === u.tower ? 0 : 6)); })[0];
      if (near) selectUnit(near.id, true); else A.toast('No ' + t.short + ' is available right now.');
    });
  }

  /* ---------- hold flow ---------- */
  var dlg = $('#holddlg'), hform = $('#holdform');
  function openHold() {
    $('#hold-unit').textContent = S.unit + ' (' + A.TYPES[A.unit(S.unit).type].short + ', ' + A.inr(A.price(S.unit).total) + ')';
    hform.querySelector('[name=unit]').value = S.unit;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }
  A.bindLead(hform, {
    source: 'Unit picker · 48-hour hold',
    done: function (lead) {
      var id = S.unit;
      A.setStatus(id, 'hold', { by: 'Web request · ' + lead.name, until: Date.now() + 48 * 36e5, note: 'Requested a 48-hour hold online', lead: lead.id, keep: true });
      dlg.close(); hform.reset();
      A.toast(id + ' is held for you until ' + A.fmtDay(Date.now() + 48 * 36e5) + '. Your relationship manager will call within the hour.', { label: 'Book a visit', fn: function () { location.href = 'visit.html?unit=' + id; } }, 7000);
      render();
    }
  });

  /* ---------- live updates (back office in another tab) ---------- */
  A.on('inv', function (d) { render(); if (d && d.remote) A.toast('Availability just changed in the sales office.'); });

  /* ---------- 3D ---------- */
  var hint = $('.pk-hint');
  var sunW = A.sunWidget($('#sun'), function () { return api; }, { hour: Math.max(6.5, Math.min(18.5, A.get('hour', 10.5))) });
  $$('.pk-ctl button').forEach(function (b) {
    b.addEventListener('click', function () { if (!api) return; var z = b.dataset.z; if (z === 'in') api.zoom(0.8); else if (z === 'out') api.zoom(1.25); else { api.clearFloor(); api.overview(); } });
  });
  A.V3D = 11;
  A.load3D(function () {
    if (!window.Aaranya3D) return;
    try {
      api = window.Aaranya3D.mount(canvas, {
        mode: 'picker',
        onFloor: function (t, f) { if (t !== S.tower) { S.tower = t; $$('.pk-towers button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.t === t)); }); } S.floor = f; S.unit = null; render(); if (hint) hint.style.opacity = '0'; },
        onUnit: function (id) { selectUnit(id, true); },
        onHover: function (info, ev) {
          if (!info || A.coarse) { tipEl.hidden = true; return; }
          var html;
          if (info.unit) { var u = A.unit(info.unit), st = A.status(u.id); html = '<b>' + u.id + '</b> · ' + A.TYPES[u.type].short + '<br><span class="status st-' + st + '">' + A.STATUS[st].label + '</span>' + (st !== 'sold' ? ' · ' + A.inr(A.price(u).total) : '') + '<br><span class="muted">' + u.facing + ' facing · ' + u.view + '</span>'; }
          else if (info.floor) { var us = A.floorUnits(info.tower, info.floor), o = us.filter(function (x) { return A.status(x.id) === 'avail'; }).length; html = '<b>' + A.tower(info.tower).name + ' · ' + A.ord(info.floor) + '</b><br>' + o + ' of ' + us.length + ' available<br><span class="muted">Click to pull it out</span>'; }
          else { tipEl.hidden = true; return; }
          tipEl.innerHTML = html; tipEl.style.left = (ev.clientX + 16) + 'px'; tipEl.style.top = (ev.clientY + 16) + 'px'; tipEl.hidden = false;
        }
      });
      window.__aar3d = api;
      sunW.apply(api);
      api.ready.then(function () {
        stage.classList.add('live');
        if (anyFilter()) api.setMatch(match);
        api.selectFloor(S.tower, S.floor);
        if (S.unit) api.selectUnit(S.unit);
      });
    } catch (e) { /* no WebGL: the floor list and plans still do everything */ }
  }, { delay: A.coarse ? 4000 : 2600 });

  render();
})();
