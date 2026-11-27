/* Revv · sold, then the papers. A deal runs eight steps from token to RC delivered, each with a date, an owner and a document
   slot. Stored in "revv:deals" ({ id, leadId, vehicleId, steps: [{ key, done, at, by }], track } plus extra fields), read by
   the buyer's tracking page (track.html). The model at the top works on its own; the deal desk below needs the dealer app. */
(function () {
  'use strict';
  var R = window.Revv, DAY = 864e5, KEY = 'revv:deals';
  var STEPS = [
    ['token', 'Token received', 'Booking amount in; the vehicle is held for you', 0, 'sales'],
    ['payment', 'Payment received', 'Balance paid, or the loan sanctioned', 2, 'sales'],
    ['loan', 'Loan disbursed', 'The bank pays the showroom', 4, 'finance'],
    ['forms', 'Forms 29 and 30 signed', 'Transfer forms signed by seller and buyer', 3, 'papers'],
    ['insurance', 'Insurance transferred', 'The policy moves to the new owner', 5, 'papers'],
    ['hypo', 'Hypothecation removed', 'The old loan is closed on the RC', 8, 'papers'],
    ['rtoapply', 'RC transfer applied', 'Filed at the RTO with Forms 29 and 30', 9, 'papers'],
    ['rc', 'RC delivered', 'The smart card is in your hands', 21, 'papers']
  ];
  var FIRST = ['Sunil', 'Neha', 'Arjun', 'Pooja', 'Rahul', 'Meera', 'Karan', 'Divya', 'Sameer', 'Lata', 'Imran', 'Tara'], LAST = ['K.', 'D.', 'M.', 'P.', 'S.', 'R.', 'T.', 'A.'];
  function sod(t) { var x = new Date(t); x.setHours(0, 0, 0, 0); return x.getTime(); }
  function meId() { return window.DEALER && DEALER.me ? DEALER.me() : R.get(R.K.me, 'redline'); }
  // a dealer's team: the sales lead from the dealer record plus two salespeople and a papers desk
  var TEAM = window.REVV_TEAM = function (dealer) {
    var d = R.dealer(dealer), r = R.rng('team-' + dealer), used = [String(d.rep || '').split(' ')[0]], pick = function () { var f, n = 0; do { f = FIRST[Math.floor(r() * FIRST.length)]; } while (used.indexOf(f) >= 0 && ++n < 60); used.push(f); return f + ' ' + LAST[Math.floor(r() * LAST.length)]; };
    var a = pick(), b = pick(), c = pick();
    return [{ name: d.rep, role: 'Sales lead' }, { name: a, role: 'Sales' }, { name: b, role: 'Sales' }, { name: c, role: 'Papers and RTO' }];
  };
  window.REVV_TEAM.ownerOf = function (lead) { if (lead.owner) return lead.owner; var t = TEAM(lead.dealer), r = R.rng(lead.id + 'owner')(); return t[r < 0.42 ? 0 : r < 0.74 ? 1 : 2].name; };
  function all() { return R.get(KEY, []); }
  function save(a) { R.set(KEY, a); }
  function code(id) { var r = R.rng(id + 'trk'), s = ''; for (var i = 0; i < 6; i++) s += 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(r() * 32)]; return s; }
  function make(lead, opts) {
    opts = opts || {}; var at = lead.soldAt || Date.now(), team = TEAM(lead.dealer), r = R.rng(lead.id + 'deal'), fin = opts.finance != null ? opts.finance : !!(lead.quote || r() < 0.45), hypo = opts.hypo != null ? opts.hypo : r() < 0.4;
    var owner = { sales: window.REVV_TEAM.ownerOf(lead), finance: 'Finance desk', papers: team[3].name }, id = 'DL-' + lead.id.replace(/^L/, '');
    return { id: id, leadId: lead.id, vehicleId: lead.listing, dealer: lead.dealer, buyer: lead.name, price: lead.price || (R.byId(lead.listing) || {}).price || 0, at: at, finance: fin, hypo: hypo, track: code(id),
      steps: STEPS.map(function (s) { var skip = (s[0] === 'loan' && !fin) || (s[0] === 'hypo' && !hypo); return { key: s[0], done: skip, skip: skip, at: skip ? at : null, by: owner[s[4]], due: sod(at) + s[3] * DAY + 18 * 3600e3, doc: null }; }) };
  }
  var M = window.DEALS = {
    STEPS: STEPS, TEAM: TEAM, all: all,
    get: function (id) { return all().filter(function (d) { return d.id === id; })[0]; },
    byLead: function (lid) { return all().filter(function (d) { return d.leadId === lid; })[0]; },
    byTrack: function (c) { c = String(c || '').toUpperCase(); return all().filter(function (d) { return d.track === c; })[0]; },
    forDealer: function (dl) { M.seed(dl); return all().filter(function (d) { return d.dealer === dl; }); },
    label: function (k) { return STEPS.filter(function (s) { return s[0] === k; })[0]; },
    progress: function (d) {
      var real = d.steps.filter(function (s) { return !s.skip; }), done = real.filter(function (s) { return s.done; }).length, next = real.filter(function (s) { return !s.done; })[0], rc = d.steps[d.steps.length - 1];
      return { done: done, total: real.length, next: next, nextLabel: next ? M.label(next.key)[1] : 'Complete', eta: rc.done ? rc.at : rc.due, late: next && next.due < Date.now(), complete: !next };
    },
    // sold leads that came in before this module existed get a deal with progress by age, so the desk is never empty
    seed: function (dl) {
      var a = all(), have = {}, now = Date.now(); a.forEach(function (d) { have[d.leadId] = 1; }); var n = 0;
      R.leads().forEach(function (x) {
        if (x.dealer !== dl || x.stage !== 'Sold' || x.lost || have[x.id] || /-prev/.test(x.listing || '')) return;
        var d = make(x); d.steps.forEach(function (s) { if (!s.skip && s.due <= now - 6 * 3600e3) { s.done = true; s.at = s.due - Math.floor(R.rng(d.id + s.key)() * 20) * 3600e3; } }); a.push(d); n++;
      });
      if (n) save(a);
    },
    create: function (lead, opts) { var a = all(), ex = a.filter(function (d) { return d.leadId === lead.id; })[0]; if (ex) return ex; var d = make(lead, opts); d.steps[0].done = true; d.steps[0].at = Date.now(); a.push(d); save(a); return d; },
    update: function (id, fn) { var a = all(); a.forEach(function (d) { if (d.id === id) fn(d); }); save(a); },
    trackUrl: function (d) { var u = location.href.replace(/[^/]*$/, ''); return u + 'track.html#t=' + d.track; }
  };
  if (!window.BO || !document.querySelector('body.bo')) return;

  /* ================= the deal desk (dealer app) ================= */
  var BO = window.BO, esc = BO.esc, ic = BO.ic, $ = BO.$, $$ = BO.$$, X = null;
  function dfmt(t) { return new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
  function iso(t) { var x = new Date(t); return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2); }
  function veh(d) { var l = R.byId(d.vehicleId); return l ? { title: R.title(l), img: R.img(l, true), l: l } : { title: 'Vehicle', img: '', l: null }; }
  function bar(d) { var p = M.progress(d); return '<span class="dbar" role="img" aria-label="' + p.done + ' of ' + p.total + ' steps done">' + d.steps.filter(function (s) { return !s.skip; }).map(function (s) { return '<i class="' + (s.done ? 'on' : s.due < Date.now() ? 'late' : '') + '"></i>'; }).join('') + '</span>'; }

  function openDesk(id) {
    var d = M.get(id); if (!d) return; var v = veh(d), team = TEAM(d.dealer);
    BO.slide({ title: d.buyer, head: v.img ? '<img class="thumb" src="' + v.img + '" alt="" width="56" height="38">' : '', actions: '<a class="btn sm" href="track.html#t=' + d.track + '" target="_blank" rel="noopener">' + ic('ext') + '<span class="hide-m">Buyer view</span></a>', body: draw });
    function draw(b) {
      d = M.get(id); var p = M.progress(d);
      b.innerHTML = '<p class="desk-sum"><b>' + esc(v.title) + '</b> · ' + R.inrFull(d.price) + ' · sold ' + dfmt(d.at) + (d.finance ? ' · on a loan' : ' · paid without a loan') + '</p>' +
        '<div class="desk-pr"><div><span class="lbl">Papers</span><b>' + p.done + ' of ' + p.total + '</b> steps done</div><div><span class="lbl">RC expected</span><b>' + dfmt(p.eta) + '</b></div>' + bar(d) + '</div>' +
        '<ol class="desk">' + d.steps.map(function (s, i) { var L = M.label(s.key), late = !s.done && s.due < Date.now();
          return '<li class="' + (s.done ? 'done' : late ? 'late' : '') + (s.skip ? ' na' : '') + '"><label class="dk-c"><input type="checkbox" data-step="' + i + '"' + (s.done ? ' checked' : '') + (s.skip ? ' disabled' : '') + '><span class="sr">' + esc(L[1]) + ' done</span></label>' +
            '<div class="dk-b"><b>' + esc(L[1]) + '</b><small>' + (s.skip ? (s.key === 'loan' ? 'Not needed: paid without a loan' : 'Not needed: no loan on the old RC') : esc(L[2])) + '</small>' +
            (s.skip ? '' : '<div class="dk-m"><label class="sr" for="dk-o' + i + '">Owner</label><select class="sel sm" id="dk-o' + i + '" data-own="' + i + '">' + team.map(function (t) { return '<option' + (t.name === s.by ? ' selected' : '') + '>' + esc(t.name) + '</option>'; }).join('') + (team.some(function (t) { return t.name === s.by; }) ? '' : '<option selected>' + esc(s.by) + '</option>') + '</select>' +
              '<label class="dk-d"><span class="sr">Date</span><input type="date" class="sel sm" data-due="' + i + '" value="' + iso(s.done ? s.at : s.due) + '"></label>' +
              '<label class="dk-doc btn sm"><input type="file" class="sr" data-doc="' + i + '">' + ic('doc') + '<span>' + (s.doc ? esc(s.doc) : 'Attach') + '</span></label>' + (late ? '<span class="chip bad">Late</span>' : s.done ? '<span class="chip ok">' + dfmt(s.at) + '</span>' : '') + '</div>') + '</div></li>'; }).join('') + '</ol>' +
        '<div class="desk-a"><button type="button" class="btn" data-print="invoice">' + ic('print') + 'Invoice</button><button type="button" class="btn" data-print="delivery">' + ic('print') + 'Delivery note</button><button type="button" class="btn pri" data-copytrack>' + ic('chat') + 'Copy tracking link</button></div>';
      b.onchange = function (e) { var t = e.target, i;
        if (t.dataset.step != null) { i = +t.dataset.step; M.update(id, function (x) { var s = x.steps[i]; s.done = t.checked; s.at = t.checked ? Date.now() : null; }); var L = M.label(d.steps[i].key); draw(b); BO.refresh(); BO.toast(t.checked ? '<b>' + esc(L[1]) + '</b> done. The buyer’s tracker shows it now.' : esc(L[1]) + ' reopened.'); return; }
        if (t.dataset.own != null) { i = +t.dataset.own; M.update(id, function (x) { x.steps[i].by = t.value; }); BO.toast('Owner set: ' + esc(t.value)); return; }
        if (t.dataset.due != null && t.value) { i = +t.dataset.due; var v = new Date(t.value + 'T18:00').getTime(); M.update(id, function (x) { var s = x.steps[i]; if (s.done) s.at = v; else s.due = v; }); draw(b); return; }
        if (t.dataset.doc != null && t.files && t.files[0]) { i = +t.dataset.doc; var nm = t.files[0].name; M.update(id, function (x) { x.steps[i].doc = nm; }); draw(b); BO.toast('Attached ' + esc(nm) + '.'); }
      };
      b.onclick = function (e) { var pr = e.target.closest('[data-print]'); if (pr) { printDoc(M.get(id), pr.dataset.print); return; } if (e.target.closest('[data-copytrack]')) { var u = M.trackUrl(M.get(id)), p2 = M.progress(M.get(id)), msg = 'Hi ' + d.buyer.split(' ')[0] + ', your papers for the ' + v.title + ': ' + p2.done + ' of ' + p2.total + ' steps done, RC expected by ' + dfmt(p2.eta) + '. Track it here: ' + u; try { navigator.clipboard.writeText(msg).then(function () { BO.toast('Tracking message copied. Paste it into WhatsApp.'); }, function () { BO.toast(esc(u)); }); } catch (x) { BO.toast(esc(u)); } } };
    }
  }

  /* ---------- printable invoice and delivery note on the dealer's letterhead ---------- */
  function head(d) {
    var dl = R.dealer(d.dealer), br = R.get('revv:brand', null), name = br && br.name ? br.name : dl.name, city = br && br.city ? br.city : dl.city, col = br && br.colour ? br.colour : '#FF5B1F';
    var r = R.rng(d.dealer + 'gst'), st = { Mumbai: '27', Pune: '27', Bengaluru: '29', 'Delhi NCR': '06', Hyderabad: '36', Chennai: '33', Goa: '30', Kochi: '32' }[dl.city] || '27';
    return { name: name, city: city, col: col, area: dl.area || '', gst: st + 'AAKF' + name.replace(/[^A-Z]/gi, '').slice(0, 1).toUpperCase() + (1000 + Math.floor(r() * 8999)) + 'M1Z' + Math.floor(r() * 9) };
  }
  function printDoc(d, kind) {
    var h = head(d), v = veh(d), l = v.l || {}, reg = l.id ? R.reg(l) : { rto: '' }, r = R.rng(d.id + 'doc'), chassis = 'MA' + (l.type === 'bike' ? '3' : '1') + 'RV' + d.id.replace(/\D/g, '').slice(-4) + 'K' + (100 + Math.floor(r() * 899)) + 'A' + (10 + Math.floor(r() * 89));
    var fees = { rto: l.type === 'bike' ? 1500 : 3500, ins: l.type === 'bike' ? 450 : 950, handle: l.type === 'bike' ? 2500 : 6000 }, total = d.price + fees.rto + fees.ins + fees.handle, no = (kind === 'invoice' ? 'INV-' : 'DN-') + d.dealer.slice(0, 3).toUpperCase() + '-' + d.id.replace(/\D/g, '');
    var body = kind === 'invoice'
      ? '<table class="pd-t"><thead><tr><th>Description</th><th class="r">Amount</th></tr></thead><tbody><tr><td><b>' + esc(v.title) + '</b><br><small>Chassis ' + chassis + ' · ' + esc(reg.rto || '') + ' registration · ' + (l.km ? R.km(l.km) : '') + '</small></td><td class="r">' + R.inrFull(d.price) + '</td></tr><tr><td>RC transfer at the RTO</td><td class="r">' + R.inrFull(fees.rto) + '</td></tr><tr><td>Insurance transfer</td><td class="r">' + R.inrFull(fees.ins) + '</td></tr><tr><td>Handling and paperwork</td><td class="r">' + R.inrFull(fees.handle) + '</td></tr></tbody><tfoot><tr><td>Total</td><td class="r">' + R.inrFull(total) + '</td></tr></tfoot></table><p class="pd-n">GST is charged on the dealer’s margin under the margin scheme for used vehicles and is included above.' + (d.finance ? ' Balance paid by the financing bank on disbursal.' : '') + '</p>'
      : '<p>Handed over to <b>' + esc(d.buyer) + '</b> on ' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) + '.</p><table class="pd-t"><tbody><tr><td>Vehicle</td><td>' + esc(v.title) + '</td></tr><tr><td>Chassis</td><td>' + chassis + '</td></tr><tr><td>Odometer at delivery</td><td>' + (l.km ? R.km(l.km + 12) : '') + '</td></tr></tbody></table><ul class="pd-c">' + ['Keys (' + (l.type === 'bike' ? '2' : '2') + ')', 'Copy of the RC (smart card follows by post)', 'Insurance policy copy', 'Service book', l.type === 'bike' ? 'Tool kit and owner’s manual' : 'Tool kit, spare wheel and jack', 'The 150-point inspection report'].map(function (x) { return '<li>☐ ' + esc(x) + '</li>'; }).join('') + '</ul>';
    var w = document.createElement('div'); w.className = 'pd-wrap'; w.id = 'print-doc';
    w.innerHTML = '<div class="pd-bar"><b>' + (kind === 'invoice' ? 'Invoice' : 'Delivery note') + ' · ' + no + '</b><button type="button" class="btn pri" data-pd="print">' + ic('print') + 'Print</button><button type="button" class="btn" data-pd="close">Close</button></div>' +
      '<article class="pd" style="--lh:' + h.col + '"><header class="pd-h"><div><b class="pd-name">' + esc(h.name) + '</b><span>' + esc((h.area ? h.area + ', ' : '') + h.city) + ' · GSTIN ' + h.gst + '</span></div><div class="pd-k"><b>' + (kind === 'invoice' ? 'Tax invoice' : 'Delivery note') + '</b><span>' + no + '</span><span>' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + '</span></div></header>' +
      '<p class="pd-to">Buyer: <b>' + esc(d.buyer) + '</b> · Deal ' + d.id + '</p>' + body + '<footer class="pd-f"><span>For ' + esc(h.name) + '</span><span>Buyer’s signature</span></footer></article>';
    document.body.appendChild(w); document.body.classList.add('printing'); var btn = $('[data-pd="print"]', w); btn.focus();
    function close() { w.remove(); document.body.classList.remove('printing'); }
    w.addEventListener('click', function (e) { var k = e.target.closest('[data-pd]'); if (!k) return; if (k.dataset.pd === 'print') window.print(); else close(); });
    w.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  }

  /* ---------- the deals list ---------- */
  var df = { f: 'open' };
  function vDeals(el) {
    var me = meId(), list = M.forDealer(me).sort(function (a, b) { return b.at - a.at; }), F = { open: function (d) { return !M.progress(d).complete; }, late: function (d) { return M.progress(d).late; }, done: function (d) { return M.progress(d).complete; } };
    var shown = list.filter(F[df.f]);
    el.innerHTML = '<div class="ph"><div><h1>Deals</h1><p>' + list.filter(F.open).length + ' with papers in progress · ' + list.filter(F.late).length + ' running late · every buyer has a tracking link</p></div></div>' +
      '<div class="tb"><div class="fchips" role="group" aria-label="Filter">' + [['open', 'In progress'], ['late', 'Late'], ['done', 'RC delivered']].map(function (x) { return '<button type="button" class="fchip" data-df="' + x[0] + '" aria-pressed="' + (df.f === x[0]) + '">' + x[1] + '<span class="n">' + list.filter(F[x[0]]).length + '</span></button>'; }).join('') + '</div></div>' +
      '<div class="tbl-w cards"><table class="tbl"><thead><tr><th scope="col">Buyer</th><th scope="col">Vehicle</th><th scope="col">Papers</th><th scope="col">Next step</th><th scope="col" class="r">RC by</th><th scope="col"><span class="sr">Open</span></th></tr></thead><tbody>' +
      (shown.length ? shown.map(function (d) { var p = M.progress(d), v = veh(d); return '<tr data-deal="' + d.id + '" tabindex="0"><td class="vcell"><div class="vc"><span class="av">' + esc(BO.initials(d.buyer)) + '</span><span><b>' + esc(d.buyer) + '</b><span>' + d.id + ' · sold ' + dfmt(d.at) + '</span></span></div></td><td data-l="Vehicle">' + esc(v.title) + '<small class="dim"> · ' + R.inr(d.price) + '</small></td><td data-l="Papers">' + bar(d) + ' <span class="num">' + p.done + '/' + p.total + '</span></td><td data-l="Next step">' + (p.complete ? '<span class="chip ok">Done</span>' : esc(p.nextLabel) + (p.late ? ' <span class="chip bad">Late</span>' : '') + '<small class="dim"> · ' + esc(p.next.by) + '</small>') + '</td><td class="r num" data-l="RC by">' + dfmt(p.eta) + '</td><td class="full"><button type="button" class="btn sm" data-deal-open="' + d.id + '">Open desk</button></td></tr>'; }).join('')
        : '<tr><td colspan="6"><div class="empty">' + ic('check') + '<b>' + (df.f === 'late' ? 'Nothing is late' : 'Nothing here') + '</b><p>' + (df.f === 'open' ? 'Mark a lead sold in the pipeline and its deal desk opens here.' : 'Deals show here as their papers move.') + '</p></div></td></tr>') + '</tbody></table></div>';
    el.onclick = function (e) { var f = e.target.closest('[data-df]'); if (f) { df.f = f.dataset.df; BO.render(true); return; } var o = e.target.closest('[data-deal-open],[data-deal]'); if (o) openDesk(o.dataset.dealOpen || o.dataset.deal); };
    el.onkeydown = function (e) { var tr = e.target.closest('[data-deal]'); if (tr && e.key === 'Enter') openDesk(tr.dataset.deal); };
  }

  M.openDesk = openDesk;
  // called by the pipeline when a lead is marked sold
  M.onSold = function (lead) { var d = M.create(lead); setTimeout(function () { openDesk(d.id); }, 60); return d; };

  (window.DEALER_EXT = window.DEALER_EXT || []).push(function (cfg, api) {
    X = api; cfg.views.deals = vDeals;
    var grp = cfg.nav.filter(function (g) { return g.group === 'Sell'; })[0];
    if (grp) grp.items.push({ id: 'deals', label: 'Deals and papers', icon: 'doc', short: 'Deals' });
    var c0 = cfg.counts; cfg.counts = function () { var c = c0 ? c0() : {}; c.deals = M.forDealer(meId()).filter(function (d) { return M.progress(d).late; }).length; return c; };
    (cfg.hot = cfg.hot || []).push('deals');
  });
})();
