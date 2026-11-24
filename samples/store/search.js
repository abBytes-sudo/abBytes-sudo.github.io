/* Northlane search: typo-tolerant product search (edit distance + synonyms) and the instant search overlay. Needs nl-data.js. */
(function () {
  'use strict';
  var NL = window.NL; if (!NL) return;
  var SYN = {
    sweater: ['knit'], jumper: ['knit'], pullover: ['knit'], knitwear: ['knit'], cardigan: ['knit'], wool: ['merino', 'knit'], rollneck: ['knit'], turtleneck: ['knit'],
    sneaker: ['shoes'], sneakers: ['shoes'], boot: ['boot', 'shoes'], boots: ['boot', 'shoes'], footwear: ['shoes'], loafer: ['brogue'], loafers: ['brogue'], shoe: ['shoes'], suede: ['suede'],
    bag: ['bags'], handbag: ['bags'], purse: ['crossbody', 'bags'], sling: ['crossbody'], laptop: ['tote'], leather: ['leather'],
    shades: ['sunglasses'], sunnies: ['sunglasses'], glasses: ['sunglasses'], specs: ['sunglasses'],
    hat: ['cap'], trucker: ['cap'], tshirt: ['tee'], 't-shirt': ['tee'], shirt: ['tee'], top: ['tee', 'knit'],
    pants: ['trousers'], chinos: ['trousers'], bottoms: ['trousers'], coat: ['jacket'], bomber: ['jacket'], outerwear: ['jacket'], sweatshirt: ['hoodie'], hoody: ['hoodie'],
    blue: ['navy', 'ink'], grey: ['charcoal', 'stone'], gray: ['charcoal', 'stone'], brown: ['cognac', 'tan', 'tortoise'], green: ['sage', 'olive', 'moss', 'forest'], white: ['white', 'cream', 'bone', 'chalk', 'ivory'], red: ['rust', 'rose', 'clay'], beige: ['sand', 'oat', 'stone', 'bone'], pink: ['rose'], cream: ['cream', 'ivory', 'bone'],
    watch: ['meridian', 'watch'], watches: ['meridian', 'watch'], timepiece: ['meridian'], gift: ['accessories'], mens: ['men', 'unisex'], womens: ['women', 'unisex'], men: ['men', 'unisex'], women: ['women', 'unisex']
  };
  var STOP = { the: 1, a: 1, an: 1, and: 1, in: 1, for: 1, of: 1, with: 1, to: 1, on: 1 };
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '').replace(/[^a-z0-9₹ -]/g, ' '); }
  function toks(s) { return norm(s).split(/[\s-]+/).filter(function (t) { return t && !STOP[t]; }); }
  // optimal string alignment distance (counts a swapped pair as one edit: "toet" → "tote")
  function dist(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var d = [], i, j; for (i = 0; i <= a.length; i++) { d[i] = [i]; } for (j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) { var lo = 1e9; for (j = 1; j <= b.length; j++) { var c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      if (d[i][j] < lo) lo = d[i][j]; } if (lo > max) return max + 1; }
    return d[a.length][b.length];
  }
  var idx = null, vocab = null, stamp = -1;
  function build() {
    var D = NL.db(); if (idx && stamp === D._stamp + ':' + D.products.length) return;
    vocab = {}; idx = NL.products().map(function (p) {
      var f = [[toks(p.name), 3], [toks(p.cat), 2.2], [toks(p.colors.map(function (c) { return c.n; }).join(' ')), 1.6], [toks((p.tags || []).join(' ') + ' ' + p.for), 1.2], [toks(p.mat), .8], [toks(p.desc), .6]];
      f.forEach(function (x) { x[0].forEach(function (t) { if (t.length > 1) vocab[t] = (vocab[t] || 0) + x[1]; }); });
      return { p: p, f: f };
    });
    Object.keys(SYN).forEach(function (k) { vocab[k] = vocab[k] || .5; });
    stamp = D._stamp + ':' + D.products.length;
  }
  function tokScore(q, t) {
    if (q === t) return 1; if (t.indexOf(q) === 0 && q.length >= 2) return .9; if (q.length >= 3 && t.indexOf(q) > 0) return .6;
    if (q.length >= 4) { var m = q.length >= 7 ? 2 : 1, d = dist(q, t, m); if (d <= m) return d === 1 ? .72 : .5; }
    return 0;
  }
  // correct a token against the vocabulary (for "did you mean")
  function correct(q) {
    if (vocab[q]) return q; var best = q, bc = 9;
    Object.keys(vocab).forEach(function (v) {
      var d; if (v.indexOf(q) === 0 && q.length >= 3) d = .4; else { if (q.length < 4) return; var m = q.length >= 5 ? 2 : 1; d = dist(q, v, m); if (d > m) return; }
      var cost = d + (v[0] !== q[0] ? .6 : 0) + Math.abs(v.length - q.length) * .15 - Math.min(vocab[v], 5) * .02 - (SYN[v] ? .05 : 0);
      if (cost < bc) { bc = cost; best = v; } });
    return best;
  }
  function search(query) {
    build(); var qt = toks(query); if (!qt.length) return { hits: [], q: query, fixed: '' };
    var fixedT = qt.map(correct), fixed = fixedT.join(' ') !== qt.join(' ') ? fixedT.join(' ') : '';
    var hits = [];
    idx.forEach(function (d) {
      var total = 0, ok = true;
      for (var i = 0; i < qt.length; i++) {
        var terms = [qt[i]].concat(SYN[qt[i]] || [], fixedT[i] !== qt[i] ? [fixedT[i]].concat(SYN[fixedT[i]] || []) : []), best = 0;
        d.f.forEach(function (field) { field[0].forEach(function (t) { terms.forEach(function (q, qi) { var s = tokScore(q, t) * field[1] * (qi === 0 ? 1 : .92); if (s > best) best = s; }); }); });
        if (!best) { ok = false; break; } total += best;
      }
      if (ok) hits.push({ p: d.p, s: total });
    });
    hits.sort(function (a, b) { return b.s - a.s || a.p.order - b.p.order; });
    if (hits.length) { var top = hits[0].s; hits = hits.filter(function (h) { return h.s >= top * .3; }); }
    return { hits: hits, q: query, fixed: hits.length && fixed ? fixed : (!hits.length && fixed ? fixed : '') };
  }
  function mark(name, q) {
    var e = NL.esc(name), qs = toks(q).filter(function (t) { return t.length > 1; }); if (!qs.length) return e;
    return e.replace(new RegExp('(' + qs.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')', 'ig'), '<mark>$1</mark>');
  }

  /* ───── overlay ───── */
  var R = NL.ROOT, ov = null, inp, list, sel = -1, opener = null, items = [];
  function recent() { try { return JSON.parse(localStorage.getItem('nl-searches')) || []; } catch (e) { return []; } }
  function remember(q) { q = String(q).trim(); if (q.length < 2) return; var r = recent().filter(function (x) { return x.toLowerCase() !== q.toLowerCase(); }); r.unshift(q); try { localStorage.setItem('nl-searches', JSON.stringify(r.slice(0, 6))); } catch (e) {} }
  function go(q) { remember(q); location.href = R + 'shop.html?q=' + encodeURIComponent(q); }
  function make() {
    ov = document.createElement('div'); ov.className = 'srch'; ov.hidden = true; ov.setAttribute('data-lenis-prevent', '');
    ov.innerHTML = '<div class="srch-sh"></div><div class="srch-pn" role="dialog" aria-modal="true" aria-label="Search the store">' +
      '<form class="srch-f" role="search"><label class="vh" for="srchI">Search Northlane</label><input id="srchI" type="search" autocomplete="off" spellcheck="false" placeholder="Search pieces, colours, materials" role="combobox" aria-expanded="true" aria-controls="srchL" aria-autocomplete="list">' +
      '<button type="button" class="srch-x">Close <kbd>Esc</kbd></button></form><div class="srch-b" id="srchB"></div></div>';
    document.body.appendChild(ov);
    inp = ov.querySelector('input'); list = ov.querySelector('#srchB');
    ov.querySelector('.srch-sh').addEventListener('click', close); ov.querySelector('.srch-x').addEventListener('click', close);
    ov.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); if (sel >= 0 && items[sel]) { items[sel].click(); return; } if (inp.value.trim()) go(inp.value); });
    inp.addEventListener('input', function () { sel = -1; render(); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!items.length) return; sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach(function (a, i) { a.classList.toggle('on', i === sel); a.setAttribute('aria-selected', i === sel); }); items[sel].scrollIntoView({ block: 'nearest' }); inp.setAttribute('aria-activedescendant', items[sel].id); }
    });
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') { var f = [].slice.call(ov.querySelectorAll('input,button,a[href]')).filter(function (x) { return x.offsetParent !== null; }); if (!f.length) return; var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } } });
    list.addEventListener('click', function (e) { var b = e.target.closest('[data-q]'); if (b) { e.preventDefault(); inp.value = b.getAttribute('data-q'); render(); inp.focus(); return; }
      var a = e.target.closest('a[data-remember]'); if (a) remember(inp.value);
      if (e.target.closest('[data-clear]')) { try { localStorage.removeItem('nl-searches'); } catch (x) {} render(); inp.focus(); } });
  }
  function thumb(p) { return '<span class="srch-im"><img src="' + NL.thumb(p.images[0].src) + '" alt="" width="60" height="75" loading="lazy" decoding="async"></span>'; }
  function render() {
    var q = inp.value.trim(), h = '';
    if (!q) {
      var rc = recent(), cats = {}; NL.products().forEach(function (p) { cats[p.cat] = (cats[p.cat] || 0) + 1; });
      h += '<div class="srch-cols"><div>' + (rc.length ? '<h3>Recent <button type="button" data-clear>Clear</button></h3><ul class="srch-chips">' + rc.map(function (x) { return '<li><button type="button" data-q="' + NL.esc(x) + '">' + NL.esc(x) + '</button></li>'; }).join('') + '</ul>' : '') +
        '<h3>Popular right now</h3><ul class="srch-chips">' + ['leather bag', 'merino knit', 'suede boots', 'sunglasses', 'everyday tee', 'gift under 2000'].map(function (x) { return '<li><button type="button" data-q="' + x + '">' + x + '</button></li>'; }).join('') + '</ul></div>' +
        '<div><h3>Shop by category</h3><ul class="srch-cats">' + Object.keys(cats).map(function (c) { return '<li><a href="' + R + 'shop.html?cat=' + c + '"><b>' + c + '</b><span>' + NL.plural(cats[c], 'piece') + '</span></a></li>'; }).join('') + '</ul></div></div>';
      list.innerHTML = h; items = []; return;
    }
    var price = q.match(/under\s*₹?\s*(\d[\d,]*)/i), maxP = price ? +price[1].replace(/,/g, '') : 0, qq = price ? q.replace(price[0], '') : q;
    var res = qq.trim() ? search(qq) : { hits: NL.products().map(function (p) { return { p: p }; }), fixed: '' };
    var hits = res.hits.filter(function (x) { return !maxP || x.p.price <= maxP; });
    if (res.fixed) h += hits.length ? '<p class="srch-dym">Showing results for <button type="button" data-q="' + NL.esc(res.fixed) + '">' + NL.esc(res.fixed) + '</button></p>' : '<p class="srch-dym">Did you mean <button type="button" data-q="' + NL.esc(res.fixed) + '">' + NL.esc(res.fixed) + '</button>?</p>';
    if (!hits.length) {
      h += '<div class="srch-none"><p>Nothing matches “' + NL.esc(q) + '”.</p><span>Try a category, a colour or a material: “rust jacket”, “leather”, “merino”.</span></div>';
    } else {
      h += '<p class="srch-k" aria-live="polite">' + NL.plural(hits.length, 'piece') + (maxP ? ' under ' + NL.money(maxP) : '') + '</p><ul class="srch-l" id="srchL" role="listbox">' + hits.slice(0, 6).map(function (x, i) { var p = x.p, out = NL.totalStock(p) === 0;
        return '<li><a role="option" id="srO' + i + '" aria-selected="false" data-remember href="' + R + 'product.html?id=' + p.id + '">' + thumb(p) + '<span class="srch-tx"><b>' + mark(p.name, res.fixed || qq) + '</b><span>' + p.cat + ' · ' + p.colors.map(function (c) { return c.n; }).join(', ') + '</span></span><span class="srch-p">' + (out ? '<em>Sold out</em>' : '') + NL.money(p.price) + '</span></a></li>'; }).join('') + '</ul>' +
        '<a class="srch-all" data-remember href="' + R + 'shop.html?q=' + encodeURIComponent(q) + '">See all ' + NL.plural(hits.length, 'result') + ' for “' + NL.esc(q) + '” <span class="arrow" aria-hidden="true">→</span></a>';
    }
    list.innerHTML = h; items = [].slice.call(list.querySelectorAll('.srch-l a, .srch-all'));
    if (sel >= items.length) sel = -1;
  }
  function open(q) {
    if (!ov) make(); opener = document.activeElement; ov.hidden = false; document.body.style.overflow = 'hidden'; if (window.Motion && Motion.lenis) Motion.lenis.stop();
    inp.value = q || ''; render(); requestAnimationFrame(function () { ov.classList.add('open'); inp.focus(); });
  }
  function close() { if (!ov || ov.hidden) return; ov.classList.remove('open'); document.body.style.overflow = ''; if (window.Motion && Motion.lenis) Motion.lenis.start(); setTimeout(function () { ov.hidden = true; }, 420); if (opener && document.contains(opener)) opener.focus(); }
  addEventListener('keydown', function (e) {
    var t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) { e.preventDefault(); open(); }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !document.querySelector('.cmdk')) { e.preventDefault(); open(); }
  });
  addEventListener('nl:change', function () { idx = null; if (ov && !ov.hidden) render(); });
  window.NLSearch = { search: search, open: open, close: close, toks: toks, remember: remember };
})();
