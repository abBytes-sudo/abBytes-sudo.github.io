/* Aaranya · construction progress: slab elevations per tower and the monthly photo log. */
(function () {
  'use strict';
  var A = window.AAR, $ = A.$, $$ = A.$$;
  var LOG = [
    { m: 'Nov 2026', d: 'Mon 2 Nov', img: 'c-topping', tall: true, t: ['A', 'S', 'K'], h: 'Arjun tops out.', alt: 'A concrete tower with a tower crane beside it against a blue sky',
      n: ['Arjun\'s 26th and last slab was cast on 9 November in a 14-hour pour.', 'Sal is at slab 22 of 34, one slab every 9 days.', 'Kadamb blockwork has reached the 14th floor.', 'Canopy Club: façade glazing started on the south side.'] },
    { m: 'Oct 2026', d: 'Mon 5 Oct', img: 'c-slabs', tall: true, t: ['K'], h: 'Faster slabs on Kadamb.', alt: 'A building frame with balcony slabs and formwork props',
      n: ['Kadamb moved to aluminium formwork from the 18th floor; the slab cycle fell from 11 days to 8.', 'Kadamb at slab 24 of 30.', 'Third-party cube tests: all 42 cubes above M40 strength.'] },
    { m: 'Sep 2026', d: 'Mon 7 Sep', img: 'c-frame', tall: true, t: ['S'], h: 'Sal passes the 15th floor.', alt: 'A concrete frame of floors and columns seen from below',
      n: ['Sal at slab 16; core walls run three floors ahead of the slabs.', 'Monsoon: six working days lost in August, recovered with Sunday shifts.', 'Fire-sprinkler mains installed up to the 8th floor in Arjun.'] },
    { m: 'Aug 2026', d: 'Mon 3 Aug', img: 'c-blockwork', t: ['A'], h: 'Rooms appear in Arjun.', alt: 'An unfinished concrete room with props and scaffolding',
      n: ['Blockwork started in Arjun from the 1st floor; you can now walk the rooms of a 2 BHK.', 'Electrical conduits and plumbing sleeves laid before plastering, floor by floor.', 'Site visits now include a hard-hat walk on Arjun\'s 3rd floor (Sundays).'] },
    { m: 'Jul 2026', d: 'Mon 6 Jul', img: 'c-columns', t: ['K'], h: 'Kadamb\'s columns climb.', alt: 'Workers fixing a steel reinforcement cage for a column on a concrete deck',
      n: ['Column cages for Kadamb\'s 12th floor fixed and checked by the structural consultant.', 'A second tower crane erected for Sal.', 'Zero lost-time incidents for the 200th day running.'] },
    { m: 'Jun 2026', d: 'Mon 1 Jun', img: 'c-podium', t: ['S', 'K', 'A'], h: 'The podium is done; the forest begins.', alt: 'Engineers in safety vests on a finished podium slab beside reinforcement for the next pour',
      n: ['Podium slab over the two basements completed across the site.', 'Topsoil handed over to the landscape contractor; 312 of the 1,140 trees planted before the monsoon.', 'The large kadamb tree was moved 40 m to the yoga deck. It has new leaves.'] },
    { m: 'May 2026', d: 'Mon 4 May', img: 'c-rebar', t: ['S'], h: 'Sal\'s core rises.', alt: 'Close-up of steel reinforcement bars against the sky',
      n: ['Sal\'s lift-core walls cast to the 4th floor with jump-form shuttering.', 'Basement waterproofing tested by ponding for 72 hours; no seepage.'] },
    { m: 'Apr 2026', d: 'Mon 6 Apr', img: 'c-raft', t: ['S'], h: 'The raft under Sal.', alt: 'A worker walking across a dense grid of steel reinforcement for a raft foundation',
      n: ['Raft foundation for Sal: 4,200 m³ of concrete placed in one continuous 52-hour pour.', 'Temperature sensors embedded in the raft to control cracking as it cures.', 'Quarterly progress report filed with HRERA.'] }
  ];
  // elevations
  var pt = $('#ptowers');
  if (pt) {
    var MAX = 34, H = 300, items = A.TOWERS.map(function (T) { return { n: T.name, total: T.floors, done: A.PROGRESS[T.id], note: (A.PROGRESS[T.id] >= T.floors ? 'Topped out · finishing' : 'Slab ' + A.PROGRESS[T.id] + ' of ' + T.floors), w: T.id === 'A' ? 56 : 44 }; });
    items.push({ n: 'Canopy Club', total: 3, done: 3, note: A.PROGRESS.club, w: 80 });
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
