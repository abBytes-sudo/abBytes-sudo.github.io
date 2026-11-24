/* Sthira · client portal. Sign-in, then an app shell for the client: overview with the live 3D model at today's progress,
   weekly site updates (including the ones the back office publishes), stage payments, snags, change-order approvals,
   documents and messages. State lives in 'sthira:portal', which the back office reads and writes too. */
(function () {
  'use strict';
  var D = window.STHIRA, A = window.App, $ = A.$, $$ = A.$$, esc = A.esc, inr = D.inr, L = D.LIVE, NOW = A.NOW, DAY = 864e5;
  var IC = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>', photo: '<rect x="3" y="5" width="18" height="14"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>',
    stamp: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>', rupee: '<path d="M7 4h10M7 9h10M8 4c7 0 7 9 0 9h-1l8 8"/>', flag: '<path d="M5 21V4h12l-2 4 2 4H5"/>',
    doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/>', chat: '<path d="M4 5h16v11H9l-5 4z"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>', undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>', alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/>',
    'arrow-r': '<path d="M5 12h14M13 6l6 6-6 6"/>', send: '<path d="M4 12l16-8-6 16-2-7z"/>', plus: '<path d="M12 5v14M5 12h14"/>', cube: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/>',
    cal: '<rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 3v4M16 3v4"/>', logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
    bank: '<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>', phone: '<rect x="7" y="2" width="10" height="20"/><path d="M11 18h2"/>', cheque: '<rect x="2" y="6" width="20" height="12"/><path d="M6 14h7M15 11h3"/>', upi: '<path d="M7 4l6 8-6 8M13 4l6 8-6 8"/>'
  };
  function ic(n, c) { return '<svg class="i' + (c ? ' ' + c : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">' + (IC[n] || '') + '</svg>'; }
  function clean(s) { return String(s == null ? '' : s).replace(/,?\s*\bdemo\b/gi, '').trim(); }
  function hm(d) { d = new Date(d); var h = d.getHours(), m = d.getMinutes(); return ((h % 12) || 12) + (m ? ':' + String(m).padStart(2, '0') : '') + (h < 12 ? ' am' : ' pm'); }

  /* ───────── state (shared with the back office) ───────── */
  var S;
  function load() {
    S = A.store.get('portal', {}) || {};
    ['paid', 'snagStatus', 'co', 'seenStaff', 'recon', 'coAck', 'coAt', 'paidAt', 'payBy'].forEach(function (k) { S[k] = S[k] || {}; });
    ['snags', 'msgs', 'updates', 'log'].forEach(function (k) { S[k] = S[k] || []; });
    if (!S.v2) { // first open: one snag and one question the Raos raised over the weekend
      if (!S.snags.some(function (s) { return s.id === 'S-119'; })) S.snags.unshift({ id: 'S-119', title: 'Hairline crack in the plaster trial above the kitchen window', where: 'Ground floor · kitchen', trade: 'Masonry', by: 'Ananya Rao', date: '2026-11-23T19:40', at: '2026-11-23T19:40', status: 'open', detail: 'About 30 cm long, from the window corner upwards.', photo: 'kitchen-crack.jpg', mine: true });
      if (!S.msgs.some(function (m) { return m.at === '2026-11-23T21:10'; })) S.msgs.push({ from: 'Vikram Rao', role: 'Client', at: '2026-11-23T21:10', text: 'Can Karthik also show us the terrace waterproofing on Saturday? My father wants to see the root barrier.' });
      S.v2 = 1; save();
    }
  }
  function save() { A.store.set('portal', S); }
  function stamp() { S.tick = (S.tick || 0) + 1; return new Date(NOW.getTime() + Math.min(S.tick, 90) * 1000).toISOString(); }
  function logP(text) { S.log.push({ at: stamp(), who: 'Ananya Rao', text: text }); }
  function weeks() { return S.updates.filter(function (u) { return !u.code || u.code === 'STH-2611'; }).concat(D.WEEKS).sort(function (a, b) { return b.day - a.day || new Date(b.date) - new Date(a.date); }); }
  function latest() { return weeks()[0]; }
  function today() { var u = latest(); return Math.max(L.day, u.by ? u.day : 0); }
  function stages() { var u = weeks().filter(function (x) { return x.stages; })[0]; return u ? u.stages : { foundation: 100, columns: 100, slabs: 100, walls: L.stagePct, glazing: 0, landscape: 0 }; }
  function payStatus(m) { return S.paid[m.n] ? 'paid' : m.status; }
  function snags() { return S.snags.concat(D.SNAGS).map(function (s) { return Object.assign({}, s, { status: S.snagStatus[s.id] || s.status, fix: clean(s.fix) }); }); }
  function coStatus(c) { return S.co[c.id] || c.status; }
  function pendingCO() { return D.CHANGES.filter(function (c) { return coStatus(c) === 'pending'; }); }
  function dueM() { return D.PAYMENTS.filter(function (m) { return payStatus(m) === 'due'; }); }
  function credit() { return coStatus(D.CHANGES.filter(function (c) { return c.id === 'CO-06'; })[0]) === 'approved' ? 42000 : 0; }
  function msgs() { return D.MESSAGES.concat(S.msgs).sort(function (a, b) { return new Date(a.at) - new Date(b.at); }); }
  function unreadMsgs() { var seen = S.seenMsgs || '2026-11-22T09:05'; return S.msgs.filter(function (m) { return m.role !== 'Client' && m.at > seen; }).length; }
  function newWeek() { var u = latest(); return !S.seenWeek || S.seenWeek < u.w; }

  /* ───────── kit: toast, modal, menu ───────── */
  function toast(msg, o) {
    o = o || {}; var box = $('#toasts'), t = document.createElement('div'); t.className = 'tst' + (o.bad ? ' bad' : ''); t.setAttribute('role', 'status');
    t.innerHTML = ic(o.icon || (o.bad ? 'alert' : 'check')) + '<span class="tst-m">' + msg + '</span>' + (o.undo ? '<button type="button" data-u>' + ic('undo') + 'Undo</button>' : '');
    box.appendChild(t); var gone = false; function kill() { if (gone) return; gone = true; t.classList.add('out'); setTimeout(function () { t.remove(); }, 220); }
    if (o.undo) $('[data-u]', t).addEventListener('click', function () { o.undo(); kill(); });
    setTimeout(kill, o.undo ? 7000 : 4200);
  }
  function modal(o) {
    var d = document.createElement('dialog'); d.className = 'md ' + (o.size || ''); d.setAttribute('aria-labelledby', 'mdT');
    d.innerHTML = '<div class="md-h"><div><h2 id="mdT">' + o.title + '</h2>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div><button class="ib" type="button" data-close aria-label="Close">' + ic('x') + '</button></div><div class="md-b">' + o.body + '</div>' + (o.foot || '');
    document.body.appendChild(d); d.showModal(); d.addEventListener('close', function () { d.remove(); });
    d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
    if (o.onOpen) o.onOpen(d); return d;
  }
  function menu(anchor, items) {
    var old = $('.pop'); if (old) { old.remove(); return; }
    var p = document.createElement('div'); p.className = 'pop'; p.setAttribute('role', 'menu');
    p.innerHTML = items.map(function (it, i) { return it.head ? '<p class="pop-h">' + it.head + '</p>' : '<button type="button" class="pop-i" role="menuitem" data-i="' + i + '">' + (it.icon ? ic(it.icon) : '') + '<span>' + it.label + '</span>' + (it.meta ? '<small>' + it.meta + '</small>' : '') + '</button>'; }).join('');
    document.body.appendChild(p); var r = anchor.getBoundingClientRect(); p.style.top = (r.bottom + 4) + 'px'; p.style.left = Math.max(8, Math.min(innerWidth - p.offsetWidth - 8, r.right - p.offsetWidth)) + 'px';
    function close() { p.remove(); document.removeEventListener('mousedown', out, true); document.removeEventListener('keydown', key, true); }
    function out(e) { if (!p.contains(e.target) && !anchor.contains(e.target)) close(); }
    function key(e) { if (e.key === 'Escape') { close(); anchor.focus(); } }
    document.addEventListener('mousedown', out, true); document.addEventListener('keydown', key, true);
    p.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (!b) return; close(); items[+b.getAttribute('data-i')].run(); });
    setTimeout(function () { var f = $('.pop-i', p); if (f) f.focus(); }, 10);
  }

  /* ───────── sign in ───────── */
  var app = $('#app'), lg = $('#login'), lf = $('#lgF');
  function enter(first) {
    lg.hidden = true; app.hidden = false; A.store.set('portal-session', true); load(); buildNav();
    if (first) toast('Signed in to <b>Rao Residence</b>. ' + (newWeek() ? 'Week ' + latest().w + ' is new since your last visit.' : 'You’re up to date.'), { icon: 'home' });
    route();
  }
  lf.addEventListener('submit', function (e) {
    e.preventDefault(); var code = $('#lgCode').value.trim().toUpperCase(), pin = $('#lgPin').value.trim(), err = $('#lgE');
    err.textContent = '';
    if (code !== 'STH-2611') { err.textContent = code ? 'We can’t find project ' + code + '. It’s printed on page 1 of your contract letter, like STH-2611.' : 'Enter the project code from your contract letter.'; return $('#lgCode').focus(); }
    if (!/^\d{4,6}$/.test(pin)) { err.textContent = 'The PIN is 4 to 6 digits.'; return $('#lgPin').focus(); }
    var b = $('#lgGo'); b.disabled = true; b.firstChild.textContent = 'Opening your project…';
    setTimeout(function () { b.disabled = false; b.firstChild.textContent = 'Open my project'; enter(true); }, A.reduce ? 0 : 550);
  });

  /* ───────── shell ───────── */
  var NAV = [['overview', 'Overview', 'home'], ['updates', 'Site updates', 'photo'], ['approvals', 'Approvals', 'stamp'], ['payments', 'Payments', 'rupee'], ['snags', 'Snags', 'flag'], ['documents', 'Documents', 'doc'], ['messages', 'Messages', 'chat']];
  var TABS = ['overview', 'updates', 'approvals', 'payments'];
  function badge(k) {
    if (k === 'updates') return newWeek() ? ['New', 'blue'] : null;
    if (k === 'approvals') { var n = pendingCO().length; return n ? [n, 'blue'] : null; }
    if (k === 'payments') { var d = dueM().length; return d ? ['Due', 'red'] : null; }
    if (k === 'snags') { var o = snags().filter(function (s) { return s.status !== 'fixed'; }).length; return o ? [o, ''] : null; }
    if (k === 'messages') { var u = unreadMsgs(); return u ? [u, 'blue'] : null; }
    return null;
  }
  function buildNav() {
    $('#paNav').innerHTML = '<p class="nv-h">Your project</p>' + NAV.map(function (n) { var b = badge(n[0]); return '<a class="nv" href="#' + n[0] + '" data-nav="' + n[0] + '">' + ic(n[2]) + '<span>' + n[1] + '</span>' + (b ? '<span class="ct pbg ' + b[1] + '">' + b[0] + '</span>' : '') + '</a>'; }).join('') +
      '<div class="pa-team"><p class="nv-h">Your site team</p>' + [['Farah Siddiqui', 'Project manager'], ['Karthik Gowda', 'Site engineer'], ['Meera Pillai', 'Architect']].map(function (p) { return '<div class="pa-p"><span class="av sm" aria-hidden="true">' + p[0].split(' ').map(function (w) { return w[0]; }).join('') + '</span><span><b>' + p[0] + '</b><small>' + p[1] + '</small></span></div>'; }).join('') + '<a class="side-l" href="#messages">' + ic('chat') + 'Message the team</a></div>';
    $('#paTabs').innerHTML = TABS.map(function (k) { var n = NAV.filter(function (x) { return x[0] === k; })[0], b = badge(k); return '<a class="tab" href="#' + k + '" data-nav="' + k + '">' + ic(n[2]) + '<span>' + (k === 'overview' ? 'Home' : k === 'updates' ? 'Updates' : n[1]) + '</span>' + (b ? '<i class="tb-ct ' + (b[1] === 'red' ? 'hot-red' : b[1] === 'blue' ? 'hot-blue' : '') + '">' + (typeof b[0] === 'number' ? b[0] : '•') + '</i>' : '') + '</a>'; }).join('') + '<button type="button" class="tab" id="paMoreB" aria-expanded="false" aria-controls="paMore">' + ic('menu') + '<span>More</span>' + (badge('messages') || badge('snags') ? '<i class="tb-ct hot-blue">•</i>' : '') + '</button>';
    $('#paDay').textContent = 'STH-2611 · day ' + today() + ' of ' + L.total;
    $('#paMoreB').addEventListener('click', function () { var m = $('#paMore'), on = m.hidden; m.hidden = !on; this.setAttribute('aria-expanded', on); if (on) m.innerHTML = '<div class="more-in"><p class="nv-h">More</p>' + NAV.slice(4).map(function (n) { var b = badge(n[0]); return '<a class="nv" href="#' + n[0] + '">' + ic(n[2]) + '<span>' + n[1] + '</span>' + (b ? '<span class="ct pbg ' + b[1] + '">' + b[0] + '</span>' : '') + '</a>'; }).join('') + '<button type="button" class="nv" data-x="out">' + ic('logout') + '<span>Sign out</span></button></div>'; });
    navState();
  }
  function navState() { var k = cur(); $$('[data-nav]').forEach(function (a) { if (a.getAttribute('data-nav') === k) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); var mb = $('#paMoreB'); if (mb) mb.classList.toggle('on', TABS.indexOf(k) < 0); }
  function cur() { var h = location.hash.replace('#', ''); return NAV.some(function (n) { return n[0] === h; }) ? h : 'overview'; }
  $('#paMore').addEventListener('click', function (e) { if (e.target === this || e.target.closest('a')) { this.hidden = true; $('#paMoreB').setAttribute('aria-expanded', 'false'); } if (e.target.closest('[data-x="out"]')) signOut(); });
  $('#paMe').addEventListener('click', function () { menu(this, [{ head: 'Ananya Rao · Rao Residence' }, { label: 'Message the site team', icon: 'chat', run: function () { location.hash = 'messages'; } }, { label: 'Public site', icon: 'ext', run: function () { location.href = 'index.html'; } }, { label: 'Sign out', icon: 'logout', run: signOut }]); });
  function signOut() { A.store.del('portal-session'); location.hash = ''; location.reload(); }
  addEventListener('hashchange', function () { if (!app.hidden) route(); });
  addEventListener('storage', function (e) { if (e.key === 'sthira:portal' && !app.hidden && !document.querySelector('dialog[open]')) { load(); buildNav(); route(true); toast('New from your site team.', { icon: 'chat' }); } });

  var VIEWS = {}, view = $('#pv');
  function route(keep) {
    var k = cur(), y = scrollY; if (!keep) $$('dialog[open]').forEach(function (d) { d.close(); }); navState(); $('#paMore').hidden = true;
    if (k === 'updates' && newWeek()) { S.seenWeek = latest().w; save(); setTimeout(buildNav, 0); }
    if (k === 'messages' && unreadMsgs()) { S.seenMsgs = msgs()[msgs().length - 1].at; save(); setTimeout(buildNav, 0); }
    document.title = NAV.filter(function (n) { return n[0] === k; })[0][1] + ' · Rao Residence · Sthira client portal';
    view.innerHTML = VIEWS[k](); view.classList.remove('vin'); void view.offsetWidth; view.classList.add('vin');
    if (k === 'overview') mount3D();
    if (k === 'messages') { var th = $('.thr'); if (th) th.scrollTop = th.scrollHeight; }
    if (keep) scrollTo(0, y); else { scrollTo(0, 0); try { view.focus({ preventScroll: true }); } catch (e) {} }
  }
  function refresh() { buildNav(); route(true); }

  /* ───────── overview ───────── */
  var KEYS = ['foundation', 'columns', 'slabs', 'walls', 'glazing', 'landscape'], STN = {}; D.STAGES.forEach(function (s) { STN[s.key] = s; });
  function needs() {
    var N = [];
    dueM().forEach(function (m) { N.push({ ic: 'rupee', t: 'Milestone ' + m.n + ' is due ' + A.date(m.date), why: m.name + ' · signed off by Karthik on 22 Nov', a: 'Pay ' + inr(L.value * m.pct / 100 - credit()), href: '#payments', act: 'pay', n: m.n, red: true }); });
    pendingCO().forEach(function (c) { N.push({ ic: 'stamp', t: c.id + ' needs your yes or no', why: c.title + ' · ' + (c.amount >= 0 ? '+' : '−') + inr(Math.abs(c.amount)), a: 'Review', href: '#approvals' }); });
    snags().filter(function (s) { return s.id === 'S-117' && s.status === 'open'; }).forEach(function (s) { N.push({ ic: 'flag', t: 'Choose a floor trap for bath B3', why: s.title, a: 'See options', href: '#snags' }); });
    return N;
  }
  function stageTrack() {
    var st = stages(), d = today();
    return '<ol class="trk" aria-label="Stages">' + KEYS.map(function (k, i) { var v = st[k] || 0, s = STN[k]; return '<li class="' + (v >= 100 ? 'done' : v > 0 ? 'cur' : '') + '" style="flex:' + Math.max(48, s.day[1] - s.day[0] + 1) + '"><span class="trk-b"><i style="width:' + v + '%"></i></span><span class="trk-n"><span class="bub">' + (v >= 100 ? '✓' : '0' + (i + 1)) + '</span><b>' + esc(s.name.replace(' & ', ' and ').replace(' and handover', '')) + '</b></span><span class="mono">' + (v >= 100 ? 'Done' : v ? v + '%' : 'Day ' + s.day[0]) + '</span></li>'; }).join('') + '</ol><p class="trk-d"><span>Day 1 · 7 Jun</span><span class="trk-now" style="left:' + (d / L.total * 100).toFixed(1) + '%">Today · day ' + d + '</span><span>Day ' + L.total + ' · 23 Apr</span></p>';
  }
  function weekCard(u, opt) {
    opt = opt || {}; var ph = (u.photos && u.photos.length ? u.photos : [u.photo]).filter(Boolean);
    var src = function (p, big) { return String(p).indexOf('data:') === 0 ? p : 'photos/' + p + (big ? '-m' : '-s') + '.jpg'; };
    return '<article class="wk' + (opt.big ? ' big' : '') + '"><div class="wk-ph">' + ph.slice(0, 4).map(function (p, i) { return '<button type="button" class="wk-pb" data-lb="' + esc(String(p).indexOf('data:') === 0 ? p : p) + '" data-cap="' + esc('Week ' + u.w + ' · ' + u.title) + '" aria-label="Enlarge photo ' + (i + 1) + ' of week ' + u.w + '"><img src="' + src(p, i === 0 && opt.big) + '" alt="' + esc('Week ' + u.w + ': ' + u.title + (i ? ', photo ' + (i + 1) : '')) + '" loading="lazy" decoding="async" width="720" height="540"></button>'; }).join('') + (ph.length > 4 ? '<span class="more-ph">+' + (ph.length - 4) + '</span>' : '') + '</div><div class="wk-b"><p class="wk-m"><span>Week ' + u.w + '</span><span>' + A.date(u.date) + '</span><span>Day ' + u.day + '</span><span>' + (u.crew || '—') + ' on site</span><span>' + esc(u.weather || '') + '</span>' + (u.by ? '<span class="tg blue sm">New · ' + esc(u.by.split(' ')[0]) + '</span>' : '') + '</p><h3>' + esc(u.title) + '</h3>' + (u.note ? '<p class="wk-n">' + esc(u.note) + '</p>' : '') + '<div class="wk-c"><div><p class="k">Done this week</p><ul>' + (u.done || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' + ((u.next || []).length ? '<div><p class="k">Next week</p><ul>' + u.next.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' : '') + '</div></div></article>';
  }
  VIEWS.overview = function () {
    var h = NOW.getHours(), d = today(), st = stages(), N = needs(), paid = D.PAYMENTS.filter(function (m) { return payStatus(m) === 'paid'; }).reduce(function (a, m) { return a + m.pct; }, 0), open = snags().filter(function (s) { return s.status !== 'fixed'; }).length;
    var next = [['26', 'Nov', 'Third-floor blockwork starts', 'Thursday · Karthik on site'], ['27', 'Nov', 'Week ' + (latest().w + 1) + ' report', 'Friday by 6 pm, here'], ['28', 'Nov', 'Balcony railing walk-through', 'Saturday 11 am · bring Vikram'], ['30', 'Nov', dueM().length ? 'Milestone 8 due' : 'No payment due', dueM().length ? inr(L.value * 0.04 - credit()) + ' after the CO-06 credit' : 'Next: milestone 9, 14 Dec'], ['07', 'Dec', 'Plumbing sleeves, terrace', 'Water off on site, 9 to 1']];
    return '<div class="hello"><p><b>Good ' + (h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening') + ', Ananya.</b> <span>Day ' + d + ' of ' + L.total + ' · walls at ' + st.walls + '% · on schedule for handover on 23 Apr 2027</span></p></div>' +
      (N.length ? '<div class="focus1"><p class="k">Needs you · ' + N.length + '</p><h2>' + esc(N[0].t) + '</h2><p>' + esc(N[0].why) + '</p><a class="b pri lg" href="' + N[0].href + '">' + esc(N[0].a) + ic('arrow-r') + '</a></div>' : '') +
      '<div class="ov-g"><section class="cd ov-m"><div class="m3"><canvas id="pc" role="img" aria-label="A 3D model of the Rao Residence as built on day ' + d + ': frame complete, walls rising on the second and third floors. Drag to turn it."></canvas><img class="m3-fb" id="m3fb" src="photos/ba-rao-a-s.jpg" alt="The Rao Residence frame on site" hidden><span class="m3-tag tg blue">' + ic('cube') + 'Live model · day ' + d + '</span><span class="m3-hint" id="m3h">Drag to turn</span><dl class="m3-tb"><div class="w"><dt>Project</dt><dd>Rao Residence</dd></div><div><dt>Code</dt><dd>STH-2611</dd></div><div><dt>Day</dt><dd>' + d + ' / ' + L.total + '</dd></div><div><dt>Walls</dt><dd>' + st.walls + '%</dd></div><div><dt>Scale</dt><dd>NTS</dd></div></dl></div><div class="cd-b">' + stageTrack() + '</div></section>' +
      '<div class="ov-r"><section class="cd"><div class="cd-h"><h2>Needs you</h2><span class="meta' + (N.length ? ' red' : '') + '">' + N.length + '</span></div>' + (N.length ? '<ul class="att">' + N.map(function (x) { return '<li><a class="att-r" href="' + x.href + '"><span class="att-i' + (x.red ? ' red' : '') + '">' + ic(x.ic) + '</span><span class="att-b"><b>' + esc(x.t) + '</b><small>' + esc(x.why) + '</small></span><span class="b sm' + (x.red ? ' pri' : '') + ' att-a show">' + esc(x.a) + '</span></a></li>'; }).join('') + '</ul>' : '<p class="none">Nothing waiting on you. We’ll post the next update on Friday.</p>') + '</section>' +
      '<section class="cd"><dl class="kq"><div><dt>Programme</dt><dd>' + Math.round(d / L.total * 100) + '%</dd><small>day ' + d + ' of ' + L.total + '</small></div><div><dt>Handover</dt><dd>23 Apr</dd><small>2027 · on track</small></div><div><dt>Paid</dt><dd>' + inr(L.value * paid / 100) + '</dd><small>' + paid + '% of ' + inr(L.value) + '</small></div><div><dt>Open snags</dt><dd>' + open + '</dd><small>of ' + snags().length + ' logged</small></div></dl></section>' +
      '<section class="cd"><div class="cd-h"><h2>Coming up</h2><span class="meta">Next 14 days</span></div><ul class="nxt">' + next.map(function (x) { return '<li><span class="nxt-d"><b>' + x[0] + '</b>' + x[1] + '</span><span><b>' + esc(x[2]) + '</b><small>' + esc(x[3]) + '</small></span></li>'; }).join('') + '</ul></section></div></div>' +
      '<section class="cd" style="margin-top:14px"><div class="cd-h"><h2>Latest from site</h2><a class="lnk" href="#updates">All ' + weeks().length + ' weeks</a></div>' + weekCard(latest(), { big: true }) + '</section>';
  };
  var api3 = null;
  function mount3D() {
    var cv = $('#pc'); if (!cv) return; api3 = null;
    var ok = (function () { try { var c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
    function fb() { var f = $('#m3fb'); if (f) f.hidden = false; var hh = $('#m3h'); if (hh) hh.hidden = true; if (cv) cv.hidden = true; }
    if (!ok) return fb();
    function go() { try { api3 = window.Sthira3D.mount(cv, { progress: D.pAt(today()), orbit: 'drag', parallax: false, noIntro: true, config: { label: 'PLOT 14' } }); } catch (e) { fb(); } }
    if (window.Sthira3D) return go();
    var s = document.createElement('script'); s.src = '../assets/build-sthira3d.js?v=6'; s.onload = go; s.onerror = fb; document.head.appendChild(s);
  }

  /* ───────── updates ───────── */
  VIEWS.updates = function () { var W = weeks(); return '<div class="vh-row"><h1>Site updates</h1><p class="meta">Every Friday by 6 pm · photos from the same camera points each week · ' + W.length + ' so far</p></div><section class="cd">' + W.map(function (u, i) { return weekCard(u, { big: i === 0 }); }).join('') + '</section>'; };

  /* ───────── payments ───────── */
  VIEWS.payments = function () {
    var paidAmt = 0, dueAmt = 0, cr = credit();
    var seg = D.PAYMENTS.map(function (m) { var st = payStatus(m), a = L.value * m.pct / 100; if (st === 'paid') paidAmt += a; if (st === 'due') dueAmt += a; return '<i class="ps-' + st + '" style="flex:' + m.pct + '" title="' + esc(m.n + '. ' + m.name) + '"></i>'; }).join('');
    return '<div class="vh-row"><h1>Payments</h1><p class="meta">Thirteen stage payments, each released only when its stage is signed off on site</p></div>' +
      '<section class="cd"><div class="cd-b"><div class="pay-s"><div><p class="kq-l">Paid</p><p class="pay-v">' + inr(paidAmt) + '</p></div><div><p class="kq-l">Due now</p><p class="pay-v ' + (dueAmt ? 'red' : '') + '">' + (dueAmt ? inr(dueAmt - cr) : '₹0') + '</p></div><div><p class="kq-l">Contract</p><p class="pay-v">' + inr(L.value) + '</p></div></div><div class="paybar" aria-hidden="true">' + seg + '</div><p class="pay-l"><span class="ps-paid">Paid</span><span class="ps-due">Due</span><span class="ps-upcoming">Upcoming</span></p></div></section>' +
      '<section class="cd"><div class="tw"><table class="tbl pay"><thead><tr><th>#</th><th>Milestone</th><th class="num">Amount</th><th>Date</th><th class="act">Status</th></tr></thead><tbody>' + D.PAYMENTS.map(function (m) {
        var st = payStatus(m), a = L.value * m.pct / 100, cell = st === 'paid' ? '<span class="tg ok">' + ic('check') + 'Paid' + (S.paid[m.n] ? ' · ' + esc(S.paid[m.n]) : '') + '</span>' : st === 'due' ? '<button type="button" class="b pri sm" data-pay="' + m.n + '">Pay ' + inr(a - cr) + '</button>' : '<span class="tg faint">Upcoming</span>';
        return '<tr class="' + (st === 'due' ? 'due-r' : '') + '"><td class="mono">' + String(m.n).padStart(2, '0') + '</td><td>' + esc(m.name) + '<small>' + m.pct + '% of the contract</small></td><td class="num">' + inr(a, 'full') + '</td><td>' + A.date(m.date) + (m.date.slice(0, 4) !== '2026' ? '' : '') + '</td><td class="act">' + cell + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
  };
  function payFlow(n) {
    var m = D.PAYMENTS.filter(function (x) { return x.n === n; })[0], a = L.value * m.pct / 100, cr = credit(), tot = a - cr;
    var M = [['UPI', 'upi', 'Any UPI app on your phone'], ['Net banking', 'bank', 'Opens your bank’s own page'], ['Bank transfer', 'bank', 'NEFT or RTGS to our escrow account'], ['Cheque', 'cheque', 'Hand it to Karthik on site']];
    var d = modal({ title: 'Pay milestone ' + m.n, sub: esc(m.name) + ' · signed off by Karthik Gowda on 22 Nov', body:
      '<dl class="kvg"><div><dt>Milestone</dt><dd>' + inr(a, 'full') + '</dd></div>' + (cr ? '<div><dt>Credit CO-06</dt><dd>−' + inr(cr, 'full') + '</dd></div>' : '') + '<div><dt>To pay</dt><dd><b>' + inr(tot, 'full') + '</b></dd></div></dl>' +
      '<fieldset class="pm"><legend>How would you like to pay?</legend>' + M.map(function (x, i) { return '<label class="pm-o"><input type="radio" name="pm" value="' + x[0] + '"' + (i ? '' : ' checked') + '><span>' + ic(x[1]) + '<b>' + x[0] + '</b><small>' + x[2] + '</small></span></label>'; }).join('') + '</fieldset>' +
      '<button type="button" class="b pri lg full" id="payGo">Pay ' + inr(tot, 'full') + '</button><p class="pay-note">Portfolio project: no payment is taken.</p>', size: 'pay' });
    $('#payGo', d).addEventListener('click', function () {
      var b = this, by = ($('input[name=pm]:checked', d) || {}).value || 'UPI'; b.disabled = true; b.textContent = 'Confirming…';
      setTimeout(function () {
        var ref = 'RCPT-2611-' + String(m.n).padStart(2, '0') + String(140 + Object.keys(S.paid).length);
        S.paid[m.n] = ref; S.paidAt[m.n] = stamp(); S.payBy[m.n] = by; logP('paid milestone ' + m.n + ' (' + inr(tot) + ') by ' + by); save();
        $('.md-b', d).innerHTML = '<div class="paid-ok">' + ic('stamp') + '<h3>Payment recorded</h3><p>Receipt <b>' + ref + '</b> · ' + inr(tot, 'full') + ' by ' + esc(by) + '. It’s in Documents, and Farah has been told.</p><button type="button" class="b" data-close>Done</button></div>';
        refresh();
      }, A.reduce ? 0 : 700);
    });
  }

  /* ───────── approvals ───────── */
  VIEWS.approvals = function () {
    var net = 0, pend = 0; D.CHANGES.forEach(function (c) { var s = coStatus(c); if (s === 'approved') net += c.amount; if (s === 'pending') pend++; });
    return '<div class="vh-row"><h1>Approvals</h1><p class="meta">Change orders need your yes before any work starts · ' + pend + ' waiting · approved so far ' + (net >= 0 ? '+' : '−') + inr(Math.abs(net)) + '</p></div>' +
      '<div class="cos">' + D.CHANGES.map(function (c) { var s = coStatus(c);
        return '<article class="cd co' + (s === 'pending' ? ' pend' : '') + '"><div class="co-h"><span class="mono">' + c.id + '</span><span class="tg ' + (s === 'approved' ? 'ok' : s === 'pending' ? 'blue' : 'faint') + '">' + (s === 'pending' ? 'Waiting for you' : s === 'approved' ? 'Approved' : 'Declined') + '</span></div><h3>' + esc(c.title) + '</h3><p>' + esc(c.note) + '</p><dl class="co-f"><div><dt>Price</dt><dd class="' + (c.amount < 0 ? 'ok-t' : '') + '">' + (c.amount >= 0 ? '+' : '−') + inr(Math.abs(c.amount), 'full') + '</dd></div><div><dt>Programme</dt><dd>' + (c.days ? '+' + c.days + ' days' : 'No change') + '</dd></div></dl>' +
          (s === 'pending' ? '<div class="co-a"><button type="button" class="b pri" data-co="' + c.id + '" data-v="approved">' + ic('check') + 'Approve ' + (c.amount >= 0 ? '+' : '−') + inr(Math.abs(c.amount)) + '</button><button type="button" class="b" data-co="' + c.id + '" data-v="declined">Decline</button></div>' : S.co[c.id] ? '<p class="co-n">You ' + s + ' this ' + (S.coAck[c.id] ? '· Farah has scheduled it' : 'just now') + ' · <button type="button" class="lnk" data-undo-co="' + c.id + '">Change my answer</button></p>' : '<p class="co-n">' + esc(c.note.indexOf('Approved') === 0 ? c.note : 'Decided earlier') + '</p>') + '</article>'; }).join('') + '</div>';
  };

  /* ───────── snags ───────── */
  var snF = 'open';
  VIEWS.snags = function () {
    var all = snags(), c = { open: 0, review: 0, fixed: 0 }; all.forEach(function (s) { c[s.status === 'fixed' ? 'fixed' : s.status === 'review' ? 'review' : 'open']++; });
    var list = all.filter(function (s) { return snF === 'all' || s.status === snF; });
    return '<div class="vh-row"><h1>Snags</h1><p class="meta">Anything that isn’t right, logged by you or by us, until it’s closed</p><span class="grow"></span><button type="button" class="b pri" id="snAdd">' + ic('plus') + 'Report a snag</button></div>' +
      '<div class="fbar"><div class="sg" role="group" aria-label="Filter">' + [['open', 'Open'], ['review', 'In review'], ['fixed', 'Fixed'], ['all', 'All']].map(function (f) { return '<button type="button" data-snf="' + f[0] + '" aria-pressed="' + (snF === f[0]) + '">' + f[1] + ' <span class="ct">' + (f[0] === 'all' ? all.length : c[f[0]]) + '</span></button>'; }).join('') + '</div></div>' +
      '<section class="cd">' + (list.length ? '<ul class="pis">' + list.map(function (s) {
        var tg = s.status === 'fixed' ? '<span class="tg ok">Fixed</span>' : s.status === 'review' ? '<span class="tg blue">In review</span>' : '<span class="tg red">Open</span>';
        return '<li class="pi"><span class="att-i' + (s.status === 'open' ? ' red' : '') + '">' + ic('flag') + '</span><div class="pi-b"><b><span class="mono">' + esc(s.id) + '</span> ' + esc(s.title) + '</b><small>' + esc([s.where, s.trade !== 'Not sure' ? s.trade : '', 'raised by ' + s.by + ', ' + A.date(s.at || s.date)].filter(Boolean).join(' · ')) + '</small>' + (s.detail ? '<small>' + esc(s.detail) + '</small>' : '') + (s.photo ? '<small class="mono">' + ic('photo') + esc(s.photo) + '</small>' : '') + (s.fix ? '<p class="fix">' + esc(s.fix) + '</p>' : '') + '</div><span class="pi-a">' + tg + (s.status === 'fixed' ? '<button type="button" class="b ghost sm" data-reopen="' + s.id + '">Reopen</button>' : '') + '</span></li>'; }).join('') + '</ul>'
        : '<div class="emp"><h3>Nothing ' + (snF === 'all' ? 'logged' : snF === 'open' ? 'open' : 'here') + '</h3><p>When you spot something, report it and it lands with Karthik on site.</p></div>') + '</section>';
  };
  function snagForm() {
    var d = modal({ title: 'Report a snag', sub: 'It goes straight to Karthik’s list for his next site walk.', body: '<form id="snF" class="fgrid" novalidate><label class="f2"><span>What’s wrong?</span><input class="in" name="title" required minlength="6" placeholder="Crack in the plaster above the kitchen window"></label><label><span>Where</span><select class="in" name="where"><option value="">Choose a floor</option><option>Ground floor</option><option>First floor</option><option>Second floor</option><option>Third floor</option><option>Roof</option><option>Outside / site</option></select></label><label><span>Trade, if you know</span><select class="in" name="trade"><option>Not sure</option><option>Masonry</option><option>RCC</option><option>Plumbing</option><option>Electrical</option><option>Carpentry</option><option>Design</option></select></label><label class="f2"><span>Details</span><textarea class="in" name="detail" rows="3" placeholder="Room, wall, grid line: anything that helps us find it"></textarea></label><label class="f2 file"><span>Photo (optional)</span><input type="file" name="ph" accept="image/*"></label><p class="ferr f2" id="snE" role="alert"></p></form>',
      foot: '<div class="md-f"><button type="button" class="b" data-close>Cancel</button><button type="button" class="b pri" id="snGo">Log snag</button></div>' });
    setTimeout(function () { $('#snF', d).title.focus(); }, 30);
    $('#snGo', d).addEventListener('click', function () {
      var f = $('#snF', d), t = f.title.value.trim(), e = $('#snE', d);
      if (t.length < 6) { e.textContent = 'Describe it in a few words so Karthik can find it.'; return f.title.focus(); }
      if (!f.where.value) { e.textContent = 'Pick the floor it’s on.'; return f.where.focus(); }
      var id = 'S-' + (120 + S.snags.filter(function (s) { return s.mine; }).length), at = stamp(), ph = f.ph.files && f.ph.files[0];
      S.snags.unshift({ id: id, title: t, where: f.where.value, trade: f.trade.value, detail: f.detail.value.trim(), by: 'Ananya Rao', date: at, at: at, status: 'open', photo: ph ? ph.name : null, mine: true }); logP('reported snag ' + id + ': ' + t); save(); d.close(); snF = 'open'; refresh();
      toast('Snag <b>' + id + '</b> logged. Karthik will look at it on his next walk.', { icon: 'flag', undo: function () { S.snags = S.snags.filter(function (s) { return s.id !== id; }); S.log.pop(); save(); refresh(); } });
    });
  }

  /* ───────── documents ───────── */
  function docs() { return Object.keys(S.paid).map(function (n) { return { name: 'Receipt, milestone ' + n, kind: 'Receipt', size: S.paid[n], date: S.paidAt[n] || NOW.toISOString() }; }).concat(D.DOCS.map(function (x) { return Object.assign({}, x, { name: clean(x.name) }); })); }
  VIEWS.documents = function () {
    return '<div class="vh-row"><h1>Documents</h1><p class="meta">The current revision of every drawing, the contract, test results and your receipts</p></div><section class="cd"><ul class="pis">' + docs().map(function (d, i) { return '<li class="pi"><span class="att-i">' + ic('doc') + '</span><div class="pi-b"><b>' + esc(d.name) + '</b><small>' + esc(d.kind + ' · ' + d.size + ' · ' + A.date(d.date)) + '</small></div><span class="pi-a"><button type="button" class="b sm" data-doc="' + i + '">Preview</button></span></li>'; }).join('') + '</ul></section>';
  };
  function docPreview(d) {
    var dr = d.kind === 'Drawings', cells = ''; if (dr) [80, 226, 373, 520].forEach(function (x) { [70, 220, 370].forEach(function (y) { cells += '<rect x="' + (x - 6) + '" y="' + (y - 6) + '" width="12" height="12" fill="#16202A"/>'; }); });
    modal({ title: esc(d.name), sub: esc(d.kind + ' · ' + d.size), size: 'wide', body: '<svg class="docsvg" viewBox="0 0 800 520" role="img" aria-label="Preview of ' + esc(d.name) + '"><defs><pattern id="g8" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="rgba(31,79,216,.08)"/></pattern></defs><rect width="800" height="520" fill="#F4F6F7"/><rect width="800" height="520" fill="url(#g8)"/><rect x="14" y="14" width="772" height="492" fill="none" stroke="#16202A" stroke-width="1.5"/>' +
      (dr ? '<g stroke="#16202A" fill="none" stroke-width="1.4"><rect x="80" y="70" width="440" height="300"/><path d="M226 50v340M373 50v340M60 220h480" stroke="#1F4FD8" stroke-dasharray="12 4 2 4"/><rect x="420" y="80" width="90" height="120" fill="rgba(22,32,42,.06)"/>' + cells + '<path d="M80 410h440M80 404v12M520 404v12"/></g>' + ['A', 'B', 'C', 'D'].map(function (g, i) { return '<circle cx="' + [80, 226, 373, 520][i] + '" cy="36" r="11" fill="#fff" stroke="#16202A"/><text x="' + [80, 226, 373, 520][i] + '" y="40" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="11">' + g + '</text>'; }).join('') + '<text x="300" y="432" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="12" fill="#16202A">13,400</text><ellipse cx="465" cy="140" rx="70" ry="44" fill="none" stroke="#D2342A" stroke-width="1.6" transform="rotate(-6 465 140)"/><text x="470" y="74" font-family="IBM Plex Mono,monospace" font-size="11" fill="#D2342A">REV F · STAIR CORE</text>'
        : '<g fill="#16202A"><text x="60" y="88" font-family="Mona Sans,sans-serif" font-size="24" font-weight="600">' + esc(d.name) + '</text>' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return '<rect x="60" y="' + (124 + i * 32) + '" width="' + (520 - (i % 3) * 90) + '" height="7" fill="#D5DCE2"/>'; }).join('') + '</g>') +
      '<g font-family="IBM Plex Mono,monospace" font-size="10.5" fill="#16202A"><rect x="556" y="410" width="230" height="96" fill="#fff" stroke="#16202A"/><path d="M556 434h230M556 458h230M556 482h230M671 434v72" stroke="#16202A"/><text x="566" y="427">STHIRA DESIGN-BUILD</text><text x="566" y="451">RAO RESIDENCE</text><text x="681" y="451">STH-2611</text><text x="566" y="475">' + esc(d.kind.toUpperCase()) + '</text><text x="681" y="475">' + esc(String(d.size).toUpperCase().slice(0, 14)) + '</text><text x="566" y="499">ISSUED</text><text x="681" y="499">' + esc(A.date(d.date).toUpperCase()) + '</text></g></svg><p class="hint" style="margin-top:10px">The full PDF, with every earlier revision listed, opens from here once your site team uploads the signed set.</p>' });
  }

  /* ───────── messages ───────── */
  VIEWS.messages = function () {
    return '<div class="vh-row"><h1>Messages</h1><p class="meta">Farah (project manager) and Karthik (site engineer) reply within one working day</p></div><section class="cd thr-c"><div class="thr" role="log" aria-label="Messages with the site team">' + msgs().map(function (m) { var me = m.role === 'Client'; return '<div class="cx-msg ' + (me ? 'cx-a' : 'cx-u') + '"><small>' + esc(m.from + ' · ' + m.role + ' · ' + A.date(m.at) + ', ' + hm(m.at)) + '</small><div class="cx-bub">' + esc(m.text) + '</div></div>'; }).join('') + '</div><form class="cx-comp" id="msgF"><div class="cx-in"><label class="sr" for="msgT">Message to the site team</label><textarea class="in" id="msgT" rows="2" placeholder="Write to Farah and Karthik · Ctrl or ⌘ Enter to send"></textarea><button type="submit" class="b pri">' + ic('send') + 'Send</button></div></form></section>';
  };

  /* ───────── events ───────── */
  document.addEventListener('click', function (e) {
    var t = e.target;
    var p = t.closest('[data-pay]'); if (p) return payFlow(+p.getAttribute('data-pay'));
    var c = t.closest('[data-co]'); if (c) { var id = c.getAttribute('data-co'), v = c.getAttribute('data-v'), cc = D.CHANGES.filter(function (x) { return x.id === id; })[0]; S.co[id] = v; S.coAt[id] = stamp(); delete S.coAck[id]; logP((v === 'approved' ? 'approved ' : 'declined ') + id); save(); refresh();
      return toast(id + (v === 'approved' ? ' approved. Farah will schedule it and you’ll see it in Friday’s update.' : ' declined. We’ll build to the original drawing.'), { icon: 'stamp', undo: function () { delete S.co[id]; delete S.coAt[id]; S.log.pop(); save(); refresh(); } }); }
    var u = t.closest('[data-undo-co]'); if (u) { var uid = u.getAttribute('data-undo-co'), prev = S.co[uid]; delete S.co[uid]; delete S.coAck[uid]; save(); refresh(); return toast(uid + ' is waiting for your answer again.', { undo: function () { S.co[uid] = prev; save(); refresh(); } }); }
    if (t.closest('#snAdd')) return snagForm();
    var f = t.closest('[data-snf]'); if (f) { snF = f.getAttribute('data-snf'); return route(true); }
    var r = t.closest('[data-reopen]'); if (r) { var rid = r.getAttribute('data-reopen'), pr = S.snagStatus[rid]; S.snagStatus[rid] = 'open'; logP('reopened snag ' + rid); save(); refresh(); return toast(rid + ' reopened and sent back to the site team.', { icon: 'flag', undo: function () { if (pr) S.snagStatus[rid] = pr; else delete S.snagStatus[rid]; S.log.pop(); save(); refresh(); } }); }
    var dd = t.closest('[data-doc]'); if (dd) return docPreview(docs()[+dd.getAttribute('data-doc')]);
    var lb = t.closest('[data-lb]'); if (lb) { var src = lb.getAttribute('data-lb'); modal({ title: esc(lb.getAttribute('data-cap')), size: 'wide lbx', body: '<img src="' + (src.indexOf('data:') === 0 ? src : 'photos/' + src + '.jpg') + '" alt="' + esc(lb.getAttribute('data-cap')) + '">' }); }
  });
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'msgF') return; e.preventDefault(); var ta = $('#msgT'), v = ta.value.trim(); if (!v) return ta.focus();
    var m = { from: 'Ananya Rao', role: 'Client', at: stamp(), text: v }; S.msgs.push(m); S.seenMsgs = m.at; logP('wrote: “' + v.slice(0, 60) + '”'); save(); route(true); var n = $('#msgT'); if (n) n.focus();
    toast('Sent to Farah and Karthik.', { icon: 'send', undo: function () { S.msgs = S.msgs.filter(function (x) { return x.at !== m.at; }); S.log.pop(); save(); route(true); } });
  });
  document.addEventListener('keydown', function (e) { if (e.target.id === 'msgT' && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); $('#msgF').requestSubmit(); } });

  if (A.store.get('portal-session', false) || /[?&](demo|as=client)/.test(location.search)) enter(false); else setTimeout(function () { var p = $('#lgGo'); if (p && innerWidth > 820) p.focus(); }, 60);
})();
