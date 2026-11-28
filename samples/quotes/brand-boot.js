/* Studio OS, "See it with your name on it": the part that must run first. Small and synchronous on purpose.
   It reads a #brand= or ?brand= link (Name|Initial|hex), keeps it in localStorage, and sets the accent and the few static words
   that carry the studio's name before the first paint, so nobody sees the example studio flash up first.
   The panel (brand.js, brand.css) is loaded only when someone opens it. With no brand set, this file changes nothing. */
(function () {
  'use strict';
  var DIR = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*(\?.*)?$/, ''), KEY = 'studio-os-brand-v1', DEF = '0E5C57', INK = '141C1A', root = document.documentElement, B = null, style = null;

  /* ---------- clean-up and validation (same rules for a link, for storage and for the panel) ---------- */
  function clean(s) { return String(s == null ? '' : s).replace(/[<>&"'`|\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, '').replace(/\s+/g, ' ').trim(); }
  function chars(s) { return Array.from ? Array.from(s) : s.split(''); }
  function validate(name, initial, hex) {
    name = clean(name);
    if (chars(name).length < 2 || chars(name).length > 32) return null;
    initial = clean(initial).replace(/\s/g, '');
    var ic = chars(initial);
    if (ic.length > 2) return null;
    if (!ic.length) ic = chars(name).slice(0, 1);
    initial = ic.join('').toUpperCase();
    hex = String(hex == null ? '' : hex).replace(/^#/, '');
    if (!hex) hex = DEF;
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
    return { name: name, initial: initial, hex: hex.toUpperCase() };
  }
  function parts(raw) {   // "Atelier%20Kanso|K|2F6F5E" -> brand or null
    var d; try { d = decodeURIComponent(String(raw).replace(/\+/g, ' ')); } catch (e) { return null; }
    if (d.length > 120) return null;
    var p = d.split('|'); if (p.length > 3) return null;
    return validate(p[0], p[1] || '', p[2] || '');
  }
  function read() { try { var o = JSON.parse(localStorage.getItem(KEY) || 'null'); return o && typeof o === 'object' ? validate(o.name, o.initial, o.hex) : null; } catch (e) { return null; } }
  function write(b) { try { if (b) localStorage.setItem(KEY, JSON.stringify({ name: b.name, initial: b.initial, hex: b.hex })); else localStorage.removeItem(KEY); } catch (e) { /* private mode: the brand lasts for this page only */ } }

  /* ---------- colour ---------- */
  function rgb(h) { return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function hx(a) { return a.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join('').toUpperCase(); }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hx([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]); }
  function lum(h) { var c = rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function cr(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function ok(c, bgs) { return bgs.every(function (b) { return cr(c, b) >= 4.5; }); }
  function palette(H) {
    var fill = H, on = 'FFFFFF', i, t;
    if (cr(fill, 'FFFFFF') < 4.5) {
      if (cr(fill, INK) >= 4.5) on = INK;
      else { for (i = 1; i < 25 && cr(fill, 'FFFFFF') < 4.5; i++) fill = mix(H, '000000', i * 0.04); }   // mid tones: deepen the fill until white reads
    }
    var hov = fill; [0.18, 0.12, 0.08, 0.04].some(function (a) { hov = mix(fill, '000000', a); return cr(on, hov) >= 4.5; });
    var tint = mix(fill, 'FFFFFF', 0.88), t2 = mix(fill, 'FFFFFF', 0.94), lt = mix(fill, 'FFFFFF', 0.7);
    var ink = [fill, mix(fill, INK, 0.5), INK].filter(function (c) { return ok(c, ['FFFFFF', 'EEF0EC', tint]); })[0] || INK;   // text on paper: the colour if it reads, else ink
    var L = { brand: fill, on: on, h: hov, t: tint, t2: t2, l: lt, ink: ink };
    var dt = mix('151D1B', fill, 0.16), dink = fill;   // dark theme: text and tints sit on a dark surface
    for (t = 0; t <= 1.001 && !ok(dink, ['151D1B', '0F1615', dt]); t += 0.05) dink = mix(fill, 'FFFFFF', t);
    var D = { brand: fill, on: on, h: hov, t: dt, t2: mix('0F1615', fill, 0.1), l: mix('151D1B', fill, 0.4), ink: dink };
    return { L: L, D: D, rgb: rgb(fill) };
  }
  function vars(P, ring) {
    var r = rgb(P.brand);
    return '--brand:#' + P.brand + ';--brand-h:#' + P.h + ';--brand-t:#' + P.t + ';--brand-t2:#' + P.t2 + ';--brand-l:#' + P.l + ';--brand-ink:#' + P.ink + ';--on-brand:#' + P.on +
      ';--ring:rgba(' + r.join(',') + ',.14);--ring-2:rgba(' + r.join(',') + ',.12)';
  }
  function paint(hex) {   // sets or clears the accent; used for the first paint and for the live preview in the panel
    if (!style) { style = document.createElement('style'); style.id = 'brand-style'; (document.head || root).appendChild(style); }
    if (!hex) { style.textContent = ''; root.removeAttribute('data-brand'); return; }
    var P = palette(hex);
    style.textContent = 'html:root[data-brand]{' + vars(P.L) + '}html:root[data-brand][data-theme=dark]{' + vars(P.D) + '}html:root[data-brand][data-theme=dark] .doc{' + vars(P.L) + '}';
    root.setAttribute('data-brand', '1');
  }

  /* ---------- the link ---------- */
  function part(b) { return encodeURIComponent(b.name) + '|' + encodeURIComponent(b.initial) + '|' + b.hex; }
  function link(b) {   // the link for what is on screen right now: page and app start use #brand=, any other app route uses ?brand=
    var loc = location, base = loc.origin + loc.pathname, isApp = !/product\.html$/.test(loc.pathname), h = loc.hash;
    if (!isApp || !h || h === '#' || h === '#/') return base + '#brand=' + part(b);
    var keep = loc.search.replace(/^\?/, '').split('&').filter(function (kv) { return kv && !/^(brand|dev)=/.test(kv); });
    keep.push('brand=' + part(b));
    return base + '?' + keep.join('&') + h;
  }

  /* ---------- read the address, store, tidy the bar ---------- */
  var urlSaid = false;
  (function () {
    var s = location.search, h = location.hash, m = /(?:^\?|&)brand=([^&#]*)/.exec(s), hm = /^#brand=(.*)$/.exec(h), got = null, search = s, hash = h, touched = false;
    if (m) { urlSaid = true; got = parts(m[1]); search = s.replace(/([?&])brand=[^&#]*(&|$)/, function (_, a, b) { return b ? a : ''; }).replace(/[?&]$/, ''); touched = true; }
    if (hm) { urlSaid = true; got = parts(hm[1]) || got; hash = ''; touched = true; }
    if (got) write(got);
    B = got || read();
    if (touched && window.history && history.replaceState) { try { history.replaceState(history.state, '', location.pathname + search + hash); } catch (e) { /* keep the address as it is */ } }
  })();

  /* ---------- the studio's name on the static words of the page ---------- */
  function slug(n) { var s = n.toLowerCase().replace(/[^a-z0-9]/g, ''); return s || 'studio'; }
  function put(el, k) {
    var n = B.name, t = k.split(':')[0];
    if (t === 'mark') { el.textContent = B.initial; el.setAttribute('data-n', String(chars(B.initial).length)); }
    else if (t === 'name') el.textContent = n;
    else if (t === 'aria') el.setAttribute('aria-label', n + ' Studio OS, home');
    else if (t === 'hello') el.textContent = n + ' Studio OS';
    else if (t === 'for') { el.textContent = 'for ' + n; el.hidden = false; }
    else if (t === 'hero') { el.textContent = 'Set up for ' + n + '.'; el.hidden = false; }
    else if (t === 'copy') el.textContent = 'Studio OS, set up for ' + n;
    else if (t === 'entry') el.textContent = 'Your studio';
    else if (t === 'open') {   // "Open <Name>'s Studio OS" where it fits, otherwise the button keeps its words
      var lim = k === 'open:nav' ? (window.innerWidth >= 700 ? 14 : 0) : 18;
      if (chars(n).length <= lim) el.textContent = 'Open ' + n + '’s Studio OS';
    }
  }
  function dom() {
    var list = document.querySelectorAll('[data-bn]:not([data-bd])');
    for (var i = 0; i < list.length; i++) { put(list[i], list[i].getAttribute('data-bn')); list[i].setAttribute('data-bd', '1'); }
  }
  function titled(t) { return t.replace(/\bby Marlow & Reed\b/, 'for ' + B.name).replace(/Marlow & Reed/g, B.name); }

  var SB = window.StudioBrand = {
    KEY: KEY, DEFAULT: DEF, get: function () { return B ? { name: B.name, initial: B.initial, hex: B.hex, n: chars(B.initial).length, slug: slug(B.name) } : null; },
    validate: validate, palette: palette, paint: paint, link: link, part: part,
    set: function (o) { var v = validate(o.name, o.initial, o.hex); if (v) write(v); return v; },
    clear: function () { write(null); },
    titled: function (t) { return B ? titled(t) : t; },
    open: function (from) { load(function () { if (SB.panel) SB.panel.open(from); }); }
  };

  function load(done) {
    if (SB.panel) return done();
    if (!document.getElementById('brand-css')) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.id = 'brand-css'; l.href = DIR + 'brand.css?v=1'; document.head.appendChild(l); }
    var s = document.createElement('script'); s.src = DIR + 'brand.js?v=1'; s.onload = done; s.onerror = function () { SB.failed = true; }; document.head.appendChild(s);
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-brand-open]'); if (!t) return;
    e.preventDefault(); SB.open(t);
  });

  /* ---------- apply ---------- */
  if (B) {
    paint(B.hex);
    document.title = titled(document.title);
    dom();
    var mo = window.MutationObserver ? new MutationObserver(dom) : null;
    if (mo) mo.observe(document, { childList: true, subtree: true });
    document.addEventListener('DOMContentLoaded', function () { dom(); if (mo) mo.disconnect(); document.title = titled(document.title); });
  }
})();
