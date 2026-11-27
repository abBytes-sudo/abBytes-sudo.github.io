/* Design-studio website: the 3D Lab's builder-floor chapter loads only when asked for, and "a new project in
   three steps" plays once when it comes into view: six fields typed into the data file, the page appears, the
   portfolio filter picks it up. With reduced motion (or no script) the three moments sit side by side, complete. */
(function () {
  'use strict';
  var d = document, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var lab = d.getElementById('lab-building');
  if (lab) lab.querySelector('button').addEventListener('click', function () {
    var f = d.createElement('iframe');
    f.src = lab.dataset.src; f.title = 'Explore a builder floor, a 3D Lab chapter'; f.loading = 'lazy';
    f.setAttribute('allow', 'fullscreen');
    lab.textContent = ''; lab.appendChild(f); f.focus();
  });

  var np = d.getElementById('np');
  if (!np) return;
  var play = d.getElementById('np-play');
  if (reduce) { if (play) play.hidden = true; return; }
  var url = np.querySelector('.np-url'), vals = [].slice.call(np.querySelectorAll('.np-json .v')), nums = [].slice.call(np.querySelectorAll('.np-chips b[data-a]'));
  var timers = [];
  vals.forEach(function (v) { v.dataset.t = v.textContent; });
  np.classList.add('js', 'p1');
  if (play) play.hidden = true;

  function at(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function stage(c) { np.classList.remove('p1', 'p2', 'p3', 'end'); np.classList.add(c); }
  function run() {
    timers.forEach(clearTimeout); timers = [];
    if (play) play.hidden = true;
    vals.forEach(function (v) { v.textContent = ''; v.classList.remove('cur'); });
    nums.forEach(function (b) { b.textContent = b.dataset.a; b.classList.remove('flip'); });
    url.textContent = 'data/projects.json';
    stage('p1');
    var tm = 450;
    vals.forEach(function (v) {
      var txt = v.dataset.t;
      at(function () { vals.forEach(function (x) { x.classList.remove('cur'); }); v.classList.add('cur'); }, tm);
      for (var i = 1; i <= txt.length; i++) (function (k) { at(function () { v.textContent = txt.slice(0, k); }, tm + k * 30); })(i);
      tm += txt.length * 30 + 200;
    });
    at(function () { vals.forEach(function (x) { x.classList.remove('cur'); }); }, tm);
    tm += 450;
    at(function () { stage('p2'); url.textContent = '/projects/the-courtyard-house/'; }, tm);
    tm += 2700;
    at(function () { stage('p3'); url.textContent = '/projects/'; }, tm);
    at(function () { nums.forEach(function (b) { b.textContent = b.dataset.b; b.classList.remove('flip'); void b.offsetWidth; b.classList.add('flip'); }); }, tm + 500);
    at(function () { np.classList.add('end'); if (play) play.hidden = false; }, tm + 1500);
  }
  if (play) play.addEventListener('click', run);
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); run(); } }, { threshold: .45 });
    io.observe(np);
  } else run();
})();
