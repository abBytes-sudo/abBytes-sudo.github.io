/* Ghatika client care: warranty registration and lookup, service request and ticket tracking (demo records in localStorage). */
(function () {
  'use strict';
  var D = window.GH_DATA, G = window.GH, $ = G.$, $$ = G.$$;
  function errs(list) { var first = null; list.forEach(function (e) { $(e[1]).textContent = e[2] || ''; e[0].setAttribute('aria-invalid', e[2] ? 'true' : 'false'); if (e[2] && !first) first = e[0]; }); if (first) first.focus(); return !first; }
  var emailOk = function (v) { return /^\S+@\S+\.\S{2,}$/.test(v); };
  var nameOk = function (v) { return v.trim().split(/\s+/).length >= 2; };
  var SER = /^GH0[123]-\d{4}$/;

  // ---------- warranty
  if ($('#wReg')) {
    var tabs = $$('[role="tab"]');
    tabs.forEach(function (t, i) {
      var sel = function () { tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; }); };
      t.addEventListener('click', sel);
      t.addEventListener('keydown', function (e) { var d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (d) { var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); n.click(); } });
    });
    $('#wB').innerHTML = D.BOUTIQUES.map(function (b) { return '<option value="' + b.id + '">' + b.city + ' boutique</option>'; }).join('') + '<option value="online">ghatika.in (online)</option>';
    var today = new Date(); $('#wD').max = today.toISOString().slice(0, 10); $('#wD').value = today.toISOString().slice(0, 10);
    var known = G.db('warranty').filter(function (w) { return w.status === 'verified'; })[0];
    if (known) { $('#wQ').placeholder = known.serial; }
    $('#wS').addEventListener('input', function (e) { var v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (v.length > 4) v = v.slice(0, 4) + '-' + v.slice(4, 8); e.target.value = v; var m = { GH01: 'prahar', GH03: 'nimisha', GH02: 'yantra' }[v.slice(0, 4)]; if (m) $('#wM').value = m; });
    var cert = function (w, fresh) {
      var until = new Date(w.bought); until.setFullYear(until.getFullYear() + w.years);
      return '<div class="wcard"><div class="row"><div><small>Ghatika · Udaipur</small><b>Warranty certificate</b></div><svg viewBox="0 0 32 32" width="34" height="34" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="none" stroke="#c9a25a"/><path d="M6.5 13.5h19a9.5 9.5 0 0 1-19 0z" fill="#c9a25a"/><circle cx="16" cy="26.6" r="1.3" fill="#c9a25a"/></svg></div>' +
        '<div class="row"><div><small>Serial</small>' + w.serial + '</div><div><small>Model</small>' + D.MODELS[w.model].name + '</div></div><div class="row"><div><small>Bought</small>' + G.dfmt(w.bought) + '</div><div><small>Valid until</small>' + G.dfmt(until.toISOString()) + ' · ' + w.years + ' yrs</div></div></div>' +
        '<p class="hint" style="margin-top:16px">' + (fresh ? 'Registered as <b>' + w.id + '</b>. Status: <b>pending</b> until the atelier matches the serial to its build record (usually within a few hours). Keep this certificate with the watch.' : (w.status === 'verified' ? 'Verified against the build record at the atelier.' : 'Registered; verification pending at the atelier.')) + '</p>';
    };
    $('#wReg').addEventListener('submit', function (e) {
      e.preventDefault();
      var s = $('#wS').value.toUpperCase(), exist = G.db('warranty').filter(function (w) { return w.serial === s; })[0], d = $('#wD').value;
      var old = d && (Date.now() - new Date(d)) / 864e5 > 90;
      var ok = errs([
        [$('#wS'), '#eWS', !SER.test(s) ? 'Serials look like GH01-0128: GH, the calibre, then four digits.' : exist ? 'This serial is already registered. If you’ve just bought it second-hand, write to us and we’ll transfer it.' : ''],
        [$('#wD'), '#eWD', !d ? 'The date on your invoice.' : new Date(d) > new Date() ? 'That date is in the future.' : ''],
        [$('#wN'), '#eWN', !nameOk($('#wN').value) ? 'The owner’s first and last name.' : ''],
        [$('#wE'), '#eWE', !emailOk($('#wE').value) ? 'That email looks incomplete. It should look like name@domain.com.' : '']
      ]); if (!ok) return;
      var rec = { id: G.nextId('GH-W-', 'warranty', 3400), serial: s, model: $('#wM').value, customer: $('#wN').value.trim(), email: $('#wE').value.trim(), city: '', bought: new Date(d).toISOString(), boutique: $('#wB').value, registered: new Date().toISOString(), years: old ? 5 : 8, status: 'pending', source: 'website' };
      G.add('warranty', rec); $('#wOut').innerHTML = cert(rec, true) + (old ? '<p class="err">Registered more than 90 days after purchase, so the standard five years apply.</p>' : '');
      $('#wReg').reset(); $('#wD').value = today.toISOString().slice(0, 10); G.toast('Warranty ' + rec.id + ' registered');
    });
    $('#wChk').addEventListener('submit', function (e) {
      e.preventDefault(); var s = $('#wQ').value.toUpperCase().trim(), w = G.db('warranty').filter(function (x) { return x.serial === s; })[0];
      if (!errs([[$('#wQ'), '#eWQ', !SER.test(s) ? 'Serials look like GH01-0128.' : !w ? 'We can’t find ' + s + '. It may not be registered yet: register it in the other tab.' : '']])) return;
      $('#wOut').innerHTML = cert(w, false);
    });
  }

  // ---------- service request
  if ($('#sReq')) {
    var ISS = ['Running fast or slow', 'Stopped', 'Moisture under the crystal', 'Crown or hands', 'Full service', 'Strap or bracelet'], issue = '';
    $('#sI').innerHTML = ISS.map(function (x) { return '<label><input type="radio" name="si" value="' + x + '">' + x + '</label>'; }).join('');
    $$('#sI input').forEach(function (i) { i.addEventListener('change', function () { issue = i.value; $('#eSI').textContent = ''; if (issue === 'Moisture under the crystal') G.toast('Don’t open the crown. Keep it face down somewhere warm and send it as soon as you can.'); }); });
    if (new URLSearchParams(location.search).get('m')) $('#sM').value = new URLSearchParams(location.search).get('m');
    $('#sReq').addEventListener('submit', function (e) {
      e.preventDefault(); var s = $('#sS').value.toUpperCase().trim();
      var ok = errs([
        [$('#sS'), '#eSS', s && !SER.test(s) ? 'Serials look like GH01-0128. Leave it blank if you can’t read it.' : ''],
        [$('#sI input'), '#eSI', !issue ? 'Choose the closest match; you can explain below.' : ''],
        [$('#sD'), '#eSD', $('#sD').value.trim().length < 12 ? 'A sentence or two helps the watchmaker: when it started, how often you wind it.' : ''],
        [$('#sN'), '#eSN', !nameOk($('#sN').value) ? 'Your first and last name, for the courier.' : ''],
        [$('#sE'), '#eSE', !emailOk($('#sE').value) ? 'That email looks incomplete. It should look like name@domain.com.' : '']
      ]); if (!ok) return;
      var w = s && G.db('warranty').filter(function (x) { return x.serial === s; })[0];
      var under = w ? (new Date(w.bought).getFullYear() + w.years) > new Date().getFullYear() : false;
      var est = { 'Full service': 38000, 'Strap or bracelet': 9500, 'Running fast or slow': 12000, 'Stopped': 18000, 'Moisture under the crystal': 22000, 'Crown or hands': 14000 }[issue];
      var due = new Date(); due.setDate(due.getDate() + (issue === 'Full service' ? 28 : 16));
      var rec = { id: G.nextId('GH-S-', 'service', 900), at: new Date().toISOString(), customer: $('#sN').value.trim(), email: $('#sE').value.trim(), phone: '', model: $('#sM').value, serial: s || 'unknown', issue: issue, detail: $('#sD').value.trim(), stage: 'received', warranty: under, quote: under && issue !== 'Strap or bracelet' ? 0 : est, logistics: $('input[name="sl"]:checked').value, tech: '', due: due.toISOString(), source: 'website' };
      G.add('service', rec);
      $('#sReq').hidden = true;
      $('#sOut').innerHTML = '<div class="done-card"><p class="k br">Ticket opened</p><h2>' + rec.id + '</h2><p style="color:#cfc8bc;margin:0">' + (rec.logistics === 'Courier pick-up' ? 'An insured courier would collect it within two working days.' : 'Bring it to any boutique; quote ' + rec.id + ' at the door.') + ' ' + (under ? 'It looks to be under warranty, so the work should be free.' : 'Typical cost for “' + issue.toLowerCase() + '”: about ' + G.inr(est) + '. You approve a written quote first.') + '</p><p style="margin:0;color:#cfc8bc">Estimated back with you by ' + G.dfmt(due.toISOString(), { day: 'numeric', month: 'long' }) + '.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="#track" id="goTrack">Track this ticket</a></div></div>';
      $('#goTrack').addEventListener('click', function () { $('#tI').value = rec.id; $('#tE').value = rec.email; });
      G.toast('Service ticket ' + rec.id + ' opened');
    });
  }
  // ---------- tracking
  if ($('#tF')) {
    var STG = [['received', 'Received at the atelier'], ['diagnosis', 'Diagnosis'], ['quote', 'Quote sent'], ['approved', 'Quote approved'], ['service', 'In service'], ['qc', '72-hour run and pressure test'], ['ready', 'Ready to return'], ['returned', 'Returned to you']];
    $('#tF').addEventListener('submit', function (e) {
      e.preventDefault(); var id = $('#tI').value.toUpperCase().trim(), t = G.db('service').filter(function (x) { return x.id === id; })[0];
      if (!errs([[$('#tI'), '#eTI', !/^GH-S-\d+$/.test(id) ? 'Ticket numbers look like GH-S-880.' : !t ? 'We can’t find ' + id + '. Check the number in your confirmation email.' : ''], [$('#tE'), '#eTE', !emailOk($('#tE').value) ? 'The email you used for the request.' : '']])) return;
      var at = STG.findIndex(function (s) { return s[0] === t.stage; });
      $('#tOut').innerHTML = '<div class="receipt"><div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap"><div><p class="k">' + t.id + ' · ' + D.MODELS[t.model].name + (t.serial !== 'unknown' ? ' · ' + t.serial : '') + '</p><p class="h3" style="margin:6px 0 0">' + STG[at][1] + '</p></div><p class="price" style="font-size:1.4rem">' + (t.warranty ? 'Under warranty' : t.quote ? G.inr(t.quote) : 'Quote pending') + '</p></div><ol class="timeline">' +
        STG.map(function (s, i) { return '<li class="' + (i < at ? 'done' : i === at ? 'now' : '') + '"><span>' + s[1] + '</span><span>' + (i === at ? 'now' : i < at ? 'done' : '') + '</span></li>'; }).join('') + '</ol><p class="hint" style="margin:0">' + G.esc(t.issue) + ': “' + G.esc(t.detail) + '”</p></div>';
    });
    if (location.hash === '#track') setTimeout(function () { $('#tI').focus(); }, 300);
  }
})();
