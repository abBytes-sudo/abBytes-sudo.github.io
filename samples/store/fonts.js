/* Web fonts without blocking the first paint: the Google Fonts stylesheet is linked with media="print" (non-blocking)
   and switched to all media once it has loaded. Text shows in the fallback serif/sans until then (font-display: swap). */
(function () {
  var l = document.getElementById('gf'); if (!l) return;
  function on() { l.media = 'all'; }
  if (l.sheet) on(); else { l.addEventListener('load', on); setTimeout(function () { if (l.sheet) on(); }, 3000); }
})();
