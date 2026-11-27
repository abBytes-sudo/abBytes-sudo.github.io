/* Orbit Assistants: small shared runtime for the main page and the trade pages.
     OrbitUI.orb(size)                 the orbit mark (ring and moon) as SVG markup
     OrbitUI.load(srcs)                load scripts in order, once each; returns a Promise
     OrbitUI.patch(chat, bizName)      a mounted chat (Orbit.mount) reads Hinglish and shows the business's own notice
     OrbitUI.nudge(el, text, key, fn)  a one-time hint beside a chat: after 20 s idle, for 8 s, once per session
     OrbitUI.applyColors(c, el)        set the accent variables from { acc, ink, deep, tx, soft }
   Also: section heads reveal like a reply (question, typing dots, answer), and the floating way back tucks away while
   someone types in a chat on a phone. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $$(s, r) { return [].slice.call((r || d).querySelectorAll(s)); }
  function orb(n) { n = n || 22; return '<svg class="orb" width="' + n + '" height="' + n + '" viewBox="0 0 22 22" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="8.2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle class="m" cx="17.2" cy="5.6" r="2.6"/></svg>'; }

  var loaded = {};
  function load(srcs) {
    return srcs.reduce(function (p, src) {
      return p.then(function () {
        if (loaded[src]) return loaded[src];
        loaded[src] = new Promise(function (res, rej) { var s = d.createElement('script'); s.src = src; s.async = false; s.onload = function () { res(); }; s.onerror = function () { rej(new Error('Could not load ' + src)); }; d.head.appendChild(s); });
        return loaded[src];
      });
    }, Promise.resolve());
  }

  /* run fn once the largest thing on screen has painted (or on the first touch, or soon after load) */
  var apQ = [], apDone = false;
  function apFire() { if (apDone) return; apDone = true; var q = apQ; apQ = []; setTimeout(function () { q.forEach(function (f) { try { f(); } catch (e) { if (window.console) console.error(e); } }); }, 30); }
  function afterPaint(fn) { if (apDone) { setTimeout(fn, 0); return; } apQ.push(fn); }
  (function () {
    var got = false;
    try { new PerformanceObserver(function (l, o) { if (got) return; got = true; o.disconnect(); setTimeout(apFire, 60); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
    addEventListener('load', function () { setTimeout(apFire, got ? 60 : 1200); });
    ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(function (t) { addEventListener(t, apFire, { once: true, passive: true }); });
  })();
  function css(href) { return new Promise(function (res) { var l = d.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = l.onerror = function () { res(); }; d.head.appendChild(l); }); }

  function applyColors(c, el) {
    if (!c) return; el = el || root;
    el.style.setProperty('--acc', c.acc); el.style.setProperty('--acc-ink', c.ink); el.style.setProperty('--acc-deep', c.deep); el.style.setProperty('--acc-tx', c.tx); el.style.setProperty('--acc-soft', c.soft);
  }

  /* Hinglish in, English to the engine; the visitor still sees what they typed */
  function patch(chat, bizName) {
    var s = chat && chat.session, H = window.OrbitTrades; if (!s || s.__orbitPatched) return chat; s.__orbitPatched = true;
    if (H && H.hinglish) { var own = s._text; s._text = function (t) { var h = H.hinglish(t); return own.call(this, h.lang === 'Hinglish' ? h.text : t); }; }
    var enc = chat.root && chat.root.querySelector('.ob-enc');
    if (enc) enc.textContent = 'Replies come from ' + (bizName || 'the business') + '’s assistant. A person can join at any time.';
    return chat;
  }

  /* a one-time hint beside a chat */
  function nudge(host, text, key, onTry) {
    if (!host || !text) return;
    try { if (sessionStorage.getItem('orbit-nudge-' + key)) return; } catch (e) {}
    var touched = false, t0 = null, t1 = null, el = null;
    function mark() { try { sessionStorage.setItem('orbit-nudge-' + key, '1'); } catch (e) {} }
    function hide() { clearTimeout(t1); if (el) { el.classList.remove('on'); var x = el; setTimeout(function () { if (x.parentNode) x.parentNode.removeChild(x); }, 400); el = null; } }
    function show() {
      if (touched || el) return; mark();
      el = d.createElement('div'); el.className = 'nudge'; el.setAttribute('role', 'status');
      el.innerHTML = '<button type="button" class="nudge-t"><span>Try typing</span><b></b></button><button type="button" class="nudge-x" aria-label="Dismiss the hint">×</button>';
      el.querySelector('b').textContent = '“' + text + '”';
      el.querySelector('.nudge-t').addEventListener('click', function () { hide(); if (onTry) onTry(text); });
      el.querySelector('.nudge-x').addEventListener('click', hide);
      host.appendChild(el); requestAnimationFrame(function () { if (el) el.classList.add('on'); });
      t1 = setTimeout(hide, 8000);
    }
    function touch() { touched = true; clearTimeout(t0); }
    host.addEventListener('pointerdown', touch, { passive: true }); host.addEventListener('keydown', touch);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { clearTimeout(t0); if (e.isIntersecting && !touched) t0 = setTimeout(show, 20000); }); }, { threshold: 0.5 });
      io.observe(host);
    }
  }

  /* section heads: the question lands, the assistant types, the answer appears */
  var hio = null;
  function heads() {
    var qs = $$('.qh').filter(function (q) { return !q.hasAttribute('data-qh'); }); if (!qs.length) return;
    if (reduce || !('IntersectionObserver' in window)) return;
    root.classList.add('om');
    qs.forEach(function (q) {
      q.setAttribute('data-qh', '');
      if (!q.querySelector('.dots')) { var w = q.querySelector('.who'); var dots = d.createElement('span'); dots.className = 'dots'; dots.setAttribute('aria-hidden', 'true'); dots.innerHTML = '<i></i><i></i><i></i>'; if (w) w.insertAdjacentElement('afterend', dots); }
      var r = q.getBoundingClientRect(); if (r.top < innerHeight * 0.9) return;
      q.classList.add('is-wait');
    });
    if (!hio) hio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; var q = e.target; hio.unobserve(q); if (!q.classList.contains('is-wait')) return;
        q.classList.remove('is-wait'); q.classList.add('is-typing');
        setTimeout(function () { q.classList.remove('is-typing'); }, 420);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    qs.forEach(function (q) { hio.observe(q); });
  }

  /* the floating "back" button steps aside while a chat composer is at the bottom of a phone screen */
  function tuck() {
    var mq = matchMedia('(max-width: 700px)'), tick = false, typing = false;
    function upd() {
      tick = false; if (!mq.matches) { d.body.classList.remove('tuck'); return; }
      var on = typing; if (!on) $$('.ob-in, .cmp, .mt-in').some(function (f) { var r = f.getBoundingClientRect(); if (r.bottom > innerHeight - 96 && r.top < innerHeight) { on = true; return true; } return false; });
      d.body.classList.toggle('tuck', on);
    }
    function req() { if (!tick) { tick = true; requestAnimationFrame(upd); } }
    addEventListener('scroll', req, { passive: true }); addEventListener('resize', req);
    d.addEventListener('focusin', function (e) { if (e.target.closest && e.target.closest('.ob, .cmp, .mt-in')) { typing = true; req(); } });
    d.addEventListener('focusout', function () { typing = false; req(); });
    req();
  }

  /* a section head as an exchange: the customer's question (right), the assistant's answer (left) */
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function qh(q, ts, h2, lede, o) {
    o = o || {};
    return '<header class="qh' + (o.cls ? ' ' + o.cls : '') + '"><div class="qh-q"><p class="bub c">' + esc(q) + '</p><time class="ts">' + esc(ts) + '</time></div><div class="qh-a"><p class="who">' + orb(20) + 'Orbit <time>' + esc(o.ats || ts) + '</time></p><h2' + (o.id ? ' id="' + o.id + '"' : '') + '>' + esc(h2) + '</h2>' + (lede ? '<p class="lede">' + lede + '</p>' : '') + (o.after || '') + '</div></header>';
  }
  window.OrbitUI = { orb: orb, load: load, patch: patch, nudge: nudge, applyColors: applyColors, reduce: reduce, qh: qh, esc: esc, heads: heads, afterPaint: afterPaint, css: css };
  function boot() { heads(); tuck(); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})();
