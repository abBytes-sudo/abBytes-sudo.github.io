/* Lumen CRM — UTM link builder + integrations (simulated) + boot */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$, S = C.S;

  // ===== UTM builder =======================================================
  var PRESETS = [
    ['meta', 'Meta ads · lead form', ['facebook', 'paid_social', 'kitchen-leadform-ncr'], 'mega'],
    ['google', 'Google Ads · search', ['google', 'cpc', 'kitchen-search-ncr'], 'search'],
    ['wa', 'WhatsApp broadcast', ['whatsapp', 'referral', 'festive-offer-broadcast'], 'wa'],
    ['qr', 'Flyer QR code', ['flyer', 'qr', 'society-drive-sector-150'], 'form'],
    ['mail', 'Email newsletter', ['newsletter', 'email', 'monthly-inspiration'], 'mail']
  ];
  function U() { return C.ui.utm || (C.ui.utm = { base: 'https://www.lumenhomes.example/modular-kitchen', source: 'facebook', medium: 'paid_social', campaign: 'kitchen-leadform-ncr', term: '', content: '' }); }
  var clean = function (v) { return String(v || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, ''); };
  function buildUtm() {
    var u = U(), missing = [];
    ['source', 'medium', 'campaign'].forEach(function (k) { if (!clean(u[k])) missing.push('utm_' + k); });
    var url;
    try { url = new URL(u.base.trim()); if (!/^https?:$/.test(url.protocol)) throw 0; } catch (e) { return { err: 'Enter a full page address starting with https://' }; }
    if (missing.length) return { err: 'Still needed: ' + missing.join(', ') };
    var params = [];
    ['source', 'medium', 'campaign', 'term', 'content'].forEach(function (k) { var v = clean(u[k]); if (v) { url.searchParams.set('utm_' + k, v); params.push(['utm_' + k, v]); } });
    return { url: url.toString(), params: params, base: url.origin + url.pathname };
  }
  function checks(r) {
    var u = U(), items = [];
    items.push([!r.err || r.err.indexOf('https') < 0, 'Page address is a valid URL']);
    items.push([!!clean(u.source) && !!clean(u.medium) && !!clean(u.campaign), 'Source, medium and campaign are set']);
    var raw = [u.source, u.medium, u.campaign, u.term, u.content].join('');
    items.push([!/[^a-z0-9_-]/.test(raw), 'Lowercase letters, numbers, - and _ only (we tidy this for you)']);
    items.push([!r.url || r.url.length < 300, 'Short enough to share' + (r.url ? ' · ' + r.url.length + ' characters' : '')]);
    return '<ul class="checks">' + items.map(function (c) { return '<li class="' + (c[0] ? 'ok' : 'no') + '">' + C.ic(c[0] ? 'check' : 'x', 13) + c[1] + '</li>'; }).join('') + '</ul>';
  }
  function utmOut() {
    var r = buildUtm();
    if (r.err) return '<p class="utm-err" role="alert">' + C.ic('x', 13) + esc(r.err) + '</p><div class="utm-url empty-url">Your tagged link will appear here</div>' + checks(r);
    return '<div class="utm-url" id="utm-res" aria-label="Tagged link"><span class="ub">' + esc(r.base) + '</span><span class="uq">?</span>' + r.params.map(function (p, i) { return (i ? '<span class="uq">&amp;</span>' : '') + '<span class="up"><b>' + p[0] + '</b>=<i>' + esc(p[1]) + '</i></span>'; }).join('') + '</div>' + checks(r);
  }
  function utmBtns() { var r = buildUtm(); return '<button type="button" class="btn pri" data-act="utm-copy"' + (r.err ? ' disabled' : '') + '>' + C.ic('copy', 14) + 'Copy link</button><button type="button" class="btn" data-act="utm-save"' + (r.err ? ' disabled' : '') + '>Save to library</button>'; }
  function utmSaved() {
    var a = S().utmSaved;
    return a.length ? '<ul class="saved">' + a.map(function (x, i) { return '<li><div class="grow"><b>' + esc(x.name) + '</b><div class="muted sm brk">' + esc(x.url) + '</div></div><button type="button" class="ibtn" data-act="utm-copy-saved" data-i="' + i + '" aria-label="Copy link ' + esc(x.name) + '">' + C.ic('copy', 14) + '</button><button type="button" class="ibtn" data-act="utm-del" data-i="' + i + '" aria-label="Delete link ' + esc(x.name) + '">' + C.ic('trash', 14) + '</button></li>'; }).join('') + '</ul>' : '<p class="empty">No saved links yet.</p>';
  }
  C.views.utm = {
    title: function () { return 'UTM builder'; },
    render: function () {
      var u = U(), L = S().leads, groups = {};
      L.forEach(function (l) { var c = l.utm.campaign; if (c && c !== '(organic)') { var g = groups[c] || (groups[c] = { c: c, s: l.utm.source, m: l.utm.medium, n: 0, w: 0, v: 0 }); g.n++; g.v += l.budget; if (l.status === 'won') g.w++; } });
      var rows = Object.keys(groups).map(function (k) { return groups[k]; }).sort(function (a, b) { return b.n - a.n; }), mx = rows.length ? rows[0].n : 1;
      var f = function (id, k, label, ph, hint, req) { return '<div class="field"><label for="' + id + '">' + label + (req ? ' <span class="req">required</span>' : '') + '</label><input id="' + id + '" data-in="utm" data-k="' + k + '" value="' + esc(u[k]) + '" placeholder="' + ph + '" autocomplete="off" spellcheck="false"' + (hint ? ' aria-describedby="' + id + '-h"' : '') + '>' + (hint ? '<span class="hint" id="' + id + '-h">' + hint + '</span>' : '') + '</div>'; };
      var cur = PRESETS.filter(function (p) { return p[2][0] === u.source && p[2][1] === u.medium && p[2][2] === u.campaign; })[0];
      return C.page('UTM builder', 'Tag every campaign link so each lead arrives in the CRM with its source, medium and campaign') +
        '<div class="utmgrid"><section class="card"><div class="card-h"><div><h2>Build a link</h2><p class="sub">Start from a preset or fill in your own values</p></div></div>' +
        '<div class="chips tight" role="group" aria-label="Presets">' + PRESETS.map(function (p) { return '<button type="button" class="chip" data-act="utm-preset" data-v="' + p[0] + '" aria-pressed="' + (cur && cur[0] === p[0]) + '">' + C.ic(p[3], 13) + p[1] + '</button>'; }).join('') + '</div>' +
        '<div class="field"><label for="u-base">Page address</label><input id="u-base" data-in="utm" data-k="base" value="' + esc(u.base) + '" inputmode="url" autocomplete="off" spellcheck="false"></div>' +
        '<div class="row2">' + f('u-src', 'source', 'Source', 'google, facebook, newsletter', '', true) + f('u-med', 'medium', 'Medium', 'cpc, paid_social, email', '', true) + '</div>' +
        f('u-camp', 'campaign', 'Campaign', 'kitchen-leadform-ncr', 'Lowercased, spaces become hyphens, other symbols are removed.', true) +
        '<div class="row2">' + f('u-term', 'term', 'Term', 'modular kitchen') + f('u-cont', 'content', 'Content', 'video-a') + '</div></section>' +
        '<aside class="utm-side"><section class="card"><div class="card-h"><div><h2>Your link</h2><p class="sub">Updates as you type</p></div></div><div id="utm-out" class="utm-out" aria-live="polite">' + utmOut() + '</div><div class="btns" id="utm-btns">' + utmBtns() + '</div></section>' +
        '<section class="card"><div class="card-h"><div><h2>Saved links</h2></div></div><div id="utm-saved">' + utmSaved() + '</div></section></aside></div>' +
        '<section class="card flush"><div class="card-h pad"><div><h2>Leads by campaign</h2><p class="sub">Read from the UTM fields of the leads in this CRM</p></div></div><div class="tablewrap"><table class="tbl"><thead><tr><th scope="col">Campaign</th><th scope="col">Source / medium</th><th scope="col" class="num">Leads</th><th scope="col" class="w-bar"><span class="sr">Share</span></th><th scope="col" class="num">Won</th><th scope="col" class="num">Est. value</th></tr></thead><tbody>' +
        (rows.length ? rows.map(function (g) { return '<tr><td class="mono-c">' + esc(g.c) + '</td><td class="muted">' + esc(g.s) + ' / ' + esc(g.m) + '</td><td class="num">' + g.n + '</td><td><span class="mbar"><i style="width:' + Math.round(g.n / mx * 100) + '%"></i></span></td><td class="num">' + g.w + '</td><td class="num">' + C.money(g.v) + '</td></tr>'; }).join('') : '<tr><td colspan="6" class="empty">No tagged leads yet.</td></tr>') + '</tbody></table></div></section>';
    }
  };
  function utmRefresh() { $('#utm-out').innerHTML = utmOut(); $('#utm-btns').innerHTML = utmBtns(); $$('[data-act="utm-preset"]').forEach(function (b) { var p = PRESETS.filter(function (x) { return x[0] === b.dataset.v; })[0], u = U(); b.setAttribute('aria-pressed', String(p[2][0] === u.source && p[2][1] === u.medium && p[2][2] === u.campaign)); }); }
  C.ins.utm = function (el) { U()[el.dataset.k] = el.value; utmRefresh(); };
  C.acts['utm-preset'] = function (el) { var p = PRESETS.filter(function (x) { return x[0] === el.dataset.v; })[0][2], u = U(); u.source = p[0]; u.medium = p[1]; u.campaign = p[2]; C.rerender(); var b = $('[data-act="utm-preset"][data-v="' + el.dataset.v + '"]'); if (b) b.focus(); if (C.motion()) gsap.fromTo('#utm-res', { opacity: .3, y: 4 }, { opacity: 1, y: 0, duration: .3 }); };
  C.acts['utm-copy'] = function () { var r = buildUtm(); if (r.url) C.copy(r.url); };
  C.acts['utm-save'] = function () { var r = buildUtm(); if (!r.url) return; S().utmSaved.unshift({ t: Date.now(), name: clean(U().campaign), url: r.url }); C.save(); $('#utm-saved').innerHTML = utmSaved(); C.toast('Saved to library', { icon: 'link' }); if (C.motion()) gsap.from('#utm-saved li:first-child', { opacity: 0, y: -8, duration: .35 }); };
  C.acts['utm-copy-saved'] = function (el) { C.copy(S().utmSaved[+el.dataset.i].url); };
  C.acts['utm-del'] = function (el) { S().utmSaved.splice(+el.dataset.i, 1); C.save(); $('#utm-saved').innerHTML = utmSaved(); C.toast('Link removed', { icon: 'trash' }); };
  C.copy = function (text) {
    var ok = function () { C.toast('Copied to clipboard', { icon: 'copy' }); };
    var fb = function () {
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0';
      document.body.appendChild(ta); ta.select(); var r = false; try { r = document.execCommand('copy'); } catch (e) { } document.body.removeChild(ta);
      r ? ok() : C.toast('Press Ctrl/Cmd+C to copy', { icon: 'copy' });
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fb); else fb();
  };

  // ===== Integrations ======================================================
  var itab = function () { return C.ui.itab || 'gsc'; };
  var sum = function (a, f) { return a.reduce(function (s, x) { return s + f(x); }, 0); };
  function gscModel() {
    var d = C.sim().gsc.days, imp = sum(d, function (x) { return x.imp; }), clk = sum(d, function (x) { return x.clicks; });
    var a = C.sim().gsc.prev, b = d;
    var m = function (arr) { var i = sum(arr, function (x) { return x.imp; }), c = sum(arr, function (x) { return x.clicks; }); return { imp: i, clicks: c, ctr: c / i * 100, pos: sum(arr, function (x) { return x.pos * x.imp; }) / i }; };
    return { d: d, tot: { imp: imp, clicks: clk, ctr: clk / imp * 100, pos: sum(d, function (x) { return x.pos * x.imp; }) / imp }, a: m(a), b: m(b) };
  }
  var GM = {
    clicks: { label: 'Clicks', f: C.num, v: function (x) { return x.clicks; }, color: '#2B59FF', ff: 'int' },
    imp: { label: 'Impressions', f: C.num, v: function (x) { return x.imp; }, color: '#0B8F9E', ff: 'int' },
    ctr: { label: 'Average CTR', f: function (v) { return v.toFixed(1) + '%'; }, v: function (x) { return x.clicks / x.imp * 100; }, color: '#1F9D57', ff: 'pct1' },
    pos: { label: 'Average position', f: function (v) { return v.toFixed(1); }, v: function (x) { return x.pos; }, color: '#8454E8', low: true, ff: 'dec1' }
  };
  function gscKpi(k, g) {
    var m = GM[k], tot = g.tot[k], p = g.a[k], c = g.b[k], on = (C.ui.gm || 'clicks') === k;
    return '<button type="button" class="kpi tile" data-act="gsc-metric" data-k="' + k + '" aria-pressed="' + on + '"><span class="kl">' + m.label + '</span><span class="kv"><span data-count="' + tot + '" data-f="' + m.ff + '">' + m.f(tot) + '</span>' + C.delta(c, p, m.low) + '</span><span class="ks">vs previous 28 days</span><span class="kspark">' + C.spark(g.d.map(m.v), m.color) + '</span></button>';
  }
  function queryRows() {
    var q = (C.ui.gq || '').toLowerCase(), s = C.ui.gs || { k: 'clicks', dir: -1 }, all = C.sim().gsc.queries, mx = Math.max.apply(null, all.map(function (x) { return x.clicks; }));
    var a = all.filter(function (x) { return !q || x.q.indexOf(q) > -1; }).sort(function (x, y) { return s.k === 'q' ? s.dir * x.q.localeCompare(y.q) : s.dir * (x[s.k] - y[s.k]); });
    return a.length ? a.map(function (x) { return '<tr><td class="q-c">' + esc(x.q) + '</td><td class="num">' + C.num(x.clicks) + '</td><td class="w-bar"><span class="mbar"><i style="width:' + Math.round(x.clicks / mx * 100) + '%"></i></span></td><td class="num">' + C.num(x.imp) + '</td><td class="num">' + (x.ctr * 100).toFixed(1) + '%</td><td class="num"><span class="pos p' + (x.pos <= 3 ? 1 : x.pos <= 10 ? 2 : 3) + '">' + x.pos.toFixed(1) + '</span></td></tr>'; }).join('') : '<tr><td colspan="6" class="empty">No queries match.</td></tr>';
  }
  function queryHead() {
    var s = C.ui.gs || { k: 'clicks', dir: -1 };
    return [['q', 'Query', ''], ['clicks', 'Clicks', 'num'], ['', '', 'w-bar'], ['imp', 'Impressions', 'num'], ['ctr', 'CTR', 'num'], ['pos', 'Position', 'num']].map(function (c) {
      if (!c[0]) return '<th scope="col" class="w-bar"><span class="sr">Clicks share</span></th>';
      var on = s.k === c[0];
      return '<th scope="col" class="' + c[2] + '" aria-sort="' + (on ? (s.dir > 0 ? 'ascending' : 'descending') : 'none') + '"><button type="button" class="sortbtn" data-act="gsc-sort" data-k="' + c[0] + '">' + c[1] + '<span class="srt" aria-hidden="true">' + (on ? (s.dir > 0 ? '↑' : '↓') : '') + '</span></button></th>';
    }).join('');
  }
  function gscPanel() {
    var g = gscModel(), mk = C.ui.gm || 'clicks', m = GM[mk], labels = g.d.map(function (x) { return C.dshort(x.t); }), Q = C.sim().gsc.queries;
    var organic = S().leads.filter(function (l) { return l.source === 'google'; }).length;
    C.chartSpecs.gsc = function (w) { return C.chart.area({ w: w, h: 260, labels: labels, titles: g.d.map(function (x) { return new Date(x.t).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); }), series: [{ values: g.d.map(function (x) { return +m.v(x).toFixed(2); }), color: m.color, label: m.label }], invert: !!m.low, fmt: m.f, tick: mk === 'ctr' ? function (v) { return v.toFixed(1) + '%'; } : mk === 'pos' ? function (v) { return v.toFixed(0); } : null, label: m.label + ' per day for the last 28 days' + (m.low ? ' (lower is better)' : '') }); };
    var band = [['Top 3', 0, 3], ['4–10', 3, 10], ['11–20', 10, 20], ['21+', 20, 99]].map(function (b) { var a = Q.filter(function (x) { return x.pos > b[1] && x.pos <= b[2]; }); return { label: b[0], value: a.length, text: a.length + ' · ' + C.num(sum(a, function (x) { return x.clicks; })) + ' clicks', color: b[0] === 'Top 3' ? '#1F9D57' : b[0] === '4–10' ? '#2B59FF' : b[0] === '11–20' ? '#7B8AB8' : '#C4C8D0' }; });
    C.chartSpecs.gband = function (w) { return C.chart.hbars({ w: w, items: band, lw: 54, vw: 110, rowH: 36, name: 'Queries', label: 'Queries by average position: ' + band.map(function (b) { return b.label + ' ' + b.value; }).join(', ') }); };
    return '<section class="card conn"><div><h2>' + C.ic('search', 15) + 'Google Search Console</h2><p class="sub">Property <b>https://www.lumenhomes.example/</b> · Last 28 days</p></div>' + C.simTag + '<span class="status-ok"><i></i>Connected (demo)</span></section>' +
      '<div class="kpis" role="group" aria-label="Choose a metric to chart">' + ['clicks', 'imp', 'ctr', 'pos'].map(function (k) { return gscKpi(k, g); }).join('') + '</div>' +
      '<div class="grid g-main"><section class="card"><div class="card-h"><div><h2>' + m.label + '</h2><p class="sub">Daily' + (m.low ? ' · lower is better, so the axis is flipped' : '') + '</p></div></div><div class="chart" data-chart="gsc"></div></section>' +
      '<section class="card"><div class="card-h"><div><h2>Ranking position</h2><p class="sub">Tracked queries by where they rank</p></div></div><div class="chart" data-chart="gband"></div><p class="note-l">' + C.ic('inbox', 14) + '<span><b>' + organic + ' CRM leads</b> came from Google search. <a href="#/inbox" data-act="goto-src" data-v="google">View in inbox</a></span></p></section></div>' +
      '<section class="card flush"><div class="card-h pad"><div><h2>Top queries</h2><p class="sub">Search queries that showed your site</p></div><div class="sfield sm"><label class="sr" for="gq">Filter queries</label>' + C.ic('search', 14) + '<input id="gq" type="search" data-in="gsc-q" value="' + esc(C.ui.gq || '') + '" placeholder="Filter queries" autocomplete="off"></div></div><div class="tablewrap"><table class="tbl"><thead><tr id="gsc-head">' + queryHead() + '</tr></thead><tbody id="gsc-body">' + queryRows() + '</tbody></table></div></section>';
  }
  C.acts['gsc-metric'] = function (el) { C.ui.gm = el.dataset.k; C.rerender(true); $('[data-act="gsc-metric"][aria-pressed="true"]').focus(); };
  C.ins['gsc-q'] = function (el) { C.ui.gq = el.value; $('#gsc-body').innerHTML = queryRows(); };
  C.acts['gsc-sort'] = function (el) { var s = C.ui.gs || { k: 'clicks', dir: -1 }; C.ui.gs = { k: el.dataset.k, dir: s.k === el.dataset.k ? -s.dir : (el.dataset.k === 'q' || el.dataset.k === 'pos' ? 1 : -1) }; $('#gsc-head').innerHTML = queryHead(); $('#gsc-body').innerHTML = queryRows(); $('[data-act="gsc-sort"][data-k="' + el.dataset.k + '"]').focus(); };

  function hashOf(id, n) { var h = id.replace(/\D|evt_/g, '') + id.replace(/[^a-f0-9]/g, ''); while (h.length < n) h += h; return h.slice(0, n); }
  function payload(e) {
    var l = e.leadId && C.lead(e.leadId);
    return JSON.stringify({ event_name: e.name, event_time: Math.round(e.t / 1000), event_id: e.id, action_source: 'system_generated', user_data: { em: ['sha256:' + hashOf(e.id, 24) + '…'], ph: ['sha256:' + hashOf(e.id.split('').reverse().join(''), 24) + '…'], external_id: l ? l.id : 'test' }, custom_data: Object.assign({ lead_source: 'meta', pipeline_stage: l ? l.status : 'n/a' }, e.value ? { currency: 'INR', value: e.value } : {}) }, null, 2);
  }
  function capiRows() {
    var f = C.ui.capiF || 'all';
    return S().capi.filter(function (e) { return f === 'all' || e.name === f; }).slice(0, 40).map(function (e, i) {
      var l = e.leadId && C.lead(e.leadId), q = e.match >= 8 ? 'ok' : e.match >= 6.5 ? 'acc' : 'warn', open = C.ui.capiOpen === e.id;
      return '<tr class="ev" data-id="' + e.id + '"><td class="nw">' + C.dt(e.t) + '</td><td><span class="evb ev-' + e.name + '">' + esc(e.name) + '</span>' + (e.value ? ' <span class="muted sm">' + C.inr(e.value) + '</span>' : '') + '</td><td>' + (l ? '<a href="' + C.leadHref(l.id) + '">' + esc(l.name) + '</a>' : '<span class="muted">Test event</span>') + '</td><td class="mono">' + esc(e.id) + '</td><td><span class="mq ' + q + '" title="Event match quality ' + e.match + ' of 10"><i style="width:' + e.match * 10 + '%"></i></span> <span class="mqn">' + e.match + '</span></td><td><span class="tag-p ' + (e.status === 'Delivered' ? 'ok' : 'warn') + '">' + esc(e.status) + '</span></td><td class="num"><button type="button" class="ibtn" data-act="capi-open" data-id="' + e.id + '" aria-expanded="' + open + '" aria-label="' + (open ? 'Hide' : 'Show') + ' payload for ' + esc(e.id) + '">' + C.ic(open ? 'chev-d' : 'chev-r', 14) + '</button></td></tr>' +
        (open ? '<tr class="pl"><td colspan="7"><div class="pl-h">Simulated payload · hashed identifiers are placeholders</div><pre>' + esc(payload(e)) + '</pre></td></tr>' : '');
    }).join('') || '<tr><td colspan="7" class="empty">No events of this type yet.</td></tr>';
  }
  function metaPanel() {
    var M = C.sim().meta, cs = M.camps, spend = sum(cs, function (c) { return c.spend; }), leads = sum(cs, function (c) { return c.leads; }), clk = sum(cs, function (c) { return c.clicks; }), imp = sum(cs, function (c) { return c.impr; });
    var ML = S().leads.filter(function (l) { return l.source === 'meta'; }), crm = ML.length, t = Date.now();
    var labels = M.daily.map(function (_, i) { return C.dshort(t - (29 - i) * 864e5); });
    var nb = 10, bw = 30 * 864e5 / nb, bl = [], i;
    for (i = 0; i < nb; i++) { var a = t - 30 * 864e5 + i * bw; bl.push(ML.filter(function (l) { return l.created >= a && l.created < a + bw; }).length); }
    var bs = []; for (i = 0; i < nb; i++) bs.push(sum(M.daily.slice(i * 3, i * 3 + 3), function (x) { return x; }));
    var cpls = bs.map(function (s, k) { return s / Math.max(1, bl[k] + 1); });
    var ev = S().capi, del = ev.filter(function (e) { return e.status === 'Delivered'; }).length;
    var evb = []; for (i = 0; i < nb; i++) { var a2 = t - 30 * 864e5 + i * bw; evb.push(ev.filter(function (e) { return e.t >= a2 && e.t < a2 + bw; }).length); }
    C.chartSpecs.mspend = function (w) { return C.chart.bars({ w: w, h: 230, values: M.daily, labels: labels, color: '#8454E8', name: 'Spend', tick: function (v) { return '₹' + C.chart_k(v); }, label: 'Daily Meta ad spend over 30 days, total ' + C.inr(spend), fmt: C.inr }); };
    var cpl = cs.map(function (c) { return { label: c.name.split(' — ')[0], value: c.spend / c.leads, text: C.inr(c.spend / c.leads), color: c.status === 'Paused' ? '#C4C8D0' : '#8454E8' }; });
    C.chartSpecs.mcpl = function (w) { return C.chart.hbars({ w: w, items: cpl, lw: Math.min(118, w * .36), vw: 64, rowH: 40, name: 'Cost per lead', label: 'Cost per lead by campaign: ' + cpl.map(function (c) { return c.label + ' ' + c.text; }).join(', ') }); };
    var tile = function (l, v, f, sub, sp) { return '<div class="kpi"><div class="kl">' + l + '</div><div class="kv"><span data-count="' + v + '" data-f="' + f + '">' + C.fmts[f](v) + '</span></div><div class="ks">' + sub + '</div><div class="kspark">' + C.spark(sp, '#8454E8') + '</div></div>'; };
    var cf = C.ui.capiF || 'all';
    return '<section class="card conn"><div><h2>' + C.ic('mega', 15) + 'Meta Ads</h2><p class="sub">Ad account <b>Lumen Homes — Demo</b> · Last 30 days</p></div>' + C.simTag + '<span class="status-ok"><i></i>Connected (demo)</span></section>' +
      '<section class="kpis" aria-label="Meta Ads summary">' + tile('Spend', spend, 'inr', C.num(imp) + ' impressions', M.daily) + tile('Leads (platform)', leads, 'int', crm + ' matched in this CRM', bl) + tile('Cost per lead', spend / leads, 'inr', 'Link CTR ' + (clk / imp * 100).toFixed(2) + '%', cpls) + tile('Events sent (CAPI)', ev.length, 'int', del + ' delivered', evb) + '</section>' +
      '<div class="grid g-main"><section class="card"><div class="card-h"><div><h2>Daily spend</h2><p class="sub">Last 30 days · hover for the day</p></div></div><div class="chart" data-chart="mspend"></div></section><section class="card"><div class="card-h"><div><h2>Cost per lead</h2><p class="sub">By campaign · lower is better</p></div></div><div class="chart" data-chart="mcpl"></div></section></div>' +
      '<section class="card flush"><div class="card-h pad"><div><h2>Campaigns</h2></div></div><div class="tablewrap"><table class="tbl"><thead><tr><th scope="col">Campaign</th><th scope="col">Status</th><th scope="col" class="num">Spend</th><th scope="col" class="num">Impressions</th><th scope="col" class="num">Clicks</th><th scope="col" class="num">CTR</th><th scope="col" class="num">Leads</th><th scope="col" class="num">Cost / lead</th></tr></thead><tbody>' +
      cs.map(function (c) { return '<tr><td>' + esc(c.name) + '</td><td><span class="stt ' + c.status.toLowerCase() + '"><i></i>' + c.status + '</span></td><td class="num">' + C.inr(c.spend) + '</td><td class="num">' + C.num(c.impr) + '</td><td class="num">' + C.num(c.clicks) + '</td><td class="num">' + (c.clicks / c.impr * 100).toFixed(2) + '%</td><td class="num">' + c.leads + '</td><td class="num"><b>' + C.inr(c.spend / c.leads) + '</b></td></tr>'; }).join('') +
      '<tr class="total"><td>Total</td><td></td><td class="num">' + C.inr(spend) + '</td><td class="num">' + C.num(imp) + '</td><td class="num">' + C.num(clk) + '</td><td class="num">' + (clk / imp * 100).toFixed(2) + '%</td><td class="num">' + leads + '</td><td class="num">' + C.inr(spend / leads) + '</td></tr></tbody></table></div></section>' +
      '<section class="card flush"><div class="card-h pad"><div><h2><span class="live-dot"></span>Conversions API event stream</h2><p class="sub">Server-side events sent back to Meta as a Meta lead moves through the <a href="#/pipeline">pipeline</a>. Drag one to see it appear.</p></div><button type="button" class="btn" data-act="capi-test">' + C.ic('bolt', 14) + 'Send test event</button></div>' +
      '<div class="chips pad" role="group" aria-label="Filter events">' + ['all', 'Lead', 'Contact', 'Schedule', 'Purchase'].map(function (n) { return '<button type="button" class="chip" data-act="capi-f" data-v="' + n + '" aria-pressed="' + (cf === n) + '">' + (n === 'all' ? 'All events' : n) + '</button>'; }).join('') + '</div>' +
      '<div class="tablewrap"><table class="tbl stream"><thead><tr><th scope="col">Time</th><th scope="col">Event</th><th scope="col">Lead</th><th scope="col">Event ID</th><th scope="col">Match quality</th><th scope="col">Status</th><th scope="col"><span class="sr">Payload</span></th></tr></thead><tbody id="capi-body">' + capiRows() + '</tbody></table></div></section>';
  }
  C.chart_k = function (v) { return v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : String(Math.round(v)); };
  C.acts['capi-test'] = function () {
    C.capi(null, 'Lead'); C.save(); $('#capi-body').innerHTML = capiRows(); C.toast('Simulated test event logged', { icon: 'bolt' });
    if (C.motion()) { var r = $('#capi-body tr:first-child'); if (r) gsap.fromTo(r.children, { backgroundColor: 'rgba(43,89,255,.14)', y: -6, opacity: 0 }, { backgroundColor: 'rgba(43,89,255,0)', y: 0, opacity: 1, duration: 1, clearProps: 'all' }); }
  };
  C.acts['capi-f'] = function (el) { C.ui.capiF = el.dataset.v; C.ui.capiOpen = null; C.rerender(); var b = $('[data-act="capi-f"][aria-pressed="true"]'); if (b) b.focus(); };
  C.acts['capi-open'] = function (el) { C.ui.capiOpen = C.ui.capiOpen === el.dataset.id ? null : el.dataset.id; $('#capi-body').innerHTML = capiRows(); var b = $('[data-act="capi-open"][data-id="' + el.dataset.id + '"]'); if (b) b.focus(); if (C.ui.capiOpen && C.motion()) gsap.from('#capi-body .pl pre', { height: 0, opacity: 0, duration: .3, ease: 'power2.out' }); };

  C.views.integrations = {
    title: function () { return 'Integrations'; },
    render: function () {
      var t = itab();
      var tabs = [['gsc', 'Search Console', 'search'], ['meta', 'Meta Ads', 'mega']].map(function (x) { return '<button type="button" role="tab" id="tab-' + x[0] + '" aria-controls="panel" aria-selected="' + (t === x[0]) + '" tabindex="' + (t === x[0] ? 0 : -1) + '" data-act="tab" data-k="itab" data-v="' + x[0] + '">' + C.ic(x[2], 14) + x[1] + '</button>'; }).join('');
      return C.page('Integrations', 'Marketing data next to your leads') +
        '<div class="sim-banner" role="note">' + C.ic('bolt', 15) + '<span><b>Simulated data.</b> No Google or Meta API is called — these numbers are generated in your browser to show how the panels look once connected.</span></div>' +
        '<div class="tabs" role="tablist" aria-label="Integrations">' + tabs + '</div><div id="panel" role="tabpanel" aria-labelledby="tab-' + t + '">' + (t === 'gsc' ? gscPanel() : metaPanel()) + '</div>';
    }
  };

  C.boot();
})();
