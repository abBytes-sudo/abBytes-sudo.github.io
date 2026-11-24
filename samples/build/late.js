/* Sthira · home only: start the page scripts and the hero poster right after the first paint, so the first paint
   never waits on them. Scripts keep their order (async=false). The poster fades in from its data-src. */
(function () {
  var me = document.currentScript, list = (me && me.getAttribute('data-js') || '').split(',').filter(Boolean);
  function go() {
    var p = document.getElementById('poster');
    if (p && p.dataset.src) { p.addEventListener('load', function () { p.classList.add('in'); }); p.src = p.dataset.src; }
    var s = document.querySelector('source[data-srcset]'); if (s) s.srcset = s.dataset.srcset;
    list.forEach(function (src) { var el = document.createElement('script'); el.src = src; el.async = false; document.head.appendChild(el); });
  }
  requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(go, 0); }); });
})();
