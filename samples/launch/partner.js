/* Aaranya · partner desk for channel partners: live inventory, holds for clients (the sales office approves),
   a co-branded brochure and cost sheet to print, and brokerage tracked slab by slab. Same inventory as the public picker. */
(function () {
  'use strict';
  var A = window.AAR, $ = A.$, $$ = A.$$, P = A.PARTNER;
  var inEl = $('#pd-in'), app = $('#pd-app'), body = $('#pd-body'), tabs = $$('.pd-tabs a');
  var F = { tower: '', type: '', band: '', q: '', sort: 'floor', more: 0 };

  function signedIn() { return !!A.get('partner-in', false); }
  function show() {
    var on = signedIn(); inEl.hidden = on; app.hidden = !on;
    if (on) route();
  }
  $('#pd-form').addEventListener('submit', function (e) { e.preventDefault(); A.set('partner-in', true); if (!location.hash) location.hash = '#inventory'; show(); var h = $('#pd-h'); if (h) h.focus(); });
  $('#pd-out').addEventListener('click', function () { A.set('partner-in', false); history.replaceState(null, '', location.pathname); show(); $('#pd-firm').focus(); });

  function mine() { var inv = A.inv(); return Object.keys(inv).filter(function (k) { var o = inv[k]; return o.partner === P.id && A.status(k) === 'hold'; }).map(function (k) { return { id: k, o: inv[k] }; }).sort(function (a, b) { return a.o.until - b.o.until; }); }
  function left(t) { var h = Math.max(0, Math.round((t - Date.now()) / 36e5)); return h >= 24 ? Math.floor(h / 24) + ' d ' + (h % 24) + ' h' : h + ' h'; }
  function band(f) { return f <= 12 ? '1-12' : f <= 28 ? '13-28' : '29-46'; }

  /* ---------- inventory ---------- */
  function inventory() {
    var rows = A.UNITS.filter(function (u) {
      var st = A.status(u.id); if (st === 'sold') return false;
      if (F.tower && u.tower !== F.tower) return false; if (F.type && u.type !== F.type) return false; if (F.band && band(u.floor) !== F.band) return false;
      if (F.q && (u.id + ' ' + A.TYPES[u.type].short + ' ' + u.facing + ' ' + u.view).toLowerCase().indexOf(F.q.toLowerCase()) < 0) return false;
      return true;
    }).sort(function (a, b) { return F.sort === 'price' ? A.price(a).total - A.price(b).total : F.sort === 'priced' ? A.price(b).total - A.price(a).total : (b.floor - a.floor) || (a.id < b.id ? -1 : 1); });
    var c = A.counts(), shown = rows.slice(0, 60 + F.more);
    var seg = function (k, opts) { return '<div class="seg" role="group" aria-label="' + k + '">' + opts.map(function (o) { return '<button type="button" data-f="' + k + '" data-v="' + o[0] + '" aria-pressed="' + (F[k] === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>'; };
    body.innerHTML = '<div class="pd-head"><div><h1 id="pd-h" tabindex="-1">Live inventory</h1><p>' + c.avail + ' homes open across three towers · ' + c.hold + ' on hold. The same list the sales office and the public picker see, to the second.</p></div></div>' +
      '<div class="pd-filters">' + seg('tower', [['', 'All towers']].concat(A.TOWERS.map(function (T) { return [T.id, T.name]; }))) +
      seg('type', [['', 'Any size'], ['A', '2 BHK'], ['B', '3 BHK'], ['C', '3 + study'], ['D', '4 BHK']]) +
      seg('band', [['', 'Any floor'], ['1-12', '1–12'], ['13-28', '13–28'], ['29-46', '29 +']]) +
      '<label class="pd-q"><span class="vh">Search homes</span><input class="inp" type="search" id="pd-q" placeholder="Search: A-4002, east, 4 BHK" value="' + A.esc(F.q) + '"></label>' +
      '<label class="pd-sort"><span>Sort</span><select class="inp" id="pd-sort"><option value="floor"' + (F.sort === 'floor' ? ' selected' : '') + '>Highest floor first</option><option value="price"' + (F.sort === 'price' ? ' selected' : '') + '>Lowest price first</option><option value="priced"' + (F.sort === 'priced' ? ' selected' : '') + '>Highest price first</option></select></label></div>' +
      '<p class="pd-count" aria-live="polite"><b>' + rows.length + '</b> homes match</p>' +
      '<div class="pd-tablewrap"><table class="pd-t"><caption class="vh">Homes you can hold for a client</caption><thead><tr><th scope="col">Home</th><th scope="col">Size</th><th scope="col">Floor</th><th scope="col">Facing and view</th><th scope="col" class="r">All-inclusive</th><th scope="col">Status</th><th scope="col"><span class="vh">Action</span></th></tr></thead><tbody>' +
      shown.map(function (u) {
        var st = A.status(u.id), m = A.statusMeta(u.id), ours = m && m.partner === P.id && st === 'hold', pr = A.price(u);
        var stTxt = st === 'avail' ? 'Available' : ours ? (m.pending ? 'Your hold · awaiting approval' : 'Your hold · approved') : 'On hold';
        return '<tr' + (ours ? ' class="ours"' : '') + '><th scope="row"><b>' + u.id + '</b><small>' + A.tower(u.tower).name + '</small></th><td>' + A.TYPES[u.type].short + '<small>' + A.sqft(A.TYPES[u.type].carpet) + '</small></td><td class="num">' + A.ord(u.floor) + '</td><td>' + u.facing + '<small>' + A.esc(u.view) + '</small></td><td class="r num">' + A.inr(pr.total) + '<small>' + A.inrFull(pr.rate) + '/sq ft</small></td>' +
          '<td><span class="status st-' + st + '">' + stTxt + '</span></td><td class="act">' + (st === 'avail' ? '<button type="button" class="btn sm" data-hold="' + u.id + '">Hold for a client</button>' : ours ? '<a class="tbtn" href="#print/' + u.id + '">Cost sheet</a>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      (rows.length > shown.length ? '<p class="pd-more"><button type="button" class="btn ghost" id="pd-more">Show ' + Math.min(60, rows.length - shown.length) + ' more</button></p>' : '');
    $$('[data-f]', body).forEach(function (b) { b.addEventListener('click', function () { F[b.dataset.f] = b.dataset.v; F.more = 0; inventory(); }); });
    var q = $('#pd-q'); q.addEventListener('input', function () { F.q = q.value; F.more = 0; var pos = q.selectionStart; inventory(); var n = $('#pd-q'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { } });
    $('#pd-sort').addEventListener('change', function (e) { F.sort = e.target.value; inventory(); });
    var mb = $('#pd-more'); if (mb) mb.addEventListener('click', function () { F.more += 60; inventory(); });
  }

  /* ---------- holds placed for clients ---------- */
  function holdsView() {
    var list = mine();
    body.innerHTML = '<div class="pd-head"><div><h1 id="pd-h" tabindex="-1">Client holds</h1><p>A hold lasts 48 hours. The sales office approves it, usually within the hour; until then the home shows as on hold to everyone else.</p></div></div>' +
      (list.length ? '<ul class="pd-holds">' + list.map(function (h) {
        var u = A.unit(h.id), pr = A.price(u);
        return '<li><div class="ph-a"><b>' + h.id + '</b><span>' + A.TYPES[u.type].short + ' · ' + A.ord(u.floor) + ' floor · ' + u.facing.toLowerCase() + '</span></div>' +
          '<div class="ph-b"><span class="pill ' + (h.o.pending ? 'wait' : 'ok') + '">' + (h.o.pending ? 'Awaiting approval' : 'Approved by ' + A.esc(h.o.approvedBy || 'the sales office')) + '</span><small>For ' + A.esc(h.o.client || 'a client') + ' · ends in ' + left(h.o.until) + '</small></div>' +
          '<div class="ph-c num">' + A.inr(pr.total) + '</div><div class="ph-d"><a class="btn sm ghost" href="#print/' + h.id + '">Cost sheet</a><button type="button" class="tbtn" data-release="' + h.id + '">Release</button></div></li>';
      }).join('') + '</ul>' : '<div class="pd-empty"><b>No holds right now</b><span>Find a home in the live inventory and hold it for a client for 48 hours.</span><a class="btn" href="#inventory">Open the inventory</a></div>');
    $$('[data-release]', body).forEach(function (b) { b.addEventListener('click', function () { var id = b.dataset.release, prev = A.statusMeta(id); A.setStatus(id, 'avail', { by: 'Channel partner · ' + P.name, note: 'Released by the partner', keep: true }); holdsView(); A.toast(id + ' released.', { label: 'Undo', fn: function () { var inv = A.inv(); inv[id] = prev; A.set('inv', inv); A.emit('inv', {}); holdsView(); } }, 6000); }); });
  }

  /* ---------- brokerage by slab ---------- */
  function brokerageView() {
    var deals = A.partnerDeals(), tot = { total: 0, paid: 0, due: 0, later: 0 };
    var rows = deals.map(function (d) {
      var b = A.brokerage(d), u = A.unit(d.unit), T = A.tower(u.tower);
      b.rows.forEach(function (r) { tot.total += r.amount; if (r.paid) tot.paid += r.amount; else if (r.done) tot.due += r.amount; else tot.later += r.amount; });
      return '<article class="pd-deal"><header><div><b>' + d.unit + '</b><span>' + A.esc(d.client) + ' · booked ' + A.fmtDay(d.bookedAt, { day: 'numeric', month: 'short', year: 'numeric' }) + '</span></div><div class="num"><b>' + A.inrFull(b.total) + '</b><span>' + d.share + '% of the basic price, ' + A.inr(d.basic) + '</span></div></header>' +
        '<div class="pd-slabs" role="img" aria-label="' + T.name + ': ' + A.PROGRESS[u.tower] + ' of ' + T.floors + ' slabs cast"><i style="width:' + Math.round(A.PROGRESS[u.tower] / T.floors * 100) + '%"></i>' + b.rows.map(function (r) { return r.slab ? '<em style="left:' + Math.round(r.slab / T.floors * 100) + '%"></em>' : ''; }).join('') + '</div>' +
        '<ol>' + b.rows.map(function (r) { return '<li class="' + (r.paid ? 'paid' : r.done ? 'due' : '') + '"><span>' + r.label + '</span><b class="num">' + A.inrFull(r.amount) + '</b><small>' + (r.paid ? 'Paid' : r.done ? 'Due: slab reached' : 'At slab ' + r.slab + ' · ' + T.name + ' is at ' + A.PROGRESS[u.tower]) + '</small></li>'; }).join('') + '</ol></article>';
    }).join('');
    body.innerHTML = '<div class="pd-head"><div><h1 id="pd-h" tabindex="-1">Brokerage</h1><p>' + P.share + '% of the basic price, paid in three parts: on the agreement for sale, when the tower reaches its middle slab, and at the top slab.</p></div></div>' +
      '<div class="pd-kpis"><div><span>Earned so far</span><b class="num">' + A.inr(tot.total) + '</b></div><div><span>Paid</span><b class="num">' + A.inr(tot.paid) + '</b></div><div class="due"><span>Due now</span><b class="num">' + A.inr(tot.due) + '</b></div><div><span>Due as the towers rise</span><b class="num">' + A.inr(tot.later) + '</b></div></div>' + rows;
  }

  /* ---------- co-branded brochure and cost sheet ---------- */
  function printView(id) {
    var u = A.unit(id) || A.unit(mine()[0] ? mine()[0].id : 'A-4002'), t = A.TYPES[u.type], pr = A.price(u), T = A.tower(u.tower), rp = A.viewReport(u);
    var base = pr.preGst - pr.ifms, plan = [['On booking', 10], ['Within 45 days of booking', 10], ['On the raft foundation', 10], ['On the podium slab', 7.5], ['On the ' + A.ord(Math.round(T.floors * 0.25)) + ' slab', 7.5], ['On the ' + A.ord(Math.round(T.floors * 0.5)) + ' slab', 7.5], ['On the ' + A.ord(Math.round(T.floors * 0.75)) + ' slab', 7.5], ['On the top slab', 10], ['On blockwork of the home', 10], ['On flooring and finishes', 10], ['On the offer of possession', 10]];
    var opts = mine().map(function (h) { return h.id; }); if (opts.indexOf(u.id) < 0) opts.unshift(u.id);
    body.innerHTML = '<div class="pd-head noprint"><div><h1 id="pd-h" tabindex="-1">Brochure and cost sheet</h1><p>Two pages with your firm on them, ready to print or save as a PDF for ' + A.esc(P.person.split(' ')[0]) + '\'s client.</p></div>' +
      '<div class="pd-printctl"><label for="pd-unit">Home</label><select class="inp" id="pd-unit">' + opts.map(function (k) { return '<option' + (k === u.id ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select><button type="button" class="btn" id="pd-print">Print or save as PDF</button></div></div>' +
      '<div class="pd-sheets">' +
      '<section class="sheet cover"><header class="cob"><span><b>' + A.esc(P.name) + '</b><small>' + A.esc(P.office) + ' · authorised channel partner</small></span><span class="with">presents</span></header>' +
      '<div class="cv"><img src="photos/poster.webp" alt="Aaranya Residences: three towers on Dwarka Expressway at first light" width="1600" height="1000"><div><h2>Aaranya Residences</h2><p>Three towers on Dwarka Expressway, Sector 109, Gurugram. 612 homes on 42, 44 and 46 floors, a Sky Club on the roof of Tower A, and podium gardens below.</p>' +
      '<dl><div><dt>Possession under RERA</dt><dd>31 Dec 2029</dd></div><div><dt>RERA</dt><dd>' + A.esc(A.PROJECT.rera) + '</dd></div><div><dt>Developer</dt><dd>' + A.esc(A.PROJECT.developer) + '</dd></div><div><dt>Sales lounge</dt><dd>Sector 109 · open daily 10:00–19:00</dd></div></dl></div></div>' +
      '<div class="hl"><h3>' + u.id + ' · ' + t.name + '</h3><p>' + A.ord(u.floor) + ' floor of ' + T.name + ', facing ' + u.facing.toLowerCase() + '. ' + A.esc(rp.view[0].replace(/^./, function (c) { return c.toUpperCase(); })) + '. ' + A.sqft(t.carpet) + ' RERA carpet and ' + A.sqft(t.bal) + ' of balconies.</p>' + (A.unitPlanSVG ? '<div class="pl">' + A.unitPlanSVG(u.type, { dims: true }) + '</div>' : '') + '</div>' +
      '<footer>Your contact: ' + A.esc(P.person) + ', ' + A.esc(P.name) + '. Images are artistic impressions; plans are indicative.</footer></section>' +
      '<section class="sheet cost"><header class="cob"><span><b>Cost sheet · ' + u.id + '</b><small>Prepared by ' + A.esc(P.person) + ', ' + A.esc(P.name) + ' · ' + A.fmtDay(Date.now(), { day: 'numeric', month: 'long', year: 'numeric' }) + '</small></span><span class="with">Aaranya Residences</span></header>' +
      '<table class="ct"><tbody><tr><td>Basic price (' + A.sqft(t.carpet) + ' × ' + A.inrFull(pr.base) + ')</td><td>' + A.inrFull(t.carpet * pr.base) + '</td></tr>' + (pr.floorPLC ? '<tr><td>Floor rise (' + A.inrFull(pr.floorPLC) + '/sq ft)</td><td>' + A.inrFull(pr.floorPLC * t.carpet) + '</td></tr>' : '') + (pr.plc ? '<tr><td>Location premium</td><td>' + A.inrFull(pr.plc * t.carpet) + '</td></tr>' : '') +
      '<tr><td>Covered parking × ' + t.parking + '</td><td>' + A.inrFull(pr.parking) + '</td></tr><tr><td>Club membership</td><td>' + A.inrFull(pr.club) + '</td></tr><tr><td>Maintenance security (IFMS)</td><td>' + A.inrFull(pr.ifms) + '</td></tr><tr><td>GST at 5%</td><td>' + A.inrFull(pr.gst) + '</td></tr><tr class="t"><td>All-inclusive</td><td>' + A.inrFull(pr.total) + '</td></tr></tbody></table>' +
      '<h3>Construction-linked plan</h3><table class="ct sm"><tbody>' + plan.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '%</td><td>' + A.inrFull(Math.round(base * r[1] / 100 * 1.05)) + '</td></tr>'; }).join('') + '</tbody></table>' +
      '<footer>Stamp duty and registration are paid to the state and are not included. Indicative until the developer signs the cost sheet. ' + A.esc(A.PROJECT.rera) + '.</footer></section></div>';
    $('#pd-unit').addEventListener('change', function (e) { location.hash = '#print/' + e.target.value; });
    $('#pd-print').addEventListener('click', function () { window.print(); });
  }

  /* ---------- the hold dialog ---------- */
  var dlg = $('#pd-dlg'), form = $('#pd-hold');
  body.addEventListener('click', function (e) {
    var b = e.target.closest('[data-hold]'); if (!b) return;
    var u = A.unit(b.dataset.hold);
    $('#pd-hold-unit').textContent = u.id + ' · ' + A.TYPES[u.type].short + ' · ' + A.ord(u.floor) + ' floor · ' + A.inr(A.price(u).total);
    form.querySelector('[name=unit]').value = u.id; form.querySelector('.msg').textContent = '';
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    setTimeout(function () { $('#pd-client').focus(); }, 30);
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var id = form.unit.value, name = form.client.value.trim();
    if (name.length < 2) { form.querySelector('.msg').textContent = 'Add your client\'s name; the sales office approves holds against it.'; $('#pd-client').focus(); return; }
    if (A.status(id) !== 'avail') { form.querySelector('.msg').textContent = 'Someone held this home a moment ago. Pick another from the list.'; return; }
    A.partnerHold(id, name, form.note.value.trim() || ('For ' + name));
    dlg.close(); form.reset();
    A.toast(id + ' is on hold for ' + name + ' until ' + A.fmtDay(Date.now() + 48 * 36e5) + ', ' + A.fmtTime(Date.now() + 48 * 36e5) + '. The sales office will approve it.', { label: 'See holds', fn: function () { location.hash = '#holds'; } }, 7000);
    route();
  });
  $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });

  /* ---------- routes ---------- */
  function route() {
    if (!signedIn()) return;
    var h = (location.hash || '#inventory').slice(1), parts = h.split('/'), v = parts[0];
    tabs.forEach(function (a) { var on = a.getAttribute('href') === '#' + v; a.setAttribute('aria-current', on ? 'page' : 'false'); });
    var n = mine().length, hb = $('#pd-n-holds'); if (hb) hb.textContent = n ? n : '';
    if (v === 'holds') holdsView(); else if (v === 'brokerage') brokerageView(); else if (v === 'print') printView(parts[1]); else inventory();
  }
  addEventListener('hashchange', function () { route(); var h = $('#pd-h'); if (h) h.focus({ preventScroll: true }); });
  A.on('inv', function () { if (signedIn()) route(); });
  show();
})();
