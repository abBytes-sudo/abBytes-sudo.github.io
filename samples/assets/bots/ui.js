/* ORBIT ASSISTANTS ui: channel skins (web chat, WhatsApp, Instagram DM), agent console, KB admin, analytics view.
   Needs engine.js first. See the API notes at the top of engine.js.
     Orbit.mount(el, opts)          -> { session, root, send(text), choose(btn), handover(), setContext(obj), destroy(), onStatus(fn) }
        opts: agent, channel ('web'|'whatsapp'|'instagram'), context, source, mode ('inline'|'widget'), speed (typing delay multiplier, default 1), frame (false to hide the phone bezel)
     Orbit.console(el, opts)        -> agent console: all conversations, take over, reply, return to the bot, resolve
     Orbit.kbAdmin(el, {agent})     -> edit the FAQ the agent answers from (stored in localStorage)
     Orbit.analyticsView(el, opts)  -> KPI cards, charts, leads table, from the event log */
(function (root) {
  'use strict';
  var O = root.Orbit; if (!O || O.mount) return;
  var esc = O.esc, doc = root.document;
  var reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  var MON = '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*', DOW = '(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*';
  var AUTOB = [new RegExp('(\\u20B9\\s?[\\d,.]+(?:\\s?(?:Cr|L|lakh|crore|k)\\b)?(?:\\s?\\/\\s?month)?|\\$[\\d,.]+)', 'g'), new RegExp('\\b(' + DOW + '\\.?,? \\d{1,2} ' + MON + ')', 'g'), /\b(\d{1,2}(?::\d{2})? ?(?:am|pm))\b/g];
  function fmt(t) { var h = esc(t).replace(/\*\*(.+?)\*\*/g, '\u0001$1\u0002'); AUTOB.forEach(function (r) { h = h.replace(r, '\u0001$1\u0002'); }); h = h.replace(/\u0001+/g, '<b>').replace(/\u0002+/g, '</b>'); return h.replace(/\n/g, '<br>'); }
  var IC = { cal: '<path d="M4 3v2M12 3v2M2.5 6.5h11M3.5 4h9a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/>', search: '<circle cx="7" cy="7" r="4"/><path d="M10 10l3.5 3.5"/>', tag: '<path d="M2.5 8.5V3.5h5l6 6-5 5z"/><circle cx="5.5" cy="6.5" r=".6"/>', bell: '<path d="M4 11V7a4 4 0 0 1 8 0v4l1 1.5H3zM6.5 14a1.5 1.5 0 0 0 3 0"/>', ret: '<path d="M3 8a5 5 0 1 1 1.5 3.6M3 12V8h4"/>', box: '<path d="M2.5 5L8 2.5 13.5 5v6L8 13.5 2.5 11zM2.5 5L8 7.5 13.5 5M8 7.5v6"/>', user: '<circle cx="8" cy="5.5" r="2.5"/><path d="M3 13.5c.5-3 2.5-4 5-4s4.5 1 5 4"/>', grid: '<path d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z"/>', ruler: '<path d="M2.5 11L11 2.5l2.5 2.5L5 13.5zM5 8.5l1.5 1.5M7 6.5L8.5 8M9 4.5L10.5 6"/>', pin: '<path d="M8 14s4.5-4 4.5-7.5a4.5 4.5 0 0 0-9 0C3.5 10 8 14 8 14z"/><circle cx="8" cy="6.5" r="1.5"/>', check: '<path d="M3.5 8.5l3 3 6-7"/>', heart: '<path d="M8 13.5S2.5 10 2.5 6.3A2.8 2.8 0 0 1 8 5a2.8 2.8 0 0 1 5.5 1.3C13.5 10 8 13.5 8 13.5z"/>', bed: '<path d="M2 12.5v-7M2 9.5h12v3M14 9.5V8a2 2 0 0 0-2-2H7v3.5"/><circle cx="4.5" cy="7.5" r="1"/>', area: '<path d="M3 3h10v10H3zM3 8h5M8 3v5"/>', sofa: '<path d="M3 8V6a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 13 6v2M2 8.5a1 1 0 0 1 2 0V10h8V8.5a1 1 0 0 1 2 0V12H2zM4 12v1M12 12v1"/>', stairs: '<path d="M2.5 13.5h3v-3h3v-3h3v-3h2"/>', clock: '<circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.5"/>', phone: '<path d="M4 2.5h2l1 3-1.5 1a7 7 0 0 0 3 3l1-1.5 3 1v2A1.5 1.5 0 0 1 11.5 13 9 9 0 0 1 3 4.5 1.5 1.5 0 0 1 4 2.5z"/>' };
  function icon(n, sz) { return IC[n] ? '<svg class="ob-i" width="' + (sz || 14) + '" height="' + (sz || 14) + '" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[n] + '</svg>' : ''; }
  function iconFor(l) { l = String(l).toLowerCase(); return /book|visit|appoint|table|reserve|slot|schedul|reschedul|day|time/.test(l) ? 'cal' : /find|search|looking|show|browse|something|filter/.test(l) ? 'search' : /price|cost|fee|rate|estimate|quote|package|offer/.test(l) ? 'tag' : /save|alert|notify|restock|remind/.test(l) ? 'bell' : /return|exchange|refund|cancel/.test(l) ? 'ret' : /track|order|deliver|ship|parcel/.test(l) ? 'box' : /person|human|agent|team|talk to/.test(l) ? 'user' : /size|fit|measure/.test(l) ? 'ruler' : /near|map|where|direction/.test(l) ? 'pin' : /menu|more|back|anything/.test(l) ? 'grid' : ''; }
  O.icon = icon;
  function hm(ts) { var d = new Date(ts || Date.now()); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function ago(ts) { var m = Math.max(1, Math.round((Date.now() - ts) / 6e4)); return m < 60 ? m + 'm' : m < 1440 ? Math.round(m / 60) + 'h' : Math.round(m / 1440) + 'd'; }
  var CHN = { web: 'Website', whatsapp: 'WhatsApp', instagram: 'Instagram' };
  O.channels = CHN;
  O.agentList = function () { return Object.keys(O.agents).map(function (k) { return O.agents[k]; }); };

  /* ---------- chat ---------- */
  function Chat(host, o) {
    var self = this, a = O.agents[o.agent]; if (!a) throw new Error('Unknown Orbit agent: ' + o.agent);
    this.o = o; this.agent = a; this.ch = o.channel || 'web'; this.speed = o.speed == null ? 1 : o.speed; this.queue = []; this.busy = false; this.rendered = {}; this.subs = []; this.statusFns = [];
    this.root = el('div', 'ob ob-' + this.ch + (o.frame === false || this.ch === 'web' ? '' : ' ob-framed')); this.root.style.setProperty('--ob-accent', a.accent || '#C8FF4D');
    this.session = O.createSession(o.agent, { channel: this.ch, context: o.context || {}, source: o.source, silent: o.silent });
    this.build(); host.innerHTML = ''; this.wrap(host);
    this.subs.push(this.session.on(function (m) { self.onMsg(m); }));
    this.subs.push(O.convos.on(function (ev) { self.onConvo(ev); }));
    this.session.start();
  }
  var CP = Chat.prototype;
  CP.wrap = function (host) {
    if (this.o.mode === 'widget') {
      var self = this, w = el('div', 'ob-widget'), b = el('button', 'ob-launch', '<span class="ob-av">' + esc(this.agent.initials || 'O') + '</span><span>Chat with us</span>'); b.type = 'button'; b.setAttribute('aria-expanded', 'false');
      var p = el('div', 'ob-wpanel'); p.hidden = true; p.appendChild(this.root); w.appendChild(p); w.appendChild(b);
      b.addEventListener('click', function () { p.hidden = !p.hidden; b.setAttribute('aria-expanded', String(!p.hidden)); if (!p.hidden && self.input) self.input.focus(); }); host.appendChild(w); this.widget = w;
    } else host.appendChild(this.root);
  };
  CP.build = function () {
    var self = this, a = this.agent, r = this.root, ch = this.ch, av = '<span class="ob-av" aria-hidden="true">' + esc(a.initials || 'O') + '</span>';
    {
      var title = ch === 'whatsapp' ? '<span class="ob-back" aria-hidden="true">‹</span>' + av + '<div><b>' + esc(a.business || a.name) + ' <i class="ob-tick-v" title="Verified business">✓</i></b><small class="ob-st">online</small></div>'
        : ch === 'instagram' ? '<span class="ob-back" aria-hidden="true">‹</span>' + av + '<div><b>' + esc((a.business || a.name).toLowerCase().replace(/[^a-z0-9]+/g, '.')) + '</b><small class="ob-st">Active now</small></div>'
        : av + '<div><b>' + esc(a.name) + '</b><small class="ob-st">Online · replies instantly</small></div>';
      r.innerHTML = '<div class="ob-hd">' + title + '<button type="button" class="ob-hand">Talk to a person</button></div><div class="ob-log" role="log" aria-live="polite">' + (ch === 'whatsapp' ? '<div class="ob-day"><span>Today</span></div><div class="ob-enc">Messages are with a demo assistant. Nothing leaves this page.</div>' : ch === 'instagram' ? '<div class="ob-igtop">' + av + '<b>' + esc(a.business || a.name) + '</b><small>' + esc(a.role || '') + ' · Business account</small></div>' : '') + '</div><div class="ob-qr"></div>' +
        '<form class="ob-in"><label class="ob-sr" for="obi' + this.session.id + '">Message</label><input id="obi' + this.session.id + '" type="text" autocomplete="off" placeholder="' + (ch === 'instagram' ? 'Message…' : ch === 'whatsapp' ? 'Message' : 'Type a message…') + '"><button type="submit" aria-label="Send">' + (ch === 'web' ? 'Send' : ch === 'instagram' ? 'Send' : '➤') + '</button></form>';
    }
    this.log = r.querySelector('.ob-log'); this.log.setAttribute('data-lenis-prevent', ''); this.qr = r.querySelector('.ob-qr'); this.input = r.querySelector('.ob-in input'); this.st = r.querySelector('.ob-st');
    r.querySelector('.ob-in').addEventListener('submit', function (e) { e.preventDefault(); var v = self.input.value.trim(); if (!v) return; self.input.value = ''; self.send(v); });
    r.querySelector('.ob-hand').addEventListener('click', function () { self.choose({ label: 'Talk to a person', value: 'handover' }); });
  };
  CP.send = function (t) { this.clearQR(); this.session.send(t); };
  CP.choose = function (b) { this.clearQR(); this.session.choose(b); };
  CP.handover = function () { this.choose({ label: 'Talk to a person', value: 'handover' }); };
  CP.setContext = function (c) { this.session.setContext(c); };
  CP.clearQR = function () { if (this.qr) this.qr.innerHTML = ''; this.pendingQR = null; };
  CP.scroll = function () { var l = this.log; l.scrollTop = l.scrollHeight; };
  CP.onMsg = function (m) { if (m.from === 'user') { this.addUser(m); return; } this.queue.push(m); this.pump(); };
  CP.pump = function () {
    var self = this; if (this.busy || !this.queue.length) return; this.busy = true; var m = this.queue.shift(), d = (reduce ? 0 : Math.min(m.delay == null ? 500 : m.delay, 1000)) * this.speed;
    if (d > 60) this.typing(true); setTimeout(function () { self.typing(false); self.addBot(m); self.busy = false; self.pump(); }, d);
  };
  CP.typing = function (on) {
    if (this.dots) { this.dots.remove(); this.dots = null; }
    if (on) { this.dots = el('div', 'ob-m ob-bot ob-typing', '<span></span><span></span><span></span>'); this.dots.setAttribute('aria-label', 'Assistant is typing'); this.log.appendChild(this.dots); this.scroll(); }
  };
  CP.addUser = function (m) {
    if (m.id && this.rendered[m.id]) return; if (m.id) this.rendered[m.id] = 1;
    var txt = m.text;
    var e = el('div', 'ob-m ob-user', '<p>' + fmt(txt) + '</p><span class="ob-ts">' + hm(m.ts) + (this.ch === 'whatsapp' ? ' <i class="ob-tk">✓✓</i>' : '') + '</span>'); this.log.appendChild(e); this.scroll();
    if (this.ch === 'whatsapp') { var tk = e.querySelector('.ob-tk'); setTimeout(function () { if (tk) tk.classList.add('rd'); }, reduce ? 0 : 900); }
  };
  CP.cardEl = function (c) {
    var self = this, d = el('div', 'ob-card'), pr = c.price ? String(c.price).split(' / ') : null, facts = c.facts || null, h = '';
    if (c.img) h += '<div class="ob-ph"><img src="' + esc(c.img) + '" alt="' + esc(c.title || '') + '" loading="lazy" width="320" height="200">' + (c.badge ? '<span class="ob-badge">' + esc(c.badge) + '</span>' : '') + (c.tag ? '<span class="ob-id">' + esc(c.tag) + '</span>' : '') + '</div>';
    h += '<div class="ob-cb">' + (!c.img && c.badge ? '<span class="ob-badge ob-bd2">' + esc(c.badge) + '</span>' : '') + '<b class="ob-title">' + esc(c.title) + '</b>' + (c.sub ? '<p class="ob-sub">' + esc(c.sub) + '</p>' : '');
    if (pr) h += '<div class="ob-pr"><span class="ob-amt">' + esc(pr[0]) + '</span><span class="ob-pl">' + esc(pr[1] ? '/ ' + pr[1] : (c.priceLabel || 'Price')) + '</span></div>';
    if (facts && facts.length) h += '<ul class="ob-facts">' + facts.map(function (f) { return '<li>' + icon(f.i, 14) + '<span>' + esc(f.t) + '</span></li>'; }).join('') + '</ul>';
    else if (c.meta && c.meta.length) h += '<ul class="ob-meta">' + c.meta.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    d.innerHTML = h + '</div>';
    if (c.buttons && c.buttons.length) { var ca = el('div', 'ob-ca'); c.buttons.slice(0, 2).forEach(function (b, i) { ca.appendChild(self.btn(b, 'ob-cbtn' + (i === 0 ? ' pri' : ''), true)); }); d.querySelector('.ob-cb').appendChild(ca); }
    return d;
  };
  CP.btn = function (b, cls, noIcon) { var self = this, ic = noIcon ? '' : icon(iconFor(b.label), 14), x = el('button', cls || 'ob-chip', ic + '<span>' + esc(b.label) + '</span>'); x.type = 'button'; x.addEventListener('click', function () { self.choose(b); }); return x; };
  CP.showQR = function (bs) {
    var self = this, q = this.qr; q.innerHTML = ''; if (!bs || !bs.length) return; var MAXV = 4, extra = bs.length > MAXV + 1 ? bs.slice(MAXV) : [], shown = extra.length ? bs.slice(0, MAXV) : bs;
    shown.forEach(function (b) { q.appendChild(self.btn(b)); });
    if (extra.length) { var more = el('button', 'ob-chip ob-more', icon('grid', 14) + '<span>More…</span>'); more.type = 'button'; more.setAttribute('aria-expanded', 'false'); more.addEventListener('click', function () { more.remove(); extra.forEach(function (b) { q.appendChild(self.btn(b)); }); var f = q.querySelector('.ob-chip:nth-child(' + (MAXV + 1) + ')'); if (f) f.focus(); }); q.appendChild(more); }
  };
  CP.addBot = function (m) {
    var self = this; if (m.id && this.rendered[m.id]) return; if (m.id) this.rendered[m.id] = 1; var person = m.from === 'agent', sys = m.kind === 'system' || m.from === 'system';
    var e = el('div', 'ob-m ob-bot' + (person ? ' ob-person' : '') + (sys ? ' ob-sys' : ''));
    if (person) e.innerHTML = '<span class="ob-who">' + esc(m.name || 'Team') + '</span>'; if (m.text) e.insertAdjacentHTML('beforeend', '<p>' + fmt(m.text) + '</p>');
    e.insertAdjacentHTML('beforeend', '<span class="ob-ts">' + hm(m.ts) + '</span>'); this.log.appendChild(e);
    if (m.cards && m.cards.length) { var row = el('div', 'ob-cards'); m.cards.forEach(function (c) { row.appendChild(self.cardEl(c)); }); this.log.appendChild(row); }
    this.clearQR(); if (m.buttons && m.buttons.length) this.pendingQR = m.buttons; if (!this.queue.length && this.pendingQR) { this.showQR(this.pendingQR); this.pendingQR = null; } this.scroll();
  };
  CP.setStatus = function (txt, cls) { if (this.st) { this.st.innerHTML = esc(txt); this.st.className = 'ob-st ' + (cls || ''); } this.statusFns.forEach(function (f) { f(txt, cls); }); };
  CP.onStatus = function (f) { this.statusFns.push(f); };
  CP.onConvo = function (ev) {
    var id = this.session.id; if (ev.id !== id) { if (ev.type === 'sync') this.syncStatus(); return; }
    if (ev.type === 'message' && ev.msg && (ev.msg.from === 'agent' || ev.msg.from === 'system')) { this.onMsg(Object.assign({ delay: 400 }, ev.msg)); }
    if (ev.type === 'status') this.syncStatus();
  };
  CP.syncStatus = function () {
    var c = O.convos.get(this.session.id); if (!c) return; this.session.convo.status = c.status;
    if (c.status === 'waiting') this.setStatus('Waiting for a person…', 'wait'); else if (c.status === 'human') this.setStatus((c.person || 'A person') + ' joined', 'human'); else if (c.status === 'resolved') this.setStatus('Conversation closed', ''); else this.setStatus(this.ch === 'web' ? 'Online · replies instantly' : this.ch === 'instagram' ? 'Active now' : this.ch === 'phone' ? 'Connected' : 'online', '');
  };
  CP.destroy = function () { this.subs.forEach(function (f) { f(); }); (this.widget || this.root).remove(); };
  O.mount = function (host, o) { var c = new Chat(host, o || {}); return { chat: c, session: c.session, root: c.root, send: function (t) { c.send(t); }, choose: function (b) { c.choose(b); }, handover: function () { c.handover(); }, setContext: function (x) { c.setContext(x); }, destroy: function () { c.destroy(); }, onStatus: function (f) { c.onStatus(f); } }; };

  /* ---------- agent console ---------- */
  O.console = function (host, o) {
    o = o || {}; var person = o.name || 'Nora', role = o.role || 'front desk', sel = null, filter = 'all'; host.innerHTML = '';
    var root = el('div', 'obc'); root.innerHTML = '<div class="obc-l"><div class="obc-lh"><b>Conversations</b><div class="obc-f" role="group" aria-label="Filter"><button type="button" data-f="all" aria-pressed="true">All</button><button type="button" data-f="waiting" aria-pressed="false">Waiting</button><button type="button" data-f="human" aria-pressed="false">With a person</button></div></div><ul class="obc-list"></ul></div><div class="obc-r"><div class="obc-empty">Select a conversation. Chats the bot hands over appear here as “Waiting”.</div></div>';
    host.appendChild(root); var list = root.querySelector('.obc-list'), right = root.querySelector('.obc-r');
    function preview(c) { var m = c.messages[c.messages.length - 1]; return m ? String(m.text || '').replace(/\*\*/g, '').slice(0, 70) : ''; }
    function renderList() {
      var cs = O.convos.list().filter(function (c) { return (c.engaged || c.status !== 'bot') && (filter === 'all' || c.status === filter); }); list.innerHTML = '';
      if (!cs.length) list.innerHTML = '<li class="obc-none">Nothing here yet. Start a chat in the demo and tap “Talk to a person”.</li>';
      cs.forEach(function (c) {
        var li = el('li', c.id === sel ? 'on' : '', ''), b = el('button', 'obc-it', '<span class="obc-av">' + esc((c.user && c.user.name ? c.user.name : c.agentName || '?').slice(0, 2).toUpperCase()) + '</span><span class="obc-tx"><b>' + esc(c.user && c.user.name ? c.user.name : 'Visitor') + '</b><small>' + esc(CHN[c.channel] || c.channel) + ' · ' + esc(c.agentName || c.agent) + '</small><em>' + esc(preview(c)) + '</em></span><span class="obc-meta"><i class="obc-s obc-' + c.status + '">' + ({ bot: 'Bot', waiting: 'Waiting', human: 'Person', resolved: 'Done' }[c.status] || c.status) + '</i><small>' + ago(c.updatedAt || c.startedAt) + '</small></span>');
        b.type = 'button'; b.addEventListener('click', function () { sel = c.id; renderList(); renderRight(); }); li.appendChild(b); list.appendChild(li);
      });
    }
    function renderRight() {
      var c = O.convos.get(sel); if (!c) { right.innerHTML = '<div class="obc-empty">Select a conversation.</div>'; return; }
      var st = c.status; right.innerHTML = '<div class="obc-rh"><div><b>' + esc(c.user && c.user.name ? c.user.name : 'Visitor') + '</b><small>' + esc(CHN[c.channel] || c.channel) + ' · source: ' + esc(c.source || '') + ' · ' + esc(c.agentName || c.agent) + '</small></div><i class="obc-s obc-' + st + '">' + ({ bot: 'Bot is handling', waiting: 'Waiting for a person', human: 'You are in this chat', resolved: 'Resolved' }[st]) + '</i></div>' +
        '<div class="obc-ctx">' + (c.handoverReason ? '<span>Why: ' + esc(c.handoverReason) + '</span>' : '') + (c.context && Object.keys(c.context).length ? '<span>Viewing: ' + esc(Object.keys(c.context).map(function (k) { return c.context[k]; }).join(', ')) + '</span>' : '') + (c.leadId ? '<span>Lead ' + esc(c.leadId) + '</span>' : '') + '</div><div class="obc-log" role="log"></div><div class="obc-act"></div>';
      var log = right.querySelector('.obc-log'); log.setAttribute('data-lenis-prevent', ''); c.messages.forEach(function (m) { var who = m.from === 'user' ? 'Visitor' : m.from === 'agent' ? (m.name || person) : m.kind === 'system' ? 'System' : 'Assistant'; log.appendChild(el('div', 'obc-m obc-' + (m.kind === 'system' ? 'sys' : m.from), '<small>' + esc(who) + ' · ' + hm(m.ts) + '</small><p>' + fmt(m.text || (m.cards ? '[' + m.cards.length + ' card(s) shown]' : '')) + '</p>')); }); log.scrollTop = log.scrollHeight;
      var act = right.querySelector('.obc-act');
      if (st === 'waiting' || st === 'bot') { var b = el('button', 'obc-btn pri', st === 'waiting' ? 'Take over this chat' : 'Join this chat'); b.type = 'button'; b.addEventListener('click', function () { O.convos.setStatus(c.id, 'human', { person: person + ' (' + role + ')' }); O.convos.append(c.id, { from: 'system', kind: 'system', text: 'Connected to ' + person + ' (' + role + ')' }); O.events.log('agent_reply', { agent: c.agent, channel: c.channel, source: c.source, convo: c.id, kind: 'takeover' }); }); act.appendChild(b); }
      if (st === 'human') {
        var f = el('form', 'obc-form', '<label class="ob-sr" for="obcm">Reply as ' + esc(person) + '</label><input id="obcm" type="text" autocomplete="off" placeholder="Reply as ' + esc(person) + '…"><button class="obc-btn pri" type="submit">Send</button>'), q = el('div', 'obc-q');
        ['Let me check that for you.', 'Can I call you in two minutes?', 'Done, I have booked that for you.', 'Sorry about that, fixing it now.'].forEach(function (t) { var x = el('button', 'obc-chip', esc(t)); x.type = 'button'; x.addEventListener('click', function () { send(t); }); q.appendChild(x); });
        function send(t) { O.convos.append(c.id, { from: 'agent', name: person, text: t }); O.events.log('agent_reply', { agent: c.agent, channel: c.channel, source: c.source, convo: c.id }); }
        f.addEventListener('submit', function (e) { e.preventDefault(); var i = f.querySelector('input'); if (i.value.trim()) { send(i.value.trim()); i.value = ''; } });
        act.appendChild(q); act.appendChild(f);
        var row = el('div', 'obc-row'), r1 = el('button', 'obc-btn', 'Return to bot'), r2 = el('button', 'obc-btn', 'Resolve'), r3 = el('button', 'obc-btn', 'Simulate customer reply');
        [r1, r2, r3].forEach(function (x) { x.type = 'button'; row.appendChild(x); });
        r1.addEventListener('click', function () { O.convos.setStatus(c.id, 'bot', { person: null }); O.convos.append(c.id, { from: 'system', text: 'You are back with the assistant. Anything else I can help with?', kind: 'system' }); });
        r2.addEventListener('click', function () { O.convos.setStatus(c.id, 'resolved'); O.convos.append(c.id, { from: 'system', kind: 'system', text: 'Conversation resolved by ' + person }); O.events.log('resolved', { agent: c.agent, channel: c.channel, source: c.source, convo: c.id, by: 'person' }); });
        r3.addEventListener('click', function () { O.convos.append(c.id, { from: 'user', text: 'Thanks, that works for me.' }); });
        act.appendChild(row);
      }
      if (st === 'resolved') act.appendChild(el('p', 'obc-note', 'This conversation is closed.'));
    }
    root.querySelectorAll('.obc-f button').forEach(function (b) { b.addEventListener('click', function () { filter = b.getAttribute('data-f'); root.querySelectorAll('.obc-f button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); renderList(); }); });
    var off = O.convos.on(function (ev) { if (ev.type === 'message' && ev.id === sel && ev.msg && ev.msg.from === 'user') { /* live user message */ } renderList(); if (ev.id === sel || ev.type === 'sync') renderRight(); });
    renderList(); if (o.select !== false) { var first = O.convos.list().filter(function (c) { return c.status === 'waiting'; })[0]; if (first) { sel = first.id; renderList(); renderRight(); } }
    return { select: function (id) { sel = id; renderList(); renderRight(); }, destroy: function () { off(); host.innerHTML = ''; } };
  };

  /* ---------- KB admin ---------- */
  O.kbAdmin = function (host, o) {
    o = o || {}; var cur = o.agent || 'support', root = el('div', 'obk'); host.innerHTML = ''; host.appendChild(root);
    function agents() { return O.agentList().filter(function (a) { return a.kind !== 'staff'; }); }
    function render() {
      var list = O.kb.list(cur), a = O.agents[cur];
      root.innerHTML = '<div class="obk-h"><div class="obk-tabs" role="tablist" aria-label="Agent">' + agents().map(function (x) { return '<button type="button" role="tab" data-a="' + x.id + '" aria-selected="' + (x.id === cur) + '">' + esc(x.business || x.name) + '</button>'; }).join('') + '</div></div>' +
        '<div class="obk-try"><label for="obkq">Test a question</label><div><input id="obkq" type="text" placeholder="e.g. do you ship internationally?" autocomplete="off"><button type="button" class="obk-go">Match</button></div><p class="obk-res" aria-live="polite"></p></div>' +
        '<ul class="obk-list">' + list.map(function (e) { return '<li data-id="' + esc(e.id) + '"><label>Question<input class="q" value="' + esc(e.q) + '"></label><label>Answer<textarea class="a" rows="3">' + esc(e.a) + '</textarea></label><label>Match phrases (comma separated)<input class="k" value="' + esc((e.keys || []).join(', ')) + '"></label><button type="button" class="obk-del">Delete</button></li>'; }).join('') + '</ul>' +
        '<div class="obk-f"><button type="button" class="obk-add">Add an answer</button><button type="button" class="obk-reset">Reset to defaults</button><span class="obk-saved" aria-live="polite"></span></div>';
      root.querySelectorAll('.obk-tabs button').forEach(function (b) { b.addEventListener('click', function () { cur = b.getAttribute('data-a'); render(); if (o.onAgent) o.onAgent(cur); }); });
      root.querySelectorAll('.obk-list li').forEach(function (li) {
        var id = li.getAttribute('data-id'), save = function () { O.kb.update(cur, id, { q: li.querySelector('.q').value, a: li.querySelector('.a').value, keys: li.querySelector('.k').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean) }); root.querySelector('.obk-saved').textContent = 'Saved. The assistant now answers with this.'; };
        ['.q', '.a', '.k'].forEach(function (s) { li.querySelector(s).addEventListener('input', save); });
        li.querySelector('.obk-del').addEventListener('click', function () { O.kb.remove(cur, id); render(); });
      });
      root.querySelector('.obk-add').addEventListener('click', function () { O.kb.add(cur, { q: 'New question', a: 'Write the answer here.', keys: [] }); render(); var li = root.querySelector('.obk-list li:last-child .q'); if (li) li.select(); });
      root.querySelector('.obk-reset').addEventListener('click', function () { O.kb.reset(cur); render(); });
      var go = function () { var q = root.querySelector('#obkq').value, m = O.kb.match(cur, q, a.synonyms), r = root.querySelector('.obk-res'); r.innerHTML = m ? 'Matches “' + esc(m.entry.q) + '” (score ' + m.score.toFixed(1) + '):<br>' + fmt(m.entry.a) : 'No FAQ match. The assistant would fall back to its menu or offer a person.'; };
      root.querySelector('.obk-go').addEventListener('click', go); root.querySelector('#obkq').addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    }
    render(); return { setAgent: function (id) { cur = id; render(); } };
  };

  /* ---------- analytics ---------- */
  O.analyticsView = function (host, o) {
    o = o || {}; var days = o.days || 7, root = el('div', 'oba'), tm = null; host.innerHTML = ''; host.appendChild(root);
    function bars(obj, label) { var ks = Object.keys(obj).sort(function (a, b) { return obj[b].n - obj[a].n; }).slice(0, 7), mx = Math.max.apply(null, ks.map(function (k) { return obj[k].n; }).concat([1])); return '<div class="oba-b"><h4>' + label + '</h4>' + ks.map(function (k) { var v = obj[k]; return '<div class="oba-r"><span>' + esc(CHN[k] || (O.agents[k] && O.agents[k].business) || k) + '</span><i style="--w:' + Math.round(v.n / mx * 100) + '%"></i><b>' + v.n + '</b><em>' + Math.round(v.conv / Math.max(1, v.n) * 100) + '% convert</em></div>'; }).join('') + '</div>'; }
    function spark(series) { var mx = Math.max.apply(null, series.map(function (s) { return s.n; }).concat([1])), w = 300, h = 70, pts = series.map(function (s, i) { return [i * w / Math.max(1, series.length - 1), h - 6 - s.n / mx * (h - 14)]; }); return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" role="img" aria-label="Conversations per day"><path d="M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L') + '" fill="none" stroke="var(--ob-accent,#C8FF4D)" stroke-width="2" vector-effect="non-scaling-stroke"/><path d="M0 ' + h + ' L' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L') + ' L' + w + ' ' + h + ' Z" fill="var(--ob-accent,#C8FF4D)" opacity=".08"/></svg>'; }
    function render() {
      var s = O.analytics.summary({ days: days }), leads = O.leads.list({ since: Date.now() - days * 864e5 }).slice(-8).reverse();
      root.innerHTML = '<div class="oba-top"><div class="oba-tabs" role="group" aria-label="Range"><button type="button" data-d="7" aria-pressed="' + (days === 7) + '">7 days</button><button type="button" data-d="30" aria-pressed="' + (days === 30) + '">30 days</button></div><span class="oba-live"><i></i> live from your event log</span></div>' +
        '<div class="oba-k"><div><b>' + s.handledPct + '<small>%</small></b><span>handled without an agent</span></div><div><b>' + s.conversations + '</b><span>conversations</span></div><div><b>' + s.leads + '</b><span>leads captured</span></div><div><b>' + s.bookings + '</b><span>bookings and visits</span></div><div><b>' + s.conversionPct + '<small>%</small></b><span>conversations that convert</span></div></div>' +
        '<div class="oba-g"><div class="oba-b oba-sp"><h4>Conversations per day</h4>' + spark(s.series) + '</div>' + bars(s.byChannel, 'By channel') + bars(s.bySource, 'By true source') + bars(s.byAgent, 'By assistant') + '</div>' +
        '<div class="oba-t"><h4>Latest leads</h4><div class="oba-tw"><table><thead><tr><th>Name</th><th>Source</th><th>Channel</th><th>Assistant</th><th>Intent</th><th>When</th></tr></thead><tbody>' + leads.map(function (l) { return '<tr><td>' + esc(l.name) + '</td><td>' + esc(l.source) + '</td><td>' + esc(CHN[l.channel] || l.channel) + '</td><td>' + esc((O.agents[l.agent] && O.agents[l.agent].business) || l.agent) + '</td><td>' + esc(l.intent) + '</td><td>' + ago(Date.parse(l.timestamp)) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
      root.querySelectorAll('.oba-tabs button').forEach(function (b) { b.addEventListener('click', function () { days = +b.getAttribute('data-d'); render(); }); });
    }
    function later() { clearTimeout(tm); tm = setTimeout(render, 250); }
    render(); var o1 = O.events.on(later), o2 = O.leads.on(later); return { refresh: render, destroy: function () { o1(); o2(); host.innerHTML = ''; } };
  };
})(typeof window !== 'undefined' ? window : globalThis);
