/* Lumen CRM Pro — boot last, after every module has registered its views.
   loader.js fetches this bundle right after the static shell ("Opening the demo workspace…") has painted. */
(function () {
  'use strict';
  var C = window.CRM;
  C.boot(); if (C.whoPaint) C.whoPaint(); C.bell(); setTimeout(C.remindTick, 4000);
})();
