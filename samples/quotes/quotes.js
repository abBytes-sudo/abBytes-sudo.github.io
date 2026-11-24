/* Marlow & Reed Quote Desk: a design sample by Abhishek. Fictional studio, demo data, localStorage only. */
(function () {
  'use strict';
  var KEY = 'mr-quotes-v1';
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var main = document.getElementById('main'), dlg = document.getElementById('dlg'), toastEl = document.getElementById('toast');

  /* ---------- helpers ---------- */
  var money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  function inr(n) { return money.format(Math.round(n || 0)); }
  function compact(n) {
    n = n || 0;
    if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
    if (n >= 1e5) return '₹' + (n / 1e5).toFixed(1).replace(/\.0$/, '') + ' L';
    return inr(n);
  }
  function fnum(v) { v = +v || 0; return v.toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(v) { var n = parseFloat(String(v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
  function uid(p) { return (p || 'x') + Math.random().toString(36).slice(2, 9); }
  function pd(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function ds(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function addD(s, n) { var d = pd(s); d.setDate(d.getDate() + n); return ds(d); }
  function diff(a, b) { return Math.round((pd(b) - pd(a)) / 864e5); }
  var TODAY = ds(new Date());
  function asDate(x) { return x.length > 10 ? new Date(x) : pd(x); }
  function fdate(x) { if (!x) return '—'; var d = asDate(x); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); }
  function fshort(x) { var d = asDate(x); return d.getDate() + ' ' + MON[d.getMonth()]; }
  function ago(days) { return new Date(Date.now() - days * 864e5).toISOString(); }
  function rel(ts) {
    var d = Math.round((Date.now() - new Date(ts)) / 864e5);
    return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d < 30 ? d + ' days ago' : fdate(ts);
  }

  /* ---------- seed data ---------- */
  var RATES = [
    ['c-dismantle', 'Civil & demolition', 'Dismantle existing false ceiling', 'sqft', 28],
    ['c-demo', 'Civil & demolition', 'Demolish non-load-bearing brick wall', 'sqft', 85],
    ['c-brick', 'Civil & demolition', 'Brick partition wall, 4.5 in with plaster', 'sqft', 165],
    ['c-wp', 'Civil & demolition', 'Waterproofing, two-coat, wet areas', 'sqft', 95],
    ['c-debris', 'Civil & demolition', 'Debris removal and disposal', 'lot', 18000],
    ['e-pt', 'Electrical', 'Light or fan point, concealed wiring', 'point', 1250],
    ['e-pw', 'Electrical', 'Power point 6/16 A with modular plate', 'point', 1650],
    ['e-ac', 'Electrical', 'AC point with dedicated MCB', 'point', 3400],
    ['e-db', 'Electrical', 'Distribution board rewire, 12-way', 'nos', 18500],
    ['e-led', 'Electrical', 'LED profile light, 3000 K, supply and fix', 'rft', 780],
    ['p-rough', 'Plumbing', 'CPVC and drainage rough-in, per bathroom', 'nos', 32000],
    ['p-diverter', 'Plumbing', 'Concealed diverter and shower set', 'nos', 9800],
    ['p-sanitary', 'Plumbing', 'Sanitaryware set, mid-range, fixed', 'set', 46000],
    ['j-kit', 'Carpentry & joinery', 'Modular kitchen, BWP ply with laminate', 'sqft', 2250],
    ['j-ward', 'Carpentry & joinery', 'Wardrobe, 18 mm BWR ply, laminate shutters', 'sqft', 1650],
    ['j-tv', 'Carpentry & joinery', 'TV unit with back panel and storage', 'sqft', 1850],
    ['j-desk', 'Carpentry & joinery', 'Desk with overhead shelf, laminate', 'rft', 4800],
    ['j-panel', 'Carpentry & joinery', 'Wall panelling, fluted veneer', 'sqft', 420],
    ['j-bed', 'Carpentry & joinery', 'Queen bed with hydraulic storage', 'nos', 54000],
    ['j-door', 'Carpentry & joinery', 'Door, flush veneer, with frame and hardware', 'nos', 38000],
    ['f-vit', 'Flooring & tiling', 'Vitrified tile 800×800, supply and lay', 'sqft', 145],
    ['f-wood', 'Flooring & tiling', 'Engineered wood flooring, supply and lay', 'sqft', 320],
    ['f-bath', 'Flooring & tiling', 'Bathroom wall and floor tile, supply and lay', 'sqft', 165],
    ['f-skirt', 'Flooring & tiling', 'Skirting, 4 in tile or MDF', 'rft', 95],
    ['k-plain', 'False ceiling', 'Gypsum false ceiling, plain', 'sqft', 92],
    ['k-cove', 'False ceiling', 'Gypsum cove ceiling with peripheral drop', 'sqft', 138],
    ['n-emul', 'Painting & finishes', 'Putty and two-coat emulsion, walls', 'sqft', 28],
    ['n-tex', 'Painting & finishes', 'Texture paint, feature wall', 'sqft', 95],
    ['n-pu', 'Painting & finishes', 'PU polish on woodwork', 'sqft', 115],
    ['u-sofa', 'Furniture & soft', 'Sofa, 3-seater, fabric', 'nos', 68000],
    ['u-dining', 'Furniture & soft', 'Dining table with six chairs', 'set', 82000],
    ['u-curtain', 'Furniture & soft', 'Curtains with track, blackout lining', 'window', 14500],
    ['x-design', 'Design & supervision', 'Design fee: 3D visuals and working drawings', 'sqft', 140],
    ['x-super', 'Design & supervision', 'Site supervision', 'month', 45000],
    ['x-pm', 'Design & supervision', 'Project management and snagging', 'lot', 35000]
  ].map(function (r) { return { id: r[0], cat: r[1], name: r[2], unit: r[3], rate: r[4], upd: ds(new Date(Date.now() - (r[4] % 40) * 864e5)) }; });

  var TPL = {
    full: [['Civil & demolition', [['c-demo', 120], ['c-brick', 180], ['c-wp', 140], ['c-debris', 1]]], ['Electrical', [['e-pt', 46], ['e-pw', 38], ['e-ac', 4], ['e-db', 1], ['e-led', 90]]], ['Plumbing & bathrooms', [['p-rough', 3], ['p-diverter', 3], ['p-sanitary', 3]]], ['False ceiling', [['k-plain', 900], ['k-cove', 420]]], ['Carpentry & joinery', [['j-kit', 90], ['j-ward', 210], ['j-tv', 48], ['j-desk', 10], ['j-panel', 120], ['j-door', 4]]], ['Flooring & tiling', [['f-vit', 1450], ['f-bath', 380], ['f-skirt', 620]]], ['Painting & finishes', [['n-emul', 5200], ['n-tex', 160], ['n-pu', 300]]], ['Design & supervision', [['x-design', 1450], ['x-super', 3], ['x-pm', 1]]]],
    kitchen: [['Civil & demolition', [['c-demo', 40], ['c-wp', 60], ['c-debris', 1]]], ['Electrical', [['e-pt', 10], ['e-pw', 14]]], ['Carpentry & joinery', [['j-kit', 120], ['j-ward', 160]]], ['Flooring & tiling', [['f-vit', 180]]], ['Painting & finishes', [['n-emul', 900]]], ['Design & supervision', [['x-design', 400], ['x-pm', 1]]]],
    refresh: [['Electrical', [['e-pt', 14], ['e-pw', 10]]], ['Carpentry & joinery', [['j-tv', 36], ['j-panel', 60]]], ['False ceiling', [['k-cove', 180]]], ['Painting & finishes', [['n-emul', 3800], ['n-tex', 120]]], ['Design & supervision', [['x-design', 1000], ['x-pm', 1]]]],
    living: [['Civil & demolition', [['c-dismantle', 480], ['c-debris', 1]]], ['Electrical', [['e-pt', 18], ['e-pw', 12], ['e-led', 70]]], ['False ceiling', [['k-plain', 520], ['k-cove', 300]]], ['Carpentry & joinery', [['j-tv', 60], ['j-panel', 140]]], ['Flooring & tiling', [['f-wood', 620], ['f-skirt', 160]]], ['Painting & finishes', [['n-emul', 2400], ['n-tex', 180]]], ['Furniture & soft furnishing', [['u-sofa', 2], ['u-dining', 1], ['u-curtain', 5]]], ['Design & supervision', [['x-design', 1100], ['x-pm', 1]]]],
    clinic: [['Civil & demolition', [['c-demo', 150], ['c-brick', 210], ['c-wp', 70], ['c-debris', 1]]], ['Electrical', [['e-pt', 40], ['e-pw', 48], ['e-ac', 5], ['e-db', 1]]], ['Plumbing & bathrooms', [['p-rough', 2], ['p-sanitary', 2]]], ['False ceiling', [['k-plain', 900]]], ['Carpentry & joinery', [['j-desk', 16], ['j-panel', 200], ['j-door', 3]]], ['Flooring & tiling', [['f-vit', 1100], ['f-skirt', 300]]], ['Painting & finishes', [['n-emul', 3600]]], ['Design & supervision', [['x-design', 1100], ['x-super', 2], ['x-pm', 1]]]],
    office: [['Civil & demolition', [['c-brick', 260], ['c-debris', 1]]], ['Electrical', [['e-pt', 60], ['e-pw', 90], ['e-db', 2]]], ['False ceiling', [['k-plain', 1800], ['k-cove', 200]]], ['Carpentry & joinery', [['j-desk', 42], ['j-panel', 160], ['j-door', 5]]], ['Flooring & tiling', [['f-vit', 1900], ['f-skirt', 500]]], ['Painting & finishes', [['n-emul', 6200]]], ['Design & supervision', [['x-design', 1900], ['x-pm', 1]]]]
  };
  var TPL_NAMES = { blank: 'Blank quote', full: 'Full-home interiors (3BHK)', kitchen: 'Kitchen and wardrobes', refresh: 'Apartment refresh', living: 'Living and dining makeover', clinic: 'Clinic or café fit-out', office: 'Office floor fit-out' };

  function ratesById(list) { var m = {}; list.forEach(function (r) { m[r.id] = r; }); return m; }
  function buildSections(tpl, scale, rates) {
    var rm = ratesById(rates);
    return (TPL[tpl] || []).map(function (s) {
      return { id: uid('s'), title: s[0], items: s[1].filter(function (i) { return rm[i[0]]; }).map(function (i) {
        var r = rm[i[0]];
        return { id: uid('i'), rateId: r.id, name: r.name, unit: r.unit, rate: r.rate, qty: Math.max(1, Math.round(i[1] * (scale || 1))) };
      }) };
    });
  }

  function seed() {
    var rates = RATES.map(function (r) { return JSON.parse(JSON.stringify(r)); });
    var rows = [
      // client, project, site, tpl, scale, status, created, sent, viewed, closed, markup, discount
      ['Vikram & Leena Rao', 'Rao 3BHK, full interiors', 'Sector 56, Gurugram', 'full', 0.95, 'won', 178, 172, 170, 160, 12, 0],
      ['Nisha Bansal', 'Bansal kitchen and wardrobes', 'Vasant Kunj, New Delhi', 'kitchen', 1, 'lost', 165, 160, 158, 140, 12, 0],
      ['Dr Arjun Sethi', 'Sethi dental clinic fit-out', 'Greater Kailash II, New Delhi', 'clinic', 1, 'won', 150, 145, 144, 136, 14, 25000],
      ['Ishaan Malhotra', 'Malhotra 2BHK refresh', 'Dwarka Sector 12, New Delhi', 'refresh', 1, 'won', 132, 128, 127, 120, 10, 0],
      ['Parul Chawla', 'Chawla duplex, living and dining', 'DLF Phase 3, Gurugram', 'living', 1.2, 'lost', 118, 112, 110, 95, 12, 0],
      ['Kabir Arora', 'Arora office floor', 'Sector 62, Noida', 'office', 1, 'won', 100, 96, 95, 85, 12, 40000],
      ['Meenal & Sahil Kapoor', 'Kapoor villa, full interiors', 'Sushant Lok, Gurugram', 'full', 1.55, 'won', 88, 82, 80, 70, 12, 60000],
      ['Tara Khanna', 'Khanna kitchen remodel', 'Safdarjung Enclave, New Delhi', 'kitchen', 0.9, 'lost', 72, 68, 66, 55, 12, 0],
      ['Rohan Iyer', 'Iyer 3BHK interiors', 'Indirapuram, Ghaziabad', 'full', 1, 'won', 58, 52, 50, 40, 11, 0],
      ['Studio Verma', 'Verma café fit-out', 'Hauz Khas Village, New Delhi', 'clinic', 1.1, 'lost', 50, 46, 44, 30, 13, 0],
      ['Aditi Nambiar', 'Nambiar living room makeover', 'Golf Course Road, Gurugram', 'living', 0.8, 'won', 34, 30, 29, 24, 12, 0],
      ['Rhea Oberoi', 'Oberoi 2BHK refresh', 'Mayur Vihar Ph 1, New Delhi', 'refresh', 1.05, 'won', 40, 34, 33, 22, 10, 0],
      ['Kunal Saxena', 'Saxena penthouse', 'Vasant Vihar, New Delhi', 'full', 1.3, 'won', 20, 15, 14, 9, 12, 50000],
      ['Suresh & Pooja Bhatia', 'Bhatia duplex', 'Greater Noida West', 'full', 1.25, 'sent', 16, 14, 0, 0, 12, 0],
      ['Dev Mehra', 'Mehra penthouse, living and dining', 'Golf Course Ext. Road, Gurugram', 'living', 1.6, 'viewed', 12, 9, 7, 0, 13, 0],
      ['Anya Sinha', 'Sinha studio apartment', 'Saket, New Delhi', 'refresh', 0.6, 'sent', 7, 5, 0, 0, 10, 0],
      ['Harsh Vardhan', 'Vardhan clinic', 'Lajpat Nagar, New Delhi', 'clinic', 0.8, 'viewed', 6, 4, 2, 0, 12, 0],
      ['Mira Dutta', 'Dutta kitchen and wardrobes', 'Chittaranjan Park, New Delhi', 'kitchen', 1, 'sent', 3, 2, 0, 0, 12, 0],
      ['Nandini Rao', 'Rao home office', 'Sector 9, Rohini', 'office', 0.5, 'draft', 2, 0, 0, 0, 12, 0],
      ['Gaurav & Simran Gill', 'Gill 3BHK, full interiors', 'Sector 150, Noida', 'full', 1.1, 'draft', 1, 0, 0, 0, 12, 0]
    ];
    var quotes = rows.map(function (r, n) {
      var q = { id: uid('q'), no: 'Q-' + (1031 + n), client: r[0], project: r[1], site: r[2], status: r[5], markup: r[10], discount: r[11], tax: 18,
        created: ago(r[6]), sentAt: r[7] ? ago(r[7]) : null, viewedAt: r[8] ? ago(r[8]) : null, closedAt: r[9] ? ago(r[9]) : null,
        valid: addD(ds(new Date(Date.now() - (r[7] || r[6]) * 864e5)), 30), token: 'mr' + (1031 + n), log: [], plan: null,
        sections: buildSections(r[3], r[4], rates) };
      q.log.push({ t: q.created, k: 'draft', x: 'Quote created' });
      if (q.sentAt) q.log.push({ t: q.sentAt, k: 'sent', x: 'Sent to ' + q.client });
      if (q.viewedAt) q.log.push({ t: q.viewedAt, k: 'viewed', x: q.client + ' opened the quote link' });
      if (q.status === 'won') {
        q.log.push({ t: q.closedAt, k: 'won', x: q.client + ' accepted the quote' });
        q.acceptedBy = q.client.split(' & ')[0];
        q.plan = makePlan(q, nextMonday(addD(ds(new Date(q.closedAt)), 5)));
        q.plan.phases.forEach(function (p) { p.tasks.forEach(function (t) { t.done = t.end < TODAY; }); });
      }
      if (q.status === 'lost') q.log.push({ t: q.closedAt, k: 'lost', x: 'Marked lost: went with another studio' });
      return q;
    });
    return { v: 1, rates: rates, quotes: quotes, seq: 1031 + quotes.length };
  }

  /* ---------- totals ---------- */
  function secTotal(s) { return s.items.reduce(function (a, i) { return a + i.qty * i.rate; }, 0); }
  function calc(q) {
    var sub = q.sections.reduce(function (a, s) { return a + secTotal(s); }, 0);
    var mk = sub * q.markup / 100, disc = Math.min(q.discount || 0, sub + mk), taxable = sub + mk - disc, tax = taxable * q.tax / 100;
    return { sub: sub, mk: mk, disc: disc, taxable: taxable, tax: tax, total: taxable + tax };
  }
  function qTotal(q) { return calc(q).total; }

  /* ---------- project plan generator ---------- */
  function nextMonday(s) { var d = pd(s); while (d.getDay() !== 1) d.setDate(d.getDate() + 1); return ds(d); }
  var ORDER = ['civil', 'electr', 'plumb', 'ceiling', 'floor', 'carpent', 'paint', 'furnit'];
  var OWNERS = ['Meera · site lead', 'Dev · procurement', 'Karan · design', 'Sana · project manager'];
  function secRank(t) { t = t.toLowerCase(); for (var i = 0; i < ORDER.length; i++) if (t.indexOf(ORDER[i]) > -1) return i; return 5.5; }
  function short(n) { n = n.split(',')[0]; return n.length > 46 ? n.slice(0, 44) + '…' : n; }
  function spread(start, days, names, owner) {
    var n = names.length, len = Math.max(2, Math.round(days / n * 1.6)), gap = n > 1 ? (days - len) / (n - 1) : 0;
    return names.map(function (nm, i) {
      var s = addD(start, Math.round(i * gap)), e = addD(s, len - 1), pe = addD(start, days - 1);
      return { id: uid('t'), name: nm, start: s, end: e > pe ? pe : e, done: false, owner: owner };
    });
  }
  function makePlan(q, startISO) {
    var secs = q.sections.filter(function (s) { return s.items.length && !/^design/i.test(s.title); })
      .map(function (s, i) { return { s: s, i: i, r: secRank(s.title) }; })
      .sort(function (a, b) { return a.r - b.r || a.i - b.i; });
    var sum = secs.reduce(function (a, x) { return a + secTotal(x.s); }, 0) || 1;
    var phases = [], k = 0;
    function add(name, start, days, names, owner) {
      var p = { id: uid('p'), name: name, start: start, end: addD(start, days - 1), tasks: spread(start, days, names, owner) };
      phases.push(p); return p;
    }
    var kick = add('Kick-off and site measurement', startISO, 6, ['Site visit and measurement', 'Drawings and layout sign-off', 'Material selection and approvals'], OWNERS[2]);
    var prev = kick;
    secs.forEach(function (x) {
      var days = Math.max(5, Math.min(28, Math.round(5 + 34 * secTotal(x.s) / sum)));
      var start = addD(prev.start, Math.max(3, Math.round((diff(prev.start, prev.end) + 1) * (prev === kick ? 1 : .6))));
      var names = x.s.items.slice(0, 4).map(function (i) { return short(i.name); });
      if (x.s.items.length > 4) names.splice(3, 1, 'Remaining items (' + (x.s.items.length - 3) + ')');
      prev = add(x.s.title, start, days, names, OWNERS[k++ % 4]);
    });
    var lastEnd = phases.reduce(function (m, p) { return p.end > m ? p.end : m; }, startISO);
    add('Snagging and handover', addD(lastEnd, -1), 7, ['Snag-list walkthrough', 'Rectification', 'Deep clean and styling', 'Handover and documents'], OWNERS[3]);
    return { start: startISO, phases: phases, created: new Date().toISOString() };
  }
  function planStats(plan) {
    var td = 0, dd = 0, tc = 0, dc = 0, next = null;
    plan.phases.forEach(function (p) { p.tasks.forEach(function (t) {
      var d = diff(t.start, t.end) + 1; td += d; tc++; if (t.done) { dd += d; dc++; } else if (!next || t.start < next.start) next = t;
    }); });
    var start = plan.phases.reduce(function (m, p) { return p.start < m ? p.start : m; }, plan.phases[0].start);
    var end = plan.phases.reduce(function (m, p) { return p.end > m ? p.end : m; }, plan.phases[0].end);
    return { pct: td ? Math.round(dd / td * 100) : 0, tasks: tc, done: dc, next: next, start: start, end: end };
  }

  /* ---------- state ---------- */
  var S;
  function load() {
    try { var j = localStorage.getItem(KEY); if (j) { var o = JSON.parse(j); if (o && o.v === 1) return o; } } catch (e) { /* storage blocked */ }
    return seed();
  }

  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }
  function qById(id) { return S.quotes.filter(function (q) { return q.id === id; })[0]; }
  function qByToken(t) { return S.quotes.filter(function (q) { return q.token === t; })[0]; }
  function logq(q, k, x) { q.log.unshift({ t: new Date().toISOString(), k: k, x: x }); }
  function link(q) { return location.origin + location.pathname + '#/q/' + q.token; }
  var ui = { period: 'all', status: 'all', qsearch: '', sort: 'new', rcat: 'All', rsearch: '', pick: null, collapsed: {}, sclosed: {}, flash: null, celebrate: false, shown: {} };

  /* ---------- prefs, motion helpers ---------- */
  var UIK = 'mr-quotes-ui', prefs = { side: false };
  try { var pj = localStorage.getItem(UIK); if (pj) prefs = JSON.parse(pj) || prefs; } catch (e) { /* ignore */ }
  function savePrefs() { try { localStorage.setItem(UIK, JSON.stringify(prefs)); } catch (e) { /* ignore */ } }
  var G = window.gsap, RMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  function still() { return !G || RMQ.matches; }
  function from(t, v) { if (still() || !t || (t.length === 0)) return null; v.overwrite = 'auto'; return G.from(t, v); }
  function countTo(el, to, fmt, dur) {
    if (!el) return; var f = fmt || function (v) { return Math.round(v); };
    if (still()) { el.textContent = f(to); return; }
    var o = { v: el._v != null ? el._v : 0 };
    G.to(o, { v: to, duration: dur || .9, ease: 'expo.out', overwrite: true, onUpdate: function () { el.textContent = f(o.v); el._v = o.v; }, onComplete: function () { el.textContent = f(to); el._v = to; } });
  }
  function fmtBy(k) { return k === 'pct' ? function (v) { return Math.round(v) + '%'; } : k === 'cur' ? compact : function (v) { return String(Math.round(v)); }; }
  function setMoney(el, v) {
    if (!el) return;
    if (still() || el._v == null) { el.textContent = inr(v); el._v = v; return; }
    var o = { v: el._v }; el._v = v;
    G.to(o, { v: v, duration: .35, ease: 'power3.out', overwrite: true, onUpdate: function () { el.textContent = inr(o.v); }, onComplete: function () { el.textContent = inr(v); } });
  }

  /* ---------- icons ---------- */
  var IC = {
    dash: '<rect x="2.5" y="2.5" width="4.5" height="5.5" rx="1"/><rect x="9" y="2.5" width="4.5" height="3" rx="1"/><rect x="2.5" y="10" width="4.5" height="3.5" rx="1"/><rect x="9" y="7.5" width="4.5" height="6" rx="1"/>',
    quotes: '<path d="M4 2.5h5l3 3v8H4z"/><path d="M9 2.5v3h3M6 8.5h4M6 11h4"/>',
    rates: '<path d="M2.5 4h11M2.5 8h11M2.5 12h6"/>',
    projects: '<path d="M2.5 4h5M5 8h7M8 12h5.5"/>',
    search: '<circle cx="7" cy="7" r="4.2"/><path d="M10.2 10.2l3.3 3.3"/>',
    plus: '<path d="M8 3v10M3 8h10"/>',
    panel: '<rect x="2.5" y="3" width="11" height="10" rx="1.5"/><path d="M6.5 3v10"/>',
    keys: '<rect x="2" y="4" width="12" height="8" rx="1.5"/><path d="M5 7h.01M8 7h.01M11 7h.01M5.5 9.5h5"/>',
    reset: '<path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.8v2.7h2.7"/>',
    grip: '<circle cx="6" cy="4" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="4" r="1" fill="currentColor" stroke="none"/><circle cx="6" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="6" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="12" r="1" fill="currentColor" stroke="none"/>',
    chev: '<path d="M4 6l4 4 4-4"/>',
    trash: '<path d="M3 4.5h10M6.5 4.5V3h3v1.5M5 4.5l.5 8h5l.5-8"/>',
    x: '<path d="M4 4l8 8M12 4l-8 8"/>',
    copy: '<rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2"/>',
    link: '<path d="M6.5 9.5l3-3M7 4.5l.8-.8a2.5 2.5 0 0 1 3.5 3.5l-.8.8M9 11.5l-.8.8a2.5 2.5 0 0 1-3.5-3.5l.8-.8"/>',
    eye: '<path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="1.8"/>',
    check: '<path d="M3.5 8.5l3 3 6-7"/>',
    send: '<path d="M2.5 8l11-5-4 11-2.2-4.8z"/>',
    arrow: '<path d="M3 8h10M9 4l4 4-4 4"/>',
    print: '<path d="M4.5 6V2.5h7V6M4.5 11.5h-2v-5h11v5h-2M4.5 9.5h7v4h-7z"/>',
    user: '<circle cx="8" cy="5.5" r="2.5"/><path d="M3 13.5c.5-2.5 2.5-3.5 5-3.5s4.5 1 5 3.5"/>',
    cmd: '<path d="M6 6V4a1.5 1.5 0 1 0-1.5 1.5H6zm0 0h4m-4 0v4m4-4V4a1.5 1.5 0 1 1 1.5 1.5H10zm0 0v4m0 0h1.5A1.5 1.5 0 1 1 10 12v-2zm0 0H6m0 0v2A1.5 1.5 0 1 1 4.5 10.5H6z"/>'
  };
  function ic(n) { return '<span class="ico" aria-hidden="true"><svg viewBox="0 0 16 16">' + (IC[n] || '') + '</svg></span>'; }
  function hydrate(root) { Array.prototype.forEach.call((root || document).querySelectorAll('[data-ic]'), function (e) { e.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true">' + (IC[e.dataset.ic] || '') + '</svg>'; e.removeAttribute('data-ic'); }); }
  function iconBtn(act, icon, label, extra) { return '<button type="button" class="icon-btn ' + (extra || '') + '" data-act="' + act + '" aria-label="' + esc(label) + '" data-tip="' + esc(label) + '">' + ic(icon) + '</button>'; }

  /* ---------- toast ---------- */
  function toast(msg, opt) {
    opt = opt || {};
    var el = document.createElement('div'); el.className = 'toast';
    el.innerHTML = (opt.plain ? '' : ic('check')) + '<span>' + esc(msg) + '</span>' + (opt.action ? '<button type="button">' + esc(opt.action) + '</button>' : '');
    while (toastEl.children.length > 2) toastEl.removeChild(toastEl.firstChild);
    toastEl.appendChild(el);
    from(el, { y: 14, opacity: 0, duration: .4, ease: 'expo.out' });
    var gone = false;
    function kill() { if (gone) return; gone = true; if (still()) { el.remove(); return; } G.to(el, { y: 8, opacity: 0, duration: .22, ease: 'power2.in', onComplete: function () { el.remove(); } }); }
    if (opt.action) el.querySelector('button').addEventListener('click', function () { if (opt.fn) opt.fn(); kill(); });
    setTimeout(kill, opt.action ? 6000 : 3000);
  }

  /* ---------- views ---------- */
  function pill(s) { return '<span class="pill ' + s + '">' + ({ draft: 'Draft', sent: 'Sent', viewed: 'Viewed', won: 'Won', lost: 'Lost' }[s]) + '</span>'; }
  function emptyArt() { return '<svg viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="10" y="8" width="30" height="38" rx="3"/><path d="M17 18h16M17 25h16M17 32h9"/><circle cx="40" cy="40" r="9" fill="var(--bg)"/><path d="M36.5 40h7M40 36.5v7"/></svg>'; }

  function skeleton() {
    var b = function (w, h, m) { return '<span class="sk" style="width:' + w + ';height:' + h + 'px;' + (m || '') + '"></span>'; };
    return '<div class="page" aria-busy="true" aria-label="Loading">' + b('180px', 28, 'margin-bottom:8px') + b('320px', 16, 'margin-bottom:24px') +
      '<div class="kpis">' + [1, 2, 3, 4].map(function () { return '<div class="kpi">' + b('90px', 14) + b('120px', 30, 'margin-top:8px') + b('140px', 12, 'margin-top:6px') + '</div>'; }).join('') + '</div>' +
      '<div class="dgrid"><div class="card" style="padding:16px">' + b('200px', 16, 'margin-bottom:16px') + b('100%', 200) + '</div><div class="card" style="padding:16px">' + b('120px', 16, 'margin-bottom:16px') + b('100%', 14, 'margin-bottom:14px') + b('100%', 14, 'margin-bottom:14px') + b('100%', 14) + '</div></div></div>';
  }

  function monthSeries() {
    var months = [], now = new Date();
    for (var m = 5; m >= 0; m--) { var d = new Date(now.getFullYear(), now.getMonth() - m, 1); months.push({ y: d.getFullYear(), m: d.getMonth(), sent: 0, won: 0, sn: 0, vn: 0, wn: 0 }); }
    S.quotes.forEach(function (q) {
      months.forEach(function (b) {
        function hit(t) { var x = new Date(t); return x.getFullYear() === b.y && x.getMonth() === b.m; }
        if (q.sentAt && hit(q.sentAt)) { b.sent += qTotal(q); b.sn++; }
        if (q.viewedAt && hit(q.viewedAt)) b.vn++;
        if (q.status === 'won' && q.closedAt && hit(q.closedAt)) { b.won += qTotal(q); b.wn++; }
      });
    });
    return months;
  }
  function sparkSvg(vals) {
    var W = 84, H = 28, mx = Math.max.apply(null, vals.concat([1])), n = vals.length;
    var pts = vals.map(function (v, i) { return [2 + i * (W - 4) / (n - 1), H - 3 - v / mx * (H - 8)]; });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' '), l = pts[n - 1];
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1"/><circle cx="' + l[0].toFixed(1) + '" cy="' + l[1].toFixed(1) + '" r="2.2" fill="currentColor"/></svg>';
  }


  function chartW() { var box = document.querySelector('.chart-box'); if (box && box.clientWidth > 120) return box.clientWidth - 24; return innerWidth <= 560 ? Math.max(280, innerWidth - 32 - 2 - 24) : 640; }
  function chartSvg(months, W) {
    var max = Math.max.apply(null, months.map(function (b) { return Math.max(b.sent, b.won); }).concat([1]));
    var step = Math.pow(10, Math.floor(Math.log(max) / Math.LN10)), top = Math.ceil(max / step) * step;
    if (top / step < 3) { step = step / 2; top = Math.ceil(max / step) * step; }
    var H = W < 420 ? 220 : 248, L = 58, B = 28, T = 12, cw = (W - L) / months.length, ph = H - B - T, svg = '', g;
    for (g = 0; g <= top + 1; g += step) {
      var y = T + ph - g / top * ph;
      svg += '<line class="grid" x1="' + L + '" x2="' + W + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"' + (g === 0 ? ' style="stroke:var(--line-2)"' : '') + '/><text x="' + (L - 10) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' + (g ? compact(g).replace('.0', '') : '0') + '</text>';
    }
    months.forEach(function (b, i) {
      var bw = Math.min(26, cw * .27), gap = 4, x = L + i * cw + cw / 2 - bw - gap / 2, h1 = b.sent / top * ph, h2 = b.won / top * ph;
      svg += '<rect class="bar-r" data-bar x="' + x.toFixed(1) + '" y="' + (T + ph - h1).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h1.toFixed(1) + '" rx="2" fill="#CBC6BB"/>' +
        '<rect class="bar-r" data-bar x="' + (x + bw + gap).toFixed(1) + '" y="' + (T + ph - h2).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h2.toFixed(1) + '" rx="2" fill="#B3401A"/>' +
        '<text x="' + (L + i * cw + cw / 2).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + MON[b.m] + '</text>';
    });
    months.forEach(function (b, i) {
      svg += '<rect class="col-hit" tabindex="0" role="img" data-col="' + i + '" x="' + (L + i * cw).toFixed(1) + '" y="' + T + '" width="' + cw.toFixed(1) + '" height="' + ph + '" aria-label="' + MON[b.m] + ' ' + b.y + ': sent ' + compact(b.sent) + ', won ' + compact(b.won) + '"/>';
    });
    return { svg: svg, W: W, H: H };
  }
  function fitChart(animate) {
    var el = document.getElementById('chart'); if (!el || !ui.months) return;
    var w = chartW(), cur0 = +el.getAttribute('viewBox').split(' ')[2]; if (Math.abs(w - cur0) < 6) return;
    var cd = chartSvg(ui.months, w); el.setAttribute('viewBox', '0 0 ' + cd.W + ' ' + cd.H); el.innerHTML = cd.svg;
  }

  function viewDash() {
    var all = S.quotes, cut = ui.period === 'all' ? 0 : Date.now() - (+ui.period) * 864e5;
    var inP = all.filter(function (q) { return q.sentAt && new Date(q.sentAt) >= cut; });
    var sent = inP.length, viewed = inP.filter(function (q) { return q.viewedAt; }).length;
    var won = inP.filter(function (q) { return q.status === 'won'; }), lost = inP.filter(function (q) { return q.status === 'lost'; }).length;
    var wonV = won.reduce(function (a, q) { return a + qTotal(q); }, 0), sentV = inP.reduce(function (a, q) { return a + qTotal(q); }, 0);
    var open = all.filter(function (q) { return q.status === 'sent' || q.status === 'viewed'; }), openV = open.reduce(function (a, q) { return a + qTotal(q); }, 0);
    var decided = won.length + lost, rate = decided ? Math.round(won.length / decided * 100) : 0;
    var months = monthSeries(); ui.months = months;

    var max = Math.max.apply(null, months.map(function (b) { return Math.max(b.sent, b.won); }).concat([1]));
    var step = Math.pow(10, Math.floor(Math.log(max) / Math.LN10)), top = Math.ceil(max / step) * step;
    if (top / step < 3) { step = step / 2; top = Math.ceil(max / step) * step; }
    var cd = chartSvg(months, chartW()), W = cd.W, H = cd.H, svg = cd.svg;
    var feed = [];
    all.forEach(function (q) { q.log.forEach(function (l) { if (l.k !== 'draft') feed.push({ t: l.t, k: l.k, x: l.x, q: q }); }); });
    feed.sort(function (a, b) { return new Date(b.t) - new Date(a.t); });
    var follow = open.filter(function (q) { return (Date.now() - new Date(q.sentAt)) / 864e5 >= 4; }).sort(function (a, b) { return new Date(a.sentAt) - new Date(b.sentAt); });
    var recent = all.slice().sort(function (a, b) { return new Date(b.created) - new Date(a.created); }).slice(0, 6);

    function f(label, n, of, sub) { return '<li><span>' + label + '</span><span class="bar"><i data-w="' + (of ? Math.round(n / of * 100) : 0) + '" style="width:' + (of ? Math.round(n / of * 100) : 0) + '%"></i></span><b>' + n + (sub ? '<small>' + sub + '</small>' : '') + '</b></li>'; }
    function kpi(label, val, kf, sub, series, hl) { return '<div class="kpi' + (hl ? ' hl' : '') + '"><p>' + label + '</p><b data-kv="' + val + '" data-kf="' + kf + '">' + fmtBy(kf)(val) + '</b><small>' + sub + '</small>' + sparkSvg(series) + '</div>'; }
    var alt = 'Quote value sent and won per month: ' + months.map(function (b) { return MON[b.m] + ' sent ' + compact(b.sent) + ', won ' + compact(b.won); }).join('; ');
    var per = [['30', '30 days'], ['90', '90 days'], ['all', 'All time']];

    return '<div class="page"><div class="ph"><div><h1 tabindex="-1">Dashboard</h1><p class="sub">How quotes are moving from sent to won. Figures cover quotes sent in the selected period.</p></div>' +
      '<div class="acts"><div class="tabs" role="group" aria-label="Period">' + per.map(function (o) { return '<button type="button" class="tab" data-chip="period" data-v="' + o[0] + '" aria-pressed="' + (ui.period === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div></div></div>' +
      '<div class="kpis">' + kpi('Quotes sent', sent, 'int', compact(sentV) + ' quoted', months.map(function (b) { return b.sn; })) +
      kpi('Viewed by client', viewed, 'int', (sent ? Math.round(viewed / sent * 100) : 0) + '% of sent', months.map(function (b) { return b.vn; })) +
      kpi('Win rate', rate, 'pct', won.length + ' won of ' + decided + ' decided', months.map(function (b) { return b.wn; })) +
      kpi('Won value', wonV, 'cur', 'incl. GST, ' + won.length + ' projects', months.map(function (b) { return b.won; }), true) + '</div>' +
      '<div class="dgrid"><section class="card" aria-labelledby="h-ch"><div class="hd"><h2 id="h-ch">Quoted vs won, last 6 months</h2><p class="legend"><span><i style="background:#CBC6BB"></i>Sent</span><span><i style="background:var(--brand)"></i>Won</span></p></div>' +
      '<div class="chart-box"><svg class="chart" id="chart" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="' + esc(alt) + '">' + svg + '</svg></div></section>' +
      '<section class="card" aria-labelledby="h-fn"><div class="hd"><h2 id="h-fn">Pipeline</h2></div><ul class="funnel">' + f('Sent', sent, sent) + f('Viewed', viewed, sent, sent ? Math.round(viewed / sent * 100) + '%' : '') + f('Won', won.length, sent, sent ? Math.round(won.length / sent * 100) + '%' : '') + '</ul>' +
      '<p class="note"><b>' + compact(openV) + '</b> across ' + open.length + ' quotes still waiting for a decision.</p></section></div>' +
      '<div class="dgrid"><section class="card" aria-labelledby="h-rq"><div class="hd"><h2 id="h-rq">Recent quotes</h2><a class="btn sm ghost" href="#/quotes">View all ' + ic('arrow') + '</a></div>' + quoteTable(recent, true) + '</section>' +
      '<div class="stack-col"><section class="card" aria-labelledby="h-fu"><div class="hd"><h2 id="h-fu">Follow-ups due</h2></div>' +
      (follow.length ? '<ul class="feed">' + follow.map(function (q) { return '<li><span class="dot ' + q.status + '"></span><div><a href="#/quote/' + q.id + '">' + esc(q.project) + '</a><time>' + (q.status === 'viewed' ? 'Viewed, no reply' : 'Not opened yet') + ' · sent ' + rel(q.sentAt) + '</time></div></li>'; }).join('') + '</ul>' : '<ul class="feed"><li class="empty-l">Nothing waiting on a reply.</li></ul>') + '</section>' +
      '<section class="card" aria-labelledby="h-ac"><div class="hd"><h2 id="h-ac">Activity</h2></div><ul class="feed">' +
      feed.slice(0, 6).map(function (e) { return '<li><span class="dot ' + e.k + '"></span><div><a href="#/quote/' + e.q.id + '">' + esc(e.q.no) + '</a> ' + esc(e.x) + '<time>' + rel(e.t) + '</time></div></li>'; }).join('') + '</ul></section></div></div></div>';
  }

  function quoteTable(list, compactMode) {
    if (!list.length) return '';
    return '<div class="tbl-wrap"><table class="tbl stack"><thead><tr><th>Quote</th><th>Status</th>' + (compactMode ? '' : '<th>Sent</th><th>Valid until</th>') + '<th class="r">Total incl. GST</th>' + (compactMode ? '' : '<th class="act"><span class="vh">Actions</span></th>') + '</tr></thead><tbody>' +
      list.map(function (q) {
        var acts = compactMode ? '' : '<td class="act"><div class="row-acts">' + iconBtn('row-copy', 'link', 'Copy client link', '') .replace('data-act', 'data-q="' + q.id + '" data-act') +
          '<a class="icon-btn" href="#/q/' + q.token + '?preview=1" aria-label="Open client view of ' + esc(q.no) + '" data-tip="Client view">' + ic('eye') + '</a>' +
          iconBtn('row-dup', 'copy', 'Duplicate quote', '').replace('data-act', 'data-q="' + q.id + '" data-act') + '</div></td>';
        return '<tr data-href="#/quote/' + q.id + '"><td class="c-main"><a class="tl" href="#/quote/' + q.id + '">' + esc(q.project) + '</a><small>' + esc(q.no) + ' · ' + esc(q.client) + '</small></td><td class="c-st">' + pill(q.status) + '</td>' +
          (compactMode ? '' : '<td class="c-date muted">' + (q.sentAt ? fdate(q.sentAt) : '—') + '</td><td class="c-valid muted">' + (q.status === 'draft' || q.status === 'sent' || q.status === 'viewed' ? fdate(q.valid) : '—') + '</td>') +
          '<td class="r c-val">' + inr(qTotal(q)) + '</td>' + acts + '</tr>';
      }).join('') + '</tbody></table></div>';
  }
  function listEmpty() {
    var filtered = ui.status !== 'all' || ui.qsearch;
    return '<div class="empty">' + emptyArt() + '<b>' + (filtered ? 'No quotes match' : 'No quotes yet') + '</b><p>' + (filtered ? 'Nothing fits the current filter. Try a different status or clear the search.' : 'Create your first BOQ quote from a template and price it from the rate library.') + '</p>' +
      (filtered ? '<button type="button" class="btn" data-act="clear-filters">Clear filters</button>' : '<button type="button" class="btn pri" data-act="new-quote">' + ic('plus') + 'New quote</button>') + '</div>';
  }
  function qlistHtml() { var l = filteredQuotes(); return l.length ? quoteTable(l) : listEmpty(); }

  function viewQuotes() {
    var counts = { all: S.quotes.length }; ['draft', 'sent', 'viewed', 'won', 'lost'].forEach(function (s) { counts[s] = S.quotes.filter(function (q) { return q.status === s; }).length; });
    return '<div class="page"><div class="ph"><div><h1 tabindex="-1">Quotes</h1><p class="sub">Every BOQ quote, from first draft to signed-off project. Start a new one with the button above or press N.</p></div></div>' +
      '<div class="toolbar"><div class="tabs" role="group" aria-label="Filter by status">' +
      ['all', 'draft', 'sent', 'viewed', 'won', 'lost'].map(function (s) { return '<button type="button" class="tab" data-chip="status" data-v="' + s + '" aria-pressed="' + (ui.status === s) + '">' + (s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)) + ' <i>' + counts[s] + '</i></button>'; }).join('') +
      '</div><div class="acts"><div class="sfield">' + ic('search') + '<label class="vh" for="qs">Search quotes</label><input class="in" id="qs" type="search" placeholder="Search client, project or number" value="' + esc(ui.qsearch) + '" data-search="q"></div>' +
      '<label class="vh" for="qsort">Sort quotes</label><select class="in" id="qsort" data-sel="sort" style="width:auto">' + [['new', 'Newest first'], ['val', 'Highest value'], ['old', 'Oldest first']].map(function (o) { return '<option value="' + o[0] + '"' + (ui.sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div></div>' +
      '<section class="card" id="qlist" aria-label="Quotes">' + qlistHtml() + '</section></div>';
  }
  function filteredQuotes() {
    var t = ui.qsearch.toLowerCase();
    return S.quotes.filter(function (q) { return (ui.status === 'all' || q.status === ui.status) && (!t || (q.client + ' ' + q.project + ' ' + q.no).toLowerCase().indexOf(t) > -1); })
      .sort(function (a, b) { return ui.sort === 'val' ? qTotal(b) - qTotal(a) : ui.sort === 'old' ? new Date(a.created) - new Date(b.created) : new Date(b.created) - new Date(a.created); });
  }

  /* rate library */
  function cats() { var c = []; S.rates.forEach(function (r) { if (c.indexOf(r.cat) < 0) c.push(r.cat); }); return c; }
  function usage(id) { var n = 0; S.quotes.forEach(function (q) { if (q.sections.some(function (s) { return s.items.some(function (i) { return i.rateId === id; }); })) n++; }); return n; }
  function rateRows() {
    var t = ui.rsearch.toLowerCase(), html = '', any = false;
    cats().forEach(function (c) {
      if (ui.rcat !== 'All' && ui.rcat !== c) return;
      var rows = S.rates.filter(function (r) { return r.cat === c && (!t || r.name.toLowerCase().indexOf(t) > -1); });
      if (!rows.length) return; any = true;
      html += '<h3 class="rate-cat">' + esc(c) + '<span>' + rows.length + ' rates</span></h3>' + rows.map(function (r) {
        return '<div class="rate-row' + (ui.flash === r.id ? ' flash' : '') + '" data-r="' + r.id + '"><div class="rn"><label class="vh" for="n-' + r.id + '">Item name</label><textarea class="in bare" rows="1" id="n-' + r.id + '" data-rb="name" data-wrap>' + esc(r.name) + '</textarea></div>' +
          '<div class="ru"><label class="vh" for="u-' + r.id + '">Unit</label><input class="in bare" id="u-' + r.id + '" data-rb="unit" value="' + esc(r.unit) + '"></div>' +
          '<div class="rr"><label class="vh" for="r-' + r.id + '">Rate in rupees</label><input class="in num" id="r-' + r.id + '" inputmode="decimal" data-rb="rate" data-fmt value="' + fnum(r.rate) + '"></div>' +
          '<div class="rc">' + usage(r.id) + ' quotes</div><div class="rd2">' + (r.upd ? fshort(r.upd) : '—') + '</div>' +
          iconBtn('rate-del', 'trash', 'Delete ' + short(r.name), 'rd danger').replace('data-act', 'data-id="' + r.id + '" data-act') + '</div>';
      }).join('');
    });
    if (!any) return '<div class="empty">' + emptyArt() + '<b>No rates match</b><p>Try another search, or add the item to your library.</p><button type="button" class="btn" data-act="rate-new">' + ic('plus') + 'Add a rate</button></div>';
    return '<div class="rate-row head" aria-hidden="true"><span>Item</span><span>Unit</span><span style="text-align:right;padding-right:10px">Rate (₹)</span><span>Used in</span><span>Updated</span><span></span></div>' + html;
  }
  function viewRates() {
    return '<div class="page"><div class="ph"><div><h1 tabindex="-1">Rate library</h1><p class="sub">Standard rates by unit. Quotes copy a rate when an item is added; refresh a quote from here at any time.</p></div><div class="acts"><button type="button" class="btn pri" data-act="rate-new">' + ic('plus') + 'Add a rate</button></div></div>' +
      '<div class="toolbar"><div class="tabs" role="group" aria-label="Filter by category">' +
      ['All'].concat(cats()).map(function (c) { return '<button type="button" class="tab" data-chip="rcat" data-v="' + esc(c) + '" aria-pressed="' + (ui.rcat === c) + '">' + esc(c) + '</button>'; }).join('') +
      '</div><div class="sfield">' + ic('search') + '<label class="vh" for="rs">Search rate library</label><input class="in" id="rs" type="search" placeholder="Search items" value="' + esc(ui.rsearch) + '" data-search="r"></div></div>' +
      '<section class="card" id="ratelist" aria-label="Rates">' + rateRows() + '</section></div>';
  }

  /* builder */
  function itemRow(s, i, lock) {
    var d = lock ? ' disabled' : '';
    return '<div class="li' + (ui.flash === i.id ? ' flash-row' : '') + '" data-i="' + i.id + '">' +
      (lock ? '<span></span>' : '<button type="button" class="grip" data-grip="item" aria-label="Reorder ' + esc(short(i.name)) + '. Drag, or use arrow up and down" aria-keyshortcuts="ArrowUp ArrowDown">' + ic('grip') + '</button>') +
      '<label class="ln"><span class="cap">Item</span><textarea class="in bare" rows="1" data-b="name" data-wrap aria-label="Item description"' + d + '>' + esc(i.name) + '</textarea></label>' +
      '<label class="lq"><span class="cap">Qty (' + esc(i.unit) + ')</span><input class="in num" inputmode="decimal" data-b="qty" data-fmt value="' + fnum(i.qty) + '" aria-label="Quantity in ' + esc(i.unit) + '"' + d + '></label>' +
      '<span class="lu un">' + esc(i.unit) + '</span>' +
      '<label class="lr"><span class="cap">Rate (₹)</span><input class="in num" inputmode="decimal" data-b="rate" data-fmt value="' + fnum(i.rate) + '" aria-label="Rate in rupees"' + d + '></label>' +
      '<div class="la amt"><span class="cap">Amount</span><span data-amt>' + inr(i.qty * i.rate) + '</span></div>' +
      (lock ? '<span></span>' : '<button type="button" class="icon-btn ld danger" data-act="del-item" aria-label="Remove ' + esc(short(i.name)) + '">' + ic('x') + '</button>') + '</div>';
  }
  function secHtml(s, lock) {
    var closed = ui.sclosed[s.id];
    return '<section class="card sec' + (closed ? ' closed' : '') + '" data-s="' + s.id + '" aria-label="Section ' + esc(s.title) + '"><div class="sec-hd">' +
      (lock ? '<span></span>' : '<button type="button" class="grip" data-grip="sec" aria-label="Reorder section ' + esc(s.title) + '. Drag, or use arrow up and down" aria-keyshortcuts="ArrowUp ArrowDown">' + ic('grip') + '</button>') +
      '<button type="button" class="icon-btn chev" data-act="toggle-sec" aria-expanded="' + !closed + '" aria-label="Collapse section ' + esc(s.title) + '">' + ic('chev') + '</button>' +
      '<label class="vh" for="st-' + s.id + '">Section title</label><input class="in bare" id="st-' + s.id + '" data-b="title" value="' + esc(s.title) + '"' + (lock ? ' disabled' : '') + '>' +
      '<span class="sec-n" data-secn>' + s.items.length + (s.items.length === 1 ? ' item' : ' items') + '</span><span class="sec-tot" data-sectot>' + inr(secTotal(s)) + '</span>' +
      (lock ? '<span></span>' : iconBtn('del-sec', 'trash', 'Delete section ' + s.title, 'danger')) + '</div>' +
      '<div class="sec-body"><div class="li head" aria-hidden="true"><span></span><span>Item</span><span style="text-align:right;padding-right:10px">Qty</span><span>Unit</span><span style="text-align:right;padding-right:10px">Rate</span><span style="text-align:right">Amount</span><span></span></div>' +
      '<div class="sec-items" data-items>' + s.items.map(function (i) { return itemRow(s, i, lock); }).join('') + '</div>' +
      (s.items.length ? '' : '<p class="sec-empty">No items yet. Add from the rate library or drag a line here.</p>') +
      (lock ? '' : '<div class="li-foot"><button type="button" class="btn sm" data-act="add-item">' + ic('plus') + 'Add from rate library</button><button type="button" class="btn sm ghost" data-act="add-custom">Custom line</button></div>') + '</div></section>';
  }
  function summaryHtml(q, lock) {
    var c = calc(q), d = lock ? ' disabled' : '';
    return '<section class="card sum" aria-labelledby="h-sum"><div class="hd"><h2 id="h-sum">Summary</h2></div><dl>' +
      '<dt>Items subtotal</dt><dd id="t-sub">' + inr(c.sub) + '</dd>' +
      '<dt><label for="mk">Studio fee and overheads</label></dt><dd class="inl"><input class="in num" id="mk" inputmode="decimal" data-qb="markup" value="' + q.markup + '"' + d + '> %</dd><dd class="sub-v" id="t-mk">' + inr(c.mk) + '</dd>' +
      '<dt><label for="ds">Discount (₹)</label></dt><dd class="inl"><input class="in num" id="ds" style="width:110px" inputmode="decimal" data-qb="discount" data-fmt value="' + fnum(q.discount || 0) + '"' + d + '></dd>' +
      '<dt>Taxable value</dt><dd id="t-tx">' + inr(c.taxable) + '</dd>' +
      '<dt><label for="gs">GST</label></dt><dd class="inl"><input class="in num" id="gs" inputmode="decimal" data-qb="tax" value="' + q.tax + '"' + d + '> %</dd><dd class="sub-v" id="t-gst">' + inr(c.tax) + '</dd></dl>' +
      '<div class="split" role="img" aria-label="Share of total: items, studio fee, GST"><i id="sp-1" style="background:var(--ink)"></i><i id="sp-2" style="background:var(--brand)"></i><i id="sp-3" style="background:var(--ink-4)"></i></div>' +
      '<p class="legend"><span><i style="background:var(--ink)"></i>Items</span><span><i style="background:var(--brand)"></i>Fee</span><span><i style="background:var(--ink-4)"></i>GST</span></p>' +
      '<div class="tot-row"><span>Total</span><b id="t-tot">' + inr(c.total) + '</b></div></section>';
  }
  function viewBuilder(q) {
    var lock = q.status === 'won' || q.status === 'lost', st = q.status, acts = '';
    if (st === 'draft') acts = '<button type="button" class="btn" data-act="preview">' + ic('eye') + 'Preview as client</button><button type="button" class="btn pri" data-act="send">' + ic('send') + 'Send to client</button>';
    else if (st === 'sent' || st === 'viewed') acts = '<button type="button" class="btn" data-act="copy-link">' + ic('link') + 'Copy client link</button><a class="btn pri" href="#/q/' + q.token + '">' + ic('eye') + 'Open as client</a>';
    else if (st === 'won') acts = '<a class="btn" href="#/q/' + q.token + '?preview=1">' + ic('eye') + 'Client view</a><a class="btn pri" href="#/project/' + q.id + '">Open project plan ' + ic('arrow') + '</a>';
    else acts = '<button type="button" class="btn" data-act="reopen">Reopen as draft</button>';
    var banner = st === 'won' ? '<div class="banner ok" role="note">' + ic('check') + 'Accepted by ' + esc(q.acceptedBy || q.client) + ' on ' + fdate(q.closedAt) + '. The quote is locked and its project plan is live.</div>'
      : st === 'lost' ? '<div class="banner" role="note">This quote was marked lost and is locked. Reopen it as a draft to revise.</div>'
      : (st === 'sent' || st === 'viewed') ? '<div class="banner" role="note">Sent ' + rel(q.sentAt) + '. Edits show on the client link straight away.</div>' : '';
    var d = lock ? ' disabled' : '';
    return '<div class="page"><div class="ph"><div><h1 tabindex="-1" id="qh">' + esc(q.project) + '</h1><p class="sub" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">' + pill(st) + '<span>' + esc(q.client) + ' · ' + esc(q.no) + '</span>' + (lock ? '' : '<span class="saved" id="saved">' + ic('check') + 'Saved</span>') + '</p></div><div class="acts">' + acts + '</div></div>' + banner +
      '<div class="bld"><div class="bld-main"><section class="card" aria-labelledby="h-det"><div class="hd"><h2 id="h-det">Project details</h2></div><div class="body"><div class="grid2">' +
      '<label class="fld"><span>Client</span><input class="in" data-qm="client" value="' + esc(q.client) + '"' + d + '></label>' +
      '<label class="fld"><span>Project</span><input class="in" data-qm="project" value="' + esc(q.project) + '"' + d + '></label>' +
      '<label class="fld"><span>Site address</span><input class="in" data-qm="site" value="' + esc(q.site) + '"' + d + '></label>' +
      '<label class="fld"><span>Valid until</span><input class="in" type="date" data-qm="valid" value="' + esc(q.valid) + '"' + d + '></label></div></div></section>' +
      '<div id="secs" class="bld-main">' + q.sections.map(function (s) { return secHtml(s, lock); }).join('') + '</div>' +
      (lock ? '' : '<div class="acts"><button type="button" class="btn" data-act="add-sec">' + ic('plus') + 'Add section</button><button type="button" class="btn ghost" data-act="refresh-rates">Refresh rates from library</button></div>') + '</div>' +
      '<aside class="bld-side" id="sumside" aria-label="Quote summary and tools">' + summaryHtml(q, lock) +
      '<section class="card"><div class="hd"><h2>Actions</h2></div><div class="acts-col">' +
      '<button type="button" class="btn" data-act="dup">' + ic('copy') + 'Duplicate quote</button>' +
      (st === 'sent' || st === 'viewed' ? '<button type="button" class="btn danger" data-act="mark-lost">Mark as lost</button>' : '') +
      (st === 'draft' ? '<button type="button" class="btn danger" data-act="del-quote">' + ic('trash') + 'Delete draft</button>' : '') + '</div></section>' +
      '<section class="card"><div class="hd"><h2>Activity</h2></div><ul class="log">' + q.log.slice(0, 8).map(function (l) { return '<li><span>' + esc(l.x) + '</span><time>' + fshort(l.t) + '</time></li>'; }).join('') + '</ul></section></aside></div>' +
      '<div class="sumbar noprint"><div><small>Total incl. GST</small><b id="t-tot2">' + inr(calc(q).total) + '</b></div><button type="button" class="btn" data-act="goto-sum">Summary</button></div></div>';
  }

  /* gantt */
  function gantt(plan, interactive) {
    var start = plan.phases.reduce(function (m, p) { return p.start < m ? p.start : m; }, plan.phases[0].start);
    var end = plan.phases.reduce(function (m, p) { return p.end > m ? p.end : m; }, plan.phases[0].end);
    var d0 = pd(start); while (d0.getDay() !== 1) d0.setDate(d0.getDate() - 1);
    var s0 = ds(d0), weeks = Math.ceil((diff(s0, end) + 1) / 7) + 1, total = weeks * 7;
    function pct(x) { return (diff(s0, x) / total * 100).toFixed(3); }
    function wid(a, b) { return ((diff(a, b) + 1) / total * 100).toFixed(3); }
    var wk = ''; for (var i = 0; i < weeks; i++) wk += '<span>' + fshort(addD(s0, i * 7)) + '</span>';
    var rows = '<div class="g-row g-head"><div class="g-lab">Phase / task</div><div class="g-weeks" aria-hidden="true">' + wk + '</div></div>';
    plan.phases.forEach(function (p) {
      var td = 0, dd = 0; p.tasks.forEach(function (t) { var n = diff(t.start, t.end) + 1; td += n; if (t.done) dd += n; });
      var pc = td ? Math.round(dd / td * 100) : 0, open = !ui.collapsed[p.id];
      rows += '<div class="g-row g-phase"><div class="g-lab"><button type="button" data-act="toggle-phase" data-id="' + p.id + '" aria-expanded="' + open + '"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4"/></svg><span class="t" data-tip="' + esc(p.name) + '">' + esc(p.name) + '</span></button></div>' +
        '<div class="g-trk"><div class="gb ph-b" data-tip="' + esc(p.name) + '|' + fshort(p.start) + ' to ' + fshort(p.end) + ' · ' + pc + '% done" style="left:' + pct(p.start) + '%;width:' + wid(p.start, p.end) + '%" role="img" aria-label="' + esc(p.name) + ', ' + fshort(p.start) + ' to ' + fshort(p.end) + ', ' + pc + ' percent done"><i style="width:' + pc + '%"></i></div></div></div>';
      if (open) p.tasks.forEach(function (t) {
        rows += '<div class="g-row g-task' + (t.done ? ' done' : '') + '"><div class="g-lab">' +
          (interactive ? '<label><input type="checkbox" id="tk-' + t.id + '" data-act="toggle-task" data-p="' + p.id + '" data-t="' + t.id + '"' + (t.done ? ' checked' : '') + '><span class="t" data-tip="' + esc(t.name) + '">' + esc(t.name) + '</span></label>' : '<span class="t" data-tip="' + esc(t.name) + '">' + esc(t.name) + '</span>') + '</div>' +
          '<div class="g-trk"><div class="gb tk' + (t.done ? ' done' : '') + '" data-tip="' + esc(t.name) + '|' + fshort(t.start) + ' to ' + fshort(t.end) + ' · ' + esc(t.owner) + '" style="left:' + pct(t.start) + '%;width:' + wid(t.start, t.end) + '%"></div></div></div>';
      });
    });
    var today = TODAY >= s0 && TODAY <= addD(s0, total) ? '<div class="gl-overlay" aria-hidden="true"><div class="today" style="left:' + pct(TODAY) + '%"></div></div>' : '';
    return '<div class="gantt-wrap" tabindex="0" role="region" aria-label="Project timeline, scrolls sideways"><div class="gantt" style="--wk:' + weeks + '">' + rows + today + '</div></div>';
  }

  function viewProjects() {
    var list = S.quotes.filter(function (q) { return q.plan; }).sort(function (a, b) { return planStats(a.plan).pct - planStats(b.plan).pct; });
    return '<div class="page"><div class="ph"><div><h1 tabindex="-1">Projects</h1><p class="sub">An accepted quote becomes a project plan automatically: phases and tasks come from the quote\'s sections and line items.</p></div></div>' +
      (list.length ? '<div class="pcards">' + list.map(function (q) {
        var s = planStats(q.plan), st = s.pct >= 100 ? 'Completed' : s.pct === 0 ? 'Not started' : 'In progress';
        return '<a class="card pcard" href="#/project/' + q.id + '"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span class="pill ' + (s.pct >= 100 ? 'won' : s.pct ? 'viewed' : 'draft') + '">' + st + '</span><span class="muted">' + esc(q.no) + '</span></div><h3>' + esc(q.project) + '</h3>' +
          '<div class="meta"><span>' + esc(q.client) + '</span><span>' + fshort(s.start) + ' → ' + fdate(s.end) + '</span></div>' +
          '<div class="prog" role="img" aria-label="' + s.pct + ' percent complete"><i style="width:' + s.pct + '%"></i></div><div class="meta"><span>' + s.pct + '% · ' + s.done + ' of ' + s.tasks + ' tasks</span><span>' + (s.next ? 'Next: ' + esc(short(s.next.name)) : 'All tasks done') + '</span></div></a>';
      }).join('') + '</div>' : '<section class="card"><div class="empty">' + emptyArt() + '<b>No projects yet</b><p>Open a sent quote as the client and accept it. The project plan appears here the moment it is signed.</p><a class="btn" href="#/quotes">Go to quotes</a></div></section>') + '</div>';
  }
  function viewProject(q) {
    if (!q || !q.plan) return notFound('That project does not exist yet. Accept a quote first.');
    var s = planStats(q.plan), left = Math.max(0, diff(TODAY, s.end));
    return '<div class="page"><div class="ph"><div><h1 tabindex="-1">' + esc(q.project) + '</h1><p class="sub">' + esc([q.client, q.site].filter(Boolean).join(' · ')) + '</p></div><div class="acts"><a class="btn" href="#/quote/' + q.id + '">View quote</a><a class="btn" href="#/q/' + q.token + '?preview=1">' + ic('eye') + 'Client view</a></div></div>' +
      '<div class="kpis"><div class="kpi hl"><p>Progress</p><b data-kv="' + s.pct + '" data-kf="pct">' + s.pct + '%</b><small>' + s.done + ' of ' + s.tasks + ' tasks done</small></div><div class="kpi"><p>Site start</p><b style="font-size:22px">' + fdate(s.start) + '</b><small>after acceptance</small></div><div class="kpi"><p>Handover</p><b style="font-size:22px">' + fdate(s.end) + '</b><small>' + (s.pct >= 100 ? 'Completed' : left + ' days to go') + '</small></div><div class="kpi"><p>Contract value</p><b style="font-size:22px">' + compact(qTotal(q)) + '</b><small>incl. GST</small></div></div>' +
      '<section class="card gantt-card"><div class="pj-head"><div><h2>Timeline</h2><p class="muted" style="font-size:13px;margin-top:2px">Tick tasks off as they finish. Rescheduling shifts every phase and task together.</p></div><form data-form="shift"><label class="fld"><span>Move site start to</span><input class="in" type="date" name="d" value="' + s.start + '" required></label><button class="btn" type="submit">Reschedule</button></form></div>' + gantt(q.plan, true) + '</section></div>';
  }

  /* client-facing quote link */
  var PHONE_FREE = 'hello@marlowreed.example';
  function viewClient(q) {
    if (!q) return '<div class="cv"><div class="nf"><h1>Quote not found</h1><p class="muted">This link is not valid. In this demo, links only work in the browser where the quote was created.</p><p style="margin-top:14px"><a class="btn" href="#/">Back to the studio</a></p></div></div>';
    var c = calc(q), st = q.status, expired = q.valid < TODAY && (st === 'sent' || st === 'viewed'), first = q.client.split(' & ')[0].split(' ')[0];
    var studio = '<div class="cv-studio-note noprint"><span>Demo: this is what the client sees at their private link.</span><a href="#/quote/' + q.id + '">← Back to studio</a></div>';
    var live = q.sections.filter(function (s) { return s.items.length; });
    var body = '<article class="paper" id="main-q"><div class="lh"><a class="brand" href="#/q/' + q.token + '?preview=1" aria-label="Marlow &amp; Reed"><span class="mark" aria-hidden="true">M<i>&amp;</i>R</span><span class="bn">Marlow &amp; Reed<small>Design · Build</small></span></a>' +
      '<div class="lh-r"><b>Marlow &amp; Reed Design-Build</b>14 Foundry Lane, Okhla Phase II<br>New Delhi (fictional address)<br>' + PHONE_FREE + '</div></div>' +
      '<p class="cv-kicker">Quotation ' + esc(q.no) + ' ' + pill(st) + '</p><h1 tabindex="-1">' + esc(q.project) + '</h1>' +
      '<p class="intro">Thank you for walking us through the space, ' + esc(first) + '. What follows is the full bill of quantities, priced from our current rate card. Every line traces to a unit rate; nothing is bundled and nothing is hidden in the margin.</p>' +
      '<div class="facts"><div><p>Prepared for</p><b>' + esc(q.client) + '</b></div><div><p>Site</p><b>' + esc(q.site || '—') + '</b></div><div><p>Issued</p><b>' + fdate(q.sentAt || q.created) + '</b></div><div><p>Valid until</p><b>' + fdate(q.valid) + (expired ? ' (expired)' : '') + '</b></div></div>' +
      live.map(function (s, n) {
        return '<section class="cv-sec" aria-label="' + esc(s.title) + '"><div class="cv-sec-hd"><span class="n">' + ('0' + (n + 1)).slice(-2) + '</span><h2>' + esc(s.title) + '</h2><span class="st">' + inr(secTotal(s)) + '</span></div><table><thead><tr><th>Description</th><th class="r">Qty</th><th class="hide-s">Unit</th><th class="r hide-s">Rate</th><th class="r">Amount</th></tr></thead><tbody>' +
          s.items.map(function (i) { return '<tr><td>' + esc(i.name) + '</td><td class="r">' + i.qty + '<span class="u-s u-sm"> ' + esc(i.unit) + '</span></td><td class="hide-s">' + esc(i.unit) + '</td><td class="r hide-s">' + inr(i.rate) + '</td><td class="r">' + inr(i.qty * i.rate) + '</td></tr>'; }).join('') + '</tbody></table></section>';
      }).join('') +
      '<div class="totals"><div><span>Items subtotal</span><span>' + inr(c.sub) + '</span></div><div><span>Studio fee and overheads (' + q.markup + '%)</span><span>' + inr(c.mk) + '</span></div>' +
      (c.disc ? '<div><span>Discount</span><span>−' + inr(c.disc) + '</span></div>' : '') + '<div><span>GST (' + q.tax + '%)</span><span>' + inr(c.tax) + '</span></div><div class="grand"><span>Total</span><span>' + inr(c.total) + '</span></div></div>' +
      '<section class="pay" aria-label="Payment schedule"><h2>Payment schedule</h2><div class="pay-bar" aria-hidden="true"><i style="flex:50"></i><i style="flex:40"></i><i style="flex:10"></i></div><div class="pay-list"><div><p>On acceptance · 50%</p><b>' + inr(c.total * .5) + '</b></div><div><p>On material delivery · 40%</p><b>' + inr(c.total * .4) + '</b></div><div><p>At handover · 10%</p><b>' + inr(c.total * .1) + '</b></div></div></section>' +
      '<section class="terms" aria-label="Terms"><h2 class="terms-h">Terms</h2><ol><li>Payment follows the schedule above. GST at ' + q.tax + '% is included in the total.</li><li>Rates include supply and fixing unless noted. Changes to scope are quoted separately and in writing before work starts.</li><li>Prices are held until ' + fdate(q.valid) + '. After that, materials are re-priced from the rate card.</li><li>The project plan is issued the day you accept, with phase dates and a named site lead.</li><li>Workmanship is covered for twelve months from handover; fittings carry the manufacturer\'s warranty.</li></ol></section>';
    var sign = '';
    if (st === 'sent' || st === 'viewed') {
      sign = expired ? '<div class="sign-closed">This quote has expired. Ask the studio to re-issue it.</div>' :
        '<section class="sign noprint" id="sign" aria-labelledby="sg-h"><h2 id="sg-h">Accept and sign</h2><p>Typing your name below counts as your signature. We start your project plan right away and send the first payment request.</p>' +
        '<form data-form="accept"><div class="sign-grid"><label class="fld"><span>Full name</span><input class="in" name="name" id="signname" required autocomplete="off" value="' + esc(q.client.split(' & ')[0]) + '"></label>' +
        '<div><div class="sig-pad" id="sigpad" aria-hidden="true">' + esc(q.client.split(' & ')[0]) + '</div><div class="sig-lab"><span>Signature</span><span>' + fdate(TODAY) + '</span></div></div></div>' +
        '<label class="agree"><input type="checkbox" name="agree" required><span>I have read the quote and agree to the payment terms and scope above.</span></label>' +
        '<div class="acts"><button type="submit" class="btn pri lg">Accept quote · ' + inr(c.total) + '</button><button type="button" class="btn lg" data-act="changes-open">Request changes</button></div></form></section>';
    } else if (st === 'draft') {
      sign = '<div class="sign-closed noprint">Preview only. Send the quote from the studio to enable the accept step.</div>';
    }
    var accepted = '';
    if (st === 'won') {
      accepted = '<section class="accepted" id="accepted" aria-labelledby="ac-h"><svg class="tick" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29"/><path d="M19 33l9 9 17-20"/></svg><div><h2 id="ac-h">Accepted. Thank you' + (q.acceptedBy ? ', ' + esc(q.acceptedBy.split(' ')[0]) : '') + '.</h2><p>Signed on ' + fdate(q.closedAt) + '. Your project plan was generated from this quote and the team keeps it up to date as work progresses.</p></div>' +
        '<div class="stamp">Accepted<b>' + esc(q.acceptedBy || q.client) + '</b>' + fdate(q.closedAt) + '</div><div class="burst" id="burst" aria-hidden="true"></div></section>';
    }
    var printSign = (st === 'sent' || st === 'viewed') ? '<div class="print-sign" aria-hidden="true"><h2 class="terms-h">Acceptance</h2><p>By signing, the client accepts this quotation, the payment schedule and the terms above.</p><div class="ps-grid"><div><span></span>Client name and signature</div><div><span></span>Date</div></div></div>' : '';
    var paper = body + sign + printSign + accepted + '</article>';
    var plan = '';
    if (st === 'won' && q.plan) {
      var ps = planStats(q.plan);
      plan = '<div class="plan-sec" id="plan"><div class="paper"><h2>Your project plan</h2><p class="plan-sub">Site start ' + fdate(ps.start) + ' · handover ' + fdate(ps.end) + ' · dashed line marks today</p>' + gantt(q.plan, false) + '</div></div>';
    }
    var bar = '';
    if (st === 'sent' || st === 'viewed') {
      bar = '<div class="accept-bar noprint"><div class="in-w"><div><small>Total incl. GST</small><b>' + inr(c.total) + '</b></div><div class="acts"><button type="button" class="btn bar-sec" data-act="print">' + ic('print') + 'Save as PDF</button><button type="button" class="btn bar-sec" data-act="changes-open">Request changes</button><button type="button" class="btn pri" data-act="goto-sign"' + (expired ? ' disabled' : '') + '>Review and sign</button></div></div></div>';
    } else if (st === 'lost') {
      bar = '<div class="accept-bar noprint"><div class="in-w"><div><b>This quote is closed</b></div></div></div>';
    } else {
      bar = '<div class="accept-bar noprint"><div class="in-w"><div><small>Total incl. GST</small><b>' + inr(c.total) + '</b></div><button type="button" class="btn" data-act="print">' + ic('print') + 'Save as PDF</button></div></div>';
    }
    return '<div class="cv">' + studio + paper + plan + '<p class="cv-foot noprint">Fictional studio · demo data · a design sample by Abhishek</p>' + bar + '</div>';
  }

  function notFound(msg) { return '<div class="page"><div class="nf"><h1 tabindex="-1">Not found</h1><p class="muted" style="margin-bottom:16px">' + esc(msg || 'That page does not exist.') + '</p><a class="btn" href="#/">Back to dashboard</a></div></div>'; }

  /* ---------- shell: nav, crumbs, sidebar ---------- */
  var appEl = document.getElementById('app'), sideEl = document.getElementById('side'), scrimEl = document.getElementById('scrim'), tipEl = document.getElementById('tip'), crumbsEl = document.getElementById('crumbs');
  var pal = document.getElementById('pal'), drawer = document.getElementById('drawer');
  var MOBILE = window.matchMedia('(max-width:820px)');
  function navHtml(active) {
    var openN = S.quotes.filter(function (q) { return q.status === 'sent' || q.status === 'viewed'; }).length, projN = S.quotes.filter(function (q) { return q.plan; }).length;
    function a(href, key, icon, label, cnt) { return '<a href="' + href + '" data-nav="' + key + '"' + (active === key ? ' aria-current="page"' : '') + ' title="' + label + '">' + ic(icon) + '<span class="lb">' + label + '</span>' + (cnt ? '<span class="cnt">' + cnt + '</span>' : '') + '</a>'; }
    return '<p class="nav-h">Workspace</p>' + a('#/', 'dash', 'dash', 'Dashboard') + a('#/quotes', 'quotes', 'quotes', 'Quotes', openN ? openN + ' open' : '') + a('#/projects', 'projects', 'projects', 'Projects', projN) + '<p class="nav-h">Library</p>' + a('#/rates', 'rates', 'rates', 'Rate library', S.rates.length);
  }
  function setCrumbs(parts) {
    crumbsEl.innerHTML = parts.map(function (p, i) { var last = i === parts.length - 1; return (i ? '<span class="sep" aria-hidden="true">/</span>' : '') + (last || !p[1] ? '<b' + (last ? ' aria-current="page"' : '') + '>' + esc(p[0]) + '</b>' : '<a href="' + p[1] + '">' + esc(p[0]) + '</a>'); }).join('');
  }
  var sideBtn = document.querySelector('[data-act="toggle-side"]');
  function applySide() { appEl.classList.toggle('collapsed', !!prefs.side && !MOBILE.matches); sideBtn.setAttribute('aria-expanded', MOBILE.matches ? String(sideEl.classList.contains('open')) : String(!prefs.side)); }
  function openSide() {
    sideEl.classList.add('open'); scrimEl.hidden = false; sideBtn.setAttribute('aria-expanded', 'true');
    from(sideEl, { xPercent: -102, duration: .38, ease: 'expo.out', clearProps: 'transform' }); from(scrimEl, { opacity: 0, duration: .3 });
  }
  function closeSide(instant) {
    if (!sideEl.classList.contains('open')) return;
    function done() { sideEl.classList.remove('open'); scrimEl.hidden = true; if (G) G.set([sideEl, scrimEl], { clearProps: 'all' }); sideBtn.setAttribute('aria-expanded', 'false'); }
    if (still() || instant) { done(); return; }
    G.to(sideEl, { xPercent: -102, duration: .26, ease: 'power3.in', onComplete: done }); G.to(scrimEl, { opacity: 0, duration: .26 });
  }
  function toggleSide() {
    if (MOBILE.matches) { if (sideEl.classList.contains('open')) closeSide(); else openSide(); return; }
    var next = !prefs.side; prefs.side = next; savePrefs(); sideBtn.setAttribute('aria-expanded', String(!next));
    if (still()) { appEl.classList.toggle('collapsed', next); return; }
    if (next) { appEl.style.setProperty('--sw', '232px'); G.to(appEl, { '--sw': '56px', duration: .4, ease: 'expo.out', onComplete: function () { appEl.classList.add('collapsed'); appEl.style.removeProperty('--sw'); } }); }
    else { appEl.style.setProperty('--sw', '56px'); appEl.classList.remove('collapsed'); G.to(appEl, { '--sw': '232px', duration: .4, ease: 'expo.out', onComplete: function () { appEl.style.removeProperty('--sw'); } }); }
  }
  scrimEl.addEventListener('click', function () { closeSide(); });
  MOBILE.addEventListener ? MOBILE.addEventListener('change', function () { closeSide(true); applySide(); }) : null;

  /* ---------- dialogs: modal, drawer, palette ---------- */
  function openEl(el, html) {
    el.innerHTML = '<div class="dlg">' + html + '</div>'; hydrate(el);
    if (!el.open) el.showModal();
    if (el === drawer) from(el, { xPercent: 100, duration: .42, ease: 'expo.out', clearProps: 'transform' });
    else if (el === pal) from(el, { y: -10, opacity: 0, scale: .985, duration: .26, ease: 'expo.out', clearProps: 'transform,opacity' });
    else from(el, { y: 14, opacity: 0, scale: .98, duration: .32, ease: 'expo.out', clearProps: 'transform,opacity' });
    var f = el.querySelector('[autofocus]') || el.querySelector('input:not([type=checkbox]),textarea,select,button'); if (f) f.focus({ preventScroll: true });
  }
  function shut(el, cb) {
    if (!el.open) { if (cb) cb(); return; }
    function done() { el.close(); if (G) G.set(el, { clearProps: 'transform,opacity' }); if (cb) cb(); }
    if (still()) { done(); return; }
    if (el === drawer) G.to(el, { xPercent: 100, duration: .28, ease: 'power3.in', onComplete: done });
    else G.to(el, { y: 8, opacity: 0, scale: .985, duration: .18, ease: 'power2.in', onComplete: done });
  }
  [dlg, drawer, pal].forEach(function (el) {
    el.addEventListener('cancel', function (e) { e.preventDefault(); shut(el); });
    el.addEventListener('click', function (e) { if (e.target === el) shut(el); });
    el.addEventListener('close', function () { if (el === drawer) ui.pick = null; });
  });
  function openDlg(html) { openEl(dlg, html); }
  function closeDlg() { shut(dlg); }
  function closeAllDialogs() { [dlg, drawer, pal].forEach(function (el) { if (el.open) { el.close(); } }); ui.pick = null; }
  function xBtn() { return '<button type="button" class="icon-btn" data-act="dlg-close" aria-label="Close">' + ic('x') + '</button>'; }
  function confirmDlg(title, body, okLabel, fn, danger) {
    ui.confirmFn = fn;
    openDlg('<div class="dlg-hd"><h2 id="dlgT">' + esc(title) + '</h2>' + xBtn() + '</div><p class="muted">' + body + '</p><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button><button type="button" class="btn ' + (danger ? 'danger' : 'pri') + '" data-act="confirm-ok" autofocus>' + esc(okLabel) + '</button></div>');
  }

  function pickList() {
    var t = (ui.pick.q || '').toLowerCase(), q = cur(), sec = q && q.sections.filter(function (s) { return s.id === ui.pick.sid; })[0];
    var rows = S.rates.filter(function (r) { return (ui.pick.cat === 'All' || r.cat === ui.pick.cat) && (!t || (r.name + ' ' + r.cat).toLowerCase().indexOf(t) > -1); });
    return rows.length ? rows.map(function (r) {
      var n = sec ? sec.items.filter(function (i) { return i.rateId === r.id; }).length : 0;
      return '<li><div class="pn">' + esc(r.name) + '<small>' + esc(r.cat) + ' · ' + inr(r.rate) + ' / ' + esc(r.unit) + '</small></div><div style="display:flex;align-items:center;gap:10px">' + (n ? '<span class="added">×' + n + ' in section</span>' : '') + '<button type="button" class="btn sm" data-act="pick" data-id="' + r.id + '" aria-label="Add ' + esc(short(r.name)) + '">Add</button></div></li>';
    }).join('') : '<li class="empty" style="padding:32px 16px">No matching items.</li>';
  }
  function openPicker(sid) {
    var q = cur(), sec = q.sections.filter(function (s) { return s.id === sid; })[0];
    ui.pick = { sid: sid, q: '', cat: 'All' };
    openEl(drawer, '<div class="dlg-hd"><div><h2 id="drT">Add from rate library</h2><p>To “' + esc(sec ? sec.title : 'section') + '”. Items start at quantity 1.</p></div>' + xBtn() + '</div>' +
      '<div class="pick-tools"><label class="fld"><span>Search</span><input class="in" id="pq" type="search" data-search="pick" placeholder="e.g. false ceiling. Enter adds the first match" autofocus></label><label class="fld"><span>Category</span><select class="in" data-sel="pickcat"><option>All</option>' + cats().map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select></label></div>' +
      '<ul class="pick" id="pickList">' + pickList() + '</ul><div class="dlg-ft"><button type="button" class="btn pri" data-act="dlg-close">Done</button></div>');
  }

  /* shortcuts */
  var SHORT = [['Command palette', '<kbd>⌘</kbd><kbd>K</kbd>'], ['New quote', '<kbd>N</kbd>'], ['Go to dashboard', '<kbd>G</kbd> <kbd>D</kbd>'], ['Go to quotes', '<kbd>G</kbd> <kbd>Q</kbd>'], ['Go to rate library', '<kbd>G</kbd> <kbd>R</kbd>'], ['Go to projects', '<kbd>G</kbd> <kbd>P</kbd>'], ['Search this list', '<kbd>/</kbd>'], ['Next or previous row', '<kbd>J</kbd> <kbd>K</kbd>'], ['Add item to the last section', '<kbd>I</kbd>'], ['Toggle sidebar', '<kbd>[</kbd>'], ['Reorder a focused grip', '<kbd>↑</kbd> <kbd>↓</kbd>'], ['This list', '<kbd>?</kbd>']];
  function openShortcuts() { openDlg('<div class="dlg-hd"><h2 id="dlgT">Keyboard shortcuts</h2>' + xBtn() + '</div><dl class="shortcuts">' + SHORT.map(function (s) { return '<dt>' + s[0] + '</dt><dd>' + s[1] + '</dd>'; }).join('') + '</dl>'); }

  /* command palette */
  var PAL = { items: [], idx: 0 };
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
  function newQuoteDlg() {
    openDlg('<div class="dlg-hd"><div><h2 id="dlgT">New quote</h2><p>Start from a template and price it from the rate library.</p></div>' + xBtn() + '</div>' +
      '<form data-form="new" class="rd"><label class="fld"><span>Client name</span><input class="in" name="client" required autofocus placeholder="e.g. Priya Menon" autocomplete="off"></label><label class="fld"><span>Project</span><input class="in" name="project" required placeholder="e.g. Menon 3BHK interiors" autocomplete="off"></label>' +
      '<label class="fld"><span>Start from</span><select class="in" name="tpl">' + Object.keys(TPL_NAMES).map(function (k) { return '<option value="' + k + '">' + TPL_NAMES[k] + '</option>'; }).join('') + '</select></label>' +
      '<div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button><button type="submit" class="btn pri">Create quote</button></div></form>');
  }
  function rateDlg() {
    openDlg('<div class="dlg-hd"><div><h2 id="dlgT">Add a rate</h2><p>New rates are available to every quote straight away.</p></div>' + xBtn() + '</div><form data-form="rate-add" class="rd" autocomplete="off">' +
      '<label class="fld"><span>Item description</span><input class="in" name="name" required autofocus placeholder="e.g. Italian marble flooring"></label>' +
      '<div class="grid2"><label class="fld"><span>Category</span><select class="in" name="cat">' + cats().map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fld"><span>Unit</span><input class="in" name="unit" required value="sqft"></label></div><label class="fld"><span>Rate (₹)</span><input class="in num" name="rate" required inputmode="decimal" placeholder="0"></label>' +
      '<div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button><button type="submit" class="btn pri">Add to library</button></div></form>');
  }
  function palItems(term) {
    var t = term.trim().toLowerCase(), toks = t.split(/\s+/).filter(Boolean), out = [];
    function sc(hay) { hay = hay.toLowerCase(); var s = 0; for (var i = 0; i < toks.length; i++) { var p = hay.indexOf(toks[i]); if (p < 0) return -1; s += p === 0 ? 0 : (hay.charAt(p - 1) === ' ' ? 2 : 6) + p * .01; } return s; }
    var acts = [
      { g: 'Actions', ic: 'plus', t: 'New quote', k: 'create draft quote', r: 'N', fn: newQuoteDlg },
      { g: 'Actions', ic: 'plus', t: 'Add a rate', k: 'rate library new item', fn: function () { go('#/rates'); setTimeout(rateDlg, 60); } },
      { g: 'Go to', ic: 'dash', t: 'Dashboard', k: 'home overview kpi', r: 'G D', fn: function () { go('#/'); } },
      { g: 'Go to', ic: 'quotes', t: 'Quotes', k: 'list all', r: 'G Q', fn: function () { go('#/quotes'); } },
      { g: 'Go to', ic: 'projects', t: 'Projects', k: 'plans gantt timeline', r: 'G P', fn: function () { go('#/projects'); } },
      { g: 'Go to', ic: 'rates', t: 'Rate library', k: 'rates boq prices', r: 'G R', fn: function () { go('#/rates'); } },
      { g: 'Actions', ic: 'panel', t: 'Toggle sidebar', k: 'collapse', r: '[', fn: toggleSide },
      { g: 'Actions', ic: 'keys', t: 'Keyboard shortcuts', k: 'help keys', r: '?', fn: openShortcuts },
      { g: 'Actions', ic: 'reset', t: 'Reset demo data', k: 'restore seed', fn: function () { resetDemo(); } }
    ];
    var recent = S.quotes.slice().sort(function (a, b) { return new Date(b.created) - new Date(a.created); });
    if (!toks.length) {
      acts.slice(0, 6).forEach(function (a) { out.push(a); });
      recent.slice(0, 5).forEach(function (q) { out.push({ g: 'Recent quotes', ic: 'quotes', t: q.project, sub: q.no + ' · ' + q.client, r: inr(qTotal(q)), fn: function () { go('#/quote/' + q.id); } }); });
      return out;
    }
    var hits = [];
    acts.forEach(function (a) { var s = sc(a.t + ' ' + a.k); if (s >= 0) hits.push([s - 1, a]); });
    S.quotes.forEach(function (q) { var s = sc(q.no + ' ' + q.project + ' ' + q.client); if (s >= 0) hits.push([s, { g: 'Quotes', ic: 'quotes', t: q.project, sub: q.no + ' · ' + q.client, r: pill(q.status).replace('class="pill', 'class="pill'), raw: true, fn: function () { go('#/quote/' + q.id); } }]); });
    var seen = {};
    S.quotes.forEach(function (q) { var c = q.client; if (seen[c]) return; seen[c] = 1; var s = sc(c); if (s >= 0) { var n = S.quotes.filter(function (x) { return x.client === c; }).length; hits.push([s + 1, { g: 'Clients', ic: 'user', t: c, sub: n + (n === 1 ? ' quote' : ' quotes'), r: 'View quotes', fn: function () { ui.qsearch = c; ui.status = 'all'; go('#/quotes'); } }]); } });
    var order = { Actions: 0, 'Go to': 0, Quotes: 1, Clients: 2 };
    hits.sort(function (a, b) { return a[0] - b[0]; });
    var groups = {}; hits.forEach(function (h) { (groups[h[1].g] = groups[h[1].g] || []).push(h[1]); });
    Object.keys(groups).sort(function (a, b) { return (order[a] || 0) - (order[b] || 0); }).forEach(function (g) { groups[g].slice(0, g === 'Quotes' ? 7 : 4).forEach(function (i) { out.push(i); }); });
    return out;
  }
  function hl(text, term) { var toks = term.trim().toLowerCase().split(/\s+/).filter(Boolean), s = esc(text); toks.forEach(function (t) { var i = text.toLowerCase().indexOf(t); if (i > -1 && t) { s = esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + t.length)) + '</mark>' + esc(text.slice(i + t.length)); } }); return toks.length ? s : esc(text); }
  function palRender(term) {
    PAL.items = palItems(term || ''); PAL.idx = Math.min(PAL.idx, Math.max(0, PAL.items.length - 1));
    var list = document.getElementById('pallist'), html = '', lastG = '';
    if (!PAL.items.length) html = '<div class="pal-empty">No results for “' + esc(term) + '”.<br><span style="font-size:12.5px">Try a client name, a quote number like Q-1042, or a command.</span></div>';
    PAL.items.forEach(function (it, n) {
      if (it.g !== lastG) { html += '<div class="pal-g" role="presentation">' + it.g + '</div>'; lastG = it.g; }
      html += '<div class="pal-i" role="option" id="pi-' + n + '" data-n="' + n + '" aria-selected="' + (n === PAL.idx) + '">' + ic(it.ic) + '<span class="pt">' + hl(it.t, term || '') + (it.sub ? '<small>' + esc(it.sub) + '</small>' : '') + '</span>' + (it.r ? '<span class="pr">' + (it.raw ? it.r : it.r.split(' ').length > 1 && it.r.length <= 3 ? it.r.split(' ').map(function (k) { return '<kbd>' + k + '</kbd>'; }).join(' ') : it.r.length === 1 ? '<kbd>' + esc(it.r) + '</kbd>' : esc(it.r)) + '</span>' : '') + '</div>';
    });
    list.innerHTML = html;
    var inp = document.getElementById('pq'); if (inp) inp.setAttribute('aria-activedescendant', PAL.items.length ? 'pi-' + PAL.idx : '');
  }
  function palSelect(n) {
    PAL.idx = n; Array.prototype.forEach.call(document.querySelectorAll('.pal-i'), function (e) { e.setAttribute('aria-selected', String(+e.dataset.n === n)); });
    var el = document.getElementById('pi-' + n); if (el) el.scrollIntoView({ block: 'nearest' });
    var inp = document.getElementById('pq'); if (inp) inp.setAttribute('aria-activedescendant', 'pi-' + n);
  }
  function openPalette() {
    PAL.idx = 0; closeSide(true);
    if (dlg.open) dlg.close(); if (drawer.open) drawer.close();
    openEl(pal, '<div class="pal-in">' + ic('search') + '<input id="pq" type="text" role="combobox" aria-expanded="true" aria-controls="pallist" aria-autocomplete="list" aria-label="Search quotes, clients and commands" placeholder="Search quotes, clients or type a command" autocomplete="off" spellcheck="false" autofocus><kbd>Esc</kbd></div><div class="pal-list" id="pallist" role="listbox" aria-label="Results"></div><div class="pal-ft"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>Esc</kbd> close</span></div>');
    palRender('');
  }
  function palRun(n) { var it = PAL.items[n]; if (!it) return; shut(pal, function () { it.fn(); }); }
  pal.addEventListener('input', function (e) { if (e.target.id === 'pq') { PAL.idx = 0; palRender(e.target.value); } });
  pal.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (PAL.items.length) palSelect((PAL.idx + 1) % PAL.items.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (PAL.items.length) palSelect((PAL.idx - 1 + PAL.items.length) % PAL.items.length); }
    else if (e.key === 'Enter') { e.preventDefault(); palRun(PAL.idx); }
  });
  pal.addEventListener('click', function (e) { var it = e.target.closest('.pal-i'); if (it) palRun(+it.dataset.n); });
  pal.addEventListener('mousemove', function (e) { var it = e.target.closest('.pal-i'); if (it && +it.dataset.n !== PAL.idx) { PAL.idx = +it.dataset.n; Array.prototype.forEach.call(pal.querySelectorAll('.pal-i'), function (x) { x.setAttribute('aria-selected', String(x === it)); }); } });

  /* ---------- text wrapping fields, number formatting ---------- */
  function autosize(root) { Array.prototype.forEach.call((root || document).querySelectorAll('textarea[data-wrap]'), function (t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }); }
  document.addEventListener('input', function (e) { if (e.target.matches && e.target.matches('textarea[data-wrap]')) autosize(e.target.parentNode); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.matches && e.target.matches('textarea[data-wrap]')) { e.preventDefault(); e.target.blur(); } });
  document.addEventListener('focusout', function (e) { var t = e.target; if (t.matches && t.matches('input[data-fmt]')) t.value = fnum(num(t.value)); });
  document.addEventListener('focusin', function (e) { var t = e.target; if (t.matches && t.matches('input[data-fmt]') && t.select) setTimeout(function () { try { t.select(); } catch (x) { /* ignore */ } }, 0); });
  window.addEventListener('resize', function () { autosize(); });

  /* ---------- tooltip ---------- */
  function showTip(html, x, y) {
    tipEl.innerHTML = html; tipEl.hidden = false;
    var w = tipEl.offsetWidth, h = tipEl.offsetHeight, nx = Math.max(8, Math.min(innerWidth - w - 8, x - w / 2)), ny = y - h - 12; if (ny < 8) ny = y + 18;
    tipEl.style.transform = 'translate(' + Math.round(nx) + 'px,' + Math.round(ny) + 'px)';
  }
  function hideTip() { tipEl.hidden = true; }
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType === 'touch') return;
    var t = e.target.closest && e.target.closest('[data-tip]'); if (!t) return;
    var parts = t.dataset.tip.split('|'), r = t.getBoundingClientRect(), onBar = t.classList.contains('gb');
    showTip(parts.length > 1 ? '<b>' + esc(parts[0]) + '</b><small>' + esc(parts[1]) + '</small>' : esc(parts[0]), onBar ? e.clientX : r.left + r.width / 2, onBar ? e.clientY - 4 : r.top);
  });
  document.addEventListener('pointerout', function (e) { var t = e.target.closest && e.target.closest('[data-tip]'); if (t) hideTip(); });
  document.addEventListener('focusin', function (e) {
    var c = e.target.closest && e.target.closest('.col-hit'); if (c) chartTip(+c.dataset.col, c.getBoundingClientRect().left + c.getBoundingClientRect().width / 2, c.getBoundingClientRect().top + 30, c);
  });
  document.addEventListener('focusout', function (e) { if (e.target.closest && e.target.closest('.col-hit')) { hideTip(); e.target.classList.remove('on'); } });
  function chartTip(i, x, y, hit) {
    var b = ui.months && ui.months[i]; if (!b) return;
    Array.prototype.forEach.call(document.querySelectorAll('.col-hit.on'), function (e) { e.classList.remove('on'); }); if (hit) hit.classList.add('on');
    showTip('<b>' + MON[b.m] + ' ' + b.y + '</b><div class="tr"><em><i style="background:#CBC6BB"></i>Sent</em><span class="v">' + inr(b.sent) + '</span></div><div class="tr"><em><i style="background:var(--brand)"></i>Won</em><span class="v">' + inr(b.won) + '</span></div>', x, y);
  }
  document.addEventListener('pointermove', function (e) { var c = e.target.closest && e.target.closest('.col-hit'); if (c && e.pointerType !== 'touch') chartTip(+c.dataset.col, e.clientX, e.clientY, c); });
  document.addEventListener('pointerout', function (e) { var c = e.target.closest && e.target.closest('.col-hit'); if (c) { hideTip(); c.classList.remove('on'); } });
  window.addEventListener('scroll', hideTip, { passive: true });

  /* ---------- router + render ---------- */
  var lastKey = null;
  function parseRoute() { var raw = location.hash.replace(/^#/, '') || '/', path = raw.split('?')[0]; return { path: path, qs: raw.split('?')[1] || '', p: path.split('/').filter(Boolean) }; }
  var cur = function () { var p = parseRoute().p; return p[0] === 'quote' ? qById(p[1]) : p[0] === 'q' ? qByToken(p[1]) : null; };
  function render() {
    var r = parseRoute(), p = r.p, html, nav = 'dash', client = false, title = 'Dashboard', crumbs = [['Dashboard']], kind = 'dash';
    var inMain = main.contains(document.activeElement), fid = inMain && document.activeElement.id;
    var wrap = document.querySelector('.gantt-wrap'), sl = wrap ? wrap.scrollLeft : 0, sy = window.scrollY;
    if (!p.length) { html = viewDash(); }
    else if (p[0] === 'quotes') { html = viewQuotes(); nav = 'quotes'; title = 'Quotes'; crumbs = [['Quotes']]; kind = 'quotes'; }
    else if (p[0] === 'rates') { html = viewRates(); nav = 'rates'; title = 'Rate library'; crumbs = [['Rate library']]; kind = 'rates'; }
    else if (p[0] === 'projects') { html = viewProjects(); nav = 'projects'; title = 'Projects'; crumbs = [['Projects']]; kind = 'projects'; }
    else if (p[0] === 'quote') { var q = qById(p[1]); html = q ? viewBuilder(q) : notFound('That quote does not exist.'); nav = 'quotes'; title = q ? q.no : 'Quote'; crumbs = [['Quotes', '#/quotes'], [q ? q.no : 'Not found']]; kind = 'builder'; }
    else if (p[0] === 'project') { var pq = qById(p[1]); html = viewProject(pq); nav = 'projects'; title = pq ? pq.project : 'Project'; crumbs = [['Projects', '#/projects'], [pq ? pq.no : 'Not found']]; kind = 'project'; }
    else if (p[0] === 'q') {
      var cq = qByToken(p[1]); client = true; title = cq ? 'Quote ' + cq.no : 'Quote'; kind = 'client';
      if (cq && cq.status === 'sent' && r.qs.indexOf('preview') < 0) { cq.status = 'viewed'; cq.viewedAt = new Date().toISOString(); logq(cq, 'viewed', cq.client + ' opened the quote link'); save(); }
      html = viewClient(cq);
    } else { html = notFound(); }
    document.body.classList.toggle('client-mode', client);
    document.body.classList.toggle('has-sumbar', kind === 'builder' && !!qById(p[1]));
    document.querySelector('#nav').innerHTML = navHtml(nav);
    setCrumbs(crumbs);
    main.innerHTML = html;
    document.title = title + ' · Marlow & Reed Quote Desk (design sample)';
    var changed = r.path !== lastKey;
    if (changed) {
      if (lastKey !== null) { window.scrollTo(0, 0); }
      var h = main.querySelector('h1'); if (h && lastKey !== null) h.focus({ preventScroll: true });
      lastKey = r.path; closeSide(true);
    } else {
      window.scrollTo(0, sy); var w2 = document.querySelector('.gantt-wrap'); if (w2) w2.scrollLeft = sl;
      if (fid) { var el = document.getElementById(fid); if (el) el.focus({ preventScroll: true }); }
    }
    autosize(main);
    afterRender(kind, changed, r);
  }

  function animGantt(root) {
    var bars = root.querySelectorAll('.gb'); if (!bars.length) return;
    from(bars, { scaleX: 0, duration: .8, ease: 'expo.out', stagger: .022, delay: .12, clearProps: 'transform' });
    from(root.querySelectorAll('.g-row:not(.g-head)'), { opacity: 0, duration: .4, ease: 'power2.out', stagger: .02, clearProps: 'opacity' });
  }
  function updateSplit(q) {
    var c = calc(q), t = c.total || 1, a = document.getElementById('sp-1'); if (!a) return;
    a.style.width = ((c.sub - c.disc) / t * 100).toFixed(2) + '%'; document.getElementById('sp-2').style.width = (c.mk / t * 100).toFixed(2) + '%'; document.getElementById('sp-3').style.width = (c.tax / t * 100).toFixed(2) + '%';
  }
  function afterRender(kind, changed, r) {
    var kids = main.querySelectorAll('.page > *, .cv > .paper, .cv > .plan-sec');
    if (changed && !(kind === 'client' && ui.celebrate)) from(kids, { opacity: 0, y: 10, duration: .5, ease: 'expo.out', stagger: .05, clearProps: 'transform,opacity' });
    if (kind === 'dash') {
      fitChart();
      Array.prototype.forEach.call(main.querySelectorAll('[data-kv]'), function (b) { countTo(b, +b.dataset.kv, fmtBy(b.dataset.kf), 1.1); });
      from(main.querySelectorAll('.chart [data-bar]'), { scaleY: 0, duration: .9, ease: 'expo.out', stagger: .035, delay: .15, clearProps: 'transform' });
      Array.prototype.forEach.call(main.querySelectorAll('.funnel .bar i'), function (b, i) { from(b, { scaleX: 0, duration: 1, ease: 'expo.out', delay: .2 + i * .08, clearProps: 'transform' }); });
      Array.prototype.forEach.call(main.querySelectorAll('.spark path'), function (p, i) { from(p, { strokeDashoffset: 1, duration: 1.1, ease: 'power3.out', delay: .1 + i * .06 }); });
    } else if (kind === 'projects') {
      from(main.querySelectorAll('.prog i'), { scaleX: 0, duration: .9, ease: 'expo.out', stagger: .03, delay: .1, clearProps: 'transform' });
    } else if (kind === 'project') {
      Array.prototype.forEach.call(main.querySelectorAll('[data-kv]'), function (b) { countTo(b, +b.dataset.kv, fmtBy(b.dataset.kf), 1); });
      if (changed) animGantt(main);
    } else if (kind === 'builder') {
      var q = qById(r.p[1]); if (q) { updateSplit(q); var t2 = document.getElementById('t-tot'); if (t2) t2._v = calc(q).total; }
      if (ui.flash) {
        var fr = main.querySelector('.li[data-i="' + ui.flash + '"]');
        if (fr) { if (!still()) G.fromTo(fr, { backgroundColor: '#FBEDE6' }, { backgroundColor: '#ffffff', duration: 1.4, ease: 'power2.out', clearProps: 'backgroundColor' }); fr.scrollIntoView({ block: 'nearest' }); }
        ui.flash = null;
      }
      if (ui.focusSel) { var fe = main.querySelector(ui.focusSel); if (fe) { fe.focus({ preventScroll: false }); if (fe.select) fe.select(); } ui.focusSel = null; }
    } else if (kind === 'client') {
      if (ui.io) { ui.io.disconnect(); ui.io = null; }
      var sgn = document.getElementById('sign'), abar = main.querySelector('.accept-bar');
      if (sgn && abar && window.IntersectionObserver) { ui.io = new IntersectionObserver(function (en) { abar.classList.toggle('away', en[0].isIntersecting); }, { threshold: .35 }); ui.io.observe(sgn); }
      if (ui.celebrate) { ui.celebrate = false; celebrate(); }
      else if (changed && main.querySelector('.plan-sec')) animGantt(main.querySelector('.plan-sec'));
    }
    if (ui.focusAfter) { var fa = document.querySelector(ui.focusAfter); if (fa) fa.focus(); ui.focusAfter = null; }
  }

  function celebrate() {
    var ac = document.getElementById('accepted'); if (!ac) return;
    function scroll() { var y = ac.getBoundingClientRect().top + window.scrollY - 120; window.scrollTo({ top: Math.max(0, y), behavior: still() ? 'auto' : 'smooth' }); }
    scroll(); if (still()) return;
    var c = ac.querySelector('.tick circle'), pth = ac.querySelector('.tick path'), lc = c.getTotalLength ? c.getTotalLength() : 190, lp = pth.getTotalLength ? pth.getTotalLength() : 50;
    c.style.strokeDasharray = lc; pth.style.strokeDasharray = lp;
    var burst = document.getElementById('burst'), cols = ['#B3401A', '#2F6B4F', '#1B1A18', '#D9A441'], dots = [];
    for (var i = 0; i < 18; i++) { var d = document.createElement('i'); d.style.background = cols[i % cols.length]; if (i % 3 === 0) { d.style.borderRadius = '1px'; d.style.width = '3px'; d.style.height = '9px'; } burst.appendChild(d); dots.push(d); }
    var tl = G.timeline();
    tl.from(ac, { opacity: 0, y: 28, duration: .6, ease: 'expo.out' })
      .fromTo(c, { strokeDashoffset: lc }, { strokeDashoffset: 0, duration: .75, ease: 'power3.inOut' }, 0.1)
      .fromTo(pth, { strokeDashoffset: lp }, { strokeDashoffset: 0, duration: .45, ease: 'power3.out' }, .55)
      .from(ac.querySelector('.tick'), { scale: .82, duration: .6, ease: 'back.out(1.8)' }, .1)
      .from(ac.querySelectorAll('h2, p'), { opacity: 0, y: 10, duration: .5, ease: 'expo.out', stagger: .08 }, .5)
      .from(ac.querySelector('.stamp'), { scale: 1.9, rotation: -16, opacity: 0, duration: .5, ease: 'power4.out' }, .85);
    dots.forEach(function (d, k) {
      var a = k / dots.length * Math.PI * 2 + Math.random() * .3, dist = 60 + Math.random() * 70;
      tl.fromTo(d, { x: 0, y: 0, scale: 0, opacity: 1 }, { x: Math.cos(a) * dist, y: Math.sin(a) * dist, rotation: Math.random() * 180, scale: 1, duration: .8, ease: 'expo.out' }, .55).to(d, { opacity: 0, duration: .5, ease: 'power1.in' }, 1.1);
    });
    var plan = main.querySelector('.plan-sec');
    if (plan) { from(plan, { opacity: 0, y: 30, duration: .7, ease: 'expo.out', delay: 1.1, clearProps: 'transform,opacity' }); G.delayedCall(1.2, function () { animGantt(plan); }); }
  }

  /* ---------- actions ---------- */
  function refreshTotals(q) {
    var c = calc(q);
    function set(id, v) { var e = document.getElementById(id); if (e) setMoney(e, v); }
    set('t-sub', c.sub); set('t-mk', c.mk); set('t-tx', c.taxable); set('t-gst', c.tax); set('t-tot', c.total);
    var t2 = document.getElementById('t-tot2'); if (t2) t2.textContent = inr(c.total);
    q.sections.forEach(function (s) {
      var sec = main.querySelector('section[data-s="' + s.id + '"]'); if (!sec) return;
      sec.querySelector('[data-sectot]').textContent = inr(secTotal(s));
      var n = sec.querySelector('[data-secn]'); if (n) n.textContent = s.items.length + (s.items.length === 1 ? ' item' : ' items');
      s.items.forEach(function (i) { var row = sec.querySelector('.li[data-i="' + i.id + '"]'); if (row) row.querySelector('[data-amt]').textContent = inr(i.qty * i.rate); });
    });
    updateSplit(q);
  }
  var savedT;
  function touchSaved() {
    var sv = document.getElementById('saved'); if (!sv) return; sv.lastChild.nodeValue = 'Saving…'; clearTimeout(savedT);
    savedT = setTimeout(function () { var s2 = document.getElementById('saved'); if (s2) s2.lastChild.nodeValue = 'Saved'; }, 550);
  }
  function newQuote(client, project, tpl) {
    var q = { id: uid('q'), no: 'Q-' + (S.seq++), client: client || 'New client', project: project || 'Untitled project', site: '', status: 'draft', markup: 12, discount: 0, tax: 18,
      created: new Date().toISOString(), sentAt: null, viewedAt: null, closedAt: null, valid: addD(TODAY, 30), token: uid('').slice(0, 8), log: [], plan: null,
      sections: tpl === 'blank' ? [{ id: uid('s'), title: 'Civil & demolition', items: [] }] : buildSections(tpl, 1, S.rates) };
    logq(q, 'draft', 'Quote created'); S.quotes.unshift(q); save(); return q;
  }
  function copyLink(q) { try { navigator.clipboard.writeText(link(q)).then(function () { toast('Client link copied'); }, function () { toast(link(q), { plain: true }); }); } catch (x) { toast(link(q), { plain: true }); } }
  function resetDemo() {
    confirmDlg('Reset demo data?', 'This restores the original 20 quotes, the rate library and all project plans. Your changes in this browser will be lost.', 'Reset data', function () { try { localStorage.removeItem(KEY); } catch (x) { /* ignore */ } S = seed(); save(); ui.status = 'all'; ui.qsearch = ''; go('#/'); toast('Demo data reset'); }, true);
  }
  function itemById(q, id) { for (var a = 0; a < q.sections.length; a++) for (var b = 0; b < q.sections[a].items.length; b++) if (q.sections[a].items[b].id === id) return q.sections[a].items[b]; return null; }

  document.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-chip]');
    if (chip) {
      var k = chip.dataset.chip, v = chip.dataset.v;
      if (k === 'status') { ui.status = v; document.querySelectorAll('[data-chip="status"]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === v)); }); document.getElementById('qlist').innerHTML = qlistHtml(); }
      else if (k === 'rcat') { ui.rcat = v; document.querySelectorAll('[data-chip="rcat"]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === v)); }); document.getElementById('ratelist').innerHTML = rateRows(); }
      else if (k === 'period') { ui.period = v; render(); }
      return;
    }
    var row = e.target.closest('tr[data-href]');
    if (row && !e.target.closest('a,button,input')) { go(row.dataset.href); return; }
    var b = e.target.closest('[data-act]'); if (!b || b.type === 'checkbox') return;
    var act = b.dataset.act, q = cur();
    var secEl = b.closest('section[data-s]'), sid = secEl && secEl.dataset.s, sec = q && sid && q.sections.filter(function (s) { return s.id === sid; })[0];
    switch (act) {
      case 'toggle-side': toggleSide(); break;
      case 'palette': openPalette(); break;
      case 'shortcuts': openShortcuts(); break;
      case 'reset': resetDemo(); break;
      case 'new-quote': newQuoteDlg(); break;
      case 'rate-new': rateDlg(); break;
      case 'dlg-close': var dd = b.closest('dialog'); if (dd) shut(dd); break;
      case 'confirm-ok': var fn = ui.confirmFn; ui.confirmFn = null; shut(dlg, function () { if (fn) fn(); }); break;
      case 'clear-filters': ui.status = 'all'; ui.qsearch = ''; render(); break;
      case 'row-copy': var rq = qById(b.dataset.q); if (rq) copyLink(rq); break;
      case 'row-dup': var oq = qById(b.dataset.q); if (oq) duplicate(oq); break;
      case 'toggle-sec': ui.sclosed[sid] = !ui.sclosed[sid]; var cl = !!ui.sclosed[sid]; secEl.classList.toggle('closed', cl); b.setAttribute('aria-expanded', String(!cl)); break;
      case 'add-sec': var ns = { id: uid('s'), title: 'New section', items: [] }; q.sections.push(ns); save(); ui.focusSel = 'section[data-s="' + ns.id + '"] input[data-b="title"]'; render(); break;
      case 'del-sec':
        if (sec) { var si = q.sections.indexOf(sec); q.sections.splice(si, 1); save(); render(); toast('Section deleted', { action: 'Undo', fn: function () { q.sections.splice(si, 0, sec); save(); render(); } }); }
        break;
      case 'add-item': openPicker(sid); break;
      case 'add-custom': var ci = { id: uid('i'), rateId: null, name: 'Custom item', unit: 'lot', rate: 0, qty: 1 }; sec.items.push(ci); save(); ui.focusSel = '.li[data-i="' + ci.id + '"] input[data-b="name"]'; render(); break;
      case 'pick':
        var r = S.rates.filter(function (x) { return x.id === b.dataset.id; })[0], tq = cur(), ts = tq && tq.sections.filter(function (s) { return s.id === ui.pick.sid; })[0];
        if (r && ts) { var ni = { id: uid('i'), rateId: r.id, name: r.name, unit: r.unit, rate: r.rate, qty: 1 }; ts.items.push(ni); save(); ui.flash = ni.id; render(); document.getElementById('pickList').innerHTML = pickList(); toast('Added: ' + short(r.name)); }
        break;
      case 'del-item':
        var rw = b.closest('.li'), idx = -1, it;
        sec.items.forEach(function (x, n) { if (x.id === rw.dataset.i) { idx = n; it = x; } });
        if (it) { sec.items.splice(idx, 1); save(); render(); toast('Line removed', { action: 'Undo', fn: function () { sec.items.splice(idx, 0, it); save(); ui.flash = it.id; render(); } }); }
        break;
      case 'refresh-rates': var n = 0; q.sections.forEach(function (s) { s.items.forEach(function (i) { var lr = S.rates.filter(function (x) { return x.id === i.rateId; })[0]; if (lr && lr.rate !== i.rate) { i.rate = lr.rate; n++; } }); }); save(); render(); toast(n ? n + ' rates updated from the library' : 'Already matches the rate library'); break;
      case 'preview': go('#/q/' + q.token + '?preview=1'); break;
      case 'send':
        if (!q.sections.some(function (s) { return s.items.length; })) { toast('Add at least one item before sending', { plain: true }); break; }
        q.status = 'sent'; q.sentAt = new Date().toISOString(); logq(q, 'sent', 'Sent to ' + q.client); save(); render();
        openDlg('<div class="dlg-hd"><h2 id="dlgT">Quote sent</h2>' + xBtn() + '</div><p>' + esc(q.no) + ' is now live at a private link. In a real deployment this would go out by email or WhatsApp. Here, copy it or open it as the client to try the accept flow.</p>' +
          '<div class="copyrow"><input class="in" readonly value="' + esc(link(q)) + '" aria-label="Client link" id="lk"><button type="button" class="btn" data-act="copy-link">Copy</button></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Close</button><a class="btn pri" href="#/q/' + q.token + '" data-act="dlg-close">Open as client ' + ic('arrow') + '</a></div>');
        break;
      case 'copy-link': var lq = q || cur(); if (lq) copyLink(lq); break;
      case 'mark-lost': q.status = 'lost'; q.closedAt = new Date().toISOString(); logq(q, 'lost', 'Marked lost'); save(); render(); toast('Marked as lost'); break;
      case 'reopen': q.status = 'draft'; q.sentAt = q.viewedAt = q.closedAt = null; logq(q, 'draft', 'Reopened as draft'); save(); render(); break;
      case 'dup': duplicate(q); break;
      case 'del-quote':
        var qi = S.quotes.indexOf(q); S.quotes.splice(qi, 1); save(); go('#/quotes');
        toast('Draft deleted', { action: 'Undo', fn: function () { S.quotes.splice(qi, 0, q); save(); go('#/quote/' + q.id); } });
        break;
      case 'rate-del':
        var ri = -1, rr; S.rates.forEach(function (x, n2) { if (x.id === b.dataset.id) { ri = n2; rr = x; } });
        if (rr) { S.rates.splice(ri, 1); save(); render(); toast('Rate deleted. Existing quotes keep their copied rate.', { action: 'Undo', fn: function () { S.rates.splice(ri, 0, rr); save(); ui.flash = rr.id; render(); } }); }
        break;
      case 'toggle-phase': ui.collapsed[b.dataset.id] = !ui.collapsed[b.dataset.id]; render(); break;
      case 'print': window.print(); break;
      case 'goto-sum': var sm = document.getElementById('sumside'); if (sm) sm.scrollIntoView({ behavior: still() ? 'auto' : 'smooth', block: 'start' }); break;
      case 'goto-sign': var sg = document.getElementById('sign'); if (sg) { sg.scrollIntoView({ behavior: still() ? 'auto' : 'smooth', block: 'center' }); var sn = document.getElementById('signname'); if (sn) sn.focus({ preventScroll: true }); } break;
      case 'changes-open':
        openDlg('<div class="dlg-hd"><h2 id="dlgT">Request changes</h2>' + xBtn() + '</div><form data-form="changes" class="rd"><label class="fld"><span>What would you like to change?</span><textarea class="in" name="msg" required autofocus placeholder="e.g. Can we swap the vitrified tile for engineered wood in the living room?"></textarea></label><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button><button type="submit" class="btn pri">Send to studio</button></div></form>');
        break;
    }
  });
  function duplicate(q) {
    var c2 = newQuote(q.client, q.project + ' (copy)', 'blank'); c2.site = q.site; c2.markup = q.markup; c2.discount = q.discount; c2.tax = q.tax;
    c2.sections = q.sections.map(function (s) { return { id: uid('s'), title: s.title, items: s.items.map(function (i) { var o = JSON.parse(JSON.stringify(i)); o.id = uid('i'); return o; }) }; }); save(); go('#/quote/' + c2.id); toast('Duplicated as ' + c2.no);
  }

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset.act === 'toggle-task') {
      var q = qById(parseRoute().p[1]), p = q.plan.phases.filter(function (x) { return x.id === t.dataset.p; })[0], tk = p.tasks.filter(function (x) { return x.id === t.dataset.t; })[0];
      tk.done = t.checked; save(); render(); return;
    }
    if (t.dataset.sel === 'sort') { ui.sort = t.value; document.getElementById('qlist').innerHTML = qlistHtml(); }
    if (t.dataset.sel === 'pickcat' && ui.pick) { ui.pick.cat = t.value; document.getElementById('pickList').innerHTML = pickList(); }
  });

  document.addEventListener('input', function (e) {
    var t = e.target, q;
    if (t.id === 'signname') { var sp = document.getElementById('sigpad'); if (sp) sp.textContent = t.value; return; }
    if (t.dataset.search) {
      if (t.dataset.search === 'q') { ui.qsearch = t.value; document.getElementById('qlist').innerHTML = qlistHtml(); }
      else if (t.dataset.search === 'r') { ui.rsearch = t.value; document.getElementById('ratelist').innerHTML = rateRows(); }
      else if (ui.pick) { ui.pick.q = t.value; document.getElementById('pickList').innerHTML = pickList(); }
      return;
    }
    if (t.dataset.rb) {
      var r = S.rates.filter(function (x) { return x.id === t.closest('[data-r]').dataset.r; })[0], f = t.dataset.rb;
      r[f] = f === 'rate' ? num(t.value) : t.value; r.upd = TODAY; save(); return;
    }
    q = cur(); if (!q) return;
    if (t.dataset.qm) { q[t.dataset.qm] = t.value; if (t.dataset.qm === 'project') { var h = document.getElementById('qh'); if (h) h.textContent = t.value; } save(); touchSaved(); return; }
    if (t.dataset.qb) { q[t.dataset.qb] = num(t.value); save(); refreshTotals(q); touchSaved(); return; }
    if (t.dataset.b) {
      var row = t.closest('.li'), secEl = t.closest('section[data-s]'), s = q.sections.filter(function (x) { return x.id === secEl.dataset.s; })[0];
      if (!row) { s.title = t.value; save(); touchSaved(); return; }
      var it = s.items.filter(function (x) { return x.id === row.dataset.i; })[0], f2 = t.dataset.b;
      it[f2] = f2 === 'name' ? t.value : num(t.value); save(); refreshTotals(q); touchSaved();
    }
  });

  document.addEventListener('submit', function (e) {
    var f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault();
    var fd = new FormData(f), kind = f.dataset.form;
    if (kind === 'new') { var q = newQuote(String(fd.get('client')).trim(), String(fd.get('project')).trim(), fd.get('tpl')); shut(dlg); go('#/quote/' + q.id); toast('Created ' + q.no); }
    else if (kind === 'rate-add') { var nr = { id: uid('r'), cat: fd.get('cat'), name: String(fd.get('name')).trim(), unit: String(fd.get('unit')).trim() || 'nos', rate: num(fd.get('rate')), upd: TODAY }; S.rates.push(nr); save(); ui.rcat = 'All'; ui.rsearch = ''; ui.flash = nr.id; shut(dlg); go('#/rates'); render(); var nrow = document.querySelector('[data-r="' + nr.id + '"]'); if (nrow) nrow.scrollIntoView({ block: 'center' }); ui.flash = null; toast('Added to the rate library'); }
    else if (kind === 'accept') {
      var cq = cur(); if (!cq) return;
      cq.status = 'won'; cq.closedAt = new Date().toISOString(); cq.acceptedBy = String(fd.get('name')).trim();
      cq.plan = makePlan(cq, nextMonday(addD(TODAY, 5)));
      logq(cq, 'won', cq.acceptedBy + ' accepted the quote'); logq(cq, 'won', 'Project plan generated: ' + cq.plan.phases.length + ' phases'); save();
      ui.celebrate = true; shut(dlg); render();
    } else if (kind === 'changes') {
      var cq2 = cur(); logq(cq2, 'viewed', 'Client asked for changes: “' + String(fd.get('msg')).trim().slice(0, 120) + '”'); save(); shut(dlg); toast('Sent to the studio. They will revise and re-issue.');
    } else if (kind === 'shift') {
      var pq = qById(parseRoute().p[1]), st = planStats(pq.plan), delta = diff(st.start, fd.get('d'));
      if (delta) { pq.plan.phases.forEach(function (p) { p.start = addD(p.start, delta); p.end = addD(p.end, delta); p.tasks.forEach(function (t) { t.start = addD(t.start, delta); t.end = addD(t.end, delta); }); }); save(); render(); toast('Plan moved by ' + Math.abs(delta) + ' days'); }
    }
  });

  /* ---------- drag to reorder (pointer based, keyboard arrows too) ---------- */
  function flipMove(nodes, mutate) {
    var before = nodes.map(function (n) { return n.getBoundingClientRect().top; });
    mutate();
    if (still()) return;
    nodes.forEach(function (n, i) { var d = before[i] - n.getBoundingClientRect().top; if (Math.abs(d) > 1) G.fromTo(n, { y: d }, { y: 0, duration: .26, ease: 'power3.out', clearProps: 'transform' }); });
  }
  document.addEventListener('pointerdown', function (e) {
    var grip = e.target.closest('[data-grip]'); if (!grip || (e.button && e.button !== 0)) return;
    var kind = grip.dataset.grip, row = grip.closest(kind === 'item' ? '.li' : '.sec'); if (!row) return;
    e.preventDefault(); grip.focus();
    var lastY = e.clientY, lastX = e.clientX, raf = 0, moved = false;
    row.classList.add(kind === 'item' ? 'is-drag' : 'dragging'); document.body.style.cursor = 'grabbing';
    function place() {
      var y = lastY;
      if (kind === 'item') {
        var rows = Array.prototype.slice.call(main.querySelectorAll('.li[data-i]')), target = null, bef = true;
        for (var i = 0; i < rows.length; i++) { if (rows[i] === row) continue; var rc = rows[i].getBoundingClientRect(); if (y >= rc.top && y <= rc.bottom) { target = rows[i]; bef = y < rc.top + rc.height / 2; break; } }
        var par, ref;
        if (target) { par = target.parentNode; ref = bef ? target : target.nextElementSibling; }
        else {
          var secs = Array.prototype.slice.call(main.querySelectorAll('.sec'));
          for (var j = 0; j < secs.length; j++) { var sr = secs[j].getBoundingClientRect(); if (y >= sr.top && y <= sr.bottom && !secs[j].querySelector('.li[data-i]:not(.is-drag)')) { par = secs[j].querySelector('[data-items]'); ref = null; break; } }
        }
        if (par && (row.parentNode !== par || row.nextElementSibling !== ref) && ref !== row) { flipMove(rows, function () { par.insertBefore(row, ref); }); moved = true; }
      } else {
        var secs2 = Array.prototype.slice.call(main.querySelectorAll('#secs > .sec'));
        for (var k = 0; k < secs2.length; k++) { if (secs2[k] === row) continue; var r2 = secs2[k].getBoundingClientRect(); if (y >= r2.top && y <= r2.bottom) { var bef2 = y < r2.top + r2.height / 2, ref2 = bef2 ? secs2[k] : secs2[k].nextElementSibling; if (ref2 !== row) { flipMove(secs2, function () { row.parentNode.insertBefore(row, ref2); }); moved = true; } break; } }
      }
    }
    function tick() {
      if (lastY < 130) window.scrollBy(0, -14); else if (lastY > innerHeight - 70) window.scrollBy(0, 14);
      place(); raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    function mv(ev) { lastY = ev.clientY; lastX = ev.clientX; }
    function up() {
      cancelAnimationFrame(raf); document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up); document.body.style.cursor = '';
      row.classList.remove('is-drag', 'dragging');
      if (!moved) return;
      var q = cur(); if (!q) return;
      var map = {}, smap = {}; q.sections.forEach(function (s) { smap[s.id] = s; s.items.forEach(function (i) { map[i.id] = i; }); });
      var order = [];
      Array.prototype.forEach.call(main.querySelectorAll('#secs > .sec'), function (se) {
        var s = smap[se.dataset.s]; if (!s) return;
        s.items = Array.prototype.map.call(se.querySelectorAll('.li[data-i]'), function (r) { return map[r.dataset.i]; }).filter(Boolean); order.push(s);
      });
      q.sections = order; save(); if (kind === 'item') ui.flash = row.dataset.i; ui.focusAfter = '[data-grip="' + kind + '"]'; render(); toast('Order updated');
    }
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
  });
  document.addEventListener('keydown', function (e) {
    var grip = e.target.closest && e.target.closest('[data-grip]'); if (!grip || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault(); var q = cur(), dir = e.key === 'ArrowUp' ? -1 : 1, kind = grip.dataset.grip;
    if (kind === 'sec') {
      var se = grip.closest('.sec'), si = -1; q.sections.forEach(function (s, n) { if (s.id === se.dataset.s) si = n; });
      var ni = si + dir; if (ni < 0 || ni >= q.sections.length) return;
      var tmp = q.sections[si]; q.sections[si] = q.sections[ni]; q.sections[ni] = tmp; save(); ui.focusAfter = '.sec[data-s="' + tmp.id + '"] [data-grip="sec"]'; render();
    } else {
      var rid = grip.closest('.li').dataset.i, a = -1, b2 = -1;
      q.sections.forEach(function (s, x) { s.items.forEach(function (i, y) { if (i.id === rid) { a = x; b2 = y; } }); });
      var s0 = q.sections[a], itm = s0.items[b2], tgt = b2 + dir;
      if (tgt >= 0 && tgt < s0.items.length) { s0.items.splice(b2, 1); s0.items.splice(tgt, 0, itm); }
      else if (dir < 0 && a > 0) { s0.items.splice(b2, 1); q.sections[a - 1].items.push(itm); }
      else if (dir > 0 && a < q.sections.length - 1) { s0.items.splice(b2, 1); q.sections[a + 1].items.unshift(itm); }
      else return;
      save(); ui.flash = rid; ui.focusAfter = '.li[data-i="' + rid + '"] [data-grip="item"]'; render();
    }
  });

  /* ---------- global keyboard ---------- */
  var gAt = 0;
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (pal.open) shut(pal); else openPalette(); return; }
    if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
    var t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (e.key === 'Escape' && MOBILE.matches) closeSide();
    if (typing || document.querySelector('dialog[open]')) return;
    var k = e.key.toLowerCase(), now = Date.now();
    if (gAt && now - gAt < 1100) {
      gAt = 0; var m = { d: '#/', q: '#/quotes', r: '#/rates', p: '#/projects' }[k]; if (m) { e.preventDefault(); go(m); return; }
    }
    if (k === 'g') { gAt = now; return; }
    if (k === 'n') { e.preventDefault(); newQuoteDlg(); }
    else if (k === '[') { e.preventDefault(); toggleSide(); }
    else if (k === '?') { e.preventDefault(); openShortcuts(); }
    else if (k === '/') { e.preventDefault(); var s = document.getElementById('qs') || document.getElementById('rs'); if (s) s.focus(); else openPalette(); }
    else if (k === 'i') { var q = cur(), p = parseRoute().p; if (q && p[0] === 'quote' && q.status !== 'won' && q.status !== 'lost' && q.sections.length) { e.preventDefault(); openPicker(q.sections[q.sections.length - 1].id); } }
    else if (k === 'j' || k === 'k') {
      var links = Array.prototype.slice.call(main.querySelectorAll('.tbl .tl')); if (!links.length) return; e.preventDefault();
      var ai = links.indexOf(document.activeElement), ni2 = ai < 0 ? 0 : Math.max(0, Math.min(links.length - 1, ai + (k === 'j' ? 1 : -1))); links[ni2].focus(); links[ni2].scrollIntoView({ block: 'nearest' });
    }
  });
  /* enter in picker search adds the first match */
  drawer.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.id === 'pq') { e.preventDefault(); var b = drawer.querySelector('[data-act="pick"]'); if (b) b.click(); }
  });

  window.addEventListener('hashchange', function () { closeAllDialogs(); hideTip(); render(); });
  var rzT; window.addEventListener('resize', function () { clearTimeout(rzT); rzT = setTimeout(function () { fitChart(); }, 200); });
  window.addEventListener('beforeprint', function () { hideTip(); if (G) G.globalTimeline.getChildren(true, true, true).forEach(function (t) { t.progress(1); }); });

  /* ---------- boot ---------- */
  S = load(); save(); hydrate(document); applySide();
  var firstRoute = parseRoute().p[0];
  if (!still() && firstRoute !== 'q') { main.innerHTML = skeleton(); setCrumbs([['Loading…']]); document.querySelector('#nav').innerHTML = navHtml('dash'); setTimeout(render, 420); }
  else render();
})();
