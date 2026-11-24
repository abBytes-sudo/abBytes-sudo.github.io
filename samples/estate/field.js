/* Chaukhat Field — the agent's phone app. Same store as the CRM (live via the storage event), big touch targets, offline queue. */
(function () {
  'use strict';
  var CK = window.CK, esc = CK.esc, ic = CK.ic;
  var FKEY = 'chaukhat-field-v1', F = {};
  try { F = JSON.parse(localStorage.getItem(FKEY)) || {}; } catch (e) { }
  F.agent = F.agent || 'A6'; F.queue = F.queue || []; F.duty = F.duty || null; F.offline = !!F.offline; F.shots = F.shots || {};
  function saveF() { try { localStorage.setItem(FKEY, JSON.stringify(F)); } catch (e) { } }
  CK.me = function () { return CK.agent(F.agent); };
  CK.saveUI = function () { };
  CK.ui.role = 'field';
  function S() { return CK.S(); }
  function me() { return CK.agent(F.agent); }
  function myTrips() { return S().trips.filter(function (t) { return t.agent === F.agent && t.status !== 'cancelled'; }); }
  function todayTrips() { var d = CK.dayStart(CK.now()); return myTrips().filter(function (t) { return CK.dayStart(t.start) === d; }).sort(function (a, b) { return a.start - b.start; }); }
  function nextStop() { var out = null; todayTrips().some(function (t) { if (t.status === 'done') return false; return t.stops.some(function (s, i) { if (s.st === 'here' || s.st === 'togo') { out = { t: t, i: i, s: s }; return true; } return false; }); }); return out; }

  /* ---------- offline queue: actions wait on the phone until the signal is back ---------- */
  function run(k, a) {
    var t = CK.trip(a.t);
    if (k === 'checkIn') CK.act.checkIn(t, a.i, a.m);
    if (k === 'photo') CK.act.photo(t, a.i, a.n);
    if (k === 'outcome') CK.act.outcome(t, a.i, a.out, a.note);
    if (k === 'verify') { var p = CK.prop(a.p); CK.act.verify(p, a.checks, a.ok, a.reason, F.agent); if (a.t) CK.act.outcome(t, a.i, { verify: { v: a.ok ? 'verified' : 'notavail' } }, a.reason || ''); }
  }
  function doAct(k, a, msg) {
    if (F.offline) { F.queue.push({ k: k, a: a, at: Date.now() }); saveF(); toast(msg + ' · saved on phone, will sync', 'offline'); render(); return; }
    run(k, a); toast(msg);
  }
  function setOffline(on) {
    F.offline = on; saveF();
    if (!on && F.queue.length) { var n = F.queue.length; F.queue.forEach(function (q) { try { run(q.k, q.a); } catch (e) { } }); F.queue = []; saveF(); toast('Back online · ' + n + ' update' + (n > 1 ? 's' : '') + ' synced to the office', 'sync'); }
    render();
  }
  function toast(m, icn) { CK.toast(m, { icon: icn === 'offline' ? 'offline' : icn === 'sync' ? 'check' : 'check' }); }

  /* ---------- screens ---------- */
  var R = {};
  function header(title, back, sub) {
    return '<header class="fh">' + (back ? '<a class="fbtn-ic" href="' + back + '" aria-label="Back">' + ic('left', 22) + '</a>' : '<button type="button" class="fme" data-f="who" aria-label="Switch agent">' + CK.av(me(), 'l') + '</button>') + '<div class="fh-t"><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><button type="button" class="net' + (F.offline ? ' off' : '') + '" data-f="net" aria-pressed="' + F.offline + '" aria-label="' + (F.offline ? 'Offline — tap to reconnect' : 'Online — tap to work offline') + '">' + ic(F.offline ? 'offline' : 'check', 15) + '<span>' + (F.offline ? 'Offline' + (F.queue.length ? ' · ' + F.queue.length : '') : 'Synced') + '</span></button></header>';
  }
  R.today = function () {
    var a = me(), d = new Date(CK.now()), ts = todayTrips(), nx = nextStop();
    var done = 0, total = 0, photos = 0; ts.forEach(function (t) { t.stops.forEach(function (s) { total++; if (s.st === 'done' || s.st === 'missed') done++; photos += s.photos || 0; }); });
    var duty = F.duty && CK.dayStart(F.duty) === CK.dayStart(CK.now());
    var h = header('Namaste, ' + a.name.split(' ')[0], null, CK.WD[d.getDay()] + ' ' + d.getDate() + ' ' + CK.MON[d.getMonth()] + ' · ' + esc(a.title.replace('Field agent · ', '')));
    h += '<section class="duty' + (duty ? ' on' : '') + '">' + (duty ? '<span class="dot-live"></span><div><b>On duty since ' + CK.time(F.duty) + '</b><small>Attendance marked at ' + esc(CK.REGIONS[a.zone || 'sd'].office.name) + ' · 18 m</small></div>' : '<div><b>Start your day</b><small>Marks attendance with your location</small></div><button type="button" class="fbtn sm" data-f="duty">' + ic('pin', 16) + 'Start day</button>') + '</section>';
    if (nx) {
      var p = CK.prop(nx.s.pid), here = nx.s.st === 'here';
      h += '<section class="now"><p class="now-k">' + (here ? 'You’re here' : 'Next stop') + ' · ' + nx.t.id + ' · stop ' + (nx.i + 1) + ' of ' + nx.t.stops.length + '</p><a class="now-c" href="#/stop/' + nx.t.id + '/' + nx.i + '"><img src="' + CK.ph(p.photos[0], 1) + '" alt="" width="88" height="66"><div><b>' + esc(p.plot) + ', ' + esc(CK.area(p.area).short) + '</b><span>' + esc(CK.cfg(p)) + ' · ' + esc(p.floor) + '</span><span class="muted">' + (here ? 'Checked in ' + CK.ago(nx.s.at) : 'ETA ' + CK.time(CK.schedule(nx.t).legs[nx.i].eta)) + '</span></div></a><div class="now-a">' + (here ? '<a class="fbtn" href="#/stop/' + nx.t.id + '/' + nx.i + '">' + ic('check', 18) + (nx.t.kind === 'verify' ? 'Verify' : 'Visit outcome') + '</a>' : '<button type="button" class="fbtn ghost" data-f="nav">' + ic('nav', 18) + 'Navigate</button><button type="button" class="fbtn" data-f="checkin" data-t="' + nx.t.id + '" data-i="' + nx.i + '">' + ic('pin', 18) + 'Check in</button>') + '</div></section>';
    } else h += '<section class="now done"><p class="now-k">All stops done</p><p>Nothing left on today’s trips. File your end-of-day report when you’re back.</p><a class="fbtn" href="#/report">' + ic('file', 18) + 'End-of-day report</a></section>';
    h += '<div class="fstats"><div><b>' + done + '<small>/' + total + '</small></b><span>stops</span></div><div><b>' + photos + '</b><span>photos</span></div><div><b>' + ts.length + '</b><span>trip' + (ts.length === 1 ? '' : 's') + '</span></div></div>';
    h += '<h2 class="fsh">Today’s trips</h2>' + (ts.length ? ts.map(tripCard).join('') : '<p class="fempty">No trips today. The office plans them; they appear here instantly.</p>');
    var up = myTrips().filter(function (t) { return t.start > CK.dayStart(CK.now()) + CK.DAY && t.status !== 'done'; }).slice(0, 3);
    if (up.length) h += '<h2 class="fsh">Coming up</h2>' + up.map(tripCard).join('');
    return h;
  };
  function tripCard(t) {
    var done = t.stops.filter(function (s) { return s.st === 'done' || s.st === 'missed'; }).length;
    return '<a class="ftrip" href="#/trip/' + t.id + '"><div class="ftrip-h"><b>' + CK.dayLabel(t.start) + ' · ' + CK.time(t.start) + '</b>' + CK.tripPill(t) + '</div><p>' + t.stops.length + ' homes · ' + (t.kind === 'verify' ? 'verification run' : t.leads.map(function (l) { return esc(CK.lead(l).name); }).join(', ')) + '</p><div class="prog"><span style="width:' + (done / t.stops.length * 100) + '%"></span></div><div class="ftrip-s">' + t.stops.map(function (s) { return '<i class="' + s.st + '"></i>'; }).join('') + '</div></a>';
  }
  R.trips = function () {
    var ts = myTrips().filter(function (t) { return t.status !== 'done' || t.start > CK.now() - 3 * CK.DAY; }).sort(function (a, b) { return a.start - b.start; });
    return header('My trips', null, ts.length + ' this week') + (ts.length ? ts.map(tripCard).join('') : '<p class="fempty">No trips yet.</p>');
  };
  R.trip = function (id) {
    var t = CK.trip(id); if (!t) return header('Trip', '#/today') + '<p class="fempty">Trip not found.</p>';
    var sch = CK.schedule(t);
    return header(t.id + (t.kind === 'verify' ? ' · checks' : ''), '#/today', CK.dayLabel(t.start) + ' · ' + CK.time(t.start) + ' · ' + t.stops.length + ' stops') +
      '<div class="fmap">' + CK.map(t.r, { stops: t.stops, legs: sch.legs.map(function (l) { return l.leg; }), label: 'Route', aspect: 1.25, pad: 90 }) + '</div>' +
      (t.kind === 'visit' ? '<div class="fclients">' + t.leads.map(function (l) { var L = CK.lead(l); return '<div class="fcl">' + CK.av(L) + '<div><b>' + esc(L.name) + '</b><small>' + esc(L.req.bhk.join('/') + ' BHK · ' + CK.budget(L) + ' · ' + L.req.family) + '</small></div><button type="button" class="fbtn-ic" data-f="call" aria-label="Call ' + esc(L.name) + '">' + ic('phone', 20) + '</button></div>'; }).join('') + '</div>' : '') +
      '<ol class="fstops">' + t.stops.map(function (s, i) { var p = CK.prop(s.pid); return '<li><a class="fstop st-' + s.st + '" href="#/stop/' + t.id + '/' + i + '"><span class="snum">' + (s.st === 'done' ? ic('check', 14) : i + 1) + '</span><img src="' + CK.ph(p.photos[0], 1) + '" alt="" width="60" height="46" loading="lazy"><div><b>' + esc(p.plot) + ', ' + esc(CK.area(p.area).short) + '</b><small>' + esc(CK.cfg(p)) + '</small><small class="' + (s.st === 'here' ? 'tx-live' : 'muted') + '">' + ({ togo: 'ETA ' + CK.time(sch.legs[i].eta), here: '● You’re here', done: 'Done', missed: 'Couldn’t get in' }[s.st]) + '</small></div>' + ic('right', 18) + '</a></li>'; }).join('') + '</ol>';
  };
  R.stop = function (id, idx) {
    var t = CK.trip(id), i = +idx, s = t && t.stops[i]; if (!s) return header('Stop', '#/today') + '<p class="fempty">Stop not found.</p>';
    var p = CK.prop(s.pid), o = CK.owner(p.ownerId), verify = t.kind === 'verify';
    var shots = F.shots[t.id + ':' + i] || [];
    var h = header('Stop ' + (i + 1) + ' of ' + t.stops.length, '#/trip/' + t.id, esc(p.code) + ' · ' + esc(CK.area(p.area).short));
    h += '<div class="fhero"><img src="' + CK.ph(p.photos[0]) + '" alt="' + esc(CK.cfg(p)) + '" width="375" height="230">' + (CK.ver(p) === 'fresh' ? '<span class="vbadge">' + ic('shield', 12) + 'Verified</span>' : '') + '</div>';
    h += '<section class="fcard"><h2>' + esc(p.plot) + ', ' + esc(CK.area(p.area).name) + '</h2><p>' + esc(CK.cfg(p)) + ' · ' + esc(p.floor) + ' · ' + CK.grp(p.sqft) + ' sq ft · <b>' + CK.price(p) + '</b></p><div class="fowner">' + CK.av(o) + '<div><b>' + esc(o.name) + '</b><small>' + esc(o.pref) + '</small></div><button type="button" class="fbtn-ic" data-f="call" aria-label="Call owner">' + ic('phone', 20) + '</button></div></section>';
    // step 1 check in
    var c1 = s.st !== 'togo';
    h += '<ol class="fsteps"><li class="' + (c1 ? 'ok' : 'cur') + '"><div class="fs-h"><span class="fs-n">' + (c1 ? ic('check', 14) : 1) + '</span><b>Check in at the gate</b></div>' + (c1 ? '<p class="muted">' + (s.at ? 'Checked in ' + CK.time(s.at) : 'Checked in') + ' · ' + (s.geo || 20) + ' m from the listing pin</p>' : '<p class="muted">Saves your location even with no signal.</p><button type="button" class="fbtn big" data-f="checkin" data-t="' + t.id + '" data-i="' + i + '">' + ic('pin', 20) + 'Check in here</button>') + '</li>';
    // step 2 photos
    var n = (s.photos || 0);
    h += '<li class="' + (n >= (verify ? 6 : 2) ? 'ok' : c1 ? 'cur' : '') + '"><div class="fs-h"><span class="fs-n">' + (n >= (verify ? 6 : 2) ? ic('check', 14) : 2) + '</span><b>Photos</b><span class="muted">' + n + (verify ? ' of 6+' : '') + '</span></div><div class="fshots">' + shots.map(function (u) { return '<img src="' + u + '" alt="Photo you took" width="72" height="72">'; }).join('') + p.photos.slice(1, 1 + Math.max(0, Math.min(n - shots.length, 5))).map(function (ph) { return '<img src="' + CK.ph(ph, 1) + '" alt="" width="72" height="72">'; }).join('') + '<label class="fshot-add"><input type="file" accept="image/*" capture="environment" multiple data-f="file" data-t="' + t.id + '" data-i="' + i + '"><span>' + ic('camera', 22) + 'Camera</span></label><button type="button" class="fshot-add" data-f="demoshots" data-t="' + t.id + '" data-i="' + i + '">' + ic('sparkles', 20) + '<span>Quick shots</span></button></div><p class="muted xs">Geo-tagged and time-stamped; they go straight onto the listing.</p></li>';
    // step 3 result
    if (verify) {
      var ck = F['ck:' + p.id] || {};
      var items = CK.CHECKLIST.filter(function (c) { return c.id !== 'docs' || p.deal === 'sale'; });
      var nd = items.filter(function (c) { return ck[c.id]; }).length;
      h += '<li class="' + (s.st === 'done' ? 'ok' : c1 ? 'cur' : '') + '"><div class="fs-h"><span class="fs-n">' + (s.st === 'done' ? ic('check', 14) : 3) + '</span><b>Verification checklist</b><span class="muted">' + nd + ' of ' + items.length + '</span></div>' + (s.st === 'done' ? '<p class="tx-ok">' + (s.out.verify && s.out.verify.v === 'notavail' ? 'Marked not available' : 'Verified — badge is on') + '</p>' : '<ul class="fcheck">' + items.map(function (c) { return '<li><button type="button" class="' + (ck[c.id] ? 'on' : '') + '" data-f="ck" data-p="' + p.id + '" data-c="' + c.id + '" aria-pressed="' + !!ck[c.id] + '"><span class="box">' + ic('check', 14) + '</span><span>' + esc(c.label) + '<small>' + esc(c.hint) + '</small></span></button></li>'; }).join('') + '</ul><p class="ferr" id="f-err" role="alert"></p><div class="frow"><button type="button" class="fbtn ghost" data-f="notavail" data-t="' + t.id + '" data-i="' + i + '">Not available</button><button type="button" class="fbtn" data-f="approve" data-t="' + t.id + '" data-i="' + i + '">' + ic('shield', 18) + 'Verified</button></div>') + '</li>';
    } else {
      h += '<li class="' + (s.st === 'done' || s.st === 'missed' ? 'ok' : c1 ? 'cur' : '') + '"><div class="fs-h"><span class="fs-n">' + (s.st === 'done' ? ic('check', 14) : 3) + '</span><b>Visit outcome</b></div>' + (s.st === 'done' || s.st === 'missed' ? '<div class="fouts">' + Object.keys(s.out).map(function (l) { var x = s.out[l], L = CK.lead(l); return L ? '<p>' + CK.av(L, 's') + esc(L.name.split(' ')[0]) + ' — ' + CK.pill({ liked: 'Liked', short: 'Shortlisted', rejected: 'Rejected · ' + (x.reason || ''), novisit: 'Not visited' }[x.v], { liked: 'green', short: 'violet', rejected: 'red', novisit: 'grey' }[x.v]) + '</p>' : ''; }).join('') + '<button type="button" class="fbtn ghost sm" data-f="outcome" data-t="' + t.id + '" data-i="' + i + '">Change</button></div>' : '<p class="muted">Liked, shortlisted or rejected — the owner gets the feedback.</p><button type="button" class="fbtn big" data-f="outcome" data-t="' + t.id + '" data-i="' + i + '">' + ic('check', 20) + 'Record outcome</button>') + '</li>';
    }
    h += '</ol>';
    var nxt = t.stops[i + 1];
    if (nxt && (s.st === 'done' || s.st === 'missed')) h += '<a class="fbtn big next-stop" href="#/stop/' + t.id + '/' + (i + 1) + '">Next stop · ' + esc(CK.prop(nxt.pid).plot) + ic('arrow', 18) + '</a>';
    return h;
  };
  R.verify = function () {
    var a = me(), list = S().props.filter(function (p) { var v = CK.ver(p); return (v === 'pending' || v === 'overdue' || v === 'due') && p.status !== 'let' && p.status !== 'sold' && (p.r === (a.zone || 'sd')); }).slice(0, 14);
    var vt = myTrips().filter(function (t) { return t.kind === 'verify' && t.status !== 'done'; });
    return header('Checks', null, list.length + ' listings due near you') + (vt.length ? '<h2 class="fsh">On a run</h2>' + vt.map(tripCard).join('') : '') + '<h2 class="fsh">Due for a check</h2><ul class="fver">' + list.map(function (p) { var v = CK.ver(p); return '<li><img src="' + CK.ph(p.photos[0], 1) + '" alt="" width="56" height="42" loading="lazy"><div><b>' + esc(p.code) + ' · ' + esc(CK.area(p.area).short) + '</b><small>' + esc(CK.cfg(p)) + '</small></div>' + CK.pill(v === 'pending' ? 'New' : v === 'overdue' ? CK.verAge(p) + 'd' : 'Due', v === 'overdue' ? 'red' : 'amber') + '</li>'; }).join('') + '</ul><p class="muted xs fpad">The office bundles these into verification runs; they appear under Today when planned.</p>';
  };
  R.capture = function () {
    var a = me();
    return header('New listing', null, 'Found a To-Let board? Add it here') + '<form class="fform" id="cap" novalidate><div class="fld"><label for="c-a">Area</label><select id="c-a">' + CK.AREAS.filter(function (x) { return x.r === (a.zone || 'sd'); }).map(function (x) { return '<option value="' + x.id + '">' + esc(x.name) + '</option>'; }).join('') + '</select></div><div class="fld"><label for="c-pl">House / plot number</label><input id="c-pl" placeholder="e.g. E-182" autocomplete="off"></div>' +
      '<fieldset class="fld"><legend>For</legend><div class="fseg"><label><input type="radio" name="c-d" value="rent" checked><span>Rent</span></label><label><input type="radio" name="c-d" value="sale"><span>Sale</span></label></div></fieldset>' +
      '<fieldset class="fld"><legend>BHK</legend><div class="fseg">' + [1, 2, 3, 4, 5].map(function (b) { return '<label><input type="radio" name="c-b" value="' + b + '"' + (b === 3 ? ' checked' : '') + '><span>' + b + '</span></label>'; }).join('') + '</div></fieldset>' +
      '<div class="fld"><label for="c-p">Price the owner said (₹)</label><input id="c-p" inputmode="numeric" placeholder="85000"><p class="hint" id="c-ph"></p></div><div class="fld"><label for="c-o">Owner</label><select id="c-o">' + S().owners.map(function (o) { return '<option value="' + o.id + '">' + esc(o.name) + '</option>'; }).join('') + '</select></div><p class="ferr" id="c-err" role="alert"></p><button type="submit" class="fbtn big">' + ic('upload', 20) + 'Send to verification desk</button></form>';
  };
  R.report = function () {
    var a = me(), d0 = CK.dayStart(CK.now()), visits = 0, outs = { liked: 0, short: 0, rejected: 0, novisit: 0 }, ver = 0, photos = 0, first = null, km = 0;
    myTrips().forEach(function (t) { if (CK.dayStart(t.start) !== d0) return; var c = CK.REGIONS[t.r].office; t.stops.forEach(function (s) { if (s.st === 'done' || s.st === 'missed') { var p = CK.prop(s.pid); km += CK.km(c, p); c = p; if (t.kind === 'verify') ver++; else { visits++; Object.keys(s.out).forEach(function (l) { outs[s.out[l].v]++; }); } if (s.at && (!first || s.at < first)) first = s.at; } photos += s.photos || 0; }); });
    var sent = S().eod.filter(function (e) { return e.agent === a.id && CK.dayStart(e.at) === d0; })[0];
    var past = S().eod.filter(function (e) { return e.agent === a.id && CK.dayStart(e.at) !== d0; }).slice(0, 3);
    return header('End of day', null, 'Goes to ' + CK.agent('A2').name + ' · ' + CK.date(CK.now(), true)) +
      '<section class="fcard"><div class="eod"><div><b>' + visits + '</b><span>visits</span></div><div><b>' + ver + '</b><span>verified</span></div><div><b>' + photos + '</b><span>photos</span></div><div><b>' + Math.round(km * 1.3) + '</b><span>km</span></div></div><p class="muted xs">Filled in from today’s check-ins' + (first ? ' · first check-in ' + CK.time(first) : '') + (F.duty ? ' · on duty from ' + CK.time(F.duty) : '') + '</p><div class="eod-o">' + CK.pill(outs.liked + ' liked', 'green') + CK.pill(outs.short + ' shortlisted', 'violet') + CK.pill(outs.rejected + ' rejected', 'red') + (outs.novisit ? CK.pill(outs.novisit + ' not visited', 'grey') : '') + '</div></section>' +
      (sent ? '<section class="fcard sent"><p>' + ic('check', 18) + ' <b>Report sent ' + CK.time(sent.at) + '</b></p><p class="muted">' + esc(sent.notes) + '</p></section>' : '<form class="fform" id="eod"><div class="fld"><label for="e-n">Anything the office should know?</label><textarea id="e-n" rows="4" placeholder="Owner at E-182 wants ₹5k more; gate at C-219 locked, rebook…"></textarea></div><p class="ferr" id="e-err" role="alert"></p><button type="submit" class="fbtn big">' + ic('upload', 20) + 'Submit report</button></form>') +
      (past.length ? '<h2 class="fsh">Earlier</h2>' + past.map(function (e) { return '<div class="fcard"><b>' + CK.date(e.at, true) + '</b> · ' + e.visits + ' visits · ' + e.verified + ' verified · ' + e.km + ' km<p class="muted">' + esc(e.notes) + '</p></div>'; }).join('') : '');
  };

  /* ---------- render & routing ---------- */
  function route() { var h = location.hash.replace(/^#\/?/, '').split('/'); return { v: h[0] || 'today', a: h[1], b: h[2] }; }
  function render() {
    var r = route(), el = document.getElementById('fview'), fn = R[r.v] || R.today, sc = window.scrollY, same = el.dataset.v === location.hash;
    el.innerHTML = fn(r.a, r.b); el.dataset.v = location.hash;
    if (!same) window.scrollTo(0, 0); else window.scrollTo(0, sc);
    var tab = { today: 'today', trip: 'trips', trips: 'trips', stop: 'trips', capture: 'capture', verify: 'verify', report: 'report' }[r.v] || 'today';
    document.querySelectorAll('.fnav a').forEach(function (a) { var on = a.dataset.tab === tab; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    var q = document.getElementById('fq'); q.hidden = !F.queue.length; q.textContent = F.queue.length;
    document.title = 'Chaukhat Field · ' + me().name;
  }
  function geoCheck(t, i) {
    var m = CK.modal('<div class="geo"><div class="geo-ring" aria-hidden="true">' + ic('pin', 30) + '</div><h2 id="modal-t">Finding you…</h2><p class="muted">Matching your location to the listing pin</p></div>');
    m.classList.add('sheet');
    setTimeout(function () { var d = 8 + Math.round(Math.random() * 38); var g = m.querySelector('.geo'); if (!g) return; g.classList.add('ok'); g.querySelector('h2').textContent = d + ' m from the pin'; g.querySelector('p').innerHTML = 'Inside the 150 m rule · ' + CK.time(CK.now()); setTimeout(function () { CK.closeModal(); doAct('checkIn', { t: t.id, i: i, m: d }, 'Checked in at ' + CK.prop(t.stops[i].pid).plot); }, 900); }, 1100);
  }
  function thumb(file, cb) { var img = new Image(), url = URL.createObjectURL(file); img.onload = function () { var c = document.createElement('canvas'), s = 144, r = Math.max(s / img.width, s / img.height); c.width = s; c.height = s; var x = c.getContext('2d'); x.drawImage(img, (s - img.width * r) / 2, (s - img.height * r) / 2, img.width * r, img.height * r); URL.revokeObjectURL(url); cb(c.toDataURL('image/jpeg', .6)); }; img.onerror = function () { cb(null); }; img.src = url; }

  function boot() {
    CK.load(); CK.ui.role = 'field';
    CK.on(function () { render(); });
    addEventListener('hashchange', render);
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-close-modal]')) { CK.closeModal(); return; }
      var b = e.target.closest('[data-f]'); if (!b || b.tagName === 'INPUT') return; var f = b.dataset.f, t = b.dataset.t ? CK.trip(b.dataset.t) : null, i = +b.dataset.i;
      if (f === 'net') setOffline(!F.offline);
      if (f === 'duty') { F.duty = CK.now(); saveF(); CK.audit('Started duty (field app)', me().name); CK.save(); render(); toast('Attendance marked · ' + CK.time(F.duty)); }
      if (f === 'checkin') geoCheck(t, i);
      if (f === 'nav') toast('Opening your maps app with the route');
      if (f === 'call') toast('Calling — it is logged on the timeline');
      if (f === 'demoshots') { doAct('photo', { t: t.id, i: i, n: 3 }, '3 photos added'); }
      if (f === 'outcome') CK.outcomeForm(t, i, { sheet: true, done: function () { var nx = t.stops[i + 1]; if (nx) setTimeout(function () { location.hash = '#/stop/' + t.id + '/' + (i + 1); }, 400); } });
      if (f === 'ck') { var k = 'ck:' + b.dataset.p; F[k] = F[k] || {}; F[k][b.dataset.c] = !F[k][b.dataset.c]; saveF(); render(); }
      if (f === 'approve' || f === 'notavail') {
        var p = CK.prop(t.stops[i].pid), ck = F['ck:' + p.id] || {};
        if (f === 'approve') { var need = CK.CHECKLIST.filter(function (c) { return (c.id !== 'docs' || p.deal === 'sale') && !ck[c.id]; }); if (need.length) { document.getElementById('f-err').textContent = need.length + ' still open: ' + need.map(function (c) { return c.label.toLowerCase(); }).join(', ') + '.'; return; } }
        doAct('verify', { p: p.id, checks: ck, ok: f === 'approve', reason: f === 'notavail' ? 'Already let out / sold' : null, t: t.id, i: i }, f === 'approve' ? p.code + ' verified — badge on' : p.code + ' marked not available');
      }
      if (f === 'who') CK.menu(b, [{ head: 'You are…' }].concat(S().agents.filter(function (a) { return a.role === 'field'; }).map(function (a) { return { label: a.name, hint: a.title.replace('Field agent · ', ''), id: a.id, on: a.id === F.agent }; })), function (it) { F.agent = it.id; saveF(); location.hash = '#/today'; render(); });
    });
    document.addEventListener('change', function (e) {
      var inp = e.target.closest('input[data-f="file"]'); if (!inp || !inp.files.length) return;
      var t = CK.trip(inp.dataset.t), i = +inp.dataset.i, key = t.id + ':' + i, files = [].slice.call(inp.files, 0, 6), left = files.length;
      F.shots[key] = F.shots[key] || [];
      files.forEach(function (fl) { thumb(fl, function (u) { if (u) F.shots[key].push(u); if (--left === 0) { try { saveF(); } catch (x) { } doAct('photo', { t: t.id, i: i, n: files.length }, files.length + ' photo' + (files.length > 1 ? 's' : '') + ' added'); } }); });
    });
    document.addEventListener('submit', function (e) {
      e.preventDefault();
      if (e.target.id === 'cap') {
        var pl = document.getElementById('c-pl'), pr = +document.getElementById('c-p').value.replace(/\D/g, ''), err = document.getElementById('c-err');
        if (!pl.value.trim()) { pl.setAttribute('aria-invalid', 'true'); pl.focus(); err.textContent = 'Add the house or plot number so the desk can find it.'; return; }
        if (!pr) { document.getElementById('c-p').setAttribute('aria-invalid', 'true'); err.textContent = 'Add the price the owner told you, even roughly.'; return; }
        var p = CK.act.newProp({ area: document.getElementById('c-a').value, plot: pl.value.trim(), type: 'Builder floor', deal: document.querySelector('input[name=c-d]:checked').value, bhk: document.querySelector('input[name=c-b]:checked').value, sqft: 1500, price: pr, ownerId: document.getElementById('c-o').value });
        toast(p.code + ' sent to the verification desk'); location.hash = '#/today';
      }
      if (e.target.id === 'eod') {
        var n = document.getElementById('e-n'); if (n.value.trim().length < 5) { n.setAttribute('aria-invalid', 'true'); document.getElementById('e-err').textContent = 'Add a line or two — even “all visits done, no issues” helps.'; n.focus(); return; }
        var d0 = CK.dayStart(CK.now()), v = 0, vr = 0, ph = 0; myTrips().forEach(function (t) { if (CK.dayStart(t.start) === d0) t.stops.forEach(function (s) { if (s.st === 'done') { if (t.kind === 'verify') vr++; else v++; } ph += s.photos || 0; }); });
        CK.act.eod({ agent: F.agent, visits: v, verified: vr, km: 14 + v * 3, notes: n.value.trim(), photos: ph }); toast('Report sent to ' + CK.agent('A2').name);
      }
    });
    document.addEventListener('input', function (e) { if (e.target.id === 'c-p') { var n = +e.target.value.replace(/\D/g, ''); document.getElementById('c-ph').textContent = n ? 'Reads as ' + CK.money(n) : ''; } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { CK.closeMenu(); CK.closeModal(); } });
    if (!location.hash) location.replace('#/today');
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
