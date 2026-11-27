/* Sthira back office · Conversations. The inbox behind the site assistant (agent "builder" on the shared Orbit engine).
   Reads the shared conversation store ('orbit-convos'), so a chat on the public site appears here live, even from another tab.
   Staff take over, reply, hand back to the assistant and resolve. The engine loads only when this view opens. */
(function () {
  'use strict';
  var BO = window.BO, A = BO.A, $ = BO.$, $$ = BO.$$, esc = BO.esc, ic = BO.ic, MIN = 6e4;
  var AGENT = 'builder', ME = 'Farah', MEN = 'Farah Siddiqui (Sthira)';

  /* a believable inbox the first time (written straight to the shared store; works before the engine loads) */
  (function seed() {
    if (A.store.get('chatseed', 0)) return;
    var all = BO.raw('orbit-convos', []); var have = {}; all.forEach(function (c) { have[c.id] = 1; });
    var now = Date.now(), add = [];
    function c(id, st, ch, src, user, ctx, t0, msgs, x) {
      if (have[id]) return; var m = msgs.map(function (r, i) { var o = { id: 'sm' + id.slice(5) + i, from: r[0], text: r[1], ts: now - r[2] * MIN }; if (r[3]) Object.assign(o, r[3]); return o; });
      add.push(Object.assign({ id: id, seed: false, sthSeed: true, agent: AGENT, agentName: 'Sthira site desk', channel: ch, source: src, status: st, person: null, startedAt: now - t0 * MIN, updatedAt: m[m.length - 1].ts, engaged: true, user: user, mem: {}, context: ctx, messages: m }, x || {}));
    }
    c('sthc-naveen', 'waiting', 'web', 'Google search', { name: 'Naveen Reddy', email: 'naveen.r@example.com' }, { page: 'estimate' }, 14, [
      ['bot', 'Hello, this is the Sthira site desk. I can estimate a build, book a site visit or tell you where a live project stands.', 14], ['user', 'I have a 40x60 plot in Gachibowli, want G+2 with a home office on top', 13], ['bot', 'Good plot for it. At **Signature** spec a 3,000 sq ft G+2 in Hyderabad comes to about **₹96 L to ₹1.12 Cr**, built in 11 to 12 months.', 13, { cards: [{ title: 'G+2 · 3,000 sq ft · Signature', price: '₹96 L – 1.12 Cr' }] }],
      ['user', 'can someone come see the plot saturday morning', 11], ['bot', 'I can hold **Sat 28 Nov, 10:30 am** with our Hyderabad engineer. Shall I book it?', 11], ['user', 'yes. but I want to talk to a person first, my architect already has drawings', 7], ['bot', 'Connecting you to a person now. They can see everything we have talked about, so you will not need to repeat yourself.', 6, { kind: 'system' }]
    ], { handoverReason: 'Visitor asked for a person', handoverAt: now - 6 * MIN, handedOver: true });
    c('sthc-arjun', 'human', 'whatsapp', 'WhatsApp', { name: 'Arjun Shetty', email: 'arjun.shetty@example.com' }, { page: 'project' }, 70, [
      ['user', 'Hi, we got the quote for Sahakar Nagar. If we drop the basement and add a lift, what changes?', 70], ['bot', 'Let me bring in Farah, who prepared your quote. She can see this whole chat.', 69, { kind: 'system' }], ['system', 'Connected to Farah Siddiqui (Sthira)', 66, { kind: 'system' }],
      ['agent', 'Hi Arjun, Farah here. Dropping the basement saves roughly ₹14 L; a 4-person lift with the pit and machine room adds about ₹9.5 L. I’ll send a revised quote by this evening.', 64, { name: 'Farah' }], ['user', 'Perfect. Can the lift open on the terrace too?', 41]
    ], { person: MEN, handoverAt: now - 69 * MIN, handedOver: true });
    c('sthc-visitor', 'bot', 'web', 'Instagram ad', {}, { page: 'home' }, 3, [
      ['bot', 'Hello, this is the Sthira site desk. What are you planning to build?', 3], ['user', 'mysuru mein 2400 sq ft G+1 kitne ka hai', 2], ['bot', 'For **2,400 sq ft, G+1 in Mysuru** at Essential spec: about **₹50 L to ₹58 L**, 9 to 10 months. Want the Signature price as well?', 2, { cards: [{ title: 'G+1 · 2,400 sq ft · Essential', price: '₹50 – 58 L' }] }]
    ]);
    c('sthc-shalini', 'resolved', 'web', 'Website chat', { name: 'Shalini Deshmukh' }, { page: 'services' }, 820, [
      ['user', 'cost for full interiors of a 3bhk in kothrud? 1850 sq ft', 820], ['bot', 'A 3 BHK fit-out at 1,850 sq ft with a modular kitchen and wardrobes runs **₹26.8 L to ₹31.5 L** in Pune, about 12 weeks.', 819, { cards: [{ title: 'Interiors · 1,850 sq ft · Pune', price: '₹26.8 – 31.5 L' }] }], ['user', 'ok please have someone call me', 816], ['bot', 'Done. Rhea from our Pune studio will call you tomorrow before 11 am.', 816], ['bot', 'Conversation resolved by the assistant', 815, { kind: 'system' }]
    ]);
    c('sthc-vikram', 'resolved', 'whatsapp', 'WhatsApp', { name: 'Vikram Rao' }, {}, 2900, [
      ['user', 'status STH-2611?', 2900], ['bot', '**Rao Residence · STH-2611**: day 167 of 320. Second-floor blockwork at 70%; the third floor starts on Thursday. Next payment: milestone 8 on 30 Nov.', 2899], ['user', 'thanks', 2898]
    ]);
    if (add.length) { try { localStorage.setItem('orbit-convos', JSON.stringify(all.concat(add))); } catch (e) {} if (window.Orbit && Orbit.convos && Orbit.convos.reload) Orbit.convos.reload(); }
    A.store.set('chatseed', 1);
  })();

  /* engine: engine.js, ui.js and the builder agent, in order, the first time the inbox opens */
  var eng = null, agentOk = false;
  function load() {
    if (eng) return eng;
    eng = new Promise(function (res) {
      var files = ['../assets/bots/engine.js?v=23', '../assets/bots/ui.js?v=23', '../assets/bots/agents/builder.js?v=1'], i = 0;
      (function next() { if (i >= files.length) { agentOk = !!(window.Orbit && Orbit.agents && Orbit.agents[AGENT]); return res(!!window.Orbit); } var s = document.createElement('script'); s.src = files[i++]; s.onload = next; s.onerror = next; document.head.appendChild(s); })();
    });
    return eng;
  }
  function O() { return window.Orbit; }
  function convos() { return O().convos.list().filter(function (c) { return c.agent === AGENT && (c.engaged || c.status !== 'bot'); }); }
  function nameOf(c) { return (c.user && c.user.name) || 'Site visitor'; }
  function lastUser(c) { for (var i = c.messages.length - 1; i >= 0; i--) if (c.messages[i].from === 'user') return c.messages[i]; return null; }
  function plain(t) { return String(t || '').replace(/\*\*/g, ''); }
  function fmt(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); }
  function hm(ts) { return BO.hm(ts); }
  function wait(c) { return c.status === 'waiting' ? Date.now() - (c.handoverAt || c.updatedAt) : 0; }
  function chL(c) { return { web: 'Site chat', whatsapp: 'WhatsApp', instagram: 'Instagram' }[c.channel] || c.channel; }
  function pageL(x) { return x && x.page ? 'On ' + ({ home: 'the home page', estimate: 'the estimator', project: 'a case study', services: 'Services', contact: 'Contact', careers: 'Careers', portal: 'the portal' }[x.page] || x.page) : ''; }
  var STL = { bot: ['Assistant', ''], waiting: ['Waiting', 'red'], human: ['With you', 'blue'], resolved: ['Resolved', 'ok'] };
  function leadOf(c) { var L = BO.crm.leads; return L.filter(function (l) { return l.convo === c.id; })[0] || (c.user && c.user.name ? L.filter(function (l) { return l.name.toLowerCase().indexOf(c.user.name.toLowerCase()) >= 0 || (c.user.email && l.email === c.user.email); })[0] : null); }

  var sel = null, filter = 'all', q = '', draft = {}, off = null, tm = 0;
  function counts() { var n = { all: 0, waiting: 0, human: 0, bot: 0, resolved: 0 }; convos().forEach(function (c) { n.all++; n[c.status] = (n[c.status] || 0) + 1; }); return n; }
  function segHtml() { var n = counts(); return '<div class="sg sm" role="group" aria-label="Filter">' + [['all', 'All'], ['waiting', 'Waiting'], ['human', 'With you'], ['bot', 'Assistant'], ['resolved', 'Done']].map(function (x) { return '<button type="button" data-act="filter" data-v="' + x[0] + '" aria-pressed="' + (filter === x[0]) + '">' + x[1] + (n[x[0]] && x[0] !== 'all' && x[0] !== 'resolved' ? ' <span class="ct' + (x[0] === 'waiting' ? ' hot-red' : '') + '">' + n[x[0]] + '</span>' : '') + '</button>'; }).join('') + '</div>'; }
  function list() {
    var C = convos().filter(function (c) { return (filter === 'all' || c.status === filter) && (!q || (nameOf(c) + ' ' + c.messages.map(function (m) { return m.text; }).join(' ')).toLowerCase().indexOf(q.toLowerCase()) >= 0); });
    C.sort(function (a, b) { var wa = a.status === 'waiting' ? 1 : 0, wb = b.status === 'waiting' ? 1 : 0; return wb - wa || (b.updatedAt || 0) - (a.updatedAt || 0); });
    if (!C.length) return '<p class="cx-none">' + (q ? 'No chats match “' + esc(q) + '”.' : filter === 'waiting' ? 'Nobody is waiting. The assistant has it.' : 'No conversations yet. They appear here as soon as someone writes to the site assistant.') + '</p>';
    return C.map(function (c) { var lu = lastUser(c), last = c.messages[c.messages.length - 1] || {}, w = wait(c), l = leadOf(c);
      return '<button type="button" class="cx-it' + (c.id === sel ? ' on' : '') + (c.status === 'waiting' ? ' wait' : '') + '" data-act="open" data-id="' + esc(c.id) + '" aria-current="' + (c.id === sel) + '">' + BO.av(nameOf(c), 'sm') + '<span class="cx-m"><span class="cx-r1"><b>' + esc(nameOf(c)) + '</b><small' + (w ? ' class="red"' : '') + '>' + (w ? BO.dur(w) : BO.dur(Date.now() - (c.updatedAt || c.startedAt))) + '</small></span><span class="cx-p">' + (last.from === 'agent' ? '<em>You:</em> ' : '') + esc(plain((c.status === 'waiting' && lu ? lu : last).text).slice(0, 84)) + '</span><span class="cx-r3"><span class="tg sm ' + STL[c.status][1] + '">' + STL[c.status][0] + '</span><span class="mono faint">' + chL(c) + '</span>' + (l ? '<span class="tg sm">' + esc(l.id) + '</span>' : '') + '</span></span></button>'; }).join('');
  }
  function msgHtml(m, c) {
    if (m.kind === 'system' || m.from === 'system') return '<p class="cx-sys"><span>' + fmt(plain(m.text)) + ' · ' + hm(m.ts) + '</span></p>';
    var who = m.from === 'user' ? nameOf(c).split(' ')[0] : m.from === 'agent' ? (m.name || ME) : 'Site desk';
    var cards = m.cards && m.cards.length ? '<span class="cx-cards">' + m.cards.map(function (k) { return '<span>' + esc(k.title) + (k.price ? ' <b>' + esc(k.price) + '</b>' : '') + '</span>'; }).join('') + '</span>' : '';
    return '<div class="cx-msg cx-' + (m.from === 'user' ? 'u' : m.from === 'agent' ? 'a' : 'b') + '"><small>' + esc(who) + ' · ' + hm(m.ts) + '</small><div class="cx-bub">' + fmt(m.text) + cards + '</div></div>';
  }
  function macros(c) { var f = c.user && c.user.name ? c.user.name.split(' ')[0] : 'there'; return ['Hi ' + f + ', Farah from Sthira here. Reading your chat now.', 'We can build to your architect’s drawings. Our engineer will check the structure set before quoting.', 'I’ve booked the site visit and sent the details by SMS.', 'Anything else I can help with?']; }
  function thread() {
    var c = sel && O().convos.get(sel); if (!c) return '<div class="cx-empty">' + BO.empty('Pick a conversation', 'Chats the assistant hands over wait here with the whole transcript. Press <kbd>N</kbd> for the next one waiting.', '') + '</div>';
    var st = c.status, lu = lastUser(c);
    var acts = st === 'waiting' ? '<button type="button" class="b pri" data-act="take">' + ic('user') + 'Take over<kbd>T</kbd></button>' : st === 'bot' ? '<button type="button" class="b" data-act="take">' + ic('user') + 'Join chat</button>' : st === 'human' ? '<button type="button" class="b" data-act="back">' + ic('hand') + 'Hand back</button><button type="button" class="b pri" data-act="resolve">' + ic('check') + 'Resolve<kbd>E</kbd></button>' : '<button type="button" class="b" data-act="reopen">' + ic('reset') + 'Reopen</button>';
    var comp = st === 'human' ? '<div class="cx-comp"><div class="cx-mac" role="group" aria-label="Quick replies">' + macros(c).map(function (t, i) { return '<button type="button" class="chip-s" data-act="mac" data-i="' + i + '">' + esc(t.length > 46 ? t.slice(0, 44) + '…' : t) + '</button>'; }).join('') + '</div><div class="cx-in"><label class="sr" for="cxIn">Reply to ' + esc(nameOf(c)) + '</label><textarea id="cxIn" class="in" rows="2" placeholder="Reply as Farah · Enter to send, Shift Enter for a new line" data-kd="key">' + esc(draft[c.id] || '') + '</textarea><button type="button" class="b pri" data-act="send">' + ic('send') + 'Send</button></div></div>'
      : '<p class="cx-hint">' + ic(st === 'waiting' ? 'clock' : st === 'bot' ? 'bolt' : 'check') + '<span>' + (st === 'waiting' ? esc(nameOf(c).split(' ')[0]) + ' has waited <b>' + BO.dur(wait(c)) + '</b>. Take over to reply; the assistant has told them a person is coming.' : st === 'bot' ? 'The assistant is handling this live. Join if you want to step in.' : 'Resolved. Reopen to reply again.') + '</span></p>';
    return '<div class="cx-th"><button type="button" class="ib cx-back" data-act="close" aria-label="Back to the list">' + ic('arrow-l') + '</button>' + BO.av(nameOf(c)) + '<div class="cx-tt"><h2>' + esc(nameOf(c)) + '</h2><small>' + chL(c) + (c.source ? ' · ' + esc(c.source) : '') + (pageL(c.context) ? ' · ' + esc(pageL(c.context)) : '') + '</small></div><div class="cx-ta">' + acts + '<button type="button" class="ib" data-act="more" aria-label="More" aria-haspopup="menu">' + ic('more') + '</button></div></div>' +
      (lu ? '<blockquote class="remark sm"><p>“' + esc(plain(lu.text)) + '”</p><footer>Last said' + (c.handoverReason && st !== 'bot' ? ' · ' + esc(c.handoverReason.toLowerCase()) : '') + '</footer></blockquote>' : '') +
      '<div class="cx-log" role="log" aria-live="polite" aria-label="Transcript">' + c.messages.map(function (m) { return msgHtml(m, c); }).join('') + '</div>' + comp;
  }
  function side() {
    var c = sel && O().convos.get(sel); if (!c) return '';
    var l = leadOf(c);
    return '<section class="so-s"><h3>Lead</h3>' + (l ? '<button type="button" class="rel" data-act="lead" data-id="' + l.id + '">' + ic('user') + '<span><b>' + esc(l.name) + '</b><small>' + l.id + ' · ' + BO.SN[l.stage] + (l.source === 'Chat' ? ' · from chat' : '') + '</small></span>' + ic('chev-r') + '</button>' + (l.next ? '<p class="nx-line sm">' + ic('arrow-r') + '<span>' + esc(l.next) + '</span>' + BO.dueChip(l.due) + '</p>' : '') : '<p class="hint">No lead yet for this chat.</p><button type="button" class="b sm" data-act="mkLead">' + ic('plus') + 'Create lead from chat</button>') + '</section>' +
      '<section class="so-s"><h3>Visitor</h3><dl class="props"><div class="pr"><dt>Name</dt><dd class="ro">' + esc(nameOf(c)) + '</dd></div><div class="pr"><dt>Email</dt><dd class="ro">' + (c.user && c.user.email ? esc(c.user.email) : '<span class="faint">Not given</span>') + '</dd></div><div class="pr"><dt>Came from</dt><dd class="ro">' + esc(c.source || '—') + '</dd></div>' + (pageL(c.context) ? '<div class="pr"><dt>Page</dt><dd class="ro">' + esc(pageL(c.context).replace(/^On /, '')) + '</dd></div>' : '') + '</dl></section>' +
      '<section class="so-s"><h3>Chat</h3><dl class="props"><div class="pr"><dt>Started</dt><dd class="ro">' + BO.dur(Date.now() - c.startedAt) + ' ago</dd></div><div class="pr"><dt>Messages</dt><dd class="ro">' + c.messages.length + '</dd></div><div class="pr"><dt>Status</dt><dd class="ro"><span class="tg sm ' + STL[c.status][1] + '">' + STL[c.status][0] + '</span></dd></div>' + (c.person ? '<div class="pr"><dt>With</dt><dd class="ro">' + esc(c.person) + '</dd></div>' : '') + '</dl></section>';
  }
  function paint() {
    var l = $('#cxList'); if (!l) return; var ta = $('#cxIn'), had = ta && document.activeElement === ta, pos = ta ? ta.selectionStart : 0; if (ta && sel) draft[sel] = ta.value;
    l.innerHTML = list(); $('#cxThread').innerHTML = thread(); $('#cxSide').innerHTML = side(); var g = $('.cx-log'); if (g) g.scrollTop = g.scrollHeight;
    var n = $('#cxIn'); if (n && had) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} }
    $('#cxWrap').classList.toggle('has', !!sel); var sg = $('.cx-lh .sg'); if (sg) sg.outerHTML = segHtml(); BO.counts();
  }
  function later() { clearTimeout(tm); tm = setTimeout(function () { if (BO.route().name === 'chats') paint(); }, 120); }
  function sendText(t) { var c = sel && O().convos.get(sel); if (!c || !t.trim()) return; O().convos.append(c.id, { from: 'agent', name: ME, text: t.trim() }); try { O().events.log('agent_reply', { agent: c.agent, channel: c.channel, source: c.source, convo: c.id }); } catch (e) {} draft[c.id] = ''; var ta = $('#cxIn'); if (ta) ta.value = ''; paint(); var n = $('#cxIn'); if (n) n.focus(); }

  var V = {
    title: 'Conversations', skeleton: 'list',
    crumbs: function (r) { return r.id ? [['Conversations', '#/chats'], [r.id.indexOf('sthc-') === 0 || !window.Orbit ? 'Chat' : nameOf(O().convos.get(r.id) || {}), '']] : [['Conversations', '#/chats']]; },
    render: function (r, el) {
      if (!window.Orbit || !eng) { load().then(function () { if (BO.route().name === 'chats') BO.refresh(); }); return '<div class="vh-row"><h1>Conversations</h1><p class="meta">Connecting to the site assistant…</p></div><div class="cx sk-cx"><div class="cd">' + [60, 44, 52].map(function (w) { return '<div class="sk-row"><span class="sk" style="width:28px;height:28px;border-radius:50%"></span><span class="sk" style="width:' + w + '%"></span></div>'; }).join('') + '</div><div class="cd"></div></div>'; }
      var C = convos();
      if (!C.length && !agentOk) return '<div class="vh-row"><h1>Conversations</h1></div><section class="cd">' + BO.empty('The site assistant isn’t switched on yet', 'When it is, every chat on the public site lands here: the transcript, a take-over button and the lead it created in the pipeline.', '<a class="b" href="index.html" target="_blank" rel="noopener">' + ic('ext') + 'Open the public site</a>') + '</section>';
      if (r.id) sel = r.id; if (r.q.get('f')) filter = r.q.get('f');
      if (!sel && innerWidth > 900) { var w = C.filter(function (c) { return c.status === 'waiting'; })[0] || C[0]; sel = w ? w.id : null; }
      if (sel && !O().convos.get(sel)) sel = null;
      var n = counts();
      return '<div class="vh-row"><h1>Conversations</h1><p class="meta">The site assistant answers first; anything it hands over waits here with the whole chat' + (agentOk ? '' : ' · <span class="red">assistant offline, history only</span>') + '</p><span class="grow"></span><a class="b" href="index.html" target="_blank" rel="noopener">' + ic('ext') + 'Open site chat</a><button type="button" class="b pri" data-act="next"' + (n.waiting ? '' : ' disabled title="Nobody is waiting"') + '>' + ic('chat') + 'Next waiting' + (n.waiting ? ' · ' + n.waiting : '') + '<kbd>N</kbd></button></div>' +
        '<div class="cx' + (sel ? ' has' : '') + '" id="cxWrap"><aside class="cx-l" aria-label="Conversation list"><div class="cx-lh">' + segHtml() + '<div class="srch">' + ic('search') + '<label class="sr" for="cxQ">Search chats</label><input class="in sm" id="cxQ" type="search" placeholder="Search names and messages" data-in="q" value="' + esc(q) + '"></div></div><div class="cx-list" id="cxList"></div></aside>' +
        '<section class="cx-t" id="cxThread" aria-label="Conversation"></section><aside class="cx-s" id="cxSide" aria-label="Lead and visitor"></aside></div>';
    },
    mount: function () { if (!window.Orbit || !$('#cxList')) return; paint(); if (!off) { var a = O().convos.on(later), b = O().leads.on(function () { var x = BO.sync(); if (x.length) later(); }); off = function () { a(); b(); }; } },
    leave: function () { if (off) { off(); off = null; } },
    keys: {
      n: function (e) { e.preventDefault(); e.stopPropagation(); act.next(); },
      t: function () { var c = sel && O().convos.get(sel); if (c && (c.status === 'waiting' || c.status === 'bot')) act.take(); },
      e: function () { var c = sel && O().convos.get(sel); if (c && c.status === 'human') act.resolve(); },
      r: function (e) { var t = $('#cxIn'); if (t) { e.preventDefault(); t.focus(); } },
      j: function () { step(1); }, k: function () { step(-1); }
    },
    acts: null
  };
  BO.view('chats', V);
  function step(d) { var L = $$('.cx-it'), i = L.findIndex(function (b) { return b.getAttribute('data-id') === sel; }), nx = L[Math.max(0, Math.min(L.length - 1, i + d))]; if (nx) BO.go('chats/' + nx.getAttribute('data-id')); }
  var act = {
    open: function (b) { BO.go('chats/' + b.getAttribute('data-id')); },
    close: function () { sel = null; BO.go('chats'); },
    filter: function (b) { filter = b.getAttribute('data-v'); paint(); },
    q: function (i) { q = i.value; $('#cxList').innerHTML = list(); },
    next: function () { var w = convos().filter(function (c) { return c.status === 'waiting' && c.id !== sel; })[0]; if (w) BO.go('chats/' + w.id); else BO.toast('Nobody else is waiting. The assistant has it.', { icon: 'chat' }); },
    take: function () { var c = O().convos.get(sel); if (!c) return; var was = c.status; O().convos.setStatus(c.id, 'human', { person: MEN }); O().convos.append(c.id, { from: 'system', kind: 'system', text: 'Connected to ' + MEN }); var l = leadOf(c); if (l) { BO.log(l.id, 'Took over the chat', 'call'); BO.save(); } paint(); BO.toast('You’re in the chat with ' + esc(nameOf(c).split(' ')[0]) + '. They’ve been told.', { icon: 'chat', undo: function () { O().convos.setStatus(c.id, was, { person: null }); paint(); } }); setTimeout(function () { var t = $('#cxIn'); if (t) t.focus(); }, 40); },
    back: function () { var c = O().convos.get(sel); if (!c) return; O().convos.setStatus(c.id, 'bot', { person: null }); O().convos.append(c.id, { from: 'system', kind: 'system', text: 'You’re back with the Sthira site desk. Anything else I can help with?' }); paint(); BO.toast('Handed back to the assistant.', { icon: 'hand', undo: function () { O().convos.setStatus(c.id, 'human', { person: MEN }); paint(); } }); },
    resolve: function () { var c = O().convos.get(sel); if (!c) return; var prev = c.status; O().convos.setStatus(c.id, 'resolved'); O().convos.append(c.id, { from: 'system', kind: 'system', text: 'Conversation resolved by ' + ME }); try { O().events.log('resolved', { agent: c.agent, channel: c.channel, source: c.source, convo: c.id, by: 'person' }); } catch (e) {} var nx = convos().filter(function (x) { return x.status === 'waiting'; })[0]; paint(); BO.toast('Resolved.' + (nx ? ' Next: ' + esc(nameOf(nx)) + '.' : ' Nobody else is waiting.'), { undo: function () { O().convos.setStatus(c.id, prev); paint(); }, action: nx ? ['Open next', function () { BO.go('chats/' + nx.id); }] : null }); },
    reopen: function () { var c = O().convos.get(sel); if (!c) return; O().convos.setStatus(c.id, 'human', { person: MEN }); paint(); },
    send: function () { var t = $('#cxIn'); if (t) sendText(t.value); },
    key: function (t, e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(t.value); } else if (e.key === 'Escape') t.blur(); },
    mac: function (b) { var c = O().convos.get(sel), t = macros(c)[+b.getAttribute('data-i')], ta = $('#cxIn'); if (ta) { ta.value = t; draft[sel] = t; ta.focus(); } },
    lead: function (b) { BO.openLead(b.getAttribute('data-id')); },
    mkLead: function () { var c = O().convos.get(sel); if (!c) return; var l = { id: BO.nextId(), name: nameOf(c), email: (c.user && c.user.email) || '', city: 'Bengaluru', type: 'Residential', source: 'Chat', convo: c.id, owner: ME, stage: 'enquiry', at: BO.stamp(), next: 'Call back: lead from the site assistant', due: new Date(BO.NOW.getTime() + 3 * 3600e3).toISOString(), note: (lastUser(c) ? '“' + plain(lastUser(c).text) + '”' : ''), loc: '', area: null, floors: '', budget: '' }; BO.crm.leads.unshift(l); BO.log(l.id, 'Created from a chat transcript', 'in'); BO.save(); paint(); BO.toast('Lead <b>' + l.id + '</b> created and linked to this chat.', { undo: function () { BO.crm.leads = BO.crm.leads.filter(function (x) { return x.id !== l.id; }); BO.save(); paint(); } }); },
    more: function (b) { var c = O().convos.get(sel); if (!c) return; BO.menu(b, [{ label: 'Copy transcript', icon: 'copy', run: function () { var txt = c.messages.map(function (m) { return (m.from === 'user' ? nameOf(c) : m.from === 'agent' ? (m.name || ME) : 'Site desk') + ': ' + plain(m.text); }).join('\n'); try { navigator.clipboard.writeText(txt).then(function () { BO.toast('Transcript copied.'); }, function () { BO.toast('Copy isn’t allowed here.', { bad: true }); }); } catch (e) { BO.toast('Copy isn’t allowed here.', { bad: true }); } } }], { right: true }); }
  };
  V.acts = act;
})();
