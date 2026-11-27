/* Northlane Back Office: Conversations (design sample). The inbox behind the store's concierge chat.
   Reads the shared Orbit conversation store (samples/assets/bots/engine.js, localStorage "orbit-convos" / "orbit-leads"), so a chat
   on the storefront appears here live, even from another tab. Staff take over, reply, hand back to the concierge and resolve.
   Every flow the concierge completes (return booked, restock alert, size advice, order lookup) arrives as a lead, linked to its transcript. */
(function () {
  'use strict';
  // the concierge engine is loaded here (in order) the first time the inbox opens; nothing else in the back office needs it
  if (window.Orbit) init(); else { var s = document.createElement('script'); s.src = '../assets/bots/engine.js?v=23'; s.onload = function () { init(); if (window.A && A.parse().name === 'chats') A.refresh(); }; document.head.appendChild(s); }
  function init() {
  var A = window.A, NL = window.NL, O = window.Orbit, $ = A.$, $$ = A.$$, esc = A.esc, ic = A.ic;
  var AG = ['northlane'], ME = 'Ananya', MIN = 6e4, H = 36e5, DAY = 864e5;
  var INT = { return: ['Return booked', 'vio', 'return'], restock_alert: ['Restock alert', 'warn', 'bell'], size_advice: ['Size advice', 'info', 'products'], order_status: ['Order lookup', 'mute', 'truck'], product_finder: ['Product finder', 'ok', 'search'], saved_edit: ['Edit emailed', 'ok', 'mail'], delivery_check: ['Delivery check', 'mute', 'pin'] };
  var STL = { bot: ['Concierge', 'c-ok'], waiting: ['Waiting', 'ring c-warn'], human: ['With you', 'c-acc'], resolved: ['Resolved', 'c-mute'] };
  var LST = { new: 'New', contacted: 'Contacted', won: 'Converted', closed: 'Closed' };
  function mine(c) { return AG.indexOf(c.agent) >= 0; }
  function convos() { return O.convos.list().filter(function (c) { return mine(c) && (c.engaged || c.status !== 'bot'); }); }
  function leads() { return O.leads.list().filter(function (l) { return AG.indexOf(l.agent) >= 0; }).sort(function (a, b) { return Date.parse(b.timestamp) - Date.parse(a.timestamp); }); }
  function lkey(l) { return l.timestamp + '|' + l.intent; }
  function lst(l) { try { var m = JSON.parse(localStorage.getItem('nl-chat-leads')) || {}; return m[lkey(l)] || l.status || 'new'; } catch (e) { return 'new'; } }
  function setLst(L, st) { try { var m = JSON.parse(localStorage.getItem('nl-chat-leads')) || {}; L.forEach(function (l) { m[lkey(l)] = st; }); localStorage.setItem('nl-chat-leads', JSON.stringify(m)); } catch (e) {} }
  function nameOf(c) { return (c.user && c.user.name) || 'Store visitor'; }
  function lastUser(c) { for (var i = c.messages.length - 1; i >= 0; i--) if (c.messages[i].from === 'user') return c.messages[i]; return null; }
  function plain(t) { return String(t || '').replace(/\*\*/g, ''); }
  function fmt(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); }
  function hm(ts) { return NL.fT(ts); }
  function wait(c) { return c.status === 'waiting' ? Date.now() - (c.handoverAt || c.updatedAt) : 0; }
  function dur(ms) { var m = Math.max(1, Math.round(ms / MIN)); return m < 60 ? m + 'm' : Math.floor(m / 60) + 'h ' + (m % 60) + 'm'; }
  function chLabel(c) { return { web: 'Store chat', whatsapp: 'WhatsApp', instagram: 'Instagram' }[c.channel] || c.channel; }
  function pageLabel(ctx) { if (!ctx) return ''; if (ctx.page === 'product' && ctx.id) { var p = NL.product(ctx.id); return p ? 'Viewing ' + p.name : 'Product page'; } return { home: 'Home page', shop: 'Shop' + (ctx.cat ? ' · ' + ctx.cat : ''), checkout: 'Checkout', account: 'Account', track: 'Order tracking' }[ctx.page] || (ctx.page ? ctx.page.charAt(0).toUpperCase() + ctx.page.slice(1) : ''); }

  /* ───────── demo history: a believable inbox the first time it opens ───────── */
  function seed() {
    var have = {}; O.convos.list().forEach(function (c) { have[c.id] = 1; }); var now = Date.now(), D = NL.db(), made = 0;
    var deliv = D.orders.filter(function (o) { return NL.stage(o) === 'delivered' && !o.demo && !NL.openReturn(o); }), ship = D.orders.filter(function (o) { return NL.stage(o) === 'shipped'; });
    var o1 = ship[0] || D.orders[0], o2 = deliv[2] || D.orders[3], o3 = deliv[5] || D.orders[6];
    function m(from, text, dt, x) { var r = { id: 'nlm' + Math.random().toString(36).slice(2, 8), from: from, text: text, ts: now - dt }; if (x) for (var k in x) r[k] = x[k]; return r; }
    var S = [
      { id: 'nlc-aditi', status: 'waiting', channel: 'web', source: 'Instagram ad', user: { name: 'Aditi Kulkarni', email: 'aditi.k@example.com' }, context: { page: 'product', id: 'harbor-jacket' }, handoverReason: 'Visitor asked for a person', handoverAt: now - 6 * MIN, t0: 14 * MIN, lead: { intent: 'size_advice', name: 'Aditi Kulkarni', email: 'aditi.k@example.com', payload: { product: 'Harbor Jacket', usual: 'S', fit: 'snug', recommended: 'XS' } }, msgs: [
        ['bot', 'Good afternoon. You’re looking at the **Harbor Jacket**, which runs relaxed through the body. I can check your size against today’s stock.', 14], ['user', 'Which size for me?', 13], ['bot', 'What size do you usually wear in tops and jackets from other labels?', 13], ['user', 'S usually, I like it a bit neat', 12],
        ['bot', 'Take the **XS**. It runs relaxed through the body, so going down one gives you the close fit you want.', 12, { cards: [{ title: 'Harbor Jacket · XS', price: '₹8,900' }] }], ['user', 'can someone hold a rust XS for me till saturday? I’m in Jaipur and want to try it at the studio', 7], ['bot', 'Connecting you to a person now. They can see everything we have talked about, so you will not need to repeat yourself.', 6, { kind: 'system' }]] },
      { id: 'nlc-rahul', status: 'waiting', channel: 'whatsapp', source: 'WhatsApp click-to-chat', user: { name: o1.name, email: o1.email }, context: {}, handoverReason: 'Visitor tapped talk to a person', handoverAt: now - 19 * MIN, t0: 26 * MIN, lead: { intent: 'order_status', name: o1.name, email: o1.email, payload: { order: o1.id, stage: 'shipped' }, status: 'contacted' }, msgs: [
        ['bot', 'Hello, it’s the Northlane concierge. I can track an order, start a return or find you a piece.', 26], ['user', 'mera order kab aayega ' + o1.id, 25], ['bot', 'Of course. For your privacy, which email did you check out with?', 25], ['user', o1.email, 24],
        ['bot', o1.name.split(' ')[0] + ', **' + o1.id + '** is on its way. Expected: **' + NL.etaText(o1) + '**.', 24, { cards: [{ title: o1.id + ' · In transit', price: NL.money(o1.total) }] }], ['user', 'I won’t be home that day, can the courier come after 6 pm?', 20], ['bot', 'Connecting you to a person now. They can see everything we have talked about, so you will not need to repeat yourself.', 19, { kind: 'system' }]] },
      { id: 'nlc-sneha', status: 'human', person: 'Ananya Rao (owner)', channel: 'web', source: 'Google search', user: { name: o2.name, email: o2.email }, context: { page: 'account' }, handoverReason: 'Visitor tapped talk to a person', handoverAt: now - 64 * MIN, t0: 72 * MIN, msgs: [
        ['bot', 'Welcome back. Everything you’ve ordered has arrived. What can I do for you?', 72], ['user', 'the stitching on the strap came loose after a week', 70], ['bot', 'I’m sorry about that. I’ll bring in someone from the studio.', 66], ['system', 'Connected to Ananya Rao (owner)', 63, { kind: 'system' }],
        ['agent', 'Hi, Ananya here from the studio. That shouldn’t happen in a week. Could you send a photo of the strap? We’ll repair it or replace it, whichever you prefer.', 61, { name: 'Ananya' }], ['user', 'sent on email just now. replace please', 55]] },
      { id: 'nlc-kabir', status: 'resolved', channel: 'web', source: 'Website chat', user: { name: 'Kabir Shah', email: 'kabir.shah@example.com' }, context: { page: 'product', id: 'coast-sunglasses' }, t0: 3 * H, msgs: [
        ['bot', 'Want to know when the Coast Sunglasses would reach you? Give me your pincode.', 180], ['user', 'honey colour sold out?', 179], ['bot', 'Here’s the **Coast Sunglasses** right now, live from the studio shelves.', 179, { cards: [{ title: 'Coast Sunglasses', price: '₹4,800' }] }], ['user', 'alert me when it’s back', 178], ['bot', 'Where shall I send the alert? Your email is enough, and we only use it for this.', 178], ['user', 'kabir.shah@example.com', 177],
        ['bot', 'You’re on the list. The moment it lands at the studio, we’ll email **kabir.shah@example.com**.', 177, { cards: [{ title: 'Coast Sunglasses', price: '₹4,800' }] }], ['user', 'thanks!', 176], ['bot', 'Thanks for stopping by. I am here whenever you need me.', 176]], lead: { intent: 'restock_alert', name: 'Kabir Shah', email: 'kabir.shah@example.com', payload: { product: 'Coast Sunglasses', variant: 'Honey' } } },
      { id: 'nlc-meher', status: 'bot', channel: 'web', source: 'Instagram ad', user: { name: o3.name, email: o3.email }, context: { page: 'account' }, t0: 2 * MIN, msgs: [
        ['bot', 'Welcome back. What can I do for you?', 2], ['user', 'return my ' + o3.items[0].name.toLowerCase(), 1.6], ['bot', 'Which order is it? These can still be returned:', 1.5]] },
      { id: 'nlc-ishaan', status: 'resolved', channel: 'web', source: 'Google search', user: { name: 'Ishaan Verma', email: 'ishaan.v@example.com' }, context: { page: 'shop' }, t0: 26 * H, msgs: [
        ['bot', 'Tell me what you’re after in a sentence, and I’ll pull the pieces.', 1560], ['user', 'gift for my father under 13000', 1559], ['bot', 'Pieces that make a good gift, picked from what’s on the shelf today:', 1559, { cards: [{ title: 'Meridian 38', price: '₹12,500' }, { title: 'Atelier Tote', price: '₹7,400' }, { title: 'Field Cap', price: '₹1,900' }] }], ['user', 'email me this', 1557], ['bot', 'Sent to **ishaan.v@example.com**.', 1556]], lead: { intent: 'saved_edit', name: 'Ishaan Verma', email: 'ishaan.v@example.com', payload: { pieces: 'Meridian 38, Atelier Tote, Field Cap' }, status: 'won' } },
      { id: 'nlc-pooja', status: 'resolved', channel: 'whatsapp', source: 'WhatsApp click-to-chat', user: { name: o2.name === 'Pooja Bhat' ? 'Pooja R.' : 'Pooja Bhat', email: 'pooja.bhat@example.com' }, context: {}, t0: 50 * H, msgs: [
        ['user', 'which size desert boot, I’m usually 42', 3000], ['bot', 'And how do you like things to fit?', 2999], ['user', 'regular', 2998], ['bot', 'Take the **41**. It runs half a size large, so going down one gives you the regular fit you want.', 2998, { cards: [{ title: 'Desert Boot · 41', price: '₹6,200' }] }]], lead: { intent: 'size_advice', name: 'Pooja Bhat', email: 'pooja.bhat@example.com', payload: { product: 'Desert Boot', usual: '42', fit: 'regular', recommended: '41' }, status: 'contacted' } }
    ];
    var add = [];
    S.forEach(function (s) {
      if (have[s.id]) return; made++;
      var c = { id: s.id, seed: true, nlSeed: true, agent: 'northlane', agentName: 'Northlane Concierge', channel: s.channel, source: s.source, status: s.status, person: s.person || null, startedAt: now - s.t0, updatedAt: now - s.msgs[s.msgs.length - 1][2] * MIN, engaged: true, user: s.user, mem: {}, context: s.context, handoverReason: s.handoverReason, handoverAt: s.handoverAt, handedOver: !!s.handoverReason,
        messages: s.msgs.map(function (x) { return m(x[0], x[1], x[2] * MIN, x[3]); }) };
      add.push(c);
      if (s.lead && !O.leads.list().some(function (l) { return l.payload && l.payload.convo === s.id; })) { var L = s.lead; O.leads.add({ name: L.name, email: L.email, phone: '', source: s.source, channel: s.channel, agent: 'northlane', intent: L.intent, payload: Object.assign({ convo: s.id }, L.payload), status: L.status || 'new', timestamp: new Date(now - s.msgs[s.msgs.length - 1][2] * MIN).toISOString(), nlSeed: true }); }
    });
    // written straight to the store so the seeded timestamps survive (put() would stamp them "now")
    if (made) { var all = O._store.get('orbit-convos', []); O._store.set('orbit-convos', all.concat(add)); O.convos.reload(); }
  }

  /* ───────── page ───────── */
  var sel = null, filter = 'all', q = '', draft = {}, off = null, offL = null, tm = 0;
  function counts() { var C = convos(), n = { all: C.length, waiting: 0, human: 0, bot: 0, resolved: 0 }; C.forEach(function (c) { n[c.status] = (n[c.status] || 0) + 1; }); return n; }
  function stats() {
    var s = { handled: 0, conv: 0, leads7: 0, ret7: 0, series: [] }, since = Date.now() - 7 * DAY, ev = O.events.list({ since: since }).filter(function (e) { return AG.indexOf(e.agent) >= 0 || e.agent === 'support'; }), cv = {};
    ev.forEach(function (e) { var c = cv[e.convo] || (cv[e.convo] = {}); if (e.type === 'engaged') c.e = 1; if (e.type === 'handover') c.h = 1; });
    Object.keys(cv).forEach(function (k) { if (cv[k].e) { s.conv++; if (!cv[k].h) s.handled++; } });
    var L = leads(); s.leads7 = L.filter(function (l) { return Date.parse(l.timestamp) >= since; }).length; s.ret7 = L.filter(function (l) { return l.intent === 'return' && Date.parse(l.timestamp) >= since; }).length;
    for (var i = 13; i >= 0; i--) { var d0 = NL.dayStart(Date.now() - i * DAY); s.series.push(L.filter(function (l) { var t = Date.parse(l.timestamp); return t >= d0 && t < d0 + DAY; }).length + ev.filter(function (e) { return e.type === 'lead' && e.agent === 'support' && e.ts >= d0 && e.ts < d0 + DAY; }).length); }
    s.pct = s.conv ? Math.round(s.handled / s.conv * 100) : 0; return s;
  }
  function kpis(r) {
    var n = counts(), C = convos(), longest = C.filter(function (c) { return c.status === 'waiting'; }).reduce(function (a, c) { return Math.max(a, wait(c)); }, 0), s = stats(), t = A.qs(r, 't', '');
    function k(lbl, v, d, act, on) { return '<div class="kpi' + (on ? ' on' : '') + '"><button type="button" class="kpi-a" data-act="' + act[0] + '" data-v="' + act[1] + '" aria-pressed="' + !!on + '"><span class="vh">' + lbl + '</span></button><span class="l">' + lbl + '</span><span class="v">' + v + '</span><span class="d">' + d + '</span></div>'; }
    return '<div class="kpis cx-k">' +
      k('Waiting for a person', n.waiting || 0, n.waiting ? '<span class="dn">Longest ' + dur(longest) + '</span>' : 'Nobody is waiting', ['filter', 'waiting'], filter === 'waiting' && !t) +
      k('With you', n.human || 0, 'Live, you’re replying', ['filter', 'human'], filter === 'human' && !t) +
      k('Handled by the concierge', s.pct + '%', 'of ' + s.conv + ' chats this week, no person needed', ['filter', 'bot'], filter === 'bot' && !t) +
      '<div class="kpi"><button type="button" class="kpi-a" data-act="tab" data-t="leads"><span class="vh">Leads from chat</span></button><span class="l">Leads from chat · 7 days</span><span class="v">' + s.leads7 + '</span>' + A.spark(s.series) + '</div>' +
      k('Returns started in chat', s.ret7, 'Booked without a ticket', ['leadint', 'return'], t === 'leads' && A.qs(r, 'i', '') === 'return') + '</div>';
  }
  function row(c) {
    var lu = lastUser(c), last = c.messages[c.messages.length - 1], w = wait(c);
    return '<button type="button" class="cx-it' + (c.id === sel ? ' on' : '') + (c.status === 'waiting' ? ' wait' : '') + '" data-act="open" data-id="' + esc(c.id) + '" aria-current="' + (c.id === sel) + '">' + A.av(nameOf(c)) +
      '<span class="cx-it-m"><span class="cx-it-h"><b>' + esc(nameOf(c)) + '</b><small>' + (w ? '<span class="cx-w">' + dur(w) + '</span>' : NL.ago(c.updatedAt || c.startedAt).replace(' ago', '')) + '</small></span>' +
      '<span class="cx-it-p">' + (last && last.from === 'agent' ? '<em>You:</em> ' : '') + esc(plain((lu && c.status === 'waiting' ? lu : last || {}).text || '').slice(0, 90)) + '</span>' +
      '<span class="cx-it-f"><span class="st ' + STL[c.status][1] + '">' + STL[c.status][0] + '</span><span class="cx-ch">' + ic(c.channel === 'whatsapp' ? 'chat' : 'store') + chLabel(c) + '</span>' + (c.leadId || leadsOf(c).length ? '<span class="tag cx-lt">Lead</span>' : '') + '</span></span></button>';
  }
  function list() {
    var C = convos().filter(function (c) { return (filter === 'all' || c.status === filter) && (!q || (nameOf(c) + ' ' + (c.user && c.user.email || '') + ' ' + c.messages.map(function (m) { return m.text; }).join(' ')).toLowerCase().indexOf(q.toLowerCase()) >= 0); });
    C.sort(function (a, b) { var wa = a.status === 'waiting' ? 1 : 0, wb = b.status === 'waiting' ? 1 : 0; return wb - wa || (b.updatedAt || 0) - (a.updatedAt || 0); });
    return C.length ? C.map(row).join('') : '<div class="cx-none">' + (q ? 'No chats match “' + esc(q) + '”.' : filter === 'waiting' ? 'Nobody is waiting. The concierge has it.' : 'No conversations here yet. Open the store and ask the concierge something.') + '</div>';
  }
  function leadsOf(c) { return O.leads.list().filter(function (l) { return (l.payload && l.payload.convo === c.id) || l.id === c.leadId; }); }
  function msgHtml(m, c) {
    var who = m.from === 'user' ? nameOf(c).split(' ')[0] : m.from === 'agent' ? (m.name || ME) : (m.kind === 'system' || m.from === 'system') ? '' : 'Concierge';
    if (m.kind === 'system' || m.from === 'system') return '<div class="cx-sys"><span>' + fmt(plain(m.text)) + ' · ' + hm(m.ts) + '</span></div>';
    var cards = m.cards && m.cards.length ? '<div class="cx-cards">' + m.cards.map(function (k) { return '<span>' + esc(k.title) + (k.price ? ' <i>' + esc(k.price) + '</i>' : '') + '</span>'; }).join('') + '</div>' : '';
    var offered = m.buttons && m.buttons.length && m.from === 'bot' ? '<div class="cx-off">Offered: ' + m.buttons.slice(0, 4).map(function (b) { return esc(b.label); }).join(' · ') + '</div>' : '';
    return '<div class="cx-m cx-' + (m.from === 'user' ? 'u' : m.from === 'agent' ? 'a' : 'b') + '"><small>' + esc(who) + ' · ' + hm(m.ts) + '</small><div class="cx-bub">' + fmt(m.text) + cards + '</div>' + offered + '</div>';
  }
  function thread() {
    var c = sel && O.convos.get(sel); if (!c) return '<div class="cx-empty">' + A.empty('chat', 'Pick a conversation', 'Chats the concierge hands over wait here. Press <kbd>N</kbd> for the next one waiting.', '') + '</div>';
    var lu = lastUser(c), st = c.status, L = leadsOf(c);
    var acts = st === 'waiting' ? '<button class="b pri" type="button" data-act="take">' + ic('user') + 'Take over <kbd>T</kbd></button>' : st === 'bot' ? '<button class="b" type="button" data-act="take">' + ic('user') + 'Join this chat</button>' : st === 'human' ? '<button class="b" type="button" data-act="back">' + ic('reset') + 'Hand back to concierge</button><button class="b pri" type="button" data-act="resolve">' + ic('check') + 'Resolve <kbd>E</kbd></button>' : '<button class="b" type="button" data-act="reopen">' + ic('reset') + 'Reopen</button>';
    var comp = st === 'human' ? '<form class="cx-comp" data-act-form="send"><div class="cx-mac" role="group" aria-label="Quick replies">' + macros(c).map(function (t, i) { return '<button type="button" class="cx-chip" data-act="mac" data-i="' + i + '">' + esc(t) + '</button>'; }).join('') + '</div><div class="cx-in"><label class="vh" for="cxIn">Reply to ' + esc(nameOf(c)) + '</label><textarea id="cxIn" class="ta" rows="2" placeholder="Reply as ' + ME + '… (Enter to send, Shift Enter for a new line)" data-kd="key">' + esc(draft[c.id] || '') + '</textarea><button class="b pri" type="button" data-act="send">' + ic('arrow-r') + 'Send</button></div></form>'
      : st === 'waiting' ? '<div class="cx-hint">' + ic('clock') + '<span>' + esc(nameOf(c).split(' ')[0]) + ' has waited <b>' + dur(wait(c)) + '</b>. Take over to reply; the concierge has told them a person is coming.</span></div>'
      : st === 'bot' ? '<div class="cx-hint">' + ic('bolt') + '<span>The concierge is handling this live. Join if you want to step in.</span></div>' : '<div class="cx-hint">' + ic('check') + '<span>Resolved. Reopen to reply again.</span></div>';
    return '<div class="cx-th"><button class="ib cx-backl show-s" type="button" data-act="close" aria-label="Back to the list">' + ic('arrow-l') + '</button>' + A.av(nameOf(c)) + '<div class="cx-th-t"><h2>' + esc(nameOf(c)) + '</h2><small>' + chLabel(c) + (c.source && c.source !== 'Website chat' && c.source !== 'WhatsApp' ? ' · ' + esc(c.source) : '') + (pageLabel(c.context) ? ' · ' + esc(pageLabel(c.context)) : '') + '</small></div><div class="cx-th-a">' + acts + '<button class="ib" type="button" data-act="more" aria-label="More actions" aria-haspopup="menu">' + ic('more') + '</button></div></div>' +
      (lu ? '<div class="cx-last"><span class="lbl">Last said' + (c.handoverReason && st !== 'bot' ? ' · ' + esc(c.handoverReason.toLowerCase()) : '') + '</span><p>“' + esc(plain(lu.text)) + '”</p></div>' : '') +
      '<div class="cx-log" role="log" aria-live="polite" aria-label="Transcript">' + c.messages.map(function (m) { return msgHtml(m, c); }).join('') + '</div>' + comp;
  }
  function side() {
    var c = sel && O.convos.get(sel); if (!c) return '';
    var em = c.user && c.user.email, cu = em && NL.custByEmail(em), os = em ? NL.db().orders.filter(function (o) { return o.email === em; }).slice(0, 3) : [], L = leadsOf(c);
    return '<section class="cx-sec"><h3>Customer</h3><div class="cx-kv"><div><span>Name</span><b>' + esc(nameOf(c)) + '</b></div><div><span>Email</span><b>' + (em ? esc(em) : '<button type="button" class="lnk" data-act="addmail">+ Add email</button>') + '</b></div>' + (cu ? '<div><span>Customer</span><b><a class="lnk" href="#/customers/' + cu.id + '">' + NL.plural(cu.orders || os.length, 'order') + ' · ' + esc(cu.city || '') + '</a></b></div>' : '<div><span>Customer</span><b class="mute">Not a customer yet</b></div>') + '<div><span>Came from</span><b>' + esc(c.source || '—') + '</b></div>' + (pageLabel(c.context) ? '<div><span>On page</span><b>' + esc(pageLabel(c.context)) + '</b></div>' : '') + '</div></section>' +
      (L.length ? '<section class="cx-sec"><h3>From this chat</h3>' + L.map(function (l) { var it = INT[l.intent] || [l.intent, 'mute', 'bolt'], p = l.payload || {}; return '<div class="cx-lead"><span class="ico ' + it[1] + '">' + ic(it[2]) + '</span><span><b>' + it[0] + '</b><small>' + esc(detail(l)) + '</small>' + (p.order ? '<a class="lnk" href="#/orders/' + esc(p.order) + '">Open ' + esc(p.order) + (p.rma ? ' · ' + esc(p.rma) : '') + '</a>' : p.sku ? '<a class="lnk" href="#/inventory?q=' + esc(p.sku) + '">See ' + esc(p.sku) + ' in inventory</a>' : '') + '</span></div>'; }).join('') + '</section>' : '') +
      (os.length ? '<section class="cx-sec"><h3>Recent orders</h3>' + os.map(function (o) { return '<a class="cx-ord" href="#/orders/' + o.id + '">' + A.thumbs(o, 2) + '<span><b>' + o.id + '</b><small>' + NL.money(o.total) + ' · ' + NL.fDs(o.t) + '</small></span>' + A.stagePill(NL.stage(o)) + '</a>'; }).join('') + '</section>' : '') +
      '<section class="cx-sec"><h3>Chat</h3><div class="cx-kv"><div><span>Started</span><b>' + NL.rel(c.startedAt) + '</b></div><div><span>Messages</span><b>' + c.messages.length + '</b></div><div><span>Status</span><b><span class="st ' + STL[c.status][1] + '">' + STL[c.status][0] + '</span></b></div>' + (c.person ? '<div><span>Owner</span><b>' + esc(c.person) + '</b></div>' : '') + '</div></section>';
  }
  function macros(c) {
    var f = c.user && c.user.name ? c.user.name.split(' ')[0] : 'there', o = (c.user && c.user.email) ? NL.db().orders.filter(function (x) { return x.email === c.user.email; })[0] : null;
    return ['Hi ' + f + ', ' + ME + ' here from the Jaipur studio. Looking at this now.', o ? 'I’ve asked the courier to deliver ' + o.id + ' after 6 pm. You’ll get a WhatsApp with the slot.' : 'I’ve put one aside for you under your name until Saturday, 8 pm.', 'Sorry about this. I’ve added ₹500 of store credit to your account for the trouble.', 'Anything else I can help with?'];
  }
  function detail(l) { var p = l.payload || {}; return l.intent === 'return' ? (p.item || '') + (p.reason ? ' · ' + p.reason : '') + (p.value ? ' · ' + NL.money(p.value) : '') : l.intent === 'restock_alert' ? (p.product || '') + (p.variant ? ', ' + p.variant : '') + (p.eta ? ' · due ' + p.eta : '') : l.intent === 'size_advice' ? (p.product || '') + ' · usual ' + (p.usual || '?') + ', ' + (p.fit || '') + ' → ' + (p.recommended || '') : l.intent === 'order_status' ? (p.order || '') + ' · ' + (p.stage || '') : l.intent === 'product_finder' ? '“' + (p.brief || '') + '”' : l.intent === 'saved_edit' ? (p.pieces || '') : l.intent === 'delivery_check' ? (p.pin || '') + ' · ' + (p.city || '') : ''; }

  function leadsView(r) {
    var it = A.qs(r, 'i', ''), sf = A.qs(r, 's', ''), L = leads().filter(function (l) { return (!it || l.intent === it) && (!sf || lst(l) === sf); });
    var seg = '<div class="seg" role="group" aria-label="Lead status">' + [['', 'All'], ['new', 'New'], ['contacted', 'Contacted'], ['won', 'Converted']].map(function (x) { return '<button type="button" data-act="lsf" data-v="' + x[0] + '" aria-pressed="' + (sf === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>';
    var sel2 = '<label class="vh" for="cxLi">What</label><select class="sel" id="cxLi" data-ch="lint" style="width:auto;height:32px;font-size:12.5px"><option value="">Every kind of lead</option>' + Object.keys(INT).map(function (k) { return '<option value="' + k + '"' + (k === it ? ' selected' : '') + '>' + INT[k][0] + '</option>'; }).join('') + '</select>';
    return '<div class="fbar">' + seg + sel2 + '<span class="grow"></span><span class="mute" style="font-size:12.5px">' + NL.plural(L.length, 'lead') + ' · every one links to its transcript</span></div>' +
      '<div class="tw"><div class="tws"><table class="tb stack cx-tb"><thead><tr><th class="cb"><label class="ck"><input type="checkbox" data-ch="lall" aria-label="Select all leads"><span></span></label></th><th>Lead</th><th>What happened</th><th>From</th><th>Status</th><th class="num">When</th><th><span class="vh">Transcript</span></th></tr></thead><tbody>' +
      L.map(function (l) { var x = INT[l.intent] || [l.intent, 'mute', 'bolt'], s = lst(l), cid = l.payload && l.payload.convo, has = cid && O.convos.get(cid);
        return '<tr data-k="' + esc(lkey(l)) + '"><td class="cb"><label class="ck"><input type="checkbox" data-ch="lsel" aria-label="Select ' + esc(l.name) + '"><span></span></label></td><td data-m="a" class="who"><b>' + esc(l.name) + '</b><small>' + esc(l.email || l.phone || 'No contact yet') + '</small></td><td data-m="f" class="wrap"><span class="st ' + ({ vio: 'c-vio', warn: 'ring c-warn', info: 'c-info', ok: 'c-ok', mute: 'ring c-mute' }[x[1]]) + '">' + x[0] + '</span> <span class="mute cx-det">' + esc(detail(l)) + '</span></td><td data-m="hide" class="mute">' + ({ web: 'Store chat', whatsapp: 'WhatsApp' }[l.channel] || l.channel) + ' <span class="tag cx-lt">from chat</span></td><td data-m="hide"><button type="button" class="cx-ls cx-ls-' + s + '" data-act="lstat">' + LST[s] + ' ' + ic('chev-d') + '</button></td><td data-m="r" class="num mute">' + NL.ago(Date.parse(l.timestamp)) + '</td><td data-m="hide" class="num">' + (has ? '<a class="lnk" href="#/chats/' + esc(cid) + '">Transcript</a>' : '<span class="faint" title="The transcript has been cleared from this browser">—</span>') + '</td></tr>'; }).join('') +
      '</tbody></table></div>' + (L.length ? '' : A.empty('chat', 'No leads like that yet', 'When the concierge books a return, sets a restock alert or gives size advice, it lands here.', '')) + '</div><div id="cxBulk"></div>';
  }

  function paint() { var l = $('#cxList'), t = $('#cxThread'), s = $('#cxSide'); if (!l) return; var ta = $('#cxIn'), had = ta && document.activeElement === ta, pos = ta ? ta.selectionStart : 0; if (ta && sel) draft[sel] = ta.value;
    l.innerHTML = list(); t.innerHTML = thread(); s.innerHTML = side(); var g = $('.cx-log'); if (g) g.scrollTop = g.scrollHeight;
    var nta = $('#cxIn'); if (nta && had) { nta.focus(); try { nta.setSelectionRange(pos, pos); } catch (e) {} }
    $('#cxWrap').classList.toggle('has', !!sel); var sg = $('.cx-lh .seg'); if (sg) sg.outerHTML = segHtml(); var k = $('.cx-k'); if (k) k.outerHTML = kpis(A.parse()); A.navCounts(); }
  function later() { clearTimeout(tm); tm = setTimeout(function () { if (A.parse().name === 'chats') { if (A.parse().q.get('t') === 'leads') A.refresh(); else paint(); } }, 120); }

  var PAGE = {
    title: 'Conversations', nav: 'chats', skeleton: 'table', wide: true,
    crumbs: function (r) { var c = r.id && O.convos.get(r.id); return c ? [['Conversations', '#/chats'], [nameOf(c), '#/chats/' + c.id]] : [['Conversations', '#/chats']]; },
    render: function (r) {
      seed(); var t = A.qs(r, 't', ''); if (r.id) sel = r.id; if (r.q.get('f')) filter = r.q.get('f'); else if (!r.id) filter = 'all';
      if (!sel && t !== 'leads' && innerWidth > 700) { var w = convos().filter(function (c) { return c.status === 'waiting'; })[0]; sel = w ? w.id : null; }
      var n = counts(), nl = leads().length;
      var head = '<div class="ph"><div><h1>Conversations</h1><p>The concierge on the store and WhatsApp answers first. Anything it hands over waits here, with the whole chat.</p></div><div class="ph-a"><a class="b" href="../store/index.html" target="_blank" rel="noopener">' + ic('ext') + 'Open the store chat</a><button class="b pri" type="button" data-act="next">' + ic('chat') + 'Next waiting <kbd>N</kbd></button></div></div>' + kpis(r) +
        '<div class="tabs" role="tablist"><button type="button" role="tab" data-act="tab" data-t="" aria-selected="' + (t !== 'leads') + '">Inbox <span class="ct">' + n.all + '</span></button><button type="button" role="tab" data-act="tab" data-t="leads" aria-selected="' + (t === 'leads') + '">Leads from chat <span class="ct">' + nl + '</span></button></div>';
      if (t === 'leads') return head + leadsView(r);
      return head + '<div class="cx' + (sel ? ' has' : '') + '" id="cxWrap"><aside class="cx-l" aria-label="Conversation list"><div class="cx-lh">' + segHtml() +
        '<div class="srch"><span class="ic ic-search" aria-hidden="true"></span><label class="vh" for="cxQ">Search chats</label><input class="in" id="cxQ" type="search" placeholder="Search names, emails, messages" data-in="q" data-search value="' + esc(q) + '"></div></div><div class="cx-list" id="cxList"></div></aside>' +
        '<section class="cx-t" id="cxThread" aria-label="Conversation"></section><aside class="cx-r" id="cxSide" aria-label="Customer and context"></aside></div>';
    },
    mount: function (r) {
      if (A.qs(r, 't', '') !== 'leads') paint();
      if (!off) { off = O.convos.on(later); offL = O.leads.on(later); }
    },
    leave: function () { if (off) { off(); offL(); off = offL = null; } },
    keys: {
      n: function () { var w = convos().filter(function (c) { return c.status === 'waiting' && c.id !== sel; })[0]; if (w) A.go('chats/' + w.id); else A.toast('Nobody else is waiting. The concierge has it.'); },
      t: function () { var c = sel && O.convos.get(sel); if (c && (c.status === 'waiting' || c.status === 'bot')) act.take(); },
      e: function () { var c = sel && O.convos.get(sel); if (c && c.status === 'human') act.resolve(); },
      r: function (e) { var ta = $('#cxIn'); if (ta) { e.preventDefault(); ta.focus(); } },
      j: function () { step(1); }, k: function () { step(-1); }
    },
    acts: null
  };
  function segHtml() { var n = counts(); return '<div class="seg" role="group" aria-label="Filter">' + [['all', 'All'], ['waiting', 'Waiting'], ['human', 'With you'], ['bot', 'Bot'], ['resolved', 'Done']].map(function (x) { return '<button type="button" data-act="filter" data-v="' + x[0] + '" aria-pressed="' + (filter === x[0]) + '">' + x[1] + (n[x[0]] && x[0] !== 'all' && x[0] !== 'resolved' ? ' <span class="ct">' + n[x[0]] + '</span>' : '') + '</button>'; }).join('') + '</div>'; }
  function step(d) { var L = $$('.cx-it'), i = L.findIndex(function (b) { return b.getAttribute('data-id') === sel; }), nx = L[Math.max(0, Math.min(L.length - 1, i + d))]; if (nx) A.go('chats/' + nx.getAttribute('data-id')); }
  function sendText(t) { var c = sel && O.convos.get(sel); if (!c || !t.trim()) return; var ta0 = $('#cxIn'); if (ta0) ta0.value = ''; O.convos.append(c.id, { from: 'agent', name: ME, text: t.trim() }); O.events.log('agent_reply', { agent: c.agent, channel: c.channel, source: c.source, convo: c.id }); draft[c.id] = ''; NL.log('Replied in chat', nameOf(c), t.trim().slice(0, 80)); paint(); var ta = $('#cxIn'); if (ta) ta.focus(); }
  var act = {
    open: function (b) { A.go('chats/' + b.getAttribute('data-id')); },
    close: function () { sel = null; A.go('chats' + (filter !== 'all' ? '?f=' + filter : '')); },
    filter: function (b) { filter = b.getAttribute('data-v'); A.setQ({ f: filter === 'all' ? '' : filter, t: '' }); if ($('#cxList')) paint(); else A.refresh(); },
    tab: function (b) { A.setQ({ t: b.getAttribute('data-t'), i: '', s: '' }); A.refresh(); },
    leadint: function (b) { A.setQ({ t: 'leads', i: b.getAttribute('data-v') }); A.refresh(); },
    q: function (i) { q = i.value; var l = $('#cxList'); if (l) l.innerHTML = list(); },
    next: function () { A.cur().keys.n(); },
    take: function () { var c = O.convos.get(sel); if (!c) return; var was = c.status; O.convos.setStatus(c.id, 'human', { person: 'Ananya Rao (owner)' }); O.convos.append(c.id, { from: 'system', kind: 'system', text: 'Connected to Ananya Rao (owner)' }); O.events.log('agent_reply', { agent: c.agent, channel: c.channel, source: c.source, convo: c.id, kind: 'takeover' }); NL.log('Took over a chat', nameOf(c), c.handoverReason || ''); paint(); A.toast('You’re in the chat with ' + esc(nameOf(c).split(' ')[0]) + '. They’ve been told.', { icon: 'chat' }); setTimeout(function () { var ta = $('#cxIn'); if (ta) ta.focus(); }, 40); if (was === 'waiting') {} },
    back: function () { var c = O.convos.get(sel); if (!c) return; O.convos.setStatus(c.id, 'bot', { person: null }); O.convos.append(c.id, { from: 'system', kind: 'system', text: 'You’re back with the Northlane concierge. Anything else I can help with?' }); paint(); A.toast('Handed back to the concierge.', { icon: 'reset', undo: function () { O.convos.setStatus(c.id, 'human', { person: 'Ananya Rao (owner)' }); paint(); } }); },
    resolve: function () { var c = O.convos.get(sel); if (!c) return; var prev = c.status; O.convos.setStatus(c.id, 'resolved'); O.convos.append(c.id, { from: 'system', kind: 'system', text: 'Conversation resolved by ' + ME }); O.events.log('resolved', { agent: c.agent, channel: c.channel, source: c.source, convo: c.id, by: 'person' }); NL.log('Resolved a chat', nameOf(c), ''); var nx = convos().filter(function (x) { return x.status === 'waiting'; })[0]; A.toast('Resolved. ' + (nx ? 'Next: ' + esc(nameOf(nx)) + '.' : 'Nobody else is waiting.'), { undo: function () { O.convos.setStatus(c.id, prev); paint(); }, action: nx ? ['Open next', function () { A.go('chats/' + nx.id); }] : null }); paint(); },
    reopen: function () { var c = O.convos.get(sel); if (!c) return; O.convos.setStatus(c.id, 'human', { person: 'Ananya Rao (owner)' }); paint(); },
    send: function () { var ta = $('#cxIn'); if (ta) sendText(ta.value); },
    key: function (ta, e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(ta.value); } else if (e.key === 'Escape') ta.blur(); else setTimeout(function () { draft[sel] = ta.value; }, 0); },
    mac: function (b) { var c = O.convos.get(sel), t = macros(c)[+b.getAttribute('data-i')], ta = $('#cxIn'); if (ta) { ta.value = t; draft[sel] = t; ta.focus(); } },
    addmail: function () { var c = O.convos.get(sel); A.modal({ title: 'Add an email', sub: 'For ' + esc(nameOf(c)), size: 'sm', body: '<label class="fl"><span>Email</span><input class="in" id="cxMail" type="email" placeholder="name@example.com" autocomplete="off"></label><p class="hint" id="cxMailE" style="color:var(--bad);margin-top:6px"></p>', foot: [{ label: 'Cancel' }, { label: 'Save', cls: 'pri', run: function (api) { var v = $('#cxMail').value.trim(); if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v)) { $('#cxMailE').textContent = 'That doesn’t look like an email address yet.'; return; } c.user = c.user || {}; c.user.email = v.toLowerCase(); O.convos.put(c); api.close(); paint(); A.toast('Email saved to this conversation.'); } }] }); },
    more: function (b) { var c = O.convos.get(sel); if (!c) return; A.menu(b, [{ label: 'Copy transcript', icon: 'copy', run: function () { A.copy(c.messages.map(function (m) { return (m.from === 'user' ? nameOf(c) : m.from === 'agent' ? (m.name || ME) : 'Concierge') + ': ' + plain(m.text); }).join('\n'), 'Transcript'); } }, c.user && c.user.email && NL.custByEmail(c.user.email) ? { label: 'Open customer profile', icon: 'user', run: function () { A.go('customers/' + NL.custByEmail(c.user.email).id); } } : { label: 'Open the store in a new tab', icon: 'ext', run: function () { open('../store/index.html', '_blank'); } }], { right: true }); },
    lsf: function (b) { A.setQ({ s: b.getAttribute('data-v') }); A.refresh(); },
    lint: function (s) { A.setQ({ i: s.value }); A.refresh(); },
    lall: function (i) { $$('.cx-tb tbody input[type=checkbox]').forEach(function (x) { x.checked = i.checked; x.closest('tr').classList.toggle('sel', i.checked); }); bulk(); },
    lsel: function (i) { i.closest('tr').classList.toggle('sel', i.checked); bulk(); },
    lstat: function (b) { var tr = b.closest('tr'), L = leads().filter(function (l) { return lkey(l) === tr.getAttribute('data-k'); }); A.menu(b, Object.keys(LST).map(function (k) { return { label: LST[k], icon: k === 'won' ? 'check' : k === 'closed' ? 'x' : k === 'contacted' ? 'chat' : 'bolt', run: function () { var prev = lst(L[0]); setLst(L, k); A.refresh(); A.toast(esc(L[0].name) + ' marked ' + LST[k].toLowerCase() + '.', { undo: function () { setLst(L, prev); A.refresh(); } }); } }; })); },
    bmark: function (b) { var k = b.getAttribute('data-v'), keys = $$('.cx-tb tbody tr.sel').map(function (tr) { return tr.getAttribute('data-k'); }), L = leads().filter(function (l) { return keys.indexOf(lkey(l)) >= 0; }), prev = L.map(lst); setLst(L, k); A.refresh(); A.toast(NL.plural(L.length, 'lead') + ' marked ' + LST[k].toLowerCase() + '.', { undo: function () { L.forEach(function (l, i) { setLst([l], prev[i]); }); A.refresh(); } }); }
  };
  function bulk() { var n = $$('.cx-tb tbody tr.sel').length, b = $('#cxBulk'); if (!b) return; b.innerHTML = n ? '<div class="bulk"><b>' + n + ' selected</b><button class="b" type="button" data-act="bmark" data-v="contacted">' + ic('chat') + 'Mark contacted</button><button class="b" type="button" data-act="bmark" data-v="won">' + ic('check') + 'Mark converted</button></div>' : ''; }
  PAGE.acts = act; A.page('chats', PAGE);
  }
})();
