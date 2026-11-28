/* Concept A · Sheet to Skyline: page logic. The WebGL city (city3d.js) loads after first paint, over a poster. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  /* city order: client boards at the front, then systems, then the long websites, low to tall */
  var W = ['recrm', 'reweb', 'interp', 'boxx', 'studio', 'ent', 'const', 'crm', 'estate', 'stockroom', 'quotes', 'work', 'orders', 'store', 'watch', 'gym', 'saas', 'interior', 'revv', 'launch', 'resort', 'masonry', 'build'].map(function (id) { return window.WORK.filter(function (w) { return w.id === id; })[0]; }), N = W.length;
  var $ = function (s) { return d.querySelector(s); };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  var clamp = function (v, a, b) { a = a || 0; b = b === undefined ? 1 : b; return v < a ? a : v > b ? b : v; };
  var mobile = matchMedia('(max-width: 760px)').matches, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var RISE = 115, STEP = mobile ? 54 : 62, OUT = 95;
  var fxC = $('#fxC'), fxT = $('#fxT'), file = $('#file');
  function fx(c, t) { if (fxC.textContent !== c) fxC.textContent = c; if (fxT.textContent !== t) fxT.textContent = t; }

  /* the sheet: one row per project */
  var body = $('#rowsBody'), tabs = $('#tabs'), filter = 'all';
  W.forEach(function (w, i) {
    var tr = d.createElement('tr'), src = w.img ? 'img/' + w.img + '-s.webp' : w.card ? 'img/cards/' + w.card + '-480.webp' : '';
    tr.dataset.cat = w.cat;
    tr.innerHTML = '<th class="mono">' + (i + 2) + '</th><td><a class="pn" href="' + esc(w.href) + '">' + (src ? '<img src="' + src + '" alt="" loading="lazy" width="60" height="38">' : '<span class="ph"></span>') + '<span>' + esc(w.name) + '<small>' + esc(w.kind) + '</small></span></a></td><td class="k">' + esc(w.kind) + '</td><td class="s">' + esc(w.status) + '</td><td class="o" aria-hidden="true">→</td>';
    tr.addEventListener('click', function (e) { if (!e.target.closest('a')) tr.querySelector('a').click(); });
    body.appendChild(tr);
  });
  [['all', 'All'], ['client', 'Client work'], ['web', 'Websites'], ['sys', 'Systems']].forEach(function (t) {
    var b = d.createElement('button'), n = t[0] === 'all' ? N : W.filter(function (w) { return w.cat === t[0]; }).length;
    b.type = 'button'; b.innerHTML = t[1] + '<b>' + n + '</b>'; b.setAttribute('aria-pressed', t[0] === 'all');
    b.addEventListener('click', function () {
      filter = t[0];
      [].forEach.call(tabs.children, function (c) { c.setAttribute('aria-pressed', c === b); });
      [].forEach.call(body.rows, function (r) { r.hidden = filter !== 'all' && r.dataset.cat !== filter; });
      fx('A1:D24', '=FILTER(work, "' + filter + '")');
    });
    tabs.appendChild(b);
  });

  /* the formula evaluates from the inside out */
  var fb = [].slice.call(d.querySelectorAll('#formula b')), steps = [].slice.call(d.querySelectorAll('#steps li')), held = false, at = -1;
  function lit(k) { fb.forEach(function (b) { b.classList.toggle('on', +b.dataset.k === k); }); steps.forEach(function (l, i) { l.classList.toggle('on', i === k); }); }
  fb.forEach(function (b) { b.addEventListener('pointerenter', function () { held = true; lit(+b.dataset.k); }); b.addEventListener('pointerleave', function () { held = false; }); });
  steps.forEach(function (l, i) { l.addEventListener('pointerenter', function () { held = true; lit(i); }); l.addEventListener('pointerleave', function () { held = false; }); });
  var howOn = false;
  if (!reduce) setInterval(function () { if (!howOn || held) return; at = (at + 1) % 6; lit(at === 5 ? -1 : at); }, 1150); else lit(0);

  /* reveals and the formula bar for the sections after the city */
  var SEC = { sheet: ['A1:H2', '=RESULTS(live_systems)'], how: ['B1', '=LAUNCH(BUILD(DECIDE(MAP(LISTEN(your_team)))))'], contact: ['C1', '=EMAIL("contact.abbytes@gmail.com")'] }, secNow = '';
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    [].forEach.call(d.querySelectorAll('.rv'), function (el) { io.observe(el); });
    var so = new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (e.target.id === 'how') howOn = e.isIntersecting;
      if (e.isIntersecting) { secNow = e.target.id; var f = SEC[secNow]; fx(f[0], f[1]); } else if (secNow === e.target.id) secNow = '';
    }); }, { rootMargin: '-45% 0px -45% 0px' });
    ['sheet', 'how', 'contact'].forEach(function (id) { so.observe($('#' + id)); });
  } else [].forEach.call(d.querySelectorAll('.rv'), function (el) { el.classList.add('in'); });

  var copy = $('#copy');
  copy.addEventListener('click', function () { var done = function () { copy.textContent = 'Copied'; setTimeout(function () { copy.textContent = 'Copy the address'; }, 1800); }; if (navigator.clipboard) navigator.clipboard.writeText('contact.abbytes@gmail.com').then(done, done); else done(); });

  /* the city: scroll position → rise, stop, outro */
  var world = $('#world'), track = $('#city'), cap = $('#cap'), rowsEl = $('#rows'), api = null, cur = -1, inCity = false, busy = false;
  var gl = (function () { try { var c = d.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
  var noCity = reduce || !gl;
  track.style.setProperty('--len', RISE + (N - 1) * STEP + OUT);
  function top(i) { return (RISE + i * STEP) / 100 * innerHeight + 2; }
  function go(i) { window.scrollTo({ top: top(clamp(i, 0, N - 1)), behavior: reduce ? 'auto' : 'smooth' }); }
  W.forEach(function (w, i) { var b = d.createElement('button'); b.type = 'button'; b.tabIndex = -1; b.textContent = i + 2; b.title = w.name; b.addEventListener('click', function () { go(i); }); rowsEl.appendChild(b); });
  function show(i) {
    var w = W[i]; cur = i;
    $('#capC').textContent = 'A' + (i + 2); $('#capS').textContent = window.CATS[w.cat] + ' · ' + (i + 1) + ' of ' + N;
    $('#capN').textContent = w.name; $('#capK').textContent = w.kind + ' · ' + w.status; $('#capB').textContent = w.blurb;
    var g = $('#capG'); g.href = w.href; g.firstElementChild.textContent = w.cta;
    cap.classList.remove('sw'); void cap.offsetWidth; cap.classList.add('sw');
    [].forEach.call(rowsEl.children, function (b, k) { b.classList.toggle('on', k === i); });
    fx('A' + (i + 2), '=OPEN("' + w.name + '")');
  }
  function state() {
    busy = false;
    var p = window.scrollY / innerHeight * 100, r = clamp(p / RISE), s = clamp((p - RISE) / STEP, 0, N - 1), o = clamp((p - RISE - (N - 1) * STEP - 30) / (OUT - 30));
    var on = !noCity && p > RISE * .8 && o < .4, i = Math.round(s);
    if (api) api.set(r, s, o, on ? i : -1);
    if (on !== inCity) { inCity = on; root.classList.toggle('city', on); if (!on) cur = -1; }
    var sys = r > .55; if (root.classList.contains('sys') !== sys) { root.classList.toggle('sys', sys); file.innerHTML = sys ? '<b>●</b> one system · saved' : '<b>●</b> Copy of leads_FINAL_v7 (2).xlsx'; }
    if (on) { if (i !== cur) show(i); } else if (!secNow) { if (p < 12) fx('A1', '=DRAW(every_mess)'); else if (o < .4) fx('A2:A24', '=RAISE(A2:A24)'); else fx('A2:A24', '=SKYLINE(A2:A24)'); }
  }
  function onScroll() { if (!busy) { busy = true; requestAnimationFrame(state); } }
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll);
  $('#prev').addEventListener('click', function () { go(cur - 1); }); $('#next').addEventListener('click', function () { go(cur + 1); });
  addEventListener('keydown', function (e) { if (!inCity || e.metaKey || e.ctrlKey || e.altKey) return; if (e.key === 'ArrowRight') { go(cur + 1); e.preventDefault(); } else if (e.key === 'ArrowLeft') { go(cur - 1); e.preventDefault(); } });
  [].forEach.call(d.querySelectorAll('a[href="#city"]'), function (a) {
    if (noCity) { a.setAttribute('href', '#sheet'); if (a.classList.contains('btn')) a.firstChild.textContent = 'See the projects '; else a.hidden = true; return; }
    a.addEventListener('click', function (e) { e.preventDefault(); go(0); });
  });

  if (noCity) { root.classList.add('no3d'); $('#all').open = true; state(); return; }
  var loaded = false;
  function load() {
    if (loaded) return; loaded = true;
    import('./city3d.js?v=2').then(function (m) { return m.init({ canvas: $('#gl'), items: W, mobile: mobile, base: 'img/' }); }).then(function (a) {
      api = window.__city = a; state(); a.jump(); a.start(); root.classList.add('live');
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting && !d.hidden) a.start(); else a.stop(); }).observe(world);
      d.addEventListener('visibilitychange', function () { if (d.hidden) a.stop(); else if (world.getBoundingClientRect().bottom > 0) a.start(); });
    }).catch(function (e) { console.warn('3D city unavailable', e); noCity = true; root.classList.add('no3d'); state(); });
  }
  if (mobile) { ['touchstart', 'scroll', 'pointerdown', 'keydown'].forEach(function (ev) { addEventListener(ev, load, { once: true, passive: true }); }); setTimeout(load, 3200); }
  else if (window.requestIdleCallback) requestIdleCallback(load, { timeout: 900 }); else setTimeout(load, 300);

  /* pointer: a little parallax; the tower in focus opens its project */
  var free = function (e) { return !e.target.closest('a,button,.cap,.bar,.sec'); };
  addEventListener('pointermove', function (e) {
    if (!api || e.pointerType === 'touch') return;
    var x = e.clientX / innerWidth * 2 - 1, y = -(e.clientY / innerHeight * 2 - 1); api.pointer(x, y);
    root.style.cursor = inCity && free(e) && api.hit(x, y) ? 'pointer' : '';
  }, { passive: true });
  var messT = 0, messed = false;
  addEventListener('pointerdown', function (e) { if (!api || !inCity || e.button || e.pointerType === 'touch' || !free(e)) return; clearTimeout(messT); messT = setTimeout(function () { messed = true; api.mess(1); fx('A2:A24', '=UNDO(system)'); }, 260); });
  addEventListener('pointerup', function () { clearTimeout(messT); if (messed) { api.mess(0); if (cur >= 0) fx('A' + (cur + 2), '=OPEN("' + W[cur].name + '")'); setTimeout(function () { messed = false; }, 60); } });
  addEventListener('click', function (e) {
    if (!api || !inCity || cur < 0 || !free(e) || messed) return;
    if (api.hit(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1))) location.href = W[cur].href;
  });
  state();
})();
