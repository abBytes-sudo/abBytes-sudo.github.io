/* Northlane storefront (design sample): shared chrome (header, menu, search, bag, footer), home and shop.
   Products, stock and orders come from the shared demo database in nl-data.js (window.NL); the bag and saved pieces live in this browser. */
(function () {
  'use strict';
  var NL = window.NL, R = NL.ROOT;
  var G = window.gsap, ST = window.ScrollTrigger, SPLIT = window.SplitText;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fx = !!(G && ST && window.Motion && !window.Motion.reduce && !reduce);
  var ls = {
    get: function (k, d) { try { var v = JSON.parse(localStorage.getItem('nl-' + k)); return v == null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('nl-' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var money = NL.money, esc = NL.esc;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9-9.6C2 7.5 4 4.8 6.9 4.8c1.9 0 3.4 1 5.1 3 1.7-2 3.2-3 5.1-3C20 4.8 22 7.5 21 10.9c-1.5 5-9 9.6-9 9.6z"/></svg>';
  var LENS = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.6" cy="8.6" r="5.6"/><path d="M12.8 12.8l4.4 4.4"/></svg>';
  var STAR = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.8l2.5 5.3 5.7.7-4.2 3.9 1.1 5.7L10 14.6l-5.1 2.8 1.1-5.7L1.8 7.8l5.7-.7z"/></svg>';
  function stars(v, cls) { var h = '<span class="stars ' + (cls || '') + '" role="img" aria-label="' + v.toFixed(1) + ' out of 5 stars">'; for (var i = 1; i <= 5; i++) h += '<i style="--f:' + Math.max(0, Math.min(1, v - i + 1)) + '">' + STAR + '</i>'; return h + '</span>'; }
  function img(p, eager, i) { var im = (p.images && p.images[i || 0]) || p.images[0]; return '<img ' + NL.imgAttrs(im.src, '(max-width:960px) 50vw, 25vw') + ' alt="' + esc(im.alt || p.alt || p.name) + '" width="900" height="1125" ' + (eager ? '' : 'loading="lazy"') + ' decoding="async">'; }

  /* ── bag + saved ── */
  var cart = ls.get('cart', []), wish = ls.get('wish', []);
  function clean() { cart = cart.filter(function (c) { var p = NL.product(c.id); return p && p.colors[c.c || 0] && c.q > 0; }); cart.forEach(function (c) { c.c = c.c || 0; }); }
  clean();

  /* in-view reveal for JS-rendered lists */
  function reveal(els) {
    els = [].slice.call(els).filter(function (e) { return e.getBoundingClientRect().top > innerHeight * .92; }); if (!fx || !els.length) return;
    G.set(els, { autoAlpha: 0, y: 40 });
    ST.batch(els, { start: 'top 94%', once: true, onEnter: function (b) { G.to(b, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power4.out', stagger: .08, overwrite: true }); } });
  }
  function swapIn(els) { els = [].slice.call(els); if (!fx || !els.length) return; G.fromTo(els, { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .9, ease: 'power3.out', stagger: .05, overwrite: true }); }

  function card(p, i) {
    var w = wish.indexOf(p.id) >= 0, tot = NL.totalStock(p), rs = NL.reviewStats(p.id);
    var badge = !tot ? '<span class="pc-new pc-out">Sold out</span>' : p.isNew ? '<span class="pc-new">New</span>' : '';
    return '<li class="pc"><a class="pc-a" href="' + R + 'product.html?id=' + p.id + '"><div class="pc-img">' + img(p, typeof i === 'number' && i < 4) + badge + '<span class="pc-view">View piece</span></div>' +
      '<div class="pc-tx"><p class="pc-n">' + esc(p.name) + '</p><p class="pc-p">' + money(p.price) + '</p></div><p class="pc-m"><span>' + esc(p.cat) + ' · ' + NL.plural(p.colors.length, 'colour') + '</span>' +
      (rs.n ? '<span class="pc-r">' + stars(rs.avg, 'sm') + '<span>' + rs.avg.toFixed(1) + '</span></span>' : '') + '</p></a>' +
      '<button class="pc-w' + (w ? ' on' : '') + '" type="button" data-wish="' + p.id + '" aria-pressed="' + w + '" aria-label="Save ' + esc(p.name) + '">' + HEART + '</button></li>';
  }

  /* ── shared chrome: header, menu, bag drawer, footer ── */
  var drawerOpener = null, onChange = [];
  function acctLabel() { var s = NL.session(); return s ? (s.name ? s.name.split(' ')[0] : 'Account') : 'Sign in'; }
  function chrome() {
    var hd = document.createElement('header'); hd.className = 'nl-hd';
    hd.innerHTML = '<div class="nl-bar"><b>Portfolio project by <a href="' + R + '../../index.html">Abhishek</a></b></div>' +
      '<div class="nl-nav"><nav aria-label="Shop"><a href="' + R + 'shop.html">Shop</a><a href="' + R + 'shop.html?cat=Clothing">Clothing</a><a href="' + R + 'shop.html?cat=Shoes">Shoes</a><a href="' + R + 'shop.html?cat=Bags">Bags</a><a href="' + R + 'shop.html?cat=Accessories">Accessories</a></nav>' +
      '<button class="nl-menubtn" type="button" aria-label="Open menu" aria-expanded="false">Menu</button>' +
      '<a class="nl-logo" href="' + R + 'index.html" aria-label="Northlane, home">Northlane</a>' +
      '<div class="nl-act"><button class="nl-srch" type="button" aria-label="Search the store (press /)">' + LENS + '<span>Search</span></button><a href="' + R + 'account.html" class="hm" id="acctL">' + esc(acctLabel()) + '</a><a href="' + R + '../orders/track.html" class="hm hm2">Track order</a><a href="' + R + 'shop.html?wish=1" class="hm">Saved<span class="nl-c" id="wishN"></span></a><button class="nl-cartbtn" type="button" aria-label="Open bag">Bag<span class="nl-c" id="cartN"></span></button></div></div>';
    document.body.prepend(hd);
    var skip = document.createElement('a'); skip.className = 'skip'; skip.href = '#main'; skip.textContent = 'Skip to content'; document.body.prepend(skip);
    var mn = $('main'); if (mn && !mn.id) mn.id = 'main';
    var menu = document.createElement('div'); menu.className = 'nl-menu'; menu.id = 'nlMenu'; menu.setAttribute('aria-label', 'Menu'); menu.setAttribute('data-lenis-prevent', '');
    menu.innerHTML = '<a href="' + R + 'index.html">Home</a><a href="' + R + 'shop.html">Shop all</a><a href="' + R + 'shop.html?cat=Clothing">Clothing</a><a href="' + R + 'shop.html?cat=Shoes">Shoes</a><a href="' + R + 'shop.html?cat=Bags">Bags</a><a href="' + R + 'shop.html?cat=Accessories">Accessories</a>' +
      '<button type="button" class="sm" data-open-search>Search</button><a class="sm" href="' + R + 'account.html" id="acctM">' + (NL.session() ? 'Your account' : 'Sign in') + '</a><a class="sm" href="' + R + '../orders/track.html">Track an order</a><a class="sm" href="' + R + 'shop.html?wish=1">Saved pieces</a>';
    var mx = document.createElement('button'); mx.className = 'nl-menuX'; mx.type = 'button'; mx.textContent = 'Close';
    document.body.appendChild(menu); document.body.appendChild(mx);
    var mb = $('.nl-menubtn');
    function menuSet(o) { menu.classList.toggle('open', o); mb.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; if (window.Motion && Motion.lenis) o ? Motion.lenis.stop() : Motion.lenis.start(); if (o) { hd.classList.remove('hide'); setTimeout(function () { $('a', menu).focus(); }, 80); } }
    mb.addEventListener('click', function () { menuSet(true); }); mx.addEventListener('click', function () { menuSet(false); mb.focus(); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { menuSet(false); }); });
    $('[data-open-search]', menu).addEventListener('click', function () { menuSet(false); if (window.NLSearch) NLSearch.open(); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { menuSet(false); mb.focus(); } });
    $('.nl-srch').addEventListener('click', function () { if (window.NLSearch) NLSearch.open(); });

    var dr = document.createElement('aside'); dr.className = 'nl-drawer'; dr.setAttribute('aria-label', 'Shopping bag'); dr.hidden = true;
    dr.innerHTML = '<div class="dr-sh"></div><div class="dr-pn" role="dialog" aria-modal="true" aria-labelledby="drH" data-lenis-prevent><div class="dr-hd"><h2 id="drH">Your bag</h2><button type="button" class="dr-x">Close</button></div><ul class="dr-list"></ul><div class="dr-ft"><p class="dr-tot"><span>Subtotal</span><b></b></p><div class="dr-bar" aria-hidden="true"><i></i></div><p class="dr-ship"></p><a class="nl-btn" href="' + R + 'checkout.html">Checkout <span class="arrow" aria-hidden="true">→</span></a><p class="dr-fine">Prices include GST. Delivery and any codes are worked out at checkout.</p></div></div>';
    document.body.appendChild(dr);
    var ft = document.createElement('footer'); ft.className = 'nl-ft';
    ft.innerHTML = '<div class="ft-g"><div><p class="ft-t">Colophon.</p><p class="ft-n">Clothing and accessories in honest materials, cut in small runs at our Jaipur studio. Set in Bodoni Moda and Hanken Grotesk.</p></div>' +
      '<div><h2 class="ft-h">Shop</h2><ul><li><a href="' + R + 'shop.html">All pieces</a></li><li><a href="' + R + 'shop.html?cat=Clothing">Clothing</a></li><li><a href="' + R + 'shop.html?cat=Shoes">Shoes</a></li><li><a href="' + R + 'shop.html?cat=Bags">Bags</a></li><li><a href="' + R + 'shop.html?cat=Accessories">Accessories</a></li></ul></div>' +
      '<div><h2 class="ft-h">Help</h2><ul><li><a href="' + R + '../orders/track.html">Track an order</a></li><li><a href="' + R + 'account.html">Your account</a></li><li><a href="' + R + 'account.html#returns">Start a return</a></li><li><a href="' + R + 'shop.html?wish=1">Saved pieces</a></li><li><button type="button" class="ft-s" data-open-search>Search</button></li></ul></div>' +
      '<div><h2 class="ft-h">The studio</h2><ul><li><a href="' + R + '../orders/admin.html">Back office</a></li><li><a href="' + R + 'checkout.html">Checkout</a></li><li><a href="' + R + '../../index.html#projects">Back to portfolio</a></li></ul></div></div>' +
      '<div class="ft-wm" aria-hidden="true">Northlane</div>' +
      '<div class="ft-b"><span>© Northlane · Jaipur. A portfolio project by <a href="' + R + '../../index.html">Abhishek</a>.</span><span>Photos: Unsplash. Video: Pexels.</span></div>';
    document.body.appendChild(ft);
    $('[data-open-search]', ft).addEventListener('click', function () { if (window.NLSearch) NLSearch.open(); });

    $('.nl-cartbtn').addEventListener('click', openCart);
    $('.dr-x', dr).addEventListener('click', closeCart); $('.dr-sh', dr).addEventListener('click', closeCart);
    document.addEventListener('keydown', function (e) {
      if (dr.hidden) return;
      if (e.key === 'Escape') { closeCart(); return; }
      if (e.key === 'Tab') { var f = $$('button,a[href]', dr).filter(function (x) { return !x.disabled && x.offsetParent !== null; }); if (!f.length) return; var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    });
    dr.addEventListener('click', function (e) {
      var b = e.target.closest('[data-q],[data-rm]'); if (!b) return; var i = +b.getAttribute('data-i'), c = cart[i]; if (!c) return;
      if (b.hasAttribute('data-rm')) cart.splice(i, 1);
      else { var d = +b.getAttribute('data-q'), av = NL.stock(NL.skuKey(c.id, c.c, c.s)).avail; if (d > 0 && c.q >= av) { flash(b.closest('.dr-it'), av ? 'That’s the last ' + (av === 1 ? 'one' : av) + ' in stock.' : 'Just sold out.'); return; } c.q += d; if (c.q <= 0) cart.splice(i, 1); }
      saveCart();
    });
    document.addEventListener('click', function (e) {
      var w = e.target.closest('[data-wish]'); if (!w) return; e.preventDefault();
      var id = w.getAttribute('data-wish'), k = wish.indexOf(id); k >= 0 ? wish.splice(k, 1) : wish.push(id); ls.set('wish', wish);
      $$('[data-wish="' + id + '"]').forEach(function (b) { b.classList.toggle('on', k < 0); b.setAttribute('aria-pressed', k < 0); }); counts();
      onChange.forEach(function (f) { f('wish'); });
    });
    var last = 0;
    addEventListener('scroll', function () { var y = scrollY, down = y > last && y > 220; if (menu.classList.contains('open')) return; hd.classList.toggle('hide', down); document.body.classList.toggle('hd-hidden', down); last = y; }, { passive: true });
    // footer wordmark: size it to the footer's width once the serif has loaded, so the last letter never clips
    var wm = $('.ft-wm');
    if (wm) {
      var fit = function () { wm.style.fontSize = ''; var a = wm.clientWidth, s = wm.scrollWidth; if (a && s) wm.style.fontSize = (parseFloat(getComputedStyle(wm).fontSize) * a / s * 0.99).toFixed(2) + 'px'; };
      fit(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
      var ft = 0; addEventListener('resize', function () { clearTimeout(ft); ft = setTimeout(fit, 150); });
    }
    if (fx) G.from($('.ft-wm'), { yPercent: 35, autoAlpha: 0, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: $('.ft-wm'), start: 'top 100%' } });
    counts();
    if (fx) G.from($$('.nl-nav > nav, .nl-logo, .nl-act'), { autoAlpha: 0, y: -14, duration: 1.1, ease: 'power3.out', stagger: .1, delay: .1 });
  }
  function flash(el, m) { if (!el) return; var n = $('.dr-warn', el) || document.createElement('p'); n.className = 'dr-warn'; n.textContent = m; $('.dr-tx', el).appendChild(n); }
  function counts() { var n = cart.reduce(function (a, c) { return a + c.q; }, 0); $('#cartN').textContent = n || ''; $('#wishN').textContent = wish.length || ''; var a = $('#acctL'); if (a) a.textContent = acctLabel(); var m = $('#acctM'); if (m) m.textContent = NL.session() ? 'Your account' : 'Sign in'; }
  function saveCart() { ls.set('cart', cart); counts(); renderCart(); onChange.forEach(function (f) { f('cart'); }); }
  function subtotal() { return cart.reduce(function (a, c) { var p = NL.product(c.id); return a + (p ? p.price * c.q : 0); }, 0); }
  function renderCart() {
    var list = $('.dr-list'); if (!list) return; clean();
    var free = NL.db().set.freeShip;
    list.innerHTML = cart.length ? cart.map(function (c, i) { var p = NL.product(c.id), col = p.colors[c.c] || p.colors[0], st = NL.stock(NL.skuKey(p.id, c.c, c.s)), warn = '';
      if (p.status !== 'active') warn = 'No longer available. Remove it to check out.'; else if (st.avail <= 0) warn = 'Just sold out in this size.'; else if (c.q > st.avail) warn = 'Only ' + st.avail + ' left. We’ll adjust at checkout.'; else if (st.state === 'low') warn = 'Only ' + st.avail + ' left in this size.';
      return '<li class="dr-it"><a class="dr-img" href="' + R + 'product.html?id=' + p.id + '" tabindex="-1" aria-hidden="true">' + img(p) + '</a><div class="dr-tx"><p class="dr-n">' + esc(p.name) + '</p><p class="dr-m">' + esc(col.n) + (c.s !== 'One size' ? ' · ' + esc(c.s) : '') + '</p>' +
        '<p class="dr-q"><button type="button" data-i="' + i + '" data-q="-1" aria-label="One less ' + esc(p.name) + '">−</button><span aria-live="polite">' + c.q + '</span><button type="button" data-i="' + i + '" data-q="1" aria-label="One more ' + esc(p.name) + '">+</button></p>' + (warn ? '<p class="dr-warn">' + warn + '</p>' : '') + '</div>' +
        '<div class="dr-r"><p class="dr-p">' + money(p.price * c.q) + '</p><button type="button" class="dr-rm" data-i="' + i + '" data-rm="1" aria-label="Remove ' + esc(p.name) + '">Remove</button></div></li>'; }).join('')
      : '<li class="dr-empty">Your bag is empty.<span>Pieces you add will wait here, even if you close the tab.</span><a href="' + R + 'shop.html">Start shopping →</a></li>';
    var st = subtotal(); $('.dr-tot b').textContent = money(st);
    $('.dr-ship').textContent = st >= free ? 'You’ve unlocked free standard delivery.' : st ? 'Add ' + money(free - st) + ' more for free standard delivery.' : 'Free standard delivery over ' + money(free) + ' · 30-day returns';
    $('.dr-bar i').style.width = Math.min(100, st / free * 100) + '%';
    $('.dr-ft .nl-btn').classList.toggle('off', !cart.length);
  }
  function lock(o) { document.body.style.overflow = o ? 'hidden' : ''; if (window.Motion && Motion.lenis) o ? Motion.lenis.stop() : Motion.lenis.start(); }
  function openCart() { var d = $('.nl-drawer'); if (!d.hidden && d.classList.contains('open')) return; drawerOpener = document.activeElement; renderCart(); d.hidden = false; lock(true); requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add('open'); if (fx) G.from($$('.dr-it'), { x: 36, autoAlpha: 0, duration: .9, ease: 'power3.out', stagger: .07, delay: .25 }); }); }); setTimeout(function () { $('.dr-x').focus(); }, 60); }
  function closeCart() { var d = $('.nl-drawer'); d.classList.remove('open'); lock(false); setTimeout(function () { d.hidden = true; }, 800); if (drawerOpener && document.contains(drawerOpener)) drawerOpener.focus(); }
  function add(id, c, s, q, quiet) {
    q = q || 1; var st = NL.stock(NL.skuKey(id, c, s)), f = cart.filter(function (x) { return x.id === id && x.c === c && x.s === s; })[0], have = f ? f.q : 0;
    if (have + q > st.avail) { q = st.avail - have; if (q <= 0) return { ok: false, msg: st.avail ? 'You already have the last ' + (st.avail === 1 ? 'one' : st.avail) + ' in your bag.' : 'Sorry, that just sold out.' }; }
    f ? f.q += q : cart.push({ id: id, c: c, s: s, q: q }); NL.track('cart'); saveCart(); if (!quiet) openCart(); return { ok: true, q: q };
  }

  window.NLS = { cart: function () { return cart; }, setCart: function (c) { cart = c; saveCart(); }, wish: function () { return wish; }, add: add, openCart: openCart, card: card, img: img, stars: stars, reveal: reveal, swapIn: swapIn, fx: fx, reduce: reduce, ls: ls, subtotal: subtotal, onChange: onChange, $: $, $$: $$, counts: counts, R: R };

  /* ── pages ── */
  var page = document.body.getAttribute('data-page');
  NL.track('session');
  chrome();
  addEventListener('storage', function (e) { if (e.key === 'nl-cart') { cart = ls.get('cart', []); clean(); counts(); renderCart(); onChange.forEach(function (f) { f('cart'); }); } if (e.key === 'nl-wish') { wish = ls.get('wish', []); counts(); onChange.forEach(function (f) { f('wish'); }); } });
  addEventListener('nl:change', function (e) { var sc = e.detail && e.detail.scope; if (sc === 'session') counts(); if (sc === 'media' || sc === 'products' || sc === 'all' || sc === 'orders' || sc === 'inv') { clean(); renderCart(); counts(); } onChange.forEach(function (f) { f(sc || 'all'); }); });

  function hero() {
    var v = $('#heroV'); if (!v || reduce) return; // reduced motion keeps the still
    function attach() { if (v.src) return; v.src = v.getAttribute('data-src'); v.addEventListener('playing', function () { v.classList.add('on'); }, { once: true });
      var pl = v.play(); if (pl && pl.catch) pl.catch(function () {});
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var q = v.play(); if (q && q.catch) q.catch(function () {}); } else v.pause(); }); }).observe(v); }
    // the poster holds the frame; the 1.2 MB film starts on the first scroll, touch, pointer move or key, or 4 s after load
    var EV = ['scroll', 'pointermove', 'touchstart', 'keydown', 'wheel'];
    function go() { EV.forEach(function (e) { removeEventListener(e, go); }); attach(); }
    EV.forEach(function (e) { addEventListener(e, go, { passive: true, once: true }); });
    function later() { setTimeout(go, 4000); }
    if (document.readyState === 'complete') later(); else addEventListener('load', later);
  }


  if (page === 'home') {
    var newIds = ['harbor-jacket', 'drift-runner', 'coast-sunglasses', 'rib-knit'];
    var homeGrid = function () { var L = newIds.map(NL.product).filter(function (p) { return p && p.status === 'active'; }); NL.products().forEach(function (p) { if (L.length < 4 && L.indexOf(p) < 0 && p.isNew) L.push(p); }); NL.products().forEach(function (p) { if (L.length < 4 && L.indexOf(p) < 0) L.push(p); });
      $('#newGrid').innerHTML = L.slice(0, 4).map(function (p) { return card(p); }).join('');
      var cats = {}; NL.products().forEach(function (p) { cats[p.cat] = (cats[p.cat] || 0) + 1; }); $$('.cats a').forEach(function (a) { var c = new URL(a.href).searchParams.get('cat'); $('span', a).textContent = NL.plural(cats[c] || 0, 'piece'); }); };
    homeGrid(); hero(); reveal($$('#newGrid .pc'));
    onChange.push(function (sc) { if (sc !== 'cart' && sc !== 'session') homeGrid(); });
  }

  if (page === 'shop') shop();
  function shop() {
    var cats = ['Clothing', 'Shoes', 'Bags', 'Accessories'];
    var SIZES = ['XS', 'S', 'M', 'L', 'XL', '39', '40', '41', '42', '43', '44', '45', 'One size'];
    var TONES = [['Neutral', '#DCD2BF'], ['Earth', '#9A5A2B'], ['Green', '#7A8A68'], ['Dark', '#1F1D1B'], ['Blue', '#26324A'], ['Rose', '#C98C86']];
    var SORTS = { featured: 'Featured', newest: 'Newest', low: 'Price, low to high', high: 'Price, high to low', rated: 'Top rated' };
    var MAXP = 13000;
    function tone(n) { return /black|charcoal|ink/i.test(n) ? 'Dark' : /navy|blue/i.test(n) ? 'Blue' : /sage|olive|moss|forest/i.test(n) ? 'Green' : /rose|pink/i.test(n) ? 'Rose' : /rust|cognac|tan|clay|tortoise|honey/i.test(n) ? 'Earth' : 'Neutral'; }
    function fromURL() { var q = new URLSearchParams(location.search); return { cat: cats.indexOf(q.get('cat')) >= 0 ? q.get('cat') : '', size: (q.get('size') || '').split(',').filter(function (s) { return SIZES.indexOf(s) >= 0; }), color: (q.get('color') || '').split(',').filter(function (c) { return TONES.some(function (t) { return t[0] === c; }); }),
      max: Math.min(MAXP, +q.get('max') || MAXP), sort: SORTS[q.get('sort')] ? q.get('sort') : 'featured', wish: q.get('wish') === '1', stock: q.get('stock') === '1', q: (q.get('q') || '').slice(0, 80) }; }
    var st = fromURL();
    function toURL() { var q = new URLSearchParams(); if (st.q) q.set('q', st.q); if (st.wish) q.set('wish', '1'); else if (st.cat) q.set('cat', st.cat); if (st.size.length) q.set('size', st.size.join(',')); if (st.color.length) q.set('color', st.color.join(',')); if (st.max < MAXP) q.set('max', st.max); if (st.stock) q.set('stock', '1'); if (st.sort !== 'featured') q.set('sort', st.sort);
      var s = q.toString().replace(/%2C/g, ','); try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '')); } catch (e) {} }
    $('#sort').innerHTML = Object.keys(SORTS).map(function (k) { return '<option value="' + k + '">' + SORTS[k] + '</option>'; }).join('');
    $('#fSize').innerHTML = SIZES.map(function (s) { return '<button type="button" class="chip" data-size="' + s + '" aria-pressed="false">' + s + '</button>'; }).join('');
    $('#fColor').innerHTML = TONES.map(function (t) { return '<button type="button" class="sw" data-color="' + t[0] + '" style="--c:' + t[1] + '" aria-pressed="false" aria-label="' + t[0] + '" title="' + t[0] + '"></button>'; }).join('');
    $('#fMax').max = MAXP;
    function syncUI() {
      $('#tabs').innerHTML = [['', 'All']].concat(cats.map(function (c) { return [c, c]; })).map(function (t) { return '<button type="button" data-cat="' + t[0] + '" aria-pressed="' + (st.cat === t[0] && !st.wish) + '">' + t[1] + '</button>'; }).join('') + '<button type="button" data-cat="__w" aria-pressed="' + st.wish + '">Saved' + (wish.length ? ' (' + wish.length + ')' : '') + '</button>';
      $$('#fSize .chip').forEach(function (b) { b.setAttribute('aria-pressed', st.size.indexOf(b.getAttribute('data-size')) >= 0); });
      $$('#fColor .sw').forEach(function (b) { b.setAttribute('aria-pressed', st.color.indexOf(b.getAttribute('data-color')) >= 0); });
      $('#fMax').value = st.max; $('#fMaxV').textContent = money(st.max); $('#fStock').checked = st.stock; $('#sort').value = st.sort;
      $('#shopQ').value = st.q;
    }
    function list() {
      var base = NL.products(), fixed = '';
      if (st.q && window.NLSearch) { var r = NLSearch.search(st.q); fixed = r.fixed; var rank = {}; r.hits.forEach(function (h, i) { rank[h.p.id] = i; }); base = base.filter(function (p) { return p.id in rank; }); if (st.sort === 'featured') base.sort(function (a, b) { return rank[a.id] - rank[b.id]; }); }
      var L = base.filter(function (p) {
        if (st.wish && wish.indexOf(p.id) < 0) return false;
        if (st.cat && !st.wish && p.cat !== st.cat) return false;
        if (st.color.length && !p.colors.some(function (c) { return st.color.indexOf(tone(c.n)) >= 0; })) return false;
        if (st.size.length && !p.sizes.some(function (s) { return st.size.indexOf(s) >= 0 && (!st.stock || p.colors.some(function (_, ci) { return NL.stock(NL.skuKey(p.id, ci, s)).avail > 0; })); })) return false;
        if (st.stock && !NL.totalStock(p)) return false;
        return p.price <= st.max;
      });
      if (st.sort === 'low') L.sort(function (a, b) { return a.price - b.price; }); else if (st.sort === 'high') L.sort(function (a, b) { return b.price - a.price; });
      else if (st.sort === 'newest') L.sort(function (a, b) { return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || a.order - b.order; });
      else if (st.sort === 'rated') L.sort(function (a, b) { return NL.reviewStats(b.id).avg - NL.reviewStats(a.id).avg; });
      return { L: L, fixed: fixed };
    }
    function chips() {
      var c = [];
      if (st.q) c.push(['q', '', '“' + st.q + '”']);
      st.size.forEach(function (s) { c.push(['size', s, 'Size ' + s]); }); st.color.forEach(function (s) { c.push(['color', s, s]); });
      if (st.max < MAXP) c.push(['max', '', 'Up to ' + money(st.max)]); if (st.stock) c.push(['stock', '', 'In stock']);
      $('#active').innerHTML = c.length ? c.map(function (x) { return '<button type="button" class="ach" data-rm="' + x[0] + '" data-v="' + esc(x[1]) + '" aria-label="Remove filter: ' + esc(x[2]) + '">' + esc(x[2]) + '<i aria-hidden="true">×</i></button>'; }).join('') + '<button type="button" class="ach-clr" data-clear>Clear all</button>' : '';
      $('#active').hidden = !c.length;
    }
    function run(animate) {
      var r = list(), L = r.L;
      $('#shopGrid').innerHTML = L.length ? L.map(card).join('') :
        '<li class="none">' + (st.wish && !wish.length ? 'Nothing saved yet.<span>Tap the heart on any piece to keep it here.</span><button type="button" data-go="all">Browse all pieces</button>' : st.q && !r.L.length && !NL.products().some(function () { return true; }) ? '' : 'Nothing matches ' + (st.q ? '“' + esc(st.q) + '”' + (r.fixed ? '. Did you mean <button type="button" class="inl" data-fix="' + esc(r.fixed) + '">' + esc(r.fixed) + '</button>?' : '') : 'those filters') + '<span>Try fewer filters or a broader word.</span><button type="button" data-clear>Clear everything</button>') + '</li>';
      $('#count').textContent = NL.plural(L.length, 'piece'); $('#shopN').textContent = '(' + (L.length < 10 ? '0' : '') + L.length + ')';
      $('#shopH').textContent = st.q ? 'Search' : st.wish ? 'Saved' : st.cat || 'All pieces';
      $('#shopSub').innerHTML = st.q ? (r.fixed && L.length ? 'Showing results for <b>' + esc(r.fixed) + '</b> · you searched “' + esc(st.q) + '”' : 'Results for “' + esc(st.q) + '”') : st.wish ? 'Pieces you’ve saved in this browser' : 'Autumn / Winter 2026';
      var nf = st.size.length + st.color.length + (st.max < MAXP ? 1 : 0) + (st.stock ? 1 : 0); $('#fBtn span').textContent = 'Filters' + (nf ? ' (' + nf + ')' : '');
      $('.fp-clear').hidden = !nf; chips(); toURL();
      if (animate) swapIn($$('#shopGrid .pc')); else reveal($$('#shopGrid .pc'));
    }
    function clearAll() { st = { cat: st.wish ? '' : st.cat, size: [], color: [], max: MAXP, sort: st.sort, wish: false, stock: false, q: '' }; syncUI(); run(true); }
    $('#tabs').addEventListener('click', function (e) { var b = e.target.closest('[data-cat]'); if (!b) return; var c = b.getAttribute('data-cat'); if (c === '__w') { st.wish = true; st.cat = ''; } else { st.wish = false; st.cat = c; } syncUI(); run(true); });
    $('#shopGrid').addEventListener('click', function (e) { if (e.target.closest('[data-clear]')) clearAll(); if (e.target.closest('[data-go]')) { st.wish = false; syncUI(); run(true); } var f = e.target.closest('[data-fix]'); if (f) { st.q = f.getAttribute('data-fix'); syncUI(); run(true); } });
    $('#active').addEventListener('click', function (e) { if (e.target.closest('[data-clear]')) { clearAll(); return; } var b = e.target.closest('[data-rm]'); if (!b) return; var k = b.getAttribute('data-rm'), v = b.getAttribute('data-v');
      if (k === 'size' || k === 'color') st[k] = st[k].filter(function (x) { return x !== v; }); else if (k === 'max') st.max = MAXP; else if (k === 'stock') st.stock = false; else if (k === 'q') st.q = ''; syncUI(); run(true); });
    $('.fpanel').addEventListener('click', function (e) { var b = e.target.closest('[data-size],[data-color]'); if (!b) return; var k = b.hasAttribute('data-size') ? 'size' : 'color', v = b.getAttribute('data-' + k), i = st[k].indexOf(v);
      i >= 0 ? st[k].splice(i, 1) : st[k].push(v); b.setAttribute('aria-pressed', i < 0); run(true); });
    $('.fp-clear').addEventListener('click', clearAll);
    $('#fMax').addEventListener('input', function (e) { st.max = +e.target.value; $('#fMaxV').textContent = money(st.max); run(true); });
    $('#fStock').addEventListener('change', function (e) { st.stock = e.target.checked; run(true); });
    $('#sort').addEventListener('change', function (e) { st.sort = e.target.value; run(true); });
    $('#fBtn').addEventListener('click', function () { var f = $('.fpanel'), o = f.classList.toggle('open'); this.setAttribute('aria-expanded', o); });
    var qt; $('#shopQ').addEventListener('input', function (e) { clearTimeout(qt); qt = setTimeout(function () { st.q = e.target.value.trim(); run(true); }, 180); });
    $('#shopQf').addEventListener('submit', function (e) { e.preventDefault(); st.q = $('#shopQ').value.trim(); if (st.q && window.NLSearch) NLSearch.remember(st.q); run(true); });
    addEventListener('popstate', function () { st = fromURL(); syncUI(); run(true); });
    onChange.push(function (sc) { if (sc === 'cart' || sc === 'session') return; syncUI(); run(false); });
    syncUI(); run(false);
    if (fx) { G.from($$('.sh-hd .eyebrow, .sh-hd h1'), { autoAlpha: 0, y: 40, duration: 1.3, ease: 'power4.out', stagger: .12, delay: .15 }); }
  }

  renderCart();
  addEventListener('load', function () { if (fx) setTimeout(function () { ST.refresh(); }, 200); });
})();

/* videos load and play only while on screen */
(function () {
  var vids = [].slice.call(document.querySelectorAll('video.lazyv')); if (!vids.length) return;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function load(v) { if (!v.src) v.src = (matchMedia('(max-width:700px)').matches && v.getAttribute('data-src-sm')) || v.getAttribute('data-src'); }
  if (!('IntersectionObserver' in window)) { vids.forEach(function (v) { load(v); if (!still) v.play(); }); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { var v = e.target;
    if (e.isIntersecting) { load(v); if (!still) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } } else v.pause(); }); }, { rootMargin: '200px 0px' });
  vids.forEach(function (v) { io.observe(v); });
  var po = new IntersectionObserver(function (es) { es.forEach(function (e) { var v = e.target; if (e.isIntersecting && v.getAttribute('data-poster') && !v.poster) { v.poster = v.getAttribute('data-poster'); po.unobserve(v); } }); }, { rootMargin: '900px 0px' });
  vids.forEach(function (v) { if (v.getAttribute('data-poster')) po.observe(v); });
})();

(function () { var f = document.getElementById('news'); if (f) f.addEventListener('submit', function (e) { e.preventDefault(); var ok = document.getElementById('newsOk'); ok.hidden = false; ok.textContent = 'Thank you. You’re on the list. Use WELCOME10 on your first order.'; f.reset(); }); })();
