/* Aaranya Residences · shared site behaviour: header, menu, toasts, form validation, the sun widget, lead capture. */
(function () {
  'use strict';
  var A = window.AAR;
  var $ = A.$ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = A.$$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  A.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  A.coarse = matchMedia('(pointer: coarse)').matches;
  A.qs = function (k) { return new URLSearchParams(location.search).get(k); };

  /* ---------- header ---------- */
  var hdr = $('.hdr');
  if (hdr && !hdr.classList.contains('always')) {
    var hero = $('.hero');
    var check = function () {
      var past = hero ? hero.getBoundingClientRect().bottom < 90 : scrollY > 8;
      hdr.classList.toggle('solid', past);
    };
    addEventListener('scroll', check, { passive: true }); check();
  }
  /* ---------- mobile menu ---------- */
  var mbtn = $('#mbtn'), menu = $('#menu');
  if (mbtn && menu) {
    var close = function () { menu.hidden = true; mbtn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; mbtn.focus(); };
    mbtn.addEventListener('click', function () { menu.hidden = false; mbtn.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; var f = menu.querySelector('a,button'); f && f.focus(); });
    menu.addEventListener('click', function (e) { if (e.target.closest('.menu-x')) close(); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) close(); });
  }
  /* ---------- toasts ---------- */
  var tbox;
  A.toast = function (msg, action, ms) {
    if (!tbox) { tbox = document.createElement('div'); tbox.className = 'toasts'; tbox.setAttribute('role', 'status'); tbox.setAttribute('aria-live', 'polite'); document.body.appendChild(tbox); }
    var t = document.createElement('div'); t.className = 'toast'; t.innerHTML = '<span>' + msg + '</span>';
    if (action) { var b = document.createElement('button'); b.type = 'button'; b.textContent = action.label; b.addEventListener('click', function () { action.fn(); kill(); }); t.appendChild(b); }
    tbox.appendChild(t);
    var timer = setTimeout(kill, ms || 4800);
    function kill() { clearTimeout(timer); t.classList.add('out'); setTimeout(function () { t.remove(); }, 320); }
    return kill;
  };
  /* ---------- forms: human validation ---------- */
  var MSG = {
    name: 'Please tell us your name, so the relationship manager knows who to ask for.',
    email: 'That email looks incomplete. Something like name@example.com.',
    phone: 'We need a number we can call back on (at least 8 digits).',
    consent: 'Please tick this so we are allowed to contact you.',
    required: 'This one is needed.'
  };
  A.validate = function (form) {
    var ok = true, first = null;
    $$('.field', form).forEach(function (f) { f.classList.remove('err'); var m = $('.msg', f); if (m) m.textContent = ''; });
    $$('[required]', form).forEach(function (inp) {
      var v = inp.type === 'checkbox' ? inp.checked : String(inp.value || '').trim(), bad = !v, key = inp.dataset.v || inp.name;
      if (!bad && inp.type === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      if (!bad && inp.dataset.v === 'phone') bad = String(v).replace(/\D/g, '').length < 8;
      if (!bad && inp.dataset.v === 'name') bad = v.length < 2;
      if (bad) {
        ok = false; first = first || inp;
        var lb = inp.closest('label'), f = inp.closest('.field') || (lb && lb.nextElementSibling && lb.nextElementSibling.classList.contains('field') ? lb.nextElementSibling : null); if (f) { f.classList.add('err'); var m = $('.msg', f); if (m) m.textContent = MSG[key] || MSG.required; }
        inp.setAttribute('aria-invalid', 'true');
      } else inp.removeAttribute('aria-invalid');
    });
    if (first) first.focus();
    return ok;
  };
  A.formData = function (form) { var o = {}; new FormData(form).forEach(function (v, k) { o[k] = v; }); return o; };
  A.busy = function (btn, on) { if (!btn) return; btn.classList.toggle('busy', on); btn.disabled = on; };

  /* ---------- sun widget (home hero + picker) ---------- */
  A.SEASONS = { dec: 'Dec 21', mar: 'Mar 20', jun: 'Jun 21' };
  A.fmtHour = function (h) { var hh = Math.floor(h), mm = Math.round((h - hh) * 60); if (mm === 60) { hh++; mm = 0; } return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); };
  A.sunWidget = function (box, getApi, o) {
    o = o || {};
    var range = $('input[type=range]', box), out = $('output', box), segs = $$('.seg button', box);
    var state = { t: o.hour != null ? o.hour : +range.value, s: 'mar', user: false };
    range.value = Math.max(5.5, Math.min(19.5, state.t));
    function paint() { out.textContent = A.fmtHour(state.t); range.setAttribute('aria-valuetext', A.fmtHour(state.t) + ' on ' + A.SEASONS[state.s]); }
    range.addEventListener('input', function () { state.t = +range.value; state.user = true; paint(); var api = getApi(); if (api) api.setTime(state.t); if (A.applyHour) A.applyHour(state.t); o.onChange && o.onChange(state); });
    segs.forEach(function (b) {
      b.addEventListener('click', function () {
        segs.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        state.s = b.dataset.s; paint(); var api = getApi(); if (api) api.setSeason(state.s); o.onChange && o.onChange(state);
      });
    });
    paint();
    return {
      state: state,
      set: function (t) { if (state.user) return; state.t = t; range.value = Math.max(5.5, Math.min(19.5, t)); paint(); var api = getApi(); if (api) api.setTime(t); if (A.applyHour) A.applyHour(t, false); },
      apply: function (api) { api.setSeason(state.s); api.setTime(state.t); }
    };
  };

  /* ---------- 3D loader (shared): load after first paint, phones wait for a gesture ---------- */
  A.load3D = function (cb, o) {
    o = o || {};
    if (!window.WebGLRenderingContext) return;
    var done = false;
    function go() {
      if (done) return; done = true; EV.forEach(function (n) { removeEventListener(n, go); });
      if (window.Aaranya3D) return cb();
      var s = document.createElement('script'); s.src = '../assets/launch3d.js?v=' + (A.V3D || 1); s.async = true; s.onload = function () { cb(); }; document.head.appendChild(s);
    }
    var EV = ['pointerdown', 'pointermove', 'scroll', 'keydown', 'wheel', 'touchstart'];
    function arm() { EV.forEach(function (n) { addEventListener(n, go, { once: true, passive: true }); }); setTimeout(go, o.delay || (A.coarse ? 3200 : 3500)); }
    if (document.readyState === 'complete') arm(); else addEventListener('load', arm);
  };

  /* ---------- lead capture used by brochure, cost sheet and NRI forms ---------- */
  A.bindLead = function (form, o) {
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!A.validate(form)) return;
      var btn = $('button[type=submit]', form); A.busy(btn, true);
      var d = A.formData(form);
      setTimeout(function () {
        var lead = A.addLead({ name: d.name, email: d.email, phone: (d.cc ? d.cc + ' ' : '') + (d.phone || ''), city: d.city || '', source: o.source, interest: d.interest || null, budget: d.budget || null, unit: d.unit || o.unit || null, nri: !!d.nri || o.nri, message: d.message || '' });
        A.busy(btn, false);
        o.done && o.done(lead, d);
      }, 650);
    });
  };

  /* ---------- small things ---------- */
  $$('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });
  // prefill unit / interest from the URL on any form
  var unitQ = A.qs('unit');
  if (unitQ && A.unit(unitQ)) $$('input[name=unit]').forEach(function (i) { i.value = unitQ; });
  // legal + long pages: highlight the section in view
  var sn = $$('[data-secnav] a');
  if (sn.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) sn.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); }); }); }, { rootMargin: '-30% 0px -60% 0px' });
    sn.forEach(function (a) { var t = $(a.getAttribute('href')); if (t) io.observe(t); });
  }
  // live availability counters anywhere on the site
  function counts() {
    $$('[data-avail]').forEach(function (el) {
      var k = el.dataset.avail, f = k === 'all' ? null : function (u) { return k.length === 1 ? u.type === k || u.tower === k : true; };
      if (k.indexOf('T:') === 0) { var t = k.slice(2); f = function (u) { return u.tower === t; }; }
      if (k.indexOf('Y:') === 0) { var y = k.slice(2); f = function (u) { return u.type === y; }; }
      el.textContent = A.counts(f).avail;
    });
    $$('[data-from]').forEach(function (el) { var m = A.minPrice(el.dataset.from); el.textContent = m ? A.inr(m) : 'Sold out'; });
  }
  A.refreshCounts = counts; counts(); A.on('inv', counts);
})();
