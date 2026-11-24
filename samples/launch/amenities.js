/* Aaranya · amenities: an interactive site plan (numbered pins + list), and the pinned "day at Aaranya" story. */
(function () {
  'use strict';
  var A = window.AAR, $ = A.$, $$ = A.$$;
  // site coordinates in metres (north is up)
  var AM = [
    ['Sky Club', 'Tower A roof · lounge and dining', -54, -14],
    ['Sky pool', 'Tower A roof · infinity edge', -30, -14],
    ['Sky Garden', 'Tower B roof terrace', 48, -45],
    ['Sky Deck', 'Tower C roof · gym and views', 56, 38],
    ['Podium Club', 'Club · 2 floors + roof', A.CLUB.x, A.CLUB.z],
    ['25 m pool and family pool', 'Podium Club roof', A.CLUB.x + 12, A.CLUB.z - 2],
    ['Gym, studio, steam', 'Podium Club level 1', A.CLUB.x - 10, A.CLUB.z + 3],
    ['Garden court', 'Landscaped podium lawn', 8, 4],
    ['Promenade, 400 m', 'Rubber track, lit', 30, 33],
    ['Reflecting pool', 'Seating edge', -2, 22],
    ['Yoga lawn', '30 mats, open air', 20, -14],
    ['Amphitheatre', '200 seats', 46, -6],
    ['Toddler garden', 'Fenced', -18, -2],
    ['Play deck', 'Ages 6 to 12', 28, 14],
    ['Half basketball court', 'Floodlit', 74, -50],
    ['Pet park', 'Fenced, with a tap', -74, 6],
    ['Drop-off court', 'Covered porte-cochère', -9, 48],
    ['Tower A lobby', 'Double height', -42, -6],
    ['Tower B lobby', 'Double height', 32, -22],
    ['Tower C lobby', 'Double height', 40, 34],
    ['EV charging', 'Every parking bay', -64, 50],
    ['Guest parking', '40 bays at grade', 60, 54]
  ];
  var R = { x0: -90, z0: -66, x1: 90, z1: 66 };
  var W = R.x1 - R.x0, H = R.z1 - R.z0;
  function X(x) { return (x - R.x0).toFixed(1); } function Z(z) { return (z - R.z0).toFixed(1); }

  function svg() {
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="Site plan with ' + AM.length + ' numbered amenities">';
    var S = A.SITE;
    s += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#E7E0D2"/>';
    s += '<rect x="' + X(S.x0) + '" y="' + Z(S.z0) + '" width="' + (S.x1 - S.x0) + '" height="' + (S.z1 - S.z0) + '" fill="#C9D3B4" stroke="#B5AD9C" stroke-width=".5"/>';
    s += '<ellipse cx="' + X(6) + '" cy="' + Z(6) + '" rx="60" ry="42" transform="rotate(-14 ' + X(6) + ' ' + Z(6) + ')" fill="#DDD6C4"/>';
    s += '<ellipse cx="' + X(6) + '" cy="' + Z(6) + '" rx="38" ry="24" transform="rotate(-14 ' + X(6) + ' ' + Z(6) + ')" fill="#9FB28C"/>';
    s += '<ellipse cx="' + X(6) + '" cy="' + Z(6) + '" rx="47" ry="31" transform="rotate(-14 ' + X(6) + ' ' + Z(6) + ')" fill="none" stroke="#F2ECE0" stroke-width="2.2" stroke-linecap="round"/>';
    s += '<ellipse cx="' + X(-2) + '" cy="' + Z(22) + '" rx="17" ry="8" fill="#AFC4C6" transform="rotate(11 ' + X(-2) + ' ' + Z(22) + ')"/>';
    // trees as dots: a few on the garden court, and a line along the boundary
    var r = A.rng(41);
    for (var i = 0; i < 40; i++) { var a = r() * Math.PI * 2, d = 0.5 + Math.sqrt(r()) * 0.5; var x = 6 + Math.cos(a) * 34 * d, z = 6 + Math.sin(a) * 22 * d; s += '<circle cx="' + X(x) + '" cy="' + Z(z) + '" r="' + (1.3 + r() * 1.1).toFixed(1) + '" fill="#7E9A6C" opacity=".8"/>'; }
    for (var bx = S.x0 + 6; bx < S.x1 - 4; bx += 14) { s += '<circle cx="' + X(bx) + '" cy="' + Z(S.z0 + 5) + '" r="1.6" fill="#7E9A6C" opacity=".8"/><circle cx="' + X(bx + 7) + '" cy="' + Z(S.z1 - 5) + '" r="1.6" fill="#7E9A6C" opacity=".8"/>'; }
    A.TOWERS.forEach(function (T) {
      var deg = -T.rot * 180 / Math.PI;
      s += '<g transform="translate(' + X(T.x) + ' ' + Z(T.z) + ') rotate(' + deg + ')"><rect x="' + (-T.w / 2) + '" y="' + (-T.d / 2) + '" width="' + T.w + '" height="' + T.d + '" fill="#F7F3EC" stroke="#16201A" stroke-width=".6"/><text x="0" y="1.6" text-anchor="middle" style="font:400 6px var(--serif);fill:#16201A" transform="rotate(' + (-deg) + ')">' + T.name + '</text></g>';
    });
    s += '<rect x="' + X(A.CLUB.x - A.CLUB.w / 2) + '" y="' + Z(A.CLUB.z - A.CLUB.d / 2) + '" width="' + A.CLUB.w + '" height="' + A.CLUB.d + '" fill="#F7F3EC" stroke="#16201A" stroke-width=".6"/>';
    s += '<rect x="' + X(A.CLUB.x + 6) + '" y="' + Z(A.CLUB.z - 7) + '" width="12" height="14" fill="#9CC3C9"/>';
    // road + gate
    s += '<rect x="0" y="' + Z(S.z1 + 1) + '" width="' + W + '" height="4" fill="#B8B1A3"/><text x="' + (W - 4) + '" y="' + (+Z(S.z1) + 3.2) + '" text-anchor="end" style="font:600 2.6px var(--mono);fill:#6c6558;letter-spacing:.1em">24 M SECTOR ROAD</text>';
    s += '<g transform="translate(' + (W - 8) + ' 8)"><circle r="4.5" fill="#FBF8F2" stroke="#B5AD9C" stroke-width=".4"/><path d="M0 -3 L1.4 1.6 L0 .8 L-1.4 1.6Z" fill="#16201A"/><text y="-5.6" text-anchor="middle" style="font:600 2.6px var(--mono);fill:#16201A">N</text></g>';
    AM.forEach(function (m, i) {
      s += '<g class="am-pin" data-i="' + i + '" tabindex="-1" transform="translate(' + X(m[2]) + ' ' + Z(m[3]) + ')"><circle r="4.6"/><text>' + (i + 1) + '</text></g>';
    });
    return s + '</svg>';
  }
  var host = $('#amsvg'), list = $('#amlist');
  if (host) {
    host.innerHTML = svg();
    list.innerHTML = AM.map(function (m, i) { return '<li><button type="button" data-i="' + i + '" aria-pressed="false"><span class="n">' + (i + 1) + '</span><b>' + m[0] + '</b><span>' + m[1] + '</span></button></li>'; }).join('');
    var on = function (i) {
      $$('.am-pin', host).forEach(function (p) { p.classList.toggle('on', +p.dataset.i === i); if (+p.dataset.i === i) p.parentNode.appendChild(p); });
      $$('button', list).forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.i === i)); });
    };
    list.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) on(+b.dataset.i); });
    list.addEventListener('mouseover', function (e) { var b = e.target.closest('button'); if (b) on(+b.dataset.i); });
    host.addEventListener('click', function (e) { var g = e.target.closest('.am-pin'); if (!g) return; var i = +g.dataset.i; on(i); var b = list.querySelector('[data-i="' + i + '"]'); if (b) { b.focus({ preventScroll: true }); if (innerWidth < 900) b.scrollIntoView({ block: 'nearest' }); } });
    on(0);
  }
  // the trail: a dotted path that wanders from stop to stop, drawn from where the stops actually sit
  var track = $('.trail-track');
  function drawTrail() {
    if (!track) return;
    var svg = $('.trail-path', track), path = $('path', svg), tr = track.getBoundingClientRect();
    var pts = $$('.stop .dot', track).map(function (d) { var r = d.getBoundingClientRect(); return [r.left - tr.left + r.width / 2, r.top - tr.top + r.height / 2]; });
    if (pts.length < 2) return;
    svg.setAttribute('viewBox', '0 0 ' + track.scrollWidth + ' ' + track.offsetHeight); svg.style.width = track.scrollWidth + 'px';
    var d = 'M' + (pts[0][0] - 120) + ' ' + (pts[0][1] + 30) + ' Q' + (pts[0][0] - 60) + ' ' + pts[0][1] + ' ' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 1; i < pts.length; i++) { var a = pts[i - 1], b = pts[i], mx = (a[0] + b[0]) / 2; d += ' C' + mx + ' ' + (a[1] - 46) + ' ' + mx + ' ' + (b[1] + 46) + ' ' + b[0] + ' ' + b[1]; }
    var z = pts[pts.length - 1]; d += ' Q' + (z[0] + 80) + ' ' + (z[1] - 30) + ' ' + (z[0] + 200) + ' ' + (z[1] - 10);
    path.setAttribute('d', d);
  }
  if (track) { addEventListener('load', drawTrail); addEventListener('resize', drawTrail); setTimeout(drawTrail, 300); }
  // pinned story (v1 markup, if present): swap the sticky image as each step reaches the middle of the screen
  var media = $$('.pin-media .ph'), steps = $$('.pin-steps > div');
  if (media.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var i = +e.target.dataset.i; media.forEach(function (m) { m.classList.toggle('on', +m.dataset.i === i); }); } }); }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { io.observe(s); });
  }
})();
