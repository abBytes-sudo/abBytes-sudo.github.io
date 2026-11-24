/* Lumen CRM Pro — product page: a cheap light-leak shader, the live pipeline hero, the pinned tour. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = window.gsap, motion = !reduce && !!G;
  var phone = matchMedia('(max-width: 700px)').matches;

  // ---- shader sky: rendered at ~1/5 resolution and upscaled, 30 fps cap, paused off-screen --------
  function sky() {
    var host = $('.sky'), cv = $('#sky'); if (!cv) return;
    var gl = null; try { gl = cv.getContext('webgl', { antialias: false, depth: false, stencil: false, alpha: false, powerPreference: 'low-power' }); } catch (e) { }
    if (!gl) return;
    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = 'precision mediump float;uniform vec2 r;uniform float t;' +
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}' +
      'void main(){vec2 uv=gl_FragCoord.xy/r;float k=r.x/r.y;vec2 p=vec2(uv.x*k,uv.y);' +
      'float w=n(p*1.7+vec2(t*.05,-t*.04))*.6+n(p*3.3-vec2(t*.03,t*.06))*.4;vec2 q=p+vec2(w*.38,w*.26);' +
      'vec2 a=vec2(k*.74+.12*sin(t*.13),.8+.08*cos(t*.11));vec2 b=vec2(k*.96+.1*cos(t*.09),.4+.1*sin(t*.12));vec2 c=vec2(.12+.1*sin(t*.07),1.02);' +
      'float A=exp(-dot(q-a,q-a)*7.),B=exp(-dot(q-b,q-b)*12.),D=exp(-dot(q-c,q-c)*9.);' +
      'vec3 col=vec3(.043,.051,.071)+vec3(.31,.26,.92)*A*.6+vec3(.95,.58,.2)*B*.3+vec3(.3,.2,.8)*D*.32+vec3(.45,.4,1.)*smoothstep(.6,.95,w)*A*.18;col*=1.-.45*uv.x*(1.-uv.y)*0.;' +
      'gl_FragColor=vec4(col,1.);}';
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    var v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs); if (!v || !f) return;
    var pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uR = gl.getUniformLocation(pr, 'r'), uT = gl.getUniformLocation(pr, 't');
    var scale = phone ? .14 : .2, fps = phone ? 24 : 30, last = 0, t0 = performance.now(), raf = 0, on = true;
    function size() { var w = Math.max(64, Math.min(400, Math.round(host.clientWidth * scale))), h = Math.max(48, Math.round(host.clientHeight * scale)); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); } gl.uniform2f(uR, w, h); }
    function draw(now) { gl.uniform1f(uT, 8 + (now - t0) / 1000); gl.drawArrays(gl.TRIANGLES, 0, 3); }
    function loop(now) { raf = 0; if (!on) return; if (now - last >= 1000 / fps) { last = now; draw(now); } raf = requestAnimationFrame(loop); }
    function play() { if (!raf && on && !reduce) raf = requestAnimationFrame(loop); }
    size(); draw(t0); host.classList.add('gl');
    if (reduce) return;
    new IntersectionObserver(function (es) { on = es[0].isIntersecting && !document.hidden; if (on) play(); }).observe(host);
    document.addEventListener('visibilitychange', function () { on = !document.hidden; if (on) play(); });
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); draw(performance.now()); }, 150); });
    play();
  }

  // ---- scale the app mock to its container ---------------------------------------
  var wrap = $('#mockwrap'), mock = $('#mock'), S = 1;
  function fit() {
    if (!wrap) return; var narrow = wrap.clientWidth < 760; mock.classList.toggle('narrow', narrow);
    var base = narrow ? 900 : 1200; mock.style.width = base + 'px';
    S = Math.min(1, wrap.clientWidth / base); wrap.style.setProperty('--s', S); mock.style.setProperty('--s', S);
  }

  // ---- the live pipeline ---------------------------------------------------------------
  // A scripted 18-second loop on the real board markup: a lead arrives, a drag hits a stage gate and is
  // released, the outcome is logged and the drag succeeds, a deal is won. Every sibling card FLIPs, so nothing jumps.
  var board0 = '', kpi0 = '', loopOn = false, timers = [], cur = null;
  var EASE = 'power3.inOut', OUT = 'expo.out';
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearT() { timers.forEach(clearTimeout); timers = []; }
  function toast(txt, cls) {
    var t = $('#mtoast'); t.className = 'm-toast' + (cls ? ' ' + cls : ''); $('span', t).textContent = txt;
    G.killTweensOf(t); G.fromTo(t, { opacity: 0, y: -8, scale: .98 }, { opacity: 1, y: 0, scale: 1, duration: .5, ease: OUT });
    G.to(t, { opacity: 0, y: -4, duration: .4, delay: 2.6, ease: 'power2.in' });
  }
  function rectIn(el) { var m = $('.m-main', mock).getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: (r.left - m.left) / S, y: (r.top - m.top) / S, w: r.width / S, h: r.height / S }; }
  // FLIP every card except `skip` from its old position after `mutate` has changed the layout
  function flip(mutate, skip) {
    var cards = $$('.m-card', mock), before = cards.map(function (c) { return c.getBoundingClientRect(); });
    mutate();
    cards.forEach(function (c, i) { if (c === skip || !c.isConnected) return; var a = c.getBoundingClientRect(), dx = (before[i].left - a.left) / S, dy = (before[i].top - a.top) / S; if (Math.abs(dx) + Math.abs(dy) < .5) return; G.fromTo(c, { x: dx, y: dy }, { x: 0, y: 0, duration: .75, ease: OUT, clearProps: 'transform' }); });
  }
  function cursorIn(x, y) { G.set(cur, { x: x + 120, y: y + 160, opacity: 0, scale: 1 }); G.to(cur, { opacity: 1, duration: .3 }); return G.to(cur, { x: x, y: y, duration: .9, ease: EASE }); }
  // drag `card` toward the top of `col`; reject=true stops at 55% and eases home (a stage gate said no)
  function drag(card, col, opt) {
    opt = opt || {}; var tl = G.timeline();
    var r0 = rectIn(card), first = $('.m-card', col), gate = $('.m-gate', col), ph = document.createElement('div');
    ph.className = 'm-ph'; ph.style.height = r0.h + 'px'; col.insertBefore(ph, first || null);
    var r1 = rectIn(ph); if (opt.reject) col.removeChild(ph); else G.set(ph, { height: 0, marginBottom: -7 });
    var dx = r1.x - r0.x, dy = r1.y - r0.y, grabX = r0.x + r0.w * .42, grabY = r0.y + r0.h * .45;
    tl.add(cursorIn(grabX, grabY))
      .to(cur, { scale: .86, duration: .14, ease: 'power2.out' })
      .to(card, { scale: 1.035, rotate: 1.2, boxShadow: '0 18px 40px -14px rgba(20,22,30,.45)', zIndex: 6, duration: .22, ease: 'power2.out' }, '<');
    if (opt.reject) {
      tl.to([card, cur], { x: '+=' + dx * .55, y: '+=' + dy * .55, duration: .75, ease: EASE })
        .add(function () {
          if (gate) { G.fromTo(gate, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: .35, ease: OUT }); G.fromTo(gate, { x: 0 }, { keyframes: [{ x: -3 }, { x: 3 }, { x: -2 }, { x: 2 }, { x: 0 }], duration: .42, ease: 'sine.inOut' }); }
          var lk = $('.m-ch .lk', col); if (lk) G.fromTo(lk, { scale: 1 }, { scale: 1.35, duration: .18, yoyo: true, repeat: 1, ease: 'power2.out' });
          if (opt.onBlock) opt.onBlock();
        })
        .to({}, { duration: .55 })
        .to(card, { x: 0, y: 0, rotate: 0, scale: 1, duration: .65, ease: OUT })
        .to(cur, { x: grabX, y: grabY, duration: .65, ease: OUT }, '<')
        .set(card, { clearProps: 'transform,boxShadow,zIndex' })
        .to(cur, { scale: 1, duration: .14 })
        .to(cur, { x: '+=70', y: '+=90', opacity: 0, duration: .6, ease: 'power2.in' }, '+=.2');
    } else {
      tl.to([card, cur], { x: '+=' + dx, y: '+=' + dy, duration: 1.05, ease: EASE })
        .to(ph, { height: r0.h, marginBottom: 0, duration: 1.05, ease: EASE }, '<')
        .to(cur, { scale: 1, duration: .14 })
        .add(function () {
          flip(function () { col.replaceChild(card, ph); G.set(card, { x: 0, y: 0 }); }, card);
          G.to(card, { rotate: 0, scale: 1, duration: .45, ease: OUT, onComplete: function () { G.set(card, { clearProps: 'transform,boxShadow,zIndex' }); } });
          if (opt.onDrop) opt.onDrop();
        })
        .to(cur, { x: '+=60', y: '+=110', opacity: 0, duration: .7, ease: 'power2.in' }, '+=.35');
    }
    return tl;
  }
  function count(el, a, b, fmt, d) { var o = { v: a }; G.to(o, { v: b, duration: d || 1.1, ease: 'power3.out', onUpdate: function () { el.textContent = fmt(o.v); } }); }
  function lakh(v) { return v >= 100 ? '₹' + (v / 100).toFixed(2) + ' Cr' : '₹' + v.toFixed(1) + ' L'; }
  function cnt(col, d) { var s = $('.m-ch span', col); s.textContent = String(+s.textContent + d); }
  function cycle() {
    if (!loopOn) return;
    var B = $('.m-board', mock);
    var q = $('[data-c=q]', B), v = $('[data-c=v]', B), p = $('[data-c=p]', B), n = $('[data-c=n]', B), w = $('[data-c=w]', B);
    // 1 · a WhatsApp lead arrives, is scored, assigned and answered
    later(function () {
      var c = document.createElement('div'); c.className = 'm-card new';
      c.innerHTML = '<b>Kunal Saini</b><span class="v">₹12 L</span><small><i class="av" style="background:#E5F4EC;color:#137A52">W</i>WhatsApp · just now</small><u style="--p:10%"></u><span class="sc">0</span>';
      flip(function () { q.insertBefore(c, $('.m-card', q)); }, c); cnt(q, 1);
      G.fromTo(c, { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: .8, ease: OUT, clearProps: 'transform' });
      toast('New WhatsApp lead · Kunal Saini', 'wa');
      later(function () { count($('.sc', c), 0, 65, function (x) { return String(Math.round(x)); }, 1.2); }, 450);
      later(function () { var o = document.createElement('span'); o.className = 'own'; o.textContent = 'MJ'; c.appendChild(o); G.fromTo(o, { scale: .4, opacity: 0 }, { scale: 1, opacity: 1, duration: .55, ease: OUT }); toast('Workflow ran · assigned to Meera · first reply sent in 0:42'); }, 1900);
      later(function () { c.classList.remove('new'); }, 3600);
    }, 700);
    // 2 · a drag into Proposal is refused by the stage gate
    later(function () { drag($('#gc', B), p, { reject: true, onBlock: function () { toast('Locked · Proposal needs the site-visit outcome'); } }); }, 4600);
    // 3 · the outcome is logged, then the drag succeeds
    later(function () { G.to($('#gchip', B), { opacity: 1, y: 0, duration: .5, ease: OUT }); G.to($('#gate', B), { opacity: 0, duration: .4 }); toast('Site-visit outcome logged · Measured — client keen', 'ok'); }, 8100);
    later(function () { drag($('#gc', B), p, { onDrop: function () { cnt(v, -1); cnt(p, 1); $('u', $('#gc', B)).style.setProperty('--p', '60%'); toast('Gate passed · moved to Proposal'); } }); }, 9300);
    // 4 · a negotiation is dragged to Won; stock is reserved
    later(function () {
      drag($('#wc', B), w, { onDrop: function () {
        cnt(n, -1); cnt(w, 1); $('u', $('#wc', B)).style.setProperty('--p', '100%');
        G.fromTo($('.m-ch', w), { backgroundColor: 'rgba(31,157,87,.22)' }, { backgroundColor: 'rgba(31,157,87,0)', duration: 1.6, ease: 'power2.out' });
        count($('#k-won'), 56.4, 85.1, lakh); count($('#k-open'), 222, 193.3, lakh);
        toast('Won ₹28.7 L · 54 units reserved in Stockroom', 'ok');
      } });
    }, 12300);
    // 5 · fade, reset, go again
    later(function () {
      var K = $('.m-kpis', mock);
      G.to([B, K], { opacity: 0, duration: .6, ease: 'power2.in', onComplete: function () { B.innerHTML = board0; K.innerHTML = kpi0; G.to([B, K], { opacity: 1, duration: .6, ease: 'power2.out' }); later(cycle, 700); } });
    }, 17400);
  }
  function hero() {
    if (!mock) return;
    fit(); var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(fit, 120); });
    if (!motion) return;
    cur = $('#mcur'); board0 = $('.m-board', mock).innerHTML; kpi0 = $('.m-kpis', mock).innerHTML;
    G.from(mock, { y: 60, opacity: 0, duration: 1.4, ease: OUT, delay: .45 });
    function stop() { loopOn = false; clearT(); G.killTweensOf('#mock *'); G.killTweensOf(cur); $('.m-board', mock).innerHTML = board0; $('.m-kpis', mock).innerHTML = kpi0; G.set(['#mtoast', cur], { opacity: 0 }); G.set([$('.m-board', mock), $('.m-kpis', mock)], { opacity: 1 }); }
    function visible() { var r = wrap.getBoundingClientRect(); return r.top < innerHeight * .8 && r.bottom > innerHeight * .2; }
    new IntersectionObserver(function (es) {
      var vis = es[0].isIntersecting;
      if (vis && !loopOn && !document.hidden) { loopOn = true; later(cycle, 500); }
      else if (!vis && loopOn) stop();
    }, { threshold: .25 }).observe(wrap);
    document.addEventListener('visibilitychange', function () { if (document.hidden) { if (loopOn) stop(); } else if (!loopOn && visible()) { loopOn = true; later(cycle, 500); } });
  }

  // ---- tour -----------------------------------------------------------------------------
  function tour() {
    var chs = $$('.ch'), panels = $$('#stage .panel'), mq = matchMedia('(max-width: 1000px)'), cur = -1;
    function show(i) {
      if (i === cur) return; cur = i;
      chs.forEach(function (c, k) { c.classList.toggle('on', k === i); });
      panels.forEach(function (p, k) { p.classList.toggle('on', k === i); });
      var t = $('#fb-t'); if (t && panels[i]) t.textContent = panels[i].dataset.t;
      $$('#fb-p b').forEach(function (d, k) { d.classList.toggle('on', k <= i); });
      if (panels[i] && panels[i].querySelector('.pw')) pwRun();
    }
    function layout() {
      if (mq.matches) panels.forEach(function (p, k) { var s = $('.ch-slot', chs[k]); if (s && p.parentNode !== s) s.appendChild(p); });
      else { var box = $('#stage .panels'); panels.forEach(function (p) { if (p.parentNode !== box) box.appendChild(p); }); cur = -1; show(0); }
    }
    layout(); if (mq.addEventListener) mq.addEventListener('change', layout);
    var io = new IntersectionObserver(function (es) { if (mq.matches) return; es.forEach(function (e) { if (e.isIntersecting) show(+e.target.dataset.p); }); }, { rootMargin: '-45% 0px -45% 0px' });
    chs.forEach(function (c) { io.observe(c); });
    if (mq.matches) { var io2 = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && e.target.querySelector('.pw')) pwRun(); }); }, { threshold: .5 }); chs.forEach(function (c) { io2.observe(c); }); }
  }
  function pwRun() {
    var d = $('#pwdot'); if (!d || !motion) return; var ol = $('.pw', d.parentNode), lis = $$('li', ol), last = lis[lis.length - 1];
    G.killTweensOf(d); G.set(d, { opacity: 1, y: 0 });
    G.to(d, { y: last.offsetTop + 2, duration: 2.2, ease: 'power1.inOut', delay: .3, onComplete: function () { G.to(d, { opacity: 0, duration: .4 }); } });
    lis.forEach(function (li, i) { G.fromTo($('i', li), { boxShadow: '0 0 0 0 rgba(79,70,229,.5)' }, { boxShadow: '0 0 0 8px rgba(79,70,229,0)', duration: .7, delay: .3 + i * .42, clearProps: 'boxShadow' }); });
  }
  // live reply timers in the tour
  function ticks() {
    var T = $$('[data-tick]'); if (!T.length) return;
    setInterval(function () {
      if (document.hidden) return;
      T.forEach(function (el) {
        var s = +el.dataset.tick + 1; el.dataset.tick = s; var m = Math.floor(s / 60), ss = s % 60;
        el.textContent = (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss;
        el.classList.remove('ok', 'risk', 'bad'); el.classList.add(s < 450 ? 'ok' : s < 900 ? 'risk' : 'bad');
        if (el.parentNode.classList.contains('sla')) { var b = $('#slabar'); if (b) { b.style.width = Math.min(100, s / 9) + '%'; b.style.background = s < 450 ? '#1F9D57' : s < 900 ? '#E0A02A' : '#C0293C'; } }
        if (s > 1500) el.dataset.tick = s - 1400;
      });
    }, 1000);
  }

  // ---- tracking loop: a packet carries one lead round the attribution loop; each node lights in turn ----
  // The <ol> is the diagram (and its text alternative). Geometry is read from the port dots, so the same
  // code drives the desktop stadium track and the vertical rail on phones. Only transform and opacity animate.
  function tracking() {
    var dia = $('#tl-dia'); if (!dia) return;
    var ol = $('.tl-steps', dia), lis = $$('.tl-step', ol), pk = $('.tl-pk', dia), pay = $('.tl-pay', dia);
    if (!motion || !pk || lis.length !== 7) { dia.classList.add('static'); return; }
    dia.classList.add('live');
    var PAY = ['click · fbclid=IwAR2xk9…', 'Pixel · Lead · event_id=lead_7f3a2c', 'Lead L-3107 · utm_source=meta · fbclid saved',
      'Contacted → Site visit → Quote', 'Won · D-2044 · ₹6,80,000', 'Conversions API · Purchase · ₹6,80,000 · em, ph hashed', 'Meta · value-based bidding · ROAS 25.6×'];
    var o = { s: 0 }, geo = null, tl = null, seen = false;
    function port(li) { var p = $('.tl-port', li); return { x: ol.offsetLeft + li.offsetLeft + p.offsetLeft + p.offsetWidth / 2, y: ol.offsetTop + li.offsetTop + p.offsetTop + p.offsetHeight / 2 }; }
    function measure() {
      var P = lis.map(port);
      if (Math.abs(P[1].x - P[0].x) < 4) { // vertical rail
        var x = P[0].x, y0 = P[0].y, sv = P.map(function (p) { return p.y - y0; });
        return { s: sv, end: sv[6] + 40, at: function (d) { return { x: x, y: y0 + d }; } };
      }
      // stadium: top edge through ports 1–4, right half-circle, bottom edge through ports 5–7, left half-circle
      var T = P[0].y, B = P[4].y, r = (B - T) / 2, L = ol.offsetLeft, R = L + ol.offsetWidth, x1 = P[0].x;
      var xr = R - r, xl = L + r, a = xr - x1, arc = Math.PI * r, b = xr - xl, total = a + arc + b + arc + (x1 - xl);
      var s = P.map(function (p, i) { return i < 4 ? p.x - x1 : a + arc + (xr - p.x); });
      return { s: s, end: total, at: function (d) {
        if (d <= a) return { x: x1 + d, y: T };
        d -= a; if (d <= arc) { var t = d / r - Math.PI / 2; return { x: xr + r * Math.cos(t), y: T + r + r * Math.sin(t) }; }
        d -= arc; if (d <= b) return { x: xr - d, y: B };
        d -= b; if (d <= arc) { var u = d / r + Math.PI / 2; return { x: xl + r * Math.cos(u), y: T + r + r * Math.sin(u) }; }
        d -= arc; return { x: xl + d, y: T };
      } };
    }
    function put() { var p = geo.at(o.s); pk.style.transform = 'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0)'; }
    function light(i) {
      lis.forEach(function (li, k) { li.classList.toggle('on', k === i); li.classList.toggle('was', i >= 0 && k < i); });
      if (!pay) return;
      if (i < 0) { G.to(pay, { opacity: 0, duration: .3 }); return; }
      pay.textContent = PAY[i]; G.fromTo(pay, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: .45, ease: OUT });
    }
    function dur(d) { return Math.max(.55, Math.min(1.6, d / 380)); }
    function build() {
      if (tl) tl.kill();
      geo = measure(); o.s = 0; put(); light(-1); G.set(pk, { opacity: 0 });
      tl = G.timeline({ repeat: -1, repeatDelay: .5, paused: !seen });
      tl.set(o, { s: 0 }).call(put).to(pk, { opacity: 1, duration: .35 }).call(light, [0]).to({}, { duration: 1.4 });
      for (var i = 1; i < 7; i++) {
        tl.to(o, { s: geo.s[i], duration: dur(geo.s[i] - geo.s[i - 1]), ease: 'power2.inOut', onUpdate: put })
          .call(light, [i]).to({}, { duration: i === 4 ? 1.7 : 1.4 });
      }
      tl.to(o, { s: geo.end, duration: dur(geo.end - geo.s[6]), ease: 'power2.inOut', onUpdate: put })
        .to(pk, { opacity: 0, duration: .35 }).call(light, [-1]);
    }
    var rt; function rebuild() { clearTimeout(rt); rt = setTimeout(build, 150); }
    build();
    if (window.ResizeObserver) new ResizeObserver(rebuild).observe(ol); else addEventListener('resize', rebuild);
    new IntersectionObserver(function (es) {
      seen = es[0].isIntersecting; dia.classList.toggle('run', seen);
      if (tl) { if (seen) tl.play(); else tl.pause(); }
    }, { rootMargin: '-10% 0px -10% 0px' }).observe(dia);
  }

  // ---- the Lumen Homes design desk (shared Orbit engine, loaded on first use) -------------------------------------------
  function assistant() {
    var btn = document.getElementById('lx-launch'), box = document.getElementById('lx-chat'), body = document.getElementById('lx-body'), nudge = document.getElementById('lx-nudge');
    if (!btn || !box) return;
    var loaded = false, loading = false, chat = null, ch = 'web', opener = null, waits = [];
    function section() { var y = innerHeight * .4, out = ''; ['tracking', 'assistant', 'pricing'].forEach(function (id) { var s = document.getElementById(id); if (s) { var r = s.getBoundingClientRect(); if (r.top < y && r.bottom > y) out = id; } }); return out; }
    function load(cb) {
      if (loaded) { cb(); return; } waits.push(cb); if (loading) return; loading = true;
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '../assets/bots/bots.css'; document.head.appendChild(l);
      ['../assets/bots/engine.js', '../assets/bots/ui.js', '../assets/bots/agents/lumen.js'].forEach(function (src, i, a) { var s = document.createElement('script'); s.src = src; s.async = false; if (i === a.length - 1) s.onload = function () { loaded = true; var w = waits; waits = []; w.forEach(function (f) { f(); }); }; document.head.appendChild(s); });
    }
    function mount() { if (chat) chat.destroy(); chat = window.Orbit.mount(body, { agent: 'lumen', channel: ch, mode: 'inline', source: ch === 'whatsapp' ? 'WhatsApp' : 'Website chat', context: { section: section(), from: ch === 'whatsapp' ? 'web' : '' } }); box.classList.toggle('wa', ch === 'whatsapp'); }
    function open() {
      opener = document.activeElement; box.hidden = false; btn.setAttribute('aria-expanded', 'true'); document.body.classList.add('lx-on'); if (nudge) nudge.hidden = true;
      if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.fromTo(box, { opacity: 0, y: 14, scale: .96, transformOrigin: '100% 100%' }, { opacity: 1, y: 0, scale: 1, duration: .32, ease: 'power3.out' });
      load(function () { if (!chat) mount(); setTimeout(function () { var i = box.querySelector('input,textarea'); if (i) i.focus(); }, 60); });
    }
    function close() { box.hidden = true; btn.setAttribute('aria-expanded', 'false'); document.body.classList.remove('lx-on'); (opener && document.contains(opener) ? opener : btn).focus(); }
    btn.addEventListener('click', function () { if (box.hidden) open(); else close(); });
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-assist-open]')) { e.preventDefault(); open(); }
      else if (e.target.closest('[data-assist-close]')) close();
      else if (e.target.closest('[data-assist-wa]')) { ch = ch === 'web' ? 'whatsapp' : 'web'; e.target.closest('[data-assist-wa]').textContent = ch === 'web' ? 'Continue on WhatsApp' : 'Back to web chat'; load(mount); }
      else if (e.target.closest('[data-nudge-x]')) { nudge.hidden = true; }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !box.hidden) close(); });
    // warm the engine when the browser is idle, so the first click opens instantly (after the page has settled)
    var warm = function () { ['pointerdown', 'keydown', 'scroll'].forEach(function (ev) { removeEventListener(ev, warm); }); setTimeout(function () { (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(function () { load(function () { }); }); }, 1500); };
    ['pointerdown', 'keydown', 'scroll'].forEach(function (ev) { addEventListener(ev, warm, { passive: true, once: true }); });
    // one gentle nudge per session, after 20 s
    var seen = false; try { seen = sessionStorage.getItem('lx-nudge') === '1'; } catch (e) { }
    if (nudge && !seen) setTimeout(function () { if (!box.hidden) return; nudge.hidden = false; try { sessionStorage.setItem('lx-nudge', '1'); } catch (e) { } if (window.gsap) gsap.fromTo(nudge, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .3 }); }, 20000);
    if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.fromTo(btn, { opacity: 0, y: 18, scale: .9 }, { opacity: 1, y: 0, scale: 1, duration: .5, delay: 1.2, ease: 'back.out(1.6)' });
  }

  function init() { sky(); hero(); tour(); ticks(); tracking(); assistant(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
