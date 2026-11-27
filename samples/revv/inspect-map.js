/* Revv inspection map: a line-art blueprint of this vehicle type with all 150 checkpoints pinned by category.
   Tap a category: the drawing zooms to it (viewBox tween), its failed points pulse, the inspector's notes slide in with the
   findings listed first. Data comes from the report itself (Revv.inspection). window.InspectMap.mount(host, listing) */
(function () {
  'use strict';
  var R = window.Revv, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CAT = { 'Exterior and paint': 'paint', 'Engine and transmission': 'engine', 'Motor, battery and drive': 'engine', 'Brakes': 'brakes', 'Suspension and steering': 'suspension',
    'Forks, shock and steering head': 'suspension', 'Tyres and wheels': 'tyres', 'Tyres and date codes': 'tyres', 'Electricals': 'electrics', 'Cabin and controls': 'cabin',
    'Controls and accessories fitted': 'cabin', 'Chain and sprockets': 'chain', 'Road test': 'road' };
  var NAMES = { superbike: 'Superbike', naked: 'Naked', cruiser: 'Cruiser or classic', scooter: 'Scooter', sedan: 'Car', suv: 'SUV' };
  function kindOf(l) {
    var b = String(l.body || '').toLowerCase();
    if (l.type === 'bike') return /scooter|step/.test(b) ? 'scooter' : /naked|street|roadster/.test(b) ? 'naked' : /cafe|café|cruiser|bobber|classic|scrambler|retro|electric|commuter/.test(b) ? 'cruiser' : 'superbike';
    return /suv|crossover|pickup|mpv|4x4/.test(b) ? 'suv' : 'sedan';
  }
  function esc(s) { return R.esc(s); }
  function short(n) { return n.split(' and ')[0].split(',')[0]; }

  function mount(host, l) {
    if (!host) return; var rep = R.inspection(l), kind = kindOf(l);
    var nFind = rep.findings.length;
    host.classList.add('imap'); host.dataset.kind = kind;
    host.innerHTML = '<div class="imap-top"><p class="k">Inspection map · ' + NAMES[kind] + '</p><p class="imap-sum"><b>' + rep.ok + '</b> of 150 passed · ' + (nFind ? nFind + ' finding' + (nFind === 1 ? '' : 's') : 'no findings') + '</p></div>' +
      '<div class="imap-fig" aria-hidden="false"><div class="imap-load">Drawing the ' + NAMES[kind].toLowerCase() + '…</div></div>' +
      '<div class="imap-cats" role="group" aria-label="Show a category on the map"><button type="button" data-g="-1" aria-pressed="true">All <b>' + rep.ok + '/150</b></button>' +
      rep.groups.map(function (g, i) { return '<button type="button" data-g="' + i + '" aria-pressed="false" class="' + (g.ok < g.total ? 'm' : '') + '">' + esc(short(g.name)) + ' <b>' + g.ok + '/' + g.total + '</b></button>'; }).join('') + '</div>' +
      '<div class="imap-note" aria-live="polite"></div>';
    var fig = host.querySelector('.imap-fig'), note = host.querySelector('.imap-note'), svg = null, full = [0, 0, 1000, 500], vb = full.slice(), raf = 0, cur = -1;

    fetch('blueprints/' + kind + '.svg?v=2').then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (t) {
      fig.innerHTML = t; svg = fig.querySelector('svg'); if (!svg) return; svg.setAttribute('focusable', 'false');
      var NS = 'http://www.w3.org/2000/svg', pts = document.createElementNS(NS, 'g'); pts.setAttribute('class', 'pts'); svg.appendChild(pts);
      // place every checkpoint inside its category zone, in a quiet grid
      rep.groups.forEach(function (g, gi) {
        var z = svg.querySelector('#z-' + (CAT[g.name] || 'road')); if (!z) return;
        var x = +z.getAttribute('x'), y = +z.getAttribute('y'), w = +z.getAttribute('width'), h = +z.getAttribute('height');
        var n = g.items.length, cols = Math.max(1, Math.round(Math.sqrt(n * w / h))), rows = Math.ceil(n / cols), r = R.rng(l.id + g.name);
        var order = g.items.map(function (it, i) { return i; }).sort(function (a, b) { return r() - 0.5; });
        order.forEach(function (ii, k) {
          var it = g.items[ii], cx = x + (k % cols + 0.5 + (r() - 0.5) * 0.5) * w / cols, cy = y + (Math.floor(k / cols) + 0.5 + (r() - 0.5) * 0.5) * h / rows;
          var c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', cx.toFixed(1)); c.setAttribute('cy', cy.toFixed(1)); c.setAttribute('r', it.st === 'pass' ? 3.2 : 7);
          c.setAttribute('class', 'pt ' + (it.st === 'pass' ? 'ok' : 'f ' + it.st)); c.dataset.g = gi; c.dataset.i = ii;
          if (it.st !== 'pass') {
            var ring = document.createElementNS(NS, 'circle'); ring.setAttribute('cx', cx.toFixed(1)); ring.setAttribute('cy', cy.toFixed(1)); ring.setAttribute('r', 7); ring.setAttribute('class', 'pulse ' + it.st); pts.appendChild(ring);
            c.setAttribute('tabindex', '0'); c.setAttribute('role', 'button'); c.setAttribute('aria-label', g.name + ': ' + it.name + ', ' + (it.st === 'fixed' ? 'fixed' : 'advisory'));
          }
          pts.appendChild(c);
        });
      });
      // a clean report still gets one tappable pin: the inspector's best reading
      if (!nFind) { var g0 = rep.groups[0], z0 = svg.querySelector('#z-' + (CAT[g0.name] || 'paint')); if (z0) { var c0 = document.createElementNS(NS, 'circle'); c0.setAttribute('cx', +z0.getAttribute('x') + +z0.getAttribute('width') / 2); c0.setAttribute('cy', +z0.getAttribute('y') + +z0.getAttribute('height') / 2); c0.setAttribute('r', 7); c0.setAttribute('class', 'pt f best'); c0.dataset.g = 0; c0.dataset.i = 0; c0.setAttribute('tabindex', '0'); c0.setAttribute('role', 'button'); c0.setAttribute('aria-label', 'Inspector note'); pts.appendChild(c0); } }
      pick(-1, true);
    }).catch(function () { fig.innerHTML = '<p class="imap-load">The drawing did not load. The full list is below.</p>'; });

    function tween(to) {
      if (!svg) return; cancelAnimationFrame(raf); var from = vb.slice(), t0 = performance.now(), D = reduce ? 0 : 650;
      (function step(t) { var u = D ? Math.min(1, (t - t0) / D) : 1, e = 1 - Math.pow(1 - u, 4);
        vb = from.map(function (v, i) { return v + (to[i] - v) * e; }); svg.setAttribute('viewBox', vb.map(function (v) { return v.toFixed(1); }).join(' '));
        if (u < 1) raf = requestAnimationFrame(step); })(t0);
    }
    function boxFor(gi) {
      if (gi < 0 || !svg) return full; var z = svg.querySelector('#z-' + (CAT[rep.groups[gi].name] || 'road')); if (!z) return full;
      var x = +z.getAttribute('x'), y = +z.getAttribute('y'), w = +z.getAttribute('width'), h = +z.getAttribute('height'), pad = 26;
      x -= pad; y -= pad; w += pad * 2; h += pad * 2; var ar = 2; if (w / h > ar) { var nh = w / ar; y -= (nh - h) / 2; h = nh; } else { var nw = h * ar; x -= (nw - w) / 2; w = nw; }
      return [x, y, w, h];
    }
    function finding(g, it) {
      var f = it.find || [];
      return '<li class="nf ' + it.st + '"><p class="k">' + (it.st === 'fixed' ? 'Fixed before listing' : it.st === 'advisory' ? 'Advisory, disclosed' : 'Inspector note') + ' · ' + esc(short(g.name)) + '</p><b>' + esc(it.name) + '</b>' +
        (f[0] ? '<p>' + esc(f[0]) + '. ' + esc(f[1]) + '.</p><p class="mono">' + esc(f[3] || '') + (f[4] && f[4] !== f[3] ? ' → ' + esc(f[4]) : '') + '</p>' : '<p>' + esc(g.note || 'Every check in this group passed.') + '</p>') + '</li>';
    }
    function pick(gi, quiet, focusI) {
      cur = gi; host.querySelectorAll('.imap-cats button').forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.g === gi); });
      if (svg) { svg.setAttribute('data-cat', gi < 0 ? '' : (CAT[rep.groups[gi].name] || '')); svg.querySelectorAll('.pt,.pulse').forEach(function (p) { p.classList.toggle('dim', gi >= 0 && +p.dataset.g !== gi && !p.classList.contains('pulse')); }); }
      tween(boxFor(gi));
      if (gi < 0) {
        note.innerHTML = nFind ? '<p class="k">Findings first</p><ul class="nlist">' + rep.findings.map(function (fd) { return finding(rep.groups.filter(function (g) { return g.name === fd.g; })[0], fd.it); }).join('') + '</ul><p class="hint">Tap a category or a pulsing point to zoom in.</p>'
          : '<p class="k">Clean report</p><p>All 150 checks passed. Tap a category to see what was measured.</p>';
        return;
      }
      var g = rep.groups[gi], bad = g.items.filter(function (it) { return it.st !== 'pass'; }), good = g.items.filter(function (it) { return it.st === 'pass'; });
      if (focusI != null) bad.sort(function (a, b) { return (b === g.items[focusI] ? 1 : 0) - (a === g.items[focusI] ? 1 : 0); });
      note.innerHTML = '<p class="k">' + esc(g.name) + ' · ' + g.ok + ' of ' + g.total + ' passed</p>' + (bad.length ? '<ul class="nlist">' + bad.map(function (it) { return finding(g, it); }).join('') + '</ul>' : '<p>' + esc(g.note || 'Every check passed.') + '</p>') +
        '<details class="passed"><summary>' + good.length + ' passed checks</summary><ul>' + good.map(function (it) { return '<li><span>' + esc(it.name) + '</span><b>' + esc(it.val || 'Pass') + '</b></li>'; }).join('') + '</ul></details>';
      if (!quiet) note.classList.remove('in'), void note.offsetWidth, note.classList.add('in');
    }
    host.querySelector('.imap-cats').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) pick(+b.dataset.g); });
    function tapPoint(e) { var p = e.target.closest && e.target.closest('.pt.f'); if (!p) return; if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault(); pick(+p.dataset.g, false, +p.dataset.i); }
    fig.addEventListener('click', tapPoint); fig.addEventListener('keydown', tapPoint);
    return { pick: pick, get kind() { return kind; } };
  }
  window.InspectMap = { mount: mount, kindOf: kindOf };
})();
