/* Second line of defence for flaky networks: if app.js never ran (its request was dropped), fetch it again.
   app.js itself re-fetches any missing data/engine/code128/views script before it starts. */
(function () {
  'use strict';
  function tryApp(n) {
    if (window.SR_APP || n > 5) return;
    var s = document.createElement('script');
    s.src = 'app.js?r=' + Date.now() + n;
    s.onerror = function () { s.remove(); setTimeout(function () { tryApp(n + 1); }, 300 * (n + 1)); };
    document.head.appendChild(s);
  }
  addEventListener('load', function () { setTimeout(function () { tryApp(0); }, 50); });
})();
