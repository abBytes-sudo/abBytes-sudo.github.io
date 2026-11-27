/* Revv · for dealers and finance. The yard calculator, the application that lands in the admin KYC queue ("revv:kyc"),
   and the finance pre-approval form, which writes a lead into the showroom's pipeline. */
(function () {
  'use strict';
  var R = window.Revv; if (!R) return;
  var $ = function (s) { return document.querySelector(s); }, esc = R.esc;
  function num(v) { var n = parseFloat(String(v).replace(/[^0-9.]/g, '')); return isFinite(n) ? n : 0; }

  /* ---------- "Put your name on it": the headline, the small preview and the page accent take the showroom's name, city and
     colour as they are typed; the button stores it ("revv:brand") and opens the site as that showroom ---------- */
  (function () {
    var f = $('#fd-name'); if (!f || !R.setBrand) return;
    var D = window.REVV_DATA, SW = [['#FF5B1F', 'Orange'], ['#3DDC97', 'Green'], ['#4F8CFF', 'Blue'], ['#F5C518', 'Amber'], ['#E5484D', 'Red'], ['#B78AF7', 'Violet'], ['#2EC4B6', 'Teal']];
    var cur = R.brand() || { name: '', city: 'Jaipur', colour: '#FF5B1F', deals: 'cars' }, colour = cur.colour;
    var nm = $('#fd-n'), cs = $('#fd-c'), sw = $('#fd-sw'), err = $('#fd-name-e'), plate = $('#fd-plate'), plateT = $('#fd-plate-t');
    cs.innerHTML = Object.keys(D.RTO || {}).sort().map(function (t) { return '<option' + (t === cur.city ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('');
    sw.innerHTML = SW.map(function (c) { return '<label title="' + c[1] + '"><input type="radio" name="colour" value="' + c[0] + '"' + (c[0].toLowerCase() === String(colour).toLowerCase() ? ' checked' : '') + '><span style="--c:' + c[0] + '"></span><span class="sr">' + c[1] + '</span></label>'; }).join('');
    if (!sw.querySelector('input:checked')) sw.querySelector('input').checked = true;
    nm.value = cur.name || ''; var dr = f.querySelector('input[name="deals"][value="' + cur.deals + '"]'); if (dr) dr.checked = true;
    function read() { var d = new FormData(f); return { name: String(d.get('name') || '').replace(/\s+/g, ' ').trim(), city: d.get('city'), colour: d.get('colour') || '#FF5B1F', deals: d.get('deals') || 'cars' }; }
    function paint() {
      var b = read(), has = b.name.length > 1, a = R.accent(b.colour), base = R.baseDealer({ deals: b.deals });
      var n = R.listings().filter(function (l) { return l.dealer === base && (b.deals === 'both' || l.type === (b.deals === 'bikes' ? 'bike' : 'car')); }).length;
      var noun = b.deals === 'bikes' ? 'bikes' : b.deals === 'cars' ? 'cars' : 'cars and bikes';
      plateT.textContent = has ? b.name : 'your name'; plate.classList.toggle('set', has);
      plate.style.fontSize = ''; var room = plate.parentNode.clientWidth, need = plate.scrollWidth; if (need > room) plate.style.fontSize = Math.max(0.42, room / need * 0.985).toFixed(3) + 'em';
      f.style.setProperty('--pc', a.sig); plate.style.setProperty('--pc', a.sig);
      $('#fd-mono').textContent = (has ? b.name : 'S').charAt(0).toUpperCase();
      $('#fd-prev-n').textContent = has ? b.name : 'Your showroom';
      $('#fd-prev-h').textContent = (has ? b.name : 'Your showroom') + '.';
      $('#fd-prev-k').textContent = n + ' ' + noun + ' in ' + b.city + ', every one inspected';
      $('#fd-prev-chat').textContent = 'Ask ' + (has ? b.name : 'your showroom');
    }
    f.addEventListener('input', function () { err.textContent = ''; nm.removeAttribute('aria-invalid'); paint(); }); f.addEventListener('change', paint); paint();
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var b = R.setBrand(read());
      if (!b) { err.textContent = 'Type your showroom’s name first, two letters or more.'; nm.setAttribute('aria-invalid', 'true'); nm.focus(); return; }
      location.href = 'showroom.html';
    });
  })();

  /* ---------- the three screens: tabs, arrow keys, and a slow turn of their own until someone picks one ---------- */
  (function () {
    var v = $('#fd-view'); if (!v) return; var tabs = [].slice.call(v.querySelectorAll('[role=tab]')), panes = [].slice.call(v.querySelectorAll('.fd-pane')), url = $('#fd-url'), U = ['money', 'deals and papers', 'appraisals'], cur = 0, timer = 0;
    function show(i, focus) { cur = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) { var on = k === cur; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; panes[k].hidden = !on; panes[k].classList.toggle('on', on); });
      if (url) url.textContent = 'dealer app · ' + U[cur]; if (focus) tabs[cur].focus(); }
    function stop() { clearInterval(timer); timer = 0; v.classList.add('picked'); }
    tabs.forEach(function (t, k) { t.addEventListener('click', function () { stop(); show(k); });
      t.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); stop(); show(cur + 1, true); } if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); stop(); show(cur - 1, true); } }); });
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && matchMedia('(min-width: 981px)').matches) timer = setInterval(function () { if (document.hidden) return; show(cur + 1); }, 5200);
  })();

  /* ---------- the yard calculator ---------- */
  var calc = $('#calc'), out = $('#calc-out');
  if (calc && out) {
    var draw = function () {
      var f = new FormData(calc), n = Math.max(1, num(f.get('n'))), p = Math.max(0.5, num(f.get('p'))) * 1e5, d = Math.max(5, num(f.get('d'))), e = num(f.get('e')), lost = Math.min(100, num(f.get('l'))) / 100;
      var locked = n * p * 0.88, holdMonth = locked * 0.12 / 12 + n * 70 * 30, freed = locked * 0.25, saved = holdMonth * 0.25;
      var recovered = e * lost * 0.5 * 0.06, extra = recovered * p * 0.08, year = (saved + extra) * 12;
      out.innerHTML = '<div><span class="l">Money in your stock</span><span class="v">' + R.inr(locked) + '</span><span class="s">' + n + ' vehicles at about ' + R.inr(p) + ', at cost</span></div>' +
        '<div><span class="l">Holding it costs</span><span class="v">' + R.inr(holdMonth) + '</span><span class="s">a month in money tied up and yard space, at ' + Math.round(d) + ' days to sell</span></div>' +
        '<div><span class="l">Sell 25% faster</span><span class="v">' + R.inr(saved) + '</span><span class="s">a month saved, and ' + R.inr(freed) + ' freed to buy more stock</span></div>' +
        '<div><span class="l">Call back half the lost enquiries</span><span class="v">' + R.inr(extra) + '</span><span class="s">a month: about ' + recovered.toFixed(1) + ' more sales at an 8% margin</span></div>' +
        '<div class="tot"><span class="l">Worth a year</span><span class="v">' + R.inr(year) + '</span><span class="s">Your numbers, our assumptions. Change any box.</span></div>';
    };
    calc.addEventListener('input', draw); draw();
  }

  /* ---------- the application → admin KYC queue ---------- */
  var ap = $('#apply'), apMsg = $('#apply-msg');
  if (ap) ap.addEventListener('submit', function (e) {
    e.preventDefault(); var f = new FormData(ap), bad = null;
    ['name', 'city', 'rep', 'contact'].forEach(function (k) { var i = ap.elements[k], ok = !!String(f.get(k) || '').trim(); i.setAttribute('aria-invalid', String(!ok)); if (!ok && !bad) bad = i; });
    if (bad) { apMsg.className = 'fd-msg err'; apMsg.textContent = 'A few details are missing. The highlighted boxes need an answer.'; bad.focus(); return; }
    var name = String(f.get('name')).trim(), k = R.get(R.K.dealerKyc, null) || {}; k.status = k.status || {}; k.applicants = k.applicants || [];
    var id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) + '-' + Date.now().toString(36).slice(-4);
    k.applicants.push({ id: id, name: name, city: String(f.get('city')).trim(), area: String(f.get('area') || '').trim() || String(f.get('city')).trim(), since: new Date().getFullYear(), rating: 0, reviews: 0, focus: f.get('focus') || 'Cars', kyc: 'pending', rep: String(f.get('rep')).trim(), submitted: Date.now(), docs: { biz: 0, gst: 0, lic: 0, photos: 0, bank: 0 }, stock: num(f.get('stock')) || null, contact: String(f.get('contact')).trim(), src: 'for-dealers' });
    R.set(R.K.dealerKyc, k);
    ap.reset(); apMsg.className = 'fd-msg'; apMsg.innerHTML = 'Thank you, ' + esc(String(f.get('rep')).trim().split(' ')[0]) + '. ' + esc(name) + ' is in our review queue; we will be in touch to set up the visit. <a href="admin.html#/kyc">See it in the admin KYC queue</a>.';
  });

  /* ---------- finance pre-approval → a lead ---------- */
  var fin = $('#fin'), fo = $('#fin-out');
  if (fin) {
    var ls = R.listings().filter(function (l) { return l.status !== 'sold'; }).sort(function (a, b) { return a.price - b.price; }), sel = $('#fin-l'), cs = $('#fin-c'), pre = new URLSearchParams(location.search).get('id');
    sel.innerHTML += ls.map(function (l) { return '<option value="' + esc(l.id) + '"' + (l.id === pre ? ' selected' : '') + '>' + esc(R.title(l)) + ' · ' + R.inr(l.price) + '</option>'; }).join('');
    var cities = R.dealers().map(function (d) { return d.city; }).filter(function (c, i, a) { return a.indexOf(c) === i; });
    cs.innerHTML = cities.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');
    var syncAmt = function () { var l = R.byId(sel.value); if (l) { fin.elements.amt.value = (Math.round(l.price * 0.8 / 1e4) / 10).toFixed(1); var dl = R.dealer(l.dealer); if (dl) cs.value = dl.city; } };
    sel.addEventListener('change', syncAmt); if (pre) syncAmt();
    fin.addEventListener('submit', function (e) {
      e.preventDefault(); var f = new FormData(fin), bad = null;
      ['name', 'contact', 'amt'].forEach(function (k) { var i = fin.elements[k], ok = k === 'amt' ? num(f.get(k)) > 0 : !!String(f.get(k) || '').trim(); i.setAttribute('aria-invalid', String(!ok)); if (!ok && !bad) bad = i; });
      if (bad) { bad.focus(); return; }
      var amt = num(f.get('amt')) * 1e5, n = +f.get('months'), inc = +f.get('inc'), emp = f.get('emp'), rate = emp === 'Salaried' ? 10.5 : 11.75, maxEmi = inc * (emp === 'Salaried' ? 0.5 : 0.42), rm = rate / 1200;
      var cap = Math.floor(maxEmi * (1 - Math.pow(1 + rm, -n)) / rm / 1e4) * 1e4, ok = amt <= cap, emi = R.emi(Math.min(amt, cap), rate, n), l = R.byId(f.get('listing')), city = f.get('city');
      var dealer = l ? l.dealer : (R.dealers().filter(function (d) { return d.city === city; })[0] || R.dealers()[0]).id;
      var lead = R.addLead({ listing: l ? l.id : undefined, dealer: dealer, name: String(f.get('name')).trim(), phone: String(f.get('contact')).trim(), kind: 'enquiry', src: 'Finance', keepDealer: true, msg: 'Finance pre-approval: ' + R.inr(amt) + ' over ' + n + ' months · ' + emp.toLowerCase() + ' · ' + (l ? 'for the ' + R.title(l) : 'no vehicle chosen yet') + ' · likely limit ' + R.inr(cap) });
      var by = new Date(Date.now() + 864e5); by.setHours(18, 0, 0, 0);
      fo.innerHTML = '<h2 class="pg-h2">' + (ok ? 'Likely approved' : 'A smaller loan is likely') + '</h2><div class="fin-res"><div class="' + (ok ? 'ok' : '') + '"><span class="l">You could borrow up to</span><span class="v">' + R.inr(cap) + '</span><span class="s">at ' + rate + '% to ' + (rate + 1.5) + '% a year, ' + esc(emp.toLowerCase()) + '</span></div><div><span class="l">Monthly payment</span><span class="v">' + R.inrFull(emi) + '</span><span class="s">for ' + R.inr(Math.min(amt, cap)) + ' over ' + n + ' months</span></div>' + (ok ? '' : '<div><span class="s">' + R.inr(amt - cap) + ' more than partners usually lend on this income. A larger down payment, or a co-applicant, closes the gap.</span></div>') + '</div>' +
        '<p class="pg-p">A partner bank replies by <b>' + by.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }) + ', 6 pm</b>. Your reference is <b>' + esc(lead.id) + '</b>; ' + esc(R.dealer(dealer).name) + ' has it too' + (l ? ' and can hold the ' + esc(l.make + ' ' + l.model) + ' while you decide' : '') + '.</p>' + (l ? '<a class="btn sm" href="vehicle.html?id=' + encodeURIComponent(l.id) + '">Back to the ' + esc(l.make + ' ' + l.model) + ' <span class="ar" aria-hidden="true">→</span></a>' : '<a class="btn sm" href="listings.html">Find a vehicle <span class="ar" aria-hidden="true">→</span></a>');
      fo.focus && fo.setAttribute('tabindex', '-1'); fo.focus();
    });
  }
})();
