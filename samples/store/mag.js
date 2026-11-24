/* Northlane magazine behaviours (home page): live prices on the cover lines, the cover's cursor image trail, the drag lookbook.
   No dependencies besides the store data (window.NL). Reduced motion and touch screens get the static layout. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* prices come from the live store data, so a page never disagrees with the shop */
  [].forEach.call(document.querySelectorAll('[data-price]'), function (el) { var p = window.NL && NL.product(el.getAttribute('data-price')); if (p) el.textContent = NL.money(p.price); });

  /* lookbook: drag to turn the page (mouse), swipe (touch), arrow keys (focus the strip); a progress rule follows */
  var tr = $('#lbTrack'), bar = $('#lbBar');
  if (tr) {
    var down = false, sx = 0, sl = 0, moved = 0;
    var prog = function () { var vis = tr.clientWidth / tr.scrollWidth, m = tr.scrollWidth - tr.clientWidth; if (!bar) return; bar.style.width = Math.max(10, vis * 100) + '%'; bar.style.transform = 'translateX(' + (m > 0 ? tr.scrollLeft / m * (100 / vis - 100) : 0) + '%)'; };
    tr.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = true; moved = 0; sx = e.clientX; sl = tr.scrollLeft; });
    addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); if (moved > 4) { tr.classList.add('drag'); tr.scrollLeft = sl - dx; } });
    var up = function () { if (!down) return; down = false; setTimeout(function () { tr.classList.remove('drag'); }, 0); };
    addEventListener('pointerup', up); addEventListener('pointercancel', up);
    tr.addEventListener('click', function (e) { if (moved > 4) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
    tr.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); tr.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * tr.clientWidth * .5, behavior: reduce ? 'auto' : 'smooth' }); } });
    tr.addEventListener('scroll', prog, { passive: true }); addEventListener('resize', prog); prog();
  }

  /* cover: a trail of the season's pieces follows the cursor (fine pointers only) */
  var cv = $('.cover'), tl = $('#cvTrail');
  if (cv && tl && !reduce && matchMedia('(pointer:fine)').matches) {
    var ids = ['harbor-jacket', 'drift-runner', 'coast-sunglasses', 'rib-knit', 'atelier-tote', 'meridian-38', 'court-low', 'field-cap', 'mini-crossbody', 'everyday-tee', 'loop-hoodie', 'easy-trousers'];
    var n = 0, lx = -999, ly = -999, alive = 0, warm = false, src = function (id) { return 'products/w/' + id + '-450.webp'; };
    cv.addEventListener('pointermove', function (e) {
      if (!warm) { warm = true; ids.slice(0, 5).forEach(function (id) { new Image().src = src(id); }); }
      var r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (Math.hypot(x - lx, y - ly) < 120 || alive > 6) return; lx = x; ly = y; alive++;
      var im = document.createElement('img'), rot = (Math.random() * 12 - 6).toFixed(1), t = function (dy, s) { return 'translate(-50%,' + dy + '%) scale(' + s + ') rotate(' + rot + 'deg)'; };
      im.alt = ''; im.src = src(ids[n++ % ids.length]); im.style.left = x + 'px'; im.style.top = y + 'px'; tl.appendChild(im);
      var a = im.animate([{ opacity: 0, transform: t(-44, .7) }, { opacity: 1, transform: t(-50, 1), offset: .2 }, { opacity: 1, transform: t(-53, 1), offset: .68 }, { opacity: 0, transform: t(-60, .96) }], { duration: 1200, easing: 'cubic-bezier(.2,.7,.2,1)' });
      a.onfinish = function () { im.remove(); alive--; };
    }, { passive: true });
  }
})();
