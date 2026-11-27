/* The family page: one listing on one screen, for the people a buyer sends it to (family.html?id=…, from "Send to family"). */
(function () {
  'use strict';
  var R = window.Revv, D = window.REVV_DATA; if (!R || !D) return;
  var esc = R.esc, box = document.getElementById('fam');
  var id = new URLSearchParams(location.search).get('id'), l = id && R.byId(id);
  box.removeAttribute('aria-busy');
  if (!l) { box.className = 'fam-miss'; box.innerHTML = '<h1 class="disp">That one has gone.</h1><p>The link may be old, or the vehicle has been sold. <a class="ul" href="listings.html">See what is in stock</a>.</p>'; return; }
  var d = R.dealer(l.dealer), rep = R.report(l), b = R.shop(), brand = b ? b.name : 'Revv';
  var city = R.buyerCity ? R.buyerCity(l) : l.city, o = R.onroad ? R.onroad(l, city) : null;
  document.title = R.title(l) + ' · ' + brand;
  var checks = [rep.ok + ' of 150 checks passed by an independent inspector', R.own(l.owners) + ', ' + R.km(l.km) + ', ' + l.fuel.toLowerCase() + ' ' + l.trans.toLowerCase(), '7-day return if it is not as reported'];
  var adv = rep.advisories.slice(0, 2).map(function (a) { return a[1]; });
  var F = (D.FOCUS && D.FOCUS[l.img]) || { box: [0, 0, 1, 1] }, pos = Math.round((F.box[0] + F.box[2]) * 50) + '% ' + Math.round((F.box[1] + F.box[3]) * 50) + '%';
  box.innerHTML = '<figure class="fam-ph"><img style="object-position:' + pos + '" src="' + R.img(l) + '" alt="' + esc(l.color + ' ' + R.title(l)) + '" width="1600" height="1066" fetchpriority="high"><span class="fam-sc">' + l.score + '/150 inspected</span></figure>' +
    '<div class="fam-b"><p class="fam-by"><span class="fam-mk" aria-hidden="true">' + esc(brand.charAt(0).toUpperCase()) + '</span>Sent from ' + esc(brand) + '</p>' +
    '<h1>' + esc(R.title(l)) + '</h1>' +
    '<p class="fam-p"><b>' + R.inr(l.price) + '</b><span>or ' + R.inrFull(R.monthly(l.price)) + ' a month</span></p>' +
    '<p class="fam-f' + ((l.fair || 0) >= 5000 ? '' : ' n') + '">' + esc(R.fairTxt(l)) + (l.was > l.price ? ' · <span style="white-space:nowrap">price dropped from ' + R.inr(l.was) + '</span>' : '') + '</p>' +
    (o ? '<p class="fam-or">On the road in ' + esc(city) + ': <b>' + R.inr(o.total) + '</b>, with transfer, insurance and paperwork.</p>' : '') +
    '<ul class="fam-ok">' + checks.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + adv.map(function (a) { return '<li class="adv">' + esc(a) + '</li>'; }).join('') + '</ul>' +
    '<p class="fam-d">' + esc(d.name) + ', ' + esc(d.city) + ' · ★ ' + d.rating + '</p>' +
    '<div class="fam-a"><a class="btn" href="vehicle.html?id=' + encodeURIComponent(l.id) + '">See the full listing <span class="ar" aria-hidden="true">→</span></a></div></div>';
})();
