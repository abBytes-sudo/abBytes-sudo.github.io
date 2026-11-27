/* Real Estate Platform CRM: the weekly-tasks chart says one sentence per week (hover, tap or keyboard),
   and the 3D Lab's "From print to listings" chapter loads only when asked for. */
(function () {
  'use strict';
  var d = document;
  var SAY = {
    b36: '<b>W36 · 31 Aug: 142 tasks</b>, the week before the cutover.',
    b37: '<b>W37 · 7 Sep: 121 tasks</b> in go-live week. The cutover was on Wednesday 9 September.',
    b38: '<b>W38 · 14 Sep: 137 tasks</b>, the first full week on the new system.',
    b39: '<b>W39 · 21 Sep: 199 tasks</b>, the third week.',
    b40: '<b>W40 · 28 Sep: 505 tasks</b>, three weeks after go-live: the busiest week so far.',
    b41: '<b>W41 · 5 Oct: 365 tasks.</b>',
    b42: '<b>W42 · 12 Oct: 334 tasks.</b> The weekly count settled in the 300s.'
  };
  var say = d.getElementById('wk-say'), bars = [].slice.call(d.querySelectorAll('.wk-bars li'));
  function show(li) {
    if (!say || !li) return;
    bars.forEach(function (b) { b.classList.toggle('cur', b === li); });
    say.innerHTML = SAY[li.className.split(' ')[0]] || '';
  }
  bars.forEach(function (li) {
    li.addEventListener('mouseenter', function () { show(li); });
    li.addEventListener('focus', function () { show(li); });
    li.addEventListener('click', function () { show(li); });
  });
  show(d.querySelector('.wk-bars .b40'));

  var lab = d.getElementById('lab-print');
  if (lab) lab.querySelector('button').addEventListener('click', function () {
    var f = d.createElement('iframe');
    f.src = lab.dataset.src; f.title = 'From print to listings, a 3D Lab chapter'; f.loading = 'lazy';
    f.setAttribute('allow', 'fullscreen');
    lab.textContent = ''; lab.appendChild(f); f.focus();
  });
})();
