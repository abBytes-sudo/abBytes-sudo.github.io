/* Ordwell — staff back office for the marketing site: walkthrough requests (from pricing.html) as work cards.
   Stage tiles filter, the request's own note sits on top, one-tap outcomes log and move the stage, and
   "Provision workspace" brands the demo app for that company. Stored in localStorage (demo). */
(function () {
  'use strict';
  var OW = window.OW, S = OW.site, esc = S.esc;
  var STAGES = [['new', 'New', '#2E6BD6'], ['contacted', 'Contacted', '#B9790C'], ['demo', 'Walkthrough booked', '#7F55D1'], ['won', 'Won', '#2B8A5A'], ['lost', 'Not a fit', '#9A958B']];
  var OUT = [['demo', '📅', 'Walkthrough booked', 'Booked a 30-minute walkthrough.'], ['contacted', '📞', 'Spoke, follow up', 'Spoke on the phone — sending the pricing deck.'], ['contacted', '⌛', 'No answer', 'No answer — try again tomorrow at 11.'], ['won', '✓', 'Won', 'Signed up — provisioning their workspace.'], ['lost', '✕', 'Not a fit', 'Not a fit right now — needs on-premise hosting.'], ['contacted', '✉', 'Sent pricing', 'Sent the Agency pricing and a sample contract.']];
  var st = { f: '', sel: null };
  var leads = S.readLeads(); if (!leads) { leads = S.seedLeads(); S.saveLeads(leads); }
  function ago(ms) { var s = (Date.now() - ms) / 1000; if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago'; return Math.floor(s / 86400) + 'd ago'; }
  function stage(k) { return STAGES.filter(function (x) { return x[0] === k; })[0] || STAGES[0]; }
  function toast(t) { var d = document.createElement('div'); d.className = 'toast-s'; d.setAttribute('role', 'status'); d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 3200); }
  function draw() {
    var kpi = document.getElementById('st-kpi'), list = document.getElementById('st-list'), det = document.getElementById('st-detail');
    kpi.innerHTML = STAGES.slice(0, 4).map(function (s) { var n = leads.filter(function (l) { return l.stage === s[0]; }).length; return '<button type="button" data-f="' + s[0] + '" aria-pressed="' + (st.f === s[0]) + '"><small>' + s[1] + '</small><b>' + n + '</b></button>'; }).join('');
    var ls = leads.filter(function (l) { return !st.f || l.stage === st.f; });
    list.innerHTML = ls.length ? ls.map(function (l) { var s = stage(l.stage); return '<button type="button" class="lr" role="listitem" data-id="' + l.id + '" aria-current="' + (st.sel === l.id) + '"><span><b>' + esc(l.company) + (l.source === 'Chat' ? ' <span class="src">from chat</span>' : '') + '</b><small>' + esc(l.name) + ' · ' + esc(l.email) + '</small></span><span class="hide-s"><small>' + esc(l.plan) + ' · ' + esc(l.team) + ' people</small></span><span class="hide-s"><small>' + ago(l.at) + '</small></span><span><span class="st" style="--c:' + s[2] + '"><i></i>' + s[1] + '</span></span></button>'; }).join('') : '<p style="padding:28px;text-align:center" class="muted">No requests in this stage. <a href="pricing.html#walkthrough" style="text-decoration:underline">Submit one from the pricing page</a>.</p>';
    var l = leads.filter(function (x) { return x.id === st.sel; })[0];
    if (!l) { det.innerHTML = ''; return; }
    var open = leads.filter(function (x) { return x.stage === 'new' || x.stage === 'contacted'; }), idx = open.indexOf(l);
    det.innerHTML = '<section class="drawer" aria-labelledby="ld-h"><div class="steps"><b>1</b> Read the request <span>→</span><b>2</b> Log how it went <span>→</span><b>3</b> Next step' + (idx > -1 ? '<span style="margin-left:auto">Request ' + (idx + 1) + ' of ' + open.length + ' to work</span>' : '') + '</div>' +
      '<h2 id="ld-h" style="font-size:22px;letter-spacing:-.02em;margin-bottom:4px">' + esc(l.company) + ' <span class="mono" style="color:var(--faint)">' + esc(l.id) + '</span></h2><p class="muted" style="margin-bottom:14px">' + esc(l.name) + ' · ' + esc(l.email) + ' · ' + esc(l.team) + ' people · wants ' + esc(l.plan) + '</p>' +
      '<div class="ctx"><b>' + (l.log.length ? 'Last note:' : 'Their note:') + '</b> ' + esc(l.log.length ? l.log[l.log.length - 1].text : (l.note || 'No note — ask what they run today and how many clients they have.')) + '</div>' +
      '<b style="font-size:14px">How did it go?</b><div class="oc">' + OUT.map(function (o, i) { return '<button type="button" data-out="' + i + '"><span aria-hidden="true">' + o[1] + '</span>' + o[2] + '</button>'; }).join('') + '</div>' +
      '<label for="ld-note" style="font-size:13px;font-weight:500">Note for the next person</label><textarea id="ld-note" class="inp" rows="2" style="margin:6px 0 12px" placeholder="Anything the next person should know"></textarea>' +
      '<div class="cta-row" style="margin-top:0"><button type="button" class="btn pri" id="ld-next">Save &amp; next</button><button type="button" class="btn" id="ld-prov">Provision a branded workspace</button>' + (l.convo ? '<button type="button" class="btn" data-transcript="' + l.convo + '">Open the chat transcript</button>' : '') + '<span class="muted" style="font-size:13px">' + l.log.length + ' note' + (l.log.length === 1 ? '' : 's') + '</span></div>' +
      (l.log.length ? '<div style="margin-top:16px;border-top:1px solid var(--line);padding-top:12px">' + l.log.slice().reverse().map(function (x) { return '<p style="font-size:14px;padding:4px 0"><span class="muted">' + ago(x.at) + ' ·</span> ' + esc(x.text) + '</p>'; }).join('') + '</div>' : '') + '</section>';
    wire(l);
  }
  var picked = null;
  function wire(l) {
    document.querySelectorAll('[data-out]').forEach(function (b) {
      b.addEventListener('click', function () { picked = OUT[+b.getAttribute('data-out')]; document.querySelectorAll('[data-out]').forEach(function (x) { x.style.borderColor = x === b ? 'var(--accent)' : ''; x.style.background = x === b ? 'var(--accent-bg)' : ''; }); var n = document.getElementById('ld-note'); if (!n.value) n.value = picked[3]; n.focus(); });
    });
    document.getElementById('ld-next').addEventListener('click', function () {
      var n = document.getElementById('ld-note').value.trim();
      if (!picked && !n) { toast('Pick an outcome or write a note first'); return; }
      if (picked) l.stage = picked[0];
      l.log.push({ at: Date.now(), text: n || picked[3] }); S.saveLeads(leads);
      toast(esc(l.company) + ' → ' + stage(l.stage)[1]); picked = null;
      var next = leads.filter(function (x) { return (x.stage === 'new' || x.stage === 'contacted') && x.id !== l.id; })[0];
      st.sel = next ? next.id : null; draw();
      var d = document.getElementById('st-detail'); if (d && st.sel) d.scrollIntoView({ block: 'nearest' });
    });
    document.getElementById('ld-prov').addEventListener('click', function () {
      try {
        OW.store.load();
        OW.store.commit('Workspace provisioned for ' + l.company, function (A) { A.brand.name = l.company.replace(/\s*(Co\.|Studio|Works)$/i, '') + ' Workroom'; A.brand.sender = l.company; A.brand.domain = 'work.' + l.company.toLowerCase().replace(/[^a-z0-9]+/g, '') + '.in'; A.brand.domainState = 'pending'; });
      } catch (e) { }
      l.log.push({ at: Date.now(), text: 'Provisioned a branded workspace.' }); S.saveLeads(leads);
      location.href = 'index.html#/settings/brand';
    });
  }
  document.addEventListener('click', function (e) {
    var f = e.target.closest('[data-f]'); if (f) { st.f = st.f === f.getAttribute('data-f') ? '' : f.getAttribute('data-f'); draw(); return; }
    var r = e.target.closest('.lr'); if (r) { st.sel = r.getAttribute('data-id'); picked = null; draw(); var d = document.getElementById('st-detail'); if (d) d.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  });
  /* ---------- conversations (Orbit console, filtered to Ordwell's own assistant) ---------- */
  var con = null, wantSel = null, loading = false;
  function loadEngine(cb) {
    if (window.Orbit && Orbit.console && Orbit.agents['work-sales']) { cb(); return; } if (loading) return; loading = true;
    var b = '../assets/bots/', css = document.createElement('link'); css.rel = 'stylesheet'; css.href = b + 'bots.css?v=5'; document.head.appendChild(css);
    var L = [b + 'engine.js?v=5', b + 'ui.js?v=5', b + 'agents/work.js?v=5'], n = 0;
    L.forEach(function (src) { var s = document.createElement('script'); s.src = src; s.async = false; s.onload = s.onerror = function () { if (++n === L.length) cb(); }; document.head.appendChild(s); });
  }
  function ours() { return (window.Orbit ? Orbit.convos.list() : []).filter(function (c) { return c.agent === 'work-sales' && (c.engaged || c.status !== 'bot'); }); }
  function prune(host) { var ids = {}; ours().forEach(function (c) { ids[(c.user && c.user.name ? c.user.name : 'Visitor') + '|' + (c.agentName || c.agent)] = 1; }); host.querySelectorAll('.obc-list li').forEach(function (li) { var sm = li.querySelector('small'); li.hidden = !!sm && sm.textContent.indexOf('Ordwell') < 0; }); var none = host.querySelector('.obc-none'); if (none) none.textContent = 'No chats yet. Open the product page and ask the assistant something.'; var n = ours().length, c = document.getElementById('st-chatn'); if (c) c.textContent = n ? '· ' + n : ''; }
  function showChat() {
    var host = document.getElementById('st-convos');
    loadEngine(function () {
      if (!con) { con = Orbit.console(host, { name: 'Aditi', role: 'sales', select: false }); new MutationObserver(function () { prune(host); }).observe(host, { childList: true, subtree: true }); prune(host); }
      if (wantSel) { con.select(wantSel); wantSel = null; }
    });
  }
  function tab(k) { document.querySelectorAll('[data-tab]').forEach(function (b) { var on = b.getAttribute('data-tab') === k; b.setAttribute('aria-selected', on); b.setAttribute('aria-pressed', on); }); document.getElementById('pane-req').hidden = k !== 'req'; document.getElementById('pane-chat').hidden = k !== 'chat'; if (k === 'chat') showChat(); }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab]'); if (t) { tab(t.getAttribute('data-tab')); return; }
    var tr = e.target.closest('[data-transcript]'); if (tr) { wantSel = tr.getAttribute('data-transcript'); tab('chat'); }
  });
  if (/#chats?$/.test(location.hash)) tab('chat');
  document.getElementById('st-reset').addEventListener('click', function () { leads = S.seedLeads(); S.saveLeads(leads); st.sel = null; draw(); toast('Leads reset'); });
  st.sel = (leads.filter(function (x) { return x.stage === 'new'; })[0] || {}).id || null;
  draw();
})();
