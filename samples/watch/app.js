/* Ghatika: shared shell. Store (localStorage), bag drawer, header, menu, toast with undo, search palette (Ctrl/Cmd+K). */
(function () {
  'use strict';
  var D = window.GH_DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PFX = 'ghatika:';

  // ---------- store
  var store = {
    get: function (k, f) { try { var v = localStorage.getItem(PFX + k); return v == null ? f : JSON.parse(v); } catch (e) { return f; } },
    set: function (k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) { /* private mode: keep going in memory */ } mem[k] = v; },
    del: function (k) { try { localStorage.removeItem(PFX + k); } catch (e) {} }
  };
  var mem = {};
  var SEEDV = 2; // bump when the seed changes: seeded rows are replaced, rows made on this device are kept
  function db(name) { // seeded collections for the back office
    if (!db.v) {
      db.v = 1;
      if (store.get('seedv', 1) !== SEEDV) {
        var s0 = D.seed();
        ['orders', 'appts', 'service', 'warranty'].forEach(function (n) { var old = store.get(n, null), ids = {}; if (!old) return; s0[n].forEach(function (x) { ids[x.id] = 1; }); store.set(n, old.filter(function (x) { return !ids[x.id]; }).concat(s0[n])); });
        store.set('seedv', SEEDV);
      }
    }
    var v = store.get(name, null);
    if (!v) { var s = D.seed(); ['orders', 'appts', 'service', 'warranty'].forEach(function (n) { if (!store.get(n, null)) store.set(n, s[n]); }); v = store.get(name, mem[name] || s[name]); }
    return v;
  }
  function add(name, rec) { var a = db(name); a.unshift(rec); store.set(name, a); return rec; }
  function nextId(prefix, name, base) { var a = db(name), n = base; a.forEach(function (x) { var m = +String(x.id).split('-').pop(); if (m >= n) n = m + 1; }); return prefix + n; }

  // ---------- format
  function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  function lakh(n) { return '₹' + (n / 100000).toFixed(n % 100000 ? 2 : 0).replace(/\.?0+$/, '') + ' L'; }
  function dfmt(iso, o) { return new Date(iso).toLocaleDateString('en-IN', o || { day: 'numeric', month: 'short', year: 'numeric' }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function optName(list, id) { var o = D[list].filter(function (x) { return x.id === id; })[0]; return o ? o.name : id; }
  function cfgLine(c) { return [optName('DIALS', c.dial), optName('METALS', c.metal), optName('STRAPS', c.strap)].join(' · '); }

  // ---------- toast
  var toastEl, toastT;
  function toast(msg, undo) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); document.body.appendChild(toastEl); }
    toastEl.innerHTML = '<span>' + esc(msg) + '</span>' + (undo ? '<button type="button">Undo</button>' : '');
    if (undo) $('button', toastEl).addEventListener('click', function () { undo(); toastEl.classList.remove('on'); });
    requestAnimationFrame(function () { toastEl.classList.add('on'); });
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, undo ? 6000 : 3200);
  }

  // ---------- bag
  var bag = {
    items: function () { return store.get('bag', []); },
    save: function (a) { store.set('bag', a); bag.paint(); },
    add: function (cfg) {
      var a = bag.items(); var item = { id: 'b' + Date.now().toString(36), model: cfg.model, dial: cfg.dial, metal: cfg.metal, strap: cfg.strap, engraving: cfg.engraving || '', qty: 1, price: D.price(cfg) };
      a.push(item); bag.save(a); bump(); openBag(); return item;
    },
    remove: function (id) { var a = bag.items(), i = a.findIndex(function (x) { return x.id === id; }); if (i < 0) return; var gone = a.splice(i, 1)[0]; bag.save(a); toast(D.MODELS[gone.model].name + ' removed from your bag', function () { var b = bag.items(); b.splice(i, 0, gone); bag.save(b); }); },
    total: function () { return bag.items().reduce(function (s, x) { return s + x.price * x.qty; }, 0); },
    count: function () { return bag.items().reduce(function (s, x) { return s + x.qty; }, 0); },
    paint: function () {
      var n = bag.count(); $$('[data-bag-n]').forEach(function (el) { el.textContent = n; el.hidden = !n; });
      var body = $('#bag-body'); if (!body) return;
      var items = bag.items();
      body.innerHTML = items.length ? items.map(function (x) {
        var m = D.MODELS[x.model];
        return '<div class="line-item"><img src="' + m.img + '" alt="" width="88" height="110" loading="lazy"><div><h3>' + m.name + '</h3><p class="opts">' + esc(cfgLine(x)) + (x.engraving ? '<br>Engraved: “' + esc(x.engraving) + '”' : '') + '</p><button class="rm" type="button" data-rm="' + x.id + '">Remove</button></div><p class="price">' + inr(x.price) + '</p></div>';
      }).join('') : '<div class="empty"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="22"/><path d="M32 18v14l9 6"/></svg><p>Your bag is empty.<br>Every Ghatika is configured before it is made.</p><a class="btn ghost" href="collection.html">See the collection</a></div>';
      $$('[data-rm]', body).forEach(function (b) { b.addEventListener('click', function () { bag.remove(b.dataset.rm); }); });
      var f = $('#bag-foot'); if (f) { f.hidden = !items.length; $('#bag-total').textContent = inr(bag.total()); }
    }
  };
  function bump() { $$('.bagbtn').forEach(function (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }); }
  var lastFocus = null;
  function ensureDrawer() {
    if ($('#bag')) return;
    var s = document.createElement('div'); s.className = 'scrim'; s.id = 'bag-scrim'; s.hidden = true;
    var d = document.createElement('aside'); d.className = 'drawer'; d.id = 'bag'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'bag-h'); d.hidden = true;
    d.innerHTML = '<div class="drawer-h"><h2 id="bag-h" class="h3">Your bag</h2><button class="x" type="button" id="bag-x" aria-label="Close bag">✕</button></div><div class="drawer-b" id="bag-body"></div><div class="drawer-f" id="bag-foot"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="k">Subtotal, incl. GST</span><b class="price" style="font-size:1.6rem;font-weight:400" id="bag-total"></b></div><p class="hint" style="margin:0">Insured delivery across India is complimentary. Engraving is free.</p><a class="btn block" href="checkout.html">Checkout <span class="ar" aria-hidden="true">→</span></a></div>';
    document.body.appendChild(s); document.body.appendChild(d);
    s.addEventListener('click', closeBag); $('#bag-x').addEventListener('click', closeBag);
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeBag(); if (e.key === 'Tab') trap(e, d); });
    bag.paint();
  }
  function trap(e, root) { var f = $$('a[href],button:not([disabled]),input,select,textarea', root).filter(function (x) { return x.offsetParent; }); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  function openBag() { ensureDrawer(); lastFocus = document.activeElement; var d = $('#bag'), s = $('#bag-scrim'); d.hidden = s.hidden = false; requestAnimationFrame(function () { d.classList.add('on'); s.classList.add('on'); }); setTimeout(function () { $('#bag-x').focus(); }, 60); document.documentElement.style.overflow = 'hidden'; if (window.Motion && Motion.lenis) Motion.lenis.stop(); }
  function closeBag() { var d = $('#bag'), s = $('#bag-scrim'); if (!d) return; d.classList.remove('on'); s.classList.remove('on'); setTimeout(function () { d.hidden = s.hidden = true; }, reduce ? 0 : 600); document.documentElement.style.overflow = ''; if (window.Motion && Motion.lenis) Motion.lenis.start(); if (lastFocus) lastFocus.focus(); }

  // ---------- header, menu
  function shell() {
    var hdr = $('.hdr'), last = scrollY;
    if (hdr && !hdr.hasAttribute('data-fixed')) addEventListener('scroll', function () { var y = scrollY; if (Math.abs(y - last) < 6) return; hdr.classList.toggle('hide', y > last && y > 240 && !document.body.classList.contains('menu-open')); last = y; }, { passive: true });
    var mb = $('#mbtn'), menu = $('#menu');
    if (mb && menu) {
      var set = function (on) { mb.setAttribute('aria-expanded', on); menu.hidden = !on; mb.textContent = on ? 'Close' : 'Menu'; document.body.classList.toggle('menu-open', on); document.documentElement.style.overflow = on ? 'hidden' : ''; };
      mb.addEventListener('click', function () { set(mb.getAttribute('aria-expanded') !== 'true'); });
      menu.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); mb.focus(); } });
    }
    $$('[data-open-bag]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); openBag(); }); });
    $$('form[data-news]').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); var i = $('input', f); if (!/^\S+@\S+\.\S+$/.test(i.value)) { i.setAttribute('aria-invalid', 'true'); toast('That email looks incomplete. Try name@domain.com'); i.focus(); return; } i.removeAttribute('aria-invalid'); i.value = ''; toast('Thank you. One letter a season, never more.'); }); });
    // lazy videos: play only on screen
    var vids = $$('video[data-lazy]');
    if (vids.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { en.forEach(function (x) { var v = x.target; if (x.isIntersecting) { if (!v.src && v.dataset.src) v.src = v.dataset.src; if (!reduce && !v.dataset.paused) v.play().catch(function () {}); } else v.pause(); }); }, { rootMargin: '200px' });
      vids.forEach(function (v) { io.observe(v); });
    }
    bag.paint(); rings();
  }

  // ---------- chapter rings and caliper rules (signature components)
  var HOURS = { XII: 0, I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11 };
  function rings() {
    $$('.ring[data-n]').forEach(function (r) {
      if (r.firstChild) return; var h = HOURS[r.dataset.n] || 0, t = '';
      for (var i = 0; i < 60; i++) { var a = i / 60 * Math.PI * 2, hr = i % 5 === 0, r1 = hr ? 23.5 : 25.5; t += '<line class="tk' + (hr ? ' h' : '') + '" x1="' + (30 + Math.sin(a) * r1).toFixed(2) + '" y1="' + (30 - Math.cos(a) * r1).toFixed(2) + '" x2="' + (30 + Math.sin(a) * 27).toFixed(2) + '" y2="' + (30 - Math.cos(a) * 27).toFixed(2) + '" stroke-width="' + (hr ? .9 : .5) + '"/>'; }
      r.style.setProperty('--to', h * 30 + 'deg'); r.style.setProperty('--from', (h * 30 - 90) + 'deg');
      r.innerHTML = '<svg viewBox="0 0 60 60"><circle class="rim" cx="30" cy="30" r="29.5" stroke-width=".6"/>' + t + '<text x="30" y="' + (h >= 4 && h <= 8 ? 21 : 44) + '" text-anchor="middle">' + r.dataset.n + '</text><line class="hand" x1="30" y1="33" x2="30" y2="9"/><circle class="pin" cx="30" cy="30" r="1.6"/></svg>';
    });
    $$('.caliper').forEach(function (c) { if (!c.querySelector('i')) c.insertAdjacentHTML('afterbegin', '<i></i><i></i>'); });
    var els = $$('.ring, .caliper');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('on'); }); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('on'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -12% 0px' });
    els.forEach(function (e) { io.observe(e); });
    // blocks settle into place as they enter (transform only: nothing waits invisible for a scroll)
    var st = $$('[data-settle]');
    if (st.length) { var so = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('st-in'); so.unobserve(x.target); } }); }, { rootMargin: '0px 0px -4% 0px' }); st.forEach(function (e) { so.observe(e); }); }
    // the footer's caseback ring turns slowly while it is on screen
    var ring = $('.ftr-ring .spin');
    if (ring && !reduce) {
      var vis = false, raf = 0, base = 0;
      new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }).observe(ring.closest('.ftr-ring'));
      addEventListener('scroll', function () { if (!vis || raf) return; raf = requestAnimationFrame(function () { raf = 0; ring.style.transform = 'rotate(' + ((scrollY * 0.035) % 360).toFixed(2) + 'deg)'; /* CSS rotation about the ring's own centre (transform-origin in the stylesheet) */ }); }, { passive: true });
    }
  }

  // ---------- search palette (Ctrl/Cmd+K)
  var pal;
  function palette() {
    if (pal) { pal.hidden = false; $('input', pal).value = ''; render(''); $('input', pal).focus(); return; }
    pal = document.createElement('div'); pal.className = 'pal'; pal.setAttribute('role', 'dialog'); pal.setAttribute('aria-modal', 'true'); pal.setAttribute('aria-label', 'Search Ghatika');
    pal.innerHTML = '<div class="pal-box"><label class="sr" for="pal-q">Search pages, watches and journal</label><input id="pal-q" class="inp" placeholder="Search watches, boutiques, journal…" autocomplete="off" role="combobox" aria-expanded="true" aria-controls="pal-l"><ul id="pal-l" role="listbox"></ul><p class="hint">↑ ↓ to move · Enter to open · Esc to close</p></div>';
    document.body.appendChild(pal);
    var items = [];
    Object.keys(D.MODELS).forEach(function (k) { var m = D.MODELS[k]; items.push({ t: m.name + ' · ' + m.line, h: 'watch.html?m=' + k, g: 'Watch' }); });
    [['Collection', 'collection.html'], ['Craftsmanship', 'craft.html'], ['Boutiques and appointments', 'boutiques.html'], ['Journal', 'journal.html'], ['Bag and checkout', 'checkout.html'], ['Register a warranty', 'warranty.html'], ['Care and service request', 'service.html'], ['Track a service ticket', 'service.html#track'], ['Terms, privacy and returns', 'legal.html']].forEach(function (p) { items.push({ t: p[0], h: p[1], g: 'Page' }); });
    D.BOUTIQUES.forEach(function (b) { items.push({ t: b.city + ' · ' + b.name, h: 'boutiques.html?b=' + b.id + '#book', g: 'Boutique' }); });
    D.JOURNAL.forEach(function (j) { items.push({ t: j.title, h: 'article-' + j.id + '.html', g: 'Journal' }); });
    var sel = 0, cur = [];
    function render(q) {
      q = q.toLowerCase().trim(); cur = items.filter(function (i) { return !q || (i.t + ' ' + i.g).toLowerCase().indexOf(q) > -1; }).slice(0, 9); sel = 0; paint();
    }
    function paint() { $('#pal-l').innerHTML = cur.length ? cur.map(function (i, n) { return '<li role="option" id="po' + n + '" aria-selected="' + (n === sel) + '"><a href="' + i.h + '"><span>' + esc(i.t) + '</span><span class="k">' + i.g + '</span></a></li>'; }).join('') : '<li class="hint" style="padding:14px">Nothing matches. Try “moon”, “Mumbai” or “service”.</li>'; $('input', pal).setAttribute('aria-activedescendant', cur.length ? 'po' + sel : ''); }
    $('input', pal).addEventListener('input', function (e) { render(e.target.value); });
    pal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') pal.hidden = true;
      else if (e.key === 'ArrowDown') { sel = Math.min(cur.length - 1, sel + 1); paint(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); paint(); e.preventDefault(); }
      else if (e.key === 'Enter' && cur[sel]) location.href = cur[sel].h;
    });
    pal.addEventListener('click', function (e) { if (e.target === pal) pal.hidden = true; });
    render(''); $('input', pal).focus();
  }
  document.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !document.body.hasAttribute('data-own-k')) { e.preventDefault(); palette(); } });

  // 3D only where a real GPU exists: software renderers (SwiftShader, llvmpipe) keep the still renders
  function gpuOK() {
    try { var c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl'); if (!gl) return false;
      var ext = gl.getExtension('WEBGL_debug_renderer_info'), r = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
      var lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(r);
    } catch (e) { return false; }
  }
  window.GH = { gpuOK: gpuOK, store: store, db: db, add: add, nextId: nextId, inr: inr, lakh: lakh, dfmt: dfmt, esc: esc, toast: toast, bag: bag, openBag: openBag, closeBag: closeBag, cfgLine: cfgLine, optName: optName, palette: palette, $: $, $$: $$, reduce: reduce, trap: trap };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', shell); else shell();
})();
