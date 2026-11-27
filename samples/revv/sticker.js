/* The windscreen sheet (sticker.html?id=…): one A5 page with the price, monthly figure, key facts, inspection score and a QR code to the listing. */
(function () {
  'use strict';
  var R = window.Revv, D = window.REVV_DATA; if (!R || !D) return;
  var esc = R.esc, el = document.getElementById('stk');
  var id = new URLSearchParams(location.search).get('id'), l = id && R.byId(id);
  document.getElementById('stk-print').addEventListener('click', function () { print(); });
  if (!l) { el.innerHTML = '<h1 class="stk-t">No listing here</h1><p class="stk-s">Open a listing and choose “Print a windscreen sheet”.</p>'; return; }
  var d = R.dealer(l.dealer), reg = R.reg(l), rep = R.report(l), b = R.shop(), brand = b ? b.name : 'Revv';
  var url = new URL('vehicle.html?id=' + encodeURIComponent(l.id), location.href).href.split('#')[0] + (b ? '#brand=' + R.encodeBrand(b) : '');
  document.getElementById('stk-back').href = 'vehicle.html?id=' + encodeURIComponent(l.id);
  document.title = 'Windscreen sheet: ' + R.title(l) + ' · ' + brand;
  var facts = [['Year', l.year], ['Odometer', R.km(l.km)], ['Owners', R.own(l.owners)], ['Fuel', l.fuel], ['Gearbox', l.trans], ['Registered', reg.rto], ['Insurance', reg.ins.split(' · ')[1].replace('to ', 'to ')], [l.type === 'bike' ? 'Engine' : 'Power', l.type === 'bike' ? (l.cc ? l.cc + 'cc' : (l.spec.motor || '').split(' ').slice(0, 2).join(' ')) : (l.spec.power || '').replace(' motor', '')]];
  var adv = rep.advisories[0] ? rep.advisories[0][1] : '';
  var qr = window.RevvQR ? window.RevvQR.svg(url, { label: 'QR code: open this listing' }) : '';
  el.innerHTML = '<div class="stk-h"><b><span class="stk-mk" aria-hidden="true">' + esc(brand.charAt(0).toUpperCase()) + '</span>' + esc(brand) + '</b><span>' + esc(d.city) + ' · inspected stock</span></div>' +
    '<div><h1 class="stk-t">' + esc(R.title(l)) + '</h1><p class="stk-s">' + esc(R.body(l) + ' · ' + l.color + ' · ' + R.blurb(l)) + '</p></div>' +
    '<p class="stk-p"><b>' + R.inr(l.price) + '</b><span>or ' + R.inrFull(R.monthly(l.price)) + ' a month*</span></p>' +
    '<dl class="stk-g">' + facts.map(function (f) { return '<div><dt>' + f[0] + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('') + '</dl>' +
    '<p class="stk-r"><b>' + rep.ok + ' of 150 checks passed.</b> ' + (adv ? 'Noted by the inspector: ' + esc(adv.charAt(0).toLowerCase() + adv.slice(1)) + '. ' : '') + 'The full report, with photos, is one scan away.</p>' +
    '<div class="stk-q">' + qr + '<p>Scan for photos, the full report and the on-road price<small>' + esc(url.replace(/^https?:\/\//, '').split('#')[0]) + '</small></p></div>' +
    '<p class="stk-n">*80% financed over five years at 10.5% a year; the bank sets the final rate. The price is fixed. 7-day return if it is not as reported. ' + esc(d.name) + '.</p>';
})();
