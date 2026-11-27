/* Revv dealer app: Today, call focus mode, pipeline (drag, one next step, ⋯ menu, slide-over), inventory table with bulk
   price changes, test-ride agenda and day view, Conversations inbox (Orbit chat engine) and the commission statement.
   All records live in this browser (localStorage, keys "revv:*"); marketplace pages write leads into the same store. */
(function () {
  'use strict';
  var R = window.Revv, D = window.REVV_DATA, BO = window.BO, esc = BO.esc, ic = BO.ic, $ = BO.$, $$ = BO.$$;
  var leads = R.leads(), params = new URLSearchParams(location.search), deep = params.get('lead');
  if (deep) { var dl0 = find(deep); if (dl0) R.set(R.K.me, dl0.dealer); }
  var me = R.get(R.K.me, 'redline');
  var HOUR = 3600e3, DAY = 864e5;

  /* ---------- data helpers ---------- */
  function find(id) { return leads.filter(function (x) { return x.id === id; })[0]; }
  function dealer() { return R.dealer(me); }
  function mine() { return leads.filter(function (x) { return x.dealer === me; }); }
  function active() { return mine().filter(function (x) { return !x.lost; }); }
  function save() { R.saveLeads(leads); }
  function log(x, t) { (x.log = x.log || []).push({ at: Date.now(), txt: t }); }
  function snap() { return { l: JSON.stringify(leads), s: JSON.stringify(R.get(R.K.status, {})), p: JSON.stringify(R.get('revv:price', {})), e: JSON.stringify(R.extra()) }; }
  function undoTo(s) { return function () { leads = JSON.parse(s.l); save(); R.set(R.K.status, JSON.parse(s.s)); R.set('revv:price', JSON.parse(s.p)); R.set(R.K.extra, JSON.parse(s.e)); BO.refresh(); if (BO.slideOpen()) BO.closeSlide(true); }; }
  function veh(x) { var l = R.byId(x.listing); if (l) return { l: l, title: R.title(l), short: l.make + ' ' + l.model, img: R.img(l, true), price: l.price, score: l.score }; return { l: null, title: x.prevTitle || 'Vehicle', short: (x.prevTitle || 'Vehicle').replace(/^\d{4} /, ''), img: 'photos/' + (x.prevImg || 'x-sil') + '-s.jpg', price: x.price || 0, score: 0 }; }
  function setStatus(id, st) { var m = R.get(R.K.status, {}); if (st === 'live') delete m[id]; else m[id] = st; R.set(R.K.status, m); }
  function first(n) { return String(n).split(' ')[0]; }
  function lastBuyer(x) { var t = (x.thread || []).filter(function (m) { return m.from === 'buyer'; }); return t[t.length - 1] || (x.msg ? { txt: x.msg, at: x.at } : null); }
  function waitTxt(ms) { var m = Math.round(ms / 60000); if (m < 60) return m + ' min'; var h = Math.floor(m / 60), r = m % 60; return h < 24 ? h + ' h' + (r && h < 6 ? ' ' + r + ' min' : '') : Math.round(h / 24) + ' days'; }
  function hm(t) { return new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }); }
  function dshort(t) { return new Date(t).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); }
  function sod(t) { var x = new Date(t); x.setHours(0, 0, 0, 0); return x.getTime(); }
  function relDay(t) { var dd = Math.round((sod(t) - sod(Date.now())) / DAY); return dd === 0 ? 'Today' : dd === 1 ? 'Tomorrow' : dd === -1 ? 'Yesterday' : dshort(t); }
  function callQueue() { var now = Date.now(); return active().filter(function (x) { return x.stage === 'New' && !x.contacted && (!x.retryAt || x.retryAt <= now); }).sort(function (a, b) { return a.at - b.at; }); }
  function rides() { var t0 = sod(Date.now()); return active().filter(function (x) { return x.stage === 'Test ride' && x.slot && R.slotDate(x.slot).getTime() >= t0; }).sort(function (a, b) { return R.slotDate(a.slot) - R.slotDate(b.slot); }); }
  function srcChip(x) { var s = x.src || 'Marketplace'; return s === 'Chat' ? '<span class="chip sig">' + ic('chat') + 'Chat</span>' : '<span class="chip line">' + esc(s) + '</span>'; }
  function myListings() { return R.listings({ all: true }).filter(function (l) { return l.dealer === me && !(l.approved === false && !l.draft && R.extra().some(function (e) { return e.id === l.id && e.rejected; })); }); }
  function stock(l) {
    var r = R.rng(l.id + 'stock'), ls = mine().filter(function (x) { return x.listing === l.id; });
    r(); var days = window.LEDGER ? LEDGER.days(l) : (l.approved === false ? 0 : 6 + Math.floor(r() * 52)), views = l.approved === false ? 0 : 90 + Math.floor(r() * 820) + ls.length * 55;
    var sug = null; if (l.status === 'live' && l.approved !== false && days > 30 && (ls.length <= 2 || ls.length / views < 0.01)) { var pct = days > 45 ? 5 : 3; sug = { pct: pct, price: Math.round(l.price * (1 - pct / 100) / 5000) * 5000 }; }
    return { days: days, views: views, leads: ls.length, rides: ls.filter(function (x) { return x.slot; }).length, rate: views ? ls.length / views : 0, sug: sug };
  }
  function waitingChats() { try { return (JSON.parse(localStorage.getItem('orbit-convos') || '[]') || []).filter(function (c) { return c.agent === 'revv' && c.status === 'waiting' && (!c.dealer || c.dealer === me); }); } catch (e) { return []; } }

  /* ---------- message templates ---------- */
  var TPL = {
    'New': 'Hi {first}, thanks for asking about the {vehicle} on Revv. It\'s here at {dealer}, {area}. The full report is on the listing ({score}/150). Would {day} work for a test ride?',
    'Test ride': 'Hi {first}, confirming your test ride of the {vehicle} on {slot}. Please bring your driving licence. – {rep}, {dealer}',
    'Finance': 'Hi {first}, we\'ve held the {vehicle} for you for 48 hours. With {down}% down over {months} months at {rate}%, the EMI is about {emi}/month. Shall I send the loan papers?',
    'Sold': 'Congratulations {first}! The {vehicle} is yours. RC transfer is under way; your 7-day return window starts at delivery. – {dealer}'
  };
  function fill(st, x) {
    var v = veh(x), d = dealer(), q = x.quote || { down: 20, months: 48, rate: 10.5 }, sd = x.slot ? R.slotDate(x.slot) : null;
    return TPL[st].replace(/\{first\}/g, first(x.name)).replace(/\{vehicle\}/g, v.title).replace(/\{dealer\}/g, d.name).replace(/\{area\}/g, d.area).replace(/\{score\}/g, v.score)
      .replace(/\{day\}/g, new Date(Date.now() + DAY).toLocaleDateString('en-IN', { weekday: 'long' })).replace(/\{slot\}/g, sd ? relDay(sd) + ' at ' + hm(sd) : 'your slot').replace(/\{rep\}/g, d.rep)
      .replace(/\{down\}/g, q.down).replace(/\{months\}/g, q.months).replace(/\{rate\}/g, q.rate).replace(/\{emi\}/g, R.inr(R.emi(v.price * (1 - q.down / 100), q.rate, q.months)));
  }
  function copy(t) { try { navigator.clipboard.writeText(t).then(function () { BO.toast('Message copied. Paste it into WhatsApp.'); }, function () { BO.toast('Copy blocked by the browser. Select the text instead.'); }); } catch (e) { BO.toast('Select the text and copy it.'); } }

  /* ---------- lead actions (all undoable) ---------- */
  function move(x, stage, how) {
    if (!x || x.stage === stage) return; var s = snap(); x.stage = stage; x.fresh = false; x.lost = null; log(x, (how || 'Moved to ') + stage);
    if (stage === 'Finance') { setStatus(x.listing, 'reserved'); if (!x.quote) x.quote = { down: 20, months: 48, rate: 10.5 }; }
    if (stage === 'Sold') { setStatus(x.listing, 'sold'); x.soldAt = Date.now(); x.price = veh(x).price; x.paid = false; }
    save(); BO.refresh(); if (stage === 'Sold' && window.DEALS && DEALS.onSold) DEALS.onSold(x);
    BO.toast(stage === 'Sold' ? '<b>' + esc(x.name) + '</b> marked sold. ' + R.inr(x.price * R.COMMISSION) + ' commission added to this month.' : '<b>' + esc(first(x.name)) + '</b> moved to ' + esc(stage) + '.', { undo: undoTo(s) });
  }
  function markLost(x, why) { var s = snap(); x.lost = why || 'Price'; log(x, 'Lost: ' + x.lost.toLowerCase()); save(); BO.refresh(); BO.toast(esc(first(x.name)) + ' marked lost (' + esc(x.lost.toLowerCase()) + ').', { undo: undoTo(s) }); }
  function nextStep(x) {
    if (x.lost) return { label: 'Reopen', run: function () { var s = snap(); x.lost = null; log(x, 'Reopened'); save(); BO.refresh(); BO.toast('Reopened.', { undo: undoTo(s) }); } };
    if (x.stage === 'New') return { label: 'Call', icon: 'phone', run: function () { BO.go('focus', { lead: x.id }); } };
    if (x.stage === 'Test ride') return { label: 'Quote', icon: 'rupee', run: function () { move(x, 'Finance', 'Ride done. Moved to '); openLead(x.id, 'quote'); } };
    if (x.stage === 'Finance') return { label: 'Mark sold', icon: 'check', run: function () { move(x, 'Sold'); } };
    return null;
  }
  function moreMenu(btn, x) {
    var items = [{ label: 'Open lead', icon: 'arrow', run: function () { openLead(x.id); } }, { label: 'Copy WhatsApp message', icon: 'chat', run: function () { copy(fill(x.stage, x)); } }, '-'];
    R.STAGES.forEach(function (st) { if (st !== x.stage) items.push({ label: 'Move to ' + st, icon: 'arrow', run: function () { move(x, st); } }); });
    items.push('-'); if (x.lost) items.push({ label: 'Reopen', icon: 'undo', run: nextStep(x).run }); else items.push({ label: 'Mark lost: price', icon: 'x', danger: true, run: function () { markLost(x, 'Price'); } }, { label: 'Mark lost: bought elsewhere', icon: 'x', danger: true, run: function () { markLost(x, 'Bought elsewhere'); } });
    BO.menu(btn, items);
  }

  /* ================= TODAY ================= */
  function needs() {
    var out = [], now = Date.now(), d = dealer();
    callQueue().forEach(function (x) { var w = now - x.at; if (w < 2 * HOUR) return; var v = veh(x), lb = lastBuyer(x);
      out.push({ ic: 'phone', tone: 'sig', w: 3e9 - w, title: esc(x.name) + ' has waited ' + waitTxt(w) + ' for a reply', sub: 'About the ' + esc(v.short) + (lb ? ' · “' + esc(lb.txt) + '”' : ''), tm: waitTxt(w), btn: { label: 'Call now', run: function () { BO.go('focus', { lead: x.id }); } } }); });
    rides().forEach(function (x) { var t = R.slotDate(x.slot).getTime() - now; if (t < -45 * 60e3 || t > 3 * HOUR) return; var v = veh(x);
      out.push({ ic: 'bike', tone: 'info', w: 2e9 - t, title: t > 0 ? 'Test ride in ' + waitTxt(t) + ': ' + esc(x.name) : 'Test ride under way: ' + esc(x.name), sub: esc(v.title) + ' · ' + esc(x.where || 'Showroom') + ' · fuel it, warm the tyres, keep the papers ready', tm: hm(R.slotDate(x.slot)), btn: { label: 'Open', run: function () { openLead(x.id); } } }); });
    R.extra().filter(function (e) { return e.dealer === me && !e.score && !e.approved && !e.rejected; }).forEach(function (e) {
      out.push({ ic: 'doc', tone: 'warn', w: 1.5e9, title: esc(R.title(e)) + ' has no inspection report', sub: e.inspection ? 'Inspection booked for ' + esc(e.inspection) + '. It goes to moderation once the report is in.' : 'It can’t go live until the 150-point report is attached', tm: e.inspection ? 'booked' : 'blocked', btn: e.inspection ? null : { label: 'Book inspection', run: function () { var s = snap(), all = R.extra(); all.forEach(function (z) { if (z.id === e.id) z.inspection = 'tomorrow, 10:00'; }); R.set(R.K.extra, all); BO.refresh(); BO.toast('Inspector booked for tomorrow, 10:00 at ' + esc(d.area) + '.', { undo: undoTo(s) }); } } }); });
    active().filter(function (x) { return x.stage === 'Finance' && !x.quoteSent; }).forEach(function (x) {
      out.push({ ic: 'rupee', tone: 'info', w: 1e9, title: esc(x.name) + ' is waiting for a finance quote', sub: esc(veh(x).title) + ' · reserved for them since ' + esc(dshort(x.log[x.log.length - 1].at)), tm: BO.ago(x.at), btn: { label: 'Send quote', run: function () { openLead(x.id, 'quote'); } } }); });
    var wc = waitingChats(); if (wc.length) out.push({ ic: 'chat', tone: 'sig', w: 2.5e9, title: wc.length + ' chat' + (wc.length > 1 ? 's' : '') + ' waiting for a person', sub: esc((wc[0].user && wc[0].user.name) || 'A buyer') + ': ' + esc(wc[0].handoverReason || 'asked for a person'), tm: BO.ago(wc[0].updatedAt || Date.now()), btn: { label: 'Reply', run: function () { BO.go('inbox', { c: wc[0].id }); } } });
    myListings().forEach(function (l) { var s = stock(l); if (!s.sug) return;
      out.push({ ic: 'tag', tone: 'warn', w: 5e8 + s.days, title: esc(l.make + ' ' + l.model) + ': ' + s.days + ' days listed, ' + s.leads + ' lead' + (s.leads === 1 ? '' : 's'), sub: 'Suggest ' + s.sug.pct + '% off → ' + R.inr(s.sug.price) + ' to get it moving', tm: s.days + 'd', btn: { label: 'Review price', run: function () { BO.go('inventory', { f: 'attention' }); } } }); });
    return out.sort(function (a, b) { return b.w - a.w; });
  }
  function dayCounts(list, days, fwd) { var t0 = sod(Date.now()), out = []; for (var i = 0; i < days; i++) { var a = fwd ? t0 + i * DAY : t0 - (days - 1 - i) * DAY; out.push(list.filter(function (t) { return t >= a && t < a + DAY; }).length); } return out; }
  function vToday(el) {
    var d = dealer(), now = Date.now(), m = mine(), hr = new Date().getHours(), q = callQueue();
    var at = m.map(function (x) { return x.at; }), wk = at.filter(function (t) { return t > now - 7 * DAY; }).length, pw = at.filter(function (t) { return t <= now - 7 * DAY && t > now - 14 * DAY; }).length;
    var rs = rides(), wkR = rs.filter(function (x) { return R.slotDate(x.slot) < now + 7 * DAY; }).length;
    var mo = new Date(); mo.setDate(1); mo.setHours(0, 0, 0, 0); var pm = new Date(mo); pm.setMonth(pm.getMonth() - 1);
    var sold = m.filter(function (x) { return x.stage === 'Sold' && x.soldAt >= mo.getTime(); }), soldP = m.filter(function (x) { return x.stage === 'Sold' && x.soldAt >= pm.getTime() && x.soldAt < mo.getTime(); });
    var oldest = q[0] ? now - q[0].at : 0, n = needs();
    function delta(a, b, unit) { var df = a - b; return '<span class="d ' + (df > 0 ? 'up' : df < 0 ? 'down' : 'flat') + '">' + (df > 0 ? '+' : df < 0 ? '−' : '±') + Math.abs(df) + (unit || '') + '</span>'; }
    var old60 = window.LEDGER ? LEDGER.totals(me).old.length : 0;
    el.innerHTML = '<p class="hello"><b>' + new Date().toLocaleDateString('en-IN', { weekday: 'long' }) + '</b> · ' + q.length + ' buyer' + (q.length === 1 ? '' : 's') + ' waiting · ' + old60 + ' car' + (old60 === 1 ? '' : 's') + ' past 60 days</p>' +
      '<div class="tiles six">' +
      '<a class="tile" href="#/pipeline?stage=New"><span class="l">New leads · 7 days</span><span class="v">' + wk + '</span>' + delta(wk, pw) + '<span class="s"><span>vs ' + pw + ' the week before</span>' + BO.spark(dayCounts(at, 14)) + '</span>' + ic('arrow', 'go') + '</a>' +
      '<a class="tile' + (oldest > 2 * HOUR ? ' alert' : '') + '" href="#/focus"><span class="l">Calls waiting</span><span class="v">' + q.length + '</span><span class="d ' + (oldest > 2 * HOUR ? 'down' : 'flat') + '">' + (q.length ? 'oldest ' + waitTxt(oldest) : 'clear') + '</span><span class="s"><span>Reply within 2 h to keep your badge</span>' + BO.spark(dayCounts(q.map(function (x) { return x.at; }), 7)) + '</span>' + ic('arrow', 'go') + '</a>' +
      '<a class="tile" href="#/rides"><span class="l">Test rides · next 7 days</span><span class="v">' + wkR + '</span><span class="d flat">' + rs.filter(function (x) { return sod(R.slotDate(x.slot)) === sod(now); }).length + ' today</span><span class="s"><span>Booked from the marketplace and calls</span>' + BO.spark(dayCounts(rs.map(function (x) { return R.slotDate(x.slot).getTime(); }), 7, true)) + '</span>' + ic('arrow', 'go') + '</a>' +
      '<a class="tile" href="#/commission"><span class="l">Sold · this month</span><span class="v">' + R.inr(sold.reduce(function (s, x) { return s + (x.price || 0); }, 0) || 0) + '</span>' + delta(sold.length, soldP.length, ' sales') + '<span class="s"><span>' + sold.length + ' sale' + (sold.length === 1 ? '' : 's') + ' · ' + soldP.length + ' last month</span>' + BO.spark(dayCounts(m.filter(function (x) { return x.soldAt; }).map(function (x) { return x.soldAt; }), 30)) + '</span>' + ic('arrow', 'go') + '</a>' +
      (window.LEDGER ? LEDGER.todayTiles(me) : '') + '</div><div class="home"><div>' +
      '<section class="panel" aria-labelledby="nn-h"><div class="panel-h"><h2 id="nn-h">Needs you now</h2><span class="n">' + n.length + '</span><span class="r"><a class="btn sm ghost" href="#/focus">' + ic('phone') + 'Start calls <kbd>C</kbd></a></span></div>' +
      (n.length ? '<ul class="rows" id="nn">' + n.slice(0, 7).map(function (it, i) { return '<li class="rw"><span class="ic ' + it.tone + '">' + ic(it.ic) + '</span><span class="tx"><b>' + it.title + '</b><span>' + it.sub + '</span></span><span class="tm">' + esc(it.tm) + '</span>' + (it.btn ? '<span class="hov"><button type="button" class="btn sm' + (i === 0 ? ' pri' : '') + '" data-nn="' + i + '">' + esc(it.btn.label) + '</button></span>' : '') + '</li>'; }).join('') + '</ul>'
        : '<div class="empty">' + ic('check') + '<b>Nothing needs you right now</b><p>Every buyer has a reply and every ride is prepped. New leads land here the moment they arrive.</p></div>') + '</section>' +
      '<section class="panel" aria-labelledby="nx-h"><div class="panel-h"><h2 id="nx-h">Now and next</h2><span class="n">test rides</span><span class="r"><a class="btn sm ghost" href="#/rides">Agenda</a></span></div>' +
      (rs.length ? '<div class="strip">' + rs.slice(0, 6).map(function (x) { var t = R.slotDate(x.slot), v = veh(x), isNow = Math.abs(t - now) < 45 * 60e3; return '<a class="nx' + (isNow ? ' now' : '') + '" href="#/rides" data-open="' + x.id + '"><span class="t"><small>' + esc(relDay(t)) + '</small>' + hm(t) + '</span><img class="thumb" src="' + v.img + '" alt="" width="56" height="38" loading="lazy"><span class="tx" style="min-width:0"><b style="display:block;color:var(--bone);font-size:13px">' + esc(x.name) + '</b><span style="display:block;color:var(--mute);font-size:12px">' + esc(v.short) + ' · ' + esc(x.where || 'Showroom') + '</span></span></a>'; }).join('') + '</div>' : '<div class="empty" style="min-height:120px"><p>No test rides booked yet. Calls that end in “Booked test ride” land here.</p></div>') + '</section>' +
      '</div><div><section class="panel" aria-labelledby="af-h"><div class="panel-h"><h2 id="af-h">Activity</h2><span class="n">live</span></div><ol class="feed">' +
      m.reduce(function (a, x) { (x.log || []).forEach(function (g) { a.push({ x: x, g: g }); }); return a; }, []).sort(function (a, b) { return b.g.at - a.g.at; }).slice(0, 10).map(function (e) { var t = e.g.txt, tone = /Sold/.test(t) ? 'ok' : /chat/i.test(t) ? 'sig' : /Lost/.test(t) ? 'bad' : /Test ride/.test(t) ? 'info' : ''; return '<li><span class="dot ' + tone + '"></span><p><b>' + esc(e.x.name) + '</b> · ' + esc(t) + '</p><time>' + esc(BO.ago(e.g.at)) + ' ago · ' + esc(veh(e.x).short) + '</time></li>'; }).join('') + '</ol></section>' +
      '<section class="panel" aria-labelledby="pp-h"><div class="panel-h"><h2 id="pp-h">Pipeline</h2><span class="r"><a class="btn sm ghost" href="#/pipeline">Open</a></span></div><ul class="rows">' +
      R.STAGES.map(function (st) { var it = active().filter(function (x) { return x.stage === st && (st !== 'Sold' || x.soldAt >= mo.getTime()); }); return '<li class="rw" style="min-height:44px"><span class="tx"><b>' + st + '</b></span><span class="num" style="color:var(--mute);font-size:12px">' + R.inr(it.reduce(function (s, x) { return s + veh(x).price; }, 0) || 0) + '</span><a class="btn sm ghost" href="#/pipeline?stage=' + encodeURIComponent(st) + '"><span class="num">' + it.length + '</span>' + ic('arrow') + '</a></li>'; }).join('') + '</ul></section></div></div>';
    $$('[data-nn]', el).forEach(function (b) { b.addEventListener('click', function () { n[+b.dataset.nn].btn.run(); }); });
    $$('[data-open]', el).forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); openLead(a.dataset.open); }); });
  }

  /* ================= FOCUS MODE: ready to call ================= */
  var fx = { done: 0, skip: [], pick: null, slot: null, dayOff: 0 };
  var OUTS = [['ride', 'Booked test ride', 'Pick a slot below'], ['finance', 'Wants finance quote', 'Moves to Finance'], ['noanswer', 'No answer', 'Retry in 2 h'], ['lost', 'Lost: price', 'Closes the lead'], ['sold', 'Sold', 'Reserves the listing', 1]];
  function fxQueue(q) { var list = callQueue().filter(function (x) { return fx.skip.indexOf(x.id) < 0; }); if (q && q.lead) { var x = find(q.lead); if (x && x.dealer === me && !x.lost) { list = list.filter(function (y) { return y.id !== x.id; }); list.unshift(x); } } return list; }
  function takenSlots() { return active().filter(function (x) { return x.slot; }).map(function (x) { return x.slot; }); }
  function vFocus(el, q) {
    var list = fxQueue(q), x = list[0], total = fx.done + list.length;
    if (!x) { el.innerHTML = '<div class="fx"><div class="fx-top"><h1>Calls</h1></div><div class="done-q">' + ic('check') + '<b>Queue clear</b><p>' + (fx.done ? 'You logged ' + fx.done + ' call' + (fx.done === 1 ? '' : 's') + ' this session. ' : '') + 'Every new buyer has heard from you. New enquiries and chats join this queue the moment they land, and “No answer” calls come back after two hours.</p><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><a class="btn pri" href="#/pipeline">Open pipeline</a><a class="btn" href="#/today">Back to Today</a>' + (fx.skip.length ? '<button type="button" class="btn ghost" id="fx-rs">Bring back ' + fx.skip.length + ' skipped</button>' : '') + '</div></div></div>';
      var rs = $('#fx-rs', el); if (rs) rs.addEventListener('click', function () { fx.skip = []; BO.refresh(); }); return; }
    var v = veh(x), lb = lastBuyer(x), w = Date.now() - x.at, taken = takenSlots();
    var days = [0, 1, 2, 3].map(function (i) { var t = new Date(); t.setDate(t.getDate() + i); t.setHours(0, 0, 0, 0); return t; });
    var times = ['10:30', '11:30', '12:30', '15:00', '16:30', '18:00'];
    el.innerHTML = '<div class="fx"><div class="fx-top"><h1>Ready to call <span class="num">' + (fx.done + 1) + '</span> of <span class="num">' + total + '</span></h1><div class="fx-prog" aria-hidden="true"><i style="width:' + Math.round(fx.done / Math.max(1, total) * 100) + '%"></i></div><a class="btn sm ghost" href="#/today">Exit <kbd>Esc</kbd></a></div>' +
      '<article class="fx-card" aria-labelledby="fx-n"><div class="fx-l">' +
      '<div class="fx-who"><span class="av">' + esc(BO.initials(x.name)) + '</span><div><h2 id="fx-n">' + esc(x.name) + '</h2><p class="num">' + esc(x.phone) + ' · lead ' + esc(x.id) + '</p></div></div>' +
      '<div class="fx-chips">' + srcChip(x) + '<span class="chip ' + (w > 2 * HOUR ? 'warn' : 'line') + '">' + ic('clock') + 'Waiting ' + esc(waitTxt(w)) + '</span>' + (x.attempts ? '<span class="chip line">Attempt ' + (x.attempts + 1) + '</span>' : '') + (x.convo ? '<a class="chip info" href="#/inbox?c=' + esc(x.convo) + '">Transcript</a>' : '') + '</div>' +
      (lb ? '<blockquote class="quote">' + esc(lb.txt) + '<small>Last message · ' + esc(BO.ago(lb.at)) + ' ago' + (x.src === 'Chat' ? ' · website chat' : x.src === 'Walk-in' ? ' · at the showroom' : ' · marketplace') + '</small></blockquote>' : '<blockquote class="quote">Asked for a call back.<small>No message left</small></blockquote>') +
      '<a class="veh" href="vehicle.html?id=' + esc(v.l ? v.l.id : '') + '" target="_blank" rel="noopener"><img class="thumb lg" src="' + v.img + '" alt="" width="96" height="64"><span><b>' + esc(v.title) + '</b><span>' + R.inr(v.price) + (v.l ? ' · ' + R.km(v.l.km) + ' · ' + esc(R.own(v.l.owners)) : '') + '</span></span><span class="sc">' + v.score + '<small>/150</small></span></a>' +
      '<ul class="hist">' + (x.log || []).slice(-3).reverse().map(function (g) { return '<li><time>' + esc(dshort(g.at)) + ' ' + hm(g.at) + '</time><span>' + esc(g.txt) + '</span></li>'; }).join('') + '</ul></div>' +
      '<div class="fx-r"><p class="sec-t" id="out-l">Outcome</p><div class="outs" role="group" aria-labelledby="out-l">' + OUTS.map(function (o, i) { return '<button type="button" class="out' + (o[3] ? ' wide' : '') + '" data-out="' + o[0] + '" aria-pressed="' + (fx.pick === o[0]) + '"><b>' + o[1] + '</b><span>' + o[2] + '</span><kbd>' + (i + 1) + '</kbd></button>'; }).join('') + '</div>' +
      '<div id="fx-x"></div><div><label class="lbl" for="fx-note">Note</label><textarea class="inp" id="fx-note" rows="2" placeholder="What did they say? (optional)"></textarea></div>' +
      '<div class="fx-foot"><button type="button" class="btn ghost" id="fx-skip">Skip <kbd>S</kbd></button><span class="hint" id="fx-h">' + (fx.pick ? '' : 'Pick an outcome to save') + '</span><button type="button" class="btn pri lg" id="fx-save"' + (fx.pick ? '' : ' disabled') + '>Save &amp; next <kbd>↵</kbd></button></div></div></article></div>';
    function extra() {
      var box = $('#fx-x', el); if (fx.pick === 'ride') {
        box.innerHTML = '<p class="sec-t">Slot</p><div class="slots" style="margin-bottom:8px">' + days.map(function (t, i) { return '<button type="button" data-day="' + i + '" aria-pressed="' + (fx.dayOff === i) + '">' + esc(i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : t.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })) + '</button>'; }).join('') + '</div><div class="slots">' +
          times.map(function (tm) { var dt = new Date(days[fx.dayOff]); dt.setHours(+tm.slice(0, 2), +tm.slice(3), 0, 0); var s = R.slotOf(dt), past = dt < Date.now(), tk = taken.indexOf(s) > -1; return '<button type="button" data-slot="' + s + '" aria-pressed="' + (fx.slot === s) + '"' + (past || tk ? ' disabled title="' + (tk ? 'Already booked' : 'In the past') + '"' : '') + '>' + tm + '</button>'; }).join('') + '</div>';
      } else if (fx.pick === 'finance') { box.innerHTML = '<p class="sec-t">Quote to send</p><p style="margin:0;font-size:13px;color:var(--mute)">20% down over 48 months at 10.5%: <b class="num" style="color:var(--bone)">' + R.inr(R.emi(v.price * 0.8, 10.5, 48)) + '/mo</b>. Fine-tune it on the lead.</p>'; }
      else box.innerHTML = '';
      var ok = fx.pick && (fx.pick !== 'ride' || fx.slot); $('#fx-save', el).disabled = !ok; $('#fx-h', el).textContent = !fx.pick ? 'Pick an outcome to save' : fx.pick === 'ride' && !fx.slot ? 'Pick a slot for the ride' : '';
    }
    extra();
    el.onclick = function (e) {
      var o = e.target.closest('[data-out]'); if (o) { fx.pick = o.dataset.out; fx.slot = null; $$('[data-out]', el).forEach(function (b) { b.setAttribute('aria-pressed', b === o); }); extra(); return; }
      var dy = e.target.closest('[data-day]'); if (dy) { fx.dayOff = +dy.dataset.day; fx.slot = null; extra(); return; }
      var sl = e.target.closest('[data-slot]'); if (sl && !sl.disabled) { fx.slot = sl.dataset.slot; extra(); return; }
      if (e.target.closest('#fx-skip')) { fx.skip.push(x.id); fx.pick = null; BO.render(); return; }
      if (e.target.closest('#fx-save')) saveCall(x, el);
    };
    el._fx = { x: x, save: function () { if (!$('#fx-save', el).disabled) saveCall(x, el); }, skip: function () { fx.skip.push(x.id); fx.pick = null; BO.render(); }, pick: function (i) { var b = $$('[data-out]', el)[i]; if (b) b.click(); } };
  }
  function saveCall(x, el) {
    var s = snap(), note = ($('#fx-note', el) || {}).value || '', d = dealer(), p = fx.pick; x.fresh = false;
    if (p === 'ride') { x.contacted = true; x.stage = 'Test ride'; x.kind = 'test'; x.slot = fx.slot; x.where = x.where || 'Showroom'; log(x, 'Call: booked a test ride for ' + relDay(R.slotDate(x.slot)) + ' ' + hm(R.slotDate(x.slot))); (x.thread = x.thread || []).push({ from: 'dealer', at: Date.now(), txt: fill('Test ride', x) }); }
    if (p === 'finance') { x.contacted = true; x.stage = 'Finance'; x.quote = { down: 20, months: 48, rate: 10.5 }; setStatus(x.listing, 'reserved'); log(x, 'Call: wants a finance quote'); }
    if (p === 'noanswer') { x.attempts = (x.attempts || 0) + 1; x.retryAt = Date.now() + 2 * HOUR; log(x, 'Call: no answer (attempt ' + x.attempts + '). Back in the queue at ' + hm(x.retryAt)); }
    if (p === 'lost') { x.contacted = true; x.lost = 'Price'; log(x, 'Lost: price'); }
    if (p === 'sold') { x.contacted = true; x.stage = 'Sold'; x.soldAt = Date.now(); x.price = veh(x).price; x.paid = false; setStatus(x.listing, 'sold'); log(x, 'Sold for ' + R.inr(x.price)); }
    if (note.trim()) log(x, 'Note: ' + note.trim());
    save(); fx.done++; fx.pick = null; fx.slot = null; fx.dayOff = 0;
    var msg = { ride: 'Ride booked with ' + esc(first(x.name)) + '.', finance: esc(first(x.name)) + ' moved to Finance.', noanswer: 'No answer logged. ' + esc(first(x.name)) + ' comes back at ' + hm(x.retryAt) + '.', lost: esc(first(x.name)) + ' marked lost.', sold: esc(first(x.name)) + ' sold. Commission added.' }[p];
    BO.toast(msg, { undo: function () { undoTo(s)(); fx.done = Math.max(0, fx.done - 1); } });
    var r = BO.route(); if (r.q.lead) BO.go('focus'); else BO.render();
    void d;
  }
  document.addEventListener('keydown', function (e) {
    if (BO.route().id !== 'focus' || BO.slideOpen() || $('.pal') || $('.dlg') || $('.menu')) return; var el = $('#view'); if (!el._fx) return;
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    if (e.key === 'Enter' && !e.shiftKey && !e.target.closest('button,a') && (!typing || e.target.id === 'fx-note')) { if (typing) e.preventDefault(); el._fx.save(); return; }
    if (typing || e.metaKey || e.ctrlKey) return;
    if (/^[1-5]$/.test(e.key)) { e.preventDefault(); el._fx.pick(+e.key - 1); } else if (e.key.toLowerCase() === 's') { e.preventDefault(); el._fx.skip(); } else if (e.key === 'Escape') { BO.go('today'); }
  });

  /* ================= PIPELINE ================= */
  var pf = { q: '', src: 'all', lost: false, view: 'board', stage: 'New' };
  function vPipeline(el, q) {
    if (q.stage) pf.stage = q.stage; if (q.src) pf.src = q.src;
    var srcs = ['all', 'Chat', 'Marketplace', 'Instagram', 'Walk-in', 'Call'];
    function list() { var t = pf.q.toLowerCase(); return mine().filter(function (x) { if (x.lost && !pf.lost) return false; if (x.stage === 'Sold' && x.soldAt < sod(Date.now()) - 30 * DAY) return false; if (pf.src !== 'all' && (x.src || 'Marketplace') !== pf.src) return false; return !t || (x.name + ' ' + veh(x).title + ' ' + x.id).toLowerCase().indexOf(t) > -1; }); }
    el.innerHTML = '<div class="ph"><div><h1>Pipeline</h1><p>Drag a card to move it. Every card has one next step; the rest is in ⋯.</p></div><div class="acts"><div class="seg" role="group" aria-label="View"><button type="button" data-v="board" aria-pressed="' + (pf.view === 'board') + '">Board</button><button type="button" data-v="list" aria-pressed="' + (pf.view === 'list') + '">List</button></div><button type="button" class="btn pri" data-new>' + ic('plus') + 'New lead</button></div></div>' +
      '<div class="tb"><label class="sr" for="pf-q">Search the pipeline</label><input class="inp" id="pf-q" type="search" placeholder="Search buyer or vehicle" value="' + esc(pf.q) + '"><div class="fchips" role="group" aria-label="Source">' + srcs.map(function (s) { var n = mine().filter(function (x) { return !x.lost && (s === 'all' || (x.src || 'Marketplace') === s); }).length; return '<button type="button" class="fchip" data-src="' + s + '" aria-pressed="' + (pf.src === s) + '">' + (s === 'all' ? 'All sources' : s) + '<span class="n">' + n + '</span></button>'; }).join('') + '</div><span class="sp"></span><label class="fchip" style="cursor:pointer"><input type="checkbox" id="pf-lost"' + (pf.lost ? ' checked' : '') + ' style="accent-color:var(--sig)"> Show lost</label></div>' +
      '<div id="pf-b"></div>';
    function draw() {
      var all = list(), box = $('#pf-b', el);
      if (pf.view === 'list') {
        box.innerHTML = '<div class="tbl-w cards"><table class="tbl"><thead><tr><th scope="col">Buyer</th><th scope="col">Vehicle</th><th scope="col">Stage</th><th scope="col">Source</th><th scope="col" class="r">Value</th><th scope="col">Age</th><th scope="col"><span class="sr">Next step</span></th></tr></thead><tbody>' +
          (all.length ? all.sort(function (a, b) { return b.at - a.at; }).map(function (x) { var v = veh(x), ns = nextStep(x); return '<tr data-row="' + x.id + '"><td class="vcell"><div class="vc"><span class="av">' + esc(BO.initials(x.name)) + '</span><span><b>' + esc(x.name) + '</b><span>' + esc(x.id) + '</span></span></div></td><td data-l="Vehicle">' + esc(v.short) + '</td><td data-l="Stage">' + (x.lost ? '<span class="chip bad">Lost</span>' : '<span class="chip line">' + esc(x.stage) + '</span>') + '</td><td data-l="Source">' + srcChip(x) + '</td><td class="r num" data-l="Value">' + R.inr(v.price) + '</td><td class="num" data-l="Age">' + BO.ago(x.at) + '</td><td class="full" style="text-align:right;white-space:nowrap">' + (ns ? '<button type="button" class="btn sm" data-ns="' + x.id + '">' + esc(ns.label) + '</button> ' : '') + '<button type="button" class="ib" data-more="' + x.id + '" aria-label="More for ' + esc(x.name) + '" aria-haspopup="menu">' + ic('more') + '</button></td></tr>'; }).join('')
            : '<tr><td colspan="7"><div class="empty"><b>No leads match</b><p>Clear the search or pick another source.</p></div></td></tr>') + '</tbody></table></div>';
        return;
      }
      box.innerHTML = '<div class="seg stage-tabs" role="group" aria-label="Stage">' + R.STAGES.map(function (st) { return '<button type="button" data-st="' + st + '" aria-pressed="' + (pf.stage === st) + '">' + st + '<span class="n">' + all.filter(function (x) { return x.stage === st; }).length + '</span></button>'; }).join('') + '</div>' +
        '<div class="board" id="board">' + R.STAGES.map(function (st) { var it = all.filter(function (x) { return x.stage === st; }).sort(function (a, b) { return (a.lost ? 1 : 0) - (b.lost ? 1 : 0) || b.at - a.at; });
          return '<section class="col' + (pf.stage === st ? ' show' : '') + '" data-stage="' + st + '" aria-label="' + st + '"><div class="col-h">' + st + '<span class="n">' + it.length + '</span><span class="v">' + R.inr(it.filter(function (x) { return !x.lost; }).reduce(function (s, x) { return s + veh(x).price; }, 0) || 0) + '</span></div><div class="col-b">' +
            (it.length ? it.map(card).join('') : '<p class="col-e">' + ({ New: 'New enquiries and chats land here.', 'Test ride': 'Drop a lead here once a ride is booked.', Finance: 'Leads waiting on a quote or the bank.', Sold: 'Nothing sold in the last 30 days yet.' })[st] + '</p>') + '</div></section>'; }).join('') + '</div>';
      if (q.stage && !draw.once) { draw.once = 1; var c = $('[data-stage="' + q.stage + '"]', box); if (c) { c.classList.add('over'); setTimeout(function () { c.classList.remove('over'); }, 1200); } }
    }
    function card(x) { var v = veh(x), ns = nextStep(x), sd = x.slot && x.stage === 'Test ride' ? R.slotDate(x.slot) : null;
      return '<article class="lc' + (x.lost ? ' lost' : '') + (x.fresh ? ' flash' : '') + '" draggable="true" data-lead="' + x.id + '" tabindex="0" aria-label="' + esc(x.name + ', ' + v.title + ', ' + x.stage) + '"><div class="lc-t"><b>' + esc(x.name) + '</b><time>' + BO.ago(x.at) + '</time></div><p class="lc-v">' + esc(v.short) + ' · ' + R.inr(v.price) + '</p><div class="lc-f"><span class="chips">' + srcChip(x) + (sd ? '<span class="chip info">' + esc(relDay(sd) === 'Today' ? hm(sd) : relDay(sd).slice(0, 3) + ' ' + hm(sd)) + '</span>' : '') + (x.stage === 'Sold' ? (x.paid ? '<span class="chip ok">Settled</span>' : '<span class="chip warn">Commission due</span>') : '') + (x.lost ? '<span class="chip bad">' + esc(x.lost) + '</span>' : '') + '</span>' + (ns ? '<button type="button" class="btn sm" data-ns="' + x.id + '">' + esc(ns.label) + '</button>' : '') + '<button type="button" class="ib" data-more="' + x.id + '" aria-label="More for ' + esc(x.name) + '" aria-haspopup="menu" style="width:28px;height:28px">' + ic('more') + '</button></div></article>'; }
    draw();
    $('#pf-q', el).addEventListener('input', function (e) { pf.q = e.target.value; draw(); });
    $('#pf-lost', el).addEventListener('change', function (e) { pf.lost = e.target.checked; draw(); });
    el.onclick = function (e) {
      var t = e.target;
      var sv = t.closest('[data-v]'); if (sv) { pf.view = sv.dataset.v; BO.render(); return; }
      var sc = t.closest('[data-src]'); if (sc) { pf.src = sc.dataset.src; BO.render(); return; }
      var st = t.closest('[data-st]'); if (st) { pf.stage = st.dataset.st; draw(); return; }
      if (t.closest('[data-new]')) { newLead(); return; }
      var ns = t.closest('[data-ns]'); if (ns) { nextStep(find(ns.dataset.ns)).run(); return; }
      var mo = t.closest('[data-more]'); if (mo) { moreMenu(mo, find(mo.dataset.more)); return; }
      var c = t.closest('[data-lead],[data-row]'); if (c) openLead(c.dataset.lead || c.dataset.row);
    };
    el.onkeydown = function (e) { var c = e.target.closest('.lc'); if (c && e.key === 'Enter' && e.target === c) openLead(c.dataset.lead); };
    var dragId = null;
    el.ondragstart = function (e) { var c = e.target.closest('.lc'); if (!c) return; dragId = c.dataset.lead; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (er) {} };
    el.ondragend = function () { $$('.lc.dragging', el).forEach(function (c) { c.classList.remove('dragging'); }); $$('.col.over', el).forEach(function (c) { c.classList.remove('over'); }); };
    el.ondragover = function (e) { var col = e.target.closest('.col'); if (!col || !dragId) return; e.preventDefault(); $$('.col', el).forEach(function (c) { c.classList.toggle('over', c === col); }); };
    el.ondrop = function (e) { var col = e.target.closest('.col'); $$('.col', el).forEach(function (c) { c.classList.remove('over'); }); if (col && dragId) { e.preventDefault(); move(find(dragId), col.dataset.stage); } dragId = null; };
  }

  /* ---------- lead slide-over ---------- */
  function openLead(id, focus) {
    var x = find(id); if (!x) return; x.fresh = false; save(); var v = veh(x), ns = nextStep(x), d = dealer();
    var p = BO.slide({ title: x.name, head: '<span class="av">' + esc(BO.initials(x.name)) + '</span>', actions: (x.stage === 'Sold' && window.DEALS ? '<button type="button" class="btn sm" data-so-deal>' + ic('doc') + 'Deal desk</button>' : '') + (ns ? '<button type="button" class="btn pri sm" data-so-ns>' + esc(ns.label) + '</button>' : '') + '<button type="button" class="ib" data-so-more aria-label="More actions" aria-haspopup="menu">' + ic('more') + '</button>',
      body: function (b) {
        var q = x.quote || { down: 20, months: 48, rate: 10.5 }, sd = x.slot ? R.slotDate(x.slot) : null;
        b.innerHTML = '<div class="fx-chips">' + (x.lost ? '<span class="chip bad">Lost · ' + esc(x.lost) + '</span>' : '<span class="chip line">' + esc(x.stage) + '</span>') + srcChip(x) + '<span class="chip line num">' + esc(x.id) + '</span><span class="chip line">' + esc(BO.ago(x.at)) + ' ago</span>' + (x.convo ? '<a class="chip info" href="#/inbox?c=' + esc(x.convo) + '">' + ic('chat') + 'Open transcript</a>' : '') + '</div>' +
          '<div class="blk"><a class="veh" href="' + (v.l ? 'vehicle.html?id=' + esc(v.l.id) : '#') + '" target="_blank" rel="noopener"><img class="thumb lg" src="' + v.img + '" alt="" width="96" height="64"><span><b>' + esc(v.title) + '</b><span>' + R.inr(v.price) + (v.l ? ' · ' + R.km(v.l.km) + ' · ' + (v.l.status === 'live' ? 'Live' : v.l.status) : '') + '</span></span><span class="sc">' + (v.score || '—') + '<small>/150</small></span></a></div>' +
          '<div class="blk"><dl class="kv"><div><dt>Phone</dt><dd class="num">' + esc(x.phone) + '</dd></div><div><dt>Source</dt><dd>' + esc(x.src || 'Marketplace') + '</dd></div><div><dt>Test ride</dt><dd>' + (sd ? esc(relDay(sd) + ', ' + hm(sd)) : '—') + '</dd></div><div><dt>Where</dt><dd>' + esc(x.where || (sd ? 'Showroom' : '—')) + '</dd></div></dl></div>' +
          '<div class="blk" id="so-th"><h3>Conversation<span class="r"><button type="button" class="btn sm ghost" data-tpl>' + ic('chat') + 'Copy ' + esc(x.stage.toLowerCase()) + ' template</button></span></h3><div class="thread">' +
          ((x.thread || []).length ? x.thread.map(function (m) { return '<div class="msg' + (m.from === 'dealer' ? ' me' : '') + '">' + esc(m.txt) + '<small>' + (m.from === 'dealer' ? esc(first(d.rep)) : esc(first(x.name))) + ' · ' + esc(dshort(m.at)) + ' ' + hm(m.at) + '</small></div>'; }).join('') : '<div class="msg sys">No messages yet</div>') +
          '</div><form class="reply" data-reply><label class="sr" for="so-r">Reply to ' + esc(first(x.name)) + '</label><input class="inp" id="so-r" autocomplete="off" placeholder="Reply on WhatsApp…"><button class="btn" type="submit">Send</button></form></div>' +
          '<div class="blk" id="so-q"><h3>Finance quote' + (x.quoteSent ? '<span class="chip ok r">Sent ' + esc(BO.ago(x.quoteSent)) + ' ago</span>' : '') + '</h3><div class="emi"><div><label class="lbl" for="q-d">Down payment <span class="num" id="q-dv">' + q.down + '%</span></label><input type="range" id="q-d" min="10" max="60" step="5" value="' + q.down + '"></div><div><label class="lbl" for="q-m">Tenure</label><select class="sel" id="q-m">' + [12, 24, 36, 48, 60].map(function (n) { return '<option value="' + n + '"' + (n === q.months ? ' selected' : '') + '>' + n + ' months</option>'; }).join('') + '</select></div><div><label class="lbl" for="q-r">Rate</label><select class="sel" id="q-r">' + [9.5, 10.5, 11.5, 12.5].map(function (n) { return '<option value="' + n + '"' + (n === q.rate ? ' selected' : '') + '>' + n + '%</option>'; }).join('') + '</select></div></div>' +
          '<div class="emi-out"><b class="num" id="q-o"></b><span id="q-s"></span><button type="button" class="btn sm pri" style="margin-left:auto" data-sendq>Send quote</button></div></div>' +
          '<div class="blk"><h3>Timeline</h3><ul class="hist" style="margin:0">' + (x.log || []).slice().reverse().map(function (g) { return '<li><time>' + esc(dshort(g.at)) + ' ' + hm(g.at) + '</time><span style="color:var(--txt)">' + esc(g.txt) + '</span></li>'; }).join('') + '</ul>' +
          '<form class="reply" data-note><label class="sr" for="so-n">Add a note</label><input class="inp" id="so-n" autocomplete="off" placeholder="+ Add a note"><button class="btn" type="submit">Add</button></form></div>';
        function emi() { var dn = +$('#q-d', b).value, mo = +$('#q-m', b).value, rt = +$('#q-r', b).value, loan = v.price * (1 - dn / 100); $('#q-dv', b).textContent = dn + '%'; $('#q-o', b).textContent = R.inr(R.emi(loan, rt, mo)) + '/mo'; $('#q-s', b).textContent = R.inr(v.price * dn / 100) + ' down · ' + R.inr(loan) + ' loan'; x.quote = { down: dn, months: mo, rate: rt }; }
        ['#q-d', '#q-m', '#q-r'].forEach(function (s) { $(s, b).addEventListener('input', emi); }); emi();
        b.addEventListener('submit', function (e) { e.preventDefault(); var f = e.target, i = $('input', f), t = i.value.trim(); if (!t) { i.focus(); return; }
          if (f.hasAttribute('data-reply')) { (x.thread = x.thread || []).push({ from: 'dealer', at: Date.now(), txt: t }); x.contacted = true; log(x, 'Replied: ' + t.slice(0, 60)); } else log(x, 'Note: ' + t); save(); openLead(x.id); BO.toast(f.hasAttribute('data-reply') ? 'Sent and logged on the lead.' : 'Note added.'); });
        b.addEventListener('click', function (e) {
          if (e.target.closest('[data-tpl]')) copy(fill(x.stage, x));
          if (e.target.closest('[data-sendq]')) { var s = snap(); emi(); var txt = fill('Finance', x); (x.thread = x.thread || []).push({ from: 'dealer', at: Date.now(), txt: txt }); x.quoteSent = Date.now(); log(x, 'Quote sent: ' + R.inr(R.emi(v.price * (1 - x.quote.down / 100), x.quote.rate, x.quote.months)) + '/mo over ' + x.quote.months + ' months'); if (x.stage === 'New' || x.stage === 'Test ride') { x.stage = 'Finance'; setStatus(x.listing, 'reserved'); } save(); BO.refresh(); openLead(x.id); BO.toast('Quote sent to ' + esc(first(x.name)) + '.', { undo: undoTo(s) }); }
        });
        if (focus === 'quote') setTimeout(function () { var qq = $('#so-q', b); if (qq) { qq.scrollIntoView({ block: 'start' }); $('#q-d', b).focus({ preventScroll: true }); } }, 320);
      }, onClose: function () { save(); } });
    var nb = $('[data-so-ns]', p); if (nb) nb.addEventListener('click', function () { BO.closeSlide(true); ns.run(); });
    var dk = $('[data-so-deal]', p); if (dk) dk.addEventListener('click', function () { BO.closeSlide(true); var dd = DEALS.byLead(x.id) || DEALS.create(x); setTimeout(function () { DEALS.openDesk(dd.id); }, 30); });
    $('[data-so-more]', p).addEventListener('click', function (e) { moreMenu(e.currentTarget, x); });
  }
  function newLead(pre) {
    pre = pre || {}; var ls = myListings().filter(function (l) { return l.status !== 'sold' && l.approved !== false; });
    BO.slide({ title: 'New lead', body: '<form id="nl" novalidate><div class="blk"><label class="lbl" for="nl-n">Buyer name</label><input class="inp" id="nl-n" autocomplete="off" required></div><div class="blk"><label class="lbl" for="nl-p">Mobile</label><input class="inp" id="nl-p" inputmode="numeric" autocomplete="off" placeholder="10 digits"><p class="hint" style="margin:6px 0 0;font-size:12px;color:var(--dim)">Only your team sees this.</p></div>' +
      '<div class="blk"><label class="lbl" for="nl-v">Vehicle</label><select class="sel" id="nl-v">' + ls.map(function (l) { return '<option value="' + l.id + '"' + (pre.listing === l.id ? ' selected' : '') + '>' + esc(R.title(l)) + ' · ' + R.inr(l.price) + '</option>'; }).join('') + '</select></div><div class="blk"><label class="lbl" for="nl-s">Source</label><select class="sel" id="nl-s">' + ['Walk-in', 'Call', 'Instagram', 'Marketplace', 'Referral'].map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select></div>' +
      '<div class="blk"><label class="lbl" for="nl-m">What did they ask?</label><textarea class="inp" id="nl-m" rows="3"></textarea></div><p id="nl-e" role="alert" style="color:var(--bad);font-size:13px;min-height:18px;margin:0"></p></form>',
      foot: '<button type="button" class="btn ghost" data-so-x2>Cancel</button><button type="submit" form="nl" class="btn pri">Add lead</button>' });
    var f = $('#nl'), p = f.closest('.so'); $('[data-so-x2]', p).addEventListener('click', function () { BO.closeSlide(); }); setTimeout(function () { $('#nl-n').focus(); }, 300);
    f.addEventListener('submit', function (e) { e.preventDefault(); var n = $('#nl-n').value.trim(), ph = $('#nl-p').value.replace(/\D/g, '').replace(/^91/, '');
      if (n.length < 2) { $('#nl-e').textContent = 'Add the buyer’s name so the team knows who to call.'; $('#nl-n').focus(); return; } if (ph && ph.length !== 10) { $('#nl-e').textContent = 'That mobile number needs ten digits.'; $('#nl-p').focus(); return; }
      var lead = R.addLead({ listing: $('#nl-v').value, dealer: me, name: n, phone: ph ? ph.slice(0, 2) + '•• ••• •' + ph.slice(-2) : 'not given', kind: 'enquiry', msg: $('#nl-m').value.trim(), src: $('#nl-s').value, keepDealer: true });
      leads = R.leads(); BO.closeSlide(true); BO.go('pipeline', { stage: 'New' }); BO.toast('<b>' + esc(n) + '</b> added to New.', { undo: function () { leads = leads.filter(function (y) { return y.id !== lead.id; }); save(); BO.refresh(); } }); });
  }

  /* ================= INVENTORY ================= */
  var inv = { f: 'all', sort: 'days', dir: -1, sel: [] };
  function vInventory(el, q) {
    if (q.f) inv.f = q.f; var ls = myListings(), rows = ls.map(function (l) { return { l: l, s: stock(l) }; });
    var F = { all: function () { return true; }, live: function (r) { return r.l.status === 'live' && r.l.approved !== false; }, reserved: function (r) { return r.l.status === 'reserved'; }, sold: function (r) { return r.l.status === 'sold'; }, pending: function (r) { return r.l.approved === false; }, attention: function (r) { return !!r.s.sug; } };
    var L = { all: 'All', live: 'Live', reserved: 'Reserved', sold: 'Sold', pending: 'Awaiting approval', attention: 'Needs attention' };
    var shown = rows.filter(F[inv.f]), key = { days: function (r) { return r.s.days; }, views: function (r) { return r.s.views; }, leads: function (r) { return r.s.leads; }, price: function (r) { return r.l.price; }, rate: function (r) { return r.s.rate; }, name: function (r) { return R.title(r.l); } }[inv.sort];
    shown.sort(function (a, b) { var x = key(a), y = key(b); return (x > y ? 1 : x < y ? -1 : 0) * inv.dir; });
    inv.sel = inv.sel.filter(function (id) { return shown.some(function (r) { return r.l.id === id; }); });
    function th(k, label, cls) { var on = inv.sort === k; return '<th scope="col"' + (cls ? ' class="' + cls + '"' : '') + (on ? ' aria-sort="' + (inv.dir > 0 ? 'ascending' : 'descending') + '"' : '') + '><button type="button" data-sort="' + k + '">' + label + (on ? '<span class="ar">' + (inv.dir > 0 ? '▲' : '▼') + '</span>' : '') + '</button></th>'; }
    var maxD = Math.max.apply(null, rows.map(function (r) { return r.s.days; }).concat(60));
    el.innerHTML = '<div class="ph"><div><h1>Inventory</h1><p>' + rows.length + ' vehicles · ' + rows.filter(function (r) { return r.s.sug; }).length + ' could use a price nudge · tap a vehicle for its ledger</p></div><div class="acts"><a class="btn" href="sell.html" target="_blank" rel="noopener">' + ic('plus') + 'Add a vehicle</a></div></div>' +
      '<div class="tb"><div class="fchips" role="group" aria-label="Filter">' + Object.keys(F).map(function (k) { return '<button type="button" class="fchip" data-f="' + k + '" aria-pressed="' + (inv.f === k) + '">' + L[k] + '<span class="n">' + rows.filter(F[k]).length + '</span></button>'; }).join('') + '</div></div>' +
      '<div class="tbl-w cards"><table class="tbl"><thead><tr><th scope="col" class="cb"><label class="sr" for="cb-all">Select all</label><input type="checkbox" id="cb-all"' + (shown.length && inv.sel.length === shown.length ? ' checked' : '') + '></th>' + th('name', 'Vehicle') + '<th scope="col">Status</th>' + th('days', 'Age · margin') + th('views', 'Views', 'r') + th('leads', 'Leads', 'r') + th('rate', 'Lead rate', 'r') + th('price', 'Price', 'r') + '<th scope="col" class="r">Floor</th><th scope="col">Suggestion</th></tr></thead><tbody>' +
      (shown.length ? shown.map(function (r) { var l = r.l, s = r.s, g = window.LEDGER && l.status !== 'sold' ? LEDGER.of(l) : null, on = inv.sel.indexOf(l.id) > -1, st = l.approved === false ? (l.inspection || l.draft ? '<span class="chip warn">Needs report</span>' : '<span class="chip info">In review</span>') : l.status === 'live' ? '<span class="chip ok">Live</span>' : l.status === 'reserved' ? '<span class="chip warn">Reserved</span>' : '<span class="chip line">Sold</span>';
        return '<tr class="' + (on ? 'sel' : '') + '"><td class="cb"><label class="sr" for="cb-' + l.id + '">Select ' + esc(R.title(l)) + '</label><input type="checkbox" id="cb-' + l.id + '" data-cb="' + l.id + '"' + (on ? ' checked' : '') + '></td><td class="vcell"><div class="vc"><img class="thumb" src="' + R.img(l, true) + '" alt="" width="56" height="38" loading="lazy"><span><button type="button" class="lnkb" data-ledger="' + l.id + '" title="Open the ledger">' + esc(R.title(l)) + '</button><span>' + esc(l.id) + ' · ' + R.km(l.km) + '</span></span></div></td>' +
          '<td data-l="Status">' + st + '</td><td data-l="Age · margin" class="agecell">' + (g ? LEDGER.cell(g, maxD) : '<span class="num">' + s.days + 'd</span>') + '</td><td class="r num" data-l="Views">' + s.views.toLocaleString('en-IN') + '</td><td class="r num" data-l="Leads">' + s.leads + '</td><td class="r num" data-l="Lead rate">' + (s.views ? (s.rate * 100).toFixed(1) + '%' : '—') + '</td>' +
          '<td class="r num" data-l="Price">' + (l.was ? '<span class="was">' + R.inr(l.was) + '</span>' : '') + R.inr(l.price) + '</td><td class="r num" data-l="Floor">' + (g ? R.inr(g.floor) : '—') + '</td><td class="full">' + (s.sug ? '<button type="button" class="btn sm" data-drop="' + l.id + '">' + ic('down') + '−' + s.sug.pct + '% → ' + R.inr(s.sug.price) + '</button>' : '<span style="color:var(--dim);font-size:12.5px">' + (l.approved === false ? 'Attach the report to go live' : s.leads > 3 ? 'Selling well' : 'Hold price') + '</span>') + '</td></tr>'; }).join('')
        : '<tr><td colspan="10"><div class="empty"><b>Nothing here</b><p>No vehicles match “' + esc(L[inv.f]) + '”. <a href="#/inventory?f=all">Show all</a></p></div></td></tr>') + '</tbody></table></div>' +
      (inv.sel.length ? '<div class="bulk" role="region" aria-label="Bulk actions"><b>' + inv.sel.length + ' selected</b><button type="button" class="btn sm" data-bulk="reserved">Mark reserved</button><button type="button" class="btn sm" data-bulk="live">Mark live</button><button type="button" class="btn sm pri" data-bulk="drop">Apply suggested prices</button><button type="button" class="ib" data-bulk="clear" aria-label="Clear selection">' + ic('x') + '</button></div>' : '');
    el.onclick = function (e) {
      var t = e.target, f = t.closest('[data-f]'); if (f) { inv.f = f.dataset.f; inv.sel = []; history.replaceState(null, '', '#/inventory'); BO.render(true); return; }
      var so = t.closest('[data-sort]'); if (so) { if (inv.sort === so.dataset.sort) inv.dir *= -1; else { inv.sort = so.dataset.sort; inv.dir = so.dataset.sort === 'name' ? 1 : -1; } BO.render(true); return; }
      var lg = t.closest('[data-ledger]'); if (lg && window.LEDGER) { LEDGER.open(lg.dataset.ledger, function () { BO.refresh(); }); return; }
      var dr = t.closest('[data-drop]'); if (dr) { previewDrop([dr.dataset.drop]); return; }
      var bk = t.closest('[data-bulk]'); if (bk) { var k = bk.dataset.bulk; if (k === 'clear') { inv.sel = []; BO.render(true); return; } if (k === 'drop') { previewDrop(inv.sel.slice()); return; }
        var s = snap(); inv.sel.forEach(function (id) { setStatus(id, k); }); var n = inv.sel.length; inv.sel = []; BO.render(true); BO.toast(n + ' vehicle' + (n === 1 ? '' : 's') + ' marked ' + k + '. The marketplace updates instantly.', { undo: undoTo(s) }); }
    };
    el.onchange = function (e) { var t = e.target; if (t.id === 'cb-all') { inv.sel = t.checked ? shown.map(function (r) { return r.l.id; }) : []; BO.render(true); return; } var c = t.closest('[data-cb]'); if (c) { var id = c.dataset.cb, i = inv.sel.indexOf(id); if (c.checked && i < 0) inv.sel.push(id); if (!c.checked && i > -1) inv.sel.splice(i, 1); BO.render(true); } };
  }
  function previewDrop(ids) {
    var rows = ids.map(function (id) { var l = R.byId(id); return { l: l, s: stock(l) }; }), ch = rows.filter(function (r) { return r.s.sug; }), skip = rows.length - ch.length;
    if (!ch.length) { BO.toast('None of these have a suggested price. Suggestions appear after 30 days in stock with a lead rate under 1%.'); return; }
    BO.dialog({ title: 'Change ' + ch.length + ' price' + (ch.length === 1 ? '' : 's') + '?', ok: 'Apply ' + ch.length + ' change' + (ch.length === 1 ? '' : 's'),
      html: '<p style="margin:0 0 10px;color:var(--mute)">Buyers who saved these get a price-drop alert. You can undo for a few seconds after.</p><div class="tbl-w"><table class="tbl"><thead><tr><th scope="col">Vehicle</th><th scope="col" class="r">Now</th><th scope="col" class="r">New</th><th scope="col" class="r">Margin after</th></tr></thead><tbody>' + ch.map(function (r) { var g = window.LEDGER ? LEDGER.of(r.l) : null, after = g ? g.margin - (r.l.price - r.s.sug.price) : null; return '<tr><td>' + esc(r.l.make + ' ' + r.l.model) + '</td><td class="r num">' + R.inr(r.l.price) + '</td><td class="r num" style="color:var(--warn)">' + R.inr(r.s.sug.price) + ' <small style="color:var(--dim)">−' + r.s.sug.pct + '%</small></td><td class="r num" style="color:' + (after == null ? 'inherit' : after < 0 ? 'var(--bad)' : 'var(--ok)') + '">' + (g ? R.inr(g.margin) + ' → <b>' + (after < 0 ? '−' : '') + R.inr(Math.abs(after)) + '</b>' : '—') + '</td></tr>'; }).join('') + '</tbody></table></div>' + (skip ? '<p style="margin:10px 0 0;font-size:12.5px;color:var(--dim)">' + skip + ' selected vehicle' + (skip === 1 ? ' has' : 's have') + ' no suggestion and will not change.</p>' : ''),
      run: function () { var s = snap(), pr = R.get('revv:price', {}); ch.forEach(function (r) { pr[r.l.id] = r.s.sug.price; }); R.set('revv:price', pr); inv.sel = []; BO.refresh(); BO.toast(ch.length + ' price' + (ch.length === 1 ? '' : 's') + ' updated on the marketplace.', { undo: undoTo(s) }); } });
  }

  /* ================= TEST RIDES ================= */
  var rv = { mode: 'agenda', day: 0 };
  function vRides(el) {
    var rs = rides(), t0 = sod(Date.now()), days = []; for (var i = 0; i < 7; i++) days.push(t0 + i * DAY);
    var today = rs.filter(function (x) { return sod(R.slotDate(x.slot)) === t0; });
    if (matchMedia('(max-width:860px)').matches && rv.mode === 'week') rv.mode = 'agenda';
    el.innerHTML = '<div class="ph"><div><h1>Test rides</h1><p>' + rs.filter(function (x) { return R.slotDate(x.slot) < t0 + 7 * DAY; }).length + ' this week · ' + today.length + ' today</p></div><div class="acts"><div class="seg" role="group" aria-label="View"><button type="button" data-m="agenda" aria-pressed="' + (rv.mode === 'agenda') + '">Agenda</button><button type="button" data-m="day" aria-pressed="' + (rv.mode === 'day') + '">Day</button></div><button type="button" class="btn pri" data-book>' + ic('plus') + 'Book a ride</button></div></div>' +
      '<div class="days" role="group" aria-label="Days">' + days.map(function (t, i) { var n = rs.filter(function (x) { return sod(R.slotDate(x.slot)) === t; }).length; return '<button type="button" class="dy" data-d="' + i + '" aria-pressed="' + (rv.mode === 'day' ? rv.day === i : false) + '"><small>' + (i === 0 ? 'Today' : new Date(t).toLocaleDateString('en-IN', { weekday: 'short' })) + '</small><b>' + new Date(t).getDate() + '</b><span>' + (n ? n + ' ride' + (n > 1 ? 's' : '') : 'free') + '</span></button>'; }).join('') + '</div><div id="rv-b"></div>';
    var box = $('#rv-b', el);
    if (rv.mode === 'agenda') {
      var h = ''; days.forEach(function (t) { var it = rs.filter(function (x) { return sod(R.slotDate(x.slot)) === t; }); if (!it.length) return;
        h += '<h2 class="ag-d">' + esc(relDay(t)) + ' · ' + new Date(t).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }) + '</h2>' + it.map(function (x) { var sd = R.slotDate(x.slot), v = veh(x), past = sd < Date.now() - 45 * 60e3, now = Math.abs(sd - Date.now()) < 45 * 60e3;
          return '<div class="ag' + (past ? ' past' : '') + (now ? ' now' : '') + '"><span class="t">' + hm(sd) + '<small>45 min</small></span><span class="w"><img class="thumb" src="' + v.img + '" alt="" width="56" height="38" loading="lazy"><span style="min-width:0"><b>' + esc(x.name) + '</b><span>' + esc(v.title) + ' · ' + esc(x.where || 'Showroom') + '</span></span></span><button type="button" class="btn sm' + (now ? ' pri' : '') + '" data-open="' + x.id + '">' + (past ? 'Log outcome' : now ? 'Start ride' : 'Open') + '</button></div>'; }).join(''); });
      var later = rs.filter(function (x) { return R.slotDate(x.slot) >= t0 + 7 * DAY; });
      box.innerHTML = h || '<div class="empty">' + ic('cal') + '<b>No rides this week</b><p>Rides booked from the marketplace, chat or your calls show up here.</p><button type="button" class="btn pri" data-book>Book a ride</button></div>';
      if (later.length) box.innerHTML += '<p style="margin:14px 0 0;font-size:12.5px;color:var(--dim)">' + later.length + ' more booked after this week.</p>';
    } else {
      var day = days[rv.day], it = rs.filter(function (x) { return sod(R.slotDate(x.slot)) === day; }), H0 = 10, H1 = Math.max(20, Math.min(23, Math.max.apply(null, it.map(function (x) { return R.slotDate(x.slot).getHours() + 1; }).concat(0)))), PX = 56;
      var nowT = Date.now(), nowY = (new Date(nowT).getHours() + new Date(nowT).getMinutes() / 60 - H0) * PX;
      box.innerHTML = '<div class="dv"><div class="dv-h">' + esc(relDay(day)) + ' · ' + new Date(day).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) + '<span class="chip line" style="margin-left:auto">' + it.length + ' booked</span></div><div class="dv-t">' + (function () { var s = ''; for (var hh = H0; hh < H1; hh++) s += '<div>' + String(hh).padStart(2, '0') + ':00</div>'; return s; })() + '</div><div class="dv-c">' +
        (function () { var s = ''; for (var hh = H0; hh < H1; hh++) s += '<div class="hr"><button type="button" data-free="' + hh + '">+ Book ' + String(hh).padStart(2, '0') + ':00</button></div>'; return s; })() +
        it.map(function (x) { var sd = R.slotDate(x.slot), top = (sd.getHours() + sd.getMinutes() / 60 - H0) * PX, v = veh(x); return '<button type="button" class="ev' + (/home/i.test(x.where || '') ? ' home' : '') + '" style="top:' + (top + 2) + 'px;height:' + (PX * 0.75 - 4) + 'px" data-open="' + x.id + '"><b>' + hm(sd) + ' ' + esc(x.name) + '</b><span>' + esc(v.short) + ' · ' + esc(x.where || 'Showroom') + '</span></button>'; }).join('') +
        (rv.day === 0 && nowY > 0 && nowY < (H1 - H0) * PX ? '<div class="nowline" style="top:' + nowY + 'px" aria-label="Now"></div>' : '') + '</div></div>';
    }
    el.onclick = function (e) { var t = e.target, m = t.closest('[data-m]'); if (m) { rv.mode = m.dataset.m; BO.render(true); return; }
      var dd = t.closest('[data-d]'); if (dd) { rv.day = +dd.dataset.d; rv.mode = 'day'; BO.render(true); return; }
      var o = t.closest('[data-open]'); if (o) { openLead(o.dataset.open); return; }
      var fr = t.closest('[data-free]'); if (fr) { bookRide(days[rv.day] + (+fr.dataset.free) * HOUR); return; }
      if (t.closest('[data-book]')) bookRide(); };
  }
  function bookRide(at) {
    var cands = active().filter(function (x) { return x.stage === 'New' || x.stage === 'Test ride'; }), base = at ? new Date(at) : new Date(Date.now() + DAY);
    if (!at) base.setHours(11, 30, 0, 0);
    BO.slide({ title: 'Book a test ride', body: '<form id="br"><div class="blk"><label class="lbl" for="br-l">Buyer</label><select class="sel" id="br-l">' + cands.map(function (x) { return '<option value="' + x.id + '">' + esc(x.name) + ' · ' + esc(veh(x).short) + '</option>'; }).join('') + '</select></div><div class="blk"><label class="lbl" for="br-d">Date and time</label><input class="inp" type="datetime-local" id="br-d" step="900" value="' + R.slotOf(base).replace(' ', 'T') + '"></div><div class="blk"><label class="lbl" for="br-w">Where</label><select class="sel" id="br-w"><option>Showroom</option><option>Home ride, ' + esc(dealer().area) + '</option></select></div><p id="br-e" role="alert" style="color:var(--bad);font-size:13px;margin:0"></p></form>',
      foot: '<button type="submit" form="br" class="btn pri">Book ride</button>' });
    $('#br').addEventListener('submit', function (e) { e.preventDefault(); var x = find($('#br-l').value), v = $('#br-d').value; if (!x) { $('#br-e').textContent = 'Pick a buyer first.'; return; } var dt = new Date(v); if (isNaN(dt) || dt < Date.now()) { $('#br-e').textContent = 'Pick a time later than now.'; return; }
      var s = snap(); x.slot = R.slotOf(dt); x.where = $('#br-w').value; x.stage = 'Test ride'; x.kind = 'test'; x.contacted = true; log(x, 'Test ride booked for ' + relDay(dt) + ' ' + hm(dt)); save(); BO.closeSlide(true); BO.refresh(); BO.toast('Ride booked: ' + esc(first(x.name)) + ', ' + esc(relDay(dt)) + ' ' + hm(dt) + '.', { undo: undoTo(s) }); });
  }

  /* ================= CONVERSATIONS (Orbit chat engine) ================= */
  var orbit = null, ib = { sel: null, f: 'open' };
  function loadOrbit(cb) {
    if (orbit === true) { cb(); return; } if (orbit) { orbit.push(cb); return; } orbit = [cb];
    var list = ['../assets/bots/engine.js?v=3', '../assets/bots/agents/revv.js?v=1'], n = 0;
    list.forEach(function (src) { var s = document.createElement('script'); s.src = src; s.async = false; s.onload = s.onerror = function () { if (++n === list.length) { var w = orbit; orbit = true; seedChats(); if (window.Orbit) Orbit.convos.on(function () { if (BO.route().id === 'inbox') drawInbox(); BO.counts(); }); w.forEach(function (f) { f(); }); } }; document.head.appendChild(s); });
  }
  function seedChats() {
    if (!window.Orbit) return; var O = window.Orbit;
    mine().filter(function (x) { return x.src === 'Chat'; }).forEach(function (x, i) {
      var id = 'revv-' + me + '-' + x.id; if (!x.seed || (x.convo && x.convo !== id)) return; if (!x.convo) { x.convo = id; } if (O.convos.get(id)) return; var v = veh(x), t = x.at, lb = lastBuyer(x);
      var st = ['waiting', 'human', 'resolved', 'bot'][i % 4], msgs = [
        { from: 'bot', ts: t - 9e4, text: 'Hi, I’m the Revv pit crew. Looking at the **' + v.title + '**? It scored **' + v.score + '/150** on the inspection.' },
        { from: 'user', ts: t - 7e4, text: 'yes, is it still available?' },
        { from: 'bot', ts: t - 6e4, text: 'It is, at ' + dealer().name + ', ' + dealer().area + '. I can book a test ride, work out an EMI or answer anything from the report.' },
        { from: 'user', ts: t, text: lb ? lb.txt : 'Can someone call me?' }];
      if (st !== 'bot') msgs.push({ from: 'bot', kind: 'system', ts: t + 2e4, text: 'Connecting you to the team at ' + dealer().name + '. They can see this chat.' });
      if (st === 'human' || st === 'resolved') msgs.push({ from: 'system', kind: 'system', ts: t + 3e5, text: 'Connected to ' + dealer().rep }, { from: 'agent', name: first(dealer().rep), ts: t + 3.6e5, text: 'Hi ' + first(x.name) + ', ' + first(dealer().rep) + ' here. Happy to help. ' + (st === 'resolved' ? 'I’ve sent you the details on WhatsApp.' : 'Give me a minute to check that.') });
      if (st === 'resolved') msgs.push({ from: 'system', kind: 'system', ts: t + 9e5, text: 'Conversation resolved' });
      msgs.forEach(function (m, k) { m.id = id + '-' + k; });
      O.convos.put({ id: id, seed: true, agent: 'revv', agentName: 'Revv pit crew', dealer: me, lead: x.id, channel: i % 3 === 2 ? 'whatsapp' : 'web', source: i % 3 === 2 ? 'WhatsApp' : 'Website chat', status: st, startedAt: t - 9e4, updatedAt: t + (st === 'waiting' ? 2e4 : 9e5), handoverReason: st === 'bot' ? null : 'Asked for a person: ' + (lb ? lb.txt.slice(0, 40) : 'call back'), engaged: true, user: { name: x.name }, mem: {}, context: { id: v.l ? v.l.id : '' }, messages: msgs });
      var c = O.convos.get(id); c.updatedAt = t + (st === 'waiting' ? 2e4 : 9e5);
    });
    save();
  }
  function convos() { if (!window.Orbit) return []; return Orbit.convos.list().filter(function (c) { return c.agent === 'revv' && (c.engaged || c.status !== 'bot') && (!c.dealer || c.dealer === me); }); }
  function vInbox(el, q) {
    if (q.c) ib.sel = q.c;
    el.innerHTML = '<div class="ph"><div><h1>Conversations</h1><p>Chats from the marketplace assistant and WhatsApp. Take over any chat; hand it back when you’re done.</p></div></div><div class="ibx" id="ibx"><div class="ibx-l"><div class="ibx-lh"><div class="seg" role="group" aria-label="Filter"><button type="button" data-if="open">Open</button><button type="button" data-if="waiting">Waiting</button><button type="button" data-if="resolved">Resolved</button></div></div><ul class="ibx-list" id="ibx-l"><li style="padding:12px"><span class="sk" style="height:12px;width:70%;margin-bottom:8px"></span><span class="sk" style="height:10px;width:90%"></span></li><li style="padding:12px"><span class="sk" style="height:12px;width:60%;margin-bottom:8px"></span><span class="sk" style="height:10px;width:80%"></span></li></ul></div><div class="ibx-m" id="ibx-m"></div><aside class="ibx-r" id="ibx-r" aria-label="Buyer"></aside></div>';
    el.onclick = function (e) { var f = e.target.closest('[data-if]'); if (f) { ib.f = f.dataset.if; drawInbox(); return; } var it = e.target.closest('[data-c]'); if (it) { ib.sel = it.dataset.c; history.replaceState(null, '', '#/inbox?c=' + ib.sel); drawInbox(true); return; } if (e.target.closest('[data-back]')) { ib.sel = null; history.replaceState(null, '', '#/inbox'); drawInbox(); } };
    loadOrbit(function () { drawInbox(true); });
  }
  function drawInbox(scroll) {
    var el = $('#ibx'); if (!el || !window.Orbit) return; var O = window.Orbit, all = convos();
    $$('[data-if]', el).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.if === ib.f); });
    var list = all.filter(function (c) { return ib.f === 'open' ? c.status !== 'resolved' : ib.f === 'waiting' ? c.status === 'waiting' : c.status === 'resolved'; });
    var lbl = { bot: ['Assistant', 'line'], waiting: ['Waiting', 'sig'], human: ['With you', 'info'], resolved: ['Resolved', 'ok'] };
    $('#ibx-l').innerHTML = list.length ? list.map(function (c) { var m = c.messages[c.messages.length - 1] || {}, s = lbl[c.status] || lbl.bot; return '<li><button type="button" class="ibx-it" data-c="' + c.id + '" aria-current="' + (c.id === ib.sel) + '"><span class="av">' + esc(BO.initials((c.user && c.user.name) || 'Visitor')) + '</span><b>' + esc((c.user && c.user.name) || 'Visitor') + '</b><time>' + BO.ago(c.updatedAt || c.startedAt) + '</time><em><span class="chip ' + s[1] + '" style="margin-right:6px">' + s[0] + '</span>' + esc(String(m.text || '').replace(/\*\*/g, '').slice(0, 80)) + '</em></button></li>'; }).join('')
      : '<li class="empty" style="min-height:160px"><p>' + (ib.f === 'waiting' ? 'Nobody is waiting for a person. Chats the assistant hands over land here.' : ib.f === 'resolved' ? 'No resolved chats yet.' : 'No open chats. Ask the assistant something on any marketplace page and it appears here.') + '</p></li>';
    if (!ib.sel && list.length && !matchMedia('(max-width:860px)').matches) ib.sel = list[0].id;
    var c = ib.sel && O.convos.get(ib.sel); el.classList.toggle('has-sel', !!c);
    var m = $('#ibx-m'), r = $('#ibx-r');
    if (!c) { m.innerHTML = '<div class="empty" style="flex:1">' + ic('chat') + '<b>Pick a conversation</b><p>Waiting chats need a person. Everything the assistant said is in the transcript, so buyers never repeat themselves.</p></div>'; r.innerHTML = ''; return; }
    var x = c.lead && find(c.lead) || leads.filter(function (y) { return y.convo === c.id; })[0], v = x ? veh(x) : (c.context && c.context.id ? (function () { var l = R.byId(c.context.id); return l ? { title: R.title(l), img: R.img(l, true), price: l.price, score: l.score, l: l } : null; })() : null);
    m.innerHTML = '<div class="ibx-mh"><button type="button" class="ib" data-back aria-label="Back to the list" style="display:' + (matchMedia('(max-width:860px)').matches ? 'inline-grid' : 'none') + '">' + ic('arrow') + '</button><span class="av">' + esc(BO.initials((c.user && c.user.name) || 'V')) + '</span><div style="flex:1;min-width:0"><b>' + esc((c.user && c.user.name) || 'Visitor') + '</b><small>' + esc(c.source || c.channel) + (c.handoverReason ? ' · ' + esc(c.handoverReason) : '') + '</small></div><span class="chip ' + (lbl[c.status] || lbl.bot)[1] + '">' + (lbl[c.status] || lbl.bot)[0] + '</span></div>' +
      '<div class="ibx-log" role="log" aria-live="polite">' + c.messages.map(function (g) { var k = g.kind === 'system' || g.from === 'system' ? 'sys' : g.from === 'user' ? 'user' : g.from === 'agent' ? 'agent' : 'bot'; return '<div class="msg ' + k + '">' + esc(String(g.text || (g.cards ? '[' + g.cards.length + ' vehicle card' + (g.cards.length > 1 ? 's' : '') + ']' : '')).replace(/\*\*/g, '')) + (k === 'sys' ? '' : '<small>' + (k === 'user' ? esc((c.user && c.user.name) || 'Visitor') : k === 'agent' ? esc(g.name || 'You') : 'Assistant') + ' · ' + hm(g.ts) + '</small>') + '</div>'; }).join('') + '</div>' +
      '<div class="ibx-f">' + (c.status === 'human' ? '<div class="qr">' + ['Checking that for you now.', 'Can I call you in two minutes?', 'Booked. You’ll get the details on WhatsApp.', 'The full report is on the listing page.'].map(function (t) { return '<button type="button" class="fchip" data-qr="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div><form class="reply" style="margin:0" id="ibx-f"><label class="sr" for="ibx-i">Reply</label><input class="inp" id="ibx-i" autocomplete="off" placeholder="Reply as ' + esc(first(dealer().rep)) + '…"><button class="btn pri" type="submit">Send</button></form><div style="display:flex;gap:8px"><button type="button" class="btn sm" data-ia="bot">' + ic('undo') + 'Hand back to assistant</button><button type="button" class="btn sm" data-ia="resolve">' + ic('check') + 'Resolve</button></div>'
        : c.status === 'resolved' ? '<p style="margin:0;font-size:12.5px;color:var(--mute)">Resolved. A new message from the buyer reopens it.</p>' : '<div style="display:flex;gap:8px;align-items:center"><button type="button" class="btn pri" data-ia="take">' + (c.status === 'waiting' ? 'Take over this chat' : 'Join this chat') + '</button><span style="font-size:12.5px;color:var(--mute)">' + (c.status === 'waiting' ? 'Waiting ' + BO.ago(c.handoverAt || c.updatedAt) + '. The buyer has been told a person is coming.' : 'The assistant is handling this one.') + '</span></div>') + '</div>';
    r.innerHTML = '<p class="sec-t">Buyer</p>' + (x ? '<p style="margin:0 0 4px;color:var(--bone);font-weight:600">' + esc(x.name) + '</p><p style="margin:0 0 12px;font-size:12.5px;color:var(--mute)">' + esc(x.stage) + ' · lead ' + esc(x.id) + '</p><button type="button" class="btn sm" data-lead-open="' + x.id + '" style="width:100%;margin-bottom:16px">Open lead</button>' : '<p style="font-size:12.5px;color:var(--mute)">No lead yet. One is created when the buyer books a ride or leaves a number.</p>') +
      (v ? '<p class="sec-t">Viewing</p><a class="veh" href="vehicle.html?id=' + esc(v.l ? v.l.id : '') + '" target="_blank" rel="noopener" style="flex-direction:column;align-items:flex-start"><img src="' + v.img + '" alt="" width="220" height="146" style="width:100%;height:auto;border-radius:3px"><b>' + esc(v.title) + '</b><span>' + R.inr(v.price) + ' · ' + v.score + '/150</span></a>' : '');
    var log2 = $('.ibx-log', m); log2.scrollTop = log2.scrollHeight;
    m.onclick = function (e) { var a = e.target.closest('[data-ia]'), q2 = e.target.closest('[data-qr]'); if (q2) send(q2.dataset.qr); if (!a) return; var k = a.dataset.ia, who = first(dealer().rep);
      if (k === 'take') { O.convos.setStatus(c.id, 'human', { person: who }); O.convos.append(c.id, { from: 'system', kind: 'system', text: 'Connected to ' + who + ' at ' + dealer().name }); }
      if (k === 'bot') { O.convos.setStatus(c.id, 'bot', { person: null }); O.convos.append(c.id, { from: 'system', kind: 'system', text: 'You’re back with the assistant. Anything else?' }); }
      if (k === 'resolve') { O.convos.setStatus(c.id, 'resolved'); O.convos.append(c.id, { from: 'system', kind: 'system', text: 'Conversation resolved by ' + who }); BO.toast('Resolved.'); }
      drawInbox(); };
    function send(t) { O.convos.append(c.id, { from: 'agent', name: first(dealer().rep), text: t }); if (x) { (x.thread = x.thread || []).push({ from: 'dealer', at: Date.now(), txt: t }); x.contacted = true; save(); } drawInbox(); var i = $('#ibx-i'); if (i) i.focus(); }
    var f = $('#ibx-f'); if (f) f.addEventListener('submit', function (e) { e.preventDefault(); var i = $('#ibx-i'), t = i.value.trim(); if (t) send(t); });
    var lo = $('[data-lead-open]', r); if (lo) lo.addEventListener('click', function () { openLead(lo.dataset.leadOpen); });
    if (scroll && matchMedia('(max-width:860px)').matches) $('#ibx').scrollIntoView({ block: 'start' });
  }

  /* ================= COMMISSION STATEMENT ================= */
  var cm = { k: null };
  function vCommission(el) {
    var sold = mine().filter(function (x) { return x.stage === 'Sold' && x.soldAt; }), months = {}, d = dealer();
    sold.forEach(function (x) { var dt = new Date(x.soldAt), k = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0'); (months[k] = months[k] || []).push(x); });
    var now = new Date(), curK = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'); if (!months[curK]) months[curK] = [];
    var keys = Object.keys(months).sort().reverse(); if (!cm.k || keys.indexOf(cm.k) < 0) cm.k = curK;
    function tot(list) { var g = list.reduce(function (s, x) { return s + (x.price || 0); }, 0), c = g * R.COMMISSION, t = c * 0.18; return { g: g, c: c, t: t, p: c + t, paid: list.length && list.every(function (x) { return x.paid; }) }; }
    function label(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }); }
    var list = months[cm.k].sort(function (a, b) { return a.soldAt - b.soldAt; }), T = tot(list), p = cm.k.split('-'), due = new Date(+p[0], +p[1], 5), open = cm.k === curK;
    el.innerHTML = '<div class="ph"><div><h1>Commission</h1><p>1.5% of each sale price plus 18% GST, settled by the 5th of the next month.</p></div><div class="acts no-print"><button type="button" class="btn" data-print>' + ic('print') + 'Download PDF</button>' + (!T.paid && list.length && !open ? '<button type="button" class="btn pri" data-paid>Record payment</button>' : '') + '</div></div>' +
      '<div class="stm"><article class="doc" aria-labelledby="st-h"><header class="doc-h"><div><p class="sec-t" style="margin:0 0 4px">Statement · ' + esc(d.name) + '</p><h2 id="st-h">' + esc(label(cm.k)) + '</h2><p>' + esc(d.area + ', ' + d.city) + ' · GSTIN on file · ' + (open ? 'Running total, closes on the last day of the month' : 'Due ' + due.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })) + '</p></div><div class="due"><span class="chip ' + (T.paid ? 'ok' : open ? 'info' : 'warn') + '">' + (T.paid ? 'Paid' : open ? 'Open' : 'Due') + '</span><b class="num">' + R.inrFull(T.p) + '</b><span style="font-size:12px;color:var(--mute)">' + (T.paid ? 'Settled' : 'Payable to Revv') + '</span></div></header>' +
      '<dl class="sum"><div><dt>Sales</dt><dd>' + list.length + '</dd></div><div><dt>Gross sales</dt><dd>' + R.inrFull(T.g) + '</dd></div><div><dt>Commission 1.5%</dt><dd>' + R.inrFull(T.c) + '</dd></div><div><dt>GST 18%</dt><dd>' + R.inrFull(T.t) + '</dd></div></dl>' +
      '<div class="tbl-w cards"><table class="tbl"><thead><tr><th scope="col">Date</th><th scope="col">Vehicle</th><th scope="col">Buyer</th><th scope="col" class="r">Sale price</th><th scope="col" class="r">Commission</th></tr></thead><tbody>' +
      (list.length ? list.map(function (x) { var v = veh(x); return '<tr><td class="num" data-l="Date">' + new Date(x.soldAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + '</td><td class="vcell"><div class="vc"><img class="thumb" src="' + v.img + '" alt="" width="56" height="38" loading="lazy"><span><b>' + esc(v.title) + '</b><span>' + esc(x.id) + '</span></span></div></td><td data-l="Buyer">' + esc(x.name) + '</td><td class="r num" data-l="Sale price">' + R.inrFull(x.price) + '</td><td class="r num" data-l="Commission">' + R.inrFull(x.price * R.COMMISSION) + '</td></tr>'; }).join('')
        : '<tr><td colspan="5"><div class="empty"><b>No sales yet this month</b><p>Move a lead to Sold, or log “Sold” from a call, and the line appears here with its commission.</p><a class="btn" href="#/pipeline?stage=Finance">Open Finance stage</a></div></td></tr>') + '</tbody></table></div>' +
      '<p class="doc-f">Revv Marketplace · commission under the dealer agreement, clause 4.2. Questions: your account manager in the app. Payments are recorded here; no payment is taken on this screen.</p></article>' +
      '<aside class="panel hist-col" aria-labelledby="sh-h"><div class="panel-h"><h2 id="sh-h">Statements</h2></div><ul class="hist-l">' + keys.map(function (k) { var t = tot(months[k]); return '<li><button type="button" data-k="' + k + '" aria-current="' + (k === cm.k) + '"><b>' + esc(label(k)) + '</b><span class="num">' + R.inr(t.p) + '</span><span class="chip ' + (t.paid ? 'ok' : k === curK ? 'info' : 'warn') + '">' + (t.paid ? 'Paid' : k === curK ? 'Open' : 'Due') + '</span></button></li>'; }).join('') + '</ul></aside></div>';
    el.onclick = function (e) { var k = e.target.closest('[data-k]'); if (k) { cm.k = k.dataset.k; BO.render(true); return; } if (e.target.closest('[data-print]')) print();
      if (e.target.closest('[data-paid]')) { var s = snap(); list.forEach(function (x) { x.paid = true; log(x, 'Commission settled'); }); save(); BO.refresh(); BO.toast('Payment recorded for ' + esc(label(cm.k)) + '.', { undo: undoTo(s) }); } };
  }

  /* ================= SHELL ================= */
  var cfg = {
    title: 'Revv dealer', section: 'Dealer', home: 'today',
    user: { name: dealer().rep, role: 'Sales lead' },
    nav: [{ items: [{ id: 'today', label: 'Today', icon: 'home', view: vToday }, { id: 'focus', label: 'Calls', icon: 'phone', short: 'Calls' }, { id: 'inbox', label: 'Conversations', icon: 'chat', short: 'Chats' }] },
      { group: 'Sell', items: [{ id: 'pipeline', label: 'Pipeline', icon: 'board' }, { id: 'rides', label: 'Test rides', icon: 'cal', short: 'Rides' }, { id: 'inventory', label: 'Inventory', icon: 'stock' }] },
      { group: 'Money', items: [{ id: 'commission', label: 'Commission', icon: 'rupee' }] },
      { group: 'Revv', items: [{ href: 'listings.html', label: 'Marketplace', icon: 'ext' }, { href: 'admin.html', label: 'Admin', icon: 'shield' }] }],
    views: { today: vToday, focus: vFocus, pipeline: vPipeline, inventory: vInventory, rides: vRides, inbox: vInbox, commission: vCommission },
    tabs: ['today', 'focus', 'pipeline', 'money', 'more'],
    hot: ['focus', 'inbox'],
    counts: function () { var now = Date.now(); return { today: needs().length, focus: callQueue().length, inbox: waitingChats().length, pipeline: active().filter(function (x) { return x.stage !== 'Sold'; }).length, rides: rides().filter(function (x) { return sod(R.slotDate(x.slot)) === sod(now); }).length, inventory: myListings().filter(function (l) { return stock(l).sug; }).length }; },
    switcher: function () { var d = dealer(); return { label: d.name, sub: d.area + ', ' + d.city, value: me, options: R.dealers().map(function (x) { return { id: x.id, label: x.name + ' · ' + x.city }; }), pick: function (id) { me = id; R.set(R.K.me, id); fx = { done: 0, skip: [], pick: null, slot: null, dayOff: 0 }; ib.sel = null; var b = $('.bo-me'); if (b) b.innerHTML = '<span class="av">' + esc(BO.initials(dealer().rep)) + '</span><span><b>' + esc(dealer().rep) + '</b><small>Sales lead</small></span>'; } }; },
    topActions: '<button type="button" class="btn pri" data-newlead aria-label="New lead">' + ic('plus') + '<span class="hide-m">New lead</span></button>',
    actions: [{ label: 'New lead', kb: 'N', run: function () { newLead(); } }, { label: 'Start calls', icon: 'phone', kb: 'C', run: function () { BO.go('focus'); } }, { label: 'Book a test ride', icon: 'cal', run: function () { bookRide(); } }],
    search: function (q) { var out = []; mine().forEach(function (x) { if ((x.name + ' ' + x.id + ' ' + veh(x).title).toLowerCase().indexOf(q) > -1) out.push({ g: 'Leads', label: x.name, sub: veh(x).short + ' · ' + (x.lost ? 'Lost' : x.stage), icon: 'users', run: function () { openLead(x.id); } }); });
      myListings().forEach(function (l) { if ((R.title(l) + ' ' + l.id).toLowerCase().indexOf(q) > -1) out.push({ g: 'Inventory', label: R.title(l), sub: R.inr(l.price), icon: 'stock', run: function () { BO.go('inventory'); } }); }); return out.slice(0, 8); },
    searchHint: 'Search buyers, vehicles or jump to…',
    keys: { n: function () { newLead(); }, c: function () { BO.go('focus'); } }
  };
  // money, refurbishment, deals, appraisals, closing and team live in their own files and plug in here
  window.DEALER = { me: function () { return me; }, dealer: dealer, mine: mine, active: active, find: find, leads: function () { return leads; }, save: save, veh: veh, stock: stock, myListings: myListings, openLead: openLead, move: move };
  (window.DEALER_EXT || []).forEach(function (f) { try { f(cfg, window.DEALER); } catch (e) { if (window.console) console.error(e); } });
  BO.init(cfg);
  document.addEventListener('click', function (e) { if (e.target.closest('[data-newlead]')) newLead(); });
  // another tab (the marketplace, the chat) added a lead: pick it up live
  addEventListener('storage', function (e) { if (e.key === R.K.leads) { var before = leads.length; leads = R.leads(); if (leads.length > before && leads[0].dealer === me) BO.toast('New lead: <b>' + esc(leads[0].name) + '</b> · ' + esc(veh(leads[0]).short) + (leads[0].src === 'Chat' ? ' · from chat' : '')); BO.refresh(); } if (e.key === 'orbit-convos') BO.counts(); });
  if (deep) { history.replaceState(null, '', location.pathname + '#/pipeline'); BO.render(); setTimeout(function () { openLead(deep); }, 120); }
  // a lead can also come from the chat in this tab, so warm up the counts once the engine is around
  if (localStorage.getItem('orbit-convos')) setTimeout(function () { loadOrbit(function () { BO.counts(); }); }, 1500);
})();
