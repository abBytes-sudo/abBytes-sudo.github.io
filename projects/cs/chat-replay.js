/* Real Estate Platform website, "A chat, replayed": one scripted conversation with Mitra, the site's assistant,
   plays message by message in the phone frame the first time it comes into view, while the CRM inbox beside it
   fills in the lead as each fact arrives. "Replay the chat" plays it again.
   The whole conversation and the finished lead card are in the HTML, so they read without JavaScript, and with
   reduced motion the finished state shows at once. Messages carry data-step="n"; the inbox rows with the same
   data-step appear when that message does. */
(function () {
  'use strict';
  var d = document, root = d.getElementById('rp');
  if (!root) return;
  var log = root.querySelector('.rp-log'), msgs = [].slice.call(root.querySelectorAll('.rp-m')),
    steps = [].slice.call(root.querySelectorAll('.rp-lead [data-step]')), typing = root.querySelector('.rp-type'),
    again = root.querySelector('.rp-again'), stage = root.querySelector('.rp-stage');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, timers = [], started = false;

  function later(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function bottom() { log.scrollTop = log.scrollHeight; }
  function step(n) { steps.forEach(function (s) { if (+s.getAttribute('data-step') <= n) s.classList.add('in'); }); }
  function finish() {
    timers.forEach(clearTimeout); timers = [];
    msgs.forEach(function (m) { m.classList.remove('wait'); });
    steps.forEach(function (s) { s.classList.add('in'); });
    typing.classList.remove('on');
    root.classList.remove('run');
    bottom();
  }
  function play() {
    timers.forEach(clearTimeout); timers = [];
    root.classList.add('run');
    msgs.forEach(function (m) { m.classList.add('wait'); });
    steps.forEach(function (s) { s.classList.remove('in'); });
    log.scrollTop = 0;
    var t = 500;
    msgs.forEach(function (m) {
      var who = m.classList.contains('v') ? 'v' : m.classList.contains('s') ? 's' : 'r', len = m.textContent.length;
      if (who === 'r') {
        later(t, function () { typing.classList.add('on'); bottom(); });
        t += 520 + Math.min(760, len * 9);
      } else t += who === 'v' ? 420 + Math.min(760, len * 13) : 700;
      later(t, function () {
        typing.classList.remove('on');
        m.classList.remove('wait');
        var s = m.getAttribute('data-step');
        if (s) step(+s);
        bottom();
      });
      t += 260;
    });
    later(t + 600, function () { root.classList.remove('run'); });
  }

  if (reduce || !('IntersectionObserver' in window)) { finish(); return; }
  /* waiting to be seen: an empty chat and a lead card with nothing in it yet */
  root.classList.add('run');
  msgs.forEach(function (m) { m.classList.add('wait'); });
  steps.forEach(function (s) { s.classList.remove('in'); });
  again.hidden = false;
  again.addEventListener('click', function () { started = true; play(); });
  var io = new IntersectionObserver(function (es) {
    if (es[0].isIntersecting && !started) { started = true; io.disconnect(); play(); }
  }, { threshold: .45 });
  io.observe(stage);
})();
