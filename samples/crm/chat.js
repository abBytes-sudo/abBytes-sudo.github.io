/* Lumen CRM Pro — the website assistant inside the CRM. Loads the shared Orbit engine (samples/assets/bots, never edited)
   and Lumen's own agent (agents/lumen.js) on demand, seeds a few real transcripts by running the agent headless, then:
   · mirrors every Lumen chat (web, WhatsApp, Instagram) into Conversations, with take over / hand back / resolve
   · turns Orbit leads (agent "lumen") into CRM leads with a link to the transcript, and offers "Create deal"
   · shows the agent's scripted flows as a read-only tree on the Chatbot page. */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, P = function () { return C.P(); }, S = function () { return C.S(); };
  var M = 6e4;
  C.IC.ig = '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><path d="M16.6 7.4h.01"/>';

  // ---- loader ---------------------------------------------------------------------------------------------------------
  var q = [], loading = false;
  C.orbit = function (cb) {
    if (window.Orbit && window.Orbit.agents && window.Orbit.agents.lumen) { if (cb) cb(window.Orbit); return; }
    if (cb) q.push(cb); if (loading) return; loading = true;
    ['../assets/bots/engine.js', '../assets/bots/agents/lumen.js'].forEach(function (src, i, a) {
      var s = document.createElement('script'); s.src = src; s.async = false;
      if (i === a.length - 1) s.onload = function () { seed(); var L = q; q = []; L.forEach(function (f) { try { f(window.Orbit); } catch (e) { if (window.console) console.error(e); } }); };
      document.head.appendChild(s);
    });
  };

  // ---- seed real transcripts by running the agent (once per browser) -------------------------------------------------
  var SEEDS = [
    ['web', 'Google search', 34, 'bot', null, ['3 bhk full home', 'signature', 'book a site visit', 'Gurugram', null, '11 am', 'Ananya Sharma', 'ananya.s@example.com']],
    ['instagram', 'Instagram ad', 12, 'waiting', 'Asked for a designer', ['kitchen 18 ft kitna lagega', 'luxe', 'can someone call me about quartz options']],
    ['whatsapp', 'WhatsApp', 95, 'agent', 'Isha Bedi', ['where is my project LH-3184', 'Kapoor', 'can we move installation to saturday']],
    ['web', 'Website chat', 240, 'resolved', null, ['do you give warranty', 'what material do you use for kitchen', 'thanks']],
    ['instagram', 'Instagram DM', 61, 'bot', null, ['show me 3 bhk homes', 'price something like this']],
    ['web', 'Meta ad', 7, 'bot', null, ['wardrobe for 2 bedrooms', '80', 'essential']]
  ];
  function seed() {
    var O = window.Orbit; if (!O || !O.createSession) return;
    try { if (localStorage.getItem('lumen-orbit-seed') === '3') return; } catch (e) { }
    var now = Date.now(), made = [];
    SEEDS.forEach(function (sd, k) {
      var s = O.createSession('lumen', { channel: sd[0], source: sd[1] }); s.start();
      sd[5].forEach(function (t) { if (t == null) { var b = (s.convo.messages.filter(function (m) { return m.from === 'bot' && m.buttons && m.buttons.length; }).pop() || {}).buttons; if (b) s.choose(b.filter(function (x) { return !/taken/.test(x.label); })[0]); } else s.send(t); });
      var c = O.convos.get(s.id); if (!c) return;
      var NM = ['Ananya Sharma', 'Rohit Malhotra', 'Neha Kapoor', 'Kavita Iyer', 'Sameer Khanna', 'Tanya Gill'];
      if (!c.user.name) c.user.name = NM[k];
      var start = now - sd[2] * M - c.messages.length * 40e3;
      c.messages.forEach(function (m, i) { m.ts = start + i * 40e3; });
      c.startedAt = start; c.seed = true; c.engaged = true;
      if (sd[3] === 'waiting') { c.status = 'waiting'; c.handedOver = true; c.handoverReason = sd[4]; c.handoverAt = start + c.messages.length * 40e3; }
      else if (sd[3] === 'agent') { c.status = 'agent'; c.agentName = sd[4]; c.messages.push({ id: 'ma' + k, from: 'agent', by: sd[4], text: 'Hi Neha, Isha here. Saturday works: the team can come at 10 am. I’ve moved it and the site lead will confirm on Friday.', ts: start + c.messages.length * 40e3 + 6e4 }); }
      else if (sd[3] === 'resolved') c.status = 'resolved';
      O.convos.put(c); c.updatedAt = (c.messages[c.messages.length - 1] || {}).ts || start; O.convos.put(c);
      var cc = O.convos.get(s.id); if (cc) { cc.updatedAt = (cc.messages[cc.messages.length - 1] || {}).ts || start; }
      made.push(s.id);
    });
    // back-date the leads those chats created
    try { var L = JSON.parse(localStorage.getItem('orbit-leads') || '[]'); L.forEach(function (l) { if (l.agent === 'lumen' && l.payload && made.indexOf(l.payload.convo) > -1) { var c = O.convos.get(l.payload.convo); if (c) { l.timestamp = new Date(c.updatedAt).toISOString(); if (!l.name || l.name === 'Website visitor') l.name = c.user.name; } } }); localStorage.setItem('orbit-leads', JSON.stringify(L)); localStorage.setItem('lumen-orbit-seed', '3'); } catch (e) { }
  }

  // ---- mirror Orbit chats into Conversations ----------------------------------------------------------------------------
  var CH = { web: 'web', whatsapp: 'wa', instagram: 'ig' };
  function meta(id) { var p = P(); p.cvMeta = p.cvMeta || {}; return p.cvMeta[id] || (p.cvMeta[id] = { owner: null, read: false }); }
  function isLumen() { return !C.WS || C.WS.tpl === 'services'; }
  C.orbitSync = function () {
    if (!isLumen()) return;
    var O = window.Orbit; if (!O || !O.convos) { C.orbit(function () { if (C.cur && /^(conversations|bot|inbox)$/.test(C.cur.name)) C.rerender(); }); return; }
    var p = P(); p.convos = p.convos || [];
    O.convos.list().filter(function (c) { return c.agent === 'lumen' && (c.engaged || c.seed) && c.messages.length > 1; }).forEach(function (c) {
      var id = 'OC-' + String(c.id).replace(/[^a-z0-9]/gi, '').slice(-8), t = p.convos.filter(function (x) { return x.id === id; })[0], m = meta(c.id);
      var who = c.user && c.user.name ? c.user.name : ({ web: 'Website visitor', whatsapp: 'WhatsApp visitor', instagram: 'Instagram visitor' }[c.channel] || 'Visitor');
      var msgs = c.messages.map(function (x) { return { id: x.id, t: x.ts, from: x.from === 'user' ? 'in' : x.from === 'agent' ? 'out' : x.from === 'bot' ? 'bot' : 'note', by: x.by || c.agentName || '', text: x.text || (x.cards && x.cards[0] ? x.cards[0].title : ''), cards: x.cards, buttons: x.buttons, read: true }; }).filter(function (x) { return x.text; });
      if (!t) { t = { id: id, orbit: c.id, ch: CH[c.channel] || 'web', created: c.startedAt }; p.convos.push(t); }
      t.ch = CH[c.channel] || 'web'; t.who = { name: who, phone: c.user && c.user.phone || '', email: c.user && c.user.email || '' }; t.subj = c.source || ''; t.msgs = msgs; t.updated = c.updatedAt || c.startedAt;
      t.bot = c.status; t.status = c.status === 'resolved' ? 'closed' : 'open'; t.owner = m.owner || (c.status === 'agent' ? c.agentName : null) || null; t.unread = !m.read && c.status === 'waiting';
      t.firstResp = c.status === 'waiting' ? null : 1; t.reason = c.handoverReason; t.waitAt = c.handoverAt;
      var lid = (p.orbitLeads || {})[leadKeyOf(c.id)]; t.lead = lid || null;
    });
    importLeads();
  };
  function leadKeyOf(cid) { var O = window.Orbit, l = O && O.leads.list({ agent: 'lumen' }).filter(function (x) { return x.payload && x.payload.convo === cid; }).pop(); return l ? l.id + '|' + l.timestamp : null; }
  var SVC = { kitchen: 'Modular kitchen', wardrobe: 'Wardrobes & storage', home: 'Full home interiors', bath: 'Bathroom remodel', paint: 'Painting & polish' };
  function importLeads() {
    var O = window.Orbit, p = P(); if (!O) return; p.orbitLeads = p.orbitLeads || {};
    O.leads.list({ agent: 'lumen' }).forEach(function (ol) {
      var key = ol.id + '|' + ol.timestamp; if (p.orbitLeads[key] || ol.intent === 'project_status') return;
      var pay = ol.payload || {};
      p.orbitByConvo = p.orbitByConvo || {}; var prev = pay.convo && p.orbitByConvo[pay.convo] && C.lead(p.orbitByConvo[pay.convo]);
      if (prev) { C.log(prev, 'visit', (ol.intent === 'site_visit' ? 'Booked a site visit in chat: ' + (pay.date || '') + ' ' + (pay.time || '') + ' · ' + (pay.area || '') + ' · ' + (pay.ref || '') : 'Asked the assistant again: ' + ol.intent)); if (ol.intent === 'site_visit' && prev.status === 'new') { C.setStatus(prev, 'contacted'); } if (ol.phone && (!prev.phone || prev.phone === '—')) prev.phone = ol.phone; p.orbitLeads[key] = prev.id; return; }
      var svc = pay.scope ? (Object.keys(SVC).filter(function (k) { return SVC[k].toLowerCase().indexOf(String(pay.scope).toLowerCase().split(' ')[0]) === 0; }).map(function (k) { return SVC[k]; })[0] || pay.scope) : 'Full home interiors';
      if (C.SERVICES && C.SERVICES.indexOf(svc) < 0) svc = C.SERVICES.filter(function (s) { return s.toLowerCase().indexOf(String(pay.scope || '').toLowerCase().split(' ')[0]) > -1; })[0] || C.SERVICES[0];
      var l = C.newLead({ name: ol.name || 'Website visitor', phone: ol.phone || '—', email: ol.email || '', source: 'chatbot', service: svc, loc: pay.area || 'Delhi NCR', budget: pay.high_lakh || 5, req: ({ estimate: 'Asked the website assistant for a price: ', site_visit: 'Booked a site visit with the website assistant: ' }[ol.intent] || 'From the website assistant: ') + Object.keys(pay).filter(function (k) { return k !== 'convo' && k !== 'page' && pay[k] !== ''; }).map(function (k) { return k.replace(/_/g, ' ') + ' ' + pay[k]; }).join(', '), utm: { source: 'website', medium: 'chatbot', campaign: '' }, extra: 'from chat (' + (ol.source || ol.channel) + ')', silentCapi: false });
      if (!l) return;
      if (ol.timestamp) { l.created = Date.parse(ol.timestamp); l.tl.forEach(function (e) { e.t = l.created; }); }
      l.chat = pay.convo; C.log(l, 'note', 'Transcript in Conversations: #/conversations/OC-' + String(pay.convo).replace(/[^a-z0-9]/gi, '').slice(-8));
      p.orbitLeads[key] = l.id; if (pay.convo) p.orbitByConvo[pay.convo] = l.id;
    });
    C.save();
  }

  // ---- thread bar: who is talking, take over / hand back / resolve, lead and deal ---------------------------------------
  var STATE = { bot: ['The assistant is handling this chat', 'bot'], waiting: ['Asked for a person', 'warn'], agent: ['A teammate is in this chat', 'ok'], resolved: ['Resolved', 'muted'] };
  C.cvBotBar = function (t) {
    if (!t.orbit) return '';
    var st = STATE[t.bot] || STATE.bot, ld = t.lead && C.lead(t.lead), mins = t.waitAt ? Math.max(1, Math.round((Date.now() - t.waitAt) / M)) : 0;
    var main = t.bot === 'agent' ? '<button type="button" class="btn sm" data-act="oc-back">' + C.ic('bot', 13) + 'Hand back to the assistant</button><button type="button" class="btn sm ghost" data-act="oc-resolve">' + C.ic('check', 13) + 'Resolve</button>'
      : t.bot === 'resolved' ? '<button type="button" class="btn sm" data-act="oc-take">Reopen and reply</button>'
      : '<button type="button" class="btn sm ' + (t.bot === 'waiting' ? 'pri' : '') + '" data-act="oc-take">' + C.ic('user', 13) + 'Take over</button>';
    return '<div class="oc-bar ' + st[1] + '" role="status"><span class="oc-ic">' + C.ic(t.bot === 'agent' ? 'user' : t.bot === 'waiting' ? 'clock' : 'bot', 14) + '</span><span class="oc-t"><b>' + st[0] + '</b><small>' + (t.bot === 'waiting' ? esc(t.reason || 'Visitor asked for a person') + ' · waiting ' + mins + ' min' : t.bot === 'agent' ? (t.owner ? esc(t.owner) + ' is replying · the assistant is paused' : 'The assistant is paused') : t.bot === 'bot' ? 'Scripted replies · it hands over when asked or stuck' : 'No reply needed') + '</small></span><span class="oc-a">' + main +
      (ld ? '<a class="btn sm ghost" href="#/inbox/' + ld.id + '">' + C.ic('inbox', 13) + 'Lead ' + ld.id + '</a><button type="button" class="btn sm" data-act="convert" data-id="' + ld.id + '">' + C.ic('deal', 13) + 'Create deal</button>' : '<button type="button" class="btn sm" data-act="oc-lead">' + C.ic('plus', 13) + 'Create lead</button>') + '</span></div>';
  };
  function curT() { var a = C.cur && C.cur.arg; return a && (P().convos || []).filter(function (x) { return x.id === a; })[0]; }
  function done(msg, ic) { C.save(); C.badges(); C.rerender(); if (msg) C.toast(msg, { icon: ic || 'check' }); }
  C.acts['oc-take'] = function () { var t = curT(), O = window.Orbit; if (!t || !O) return; var me = C.me().name; O.convos.setStatus(t.orbit, 'agent', { agentName: me }); O.convos.append(t.orbit, { from: 'system', text: me + ' joined the chat' }); meta(t.orbit).owner = me; meta(t.orbit).read = true; C.audit('assign', { t: 'convo', id: t.id, name: t.who.name }, 'Chat', 'assistant', me); done('You’re in the chat · the assistant is paused', 'user'); var x = $('#cv-txt'); if (x) x.focus(); };
  C.acts['oc-back'] = function () { var t = curT(), O = window.Orbit; if (!t || !O) return; O.convos.setStatus(t.orbit, 'bot'); O.convos.append(t.orbit, { from: 'bot', text: 'I’m back. Anything else I can help with? I can price your home, book a visit or look up a project.', buttons: [{ label: 'What will it cost?', value: 'flow:estimate' }, { label: 'Book a free site visit', value: 'flow:visit' }] }); C.audit('assign', { t: 'convo', id: t.id, name: t.who.name }, 'Chat', C.me().name, 'assistant'); done('Handed back to the assistant', 'bot'); };
  C.acts['oc-resolve'] = function () { var t = curT(), O = window.Orbit; if (!t || !O) return; O.convos.setStatus(t.orbit, 'resolved'); O.events && O.events.log('resolved', { agent: 'lumen', convo: t.orbit }); done('Chat resolved'); };
  C.acts['oc-lead'] = function () {
    var t = curT(); if (!t) return; var txt = t.msgs.filter(function (m) { return m.from === 'in'; }).map(function (m) { return m.text; }).join(' · ');
    var l = C.newLead({ name: t.who.name, phone: t.who.phone || '—', email: t.who.email || '', source: 'chatbot', service: (C.SERVICES || ['Full home interiors'])[0], loc: 'Delhi NCR', budget: 5, req: 'From ' + ({ web: 'website chat', wa: 'WhatsApp', ig: 'Instagram' }[t.ch]) + ': ' + txt.slice(0, 200), utm: { source: t.ch === 'ig' ? 'instagram' : 'website', medium: 'chatbot', campaign: '' }, extra: 'from chat' });
    C.log(l, 'note', 'Transcript in Conversations: #/conversations/' + t.id); P().orbitLeads = P().orbitLeads || {}; P().orbitLeads['manual|' + t.orbit] = l.id; t.lead = l.id;
    done('Lead ' + l.id + ' created from the chat', 'inbox');
  };
  C.cvOrbitSend = function (t, txt, mode) {
    var O = window.Orbit; if (!O) return false; if (mode === 'note') return false;
    if (t.bot !== 'agent') { O.convos.setStatus(t.orbit, 'agent', { agentName: C.me().name }); meta(t.orbit).owner = C.me().name; }
    O.convos.append(t.orbit, { from: 'agent', by: C.me().name, text: txt }); O.events && O.events.log('agent_reply', { agent: 'lumen', convo: t.orbit });
    var f = $('form[data-form="cv-send"]'); if (f) f.reset(); done(); return true;
  };
  var NEXT = ['Is the 3D design free?', 'Can you come on Saturday instead?', 'What about EMI?', 'ok thanks'];
  C.cvOrbitSim = function (t) {
    var O = window.Orbit; if (!O) return; var c = O.convos.get(t.orbit), txt = NEXT[(c.messages.length) % NEXT.length];
    if (c.status === 'bot') { var s = O.createSession('lumen', { convoId: t.orbit, channel: c.channel, source: c.source }); s.send(txt); }
    else O.convos.append(t.orbit, { from: 'user', text: txt });
    done();
  };
  try { window.addEventListener('storage', function (e) { if (/^orbit-(convos|leads)$/.test(e.key) && C.cur && /^(conversations|inbox|bot)$/.test(C.cur.name)) { if (window.Orbit) window.Orbit.convos.reload(); C.rerender(); } }); } catch (e) { }
  C.onRoute = (function (prev) { return function (n, a) { if (prev) prev(n, a); if (isLumen() && (/^(conversations|bot)$/.test(n) || (n === 'inbox' && window.Orbit))) C.orbit(function () { var before = (S().leads || []).length; C.orbitSync(); if (S().leads.length !== before || n === 'conversations' || n === 'bot') C.rerender(); }); }; })(C.onRoute);

  // chats from the website keep arriving: pick them up once the browser is idle, well after the first paint
  setTimeout(function () { if (!isLumen()) return; (window.requestIdleCallback || function (f) { setTimeout(f, 300); })(function () { C.orbit(function () { var n = S().leads.length; C.orbitSync(); if (S().leads.length !== n && C.cur && /^(inbox|dashboard|pipeline)$/.test(C.cur.name)) C.rerender(); }); }, { timeout: 4000 }); }, 12000);

  // ---- the agent as a read-only tree ------------------------------------------------------------------------------------
  C.orbitTree = function () {
    if (!isLumen()) return '<section class="card"><div class="card-h"><div><h2>The website assistant lives in the Services workspace</h2><p class="sub">Lumen Homes’ own assistant answers its website, WhatsApp and Instagram. This workspace has no assistant connected yet.</p></div><button type="button" class="btn" data-act="ws-go" data-id="">Open Lumen Homes</button></div></section>';
    var O = window.Orbit, a = O && O.agents && O.agents.lumen;
    if (!a) return '<div class="sk-page" aria-busy="true"><div class="sk sk-h"></div><div class="sk sk-b"></div></div>';
    var conv = O.convos.list().filter(function (c) { return c.agent === 'lumen'; }), leads = O.leads.list({ agent: 'lumen' }), hand = conv.filter(function (c) { return c.handedOver; }).length;
    var lab = function (v) { var m = String(v).match(/^(flow|intent|act|slot):(.*)$/); return m ? m[1] + ' → ' + m[2] : v; };
    var flowNode = function (id, f) { return '<li class="ot-n ot-flow"><div class="ot-c"><span class="ot-k">Flow</span><b>' + esc(id) + '</b><small>' + f.slots.length + ' questions, then a result card and a lead</small></div><ul>' + f.slots.map(function (s) { return '<li class="ot-n ot-slot"><div class="ot-c"><span class="ot-k">Ask</span><b>' + esc(s.name) + '</b>' + (s.hint ? '<small>' + esc(s.hint) + '</small>' : '') + (s.when ? '<small class="ot-if">only when needed</small>' : '') + '</div></li>'; }).join('') + '<li class="ot-n ot-done"><div class="ot-c"><span class="ot-k">Done</span><b>Result card · lead to the CRM</b></div></li></ul></li>'; };
    return '<div class="ot-g"><section class="card ot"><div class="card-h"><div><h2>' + esc(a.name) + ' · ' + esc(a.role) + '</h2><p class="sub">The scripted website assistant, as a tree · read-only · runs on lumenhomes.example, WhatsApp and Instagram</p></div><a class="btn sm" href="product.html#assistant">' + C.ic('ext', 13) + 'Open it on the site</a></div>' +
      '<ul class="otree"><li class="ot-n ot-root"><div class="ot-c"><span class="ot-k">Greeting</span><b>' + esc(a.helloLine || '') + '</b><small>Changes with the page and channel</small></div><ul>' +
      (a.menu || []).map(function (b) { var v = b.value, m = v.match(/^flow:(.*)$/), it = v.match(/^intent:(.*)$/); return '<li class="ot-n ot-menu"><div class="ot-c"><span class="ot-k">Button</span><b>' + esc(b.label) + '</b><small class="mono">' + esc(lab(v)) + '</small></div>' + (m && a.flows[m[1]] ? '<ul>' + flowNode(m[1], a.flows[m[1]]) + '</ul>' : it ? '<ul><li class="ot-n ot-intent"><div class="ot-c"><span class="ot-k">Reply</span><b>Cards from the portfolio</b></div></li></ul>' : v === 'handover' ? '<ul><li class="ot-n ot-hand"><div class="ot-c"><span class="ot-k">Hand over</span><b>Lands in Conversations as “Asked for a person”</b></div></li></ul>' : '') + '</li>'; }).join('') + '</ul></li></ul></section>' +
      '<aside class="ot-side"><section class="card"><div class="card-h"><div><h2>Understands</h2><p class="sub">Typed phrases, matched by keywords and patterns</p></div></div><ul class="ot-int">' + a.intents.map(function (i) { return '<li><b>' + esc(i.label) + '</b><small>' + esc((i.kw || []).slice(0, 5).join(' · ')) + '</small></li>'; }).join('') + '</ul><p class="sm muted">Plus Hinglish: “kitna lagega”, “kal shaam”, “ghar aao”.</p></section>' +
      '<section class="card"><div class="card-h"><div><h2>Knowledge base</h2><p class="sub">' + O.kb.list('lumen').length + ' answers</p></div></div><ul class="ot-kb">' + O.kb.list('lumen').slice(0, 8).map(function (k) { return '<li>' + esc(k.q) + '</li>'; }).join('') + '</ul></section>' +
      '<section class="card"><div class="card-h"><div><h2>Results</h2></div></div><dl class="ot-st"><div><dt>Chats</dt><dd>' + conv.length + '</dd></div><div><dt>Leads created</dt><dd>' + leads.length + '</dd></div><div><dt>Handed to a person</dt><dd>' + hand + '</dd></div></dl><a class="btn sm" href="#/conversations">Open Conversations</a></section></aside></div>';
  };
  C.orbitTreeMount = function () { if (!window.Orbit || !window.Orbit.agents.lumen) C.orbit(function () { if (C.cur.name === 'bot') C.rerender(); }); };
})();
