/* Sthira Design-Build (fictional) · shared behaviour for every page: header, menu, toasts, local store,
   before/after sliders, reveal-on-scroll, form validation and the enquiry inbox the back office reads. */
(function () {
  'use strict';
  var D = window.STHIRA || {};
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  // ---------- storage (localStorage only, always wrapped) ----------
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('sthira:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('sthira:' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem('sthira:' + k); } catch (e) { /* ignore */ } },
  };

  // ---------- toasts ----------
  function toast(msg, opt) {
    opt = opt || {};
    var box = $('#toasts'); if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.className = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
    var s = document.createElement('span'); s.innerHTML = msg; t.appendChild(s);
    if (opt.action) { var b = document.createElement('button'); b.type = 'button'; b.textContent = opt.action; b.addEventListener('click', function () { opt.onAction && opt.onAction(); t.remove(); }); t.appendChild(b); }
    box.appendChild(t);
    setTimeout(function () { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 400); }, opt.ms || 4200);
    return t;
  }

  // ---------- escaping + formatting ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function date(s, withTime) {
    var d = s instanceof Date ? s : new Date(s); if (isNaN(d)) return '';
    var out = d.getDate() + ' ' + MONTHS[d.getMonth()] + (d.getFullYear() !== 2026 ? ' ' + d.getFullYear() : '');
    if (withTime) { var h = d.getHours(), m = d.getMinutes(); out += ', ' + ((h % 12) || 12) + (m ? ':' + String(m).padStart(2, '0') : '') + (h < 12 ? ' am' : ' pm'); }
    return out;
  }
  // the demo runs on a fixed "today" so the seeded data always reads correctly
  var NOW = new Date('2026-11-24T10:30:00');
  function rel(s) {
    var d = new Date(s), m = Math.round((d - NOW) / 60000), a = Math.abs(m);
    if (a < 2) return 'just now';
    var t = a < 60 ? a + ' min' : a < 1440 ? Math.round(a / 60) + ' h' : Math.round(a / 1440) + ' d';
    return m < 0 ? t + ' ago' : 'in ' + t;
  }

  // ---------- header: hide on scroll down, show on scroll up ----------
  var hdr = $('#hdr'), lastY = scrollY;
  if (hdr) addEventListener('scroll', function () {
    var y = scrollY, open = document.body.classList.contains('menu-open');
    if (!open) hdr.classList.toggle('hide', y > 240 && y > lastY + 2);
    if (y < lastY - 2 || y < 240) hdr.classList.remove('hide');
    lastY = y;
  }, { passive: true });

  // ---------- mobile menu ----------
  var mb = $('#mbtn'), menu = $('#menu');
  function setMenu(on) {
    if (!menu) return;
    menu.hidden = !on; mb.setAttribute('aria-expanded', on); mb.textContent = on ? 'Close' : 'Menu';
    document.body.classList.toggle('menu-open', on); document.documentElement.style.overflow = on ? 'hidden' : '';
    if (window.Motion && Motion.lenis) on ? Motion.lenis.stop() : Motion.lenis.start();
    if (on) { var f = menu.querySelector('a'); f && f.focus(); }
  }
  if (mb) mb.addEventListener('click', function () { setMenu(menu.hidden); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu && !menu.hidden) { setMenu(false); mb.focus(); } });

  // ---------- before / after slider ----------
  function initBA(el) {
    var range = el.querySelector('input[type=range]');
    function set(v) { v = Math.max(0, Math.min(100, v)); el.style.setProperty('--x', v + '%'); if (range) range.value = Math.round(v); }
    var drag = false;
    function fromEvt(e) { var r = el.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100); }
    el.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch') return; drag = true; el.setPointerCapture(e.pointerId); fromEvt(e); });
    el.addEventListener('pointermove', function (e) { if (drag) fromEvt(e); });
    el.addEventListener('pointerup', function () { drag = false; });
    // touch: horizontal drag only, vertical scroll still scrolls the page
    var sx = 0, sy = 0, lock = null;
    el.addEventListener('touchstart', function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; lock = null; }, { passive: true });
    el.addEventListener('touchmove', function (e) {
      var t = e.touches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (lock == null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (lock === 'x') { e.preventDefault(); fromEvt(t); }
    }, { passive: false });
    if (range) range.addEventListener('input', function () { set(+range.value); });
    // a small hint sweep the first time it comes into view
    if (!reduce && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; io.disconnect();
        var start = performance.now(), from = parseFloat(getComputedStyle(el).getPropertyValue('--x')) || 50;
        (function step(now) { var t = Math.min(1, (now - start) / 1600); var k = Math.sin(t * Math.PI * 2) * (1 - t); set(from + k * 14); if (t < 1 && !drag) requestAnimationFrame(step); })(start);
      }, { threshold: 0.6 });
      io.observe(el);
    }
  }

  // ---------- reveal ----------
  function initFade() {
    var els = $$('[data-fade]'); if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  // ---------- forms: human validation messages ----------
  var MSG = {
    name: 'Tell us your name so we know who to ask for.',
    email: 'That email doesn’t look complete. Check for the @ and the part after it.',
    phone: 'A mobile number has 10 digits; we only use it to call you back.',
    required: 'This one is needed before we can send it.',
    consent: 'Please tick this so we can contact you about your enquiry.',
  };
  function validate(form) {
    var ok = true, first = null;
    $$('.fld', form).forEach(function (f) {
      var inp = f.querySelector('input,select,textarea'); if (!inp) return;
      var v = (inp.value || '').trim(), msg = '';
      if (inp.required && !v) msg = MSG[inp.dataset.msg] || MSG.required;
      else if (v && inp.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = MSG.email;
      else if (v && inp.dataset.kind === 'phone' && v.replace(/\D/g, '').replace(/^91/, '').length !== 10) msg = MSG.phone;
      else if (v && inp.minLength > 0 && v.length < inp.minLength) msg = 'A little more detail, please (at least ' + inp.minLength + ' characters).';
      var err = f.querySelector('.err'); if (!err) { err = document.createElement('span'); err.className = 'err'; err.id = (inp.id || inp.name) + '-err'; f.appendChild(err); }
      f.classList.toggle('bad', !!msg); err.textContent = msg; inp.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg) { inp.setAttribute('aria-describedby', err.id); ok = false; first = first || inp; }
    });
    $$('input[type=checkbox][required]', form).forEach(function (c) {
      var lab = c.closest('label'); var bad = !c.checked;
      var err = lab.nextElementSibling && lab.nextElementSibling.classList.contains('err-c') ? lab.nextElementSibling : null;
      if (bad && !err) { err = document.createElement('p'); err.className = 'err-c'; err.style.cssText = 'color:var(--bad);font-size:14px'; lab.after(err); }
      if (err) err.textContent = bad ? MSG.consent : '';
      if (bad) { ok = false; first = first || c; }
    });
    if (first) first.focus();
    return ok;
  }
  // live re-check once a field has been marked bad
  document.addEventListener('input', function (e) { var f = e.target.closest && e.target.closest('.fld.bad'); if (f) { var form = f.closest('form'); f.classList.remove('bad'); } });

  // ---------- the enquiry inbox (site forms -> back office) ----------
  function addLead(l) {
    var inbox = store.get('inbox', []);
    var n = 2312 + inbox.length + Math.floor(Math.random() * 3);
    // the demo runs on a fixed clock (NOW), so new leads are stamped relative to it and always read as "just in"
    l.id = 'L-' + n; l.at = new Date(NOW.getTime() + inbox.length * 60000).toISOString(); l.stage = 'enquiry'; l.fresh = true;
    l.owner = l.owner || 'Farah'; l.next = l.next || 'Call back within 4 working hours'; l.due = new Date(NOW.getTime() + 4 * 3600e3).toISOString();
    inbox.unshift(l); store.set('inbox', inbox);
    return l;
  }

  // ---------- small things ----------
  function countUp() { /* motion.js handles [data-count]; this keeps static text correct without it */ }
  function svcPeek() {
    var peek = $('#peek'); if (!peek || matchMedia('(pointer: coarse)').matches || reduce) return;
    var x = 0, y = 0, cx = 0, cy = 0, on = false, raf = 0;
    function loop() { cx += (x - cx) * 0.18; cy += (y - cy) * 0.18; peek.style.left = cx + 24 + 'px'; peek.style.top = cy - 100 + 'px'; raf = on ? requestAnimationFrame(loop) : 0; }
    $$('[data-peek]').forEach(function (r) {
      r.addEventListener('mouseenter', function (e) { peek.src = r.dataset.peek; peek.classList.add('on'); on = true; x = cx = e.clientX; y = cy = e.clientY; if (!raf) loop(); });
      r.addEventListener('mousemove', function (e) { x = e.clientX; y = e.clientY; });
      r.addEventListener('mouseleave', function () { peek.classList.remove('on'); on = false; });
    });
  }
  function pcard(p, i) {
    var types = { residential: 'Residential', commercial: 'Commercial', interiors: 'Interiors fit-out', turnkey: 'Turnkey' };
    return '<a class="pcard" href="project-' + p.id + '.html"><figure class="fig"><img src="photos/' + p.photo + '.jpg" srcset="photos/' + p.photo + '-s.jpg 720w, photos/' + p.photo + '-m.jpg 1080w, photos/' + p.photo + '.jpg 1800w" sizes="(max-width: 760px) 100vw, 50vw" alt="' + esc(p.name + ', ' + p.loc + ', ' + p.city) + '" loading="lazy" decoding="async" width="1800" height="1200"><span class="chip">' + types[p.type] + '</span></figure>' +
      '<div class="pcap"><div><h3>' + esc(p.name) + '</h3><span class="loc">' + esc(p.loc + ', ' + p.city) + '</span></div><div class="c"><i>Area</i>' + p.area.toLocaleString('en-IN') + ' sq ft</div><div class="c"><i>Year</i>' + p.year + '</div></div></a>';
  }

  window.App = { $: $, $$: $$, store: store, toast: toast, esc: esc, date: date, rel: rel, NOW: NOW, validate: validate, addLead: addLead, initBA: initBA, pcard: pcard, reduce: reduce, svcPeek: svcPeek };

  // ---------- the drawing sheet: grid-bubble index, title block, crane jib, dimension lines, redlines, line draws ----------
  function sheet() {
    var heads = $$('.sh[data-sheet]'), gidx = $('#gidx'), tbT = $('#tb-t'), tbS = $('#tb-s'), tb = $('#tb');
    var base = tbS ? tbS.textContent : '', baseT = tbT ? tbT.textContent : '';
    if (gidx && heads.length > 1) {
      gidx.innerHTML = heads.map(function (h) {
        var sec = h.closest('section') || h.parentElement, t = h.querySelector('.sh-t').textContent;
        if (!sec.id) sec.id = 'sheet-' + h.dataset.sheet.toLowerCase();
        return '<a href="#' + sec.id + '" data-t="' + esc(t) + '" aria-label="Section ' + h.dataset.sheet + ': ' + esc(t) + '">' + h.dataset.sheet + '</a>';
      }).join('');
    }
    var links = gidx ? $$('a', gidx) : [], cur = -2, hookT = 0, baseT0 = baseT, tbRev = $('#tb-rev');
    // a page can retitle its sheet (the home page does for a visitor's own plot and for the section); null puts it back
    window.App.setSheet = function (t, rev) { baseT = t || baseT0; if (cur < 0 && tbT) tbT.textContent = baseT; if (tbRev) tbRev.textContent = rev || 'C'; };
    // collapsed, the title block is a tab in the right-hand margin, so it never sits on the text
    var tbTab = null; if (tb) { tbTab = document.createElement('b'); tbTab.className = 'tb-tab'; tbTab.textContent = base; tb.appendChild(tbTab); }
    var jib = $('.jib'), jb = jib && jib.querySelector('b'), ftr = $('.ftr'), hero = $('#build'), ticking = false;
    function setCur(i) {
      if (i === cur) return; cur = i;
      links.forEach(function (a, k) { a.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      if (tbT) tbT.textContent = i < 0 ? baseT : heads[i].querySelector('.sh-t').textContent;
      if (tbS) tbS.textContent = i < 0 ? base : base + '.' + (i + 1);
      if (tbTab) tbTab.textContent = tbS ? tbS.textContent : base;
      if (jb && !reduce) { jb.style.setProperty('--hook', '24px'); clearTimeout(hookT); hookT = setTimeout(function () { jb.style.setProperty('--hook', '10px'); }, 650); }
    }
    function onScroll() {
      ticking = false;
      var mid = innerHeight * 0.4, i = -1;
      heads.forEach(function (h, k) { if (h.getBoundingClientRect().top < mid) i = k; });
      setCur(i);
      if (tb && ftr) tb.classList.toggle('away', ftr.getBoundingClientRect().top < innerHeight - 40);
      // full only at the top of the home page's hero, where nothing sits under it; a tab everywhere else
      if (tb) tb.classList.toggle('tab', scrollY > 80 || !hero);
      if (hero) document.body.classList.toggle('hero-on', hero.getBoundingClientRect().bottom > innerHeight * 0.5);
      if (jb && jib.offsetWidth) {
        var max = document.documentElement.scrollHeight - innerHeight, p = max > 0 ? scrollY / max : 0;
        jb.style.setProperty('--jx', Math.round(11 + p * (jib.offsetWidth - 22)) + 'px');
      }
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    addEventListener('resize', onScroll); onScroll();
    // lines that draw on
    $$('.draw').forEach(function (svg) {
      $$('path,line,rect,polyline,circle', svg).forEach(function (el) { try { el.style.setProperty('--len', Math.ceil(el.getTotalLength())); } catch (e) { /* not rendered */ } });
    });
    // red-pencil marks written round key numbers: data-redline="" (ellipse) or "under"
    $$('[data-redline]').forEach(function (el) {
      if (el.querySelector('svg.rlsvg')) return;
      el.classList.add('rl');
      var seed = (el.textContent.length * 9301 + 49297) % 233280;
      var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      var d = '';
      if (el.getAttribute('data-redline') === 'under') {
        d = 'M 2 54'; for (var u = 1; u <= 8; u++) d += ' L ' + (2 + u * 12) + ' ' + (54 + (rnd() - 0.5) * 5).toFixed(1);
      } else {
        for (var i = 0, n = 24; i <= n + 3; i++) {
          var a = -2.2 + i / n * Math.PI * 2, rx = 47 + (rnd() - 0.5) * 5, ry = 26 + (rnd() - 0.5) * 4;
          d += (i ? ' L ' : 'M ') + (50 + Math.cos(a) * rx).toFixed(1) + ' ' + (30 + Math.sin(a) * ry).toFixed(1);
        }
      }
      var ns = 'http://www.w3.org/2000/svg', sv = document.createElementNS(ns, 'svg'), pa = document.createElementNS(ns, 'path');
      sv.setAttribute('viewBox', '0 0 100 60'); sv.setAttribute('preserveAspectRatio', 'none'); sv.setAttribute('aria-hidden', 'true'); sv.setAttribute('class', 'rlsvg');
      pa.setAttribute('d', d); pa.setAttribute('vector-effect', 'non-scaling-stroke'); sv.appendChild(pa); el.appendChild(sv);
      var len = 400; try { len = Math.ceil(pa.getTotalLength() * 5); } catch (e) { /* hidden */ }
      pa.style.setProperty('--len', len);
    });
    var els = $$('.draw,.rl,.dimline,.steps');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -12% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  // ---------- the site desk launcher: compact in the margin on wide screens once you scroll; on smaller ones it steps
  // aside while you scroll down through content and comes back when you scroll up, reach the end or return to the top ----------
  // and wherever it rests, it only shows when nothing readable or clickable is under it
  function launcherTuck() {
    var last = scrollY, wideQ = matchMedia('(min-width: 1280px)'), b = document.body, down = false, ticking = false;
    var TEXT = /^(P|LI|H1|H2|H3|H4|H5|A|BUTTON|DD|DT|TD|TH|LABEL|BLOCKQUOTE|FIGCAPTION|OUTPUT|INPUT|SELECT|TEXTAREA|CAPTION)$/;
    function covers(el) {
      if (!el || !el.offsetWidth) return false;
      var cs = getComputedStyle(el), x0 = parseFloat(cs.left), y0 = parseFloat(cs.top), w = el.offsetWidth, h = el.offsetHeight;
      if (isNaN(x0) || isNaN(y0)) return false;
      var pts = [[x0 + 8, y0 + 8], [x0 + w - 8, y0 + 8], [x0 + 8, y0 + h - 8], [x0 + w - 8, y0 + h - 8], [x0 + w / 2, y0 + h / 2]];
      for (var i = 0; i < pts.length; i++) {
        var st = document.elementsFromPoint(pts[i][0], pts[i][1]);
        for (var j = 0; j < st.length; j++) { var e = st[j]; if (e === el || el.contains(e) || e.closest('.cg,.to-home,.tb,.gidx')) continue; if (TEXT.test(e.tagName) && (e.textContent.trim() || e.tagName === 'INPUT')) return true; }
      }
      return false;
    }
    function update() {
      ticking = false;
      var y = scrollY, atEnd = innerHeight + y > document.documentElement.scrollHeight - 60, compact = wideQ.matches && y > 240;
      var moving = down && y > 240 && !atEnd;
      b.classList.toggle('cg-compact', compact);
      b.classList.toggle('cg-tuck', !compact && (moving || covers(document.querySelector('.cg-launch'))));
      b.classList.toggle('th-tuck', !wideQ.matches && (moving || covers(document.querySelector('.to-home'))));
    }
    function onS() {
      var y = scrollY, d = y - last; if (Math.abs(d) >= 6) { down = d > 0; last = y; }
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    addEventListener('scroll', onS, { passive: true }); addEventListener('resize', onS);
    // the launcher arrives a moment after load: check its corner as soon as it is added, and again once it has settled
    var mo = new MutationObserver(function () { if (document.querySelector('.cg-launch')) { mo.disconnect(); onS(); setTimeout(onS, 400); setTimeout(onS, 1500); } });
    mo.observe(document.body, { childList: true }); onS(); setTimeout(onS, 6000);
  }

  function boot() {
    launcherTuck();
    $$('[data-ba]').forEach(initBA);
    initFade(); svcPeek(); sheet();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
