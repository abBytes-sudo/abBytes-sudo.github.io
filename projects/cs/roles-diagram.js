/* Entertainment platform: the roles diagram in the hero. One login in the middle, the four member profiles around
   it (fan, entertainer, venue, service provider), and the two people who run it (city partner, super admin).
   Picking one (tap, click, or the arrow keys: it is a tab list) lights the lines to what it shares with the
   others, and the sketch below pans across the drawn map (cs/entertainment-platform.svg) to that dashboard.
   Until someone touches it, it walks through all seven once by itself (not with reduced motion).
   Without JavaScript the kinds of user show as a plain list and the sketch shows the whole map. */
(function () {
  'use strict';
  var d = document, root = d.getElementById('rd');
  if (!root) return;
  var map = root.querySelector('.rd-map'), svg = root.querySelector('.rd-lines'), tabs = [].slice.call(root.querySelectorAll('.rd-n')),
    sheet = d.getElementById('rd-sheet'), view = root.querySelector('.rd-view'), img = view.querySelector('img'),
    tt = d.getElementById('rd-sh-t'), tp = d.getElementById('rd-sh-p'), tl = d.getElementById('rd-sh-l');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, NS = 'http://www.w3.org/2000/svg';
  var LAYOUT = {
    wide: { w: 640, h: 360, acc: [320, 180], fan: [205, 78], ent: [435, 78], svc: [205, 282], venue: [435, 282], cp: [82, 180], adm: [558, 180] },
    narrow: { w: 340, h: 420, acc: [170, 210], fan: [92, 120], ent: [262, 120], svc: [92, 300], venue: [262, 300], cp: [170, 32], adm: [170, 388] }
  };
  var EDGES = {
    's-fan': ['acc', 'fan', 'spoke'], 's-ent': ['acc', 'ent', 'spoke'], 's-venue': ['acc', 'venue', 'spoke'], 's-svc': ['acc', 'svc', 'spoke'],
    'cp': ['cp', 'acc', 'op'], 'adm': ['adm', 'acc', 'op'],
    'fan-ent': ['fan', 'ent', 'rel'], 'ent-venue': ['ent', 'venue', 'rel', .28], 'fan-svc': ['fan', 'svc', 'rel', .28], 'fan-venue': ['fan', 'venue', 'rel', .74]
  };
  var SPOKES = [['s-fan'], ['s-ent'], ['s-venue'], ['s-svc']];
  var KIND = {
    acc: { t: 'One login', p: 'Pick a profile at sign-in; switch or add one anytime.', s: 'the login with all four profiles', on: SPOKES },
    fan: { t: 'Fan', p: 'Tonight’s show, the week ahead, and the acts and venues they follow.', s: 'follows and enquiries with acts, venues and services',
      on: [['s-fan'], ['fan-ent', 'follows'], ['fan-venue', 'follows'], ['fan-svc', 'enquiries']] },
    ent: { t: 'Entertainer', p: 'The next gig, the week ahead, and gigs added once or weekly.', s: 'gigs with venues, followers with fans, posts with Post Studio',
      on: [['s-ent'], ['ent-venue', 'gigs'], ['fan-ent', 'follows']] },
    venue: { t: 'Venue', p: 'Several venues on one login, each with stages, a calendar and pitches.', s: 'gigs with acts, followers and enquiries with fans',
      on: [['s-venue'], ['ent-venue', 'gigs'], ['fan-venue', 'follows']] },
    svc: { t: 'Service provider', p: 'Listings that work as shopfronts, an enquiry inbox and a jobs calendar.', s: 'enquiries and reviews with members',
      on: [['s-svc'], ['fan-svc', 'enquiries']] },
    cp: { t: 'City partner', p: 'Looks after members, and can work inside their dashboards.', s: 'every member account it manages; commission from admins',
      on: [['cp', 'manages']].concat(SPOKES) },
    adm: { t: 'Super admin', p: 'Every account, moderation and money; partner payouts go in two steps.', s: 'every account; partner payouts in two steps',
      on: [['adm', 'runs it all'], ['cp', 'pays commission']].concat(SPOKES) }
  };
  /* where each dashboard sits on the drawn map (map units; the image is offset by 33) */
  var CELL = { acc: [500, 400], ent: [500, 40], fan: [960, 40], venue: [40, 400], svc: [960, 400], cp: [40, 760], adm: [500, 760] };
  var cur = 'acc', lines = {}, labels = [], L = null, pos = {}, byKey = {};
  tabs.forEach(function (b) { byKey[b.getAttribute('data-k')] = b; });

  root.classList.add('js');
  Object.keys(EDGES).forEach(function (id) {
    var e = d.createElementNS(NS, 'line');
    e.setAttribute('class', 'rd-e ' + EDGES[id][2]);
    e.setAttribute('pathLength', '1');
    svg.appendChild(e); lines[id] = e;
  });

  function layout() {
    var W = map.clientWidth;
    if (!W) return;
    L = W < 470 ? LAYOUT.narrow : LAYOUT.wide;
    root.classList.toggle('narrow', L === LAYOUT.narrow);
    var H = W * L.h / L.w;
    svg.setAttribute('viewBox', '0 0 ' + W.toFixed(1) + ' ' + H.toFixed(1));
    tabs.forEach(function (b) {
      var k = b.getAttribute('data-k'), p = L[k], bw = b.offsetWidth, x = p[0] / L.w * W, y = p[1] / L.h * H;
      x = Math.max(bw / 2 + 2, Math.min(W - bw / 2 - 2, x));
      pos[k] = [x, y];
      b.style.left = x.toFixed(1) + 'px'; b.style.top = y.toFixed(1) + 'px';
    });
    Object.keys(EDGES).forEach(function (id) {
      var a = pos[EDGES[id][0]], b = pos[EDGES[id][1]], e = lines[id];
      e.setAttribute('x1', a[0].toFixed(1)); e.setAttribute('y1', a[1].toFixed(1));
      e.setAttribute('x2', b[0].toFixed(1)); e.setAttribute('y2', b[1].toFixed(1));
    });
    placeLabels();
    aimSheet(cur, true);
  }
  /* a label sits in the free space between the two buttons it joins (vertical joins on the narrow layout sit
     nearer the top one, clear of the hub) */
  function placeLabels() {
    var narrow = L === LAYOUT.narrow;
    labels.forEach(function (l) {
      var ed = EDGES[l.id], a = pos[ed[0]], b = pos[ed[1]], x, y;
      var ba = byKey[ed[0]], bb = byKey[ed[1]];
      if (Math.abs(a[1] - b[1]) < 1) {
        var l1 = Math.min(a[0], b[0]) === a[0] ? [ba, bb] : [bb, ba];
        x = (Math.min(a[0], b[0]) + l1[0].offsetWidth / 2 + Math.max(a[0], b[0]) - l1[1].offsetWidth / 2) / 2;
        y = a[1];
      } else {
        var t = Math.abs(a[0] - b[0]) < 1 ? (narrow ? ed[3] || .5 : .5) : ed[3] || .5;
        x = a[0] + (b[0] - a[0]) * t; y = a[1] + (b[1] - a[1]) * t;
      }
      l.el.style.left = x.toFixed(1) + 'px';
      l.el.style.top = y.toFixed(1) + 'px';
    });
  }
  /* the sketch: pan the map so this dashboard fills the frame */
  function aimSheet(k, instant) {
    var c = CELL[k], W = view.clientWidth;
    if (!c || !W) return;
    var rx = c[0] + 33 - 2, ry = c[1] - 1.5, rw = 404, s = W / rw;
    img.style.transition = instant || reduce ? 'none' : '';
    img.style.width = '1466px'; img.style.height = '1100px';
    img.style.transform = 'translate(' + (-rx * s).toFixed(1) + 'px,' + (-ry * s).toFixed(1) + 'px) scale(' + s.toFixed(4) + ')';
  }
  function select(k, focus) {
    var info = KIND[k];
    if (!info) return;
    cur = k;
    tabs.forEach(function (b) {
      var on = b.getAttribute('data-k') === k;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    sheet.setAttribute('aria-labelledby', 'rd-' + k);
    var lit = {}, rel = {};
    info.on.forEach(function (o) { lit[o[0]] = o[1] || ''; });
    Object.keys(lines).forEach(function (id) {
      var on = id in lit;
      lines[id].classList.toggle('on', on);
      if (on) { lines[id].classList.remove('draw'); void lines[id].getBoundingClientRect(); lines[id].classList.add('draw'); rel[EDGES[id][0]] = rel[EDGES[id][1]] = 1; }
    });
    tabs.forEach(function (b) { var kk = b.getAttribute('data-k'); b.classList.toggle('dim', kk !== k && !rel[kk]); });
    labels.forEach(function (l) { l.el.remove(); }); labels = [];
    Object.keys(lit).forEach(function (id) {
      if (!lit[id]) return;
      var el = d.createElement('span'); el.className = 'rd-lab'; el.textContent = lit[id]; el.setAttribute('aria-hidden', 'true');
      map.insertBefore(el, map.querySelector('.rd-nodes'));
      labels.push({ id: id, el: el });
    });
    if (L) placeLabels();
    tt.textContent = info.t; tp.textContent = info.p;
    tl.textContent = ''; var b = d.createElement('b'); b.textContent = 'Shares '; tl.appendChild(b); tl.appendChild(d.createTextNode(info.s));
    aimSheet(k);
  }

  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { stop(); select(b.getAttribute('data-k')); });
    b.addEventListener('keydown', function (e) {
      var n = tabs.length, j = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 }[e.key];
      if (j === undefined) return;
      e.preventDefault(); stop();
      select(tabs[(j + n) % n].getAttribute('data-k'), true);
    });
  });

  /* a walk through all seven, once, until someone touches it */
  var ORDER = ['fan', 'ent', 'venue', 'svc', 'cp', 'adm', 'acc'], tour = { t: 0, on: false, done: false };
  function stop() { tour.done = true; tour.on = false; clearTimeout(tour.t); }
  function walk(i) {
    if (tour.done) return;
    if (i >= ORDER.length) { stop(); return; }
    select(ORDER[i]);
    tour.t = setTimeout(function () { walk(i + 1); }, 3400);
  }
  ['pointerdown', 'keydown', 'focusin', 'touchstart'].forEach(function (ev) { root.addEventListener(ev, stop, { passive: true }); });

  layout();
  select('acc');
  var rq = 0;
  addEventListener('resize', function () { if (!rq) rq = requestAnimationFrame(function () { rq = 0; layout(); }); });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(layout);
  if (!reduce && 'IntersectionObserver' in window) {
    var armed = 0;
    new IntersectionObserver(function (es) {
      var v = es[0].isIntersecting;
      if (v && !armed && !tour.done) armed = setTimeout(function () { tour.on = true; walk(0); }, 2600);
      else if (!v && armed) { clearTimeout(armed); armed = 0; if (tour.on) stop(); }
    }, { threshold: .4 }).observe(root);
  }
})();
