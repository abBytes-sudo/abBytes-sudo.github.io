/* Taradhura: the lantern concierge is brought in once the page has settled (a moment after load, or at once on the first touch or key,
   or straight away when a chat was open on the page before). It reads the same data-* settings, passed on to concierge.js. */
(function () {
  var me = document.currentScript, done = false;
  if (!me) return;
  function go() {
    if (done) return; done = true;
    ['pointerdown', 'touchstart', 'keydown'].forEach(function (e) { removeEventListener(e, go); });
    var s = document.createElement('script'); s.src = me.getAttribute('data-src'); s.defer = true;
    [].forEach.call(me.attributes, function (a) { if (a.name.indexOf('data-') === 0 && a.name !== 'data-src') s.setAttribute(a.name, a.value); });
    document.head.appendChild(s);
  }
  var reopen = false; try { reopen = !!sessionStorage.getItem('cg-reopen-' + me.getAttribute('data-agent')); } catch (e) {}
  if (reopen) { go(); return; }
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (e) { addEventListener(e, go, { passive: true }); });
  function later() { setTimeout(function () { ('requestIdleCallback' in window) ? requestIdleCallback(go, { timeout: 1200 }) : go(); }, 900); }
  if (document.readyState === 'complete') later(); else addEventListener('load', later);
})();
