/* Marlow & Reed Studio OS: core runtime. A design sample by Abhishek. Fictional studio, demo data. */
(function () {
  'use strict';
  var MR = window.MR = window.MR || {};

  /* ---------------- formatting ---------------- */
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  var money2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function inr(n) { return money.format(Math.round(n || 0)); }
  function inr2(n) { return money2.format(n || 0); }
  function lakh(n) {
    n = n || 0; var a = Math.abs(n), s = n < 0 ? '−' : '';
    if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(a >= 1e8 ? 1 : 2).replace(/\.?0+$/, '') + ' Cr';
    if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(a >= 1e6 ? 1 : 2).replace(/\.?0+$/, '') + ' L';
    if (a >= 1e3) return s + '₹' + (a / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'k';
    return s + '₹' + Math.round(a);
  }
  function fnum(v, d) { v = +v || 0; return v.toLocaleString('en-IN', { maximumFractionDigits: d == null ? 2 : d }); }
  function pct(v, d) { return (Math.round((v || 0) * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toFixed(d || 0) + '%'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  /* ---------------- whose studio this is: the example studio, or a visitor's own name (set by brand-boot.js) ---------------- */
  var BR = window.StudioBrand && window.StudioBrand.get ? window.StudioBrand.get() : null;
  MR.brand = BR;
  MR.studio = function () { return BR ? BR.name : MR.S.company.short; };
  MR.co = function () { var c = MR.S.company, o = {}, k; if (!BR) return c; for (k in c) o[k] = c[k]; o.name = BR.name; o.short = BR.name; o.email = 'studio@' + BR.slug + '.example'; o.web = BR.slug + '.example'; return o; };
  MR.markHtml = function () { return '<span class="mark" aria-hidden="true"' + (BR ? ' data-n="' + BR.n + '">' + esc(BR.initial) : '>M<i>&amp;</i>R') + '</span>'; };
  MR.sub = function (t) { return BR ? String(t).replace(/Marlow (?:&|&amp;) Reed(?: Interiors LLP)?/g, function () { return BR.name; }) : t; };
  function num(v) { var n = parseFloat(String(v).replace(/[,₹\s]/g, '')); return isFinite(n) ? n : 0; }
  function uid(p) { return (p || 'x') + Math.random().toString(36).slice(2, 9); }
  function pd(s) { var p = String(s).slice(0, 10).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function ds(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function today() { return ds(new Date()); }
  function addD(s, n) { var d = pd(s); d.setDate(d.getDate() + n); return ds(d); }
  function diffD(a, b) { return Math.round((pd(b) - pd(a)) / 864e5); }
  function fdate(x) { if (!x) return '—'; var d = pd(x); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); }
  function fshort(x) { if (!x) return '—'; var d = pd(x); return d.getDate() + ' ' + MON[d.getMonth()]; }
  function fday(x) { var d = pd(x); return DAY[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()]; }
  function ftime(ts) { var d = new Date(ts); var h = d.getHours(), m = d.getMinutes(); return ((h % 12) || 12) + ':' + ('0' + m).slice(-2) + (h < 12 ? ' am' : ' pm'); }
  function rel(ts) {
    if (!ts) return '—';
    var s = (Date.now() - new Date(ts.length <= 10 ? ts + 'T10:00:00' : ts)) / 1000;
    if (s < 0) { var dd = Math.round(-s / 86400); return dd <= 0 ? 'today' : dd === 1 ? 'tomorrow' : 'in ' + dd + ' days'; }
    if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    var d = Math.floor(s / 86400); return d === 1 ? 'yesterday' : d < 30 ? d + 'd ago' : fdate(ts);
  }
  function fy(dateStr) { var d = pd(dateStr), y = d.getFullYear(), m = d.getMonth(); var a = m >= 3 ? y : y - 1; return String(a).slice(2) + '-' + String(a + 1).slice(2); }
  function initials(n) { return String(n || '').replace(/^(Dr|Mr|Ms|Mrs)\.?\s+/, '').split(/\s+|&/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); }

  // Indian amount in words: "Rupees Four Lakh Twelve Thousand Three Hundred Only"
  var ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  var TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function two(n) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''); }
  function three(n) { var h = Math.floor(n / 100), r = n % 100; return (h ? ONES[h] + ' Hundred' + (r ? ' and ' : '') : '') + (r ? two(r) : ''); }
  function words(amount) {
    var n = Math.floor(amount), p = Math.round((amount - n) * 100), out = [];
    var cr = Math.floor(n / 1e7); n %= 1e7; var lk = Math.floor(n / 1e5); n %= 1e5; var th = Math.floor(n / 1e3); n %= 1e3;
    if (cr) out.push(three(cr) + ' Crore'); if (lk) out.push(two(lk) + ' Lakh'); if (th) out.push(two(th) + ' Thousand'); if (n) out.push(three(n));
    return 'Rupees ' + (out.join(' ') || 'Zero') + (p ? ' and ' + two(p) + ' Paise' : '') + ' Only';
  }

  // deterministic PRNG for seeding
  function rng(seed) { var a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  MR.u = { MON: MON, inr: inr, inr2: inr2, lakh: lakh, fnum: fnum, pct: pct, esc: esc, num: num, uid: uid, pd: pd, ds: ds, today: today, addD: addD, diffD: diffD, fdate: fdate, fshort: fshort, fday: fday, ftime: ftime, rel: rel, fy: fy, initials: initials, words: words, rng: rng };

  /* ---------------- icons ---------------- */
  var IC = {
    home: '<path d="M2.5 7.2L8 2.8l5.5 4.4V13a.5.5 0 0 1-.5.5H9.5V10h-3v3.5H3a.5.5 0 0 1-.5-.5z"/>',
    inbox: '<path d="M2.5 9.5l1.8-6h7.4l1.8 6v3.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5z"/><path d="M2.5 9.5h3.2l.8 1.5h3l.8-1.5h3.2"/>',
    clients: '<circle cx="6" cy="5.5" r="2.3"/><path d="M1.8 13.2c.4-2.3 2.1-3.4 4.2-3.4s3.8 1.1 4.2 3.4"/><path d="M10.5 3.4a2.2 2.2 0 0 1 0 4.3M12 9.9c1.3.4 2.1 1.5 2.3 3.3"/>',
    quotes: '<path d="M4 2.5h5l3 3v8H4z"/><path d="M9 2.5v3h3M6 8.5h4M6 11h4"/>',
    approve: '<path d="M8 1.8l5 2v4c0 3-2.2 5.2-5 6.4-2.8-1.2-5-3.4-5-6.4v-4z"/><path d="M5.6 8.1l1.7 1.7 3.2-3.5"/>',
    rates: '<path d="M2.5 4h11M2.5 8h11M2.5 12h6"/>',
    projects: '<path d="M2.5 4h5M5 8h7M8 12h5.5"/>',
    site: '<path d="M2 13.5h12M3.5 13.5V7l4.5-3.5L12.5 7v6.5"/><path d="M6.5 13.5v-3.5h3v3.5"/>',
    helmet: '<path d="M2.5 11.5h11M3.5 11.5a4.5 4.5 0 0 1 9 0M8 4v3M6 5.1l.6 2.4M10 5.1l-.6 2.4"/>',
    truck: '<path d="M1.5 4h8v7h-8zM9.5 6.5h3l2 2.3V11h-5z"/><circle cx="4.5" cy="11.8" r="1.3"/><circle cx="11.8" cy="11.8" r="1.3"/>',
    vendor: '<path d="M2.5 6.5l1-3.5h9l1 3.5M2.5 6.5v7h11v-7M2.5 6.5c0 1.1.9 1.8 1.8 1.8S6.2 7.6 6.2 6.5c0 1.1.8 1.8 1.8 1.8s1.8-.7 1.8-1.8c0 1.1.9 1.8 1.8 1.8s1.9-.7 1.9-1.8M6.5 13.5V10h3v3.5"/>',
    invoice: '<path d="M3.5 1.8h9v12.4l-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1z"/><path d="M6 5h4M6 7.5h4M6 10h2.5"/>',
    pay: '<rect x="1.8" y="3.5" width="12.4" height="9" rx="1.2"/><path d="M1.8 6.5h12.4M4.5 10h2.5"/>',
    ageing: '<circle cx="8" cy="8" r="5.8"/><path d="M8 4.8V8l2.2 1.6"/>',
    reports: '<path d="M2.5 13.5h11M4.5 11V7.5M8 11V4M11.5 11V9"/>',
    audit: '<path d="M4 2.5h8v11H4z"/><path d="M6 5.5h4M6 8h4M6 10.5h2"/><circle cx="12.2" cy="12.2" r="2" fill="var(--surface)"/><path d="M13.6 13.6l1 1"/>',
    snag: '<path d="M8 2l6 10.5H2z"/><path d="M8 6.5v3M8 11.3v.01"/>',
    log: '<rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/><path d="M2.5 6h11M5.5 2v2M10.5 2v2M5 8.8h2M5 11h4.5"/>',
    camera: '<path d="M2 5.5h2.5l1.2-1.8h4.6l1.2 1.8H14v7.5H2z"/><circle cx="8" cy="9" r="2.4"/>',
    search: '<circle cx="7" cy="7" r="4.2"/><path d="M10.2 10.2l3.3 3.3"/>',
    plus: '<path d="M8 3v10M3 8h10"/>',
    minus: '<path d="M3 8h10"/>',
    panel: '<rect x="2.5" y="3" width="11" height="10" rx="1.5"/><path d="M6.5 3v10"/>',
    bell: '<path d="M4 11V7.3a4 4 0 0 1 8 0V11l1 1.3H3z"/><path d="M6.6 13.6a1.5 1.5 0 0 0 2.8 0"/>',
    keys: '<rect x="2" y="4" width="12" height="8" rx="1.5"/><path d="M5 7h.01M8 7h.01M11 7h.01M5.5 9.5h5"/>',
    reset: '<path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.8v2.7h2.7"/>',
    undo: '<path d="M5.5 4L2.8 6.7l2.7 2.7"/><path d="M3 6.7h6.2a3.6 3.6 0 0 1 0 7.2H6.5"/>',
    chev: '<path d="M4 6l4 4 4-4"/>',
    chevr: '<path d="M6 4l4 4-4 4"/>',
    chevl: '<path d="M10 4L6 8l4 4"/>',
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
    diff: '<path d="M5 2.5v7M2.5 6H7.5M9 13h4.5"/><path d="M4.5 13.5h-2v-2M11 2.5h2.5V5"/>',
    sign: '<path d="M2 12.5c2-3 3-7 4.5-7s-.5 6 1 6 1.6-3 3-3 .8 2.2 2 2.2 1.5-.8 1.5-.8"/><path d="M2 14.5h12"/>',
    comment: '<path d="M2.5 3.5h11v7.5H7l-3 2.5V11H2.5z"/>',
    flag: '<path d="M3.5 14V2.5M3.5 3h8l-1.8 2.8L11.5 8.5h-8"/>',
    filter: '<path d="M2.5 3.5h11L9.2 8.6v4.4l-2.4-1.2V8.6z"/>',
    more: '<circle cx="3.5" cy="8" r=".9" fill="currentColor"/><circle cx="8" cy="8" r=".9" fill="currentColor"/><circle cx="12.5" cy="8" r=".9" fill="currentColor"/>',
    download: '<path d="M8 2.5v8M4.5 7L8 10.5 11.5 7M3 13.5h10"/>',
    edit: '<path d="M10.5 2.8l2.7 2.7-7.7 7.7H2.8v-2.7z"/><path d="M9 4.3l2.7 2.7"/>',
    sun: '<circle cx="8" cy="8" r="2.8"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/>',
    cloud: '<path d="M4.5 12.5a3 3 0 0 1-.3-6 4 4 0 0 1 7.6-.9A3 3 0 0 1 11.5 12.5z"/>',
    rain: '<path d="M4.5 10a3 3 0 0 1-.3-6 4 4 0 0 1 7.6-.9A3 3 0 0 1 11.5 10z"/><path d="M5.5 12l-.7 1.8M8.5 12l-.7 1.8M11.5 12l-.7 1.8"/>',
    smog: '<path d="M2.5 5.5h9M4.5 8h9M2.5 10.5h9M5 13h6"/>',
    clock: '<circle cx="8" cy="8" r="5.8"/><path d="M8 4.8V8l2.2 1.6"/>',
    box: '<path d="M2.5 5L8 2.5 13.5 5v6L8 13.5 2.5 11z"/><path d="M2.5 5L8 7.5 13.5 5M8 7.5v6"/>',
    bolt: '<path d="M9 1.8L3.5 9H8l-1 5.2L12.5 7H8z"/>',
    lock: '<rect x="3.5" y="7" width="9" height="6.5" rx="1"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/>',
    star: '<path d="M8 2.2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.4l-3.6 1.9.7-4L2.2 6.5l4-.6z"/>',
    building: '<path d="M3 13.5V3.5h6.5v10M9.5 6.5h3.5v7M2 13.5h12M5 5.5h.01M7.3 5.5h.01M5 8h.01M7.3 8h.01M5 10.5h.01M7.3 10.5h.01"/>',
    phone: '<path d="M4.5 2.5h2l1 3-1.5 1a7 7 0 0 0 3.5 3.5l1-1.5 3 1v2a1.5 1.5 0 0 1-1.5 1.5A10.5 10.5 0 0 1 3 4a1.5 1.5 0 0 1 1.5-1.5z"/>',
    mail: '<rect x="2" y="3.5" width="12" height="9" rx="1"/><path d="M2.5 4.2L8 8.5l5.5-4.3"/>',
    pin: '<path d="M8 14s4.5-4.1 4.5-7.5a4.5 4.5 0 0 0-9 0C3.5 9.9 8 14 8 14z"/><circle cx="8" cy="6.5" r="1.6"/>',
    spark: '<path d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l2 2M10 10l2 2M12 4l-2 2M6 10l-2 2"/>',
    grip: '<circle cx="6" cy="4" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="4" r="1" fill="currentColor" stroke="none"/><circle cx="6" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="6" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="12" r="1" fill="currentColor" stroke="none"/>'
  };
  function ic(n, cls) { return '<span class="ico' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><svg viewBox="0 0 16 16">' + (IC[n] || '') + '</svg></span>'; }
  MR.IC = IC; MR.ic = ic;

  /* ---------------- team, roles, permissions ---------------- */
  MR.USERS = [
    { id: 'u-ira', name: 'Ira Mehta', role: 'owner', title: 'Principal & founder', hue: 18 },
    { id: 'u-kabir', name: 'Kabir Sood', role: 'pm', title: 'Senior project manager', hue: 210 },
    { id: 'u-naina', name: 'Naina Kapoor', role: 'pm', title: 'Project manager', hue: 280 },
    { id: 'u-rakesh', name: 'Rakesh Gupta', role: 'accounts', title: 'Accounts & billing', hue: 150 },
    { id: 'u-imran', name: 'Imran Qureshi', role: 'site', title: 'Site engineer', hue: 40 },
    { id: 'u-deepak', name: 'Deepak Rawat', role: 'site', title: 'Site engineer', hue: 95 },
    { id: 'u-sana', name: 'Sana Fatima', role: 'site', title: 'Site engineer', hue: 330 },
    { id: 'u-tanvi', name: 'Tanvi Joshi', role: 'design', title: 'Lead designer', hue: 250 },
    { id: 'u-client', name: 'Rohan Iyer', role: 'client', title: 'Client · Iyer residence', hue: 200 }
  ];
  MR.ROLES = {
    owner: { label: 'Owner', who: 'u-ira', blurb: 'Everything, plus quote approvals and the audit log' },
    pm: { label: 'Project manager', who: 'u-kabir', blurb: 'Quotes, projects, change orders, purchase orders' },
    accounts: { label: 'Accounts', who: 'u-rakesh', blurb: 'Invoices, payments, receivables and vendor bills' },
    site: { label: 'Site engineer', who: 'u-imran', blurb: 'Daily logs, photos, snags and deliveries. No money.' },
    design: { label: 'Designer', who: 'u-tanvi', blurb: 'Leads, design boards, client approvals, quotes' },
    client: { label: 'Client', who: 'u-client', blurb: 'The client portal: progress, design approvals, payments' }
  };
  var PERM = {
    owner: '*',
    pm: ['lead.edit', 'design.edit', 'bid.edit', 'quote.edit', 'quote.send', 'client.edit', 'project.edit', 'co.create', 'money.view', 'finance.view', 'proc.edit', 'proc.receive', 'site.log', 'snag.raise', 'snag.close', 'reports.view', 'rates.view', 'invoice.raise'],
    accounts: ['money.view', 'finance.view', 'finance.edit', 'invoice.raise', 'client.edit', 'proc.edit', 'bid.edit', 'reports.view', 'rates.view'],
    design: ['lead.edit', 'design.edit', 'quote.edit', 'client.edit', 'money.view', 'rates.view', 'snag.raise'],
    client: [],
    site: ['site.log', 'snag.raise', 'snag.close', 'proc.receive']
  };
  MR.userById = function (id) { for (var i = 0; i < MR.USERS.length; i++) if (MR.USERS[i].id === id) return MR.USERS[i]; return { id: id, name: 'Client', role: 'client', hue: 0 }; };
  MR.me = function () { return MR.userById(MR.ROLES[MR.S.role].who); };
  MR.can = function (p) { var r = PERM[MR.S.role]; return r === '*' || (r && r.indexOf(p) > -1); };
  MR.avatar = function (uidOrName, size) {
    var u = typeof uidOrName === 'string' && uidOrName.indexOf('u-') === 0 ? MR.userById(uidOrName) : { name: uidOrName, hue: 30 };
    var hue = u.hue == null ? 30 : u.hue;
    return '<span class="av' + (size ? ' av-' + size : '') + '" style="--h:' + hue + '" title="' + esc(u.name) + '" aria-hidden="true">' + esc(initials(u.name)) + '</span>';
  };

  /* ---------------- store ---------------- */
  var KEY = 'mr-studio-os-v2', UIK = 'mr-studio-os-ui';
  MR.KEY = KEY;
  MR.load = function () {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { s = null; }
    if (!s || s.v !== 5 || !s.quotes) { s = MR.seed(); MR.S = s; MR.save(); }
    MR.S = s; return s;
  };
  var saveT = 0, warned = false;
  MR.save = function (now) {
    clearTimeout(saveT);
    var fn = function () {
      try { localStorage.setItem(KEY, JSON.stringify(MR.S)); }
      catch (e) { if (!warned) { warned = true; MR.toast('Browser storage is full. Remove a few photos to keep saving.', { kind: 'bad' }); } }
    };
    if (now) fn(); else saveT = setTimeout(fn, 120);
  };
  MR.prefs = (function () { try { return JSON.parse(localStorage.getItem(UIK) || '{}') || {}; } catch (e) { return {}; } })();
  MR.savePrefs = function () { try { localStorage.setItem(UIK, JSON.stringify(MR.prefs)); } catch (e) { /* ignore */ } };
  MR.reset = function () { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } MR.S = MR.seed(); MR.save(true); };

  function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  MR.find = find;
  MR.client = function (id) { return find(MR.S.clients, id); };
  MR.quote = function (id) { return find(MR.S.quotes, id); };
  MR.project = function (id) { return find(MR.S.projects, id); };
  MR.invoice = function (id) { return find(MR.S.invoices, id); };
  MR.vendor = function (id) { return find(MR.S.vendors, id); };
  MR.po = function (id) { return find(MR.S.pos, id); };
  MR.rate = function (id) { return find(MR.S.rates, id); };
  MR.next = function (k) { MR.S.seq[k] = (MR.S.seq[k] || 0) + 1; return MR.S.seq[k]; };
  MR.pad = function (n, w) { n = String(n); while (n.length < (w || 3)) n = '0' + n; return n; };
  MR.u.pad = MR.pad;

  /* ---------------- audit, notifications ---------------- */
  MR.audit = function (entity, ref, action, detail, by) {
    MR.S.audit.unshift({ id: uid('a'), at: new Date().toISOString(), by: by || MR.ROLES[MR.S.role].who, entity: entity, ref: ref, action: action, detail: detail || '' });
    if (MR.S.audit.length > 600) MR.S.audit.length = 600;
  };
  MR.notify = function (roles, text, href, kind) {
    MR.S.notifs.unshift({ id: uid('n'), at: new Date().toISOString(), to: roles, text: text, href: href || '', kind: kind || 'info', read: [] });
    if (MR.S.notifs.length > 120) MR.S.notifs.length = 120;
    MR.emit('notifs');
  };
  MR.myNotifs = function () { var r = MR.S.role; return MR.S.notifs.filter(function (n) { return n.to.indexOf(r) > -1 || n.to.indexOf('all') > -1; }); };
  MR.unread = function () { var r = MR.S.role; return MR.myNotifs().filter(function (n) { return n.read.indexOf(r) < 0; }).length; };

  /* tiny event bus */
  var bus = {};
  MR.on = function (k, fn) { (bus[k] = bus[k] || []).push(fn); };
  MR.emit = function (k, a) { (bus[k] || []).forEach(function (fn) { try { fn(a); } catch (e) { if (window.console) console.error(e); } }); };

  /* ---------------- undo ---------------- */
  var UNDO = [];
  MR.undoable = function (label, undoFn) {
    UNDO.push({ label: label, fn: undoFn }); if (UNDO.length > 40) UNDO.shift();
    MR.toast(label, { action: 'Undo', key: '⌘Z', fn: MR.undo });
  };
  MR.undo = function () {
    var u = UNDO.pop(); if (!u) { MR.toast('Nothing to undo', { plain: true }); return; }
    u.fn(); MR.save(); MR.render(); MR.toast('Undone: ' + u.label.replace(/^Updated /, ''), { plain: true });
  };
  // set a field with undo + audit
  MR.setField = function (obj, field, val, label, entity, ref) {
    var old = obj[field]; if (old === val) return false;
    obj[field] = val;
    if (entity) MR.audit(entity, ref, 'edited', label + ': ' + fmtVal(old) + ' → ' + fmtVal(val));
    MR.undoable('Updated ' + label.toLowerCase(), function () { obj[field] = old; if (entity) MR.audit(entity, ref, 'undo', label + ' restored to ' + fmtVal(old)); });
    MR.save(); return true;
  };
  function fmtVal(v) { return v == null || v === '' ? '—' : typeof v === 'number' ? fnum(v) : String(v); }

  /* ---------------- calculations ---------------- */
  MR.sell = function (r) { var x = (r.mat + r.lab) * (1 + r.margin / 100); return x < 200 ? Math.round(x) : Math.round(x / 5) * 5; };
  MR.STATE = { HR: { name: 'Haryana', code: '06' }, DL: { name: 'Delhi', code: '07' }, UP: { name: 'Uttar Pradesh', code: '09' } };
  function lineQty(it) { return it.qty * (1 + (it.wst || 0) / 100); }
  function lineAmt(it) { return lineQty(it) * it.rate * (1 - (it.disc || 0) / 100); }
  function lineCost(it) { return lineQty(it) * ((it.mat || 0) + (it.lab || 0)); }
  MR.lineQty = lineQty; MR.lineAmt = lineAmt; MR.lineCost = lineCost;
  MR.secTotal = function (s) { return s.items.reduce(function (a, i) { return a + lineAmt(i); }, 0); };
  MR.calc = function (q, v) {
    v = v || MR.ver(q);
    var sub = 0, cost = 0, lines = 0;
    v.sections.forEach(function (s) { s.items.forEach(function (i) { sub += lineAmt(i); cost += lineCost(i); lines++; }); });
    var disc = sub * (v.discPct || 0) / 100, taxable = sub - disc;
    var intra = (q.state || 'HR') === 'HR';
    var gst = taxable * 0.18;
    var o = { sub: sub, disc: disc, taxable: taxable, intra: intra, cgst: intra ? gst / 2 : 0, sgst: intra ? gst / 2 : 0, igst: intra ? 0 : gst, gst: gst, total: taxable + gst, cost: cost, lines: lines };
    o.margin = taxable ? (taxable - cost) / taxable : 0;
    return o;
  };
  MR.ver = function (q, n) { return n ? q.versions[n - 1] : q.versions[q.versions.length - 1]; };
  MR.sentVer = function (q) { for (var i = q.versions.length - 1; i >= 0; i--) if (q.versions[i].sentAt) return q.versions[i]; return null; };
  MR.qTotal = function (q) { return MR.calc(q).taxable; };

  MR.QSTATUS = {
    draft: ['Draft', 'grey'], review: ['In review', 'violet'], rejected: ['Changes needed', 'bad'], approved: ['Approved', 'info'],
    sent: ['Sent', 'info'], viewed: ['Viewed', 'info'], changes: ['Client changes', 'warn'], signed: ['Signed', 'ok'], converted: ['Project', 'ok'], lost: ['Lost', 'grey']
  };
  MR.pill = function (key, map, extra) {
    var m = (map || MR.QSTATUS)[key] || [key, 'grey'];
    return '<span class="pill p-' + m[1] + (extra ? ' ' + extra : '') + '"><i aria-hidden="true"></i>' + esc(m[0]) + '</span>';
  };

  /* project health */
  MR.health = function (p) {
    var t = today(), reasons = [], lvl = 0;
    if (p.status === 'handed') return { lvl: 0, key: 'done', label: 'Handed over', reasons: ['Handed over ' + fdate(p.handedAt)] };
    var slip = 0;
    p.milestones.forEach(function (m) { if (m.progress < 100 && m.end < t) slip = Math.max(slip, diffD(m.end, t)); });
    if (slip > 10) { lvl = 2; reasons.push('Milestone ' + slip + ' days late'); } else if (slip > 0) { lvl = Math.max(lvl, 1); reasons.push('Milestone ' + slip + ' days late'); }
    var od = 0, odDays = 0;
    MR.S.invoices.forEach(function (iv) { if (iv.projectId === p.id) { var st = MR.invState(iv); if (st.key === 'overdue') { od += st.balance; odDays = Math.max(odDays, st.overdue); } } });
    if (od > 0) { var l2 = odDays > 30 ? 2 : 1; lvl = Math.max(lvl, l2); reasons.push(lakh(od) + ' overdue ' + odDays + ' days'); }
    var hi = MR.S.snags.filter(function (s) { return s.projectId === p.id && s.status !== 'closed' && s.sev === 'high'; }).length;
    if (hi) { lvl = Math.max(lvl, 1); reasons.push(hi + ' high-severity snag' + (hi > 1 ? 's' : '') + ' open'); }
    var late = MR.S.pos.filter(function (o) { return o.projectId === p.id && o.status !== 'delivered' && o.status !== 'cancelled' && o.expected < t; }).length;
    if (late) { lvl = Math.max(lvl, 1); reasons.push(late + ' delivery late'); }
    var coP = (p.cos || []).filter(function (c) { return c.status === 'sent'; }).length;
    if (coP) reasons.push(coP + ' change order awaiting client');
    if (!reasons.length) reasons.push('On schedule, nothing overdue');
    return { lvl: lvl, key: ['ok', 'risk', 'off'][lvl], label: ['On track', 'At risk', 'Off track'][lvl], reasons: reasons };
  };
  MR.healthDot = function (h) { return '<span class="hd hd-' + h.key + '" title="' + esc(h.reasons.join(' · ')) + '"><i aria-hidden="true"></i>' + esc(h.label) + '</span>'; };
  MR.projValue = function (p) { var v = p.value; (p.cos || []).forEach(function (c) { if (c.status === 'approved') v += c.amount; }); return v; };
  MR.projProgress = function (p) {
    var tot = 0, done = 0; p.milestones.forEach(function (m) { var w = Math.max(1, diffD(m.start, m.end)); tot += w; done += w * m.progress / 100; });
    return tot ? done / tot : 0;
  };

  /* invoice state */
  MR.invPaid = function (iv) { var a = 0; MR.S.payments.forEach(function (p) { if (p.invoiceId === iv.id) a += p.amount + (p.tds || 0); }); return a; };
  MR.invState = function (iv) {
    var paid = MR.invPaid(iv), bal = Math.max(0, Math.round(iv.total - paid)), t = today();
    var over = iv.due < t ? diffD(iv.due, t) : 0;
    if (bal <= 1) return { key: 'paid', label: 'Paid', tone: 'ok', paid: paid, balance: 0, overdue: 0 };
    if (over > 0) return { key: 'overdue', label: 'Overdue ' + over + 'd', tone: 'bad', paid: paid, balance: bal, overdue: over };
    if (paid > 0) return { key: 'part', label: 'Part paid', tone: 'warn', paid: paid, balance: bal, overdue: 0 };
    return { key: 'open', label: 'Due ' + fshort(iv.due), tone: 'info', paid: paid, balance: bal, overdue: 0 };
  };
  MR.invTotals = function (lines, state) {
    var taxable = lines.reduce(function (a, l) { return a + l.amt; }, 0), intra = state === 'HR', g = Math.round(taxable * 0.18 * 100) / 100;
    return { taxable: taxable, cgst: intra ? g / 2 : 0, sgst: intra ? g / 2 : 0, igst: intra ? 0 : g, total: Math.round(taxable + g) };
  };

  /* ---------------- motion helpers ---------------- */
  var RMQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  MR.still = function () { return !window.gsap || RMQ.matches; };
  MR.countTo = function (el, to, fmt) {
    fmt = fmt || inr;
    if (MR.still()) { el.textContent = fmt(to); return; }
    var o = { v: 0 }; window.gsap.to(o, { v: to, duration: .9, ease: 'expo.out', onUpdate: function () { el.textContent = fmt(o.v); } });
  };

  /* ---------------- toast ---------------- */
  MR.toast = function (msg, opt) {
    opt = opt || {};
    var host = document.getElementById('toast'); if (!host) return;
    var el = document.createElement('div'); el.className = 'toast' + (opt.kind ? ' t-' + opt.kind : '');
    el.innerHTML = (opt.plain ? '' : ic(opt.kind === 'bad' ? 'snag' : 'check')) + '<span>' + esc(msg) + '</span>' + (opt.action ? '<button type="button">' + esc(opt.action) + (opt.key ? ' <kbd>' + opt.key + '</kbd>' : '') + '</button>' : '');
    while (host.children.length > 2) host.removeChild(host.firstChild);
    host.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('in'); });
    var gone = false;
    function kill() { if (gone) return; gone = true; el.classList.remove('in'); setTimeout(function () { el.remove(); }, 220); }
    if (opt.action) el.querySelector('button').addEventListener('click', function () { if (opt.fn) opt.fn(); kill(); });
    setTimeout(kill, opt.action ? 6500 : 3200);
  };

  /* ---------------- dialogs ---------------- */
  MR.openDlg = function (html, cls) {
    if (MR.closeMenu) MR.closeMenu();
    var d = document.getElementById('dlg');
    d.className = 'modal' + (cls ? ' ' + cls : '');
    d.innerHTML = html;
    if (!d.open) d.showModal();
    var f = d.querySelector('[autofocus]') || d.querySelector('input:not([type=hidden]),select,textarea,button:not([data-act=dlg-close])');
    if (f) setTimeout(function () { f.focus(); }, 30);
    return d;
  };
  MR.closeDlg = function () { var d = document.getElementById('dlg'); if (d.open) d.close(); };
  MR.openDrawer = function (html) {
    if (MR.closeMenu) MR.closeMenu();
    var d = document.getElementById('drawer'); d.innerHTML = html; if (!d.open) d.showModal();
    var f = d.querySelector('[autofocus]') || d.querySelector('button'); if (f) setTimeout(function () { f.focus(); }, 30);
    return d;
  };
  MR.closeDrawer = function () { var d = document.getElementById('drawer'); if (d.open) d.close(); };
  MR.xBtn = function () { return '<button type="button" class="icon-btn" data-act="dlg-close" aria-label="Close">' + ic('x') + '</button>'; };
  MR.confirm = function (title, body, okLabel, fn, danger) {
    MR._confirmFn = fn;
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">' + esc(title) + '</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><p class="muted">' + body + '</p></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button><button type="button" class="btn ' + (danger ? 'danger' : 'pri') + '" data-act="confirm-ok" autofocus>' + esc(okLabel) + '</button></div>', 'sm');
  };

  /* ---------------- small builders ---------------- */
  MR.btn = function (act, label, opt) {
    opt = opt || {};
    return '<button type="button" class="btn ' + (opt.cls || '') + '" data-act="' + act + '"' + (opt.id ? ' data-id="' + esc(opt.id) + '"' : '') + (opt.attrs || '') + (opt.disabled ? ' disabled' : '') + '>' + (opt.icon ? ic(opt.icon) : '') + '<span>' + esc(label) + '</span>' + (opt.kbd ? '<kbd>' + opt.kbd + '</kbd>' : '') + '</button>';
  };
  MR.iconBtn = function (act, icon, label, opt) {
    opt = opt || {};
    return '<button type="button" class="icon-btn ' + (opt.cls || '') + '" data-act="' + act + '"' + (opt.id ? ' data-id="' + esc(opt.id) + '"' : '') + (opt.attrs || '') + ' aria-label="' + esc(label) + '" data-tip="' + esc(label) + '">' + ic(icon) + '</button>';
  };
  MR.empty = function (icon, title, body, action) {
    return '<div class="empty">' + '<div class="empty-art">' + ic(icon) + '</div><h3>' + esc(title) + '</h3><p>' + body + '</p>' + (action || '') + '</div>';
  };
  MR.skeleton = function (rows) {
    var h = '<div class="page" aria-busy="true"><div class="sk sk-title"></div><div class="sk sk-sub"></div><div class="sk-table">';
    for (var i = 0; i < (rows || 8); i++) h += '<div class="sk-row"><span class="sk" style="width:' + (22 + (i * 37) % 30) + '%"></span><span class="sk" style="width:14%"></span><span class="sk" style="width:10%"></span><span class="sk" style="width:12%"></span></div>';
    return h + '</div></div>';
  };
  MR.kv = function (label, value) { return '<div class="kv"><dt>' + esc(label) + '</dt><dd>' + value + '</dd></div>'; };
  MR.money = function (n, opt) { return MR.can('money.view') ? (opt === 'lakh' ? lakh(n) : inr(n)) : '<span class="hidden-money" title="Amounts are hidden for your role">₹ ••••</span>'; };

  /* code splitting: the home bundle loads first; every other view lives in the rest bundle */
  var restP = null;
  MR.loadRest = function () {
    if (MR.restReady) return Promise.resolve();
    if (restP) return restP;
    var list = (window.MR_BOOT && window.MR_BOOT.rest) || ['studio-os.rest.min.js'];
    restP = new Promise(function (res, rej) {
      var left = list.length;
      list.forEach(function (src) {
        var s = document.createElement('script'); s.src = src; s.async = false;
        s.onload = function () { if (--left === 0) { MR.restReady = true; res(); } };
        s.onerror = function () { restP = null; rej(new Error('load ' + src)); };
        document.head.appendChild(s);
      });
    });
    return restP;
  };
  MR.loadGsap = function () {
    if (window.gsap || MR._gs) return; MR._gs = true;
    var s = document.createElement('script'); s.src = '../assets/vendor/gsap.min.js'; document.head.appendChild(s);
  };
  /* the handwriting font is only needed for signatures, so it loads on demand */
  MR.loadHand = function () {
    if (MR._hand) return; MR._hand = true;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap'; document.head.appendChild(l);
  };
  /* photos (seeded paths or data URLs) */
  MR.photoSrc = function (p, thumb) { if (!p) return ''; if (p.indexOf('data:') === 0) return p; return 'photos/' + (thumb ? 't/' : '') + p; };
  MR.downscale = function (file, max, cb) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = function () { cb(null); };
      img.src = r.result;
    };
    r.onerror = function () { cb(null); };
    r.readAsDataURL(file);
  };

  /* ================= v3 helpers: chips, time chips, terms, steppers, inline add, theme ================= */
  function hueOf(str) { var h = 0; str = String(str || ''); for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360; return h; }
  MR.hueOf = hueOf;
  MR.chipClient = function (c, opt) {
    if (!c) return '';
    return '<a class="chip" href="#/client/' + c.id + '" data-act="peek-client" data-id="' + c.id + '" title="' + esc(c.name) + '"><span class="mono" style="--h:' + (c.kind === 'Commercial' ? 212 : hueOf(c.name)) + '">' + esc(initials(c.name)) + '</span><span>' + esc(opt && opt.short ? c.name.split(/ & | /)[0] + (c.name.indexOf(' ') > -1 && c.kind !== 'Commercial' ? ' ' + c.name.split(' ').pop() : '') : c.name) + '</span></a>';
  };
  MR.chipProject = function (p, label) {
    if (!p) return '';
    return '<a class="chip" href="#/project/' + p.id + '" title="' + esc(p.name) + '">' + (p.cover ? '<img src="' + MR.photoSrc(p.cover, true) + '" alt="" width="20" height="20" loading="lazy">' : '<span class="mono sq" style="--h:30">' + esc(initials(p.name)) + '</span>') + '<span>' + esc(label || p.name.split(',')[0]) + '</span></a>';
  };
  MR.chipQuote = function (q) { return q ? '<a class="chip" href="#/quote/' + q.id + '"><span class="mono sq" style="--h:250">Q</span><span>' + esc(q.no) + ' v' + MR.ver(q).n + '</span></a>' : ''; };
  MR.chipInvoice = function (iv) { return iv ? '<a class="chip" href="#/invoice/' + iv.id + '"><span class="mono sq" style="--h:150">₹</span><span>' + esc(iv.no.split('/').pop()) + '</span></a>' : ''; };
  MR.chipUser = function (id) { var u2 = MR.userById(id); return '<span class="chip plain">' + MR.avatar(id) + '<span>' + esc(u2.name.split(' ')[0]) + '</span></span>'; };
  MR.tchip = function (text, tone, icon) { return '<span class="tchip' + (tone ? ' t-' + tone : '') + '">' + (icon ? ic(icon) : '') + esc(text) + '</span>'; };
  MR.dueChip = function (date) {
    var d = diffD(today(), date);
    if (d < 0) return MR.tchip('overdue ' + (-d) + ' day' + (d === -1 ? '' : 's'), 'bad', 'clock');
    if (d === 0) return MR.tchip('due today', 'warn', 'clock');
    if (d <= 3) return MR.tchip('due in ' + d + ' day' + (d === 1 ? '' : 's'), 'warn', 'clock');
    return MR.tchip('due ' + fshort(date), 'info', 'clock');
  };
  MR.agoChip = function (ts, verb, tone) { return MR.tchip((verb ? verb + ' ' : '') + rel(ts), tone || '', 'clock'); };
  var GLOSS = {
    'BOQ': 'Bill of quantities: every item with its quantity, unit and rate, grouped by room.',
    'GST': 'Goods and Services Tax. Interiors work is a works contract, taxed at 18%.',
    'CGST + SGST': 'Site in Haryana, same state as the studio: 18% GST splits into 9% central (CGST) and 9% state (SGST).',
    'IGST': 'Site in another state (Delhi or UP): the full 18% is integrated GST (IGST).',
    'TDS': 'Tax deducted at source. Business clients deduct 2% under section 194C and pay it to the tax department for us.',
    'UTR': 'Unique transaction reference: the bank’s ID for a NEFT, RTGS or IMPS transfer. It lets accounts match the money.',
    'Retention': 'The last 5% that clients hold back until handover and snags are closed.',
    'Wastage': 'Extra material allowed for cutting and breakage, e.g. 8% on flooring.',
    'Margin': 'Gross margin: what is left of the price after material and labour cost. Studio policy is at least 22%.',
    'Change order': 'Any work outside the signed quote. The client approves it before it starts, and it is billed separately.',
    'Snag': 'A defect found on site, tracked until it is fixed and photographed.'
  };
  MR.GLOSSARY = GLOSS;
  MR.term = function (word, label) { var t = GLOSS[word]; return t ? '<abbr class="term" tabindex="0" data-tip="' + esc(t) + '" title="">' + esc(label || word) + '</abbr>' : esc(label || word); };
  MR.stepper = function (steps, cur, label) {
    return '<ol class="sstep" aria-label="' + esc(label || 'Progress') + '">' + steps.map(function (s, i) { var st = i < cur ? 'done' : i === cur ? 'cur' : ''; return '<li class="' + st + '"' + (i === cur ? ' aria-current="step"' : '') + '><i aria-hidden="true">' + (i < cur ? '✓' : i + 1) + '</i>' + esc(s) + '</li>'; }).join('') + '</ol>';
  };
  // "+ Add GSTIN": fill a gap in place. entity: client | project
  MR.addIn = function (entity, id, key, label, ph) {
    return '<button type="button" class="add-in" data-act="add-in" data-e="' + entity + '" data-id="' + id + '" data-k="' + key + '" data-ph="' + esc(ph || '') + '">+ Add ' + esc(label) + '</button>';
  };
  MR.val = function (entity, obj, key, label, ph) { var v = obj[key]; return v ? esc(v) : MR.addIn(entity, obj.id, key, label, ph); };
  MR.empty = function (icon, title, body, action) {
    return '<div class="empty"><svg class="empty-ill" viewBox="0 0 120 88" fill="none" stroke-width="1.2" aria-hidden="true"><rect class="p2" x="30" y="10" width="62" height="70" rx="6" transform="rotate(-6 61 45)"/><rect class="p1" x="28" y="8" width="62" height="70" rx="6"/><path class="ln" d="M38 24h30M38 33h42M38 42h24"/><circle class="ac" cx="84" cy="62" r="15"/><g transform="translate(76 54)" stroke="var(--brand)" stroke-linecap="round" stroke-linejoin="round"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" style="color:var(--brand)">' + (IC[icon] || IC.check) + '</svg></g></svg><h3>' + esc(title) + '</h3><p>' + body + '</p>' + (action || '') + '</div>';
  };
  MR.applyTheme = function () { var t = MR.prefs.theme || 'light'; document.documentElement.setAttribute('data-theme', t); var m = document.querySelector('meta[name=theme-color]'); if (m) m.content = t === 'dark' ? '#131211' : '#EEF0EC'; };
})();
