/* Ordwell — the in-app assistant panel (⌘J). A slide-over beside the work, built in the app's own components.
   Lazy-loads the shared Orbit engine (assets/bots) on first open and mounts the 'work' agent, which answers from the
   live workspace (window.OW) with task cards and shows a preview before it changes anything. */
(function () {
  'use strict';
  var OW = window.OW, UI = OW.UI, I = UI.I, esc = UI.esc, app = OW.app;
  var A = window.OrdwellAssistant = {}, root = null, chat = null, open = false, loading = false, waiters = [], opener = null;
  var V = '5', BOTS = '../assets/bots/';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ctx() { var r = app.route || {}; return { page: r.name || 'home', project: r.name === 'p' ? r.args[0] : (app.panelOpen ? (OW.Q.task(app.panelOpen) || {}).project : null), task: app.panelOpen || null }; }
  function build() {
    root = document.createElement('section'); root.className = 'asst'; root.id = 'asst'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-labelledby', 'asst-t'); root.hidden = true; root.tabIndex = -1;
    root.innerHTML = '<header class="asst-hd"><span class="asst-key" aria-hidden="true">⌘J</span><div class="asst-ti"><b id="asst-t">Ask Ordwell</b><small>Answers from your workspace · previews before changes</small></div>' +
      '<button type="button" class="ibtn" data-as="restart" aria-label="Start a new conversation" title="New conversation">' + I('refresh') + '</button><button type="button" class="ibtn" data-as="close" aria-label="Close assistant (Esc)">' + I('x') + '</button></header>' +
      '<div class="asst-body"><div class="asst-chat"></div><div class="asst-load" aria-hidden="true"><span></span><span></span><span></span></div></div>' +
      '<p class="asst-foot">' + I('lock', 's') + 'Reads and edits only what you can see. ⌘Z undoes anything it changes.</p>';
    document.body.appendChild(root);
    root.addEventListener('click', function (e) { var b = e.target.closest('[data-as]'); if (!b) return; var k = b.getAttribute('data-as'); if (k === 'close') A.close(); if (k === 'restart') restart(); });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); A.close(); } });
  }
  function load(cb) {
    if (window.Orbit && Orbit.mount && Orbit.agents.work) { cb(); return; } waiters.push(cb); if (loading) return; loading = true;
    var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = BOTS + 'bots.css?v=' + V; document.head.appendChild(css);
    var list = [BOTS + 'engine.js?v=' + V, BOTS + 'ui.js?v=' + V, BOTS + 'agents/work.js?v=' + V], n = 0;
    list.forEach(function (src) { var s = document.createElement('script'); s.src = src; s.async = false; s.onload = s.onerror = function () { if (++n === list.length) { var w = waiters; waiters = []; w.forEach(function (f) { f(); }); } }; document.head.appendChild(s); });
  }
  function mount() {
    var host = root.querySelector('.asst-chat'); host.innerHTML = '';
    try { chat = Orbit.mount(host, { agent: 'work', channel: 'web', context: ctx(), source: 'Ordwell app', mode: 'inline', speed: reduce ? 0 : .7 }); }
    catch (e) { host.innerHTML = '<div class="empty"><h3>The assistant didn’t load</h3><p>Check your connection and open it again.</p></div>'; return; }
    var inp = host.querySelector('.ob-in input'); if (inp) inp.placeholder = 'Ask about your work, or “create a task for…”';
  }
  function restart() { if (!chat) return; try { chat.destroy(); } catch (e) { } chat = null; mount(); focusIn(); }
  function focusIn() { setTimeout(function () { var i = root.querySelector('.ob-in input'); if (i && !matchMedia('(pointer:coarse)').matches) i.focus({ preventScroll: true }); else root.focus(); }, reduce ? 0 : 240); }
  A.open = function (say) {
    if (!root) build();
    if (!open) { open = true; opener = document.activeElement; root.hidden = false; void root.offsetWidth; root.classList.add('on'); document.body.classList.add('asst-on'); var b = document.getElementById('ask-btn'); if (b) b.setAttribute('aria-expanded', 'true'); }
    if (!chat) { root.classList.add('loading'); load(function () { root.classList.remove('loading'); mount(); if (say) chat.send(say); focusIn(); }); }
    else { chat.setContext(ctx()); if (say) chat.send(say); focusIn(); }
  };
  A.close = function () {
    if (!open) return; open = false; root.classList.remove('on'); document.body.classList.remove('asst-on'); var b = document.getElementById('ask-btn'); if (b) b.setAttribute('aria-expanded', 'false');
    setTimeout(function () { if (!open) root.hidden = true; }, reduce ? 0 : 260);
    if (opener && document.body.contains(opener)) try { opener.focus({ preventScroll: true }); } catch (e) { }
  };
  A.toggle = function () { if (open) A.close(); else A.open(); };
  A.isOpen = function () { return open; };
  UI.act('assistant', function () { A.toggle(); });
  UI.act('ask', function (el) { A.open(el.getAttribute('data-q')); });
  document.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && (e.key === 'j' || e.key === 'J')) { e.preventDefault(); A.toggle(); } });
  addEventListener('hashchange', function () { if (chat) try { chat.setContext(ctx()); } catch (e) { } });
})();
