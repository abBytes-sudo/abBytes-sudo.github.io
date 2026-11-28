/* Orbit Assistants: one trade page. Reads <body data-trade="clinic"> and the content set in trade.js, then fills:
   the live assistant in the hero, the trade's night shift, its five jobs, the inbox it feeds (live: hand a chat over
   in the phone and take it over here), the bookings and leads it saved, the brief, and the other trades. */
(function () {
  'use strict';
  var d = document, TR = window.OrbitTrades, U = window.OrbitUI, O = null;
  var id = d.body.getAttribute('data-trade'), t = TR && TR.byId[id];
  if (!t || !U) return;
  var reduce = U.reduce;
  var CHN = { web: 'Web chat', whatsapp: 'WhatsApp', instagram: 'Instagram' }, SRC = { web: 'Google search', whatsapp: 'WhatsApp click-to-chat', instagram: 'Instagram ad' };
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || d).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ago(ts) { var m = Math.max(1, Math.round((Date.now() - ts) / 6e4)); return m < 60 ? m + ' m' : m < 1440 ? Math.round(m / 60) + ' h' : Math.round(m / 1440) + ' d'; }
  function initials(n) { return String(n || '?').split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase(); }
  var IC = {
    whatsapp: '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-4A8.2 8.2 0 1 1 8 18.7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    instagram: '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    web: '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 12h17M12 3.5c3 3.5 3 13.5 0 17M12 3.5c-3 3.5-3 13.5 0 17" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    ok: '<svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrow: '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'
  };

  /* ---------- the live assistant ---------- */
  var chat = null, phone = $('#tpPhone'), wrap = $('.tp-phone');
  function mount() {
    if (!phone) return;
    if (!O || !O.mount || !O.agents[t.agent]) { phone.innerHTML = '<div class="ib-empty"><p>The assistant didn’t load. Refresh the page to try again.</p></div>'; return; }
    chat = O.mount(phone, { agent: t.agent, channel: t.ch, source: SRC[t.ch] });
    U.patch(chat, t.biz);
  }
  var pending = null;
  function send(q) {
    if (!chat) { pending = q; return; }
    var r = phone.getBoundingClientRect();
    if (r.top < 60 || r.bottom > innerHeight) phone.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    /* a suggested message is a new topic: leave any half-finished flow first */
    setTimeout(function () { try { if (chat.session.flow && chat.session.convo.status === 'bot') chat.session.endFlow(); } catch (e) {} chat.send(q); }, reduce ? 0 : 350);
  }
  function tries() {
    var el = $('#tpTries'); if (!el) return;
    el.innerHTML = '<p>Or tap a message a ' + esc(t.people.split(' ')[0].replace(/s$/, '')) + ' might send</p><div class="chips">' + t.questions.map(function (q) { return '<button type="button" class="chip">' + esc(q) + '</button>'; }).join('') + '</div>';
    $$('.chip', el).forEach(function (b) { b.addEventListener('click', function () { send(b.textContent); }); });
  }

  /* ---------- the night shift ---------- */
  function night() {
    var el = $('#ntTrack'); if (!el) return; var s = t.story, ch = s.ch;
    function frame(time, label, cap, ui, am) { return '<li class="nt-s' + (am ? ' am' : '') + '"><div class="nt-h"><time>' + time + '</time><span>' + label + '</span></div><p class="nt-c">' + esc(cap) + '</p><div class="nt-ui">' + ui + '</div></li>'; }
    var crm = '<ul class="nt-crm" aria-label="Leads in the CRM">' + s.crm.map(function (r) { return '<li class="' + (r.hot ? 'hot' : '') + '"><i aria-hidden="true"></i><span><b>' + esc(r.name) + '</b><small>' + esc(r.need) + ' · ' + esc(r.src) + '</small></span><em>' + esc(r.hot ? 'new · ' + r.stage : r.stage) + '</em></li>'; }).join('') + '</ul>';
    var rank = '<div class="nt-rank"><p>' + esc(s.rank.q) + '</p><ol>' + s.rank.items.map(function (x) { return '<li><span>' + esc(x[0]) + '<small>' + esc(x[1]) + '</small></span></li>'; }).join('') + '</ol></div>';
    el.innerHTML = [
      frame('11:42 pm', 'Message', s.caps[0], '<span class="bub c">' + esc(s.m1) + '</span>'),
      frame('11:42 pm', 'Reply', s.caps[1], '<span class="bub a">' + esc(s.r1) + '</span><div class="nt-card"><b>' + esc(s.card.title) + '</b><small>' + esc(s.card.meta) + '</small><strong>' + esc(s.card.price) + '</strong></div>'),
      frame('11:43 pm', 'Booked', s.caps[2], '<span class="bub c">' + esc(s.m2) + '</span><span class="bub a">' + esc(s.r2) + '</span><div class="nt-bk">' + IC.ok + '<b>' + esc(s.booking.h) + ' · ' + esc(s.booking.day) + ', ' + esc(s.booking.time) + '</b><small>' + esc(s.booking.where) + ' · ' + esc(s.booking.ref) + '</small></div>'),
      frame('11:44 pm', 'In the CRM', s.caps[3], crm),
      frame('9:05 am', 'Assigned', s.caps[4], rank + '<div class="nt-toast"><span class="av" aria-hidden="true">' + esc(t.staff.name.charAt(0)) + '</span><span>Assigned to <b>' + esc(t.staff.name) + '</b> · ' + esc(t.staff.role) + '</span></div>', true)
    ].join('');
    reveal($$('.nt-s', el), 120);
  }
  function reveal(items, step) {
    if (reduce || !('IntersectionObserver' in window) || !d.documentElement.classList.contains('om')) return;
    items.forEach(function (x) { if (x.getBoundingClientRect().top > innerHeight * 0.92) x.classList.add('pre'); });
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) return; io.unobserve(e.target); var i = items.indexOf(e.target); setTimeout(function () { e.target.classList.remove('pre'); }, Math.max(0, i) % 5 * step); }); }, { rootMargin: '0px 0px -12% 0px' });
    items.forEach(function (x) { io.observe(x); });
  }

  /* ---------- five jobs ---------- */
  function flows() {
    var el = $('#flGrid'); if (!el) return;
    el.innerHTML = t.flows.map(function (f, i) {
      return '<li class="fl-c"><span class="fl-n">0' + (i + 1) + '</span><h3>' + esc(f.t) + '</h3><p>' + esc(f.d) + '</p><div class="fl-x"><span class="bub c">' + esc(f.q) + '</span></div><button type="button" class="btn ghost sm fl-try" data-q="' + esc(f.q) + '">Send it to the assistant ' + IC.arrow + '</button></li>';
    }).join('');
    $$('.fl-try', el).forEach(function (b) { b.addEventListener('click', function () { send(b.getAttribute('data-q')); }); });
    reveal($$('.fl-c', el), 90);
  }

  /* ---------- the inbox ---------- */
  var sel = null, filter = 'all', rq = 0;
  function seed() {
    if (!O || !O.convos) return; var now = Date.now();
    (t.inbox || []).forEach(function (s) {
      var cid = 'trd-' + t.id + '-' + s.id; if (O.convos.get(cid)) return;
      var start = now - s.ago * 6e4, msgs = [];
      s.msgs.forEach(function (m, j) { var o = { id: cid + '-m' + j, from: m[0], text: m[1], ts: start + j * 6e4 }; if (m[0] === 'agent') o.name = m[2]; msgs.push(o); });
      if (s.status === 'human') msgs.splice(1, 0, { id: cid + '-s', from: 'system', kind: 'system', text: 'Connected to ' + t.staff.name + ' (' + t.staff.role + ')', ts: start + 3e4 });
      O.convos.put({ id: cid, seed: true, at: start + (msgs.length - 1) * 6e4, agent: t.agent, agentName: t.biz, channel: s.ch, source: SRC[s.ch], status: s.status, startedAt: start, engaged: true, user: { name: s.who }, mem: {}, context: {}, messages: msgs, handoverReason: s.why || null, person: s.status === 'human' ? t.staff.name + ' (' + t.staff.role + ')' : null, booked: s.booked || null });
    });
  }
  function when(c) { return c.at && c.seed ? c.at : (c.updatedAt || c.startedAt); }
  function convos() {
    return O.convos.list().filter(function (c) { return c.agent === t.agent && (c.engaged || c.status !== 'bot'); })
      .sort(function (a, b) { return when(b) - when(a); });
  }
  function stLabel(c) {
    if (c.status === 'waiting') return ['waiting', 'Needs a person'];
    if (c.status === 'human') return ['human', 'With ' + (String(c.person || t.staff.name).split(' (')[0])];
    if (c.status === 'resolved') return ['resolved', 'Resolved'];
    if (c.booked || c.leadId) return ['booked', 'Booked'];
    return ['bot', 'Handled'];
  }
  function kpis() {
    var el = $('#ibK'); if (!el || !O.analytics) return; var s = O.analytics.summary({ days: 7, agent: t.agent });
    el.innerHTML = '<div><b>' + s.conversations + '</b><span>chats this week</span></div><div><b>' + s.handledPct + '%</b><span>finished without a person</span></div><div><b>' + s.bookings + '</b><span>bookings</span></div><div><b>' + s.leads + '</b><span>leads saved</span></div>';
  }
  function list() {
    var all = convos(), shown = all.filter(function (c) { return filter === 'all' || (filter === 'waiting' ? c.status === 'waiting' : (c.booked || c.leadId)); });
    var n = { all: all.length, waiting: all.filter(function (c) { return c.status === 'waiting'; }).length, booked: all.filter(function (c) { return c.booked || c.leadId; }).length };
    $$('#ibF button').forEach(function (b) { var k = b.getAttribute('data-f'); b.setAttribute('aria-pressed', String(k === filter)); b.querySelector('span').textContent = n[k]; });
    if (!sel || !shown.some(function (c) { return c.id === sel; })) { var w = shown.filter(function (c) { return c.status === 'waiting'; })[0] || shown[0]; sel = w ? w.id : null; }
    var ul = $('#ibList');
    ul.innerHTML = shown.length ? shown.map(function (c) {
      var m = c.messages[c.messages.length - 1] || {}, st = stLabel(c), live = !c.seed;
      return '<li><button type="button" class="ib-it' + (live ? ' live' : '') + '" data-id="' + esc(c.id) + '" aria-current="' + (c.id === sel) + '"><span class="ib-av" aria-hidden="true">' + esc(live ? 'YOU' : initials(c.user && c.user.name)) + '</span><span class="ib-tx"><b>' + esc(c.user && c.user.name ? c.user.name : (live ? 'You, a minute ago' : 'Visitor')) + '</b><small>' + IC[c.channel] + ' ' + esc(CHN[c.channel] || c.channel) + ' · ' + esc(c.source || '') + '</small><em>' + esc(String(m.text || '').replace(/\*\*/g, '')) + '</em></span><span class="ib-m">' + ago(when(c)) + '<span class="st ' + st[0] + '">' + esc(st[1]) + '</span></span></button></li>';
    }).join('') : '<li class="ib-empty"><span class="bub a">Nothing here yet. Send a message in the phone above; it lands here.</span></li>';
    $$('.ib-it', ul).forEach(function (b) { b.addEventListener('click', function () { sel = b.getAttribute('data-id'); list(); view(); if (matchMedia('(max-width:1100px)').matches) $('#ibView').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' }); }); });
  }
  var QUICK = { clinic: ['Let me check with the doctor.', 'Done, you’re booked.', 'Can I call you in two minutes?'], salon: ['Let me check the diary.', 'Done, you’re booked in.', 'Can I call you in two minutes?'], restaurant: ['Let me check the floor plan.', 'Done, your table is held.', 'Can I call you in two minutes?'], realestate: ['Let me check with the owner.', 'Done, your visit is booked.', 'Can I call you in two minutes?'], construction: ['Let me check with the site team.', 'Done, the visit is booked.', 'Can I call you in two minutes?'], store: ['Let me check the order.', 'Done, it’s sorted.', 'Can I call you in two minutes?'] };
  function view() {
    var box = $('#ibView'), c = sel && O.convos.get(sel);
    if (!c) { box.innerHTML = '<div class="ib-empty"><span class="bub a">Pick a conversation to read it.</span></div>'; return; }
    var st = stLabel(c), person = t.staff.name + ' (' + t.staff.role + ')', h = '';
    h += '<div class="ib-vh"><span class="ib-av" aria-hidden="true">' + esc(c.seed ? initials(c.user && c.user.name) : 'YOU') + '</span><div><b>' + esc(c.user && c.user.name ? c.user.name : 'You, a minute ago') + '</b><small>' + esc(CHN[c.channel] || c.channel) + ' · from ' + esc(c.source || 'chat') + '</small></div><span class="st ' + st[0] + '">' + esc(st[1]) + '</span></div>';
    var why = []; if (c.handoverReason) why.push('Why: ' + c.handoverReason); if (c.booked) why.push(c.booked); if (c.leadId) why.push('Lead ' + c.leadId);
    if (why.length) h += '<div class="ib-why">' + why.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>';
    h += '<div class="ib-log" role="log" aria-label="Transcript">' + c.messages.map(function (m) {
      var tx = esc(String(m.text || (m.cards ? '[' + m.cards.length + ' card' + (m.cards.length > 1 ? 's' : '') + ' shown]' : ''))).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
      if (m.kind === 'system' || m.from === 'system') return '<p class="sys">' + tx + '</p>';
      if (m.from === 'user') return '<p class="bub c">' + tx + '</p>';
      if (m.from === 'agent') return '<p class="bub p"><small>' + esc(m.name || t.staff.name) + '</small>' + tx + '</p>';
      return '<p class="bub a"><small>Assistant</small>' + tx + '</p>';
    }).join('') + '</div><div class="ib-act" id="ibAct"></div>';
    box.innerHTML = h; var log = $('.ib-log', box); log.scrollTop = log.scrollHeight;
    var act = $('#ibAct');
    if (c.status === 'waiting' || c.status === 'bot') {
      act.innerHTML = '<div class="ib-row"><button type="button" class="btn sm" id="ibTake">' + (c.status === 'waiting' ? 'Take over as ' + esc(t.staff.name) : 'Join this chat') + '</button></div>';
      $('#ibTake').addEventListener('click', function () { O.convos.setStatus(c.id, 'human', { person: person }); O.convos.append(c.id, { from: 'system', kind: 'system', text: 'Connected to ' + person }); if (O.events) O.events.log('agent_reply', { agent: c.agent, channel: c.channel, source: c.source, convo: c.id, kind: 'takeover' }); setTimeout(function () { var i = $('#ibReply'); if (i) i.focus(); }, 60); });
    } else if (c.status === 'human') {
      act.innerHTML = '<div class="ib-q">' + (QUICK[t.id] || QUICK.clinic).map(function (q) { return '<button type="button">' + esc(q) + '</button>'; }).join('') + '</div><form id="ibForm"><label class="sr" for="ibReply">Reply as ' + esc(t.staff.name) + '</label><input id="ibReply" type="text" autocomplete="off" placeholder="Reply as ' + esc(t.staff.name) + '…"><button type="submit" class="btn sm">Send</button></form><div class="ib-row"><button type="button" class="lnk-b" id="ibBack">Hand back to the assistant</button><button type="button" class="lnk-b" id="ibDone">Mark resolved</button></div>';
      function reply(tx) { O.convos.append(c.id, { from: 'agent', name: t.staff.name, text: tx }); if (O.events) O.events.log('agent_reply', { agent: c.agent, channel: c.channel, source: c.source, convo: c.id }); }
      $$('.ib-q button', act).forEach(function (b) { b.addEventListener('click', function () { reply(b.textContent); }); });
      $('#ibForm').addEventListener('submit', function (e) { e.preventDefault(); var i = $('#ibReply'); var v = i.value.trim(); if (v) { reply(v); i.value = ''; } });
      $('#ibBack').addEventListener('click', function () { O.convos.setStatus(c.id, 'bot', { person: null }); O.convos.append(c.id, { from: 'system', kind: 'system', text: 'You’re back with the assistant. Anything else I can help with?' }); });
      $('#ibDone').addEventListener('click', function () { O.convos.setStatus(c.id, 'resolved'); O.convos.append(c.id, { from: 'system', kind: 'system', text: 'Resolved by ' + t.staff.name }); if (O.events) O.events.log('resolved', { agent: c.agent, channel: c.channel, source: c.source, convo: c.id, by: 'person' }); });
    } else act.innerHTML = '<p class="ib-note">Resolved. It stays in the history, with the full chat.</p>';
  }
  function fmtPayload(l) {
    var p = l.payload || {}, out = [];
    ['title', 'treatment', 'service', 'project', 'item', 'topic', 'package'].forEach(function (k) { if (p[k]) out.push(p[k]); });
    if (p.services && p.services.length) out.push(p.services.join(', '));
    if (p.doctor) out.push(p.doctor); if (p.stylists && p.stylists.length) out.push(p.stylists.join(', '));
    if (p.party) out.push(p.party + (p.party === 1 ? ' guest' : ' guests')); if (p.bhk) out.push(p.bhk + ' BHK'); if (p.budget) out.push(p.budget); if (p.area) out.push(p.area + ' sq ft'); if (p.locality) out.push(p.locality);
    if (p.date || p.day) out.push(String(p.date || p.day)); if (p.time) out.push(String(p.time)); if (p.slot) out.push(p.slot);
    if (p.estimateLow && p.estimateHigh && O.money) out.push(O.money(p.estimateLow, '₹') + ' to ' + O.money(p.estimateHigh, '₹'));
    return out.slice(0, 4).join(' · ') || (l.intent || '').replace(/_/g, ' ');
  }
  function leads() {
    var el = $('#ldBody'); if (!el || !O.leads) return;
    var ls = O.leads.list({ agent: t.agent }).slice(-8).reverse();
    el.innerHTML = ls.length ? ls.map(function (l) {
      var ph = String(l.phone || '').replace(/\D/g, ''), mask = ph.length > 5 ? 'phone ending ' + ph.slice(-3) : '';
      return '<tr class="' + (l.seed ? '' : 'new') + '"><td><b>' + esc(l.name || 'Visitor') + '</b>' + (mask ? '<small>' + esc(mask) + '</small>' : '') + '</td><td>' + esc(fmtPayload(l)) + '</td><td>' + esc(l.source || '') + '</td><td class="num">' + ago(Date.parse(l.timestamp)) + ' ago</td><td><span class="st ' + (l.seed ? 'bot' : 'booked') + '">' + (l.seed ? esc(l.status || 'new') : 'New, from chat') + '</span></td></tr>';
    }).join('') : '<tr><td colspan="5">No leads yet. Finish a booking in the phone and it appears here.</td></tr>';
  }
  function inbox() {
    if (!$('#ibList') || !O || !O.convos) return;
    seed(); kpis(); list(); view(); leads();
    $$('#ibF button').forEach(function (b) { b.addEventListener('click', function () { filter = b.getAttribute('data-f'); list(); view(); }); });
    function later() { if (rq) return; rq = requestAnimationFrame(function () { rq = 0; list(); view(); kpis(); }); }
    O.convos.on(function (ev) { if (!ev || ev.type === 'sync' || ev.id === sel || (O.convos.get(ev.id) || {}).agent === t.agent) later(); });
    if (O.leads.on) O.leads.on(function () { leads(); kpis(); });
  }

  /* ---------- the brief ---------- */
  var TEAM = ['Just me', '2 to 5 people', '6 to 20 people', 'More than 20 people'];
  var GOALS = [['Answer FAQs', 'answer FAQs'], ['Book appointments', 'book appointments'], ['Qualify leads', 'qualify leads'], ['Track orders', 'track orders'], ['Hand over to my team', 'hand over to my team']];
  var MAILTO = 'contact.abbytes@gmail.com';
  function brief() {
    var el = $('#bf'); if (!el) return;
    var st = { name: '', channels: t.brief.channels.slice(), goals: t.brief.goals.slice(), team: '2 to 5 people', notes: '' };
    function chip(g, v, l, on) { return '<button type="button" class="chip" data-g="' + g + '" data-v="' + esc(v) + '" aria-pressed="' + on + '">' + esc(l) + '</button>'; }
    el.innerHTML = '<div class="bf-q"><div class="bf-g"><label for="bfName">Your ' + esc(t.noun) + '’s name <span class="ex">optional</span></label><input class="bf-in" id="bfName" type="text" maxlength="60" autocomplete="organization" placeholder="e.g. ' + esc(t.id === 'store' ? 'Bluebell Studio' : 'Sunrise ' + t.label) + ', Pune"></div>' +
      '<div class="bf-g"><p id="bfChL">Where your ' + esc(t.people) + ' reach you</p><div class="chips" role="group" aria-labelledby="bfChL">' + ['Web chat', 'WhatsApp', 'Instagram'].map(function (c) { return chip('channels', c, c, st.channels.indexOf(c) >= 0); }).join('') + '</div></div>' +
      '<div class="bf-g"><p id="bfGoL">What it should do</p><div class="chips" role="group" aria-labelledby="bfGoL">' + GOALS.map(function (g) { return chip('goals', g[1], g[0], st.goals.indexOf(g[1]) >= 0); }).join('') + '</div></div>' +
      '<div class="bf-g"><p id="bfTmL">Your team</p><div class="chips" role="group" aria-labelledby="bfTmL">' + TEAM.map(function (x) { return chip('team', x, x, x === st.team); }).join('') + '</div></div>' +
      '<div class="bf-g"><label for="bfNotes">Anything else</label><input class="bf-in" id="bfNotes" type="text" maxlength="240" autocomplete="off" placeholder="e.g. most messages come after 9 pm"></div></div>' +
      '<aside class="bf-card" aria-label="Your brief"><h3>' + U.orb(20) + 'Your brief</h3><pre id="bfText" aria-live="polite"></pre><div class="bf-acts"><a class="btn" id="bfMail" href="#">Email this brief ' + IC.arrow + '</a><button type="button" class="btn ghost" id="bfCopy">Copy it</button></div><p class="bf-st" id="bfSt" role="status"></p><p class="bf-time">Usually live in <b>2 to 4 weeks</b>. Scope on paper, price after one call.</p></aside>';
    function text() {
      return ['An Orbit assistant for my ' + t.noun, 'Business: ' + t.brief.industry + (st.name ? ', ' + st.name : ''), 'Channels: ' + (st.channels.join(', ') || 'to decide'), 'It should: ' + (st.goals.join(', ') || 'to decide'), 'Team: ' + st.team].concat(st.notes ? ['Notes: ' + st.notes] : []).concat(['', 'Sent from the Orbit ' + t.label.toLowerCase() + ' page']).join('\n');
    }
    function paint() {
      var tx = text(); $('#bfText').textContent = tx;
      $('#bfMail').href = 'mailto:' + MAILTO + '?subject=' + encodeURIComponent('An Orbit assistant for my ' + t.noun) + '&body=' + encodeURIComponent(tx);
    }
    $$('.chip', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var g = b.getAttribute('data-g'), v = b.getAttribute('data-v');
        if (g === 'team') { st.team = v; $$('.chip[data-g="team"]', el).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }
        else { var a = st[g], i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); b.setAttribute('aria-pressed', String(i < 0)); var order = $$('.chip[data-g="' + g + '"]', el).map(function (x) { return x.getAttribute('data-v'); }); a.sort(function (p, q) { return order.indexOf(p) - order.indexOf(q); }); }
        paint();
      });
    });
    $('#bfName').addEventListener('input', function () { st.name = this.value.replace(/\s+/g, ' ').trim(); paint(); });
    $('#bfNotes').addEventListener('input', function () { st.notes = this.value.replace(/\s+/g, ' ').trim(); paint(); });
    var tm = 0; function say(m) { $('#bfSt').textContent = m; clearTimeout(tm); tm = setTimeout(function () { $('#bfSt').textContent = ''; }, 5000); }
    $('#bfCopy').addEventListener('click', function () {
      var tx = text(), done = function () { say('Copied. Paste it into an email or a message.'); };
      try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(tx).then(done, function () { fallback(tx); }); return; } } catch (e) {}
      fallback(tx);
    });
    function fallback(tx) { var ta = d.createElement('textarea'); ta.value = tx; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; d.body.appendChild(ta); ta.select(); var ok = false; try { ok = d.execCommand('copy'); } catch (e) {} ta.remove(); say(ok ? 'Copied. Paste it into an email or a message.' : 'Select the brief above and copy it.'); }
    paint();
  }

  /* ---------- the other trades ---------- */
  function more() {
    var el = $('#moGrid'); if (!el) return;
    el.innerHTML = TR.order.filter(function (k) { return k !== t.id; }).map(function (k) {
      var x = TR.byId[k];
      return '<a href="' + x.page + '" style="--c:' + x.color.acc + '"><b><i aria-hidden="true"></i>' + esc(x.label) + '</b><span class="bub c">' + esc(x.questions[0]) + '</span><small>' + esc(x.biz) + '’s assistant</small></a>';
    }).join('');
  }

  /* ---------- the clock: the page runs from 11:42 pm to the next morning, and the header keeps the time ---------- */
  function clock() {
    var hd = $('.hd'), clk = $('#clk b'), dawn = $('#dawn'); if (!hd || !clk) return;
    var marks = [];
    $$('main > section, #dawn, .ft').forEach(function (s) {
      var tm = s.id === 'dawn' ? '9:05 am' : s.classList.contains('tp-hero') ? '11:42 pm' : s.id === 'night' ? '11:43 pm' : (($('.qh-a time', s) || $('.ft-a time', s) || {}).textContent || '');
      if (tm) marks.push({ el: s, t: tm });
    });
    var cur = '', tick = 0;
    function at() {
      tick = 0;
      var line = innerHeight * .46, now = marks[0].t;
      marks.forEach(function (m) { if (m.el.getBoundingClientRect().top <= line) now = m.t; });
      if (now !== cur) { cur = now; clk.textContent = now; clk.classList.remove('tick'); void clk.offsetWidth; clk.classList.add('tick'); }
      if (dawn) { var r = dawn.getBoundingClientRect(); hd.classList.toggle('night', r.top + r.height * .62 > hd.getBoundingClientRect().bottom); }
    }
    addEventListener('scroll', function () { if (!tick) tick = requestAnimationFrame(at); }, { passive: true });
    addEventListener('resize', at);
    at();
  }

  tries(); night(); flows(); brief(); more(); clock();
  var ENGINE = ['../assets/bots/engine.js?v=22', '../assets/bots/agents/' + t.agent + '.js?v=24', '../assets/bots/ui.js?v=22'];
  U.afterPaint(function () {
    Promise.all([U.css('../assets/bots/bots.css?v=22'), U.load(ENGINE)]).then(function () {
      O = window.Orbit; mount(); inbox();
      if (pending) { var q = pending; pending = null; send(q); }
      U.nudge(wrap, t.questions[0], t.id, send);
    }, function () { if (phone) phone.innerHTML = '<div class="ib-empty"><p>The assistant didn’t load. Refresh the page to try again.</p></div>'; });
  });
})();
