/* ORBIT ASSISTANTS CRM workspace skin. Needs engine.js and agents/crm.js first (ui.js is not required).
     Orbit.mountCrm(el, { biz: 'realty' }) -> { destroy(), setBiz(id), refresh(), session, root }
        biz: realty | support | build | clinic | salon | dining.   el must have a height (the workspace fills it with height:100%).
   Left: the Today lead list (live, updates on every chat action and when a visitor creates a lead in that business's customer chat).
   Right: the "CRM assistant" chat. All actions go through the scripted agent (agents/crm.js); this file only renders and wires events. No network. */
(function (root) {
  'use strict';
  var O = root.Orbit; if (!O || O.mountCrm) return;
  var doc = root.document, esc = O.esc, uidN = 0;
  function el(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function isReduce() { try { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }
  function fmt(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); }
  function hm(ts) { var d = new Date(ts || Date.now()); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function two(n) { return ('0' + n).slice(-2); }
  function isoOf(d) { return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()); }
  function dayPlus(n) { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d; }
  function rgb(hex) { var n = parseInt(String(hex).replace('#', ''), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function lum(c) { var f = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; }
  function inkFor(hex) { return lum(rgb(hex)) > 0.3 ? '#121212' : '#FFFFFF'; }
  /* darker accent for text on white and on the soft tint: accent mixed with black, from 40% black up until contrast >= 5 */
  function txFor(hex) { var c = rgb(hex), k, m, soft; for (k = 0.4; k <= 0.8; k += 0.025) { m = c.map(function (v) { return Math.round(v * (1 - k)); }); soft = c.map(function (v) { return Math.round(255 - (255 - v) * 0.16); }); if (1.05 / (lum(m) + 0.05) >= 5 && (lum(soft) + 0.05) / (lum(m) + 0.05) >= 4.5) break; } return 'rgb(' + m.join(',') + ')'; }
  var IDS = ['realty', 'support', 'build', 'clinic', 'salon', 'dining'];
  var ZERO_SVG = '<svg class="ocrm-zsvg" viewBox="0 0 120 92" width="112" height="86" fill="none" aria-hidden="true" focusable="false"><path class="t" d="M16 54l15-27h58l15 27v22a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6z"/><path class="t" d="M16 54h29a7 7 0 0 0 7 7h16a7 7 0 0 0 7-7h29"/><circle class="a0" cx="60" cy="30" r="16"/><path class="a ck" d="M52 30.5l6 6 10.5-12"/><path class="a sp" d="M92 12v7M88.5 15.5h7M26 16v5M23.5 18.5h5M100 36v4M98 38h4"/></svg>';
  var CHEV = '<svg class="ocrm-chev" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>';

  function Crm(host, biz) {
    var self = this; this.host = host; this.id = ++uidN; this.biz = IDS.indexOf(biz) >= 0 ? biz : 'realty'; this.filter = 'today'; this.sel = null; this.timers = []; this.unsubs = []; this.queue = []; this.busy = false; this.prevIds = null; this.lastQR = null; this.sessUnsub = null;
    this.root = el('div', 'ocrm'); var rid = 'ocrm' + this.id;
    this.root.innerHTML =
      '<button type="button" class="ocrm-strip" aria-expanded="false" aria-controls="' + rid + '-side"><span class="ocrm-strip-t">Today</span><span class="ocrm-strip-new" hidden></span>' + CHEV + '</button>' +
      '<aside class="ocrm-side" id="' + rid + '-side" aria-label="Today\'s leads">' +
        '<div class="ocrm-sh"><h3>Today</h3><span class="ocrm-count" aria-live="polite"></span></div>' +
        '<div class="ocrm-tabs" role="group" aria-label="Lead filter"><button type="button" data-f="today" aria-pressed="true">Today</button><button type="button" data-f="open" aria-pressed="false">All open</button><button type="button" data-f="closed" aria-pressed="false">Closed</button></div>' +
        '<div class="ocrm-zero" hidden><div class="ocrm-zero-art">' + ZERO_SVG + '</div><p><b>Inbox zero, nice work.</b><br><span>No follow-ups due today.</span></p></div>' +
        '<ul class="ocrm-list" data-lenis-prevent></ul>' +
      '</aside>' +
      '<section class="ocrm-chat" aria-label="CRM assistant">' +
        '<header class="ocrm-hd"><span class="ocrm-mark" aria-hidden="true">CR</span><div class="ocrm-hdt"><div class="ocrm-hd1"><b>CRM assistant</b><span class="ocrm-biz"></span></div><small class="ocrm-hd2"></small></div></header>' +
        '<div class="ocrm-log" role="log" aria-live="polite" aria-label="Conversation with the CRM assistant" tabindex="0" data-lenis-prevent></div>' +
        '<div class="ocrm-qr" role="group" aria-label="Quick replies"></div>' +
        '<form class="ocrm-in"><label class="ocrm-sr" for="' + rid + '-i">Message the CRM assistant</label><input id="' + rid + '-i" type="text" autocomplete="off" placeholder="Ask, or tell me what to do…"><button type="submit">Send</button></form>' +
      '</section>' +
      '<div class="ocrm-sheet" role="dialog" aria-modal="false" aria-label="Lead details" hidden></div>';
    this.q = function (s) { return self.root.querySelector(s); };
    this.strip = this.q('.ocrm-strip'); this.list = this.q('.ocrm-list'); this.zero = this.q('.ocrm-zero'); this.log = this.q('.ocrm-log'); this.qr = this.q('.ocrm-qr'); this.input = this.q('.ocrm-in input'); this.sheet = this.q('.ocrm-sheet');
    this.wire(); host.innerHTML = ''; host.appendChild(this.root); this.applyReduce(); this.open(this.biz, true);
    var rm = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)'); if (rm && rm.addEventListener) { var f = function () { self.applyReduce(); }; try { rm.addEventListener('change', f); this.unsubs.push(function () { rm.removeEventListener('change', f); }); } catch (e) {} }
    this.unsubs.push(O.leads.on(function () { self.refresh(); })); if (O.crm && O.crm.on) this.unsubs.push(O.crm.on(function (ev) { if (ev.biz === self.biz) self.refresh(ev.ids); }));
    this.timers.push(setInterval(function () { self.refresh(); }, 45000));
  }
  var P = Crm.prototype;
  P.applyReduce = function () { this.reduce = isReduce(); this.root.classList.toggle('ocrm--reduce', this.reduce); };
  P.api = function () { return O.crm.api; };

  /* ----- session / theme ----- */
  P.open = function (biz, first) {
    this.biz = biz; if (this.sessUnsub) { this.sessUnsub(); this.sessUnsub = null; } this.queue = []; this.busy = false; this.pendingQR = null; clearTimeout(this.tm); this.log.innerHTML = ''; this.qr.innerHTML = ''; this.sel = null; this.closeSheet(true); this.prevIds = null; this.filter = 'today';
    var a = O.agents[biz] || {}, acc = a.accent || '#C8FF4D', r = this.root; r.setAttribute('data-biz', biz); r.style.setProperty('--ocrm-accent', acc); r.style.setProperty('--ocrm-on', inkFor(acc)); r.style.setProperty('--ocrm-tx', txFor(acc));
    this.q('.ocrm-biz').textContent = a.business || biz; this.q('.ocrm-hd2').textContent = 'Team side of ' + (a.business || biz);
    this.q('.ocrm-tabs').querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-f') === 'today')); });
    var s = O.createSession('crm', { channel: 'crm', context: { biz: biz } }); s.convo.hidden = true; this.session = s; var self = this;
    this.sessUnsub = s.on(function (m) { self.onMsg(m); });
    this.refresh(); s.start(); this.refresh();
    if (this.ctrl) this.ctrl.session = s;
  };

  /* ----- left list ----- */
  P.rowHTML = function (e) {
    var lab = e.name + ', ' + e.source + ', ' + e.stageLabel + ', ' + e.heat + ' lead, ' + (e.ownerName ? 'owner ' + e.ownerName : 'unassigned') + (e.dueState === 'overdue' || e.dueState === 'today' ? ', ' + e.dueLabel.toLowerCase() : '') + (e.fresh ? ', new from your chat' : '');
    return '<li><button type="button" class="ocrm-row heat-' + e.heat + (e.fresh ? ' is-fresh' : '') + (e.closed ? ' is-closed' : '') + (e.id === this.sel ? ' is-sel' : '') + '" data-id="' + esc(e.id) + '" aria-label="' + esc(lab) + '" aria-haspopup="dialog">' +
      (e.fresh ? '<span class="ocrm-new">' + esc(e.freshLabel) + '</span>' : '') +
      '<span class="ocrm-r1"><i class="ocrm-dot" title="' + esc(cap(e.heat)) + '" aria-hidden="true"></i><b class="ocrm-nm">' + esc(e.name) + '</b>' + (e.ownerInitials ? '<span class="ocrm-own" title="Owner: ' + esc(e.ownerName) + '" aria-hidden="true">' + esc(e.ownerInitials) + '</span>' : '<span class="ocrm-own ocrm-own-none" title="Unassigned" aria-hidden="true">–</span>') + '</span>' +
      '<span class="ocrm-r2">' + esc(e.intent) + '</span>' +
      '<span class="ocrm-r3"><span class="ocrm-src src-' + esc(e.channel) + '">' + esc(e.source) + '</span><span class="ocrm-stage st-' + esc(e.stage) + '">' + esc(e.stageLabel) + '</span>' + (e.dueState === 'overdue' ? '<span class="ocrm-due is-over">Overdue</span>' : e.dueState === 'today' ? '<span class="ocrm-due">Due today</span>' : '') + '</span></button></li>';
  };
  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  P.refresh = function (changed) {
    var v; try { v = this.api().view(this.session); } catch (e) { return; } this.v = v; var self = this, ids = {}, act = doc.activeElement, focusId = act && act.classList && act.classList.contains('ocrm-row') && this.root.contains(act) ? act.getAttribute('data-id') : null, hl = {};
    (changed || []).forEach(function (i) { hl[i] = 1; });
    v.all.forEach(function (e) { ids[e.id] = 1; if (self.prevIds && !self.prevIds[e.id]) hl[e.id] = 1; }); this.prevIds = ids;
    var list = this.filter === 'open' ? v.open : this.filter === 'closed' ? v.closed : v.today, n = v.today.length, fresh = v.all.filter(function (e) { return e.fresh; }).length;
    this.q('.ocrm-count').textContent = n + (n === 1 ? ' lead' : ' leads'); this.q('.ocrm-strip-t').textContent = 'Today · ' + n + (n === 1 ? ' lead' : ' leads');
    var sn = this.q('.ocrm-strip-new'); sn.hidden = !fresh; sn.textContent = fresh ? fresh + ' new' : '';
    this.q('.ocrm-tabs').querySelector('[data-f="open"]').textContent = 'All open (' + v.open.length + ')'; this.q('.ocrm-tabs').querySelector('[data-f="closed"]').textContent = 'Closed (' + v.closed.length + ')'; this.q('.ocrm-tabs').querySelector('[data-f="today"]').textContent = 'Today (' + n + ')';
    this.zero.hidden = !v.zero; this.root.classList.toggle('ocrm--zero', !!v.zero);
    this.list.innerHTML = list.length ? list.map(function (e) { return self.rowHTML(e); }).join('') : '<li class="ocrm-none">' + (this.filter === 'closed' ? 'Nothing closed or snoozed yet.' : 'No leads here right now.') + '</li>';
    var hlIds = Object.keys(hl); if (hlIds.length) this.highlight(hlIds);
    if (focusId) { var f = this.list.querySelector('[data-id="' + focusId + '"]'); if (f) f.focus(); }
    if (this.sel && !this.sheet.hidden) this.renderSheet(this.sel);
  };
  P.highlight = function (ids) {
    var self = this, rows = []; ids.forEach(function (id) { var r = self.list.querySelector('[data-id="' + id + '"]'); if (r) { r.classList.add('ocrm-hl'); rows.push(r); } });
    if (this.reduce) this.strip.classList.add('ocrm-hl'); else { this.strip.classList.remove('ocrm-hl'); void this.strip.offsetWidth; if (ids.length) this.strip.classList.add('ocrm-hl'); }
    if (rows.length || ids.length) { clearTimeout(this.hlTm); this.hlTm = setTimeout(function () { self.root.querySelectorAll('.ocrm-hl').forEach(function (r) { r.classList.remove('ocrm-hl'); }); }, 1700); }
  };

  /* ----- detail sheet ----- */
  P.openSheet = function (id) { this.sel = id; this.renderSheet(id); this.sheet.hidden = false; this.root.classList.add('ocrm--sheet'); this.list.querySelectorAll('.ocrm-row').forEach(function (r) { r.classList.toggle('is-sel', r.getAttribute('data-id') === id); }); var b = this.sheet.querySelector('.ocrm-back'); if (b) b.focus(); };
  P.closeSheet = function (quiet) {
    var id = this.sel; this.sheet.hidden = true; this.sheet.innerHTML = ''; this.root.classList.remove('ocrm--sheet'); this.sel = null; this.list.querySelectorAll('.is-sel').forEach(function (r) { r.classList.remove('is-sel'); });
    if (!quiet && id) { var r = this.list.querySelector('[data-id="' + id + '"]'); if (r) r.focus(); }
  };
  P.renderSheet = function (id) {
    var v = this.v || this.api().view(this.session), e = v.byId[id], self = this; if (!e) { this.closeSheet(true); return; } var pk = this.pick || '';
    var rows = [['Intent', e.intent], ['Value', e.valueLabel], ['Owner', e.ownerName || 'Unassigned'], ['Last contact', e.lastContact], ['Follow-up', e.dueLabel], ['Waiting for a reply', e.waitH >= 1 ? Math.round(e.waitH) + ' h' : 'No'], [e.booked ? 'Booked' : 'Booking', e.booked ? (e.when || 'Yes') : 'Not yet'], ['Phone', e.phone]];
    if (e.notes) rows.push(['Notes', e.notes]); (e.hl || []).forEach(function (p) { rows.push([p[0], p[1]]); });
    var team = v.team, quick = e.closed ? '' : '<div class="ocrm-qa" role="group" aria-label="Quick actions"><button type="button" data-qa="draft">Draft WhatsApp</button><button type="button" data-qa="assign" aria-expanded="' + (pk === 'assign') + '">Assign…</button><button type="button" data-qa="snooze" aria-expanded="' + (pk === 'snooze') + '">Snooze…</button><button type="button" data-qa="won">Won</button><button type="button" data-qa="lost">Lost</button></div>';
    var picker = '';
    if (pk === 'assign') picker = '<div class="ocrm-pick" role="group" aria-label="Assign to">' + team.map(function (t) { return '<button type="button" data-as="' + esc(t.id) + '"' + (e.owner === t.id ? ' aria-current="true"' : '') + '><span class="ocrm-own" aria-hidden="true">' + esc(t.initials) + '</span>' + esc(t.name.split(' ')[0]) + ' <small>' + t.load + ' open</small></button>'; }).join('') + '</div>';
    if (pk === 'snooze') picker = '<div class="ocrm-pick" role="group" aria-label="Snooze until">' + [['Tomorrow', dayPlus(1)], ['In 3 days', dayPlus(3)], ['Next Monday', this.api().nextMon()], ['In a week', dayPlus(7)]].map(function (x) { return '<button type="button" data-sn="' + isoOf(x[1]) + '" data-snl="' + esc(O.fmtDay(x[1])) + '">' + x[0] + ' <small>' + O.fmtDay(x[1]).split(' ').slice(0, 2).join(' ') + '</small></button>'; }).join('') + '</div>';
    this.sheet.innerHTML = '<div class="ocrm-sh2"><button type="button" class="ocrm-back"><span aria-hidden="true">‹</span> Back to list</button></div><div class="ocrm-sb">' +
      (e.fresh ? '<p class="ocrm-new ocrm-new-s">' + esc(e.freshLabel) + '</p>' : '') + '<h4 class="ocrm-sn">' + esc(e.name) + '</h4><div class="ocrm-chips"><span class="ocrm-src src-' + esc(e.channel) + '">' + esc(e.source) + '</span><span class="ocrm-stage st-' + esc(e.stage) + '">' + esc(e.stageLabel) + '</span><span class="ocrm-heat heat-' + e.heat + '"><i class="ocrm-dot" aria-hidden="true"></i>' + cap(e.heat) + ' ' + e.score + '</span></div>' + quick + picker +
      '<dl class="ocrm-dl">' + rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('') + '</dl></div>';
    this.sheet.setAttribute('aria-label', 'Lead details: ' + e.name);
  };
  P.quick = function (kind, val, extra) {
    var s = this.session, e = this.v.byId[this.sel], mobile = root.matchMedia && root.matchMedia('(max-width: 760px)').matches; if (!e) return;
    if (kind === 'draft') this.chat({ label: 'Draft a WhatsApp to ' + e.name, value: 'act:draft:' + e.id });
    else if (kind === 'assign') { var t = this.v.team.filter(function (x) { return x.id === val; })[0]; this.chat({ label: 'Assign ' + e.name + ' to ' + (t ? t.name : val), value: 'act:assign:' + e.id + '|' + val }); }
    else if (kind === 'snooze') this.chat({ label: 'Snooze ' + e.name + ' till ' + extra, value: 'act:snooze:' + e.id + '|' + val });
    else if (kind === 'won') this.chat({ label: 'Mark ' + e.name + ' as won', value: 'act:won:' + e.id });
    else if (kind === 'lost') this.chat({ label: 'Mark ' + e.name + ' as lost', value: 'act:lost:' + e.id });
    this.pick = ''; if (mobile) { this.closeSheet(true); this.setOpen(false); this.input.focus(); } else if (this.sel) this.renderSheet(this.sel);
  };

  /* ----- chat ----- */
  P.guard = function () { var c = this.session.convo; if (c.status !== 'bot') { c.status = 'bot'; try { O.convos.setStatus(c.id, 'bot'); } catch (e) {} } };
  P.flush = function () { clearTimeout(this.tm); this.typing(false); while (this.queue.length) this.addBot(this.queue.shift()); this.busy = false; };
  P.say = function (t) { t = String(t).trim(); if (!t) return; this.flush(); this.clearQR(); this.guard(); this.session.send(t); };
  P.chat = function (btn) { this.flush(); this.clearQR(); this.guard(); this.session.choose(btn); };
  P.clearQR = function () { this.qr.innerHTML = ''; };
  P.scroll = function () { this.log.scrollTop = this.log.scrollHeight; };
  P.onMsg = function (m) {
    if (m.from === 'user') { this.addUser(m); return; }
    this.queue.push(m); this.pump();
  };
  P.pump = function () {
    var self = this; if (this.busy || !this.queue.length) return; this.busy = true; var m = this.queue.shift(), d = this.reduce ? 0 : Math.min(m.delay == null ? 160 : m.delay, 320);
    if (d > 60) this.typing(true);
    this.tm = setTimeout(function () { self.typing(false); self.addBot(m); self.busy = false; self.pump(); }, d);
  };
  P.typing = function (on) { if (this.dots) { this.dots.remove(); this.dots = null; } if (on) { this.dots = el('div', 'ocrm-m ocrm-bot ocrm-typing', '<span></span><span></span><span></span>'); this.dots.setAttribute('aria-label', 'The assistant is typing'); this.log.appendChild(this.dots); this.scroll(); } };
  P.addUser = function (m) { this.log.appendChild(el('div', 'ocrm-m ocrm-user', '<p>' + fmt(m.text) + '</p><span class="ocrm-ts">' + hm(m.ts) + '</span>')); this.scroll(); };
  P.addBot = function (m) {
    var self = this, sys = m.kind === 'system' || m.from === 'system', zero = m.kind === 'zero';
    var b = el('div', 'ocrm-m ocrm-bot' + (sys ? ' ocrm-sys' : '') + (zero ? ' ocrm-zero-msg' : ''), (zero ? '<div class="ocrm-zero-art">' + ZERO_SVG + '</div>' : '') + (m.text ? '<p>' + fmt(m.text) + '</p>' : '') + '<span class="ocrm-ts">' + hm(m.ts) + '</span>');
    this.log.appendChild(b);
    if (m.cards && m.cards.length) { var row = el('div', 'ocrm-cards'); m.cards.forEach(function (c) { row.appendChild(self.cardEl(c)); }); this.log.appendChild(row); }
    if (m.buttons && m.buttons.length) this.pendingQR = m.buttons;
    if (!this.queue.length) { this.clearQR(); if (this.pendingQR) { this.showQR(this.pendingQR); this.pendingQR = null; } }
    if (sys) this.guard(); this.scroll();
  };
  P.showQR = function (bs) { var self = this; this.qr.innerHTML = ''; bs.slice(0, 7).forEach(function (b) { self.qr.appendChild(self.btn(b, 'ocrm-chip')); }); };
  P.btn = function (b, cls, card) {
    var self = this, x = el('button', cls, esc(b.label)); x.type = 'button';
    x.addEventListener('click', function () { if (/^act:copy:/.test(b.value) && card && card.draft) { self.copy(card, x); return; } self.chat(b); });
    return x;
  };
  P.copy = function (card, btn) {
    var node = btn.closest('.ocrm-card').querySelector('.ocrm-draft'), st = btn.closest('.ocrm-card').querySelector('.ocrm-copied'), text = card.draft.text, self = this;
    function note(t) { if (st) { st.textContent = t; } }
    function fallback() { try { var r = doc.createRange(); r.selectNodeContents(node); var sel = root.getSelection(); sel.removeAllRanges(); sel.addRange(r); node.focus(); } catch (e) {} note('Select and copy'); }
    try { self.session.event('action', { action: 'draft_copied', lead: card.draft.id }); } catch (e) {}
    try { if (root.navigator && root.navigator.clipboard && root.navigator.clipboard.writeText) { root.navigator.clipboard.writeText(text).then(function () { note('Copied'); }, fallback); return; } } catch (e) {}
    fallback();
  };
  P.cardEl = function (c) {
    var self = this, d = el('div', 'ocrm-card' + (c.heat ? ' heat-' + c.heat : '')), h = '<div class="ocrm-ch">' + (c.heat ? '<i class="ocrm-dot" aria-hidden="true"></i>' : '') + '<b class="ocrm-ct">' + esc(c.title) + '</b>' + (c.badge ? '<span class="ocrm-badge">' + esc(c.badge) + '</span>' : '') + '</div>';
    var rich = c.table || c.kpis || c.bars || c.draft; if (c.sub && !rich) h += '<p class="ocrm-cs">' + esc(c.sub) + '</p>';
    if (c.kpis) h += '<div class="ocrm-kpis">' + c.kpis.map(function (k) { return '<div><b>' + esc(k.value) + '</b><span>' + esc(k.label) + '</span></div>'; }).join('') + '</div>';
    if (c.bars) h += '<div class="ocrm-bars" role="list"' + (c.barsTitle ? ' aria-label="' + esc(c.barsTitle) + '"' : '') + '>' + (c.barsTitle ? '<p class="ocrm-bt">' + esc(c.barsTitle) + '</p>' : '') + c.bars.map(function (b, i) { return '<div class="ocrm-bar" role="listitem" data-p="' + (b.pct || 0) + '"><span>' + esc(b.label) + '</span><i><u></u></i><b>' + esc(b.value) + '</b></div>'; }).join('') + '</div>';
    if (c.table) h += '<div class="ocrm-tw"><table' + (c.table.num ? ' class="is-num"' : '') + '><caption class="ocrm-sr">' + esc(c.title) + '</caption><thead><tr>' + c.table.cols.map(function (x) { return '<th scope="col">' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>' + c.table.rows.map(function (r) { return '<tr>' + r.map(function (x, i) { return (i === 0 ? '<th scope="row">' : '<td>') + esc(x) + (i === 0 ? '</th>' : '</td>'); }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    if (c.draft) h += '<div class="ocrm-draft" tabindex="0" aria-label="WhatsApp draft">' + esc(c.draft.text) + '</div><p class="ocrm-copied" role="status" aria-live="polite"></p>';
    if (c.meta && c.meta.length) h += '<ul class="ocrm-meta">' + c.meta.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    d.innerHTML = h;
    d.querySelectorAll('.ocrm-bar').forEach(function (b) { var u = b.querySelector('u'); if (u) u.style.setProperty('--w', (b.getAttribute('data-p') || 0) + '%'); });
    if (c.buttons && c.buttons.length) { var ca = el('div', 'ocrm-ca'); c.buttons.slice(0, 4).forEach(function (b, i) { ca.appendChild(self.btn(b, 'ocrm-cbtn' + (i === 0 ? ' pri' : ''), c)); }); d.appendChild(ca); }
    return d;
  };

  /* ----- events ----- */
  P.setOpen = function (on) { this.root.classList.toggle('ocrm--open', on); this.strip.setAttribute('aria-expanded', String(on)); };
  P.wire = function () {
    var self = this;
    this.strip.addEventListener('click', function () { self.setOpen(self.strip.getAttribute('aria-expanded') !== 'true'); });
    this.q('.ocrm-tabs').addEventListener('click', function (ev) { var b = ev.target.closest('button[data-f]'); if (!b) return; self.filter = b.getAttribute('data-f'); self.q('.ocrm-tabs').querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); self.refresh(); });
    this.list.addEventListener('click', function (ev) { var b = ev.target.closest('.ocrm-row'); if (b) { self.pick = ''; self.openSheet(b.getAttribute('data-id')); } });
    this.list.addEventListener('keydown', function (ev) { if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return; var rows = [].slice.call(self.list.querySelectorAll('.ocrm-row')), i = rows.indexOf(doc.activeElement); if (i < 0) return; ev.preventDefault(); var n = rows[i + (ev.key === 'ArrowDown' ? 1 : -1)]; if (n) n.focus(); });
    this.sheet.addEventListener('click', function (ev) {
      var t = ev.target.closest('button'); if (!t) return;
      if (t.classList.contains('ocrm-back')) { self.pick = ''; self.closeSheet(); return; }
      var qa = t.getAttribute('data-qa'); if (qa === 'assign' || qa === 'snooze') { self.pick = self.pick === qa ? '' : qa; self.renderSheet(self.sel); var nb = self.sheet.querySelector('[data-qa="' + qa + '"]'); if (nb) nb.focus(); return; }
      if (qa) { self.quick(qa); return; } if (t.hasAttribute('data-as')) { self.quick('assign', t.getAttribute('data-as')); return; } if (t.hasAttribute('data-sn')) self.quick('snooze', t.getAttribute('data-sn'), t.getAttribute('data-snl'));
    });
    this.root.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !self.sheet.hidden) { ev.stopPropagation(); self.pick = ''; self.closeSheet(); } });
    this.q('.ocrm-in').addEventListener('submit', function (ev) { ev.preventDefault(); var v = self.input.value; if (!v.trim()) return; self.input.value = ''; self.say(v); });
  };
  P.destroy = function () {
    this.unsubs.forEach(function (f) { try { f(); } catch (e) {} }); this.unsubs = []; this.timers.forEach(clearInterval); clearTimeout(this.tm); clearTimeout(this.hlTm); if (this.sessUnsub) this.sessUnsub();
    if (this.root.parentNode) this.root.parentNode.removeChild(this.root);
  };

  O.mountCrm = function (host, o) {
    o = o || {}; var c = new Crm(host, o.biz), ctrl = { session: c.session, root: c.root, destroy: function () { c.destroy(); }, setBiz: function (id) { if (IDS.indexOf(id) < 0) return; c.open(id); ctrl.session = c.session; }, refresh: function () { c.refresh(); } };
    c.ctrl = ctrl; return ctrl;
  };
  O.mountCrm.ids = IDS.slice();
})(typeof window !== 'undefined' ? window : globalThis);
