/* Ghatika product page: the live configurator (three.js, or stacked stills without a graphics card), your time and each model's
   complication, pricing, constraints, delivery estimate, shareable URL. */
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
    if (api) api.set(cfg); else if (still) paintLayers();
  }
  function push() { var u = new URLSearchParams({ m: cfg.model, dial: cfg.dial, metal: cfg.metal, strap: cfg.strap }); if (cfg.engraving) u.set('engr', cfg.engraving); history.replaceState(null, '', '?' + u.toString()); }

  // engraving: live on the caseback, which turns to face you while you type
  var engr = $('#engr'), engrT; engr.value = cfg.engraving;
  function engrCount() { $('#engrN').textContent = engr.value.length + ' of 22 letters · ' + (still ? 'engraved by hand on the caseback ring' : 'shown live on the back'); }
  engr.addEventListener('focus', function () { if ((api || still) && !flipped) toggleFlip(); });
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

  // ---------- your time on the hands, and what this model adds (worked out from your own clock)
  var C = window.GHComp, cx = $('#cX'), cityTz = null;
  var TIP = {
    prahar: 'Counted from a fixed sunrise at 06:00 on your clock: eight prahars of three hours, sixty ghatis of 24 minutes, sixty palas of 24 seconds. In Udaipur the real sunrise moves from about 05:40 in June to 07:15 in January.',
    nimisha: 'A tithi is a lunar day: the time the moon takes to gain twelve degrees on the sun. We work it out here from the approximate positions of the sun and moon, so close to a change it can differ from a printed panchang by half an hour or so.'
  };
  function timeFn() {
    var d = new Date(), o = { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() + d.getMilliseconds() / 1000, run: true };
    if (cityTz) { var c = C.cityTime(cityTz, d.getTime()); o.gh = c.h; o.gm = c.m + c.s / 60; }
    return o;
  }
  function at(d) { // 07:16, 07:16 tomorrow, or Thu 07:16
    var now = new Date(), days = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
    return C.hm(d) + (days === 1 ? ' tomorrow' : days > 1 ? ' on ' + d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : '');
  }
  if (C && cx) {
    if (mid === 'yantra') {
      cityTz = G.store.get('city', C.defaultCity()); if (!C.CITIES.some(function (c) { return c[1] === cityTz; })) cityTz = C.defaultCity();
      cx.innerHTML = '<p class="city"><label for="city">24-hour hand</label><select id="city">' + C.CITIES.map(function (c) { return '<option value="' + c[1] + '"' + (c[1] === cityTz ? ' selected' : '') + '>' + c[0] + '</option>'; }).join('') + '</select><b id="cCity"></b></p>';
      $('#city').addEventListener('change', function (e) { cityTz = e.target.value; G.store.set('city', cityTz); tick(); });
    } else {
      cx.innerHTML = '<p><span id="cMain"></span><button type="button" class="qm" aria-describedby="cTip" aria-expanded="false" aria-label="How we count it">i</button><span class="tip" role="tooltip" id="cTip">' + TIP[mid] + '</span></p>' + (mid === 'nimisha' ? '<p class="cs" id="cSub"></p>' : '');
      var qm = $('.qm', cx), tipOn = function (on) { cx.classList.toggle('tipon', on); qm.setAttribute('aria-expanded', on); };
      qm.addEventListener('click', function (e) { e.stopPropagation(); tipOn(!cx.classList.contains('tipon')); });
      document.addEventListener('click', function () { tipOn(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') tipOn(false); });
    }
  }
  function tick() {
    var d = new Date(); $('#cTime').textContent = C ? C.hm(d) : String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    if (!C || !cx) return;
    if (mid === 'prahar') { var p = C.prahar(d); $('#cMain').textContent = p.name + ' · ghati ' + p.ghati + ', pala ' + p.pala; }
    else if (mid === 'nimisha') { var m = C.moon(d.getTime()); $('#cMain').textContent = m.tithi + ', ' + m.paksha; $('#cSub').textContent = m.phase + ', ' + m.lit + '% lit · ' + m.next + ' from ' + at(m.ends); }
    else if (cityTz) { var c = C.cityTime(cityTz, d.getTime()); $('#cCity').innerHTML = C.pad(c.h) + ':' + C.pad(c.m) + (c.day ? '<small>' + (c.day > 0 ? '+1 day' : '−1 day') + '</small>' : ''); }
  }
  tick(); setInterval(tick, 4000);

  // ---------- the 3D studio
  var stage = $('#stage'), canvas = $('#cfg3d'), api = null, flipped = false, mode = 'studio';
  function setMode(m) {
    mode = m; $$('.modes button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.mode === m); });
    $('#wristbox').hidden = m !== 'wrist'; stage.classList.toggle('wrist', m === 'wrist');
    if (m === 'wrist' && flipped) { flipped = false; $('#flip').setAttribute('aria-pressed', 'false'); if (still) paintLayers(); }
    $('#hint').textContent = still ? '' : m === 'wrist' ? 'Drag to turn your wrist' : m === 'turntable' ? 'Turning slowly · drag to stop' : 'Drag to turn · arrow keys';
    if (api) api.setMode(m); else if (!still) boot();
  }
  $$('.modes button').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); }); });
  function toggleFlip() {
    if (still) { if (mode === 'wrist') setMode('studio'); flipped = !flipped; paintLayers(); }
    else if (!api) { boot(); return; } else { if (mode === 'wrist') setMode('studio'); flipped = api.flip(); } $('#flip').setAttribute('aria-pressed', flipped); $('#flip').setAttribute('aria-label', flipped ? 'Turn it back to the dial' : 'Turn it over to see the movement');
  }
  $('#flip').addEventListener('click', toggleFlip);
  var zk = 1; function zoomStill(k) { zk = Math.min(1.6, Math.max(1, zk * k)); $('.layers', stage).style.setProperty('--z', zk.toFixed(3)); }
  $('#zin').addEventListener('click', function () { if (api) api.zoom(0.85); else if (still) zoomStill(1.18); else boot(); });
  $('#zout').addEventListener('click', function () { if (api) api.zoom(1.18); else if (still) zoomStill(1 / 1.18); else boot(); });
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
    if (!G.gpuOK()) { stills(); return; }
    var s = document.createElement('script'); s.src = '../assets/watch3d.js?v=10'; s.async = true;
    s.onload = function () {
      try {
        api = window.Ghatika3D.mount(canvas, Object.assign({ mode: 'config', hdr: 'hdri/studio.hdr', backdrop: true, timeFn: timeFn, moonAge: C && mid === 'nimisha' ? C.moon().age : undefined }, cfg));
        api.ready.then(function () { stage.classList.add('live'); api.setMode(mode); api.setWrist(+wr.value); if (cfg.engraving) api.setEngraving(cfg.engraving); });
      } catch (e) { api = null; stills(); }
    };
    s.onerror = function () { stills(); };
    document.head.appendChild(s);
  }

  // ---------- without a graphics card: the same studio as three stacked stills (case, dial, strap), so every choice still shows
  var still = false, layerTok = 0;
  function stills() {
    if (still) return; still = true; stage.classList.add('no3d', 'layered'); $('.loadbar').innerHTML = ''; $('#hint').textContent = '';
    canvas.hidden = true; if ($('#cLbl')) $('#cLbl').textContent = 'Your time';
    var box = document.createElement('div'); box.className = 'layers'; box.setAttribute('role', 'img');
    box.innerHTML = '<img class="ly" alt="" decoding="async"><img class="ly" alt="" decoding="async"><img class="ly" alt="" decoding="async">';
    stage.insertBefore(box, canvas); engrCount(); paintLayers();
  }
  function paintLayers() {
    var box = $('.layers', stage); if (!box) return;
    var imgs = $$('.ly', box), b = 'img/cfg/' + mid + '-', tok = ++layerTok, left = 1;
    var src = flipped ? [b + 'back-' + cfg.metal + '.webp', '', ''] : [b + 'case-' + cfg.metal + '.webp', b + 'dial-' + cfg.dial + '.webp', b + 'strap-' + cfg.strap + '-' + cfg.metal + '.webp'];
    box.setAttribute('aria-label', M.name + (flipped ? ', the caseback: ' + G.optName('METALS', cfg.metal) : ': ' + G.cfgLine(cfg)));
    // load what changed first, then swap together, so the watch never shows half a change
    function done() { if (--left || tok !== layerTok) return; src.forEach(function (u, i) { imgs[i].hidden = !u; if (u && imgs[i].getAttribute('src') !== u) imgs[i].src = u; }); stage.classList.add('live'); }
    src.forEach(function (u) { if (!u) return; left++; var im = new Image(); im.onload = im.onerror = done; im.src = u; });
    done();
  }
  var EV = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'];
  function kick() { EV.forEach(function (n) { removeEventListener(n, kick); }); boot(); }
  function arm() { EV.forEach(function (n) { addEventListener(n, kick, { once: true, passive: true }); }); stage.addEventListener('pointerenter', kick, { once: true }); setTimeout(kick, coarse ? 3200 : 1800); }
  if (document.readyState === 'complete') arm(); else addEventListener('load', arm);

  paint(); if (q.get('m')) push();
  if (reduce) $('.modes button[data-mode="turntable"]').title = 'Turntable stays still while reduced motion is on';
})();
