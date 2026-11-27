/* Atelier Nori studio desk: additions on top of the desk (staff.js is not edited).
   · Home opens on the studio's day in its own words, then the tables visitors have laid on the website.
   · A lead that came with a wall colour and materials shows that table on its record.
   · Leads from the website forms say so, instead of "Website chat". */
(function () {
  'use strict';
  var C = window.DESK, O = window.Orbit; if (!C || !O) return;
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var WALL = { 'Bare lime': '#E6DFD2', 'Rice paper': '#D9C8AC', 'Hill sage': '#A3B096', 'Turmeric': '#C9A24E', 'Kiln clay': '#C2917A', 'Monsoon': '#8D9AA6', 'Indigo vat': '#44566B', 'Sumi': '#3A332E' };
  var MAT = { 'Pale oak': ['#D3B48C', '#BE9D74'], 'Smoked walnut': ['#5E483B', '#473528'], 'Undyed linen': ['#DDD3C0', '#CFC3AD'], 'Kota stone': ['#7E8C86', '#69776F'], 'Brushed brass': ['#D9BC78', '#A8843C'], 'Terrazzo': ['#DAD3C6', '#C9C1B3'], 'Oak strip block': ['#8E6B40', '#775733'], 'Limed ash': ['#CFC4B8', '#BDB1A4'] };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function ago(t) { var m = Math.max(1, Math.round((Date.now() - t) / 6e4)); return m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; }
  function statuses() { try { return (JSON.parse(localStorage.getItem('desk-' + C.agent)) || {}).st || {}; } catch (e) { return {}; } }
  function key(l) { var p = l.payload || {}; return p.convo || ('L' + l.timestamp + l.name); }
  function mine() { return O.leads.list().filter(function (l) { return l.agent === C.agent; }); }
  function laid(l) { var p = l.payload || {}; return !!(p.wall || (p.tray && p.tray.length)); }
  function wallName(p) { return String(p.wall || '').replace(/^N-\d+\s*/, ''); }
  function tables() { var seen = {}; return mine().filter(laid).sort(function (a, b) { return Date.parse(b.timestamp) - Date.parse(a.timestamp); }).filter(function (l) { var k = (l.name || '') + '|' + (l.email || l.phone || ''); if (seen[k]) return false; seen[k] = 1; return true; }); }

  /* the table as the visitor left it: the wall they chose, painted on a board, and the samples they kept */
  var cache = {};
  function picture(l) {
    var p = l.payload || {}, k = key(l); if (cache[k]) return cache[k];
    var c = document.createElement('canvas'), W = 480, H = 300; c.width = W; c.height = H; var x = c.getContext('2d'); if (!x) return '';
    x.fillStyle = '#A8825F'; x.fillRect(0, 0, W, H); x.globalAlpha = .1; for (var i = 0; i < 46; i++) { x.fillStyle = i % 3 ? '#5A3E28' : '#E9CFAE'; x.fillRect(0, (i * 53) % H, W, 1 + (i % 3)); } x.globalAlpha = 1;
    var wc = WALL[wallName(p)] || '#E6DFD2';
    x.save(); x.shadowColor = 'rgba(30,18,8,.45)'; x.shadowBlur = 14; x.shadowOffsetY = 6; x.fillStyle = '#ECE5D9'; x.fillRect(28, 34, 210, 150); x.restore();
    x.fillStyle = wc; x.fillRect(28, 34, 210, 150); x.globalAlpha = .1; for (i = 0; i < 26; i++) { x.fillStyle = i % 2 ? '#000' : '#fff'; x.fillRect(28, 34 + i * 5.8, 210, 1.4); } x.globalAlpha = 1;
    x.fillStyle = '#F4EFE6'; x.fillRect(28, 196, 150, 34); x.fillStyle = '#1F1B17'; x.font = '600 13px sans-serif'; x.fillText(p.wall || 'No wall chosen', 38, 218);
    (p.tray || []).slice(0, 5).forEach(function (name, j) { var m = MAT[name] || ['#CCC', '#AAA'], w = 86, h = 104, px = 262 + (j % 3) * 66, py = 40 + Math.floor(j / 3) * 92 + (j % 2) * 10;
      x.save(); x.shadowColor = 'rgba(30,18,8,.45)'; x.shadowBlur = 10; x.shadowOffsetY = 5; var g = x.createLinearGradient(px, py, px + w, py + h); g.addColorStop(0, m[0]); g.addColorStop(1, m[1]); x.fillStyle = g; x.fillRect(px, py, w, h); x.restore(); });
    return (cache[k] = c.toDataURL('image/jpeg', .86));
  }
  function caption(l) { var p = l.payload || {}; return [wallName(p), (p.tray || []).slice(0, 4).join(', ').toLowerCase()].filter(Boolean).join(' · '); }

  /* the day's headline, in the studio's words */
  function headline() {
    var S = statuses(), T = {}, Q = {};
    mine().forEach(function (l) { if ((S[key(l)] || 'new') !== 'new') return; var who = (l.name || '') + '|' + (l.email || l.phone || ''); if (laid(l)) T[who] = 1; else if (l.intent === 'enquiry' || l.intent === 'estimate') Q[who] = 1; });
    var t = Object.keys(T).length, q = Object.keys(Q).filter(function (w) { return !T[w]; }).length;
    var k = document.querySelector('.kpi[href="#/bookings"] .v'), ahead = k ? parseInt(k.textContent, 10) || 0 : 0;
    var parts = [DAYS[new Date().getDay()], ahead ? plural(ahead, 'consultation ahead', 'consultations ahead') : 'no consultations booked'];
    if (t) parts.push(plural(t, 'table to answer', 'tables to answer')); if (q) parts.push(plural(q, 'first number sent', 'first numbers sent'));
    return parts.join(' · ');
  }
  function tablesCard() {
    var B = tables(); if (!B.length) return '';
    return '<section class="card x-boards"><header><h2>Laid on the website’s table</h2><span class="sub">' + B.length + '</span></header><div class="x-bgrid">' + B.slice(0, 3).map(function (l) {
      return '<a href="#/leads/' + encodeURIComponent(key(l)) + '"><img src="' + picture(l) + '" width="480" height="300" alt="' + esc('What ' + l.name + ' chose: ' + caption(l)) + '"><b>' + esc(l.name) + '</b><small>' + esc(caption(l)) + ' · ' + ago(Date.parse(l.timestamp)) + '</small></a>';
    }).join('') + '</div></section>';
  }
  /* the record: their table above "What happened", and the true channel */
  function patchRecord(so) {
    so.setAttribute('data-x', '1');
    var h = location.hash.replace(/^#\/?/, '').split('?')[0].split('/'); if (h[0] !== 'leads' || !h[1]) return;
    var k; try { k = decodeURIComponent(h[1]); } catch (e) { k = h[1]; }
    var L = mine().filter(function (l) { return key(l) === k; }); if (!L.length) return;
    if (L.every(function (l) { return /^Website form$/.test(l.source || ''); })) [].forEach.call(so.querySelectorAll('.f-grid > div'), function (d) { var s = d.querySelector('span'), b = d.querySelector('b'); if (s && b && s.textContent === 'Channel') b.textContent = 'Website form'; });
    var t = L.filter(laid).pop(); if (!t) return;
    var at = [].filter.call(so.querySelectorAll('.so-b h3'), function (x) { return /^What happened/.test(x.textContent); })[0]; if (!at) return;
    var p = t.payload || {};
    at.insertAdjacentHTML('beforebegin', '<h3>What they laid on the table</h3><figure class="x-tray"><img src="' + picture(t) + '" width="480" height="300" alt="' + esc(t.name + ' chose ' + caption(t)) + '"><figcaption>' + esc(caption(t)) + '. Have these out before they arrive.' + (p.note ? '<q>' + esc(p.note) + '</q>' : '') + '</figcaption></figure>');
  }
  var css = document.createElement('style');
  css.textContent = '.x-boards{margin:0 0 18px}.x-bgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;padding:4px 16px 16px}.x-bgrid a{display:grid;gap:4px;font-size:13px;color:inherit;text-decoration:none}.x-bgrid img,.x-tray img{width:100%;height:auto;border-radius:2px;display:block;box-shadow:0 10px 18px -12px rgba(20,12,6,.6)}.x-bgrid a:hover img{outline:2px solid currentColor;outline-offset:2px}.x-bgrid small,.x-tray figcaption{color:var(--mute,#6b6b6b);font-size:12.5px;line-height:1.45}.x-tray{margin:0 0 8px;display:grid;gap:8px}.x-tray q{display:block;margin-top:6px;color:var(--ink,#1F1B17);quotes:"“" "”"}@media(max-width:700px){.x-bgrid{grid-template-columns:1fr 1fr}.x-bgrid a:nth-child(3){display:none}}';
  document.head.appendChild(css);
  function sweep() {
    var h1 = document.querySelector('.hello h1:not([data-x])');
    if (h1) { h1.setAttribute('data-x', '1'); h1.textContent = headline(); var hello = h1.closest('.hello'); if (hello && !document.querySelector('.x-boards')) hello.insertAdjacentHTML('afterend', tablesCard()); }
    var so = document.querySelector('.so:not([data-x])'); if (so) patchRecord(so);
  }
  new MutationObserver(function (ms) {
    ms.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1 && n.classList.contains('pop')) [].forEach.call(n.querySelectorAll('button'), function (b) { if (/^Simulate a reply/.test(b.textContent.trim())) b.remove(); }); }); });
    sweep();
  }).observe(document.body, { childList: true, subtree: true });
  sweep();
})();
