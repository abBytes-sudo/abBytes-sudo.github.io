/* Forge: shared page chrome — header, menu, lazy video, toast, segmented controls, skeletons, inline validation. */
(function () {
  'use strict';
  var F = window.Forge = window.Forge || {};
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  F.reduce = reduce;
  F.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  F.ICON = {
    arrow: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
    tick: '<svg class="tick" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5"/></svg>',
    empty: '<svg viewBox="0 0 56 56" aria-hidden="true"><rect x="8" y="12" width="40" height="36"/><path d="M8 22h40M18 8v8M38 8v8M20 34h16"/></svg>',
    bell: '<svg viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="30" r="14"/><path d="M28 16V8M20 8h16M28 30l6-6"/></svg>'
  };

  /* header: solid after the hero edge, hides while scrolling down, returns on scroll up */
  var hdr = $('#hdr'), lastY = scrollY;
  if (hdr) {
    var onScroll = function () {
      var y = scrollY, menuOpen = $('#menu') && !$('#menu').hidden;
      hdr.classList.toggle('solid', y > 40);
      if (!menuOpen && !document.body.classList.contains('pinning')) hdr.classList.toggle('away', y > 600 && y > lastY + 4);
      if (y < lastY - 4) hdr.classList.remove('away');
      lastY = y;
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    hdr.addEventListener('focusin', function () { hdr.classList.remove('away'); });
  }

  var mb = $('#mbtn'), menu = $('#menu');
  if (mb && menu) {
    var setOpen = function (o) { menu.hidden = !o; mb.setAttribute('aria-expanded', String(o)); mb.textContent = o ? 'Close' : 'Menu'; document.body.style.overflow = o ? 'hidden' : '';
      if (window.Motion && Motion.lenis) { o ? Motion.lenis.stop() : Motion.lenis.start(); } if (o) { var a = $('a', menu); if (a) a.focus(); } };
    mb.addEventListener('click', function () { setOpen(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setOpen(false); mb.focus(); } });
  }

  /* run fn after the load event, then 2.5 s, then an idle moment. Skipped entirely on Save-Data or 2G/3G (the poster stays). */
  F.afterLoad = function (fn) {
    var c = navigator.connection; if (c && (c.saveData || /(^|-)(2g|3g)$/.test(c.effectiveType || ''))) return;
    var idle = function () { (window.requestIdleCallback || function (cb) { setTimeout(cb, 1); })(fn, { timeout: 2000 }); };
    var go = function () { setTimeout(idle, 2500); };
    if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
  };
  /* lazy videos: load near the viewport, play only while visible */
  F.watchVideos = function (root) {
    var vids = $$('video.lazyv', root);
    var load = function (v) { if (!v.getAttribute('src')) { v.addEventListener('playing', function () { v.classList.add('on'); }, { once: true }); var sm = v.getAttribute('data-src-sm'); v.src = (sm && innerWidth < 700) ? sm : v.getAttribute('data-src'); } };
    if (!('IntersectionObserver' in window)) { vids.forEach(function (v) { load(v); if (!reduce) v.play(); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { var v = e.target;
      if (e.isIntersecting) { load(v); if (!reduce && !v.hasAttribute('data-manual')) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } } else v.pause(); }); }, { rootMargin: '250px 0px' });
    var now = vids.filter(function (v) { return !v.hasAttribute('data-defer'); }), later = vids.filter(function (v) { return v.hasAttribute('data-defer'); });
    now.forEach(function (v) { io.observe(v); });
    /* hero videos wait for the page to finish loading and for an idle moment, so the poster is the LCP and the video never competes with it */
    if (later.length) F.afterLoad(function () { later.forEach(function (v) { io.observe(v); }); });
  };
  F.watchVideos();

  var tEl = $('#toast'), tT;
  F.toast = function (html) { if (!tEl) return; tEl.innerHTML = '<span>' + html + '</span>'; tEl.classList.add('on'); clearTimeout(tT); tT = setTimeout(function () { tEl.classList.remove('on'); }, 5600); };

  /* segmented controls: a sliding indicator follows the active button */
  F.seg = function (seg) {
    if (!seg) return;
    var ind = $('.ind', seg); if (!ind) { ind = document.createElement('i'); ind.className = 'ind'; ind.setAttribute('aria-hidden', 'true'); seg.insertBefore(ind, seg.firstChild); }
    var move = function () { var on = $('button.on', seg); if (!on) return; ind.style.setProperty('--x', on.offsetLeft + 'px'); ind.style.setProperty('--w', on.offsetWidth + 'px'); };
    move(); seg._move = move;
    if ('ResizeObserver' in window) new ResizeObserver(move).observe(seg);
    if (document.fonts) document.fonts.ready.then(move);
  };
  F.segSet = function (seg, btn) { $$('button', seg).forEach(function (b) { var on = b === btn; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); if (seg._move) seg._move(); };
  $$('.seg').forEach(F.seg);

  /* skeleton rows */
  F.skeleton = function (n) { var s = ''; for (var i = 0; i < n; i++) s += '<div class="sk-row" aria-hidden="true"><span class="sk t"></span><span><span class="sk c" style="display:block"></span><span class="sk" style="display:block;width:40%;margin-top:10px"></span></span><span class="sk"></span><span class="sk b"></span></div>'; return s; };

  /* human validation */
  F.check = {
    name: function (v) { v = v.trim(); if (!v) return 'What should the coach call you?'; if (v.length < 2) return 'A little more than one letter, please.'; if (/\d/.test(v)) return 'That looks like a number. We just need your name here.'; return ''; },
    phone: function (v) {
      var d = v.replace(/\D/g, ''); if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2); if (d.length === 11 && d[0] === '0') d = d.slice(1);
      if (!d) return 'We need a number to confirm your slot on WhatsApp.';
      if (d.length < 10) return 'That’s ' + d.length + ' digit' + (d.length === 1 ? '' : 's') + '. An Indian mobile number has 10.';
      if (d.length > 10) return 'That’s ' + d.length + ' digits, a few too many. Try just the 10-digit mobile number.';
      if (!/^[6-9]/.test(d)) return 'Indian mobile numbers start with 6, 7, 8 or 9. Mind checking that one?';
      return '';
    }
  };
  /* attach live validation to a label.fld wrapper: validates on blur, clears as soon as it's fixed */
  F.field = function (wrap, fn) {
    if (!wrap) return function () { return true; };
    var input = $('input, textarea, select', wrap), msg = $('.msg', wrap), touched = false;
    var run = function (show) { var m = fn(input.value); if (show) { wrap.classList.toggle('bad', !!m); wrap.classList.toggle('ok', !m && input.value.trim() !== ''); msg.textContent = m; input.setAttribute('aria-invalid', m ? 'true' : 'false'); } return !m; };
    input.addEventListener('blur', function () { if (input.value.trim()) { touched = true; run(true); } });
    input.addEventListener('input', function () { if (touched || wrap.classList.contains('bad')) run(true); });
    return function () { touched = true; return run(true); };
  };
})();
