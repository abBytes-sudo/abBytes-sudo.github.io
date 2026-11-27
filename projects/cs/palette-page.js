/* Design-studio website: the page wears the palettes. The live site re-dresses one room in four palettes
   (The Pale, The Walnut, The Saffron, The Carmine); here the same four re-colour this case study. A palette is a
   class on <html> that swaps the page's CSS variables (design-studio-website.css); the change cross-fades in
   400 ms and is remembered for the visit (sessionStorage, wrapped in try/catch). Only The Pale was captured from
   the live site, so the room picture never changes and the caption says so.
   Loaded without defer in <head> so a remembered palette is on before the first paint. */
(function () {
  'use strict';
  var d = document, h = d.documentElement, KEY = 'dsw-palette';
  var NAMES = { pale: 'The Pale', walnut: 'The Walnut', saffron: 'The Saffron', carmine: 'The Carmine' };
  var THEME = { '': '#0d0c0a', pale: '#e9e5dd', walnut: '#2a1c12', saffron: '#f1d08a', carmine: '#3b0d15' };
  var cur = '', fadeT = 0;
  function saved() { try { var v = sessionStorage.getItem(KEY); return NAMES[v] ? v : ''; } catch (e) { return ''; } }
  function store(v) { try { if (v) sessionStorage.setItem(KEY, v); else sessionStorage.removeItem(KEY); } catch (e) { /* storage off: the palette lasts for this page view */ } }
  function set(p) { Object.keys(NAMES).forEach(function (k) { h.classList.toggle('pp-' + k, k === p); }); cur = p; }
  set(saved());

  function init() {
    var pp = d.getElementById('pp');
    if (!pp) return;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var btns = [].slice.call(pp.querySelectorAll('.pp-b')), cap = d.getElementById('pp-cap'), reset = d.getElementById('pp-reset');
    var meta = d.querySelector('meta[name="theme-color"]');
    function say(p) {
      if (!cap) return;
      if (!p) cap.textContent = 'The room in The Pale, from the live site. The live site has all four.';
      else if (p === 'pale') cap.textContent = 'This page now wears The Pale, and the room above is the live site’s own capture of it.';
      else cap.textContent = 'This page now wears ' + NAMES[p] + '. The live site re-dresses the room in it too; only The Pale was captured, so the room stays as it is.';
    }
    function show(p, fade) {
      if (fade && !reduce) {
        h.classList.add('pp-x');
        clearTimeout(fadeT); fadeT = setTimeout(function () { h.classList.remove('pp-x'); }, 460);
      }
      set(p);
      btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.p === p)); });
      if (reset) reset.hidden = !p;
      if (meta) meta.setAttribute('content', THEME[p]);
      say(p);
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () { var p = b.dataset.p === cur ? '' : b.dataset.p; show(p, true); store(p); });
    });
    if (reset) reset.addEventListener('click', function () { show('', true); store(''); if (btns[0]) btns[0].focus(); });
    show(cur, false);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})();
