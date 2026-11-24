/* Aaranya · home: the hero film (scroll-driven 3D), residence rows, progress bars. */
(function () {
  'use strict';
  var A = window.AAR, $ = A.$, $$ = A.$$;
  var reduce = A.reduce;
  var hero = $('#hero'), stage = $('#stage'), canvas = $('#tower3d'), tip = $('#tip');
  var chaps = $$('.chap'), bars = $$('.hprog i');
  var api = null, p = 0;
  var ST = A.PROJECT.story, FLOOR = ST.floor;

  /* ---------- the story-floor line (Tower A, 40th) ---------- */
  function fstory() {
    var us = A.floorUnits(ST.tower, FLOOR), c = { avail: 0, hold: 0, sold: 0 };
    us.forEach(function (u) { c[A.status(u.id)]++; });
    var words = ['none', 'one', 'two', 'three', 'four'];
    var s = 'Four corner homes on this floor: ' + words[c.avail] + ' available, ' + words[c.hold] + ' on hold, ' + words[c.sold] + ' sold. ';
    var best = us.filter(function (u) { return A.status(u.id) === 'avail'; }).sort(function (a, b) { return A.price(a).total - A.price(b).total; })[0];
    if (best) s += best.id + ', a ' + A.TYPES[best.type].short + ' facing ' + best.facing.toLowerCase() + ', is ' + A.inr(A.price(best).total) + ' all-inclusive.';
    var el = $('#fstory'); if (el) el.textContent = s;
  }
  fstory(); A.on('inv', fstory);

  /* ---------- sun widget ---------- */
  var sunEl = $('#sun');
  var sunW = A.sunWidget(sunEl, function () { return api; }, { hour: 16.9 });

  /* ---------- scroll -> progress ---------- */
  function heroP() { var r = hero.getBoundingClientRect(); var span = r.height - innerHeight; return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0; }
  var mob = function () { return innerWidth < 760; };
  function shiftFor(p) {
    var m = mob(), a = 1 - Math.min(1, Math.max(0, (p - 0.08) / 0.16)), b = Math.min(1, Math.max(0, (p - 0.78) / 0.12));
    return m ? [0, 0.31 * a - 0.14 * b] : [0.26 * a - 0.17 * b, 0.03 * a];
  }
  // golden hour at the top; chapter two sweeps the sun through dusk, a lit-up night and dawn, to a clear morning for the drawer
  function sunFor(p) {
    if (p < 0.3) return 16.9;
    if (p >= 0.6) return 10.5;
    var q = (p - 0.3) / 0.3, t;                       // 0..1 across chapter two
    if (q < 0.42) t = 16.9 + q / 0.42 * 2.5;          // golden hour into dusk (16:54 to 19:24)
    else if (q < 0.6) t = 19.4 + (q - 0.42) / 0.18 * 10.1;   // the lit-up night passes quickly (19:24 to 05:30)
    else t = 29.5 + (q - 0.6) / 0.4 * 5;              // dawn to a clear morning (05:30 to 10:30)
    return t >= 24 ? t - 24 : t;
  }
  var demoBar = $('.demo');
  window.__cgHold = function () { return !reduce && p > 0.02 && p < 0.97; };
  var lastChap = -1;
  function update() {
    if (demoBar) document.documentElement.style.setProperty('--demo-off', Math.max(0, demoBar.offsetHeight - scrollY).toFixed(0) + 'px');
    if (reduce) return;
    p = heroP();
    var idx = -1;
    chaps.forEach(function (c, i) {
      var r = c.dataset.r.split(','), on = p >= +r[0] && p < +r[1];
      if (on) idx = i;
      if (c.classList.contains('on') !== on) { c.classList.toggle('on', on); c.setAttribute('aria-hidden', String(!on)); }
    });
    bars.forEach(function (b, i) { var a = [0, 0.15, 0.38, 0.6, 0.86][i], z = [0.15, 0.38, 0.6, 0.86, 1][i]; b.style.transform = 'scaleY(' + Math.min(1, Math.max(0, (p - a) / (z - a))).toFixed(3) + ')'; });
    if (idx !== lastChap) { lastChap = idx; sunEl.classList.toggle('pulse', idx === 2); stage.classList.toggle('labels-off', p > 0.4); }
    stage.classList.toggle('past0', p > 0.1);
    labelsOn(p < 0.12 && !mob());
    if (api) { var sh = shiftFor(p); api.setShift(sh[0], sh[1]); api.setProgress(p); sunW.set(sunFor(p)); }
    if (p < 0.85 && tip && !tip.hidden) tip.hidden = true;
  }
  var ticking = false;
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; update(); }); } }, { passive: true });
  addEventListener('resize', update);

  /* ---------- tower labels ---------- */
  var labs = $$('.tlab');
  var labState = true;
  function labelsOn(v) { if (v === labState) return; labState = v; labs.forEach(function (l) { l.style.visibility = v ? '' : 'hidden'; }); }
  labs.forEach(function (l) { l.style.opacity = '0'; });

  /* ---------- 3D ---------- */
  A.V3D = 11;
  A.load3D(function () {
    if (!window.Aaranya3D || !canvas) return;
    try {
      var FH = A.PROJECT.floorH, LH = A.PROJECT.lobbyH;
      var at = function (id) {
        if (id === 'club') return [A.CLUB.x, A.CLUB.h + 4, A.CLUB.z];
        var T = A.tower(id); return [T.x, LH + T.floors * FH * 0.55, T.z];
      };
      api = window.Aaranya3D.mount(canvas, {
        mode: 'hero',
        labels: labs.map(function (l) { return { el: l, at: at(l.dataset.at) }; }),
        onHover: function (info, ev) {
          if (!info || !info.unit || p < 0.85) { tip.hidden = true; return; }
          var u = A.unit(info.unit), st = A.status(u.id), r = stage.getBoundingClientRect();
          tip.innerHTML = '<b>' + u.id + '</b> · ' + A.TYPES[u.type].short + '<br><span class="status st-' + st + '">' + A.STATUS[st].label + '</span>' + (st !== 'sold' ? '<br>' + A.inr(A.price(u).total) + ' · ' + u.facing + ' facing' : '') + '<br><span class="muted">Click to open in the picker</span>';
          tip.style.left = (ev.clientX - r.left) + 'px'; tip.style.top = (ev.clientY - r.top) + 'px'; tip.hidden = false;
        },
        onUnit: function (id) { location.href = 'picker.html?unit=' + encodeURIComponent(id); }
      });
      window.__aar3d = api;
      sunW.apply(api);
      var sh0 = shiftFor(reduce ? 0 : heroP()); api.setShift(sh0[0], sh0[1], true);
      api.ready.then(function () { stage.classList.add('live'); labs.forEach(function (l) { l.style.opacity = ''; }); update(); if (reduce) api.setProgress(0); });
    } catch (e) { /* no WebGL: the poster stays and the story is still readable */ }
  });

  /* ---------- residences rows ---------- */
  var types = $('#types');
  if (types && A.unitPlanSVG) {
    types.innerHTML = ['A', 'B', 'C', 'D'].map(function (k, i) {
      var t = A.TYPES[k], m = A.minPrice(k);
      return '<div class="type-row" data-reveal><span class="n">0' + (i + 1) + '</span>' +
        '<h3>' + t.name + '<small>' + t.short + ' · ' + (k === 'D' ? 'Tower A only' : k === 'A' ? 'Tower C' : k === 'C' ? 'Towers A, B' : 'Towers B, C') + '</small></h3>' +
        '<p class="area"><b>' + A.sqft(t.carpet) + '</b><span>RERA carpet · ' + A.sqm(t.carpet) + '</span></p>' +
        '<p class="from"><b data-from="' + k + '">' + (m ? A.inr(m) : 'Sold out') + '</b><span>from, all-inclusive · <span data-avail="Y:' + k + '">0</span> open</span></p>' +
        '<div class="mini" aria-hidden="true">' + A.unitPlanSVG(k, { mini: true }) + '</div>' +
        '<span class="go" aria-hidden="true">→</span><a class="cover" href="residences.html#type-' + k.toLowerCase() + '"><span class="vh">' + t.name + ' plans</span></a></div>';
    }).join('');
    A.refreshCounts();
  }

  /* ---------- progress bars ---------- */
  var bx = $('#bars');
  if (bx) {
    bx.innerHTML = A.TOWERS.map(function (T) {
      var done = A.PROGRESS[T.id], pc = done / T.floors;
      return '<div class="bar-row"><span><b style="font-family:var(--serif);font-size:22px;font-weight:400">' + T.name + '</b></span><span class="bar" role="img" aria-label="' + T.name + ': ' + done + ' of ' + T.floors + ' slabs cast"><i style="width:' + Math.round(pc * 100) + '%"></i></span><span class="mono">' + done + ' / ' + T.floors + '</span></div>';
    }).join('') + '<div class="bar-row"><span><b style="font-family:var(--serif);font-size:22px;font-weight:400">Club</b></span><span class="bar" role="img" aria-label="Podium Club: podium slab cast"><i style="width:100%"></i></span><span class="mono">Façade</span></div>';
  }

  update();
})();
