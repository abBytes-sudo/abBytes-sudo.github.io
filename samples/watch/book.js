/* Ghatika boutiques: cards and the three-step appointment flow (writes to the demo back office). */
(function () {
  'use strict';
  var D = window.GH_DATA, G = window.GH, $ = G.$, $$ = G.$$;
  var CLOSED = { udaipur: [1], mumbai: [0], delhi: [1], bengaluru: [0] }; // day of week
  if (!$('#bqGrid').children.length) $('#bqGrid').innerHTML = D.BOUTIQUES.map(function (b) {
    return '<article class="bqc"><div class="ph"><img src="' + b.img + '" alt="' + (b.id === 'udaipur' ? 'The City Palace across Lake Pichola, a short walk from our atelier' : b.id === 'mumbai' ? 'The Kala Ghoda salon: flowers, framed prints and a dark display table' : b.id === 'delhi' ? 'Looking up into the courtyard of an old Delhi house' : 'A walnut cabinet, brass lamp and mirror in the Lavelle Road room') + '" width="1500" height="938" loading="lazy" decoding="async"></div>' +
      '<p class="k">' + b.area + '</p><h2>' + b.city + '<span class="nick">' + b.name + '</span></h2><p style="margin:0;color:var(--muted-p)">' + b.note + '</p>' +
      '<dl><dt>Address</dt><dd>' + b.addr + '</dd><dt>Hours</dt><dd>' + b.hours + '</dd><dt>Here</dt><dd>' + b.services.join(' · ') + '</dd></dl>' +
      '<p><a class="lnk" href="?b=' + b.id + '#book" data-pick="' + b.id + '">Book ' + b.city + ' <span class="ar" aria-hidden="true">→</span></a></p></article>';
  }).join('');

  var q = new URLSearchParams(location.search);
  var st = { b: D.BOUTIQUES.some(function (x) { return x.id === q.get('b'); }) ? q.get('b') : 'udaipur', p: q.get('p') === 'service' ? 'Service or repair' : 'Private viewing', date: null, time: null, month: 0 };
  var bkB = $('#bkB'), bkP = $('#bkP');
  bkB.innerHTML = D.BOUTIQUES.map(function (b) { return '<label><input type="radio" name="bkb" value="' + b.id + '"' + (b.id === st.b ? ' checked' : '') + '>' + b.city + '</label>'; }).join('');
  function purposes() {
    bkP.innerHTML = D.PURPOSES.map(function (p) { var dis = /Udaipur only/.test(p) && st.b !== 'udaipur'; if (dis && st.p === p) st.p = 'Private viewing'; return '<label' + (dis ? ' style="opacity:.4"' : '') + '><input type="radio" name="bkp" value="' + p + '"' + (p === st.p ? ' checked' : '') + (dis ? ' disabled' : '') + '>' + p + '</label>'; }).join('');
    $$('input', bkP).forEach(function (i) { i.addEventListener('change', function () { st.p = i.value; summary(); }); });
  }
  $$('input', bkB).forEach(function (i) { i.addEventListener('change', function () { st.b = i.value; st.date = st.time = null; purposes(); cal(); summary(); }); });
  $$('[data-pick]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); var i = $('input[value="' + a.dataset.pick + '"]', bkB); i.checked = true; i.dispatchEvent(new Event('change')); go(1); $('#book').scrollIntoView({ behavior: G.reduce ? 'auto' : 'smooth' }); history.replaceState(null, '', '?b=' + a.dataset.pick + '#book'); }); });
  if (q.get('m')) $('#bkM').value = q.get('m');
  $('#bkM').addEventListener('change', summary);
  purposes();

  // ---------- calendar
  function key(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function taken(b, k, t) { // real bookings plus a believable, stable pattern of busy hours
    var hit = G.db('appts').some(function (a) { var d = new Date(a.at); return a.boutique === b && key(d) === k && String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') === t && a.status !== 'cancelled'; });
    var h = 0, s = b + k + t; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return hit || h % 5 === 0;
  }
  function free(b, d) { var k = key(d); return D.SLOTS.filter(function (t) { return !taken(b, k, t) && !(sameDay(d, new Date()) && +t.slice(0, 2) <= new Date().getHours() + 1); }); }
  function sameDay(a, b) { return key(a) === key(b); }
  function cal() {
    var now = new Date(), m = new Date(now.getFullYear(), now.getMonth() + st.month, 1);
    $('#calH').textContent = m.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    $('#calPrev').disabled = st.month === 0; $('#calNext').disabled = st.month >= 2;
    var html = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(function (d) { return '<span class="dow" aria-hidden="true">' + d + '</span>'; }).join('');
    var lead = (m.getDay() + 6) % 7; for (var i = 0; i < lead; i++) html += '<span></span>';
    var days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate(), today = new Date(); today.setHours(0, 0, 0, 0);
    for (var dd = 1; dd <= days; dd++) {
      var d = new Date(m.getFullYear(), m.getMonth(), dd), closed = CLOSED[st.b].indexOf(d.getDay()) > -1, past = d < today, f = closed || past ? [] : free(st.b, d);
      var dis = closed || past || !f.length, lbl = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) + (closed ? ', closed' : past ? '' : !f.length ? ', fully booked' : ', ' + f.length + ' times free');
      html += '<button type="button" data-d="' + key(d) + '"' + (dis ? ' disabled' : '') + ' class="' + (f.length && f.length <= 2 ? 'few' : '') + '" aria-pressed="' + (st.date === key(d)) + '" aria-label="' + lbl + '">' + dd + '</button>';
    }
    $('#cal').innerHTML = html;
    $$('#cal button:not([disabled])').forEach(function (b) { b.addEventListener('click', function () { st.date = b.dataset.d; st.time = null; $$('#cal button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); slots(); summary(); }); });
    slots();
  }
  function slots() {
    var el = $('#slots'); if (!st.date) { el.innerHTML = '<p class="hint">Pick a day first.</p>'; return; }
    var p = st.date.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]), f = free(st.b, d);
    el.innerHTML = D.SLOTS.map(function (t) { var ok = f.indexOf(t) > -1; return '<button type="button" data-t="' + t + '"' + (ok ? '' : ' disabled aria-label="' + t + ', taken"') + ' aria-pressed="' + (st.time === t) + '">' + t + '</button>'; }).join('');
    $$('button:not([disabled])', el).forEach(function (b) { b.addEventListener('click', function () { st.time = b.dataset.t; $$('#slots button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); $('#e2').textContent = ''; summary(); }); });
  }
  $('#calPrev').addEventListener('click', function () { st.month = Math.max(0, st.month - 1); cal(); });
  $('#calNext').addEventListener('click', function () { st.month = Math.min(2, st.month + 1); cal(); });

  function bq() { return D.BOUTIQUES.filter(function (x) { return x.id === st.b; })[0]; }
  function when() { if (!st.date || !st.time) return null; var p = st.date.split('-'), t = st.time.split(':'); return new Date(+p[0], +p[1] - 1, +p[2], +t[0], +t[1]); }
  function summary() {
    var b = bq(), w = when();
    $('#bkSummary').innerHTML = '<div><span>Boutique</span><span>' + b.city + ' · ' + b.name + '</span></div><div><span>For</span><span>' + G.esc(st.p) + '</span></div>' + ($('#bkM').value ? '<div><span>On the table</span><span>' + D.MODELS[$('#bkM').value].name + '</span></div>' : '') + '<div><span>When</span><span>' + (w ? w.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' + st.time : '<em>not chosen yet</em>') + '</span></div><div><span>Address</span><span style="text-align:right">' + b.addr + '</span></div>';
  }
  // ---------- steps
  function go(n) {
    $$('.bk-step').forEach(function (f) { f.hidden = +f.dataset.step !== n; });
    $$('#bkSteps li').forEach(function (li, i) { li.classList.toggle('done', i + 1 < n); if (i + 1 === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
    var first = $('.bk-step[data-step="' + n + '"] input:not([disabled]), .bk-step[data-step="' + n + '"] button'); if (first && document.activeElement && document.activeElement.closest('#bk')) first.focus();
  }
  $$('[data-next]').forEach(function (b) { b.addEventListener('click', function () {
    var n = +b.dataset.next;
    if (n === 3 && (!st.date || !st.time)) { $('#e2').textContent = !st.date ? 'Choose a day in the calendar, then a time.' : 'Now choose a time on ' + st.date.split('-').reverse().join('.') + '.'; return; }
    go(n);
  }); });
  $('#bk').addEventListener('submit', function (e) {
    e.preventDefault(); var ok = true;
    var n = $('#bkN'), em = $('#bkE'), t = $('#bkT');
    function err(el, box, msg) { $(box).textContent = msg; el.setAttribute('aria-invalid', msg ? 'true' : 'false'); if (msg && ok) { el.focus(); ok = false; } }
    err(n, '#eN', n.value.trim().split(/\s+/).length < 2 ? 'Your first and last name, please, so we can greet you properly.' : '');
    err(em, '#eE', !/^\S+@\S+\.\S{2,}$/.test(em.value) ? 'That email looks incomplete. It should look like name@domain.com.' : '');
    var digits = t.value.replace(/\D/g, '');
    err(t, '#eT', t.value && !(digits.length === 10 || (digits.length === 12 && digits.indexOf('91') === 0)) ? 'A 10-digit Indian mobile number, with or without +91.' : '');
    if (!ok) return;
    var w = when(), b = bq(), id = G.nextId('GH-A-', 'appts', 5200);
    G.add('appts', { id: id, boutique: b.id, at: w.toISOString(), customer: n.value.trim(), email: em.value.trim(), phone: digits ? '+91 ' + digits.slice(-10, -5) + ' •••' + digits.slice(-2) : '', purpose: st.p, interest: $('#bkM').value || 'all', guests: +$('#bkG').value, status: 'requested', host: '', note: $('#bkX').value.trim(), source: 'website', created: new Date().toISOString() });
    $('#bk').hidden = true; $('#bkSteps').hidden = true;
    var done = $('#bkDone'); done.hidden = false;
    done.innerHTML = '<div class="done-card" tabindex="-1" id="doneCard"><p class="k br">Requested</p><h2>See you on ' + w.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) + '.</h2><p class="ref">' + id + '</p><p style="color:#cfc8bc;max-width:46ch;margin:0">' + G.esc(n.value.trim().split(' ')[0]) + ', we’ve asked ' + b.city + ' to hold ' + st.time + ' for you. A person will confirm by email within two working hours. You can change or cancel it from the confirmation email.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" id="ics" download="ghatika-' + id + '.ics">Add to calendar</a></div></div>';
    var end = new Date(w.getTime() + 3600000), f = function (d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ghatika//Boutiques//EN', 'BEGIN:VEVENT', 'UID:' + id + '@ghatika.example', 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(w), 'DTEND:' + f(end), 'SUMMARY:Ghatika ' + st.p + ' (' + b.city + ')', 'LOCATION:' + b.addr.replace(/,/g, '\\,'), 'DESCRIPTION:Reference ' + id + '. Ghatika, Udaipur.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    $('#ics').href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    $('#doneCard').focus(); G.toast('Request ' + id + ' sent to ' + b.city);
  });
  cal(); summary();
})();
