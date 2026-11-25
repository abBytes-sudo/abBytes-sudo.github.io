/* Two short games for the Games section: Sort the mess, and Pipeline sprint. Plain DOM; best scores stay in this browser. */
(function () {
  'use strict';
  var d = document, $ = function (s) { return d.querySelector(s); };
  function best(k, v, lower) { try { var o = +localStorage.getItem(k) || 0; if (v !== undefined && (!o || (lower ? v < o : v > o))) { localStorage.setItem(k, v); o = v; } return o; } catch (e) { return v || 0; } }
  /* Sort the mess */
  var NOTES = [['“call me back about the 3 BHK”', 0], ['Saturday 11 am, site visit??', 1], ['paid half, rest on Monday', 2], ['new enquiry from Instagram', 0], ['table for four tonight', 1], ['invoice 104 still unpaid', 2], ['walk-in asked for a quote', 0], ['move it to Tuesday', 1], ['UPI received, ₹12,000', 2], ['missed call, unknown number', 0], ['trial class at 7 pm', 1], ['refund for order 1043', 2], ['friend of a client, wants a kitchen', 0], ['room for two, this weekend', 1], ['advance cheque bounced', 2]];
  var note = $('#sNote'), bar = $('#sTime'), sc = $('#sScore'), go = $('#sGo'), playing = false, t0 = 0, n = 0, cur = null, last = -1;
  function next() { var i; do { i = Math.random() * NOTES.length | 0; } while (i === last); last = i; cur = NOTES[i]; note.textContent = cur[0]; }
  function tick(now) {
    if (!playing) return; var t = (now - t0) / 25000; bar.style.transform = 'scaleX(' + Math.max(0, 1 - t) + ')';
    if (t >= 1) { playing = false; go.hidden = false; go.textContent = 'Play again'; note.textContent = 'You filed ' + n + ' in 25 seconds.'; sc.textContent = 'Best: ' + best('am-sort', n) + '. A system files them as they arrive.'; return; }
    requestAnimationFrame(tick);
  }
  if (go) {
    sc.textContent = best('am-sort') ? 'Best: ' + best('am-sort') : 'Lead, booking or payment?';
    go.addEventListener('click', function () { playing = true; n = 0; t0 = performance.now(); go.hidden = true; sc.textContent = 'Filed: 0'; next(); requestAnimationFrame(tick); });
    [].forEach.call($('#sBins').children, function (b, i) { b.addEventListener('click', function () { if (!playing) return; if (i === cur[1]) { n++; sc.textContent = 'Filed: ' + n; next(); } else { note.classList.remove('bad'); void note.offsetWidth; note.classList.add('bad'); } }); });
  }
  /* Pipeline sprint */
  var cols = $('#pCols'), pGo = $('#pGo'), ps = $('#pScore'), ST = ['New', 'Called', 'Quoted', 'Won'], cards = [], p0 = 0, on = false;
  function draw() {
    cols.textContent = ''; ST.forEach(function (s, i) {
      var c = d.createElement('div'), h = d.createElement('h4'); h.textContent = s; c.appendChild(h);
      cards.forEach(function (x, k) { if (x !== i) return; var b = d.createElement('button'); b.type = 'button'; b.textContent = 'Lead ' + (k + 1); if (i === 3) b.disabled = true; b.addEventListener('click', function () { if (!on) return; if (!p0) p0 = performance.now(); cards[k]++; draw(); if (cards.every(function (v) { return v === 3; })) { var t = Math.round((performance.now() - p0) / 100) / 10; on = false; pGo.hidden = false; pGo.textContent = 'Play again'; ps.textContent = 'All six won in ' + t + ' s. Best: ' + best('am-sprint', t, true) + ' s.'; } }); c.appendChild(b); });
      cols.appendChild(c);
    });
  }
  if (pGo) { cards = [3, 3, 3, 3, 3, 3]; draw(); ps.textContent = best('am-sprint') ? 'Best: ' + best('am-sprint') + ' s' : 'The clock starts on your first click.'; pGo.addEventListener('click', function () { cards = [0, 0, 0, 0, 0, 0]; p0 = 0; on = true; pGo.hidden = true; ps.textContent = 'Go.'; draw(); }); }
})();
