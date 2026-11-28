/* Fieldwise — the page about the app. The matcher and the Tuesday run on the app's own engine (play.min.js: data,
   store, ui and the wall), loaded the first time someone reaches for either or scrolls near the day; until then the
   hero shows a finished match drawn into the page, and a click made before the engine arrives is replayed after it. */
(function () {
  'use strict';
  var d = document, nav = d.querySelector('.nav'), V = '13';
  /* the nav is the trip: the stop you are at, the legs behind you, and (on phones) how far along the route you are */
  var stops = [].slice.call(d.querySelectorAll('.trip a')), secs = stops.map(function (a) { return d.getElementById(a.getAttribute('href').slice(1)); }), bar = d.querySelector('.trip-bar'), tick = 0;
  function where() {
    tick = 0; nav.classList.toggle('scrolled', scrollY > 10);
    var at = 0, line = innerHeight * .42;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= line) at = i; });
    stops.forEach(function (a, i) { a.classList.toggle('on', i === at); a.classList.toggle('past', i < at); if (i === at) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    if (bar) bar.style.setProperty('--p', Math.min(1, scrollY / Math.max(1, d.documentElement.scrollHeight - innerHeight)).toFixed(3));
  }
  addEventListener('scroll', function () { if (!tick) tick = requestAnimationFrame(where); }, { passive: true });
  where();

  /* stacked layouts get the map that was drawn for a block, not for the full-bleed hero */
  var heroMap = d.querySelector('#match .mx-map'), tpl = d.getElementById('mx-map-m');
  if (heroMap && tpl && matchMedia('(max-width:1100px)').matches) { heroMap.textContent = ''; heroMap.appendChild(tpl.content.cloneNode(true)); heroMap.dataset.pre = '375x340'; }

  /* things that draw themselves when they come into view (the destination pin, the routes under the phones and the roles) */
  var draws = [].slice.call(d.querySelectorAll('[data-draw]'));
  if (draws.length && window.IntersectionObserver) { var dio = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('drawn'); dio.unobserve(x.target); } }); }, { rootMargin: '0px 0px -18% 0px' }); draws.forEach(function (el) { dio.observe(el); }); }
  else draws.forEach(function (el) { el.classList.add('drawn'); });

  /* the engine */
  var st = 0, q = [];
  function engine(fn) {
    if (fn) q.push(fn);
    if (st === 2) return flush();
    if (st === 1) return;
    st = 1; d.documentElement.classList.add('eng-loading');
    var s = d.createElement('script'); s.src = 'play.min.js?v=' + V; s.async = true;
    s.onload = function () { st = 2; d.documentElement.classList.remove('eng-loading'); window.CK.Play.productInit(); flush(); };
    s.onerror = function () { st = 0; q = []; d.documentElement.classList.remove('eng-loading'); };
    d.head.appendChild(s);
  }
  function flush() { var x = q; q = []; x.forEach(function (fn) { fn(); }); }
  var WANTS = '#match [data-brief], #match .mx-open, #play-day, [data-beat]';
  function hold(e) {
    if (st === 2) return;
    if (e.type === 'submit') {
      var f = e.target; if (!f.closest('#match')) return;
      e.preventDefault(); e.stopPropagation();
      return engine(function () { if (f.requestSubmit) f.requestSubmit(); else f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    }
    var el = e.target.closest && e.target.closest(WANTS); if (!el) return;
    e.preventDefault(); e.stopPropagation();
    engine(function () { el.click(); });
  }
  d.addEventListener('click', hold, true);
  d.addEventListener('submit', hold, true);
  ['#match .brief', '#match .mx-list', '#match .mx-trip', '#day'].forEach(function (sel) {
    var el = d.querySelector(sel); if (!el) return;
    var warm = function () { engine(); el.removeEventListener('pointerover', warm); el.removeEventListener('focusin', warm); };
    el.addEventListener('pointerover', warm); el.addEventListener('focusin', warm);
  });
  if (heroMap && (Math.abs(innerWidth - 1440) > 160 || Math.abs(heroMap.clientWidth / Math.max(1, heroMap.clientHeight) - 1440 / 808) > .08) && innerWidth > 480) { var idle = function () { engine(); }; addEventListener('load', function () { if (window.requestIdleCallback) requestIdleCallback(idle, { timeout: 4000 }); else setTimeout(idle, 2500); }); }
  var day = d.getElementById('day');
  if (day && window.IntersectionObserver) {
    var io = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { io.disconnect(); engine(); } }, { rootMargin: '160px 0px' });
    io.observe(day);
  }

  /* four working screens: a still of each, swapped for the real screen on request */
  var LIVE = [
    { h: '#/calling/Q1', img: 'live-calling', title: 'the first-call queue', alt: 'Call mode in Fieldwise: the script for a new lead, the last notes, outcome buttons and Save and next', p: 'press 1 for Connected, pick a next step, then N to save and move to the next call.' },
    { h: '#/verify/P19', img: 'live-verify', title: 'the verification desk', alt: 'The verification desk: a new 3 BHK listing waiting for its field photos, pin check and checklist', p: 'press Attach field photos, then Tick all, then Approve. The Verified badge goes on for 30 days and the next listing opens.' },
    { h: '#/deals~deal:D-322', img: 'live-deal', title: 'a deal at move-in', alt: 'A rental deal at move-in: price, the token, and the documents with police verification still open', p: 'press Close deal and it says what is missing. Tick Police verification, then close it.' },
    { h: '#/import', img: 'live-import', title: 'importing a listing sheet', alt: 'Import listings: a broker’s PDF sheet read line by line, with the unsure lines set aside for a person', p: 'pick the Amaltas desk sheet. Fieldwise reads it line by line and asks a person only about the lines it is unsure of.' }
  ];
  var tabs = [].slice.call(d.querySelectorAll('[data-live]')), panel = d.getElementById('lp'), view = d.getElementById('live-v'), prompt = d.getElementById('live-prompt'), cur = 0, inUse = false;
  if (!tabs.length || !view) return;
  var full = d.createElement('a'); full.className = 'live-full'; full.target = '_blank'; full.rel = 'noopener';
  view.insertAdjacentElement('afterend', full);
  function still(i) {
    var x = LIVE[i];
    return '<picture><source media="(max-width:640px)" srcset="shots/' + x.img + '-m.webp"><img src="shots/' + x.img + '.webp" width="1200" height="720" decoding="async" alt="' + x.alt + '"></picture>' +
      '<button type="button" class="btn primary live-go"><svg class="ic" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>Use it here</button>';
  }
  function frame(i) {
    var f = d.createElement('iframe'); f.src = 'index.html?embed=1' + LIVE[i].h; f.title = 'Fieldwise, ' + LIVE[i].title + ', working';
    f.addEventListener('load', function () { try { if (d.activeElement === f || view.contains(d.activeElement) || d.activeElement === d.body) f.contentWindow.focus(); } catch (e) { /* same origin; ignore */ } });
    view.textContent = ''; view.appendChild(f); view.classList.add('on');
  }
  function show(i, focus) {
    cur = i;
    tabs.forEach(function (t, j) { var on = j === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    panel.setAttribute('aria-labelledby', tabs[i].id);
    prompt.textContent = LIVE[i].p;
    full.href = 'index.html' + LIVE[i].h; full.textContent = 'Open ' + LIVE[i].title + ' full size';
    if (inUse) frame(i); else { view.innerHTML = still(i); view.classList.remove('on'); }
    if (focus) tabs[i].focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { if (i !== cur) show(i); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = tabs.length, j = k === 'ArrowRight' || k === 'ArrowDown' ? (i + 1) % n : k === 'ArrowLeft' || k === 'ArrowUp' ? (i + n - 1) % n : k === 'Home' ? 0 : k === 'End' ? n - 1 : -1;
      if (j < 0) return; e.preventDefault(); show(j, true);
    });
  });
  view.addEventListener('click', function (e) { if (e.target.closest('.live-go')) { inUse = true; frame(cur); var f = view.querySelector('iframe'); if (f) f.focus(); } });
  full.href = 'index.html' + LIVE[0].h; full.textContent = 'Open ' + LIVE[0].title + ' full size';
})();
