/* Aaranya · signature pieces: the hour of the day, the floor ribbon, window light,
   the live availability ticker and the footer skyline. Loaded on every public page after app.js. */
(function () {
  'use strict';
  var A = window.AAR, $ = A.$, $$ = A.$$;

  /* ---------- the hour: the sun-path re-tints the whole site, and the next page remembers it ---------- */
  var root = document.documentElement;
  A.applyHour = function (h, keep) {
    var dist = Math.abs(h - 12.5), warm = Math.max(0, Math.min(1, (dist - 2) / 4.2));
    var night = h < 6 || h > 18.6;
    var c = night ? '120, 150, 128' : warm > .6 ? '232, 152, 80' : '232, 182, 90';
    root.style.setProperty('--warm', warm.toFixed(3)); root.style.setProperty('--sunc', c);
    if (keep !== false) A.set('hour', h);
    skyline(h);
  };
  var saved = A.get('hour', 17.2);

  /* ---------- the lift: each section of a page is a level, and the right edge is the lift panel ---------- */
  function ribbon() {
    if (document.body.classList.contains('bo')) return;
    var secs = $$('main > section').filter(function (s) { return s.offsetHeight > 200 && !s.classList.contains('hero-static'); });
    if (secs.length < 3) return;
    var n = secs.length, names = secs.map(function (s, i) {
      var k = s.querySelector('.sec-head .k, .phero > .k, .phero .k'), h = s.querySelector('h1, h2');
      var t = s.dataset.floor || (k ? k.textContent.split('·')[0] : '') || (h ? h.textContent : 'Level ' + (i + 1));
      if (!s.id) s.id = 'fl-' + (i + 1);
      return t.replace(/\s+/g, ' ').trim().replace(/[.,:]+$/, '').slice(0, 28);
    });
    // pages without their own levels ride from the ground floor up the tower
    var levels = secs.map(function (s, i) { return s.dataset.level || (i === 0 ? 'G' : String(Math.round(4 + 42 * i / Math.max(1, n - 1)))); });
    secs.forEach(function (s, i) { var sh = s.querySelector('.sec-head'); if (sh) sh.setAttribute('data-l', levels[i]); });
    var rank = function (l) { return l === 'SC' ? 999 : l === 'P' ? 0.5 : l === 'G' ? 0 : l === 'L' ? -1 : +l; };
    var uniq = levels.filter(function (l, i) { return levels.indexOf(l) === i; }).sort(function (a, b) { return rank(b) - rank(a); });
    var r = document.createElement('nav'); r.className = 'ribbon'; r.setAttribute('aria-label', 'Lift: the levels of this page');
    r.innerHTML = '<button type="button" class="lbl"><b>G</b><span></span></button><ol>' + uniq.map(function (l) { var i = levels.indexOf(l); return '<li><a href="#' + secs[i].id + '" data-l="' + l + '" aria-label="Level ' + l + ': ' + A.esc(names[i]) + '">' + l + '</a></li>'; }).join('') + '</ol>';
    document.body.appendChild(r);
    var lbl = r.querySelector('.lbl'), links = $$('a', r), cur = -1, t = 0;
    function set(i) {
      if (i === cur) return; cur = i;
      lbl.querySelector('b').textContent = levels[i]; lbl.querySelector('span').textContent = names[i];
      lbl.setAttribute('aria-label', 'Level ' + levels[i] + ', ' + names[i] + '. Go to the next section');
      links.forEach(function (a) { a.setAttribute('aria-current', String(a.dataset.l === levels[i])); });
      r.classList.add('moving'); clearTimeout(t); t = setTimeout(function () { r.classList.remove('moving'); }, 1400);
    }
    function check() {
      var mid = innerHeight * 0.45, best = 0;
      secs.forEach(function (s, i) { if (s.getBoundingClientRect().top < mid) best = i; });
      set(best);
      var hero = $('.hero'), past = hero ? hero.getBoundingClientRect().bottom < innerHeight * 0.6 : scrollY > innerHeight * 0.5;
      r.classList.toggle('on', past);
    }
    addEventListener('scroll', function () { requestAnimationFrame(check); }, { passive: true }); check();
    lbl.addEventListener('click', function () { var nx = secs[(cur + 1) % secs.length]; nx.scrollIntoView({ behavior: A.reduce ? 'auto' : 'smooth' }); });
  }

  /* ---------- phones: the launcher and the back link tuck away while you scroll, and come back when you stop ---------- */
  (function () {
    var t = 0, mq = matchMedia('(max-width: 760px)');
    addEventListener('scroll', function () { if (!mq.matches) return; root.classList.add('scrolling'); clearTimeout(t); t = setTimeout(function () { root.classList.remove('scrolling'); }, 900); }, { passive: true });
  })();

  /* ---------- window light: sun through tall glass, cast on the wall, drifting slowly over a few chapters ---------- */
  function panes(seed) {
    var r = A.rng(seed), d = '';
    for (var k = 0; k < 2; k++) {                       // two windows of light, each a skewed grid of panes with mullions between
      var x0 = 4 + r() * 40 + k * 38, y0 = 2 + r() * 26, cols = 3, rows = 4 + Math.floor(r() * 2);
      var pw = 8 + r() * 3, ph = 11 + r() * 3, g = 1.2, sk = -(0.38 + r() * 0.2);
      for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
        var x = x0 + i * (pw + g), y = y0 + j * (ph + g), o1 = sk * (y - y0), o2 = sk * (y + ph - y0);
        d += 'M' + (x + o1).toFixed(2) + ' ' + y.toFixed(2) + 'L' + (x + pw + o1).toFixed(2) + ' ' + y.toFixed(2) + 'L' + (x + pw + o2).toFixed(2) + ' ' + (y + ph).toFixed(2) + 'L' + (x + o2).toFixed(2) + ' ' + (y + ph).toFixed(2) + 'Z';
      }
    }
    return d;
  }
  $$('.has-light').forEach(function (s, i) {
    var d = document.createElement('div'); d.className = 'winlight'; d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="' + panes(77 + i * 13) + '"/></svg>';
    s.insertBefore(d, s.firstChild);
  });

  /* ---------- availability ticker (live: the back office edits the same inventory) ---------- */
  var tk = $('#ticker');
  function ticker() {
    if (!tk) return;
    var pick = [], seen = {};
    A.TOWERS.map(function (T) { return T.id; }).forEach(function (t) {
      A.UNITS.filter(function (u) { return u.tower === t && A.status(u.id) !== 'sold'; }).sort(function (a, b) { return b.floor - a.floor; }).forEach(function (u, i) {
        var k = u.type + t + Math.floor(u.floor / 6);
        if (i % 4 === 0 && !seen[k]) { seen[k] = 1; pick.push(u); }
      });
    });
    pick = pick.slice(0, 26);
    var c = A.counts();
    var head = '<a href="picker.html"><b>' + c.avail + ' homes open</b><span>' + c.hold + ' on hold · ' + c.sold + ' sold of ' + A.UNITS.length + '</span></a>';
    var items = pick.map(function (u) { var st = A.status(u.id); return '<a href="picker.html?unit=' + u.id + '"><i class="' + st + '" aria-hidden="true"></i><b>' + u.id + '</b><span>' + A.TYPES[u.type].short + ' · ' + u.facing.toLowerCase() + '</span><span class="p">' + A.inr(A.price(u).total) + '</span>' + (st === 'hold' ? '<span>on hold</span>' : '') + '</a>'; }).join('');
    var row = head + items;
    $('.ticker-t', tk).innerHTML = row + row.replace(/<a /g, '<a tabindex="-1" aria-hidden="true" ');
  }
  ticker(); A.on('inv', ticker);

  /* ---------- footer skyline: the towers at the hour you left them ---------- */
  function skyline(h) {
    var sun = $('#ftr-sun'), lit = $('#ftr-lit'), hr = $('#ftr-hour'); if (!sun) return;
    var t = Math.max(0, Math.min(1, (h - 6) / 12.6)), x = 140 + t * 1160, y = 250 - Math.sin(t * Math.PI) * 210;
    sun.setAttribute('cx', x.toFixed(0)); sun.setAttribute('cy', y.toFixed(0));
    var night = h < 6.2 || h > 18.4; sun.style.opacity = night ? '0' : '1';
    if (lit && !lit.childNodes.length) {
      var r = A.rng(5), s = '';
      [[560, 22, 90, 278], [664, 36, 84, 264], [768, 52, 96, 248]].forEach(function (b) { for (var yy = b[1] + 10; yy < 290; yy += 12) for (var xx = b[0] + 8; xx < b[0] + b[2] - 10; xx += 14) if (r() < 0.32) s += '<rect class="tw-l" x="' + xx + '" y="' + yy + '" width="8" height="5"/>'; });
      lit.innerHTML = s;
    }
    if (lit) lit.style.opacity = night ? '1' : h > 17 ? '.55' : '0';
    if (hr) hr.innerHTML = 'Sun over Sector 109 at <b>' + A.fmtHour(h) + '</b>, the hour you left it on the model.';
  }

  ribbon();
  A.applyHour(saved, false);
})();
