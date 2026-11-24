/* Brand concierge shell, Forge copy (portfolio project by Abhishek). Puts a brand-designed launcher and dialog on the page and lazy-loads the
   shared, rule-based Orbit engine (samples/assets/bots/) only when it is needed: on the first click, or once the page has
   been idle for 4 s. No LLM, no network calls: everything runs in this browser.
   The same file ships in each sample folder; the brand look lives in that sample's own CSS (data-skin), the words in its agent.
   Usage (end of <head>, defer):
     <script src="concierge.js?v=1" defer data-agent="northlane" data-skin="concierge.css?v=1" data-brand="nl"
       data-title="Northlane Concierge" data-sub="Stylist and client care" data-label="Ask the concierge" data-nudge="product,shop"></script>
   Optional: data-assets (path to samples/assets/, default ../assets/), data-v (cache version for the engine files).
   Any element with data-concierge="<button value>" (e.g. "flow:book") opens the chat and runs that step. */
(function () {
  'use strict';
  var me = document.currentScript;
  function A(k, d) { var v = me && me.getAttribute('data-' + k); return v == null || v === '' ? d : v; }
  var AGENT = A('agent'), BRAND = A('brand', 'cg'), ASSETS = A('assets', '../assets/'), V = A('v', '1'), SKIN = A('skin', ''), TITLE = A('title', 'Concierge'), SUB = A('sub', 'Replies instantly'), LABEL = A('label', 'Ask us'), NUDGE = A('nudge', '');
  if (!AGENT || window.__cgOn) return; window.__cgOn = 1;
  var doc = document, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, sheetMQ = matchMedia('(max-width: 560px)');
  var touch = matchMedia('(pointer: coarse)').matches;
  function el(t, c, h) { var e = doc.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var ICON = {
    wa: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.8 2c0 1.2.9 2.3 1 2.5.1.1 1.7 2.6 4.1 3.7 1.5.7 2.1.7 2.9.6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.2z"/></svg>',
    person: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.9-3.6 3.7-5.4 7.2-5.4s6.3 1.8 7.2 5.4"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 6l-6 6 6 6"/></svg>',
    restart: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.3-5.4M4.5 4.5v4h4"/></svg>'
  };

  /* ---------- DOM: launcher, nudge and dialog ---------- */
  var root = el('div', 'cg cg--' + BRAND); root.setAttribute('data-state', 'closed'); root.setAttribute('data-lenis-prevent', '');
  var pid = 'cg-' + AGENT;
  root.innerHTML =
    '<div class="cg-nudge" role="status" hidden><button type="button" class="cg-nudge-go"><span class="cg-nudge-t"></span><span class="cg-nudge-cta">Yes, show me</span></button><button type="button" class="cg-nudge-x" aria-label="Dismiss this suggestion">' + ICON.x + '</button></div>' +
    '<div class="cg-panel" id="' + pid + '" role="dialog" aria-labelledby="' + pid + '-t" aria-describedby="' + pid + '-d" hidden tabindex="-1">' +
      '<div class="cg-hd"><span class="cg-av" aria-hidden="true"><i></i><i></i><i></i></span><div class="cg-ti"><b id="' + pid + '-t">' + esc(TITLE) + '</b><small class="cg-st" aria-live="polite">' + esc(SUB) + '</small></div>' +
        '<div class="cg-acts"><button type="button" class="cg-ib" data-cg="restart" aria-label="Start over" title="Start over">' + ICON.restart + '</button><button type="button" class="cg-ib" data-cg="wa" aria-label="Continue on WhatsApp" title="Continue on WhatsApp">' + ICON.wa + '</button><button type="button" class="cg-ib" data-cg="person" aria-label="Talk to a person" title="Talk to a person">' + ICON.person + '</button><button type="button" class="cg-ib cg-close" data-cg="close" aria-label="Close chat" title="Close (Esc)">' + ICON.x + '</button></div></div>' +
      '<div class="cg-body"><div class="cg-web"></div><div class="cg-wapp" hidden><div class="cg-wbar"><button type="button" class="cg-ib" data-cg="web" aria-label="Back to the website chat">' + ICON.back + '</button><span><b>Forge on WhatsApp</b><small>Same front desk, in the app you already use</small></span><button type="button" class="cg-ib" data-cg="close" aria-label="Close chat">' + ICON.x + '</button></div><div class="cg-wahost"></div></div>' +
        '<div class="cg-load" aria-hidden="true"><span></span><span></span><span></span></div></div>' +
      '<p class="cg-d" id="' + pid + '-d"><i aria-hidden="true"></i>Automated replies · the front desk joins for anything else</p>' +
    '</div>' +
    '<button type="button" class="cg-launch" aria-label="' + esc(LABEL) + '" aria-haspopup="dialog" aria-expanded="false" aria-controls="' + pid + '"><span class="cg-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="cg-lab">' + esc(LABEL) + '</span><span class="cg-ping" aria-hidden="true"></span></button>';
  var $ = function (s) { return root.querySelector(s); };
  var panel = $('.cg-panel'), launch = $('.cg-launch'), webHost = $('.cg-web'), waWrap = $('.cg-wapp'), waHost = $('.cg-wahost'), st = $('.cg-st'), nudge = $('.cg-nudge');

  /* the skin loads without blocking the page; the launcher appears once it has landed */
  function skin(href, cb) { if (!href) { cb(); return; } var l = el('link'); l.rel = 'stylesheet'; l.href = href; l.onload = l.onerror = function () { cb(); }; doc.head.appendChild(l); }
  function mountDom() {
    doc.body.appendChild(root);
    skin(SKIN, function () { requestAnimationFrame(function () { root.classList.add('cg-in'); }); });
  }
  if (doc.body) mountDom(); else doc.addEventListener('DOMContentLoaded', mountDom);

  /* ---------- lazy engine ---------- */
  var ready = false, loading = null, waiters = [];
  function load(cb) {
    if (ready) { if (cb) cb(); return; } if (cb) waiters.push(cb); if (loading) return; loading = true;
    var b = ASSETS + 'bots/', list = [b + 'engine.js?v=' + V, b + 'ui.js?v=' + V, b + 'agents/' + AGENT + '.js?v=' + V];
    var css = el('link'); css.rel = 'stylesheet'; css.href = b + 'bots.css?v=' + V; doc.head.appendChild(css);
    var n = 0; list.forEach(function (src) { var s = el('script'); s.src = src; s.async = false; s.onload = s.onerror = function () { if (++n === list.length) { ready = !!(window.Orbit && Orbit.mount && Orbit.agents[AGENT]); var w = waiters; waiters = []; w.forEach(function (f) { try { f(); } catch (e) {} }); } }; doc.head.appendChild(s); });
  }
  function idle() { var go = function () { load(); }; if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 2500 }); else setTimeout(go, 200); }
  if (doc.readyState === 'complete') setTimeout(idle, 4000); else addEventListener('load', function () { setTimeout(idle, 4000); });

  /* ---------- context: which page and section the visitor is on ---------- */
  function context() {
    var q = new URLSearchParams(location.search), file = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index', c = { page: doc.body.getAttribute('data-page') || file, file: file };
    q.forEach(function (v, k) { if (/^(id|cat|q|o|order)$/.test(k)) c[k] = v; });
    var secs = [].slice.call(doc.querySelectorAll('main section[id], section[id]')), mid = innerHeight * .45, best = null;
    secs.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom >= mid) best = s.id; });
    if (best) c.section = best;
    return c;
  }
  function source() { var q = new URLSearchParams(location.search); return q.get('utm_source') ? q.get('utm_source') + ' (website chat)' : (/google\./.test(doc.referrer) ? 'Google search' : /instagram\./.test(doc.referrer) ? 'Instagram' : 'Website chat'); }

  /* ---------- open / close ---------- */
  var chat = null, wa = null, opener = null, open = false, closeT = 0, pend = [];
  function setState(s) { root.setAttribute('data-state', s); }
  function show() {
    if (open) return; open = true; clearTimeout(closeT); hideNudge(true); opener = doc.activeElement && doc.activeElement !== doc.body ? doc.activeElement : launch;
    panel.hidden = false; var sheet = sheetMQ.matches; panel.setAttribute('aria-modal', sheet ? 'true' : 'false'); if (sheet) doc.documentElement.classList.add('cg-lock');
    launch.setAttribute('aria-expanded', 'true'); launch.setAttribute('aria-label', 'Close ' + TITLE);
    void panel.offsetWidth; setState('open');
    if (!chat) { root.classList.add('cg-loading'); load(function () { root.classList.remove('cg-loading'); start(); focusIn(); }); } else focusIn();
  }
  function focusIn() { setTimeout(function () { var i = webHost.querySelector('.ob-in input'); if (!touch && i && !waWrap.offsetParent) i.focus({ preventScroll: true }); else panel.focus({ preventScroll: true }); }, reduce ? 0 : 260); }
  function hide() {
    if (!open) return; open = false; setState('closing'); launch.setAttribute('aria-expanded', 'false'); launch.setAttribute('aria-label', LABEL); doc.documentElement.classList.remove('cg-lock');
    closeT = setTimeout(function () { if (!open) { panel.hidden = true; setState('closed'); } }, reduce ? 0 : 320);
    var o = opener && doc.contains(opener) ? opener : launch; try { o.focus({ preventScroll: true }); } catch (e) {}
  }
  launch.addEventListener('click', function () { if (open) hide(); else show(); });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) { e.stopPropagation(); hide(); return; }
    if (e.key === 'Tab' && open && sheetMQ.matches) { // full-height sheet: keep focus inside
      var f = [].slice.call(panel.querySelectorAll('button:not([disabled]),input,a[href],[tabindex="0"]')).filter(function (x) { return x.offsetParent !== null; }); if (!f.length) return;
      var a = f[0], z = f[f.length - 1]; if (e.shiftKey && (doc.activeElement === a || doc.activeElement === panel)) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && doc.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  sheetMQ.addEventListener && sheetMQ.addEventListener('change', function () { if (open) { panel.setAttribute('aria-modal', sheetMQ.matches ? 'true' : 'false'); doc.documentElement.classList.toggle('cg-lock', sheetMQ.matches); } });

  /* ---------- chat ---------- */
  function start() {
    if (chat || !ready) return;
    chat = Orbit.mount(webHost, { agent: AGENT, channel: 'web', context: context(), source: source() });
    chat.onStatus(function (t, cls) { st.textContent = t; root.setAttribute('data-status', cls || ''); });
    watch(chat);
    pend.splice(0).forEach(function (b) { chat.choose(b); });
  }
  // a person's reply typed in the back office in another tab arrives as a storage "sync": draw anything new
  function watch(m) {
    m._off = Orbit.convos.on(function (ev) {
      if (!ev || ev.type !== 'sync') return; var c = Orbit.convos.get(m.session.id), ch = m.chat; if (!c || !ch) return;
      c.messages.forEach(function (msg) { if ((msg.from === 'agent' || msg.from === 'system') && msg.id && !ch.rendered[msg.id]) ch.onMsg(Object.assign({ delay: 400 }, msg)); });
    });
  }
  function restart() {
    if (!chat) return; var s = chat.session; if (s && s.convo && s.convo.status !== 'bot' && s.convo.status !== 'resolved') { chat.send('menu'); return; }
    if (chat._off) chat._off(); chat.destroy(); chat = null; webHost.innerHTML = ''; start(); focusIn();
  }
  function toWhatsApp() {
    if (!chat) return; waWrap.hidden = false; webHost.hidden = true; root.setAttribute('data-ch', 'whatsapp');
    if (!wa) { var u = chat.session.user || {}, c = context(); c.from = 'web'; if (u.name) c.name = u.name; wa = Orbit.mount(waHost, { agent: AGENT, channel: 'whatsapp', context: c, source: 'WhatsApp (from the website chat)', frame: false }); watch(wa); }
    setTimeout(function () { var b = waWrap.querySelector('[data-cg="web"]'); if (b) b.focus(); }, 30);
  }
  function toWeb() { waWrap.hidden = true; webHost.hidden = false; root.removeAttribute('data-ch'); var b = $('[data-cg="wa"]'); if (b) b.focus(); }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cg]'); if (!b) return; var k = b.getAttribute('data-cg');
    if (k === 'close') hide(); else if (k === 'wa') toWhatsApp(); else if (k === 'web') toWeb(); else if (k === 'restart') restart();
    else if (k === 'person') { if (chat) chat.handover(); else pend.push({ label: 'Talk to a person', value: 'handover' }); }
  });
  // run a step from anywhere on the page: <a data-concierge="flow:book">Book in chat</a>
  doc.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-concierge]'); if (!t || root.contains(t)) return; e.preventDefault();
    var b = { label: t.getAttribute('data-concierge-label') || t.textContent.trim().slice(0, 60), value: t.getAttribute('data-concierge') };
    if (chat) { show(); chat.choose(b); } else { pend.push(b); show(); }
  });

  /* ---------- craft: haptic press, chip-to-bubble morph ---------- */
  function buzz() { if (touch && navigator.vibrate) try { navigator.vibrate(7); } catch (e) {} }
  root.addEventListener('click', function (e) {
    var chip = e.target.closest('.ob-chip,.ob-cbtn'); if (!chip) return; buzz();
    if (reduce || !chip.animate || !chip.classList.contains('ob-chip')) return;
    var host = chip.closest('.ob'), r0 = chip.getBoundingClientRect(), ghost = chip.cloneNode(true);
    ghost.classList.add('cg-ghost'); ghost.style.cssText = 'position:fixed;left:' + r0.left + 'px;top:' + r0.top + 'px;width:' + r0.width + 'px;height:' + r0.height + 'px;margin:0;z-index:2147483;pointer-events:none';
    requestAnimationFrame(function () {
      var u = host && host.querySelectorAll('.ob-user'), bub = u && u[u.length - 1]; if (!bub) return; var r1 = bub.getBoundingClientRect();
      if (!r1.width) return; host.closest('.cg').appendChild(ghost); bub.style.opacity = '0';
      var a = ghost.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + (r1.right - r0.right) + 'px,' + (r1.top - r0.top) + 'px) scale(' + Math.min(1.25, r1.width / r0.width) + ',' + Math.min(1.6, r1.height / r0.height) + ')', opacity: .25 }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
      a.onfinish = a.oncancel = function () { ghost.remove(); bub.style.opacity = ''; bub.classList.add('cg-landed'); };
    });
  }, true);
  root.addEventListener('submit', buzz, true);

  /* ---------- proactive nudge: 20 s on a key page, once per session, dismissible ---------- */
  var nudgeKey = 'cg-nudge-' + AGENT, nudgeBtn = null;
  function keyPage() { if (!NUDGE) return false; var c = context(); return NUDGE.split(',').some(function (p) { p = p.trim(); return p === '*' || p === c.page || p === c.file || p === c.section; }); }
  function showNudge() {
    if (open || chat || ss(nudgeKey) || !keyPage()) return;
    load(function () {
      if (open || chat) return; var a = Orbit.agents[AGENT], n = a && a.nudge ? a.nudge(context()) : null; if (!n) return;
      nudgeBtn = n.button || null; $('.cg-nudge-t').textContent = n.text; $('.cg-nudge-cta').textContent = n.cta || 'Yes, show me';
      nudge.hidden = false; void nudge.offsetWidth; root.classList.add('cg-nudging'); ss(nudgeKey, '1');
    });
  }
  function hideNudge(quick) { if (nudge.hidden) return; root.classList.remove('cg-nudging'); setTimeout(function () { nudge.hidden = true; }, quick || reduce ? 0 : 260); }
  $('.cg-nudge-x').addEventListener('click', function () { hideNudge(); launch.focus(); });
  $('.cg-nudge-go').addEventListener('click', function () { var b = nudgeBtn; hideNudge(true); if (b) pend.push(b); show(); });
  setTimeout(showNudge, 20000);
  // the chat sent the visitor to another page (a product, live tracking): reopen it there
  if (ss('cg-reopen-' + AGENT)) { try { sessionStorage.removeItem('cg-reopen-' + AGENT); } catch (e) {} var re = function () { setTimeout(show, 350); }; if (doc.readyState === 'complete') re(); else addEventListener('load', re); }

  window.Concierge = { open: show, close: hide, load: load, chat: function () { return chat; }, run: function (b) { if (chat) { show(); chat.choose(b); } else { pend.push(b); show(); } } };
})();
