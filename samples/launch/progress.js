/* Aaranya · construction progress: slab elevations per tower and the monthly photo log. */
(function () {
  'use strict';
  var A = window.AAR, $ = A.$, $$ = A.$$;
  var LOG = [
    { m: 'Nov 2026', d: 'Mon 2 Nov', img: 'c-topping', tall: true, t: ['A', 'B', 'C'], h: 'Tower A passes the 25th floor.', alt: 'A concrete tower with a tower crane beside it against a blue sky',
      n: ['Tower A: slab 27 of 46 cast on 6 November, one slab every 7 days.', 'Tower B is at slab 23 of 44 and Tower C at slab 21 of 42.', 'Podium Club: façade glazing started on the south side.'] },
    { m: 'Oct 2026', d: 'Mon 5 Oct', img: 'c-slabs', tall: true, t: ['B'], h: 'Faster slabs on Tower B.', alt: 'A building frame with balcony slabs and formwork props',
      n: ['Tower B moved to aluminium formwork from the 14th floor; the slab cycle fell from 10 days to 7.', 'Tower B at slab 19 of 44.', 'Third-party cube tests: all 42 cubes above M50 strength.'] },
    { m: 'Sep 2026', d: 'Mon 7 Sep', img: 'c-frame', tall: true, t: ['A'], h: 'Tower A passes the 20th floor.', alt: 'A concrete frame of floors and columns seen from below',
      n: ['Tower A at slab 20; the self-climbing core runs four floors ahead of the slabs.', 'Monsoon: six working days lost in August, recovered with Sunday shifts.', 'Fire-sprinkler mains installed up to the 10th floor in Tower C.'] },
    { m: 'Aug 2026', d: 'Mon 3 Aug', img: 'c-blockwork', t: ['C'], h: 'Rooms appear in Tower C.', alt: 'An unfinished concrete room with props and scaffolding',
      n: ['Blockwork started in Tower C from the 1st floor; you can now walk the rooms of a 2 BHK.', 'Electrical conduits and plumbing sleeves laid before plastering, floor by floor.', 'Site visits now include a hard-hat walk on Tower C\'s 3rd floor (Sundays).'] },
    { m: 'Jul 2026', d: 'Mon 6 Jul', img: 'c-columns', t: ['B'], h: 'Tower B\'s columns climb.', alt: 'Workers fixing a steel reinforcement cage for a column on a concrete deck',
      n: ['Column cages for Tower B\'s 12th floor fixed and checked by the structural consultant.', 'A second tower crane erected for Tower A.', 'Zero lost-time incidents for the 200th day running.'] },
    { m: 'Jun 2026', d: 'Mon 1 Jun', img: 'c-podium', t: ['A', 'B', 'C'], h: 'The podium slab is done.', alt: 'Engineers in safety vests on a finished podium slab beside reinforcement for the next pour',
      n: ['Podium slab over the two basements completed across the site.', 'Wind-tunnel study signed off for all three towers; the façade mock-up passed its pressure test.', 'Landscape contractor mobilised for the podium decks.'] },
    { m: 'May 2026', d: 'Mon 4 May', img: 'c-rebar', t: ['A'], h: 'Tower A\'s core rises.', alt: 'Close-up of steel reinforcement bars against the sky',
      n: ['Tower A\'s lift-core walls cast to the 4th floor with self-climbing shuttering.', 'Basement waterproofing tested by ponding for 72 hours; no seepage.'] },
    { m: 'Apr 2026', d: 'Mon 6 Apr', img: 'c-raft', t: ['A'], h: 'The raft under Tower A.', alt: 'A worker walking across a dense grid of steel reinforcement for a raft foundation',
      n: ['Raft foundation for Tower A: 6,800 m³ of concrete placed in one continuous 64-hour pour.', 'Temperature sensors embedded in the raft to control cracking as it cures.', 'Quarterly progress report filed with HRERA.'] }
  ];
  // elevations
  var pt = $('#ptowers');
  if (pt) {
    var MAX = Math.max.apply(null, A.TOWERS.map(function (T) { return T.floors; })), H = 300, items = A.TOWERS.map(function (T) { return { n: T.name, total: T.floors, done: A.PROGRESS[T.id], note: (A.PROGRESS[T.id] >= T.floors ? 'Topped out · finishing' : 'Slab ' + A.PROGRESS[T.id] + ' of ' + T.floors), w: T.id === 'C' ? 56 : 44 }; });
    items.push({ n: 'Podium Club', total: 3, done: 3, note: A.PROGRESS.club, w: 80 });
    pt.innerHTML = items.map(function (it) {
      var fh = (H - 20) / MAX, s = '<svg viewBox="0 0 100 ' + H + '" preserveAspectRatio="xMidYMax meet" role="img" aria-label="' + it.n + ': ' + it.done + ' of ' + it.total + ' slabs cast">';
      var x = 50 - it.w / 2;
      for (var f = 0; f < it.total; f++) {
        var y = H - (f + 1) * fh * (it.total === 3 ? 2.4 : 1);
        var cls = f < it.done ? (f === it.done - 1 && it.done < it.total ? 'el-now' : 'el-done') : 'el-todo';
        s += '<rect class="' + cls + '" x="' + x + '" y="' + y.toFixed(1) + '" width="' + it.w + '" height="' + (fh * (it.total === 3 ? 2.4 : 1) - 1.6).toFixed(1) + '"/>';
      }
      s += '<rect x="10" y="' + (H - 1) + '" width="80" height="1" fill="#16201A"/></svg>';
      var pc = Math.round(it.done / it.total * 100);
      return '<div class="ptower">' + s + '<h3>' + it.n + '</h3><p>' + it.note + '<br>' + pc + '% of structure</p></div>';
    }).join('');
  }
  // log
  var log = $('#log'), filt = '';
  function render() {
    log.innerHTML = LOG.filter(function (e) { return !filt || e.t.indexOf(filt) >= 0; }).map(function (e) {
      var tw = e.t.map(function (k) { return '<span class="tag">' + A.tower(k).name + '</span>'; }).join(' ');
      var w = e.tall ? 1100 : 1600, h = e.tall ? 1650 : 1067;
      return '<article class="log-item"><time>' + e.m.split(' ')[0] + '<small>' + e.m.split(' ')[1] + ' · photographed ' + e.d + '</small></time>' +
        '<button type="button" class="ph' + (e.tall ? ' tall' : '') + '" data-img="' + e.img + '" data-alt="' + A.esc(e.alt) + '" style="padding:0;border:0" aria-label="Open the photo: ' + A.esc(e.alt) + '"><img src="photos/' + e.img + '-s.webp" alt="' + A.esc(e.alt) + '" width="800" height="' + Math.round(800 * h / w) + '" loading="lazy" decoding="async"></button>' +
        '<div><h3>' + e.h + '</h3><p style="display:flex;gap:6px;flex-wrap:wrap">' + tw + '</p><ul>' + e.n.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul><p class="muted" style="font-size:12.5px;margin-top:12px">Site engineer\'s note, unedited · Saptaparni Developers</p></div></article>';
    }).join('') || '<div class="empty"><b>Nothing for this tower yet</b></div>';
  }
  render();
  $$('#logf button').forEach(function (b) { b.addEventListener('click', function () { filt = b.dataset.t; $$('#logf button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); render(); }); });
  var lb = $('#lb');
  log.addEventListener('click', function (e) {
    var b = e.target.closest('[data-img]'); if (!b) return;
    var im = $('#lb-img'); im.src = 'photos/' + b.dataset.img + '.webp'; im.alt = b.dataset.alt; $('#lb-h').textContent = b.dataset.alt;
    if (lb.showModal) lb.showModal();
  });
})();
