/* Stockroom product page: renders the real UI into the hero, fills live numbers, and runs the pinned
   "deal won → reserved → picked → dispatched" story (GSAP ScrollTrigger, pin + scrub). */
(function () {
  'use strict';
  // heavy work (seeding 90 days of demo history, rendering the hero UI) waits until after first paint
  function boot() {
  var E = window.SR.init({ ephemeral: true }), V = window.SRV;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* ---------- hero: the app itself, rendered from the engine ---------- */
  var frameIn = $('#frame-in'), frame = $('#frame');
  var nav = [['overview', 'Today'], ['items', 'Items'], ['locations', 'Locations'], ['-', 'Warehouse'], ['receipt', 'Receive'], ['sales', 'Pick and pack'], ['ledger', 'Count'], ['scan', 'Scan'], ['-', 'Buying'], ['purchasing', 'Purchase orders'], ['labels', 'Labels'], ['-', 'More detail'], ['reports', 'Reports']];
  var drafts = E.pos().filter(function (p) { return p.status === 'draft'; }).length;
  try {
  frameIn.innerHTML = '<div class="shell"><aside class="side"><div class="ws"><span class="mark">' + V.markSVG + '</span><span><b>Stockroom</b><small>Halden Supply</small></span></div><nav class="nav">' +
    nav.map(function (x) {
      if (x[0] === '-') return '<div class="grp">' + x[1] + '</div>';
      var n = x[0] === 'purchasing' ? '<span class="n hot">' + drafts + '</span>' : x[0] === 'items' ? '<span class="n">' + E.lowItems().length + '</span>' : '';
      return '<a aria-current="' + (x[0] === 'overview' ? 'page' : 'false') + '">' + V.icon(x[0] === 'overview' ? 'overview' : x[0]) + x[1] + n + '</a>';
    }).join('') + '</nav><div class="side-foot"><div class="link-card"><div class="t"><span class="crm" style="padding:0;background:none"><i></i></span>Lumen CRM</div><div style="display:flex;align-items:center;gap:7px"><span class="dot on"></span>Connected · 3 won deals read</div></div><div class="me"><span class="av">MR</span><span><b>Meera Rao</b><small>Inventory lead</small></span></div></div></aside>' +
    '<div class="main"><div class="canvas"><header class="top"><div class="h1like" style="font-weight:600;font-size:14px">Today</div><span class="sp"></span><div class="seg"><button aria-pressed="true">All</button><button>Bhiwandi</button><button>Hoskote</button></div><span class="cmdk-btn">' + V.icon('search') + '<span class="lbl">Search</span><kbd>⌘K</kbd></span><span class="btn primary">' + V.icon('scan') + '<span class="hide-m">Scan</span></span></header><div id="view">' +
    V.overview({ wh: '' }).replace('CRM not opened yet', '3 won deals read').replace(/<h2(\s[^>]*)?>/g, function (m, a) { return '<div class="h2like"' + (a || '') + '>'; }).replace(/<\/h2>/g, '</div>') + '</div></div></div></div>';
  // the day's headline and the two floor drawings, as the app itself shows them
  var slot = $('#h1-slot', frameIn); if (slot && V.headline && V.lastX) { var hd = document.createElement('div'); hd.className = 'today-h1'; hd.textContent = V.headline(V.lastX); slot.replaceWith(hd); }
  if (V.mountFloors) V.mountFloors(frameIn);
  } catch (err) { /* the story, scan labels and numbers below do not depend on the app frame */ if (window.console) console.warn('hero app frame not drawn', err); }
  // keep the page's heading outline clean: the embedded UI is an illustration
  $$('a', frameIn).forEach(function (el) { var s = document.createElement('span'); s.className = el.className; s.innerHTML = el.innerHTML; if (el.getAttribute('aria-current') === 'page') s.setAttribute('data-cur', ''); el.parentNode.replaceChild(s, el); });
  $$('button,input,select', frameIn).forEach(function (el) { el.setAttribute('tabindex', '-1'); });
  $$('img', frameIn).forEach(function (img) { img.removeAttribute('loading'); });
  var style = document.createElement('style');
  style.textContent = '.frame-in .fl-panel header .h2like{font-size:15px;font-weight:600;letter-spacing:-.01em}.frame-in .h2like{font-size:22px;font-weight:600;letter-spacing:-.025em}.frame-in .panel>header .h2like{font-size:13.5px;font-weight:600;letter-spacing:-.005em}';
  document.head.appendChild(style);
  function fit() {
    var w = frameIn.offsetWidth || 1280;
    frameIn.style.transform = 'scale(' + (frame.clientWidth / w) + ')';
  }
  fit(); addEventListener('resize', fit);

  /* ---------- live numbers ---------- */
  var moves = E.moves().length, value = E.totalValue();
  $('[data-fact="bins"]').textContent = E.bins().length;
  $('[data-fact="moves"]').textContent = V.n(moves);
  $('[data-fact="value"]').textContent = V.inrS(value).replace(/\.\d+ L/, ' L');
  // FIFO cost the story's dispatch would consume, from the real layers
  function fifo(sku, q) { var c = 0; E.fifoLayers(sku, 'BHW').forEach(function (l) { var t = Math.min(q, l.q); c += t * l.c; q -= t; }); return c; }
  var c1 = fifo('HS-CH-001', 12), c2 = fifo('HS-TB-006', 2), c3 = fifo('HS-LT-014', 4);
  var fill = { c1: V.inr(c1 / 12), c2: V.inr(c2 / 2), c3: V.inr(c3 / 4), cogs: V.inr(c1 + c2 + c3) };
  $$('[data-fill]').forEach(function (el) { el.textContent = fill[el.dataset.fill]; });

  /* ---------- feature fragments, drawn with the app's own renderers ---------- */
  var led = E.moves().slice(-6).reverse();
  $('#f-ledger').innerHTML = '<div class="scroll-x"><table class="tbl"><thead><tr><th>When</th><th>Type</th><th>Item</th><th class="num">Qty</th><th class="num hide-m">Unit cost</th><th class="num">Balance</th></tr></thead><tbody>' +
    led.map(function (m) { return '<tr><td class="muted" style="white-space:nowrap">' + V.when(m.t) + '</td><td>' + V.mv(m.type) + '</td><td>' + V.itemCell(m.sku, true) + '</td><td class="num ' + (m.qty < 0 ? 'neg' : 'pos') + '">' + (m.qty > 0 ? '+' : '−') + Math.abs(m.qty) + '</td><td class="num hide-m">' + (m.unit ? V.inr(m.unit) : '—') + '</td><td class="num"><b style="font-weight:500">' + m.bal + '</b></td></tr>'; }).join('') + '</tbody></table></div>';
  var po = E.pos().filter(function (p) { return p.status === 'draft'; })[0];
  if (po) {
    var l = po.lines[0], it = E.item(l.sku);
    $('#f-po').innerHTML = '<div class="pad"><div style="display:flex;align-items:center;gap:8px"><span class="mono" style="font-size:12px">' + po.id + '</span><span class="pill acc" id="po-st">Draft</span><span style="margin-left:auto;font-size:12px" class="faint">' + V.esc(E.supplier(po.supplier).name) + '</span></div>' +
      '<div style="display:flex;align-items:center;gap:10px">' + V.itemCell(l.sku) + '<span style="margin-left:auto" class="num">' + V.buyLabel(it, l.pq) + '</span></div><div style="display:flex;align-items:center;gap:8px;font-size:12.5px" class="muted">Available ' + E.available(l.sku) + ' · reorder at ' + E.rop(l.sku) + '<button class="btn sm primary" id="po-ok" style="margin-left:auto" type="button">Approve</button></div></div>';
    $('#po-ok').addEventListener('click', function () { var s = $('#po-st'); s.textContent = 'Sent'; s.className = 'pill ok'; this.textContent = 'Sent ✓'; this.disabled = true; });
  }
  var zone = E.bins('BHW').filter(function (b) { return b.zone === 'A'; });
  $('#f-bins').innerHTML = '<div class="pad"><div class="bins">' + zone.map(function (b) {
    var c = E.binQty(b.id), q = 0; c.forEach(function (x) { q += x.q; });
    return '<span class="bin"><span class="c">' + b.id.slice(4) + '</span><span class="dots">' + c.slice(0, 2).map(function (x) { return '<img src="' + E.item(x.sku).thumb + '" alt="" width="18" height="18" loading="lazy">'; }).join('') + '</span><span class="q">' + q + ' u</span><span class="f" style="width:' + Math.min(100, q / 40 * 100) + '%"></span></span>';
  }).join('') + '</div></div>';
  $$('canvas[data-bc]').forEach(function (c) { window.Code128.draw(c, c.dataset.bc, { module: 2, height: 52, label: false }); });

  /* ---------- motion ---------- */
  var G = window.gsap, ST = window.ScrollTrigger;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var beats = $$('#beats li'), rail = $('#rail'), stage = $('#stage'), cur = -1;
  var picks = $$('.picks li'), cnts = $$('.cnt');
  var hitBins = picks.map(function (li) { return $('.mrow .b[data-k="' + li.dataset.k + '"]'); });
  function state(p) {
    var t = p * 4, b = Math.min(3, Math.floor(t));
    if (b !== cur) { beats.forEach(function (li, i) { li.classList.toggle('on', i === b); }); cur = b; }
    stage.setAttribute('data-scene', t < 2.05 ? 1 : t < 3.05 ? 2 : 3);
    $('#listen').classList.toggle('got', t >= 1.3);
    rail.style.transform = 'scaleX(' + Math.max(.02, p) + ')';
    // pick ticks: 2.45, 2.65, 2.85
    picks.forEach(function (li, i) { var on = t >= 2.45 + i * .2; li.classList.toggle('done', on); hitBins[i].classList.toggle('done', on); });
  }
  // the pick route runs along the aisle between the two rows and steps into each bin, in walk order
  var route = $('#route'), rsvg = $('#route-svg'), floor = $('.mini-floor'), len = 0;
  function drawRoute() {
    var f = floor.getBoundingClientRect(); if (!f.width) return;
    var rows = $$('.mrow', floor).map(function (r) { return r.getBoundingClientRect(); });
    var aisle = (rows[0].bottom + rows[1].top) / 2 - f.top, d = 'M6 ' + aisle.toFixed(1);
    hitBins.forEach(function (b) {
      var r = b.getBoundingClientRect(), x = (r.left + r.width / 2 - f.left).toFixed(1), up = r.top + r.height / 2 < aisle + f.top;
      var edge = (up ? r.bottom - f.top + 1 : r.top - f.top - 1).toFixed(1);
      d += ' L' + x + ' ' + aisle.toFixed(1) + ' L' + x + ' ' + edge + ' L' + x + ' ' + aisle.toFixed(1);
    });
    d += ' L' + (f.width - 6).toFixed(1) + ' ' + aisle.toFixed(1);
    rsvg.setAttribute('viewBox', '0 0 ' + f.width.toFixed(1) + ' ' + f.height.toFixed(1));
    route.setAttribute('d', d);
    var p = len ? 1 - (parseFloat(route.style.strokeDashoffset) || 0) / len : 0;
    len = route.getTotalLength();
    route.style.strokeDasharray = len; route.style.strokeDashoffset = len * (1 - p);
  }
  drawRoute();

  // reduced motion (or no GSAP): the four beats are shown as static panels in their final state
  if (!G || !ST || reduce) {
    document.documentElement.classList.add('motion-off');
    cnts.forEach(function (c) { c.textContent = c.dataset.to; });
    picks.forEach(function (li, i) { li.classList.add('done'); hitBins[i].classList.add('done'); });
    var fin = function () { drawRoute(); route.style.strokeDashoffset = 0; };
    fin(); addEventListener('resize', fin);
    return;
  }
  G.registerPlugin(ST);
  G.to('#tilt', { rotateX: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '#hero-ui', start: 'top 92%', end: 'top 20%', scrub: true } });

  var mm = G.matchMedia();
  mm.add({ wide: '(min-width: 1001px)', narrow: '(max-width: 1000px)' }, function (ctx) {
    var wide = ctx.conditions.wide;
    var wireBox = function () { var s = stage.getBoundingClientRect(), w = $('#wire').getBoundingClientRect(); return { x0: w.left - s.left, x1: w.right - s.left }; };
    var tl = G.timeline({ defaults: { ease: 'power2.out' }, scrollTrigger: { trigger: '#story-pin', start: 'top top', end: '+=' + (wide ? 320 : 260) + '%', pin: true, scrub: .6, invalidateOnRefresh: true, onUpdate: function (s) { state(s.progress); }, onRefreshInit: drawRoute, onToggle: function (s) { document.body.classList.toggle('in-story', s.isActive); }, onRefresh: function (s) { state(s.progress); } } });
    // beat 1: deal won
    // a cursor glides to "Mark as won" and clicks it
    var btnPos = function () { var s = stage.getBoundingClientRect(), b = $('#won-btn').getBoundingClientRect(); return { x: b.left - s.left + b.width * .55, y: b.top - s.top + b.height * .55 }; };
    tl.fromTo('#cursor', { x: function () { return btnPos().x + 90; }, y: function () { return btnPos().y + 70; }, autoAlpha: 0 }, { x: function () { return btnPos().x; }, y: function () { return btnPos().y; }, autoAlpha: 1, duration: .24, ease: 'power3.out' }, .02)
      .to('#cursor', { scale: .86, duration: .04, yoyo: true, repeat: 1 }, .27)
      .fromTo('#cursor .ripple', { scale: .4, autoAlpha: .9 }, { scale: 2.4, autoAlpha: 0, duration: .2 }, .28)
      .to('#won-btn .w1', { autoAlpha: 0, duration: .06 }, .3).to('#won-btn .w2', { autoAlpha: 1, duration: .06 }, .3)
      .to('#deal-stage .s1', { autoAlpha: 0, duration: .12 }, .32).to('#deal-stage .s2', { autoAlpha: 1, duration: .12 }, .32)
      .to('#deal-held', { opacity: 1, duration: .25 }, .32)
      .to('#cursor', { autoAlpha: 0, x: '+=26', y: '+=34', duration: .2 }, .62)
      .to('#deal-sync', { autoAlpha: 1, duration: .1 }, 1.2);
    // beat 2: reserved (packets travel the wire, counts tick down, the PO draft grows)
    if (wide) ['.p1', '.p2', '.p3'].forEach(function (p, i) {
      tl.fromTo(p, { x: function () { return wireBox().x0 - 300; }, autoAlpha: 0 }, { keyframes: [{ autoAlpha: 1, duration: .05 }, { x: function () { return wireBox().x1 - 300; }, duration: .35, ease: 'none' }, { autoAlpha: 0, duration: .05 }] }, 1.05 + i * .12);
    });
    tl.to('#listen .l1', { autoAlpha: 0, duration: .06 }, 1.3).to('#listen .l2', { autoAlpha: 1, duration: .06 }, 1.32);
    tl.to('.resv', { autoAlpha: 1, x: 0, stagger: .12, duration: .2 }, 1.35);
    var o = { k: 0 };
    tl.to(o, { k: 1, duration: .45, ease: 'none', onUpdate: function () { cnts.forEach(function (c) { var a = +c.dataset.from, b = +c.dataset.to; c.textContent = Math.round(a + (b - a) * o.k); }); } }, 1.4);
    tl.to('.lowflag', { autoAlpha: 1, duration: .1 }, 1.82).to('#po-toast', { autoAlpha: 1, y: 0, duration: .15 }, 1.85);
    // beat 3: picked
    tl.to('#sc-res', { autoAlpha: 0, duration: .12 }, 2.02).fromTo('#sc-pick', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: .15 }, 2.1)
      .fromTo(route, { strokeDashoffset: function () { return len; } }, { strokeDashoffset: 0, duration: .65, ease: 'none' }, 2.25)
      .fromTo('.scanlabel .beam', { autoAlpha: 0, y: -16 }, { keyframes: [{ autoAlpha: 1, duration: .02 }, { y: 16, duration: .18 }, { y: -16, duration: .18 }, { autoAlpha: 0, duration: .02 }] }, 2.4);
    // beat 4: dispatched
    tl.to('#sc-pick', { autoAlpha: 0, duration: .12 }, 3.02).fromTo('#sc-out', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: .15 }, 3.1)
      .fromTo('#ship', { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: .18, ease: 'power3.out' }, 3.12)
      .fromTo('#ship .truck', { x: -6 }, { x: 0, duration: .3, ease: 'elastic.out(1,.6)' }, 3.18)
      .fromTo('.ledger-mini tbody tr', { autoAlpha: 0, x: 16 }, { autoAlpha: 1, x: 0, stagger: .1, duration: .15 }, 3.25);
    if (wide) tl.fromTo('.packet.back', { x: function () { return wireBox().x1 - 300; }, autoAlpha: 0 }, { keyframes: [{ autoAlpha: 1, duration: .04 }, { x: function () { return wireBox().x0 - 300; }, duration: .3, ease: 'none' }, { autoAlpha: 0, duration: .04 }] }, 3.5);
    tl.to('.sync .a', { autoAlpha: 0, duration: .1 }, 3.82).to('.sync .b', { autoAlpha: 1, duration: .1 }, 3.84)
      .to('#deal-sync .ds1', { autoAlpha: 0, duration: .08 }, 3.82).to('#deal-sync .ds2', { autoAlpha: 1, duration: .08 }, 3.84);
    tl.to({}, { duration: .2 }, 3.95); // hold the final frame
    state(0);
    return function () { G.set(['.resv', '.lowflag', '#po-toast', '#sc-pick', '#sc-out', '.ledger-mini tbody tr', '.sync span', '#deal-stage span', '#sc-res', '.packet', '#cursor', '#won-btn span', '#deal-sync', '#deal-sync span', '#deal-held', '#ship', '#listen span'], { clearProps: 'all' }); };
  });
    ST.refresh();
  }
  // the engine and renderers load after first paint: the headline never waits for them
  var V_ = '?v=67', deps = ['data.js', 'engine.js', 'views.js', 'depth.js'];
  function load(i, tries) {
    if (i >= deps.length) return boot();
    tries = tries || 0;
    var sc = document.createElement('script'); sc.src = deps[i] + V_ + (tries ? '&r=' + tries : '');
    sc.onload = function () { load(i + 1, 0); };
    // a dropped request is retried a few times; the page stays fully readable meanwhile (the story is static HTML)
    sc.onerror = function () { sc.remove(); if (tries < 4) setTimeout(function () { load(i, tries + 1); }, 300 * (tries + 1)); };
    document.head.appendChild(sc);
  }
  function later() { requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(function () { load(0); }, 120); }); }); }
  if (document.readyState === 'complete') later(); else addEventListener('load', later);
})();
