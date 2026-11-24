/* Aaranya · brochure download, site-visit booking (slots with capacity) and the NRI desk. All land in the back office. */
(function () {
  'use strict';
  var A = window.AAR, $ = A.$, $$ = A.$$;
  var arrow = '<span class="ar" aria-hidden="true">→</span>';

  function doneCard(host, form, o) {
    form.hidden = true; host.hidden = false;
    host.innerHTML = '<div class="done" tabindex="-1"><span class="tick" aria-hidden="true">✓</span><h2>' + o.h + '</h2><p>' + o.p + '</p>' + (o.ref ? '<p class="ref">' + o.ref + '</p>' : '') + '<div style="display:flex;gap:8px;flex-wrap:wrap">' + o.acts + '</div></div>';
    var d = host.querySelector('.done'); d.focus({ preventScroll: true }); d.scrollIntoView({ behavior: A.reduce ? 'auto' : 'smooth', block: 'center' });
  }

  /* ---------- brochure ---------- */
  var bform = $('#bform');
  if (bform) A.bindLead(bform, {
    source: 'Brochure download',
    done: function (lead) {
      var a = document.createElement('a'); a.href = 'aaranya-brochure.pdf'; a.download = 'Aaranya-Residences-brochure.pdf'; document.body.appendChild(a); a.click(); a.remove();
      doneCard($('#bdone'), bform, { h: 'Your brochure is downloading.', p: 'Thank you, ' + A.esc(lead.name.split(' ')[0]) + '. If it didn\'t start, <a class="link" href="aaranya-brochure.pdf" download>download it here</a>. When the price list changes, you\'ll hear from us first.',
        acts: '<a class="btn" href="visit.html">Book a site visit ' + arrow + '</a><a class="btn ghost" href="picker.html">Open the unit picker</a>' });
    }
  });

  /* ---------- site visit ---------- */
  var vform = $('#vform');
  if (vform) {
    var V = { mode: 'lounge', day: null, slot: null };
    var today = A.dayStart(Date.now()), days = $('#days'), slots = $('#slots');
    var unitQ = A.qs('unit');
    function slotFree(key) { var cap = V.mode === 'video' ? 2 : A.SLOT_CAP; var used = A.visits().filter(function (v) { return v.slot === key && (V.mode === 'video' ? v.mode === 'video' : v.mode !== 'video'); }).length; return cap - used; }
    function renderDays() {
      var html = '';
      for (var i = 0; i < 14; i++) {
        var d = today + i * A.DAY, dt = new Date(d), free = 0;
        A.SLOTS.forEach(function (s) { var k = A.slotKey(d, s); if (A.slotTime(k) > Date.now() + 36e5) free += Math.max(0, slotFree(k)); });
        if (V.day == null && free > 0) V.day = d;
        html += '<button type="button" class="day" data-d="' + d + '" aria-pressed="' + (V.day === d) + '"' + (free ? '' : ' disabled') + '><span class="vh">' + A.fmtDay(d, { weekday: 'long', day: 'numeric', month: 'long' }) + '</span><small>' + (i === 0 ? 'Today' : i === 1 ? 'Tmrw' : dt.toLocaleDateString('en-IN', { weekday: 'short' })) + '</small><b>' + dt.getDate() + '</b><em>' + (free ? (dt.getDay() === 0 || dt.getDay() === 6 ? 'busy' : free + ' left') : 'full') + '</em></button>';
      }
      days.innerHTML = html;
      renderSlots();
    }
    function renderSlots() {
      slots.innerHTML = A.SLOTS.map(function (s) {
        var k = A.slotKey(V.day, s), left = slotFree(k), past = A.slotTime(k) < Date.now() + 36e5;
        var dis = past || left <= 0;
        if (V.slot === k && dis) V.slot = null;
        return '<button type="button" class="slot" data-k="' + k + '" aria-pressed="' + (V.slot === k) + '"' + (dis ? ' disabled' : '') + '><b>' + A.fmtTime(A.slotTime(k)) + '</b><span' + (left === 1 && !past ? ' class="low"' : '') + '>' + (past ? 'passed' : left <= 0 ? 'full' : left === 1 ? 'last place' : left + ' places') + '</span></button>';
      }).join('');
    }
    days.addEventListener('click', function (e) { var b = e.target.closest('.day'); if (!b || b.disabled) return; V.day = +b.dataset.d; V.slot = null; $$('.day', days).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); renderSlots(); });
    slots.addEventListener('click', function (e) { var b = e.target.closest('.slot'); if (!b || b.disabled) return; V.slot = b.dataset.k; $$('.slot', slots).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); $('#slot-msg').textContent = ''; });
    $$('#modes .mode').forEach(function (b) { b.addEventListener('click', function () { V.mode = b.dataset.m; $$('#modes .mode').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); V.day = null; renderDays(); }); });
    var steps = $$('#vsteps span');
    function step(n) {
      $('#vstep1').hidden = n !== 1; $('#vstep2').hidden = n !== 2; steps.forEach(function (s, i) { s.classList.toggle('on', i < n); });
      if (n === 2) { $('#vsum').textContent = ({ lounge: 'Sales lounge', pickup: 'Pickup from the metro', video: 'Video walkthrough' })[V.mode] + ' · ' + A.slotLabel(V.slot) + (V.mode === 'video' ? ' IST' : ''); $('#v-name').focus(); }
    }
    $('#vnext').addEventListener('click', function () { if (!V.slot) { $('#slot-msg').textContent = 'Pick a time that suits you; greyed-out slots are full.'; $('#slots').closest('.field').classList.add('err'); return; } $('#slots').closest('.field').classList.remove('err'); step(2); });
    $('#vback').addEventListener('click', function () { step(1); });
    if (unitQ && A.unit(unitQ)) { var vu = $('#v-unit'); if (vu) vu.value = unitQ; }
    A.bindLead(vform, {
      source: 'Site-visit booking',
      done: function (lead, d) {
        var unit = (d.unit || '').toUpperCase().trim(); if (!A.unit(unit)) unit = null;
        if (unit && lead.unit !== unit) { var ls = A.leads(); ls[0].unit = unit; A.saveLeads(ls); }
        var v = A.addVisit({ lead: lead.id, name: lead.name, unit: unit, slot: V.slot, mode: V.mode, party: d.party, source: 'Site-visit booking', note: d.message || '' });
        var ls2 = A.leads(); ls2[0].stage = 'visit'; ls2[0].next = A.slotTime(V.slot); ls2[0].log.push({ t: Date.now(), k: 'visit', s: 'Booked a ' + ({ lounge: 'lounge visit', pickup: 'visit with metro pickup', video: 'video walkthrough' })[V.mode] + ' for ' + A.slotLabel(V.slot) }); A.saveLeads(ls2);
        var start = new Date(A.slotTime(V.slot)), end = new Date(start.getTime() + 75 * 6e4);
        var f = function (x) { return x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
        var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Aaranya Residences//EN', 'BEGIN:VEVENT', 'UID:' + v.id + '@aaranya.example', 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(start), 'DTEND:' + f(end), 'SUMMARY:Aaranya Residences site visit', 'LOCATION:Aaranya sales lounge, Sector 109, Dwarka Expressway, Gurugram', 'DESCRIPTION:Your relationship manager is ' + A.member(v.rm).name + '.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
        var url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
        doneCard($('#vdone'), vform, { h: 'See you on ' + A.fmtDay(start, { weekday: 'long', day: 'numeric', month: 'short' }) + '.',
          p: A.fmtTime(start) + (V.mode === 'video' ? ' IST, on a video call' : V.mode === 'pickup' ? ', pickup at Dwarka Sector 21 metro, gate 2' : ' at the sales lounge') + '. ' + A.member(v.rm).name + ' will look after you' + (unit ? ' and will have ' + unit + ' open on the big screen' : '') + '. A reminder goes out the evening before.',
          ref: 'Booking ' + v.id + ' · confirmation on WhatsApp the evening before', acts: '<a class="btn" href="' + url + '" download="aaranya-visit.ics">Add to calendar ' + arrow + '</a><a class="btn ghost" href="picker.html' + (unit ? '?unit=' + unit : '') + '">Keep exploring homes</a>' });
        $$('#vsteps span').forEach(function (s) { s.classList.add('on'); });
      }
    });
    // custom submit validation also needs the slot
    renderDays();
  }

  /* ---------- NRI desk ---------- */
  var tz = $('#tz');
  if (tz) {
    var Z = [['Dubai / Abu Dhabi', 4, 'AED', 24.1], ['Singapore', 8, 'SGD', 66.2], ['London', 0, 'GBP', 112.4], ['New York / Toronto', -5, 'USD', 88.6], ['San Francisco', -8, 'USD', 88.6], ['Sydney', 11, 'AUD', 57.6], ['Doha', 3, 'QAR', 24.3], ['Frankfurt', 1, 'EUR', 96.2]];
    tz.innerHTML = Z.map(function (z, i) { return '<option value="' + i + '">' + z[0] + ' (UTC' + (z[1] >= 0 ? '+' : '') + z[1] + ')</option>'; }).join('');
    var saved = A.get('nri-tz', 0); tz.value = saved;
    function paintTz() {
      var z = Z[+tz.value], off = z[1] - 5.5, cells = '', open = [];
      for (var h = 0; h < 24; h++) {
        var ist = ((h - off) % 24 + 24) % 24, desk = ist >= 9 && ist < 21, awake = h >= 8 && h < 22;
        var cls = desk && awake ? 'open' : awake ? 'day' : 'night';
        if (desk && awake) open.push(h);
        cells += '<i class="' + cls + '"></i>';
      }
      $('#tzstrip').innerHTML = cells;
      var fmt = function (h) { return String(Math.floor(h)).padStart(2, '0') + ':' + (h % 1 ? '30' : '00'); };
      $('#tzout').innerHTML = open.length ? 'Best time to call from <b>' + z[0] + '</b>: <b>' + fmt(open[0]) + '–' + fmt(open[open.length - 1] + 1) + '</b> your time, which is ' + fmt(((open[0] - off) % 24 + 24) % 24) + '–' + fmt(((open[open.length - 1] + 1 - off) % 24 + 24) % 24) + ' in Gurugram. Weekend video slots run 08:00–23:00 IST.' : 'Our hours barely overlap with yours, so the desk opens weekend video slots from 06:00 to 23:00 IST. Ask for one below.';
      var cur = z[2], rate = z[3];
      var items = ['A', 'B', 'C', 'D'].map(function (k) { var m = A.minPrice(k); return [A.TYPES[k].short + ' from', m]; });
      items.push(['Hold a home (EOI)', 100000]); items.push(['Club membership', A.CHARGES.club]);
      $('#fx').innerHTML = items.map(function (it) { var v = it[1] ? Math.round(it[1] / rate) : null; return '<div><span>' + it[0] + '</span><b>' + (v ? cur + ' ' + (v >= 1e6 ? (v / 1e6).toFixed(2) + ' M' : v.toLocaleString('en-US')) : 'Sold out') + '</b><span>' + (it[1] ? A.inr(it[1]) : '') + '</span></div>'; }).join('');
      A.set('nri-tz', +tz.value);
    }
    tz.addEventListener('change', paintTz); paintTz();
    // paperwork checklist
    var docs = A.get('nri-docs', {}), list = $('#docs');
    function paintDocs() { $$('[data-k]', list).forEach(function (li) { li.classList.toggle('ok', !!docs[li.dataset.k]); li.setAttribute('aria-checked', String(!!docs[li.dataset.k])); }); }
    $$('[data-k]', list).forEach(function (li) { li.setAttribute('role', 'checkbox'); li.tabIndex = 0; li.style.cursor = 'pointer'; });
    var tog = function (li) { docs[li.dataset.k] = !docs[li.dataset.k]; A.set('nri-docs', docs); paintDocs(); var n = Object.keys(docs).filter(function (k) { return docs[k]; }).length; A.toast(n + ' of 6 ready' + (n === 6 ? '. You have everything; Farah can start the paperwork.' : '.')); };
    list.addEventListener('click', function (e) { var li = e.target.closest('[data-k]'); if (li) tog(li); });
    list.addEventListener('keydown', function (e) { var li = e.target.closest('[data-k]'); if (li && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); tog(li); } });
    paintDocs();
    var nform = $('#nform');
    A.bindLead(nform, {
      source: 'NRI desk', nri: true,
      done: function (lead, d) {
        var z = Z[+tz.value];
        doneCard($('#ndone'), nform, { h: 'Farah will write to you today.', p: 'She\'ll suggest three walkthrough times that work in ' + A.esc(d.city || z[0]) + ', and send the NRI payment note and a draft power of attorney with it.', ref: 'Request ' + lead.id,
          acts: '<a class="btn light" href="picker.html">Shortlist homes meanwhile ' + arrow + '</a>' });
      }
    });
  }
})();
