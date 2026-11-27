/* Lumen CRM Pro — app-shell loader. The static shell in index.html paints first; then GSAP and the app load in
   order (async=false keeps the order). Add ?dev=1 to the URL to load the readable sources instead of the bundle.
   SRC and CSS are also read by site-src/lab/src/samples/crm-pro-build.sh, which builds app.min.js / app.min.css. */
(function () {
  'use strict';
  var SRC = ['data', 'core', 'halden', 'pro-data', 'pro-core', 'pro-model', 'views', 'bot', 'tools', 'records', 'deals', 'quotes', 'automate', 'reports', 'settings', 'convos', 'calendar', 'theme', 'roles', 'tasks', 'mkt', 'platform', 'builder', 'work', 'home', 'chat', 'cols', 'ds2', 'pro-boot'];
  var CSS = ['crm', 'pro', 'convos', 'calendar', 'theme', 'ds2', 'tasks', 'mkt', 'platform', 'roles', 'home'];
  var dev = /[?&]dev=1\b/.test(location.search), started = false;
  function add(src) { var s = document.createElement('script'); s.src = src; s.async = false; document.head.appendChild(s); }
  function go() {
    if (started) return; started = true;
    add('../assets/vendor/gsap.min.js');
    if (!dev) { add('app.min.js?v=16'); return; }
    var t = '?t=' + Date.now();
    CSS.forEach(function (c) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = c + '.css' + t; document.head.appendChild(l); });
    var m = document.querySelector('link[href^="app.min.css"]'); if (m) m.disabled = true;
    SRC.forEach(function (f) { add(f + '.js' + t); });
  }
  // wait until the shell frame has actually been presented, then fetch the app
  if (window.requestAnimationFrame) requestAnimationFrame(function () { setTimeout(go, 60); });
  setTimeout(go, 300);
})();
