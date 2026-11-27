/* Revv · the buyer's papers tracker. Reads the deal from "revv:deals" by its tracking code (track.html#t=CODE) and shows the
   same steps the showroom ticks on its deal desk: what is done, what is next and when the RC should arrive. */
(function () {
  'use strict';
  var R = window.Revv, M = window.DEALS, el = document.getElementById('trk'), h1 = document.getElementById('h1'), sub = document.getElementById('trk-sub');
  if (!R || !M || !el) return;
  var esc = R.esc;
  function dfmt(t, long) { return new Date(t).toLocaleDateString('en-IN', long ? { weekday: 'long', day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long' }); }
  function code() { var m = location.hash.match(/t=([A-Za-z0-9]+)/), q = new URLSearchParams(location.search).get('t'); return ((m && m[1]) || q || '').toUpperCase(); }
  var NEXT = { token: 'The showroom is holding the vehicle for you.', payment: 'Pay the balance, or the bank pays it on disbursal. Nothing to sign yet.', loan: 'The bank pays the showroom once your loan papers are checked.', forms: 'Sign Forms 29 and 30 at the showroom; the seller signs theirs.', insurance: 'The policy moves to your name. You will get the new copy by email.', hypo: 'The seller’s old loan is closed and the bank’s name comes off the RC.', rtoapply: 'The showroom files the transfer at the RTO with the signed forms.', rc: 'The RTO prints the smart card and the showroom hands it to you.' };
  function render() {
    var c = code(), d = c ? M.byTrack(c) : null;
    // a link opened in a browser that has not seen the showroom yet: build the showrooms' deals (same codes) and look again
    if (c && !d) { R.dealers().forEach(function (x) { M.seed(x.id); }); d = M.byTrack(c); }
    if (!d) { lookup(c); return; }
    var l = R.byId(d.vehicleId), dl = R.dealer(d.dealer), p = M.progress(d), real = d.steps.filter(function (s) { return !s.skip; }), cur = real.filter(function (s) { return !s.done; })[0];
    var head = p.complete ? 'Your RC is delivered' : 'Your RC transfer: step\u00a0' + (p.done + 1) + '\u00a0of\u00a0' + p.total;
    h1.textContent = head; document.title = head + ' · Revv';
    sub.textContent = 'Hi ' + d.buyer.split(' ')[0] + ', this page updates the moment ' + dl.name + ' ticks a step.';
    el.innerHTML = '<div class="trk"><div><p class="trk-now">' + (p.complete ? 'All done.' : esc(M.label(cur.key)[1])) + '</p><p class="trk-eta">' + (p.complete ? 'Delivered on <b>' + dfmt(p.eta) + '</b>.' : 'RC expected by <b>' + dfmt(p.eta) + '</b> · ' + esc(dl.name) + ', ' + esc(dl.city)) + '</p>' +
      '<div class="trk-bar" role="img" aria-label="' + p.done + ' of ' + p.total + ' steps done">' + real.map(function (s) { return '<i class="' + (s.done ? 'on' : s === cur ? 'cur' : '') + '"></i>'; }).join('') + '</div>' +
      '<ol class="trk-steps">' + d.steps.map(function (s) { var L = M.label(s.key), who = String(s.by || '').split(' ')[0];
        return '<li class="' + (s.skip ? 'na' : s.done ? 'on' : s === cur ? 'cur' : '') + '"><b>' + esc(L[1]) + '</b><span>' + esc(s.skip ? (s.key === 'loan' ? 'Not needed: paid without a loan.' : 'Not needed: no loan on the vehicle.') : s === cur ? NEXT[s.key] : L[2]) + '</span>' + (s.skip ? '' : '<small>' + (s.done ? 'Done · ' + dfmt(s.at) + (who ? ' · ' + esc(who) : '') : s === cur ? 'In progress · ' + esc(who) + ' · expected ' + dfmt(s.due) : 'Expected ' + dfmt(s.due)) + '</small>') + '</li>'; }).join('') + '</ol></div>' +
      '<aside><div class="trk-card">' + (l ? '<img src="' + R.img(l) + '" alt="' + esc(R.title(l)) + '" width="640" height="400">' : '') + '<div><b>' + esc(l ? R.title(l) : 'Your vehicle') + '</b><span>Bought on ' + dfmt(d.at) + ' · ' + R.inrFull(d.price) + '</span><span>Deal ' + esc(d.id) + ' · tracking code ' + esc(d.track) + '</span></div></div>' +
      '<div class="trk-q"><p>Questions about your papers? ' + esc(dl.name) + ' usually replies in ' + esc(dl.reply || 'under an hour') + '.</p><a class="btn sm" href="showroom.html?id=' + encodeURIComponent(dl.id) + '">Message the showroom <span class="ar" aria-hidden="true">→</span></a></div>' +
      '<div class="trk-q"><p>Your documents: RC copy, insurance and the 150-point report stay with your deal. The 7-day return and the 6-month cover start on ' + dfmt(d.at) + '.</p><a class="btn sm ghost" href="policy-return.html">The 7-day return</a> <a class="btn sm ghost" href="policy-cover.html">The 6-month cover</a></div></aside></div>';
  }
  function lookup(c) {
    h1.textContent = 'Your papers'; document.title = 'Track your papers · Revv';
    var ex = M.all()[0]; if (!ex) { M.seed('redline'); ex = M.all()[0]; }
    el.innerHTML = (c ? '<p class="pg-p" role="alert">No deal has the code <b>' + esc(c) + '</b>. Check the link the showroom sent, or type the code below.</p>' : '') +
      '<form class="trk-find" id="trk-f" novalidate><label class="fld"><span>Tracking code</span><input class="inp2" name="t" required autocomplete="off" spellcheck="false" placeholder="Six letters and numbers" value="' + esc(c || '') + '"></label><button class="btn" type="submit">Track <span class="ar" aria-hidden="true">→</span></button></form>' +
      (ex ? '<p class="trk-ex">The code is on your delivery note and in the WhatsApp message from the showroom. <a href="#t=' + esc(ex.track) + '">See one in progress</a>.</p>' : '');
    document.getElementById('trk-f').addEventListener('submit', function (e) { e.preventDefault(); var v = String(new FormData(e.target).get('t') || '').trim().toUpperCase(); if (v) location.hash = 't=' + v; });
  }
  addEventListener('hashchange', render);
  addEventListener('storage', function (e) { if (e.key === 'revv:deals') render(); });
  render();
})();
