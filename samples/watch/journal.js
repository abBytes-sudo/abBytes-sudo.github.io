/* Ghatika journal index: topic filters over the prerendered cards (the lead story joins the list only when its topic is chosen). */
(function () {
  'use strict';
  var G = window.GH, $$ = G.$$;
  var cards = $$('#jlist .jcard'), btns = $$('#jf button');
  function show(cat) { cards.forEach(function (c, i) { c.hidden = cat === 'All' ? i === 0 : c.dataset.cat !== cat; }); }
  btns.forEach(function (b) { b.addEventListener('click', function () { btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); show(b.textContent); }); });
  show('All');
})();
