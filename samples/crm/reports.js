/* Lumen CRM Pro — reports: forecast, deal funnel, source ROI, team leaderboard, pipeline by stage,
   activity. A dashboard whose widgets can be dragged, reordered with buttons, resized and hidden. */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$, V = C.views, page = C.page;
  var P = function () { return C.P(); };
  var ACC = '#4F46E5', INK = '#4338CA', OK = '#1F9D57', SOFT = '#B9B5F7';
  var MON = 864e5 * 30.4;
  function sales() { return P().deals.filter(function (d) { return d.pipe === 'sales'; }); }
  function sum(a, f) { return a.reduce(function (s, x) { return s + f(x); }, 0); }
  function isWon(d) { return C.pstage(d.pipe, d.stage).won; }

  var W = {
    forecast: { title: 'Revenue forecast', sub: 'Sales pipeline by expected close month · target ₹60 L a month', render: function () {
      var m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0); var months = [], i;
      for (i = -1; i < 4; i++) { var a = new Date(m0); a.setMonth(a.getMonth() + i); var b = new Date(a); b.setMonth(b.getMonth() + 1); months.push({ a: a.getTime(), b: b.getTime(), label: a.toLocaleDateString('en-GB', { month: 'short' }) }); }
      months.forEach(function (m) {
        var D = sales().filter(function (d) { var t = isWon(d) ? (d.wonAt || d.close) : d.close; return t >= m.a && t < m.b; });
        m.won = sum(D.filter(isWon), C.dealVal);
        m.commit = sum(D.filter(function (d) { return d.stage === 'negotiation'; }), C.dealVal);
        m.best = sum(D.filter(function (d) { return d.stage === 'proposal' || d.stage === 'design'; }), function (d) { return C.dealVal(d) * C.dealProb(d) / 100; });
      });
      var cur = months[1];
      C.chartSpecs.forecast = function (w) { return stack(w, months, 6000000); };
      return '<div class="fc-k"><div><span>This month, won</span><b>' + C.rs(cur.won) + '</b></div><div><span>Commit</span><b>' + C.rs(cur.commit) + '</b></div><div><span>Best case (weighted)</span><b>' + C.rs(cur.best) + '</b></div><div><span>Projected</span><b>' + C.rs(cur.won + cur.commit + cur.best) + '</b><small>' + Math.round((cur.won + cur.commit + cur.best) / 6000000 * 100) + '% of target</small></div></div><div class="chart" data-chart="forecast"></div><div class="lg"><span><i style="background:' + OK + '"></i>Won</span><span><i style="background:' + INK + '"></i>Commit (negotiation)</span><span><i style="background:' + SOFT + '"></i>Best case, weighted</span><span><i class="dashed"></i>Target</span></div>';
    } },
    funnel: { title: 'Deal funnel', sub: 'Sales deals that reached each stage', render: function () {
      var st = C.PIPES.sales.stages.filter(function (s) { return !s.lost; }), ids = st.map(function (s) { return s.id; });
      var reach = function (d) { var k = ids.indexOf(d.stage); if (k > -1) return k; return d.fields.visitOutcome ? 3 : 1; };
      var items = st.map(function (s, k) { return { label: s.label.replace('Negotiation', 'Negot.'), value: sales().filter(function (d) { return reach(d) >= k; }).length, color: s.won ? OK : ACC }; });
      C.chartSpecs.dfunnel = function (w) { return C.chart.funnel({ w: w, h: 230, items: items, label: 'Deal funnel: ' + items.map(function (x) { return x.label + ' ' + x.value; }).join(', ') }); };
      var won = items[items.length - 1].value;
      return '<div class="chart" data-chart="dfunnel"></div><p class="muted sm">' + Math.round(won / Math.max(1, items[0].value) * 100) + '% of qualified deals are won · biggest drop: ' + (function () { var b = 0, bi = 0; for (var i = 0; i < items.length - 1; i++) { var dr = items[i].value - items[i + 1].value; if (dr > b) { b = dr; bi = i; } } return items[bi].label + ' → ' + items[bi + 1].label; })() + '</p>';
    } },
    roi: { title: 'Source ROI', sub: 'Last 90 days · spend from ad accounts, revenue from won leads', render: function () {
      var sp = P().spend, L = C.S().leads, rows = Object.keys(C.SOURCES).map(function (k) {
        var won = L.filter(function (l) { return l.source === k && l.status === 'won'; }), rev = sum(won, function (l) { return l.budget * 1e5; }), s = sp[k] || 0;
        return { k: k, n: L.filter(function (l) { return l.source === k; }).length, won: won.length, rev: rev, spend: s, roi: s ? rev / s : null, cpl: s ? s / Math.max(1, L.filter(function (l) { return l.source === k; }).length) : 0 };
      }).sort(function (a, b) { return (b.roi || 99) - (a.roi || 99); });
      var max = Math.max.apply(null, rows.map(function (r) { return r.roi || 0; }).concat([1]));
      return '<div class="tablewrap"><table class="tbl dense roi"><thead><tr><th scope="col">Source</th><th scope="col" class="num">Spend</th><th scope="col" class="num">Won</th><th scope="col" class="num">Revenue</th><th scope="col">Return</th></tr></thead><tbody>' + rows.map(function (r) {
        return '<tr><td>' + C.srcIco(r.k, 13) + ' ' + C.SOURCES[r.k].label + '</td><td class="num muted">' + (r.spend ? C.rs(r.spend) : '—') + '</td><td class="num">' + r.won + '<span class="muted sm"> / ' + r.n + '</span></td><td class="num">' + C.rs(r.rev) + '</td><td><span class="roic"><span class="roib"><i style="width:' + (r.roi == null ? 100 : Math.max(3, r.roi / max * 100)) + '%;background:' + (r.roi == null ? 'var(--line-3)' : r.roi >= 10 ? OK : ACC) + '"></i></span><b class="nw">' + (r.roi == null ? 'No spend' : r.roi.toFixed(1) + '×') + '</b></span></td></tr>';
      }).join('') + '</tbody></table></div>';
    } },
    board: { title: 'Team leaderboard', sub: 'This quarter · won value, deals, speed', render: function () {
      var q0 = Date.now() - 90 * 864e5, L = C.S().leads;
      var rows = C.TEAM.map(function (nm) {
        var dw = sales().filter(function (d) { return d.owner === nm && isWon(d) && (d.wonAt || 0) >= q0; }), lw = L.filter(function (l) { return l.owner === nm && l.status === 'won' && !C.dealOfLead(l.id); });
        var rs = L.filter(function (l) { return l.owner === nm && l.resp != null; }), med = rs.map(function (l) { return l.resp; }).sort(function (a, b) { return a - b; })[Math.floor(rs.length / 2)];
        var acts = P().acts.filter(function (a) { return a.by === nm && Date.now() - a.t < 7 * 864e5; }).length;
        return { nm: nm, v: sum(dw, C.dealVal) + sum(lw, function (l) { return l.budget * 1e5; }), n: dw.length + lw.length, med: med, acts: acts, open: sum(P().deals.filter(function (d) { return d.owner === nm && C.dealOpen(d); }), C.dealVal) };
      }).sort(function (a, b) { return b.v - a.v; });
      var max = Math.max.apply(null, rows.map(function (r) { return r.v; }).concat([1]));
      return '<ol class="lb">' + rows.map(function (r, i) { return '<li><span class="lb-r">' + (i + 1) + '</span>' + C.avatar(r.nm, 28) + '<div class="grow"><div class="lb-t"><b>' + esc(r.nm) + '</b><b>' + C.rs(r.v) + '</b></div><span class="lb-bar"><i style="width:' + Math.max(2, r.v / max * 100) + '%"></i></span><div class="muted sm">' + r.n + ' won · median first reply ' + C.fmtMin(r.med) + ' · ' + C.rs(r.open) + ' open</div></div></li>'; }).join('') + '</ol>';
    } },
    stages: { title: 'Open pipeline by stage', sub: 'Sales · value and weighted value', render: function () {
      var items = C.PIPES.sales.stages.filter(function (s) { return !s.won && !s.lost; }).map(function (s) { var D = sales().filter(function (d) { return d.stage === s.id; }), v = sum(D, C.dealVal); return { label: s.label + ' (' + D.length + ')', value: v, color: s.color, text: C.rs(v) }; });
      C.chartSpecs.pstage = function (w) { return C.chart.hbars({ w: w, items: items, rowH: 36, vw: 70, name: 'Open value', label: 'Open pipeline by stage: ' + items.map(function (x) { return x.label + ' ' + x.text; }).join(', ') }); };
      var tot = sum(items, function (x) { return x.value; }), wt = sum(sales().filter(C.dealOpen), function (d) { return C.dealVal(d) * C.dealProb(d) / 100; });
      return '<div class="chart" data-chart="pstage"></div><p class="muted sm">' + C.rs(tot) + ' open · ' + C.rs(wt) + ' weighted</p>';
    } },
    activity: { title: 'Team activity', sub: 'Last 14 days · calls, WhatsApp, email and site visits logged', render: function () {
      var d0 = C.dayStart() - 13 * 864e5, days = [], i, A = P().acts.slice();
      C.S().leads.forEach(function (l) { l.tl.forEach(function (e) { A.push({ t: e.t, type: e.type === 'msg' ? 'wa' : e.type === 'quote' ? 'email' : e.type }); }); });
      for (i = 0; i < 14; i++) { var a = d0 + i * 864e5, b = a + 864e5, X = A.filter(function (x) { return x.t >= a && x.t < b; }); days.push({ label: new Date(a).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), call: X.filter(function (x) { return x.type === 'call'; }).length, wa: X.filter(function (x) { return x.type === 'wa'; }).length, email: X.filter(function (x) { return x.type === 'email'; }).length, visit: X.filter(function (x) { return x.type === 'visit'; }).length }); }
      C.chartSpecs.acty = function (w) { return grouped(w, days); };
      var tot = function (k) { return sum(days, function (d) { return d[k]; }); };
      return '<div class="chart" data-chart="acty"></div><div class="lg"><span><i style="background:' + INK + '"></i>Calls ' + tot('call') + '</span><span><i style="background:#1F9D57"></i>WhatsApp ' + tot('wa') + '</span><span><i style="background:' + SOFT + '"></i>Email ' + tot('email') + '</span><span><i style="background:#D9731F"></i>Site visits ' + tot('visit') + '</span></div>';
    } }
  };

  function stack(w, M, target) {
    var h = 230, L = 46, R = 8, T = 12, B = 26, iw = w - L - R, ih = h - T - B, n = M.length, bw = iw / n;
    var max = Math.max.apply(null, M.map(function (m) { return m.won + m.commit + m.best; }).concat([target * 1.15]));
    var Y = function (v) { return T + ih - ih * v / max; }, g = '', i;
    for (i = 0; i <= 4; i++) { var v = max * i / 4, y = Y(v); g += '<line class="gl" x1="' + L + '" x2="' + (w - R) + '" y1="' + y + '" y2="' + y + '"/><text class="ax" x="' + (L - 8) + '" y="' + (y + 3.5) + '" text-anchor="end">' + (v >= 1e5 ? Math.round(v / 1e5) + 'L' : 0) + '</text>'; }
    M.forEach(function (m, i) {
      var x = L + i * bw + bw * .2, bwid = bw * .6, acc = 0;
      [['won', OK, 'Won'], ['commit', INK, 'Commit'], ['best', SOFT, 'Best case']].forEach(function (k) {
        var v = m[k[0]]; if (!v) return; var y1 = Y(acc + v), y0 = Y(acc);
        g += '<rect class="bar" data-tip="' + esc(C.tipRow(m.label, [{ c: OK, l: 'Won', v: C.rs(m.won) }, { c: INK, l: 'Commit', v: C.rs(m.commit) }, { c: SOFT, l: 'Best case', v: C.rs(m.best) }])) + '" x="' + x.toFixed(1) + '" y="' + y1.toFixed(1) + '" width="' + bwid.toFixed(1) + '" height="' + Math.max(1, y0 - y1).toFixed(1) + '" fill="' + k[1] + '"/>';
        acc += v;
      });
      g += '<text class="ax" x="' + (L + i * bw + bw / 2).toFixed(1) + '" y="' + (h - 8) + '" text-anchor="middle">' + m.label + (i === 1 ? ' ·now' : '') + '</text>';
    });
    g += '<line x1="' + L + '" x2="' + (w - R) + '" y1="' + Y(target) + '" y2="' + Y(target) + '" stroke="var(--ink-2)" stroke-dasharray="4 4" stroke-width="1"/>';
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="Revenue forecast by month">' + g + '</svg>';
  }
  function grouped(w, D) {
    var h = 200, L = 30, R = 6, T = 10, B = 24, iw = w - L - R, ih = h - T - B, n = D.length, bw = iw / n, K = [['call', INK], ['wa', '#1F9D57'], ['email', SOFT], ['visit', '#D9731F']];
    var max = Math.max.apply(null, D.map(function (d) { return d.call + d.wa + d.email + d.visit; }).concat([4])), g = '', i;
    for (i = 0; i <= 2; i++) { var y = T + ih - ih * i / 2; g += '<line class="gl" x1="' + L + '" x2="' + (w - R) + '" y1="' + y + '" y2="' + y + '"/><text class="ax" x="' + (L - 6) + '" y="' + (y + 3.5) + '" text-anchor="end">' + Math.round(max * i / 2) + '</text>'; }
    var step = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / 52))));
    D.forEach(function (d, i) {
      var x = L + i * bw + bw * .18, ww = bw * .64, acc = 0;
      K.forEach(function (k) { var v = d[k[0]]; if (!v) return; var hh = ih * v / max; g += '<rect class="bar" data-tip="' + esc(C.tipRow(d.label, [{ c: INK, l: 'Calls', v: String(d.call) }, { c: '#1F9D57', l: 'WhatsApp', v: String(d.wa) }, { c: SOFT, l: 'Email', v: String(d.email) }, { c: '#D9731F', l: 'Site visits', v: String(d.visit) }])) + '" x="' + x.toFixed(1) + '" y="' + (T + ih - acc - hh).toFixed(1) + '" width="' + ww.toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="' + k[1] + '"/>'; acc += hh; });
      if (i % step === 0) g += '<text class="ax" x="' + (L + i * bw + bw / 2).toFixed(1) + '" y="' + (h - 7) + '" text-anchor="middle">' + d.label + '</text>';
    });
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="Team activity per day">' + g + '</svg>';
  }

  // ---- dashboard layout ---------------------------------------------------------
  function edit() { return !!C.ui.repEdit; }
  function widget(x, i, n) {
    var w = W[x.id];
    return '<section class="card wdg' + (x.w === 2 ? ' wide' : '') + '" data-w="' + x.id + '" aria-labelledby="wh-' + x.id + '"><div class="card-h"><div><h2 id="wh-' + x.id + '">' + w.title + '</h2><p class="sub">' + w.sub + '</p></div>' +
      (edit() ? '<div class="wdg-ctl"><span class="wgrip" title="Drag to move" aria-hidden="true">' + C.ic('grip', 15) + '</span><button type="button" class="ibtn" data-act="w-mv" data-d="-1" data-id="' + x.id + '" aria-label="Move ' + w.title + ' earlier"' + (i ? '' : ' disabled') + '>' + C.ic('chev-l', 14) + '</button><button type="button" class="ibtn" data-act="w-mv" data-d="1" data-id="' + x.id + '" aria-label="Move ' + w.title + ' later"' + (i < n - 1 ? '' : ' disabled') + '>' + C.ic('chev-r', 14) + '</button><button type="button" class="ibtn" data-act="w-size" data-id="' + x.id + '" aria-label="' + (x.w === 2 ? 'Make ' + w.title + ' half width' : 'Make ' + w.title + ' full width') + '">' + C.ic('widen', 14) + '</button><button type="button" class="ibtn" data-act="w-hide" data-id="' + x.id + '" aria-label="Hide ' + w.title + '">' + C.ic('x', 14) + '</button></div>' : '') + '</div>' + w.render() + '</section>';
  }
  V.reports = {
    title: function () { return 'Reports'; },
    render: function () {
      var L = P().dash, hidden = Object.keys(W).filter(function (k) { return !L.some(function (x) { return x.id === k; }); });
      return page('Reports', 'Forecast, funnel, ROI and the team · ' + (edit() ? 'drag widgets by the handle, or use the arrow buttons' : 'arrange this dashboard the way you read it'), (edit() ? '<button type="button" class="btn ghost" data-act="w-reset">Reset layout</button>' : '') + '<button type="button" class="btn ' + (edit() ? 'pri' : '') + '" data-act="w-edit" aria-pressed="' + edit() + '">' + C.ic(edit() ? 'check' : 'move', 14) + (edit() ? 'Done' : 'Edit layout') + '</button>') +
        (edit() && hidden.length ? '<div class="w-tray" role="group" aria-label="Hidden widgets"><span class="muted sm">Hidden:</span>' + hidden.map(function (k) { return '<button type="button" class="chip" data-act="w-show" data-id="' + k + '">' + C.ic('plus', 12) + W[k].title + '</button>'; }).join('') + '</div>' : '') +
        '<div class="wgrid' + (edit() ? ' editing' : '') + '" id="wgrid">' + L.map(function (x, i) { return widget(x, i, L.length); }).join('') + '</div><p class="sr" id="wlive" role="status" aria-live="polite"></p>';
    }
  };
  function relayout(fn, focusSel) {
    var before = {}; $$('.wdg').forEach(function (el) { before[el.dataset.w] = el.getBoundingClientRect(); });
    fn(); C.save(); C.rerender();
    if (C.motion()) $$('.wdg').forEach(function (el) { var b = before[el.dataset.w]; if (!b) { gsap.from(el, { opacity: 0, scale: .98, duration: .3, clearProps: 'all' }); return; } var a = el.getBoundingClientRect(); if (Math.abs(b.left - a.left) + Math.abs(b.top - a.top) < 2) return; gsap.fromTo(el, { x: b.left - a.left, y: b.top - a.top }, { x: 0, y: 0, duration: .5, ease: 'expo.out', clearProps: 'transform' }); });
    if (focusSel) { var f = $(focusSel); if (f) f.focus({ preventScroll: true }); }
  }
  C.acts['w-edit'] = function () { C.ui.repEdit = !edit(); C.rerender(true); var b = $('[data-act="w-edit"]'); if (b) b.focus(); };
  C.acts['w-reset'] = function () { relayout(function () { P().dash = [{ id: 'forecast', w: 2 }, { id: 'funnel', w: 1 }, { id: 'roi', w: 1 }, { id: 'board', w: 1 }, { id: 'stages', w: 1 }, { id: 'activity', w: 2 }]; }); C.toast('Layout reset'); };
  C.acts['w-mv'] = function (el) {
    var L = P().dash, i = L.map(function (x) { return x.id; }).indexOf(el.dataset.id), j = i + +el.dataset.d; if (j < 0 || j >= L.length) return;
    relayout(function () { var t = L[i]; L[i] = L[j]; L[j] = t; }, '[data-act="w-mv"][data-id="' + el.dataset.id + '"][data-d="' + el.dataset.d + '"]');
    $('#wlive').textContent = W[el.dataset.id].title + ' moved to position ' + (j + 1);
  };
  C.acts['w-size'] = function (el) { relayout(function () { P().dash.forEach(function (x) { if (x.id === el.dataset.id) x.w = x.w === 2 ? 1 : 2; }); }, '[data-act="w-size"][data-id="' + el.dataset.id + '"]'); };
  C.acts['w-hide'] = function (el) { relayout(function () { P().dash = P().dash.filter(function (x) { return x.id !== el.dataset.id; }); }, '[data-act="w-edit"]'); C.toast(W[el.dataset.id].title + ' hidden', { icon: 'x' }); };
  C.acts['w-show'] = function (el) { relayout(function () { P().dash.push({ id: el.dataset.id, w: el.dataset.id === 'forecast' || el.dataset.id === 'activity' ? 2 : 1 }); }); };
  // drag widgets by the grip
  var dg = null;
  document.addEventListener('pointerdown', function (e) {
    if (!C.cur || C.cur.name !== 'reports' || !edit()) return; var h = e.target.closest('.wgrip'); if (!h) return;
    var el = h.closest('.wdg'), r = el.getBoundingClientRect(); e.preventDefault();
    var g = document.createElement('div'); g.className = 'wghost'; g.style.cssText = 'position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + Math.min(r.height, 220) + 'px;z-index:400;pointer-events:none';
    g.innerHTML = '<b>' + esc(W[el.dataset.w].title) + '</b>'; document.body.appendChild(g);
    dg = { id: el.dataset.w, el: el, g: g, ox: e.clientX - r.left, oy: e.clientY - r.top, to: null }; el.classList.add('lifted'); document.body.classList.add('dragging');
  });
  document.addEventListener('pointermove', function (e) {
    if (!dg) return; dg.g.style.left = (e.clientX - dg.ox) + 'px'; dg.g.style.top = (e.clientY - dg.oy) + 'px';
    var best = null, bd = 1e9; $$('.wdg').forEach(function (w) { var r = w.getBoundingClientRect(), d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)); if (d < bd) { bd = d; best = w; } });
    $$('.wdg.drop').forEach(function (w) { w.classList.remove('drop'); }); if (best && best !== dg.el) best.classList.add('drop'); dg.to = best && best !== dg.el ? best.dataset.w : null;
    var m = $('#view'), mr = m.getBoundingClientRect(); if (e.clientY > mr.bottom - 60) m.scrollTop += 12; else if (e.clientY < mr.top + 60) m.scrollTop -= 12;
  });
  document.addEventListener('pointerup', function () {
    if (!dg) return; var d = dg; dg = null; d.g.remove(); d.el.classList.remove('lifted'); document.body.classList.remove('dragging'); $$('.wdg.drop').forEach(function (w) { w.classList.remove('drop'); });
    if (!d.to) return; relayout(function () { var L = P().dash, a = L.map(function (x) { return x.id; }).indexOf(d.id), it = L.splice(a, 1)[0], b = L.map(function (x) { return x.id; }).indexOf(d.to); L.splice(b + (a <= b ? 1 : 0), 0, it); });
    $('#wlive').textContent = W[d.id].title + ' moved';
  });
})();
