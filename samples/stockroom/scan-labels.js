/* The "Scan this page" section: three Code 128 shelf labels drawn with the app's own encoder (code128.js),
   a QR code for the deployed scan route (qr.js), and the typed-code fallback. */
(function () {
  'use strict';
  var URL_SCAN = 'https://abbytes-sudo.github.io/samples/stockroom/index.html#/scan';
  function init() {
    if (window.Code128) {
      [].slice.call(document.querySelectorAll('.lbl[data-code]')).forEach(function (fig) {
        // module 3 keeps the bars sharp on a phone camera; the canvas is scaled down by CSS to the label width
        window.Code128.draw(fig.querySelector('canvas'), fig.dataset.code, { module: 3, height: 84, label: false });
      });
    }
    var qr = document.getElementById('qr');
    if (qr && window.QR) window.QR.draw(qr, URL_SCAN, { scale: 5, quiet: 4 });

    // The app's scan route reads only ?so= (an order id), not a typed code, so the box opens plain #/scan.
    var input = document.getElementById('code-in'), go = document.getElementById('code-go');
    if (input && go) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); location.href = go.getAttribute('href'); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
