/* Northlane Orders — start the page's scripts only after the first screen is really on screen.
   The HTML and CSS paint first (headline, the photograph); motion, data, the page's logic and the concierge follow.
   Unlike a double requestAnimationFrame, this waits for the browser's own first-contentful-paint entry and for the
   page's main photograph to have landed, so nothing here can run ahead of the largest paint.
   Usage: <script src="start.js" defer data-s="a.js,b.js" data-hero="img[fetchpriority=high]"
                  data-c-src="concierge.js" data-c-agent="…" …></script>
   - data-s: scripts to run, in order (paths relative to the page);
   - data-c-src plus data-c-*: one more script, added last with those data-* attributes (it reads document.currentScript). */
(function () {
  var me = document.currentScript, list = ((me && me.getAttribute('data-s')) || '').split(',').filter(Boolean);
  var hero = document.querySelector((me && me.getAttribute('data-hero')) || 'img[fetchpriority=high]'), done = false, painted = false, landed = !hero;
  function add(src, attrs) { var s = document.createElement('script'); s.src = src.trim(); s.async = false; if (attrs) Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); }); document.head.appendChild(s); }
  function go() {
    if (done) return; done = true;
    list.forEach(function (src) { add(src); });
    var c = me && me.getAttribute('data-c-src'); if (!c) return;
    var attrs = {}; [].forEach.call(me.attributes, function (a) { if (a.name.indexOf('data-c-') === 0 && a.name !== 'data-c-src') attrs['data-' + a.name.slice(7)] = a.value; });
    add(c, attrs);
  }
  function maybe() { if (painted && landed) setTimeout(go, 80); }
  if (hero) { var ok = function () { var d = hero.decode ? hero.decode() : null; if (d && d.then) d.then(function () { landed = true; maybe(); }, function () { landed = true; maybe(); }); else { landed = true; maybe(); } }; if (hero.complete) ok(); else { hero.addEventListener('load', ok, { once: true }); hero.addEventListener('error', function () { landed = true; maybe(); }, { once: true }); } }
  try {
    new PerformanceObserver(function (l, o) { if (l.getEntriesByName('first-contentful-paint').length) { o.disconnect(); painted = true; maybe(); } }).observe({ type: 'paint', buffered: true });
  } catch (e) { setTimeout(function () { painted = true; maybe(); }, 300); }
  setTimeout(go, 3000); // whatever happens, the page still starts
})();
