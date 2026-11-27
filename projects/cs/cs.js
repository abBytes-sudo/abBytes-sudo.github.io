/* Case studies: the shared behaviour. Header turns solid after the hero, sections reveal, charts draw when they
   come into view, the footer shows when the page last changed, and "screen cinema" pins one frame while the
   stops scroll past: each stop names an image and a point to pan and zoom to.

   Screen cinema markup (see real-estate-crm.html):
   <div class="cin">
     <figure class="cin-frame"><div class="cin-bar"><i></i><i></i><i></i><span></span><b></b></div>
       <div class="cin-view"><img class="a" alt=""><img class="b off" alt=""><i class="cin-ring"></i></div></figure>
     <ol class="cin-stops">
       <li class="cin-stop" data-img="../img/x.webp" data-w="1600" data-h="1000" data-x=".3" data-y=".2" data-zoom="2"
           data-ring="140" data-label="Enquiry workspace" data-alt="What the image shows">
         <span class="t">09:14</span><h3>Title</h3><p>Callout</p></li>
     </ol></div>
   x and y are the point to centre (0 to 1 across the image), zoom 1 fits the width, 2 is twice that.
   data-ring (optional) circles the point, in image pixels. Under 900 px, and for reduced motion, every stop
   gets its own still crop above its text instead of the pinned frame. */
(function () {
  'use strict';
  var d = document, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, hasIO = 'IntersectionObserver' in window;
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function $$(s, r) { return [].slice.call((r || d).querySelectorAll(s)); }
  function seen(el, fn, opt) {
    if (!hasIO) { fn(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { fn(e.isIntersecting, e); }); }, opt || { threshold: 0 }).observe(el);
  }
  function once(els, cls, th) {
    els.forEach(function (el) {
      if (reduce || !hasIO) { el.classList.add(cls); return; }
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { el.classList.add(cls); io.disconnect(); } }, { threshold: th || .2 });
      io.observe(el);
    });
  }

  /* header: transparent over the hero, solid after it */
  var top = d.querySelector('.top');
  if (top) {
    var hero = d.querySelector('.cs-hero'), dark = d.body.hasAttribute('data-dark');      // data-dark: a page that stays dark below its hero keeps the hero's bar
    var solid = function () { top.classList.toggle('solid', scrollY > 40); top.classList.toggle('lite', !dark && !!hero && scrollY > hero.offsetTop + hero.offsetHeight - 60); };
    addEventListener('scroll', solid, { passive: true }); solid();
  }

  once($$('.rv'), 'in', .12);
  once($$('.cs-chart, [data-draw]'), 'on', .35);

  /* footer: the date this page last changed, when the server says */
  var up = d.getElementById('cs-upd'), lm = Date.parse(d.lastModified);
  if (up && lm && Math.abs(Date.now() - lm) > 120000) {
    var u = new Date(lm);
    up.textContent = u.getDate() + ' ' + MON[u.getMonth()] + ' ' + u.getFullYear();
    up.setAttribute('datetime', u.getFullYear() + '-' + ('0' + (u.getMonth() + 1)).slice(-2) + '-' + ('0' + u.getDate()).slice(-2));
  }
  var foot = d.querySelector('.cs-foot');
  if (foot && !reduce) seen(foot, function (v) { foot.classList.toggle('on', v); });

  /* ---- screen cinema ---- */
  function place(img, st, vw, vh) {
    var iw = +st.dataset.w || 1600, ih = +st.dataset.h || 1000, z = +(st.dataset.zoom || 1), x = +(st.dataset.x || .5), y = +(st.dataset.y || .5);
    var s = vw / iw * z, W = iw * s, H = ih * s, tx = vw / 2 - x * W, ty = vh / 2 - y * H;
    tx = W > vw ? Math.min(0, Math.max(vw - W, tx)) : (vw - W) / 2;
    ty = H > vh ? Math.min(0, Math.max(vh - H, ty)) : (vh - H) / 2;
    img.style.width = iw + 'px'; img.style.height = ih + 'px';
    img.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + s.toFixed(4) + ')';
    return { px: tx + x * W, py: ty + y * H, s: s };
  }
  function cinema(c) {
    var view = c.querySelector('.cin-view'), label = c.querySelector('.cin-bar span'), num = c.querySelector('.cin-bar b');
    var stops = $$('.cin-stop', c), n = stops.length, cur = -1, front = null, A, B, ring, flat = null, started = false;
    if (!view || !n) return;
    A = view.querySelector('img.a'); B = view.querySelector('img.b'); ring = view.querySelector('.cin-ring');
    var wide = matchMedia('(min-width: 900px)');
    function pad(i) { return (i < 9 ? '0' : '') + (i + 1); }
    function frameSize() { return [view.clientWidth, view.clientHeight]; }
    function aim(i, instant) {
      var st = stops[i], sz = frameSize(), want = st.dataset.img;
      stops.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      if (label) label.textContent = st.dataset.label || '';
      if (num) num.textContent = pad(i) + ' / ' + pad(n - 1);
      var target = front && front.getAttribute('src') === want ? front : (front === A ? B : A);
      function finish() {
        var p = place(target, st, sz[0], sz[1]);
        target.alt = st.dataset.alt || '';
        if (target !== front) {
          target.classList.remove('off');
          if (front) { front.classList.add('off'); front.alt = ''; }
          front = target;
          requestAnimationFrame(function () { requestAnimationFrame(function () { target.style.transition = ''; }); });
        }
        if (ring) {
          var r = +st.dataset.ring || 0;
          ring.classList.toggle('on', !!r);
          if (r) { ring.style.setProperty('--rs', Math.max(60, r * p.s) + 'px'); ring.style.transform = 'translate(' + p.px.toFixed(1) + 'px,' + p.py.toFixed(1) + 'px)'; }
        }
      }
      if (target === front) { finish(); return; }
      target.style.transition = instant ? 'none' : 'opacity .45s ease';
      if (target.getAttribute('src') !== want) target.setAttribute('src', want);
      if (target.complete && target.naturalWidth) finish();
      else { target.onload = function () { target.onload = null; finish(); }; }
    }
    function crops() {
      stops.forEach(function (st) {
        var box = st.querySelector('.cin-crop');
        if (!box) {
          box = d.createElement('div'); box.className = 'cin-crop';
          var im = d.createElement('img'); im.loading = 'lazy'; im.decoding = 'async'; im.alt = st.dataset.alt || ''; im.src = st.dataset.img;
          box.appendChild(im); st.insertBefore(box, st.firstChild);
        }
        var img = box.querySelector('img');
        if (box.clientWidth) place(img, st, box.clientWidth, box.clientHeight);
      });
    }
    function mode() {
      var f = reduce || !wide.matches;
      c.classList.toggle('flat', f);
      if (f) { crops(); flat = true; return; }
      flat = false;
      if (started) aim(Math.max(0, cur), true);
    }
    function start() {
      if (started) return; started = true;
      if (!flat) aim(0, true);
    }
    mode();
    if (wide.addEventListener) wide.addEventListener('change', mode);
    var rq = 0;
    addEventListener('resize', function () { if (!rq) rq = requestAnimationFrame(function () { rq = 0; if (flat) crops(); else if (started) aim(Math.max(0, cur), true); }); });
    if (!hasIO) { start(); return; }
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) start(); }, { rootMargin: '600px 0px' }).observe(c);
    var io = new IntersectionObserver(function (es) {
      if (flat) return;
      es.forEach(function (e) { if (e.isIntersecting) { var i = stops.indexOf(e.target); if (i !== cur) { cur = i; start(); aim(i); } } });
    }, { rootMargin: '-48% 0px -48% 0px' });
    stops.forEach(function (s) { io.observe(s); });
  }
  $$('.cin').forEach(cinema);
})();
