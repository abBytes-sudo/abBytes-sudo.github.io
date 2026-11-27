/* Fernhill Digital · reseller console. An agency resells Ordwell under its own name; this is where it runs that business:
   walkthrough requests (the marketing pages' chat and pricing form write them to localStorage "ordwell-site-leads"),
   provisioning a branded workspace per client, the workspaces table, conversations with the site assistant and payouts.
   Console state lives in localStorage "ordwell-reseller-v1". "Open as this workspace" writes the same brand fields the
   app's Settings › Branding uses (key "ordwell-demo-v3"). */
(function () {
  'use strict';
  var KEY = 'ordwell-reseller-v1', LK = 'ordwell-site-leads', APPK = 'ordwell-demo-v3', HR = 36e5, DAY = 864e5, CNAME = 'tenants.ordwell.app';
  var PL = { team: { n: 'Team', cost: 399, sell: 549 }, business: { n: 'Business', cost: 799, sell: 1099 }, agency: { n: 'Agency', cost: 1499, sell: 1899 } };
  var STAGES = [['new', 'New', '--st-new'], ['demo', 'Walkthrough booked', '--st-demo'], ['trial', 'Trial', '--st-trial'], ['won', 'Won', '--st-won'], ['lost', 'Lost', '--st-lost']];
  var SW = ['#111317', '#C2461C', '#2B59C3', '#0F7B6C', '#7A3FC4', '#B4235A', '#B7791F', '#2F7D32'];
  var FERN = { name: 'Ordwell', accent: '#111317', logo: null, domain: 'work.fernhill-digital.in', domainState: 'verified', sender: 'Fernhill Digital', loginNote: 'Sign in to the Fernhill client workroom.' };
  var WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var ICO = { x: 'M6 6l12 12M18 6 6 18', plus: 'M12 5v14M5 12h14', chk: 'm5 12 4.5 4.5L19 7', chev: 'm6 9 6 6 6-6', alert: 'M12 8v5M12 16.5v.5M10.3 4.5 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0z', cal: 'M5 5h14v15H5zM5 10h14M9 3v4M15 3v4', globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.5 5.6 3.5 9s-1 6.4-3.5 9c-2.5-2.6-3.5-5.6-3.5-9s1-6.4 3.5-9z', inbox: 'M3 13h5l1.5 3h5L16 13h5M5.5 5h13L21 13v5.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5V13z', rupee: 'M7 5h10M7 9h10M7 5c5 0 7 1.5 7 4s-2 4-7 4l7 6', back: 'm15 6-6 6 6 6', ext: 'M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5' };
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ic(n, c) { return '<svg class="ic ' + (c || '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICO[n] + '"/></svg>'; }
  function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  function inrk(n) { return n >= 1000 ? '₹' + (n / 1000).toFixed(1) + 'k' : inr(n); }
  function plural(n, a, b) { return n + ' ' + (n === 1 ? a : b); }
  function ago(ms) { var s = (Date.now() - ms) / 1000; if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago'; if (s < 172800) return 'yesterday'; return Math.floor(s / 86400) + 'd ago'; }
  function rd(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function lum(h) { var c = [1, 3, 5].map(function (i) { var v = parseInt(h.substr(i, 2), 16) / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  function onC(h) { return ratio(h, '#FFFFFF') >= 4.5 ? '#FFFFFF' : '#111317'; }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); }
  function kk(w, cls) { return '<span class="kk ' + (cls || '') + '" style="--c:' + esc(w.accent) + ';--o:' + onC(w.accent) + '" aria-hidden="true">' + esc((w.initial || w.name || '?').slice(0, 2)) + '</span>'; }
  function dayName(d) { return WD[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' + MON[d.getMonth()]; }

  /* ---------- data ---------- */
  function rev(w) { return w.seats * PL[w.plan].sell; }
  function cost(w) { return w.seats * PL[w.plan].cost; }
  function mg(w) { return rev(w) - cost(w); }
  function seedState() {
    var n = Date.now();
    return {
      v: 1, merged: false,
      ws: [
        { id: 'w1', name: 'Monsoon Workroom', client: 'Monsoon Works', plan: 'agency', seats: 18, used: 14, accent: '#2B59C3', initial: 'M', domain: 'work.monsoonworks.in', dns: true, status: 'live', act: n - 2 * HR, since: n - 71 * DAY, note: 'Annual Agency plan. Harsh (founder) approves every invoice; send them to accounts@monsoonworks.in.' },
        { id: 'w2', name: 'Kochi Site Desk', client: 'Banyan Build Co.', plan: 'business', seats: 30, used: 21, accent: '#0F7B6C', initial: 'K', domain: 'sites.banyanbuild.in', dns: true, status: 'live', act: n - 25 * 60000, since: n - 52 * DAY, note: 'Site engineers in Kochi and Coimbatore upload photos from phones. Construction template.' },
        { id: 'w3', name: 'Teal Kite Desk', client: 'Teal Kite Studio', plan: 'team', seats: 8, used: 6, accent: '#7A3FC4', initial: 'T', domain: 'work.tealkite.in', dns: true, status: 'live', act: n - 20 * HR, since: n - 40 * DAY, note: '' },
        { id: 'w4', name: 'Kaveri Ledger', client: 'Kaveri Chartered Accountants', plan: 'business', seats: 12, used: 9, accent: '#B7791F', initial: 'K', domain: 'ledger.kaverica.in', dns: true, status: 'live', act: n - 5 * HR, since: n - 33 * DAY, note: 'Month-end checklists for 40 clients. Uses the recurring-task automation.' },
        { id: 'w5', name: 'Paper Lantern Hub', client: 'Paper Lantern Films', plan: 'team', seats: 6, used: 4, accent: '#B4235A', initial: 'P', domain: 'hub.paperlantern.in', dns: true, status: 'live', act: n - 3 * DAY, since: n - 21 * DAY, overdue: true, note: 'November invoice is 13 days late. Ask Meenal (producer) before pausing anything.' },
        { id: 'w6', name: 'Hosur Floor', client: 'Hosur Fabrication Works', plan: 'business', seats: 15, used: 0, accent: '#2F7D32', initial: 'H', domain: 'work.hosurfab.in', dns: false, status: 'provisioning', act: n - 2 * DAY, since: n - 2 * DAY, note: 'Waiting on their IT contractor to add the CNAME. Chase on Monday.' }
      ],
      hist: [[38400, 29100], [46950, 35300], [58200, 43700], [71300, 53600], [80800, 60900]],
      chats: seedChats(n)
    };
  }
  function seedChats(n) {
    function m(f, t, at) { return { f: f, t: t, at: at }; }
    return [
      { id: 'c1', name: 'Neha Kulkarni', company: 'Greenfield Realty', topic: 'Pricing question', status: 'bot', lead: 'L-2410', at: n - 50 * 60000, msgs: [
        m('v', 'What does Ordwell cost for 12 people?', n - 62 * 60000),
        m('a', 'For 12 people the Business plan fits: ₹799 per seat a month, so ₹9,588 a month plus GST, or ₹95,880 a year (two months free).', n - 61 * 60000),
        m('v', 'Do our clients need seats too?', n - 58 * 60000),
        m('a', 'No. Client guests are unlimited on every plan, and they only see tasks tagged client-visible.', n - 57 * 60000),
        m('v', 'Okay. Can someone call me about the annual option?', n - 52 * 60000),
        m('a', 'Yes. I have noted it on your request. Want me to book a 30-minute walkthrough?', n - 51 * 60000)] },
      { id: 'c2', name: 'Dev Arora', company: 'Pixelsmith', topic: 'White-label question', status: 'handed', lead: 'L-2411', at: n - 3 * HR, reason: 'Asked about invoicing clients directly', msgs: [
        m('v', 'Can we resell this under our own domain and hide the Powered by label?', n - 3.4 * HR),
        m('a', 'Yes, on the Agency plan: your domain, logo, colours and sender name, and the label can be hidden.', n - 3.4 * HR + 30000),
        m('v', 'And can we invoice our clients ourselves at our own price?', n - 3.2 * HR),
        m('a', 'You set your own price per seat. Ordwell bills you at the Agency rate and you keep the difference. How you invoice is a commercial question, so I am handing you to a person.', n - 3.2 * HR + 40000),
        m('s', 'Handed over to the team: asked about invoicing clients directly.', n - 3.2 * HR + 41000)] },
      { id: 'c3', name: 'Gauri Iyer', company: 'Lantern & Loom', topic: 'Walkthrough booked', status: 'bot', lead: 'L-2412', at: n - 22 * HR, msgs: [
        m('v', 'We are a 20-person branding studio. Can I see how client approvals work?', n - 22.5 * HR),
        m('a', 'Yes. Tasks tagged client-visible show up in the client’s own view, and comments can stay internal. A 30-minute walkthrough shows it with your own project.', n - 22.5 * HR + 30000),
        m('v', 'Monday morning works.', n - 22.3 * HR),
        m('a', 'Booked. Mon 1 Dec, 11:00 IST with Gauri from Lantern & Loom. Invite goes to gauri@lanternloom.in.', n - 22.2 * HR)] }
    ];
  }
  function seedLeads() {
    var n = Date.now();
    return [
      { id: 'L-2412', name: 'Gauri Iyer', email: 'gauri@lanternloom.in', company: 'Lantern & Loom', team: '11–25', plan: 'Agency', note: 'Booked in chat for Mon 1 Dec, 11:00 IST.', at: n - 22 * HR, stage: 'demo', slot: 'Mon 1 Dec, 11:00 IST', source: 'Chat', convo: 'c3', log: [] },
      { id: 'L-2411', name: 'Dev Arora', email: 'dev@pixelsmith.in', company: 'Pixelsmith', team: '26–60', plan: 'Agency', note: 'Asked whether they can resell under their own domain, hide the Powered by label and invoice clients themselves.', at: n - 3 * HR, stage: 'new', source: 'Chat', convo: 'c2', log: [] },
      { id: 'L-2410', name: 'Neha Kulkarni', email: 'neha@greenfieldrealty.in', company: 'Greenfield Realty', team: '11–25', plan: 'Business', note: 'Asked what 12 seats cost and whether clients need seats. Wants a call about the annual option.', at: n - 50 * 60000, stage: 'new', source: 'Chat', convo: 'c1', log: [] },
      { id: 'L-2403', name: 'Ritu Malhotra', email: 'ritu@saffronslate.in', company: 'Saffron & Slate', team: '11–25', plan: 'Agency', note: 'We run 14 retainers and want each client in their own branded space.', at: n - 0.2 * DAY, stage: 'new', log: [] },
      { id: 'L-2402', name: 'Joseph Mathew', email: 'joseph@banyanbuild.in', company: 'Banyan Build Co.', team: '26–60', plan: 'Business', note: 'Site teams in Kochi and Coimbatore — need the construction template and photo uploads.', at: n - 1.3 * DAY, stage: 'contacted', log: [{ at: n - DAY, text: 'Called — wants a walkthrough with site engineers on Thursday.' }] },
      { id: 'L-2401', name: 'Ananya Ghosh', email: 'ananya@tealkite.in', company: 'Teal Kite Studio', team: '1–10', plan: 'Team', note: '', at: n - 3 * DAY, stage: 'demo', slot: 'Fri 28 Nov, 16:00 IST', log: [{ at: n - 2 * DAY, text: 'Walkthrough booked for Friday 4 pm.' }] },
      { id: 'L-2400', name: 'Isha Rao', email: 'isha@cinnabardesign.in', company: 'Cinnabar Design', team: '1–10', plan: 'Team', note: 'Three designers and a producer. Trying it with one client first.', at: n - 6 * DAY, stage: 'trial', slot: 'Mon 24 Nov, 11:00 IST', log: [{ at: n - 4 * DAY, text: 'Trial workspace opened with 4 seats. Check in on Tuesday.' }] },
      { id: 'L-2399', name: 'Harsh Vora', email: 'harsh@monsoonworks.in', company: 'Monsoon Works', team: '11–25', plan: 'Agency', note: 'Moving off spreadsheets + WhatsApp groups.', at: n - 9 * DAY, stage: 'won', slot: 'Thu 20 Nov, 15:30 IST', ws: 'w1', log: [{ at: n - 6 * DAY, text: 'Signed annual Agency plan, 18 seats.' }] },
      { id: 'L-2398', name: 'Vikram Sethi', email: 'vikram@orchidinteriors.in', company: 'Orchid Interiors', team: '1–10', plan: 'Team', note: 'Wants everything on their own servers.', at: n - 12 * DAY, stage: 'lost', log: [{ at: n - 10 * DAY, text: 'Not a fit right now — needs on-premise hosting.' }] }
    ];
  }
  var st = rd(KEY); if (!st || st.v !== 1) st = seedState();
  var LS = rd(LK); if (!Array.isArray(LS)) LS = [];
  function mergeLeads() {
    if (st.merged) return; seedLeads().forEach(function (s) { if (!LS.some(function (l) { return l.id === s.id; })) LS.push(s); }); st.merged = true; saveAll();
  }
  function importChats() {
    var cv = rd('orbit-convos'); if (!Array.isArray(cv)) return;
    cv.forEach(function (c) {
      if (!c || c.agent !== 'work-sales' || c.seed || !c.messages || !c.messages.length || st.chats.some(function (x) { return x.id === c.id; })) return;
      var l = LS.filter(function (x) { return x.convo === c.id; })[0];
      st.chats.unshift({ id: c.id, name: (c.user && c.user.name) || (l && l.name) || 'Site visitor', company: l ? l.company : 'New visitor', topic: l ? 'Walkthrough booked' : 'Chat from the site', status: c.status === 'waiting' ? 'handed' : 'bot', lead: l ? l.id : null, at: c.updatedAt || c.startedAt || Date.now(),
        msgs: c.messages.slice(-30).map(function (m) { return { f: m.from === 'user' ? 'v' : m.from === 'bot' ? 'a' : 'y', t: String(m.text || '').replace(/\*\*/g, ''), at: m.ts || Date.now() }; }).filter(function (m) { return m.t; }) });
    });
  }
  function saveAll() { wr(KEY, st); wr(LK, LS); }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function stageOf(l) { return ['demo', 'trial', 'won', 'lost'].indexOf(l.stage) > -1 ? l.stage : 'new'; }
  function sorted() { return LS.slice().sort(function (a, b) { return (b.at || 0) - (a.at || 0); }); }
  function needSlot() { return LS.filter(function (l) { return stageOf(l) === 'new' && !l.slot; }); }
  function liveWs() { return st.ws.filter(function (w) { return w.status === 'live'; }); }
  function totals() { var L = liveWs(), t = { rev: 0, cost: 0, mg: 0, seats: 0, used: 0, n: L.length }; L.forEach(function (w) { t.rev += rev(w); t.cost += cost(w); t.mg += mg(w); t.seats += w.seats; t.used += w.used; }); return t; }
  function overdueWs() { return st.ws.filter(function (w) { return w.overdue && w.status === 'live'; }); }
  function slotChoices() {
    var d = new Date(); function nx(x) { x = new Date(x); do { x.setDate(x.getDate() + 1); } while (x.getDay() === 0 || x.getDay() === 6); return x; }
    var a = nx(d), b = nx(a); return [dayName(a) + ', 11:00 IST', dayName(a) + ', 15:30 IST', dayName(b) + ', 10:30 IST'];
  }

  /* ---------- small UI helpers ---------- */
  function toast(t, o) {
    o = o || {}; var w = $('#toasts'), d = document.createElement('div'); d.className = 'toast'; d.innerHTML = '<span>' + esc(t) + '</span>' + (o.act ? '<button type="button">' + esc(o.act.label) + '</button>' : '');
    w.appendChild(d); while (w.children.length > 3) w.firstChild.remove();
    var k = setTimeout(function () { d.remove(); }, o.ms || 4200); if (o.act) d.querySelector('button').addEventListener('click', function () { clearTimeout(k); d.remove(); o.act.fn(); });
  }
  var pop = null;
  function closePop() { if (pop) { pop.el.remove(); var a = pop.anchor; pop = null; if (a && document.body.contains(a)) a.focus(); } }
  function menu(anchor, items) {
    closePop(); var el = document.createElement('div'); el.className = 'pop'; el.setAttribute('role', 'menu');
    el.innerHTML = items.map(function (it, i) { return it.head ? '<div class="h" role="presentation">' + esc(it.head) + '</div>' : '<button type="button" role="menuitem" data-i="' + i + '">' + (it.ico ? ic(it.ico, 's') : '') + esc(it.label) + '</button>'; }).join('');
    document.body.appendChild(el); var r = anchor.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
    var left = Math.min(Math.max(8, r.right - w), innerWidth - w - 8), top = r.bottom + 6; if (top + h > innerHeight - 8) top = Math.max(8, r.top - h - 6);
    el.style.left = left + 'px'; el.style.top = top + 'px'; pop = { el: el, anchor: anchor };
    el.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (!b) return; var it = items[+b.getAttribute('data-i')]; closePop(); it.fn && it.fn(); });
    var f = el.querySelector('button'); if (f) f.focus();
    el.addEventListener('keydown', function (e) { var bs = $$('button', el), i = bs.indexOf(document.activeElement); if (e.key === 'ArrowDown') { e.preventDefault(); bs[(i + 1) % bs.length].focus(); } else if (e.key === 'ArrowUp') { e.preventDefault(); bs[(i - 1 + bs.length) % bs.length].focus(); } });
  }

  /* ---------- routing ---------- */
  var cur = { v: 'home', id: '' }, V = {};
  function route() { var p = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent); var v = p[0] || 'home'; if (!V[v]) v = 'home'; return { v: v, id: p[1] || '' }; }
  function go(h) { if (location.hash === h) onRoute(); else location.hash = h; }
  var chatSel = '';
  function render() {
    var r = route(); cur = r; var o = V[r.v](r);
    $('#h1').textContent = o.h1; $('#sub').textContent = o.sub; $('#acts').innerHTML = o.acts || ''; $('#view').innerHTML = o.html; $('#crumb').textContent = o.crumb || o.h1.split(' · ')[0];
    $$('[data-v]').forEach(function (a) { if (a.getAttribute('data-v') === (r.v === 'provision' ? 'workspaces' : r.v)) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    var nr = needSlot().length; $('#n-requests').textContent = nr || ''; $('#n-workspaces').textContent = st.ws.length; var nc = st.chats.filter(function (c) { return c.status === 'handed'; }).length; $('#n-chats').textContent = nc || '';
    if (o.after) o.after();
  }
  function onRoute() {
    var r = route(), prev = cur; var same = prev && prev.v === r.v;
    if (prev.v === 'provision' && r.v !== 'provision' && pv && pv.done) pv = null;
    if (!same || soKind !== 'route') render(); else if (r.v === 'chats') render();
    cur = r; syncSO(); if (!same) { $('#main').scrollTop = 0; }
  }
  function refresh() { saveAll(); var fk = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-fk'); render(); if (soKind === 'route') syncSO(true); if (fk) { var e = $('[data-fk="' + fk + '"]'); if (e) e.focus(); } }

  /* ---------- slide-over ---------- */
  var soKind = '', soOpener = null;
  function showSO(o, kind) {
    var so = $('#so'), was = !so.hidden;
    so.innerHTML = '<div class="so-h"><div><h2 id="so-h" tabindex="-1">' + o.title + '</h2><p>' + (o.sub || '') + '</p></div><button type="button" class="x" data-a="so-close" aria-label="Close">' + ic('x') + '</button></div><div class="so-b">' + o.body + '</div>' + (o.foot ? '<div class="so-f">' + o.foot + '</div>' : '');
    soKind = kind;
    if (!was) { soOpener = document.activeElement; so.hidden = false; $('#scrim').hidden = false; $('#shell').inert = true; $('#tabbar').inert = true; $('#so-h').focus(); }
  }
  function hideSO() {
    var so = $('#so'); if (so.hidden) return; so.hidden = true; $('#scrim').hidden = true; $('#shell').inert = false; $('#tabbar').inert = false; soKind = '';
    if (soOpener && document.body.contains(soOpener)) soOpener.focus(); else $('#main').focus(); soOpener = null;
  }
  function syncSO(keep) {
    var r = route(), o = null;
    if (r.id && r.v === 'requests') { var l = byId(LS, r.id); if (l) o = reqSO(l); }
    else if (r.id && r.v === 'workspaces') { var w = byId(st.ws, r.id); if (w) o = wsSO(w); }
    if (o) showSO(o, 'route'); else if (soKind === 'route') hideSO();
  }

  /* ---------- Home ---------- */
  V.home = function () {
    var t = totals(), need = needSlot(), prov = st.ws.filter(function (w) { return w.status === 'provisioning'; }), od = overdueWs(), bits = [];
    if (need.length) bits.push(plural(need.length, 'walkthrough', 'walkthroughs') + ' to book'); if (prov.length) bits.push(plural(prov.length, 'workspace', 'workspaces') + ' waiting to go live'); if (od.length) bits.push(plural(od.length, 'invoice', 'invoices') + ' overdue');
    var h1 = WD[new Date().getDay()] + ' · ' + (bits.length ? bits.join(' · ') : 'nothing waiting on you');
    var L = liveWs(), h = '';
    h += '<section class="panel" aria-labelledby="rv-h"><header><h2 id="rv-h">Recurring revenue, by workspace</h2><span class="sp"></span><a class="btn sm" href="#/payouts">Payouts</a></header><div class="pb">';
    h += '<div class="stats"><div class="stat"><small>Monthly recurring revenue</small><b>' + inr(t.rev) + '</b></div><div class="stat"><small>Your margin</small><b>' + inr(t.mg) + '<span class="pc">' + (t.rev ? (t.mg / t.rev * 100).toFixed(1) : 0) + '%</span></b></div><div class="stat"><small>Paid to Ordwell</small><b class="sm">' + inr(t.cost) + '</b></div><div class="stat"><small>Seats used / bought</small><b class="sm">' + t.used + ' / ' + t.seats + '</b></div></div>';
    if (L.length) {
      h += '<div class="mrr">' + L.slice().sort(function (a, b) { return rev(b) - rev(a); }).map(function (w) { return '<a class="seg" href="#/workspaces/' + w.id + '" style="--c:' + esc(w.accent) + ';--w:' + rev(w) + ';--m:' + (mg(w) / rev(w) * 100).toFixed(1) + '%" aria-label="' + esc(w.name + ': ' + inr(rev(w)) + ' a month, your margin ' + inr(mg(w))) + '" title="' + esc(w.name + ' · ' + inr(rev(w))) + '"><i class="mg"></i></a>'; }).join('') + '</div>';
      h += '<div class="lgd"><div class="lg-r lg-h"><span>Workspace</span><span class="mono c2" style="text-align:right;font-family:var(--font)">Revenue / mo</span><span class="mono c3" style="text-align:right;font-family:var(--font)"><span class="key-mg"></span>Your margin</span></div>' +
        L.slice().sort(function (a, b) { return rev(b) - rev(a); }).map(function (w) { return '<div class="lg-r"><span class="nm">' + kk(w, 'sm') + '<a href="#/workspaces/' + w.id + '"><span>' + esc(w.name) + '</span></a></span><span class="mono c2">' + inr(rev(w)) + '</span><span class="mono c3">' + inr(mg(w)) + '</span></div>'; }).join('') + '</div>';
      if (prov.length) h += '<p class="note-s">' + inr(prov.reduce(function (s, w) { return s + rev(w); }, 0)) + ' more a month once ' + esc(prov.map(function (w) { return w.name; }).join(' and ')) + ' goes live.</p>';
    } else h += '<div class="empty"><h3>No live workspaces yet</h3><p>Provision the first one and its revenue lands here.</p><div class="acts"><a class="btn pri" href="#/provision">Provision a workspace</a></div></div>';
    h += '</div></section>';
    h += '<section class="panel" aria-labelledby="nd-h"><header><h2 id="nd-h">What needs you</h2></header>';
    var items = [];
    need.slice(0, 4).forEach(function (l) { items.push('<div class="need"><span class="ico">' + ic('cal', 's') + '</span><div class="tx"><b>' + esc(l.company) + ' has no walkthrough slot</b><span>' + esc(l.name) + ' · ' + (l.source === 'Chat' ? 'from the chat' : 'from the pricing form') + ' · ' + ago(l.at) + '</span></div><a class="btn sm" href="#/requests/' + l.id + '">Book a slot</a></div>'); });
    if (need.length > 4) items.push('<div class="need"><span class="ico">' + ic('inbox', 's') + '</span><div class="tx"><b>' + (need.length - 4) + ' more without a slot</b><span>The rest are on the Requests board.</span></div><a class="btn sm" href="#/requests">Open requests</a></div>');
    prov.forEach(function (w) { items.push('<div class="need"><span class="ico">' + ic('globe', 's') + '</span><div class="tx"><b>' + esc(w.name) + ' is mid-provisioning</b><span>' + (w.dns || w.goLive ? 'Going live shortly' : 'Waiting for the CNAME on ' + esc(w.domain)) + '</span></div><a class="btn sm" href="#/workspaces/' + w.id + '">' + (w.dns || w.goLive ? 'Open' : 'Check DNS') + '</a></div>'); });
    od.forEach(function (w) { items.push('<div class="need"><span class="ico">' + ic('alert', 's') + '</span><div class="tx"><b>' + esc(w.client) + ': November invoice overdue</b><span>' + inr(rev(w)) + ' · 13 days past due</span></div><a class="btn sm" href="#/workspaces/' + w.id + '">Open invoice</a></div>'); });
    h += items.length ? items.join('') : '<div class="empty"><h3>Nothing needs you right now</h3><p>Every request has a slot and every workspace is live. Add a request or provision the next client.</p><div class="acts"><a class="btn" href="#/requests">Open requests</a><a class="btn pri" href="#/provision">Provision a workspace</a></div></div>';
    h += '</section>';
    return { h1: h1, sub: WD[new Date().getDay()] + ', ' + new Date().getDate() + ' ' + MON[new Date().getMonth()] + ' · Fernhill Digital · ' + plural(st.ws.length, 'client workspace', 'client workspaces'), html: h, crumb: 'Home' };
  };

  /* ---------- Requests ---------- */
  var rsTab = 'new';
  function srcOf(l) { return l.source === 'Chat' ? 'Chat' : 'Pricing form'; }
  function rcard(l) {
    return '<button type="button" class="rcard" data-a="req-open" data-id="' + l.id + '"><b>' + esc(l.company) + '</b><span class="meta">' + esc(l.name) + ' · ' + esc(l.team) + ' people · ' + esc(l.plan) + '</span>' + (l.note ? '<span class="nt">' + esc(l.note) + '</span>' : '') + '<span class="row"><span class="src">' + srcOf(l) + '</span>' + (l.slot ? '<span class="mono">' + esc(l.slot) + '</span>' : (stageOf(l) === 'new' ? '<span class="mono" style="color:var(--warn)">no slot yet</span>' : '')) + '<span class="mono faint" style="margin-left:auto">' + ago(l.at) + '</span></span></button>';
  }
  V.requests = function (r) {
    var ls = sorted(), open = ls.filter(function (l) { var s = stageOf(l); return s !== 'won' && s !== 'lost'; }).length, booked = ls.filter(function (l) { return stageOf(l) === 'demo'; }).length;
    var h = '<div class="stabs" role="group" aria-label="Stage">' + STAGES.map(function (s) { return '<button type="button" class="kcap" data-a="rs-tab" data-s="' + s[0] + '" aria-pressed="' + (rsTab === s[0]) + '">' + s[1] + ' <span class="mono">' + ls.filter(function (l) { return stageOf(l) === s[0]; }).length + '</span></button>'; }).join('') + '</div>';
    h += '<div class="board" id="board">' + STAGES.map(function (s) {
      var cs = ls.filter(function (l) { return stageOf(l) === s[0]; });
      return '<section class="bcol' + (rsTab === s[0] ? ' on' : '') + '" data-stage="' + s[0] + '" aria-label="' + s[1] + '"><header><i style="--c:var(' + s[2] + ')"></i>' + s[1] + '<span class="cnt">' + cs.length + '</span></header><div class="bbody">' + (cs.length ? cs.map(rcard).join('') : '<p class="bnone">' + (s[0] === 'new' ? 'Nothing new. The pricing form and the site chat feed this column.' : 'Drag a request here.') + '</p>') + '</div></section>';
    }).join('') + '</div>';
    return { h1: 'Requests', sub: plural(open, 'open request', 'open requests') + ' · ' + plural(booked, 'walkthrough', 'walkthroughs') + ' booked · from the pricing form and the site chat', acts: '<button type="button" class="btn" data-a="new-req">' + ic('plus', 's') + 'Add a request</button>', html: h, crumb: 'Requests' };
  };
  function moveLead(l, to, quiet) {
    var from = stageOf(l); if (from === to) return; var nm = STAGES.filter(function (s) { return s[0] === to; })[0][1];
    l.stage = to; (l.log = l.log || []).push({ at: Date.now(), text: 'Moved to ' + nm + '.' });
    if (to === 'demo' && !l.slot) { refresh(); go('#/requests/' + l.id); toast('Pick a slot for ' + l.company); return; }
    refresh(); if (!quiet) toast(l.company + ' moved to ' + nm, { act: { label: 'Undo', fn: function () { l.stage = from; l.log.pop(); refresh(); } } });
  }
  function reqSO(l) {
    var s = stageOf(l), ch = byId(st.chats, l.convo), booked = !!l.slot, ws = l.ws && byId(st.ws, l.ws), choices = slotChoices();
    var body = '<div class="sec"><h3>Their note</h3><p class="quote">' + esc(l.note || 'No note. Ask what they run today and how many clients they have.') + '</p></div>';
    body += '<div class="sec"><h3>Request</h3><dl class="dl2"><dt>Contact</dt><dd>' + esc(l.name) + ' · ' + esc(l.email) + '</dd><dt>Team size</dt><dd>' + esc(l.team) + ' people</dd><dt>Plan</dt><dd>' + esc(l.plan) + '</dd><dt>Source</dt><dd>' + srcOf(l) + (ch ? ' · <a href="#/chats/' + ch.id + '" style="text-decoration:underline">Open the transcript</a>' : '') + '</dd><dt>Received</dt><dd>' + ago(l.at) + ' · ' + esc(l.id) + '</dd></dl></div>';
    body += '<div class="sec"><h3>Stage</h3><div class="kset" role="group" aria-label="Stage">' + STAGES.map(function (x) { return '<button type="button" class="kcap" data-a="req-stage" data-id="' + l.id + '" data-s="' + x[0] + '" data-fk="st-' + x[0] + '" aria-pressed="' + (s === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div></div>';
    body += '<div class="sec"><h3>Walkthrough</h3>' + (booked ? '<p style="margin-bottom:10px"><b>Booked: ' + esc(l.slot) + '</b></p><button type="button" class="btn sm" data-a="req-unbook" data-id="' + l.id + '">Change the slot</button>' :
      '<p class="muted" style="margin-bottom:10px">No slot yet. Pick one and the invite goes to ' + esc(l.email) + '.</p><div class="slots" role="group" aria-label="Book a slot">' + choices.map(function (c, i) { return '<button type="button" class="kcap" data-a="req-slot" data-id="' + l.id + '" data-slot="' + esc(c) + '" data-fk="sl-' + i + '">' + ic('cal', 's') + esc(c) + '</button>'; }).join('') + '</div>') + '</div>';
    body += '<div class="sec"><h3>Notes for the next person</h3><div class="logs">' + ((l.log || []).length ? (l.log || []).slice().reverse().map(function (x) { return '<p><time>' + ago(x.at) + '</time> · ' + esc(x.text) + '</p>'; }).join('') : '<p class="muted">Nothing logged yet.</p>') + '</div><div style="display:flex;gap:8px;margin-top:10px"><label class="sr" for="rq-note">Add a note</label><input class="inp" id="rq-note" placeholder="What should the next person know?" data-fk="note"><button type="button" class="btn" data-a="req-note" data-id="' + l.id + '">Add</button></div></div>';
    var foot = ws ? '<a class="btn pri" href="#/workspaces/' + ws.id + '">Open ' + esc(ws.name) + '</a>' : booked ? '<a class="btn pri" href="#/provision/' + l.id + '">Provision a workspace</a>' : '<span class="muted" style="font-size:13px">Pick a slot above, then provision a workspace.</span>';
    return { title: esc(l.company), sub: '<span class="mono">' + esc(l.id) + '</span> · ' + STAGES.filter(function (x) { return x[0] === s; })[0][1], body: body, foot: foot };
  }

  /* ---------- Workspaces ---------- */
  var wsF = 'all', wsS = { k: 'rev', d: -1 };
  var SORTS = { name: function (w) { return w.name.toLowerCase(); }, client: function (w) { return w.client.toLowerCase(); }, plan: function (w) { return ['team', 'business', 'agency'].indexOf(w.plan); }, seats: function (w) { return w.seats; }, rev: rev, mg: mg, status: function (w) { return w.status; }, act: function (w) { return w.act; } };
  function appBrand() { var S = rd(APPK); return S && S.v === 3 ? { name: S.brand.name, re: !!S.rebrand || S.brand.name !== 'Ordwell', ws: S.rebrand && S.rebrand.ws } : null; }
  V.workspaces = function () {
    var ws = st.ws.filter(function (w) { return wsF === 'all' || w.status === wsF; }), k = wsS.k, d = wsS.d;
    ws.sort(function (a, b) { var x = SORTS[k](a), y = SORTS[k](b); return (x < y ? -1 : x > y ? 1 : 0) * d; });
    var t = totals(), ab = appBrand(), h = '';
    if (ab && ab.re) h += '<div class="banner"><span>The app is showing as <b>' + esc(ab.name) + '</b>.</span><button type="button" class="btn sm" data-a="restore">Restore Fernhill brand</button></div>';
    var cnt = function (f) { return f === 'all' ? st.ws.length : st.ws.filter(function (w) { return w.status === f; }).length; };
    h += '<div class="tools"><div class="kset" role="group" aria-label="Filter by status">' + [['all', 'All'], ['live', 'Live'], ['provisioning', 'Provisioning']].map(function (f) { return '<button type="button" class="kcap" data-a="ws-filter" data-f="' + f[0] + '" aria-pressed="' + (wsF === f[0]) + '">' + f[1] + ' <span class="mono">' + cnt(f[0]) + '</span></button>'; }).join('') + '</div><span class="sp"></span><select class="sortsel" id="ws-sort" data-a="ws-sortsel" aria-label="Sort by">' + [['rev', 'Revenue'], ['mg', 'Your margin'], ['name', 'Name'], ['client', 'Client'], ['seats', 'Seats'], ['act', 'Last active']].map(function (o) { return '<option value="' + o[0] + '"' + (k === o[0] ? ' selected' : '') + '>Sort: ' + o[1] + '</option>'; }).join('') + '</select></div>';
    function th(key, label, cls) { return '<th scope="col" class="' + (cls || '') + '"' + (k === key ? ' aria-sort="' + (d > 0 ? 'ascending' : 'descending') + '"' : '') + '><button type="button" data-a="ws-sort" data-k="' + key + '">' + label + (k === key ? (d > 0 ? ' ↑' : ' ↓') : '') + '</button></th>'; }
    h += '<div class="panel tw"><table class="tbl"><thead><tr>' + th('name', 'Workspace') + th('client', 'Client') + th('plan', 'Plan') + th('seats', 'Seats used / bought', 'r') + th('rev', 'Revenue / mo', 'r') + th('mg', 'Your margin', 'r') + th('status', 'Status') + th('act', 'Last active') + '</tr></thead><tbody>' +
      (ws.length ? ws.map(function (w) {
        return '<tr data-a="ws-open" data-id="' + w.id + '" class="' + (flash === w.id ? 'flash' : '') + '"><td class="nm" data-l="Workspace"><div class="wn">' + kk(w) + '<div><button type="button" data-a="ws-open" data-id="' + w.id + '">' + esc(w.name) + '</button><small class="mono">' + esc(w.domain) + '</small></div></div></td><td data-l="Client">' + esc(w.client) + '</td><td data-l="Plan">' + PL[w.plan].n + '</td><td class="r num" data-l="Seats used / bought">' + w.used + ' / ' + w.seats + '</td><td class="r mono' + (w.status === 'live' ? '' : ' faint') + '" data-l="Revenue / mo">' + inr(rev(w)) + (w.status === 'live' ? '' : '<small style="display:block;font-family:var(--font)">from go-live</small>') + '</td><td class="r mono' + (w.status === 'live' ? '' : ' faint') + '" data-l="Your margin">' + inr(mg(w)) + '</td><td data-l="Status">' + (w.status === 'live' ? '<span class="pill ok"><i style="--c:var(--ok)"></i>Live</span>' : '<span class="pill warn"><i style="--c:var(--st-trial)"></i>Provisioning</span>') + (w.overdue ? ' <span class="pill bad">Invoice overdue</span>' : '') + '</td><td data-l="Last active">' + ago(w.act) + '</td></tr>';
      }).join('') : '<tr><td colspan="8"><div class="empty"><h3>No workspaces here</h3><p>Nothing matches this filter. Provision the next client.</p><div class="acts"><a class="btn pri" href="#/provision">Provision a workspace</a></div></div></td></tr>') +
      '</tbody><tfoot><tr><td class="nm" colspan="3">Live total · ' + plural(t.n, 'workspace', 'workspaces') + '</td><td class="r num" data-l="Seats used / bought">' + t.used + ' / ' + t.seats + '</td><td class="r mono" data-l="Revenue / mo">' + inr(t.rev) + '</td><td class="r mono" data-l="Your margin">' + inr(t.mg) + '</td><td class="nl"></td><td class="nl"></td></tr></tfoot></table></div>';
    return { h1: 'Workspaces', sub: plural(st.ws.length, 'client workspace', 'client workspaces') + ' · ' + inr(t.rev) + ' a month from ' + t.n + ' live · your margin ' + inr(t.mg), acts: '<a class="btn" href="#/provision">' + ic('plus', 's') + 'Provision a workspace</a>', html: h, crumb: 'Workspaces' };
  };
  var flash = '';
  function invoices(w) {
    if (w.status !== 'live') return [];
    var d = new Date(), out = [];
    for (var i = 0; i < 3; i++) { var x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push({ m: MON[x.getMonth()] + ' ' + x.getFullYear(), amt: rev(w), st: i === 0 && w.overdue ? 'overdue' : 'paid' }); }
    return out;
  }
  function wsSO(w) {
    var body = '<div class="sec"><h3>Summary</h3><dl class="dl2"><dt>Client</dt><dd>' + esc(w.client) + '</dd><dt>Plan</dt><dd>' + PL[w.plan].n + ' · ' + inr(PL[w.plan].sell) + ' per seat a month</dd><dt>Domain</dt><dd><span class="mono">' + esc(w.domain) + '</span> · ' + (w.dns ? '<b>Verified</b>' : 'Not verified') + '</dd><dt>Revenue</dt><dd class="mono">' + inr(rev(w)) + ' / month</dd><dt>Platform cost</dt><dd class="mono">' + inr(cost(w)) + ' / month</dd><dt>Your margin</dt><dd class="mono"><b>' + inr(mg(w)) + '</b> (' + (mg(w) / rev(w) * 100).toFixed(1) + '%)</dd><dt>Status</dt><dd>' + (w.status === 'live' ? 'Live · last active ' + ago(w.act) : 'Provisioning' + (w.dns ? '' : ' · waiting on DNS')) + '</dd><dt>Brand</dt><dd style="display:flex;align-items:center;gap:8px">' + kk(w, 'sm') + '<span class="mono">' + esc(w.accent) + '</span></dd></dl></div>';
    body += '<div class="sec"><h3>Seats</h3><p style="margin-bottom:8px"><b class="num">' + w.used + '</b> used of <b class="num">' + w.seats + '</b> bought</p><div class="meter" role="img" aria-label="' + w.used + ' of ' + w.seats + ' seats used"><i style="width:' + Math.min(100, w.used / w.seats * 100) + '%"></i></div><div style="margin-top:10px"><button type="button" class="btn sm" data-a="ws-seats" data-id="' + w.id + '" data-fk="seats">' + ic('plus', 's') + 'Buy 5 more seats (+' + inr(5 * PL[w.plan].sell) + ' / month)</button></div></div>';
    var inv = invoices(w);
    body += '<div class="sec"><h3>Invoices</h3>' + (inv.length ? inv.map(function (v) { return '<div class="inv"><span>' + v.m + '</span><span class="mono">' + inr(v.amt) + '</span><span class="pill ' + (v.st === 'paid' ? 'ok' : 'bad') + '">' + (v.st === 'paid' ? 'Paid' : 'Overdue') + '</span></div>'; }).join('') + (w.overdue ? '<div style="margin-top:10px"><button type="button" class="btn sm" data-a="ws-remind" data-id="' + w.id + '" data-fk="remind">Send a payment reminder</button></div>' : '') : '<p class="muted">The first invoice is raised when the workspace goes live.</p>') + '</div>';
    if (w.note) body += '<div class="sec"><h3>Note for the next person</h3><p class="quote">' + esc(w.note) + '</p></div>';
    var ab = appBrand(), on = ab && ab.ws === w.id;
    var foot = (w.status !== 'live' && !w.dns ? '<button type="button" class="btn" data-a="ws-dns" data-id="' + w.id + '">Check DNS</button>' : '') + (on ? '<button type="button" class="btn" data-a="restore">Restore Fernhill brand</button>' : '') + '<span class="sp"></span><button type="button" class="btn pri" data-a="open-as" data-id="' + w.id + '">Open as this workspace</button>';
    return { title: '<span style="display:inline-flex;align-items:center;gap:10px">' + kk(w) + esc(w.name) + '</span>', sub: esc(w.client) + ' · ' + PL[w.plan].n + ' plan', body: body, foot: foot };
  }
  function rebrand(w) {
    function apply(S) {
      if (!S.rebrand) S.rebrand = { prev: { name: S.brand.name, accent: S.brand.accent, logo: S.brand.logo, domain: S.brand.domain, domainState: S.brand.domainState, sender: S.brand.sender, loginNote: S.brand.loginNote } };
      S.rebrand.ws = w.id; S.brand.name = w.name; S.brand.accent = w.accent; S.brand.logo = null; S.brand.domain = w.domain; S.brand.domainState = w.dns ? 'verified' : 'pending'; S.brand.sender = w.name; S.brand.loginNote = 'Sign in to the ' + w.name + ' workroom.';
    }
    var S = rd(APPK);
    if (S && S.v === 3) { apply(S); wr(APPK, S); location.href = 'index.html'; return; }
    var q = ['js/seed.js?v=1', 'js/store.js?v=1'], i = 0;
    (function next() { if (i < q.length) { var s = document.createElement('script'); s.src = q[i++]; s.onload = next; s.onerror = function () { toast('Could not open the app'); }; document.head.appendChild(s); return; } try { window.OW.store.load(); apply(window.OW.store.S); window.OW.store.save(); location.href = 'index.html'; } catch (e) { toast('Could not open the app'); } })();
  }
  function restoreBrand() {
    var S = rd(APPK); if (!S || S.v !== 3) { toast('The app is already on the Fernhill brand'); return; }
    var prev = S.rebrand && S.rebrand.prev ? S.rebrand.prev : FERN; Object.keys(prev).forEach(function (k) { S.brand[k] = prev[k]; }); delete S.rebrand; wr(APPK, S);
    toast('Fernhill brand restored in the app'); refresh();
  }

  /* ---------- Provision a workspace ---------- */
  var pv = null, PSTEPS = ['Name and logo', 'Colour', 'Domain', 'Seats and plan', 'Review'];
  function pvNew(lead) {
    var name = lead ? lead.company.replace(/\s*(Co\.|Studio|Works|Films|Realty)$/i, '').trim() + ' Workroom' : '';
    var plan = lead && lead.plan && PL[lead.plan.toLowerCase()] ? lead.plan.toLowerCase() : 'business', team = lead ? ({ '1–10': 8, '11–25': 18, '26–60': 40, '60+': 80 }[lead.team] || 10) : 10;
    pv = { step: 1, name: name, client: lead ? lead.company : '', initial: name ? name.charAt(0).toUpperCase() : '', accent: '#2B59C3', domain: name ? 'work.' + slug(lead.company) + '.in' : '', dTouched: false, iTouched: false, dnsOk: false, checking: false, plan: plan, seats: team, note: '', req: lead ? lead.id : null, done: null, err: '' };
  }
  function pvCalc() {
    var p = PL[pv.plan], s = Math.max(1, +pv.seats || 1), r = s * p.sell, c = s * p.cost;
    return '<div class="calc" id="calc"><div><span>' + s + ' seats × ' + inr(p.sell) + ' (your price)</span><b>' + inr(r) + ' / month</b></div><div><span>Ordwell bills you ' + inr(p.cost) + ' per seat</span><b>' + inr(c) + ' / month</b></div><div class="t"><span>Your margin</span><b>' + inr(r - c) + ' / month · ' + (r ? ((r - c) / r * 100).toFixed(1) : 0) + '%</b></div></div><p class="note-s">Excludes 18% GST. The client is invoiced under Fernhill Digital.</p>';
  }
  function pvPrev() { var w = { accent: pv.accent, initial: pv.initial || pv.name || '?', name: pv.name }; return '<div class="prev" id="pv-prev">' + kk(w, 'lg') + '<div><b>' + esc(pv.name || 'Workspace name') + '</b><small>' + esc(pv.client || 'Client') + ' · ' + esc(pv.domain || 'work.client.in') + '</small></div></div>'; }
  function pvBody() {
    var s = pv.step, h = '';
    if (s === 1) h = pvPrev() + '<div class="fld"><label for="pv-name">Workspace name</label><input class="inp" id="pv-name" data-f="name" value="' + esc(pv.name) + '" maxlength="40" autocomplete="off" placeholder="e.g. Kaveri Ledger"' + (pv.err ? ' aria-invalid="true" aria-describedby="pv-err"' : '') + '><small>Shown in the sidebar, the browser tab and the sign-in page.</small>' + (pv.err ? '<span class="err" id="pv-err">' + esc(pv.err) + '</span>' : '') + '</div><div class="two"><div class="fld"><label for="pv-client">Client</label><input class="inp" id="pv-client" data-f="client" value="' + esc(pv.client) + '" maxlength="60" autocomplete="off" placeholder="e.g. Kaveri Chartered Accountants"></div><div class="fld"><label for="pv-ini">Logo initial</label><input class="inp mono" id="pv-ini" data-f="initial" value="' + esc(pv.initial) + '" maxlength="2" autocomplete="off" style="max-width:90px"><small>One or two characters on the keycap.</small></div></div>';
    if (s === 2) { var r = ratio(pv.accent, onC(pv.accent)); h = pvPrev() + '<div class="fld"><span class="lb" id="pv-sw">Brand colour</span><div class="kset" role="group" aria-labelledby="pv-sw">' + SW.map(function (c) { return '<button type="button" class="sw" data-a="pv-col" data-c="' + c + '" style="--c:' + c + ';--o:' + onC(c) + '" aria-pressed="' + (pv.accent.toLowerCase() === c.toLowerCase()) + '" aria-label="Colour ' + c + '">' + (pv.accent.toLowerCase() === c.toLowerCase() ? ic('chk') : '') + '</button>'; }).join('') + '</div></div><div class="fld" style="max-width:240px"><label for="pv-hex">Or type a colour</label><input class="inp mono" id="pv-hex" data-f="hex" value="' + esc(pv.accent) + '" maxlength="7" autocomplete="off" spellcheck="false"></div><p class="ctr" id="pv-ct">' + (onC(pv.accent) === '#FFFFFF' ? 'White' : 'Dark') + ' text on this colour: <b>' + r.toFixed(1) + ':1</b> ' + (r >= 4.5 ? 'passes WCAG AA' : 'is below 4.5:1, pick a darker or lighter colour') + '</p>'; }
    if (s === 3) h = pvPrev() + '<div class="fld"><label for="pv-dom">Domain the client signs in at</label><input class="inp mono" id="pv-dom" data-f="domain" value="' + esc(pv.domain) + '" maxlength="80" autocomplete="off" spellcheck="false"' + (pv.err ? ' aria-invalid="true" aria-describedby="pv-err"' : '') + '>' + (pv.err ? '<span class="err" id="pv-err">' + esc(pv.err) + '</span>' : '') + '</div><div class="dns"><h3>DNS record to add</h3><dl><dt>Type</dt><dd>CNAME</dd><dt>Name</dt><dd>' + esc((pv.domain || '').split('.')[0] || 'work') + '</dd><dt>Value</dt><dd>' + CNAME + '</dd></dl></div><div class="chk"><button type="button" class="btn" data-a="pv-check" data-fk="check"' + (pv.checking || pv.dnsOk ? ' disabled' : '') + '>' + (pv.checking ? 'Checking…' : 'Check') + '</button><span class="pill ' + (pv.dnsOk ? 'ok' : '') + '" role="status">' + (pv.dnsOk ? ic('chk', 's') + 'Verified' : pv.checking ? 'Looking up the record' : 'Not verified yet') + '</span></div><p class="note-s">You can continue without verifying. The workspace then waits in Provisioning until the record resolves.</p>';
    if (s === 4) h = '<div class="fld"><span class="lb" id="pv-pl">Plan</span><div class="kset" role="group" aria-labelledby="pv-pl">' + Object.keys(PL).map(function (k) { return '<button type="button" class="kcap" data-a="pv-plan" data-p="' + k + '" aria-pressed="' + (pv.plan === k) + '">' + PL[k].n + ' <span class="mono">' + inr(PL[k].sell) + '</span></button>'; }).join('') + '</div><small>Your price per seat a month. Ordwell bills you at the plan rate.</small></div><div class="fld" style="max-width:200px"><label for="pv-seats">Seats</label><input class="inp" id="pv-seats" data-f="seats" type="number" min="1" max="500" value="' + esc(pv.seats) + '" inputmode="numeric"></div>' + pvCalc();
    if (s === 5) { var p = PL[pv.plan], sn = Math.max(1, +pv.seats || 1); h = pvPrev() + '<dl class="dl2" style="margin-bottom:18px"><dt>Name</dt><dd>' + esc(pv.name) + '</dd><dt>Client</dt><dd>' + esc(pv.client || pv.name) + '</dd><dt>Colour</dt><dd class="mono">' + esc(pv.accent) + '</dd><dt>Domain</dt><dd><span class="mono">' + esc(pv.domain) + '</span> · ' + (pv.dnsOk ? 'Verified' : 'Not verified, will wait for DNS') + '</dd><dt>Plan</dt><dd>' + p.n + ' · ' + sn + ' seats</dd><dt>Monthly price</dt><dd class="mono">' + inr(sn * p.sell) + '</dd><dt>Your margin</dt><dd class="mono"><b>' + inr(sn * (p.sell - p.cost)) + '</b></dd></dl><div class="fld"><label for="pv-note">Note for the next person</label><textarea class="inp" id="pv-note" data-f="note" rows="3" placeholder="Who is the contact, what did we promise, what is still open?">' + esc(pv.note) + '</textarea></div>'; }
    return h;
  }
  function runSteps(w) {
    var el = Math.max(0, Date.now() - w.since), i = Math.floor(el / 800), L = ['Creating the workspace and the first admin', 'Applying the name, logo and colour', w.dns || w.goLive ? 'Issuing a certificate for ' + w.domain : 'Waiting for the CNAME on ' + w.domain, 'Loading the starter template'];
    var blocked = !(w.dns || w.goLive);
    return L.map(function (t, k) { var done = w.status === 'live' ? true : (blocked && k >= 2 ? false : k < i), now = !done && (blocked && k === 2 ? true : k === i); return '<li class="' + (done ? 'done' : now ? 'now' : '') + '"><span class="tick">' + (done ? ic('chk', 's') : '') + '</span>' + esc(t) + '</li>'; }).join('');
  }
  V.provision = function (r) {
    if (r.id && (!pv || pv.req !== r.id)) { var l = byId(LS, r.id); if (l) pvNew(l); }
    if (!pv) pvNew(null);
    var h = '<div class="flow">';
    if (pv.done) {
      var w = byId(st.ws, pv.done), live = w && w.status === 'live';
      h += '<section class="panel"><header><h2>' + (live ? esc(w.name) + ' is live' : 'Provisioning ' + esc(w ? w.name : '')) + '</h2></header><div class="pb">' + (w ? pvDone(w, live) : '') + '</div></section>';
      return { h1: 'Provision a workspace', sub: live ? 'Done. The workspace is in the table and in the revenue bar.' : 'Setting up ' + (w ? w.name : '') + '…', html: h + '</div>', crumb: 'Provision', after: null };
    }
    h += '<ol class="steps" aria-label="Steps">' + PSTEPS.map(function (n, i) { var k = i + 1; return '<li' + (k === pv.step ? ' aria-current="step"' : '') + (k < pv.step ? ' class="done"' : '') + '>' + (k < pv.step ? '<button type="button" data-a="pv-goto" data-s="' + k + '"><span class="n">' + k + '</span>' + n + '</button>' : '<span class="n">' + k + '</span>' + n) + '</li>'; }).join('') + '</ol>';
    h += '<p class="stepm">Step ' + pv.step + ' of 5 · <b style="color:var(--ink)">' + PSTEPS[pv.step - 1] + '</b></p>';
    h += '<section class="panel"><header><h2>' + pv.step + ' · ' + PSTEPS[pv.step - 1] + '</h2></header><div class="pb" id="pv-body">' + pvBody() + '<div class="fnav">' + (pv.step > 1 ? '<button type="button" class="btn" data-a="pv-back">Back</button>' : '<a class="btn" href="#/workspaces">Cancel</a>') + '<span class="sp"></span>' + (pv.step < 5 ? '<button type="button" class="btn pri" data-a="pv-next">Continue</button>' : '<button type="button" class="btn pri" data-a="pv-create">Create workspace</button>') + '</div></div></section></div>';
    return { h1: 'Provision a workspace', sub: (pv.req ? 'From request ' + pv.req + ' · ' : '') + 'A branded Ordwell workspace for a client, under your name', html: h, crumb: 'Provision' };
  };
  function pvDone(w, live) {
    return '<ul class="run" id="run">' + runSteps(w) + '</ul>' + (live ? '<div class="calc" style="margin:14px 0"><div><span>Monthly price</span><b>' + inr(rev(w)) + '</b></div><div><span>Your margin</span><b>' + inr(mg(w)) + '</b></div></div><div class="fnav" style="margin-top:0"><button type="button" class="btn" data-a="open-as" data-id="' + w.id + '">Open as this workspace</button><span class="sp"></span><a class="btn pri" href="#/workspaces/' + w.id + '">See it in Workspaces</a></div>' : (w.dns || w.goLive ? '' : '<p class="note-s">It stays in Provisioning until the CNAME resolves. <a href="#/workspaces/' + w.id + '" style="text-decoration:underline">Open the workspace</a> and check DNS when it is added.</p>'));
  }
  function pvValidate() {
    pv.err = '';
    if (pv.step === 1 && !pv.name.trim()) { pv.err = 'Give the workspace a name so the client knows where they are.'; return false; }
    if (pv.step === 3 && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(pv.domain.trim())) { pv.err = 'That does not look like a domain. Try work.clientname.in.'; return false; }
    if (pv.step === 4) { pv.seats = Math.max(1, Math.min(500, Math.round(+pv.seats || 1))); }
    return true;
  }
  function pvCreate() {
    var n = Date.now(), w = { id: 'w' + (n % 1e6), name: pv.name.trim(), client: (pv.client || pv.name).trim(), plan: pv.plan, seats: Math.max(1, +pv.seats || 1), used: 0, accent: pv.accent, initial: (pv.initial || pv.name).slice(0, 2).toUpperCase(), domain: pv.domain.trim().toLowerCase(), dns: pv.dnsOk, status: 'provisioning', act: n, since: n, note: pv.note.trim(), goLive: pv.dnsOk ? n + 3400 : null };
    st.ws.push(w); flash = w.id; pv.done = w.id;
    var l = pv.req && byId(LS, pv.req); if (l) { l.stage = 'trial'; l.ws = w.id; (l.log = l.log || []).push({ at: n, text: 'Workspace ' + w.name + ' provisioned. Trial started.' }); }
    refresh(); toast('Provisioning ' + w.name);
  }

  /* ---------- Conversations ---------- */
  var CS = { bot: ['Assistant replying', ''], handed: ['Waiting for you', 'warn'], you: ['You are replying', 'ok'], resolved: ['Resolved', ''] };
  V.chats = function (r) {
    var sel = r.id ? byId(st.chats, r.id) : null; if (r.id && !sel) sel = null;
    var cs = st.chats.slice().sort(function (a, b) { return b.at - a.at; }), h = '<div class="chats' + (sel ? ' th' : '') + '"><div class="clist" role="list" aria-label="Conversations">' + (cs.length ? cs.map(function (c) { var last = c.msgs[c.msgs.length - 1]; return '<a class="cth" role="listitem" href="#/chats/' + c.id + '" aria-current="' + (sel && sel.id === c.id) + '"><span class="t"><b>' + esc(c.name) + '</b><time>' + ago(c.at) + '</time></span><span class="s">' + esc(c.company) + ' · ' + esc(c.topic) + '</span><span class="b"><span class="pill ' + CS[c.status][1] + '">' + CS[c.status][0] + '</span></span><span class="s">' + esc(last ? last.t : '') + '</span></a>'; }).join('') : '<div class="empty"><h3>No conversations yet</h3><p>Chats from the site assistant land here.</p></div>') + '</div>';
    if (sel) {
      var c = sel, lead = c.lead && byId(LS, c.lead);
      h += '<div class="cpane"><div class="chead"><a class="btn sm back-l" href="#/chats">' + ic('back', 's') + 'All chats</a><div><h2>' + esc(c.name) + '</h2><span class="muted" style="font-size:12.5px">' + esc(c.company) + ' · ' + esc(c.topic) + '</span></div><span class="pill ' + CS[c.status][1] + '">' + CS[c.status][0] + '</span>' + (lead ? '<a class="btn sm" href="#/requests/' + lead.id + '">Request ' + esc(lead.id) + '</a>' : '') +
        '<div class="acts">' + (c.status === 'bot' || c.status === 'handed' ? '<button type="button" class="btn pri sm" data-a="ch-take" data-id="' + c.id + '" data-fk="take">Take over</button>' : '') + (c.status === 'you' ? '<button type="button" class="btn sm" data-a="ch-hand" data-id="' + c.id + '" data-fk="hand">Hand back</button>' : '') + (c.status !== 'resolved' ? '<button type="button" class="btn sm" data-a="ch-resolve" data-id="' + c.id + '" data-fk="resolve">Resolve</button>' : '<button type="button" class="btn sm" data-a="ch-reopen" data-id="' + c.id + '">Reopen</button>') + '</div></div>' +
        '<div class="msgs" id="msgs" tabindex="0" role="log" aria-label="Transcript">' + c.msgs.map(function (m) { return m.f === 's' ? '<div class="m sys">' + esc(m.t) + '</div>' : '<div class="m ' + m.f + '"><small>' + (m.f === 'v' ? esc(c.name.split(' ')[0]) : m.f === 'a' ? 'Assistant' : 'You') + ' · ' + new Date(m.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + '</small>' + esc(m.t) + '</div>'; }).join('') + '</div>' +
        '<div class="compose">' + (c.status === 'you' ? '<label class="sr" for="ch-reply">Reply to ' + esc(c.name) + '</label><textarea class="inp" id="ch-reply" rows="2" placeholder="Reply as Fernhill Digital" data-fk="reply"></textarea><button type="button" class="btn pri" data-a="ch-send" data-id="' + c.id + '">Send</button>' : '<p>' + (c.status === 'resolved' ? 'This chat is resolved. Reopen it to reply.' : 'The assistant is handling this chat. Take over to reply yourself.') + '</p>') + '</div></div>';
    } else h += '<div class="cpane"><div class="empty" style="margin:auto"><h3>Pick a conversation</h3><p>Read the transcript, take it over, reply as Fernhill Digital, hand it back or resolve it.</p></div></div>';
    return { h1: 'Conversations', sub: plural(st.chats.filter(function (c) { return c.status !== 'resolved'; }).length, 'open chat', 'open chats') + ' with the site assistant · ' + st.chats.filter(function (c) { return c.status === 'handed'; }).length + ' waiting for you', html: h + '</div>', crumb: 'Conversations', after: function () { var m = $('#msgs'); if (m) m.scrollTop = m.scrollHeight; } };
  };
  function sysMsg(c, t) { c.msgs.push({ f: 's', t: t, at: Date.now() }); c.at = Date.now(); }

  /* ---------- Payouts ---------- */
  function months() {
    var t = totals(), od = overdueWs().reduce(function (s, w) { return s + rev(w); }, 0), now = new Date(), rows = [];
    st.hist.forEach(function (h, i) { var d = new Date(now.getFullYear(), now.getMonth() - (st.hist.length - i), 1); rows.push({ m: MON[d.getMonth()] + ' ' + d.getFullYear(), rev: h[0], cost: h[1], mg: h[0] - h[1], paid: true }); });
    rows.push({ m: MON[now.getMonth()] + ' ' + now.getFullYear(), rev: t.rev - od, cost: t.cost, mg: t.rev - od - t.cost, paid: false, od: od, cur: true });
    return rows;
  }
  V.payouts = function () {
    var rows = months(), max = Math.max.apply(null, rows.map(function (r) { return r.rev; })), cur = rows[rows.length - 1], tot = rows.reduce(function (a, r) { return { rev: a.rev + r.rev, cost: a.cost + r.cost, mg: a.mg + r.mg }; }, { rev: 0, cost: 0, mg: 0 });
    var h = '<section class="panel" aria-labelledby="pc-h"><header><h2 id="pc-h">Revenue collected, split into platform cost and your margin</h2></header><div class="pb"><div class="bars" role="img" aria-label="' + esc(rows.map(function (r) { return r.m + ': collected ' + inr(r.rev) + ', margin ' + inr(r.mg); }).join('; ')) + '">' +
      rows.map(function (r) { return '<div class="bar"><span class="v">' + inrk(r.mg) + '</span><div class="stk" style="height:calc((100% - 20px) * ' + (r.rev / max).toFixed(3) + ')"><div class="mg" style="flex:' + r.mg + ' 1 0"></div><div class="co" style="flex:' + r.cost + ' 1 0"></div></div></div>'; }).join('') + '</div><div class="lbls" aria-hidden="true">' + rows.map(function (r) { return '<span>' + r.m.split(' ')[0] + '</span>'; }).join('') + '</div><div class="legend"><span><span class="sq"></span>Platform cost paid to Ordwell</span><span><span class="sq m"></span>Your margin (figure above each bar)</span></div></div></section>';
    h += '<div class="panel tw"><table class="tbl"><thead><tr><th scope="col">Month</th><th scope="col" class="r">Revenue collected</th><th scope="col" class="r">Platform cost</th><th scope="col" class="r">Your margin</th><th scope="col">Payout</th></tr></thead><tbody>' +
      rows.slice().reverse().map(function (r) { return '<tr style="cursor:default"><td class="nm" data-l="Month"><b>' + r.m + '</b></td><td class="r mono" data-l="Revenue collected">' + inr(r.rev) + '</td><td class="r mono" data-l="Platform cost">' + inr(r.cost) + '</td><td class="r mono" data-l="Your margin"><b>' + inr(r.mg) + '</b></td><td data-l="Payout">' + (r.paid ? '<span class="pill ok">Paid out</span>' : '<span class="pill warn">Open · pays out 5 ' + MON[(new Date().getMonth() + 1) % 12] + '</span>') + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr><td class="nm" data-l="">Last 6 months</td><td class="r mono" data-l="Revenue collected">' + inr(tot.rev) + '</td><td class="r mono" data-l="Platform cost">' + inr(tot.cost) + '</td><td class="r mono" data-l="Your margin">' + inr(tot.mg) + '</td><td></td></tr></tfoot></table></div>';
    if (cur.od) h += '<p class="note-s">' + esc(MON[new Date().getMonth()]) + ' excludes ' + inr(cur.od) + ' that is overdue. The platform cost is still due in full, so the margin shows lower until it is paid.</p>';
    return { h1: 'Payouts', sub: 'Your margin this month so far: ' + inr(cur.mg) + ' · the last six months added up to ' + inr(tot.mg), html: h, crumb: 'Payouts' };
  };

  /* ---------- palette ---------- */
  var palI = 0, palItems = [];
  function palOpen() { $('#pal').hidden = false; $('#shell').inert = true; $('#tabbar').inert = true; var q = $('#pal-q'); q.value = ''; palDraw(); q.focus(); }
  function palClose() { $('#pal').hidden = true; if ($('#so').hidden) { $('#shell').inert = false; $('#tabbar').inert = false; } var b = $('[data-a=palette]'); if (b && b.offsetParent) b.focus(); }
  function palDraw() {
    var q = $('#pal-q').value.trim().toLowerCase(), it = [];
    [['Home', '#/home'], ['Requests', '#/requests'], ['Workspaces', '#/workspaces'], ['Conversations', '#/chats'], ['Payouts', '#/payouts'], ['Provision a workspace', '#/provision']].forEach(function (v) { it.push({ g: 'Go to', l: v[0], s: '', h: v[1] }); });
    LS.forEach(function (l) { it.push({ g: 'Requests', l: l.company, s: l.name + ' · ' + l.id, h: '#/requests/' + l.id }); });
    st.ws.forEach(function (w) { it.push({ g: 'Workspaces', l: w.name, s: w.client, h: '#/workspaces/' + w.id }); });
    st.chats.forEach(function (c) { it.push({ g: 'Conversations', l: c.name, s: c.company, h: '#/chats/' + c.id }); });
    palItems = it.filter(function (x) { return !q || (x.l + ' ' + x.s).toLowerCase().indexOf(q) > -1; }).slice(0, 14); palI = Math.min(palI, Math.max(0, palItems.length - 1));
    var g = '', h = ''; palItems.forEach(function (x, i) { if (x.g !== g) { g = x.g; h += '<div class="g" role="presentation">' + g + '</div>'; } h += '<button type="button" class="pal-i" role="option" id="pi' + i + '" data-a="pal-go" data-i="' + i + '" aria-selected="' + (i === palI) + '">' + esc(x.l) + (x.s ? '<small>' + esc(x.s) + '</small>' : '') + '</button>'; });
    $('#pal-l').innerHTML = h || '<p class="pal-none">Nothing matches “' + esc(q) + '”.</p>'; var qi = $('#pal-q'); if (palItems.length) qi.setAttribute('aria-activedescendant', 'pi' + palI); else qi.removeAttribute('aria-activedescendant');
  }

  /* ---------- drag between stages ---------- */
  var dg = null, jd = false;
  document.addEventListener('pointerdown', function (e) {
    var c = e.target.closest && e.target.closest('.rcard'); if (!c || e.button !== 0 || e.pointerType === 'touch' || !c.closest('#board')) return;
    dg = { c: c, x: e.clientX, y: e.clientY, id: e.pointerId, on: false, clone: null, last: null };
  });
  document.addEventListener('pointermove', function (e) {
    if (!dg || e.pointerId !== dg.id) return;
    if (!dg.on) { if (Math.abs(e.clientX - dg.x) + Math.abs(e.clientY - dg.y) < 6) return; dg.on = true; var r = dg.c.getBoundingClientRect(); dg.clone = dg.c.cloneNode(true); dg.clone.classList.add('drag'); dg.clone.style.width = r.width + 'px'; document.body.appendChild(dg.clone); dg.c.classList.add('lift'); }
    e.preventDefault(); dg.clone.style.left = (e.clientX - 40) + 'px'; dg.clone.style.top = (e.clientY - 18) + 'px';
    var u = document.elementFromPoint(e.clientX, e.clientY), tg = u && u.closest('.bcol'); if (dg.last && dg.last !== tg) dg.last.classList.remove('over'); if (tg) tg.classList.add('over'); dg.last = tg;
  }, { passive: false });
  function dEnd(e, cancel) {
    if (!dg || e.pointerId !== dg.id) return; var s = dg; dg = null; if (!s.on) return; jd = true; setTimeout(function () { jd = false; }, 80);
    s.clone.remove(); s.c.classList.remove('lift'); if (s.last) s.last.classList.remove('over');
    if (!cancel && s.last) { var l = byId(LS, s.c.getAttribute('data-id')); if (l) moveLead(l, s.last.getAttribute('data-stage')); }
  }
  document.addEventListener('pointerup', function (e) { dEnd(e); }); document.addEventListener('pointercancel', function (e) { dEnd(e, true); });

  /* ---------- actions ---------- */
  var A = {
    'so-close': function () { if (soKind === 'route') { var v = route().v; go('#/' + v); } else hideSO(); },
    'req-open': function (el) { if (jd) return; go('#/requests/' + el.getAttribute('data-id')); },
    'rs-tab': function (el) { rsTab = el.getAttribute('data-s'); render(); var b = $('.kcap[data-s="' + rsTab + '"]'); if (b) b.focus(); },
    'req-stage': function (el) { var l = byId(LS, el.getAttribute('data-id')); moveLead(l, el.getAttribute('data-s'), true); },
    'req-slot': function (el) { var l = byId(LS, el.getAttribute('data-id')); l.slot = el.getAttribute('data-slot'); if (stageOf(l) === 'new') l.stage = 'demo'; (l.log = l.log || []).push({ at: Date.now(), text: 'Walkthrough booked: ' + l.slot + '. Invite sent to ' + l.email + '.' }); refresh(); toast('Booked ' + l.slot + ' with ' + l.name); },
    'req-unbook': function (el) { var l = byId(LS, el.getAttribute('data-id')); l.slot = ''; (l.log = l.log || []).push({ at: Date.now(), text: 'Slot released.' }); refresh(); },
    'req-note': function (el) { var i = $('#rq-note'), l = byId(LS, el.getAttribute('data-id')); if (!i.value.trim()) { i.focus(); return; } (l.log = l.log || []).push({ at: Date.now(), text: i.value.trim() }); refresh(); },
    'new-req': function () { newReqForm(); },
    'ws-open': function (el, e) { if (e.target.closest('button') && e.target.closest('button') !== el && el.tagName === 'TR') return; go('#/workspaces/' + el.getAttribute('data-id')); },
    'ws-filter': function (el) { wsF = el.getAttribute('data-f'); render(); var b = $('.kcap[data-f="' + wsF + '"]'); if (b) b.focus(); },
    'ws-sort': function (el) { var k = el.getAttribute('data-k'); wsS = { k: k, d: wsS.k === k ? -wsS.d : (k === 'name' || k === 'client' ? 1 : -1) }; render(); var b = $('[data-a=ws-sort][data-k="' + k + '"]'); if (b) b.focus(); },
    'ws-seats': function (el) { var w = byId(st.ws, el.getAttribute('data-id')); w.seats += 5; refresh(); toast('5 seats added to ' + w.name, { act: { label: 'Undo', fn: function () { w.seats -= 5; refresh(); } } }); },
    'ws-remind': function (el) { var w = byId(st.ws, el.getAttribute('data-id')); toast('Reminder sent to ' + w.client + '’s accounts contact'); },
    'ws-dns': function (el) { var w = byId(st.ws, el.getAttribute('data-id')); w.dns = true; w.goLive = Date.now() + 2500; (w.note = w.note || ''); refresh(); toast('DNS verified for ' + w.domain + '. Going live.'); },
    'open-as': function (el) { rebrand(byId(st.ws, el.getAttribute('data-id'))); },
    'restore': function () { restoreBrand(); },
    'pv-col': function (el) { pv.accent = el.getAttribute('data-c'); render(); var b = $('.sw[aria-pressed=true]'); if (b) b.focus(); },
    'pv-plan': function (el) { pv.plan = el.getAttribute('data-p'); render(); var b = $('.kcap[data-p="' + pv.plan + '"]'); if (b) b.focus(); },
    'pv-next': function () { if (!pvValidate()) { render(); var e = $('[aria-invalid=true]'); if (e) e.focus(); return; } pv.step++; render(); $('#main').scrollTop = 0; var f = $('#pv-body input,#pv-body textarea,#pv-body button.sw'); if (f) f.focus({ preventScroll: true }); },
    'pv-back': function () { pv.err = ''; pv.step--; render(); $('#main').scrollTop = 0; },
    'pv-goto': function (el) { pv.step = +el.getAttribute('data-s'); render(); },
    'pv-check': function () { pv.checking = true; render(); setTimeout(function () { if (!pv) return; pv.checking = false; pv.dnsOk = true; if (cur.v === 'provision' && !pv.done) { render(); var b = $('[data-a=pv-check]'); if (b) b.focus(); } }, 900); },
    'pv-create': function () { if (!pv.name.trim()) { pv.step = 1; pvValidate(); render(); return; } pvCreate(); },
    'ch-take': function (el) { var c = byId(st.chats, el.getAttribute('data-id')); c.status = 'you'; sysMsg(c, 'You took over this chat. The assistant is paused.'); refresh(); },
    'ch-hand': function (el) { var c = byId(st.chats, el.getAttribute('data-id')); c.status = 'bot'; sysMsg(c, 'Handed back to the assistant.'); refresh(); },
    'ch-resolve': function (el) { var c = byId(st.chats, el.getAttribute('data-id')); c.status = 'resolved'; sysMsg(c, 'Resolved.'); refresh(); toast('Chat with ' + c.name + ' resolved'); },
    'ch-reopen': function (el) { var c = byId(st.chats, el.getAttribute('data-id')); c.status = 'bot'; sysMsg(c, 'Reopened.'); refresh(); },
    'ch-send': function (el) { var c = byId(st.chats, el.getAttribute('data-id')), t = $('#ch-reply'); if (!t.value.trim()) { t.focus(); return; } c.msgs.push({ f: 'y', t: t.value.trim(), at: Date.now() }); c.at = Date.now(); refresh(); var n = $('#ch-reply'); if (n) n.focus(); },
    'new': function (el) { menu(el, [{ head: 'Create' }, { label: 'Provision a workspace', ico: 'plus', fn: function () { if (pv && pv.done) pv = null; go('#/provision'); } }, { label: 'Add a request', ico: 'inbox', fn: newReqForm }]); },
    'more': function (el) { menu(el, [{ label: 'Payouts', fn: function () { go('#/payouts'); } }, { label: 'Provision a workspace', fn: function () { if (pv && pv.done) pv = null; go('#/provision'); } }, { label: 'Open the app', fn: function () { location.href = 'index.html'; } }, { label: 'Public request form', fn: function () { location.href = 'pricing.html#walkthrough'; } }, { label: 'Reset console', fn: resetAll }]); },
    'palette': function () { palOpen(); },
    'pal-go': function (el) { var it = palItems[+el.getAttribute('data-i')]; palClose(); if (it) go(it.h); },
    'reset': function (el) { if (el.getAttribute('data-armed') === 'true') { resetAll(); return; } el.setAttribute('data-armed', 'true'); el.querySelector('span').textContent = 'Click again to reset'; setTimeout(function () { el.removeAttribute('data-armed'); el.querySelector('span').textContent = 'Reset console'; }, 4000); },
    'ws-sortsel': function () { }
  };
  function resetAll() { st = seedState(); LS = seedLeads(); st.merged = true; pv = null; flash = ''; saveAll(); hideSO(); go('#/home'); render(); toast('Console reset'); }
  function newReqForm() {
    showSO({ title: 'Add a request', sub: 'Log a walkthrough request that came in by phone or email', body: '<div class="fld"><label for="nr-co">Company</label><input class="inp" id="nr-co" autocomplete="off"></div><div class="two"><div class="fld"><label for="nr-nm">Contact name</label><input class="inp" id="nr-nm" autocomplete="off"></div><div class="fld"><label for="nr-em">Email</label><input class="inp" id="nr-em" type="email" autocomplete="off"></div></div><div class="two"><div class="fld"><label for="nr-tm">Team size</label><select class="inp" id="nr-tm"><option>1–10</option><option>11–25</option><option>26–60</option><option>60+</option></select></div><div class="fld"><label for="nr-pl">Plan</label><select class="inp" id="nr-pl"><option>Team</option><option selected>Business</option><option>Agency</option></select></div></div><div class="fld"><label for="nr-nt">Their note</label><textarea class="inp" id="nr-nt" rows="3"></textarea></div><p class="err" id="nr-err" hidden></p>', foot: '<button type="button" class="btn" data-a="so-close">Cancel</button><span class="sp"></span><button type="button" class="btn pri" data-a="nr-save">Add request</button>' }, 'form');
    $('#nr-co').focus();
  }
  A['nr-save'] = function () {
    var co = $('#nr-co').value.trim(), nm = $('#nr-nm').value.trim(), em = $('#nr-em').value.trim(), er = $('#nr-err');
    if (!co || !nm || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { er.hidden = false; er.textContent = 'Add the company, a contact name and a full email address.'; (!co ? $('#nr-co') : !nm ? $('#nr-nm') : $('#nr-em')).focus(); return; }
    var id = 'L-' + (LS.reduce(function (m, l) { return Math.max(m, +String(l.id).slice(2) || 0); }, 2400) + 1);
    LS.unshift({ id: id, name: nm, email: em, company: co, team: $('#nr-tm').value, plan: $('#nr-pl').value, note: $('#nr-nt').value.trim(), at: Date.now(), stage: 'new', source: 'Phone or email', log: [] }); hideSO(); refresh(); toast(co + ' added to New');
  };

  document.addEventListener('click', function (e) {
    if (pop && !e.target.closest('.pop') && !e.target.closest('[data-a=new],[data-a=more]')) closePop();
    var el = e.target.closest('[data-a]'); if (!el) return; var f = A[el.getAttribute('data-a')]; if (!f || el.disabled) return;
    if (el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href').charAt(0) !== '#') return;
    if (el.tagName === 'A') e.preventDefault(); f(el, e);
  });
  document.addEventListener('change', function (e) { if (e.target.id === 'ws-sort') { var k = e.target.value; wsS = { k: k, d: k === 'name' || k === 'client' ? 1 : -1 }; render(); } });
  document.addEventListener('input', function (e) {
    var t = e.target, f = t.getAttribute && t.getAttribute('data-f'); if (!f || !pv) return;
    if (f === 'name') { pv.name = t.value; if (!pv.iTouched) pv.initial = t.value.trim().charAt(0).toUpperCase(); if (!pv.dTouched) pv.domain = 'work.' + slug(pv.client || t.value) + '.in'; pv.err = ''; var er = $('#pv-err'); if (er) er.remove(); t.removeAttribute('aria-invalid'); upPrev(); var ii = $('#pv-ini'); if (ii) ii.value = pv.initial; }
    if (f === 'client') { pv.client = t.value; if (!pv.dTouched) pv.domain = 'work.' + slug(t.value || pv.name) + '.in'; upPrev(); }
    if (f === 'initial') { pv.initial = t.value.toUpperCase(); pv.iTouched = true; upPrev(); }
    if (f === 'hex') { var v = t.value.trim(); if (v.charAt(0) !== '#') v = '#' + v; if (/^#[0-9a-fA-F]{6}$/.test(v)) { pv.accent = v; upPrev(); var r = ratio(v, onC(v)), c = $('#pv-ct'); if (c) c.innerHTML = (onC(v) === '#FFFFFF' ? 'White' : 'Dark') + ' text on this colour: <b>' + r.toFixed(1) + ':1</b> ' + (r >= 4.5 ? 'passes WCAG AA' : 'is below 4.5:1, pick a darker or lighter colour'); $$('.sw').forEach(function (s) { s.setAttribute('aria-pressed', s.getAttribute('data-c').toLowerCase() === v.toLowerCase()); }); } }
    if (f === 'domain') { pv.domain = t.value; pv.dTouched = true; pv.dnsOk = false; pv.err = ''; var er2 = $('#pv-err'); if (er2) er2.remove(); t.removeAttribute('aria-invalid'); var ck = $('[data-a=pv-check]'); if (ck) ck.disabled = false; var pl = $('.chk .pill'); if (pl) { pl.className = 'pill'; pl.textContent = 'Not verified yet'; } var dd = $$('.dns dd'); if (dd[1]) dd[1].textContent = (pv.domain.split('.')[0] || 'work'); }
    if (f === 'seats') { pv.seats = t.value; var c2 = $('#calc'); if (c2) { var tmp = document.createElement('div'); tmp.innerHTML = pvCalc(); c2.outerHTML = tmp.firstChild.outerHTML; } }
    if (f === 'note') pv.note = t.value;
  });
  function upPrev() { var p = $('#pv-prev'); if (p) p.outerHTML = pvPrev(); }
  document.addEventListener('keydown', function (e) {
    var k = e.key;
    if ((e.metaKey || e.ctrlKey) && (k === 'k' || k === 'K')) { e.preventDefault(); if ($('#pal').hidden) palOpen(); else palClose(); return; }
    if (!$('#pal').hidden) {
      if (k === 'Escape') { e.preventDefault(); palClose(); } else if (k === 'ArrowDown') { e.preventDefault(); palI = Math.min(palItems.length - 1, palI + 1); palDraw(); var s = $('#pi' + palI); if (s) s.scrollIntoView({ block: 'nearest' }); } else if (k === 'ArrowUp') { e.preventDefault(); palI = Math.max(0, palI - 1); palDraw(); var s2 = $('#pi' + palI); if (s2) s2.scrollIntoView({ block: 'nearest' }); } else if (k === 'Enter') { e.preventDefault(); var it = palItems[palI]; palClose(); if (it) go(it.h); }
      return;
    }
    if (k === 'Escape') { if (pop) { closePop(); return; } if (!$('#so').hidden) { A['so-close'](); } return; }
    if (k === 'Enter' && e.target.id === 'pv-name' && pv) { e.preventDefault(); A['pv-next'](); }
  });
  document.addEventListener('input', function (e) { if (e.target.id === 'pal-q') { palI = 0; palDraw(); } });
  window.addEventListener('hashchange', function () { closePop(); onRoute(); });
  window.addEventListener('storage', function (e) { if (e.key === LK) { var n = rd(LK); if (Array.isArray(n)) { LS = n; importChats(); if (soKind !== 'form') refresh(); } } });

  /* ---------- go-live ticker: a provisioning workspace with a verified domain goes live on its own ---------- */
  setInterval(function () {
    var ch = false; st.ws.forEach(function (w) { if (w.status === 'provisioning' && w.goLive && Date.now() >= w.goLive) { w.status = 'live'; w.act = Date.now(); w.goLive = null; w.dns = true; ch = true; } });
    if (ch) { saveAll(); if (cur.v === 'provision' && pv && pv.done) { render(); toast('Workspace is live'); } else if (['home', 'workspaces', 'payouts'].indexOf(cur.v) > -1) { render(); } if (soKind === 'route') syncSO(); }
    else if (cur.v === 'provision' && pv && pv.done) { var w = byId(st.ws, pv.done), run = $('#run'); if (w && run && w.status !== 'live') run.innerHTML = runSteps(w); }
  }, 500);

  /* ---------- boot ---------- */
  mergeLeads(); importChats(); saveAll();
  if (!location.hash) history.replaceState(null, '', '#/home');
  onRoute();
})();
