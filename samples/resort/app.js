/* Taradhura: shared chrome for every public page. Menu, header states, toasts, sheets, cottage cards
   (with the shared-element view transition), the quick availability bar and the footer letter. */
(function () {
  'use strict';
  var TD = window.TD = window.TD || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  TD.ui = { $: $, $$: $$, esc: esc, reduce: reduce };

  // ---------- toast ----------
  var toastEl, toastT;
  TD.ui.toast = function (msg, action, fn) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); document.body.appendChild(toastEl); }
    toastEl.innerHTML = '<span>' + esc(msg) + '</span>' + (action ? '<button type="button">' + esc(action) + '</button>' : '');
    if (action) toastEl.querySelector('button').onclick = function () { toastEl.classList.remove('on'); fn && fn(); };
    requestAnimationFrame(function () { toastEl.classList.add('on'); });
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, action ? 6500 : 3800);
  };

  // ---------- sheet (slide-over on desktop, bottom sheet on phones) ----------
  var lastFocus = null;
  TD.ui.sheet = function (title, bodyHTML, footHTML, onMount) {
    TD.ui.closeSheet(true);
    var scrim = document.createElement('div'); scrim.className = 'scrim';
    var sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true'); sh.setAttribute('aria-label', title);
    sh.innerHTML = '<div class="sheet-h"><h2>' + esc(title) + '</h2><button class="x" type="button" aria-label="Close">×</button></div><div class="sheet-b" data-lenis-prevent>' + bodyHTML + '</div>' + (footHTML ? '<div class="sheet-f">' + footHTML + '</div>' : '');
    document.body.appendChild(scrim); document.body.appendChild(sh);
    lastFocus = document.activeElement;
    requestAnimationFrame(function () { scrim.classList.add('on'); sh.classList.add('on'); });
    scrim.onclick = function () { TD.ui.closeSheet(); };
    sh.querySelector('.x').onclick = function () { TD.ui.closeSheet(); };
    if (window.Motion && Motion.lenis) Motion.lenis.stop();
    setTimeout(function () { var f = sh.querySelector('input,select,textarea,button:not(.x)') || sh.querySelector('.x'); f && f.focus({ preventScroll: true }); }, 60);
    onMount && onMount(sh);
    return sh;
  };
  TD.ui.closeSheet = function (instant) {
    var sh = $('.sheet'), sc = $('.scrim'); if (!sh) return;
    sh.classList.remove('on'); sc && sc.classList.remove('on');
    setTimeout(function () { sh.remove(); sc && sc.remove(); }, instant ? 0 : 500);
    if (window.Motion && Motion.lenis) Motion.lenis.start();
    if (!instant && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if ($('.sheet')) TD.ui.closeSheet(); else if (menu && !menu.hidden) closeMenu(); }
    if (e.key === 'Tab') { // keep focus inside an open dialog
      var box = $('.sheet.on') || (menu && !menu.hidden ? menu : null); if (!box) return;
      var f = $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])', box).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return; var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // ---------- menu ----------
  var menu = $('#menu'), mbtn = $('#mbtn');
  function openMenu() { menu.hidden = false; mbtn.setAttribute('aria-expanded', 'true'); document.documentElement.style.overflow = 'hidden'; if (window.Motion && Motion.lenis) Motion.lenis.stop(); $('#mclose').focus();
    if (window.gsap && !reduce) gsap.from($$('#menu nav a'), { yPercent: 60, opacity: 0, duration: .9, ease: 'expo.out', stagger: .045 }); }
  function closeMenu() { menu.hidden = true; mbtn.setAttribute('aria-expanded', 'false'); document.documentElement.style.overflow = ''; if (window.Motion && Motion.lenis) Motion.lenis.start(); mbtn.focus(); }
  if (menu && mbtn) { mbtn.onclick = openMenu; $('#mclose').onclick = closeMenu; }

  // ---------- header: transparent over the hero, hides on the way down ----------
  var hdr = $('#hdr'), hero = $('[data-hero]') || $('#dn');
  var overInit = hdr && hdr.classList.contains('over'), lastY = scrollY;
  function onScroll() {
    if (!hdr) return;
    var y = scrollY;
    if (overInit && hero) { var past = y > 10 && hero.getBoundingClientRect().bottom < 70; hdr.classList.toggle('over', !past); }
    var down = y > lastY + 4, up = y < lastY - 4;
    if (y > 500 && down && !(menu && !menu.hidden)) hdr.classList.add('hide'); else if (up || y < 200) hdr.classList.remove('hide');
    lastY = y;
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll(); addEventListener('load', onScroll);
  // keep the header visible while keyboard focus is in it
  if (hdr) hdr.addEventListener('focusin', function () { hdr.classList.remove('hide'); });

  // ---------- cottage cards + shared-element transition ----------
  TD.ui.photo = function (name, alt, sizes, cls, eager) {
    return '<img' + (cls ? ' class="' + cls + '"' : '') + ' src="photos/' + name + '-s.jpg" srcset="photos/' + name + '-s.jpg 760w, photos/' + name + '.jpg 1600w" sizes="' + (sizes || '(max-width:900px) 100vw, 50vw') + '" alt="' + esc(alt) + '"' + (eager ? '' : ' loading="lazy"') + ' decoding="async" width="1600" height="1200">';
  };
  // the four ways to stay as four tall windows in one strip: each opens (wider, its line and facts) when you reach for it
  TD.ui.keyCard = function (t, i) {
    var n = t.rooms.length, words = ['', 'one house', 'two houses', 'three', 'four cottages', 'five', 'six rooms'], span = n > 1 ? t.rooms[0] + '–' + t.rooms[n - 1] : t.rooms[0];
    return '<a class="key" href="cottage.html?id=' + t.id + '" data-cot="' + t.id + '">' +
      '<div class="key-img">' + TD.ui.photo(t.hero, t.name + ': ' + t.captions[0], '(max-width:900px) 100vw, 40vw') + '</div>' +
      '<div class="key-top"><span class="ix">' + esc(span) + '</span><span>' + words[n] + '</span></div>' +
      '<div class="key-b"><div class="key-h"><h3>' + esc(t.plural) + '</h3><span class="from">from <b>' + TD.inr(t.base) + '</b></span></div>' +
      '<div class="key-more"><p>' + esc(t.line) + '</p><span class="key-facts">' + t.size + ' m² · sleeps ' + esc(t.sleeps) + ' · ' + esc(t.view.charAt(0).toLowerCase() + t.view.slice(1)) + '</span>' +
      '<span class="key-go">See ' + (n > 1 ? 'the ' : 'the ') + esc(t.plural) + ' <span class="ar" aria-hidden="true">→</span></span></div></div></a>';
  };
  TD.ui.cotCard = function (t, i) {
    return '<a class="cot" href="cottage.html?id=' + t.id + '" data-cot="' + t.id + '">' +
      '<div class="cot-img">' + TD.ui.photo(t.hero, t.name + ': ' + t.captions[0], i === 0 || i === 3 ? '(max-width:900px) 100vw, 60vw' : '(max-width:900px) 100vw, 35vw') + '</div>' +
      '<div class="cot-meta"><span class="ix">0' + (i + 1) + '</span><h3>' + esc(t.plural) + '</h3><span class="from">from<b>' + TD.inr(t.base) + '</b></span></div>' +
      '<p>' + esc(t.line) + '</p><div class="cot-facts"><span>' + t.size + ' m²</span><span>Sleeps ' + esc(t.sleeps) + '</span><span>' + t.rooms.length + (t.rooms.length > 1 ? ' of them' : ', just one') + '</span></div></a>';
  };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-cot]'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    $$('[style*="view-transition-name"]').forEach(function (x) { x.style.viewTransitionName = ''; });
    var img = a.querySelector('img'); if (img) img.style.viewTransitionName = 'cot-img';
    try { sessionStorage.setItem('td:cot', a.dataset.cot); } catch (err) {}
  });
  // coming back from a cottage page: morph its photo back into the right card
  // a page transition the browser skips (a heavy 3D frame, a quick second click) rejects its promises: nothing to report
  function quiet(vt) { if (vt) { vt.ready.catch(function () {}); vt.finished.catch(function () {}); } }
  addEventListener('pageswap', function (e) { quiet(e.viewTransition); });
  addEventListener('pagereveal', function (e) {
    if (!e.viewTransition) return;
    quiet(e.viewTransition);
    var id; try { id = sessionStorage.getItem('td:cot'); } catch (err) {}
    var nav = window.navigation && navigation.activation;
    var from = nav && nav.from && nav.from.url || '';
    if (id && /cottage\.html/.test(from)) {
      var img = $('a[data-cot="' + id + '"] img'); if (img) { img.style.viewTransitionName = 'cot-img'; e.viewTransition.finished.then(function () { img.style.viewTransitionName = ''; }); }
    }
  });
  addEventListener('pageshow', function (e) { if (e.persisted) $$('a[data-cot] img').forEach(function (x) { x.style.viewTransitionName = ''; }); });

  // ---------- quick availability bar ----------
  var qb = $('#qbar');
  if (qb) {
    var t0 = TD.date.today(), qi = $('#q-in'), qo = $('#q-out');
    qi.min = t0; qo.min = TD.date.add(t0, 1);
    qi.value = TD.date.add(t0, 14); qo.value = TD.date.add(t0, 16);
    qi.addEventListener('change', function () { if (!qi.value) return; qo.min = TD.date.add(qi.value, 1); if (!qo.value || qo.value <= qi.value) qo.value = TD.date.add(qi.value, 2); });
    qb.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!qi.value || !qo.value || qo.value <= qi.value) { TD.ui.toast('Pick an arrival and a later departure date.'); (qi.value ? qo : qi).focus(); return; }
      location.href = 'book.html?in=' + qi.value + '&out=' + qo.value + '&ad=' + $('#q-ad').value;
    });
  }

  // ---------- footer: the seasonal letter (demo) ----------
  var news = $('#news');
  if (news) news.addEventListener('submit', function (e) {
    e.preventDefault(); var v = $('#news-e').value.trim(), m = $('#news-msg');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { m.textContent = 'That email doesn’t look complete. Try name@domain.com.'; $('#news-e').focus(); return; }
    var l = TD.store.get('letter', []); l.push({ email: v, at: new Date().toISOString() }); TD.store.set('letter', l);
    m.textContent = 'Thank you. The winter letter goes out on 1 December.'; news.reset();
  });
  // ---------- painterly ridges where the page walks from day into evening ----------
  function ridgePath(seed, base, amp, w) {
    var d = 'M0 ' + 160, pts = 48; for (var i = 0; i <= pts; i++) { var x = i / pts * w; var y = base - amp * (0.55 * Math.sin(x / 140 + seed) + 0.3 * Math.sin(x / 47 + seed * 2.3) + 0.15 * Math.sin(x / 19 + seed * 5.1)); d += ' L' + x.toFixed(1) + ' ' + y.toFixed(1); }
    return d + ' L' + w + ' 160 Z';
  }
  var RIDGE = '<svg class="ridges" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="' + ridgePath(1.3, 70, 34, 1440) + '"/><path d="' + ridgePath(4.2, 98, 26, 1440) + '"/><path d="' + ridgePath(2.6, 122, 20, 1440) + '"/><path d="' + ridgePath(5.7, 146, 12, 1440) + '"/></svg>';
  $$('main > section.night:not(.dn), body > .ft').forEach(function (s) {
    var prev = s.previousElementSibling; while (prev && (prev.tagName === 'SCRIPT' || prev.classList.contains('marq'))) prev = prev.previousElementSibling;
    if (!prev || prev.classList.contains('night') || prev.classList.contains('dn') || prev.tagName === 'MAIN' && prev.lastElementChild && prev.lastElementChild.classList.contains('night')) return;
    var bg = getComputedStyle(prev).backgroundColor; if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') bg = getComputedStyle(document.body).backgroundColor;
    s.insertAdjacentHTML('beforebegin', RIDGE.replace('<svg class="ridges"', '<svg class="ridges" style="background:' + bg + '"'));
  });

  // ---------- generic tabs: [data-tabs] > [role=tab][data-tab] + [data-panel] ----------
  $$('[data-tabs]').forEach(function (box) {
    var tabs = $$('[role="tab"]', box);
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { tabs.forEach(function (x) { var on = x === t; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; }); $$('[data-panel]', box).forEach(function (p) { p.hidden = p.dataset.panel !== t.dataset.tab; }); });
      t.addEventListener('keydown', function (e) { var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!k) return; var n = tabs[(i + k + tabs.length) % tabs.length]; n.focus(); n.click(); });
      t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
    });
  });
  // ---------- phones: the lantern steps aside while you scroll down through content, returns on the way up ----------
  (function () {
    var mq = matchMedia('(max-width: 760px)'), last = scrollY, tuck = false, back = 0;
    function set(t) { if (t !== tuck) { tuck = t; document.body.classList.toggle('cg-tuck', t); } }
    addEventListener('scroll', function () {
      var y = scrollY, d = y - last; if (Math.abs(d) < 6) return; last = y;
      var t = mq.matches && d > 0 && y > 240 && (innerHeight + y) < document.documentElement.scrollHeight - 40;
      set(t); clearTimeout(back); if (t) back = setTimeout(function () { set(false); }, 1100);
    }, { passive: true });
  })();
  $$('[data-year]').forEach(function (x) { x.textContent = new Date().getFullYear(); });
})();
