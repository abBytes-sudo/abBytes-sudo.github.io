/* Orbit Assistants page: hero (drifting messages, business tiles), pickers, live demo + annotations, CRM assistant, console, KB, analytics, rail, section modules. Demo data stays in this browser. */
(function () {
  'use strict';
  var O = window.Orbit, Br = window.OrbitBrands, root = document.documentElement, G = window.gsap, ST = window.ScrollTrigger;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animated = root.classList.contains('motion-on') && !!G && !!ST && !reduce;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function svg(id, n) { return '<svg width="' + (n || 18) + '" height="' + (n || 18) + '" aria-hidden="true"><use href="#' + id + '"/></svg>'; }
  if (!O || !O.mount || !Br) return;

  var agents = Br.order.filter(function (id) { return O.agents[id]; });
  var CHN = { web: 'Web chat', whatsapp: 'WhatsApp', instagram: 'Instagram', crm: 'CRM assistant' };
  var DEFAULT_CH = { realty: 'whatsapp', support: 'web', build: 'instagram', clinic: 'whatsapp', salon: 'instagram', dining: 'web' };
  var SRC_BY_CH = { web: 'Google search', whatsapp: 'WhatsApp click-to-chat', instagram: 'Instagram ad', crm: 'Website chat' };
  var LINE = { realty: 'Finds homes from a typed brief and books the visit.', support: 'Tracks orders, starts returns, advises on size.', build: 'Prices a job in minutes, books the site visit.', clinic: 'Books, moves and reminds. Never gives medical advice.', salon: 'Books stylists, rebooks your usual, sells packages.', dining: 'Tables, waitlist and menu answers by diet.' };
  var ROLE = { realty: 'Homes: rent and sale', support: 'Online store support', build: 'Quotes and site visits', clinic: 'Clinic bookings', salon: 'Salon bookings', dining: 'Table bookings' };
  function brandVars(b) { return '--bc:' + b.acc + ';--bi:' + b.ink + ';--bd:' + b.deep + ';--bt:' + b.tx + ';--bs:' + b.soft + ';--tf:' + b.display; }

  var S = { agent: agents.indexOf('realty') >= 0 ? 'realty' : agents[0], ch: 'whatsapp', ctx: 0, src: null, chat: null };
  try { var sv = JSON.parse(localStorage.getItem('orbit-demo-pick') || 'null'); if (sv && O.agents[sv.agent] && Br.byId[sv.agent]) { S.agent = sv.agent; S.ch = CHN[sv.ch] ? sv.ch : (DEFAULT_CH[S.agent] || 'web'); } else S.ch = DEFAULT_CH[S.agent] || 'web'; } catch (e) { S.ch = DEFAULT_CH[S.agent] || 'web'; }
  if (S.ch === 'crm' && !(O.mountCrm && O.agents.crm)) S.ch = DEFAULT_CH[S.agent] || 'web';
  function remember() { try { localStorage.setItem('orbit-demo-pick', JSON.stringify({ agent: S.agent, ch: S.ch })); } catch (e) {} }
  var devEl = $('#demoDev'), grid = $('#demoGrid'), nowTimer = null;
  Br.set(S.agent);

  /* ---------- hero: two lanes of drifting messages + business tiles ---------- */
  var laneT = $('#laneTop'), laneB = $('#laneBot');
  if (laneT && laneB) {
    var pool = []; agents.forEach(function (id, i) { var bb = Br.byId[id]; pool.push({ b: bb, m: bb.msgs[0], o: i }); }); [1, 3].forEach(function (i) { var id = agents[i]; if (id) pool.push({ b: Br.byId[id], m: Br.byId[id].msgs[1], o: 10 + i }); });
    function bub(p, i, n) { var d = 70 + (i * 11) % 30, dl = -(i * d / n) - 3 * (i % 2); return '<div class="ob-b" style="' + brandVars(p.b) + ';--d:' + d + 's;--dl:' + dl.toFixed(1) + 's;--sx:' + (3 + i * (74 / n)).toFixed(1) + 'vw"><span class="m">' + svg('c-' + p.m.ch, 15) + '<span class="t">' + esc(p.m.msg) + '</span></span><span class="rp">' + esc(p.m.reply) + '</span></div>'; }
    var half = Math.ceil(pool.length / 2), top = pool.filter(function (x, i) { return i % 2 === 0; }), bot = pool.filter(function (x, i) { return i % 2 === 1; });
    laneT.innerHTML = top.map(function (p, i) { return bub(p, i * 2, pool.length); }).join(''); laneB.innerHTML = bot.map(function (p, i) { return bub(p, i * 2 + 1, pool.length); }).join('');
  }
  var tiles = $('#tiles');
  if (tiles) {
    tiles.innerHTML = agents.map(function (id) {
      var b = Br.byId[id];
      return '<li><button type="button" class="tl" data-a="' + id + '" style="' + brandVars(b) + '" aria-label="' + esc(b.name) + ', ' + esc(ROLE[id] || '') + '. Open in the live demo."><span class="tl-ph" aria-hidden="true"><img src="../' + b.photo + '" alt="" loading="lazy" width="640" height="400"><span class="tl-mark">' + esc(b.mark) + '</span></span><span class="tl-body"><b>' + esc(b.name) + '</b><span class="tl-i">' + esc(ROLE[id] || '') + '</span><span class="tl-c" aria-hidden="true">' + svg('c-web', 17) + svg('c-whatsapp', 17) + svg('c-instagram', 17) + '<i>+ CRM assistant</i></span></span></button></li>';
    }).join('');
    $$('.tl', tiles).forEach(function (t) { t.addEventListener('click', function () { setAgent(t.getAttribute('data-a'), true); }); });
  }

  /* ---------- pickers ---------- */
  function renderPick() {
    $('#agentPick').innerHTML = agents.map(function (id) { var b = Br.byId[id]; return '<button type="button" class="bz" data-a="' + id + '" style="' + brandVars(b) + '" aria-pressed="' + (id === S.agent) + '"><span class="bi" aria-hidden="true">' + esc(b.mark) + '</span><span><b>' + esc(b.name) + '</b><small>' + esc(ROLE[id] || b.industry) + '</small></span><span class="chk" aria-hidden="true"><svg width="13" height="13"><use href="#i-check"/></svg></span></button>'; }).join('');
    $$('.bz').forEach(function (b) { b.addEventListener('click', function () { setAgent(b.getAttribute('data-a'), false); }); });
  }
  function setAgent(id, scroll) {
    if (!O.agents[id]) return; S.agent = id; S.ctx = 0; S.src = null; if (S.ch !== 'crm') S.ch = DEFAULT_CH[id] || 'web';
    Br.set(id); $$('.bz').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-a') === id)); }); syncTabs(); mountDemo(); remember();
    if (scroll) { var t = document.getElementById('demo'); if (window.Motion && Motion.lenis) Motion.lenis.scrollTo(t, { offset: -64, duration: 1.2 }); else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
  }
  function syncTabs() {
    var seg = $('#chTabs'), act = null; $$('#chTabs button').forEach(function (b) { var on = b.getAttribute('data-ch') === S.ch; b.setAttribute('aria-pressed', String(on)); if (on) act = b; });
    if (act) { seg.style.setProperty('--x', act.offsetLeft + 'px'); seg.style.setProperty('--w', act.offsetWidth + 'px'); }
  }
  $$('#chTabs button').forEach(function (b) { b.addEventListener('click', function () { S.ch = b.getAttribute('data-ch'); syncTabs(); mountDemo(); remember(); }); });
  addEventListener('resize', syncTabs); if (window.ResizeObserver) new ResizeObserver(function () { syncTabs(); }).observe($('#chTabs')); if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncTabs);
  $('#srcSel').addEventListener('change', function () { S.src = this.value; mountDemo(); });
  function announce() {
    var n = $('#nowBar'), b = Br.byId[S.agent]; n.innerHTML = S.ch === 'crm' ? 'Now in the <b>CRM assistant</b> for <b>' + esc(b.name) + '</b>' : 'Now chatting with <b>' + esc(b.name) + '</b> on <b>' + esc(CHN[S.ch]) + '</b>';
    n.classList.remove('flash'); void n.offsetWidth; n.classList.add('flash'); clearTimeout(nowTimer); nowTimer = setTimeout(function () { n.classList.remove('flash'); }, 2600);
  }

  /* ---------- annotation layer ---------- */
  var annot = $('#annot'), how = $('#howToggle'), seen = {}, noteTimer = null, howOn = false;
  try { var hv = localStorage.getItem('orbit-how'); howOn = hv == null ? matchMedia('(min-width:1100px)').matches : hv === '1'; } catch (e) { howOn = matchMedia('(min-width:1100px)').matches; }
  if (reduce) { howOn = false; how.disabled = true; $('.how-t', how.parentNode).title = 'Off when reduced motion is requested'; }
  how.checked = howOn;
  how.addEventListener('change', function () { howOn = how.checked; try { localStorage.setItem('orbit-how', howOn ? '1' : '0'); } catch (e) {} if (!howOn) annot.innerHTML = ''; });
  var ARROW = '<svg width="46" height="38" viewBox="0 0 46 38" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5c14-4 30 2 34 22"/><path d="M29 23l8 5 4-9"/></svg>';
  function note(text) {
    if (!howOn || reduce || S.ch === 'crm') return; clearTimeout(noteTimer); annot.innerHTML = '<div class="note">' + ARROW + '<span>' + esc(text) + '</span></div>';
    noteTimer = setTimeout(function () { var n = $('.note', annot); if (n) { n.classList.add('out'); } }, 6500);
  }
  function onEvent(e) {
    if (!e || e.convo !== S.convoId) return; var k = e.type + ':' + (e.intent || e.action || e.kind || ''); if (seen[k] || e.type === 'convo_start' || e.type === 'engaged') return; seen[k] = 1;
    var src = S.src || SRC_BY_CH[S.ch];
    if (e.type === 'intent') note(e.parsed ? 'understood: ' + e.parsed : 'read your sentence: ' + String(e.intent).replace(/_/g, ' '));
    else if (e.type === 'action') note('it acted on live data: ' + String(e.action || '').replace(/_/g, ' '));
    else if (e.type === 'lead') note('lead saved, true source: ' + src);
    else if (e.type === 'booking') note('booked: ' + (e.kind || 'slot') + ', reminder queued');
    else if (e.type === 'handover') note('handed over, full history attached');
    else if (e.type === 'kb') note('answered from the FAQ your team edits');
    else if (e.type === 'fallback') note('no match: it offers the menu, never guesses');
  }

  /* ---------- live demo ---------- */
  var offBts = null;
  function brandChat(r) {
    var b = Br.byId[S.agent]; if (!r || !b) return;
    $$('.ob-av', r).forEach(function (a) { a.textContent = b.mark; if (b.mark.length > 2) a.style.fontSize = '10px'; });
    var nm = $('.ob-hd b', r); if (nm && S.ch === 'web') nm.style.fontFamily = b.display;
  }
  function mountDemo() {
    var a = O.agents[S.agent]; if (!a) return; if (S.chat) S.chat.destroy(); seen = {}; clearTimeout(noteTimer); annot.innerHTML = '';
    var crm = S.ch === 'crm', b = Br.byId[S.agent];
    grid.classList.toggle('is-crm', crm); devEl.className = 'device' + (crm ? ' crm' : ''); annot.classList.toggle('off', crm);
    var ctxs = a.contexts || [{ label: 'Just browsing', context: {} }];
    var src = S.src || SRC_BY_CH[S.ch]; $('#srcSel').value = [].slice.call($('#srcSel').options).some(function (o) { return o.value === src; }) ? src : $('#srcSel').options[0].value; if (!S.src) src = $('#srcSel').value;
    if (crm) { devEl.innerHTML = ''; S.chat = O.mountCrm(devEl, { biz: S.agent }); S.convoId = null; }
    else { S.chat = O.mount(devEl, { agent: S.agent, channel: S.ch, context: ctxs[S.ctx].context, source: src }); S.convoId = S.chat.session.id; brandChat(S.chat.root); }
    announce();
    $('#ctxs').innerHTML = ctxs.map(function (c, i) { return '<button type="button" class="cx" data-i="' + i + '" aria-pressed="' + (i === S.ctx) + '">' + esc(c.label) + '</button>'; }).join('');
    $$('.cx').forEach(function (x) { x.addEventListener('click', function () { S.ctx = +x.getAttribute('data-i'); mountDemo(); }); });
    $('#samples').innerHTML = (a.samples || []).map(function (t) { return '<button type="button" class="sm-b">' + esc(t) + '</button>'; }).join('');
    $$('.sm-b').forEach(function (x) { x.addEventListener('click', function () { if (S.chat && S.chat.send) S.chat.send(x.textContent.replace(/^› /, '')); var i = $('input', devEl); if (i && matchMedia('(hover:hover)').matches) i.focus(); }); });
    $('#chCap').textContent = crm ? 'The team side of ' + b.name + '. Tip: book something in a customer channel first, then open this tab: the lead appears at the top as new.' : S.ch === 'whatsapp' ? 'WhatsApp skin: ticks, timestamps and reply buttons. Same flows as every other channel.' : S.ch === 'instagram' ? 'Instagram DM skin. Same conversation, different clothes.' : 'Web chat in ' + b.name + '’s own colours. Embed it with one call: Orbit.mount(el, { agent, channel }).';
    btsReset(); if (offBts) offBts(); offBts = O.events.on(function (e) { if (e && e.convo === S.convoId) { btsAdd(e); onEvent(e); } });
  }
  var LBL = { intent: 'intent', action: 'action', lead: 'lead', booking: 'booking', handover: 'handover', fallback: 'no match', kb: 'FAQ hit', engaged: 'engaged', convo_start: 'session', resolved: 'resolved', agent_reply: 'person' };
  function btsReset() { $('#bts').innerHTML = '<li class="mute">Intents, actions and leads show up here as you chat.</li>'; $('#btsLead').textContent = 'No lead yet'; }
  function btsAdd(e) {
    if (e.type === 'convo_start') return; var ul = $('#bts'); if (ul.firstChild && ul.firstChild.className === 'mute') ul.innerHTML = '';
    var d = e.type === 'intent' ? e.intent : e.type === 'action' ? (e.action || '') : e.type === 'lead' ? e.lead : e.type === 'booking' ? e.kind : e.type === 'handover' ? e.reason : e.type === 'kb' ? e.id : '';
    var li = document.createElement('li'); li.innerHTML = '<b>' + esc(LBL[e.type] || e.type) + '</b><span>' + esc(d || '') + '</span><time>' + new Date(e.ts).toTimeString().slice(0, 8) + '</time>'; ul.insertBefore(li, ul.firstChild); while (ul.children.length > 8) ul.removeChild(ul.lastChild);
    if (e.type === 'lead') { var l = O.leads.list().filter(function (x) { return x.id === e.lead; })[0]; if (l) $('#btsLead').textContent = JSON.stringify(l, null, 2); }
  }

  /* ---------- console + chat ---------- */
  var consChat = null, consCtl = null;
  function mountCons() {
    var ag = O.agents.support ? 'support' : agents[0];
    consChat = O.mount($('#consChat'), { agent: ag, channel: 'web', source: 'Website chat', context: O.agents[ag].contexts && O.agents[ag].contexts[1] ? O.agents[ag].contexts[1].context : {} });
    consCtl = O.console($('#consBox'), { name: 'Nora', role: 'front desk' });
    window.addEventListener('orbit:console', function (e) { var id = e.detail && e.detail.convo; if (id) { consCtl.select(id); var t = document.getElementById('console'); if (window.Motion && Motion.lenis) Motion.lenis.scrollTo(t, { offset: -70 }); else t.scrollIntoView({ behavior: 'smooth' }); } });
    $('#consTrig').addEventListener('click', function () { consChat.send('I want to talk to a human'); });
  }
  var kbChat = null;
  function mountKb() {
    var first = O.agents.support ? 'support' : agents[0];
    function chat(id) { if (kbChat) kbChat.destroy(); kbChat = O.mount($('#kbChat'), { agent: id, channel: 'web', source: 'Website chat' }); }
    O.kbAdmin($('#kbBox'), { agent: first, onAgent: chat }); chat(first);
  }
  function mountAn() { O.analyticsView($('#anBox'), { days: 7 }); $('#resetBtn').addEventListener('click', function () { O.reset(); location.reload(); }); }

  /* ---------- section modules ---------- */
  function mountModules() {
    var mods = window.OrbitSections || {}, ctx = { gsap: G, ST: ST, animated: animated, reduce: reduce, Brands: Br, Orbit: O, samples: O.samples, openDemo: function (id, ch) { if (ch && CHN[ch]) S.ch = ch; setAgent(id, true); } };
    $$('[data-module]').forEach(function (el) { var m = mods[el.getAttribute('data-module')]; if (m && m.mount) { try { m.mount(el, ctx); } catch (e) { if (window.console) console.error('module ' + el.id, e); } } });
  }

  /* ---------- rail + progress ---------- */
  function buildRail() {
    var rail = $('#rail'), secs = $$('main section[data-index]'), seenI = {}, items = [];
    secs.forEach(function (s) { var i = s.getAttribute('data-index'); if (seenI[i]) return; seenI[i] = 1; if (!s.id) s.id = 'sec-' + i; items.push({ i: i, id: s.id, name: s.getAttribute('data-name') || '' }); });
    rail.innerHTML = items.map(function (it) { return '<a href="#' + it.id + '" data-i="' + it.i + '"><b>' + it.i + '</b><i></i><span>' + esc(it.name) + '</span></a>'; }).join('');
    var bar = $('#prog i'), links = $$('a', rail), tick = false;
    function upd() {
      tick = false; var y = scrollY, h = document.documentElement.scrollHeight - innerHeight; if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
      var mid = innerHeight * 0.4, cur = items[0].i; secs.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top < mid && r.bottom > mid) cur = s.getAttribute('data-index'); });
      links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-i') === cur); });
      var st = document.querySelector('#story > *'), dark = false; if (st && cur === '03') { var m = (getComputedStyle(st).backgroundColor || '').match(/\d+/g); if (m && m.length >= 3) dark = (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) < 110; } rail.classList.toggle('night', dark); rail.classList.toggle('hide', cur === '03');
    }
    addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true }); addEventListener('resize', upd); upd();
  }

  /* ---------- magnetic buttons added by modules, lazy video ---------- */
  function magnets() {
    if (!(animated && matchMedia('(hover:hover) and (pointer:fine)').matches)) return;
    $$('[data-magnetic]').forEach(function (b) {
      if (b.__mag) return; b.__mag = 1; var xt = G.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), yt = G.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
      b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); xt((e.clientX - r.left - r.width / 2) * 0.3); yt((e.clientY - r.top - r.height / 2) * 0.35); });
      b.addEventListener('pointerleave', function () { xt(0); yt(0); });
    });
  }
  function lazyVideo() {
    var vids = $$('video.lazyv'); if (!vids.length) return;
    var load = function (v) { if (!v.src) { v.src = v.getAttribute('data-src') + (reduce ? '#t=1' : ''); v.addEventListener('loadeddata', function () { v.classList.add('on'); }, { once: true }); if (reduce) v.preload = 'metadata'; } };
    if (!('IntersectionObserver' in window)) { vids.forEach(function (v) { load(v); if (!reduce) v.play(); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { var v = e.target; if (e.isIntersecting) { load(v); if (!reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } } else v.pause(); }); }, { rootMargin: '200px 0px' }); vids.forEach(function (v) { io.observe(v); });
  }

  /* ---------- go ---------- */
  renderPick(); syncTabs(); mountDemo(); mountCons(); mountKb(); mountAn(); mountModules(); buildRail(); magnets(); lazyVideo();
  if (animated) { setTimeout(function () { ST.refresh(); }, 600); if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); }); }
  window.__orbitPage = S;
})();
