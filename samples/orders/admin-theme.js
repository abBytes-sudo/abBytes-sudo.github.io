/* Runs before first paint (no inline scripts under the CSP):
   - applies the saved back-office theme;
   - tells the static shell which greeting and route to show, so the first paint is real content, not a blank page;
   - switches the Google Fonts stylesheet (linked with media="print", so it never blocks rendering) on once it has loaded. */
(function () {
  var de = document.documentElement;
  try { var t = localStorage.getItem('nl-admin-theme'); if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) de.setAttribute('data-theme', 'dark'); } catch (e) {}
  var h = new Date().getHours(); de.setAttribute('data-greet', h < 12 ? 'm' : h < 17 ? 'a' : 'e');
  var r = (location.hash.replace(/^#\/?/, '').split(/[/?]/)[0]) || 'home'; de.setAttribute('data-route', r);
  var l = document.getElementById('gf'); if (l) { var on = function () { l.media = 'all'; }; if (l.sheet) on(); else { l.addEventListener('load', on); setTimeout(function () { if (l.sheet) on(); }, 3000); } }
})();
