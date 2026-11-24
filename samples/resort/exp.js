/* Taradhura experiences: the six activities and live slot booking (capacity per slot). Bookings land in the back-office roster. */
(function () {
  'use strict';
  var TD = window.TD, ui = TD.ui, $ = ui.$, $$ = ui.$$, esc = ui.esc, D = TD.date, today = D.today();
  var DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  function runs(e, iso) {
    var w = e.when, d = D.dow(iso);
    if (/^(Daily|Nightly)/.test(w)) return !(/except Mon/.test(w) && d === 1);
    return w.split('·').map(function (s) { return DOW[s.trim()]; }).indexOf(d) >= 0;
  }
  $('#xl').innerHTML = TD.experiences.map(function (e, i) {
    var next = null; for (var k = 0; k < 14 && !next; k++) { var d = D.add(today, k); if (runs(e, d)) next = d; }
    return '<article class="x-row" id="' + e.id + '"><span class="ix">0' + (i + 1) + '</span><figure>' + ui.photo(e.photo, e.name, '(max-width:700px) 100vw, 30vw') + '</figure>' +
      '<div><h2>' + esc(e.name) + '</h2><p class="line">' + esc(e.line) + '</p><p class="detail">' + esc(e.detail) + '</p></div>' +
      '<div><div class="x-meta"><div><span>When</span><b>' + esc(e.when) + '</b></div><div><span>Starts</span><b>' + e.slots.join(', ') + '</b></div><div><span>Length</span><b>' + esc(e.dur) + '</b></div><div><span>Group</span><b>Up to ' + e.cap + '</b></div><div><span>Level</span><b>' + esc(e.level) + '</b></div><div><span>With</span><b>' + esc(e.guide) + '</b></div><div><span>Per guest</span><b>' + TD.inr(e.price) + '</b></div></div>' +
      '<button class="btn" type="button" data-book="' + e.id + '"><span class="lbl">Book a slot</span> <span class="ar" aria-hidden="true">→</span></button><p class="small muted" style="margin-top:8px">Next: ' + (next ? D.fmt(next, { weekday: 'short' }) : '—') + '</p></div></article>';
  }).join('');

  document.addEventListener('click', function (e) { var b = e.target.closest('[data-book]'); if (b) open(TD.exp(b.dataset.book)); });
  function open(e) {
    var sel = { date: null, time: null, guests: 2 };
    var days = []; for (var k = 0; k < 14; k++) days.push(D.add(today, k));
    var last = null; try { last = localStorage.getItem('taradhura:last-ref'); } catch (err) {}
    var body = '<p class="muted" style="margin-top:0">' + esc(e.line) + '</p><h3 class="lab" style="margin:24px 0 10px">Day</h3><div class="slot-days" id="s-days" role="group" aria-label="Day">' +
      days.map(function (d) { var ok = runs(e, d); return '<button type="button" data-d="' + d + '"' + (ok ? '' : ' disabled') + ' aria-pressed="false" aria-label="' + D.long(d) + (ok ? '' : ', not running') + '">' + D.wd(d) + '<b>' + D.parse(d).getUTCDate() + '</b></button>'; }).join('') + '</div>' +
      '<h3 class="lab" style="margin:24px 0 0">Time</h3><div class="slot-times" id="s-times"><p class="small muted">Pick a day first.</p></div>' +
      '<div class="guests" style="margin-top:24px"><div><div><b>Guests</b><span>' + TD.inr(e.price) + ' each</span></div><div class="step" id="s-g"><button type="button" aria-label="Fewer guests">−</button><output>2</output><button type="button" aria-label="More guests">+</button></div></div></div>' +
      '<div class="form-grid" style="margin-top:24px"><label class="field"><span>Name <b>*</b></span><input id="s-name" autocomplete="name"><small class="msg"></small></label><label class="field"><span>Staying with us? Reference</span><input id="s-ref" placeholder="TD-XXXXX (optional)" value="' + esc(last || '') + '" style="text-transform:uppercase"><small class="msg"></small></label></div>';
    var sh = ui.sheet(e.name, body, '<span class="small" id="s-tot">Choose a slot</span><button class="btn sm" type="button" id="s-go" disabled><span class="lbl">Book slot</span></button>');
    function times() {
      if (!sel.date) return;
      $('#s-times', sh).innerHTML = e.slots.map(function (t) {
        var taken = TD.slotTaken(e.id, sel.date, t), left = e.cap - taken, past = sel.date === today && t <= new Date().toTimeString().slice(0, 5);
        return '<button type="button" data-t="' + t + '" aria-pressed="' + (sel.time === t) + '"' + (left < sel.guests || past ? ' disabled' : '') + '><b>' + t + '</b><span>' + (past ? 'Started' : left <= 0 ? 'Full' : left + ' of ' + e.cap + ' places left') + '</span><div class="meter" aria-hidden="true"><i style="width:' + Math.round(taken / e.cap * 100) + '%"></i></div></button>';
      }).join('');
      $$('#s-times button', sh).forEach(function (b) { b.onclick = function () { sel.time = b.dataset.t; times(); tot(); }; });
    }
    function tot() { $('#s-tot', sh).innerHTML = sel.date && sel.time ? D.fmt(sel.date, { weekday: 'short' }) + ', ' + sel.time + ' · <b>' + TD.inr(e.price * sel.guests * 1.18) + '</b> incl. GST' : 'Choose a slot'; $('#s-go', sh).disabled = !(sel.date && sel.time); }
    $$('#s-days button', sh).forEach(function (b) { b.onclick = function () { sel.date = b.dataset.d; sel.time = null; $$('#s-days button', sh).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); times(); tot(); }; });
    var g = $('#s-g', sh), gb = g.querySelectorAll('button');
    function gp() { g.querySelector('output').textContent = sel.guests; gb[0].disabled = sel.guests <= 1; gb[1].disabled = sel.guests >= e.cap; times(); if (sel.time && $('#s-times button[data-t="' + sel.time + '"]', sh).disabled) sel.time = null; tot(); }
    gb[0].onclick = function () { sel.guests--; gp(); }; gb[1].onclick = function () { sel.guests++; gp(); }; gp();
    var first = $('#s-days button:not([disabled])', sh); if (first) first.click();
    $('#s-go', sh).onclick = function () {
      var name = $('#s-name', sh), ref = $('#s-ref', sh), bad = false;
      var f1 = name.closest('.field'); f1.classList.toggle('err', name.value.trim().length < 2); f1.querySelector('.msg').textContent = name.value.trim().length < 2 ? 'Who should the guide ask for?' : '';
      var rv = ref.value.trim().toUpperCase(), bk = rv ? TD.findBooking(rv) : null, f2 = ref.closest('.field');
      f2.classList.toggle('err', !!rv && !bk); f2.querySelector('.msg').textContent = rv && !bk ? 'We can’t find that reference. Leave it blank if you’re visiting for the day.' : '';
      if (name.value.trim().length < 2) { name.focus(); return; } if (rv && !bk) { ref.focus(); return; }
      var slots = TD.slots(); var id = 'X' + (600 + slots.length);
      slots.push({ id: id, exp: e.id, date: sel.date, time: sel.time, guests: sel.guests, name: name.value.trim(), ref: bk ? bk.ref : null, room: bk ? bk.room : 'Day visitor', status: 'booked', web: true });
      TD.saveSlots(slots);
      if (bk) { TD.updateBooking(bk.ref, function (b) { b.addons = b.addons || {}; }, 'Booked ' + e.name + ' for ' + D.fmt(sel.date) + ' ' + sel.time + ' online'); }
      $('.sheet-b', sh).innerHTML = '<p class="kicker"><span class="dot"></span> Booked</p><p class="h3" style="margin:16px 0 10px">' + esc(e.name) + ', ' + D.long(sel.date) + ' at ' + sel.time + '.</p><p class="muted">' + sel.guests + ' guest' + (sel.guests > 1 ? 's' : '') + ' with ' + esc(e.guide) + '. Meet at the Long Room porch five minutes before. ' + (bk ? 'Added to ' + bk.ref + '; pay at check-out.' : 'Pay at the desk on the day.') + '</p><p class="small muted">Reference ' + id + '. It is already on the guides’ roster.</p>';
      $('.sheet-f', sh).innerHTML = '<span></span><button class="btn sm" type="button" id="s-done"><span class="lbl">Done</span></button>'; $('#s-done', sh).onclick = function () { ui.closeSheet(); };
      ui.toast('Slot booked: ' + e.name + ', ' + D.fmt(sel.date) + ' ' + sel.time);
    };
  }
  if (location.hash && TD.exp(location.hash.slice(1))) setTimeout(function () { var el = $(location.hash); el && el.scrollIntoView({ block: 'start' }); }, 300);
})();
