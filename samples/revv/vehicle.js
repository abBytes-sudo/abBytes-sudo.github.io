/* Revv vehicle page: gallery (3D studio or drag-to-look photos), report, history, EMI, test-ride booking -> dealer CRM lead. */
(function () {
  'use strict';
  var R = window.Revv, D = window.REVV_DATA, $ = R.$, $$ = R.$$;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var id = new URLSearchParams(location.search).get('id') || 'kestrel-gt-carmine';
  var l = R.byId(id) || R.byId('kestrel-gt-carmine');
  var d = R.dealer(l.dealer), title = R.title(l);
  document.title = title + ' · ' + R.inr(l.price) + ' · Revv';

  // ---------- crumbs + side ----------
  // #side holds #side-main (drawn here) and three slots filled by other scripts: #onroad-slot, #exchange-slot, #share-slot (each has data-id = listing id; unhide when filled)
  $('#crumbs').insertAdjacentHTML('beforeend', '<li><a href="listings.html?type=' + l.type + '">' + (l.type === 'bike' ? 'Bikes' : 'Cars') + '</a></li><li>' + R.esc(l.make + ' ' + l.model) + '</li>');
  var emiFrom = R.emi(l.price * 0.8, 10.5, 60), reg = R.reg(l);
  var stTag = l.status && l.status !== 'live' ? '<span class="st ' + l.status + '">' + l.status + '</span> ' : '';
  $('#side-main').innerHTML =
    '<p class="k">' + stTag + R.esc(R.body(l)) + ' · ' + R.esc(l.city) + ' · <span class="sig">' + l.score + '/150</span></p>' +
    '<h1 class="disp">' + R.esc(l.year + ' ' + l.make) + ' <span class="ser">' + R.esc(l.model) + '</span></h1>' +
    '<p class="sub">' + R.esc(R.blurb(l)) + ' · ' + R.esc(l.color) + '. ' + R.esc(l.desc) + '</p>' +
    '<div class="price"><b>' + R.inr(l.price) + '</b><span>EMI from ' + R.inr(emiFrom) + '/mo<br>fixed price · ex-showroom ' + R.esc(l.city) + '</span></div>' +
    '<dl class="facts"><div><dt>Year</dt><dd>' + l.year + '</dd></div><div><dt>Odometer</dt><dd>' + R.km(l.km) + '</dd></div><div><dt>Owners</dt><dd>' + R.own(l.owners) + '</dd></div><div><dt>Fuel</dt><dd>' + l.fuel + '</dd></div><div><dt>Gearbox</dt><dd>' + l.trans + '</dd></div><div><dt>Report</dt><dd>' + l.score + '/150</dd></div><div><dt>Registered</dt><dd>' + reg.rto + ' · ' + reg.month + ' ' + l.year + '</dd></div><div><dt>Insurance</dt><dd>' + reg.ins.split(' · ')[0] + '</dd></div><div><dt>Keys · PUC</dt><dd>' + reg.keys + ' · valid</dd></div></dl>' +
    '<div class="acts"><a class="btn" href="#book" data-magnetic>Book a test ' + (l.type === 'bike' ? 'ride' : 'drive') + '</a><button type="button" class="btn ghost" id="askbtn">Ask the dealer</button></div>' +
    '<div class="card-a" style="margin:0"><button type="button" class="ic" data-wish="' + l.id + '" aria-pressed="false" aria-label="Save this listing"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button><button type="button" class="cmp" data-cmp="' + l.id + '" aria-pressed="false"><span class="box" aria-hidden="true"></span><span class="t">Compare</span></button></div>' +
    '<ul class="trust"><li>7-day return if it isn\'t as reported</li><li>6-month powertrain cover included</li><li>RC transfer handled by ' + R.esc(d.name) + '</li></ul>';

  // ---------- "drive" for cars, "ride" for bikes, everywhere on the page ----------
  var verb = l.type === 'bike' ? 'ride' : 'drive';
  (function () { var ix = $('#book .idx'); if (ix) ix.textContent = '04 · Test ' + verb; var bg = $('#b-go'); if (bg && bg.firstChild) bg.firstChild.textContent = 'Book the test ' + verb + ' ';
    var mb = $('#mbar .btn'); if (mb) mb.textContent = 'Test ' + verb; })();

  // ---------- cold start: bikes and performance cars, sound loaded only when pressed ----------
  (function () {
    var ps = parseInt(String(l.spec.power || '').replace(/[^0-9]/g, ''), 10) || 0, ice = l.fuel !== 'Electric';
    if (!ice || !(l.type === 'bike' || ps >= 250)) return;
    var eng = l.spec.engine || '', box = document.createElement('div'); box.className = 'cold'; box.id = 'cold';
    box.innerHTML = '<button type="button" class="cold-b" aria-pressed="false"><span class="cold-i" aria-hidden="true"></span><span class="cold-l">Cold start</span></button>' +
      '<div class="cold-meters" aria-hidden="true"><canvas class="cold-w"></canvas><canvas class="cold-r"></canvas></div>' +
      '<p class="cold-c"><span>' + R.esc(eng) + ' · an engine-layout sound, not a recording of this ' + (l.type === 'bike' ? 'bike' : 'car') + '</span><span class="cold-rpm">0 rpm</span></p>';
    var th = $('#thumbs'); if (th) th.insertAdjacentElement('afterend', box);
    var btn = box.querySelector('.cold-b'), lab = box.querySelector('.cold-l'), run = null;
    box.addEventListener('cold:end', function () { run = null; btn.setAttribute('aria-pressed', 'false'); lab.textContent = 'Start it again'; });
    btn.addEventListener('click', function () {
      if (run) { run.stop(); return; }
      var go = function () { run = window.ColdStart.play(box, l); if (run) { btn.setAttribute('aria-pressed', 'true'); lab.textContent = 'Switch off'; } };
      if (window.ColdStart) go(); else { var sc = document.createElement('script'); sc.src = 'sound.js?v=1'; sc.onload = go; document.head.appendChild(sc); }
    });
  })();

  // ---------- phone: sticky price + test-ride bar once the main actions scroll away ----------
  var mbar = $('#mbar'); $('#mb-p').textContent = R.inr(l.price); $('#mb-t').textContent = l.make + ' ' + l.model + ' · ' + l.score + '/150';
  var mbTick = false, acts = $('.acts'), bookSec = $('#book');
  function mbUpdate() { mbTick = false; var a = acts.getBoundingClientRect(), b = bookSec.getBoundingClientRect();
    var on = a.bottom < 0 && !(b.top < innerHeight * 0.7 && b.bottom > 0); mbar.classList.toggle('on', on); mbar.setAttribute('aria-hidden', !on); document.body.classList.toggle('has-mbar', on); }
  addEventListener('scroll', function () { if (!mbTick) { mbTick = true; requestAnimationFrame(mbUpdate); } }, { passive: true }); mbUpdate();

  ['onroad-slot', 'exchange-slot', 'share-slot'].forEach(function (k) { var e = document.getElementById(k); if (e) e.setAttribute('data-id', l.id); });

  // ---------- gallery: the full vehicle by default, truthful detail frames, a real zoom viewer ----------
  var stage = $('#stage'), img = $('#mainimg'), canvas = $('#studio'), hint = $('#ghint'), conf = $('#conf');
  var reduceG = matchMedia('(prefers-reduced-motion: reduce)').matches;
  img.src = R.img(l); img.alt = l.color + ' ' + title; img.draggable = false;
  var F = (D.FOCUS && D.FOCUS[l.img]) || { box: [0, 0, 1, 1], det: [] };
  var FRAMES = [{ n: 'Full vehicle', r: F.box, full: true }].concat(F.det.map(function (d) { return { n: d[0], r: d.slice(1) }; }));
  var cur = 0;
  // place a natural-size image inside a box so region r=[x0,y0,x1,y1] (0..1) is framed; never upscale past `cap`
  function frame(el, bw, bh, nw, nh, r, cap, pad) {
    var rw = (r[2] - r[0]) * nw, rh = (r[3] - r[1]) * nh, p = pad == null ? 0.9 : pad;
    var s = Math.min(bw / rw, bh / rh) * p; s = Math.min(s, cap);
    var w = nw * s, h = nh * s, cx = (r[0] + r[2]) / 2 * w, cy = (r[1] + r[3]) / 2 * h;
    var tx = w > bw ? Math.min(0, Math.max(bw - w, bw / 2 - cx)) : (bw - w) / 2;
    var ty = h > bh ? Math.min(0, Math.max(bh - h, bh / 2 - cy)) : (bh - h) / 2;
    el.style.width = nw + 'px'; el.style.height = nh + 'px';
    el.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + s.toFixed(4) + ')';
  }
  function nat(el) { return [el.naturalWidth || 1600, el.naturalHeight || 1000]; }
  function drawMain() { var b = stage.getBoundingClientRect(), n = nat(img), f = FRAMES[cur]; frame(img, b.width, b.height, n[0], n[1], f.r, f.full ? 1.0 : 1.7, f.full ? 0.94 : 0.96); }
  img.classList.add('framed');
  function thumbs() {
    $('#thumbs').innerHTML = FRAMES.map(function (f, i) {
      return '<button type="button" aria-current="' + (i === cur) + '" data-frame="' + i + '" aria-label="' + (f.full ? 'Full vehicle' : 'Detail: ' + f.n) + '"><span class="tf"><img src="' + R.img(l, true) + '" alt="" width="720" height="480" decoding="async" class="framed"></span><span class="tl">' + (f.full ? 'Full vehicle' : 'Detail · ' + f.n) + '</span></button>';
    }).join('');
    $$('#thumbs .tf').forEach(function (box, i) { var t = box.querySelector('img'); var go = function () { var b = box.getBoundingClientRect(), n = nat(t); frame(t, b.width, b.height, n[0], n[1], FRAMES[i].r, 9, FRAMES[i].full ? 0.94 : 1); }; if (t.complete && t.naturalWidth) go(); else t.addEventListener('load', go); });
  }
  function setFrame(i, animate) {
    cur = (i + FRAMES.length) % FRAMES.length;
    img.style.transition = animate && !reduceG ? 'transform .9s cubic-bezier(.16,1,.3,1)' : 'none';
    drawMain(); $$('#thumbs button').forEach(function (b) { b.setAttribute('aria-current', +b.dataset.frame === cur); });
    $('#gcap').textContent = FRAMES[cur].full ? 'Full vehicle' : 'Detail · ' + FRAMES[cur].n;
  }
  thumbs();
  // phones: the paint panel sits under the 3D stage instead of covering it
  if (matchMedia('(max-width: 760px)').matches) stage.after(conf);
  if (!l.model3d) { var n3 = R.listings().filter(function (x) { return x.model3d; }).length; $('#thumbs').insertAdjacentHTML('afterend', '<p class="g3d"><a class="ul" href="listings.html?model3d=1">' + n3 + ' listings have a 3D walk-around you can drag →</a></p>'); }
  if (img.complete && img.naturalWidth) setFrame(0); else img.addEventListener('load', function () { setFrame(0); }, { once: true });
  new ResizeObserver(function () { if (img.naturalWidth) { img.style.transition = 'none'; drawMain(); } $$('#thumbs .tf img').forEach(function (t) { if (t.naturalWidth) t.dispatchEvent(new Event('load')); }); }).observe(stage);
  $('#thumbs').addEventListener('click', function (e) { var b = e.target.closest('[data-frame]'); if (!b) return; if ($('#gtabs [data-tab=photo]')) showTab('photo'); setFrame(+b.dataset.frame, true); });
  img.addEventListener('click', function () { openZoom(); });
  $('#gzoom').addEventListener('click', function () { openZoom(); });

  // ---------- full-screen zoom viewer: drag/pinch with inertia, wheel, double-tap, keys, swipe down to close ----------
  var zv = $('#zv'), zimg = $('#zv-img'), zst = { s: 1, x: 0, y: 0 }, base = 1, raf = 0, vel = { x: 0, y: 0 };
  var ptrs = {}, last = null, pinch = null, tapT = 0, tapX = 0, tapY = 0, swipe = 0, moved = 0;
  function vw() { return zv.clientWidth; } function vh() { return zv.clientHeight; }
  function zn() { return nat(zimg); }
  function clampZ() {
    var n = zn(), S = base * zst.s, w = n[0] * S, h = n[1] * S;
    zst.x = w > vw() ? Math.min(0, Math.max(vw() - w, zst.x)) : (vw() - w) / 2;
    zst.y = h > vh() ? Math.min(0, Math.max(vh() - h, zst.y)) : (vh() - h) / 2;
  }
  function drawZ(anim) {
    zimg.style.transition = anim && !reduceG ? 'transform .45s cubic-bezier(.16,1,.3,1)' : 'none';
    zimg.style.transform = 'translate(' + zst.x.toFixed(1) + 'px,' + (zst.y + swipe).toFixed(1) + 'px) scale(' + (base * zst.s).toFixed(4) + ')';
    zv.style.setProperty('--fade', Math.max(0.35, 1 - Math.abs(swipe) / 400));
    $('#zv-lvl').textContent = Math.round(zst.s * 100) + '%';
  }
  var MAXZ = function () { var n = zn(); return Math.max(1.5, (n[0] * 2) / (vw() * 1)); };
  function zoomAt(px, py, ns, anim) {
    ns = Math.max(1, Math.min(MAXZ(), ns)); var k = ns / zst.s;
    zst.x = px - (px - zst.x) * k; zst.y = py - (py - zst.y) * k; zst.s = ns; clampZ(); drawZ(anim);
  }
  function fitRegion(r, anim) {
    var n = zn(); base = Math.min(vw() / n[0], vh() / n[1]);
    var rw = (r[2] - r[0]) * n[0], rh = (r[3] - r[1]) * n[1];
    zst.s = Math.max(1, Math.min(MAXZ(), Math.min(vw() / rw, vh() / rh) * 0.92 / base));
    var S = base * zst.s; zst.x = vw() / 2 - (r[0] + r[2]) / 2 * n[0] * S; zst.y = vh() / 2 - (r[1] + r[3]) / 2 * n[1] * S; clampZ(); drawZ(anim);
  }
  function zLabel() { $('#zv-cap').textContent = (FRAMES[cur].full ? 'Full vehicle' : 'Detail · ' + FRAMES[cur].n) + '  ·  ' + (cur + 1) + ' of ' + FRAMES.length; }
  function openZoom() {
    zimg.src = R.img(l); zimg.alt = img.alt; zv.showModal(); document.body.style.overflow = 'hidden';
    var go = function () { fitRegion(FRAMES[cur].full ? [0, 0, 1, 1] : FRAMES[cur].r, false); zLabel(); };
    if (zimg.complete && zimg.naturalWidth) go(); else zimg.addEventListener('load', go, { once: true });
  }
  zv.addEventListener('close', function () { document.body.style.overflow = ''; cancelAnimationFrame(raf); swipe = 0; });
  function step(d) { setFrame(cur + d, false); fitRegion(FRAMES[cur].full ? [0, 0, 1, 1] : FRAMES[cur].r, true); zLabel(); }
  $('#zv-prev').addEventListener('click', function () { step(-1); });
  $('#zv-next').addEventListener('click', function () { step(1); });
  $('#zv-in').addEventListener('click', function () { zoomAt(vw() / 2, vh() / 2, zst.s * 1.6, true); });
  $('#zv-out').addEventListener('click', function () { zoomAt(vw() / 2, vh() / 2, zst.s / 1.6, true); });
  $('#zv-fit').addEventListener('click', function () { zst.s = 1; clampZ(); drawZ(true); });
  $('#zv-x').addEventListener('click', function () { zv.close(); });
  var stage2 = $('#zv-stage');
  stage2.addEventListener('wheel', function (e) { e.preventDefault(); zoomAt(e.clientX, e.clientY, zst.s * Math.exp(-e.deltaY * 0.0022), false); }, { passive: false });
  stage2.addEventListener('pointerdown', function (e) {
    cancelAnimationFrame(raf); stage2.setPointerCapture(e.pointerId); ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; moved = 0;
    var ids = Object.keys(ptrs);
    if (ids.length === 2) { var a = ptrs[ids[0]], b = ptrs[ids[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: zst.s }; last = null; }
    else { last = { x: e.clientX, y: e.clientY, t: performance.now() }; vel = { x: 0, y: 0 }; }
  });
  stage2.addEventListener('pointermove', function (e) {
    if (!ptrs[e.pointerId]) return; ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(ptrs);
    if (ids.length === 2 && pinch) { var a = ptrs[ids[0]], b = ptrs[ids[1]]; zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, pinch.s * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, false); return; }
    if (!last) return;
    var dx = e.clientX - last.x, dy = e.clientY - last.y, now = performance.now(), dt = Math.max(1, now - last.t); moved += Math.abs(dx) + Math.abs(dy);
    if (zst.s <= 1.001) { swipe = Math.max(0, swipe + dy); drawZ(false); }
    else { zst.x += dx; zst.y += dy; clampZ(); drawZ(false); vel = { x: dx / dt * 16, y: dy / dt * 16 }; }
    last = { x: e.clientX, y: e.clientY, t: now };
  });
  function up(e) {
    delete ptrs[e.pointerId]; if (Object.keys(ptrs).length < 2) pinch = null;
    if (Object.keys(ptrs).length) return;
    if (swipe > 110) { zv.close(); return; }
    if (swipe) { swipe = 0; drawZ(true); }
    // double tap / double click toggles zoom at that point
    var now = performance.now();
    if (moved < 8) { if (now - tapT < 320 && Math.hypot(e.clientX - tapX, e.clientY - tapY) < 30) { zoomAt(e.clientX, e.clientY, zst.s > 1.2 ? 1 : 2.5, true); tapT = 0; return; } tapT = now; tapX = e.clientX; tapY = e.clientY; }
    if (!reduceG && (Math.abs(vel.x) > 0.5 || Math.abs(vel.y) > 0.5) && zst.s > 1.001) {
      (function glide() { vel.x *= 0.92; vel.y *= 0.92; zst.x += vel.x; zst.y += vel.y; clampZ(); drawZ(false); if (Math.abs(vel.x) + Math.abs(vel.y) > 0.3) raf = requestAnimationFrame(glide); })();
    }
    last = null;
  }
  stage2.addEventListener('pointerup', up); stage2.addEventListener('pointercancel', up);
  zv.addEventListener('keydown', function (e) {
    var k = e.key, d = 70;
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown') {
      if (zst.s <= 1.001 && (k === 'ArrowLeft' || k === 'ArrowRight')) step(k === 'ArrowLeft' ? -1 : 1);
      else { zst.x += k === 'ArrowLeft' ? d : k === 'ArrowRight' ? -d : 0; zst.y += k === 'ArrowUp' ? d : k === 'ArrowDown' ? -d : 0; clampZ(); drawZ(true); }
      e.preventDefault();
    } else if (k === '+' || k === '=') { zoomAt(vw() / 2, vh() / 2, zst.s * 1.4, true); e.preventDefault(); }
    else if (k === '-' || k === '_') { zoomAt(vw() / 2, vh() / 2, zst.s / 1.4, true); e.preventDefault(); }
    else if (k === '0') { zst.s = 1; clampZ(); drawZ(true); }
  });
  addEventListener('resize', function () { if (zv.open) fitRegion(FRAMES[cur].full ? [0, 0, 1, 1] : FRAMES[cur].r, false); });

  var tabs = [];
  if (l.model3d) tabs.push(['3d', '3D walk-around']);
  tabs.push(['photo', 'Photos']);
  $('#gtabs').hidden = tabs.length < 2;
  $('#gtabs').innerHTML = tabs.map(function (t, i) { return '<button type="button" role="tab" aria-selected="' + (i === 0) + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('');
  var api = null;
  function showTab(t) {
    $$('#gtabs [data-tab]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.tab === t); });
    var is3d = t === '3d'; canvas.hidden = !is3d; conf.hidden = !is3d; img.style.visibility = is3d && api ? 'hidden' : 'visible';
    hint.hidden = !is3d; hint.textContent = api ? 'Drag to walk around · ← → keys' : 'Loading the 3D walk-around…'; $('#gzoom').hidden = is3d; $('#gcap').hidden = is3d;
    if (is3d && armed) load3D();
  }
  var armed = false;
  $('#gtabs').addEventListener('click', function (e) { var b = e.target.closest('[data-tab]'); if (b) { armed = true; showTab(b.dataset.tab); } });

  var PAINTS = [['Carmine candy', '#a3231a'], ['Torched graphite', '#2a2c30'], ['Pearl white', '#d4d1ca', 'pearl'], ['Abyss blue', '#1d3b5c'], ['Ember', '#c2410c'], ['Racing green', '#173d2c']];
  $('#sw').innerHTML = PAINTS.map(function (p) { return '<button type="button" style="--c:' + p[1] + '" aria-label="' + p[0] + '" aria-pressed="' + (p[1].toLowerCase() === String(l.paint).toLowerCase() || (p[0] === l.color && true)) + '" data-c="' + p[1] + '"' + (p[2] ? ' data-f="' + p[2] + '"' : '') + '></button>'; }).join('');
  if (!$('#sw [aria-pressed=true]') && $('#sw button')) $('#sw button').setAttribute('aria-pressed', 'true');
  var finish = 'gloss';
  $('#sw').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; $$('#sw button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); if (b.dataset.f) { finish = b.dataset.f; syncFin(); } if (api) api.setPaint(b.dataset.c, finish); });
  function syncFin() { $$('#fin button').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.f === finish); }); }
  $('#fin').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; finish = b.dataset.f; syncFin(); var c = $('#sw [aria-pressed=true]'); if (api && c) api.setPaint(c.dataset.c, finish); });
  $('#xray').addEventListener('click', function () { var on = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', on); if (api) api.setFlood(on ? 1 : 0); });

  function load3D() {
    if (api || !window.WebGLRenderingContext) return;
    if (load3D.busy) return; load3D.busy = true;
    $('#gload').hidden = false;
    var s = document.createElement('script'); s.src = '../assets/revv3d.js?v=6';
    s.onload = function () {
      try {
        canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', '3D walk-around of the ' + title + '. Drag or use the arrow keys to rotate.');
        canvas.style.opacity = 0; canvas.style.transition = 'opacity 1.2s cubic-bezier(.16,1,.3,1)';
        api = window.Revv3D.mount(canvas, { mode: 'studio', src: 'models/kestrel.glb', paint: l.paint || '#a3231a', lens: false, bg: '#08090a' });
        api.ready.catch(function () { $('#gload').hidden = true; showTab('photo'); });
        api.ready.then(function () { canvas.style.opacity = 1; $('#gload').classList.add('done'); if (!canvas.hidden) { setTimeout(function () { img.style.visibility = 'hidden'; }, 1200); hint.textContent = 'Drag to walk around · ← → keys'; } });
      } catch (err) { showTab('photo'); }
    };
    document.head.appendChild(s);
  }
  showTab(tabs[0][0]);
  // the 3D starts after the page is usable: idle time on desktop, the first gesture (or 3.5 s) on phones
  if (l.model3d) {
    var go3d = function () { if (armed) return; armed = true; if (!canvas.hidden) load3D(); };
    addEventListener('load', function () {
      if (matchMedia('(pointer: coarse)').matches) { addEventListener('pointerdown', go3d, { once: true, passive: true }); addEventListener('scroll', go3d, { once: true, passive: true }); setTimeout(go3d, 3500); }
      else if (window.requestIdleCallback) requestIdleCallback(go3d, { timeout: 1200 }); else setTimeout(go3d, 800);
    });
  }

  // ---------- report: inspection map on every listing, bikes get their own categories ----------
  var rep = R.renderReport(l);
  if (window.InspectMap) window.InspectMap.mount($('#imap'), l);

  // ---------- specs + service ----------
  $('#specs').innerHTML = Object.keys(l.spec).map(function (k) { return '<div><dt>' + k + '</dt><dd>' + R.esc(l.spec[k]) + '</dd></div>'; }).join('') + '<div><dt>Colour</dt><dd>' + R.esc(l.color) + '</dd></div>';
  // the odometer story and the service list read the same stamps, so the line and the list always agree
  var stamps = window.Odo ? window.Odo.stamps(l) : [];
  if (window.Odo) window.Odo.mount($('#odo-story'), l);
  $('#svc').innerHTML = stamps.filter(function (s) { return s.kind !== 'reg'; }).reverse().map(function (s) { return '<li><span>' + s.date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) + ' · ' + R.km(s.km) + '</span><b>' + R.esc(s.kind === 'insp' ? 'Revv 150-point inspection' : s.label) + '</b><span>' + (s.kind === 'insp' ? rep.ok + '/150 · ' + R.esc(rep.inspector) : R.esc(s.where) + ' · stamped, invoice on file') + '</span></li>'; }).join('');

  // ---------- EMI ----------
  function emi() {
    var down = +$('#e-down').value, rate = +$('#e-rate').value, n = +($('#emi [name=ten]:checked') || { value: 60 }).value;
    var loan = l.price * (1 - down / 100), m = R.emi(loan, rate, n), tot = m * n;
    $('#e-downv').textContent = down + '% · ' + R.inr(l.price * down / 100);
    $('#e-out').textContent = R.inrFull(m); $('#e-loan').textContent = R.inrFull(loan); $('#e-int').textContent = R.inrFull(tot - loan); $('#e-tot').textContent = R.inrFull(tot + l.price * down / 100);
  }
  $('#emi').addEventListener('input', emi); $('#emi').addEventListener('change', emi); $('#emi').addEventListener('submit', function (e) { e.preventDefault(); }); emi();

  // ---------- test-ride slots ----------
  var leads = R.leads(), today = new Date(); today.setHours(0, 0, 0, 0);
  var TIMES = ['10:00', '11:30', '13:00', '15:00', '16:30', '18:00'];
  var rng = R.rng(l.id + 'slots'), day = null, time = null;
  var days = []; for (var i = 1; i <= 7; i++) { var dt = new Date(today.getTime() + i * 864e5); days.push(dt); }
  function iso(dt) { return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); }
  var blocked = {}; days.forEach(function (dt) { TIMES.forEach(function (t) { if (rng() < 0.22) blocked[iso(dt) + ' ' + t] = 1; }); });
  leads.forEach(function (x) { if (x.listing === l.id && x.slot) blocked[x.slot] = 1; });
  $('#days').innerHTML = days.map(function (dt, i) { return '<button type="button" data-day="' + iso(dt) + '" aria-pressed="' + (i === 0) + '">' + dt.toLocaleDateString('en-IN', { weekday: 'short' }) + '<b>' + dt.getDate() + '</b></button>'; }).join('');
  function renderSlots() {
    $('#slots').innerHTML = TIMES.map(function (t) { var k = day + ' ' + t, off = blocked[k]; return '<button type="button" data-t="' + t + '" aria-pressed="' + (t === time) + '"' + (off ? ' disabled aria-label="' + t + ', taken"' : '') + '>' + t + '</button>'; }).join('');
  }
  day = iso(days[0]); renderSlots();
  $('#days').addEventListener('click', function (e) { var b = e.target.closest('[data-day]'); if (!b) return; day = b.dataset.day; time = null; $$('#days button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); renderSlots(); });
  $('#slots').addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (!b || b.disabled) return; time = b.dataset.t; $$('#slots button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); });

  $('#bookf').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#b-name').value.trim(), phone = $('#b-phone').value.trim();
    $('#b-err').textContent = time ? '' : 'Pick a time on the left first. Struck-through slots are already taken.';
    if (!time) { $('#slots').classList.remove('shake'); void $('#slots').offsetWidth; $('#slots').classList.add('shake'); }
    if (!R.validate([[$('#b-name'), 'name'], [$('#b-phone'), 'phone'], [$('#b-lic'), 'licence']]) || !time) return;
    var slot = day + ' ' + time, where = $('#bookf [name=where]:checked').value;
    var lead = R.addLead({ listing: l.id, name: name, phone: phone, kind: 'test', slot: slot, where: where });
    blocked[slot] = 1; time = null; renderSlots();
    $('#b-go').hidden = true;
    var ok = $('#b-ok'); ok.hidden = false;
    ok.innerHTML = '<div class="ok-msg"><b>Booked.</b> ' + R.esc(new Date(day).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })) + ' at ' + slot.slice(11) + ', ' + R.esc(where.toLowerCase()) + '. ' + R.esc(d.name) + ' has it as lead ' + lead.id + ' and will confirm on WhatsApp.<br><br><a class="btn sm" href="dealer.html?lead=' + lead.id + '">See it in the dealer\'s CRM →</a> <button type="button" class="btn ghost sm" id="b-again">Book another</button></div>';
    $('#b-again').addEventListener('click', function () { ok.hidden = true; $('#b-go').hidden = false; });
    R.toast('Test ' + verb + ' booked. <a href="dealer.html?lead=' + lead.id + '">Open the dealer dashboard →</a>');
  });

  // ---------- ask the dealer ----------
  var ask = $('#ask');
  $('#ask-sub').textContent = title + ' · ' + d.name + ', ' + d.city;
  $('#askbtn').addEventListener('click', function () { ask.showModal(); $('#a-name').focus(); });
  $('#askf').addEventListener('submit', function (e) {
    e.preventDefault(); var name = $('#a-name').value.trim(), phone = $('#a-phone').value.trim();
    if (!R.validate([[$('#a-name'), 'name'], [$('#a-phone'), 'phone']])) return;
    var lead = R.addLead({ listing: l.id, name: name, phone: phone, kind: 'enquiry', msg: $('#a-msg').value.trim() });
    ask.close(); R.toast('Sent to ' + R.esc(d.name) + ' as lead ' + lead.id + '. <a href="dealer.html?lead=' + lead.id + '">See it arrive →</a>', 6000);
  });

  // ---------- dealer + similar ----------
  var n = R.listings().filter(function (x) { return x.dealer === d.id; }).length;
  $('#dcard').innerHTML = '<span class="av" aria-hidden="true">' + d.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2) + '</span><div><h3>' + R.esc(d.name) + '</h3><p>' + R.esc(d.area + ', ' + d.city) + ' · ★ ' + d.rating + ' (' + d.reviews + ' reviews) · ' + n + ' certified listings · on Revv since ' + d.since + '</p><p>' + (d.kyc === 'verified' ? 'KYC verified · GST registered · ' : 'KYC in review · ') + 'Sales lead: ' + R.esc(d.rep) + '</p></div><a class="btn ghost" href="showroom.html?id=' + d.id + '">Visit the showroom</a>';
  var sim = R.listings().filter(function (x) { return x.id !== l.id && x.type === l.type; }).sort(function (a, b) { return (a.body === l.body ? -1 : 0) - (b.body === l.body ? -1 : 0) || Math.abs(a.price - l.price) - Math.abs(b.price - l.price); }).slice(0, 3);
  $('#sim').innerHTML = sim.map(function (x) { return R.card(x); }).join('');
  R.refreshCounts(); R.renderTray();
})();
