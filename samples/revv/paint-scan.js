/* Revv home, "Find the repaint": once the car is lit, the pointer is a paint-depth gauge. It reads the panel under it from
   the 3D scene (revv3d scanAt), one panel reads 246 µm and turns amber, and finding it says so. Touch: the gauge follows the
   finger. Reduced motion: the readings are fixed tags on the lit still. window.PaintScan.init(api, stage) -> { setActive, seek } */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var REPORT = 'vehicle.html?id=kestrel-gt-carmine#report';
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }

  function init(api, stage) {
    var panels = api.panels(), flag = panels.filter(function (p) { return p.flag; })[0];
    var seen = {}, nSeen = 0, found = false, active = true, raf = 0, last = null, px = -1, py = -1;
    var g = el('div', 'pgauge', '<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="t" cx="32" cy="32" r="26"/><circle class="v" cx="32" cy="32" r="26" pathLength="100"/><line x1="32" y1="32" x2="32" y2="12"/></svg><span class="pg-t"><b></b><span></span><i></i></span>');
    g.setAttribute('aria-hidden', 'true'); stage.appendChild(g);
    var cnt = el('p', 'pg-count', ''); cnt.setAttribute('aria-hidden', 'true'); stage.appendChild(cnt);
    var msg = el('div', 'pfound', '<p class="k">Paint gauge · ' + (flag ? flag.name.toLowerCase() : 'rear quarter') + '</p><p class="h">Repainted. We found it before you did.</p><p>' + (flag ? flag.um : 246) + ' µm against a factory 104–121. It is in the report, under Exterior and paint.</p><a class="ul" href="' + REPORT + '">Read the report →</a><button type="button" class="x" aria-label="Close">×</button>');
    msg.setAttribute('role', 'status'); msg.hidden = true; stage.appendChild(msg);
    msg.querySelector('.x').addEventListener('click', function () { msg.hidden = true; });
    var vb = g.querySelector('.v'), nd = g.querySelector('line'), tb = g.querySelector('b'), ts = g.querySelector('.pg-t span'), ti = g.querySelector('i');

    function show(r) {
      if (!r || !r.key) { g.dataset.on = r ? 'off' : '0'; if (r) { tb.textContent = 'No paint here'; ts.textContent = 'glass, rubber or trim'; ti.textContent = ''; } return; }
      g.dataset.on = '1'; g.classList.toggle('flag', !!r.flag);
      tb.textContent = r.name; ts.textContent = r.um + ' µm'; ti.textContent = r.flag ? 'repainted' : 'factory';
      var f = Math.min(1, r.um / 300); vb.style.strokeDashoffset = String(100 - f * 75); nd.style.transform = 'rotate(' + (-135 + f * 270) + 'deg)';
      if (!seen[r.key]) { seen[r.key] = 1; nSeen++; cnt.textContent = nSeen + ' panels read'; cnt.dataset.on = '1'; }
      if (r.flag && !found) { found = true; msg.hidden = false; stage.classList.add('found'); }
    }
    function at(x, y) {
      var b = stage.getBoundingClientRect(); px = x; py = y;
      g.style.transform = 'translate3d(' + (x - b.left) + 'px,' + (y - b.top) + 'px,0)';
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; if (!active) return; var r = api.scanAt(px, py); if ((r && r.key) !== (last && last.key) || !r) { last = r; show(r); } });
    }
    function onMove(e) {
      if (!active || stage.dataset.lit !== '1') return;
      var off = e.pointerType === 'touch' ? -64 : 0; at(e.clientX, e.clientY + off);
    }
    stage.addEventListener('pointermove', onMove, { passive: true });
    stage.addEventListener('pointerdown', onMove, { passive: true });
    stage.addEventListener('pointerleave', function () { if (g.dataset.on !== '0') g.dataset.on = 'idle'; });

    // reduced motion: readings as fixed tags on the still
    var tags = [];
    function placeTags() {
      tags.forEach(function (t) { t.remove(); }); tags = [];
      var b = stage.getBoundingClientRect(), shown = 0;
      panels.slice().sort(function (a, c) { return (c.flag ? 1 : 0) - (a.flag ? 1 : 0); }).forEach(function (p) {
        var q = api.project(p.key); if (!q || q.z > 1 || q.x < 20 || q.y < 80 || q.x > b.width - 20 || q.y > b.height - 40) return;
        if (!p.flag && api.scanAt(q.x + b.left, q.y + b.top) && api.scanAt(q.x + b.left, q.y + b.top).key !== p.key) return;
        if (shown >= (b.width < 560 ? 4 : 9) && !p.flag) return; shown++;
        var t = el('span', 'ptag' + (p.flag ? ' flag' : '') + (q.x > b.width * 0.58 ? ' l' : ''), '<b>' + p.name + '</b> ' + p.um + ' µm' + (p.flag ? ' · repainted' : ''));
        t.style.transform = 'translate3d(' + Math.round(q.x) + 'px,' + Math.round(q.y) + 'px,0)'; t.setAttribute('aria-hidden', 'true'); stage.appendChild(t); tags.push(t);
      });
    }
    if (reduce) { g.remove(); cnt.remove(); placeTags(); addEventListener('resize', function () { clearTimeout(placeTags.t); placeTags.t = setTimeout(placeTags, 200); }); }

    return {
      setActive: function (on) { active = on; g.dataset.hide = on ? '0' : '1'; cnt.dataset.hide = on ? '0' : '1'; if (!on) msg.hidden = true; tags.forEach(function (t) { t.style.opacity = on ? '' : '0'; }); },
      // walk the gauge onto the repainted panel (the "Find the repaint" button)
      seek: function () {
        if (!flag) return; var b = stage.getBoundingClientRect(), q = api.project(flag.key); if (!q) return;
        if (reduce) { msg.hidden = false; return; }
        var sx = px > 0 ? px - b.left : b.width * 0.5, sy = py > 0 ? py - b.top : b.height * 0.55, t0 = performance.now(), D = 1100;
        (function step(t) { var u = Math.min(1, (t - t0) / D), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2, q2 = api.project(flag.key) || q;
          at(b.left + sx + (q2.x - sx) * e, b.top + sy + (q2.y - sy) * e); if (u < 1) { requestAnimationFrame(step); return; }
          // land exactly on the panel: search a small spiral around the anchor for a hit on it
          for (var i = 0; i < 40; i++) { var a = i * 0.9, rr = i * 4, x = b.left + q2.x + Math.cos(a) * rr, y = b.top + q2.y + Math.sin(a) * rr, h = api.scanAt(x, y);
            if (h && h.key === flag.key) { at(x, y); last = h; show(h); msg.hidden = false; stage.classList.add('found'); return; } } })(t0);
      },
      get count() { return nSeen; }, get found() { return found; }
    };
  }
  window.PaintScan = { init: init };
})();
