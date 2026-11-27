/* On the road: what a listing really costs in the buyer's city. Fills #onroad-slot on the vehicle page.
   Fixed dealer price + RC transfer + insurance (transfer, or a new policy when the current one is nearly over) + handling
   (+ FASTag for cars) + road tax and NOC when the registration moves to another state. Figures are estimates. */
(function () {
  'use strict';
  var R = window.Revv, D = window.REVV_DATA; if (!R || !D) return;
  var esc = R.esc;
  function stateOf(code) { return String(code || '').slice(0, 2); }
  R.onroad = function (l, city) {
    var Rd = D.ROAD, car = l.type === 'car', from = stateOf(l.rc || D.RTO[l.city] || 'MH'), to = stateOf(D.RTO[city] || D.RTO[l.city] || 'MH');
    var st = D.STATES[to] || D.STATES[from] || ['your state', 10, 8, 1500, 900], d = R.dealer(l.dealer), rows = [];
    rows.push(['Price', l.price, 'Fixed by ' + d.name]);
    rows.push(['RC transfer', car ? st[3] : st[4], 'Ownership into your name, smart card, paperwork']);
    if (l.ins >= 3) rows.push(['Insurance transfer', Rd.transfer, 'The current policy runs ' + l.ins + ' more months']);
    else { var rate = l.fuel === 'Electric' ? Rd.insEv : car ? Rd.insCar : Rd.insBike;
      rows.push(['New insurance', Math.max(car ? Rd.minCar : Rd.minBike, Math.round(l.price * rate / 100) * 100), 'One year, comprehensive' + (l.ins ? '; the current policy ends in ' + l.ins + ' month' + (l.ins === 1 ? '' : 's') : '')]); }
    rows.push(['Handling', car ? Rd.handleCar : Rd.handleBike, 'Delivery check, fuel, documents']);
    if (car) rows.push(['FASTag', Rd.fastag, 'Issued in your name']);
    if (from && to && from !== to) {
      var age = Math.max(0, new Date().getFullYear() - l.year), left = Math.max(1, Rd.life - age) / Rd.life;
      rows.push(['Road tax, ' + st[0], Math.round(l.price * (car ? st[1] : st[2]) / 100 * left / 100) * 100, 'Re-registration: ' + (car ? st[1] : st[2]) + '% for ' + Math.round(left * Rd.life) + ' of 15 years left']);
      rows.push(['NOC, ' + from + ' to ' + to, Rd.noc, 'Clearance to move the registration']);
    }
    var total = rows.reduce(function (s, r) { return s + r[1]; }, 0), x = R.xFor && R.xFor(l.id);
    if (x) rows.push(['Your ' + x.year + ' ' + x.make + ' ' + x.model, -x.low, 'Exchange, at least this much; up to ' + R.inr(x.high) + ' after inspection']);
    return { rows: rows, total: total, pay: x ? total - x.low : total, x: x, from: from, to: to, moving: from !== to, state: st[0] };
  };
  R.buyerCity = function (l) { var c = R.get('revv:city', ''); return D.RTO[c] ? c : l.city; };

  R.whenSlot('onroad-slot', function (slot, id) {
    var l = R.byId(id); if (!l) return;
    var towns = Object.keys(D.RTO).sort(), city = R.buyerCity(l), open = false;
    function draw() {
      var o = R.onroad(l, city);
      slot.innerHTML = '<div class="orr"><p class="orr-l">On the road in <select class="orr-city" id="or-city" aria-label="Your city">' + towns.map(function (t) { return '<option' + (t === city ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select>: <b id="or-tot">' + R.inr(o.total) + '</b>' + (o.x ? ', or ' + R.inr(o.pay) + ' with your exchange' : '') + '. ' +
        '<button type="button" class="orr-t" id="or-t" aria-expanded="' + open + '" aria-controls="or-b">' + (open ? 'Hide what is in it' : 'See what is in it') + '</button></p>' +
        '<div class="orr-b" id="or-b"' + (open ? '' : ' hidden') + '><dl>' + o.rows.map(function (r) { return '<dt>' + esc(r[0]) + '<small>' + esc(r[2]) + '</small></dt><dd>' + (r[1] < 0 ? '−' + R.inrFull(-r[1]) : R.inrFull(r[1])) + '</dd>'; }).join('') +
        '<dt class="tot">' + (o.x ? 'To pay, on the road in ' : 'On the road in ') + esc(city) + '</dt><dd class="tot">' + R.inrFull(o.pay) + '</dd></dl>' +
        '<p class="orr-n">' + (o.moving ? 'Registered in ' + esc(o.from) + ', so moving it to ' + esc(o.state) + ' adds road tax. ' : 'Same state, so no new road tax. ') + 'Estimates; the dealer confirms the exact figures before you pay.</p></div></div>';
      slot.hidden = false;
    }
    draw();
    addEventListener('revv:exchange', draw);
    slot.addEventListener('change', function (e) { if (e.target.id !== 'or-city') return; city = e.target.value; R.set('revv:city', city); draw(); var s = document.getElementById('or-city'); if (s) s.focus(); });
    slot.addEventListener('click', function (e) { if (!e.target.closest('#or-t')) return; open = !open; draw(); var t = document.getElementById('or-t'); if (t) t.focus(); });
  });
})();
