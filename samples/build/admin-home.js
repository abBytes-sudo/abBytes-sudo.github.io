/* Sthira back office · Home: what needs me now. KPI tiles that filter, a needs-attention list with one-line reasons,
   a now-and-next strip drawn as a dimension string, queues, the live site and an activity feed. */
(function () {
  'use strict';
  var BO = window.BO, D = BO.D, A = BO.A, esc = BO.esc, inr = BO.inr, NOW = BO.NOW, ic = BO.ic;
  var DAY = 864e5;
  // weekly history behind the sparklines (oldest first; the live value is appended)
  var HIST = { over: [5, 4, 6, 3, 4, 3, 2, 4, 3], surveys: [2, 3, 2, 4, 3, 5, 3, 4], quotes: [7.1, 6.4, 8.2, 7.6, 8.8, 9.6, 8.9], collect: [11.6, 9.3, 18.6, 14.0, 18.6, 9.3, 18.6] };

  function leads() { return BO.crm.leads.filter(BO.inStudio); }
  function isOver(l) { return l.due && new Date(l.due) < NOW && l.stage !== 'lost' && l.stage !== 'project'; }
  BO.isOver = isOver;
  function rao() { return BO.lead('L-2290'); }
  BO.dueMilestones = function () { var P = BO.P(); return D.PAYMENTS.filter(function (m) { return m.status === 'due' && !P.paid[m.n]; }); };
  BO.pendingCO = function () { var P = BO.P(); return D.CHANGES.filter(function (c) { return (P.co[c.id] || c.status) === 'pending'; }); };
  BO.raoUpdates = function () { return BO.P().updates.filter(function (u) { return !u.code || u.code === 'STH-2611'; }); };
  BO.lastWeek = function () { var u = BO.raoUpdates()[0]; return u || D.WEEKS[0]; };

  function kpis() {
    var L = leads(), wk = NOW - 7 * DAY;
    var n7 = L.filter(function (l) { return new Date(l.at) >= wk; }).length, p7 = L.filter(function (l) { var t = new Date(l.at); return t >= NOW - 14 * DAY && t < wk; }).length;
    var daily = []; for (var i = 13; i >= 0; i--) { var d0 = new Date(NOW); d0.setHours(0, 0, 0, 0); d0 = d0.getTime() - i * DAY; daily.push(L.filter(function (l) { var t = new Date(l.at).getTime(); return t >= d0 && t < d0 + DAY; }).length); }
    var over = L.filter(isOver).length;
    var sv = L.filter(function (l) { return l.stage === 'survey' && l.survey && new Date(l.survey.when) >= NOW && new Date(l.survey.when) < NOW.getTime() + 7 * DAY; }).length, toSch = BO.surveyQueue().length;
    var Q = L.filter(function (l) { return l.stage === 'quote' && l.quote; }), qv = Q.reduce(function (a, l) { return a + l.quote.total; }, 0);
    var R = rao(), dm = R && BO.inStudio(R) ? BO.dueMilestones() : [], dv = dm.reduce(function (a, m) { return a + D.LIVE.value * m.pct / 100; }, 0);
    var T = [
      { k: 'new', l: 'New enquiries · 7 days', v: n7, d: BO.delta(n7, p7, { vs: 'vs last week' }), s: BO.spark(daily), href: 'pipeline?flag=new7&layout=table' },
      { k: 'over', l: 'Overdue follow-ups', v: over, red: over > 0, d: BO.delta(over, HIST.over[HIST.over.length - 1], { invert: true, vs: 'vs yesterday' }), s: BO.spark(HIST.over.concat([over]), over ? 'red' : ''), href: 'pipeline?flag=overdue&layout=table' },
      { k: 'sv', l: 'Surveys · next 7 days', v: sv, d: '<span class="dl">' + BO.plural(toSch, 'more', 'more') + ' to schedule</span>', s: BO.spark(HIST.surveys.concat([sv])), href: 'surveys' },
      { k: 'q', l: 'Quotes out', v: inr(qv), d: BO.delta(qv, HIST.quotes[HIST.quotes.length - 1] * 1e7, { money: true, vs: 'vs last month' }) + '<span class="dl-vs"> · ' + Q.length + ' open</span>', s: BO.spark(HIST.quotes.concat([qv / 1e7])), href: 'pipeline?stage=quote&layout=table' },
      { k: 'pay', l: 'Due from clients', v: dv ? inr(dv) : '₹0', d: dm.length ? '<span class="dl">Milestone ' + dm[0].n + ' · ' + A.date(dm[0].date) + '</span>' : '<span class="dl up">All collected</span>', s: BO.spark(HIST.collect.concat([dv / 1e5])), href: 'portal?f=pay' }
    ];
    return '<div class="kpis" role="list">' + T.map(function (t) { return '<a role="listitem" class="kpi' + (t.red ? ' red' : '') + '" href="#/' + t.href + '"><span class="kpi-l">' + t.l + '</span><span class="kpi-v">' + t.v + '</span><span class="kpi-d">' + t.d + '</span>' + t.s + '</a>'; }).join('') + '</div>';
  }

  /* needs your attention */
  BO.attention = function () {
    var L = leads(), out = [], P = BO.P();
    L.filter(function (l) { return l.stage === 'survey' && l.survey && new Date(l.survey.when) < NOW && !l.findings; }).forEach(function (l) {
      out.push({ ic: 'survey', tone: 'red', t: 'Write up the survey at ' + (l.loc || l.city) + ' for ' + l.name, why: 'Surveyed ' + A.date(l.survey.when) + ' by ' + l.survey.who.split(' ')[0] + ' · the quote can’t start until findings are logged', a: 'Log findings', run: function () { BO.openLead(l.id, 'survey'); } });
    });
    L.filter(function (l) { return isOver(l) && !(l.stage === 'survey' && l.survey && new Date(l.survey.when) < NOW && !l.findings); }).sort(function (a, b) { return new Date(a.due) - new Date(b.due); }).forEach(function (l) {
      out.push({ ic: 'clock', tone: 'red', t: 'Follow up with ' + l.name, why: BO.due(l.due).t + ' · ' + (l.next || 'No next step written'), a: 'Open', run: function () { BO.openLead(l.id); } });
    });
    BO.chatWaiting().filter(function (c) { var l = BO.crm.leads.filter(function (x) { return x.convo === c.id; })[0]; return !l || BO.inStudio(l); }).forEach(function (c) {
      var lu = c.messages.filter(function (m) { return m.from === 'user'; }).pop();
      out.push({ ic: 'chat', tone: 'red', t: ((c.user && c.user.name) || 'A site visitor') + ' is waiting in chat', why: 'Asked for a person ' + BO.dur(Date.now() - (c.handoverAt || c.updatedAt || Date.now())) + ' ago' + (lu ? ' · “' + String(lu.text).replace(/\*\*/g, '').slice(0, 70) + '”' : ''), a: 'Reply', run: function () { BO.go('chats/' + c.id); } });
    });
    L.filter(function (l) { return l.stage !== 'lost' && l.stage !== 'project' && l.due && !isOver(l) && BO.sameDay(l.due, NOW) && l.stage !== 'enquiry'; }).forEach(function (l) {
      out.push({ ic: 'bolt', t: l.next || 'Follow up', tLead: l.name, why: 'Due today ' + BO.hm(l.due) + ' · ' + l.name + (l.quote ? ' · quote v' + l.quote.version + ', ' + inr(l.quote.total) : ''), a: 'Open', run: function () { BO.openLead(l.id); } });
    });
    var q = BO.surveyQueue();
    if (q.length) { var old = q.slice().sort(function (a, b) { return new Date(a.at) - new Date(b.at); })[0]; out.push({ ic: 'survey', t: BO.plural(q.length, 'enquiry', 'enquiries') + ' ready for a site survey', why: 'Oldest: ' + old.name + ', waiting ' + BO.dur(NOW - new Date(old.at)) + ' · about ' + q.length * 2 + ' minutes in the queue', a: 'Start queue', run: function () { BO.go('surveys'); } }); }
    var R = rao();
    if (R && BO.inStudio(R)) {
      (BO.portalItems ? BO.portalItems() : []).filter(function (x) { return x.needs; }).slice(0, 3).forEach(function (x) { out.push({ ic: x.ic, tone: 'red', t: x.title, why: x.why, a: x.cta || 'Open', run: function () { BO.go('portal'); } }); });
      var pc = BO.pendingCO(); if (pc.length) out.push({ ic: 'stamp', t: BO.plural(pc.length, 'change order') + ' waiting on the Raos', why: pc.map(function (c) { return c.id; }).join(' and ') + ' · ' + inr(pc.reduce(function (a, c) { return a + c.amount; }, 0)) + ' together · no change to the programme', a: 'Nudge', run: nudge });
      var lw = BO.lastWeek(); {
        var posted = BO.raoUpdates().filter(function (u) { return new Date(u.date) > NOW - 3 * DAY; }).length;
        if (!posted) out.push({ ic: 'photo', t: 'Post the week ' + (lw.w + 1) + ' site update for the Raos', why: 'Due Fri 27 Nov, 6 pm · last posted ' + A.date(lw.date) + ' (week ' + lw.w + ')', a: 'Start', run: function () { BO.go('projects/STH-2611/update'); } });
      }
    }
    var na = BO.apps().filter(function (a) { return a.stage === 'new'; });
    if (na.length) out.push({ ic: 'careers', t: BO.plural(na.length, 'new application'), why: na.slice(0, 3).map(function (a) { return a.name + ' (' + a.role.split(',')[0] + ')'; }).join(', '), a: 'Review', run: function () { BO.go('careers?s=new'); } });
    return out;
  };
  function nudge() {
    var P = BO.P(), pc = BO.pendingCO(), m = { from: 'Farah Siddiqui', role: 'Project manager', at: BO.stamp(), text: 'A gentle reminder: ' + pc.map(function (c) { return c.id; }).join(' and ') + ' are waiting for your approval under Approvals. Neither changes the handover date. Happy to talk them through on Saturday.' };
    P.msgs.push(m); BO.saveP(P); BO.log('L-2290', 'Reminder sent in the portal about ' + pc.map(function (c) { return c.id; }).join(' and '), 'note');  BO.save();
    BO.toast('Reminder posted to the Raos’ portal.', { icon: 'send', undo: function () { var P2 = BO.P(); P2.msgs = P2.msgs.filter(function (x) { return x.at !== m.at; }); BO.saveP(P2); BO.refresh(); } });
    BO.refresh();
  }

  /* now and next: five days drawn as a dimension string */
  function events() {
    var E = [], end = new Date(NOW); end.setHours(0, 0, 0, 0); end = end.getTime() + 5 * DAY;
    leads().forEach(function (l) {
      if (l.stage === 'survey' && l.survey) { var t = new Date(l.survey.when); if (t >= NOW - 12 * 3600e3 && t < end) E.push({ t: t, k: 'survey', title: 'Survey · ' + l.name, sub: (l.loc || l.city) + ' · ' + l.survey.who.split(' ')[0], run: l.id }); }
      else if (l.due && l.stage !== 'lost' && l.stage !== 'project') { var d = new Date(l.due); if (d >= NOW && d < end) E.push({ t: d, k: l.stage === 'quote' ? 'quote' : 'call', title: (l.stage === 'quote' ? 'Quote · ' : 'Call · ') + l.name, sub: l.next, run: l.id }); }
    });
    var R = rao(); if (R && BO.inStudio(R)) {
      E.push({ t: new Date('2026-11-26T08:30'), k: 'site', title: 'Third-floor blockwork starts', sub: 'STH-2611 · Karthik on site', go: 'projects/STH-2611' });
      if (!BO.raoUpdates().filter(function (u) { return new Date(u.date) > NOW - 3 * DAY; }).length) E.push({ t: new Date('2026-11-27T18:00'), k: 'due', title: 'Week 25 report to the Raos', sub: 'Client portal · photos and notes', go: 'projects/STH-2611/update' });
      E.push({ t: new Date('2026-11-28T11:00'), k: 'site', title: 'Balcony railing walk-through', sub: 'STH-2611 · with Vikram Rao', go: 'projects/STH-2611' });
    }
    return E.sort(function (a, b) { return a.t - b.t; });
  }
  function nowNext() {
    var E = events(), d0 = new Date(NOW); d0.setHours(0, 0, 0, 0);
    var cols = [0, 1, 2, 3, 4].map(function (i) { var day = new Date(d0.getTime() + i * DAY), ev = E.filter(function (e) { return BO.sameDay(e.t, day); });
      var past = ev.filter(function (e) { return e.t < NOW; }), fut = ev.filter(function (e) { return e.t >= NOW; });
      function item(e) { return '<button type="button" class="ev ev-' + e.k + (e.t < NOW ? ' past' : '') + '" data-act="ev" data-run="' + esc(e.run || '') + '" data-go="' + esc(e.go || '') + '"><span class="ev-t">' + BO.hm(e.t) + '</span><span class="ev-b"><b>' + esc(e.title) + '</b><small>' + esc(e.sub || '') + '</small></span></button>'; }
      var body = past.map(item).join('') + (i === 0 ? '<div class="now-l" aria-label="Now"><span>Now ' + BO.hm(NOW) + '</span></div>' : '') + fut.map(item).join('');
      return '<div class="nn-col' + (i === 0 ? ' today' : '') + '"><p class="nn-d"><b>' + (i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : BO.dayName(day)) + '</b><span>' + BO.dayName(day) + ' ' + day.getDate() + '</span></p>' + (ev.length ? body : (i === 0 ? body : '') + '<p class="nn-none">Nothing booked</p>') + '</div>'; });
    return '<section class="cd nn" aria-labelledby="nnH"><div class="cd-h"><h2 id="nnH">Now and next</h2><span class="dimstr" aria-hidden="true"><i></i><em>5 days · ' + A.date(d0) + '–' + A.date(new Date(d0.getTime() + 4 * DAY)) + '</em><i></i></span><a class="lnk" href="#/surveys">Survey queue</a></div><div class="nn-g">' + cols.join('') + '</div></section>';
  }

  function queues() {
    var q = BO.surveyQueue(), done = BO.crm.leads.filter(function (l) { return l.schedToday; }).length, L = leads();
    var calls = L.filter(function (l) { return l.stage !== 'lost' && l.stage !== 'project' && l.due && new Date(l.due) < NOW.getTime() + 12 * 3600e3 && l.stage !== 'survey'; }).length;
    var pr = BO.portalItems ? BO.portalItems().filter(function (x) { return x.needs; }).length : 0, cw = BO.chatWaiting().length;
    var Q = [
      { n: 'Survey queue', who: 'Farah', meta: done + ' of ' + (q.length + done) + ' scheduled today', p: (q.length + done) ? done / (q.length + done) : 1, t: q.length ? '≈ ' + q.length * 2 + ' m' : 'Clear', href: 'surveys' },
      { n: 'Follow-up calls', who: 'Team', meta: L.filter(isOver).length + ' overdue · ' + calls + ' due today', p: 0, t: calls ? '≈ ' + calls * 4 + ' m' : 'Clear', href: 'pipeline?flag=today&layout=table' },
      { n: 'Portal replies', who: 'Farah', meta: pr ? BO.plural(pr, 'item') + ' from the Raos' : 'Nothing waiting', p: pr ? 0 : 1, t: pr ? '≈ ' + pr * 3 + ' m' : 'Clear', href: 'portal' },
      { n: 'Chats waiting', who: 'Nikhil', meta: cw ? BO.plural(cw, 'person', 'people') + ' asked for a human' : 'The assistant has it', p: cw ? 0 : 1, t: cw ? 'Now' : 'Clear', href: 'chats' }
    ];
    return '<section class="cd" aria-labelledby="qH"><div class="cd-h"><h2 id="qH">Queues</h2><span class="meta">' + A.date(NOW) + '</span></div><ul class="qs">' + Q.map(function (x) { return '<li><a class="qrow" href="#/' + x.href + '"><span class="q-play">' + ic(x.p >= 1 ? 'check' : 'play') + '</span><span class="q-b"><b>' + x.n + '</b><small>' + esc(x.meta) + '</small><span class="meter"><i style="width:' + Math.round(x.p * 100) + '%"></i></span></span><span class="q-t' + (x.t === 'Now' ? ' red' : '') + '">' + x.t + '</span></a></li>'; }).join('') + '</ul></section>';
  }

  function liveSite() {
    var R = rao(); if (!R || !BO.inStudio(R)) return '';
    var L = D.LIVE, lw = BO.lastWeek(), day = Math.max(L.day, lw.by ? lw.day : 0), dm = BO.dueMilestones()[0], walls = lw.stages ? lw.stages.walls : L.stagePct;
    return '<section class="cd site" aria-labelledby="sH"><div class="cd-h"><h2 id="sH"><span class="bub">D</span>Rao Residence</h2><a class="lnk" href="#/projects/STH-2611">STH-2611</a></div><div class="cd-b">' +
      '<div class="site-r"><span>Day <b>' + day + '</b> of ' + L.total + '</span><span>Walls ' + walls + '%</span></div><div class="meter big"><i style="width:' + Math.round(day / L.total * 100) + '%"></i></div>' +
      '<dl class="tb2"><div><dt>Last update</dt><dd>Week ' + lw.w + ' · ' + A.date(lw.date) + '</dd></div><div><dt>Next milestone</dt><dd>' + (dm ? inr(L.value * dm.pct / 100) + ' · ' + A.date(dm.date) : 'Paid up') + '</dd></div><div><dt>Handover</dt><dd>' + A.date(L.handover) + '</dd></div><div><dt>Crew today</dt><dd>' + (lw.crew || 34) + '</dd></div></dl>' +
      (lw.by ? '<a class="b full" href="#/projects/STH-2611">' + ic('check') + 'Week ' + lw.w + ' is live in the portal</a>' : '<a class="b pri full" href="#/projects/STH-2611/update">' + ic('photo') + 'Post week ' + (lw.w + 1) + ' update</a>') + '</div></section>';
  }

  BO.activity = function (max) {
    var F = [], P = BO.P();
    BO.crm.leads.filter(BO.inStudio).forEach(function (l) { (BO.crm.log[l.id] || []).forEach(function (e) { F.push({ at: e.at, who: e.by, txt: e.text, on: l.name, id: l.id }); }); });
    (P.log || []).forEach(function (e) { F.push({ at: e.at, who: e.who || 'Ananya Rao', txt: e.text, on: 'Client portal', go: 'portal' }); });
    BO.apps().forEach(function (a) { F.push({ at: a.at, who: a.name, txt: 'applied for ' + a.role, on: 'Careers', go: 'careers' }); });
    return F.filter(function (x) { return x.at; }).sort(function (a, b) { return new Date(b.at) - new Date(a.at); }).slice(0, max || 8);
  };
  function feed() {
    var F = BO.activity(9);
    return '<section class="cd" aria-labelledby="aH"><div class="cd-h"><h2 id="aH">Activity</h2><span class="meta">All studios</span></div><ul class="feed">' + F.map(function (f) { return '<li>' + BO.av(f.who, 'sm') + '<p><b>' + esc(f.who) + '</b> ' + esc(f.txt.charAt(0).toLowerCase() + f.txt.slice(1)) + (f.id ? ' · <button type="button" class="lnk" data-act="lead" data-id="' + f.id + '">' + esc(f.on) + '</button>' : f.go ? ' · <a class="lnk" href="#/' + f.go + '">' + esc(f.on) + '</a>' : '') + '</p><time>' + esc(BO.rel(f.at)) + '</time></li>'; }).join('') + '</ul></section>';
  }

  function attList(items) {
    if (!items.length) return BO.empty('Nothing needs you right now', 'Every follow-up is on time and the portal is quiet. New enquiries from the site land here first.', '<a class="b" href="#/pipeline">Open the pipeline</a>');
    return '<ul class="att">' + items.map(function (x, i) { return '<li><button type="button" class="att-r" data-act="att" data-i="' + i + '"><span class="att-i' + (x.tone ? ' ' + x.tone : '') + '">' + ic(x.ic) + '</span><span class="att-b"><b>' + esc(x.t) + '</b><small>' + esc(x.why) + '</small></span><span class="b sm att-a">' + esc(x.a) + '</span>' + ic('chev-r', 'att-c') + '</button></li>'; }).join('') + '</ul>';
  }

  var ITEMS = [];
  BO.view('home', {
    title: 'Home', skeleton: 'home',
    render: function () {
      ITEMS = BO.attention(); var h = NOW.getHours(), f = ITEMS[0];
      var hello = '<div class="hello"><p><b>Good ' + (h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening') + ', Farah.</b> <span>' + ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][NOW.getDay()] + ' ' + NOW.getDate() + ' November · ' + (ITEMS.length ? BO.plural(ITEMS.length, 'thing needs', 'things need') + ' you' : 'nothing needs you') + (BO.studio !== 'All' ? ' · ' + BO.studio + ' studio' : '') + '</span></p></div>';
      var focus = f ? '<div class="focus1"><p class="k">Do this first · 1 of ' + ITEMS.length + '</p><h2>' + esc(f.t) + '</h2><p>' + esc(f.why) + '</p><button type="button" class="b pri lg" data-act="att" data-i="0">' + esc(f.a) + ic('arrow-r') + '</button></div>' : '';
      return hello + focus + kpis() + nowNext() +
        '<div class="home-g"><div><section class="cd" aria-labelledby="atH"><div class="cd-h"><h2 id="atH">Needs your attention</h2><span class="meta">' + ITEMS.length + '</span></div>' + attList(ITEMS) + '</section></div>' +
        '<div class="home-r">' + liveSite() + queues() + feed() + '</div></div>';
    },
    acts: {
      att: function (b) { var x = ITEMS[+b.getAttribute('data-i')]; if (x) x.run(); },
      ev: function (b) { var id = b.getAttribute('data-run'), go = b.getAttribute('data-go'); if (id) BO.openLead(id); else if (go) BO.go(go); },
      lead: function (b) { BO.openLead(b.getAttribute('data-id')); }
    }
  });
})();
