/* Revv home: hero choreography (3D camera chapters + inspection lens), browse-by, featured, dealers. */
(function () {
  'use strict';
  var R = window.Revv, D = window.REVV_DATA, $ = R.$, $$ = R.$$;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = matchMedia('(pointer: coarse)').matches;
  var all = R.listings();

  // ---------- browse by ----------
  var nb = all.filter(function (l) { return l.type === 'bike'; }).length, nc = all.length - nb;
  $('#n-bikes').textContent = nb + ' certified · from ' + R.inr(Math.min.apply(null, all.filter(function (l) { return l.type === 'bike'; }).map(function (l) { return l.price; })));
  $('#n-cars').textContent = nc + ' certified · from ' + R.inr(Math.min.apply(null, all.filter(function (l) { return l.type === 'car'; }).map(function (l) { return l.price; })));
  var B = [['Under ₹5 L', 0, 500000], ['₹5–10 L', 500000, 1000000], ['₹10–25 L', 1000000, 2500000], ['₹25–50 L', 2500000, 5000000], ['₹50 L +', 5000000, 1e9]];
  $('#budget').innerHTML = B.map(function (b) { var n = all.filter(function (l) { return l.price >= b[1] && l.price < b[2]; }).length;
    return '<a class="chip" href="listings.html?min=' + b[1] + (b[2] < 1e9 ? '&max=' + b[2] : '') + '">' + b[0] + ' <small>' + n + '</small></a>'; }).join('');
  $('#cities').innerHTML = D.CITIES.map(function (c) { var n = all.filter(function (l) { return l.city === c; }).length;
    return '<li><a href="listings.html?city=' + encodeURIComponent(c) + '">' + c + ' <span>' + n + '</span></a></li>'; }).join('');

  var cta = document.querySelector('.hero-cta .btn'); if (cta) cta.firstChild.textContent = 'Browse ' + all.length + ' certified ';
  // ---------- featured ----------
  var feat = ['halvard-rr1000', 'aurex-s4', 'moreau-650', 'varno-vela-n', 'aurex-ecafe', 'varno-atlas'].map(R.byId).filter(Boolean);
  $('#feat').innerHTML = feat.map(function (l, i) { return R.card(l, i); }).join('') +
    '<div class="feat-end"><p class="disp">' + all.length + ' more <span class="ser">on the lot.</span></p><a class="btn dark" href="listings.html">See all listings <span class="ar" aria-hidden="true">→</span></a></div>';

  // ---------- dealers ----------
  var peekImgs = ['d-shop', 'b-noir', 'c-sage', 'b-tourer', 'c-coast', 'b-nine', 'c-hatch', 'c-forest'];
  $('#dealer-list').innerHTML = D.dealers.map(function (d, i) {
    var n = all.filter(function (l) { return l.dealer === d.id; }).length;
    return '<li class="dl" data-peek="photos/' + peekImgs[i] + '-s.jpg"><span class="n">' + String(i + 1).padStart(2, '0') + '</span><h3><a href="showroom.html?id=' + d.id + '">' + R.esc(d.name) + '</a></h3><span class="c">' + R.esc(d.area) + ', ' + R.esc(d.city) + '</span><span class="r"><b>★ ' + d.rating + '</b> · ' + d.reviews + ' reviews · ' + n + ' live</span><span class="badge' + (d.kyc === 'verified' ? ' ok' : '') + '">' + (d.kyc === 'verified' ? 'Verified since ' + d.since : 'KYC in review') + '</span></li>';
  }).join('');
  var peek = $('#peek');
  if (!coarse && peek) {
    $$('.dl').forEach(function (li) {
      li.addEventListener('mouseenter', function () { peek.src = li.dataset.peek; peek.classList.add('on'); });
      li.addEventListener('mouseleave', function () { peek.classList.remove('on'); });
    });
    document.addEventListener('mousemove', function (e) { if (peek.classList.contains('on')) { peek.style.left = e.clientX + 'px'; peek.style.top = e.clientY + 'px'; } }, { passive: true });
  }
  R.refreshCounts();

  // ---------- hero ----------
  var hero = $('#hero'), stage = $('#stage'), canvas = $('#car');
  var api = null, progress = 0;
  var prog = $$('.hero-prog span');
  function heroP() { var r = hero.getBoundingClientRect(); var span = r.height - innerHeight; return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0; }

  function load3D() {
    if (api || !canvas || !window.WebGLRenderingContext) return;
    if (load3D.busy) return; load3D.busy = true;
    var s = document.createElement('script'); s.src = '../assets/revv3d.js?v=4'; s.async = true;
    s.onload = function () {
      try {
        api = window.Revv3D.mount(canvas, { mode: 'hero', src: 'models/kestrel.glb', paint: '#a3231a', readout: $('#read'), callouts: $$('.callout'), pointerHost: stage });
        api.ready.then(function () { stage.classList.add('live'); api.setProgress(progress); });
      } catch (e) { /* no WebGL: the poster stays */ }
    };
    document.head.appendChild(s);
  }
  // Start 3D after the first paint settles. Phones wait for a gesture (or 3.5 s) so the page is usable first.
  var EV = ['pointerdown', 'pointermove', 'scroll', 'keydown', 'wheel'];
  function kick() { EV.forEach(function (n) { removeEventListener(n, kick); }); load3D(); }
  addEventListener('load', function () {
    // the 3D boots on the first sign of a visitor (a pointer move on desktop is near-instant), or after a few seconds
    EV.forEach(function (n) { addEventListener(n, kick, { once: true, passive: true }); });
    setTimeout(kick, coarse ? 3500 : 6000);
  });

  var hint = $('#hint');
  if (hint) { if (coarse || reduce) hint.remove(); else stage.addEventListener('pointermove', function h() { hint.style.opacity = 0; stage.removeEventListener('pointermove', h); }); }

  // paint swatches in chapter 2
  $$('#paints button').forEach(function (b) {
    b.addEventListener('click', function () { $$('#paints button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); if (api) api.setPaint(b.dataset.c, b.dataset.f || 'gloss'); });
  });

  if (reduce || !window.gsap || !window.ScrollTrigger) {
    // static version: nothing pinned, no chapters (their content lives in "How certification works")
    hero.style.height = 'auto'; $$('.chap, .hero-prog').forEach(function (e) { e.style.display = 'none'; });
    return;
  }

  var G = window.gsap, ST = window.ScrollTrigger; G.registerPlugin(ST);
  var odo = $('#odo'), o = { v: 0 };
  var tl = G.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.8,
    onUpdate: function (st) {
      progress = st.progress; if (api) api.setProgress(progress);
      var i = progress < 0.2 ? 0 : progress < 0.56 ? 1 : 2; prog.forEach(function (s, k) { s.classList.toggle('on', k === i); });
    } } });
  var flood = { f: 0 };
  function setFlood() { if (api) api.setFlood(flood.f); }
  tl.to('#hcopy', { autoAlpha: 0, y: -60, duration: 0.14 }, 0.04)
    .to('.hero-meta', { autoAlpha: 0, duration: 0.08 }, 0.06)
    .to(flood, { f: 1, duration: 0.12, onUpdate: setFlood }, 0.2)
    .fromTo('#ch1', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.24)
    .to(o, { v: 150, duration: 0.16, ease: 'power2.out', onUpdate: function () { odo.textContent = Math.round(o.v); } }, 0.24)
    .fromTo('.callout', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06, stagger: 0.02 }, 0.3)
    .to('.callout', { autoAlpha: 0, duration: 0.05 }, 0.5)
    .to('#ch1', { autoAlpha: 0, y: -40, duration: 0.07 }, 0.5)
    .to(flood, { f: 0, duration: 0.12, onUpdate: setFlood }, 0.5)
    .fromTo('#ch2', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.6)
    .fromTo('#paints', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.64)
    .to('#ch2, #paints', { autoAlpha: 0, y: -30, duration: 0.07 }, 0.88)
    .to({}, { duration: 0.05 }, 0.95);
  // auto cycle paint during chapter 2 unless the visitor picks one
  var picked = false, cycle = 0, paints = $$('#paints button');
  paints.forEach(function (b) { b.addEventListener('click', function () { picked = true; }); });
  setInterval(function () {
    if (picked || !api || progress < 0.62 || progress > 0.9) return;
    cycle = (cycle + 1) % paints.length; var b = paints[cycle];
    paints.forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); api.setPaint(b.dataset.c, b.dataset.f || 'gloss');
  }, 2200);
})();
