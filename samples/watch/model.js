/* Ghatika product page: the live configurator (three.js), pricing, constraints, delivery estimate, shareable URL. */
(function () {
  'use strict';
  var D = window.GH_DATA, G = window.GH, $ = G.$, $$ = G.$$, reduce = G.reduce;
  var coarse = matchMedia('(pointer: coarse)').matches;
  var q = new URLSearchParams(location.search);
  var mid = D.MODELS[q.get('m')] ? q.get('m') : 'prahar', M = D.MODELS[mid];
  var has = function (list, id) { return D[list].some(function (x) { return x.id === id; }); };
  var cfg = {
    model: mid,
    dial: has('DIALS', q.get('dial')) ? q.get('dial') : M.sig.dial,
    metal: has('METALS', q.get('metal')) ? q.get('metal') : M.sig.metal,
    strap: has('STRAPS', q.get('strap')) ? q.get('strap') : M.sig.strap,
    engraving: (q.get('engr') || '').slice(0, 22)
  };
  if (cfg.strap === 'bracelet' && (cfg.metal === 'rose' || cfg.metal === 'yellow')) cfg.strap = 'cognac';

  // ---------- static content
  var nick = { prahar: 'hand-wound', nimisha: 'moon', yantra: 'GMT' }[mid];
  document.title = M.name + ' · ' + M.line + ' · Ghatika';
  $('#crumb').textContent = M.name; $('#tryon').href = 'boutiques.html?m=' + mid + '#book'; $('#ref').textContent = M.ref + ' · ' + M.line;
  $('#name').innerHTML = M.name + '<span class="nick">' + nick + '</span>'; $('#desc').textContent = M.desc; $('#story').textContent = M.story;
  if ($('#poster').getAttribute('src') !== M.img) $('#poster').src = M.img; /* never restart the LCP image */ $('#sLine').textContent = M.name;
  $('#specs').innerHTML = M.specs.map(function (s) { return '<div><dt>' + s[0] + '</dt><dd>' + s[1] + '</dd></div>'; }).join('');
  $('#details').innerHTML = [['dial', 'The dial', M.specs[5] ? M.specs[4][1] : ''], ['back', 'Through the back', 'Calibre ' + M.specs[1][1].split(' · ')[0].replace('Calibre ', '') + ', finished by hand and numbered on the caseback ring.'], ['side', 'In profile', M.specs[0][1] + '. The crown is fluted for grip and signed with the ghati.']].map(function (d) {
    return '<figure><div class="ph arch"><img src="img/' + mid + '-' + d[0] + '.webp" alt="' + M.name + ': ' + d[1].toLowerCase() + '" width="1000" height="1000" loading="lazy" decoding="async"></div><figcaption><p class="k br">' + d[1] + '</p><p>' + d[2] + '</p></figcaption></figure>';
  }).join('');
  $('#details figure:first-child figcaption p:last-child').textContent = { prahar: 'Lehariya guilloché, 120 passes on the rose engine, nine coats of lacquer, then printed by hand.', nimisha: 'Jaali guilloché after the carved screens of the City Palace, with a hand-painted lapis and gold moon.', yantra: 'Sunray dial with 360 lines and a 24-hour ring for your second time zone.' }[mid];
  $('#others').innerHTML = Object.keys(D.MODELS).filter(function (k) { return k !== mid; }).map(function (k) {
    var m = D.MODELS[k]; return '<article class="mcard"><div class="ph" style="background:radial-gradient(90% 70% at 50% 45%,#2a2622 0%,#141315 70%)"><img src="' + m.img + '" alt="' + m.name + '" width="960" height="1200" loading="lazy" decoding="async"></div><div class="meta"><h3 style="color:var(--ink)">' + m.name + '</h3><span class="price">from ' + G.lakh(m.price) + '</span></div><p class="desc" style="color:var(--muted-p)">' + m.tagline + '</p><a class="cover" href="watch.html?m=' + k + '" aria-label="Configure ' + m.name + '"></a></article>';
  }).join('');

  // ---------- options
  function sw(list, el, key) {
    el.innerHTML = D[list].map(function (o) { return '<button type="button" data-v="' + o.id + '" style="--c:' + o.c + '" aria-label="' + o.name + (o.add ? ', add ' + G.inr(o.add) : '') + '" title="' + o.name + '"><i></i></button>'; }).join('');
    $$('button', el).forEach(function (b) { b.addEventListener('click', function () { choose(key, b.dataset.v); }); });
  }
  sw('DIALS', $('#o-dial'), 'dial'); sw('METALS', $('#o-metal'), 'metal'); sw('STRAPS', $('#o-strap'), 'strap');
  function optOf(list, id) { return D[list].filter(function (x) { return x.id === id; })[0]; }
  function choose(key, v) {
    if (cfg[key] === v) return;
    var prev = Object.assign({}, cfg); cfg[key] = v;
    if (key === 'metal' && cfg.strap === 'bracelet' && (v === 'rose' || v === 'yellow')) { cfg.strap = 'cognac'; G.toast('The Rann bracelet is made in steel and titanium only, so your gold case is on cognac calf.', function () { cfg = prev; paint(); push(); }); }
    paint(); push();
  }
  function paint() {
    [['dial', 'DIALS'], ['metal', 'METALS'], ['strap', 'STRAPS']].forEach(function (p) {
      var o = optOf(p[1], cfg[p[0]]);
      $$('#o-' + p[0] + ' button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === cfg[p[0]]); });
      $('#s-' + p[0]).innerHTML = G.esc(o.name) + (o.note ? '<small>' + G.esc(o.note) + '</small>' : o.add ? '<small>+ ' + G.inr(o.add) + '</small>' : '');
    });
    var gold = cfg.metal === 'rose' || cfg.metal === 'yellow';
    var bb = $('#o-strap button[data-v="bracelet"]'); bb.disabled = gold; bb.title = gold ? 'The Rann bracelet is made in steel and titanium only' : 'Rann bracelet';
    var price = D.price(cfg); $('#price').textContent = G.inr(price); $('#sPrice').textContent = G.inr(price);
    $('#emi').textContent = 'or ' + G.inr(Math.ceil(price / 12)) + '/mo, 12-month EMI';
    var sig = cfg.dial === M.sig.dial && cfg.metal === M.sig.metal && cfg.strap === M.sig.strap;
    var ready = new Date(); ready.setDate(ready.getDate() + (sig ? 5 : 44));
    $('#eta').innerHTML = (sig ? '<div>In stock at the Udaipur atelier: leaves us in 3 days, with you by ' + G.dfmt(ready.toISOString(), { day: 'numeric', month: 'long' }) + '</div>' : '<div>Made to order for you: about six weeks, with you by ' + G.dfmt(ready.toISOString(), { day: 'numeric', month: 'long', year: 'numeric' }) + '</div>') + '<div>Insured delivery, complimentary · or collect from a boutique</div><div>Five-year warranty, eight when you register</div>';
    $('#sLine').textContent = M.name + ' · ' + G.cfgLine(cfg);
    if (api) api.set(cfg);
  }
  function push() { var u = new URLSearchParams({ m: cfg.model, dial: cfg.dial, metal: cfg.metal, strap: cfg.strap }); if (cfg.engraving) u.set('engr', cfg.engraving); history.replaceState(null, '', '?' + u.toString()); }

  // engraving: live on the caseback, which turns to face you while you type
  var engr = $('#engr'), engrT; engr.value = cfg.engraving;
  function engrCount() { $('#engrN').textContent = engr.value.length + ' of 22 letters · shown live on the back'; }
  engr.addEventListener('focus', function () { if (api && !flipped) toggleFlip(); });
  engr.addEventListener('input', function () {
    var v = engr.value.replace(/[^\w\s.,&'’\-\/]/g, ''); if (v !== engr.value) { engr.value = v; G.toast('Letters, numbers and . , & - / only: our engraver works by hand.'); }
    cfg.engraving = v; engrCount(); clearTimeout(engrT); engrT = setTimeout(function () { if (api) api.setEngraving(v); push(); }, 160);
  });
  engrCount();

  // ---------- bag
  function add() { G.bag.add(cfg); G.toast(M.name + ' added: ' + G.cfgLine(cfg)); }
  $('#add').addEventListener('click', add); $('#sAdd').addEventListener('click', add);
  $('#share').addEventListener('click', function () {
    push(); var url = location.href;
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { G.toast('Link copied. It opens this exact watch.'); }, function () { G.toast('Copy this address from the bar above to share your watch.'); });
  });
  var sticky = $('#sticky'), buyBtn = $('#add');
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { var on = !en[0].isIntersecting && en[0].boundingClientRect.top < 0; sticky.classList.toggle('on', on); document.body.classList.toggle('has-mbar', on && innerWidth <= 1080); sticky.setAttribute('aria-hidden', !on); $('#sAdd').tabIndex = on ? 0 : -1; }).observe(buyBtn);

  // ---------- Udaipur time
  function ist() { var d = new Date(Date.now() + (new Date().getTimezoneOffset() + 330) * 60000); $('#ist').textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  ist(); setInterval(ist, 15000);

  // ---------- the 3D studio
  var stage = $('#stage'), canvas = $('#cfg3d'), api = null, flipped = false, mode = 'studio';
  function setMode(m) {
    mode = m; $$('.modes button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.mode === m); });
    $('#wristbox').hidden = m !== 'wrist'; if (m === 'wrist' && flipped) { flipped = false; $('#flip').setAttribute('aria-pressed', 'false'); }
    $('#hint').textContent = m === 'wrist' ? 'Drag to turn your wrist' : m === 'turntable' ? 'Turning slowly · drag to stop' : 'Drag to turn · arrow keys';
    if (api) api.setMode(m); else boot();
  }
  $$('.modes button').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); }); });
  function toggleFlip() { if (!api) { boot(); return; } if (mode === 'wrist') setMode('studio'); flipped = api.flip(); $('#flip').setAttribute('aria-pressed', flipped); $('#flip').setAttribute('aria-label', flipped ? 'Turn it back to the dial' : 'Turn it over to see the movement'); }
  $('#flip').addEventListener('click', toggleFlip);
  $('#zin').addEventListener('click', function () { if (api) api.zoom(0.85); else boot(); });
  $('#zout').addEventListener('click', function () { if (api) api.zoom(1.18); else boot(); });
  var wr = $('#wrist'), L2L = { prahar: 47, nimisha: 44, yantra: 49 }[mid];
  function fit() {
    var cm = +wr.value; $('#wristOut').textContent = cm.toFixed(1) + ' cm';
    var k = Math.PI * (3 * 1.73 - Math.sqrt(3.73 * 3.19)), width = Math.round(2 * (cm * 10) / k);
    var r = L2L / width, msg = r < 0.8 ? 'Sits well inside the wrist, with room to spare.' : r < 0.9 ? 'A confident fit: the lugs stay within the top of the wrist.' : 'The lugs reach the edge of a wrist this size. ' + (mid === 'nimisha' ? 'A shorter strap keeps it neat.' : 'Nimisha, at 36 mm, may sit better.');
    $('#fit').innerHTML = 'Lug to lug ' + L2L + ' mm on a wrist about ' + width + ' mm across. ' + msg;
    if (api) api.setWrist(cm);
  }
  wr.addEventListener('input', fit); fit();

  function boot() {
    if (boot.busy) return; boot.busy = true;
    if (!G.gpuOK()) { stage.classList.add('no3d'); $('.loadbar').innerHTML = ''; $('#hint').textContent = 'Still render · live 3D needs a graphics card'; return; }
    var s = document.createElement('script'); s.src = '../assets/watch3d.js?v=7'; s.async = true;
    s.onload = function () {
      try {
        api = window.Ghatika3D.mount(canvas, Object.assign({ mode: 'config', hdr: 'hdri/studio.hdr' }, cfg));
        api.ready.then(function () { stage.classList.add('live'); api.setMode(mode); api.setWrist(+wr.value); if (cfg.engraving) api.setEngraving(cfg.engraving); });
      } catch (e) { stage.classList.add('no3d'); }
    };
    document.head.appendChild(s);
  }
  var EV = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'];
  function kick() { EV.forEach(function (n) { removeEventListener(n, kick); }); boot(); }
  function arm() { EV.forEach(function (n) { addEventListener(n, kick, { once: true, passive: true }); }); stage.addEventListener('pointerenter', kick, { once: true }); setTimeout(kick, coarse ? 3200 : 1800); }
  if (document.readyState === 'complete') arm(); else addEventListener('load', arm);

  paint(); if (q.get('m')) push();
  if (reduce) $('.modes button[data-mode="turntable"]').title = 'Turntable stays still while reduced motion is on';
})();
