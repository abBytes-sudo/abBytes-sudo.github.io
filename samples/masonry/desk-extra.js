/* Ashlar & Co. desk: additions on top of the shared desk (staff.js is not edited).
   · Home opens on the yard's day in its own words, then the crews and where each one is working this week.
   · Quote requests from the website form say so, instead of "Website chat".
   · The conversation menu keeps only what an estimator would use. */
(function () {
  'use strict';
  var C = window.DESK, O = window.Orbit; if (!C || !O) return;
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], STAGES = ['Site visit', 'Drawings and fixed quote', 'Groundwork', 'The build', 'Handover'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function data(k) { try { return JSON.parse(localStorage.getItem('orbit-data-' + C.agent + '-' + k)) || []; } catch (e) { return []; } }
  function statuses() { try { return (JSON.parse(localStorage.getItem('desk-' + C.agent)) || {}).st || {}; } catch (e) { return {}; } }
  function key(l) { var p = l.payload || {}; return p.convo || ('L' + l.timestamp + l.name); }
  function mine() { return O.leads.list().filter(function (l) { return l.agent === C.agent; }); }
  // the next working day: visits are weekdays only, so on a Friday it is Monday
  function nextDay() { var d = new Date(); do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6); return [d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2), (d.getTime() - Date.now()) < 2 * 864e5 ? 'tomorrow' : 'on ' + DAYS[d.getDay()]]; }

  function headline() {
    var S = statuses(), Q = {};
    mine().forEach(function (l) { if (l.intent === 'quote_request' && (S[key(l)] || 'new') === 'new') Q[(l.name || '') + '|' + (l.email || l.phone || '')] = 1; });
    var nd = nextDay(), visits = data('visits').filter(function (v) { return v.status !== 'cancelled' && v.date === nd[0]; }).length, kits = data('kits').filter(function (k) { return k.status === 'to pack'; }).length, q = Object.keys(Q).length;
    var parts = [DAYS[new Date().getDay()], visits ? plural(visits, 'site visit ' + nd[1], 'site visits ' + nd[1]) : 'no site visits ' + nd[1]];
    if (q) parts.push(plural(q, 'quote request to call', 'quote requests to call')); if (kits) parts.push(plural(kits, 'kit to pack', 'kits to pack'));
    return parts.join(' · ');
  }
  function crews() {
    var J = data('jobs').filter(function (j) { return j.stage < STAGES.length; }); if (!J.length) return '';
    return '<section class="card x-crews"><header><h2>On the ground this week</h2><a class="sub lnk" href="#/projects">Jobs</a></header><ul>' + J.map(function (j) {
      var town = (String(j.title || '').split(', ').pop()) || '';
      return '<li><span class="x-crew">' + esc(j.crew || '') + '</span><span class="x-job"><b>' + esc(j.code) + ' · ' + esc(String(j.title || '').replace(/, [^,]+$/, '')) + '</b><small>' + esc(town) + ' · ' + esc(STAGES[j.stage] || '') + ' · next: ' + esc(String(j.next || '').toLowerCase()) + '</small></span><span class="x-bar" aria-label="' + (j.pct || 0) + '% done"><i style="width:' + Math.max(4, j.pct || 0) + '%"></i></span></li>';
    }).join('') + '</ul></section>';
  }
  function patchRecord(so) {
    so.setAttribute('data-x', '1');
    var h = location.hash.replace(/^#\/?/, '').split('?')[0].split('/'); if (h[0] !== 'leads' || !h[1]) return;
    var k; try { k = decodeURIComponent(h[1]); } catch (e) { k = h[1]; }
    var L = mine().filter(function (l) { return key(l) === k; }); if (!L.length) return;
    if (L.every(function (l) { return /^Website form$/.test(l.source || ''); })) [].forEach.call(so.querySelectorAll('.f-grid > div'), function (d) { var s = d.querySelector('span'), b = d.querySelector('b'); if (s && b && s.textContent === 'Channel') b.textContent = 'Website form'; });
    var q = L.filter(function (l) { return l.intent === 'quote_request' && l.payload && l.payload.wall; }).pop(); if (!q) return;
    var at = [].filter.call(so.querySelectorAll('.so-b h3'), function (x) { return /^What happened/.test(x.textContent); })[0]; if (!at) return;
    var p = q.payload; at.insertAdjacentHTML('beforebegin', '<h3>What they worked out on the website</h3><div class="x-wall"><span><small>Wall from the lab</small><b>' + esc(p.stone) + ' · ' + esc(p.bond) + ' · ' + esc(p.wall) + '</b></span>' + (p.est ? '<span><small>First number from the estimator</small><b>' + esc(p.est.job || '') + ', ' + (p.est.area || '') + ' sq ft · ' + C.money(p.est.lo) + ' – ' + C.money(p.est.hi) + (p.est.weeks ? ' · about ' + p.est.weeks[0] + ' to ' + p.est.weeks[1] + ' weeks' : '') + '</b></span>' : '') + '</div>');
  }

  var css = document.createElement('style');
  css.textContent = '.x-crews{margin:0 0 18px}.x-crews ul{list-style:none;margin:0;padding:0 16px 8px}.x-crews li{display:grid;grid-template-columns:150px minmax(0,1fr) 120px;gap:14px;align-items:center;padding:10px 0;border-top:1px solid var(--line)}.x-crews li:first-child{border-top:0}.x-crew{font-weight:600;font-size:13px}.x-job b{display:block;font-size:13.5px;font-weight:500}.x-job small{color:var(--mute);font-size:12px}.x-bar{height:6px;background:var(--sunk,#eee);border-radius:3px;overflow:hidden}.x-bar i{display:block;height:100%;background:var(--acc)}.x-wall{display:grid;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:6px;font-size:13px}.x-wall span{display:grid;gap:2px}.x-wall small{color:var(--mute);font-size:11.5px;letter-spacing:.04em;text-transform:uppercase}.x-wall b{font-weight:500}@media(max-width:700px){.x-crews li{grid-template-columns:1fr}.x-bar{width:100%}}';
  document.head.appendChild(css);

  function sweep() {
    var h1 = document.querySelector('.hello h1:not([data-x])');
    if (h1) { h1.setAttribute('data-x', '1'); h1.textContent = headline(); var hello = h1.closest('.hello'); if (hello && !document.querySelector('.x-crews')) hello.insertAdjacentHTML('afterend', crews()); }
    var so = document.querySelector('.so:not([data-x])'); if (so) patchRecord(so);
  }
  new MutationObserver(function (ms) {
    ms.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1 && n.classList.contains('pop')) [].forEach.call(n.querySelectorAll('button'), function (b) { if (/^Simulate a reply/.test(b.textContent.trim())) b.remove(); }); }); });
    sweep();
  }).observe(document.body, { childList: true, subtree: true });
  sweep();
})();
