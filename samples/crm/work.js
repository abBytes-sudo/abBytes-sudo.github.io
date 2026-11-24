/* Lumen CRM Pro — work cards across the app: Home leads with "needs your attention" and "now and next";
   every deal, contact and company record shows its last remark first. */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, V = C.views;
  var P = function () { return C.P(); }, S = function () { return C.S(); }, D = 864e5, H = 36e5;

  function attention() {
    var me = C.me().name, out = [], now = Date.now();
    var sl = S().leads.filter(function (l) { if (l.resp != null || l.status !== 'new' || !C.visibleLead(l)) return false; var s = C.sla(l); return s.state === 'breach' || s.state === 'risk'; }).sort(function (a, b) { return a.created - b.created; });
    if (sl.length > 2) out.push({ w: 0, ic: 'inbox', tone: 'bad', title: sl.length + ' leads are past the first-reply target', why: 'Oldest: ' + sl[0].name + ' · ' + C.SOURCES[sl[0].source].label + ' · start the queue to clear them', href: '#/inbox', act: 'Open inbox' });
    sl.slice(0, sl.length > 2 ? 1 : 2).forEach(function (l) { var s = C.sla(l); out.push({ w: s.state === 'breach' ? 0 : 2, ic: 'clock', tone: s.state === 'breach' ? 'bad' : 'warn', title: l.name + ' is waiting for a first reply', why: Math.round(s.min) + ' business min · target ' + s.tgt + ' min · ' + C.SOURCES[l.source].label, href: '#/inbox/' + l.id, act: 'Reply' }); });
    var od = S().tasks.filter(function (t) { return !t.done && t.due && t.due < now - H && t.owner === me; });
    if (od.length) out.push({ w: 1, ic: 'tasks', tone: 'bad', title: od.length + ' of your tasks are overdue', why: 'Oldest: “' + od.sort(function (a, b) { return a.due - b.due; })[0].text + '”', href: '#/tasks', act: 'Open queue' });
    if (P().apr) { var ap = P().apr.reqs.filter(function (r) { return r.st === 'pending' && (C.me().role === 'admin' || (r.who === 'manager' && C.me().role === 'manager')); }); if (ap.length) out.push({ w: 1, ic: 'check', tone: 'warn', title: ap.length + ' approval' + (ap.length > 1 ? 's' : '') + ' waiting for you', why: ap[0].by + ' asks for ' + ap[0].to + '% on ' + ap[0].ref, href: '#/approvals', act: 'Decide' }); }
    P().deals.filter(function (d) { return C.dealOpen(d) && C.visible(d) && (now - (d.moved || d.created)) > 14 * D; }).sort(function (a, b) { return C.dealVal(b) - C.dealVal(a); }).slice(0, 2).forEach(function (d) { out.push({ w: 3, ic: 'deal', tone: 'warn', title: d.name + ' hasn’t moved in ' + Math.round((now - (d.moved || d.created)) / D) + ' days', why: C.pstage(d.pipe, d.stage).label + ' · ' + C.rs(C.dealVal(d)) + ' · ' + d.owner, href: '#/deals/' + d.id, act: 'Open' }); });
    (P().quotes || []).filter(function (q) { return q.status === 'sent' && q.valid > now && q.valid < now + 3 * D; }).slice(0, 2).forEach(function (q) { var d = C.deal(q.d); out.push({ w: 2, ic: 'quote', tone: 'warn', title: 'Quote ' + q.id + ' expires in ' + Math.max(1, Math.round((q.valid - now) / D)) + (Math.round((q.valid - now) / D) > 1 ? ' days' : ' day'), why: d ? d.name : '', href: '#/quotes/' + q.id, act: 'Follow up' }); });
    (P().tickets || []).filter(function (t) { return t.status === 'open' && (t.prio === 'High' || t.prio === 'Urgent') && now - t.created > D; }).slice(0, 1).forEach(function (t) { out.push({ w: 2, ic: 'ticket', tone: 'bad', title: t.prio + ' ticket open for ' + Math.round((now - t.created) / D) + ' days', why: t.subj, href: '#/tickets/' + t.id, act: 'Open' }); });
    return out.sort(function (a, b) { return a.w - b.w; }).slice(0, 6);
  }
  function nowNext() {
    var now = Date.now(), end = new Date(); end.setHours(23, 59, 0, 0); var me = C.me().name;
    var ev = (P().events || []).filter(function (e) { return e.t >= now - 30 * 6e4 && e.t < end.getTime() && (e.owner === me || C.me().role === 'admin'); }).map(function (e) { return { t: e.t, ic: 'cal', title: e.title, sub: (e.loc || e.type || '') + (e.owner !== me ? ' · ' + e.owner.split(' ')[0] : ''), href: '#/calendar' }; });
    var tk = S().tasks.filter(function (t) { return !t.done && t.due >= now && t.due < end.getTime() && t.owner === me; }).map(function (t) { return { t: t.due, ic: (t.type === 'wa' ? 'wa' : t.type === 'call' ? 'phone' : 'tasks'), title: t.text, sub: 'Task', href: '#/tasks' }; });
    return ev.concat(tk).sort(function (a, b) { return a.t - b.t; }).slice(0, 4);
  }
  function feed() {
    var items = [];
    P().acts.slice(0, 80).forEach(function (a) {
      var d = a.d && C.deal(a.d), c = a.c && C.contact(a.c), co = a.co && C.company(a.co), rec = null;
      if (d) { if (!C.visible(d)) return; rec = { n: d.name.split(' — ').pop(), h: '#/deals/' + d.id }; } else if (c) { if (!C.visible(c)) return; rec = { n: c.name, h: '#/contacts/' + c.id }; } else if (co) { if (!C.visible(co)) return; rec = { n: co.name, h: '#/companies/' + co.id }; }
      if (rec) items.push({ t: a.t, by: a.by || '', type: a.type, text: a.text, rec: rec });
    });
    S().leads.forEach(function (l) { if (!C.visibleLead(l)) return; l.tl.slice(-2).forEach(function (e) { if (['status', 'call', 'note', 'visit', 'msg', 'quote'].indexOf(e.type) > -1) items.push({ t: e.t, by: l.owner, type: e.type === 'status' ? 'stage' : e.type === 'msg' ? 'wa' : e.type, text: e.text, rec: { n: l.name, h: '#/inbox/' + l.id } }); }); });
    return items.filter(function (x) { return x.t <= Date.now(); }).sort(function (a, b) { return b.t - a.t; }).slice(0, 8);
  }
  C.homeFeed = function () {
    var F = feed();
    return '<section class="card feed"><div class="card-h"><div><h2>Activity</h2><p class="sub">What the team did, newest first</p></div><a class="btn sm" href="#/settings/audit">Audit log</a></div>' + (F.length ? '<ol class="feedl">' + F.map(function (x) { var T = C.ATYPE[x.type] || C.ATYPE.note; return '<li><span class="att-ic">' + C.ic(T[1], 14) + '</span><div><p><b>' + esc((x.by || 'Someone').split(' ')[0]) + '</b> <span class="muted">' + esc(T[0].toLowerCase()) + '</span> · <a href="' + x.rec.h + '">' + esc(x.rec.n) + '</a></p><small>' + esc(String(x.text).replace(/^(Email|WhatsApp|Call|Note)[:·]\s*/i, '').slice(0, 96)) + '</small></div><time class="muted sm" datetime="' + new Date(x.t).toISOString() + '">' + C.rel(x.t) + '</time></li>'; }).join('') + '</ol>' : '<div class="empty-st">' + C.ic('note', 22) + '<b>No activity yet</b><span>Calls, notes and stage changes show up here as your team works.</span></div>') + '</section>';
  };
  function wsHint() {
    if (P().hintWs || !C.WS) return '';
    var other = C.WS.tpl === 'services' ? { id: 'northwind', n: 'Northwind Cloud (B2B SaaS)' } : { id: '', n: 'Lumen Homes (services)' };
    return '<div class="ws-hint" role="note">' + C.ic('dash', 14) + '<span>This is the <b>' + esc(C.WS.name) + '</b> workspace. The same CRM runs any business: <button type="button" class="lnk" data-act="ws-go" data-id="' + other.id + '">open ' + esc(other.n) + '</button> or <button type="button" class="lnk" data-act="ws-new">start one from a template</button>.</span><button type="button" class="ibtn" data-act="ws-hint-x" aria-label="Dismiss this tip">' + C.ic('x', 14) + '</button></div>';
  }
  C.acts['ws-hint-x'] = function () { P().hintWs = 1; C.save(); C.rerender(); };
  C.homeAttention = function () {
    var A = attention(), N = nowNext();
    return wsHint() + '<div class="home-w"><section class="card att"><div class="card-h"><div><h2>Needs your attention</h2><p class="sub">' + (A.length ? A.length + ' things, most urgent first' : 'Nothing urgent') + '</p></div></div>' + (A.length ? '<ul class="attl">' + A.map(function (a) { return '<li class="' + a.tone + '"><span class="att-ic">' + C.ic(a.ic, 15) + '</span><a href="' + a.href + '"><b>' + esc(a.title) + '</b><small>' + esc(a.why) + '</small></a><a class="btn sm" href="' + a.href + '" tabindex="-1" aria-hidden="true">' + a.act + '</a></li>'; }).join('') + '</ul>' : '<div class="empty-st">' + C.ic('check', 22) + '<b>All clear</b><span>No SLA breaches, overdue tasks or waiting approvals.</span></div>') + '</section>' +
      '<section class="card nn"><div class="card-h"><div><h2>Now and next</h2><p class="sub">Your day, from now</p></div><button type="button" class="btn sm pri" data-act="cq-start">' + C.ic('play', 12) + 'Start call queue</button></div>' + (N.length ? '<ol class="nnl">' + N.map(function (n, i) { return '<li class="' + (i === 0 ? 'now' : '') + '"><time>' + C.tm(n.t) + '</time><span class="att-ic">' + C.ic(n.ic, 14) + '</span><a href="' + n.href + '"><b>' + esc(n.title) + '</b><small>' + esc(n.sub) + '</small></a></li>'; }).join('') + '</ol>' : '<p class="muted sm">Nothing else scheduled today.</p>') + '</section></div>';
  };
  // last remark first on records
  var rc0 = C.recCenter;
  if (rc0) C.recCenter = function (t, id, q) {
    var h = rc0.apply(this, arguments), L = C.timeline(q || {}).filter(function (a) { return a.type === 'note' || a.type === 'call' || a.type === 'wa' || a.type === 'email'; }), all = C.timeline(q || {});
    var r = L[0], a = all[0];
    return '<div class="lremark">' + C.ic('note', 14) + '<div><b>Last remark</b> · ' + (r ? esc(r.text.slice(0, 220)) + ' <span class="muted">· ' + esc((r.by || '').split(' ')[0]) + ', ' + C.rel(r.t) + '</span>' : 'none yet. The note you add next lands here.') + (a ? '<small>Last activity · ' + esc((C.ATYPE[a.type] || ['Activity'])[0]) + ' · ' + C.rel(a.t) + '</small>' : '') + '</div></div>' + h;
  };
})();
