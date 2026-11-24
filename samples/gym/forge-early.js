/* Applies the full stylesheets once they arrive (they load with media="print" so they never block first paint; the critical CSS is inlined). */
(function () {
  [].forEach.call(document.querySelectorAll('link[data-async]'), function (l) {
    var on = function () { l.media = 'all'; };
    if (l.sheet) on(); else l.addEventListener('load', on);
  });
})();

/* Detail pages render from JS, so the browser can't discover their hero image early. Preload it from the URL id. */
(function () {
  var id = (location.search.match(/[?&]id=([a-z-]+)/) || [])[1], path = location.pathname, src;
  if (!id) return;
  var CLS = { 'heavy-hour': 'strength', foundations: 'class-chalk', 'kettlebell-club': 'class-kettlebell', 'engine-room': 'engine', 'erg-lab': 'class-erg', 'tempo-run': 'engine', 'hyrox-sim': 'class-sled', stations: 'hyrox', doubles: 'method', mobility: 'class-mobility', contrast: 'recovery' };
  var l = document.createElement('link'); l.rel = 'preload'; l.as = 'image'; l.setAttribute('fetchpriority', 'high');
  if (/coach\.html$/.test(path) && /^(kofi|tenzin|mateo|meera|zoya|aren)$/.test(id)) {
    src = 'photos/coach-' + id; l.href = src + '.jpg'; l.setAttribute('imagesrcset', src + '-640.jpg 640w, ' + src + '.jpg 900w'); l.setAttribute('imagesizes', '(max-width: 860px) 92vw, 40vw');
  } else if (/class\.html$/.test(path) && CLS[id]) {
    src = 'photos/' + CLS[id]; l.href = src + '.jpg';
    if (CLS[id].indexOf('class-') === 0) { l.setAttribute('imagesrcset', src + '-800.jpg 800w, ' + src + '.jpg 1400w'); l.setAttribute('imagesizes', '100vw'); }
  } else return;
  document.head.appendChild(l);
})();
