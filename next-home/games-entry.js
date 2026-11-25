/* Game cards on the homepage. Nothing else about the games is loaded until a card is clicked. */
(function () {
  'use strict';
  var d = document, base = d.documentElement.dataset.base || '';
  function bests() { [].forEach.call(d.querySelectorAll('[data-best]'), function (e) { var v = null; try { v = localStorage.getItem('am-best-' + e.dataset.best); } catch (x) { /* private mode */ } e.textContent = v ? 'Your best: ' + v : 'Not played yet'; }); }
  function go(id) {
    if (window.Arcade) return window.Arcade.open(id);
    var l = d.createElement('link'), s = d.createElement('script'); l.rel = 'stylesheet'; l.href = base + 'arcade.css?v=2'; d.head.appendChild(l);
    s.src = base + 'arcade.js?v=1'; s.onload = function () { window.Arcade.open(id); }; d.head.appendChild(s);
  }
  [].forEach.call(d.querySelectorAll('[data-game]'), function (b) { b.addEventListener('click', function () { go(b.dataset.game); }); });
  d.addEventListener('arcade-close', bests); bests();
})();
