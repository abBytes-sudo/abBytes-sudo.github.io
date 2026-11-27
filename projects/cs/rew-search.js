/* Real Estate Platform website, "Let them type": the hero search, working. A small sentence reader over the 40
   listings in rew-search-data.js. It picks out bedrooms ("3 bhk", "2-3 bed"), one or more of twelve South Delhi
   localities (with shorthand such as "gk 1", "cr park", "dc"), a budget ("under 1.5 lakh", "below 70k",
   "1-1.5 L", "from 80k", "under 13 cr"), rent or buy, furnishing, the type of home, or a listing code. Each
   phrase it understands becomes a chip; removing a chip removes those words from the box.
   Until someone touches it, the box types two more examples by itself (not with reduced motion). */
(function () {
  'use strict';
  var d = document, root = d.getElementById('rs');
  if (!root || !window.REW_HOMES || !window.REW_LOCS) return;
  var form = d.getElementById('rs-form'), input = d.getElementById('rs-q'), chipsEl = d.getElementById('rs-chips'),
    sumEl = d.getElementById('rs-sum'), listEl = d.getElementById('rs-list'), moreEl = d.getElementById('rs-more');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HOMES = window.REW_HOMES.map(function (r) {
    return { code: r[0], loc: r[1], bhk: r[2], type: r[3], floor: r[4], area: r[5], furn: r[6], deal: r[7], price: r[8], ver: r[9], photo: r[10] };
  });
  var LOCS = window.REW_LOCS.map(function (l) {
    return { key: l[0], name: l[1], re: new RegExp('(?:\\b(?:in|at|near|around|or|and)\\s+)?\\b(?:' + l[2] + ')(?![\\w])', 'g') };
  });
  var NAME = {}; LOCS.forEach(function (l) { NAME[l.key] = l.name; });
  var WORD = { one: 1, two: 2, three: 3, four: 4, five: 5 };
  var UNIT = { thousand: 1e3, k: 1e3, lakh: 1e5, lakhs: 1e5, lac: 1e5, lacs: 1e5, l: 1e5, crore: 1e7, crores: 1e7, cr: 1e7 };
  var NUM = '(\\d[\\d,]*(?:\\.\\d+)?)', UN = '(thousand|lakhs?|lacs?|crores?|cr|k|l)', RS = '(?:rs\\.?\\s*|inr\\s*)?';
  var RE = {
    code: /\bab[\s-]*([a-z]{2})[\s-]*(\d{3})\b/g,
    bhkR: /\b([1-5])\s*(?:-|–|to|or)\s*([1-5])\s*-?\s*(?:bhk|b\.h\.k\.?|beds?|bedrooms?|br)\b/g,
    bhk: /\b([1-5]|one|two|three|four|five)\s*-?\s*(?:bhk|b\.h\.k\.?|beds?|bedrooms?|br)\b/g,
    semi: /\bsemi[\s-]*furnished\b/g,
    unf: /\b(?:un[\s-]*furnished|bare[\s-]*shell)\b/g,
    furn: /\b(?:fully[\s-]*)?furnished\b/g,
    bf: /\b(?:builder|independent)[\s-]*floors?\b/g,
    house: /\b(?:independent\s+house|houses?|kothi|bungalow|villa)\b/g,
    apt: /\b(?:apartments?|flats?)\b/g,
    sale: /\b(?:for\s+sale|on\s+sale|to\s+buy|buy(?:ing)?|purchase|resale)\b/g,
    rent: /\b(?:for\s+rent|to\s+rent|on\s+rent|rent(?:al|ing)?|to\s+let|lease)\b/g,
    range: new RegExp('(?:\\bbetween\\s+)?' + RS + NUM + '\\s*' + UN + '?\\s*(?:-|–|to|and)\\s*' + RS + NUM + '\\s*' + UN + '(?![a-z])', 'g'),
    max: new RegExp('(?:\\b(?:under|below|upto|up\\s*to|within|max(?:imum)?|less\\s*than|not\\s*more\\s*than|at\\s*most|till|budget(?:\\s*(?:is|of))?|around|about)\\s*|<=?\\s*)' + RS + NUM + '\\s*' + UN + '?(?![a-z\\d])', 'g'),
    min: new RegExp('(?:\\b(?:above|over|more\\s*than|min(?:imum)?|from|at\\s*least|starting(?:\\s*at)?)\\s*|>=?\\s*)' + RS + NUM + '\\s*' + UN + '?(?![a-z\\d])', 'g'),
    amt: new RegExp('\\b' + RS + NUM + '\\s*' + UN + '(?![a-z])', 'g'),
    big: /\b(?:rs\.?\s*|inr\s*)?(\d{1,3}(?:,\d{2,3})+|\d{5,9})\b(?!\s*(?:sq|sqft|square))/g,
    near: /\b(?:in|at|near|around)\s+([a-z][a-z.]+(?:\s+[a-z][a-z.]+)?)/
  };
  var STOP = /^(?:south|delhi|new|the|a|an|my|any|all|good|nice|budget|rent|sale|city|area|town|family|total|range|month|monthly|january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec|lakh|lakhs|crore|cr|k|rs|inr)$/;

  function amount(n, u) {
    var v = parseFloat(String(n).replace(/,/g, ''));
    if (isNaN(v)) return 0;
    if (u) return v * (UNIT[u] || 1);
    if (v >= 1000) return v;
    return v <= 20 ? v * 1e5 : v * 1e3;
  }
  function num(x) { return String(Math.round(x * 100) / 100); }
  function money(p) { return p >= 1e7 ? '₹' + num(p / 1e7) + ' Cr' : p >= 1e5 ? '₹' + num(p / 1e5) + ' L' : '₹' + num(p / 1e3) + 'k'; }
  function band(q) {
    if (q.min && q.max) {
      var u = q.max >= 1e7 ? [1e7, ' Cr'] : q.max >= 1e5 ? [1e5, ' L'] : [1e3, 'k'];
      return q.min >= u[0] ? '₹' + num(q.min / u[0]) + '–' + num(q.max / u[0]) + u[1] : money(q.min) + '–' + money(q.max);
    }
    return q.max ? 'up to ' + money(q.max) : 'from ' + money(q.min);
  }

  /* read a sentence: every phrase found is blanked out of a working copy (same length, so positions hold) */
  function parse(raw) {
    var w = raw.toLowerCase().replace(/₹/g, ' '), toks = [];
    var q = { bhk: null, locs: [], min: 0, max: 0, deal: null, furn: null, type: null, code: null, toks: toks, unknown: null };
    function take(re, fn) {
      re.lastIndex = 0;
      var m, found = [];
      while ((m = re.exec(w))) { found.push(m); if (!m[0].length) re.lastIndex++; }
      found.forEach(function (m) {
        var lbl = fn(m);
        if (lbl === false) return;
        var a = m.index, b = a + m[0].length;
        w = w.slice(0, a) + new Array(b - a + 1).join(' ') + w.slice(b);
        if (lbl) toks.push({ a: a, b: b, label: lbl });
      });
    }
    take(RE.code, function (m) { q.code = ('AB-' + m[1] + '-' + m[2]).toUpperCase(); return q.code; });
    take(RE.bhkR, function (m) { if (q.bhk) return false; var x = +m[1], y = +m[2]; q.bhk = [Math.min(x, y), Math.max(x, y)]; return q.bhk[0] + '–' + q.bhk[1] + ' BHK'; });
    take(RE.bhk, function (m) { if (q.bhk) return false; var n = WORD[m[1]] || +m[1]; q.bhk = [n, n]; return n + ' BHK'; });
    take(RE.semi, function () { q.furn = 'Semi-furnished'; return 'Semi-furnished'; });
    take(RE.unf, function () { q.furn = 'Unfurnished'; return 'Unfurnished'; });
    take(RE.furn, function () { if (q.furn) return false; q.furn = 'Furnished'; return 'Furnished'; });
    take(RE.bf, function () { q.type = 'Builder floor'; return 'Builder floor'; });
    take(RE.house, function () { if (q.type) return false; q.type = 'House'; return 'House'; });
    take(RE.apt, function () { if (q.type) return false; q.type = 'Apartment'; return 'Apartment'; });
    take(RE.sale, function () { if (q.deal) return false; q.deal = 'sale'; return 'To buy'; });
    take(RE.rent, function () { if (q.deal) return false; q.deal = 'rent'; return 'To rent'; });
    LOCS.forEach(function (l) {
      take(l.re, function () { if (q.locs.indexOf(l.key) >= 0) return ''; q.locs.push(l.key); return l.name; });
    });
    var money_ = null;
    take(RE.range, function (m) {
      if (money_) return false;
      var u2 = m[4], u1 = m[2] || u2, lo = amount(m[1], u1), hi = amount(m[3], u2);
      if (!lo || !hi) return false;
      q.min = Math.min(lo, hi); q.max = Math.max(lo, hi); money_ = 1; return 'budget';
    });
    take(RE.max, function (m) { if (q.max) return false; q.max = amount(m[1], m[2]); money_ = 1; return q.max ? 'budget' : false; });
    take(RE.min, function (m) { if (q.min) return false; q.min = amount(m[1], m[2]); money_ = 1; return q.min ? 'budget' : false; });
    take(RE.amt, function (m) { if (q.max) return false; q.max = amount(m[1], m[2]); return q.max ? 'budget' : false; });
    take(RE.big, function (m) { if (q.max) return false; q.max = amount(m[1]); return q.max ? 'budget' : false; });
    /* one chip for the budget, however many phrases made it */
    var firstB = -1;
    for (var i = 0; i < toks.length; i++) {
      if (toks[i].label === 'budget') {
        if (firstB < 0) { firstB = i; toks[i].label = band(q); toks[i].spans = [[toks[i].a, toks[i].b]]; }
        else { toks[firstB].spans.push([toks[i].a, toks[i].b]); toks.splice(i--, 1); }
      }
    }
    toks.sort(function (x, y) { return x.a - y.a; });
    var u = RE.near.exec(w);
    if (u && !q.locs.length) {
      var words = u[1].split(/\s+/).filter(function (s) { return !STOP.test(s.replace(/\./g, '')); });
      if (words.length && !STOP.test(u[1].split(/\s+/)[0])) q.unknown = words.join(' ');
    }
    return q;
  }

  function fits(h, q, o) {
    if (q.code) return h.code === q.code;
    if (h.deal !== o.deal) return false;
    if (q.bhk && !o.anySize && (h.bhk < q.bhk[0] || h.bhk > q.bhk[1])) return false;
    if (q.locs.length && !o.anyLoc && q.locs.indexOf(h.loc) < 0) return false;
    if (q.max && h.price > q.max * (o.stretch || 1)) return false;
    if (q.min && h.price < q.min) return false;
    if (!o.loose && q.furn && h.furn !== q.furn) return false;
    if (!o.loose && q.type && h.type !== q.type) return false;
    return true;
  }
  function find(q) {
    var deal = q.deal || ((q.max >= 3e6 || q.min >= 3e6) ? 'sale' : 'rent');
    var where = q.locs.map(function (k) { return NAME[k]; }).join(' or '), size = q.bhk ? (q.bhk[0] === q.bhk[1] ? q.bhk[0] : q.bhk.join('–')) + ' BHK' : '';
    var tries = [
      [{}, ''],
      [{ stretch: 1.25 }, 'Nothing at or under ' + money(q.max) + ' right now. The closest, just over:'],
      [{ loose: 1 }, 'Nothing ' + [q.furn, q.type].filter(Boolean).join(', ').toLowerCase() + ' fits right now. Without that:'],
      [{ anySize: 1, loose: 1 }, 'No ' + size + ' fits that' + (where ? ' in ' + where : '') + '. Other sizes:'],
      [{ anyLoc: 1, loose: 1 }, 'Nothing like that in ' + where + ' right now. Elsewhere in South Delhi:'],
      [{ anySize: 1, anyLoc: 1, loose: 1 }, 'Nothing fits all of that. The closest:']
    ];
    for (var t = 0; t < tries.length; t++) {
      var o = tries[t][0];
      if (t === 1 && !q.max) continue;
      if (t === 2 && !q.furn && !q.type) continue;
      if (t === 3 && !q.bhk) continue;
      if (t === 4 && !q.locs.length) continue;
      if (t === 5 && !(q.bhk && q.locs.length)) continue;
      o.deal = deal;
      var list = HOMES.filter(function (h) { return fits(h, q, o); });
      if (list.length) {
        list.sort(function (a, b) {
          return (a.ver === null) - (b.ver === null) || (q.max && !o.stretch ? b.price - a.price : a.price - b.price) || (a.ver || 99) - (b.ver || 99);
        });
        return { list: list, deal: deal, note: tries[t][1] };
      }
      if (q.code) break;
    }
    return { list: [], deal: deal, note: '' };
  }

  function el(tag, cls, text) { var e = d.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function card(h) {
    var li = el('li', 'rs-card'), img = el('img'), b = el('div', 'rs-b'), p = el('p', 'rs-p'), m = el('p', 'rs-m'), c = el('code', '', h.code);
    img.src = 'img/real-estate-website/u-' + h.photo + '.webp'; img.alt = ''; img.width = 440; img.height = 294; img.loading = 'lazy'; img.decoding = 'async';
    p.appendChild(el('b', '', money(h.price)));
    if (h.deal === 'rent') p.appendChild(el('small', '', '/mo'));
    p.appendChild(h.ver === null ? el('span', 'rs-v pend', 'Check pending') : el('span', 'rs-v', 'Verified ' + h.ver + (h.ver === 1 ? ' day' : ' days') + ' ago'));
    var mi = el('span', 'rs-mi');
    [h.area.toLocaleString('en-IN') + ' sq ft', h.floor, h.furn].forEach(function (x) { mi.appendChild(el('span', '', x)); mi.appendChild(d.createTextNode(' ')); });
    mi.appendChild(c); m.appendChild(mi);
    var t = el('p', 'rs-t', h.bhk + ' BHK ' + h.type.toLowerCase() + ' ');
    t.appendChild(el('span', '', NAME[h.loc]));
    b.appendChild(p); b.appendChild(t); b.appendChild(m);
    li.appendChild(img); li.appendChild(b);
    return li;
  }

  var cur = null, lastKey = '', lastChips = '';
  function render(q) {
    cur = q;
    var chipKey = q.toks.map(function (t) { return t.label; }).join('|');
    if (chipKey !== lastChips) {
      lastChips = chipKey;
      chipsEl.textContent = '';
      if (q.toks.length) chipsEl.appendChild(el('span', 'lbl', 'Read as'));
      q.toks.forEach(function (t, i) {
        var bt = el('button', 'rs-chip', t.label);
        bt.type = 'button'; bt.setAttribute('data-i', i); bt.setAttribute('aria-label', 'Remove ' + t.label);
        chipsEl.appendChild(bt);
      });
    }
    var res = find(q), list = res.list, top = list.slice(0, 3), key;
    var known = q.toks.length > 0;
    sumEl.textContent = '';
    if (!known && !q.unknown) {
      key = 'none';
      sumEl.appendChild(d.createTextNode(input.value.trim() ? 'I didn’t catch a size, an area or a budget there. Try “2 bhk in saket under 60k”.' : 'Type the home you want, the way you’d say it.'));
      top = []; list = [];
    } else {
      if (q.unknown) {
        var u = el('span', 'rs-unk');
        u.appendChild(d.createTextNode('“' + q.unknown + '” isn’t one of the twelve areas here, so this searches all of them. '));
        sumEl.appendChild(u);
      }
      if (!list.length) {
        sumEl.appendChild(d.createTextNode(q.code ? 'No listing has the code ' + q.code + '.' : 'Nothing fits that yet.'));
      } else if (res.note) {
        sumEl.appendChild(d.createTextNode(res.note));
      } else {
        var pend = list.filter(function (h) { return h.ver === null; }).length;
        sumEl.appendChild(el('b', '', list.length + (list.length === 1 ? ' home' : ' homes')));
        sumEl.appendChild(d.createTextNode(' to ' + (res.deal === 'rent' ? 'rent' : 'buy') + (pend ? ': ' + (list.length - pend) + ' verified, ' + pend + ' awaiting ' + (pend === 1 ? 'its' : 'their') + ' check' : list.length > 1 ? ', all verified' : ', verified')));
      }
      key = top.map(function (h) { return h.code; }).join(',');
    }
    if (key !== lastKey) {
      lastKey = key;
      listEl.textContent = '';
      top.forEach(function (h, i) { var c = card(h); c.style.setProperty('--i', i); listEl.appendChild(c); });
    }
    moreEl.textContent = list.length > 3 && !res.note ? '+ ' + (list.length - 3) + ' more, sorted by fit' : '';
  }
  function run() { render(parse(input.value)); }

  /* removing a chip removes its words, and the little words that joined them */
  function drop(i) {
    var t = cur && cur.toks[i];
    if (!t) return;
    var spans = (t.spans || [[t.a, t.b]]).slice().sort(function (x, y) { return y[0] - x[0]; }), s = input.value;
    spans.forEach(function (sp) { s = s.slice(0, sp[0]) + ' ' + s.slice(sp[1]); });
    s = s.replace(/\s{2,}/g, ' ').replace(/\s+([,.])/g, '$1').replace(/^\s*(?:,|and|or|in)\s+/i, '').replace(/\s+(?:in|at|near|or|and|,)\s*$/i, '').trim();
    input.value = s;
    run();
    var next = chipsEl.querySelector('.rs-chip[data-i="' + Math.min(i, (cur.toks.length || 1) - 1) + '"]');
    (next || input).focus();
  }

  var deb = 0;
  input.addEventListener('input', function () { clearTimeout(deb); deb = setTimeout(run, 90); });
  form.addEventListener('submit', function (e) { e.preventDefault(); stopAuto(); run(); });
  chipsEl.addEventListener('click', function (e) { var b = e.target.closest('.rs-chip'); if (b) { stopAuto(); drop(+b.getAttribute('data-i')); } });
  [].forEach.call(root.querySelectorAll('[data-q]'), function (b) {
    b.addEventListener('click', function () { stopAuto(); input.value = b.getAttribute('data-q'); run(); });
  });

  /* first render: the same state the HTML already shows, without replaying the card entrance */
  root.classList.add('still'); run();
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove('still'); }); });

  /* the box types two more examples by itself, then the first again, until someone touches it */
  var EX = ['2 bhk in gk 1 or cr park below 70k', '4 bhk for sale under 13 cr', '3 bhk in vasant vihar under 1.5 lakh'];
  var auto = { on: false, done: false, t: 0, text: '' };
  function stopAuto() {
    if (!auto.on && auto.done) return;
    auto.on = false; auto.done = true; clearTimeout(auto.t);
    if (auto.text && input.value !== auto.text) { input.value = auto.text; run(); }
    root.classList.remove('typing'); sumEl.setAttribute('aria-live', 'polite');
  }
  function typeOut(text, then) {
    var i = 0; auto.text = text; input.value = ''; run();
    (function step() {
      if (!auto.on) return;
      input.value = text.slice(0, ++i); run();
      auto.t = setTimeout(i < text.length ? step : then, i < text.length ? 38 + Math.random() * 46 : 4200);
    })();
  }
  function startAuto() {
    if (reduce || auto.on || auto.done) return;
    auto.on = true; root.classList.add('typing'); sumEl.setAttribute('aria-live', 'off');
    var k = 0;
    (function next() {
      if (!auto.on) return;
      if (k >= EX.length) { stopAuto(); return; }
      typeOut(EX[k++], next);
    })();
  }
  ['pointerdown', 'keydown', 'focusin', 'wheel', 'touchstart'].forEach(function (ev) {
    root.addEventListener(ev, function (e) {
      if (!auto.on && auto.done) return;
      var wasOn = auto.on;
      stopAuto();
      if (wasOn && ev === 'focusin' && e.target === input) input.select();
    }, { passive: true });
  });
  if (!reduce && 'IntersectionObserver' in window) {
    var armed = 0;
    new IntersectionObserver(function (es) {
      var v = es[0].isIntersecting;
      if (v && !armed && !auto.done) { armed = setTimeout(startAuto, 3000); }
      else if (!v) { clearTimeout(armed); armed = 0; if (auto.on) stopAuto(); }
    }, { threshold: .5 }).observe(root);
  }
})();
