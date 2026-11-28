/* Forge home: kinetic hero + heat ring, velocity band, pinned week, classes reveal list, coaches, floors,
   live timetable (skeletons, empty states, booking + undo), plans, trial booking with inline validation. */
(function () {
  'use strict';
  var F = window.Forge, $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = F.esc, root = document.documentElement, I = F.ICON;
  var G = window.gsap, reduce = F.reduce || !G;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  function refreshST() { if (window.ScrollTrigger) requestAnimationFrame(function () { ScrollTrigger.refresh(); }); }
  function scrollToEl(el) { if (window.Motion && Motion.lenis) Motion.lenis.scrollTo(el, { offset: -70 }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }

  /* ================= HERO ================= */
  var h1 = $('#heroH'), hero = $('.hero'), chars = [];
  $$('.hl', h1).forEach(function (hl) {
    var inner = document.createElement('span'); inner.className = 'hl-in'; inner.style.display = 'inline-block';
    [].slice.call(hl.childNodes).forEach(function (n) {
      if (n.nodeType === 3) { n.textContent.split('').forEach(function (c) { if (c === ' ') { inner.appendChild(document.createTextNode(' ')); return; } var s = document.createElement('span'); s.className = 'ch'; s.textContent = c; inner.appendChild(s); chars.push(s); }); }
      else inner.appendChild(n);
    });
    hl.textContent = ''; hl.appendChild(inner); hl.style.overflow = 'clip'; hl.style.paddingBottom = '.04em'; hl.setAttribute('aria-hidden', 'true');
  });
  h1.setAttribute('aria-label', 'Strong is a weekly habit.');
  var em = $('em', h1);

  function intro() {
    root.classList.add('intro');
    if (reduce) return;
    // scripts arrived after the CSS failsafe had already shown the hero (a very slow connection): no second entrance
    if (window.FORGE_LATE) { cacheRects(); placeRing(); if (!fine) wave(); return; }
    var tl = G.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hero-img, #heroVideo', { scale: 1.12, duration: 2.6, ease: 'power3.out' }, 0)
      .from($$('.hl-in', h1), { yPercent: 118, duration: 1.4, stagger: 0.1 }, 0.1)
      .from(em, { skewX: -14, scaleX: 1.25, duration: 1.6, ease: 'expo.out' }, 0.35)
      .from($$('[data-hero]', hero), { y: 24, autoAlpha: 0, duration: 1.1, stagger: 0.08 }, 0.7)
      .from('.cue', { autoAlpha: 0, duration: 1 }, 1.2)
      .fromTo(ring, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.2, ease: 'expo.out' }, 1.1)
      .add(function () { cacheRects(); placeRing(); if (!fine) wave(); }, 1.5);
  }

  /* cursor-reactive letters (variable font width + weight) */
  var mx = -9999, my = -9999, rects = [], cur = chars.map(function () { return 0; }), running = false, inHero = false;
  function cacheRects() { rects = chars.map(function (c) { var r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 + scrollY }; }); }
  function loop() {
    var R = Math.max(170, innerWidth * 0.16), settled = true;
    for (var i = 0; i < chars.length; i++) {
      var r = rects[i]; if (!r) continue;
      var dx = mx - r.x, dy = (my + scrollY) - r.y, d = Math.sqrt(dx * dx + dy * dy);
      var t = inHero ? Math.max(0, 1 - d / R) : 0; t = t * t * (3 - 2 * t);
      cur[i] += (t - cur[i]) * 0.14;
      if (Math.abs(t - cur[i]) > 0.002) settled = false;
      chars[i].style.fontVariationSettings = "'wdth' " + (66 + 30 * cur[i]).toFixed(1) + ",'wght' " + (820 + 80 * cur[i]).toFixed(0);
    }
    if (settled && !inHero) { running = false; return; }
    requestAnimationFrame(loop);
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }
  /* touch screens: a slow "breath" sweeps through the letters every few seconds instead of a cursor */
  var waveT;
  function wave() {
    if (reduce || !rects.length) return;
    var b = h1.getBoundingClientRect(), p = { x: b.left - 200, y: b.top + b.height * 0.25 };
    inHero = true; kick();
    G.to(p, { x: b.right + 200, y: b.top + b.height * 0.8, duration: 2.6, ease: 'sine.inOut', onUpdate: function () { mx = p.x; my = p.y; }, onComplete: function () { inHero = false; kick(); } });
    clearTimeout(waveT); waveT = setTimeout(function () { if (hero.getBoundingClientRect().bottom > 0) wave(); else waveT = setTimeout(wave, 4000); }, 7000);
  }

  var ring = $('#ring'), ringC = $('#ringC');
  function nextInfo() {
    var s = F.nextSession(); if (!s) return;
    var today = s.date === F.iso(new Date());
    $('#nextText').textContent = 'Next · ' + s.cls.name + ' · ' + (today ? '' : F.DAYS[F.dow(new Date(s.date + 'T00:00'))] + ' ') + s.time + ' · ' + F.branches[s.branch].name + ' · ' + s.left + ' left';
    ringC.innerHTML = esc(s.time) + ' <br>' + s.left + ' left';
    var label = ('Next · ' + s.cls.name + ' · ' + F.branches[s.branch].name + ' · ').toUpperCase(), txt = label;
    if (txt.length < 30) txt += label; var tp = $('textPath', ring); tp.textContent = txt; tp.setAttribute('textLength', '285'); tp.setAttribute('lengthAdjust', txt.length > 46 ? 'spacingAndGlyphs' : 'spacing');
    $('#ringSr').textContent = ': next class, ' + s.cls.name + ' at ' + F.branches[s.branch].name + '. See the timetable.';
  }
  /* the badge docks beside the short "habit." line (never over the headline) and leans toward the pointer */
  function placeRing() {
    if (!ring.classList.contains('desk')) return;
    var foot = $('.hero-foot', hero), hb = hero.getBoundingClientRect(), fb = foot.getBoundingClientRect();
    ring.style.bottom = Math.round(hb.bottom - fb.top + 22) + 'px';
  }
  if (fine) {
    ring.classList.add('desk'); placeRing(); addEventListener('resize', placeRing);
    if (document.fonts) document.fonts.ready.then(placeRing);
  } else { ring.classList.add('dock'); }
  if (fine && !reduce) {
    var rxTo = G.quickTo(ring, 'x', { duration: 0.7, ease: 'power3' }), ryTo = G.quickTo(ring, 'y', { duration: 0.7, ease: 'power3' });
    hero.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY; inHero = true; kick();
      var r = ring.getBoundingClientRect(), cx = r.left + r.width / 2 - (G.getProperty(ring, 'x') || 0), cy = r.top + r.height / 2 - (G.getProperty(ring, 'y') || 0);
      var dx = e.clientX - cx, dy = e.clientY - cy, d = Math.sqrt(dx * dx + dy * dy), k = d < 260 ? (1 - d / 260) : 0;
      rxTo(Math.max(-28, Math.min(28, dx * 0.3 * k))); ryTo(Math.max(-28, Math.min(28, dy * 0.3 * k)));
      ring.classList.toggle('near', d < 90);
    });
    hero.addEventListener('pointerleave', function () { inHero = false; kick(); rxTo(0); ryTo(0); ring.classList.remove('near'); });
    ring.addEventListener('pointerdown', function () { ring.classList.add('press'); });
    addEventListener('pointerup', function () { ring.classList.remove('press'); });
    addEventListener('resize', cacheRects);
  }

  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { hero.classList.toggle('off', !es[0].isIntersecting); }).observe(hero);
  /* the front-desk chat launcher waits until the hero's own "next class" chip has scrolled away, so the two never stack */
  var nc = document.getElementById('nextChip'); if (nc && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { document.body.classList.toggle('chat-wait', es[0].isIntersecting); }).observe(nc);

  /* ================= KINETIC BAND (scroll velocity -> speed + width axis) ================= */
  function band() {
    /* The loop itself is a CSS keyframe animation on the track (compositor-only, 2 copies, -50%).
       JS only (a) pauses it off-screen / in hidden tabs and (b) adds a small, throttled scroll-velocity
       nudge: skewX on the ROW via quickTo, plus a playbackRate bump. The track transform is never touched. */
    var band = $('.band'), rows = $$('.band-row'); if (!band || !rows.length || reduce) return;
    var anims = []; rows.forEach(function (r) { var t = r.firstElementChild; if (t.getAnimations) anims = anims.concat(t.getAnimations()); });
    var skews = rows.map(function (r) { return G.quickTo(r, 'skewX', { duration: 0.6, ease: 'power3' }); });
    var onScreen = false, last = scrollY, lastT = 0, rate = 1;
    var setPlay = function () { band.classList.toggle('paused', !onScreen || document.hidden); };
    new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; setPlay(); }).observe(band);
    document.addEventListener('visibilitychange', setPlay);
    addEventListener('scroll', function () {
      if (!onScreen) { last = scrollY; return; }
      var now = performance.now(); if (now - lastT < 80) return;            /* about 12 updates a second, not every frame */
      var v = (scrollY - last) / (now - lastT || 16); last = scrollY; lastT = now;
      var k = Math.max(-1, Math.min(1, v / 3));
      skews.forEach(function (q, i) { q(k * (i ? 6 : -6)); });
      var r = 1 + Math.min(2.2, Math.abs(v) * 0.9); if (Math.abs(r - rate) > 0.15) { rate = r; anims.forEach(function (a) { a.playbackRate = rate; }); }
      clearTimeout(band._t); band._t = setTimeout(function () { skews.forEach(function (q) { q(0); }); rate = 1; anims.forEach(function (a) { a.playbackRate = 1; }); }, 180);
    }, { passive: true });
  }

  /* ================= THE WEEK (pinned, scrubbed) ================= */
  var ORDER = [['strength', [0, 2, 4], 'heavy-hour'], ['engine', [1, 3], 'engine-room'], ['hyrox', [5], 'hyrox-sim'], ['recovery', [6], 'mobility']];
  var stage = $('#weekStage');
  stage.innerHTML = ORDER.map(function (o, i) {
    var t = F.types[o[0]], n = F.classes.filter(function (c) { return c.type === o[0]; }).length;
    return '<article class="wk" data-i="' + i + '">' +
      '<div class="wk-spec"><p class="wk-n mono">0' + (i + 1) + ' / 04 · ' + esc(t.name) + ' · ' + n + ' classes</p>' +
      '<p class="wk-days">' + o[1].map(function (d) { return F.DAYS_L[d]; }).join(' · ') + '</p>' +
      '<div class="wk-stats"><div><b>' + t.perWeek + '×</b><span class="mono">per week</span></div><div><b>' + t.mins + '′</b><span class="mono">per session</span></div></div>' +
      '<p>' + esc(t.intent) + '</p><a class="ul" href="class.html?id=' + o[2] + '">See ' + esc(F.cls(o[2]).name) + ' <span class="arr">→</span></a></div>' +
      '<figure class="wk-media"><video class="lazyv" data-manual muted loop playsinline preload="none" poster="' + t.poster + '" data-src="' + t.video + '" aria-hidden="true"></video><figcaption class="mono">' + esc(t.name) + ' · ' + t.mins + ' min</figcaption></figure>' +
      '<span class="wk-big" aria-hidden="true">0' + (i + 1) + '</span>' +
      '<h3 class="wk-word">' + esc(t.name) + '</h3></article>';
  }).join('');
  var wks = $$('.wk', stage), wvids = $$('video', stage), dayEls = $$('.week-days li'), segs = $$('.week-prog i'), segLabels = $$('.week-prog span');
  var curI = -1;
  function setActive(i) {
    if (i === curI) return; curI = i;
    dayEls.forEach(function (li, d) { li.classList.toggle('on', ORDER[i][1].indexOf(d) > -1); });
    segLabels.forEach(function (s, k) { s.classList.toggle('on', k === i); });
    wvids.forEach(function (v, k) { if (k === i && !reduce) { if (!v.getAttribute('src')) v.src = v.dataset.src; var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); });
  }
  function week() {
    if (reduce) { wvids.forEach(function (v) { v.src = v.dataset.src; }); return; }
    new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { wvids.forEach(function (v) { if (!v.getAttribute('src')) { v.preload = 'auto'; v.src = v.dataset.src; } }); o.disconnect(); } }, { rootMargin: '100% 0px' }).observe($('#week'));
    /* timeline in "beats": each block holds still for 0.6, transitions take 1.0. Total 5.2. */
    var STEP = 1.6, HOLD0 = 0.4, TOTAL = HOLD0 + STEP * 3 + 0.2;
    var settle = [0, (HOLD0 + 1.0 + 0.3) / TOTAL, (HOLD0 + STEP + 1.0 + 0.3) / TOTAL, 1];
    var idxAt = function (p) { var t = p * TOTAL; return t < HOLD0 + 0.6 ? 0 : t < HOLD0 + STEP + 0.6 ? 1 : t < HOLD0 + 2 * STEP + 0.6 ? 2 : 3; };
    var tl = G.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '#week', start: 'top top', end: function () { return '+=' + innerHeight * 3.6; }, pin: true, scrub: 0.9, anticipatePin: 1, invalidateOnRefresh: true,
      snap: { snapTo: settle, directional: false, inertia: false, duration: { min: 0.3, max: 0.8 }, delay: 0.15, ease: 'power2.inOut' },
      onUpdate: function (s) { var t = s.progress * TOTAL; segs.forEach(function (g, k) { var a = k === 0 ? 0 : HOLD0 + STEP * (k - 1), b = k === 0 ? HOLD0 + 0.5 : a + STEP; g.style.setProperty('--p', Math.max(0, Math.min(1, (t - a) / (b - a)))); }); setActive(idxAt(s.progress)); },
      onToggle: function (s) { if (!s.isActive) wvids.forEach(function (v) { v.pause(); }); else { curI = -1; setActive(idxAt(s.progress)); } } } });
    for (var i = 1; i < wks.length; i++) {
      var a = wks[i - 1], b = wks[i], at = HOLD0 + STEP * (i - 1);
      tl.to($('.wk-word', a), { x: function () { return -innerWidth * 0.15; }, xPercent: -115, '--w': 118, duration: 0.5, ease: 'power3.in' }, at)
        .to($('.wk-spec', a), { autoAlpha: 0, y: -40, duration: 0.4 }, at)
        .to($('.wk-big', a), { yPercent: -60, autoAlpha: 0, duration: 0.4 }, at)
        .to($('.wk-media video', a), { scale: 0.9, duration: 0.9 }, at)
        .fromTo($('.wk-media', b), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power3.inOut' }, at)
        .fromTo($('.wk-media video', b), { scale: 1.3 }, { scale: 1, duration: 1, ease: 'power2.out' }, at)
        .fromTo($('.wk-big', b), { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out' }, at + 0.45)
        .fromTo($('.wk-word', b), { x: function () { return innerWidth * 1.05; }, '--w': 118, autoAlpha: 1 }, { x: 0, '--w': 64, duration: 0.6, ease: 'power3.out' }, at + 0.4)
        .fromTo($('.wk-spec', b), { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, at + 0.55);
    }
    tl.to({}, { duration: TOTAL - tl.duration() });
    /* first block arrives once, as the section enters (not scrubbed, so the pinned start frame is always clean) */
    G.fromTo($('.wk-word', wks[0]), { x: function () { return innerWidth * 0.3; }, '--w': 118 }, { x: 0, '--w': 64, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '#week', start: 'top 65%', once: true } });
    G.fromTo($('.wk-big', wks[0]), { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '#week', start: 'top 55%', once: true } });
  }


  /* ================= STORIES: a year of attendance under each portrait ================= */
  $$('.att').forEach(function (el) {
    var seed = F.hash(el.dataset.seed), from = +el.dataset.from || 0, miss = (el.dataset.miss || '').split(',').filter(Boolean).map(Number), avg = +el.dataset.avg || 3, cells = '', i, n;
    for (i = 0; i < 52; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; var r = seed / 4294967296; n = i < from ? -1 : miss.indexOf(i) > -1 ? 0 : Math.max(1, Math.min(4, Math.round(avg + (r - 0.5) * 2.2)));
      cells += '<i style="--i:' + i + '"' + (n < 0 ? ' class="pre"' : ' data-n="' + n + '"') + '></i>'; }
    el.innerHTML = '<p class="att-h mono"><span>Attendance · 52 weeks</span><span>now →</span></p><div class="att-g" role="img" aria-label="' + esc(el.dataset.cap) + '">' + cells + '</div><p class="att-c">' + esc(el.dataset.cap) + '.</p>';
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { el.classList.add('in'); o.disconnect(); } }, { threshold: 0.4 }).observe(el); else el.classList.add('in');
  });

  /* ================= THE BAR (three.js, scroll-loaded plates) ================= */
  var STEP0 = 0.1, STEP = 0.17;                         /* must match forge3d.js */
  var barKg = function (p) { var kg = 20; [25, 20, 15, 10].forEach(function (k, i) { if (p > STEP0 + i * STEP + STEP * 0.5) kg += 2 * k; }); return kg; };
  function barSection() {
    var sec = $('#bar'); if (!sec) return;
    var stage = $('.bar-stage', sec), canvas = $('#barCanvas'), num = $('#kgNum'), steps = $$('#barSteps li'), cap = $('#barCap'), api = null, lastKg = 0, prog = 0;
    /* your turn: once the bar is racked the visitor loads it. The number goes with them to the trial form. */
    var pin = $('.bar-pin', sec), range = $('#byRange'), platesEl = $('#byPlates'), w12 = $('#by12'), w52 = $('#by52'), mine = 160, yours = false, MAXKG = 240;
    var r5 = function (v) { return Math.round(v / 5) * 5; };
    function compose(total) { var side = (total - 20) / 2, out = []; [[25, 4], [20, 1], [15, 1], [10, 1], [5, 1], [2.5, 1]].forEach(function (p) { for (var k = 0; k < p[1] && side >= p[0] - 1e-6; k++) { out.push(p[0]); side -= p[0]; } }); return out; }
    function roll(el, to) { var from = +el.textContent || 0; if (reduce || from === to) { el.textContent = to; return; } var o = { v: from }; G.to(o, { v: to, duration: 0.5, ease: 'power3.out', overwrite: true, onUpdate: function () { el.textContent = r5(o.v); }, onComplete: function () { el.textContent = to; } }); }
    function setMine(kg, load) {
      kg = Math.max(20, Math.min(MAXKG, r5(kg))); mine = kg; range.value = kg; range.style.setProperty('--p', ((kg - 20) / (MAXKG - 20) * 100).toFixed(1) + '%'); range.setAttribute('aria-valuetext', kg + ' kilograms');
      var list = compose(kg); platesEl.textContent = list.length ? list.join(' + ') + ' a side' : 'The empty bar, 20 kg';
      /* the club average: beginners add the most, and the gains taper as the bar gets heavier */
      roll(w12, r5(kg + Math.max(7.5, Math.min(27.5, 30 - 0.12 * kg)))); roll(w52, r5(kg + Math.max(15, Math.min(70, 75 - 0.3 * kg))));
      if (kg !== lastKg) { roll(num, kg); lastKg = kg; if (!reduce) G.fromTo(num, { '--w': 100 }, { '--w': 64, duration: 0.6, ease: 'expo.out', overwrite: true }); }
      if (load) { F.set('bar', kg); if (api && api.load) api.load(kg); }
    }
    function setYours(on) {
      if (on === yours) return; yours = on; pin.classList.toggle('you', on); root.classList.toggle('bar-yours', on);
      if (on) { var saved = +F.get('bar', 0); setMine(160, false); if (saved && saved !== 160) setTimeout(function () { if (yours) setMine(saved, true); }, 700); }
      else { if (api && api.release) api.release(); lastKg = -1; }
    }
    range.addEventListener('input', function () { setMine(+range.value, true); });
    $('#byMinus').addEventListener('click', function () { setMine(mine - 5, true); }); $('#byPlus').addEventListener('click', function () { setMine(mine + 5, true); });
    $('#byGo').addEventListener('click', function () { setLift(mine); });
    if (fine) pin.addEventListener('pointermove', function (e) { if (yours && api && api.lean) api.lean((e.clientX / innerWidth - 0.5) * 2); });
    function paint(p) {
      prog = p; if (yours) { if (api) api.setProgress(p); return; }
      var kg = barKg(p);
      if (kg !== lastKg) { num.textContent = kg; lastKg = kg; if (!reduce) G.fromTo(num, { '--w': 112 }, { '--w': 64, duration: 0.7, ease: 'expo.out', overwrite: true }); }
      steps.forEach(function (li, i) { li.classList.toggle('on', p > STEP0 + i * STEP + STEP * 0.5); });
      cap.classList.toggle('on', p > 0.9);
      if (api) api.setProgress(p);
    }
    if (reduce) { paint(1); setMine(+F.get('bar', 0) || 160, false); return; }
    num.textContent = 20; lastKg = 20;
    /* the first 76% of the pin loads the bar; the rest holds it racked so there is time to play */
    G.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: function () { return '+=' + innerHeight * 3.9; }, pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true, onUpdate: function (s) { var p = Math.min(1, s.progress / 0.76); if (yours && s.progress < 0.7) setYours(false); paint(p); if (!yours && s.progress > 0.775) setYours(true); } } });
    /* load three.js only when the section is near; the poster covers until the first frame */
    var loaded = false;
    new IntersectionObserver(function (es, o) {
      if (!es[0].isIntersecting || loaded) return; loaded = true; o.disconnect();
      var s = document.createElement('script'); s.src = '../assets/forge3d.js?v=2'; s.async = true;
      s.onload = function () { try { api = window.__forgeBar = window.Forge3D.mount(canvas, { progress: prog }); api.ready.then(function () { stage.classList.add('is-3d'); }); } catch (e) { /* WebGL unavailable: the poster stays */ } };
      document.head.appendChild(s);
    }, { rootMargin: '120% 0px' }).observe(sec);
  }

  /* ================= CLASSES list + cursor reveal ================= */
  var clsList = $('#clsList'), clsType = '';
  clsList.innerHTML = F.classes.map(function (c, i) {
    var co = F.coach(c.coach);
    return '<a class="cls-row" href="class.html?id=' + c.id + '" data-type="' + c.type + '" data-img="' + F.small(c.photo) + '">' +
      '<span class="n mono">' + (i < 9 ? '0' : '') + (i + 1) + '</span><b style="view-transition-name:cls-' + c.id + '">' + esc(c.name) + '</b>' +
      '<img class="th" src="' + F.th(c.photo) + '" alt="" width="76" height="76" loading="lazy" decoding="async">' +
      '<span class="mono ty">' + esc(F.types[c.type].name) + ' · ' + c.mins + ' min</span><span class="mono co">' + esc(co.name) + '</span><span class="mono mi">Max ' + c.cap + '</span>' +
      '<span class="go">' + I.arrow + '</span></a>';
  }).join('');
  var chipHTML = function (sel) { return [['', 'All'], ['strength', 'Strength'], ['engine', 'Engine'], ['hyrox', 'HYROX'], ['recovery', 'Recovery']].map(function (t) { return '<button type="button" class="chip" data-v="' + t[0] + '" aria-pressed="' + (t[0] === sel) + '"><i></i>' + t[1] + '</button>'; }).join(''); };
  $('#clsChips').innerHTML = chipHTML('');
  $('#clsChips').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return; clsType = b.dataset.v;
    $$('.chip', this).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    var shown = [];
    $$('.cls-row', clsList).forEach(function (r) { var on = !clsType || r.dataset.type === clsType; r.hidden = !on; if (on) shown.push(r); });
    if (!reduce) G.fromTo(shown, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.04, ease: 'power3.out' });
    refreshST();
  });
  if (fine && !reduce) {
    var rev = $('#reveal'), rimg = $('#revealImg'), xTo = G.quickTo(rev, 'x', { duration: 0.6, ease: 'power3' }), yTo = G.quickTo(rev, 'y', { duration: 0.6, ease: 'power3' }), shownImg = '';
    G.set(rev, { xPercent: -50, yPercent: -50 });
    clsList.addEventListener('pointermove', function (e) {
      xTo(e.clientX + 170); yTo(e.clientY);
      var row = e.target.closest('.cls-row'); if (!row) return;
      if (row.dataset.img !== shownImg) { shownImg = row.dataset.img; rimg.src = shownImg; G.fromTo(rimg, { scale: 1.2 }, { scale: 1, duration: 0.8, ease: 'expo.out' }); }
      rev.classList.add('on'); G.to(rev, { scale: 1, duration: 0.5, ease: 'expo.out', overwrite: 'auto' });
    });
    clsList.addEventListener('pointerleave', function () { rev.classList.remove('on'); G.to(rev, { scale: 0.85, duration: 0.4, overwrite: 'auto' }); });
  }

  /* ================= COACHES ================= */
  $('#coachGrid').innerHTML = F.coaches.map(function (c, i) {
    return '<a class="coach" href="coach.html?id=' + c.id + '" data-reveal data-delay="' + (i % 3 * 0.08) + '"><figure><img src="' + c.photo + '"' + F.ss(c.photo, '(max-width: 860px) 78vw, 30vw') + ' alt="' + esc(c.name) + ', ' + esc(c.role) + '" width="900" height="1125" loading="lazy" decoding="async" style="view-transition-name:coach-' + c.id + '">' +
      '<div class="tags">' + c.spec.map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('') + '</div></figure>' +
      '<div class="coach-meta"><div><h3>' + esc(c.name) + '</h3><p class="role mono">' + esc(c.role) + ' · ' + F.branches[c.branch].name + '</p><span class="view">Meet ' + esc(c.name.split(' ')[0]) + ' <span class="arr">→</span></span></div><span class="n mono">0' + (i + 1) + '</span></div></a>';
  }).join('');

  /* ================= FLOORS ================= */
  $('#floorList').innerHTML = ['saket', 'gurugram'].map(function (k, i) {
    var b = F.branches[k];
    return '<article class="floor"><figure data-clip><img src="' + b.photo + '"' + F.ss(b.photo, '(max-width: 860px) 100vw, 46vw') + ' alt="The ' + b.name + ' training floor" width="1600" height="1000" loading="lazy" decoding="async" data-parallax="0.12"><figcaption class="mono">0' + (i + 1) + ' · ' + esc(b.area) + ' · since ' + b.since + '</figcaption></figure>' +
      '<h3>' + esc(b.name) + '</h3><p class="meta mono"><span>' + esc(b.addr) + '</span><span>' + b.hours + '</span><span>' + esc(b.size) + '</span></p><p class="b">' + esc(b.blurb) + '</p>' +
      '<ul>' + b.feats.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' +
      '<div class="acts"><a class="btn volt sm" href="branch-' + k + '.html"><span>Tour the ' + esc(b.name) + ' floor</span><span class="arr" aria-hidden="true">→</span></a><button class="btn ghost sm" type="button" data-floor="' + k + '"><span>Today’s classes</span></button></div></article>';
  }).join('');
  $('#floorList').addEventListener('click', function (e) { var b = e.target.closest('[data-floor]'); if (!b) return; tt.branch = b.dataset.floor; F.segSet($('#fBranch'), $('#fBranch [data-v="' + tt.branch + '"]')); renderTT(true); scrollToEl($('#timetable')); });

  /* ================= TIMETABLE ================= */
  var tt = { range: 'today', day: 0, branch: '', type: '' }, ttList = $('#ttList'), ttDays = $('#ttDays');
  function dayDate(k) { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + k); }
  function drawDays() {
    var mineDates = F.get('bookings', []).map(function (b) { return b.date; });
    ttDays.innerHTML = [0, 1, 2, 3, 4, 5, 6].map(function (k) { var d = dayDate(k), on = k === tt.day; return '<button type="button" data-k="' + k + '" aria-pressed="' + on + '" class="' + (on ? 'on ' : '') + (mineDates.indexOf(F.iso(d)) > -1 ? 'has' : '') + '">' + (k === 0 ? 'Today' : F.DAYS[F.dow(d)]) + '<b>' + d.getDate() + '</b><i class="dot" aria-hidden="true"></i></button>'; }).join('');
  }
  $('#fType').innerHTML = chipHTML('');
  function rowHTML(s) {
    var low = s.left <= 3, f = s.booked / s.cap, b = F.branches[s.branch];
    var act = s.past && !s.live ? '<span class="mono">Done</span>' : s.mine ? '<button class="btn sm is-done" type="button" disabled>' + I.tick + '<span>Booked</span></button><button class="undo" type="button" data-undo="' + esc(s.id) + '">Cancel</button>' : s.live ? '<span class="mono lv"><i class="live"></i>On now</span>' : s.left === 0 ? '<button class="btn ghost sm" type="button" data-wait="' + esc(s.id) + '"><span>Waitlist</span></button>' : '<button class="btn volt sm" type="button" data-book="' + esc(s.id) + '"><span>Book</span></button>';
    return '<div class="row' + (s.past && !s.live ? ' past' : '') + '" data-id="' + esc(s.id) + '"><span class="t">' + s.time + '</span>' +
      '<div class="c"><a href="class.html?id=' + s.cls.id + '">' + esc(s.cls.name) + '</a><span class="mono">' + esc(F.types[s.cls.type].name) + ' · ' + s.cls.mins + ' min<span class="br-m"> · ' + b.name + '</span></span></div>' +
      '<div class="who"><a class="ul" href="coach.html?id=' + s.coach.id + '">' + esc(s.coach.name) + '</a></div>' +
      '<div class="who br">' + b.name + '</div>' +
      '<div class="spots' + (low && !s.past ? ' low' : '') + '"><div class="bar"><i style="--f:' + f.toFixed(2) + '"></i></div><span class="mono">' + (s.past && !s.live ? s.booked + ' trained' : s.left === 0 ? 'Full · waitlist open' : s.left === 1 ? 'Last spot' : s.left + ' of ' + s.cap + ' left') + '</span></div>' +
      '<div class="act">' + act + '</div></div>';
  }
  var current = {}, ttTimer, showEarlier = false;
  function renderTT(withSkeleton, flashId) {
    var k = tt.range === 'today' ? 0 : tt.day, d = dayDate(k);
    var all = F.sessions(d), list = all.filter(function (s) { return (!tt.branch || s.branch === tt.branch) && (!tt.type || s.cls.type === tt.type); });
    current = {}; list.forEach(function (s) { current[s.id] = s; });
    var open = list.filter(function (s) { return !s.past || s.live; }).length;
    var head = '<p class="tt-day"><span>' + (k === 0 ? 'Today · ' : '') + F.nice(F.iso(d)) + '</span><span>' + list.length + ' session' + (list.length === 1 ? '' : 's') + (open && open !== list.length ? ' · ' + open + ' still to come' : '') + '</span></p>';
    var body;
    if (!list.length) body = '<div class="empty-st">' + I.empty + '<div><b>Nothing matches on ' + (k === 0 ? 'today' : F.DAYS_L[F.dow(d)]) + '</b><p>' + (tt.type ? F.types[tt.type].name + ' isn’t on ' + (tt.branch ? 'the ' + F.branches[tt.branch].name + ' floor' : 'either floor') + ' that day.' : 'No classes at this floor that day.') + ' Try the other floor, or another day.</p><button class="btn ghost sm" type="button" data-reset><span>Show everything</span></button></div></div>';
    else {
      var past = list.filter(function (s) { return s.past && !s.live; }), rest = list.filter(function (s) { return !s.past || s.live; });
      var fold = k === 0 && past.length > 1 && rest.length > 0;
      body = (fold ? '<button type="button" class="earlier" data-earlier aria-expanded="' + showEarlier + '"><i aria-hidden="true">↓</i>' + (showEarlier ? 'Hide' : 'Show') + ' ' + past.length + ' earlier session' + (past.length === 1 ? '' : 's') + '</button>' + (showEarlier ? past.map(rowHTML).join('') : '') + rest.map(rowHTML).join('') : list.map(rowHTML).join(''))
    }
    if (list.length) body += ((k === 0 && !open) ? '<div class="empty-st">' + I.bell + '<div><b>That’s a wrap for today</b><p>The last class has started. Tomorrow begins at 06:00 in Saket.</p><button class="btn volt sm" type="button" data-goweek><span>See tomorrow</span><span class="arr" aria-hidden="true">→</span></button></div></div>' : '');
    var paint = function () { ttList.innerHTML = head + body; ttList.setAttribute('aria-busy', 'false'); if (flashId) { var r = ttList.querySelector('[data-id="' + flashId + '"]'); if (r) { r.classList.add('flash'); var bt = r.querySelector('.is-done'); if (bt) bt.classList.add('pop'); } } refreshST(); };
    clearTimeout(ttTimer);
    if (withSkeleton) { ttList.setAttribute('aria-busy', 'true'); ttList.innerHTML = head + F.skeleton(Math.min(5, Math.max(3, list.length))); ttTimer = setTimeout(paint, reduce ? 0 : 320); }
    else paint();
  }
  $$('.tt-bar > .seg button').forEach(function (b) { b.addEventListener('click', function () { setRange(b.dataset.range); }); });
  function setRange(r) { tt.range = r; F.segSet($('.tt-bar > .seg'), $('.tt-bar > .seg [data-range="' + r + '"]')); ttDays.hidden = r !== 'week'; if (r === 'week') drawDays(); renderTT(true); }
  ttDays.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; tt.day = +b.dataset.k; drawDays(); renderTT(true); });
  $('#fBranch').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; tt.branch = b.dataset.v; F.segSet(this, b); renderTT(true); });
  $('#fType').addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; tt.type = b.dataset.v; $$('.chip', this).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); renderTT(true); });
  ttList.addEventListener('click', function (e) {
    var b = e.target.closest('[data-book]'); if (b) openBook(current[b.dataset.book]);
    var u = e.target.closest('[data-undo]'); if (u) { var s = current[u.dataset.undo]; F.cancel(u.dataset.undo); renderTT(false); nextInfo(); if (tt.range === 'week') drawDays(); F.toast('Cancelled ' + esc(s.cls.name) + ', ' + s.time + '. Your spot went back to the pool.'); }
    var w = e.target.closest('[data-wait]'); if (w) { var me2 = F.get('me', {}), ws = current[w.dataset.wait], wr = F.joinWaitlist(ws, { name: me2.name || 'Website visitor', phone: me2.phone || '' }); w.disabled = true; w.innerHTML = I.tick + '<span>#' + wr.pos + ' on list</span>'; w.classList.add('is-done'); F.toast('You’re #' + wr.pos + ' on the waitlist. The desk promotes you if a spot opens.'); }
    if (e.target.closest('[data-reset]')) { tt.branch = ''; tt.type = ''; F.segSet($('#fBranch'), $('#fBranch [data-v=""]')); $$('#fType .chip').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.v === '')); }); renderTT(true); }
    if (e.target.closest('[data-goweek]')) { tt.day = 1; setRange('week'); }
    if (e.target.closest('[data-earlier]')) { showEarlier = !showEarlier; renderTT(false); }
  });

  /* booking dialog -> creates a record the staff dashboard reads */
  var dlg = $('#bookDlg'), bf = $('#bookForm'), bookFor = null;
  var vbName = F.field($('#bfName'), F.check.name), vbPhone = F.field($('#bfPhone'), F.check.phone);
  function openBook(s) {
    if (!s) return; bookFor = s;
    $('#bookMeta').textContent = F.nice(s.date) + ' · ' + s.time + ' · ' + F.branches[s.branch].name + ' · ' + (s.left === 1 ? 'last spot' : s.left + ' left');
    $('#bookH').textContent = s.cls.name;
    var me = F.get('me', {}); bf.name.value = me.name || ''; bf.phone.value = me.phone || '';
    $$('.fld', bf).forEach(function (f) { f.classList.remove('bad', 'ok'); });
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    if (window.Motion && Motion.lenis) Motion.lenis.stop();
    setTimeout(function () { (bf.name.value ? bf.phone : bf.name).focus(); }, 30);
  }
  function closeBook() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
  dlg.addEventListener('close', function () { if (window.Motion && Motion.lenis) Motion.lenis.start(); });
  $('#bookCancel').addEventListener('click', closeBook);
  bf.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = vbName() & vbPhone(); if (!ok) { (bf.querySelector('.bad input') || bf.name).focus(); return; }
    F.set('me', { name: bf.name.value.trim(), phone: bf.phone.value.trim() });
    F.book(bookFor, { name: bf.name.value.trim(), phone: bf.phone.value.trim() });
    closeBook(); renderTT(false, bookFor.id); nextInfo(); if (tt.range === 'week') drawDays();
    F.toast('Spot booked: ' + esc(bookFor.cls.name) + ', ' + F.nice(bookFor.date) + ' ' + bookFor.time + '. It’s in the <a href="staff.html">staff dashboard</a>.');
  });

  /* ================= MEMBERSHIP ================= */
  var bill = 'm';
  function priceOf(p) { return bill === 'm' ? p.m : p.m * 10; }
  function renderPlans() {
    $('#plans').innerHTML = F.plans.map(function (p) {
      var sub = bill === 'm' ? 'or ' + F.rupees(p.m * 10) + ' a year<br>' + esc(p.note) : F.rupees(Math.round(p.m * 10 / 12)) + ' a month, billed yearly<br>' + esc(p.note);
      return '<article class="plan' + (p.best ? ' best' : '') + '">' + (p.best ? '<span class="flag">Most picked</span>' : '') + '<h3>' + esc(p.name) + '</h3><p class="tag">' + esc(p.tag) + '</p>' +
        '<p class="price"><b data-price="' + priceOf(p) + '">' + F.rupees(priceOf(p)) + '</b><span class="mono">/ ' + (bill === 'm' ? 'month' : 'year') + '</span></p><p class="price-sub mono">' + sub + '</p>' +
        '<ul class="feats">' + F.planRows.map(function (r) { var v = p.feats[r[0]]; return '<li class="' + (v ? '' : 'no') + '"><span>' + esc(r[1]) + '</span><span>' + (v === true ? 'Included' : v ? esc(v) : 'Not included') + '</span></li>'; }).join('') + '</ul>' +
        '<a class="btn ' + (p.best ? 'volt' : 'dark') + '" href="#trial" data-plan="' + esc(p.name) + '"><span>Try it free first</span><span class="arr" aria-hidden="true">→</span></a></article>';
    }).join('');
  }
  renderPlans();
  $$('.bill .seg button').forEach(function (b) { b.addEventListener('click', function () {
    if (bill === b.dataset.bill) return; var from = $$('#plans .price b').map(function (x) { return +x.dataset.price; });
    bill = b.dataset.bill; F.segSet($('.bill .seg'), b); renderPlans();
    if (!reduce) $$('#plans .price b').forEach(function (el, i) { var o = { v: from[i] }, to = +el.dataset.price; G.to(o, { v: to, duration: 0.9, ease: 'power3.out', onUpdate: function () { el.textContent = F.rupees(Math.round(o.v / 10) * 10); }, onComplete: function () { el.textContent = F.rupees(to); } }); });
  }); });
  /* the bar they loaded upstairs rides along to the front desk */
  var lift = 0;
  function setLift(kg) {
    lift = kg; var tag = $('#liftTag'), form = $('#trialForm');
    if (!kg) { if (tag) tag.remove(); return; }
    if (!tag) { tag = document.createElement('p'); tag.id = 'liftTag'; tag.className = 'interest'; form.insertBefore(tag, $('.f2', form)); }
    tag.innerHTML = 'Squat today: ' + kg + ' kg <button type="button" aria-label="Remove the squat number">×</button>';
    $('button', tag).addEventListener('click', function () { setLift(0); });
    if (form.goal) form.goal.value = 'Get stronger';
  }
  var interest = '';
  function setInterest(p) {
    interest = p; var tag = $('#interest');
    if (!p) { if (tag) tag.remove(); return; }
    if (!tag) { tag = document.createElement('p'); tag.id = 'interest'; tag.className = 'interest'; $('#trialForm').insertBefore(tag, $('#trialForm .f2')); }
    tag.innerHTML = 'Interested in: ' + esc(p) + ' <button type="button" aria-label="Remove plan interest">×</button>';
    $('button', tag).addEventListener('click', function () { setInterest(''); });
  }
  $('#plans').addEventListener('click', function (e) { var a = e.target.closest('[data-plan]'); if (a) setInterest(a.dataset.plan); });

  /* ================= TRIAL ================= */
  var tf = $('#trialForm'), daySel = $('#trialDay');
  daySel.innerHTML = [1, 2, 3, 4, 5, 6, 7].map(function (k) { var iso = F.iso(dayDate(k)); return '<option value="' + iso + '">' + F.nice(iso) + (k === 1 ? ' (tomorrow)' : '') + '</option>'; }).join('');
  var me0 = F.get('me', {}); if (me0.name) tf.name.value = me0.name; if (me0.phone) tf.phone.value = me0.phone;
  var vName = F.field($('#fName'), F.check.name), vPhone = F.field($('#fPhone'), F.check.phone);
  var okBox = $('#fOk'), okMsg = $('#mOk');
  tf.ok.addEventListener('change', function () { if (tf.ok.checked) { okBox.classList.remove('bad'); okMsg.textContent = ''; } });
  tf.addEventListener('submit', function (e) {
    e.preventDefault();
    var a = vName(), b = vPhone(), c = tf.ok.checked;
    okBox.classList.toggle('bad', !c); okMsg.textContent = c ? '' : 'Tick the box so we can confirm on WhatsApp. We won’t message you about anything else.';
    if (!(a && b && c)) { (!a ? tf.name : !b ? tf.phone : tf.ok).focus(); return; }
    var btn = $('.big-btn', tf); btn.classList.add('busy'); $('span:not(.arr)', btn).textContent = 'Booking your trial';
    setTimeout(function () {
      var lead = F.addLead({ name: tf.name.value.trim(), phone: tf.phone.value.trim(), branch: tf.branch.value, day: tf.day.value, goal: tf.goal.value + (lift ? ' · squats ' + lift + ' kg today' : ''), plan: interest || '' });
      F.set('me', { name: lead.name, phone: lead.phone });
      var done = $('#trialDone'), br = F.branches[lead.branch];
      done.innerHTML = '<p class="idx mono">Request received</p><h3>See you on ' + esc(F.nice(lead.day)) + ', ' + esc(lead.name.split(' ')[0]) + '.</h3>' +
        '<ol class="steps"><li>The ' + esc(br.name) + ' front desk WhatsApps you within the hour to pick a class time.</li><li>Arrive 10 minutes early for your movement screen with Meera’s team.</li><li>Train, then we’ll show you the week we’d write for you. No pressure to join.</li></ol>' +
        '<dl class="mono"><dt>Floor</dt><dd>' + esc(br.name) + ' · ' + esc(br.addr) + '</dd><dt>Goal</dt><dd>' + esc(lead.goal) + '</dd>' + (lead.plan ? '<dt>Interested in</dt><dd>' + esc(lead.plan) + '</dd>' : '') + '<dt>Reference</dt><dd>FG-' + esc(lead.id.slice(-5).toUpperCase()) + '</dd></dl>' +
        '<div class="acts"><a class="btn volt" href="staff.html#leads"><span>See it in the staff dashboard</span><span class="arr" aria-hidden="true">→</span></a><a class="btn ghost" href="#timetable"><span>Browse classes</span></a></div>';
      tf.hidden = true; done.hidden = false; done.focus({ preventScroll: true });
      if (!reduce) G.from($$('#trialDone > *'), { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out' });
      F.toast('Trial booked. A new lead is waiting in the <a href="staff.html#leads">staff dashboard</a>.');
      refreshST();
    }, reduce ? 0 : 700);
  });

  /* ================= mobile action bar ================= */
  var mbar = $('#mbar');
  if (mbar && 'IntersectionObserver' in window) {
    var heroIn = true, trialIn = false, weekIn = false, upd = function () { mbar.classList.toggle('on', !heroIn && !trialIn && !weekIn); };
    new IntersectionObserver(function (es) { heroIn = es[0].isIntersecting; upd(); }, { threshold: 0.15 }).observe(hero);
    new IntersectionObserver(function (es) { trialIn = es[0].isIntersecting; upd(); }).observe($('#trial'));
    var pins = 0, pinIn = {}; [$('.week-pin'), $('.bar-pin')].forEach(function (el, i) { if (el) new IntersectionObserver(function (es) { pinIn[i] = es[0].isIntersecting; weekIn = pinIn[0] || pinIn[1]; upd(); }, { threshold: 0.35 }).observe(el); });
  }

  /* footer wordmark stretches as it arrives */
  function wordmark() { if (reduce) return; G.fromTo('#wordmark', { '--w': 125 }, { '--w': 62, ease: 'none', scrollTrigger: { trigger: '.ftr', start: 'top bottom', end: 'bottom bottom', scrub: true } }); }

  /* ================= boot ================= */
  $('#weekCount').textContent = F.weekCount();
  renderTT(true); nextInfo();
  function boot() { intro(); band(); week(); barSection(); wordmark(); if (!reduce) cacheRects(); if (window.ScrollTrigger) ScrollTrigger.refresh(); if (document.fonts) document.fonts.ready.then(function () { cacheRects(); ScrollTrigger.refresh(); }); }
  var booted = false; function go() { if (booted) return; booted = true; requestAnimationFrame(boot); }
  if (reduce) { root.classList.add('intro'); week(); setActive(0); barSection(); }
  else { if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); setTimeout(go, 1400); }
  setInterval(function () { if (!dlg.open) { renderTT(false); nextInfo(); } }, 60000);
})();
