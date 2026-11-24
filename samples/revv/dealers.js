/* Revv dealers: directory (dealers.html) and showroom profile (showroom.html?id=). */
(function () {
  'use strict';
  var R = window.Revv, D = window.REVV_DATA, $ = R.$, $$ = R.$$;
  var all = R.listings();
  function stock(d) { return all.filter(function (l) { return l.dealer === d.id; }); }
  function avg(d) { var s = stock(d); return s.length ? Math.round(s.reduce(function (a, l) { return a + l.score; }, 0) / s.length) : 0; }
  function initials(n) { return n.split(' ').map(function (w) { return w[0]; }).join('').replace(/[^A-Z]/g, '').slice(0, 2); }
  function dcard(d, i) {
    var s = stock(d);
    return '<article class="dc"><a class="dc-img" href="showroom.html?id=' + d.id + '" aria-label="' + R.esc(d.name) + ' showroom"><img src="photos/' + d.img + '-s.jpg" alt="" loading="lazy" decoding="async" width="720" height="480"><span class="dc-av" aria-hidden="true">' + initials(d.name) + '</span></a>' +
      '<div class="dc-b"><p class="card-k"><span>' + (i != null ? String(i + 1).padStart(2, '0') + ' · ' : '') + R.esc(d.city) + '</span><span class="' + (d.kyc === 'verified' ? 'ok' : 'sig') + '">' + (d.kyc === 'verified' ? 'Verified' : 'KYC in review') + '</span></p>' +
      '<h2 class="card-t"><a href="showroom.html?id=' + d.id + '">' + R.esc(d.name) + '</a></h2><p class="card-s">' + R.esc(d.tag) + '</p>' +
      '<p class="card-p"><b>★ ' + d.rating + '</b><span>' + s.length + ' live · avg ' + avg(d) + '/150 · replies in ' + d.reply + '</span></p></div></article>';
  }

  // ---------- directory ----------
  if ($('#dgrid')) {
    var city = new URLSearchParams(location.search).get('city') || '';
    var cities = D.dealers.map(function (d) { return d.city; });
    function draw() {
      $('#dcity').innerHTML = '<button type="button" class="chip" aria-pressed="' + !city + '" data-c="">All cities</button>' + cities.map(function (c) { return '<button type="button" class="chip" aria-pressed="' + (c === city) + '" data-c="' + c + '">' + c + '</button>'; }).join('');
      var list = R.dealers().filter(function (d) { return d.tag && (!city || d.city === city); });
      $('#dgrid').innerHTML = list.map(dcard).join('');
    }
    $('#dcity').addEventListener('click', function (e) { var b = e.target.closest('[data-c]'); if (!b) return; city = b.dataset.c; history.replaceState(null, '', city ? '?city=' + encodeURIComponent(city) : location.pathname); draw(); });
    draw();
    return;
  }

  // ---------- profile ----------
  var id = new URLSearchParams(location.search).get('id') || 'redline';
  var d = R.dealer(id); if (!d.tag) d = R.dealer('redline');
  var s = stock(d);
  document.title = d.name + ', ' + d.city + ' · Revv';
  $('#sh-img').innerHTML = '<img src="photos/' + d.img + '.jpg" alt="" width="1600" height="1000" fetchpriority="high">';
  $('#sh-c').innerHTML = '<ol class="crumbs"><li><a href="index.html">Revv</a></li><li><a href="dealers.html">Dealers</a></li><li>' + R.esc(d.city) + '</li></ol>' +
    '<p class="k">' + R.esc(d.area + ', ' + d.city) + ' · ' + (d.kyc === 'verified' ? '<span class="ok">● Verified since ' + d.since + '</span>' : '<span class="sig">● KYC in review</span>') + '</p>' +
    '<h1 class="disp" id="h1">' + R.esc(d.name) + '</h1><p class="lead">' + R.esc(d.tag) + '</p>' +
    '<div class="hero-cta" style="margin-top:28px"><a class="btn" href="#inv">See ' + s.length + ' certified</a><button type="button" class="btn ghost" id="msg">Message the showroom</button></div>';
  $('#sfacts').innerHTML = [['Rating', '★ ' + d.rating, d.reviews + ' reviews'], ['Live on Revv', s.length, 'certified listings'], ['Average report', avg(d) + '/150', 'across current stock'], ['Sold via Revv', d.sold, 'last 12 months'], ['Replies in', d.reply, 'median, last 30 days']]
    .map(function (f) { return '<div><p class="k">' + f[0] + '</p><b>' + f[1] + '</b><span>' + f[2] + '</span></div>'; }).join('');
  $('#about').innerHTML = '<p class="lead" style="max-width:60ch;color:var(--bone)">' + R.esc(d.about) + '</p>' +
    '<div class="sabout"><div><p class="k">What they do</p><ul class="trust">' + d.services.map(function (x) { return '<li>' + R.esc(x) + '</li>'; }).join('') + '</ul></div>' +
    '<div><p class="k">Visit</p><p class="addr">' + R.esc(d.landmark) + '<br>' + R.esc(d.area + ', ' + d.city) + '</p><dl class="hours">' + d.hours.map(function (h) { return '<dt>' + h[0] + '</dt><dd>' + h[1] + '</dd>'; }).join('') + '</dl><p class="k" style="margin-top:14px">Ask for ' + R.esc(d.rep) + '</p></div></div>';
  $('#inv-all').href = 'listings.html?dealer=' + d.id;
  $('#inv').innerHTML = s.length ? s.map(function (l, i) { return R.card(l, i); }).join('') : '<div class="empty"><p class="disp">Floor\'s <span class="ser">empty.</span></p><p>Everything ' + R.esc(d.name) + ' listed has sold or is waiting on its inspection. Message the showroom and they\'ll tell you what\'s coming in.</p></div>';
  $('#revs').innerHTML = d.quotes.map(function (r) { return '<figure class="rev"><p class="stars" aria-label="' + r[2] + ' out of 5">' + '★★★★★'.slice(0, r[2]) + '<span>' + '★★★★★'.slice(r[2]) + '</span></p><blockquote>“' + R.esc(r[3]) + '”</blockquote><figcaption><b>' + R.esc(r[0]) + '</b> · ' + R.esc(r[1]) + '</figcaption></figure>'; }).join('');
  $('#more').innerHTML = R.dealers().filter(function (x) { return x.id !== d.id && x.tag; }).slice(0, 3).map(function (x) { return dcard(x); }).join('');
  R.refreshCounts();

  // message the showroom -> lead (kind: visit) on the dealer CRM
  var dlg = $('#visit');
  $('#visit-sub').textContent = d.name + ' · ' + d.area + ', ' + d.city;
  $('#msg').addEventListener('click', function () { dlg.showModal(); $('#v-name').focus(); });
  $('#visitf').addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = R.validate([[$('#v-name'), 'name'], [$('#v-phone'), 'phone']]); if (!ok) return;
    var lead = R.addLead({ listing: (s[0] || {}).id || '', dealer: d.id, name: $('#v-name').value.trim(), phone: $('#v-phone').value.trim(), kind: 'enquiry', msg: $('#v-msg').value.trim() });
    dlg.close(); R.toast('Sent to ' + R.esc(d.name) + '. <a href="dealer.html?lead=' + lead.id + '">See it arrive in their CRM →</a>', 6000);
  });
})();
