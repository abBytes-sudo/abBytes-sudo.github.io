/* Lumen CRM — dashboard, inbox, lead drawer, pipeline, tasks */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$, V = C.views, S = C.S, page = C.page;
  var ACC = '#2B59FF';

  function openLeads() { return S().leads.filter(function (l) { return l.status !== 'won' && l.status !== 'lost'; }); }
  function dueText(t) {
    var d = C.dayStart(t.due), td = C.dayStart();
    if (d === td) return 'Today, ' + C.tm(t.due); if (d === td + 864e5) return 'Tomorrow, ' + C.tm(t.due);
    if (d === td - 864e5) return 'Yesterday, ' + C.tm(t.due); return C.dshort(t.due) + ', ' + C.tm(t.due);
  }
  function seg(act, k, opts, cur, label) {
    return '<div class="seg" role="group" aria-label="' + label + '">' + opts.map(function (o) { return '<button type="button" data-act="' + act + '" data-k="' + k + '" data-v="' + o[0] + '" aria-pressed="' + (String(o[0]) === String(cur)) + '">' + o[1] + '</button>'; }).join('') + '</div>';
  }
  function delta(c, p, low) {
    if (c == null || !p) return '';
    var d = (c - p) / p * 100; if (Math.abs(d) < .5) return '<span class="dl flat">flat</span>';
    var good = low ? d < 0 : d > 0; return '<span class="dl ' + (good ? 'up' : 'down') + '">' + (d > 0 ? '+' : '−') + Math.abs(d).toFixed(0) + '%</span>';
  }
  C.delta = delta;
  function afterChange() { C.drawerRefresh(); C.rerender(); }

  // ===== Dashboard =========================================================
  C.acts.range = function (el) { C.ui.range = +el.dataset.v; C.rerender(); $('[data-act="range"][aria-pressed="true"]').focus(); };
  V.dashboard = {
    title: function () { return 'Dashboard'; },
    render: function () {
      var range = C.ui.range || 30, L = S().leads, now = Date.now(), from = now - range * 864e5, pf = from - range * 864e5, d0 = C.dayStart();
      var cur = L.filter(function (l) { return l.created >= from; }), prev = L.filter(function (l) { return l.created >= pf && l.created < from; });
      var avg = function (a) { var r = a.filter(function (l) { return l.resp != null; }); return r.length ? r.reduce(function (s, l) { return s + l.resp; }, 0) / r.length : null; };
      var won = function (a) { return a.filter(function (l) { return l.status === 'won'; }).length; };
      var conv = function (a) { return a.length ? won(a) / a.length * 100 : null; };
      var pv = openLeads().reduce(function (s, l) { return s + l.budget; }, 0);
      var within = cur.filter(function (l) { return l.resp != null && l.resp <= 15; }).length, answered = cur.filter(function (l) { return l.resp != null; }).length;

      var nb = range <= 7 ? 7 : range <= 14 ? 14 : 15, bw = range / nb * 864e5;
      var bucket = function (fn) { var o = []; for (var i = 0; i < nb; i++) { var a = from + i * bw; o.push(fn(L.filter(function (l) { return l.created >= a && l.created < a + bw; }))); } return o; };
      var sNew = bucket(function (a) { return a.length; }), carry = 0;
      var sResp = bucket(function (a) { var v = avg(a); if (v != null) carry = v; return carry; });
      var sWon = bucket(won), acc = 0, sPipe = bucket(function (a) { acc += a.filter(function (l) { return l.status !== 'won' && l.status !== 'lost'; }).reduce(function (s, l) { return s + l.budget; }, 0); return acc; });

      var vals = [], pvals = [], labs = [], titles = [], i;
      for (i = range - 1; i >= 0; i--) {
        var a = d0 - i * 864e5, b = a + 864e5, pa = a - range * 864e5;
        vals.push(L.filter(function (l) { return l.created >= a && l.created < b; }).length);
        pvals.push(L.filter(function (l) { return l.created >= pa && l.created < pa + 864e5; }).length);
        labs.push(C.dshort(a)); titles.push(new Date(a).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }));
      }
      C.chartSpecs.trend = function (w) {
        return C.chart.area({ w: w, h: 260, labels: labs, titles: titles, series: [{ values: vals, color: ACC, label: 'New leads' }, { values: pvals, color: '#AEB4C2', label: 'Prior ' + range + ' days', dash: true, fill: false }], fmt: String, label: 'New leads per day over the last ' + range + ' days compared with the prior period' });
      };
      var bySrc = Object.keys(C.SOURCES).map(function (k) { return { k: k, label: C.SOURCES[k].label, color: C.SOURCES[k].color, value: cur.filter(function (l) { return l.source === k; }).length }; });
      C.chartSpecs.donut = function (w) { return C.chart.donut({ size: Math.min(168, w), items: bySrc, center: String(cur.length), sub: 'leads', label: 'Leads by source: ' + bySrc.map(function (s) { return s.label + ' ' + s.value; }).join(', ') }); };
      var reach = ['Lead', 'Contacted', 'Site visit', 'Quote sent', 'Won'].map(function (lb, k) { return { label: lb, value: L.filter(function (l) { return C.reached(l) >= k; }).length, color: k === 4 ? '#1F9D57' : ACC }; });
      var lostN = L.filter(function (l) { return l.status === 'lost'; }).length;
      C.chartSpecs.funnel = function (w) { return C.chart.funnel({ w: w, h: 236, items: reach, label: 'Pipeline funnel: ' + reach.map(function (c) { return c.label + ' ' + c.value; }).join(', ') }); };

      var waiting = L.filter(function (l) { return l.status === 'new' && l.resp == null; }).sort(function (a, b) { return a.created - b.created; }).slice(0, 5);
      var end = C.dayStart() + 864e5;
      var tasks = S().tasks.filter(function (x) { return !x.done && x.due < end; }).sort(function (a, b) { return a.due - b.due; }).slice(0, 5);
      var maxS = Math.max.apply(null, bySrc.map(function (s) { return s.value; }).concat([1]));
      var srcRows = bySrc.map(function (s) {
        var a = cur.filter(function (l) { return l.source === s.k; }), w = won(a);
        return '<tr><td>' + C.srcBadge(s.k) + '</td><td class="num">' + a.length + '</td><td><span class="mbar"><i style="width:' + Math.round(s.value / maxS * 100) + '%;background:' + s.color + '"></i></span></td><td class="num">' + w + '</td><td class="num">' + (a.length ? Math.round(w / a.length * 100) + '%' : '—') + '</td><td class="num">' + C.fmtMin(avg(a)) + '</td><td class="num">' + C.money(a.reduce(function (x, l) { return x + l.budget; }, 0)) + '</td></tr>';
      }).join('');
      var kpi = function (label, val, f, d, sub, sp, col) { return '<div class="kpi"><div class="kl">' + label + '</div><div class="kv"><span data-count="' + val + '" data-f="' + f + '">' + C.fmts[f](val) + '</span>' + d + '</div><div class="ks">' + sub + '</div><div class="kspark">' + C.spark(sp, col) + '</div></div>'; };
      var hr = new Date().getHours(), greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
      var cr = conv(cur);

      return page('Dashboard', greet + ', Aarav · ' + new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }), seg('range', 'range', [[7, '7 days'], [14, '14 days'], [30, '30 days']], range, 'Date range')) +
        '<section class="kpis" aria-label="Key metrics">' +
        kpi('New leads', cur.length, 'int', delta(cur.length, prev.length), (prev.length ? 'vs ' + prev.length + ' in the prior ' + range + ' days' : 'in the last ' + range + ' days'), sNew, ACC) +
        kpi('First response', avg(cur) == null ? 0 : avg(cur), 'min', delta(avg(cur), avg(prev), true), answered ? Math.round(within / answered * 100) + '% answered within 15 min' : 'No replies yet', sResp, '#0B8F9E') +
        kpi('Won', cr == null ? 0 : cr, 'pct', delta(cr, conv(prev)), won(cur) + ' of ' + cur.length + ' leads converted', sWon, '#1F9D57') +
        kpi('Open pipeline', pv, 'money', '', openLeads().length + ' active leads', sPipe, '#8454E8') + '</section>' +
        '<div class="grid g-main"><section class="card"><div class="card-h"><div><h2>New leads</h2><p class="sub">Per day, against the prior ' + range + ' days</p></div><div class="lg"><span><i style="background:' + ACC + '"></i>This period</span><span><i class="dashed"></i>Prior</span></div></div><div class="chart" data-chart="trend"></div></section>' +
        '<section class="card"><div class="card-h"><div><h2>By source</h2><p class="sub">Last ' + range + ' days</p></div></div><div class="donut-wrap"><div class="chart donut" data-chart="donut"></div></div><ul class="srclist">' +
        bySrc.map(function (s) { return '<li>' + C.srcIco(s.k, 13) + '<span class="grow">' + s.label + '</span><b>' + s.value + '</b><em>' + (cur.length ? Math.round(s.value / cur.length * 100) : 0) + '%</em></li>'; }).join('') + '</ul></section></div>' +
        '<div class="grid g-main"><section class="card"><div class="card-h"><div><h2>Funnel</h2><p class="sub">Leads that reached each stage · ' + lostN + ' lost along the way</p></div></div><div class="chart" data-chart="funnel"></div></section>' +
        '<section class="card"><div class="card-h"><div><h2>Needs attention</h2><p class="sub">Replies and follow-ups on the clock</p></div></div>' +
        '<h3 class="h3">First reply pending</h3>' +
        (waiting.length ? '<ul class="mini">' + waiting.map(function (l) { var hrs = (now - l.created) / 36e5; return '<li><a class="lk" href="' + C.leadHref(l.id) + '">' + C.avatar(l.name, 22) + '<span>' + esc(l.name) + '</span></a><span class="grow"></span>' + C.srcIco(l.source, 13) + '<span class="wait ' + (hrs > 4 ? 'bad' : '') + '">' + (hrs < 1 ? Math.round(hrs * 60) + 'm' : hrs.toFixed(1) + 'h') + '</span></li>'; }).join('') + '</ul>' : '<p class="empty">Inbox zero — every lead has a reply.</p>') +
        '<h3 class="h3">Follow-ups due</h3>' +
        (tasks.length ? '<ul class="mini">' + tasks.map(function (x) { var l = C.lead(x.leadId); return '<li><a class="lk" href="' + C.leadHref(x.leadId) + '">' + C.avatar(l ? l.name : '?', 22) + '<span>' + esc(l ? l.name : x.leadId) + '</span></a><span class="muted sm grow tr">' + esc(x.text) + '</span><span class="wait ' + (x.due < now ? 'bad' : '') + '">' + C.tm(x.due) + '</span></li>'; }).join('') + '</ul>' : '<p class="empty">Nothing due today.</p>') + '</section></div>' +
        '<section class="card flush"><div class="card-h pad"><div><h2>Performance by source</h2><p class="sub">Last ' + range + ' days</p></div></div><div class="tablewrap"><table class="tbl"><thead><tr><th scope="col">Source</th><th scope="col" class="num">Leads</th><th scope="col" class="w-bar"><span class="sr">Share</span></th><th scope="col" class="num">Won</th><th scope="col" class="num">Conversion</th><th scope="col" class="num">Avg. response</th><th scope="col" class="num">Est. value</th></tr></thead><tbody>' + srcRows + '</tbody></table></div></section>';
    }
  };

  // ===== Inbox =============================================================
  function IS() { return C.ui.inbox || (C.ui.inbox = { q: '', src: 'all', st: 'all', owner: 'all', flag: '', sort: 'created', dir: -1 }); }
  var BUILTIN = [{ id: 'all', name: 'All leads', f: {} }, { id: 'reply', name: 'Needs reply', f: { flag: 'reply' } }, { id: 'mine', name: 'My leads', f: { owner: 'Aarav Khanna' } }, { id: 'high', name: 'High value', f: { flag: 'high' } }, { id: 'hot', name: 'Hot · 48h', f: { flag: 'hot' } }];
  function viewList() { return BUILTIN.concat(C.prefs().views.map(function (v) { return { id: v.id, name: v.name, f: v.f, custom: true }; })); }
  function norm(f) { return { q: f.q || '', src: f.src || 'all', st: f.st || 'all', owner: f.owner || 'all', flag: f.flag || '' }; }
  function matchesView(v) { var u = IS(), f = norm(v.f); return u.q.trim() === f.q && u.src === f.src && u.st === f.st && u.owner === f.owner && u.flag === f.flag; }
  function inboxFiltered() {
    var u = IS(), q = u.q.trim().toLowerCase(), now = Date.now(), SO = { new: 0, contacted: 1, site: 2, quote: 3, won: 4, lost: 5 };
    var a = S().leads.filter(function (l) {
      if (u.src !== 'all' && l.source !== u.src) return false;
      if (u.st !== 'all' && l.status !== u.st) return false;
      if (u.owner !== 'all' && l.owner !== u.owner) return false;
      if (u.flag === 'reply' && !(l.status === 'new' && l.resp == null)) return false;
      if (u.flag === 'high' && l.budget < 10) return false;
      if (u.flag === 'hot' && (now - l.created > 48 * 36e5 || l.status === 'won' || l.status === 'lost')) return false;
      if (q && (l.name + ' ' + l.id + ' ' + l.phone + ' ' + l.email + ' ' + l.service + ' ' + l.loc + ' ' + l.req).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var key = { created: function (l) { return l.created; }, budget: function (l) { return l.budget; }, name: function (l) { return l.name.toLowerCase(); }, st: function (l) { return SO[l.status]; }, owner: function (l) { return l.owner; }, src: function (l) { return l.source; }, resp: function (l) { return l.resp == null ? 1e9 : l.resp; } }[u.sort];
    a.sort(function (x, y) { var p = key(x), q2 = key(y); return (p < q2 ? -1 : p > q2 ? 1 : 0) * u.dir; });
    return a;
  }
  function th(k, label, cls) {
    var u = IS(), on = u.sort === k;
    return '<th scope="col" class="' + (cls || '') + '" aria-sort="' + (on ? (u.dir > 0 ? 'ascending' : 'descending') : 'none') + '"><button type="button" class="sortbtn" data-act="inbox-sort" data-k="' + k + '">' + label + '<span class="srt" aria-hidden="true">' + (on ? (u.dir > 0 ? '↑' : '↓') : '') + '</span></button></th>';
  }
  function inboxRes() {
    var a = inboxFiltered(), now = Date.now();
    if (!a.length) return '<div class="empty-st">' + C.ic('inbox', 22) + '<b>No leads match these filters</b><span>Clear the search or pick another source.</span><button type="button" class="btn" data-act="inbox-clear">Clear filters</button></div>';
    return '<div class="tablewrap"><table class="tbl dense"><thead><tr>' + th('name', 'Lead') + th('src', 'Source') + th('st', 'Stage') + th('budget', 'Budget', 'num') + th('owner', 'Owner') + th('created', 'Received') + th('resp', '1st reply', 'num') + '</tr></thead><tbody>' +
      a.map(function (l) {
        var hrs = (now - l.created) / 36e5;
        return '<tr tabindex="0" data-id="' + l.id + '" data-href="' + C.leadHref(l.id) + '"' + (C.cur && C.cur.lead === l.id ? ' class="sel"' : '') + '><td class="c-main"><div class="lc">' + C.avatar(l.name, 28) + '<div><a class="lname" href="' + C.leadHref(l.id) + '">' + esc(l.name) + '</a><div class="muted sm">' + esc(l.service) + ' · ' + esc(l.loc) + '</div></div></div></td><td>' + C.srcBadge(l.source) + '</td><td>' + C.pill(l.status) + '</td><td class="num">' + C.money(l.budget) + '</td><td><span class="own">' + C.avatar(l.owner, 18) + esc(l.owner.split(' ')[0]) + '</span></td><td class="muted nw">' + C.rel(l.created) + '</td><td class="num nw">' + (l.resp == null ? '<span class="wait ' + (hrs > 4 ? 'bad' : '') + '">Waiting ' + (hrs < 1 ? Math.round(hrs * 60) + 'm' : hrs.toFixed(0) + 'h') + '</span>' : C.fmtMin(l.resp)) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function inboxTabs() {
    var cur = viewList().filter(matchesView)[0], L = S().leads;
    return viewList().map(function (v) {
      var on = cur && cur.id === v.id;
      var b = '<button type="button" class="vtab' + (on ? ' on' : '') + '" data-act="inbox-view" data-id="' + v.id + '" aria-pressed="' + !!on + '">' + esc(v.name) + '</button>';
      return v.custom ? '<span class="vt">' + b + '<button type="button" class="vx" data-act="view-del" data-id="' + v.id + '" aria-label="Delete saved view ' + esc(v.name) + '">' + C.ic('x', 11) + '</button></span>' : b;
    }).join('') + (cur ? '' : '<button type="button" class="vtab save" data-act="view-save">' + C.ic('plus', 12) + ' Save this view</button>');
  }
  function inboxSync() {
    var u = IS(); $('#inbox-tabs').innerHTML = inboxTabs(); $('#inbox-res').innerHTML = inboxRes();
    $$('[data-act="inbox-src"]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === u.src)); });
    var n = inboxFiltered().length; $('#inbox-count').textContent = n + (n === 1 ? ' lead' : ' leads');
  }
  V.inbox = {
    title: function () { return 'Lead inbox'; },
    render: function () {
      var u = IS(), L = S().leads;
      var chips = '<button type="button" class="chip" data-act="inbox-src" data-v="all" aria-pressed="' + (u.src === 'all') + '">All <b>' + L.length + '</b></button>' + Object.keys(C.SOURCES).map(function (k) {
        return '<button type="button" class="chip" data-act="inbox-src" data-v="' + k + '" aria-pressed="' + (u.src === k) + '">' + C.srcIco(k, 13) + C.SOURCES[k].label + ' <b>' + L.filter(function (l) { return l.source === k; }).length + '</b></button>';
      }).join('');
      var opt = function (v, t, cur) { return '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + t + '</option>'; };
      return page('Lead inbox', 'Every enquiry from the website, ads, WhatsApp, chatbot and phone in one place', '<button type="button" class="btn pri" data-act="new-lead">' + C.ic('plus', 14) + 'New lead <kbd>C</kbd></button>') +
        '<div class="vtabs" id="inbox-tabs" role="group" aria-label="Saved views">' + inboxTabs() + '</div>' +
        '<section class="card flush inbox"><div class="toolbar" role="search"><div class="sfield">' + C.ic('search', 15) + '<label class="sr" for="q">Search leads</label><input id="q" type="search" data-in="inbox-q" value="' + esc(u.q) + '" placeholder="Search name, phone, area, service…" autocomplete="off"></div>' +
        '<label class="sr" for="st">Stage</label><select id="st" data-ch="inbox-st" class="sel">' + opt('all', 'All stages', u.st) + C.STAGES.map(function (s) { return opt(s.id, s.label, u.st); }).join('') + '</select>' +
        '<label class="sr" for="ow">Owner</label><select id="ow" data-ch="inbox-owner" class="sel">' + opt('all', 'Any owner', u.owner) + C.TEAM.map(function (t) { return opt(t, t, u.owner); }).join('') + '</select><span class="count" id="inbox-count" role="status">' + inboxFiltered().length + ' leads</span></div>' +
        '<div class="chips" role="group" aria-label="Filter by source">' + chips + '</div><div id="inbox-res">' + inboxRes() + '</div></section>';
    }
  };
  C.ins['inbox-q'] = function (el) { IS().q = el.value; inboxSync(); };
  C.chs['inbox-st'] = function (el) { IS().st = el.value; inboxSync(); };
  C.chs['inbox-owner'] = function (el) { IS().owner = el.value; inboxSync(); };
  C.acts['inbox-src'] = function (el) { IS().src = el.dataset.v; inboxSync(); };
  C.acts['inbox-sort'] = function (el) { var u = IS(), k = el.dataset.k; if (u.sort === k) u.dir = -u.dir; else { u.sort = k; u.dir = (k === 'created' || k === 'budget') ? -1 : 1; } inboxSync(); var b = $('[data-act="inbox-sort"][data-k="' + k + '"]'); if (b) b.focus(); };
  C.acts['inbox-clear'] = function () { C.ui.inbox = null; C.rerender(); };
  C.acts['inbox-view'] = function (el) {
    var v = viewList().filter(function (x) { return x.id === el.dataset.id; })[0], u = IS(), f = norm(v.f);
    u.q = f.q; u.src = f.src; u.st = f.st; u.owner = f.owner; u.flag = f.flag; C.rerender(); var b = $('[data-act="inbox-view"][data-id="' + v.id + '"]'); if (b) b.focus();
  };
  C.acts['view-save'] = function () {
    C.dialog('Save view', '<div class="field"><label for="vn">View name</label><input id="vn" name="name" required maxlength="28" placeholder="e.g. Meta leads over ₹5 L" autocomplete="off"></div><p class="hint">Saves the current search and filters as a tab. Stored in this browser only.</p>', 'Save view', function (fd) {
      var name = (fd.get('name') || '').trim(); if (!name) return false;
      C.prefs().views.push({ id: 'v' + Date.now().toString(36), name: name, f: norm(IS()) }); C.savePrefs(); inboxSync(); C.toast('View “' + name + '” saved');
    });
  };
  C.acts['view-del'] = function (el) { var P = C.prefs(); P.views = P.views.filter(function (v) { return v.id !== el.dataset.id; }); C.savePrefs(); inboxSync(); C.toast('Saved view removed', { icon: 'trash' }); };
  C.acts['goto-src'] = function (el) { C.ui.inbox = { q: '', src: el.dataset.v, st: 'all', owner: 'all', flag: '', sort: 'created', dir: -1 }; };
  C.acts['new-lead'] = function () {
    var opt = function (a) { return a.map(function (x) { return '<option>' + x + '</option>'; }).join(''); };
    C.dialog('New lead',
      '<div class="field"><label for="nl-n">Full name</label><input id="nl-n" name="name" required autocomplete="off"></div>' +
      '<div class="row2"><div class="field"><label for="nl-p">Phone</label><input id="nl-p" name="phone" inputmode="tel" placeholder="+91 …" autocomplete="off"></div>' +
      '<div class="field"><label for="nl-s">Source</label><select id="nl-s" name="source">' + Object.keys(C.SOURCES).map(function (k) { return '<option value="' + k + '">' + C.SOURCES[k].label + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="row2"><div class="field"><label for="nl-v">Service</label><select id="nl-v" name="service">' + opt(C.SERVICES) + '</select></div>' +
      '<div class="field"><label for="nl-b">Budget (₹ lakh)</label><input id="nl-b" name="budget" type="number" min="0.1" step="0.1" value="3"></div></div>' +
      '<div class="field"><label for="nl-r">Requirement</label><textarea id="nl-r" name="req" rows="3"></textarea></div>',
      'Add lead', function (fd) {
        var name = (fd.get('name') || '').trim(); if (!name) return false;
        var l = C.newLead({ name: name, phone: fd.get('phone'), source: fd.get('source'), service: fd.get('service'), budget: +fd.get('budget') || 3, req: (fd.get('req') || '').trim() });
        C.toast('Lead added to the inbox'); location.hash = '#/' + (C.cur.name === 'bot' || C.cur.name === 'utm' ? 'inbox' : C.cur.name) + '/' + l.id; setTimeout(C.rerender, 30);
      });
  };
  document.addEventListener('keydown', function (e) {
    if (!C.cur || C.cur.name !== 'inbox' || document.querySelector('dialog[open]')) return;
    var t = e.target, tr = t.closest && t.closest('tbody tr[data-id]'), typing = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
    if (tr) {
      if (e.key === 'Enter') { C._opener = tr; location.hash = tr.dataset.href; e.preventDefault(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'j' || e.key === 'k') {
        var n = (e.key === 'ArrowDown' || e.key === 'j') ? tr.nextElementSibling : tr.previousElementSibling; if (n) n.focus(); e.preventDefault();
      }
    } else if (!typing && (e.key === 'j' || e.key === 'k') && !e.metaKey && !e.ctrlKey && !$('#drawer').contains(t)) {
      var rows = $$('#inbox-res tbody tr'); if (rows.length) { rows[e.key === 'j' ? 0 : rows.length - 1].focus(); e.preventDefault(); }
    }
  });

  // ===== Lead drawer =======================================================
  var TYPE = { 'in': ['Lead received', 'inbox'], call: ['Call', 'phone'], msg: ['Message', 'sms'], note: ['Note', 'note'], status: ['Stage change', 'flag'], visit: ['Site visit', 'pin'], quote: ['Quote', 'mail'], task: ['Task', 'tasks'] };
  var TPL = [
    { id: 'intro', label: 'First reply', t: 'Hi {first}, this is {agent} from Lumen Homes. Thanks for your enquiry about {service}. When is a good time for a quick call today?' },
    { id: 'visit', label: 'Site visit', t: 'Hi {first}, confirming your free site visit for {service} on {day} at 11 am. Reply YES to confirm or suggest another slot. — {agent}, Lumen Homes' },
    { id: 'quote', label: 'Quote follow-up', t: 'Hi {first}, just checking in on the quote we shared for your {service}. Happy to walk you through it or adjust the scope. — {agent}' },
    { id: 'missed', label: 'Missed call', t: 'Hi {first}, we tried calling about your {service} enquiry. Tell us a convenient time and we will call you back. — {agent}, Lumen Homes' }
  ];
  function tplText(t, l) {
    var d = new Date(Date.now() + 864e5);
    return t.t.replace('{first}', l.name.split(' ')[0]).replace('{agent}', l.owner.split(' ')[0]).replace('{service}', l.service.toLowerCase()).replace('{day}', d.toLocaleDateString('en-GB', { weekday: 'long' }));
  }
  function dState() { return C.ui.dr || (C.ui.dr = { tab: 'activity', mode: 'note', id: null }); }
  var STEPS = ['new', 'contacted', 'site', 'quote', 'won'];

  function composer(l) {
    var D = dState(), m = D.mode;
    var modes = [['note', 'Note', 'note'], ['call', 'Call log', 'phone'], ['sms', 'SMS', 'sms'], ['wa', 'WhatsApp', 'wa']].map(function (x) {
      return '<button type="button" data-act="dr-mode" data-v="' + x[0] + '" aria-pressed="' + (m === x[0]) + '">' + C.ic(x[2], 13) + x[1] + '</button>';
    }).join('');
    var body, btn;
    if (m === 'note') { body = '<label class="sr" for="cm-t">Note</label><textarea id="cm-t" name="text" rows="3" required placeholder="Add a note — e.g. prefers calls after 6 pm"></textarea>'; btn = 'Save note'; }
    else if (m === 'call') {
      body = '<div class="row3"><div class="field"><label for="cm-o">Outcome</label><select id="cm-o" name="outcome"><option>Connected</option><option>No answer</option><option>Voicemail left</option><option>Busy</option><option>Wrong number</option></select></div><div class="field"><label for="cm-d">Duration</label><input id="cm-d" name="dur" placeholder="mm:ss" pattern="[0-9]{1,2}:[0-5][0-9]" title="Use minutes:seconds, e.g. 4:30" autocomplete="off"></div><label class="chk"><input type="checkbox" name="fu" checked> Follow up tomorrow</label></div>' +
        '<div class="field"><label for="cm-t">What was discussed?</label><textarea id="cm-t" name="text" rows="2" placeholder="Optional — key points from the call"></textarea></div>'; btn = 'Log call';
    } else {
      body = '<div class="tpls" role="group" aria-label="Templates">' + TPL.map(function (t) { return '<button type="button" class="chip" data-act="dr-tpl" data-id="' + t.id + '">' + t.label + '</button>'; }).join('') + '</div>' +
        '<label class="sr" for="cm-t">Message</label><textarea id="cm-t" name="text" rows="4" required data-in="dr-count" placeholder="Pick a template or write your own…"></textarea><div class="cnt"><span id="cm-n">0 characters</span><span>Simulated — nothing is sent</span></div>';
      btn = m === 'sms' ? 'Send SMS' : 'Send WhatsApp';
    }
    return '<form class="comp" data-form="dr-comp" data-id="' + l.id + '"><div class="seg" role="group" aria-label="Entry type">' + modes + '</div>' + body + '<div class="comp-f"><button class="btn pri sm">' + (m === 'sms' || m === 'wa' ? C.ic('send', 13) : '') + btn + '</button></div></form>';
  }
  function taskRow(t) {
    var l = C.lead(t.leadId), late = !t.done && t.due < Date.now();
    return '<li class="task' + (t.done ? ' done' : '') + '"><input type="checkbox" id="tk-' + t.id + '" data-ch="task-toggle" data-id="' + t.id + '"' + (t.done ? ' checked' : '') + '><div class="tk-b"><label for="tk-' + t.id + '">' + esc(t.text) + '</label><div class="muted sm"><a href="' + C.leadHref(t.leadId) + '">' + esc(l ? l.name : t.leadId) + '</a> · ' + esc(t.owner.split(' ')[0]) + ' · <span class="' + (late ? 'late' : '') + '">' + (t.done ? 'Done ' + C.rel(t.doneAt || Date.now()) : (late ? 'Overdue · ' : '') + dueText(t)) + '</span></div></div></li>';
  }
  function drawerHTML(l) {
    var D = dState(), tasks = S().tasks.filter(function (t) { return t.leadId === l.id; }).sort(function (a, b) { return (a.done - b.done) || a.due - b.due; });
    var openT = tasks.filter(function (t) { return !t.done; }).length, idx = STEPS.indexOf(l.status), lost = l.status === 'lost';
    var tl = l.tl.slice().sort(function (a, b) { return b.t - a.t; });
    var steps = STEPS.map(function (s, i) {
      var st = C.stage(s), cls = lost ? '' : i < idx ? ' done' : i === idx ? ' now' : '';
      return '<button type="button" class="stp' + cls + '" data-act="dr-stage" data-to="' + s + '" aria-pressed="' + (l.status === s) + '"><i></i><span>' + st.label + '</span></button>';
    }).join('');
    var tabs = [['activity', 'Activity'], ['details', 'Details'], ['tasks', 'Tasks' + (openT ? ' <b>' + openT + '</b>' : '')]].map(function (x) { return '<button type="button" role="tab" id="dt-' + x[0] + '" aria-selected="' + (D.tab === x[0]) + '" aria-controls="dr-panel" tabindex="' + (D.tab === x[0] ? 0 : -1) + '" data-act="dr-tab" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('');
    var body;
    if (D.tab === 'activity') {
      body = composer(l) + '<ol class="tl">' + tl.map(function (e) {
        var ty = TYPE[e.type] || ['Activity', 'note'], ic = e.type === 'msg' && /^WhatsApp/.test(e.text) ? 'wa' : ty[1];
        return '<li class="tl-' + e.type + '"><span class="tl-i">' + C.ic(ic, 13) + '</span><div class="tl-b"><div class="tl-h"><b>' + ty[0] + '</b><time datetime="' + new Date(e.t).toISOString() + '">' + C.dt(e.t) + '</time></div><p>' + esc(e.text) + '</p></div></li>';
      }).join('') + '</ol>';
    } else if (D.tab === 'details') {
      body = '<dl class="dlist"><dt>Phone</dt><dd>' + esc(l.phone) + ' <span class="muted sm">masked</span></dd><dt>Email</dt><dd>' + esc(l.email || '—') + '</dd><dt>Area</dt><dd>' + esc(l.loc) + '</dd><dt>Owner</dt><dd><select data-ch="dr-owner" class="sel sm" aria-label="Owner">' + C.TEAM.map(function (t) { return '<option' + (t === l.owner ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></dd></dl>' +
        '<h3 class="h3">Requirement</h3><dl class="dlist"><dt>Service</dt><dd>' + esc(l.service) + '</dd><dt>Budget</dt><dd>' + C.money(l.budget) + '</dd></dl><p class="req">' + esc(l.req) + '</p>' +
        '<h3 class="h3">Attribution</h3><dl class="dlist"><dt>Channel</dt><dd>' + C.srcBadge(l.source) + '</dd><dt>utm_source</dt><dd class="mono">' + esc(l.utm.source) + '</dd><dt>utm_medium</dt><dd class="mono">' + esc(l.utm.medium) + '</dd><dt>utm_campaign</dt><dd class="mono">' + esc(l.utm.campaign || '—') + '</dd><dt>First reply</dt><dd>' + (l.resp == null ? '<span class="wait bad">Waiting</span>' : C.fmtMin(l.resp)) + '</dd><dt>Received</dt><dd>' + C.dt(l.created) + '</dd></dl>' +
        (l.notes.length ? '<h3 class="h3">Notes</h3><ul class="notes">' + l.notes.slice().sort(function (a, b) { return b.t - a.t; }).map(function (n) { return '<li><p>' + esc(n.text) + '</p><span class="muted sm">' + esc(n.by) + ' · ' + C.dt(n.t) + '</span></li>'; }).join('') + '</ul>' : '');
    } else {
      body = (tasks.length ? '<ul class="tasks compact">' + tasks.map(taskRow).join('') + '</ul>' : '<p class="empty">No tasks yet.</p>') +
        '<form data-form="add-task" data-id="' + l.id + '" class="stack-form"><div class="field"><label for="tt">New follow-up</label><input id="tt" name="text" required placeholder="e.g. Send revised quote" autocomplete="off"></div><div class="row2"><div class="field"><label for="td">When</label><select id="td" name="when"><option value="today">Today, 6:00 pm</option><option value="tomorrow">Tomorrow, 11:00 am</option><option value="3d">In 3 days</option><option value="week">Next week</option></select></div><button class="btn pri">Add task</button></div></form>';
    }
    return '<div class="dr-head"><div class="dr-id">' + C.avatar(l.name, 40) + '<div><h2 id="dr-t">' + esc(l.name) + '</h2><p>' + esc(l.id) + ' · ' + esc(l.service) + ' · ' + esc(l.loc) + '</p></div></div><button type="button" class="ibtn" data-act="dr-close" aria-label="Close lead panel">' + C.ic('x', 17) + '</button></div>' +
      '<div class="dr-meta">' + C.srcBadge(l.source) + '<span>' + C.money(l.budget) + '</span><span>' + C.avatar(l.owner, 18) + esc(l.owner.split(' ')[0]) + '</span><span class="muted">' + C.rel(l.created) + '</span></div>' +
      '<div class="steps" role="group" aria-label="Stage">' + steps + '</div><div class="dr-sub">' + (lost ? '<span class="pill st-lost"><i style="background:#C4C8D0"></i>Lost</span> <button type="button" class="lnk" data-act="dr-stage" data-to="contacted">Reopen as Contacted</button>' : l.status === 'won' ? '<span class="pill st-won"><i style="background:#1F9D57"></i>Won</span>' : '<button type="button" class="lnk" data-act="dr-stage" data-to="lost">Mark as lost</button>') + '</div>' +
      '<div class="dr-actions"><button type="button" class="btn sm" data-act="dr-do" data-v="call">' + C.ic('phone', 14) + 'Call</button><button type="button" class="btn sm" data-act="dr-do" data-v="sms">' + C.ic('sms', 14) + 'SMS</button><button type="button" class="btn sm" data-act="dr-do" data-v="wa">' + C.ic('wa', 14) + 'WhatsApp</button><button type="button" class="btn sm" data-act="dr-do" data-v="note">' + C.ic('note', 14) + 'Note</button><button type="button" class="btn sm" data-act="dr-do" data-v="task">' + C.ic('tasks', 14) + 'Task</button></div>' +
      '<div class="tabs sm" role="tablist" aria-label="Lead sections">' + tabs + '</div><div class="dr-body" id="dr-panel" role="tabpanel" aria-labelledby="dt-' + D.tab + '">' + body + '</div>';
  }
  var drLead = null, drOpen = false;
  C.drawerRefresh = function () {
    if (!drOpen || !drLead) return; var l = C.lead(drLead), dr = $('#drawer'); if (!l) return;
    var b = $('.dr-body', dr), y = b ? b.scrollTop : 0; dr.innerHTML = drawerHTML(l); b = $('.dr-body', dr); if (b) b.scrollTop = y;
  };
  C.syncDrawer = function (id) {
    var dr = $('#drawer'), sc = $('#dscrim');
    $$('tr.sel').forEach(function (r) { r.classList.remove('sel'); });
    if (!id) {
      if (!drOpen) return; drOpen = false; drLead = null;
      var fin = false, done = function () { if (fin || drOpen) return; fin = true; if (window.gsap) gsap.set([dr, sc], { clearProps: 'all' }); dr.hidden = true; dr.innerHTML = ''; sc.classList.remove('on'); var o = C._opener; C._opener = null; if (o && document.contains(o)) o.focus({ preventScroll: true }); else if (document.activeElement === document.body) $('#view').focus({ preventScroll: true }); };
      if (C.motion()) { gsap.to(dr, { x: 36, opacity: 0, duration: .22, ease: 'power2.in', onComplete: done }); gsap.to(sc, { opacity: 0, duration: .22 }); setTimeout(done, 400); } else done();
      return;
    }
    var l = C.lead(id), D = dState(), wasOpen = drOpen;
    if (D.id !== id) { D.tab = 'activity'; D.mode = 'note'; D.id = id; }
    drLead = id; drOpen = true; dr.hidden = false; dr.innerHTML = drawerHTML(l); sc.classList.add('on');
    var row = $('tr[data-id="' + id + '"]'); if (row) row.classList.add('sel');
    if (!wasOpen) {
      if (!C._opener) C._opener = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
      if (C.motion()) { gsap.killTweensOf([dr, sc]); gsap.fromTo(dr, { x: 44, opacity: 0 }, { x: 0, opacity: 1, duration: .32, ease: 'power3.out', clearProps: 'transform,opacity' }); gsap.fromTo(sc, { opacity: 0 }, { opacity: 1, duration: .25, clearProps: 'opacity' }); }
      var f = $('[data-act="dr-close"]', dr); if (f) f.focus({ preventScroll: true });
    }
  };
  C.closeDrawer = function () { location.hash = '#/' + C.cur.name; };
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !drOpen || document.querySelector('dialog[open]')) return;
    var dr = $('#drawer'); if (!dr.contains(e.target)) return;
    var f = $$('button:not([disabled]),input:not([disabled]),select,textarea,a[href],[tabindex="0"]', dr).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return; var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && e.target === a) { z.focus(); e.preventDefault(); } else if (!e.shiftKey && e.target === z) { a.focus(); e.preventDefault(); }
  });
  document.addEventListener('click', function (e) { if (e.target.id === 'dscrim') C.closeDrawer(); });

  C.acts['dr-close'] = function () { C.closeDrawer(); };
  C.acts['dr-tab'] = function (el) { dState().tab = el.dataset.v; C.drawerRefresh(); var t = $('#drawer [role="tab"][aria-selected="true"]'); if (t) t.focus(); };
  C.acts['dr-mode'] = function (el) { var D = dState(); D.mode = el.dataset.v; C.drawerRefresh(); var t = $('#cm-t'); if (t) t.focus(); };
  C.acts['dr-do'] = function (el) {
    var D = dState(), v = el.dataset.v; if (v === 'task') { D.tab = 'tasks'; C.drawerRefresh(); $('#tt').focus(); return; }
    D.tab = 'activity'; D.mode = v; C.drawerRefresh(); var f = $('#cm-t') || $('#cm-o'); if (f) f.focus();
    if (v === 'call') { var o = $('#cm-o'); if (o) o.focus(); }
  };
  C.acts['dr-tpl'] = function (el) {
    var l = C.lead(drLead), t = TPL.filter(function (x) { return x.id === el.dataset.id; })[0], ta = $('#cm-t');
    ta.value = tplText(t, l); C.ins['dr-count'](ta); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
  };
  C.ins['dr-count'] = function (el) { var n = el.value.length, m = dState().mode; $('#cm-n').textContent = n + ' characters' + (m === 'sms' ? ' · ' + Math.max(1, Math.ceil(n / 160)) + ' SMS' : ''); };
  C.acts['dr-stage'] = function (el) {
    var l = C.lead(drLead), from = l.status, to = el.dataset.to;
    if (C.setStatus(l, to)) {
      afterChange();
      C.toast(l.name + ' → ' + C.stageLabel(to), { icon: 'flag', undo: function () { C.setStatus(l, from); afterChange(); } });
      var b = $('#drawer [data-to="' + to + '"]') || $('#drawer [data-act="dr-close"]'); if (b) b.focus({ preventScroll: true });
    }
  };
  C.chs['dr-owner'] = function (el) { var l = C.lead(drLead); l.owner = el.value; C.log(l, 'status', 'Owner changed to ' + el.value); C.save(); afterChange(); C.toast('Owner set to ' + el.value.split(' ')[0]); };
  C.forms['dr-comp'] = function (f) {
    var l = C.lead(f.dataset.id), m = dState().mode, txt = (f.elements.text.value || '').trim();
    if (m === 'note') { if (!txt) return; l.notes.push({ t: Date.now(), text: txt, by: l.owner }); C.log(l, 'note', txt); C.toast('Note saved'); }
    else if (m === 'call') {
      var oc = f.elements.outcome.value, dur = (f.elements.dur.value || '').trim();
      C.log(l, 'call', oc + (dur ? ' · ' + dur : '') + (txt ? ' — ' + txt : ''));
      if (oc === 'Connected' && l.status === 'new') C.setStatus(l, 'contacted');
      if (f.elements.fu.checked) { var d = new Date(); d.setDate(d.getDate() + 1); d.setHours(11, 0, 0, 0); C.addTask(l.id, oc === 'Connected' ? 'Follow up after call' : 'Call back — ' + oc.toLowerCase(), d.getTime()); }
      C.toast('Call logged to timeline', { icon: 'phone' });
    } else {
      if (!txt) return; var wa = m === 'wa';
      C.log(l, 'msg', (wa ? 'WhatsApp' : 'SMS') + ' sent (simulated): ' + txt); if (l.status === 'new') C.setStatus(l, 'contacted');
      C.toast((wa ? 'WhatsApp' : 'SMS') + ' sent — simulated', { icon: 'send' });
    }
    C.save(); afterChange(); var t = $('#cm-t'); if (t) t.focus({ preventScroll: true });
  };
  var WHEN = { today: function () { var d = new Date(); d.setHours(18, 0, 0, 0); return Math.max(d.getTime(), Date.now() + 36e5); }, tomorrow: function () { var d = new Date(); d.setDate(d.getDate() + 1); d.setHours(11, 0, 0, 0); return d.getTime(); }, '3d': function () { var d = new Date(); d.setDate(d.getDate() + 3); d.setHours(11, 0, 0, 0); return d.getTime(); }, week: function () { var d = new Date(); d.setDate(d.getDate() + 7); d.setHours(11, 0, 0, 0); return d.getTime(); } };
  C.forms['add-task'] = function (f) {
    var txt = f.elements.text.value.trim(); if (!txt) return;
    C.addTask(f.dataset.id, txt, WHEN[f.elements.when.value]()); C.toast('Follow-up added', { icon: 'tasks' }); afterChange(); var t = $('#tt'); if (t) t.focus();
  };
  C.chs['task-toggle'] = function (el) {
    var t = S().tasks.filter(function (x) { return x.id === el.dataset.id; })[0]; t.done = el.checked; t.doneAt = el.checked ? Date.now() : null;
    var l = C.lead(t.leadId); if (l) C.log(l, 'task', (t.done ? 'Completed: ' : 'Re-opened: ') + t.text);
    C.save(); C.badges(); afterChange(); var again = $('#tk-' + t.id); if (again) again.focus({ preventScroll: true });
  };

  // ===== Tasks =============================================================
  V.tasks = {
    title: function () { return 'Tasks'; },
    render: function () {
      var T = S().tasks, td = C.dayStart(), end = td + 864e5, byDue = function (a, b) { return a.due - b.due; };
      var over = T.filter(function (t) { return !t.done && t.due < td; }).sort(byDue), today = T.filter(function (t) { return !t.done && t.due >= td && t.due < end; }).sort(byDue), soon = T.filter(function (t) { return !t.done && t.due >= end; }).sort(byDue), done = T.filter(function (t) { return t.done; }).sort(function (a, b) { return (b.doneAt || 0) - (a.doneAt || 0); }).slice(0, 6);
      var grp = function (title, list, cls, empty) { return '<section class="card ' + (cls || '') + '"><div class="card-h"><h2>' + title + ' <span class="count-b">' + list.length + '</span></h2></div>' + (list.length ? '<ul class="tasks">' + list.map(taskRow).join('') + '</ul>' : '<p class="empty">' + empty + '</p>') + '</section>'; };
      return page('Tasks', 'Follow-ups for the sales team, ordered by when they are due') +
        '<div class="grid g-two"><div class="stackc">' + grp('Overdue', over, 'warn', 'Nothing overdue — nice.') + grp('Due today', today, '', 'You’re clear for today.') + '</div><div class="stackc">' + grp('Upcoming', soon, '', 'No upcoming tasks.') + grp('Recently completed', done, '', 'Nothing completed yet.') + '</div></div>';
    }
  };

  // ===== Pipeline ==========================================================
  function ownerSel() { return C.ui.pown || 'all'; }
  function boardHTML() {
    var L = S().leads.filter(function (l) { return ownerSel() === 'all' || l.owner === ownerSel(); });
    return C.STAGES.map(function (s, si) {
      var a = L.filter(function (l) { return l.status === s.id; }).sort(function (x, y) { return y.created - x.created; });
      var prev = C.STAGES[si - 1], next = C.STAGES[si + 1];
      return '<section class="kcol" data-stage="' + s.id + '" aria-labelledby="kc-' + s.id + '"><header class="kh"><i class="kdot" style="background:' + s.color + '"></i><h2 id="kc-' + s.id + '">' + s.label + '</h2><span class="count-b">' + a.length + '</span><span class="kv-s">' + C.money(a.reduce(function (x, l) { return x + l.budget; }, 0)) + '</span></header><ul class="klist">' +
        a.map(function (l) {
          return '<li class="kcard" tabindex="0" data-card="' + l.id + '" data-stage="' + s.id + '" aria-label="' + esc(l.name + ', ' + l.service + ', ' + C.money(l.budget) + '. Enter opens. Shift plus left or right arrow moves it.') + '"><div class="k-top"><span class="k-n">' + esc(l.name) + '</span><b>' + C.money(l.budget) + '</b></div><div class="muted sm">' + esc(l.service) + ' · ' + esc(l.loc) + '</div><div class="kmeta"><span class="kgrip" aria-hidden="true" title="Drag to move">' + C.ic('grip', 14) + '</span>' + C.srcIco(l.source, 13) + C.avatar(l.owner, 18) + '<span class="muted sm">' + C.rel(l.created) + '</span><span class="grow"></span>' +
            (prev ? '<button type="button" class="kmv" data-act="move" data-id="' + l.id + '" data-to="' + prev.id + '" aria-label="Move ' + esc(l.name) + ' back to ' + prev.label + '">' + C.ic('chev-l', 13) + '</button>' : '') +
            (next ? '<button type="button" class="kmv" data-act="move" data-id="' + l.id + '" data-to="' + next.id + '" aria-label="Move ' + esc(l.name) + ' forward to ' + next.label + '">' + C.ic('chev-r', 13) + '</button>' : '') + '</div></li>';
        }).join('') + (a.length ? '' : '<li class="kempty">Drop a lead here</li>') + '</ul></section>';
    }).join('');
  }
  V.pipeline = {
    title: function () { return 'Pipeline'; },
    render: function () {
      var open = openLeads(), tot = open.reduce(function (s, l) { return s + l.budget; }, 0), w = S().leads.filter(function (l) { return l.status === 'won'; });
      return page('Pipeline', C.money(tot) + ' open across ' + open.length + ' leads · ' + C.money(w.reduce(function (s, l) { return s + l.budget; }, 0)) + ' won', '<label class="sr" for="po">Owner</label><select id="po" class="sel" data-ch="pipe-owner"><option value="all">Everyone</option>' + C.TEAM.map(function (t) { return '<option' + (ownerSel() === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>') +
        '<p class="hint kb-hint">Drag a card to a new stage. With the keyboard: focus a card, then <kbd>⇧</kbd> <kbd>←</kbd> <kbd>→</kbd> moves it, <kbd>↵</kbd> opens it.</p>' +
        '<div class="board" id="board" role="region" aria-label="Pipeline board">' + boardHTML() + '</div><p class="sr" id="live" role="status" aria-live="polite"></p>';
    },
    mount: function () { if (C.motion() && !C.noFx) gsap.from('.kcol', { opacity: 0, y: 14, duration: .45, stagger: .05, ease: 'power3.out', delay: .1, clearProps: 'all' }); }
  };
  C.chs['pipe-owner'] = function (el) { C.ui.pown = el.value; C.rerender(); };
  function snap() { var m = {}; $$('.kcard').forEach(function (c) { m[c.dataset.card] = c.getBoundingClientRect(); }); return m; }
  function moveTo(id, to, o) {
    o = o || {}; var l = C.lead(id); if (!l || l.status === to) return; var from = l.status;
    var before = snap(); if (o.ghostRect) before[id] = o.ghostRect;
    C.setStatus(l, to);
    var board = $('#board'), sl = board.scrollLeft; board.innerHTML = boardHTML(); board.scrollLeft = sl;
    var stats = $('.page-h .sub'); if (stats) { var open = openLeads(); stats.textContent = C.money(open.reduce(function (s, x) { return s + x.budget; }, 0)) + ' open across ' + open.length + ' leads · ' + C.money(S().leads.filter(function (x) { return x.status === 'won'; }).reduce(function (s, x) { return s + x.budget; }, 0)) + ' won'; }
    if (C.motion()) {
      $$('.kcard').forEach(function (c) {
        var b = before[c.dataset.card]; if (!b) return; var a = c.getBoundingClientRect(), dx = b.left - a.left, dy = b.top - a.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return; var moved = c.dataset.card === id;
        gsap.fromTo(c, { x: dx, y: dy, scale: moved ? 1.03 : 1 }, { x: 0, y: 0, scale: 1, duration: moved ? .5 : .4, ease: moved ? 'expo.out' : 'power3.out', clearProps: 'transform', zIndex: moved ? 5 : 0 });
      });
      var col = $('.kcol[data-stage="' + to + '"] .kh'); if (col) gsap.fromTo(col, { backgroundColor: 'rgba(43,89,255,.14)' }, { backgroundColor: 'rgba(43,89,255,0)', duration: .9, clearProps: 'backgroundColor' });
    }
    var msg = l.name + ' moved to ' + C.stageLabel(to); $('#live').textContent = msg;
    C.toast(msg, { icon: 'pipe', undo: function () { moveTo(id, from); } });
    if (o.focus !== false) { var cd = $('.kcard[data-card="' + id + '"]'); if (cd && o.focus) cd.focus({ preventScroll: true }); }
    if (C.cur.lead === id) C.drawerRefresh();
  }
  C.acts.move = function (el) { moveTo(el.dataset.id, el.dataset.to, { focus: false }); };
  document.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('.kcard'); if (!c || e.target.closest('button') || !C.cur || C.cur.name !== 'pipeline') return;
    if (Date.now() - (C._dragEnd || 0) < 300) return; C._opener = c; location.hash = '#/pipeline/' + c.dataset.card;
  });
  document.addEventListener('keydown', function (e) {
    var c = e.target.closest && e.target.closest('.kcard'); if (!c || !C.cur || C.cur.name !== 'pipeline') return;
    var si = C.STAGES.map(function (s) { return s.id; }).indexOf(c.dataset.stage);
    if (e.key === 'Enter' && e.target === c) { C._opener = c; location.hash = '#/pipeline/' + c.dataset.card; e.preventDefault(); return; }
    if (e.target !== c) return;
    if (e.shiftKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { var to = C.STAGES[si + (e.key === 'ArrowRight' ? 1 : -1)]; if (to) moveTo(c.dataset.card, to.id, { focus: true }); e.preventDefault(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { var n = e.key === 'ArrowDown' ? c.nextElementSibling : c.previousElementSibling; if (n && n.classList.contains('kcard')) n.focus(); e.preventDefault(); }
    if (!e.shiftKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      for (var k = si + (e.key === 'ArrowRight' ? 1 : -1); k >= 0 && k < C.STAGES.length; k += (e.key === 'ArrowRight' ? 1 : -1)) { var t = $('.kcol[data-stage="' + C.STAGES[k].id + '"] .kcard'); if (t) { t.focus(); break; } }
      e.preventDefault();
    }
  });
  // pointer-driven drag with a floating ghost; drop is animated with a FLIP
  var drag = null, raf = 0;
  document.addEventListener('pointerdown', function (e) {
    if (!C.cur || C.cur.name !== 'pipeline' || e.button !== 0) return;
    var card = e.target.closest('.kcard'); if (!card || e.target.closest('button,a')) return;
    if (e.pointerType === 'touch' && !e.target.closest('.kgrip')) return; // touch drags start from the grip so the board can still scroll
    drag = { id: card.dataset.card, card: card, sx: e.clientX, sy: e.clientY, on: false, x: e.clientX, y: e.clientY };
  });
  function dragBegin() {
    var r = drag.card.getBoundingClientRect(), g = drag.card.cloneNode(true);
    g.className = 'kcard ghost'; g.removeAttribute('tabindex'); g.removeAttribute('data-card'); g.style.cssText = 'position:fixed;left:0;top:0;width:' + r.width + 'px;z-index:400;pointer-events:none';
    document.body.appendChild(g); drag.g = g; drag.ox = drag.sx - r.left; drag.oy = drag.sy - r.top; drag.r = r; drag.on = true;
    drag.card.classList.add('lifted'); document.body.classList.add('dragging'); dragPos();
    (function loop() { if (!drag || !drag.on) return; var b = $('#board'), br = b.getBoundingClientRect(); if (drag.x > br.right - 70) b.scrollLeft += 14; else if (drag.x < br.left + 70) b.scrollLeft -= 14; overCol(); raf = requestAnimationFrame(loop); })();
  }
  function dragPos() { drag.g.style.transform = 'translate(' + (drag.x - drag.ox) + 'px,' + (drag.y - drag.oy) + 'px) rotate(1.4deg) scale(1.02)'; }
  function overCol() {
    var tgt = null; $$('.kcol').forEach(function (c) { var r = c.getBoundingClientRect(), on = drag.x >= r.left && drag.x <= r.right && drag.y >= r.top - 40 && drag.y <= r.bottom; c.classList.toggle('over', on); if (on) tgt = c; }); drag.col = tgt;
  }
  document.addEventListener('pointermove', function (e) {
    if (!drag) return; drag.x = e.clientX; drag.y = e.clientY;
    if (!drag.on) { if (Math.hypot(drag.x - drag.sx, drag.y - drag.sy) < 6) return; dragBegin(); }
    dragPos(); overCol();
  });
  function dragEnd(cancel) {
    if (!drag) return; var d = drag; drag = null; cancelAnimationFrame(raf);
    if (!d.on) return;
    C._dragEnd = Date.now(); document.body.classList.remove('dragging'); $$('.kcol.over').forEach(function (c) { c.classList.remove('over'); });
    var gr = d.g.getBoundingClientRect(), to = !cancel && d.col && d.col.dataset.stage;
    if (to && to !== d.card.dataset.stage) { d.g.remove(); moveTo(d.id, to, { ghostRect: gr, focus: false }); return; }
    d.card.classList.remove('lifted');
    if (C.motion()) { var o = d.r; d.g.style.transition = 'transform .3s cubic-bezier(.2,.8,.2,1),opacity .3s'; d.g.style.transform = 'translate(' + o.left + 'px,' + o.top + 'px)'; setTimeout(function () { d.g.remove(); }, 300); } else d.g.remove();
  }
  document.addEventListener('pointerup', function (e) { if (drag && drag.on) { drag.x = e.clientX; drag.y = e.clientY; overCol(); } dragEnd(false); });
  document.addEventListener('pointercancel', function () { dragEnd(true); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drag && drag.on) dragEnd(true); });
})();
