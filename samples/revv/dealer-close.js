/* Revv dealer app · the daily closing (one screen the owner reads at 8 pm, shaped to forward on WhatsApp) and the team view
   (each salesperson's leads, rides and sales). Reads leads, deals, appraisals and the money view; writes nothing. */
(function () {
  'use strict';
  var R = window.Revv, BO = window.BO, L = window.LEDGER, esc = BO.esc, ic = BO.ic, $ = BO.$, DAY = 864e5, HOUR = 36e5;
  function sod(t) { var x = new Date(t); x.setHours(0, 0, 0, 0); return x.getTime(); }
  function mine(dl) { return R.leads().filter(function (x) { return x.dealer === dl; }); }
  function slotT(x) { return x.slot ? R.slotDate(x.slot).getTime() : 0; }
  function owner(x) { return window.REVV_TEAM.ownerOf(x); }

  function numbers(dl, day) {
    var a = day, b = a + DAY, m = mine(dl), now = Date.now(), deals = window.DEALS ? window.DEALS.forDealer(dl) : [];
    var enq = m.filter(function (x) { return x.at >= a && x.at < b; }), rides = m.filter(function (x) { var t = slotT(x); return t >= a && t < b; }), sold = m.filter(function (x) { return x.soldAt >= a && x.soldAt < b; });
    var tokens = deals.filter(function (d) { var s = d.steps[0]; return s.done && s.at >= a && s.at < b; }), rcs = deals.filter(function (d) { var s = d.steps[d.steps.length - 1]; return s.done && !s.skip && s.at >= a && s.at < b; });
    var unret = m.filter(function (x) { return x.stage === 'New' && !x.contacted && !x.lost && now - x.at > 2 * HOUR; }), t = L.totals(dl), apps = window.APPRAISE ? window.APPRAISE.queue(dl).filter(function (x) { return x.status === 'new' || x.status === 'inspecting'; }) : [];
    var tomorrow = m.filter(function (x) { var tt = slotT(x); return x.stage === 'Test ride' && tt >= b && tt < b + DAY; }).sort(function (p, q) { return slotT(p) - slotT(q); });
    return { enq: enq, rides: rides, sold: sold, tokens: tokens, rcs: rcs, unret: unret, old: t.old, t: t, apps: apps, tomorrow: tomorrow, late: deals.filter(function (d) { return window.DEALS.progress(d).late; }) };
  }
  function text(dl, n) {
    var d = R.dealer(dl), day = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }), lines = [];
    lines.push('*' + d.name + ' · closing · ' + day + '*', '');
    lines.push('Enquiries: ' + n.enq.length, 'Test ' + (/car/i.test(d.focus) && !/bike/i.test(d.focus) ? 'drives' : 'rides') + ': ' + n.rides.length, 'Tokens: ' + n.tokens.length, 'Sold: ' + n.sold.length + (n.sold.length ? ' (' + R.inr(n.sold.reduce(function (s, x) { return s + (x.price || 0); }, 0)) + ')' : ''), 'RCs delivered: ' + n.rcs.length, '');
    lines.push('Calls nobody returned: ' + n.unret.length + (n.unret.length ? ' (' + n.unret.slice(0, 4).map(function (x) { return x.name.split(' ')[0]; }).join(', ') + ')' : ''));
    lines.push('Cars past 60 days: ' + n.old.length + (n.old.length ? ' (' + n.old.slice(0, 3).map(function (g) { return g.title.replace(/^\d{4} /, '') + ' day ' + g.days; }).join(', ') + ')' : ''));
    lines.push('Money in stock: ' + R.inr(n.t.locked) + ', holding ' + R.inrFull(n.t.perDay) + ' a day');
    if (n.apps.length) lines.push('Exchange appraisals waiting: ' + n.apps.length);
    if (n.late.length) lines.push('Papers running late: ' + n.late.length);
    lines.push('', 'Tomorrow: ' + (n.tomorrow.length ? n.tomorrow.map(function (x) { return R.slotDate(x.slot).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' ' + x.name.split(' ')[0]; }).join(', ') : 'no rides booked yet'));
    return lines.join('\n');
  }
  function vClosing(el) {
    var dl = L.me(), d = R.dealer(dl), n = numbers(dl, sod(Date.now())), msg = text(dl, n);
    var tile = function (l, v, s, href, alert) { return '<a class="tile' + (alert ? ' alert' : '') + '" href="' + href + '"><span class="l">' + l + '</span><span class="v">' + v + '</span><span class="d flat">' + s + '</span>' + ic('arrow', 'go') + '</a>'; };
    el.innerHTML = '<div class="ph"><div><h1>Closing</h1><p>' + esc(d.name) + ' · ' + new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) + ' · one screen for the end of the day</p></div><div class="acts"><button type="button" class="btn pri" data-copyclose>' + ic('chat') + 'Copy for WhatsApp</button></div></div>' +
      '<div class="tiles six">' + tile('Enquiries', n.enq.length, 'today', '#/pipeline?stage=New') + tile('Test rides', n.rides.length, 'today', '#/rides') + tile('Tokens', n.tokens.length, n.sold.length + ' sold', '#/deals') +
      tile('Calls not returned', n.unret.length, 'over 2 h', '#/focus', n.unret.length) + tile('Past 60 days', n.old.length, R.inr(n.old.reduce(function (s, g) { return s + g.bought + g.refurb; }, 0)) + ' stuck', '#/money?f=old', n.old.length) + tile('Papers late', n.late.length, n.apps.length + ' appraisals waiting', '#/deals', n.late.length) + '</div>' +
      '<div class="cl-g"><section class="panel" aria-labelledby="cl-w"><div class="panel-h"><h2 id="cl-w">What gets sent</h2><span class="n">plain text</span></div><div class="cl-msg"><pre id="cl-txt">' + esc(msg) + '</pre></div></section>' +
      '<section class="panel" aria-labelledby="cl-t"><div class="panel-h"><h2 id="cl-t">Team today</h2><span class="r"><a class="btn sm ghost" href="#/team">Team view</a></span></div>' + teamRows(dl, sod(Date.now()), true) + '</section></div>';
    el.onclick = function (e) { if (!e.target.closest('[data-copyclose]')) return; var t = $('#cl-txt').textContent; try { navigator.clipboard.writeText(t).then(function () { BO.toast('Closing copied as plain text. Paste it into WhatsApp.'); }, function () { BO.toast('Copy blocked by the browser. Select the text and copy it.'); }); } catch (x) { BO.toast('Select the text and copy it.'); } };
  }
  function stats(dl, from) {
    var m = mine(dl), deals = window.DEALS ? window.DEALS.forDealer(dl) : [];
    return window.REVV_TEAM(dl).filter(function (p) { return p.role !== 'Papers and RTO'; }).map(function (p) {
      var ls = m.filter(function (x) { return owner(x) === p.name && x.at >= from; }), sold = m.filter(function (x) { return owner(x) === p.name && x.stage === 'Sold' && x.soldAt >= from; });
      var rides = ls.filter(function (x) { return x.slot; }).length, called = ls.filter(function (x) { return x.contacted || x.stage !== 'New'; }).length;
      return { p: p, leads: ls.length, rides: rides, sold: sold.length, rev: sold.reduce(function (s, x) { return s + (x.price || 0); }, 0), callRate: ls.length ? called / ls.length : 1, open: ls.filter(function (x) { return x.stage === 'New' && !x.contacted && !x.lost; }).length };
    });
  }
  function teamRows(dl, from, compact) {
    var st = stats(dl, from), mx = Math.max.apply(null, st.map(function (s) { return s.leads; }).concat(1));
    return '<ul class="team">' + st.map(function (s) { return '<li><span class="av">' + esc(BO.initials(s.p.name)) + '</span><span class="tm-n"><b>' + esc(s.p.name) + '</b><small>' + esc(s.p.role) + '</small></span><span class="tm-b"><i style="width:' + Math.round(s.leads / mx * 100) + '%"></i></span><span class="tm-s num"><b>' + s.leads + '</b> leads · ' + s.rides + ' rides · <b>' + s.sold + '</b> sold' + (compact ? '' : ' · ' + R.inr(s.rev)) + (s.open ? ' · <span class="bad">' + s.open + ' to call</span>' : '') + '</span></li>'; }).join('') + '</ul>';
  }
  var tv = { range: 30 };
  function vTeam(el) {
    var dl = L.me(), from = sod(Date.now()) - (tv.range - 1) * DAY, st = stats(dl, from), papers = window.REVV_TEAM(dl).filter(function (p) { return p.role === 'Papers and RTO'; })[0], deals = window.DEALS ? window.DEALS.forDealer(dl) : [];
    var openSteps = deals.reduce(function (n, d) { return n + d.steps.filter(function (s) { return !s.done && !s.skip; }).length; }, 0);
    el.innerHTML = '<div class="ph"><div><h1>Team</h1><p>' + st.length + ' salespeople · leads are shared round-robin · last ' + tv.range + ' days</p></div><div class="seg" role="group" aria-label="Range">' + [[7, '7 days'], [30, '30 days']].map(function (r) { return '<button type="button" data-tr="' + r[0] + '" aria-pressed="' + (tv.range === r[0]) + '">' + r[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="tbl-w cards"><table class="tbl"><thead><tr><th scope="col">Salesperson</th><th scope="col" class="r">Leads</th><th scope="col" class="r">Called back</th><th scope="col" class="r">Rides</th><th scope="col" class="r">Sold</th><th scope="col" class="r">Revenue</th><th scope="col" class="r">Lead → sale</th></tr></thead><tbody>' +
      st.map(function (s) { return '<tr><td class="vcell"><div class="vc"><span class="av">' + esc(BO.initials(s.p.name)) + '</span><span><b>' + esc(s.p.name) + '</b><span>' + esc(s.p.role) + (s.open ? ' · ' + s.open + ' waiting for a call' : '') + '</span></span></div></td><td class="r num" data-l="Leads">' + s.leads + '</td><td class="r num" data-l="Called back">' + Math.round(s.callRate * 100) + '%</td><td class="r num" data-l="Rides">' + s.rides + '</td><td class="r num" data-l="Sold">' + s.sold + '</td><td class="r num" data-l="Revenue">' + R.inr(s.rev) + '</td><td class="r num" data-l="Lead → sale">' + (s.leads ? Math.round(s.sold / s.leads * 100) + '%' : '—') + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      (papers ? '<section class="panel" style="margin-top:16px" aria-labelledby="tp-h"><div class="panel-h"><h2 id="tp-h">Papers and RTO</h2><span class="n">' + esc(papers.name) + '</span><span class="r"><a class="btn sm ghost" href="#/deals">Deals</a></span></div><p class="cl-p">' + openSteps + ' paper steps open across ' + deals.filter(function (d) { return !window.DEALS.progress(d).complete; }).length + ' deals · ' + deals.filter(function (d) { return window.DEALS.progress(d).late; }).length + ' running late.</p></section>' : '');
    el.onclick = function (e) { var b = e.target.closest('[data-tr]'); if (b) { tv.range = +b.dataset.tr; BO.render(true); } };
  }

  (window.DEALER_EXT = window.DEALER_EXT || []).push(function (cfg) {
    cfg.views.closing = vClosing; cfg.views.team = vTeam;
    cfg.nav[0].items.push({ id: 'closing', label: 'Closing', icon: 'clock' });
    cfg.nav.splice(cfg.nav.length - 1, 0, { group: 'People', items: [{ id: 'team', label: 'Team', icon: 'users' }] });
    (cfg.actions = cfg.actions || []).push({ label: 'Daily closing', icon: 'clock', run: function () { BO.go('closing'); } });
  });
})();
