/* Taradhura weddings and offsites: venues + an enquiry form that lands in the back-office pipeline (stage "New"). */
(function () {
  'use strict';
  var TD = window.TD, ui = TD.ui, $ = ui.$, $$ = ui.$$, esc = ui.esc, D = TD.date;
  $('#venues').innerHTML = TD.venues.map(function (v) { return '<div><h3>' + esc(v.name) + '</h3><b>' + esc(v.cap) + '</b><p>' + esc(v.note) + '</p></div>'; }).join('');
  var kind = 'Wedding';
  $$('#kind button').forEach(function (b) { b.onclick = function () { kind = b.dataset.k; $$('#kind button').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); }; });
  var f = $('#enq');
  function err(name, msg) { var i = f.elements[name], fl = i.closest('.field'); fl.classList.toggle('err', !!msg); fl.querySelector('.msg').textContent = msg || ''; i.setAttribute('aria-invalid', !!msg); return msg ? i : null; }
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var el = f.elements, bad = [
      err('name', el.name.value.trim().length < 2 ? 'Who should Ritu ask for?' : ''),
      err('email', !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.email.value.trim()) ? 'An email we can send dates and a budget to.' : ''),
      err('guests', !(+el.guests.value >= 8 && +el.guests.value <= 150) ? 'Between 8 and 150 guests; for fewer, book cottages directly.' : '')
    ].filter(Boolean);
    if (bad.length) { bad[0].focus(); return; }
    var list = TD.enquiries(), id = 'EQ-' + (1047 + list.length);
    list.unshift({ id: id, kind: kind, name: el.name.value.trim(), org: el.org.value.trim(), email: el.email.value.trim(), guests: +el.guests.value, dates: el.dates.value.trim() || 'Flexible', budget: el.budget.value || 'Not sure', stage: 'New', venue: el.venue.value, created: D.today(), note: el.note.value.trim() || '—', web: true });
    TD.saveEnquiries(list);
    $('#enq-done').innerHTML = '<div class="demo-pay" style="margin:8px 0 0;background:rgba(61,107,74,.08);border:1px solid rgba(61,107,74,.4)"><b>Thank you, ' + esc(el.name.value.trim().split(' ')[0]) + '.</b><span>Enquiry ' + id + ' is with Ritu. Expect dates and a first budget within a working day.</span></div>';
    f.reset(); ui.toast('Enquiry ' + id + ' sent');
  });
})();
