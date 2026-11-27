/* Orbit Assistants page: the live assistants (business picker, channels, notes on how it thinks, the team side), the
   console, the FAQ editor, analytics and the section modules. The engine and the assistants (about 550 KB) load only
   when the visitor gets near them or tells the page what they run, so the first screen stays light. */
(function () {
  'use strict';
  var Br = window.OrbitBrands, U = window.OrbitUI, TR = window.OrbitTrades, root = document.documentElement, G = window.gsap, ST = window.ScrollTrigger;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animated = root.classList.contains('motion-on') && !!G && !!ST && !reduce;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  if (!Br || !U) return;

  /* ---------- the engine, on demand ---------- */
  var ENGINE = ['../assets/bots/engine.js?v=22', '../assets/bots/agents/support.js?v=24', '../assets/bots/agents/realty.js?v=24', '../assets/bots/agents/build.js?v=24', '../assets/bots/agents/clinic.js?v=24', '../assets/bots/agents/salon.js?v=24', '../assets/bots/agents/dining.js?v=24', '../assets/bots/agents/crm.js?v=24', '../assets/bots/ui.js?v=22', '../assets/bots/crm-ui.js?v=22', 'front-agent.js?v=1'];
  var engineP = null, O = null;
  window.OrbitEngine = { load: function () {
    if (!engineP) engineP = U.load(ENGINE).then(function () { O = window.Orbit; onEngine(); try { document.dispatchEvent(new CustomEvent('orbit:engine')); } catch (e) {} }, function (e) { if (window.console) console.error(e); });
    return engineP;
  } };
  function soon() { window.OrbitEngine.load(); }
  if ('IntersectionObserver' in window) {
    var near = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { near.disconnect(); soon(); } }, { rootMargin: '320px 0px' });
    ['#try', '#read', '#console', '#analytics', '#faqedit'].forEach(function (s) { var el = $(s); if (el) near.observe(el); });
  } else soon();
  var ti = $('#tellIn'); if (ti) ti.addEventListener('focus', soon, { once: true });
  document.addEventListener('orbit:trade', soon);

  /* ---------- the live assistants ---------- */
  var CHN = { web: 'Web chat', whatsapp: 'WhatsApp', instagram: 'Instagram', crm: 'Team side' };
  var DEFAULT_CH = { realty: 'whatsapp', support: 'web', build: 'instagram', clinic: 'whatsapp', salon: 'instagram', dining: 'web', front: 'whatsapp' };
  var SRC_BY_CH = { web: 'Google search', whatsapp: 'WhatsApp click-to-chat', instagram: 'Instagram ad', crm: 'Website chat' };
  var ROLE = { realty: 'Homes to rent and buy', support: 'Online store', build: 'Quotes and site visits', clinic: 'Clinic bookings', salon: 'Salon bookings', dining: 'Table bookings', front: 'Front desk' };
  function brandVars(b) { return '--bc:' + b.acc + ';--bi:' + b.ink + ';--bd:' + b.deep + ';--bt:' + b.tx + ';--bs:' + b.soft; }
  var S = { agent: 'realty', ch: 'whatsapp', ctx: 0, src: null, chat: null, front: null };
  var told = window.OrbitTell && OrbitTell.current();
  try { var sv = JSON.parse(localStorage.getItem('orbit-demo-pick') || 'null'); if (sv && Br.byId[sv.agent]) { S.agent = sv.agent; S.ch = CHN[sv.ch] ? sv.ch : (DEFAULT_CH[S.agent] || 'web'); } } catch (e) {}
  if (told) fromTrade(told, true);
  function remember() { try { localStorage.setItem('orbit-demo-pick', JSON.stringify({ agent: S.agent === 'front' ? 'realty' : S.agent, ch: S.ch })); } catch (e) {} }
  function fromTrade(c, quiet) {
    var t = TR && TR.byId[c.id]; if (!t) return;
    if (c.generic) { S.front = { title: c.title || 'Your business', noun: c.noun }; S.agent = 'front'; }
    else { S.front = null; S.agent = t.agent; }
    if (S.ch !== 'crm' || S.agent === 'front') S.ch = t.ch || DEFAULT_CH[S.agent] || 'web';
    S.ctx = 0; S.src = null; S.questions = t.questions;
    if (!quiet && O) { renderPick(); syncTabs(); mountDemo(); }
  }
  document.addEventListener('orbit:trade', function (e) { fromTrade(e.detail, false); if (!O) renderPick(); });

  var devEl = $('#demoDev'), grid = $('#demoGrid'), nowTimer = null;
  function pickList() {
    var ids = Br.order.slice();
    if (S.front) ids.unshift('front');
    return ids;
  }
  function brandOf(id) {
    if (id === 'front') return { name: S.front ? S.front.title : 'Your business', mark: 'YOU', acc: '#47E3A5', ink: '#04221A', deep: '#082A20', tx: '#08724C', soft: '#DDFBEF' };
    return Br.byId[id];
  }
  function renderPick() {
    var el = $('#agentPick'); if (!el) return;
    el.innerHTML = pickList().map(function (id) { var b = brandOf(id); return '<button type="button" class="bz" data-a="' + id + '" style="' + brandVars(b) + '" aria-pressed="' + (id === S.agent) + '"><span class="bi" aria-hidden="true">' + esc(b.mark) + '</span><span><b>' + esc(b.name) + '</b><small>' + esc(ROLE[id] || '') + '</small></span><span class="chk" aria-hidden="true"><svg width="13" height="13"><use href="#i-check"/></svg></span></button>'; }).join('');
    $$('.bz', el).forEach(function (b) { b.addEventListener('click', function () { setAgent(b.getAttribute('data-a')); }); });
  }
  function setAgent(id) {
    if (O && !O.agents[id]) return; S.agent = id; S.ctx = 0; S.src = null; S.questions = null; if (S.ch !== 'crm' || id === 'front') S.ch = DEFAULT_CH[id] || 'web';
    if (Br.byId[id]) Br.set(id);
    $$('.bz').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-a') === id)); }); syncTabs(); mountDemo(); remember();
  }
  function syncTabs() {
    var seg = $('#chTabs'), act = null; $$('#chTabs button').forEach(function (b) { var on = b.getAttribute('data-ch') === S.ch; b.setAttribute('aria-pressed', String(on)); b.disabled = b.getAttribute('data-ch') === 'crm' && S.agent === 'front'; if (on) act = b; });
    if (act && seg) { seg.style.setProperty('--x', act.offsetLeft + 'px'); seg.style.setProperty('--w', act.offsetWidth + 'px'); }
  }
  $$('#chTabs button').forEach(function (b) { b.addEventListener('click', function () { S.ch = b.getAttribute('data-ch'); syncTabs(); mountDemo(); remember(); }); });
  addEventListener('resize', syncTabs); if (window.ResizeObserver && $('#chTabs')) new ResizeObserver(syncTabs).observe($('#chTabs')); if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncTabs);
  var srcSel = $('#srcSel'); if (srcSel) srcSel.addEventListener('change', function () { S.src = this.value; mountDemo(); });
  function announce() {
    var n = $('#nowBar'), b = brandOf(S.agent); if (!n) return; n.innerHTML = S.ch === 'crm' ? 'Now on the <b>team side</b> of <b>' + esc(b.name) + '</b>' : 'Now chatting with <b>' + esc(b.name) + '</b> on <b>' + esc(CHN[S.ch]) + '</b>';
    n.classList.remove('flash'); void n.offsetWidth; n.classList.add('flash'); clearTimeout(nowTimer); nowTimer = setTimeout(function () { n.classList.remove('flash'); }, 2600);
  }

  /* notes on how it thinks */
  var annot = $('#annot'), how = $('#howToggle'), seen = {}, noteTimer = null, howOn = false;
  try { var hv = localStorage.getItem('orbit-how'); howOn = hv == null ? matchMedia('(min-width:1100px)').matches : hv === '1'; } catch (e) { howOn = matchMedia('(min-width:1100px)').matches; }
  if (reduce && how) { howOn = false; how.disabled = true; }
  if (how) { how.checked = howOn; how.addEventListener('change', function () { howOn = how.checked; try { localStorage.setItem('orbit-how', howOn ? '1' : '0'); } catch (e) {} if (!howOn) annot.innerHTML = ''; }); }
  function note(text) {
    if (!howOn || reduce || S.ch === 'crm' || !annot) return; clearTimeout(noteTimer); annot.innerHTML = '<div class="note"><span class="note-k">How it thinks</span><span>' + esc(text) + '</span></div>';
    noteTimer = setTimeout(function () { var n = $('.note', annot); if (n) n.classList.add('out'); }, 6500);
  }
  function onEvent(e) {
    if (!e || e.convo !== S.convoId) return; var k = e.type + ':' + (e.intent || e.action || e.kind || ''); if (seen[k] || e.type === 'convo_start' || e.type === 'engaged') return; seen[k] = 1;
    var src = S.src || SRC_BY_CH[S.ch];
    if (e.type === 'intent') note(e.parsed ? 'Understood: ' + e.parsed : 'Read the sentence as: ' + String(e.intent).replace(/_/g, ' '));
    else if (e.type === 'action') note('Acted on live data: ' + String(e.action || '').replace(/_/g, ' '));
    else if (e.type === 'lead') note('Lead saved, with the true source: ' + src);
    else if (e.type === 'booking') note('Booked: ' + (e.kind || 'slot') + ', reminder queued');
    else if (e.type === 'handover') note('Handed over, with the full chat attached');
    else if (e.type === 'kb') note('Answered from the FAQ your team edits');
    else if (e.type === 'fallback') note('No match: it offers the menu instead of guessing');
  }

  var offBts = null;
  function brandChat(r) { var b = brandOf(S.agent); if (!r || !b) return; $$('.ob-av', r).forEach(function (a) { a.textContent = b.mark; if (b.mark.length > 2) a.style.fontSize = '10px'; }); }
  function sendSample(q) {
    if (!S.chat || !S.chat.send) return;
    try { var s = S.chat.session; if (s && s.flow && s.convo.status === 'bot') s.endFlow(); } catch (e) {}
    S.chat.send(q); var i = $('input', devEl); if (i && matchMedia('(hover:hover)').matches) i.focus({ preventScroll: true });
  }
  function mountDemo() {
    if (!O || !devEl) return; var a = O.agents[S.agent]; if (!a) { S.agent = 'realty'; a = O.agents.realty; }
    if (S.chat) S.chat.destroy(); seen = {}; clearTimeout(noteTimer); if (annot) annot.innerHTML = '';
    if (S.agent === 'front' && S.ch === 'crm') S.ch = 'whatsapp';
    var crm = S.ch === 'crm', b = brandOf(S.agent);
    grid.classList.toggle('is-crm', crm); devEl.className = 'device' + (crm ? ' crm' : ''); if (annot) annot.classList.toggle('off', crm);
    if (S.agent === 'front' && O.agents.front) O.agents.front.business = S.front ? S.front.title : 'Your business';
    var ctxs = a.contexts || [{ label: 'Just browsing', context: {} }];
    var src = S.src || SRC_BY_CH[S.ch]; srcSel.value = [].slice.call(srcSel.options).some(function (o) { return o.value === src; }) ? src : srcSel.options[0].value; if (!S.src) src = srcSel.value;
    if (crm) { devEl.innerHTML = ''; S.chat = O.mountCrm(devEl, { biz: S.agent }); S.convoId = null; }
    else { S.chat = O.mount(devEl, { agent: S.agent, channel: S.ch, context: ctxs[S.ctx] ? ctxs[S.ctx].context : {}, source: src }); S.convoId = S.chat.session.id; brandChat(S.chat.root); U.patch(S.chat, b.name); }
    announce();
    $('#ctxs').innerHTML = ctxs.map(function (c, i) { return '<button type="button" class="cx" data-i="' + i + '" aria-pressed="' + (i === S.ctx) + '">' + esc(c.label) + '</button>'; }).join('');
    $$('.cx').forEach(function (x) { x.addEventListener('click', function () { S.ctx = +x.getAttribute('data-i'); mountDemo(); }); });
    var qs = crm ? (a.samples || []) : (S.questions || a.samples || []);
    $('#samples').innerHTML = qs.map(function (t) { return '<button type="button" class="chip">' + esc(t) + '</button>'; }).join('');
    $$('#samples .chip').forEach(function (x) { x.addEventListener('click', function () { if (crm) { S.ch = DEFAULT_CH[S.agent] || 'web'; syncTabs(); mountDemo(); } sendSample(x.textContent); }); });
    $('#chCap').textContent = crm ? 'The team side of ' + b.name + '. Book something in a customer channel first, then open this tab: the lead arrives at the top, marked new.' : S.ch === 'whatsapp' ? 'WhatsApp: ticks, timestamps and reply buttons. The same flows run on every channel.' : S.ch === 'instagram' ? 'Instagram DMs: the same conversation in Instagram’s clothes.' : 'Web chat in ' + b.name + '’s own colours, on any page of the website.';
    btsReset(); if (offBts) offBts(); offBts = O.events.on(function (e) { if (e && e.convo === S.convoId) { btsAdd(e); onEvent(e); } });
  }
  var LBL = { intent: 'intent', action: 'action', lead: 'lead', booking: 'booking', handover: 'handover', fallback: 'no match', kb: 'FAQ hit', engaged: 'engaged', convo_start: 'session', resolved: 'resolved', agent_reply: 'person' };
  function btsReset() { $('#bts').innerHTML = '<li class="mute">Intents, actions and leads show up here as you chat.</li>'; $('#btsLead').textContent = 'No lead yet'; }
  function btsAdd(e) {
    if (e.type === 'convo_start') return; var ul = $('#bts'); if (ul.firstChild && ul.firstChild.className === 'mute') ul.innerHTML = '';
    var dd = e.type === 'intent' ? e.intent : e.type === 'action' ? (e.action || '') : e.type === 'lead' ? e.lead : e.type === 'booking' ? e.kind : e.type === 'handover' ? e.reason : e.type === 'kb' ? e.id : '';
    var li = document.createElement('li'); li.innerHTML = '<b>' + esc(LBL[e.type] || e.type) + '</b><span>' + esc(dd || '') + '</span><time>' + new Date(e.ts).toTimeString().slice(0, 8) + '</time>'; ul.insertBefore(li, ul.firstChild); while (ul.children.length > 8) ul.removeChild(ul.lastChild);
    if (e.type === 'lead') { var l = O.leads.list().filter(function (x) { return x.id === e.lead; })[0]; if (l) $('#btsLead').textContent = JSON.stringify(l, null, 2); }
  }

  /* ---------- console, FAQ editor, analytics ---------- */
  function mountCons() {
    var ag = O.agents.support ? 'support' : 'realty', host = $('#consChat'); if (!host) return;
    var consChat = O.mount(host, { agent: ag, channel: 'web', source: 'Website chat', context: O.agents[ag].contexts && O.agents[ag].contexts[1] ? O.agents[ag].contexts[1].context : {} });
    U.patch(consChat, 'Northlane');
    var consCtl = O.console($('#consBox'), { name: 'Nora', role: 'front desk' });
    window.addEventListener('orbit:console', function (e) { var id = e.detail && e.detail.convo; if (id) { consCtl.select(id); var t = document.getElementById('console'); if (window.Motion && Motion.lenis) Motion.lenis.scrollTo(t, { offset: -70 }); else t.scrollIntoView({ behavior: 'smooth' }); } });
    $('#consTrig').addEventListener('click', function () { consChat.send('I want to talk to a human'); });
  }
  var kbChat = null;
  function mountKb() {
    var first = O.agents.support ? 'support' : 'realty', host = $('#kbChat'); if (!host) return;
    function chat(id) { if (kbChat) kbChat.destroy(); kbChat = O.mount(host, { agent: id, channel: 'web', source: 'Website chat' }); U.patch(kbChat, Br.byId[id] ? Br.byId[id].name : 'the business'); }
    O.kbAdmin($('#kbBox'), { agent: first, onAgent: chat }); chat(first);
  }
  function mountAn() { O.analyticsView($('#anBox'), { days: 7 }); $('#resetBtn').addEventListener('click', function () { O.reset(); try { sessionStorage.removeItem('orbit-trade'); } catch (e) {} location.reload(); }); }
  function onEngine() {
    renderPick(); syncTabs(); mountDemo(); mountCons(); mountKb(); mountAn(); if (animated) setTimeout(function () { ST.refresh(); }, 300);
    var first = (S.questions || (O.agents[S.agent] && O.agents[S.agent].samples) || [])[0];
    if (first) U.nudge($('.dev-wrap'), first, 'main', sendSample);
  }

  /* ---------- section modules ---------- */
  function mountModules() {
    var mods = window.OrbitSections || {}, ctx = { gsap: G, ST: ST, animated: animated, reduce: reduce, Brands: Br, Orbit: null, samples: function (p) { return '../' + p; }, openDemo: function (id, ch) { if (ch && CHN[ch]) S.ch = ch; soon(); setAgent(id); var t = document.getElementById('try'); if (window.Motion && Motion.lenis) Motion.lenis.scrollTo(t, { offset: -64, duration: 1.2 }); else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); } };
    $$('[data-module]').forEach(function (el) { var m = mods[el.getAttribute('data-module')]; if (m && m.mount) { try { m.mount(el, ctx); } catch (e) { if (window.console) console.error('module ' + el.id, e); } } });
  }

  /* ---------- progress, magnetic buttons ---------- */
  function progress() {
    var bar = $('#prog i'), tick = false; if (!bar) return;
    function upd() { tick = false; var h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')'; }
    addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true }); upd();
  }
  function magnets() {
    if (!(animated && matchMedia('(hover:hover) and (pointer:fine)').matches)) return;
    $$('[data-magnetic]').forEach(function (b) {
      if (b.__mag) return; b.__mag = 1; var xt = G.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), yt = G.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
      b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); xt((e.clientX - r.left - r.width / 2) * 0.3); yt((e.clientY - r.top - r.height / 2) * 0.35); });
      b.addEventListener('pointerleave', function () { xt(0); yt(0); });
    });
  }

  /* ---------- the clock: the page runs from 11:42 pm to the next morning, and the header keeps the time ---------- */
  function clock() {
    var hd = $('.hd'), clk = $('#clk b'), dawn = $('#dawn'); if (!hd || !clk) return;
    var cur = '', tick = 0;
    function stamp(s) {
      if (s.id === 'dawn') return '9:05 am';
      if (s.id === 'hero') return '11:42 pm';
      if (s.id === 'story') { var k = $('.stv-ck', s), a = $('.stv-ap', s); return k && a && k.offsetParent && /am/.test(a.textContent) ? k.textContent + ' ' + a.textContent : '11:46 pm'; }
      var t = $('.qh-a time', s) || $('.ft-a time', s); return t ? t.textContent : '';
    }
    function at() {
      tick = 0;
      var line = innerHeight * .46, bot = hd.getBoundingClientRect().bottom, now = '', marks = $$('main > section, #dawn, .ft');
      marks.forEach(function (m) { if (m.getBoundingClientRect().top <= line) { var t = stamp(m); if (t) now = t; } });
      if (!now) now = '11:42 pm';
      if (now !== cur) { cur = now; clk.textContent = now; clk.classList.remove('tick'); void clk.offsetWidth; clk.classList.add('tick'); }
      var night = !dawn || dawn.getBoundingClientRect().top + dawn.offsetHeight * .62 > bot;
      hd.classList.toggle('night', night);
    }
    addEventListener('scroll', function () { if (!tick) tick = requestAnimationFrame(at); }, { passive: true });
    addEventListener('resize', at);
    at();
  }

  renderPick(); syncTabs(); mountModules(); clock(); if (U.heads) U.heads(); progress(); magnets();
  if (animated) { setTimeout(function () { ST.refresh(); }, 600); if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); }); }
  window.__orbitPage = S;
})();
