/* Taradhura policies: highlight the section in view. */
(function () {
  'use strict';
  var links = [].slice.call(document.querySelectorAll('#pol-nav a'));
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { var on = a.getAttribute('href') === '#' + e.target.id; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); });
  }, { rootMargin: '-30% 0px -60% 0px' });
  links.forEach(function (a) { var s = document.querySelector(a.getAttribute('href')); if (s) io.observe(s); });
})();
