/* Sthira · services, projects, case study, process, contact and legal pages (each block runs only if its markup exists). */
(function () {
  'use strict';
  var D = window.STHIRA, A = window.App, $ = A.$, $$ = A.$$, esc = A.esc;
  var TYPES = { residential: 'Residential', commercial: 'Commercial', interiors: 'Interiors fit-out', turnkey: 'Turnkey' };
  var IMG = { residential: 'home-1', commercial: 'office-2', interiors: 'fitout-office', turnkey: 'home-2' };
  var params = new URLSearchParams(location.search);
  function srcset(n) { return 'photos/' + n + '-s.jpg 720w, photos/' + n + '-m.jpg 1080w, photos/' + n + '.jpg 1800w'; }
  function baHTML(p, alt, first) {
    var ld = first ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"';
    return '<div class="ba" data-ba style="aspect-ratio:16/10;--x:50%"><img src="photos/ba-' + p.id + '-b.jpg" srcset="photos/ba-' + p.id + '-b-s.jpg 800w, photos/ba-' + p.id + '-b.jpg 1600w" sizes="(max-width:900px) 100vw, 58vw" alt=""' + esc(p.name + ' at handover') + '" ' + ld + ' width="1600" height="1000">' +
      '<div class="ba-a"><img src="photos/ba-' + p.id + '-a.jpg" srcset="photos/ba-' + p.id + '-a-s.jpg 800w, photos/ba-' + p.id + '-a.jpg 1600w" sizes="(max-width:900px) 100vw, 58vw" alt=""' + esc(p.name + ' during construction') + '" ' + ld + ' width="1600" height="1000"></div>' +
      '<span class="ba-tag l">During</span><span class="ba-tag r">Handover</span><span class="ba-line"></span><span class="ba-knob" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#121417" stroke-width="1.8"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg></span>' +
      '<input type="range" min="0" max="100" value="50" aria-label="' + esc(alt || 'Compare ' + p.name + ' during construction with handover') + '"></div>';
  }

  // ---------- services ----------
  var sb = $('#svc-blocks');
  if (sb && !sb.children.length) sb.innerHTML = D.SERVICES.map(function (s) {
    return '<article class="svc-block" id="' + s.id + '" aria-labelledby="h-' + s.id + '"><figure class="fig" data-clip><img src="photos/' + IMG[s.id] + '.jpg" srcset="' + srcset(IMG[s.id]) + '" sizes="(max-width:900px) 100vw, 50vw" alt="" loading="lazy" decoding="async" width="1800" height="1200"></figure>' +
      '<div class="txt"><span class="idx">' + s.n + ' / 04</span><h2 id="h-' + s.id + '">' + esc(s.name) + '</h2><p>' + esc(s.body) + '</p>' +
      '<dl class="kv"><div><dt>From</dt><dd>' + esc(s.from) + '</dd></div><div><dt>Typical programme</dt><dd>' + esc(s.time) + '</dd></div></dl>' +
      '<ul class="ticks">' + s.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>' +
      '<p style="margin-top:28px;display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="contact.html?type=' + s.id + '">Start a ' + esc(s.name.toLowerCase()) + ' project <span class="ar" aria-hidden="true">→</span></a><a class="btn ghost" href="projects.html?f=' + s.id + '">See examples</a></p></div></article>';
  }).join('');

  // ---------- projects list ----------
  var pl = $('#plist');
  if (pl) {
    var f = params.get('f') || 'all', c = 'all';
    var render = function () {
      var list = D.PROJECTS.filter(function (p) { return (f === 'all' || p.type === f) && (c === 'all' || p.city === c); });
      $('#pcount').textContent = list.length + (list.length === 1 ? ' project' : ' projects');
      $('#pempty').hidden = list.length > 0;
      pl.innerHTML = list.map(function (p, i) {
        return '<article class="prow" aria-labelledby="pr-' + p.id + '">' + baHTML(p) +
          '<div class="prow-t"><p class="k">' + String(i + 1).padStart(2, '0') + ' · ' + TYPES[p.type] + ' · ' + p.year + '</p><h2 id="pr-' + p.id + '"><a href="project-' + p.id + '.html">' + esc(p.name) + '</a></h2><p class="tag">' + esc(p.tag) + '</p>' +
          '<dl class="kv"><div><dt>Location</dt><dd>' + esc(p.loc + ', ' + p.city) + '</dd></div><div><dt>Area</dt><dd>' + p.area.toLocaleString('en-IN') + ' sq ft</dd></div><div><dt>Floors</dt><dd>' + esc(p.floors) + '</dd></div><div><dt>Duration</dt><dd>' + (p.months < 3 ? Math.round(p.months * 4.3) + ' weeks' : p.months + ' months') + '</dd></div></dl>' +
          '<a class="prow-ph" href="project-' + p.id + '.html"><img src="photos/' + p.photo + '-s.jpg" alt="' + esc(p.name + ', photographed after handover') + '" loading="lazy" decoding="async" width="720" height="480"><span class="lnk">Read the case study <span class="ar" aria-hidden="true">→</span></span></a></div></article>';
      }).join('');
      $$('[data-ba]', pl).forEach(A.initBA);
      $$('#pf button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.f === f); });
      $$('#pc button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.c === c); });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };
    $('#pf').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; f = b.dataset.f; render(); history.replaceState(null, '', f === 'all' ? 'projects.html' : '?f=' + f); });
    $('#pc').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; c = b.dataset.c; render(); });
    $('#preset').addEventListener('click', function () { f = 'all'; c = 'all'; render(); });
    render();
  }

  // ---------- case study ----------
  if ($('#cs')) {
    var id = $('#cs').dataset.id || params.get('id'), P = D.PROJECTS, idx = Math.max(0, P.findIndex(function (p) { return p.id === id; })), p = P[idx];
    document.title = p.name + ' · case study · Sthira Design-Build';
    $('#cs-img').src = 'photos/' + p.photo + '.jpg'; $('#cs-img').srcset = srcset(p.photo); $('#cs-img').sizes = '100vw'; $('#cs-img').alt = p.name + ', ' + p.loc + ', ' + p.city;
    $('#cs-k').textContent = TYPES[p.type] + ' · ' + p.loc + ', ' + p.city + ' · ' + p.year;
    $('#cs-h').innerHTML = esc(p.name);
    $('#cs-facts').innerHTML = p.facts.map(function (x) { return '<div><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>'; }).join('');
    $('#cs-sum').textContent = p.summary; $('#cs-ch').textContent = p.challenge; $('#cs-so').textContent = p.solution;
    $('#cs-bb').src = 'photos/ba-' + p.id + '-b.jpg'; $('#cs-bb').srcset = 'photos/ba-' + p.id + '-b-s.jpg 800w, photos/ba-' + p.id + '-b.jpg 1600w'; $('#cs-bb').sizes = '100vw'; $('#cs-bb').alt = p.name + ' at handover, from the gate camera';
    $('#cs-ba-a').src = 'photos/ba-' + p.id + '-a.jpg'; $('#cs-ba-a').srcset = 'photos/ba-' + p.id + '-a-s.jpg 800w, photos/ba-' + p.id + '-a.jpg 1600w'; $('#cs-ba-a').sizes = '100vw'; $('#cs-ba-a').alt = p.name + ' during construction, from the gate camera';
    $('#cs-gal').innerHTML = p.gallery.map(function (g, i) { return '<figure class="fig" data-clip><img src="photos/' + g + '.jpg" srcset="' + srcset(g) + '" sizes="(max-width:760px) 100vw, 60vw" alt="" loading="lazy" decoding="async" width="1800" height="1200"></figure>'; }).join('');
    $('#cs-q').textContent = '“' + p.quote[0] + '”'; $('#cs-qb').textContent = p.quote[1];
    var n = P[(idx + 1) % P.length]; $('#cs-next').href = 'project-' + n.id + '.html'; $('#cs-nn').innerHTML = esc(n.name) + ' <span class="ser">→</span>';
  }

  // drawing-set tabs (plan / elevation / photograph)
  var dtabs = $$('.dset-tabs [role=tab]');
  if (dtabs.length) {
    var pick = function (t) {
      dtabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; });
      var k = t.id.replace('dt-', ''); $$('#dset figure').forEach(function (f) { f.classList.toggle('on', f.dataset.k === k); });
      $('#dset').setAttribute('aria-labelledby', t.id); $('#dset .mark').hidden = k !== 'plan';
    };
    $('.dset-tabs').addEventListener('click', function (e) { var t = e.target.closest('[role=tab]'); if (t) pick(t); });
    $('.dset-tabs').addEventListener('keydown', function (e) {
      var i = dtabs.indexOf(document.activeElement); if (i < 0 || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
      e.preventDefault(); var n = (i + (e.key === 'ArrowRight' ? 1 : -1) + dtabs.length) % dtabs.length; dtabs[n].focus(); pick(dtabs[n]);
    });
  }

  // ---------- process: payment table ----------
  var pt = $('#pay-table tbody');
  if (pt) pt.innerHTML = D.PAYMENTS.map(function (m) { return '<tr><td class="idx">' + String(m.n).padStart(2, '0') + '</td><th scope="row">' + esc(m.name) + '</th><td class="num">' + m.pct + '%</td><td class="num">' + D.inr(D.LIVE.value * m.pct / 100) + '</td></tr>'; }).join('') +
    '<tr><td></td><th scope="row"><b>Total</b></th><td class="num"><b>100%</b></td><td class="num"><b>' + D.inr(D.LIVE.value) + '</b></td></tr>';

  // ---------- contact form ----------
  var fq = $('#f-enq');
  if (fq) {
    var t = params.get('type'); if (t) { var r = fq.querySelector('input[name=type][value="' + ({ residential: 'Residential', commercial: 'Commercial', interiors: 'Interiors', turnkey: 'Turnkey' }[t] || '') + '"]'); if (r) r.checked = true; }
    fq.addEventListener('submit', function (e) {
      e.preventDefault(); if (!A.validate(fq)) return;
      var d = Object.fromEntries(new FormData(fq).entries()), btn = fq.querySelector('[type=submit]');
      btn.classList.add('loading');
      setTimeout(function () {
        var l = A.addLead({ name: d.name, email: d.email, phone: d.phone, city: d.city, loc: d.loc, type: d.type, area: +d.area || null, floors: '', budget: d.budget, source: 'Website form', note: (d.msg || '').trim() || 'Prefers a call ' + d.slot.toLowerCase() + '.', slot: d.slot });
        fq.hidden = true; var done = $('#q-done'); done.hidden = false;
        $('#q-done-h').textContent = 'Thank you, ' + d.name.split(' ')[0] + '.';
        $('#q-done-p').textContent = 'Your reference is ' + l.id + '. An engineer from our ' + (d.city === 'Pune' || d.city === 'Hyderabad' ? d.city : 'Bengaluru') + ' studio will call you this ' + ({ Morning: 'morning', Afternoon: 'afternoon', Evening: 'evening' }[d.slot] || 'week') + ' to book a site survey at ' + d.loc + '.';
        done.focus(); A.toast('Enquiry <b>' + l.id + '</b> sent to the back office.');
      }, 700);
    });
  }

  // ---------- legal: highlight the section in view ----------
  var ln = $$('.legal-nav a');
  if (ln.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) ln.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + x.target.id); }); }); }, { rootMargin: '-30% 0px -60% 0px' });
    ln.forEach(function (a) { var t = $(a.getAttribute('href')); if (t) io.observe(t); });
  }
})();
