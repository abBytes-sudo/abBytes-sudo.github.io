/* Taradhura home: before first paint, choose the poster frame for the hour it is on the ridge (IST), so the page opens at the
   real hour whatever the visitor's own clock says. Sunrise and sunset by month (the 15th) come from the engine's sky module.
   The live 3D ridge takes over from this frame on the first touch or scroll. */
(function () {
  var SUN = [7.12, 17.58, 6.86, 18.01, 6.37, 18.33, 5.77, 18.63, 5.33, 18.94, 5.19, 19.21, 5.36, 19.22, 5.66, 18.88, 5.93, 18.3, 6.21, 17.7, 6.59, 17.28, 6.97, 17.25];
  var t = new Date(Date.now() + 5.5 * 36e5), h = t.getUTCHours() + t.getUTCMinutes() / 60, m = t.getUTCMonth(), rise = SUN[m * 2], set = SUN[m * 2 + 1];
  var k = h < rise - 1.6 || h >= set + 4.3 ? 'night' : h < rise + 0.1 ? 'dawn' : h < 11.5 ? 'morning' : h < set - 1.2 ? 'noon' : h < set + 0.6 ? 'copper' : 'lamps';
  var v = matchMedia('(max-aspect-ratio: 4/5)').matches ? '-m' : innerWidth <= 900 ? '-s' : '';
  var src = 'photos/hero-' + k + v + '.jpg', d = document.documentElement;
  d.setAttribute('data-sky', k); d.style.setProperty('--poster', 'url("' + src + '")');
  var l = document.createElement('link'); l.rel = 'preload'; l.as = 'image'; l.href = src; l.setAttribute('fetchpriority', 'high'); document.head.appendChild(l);
})();
