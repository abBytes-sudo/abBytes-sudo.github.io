/* Fieldwise — the route wall: one day on a drawn map, replayed (the product page's Tuesday) or live (today, in the app),
   and the product page's "Match it in front of me". Everything is computed with the app's own matcher (CK.matches),
   trip planner (CK.orderStops, CK.legMin) and map (CK.map). */
(function () {
  'use strict';
  var CK = window.CK, esc = CK.esc, ic = CK.ic;
  var P = CK.Play = {};
  function reduce() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function hm(m) { m = Math.round(m); var h = Math.floor(m / 60), mm = m % 60; return ((h + 11) % 12 + 1) + ':' + (mm < 10 ? '0' : '') + mm + (h < 12 ? ' am' : ' pm'); }
  function hmShort(m) { m = Math.round(m); var h = Math.floor(m / 60), mm = m % 60; return ((h + 11) % 12 + 1) + ':' + (mm < 10 ? '0' : '') + mm; }
  P.hm = hm;
  function minOf(ms) { return (ms - CK.dayStart(ms)) / 6e4; }
  function first(n) { return String(n || '').replace(/^(Col\.|Dr\.|Brig\.)\s*/, '').split(' ')[0]; }
  function ease(u) { u = Math.max(0, Math.min(1, u)); return u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }
  function ctrl(a, b) { var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1]; return [mx - dy * .18, my + dx * .18]; }
  function bez(a, b, u) { var c = ctrl(a, b), v = 1 - u; return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]]; }
  function pathThrough(pts) { var d = 'M' + pts[0][0].toFixed(0) + ' ' + pts[0][1].toFixed(0); for (var i = 1; i < pts.length; i++) { var c = ctrl(pts[i - 1], pts[i]); d += ' Q' + c[0].toFixed(0) + ' ' + c[1].toFixed(0) + ' ' + pts[i][0].toFixed(0) + ' ' + pts[i][1].toFixed(0); } return d; }
  function fit(pts, aspect, pad, minW) {
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    pts.forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    var w = Math.max(x1 - x0 + pad * 2, minW || 300), h = Math.max(y1 - y0 + pad * 2, (minW || 300) / aspect);
    if (w / h < aspect) w = h * aspect; else h = w / aspect;
    return [(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h / 2, w, h];
  }
  function jitter(id, r) { var h = CK.hash(id), a = (h % 360) * Math.PI / 180, d = r * (.45 + (h >> 4) % 100 / 180); return [Math.cos(a) * d, Math.sin(a) * d]; }
  function leadPin(L, t, r) { var a = CK.area(L.req.sectors[0]) || CK.area('GP'), c = CK.xy(a, r), j = jitter(L.id, 26); return { id: L.id, t: t, src: L.src, name: L.name, x: c[0] + j[0], y: c[1] + j[1] }; }
  var OUT = { liked: 'liked it', short: 'shortlisted', rejected: 'rejected', verified: 'verified · badge on', notavail: 'already let out', novisit: 'not visited' };
  function outcomeText(p, st) { return p.code + ' — ' + (st.v === 'rejected' ? 'rejected, ' + (st.reason || 'not a fit').toLowerCase() : OUT[st.v] || st.v); }

  /* ---------- the Tuesday, from the script in data.js ---------- */
  P.fromScript = function (sc) {
    sc = sc || CK.TUESDAY; var S = CK.S(), r = 'sd', O = CK.REGIONS[r].office, visit = S.settings.visitMinutes;
    var day = { r: r, from: sc.from, to: sc.to, show: sc.show, name: sc.name, beats: sc.beats || [], trips: [], leads: [], events: [], hl: null, token: null, live: false, firstMsg: {} };
    sc.trips.forEach(function (tr) {
      var props;
      if (tr.codes) props = tr.codes.map(function (c) { return S.props.filter(function (p) { return p.code === c; })[0]; }).filter(Boolean);
      else { var L0 = CK.lead(tr.lead); props = L0 ? CK.matches(L0).slice(0, tr.pick || 3).map(function (m) { return m.p; }) : []; }
      if (!props.length) return;
      var ordered = CK.orderStops(O, props), t = tr.start, prev = O, stops = [];
      ordered.forEach(function (p) { var rank = props.indexOf(p), a = t + CK.legMin(prev, p), d = a + (tr.kind === 'verify' ? 25 : visit), o = ((tr.outcomes || [])[rank] || 'liked').split(':'); stops.push({ pid: p.id, a: a, d: d, v: o[0], reason: o[1] || '', rank: rank }); t = d; prev = p; });
      var trip = { id: tr.id, agent: tr.agent, kind: tr.kind || 'visit', lead: tr.lead || null, plan: tr.plan, start: tr.start, stops: stops, end: t, back: t + CK.legMin(prev, O) };
      day.trips.push(trip);
      var ag = CK.agent(tr.agent), L = tr.lead ? CK.lead(tr.lead) : null;
      day.events.push({ t: tr.plan, k: 'plan', trip: trip.id, lead: trip.lead, text: (trip.kind === 'verify' ? 'Verification run planned for ' : 'Trip planned for ') + first(ag.name) + ' · ' + stops.length + ' homes · leaves ' + hm(tr.start) + (L ? ' · for ' + first(L.name) : '') });
      day.events.push({ t: tr.start, k: 'start', trip: trip.id, text: first(ag.name) + ' left the office · ' + stops.length + ' stops' });
      stops.forEach(function (st, i) {
        var p = CK.prop(st.pid);
        day.events.push({ t: st.a, k: 'checkin', trip: trip.id, i: i, text: first(ag.name) + ' checked in at ' + p.code + ' · ' + (12 + (i * 9) % 30) + ' m from the pin' });
        day.events.push({ t: st.d - 2, k: 'outcome', trip: trip.id, i: i, lead: trip.lead, text: outcomeText(p, st) });
        if (trip.kind === 'visit') day.events.push({ t: st.d + 4, k: 'owner', trip: trip.id, i: i, text: 'Owner of ' + p.code + ' told how it went, on WhatsApp' });
      });
    });
    function shortHome(leadId) { var tr = day.trips.filter(function (x) { return x.lead === leadId; })[0]; if (!tr) return null; var s = tr.stops.filter(function (x) { return x.v === 'short'; })[0] || tr.stops[0]; return CK.prop(s.pid); }
    sc.events.forEach(function (e) {
      var t = e[0], k = e[1], L = CK.lead(e[2]); if (!L) return; var who = CK.agent(L.owner) || CK.agent('A3'), ev = { t: t, k: k, lead: L.id };
      if (k === 'lead') { day.leads.push(leadPin(L, t, day.r)); ev.text = 'New lead · ' + L.name + ' · ' + L.src; if (e[3]) day.firstMsg[L.id] = e[3]; }
      if (k === 'assign') ev.text = 'Auto-assigned to ' + first(who.name) + ' · first call due by ' + hm(t + 14);
      if (k === 'call') { ev.ok = e[3] === 'connected'; ev.text = first(who.name) + ' called ' + first(L.name) + ' — ' + (e[3] === 'noanswer' ? 'no answer, retry at ' + hm(t + 120) : '“' + e[4] + '”'); }
      if (k === 'brief') ev.text = 'Brief in for ' + first(L.name) + ': ' + L.req.bhk.join('/') + ' BHK · ' + CK.budget(L) + ' · ' + L.req.sectors.slice(0, 2).map(function (s) { return CK.area(s).short; }).join(', ') + (L.req.sectors.length > 2 ? ' +' + (L.req.sectors.length - 2) : '');
      if (k === 'match') { var n = e[3] || 6, ms = CK.matches(L).slice(0, n); ev.text = first(L.name) + ' matched to ' + ms.length + ' verified homes'; var pl = day.trips.filter(function (x) { return x.lead === L.id; })[0]; day.hl = { lead: L.id, from: t, to: pl ? pl.plan : t + 45, pids: ms.map(function (m) { return m.p.id; }), scores: ms.map(function (m) { return m.score; }) }; }
      if (k === 'nego') { var h = shortHome(L.id); ev.text = String(e[3]).replace('{first}', first(L.name)).replace('{home}', h ? h.code : 'the home').replace('{ask}', h ? CK.money(h.price + 3000, true) : '').replace('{price}', h ? CK.money(h.price, true) : ''); }
      if (k === 'token') { var h2 = shortHome(L.id); ev.text = 'Token ' + CK.inr(e[3]) + ' · ' + (h2 ? h2.code + ' blocked for ' : 'home blocked for ') + first(L.name); day.token = { t: t, lead: L.id, pid: h2 && h2.id, amt: e[3] }; }
      day.events.push(ev);
    });
    day.events.sort(function (a, b) { return a.t - b.t; });
    return day;
  };

  /* ---------- today, from the store (live) ---------- */
  P.fromStore = function () {
    var S = CK.S(), now = CK.now(), d0 = CK.dayStart(now), nowM = Math.max(560, Math.min(1140, minOf(now))), r = 'sd', O = CK.REGIONS[r].office, visit = S.settings.visitMinutes;
    var day = { r: r, from: 540, to: nowM, show: nowM, name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(now).getDay()], beats: [], trips: [], leads: [], events: [], hl: null, token: null, live: true, firstMsg: {} };
    S.trips.filter(function (t) { return t.r === r && CK.dayStart(t.start) === d0 && t.status !== 'cancelled'; }).forEach(function (t) {
      var start = minOf(t.start), dep = start, prev = O, stops = [];
      t.stops.forEach(function (s) {
        var p = CK.prop(s.pid); if (!p) return;
        var a = s.at ? minOf(s.at) : dep + CK.legMin(prev, p), d = s.doneAt ? minOf(s.doneAt) : s.st === 'here' ? Math.max(nowM + 1, a + visit) : a + (t.kind === 'verify' ? 25 : visit), v = null, reason = '';
        if (s.st === 'done' || s.st === 'missed') { if (t.kind === 'verify') v = (s.out.verify || {}).v || 'verified'; else { var kk = Object.keys(s.out)[0]; v = kk ? s.out[kk].v : 'novisit'; reason = kk ? (s.out[kk].reason || '') : ''; } }
        stops.push({ pid: p.id, a: a, d: d, v: v || 'pending', reason: reason }); dep = d; prev = p;
      });
      if (!stops.length) return;
      var plan = t.created && CK.dayStart(t.created) === d0 ? Math.max(540, minOf(t.created)) : 540;
      day.trips.push({ id: t.id, agent: t.agent, kind: t.kind, lead: t.leads[0] || null, plan: Math.min(plan, start), start: start, stops: stops, end: dep, back: dep + CK.legMin(prev, O) });
      (t.feed || []).forEach(function (f) { if (f.at >= d0 && f.at <= now) day.events.push({ t: minOf(f.at), k: 'trip', trip: t.id, text: first(CK.agent(t.agent).name) + ' · ' + f.text }); });
    });
    S.leads.forEach(function (L) {
      if (L.req.r !== r) return;
      if (L.created >= d0 + 9 * 36e5 && L.created <= now) { day.leads.push(leadPin(L, minOf(L.created), r)); day.events.push({ t: minOf(L.created), k: 'lead', lead: L.id, text: 'New lead · ' + L.name + ' · ' + L.src }); }
      L.tl.forEach(function (e) { if (e.kind === 'call' && e.at >= d0 + 9 * 36e5 && e.at <= now) { var a = CK.agent(e.by); day.events.push({ t: minOf(e.at), k: 'call', lead: L.id, ok: e.outcome === 'connected', text: (a ? first(a.name) + ' called ' : 'Called ') + first(L.name) + ' — ' + e.text.replace(/^Call · /, '') }); } });
    });
    S.deals.forEach(function (d) { if (d.token && d.token.at >= d0 && d.token.at <= now) day.events.push({ t: minOf(d.token.at), k: 'token', lead: d.lead, text: 'Token ' + CK.inr(d.token.amt) + ' · ' + CK.prop(d.pid).code + ' blocked' }); });
    day.events.sort(function (a, b) { return a.t - b.t; });
    return day;
  };

  /* ---------- where an agent is at minute t ---------- */
  function track(tr, t, O) {
    if (t < tr.start) return { xy: O, st: 'office' };
    var prev = O, dep = tr.start;
    for (var i = 0; i < tr.stops.length; i++) {
      var s = tr.stops[i], p = CK.xy(CK.prop(s.pid));
      if (t < s.a) return { xy: bez(prev, p, ease((t - dep) / Math.max(1, s.a - dep))), st: 'driving', i: i };
      if (t < s.d) return { xy: p, st: 'here', i: i };
      prev = p; dep = s.d;
    }
    if (t < tr.back) { var u = ease((t - dep) / Math.max(1, tr.back - dep)); return { xy: [prev[0] + (O[0] - prev[0]) * u, prev[1] + (O[1] - prev[1]) * u], st: 'return' }; }
    return { xy: O, st: 'back' };
  }
  function stopState(s, t) { return t < s.a ? 'togo' : t < s.d ? 'here' : s.v === 'pending' ? 'here' : s.v; }

  /* ---------- the agent's phone at minute t ---------- */
  function phone(day, agentId, t) {
    var ag = CK.agent(agentId), trips = day.trips.filter(function (x) { return x.agent === agentId; }).sort(function (a, b) { return a.start - b.start; });
    var tr = trips.filter(function (x) { return t >= x.plan && t < x.back + 20; })[0] || trips.filter(function (x) { return x.plan <= t && x.start > t; })[0] || trips.filter(function (x) { return x.plan <= t; }).pop();
    var now = '', list = '';
    if (!tr) now = '<p class="wp-k">Today</p><p class="wp-b">No trips yet. The office plans them; they land here the moment they do.</p>';
    else {
      var pos = track(tr, t, CK.xy(CK.REGIONS[day.r].office)), n = tr.stops.length;
      var stopHtml = function (i, k) { var p = CK.prop(tr.stops[i].pid); return '<div class="wp-c"><img src="' + CK.ph(p.photos[0], 1) + '" alt="" width="64" height="48"><div><b>' + esc(p.plot) + ', ' + esc(CK.area(p.area).short) + '</b><span>' + esc(CK.cfg(p)) + '</span><span class="wp-m">' + k + '</span></div></div>'; };
      if (t < tr.start) now = '<p class="wp-k">Next trip · leaves ' + hm(tr.start) + '</p>' + stopHtml(0, 'First stop · ETA ' + hm(tr.stops[0].a)) + '<div class="wp-btns"><span class="wp-btn ghost">Navigate</span><span class="wp-btn">Start trip</span></div>';
      else if (pos.st === 'driving') now = '<p class="wp-k">Next stop · ' + (pos.i + 1) + ' of ' + n + '</p>' + stopHtml(pos.i, 'ETA ' + hm(tr.stops[pos.i].a)) + '<div class="wp-btns"><span class="wp-btn ghost">Navigate</span><span class="wp-btn">Check in</span></div>';
      else if (pos.st === 'here') now = '<p class="wp-k">You’re here · stop ' + (pos.i + 1) + ' of ' + n + '</p>' + stopHtml(pos.i, 'Checked in ' + hm(tr.stops[pos.i].a) + ' · at the gate') + '<div class="wp-btns"><span class="wp-btn wide">' + (tr.kind === 'verify' ? 'Verification checklist' : 'Visit outcome') + '</span></div>';
      else if (pos.st === 'return') now = '<p class="wp-k">All ' + n + ' stops done</p><p class="wp-b">Heading back to the office. Outcomes are already with the owners.</p>';
      else now = '<p class="wp-k">All ' + n + ' stops done</p><p class="wp-b">' + tr.stops.filter(function (s) { return s.v === 'liked' || s.v === 'short' || s.v === 'verified'; }).length + ' good results today.</p><div class="wp-btns"><span class="wp-btn wide">End-of-day report</span></div>';
      list = '<ol class="wp-stops">' + tr.stops.map(function (s, i) { var p = CK.prop(s.pid), st = stopState(s, t); return '<li class="s-' + st + '"><span class="wp-n">' + (st === 'togo' || st === 'here' ? i + 1 : '✓') + '</span><span class="wp-sc"><b>' + p.code + '</b> ' + esc(CK.area(p.area).short) + '</span><span class="wp-st">' + (st === 'togo' ? hm(s.a) : st === 'here' ? 'here now' : (OUT[st] || st)) + '</span></li>'; }).join('') + '</ol>';
    }
    return '<div class="wp" role="group" aria-label="' + esc(first(ag.name)) + '’s phone at ' + hm(t) + '"><div class="wp-top"><span>' + hmShort(t) + '</span><span>4G ▮▮▮</span></div><div class="wp-h">' + CK.av(ag) + '<div><b>Namaste, ' + esc(first(ag.name)) + '</b><small>' + esc(day.name) + ' · ' + esc(ag.title.replace('Field agent · ', '')) + '</small></div><span class="wp-sync">Synced</span></div><div class="wp-now">' + now + '</div>' + list + '<div class="wp-nav"><span class="on">Today</span><span>Trips</span><span class="wp-cap">+</span><span>Checks</span><span>Report</span></div></div>';
  }

  /* ---------- the lead at minute t ---------- */
  var STEPS = ['New', 'Contacted', 'Requirement', 'Matched', 'Visit', 'Deal'];
  function leadCard(day, id, t, link) {
    var L = CK.lead(id), evs = day.events.filter(function (e) { return e.lead === id && e.t <= t; }), stage = 0;
    evs.forEach(function (e) { if (e.k === 'call' && e.ok) stage = Math.max(stage, 1); if (e.k === 'brief') stage = Math.max(stage, 2); if (e.k === 'match') stage = Math.max(stage, 3); if (e.k === 'plan' || e.k === 'outcome') stage = Math.max(stage, 4); if (e.k === 'token') stage = 5; });
    var msg = day.firstMsg[id];
    return '<div class="wl">' + '<div class="wl-h">' + CK.av(L) + '<div><b>' + esc(L.name) + '</b><small>' + esc(L.src) + ' · ' + (evs[0] ? hm(evs[0].t) : '') + '</small></div></div>' + (msg ? '<p class="wl-msg">' + esc(msg) + '</p>' : '') + '<p class="wl-w">' + L.req.bhk.join('/') + ' BHK · ' + (L.intent === 'rent' ? 'rent' : 'buy') + ' ≤ ' + CK.budget(L) + ' · ' + esc(L.req.sectors.slice(0, 3).map(function (s) { return CK.area(s).short; }).join(', ')) + '</p>' +
      '<ol class="wl-steps" aria-label="Stage: ' + STEPS[stage] + '">' + STEPS.map(function (s, i) { return '<li class="' + (i < stage ? 'd' : i === stage ? 'c' : '') + '"><i></i><span>' + s + '</span></li>'; }).join('') + '</ol>' +
      '<ol class="wl-tl">' + evs.slice(-4).reverse().map(function (e) { return '<li><time>' + hm(e.t) + '</time><span>' + esc(e.text) + '</span></li>'; }).join('') + '</ol>' + (link ? '<a class="btn sm" href="' + link + '">Open in Fieldwise' + ic('ext', 14) + '</a>' : '') + '</div>';
  }

  /* ---------- the wall ---------- */
  var IC = { lead: 'sparkles', assign: 'users', call: 'phone', brief: 'sliders', match: 'target', plan: 'route', start: 'nav', checkin: 'pin', outcome: 'check', owner: 'chat', nego: 'deal', token: 'rupee', trip: 'route' };
  P.mount = function (root, opts) {
    opts = opts || {}; var variant = opts.variant || 'stage', live = !!opts.live;
    var day = opts.day(), t = opts.t != null ? opts.t : day.show, playing = false, speed = 1, raf = 0, last = 0, k = 1, mapEl, svg, nodes, feedSig = '', cardId = null, following = live, ro, iv, sub;
    var r = day.r, O = CK.xy(CK.REGIONS[r].office, r);
    root.classList.add('wall', 'w-' + variant);
    root.innerHTML = '<div class="w-map"></div>' + (variant === 'inline' ? '' :
      '<aside class="w-side" aria-label="What happened"><div class="w-count"></div><ol class="w-feed"></ol></aside>' +
      '<div class="w-bar"><button type="button" class="w-play" aria-label="Play the day" aria-pressed="false">' + ic('play', 18) + '</button><output class="w-clock" aria-hidden="true"></output>' +
      '<div class="w-track"><input type="range" class="w-range" min="' + day.from + '" max="' + day.to + '" step="1" aria-label="Time of day"><div class="w-beats">' + day.beats.map(function (b) { return '<button type="button" class="w-beat" data-t="' + b[0] + '" style="left:' + ((b[0] - day.from) / (day.to - day.from) * 100).toFixed(2) + '%" aria-label="Jump to ' + hm(b[0]) + ', ' + esc(b[1]) + '"><span>' + esc(b[1]) + '</span></button>'; }).join('') + '</div></div>' +
      '<button type="button" class="w-speed" aria-label="Playback speed">1×</button>' + (live ? '<button type="button" class="w-live on" aria-pressed="true">Live</button>' : '') + '</div>') +
      '<div class="w-card" hidden></div><p class="sr" aria-live="polite"></p>';
    mapEl = root.querySelector('.w-map');
    var range = root.querySelector('.w-range'), clock = root.querySelector('.w-clock'), playB = root.querySelector('.w-play'), feed = root.querySelector('.w-feed'), count = root.querySelector('.w-count'), card = root.querySelector('.w-card'), sr = root.querySelector('.sr'), speedB = root.querySelector('.w-speed'), liveB = root.querySelector('.w-live');

    function build() {
      var W = mapEl.clientWidth || 800, H = mapEl.clientHeight || 500, pts = [O];
      day.trips.forEach(function (tr) { tr.stops.forEach(function (s) { pts.push(CK.xy(CK.prop(s.pid), r)); }); });
      day.leads.forEach(function (l) { pts.push([l.x, l.y]); });
      if (day.hl) day.hl.pids.forEach(function (id) { pts.push(CK.xy(CK.prop(id), r)); });
      var ins = opts.inset ? opts.inset() : { l: 0, r: 0, t: 0, b: 0 }, aw = Math.max(200, W - ins.l - ins.r), ah = Math.max(200, H - ins.t - ins.b), v0 = fit(pts, aw / ah, 0, 260), v = fit(pts, aw / ah, (W < 500 ? 34 : 48) * v0[2] / aw, 260); k = v[2] / aw;
      var vb = [v[0] - ins.l * k, v[1] - ins.t * k, W * k, H * k];
      var ov = '<g class="w-ov">';
      ov += '<g class="w-dots">' + CK.S().props.filter(function (p) { return p.r === r && (p.status === 'available' || p.status === 'hold'); }).map(function (p) { var c = CK.xy(p, r); return '<circle cx="' + c[0].toFixed(0) + '" cy="' + c[1].toFixed(0) + '" r="' + (2.6 * k).toFixed(1) + '"/>'; }).join('') + '</g>';
      if (day.hl) ov += '<g class="w-hl">' + day.hl.pids.map(function (id, i) { var c = CK.xy(CK.prop(id), r); return '<g transform="translate(' + c[0].toFixed(0) + ' ' + c[1].toFixed(0) + ') scale(' + k.toFixed(3) + ')"><circle r="13"/><text y="4">' + (i + 1) + '</text></g>'; }).join('') + '</g>';
      ov += '<g class="w-routes">' + day.trips.map(function (tr) { var p = [O].concat(tr.stops.map(function (s) { return CK.xy(CK.prop(s.pid), r); })); return '<path class="w-route" data-trip="' + tr.id + '" d="' + pathThrough(p) + '" style="stroke-width:' + (3.6 * k).toFixed(2) + 'px;--dash:' + (7 * k).toFixed(1) + ' ' + (5 * k).toFixed(1) + '"/>'; }).join('') + '</g>';
      ov += '<g class="w-stops">' + day.trips.map(function (tr) { return tr.stops.map(function (s, i) { var c = CK.xy(CK.prop(s.pid), r); return '<g class="w-stop" data-trip="' + tr.id + '" data-i="' + i + '" transform="translate(' + c[0].toFixed(0) + ' ' + c[1].toFixed(0) + ') scale(' + k.toFixed(3) + ')"><circle r="10"/><text y="4">' + (i + 1) + '</text></g>'; }).join(''); }).join('') + '</g>';
      ov += '<g class="w-leads">' + day.leads.map(function (l) { return '<g class="w-lead" data-lead="' + l.id + '" tabindex="0" role="button" aria-label="' + esc(l.src + ' · ' + first(l.name) + ': new lead, ' + l.name + ', ' + hm(l.t)) + '" transform="translate(' + l.x.toFixed(0) + ' ' + l.y.toFixed(0) + ') scale(' + k.toFixed(3) + ')"><path d="M0 0C-5-7-9-11-9-16a9 9 0 1 1 18 0c0 5-4 9-9 16z"/><circle cy="-16" r="3.4"/><g class="w-lbl"><rect x="12" y="-30" rx="6" height="20" width="' + (esc(l.src + ' · ' + first(l.name)).length * 6.4 + 14).toFixed(0) + '"/><text x="19" y="-16">' + esc(l.src + ' · ' + first(l.name)) + '</text></g></g>'; }).join('') + '</g>';
      ov += '<g class="w-fx"></g>';
      if (day.token && day.token.pid) { var tc = CK.xy(CK.prop(day.token.pid), r); ov += '<g class="w-token" transform="translate(' + tc[0].toFixed(0) + ' ' + tc[1].toFixed(0) + ') scale(' + k.toFixed(3) + ')"><circle r="17"/><text y="5">₹</text><g class="w-lbl on"><rect x="20" y="-12" rx="6" height="22" width="122"/><text x="28" y="3">Token ' + esc(CK.money(day.token.amt, true)) + ' · blocked</text></g></g>'; }
      var agents = []; day.trips.forEach(function (tr) { if (agents.indexOf(tr.agent) < 0) agents.push(tr.agent); });
      ov += '<g class="w-agents">' + agents.map(function (a) { var A = CK.agent(a); return '<g class="w-agent" data-agent="' + a + '" tabindex="0" role="button" aria-label="' + esc(CK.initials(A.name) + ', ' + A.name) + '’s phone"><circle class="w-halo" r="20"/><circle r="12.5"/><text y="4">' + esc(CK.initials(A.name)) + '</text></g>'; }).join('') + '</g></g>';
      mapEl.innerHTML = CK.map(r, { vb: vb, overlay: ov, label: opts.label || ('Map of ' + day.name + ' in ' + CK.REGIONS[r].name) });
      svg = mapEl.querySelector('svg');
      nodes = { routes: {}, stops: {}, leads: {}, agents: {}, hl: svg.querySelector('.w-hl'), token: svg.querySelector('.w-token'), fx: svg.querySelector('.w-fx') };
      svg.querySelectorAll('.w-route').forEach(function (n) { nodes.routes[n.dataset.trip] = n; });
      svg.querySelectorAll('.w-stop').forEach(function (n) { (nodes.stops[n.dataset.trip] = nodes.stops[n.dataset.trip] || [])[+n.dataset.i] = n; });
      svg.querySelectorAll('.w-lead').forEach(function (n) { nodes.leads[n.dataset.lead] = n; });
      svg.querySelectorAll('.w-agent').forEach(function (n) { nodes.agents[n.dataset.agent] = n; });
      feedSig = ''; update(t, true);
    }
    function fx(xy, cls) { if (reduce() || !nodes) return; var g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'w-ping ' + cls); g.setAttribute('transform', 'translate(' + xy[0].toFixed(0) + ' ' + xy[1].toFixed(0) + ') scale(' + k.toFixed(3) + ')'); g.innerHTML = '<circle r="10"/>'; nodes.fx.appendChild(g); setTimeout(function () { g.remove(); }, 1100); }
    function crossed(prev, now) {
      if (now <= prev) return;
      day.events.forEach(function (e) {
        if (e.t <= prev || e.t > now) return;
        if (e.k === 'call' && nodes.leads[e.lead]) { var l = day.leads.filter(function (x) { return x.id === e.lead; })[0]; if (l) fx([l.x, l.y - 16 * k], 'call'); }
        if (e.k === 'checkin') { var tr = day.trips.filter(function (x) { return x.id === e.trip; })[0]; fx(CK.xy(CK.prop(tr.stops[e.i].pid), r), 'gate'); }
        if (e.k === 'token' && day.token && day.token.pid) { var c = CK.xy(CK.prop(day.token.pid), r); fx(c, 'token'); setTimeout(function () { fx(c, 'token'); }, 260); setTimeout(function () { fx(c, 'token'); }, 520); }
      });
      day.beats.forEach(function (b) { if (b[0] > prev && b[0] <= now) sr.textContent = hm(b[0]) + ' — ' + b[1]; });
    }
    function update(tt, force) {
      t = Math.max(day.from, Math.min(day.to, tt));
      if (!nodes) return;
      day.leads.forEach(function (l) { var n = nodes.leads[l.id]; if (!n) return; var on = t >= l.t; n.style.display = on ? '' : 'none'; n.classList.toggle('fresh', on && t - l.t < 24); n.classList.toggle('called', day.events.some(function (e) { return e.k === 'call' && e.ok && e.lead === l.id && e.t <= t; })); });
      day.trips.forEach(function (tr) {
        var rt = nodes.routes[tr.id], vis = t >= tr.plan; rt.style.display = vis ? '' : 'none'; rt.classList.toggle('planned', t < tr.start); rt.classList.toggle('done', t >= tr.end);
        (nodes.stops[tr.id] || []).forEach(function (n, i) { var s = tr.stops[i], st = stopState(s, t); n.style.display = vis ? '' : 'none'; n.setAttribute('class', 'w-stop s-' + st); n.querySelector('text').textContent = st === 'togo' || st === 'here' ? i + 1 : st === 'rejected' || st === 'notavail' || st === 'novisit' ? '×' : '✓'; });
      });
      if (nodes.hl) nodes.hl.style.display = day.hl && t >= day.hl.from && t < day.hl.to ? '' : 'none';
      if (nodes.token) nodes.token.style.display = day.token && t >= day.token.t ? '' : 'none';
      var atOffice = 0;
      Object.keys(nodes.agents).forEach(function (a) {
        var trs = day.trips.filter(function (x) { return x.agent === a; }), cur = trs.filter(function (x) { return t >= x.start && t < x.back; })[0], pos = cur ? track(cur, t, O) : { xy: O, st: 'office' }, n = nodes.agents[a];
        var xy = pos.xy; if (pos.st === 'office' || pos.st === 'back') { var ang = atOffice++ * 2.1 + .6; xy = [O[0] + Math.cos(ang) * 26 * k, O[1] + Math.sin(ang) * 26 * k]; }
        n.setAttribute('transform', 'translate(' + xy[0].toFixed(1) + ' ' + xy[1].toFixed(1) + ') scale(' + k.toFixed(3) + ')'); n.setAttribute('class', 'w-agent a-' + pos.st);
      });
      if (clock) clock.textContent = hm(t);
      if (range) { range.value = Math.round(t); range.setAttribute('aria-valuetext', hm(t)); range.style.setProperty('--p', ((t - day.from) / Math.max(1, day.to - day.from) * 100).toFixed(2) + '%'); }
      if (feed) {
        var evs = day.events.filter(function (e) { return e.t <= t; }), sig = evs.length + ':' + Math.round(t / 30);
        if (sig !== feedSig || force) {
          feedSig = sig;
          feed.innerHTML = evs.slice(-7).reverse().map(function (e) { return '<li><button type="button" data-et="' + e.t + '"><time>' + hm(e.t) + '</time>' + ic(IC[e.k] || 'spark', 14) + '<span>' + esc(e.text) + '</span></button></li>'; }).join('') || '<li class="w-empty">' + (live ? 'Nothing yet today.' : 'The day starts at 9:00. Press play.') + '</li>';
          var c = { leads: 0, calls: 0, visits: 0, checks: 0, tokens: 0 };
          evs.forEach(function (e) { if (e.k === 'lead') c.leads++; if (e.k === 'call') c.calls++; if (e.k === 'token') c.tokens++; if (e.k === 'outcome') { var tr = day.trips.filter(function (x) { return x.id === e.trip; })[0]; if (tr && tr.kind === 'verify') c.checks++; else c.visits++; } if (e.k === 'trip' && /checked in/i.test(e.text)) c.visits++; });
          count.innerHTML = [['Leads in', c.leads], ['Calls', c.calls], ['Visits', c.visits], ['Checks', c.checks], ['Tokens', c.tokens]].map(function (x) { return '<span><b>' + x[1] + '</b>' + x[0] + '</span>'; }).join('');
        }
      }
      root.querySelectorAll('.w-beat').forEach(function (b) { b.classList.toggle('past', +b.dataset.t <= t); });
      if (cardId) renderCard();
    }
    function rate() { var near = day.beats.some(function (b) { return Math.abs(b[0] - t) < 7; }); return (near ? 4.5 : 15) * speed; }
    function frame(ts) {
      if (!playing) return; var dt = Math.min(.1, (ts - last) / 1000); last = ts; var prev = t, nt = t + dt * rate();
      if (nt >= day.to) { nt = day.to; crossed(prev, nt); update(nt); stop(); if (live) setFollow(true); return; }
      crossed(prev, nt); update(nt); raf = requestAnimationFrame(frame);
    }
    function play() { if (t >= day.to - .5) { update(day.from, true); } playing = true; setFollow(false); last = performance.now(); if (playB) { playB.innerHTML = ic('pause', 18); playB.setAttribute('aria-label', 'Pause'); playB.setAttribute('aria-pressed', 'true'); } root.classList.add('playing'); raf = requestAnimationFrame(frame); }
    function stop() { playing = false; cancelAnimationFrame(raf); if (playB) { playB.innerHTML = ic('play', 18); playB.setAttribute('aria-label', 'Play the day'); playB.setAttribute('aria-pressed', 'false'); } root.classList.remove('playing'); }
    function setFollow(on) { following = on && live; if (liveB) { liveB.classList.toggle('on', following); liveB.setAttribute('aria-pressed', String(following)); } }
    function renderCard() {
      if (!cardId) { card.hidden = true; return; }
      var kind = cardId.split(':')[0], id = cardId.split(':')[1];
      card.innerHTML = '<button type="button" class="w-x" aria-label="Close">' + ic('x', 16) + '</button>' + (kind === 'agent' ? phone(day, id, t) : leadCard(day, id, t, opts.leadLink ? opts.leadLink(id) : null));
      card.hidden = false;
    }
    function open(kind, id) { if (kind === 'lead' && opts.onLead) { opts.onLead(id); return; } stop(); cardId = kind + ':' + id; renderCard(); var x = card.querySelector('.w-x'); if (x) x.focus(); }
    root.addEventListener('click', function (e) {
      var a = e.target.closest('[data-agent]'), l = e.target.closest('[data-lead]'), b = e.target.closest('button');
      if (a) return open('agent', a.dataset.agent);
      if (l) return open('lead', l.dataset.lead);
      if (!b) return;
      if (b.classList.contains('w-x')) { cardId = null; renderCard(); return; }
      if (b === playB) return playing ? stop() : play();
      if (b === speedB) { speed = speed === 1 ? 2 : 1; speedB.textContent = speed + '×'; return; }
      if (b === liveB) { stop(); setFollow(true); day = opts.day(); update(day.to, true); return; }
      if (b.dataset.t) { stop(); setFollow(false); update(+b.dataset.t, true); return; }
      if (b.dataset.et) { stop(); setFollow(false); update(+b.dataset.et, true); }
    });
    root.addEventListener('keydown', function (e) {
      var g = e.target.closest('[data-agent],[data-lead]');
      if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
      if (e.key === 'Escape' && cardId) { cardId = null; renderCard(); }
    });
    if (range) range.addEventListener('input', function () { stop(); setFollow(false); update(+range.value, true); });
    if (opts.beatButtons) opts.beatButtons.forEach(function (b) { b.addEventListener('click', function () { stop(); setFollow(false); update(+b.dataset.beat, true); var p = root.querySelector('.w-play'); if (p) p.focus({ preventScroll: true }); }); });
    if (window.ResizeObserver) { var rt = 0; ro = new ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(build, 120); }); ro.observe(mapEl); }
    build();
    if (live) { iv = setInterval(function () { if (playing) return; var was = day.to; day = opts.day(); if (range) range.max = day.to; if (following || t >= was - .5) { t = day.to; } build(); }, 20000); sub = function () { if (playing) return; day = opts.day(); if (range) range.max = day.to; if (following) t = day.to; build(); }; if (opts.subscribe) CK.on(sub); }
    return { play: play, pause: stop, set: function (x) { stop(); update(x, true); }, get t() { return t; }, day: function () { return day; }, destroy: function () { stop(); clearInterval(iv); if (ro) ro.disconnect(); if (sub) CK.off(sub); root.innerHTML = ''; } };
  };

  /* ---------- the app: Open the wall (full screen, live) ---------- */
  P.openWall = function () {
    if (document.getElementById('wallov')) return; var back = document.activeElement;
    var ov = document.createElement('div'); ov.id = 'wallov'; ov.className = 'wall-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'wall-t');
    var d = new Date(CK.now());
    ov.innerHTML = '<header class="wall-h"><h2 id="wall-t">Route wall</h2><span class="pill t-live">Live</span><span class="muted sm">' + CK.WD[d.getDay()] + ' ' + d.getDate() + ' ' + CK.MON[d.getMonth()] + ' · South Delhi · drag the time bar to replay today</span><span class="grow"></span><button type="button" class="btn sm" data-wall-x>' + ic('x', 15) + 'Close</button></header><div class="wall-root"></div>';
    document.body.appendChild(ov);
    var ctl = P.mount(ov.querySelector('.wall-root'), { day: P.fromStore, variant: 'full', live: true, subscribe: true, label: 'Route wall: today in South Delhi', onLead: function (id) { close(); CK.peek('lead', id); } });
    function close() { ctl.destroy(); ov.remove(); document.removeEventListener('keydown', esc2, true); if (back && back.focus) back.focus(); }
    function esc2(e) { if (e.key === 'Escape' && !ov.querySelector('.w-card:not([hidden])')) { e.stopPropagation(); close(); } }
    document.addEventListener('keydown', esc2, true);
    ov.querySelector('[data-wall-x]').addEventListener('click', close); ov.querySelector('[data-wall-x]').focus();
  };

  /* ---------- the product page: Match it in front of me ---------- */
  function chip(txt, cls) { return '<span class="mx-r' + (cls ? ' ' + cls : '') + '">' + esc(txt) + '</span>'; }
  function reasons(m, b) {
    var out = [], w = m.why.map(function (x) { return x[1]; });
    var bud = w.filter(function (x) { return /budget|band/.test(x); })[0];
    if (bud) out.push(/^Well under/.test(bud) ? chip('well under budget', 'meh') : /over budget/.test(bud) ? chip(bud.replace(' — close', ''), 'meh') : /\d+% under/.test(bud) ? chip(bud.match(/\d+% under/)[0] + ' budget', 'ok') : chip('within 10% of budget', 'ok'));
    var age = CK.verAge(m.p);
    if (CK.ver(m.p) === 'fresh') out.push(chip(age === 0 ? 'verified today' : age === 1 ? 'verified yesterday' : 'verified ' + age + ' days ago', 'ok')); else out.push(chip(CK.ver(m.p) === 'pending' ? 'not verified yet' : 'check due', 'meh'));
    if (b.school) { var d = CK.poiDist(m.p, 'school'); out.push(chip('school ' + (d < 1000 ? Math.max(100, Math.round(d / 50) * 50) + ' m' : (d / 1000).toFixed(1) + ' km'), d <= 1000 ? 'ok' : 'meh')); }
    var free = w.filter(function (x) { return /^Free/.test(x); })[0]; if (free && out.length < 4) out.push(chip(free.toLowerCase(), /after|only/.test(free) ? 'meh' : 'ok'));
    return out.slice(0, 4).join('');
  }
  P.mxModel = function (text) {
    var b = CK.parseBrief(text), r = b.r || 'sd', m = { text: text, b: b, r: r, top: [], ordered: [], legs: [], etas: [], visit: CK.S().settings.visitMinutes };
    if (!b.sectors.length) { m.err = 'Add a colony or sector, for example Vasant Vihar, GK II or Sector 54.'; return m; }
    var L = CK.briefLead(b), ms = CK.matches(L, 45);
    if (b.school) { ms.forEach(function (x) { var d = CK.poiDist(x.p, 'school'); x.rank = x.score + (d <= 1000 ? 4 : d > 2000 ? -3 : 0); }); ms.sort(function (x, y) { return y.rank - x.rank; }); }
    m.L = L; m.top = ms.slice(0, 6);
    if (!m.top.length) { m.err = 'No verified home fits yet. Widen the budget or add a neighbouring colony.'; return m; }
    var O = CK.REGIONS[r].office, tm = 870, prev = O;
    m.ordered = CK.orderStops(O, m.top.slice(0, 3).map(function (x) { return x.p; }));
    m.ordered.forEach(function (p) { var l = CK.legMin(prev, p); m.legs.push(l); tm += l; m.etas.push(tm); tm += m.visit; prev = p; });
    m.drive = m.legs.reduce(function (x, y) { return x + y; }, 0); m.backBy = tm + CK.legMin(prev, O);
    return m;
  };
  P.mxParsed = function (m) { return m.b.chips.map(function (c, i) { return '<span class="mx-p" style="--i:' + i + '">' + esc(c) + '</span>'; }).join(''); };
  P.mxRow = function (m, i, final) { var x = m.top[i], oi = m.ordered.indexOf(x.p), pick = final && oi >= 0; return '<li class="mx-h' + (pick ? ' pick' : '') + '" data-pid="' + x.p.id + '"><img src="' + CK.ph(x.p.photos[0], 1) + '" alt="" width="56" height="44" loading="lazy" decoding="async"><div class="mx-hb"><div class="mx-ht">' + (pick ? stopBadge(oi) : '') + '<b>' + x.p.code + '</b><span class="mx-ar">' + esc(CK.area(x.p.area).short) + '</span><span class="grow"></span><b>' + CK.price(x.p) + '</b><span class="mx-sc">' + x.score + '%</span></div><p>' + esc(CK.cfg(x.p)) + ' · ' + esc(x.p.floor) + '</p><div class="mx-rs">' + reasons(x, m.b) + '</div></div></li>'; };
  function stopBadge(i) { return '<i class="mx-stop">' + (i + 1) + '</i>'; }
  P.mxRows = function (m, final) { return m.err ? '<li class="mx-empty">' + esc(m.err) + '</li>' : m.top.map(function (x, i) { return P.mxRow(m, i, final); }).join(''); };
  P.mxTrip = function (m, lbl) { if (m.err) return ''; return '<div class="mx-tt"><b>' + (lbl ? lbl + ', ' : 'Starts ') + hm(870) + '</b><span>' + m.ordered.length + ' homes · ' + m.drive + ' min driving · back by ' + hm(m.backBy) + '</span></div><ol class="mx-etas">' + m.ordered.map(function (p, i) { return '<li><i>' + (i + 1) + '</i><time>' + hm(m.etas[i]) + '</time>' + p.code + '</li>'; }).join('') + '</ol><button type="button" class="btn primary mx-open">Open this in Fieldwise' + ic('arrow', 15) + '</button>'; };
  P.mxMap = function (m, W, H, final, ins) {
    ins = ins || { l: 0, r: 0, t: 0, b: 0 };
    var r = m.r, O = CK.xy(CK.REGIONS[r].office, r), pts = [O].concat(m.top.map(function (x) { return CK.xy(x.p, r); })), iw = Math.max(200, W - ins.l - ins.r), ih = Math.max(160, H - ins.t - ins.b), minW = iw < 500 ? 230 : 300, v0 = fit(pts, iw / ih, 0, minW), vb = fit(pts, iw / ih, (iw < 500 ? 40 : 52) * v0[2] / iw, minW), k = vb[2] / iw, deal = m.b.intent === 'buy' ? 'sale' : 'rent';
    vb = [vb[0] - ins.l * k, vb[1] - ins.t * k, W * k, H * k];
    var ov = '<g class="w-ov"><g class="w-dots">' + CK.S().props.filter(function (p) { return p.r === r && p.deal === deal && p.status === 'available'; }).map(function (p) { var c = CK.xy(p, r); return '<circle cx="' + c[0].toFixed(0) + '" cy="' + c[1].toFixed(0) + '" r="' + (3 * k).toFixed(1) + '"/>'; }).join('') + '</g>';
    if (m.b.school) ov += '<g class="mx-schools">' + (CK.POIS || []).filter(function (q) { return q.k === 'school'; }).map(function (q) { var c = CK.xy(q, r); return '<g transform="translate(' + c[0].toFixed(0) + ' ' + c[1].toFixed(0) + ') scale(' + k.toFixed(3) + ')"><rect x="-6" y="-6" width="12" height="12" rx="2"/><path d="M-3 1h6M0-3v7"/></g>'; }).join('') + '</g>';
    if (m.ordered.length) {
      var p = [O].concat(m.ordered.map(function (x) { return CK.xy(x, r); }));
      var rid = 'mxr' + (P._rid = (P._rid || 0) + 1);
      ov += '<path class="mx-route' + (final ? ' draw' : '') + '" id="' + rid + '" pathLength="1000" d="' + pathThrough(p) + '" style="stroke-width:' + (3.6 * k).toFixed(2) + 'px"/>';
      var car = '<g class="mx-car" aria-hidden="true"><animateMotion dur="' + Math.max(7, m.drive / 3.2).toFixed(1) + 's" begin="0s" repeatCount="indefinite" calcMode="spline" keyPoints="0;1;1" keyTimes="0;.88;1" keySplines=".45 0 .55 1;0 0 1 1"><mpath href="#' + rid + '"/></animateMotion><g transform="scale(' + k.toFixed(3) + ')"><circle class="mx-halo" r="19"/><circle r="11.5"/><text y="3.6">' + esc(CK.initials((CK.agent(m.L && m.L.field) || CK.agent('A6') || { name: 'Field agent' }).name)) + '</text></g></g>';
      ov += m.legs.map(function (l, i) { var c = bez(p[i], p[i + 1], .5); if (Math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]) / k < 72) return ''; return '<g class="mx-leg' + (final ? ' on' : '') + '" transform="translate(' + c[0].toFixed(0) + ' ' + c[1].toFixed(0) + ') scale(' + k.toFixed(3) + ')"><rect x="-21" y="-11" width="42" height="22" rx="11"/><text y="4">' + l + ' min</text></g>'; }).join('');
    }
    ov += '<g class="mx-pins">' + m.top.map(function (x, i) { var c = CK.xy(x.p, r), oi = m.ordered.indexOf(x.p), pick = final && oi >= 0; return '<g class="mx-pin' + (final ? ' on' : '') + (pick ? ' pick' : '') + '" data-mx="' + x.p.id + '" transform="translate(' + c[0].toFixed(0) + ' ' + c[1].toFixed(0) + ') scale(' + k.toFixed(3) + ')"><circle class="mx-ring" r="17"/><circle r="11"/><text y="4">' + (pick ? oi + 1 : '') + '</text><text class="mx-code" y="-19">' + x.p.code + '</text></g>'; }).join('') + '</g>' + (m.ordered.length ? car : '') + '</g>';
    return CK.map(r, { vb: vb, overlay: ov, label: 'Homes that match the brief, and the route through the top three' });
  };
  P.match = function (root, opts) {
    opts = opts || {};
    var form = root.querySelector('form'), q = root.querySelector('input'), mapEl = root.querySelector('.mx-map'), list = root.querySelector('.mx-list'), parsed = root.querySelector('.mx-parsed'), tripEl = root.querySelector('.mx-trip'), timers = [], last = null;
    function later(fn, ms) { if (reduce()) fn(); else timers.push(setTimeout(fn, ms)); }
    function startAt() { var n = new Date(CK.now()), s = CK.dayStart(n.getTime()) + 14.5 * 36e5; return n.getHours() < 13 ? { ms: s, lbl: 'Today' } : { ms: s + CK.DAY, lbl: 'Tomorrow' }; }
    function run(text) {
      timers.forEach(clearTimeout); timers = []; last = null;
      var m = P.mxModel(text), st = startAt(), ins = opts.inset && opts.inset();
      root.classList.remove('done', 'picked', 'pre'); root.classList.add('running');
      parsed.innerHTML = P.mxParsed(m); tripEl.innerHTML = ''; list.innerHTML = '';
      mapEl.innerHTML = P.mxMap(m, mapEl.clientWidth || 640, mapEl.clientHeight || 340, reduce(), ins);
      if (m.err) { list.innerHTML = P.mxRows(m); root.classList.remove('running'); return; }
      m.top.forEach(function (x, i) { later(function () { var pin = mapEl.querySelector('[data-mx="' + x.p.id + '"]'); if (pin) pin.classList.add('on'); list.insertAdjacentHTML('beforeend', P.mxRow(m, i, reduce())); }, 240 + i * 200); });
      later(function () {
        root.classList.add('picked');
        m.ordered.forEach(function (p, i) { var pin = mapEl.querySelector('[data-mx="' + p.id + '"]'); if (pin) { pin.classList.add('pick'); pin.querySelector('text:not(.mx-code)').textContent = i + 1; } var li = list.querySelector('[data-pid="' + p.id + '"]'); if (li) { li.classList.add('pick'); li.querySelector('.mx-ht').insertAdjacentHTML('afterbegin', stopBadge(i)); } });
        var route = mapEl.querySelector('.mx-route'); if (route) { route.getBoundingClientRect(); route.classList.add('draw'); }
      }, 240 + m.top.length * 200 + 350);
      later(function () {
        mapEl.querySelectorAll('.mx-leg').forEach(function (g) { g.classList.add('on'); });
        tripEl.innerHTML = P.mxTrip(m, st.lbl);
        root.classList.remove('running'); root.classList.add('done');
        var am = mapEl.querySelector('.mx-car animateMotion'); if (am && am.beginElement) try { am.beginElement(); } catch (e) { /* no SMIL: the agent stays at the office */ }
        last = { m: m, start: st.ms };
      }, 240 + m.top.length * 200 + 350 + 1500);
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); var v = q.value.trim(); if (!v) { q.focus(); return; } run(v); });
    root.addEventListener('click', function (e) {
      var ex = e.target.closest('[data-brief]'); if (ex) { q.value = ex.dataset.brief; run(q.value); return; }
      if (e.target.closest('.mx-open')) {
        if (!last) { var m0 = P.mxModel(q.value); if (m0.err) return; last = { m: m0, start: startAt().ms }; }
        var m = last.m, Lr = CK.act.newLead({ name: 'Brief from the website', src: 'Website', found: 'Fieldwise page', intent: m.b.intent, req: m.L.req, reqDone: true });
        m.ordered.forEach(function (p) { CK.act.shortlist(Lr, p.id, true); });
        CK.act.planTrip({ agent: Lr.field, start: last.start, r: m.r, leads: [Lr.id], pids: m.ordered.map(function (p) { return p.id; }) });
        location.href = (opts.app || 'index.html') + '#/leads~lead:' + Lr.id;
      }
    });
    /* the finished match that came drawn into the page was fitted to one screen size: redraw it for this one, as it stands */
    function refit() {
      if (root.classList.contains('running')) return;
      var m = last ? last.m : P.mxModel(q.value); if (m.err) return;
      root.classList.remove('pre'); root.classList.add('done', 'picked');
      mapEl.innerHTML = P.mxMap(m, mapEl.clientWidth || 640, mapEl.clientHeight || 340, true, opts.inset && opts.inset());
    }
    return { run: run, refit: refit };
  };

  /* the hero's map runs behind the headline and the match cards: keep the pins clear of both */
  P.heroInset = function (mx) {
    var mapEl = mx.querySelector('.mx-map'), c = mx.querySelector('.hero-c'), l = mx.querySelector('.mx-list'), t = mx.querySelector('.mx-trip');
    if (!c || getComputedStyle(mapEl).position !== 'absolute') return { l: 0, r: 0, t: 0, b: 0 };
    var w = mapEl.getBoundingClientRect(), full = l && t && l.children.length && t.children.length, memo = P._hi && P._hi.w === innerWidth ? P._hi : null;
    // the ticket and the cards are emptied while a match runs: measure them when they are full, and remember
    var top = full ? Math.max(20, t.getBoundingClientRect().bottom - w.top + 8) : memo ? memo.t : 290, bot = full ? Math.max(0, w.bottom - l.getBoundingClientRect().top + 6) : memo ? memo.b : 208;
    if (full) P._hi = { w: innerWidth, t: top, b: bot };
    return { l: Math.max(0, c.getBoundingClientRect().right - w.left + 70), r: Math.max(20, w.right - c.parentNode.getBoundingClientRect().right + 14), t: top, b: bot };
  };

  /* ---------- the product page: wire the matcher and the day ---------- */
  P.productInit = function (o) {
    o = o || {}; CK.load();
    var mx = document.getElementById('match'), dayEl = document.getElementById('day-wall'), out = {};
    if (mx) {
      var mapEl = mx.querySelector('.mx-map');
      out.match = P.match(mx, { inset: function () { return P.heroInset(mx); } });
      var rz = 0, lastW = innerWidth; addEventListener('resize', function () { if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rz); rz = setTimeout(out.match.refit, 160); });
      var pa = (mapEl.querySelector('svg') && mapEl.dataset.pre || '').split('x'), cw = mapEl.clientWidth, ch = mapEl.clientHeight;
      if (pa.length < 2 || Math.abs(cw / ch - pa[0] / pa[1]) > .04 * (pa[0] / pa[1]) || Math.abs(cw - pa[0]) > 160) { if (mx.classList.contains('pre') && !reduce()) setTimeout(out.match.refit, Math.max(0, 3400 - performance.now())); else out.match.refit(); }
      if (o.autorun) { var q = mx.querySelector('input'); out.match.run(q.value); }
    }
    if (dayEl) {
      var beats = [].slice.call(document.querySelectorAll('[data-beat]'));
      out.day = P.mount(dayEl, { day: P.fromScript, variant: 'stage', label: 'One Tuesday in South Delhi, minute by minute', beatButtons: beats, leadLink: function (id) { return 'index.html#/leads~lead:' + id; }, inset: function () {
        if (innerWidth <= 900) return { l: 0, r: 0, t: 0, b: 0 };
        var w = dayEl.getBoundingClientRect(), a = document.querySelector('.day-intro'), s = dayEl.querySelector('.w-side'), b = dayEl.querySelector('.w-bar');
        return { l: a ? Math.max(0, a.getBoundingClientRect().right - w.left + 18) : 420, r: s ? Math.max(0, w.right - s.getBoundingClientRect().left + 18) : 330, t: 30, b: b ? Math.max(0, w.bottom - b.getBoundingClientRect().top + 14) : 104 };
      } });
      var pb = document.getElementById('play-day');
      if (pb) pb.addEventListener('click', function () { out.day.play(); var bar = dayEl.querySelector('.w-play'); if (bar) bar.focus({ preventScroll: true }); });
    }
    return out;
  };
})();
