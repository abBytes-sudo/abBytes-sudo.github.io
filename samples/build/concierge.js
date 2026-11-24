/* Brand concierge shell, Sthira copy (portfolio project by Abhishek). Puts the site desk's launcher and dialog on the page and
   lazy-loads the shared, rule-based Orbit engine (samples/assets/bots/) only when it is needed: on the first click, or once
   the page has been idle for 4 s. No LLM, no network calls: everything runs in this browser.
   The brand look lives in concierge.css (data-skin, scoped under .cg--st), the words in assets/bots/agents/builder.js.
   Usage (defer):
     <script src="concierge.js?v=1" defer data-agent="builder" data-skin="concierge.css?v=1" data-brand="st"
       data-title="Sthira site desk" data-sub="Estimates, site surveys and project status" data-label="Ask the site desk"
       data-nudge="estimate,projects,portal"></script>
   Optional: data-assets (path to samples/assets/, default ../assets/), data-v (cache version for the engine files).
   Any element with data-concierge="<button value>" (e.g. "flow:survey") opens the chat and runs that step.
   Sthira extras: programme cards become a drawn Gantt with a red-pencil "today" line, date and time chips become a
   schedule strip, the estimate figure gets a red-pencil ring, and the title block's revision letter steps up with every
   record the desk files for the visitor (estimate, survey, handover). */
(function () {
  'use strict';
  var me = document.currentScript;
  function A(k, d) { var v = me && me.getAttribute('data-' + k); return v == null || v === '' ? d : v; }
  var AGENT = A('agent'), BRAND = A('brand', 'cg'), ASSETS = A('assets', '../assets/'), V = A('v', '1'), SKIN = A('skin', ''), TITLE = A('title', 'Site desk'), SUB = A('sub', 'Replies instantly'), LABEL = A('label', 'Ask us'), NUDGE = A('nudge', '');
  if (!AGENT || window.__cgOn) return; window.__cgOn = 1;
  var doc = document, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, sheetMQ = matchMedia('(max-width: 560px)');
  var touch = matchMedia('(pointer: coarse)').matches;
  function el(t, c, h) { var e = doc.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var ICON = {
    wa: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.8 2c0 1.2.9 2.3 1 2.5.1.1 1.7 2.6 4.1 3.7 1.5.7 2.1.7 2.9.6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.2z"/></svg>',
    person: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" aria-hidden="true"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.9-3.6 3.7-5.4 7.2-5.4s6.3 1.8 7.2 5.4"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" aria-hidden="true"><path d="M14.5 6l-6 6 6 6"/></svg>',
    restart: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.3-5.4M4.5 4.5v4h4"/></svg>'
  };
  // the launcher: a drawing grid bubble on its grid line, a crane hook hanging off it, and a dimension tick under it
  var MARK = '<svg viewBox="0 0 64 64" aria-hidden="true">' +
    '<path class="gl" d="M32 0V9M32 55V64"/>' +
    '<circle class="bub" cx="32" cy="32" r="21.5"/><circle class="bub2" cx="32" cy="32" r="18.5"/>' +
    '<text class="ltr" x="32" y="39.5">S</text>' +
    '<path class="xx" d="M25.5 25.5l13 13M38.5 25.5l-13 13"/>' +
    '<g class="hook"><path class="cab" d="M50 2V15"/><path class="hk" d="M50 15v3.2a3 3 0 1 1-3 3"/><rect class="blk" x="47.6" y="11" width="4.8" height="4" /></g>' +
    '<g class="dim"><path d="M10 59h44M10 56v6M54 56v6"/><path class="tick" d="M8.5 60.5l3-3M52.5 60.5l3-3"/></g></svg>';

  /* ---------- DOM: launcher, nudge and dialog ---------- */
  var root = el('div', 'cg cg--' + BRAND); root.setAttribute('data-state', 'closed'); root.setAttribute('data-lenis-prevent', '');
  var pid = 'cg-' + AGENT, d0 = new Date(2026, 10, 24), dstr = ('0' + d0.getDate()).slice(-2) + '.' + ('0' + (d0.getMonth() + 1)).slice(-2) + '.' + String(d0.getFullYear()).slice(2);
  root.innerHTML =
    '<div class="cg-nudge" role="status" hidden><span class="cg-rev" aria-hidden="true"><svg viewBox="0 0 20 18"><path d="M10 1.5L18.5 16.5H1.5Z"/><text x="10" y="14">1</text></svg></span><button type="button" class="cg-nudge-go"><span class="cg-nudge-t"></span><span class="cg-nudge-cta">Yes, show me</span></button><button type="button" class="cg-nudge-x" aria-label="Dismiss this suggestion">' + ICON.x + '</button></div>' +
    '<div class="cg-panel" id="' + pid + '" role="dialog" aria-labelledby="' + pid + '-t" aria-describedby="' + pid + '-d" hidden tabindex="-1">' +
      '<div class="cg-hd"><span class="cg-av" aria-hidden="true">S</span><div class="cg-ti"><b id="' + pid + '-t">' + esc(TITLE) + '</b><small class="cg-st" aria-live="polite">' + esc(SUB) + '</small></div>' +
        '<div class="cg-acts"><button type="button" class="cg-ib" data-cg="restart" aria-label="Start over" title="Start over">' + ICON.restart + '</button><button type="button" class="cg-ib" data-cg="wa" aria-label="Continue on WhatsApp" title="Continue on WhatsApp">' + ICON.wa + '</button><button type="button" class="cg-ib" data-cg="person" aria-label="Talk to a person" title="Talk to a person">' + ICON.person + '</button><button type="button" class="cg-ib cg-close" data-cg="close" aria-label="Close chat" title="Close (Esc)">' + ICON.x + '</button></div></div>' +
      '<div class="cg-tb" aria-hidden="true"><span><i>Desk</i>Site desk</span><span><i>Sheet</i>01</span><span class="cg-revc"><i>Rev</i><b>—</b></span><span><i>Date</i>' + dstr + '</span></div>' +
      '<div class="cg-body"><div class="cg-web"></div><div class="cg-wapp" hidden><div class="cg-wbar"><button type="button" class="cg-ib" data-cg="web" aria-label="Back to the website chat">' + ICON.back + '</button><span><b>Sthira on WhatsApp</b><small>Same site desk, in the app you already use</small></span><button type="button" class="cg-ib" data-cg="close" aria-label="Close chat">' + ICON.x + '</button></div><div class="cg-wahost"></div></div>' +
        '<div class="cg-load" aria-hidden="true"><span></span><span></span><span></span></div></div>' +
      '<p class="cg-d" id="' + pid + '-d"><i aria-hidden="true"></i>Answers from Sthira’s own rates and site records · an engineer can join any time</p>' +
    '</div>' +
    '<button type="button" class="cg-launch" aria-haspopup="dialog" aria-expanded="false" aria-controls="' + pid + '" aria-label="' + esc(LABEL) + '"><span class="cg-lab" aria-hidden="true"><b>' + esc(LABEL) + '</b><small>Estimates · surveys · status</small></span><span class="cg-mark" aria-hidden="true">' + MARK + '</span><span class="cg-ping" aria-hidden="true"></span></button>';
  var $ = function (s) { return root.querySelector(s); };
  var panel = $('.cg-panel'), launch = $('.cg-launch'), webHost = $('.cg-web'), waWrap = $('.cg-wapp'), waHost = $('.cg-wahost'), st = $('.cg-st'), nudge = $('.cg-nudge');

  /* the skin loads without blocking the page; the launcher appears once it has landed, and says its name once */
  function skin(href, cb) { if (!href) { cb(); return; } var l = el('link'); l.rel = 'stylesheet'; l.href = href; l.onload = l.onerror = function () { cb(); }; doc.head.appendChild(l); }
  function mountDom() {
    doc.body.appendChild(root); if (doc.getElementById('tb')) root.classList.add('cg-tbk');
    skin(SKIN, function () { requestAnimationFrame(function () { root.classList.add('cg-in'); if (!reduce && !ss('cg-hello-' + AGENT)) { ss('cg-hello-' + AGENT, '1'); setTimeout(function () { root.classList.add('cg-hello'); setTimeout(function () { root.classList.remove('cg-hello'); }, 2600); }, 900); } }); });
  }
  if (doc.body) mountDom(); else doc.addEventListener('DOMContentLoaded', mountDom);

  /* ---------- lazy engine (and the firm's data, if this page has not loaded it yet) ---------- */
  var ready = false, loading = null, waiters = [];
  function load(cb) {
    if (ready) { if (cb) cb(); return; } if (cb) waiters.push(cb); if (loading) return; loading = true;
    var b = ASSETS + 'bots/', list = [b + 'engine.js?v=' + V, b + 'ui.js?v=' + V, b + 'agents/' + AGENT + '.js?v=' + V];
    if (!window.STHIRA) list.unshift('data.js?v=' + V);
    var css = el('link'); css.rel = 'stylesheet'; css.href = b + 'bots.css?v=' + V; doc.head.insertBefore(css, doc.head.querySelector('link[href*="' + SKIN.split('?')[0] + '"]'));
    var n = 0; list.forEach(function (src) { var s = el('script'); s.src = src; s.async = false; s.onload = s.onerror = function () { if (++n === list.length) { ready = !!(window.Orbit && Orbit.mount && Orbit.agents[AGENT]); var w = waiters; waiters = []; w.forEach(function (f) { try { f(); } catch (e) {} }); } }; doc.head.appendChild(s); });
  }
  function idle() { var go = function () { load(); }; if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 2500 }); else setTimeout(go, 200); }
  if (doc.readyState === 'complete') setTimeout(idle, 4000); else addEventListener('load', function () { setTimeout(idle, 4000); });

  /* ---------- context: which page (and which case study) the visitor is on ---------- */
  function pageOf(file) { if (!file || file === 'index') return 'home'; if (/^project-/.test(file) || file === 'project') return 'project'; return file; }
  function context() {
    var q = new URLSearchParams(location.search), file = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index', c = { page: pageOf(doc.body.getAttribute('data-page') || file), file: file };
    q.forEach(function (v, k) { if (/^(id|c|t|a|f|s)$/.test(k)) c[k === 'id' ? 'id' : 'q_' + k] = v; });
    var cs = doc.getElementById('cs'); if (cs && cs.getAttribute('data-id')) c.id = cs.getAttribute('data-id'); else if (/^project-/.test(file)) c.id = file.slice(8);
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
  // Esc closes from anywhere while open (a tapped quick reply is removed from the page, so focus can drop to <body>)
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open && (root.contains(e.target) || e.target === doc.body || e.target === doc.documentElement)) { e.stopPropagation(); hide(); } });
  root.addEventListener('keydown', function (e) {
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
    watch(chat); revWatch();
    pend.splice(0).forEach(function (b) { chat.choose(b); });
  }
  // a person's reply typed in the back office in another tab arrives as a storage "sync": draw anything new
  function watch(m) {
    m._off = Orbit.convos.on(function (ev) {
      if (!ev || ev.type !== 'sync') return; var c = Orbit.convos.get(m.session.id), ch = m.chat; if (!c || !ch) return;
      c.messages.forEach(function (msg) { if ((msg.from === 'agent' || msg.from === 'system') && msg.id && !ch.rendered[msg.id]) ch.onMsg(Object.assign({ delay: 400 }, msg)); });
    });
  }
  // the title block's revision letter: one step per record filed for this visitor
  var rev = 0, revOff = null;
  function revWatch() {
    if (revOff) return; var cell = $('.cg-revc b');
    revOff = Orbit.leads.on(function (l) {
      var ids = [chat && chat.session.id, wa && wa.session.id]; if (!l || !l.payload || ids.indexOf(l.payload.convo) < 0) return;
      rev++; cell.textContent = String.fromCharCode(64 + Math.min(rev, 26)); var c = cell.parentNode; c.classList.remove('cg-bump'); void c.offsetWidth; c.classList.add('cg-bump');
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
  // run a step from anywhere on the page: <a data-concierge="flow:survey">Book a survey in chat</a>
  doc.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-concierge]'); if (!t || root.contains(t)) return; e.preventDefault();
    var b = { label: t.getAttribute('data-concierge-label') || t.textContent.trim().slice(0, 60), value: t.getAttribute('data-concierge') };
    if (chat) { show(); chat.choose(b); } else { pend.push(b); show(); }
  });

  /* ---------- drawing-sheet details drawn over the shared chat ---------- */
  var DATE_RE = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (\d{1,2}) ([A-Z][a-z]{2})$/, TIME_RE = /^\d{1,2}:\d{2} (am|pm)$/, ROW_RE = /^(.*?) · (wk|day) (\d+)–(\d+)$/;
  var RING = '<svg class="cg-ring" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M18 34C14 14 70 5 112 6c44 1 82 9 80 26-2 18-58 25-104 23C44 53 8 46 12 30c3-12 30-19 58-21"/></svg>';
  function programme(card) {
    var lis = [].slice.call(card.querySelectorAll('.ob-meta li')), rows = [], max = 0, tt = card.querySelector('.ob-title'), now = tt && tt.textContent.match(/^Day (\d+) of (\d+)/);
    lis.forEach(function (li) { var m = li.textContent.match(ROW_RE); if (m) { rows.push({ li: li, name: m[1], u: m[2], a: +m[3], b: +m[4] }); if (+m[4] > max) max = +m[4]; } else li.classList.add('cg-gn'); });
    if (!rows.length) return; if (now) max = +now[2]; card.classList.add('cg-prog');
    var start = rows[0].u === 'day' ? 0 : 1, span = max - start + 1, at = now ? (+now[1] - start) / span * 100 : -1;
    rows.forEach(function (r, i) {
      var left = (r.a - start) / span * 100, w = Math.max(1.5, (r.b - r.a + 1) / span * 100), done = now && r.b <= +now[1], cur = now && r.a <= +now[1] && r.b > +now[1];
      r.li.className = 'cg-gr' + (done ? ' done' : '') + (cur ? ' cur' : '');
      r.li.style.setProperty('--i', i);
      r.li.innerHTML = '<span class="cg-gl">' + esc(r.name) + '</span><span class="cg-gt"><i style="left:' + left.toFixed(2) + '%;width:' + w.toFixed(2) + '%"></i>' + (at >= 0 ? '<b class="cg-now" style="left:' + at.toFixed(2) + '%"></b>' : '') + '</span><span class="cg-gw">' + (r.u === 'wk' ? 'wk ' : 'd ') + r.a + '–' + r.b + '</span>';
    });
    if (at >= 0) { var ul = card.querySelector('.ob-meta'); ul.style.setProperty('--now', at.toFixed(2) + '%'); ul.setAttribute('data-now', 'day ' + now[1]); }
  }
  function enhance(n) {
    if (!n || n.nodeType !== 1) return;
    [].slice.call(n.matches && n.matches('.ob-card') ? [n] : n.querySelectorAll('.ob-card')).forEach(function (card) {
      if (card.__st || card.closest('.cg-wapp')) return; card.__st = 1; var bd = card.querySelector('.ob-badge'), b = bd ? bd.textContent : '';
      if (b === 'Programme') programme(card);
      if (b === 'Estimate') { var t = card.querySelector('.ob-title'); if (t) t.innerHTML = '<span class="cg-red">' + t.innerHTML + RING + '</span>'; card.classList.add('cg-est'); }
      if (b === 'Booked') card.classList.add('cg-ok');
    });
    [].slice.call(n.matches && n.matches('.ob-chip') ? [n] : n.querySelectorAll('.ob-chip')).forEach(function (ch) {
      if (ch.__st || ch.closest('.cg-wapp')) return; ch.__st = 1; var sp = ch.querySelector('span'), tx = sp ? sp.textContent : '', m = tx.match(DATE_RE);
      if (m) { ch.classList.add('cg-date'); sp.innerHTML = '<small>' + m[1] + '</small><b>' + m[2] + '</b><small>' + m[3] + '</small>'; var ic = ch.querySelector('.ob-i'); if (ic) ic.remove(); if (ch.parentNode) ch.parentNode.classList.add('cg-cal'); }
      else if (TIME_RE.test(tx)) { ch.classList.add('cg-time'); var ic2 = ch.querySelector('.ob-i'); if (ic2) ic2.remove(); if (ch.parentNode) ch.parentNode.classList.add('cg-cal'); }
    });
    var enc = n.matches && n.matches('.ob-enc') ? n : n.querySelector && n.querySelector('.ob-enc'); if (enc) enc.textContent = 'Messages stay in this browser. Sthira’s site desk replies here.';
  }
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      [].forEach.call(m.addedNodes, enhance);
      if (m.target && m.target.classList && m.target.classList.contains('ob-qr')) { var q = m.target; if (!q.querySelector('.cg-date,.cg-time')) q.classList.remove('cg-cal'); }
    });
  }).observe(root, { childList: true, subtree: true });

  /* ---------- craft: haptic press, chip-to-bubble morph ---------- */
  function buzz() { if (touch && navigator.vibrate) try { navigator.vibrate(7); } catch (e) {} }
  root.addEventListener('click', function (e) {
    var chip = e.target.closest('.ob-chip,.ob-cbtn'); if (!chip) return; buzz();
    setTimeout(function () { if (open && (!doc.activeElement || doc.activeElement === doc.body)) { var i = (waWrap.hidden ? webHost : waHost).querySelector('.ob-in input'); try { (touch || !i ? panel : i).focus({ preventScroll: true }); } catch (x) {} } }, 60);
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
  // the chat sent the visitor to another page (the estimator, a case study, the portal): reopen it there
  if (ss('cg-reopen-' + AGENT)) { try { sessionStorage.removeItem('cg-reopen-' + AGENT); } catch (e) {} var re = function () { setTimeout(show, 350); }; if (doc.readyState === 'complete') re(); else addEventListener('load', re); }

  window.Concierge = { open: show, close: hide, load: load, nudge: showNudge, chat: function () { return chat; }, wa: function () { return wa; }, run: function (b) { if (chat) { show(); chat.choose(b); } else { pend.push(b); show(); } } };
})();
