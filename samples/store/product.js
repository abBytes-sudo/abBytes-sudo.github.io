/* Northlane product page: real colour and size stock, restock alerts, delivery check, fit finder, reviews, complete the look. */
(function () {
  'use strict';
  var NL = window.NL, S = window.NLS; if (!NL || !S) return;
  var $ = S.$, $$ = S.$$, esc = NL.esc, money = NL.money, R = S.R, G = window.gsap;
  var id = new URLSearchParams(location.search).get('id'), p = NL.product(id) || (NL.products()[0]);
  var ci = 0, si = -1, rvF = { star: 0, sort: 'new', n: 4 }, first = true;
  var BIAS = { 'harbor-jacket': .5, 'loop-hoodie': 1, 'rib-knit': -.5, 'drift-runner': 1, 'everyday-tee': 0, 'easy-trousers': 0, 'court-low': 0 };
  var helpful = S.ls.get('helpful', {});
  var CLOTH = ['XS', 'S', 'M', 'L', 'XL'];

  function sk(c, s) { return NL.skuKey(p.id, c, s); }
  function st(c, s) { return NL.stock(sk(c, s)); }
  function colourOut(c) { return p.sizes.every(function (s) { return st(c, s).avail <= 0; }); }

  /* ── main render (runs again whenever the admin edits the product or stock changes) ── */
  function render() {
    p = NL.product(p.id) || p;
    if (p.status !== 'active') { gone(); return; }
    if (ci >= p.colors.length) ci = 0; if (si >= p.sizes.length) si = -1;
    if (p.sizes.length === 1) si = 0;
    document.title = p.name + ' · Northlane';
    $('#crumb').innerHTML = '<a href="index.html">Northlane</a> / <a href="shop.html?cat=' + p.cat + '">' + p.cat + '</a> / <span>' + esc(p.name) + '</span>';
    $('#pName').textContent = p.name; $('#pPrice').innerHTML = money(p.price) + (p.compare > p.price ? ' <s>' + money(p.compare) + '</s>' : ''); $('#pDesc').textContent = p.desc;
    $('#pFor').textContent = p.for + ' · ' + p.cat + (p.isNew ? ' · New' : ''); $('#pMat').textContent = p.mat;
    var rs = NL.reviewStats(p.id); $('#pRt').innerHTML = rs.n ? S.stars(rs.avg) + '<span>' + rs.avg.toFixed(1) + ' · ' + NL.plural(rs.n, 'review') + '</span>' : '<span>No reviews yet · be the first</span>';
    gallery(); colours(); sizes(); fit(); sizeGuide(); buy();
    if (first) { reviews(); look(); recent(); dlv(); first = false; }
  }
  function gone() {
    $('#pdp').innerHTML = '<div class="gone"><p class="eyebrow">Not available</p><h1>This piece is resting.</h1><p>It’s been taken off the shop for now, usually while we restock or reshoot it. Everything else is a tap away.</p><a class="nl-btn" href="shop.html">Shop all pieces <span class="arrow" aria-hidden="true">→</span></a></div>';
    ['#reviews', '#lookSec', '#recentWrap'].forEach(function (s) { var e = $(s); if (e) e.hidden = true; }); var bb = $('.buybar'); if (bb) bb.remove();
  }

  var galSig = '', prepainted = !!document.querySelector('#gal .f');
  function gallery() {
    var ims = p.images.length ? p.images : [{ src: 'products/' + p.id + '.jpg', alt: p.alt }], sig = JSON.stringify(ims) + p.dp;
    if (sig !== galSig) {
      galSig = sig; var main = NL.img(ims[0].src);
      var f = function (src, alt, d, cls, eager) { var ss = ims[0] && src === main ? NL.srcset(ims[0].src) : ''; return '<div class="f ' + cls + '"><img src="' + src + '"' + (ss ? ' srcset="' + ss + '" sizes="(max-width:960px) 100vw, 50vw"' : '') + ' alt="' + esc(alt) + '" width="900" height="1125"' + (d ? ' style="transform-origin:' + d[0] + '% ' + d[1] + '%"' : '') + (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async"></div>'; };
      var h = f(main, ims[0].alt || p.alt, null, 'm', true) + (p.dp || []).map(function (d) { return f(main, 'Detail of the ' + p.name, d, 'd', true); }).join('') + ims.slice(1).map(function (im) { return f(NL.img(im.src), im.alt || p.name, null, 'x'); }).join('');
      // keep the photo pre-painted by pdp-preload.js when it's the same one, so the largest paint isn't redone
      var pre = prepainted && first && $('#gal .f.m img');
      if (pre && pre.getAttribute('src') === main) { pre.alt = ims[0].alt || p.alt || p.name; var tmp = document.createElement('div'); tmp.innerHTML = h; tmp.removeChild(tmp.firstChild); while (tmp.firstChild) $('#gal').appendChild(tmp.firstChild); }
      else $('#gal').innerHTML = h;
      var old = $('.gal-dots'); if (old) old.remove();
      var n = $$('#gal .f').length, dots = document.createElement('div'); dots.className = 'gal-dots'; dots.setAttribute('aria-hidden', 'true'); for (var i = 0; i < n; i++) dots.innerHTML += '<i' + (i ? '' : ' class="on"') + '></i>'; $('#gal').after(dots);
      if (matchMedia('(hover:hover)').matches) $$('#gal .f.m, #gal .f.x').forEach(function (fr) { var im = $('img', fr);
        fr.addEventListener('mouseenter', function () { fr.classList.add('z'); });
        fr.addEventListener('mousemove', function (e) { var r = fr.getBoundingClientRect(); im.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%'; });
        fr.addEventListener('mouseleave', function () { fr.classList.remove('z'); }); });
      if (S.fx && first && !prepainted) G.from($$('#gal .f'), { clipPath: 'inset(8% 6% 8% 6%)', autoAlpha: 0, duration: 1.5, ease: 'expo.out', stagger: .12, delay: .1 });
    }
    var c0 = p.colors[0], c = p.colors[ci];
    $('#galCap').innerHTML = '<i style="--c:' + c0.h + '"></i>Photographed in ' + esc(c0.n) + (ci ? '<span> · you’ve chosen <b>' + esc(c.n) + '</b> <i style="--c:' + c.h + '"></i></span>' : '');
  }
  $('#gal').addEventListener('scroll', function () { var g = this, k = Math.round(g.scrollLeft / (g.firstElementChild ? g.firstElementChild.clientWidth + 8 : g.clientWidth)); $$('.gal-dots i').forEach(function (d, i) { d.classList.toggle('on', i === k); }); }, { passive: true });

  function colours() {
    $('#pCol').textContent = p.colors[ci].n + (colourOut(ci) ? ' · sold out' : '');
    $('#pColors').innerHTML = p.colors.map(function (c, i) { var out = colourOut(i);
      return '<button type="button" class="sw' + (out ? ' out' : '') + '" data-ci="' + i + '" style="--c:' + c.h + '" aria-pressed="' + (i === ci) + '" aria-label="' + esc(c.n) + (out ? ', sold out' : '') + '" title="' + esc(c.n) + '"></button>'; }).join('');
  }
  function sizes() {
    $('#pSizes').innerHTML = p.sizes.map(function (s, i) { var x = st(ci, s), lab = s + (x.state === 'out' ? ', sold out' : x.state === 'low' ? ', only ' + x.avail + ' left' : '');
      return '<button type="button" class="chip ' + x.state + '" data-si="' + i + '" aria-pressed="' + (i === si) + '" aria-label="' + esc(lab) + '">' + esc(s) + (x.state === 'low' ? '<i aria-hidden="true"></i>' : '') + '</button>'; }).join('');
    $('#sizeOpt').classList.toggle('one', p.sizes.length === 1);
    var m = $('#pStk');
    if (si < 0) { var anyLow = p.sizes.filter(function (s) { return st(ci, s).state === 'low'; }), outs = p.sizes.filter(function (s) { return st(ci, s).state === 'out'; });
      m.innerHTML = outs.length === p.sizes.length ? '<b class="o">Sold out in ' + esc(p.colors[ci].n) + '.</b> Pick a size to be told when it’s back.' : (anyLow.length ? 'Low in ' + anyLow.join(', ') + '. ' : '') + (outs.length ? 'Sold out in ' + outs.join(', ') + '.' : 'Every size in stock.');
      m.className = 'stk'; return; }
    var x = st(ci, p.sizes[si]), sz = p.sizes[si] === 'One size' ? '' : ' in ' + p.sizes[si];
    if (x.state === 'out') m.innerHTML = '<b class="o">Sold out' + sz + '.</b> ' + (x.inc.n ? 'More arrive around ' + NL.fD(x.inc.eta) + '.' : 'We’re making more.') + (x.alerts ? ' ' + NL.plural(x.alerts, 'person is', 'people are') + ' waiting for it.' : '');
    else if (x.state === 'low') m.innerHTML = '<b class="l">Only ' + x.avail + ' left' + sz + '.</b> Packed in Jaipur within a working day.';
    else m.innerHTML = '<b class="i">In stock' + sz + '.</b> Packed in Jaipur within a working day.';
    m.className = 'stk ' + x.state;
  }
  function selected() { return si >= 0 ? st(ci, p.sizes[si]) : null; }
  function buy() {
    var x = selected(), out = x && x.state === 'out', b = $('#pAdd'), bb = $('.buybar button');
    b.innerHTML = out ? 'Notify me when it’s back' : 'Add to bag · ' + money(p.price);
    b.classList.toggle('ghost', !!out); if (bb) bb.innerHTML = b.innerHTML;
    var nf = $('#notify'); nf.hidden = !out;
    if (out) { $('#ntH').innerHTML = '<b>' + esc(p.colors[ci].n) + (p.sizes[si] !== 'One size' ? ', ' + esc(p.sizes[si]) : '') + '</b> is sold out. Leave your email and we’ll write the moment it’s back' + (x.inc.n ? ', likely around ' + NL.fD(x.inc.eta) : '') + '.';
      var sess = NL.session(); if (sess && !$('#ntE').value) $('#ntE').value = sess.email; $('#ntM').textContent = ''; $('#ntM').className = 'nt-m'; }
    $('#pWish').setAttribute('data-wish', p.id); var w = S.wish().indexOf(p.id) >= 0; $('#pWish').classList.toggle('on', w); $('#pWish').setAttribute('aria-pressed', w);
  }
  $('#pColors').addEventListener('click', function (e) { var b = e.target.closest('[data-ci]'); if (!b) return; ci = +b.getAttribute('data-ci'); colours(); sizes(); gallery(); buy(); });
  $('#pColors').addEventListener('keydown', function (e) { if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; e.preventDefault(); ci = (ci + (e.key === 'ArrowRight' ? 1 : -1) + p.colors.length) % p.colors.length; colours(); sizes(); gallery(); buy(); $('#pColors [data-ci="' + ci + '"]').focus(); });
  $('#pSizes').addEventListener('click', function (e) { var b = e.target.closest('[data-si]'); if (!b) return; si = +b.getAttribute('data-si'); $('#pErr').hidden = true; sizes(); buy(); });
  function addNow() {
    if (si < 0) { $('#pErr').hidden = false; $('#pSizes').scrollIntoView({ behavior: S.reduce ? 'auto' : 'smooth', block: 'center' }); return; }
    var x = selected(); if (x.state === 'out') { $('#notify').hidden = false; $('#ntE').focus(); return; }
    var r = S.add(p.id, ci, p.sizes[si]); if (!r.ok) { $('#pStk').innerHTML = '<b class="o">' + esc(r.msg) + '</b>'; }
  }
  $('#pAdd').addEventListener('click', addNow);
  var bb = document.createElement('div'); bb.className = 'buybar'; bb.innerHTML = '<button class="nl-btn" type="button"></button>'; document.body.appendChild(bb); $('button', bb).addEventListener('click', addNow);
  $('#notify').addEventListener('submit', function (e) { e.preventDefault(); var v = $('#ntE').value.trim(), m = $('#ntM');
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) { m.textContent = 'That email doesn’t look right. Check for a missing @ or dot.'; m.className = 'nt-m bad'; $('#ntE').focus(); return; }
    var ok = NL.alertMe(sk(ci, p.sizes[si]), v); m.className = 'nt-m ok'; m.textContent = ok ? 'Done. We’ll email ' + v + ' once it’s back.' : 'You’re already on the list for this one.'; });

  /* ── delivery estimate by pincode ── */
  function dlv() {
    var pin = S.ls.get('pin', ''); var s = NL.session(); if (!pin && s && s.addrs && s.addrs[0]) pin = s.addrs[0].pin; $('#dlvP').value = pin || ''; if (pin) checkPin(pin, true);
  }
  function checkPin(v, quiet) {
    var r = NL.pin(v), m = $('#dlvM'); if (!r.ok) { m.innerHTML = quiet ? '' : '<span class="bad">' + esc(r.msg) + '</span>'; return; }
    S.ls.set('pin', r.pin); var o = NL.shipOptions(r, p.price), std = o[0], exp = o[1], same = o[2];
    m.innerHTML = '<b>' + esc((r.city ? r.city + ', ' : '') + r.state) + '</b>' + (same ? '<span>Same-day: <b>' + NL.winText(same) + '</b> · ' + money(same.fee) + '</span>' : '') + '<span>Express: <b>' + NL.winText(exp) + '</b> · ' + money(exp.fee) + '</span><span>Standard: <b>' + NL.winText(std) + '</b> · ' + (std.fee ? money(std.fee) : 'free') + '</span><span>' + (r.cod ? 'Cash on delivery available' : 'Prepaid only for this pincode') + '</span>';
  }
  $('#dlv').addEventListener('submit', function (e) { e.preventDefault(); checkPin($('#dlvP').value); });
  $('#dlvP').addEventListener('input', function () { var v = this.value.replace(/\D/g, '').slice(0, 6); if (v !== this.value) this.value = v; if (v.length === 6) checkPin(v); else $('#dlvM').innerHTML = ''; });

  /* ── size advice + fit finder ── */
  function fitWord(rs) { var t = rs.fit[0] + rs.fit[1] + rs.fit[2]; if (!t) return null; var k = rs.fit[2] > rs.fit[0] && rs.fit[2] >= t * .3 ? 2 : rs.fit[0] > rs.fit[2] && rs.fit[0] >= t * .3 ? 0 : 1; return { k: k, t: t, n: rs.fit[k], label: ['Runs small', 'True to size', 'Runs large'][k] }; }
  function fit() {
    var box = $('#fitBox'); if (p.sizes.length === 1) { box.hidden = true; return; } box.hidden = false;
    var rs = NL.reviewStats(p.id), fw = fitWord(rs), pos = fw ? ((rs.fit[2] - rs.fit[0]) / fw.t) * 50 + 50 : 50;
    box.innerHTML = '<div class="fit-m"><p><b>Size advice</b>' + esc(p.fit || 'True to size.') + '</p>' + (fw ? '<div class="fit-bar" role="img" aria-label="Customers say: ' + fw.label + ' (' + fw.n + ' of ' + fw.t + ')"><span>Small</span><i><b style="left:' + pos.toFixed(0) + '%"></b></i><span>Large</span></div><p class="fit-s">' + fw.label + ', say ' + fw.n + ' of ' + fw.t + ' reviewers</p>' : '') + '</div><button type="button" class="nl-btn ghost sm" id="fitOpen">Find my size</button>';
    $('#fitOpen').addEventListener('click', openFit);
  }
  function openFit() {
    var shoes = p.cat === 'Shoes', d = $('#fitDlg');
    $('#fitBody').innerHTML = '<p class="eyebrow">Fit finder</p><h2 id="fitH">Your size in the ' + esc(p.name) + '</h2><form id="fitF" class="fitf">' + (shoes ?
      '<label class="f"><span>Your usual EU size</span><select id="fUsual">' + ['38', '39', '40', '41', '42', '43', '44', '45', '46'].map(function (s) { return '<option' + (s === '42' ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label>' +
      '<fieldset class="seg3"><legend>Your feet are</legend>' + ['Narrow', 'Regular', 'Wide'].map(function (s, i) { return '<label><input type="radio" name="fw" value="' + i + '"' + (i === 1 ? ' checked' : '') + '><span>' + s + '</span></label>'; }).join('') + '</fieldset>'
      : '<label class="f"><span>Height</span><select id="fH">' + [150, 155, 160, 165, 170, 175, 180, 185, 190, 195].map(function (h) { return '<option value="' + h + '"' + (h === 165 ? ' selected' : '') + '>' + h + ' cm (' + Math.floor(h / 30.48) + '′' + Math.round(h / 2.54 % 12) + '″)</option>'; }).join('') + '</select></label>' +
      '<fieldset class="seg3"><legend>Your usual size in tops</legend>' + CLOTH.map(function (s) { return '<label><input type="radio" name="fu" value="' + s + '"' + (s === 'M' ? ' checked' : '') + '><span>' + s + '</span></label>'; }).join('') + '</fieldset>' +
      '<fieldset class="seg3"><legend>You like it</legend>' + ['Close', 'As intended', 'Roomy'].map(function (s, i) { return '<label><input type="radio" name="fp" value="' + (i - 1) + '"' + (i === 1 ? ' checked' : '') + '><span>' + s + '</span></label>'; }).join('') + '</fieldset>') +
      '<div class="fit-out" id="fitOut" aria-live="polite"></div></form>';
    var f = $('#fitF'); f.addEventListener('change', calc); f.addEventListener('submit', function (e) { e.preventDefault(); }); calc();
    d.showModal();
    function calc() {
      var b = BIAS[p.id] != null ? BIAS[p.id] : 0, why = [], rec;
      if (shoes) { var u = +$('#fUsual').value, w = +(f.querySelector('[name=fw]:checked') || {}).value; var v = u - (b >= 1 ? 1 : 0) + (w === 2 && b >= 1 ? 1 : 0) - (w === 0 && b < 1 ? 0 : 0);
        if (b >= 1) why.push('This boot runs about half a size large, so most people go one down.'); else why.push('True to size, with a snug heel that eases in a week.');
        if (w === 2) why.push(b >= 1 ? 'With wide feet, keep your usual size for room across the toes.' : 'With wide feet, the suede gives a little after a few wears.');
        rec = String(Math.max(+p.sizes[0], Math.min(+p.sizes[p.sizes.length - 1], v)));
      } else { var h = +$('#fH').value, us = f.querySelector('[name=fu]:checked').value, pr = +f.querySelector('[name=fp]:checked').value, ix = CLOTH.indexOf(us);
        var val = ix - b * .7 + pr * .55 + (h >= 183 ? .4 : h <= 155 ? -.3 : 0);
        if (b > 0) why.push('The ' + p.name + ' is cut generously' + (b >= 1 ? ', so we suggest one size down from usual' : '') + '.'); else if (b < 0) why.push('It’s cut close to the body and slightly cropped.'); else why.push('It’s true to size.');
        if (pr) why.push(pr > 0 ? 'You like room, so we nudged it up.' : 'You prefer a closer fit, so we nudged it down.');
        if (h >= 183) why.push('At ' + h + ' cm, the extra length helps.'); if (h <= 155) why.push('At ' + h + ' cm, the shorter body sits better.');
        var avail = p.sizes.filter(function (s) { return CLOTH.indexOf(s) >= 0; }); rec = CLOTH[Math.max(0, Math.min(CLOTH.length - 1, Math.round(val)))];
        if (avail.indexOf(rec) < 0) rec = CLOTH.indexOf(rec) > CLOTH.indexOf(avail[avail.length - 1]) ? avail[avail.length - 1] : avail[0]; }
      var x = st(ci, rec), rsn = NL.reviewStats(p.id), fw = fitWord(rsn);
      $('#fitOut').innerHTML = '<p class="fit-rec">We’d go with <b>' + esc(rec) + '</b></p><ul>' + why.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + (fw ? '<li>' + fw.n + ' of ' + fw.t + ' reviewers say it ' + (fw.k === 1 ? 'fits true to size' : fw.label.toLowerCase()) + '.</li>' : '') + '</ul><p class="fit-st">' + esc(p.colors[ci].n) + ' in ' + esc(rec) + ': ' + (x.state === 'out' ? 'sold out right now' : x.state === 'low' ? 'only ' + x.avail + ' left' : 'in stock') + '</p><button type="button" class="nl-btn" id="fitUse">Choose ' + esc(rec) + '</button>';
      $('#fitUse').onclick = function () { si = p.sizes.indexOf(rec); sizes(); buy(); $('#pErr').hidden = true; $('#fitDlg').close(); $('#pSizes [data-si="' + si + '"]').focus(); };
    }
  }
  function sizeGuide() {
    var clothing = p.cat === 'Clothing', shoes = p.cat === 'Shoes';
    $('#acdSizeT').textContent = clothing || shoes ? 'Size guide' : 'Details & dimensions'; $('#sizeLink').textContent = clothing || shoes ? 'Size guide' : 'Dimensions';
    $('#acdSizeB').innerHTML = clothing ? '<table><tr><th>Size</th><th>Chest (cm)</th><th>Length (cm)</th><th>India / UK</th></tr><tr><td>XS</td><td>88</td><td>66</td><td>34 / 6</td></tr><tr><td>S</td><td>94</td><td>68</td><td>36 / 8</td></tr><tr><td>M</td><td>100</td><td>70</td><td>38 / 10</td></tr><tr><td>L</td><td>106</td><td>72</td><td>40 / 12</td></tr><tr><td>XL</td><td>112</td><td>74</td><td>42 / 14</td></tr></table>'
      : shoes ? '<table><tr><th>EU</th><th>UK / India</th><th>Foot length (cm)</th></tr>' + [['39', '6', '24.6'], ['40', '6.5', '25.3'], ['41', '7.5', '26'], ['42', '8', '26.6'], ['43', '9', '27.3'], ['44', '9.5', '28'], ['45', '10.5', '28.6']].map(function (r) { return '<tr><td>' + r.join('</td><td>') + '</td></tr>'; }).join('') + '</table>' + (p.dims ? '<table>' + p.dims.map(function (d) { return '<tr><th>' + esc(d[0]) + '</th><td>' + esc(d[1]) + '</td></tr>'; }).join('') + '</table>' : '')
        : '<table>' + (p.dims || []).map(function (d) { return '<tr><th>' + esc(d[0]) + '</th><td>' + esc(d[1]) + '</td></tr>'; }).join('') + '</table>';
  }
  $('#sizeLink').addEventListener('click', function () { var it = $('#acd-size'); if (!it.classList.contains('open')) toggleAcd(it); it.scrollIntoView({ behavior: S.reduce ? 'auto' : 'smooth', block: 'center' }); });
  function toggleAcd(it) { var o = it.classList.toggle('open'); $('.acd-h', it).setAttribute('aria-expanded', o); }
  $('.acd').addEventListener('click', function (e) { var h = e.target.closest('.acd-h'); if (h) toggleAcd(h.parentNode); });

  /* ── reviews ── */
  function reviews() {
    var box = $('#reviews'), rs = NL.reviewStats(p.id), L = NL.reviews(p.id), rec = L.length ? Math.round(L.filter(function (r) { return r.rating >= 4; }).length / L.length * 100) : 0, fw = fitWord(rs);
    var ph = []; L.forEach(function (r) { r.photos.forEach(function (src) { ph.push({ src: src, r: r }); }); });
    var list = L.filter(function (r) { return !rvF.star || r.rating === rvF.star; });
    if (rvF.sort === 'high') list.sort(function (a, b) { return b.rating - a.rating || b.t - a.t; }); else if (rvF.sort === 'photos') list.sort(function (a, b) { return b.photos.length - a.photos.length || b.t - a.t; }); else if (rvF.sort === 'help') list.sort(function (a, b) { return (b.helpful + (helpful[b.id] ? 1 : 0)) - (a.helpful + (helpful[a.id] ? 1 : 0)); });
    var FIT = ['Runs small', 'True to size', 'Runs large'];
    box.innerHTML = '<div class="rv-hd"><div class="rv-sum"><p class="eyebrow">Reviews</p><h2 id="rvH">' + (rs.n ? rs.avg.toFixed(1) : '—') + '<small>/ 5</small></h2>' + (rs.n ? S.stars(rs.avg, 'lg') + '<p>Based on ' + NL.plural(rs.n, 'review') + ' · ' + rec + '% would recommend</p>' : '<p>No reviews yet.</p>') + '</div>' +
      '<div class="rv-bars" role="group" aria-label="Filter by rating">' + [5, 4, 3, 2, 1].map(function (k) { var n = rs.dist[k - 1]; return '<button type="button" data-star="' + k + '" aria-pressed="' + (rvF.star === k) + '"' + (n ? '' : ' disabled') + '><span>' + k + ' ★</span><i><b style="width:' + (rs.n ? n / rs.n * 100 : 0) + '%"></b></i><span>' + n + '</span></button>'; }).join('') + '</div>' +
      '<div class="rv-side">' + (fw ? '<p class="rv-fit"><span class="eyebrow">Fit</span><b>' + fw.label + '</b> ' + fw.n + ' of ' + fw.t + ' say so</p>' : '') + '<button type="button" class="nl-btn" id="rvWrite">Write a review</button></div></div>' +
      (ph.length ? '<div class="rv-ph"><p class="eyebrow">Customer photos · ' + ph.length + '</p><ul>' + ph.map(function (x, i) { return '<li><button type="button" data-ph="' + i + '" aria-label="Photo from ' + esc(x.r.name) + '"><img src="' + NL.img(x.src) + '" alt="" width="160" height="200" loading="lazy" decoding="async"></button></li>'; }).join('') + '</ul></div>' : '') +
      '<div class="rv-tools"><p>' + (rvF.star ? 'Showing ' + NL.plural(list.length, 'review') + ' rated ' + rvF.star + (rvF.star > 1 ? ' stars' : ' star') + ' <button type="button" class="inl" data-star="0">Show all</button>' : NL.plural(L.length, 'review')) + '</p><label class="sel"><span class="vh">Sort reviews</span><select id="rvSort"><option value="new">Newest</option><option value="high">Highest rated</option><option value="photos">With photos first</option><option value="help">Most helpful</option></select></label></div>' +
      '<ul class="rv-list">' + (list.length ? list.slice(0, rvF.n).map(function (r) { var hp = !!helpful[r.id];
        return '<li class="rv-i"><div class="rv-m">' + S.stars(r.rating, 'sm') + '<b>' + esc(r.name) + '</b><span>' + esc(r.city || '') + '</span>' + (r.verified ? '<span class="vb">Verified buyer</span>' : '') + '</div><div class="rv-c"><h3>' + esc(r.title) + '</h3><p>' + esc(r.body) + '</p>' +
          (r.photos.length ? '<div class="rv-pi">' + r.photos.map(function (src) { var k = ph.map(function (x) { return x.src + x.r.id; }).indexOf(src + r.id); return '<button type="button" data-ph="' + k + '" aria-label="Open photo"><img src="' + NL.img(src) + '" alt="Photo from ' + esc(r.name) + '" width="120" height="150" loading="lazy" decoding="async"></button>'; }).join('') + '</div>' : '') +
          '<p class="rv-f"><span>Bought ' + esc(r.size || '') + (r.col ? ', ' + esc(r.col) : '') + '</span><span>' + FIT[r.fit + 1] + '</span><span>' + NL.fDs(r.t) + '</span><button type="button" class="hlp" data-help="' + r.id + '" aria-pressed="' + hp + '">Helpful · ' + (r.helpful + (hp ? 1 : 0)) + '</button></p></div></li>'; }).join('') : '<li class="rv-none">No ' + rvF.star + '-star reviews yet.</li>') + '</ul>' +
      (list.length > rvF.n ? '<button type="button" class="nl-btn ghost rv-more" id="rvMore">Show ' + Math.min(6, list.length - rvF.n) + ' more of ' + list.length + '</button>' : '');
    $('#rvSort').value = rvF.sort;
    box._ph = ph;
  }
  $('#reviews').addEventListener('click', function (e) {
    var b = e.target.closest('[data-star]'); if (b) { var k = +b.getAttribute('data-star'); rvF.star = rvF.star === k ? 0 : k; rvF.n = 4; reviews(); return; }
    if (e.target.closest('#rvMore')) { rvF.n += 6; reviews(); return; }
    if (e.target.closest('#rvWrite')) { writeReview(); return; }
    var h = e.target.closest('[data-help]'); if (h) { var rid = h.getAttribute('data-help'); helpful[rid] = !helpful[rid]; S.ls.set('helpful', helpful); reviews(); var nb = $('[data-help="' + rid + '"]'); if (nb) nb.focus(); return; }
    var ph = e.target.closest('[data-ph]'); if (ph) { var x = $('#reviews')._ph[+ph.getAttribute('data-ph')]; if (!x) return; $('#phBody').innerHTML = '<img src="' + NL.img(x.src) + '" alt="Customer photo of the ' + esc(p.name) + '" width="900" height="1125"><p>' + S.stars(x.r.rating, 'sm') + ' <b>' + esc(x.r.title) + '</b> · ' + esc(x.r.name) + ', ' + esc(x.r.city || '') + '</p>'; $('#phDlg').showModal(); }
  });
  $('#reviews').addEventListener('change', function (e) { if (e.target.id === 'rvSort') { rvF.sort = e.target.value; reviews(); $('#rvSort').focus(); } });

  function writeReview() {
    var s = NL.session(), nm = s && s.name ? s.name.split(' ')[0] + ' ' + (s.name.split(' ')[1] || '').charAt(0) + '.' : '', photo = '';
    var bought = s && NL.db().orders.some(function (o) { return o.email === s.email && o.items.some(function (it) { return it.pid === p.id; }); });
    $('#rvBody').innerHTML = '<p class="eyebrow">Write a review</p><h2 id="rvFH">' + esc(p.name) + '</h2><p class="dlg-n">Your review appears on this page straight away.</p>' +
      '<form id="rvF" novalidate><fieldset class="rate"><legend>Your rating</legend>' + [1, 2, 3, 4, 5].map(function (k) { return '<input type="radio" name="rt" id="rt' + k + '" value="' + k + '"><label for="rt' + k + '" title="' + k + ' star' + (k > 1 ? 's' : '') + '"><span class="vh">' + k + ' star' + (k > 1 ? 's' : '') + '</span>' + '★' + '</label>'; }).join('') + '</fieldset>' +
      '<label class="f"><span>Headline</span><input id="rvT" maxlength="60" placeholder="What stood out?"></label><label class="f"><span>Your review</span><textarea id="rvB" rows="4" maxlength="600" placeholder="How does it fit, feel and wear?"></textarea><small id="rvC">0 / 600</small></label>' +
      '<div class="row"><label class="f"><span>Size bought</span><select id="rvS">' + p.sizes.map(function (z) { return '<option>' + esc(z) + '</option>'; }).join('') + '</select></label>' + (p.sizes.length > 1 ? '<label class="f"><span>Fit</span><select id="rvFit"><option value="-1">Runs small</option><option value="0" selected>True to size</option><option value="1">Runs large</option></select></label>' : '') + '</div>' +
      '<div class="row"><label class="f"><span>Name shown</span><input id="rvN" maxlength="30" value="' + esc(nm) + '" placeholder="Meera I."></label><label class="f"><span>City</span><input id="rvCity" maxlength="30" value="' + esc((s && s.city) || '') + '" placeholder="Mumbai"></label></div>' +
      '<label class="f up"><span>Add a photo (optional)</span><input type="file" id="rvP" accept="image/*"><em id="rvPN">JPG or PNG, resized in your browser</em></label>' +
      '<p class="err" id="rvE" role="alert"></p><button class="nl-btn" type="submit">Post review</button></form>';
    $('#rvB').addEventListener('input', function () { $('#rvC').textContent = this.value.length + ' / 600'; });
    $('#rvP').addEventListener('change', function () { var file = this.files[0]; if (!file) return; if (!/^image\//.test(file.type)) { $('#rvPN').textContent = 'That isn’t an image.'; return; }
      var fr = new FileReader(); fr.onload = function () { var im = new Image(); im.onload = function () { var k = Math.min(1, 640 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); photo = c.toDataURL('image/jpeg', .72); $('#rvPN').innerHTML = '<img src="' + photo + '" alt="" width="60" height="75"> Ready to post'; }; im.src = fr.result; }; fr.readAsDataURL(file); });
    $('#rvF').addEventListener('submit', function (e) { e.preventDefault(); var rt = $('#rvF [name=rt]:checked'), t = $('#rvT').value.trim(), b = $('#rvB').value.trim(), n = $('#rvN').value.trim(), er = $('#rvE');
      if (!rt) { er.textContent = 'Tap a star to rate it.'; return; } if (t.length < 3) { er.textContent = 'Give your review a short headline.'; $('#rvT').focus(); return; }
      if (b.length < 20) { er.textContent = 'A few more words, please: at least 20 characters helps other shoppers.'; $('#rvB').focus(); return; } if (!n) { er.textContent = 'Add the name you’d like shown.'; $('#rvN').focus(); return; }
      NL.addReview(p.id, { name: n, city: $('#rvCity').value.trim(), rating: +rt.value, title: t, body: b, fit: $('#rvFit') ? +$('#rvFit').value : 0, size: $('#rvS').value, col: p.colors[ci].n, photos: photo ? [photo] : [], verified: bought });
      $('#rvDlg').close(); rvF = { star: 0, sort: 'new', n: 4 }; reviews(); var rt2 = NL.reviewStats(p.id); $('#pRt').innerHTML = S.stars(rt2.avg) + '<span>' + rt2.avg.toFixed(1) + ' · ' + NL.plural(rt2.n, 'review') + '</span>';
      var top = $('.rv-list li'); if (top) { top.classList.add('fresh'); top.scrollIntoView({ behavior: S.reduce ? 'auto' : 'smooth', block: 'center' }); } });
    $('#rvDlg').showModal();
  }

  /* ── complete the look ── */
  var lookSel = {};
  function look() {
    var L = (p.look || []).map(NL.product).filter(function (x) { return x && x.status === 'active'; });
    if (!L.length) { $('#lookSec').hidden = true; return; }
    $('#look').innerHTML = L.map(function (x) { var one = x.sizes.length === 1, s = lookSel[x.id];
      if (one) s = lookSel[x.id] = x.sizes[0];
      var opts = x.sizes.map(function (z) { var y = NL.stock(NL.skuKey(x.id, 0, z)); return '<option value="' + esc(z) + '"' + (y.avail <= 0 ? ' disabled' : '') + (s === z ? ' selected' : '') + '>' + esc(z) + (y.avail <= 0 ? ' · sold out' : y.state === 'low' ? ' · ' + y.avail + ' left' : '') + '</option>'; }).join('');
      return '<li class="pc lk2"><a class="pc-a" href="product.html?id=' + x.id + '"><div class="pc-img">' + S.img(x) + '<span class="pc-view">View piece</span></div><div class="pc-tx"><p class="pc-n">' + esc(x.name) + '</p><p class="pc-p">' + money(x.price) + '</p></div><p class="pc-m">' + esc(x.colors[0].n) + '</p></a>' +
        (one ? '<p class="lk2-s">One size' + (NL.totalStock(x) ? '' : ' · sold out') + '</p>' : '<label class="lk2-s"><span class="vh">Size for ' + esc(x.name) + '</span><select data-look="' + x.id + '"><option value="">Choose size</option>' + opts + '</select></label>') + '</li>'; }).join('');
    $('#lookTot').textContent = NL.plural(L.length, 'piece') + ' · ' + money(L.reduce(function (a, x) { return a + x.price; }, 0));
    $('#lookAdd').onclick = function () { var miss = L.filter(function (x) { return !lookSel[x.id]; }), m = $('#lookMsg');
      if (miss.length) { m.textContent = 'Choose a size for ' + miss.map(function (x) { return x.name; }).join(' and ') + ' first.'; m.className = 'bad'; var s0 = $('[data-look="' + miss[0].id + '"]'); if (s0) s0.focus(); return; }
      var added = 0, skip = []; L.forEach(function (x) { var r = S.add(x.id, 0, lookSel[x.id], 1, true); if (r.ok) added++; else skip.push(x.name); });
      m.className = ''; m.textContent = added ? NL.plural(added, 'piece') + ' added to your bag.' + (skip.length ? ' ' + skip.join(', ') + ' just sold out.' : '') : 'Those pieces just sold out.'; if (added) S.openCart(); };
    S.reveal($$('#look .pc'));
  }
  $('#look').addEventListener('change', function (e) { var s = e.target.closest('[data-look]'); if (s) { lookSel[s.getAttribute('data-look')] = s.value; $('#lookMsg').textContent = ''; } });
  function recent() {
    var rec = S.ls.get('recent', []).filter(function (x) { return x !== p.id && NL.product(x); }); rec.unshift(p.id); S.ls.set('recent', rec.slice(0, 6));
    var rv = rec.slice(1, 5).map(NL.product).filter(function (x) { return x && x.status === 'active'; });
    if (rv.length) { $('#recentWrap').hidden = false; $('#recent').innerHTML = rv.map(S.card).join(''); S.reveal($$('#recent .pc')); }
  }

  render();
  if (S.fx) G.from($$('#crumb, .pdp-box > *'), { autoAlpha: 0, y: 28, duration: 1.2, ease: 'power4.out', stagger: .05, delay: .1, clearProps: 'all' });
  S.onChange.push(function (sc) { if (sc === 'cart') { buy(); return; } if (sc === 'session') return; render(); if (sc === 'reviews' || sc === 'all') reviews(); if (sc === 'products' || sc === 'all' || sc === 'inv') look(); });
})();
