/* Fieldwise: Today's headline is painted with the first frame, before the app runs (app.js keeps the same node and fills in the real numbers). */
(function () {
  /* the app starts right after the first frame is on screen (its file is already downloading: see the preload in index.html) */
  var started = false;
  function start() { if (started) return; started = true; var s = document.createElement('script'); s.src = 'app.min.js?v=12'; document.head.appendChild(s); }
  requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(start, 0); }); });
  setTimeout(start, 400);
  var box = document.getElementById('ssr'), h = document.getElementById('ssr-h'), p = document.getElementById('ssr-p'); if (!box) return;
  var ok = !location.hash || location.hash === '#/today', c = null;
  try { var u = JSON.parse(localStorage.getItem('fieldwise-ui-v1') || '{}'); if (u.role === 'partner') ok = false; c = JSON.parse(localStorage.getItem('fieldwise-head-v1') || 'null'); if (c && u.role && c.r !== u.role) c = null; } catch (e) { c = null; }
  if (!ok) { box.remove(); return; }
  var d = new Date(), D = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (c && c.d === d.toDateString()) { h.textContent = c.t; p.textContent = c.s; }
  else { h.textContent = D[d.getDay()] + ' · calls, trips and papers that need you'; p.textContent = d.getDate() + ' ' + M[d.getMonth()] + ' · Amaltas Estates · Green Park office'; }
})();
