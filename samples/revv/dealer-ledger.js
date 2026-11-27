/* Revv dealer app · the money view. Every vehicle gets a ledger: bought for, refurbishment jobs (cost, vendor), holding cost
   per day, asking, floor, margin today. Derived from a seeded function of the listing id, so any new listing works with no
   setup; jobs you add and stock you buy are kept in localStorage ("revv:ledger", "revv:stock").
   Exposes window.LEDGER for the inventory, Today, refurbishment board, appraisals and closing screens. */
(function () {
  'use strict';
  var R = window.Revv, BO = window.BO, esc = BO.esc, ic = BO.ic, $ = BO.$, $$ = BO.$$, DAY = 864e5;
  var KEY = 'revv:ledger', SKEY = 'revv:stock';
  var STAGES = ['Bought', 'Workshop', 'Detailing', 'Photos', 'Live'];
  var CAR = [['Denting and paint, one panel', 'Shree Ganesh Denting', 4500, 9500], ['Two tyres', 'Tyre Point', 9000, 16000], ['Detailing and ceramic wash', 'Gloss Lab', 2000, 3800], ['Service, oil and filters', 'In-house workshop', 3500, 7800], ['Battery', 'Volt Batteries', 4200, 6800], ['AC gas and cabin filter', 'CoolCare', 1600, 2900], ['Windscreen chip repair', 'ClearView Glass', 1200, 2400], ['Front brake pads', 'In-house workshop', 2400, 4800]];
  var BIKE = [['Chain and sprockets', 'Chain Shack', 3200, 6800], ['Fork seals', 'Suspension Works', 1800, 3400], ['Two tyres', 'Tyre Point', 4500, 12000], ['Service and fluids', 'In-house workshop', 1500, 4200], ['Detailing', 'Gloss Lab', 800, 1600], ['Brake pads and fluid', 'In-house workshop', 1400, 3200], ['Battery', 'Volt Batteries', 1800, 3200]];
  var IN_BIKE = [['Ishiro', 'R6 S', 'supersport', 560000, 'b-noir'], ['Moreau', '650 Café', 'cafe', 310000, 'b-twin'], ['Halvard', 'Bolt 950', 'cruiser', 540000, 'b-bobber'], ['Varno', '790 Street', 'naked', 690000, 'b-street'], ['Tessaro', 'SS 950', 'tourer', 980000, 'b-tourer'], ['Aurex', 'E-Café', 'electric', 470000, 'b-volt']];
  var IN_CAR = [['Aurex', 'S4 1.6T', 'sedan', 1390000, 'c-sage'], ['Varno', 'Vela N', 'sedan', 1960000, 'c-azure'], ['Ishiro', 'Type-S', 'hatch', 1240000, 'c-hatch'], ['Moreau', 'Terra 7', 'suv', 1890000, 'c-forest'], ['Varno', 'Atlas V6', 'suv', 3350000, 'c-coast'], ['Halvard', 'SLR 300', 'roadster', 2650000, 'c-roadster']];

  function store() { return R.get(KEY, {}); }
  function put(s) { R.set(KEY, s); }
  function own(id) { var s = store(); return s[id] || {}; }
  function patch(id, fn) { var s = store(); s[id] = s[id] || {}; fn(s[id]); put(s); }
  function sum(a, f) { return a.reduce(function (s, x) { return s + (f ? f(x) : x); }, 0); }
  function round(n, to) { return Math.round(n / to) * to; }
  function sod(t) { var x = new Date(t); x.setHours(0, 0, 0, 0); return x.getTime(); }

  /* ---------- the seeded part ---------- */
  function jobsFor(seed, car, price) {
    var r = R.rng(seed + 'jobs'), cat = car ? CAR : BIKE, f = car ? Math.min(4, Math.max(0.6, price / 1.2e6)) : Math.min(3, Math.max(0.6, price / 6e5));
    var n = 1 + Math.floor(r() * 3) + (r() < 0.3 ? 1 : 0), used = {}, out = [];
    for (var i = 0; i < n + 2 && out.length < n; i++) { var j = Math.floor(r() * cat.length); if (used[j]) continue; used[j] = 1; var c = cat[j]; out.push({ id: 's' + i, label: c[0], vendor: c[1], cost: round((c[2] + r() * (c[3] - c[2])) * f, 100), seed: true }); }
    return out;
  }
  function hold(bought, car) { return Math.round(bought * 0.12 / 365 + (car ? 70 : 25)); }
  // days a listing has been in stock: the one source the inventory, money view and Today all use
  var slow = {};
  function slowSet(dl) { if (slow[dl] !== undefined) return slow[dl]; var ls = R.listings({ all: true }).filter(function (x) { return x.dealer === dl && x.approved !== false && x.status !== 'sold'; }); ls.sort(function (a, b) { return R.rng(b.id + 'slow')() - R.rng(a.id + 'slow')(); }); var n = ls.length > 4 ? 1 + (R.rng(dl + 'slow')() < 0.5 ? 1 : 0) : ls.length > 1 ? 1 : 0; return (slow[dl] = ls.slice(0, n).map(function (x) { return x.id; })); }
  function days(l) {
    var o = own(l.id); if (o.boughtAt) return Math.max(0, Math.floor((Date.now() - o.boughtAt) / DAY));
    if (l.approved === false) return 2 + Math.floor(R.rng(l.id + 'stock')() * 5);
    if (slowSet(l.dealer).indexOf(l.id) >= 0) return 61 + Math.floor(R.rng(l.id + 'old')() * 30);
    return 5 + Math.floor(R.rng(l.id + 'stock')() * 50);
  }
  // incoming stock (bought, not yet listed): a few per dealer, seeded, plus accepted appraisals
  function incomingSeed(dealer) {
    var d = R.dealer(dealer), r = R.rng('in-' + dealer), f = String(d.focus || '').toLowerCase(), bikes = /bike/.test(f), cars = /car|suv|luxury|tourer|performance/.test(f), n = 2 + (r() < 0.55 ? 1 : 0), out = [];
    for (var i = 0; i < n; i++) {
      var car = cars && (!bikes || r() < 0.5), m = (car ? IN_CAR : IN_BIKE)[Math.floor(r() * 6)], yr = 2018 + Math.floor(r() * 6), target = round(m[3] * (0.85 + r() * 0.3), 5000);
      var id = 'in-' + dealer + '-' + (i + 1), stage = STAGES[Math.min(3, Math.floor(r() * 4))], at = Date.now() - (1 + Math.floor(r() * 11)) * DAY;
      out.push({ id: id, dealer: dealer, type: car ? 'car' : 'bike', body: m[2], make: m[0], model: m[1], year: yr, km: car ? 18000 + Math.floor(r() * 52000) : 4000 + Math.floor(r() * 21000), owners: 1 + (r() < 0.3 ? 1 : 0), target: target, bought: round(target * (0.84 + r() * 0.05), 1000), img: m[4], stage: stage, at: at, seed: true, city: d.city });
    }
    return out;
  }
  function incoming(dealer) {
    var mine = R.get(SKEY, []).filter(function (x) { return x.dealer === dealer; }), s = store();
    return incomingSeed(dealer).concat(mine).map(function (x) { var o = s[x.id] || {}; return Object.assign({}, x, { stage: o.stage || x.stage, published: o.published || null }); }).filter(function (x) { return !x.published && !x.gone; });
  }

  /* ---------- the ledger ---------- */
  function ofListing(l) {
    var o = own(l.id), car = l.type !== 'bike', orig = l.was || l.price, r = R.rng(l.id + 'ledger');
    var bought = o.bought || round(orig * (car ? 0.86 + r() * 0.05 : 0.84 + r() * 0.06), 1000);
    var base = o.bought ? (o.baseJobs || []) : jobsFor(l.id, car, orig);
    return finish({ id: l.id, kind: 'listing', l: l, car: car, bought: bought, jobs: base.filter(function (j) { return (o.rm || []).indexOf(j.id) < 0; }).concat(o.jobs || []), days: days(l), ask: l.price, title: R.title(l), img: R.img(l, true), stage: l.status === 'sold' ? 'Sold' : 'Live', at: o.boughtAt || (Date.now() - days(l) * DAY) });
  }
  function ofIncoming(x) {
    var o = own(x.id), car = x.type !== 'bike', base = x.from === 'appraisal' ? (x.jobs || []) : jobsFor(x.id, car, x.target);
    if (x.stage === 'Bought') base = base.filter(function (j, i) { return i === 0 && x.from === 'appraisal'; });
    return finish({ id: x.id, kind: 'incoming', x: x, car: car, bought: x.bought, jobs: base.filter(function (j) { return (o.rm || []).indexOf(j.id) < 0; }).concat(o.jobs || []), days: Math.max(0, Math.floor((Date.now() - x.at) / DAY)), ask: x.target, title: x.year + ' ' + x.make + ' ' + x.model, img: x.img ? 'photos/' + x.img + '-s.jpg' : '', stage: x.stage, at: x.at });
  }
  function finish(g) {
    g.refurb = sum(g.jobs, function (j) { return j.cost; }); g.hold = hold(g.bought, g.car); g.holding = g.hold * g.days;
    g.cost = g.bought + g.refurb + g.holding; g.margin = g.ask - g.cost; g.floor = Math.ceil((g.cost + g.hold * 21) / 5000) * 5000;
    g.age = g.days > 60 ? 'bad' : g.days > 30 ? 'warn' : 'ok';
    return g;
  }
  var L = window.LEDGER = {
    STAGES: STAGES, days: days, of: ofListing, incoming: incoming,
    byId: function (id) { var l = R.byId(id); if (l) return ofListing(l); var x = incoming(L.me()).filter(function (y) { return y.id === id; })[0]; return x ? ofIncoming(x) : null; },
    me: function () { return window.DEALER && DEALER.me ? DEALER.me() : R.get(R.K.me, 'redline'); },
    // every unsold vehicle a dealer has money in: listed stock and incoming stock
    all: function (dealer) {
      var ls = R.listings({ all: true }).filter(function (l) { return l.dealer === dealer && l.status !== 'sold' && !(l.rejected); });
      return ls.map(ofListing).concat(incoming(dealer).map(ofIncoming));
    },
    totals: function (dealer) {
      var a = L.all(dealer); return { n: a.length, locked: sum(a, function (g) { return g.bought + g.refurb; }), holding: sum(a, function (g) { return g.holding; }), perDay: sum(a, function (g) { return g.hold; }), margin: sum(a, function (g) { return g.margin; }), old: a.filter(function (g) { return g.days > 60; }), a: a };
    },
    line: function (g) { return 'Day ' + g.days + ' · ' + R.inrFull(Math.max(0, g.margin)) + (g.margin < 0 ? ' under cost' : ' margin') + ' · down ' + R.inrFull(g.hold) + ' a day'; },
    addJob: function (id, job) { patch(id, function (o) { (o.jobs = o.jobs || []).push(Object.assign({ id: 'u' + Date.now().toString(36), at: Date.now() }, job)); }); },
    removeJob: function (id, jid) { patch(id, function (o) { if ((o.jobs || []).some(function (j) { return j.id === jid; })) o.jobs = o.jobs.filter(function (j) { return j.id !== jid; }); else (o.rm = o.rm || []).push(jid); }); },
    setStage: function (id, st) { patch(id, function (o) { o.stage = st; o.stageAt = Date.now(); }); },
    patch: patch, own: own, ofIncoming: ofIncoming, sod: sod,
    // a new stock row (from an accepted appraisal)
    addStock: function (row) { var a = R.get(SKEY, []); a.push(row); R.set(SKEY, a); },
    // publish an incoming vehicle: it becomes a listing in review (admin moderation) and keeps its ledger
    publish: function (g) {
      var x = g.x, ex = R.extra(), id = (x.make + '-' + x.model + '-' + x.year).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36).slice(-4);
      ex.push({ id: id, type: x.type, body: x.body || (x.type === 'bike' ? 'naked' : 'sedan'), make: x.make, model: x.model, year: x.year, km: x.km, owners: x.owners || 1, fuel: 'Petrol', trans: x.type === 'bike' ? 'Manual' : 'Automatic', price: x.target, dealer: x.dealer, city: x.city || R.dealer(x.dealer).city, img: x.img || (x.type === 'bike' ? 'b-noir' : 'c-sage'), color: x.color || 'As inspected', spec: {}, desc: 'Fresh from our workshop: ' + g.jobs.map(function (j) { return j.label.toLowerCase(); }).join(', ') + '. Waiting on the 150-point report.', score: 0, approved: false, submitted: Date.now() });
      R.set(R.K.extra, ex);
      patch(id, function (o) { o.bought = g.bought; o.baseJobs = g.jobs; o.boughtAt = g.at; });
      patch(x.id, function (o) { o.published = id; });
      return id;
    }
  };

  /* ---------- shared bits of UI ---------- */
  function ageChip(g) { return '<span class="age ' + g.age + '" title="' + g.days + ' days in stock">Day ' + g.days + '</span>'; }
  function marginTxt(g, round) { var v = Math.abs(g.margin); if (round) v = Math.round(v / 1000) * 1000; return '<span class="mg ' + (g.margin < 0 ? 'bad' : g.margin < g.hold * 30 ? 'warn' : 'ok') + '">' + (g.margin < 0 && v ? '−' : '') + R.inrFull(v) + '</span>'; }
  L.cell = function (g, maxD) { return '<span class="bar ' + g.age + '" aria-hidden="true"><i style="width:' + Math.min(100, Math.round(g.days / (maxD || 90) * 100)) + '%"></i></span><span class="ledl"><span><b class="num">Day ' + g.days + '</b> · ' + marginTxt(g, true) + (g.margin < 0 ? ' under cost' : ' margin') + '</span><small>down ' + R.inrFull(Math.round(g.hold / 10) * 10) + ' a day</small></span>'; };
  L.ageChip = ageChip; L.marginTxt = marginTxt;

  // Today: two tiles
  L.todayTiles = function (dealer) {
    var t = L.totals(dealer), old = t.old;
    return '<a class="tile" href="#/money"><span class="l">Money in stock</span><span class="v">' + R.inr(t.locked) + '</span><span class="d flat">' + t.n + ' vehicles</span><span class="s"><span>Costs ' + R.inrFull(t.perDay) + ' a day to hold</span>' + BO.spark(t.a.map(function (g) { return g.days; }).sort(function (a, b) { return a - b; })) + '</span>' + ic('arrow', 'go') + '</a>' +
      '<a class="tile' + (old.length ? ' alert' : '') + '" href="#/money?f=old"><span class="l">Past 60 days</span><span class="v">' + old.length + '</span><span class="d ' + (old.length ? 'down' : 'flat') + '">' + (old.length ? R.inr(sum(old, function (g) { return g.bought + g.refurb; })) + ' stuck' : 'none') + '</span><span class="s"><span>' + (old.length ? 'Oldest: ' + esc(old.sort(function (a, b) { return b.days - a.days; })[0].title) : 'Every car is moving') + '</span></span>' + ic('arrow', 'go') + '</a>';
  };

  /* ---------- the ledger slide-over ---------- */
  L.open = function (id, onDone, extra) {
    var g = L.byId(id); if (!g) return;
    BO.slide({ title: g.title, head: g.img ? '<img class="thumb" src="' + g.img + '" alt="" width="56" height="38">' : '', actions: ageChip(g), body: function (b) { draw(b); }, onClose: function () { if (onDone) onDone(); } });
    function draw(b) {
      g = L.byId(id); var drop = g.kind === 'listing' && g.l.status === 'live' ? round(g.ask * 0.97, 5000) : 0;
      b.innerHTML = '<div class="led-sum"><div><span class="lbl">Margin today</span><b class="big ' + (g.margin < 0 ? 'bad' : 'ok') + '">' + (g.margin < 0 ? '−' : '') + R.inrFull(Math.abs(g.margin)) + '</b><small>at ' + R.inrFull(g.ask) + ' asking · down ' + R.inrFull(g.hold) + ' a day</small></div><div><span class="lbl">Floor price</span><b class="big">' + R.inrFull(g.floor) + '</b><small>covers cost and three more weeks</small></div></div>' +
        '<table class="tbl led-t"><caption class="sr">Ledger</caption><tbody>' +
        '<tr><th scope="row">Bought for</th><td class="r num">' + R.inrFull(g.bought) + '</td><td class="dim">' + new Date(g.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + '</td></tr>' +
        g.jobs.map(function (j) { return '<tr class="job"><th scope="row">' + esc(j.label) + '</th><td class="r num">' + R.inrFull(j.cost) + '</td><td class="dim">' + esc(j.vendor || '') + '<button type="button" class="ib sm" data-rm="' + esc(j.id) + '" aria-label="Remove ' + esc(j.label) + '">' + ic('x') + '</button></td></tr>'; }).join('') +
        '<tr><th scope="row">Holding · ' + g.days + ' days</th><td class="r num">' + R.inrFull(g.holding) + '</td><td class="dim">' + R.inrFull(g.hold) + ' a day: money tied up and yard space</td></tr>' +
        '<tr class="tot"><th scope="row">Cost so far</th><td class="r num">' + R.inrFull(g.cost) + '</td><td></td></tr>' +
        '<tr class="tot"><th scope="row">Asking</th><td class="r num">' + R.inrFull(g.ask) + '</td><td></td></tr></tbody></table>' +
        '<form class="addjob" data-addjob><p class="lbl">+ Add job</p><div class="aj-g"><label class="sr" for="aj-l">What was done</label><input class="inp" id="aj-l" name="l" required placeholder="What was done, e.g. two tyres" list="aj-list" autocomplete="off"><datalist id="aj-list">' + (g.car ? CAR : BIKE).map(function (c) { return '<option value="' + esc(c[0]) + '">'; }).join('') + '</datalist><label class="sr" for="aj-v">Vendor</label><input class="inp" id="aj-v" name="v" placeholder="Vendor" autocomplete="off"><label class="sr" for="aj-c">Cost in rupees</label><input class="inp num" id="aj-c" name="c" required inputmode="numeric" pattern="[0-9,]*" placeholder="Cost ₹"><button class="btn pri" type="submit">Add</button></div><p class="hint" id="aj-p" aria-live="polite"></p></form>' +
        (drop ? '<div class="led-drop"><p class="lbl">If you drop the price 3%</p><p>' + R.inrFull(g.ask) + ' → <b>' + R.inrFull(drop) + '</b>: margin ' + marginTxt(g) + ' → ' + marginTxt({ margin: g.margin - (g.ask - drop), hold: g.hold }) + '. ' + (g.margin - (g.ask - drop) < 0 ? 'That sells under cost.' : 'Still above the floor.') + '</p></div>' : '') +
        (g.kind === 'incoming' ? '<p class="hint">Not listed yet · stage ' + esc(g.stage) + '. Move it on the <a href="#/refurb">refurbishment board</a>.</p>' : '');
      if (extra) extra(b, g);
      var f = $('[data-addjob]', b), cIn = $('#aj-c', b), pv = $('#aj-p', b);
      cIn.addEventListener('input', function () { var v = +String(cIn.value).replace(/[^0-9]/g, ''); pv.innerHTML = v ? 'Margin after this job: ' + marginTxt({ margin: g.margin - v, hold: g.hold }) : ''; });
      f.addEventListener('submit', function (e) { e.preventDefault(); var v = +String(cIn.value).replace(/[^0-9]/g, ''), lab = $('#aj-l', b).value.trim(); if (!lab || !v) return; var before = g.margin; L.addJob(id, { label: lab, vendor: $('#aj-v', b).value.trim() || 'Vendor', cost: v }); draw(b); BO.toast('Job added. Margin ' + R.inrFull(before) + ' → <b>' + R.inrFull(L.byId(id).margin) + '</b>.', { undo: function () { var o = own(id), j = (o.jobs || [])[(o.jobs || []).length - 1]; if (j) L.removeJob(id, j.id); if (BO.slideOpen()) draw(b); BO.refresh(); } }); BO.refresh(); });
      $$('[data-rm]', b).forEach(function (x) { x.addEventListener('click', function () { L.removeJob(id, x.dataset.rm); draw(b); BO.refresh(); }); });
    }
  };

  /* ---------- the money view ---------- */
  var mv = { f: 'all', sort: 'days' };
  function vMoney(el, q) {
    var me = L.me(), t = L.totals(me), a = t.a.slice(), F = { all: function () { return true; }, listed: function (g) { return g.kind === 'listing'; }, incoming: function (g) { return g.kind === 'incoming'; }, old: function (g) { return g.days > 60; } };
    if (q.f && F[q.f]) mv.f = q.f;
    var shown = a.filter(F[mv.f]).sort(mv.sort === 'margin' ? function (x, y) { return x.margin - y.margin; } : function (x, y) { return y.days - x.days; });
    var band = [[0, 30, 'ok', '0–30 days'], [31, 60, 'warn', '31–60 days'], [61, 9999, 'bad', '60+ days']].map(function (b) { var it = a.filter(function (g) { return g.days >= b[0] && g.days <= b[1]; }); return { b: b, n: it.length, v: sum(it, function (g) { return g.bought + g.refurb; }) }; });
    var maxD = Math.max.apply(null, a.map(function (g) { return g.days; }).concat(60));
    el.innerHTML = '<div class="ph"><div><h1>Money</h1><p>' + R.inr(t.locked) + ' in ' + t.n + ' vehicles · holding costs ' + R.inrFull(t.perDay) + ' a day · ' + R.inr(Math.max(0, t.margin)) + ' margin if everything sells at asking</p></div><div class="acts"><a class="btn" href="#/refurb">' + ic('board') + 'Refurbishment board</a></div></div>' +
      '<div class="tiles"><div class="tile"><span class="l">Money locked in stock</span><span class="v">' + R.inr(t.locked) + '</span><span class="d flat">' + t.n + ' vehicles</span></div>' +
      '<div class="tile"><span class="l">Holding cost</span><span class="v">' + R.inrFull(t.perDay) + '</span><span class="d flat">a day</span></div>' +
      '<div class="tile"><span class="l">Margin at asking</span><span class="v">' + R.inr(Math.max(0, t.margin)) + '</span><span class="d ' + (t.margin > 0 ? 'up' : 'down') + '">' + Math.round(t.margin / Math.max(1, sum(a, function (g) { return g.ask; })) * 100) + '% of asking</span></div>' +
      '<a class="tile' + (t.old.length ? ' alert' : '') + '" href="#/money?f=old"><span class="l">Past 60 days</span><span class="v">' + t.old.length + '</span><span class="d ' + (t.old.length ? 'down' : 'flat') + '">' + R.inr(sum(t.old, function (g) { return g.bought + g.refurb; })) + '</span>' + ic('arrow', 'go') + '</a></div>' +
      '<section class="panel heat" aria-labelledby="ht-h"><div class="panel-h"><h2 id="ht-h">Stock ageing</h2><span class="n">' + t.n + ' vehicles, oldest first</span></div><div class="heat-b">' +
      '<div class="heat-s" role="img" aria-label="' + band.map(function (x) { return x.n + ' vehicles at ' + x.b[3]; }).join(', ') + '">' + a.slice().sort(function (x, y) { return y.days - x.days; }).map(function (g) { return '<i class="' + g.age + '" style="flex:' + Math.max(1, g.bought) + '" title="' + esc(g.title) + ' · day ' + g.days + '"></i>'; }).join('') + '</div>' +
      '<ul class="heat-l">' + band.map(function (x) { return '<li class="' + x.b[2] + '"><b>' + x.b[3] + '</b><span class="num">' + x.n + ' · ' + R.inr(x.v) + '</span></li>'; }).join('') + '</ul></div></section>' +
      '<div class="tb"><div class="fchips" role="group" aria-label="Filter">' + [['all', 'All stock'], ['listed', 'Listed'], ['incoming', 'Not listed yet'], ['old', 'Past 60 days']].map(function (x) { return '<button type="button" class="fchip" data-mf="' + x[0] + '" aria-pressed="' + (mv.f === x[0]) + '">' + x[1] + '<span class="n">' + a.filter(F[x[0]]).length + '</span></button>'; }).join('') + '</div>' +
      '<div class="seg" role="group" aria-label="Sort"><button type="button" data-ms="days" aria-pressed="' + (mv.sort === 'days') + '">Oldest first</button><button type="button" data-ms="margin" aria-pressed="' + (mv.sort === 'margin') + '">Thinnest margin</button></div></div>' +
      '<div class="tbl-w cards"><table class="tbl"><thead><tr><th scope="col">Vehicle</th><th scope="col">Age · margin</th><th scope="col" class="r">Bought</th><th scope="col" class="r">Refurb</th><th scope="col" class="r">Holding</th><th scope="col" class="r">Asking</th><th scope="col" class="r">Floor</th><th scope="col"><span class="sr">Open</span></th></tr></thead><tbody>' +
      (shown.length ? shown.map(function (g) { return '<tr data-led="' + esc(g.id) + '" tabindex="0"><td class="vcell"><div class="vc">' + (g.img ? '<img class="thumb" src="' + g.img + '" alt="" width="56" height="38" loading="lazy">' : '<span class="thumb ph-t">' + ic(g.car ? 'stock' : 'bike') + '</span>') + '<span><b>' + esc(g.title) + '</b><span>' + (g.kind === 'incoming' ? esc(g.stage) + ' · not listed yet' : esc(g.l.status === 'reserved' ? 'Reserved' : g.l.approved === false ? 'In review' : 'Live')) + '</span></span></div></td>' +
        '<td data-l="Age · margin" class="agecell">' + L.cell(g, maxD) + '</td><td class="r num" data-l="Bought">' + R.inrFull(g.bought) + '</td><td class="r num" data-l="Refurb">' + R.inrFull(g.refurb) + '<small class="dim"> · ' + g.jobs.length + '</small></td><td class="r num" data-l="Holding">' + R.inrFull(g.holding) + '</td><td class="r num" data-l="Asking">' + R.inrFull(g.ask) + '</td><td class="r num" data-l="Floor">' + R.inrFull(g.floor) + '</td><td class="full"><button type="button" class="btn sm" data-led-open="' + esc(g.id) + '">Ledger</button></td></tr>'; }).join('')
        : '<tr><td colspan="8"><div class="empty">' + ic('check') + '<b>Nothing here</b><p>No vehicles match this filter.</p></div></td></tr>') + '</tbody></table></div>';
    el.onclick = function (e) {
      var f = e.target.closest('[data-mf]'); if (f) { mv.f = f.dataset.mf; history.replaceState(null, '', '#/money'); BO.render(true); return; }
      var s = e.target.closest('[data-ms]'); if (s) { mv.sort = s.dataset.ms; BO.render(true); return; }
      var o = e.target.closest('[data-led-open],[data-led]'); if (o) L.open(o.dataset.ledOpen || o.dataset.led, function () { BO.refresh(); });
    };
    el.onkeydown = function (e) { var tr = e.target.closest('[data-led]'); if (tr && e.key === 'Enter') L.open(tr.dataset.led, function () { BO.refresh(); }); };
  }

  /* ---------- plug into the dealer app ---------- */
  (window.DEALER_EXT = window.DEALER_EXT || []).push(function (cfg) {
    cfg.views.money = vMoney;
    var grp = cfg.nav.filter(function (g) { return g.group === 'Money'; })[0];
    if (grp) grp.items.unshift({ id: 'money', label: 'Money', icon: 'pulse' });
    var c0 = cfg.counts; cfg.counts = function () { var c = c0 ? c0() : {}; c.money = L.totals(L.me()).old.length; return c; };
    (cfg.actions = cfg.actions || []).push({ label: 'Open the money view', icon: 'rupee', run: function () { BO.go('money'); } });
  });
})();
