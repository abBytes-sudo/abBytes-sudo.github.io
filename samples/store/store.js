/* Northlane: a demo clothing & accessories store (design sample). Cart, wishlist and recently viewed live in this browser only. */
(function () {
  'use strict';
  var CAT = window.NLCAT, P = CAT.P, byId = CAT.byId;
  var G = window.gsap, ST = window.ScrollTrigger, SPLIT = window.SplitText;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fx = !!(G && ST && window.Motion && !window.Motion.reduce && !reduce);

  var store = {
    get: function (k, d) { try { var v = JSON.parse(localStorage.getItem('nl-' + k)); return v == null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('nl-' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var cart = store.get('cart', []).filter(function (c) { return byId[c.id]; }), wish = store.get('wish', []);
  var money = function (n) { return '$' + n.toFixed(n % 1 ? 2 : 0); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9-9.6C2 7.5 4 4.8 6.9 4.8c1.9 0 3.4 1 5.1 3 1.7-2 3.2-3 5.1-3C20 4.8 22 7.5 21 10.9c-1.5 5-9 9.6-9 9.6z"/></svg>';
  var IMG = function (p, eager) { return '<img src="products/' + p.id + '.jpg" alt="' + esc(p.alt) + '" width="900" height="1125" ' + (eager ? '' : 'loading="lazy"') + ' decoding="async">'; };
  var ARROW = '<span class="arrow" aria-hidden="true">→</span>';

  /* in-view reveal for JS-rendered lists (static markup uses motion.js attributes) */
  function reveal(els) {
    els = [].slice.call(els).filter(function (e) { return e.getBoundingClientRect().top > innerHeight * .92; }); if (!fx || !els.length) return;
    G.set(els, { autoAlpha: 0, y: 40 });
    ST.batch(els, { start: 'top 94%', once: true, onEnter: function (b) { G.to(b, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power4.out', stagger: .08, overwrite: true }); } });
  }
  function swapIn(els) { els = [].slice.call(els); if (!fx || !els.length) return; G.fromTo(els, { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .9, ease: 'power3.out', stagger: .05, overwrite: true }); }

  function card(p, i) {
    var w = wish.indexOf(p.id) >= 0;
    return '<li class="pc"><a class="pc-a" href="product.html?id=' + p.id + '"><div class="pc-img">' + IMG(p, typeof i === 'number' && i < 4) + (p.isNew ? '<span class="pc-new">New</span>' : '') + '<span class="pc-view">View piece</span></div>' +
      '<div class="pc-tx"><p class="pc-n">' + esc(p.name) + '</p><p class="pc-p">' + money(p.price) + '</p></div><p class="pc-m">' + p.cat + ' · ' + p.colors[0].n + '</p></a>' +
      '<button class="pc-w' + (w ? ' on' : '') + '" type="button" data-wish="' + p.id + '" aria-pressed="' + w + '" aria-label="Save ' + esc(p.name) + ' to wishlist">' + HEART + '</button></li>';
  }

  /* ── shared chrome: header, menu, cart drawer, footer ── */
  var drawerOpener = null;
  function chrome() {
    var hd = document.createElement('header'); hd.className = 'nl-hd';
    hd.innerHTML = '<div class="nl-bar"><b>Fictional · design sample by <a href="../../index.html">Abhishek</a></b></div>' +
      '<div class="nl-nav"><nav aria-label="Shop"><a href="shop.html">Shop</a><a href="shop.html?cat=Clothing">Clothing</a><a href="shop.html?cat=Shoes">Shoes</a><a href="shop.html?cat=Bags">Bags</a><a href="shop.html?cat=Accessories">Accessories</a></nav>' +
      '<button class="nl-menubtn" type="button" aria-label="Open menu" aria-expanded="false">Menu</button>' +
      '<a class="nl-logo" href="index.html" aria-label="Northlane, home">Northlane</a>' +
      '<div class="nl-act"><a href="../orders/track.html" class="hm">Track order</a><a href="shop.html?wish=1" class="hm">Saved<span class="nl-c" id="wishN"></span></a><button class="nl-cartbtn" type="button" aria-label="Open bag">Bag<span class="nl-c" id="cartN"></span></button></div></div>';
    document.body.prepend(hd);
    var skip = document.createElement('a'); skip.className = 'skip'; skip.href = '#main'; skip.textContent = 'Skip to content'; document.body.prepend(skip);
    var mn = $('main'); if (mn && !mn.id) mn.id = 'main';
    var menu = document.createElement('div'); menu.className = 'nl-menu'; menu.setAttribute('aria-label', 'Menu'); menu.setAttribute('data-lenis-prevent', '');
    menu.innerHTML = '<a href="index.html">Home</a><a href="shop.html">Shop all</a><a href="shop.html?cat=Clothing">Clothing</a><a href="shop.html?cat=Shoes">Shoes</a><a href="shop.html?cat=Bags">Bags</a><a href="shop.html?cat=Accessories">Accessories</a><a class="sm" href="../orders/track.html">Track an order</a><a class="sm" href="shop.html?wish=1">Saved pieces</a>';
    var mx = document.createElement('button'); mx.className = 'nl-menuX'; mx.type = 'button'; mx.textContent = 'Close';
    document.body.appendChild(menu); document.body.appendChild(mx);
    var mb = $('.nl-menubtn');
    function menuSet(o) { menu.classList.toggle('open', o); mb.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; if (window.Motion && Motion.lenis) o ? Motion.lenis.stop() : Motion.lenis.start(); if (o) hd.classList.remove('hide'); }
    mb.addEventListener('click', function () { menuSet(true); }); mx.addEventListener('click', function () { menuSet(false); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { menuSet(false); }); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) menuSet(false); });

    var dr = document.createElement('aside'); dr.className = 'nl-drawer'; dr.setAttribute('aria-label', 'Shopping bag'); dr.hidden = true;
    dr.innerHTML = '<div class="dr-sh"></div><div class="dr-pn" role="dialog" aria-modal="true" aria-labelledby="drH" data-lenis-prevent><div class="dr-hd"><h2 id="drH">Your bag</h2><button type="button" class="dr-x">Close</button></div><ul class="dr-list"></ul><div class="dr-ft"><p class="dr-tot"><span>Subtotal</span><b></b></p><div class="dr-bar" aria-hidden="true"><i></i></div><p class="dr-ship"></p><a class="nl-btn" href="checkout.html">Checkout</a></div></div>';
    document.body.appendChild(dr);
    var ft = document.createElement('footer'); ft.className = 'nl-ft';
    ft.innerHTML = '<div class="ft-g"><div><p class="ft-t">Made to be lived in.</p><p class="ft-n">Northlane is a fictional brand. This is a design and development sample by <a href="../../index.html">Abhishek</a>: no orders are taken, no payment is made, and everything you save stays in this browser.</p></div>' +
      '<div><h4>Shop</h4><ul><li><a href="shop.html">All pieces</a></li><li><a href="shop.html?cat=Clothing">Clothing</a></li><li><a href="shop.html?cat=Shoes">Shoes</a></li><li><a href="shop.html?cat=Bags">Bags</a></li><li><a href="shop.html?cat=Accessories">Accessories</a></li></ul></div>' +
      '<div><h4>Help</h4><ul><li><a href="../orders/track.html">Track an order</a></li><li><a href="checkout.html">Checkout (demo)</a></li><li><a href="shop.html?wish=1">Saved pieces</a></li></ul></div>' +
      '<div><h4>Demo</h4><ul><li><a href="../orders/admin.html">Store admin</a></li><li><a href="../../index.html#examples">Back to portfolio</a></li></ul></div></div>' +
      '<div class="ft-wm" aria-hidden="true">Northlane</div>' +
      '<div class="ft-b"><span>© Northlane, a fictional brand</span><span>Photos: Unsplash. Video: Pexels.</span></div>';
    document.body.appendChild(ft);

    $('.nl-cartbtn').addEventListener('click', openCart);
    $('.dr-x', dr).addEventListener('click', closeCart); $('.dr-sh', dr).addEventListener('click', closeCart);
    document.addEventListener('keydown', function (e) {
      if (dr.hidden) return;
      if (e.key === 'Escape') { closeCart(); return; }
      if (e.key === 'Tab') { var f = $$('button,a[href]', dr).filter(function (x) { return !x.disabled && x.offsetParent !== null; }); if (!f.length) return; var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    });
    dr.addEventListener('click', function (e) {
      var b = e.target.closest('[data-q],[data-rm]'); if (!b) return; var i = +b.getAttribute('data-i');
      if (b.hasAttribute('data-rm')) cart.splice(i, 1); else { cart[i].q += +b.getAttribute('data-q'); if (cart[i].q <= 0) cart.splice(i, 1); }
      saveCart();
    });
    document.addEventListener('click', function (e) {
      var w = e.target.closest('[data-wish]'); if (!w) return; e.preventDefault();
      var id = w.getAttribute('data-wish'), k = wish.indexOf(id); k >= 0 ? wish.splice(k, 1) : wish.push(id); store.set('wish', wish);
      $$('[data-wish="' + id + '"]').forEach(function (b) { b.classList.toggle('on', k < 0); b.setAttribute('aria-pressed', k < 0); }); counts();
    });
    // header tucks away when scrolling down, returns on the way up
    var last = 0;
    addEventListener('scroll', function () { var y = scrollY, down = y > last && y > 220; if (menu.classList.contains('open')) return; hd.classList.toggle('hide', down); document.body.classList.toggle('hd-hidden', down); last = y; }, { passive: true });
    if (fx) G.from($('.ft-wm'), { yPercent: 35, autoAlpha: 0, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: $('.ft-wm'), start: 'top 100%' } });
    counts();
    // hero-style intro for the header on every page
    if (fx) G.from($$('.nl-nav > nav, .nl-logo, .nl-act'), { autoAlpha: 0, y: -14, duration: 1.1, ease: 'power3.out', stagger: .1, delay: .1 });
  }
  function counts() { var n = cart.reduce(function (a, c) { return a + c.q; }, 0); $('#cartN').textContent = n || ''; $('#wishN').textContent = wish.length || ''; }
  function saveCart() { store.set('cart', cart); counts(); renderCart(); }
  function subtotal() { return cart.reduce(function (a, c) { return a + byId[c.id].price * c.q; }, 0); }
  function renderCart() {
    var list = $('.dr-list'); if (!list) return;
    list.innerHTML = cart.length ? cart.map(function (c, i) { var p = byId[c.id], col = p.colors[c.c] || p.colors[0];
      return '<li class="dr-it"><a class="dr-img" href="product.html?id=' + p.id + '" tabindex="-1" aria-hidden="true">' + IMG(p) + '</a><div class="dr-tx"><p class="dr-n">' + esc(p.name) + '</p><p class="dr-m">' + esc(col.n) + ' · ' + esc(c.s) + '</p>' +
        '<p class="dr-q"><button type="button" data-i="' + i + '" data-q="-1" aria-label="One less ' + esc(p.name) + '">−</button><span aria-live="polite">' + c.q + '</span><button type="button" data-i="' + i + '" data-q="1" aria-label="One more ' + esc(p.name) + '">+</button></p></div>' +
        '<div style="text-align:right"><p class="dr-p">' + money(p.price * c.q) + '</p><button type="button" class="dr-rm" data-i="' + i + '" data-rm="1" aria-label="Remove ' + esc(p.name) + '">Remove</button></div></li>'; }).join('')
      : '<li class="dr-empty">Your bag is empty.<a href="shop.html">Start shopping →</a></li>';
    var st = subtotal(); $('.dr-tot b').textContent = money(st);
    $('.dr-ship').textContent = st >= 150 ? 'You’ve unlocked free shipping.' : st ? 'Add ' + money(150 - st) + ' more for free shipping.' : 'Free shipping over $150 · 30-day returns';
    $('.dr-bar i').style.width = Math.min(100, st / 150 * 100) + '%';
    $('.dr-ft .nl-btn').classList.toggle('off', !cart.length);
  }
  function lock(o) { document.body.style.overflow = o ? 'hidden' : ''; if (window.Motion && Motion.lenis) o ? Motion.lenis.stop() : Motion.lenis.start(); }
  function openCart() { var d = $('.nl-drawer'); drawerOpener = document.activeElement; renderCart(); d.hidden = false; lock(true); requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add('open'); if (fx) G.from($$('.dr-it'), { x: 36, autoAlpha: 0, duration: .9, ease: 'power3.out', stagger: .07, delay: .25 }); }); }); setTimeout(function () { $('.dr-x').focus(); }, 60); }
  function closeCart() { var d = $('.nl-drawer'); d.classList.remove('open'); lock(false); setTimeout(function () { d.hidden = true; }, 800); if (drawerOpener && document.contains(drawerOpener)) drawerOpener.focus(); }
  function add(id, c, s) { var f = cart.filter(function (x) { return x.id === id && x.c === c && x.s === s; })[0]; f ? f.q++ : cart.push({ id: id, c: c, s: s, q: 1 }); saveCart(); openCart(); }

  /* ── pages ── */
  var page = document.body.getAttribute('data-page');
  chrome();

  function hero() {
    var v = $('#heroV'), h1 = $('.hero h1'), media = $('.hero-media');
    if (v) {
      if (reduce) { v.removeAttribute('autoplay'); v.pause(); }
      else { var pl = v.play(); if (pl && pl.catch) pl.catch(function () {}); if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var q = v.play(); if (q && q.catch) q.catch(function () {}); } else v.pause(); }); }).observe(v); }
    }
    if (!fx) return;
    var lines = null, small = $$('.hero [data-hi]').filter(function (e) { return e !== h1 && e !== media; });
    function go() {
      var tl = G.timeline({ defaults: { ease: 'power4.out' } });
      if (SPLIT) { var s = new SPLIT(h1, { type: 'lines', mask: 'lines', linesClass: 'm-line' }); lines = s.lines; G.set(lines, { yPercent: 115 }); }
      G.set(h1, { autoAlpha: 1 });
      G.set(small, { autoAlpha: 0, y: 24 });
      tl.to(media, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.7, ease: 'expo.inOut' }, 0)
        .fromTo($('video,img', media), { scale: 1.35 }, { scale: 1, duration: 2.4, ease: 'expo.out' }, 0.1);
      if (lines) tl.to(lines, { yPercent: 0, duration: 1.5, stagger: .14 }, .35); else tl.to(h1, { y: 0, duration: 1.2 }, .35);
      tl.to(small, { autoAlpha: 1, y: 0, duration: 1.2, stagger: .1 }, 1.0);
    }
    var done = false; function once() { if (!done) { done = true; go(); } }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(once); setTimeout(once, 1800);
  }

  if (page === 'home') {
    $('#newGrid').innerHTML = ['harbor-jacket', 'drift-runner', 'coast-sunglasses', 'rib-knit'].map(function (id) { return card(byId[id]); }).join('');
    hero(); reveal($$('#newGrid .pc'));
  }

  if (page === 'shop') {
    var q = new URLSearchParams(location.search), cats = ['Clothing', 'Shoes', 'Bags', 'Accessories'];
    var st = { cat: cats.indexOf(q.get('cat')) >= 0 ? q.get('cat') : '', size: [], color: [], max: 250, sort: 'featured', wish: q.get('wish') === '1' };
    var sizes = ['XS', 'S', 'M', 'L', 'XL', '39', '40', '41', '42', '43', '44', '45', 'One size'];
    var tones = [['Neutral', '#DCD2BF'], ['Earth', '#9A5A2B'], ['Green', '#7A8A68'], ['Dark', '#1F1D1B'], ['Blue', '#26324A']];
    function tone(n) { return /black|charcoal|ink/i.test(n) ? 'Dark' : /navy|blue/i.test(n) ? 'Blue' : /sage|olive|moss|forest/i.test(n) ? 'Green' : /rust|cognac|tan|clay|tortoise|honey|rose/i.test(n) ? 'Earth' : 'Neutral'; }
    $('#tabs').innerHTML = [['', 'All']].concat(cats.map(function (c) { return [c, c]; })).map(function (t) { return '<button type="button" data-cat="' + t[0] + '" aria-pressed="' + (st.cat === t[0] && !st.wish) + '">' + t[1] + '</button>'; }).join('') + '<button type="button" data-cat="__w" aria-pressed="' + st.wish + '">Saved</button>';
    $('#fSize').innerHTML = sizes.map(function (s) { return '<button type="button" class="chip" data-size="' + s + '" aria-pressed="false">' + s + '</button>'; }).join('');
    $('#fColor').innerHTML = tones.map(function (t) { return '<button type="button" class="sw" data-color="' + t[0] + '" style="--c:' + t[1] + '" aria-pressed="false" aria-label="' + t[0] + '" title="' + t[0] + '"></button>'; }).join('');
    function run(animate) {
      var list = P.filter(function (p) {
        if (st.wish && wish.indexOf(p.id) < 0) return false;
        if (st.cat && p.cat !== st.cat) return false;
        if (st.size.length && !p.sizes.some(function (s) { return st.size.indexOf(s) >= 0; })) return false;
        if (st.color.length && st.color.indexOf(tone(p.colors[0].n)) < 0) return false;
        return p.price <= st.max;
      });
      if (st.sort === 'low') list.sort(function (a, b) { return a.price - b.price; }); else if (st.sort === 'high') list.sort(function (a, b) { return b.price - a.price; });
      $('#shopGrid').innerHTML = list.length ? list.map(card).join('') : '<li class="none">' + (st.wish ? 'You haven’t saved anything yet.' : 'Nothing matches those filters.') + '<button type="button" id="clr">' + (st.wish ? 'Browse all pieces' : 'Clear filters') + '</button></li>';
      $('#count').textContent = list.length + (list.length === 1 ? ' piece' : ' pieces'); $('#shopN').textContent = '(' + (list.length < 10 ? '0' : '') + list.length + ')';
      $('#shopH').textContent = st.wish ? 'Saved' : st.cat || 'All pieces';
      var nf = st.size.length + st.color.length + (st.max < 250 ? 1 : 0); $('#fBtn span').textContent = 'Filters' + (nf ? ' (' + nf + ')' : '');
      $('.fp-clear').hidden = !nf;
      if (animate) swapIn($$('#shopGrid .pc')); else reveal($$('#shopGrid .pc'));
    }
    function clearAll() { st.cat = ''; st.size = []; st.color = []; st.max = 250; st.wish = false; $$('[aria-pressed="true"]', $('.fpanel')).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); $('#fMax').value = 250; $('#fMaxV').textContent = '$250'; setTabs(); run(true); }
    function setTabs() { $$('#tabs button').forEach(function (b) { var c = b.getAttribute('data-cat'); b.setAttribute('aria-pressed', c === '__w' ? st.wish : (!st.wish && c === st.cat)); }); }
    $('#tabs').addEventListener('click', function (e) { var b = e.target.closest('[data-cat]'); if (!b) return; var c = b.getAttribute('data-cat'); if (c === '__w') { st.wish = true; st.cat = ''; } else { st.wish = false; st.cat = c; } setTabs(); run(true); });
    $('#shopGrid').addEventListener('click', function (e) { if (e.target.id === 'clr') { st.wish ? (st.wish = false, setTabs(), run(true)) : clearAll(); } });
    $('.fpanel').addEventListener('click', function (e) { var b = e.target.closest('[data-size],[data-color]'); if (!b) return; var k = b.hasAttribute('data-size') ? 'size' : 'color', v = b.getAttribute('data-' + k), i = st[k].indexOf(v);
      i >= 0 ? st[k].splice(i, 1) : st[k].push(v); b.setAttribute('aria-pressed', i < 0); run(true); });
    $('.fp-clear').addEventListener('click', clearAll);
    $('#fMax').addEventListener('input', function (e) { st.max = +e.target.value; $('#fMaxV').textContent = '$' + st.max; run(true); });
    $('#sort').addEventListener('change', function (e) { st.sort = e.target.value; run(true); });
    $('#fBtn').addEventListener('click', function () { var f = $('.fpanel'), o = f.classList.toggle('open'); this.setAttribute('aria-expanded', o); });
    run(false);
    if (fx) { G.from($$('.sh-hd .eyebrow, .sh-hd h1'), { autoAlpha: 0, y: 40, duration: 1.3, ease: 'power4.out', stagger: .12, delay: .15 }); }
  }

  if (page === 'product') {
    var p = byId[new URLSearchParams(location.search).get('id')] || P[0], si = -1;
    document.title = p.name + ' · Northlane (demo store)';
    var rec = store.get('recent', []).filter(function (x) { return x !== p.id && byId[x]; }); rec.unshift(p.id); store.set('recent', rec.slice(0, 6));
    $('#crumb').innerHTML = '<a href="index.html">Northlane</a> / <a href="shop.html?cat=' + p.cat + '">' + p.cat + '</a> / <span>' + esc(p.name) + '</span>';
    $('#pName').textContent = p.name; $('#pPrice').textContent = money(p.price); $('#pDesc').textContent = p.desc; $('#pFor').textContent = p.for + ' · ' + p.cat + (p.isNew ? ' · New' : '');
    $('#pMat').textContent = p.mat;
    var f = function (d, cls) { return '<div class="f ' + cls + '"><img src="products/' + p.id + '.jpg" alt="' + (cls === 'd' ? 'Detail of the ' + esc(p.name) : esc(p.alt)) + '" width="900" height="1125"' + (d ? ' style="transform-origin:' + d[0] + '% ' + d[1] + '%" loading="lazy"' : ' fetchpriority="high"') + ' decoding="async">'; };
    $('#gal').innerHTML = f(null, 'm') + '</div>' + f(p.dp[0], 'd') + '</div>' + f(p.dp[1], 'd') + '</div>';
    var dots = document.createElement('div'); dots.className = 'gal-dots'; dots.setAttribute('aria-hidden', 'true'); dots.innerHTML = '<i class="on"></i><i></i><i></i>'; $('#gal').after(dots);
    $('#gal').addEventListener('scroll', function () { var g = this, k = Math.round(g.scrollLeft / g.clientWidth); $$('i', dots).forEach(function (d, i) { d.classList.toggle('on', i === k); }); }, { passive: true });
    if (matchMedia('(hover:hover)').matches) $$('#gal .f.m').forEach(function (fr) { var im = $('img', fr);
      fr.addEventListener('mouseenter', function () { fr.classList.add('z'); });
      fr.addEventListener('mousemove', function (e) { var r = fr.getBoundingClientRect(); im.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%'; });
      fr.addEventListener('mouseleave', function () { fr.classList.remove('z'); }); });
    // one honest colourway: the one in the photograph; the others are listed, not faked
    var c0 = p.colors[0], others = p.colors.slice(1).map(function (c) { return c.n; });
    $('#pCol').textContent = c0.n;
    $('#pColors').innerHTML = '<span class="sw" style="--c:' + c0.h + '" role="img" aria-label="' + esc(c0.n) + ' (shown)" aria-pressed="true"></span><span class="sw-note">Shown in ' + esc(c0.n) + '. Also in ' + esc(others.join(' and ')) + ' from the next drop.</span>';
    $('#pSizes').innerHTML = p.sizes.map(function (s, i) { return '<button type="button" class="chip" data-si="' + i + '" aria-pressed="false">' + s + '</button>'; }).join('');
    if (p.sizes.length === 1) { si = 0; $$('#pSizes .chip')[0].setAttribute('aria-pressed', 'true'); }
    // size guide for clothing, dimensions for everything else
    var clothing = p.cat === 'Clothing';
    $('#acdSizeT').textContent = clothing ? 'Size guide' : 'Details & dimensions'; $('#sizeLink').textContent = clothing ? 'Size guide' : 'Dimensions';
    $('#acdSizeB').innerHTML = clothing ? '<table><tr><th>Size</th><th>Chest (cm)</th><th>Length (cm)</th></tr><tr><td>XS</td><td>88</td><td>66</td></tr><tr><td>S</td><td>94</td><td>68</td></tr><tr><td>M</td><td>100</td><td>70</td></tr><tr><td>L</td><td>106</td><td>72</td></tr><tr><td>XL</td><td>112</td><td>74</td></tr></table>'
      : '<table>' + (p.dims || []).map(function (d) { return '<tr><th>' + esc(d[0]) + '</th><td>' + esc(d[1]) + '</td></tr>'; }).join('') + '</table>';
    $('#pSizes').addEventListener('click', function (e) { var b = e.target.closest('[data-si]'); if (!b) return; si = +b.getAttribute('data-si'); $$('#pSizes .chip').forEach(function (x, i) { x.setAttribute('aria-pressed', i === si); }); $('#pErr').hidden = true; });
    function addNow() { if (si < 0) { $('#pErr').hidden = false; $('#pSizes').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); return; } add(p.id, 0, p.sizes[si]); }
    $('#pAdd').addEventListener('click', addNow);
    var bb = document.createElement('div'); bb.className = 'buybar'; bb.innerHTML = '<button class="nl-btn" type="button">Add to bag · ' + money(p.price) + '</button>'; document.body.appendChild(bb); $('button', bb).addEventListener('click', addNow);
    $('#pWish').setAttribute('data-wish', p.id); if (wish.indexOf(p.id) >= 0) { $('#pWish').classList.add('on'); $('#pWish').setAttribute('aria-pressed', 'true'); }
    $('#sizeLink').addEventListener('click', function () { var it = $('#acd-size'); if (!it.classList.contains('open')) toggleAcd(it); it.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); });
    function toggleAcd(it) { var o = it.classList.toggle('open'); $('.acd-h', it).setAttribute('aria-expanded', o); }
    $('.acd').addEventListener('click', function (e) { var h = e.target.closest('.acd-h'); if (h) toggleAcd(h.parentNode); });
    var look = p.look.map(function (id) { return byId[id]; });
    $('#look').innerHTML = look.map(card).join('');
    var rv = rec.slice(1, 5).map(function (id) { return byId[id]; }).filter(Boolean);
    if (rv.length) { $('#recentWrap').hidden = false; $('#recent').innerHTML = rv.map(card).join(''); }
    reveal($$('#look .pc, #recent .pc'));
    if (fx) { G.from($$('#crumb, .pdp-box > *'), { autoAlpha: 0, y: 28, duration: 1.2, ease: 'power4.out', stagger: .06, delay: .1 });
      G.from($$('#gal .f'), { clipPath: 'inset(8% 6% 8% 6%)', autoAlpha: 0, duration: 1.5, ease: 'expo.out', stagger: .12, delay: .1 }); }
  }

  if (page === 'checkout') {
    var shipM = 'std';
    function ship(s) { return !s ? 0 : shipM === 'exp' ? 18 : s >= 150 ? 0 : 8; }
    function sum() {
      $('#coList').innerHTML = cart.length ? cart.map(function (c) { var p = byId[c.id], col = p.colors[c.c] || p.colors[0];
        return '<li><div class="co-im">' + IMG(p) + '<span class="co-q">' + c.q + '</span></div><div><p class="dr-n">' + esc(p.name) + '</p><p class="dr-m">' + esc(col.n) + ' · ' + esc(c.s) + '</p></div><p class="dr-p">' + money(p.price * c.q) + '</p></li>'; }).join('')
        : '<li class="dr-empty" style="grid-template-columns:1fr">Your bag is empty.<a href="shop.html">Start shopping →</a></li>';
      var s = subtotal(), sh = ship(s);
      $('#coSub').textContent = money(s); $('#coShip').textContent = sh ? money(sh) : 'Free'; $('#coTot').textContent = money(s + sh);
      $('#coBtn').classList.toggle('off', !cart.length);
    }
    sum();
    $('#coForm').addEventListener('change', function (e) { if (e.target.name === 'sh') { shipM = e.target.value; sum(); } });
    $('#coForm').addEventListener('submit', function (e) {
      e.preventDefault(); if (!cart.length) return;
      var ins = $$('#coForm input:not([type=radio])'), email = ins[0].value.trim(), name = (ins[1].value + ' ' + ins[2].value).trim(), id = '';
      var o = null;
      if (window.NLO) { // same data the admin and the tracking page use (this browser only)
        var S = NLO.load(), mx = S.orders.reduce(function (a, x) { return Math.max(a, +x.id.slice(3)); }, 10000); id = 'NL-' + (mx + 1);
        o = { id: id, email: email.toLowerCase(), name: name, addr: { l1: ins[3].value.trim(), city: ins[4].value.trim(), pc: ins[5].value.trim(), cn: 'United States' },
          items: cart.map(function (c) { return { id: c.id, c: c.c, s: c.s, q: c.q }; }), method: shipM === 'exp' ? 'Express' : 'Standard', pay: { status: 'Paid', method: 'Demo checkout' }, status: 'placed', ev: { placed: Date.now() } };
        o.ship = ship(subtotal()); S.orders.unshift(o); NLO.save(S);
      } else id = 'NL-' + (10500 + Math.floor(Math.random() * 400));
      $('#coNum').textContent = id;
      $('#coTrack').href = '../orders/track.html?o=' + encodeURIComponent(id) + '&e=' + encodeURIComponent(email);
      $('#coFields').hidden = true; $('#coDone').hidden = false; cart = []; saveCart();
      $('#coDone h2').focus(); $('#coDone').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
    if (fx) G.from($$('.co h1, .co-demo, .co form, .co-sum'), { autoAlpha: 0, y: 36, duration: 1.2, ease: 'power4.out', stagger: .1, delay: .1 });
  }

  renderCart();
  if (page === 'home') { /* hero handled above */ }
  // refresh scroll positions once images and fonts settle
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
})();

(function () { var f = document.getElementById('news'); if (f) f.addEventListener('submit', function (e) { e.preventDefault(); document.getElementById('newsOk').hidden = false; f.reset(); }); })();
