/* Fieldwise — map, listing-sheet import (PDF extractor), survey master, website analytics, search rankings, conversations inbox,
   and the bridges to website chat (Orbit) and the launch site. */
(function () {
  'use strict';
  var CK = window.CK, esc = CK.esc, ic = CK.ic;
  function S() { return CK.S(); }
  function seg(name, opts, val) { return '<div class="seg" role="group" aria-label="' + esc(name) + '">' + opts.map(function (o) { return '<button type="button" data-' + name + '="' + o[0] + '" aria-pressed="' + (val === o[0]) + '">' + esc(o[1]) + '</button>'; }).join('') + '</div>'; }
  function kt(t, n, sub, delta, href, spark, good) { var up = delta > 0, tone = (good ? up : !up) ? 'ok' : 'bad'; return '<a class="ktile" href="' + (href || '#') + '"><span class="kt-l">' + esc(t) + '</span><span class="kt-n">' + n + '</span><span class="kt-d">' + (delta ? '<b class="tx-' + tone + '">' + (up ? '▲' : '▼') + Math.abs(delta) + (typeof delta === 'number' && Math.abs(delta) < 100 && String(delta).indexOf('.') < 0 ? '%' : '') + '</b> ' : '') + esc(sub) + '</span>' + (spark ? CK.spark(spark, 76, 22) : '') + '</a>'; }

  /* ---------- bridges: website chat leads (Orbit) and launch-site visits ---------- */
  function read(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function areaFromText(t) { t = String(t || '').toLowerCase(); var hit = null; CK.AREAS.forEach(function (a) { if (t.indexOf(a.name.toLowerCase().split(',')[0]) >= 0 || t.indexOf(a.short.toLowerCase()) >= 0) hit = a; }); return hit; }
  function moneyFrom(t) { var m = String(t || '').toLowerCase().match(/([\d.]+)\s*(cr|crore|l|lakh|k)?/); if (!m) return 0; var n = +m[1]; return m[2] === 'cr' || m[2] === 'crore' ? n * 1e7 : m[2] === 'l' || m[2] === 'lakh' ? n * 1e5 : m[2] === 'k' ? n * 1e3 : n; }
  CK.syncBridges = function () {
    var s = S(); if (!s) return; s.bridged = s.bridged || {}; var n = 0;
    read('orbit-leads', []).filter(function (l) { return (l.agent === 'realty' || l.agent === 'launch') && !s.bridged[l.id]; }).slice(-8).forEach(function (l) {
      s.bridged[l.id] = 1; var p = l.payload || {}, a = areaFromText(p.locality || p.title || p.search) || CK.area(l.agent === 'launch' ? 'S65' : 'HK');
      var rent = /rent/i.test(p.budget || p.mode || '') || p.mode === 'rent', bud = moneyFrom(p.budget || p.price) || (rent ? 90000 : 25000000);
      var L = CK.act.newLead({ name: l.name || 'Website visitor', phone: '98XXX XX' + String(100 + (n * 37) % 900), src: l.agent === 'launch' ? 'Launch site' : 'Website chat', found: l.source || 'Website', intent: rent ? 'rent' : 'buy', req: { r: a.r, bhk: [+p.bhk || 3], budget: bud, sectors: [a.id], moveIn: CK.now() + 30 * CK.DAY, type: 'Any', furn: 'Any', family: 'Family', note: (l.intent === 'book_visit' ? 'Booked a visit from the website chat' : 'Came in through the website chat') + (p.title ? ' — ' + p.title : '') + (p.slot ? ' · slot ' + p.slot : '') }, reqDone: true });
      L.orbit = l.id; L.tags = ['From chat']; n++;
    });
    var vis = read('demo-bridge:site-visits', []);
    s.launchVisits = Array.isArray(vis) ? vis.slice(-12) : [];
    if (n) CK.emit('lead');
  };

  /* ============ MAP ============ */
  var MV = { r: 'sd', vb: null, layers: { listings: 1, demand: 1, trips: 1 }, deal: '', bhk: '', ver: 0, draw: 0, sel: null };
  function regionVB(r) { var R = CK.REGIONS[r]; return [0, 0, R.w, R.h]; }
  CK.V.map = {
    title: 'Map',
    render: function () {
      var s = S(), R = CK.REGIONS[MV.r]; if (!MV.vb) MV.vb = regionVB(MV.r);
      var vb = MV.vb, scale = vb[2] / R.w;
      var props = s.props.filter(function (p) { return p.r === MV.r && p.status !== 'let' && p.status !== 'sold' && p.status !== 'inactive' && (!MV.deal || p.deal === MV.deal) && (!MV.bhk || String(p.bhk) === MV.bhk) && (!MV.ver || CK.ver(p) === 'fresh'); });
      var ov = '';
      if (MV.layers.demand) { CK.AREAS.filter(function (a) { return a.r === MV.r; }).forEach(function (a) { var n = s.leads.filter(function (L) { return L.stage !== 'lost' && L.stage !== 'deal' && L.req.sectors.indexOf(a.id) >= 0; }).length; if (!n) return; var c = CK.xy(a, MV.r); ov += '<circle class="m-heat" cx="' + c[0].toFixed(0) + '" cy="' + c[1].toFixed(0) + '" r="' + (26 + n * 7) + '"><title>' + n + ' open leads want ' + esc(a.name) + '</title></circle>'; }); }
      if (MV.layers.trips) s.trips.filter(function (t) { return t.r === MV.r && CK.dayStart(t.start) === CK.dayStart(CK.now()) && t.status !== 'cancelled'; }).forEach(function (t) { var pts = [CK.xy(CK.REGIONS[t.r].office, t.r)].concat(t.stops.map(function (st) { return CK.xy(CK.prop(st.pid), t.r); })); ov += '<polyline class="m-trip" points="' + pts.map(function (p) { return p[0].toFixed(0) + ',' + p[1].toFixed(0); }).join(' ') + '" style="--h:' + CK.agent(t.agent).hue + '"><title>' + t.id + ' · ' + esc(CK.agent(t.agent).name) + '</title></polyline>'; });
      var inView = props.filter(function (p) { var c = CK.xy(p, MV.r); return c[0] >= vb[0] && c[0] <= vb[0] + vb[2] && c[1] >= vb[1] && c[1] <= vb[1] + vb[3]; });
      if (MV.layers.listings) {
        var cell = Math.max(18, 110 * scale), cl = {};
        inView.forEach(function (p) { var c = CK.xy(p, MV.r), k = Math.floor(c[0] / cell) + ':' + Math.floor(c[1] / cell); (cl[k] = cl[k] || []).push({ p: p, c: c }); });
        Object.keys(cl).forEach(function (k) { var g = cl[k]; if (g.length === 1 || scale < .35) { g.forEach(function (x) { var v = CK.ver(x.p) === 'fresh'; ov += '<g class="m-l ' + x.p.deal + (v ? ' v' : '') + (MV.sel && MV.sel.indexOf(x.p.id) >= 0 ? ' sel' : '') + '" data-mp="' + x.p.id + '" tabindex="0" role="button" aria-label="' + esc(x.p.code + ' ' + CK.cfg(x.p) + ' ' + CK.price(x.p)) + '"><circle cx="' + x.c[0].toFixed(0) + '" cy="' + x.c[1].toFixed(0) + '" r="' + (9 * scale + 3).toFixed(1) + '"/></g>'; }); } else { var cx = g.reduce(function (a, x) { return a + x.c[0]; }, 0) / g.length, cy = g.reduce(function (a, x) { return a + x.c[1]; }, 0) / g.length, rr = (16 + Math.min(18, g.length * 2)) * Math.max(scale, .45); ov += '<g class="m-cl" data-cz="' + cx.toFixed(0) + ':' + cy.toFixed(0) + '" tabindex="0" role="button" aria-label="' + g.length + ' listings, zoom in"><circle cx="' + cx.toFixed(0) + '" cy="' + cy.toFixed(0) + '" r="' + rr.toFixed(0) + '"/><text x="' + cx.toFixed(0) + '" y="' + (cy + rr * .32).toFixed(0) + '" style="font-size:' + (rr * .85).toFixed(0) + 'px">' + g.length + '</text></g>'; } });
      }
      if (MV.box) ov += '<rect class="m-box" x="' + MV.box[0] + '" y="' + MV.box[1] + '" width="' + MV.box[2] + '" height="' + MV.box[3] + '"/>';
      var svg = CK.map(MV.r, { vb: vb, overlay: ov, label: 'Map of ' + R.name + ' listings' });
      var list = (MV.sel ? props.filter(function (p) { return MV.sel.indexOf(p.id) >= 0; }) : inView).sort(function (a, b) { return CK.fresh(b) - CK.fresh(a); });
      var head = '<div class="ph"><div><h1>Map</h1><p class="muted">Listings, where demand is and today’s trips, on one map. Clusters split as you zoom; drag a box to search an area.</p></div></div>';
      var bar = '<div class="fbar mapbar">' + seg('mr', [['sd', 'South Delhi'], ['ggn', 'Gurugram']], MV.r) + seg('md', [['', 'All'], ['rent', 'Rent'], ['sale', 'Sale']], MV.deal) + '<label class="fsel"><span class="sr">BHK</span><select data-mbhk><option value="">Any BHK</option>' + ['1', '2', '3', '4', '5'].map(function (b) { return '<option' + (MV.bhk === b ? ' selected' : '') + '>' + b + '</option>'; }).join('') + '</select></label>' +
        ['listings', 'demand', 'trips'].map(function (k) { return '<button type="button" class="chipb' + (MV.layers[k] ? ' on' : '') + '" data-ml="' + k + '" aria-pressed="' + !!MV.layers[k] + '">' + { listings: 'Listings', demand: 'Lead demand', trips: 'Trips today' }[k] + '</button>'; }).join('') + '<button type="button" class="chipb' + (MV.ver ? ' on' : '') + '" data-mv aria-pressed="' + !!MV.ver + '">' + ic('shield', 13) + 'Verified only</button><span class="grow"></span><button type="button" class="btn sm' + (MV.draw ? ' primary' : '') + '" data-mdraw aria-pressed="' + !!MV.draw + '">' + ic('target', 14) + (MV.draw ? 'Drag on the map…' : 'Draw to search') + '</button></div>';
      var side = '<aside class="map-side"><div class="panel-h"><h2>' + (MV.sel ? MV.sel.length + ' in your area' : inView.length + ' in view') + '</h2>' + (MV.sel ? '<button type="button" class="link-btn" data-mclear>Clear area</button>' : '') + '</div>' + (MV.sel && MV.sel.length ? '<button type="button" class="btn sm" data-msend>' + ic('star', 14) + 'Shortlist all for a lead</button>' : '') + '<ul class="map-list">' + list.slice(0, 40).map(function (p) { return '<li><button type="button" data-peek="prop:' + p.id + '"><img src="' + CK.ph(p.photos[0], 1) + '" alt="" width="52" height="38" loading="lazy"><span><b>' + CK.price(p) + '</b><small>' + esc(CK.cfg(p)) + ' · ' + esc(CK.area(p.area).short) + '</small></span>' + CK.ring(CK.fresh(p), 26) + '</button></li>'; }).join('') + '</ul>' + (list.length ? '' : '<p class="muted pad">Nothing here with these filters.</p>') + '</aside>';
      var legend = '<div class="map-legend"><span><i class="lg-d rent"></i>Rent</span><span><i class="lg-d sale"></i>Sale</span><span><i class="lg-d v"></i>Verified ring</span><span><i class="lg-h"></i>Lead demand</span></div>';
      return head + bar + '<div class="map-g"><div class="map-stage' + (MV.draw ? ' drawing' : '') + '" id="mapstage">' + svg + '<div class="map-z"><button type="button" class="ibtn" data-mz="in" aria-label="Zoom in">' + ic('plus', 16) + '</button><button type="button" class="ibtn" data-mz="out" aria-label="Zoom out">' + ic('minus', 16) + '</button><button type="button" class="ibtn" data-mz="reset" aria-label="Show the whole region">' + ic('layers', 16) + '</button></div>' + legend + '</div>' + side + '</div>';
    },
    mount: function (el) {
      var stage = el.querySelector('#mapstage'), svg = stage && stage.querySelector('svg');
      function zoom(cx, cy, f) { var v = MV.vb, w = Math.max(160, Math.min(CK.REGIONS[MV.r].w * 1.2, v[2] * f)), h = w * v[3] / v[2]; MV.vb = [cx - w / 2, cy - h / 2, w, h]; CK.render(); }
      el.addEventListener('click', function (e) {
        var t = e.target.closest('[data-mr],[data-md],[data-ml],[data-mv],[data-mdraw],[data-mz],[data-cz],[data-mp],[data-mclear],[data-msend]'); if (!t) return; var d = t.dataset;
        if (d.mr) { MV.r = d.mr; MV.vb = null; MV.sel = null; MV.box = null; }
        else if (d.md !== undefined) MV.deal = d.md;
        else if (d.ml) MV.layers[d.ml] = !MV.layers[d.ml];
        else if (d.mv !== undefined) MV.ver = !MV.ver;
        else if (d.mdraw !== undefined) MV.draw = !MV.draw;
        else if (d.mclear !== undefined) { MV.sel = null; MV.box = null; }
        else if (d.mz) { var v = MV.vb; if (d.mz === 'reset') MV.vb = null; else return zoom(v[0] + v[2] / 2, v[1] + v[3] / 2, d.mz === 'in' ? .6 : 1.6); }
        else if (d.cz) { var c = d.cz.split(':'); return zoom(+c[0], +c[1], .45); }
        else if (d.mp) { CK.peek('prop', d.mp); return; }
        else if (d.msend !== undefined) { var ps = MV.sel.slice(); CK.menu(t, [{ head: 'Shortlist ' + ps.length + ' homes for…' }].concat(S().leads.filter(function (L) { return L.req.r === MV.r && ['requirement', 'matched', 'visit'].indexOf(L.stage) >= 0; }).slice(0, 10).map(function (L) { return { label: L.name + ' · ' + L.req.bhk.join('/') + ' BHK', id: L.id }; })), function (it) { var L = CK.lead(it.id); ps.forEach(function (pid) { if (L.shortlist.indexOf(pid) < 0) L.shortlist.push(pid); }); CK.tl(L, 'match', 'Shortlisted ' + ps.length + ' homes from a map area'); CK.audit('Shortlisted from map', L.id, ps.length + ' homes'); CK.emit('lead'); CK.toast(ps.length + ' homes shortlisted for ' + L.name.split(' ')[0]); }); return; }
        CK.render();
      });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.closest('[data-mp],[data-cz]')) { e.preventDefault(); e.target.closest('[data-mp],[data-cz]').dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
      el.addEventListener('change', function (e) { if (e.target.matches('[data-mbhk]')) { MV.bhk = e.target.value; CK.render(); } });
      if (!svg) return;
      function pt(ev) { var p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
      var start = null, pan = null;
      svg.addEventListener('pointerdown', function (ev) { if (ev.target.closest('[data-mp],[data-cz]')) return; if (MV.draw) { start = pt(ev); svg.setPointerCapture(ev.pointerId); } else { pan = { x: ev.clientX, y: ev.clientY, vb: MV.vb.slice(), k: MV.vb[2] / svg.getBoundingClientRect().width }; svg.setPointerCapture(ev.pointerId); } });
      svg.addEventListener('pointermove', function (ev) {
        if (start) { var p = pt(ev), r = svg.querySelector('.m-box'); if (!r) { r = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); r.setAttribute('class', 'm-box'); svg.appendChild(r); } r.setAttribute('x', Math.min(p.x, start.x)); r.setAttribute('y', Math.min(p.y, start.y)); r.setAttribute('width', Math.abs(p.x - start.x)); r.setAttribute('height', Math.abs(p.y - start.y)); }
        if (pan) { var dx = (ev.clientX - pan.x) * pan.k, dy = (ev.clientY - pan.y) * pan.k; svg.setAttribute('viewBox', [pan.vb[0] - dx, pan.vb[1] - dy, pan.vb[2], pan.vb[3]].map(function (v) { return v.toFixed(0); }).join(' ')); }
      });
      svg.addEventListener('pointerup', function (ev) {
        if (start) { var p = pt(ev), x0 = Math.min(p.x, start.x), y0 = Math.min(p.y, start.y), w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y); start = null; if (w < 8 || h < 8) return; MV.box = [x0.toFixed(0), y0.toFixed(0), w.toFixed(0), h.toFixed(0)]; MV.sel = S().props.filter(function (q) { if (q.r !== MV.r || q.status === 'let' || q.status === 'sold') return false; var c = CK.xy(q, MV.r); return c[0] >= x0 && c[0] <= x0 + w && c[1] >= y0 && c[1] <= y0 + h; }).map(function (q) { return q.id; }); MV.draw = 0; CK.render(); }
        if (pan) { var moved = Math.abs(ev.clientX - pan.x) + Math.abs(ev.clientY - pan.y); var dx = (ev.clientX - pan.x) * pan.k, dy = (ev.clientY - pan.y) * pan.k; if (moved > 4) { MV.vb = [pan.vb[0] - dx, pan.vb[1] - dy, pan.vb[2], pan.vb[3]]; pan = null; CK.render(); } pan = null; }
      });
      svg.addEventListener('wheel', function (ev) { ev.preventDefault(); var p = pt(ev); zoom(p.x, p.y, ev.deltaY < 0 ? .8 : 1.25); }, { passive: false });
    }
  };

  /* ============ LISTING-SHEET IMPORT (PDF extractor) ============ */
  var IV = { step: 1, file: null, rows: null, prog: 0, decisions: {} };
  var AREA_BY = { 'VASANT VIHAR': 'VV', 'SHANTI NIKETAN': 'SN', 'ANAND NIKETAN': 'AN', 'SAFDARJUNG ENCL': 'SE', 'GREEN PARK': 'GP', 'HAUZ KHAS': 'HK', 'SARVODAYA ENCL': 'SV', 'PANCHSHEEL PARK': 'PP', 'DEFENCE COLONY': 'DC', 'LAJPAT NAGAR': 'LN', 'GK-I': 'G1', 'GK-II': 'G2', 'CR PARK': 'CR', 'MALVIYA NAGAR': 'MN', 'SAKET': 'SK', 'VASANT KUNJ': 'VK', 'JOR BAGH': 'JB' };
  var FLOOR = { GF: 'Ground', FF: 'First', SF: 'Second', TF: 'Third', '4F': 'Fourth', 'BF+GF': 'Basement + ground' };
  function money(tok) { var m = tok.match(/^([\d.]+)(CR|L|K)$/i); if (!m) return 0; var n = +m[1], u = m[2].toUpperCase(); return Math.round(u === 'CR' ? n * 1e7 : u === 'L' ? n * 1e5 : n * 1e3); }
  CK.parseSheet = function (lines) { // the reader: section headers, print shorthand, confidence per field
    var area = null, deal = 'rent', out = [], seen = {};
    lines.forEach(function (ln, i) {
      if (ln.indexOf('## ') === 0) { var h = ln.slice(3).split(' · '); area = AREA_BY[h[0]] || null; deal = /SALE/.test(h[1] || '') ? 'sale' : 'rent'; return; }
      var tk = ln.split(/\s{2,}/), row = { line: ln, n: out.length + 1, area: area, deal: deal, conf: {}, notes: [] };
      row.plot = tk[0]; row.conf.plot = /^[A-Z]{1,2}-[\d/]+$/.test(tk[0]) ? 'hi' : 'mid';
      tk.slice(1).forEach(function (t) {
        var b = t.match(/^(\d)BHK$/i); if (b) { row.bhk = +b[1]; row.conf.bhk = 'hi'; return; }
        if (FLOOR[t]) { row.floor = FLOOR[t]; row.conf.floor = 'hi'; if (t === 'FF') row.notes.push('“FF” read as first floor, not fully furnished'); return; }
        var y = t.match(/^(\d+)Y$/i); if (y) { row.plotYd = +y[1]; row.sqft = +y[1] * 9; row.notes.push(y[1] + ' sq yd plot → ' + CK.grp(+y[1] * 9) + ' sq ft'); row.conf.size = 'hi'; return; }
        var f = t.match(/^(\d+)F$/i); if (f) { row.sqft = +f[1]; row.conf.size = 'mid'; row.notes.push('“' + t + '” read as ' + f[1] + ' sq ft, not a floor'); return; }
        var mny = money(t); if (mny) { row.price = mny; row.conf.price = 'hi'; return; }
        var ph = t.match(/^(.+?)\s+(98XXX XX\d{3})$/); if (ph) { row.owner = ph[1]; row.phone = ph[2]; row.conf.owner = 'hi'; return; }
        if (t) row.extra = (row.extra ? row.extra + ', ' : '') + t;
      });
      if (row.extra === 'FF') { row.notes.push('Trailing “FF” is ambiguous: floor already given, may mean fully furnished'); row.conf.floor = 'low'; }
      if (deal === 'sale' && row.price && row.price < 5e6) { row.conf.price = 'low'; row.notes.push('Price ' + CK.money(row.price) + ' reads like a rent in the sale section'); }
      if (deal === 'rent' && row.price && row.price > 6e6) { row.conf.price = 'low'; row.notes.push('Price reads like a sale price in the rent section'); }
      if (!row.bhk) { row.conf.bhk = 'low'; row.notes.push('No BHK printed'); }
      var key = (row.area + row.plot + row.price).toLowerCase(); row.dup = !!seen[key]; seen[key] = 1;
      var ex = CK.S().props.filter(function (p) { return p.area === row.area && p.plot === row.plot; })[0];
      row.match = ex ? ex.id : null; row.matchScore = ex ? (ex.bhk === row.bhk ? 96 : 78) : 0;
      row.kind = row.dup ? 'dup' : Object.keys(row.conf).some(function (k) { return row.conf[k] === 'low'; }) ? 'review' : row.match ? 'refresh' : 'new';
      out.push(row);
    });
    return out;
  };
  CK.V.import = {
    title: 'Import listings',
    render: function () {
      CK.ensure(); var s = S();
      var steps = CK.stepper([{ label: 'Choose sheet' }, { label: 'Read' }, { label: 'Review' }, { label: 'Apply' }], IV.step - 1, { label: 'Import steps' });
      var head = '<div class="ph"><div><h1>Import listings</h1><p class="muted">Drop a broker’s listing sheet or the desk’s weekly PDF. The reader follows each section, understands print shorthand, and only asks people about the unsure lines.</p></div></div>' + steps;
      var b = '';
      if (IV.step === 1) b = '<div class="imp-g"><label class="drop" id="drop"><input type="file" accept="application/pdf" data-imfile><span class="drop-ic">' + ic('upload', 26) + '</span><b>Drop a PDF listing sheet here</b><span class="muted sm">or click to choose · one sheet at a time</span></label><div><h3 class="sh sm">Sheets waiting in the shared folder</h3>' + [['amaltas-desk-sheet-south-delhi.pdf', 'Amaltas desk sheet · South Delhi', '2 pages · this week'], ['partner-sheet-gk-cr-park.pdf', 'Partner sheet · Chauhan & Sons', 'GK, CR Park, Malviya Nagar · 2 pages']].map(function (f) { return '<button type="button" class="sheetcard" data-imsample="' + f[0] + '">' + ic('file', 22) + '<span><b>' + esc(f[1]) + '</b><small>' + esc(f[2]) + '</small></span><a href="files/' + f[0] + '" target="_blank" rel="noopener" class="link-btn" data-noimp>Open PDF</a></button>'; }).join('') + '<h3 class="sh sm">Recent imports</h3><ul class="imp-h">' + s.imports.map(function (x) { return '<li><b>' + esc(x.file) + '</b><span class="muted sm">' + CK.date(x.at) + ' · ' + x.rows + ' rows → ' + x.added + ' new, ' + x.refreshed + ' refreshed, ' + x.skipped + ' skipped</span></li>'; }).join('') + '</ul></div></div>';
      if (IV.step === 2) b = '<section class="panel reading"><div class="panel-h"><h2>Reading ' + esc(IV.file) + '</h2><span class="muted sm">' + Math.round(IV.prog * 100) + '%</span></div><div class="prog"><span style="width:' + (IV.prog * 100) + '%"></span></div><ol class="readlines">' + (IV.lines || []).slice(0, Math.ceil((IV.lines || []).length * IV.prog)).map(function (l) { return '<li class="' + (l.indexOf('## ') === 0 ? 'h' : '') + '">' + esc(l.replace('## ', '')) + '</li>'; }).join('') + '</ol></section>';
      if (IV.step === 3) b = review();
      if (IV.step === 4) b = preview();
      if (IV.step === 5) b = '<section class="panel done-p">' + ic('check', 28) + '<h2>Import applied</h2><p class="muted">' + esc(IV.result) + '</p><div class="btnrow"><a class="btn primary" href="#/verify">Open the verification desk</a><button type="button" class="btn" data-imreset>Import another sheet</button></div></section>';
      return head + b;
    },
    mount: function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.closest('[data-noimp]')) return;
        var t = e.target.closest('[data-imsample],[data-imnext],[data-imback],[data-imkind],[data-imapply],[data-imreset]'); if (!t) return;
        if (t.dataset.imsample) { e.preventDefault(); startRead(t.dataset.imsample); }
        if (t.dataset.imnext !== undefined) { IV.step = 4; CK.render(); }
        if (t.dataset.imback !== undefined) { IV.step = 3; CK.render(); }
        if (t.dataset.imreset !== undefined) { IV = { step: 1, decisions: {} }; CK.render(); }
        if (t.dataset.imkind) { var k = t.dataset.imkind.split(':'); IV.decisions[k[0]] = k[1]; CK.render(); }
        if (t.dataset.imapply) apply(t.dataset.imapply === 'all');
      });
      el.addEventListener('change', function (e) { var f = e.target.closest('[data-imfile]'); if (f && f.files[0]) handleFile(f.files[0]); });
      var drop = el.querySelector('#drop'); if (drop) { drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('over'); }); drop.addEventListener('dragleave', function () { drop.classList.remove('over'); }); drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }); }
    }
  };
  function handleFile(f) {
    if (!/\.pdf$/i.test(f.name)) { CK.toast('That isn’t a PDF — export the sheet as PDF first', { icon: 'flag' }); return; }
    fetch('files/sheets.json').then(function (r) { return r.json(); }).then(function (j) { if (j[f.name]) startRead(f.name); else CK.modal('<h2 id="modal-t">' + ic('file', 18) + ' New layout</h2><p>The reader hasn’t learned the layout of “' + esc(f.name) + '” yet. The desk sets up a new sheet layout once (sections, columns, shorthand) and every later issue reads on its own.</p><p class="muted sm">Pick one of the two sheets in the shared folder instead.</p><div class="m-actions"><button type="button" class="btn" data-close-modal>OK</button></div>'); }).catch(function () { CK.toast('Couldn’t open the sheet library', { icon: 'flag' }); });
  }
  function startRead(name) {
    fetch('files/sheets.json').then(function (r) { return r.json(); }).then(function (j) {
      var sh = j[name]; IV = { step: 2, file: sh.title + ' — ' + sh.sub, fname: name, lines: sh.lines, prog: 0, decisions: {} }; CK.render();
      var t = setInterval(function () { IV.prog = Math.min(1, IV.prog + .12); if (IV.prog >= 1) { clearInterval(t); IV.rows = CK.parseSheet(IV.lines); IV.step = 3; } CK.render(); }, 140);
    });
  }
  function confCell(v, c, txt) { return '<td class="cf-' + (c || 'hi') + '"' + (c === 'low' ? ' title="Low confidence — check this"' : '') + '>' + (v == null || v === '' ? '<span class="muted">—</span>' : txt || esc(v)) + '</td>'; }
  function kindOf(r) { return IV.decisions[r.n] || r.kind; }
  var KIND = { new: ['New listing', 'green'], refresh: ['Matched · refresh', 'blue'], dup: ['Duplicate · skip', 'grey'], review: ['Needs review', 'amber'], skip: ['Skip', 'grey'] };
  function review() {
    var rows = IV.rows, cnt = { new: 0, refresh: 0, dup: 0, review: 0, skip: 0 }; rows.forEach(function (r) { cnt[kindOf(r)]++; });
    return '<div class="imp-sum">' + ['new', 'refresh', 'dup', 'review'].map(function (k) { return '<div class="ims k-' + k + '"><b>' + cnt[k] + '</b><span>' + KIND[k][0] + '</span></div>'; }).join('') + '<span class="grow"></span><button type="button" class="btn primary" data-imnext>' + ic('eye', 15) + 'Preview what this does</button></div>' +
      '<div class="tbl-wrap"><table class="tbl imp"><thead><tr><th>#</th><th>Printed line</th><th>Area</th><th>Plot</th><th>BHK</th><th>Floor</th><th class="num">Price</th><th class="hide-m">Owner</th><th>Decision</th></tr></thead><tbody>' + rows.map(function (r) {
        var ex = r.match ? CK.prop(r.match) : null, k = kindOf(r);
        return '<tr class="r-' + k + '"><td class="muted">' + r.n + '</td><td class="mono sm pl">' + esc(r.line) + (r.notes.length ? '<small class="notes">' + r.notes.map(esc).join(' · ') + '</small>' : '') + '</td>' + confCell(r.area ? CK.area(r.area).short : null) + confCell(r.plot, r.conf.plot) + confCell(r.bhk, r.conf.bhk) + confCell(r.floor, r.conf.floor) + confCell(r.price, r.conf.price, r.price ? CK.money(r.price, true) + (r.deal === 'rent' ? '/mo' : '') : '') + '<td class="hide-m sm">' + esc(r.owner || '') + '</td><td><div class="dec">' + CK.pill(KIND[k][0], KIND[k][1]) + (ex ? '<button type="button" class="chip chip-p" data-peek="prop:' + ex.id + '"><img src="' + CK.ph(ex.photos[0], 1) + '" alt="" width="20" height="20"><span class="mono">' + ex.code + '</span><span class="chip-x">' + r.matchScore + '%' + (ex.price !== r.price && r.price ? ' · ' + CK.money(ex.price, true) + ' → ' + CK.money(r.price, true) : ' · same price') + '</span></button>' : '') + '<span class="dec-b">' + (k !== 'new' && !r.match && k !== 'dup' ? '<button type="button" class="btn sm ghost" data-imkind="' + r.n + ':new">Add as new</button>' : '') + (k === 'review' && r.match ? '<button type="button" class="btn sm ghost" data-imkind="' + r.n + ':refresh">Refresh it</button>' : '') + (k !== 'skip' && k !== 'dup' ? '<button type="button" class="btn sm ghost" data-imkind="' + r.n + ':skip">Skip</button>' : '<button type="button" class="btn sm ghost" data-imkind="' + r.n + ':' + r.kind + '">Undo</button>') + '</span></div></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function preview() {
    var rows = IV.rows, g = { new: [], refresh: [], dup: [], review: [], skip: [] }; rows.forEach(function (r) { g[kindOf(r)].push(r); });
    var priceUp = g.refresh.filter(function (r) { var p = CK.prop(r.match); return r.price && p.price !== r.price; });
    return '<section class="panel"><div class="panel-h"><h2>What this import does to Fieldwise</h2><span class="muted sm">nothing changes until you apply</span></div><div class="effects">' +
      '<div class="eff k-new"><b>' + g.new.length + '</b><span>new listings go to the verification desk, off the website until checked</span></div>' +
      '<div class="eff k-refresh"><b>' + g.refresh.length + '</b><span>existing listings refreshed — ' + priceUp.length + ' price change' + (priceUp.length === 1 ? '' : 's') + ', freshness clock restarts on the rest</span></div>' +
      '<div class="eff k-dup"><b>' + (g.dup.length + g.skip.length) + '</b><span>lines skipped (duplicates on the sheet or set aside)</span></div>' +
      '<div class="eff k-review"><b>' + g.review.length + '</b><span>unsure lines — held back unless you include them</span></div></div>' +
      (priceUp.length ? '<h3 class="sh sm">Price changes</h3><ul class="pchg">' + priceUp.map(function (r) { var p = CK.prop(r.match); return '<li>' + CK.chipProp(p) + '<span>' + CK.money(p.price, true) + ' → <b>' + CK.money(r.price, true) + '</b></span></li>'; }).join('') + '</ul>' : '') +
      '<div class="btnrow"><button type="button" class="btn" data-imback>' + ic('left', 14) + 'Back to review</button><span class="grow"></span><button type="button" class="btn" data-imapply="all"' + (g.review.length ? '' : ' disabled') + '>Apply including review (' + (g.new.length + g.refresh.length + g.review.length) + ')</button><button type="button" class="btn primary" data-imapply="safe">Apply ' + (g.new.length + g.refresh.length) + ' changes</button></div></section>';
  }
  function apply(all) {
    var rows = IV.rows, added = 0, refreshed = 0, skipped = 0, owners = S().owners;
    rows.forEach(function (r, i) {
      var k = kindOf(r); if (k === 'review' && all) k = r.match ? 'refresh' : 'new';
      if (k === 'new' && r.area && r.price) { CK.act.newProp({ area: r.area, plot: r.plot, floor: r.floor || 'First', type: 'Builder floor', deal: r.deal, bhk: r.bhk || 3, sqft: r.sqft || (r.bhk || 3) * 600, price: r.price, ownerId: owners[(i * 5) % owners.length].id }); added++; }
      else if (k === 'refresh') { var p = CK.prop(r.match); if (r.price && r.price !== p.price) { p.hist.push({ at: CK.now(), price: r.price }); p.price = r.price; } p.ownerLastReply = CK.now(); refreshed++; }
      else skipped++;
    });
    var s = S(); s.imports.unshift({ id: 'IM-' + (42 + s.imports.length), at: CK.now(), file: IV.file, rows: rows.length, added: added, refreshed: refreshed, skipped: skipped, by: CK.me().id });
    CK.audit('Applied listing import', IV.fname, added + ' new · ' + refreshed + ' refreshed · ' + skipped + ' skipped'); CK.emit('prop');
    IV.result = added + ' new listings sent to the verification desk, ' + refreshed + ' refreshed, ' + skipped + ' skipped.'; IV.step = 5; CK.render();
  }

  /* ============ SURVEY MASTER ============ */
  var SM = { tab: 'overview', who: '', idx: 0, out: null, note: '', price: '' };
  function surveyQueue() { return S().props.filter(function (p) { var v = CK.ver(p); return (v === 'pending' || v === 'overdue' || v === 'due') && p.status !== 'let' && p.status !== 'sold' && p.status !== 'inactive' && (!SM.who || (CK.agent(SM.who).terr || []).indexOf(p.area) >= 0); }).sort(function (a, b) { return (a.ver.at || a.created) - (b.ver.at || b.created); }); }
  CK.V.survey = {
    title: 'Survey master',
    render: function (r) {
      CK.ensure();
      if (r.id === 'focus') return focus();
      var s = S(), now = CK.now(), m0 = now - 30 * CK.DAY;
      var c = { fresh: 0, due: 0, overdue: 0, pending: 0 }; s.props.forEach(function (p) { if (p.status === 'let' || p.status === 'sold' || p.status === 'inactive') return; var v = CK.ver(p); if (c[v] != null) c[v]++; });
      var checked = s.props.filter(function (p) { return p.ver.at && p.ver.at > m0; }).length;
      var head = '<div class="ph"><div><h1>Survey master</h1><p class="muted">Every listing has a freshness clock — rent ' + s.settings.rentWindow + ' days, sale ' + s.settings.saleWindow + '. When it runs out the listing becomes a check: a call, a visit or a photo shoot.</p></div><div class="ph-a"><a class="btn primary" href="#/survey/focus">' + ic('play', 15) + 'Start checking</a></div></div>';
      var tiles = '<section class="ktiles">' + kt('Overdue', c.overdue, 'badge is off', 0, '#/verify', [9, 11, 10, 12, 9, 8, c.overdue]) + kt('Due this week', c.due, 'clock running out', 0, '#/survey/focus', [6, 7, 9, 6, 8, 7, c.due]) + kt('New, never checked', c.pending, 'off the website', 0, '#/verify', [5, 4, 6, 8, 7, 9, c.pending]) + kt('Fresh', c.fresh, 'Verified badge on', 4, '#/inventory', [40, 42, 41, 44, 46, 47, c.fresh], true) + kt('Checked · 30 days', checked, 'calls, visits, shoots', 12, '#/audit', [30, 34, 33, 38, 41, 44, checked], true) + '</section>';
      var tabs = '<div class="tabs" role="tablist">' + [['overview', 'Overview'], ['todo', 'To do'], ['people', 'Surveyors']].map(function (t) { return '<button type="button" role="tab" data-smtab="' + t[0] + '" aria-selected="' + (SM.tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>';
      var b = '';
      if (SM.tab === 'overview') {
        var cov = CK.AREAS.map(function (a) { var ps = s.props.filter(function (p) { return p.area === a.id && p.status !== 'let' && p.status !== 'sold' && p.status !== 'inactive'; }); var f = ps.filter(function (p) { return CK.ver(p) === 'fresh'; }).length; return { a: a, n: ps.length, f: f, pct: ps.length ? Math.round(f / ps.length * 100) : 0 }; }).filter(function (x) { return x.n; }).sort(function (x, y) { return x.pct - y.pct; });
        var tot = s.props.length, verified = s.props.filter(function (p) { return p.ver.status === 'verified'; }).length, listed = s.props.filter(function (p) { return p.ver.status === 'verified' && p.status !== 'inactive'; }).length, closed = s.props.filter(function (p) { return p.status === 'let' || p.status === 'sold'; }).length;
        var fun = [['Surveyed', tot + 12], ['Verified', verified], ['Listed on the website', listed], ['Let out or sold', closed]];
        var outc = [['Verified as listed', 61, 'ok'], ['Price changed', 14, 'warn'], ['Already let out / sold', 11, 'bad'], ['Couldn’t get in', 7, ''], ['Owner not reachable', 7, '']];
        b = '<div class="rep-g"><section class="panel span2"><div class="panel-h"><h2>Coverage by colony</h2><span class="muted sm">share of live listings with a fresh check · weakest first</span></div><div class="covg">' + cov.map(function (x) { return '<div class="cov"><span>' + esc(x.a.short) + '</span><span class="bar-t"><span class="bar-f t-' + (x.pct >= 70 ? 'ok' : x.pct >= 45 ? 'warn' : 'bad') + '" style="width:' + x.pct + '%"></span></span><b>' + x.pct + '%</b><small class="muted">' + x.f + '/' + x.n + '</small></div>'; }).join('') + '</div></section>' +
          '<section class="panel"><div class="panel-h"><h2>From survey to closed</h2></div><ol class="funnel2">' + fun.map(function (f, i) { return '<li><span>' + f[0] + '</span><span class="f2b"><span style="width:' + Math.round(f[1] / fun[0][1] * 100) + '%"></span></span><b>' + f[1] + '</b>' + (i ? '<small class="muted">' + Math.round(f[1] / fun[i - 1][1] * 100) + '%</small>' : '') + '</li>'; }).join('') + '</ol><h3 class="sh sm">Check outcomes · 30 days</h3>' + CK.bars(outc.map(function (o) { return { label: o[0], value: o[1], tone: o[2] }; }), { fmt: function (v) { return v + '%'; } }) + '</section></div>';
      }
      if (SM.tab === 'todo') {
        var q = surveyQueue(), now2 = CK.now();
        var g = { 'Overdue': [], 'Due this week': [], 'New listings': [] }; q.forEach(function (p) { var v = CK.ver(p); (v === 'pending' ? g['New listings'] : v === 'overdue' ? g.Overdue : g['Due this week']).push(p); });
        b = '<div class="fbar"><label class="fsel"><span class="sr">Surveyor</span><select data-smwho><option value="">Everyone’s colonies</option>' + s.agents.filter(function (a) { return a.role === 'field'; }).map(function (a) { return '<option value="' + a.id + '"' + (SM.who === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('') + '</select></label><span class="muted sm">' + q.length + ' checks · about ' + Math.round(q.length * 4 / 60 * 10) / 10 + ' h on the phone, aim ≈ 4 m each</span><span class="grow"></span><a class="btn primary sm" href="#/survey/focus">' + ic('play', 14) + 'Focus mode</a></div>' +
          Object.keys(g).map(function (k) { if (!g[k].length) return ''; return '<section class="tgroup"><h2 class="sh">' + k + '<b>' + g[k].length + '</b></h2><div class="trows">' + g[k].map(function (p, i) { var o = CK.owner(p.ownerId); return '<div class="trow sv"><img src="' + CK.ph(p.photos[0], 1) + '" alt="" width="52" height="38" loading="lazy" class="thumb"><span class="tr-m"><b>' + p.code + ' · ' + esc(CK.cfg(p)) + '</b><small>' + esc(p.plot) + ', ' + esc(CK.area(p.area).short) + ' · ' + esc(o.name) + '</small></span><span class="tr-m"><small>' + (p.ver.at ? 'Last check ' + CK.ago(p.ver.at) : 'Added ' + CK.ago(p.created)) + '</small><small class="muted">' + esc((o.comms[0] || { text: 'No remark yet' }).text.slice(0, 60)) + '</small></span>' + CK.verPill(p) + '<a class="btn sm" href="#/survey/focus/' + p.id + '">' + ic('phone', 14) + 'Check</a></div>'; }).join('') + '</div></section>'; }).join('');
      }
      if (SM.tab === 'people') {
        var ppl = s.agents.filter(function (a) { return a.role === 'field' || a.role === 'telecaller'; }).map(function (a, i) { var n = s.props.filter(function (p) { return p.ver.by === a.id && p.ver.at > m0; }).length + (a.role === 'telecaller' ? 9 + i * 3 : i * 2); return { a: a, n: n, calls: a.role === 'telecaller' ? 40 + i * 7 : 6 + i, visits: a.role === 'field' ? n : 0, mins: a.role === 'telecaller' ? 3.6 + (i % 3) * .4 : 0, backlog: s.props.filter(function (p) { var v = CK.ver(p); return (v === 'overdue' || v === 'due' || v === 'pending') && (a.terr || []).indexOf(p.area) >= 0; }).length }; }).sort(function (x, y) { return y.n - x.n; });
        b = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Surveyor</th><th class="num">Checked · 30 d</th><th class="num">Owner calls</th><th class="num">Site checks</th><th class="num">Avg call</th><th class="num">Backlog in their colonies</th></tr></thead><tbody>' + ppl.map(function (x, i) { return '<tr><td class="muted">' + (i + 1) + '</td><td><span class="row-b">' + CK.av(x.a) + '<span><b>' + esc(x.a.name) + '</b><small class="muted"> ' + esc(x.a.title) + '</small></span></span></td><td class="num"><b>' + x.n + '</b></td><td class="num">' + x.calls + '</td><td class="num">' + x.visits + '</td><td class="num">' + (x.mins ? x.mins.toFixed(1) + ' m' : '—') + '</td><td class="num">' + x.backlog + '</td></tr>'; }).join('') + '</tbody></table></div>';
      }
      return head + tiles + tabs + b;
    },
    mount: function (el, r) {
      if (r.id === 'focus') return mountFocus(el, r);
      el.addEventListener('click', function (e) { var t = e.target.closest('[data-smtab]'); if (t) { SM.tab = t.dataset.smtab; CK.render(); } });
      el.addEventListener('change', function (e) { if (e.target.matches('[data-smwho]')) { SM.who = e.target.value; CK.render(); } });
    },
    unmount: function () { clearInterval(SM.tm); }
  };
  function focus() {
    var q = surveyQueue(), r = CK.route(); if (!q.length) return CK.empty('Nothing to check', 'Every listing in these colonies has a fresh check.', '<a class="btn" href="#/survey">Back to survey master</a>');
    var idx = 0; if (r.sub) q.forEach(function (p, i) { if (p.id === r.sub) idx = i; }); SM.idx = idx; var p = q[idx], o = CK.owner(p.ownerId), last = o.comms.filter(function (c) { return c.text.indexOf(p.code) >= 0; })[0] || o.comms[0];
    if (SM.forP !== p.id) { SM.forP = p.id; SM.out = null; SM.note = ''; SM.price = ''; SM.started = Date.now(); }
    var left = Math.round((q.length - idx) * 4), plotF = S().fields.filter(function (f) { return f.id === 'F6'; })[0]; p.cf = p.cf || {};
    var outs = [['same', 'Still available', 'check'], ['price', 'Price changed', 'rupee'], ['gone', 'Let out or sold', 'door'], ['noans', 'No answer', 'phone'], ['busy', 'Switched off', 'offline'], ['later', 'Call back later', 'clock']];
    return '<div class="focus"><header class="fo-top"><a class="btn ghost sm" href="#/survey">' + ic('left', 14) + 'Survey master</a><span class="fo-prog"><b>Check ' + (idx + 1) + ' of ' + q.length + '</b><span class="prog"><span style="width:' + ((idx) / q.length * 100) + '%"></span></span></span><span class="chip chip-s">' + ic('clock', 13) + 'aim ≈ 4 m</span><span class="chip chip-s" id="fo-t">' + ic('clock', 13) + '0:00</span><span class="chip chip-s">≈ ' + left + ' m left</span></header>' +
      '<div class="fo-g"><section class="fo-card"><div class="fo-ready"><p class="muted sm">Ready to call</p><h1>' + esc(o.name) + '</h1><p class="dial-n">' + esc(o.phone) + '</p><div class="btnrow"><button type="button" class="btn primary big" data-fo="dial">' + ic('phone', 18) + 'Dial owner</button></div><div class="btnrow"><button type="button" class="btn ghost sm" data-fo="skip">' + ic('skip', 14) + 'Skip</button><a class="btn ghost sm" href="#/survey">Pause</a></div></div>' +
      (last ? '<div class="lastrem">' + ic('chat', 15) + '<div><small>Last remark · ' + CK.ago(last.at) + '</small><p>' + esc(last.text) + '</p></div></div>' : '') +
      '<div class="fo-l"><img src="' + CK.ph(p.photos[0], 1) + '" alt="" width="120" height="84"><div><b class="mono">' + p.code + '</b> ' + CK.verPill(p) + '<p>' + esc(CK.cfg(p)) + ' · ' + esc(p.floor) + ' · ' + esc(p.plot) + ', ' + esc(CK.area(p.area).name) + '</p><p><b>' + CK.priceLong(p) + '</b> · free from ' + CK.date(p.availFrom) + '</p></div></div>' + CK.kv([['Owner prefers', esc(o.pref)], ['Parking', esc(p.parking)], ['Plot size', p.cf.F6 ? esc(p.cf.F6) + ' sq yd' : '<button type="button" class="add-in" data-fo="plot">+ Add plot size</button>'], ['Lift', p.cf.F4 ? esc(p.cf.F4) : '<button type="button" class="add-in" data-fo="lift">+ Add</button>']]) + '</section>' +
      '<section class="fo-card"><h2>How did it go?</h2><div class="ogrid">' + outs.map(function (x, i) { return '<button type="button" data-fout="' + x[0] + '" class="' + (SM.out === x[0] ? 'on' : '') + '" aria-pressed="' + (SM.out === x[0]) + '">' + ic(x[2], 20) + '<span>' + x[1] + '</span><kbd>' + (i + 1) + '</kbd></button>'; }).join('') + '</div>' +
      (SM.out === 'price' ? '<div class="fld"><label for="fo-p">New price the owner said (₹)</label><input id="fo-p" inputmode="numeric" value="' + esc(SM.price) + '" placeholder="' + p.price + '"></div>' : '') +
      (SM.out ? '<p class="nextsug">' + ic('spark', 14) + { same: 'Next: the Verified badge restarts for ' + CK.window(p) + ' days. Book a photo visit if photos are older than a year.', price: 'Next: the new price goes live and matching re-scores open briefs.', gone: 'Next: the listing leaves matching and the website; the owner stays for future listings.', noans: 'Next: we try again in ' + S().settings.missedCallRetryH + ' h. The listing stays live — a missed call never unpublishes it.', busy: 'Next: retry in ' + S().settings.missedCallRetryH + ' h; after ' + S().settings.maxMisses + ' misses a person decides.', later: 'Next: a callback task for tomorrow, 11 am.' }[SM.out] + '</p>' : '') +
      '<div class="fld"><label for="fo-n">Note for the next person</label><textarea id="fo-n" rows="2" placeholder="Owner in Dubai till Jan; caretaker has keys">' + esc(SM.note) + '</textarea></div><p class="err" id="fo-err" role="alert"></p><button type="button" class="btn primary big" data-fo="save">Save &amp; next<kbd>N</kbd></button></section></div></div>';
  }
  function mountFocus(el) {
    var q = surveyQueue(), p = q[SM.idx]; if (!p) return;
    clearInterval(SM.tm); SM.tm = setInterval(function () { var t = document.getElementById('fo-t'); if (!t) return clearInterval(SM.tm); var sec = Math.floor((Date.now() - SM.started) / 1000); t.lastChild.textContent = Math.floor(sec / 60) + ':' + (sec % 60 < 10 ? '0' : '') + sec % 60; t.classList.toggle('late', sec > 240); }, 1000);
    el.addEventListener('input', function (e) { if (e.target.id === 'fo-n') SM.note = e.target.value; if (e.target.id === 'fo-p') SM.price = e.target.value; });
    function next() { var nx = q[SM.idx + 1]; CK.go(nx ? '#/survey/focus/' + nx.id : '#/survey'); }
    function save() {
      var err = el.querySelector('#fo-err'); if (!SM.out) { err.textContent = 'Pick how it went (keys 1–6).'; return; }
      var o = CK.owner(p.ownerId), me = CK.me().id, now = CK.now(), txt = { same: 'still available, same price', price: 'price changed', gone: 'already let out or sold', noans: 'no answer', busy: 'switched off', later: 'asked to call back' }[SM.out];
      if (SM.out === 'price') { var n = +String(SM.price).replace(/\D/g, ''); if (!n) { err.textContent = 'Add the new price the owner said.'; return; } CK.act.setPrice(p, n); }
      if (SM.out === 'same' || SM.out === 'price') { p.ver = { status: 'verified', at: now, by: me, checks: { owner: 1, price: 1, avail: 1 }, geo: p.ver.geo, photos: p.ver.photos || 0, reject: null, via: 'call' }; p.ownerLastReply = now; }
      if (SM.out === 'gone') p.status = p.deal === 'rent' ? 'let' : 'sold';
      if (SM.out === 'later') CK.addTask({ kind: 'verify', title: 'Owner callback — ' + p.code, prop: p.id, due: CK.dayStart(now) + CK.DAY + 11 * 36e5, who: me });
      o.comms.unshift({ at: now, kind: 'call', text: 'Check call · ' + p.code + ' — ' + txt + (SM.note ? '. ' + SM.note : ''), by: me });
      CK.audit('Survey check (call)', p.code, txt); CK.emit('verify'); CK.toast(p.code + ' · ' + txt); SM.forP = null; next();
    }
    el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-fout],[data-fo]'); if (!t) return;
      if (t.dataset.fout) { SM.out = t.dataset.fout; CK.render(); return; }
      var a = t.dataset.fo;
      if (a === 'dial') CK.toast('Calling ' + CK.owner(p.ownerId).name + ' — logged when you save');
      if (a === 'skip') { SM.forP = null; next(); }
      if (a === 'save') save();
      if (a === 'plot' || a === 'lift') { if (a === 'lift') return CK.menu(t, [{ label: 'Yes' }, { label: 'No' }], function (it) { p.cf.F4 = it.label; CK.emit('prop'); }); var m = CK.modal('<h2 id="modal-t">Plot size</h2><div class="fld"><label for="ps">Square yards</label><input id="ps" inputmode="numeric" placeholder="300"></div><div class="m-actions"><button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn primary" id="ps-ok">Save</button></div>'); m.querySelector('#ps-ok').onclick = function () { var v = +m.querySelector('#ps').value.replace(/\D/g, ''); if (!v) return; p.cf.F6 = v; CK.closeModal(); CK.emit('prop'); CK.toast('Plot size saved · ' + CK.grp(v * 9) + ' sq ft'); }; }
    });
    CK.keyHandler = function (e) { var o = ['same', 'price', 'gone', 'noans', 'busy', 'later'], n = +e.key; if (n >= 1 && n <= 6) { SM.out = o[n - 1]; CK.render(); e.preventDefault(); } if (e.key === 'n' || e.key === 'N') { save(); e.preventDefault(); } };
  }

  /* ============ WEBSITE ANALYTICS ============ */
  var WV = { range: 30, tab: 'overview' };
  function series(days, seed) { var r = CK.rng(seed), out = []; for (var i = days - 1; i >= 0; i--) { var d = new Date(CK.now() - i * CK.DAY).getDay(), base = 420 + (d === 0 || d === 6 ? 140 : 0) + (days - i) * 1.6; out.push(Math.round(base * (0.85 + r() * .3))); } return out; }
  function lineChart(a, b, w, h) { var max = Math.max.apply(null, a) * 1.1; function path(v) { return v.map(function (x, i) { return (i ? 'L' : 'M') + (i / (v.length - 1) * w).toFixed(1) + ' ' + (h - x / max * h).toFixed(1); }).join(' '); } var bm = Math.max.apply(null, b) * 3; return '<svg class="lchart" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" role="img" aria-label="Sessions and enquiries per day"><path d="' + path(a) + ' L' + w + ' ' + h + ' L0 ' + h + 'Z" class="la"/><path d="' + path(a) + '" class="ll"/><path d="' + b.map(function (x, i) { return (i ? 'L' : 'M') + (i / (b.length - 1) * w).toFixed(1) + ' ' + (h - x / bm * h).toFixed(1); }).join(' ') + '" class="lb"/></svg>'; }
  CK.V.web = {
    title: 'Website analytics',
    render: function () {
      var s = S(), n = WV.range, sess = series(n, 31 + n), prev = series(n, 7 + n), enq = sess.map(function (x, i) { return Math.round(x * (0.018 + (i % 7) * .001)); });
      var tot = sess.reduce(function (a, b) { return a + b; }, 0), ptot = prev.reduce(function (a, b) { return a + b; }, 0), etot = enq.reduce(function (a, b) { return a + b; }, 0), users = Math.round(tot * .71);
      var src = [['Organic search', .46, .024], ['Direct', .17, .031], ['Basera / KeyHaat referrals', .12, .019], ['WhatsApp shares', .1, .041], ['Instagram', .09, .011], ['Partner links', .06, .028]];
      var lp = s.props.filter(function (p) { return p.status !== 'inactive'; }).map(function (p) { var v = Math.round(p.views * n / 30), e = Math.max(0, Math.round(p.enquiries * n / 30)); return { p: p, v: v, e: e, c: v ? e / v : 0 }; }).sort(function (a, b) { return b.v - a.v; });
      var cold = lp.filter(function (x) { return x.v > 300 && x.c < .01; }).slice(0, 5);
      var searches = [['3 bhk vasant vihar under 1.5 lakh', 214, 6], ['builder floor gk 2 for sale', 166, 4], ['2 bhk rent hauz khas', 151, 3], ['independent house panchsheel park', 97, 1], ['pet friendly flat south delhi', 88, 9], ['studio green park', 71, 2], ['4 bhk sector 54 gurugram', 64, 3], ['office space saket 2000 sq ft', 42, 0], ['furnished 1 bhk malviya nagar', 39, 0]];
      var head = '<div class="ph"><div><h1>Website analytics</h1><p class="muted">The Amaltas website, first-party: sessions, where they come from, which listing pages turn into enquiries.</p></div><div class="ph-a">' + seg('wr', [['7', '7 days'], ['30', '30 days'], ['90', '90 days']], String(n)) + '<button type="button" class="btn sm" data-wexp>' + ic('upload', 14) + 'Export visitors</button></div></div>';
      var tiles = '<section class="ktiles">' + kt('Sessions', CK.grp(tot), 'vs previous ' + n + ' days', Math.round((tot / ptot - 1) * 100), '#/web', sess.slice(-14), true) + kt('Visitors', CK.grp(users), '71% new', 6, '#/web', null, true) + kt('Enquiries', etot, 'forms, chat, WhatsApp taps', 9, '#/leads', enq.slice(-14), true) + kt('Conversion', (etot / tot * 100).toFixed(2) + '%', 'session → enquiry', 3, '#/web', null, true) + '</section>';
      var chart = '<section class="panel"><div class="panel-h"><h2>Sessions and enquiries per day</h2><span class="legend-i"><i class="la-i"></i>Sessions <i class="lb-i"></i>Enquiries</span></div>' + lineChart(sess, enq, 800, 180) + '</section>';
      var srcT = '<section class="panel"><div class="panel-h"><h2>Where visitors come from</h2></div><table class="tbl mini"><thead><tr><th>Source</th><th class="num">Sessions</th><th class="num">Enquiries</th><th class="num">Conv.</th></tr></thead><tbody>' + src.map(function (x) { var se = Math.round(tot * x[1]), en = Math.round(se * x[2]); return '<tr><td>' + esc(x[0]) + '</td><td class="num">' + CK.grp(se) + '</td><td class="num">' + en + '</td><td class="num">' + (x[2] * 100).toFixed(1) + '%</td></tr>'; }).join('') + '</tbody></table></section>';
      var topT = '<section class="panel span2"><div class="panel-h"><h2>Listing pages</h2><span class="muted sm">views → enquiries, per listing</span></div><div class="tbl-scroll"><table class="tbl"><thead><tr><th>Listing</th><th class="num">Views</th><th class="num">Enquiries</th><th>Conversion</th><th class="hide-m">Fresh</th></tr></thead><tbody>' + lp.slice(0, 10).map(function (x) { return '<tr><td>' + CK.chipProp(x.p, CK.price(x.p)) + '</td><td class="num">' + CK.grp(x.v) + '</td><td class="num">' + x.e + '</td><td><span class="bm"><span class="fbar-c"><span style="width:' + Math.min(100, x.c * 2000) + '%"></span></span>' + (x.c * 100).toFixed(1) + '%</span></td><td class="hide-m">' + CK.ring(CK.fresh(x.p), 26) + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
      var coldT = '<section class="panel"><div class="panel-h"><h2>Seen a lot, asked about rarely</h2><span class="muted sm">price or photos may be the problem</span></div>' + (cold.length ? cold.map(function (x) { return '<div class="row-b">' + CK.chipProp(x.p) + '<span class="muted sm">' + CK.grp(x.v) + ' views · ' + x.e + ' enquiries</span><span class="grow"></span><button type="button" class="btn sm ghost" data-peek="prop:' + x.p.id + '">Review</button></div>'; }).join('') : '<p class="muted">Every busy page converts.</p>') + '</section>';
      var srT = '<section class="panel span2"><div class="panel-h"><h2>What people search for on the site</h2><span class="muted sm">zero results = a gap in inventory</span></div><table class="tbl mini"><thead><tr><th>Search</th><th class="num">Times</th><th class="num">Results</th></tr></thead><tbody>' + searches.map(function (x) { return '<tr' + (x[2] ? '' : ' class="gap"') + '><td>“' + esc(x[0]) + '”</td><td class="num">' + Math.round(x[1] * n / 30) + '</td><td class="num">' + (x[2] ? x[2] : '<span class="pill t-amber">0 · gap</span>') + '</td></tr>'; }).join('') + '</tbody></table></section>';
      return head + tiles + '<div class="rep-g"><div class="span2">' + chart + '</div>' + srcT + topT + coldT + srT + '</div>';
    },
    mount: function (el) { el.addEventListener('click', function (e) { var t = e.target.closest('[data-wr],[data-wexp]'); if (!t) return; if (t.dataset.wr) { WV.range = +t.dataset.wr; CK.render(); } else { CK.audit('Exported website visitors', WV.range + ' days'); CK.toast('Visitor export ready (CSV)'); } }); }
  };

  /* ============ SEARCH RANKINGS (Search Console) ============ */
  var GV = { tab: 'queries', q: '', page: null };
  function gscData() {
    var r = CK.rng(4242), rows = [], tmpl = [['{b} bhk for rent in {a}', 'rent'], ['{b} bhk flat for sale {a}', 'buy'], ['builder floor for sale in {a}', 'buy'], ['flats for rent {a}', 'rent'], ['{a} rent', 'rent'], ['independent house {a}', 'buy'], ['{a} property rates', 'buy'], ['furnished flat {a}', 'rent']];
    CK.AREAS.forEach(function (a, i) { tmpl.forEach(function (t, k) { if (r() < .55) return; var pos = +(2 + r() * 26).toFixed(1), prev = +(pos + (r() - .45) * 8).toFixed(1), imp = Math.round((3000 - pos * 90) * (0.4 + r()) * a.tier); if (imp < 60) imp = 60 + Math.round(r() * 200); var ctr = Math.max(.002, (pos < 3 ? .22 : pos < 6 ? .09 : pos < 10 ? .035 : .008) * (0.7 + r() * .6)); rows.push({ q: t[0].replace('{b}', 2 + (k % 3)).replace('{a}', a.short.toLowerCase()), page: '/' + (t[1] === 'rent' ? 'rent' : 'buy') + '/' + a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), pos: pos, prev: prev, imp: imp, clicks: Math.round(imp * ctr), ctr: ctr }); }); });
    return rows;
  }
  CK.V.seo = {
    title: 'Search rankings',
    render: function () {
      var rows = gscData(), tc = 0, ti = 0, pw = 0; rows.forEach(function (x) { tc += x.clicks; ti += x.imp; pw += x.pos * x.imp; });
      var list = GV.tab === 'striking' ? rows.filter(function (x) { return x.pos >= 8 && x.pos <= 20; }).sort(function (a, b) { return b.imp - a.imp; }) : GV.tab === 'gained' ? rows.filter(function (x) { return x.prev - x.pos >= 1.5; }).sort(function (a, b) { return (b.prev - b.pos) - (a.prev - a.pos); }) : GV.tab === 'lost' ? rows.filter(function (x) { return x.pos - x.prev >= 1.5; }).sort(function (a, b) { return (b.pos - b.prev) - (a.pos - a.prev); }) : rows.slice().sort(function (a, b) { return b.clicks - a.clicks; });
      if (GV.q) list = list.filter(function (x) { return (x.q + x.page).indexOf(GV.q.toLowerCase()) >= 0; });
      var head = '<div class="ph"><div><h1>Search rankings</h1><p class="muted">How the website’s colony and listing pages rank on Google, last 28 days. Synced daily at 6:10 am.</p></div><div class="ph-a"><button type="button" class="btn sm" data-gsync>' + ic('undo', 14) + 'Sync now</button></div></div>';
      var tiles = '<section class="ktiles">' + kt('Clicks', CK.grp(tc), 'last 28 days', 11, '#/seo', [3, 4, 4, 5, 6, 6, 7], true) + kt('Impressions', CK.grp(ti), 'times shown', 8, '#/seo', [5, 5, 6, 6, 7, 7, 8], true) + kt('CTR', (tc / ti * 100).toFixed(1) + '%', 'click-through', 2, '#/seo', null, true) + kt('Average position', (pw / ti).toFixed(1), 'lower is better', -4, '#/seo', null, false) + '<a class="ktile k-accent" href="#/seo" data-gtab="striking"><span class="kt-l">Striking distance</span><span class="kt-n">' + rows.filter(function (x) { return x.pos >= 8 && x.pos <= 20; }).length + '</span><span class="kt-d">queries at 8–20, a push from page one</span></a></section>';
      var tabs = '<div class="tabs" role="tablist">' + [['queries', 'Queries'], ['pages', 'Pages'], ['striking', 'Striking distance'], ['gained', 'Gained'], ['lost', 'Lost']].map(function (t) { return '<button type="button" role="tab" data-gtab="' + t[0] + '" aria-selected="' + (GV.tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div><div class="fbar"><label class="search"><span class="sr">Filter queries</span>' + ic('search', 15) + '<input data-gq value="' + esc(GV.q) + '" placeholder="Filter: a colony, “rent”, “builder floor”"></label></div>';
      function arrow(x) { var d = +(x.prev - x.pos).toFixed(1); return d >= .5 ? '<span class="tx-ok">▲' + d + '</span>' : d <= -.5 ? '<span class="tx-bad">▼' + (-d) + '</span>' : '<span class="muted">·</span>'; }
      var body;
      if (GV.tab === 'pages') { var pg = {}; rows.forEach(function (x) { var p = pg[x.page] = pg[x.page] || { page: x.page, c: 0, i: 0, pw: 0, n: 0 }; p.c += x.clicks; p.i += x.imp; p.pw += x.pos * x.imp; p.n++; }); body = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Page</th><th class="num">Queries</th><th class="num">Clicks</th><th class="num">Impressions</th><th class="num">Avg position</th><th></th></tr></thead><tbody>' + Object.keys(pg).map(function (k) { return pg[k]; }).sort(function (a, b) { return b.c - a.c; }).filter(function (p) { return !GV.q || p.page.indexOf(GV.q.toLowerCase()) >= 0; }).map(function (p) { return '<tr><td class="mono sm">' + esc(p.page) + '</td><td class="num">' + p.n + '</td><td class="num">' + CK.grp(p.c) + '</td><td class="num">' + CK.grp(p.i) + '</td><td class="num">' + (p.pw / p.i).toFixed(1) + '</td><td class="num"><button type="button" class="btn sm ghost" data-gpage="' + esc(p.page) + '">Queries</button></td></tr>'; }).join('') + '</tbody></table></div>'; }
      else body = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Query</th><th class="hide-m">Page</th><th class="num">Position</th><th class="num">Change</th><th class="num">Clicks</th><th class="num hide-m">Impressions</th><th class="num">CTR</th></tr></thead><tbody>' + list.slice(0, 60).map(function (x) { return '<tr><td>' + esc(x.q) + (x.pos >= 8 && x.pos <= 20 ? ' <span class="pill t-accent">8–20</span>' : '') + '</td><td class="hide-m mono sm">' + esc(x.page) + '</td><td class="num"><b>' + x.pos.toFixed(1) + '</b></td><td class="num">' + arrow(x) + '</td><td class="num">' + x.clicks + '</td><td class="num hide-m">' + CK.grp(x.imp) + '</td><td class="num">' + (x.ctr * 100).toFixed(1) + '%</td></tr>'; }).join('') + '</tbody></table></div>' + (list.length ? '' : CK.empty('No queries here', 'Clear the filter or pick another tab.'));
      return head + tiles + tabs + body;
    },
    mount: function (el) {
      el.addEventListener('click', function (e) {
        var t = e.target.closest('[data-gtab],[data-gsync],[data-gpage]'); if (!t) return;
        if (t.dataset.gtab) { e.preventDefault(); GV.tab = t.dataset.gtab; CK.render(); }
        if (t.dataset.gsync !== undefined) { CK.toast('Synced — rankings up to yesterday'); CK.audit('Synced search rankings'); }
        if (t.dataset.gpage) { var pg = t.dataset.gpage, rs = gscData().filter(function (x) { return x.page === pg; }); CK.modal('<h2 id="modal-t">' + esc(pg) + '</h2><table class="tbl mini"><thead><tr><th>Query</th><th class="num">Pos.</th><th class="num">Clicks</th></tr></thead><tbody>' + rs.map(function (x) { return '<tr><td>' + esc(x.q) + '</td><td class="num">' + x.pos.toFixed(1) + '</td><td class="num">' + x.clicks + '</td></tr>'; }).join('') + '</tbody></table><div class="m-actions"><button type="button" class="btn" data-close-modal>Close</button></div>', { wide: true }); }
      });
      el.addEventListener('input', function (e) { if (e.target.matches('[data-gq]')) { GV.q = e.target.value; clearTimeout(GV.t); GV.t = setTimeout(function () { var p = e.target.selectionStart; CK.render(); var i = document.querySelector('[data-gq]'); i.focus(); i.setSelectionRange(p, p); }, 160); } });
    }
  };

  /* ============ CONVERSATIONS ============ */
  var CV = { f: 'open', ch: '', id: null };
  function convos() { CK.ensure(); return S().convos; }
  CK.V.inbox = {
    title: 'Conversations',
    render: function (r) {
      CK.syncBridges(); var all = convos(), me = CK.me().id;
      var list = all.filter(function (c) { return (CV.f === 'all' || (CV.f === 'open' && c.st === 'open') || (CV.f === 'bot' && c.st === 'bot') || (CV.f === 'mine' && c.st === 'mine' && c.who === me) || (CV.f === 'resolved' && c.st === 'resolved') || (CV.f === 'mine' && c.st === 'mine' && me === 'A1')) && (!CV.ch || c.ch === CV.ch); }).sort(function (a, b) { return b.msgs[b.msgs.length - 1].at - a.msgs[a.msgs.length - 1].at; });
      if (r.id) CV.id = r.id; var c = all.filter(function (x) { return x.id === CV.id; })[0] || list[0]; if (c) CV.id = c.id;
      var cnt = function (st) { return all.filter(function (x) { return x.st === st; }).length; };
      var head = '<div class="ph"><div><h1>Conversations</h1><p class="muted">WhatsApp and website chat in one inbox. The assistant answers first; anyone can take over, and hand back when done.</p></div></div>';
      var left = '<aside class="ib-l"><div class="ib-f" role="tablist">' + [['open', 'Waiting', cnt('open')], ['bot', 'Assistant', cnt('bot')], ['mine', 'Mine', cnt('mine')], ['resolved', 'Done', cnt('resolved')], ['all', 'All', all.length]].map(function (x) { return '<button type="button" role="tab" data-cvf="' + x[0] + '" aria-selected="' + (CV.f === x[0]) + '">' + x[1] + '<span class="cnt">' + x[2] + '</span></button>'; }).join('') + '</div><div class="ib-ch">' + [['', 'All'], ['wa', 'WhatsApp'], ['web', 'Website chat']].map(function (x) { return '<button type="button" class="chipb' + (CV.ch === x[0] ? ' on' : '') + '" data-cvch="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div><ul class="ib-list">' + (list.length ? list.map(function (x) { var last = x.msgs[x.msgs.length - 1]; return '<li><a href="#/inbox/' + x.id + '" class="' + (c && x.id === c.id ? 'on' : '') + '"' + (c && x.id === c.id ? ' aria-current="true"' : '') + '>' + CK.av(x) + '<span class="ib-m"><b>' + esc(x.name) + '</b><small>' + (last.from === 'bot' ? 'Assistant: ' : last.from === 'us' ? 'You: ' : '') + esc(last.text) + '</small></span><span class="ib-r"><time>' + CK.ago(last.at).replace(' ago', '') + '</time>' + ic(x.ch === 'wa' ? 'chat' : 'sparkles', 13) + (x.unread ? '<i class="ub">' + x.unread + '</i>' : '') + '</span></a></li>'; }).join('') : '<li class="muted pad">Nothing here.</li>') + '</ul></aside>';
      if (!c) return head + '<div class="inbox">' + left + '<section class="ib-c">' + CK.empty('No conversation selected', 'Pick one on the left.') + '</section></div>';
      c.unread = 0;
      var L = c.lead ? CK.lead(c.lead) : null, who = c.who ? CK.agent(c.who) : null;
      var stateTxt = { bot: 'The assistant is handling this', open: 'Waiting for a person', mine: 'With ' + (who ? who.name.split(' ')[0] : 'you'), resolved: 'Done' }[c.st];
      var thread = '<section class="ib-c"><header class="ib-h">' + CK.av(c) + '<div class="grow"><b>' + esc(c.name) + '</b><small class="muted">' + (c.ch === 'wa' ? 'WhatsApp · ' + esc(c.phone) : 'Website chat' + (c.page ? ' · on ' + esc(c.page) : '')) + ' · ' + stateTxt + '</small></div>' + (c.st === 'bot' || c.st === 'open' ? '<button type="button" class="btn sm primary" data-cv="take">Take over</button>' : '') + (c.st === 'mine' ? '<button type="button" class="btn sm" data-cv="back">Hand back to assistant</button>' : '') + (c.st !== 'resolved' ? '<button type="button" class="btn sm ghost" data-cv="done">' + ic('check', 14) + 'Done</button>' : '<button type="button" class="btn sm ghost" data-cv="reopen">Reopen</button>') + '<button type="button" class="ibtn" data-cv="assign" aria-label="Assign">' + ic('users', 16) + '</button></header><ol class="bubbles" aria-live="polite">' + c.msgs.map(function (m) { return '<li class="b-' + m.from + '"><p>' + esc(m.text) + '</p><small>' + (m.from === 'bot' ? 'Assistant · ' : m.from === 'us' && m.by ? esc(CK.agent(m.by).name.split(' ')[0]) + ' · ' : m.from === 'sys' ? '' : '') + CK.time(m.at) + '</small></li>'; }).join('') + '</ol>' +
        (c.st === 'resolved' ? '<p class="muted sm pad">This conversation is done. Reopen to reply.</p>' : '<div class="ib-comp"><label class="sr" for="cv-t">Reply</label><textarea id="cv-t" rows="2" placeholder="' + (c.st === 'bot' ? 'Typing takes over from the assistant…' : 'Write a reply') + '"></textarea><div class="row-b"><button type="button" class="btn sm ghost" data-cv="tpl">' + ic('file', 14) + 'Templates</button><span class="grow"></span><span class="muted xs">Enter to send</span><button type="button" class="btn sm primary" data-cv="send">Send</button></div></div>') + '</section>';
      var ms = L ? CK.matches(L).slice(0, 3) : [];
      var right = '<aside class="ib-r2"><section class="card"><div class="card-h"><h3>Contact</h3></div>' + CK.kv([['Channel', c.ch === 'wa' ? 'WhatsApp' : 'Website chat'], ['Phone', esc(c.phone)], c.page ? ['Was looking at', '<span class="mono sm">' + esc(c.page) + '</span>'] : null, ['Assigned', who ? CK.chipAgent(who) : '<span class="muted">Nobody yet</span>']]) + '</section>' +
        (L ? '<section class="card"><div class="card-h"><h3>Enquiry</h3></div><div class="row-b">' + CK.chipLead(L) + CK.stagePill(L) + '</div><p class="sm" style="margin-top:6px">' + CK.wants(L) + '</p>' + (ms.length ? '<h4 class="sh sm">Homes to share</h4>' + ms.map(function (m) { return '<div class="row-b">' + CK.chipProp(m.p) + '<span class="grow"></span>' + CK.score(m.score) + '<button type="button" class="ibtn" data-cv="share" data-pid="' + m.p.id + '" aria-label="Share ' + m.p.code + '">' + ic('arrow', 15) + '</button></div>'; }).join('') : '') + '</section>' : '<section class="card"><div class="card-h"><h3>Not an enquiry yet</h3></div><p class="muted sm">Turn this chat into an enquiry; what they asked for is filled in from the messages.</p><div class="btnrow"><button type="button" class="btn primary sm" data-cv="lead">' + ic('plus', 14) + 'Create enquiry from chat</button></div></section>') + '</aside>';
      return head + '<div class="inbox">' + left + thread + right + '</div>';
    },
    mount: function (el) {
      var c = convos().filter(function (x) { return x.id === CV.id; })[0]; var me = CK.me();
      function post(text) { c.msgs.push({ from: 'us', text: text, at: CK.now(), by: me.id }); if (c.st !== 'mine') { c.st = 'mine'; c.who = me.id; c.msgs.splice(c.msgs.length - 1, 0, { from: 'sys', text: me.name.split(' ')[0] + ' took over from the assistant', at: CK.now() }); } if (c.lead) CK.tl(CK.lead(c.lead), 'wa', (c.ch === 'wa' ? 'WhatsApp' : 'Chat') + ' — “' + text.slice(0, 80) + '”'); CK.audit('Replied in conversation', c.id); CK.emit('convo'); }
      el.addEventListener('click', function (e) {
        var t = e.target.closest('[data-cvf],[data-cvch],[data-cv]'); if (!t) return;
        if (t.dataset.cvf) { CV.f = t.dataset.cvf; CV.id = null; CK.go('#/inbox'); CK.render(); return; }
        if (t.dataset.cvch !== undefined) { CV.ch = t.dataset.cvch; CK.render(); return; }
        var a = t.dataset.cv; if (!c) return;
        if (a === 'take') { c.st = 'mine'; c.who = me.id; c.msgs.push({ from: 'sys', text: me.name.split(' ')[0] + ' took over from the assistant', at: CK.now() }); CK.audit('Took over conversation', c.id); CK.emit('convo'); }
        if (a === 'back') { c.st = 'bot'; c.msgs.push({ from: 'sys', text: 'Handed back to the assistant', at: CK.now() }); CK.emit('convo'); CK.toast('The assistant has it again'); }
        if (a === 'done') { var prev = c.st; c.st = 'resolved'; CK.audit('Resolved conversation', c.id); CK.emit('convo'); CK.toast('Marked done', { undo: function () { c.st = prev; CK.emit('convo'); } }); }
        if (a === 'reopen') { c.st = 'mine'; c.who = me.id; CK.emit('convo'); }
        if (a === 'send') { var ta = el.querySelector('#cv-t'); if (!ta.value.trim()) { ta.focus(); return; } post(ta.value.trim()); }
        if (a === 'assign') CK.menu(t, [{ head: 'Assign to' }].concat(S().agents.filter(function (x) { return x.role === 'telecaller' || x.role === 'manager'; }).map(function (x) { return { label: x.name, id: x.id, on: c.who === x.id }; })), function (it) { c.who = it.id; c.st = c.st === 'resolved' ? 'resolved' : 'mine'; CK.audit('Assigned conversation', c.id, it.label); CK.emit('convo'); CK.toast('Assigned to ' + it.label); });
        if (a === 'tpl') CK.menu(t, [{ head: 'Templates' }].concat(S().tpl.filter(function (x) { return x.ch === 'wa'; }).map(function (x) { return { label: x.name, id: x.id, hint: x.uses + ' sent' }; })), function (it) { var tp = S().tpl.filter(function (x) { return x.id === it.id; })[0], L = c.lead ? CK.lead(c.lead) : null; var txt = tp.body.replace(/\{\{first_name\}\}/g, c.name.split(' ')[0]).replace(/\{\{agent\}\}/g, me.name.split(' ')[0]).replace(/\{\{count\}\}/g, '3').replace(/\{\{day\}\}/g, 'Saturday').replace(/\{\{time\}\}/g, '11 am').replace(/\{\{field_agent\}\}/g, 'Kabir').replace(/\{\{list\}\}/g, L ? CK.matches(L).slice(0, 3).map(function (m) { return m.p.code; }).join(', ') : 'three homes').replace(/\{\{\w+\}\}/g, '…'); var ta = el.querySelector('#cv-t'); ta.value = txt; ta.focus(); });
        if (a === 'share') { var p = CK.prop(t.dataset.pid); post(CK.cfg(p) + ' in ' + CK.area(p.area).name + ' — ' + CK.priceLong(p) + (CK.ver(p) === 'fresh' ? ', verified ' + CK.verAge(p) + ' days ago' : '') + '. Want to see it this week?'); CK.toast('Shared ' + p.code); }
        if (a === 'lead') {
          var txt = c.msgs.filter(function (m) { return m.from === 'them'; }).map(function (m) { return m.text; }).join(' '), b = CK.parseBrief(txt + ' ' + (c.page || '').replace(/[\/-]/g, ' '));
          if (!b.sectors.length) { b.sectors = ['HK']; b.r = 'sd'; }
          var bl = CK.briefLead(b); bl.req.note = 'From chat: “' + txt.slice(0, 120) + '”';
          var L2 = CK.act.newLead({ name: c.name, phone: c.phone, src: c.ch === 'wa' ? 'WhatsApp' : 'Website chat', found: c.page ? 'Website · ' + c.page : 'WhatsApp', intent: b.intent, req: bl.req, reqDone: true });
          c.lead = L2.id; CK.tl(L2, 'wa', 'Chat transcript linked · ' + c.msgs.length + ' messages'); CK.emit('convo'); CK.toast('Enquiry ' + L2.id + ' created · ' + CK.matches(L2).length + ' homes match');
        }
      });
      el.addEventListener('keydown', function (e) { if (e.target.id === 'cv-t' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); var b = el.querySelector('[data-cv="send"]'); if (b) b.click(); } });
    }
  };

  /* launch-site visits on the Trips page */
  var origTrips = CK.V.trips && CK.V.trips.render;
  if (origTrips) CK.V.trips.render = function (r) {
    var h = origTrips(r); if (r.id) return h; CK.syncBridges(); var v = S().launchVisits || [];
    if (!v.length) return h;
    var block = '<section class="tgroup"><h2 class="sh">Booked on the launch site<b>' + v.length + '</b></h2><div class="trows">' + v.map(function (x) { return '<div class="trow lv">' + ic('flag', 16) + '<span class="tr-m"><b>' + esc(x.name || 'Visitor') + '</b><small>' + esc(x.unit || '') + ' · ' + esc(x.slot || '') + '</small></span>' + CK.pill('From the launch site', 'violet') + '<span class="muted sm">' + esc(x.source || '') + '</span></div>'; }).join('') + '</div></section>';
    return h.replace('<section class="tgroup">', block + '<section class="tgroup">');
  };
})();
