/* Exchange against this one: fills #exchange-slot on the vehicle page. Four steps on the shared valuation (R.valuate):
   your vehicle, year and kilometres, condition, your offer. Applying it rewrites the price block with the net figure and
   the new monthly figure, and writes the request to revv:exchange for the dealer (see R.addExchange in app.js). */
(function () {
  'use strict';
  var R = window.Revv, D = window.REVV_DATA; if (!R || !D) return;
  var esc = R.esc, NOW = new Date().getFullYear();
  var CAR = '<svg class="ic2" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16V12l2-5h12l2 5v4"/><path d="M3 16h18M7 16v2M17 16v2"/><circle cx="7.5" cy="12.5" r=".6"/><circle cx="16.5" cy="12.5" r=".6"/></svg>';

  R.whenSlot('exchange-slot', function (slot, id) {
    var l = R.byId(id); if (!l) return;
    var S = { step: -1, type: l.type, model: '', year: 0, km: 0, cond: '', q: '' }, err = '', orig = null;
    var draft = null; try { draft = JSON.parse(sessionStorage.getItem('revv:xdraft') || 'null'); } catch (e) {}

    function val() { return R.valuate({ type: S.type, model: S.model, year: S.year, km: S.km, cond: S.cond }); }
    function price() { return document.querySelector('#side-main .price'); }
    function paint() {
      var p = price(), x = R.xFor(l.id), mb = document.getElementById('mb-p');
      if (!p) return;
      if (orig === null) orig = p.innerHTML;
      if (!x) { p.innerHTML = orig; p.classList.remove('xed'); if (mb) mb.textContent = R.inr(l.price); return; }
      var net = l.price - x.low;
      p.classList.add('xed');
      p.innerHTML = '<b>' + R.inr(net) + '</b><span>after ' + R.inr(x.low) + ' for your ' + esc(x.year + ' ' + x.make + ' ' + x.model) + '<br>' + R.inrFull(R.monthly(net)) + ' a month · <button type="button" class="x-undo" data-x-undo>undo</button></span>';
      if (mb) mb.textContent = R.inr(net);
    }
    function bar() { return '<div class="xw-bar" aria-hidden="true">' + [0, 1, 2, 3].map(function (i) { return '<i' + (i <= S.step ? ' class="on"' : '') + '></i>'; }).join('') + '</div>'; }
    function head(t) { return '<div class="xw-h"><b id="xw-t" tabindex="-1">' + t + '</b><span>' + (S.step + 1) + ' of 4</span></div>' + bar(); }
    function nav(can, label) { return '<div class="xw-nav">' + (S.step > 0 ? '<button type="button" class="btn ghost sm" data-xb>← Back</button>' : '<button type="button" class="btn ghost sm" data-xc>Cancel</button>') + '<button type="button" class="btn sm" data-xn' + (can ? '' : ' disabled') + '>' + (label || 'Continue') + '</button></div>'; }
    function models() { var q = S.q.toLowerCase(); return D.MODELS[S.type].filter(function (m) { return !q || (m[0] + ' ' + m[1]).toLowerCase().indexOf(q) > -1; }); }
    function list() { return models().map(function (m) { return '<button type="button" class="opt2" data-xm="' + esc(m[0]) + '" aria-pressed="' + (S.model === m[0]) + '">' + esc(m[0]) + '<small>' + esc(m[1]) + '</small></button>'; }).join('') || '<p class="k2">No match. Try a make, like Arka, Ashwa, Ishiro or Varno.</p>'; }

    function draw(focus) {
      var x = R.xFor(l.id), h;
      if (S.step < 0) {
        h = x ? '<p class="slot-h">Your exchange</p><p class="xw-ok">Your <b>' + esc(x.year + ' ' + x.make + ' ' + x.model) + '</b> is on this one at <b>' + R.inr(x.low) + ' to ' + R.inr(x.high) + '</b>. ' + esc(R.dealer(l.dealer).name) + ' has the request and confirms the final figure when they inspect it.</p>' +
            '<div class="xw-nav"><button type="button" class="btn ghost sm" data-xedit>Change it</button><button type="button" class="btn ghost sm" data-xdrop>Remove</button></div>'
          : '<button type="button" class="btn ghost slot-btn" data-xopen aria-expanded="false" aria-controls="xw">' + CAR + 'Exchange my car or bike</button>';
      } else if (S.step === 0) {
        h = '<div class="xw" id="xw" role="group" aria-labelledby="xw-t">' + head('What are you trading in?') +
          '<div class="seg2" role="group" aria-label="Car or bike">' + [['car', 'A car'], ['bike', 'A bike']].map(function (t) { return '<button type="button" class="opt2" data-xt="' + t[0] + '" aria-pressed="' + (S.type === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
          '<div class="fld"><label class="sr" for="xw-q">Search models</label><input class="inp" id="xw-q" type="search" placeholder="Make or model" autocomplete="off" value="' + esc(S.q) + '"></div>' +
          '<div class="list2" id="xw-list">' + list() + '</div>' + nav(!!S.model) + '</div>';
      } else if (S.step === 1) {
        if (!S.year) S.year = NOW - 5; if (!S.km) S.km = S.type === 'bike' ? 20000 : 50000;
        var max = S.type === 'bike' ? 80000 : 150000, ys = []; for (var y = NOW; y >= NOW - 15; y--) ys.push(y);
        h = '<div class="xw" id="xw" role="group" aria-labelledby="xw-t">' + head('Year and kilometres') +
          '<div class="fld"><label for="xw-y">Registered in</label><select class="sel" id="xw-y">' + ys.map(function (y) { return '<option' + (y === S.year ? ' selected' : '') + '>' + y + '</option>'; }).join('') + '</select></div>' +
          '<div class="fld"><label for="xw-km">On the odometer</label><p class="xw-km" id="xw-kmv" aria-hidden="true">' + R.km(S.km) + '</p><input type="range" id="xw-km" min="500" max="' + max + '" step="500" value="' + S.km + '" aria-valuetext="' + R.km(S.km) + '"></div>' + nav(true) + '</div>';
      } else if (S.step === 2) {
        h = '<div class="xw" id="xw" role="group" aria-labelledby="xw-t">' + head('Honestly, how is it?') +
          '<div class="list2" style="max-height:none">' + D.COND.map(function (c) { return '<button type="button" class="opt2" data-xk="' + c[0] + '" aria-pressed="' + (S.cond === c[0]) + '">' + c[1] + '<small>' + c[2] + '</small></button>'; }).join('') + '</div>' +
          '<p class="k2">The inspection checks this, so there is nothing to gain by rounding up.</p>' + nav(!!S.cond, 'See my offer') + '</div>';
      } else {
        var v = val(), net = l.price - v.lo;
        h = '<div class="xw" id="xw" role="group" aria-labelledby="xw-t">' + head('Your offer') +
          '<p class="xw-est">' + R.inr(v.lo) + ' <small>to</small> ' + R.inr(v.hi) + '</p><p class="k2" style="margin:0">' + esc(S.year + ' ' + S.model) + ' · ' + R.km(S.km) + ' · ' + D.COND.filter(function (c) { return c[0] === S.cond; })[0][1].toLowerCase() + '</p>' +
          '<dl class="xw-math"><dt>This ' + esc(l.make + ' ' + l.model) + '</dt><dd>' + R.inrFull(l.price) + '</dd><dt>Yours, at least</dt><dd>−' + R.inrFull(v.lo) + '</dd><dt class="tot">You pay</dt><dd class="tot">' + R.inrFull(net) + '</dd><dt>A month</dt><dd>' + R.inrFull(R.monthly(net)) + '</dd></dl>' +
          '<form id="xw-f" novalidate style="margin-top:14px"><div class="fld"><label for="xw-n">Your name</label><input class="inp" id="xw-n" autocomplete="name" aria-describedby="xw-n-e"><p class="ferr" id="xw-n-e"></p></div>' +
          '<div class="fld"><label for="xw-c">Mobile number or email</label><input class="inp" id="xw-c" autocomplete="on" aria-describedby="xw-c-h xw-c-e"><p class="k2" id="xw-c-h">Only the dealer sees it, to book the inspection.</p><p class="ferr" id="xw-c-e"></p></div>' +
          '<div class="xw-nav"><button type="button" class="btn ghost sm" data-xb>← Back</button><button type="submit" class="btn sm">Take this offer</button></div></form></div>';
      }
      slot.innerHTML = h; slot.hidden = false;
      var b = slot.querySelector('[data-xopen]'); if (b) b.setAttribute('aria-expanded', 'false');
      if (focus) { var t = slot.querySelector(focus); if (t) t.focus({ preventScroll: false }); }
    }
    function go(step) { S.step = step; draw(step < 0 ? '[data-xopen],[data-xedit]' : '#xw-t'); }

    slot.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.hasAttribute('data-xopen') || t.hasAttribute('data-xedit')) return go(0);
      if (t.hasAttribute('data-xc')) return go(-1);
      if (t.hasAttribute('data-xdrop')) { R.dropExchange(l.id); paint(); go(-1); R.toast('Exchange removed. The price is back to ' + R.inr(l.price) + '.'); return; }
      if (t.hasAttribute('data-xb')) return go(S.step - 1);
      if (t.hasAttribute('data-xn')) return go(S.step + 1);
      if (t.dataset.xt) { if (S.type !== t.dataset.xt) { S.type = t.dataset.xt; S.model = ''; S.km = 0; } draw('[data-xt="' + S.type + '"]'); return; }
      if (t.dataset.xm) { S.model = t.dataset.xm; draw('[data-xm="' + S.model.replace(/"/g, '') + '"]'); return; }
      if (t.dataset.xk) { S.cond = t.dataset.xk; draw('[data-xk="' + S.cond + '"]'); return; }
    });
    slot.addEventListener('input', function (e) {
      if (e.target.id === 'xw-q') { S.q = e.target.value; document.getElementById('xw-list').innerHTML = list(); }
      if (e.target.id === 'xw-km') { S.km = +e.target.value; document.getElementById('xw-kmv').textContent = R.km(S.km); e.target.setAttribute('aria-valuetext', R.km(S.km)); }
    });
    slot.addEventListener('change', function (e) { if (e.target.id === 'xw-y') S.year = +e.target.value; });
    slot.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = document.getElementById('xw-n'), c = document.getElementById('xw-c'), name = n.value.trim(), contact = c.value.trim(), digits = contact.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
      var okN = name.length >= 2 && !/\d/.test(name), okC = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact) || (digits.length === 10 && /^[6-9]/.test(digits) && !/[a-z@]/i.test(contact));
      n.setAttribute('aria-invalid', !okN); document.getElementById('xw-n-e').textContent = okN ? '' : 'Your name, so the dealer knows who to expect.';
      c.setAttribute('aria-invalid', !okC); document.getElementById('xw-c-e').textContent = okC ? '' : 'A ten-digit mobile number or an email address, please.';
      if (!okN) { n.focus(); return; } if (!okC) { c.focus(); return; }
      var v = val();
      R.addExchange({ wantId: l.id, modelName: S.model, year: S.year, km: S.km, condition: S.cond, low: v.lo, high: v.hi, name: name, contact: contact });
      try { sessionStorage.removeItem('revv:xdraft'); } catch (er) {}
      paint(); go(-1);
      R.toast('Exchange added. ' + esc(R.dealer(l.dealer).name) + ' has your request; you pay ' + R.inr(l.price - v.lo) + '.', 6000);
    });
    addEventListener('revv:exchange', function () { paint(); if (S.step < 0) draw(); });
    document.addEventListener('click', function (e) { if (e.target.closest('[data-x-undo]')) { R.dropExchange(l.id); paint(); go(-1); R.toast('Exchange removed. The price is back to ' + R.inr(l.price) + '.'); } });

    // arriving from Sell ("Exchange it for…"): the valuation is already done, so open on the offer
    if (/^#exchange$/.test(location.hash) && draft && R.model(draft.type, draft.model) && !R.xFor(l.id)) {
      S.type = draft.type; S.model = draft.model; S.year = draft.year; S.km = draft.km; S.cond = draft.cond;
      go(3); setTimeout(function () { slot.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 300);
    } else draw();
    paint();
  });
})();
