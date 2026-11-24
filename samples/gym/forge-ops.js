/* Forge Ops: the front-desk operating app (staff.html). Hash routes, one render per view, localStorage only (forge:*).
   Work-card principles from BUILD-BRIEF: focus mode with an outcome grid, context (last remark) first, "+ Add" inline,
   progress and time chips, safe bulk with a preview, queues you can Play. Nothing is ever sent; messages are copied or logged. */
(function () {
  'use strict';
  var F = window.Forge, esc = F.esc, reduce = F.reduce;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var view = $('#view'), DAY = 864e5;

  /* ---------- small helpers ---------- */
  function dIso(n) { return F.iso(new Date(Date.now() + n * DAY)); }
  function dAgo(d, h, m) { var t = new Date(); t.setDate(t.getDate() - d); t.setHours(h, m || 0, 0, 0); if (t > new Date()) t = new Date(Date.now() - 36e5 * (d + 1)); return t.toISOString(); }
  function seedOnce(k, fn) { var v = F.get(k, null); if (v == null) { v = fn(); F.set(k, v); } return v; }
  function first(n) { return String(n).split(' ')[0]; }
  function initials(n) { var p = String(n).replace(/[^A-Za-z ’']/g, '').trim().split(/\s+/); return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); }
  function avc(n) { return 'c' + (F.hash(n) % 5 + 1); }
  function av(n, cls) { return '<span class="av ' + avc(n) + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + esc(initials(n)) + '</span>'; }
  function hm(iso) { var d = new Date(iso); return F.pad(d.getHours()) + ':' + F.pad(d.getMinutes()); }
  function ago(iso) { var m = Math.round((Date.now() - new Date(iso)) / 6e4); if (m < 1) return 'now'; if (m < 60) return m + 'm'; var h = Math.round(m / 60); if (h < 24) return h + 'h'; return Math.round(h / 24) + 'd'; }
  function agoL(iso) { var a = ago(iso); return a === 'now' ? 'just now' : a.replace('m', ' min').replace('h', ' h').replace('d', a === '1d' ? ' day' : ' days') + ' ago'; }
  function daysTo(iso) { return Math.round((new Date(iso.slice(0, 10) + 'T00:00') - new Date(F.iso(new Date()) + 'T00:00')) / DAY); }
  function rel(iso) { var n = daysTo(iso); return n === 0 ? 'today' : n === 1 ? 'tomorrow' : n === -1 ? 'yesterday' : n < 0 ? (-n) + ' days ago' : 'in ' + n + ' days'; }
  function bn(b) { return F.branches[b] ? F.branches[b].name : 'Both'; }
  function plural(n, a, b) { return n + ' ' + (n === 1 ? a : (b || a + 's')); }
  var branch = F.get('ops-branch', '');
  function inB(x) { return !branch || x.branch === branch || x.home === branch; }
  function copy(text) { try { navigator.clipboard.writeText(text); } catch (e) {} }
  var SVG = function (d, vb) { return '<svg viewBox="' + (vb || '0 0 24 24') + '" aria-hidden="true">' + d + '</svg>'; };
  var IC = {
    today: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
    trials: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    members: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 010 7M18 14.8c2 .7 3.2 2.5 3.6 5.2"/>',
    checkin: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 18h3v3M14 21h1M21 14v1"/>',
    classes: '<rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    renewals: '<path d="M20 11a8 8 0 00-14.6-4.5L3 9M4 13a8 8 0 0014.6 4.5L21 15"/><path d="M3 4v5h5M21 20v-5h-5"/>',
    pt: '<circle cx="10" cy="8" r="4"/><path d="M3 20c1-3.8 3.8-6 7-6 1.5 0 2.9.5 4 1.3M15 19l2 2 4-5"/>',
    messages: '<path d="M4 5h16v11H9l-5 4z"/>',
    reports: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 005 5L15 12l5 2v4a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2z"/>',
    wa: '<path d="M4 20l1.3-4A8 8 0 1112 20a8 8 0 01-4-1z"/><path d="M9 9c0 3 2.5 6 6 6"/>',
    ok: '<path d="M5 12.5l4.5 4.5L19 7"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    star: '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4 6.5 20.3l1-6.2L3 9.7l6.2-.9z"/>', snow: '<path d="M12 2v20M4 7l16 10M20 7L4 17"/>',
    empty: '<rect x="8" y="12" width="40" height="36"/><path d="M8 22h40M18 8v8M38 8v8M20 34h16"/>'
  };
  var NAV = [['today', 'Today'], ['trials', 'Trials'], ['members', 'Members'], ['checkin', 'Check-in'], ['classes', 'Classes'], ['renewals', 'Renewals'], ['pt', '1:1s'], ['messages', 'Messages'], ['reports', 'Reports'], ['settings', 'Settings']];
  var TABS = ['today', 'checkin', 'trials', 'classes'];

  /* ---------- data (seeded once, then live in localStorage) ---------- */
  var REMARKS = { 'Karan Malhotra': 'Asked about switching to yearly last month. Mention 2 months free.', 'Ishita Rao': 'Racing HYROX in Jan; renewal is a formality. Ask about Race Team doubles.', 'Farhan Siddiqui': 'Only 3 visits in 30 days. Works night shifts; Off-Peak may suit him better.', 'Ananya Gupta': 'Moved house closer to Gurugram. Check if home floor should change.', 'Rohit Chawla': 'No visits for 19 days. Knee niggle in October; offer a physio check.', 'Simran Kohli': 'Pays by UPI autopay; card expired last time. Confirm UPI ID.', 'Dev Arora': 'Wants a deload week before renewing. Kofi has a note.', 'Nisha Pillai': 'Exams in December. A 4-week freeze may save the membership.' };
  function seedAll() {
    seedOnce('signups', function () { return [
      { id: 'su1', memberNo: 'FM-20388', name: 'Rhea Kapoor', phone: '+91 98••• ••144', email: 'rhea.k@example.com', plan: 'Club', planId: 'club', cycle: 'm', home: 'saket', start: dIso(2), renews: dIso(32), parqYes: 0, paid: 6500, method: 'UPI', at: dAgo(0, 9), status: 'new' },
      { id: 'su2', memberNo: 'FM-20391', name: 'Vikrant Sood', phone: '+91 99••• ••618', email: 'vikrant@example.com', plan: 'Race Team', planId: 'race', cycle: 'y', home: 'gurugram', start: dIso(5), renews: dIso(370), parqYes: 1, paid: 98000, method: 'Card', at: dAgo(1, 18), status: 'new' },
      { id: 'su3', memberNo: 'FM-20379', name: 'Meenal Joshi', phone: '+91 97••• ••205', email: 'meenal.j@example.com', plan: 'Off-Peak', planId: 'offpeak', cycle: 'm', home: 'saket', start: dIso(-1), renews: dIso(29), parqYes: 0, paid: 2900, method: 'Netbanking', at: dAgo(3, 12), status: 'screen booked' }]; });
    seedOnce('freezes', function () { return [
      { id: 'fz1', memberNo: 'FM-20212', name: 'Nisha Pillai', plan: 'Club', branch: 'gurugram', weeks: 4, from: dIso(6), reason: 'Exams or work', newRenews: dIso(34), status: 'pending', at: dAgo(0, 8) },
      { id: 'fz2', memberNo: 'FM-20133', name: 'Arjun Bhalla', plan: 'Open Gym', branch: 'saket', weeks: 2, from: dIso(3), reason: 'Travel', newRenews: dIso(26), status: 'pending', at: dAgo(1, 15) },
      { id: 'fz3', memberNo: 'FM-20098', name: 'Tanvi Shah', plan: 'Club', branch: 'saket', weeks: 6, from: dIso(-10), reason: 'New baby', newRenews: dIso(40), status: 'approved', at: dAgo(12, 11) }]; });
    seedOnce('pt', function () { return [
      { id: 'pt1', coach: 'kofi', coachName: 'Kofi Mensah', type: 'Technique review', mins: 45, price: 2500, date: dIso(1), time: '11:00', branch: 'saket', name: 'Sahil Batra', phone: '+91 98••• ••771', status: 'requested', at: dAgo(0, 7) },
      { id: 'pt2', coach: 'tenzin', coachName: 'Tenzin Dolma', type: 'Race plan', mins: 45, price: 0, date: dIso(2), time: '16:00', branch: 'gurugram', name: 'Ishita Rao', phone: '+91 99••• ••102', status: 'confirmed', at: dAgo(1, 9) },
      { id: 'pt3', coach: 'meera', coachName: 'Meera Sethi', type: 'Programme consult', mins: 30, price: 1800, date: dIso(3), time: '12:00', branch: 'saket', name: 'Rohit Chawla', phone: '+91 97••• ••390', status: 'requested', at: dAgo(0, 11) }]; });
    seedOnce('inbox', function () { return [
      { id: 'ib1', kind: 'corporate', name: 'Priya Natarajan', company: 'Ledgerline (fintech)', email: 'people@ledgerline.example', size: '200+', branch: 'gurugram', at: dAgo(0, 10), status: 'new' },
      { id: 'ib2', kind: 'application', name: 'Karthik Menon', phone: '+91 98••• ••560', role: 'HYROX coach · Gurugram', years: '2–4', cert: 'HYROX Master Trainer', why: 'Raced 6 times, coached run clubs in Bengaluru for three years.', at: dAgo(1, 20), status: 'new' },
      { id: 'ib3', kind: 'corporate', name: 'Arvind Rao', company: 'Fieldnotes Studio', email: 'arvind@fieldnotes.example', size: '10–49', branch: 'saket', at: dAgo(4, 14), status: 'replied' }]; });
    if (!F.get('waitlist', null)) {
      var full = []; [0, 1].forEach(function (k) { var d = new Date(); d.setDate(d.getDate() + k); F.sessions(d).forEach(function (s) { if (!s.past) full.push(s); }); }); full.sort(function (a, b) { return (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) || a.left - b.left; });
      var names = [['Kabir Sood', '+91 98••• ••311'], ['Zara Ahmed', '+91 99••• ••842'], ['Ankit Verma', '+91 97••• ••126'], ['Leela Menon', '+91 98••• ••903']], wl = [];
      full.slice(0, 2).forEach(function (s, i) { names.slice(i * 2, i * 2 + 2).forEach(function (n, j) { wl.push({ id: 'wl' + i + j, slot: s.id, date: s.date, time: s.time, branch: s.branch, cls: s.cls.id, name: n[0], phone: n[1], memberNo: 'FM-20' + (150 + i * 10 + j), pos: j + 1, at: dAgo(0, 7 + j), promoted: false }); }); });
      F.set('waitlist', wl);
    }
    seedOnce('queue-log', function () { var t = new Date().toISOString(); return { 'Ishita Rao': { o: 'renewed', at: t }, 'Karan Malhotra': { o: 'renewed', at: t }, 'Simran Kohli': { o: 'noans', at: t } }; });
    if (!F.get('leads', null)) { var L = F.seedLeads(); L.forEach(function (l) { if (l.id === 's0' || l.id === 's3') l.phone = ''; }); F.set('leads', L); }
    seedOnce('checkins', function () { return F.checkinSeed().map(function (c) { return { name: c.name, no: '', branch: c.branch, at: c.at, what: c.what }; }); });
    seedOnce('ops-threads', seedThreads);
    seedChats();
    roster();
  }
  function leads() { return F.get('leads', []); }
  function saveLeads(l) { F.set('leads', l); }

  /* the member roster: renewals + at-risk + demo member + sign-ups + a generated club (42 people) */
  var FN = ['Aarav', 'Diya', 'Vihaan', 'Meher', 'Rohan', 'Saanvi', 'Anaya', 'Reyansh', 'Myra', 'Advait', 'Kiara', 'Dhruv', 'Tara', 'Nikhil', 'Riya', 'Yash', 'Kunal', 'Pooja', 'Imran', 'Sneha', 'Varun', 'Leela', 'Omar', 'Bhavna', 'Siddharth', 'Ayesha', 'Gautam', 'Fatima', 'Rahul', 'Anika'];
  var LN = ['Sharma', 'Khanna', 'Mehta', 'Iyer', 'Bose', 'Reddy', 'Nair', 'Gill', 'Chopra', 'Das', 'Joshi', 'Malik', 'Verma', 'Sethi', 'Sinha', 'Bajaj', 'Dutta', 'Kohli'];
  var PLAN = { 'Off-Peak': 2900, 'Open Gym': 3900, 'Club': 6500, 'Race Team': 9800 };
  function mkMember(name, o) {
    var h = F.hash(name), visits = o.visits != null ? o.visits : 2 + h % 15, plan = o.plan || ['Club', 'Club', 'Open Gym', 'Race Team', 'Off-Peak', 'Club'][h % 6];
    var heat = '', rate = Math.min(0.85, visits / 30 * 1.1), lastGap = o.last != null ? o.last : (h % 4);
    for (var i = 83; i >= 0; i--) { var r = (F.hash(name + i) % 100) / 100; heat += (o.frozenAt != null && i < o.frozenAt) ? 'f' : (i < lastGap ? '0' : (r < rate ? '1' : '0')); }
    if (lastGap === 0 && heat.slice(-1) === '0') heat = heat.slice(0, -1) + '1';
    var pays = [], price = PLAN[plan];
    for (var k = 0; k < 4; k++) pays.push({ date: dIso(-30 * k - (h % 9)), amt: price, method: ['UPI', 'Card', 'UPI autopay', 'Netbanking'][(h + k) % 4], ok: !(k === 0 && o.failed) });
    return { no: o.no || 'FM-2' + F.pad((h % 900) + 100).padStart(4, '0'), name: name, phone: o.phone || '+91 9' + (h % 9) + '••• ••' + (100 + h % 900), plan: plan, branch: o.branch || (h % 3 ? 'saket' : 'gurugram'),
      since: o.since || dIso(-(60 + h % 900)), renews: o.renews || dIso(8 + h % 50), visits: visits, last: lastGap, heat: heat, pays: pays,
      dues: o.failed ? price : 0, failed: !!o.failed, frozen: !!o.frozen, frozenTo: o.frozenTo || '', noshow: o.noshow || 0, tags: o.tags || [], notes: o.notes || [], isNew: !!o.isNew };
  }
  function roster() {
    var R = F.get('roster', null);
    if (!R) {
      R = [];
      F.members().forEach(function (m) { R.push(mkMember(m.name, { plan: m.plan, branch: m.branch, renews: m.renews.slice(0, 10), visits: m.streak, last: m.streak ? 1 : 19, failed: m.name === 'Simran Kohli', notes: REMARKS[m.name] ? [{ at: dAgo(6, 12), by: 'Priya', text: REMARKS[m.name] }] : [] })); });
      R.push(mkMember('Gaurav Nair', { plan: 'Open Gym', branch: 'gurugram', visits: 1, last: 16, noshow: 0 }));
      R.push(mkMember('Pallavi Sen', { plan: 'Club', branch: 'saket', visits: 2, last: 15, noshow: 3, notes: [{ at: dAgo(3, 18), by: 'Kofi', text: 'Missed three booked Heavy Hours in a row. Check in kindly; she mentioned a busy quarter.' }] }));
      R.push(mkMember('Aanya Kapoor', { no: 'FM-20417', phone: F.DEMO_MEMBER.phone, plan: 'Club', branch: 'saket', since: F.DEMO_MEMBER.since, renews: F.DEMO_MEMBER.renews, visits: 13, last: 0, tags: ['HYROX Jan'] }));
      R.push(mkMember('Arjun Bhalla', { no: 'FM-20133', plan: 'Open Gym', branch: 'saket', visits: 7 }));
      R.push(mkMember('Tanvi Shah', { no: 'FM-20098', plan: 'Club', branch: 'saket', frozen: true, frozenAt: 10, frozenTo: dIso(32), visits: 0, last: 10 }));
      R.push(mkMember('Rakesh Menon', { plan: 'Race Team', branch: 'gurugram', failed: true, visits: 11 }));
      R.push(mkMember('Juhi Bedi', { plan: 'Club', branch: 'saket', renews: dIso(-3), failed: true, visits: 4, last: 6 }));
      var i = 0;
      while (R.length < 42) { var n = FN[(i * 7) % FN.length] + ' ' + LN[(i * 5 + 3) % LN.length]; i++; if (R.some(function (x) { return x.name === n; })) continue; R.push(mkMember(n, {})); }
      R.forEach(function (m) { if (m.name === 'Nisha Pillai') m.no = 'FM-20212'; });
      F.set('roster', R);
    }
    /* web sign-ups that aren't on the roster yet */
    var add = false;
    F.get('signups', []).forEach(function (s) { if (!R.some(function (m) { return m.no === s.memberNo; })) { R.unshift(mkMember(s.name, { no: s.memberNo, phone: s.phone, plan: s.plan, branch: s.home, since: s.start, renews: s.renews, visits: 0, last: 0, isNew: true })); add = true; } });
    if (add) F.set('roster', R);
    return R;
  }
  function saveRoster(R) { F.set('roster', R); }
  function memberBy(no) { return roster().filter(function (m) { return m.no === no; })[0]; }
  function status(m) {
    if (m.frozen) return ['Frozen', 's'];
    if (m.failed) return ['Payment failed', 'r'];
    var n = daysTo(m.renews);
    if (n < 0) return ['Lapsed', 'r'];
    if (n <= 7) return ['Renews ' + (n === 0 ? 'today' : n === 1 ? 'tmrw' : 'in ' + n + 'd'), 'w'];
    if (m.isNew) return ['New', 'v'];
    if (m.last >= 14) return ['At risk', 'w'];
    return ['Active', ''];
  }
  function checkins() { return F.get('checkins', []); }
  function todayCI() { var t = F.iso(new Date()); return checkins().filter(function (c) { return F.iso(new Date(c.at)) === t; }); }
  function sessionsFor(day) { return F.sessions(day).filter(inB); }
  function wlFor(slot) { return F.waitlist().filter(function (w) { return w.slot === slot && !w.promoted; }); }

  /* undo: snapshot the keys an action touches, restore on Undo */
  function snap(keys) { var s = {}; keys.forEach(function (k) { s[k] = JSON.stringify(F.get(k, null)); }); return function () { keys.forEach(function (k) { F.set(k, JSON.parse(s[k])); }); }; }
  var ot = $('#otoast'), otT;
  /* a modal dialog makes the rest of the page inert, so the toast moves into whichever dialog is open; Undo stays clickable */
  function lift() { var host = document.querySelector('dialog[open]') || document.body; if (ot.parentNode !== host) host.appendChild(ot); }
  function toast(msg, undo) {
    ot.innerHTML = '<span>' + msg + '</span>' + (undo ? '<button type="button">Undo</button>' : '');
    ot.classList.remove('on'); lift(); void ot.offsetWidth; ot.classList.add('on'); clearTimeout(otT); otT = setTimeout(function () { ot.classList.remove('on'); }, undo ? 7000 : 4200);
    if (undo) $('button', ot).onclick = function () { undo(); ot.classList.remove('on'); render(); toast('Undone.'); };
  }

  /* ---------- templates (editable in Settings) ---------- */
  var TPL_DEF = {
    trial: 'Hi {first}, it’s the front desk at Forge {branch}. Thanks for booking a free trial for {day}. Would 07:00 or 18:30 suit you better? Bring trainers and water; towels are on us.',
    confirm: 'Hi {first}, see you at Forge {branch} on {day}. Please come 10 minutes early for your movement screen. Reply here if anything changes.',
    nudge: 'Hi {first}, great to have you on the floor this week. If you join by Sunday, your first month starts at the trial rate. Shall I hold it for you?',
    renew: 'Hi {first}, Forge {branch} here. Your {plan} membership renews on {day}. Reply RENEW to continue, or PAUSE if you’re travelling.',
    waitlist: 'Hi {first}, a spot opened in {cls} at {time}, {day}. You’re in. Reply CANCEL if you can’t make it.'
  };
  function tpls() { var t = F.get('ops-tpls', {}); var o = {}; for (var k in TPL_DEF) o[k] = t[k] || TPL_DEF[k]; return o; }
  function fill(t, v) { return t.replace(/\{(\w+)\}/g, function (_, k) { return v[k] != null ? v[k] : ''; }); }
  function leadMsg(l) { var T = tpls(), k = l.stage === 'new' ? 'trial' : l.stage === 'contacted' ? 'confirm' : 'nudge'; return fill(T[k], { first: first(l.name), branch: bn(l.branch), day: F.nice(l.day) }); }
  function renewMsg(m) { return fill(tpls().renew, { first: first(m.name), branch: bn(m.branch), plan: m.plan, day: F.nice(m.renews.slice(0, 10)) }); }

  /* ---------- router ---------- */
  var cur = 'today', arg = '', seen = {};
  var TITLES = { today: 'Today', trials: 'Trials', members: 'Members', checkin: 'Check-in desk', classes: 'Classes', renewals: 'Renewals', pt: '1:1 sessions', messages: 'Messages', reports: 'Reports', settings: 'Settings' };
  function parse() { var h = location.hash.replace(/^#/, '').split('/'); var v = h[0] || 'today'; if (v === 'signups') { v = 'members'; h[1] = 'new'; } if (!TITLES[v]) v = 'today'; cur = v; arg = decodeURIComponent(h.slice(1).join('/') || ''); }
  function go(v, a) { var h = '#' + v + (a ? '/' + encodeURIComponent(a) : ''); if (location.hash === h) { parse(); render(); } else location.hash = h; }
  addEventListener('hashchange', function () { parse(); closeSlide(true); closeSheet(); render(true); view.scrollTop = 0; scrollTo(0, 0); });

  function counts() {
    var L = leads().filter(inB), fu = queueLeads().length;
    var renLeft = renQueue().filter(function (m) { var o = F.get('queue-log', {})[m.name]; return !o || o.o === 'later'; }).length;
    var pt = F.get('pt', []).filter(function (p) { return p.status === 'requested' && inB(p); }).length;
    var unread = threads().filter(function (t) { return t.unread; }).length;
    return { today: 0, trials: fu, members: 0, checkin: 0, classes: 0, renewals: renLeft, pt: pt, messages: unread, reports: 0, settings: 0, _leads: L.length };
  }
  function nav() {
    var c = counts();
    $('#opsNav').innerHTML = NAV.map(function (n, i) { return (i === 8 ? '<hr>' : '') + '<a href="#' + n[0] + '"' + (cur === n[0] ? ' aria-current="page"' : '') + '>' + SVG(IC[n[0]]) + '<span>' + n[1] + '</span>' + (c[n[0]] ? '<span class="ct' + (n[0] === 'trials' || n[0] === 'messages' ? ' hot' : '') + '" aria-label="' + c[n[0]] + ' waiting">' + c[n[0]] + '</span>' : '') + '</a>'; }).join('');
    $('#opsTabs').innerHTML = TABS.map(function (k) { var n = NAV.filter(function (x) { return x[0] === k; })[0]; return '<a href="#' + k + '"' + (cur === k ? ' aria-current="page"' : '') + '>' + SVG(IC[k]) + '<span>' + n[1] + '</span>' + (c[k] ? '<span class="ct">' + c[k] + '</span>' : '') + '</a>'; }).join('') +
      '<button type="button" id="moreBtn" aria-haspopup="dialog"' + (TABS.indexOf(cur) < 0 ? ' aria-current="page"' : '') + '>' + SVG(IC.more) + '<span>More</span>' + (c.messages + c.renewals + c.pt ? '<span class="ct">' + (c.messages + c.renewals + c.pt) + '</span>' : '') + '</button>';
    $('.ops-sheet-in').innerHTML = NAV.filter(function (n) { return TABS.indexOf(n[0]) < 0; }).map(function (n) { return '<a href="#' + n[0] + '">' + SVG(IC[n[0]]) + n[1] + (c[n[0]] ? ' · ' + c[n[0]] : '') + '</a>'; }).join('');
  }
  function closeSheet() { $('#moreSheet').hidden = true; }
  document.addEventListener('click', function (e) {
    if (e.target.closest('#moreBtn')) { var s = $('#moreSheet'); s.hidden = !s.hidden; if (!s.hidden) $('a', s).focus(); return; }
    if (e.target.id === 'moreSheet') closeSheet();
  });

  var SUBS = {};
  function render(fresh) {
    nav();
    var now = new Date();
    $('#viewTitle').textContent = TITLES[cur];
    $('#viewSub').textContent = F.DAYS_L[F.dow(now)] + ' ' + now.getDate() + ' ' + F.MONTHS[now.getMonth()] + ' · ' + (branch ? bn(branch) : 'Saket + Gurugram') + (SUBS[cur] ? ' · ' + SUBS[cur]() : '');
    document.title = TITLES[cur] + ' · Forge Ops';
    $('#meBranch').textContent = branch ? bn(branch) : 'Both floors';
    var draw = function () { VIEWS[cur](); };
    if (fresh && !seen[cur] && !reduce && SKEL[cur]) { seen[cur] = 1; view.innerHTML = SKEL[cur](); view.setAttribute('aria-busy', 'true'); setTimeout(function () { view.removeAttribute('aria-busy'); draw(); }, 280); }
    else { seen[cur] = 1; draw(); }
  }
  function sk(w, h) { return '<div class="o-sk" style="width:' + w + ';height:' + h + 'px"></div>'; }
  var SKEL = {
    today: function () { return '<div>' + sk('50%', 18) + '<div class="kpi" style="margin-top:18px">' + [1, 2, 3, 4, 5, 6].map(function () { return sk('100%', 94); }).join('') + '</div><div class="nn">' + [1, 2, 3, 4].map(function () { return sk('100%', 118); }).join('') + '</div></div>'; },
    members: function () { var s = '<div>' + sk('60%', 36); for (var i = 0; i < 10; i++) s += '<div style="margin-top:10px">' + sk('100%', 30) + '</div>'; return s + '</div>'; },
    trials: function () { return '<div>' + sk('40%', 34) + '<div class="tb" style="margin-top:14px">' + [1, 2, 3, 4].map(function () { return '<div class="tb-col">' + sk('60%', 14) + sk('100%', 84) + sk('100%', 84) + '</div>'; }).join('') + '</div></div>'; },
    classes: function () { var s = '<div>' + sk('30%', 36); for (var i = 0; i < 8; i++) s += '<div style="margin-top:12px">' + sk('100%', 40) + '</div>'; return s + '</div>'; }
  };
  function empty(title, body, act) { return '<div class="o-empty">' + SVG(IC.empty, '0 0 56 56') + '<b>' + title + '</b><p>' + body + '</p>' + (act || '') + '</div>'; }
  function meter(f, hot) { return '<div class="o-meter' + (hot ? ' hot' : '') + '" aria-hidden="true"><i style="--f:' + Math.max(0, Math.min(1, f)).toFixed(3) + '"></i></div>'; }

  /* ================= TODAY ================= */
  function spark(vals) { var mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals), r = mx - mn || 1; return '<svg viewBox="0 0 100 26" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + vals.map(function (v, i) { return (i * 100 / (vals.length - 1)).toFixed(1) + ',' + (23 - (v - mn) / r * 20).toFixed(1); }).join(' ') + '"/></svg>'; }
  function series(seed, now, spread) { var o = []; for (var i = 6; i > 0; i--) o.push(Math.max(0, Math.round(now + ((F.hash(seed + i) % (spread * 2 + 1)) - spread)))); o.push(now); return o; }
  function queueLeads() {
    var t = F.iso(new Date());
    return leads().filter(inB).filter(function (l) { return (l.stage === 'new' || l.stage === 'contacted') && l.called !== t && (!l.cb || new Date(l.cb) <= new Date()); })
      .sort(function (a, b) { return (a.stage === b.stage ? 0 : a.stage === 'new' ? -1 : 1) || (new Date(a.at) - new Date(b.at)); });
  }
  function renQueue() { return roster().filter(inB).filter(function (m) { var n = daysTo(m.renews); return n >= 0 && n <= 7 && !m.frozen; }).sort(function (a, b) { return a.renews < b.renews ? -1 : 1; }); }
  var VIEWS = {};
  VIEWS.today = function () {
    var now = new Date(), h = now.getHours(), R = roster().filter(inB), ci = todayCI().filter(inB);
    var q = queueLeads(), failed = R.filter(function (m) { return m.failed; }), exp = R.filter(function (m) { var n = daysTo(m.renews); return n >= 0 && n <= 2 && !m.frozen; });
    var sess = sessionsFor(now), upcoming = sess.filter(function (s) { return !s.past || s.live; }), wlTot = 0;
    upcoming.forEach(function (s) { wlTot += wlFor(s.id).length; });
    var booked = 0, cap = 0; sess.forEach(function (s) { booked += s.booked; cap += s.cap; });
    var fill = cap ? Math.round(booked / cap * 100) : 0;
    var wk = Date.now() - 7 * DAY, trialsWk = leads().filter(inB).filter(function (l) { return new Date(l.at) > wk; }).length;
    var renDue = renQueue().length, ren = F.get('queue-log', {});
    var hot = upcoming.filter(function (s) { return wlFor(s.id).length; })[0];
    var greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    var bits = []; if (q.length) bits.push('<b>' + plural(q.length, 'trial') + ' to call</b>'); if (failed.length) bits.push(plural(failed.length, 'failed payment')); if (hot) bits.push(hot.cls.name + ' ' + hot.time + ' has a waitlist');
    var K = [
      ['checkin', 'Check-ins today', ci.length, series('ci', ci.length, 6), ci.length - Math.round(ci.length * 0.88), 'vs last ' + F.DAYS[F.dow(now)]],
      ['trials', 'Trials to call', q.length, series('fu', q.length, 2), q.length - 3, 'vs yesterday', true],
      ['trials/week', 'Trials this week', trialsWk, series('tw', trialsWk, 3), trialsWk - 9, 'vs last week'],
      ['renewals', 'Renewals due · 7 d', renDue, series('rn', renDue, 2), 0, 'same as last week', true],
      ['members/dues', 'Failed payments', failed.length, series('fp', failed.length, 1), failed.length - 1, 'vs last week', true],
      ['classes', 'Class fill today', fill + '%', series('fl', fill, 7), 4, 'pts vs avg']
    ];
    view.innerHTML = '<div>' +
      '<div class="greet"><p>' + greet + ', Priya. ' + (bits.length ? bits.join(', ').replace(/, ([^,]*)$/, ' and $1') + '.' : 'Nothing urgent. Enjoy the quiet.') + '</p>' +
        (q.length ? '<button class="btn volt sm" type="button" data-play="leads"><span>Start calling · ' + q.length + '</span></button>' : '') + '</div>' +
      '<div class="kpi" role="group" aria-label="Key numbers">' + K.map(function (k) { var d = k[4], bad = k[6] ? d > 0 : d < 0; return '<a href="#' + k[0] + '"' + (k[0] === 'trials' ? ' class="act"' : '') + '><span class="kl">' + k[1] + '</span><span class="kval"><b>' + k[2] + '</b><span class="dl ' + (d === 0 ? '' : bad ? 'dn' : 'up') + '">' + (d > 0 ? '+' : d < 0 ? '−' : '±') + Math.abs(d) + '</span></span>' + spark(k[3]) + '<span class="kl" style="text-transform:none">' + k[5] + '</span></a>'; }).join('') + '</div>' +
      '<div class="o-card-h" style="margin-bottom:8px"><h2 class="o-h2">Now &amp; next</h2><a class="mono ul o-muted" href="#classes">Full timetable</a></div>' +
      (upcoming.length ? '<div class="nn">' + upcoming.slice(0, 4).map(function (s) { var w = wlFor(s.id).length, mins = Math.round((new Date(s.date + 'T' + s.time) - now) / 6e4);
        return '<a class="nn-c' + (s.live ? ' now' : '') + '" href="#classes/' + encodeURIComponent(s.id) + '"><span class="t"><b>' + s.time + '</b>' + (s.live ? '<span class="o-chip v">● Now</span>' : '<span class="mono o-muted">in ' + (mins >= 60 ? Math.floor(mins / 60) + ' h ' + (mins % 60) + ' m' : mins + ' min') + '</span>') + '</span><h3>' + esc(s.cls.name) + '</h3><span class="mono">' + esc(first(s.coach.name)) + ' · ' + bn(s.branch) + '</span>' +
          '<span class="cap"><span>' + s.booked + ' / ' + s.cap + ' booked</span>' + (w ? '<span class="o-hi">+' + w + ' waiting</span>' : '<span>' + s.left + ' left</span>') + '</span>' + meter(s.booked / s.cap, s.left === 0) + '</a>'; }).join('') + '</div>'
        : '<div class="o-card" style="margin-bottom:16px">' + empty('Floors are closed for today', 'Tomorrow’s first class is at 06:00. Check the timetable for bookings.', '<a class="o-btn" href="#classes">Open timetable</a>') + '</div>') +
      '<div class="o-grid2">' +
        '<section class="o-card" aria-labelledby="fuH"><div class="o-card-h"><h2 id="fuH">Follow-up queue</h2><span class="mono">' + plural(q.length, 'person', 'people') + ' · ≈ ' + q.length * 3 + ' min</span></div>' +
          (q.length ? '<ol class="ql">' + q.slice(0, 5).map(function (l) { var last = (l.notes || []).slice(-1)[0]; return '<li>' + av(l.name) + '<div><b>' + esc(l.name) + '</b><p class="mono">' + esc(l.source) + ' · ' + agoL(l.at) + (last ? ' · “' + esc(last.length > 44 ? last.slice(0, 44) + '…' : last) + '”' : '') + '</p></div><button class="o-btn" type="button" data-call="' + l.id + '">' + SVG(IC.phone) + 'Call</button></li>'; }).join('') + '</ol>' +
            '<div class="o-row"><button class="btn volt sm" type="button" data-play="leads"><span>Play queue</span></button><a class="o-btn ghost" href="#trials">Open the board</a></div>'
            : empty('Queue clear', 'Every new trial has been called today. New website and chat bookings land here first.')) + '</section>' +
        '<section class="o-card" aria-labelledby="alH"><div class="o-card-h"><h2 id="alH">Alerts</h2><span class="mono">' + plural(alerts().length, 'item') + '</span></div>' +
          (alerts().length ? '<ul class="al">' + alerts().map(function (a) { return '<li><span class="ic ' + a[0] + '">' + a[1] + '</span><div><b>' + a[2] + '</b><p class="mono o-muted">' + a[3] + '</p></div><a class="o-btn" href="' + a[4] + '"' + (a[6] ? ' data-member="' + a[6] + '"' : '') + '>' + a[5] + '</a></li>'; }).join('') + '</ul>' : empty('All clear', 'No failed payments, freezes or no-show streaks.')) +
          '<div class="o-card-h" style="margin-top:6px"><h2>Desk activity</h2><a class="mono ul o-muted" href="#checkin">Check-in desk</a></div>' +
          '<ul class="feed">' + ci.slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; }).slice(0, 5).map(function (c) { return '<li><span class="mono">' + hm(c.at) + '</span><span>' + esc(c.name) + ' checked in · <span class="o-muted">' + esc(c.what || 'Open gym') + ', ' + bn(c.branch) + '</span></span></li>'; }).join('') + '</ul>' +
        '</section>' +
      '</div></div>';
  };
  function alerts() {
    var R = roster().filter(inB), out = [];
    var exp = R.filter(function (m) { var n = daysTo(m.renews); return n >= 0 && n <= 2 && !m.frozen; });
    if (exp.length) out.push(['w', '!', plural(exp.length, 'membership') + ' expire' + (exp.length === 1 ? 's' : '') + ' in 48 h', exp.map(function (m) { return first(m.name); }).join(', '), '#renewals', 'Call']);
    R.filter(function (m) { return m.failed; }).forEach(function (m) { out.push(['r', '₹', 'Payment failed · ' + esc(m.name), F.rupees(m.dues) + ' · ' + m.plan + ' · ' + (m.pays[0].method), '#members/dues', 'Open', m.no]); });
    R.filter(function (m) { return m.noshow >= 3; }).forEach(function (m) { out.push(['w', '×', esc(m.name) + ' missed ' + m.noshow + ' booked classes', 'No-show streak · last visit ' + m.last + ' days ago', '#members', 'Open', m.no]); });
    threads().filter(function (t) { return t.status === 'waiting'; }).forEach(function (t) { out.unshift(['v', '…', esc(t.name) + ' is waiting in website chat', esc(t.reason || 'Asked for a person') + ' · ' + agoL(t.at), '#messages/' + t.id, 'Reply']); });
    var fz = F.get('freezes', []).filter(function (f) { return f.status === 'pending' && inB(f); });
    if (fz.length) out.push(['v', '❄', plural(fz.length, 'freeze request'), fz.map(function (f) { return first(f.name) + ' · ' + f.weeks + ' wk'; }).join(', '), '#renewals/freezes', 'Review']);
    var pt = F.get('pt', []).filter(function (p) { return p.status === 'requested' && inB(p); });
    if (pt.length) out.push(['v', '1', plural(pt.length, '1:1 request'), pt.map(function (p) { return first(p.name) + ' → ' + first(p.coachName); }).join(', '), '#pt', 'Confirm']);
    return out;
  }
  SUBS.today = function () { return 'Front desk'; };

  /* ================= TRIALS BOARD ================= */
  var STAGES = [['new', 'Trial booked', 'Call'], ['contacted', 'Followed up', 'Log trial'], ['trial', 'Trained', 'Mark joined'], ['joined', 'Joined', '']];
  var TB = { q: '', src: '', menu: '', addPh: '' };
  function srcKey(s) { return String(s || '').split(' ')[0].replace('·', '').trim(); }
  VIEWS.trials = function () {
    var L = leads().filter(inB), wk = arg === 'week' ? Date.now() - 7 * DAY : 0;
    var srcs = ['Instagram', 'Google', 'Website', 'Referral', 'Walk-in', 'Chat'];
    var vis = L.filter(function (l) { return (!TB.src || srcKey(l.source) === TB.src) && (!TB.q || (l.name + ' ' + l.goal).toLowerCase().indexOf(TB.q.toLowerCase()) > -1) && (!wk || new Date(l.at) > wk); });
    var lost = vis.filter(function (l) { return l.stage === 'lost'; }).length, q = queueLeads();
    view.innerHTML = '<div><div class="tb-bar"><input class="o-input" id="tbQ" type="search" placeholder="Filter by name or goal" aria-label="Filter leads" value="' + esc(TB.q) + '">' +
      '<div class="tb-src" role="group" aria-label="Source">' + srcs.map(function (s) { return '<button type="button" data-src="' + s + '" aria-pressed="' + (TB.src === s) + '">' + s + '</button>'; }).join('') + '</div>' +
      (wk ? '<a class="o-chip v" href="#trials">This week only · clear</a>' : '') +
      '<span class="mono o-muted" style="margin-left:auto">' + (lost ? lost + ' not interested · ' : '') + 'drag cards between stages</span>' +
      (q.length ? '<button class="btn volt sm" type="button" data-play="leads"><span>Play queue · ' + q.length + '</span></button>' : '') + '</div>' +
      '<div class="tb">' + STAGES.map(function (st) {
        var items = vis.filter(function (l) { return l.stage === st[0]; });
        return '<section class="tb-col" data-stage="' + st[0] + '" aria-label="' + st[1] + '"><h2><span>' + st[1] + '</span><b>' + items.length + '</b></h2>' +
          (items.length ? items.map(function (l) { return leadCard(l, st); }).join('') : '<p class="mono o-muted" style="padding:14px 4px">' + { new: 'New website, chat and walk-in trials land here.', contacted: 'Nobody waiting on a reply.', trial: 'No one between trial and decision.', joined: 'No joins yet this cycle.' }[st[0]] + '</p>') + '</section>';
      }).join('') + '</div></div>';
    var qi = $('#tbQ'); qi.addEventListener('input', function () { TB.q = qi.value; var p = qi.selectionStart; VIEWS.trials(); var n = $('#tbQ'); n.focus(); n.setSelectionRange(p, p); });
    dnd();
  };
  function leadCard(l, st) {
    var last = (l.notes || []).slice(-1)[0], fresh = Date.now() - new Date(l.at) < 864e5 && l.stage === 'new';
    var src = srcKey(l.source), chipC = src === 'Chat' ? 'v' : src === 'Referral' ? 's' : '';
    return '<article class="lc' + (fresh ? ' fresh' : '') + '" draggable="true" data-id="' + l.id + '" tabindex="0" aria-label="' + esc(l.name) + ', ' + st[1] + '">' +
      '<div class="lc-top"><b>' + esc(l.name) + '</b><span class="mono" title="Booked ' + agoL(l.at) + '">' + ago(l.at) + '</span></div>' +
      '<p class="lc-goal">' + esc(l.goal || 'No goal noted') + '</p>' +
      '<div class="lc-meta">' + (l.convo ? '<a class="o-chip v" href="#messages/ch-' + esc(l.convo) + '" title="Open the chat transcript">From chat · transcript</a>' : '<span class="o-chip ' + chipC + '">' + esc(l.source) + '</span>') + (l.stage !== 'joined' ? '<span class="o-chip">' + (daysTo(l.day) >= 0 ? 'Trial ' : 'Trained ') + rel(l.day) + '</span>' : '<span class="o-chip v">' + esc(l.plan || 'Member') + '</span>') + (l.cb ? '<span class="o-chip w">Call back ' + hm(l.cb) + '</span>' : '') + '</div>' +
      (l.phone ? '' : (TB.addPh === l.id ? '<form class="addph-f" data-ph="' + l.id + '"><input class="o-input" name="p" inputmode="tel" placeholder="98xxx xxxxx" aria-label="Phone for ' + esc(l.name) + '" required><button class="o-btn v" type="submit">Save</button></form>' : '<button class="addph" type="button" data-addph="' + l.id + '">+ Add phone</button>')) +
      (last && l.stage !== 'joined' ? '<p class="mono o-muted" style="text-transform:none">“' + esc(last.length > 60 ? last.slice(0, 60) + '…' : last) + '”</p>' : '') +
      (st[2] ? '<div class="lc-act">' + '<button class="o-btn v" type="button" data-next="' + l.id + '">' + st[2] + '</button><button class="o-btn o-icon" type="button" data-wa="' + l.id + '" aria-label="Copy WhatsApp message for ' + esc(first(l.name)) + '">' + SVG(IC.wa) + '</button><button class="o-btn o-icon" type="button" data-ovf="' + l.id + '" aria-label="More actions for ' + esc(first(l.name)) + '" aria-expanded="' + (TB.menu === l.id) + '">' + SVG(IC.more) + '</button></div>' : '') +
      (TB.menu === l.id ? '<div class="ovf" role="menu">' + STAGES.filter(function (s) { return s[0] !== l.stage; }).map(function (s) { return '<button role="menuitem" type="button" data-move="' + l.id + '" data-to="' + s[0] + '">Move to ' + s[1] + '</button>'; }).join('') + '<button role="menuitem" type="button" data-move="' + l.id + '" data-to="lost">Not interested</button><button role="menuitem" type="button" data-call="' + l.id + '">Open call card</button></div>' : '') +
      '</article>';
  }
  function moveLead(id, to, note) {
    var undo = snap(['leads', 'roster']), L = leads(), l = L.filter(function (x) { return x.id === id; })[0]; if (!l || l.stage === to) return;
    var from = l.stage; l.stage = to; l.notes = l.notes || []; if (note) l.notes.push(note);
    if (to === 'joined') joinRoster(l);
    saveLeads(L); render();
    var c = $('.lc[data-id="' + id + '"]'); if (c) c.classList.add('flash');
    toast(esc(first(l.name)) + ' moved to <b>' + ({ new: 'Trial booked', contacted: 'Followed up', trial: 'Trained', joined: 'Joined', lost: 'Not interested' }[to]) + '</b>', undo);
    return from;
  }
  function joinRoster(l) { var R = roster(); if (R.some(function (m) { return m.name === l.name; })) return; R.unshift(mkMember(l.name, { plan: l.plan || 'Club', branch: l.branch, since: F.iso(new Date()), renews: dIso(30), visits: 1, last: 0, isNew: true, phone: l.phone || undefined })); saveRoster(R); }
  function dnd() {
    var dragId = null;
    $$('.lc', view).forEach(function (c) {
      c.addEventListener('dragstart', function (e) { dragId = c.dataset.id; c.classList.add('drag'); try { e.dataTransfer.setData('text/plain', dragId); e.dataTransfer.effectAllowed = 'move'; } catch (x) {} });
      c.addEventListener('dragend', function () { c.classList.remove('drag'); $$('.tb-col', view).forEach(function (k) { k.classList.remove('over'); }); });
    });
    $$('.tb-col', view).forEach(function (col) {
      col.addEventListener('dragover', function (e) { e.preventDefault(); col.classList.add('over'); });
      col.addEventListener('dragleave', function (e) { if (!col.contains(e.relatedTarget)) col.classList.remove('over'); });
      col.addEventListener('drop', function (e) { e.preventDefault(); col.classList.remove('over'); var id = dragId || e.dataTransfer.getData('text/plain'); if (id) moveLead(id, col.dataset.stage, 'Moved on the board · ' + hm(new Date().toISOString())); });
    });
  }

  /* ================= FOCUS MODE (calls) ================= */
  var FQ = null;
  var LEAD_O = [['booked', 'Booked trial', IC.ok, 'ok'], ['noans', 'No answer', IC.phone, ''], ['later', 'Call back later', IC.clock, ''], ['notint', 'Not interested', IC.x, 'bad'], ['joined', 'Joined', IC.star, 'ok']];
  var REN_O = [['renewed', 'Renewed', IC.ok, 'ok'], ['freeze', 'Wants to freeze', IC.snow, ''], ['noans', 'No answer', IC.phone, ''], ['later', 'Call back later', IC.clock, ''], ['cancel', 'Cancelling', IC.x, 'bad']];
  function play(kind, startId) {
    var ids = kind === 'leads' ? queueLeads().map(function (l) { return l.id; }) : renQueue().filter(function (m) { var o = F.get('queue-log', {})[m.name]; return !o || o.o === 'later'; }).map(function (m) { return m.no; });
    if (startId && ids.indexOf(startId) < 0) ids.unshift(startId);
    if (startId) { ids.splice(ids.indexOf(startId), 1); ids.unshift(startId); }
    if (!ids.length) { toast(kind === 'leads' ? 'Nobody left to call. Nice work.' : 'Renewal queue is done for today.'); return; }
    FQ = { kind: kind, ids: ids, i: 0, log: [], t0: Date.now() };
    drawFQ(); var d = $('#focus'); if (!d.open) d.showModal();
  }
  function fqItem() { var id = FQ.ids[FQ.i]; return FQ.kind === 'leads' ? leads().filter(function (l) { return l.id === id; })[0] : memberBy(id); }
  function drawFQ() {
    var el = $('#fq'), n = FQ.ids.length;
    if (FQ.i >= n) {
      var mins = Math.max(1, Math.round((Date.now() - FQ.t0) / 6e4)), by = {}; FQ.log.forEach(function (o) { by[o] = (by[o] || 0) + 1; });
      var O = FQ.kind === 'leads' ? LEAD_O : REN_O;
      el.innerHTML = '<div class="fq-top"><p class="mono fq-k">Queue clear</p><button class="fq-x" type="button" data-fqx>Close</button></div><h3 id="fqTitle">' + plural(FQ.log.length, 'call') + ' logged</h3><p class="fq-goal">in about ' + plural(mins, 'minute') + '. Outcomes are on the board and in each person’s notes.</p>' +
        '<div class="o-row">' + O.filter(function (o) { return by[o[0]]; }).map(function (o) { return '<span class="o-chip ' + (o[3] === 'ok' ? 'v' : o[3] === 'bad' ? 'r' : '') + '">' + by[o[0]] + ' · ' + o[1] + '</span>'; }).join('') + '</div>' +
        '<button class="btn volt" type="button" data-fqx><span>Back to ' + (FQ.kind === 'leads' ? 'the board' : 'renewals') + '</span></button>';
      return;
    }
    var it = fqItem(); if (!it) { FQ.i++; return drawFQ(); }
    var isL = FQ.kind === 'leads', O = isL ? LEAD_O : REN_O;
    var remark = isL ? ((it.notes || []).slice(-1)[0] || 'No remarks yet. First call.') : ((it.notes || []).slice(-1)[0] || { text: REMARKS[it.name] || 'No remarks yet.' }).text;
    var remarkMeta = isL ? ((it.notes || []).length ? 'Last remark' : 'Context') : 'Last remark · ' + ((it.notes || []).slice(-1)[0] ? (it.notes.slice(-1)[0].by + ', ' + agoL(it.notes.slice(-1)[0].at)) : 'renewal');
    var left = n - FQ.i, per = isL ? 3 : 2;
    el.innerHTML = '<div class="fq-top"><p class="mono fq-k">Ready to call · <b style="color:var(--chalk)">' + (FQ.i + 1) + ' of ' + n + '</b> · ≈ ' + left * per + ' min left</p><button class="fq-x" type="button" data-fqx>Exit</button></div>' +
      meter(FQ.i / n) +
      '<div class="fq-remark"><p class="mono">' + esc(remarkMeta) + '</p><p>' + esc(remark) + '</p></div>' +
      '<h3 id="fqTitle">' + esc(it.name) + '</h3>' +
      '<p class="fq-goal">' + esc(isL ? (it.goal || 'General fitness') : it.plan + ' · renews ' + rel(it.renews) + ' · ' + it.visits + ' visits in 30 days') + '</p>' +
      '<div class="o-row">' + (isL ? '<span class="o-chip">' + esc(it.source) + '</span><span class="o-chip">' + bn(it.branch) + '</span><span class="o-chip">Trial ' + rel(it.day) + '</span><span class="o-chip">Booked ' + agoL(it.at) + '</span>' : '<span class="o-chip">' + bn(it.branch) + '</span><span class="o-chip">' + F.rupees(PLAN[it.plan]) + ' / month</span>' + (it.failed ? '<span class="o-chip r">Payment failed</span>' : '')) + '</div>' +
      (it.phone ? '<div class="fq-main"><button class="btn volt" type="button" data-dial><span>' + SVG(IC.phone) + ' Call ' + esc(it.phone) + '</span></button><button class="btn ghost" type="button" data-fqwa><span>WhatsApp</span></button></div>'
        : '<form class="addph-f" data-fqph><input class="o-input" name="p" inputmode="tel" placeholder="Add a phone number" aria-label="Phone for ' + esc(it.name) + '" required style="flex:1;min-height:48px;width:auto"><button class="btn volt sm" type="submit"><span>Save phone</span></button></form>') +
      '<p class="mono fq-k">One tap logs the outcome and moves on</p>' +
      '<div class="fq-grid" role="group" aria-label="Call outcome">' + O.map(function (o) { return '<button type="button" class="fq-o ' + o[3] + '" data-o="' + o[0] + '">' + SVG(o[2]) + o[1] + '</button>'; }).join('') + '</div>' +
      '<input class="o-input fq-note" id="fqNote" placeholder="Add a remark (optional)" aria-label="Remark" autocomplete="off">' +
      '<div class="fq-act"><button class="o-btn ghost" type="button" data-fqskip>Skip for now</button><button class="o-btn" type="button" data-fqsave>Save &amp; next</button></div>';
  }
  function fqLog(o) {
    var it = fqItem(), note = ($('#fqNote') || {}).value || '', stamp = hm(new Date().toISOString()), t = F.iso(new Date());
    var undo = snap(['leads', 'roster', 'queue-log', 'freezes']), label;
    if (FQ.kind === 'leads') {
      var L = leads(), l = L.filter(function (x) { return x.id === it.id; })[0]; label = LEAD_O.filter(function (x) { return x[0] === o; })[0];
      l.notes = l.notes || []; l.called = t; l.attempts = (l.attempts || 0) + (o ? 1 : 0);
      if (o) l.notes.push(label[1] + ' · ' + stamp + (note ? ' · ' + note : '')); else if (note) l.notes.push(note);
      if (o === 'booked') { l.stage = 'contacted'; }
      if (o === 'later') { l.cb = new Date(Date.now() + 2 * 36e5).toISOString(); l.called = ''; }
      if (o === 'notint') l.stage = 'lost';
      if (o === 'joined') { l.stage = 'joined'; joinRoster(l); }
      if (o && o !== 'later') delete l.cb;
      saveLeads(L);
    } else {
      var R = roster(), m = R.filter(function (x) { return x.no === it.no; })[0], log = F.get('queue-log', {}); label = REN_O.filter(function (x) { return x[0] === o; })[0];
      m.notes = m.notes || [];
      if (o) { log[m.name] = { o: o, at: new Date().toISOString() }; m.notes.push({ at: new Date().toISOString(), by: 'Priya', text: label[1] + (note ? '. ' + note : '') }); }
      else if (note) m.notes.push({ at: new Date().toISOString(), by: 'Priya', text: note });
      if (o === 'renewed') { var d = new Date(m.renews); d.setMonth(d.getMonth() + 1); m.renews = F.iso(d); m.failed = false; m.dues = 0; }
      if (o === 'freeze') { var fz = F.get('freezes', []); fz.unshift({ id: F.uid(), memberNo: m.no, name: m.name, plan: m.plan, branch: m.branch, weeks: 4, from: dIso(3), reason: 'Asked on a renewal call', newRenews: dIso(daysTo(m.renews) + 28), status: 'pending', at: new Date().toISOString() }); F.set('freezes', fz); }
      F.set('queue-log', log); saveRoster(R);
    }
    if (o) FQ.log.push(o);
    FQ.i++; drawFQ(); render();
    toast(o ? esc(first(it.name)) + ': <b>' + label[1] + '</b> logged' : (note ? 'Remark saved for ' + esc(first(it.name)) : 'Skipped ' + esc(first(it.name))), o || note ? function () { undo(); if (FQ) { FQ.i = Math.max(0, FQ.i - 1); if (o) FQ.log.pop(); drawFQ(); var d = $('#focus'); if (!d.open) d.showModal(); } } : null);
    var b = $('.fq-o'); if (b) b.focus({ preventScroll: true });
  }
  $('#focus').addEventListener('click', function (e) {
    var t = e.target;
    if (t === $('#focus')) { $('#focus').close(); return; }
    if (t.closest('[data-fqx]')) { $('#focus').close(); return; }
    var o = t.closest('[data-o]'); if (o) { fqLog(o.dataset.o); return; }
    if (t.closest('[data-fqskip]')) { FQ.i++; drawFQ(); return; }
    if (t.closest('[data-fqsave]')) { fqLog(''); return; }
    if (t.closest('[data-dial]')) { var it = fqItem(); toast('Dialling ' + esc(it.phone) + ' <span style="opacity:.6">from the desk phone</span>'); return; }
    if (t.closest('[data-fqwa]')) { var it2 = fqItem(); copy(FQ.kind === 'leads' ? leadMsg(it2) : renewMsg(it2)); toast('WhatsApp message copied for ' + esc(first(it2.name)) + '. Paste it in the chat; nothing is sent from here.'); }
  });
  $('#focus').addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target, v = f.p.value, msg = F.check.phone(v); if (msg) { toast(msg); f.p.focus(); return; }
    var it = fqItem(), d = v.replace(/\D/g, '').slice(-10), masked = '+91 ' + d.slice(0, 2) + '••• ••' + d.slice(7);
    if (FQ.kind === 'leads') { var L = leads(); L.forEach(function (l) { if (l.id === it.id) l.phone = masked; }); saveLeads(L); }
    drawFQ(); render(); toast('Phone saved for ' + esc(first(it.name)));
  });
  $('#focus').addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT') return; var k = +e.key; if (k >= 1 && k <= 5) { var b = $$('.fq-o')[k - 1]; if (b) b.click(); }
  });
  $('#focus').addEventListener('close', function () { if (FQ && cur !== 'trials' && cur !== 'renewals' && cur !== 'today') render(); FQ = null; });

  /* ================= CHECK-IN DESK ================= */
  var CI = { q: '', sel: '' };
  VIEWS.checkin = function () {
    var R = roster(), ci = todayCI().filter(inB).sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    view.innerHTML = '<div class="ci-desk"><div>' +
      '<div class="ci-q"><input class="o-input" id="ciQ" type="search" placeholder="Name, member no. or last 3 digits" aria-label="Find a member" autocomplete="off" value="' + esc(CI.q) + '"><button class="o-btn" type="button" id="ciScan">' + SVG(IC.checkin) + 'Scan QR</button></div>' +
      '<div class="ci-res" id="ciRes" role="listbox" aria-label="Matches"></div><div id="ciCard"></div></div>' +
      '<section class="o-card" aria-labelledby="ciH"><div class="o-card-h"><h2 id="ciH">Checked in today</h2><span class="mono">' + ci.length + '</span></div>' + meter(ci.length / 140) +
      '<ul class="feed">' + (ci.length ? ci.slice(0, 14).map(function (c) { return '<li><span class="mono">' + hm(c.at) + '</span><span>' + esc(c.name) + ' <span class="o-muted">· ' + esc(c.what || 'Open gym') + ', ' + bn(c.branch) + '</span></span></li>'; }).join('') : '<li><span></span><span class="o-muted">Nobody yet. Doors open at 05:30.</span></li>') + '</ul>' +
      '<button class="o-btn" type="button" data-new="walkin">+ Walk-in day pass</button></section></div>';
    var q = $('#ciQ');
    q.addEventListener('input', function () { CI.q = q.value; CI.sel = ''; results(); card(); });
    q.addEventListener('keydown', function (e) { var bs = $$('#ciRes button'); if (!bs.length) return; var i = bs.indexOf(document.querySelector('#ciRes .sel'));
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); i = e.key === 'ArrowDown' ? Math.min(bs.length - 1, i + 1) : Math.max(0, i - 1); bs.forEach(function (b, k) { b.classList.toggle('sel', k === i); b.setAttribute('aria-selected', String(k === i)); }); }
      if (e.key === 'Enter') { e.preventDefault(); (bs[i] || bs[0]).click(); } });
    function results() {
      var s = CI.q.trim().toLowerCase(), box = $('#ciRes');
      if (!s || CI.sel) { box.innerHTML = ''; return; }
      var hit = R.filter(function (m) { return m.name.toLowerCase().indexOf(s) > -1 || m.no.toLowerCase().indexOf(s) > -1 || m.phone.replace(/\D/g, '').slice(-3) === s.replace(/\D/g, ''); }).slice(0, 6);
      box.innerHTML = hit.length ? hit.map(function (m, k) { var st = status(m); return '<button type="button" role="option" data-ci="' + m.no + '"' + (k === 0 ? ' class="sel" aria-selected="true"' : ' aria-selected="false"') + '>' + av(m.name) + '<span><b>' + esc(m.name) + '</b><span class="mono"> · ' + m.no + ' · ' + m.plan + '</span></span><span class="o-chip ' + st[1] + '">' + st[0] + '</span></button>'; }).join('')
        : '<p class="mono o-muted" style="padding:12px 4px">No member matches “' + esc(CI.q) + '”. <button class="addph" type="button" data-new="walkin">+ Sell a day pass</button></p>';
    }
    results(); card();
    if (!matchMedia('(max-width:860px)').matches) q.focus();
  };
  function card() {
    var box = $('#ciCard'); if (!box) return; var m = CI.sel && memberBy(CI.sel);
    if (!m) { box.innerHTML = CI.q ? '' : '<div class="o-card" style="margin-top:14px">' + empty('Ready for the next member', 'Type a name, member number or the last three digits of a phone. Or scan the QR pass from the member app.') + '</div>'; return; }
    var st = status(m), done = todayCI().filter(function (c) { return c.no === m.no; })[0], bk = F.sessions(new Date()).filter(function (s) { return F.get('bookings', []).some(function (b) { return b.slot === s.id && b.name === m.name; }); })[0];
    box.innerHTML = '<article class="mcard" aria-live="polite">' + av(m.name) + '<div><div class="o-row"><h2>' + esc(m.name) + '</h2><span class="o-chip ' + st[1] + '">' + st[0] + '</span></div><p class="mono o-muted">' + m.no + ' · ' + esc(m.phone) + ' · home floor ' + bn(m.branch) + '</p>' +
      '<dl><div><dt>Plan</dt><dd>' + m.plan + '</dd></div><div><dt>Renews</dt><dd>' + F.nice(m.renews) + '</dd></div><div><dt>Dues</dt><dd class="' + (m.dues ? 'o-err' : '') + '">' + (m.dues ? F.rupees(m.dues) : 'None') + '</dd></div><div><dt>Last 30 days</dt><dd>' + plural(m.visits, 'visit') + '</dd></div></dl>' +
      (bk ? '<p class="o-chip v" style="margin-top:10px">Booked: ' + esc(bk.cls.name) + ' ' + bk.time + '</p>' : '') +
      (m.failed ? '<p class="o-err" style="margin-top:10px">Payment of ' + F.rupees(m.dues) + ' failed on ' + F.nice(m.pays[0].date) + ' (' + m.pays[0].method + '). Collect at the desk before the session.</p>' : '') +
      (m.frozen ? '<p class="o-muted" style="margin-top:10px">Membership frozen until ' + F.nice(m.frozenTo) + '. Checking in ends the freeze early.</p>' : '') +
      '</div><div class="go">' + (done ? '<button class="btn dark" type="button" disabled><span>' + SVG(IC.ok) + ' Checked in at ' + hm(done.at) + '</span></button>'
        : '<button class="btn volt" type="button" data-checkin="' + m.no + '"><span>' + (m.frozen ? 'Unfreeze and check in' : 'Check in ' + esc(first(m.name))) + '</span></button>') +
      (m.failed ? '<button class="o-btn" type="button" data-collect="' + m.no + '" style="min-height:60px">Collect ' + F.rupees(m.dues) + '</button>' : '') +
      '<button class="o-btn" type="button" data-member="' + m.no + '" style="min-height:60px">Profile</button></div></article>';
  }
  function doCheckin(no) {
    var undo = snap(['checkins', 'roster']), R = roster(), m = R.filter(function (x) { return x.no === no; })[0]; if (!m) return;
    var bk = F.sessions(new Date()).filter(function (s) { return !s.past || s.live; }).filter(function (s) { return F.get('bookings', []).some(function (b) { return b.slot === s.id && b.name === m.name; }); })[0];
    var c = checkins(); c.push({ name: m.name, no: m.no, branch: branch || m.branch, at: new Date().toISOString(), what: bk ? bk.cls.name : 'Open gym' }); F.set('checkins', c);
    m.last = 0; m.visits++; m.heat = m.heat.slice(0, -1) + '1'; if (m.frozen) { m.frozen = false; m.frozenTo = ''; } saveRoster(R);
    render(); toast('<b>' + esc(first(m.name)) + '</b> checked in · ' + hm(new Date().toISOString()), function () { undo(); });
  }
  function scan() {
    var d = $('#modal'); $('#modalIn').innerHTML = '<p class="mono o-muted">Scanner</p><h3>Hold the pass to the camera</h3><div class="scan" aria-hidden="true"></div><p class="o-muted">Reading the QR pass from the member app…</p><button class="o-btn" type="button" data-close>Cancel</button>';
    d.showModal(); var t = setTimeout(function () { if (!d.open) return; d.close(); CI.sel = 'FM-20417'; CI.q = ''; if (cur !== 'checkin') go('checkin'); else render(); toast('Pass scanned: <b>Aanya Kapoor</b> · FM-20417'); }, reduce ? 300 : 1400);
    d.addEventListener('close', function () { clearTimeout(t); }, { once: true });
  }

  /* ================= MEMBERS ================= */
  var MV = { view: 'all', q: '', plan: '', sort: 'name', dir: 1, sel: [] };
  var SAVED = [['all', 'All members'], ['active', 'Active'], ['expiring', 'Renewing in 14 days'], ['dues', 'Payment failed'], ['risk', 'At risk'], ['frozen', 'Frozen'], ['new', 'New sign-ups']];
  function inView(m, v) { var st = status(m)[0], n = daysTo(m.renews);
    return v === 'all' || (v === 'active' && !m.frozen && n >= 0) || (v === 'expiring' && n >= 0 && n <= 14 && !m.frozen) || (v === 'dues' && m.failed) || (v === 'risk' && m.last >= 14 && !m.frozen) || (v === 'frozen' && m.frozen) || (v === 'new' && (m.isNew || daysTo(m.since) > -30)); }
  function custom() { return F.get('ops-views', []); }
  VIEWS.members = function () {
    if (arg) { var cv = custom().filter(function (c) { return c.id === arg; })[0]; if (cv) { MV.view = cv.base; MV.q = cv.q; MV.plan = cv.plan; MV.sort = cv.sort; MV.dir = cv.dir; } else if (SAVED.some(function (s) { return s[0] === arg; })) MV.view = arg; arg = ''; }
    var R = roster().filter(inB);
    var list = R.filter(function (m) { return inView(m, MV.view) && (!MV.plan || m.plan === MV.plan) && (!MV.q || (m.name + ' ' + m.no + ' ' + m.tags.join(' ')).toLowerCase().indexOf(MV.q.toLowerCase()) > -1); });
    var key = { name: function (m) { return m.name; }, plan: function (m) { return PLAN[m.plan]; }, branch: function (m) { return m.branch; }, renews: function (m) { return m.renews; }, visits: function (m) { return m.visits; }, dues: function (m) { return m.dues; }, status: function (m) { return status(m)[0]; } }[MV.sort];
    list.sort(function (a, b) { var x = key(a), y = key(b); return (x < y ? -1 : x > y ? 1 : 0) * MV.dir; });
    MV.sel = MV.sel.filter(function (no) { return list.some(function (m) { return m.no === no; }); });
    var cols = [['name', 'Member'], ['plan', 'Plan'], ['branch', 'Floor'], ['renews', 'Renews'], ['visits', 'Visits · 30 d', 1], ['dues', 'Dues', 1], ['status', 'Status']];
    var all = list.length && MV.sel.length === list.length;
    view.innerHTML = '<div><div class="views" role="group" aria-label="Saved views">' + SAVED.map(function (s) { return '<button type="button" data-view="' + s[0] + '" aria-pressed="' + (MV.view === s[0] && !MV.cv) + '">' + s[1] + '<span class="c">' + R.filter(function (m) { return inView(m, s[0]); }).length + '</span></button>'; }).join('') +
      custom().map(function (c) { return '<button type="button" data-cview="' + c.id + '" aria-pressed="' + (MV.cv === c.id) + '">★ ' + esc(c.name) + '</button>'; }).join('') + '</div>' +
      '<div class="tt-tools"><input class="o-input" id="mQ" type="search" placeholder="Search name, member no. or tag" aria-label="Search members" value="' + esc(MV.q) + '" style="flex:1;min-width:200px">' +
      '<select class="o-input o-select" id="mPlan" aria-label="Plan"><option value="">All plans</option>' + Object.keys(PLAN).map(function (p) { return '<option' + (MV.plan === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select>' +
      '<button class="o-btn" type="button" id="saveView">☆ Save view</button><span class="mono o-muted">' + plural(list.length, 'member') + '</span></div>' +
      (list.length ? '<table class="tbl"><thead><tr><th scope="col"><input type="checkbox" id="selAll" aria-label="Select all ' + list.length + '"' + (all ? ' checked' : '') + '></th>' + cols.map(function (c) { var on = MV.sort === c[0]; return '<th scope="col"' + (c[2] ? ' class="num"' : '') + (on ? ' aria-sort="' + (MV.dir > 0 ? 'ascending' : 'descending') + '"' : '') + '><button type="button" data-sort="' + c[0] + '"' + (on ? ' aria-sort' : '') + '>' + c[1] + '<span class="ar" aria-hidden="true">' + (on ? (MV.dir > 0 ? '↑' : '↓') : '') + '</span></button></th>'; }).join('') + '</tr></thead><tbody>' +
        list.map(function (m) { var st = status(m), sel = MV.sel.indexOf(m.no) > -1; return '<tr data-member="' + m.no + '"' + (sel ? ' class="sel"' : '') + '><td><input type="checkbox" data-sel="' + m.no + '" aria-label="Select ' + esc(m.name) + '"' + (sel ? ' checked' : '') + '></td>' +
          '<td class="nmc"><span class="nm">' + av(m.name) + '<span><b>' + esc(m.name) + '</b><br><span class="mono o-muted">' + m.no + (m.tags.length ? ' · ' + esc(m.tags.join(', ')) : '') + '</span></span></span></td>' +
          '<td class="sub-m">' + m.plan + '<span class="m-only"> · ' + bn(m.branch) + ' · renews ' + F.nice(m.renews) + '</span></td><td class="hide-m">' + bn(m.branch) + '</td><td class="hide-m">' + F.nice(m.renews) + ' <span class="mono o-muted">' + rel(m.renews) + '</span></td>' +
          '<td class="num hide-m">' + m.visits + '</td><td class="num hide-m' + (m.dues ? ' o-err' : '') + '">' + (m.dues ? F.rupees(m.dues) : '—') + '</td><td class="stc"><span class="o-chip ' + st[1] + '">' + st[0] + '</span></td></tr>'; }).join('') + '</tbody></table>'
        : empty('No one in this view', MV.q ? 'Nobody matches “' + esc(MV.q) + '”. Check the spelling or clear the plan filter.' : 'This view is empty right now. That’s usually good news.', '<button class="o-btn" type="button" data-view="all">Show all members</button>')) +
      (MV.sel.length ? '<div class="bulk" role="region" aria-label="Bulk actions"><b>' + plural(MV.sel.length, 'member') + ' selected</b><button class="o-btn" type="button" data-bulk="remind">Renewal reminder</button><button class="o-btn" type="button" data-bulk="tag">Add tag</button><button class="o-btn" type="button" data-bulk="freeze">Freeze 2 weeks</button><button class="o-btn ghost" type="button" data-bulk="clear">Clear</button></div>' : '') + '</div>';
    var q = $('#mQ'); q.addEventListener('input', function () { MV.q = q.value; MV.cv = ''; var p = q.selectionStart; VIEWS.members(); var n = $('#mQ'); n.focus(); n.setSelectionRange(p, p); });
    $('#mPlan').addEventListener('change', function (e) { MV.plan = e.target.value; MV.cv = ''; VIEWS.members(); });
  };
  SUBS.members = function () { return plural(roster().filter(inB).length, 'member'); };
  /* bulk with a preview: who changes, who is skipped and why, then Apply → toast with Undo */
  function bulkPreview(kind, tag) {
    var R = roster(), sel = R.filter(function (m) { return MV.sel.indexOf(m.no) > -1; });
    var rows = sel.map(function (m) {
      if (kind === 'remind') return m.frozen ? [m, false, 'Skipped: frozen'] : [m, true, '“' + renewMsg(m).slice(0, 70) + '…”'];
      if (kind === 'freeze') return m.frozen ? [m, false, 'Already frozen'] : m.failed ? [m, false, 'Skipped: payment failed'] : [m, true, 'Renews ' + F.nice(m.renews) + ' → ' + F.nice(F.iso(new Date(new Date(m.renews).getTime() + 14 * DAY)))];
      return m.tags.indexOf(tag) > -1 ? [m, false, 'Already tagged'] : [m, true, '+ ' + tag];
    });
    var ok = rows.filter(function (r) { return r[1]; }).length;
    var title = { remind: 'Send renewal reminders', freeze: 'Freeze for 2 weeks', tag: 'Tag “' + esc(tag) + '”' }[kind];
    $('#modalIn').innerHTML = '<p class="mono o-muted">Preview · nothing has changed yet</p><h3>' + title + '</h3><div class="pv-sum"><span class="o-chip v">' + ok + ' will change</span>' + (rows.length - ok ? '<span class="o-chip">' + (rows.length - ok) + ' skipped</span>' : '') + '</div>' +
      '<ul class="pv" style="max-height:44vh;overflow:auto">' + rows.map(function (r) { return '<li><span><b>' + esc(r[0].name) + '</b><br><span class="o-muted" style="font-size:12.5px">' + esc(r[2]) + '</span></span><span class="o-chip ' + (r[1] ? 'v' : '') + '">' + (r[1] ? 'Change' : 'Skip') + '</span></li>'; }).join('') + '</ul>' +
      (kind === 'remind' ? '<p class="mono o-muted">Reminders are copied to WhatsApp Business for you to send. Nothing leaves this browser.</p>' : '') +
      '<div class="o-row"><button class="btn volt sm" type="button" data-apply="' + kind + '"' + (ok ? '' : ' disabled') + '><span>Apply to ' + plural(ok, 'member') + '</span></button><button class="o-btn ghost" type="button" data-close>Cancel</button></div>';
    var d = $('#modal'); if (!d.open) d.showModal();
    $('[data-apply]', d).onclick = function () {
      var undo = snap(['roster']), R2 = roster(), n = 0, msgs = [];
      R2.forEach(function (m) { var r = rows.filter(function (x) { return x[0].no === m.no && x[1]; })[0]; if (!r) return; n++;
        if (kind === 'remind') { msgs.push(renewMsg(m)); m.notes.push({ at: new Date().toISOString(), by: 'Priya', text: 'Renewal reminder queued (bulk)' }); }
        if (kind === 'freeze') { m.frozen = true; m.frozenTo = dIso(14); m.renews = F.iso(new Date(new Date(m.renews).getTime() + 14 * DAY)); }
        if (kind === 'tag') m.tags.push(tag); });
      if (msgs.length) copy(msgs.join('\n\n'));
      saveRoster(R2); d.close(); MV.sel = []; render(); toast(title.replace(/“|”/g, '') + ' · <b>' + plural(n, 'member') + '</b>' + (kind === 'remind' ? ' · messages copied' : ''), undo);
    };
  }
  function askTag() {
    $('#modalIn').innerHTML = '<p class="mono o-muted">Bulk · ' + plural(MV.sel.length, 'member') + '</p><h3>Add a tag</h3><form id="tagF" class="o-row" style="flex-wrap:nowrap"><input class="o-input" name="t" placeholder="e.g. HYROX Jan" aria-label="Tag" required style="flex:1" list="tagList"><datalist id="tagList"><option>HYROX Jan</option><option>Corporate · Ledgerline</option><option>Physio follow-up</option><option>Morning crew</option></datalist><button class="btn volt sm" type="submit"><span>Preview</span></button></form>';
    var d = $('#modal'); if (!d.open) d.showModal(); $('#tagF input').focus();
    $('#tagF').onsubmit = function (e) { e.preventDefault(); bulkPreview('tag', e.target.t.value.trim()); };
  }
  function saveViewDlg() {
    $('#modalIn').innerHTML = '<p class="mono o-muted">Saved views</p><h3>Name this view</h3><p class="o-muted">Keeps the tab, search, plan filter and sort. It shows up as a ★ tab.</p><form id="svF" class="o-row" style="flex-wrap:nowrap"><input class="o-input" name="n" required placeholder="e.g. Saket Club renewals" aria-label="View name" style="flex:1"><button class="btn volt sm" type="submit"><span>Save</span></button></form>';
    var d = $('#modal'); d.showModal(); $('#svF input').focus();
    $('#svF').onsubmit = function (e) { e.preventDefault(); var c = custom(), id = 'v' + F.uid(); c.push({ id: id, name: e.target.n.value.trim(), base: MV.view, q: MV.q, plan: MV.plan, sort: MV.sort, dir: MV.dir }); F.set('ops-views', c); MV.cv = id; d.close(); render(); toast('View saved'); };
  }

  /* slide-over member profile */
  var lastFocus = null;
  function openSlide(no) {
    var m = memberBy(no); if (!m) return; var st = status(m), sl = $('#slide');
    lastFocus = document.activeElement;
    var heat = m.heat.split('').map(function (c, i) { var d = new Date(Date.now() - (83 - i) * DAY); return '<i class="' + (c === '1' ? 'y' : c === 'f' ? 'f' : '') + '" title="' + F.nice(F.iso(d)) + (c === '1' ? ': trained' : c === 'f' ? ': frozen' : '') + '"></i>'; }).join('');
    var done = todayCI().some(function (c) { return c.no === m.no; });
    sl.innerHTML = '<div class="sl-h">' + av(m.name) + '<div><h2 id="slH">' + esc(m.name) + '</h2><p class="mono o-muted">' + m.no + ' · ' + esc(m.phone) + '</p></div><button class="o-btn o-icon" type="button" data-slx aria-label="Close profile">' + SVG(IC.x) + '</button></div>' +
      '<div class="o-row"><span class="o-chip ' + st[1] + '">' + st[0] + '</span>' + m.tags.map(function (t) { return '<span class="o-chip">' + esc(t) + '</span>'; }).join('') + '</div>' +
      '<div class="o-row">' + (done ? '<span class="o-chip v">Checked in today</span>' : '<button class="btn volt sm" type="button" data-checkin="' + m.no + '"><span>Check in</span></button>') + '<button class="o-btn" type="button" data-mwa="' + m.no + '">' + SVG(IC.wa) + 'WhatsApp</button>' + (m.frozen ? '' : '<button class="o-btn" type="button" data-mfreeze="' + m.no + '">' + SVG(IC.snow) + 'Freeze</button>') + (m.failed ? '<button class="o-btn" type="button" data-collect="' + m.no + '">Collect ' + F.rupees(m.dues) + '</button>' : '') + '</div>' +
      '<section class="o-card"><div class="o-card-h"><h2>Attendance · 12 weeks</h2><span class="mono">' + plural(m.visits, 'visit') + ' / 30 d</span></div><div class="heat" role="img" aria-label="' + (m.heat.split('1').length - 1) + ' visits in 12 weeks">' + heat + '</div><p class="mono o-muted">Each column is a week, Monday at the top · last visit ' + (m.last === 0 ? 'today' : m.last + ' days ago') + '</p></section>' +
      '<section class="o-card"><div class="o-card-h"><h2>Membership</h2></div><dl class="kvs"><div><dt>Plan</dt><dd>' + m.plan + ' · ' + F.rupees(PLAN[m.plan]) + '/mo</dd></div><div><dt>Home floor</dt><dd>' + bn(m.branch) + '</dd></div><div><dt>Member since</dt><dd>' + F.nice(m.since) + '</dd></div><div><dt>' + (m.frozen ? 'Frozen until' : 'Renews') + '</dt><dd>' + F.nice(m.frozen ? m.frozenTo : m.renews) + '</dd></div><div><dt>Dues</dt><dd class="' + (m.dues ? 'o-err' : '') + '">' + (m.dues ? F.rupees(m.dues) : 'None') + '</dd></div><div><dt>No-shows</dt><dd>' + m.noshow + '</dd></div></dl></section>' +
      '<section class="o-card"><div class="o-card-h"><h2>Payments</h2><span class="mono">last 4</span></div><ul class="pay">' + m.pays.map(function (p) { return '<li><span>' + F.nice(p.date) + ' · ' + p.method + '</span><span class="' + (p.ok ? '' : 'o-err') + '">' + F.rupees(p.amt) + (p.ok ? '' : ' · failed') + '</span></li>'; }).join('') + '</ul></section>' +
      '<section class="o-card"><div class="o-card-h"><h2>Notes</h2><span class="mono">' + m.notes.length + '</span></div><ul class="notes">' + (m.notes.length ? m.notes.slice().reverse().map(function (n) { return '<li><span>' + esc(n.text) + '</span><span class="mono">' + esc(n.by) + ' · ' + agoL(n.at) + '</span></li>'; }).join('') : '<li class="o-muted">No notes yet.</li>') + '</ul>' +
      '<form class="o-row" id="noteF" style="flex-wrap:nowrap"><input class="o-input" name="n" placeholder="+ Add a note" aria-label="Add a note" required style="flex:1"><button class="o-btn" type="submit">Add</button></form></section>';
    sl.setAttribute('aria-hidden', 'false'); sl.setAttribute('role', 'dialog'); sl.setAttribute('aria-labelledby', 'slH'); sl.setAttribute('aria-modal', 'true');
    $('#slideBg').hidden = false; requestAnimationFrame(function () { sl.classList.add('on'); }); sl.dataset.no = no; sl.focus();
    $('#noteF').onsubmit = function (e) { e.preventDefault(); var R = roster(); R.forEach(function (x) { if (x.no === no) x.notes.push({ at: new Date().toISOString(), by: 'Priya', text: e.target.n.value.trim() }); }); saveRoster(R); openSlide(no); toast('Note added'); };
  }
  function closeSlide(silent) { var sl = $('#slide'); if (!sl.classList.contains('on')) return; sl.classList.remove('on'); sl.setAttribute('aria-hidden', 'true'); $('#slideBg').hidden = true; if (!silent && lastFocus && lastFocus.focus) lastFocus.focus(); }
  $('#slideBg').addEventListener('click', function () { closeSlide(); });

  /* ================= CLASSES ================= */
  var CL = { day: 0, open: '' };
  VIEWS.classes = function () {
    if (arg) { CL.open = arg; CL.day = daysTo(arg.split('|')[0]); arg = ''; }
    var d = new Date(); d.setDate(d.getDate() + CL.day);
    var S = sessionsFor(d), books = F.get('bookings', []), att = F.get('ops-attend', {});
    view.innerHTML = '<div><div class="tt-tools"><div class="seg" id="clDay" role="group" aria-label="Day">' + [0, 1, 2].map(function (k) { var x = new Date(); x.setDate(x.getDate() + k); return '<button type="button" data-day="' + k + '" class="' + (CL.day === k ? 'on' : '') + '" aria-pressed="' + (CL.day === k) + '">' + (k === 0 ? 'Today' : k === 1 ? 'Tomorrow' : F.DAYS[F.dow(x)] + ' ' + x.getDate()) + '</button>'; }).join('') + '</div><span class="mono o-muted">' + plural(S.length, 'session') + ' · ' + S.reduce(function (a, s) { return a + s.booked; }, 0) + ' booked</span></div>' +
      (S.length ? S.map(function (s) {
        var w = wlFor(s.id), open = CL.open === s.id, mine = books.filter(function (b) { return b.slot === s.id; }), names = mine.map(function (b) { return b.name; });
        for (var k = 0; names.length < s.booked; k++) { var nm = FN[F.hash(s.id + k) % FN.length] + ' ' + LN[F.hash(s.id + 'l' + k) % LN.length][0] + '.'; if (names.indexOf(nm) < 0) names.push(nm); }
        var here = att[s.id] || [];
        return '<div class="cl-row' + (open ? ' open' : '') + '"><button class="cl-sum" type="button" data-cl="' + esc(s.id) + '" aria-expanded="' + open + '"><span class="t">' + s.time + '</span><span><b>' + esc(s.cls.name) + '</b>' + (s.live ? ' <span class="o-chip v">● Now</span>' : s.past ? ' <span class="o-chip">Done</span>' : '') + '<br><span class="mono o-muted">' + s.cls.mins + ' min · ' + esc(F.types[s.cls.type] ? F.types[s.cls.type].name || s.cls.type : s.cls.type) + '</span></span><span class="co">' + esc(s.coach.name) + '</span><span class="fl">' + bn(s.branch) + '</span>' +
          '<span><span class="capn"><span>' + s.booked + ' / ' + s.cap + '</span><span>' + (s.left ? s.left + ' left' : 'Full') + '</span></span>' + meter(s.booked / s.cap, !s.left) + '</span><span class="wl">' + (w.length ? '<span class="o-chip v">' + w.length + ' waiting</span>' : '<span class="mono o-muted">No waitlist</span>') + '</span><span class="chev" aria-hidden="true">▾</span></button>' +
          (open ? '<div class="cl-body"><div><div class="o-card-h"><h2 class="o-h2">Roster</h2><span class="mono">' + here.length + ' / ' + names.length + ' here</span></div><ul class="ros">' + names.map(function (n) { var on = here.indexOf(n) > -1; return '<li><button class="ck' + (on ? ' on' : '') + '" type="button" data-att="' + esc(s.id) + '" data-n="' + esc(n) + '" aria-pressed="' + on + '" aria-label="Mark ' + esc(n) + ' present">' + (on ? '✓' : '') + '</button><span>' + esc(n) + (mine.some(function (b) { return b.name === n; }) ? ' <span class="o-chip v">web</span>' : '') + '</span><span class="mono o-muted">' + (on ? 'here' : '') + '</span></li>'; }).join('') + '</ul></div>' +
            '<div><div class="o-card-h"><h2 class="o-h2">Waitlist</h2><span class="mono">' + w.length + '</span></div>' + (w.length ? '<ul class="ros">' + w.map(function (x, i) { return '<li><span class="mono">' + (i + 1) + '</span><span><b>' + esc(x.name) + '</b><br><span class="mono o-muted">joined ' + agoL(x.at) + '</span></span><button class="o-btn v" type="button" data-promote="' + x.id + '">Promote</button></li>'; }).join('') + '</ul>' : '<p class="o-muted" style="padding:10px 0">Nobody waiting. When the class fills, members can join the waitlist from the app or website.</p>') +
            '<p class="mono o-muted" style="margin-top:10px">Coach: ' + esc(s.coach.name) + ' · ' + esc(s.cls.short || '') + '</p></div></div>' : '') + '</div>';
      }).join('') : empty('No sessions', 'Nothing on the timetable for this day at ' + (branch ? bn(branch) : 'either floor') + '.')) + '</div>';
    F.seg($('#clDay'));
    if (CL.open) { var r = $('.cl-row.open'); if (r && r.scrollIntoView) r.scrollIntoView({ block: 'nearest' }); }
  };

  /* ================= RENEWALS ================= */
  var R_O_L = { renewed: ['Renewed', 'v'], freeze: ['Freeze asked', 's'], noans: ['No answer', ''], later: ['Call back', 'w'], cancel: ['Cancelling', 'r'] };
  VIEWS.renewals = function () {
    var Q = renQueue(), log = F.get('queue-log', {}), done = Q.filter(function (m) { return log[m.name] && log[m.name].o !== 'later'; }).length, left = Q.length - done;
    var fz = F.get('freezes', []).filter(inB);
    view.innerHTML = '<div><section class="rq" aria-labelledby="rqH"><div><p class="mono o-muted">Queue · renewals in the next 7 days · owner Priya</p><h2 id="rqH">' + done + ' of ' + Q.length + ' done</h2>' + meter(Q.length ? done / Q.length : 1) +
      '<div class="o-row"><span class="o-chip">' + SVG(IC.clock) + ' ≈ ' + left * 2 + ' min left</span><span class="o-chip">aim ≈ 2 min a call</span><span class="o-chip">due today 19:00</span></div></div>' +
      (left ? '<button class="btn volt" type="button" data-play="renewals"><span>▶ Play · ' + left + ' left</span></button>' : '<span class="o-chip v">All called</span>') + '</section>' +
      '<div class="o-grid2"><section class="o-card" aria-labelledby="rlH"><div class="o-card-h"><h2 id="rlH">Renewing this week</h2><span class="mono">' + Q.length + '</span></div>' +
        (Q.length ? '<ul class="ren-l">' + Q.map(function (m) { var o = log[m.name], l = o && R_O_L[o.o]; return '<li>' + av(m.name) + '<div><b>' + esc(m.name) + '</b><p class="mono o-muted">' + m.plan + ' · ' + plural(m.visits, 'visit') + ' / 30 d</p></div><span class="mono hide-m">' + F.nice(m.renews) + '<br><span class="o-muted">' + rel(m.renews) + '</span></span><span class="hide-m">' + (m.failed ? '<span class="o-chip r">Card failed</span>' : '<span class="mono o-muted">' + bn(m.branch) + '</span>') + '</span>' +
          (l ? '<span class="o-chip ' + l[1] + '">' + l[0] + '</span>' : '<button class="o-btn" type="button" data-rcall="' + m.no + '">' + SVG(IC.phone) + 'Call</button>') + '</li>'; }).join('') + '</ul>' : empty('No renewals this week', 'Nobody renews in the next 7 days at this floor.')) + '</section>' +
        '<section class="o-card" id="freezes" aria-labelledby="fzH"><div class="o-card-h"><h2 id="fzH">Freeze requests</h2><span class="mono">' + fz.filter(function (f) { return f.status === 'pending'; }).length + ' pending</span></div>' +
          (fz.length ? '<ul class="ren-l">' + fz.map(function (f) { return '<li>' + av(f.name) + '<div><b>' + esc(f.name) + '</b><p class="mono o-muted">' + f.weeks + ' weeks from ' + F.nice(f.from) + ' · ' + esc(f.reason) + '</p></div>' + (f.status === 'pending' ? '<span class="o-row" style="flex-wrap:nowrap"><button class="o-btn v" type="button" data-fz="' + f.id + '" data-v="approved">Approve</button><button class="o-btn" type="button" data-fz="' + f.id + '" data-v="declined">Decline</button></span>' : '<span class="o-chip ' + (f.status === 'approved' ? 'v' : '') + '">' + f.status + '</span>') + '</li>'; }).join('') + '</ul>' : empty('No freeze requests', 'Members ask from the app; they land here.')) + '</section></div></div>';
    if (arg === 'freezes') { arg = ''; var el = $('#freezes'); if (el) el.scrollIntoView({ block: 'start' }); }
  };
  SUBS.renewals = function () { return 'Queue resets every morning'; };

  /* ================= 1:1s ================= */
  VIEWS.pt = function () {
    var P = F.get('pt', []).filter(inB).sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; }), req = P.filter(function (p) { return p.status === 'requested'; }), rest = P.filter(function (p) { return p.status !== 'requested'; });
    var row = function (p) { return '<li>' + av(p.name) + '<div><b>' + esc(p.name) + '</b> <span class="o-muted">with ' + esc(p.coachName) + '</span><p class="mono o-muted">' + esc(p.type) + ' · ' + p.mins + ' min · ' + (p.price ? F.rupees(p.price) : 'included') + '</p></div><span class="mono hide-m">' + F.nice(p.date) + ' · ' + p.time + '<br><span class="o-muted">' + bn(p.branch) + '</span></span><span class="hide-m"></span>' +
      (p.status === 'requested' ? '<span class="o-row" style="flex-wrap:nowrap"><button class="o-btn v" type="button" data-pt="' + p.id + '" data-v="confirmed">Confirm</button><button class="o-btn" type="button" data-pt="' + p.id + '" data-v="declined">Decline</button></span>' : '<span class="o-chip ' + (p.status === 'confirmed' ? 'v' : '') + '">' + p.status + '</span>') + '</li>'; };
    view.innerHTML = '<div class="o-grid2"><section class="o-card"><div class="o-card-h"><h2>Requests</h2><span class="mono">' + req.length + '</span></div>' + (req.length ? '<ul class="ren-l">' + req.map(row).join('') + '</ul>' : empty('No requests waiting', 'Members book 1:1s from each coach’s page. Requests land here for a quick confirm.', '<a class="o-btn" href="coach.html?id=kofi">See a coach page</a>')) + '</section>' +
      '<section class="o-card"><div class="o-card-h"><h2>Booked</h2><span class="mono">' + rest.length + '</span></div>' + (rest.length ? '<ul class="ren-l">' + rest.map(row).join('') + '</ul>' : empty('Nothing booked yet', 'Confirmed sessions show here with the coach and room.')) + '</section></div>';
  };

  /* ================= MESSAGES (conversations inbox) ================= */
  function seedThreads() {
    return [
      { id: 'th1', kind: 'whatsapp', name: 'Aman Khurana', sub: 'Trial · Gurugram', at: dAgo(0, 9, 12), unread: true, msgs: [{ f: 'out', t: 'Hi Aman, it’s the front desk at Forge Gurugram. Thanks for booking a free trial. Would 07:00 or 18:30 suit you better?', at: dAgo(1, 19, 30) }, { f: 'in', t: '18:30 works. Is there parking at the building?', at: dAgo(0, 9, 12) }] },
      { id: 'th2', kind: 'whatsapp', name: 'Nisha Pillai', sub: 'Member · Club', at: dAgo(0, 8, 2), unread: true, msgs: [{ f: 'in', t: 'Hi, I have exams all of December. Can I pause instead of cancelling?', at: dAgo(0, 8, 2) }] },
      { id: 'th3', kind: 'whatsapp', name: 'Zara Ahmed', sub: 'Waitlist · Heavy Hour', at: dAgo(1, 17, 40), unread: false, msgs: [{ f: 'out', t: 'Hi Zara, you’re 2nd on the waitlist for Heavy Hour. We’ll message you the moment a spot opens.', at: dAgo(1, 17, 30) }, { f: 'in', t: 'Thank you!', at: dAgo(1, 17, 40) }] }
    ];
  }
  var MS = { open: '', filter: '' };
  /* website chat lives in the shared Orbit store (orbit-convos); the website's chat tab picks up our writes through the storage event */
  function oc() { try { return JSON.parse(localStorage.getItem('orbit-convos') || '[]'); } catch (e) { return []; } }
  function ocUpd(id, fn) { var a = oc(); a.forEach(function (c) { if (c.id === id) { fn(c); c.updatedAt = Date.now(); } }); try { localStorage.setItem('orbit-convos', JSON.stringify(a)); } catch (e) {} }
  function ocMsg(c, from, text, kind) { c.messages.push({ id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), from: from, name: from === 'agent' ? 'Priya' : undefined, kind: kind, text: text, ts: Date.now() }); }
  var CST = { bot: ['Assistant handling', ''], waiting: ['Waiting for a person', 'w'], human: ['You’re in the chat', 'v'], resolved: ['Resolved', 's'] };
  function seedChats() {
    if (F.get('ops-chatseed', false)) return; var a = oc(), t0 = Date.now();
    if (!a.some(function (c) { return c.id === 'fg-seed1'; })) a.push({ id: 'fg-seed1', seed: true, agent: 'forge', agentName: 'Forge Front Desk', channel: 'web', source: 'Website chat', status: 'waiting', startedAt: t0 - 9e5, updatedAt: t0 - 6e5, engaged: true, handoverReason: 'Visitor asked for a person', user: { name: 'Rhea Malik' }, mem: {}, context: { page: 'class', id: 'foundations' }, messages: [
      { id: 's1', from: 'bot', text: 'Good afternoon. Looking at Barbell Foundations? The next one is tomorrow at 07:30 at Saket, 5 of 6 spots open.', ts: t0 - 9e5 },
      { id: 's2', from: 'user', text: 'Can my 15 year old son come with me? He plays cricket', ts: t0 - 8.4e5 },
      { id: 's3', from: 'bot', text: 'From 16 with a parent’s consent, and no upper limit. Want me to bring in the front desk for a 15-year-old?', ts: t0 - 8.2e5 },
      { id: 's4', from: 'user', text: 'yes please, talk to someone', ts: t0 - 6e5 }, { id: 's5', from: 'system', kind: 'system', text: 'Thanks. A person will reply here shortly.', ts: t0 - 6e5 }] });
    if (!a.some(function (c) { return c.id === 'fg-seed2'; })) a.push({ id: 'fg-seed2', seed: true, agent: 'forge', agentName: 'Forge Front Desk', channel: 'web', source: 'Instagram (website chat)', status: 'bot', startedAt: t0 - 5.4e6, updatedAt: t0 - 5e6, engaged: true, user: { name: 'Aditya Rao', phone: '+91 98••• ••552' }, mem: {}, context: { page: 'index' }, leadId: 'L-1311', messages: [
      { id: 'a1', from: 'bot', text: 'Good morning. This is the Forge front desk. Tell me what you want from training and I’ll find the class or book your free trial.', ts: t0 - 5.4e6 },
      { id: 'a2', from: 'user', text: 'kal subah strength class saket', ts: t0 - 5.3e6 }, { id: 'a3', from: 'bot', text: 'Pick a time on tomorrow, mornings first. Spots left are live:', ts: t0 - 5.28e6 },
      { id: 'a4', from: 'user', text: '07:00 · Heavy Hour', ts: t0 - 5.2e6 }, { id: 'a5', from: 'user', text: 'Aditya Rao, 98xxx xx552', ts: t0 - 5.1e6 },
      { id: 'a6', from: 'bot', text: 'You’re in, Aditya. See you on the floor.', cards: [{ title: 'Heavy Hour · free trial' }], ts: t0 - 5e6 }] });
    try { localStorage.setItem('orbit-convos', JSON.stringify(a)); } catch (e) {}
    var L = leads(); if (!L.some(function (l) { return l.convo === 'fg-seed2'; })) { L.unshift({ id: 'cseed', name: 'Aditya Rao', phone: '+91 98••• ••552', branch: 'saket', goal: 'Get stronger', day: dIso(1), stage: 'new', at: new Date(t0 - 5e6).toISOString(), source: 'Chat', chat: true, convo: 'fg-seed2', plan: '', notes: ['Booked in chat: Heavy Hour, tomorrow 07:00'] }); saveLeads(L); }
    F.set('ops-chatseed', true);
  }
  function threads() {
    var base = F.get('ops-threads', []), st = F.get('ops-tstate', {}), out = base.slice();
    oc().filter(function (c) { return c.agent === 'forge' && (c.engaged || c.messages.some(function (m) { return m.from === 'user'; })); }).forEach(function (c) {
      var last = c.messages[c.messages.length - 1] || {};
      out.push({ id: 'ch-' + c.id, cid: c.id, kind: 'chat', name: (c.user && c.user.name) || 'Website visitor', sub: 'Website chat · ' + (c.context && c.context.page ? 'on ' + (c.context.page === 'index' ? 'home' : c.context.page) + (c.context.id ? ' (' + c.context.id + ')' : '') : 'website'), at: new Date(c.updatedAt || c.startedAt).toISOString(),
        unread: c.status === 'waiting' || (c.status === 'human' && last.from === 'user'), status: c.status, reason: c.handoverReason, lead: c.leadId,
        msgs: c.messages.map(function (m) { return { f: m.from === 'user' ? 'in' : m.from === 'agent' ? 'out' : m.from === 'bot' ? 'bot' : 'sys', t: String(m.text || '').replace(/\*\*/g, '') + (m.cards && m.cards.length ? (m.text ? '\n' : '') + '▸ ' + m.cards.map(function (k) { return k.title; }).join(' · ') : ''), at: new Date(m.ts).toISOString() }; }) });
    });
    F.get('inbox', []).forEach(function (m) { var corp = m.kind === 'corporate'; out.push({ id: 'ib-' + m.id, kind: 'form', name: m.name, sub: corp ? 'Corporate · ' + m.company : 'Careers · ' + m.role, at: m.at, unread: m.status === 'new', msgs: [{ f: 'sys', t: corp ? 'Corporate enquiry from the website' : 'Job application from careers', at: m.at }, { f: 'in', t: corp ? m.company + ', ' + m.size + ' people. Nearest floor: ' + (m.branch === 'both' ? 'both' : bn(m.branch)) + '. Reply to ' + m.email + '.' + (m.note ? ' “' + m.note + '”' : '') : (m.cert ? m.cert + '. ' : '') + (m.why || '') + ' (' + m.years + ' yrs)', at: m.at }] }); });
    out.forEach(function (t) { if (t.kind === 'chat') return; var s = st[t.id]; if (s) { if (s.read) t.unread = false; if (s.msgs) t.msgs = t.msgs.concat(s.msgs); if (s.msgs && s.msgs.length) t.at = s.msgs[s.msgs.length - 1].at; } });
    return out.sort(function (a, b) { return (b.status === 'waiting') - (a.status === 'waiting') || (a.at < b.at ? 1 : -1); });
  }
  var QUICK = [['Trial times', 'We run trials every day at 07:00 and 18:30. Which suits you?'], ['Pricing', 'Plans start at ₹2,900 a month (Off-Peak). Club, our most popular, is ₹6,500 with unlimited classes on both floors.'], ['Freeze', 'You can freeze for 2 to 8 weeks, once a year. Your renewal date moves by the same time. Want me to set it up?'], ['Under 16', 'From 16 with a parent’s consent. For a 15-year-old, Kofi can do a 1:1 technique session with you both first.'], ['Parking', 'Yes, there’s free basement parking. Tell the guard you’re visiting Forge.']];
  VIEWS.messages = function () {
    if (arg) { MS.open = arg; arg = ''; }
    var T = threads().filter(function (t) { return !MS.filter || t.kind === MS.filter; });
    if (!MS.open && T.length && !matchMedia('(max-width:860px)').matches) MS.open = T[0].id;
    var open = T.filter(function (t) { return t.id === MS.open; })[0];
    if (open && open.kind !== 'chat' && open.unread) { var st = F.get('ops-tstate', {}); st[open.id] = st[open.id] || {}; st[open.id].read = true; F.set('ops-tstate', st); open.unread = false; nav(); }
    var lbl = { chat: 'Chat', whatsapp: 'WhatsApp', form: 'Form' }, isChat = open && open.kind === 'chat', canReply = !isChat || open.status === 'human';
    var bar = '';
    if (isChat) { var cs = CST[open.status] || CST.bot; bar = '<div class="msg-live"><span class="o-chip ' + cs[1] + '">' + (open.status === 'waiting' || open.status === 'human' ? '● ' : '') + cs[0] + '</span>' + (open.reason && open.status === 'waiting' ? '<span class="mono o-muted">' + esc(open.reason) + '</span>' : '') + '<span class="sp"></span>' +
      (open.status === 'bot' || open.status === 'waiting' ? '<button class="o-btn v" type="button" data-cv="take">Take over</button>' : '') + (open.status === 'human' ? '<button class="o-btn" type="button" data-cv="back">Hand back to assistant</button>' : '') + (open.status !== 'resolved' ? '<button class="o-btn" type="button" data-cv="resolve">Resolve</button>' : '<button class="o-btn" type="button" data-cv="take">Reopen</button>') + '</div>'; }
    var board = isChat && leads().filter(function (l) { return l.convo === open.cid; })[0];
    view.innerHTML = '<div><div class="views" role="group" aria-label="Channel">' + [['', 'All'], ['chat', 'Website chat'], ['whatsapp', 'WhatsApp'], ['form', 'Forms']].map(function (f) { return '<button type="button" data-mf="' + f[0] + '" aria-pressed="' + (MS.filter === f[0]) + '">' + f[1] + '<span class="c">' + threads().filter(function (t) { return !f[0] || t.kind === f[0]; }).length + '</span></button>'; }).join('') + '</div>' +
      '<div class="msg' + (open ? ' th-open' : '') + '"><div class="msg-l">' + (T.length ? T.map(function (t) { var last = t.msgs[t.msgs.length - 1]; return '<button type="button" data-th="' + t.id + '"' + (t.id === MS.open ? ' aria-current="true"' : '') + '>' + av(t.name) + '<span><b>' + esc(t.name) + '</b> <span class="o-chip' + (t.kind === 'chat' ? ' v' : '') + '">' + lbl[t.kind] + '</span>' + (t.status === 'waiting' ? ' <span class="o-chip w">Waiting</span>' : '') + '<span class="pv">' + esc(last ? last.t : '') + '</span></span><span class="mono o-muted">' + ago(t.at) + (t.unread ? '<span class="un" aria-label="unread" style="display:block;margin-left:auto"></span>' : '') + '</span></button>'; }).join('') : empty('No conversations', 'Website chat, WhatsApp and form messages land here.')) + '</div>' +
      '<div class="msg-t">' + (open ? '<div class="msg-th"><div><button class="o-btn ghost m-back" type="button" data-thback aria-label="Back to conversations">←</button> <b>' + esc(open.name) + '</b><p class="mono o-muted">' + esc(open.sub) + '</p></div>' + (board ? '<a class="o-btn" href="#trials">On the trial board · ' + esc(({ new: 'Trial booked', contacted: 'Followed up', trial: 'Trained', joined: 'Joined', lost: 'Not interested' })[board.stage] || '') + '</a>' : '') + '</div>' + bar +
        '<div class="msg-b" id="msgB" role="log" aria-live="polite">' + open.msgs.map(function (m) { return '<p class="bub ' + m.f + '">' + (m.f === 'bot' ? '<small class="who">Assistant</small>' : m.f === 'out' && isChat ? '<small class="who">You</small>' : '') + esc(m.t).replace(/\n/g, '<br>') + (m.f !== 'sys' ? '<small>' + hm(m.at) + (m.demo ? ' · sent' : '') + '</small>' : '') + '</p>'; }).join('') + '</div>' +
        (canReply && open.status !== 'resolved' ? '<div class="msg-c"><div class="tpls">' + QUICK.map(function (q, i) { return '<button class="o-btn" type="button" data-qr="' + i + '">' + q[0] + '</button>'; }).join('') + '</div><form id="msgF"><input class="o-input" name="m" placeholder="Reply to ' + esc(first(open.name)) + '" aria-label="Reply" autocomplete="off" required><button class="btn volt sm" type="submit"><span>Send</span></button></form></div>'
          : '<div class="msg-c"><p class="mono o-muted">' + (open.status === 'resolved' ? 'Resolved. Reopen to reply.' : 'The assistant is handling this chat. Take over to reply as Priya.') + '</p></div>')
        : empty('Pick a conversation', 'Website chat leads, WhatsApp replies and form enquiries, in one place.')) + '</div></div></div>';
    var b = $('#msgB'); if (b) b.scrollTop = b.scrollHeight;
    var f = $('#msgF'); if (f) f.onsubmit = function (e) { e.preventDefault(); var txt = f.m.value.trim(); if (!txt) return;
      if (isChat) ocUpd(open.cid, function (c) { ocMsg(c, 'agent', txt); });
      else { var st2 = F.get('ops-tstate', {}); st2[open.id] = st2[open.id] || {}; st2[open.id].read = true; (st2[open.id].msgs = st2[open.id].msgs || []).push({ f: 'out', t: txt, at: new Date().toISOString(), demo: true }); F.set('ops-tstate', st2); }
      VIEWS.messages(); var n = $('#msgF input'); if (n) n.focus(); };
  };
  function chatAct(k) {
    var t = threads().filter(function (x) { return x.id === MS.open; })[0]; if (!t || !t.cid) return;
    ocUpd(t.cid, function (c) {
      if (k === 'take') { c.status = 'human'; c.person = 'Priya (front desk)'; ocMsg(c, 'system', 'Connected to Priya (front desk)', 'system'); }
      if (k === 'back') { c.status = 'bot'; c.person = null; ocMsg(c, 'system', 'You are back with the assistant. Anything else I can help with?', 'system'); }
      if (k === 'resolve') { c.status = 'resolved'; ocMsg(c, 'system', 'Conversation resolved by Priya', 'system'); }
    });
    VIEWS.messages(); nav(); toast({ take: 'You’re in the chat. Replies show on the visitor’s screen.', back: 'Handed back to the assistant', resolve: 'Conversation resolved' }[k]);
    var i = $('#msgF input'); if (i) i.focus();
  }

  /* ================= REPORTS ================= */
  VIEWS.reports = function () {
    var S = F.sources(), L = leads().filter(inB), mx = Math.max.apply(null, S.map(function (s) { return s[1]; }));
    var booked = L.length + 41, showed = Math.round(booked * 0.74), joined = L.filter(function (l) { return l.stage === 'joined'; }).length + 14;
    var R = roster().filter(inB), byPlan = {}; R.forEach(function (m) { byPlan[m.plan] = (byPlan[m.plan] || 0) + 1; });
    var rev = Object.keys(PLAN).map(function (p) { return [p, (byPlan[p] || 0) * PLAN[p]]; }), rmx = Math.max.apply(null, rev.map(function (r) { return r[1]; })) || 1, tot = rev.reduce(function (a, r) { return a + r[1]; }, 0);
    var hours = []; for (var h = 6; h <= 21; h++) hours.push(h);
    var grid = '<span></span>' + hours.map(function (h) { return '<span>' + (h % 3 === 0 ? h : '') + '</span>'; }).join('') + '<span></span>';
    for (var d = 0; d < 7; d++) { var day = new Date(); day.setDate(day.getDate() - F.dow(day) + d); var ss = sessionsFor(day); grid += '<span>' + F.DAYS[d] + '</span>' + hours.map(function (h) { var at = ss.filter(function (s) { return +s.time.slice(0, 2) === h; }); var f = at.length ? at.reduce(function (a, s) { return a + s.booked / s.cap; }, 0) / at.length : 0; return '<i style="--a:' + (at.length ? (0.12 + f * 0.85).toFixed(2) : 0.03) + '" title="' + F.DAYS[d] + ' ' + h + ':00 · ' + (at.length ? Math.round(f * 100) + '% full' : 'no class') + '"></i>'; }).join('') + '<span></span>'; }
    view.innerHTML = '<div class="rp">' +
      '<section class="o-card"><div class="o-card-h"><h2>Lead sources · 30 days</h2><span class="mono">trials / joined</span></div><ul class="bars">' + S.map(function (s) { return '<li><span>' + s[0] + '</span><span class="b"><i style="--f:' + (s[1] / mx).toFixed(3) + '"></i></span><span class="mono">' + s[1] + ' / ' + s[2] + '</span></li>'; }).join('') + '</ul><p class="mono o-muted">Referrals convert best: ' + Math.round(S[2][2] / S[2][1] * 100) + '% join after a trial.</p></section>' +
      '<section class="o-card"><div class="o-card-h"><h2>Trial funnel · 30 days</h2><span class="mono">' + Math.round(joined / booked * 100) + '% end to end</span></div><ul class="bars">' + [['Booked', booked], ['Showed up', showed], ['Joined', joined]].map(function (r) { return '<li><span>' + r[0] + '</span><span class="b"><i style="--f:' + (r[1] / booked).toFixed(3) + '"></i></span><span class="mono">' + r[1] + '</span></li>'; }).join('') + '</ul><p class="mono o-muted">Biggest leak: booked but never showed. A same-day WhatsApp confirm usually fixes half of it.</p></section>' +
      '<section class="o-card"><div class="o-card-h"><h2>Class fill · this week</h2><span class="mono">by hour</span></div><div class="hm" role="img" aria-label="Heatmap of class fill by day and hour">' + grid + '</div><p class="mono o-muted">07:00 and 18:30 are full most days; 10:00–16:00 has room for Off-Peak.</p></section>' +
      '<section class="o-card"><div class="o-card-h"><h2>Monthly revenue by plan</h2><span class="mono">' + F.rupees(tot) + ' · this month</span></div><ul class="bars">' + rev.map(function (r) { return '<li><span>' + r[0] + '</span><span class="b"><i class="' + (r[0] === 'Club' ? '' : 'g') + '" style="--f:' + (r[1] / rmx).toFixed(3) + '"></i></span><span class="mono">' + F.rupees(r[1]) + '</span></li>'; }).join('') + '</ul><p class="mono o-muted">' + plural(R.length, 'member') + ' on the roster.</p></section></div>';
  };
  SUBS.reports = function () { return 'Last 30 days'; };

  /* ================= SETTINGS ================= */
  VIEWS.settings = function () {
    var T = tpls(), names = { trial: 'New trial', confirm: 'Trial confirmation', nudge: 'After the trial', renew: 'Renewal reminder', waitlist: 'Waitlist promoted' };
    view.innerHTML = '<div class="set"><section class="o-card"><div class="o-card-h"><h2>WhatsApp templates</h2><span class="mono">{first} {branch} {day} {plan}</span></div><form id="tplF" style="display:flex;flex-direction:column;gap:12px">' +
      Object.keys(T).map(function (k) { return '<label><span>' + names[k] + '</span><textarea name="' + k + '">' + esc(T[k]) + '</textarea></label>'; }).join('') + '<div class="o-row"><button class="btn volt sm" type="submit"><span>Save templates</span></button><button class="o-btn ghost" type="button" id="tplReset">Restore defaults</button></div></form></section>' +
      '<div style="display:flex;flex-direction:column;gap:16px"><section class="o-card"><div class="o-card-h"><h2>Floors &amp; hours</h2></div><ul class="pay">' + Object.keys(F.branches).map(function (b) { return '<li><span><b>' + bn(b) + '</b><br><span class="o-muted">' + esc(F.branches[b].addr || '') + '</span></span><span class="mono">05:30–22:30 · Sun 07:00–13:00</span></li>'; }).join('') + '</ul></section>' +
      '<section class="o-card"><div class="o-card-h"><h2>Front-desk team</h2></div><ul class="ql">' + [['Priya Sharma', 'Front desk · Saket', 'On shift'], ['Rahul Verma', 'Front desk · Gurugram', 'On shift'], ['Kofi Mensah', 'Head coach', 'Coach access']].map(function (p) { return '<li>' + av(p[0]) + '<div><b>' + p[0] + '</b><p class="mono">' + p[1] + '</p></div><span class="o-chip">' + p[2] + '</span></li>'; }).join('') + '</ul></section>' +
      '<section class="o-card"><div class="o-card-h"><h2>Start fresh</h2></div><p class="o-muted">Clears today’s queue outcomes, notes and messages on this device and reloads the starting roster.</p><button class="o-btn" type="button" id="resetDemo">Start fresh</button></section></div></div>';
    $('#tplF').onsubmit = function (e) { e.preventDefault(); var o = {}; Object.keys(TPL_DEF).forEach(function (k) { o[k] = e.target[k].value; }); var undo = snap(['ops-tpls']); F.set('ops-tpls', o); toast('Templates saved', undo); };
    $('#tplReset').onclick = function () { var undo = snap(['ops-tpls']); F.set('ops-tpls', {}); render(); toast('Defaults restored', undo); };
    $('#resetDemo').onclick = function () {
      $('#modalIn').innerHTML = '<p class="mono o-muted">Settings</p><h3>Start fresh?</h3><p class="o-muted">Clears leads, roster, check-ins, queues, notes and messages saved by the staff app in this browser. Member-app and website bookings stay.</p><div class="o-row"><button class="btn volt sm" type="button" id="rsGo"><span>Reset</span></button><button class="o-btn ghost" type="button" data-close>Cancel</button></div>';
      $('#modal').showModal();
      $('#rsGo').onclick = function () { ['leads', 'roster', 'checkins', 'queue-log', 'ops-threads', 'ops-tstate', 'ops-views', 'ops-attend', 'ops-tpls', 'freezes', 'pt', 'inbox', 'signups', 'waitlist'].forEach(function (k) { try { localStorage.removeItem('forge:' + k); } catch (x) {} }); seedAll(); $('#modal').close(); go('today'); toast('Fresh start: roster and queues reloaded'); };
    };
  };

  /* ================= + NEW ================= */
  function newFlow(kind) {
    var d = $('#modal'), sel = function (n, opts, lab) { return '<label class="fld"><span class="lab">' + lab + '</span><select name="' + n + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[2] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select><em class="msg"></em></label>'; };
    var br = [['saket', 'Saket', (branch || 'saket') === 'saket'], ['gurugram', 'Gurugram', branch === 'gurugram']];
    var H = { walkin: ['Walk-in', 'Day pass · ₹800, then check in'], trial: ['New trial', 'Lands in “Trial booked” on the board'], member: ['Quick add member', 'Adds to the roster; payment is taken at the desk'] }[kind];
    $('#modalIn').innerHTML = '<p class="mono o-muted">+ New</p><h3>' + H[0] + '</h3><p class="o-muted">' + H[1] + '</p><form id="newF" novalidate style="display:flex;flex-direction:column;gap:14px">' +
      '<label class="fld" data-f="name"><span class="lab">Name</span><input name="name" autocomplete="off" required><em class="msg" aria-live="polite"></em></label>' +
      '<label class="fld" data-f="phone"><span class="lab">Mobile</span><input name="phone" inputmode="tel" autocomplete="off"' + (kind === 'trial' ? '' : ' required') + '><em class="msg" aria-live="polite"></em></label>' +
      (kind === 'trial' ? '<label class="fld"><span class="lab">Goal (their words)</span><input name="goal" autocomplete="off"><em class="msg"></em></label>' + sel('source', [['Walk-in', 'Walk-in', true], ['Instagram', 'Instagram'], ['Google', 'Google'], ['Referral', 'Referral'], ['Website', 'Website']], 'Source') + sel('day', [0, 1, 2, 3].map(function (k) { return [dIso(k), k === 0 ? 'Today' : k === 1 ? 'Tomorrow' : F.nice(dIso(k)), k === 1]; }), 'Trial day') : '') +
      (kind === 'member' ? sel('plan', Object.keys(PLAN).map(function (p) { return [p, p + ' · ' + F.rupees(PLAN[p]), p === 'Club']; }), 'Plan') : '') +
      sel('branch', br, 'Floor') +
      '<button class="btn volt" type="submit"><span>' + { walkin: 'Take ₹800 and check in', trial: 'Add to the board', member: 'Add member' }[kind] + '</span></button></form>';
    if (!d.open) d.showModal();
    var vN = F.field($('[data-f="name"]', d), F.check.name), vP = F.field($('[data-f="phone"]', d), function (v) { return (kind === 'trial' && !v.trim()) ? '' : F.check.phone(v); });
    $('#newF input').focus();
    $('#newF').onsubmit = function (e) {
      e.preventDefault(); var f = e.target; if (!vN() | !vP()) { var bad = $('.fld.bad input', f); if (bad) bad.focus(); return; }
      var digits = f.phone.value.replace(/\D/g, '').slice(-10), masked = digits ? '+91 ' + digits.slice(0, 2) + '••• ••' + digits.slice(7) : '', name = f.name.value.trim(), b = f.branch.value;
      if (kind === 'trial') { var undo = snap(['leads']), L = leads(); L.unshift({ id: F.uid(), name: name, phone: masked, branch: b, goal: f.goal.value.trim(), day: f.day.value, stage: 'new', at: new Date().toISOString(), source: f.source.value, plan: '', notes: [] }); saveLeads(L); d.close(); go('trials'); toast('<b>' + esc(first(name)) + '</b> added to Trial booked', undo); }
      if (kind === 'walkin') { var u2 = snap(['checkins']), c = checkins(); c.push({ name: name, no: '', branch: b, at: new Date().toISOString(), what: 'Day pass · ₹800' }); F.set('checkins', c); d.close(); render(); toast('Day pass sold · <b>' + esc(first(name)) + '</b> checked in', u2); }
      if (kind === 'member') { var u3 = snap(['roster']), R = roster(), m = mkMember(name, { plan: f.plan.value, branch: b, since: F.iso(new Date()), renews: dIso(30), visits: 0, last: 0, isNew: true, phone: masked }); R.unshift(m); saveRoster(R); d.close(); MV.view = 'new'; go('members'); toast('<b>' + esc(name) + '</b> added · ' + m.no, u3); }
    };
  }
  var nb = $('#newBtn'), nm = $('#newMenu');
  function menu(o) { nm.hidden = !o; nb.setAttribute('aria-expanded', String(o)); if (o) $('button', nm).focus(); }
  nb.addEventListener('click', function () { menu(nm.hidden); });
  nm.addEventListener('keydown', function (e) { var bs = $$('button', nm), i = bs.indexOf(document.activeElement); if (e.key === 'ArrowDown') { e.preventDefault(); bs[(i + 1) % bs.length].focus(); } if (e.key === 'ArrowUp') { e.preventDefault(); bs[(i + bs.length - 1) % bs.length].focus(); } if (e.key === 'Escape') { menu(false); nb.focus(); } });
  document.addEventListener('click', function (e) { if (!nm.hidden && !e.target.closest('.ops-newwrap')) menu(false); });

  /* ================= ⌘K PALETTE ================= */
  var pal = $('#pal'), pq = $('#palQ'), pl = $('#palList'), pItems = [], pIdx = 0;
  function palItems() {
    var out = NAV.map(function (n) { return { g: 'Go to', t: n[1], k: 'view', run: function () { go(n[0]); } }; });
    out.push({ g: 'Actions', t: 'Start calling trials', k: 'queue', run: function () { play('leads'); } }, { g: 'Actions', t: 'Play renewal queue', k: 'queue', run: function () { play('renewals'); } }, { g: 'Actions', t: 'New walk-in', k: 'new', run: function () { newFlow('walkin'); } }, { g: 'Actions', t: 'New trial', k: 'new', run: function () { newFlow('trial'); } }, { g: 'Actions', t: 'New member', k: 'new', run: function () { newFlow('member'); } }, { g: 'Actions', t: 'Scan a QR pass', k: 'desk', run: scan });
    roster().forEach(function (m) { out.push({ g: 'Members', t: m.name, s: m.no + ' · ' + m.plan, k: status(m)[0], run: function () { openSlide(m.no); } }); });
    leads().filter(function (l) { return l.stage !== 'joined' && l.stage !== 'lost'; }).forEach(function (l) { out.push({ g: 'Leads', t: l.name, s: l.source + ' · ' + (l.goal || ''), k: 'lead', run: function () { play('leads', l.id); } }); });
    sessionsFor(new Date()).filter(function (s) { return !s.past || s.live; }).forEach(function (s) { out.push({ g: 'Classes today', t: s.time + ' ' + s.cls.name, s: s.coach.name + ' · ' + bn(s.branch), k: s.left ? s.left + ' left' : 'full', run: function () { go('classes', s.id); } }); });
    return out;
  }
  function palDraw() {
    var q = pq.value.trim().toLowerCase(), all = palItems();
    pItems = (q ? all.filter(function (i) { return (i.t + ' ' + (i.s || '') + ' ' + i.g).toLowerCase().indexOf(q) > -1; }) : all.filter(function (i) { return i.g !== 'Members' && i.g !== 'Leads'; })).slice(0, 40);
    pIdx = Math.min(pIdx, Math.max(0, pItems.length - 1)); var g = '';
    pl.innerHTML = pItems.length ? pItems.map(function (i, k) { var h = i.g !== g ? '<li class="g" role="presentation">' + i.g + '</li>' : ''; g = i.g; return h + '<li role="option" id="po' + k + '" data-k="' + k + '" aria-selected="' + (k === pIdx) + '"><span class="k">' + esc(i.g === 'Members' || i.g === 'Leads' ? initials(i.t) : '›') + '</span><span>' + esc(i.t) + (i.s ? ' <span class="o-muted" style="font-size:12.5px">· ' + esc(i.s) + '</span>' : '') + '</span><span class="k">' + esc(i.k) + '</span></li>'; }).join('') : '<li class="g" role="presentation">Nothing matches “' + esc(pq.value) + '”</li>';
    pq.setAttribute('aria-activedescendant', pItems.length ? 'po' + pIdx : '');
    var s = $('[aria-selected="true"]', pl); if (s) s.scrollIntoView({ block: 'nearest' });
  }
  function openPal() { if (pal.open) return; pq.value = ''; pIdx = 0; palDraw(); pal.showModal(); pq.focus(); }
  function runPal(k) { var i = pItems[k]; if (!i) return; pal.close(); setTimeout(i.run, 30); }
  $('#openK').addEventListener('click', openPal);
  pq.addEventListener('input', function () { pIdx = 0; palDraw(); });
  pq.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); pIdx = Math.min(pItems.length - 1, pIdx + 1); palDraw(); } if (e.key === 'ArrowUp') { e.preventDefault(); pIdx = Math.max(0, pIdx - 1); palDraw(); } if (e.key === 'Enter') { e.preventDefault(); runPal(pIdx); } });
  pl.addEventListener('click', function (e) { var li = e.target.closest('[data-k]'); if (li) runPal(+li.dataset.k); });
  pal.addEventListener('click', function (e) { if (e.target === pal) pal.close(); });
  addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.open ? pal.close() : openPal(); return; }
    var typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if (e.key === '/' && !typing && !document.querySelector('dialog[open]')) { e.preventDefault(); openPal(); }
    if (e.key === 'Escape') { if ($('#slide').classList.contains('on')) closeSlide(); closeSheet(); if (TB.menu) { TB.menu = ''; render(); } }
  });

  /* ================= delegated actions ================= */
  view.addEventListener('submit', function (e) {
    var f = e.target.closest('[data-ph]'); if (!f) return; e.preventDefault();
    var msg = F.check.phone(f.p.value); if (msg) { toast(msg); f.p.focus(); return; }
    var d = f.p.value.replace(/\D/g, '').slice(-10), undo = snap(['leads']), L = leads(); L.forEach(function (l) { if (l.id === f.dataset.ph) l.phone = '+91 ' + d.slice(0, 2) + '••• ••' + d.slice(7); }); saveLeads(L); TB.addPh = ''; render(); toast('Phone saved', undo);
  });
  document.addEventListener('click', function (e) {
    var t = e.target, el;
    if ((el = t.closest('[data-close]'))) { var dl = el.closest('dialog'); if (dl) dl.close(); return; }
    if (t.closest('dialog#modal') && t === $('#modal')) { $('#modal').close(); return; }
    if ((el = t.closest('[data-new]'))) { menu(false); newFlow(el.dataset.new); return; }
    if ((el = t.closest('[data-play]'))) { play(el.dataset.play); return; }
    if ((el = t.closest('[data-call]'))) { TB.menu = ''; play('leads', el.dataset.call); return; }
    if ((el = t.closest('[data-rcall]'))) { play('renewals', el.dataset.rcall); return; }
    if (t.closest('[data-slx]')) { closeSlide(); return; }
    if ((el = t.closest('[data-checkin]'))) { doCheckin(el.dataset.checkin); if ($('#slide').classList.contains('on')) openSlide(el.dataset.checkin); return; }
    if ((el = t.closest('[data-collect]'))) { var no = el.dataset.collect, undo = snap(['roster']), R = roster(); R.forEach(function (m) { if (m.no === no) { m.failed = false; m.pays.unshift({ date: F.iso(new Date()), amt: m.dues, method: 'Card at desk', ok: true }); m.dues = 0; } }); saveRoster(R); render(); if ($('#slide').classList.contains('on')) openSlide(no); toast('Payment collected at the desk', undo); return; }
    if ((el = t.closest('[data-mwa]'))) { var mm = memberBy(el.dataset.mwa); copy(renewMsg(mm)); toast('Message copied for ' + esc(first(mm.name)) + '. Nothing is sent from here.'); return; }
    if ((el = t.closest('[data-mfreeze]'))) { MV.sel = [el.dataset.mfreeze]; closeSlide(true); bulkPreview('freeze'); return; }
    if (t.closest('#ciScan')) { scan(); return; }
    if ((el = t.closest('[data-member]')) && !t.closest('input[type=checkbox]')) { if (el.tagName === 'A') e.preventDefault(); openSlide(el.dataset.member); return; }
    if (!t.closest('#view')) return;
    if ((el = t.closest('[data-ci]'))) { CI.sel = el.dataset.ci; CI.q = ''; VIEWS.checkin(); var b = $('[data-checkin]', view); if (b) b.focus(); return; }
    if ((el = t.closest('[data-src]'))) { TB.src = TB.src === el.dataset.src ? '' : el.dataset.src; VIEWS.trials(); return; }
    if ((el = t.closest('[data-addph]'))) { TB.addPh = el.dataset.addph; VIEWS.trials(); var i = $('.addph-f input', view); if (i) i.focus(); return; }
    if ((el = t.closest('[data-ovf]'))) { TB.menu = TB.menu === el.dataset.ovf ? '' : el.dataset.ovf; VIEWS.trials(); var mb = $('.ovf button', view); if (mb) mb.focus(); return; }
    if ((el = t.closest('[data-move]'))) { TB.menu = ''; moveLead(el.dataset.move, el.dataset.to, 'Moved by Priya · ' + hm(new Date().toISOString())); return; }
    if ((el = t.closest('[data-next]'))) { var l = leads().filter(function (x) { return x.id === el.dataset.next; })[0]; if (l.stage === 'new') play('leads', l.id); else moveLead(l.id, l.stage === 'contacted' ? 'trial' : 'joined', (l.stage === 'contacted' ? 'Trained' : 'Joined') + ' · ' + hm(new Date().toISOString())); return; }
    if ((el = t.closest('[data-wa]'))) { var lw = leads().filter(function (x) { return x.id === el.dataset.wa; })[0]; copy(leadMsg(lw)); toast('WhatsApp message copied for ' + esc(first(lw.name)) + '. Paste it in the chat; nothing is sent from here.'); return; }
    if (TB.menu && !t.closest('.ovf')) { TB.menu = ''; VIEWS.trials(); }
    if ((el = t.closest('[data-view]'))) { MV.view = el.dataset.view; MV.cv = ''; MV.q = ''; MV.plan = ''; MV.sel = []; VIEWS.members(); return; }
    if ((el = t.closest('[data-cview]'))) { var cv = custom().filter(function (c) { return c.id === el.dataset.cview; })[0]; if (cv) { MV.view = cv.base; MV.q = cv.q; MV.plan = cv.plan; MV.sort = cv.sort; MV.dir = cv.dir; MV.cv = cv.id; } VIEWS.members(); return; }
    if ((el = t.closest('[data-sort]'))) { var k = el.dataset.sort; MV.dir = MV.sort === k ? -MV.dir : 1; MV.sort = k; VIEWS.members(); var s = $('[data-sort="' + k + '"]', view); if (s) s.focus(); return; }
    if (t.id === 'selAll') { MV.sel = t.checked ? $$('[data-sel]', view).map(function (c) { return c.dataset.sel; }) : []; VIEWS.members(); return; }
    if ((el = t.closest('[data-sel]'))) { var n = el.dataset.sel, ix = MV.sel.indexOf(n); if (ix > -1) MV.sel.splice(ix, 1); else MV.sel.push(n); VIEWS.members(); var c = $('[data-sel="' + n + '"]', view); if (c) c.focus(); return; }
    if ((el = t.closest('[data-bulk]'))) { var bk = el.dataset.bulk; if (bk === 'clear') { MV.sel = []; VIEWS.members(); } else if (bk === 'tag') askTag(); else bulkPreview(bk); return; }
    if (t.closest('#saveView')) { saveViewDlg(); return; }
    if ((el = t.closest('[data-day]'))) { CL.day = +el.dataset.day; CL.open = ''; VIEWS.classes(); return; }
    if ((el = t.closest('[data-cl]'))) { CL.open = CL.open === el.dataset.cl ? '' : el.dataset.cl; VIEWS.classes(); var o = $('[data-cl="' + CSS.escape(el.dataset.cl) + '"]', view); if (o) o.focus(); return; }
    if ((el = t.closest('[data-att]'))) { var a = F.get('ops-attend', {}), sl = el.dataset.att, nmA = el.dataset.n; a[sl] = a[sl] || []; var j = a[sl].indexOf(nmA); if (j > -1) a[sl].splice(j, 1); else a[sl].push(nmA); F.set('ops-attend', a); VIEWS.classes(); return; }
    if ((el = t.closest('[data-promote]'))) { var undoP = snap(['waitlist', 'bookings']), W = F.waitlist(), w = W.filter(function (x) { return x.id === el.dataset.promote; })[0]; w.promoted = true; F.set('waitlist', W);
      var ss = F.sessions(new Date(w.date + 'T00:00')).filter(function (s) { return s.id === w.slot; })[0]; if (ss) F.book(ss, { name: w.name, phone: w.phone });
      copy(fill(tpls().waitlist, { first: first(w.name), cls: F.cls(w.cls).name, time: w.time, day: F.nice(w.date) })); VIEWS.classes(); nav(); toast('<b>' + esc(first(w.name)) + '</b> is in. WhatsApp confirmation copied.', undoP); return; }
    if ((el = t.closest('[data-fz]'))) { var undoF = snap(['freezes', 'roster']), FZ = F.get('freezes', []), fz = FZ.filter(function (x) { return x.id === el.dataset.fz; })[0]; fz.status = el.dataset.v; F.set('freezes', FZ);
      if (fz.status === 'approved') { var RR = roster(); RR.forEach(function (m) { if (m.no === fz.memberNo || m.name === fz.name) { m.frozen = true; m.frozenTo = F.iso(new Date(new Date(fz.from).getTime() + fz.weeks * 7 * DAY)); m.renews = fz.newRenews; } }); saveRoster(RR);
        var ses = F.get('session', null); if (ses && ses.memberNo === fz.memberNo) { ses.renews = fz.newRenews; F.set('session', ses); } }
      render(); toast('Freeze ' + fz.status + ' for <b>' + esc(first(fz.name)) + '</b>', undoF); return; }
    if ((el = t.closest('[data-pt]'))) { var undoT = snap(['pt']), P = F.get('pt', []); P.forEach(function (p) { if (p.id === el.dataset.pt) p.status = el.dataset.v; }); F.set('pt', P); render(); toast('1:1 ' + el.dataset.v, undoT); return; }
    if ((el = t.closest('[data-cv]'))) { chatAct(el.dataset.cv); return; }
    if ((el = t.closest('[data-mf]'))) { MS.filter = el.dataset.mf; VIEWS.messages(); return; }
    if ((el = t.closest('[data-th]'))) { MS.open = el.dataset.th; VIEWS.messages(); var inp = $('#msgF input'); if (inp && !matchMedia('(max-width:860px)').matches) inp.focus(); return; }
    if (t.closest('[data-thback]')) { MS.open = ''; VIEWS.messages(); return; }
    if ((el = t.closest('[data-qr]'))) { var mi = $('#msgF input'); mi.value = QUICK[+el.dataset.qr][1]; mi.focus(); }
  });
  view.addEventListener('keydown', function (e) {
    var c = e.target.closest && e.target.closest('.lc'); if (!c || e.target !== c) return;
    if (e.key === 'Enter') { var b = $('[data-next]', c); if (b) b.click(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var L = leads(), l = L.filter(function (x) { return x.id === c.dataset.id; })[0], order = ['new', 'contacted', 'trial', 'joined'], i = order.indexOf(l.stage) + (e.key === 'ArrowRight' ? 1 : -1); if (i >= 0 && i < order.length) { moveLead(l.id, order[i], 'Moved by Priya'); var n = $('.lc[data-id="' + l.id + '"]', view); if (n) n.focus(); } }
  });

  /* branch switch */
  var seg = $('#branchSeg');
  $$('button', seg).forEach(function (b) { if (b.dataset.b === branch) F.segSet(seg, b); b.addEventListener('click', function () { branch = b.dataset.b; F.set('ops-branch', branch); F.segSet(seg, b); render(); toast(branch ? 'Showing ' + bn(branch) + ' only' : 'Showing both floors'); }); });

  /* storage from other tabs (website bookings, member app, chat) refreshes the view */
  addEventListener('storage', function (e) { if (!e.key || !(e.key.indexOf('forge:') === 0 || e.key === 'orbit-convos') || document.querySelector('dialog[open]')) return;
    var mi = $('#msgF input'), keep = mi && mi.value, had = mi && document.activeElement === mi; render(); var n = $('#msgF input'); if (n && keep) n.value = keep; if (n && had) n.focus(); });

  seedAll(); parse(); render(true);
})();
