/* Lumen CRM Pro — records: contacts and companies.
   Shared record-page system (also used by deals.js): typed inline-editable properties with undo + audit,
   many-to-many association boxes, related lists (deals, tasks, notes, files, tickets, quotes, events, sequences),
   activity timeline + per-record history. Lists: saved views, filters (incl. custom fields), sort, inline cell
   editing, selection + bulk actions, CSV export, and a 3-step CSV import wizard with duplicate merge. */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$, V = C.views, page = C.page;
  var P = function () { return C.P(); };
  function RS() { return C.ui.rec || (C.ui.rec = { filter: 'all', mode: 'note', key: null, tab: 'activity' }); }
  function rerender() { C.rerender(); }
  function refFromKey(k) { var p = k.split(':'); return { t: p[0], id: p[1] }; }
  function recOf(r) { return C.recOf(r.t, r.id); }
  function actRef(r) { if (r.t === 'deal') { var d = C.deal(r.id); return { c: d.c, co: d.co, d: d.id }; } if (r.t === 'contact') { var c = C.contact(r.id); return { c: c.id, co: c.co }; } return { co: r.id }; }
  function ownerOf(r) { var o = recOf(r); return o ? o.owner : C.me().name; }

  C.logo = function (name, size) {
    size = size || 28; var h = 0; for (var i = 0; i < name.length; i++) h = (h * 17 + name.charCodeAt(i)) % 360;
    return '<span class="logo-sq" style="--h:' + h + ';width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size * .42) + 'px" aria-hidden="true">' + esc(name.replace(/[^A-Za-z]/g, '').charAt(0)) + '</span>';
  };
  C.idChip = function (id) { return '<span class="idc">' + esc(id) + '</span>'; };
  C.recBack = function (href, label) { return '<a class="crumb-back" href="' + href + '">' + C.ic('chev-l', 14) + label + '</a>'; };
  function keyReset(k) { var u = RS(); if (u.key !== k) { u.key = k; u.filter = 'all'; u.tab = 'activity'; } }
  C.recKeyReset = keyReset;

  // ===== typed, inline-editable properties =====================================================
  C.propPanel = function (obj, rec, opt) {
    opt = opt || {}; var defs = C.fieldDefs(obj).filter(function (f) { return (opt.skip || ['name']).indexOf(f.key) < 0 && (!opt.only || opt.only.indexOf(f.key) > -1); });
    if (obj === 'deal') defs = defs.filter(function (f) { return f.key !== 'pilotReview' || rec.pipe === 'partner'; });
    var sys = defs.filter(function (f) { return f.sys; }), cus = defs.filter(function (f) { return !f.sys; }), canE = C.can('edit', rec);
    var row = function (f) {
      var v = C.getF(rec, f), shown = f.type === 'user' && v ? '<span class="own">' + C.avatar(v, 18) + esc(v) + '</span>' : f.type === 'multi' && v && v.length ? [].concat(v).map(function (x) { return '<span class="tag">' + esc(x) + '</span>'; }).join(' ') : f.type === 'email' && v && v !== '—' ? '<span class="tr">' + esc(v) + '</span>' : esc(C.fmtF(f, v));
      var gate = obj === 'deal' && P().gates.filter(function (g) { return g.on && g.pipe === rec.pipe && g.field === f.key; })[0];
      return '<div class="prop" data-key="' + f.key + '"><dt>' + esc(f.label) + (gate ? '<span class="gate-f" title="Required to enter ' + esc(C.pstage(rec.pipe, gate.stage).label) + '">' + C.ic(C.fieldSet(rec, f.key) ? 'unlock' : 'lock', 11) + '</span>' : '') + '</dt><dd>' +
        (canE ? '<button type="button" class="pv' + (shown ? '' : ' empty') + '" data-act="prop-edit" data-obj="' + obj + '" data-id="' + rec.id + '" data-key="' + f.key + '" aria-label="Edit ' + esc(f.label) + (shown ? '' : ', empty') + '">' + (shown || 'Add ' + esc(f.label.toLowerCase()) + '…') + '</button>' : '<span class="pv ro">' + (shown || '—') + '</span>') + '</dd></div>';
    };
    return '<dl class="props">' + sys.map(row).join('') + '</dl>' + (cus.length ? '<h3 class="props-h">Custom fields <span class="muted sm">' + cus.length + '</span>' + (C.can('settings') ? '<a href="#/settings/fields" class="lnk sm">Manage</a>' : '') + '</h3><dl class="props">' + cus.map(row).join('') + '</dl>' : '') +
      (canE ? '' : '<p class="hint">' + C.ic('lock', 12) + ' Read-only: owned by ' + esc(rec.owner) + '. Your role can view but not edit it.</p>');
  };
  C.acts['prop-edit'] = function (el) {
    var obj = el.dataset.obj, rec = C.recOf(obj, el.dataset.id), f = C.fieldDef(obj, el.dataset.key); if (!rec || !f) return;
    if (!C.can('edit', rec)) { C.deny('edit records owned by others'); return; }
    var dd = el.parentNode, id = 'pe-' + f.key;
    dd.innerHTML = '<form class="pe" data-form="prop-save" data-obj="' + obj + '" data-id="' + rec.id + '" data-key="' + f.key + '"><label class="sr" for="' + id + '">' + esc(f.label) + '</label>' + C.fieldInput(f, C.getF(rec, f), id, f.type === 'select' || f.type === 'user' ? 'data-ch="prop-auto"' : '') +
      (f.type === 'multi' || f.type === 'textarea' ? '<div class="pe-a"><button class="btn sm pri">Save</button><button type="button" class="btn sm ghost" data-act="prop-cancel">Cancel</button></div>' : '') + '</form>';
    var inp = dd.querySelector('input:not([type=checkbox]),select,textarea') || dd.querySelector('input'); if (inp) { inp.focus(); if (inp.tagName === 'INPUT' && inp.type !== 'date' && inp.select) inp.select(); }
  };
  C.chs['prop-auto'] = function (el) { var f = el.closest('form'); if (f) f.requestSubmit(); };
  C.acts['prop-cancel'] = function () { rerender(); };
  document.addEventListener('keydown', function (e) { var f = e.key === 'Escape' && e.target.closest && e.target.closest('form.pe'); if (!f) return; e.stopPropagation(); var k = f.dataset.key; rerender(); var b = $('[data-act="prop-edit"][data-key="' + k + '"]'); if (b) b.focus(); }, true);
  document.addEventListener('focusout', function (e) {
    var f = e.target.closest && e.target.closest('form.pe'); if (!f || f.querySelector('textarea,[type=checkbox]')) return;
    setTimeout(function () { if (document.contains(f) && !f.contains(document.activeElement)) f.requestSubmit(); }, 0);
  });
  C.setProp = function (obj, rec, f, nv, opts) {
    opts = opts || {}; var ov = C.getF(rec, f);
    if (JSON.stringify(ov == null ? '' : ov) === JSON.stringify(nv == null ? '' : nv)) return false;
    C.setF(rec, f, nv);
    var ref = C.refOf(obj, rec);
    if (f.key === 'owner') { C.audit('assign', ref, 'Owner', ov, nv); if (nv && nv !== C.me().name) C.notify(C.me().name.split(' ')[0] + ' assigned you ' + rec.name, C.refHref(ref), 'user', nv); }
    else C.audit('update', ref, f.label, C.fmtF(f, ov), C.fmtF(f, nv));
    if (obj === 'deal' && C.pstage(rec.pipe, rec.stage).won && rec.pipe === 'sales') C.bridgeWon(rec);
    C.save();
    if (!opts.quiet) C.toast(f.label + (nv === '' || nv == null || (Array.isArray(nv) && !nv.length) ? ' cleared' : ' updated'), { icon: 'check', undo: function () { C.setF(rec, f, ov); C.audit('update', ref, f.label, C.fmtF(f, nv), C.fmtF(f, ov) + ' (undo)'); C.save(); rerender(); } });
    return true;
  };
  C.forms['prop-save'] = function (form) {
    var obj = form.dataset.obj, rec = C.recOf(obj, form.dataset.id), f = C.fieldDef(obj, form.dataset.key); if (!rec || !f) return;
    var nv = C.readField(f, new FormData(form));
    if (f.type === 'email' && nv && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(nv)) { C.toast('That email doesn’t look right', { icon: 'x' }); return; }
    if (f.key === 'name' && !nv) { C.toast('Name can’t be empty', { icon: 'x' }); return; }
    C.setProp(obj, rec, f, nv); rerender();
    var b = $('[data-act="prop-edit"][data-key="' + f.key + '"]'); if (b) b.focus({ preventScroll: true });
  };

  // ===== associations ============================================================================
  var TNAME = { contact: ['Contacts', 'contact', 'user'], company: ['Companies', 'company', 'building'], deal: ['Deals', 'deal', 'deal'] };
  C.assocBox = function (t, id, want) {
    var ids = C.assoc(t, id, want), rec = C.recOf(t, id), canE = C.can('edit', rec);
    var item = function (oid) {
      var o = C.recOf(want, oid); if (!o) return ''; var lab = C.assocLabel(t, id, want, oid), prim = lab === 'Primary';
      var sub = want === 'deal' ? C.pstage(o.pipe, o.stage).label + ' · ' + C.rs(C.dealVal(o)) : want === 'contact' ? o.role + (o.co && t !== 'company' ? ' · ' + (C.company(o.co) || {}).name : '') : o.industry + ' · ' + o.city;
      return '<li><a href="' + C.refHref({ t: want, id: oid }) + '">' + (want === 'company' ? C.logo(o.name, 22) : want === 'contact' ? C.avatar(o.name, 22) : '<span class="deal-ic sm">' + C.ic('deal', 12) + '</span>') + '<span class="grow"><b class="tr">' + esc(want === 'deal' ? o.name.split(' — ').pop() : o.name) + '</b><small class="muted tr">' + esc(sub) + '</small></span></a><span class="alab' + (prim ? ' prim' : '') + '">' + esc(lab) + '</span>' + (canE && !prim ? '<button type="button" class="ibtn xs" data-act="assoc-del" data-a="' + t + ':' + id + '" data-b="' + want + ':' + oid + '" aria-label="Remove association with ' + esc(o.name) + '">' + C.ic('x', 12) + '</button>' : '') + '</li>';
    };
    return '<section class="rbox"><h2 class="rbox-h">' + C.ic(TNAME[want][2], 14) + TNAME[want][0] + ' <span class="count-b">' + ids.length + '</span>' + (canE ? '<button type="button" class="lnk sm" data-act="assoc-add" data-a="' + t + ':' + id + '" data-want="' + want + '">' + C.ic('plus', 12) + 'Add</button>' : '') + '</h2>' +
      (ids.length ? '<ul class="assoc">' + ids.map(item).join('') + '</ul>' : '<p class="empty sm">No ' + TNAME[want][0].toLowerCase() + ' associated yet. Associations show who is involved, and their activity rolls up here.</p>') + '</section>';
  };
  var AS = null;
  function assocList() {
    var q = (AS.q || '').toLowerCase(), have = C.assoc(AS.t, AS.id, AS.want), src = AS.want === 'contact' ? P().contacts : AS.want === 'company' ? P().companies : P().deals;
    var L = src.filter(function (o) { return have.indexOf(o.id) < 0 && C.visible(o) && (!q || (o.name + ' ' + (o.email || '') + ' ' + (o.role || '') + ' ' + (o.city || '')).toLowerCase().indexOf(q) > -1); }).slice(0, 8);
    $('#as-list').innerHTML = '<legend class="sr">Results</legend>' + (L.length ? L.map(function (o, i) { return '<label class="as-i"><input type="radio" name="o" value="' + o.id + '"' + (i === 0 ? ' checked' : '') + '>' + (AS.want === 'company' ? C.logo(o.name, 22) : AS.want === 'contact' ? C.avatar(o.name, 22) : '') + '<span><b>' + esc(o.name) + '</b><small class="muted">' + esc(o.role || o.industry || C.pstage(o.pipe, o.stage).label) + '</small></span></label>'; }).join('') : '<p class="empty sm">No matches.</p>');
  }
  C.acts['assoc-add'] = function (el) {
    var a = refFromKey(el.dataset.a); AS = { t: a.t, id: a.id, want: el.dataset.want, q: '' };
    if (!C.can('edit', C.recOf(a.t, a.id))) { C.deny('change associations on records owned by others'); return; }
    var LAB = AS.want === 'contact' ? ['Decision maker', 'Approver', 'Influencer', 'Finance', 'Day-to-day contact', 'Referring architect'] : AS.want === 'company' ? ['Client', 'Design partner', 'Referred by', 'Architect on record', 'Vendor'] : ['Involved in', 'Referred', 'Approver on'];
    C.dialog('Add ' + TNAME[AS.want][1] + ' to ' + esc(C.recOf(a.t, a.id).name), '<div class="field"><label for="as-q">Search ' + TNAME[AS.want][0].toLowerCase() + '</label><input id="as-q" data-in="assoc-q" placeholder="Type a name…" autocomplete="off"></div><fieldset class="as-l" id="as-list"></fieldset><div class="field"><label for="as-lab">Association label</label><input id="as-lab" name="lab" list="as-labs" value="' + LAB[0] + '" autocomplete="off"><datalist id="as-labs">' + LAB.map(function (x) { return '<option value="' + x + '">'; }).join('') + '</datalist></div>', 'Associate', function (fd) {
      var oid = fd.get('o'); if (!oid) return false; var lab = (fd.get('lab') || 'Associated').trim(), A = AS;
      C.link(A.t, A.id, A.want, oid, lab); var o = C.recOf(A.want, oid);
      C.audit('link', C.refOf(A.t, C.recOf(A.t, A.id)), TNAME[A.want][1], '', o.name + ' (' + lab + ')'); C.save();
      C.toast('Associated ' + o.name, { icon: 'link', undo: function () { C.unlink(A.t, A.id, A.want, oid); C.save(); rerender(); } }); setTimeout(rerender, 20);
    });
    assocList();
  };
  C.ins['assoc-q'] = function (el) { AS.q = el.value; assocList(); };
  C.acts['assoc-del'] = function (el) {
    var a = refFromKey(el.dataset.a), b = refFromKey(el.dataset.b), lab = C.assocLabel(a.t, a.id, b.t, b.id), o = C.recOf(b.t, b.id);
    C.unlink(a.t, a.id, b.t, b.id); C.audit('unlink', C.refOf(a.t, C.recOf(a.t, a.id)), TNAME[b.t][1], o.name, ''); C.save(); rerender();
    C.toast('Removed ' + o.name, { icon: 'x', undo: function () { C.link(a.t, a.id, b.t, b.id, lab); C.save(); rerender(); } });
  };

  // ===== timeline (activity + history tabs) =======================================================
  var FILTERS = [['all', 'All'], ['call', 'Calls'], ['wa', 'WhatsApp'], ['email', 'Email'], ['meeting', 'Meetings'], ['visit', 'Visits'], ['note', 'Notes'], ['stage', 'Stages'], ['task', 'Tasks'], ['ticket', 'Tickets'], ['quote', 'Quotes'], ['file', 'Files']];
  function isType(a, f) { return a.type === f || (f === 'wa' && a.type === 'msg') || (f === 'email' && a.type === 'convo'); }
  C.recTimeline = function (q) {
    var u = RS(), all = C.timeline(q), list = u.filter === 'all' ? all : all.filter(function (a) { return isType(a, u.filter); });
    var chips = FILTERS.map(function (f) { var n = f[0] === 'all' ? all.length : all.filter(function (a) { return isType(a, f[0]); }).length; return n || f[0] === 'all' ? '<button type="button" class="chip" data-act="rec-filter" data-v="' + f[0] + '" aria-pressed="' + (u.filter === f[0]) + '">' + f[1] + ' <b>' + n + '</b></button>' : ''; }).join('');
    var days = {}, html = '';
    list.forEach(function (a) { var k = C.dayStart(a.t); (days[k] = days[k] || []).push(a); });
    Object.keys(days).sort(function (a, b) { return b - a; }).forEach(function (k) {
      var d = +k, td = C.dayStart(), lbl = d === td ? 'Today' : d === td - 864e5 ? 'Yesterday' : d > td ? 'Upcoming · ' + C.dfull(d) : C.dfull(d);
      html += '<li class="tl-day"><span>' + lbl + '</span></li>' + days[k].map(function (a) {
        var ty = C.ATYPE[a.type] || ['Activity', 'note'], where = a.d && !q.d ? C.deal(a.d) : null;
        return '<li class="tl-' + a.type + '"><span class="tl-i">' + C.ic(ty[1], 13) + '</span><div class="tl-b"><div class="tl-h"><b>' + ty[0] + '</b><span class="muted sm">' + esc((a.by || '').split(' ')[0]) + (a.lead ? ' · from lead' : '') + (where ? ' · <a href="#/deals/' + where.id + '">' + esc(where.name.split(' — ').pop()) + '</a>' : '') + '</span><time datetime="' + new Date(a.t).toISOString() + '">' + C.tm(a.t) + '</time></div><p>' + esc(a.text) + '</p></div></li>';
      }).join('');
    });
    return '<div class="chips tl-f" role="group" aria-label="Filter the timeline">' + chips + '</div>' + (list.length ? '<ol class="tl rtl">' + html + '</ol>' : '<div class="empty-st sm">' + C.ic('flow', 20) + '<b>Nothing of this type yet</b><span>Log a call, WhatsApp or note above and it appears here, on every associated record, and in reports.</span></div>');
  };
  C.recHistory = function (t, id) {
    var L = C.auditFor(t, id);
    return L.length ? '<ol class="hist">' + L.map(function (a) { return '<li><span class="hist-d"></span><div><p>' + C.auditLine(a) + '</p><time class="muted sm">' + C.dt(a.t) + '</time></div></li>'; }).join('') + '</ol>' : '<div class="empty-st sm">' + C.ic('clock', 20) + '<b>No changes recorded yet</b><span>Every field change, stage move, owner change and association is logged here with who did it and when.</span></div>';
  };
  C.recCenter = function (t, id, q, deal) {
    var u = RS(), tabs = [['activity', 'Activity'], ['history', 'History <span class="count-b">' + C.auditFor(t, id).length + '</span>']];
    return '<div class="tabs sm" role="tablist" aria-label="Record sections">' + tabs.map(function (x) { return '<button type="button" role="tab" aria-selected="' + (u.tab === x[0]) + '" tabindex="' + (u.tab === x[0] ? 0 : -1) + '" data-act="rec-tab" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      (u.tab === 'history' ? C.recHistory(t, id) : C.recComposer(t + ':' + id, deal) + C.recTimeline(q));
  };
  C.acts['rec-tab'] = function (el) { RS().tab = el.dataset.v; rerender(); var b = $('[data-act="rec-tab"][data-v="' + el.dataset.v + '"]'); if (b) b.focus(); };
  C.acts['rec-filter'] = function (el) { RS().filter = el.dataset.v; RS().tab = 'activity'; rerender(); var b = $('[data-act="rec-filter"][data-v="' + el.dataset.v + '"]'); if (b) b.focus(); };

  var MODES = [['note', 'Note', 'note'], ['call', 'Call', 'phone'], ['wa', 'WhatsApp', 'wa'], ['email', 'Email', 'mail'], ['visit', 'Site visit', 'pin']];
  C.recComposer = function (key, deal) {
    var m = RS().mode, f, r = refFromKey(key), rec = recOf(r), tpls = P().tpls.filter(function (t) { return (m === 'wa' && t.ch === 'wa') || (m === 'email' && t.ch === 'email'); });
    var tpl = tpls.length ? '<div class="tpls" role="group" aria-label="Templates">' + tpls.map(function (t) { return '<button type="button" class="chip" data-act="rec-tpl" data-id="' + t.id + '">' + esc(t.name) + '</button>'; }).join('') + '</div>' : '';
    if (m === 'call') f = '<div class="row3"><div class="field"><label for="rc-o">Outcome</label><select id="rc-o" name="o"><option>Connected</option><option>No answer</option><option>Busy</option><option>Call back later</option><option>Wrong number</option></select></div><div class="field"><label for="rc-d">Duration</label><input id="rc-d" name="dur" placeholder="mm:ss" pattern="[0-9]{1,2}:[0-5][0-9]" title="minutes:seconds, e.g. 4:30" autocomplete="off"></div><label class="chk"><input type="checkbox" name="fu" checked> Follow up tomorrow, 11 am</label></div><div class="field"><label for="rc-t">What was agreed?</label><input id="rc-t" name="text" placeholder="e.g. Wants the quote split into two phases" autocomplete="off"></div>';
    else if (m === 'email') f = tpl + '<div class="field"><label for="rc-s">Subject</label><input id="rc-s" name="subj" required autocomplete="off" placeholder="e.g. Revised furniture schedule"></div><div class="field"><label for="rc-t">Message</label><textarea id="rc-t" name="text" rows="3" required></textarea></div>';
    else if (m === 'visit') f = '<div class="row2"><div class="field"><label for="rc-o">Outcome</label><select id="rc-o" name="o">' + C.DFIELDS.visitOutcome.opts.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select></div><div class="field"><label for="rc-t">Notes</label><input id="rc-t" name="text" autocomplete="off" placeholder="Measurements, constraints, who was there"></div></div>' + (deal ? '<p class="hint">' + C.ic('unlock', 12) + ' Logging a visit on a deal also fills its “Site-visit outcome”, which unlocks the Proposal stage.</p>' : '');
    else f = (m === 'wa' ? tpl : '') + '<label class="sr" for="rc-t">' + (m === 'wa' ? 'WhatsApp message' : 'Note') + '</label><textarea id="rc-t" name="text" rows="2" required placeholder="' + (m === 'wa' ? 'Write a WhatsApp message' : 'Add a note for the team — it shows on every associated record') + '"></textarea>';
    return '<form class="comp rcomp" data-form="rec-comp" data-key="' + esc(key) + '"><div class="seg" role="group" aria-label="Log activity">' + MODES.map(function (x) { return '<button type="button" data-act="rec-mode" data-v="' + x[0] + '" aria-pressed="' + (m === x[0]) + '">' + C.ic(x[2], 13) + x[1] + '</button>'; }).join('') + '</div>' + f +
      '<div class="comp-f">' + (m === 'wa' || m === 'email' ? '<span class="muted sm">Logged on the timeline</span>' : '<span class="muted sm">Logged as ' + esc(C.me().name.split(' ')[0]) + '</span>') + '<button class="btn pri sm">' + { note: 'Save note', call: 'Log call', wa: 'Send WhatsApp', email: 'Send email', visit: 'Log visit' }[m] + '</button></div></form>';
  };
  C.acts['rec-mode'] = function (el) { RS().mode = el.dataset.v; rerender(); var t = $('#rc-t') || $('#rc-o'); if (t) t.focus(); };
  C.acts['rec-tpl'] = function (el) {
    var t = C.tpl(el.dataset.id), r = refFromKey($('form.rcomp').dataset.key), rec = recOf(r), who = r.t === 'deal' ? (C.contact(rec.c) || rec) : rec;
    var x = $('#rc-t'); x.value = C.fill(t.body, { name: who.name, owner: rec.owner, city: who.city }); if (t.subject && $('#rc-s')) $('#rc-s').value = C.fill(t.subject, { name: who.name, owner: rec.owner }); x.focus();
  };
  C.forms['rec-comp'] = function (f) {
    var r = refFromKey(f.dataset.key), m = RS().mode, E = f.elements, txt = ((E.text && E.text.value) || '').trim(), ar = actRef(r), who = C.me().name;
    if (m === 'note') { if (!txt) return; C.pact('note', txt, ar, who); C.toast('Note saved to the timeline'); }
    else if (m === 'call') {
      C.pact('call', E.o.value + (E.dur.value ? ' · ' + E.dur.value : '') + (txt ? ' — ' + txt : ''), ar, who); C.toast('Call logged', { icon: 'phone' });
      if (E.fu && E.fu.checked) { var d = new Date(); d.setDate(d.getDate() + 1); d.setHours(11, 0, 0, 0); C.addRefTask(r, E.o.value === 'Connected' ? 'Follow up after call' : 'Call back — ' + E.o.value.toLowerCase(), d.getTime(), 15, ownerOf(r)); }
    }
    else if (m === 'wa') { if (!txt) return; C.pact('wa', 'WhatsApp sent: ' + txt, ar, who); C.toast('WhatsApp sent', { icon: 'wa' }); }
    else if (m === 'email') { C.pact('email', 'Email “' + E.subj.value.trim() + '” sent' + (txt ? ': ' + txt.slice(0, 160) : ''), ar, who); C.toast('Email sent', { icon: 'mail' }); }
    else if (m === 'visit') {
      C.pact('visit', 'Site visit: ' + E.o.value + (txt ? ' — ' + txt : ''), ar, who);
      if (r.t === 'deal') { var dl = C.deal(r.id), ov = dl.fields.visitOutcome; dl.fields.visitOutcome = E.o.value; C.audit('update', C.refOf('deal', dl), 'Site-visit outcome', ov, E.o.value); }
      C.toast('Site visit logged', { icon: 'pin' });
    }
    C.save(); rerender(); var t = $('#rc-t'); if (t) t.focus({ preventScroll: true });
  };

  // ===== related lists ==============================================================================
  C.recTasks = function (ref) {
    var T = C.S().tasks.filter(function (t) { return t.ref && t.ref.t === ref.t && t.ref.id === ref.id; });
    if (ref.t === 'contact') { var c = C.contact(ref.id); if (c && c.leadId) T = T.concat(C.S().tasks.filter(function (t) { return t.leadId === c.leadId; })); }
    if (ref.t !== 'deal') C.assoc(ref.t, ref.id, 'deal').forEach(function (did) { T = T.concat(C.S().tasks.filter(function (t) { return t.ref && t.ref.t === 'deal' && t.ref.id === did; })); });
    T.sort(function (a, b) { return (a.done - b.done) || a.due - b.due; });
    var row = function (t) { var late = !t.done && t.due < Date.now(); return '<li class="task' + (t.done ? ' done' : '') + '"><input type="checkbox" id="rt-' + t.id + '" data-ch="task-toggle" data-id="' + t.id + '"' + (t.done ? ' checked' : '') + '><div class="tk-b"><label for="rt-' + t.id + '">' + esc(t.text) + '</label><div class="muted sm"><span class="' + (late ? 'late' : '') + '">' + (t.done ? 'Done' : (late ? 'Overdue · ' : '') + C.dshort(t.due) + ', ' + C.tm(t.due)) + '</span>' + (t.remind && !t.done ? ' · <span class="rmd">' + C.ic('bell', 11) + C.dur(t.remind) + '</span>' : '') + ' · ' + esc(t.owner.split(' ')[0]) + (t.ref && (t.ref.t !== ref.t || t.ref.id !== ref.id) ? ' · <a href="' + C.refHref(t.ref) + '">' + esc(C.refName(t.ref).split(' — ').pop()) + '</a>' : '') + '</div></div></li>'; };
    return '<section class="rbox"><h2 class="rbox-h">' + C.ic('tasks', 14) + 'Tasks <span class="count-b">' + T.filter(function (t) { return !t.done; }).length + '</span></h2>' + (T.length ? '<ul class="tasks compact">' + T.slice(0, 6).map(row).join('') + '</ul>' : '<p class="empty sm">No tasks. Add one with a reminder so nothing slips.</p>') +
      '<form class="rt-add" data-form="rec-task" data-key="' + ref.t + ':' + ref.id + '"><label class="sr" for="rt-x">New task</label><input id="rt-x" name="text" required placeholder="Add a task…" autocomplete="off"><div class="rt-row"><label class="sr" for="rt-w">Due</label><select id="rt-w" name="when"><option value="2h">In 2 hours</option><option value="eod" selected>Today, 6 pm</option><option value="tom">Tomorrow, 11 am</option><option value="3d">In 3 days</option><option value="wk">Next week</option></select><label class="sr" for="rt-r">Reminder</label><select id="rt-r" name="rem"><option value="0">No reminder</option><option value="15" selected>15 min before</option><option value="60">1 hour before</option><option value="1440">1 day before</option></select><button class="btn sm">Add</button></div></form></section>';
  };
  var WHEN = { '2h': function () { return Date.now() + 2 * 36e5; }, eod: function () { var d = new Date(); d.setHours(18, 0, 0, 0); return Math.max(d.getTime(), Date.now() + 36e5); }, tom: function () { var d = new Date(); d.setDate(d.getDate() + 1); d.setHours(11, 0, 0, 0); return d.getTime(); }, '3d': function () { var d = new Date(); d.setDate(d.getDate() + 3); d.setHours(11, 0, 0, 0); return d.getTime(); }, wk: function () { var d = new Date(); d.setDate(d.getDate() + 7); d.setHours(11, 0, 0, 0); return d.getTime(); } };
  C.forms['rec-task'] = function (f) {
    var r = refFromKey(f.dataset.key), txt = f.elements.text.value.trim(); if (!txt) return;
    var t = C.addRefTask(r, txt, WHEN[f.elements.when.value](), +f.elements.rem.value || null, ownerOf(r));
    C.audit('create', C.refOf(r.t, recOf(r)), 'Task', '', txt);
    C.toast('Task added' + (t.remind ? ' with a reminder' : ''), { icon: 'tasks', undo: function () { C.S().tasks = C.S().tasks.filter(function (x) { return x !== t; }); C.save(); C.badges(); rerender(); } }); rerender(); var x = $('#rt-x'); if (x) x.focus();
  };
  C.recNotes = function (q) {
    var N = C.timeline(q).filter(function (a) { return a.type === 'note'; });
    return '<section class="rbox"><h2 class="rbox-h">' + C.ic('note', 14) + 'Notes <span class="count-b">' + N.length + '</span><button type="button" class="lnk sm" data-act="rec-quick" data-v="note">' + C.ic('plus', 12) + 'Add</button></h2>' + (N.length ? '<ul class="notes-l">' + N.slice(0, 4).map(function (n) { return '<li><p>' + esc(n.text) + '</p><span class="muted sm">' + esc((n.by || '').split(' ')[0]) + ' · ' + C.dshort(n.t) + '</span></li>'; }).join('') + '</ul>' + (N.length > 4 ? '<button type="button" class="lnk sm" data-act="rec-filter" data-v="note">See all ' + N.length + ' notes</button>' : '') : '<p class="empty sm">No notes yet. Notes are shared with the team and roll up to associated records.</p>') + '</section>';
  };
  C.recFiles = function (ref, q) {
    var F = P().files.filter(function (f) { return (q.d && f.d === q.d) || (q.c && f.c === q.c && !q.d) || (q.co && f.co === q.co && !q.d && !q.c); });
    return '<section class="rbox"><h2 class="rbox-h">' + C.ic('clip', 14) + 'Files <span class="count-b">' + F.length + '</span></h2>' +
      (F.length ? '<ul class="files">' + F.slice(0, 5).map(function (f) { return '<li><span class="fext ' + esc(f.kind) + '">' + esc(f.kind.toUpperCase()) + '</span><div class="grow"><b class="tr">' + esc(f.name) + '</b><span class="muted sm">' + C.bytes(f.size) + ' · ' + esc(f.by.split(' ')[0]) + ' · ' + C.dshort(f.t) + '</span></div></li>'; }).join('') + '</ul>' : '') +
      '<label class="drop" data-drop="' + ref.t + ':' + ref.id + '">' + C.ic('upload', 16) + '<span><b>Drop files or choose</b><small>PDF, images or drawings · up to 25 MB</small></span><input type="file" multiple data-ch="rec-file" data-key="' + ref.t + ':' + ref.id + '" class="sr"></label></section>';
  };
  function addFiles(key, list) {
    var r = refFromKey(key), ar = actRef(r), n = 0;
    Array.prototype.slice.call(list || []).slice(0, 8).forEach(function (fl) {
      var ext = (fl.name.split('.').pop() || 'file').toLowerCase().slice(0, 4);
      P().files.unshift({ id: C.uid('F'), d: ar.d || null, c: ar.c || null, co: ar.co || null, name: fl.name.slice(0, 80), size: fl.size || 1, kind: ext, t: Date.now(), by: C.me().name });
      C.pact('file', 'Attached ' + fl.name.slice(0, 80) + ' (' + C.bytes(fl.size || 1) + ')', ar, C.me().name); n++;
    });
    if (n) { C.audit('update', C.refOf(r.t, recOf(r)), 'Files', '', n + ' attached'); C.save(); C.toast(n + (n === 1 ? ' file' : ' files') + ' attached', { icon: 'clip' }); rerender(); }
  }
  C.chs['rec-file'] = function (el) { addFiles(el.dataset.key, el.files); };
  document.addEventListener('dragover', function (e) { var d = e.target.closest && e.target.closest('[data-drop]'); if (d) { e.preventDefault(); d.classList.add('over'); } });
  document.addEventListener('dragleave', function (e) { var d = e.target.closest && e.target.closest('[data-drop]'); if (d) d.classList.remove('over'); });
  document.addEventListener('drop', function (e) { var d = e.target.closest && e.target.closest('[data-drop]'); if (!d) return; e.preventDefault(); d.classList.remove('over'); addFiles(d.dataset.drop, e.dataTransfer && e.dataTransfer.files); });

  C.recEvents = function (t, id) {
    var E = C.eventsFor ? C.eventsFor(t, id) : [];
    return '<section class="rbox"><h2 class="rbox-h">' + C.ic('cal', 14) + 'Upcoming <span class="count-b">' + E.length + '</span>' + (C.calNew ? '<button type="button" class="lnk sm" data-act="rec-sched" data-key="' + t + ':' + id + '">' + C.ic('plus', 12) + 'Schedule</button>' : '') + '</h2>' +
      (E.length ? '<ul class="mlist">' + E.slice(0, 4).map(function (e) { return '<li><a href="#/calendar/' + e.id + '" class="tr">' + esc(e.title) + '</a><span class="muted sm nw">' + C.dshort(e.t) + ', ' + C.tm(e.t) + '</span></li>'; }).join('') + '</ul>' : '<p class="empty sm">Nothing scheduled. Book a site visit, call or meeting and it lands on the team calendar.</p>') + '</section>';
  };
  C.acts['rec-sched'] = function (el) { var r = refFromKey(el.dataset.key); if (C.calNew) C.calNew({ ref: r, type: r.t === 'deal' ? 'visit' : 'call', title: '' }); };
  C.recSeqs = function (c) {
    var S = P().seqs.filter(function (s) { return s.enr.some(function (e) { return e.c === c.id || (c.leadId && e.lead === c.leadId); }); });
    return '<section class="rbox"><h2 class="rbox-h">' + C.ic('flow', 14) + 'Sequences <span class="count-b">' + S.length + '</span><button type="button" class="lnk sm" data-act="rec-enrol" data-id="' + c.id + '">' + C.ic('plus', 12) + 'Enrol</button></h2>' + (S.length ? '<ul class="mlist">' + S.map(function (s) { var e = s.enr.filter(function (x) { return x.c === c.id || (c.leadId && x.lead === c.leadId); })[0]; return '<li><a href="#/sequences/' + s.id + '">' + esc(s.name) + '</a><span class="st-' + e.status + '">' + e.status + ' · ' + Math.min(e.step + 1, s.steps.length) + '/' + s.steps.length + '</span></li>'; }).join('') + '</ul>' : '<p class="empty sm">Not in any sequence.</p>') + '</section>';
  };
  C.acts['rec-enrol'] = function (el) {
    var c = C.contact(el.dataset.id);
    C.dialog('Enrol ' + esc(c.name) + ' in a sequence', '<div class="field"><label for="re-s">Sequence</label><select id="re-s" name="s">' + P().seqs.map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + ' · ' + s.steps.length + ' steps' + (s.on ? '' : ' (paused)') + '</option>'; }).join('') + '</select></div>' + (c.cf && c.cf.waOptIn === 'No' ? '<p class="hint late">' + C.ic('x', 12) + ' This contact has not opted in to WhatsApp; WhatsApp steps will be skipped.</p>' : ''), 'Enrol', function (fd) {
      var s = P().seqs.filter(function (x) { return x.id === fd.get('s'); })[0];
      if (!C.enrol(s.id, { c: c.id })) { C.toast('Already in ' + s.name, { icon: 'x' }); return; }
      C.pact('seq', 'Enrolled in sequence “' + s.name + '”', { c: c.id, co: c.co }, C.me().name); C.audit('update', C.refOf('contact', c), 'Sequence', '', s.name); C.save(); C.toast('Enrolled in ' + s.name, { icon: 'flow' }); setTimeout(rerender, 20);
    });
  };
  C.recQuotes = function (dealIds) {
    var Q = P().quotes.filter(function (q) { return dealIds.indexOf(q.d) > -1 && q.status !== 'superseded'; }).sort(function (a, b) { return b.created - a.created; });
    return '<section class="rbox"><h2 class="rbox-h">' + C.ic('quote', 14) + 'Quotes <span class="count-b">' + Q.length + '</span></h2>' + (Q.length ? '<ul class="mlist">' + Q.slice(0, 5).map(function (q) { return '<li><a href="#/quotes/' + q.id + '">' + q.id + ' <span class="muted">v' + q.ver + '</span></a><span class="qst ' + q.status + '">' + q.status + '</span><b class="nw">' + (C.quoteTotal ? C.rs(C.quoteTotal(q).total) : '') + '</b></li>'; }).join('') + '</ul>' : '<p class="empty sm">No quotes yet. Create one from a deal’s line items.</p>') + '</section>';
  };
  C.recTickets = function (key, filt) {
    var T = P().tickets.filter(filt).sort(function (a, b) { return (a.status === 'closed') - (b.status === 'closed') || b.updated - a.updated; });
    return '<section class="rbox"><h2 class="rbox-h">' + C.ic('ticket', 14) + 'Tickets <span class="count-b">' + T.filter(function (t) { return t.status !== 'closed'; }).length + '</span><button type="button" class="lnk sm" data-act="tk-new" data-key="' + key + '">' + C.ic('plus', 12) + 'New</button></h2>' + (T.length ? '<ul class="mlist">' + T.slice(0, 5).map(function (t) { return '<li><a href="#/tickets/' + t.id + '" class="tr">' + esc(t.subj) + '</a><span class="tst ' + t.status + '">' + t.status + '</span></li>'; }).join('') + '</ul>' : '<p class="empty sm">No service tickets. After-sales issues (snags, replacements) are tracked here.</p>') + '</section>';
  };

  C.dealRows = function (list) {
    if (!list.length) return '<p class="empty sm">No deals yet.</p>';
    return '<ul class="rdeals">' + list.map(function (d) { var s = C.pstage(d.pipe, d.stage); return '<li><a href="#/deals/' + d.id + '"><span class="tr">' + esc(d.name.split(' — ').pop()) + '</span><b>' + C.rs(C.dealVal(d)) + '</b></a><span class="pill"><i style="background:' + s.color + '"></i>' + esc(s.label) + '</span><span class="muted sm">' + C.PIPES[d.pipe].label + '</span></li>'; }).join('') + '</ul>';
  };
  function actionsBar(t, id) {
    var rec = C.recOf(t, id);
    return '<div class="rec-act">' + [['call', 'phone', 'Log call'], ['wa', 'wa', 'WhatsApp'], ['email', 'mail', 'Email'], ['note', 'note', 'Note']].map(function (x) { return '<button type="button" class="btn sm" data-act="rec-quick" data-v="' + x[0] + '">' + C.ic(x[1], 14) + x[2] + '</button>'; }).join('') +
      (C.calNew ? '<button type="button" class="btn sm" data-act="rec-sched" data-key="' + t + ':' + id + '">' + C.ic('cal', 14) + 'Schedule</button>' : '') +
      (t !== 'deal' ? '<button type="button" class="btn sm pri" data-act="deal-new" data-from="' + t + ':' + id + '">' + C.ic('deal', 14) + 'New deal</button>' : '') +
      (C.can('delete') && C.can('edit', rec) ? '<button type="button" class="ibtn" data-act="rec-del" data-key="' + t + ':' + id + '" aria-label="Delete this ' + t + '" title="Delete">' + C.ic('trash', 15) + '</button>' : '') + '</div>';
  }
  C.recActions = actionsBar;
  C.acts['rec-quick'] = function (el) { RS().mode = el.dataset.v; RS().tab = 'activity'; rerender(); var t = $('#rc-t') || $('#rc-o'); if (t) { t.focus(); t.scrollIntoView({ block: 'center', behavior: C.motion() ? 'smooth' : 'auto' }); } };
  C.acts['rec-del'] = function (el) {
    var r = refFromKey(el.dataset.key), rec = recOf(r); if (!C.guard('delete', 'delete records')) return;
    C.dialog('Delete ' + esc(rec.name) + '?', '<p>This removes the ' + r.t + ' and its associations. Its activity stays on associated records. You can undo right after.</p>', 'Delete ' + r.t, function () { C.deleteRec(r.t, r.id); location.hash = '#/' + (r.t === 'company' ? 'companies' : r.t + 's'); });
  };
  C.deleteRec = function (t, id, quiet) {
    var p = P(), arr = t === 'contact' ? p.contacts : t === 'company' ? p.companies : p.deals, i = arr.map(function (x) { return x.id; }).indexOf(id); if (i < 0) return null;
    var rec = arr.splice(i, 1)[0], k = t + ':' + id, links = (p.links || []).filter(function (l) { return l.a === k || l.b === k; }), touched = [];
    p.links = (p.links || []).filter(function (l) { return l.a !== k && l.b !== k; });
    if (t === 'contact') p.deals.forEach(function (d) { if (d.c === id) { d.c = null; touched.push([d, 'c']); } });
    if (t === 'company') { p.deals.forEach(function (d) { if (d.co === id) { d.co = null; touched.push([d, 'co']); } }); p.contacts.forEach(function (c) { if (c.co === id) { c.co = null; touched.push([c, 'co']); } }); }
    C.audit('delete', C.refOf(t, rec)); C.save();
    var undo = function () { arr.splice(i, 0, rec); p.links = p.links.concat(links); touched.forEach(function (x) { x[0][x[1]] = id; }); C.audit('create', C.refOf(t, rec), 'restored'); C.save(); rerender(); };
    if (!quiet) C.toast(rec.name + ' deleted', { icon: 'trash', undo: undo });
    return undo;
  };

  // ===== lists: filters, saved views, selection, bulk, export ==========================================
  var SEL = {};
  function selIds(kind) { return Object.keys(SEL[kind] || {}); }
  function LS(kind) { var k = 'ls_' + kind; return C.ui[k] || (C.ui[k] = { q: '', kind: 'all', owner: 'all', life: 'all', tag: 'all', cfk: '', cfv: '', ind: 'all', sort: 'name', dir: 1, view: '' }); }
  function cfSelectDefs(obj) { return C.fieldDefs(obj).filter(function (f) { return !f.sys && f.type === 'select'; }); }
  function matchesContact(c, u) {
    var co = c.co ? C.company(c.co) : null, q = u.q.toLowerCase();
    if (!C.visible(c)) return false;
    if (u.owner !== 'all' && c.owner !== u.owner) return false;
    if (u.kind === 'company' && !c.co) return false; if (u.kind === 'home' && c.co) return false;
    if (u.life !== 'all' && c.life !== u.life) return false;
    if (u.tag !== 'all' && (c.tags || []).indexOf(u.tag) < 0) return false;
    if (u.cfk && u.cfv && ((c.cf || {})[u.cfk] || '') !== u.cfv) return false;
    return !q || (c.name + ' ' + c.email + ' ' + c.phone + ' ' + (co ? co.name : '') + ' ' + c.role + ' ' + c.city + ' ' + (c.tags || []).join(' ')).toLowerCase().indexOf(q) > -1;
  }
  function lastAct(q) { var a = C.timeline(q)[0]; return a ? a.t : 0; }
  function openDeals(t, id) { return C.assoc(t, id, 'deal').map(C.deal).filter(function (d) { return d && C.dealOpen(d); }); }
  function contactsFiltered() {
    var u = LS('contacts'), a = P().contacts.filter(function (c) { return matchesContact(c, u); });
    var key = { name: function (c) { return c.name.toLowerCase(); }, last: function (c) { return -lastAct({ c: c.id, lead: c.leadId }); }, deals: function (c) { return -openDeals('contact', c.id).reduce(function (s, d) { return s + C.dealVal(d); }, 0); } }[u.sort] || function (c) { return c.name; };
    return a.map(function (c) { return [key(c), c]; }).sort(function (x, y) { return (x[0] > y[0] ? 1 : x[0] < y[0] ? -1 : 0) * u.dir; }).map(function (x) { return x[1]; });
  }
  function sortTh(kind, k, label, cls) { var u = LS(kind), on = u.sort === k; return '<th scope="col" class="' + (cls || '') + '" aria-sort="' + (on ? (u.dir > 0 ? 'ascending' : 'descending') : 'none') + '"><button type="button" class="sortbtn" data-act="ls-sort" data-kind="' + kind + '" data-k="' + k + '">' + label + '<span class="srt" aria-hidden="true">' + (on ? (u.dir > 0 ? '↑' : '↓') : '') + '</span></button></th>'; }
  C.acts['ls-sort'] = function (el) { var u = LS(el.dataset.kind); if (u.sort === el.dataset.k) u.dir = -u.dir; else { u.sort = el.dataset.k; u.dir = 1; } sync(el.dataset.kind); var b = $('[data-act="ls-sort"][data-k="' + el.dataset.k + '"]'); if (b) b.focus(); };
  function selCell(kind, id, name) { var on = !!(SEL[kind] || {})[id]; return '<td class="c-sel"><input type="checkbox" data-ch="sel" data-kind="' + kind + '" data-id="' + id + '"' + (on ? ' checked' : '') + ' aria-label="Select ' + esc(name) + '"></td>'; }
  function ownerCell(kind, rec) { return C.can('edit', rec) ? '<td><label class="sr" for="oc-' + rec.id + '">Owner of ' + esc(rec.name) + '</label><select id="oc-' + rec.id + '" class="cellsel" data-ch="cell-owner" data-kind="' + kind + '" data-id="' + rec.id + '">' + P().users.map(function (u) { return '<option' + (u.name === rec.owner ? ' selected' : '') + '>' + esc(u.name) + '</option>'; }).join('') + '</select></td>' : '<td><span class="own">' + C.avatar(rec.owner, 18) + esc(rec.owner.split(' ')[0]) + '</span></td>'; }
  C.chs['cell-owner'] = function (el) { var t = el.dataset.kind === 'contacts' ? 'contact' : 'company', rec = C.recOf(t, el.dataset.id); C.setProp(t, rec, C.fieldDef(t, 'owner'), el.value); };
  C.chs['cell-life'] = function (el) { var rec = C.contact(el.dataset.id); C.setProp('contact', rec, C.fieldDef('contact', 'life'), el.value); el.className = 'cellsel life l-' + el.value.toLowerCase(); };

  function contactsTable() {
    var a = contactsFiltered(), sel = SEL.contacts || {};
    if (!a.length) return '<div class="empty-st">' + C.ic('user', 22) + '<b>No contacts match these filters</b><span>Clear the filters, or import a CSV of your existing customers to get started.</span><div class="row-btns"><button type="button" class="btn" data-act="ls-clear" data-kind="contacts">Clear filters</button>' + (C.can('import') ? '<button type="button" class="btn pri" data-act="csv-open">' + C.ic('upload', 14) + 'Import CSV</button>' : '') + '</div></div>';
    var all = a.every(function (c) { return sel[c.id]; });
    return '<div class="tablewrap"><table class="tbl dense rtbl"><thead><tr><th scope="col" class="c-sel"><input type="checkbox" data-ch="sel-all" data-kind="contacts"' + (all ? ' checked' : '') + ' aria-label="Select all ' + a.length + ' contacts"></th>' + sortTh('contacts', 'name', 'Name') + '<th scope="col">Company</th><th scope="col">Lifecycle</th>' + sortTh('contacts', 'deals', 'Open deals', 'num') + '<th scope="col">Owner</th>' + sortTh('contacts', 'last', 'Last activity') + '</tr></thead><tbody>' + a.map(function (c) {
      var co = c.co ? C.company(c.co) : null, ds = openDeals('contact', c.id), la = lastAct({ c: c.id, lead: c.leadId }), canE = C.can('edit', c);
      return '<tr tabindex="0" data-href="#/contacts/' + c.id + '"' + (sel[c.id] ? ' class="sel"' : '') + '>' + selCell('contacts', c.id, c.name) + '<td class="c-main"><div class="lc">' + C.avatar(c.name, 28) + '<div><a class="lname" href="#/contacts/' + c.id + '">' + esc(c.name) + '</a><div class="muted sm tr">' + esc(c.role) + ' · ' + esc(c.email) + '</div></div></div></td><td>' + (co ? '<a class="co-l" href="#/companies/' + co.id + '">' + C.logo(co.name, 18) + esc(co.name) + '</a>' : '<span class="muted">Homeowner</span>') + '</td>' +
        '<td>' + (canE ? '<label class="sr" for="lc-' + c.id + '">Lifecycle of ' + esc(c.name) + '</label><select id="lc-' + c.id + '" class="cellsel life l-' + esc((c.life || '').toLowerCase()) + '" data-ch="cell-life" data-id="' + c.id + '">' + C.fieldDef('contact', 'life').opts.map(function (o) { return '<option' + (o === c.life ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>' : '<span class="lifep l-' + esc((c.life || '').toLowerCase()) + '">' + esc(c.life || '—') + '</span>') + '</td>' +
        '<td class="num">' + (ds.length ? C.rs(ds.reduce(function (s, d) { return s + C.dealVal(d); }, 0)) + ' <span class="muted sm">· ' + ds.length + '</span>' : '<span class="muted">—</span>') + '</td>' + ownerCell('contacts', c) + '<td class="muted nw">' + (la ? C.rel(la) : '—') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  function bulkBar(kind) {
    var n = selIds(kind).length; if (!n) return '';
    var users = P().users.map(function (u) { return '<option>' + esc(u.name) + '</option>'; }).join('');
    return '<div class="bulk" role="region" aria-label="Bulk actions"><b>' + n + ' selected</b>' +
      '<label class="sr" for="bk-o">Assign owner</label><select id="bk-o" class="sel sm" data-ch="bulk" data-kind="' + kind + '" data-op="owner"><option value="">Assign owner…</option>' + users + '</select>' +
      (kind === 'contacts' ? '<label class="sr" for="bk-t">Add tag</label><select id="bk-t" class="sel sm" data-ch="bulk" data-kind="' + kind + '" data-op="tag"><option value="">Add tag…</option>' + C.fieldDef('contact', 'tags').opts.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>' +
        '<label class="sr" for="bk-l">Set lifecycle</label><select id="bk-l" class="sel sm" data-ch="bulk" data-kind="' + kind + '" data-op="life"><option value="">Lifecycle…</option>' + C.fieldDef('contact', 'life').opts.map(function (o) { return '<option>' + o + '</option>'; }).join('') + '</select>' +
        '<label class="sr" for="bk-s">Enrol in sequence</label><select id="bk-s" class="sel sm" data-ch="bulk" data-kind="' + kind + '" data-op="seq"><option value="">Enrol in…</option>' + P().seqs.map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + '</option>'; }).join('') + '</select>' : '') +
      '<button type="button" class="btn sm" data-act="bulk-export" data-kind="' + kind + '">' + C.ic('down', 13) + 'Export</button>' + (C.can('delete') ? '<button type="button" class="btn sm danger" data-act="bulk-del" data-kind="' + kind + '">' + C.ic('trash', 13) + 'Delete</button>' : '') + '<button type="button" class="btn sm ghost" data-act="bulk-clear" data-kind="' + kind + '">Clear</button></div>';
  }
  C.chs.sel = function (el) { var k = el.dataset.kind; SEL[k] = SEL[k] || {}; if (el.checked) SEL[k][el.dataset.id] = 1; else delete SEL[k][el.dataset.id]; syncBulk(k); var tr = el.closest('tr'); if (tr) tr.classList.toggle('sel', el.checked); };
  C.chs['sel-all'] = function (el) { var k = el.dataset.kind, L = k === 'contacts' ? contactsFiltered() : companiesFiltered(); SEL[k] = {}; if (el.checked) L.forEach(function (x) { SEL[k][x.id] = 1; }); sync(k); var b = $('[data-ch="sel-all"]'); if (b) b.focus(); };
  C.acts['bulk-clear'] = function (el) { SEL[el.dataset.kind] = {}; sync(el.dataset.kind); };
  function syncBulk(k) { var b = $('#bulkw'); if (b) b.innerHTML = bulkBar(k); }
  C.chs.bulk = function (el) {
    var k = el.dataset.kind, op = el.dataset.op, v = el.value, t = k === 'contacts' ? 'contact' : 'company'; if (!v) return;
    if (!C.guard('bulk', 'run bulk actions')) { el.value = ''; return; }
    var recs = selIds(k).map(function (id) { return C.recOf(t, id); }).filter(Boolean), ok = recs.filter(function (r) { return C.can('edit', r); }), skipped = recs.length - ok.length, snap = ok.map(function (r) { return [r, JSON.stringify({ owner: r.owner, tags: r.tags, life: r.life })]; });
    var label = '';
    ok.forEach(function (r) {
      if (op === 'owner') { r.owner = v; label = 'Owner → ' + v; }
      else if (op === 'tag') { r.tags = r.tags || []; if (r.tags.indexOf(v) < 0) r.tags.push(v); label = 'Tag + ' + v; }
      else if (op === 'life') { r.life = v; label = 'Lifecycle → ' + v; }
      else if (op === 'seq') { if (C.enrol(v, { c: r.id })) C.pact('seq', 'Enrolled in sequence (bulk)', { c: r.id, co: r.co }, C.me().name); label = 'Enrolled in ' + P().seqs.filter(function (s) { return s.id === v; })[0].name; }
    });
    C.audit('bulk', null, k + ' · ' + ok.length + ' records', '', label);
    if (op === 'owner' && v !== C.me().name) C.notify(C.me().name.split(' ')[0] + ' assigned you ' + ok.length + ' ' + k, '#/' + k, 'user', v);
    C.save(); SEL[k] = {}; sync(k);
    C.toast(label + ' · ' + ok.length + ' updated' + (skipped ? ', ' + skipped + ' skipped (not yours)' : ''), { icon: 'check', undo: op === 'seq' ? null : function () { snap.forEach(function (x) { var o = JSON.parse(x[1]); x[0].owner = o.owner; x[0].tags = o.tags; x[0].life = o.life; }); C.audit('bulk', null, k, label, 'undone'); C.save(); sync(k); } });
  };
  C.acts['bulk-del'] = function (el) {
    var k = el.dataset.kind, t = k === 'contacts' ? 'contact' : 'company'; if (!C.guard('delete', 'delete records') || !C.guard('bulk', 'run bulk actions')) return;
    var ids = selIds(k).filter(function (id) { return C.can('edit', C.recOf(t, id)); });
    C.dialog('Delete ' + ids.length + ' ' + k + '?', '<p>Associations are removed; activity stays on the associated records. You can undo right after.</p>', 'Delete ' + ids.length, function () {
      var undos = ids.map(function (id) { return C.deleteRec(t, id, true); }).filter(Boolean); SEL[k] = {}; sync(k);
      C.toast(undos.length + ' ' + k + ' deleted', { icon: 'trash', undo: function () { undos.reverse().forEach(function (u) { u(); }); } });
    });
  };
  var CCOLS = function () { return [['ID', function (c) { return c.id; }], ['Name', function (c) { return c.name; }], ['Email', function (c) { return c.email; }], ['Phone', function (c) { return c.phone; }], ['Company', function (c) { return c.co ? (C.company(c.co) || {}).name : ''; }], ['Job title', function (c) { return c.role; }], ['City', function (c) { return c.city; }], ['Owner', function (c) { return c.owner; }], ['Lifecycle stage', function (c) { return c.life; }], ['Tags', function (c) { return c.tags; }]].concat(C.fieldDefs('contact').filter(function (f) { return !f.sys; }).map(function (f) { return [f.label, function (c) { return C.fmtF(f, (c.cf || {})[f.key]); }]; })); };
  var KCOLS = function () { return [['ID', function (c) { return c.id; }], ['Name', function (c) { return c.name; }], ['Industry', function (c) { return c.industry; }], ['City', function (c) { return c.city; }], ['Employees', function (c) { return c.size; }], ['Website', function (c) { return c.domain; }], ['Owner', function (c) { return c.owner; }], ['Open pipeline (INR)', function (c) { return openDeals('company', c.id).reduce(function (s, d) { return s + C.dealVal(d); }, 0); }]].concat(C.fieldDefs('company').filter(function (f) { return !f.sys; }).map(function (f) { return [f.label, function (c) { return C.fmtF(f, (c.cf || {})[f.key]); }]; })); };
  C.acts['bulk-export'] = function (el) { var k = el.dataset.kind, t = k === 'contacts' ? 'contact' : 'company'; C.exportCSV(k + '-selected', k === 'contacts' ? CCOLS() : KCOLS(), selIds(k).map(function (id) { return C.recOf(t, id); }).filter(Boolean)); };
  C.acts['ls-export'] = function (el) { var k = el.dataset.kind; C.exportCSV(k, k === 'contacts' ? CCOLS() : KCOLS(), k === 'contacts' ? contactsFiltered() : companiesFiltered()); };
  C.acts['ls-clear'] = function (el) { C.ui['ls_' + el.dataset.kind] = null; rerender(); };

  // saved views
  function viewTabs(kind) {
    var u = LS(kind), V0 = P().views[kind] || [], cur = u.view;
    return '<div class="vtabs" role="group" aria-label="Saved views"><button type="button" class="vtab' + (!cur ? ' on' : '') + '" data-act="lv-pick" data-kind="' + kind + '" data-id="" aria-pressed="' + !cur + '">All ' + kind + '</button>' + V0.map(function (v) { return '<span class="vt"><button type="button" class="vtab' + (cur === v.id ? ' on' : '') + '" data-act="lv-pick" data-kind="' + kind + '" data-id="' + v.id + '" aria-pressed="' + (cur === v.id) + '">' + esc(v.name) + '</button><button type="button" class="vx" data-act="lv-del" data-kind="' + kind + '" data-id="' + v.id + '" aria-label="Delete saved view ' + esc(v.name) + '">' + C.ic('x', 11) + '</button></span>'; }).join('') + '<button type="button" class="vtab save" data-act="lv-save" data-kind="' + kind + '">' + C.ic('plus', 12) + ' Save view</button></div>';
  }
  C.acts['lv-pick'] = function (el) {
    var k = el.dataset.kind, v = (P().views[k] || []).filter(function (x) { return x.id === el.dataset.id; })[0]; C.ui['ls_' + k] = null; var u = LS(k);
    if (v) { Object.keys(v.f).forEach(function (x) { u[x] = v.f[x]; }); u.view = v.id; }
    SEL[k] = {}; rerender(); var b = $('[data-act="lv-pick"][data-id="' + el.dataset.id + '"]'); if (b) b.focus();
  };
  C.acts['lv-save'] = function (el) {
    var k = el.dataset.kind, u = LS(k);
    C.dialog('Save view', '<div class="field"><label for="lv-n">View name</label><input id="lv-n" name="name" required maxlength="28" placeholder="e.g. Noida decision makers" autocomplete="off"></div><p class="hint">Saves the current search, filters and sort as a tab for everyone in the workspace.</p>', 'Save view', function (fd) {
      var name = (fd.get('name') || '').trim(); if (!name) return false;
      var f = {}; ['q', 'kind', 'owner', 'life', 'tag', 'cfk', 'cfv', 'ind', 'sort', 'dir'].forEach(function (x) { f[x] = u[x]; });
      var v = { id: C.uid('v'), name: name, f: f }; (P().views[k] = P().views[k] || []).push(v); u.view = v.id; C.audit('settings', null, 'Saved view (' + k + ')', '', name); C.save(); setTimeout(rerender, 20); C.toast('View “' + name + '” saved');
    });
  };
  C.acts['lv-del'] = function (el) { var k = el.dataset.kind, L = P().views[k], v = L.filter(function (x) { return x.id === el.dataset.id; })[0]; P().views[k] = L.filter(function (x) { return x !== v; }); if (LS(k).view === v.id) LS(k).view = ''; C.save(); rerender(); C.toast('View removed', { icon: 'trash', undo: function () { P().views[k].push(v); C.save(); rerender(); } }); };
  C.ins['ls-q'] = function (el) { var k = el.dataset.kind; LS(k).q = el.value; LS(k).view = ''; clearTimeout(C._lsT); C._lsT = setTimeout(function () { sync(k); }, 120); };
  C.chs['ls-f'] = function (el) { var k = el.dataset.kind, u = LS(k); u[el.dataset.f] = el.value; if (el.dataset.f === 'cfk') u.cfv = ''; u.view = ''; if (el.dataset.f === 'cfk') { rerender(); var x = $('#lf-cfv'); if (x) x.focus(); } else sync(k); };
  C.acts['ls-kind'] = function (el) { var k = el.dataset.k2, u = LS(k); u.kind = el.dataset.v; u.view = ''; rerender(); var b = $('[data-act="ls-kind"][data-v="' + el.dataset.v + '"]'); if (b) b.focus(); };
  function sync(k) {
    var res = $('#ls-res'); if (!res) return;
    res.innerHTML = k === 'contacts' ? contactsTable() : companiesTable(); syncBulk(k);
    var n = (k === 'contacts' ? contactsFiltered() : companiesFiltered()).length; $('#ls-n').textContent = n + ' ' + (n === 1 ? (k === 'contacts' ? 'contact' : 'company') : k);
    var vt = $('#ls-vt'); if (vt) vt.innerHTML = viewTabs(k);
  }
  function scopeNote() { var s = C.perm('scope'); return s === 'all' ? '' : '<p class="scope-n">' + C.ic('lock', 12) + ' Viewing as ' + esc(C.me().name) + ' (' + C.ROLE_LABEL[C.me().role] + '): you see ' + (s === 'own' ? 'only records you own' : 'your team’s records') + '.</p>'; }
  C.scopeNote = scopeNote;

  // ===== Contacts ===================================================================================
  V.contacts = {
    title: function () { var c = C.cur && C.cur.arg && C.contact(C.cur.arg); return c ? c.name : 'Contacts'; },
    render: function () { var c = C.cur.arg && C.contact(C.cur.arg); return c ? (C.visible(c) ? contactPage(c) : noAccess('contact')) : contactsList(); }
  };
  function noAccess(what) { return '<div class="empty-st">' + C.ic('lock', 22) + '<b>You don’t have access to this ' + what + '</b><span>Your role (' + C.ROLE_LABEL[C.me().role] + ') only sees ' + (C.perm('scope') === 'own' ? 'records you own' : 'your team’s records') + '. Switch user in the sidebar to see it.</span><a class="btn" href="#/dashboard">Go home</a></div>'; }
  C.noAccess = noAccess;
  function contactsList() {
    var u = LS('contacts'), L = P().contacts.filter(C.visible), cfs = cfSelectDefs('contact'), cfd = u.cfk ? C.fieldDef('contact', u.cfk) : null;
    var opt = function (v, t, cur) { return '<option value="' + esc(v) + '"' + (cur === v ? ' selected' : '') + '>' + esc(t) + '</option>'; };
    return page('Contacts', L.length + ' people you can see · homeowners and the teams at companies you work with', (C.can('export') ? '<button type="button" class="btn" data-act="ls-export" data-kind="contacts">' + C.ic('down', 14) + 'Export view</button>' : '') + (C.can('import') ? '<button type="button" class="btn" data-act="csv-open">' + C.ic('upload', 14) + 'Import</button>' : '') + '<button type="button" class="btn pri" data-act="contact-new">' + C.ic('plus', 14) + 'New contact</button>') + scopeNote() +
      '<div id="ls-vt">' + viewTabs('contacts') + '</div>' +
      '<section class="card flush"><div class="toolbar" role="search"><div class="sfield">' + C.ic('search', 15) + '<label class="sr" for="cl-q">Search contacts</label><input id="cl-q" type="search" data-in="ls-q" data-kind="contacts" value="' + esc(u.q) + '" placeholder="Search name, email, phone, company, tag…" autocomplete="off"></div>' +
      '<div class="seg" role="group" aria-label="Contact type">' + [['all', 'All'], ['company', 'At companies'], ['home', 'Homeowners']].map(function (x) { return '<button type="button" data-act="ls-kind" data-k2="contacts" data-v="' + x[0] + '" aria-pressed="' + (u.kind === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<label class="sr" for="lf-o">Owner</label><select id="lf-o" class="sel" data-ch="ls-f" data-kind="contacts" data-f="owner">' + opt('all', 'Any owner', u.owner) + P().users.map(function (x) { return opt(x.name, x.name, u.owner); }).join('') + '</select>' +
      '<label class="sr" for="lf-l">Lifecycle</label><select id="lf-l" class="sel" data-ch="ls-f" data-kind="contacts" data-f="life">' + opt('all', 'Any lifecycle', u.life) + C.fieldDef('contact', 'life').opts.map(function (x) { return opt(x, x, u.life); }).join('') + '</select>' +
      '<label class="sr" for="lf-t">Tag</label><select id="lf-t" class="sel" data-ch="ls-f" data-kind="contacts" data-f="tag">' + opt('all', 'Any tag', u.tag) + C.fieldDef('contact', 'tags').opts.map(function (x) { return opt(x, x, u.tag); }).join('') + '</select>' +
      (cfs.length ? '<label class="sr" for="lf-cfk">Custom field</label><select id="lf-cfk" class="sel" data-ch="ls-f" data-kind="contacts" data-f="cfk">' + opt('', 'Custom field…', u.cfk) + cfs.map(function (f) { return opt(f.key, f.label, u.cfk); }).join('') + '</select>' + (cfd ? '<label class="sr" for="lf-cfv">' + esc(cfd.label) + '</label><select id="lf-cfv" class="sel" data-ch="ls-f" data-kind="contacts" data-f="cfv">' + opt('', 'Any ' + cfd.label.toLowerCase(), u.cfv) + cfd.opts.map(function (x) { return opt(x, x, u.cfv); }).join('') + '</select>' : '') : '') +
      '<span class="count" id="ls-n" role="status">' + contactsFiltered().length + ' contacts</span></div><div id="ls-res">' + contactsTable() + '</div></section><div id="bulkw">' + bulkBar('contacts') + '</div>';
  }
  function contactPage(c) {
    keyReset('contact:' + c.id);
    var co = c.co ? C.company(c.co) : null, l = c.leadId ? C.lead(c.leadId) : null, dealIds = C.assoc('contact', c.id, 'deal'), deals = dealIds.map(C.deal).filter(Boolean);
    return C.recBack('#/contacts', 'Contacts') + '<header class="rec-h"><div class="rec-id">' + C.avatar(c.name, 48) + '<div><h1>' + esc(c.name) + '</h1><p class="muted">' + esc(c.role) + (co ? ' at <a href="#/companies/' + co.id + '">' + esc(co.name) + '</a>' : '') + ' · ' + esc(c.city) + ' ' + C.idChip(c.id) + ' <span class="lifep l-' + esc((c.life || '').toLowerCase()) + '">' + esc(c.life || '') + '</span></p></div></div>' + actionsBar('contact', c.id) + '</header>' +
      '<div class="rec">' +
      '<aside class="rec-attrs card"><h2 class="rbox-h">About</h2>' + C.propPanel('contact', c) +
      (l ? '<h2 class="rbox-h">Original lead</h2><a class="lead-card" href="#/contacts/' + l.id + '">' + C.srcBadge(l.source) + '<span>' + C.pill(l.status) + '</span><span class="muted sm">' + esc(l.id) + ' · score ' + C.score(l).pts + '</span></a>' : '') + '</aside>' +
      '<section class="rec-main">' + C.recCenter('contact', c.id, { c: c.id, lead: c.leadId }, false) + '</section>' +
      '<aside class="rec-side">' + C.assocBox('contact', c.id, 'company') + '<section class="rbox"><h2 class="rbox-h">' + C.ic('deal', 14) + 'Deals <span class="count-b">' + deals.length + '</span><button type="button" class="lnk sm" data-act="assoc-add" data-a="contact:' + c.id + '" data-want="deal">' + C.ic('link', 12) + 'Link</button></h2>' + C.dealRows(deals) + '</section>' +
      C.recTasks({ t: 'contact', id: c.id }) + C.recEvents('contact', c.id) + C.recTickets('contact:' + c.id, function (t) { return t.c === c.id; }) + C.recQuotes(dealIds) + C.recNotes({ c: c.id, lead: c.leadId }) + C.recSeqs(c) + C.recFiles({ t: 'contact', id: c.id }, { c: c.id }) + '</aside></div>';
  }
  C.acts['contact-new'] = function () {
    C.dialog('New contact', '<div class="row2"><div class="field"><label for="nc-n">Full name</label><input id="nc-n" name="name" required autocomplete="off"></div><div class="field"><label for="nc-e">Email</label><input id="nc-e" name="email" type="email" autocomplete="off"></div></div>' +
      '<div class="row2"><div class="field"><label for="nc-p">Phone</label><input id="nc-p" name="phone" type="tel" autocomplete="off" placeholder="+91 …"></div><div class="field"><label for="nc-c">Company</label><select id="nc-c" name="co"><option value="">None (homeowner)</option>' + P().companies.map(function (x) { return '<option value="' + x.id + '">' + esc(x.name) + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="row2"><div class="field"><label for="nc-r">Job title</label><input id="nc-r" name="role" autocomplete="off" placeholder="e.g. Facilities lead"></div><div class="field"><label for="nc-t">City</label><input id="nc-t" name="city" autocomplete="off" value="Gurugram"></div></div>' +
      '<div class="row2"><div class="field"><label for="nc-o">Owner</label><select id="nc-o" name="owner">' + P().users.map(function (u) { return '<option' + (u.name === C.me().name ? ' selected' : '') + '>' + esc(u.name) + '</option>'; }).join('') + '</select></div><div class="field"><label for="nc-s">Source</label><select id="nc-s" name="source">' + P().sources.filter(function (s) { return s.on; }).map(function (s) { return '<option value="' + s.key + '">' + esc(s.label) + '</option>'; }).join('') + '</select></div></div>', 'Create contact', function (fd) {
        var name = (fd.get('name') || '').trim(); if (!name) return false;
        var em = (fd.get('email') || '').trim().toLowerCase(), dup = em && P().contacts.filter(function (x) { return (x.email || '').toLowerCase() === em; })[0];
        if (dup) { C.toast('A contact with that email exists: ' + dup.name, { icon: 'x' }); location.hash = '#/contacts/' + dup.id; return; }
        var c = { id: C.nextId(P().contacts, 'P-', 300), name: name, co: fd.get('co') || null, role: (fd.get('role') || '').trim() || (fd.get('co') ? 'Contact' : 'Homeowner'), phone: (fd.get('phone') || '').trim() || '—', email: em || '—', city: (fd.get('city') || '').trim() || '—', owner: fd.get('owner'), leadId: null, created: Date.now(), life: 'Lead', source: fd.get('source'), tags: [], cf: {} };
        P().contacts.unshift(c); C.pact('system', 'Contact created', { c: c.id, co: c.co }, C.me().name); C.audit('create', C.refOf('contact', c)); C.save();
        C.fire('contact.created', { t: 'contact', rec: c }); location.hash = '#/contacts/' + c.id;
      });
  };

  // ===== CSV import wizard (upload → map → review duplicates) ==========================================
  var SAMPLE = 'Name,Email,Phone,Company,Job title,City,Tags,Preferred language\nIshaan Kapoor,ishaan@cedarlane.example,,Cedar Lane Developers,Sales head,Noida,Decision maker,Hindi\nMeghna Arora,meghna.arora@example.com,+91 98••• ••517,,Homeowner,Gurugram,High value,Punjabi\n"Sharma, Ritu",ritu.s@example.com,+91 99••• ••208,,Homeowner,Noida,,Hindi\nAnkit B.,ankit.b@bluepeak.example,{PHONE},Bluepeak Offices,Admin lead,Noida,,Punjabi\nTara Venkat,tara@lotushomes.example,,Lotus Homes,Founder,Bengaluru,Decision maker,Tamil\nZara Iqbal,zara.iqbal@example.com,,,Homeowner,Saket,,Urdu\n,no-name@example.com,,,,,,';
  var IMP = null;
  function mapOpts() { return [['', 'Skip this column'], ['company', 'Company (name)']].concat(C.fieldDefs('contact').map(function (f) { return [f.key, f.label + (f.sys ? '' : ' (custom)')]; })); }
  function autoMap(h) {
    var x = h.toLowerCase().replace(/[^a-z]/g, ''), hit = '';
    C.fieldDefs('contact').forEach(function (f) { if (x === f.label.toLowerCase().replace(/[^a-z]/g, '') || x === f.key.toLowerCase()) hit = f.key; });
    return hit || (/^(fullname|contact|contactname)$/.test(x) ? 'name' : /mail/.test(x) ? 'email' : /phone|mobile|whatsapp/.test(x) ? 'phone' : /company|organisation|organization|account|firm/.test(x) ? 'company' : /title|designation|role/.test(x) ? 'role' : /city|location|area/.test(x) ? 'city' : /owner|assigned/.test(x) ? 'owner' : /tag|label/.test(x) ? 'tags' : /lifecycle|stage/.test(x) ? 'life' : '');
  }
  function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ''); }
  function impPlan() {
    if (!IMP || IMP.rows.length < 2) return null;
    var body = IMP.rows.slice(1), col = function (k) { return IMP.map.indexOf(k); }, plan = { rows: [], dup: 0, bad: 0, newCo: {} };
    var byE = {}, byP = {}; P().contacts.forEach(function (c) { if (c.email && c.email !== '—') byE[norm(c.email)] = c; if (c.phone && c.phone !== '—') byP[norm(c.phone)] = c; });
    body.forEach(function (r, i) {
      var g = function (k) { var j = col(k); return j > -1 ? (r[j] || '').trim() : ''; };
      var name = g('name'); if (!name) { plan.bad++; return; }
      var em = g('email'), ph = g('phone'), match = (em && byE[norm(em)]) || (ph && byP[norm(ph)]) || null;
      var data = {}; IMP.map.forEach(function (k, j) { if (k && k !== 'company') data[k] = (r[j] || '').trim(); });
      var coName = g('company'); if (coName && !P().companies.some(function (x) { return x.name.toLowerCase() === coName.toLowerCase(); })) plan.newCo[coName] = 1;
      if (match) plan.dup++;
      var by = match ? (em && byE[norm(em)] ? 'email' : 'phone') : '';
      plan.rows.push({ i: i, name: name, data: data, coName: coName, match: match, by: by, review: by === 'phone' && norm(match.name) !== norm(name) });
    });
    return plan;
  }
  // work-card rule: show what an import does to the CRM before anything changes
  function impTiles(pl) {
    var rev = pl.rows.filter(function (r) { return r.review; }).length, mat = pl.dup - rev, nw = pl.rows.length - pl.dup;
    var t = function (n, l, s, c) { return '<div class="imp-t ' + c + '"><b>' + n + '</b><span>' + l + '</span><small>' + s + '</small></div>'; };
    return '<h3 class="h3">What this import does to the CRM</h3><div class="imp-ts">' + t(nw, 'New', 'contacts created', 'new') + t(mat, 'Matched', IMP.dm === 'merge' ? 'merged: empty fields filled, tags added' : IMP.dm === 'skip' ? 'left as they are' : 'created again', 'mat') + t(rev, 'To review', 'same phone, different name: kept out unless you include them', 'rev') + t(pl.bad, 'Skipped', 'rows without a name', 'skip') + '</div>' +
      (pl.rows.length ? '<div class="imp-bar" role="img" aria-label="' + nw + ' new, ' + mat + ' matched, ' + rev + ' to review, ' + pl.bad + ' skipped"><i class="new" style="flex:' + nw + '"></i><i class="mat" style="flex:' + mat + '"></i><i class="rev" style="flex:' + rev + '"></i><i class="skip" style="flex:' + pl.bad + '"></i></div>' : '');
  }
  function stepHtml() {
    var st = IMP.step, steps = ['Upload', 'Map columns', 'Review'].map(function (s, i) { return '<li class="' + (i < st ? 'done' : i === st ? 'now' : '') + '"><span>' + (i + 1) + '</span>' + s + '</li>'; }).join('');
    var body = '';
    if (st === 0) body = '<div class="field"><label for="csv-t">Paste CSV (first row = column names)</label><textarea id="csv-t" rows="6" data-in="csv-text" class="mono" placeholder="Name,Email,Phone,Company,Job title,City">' + esc(IMP.raw || '') + '</textarea></div><div class="csv-btns"><label class="btn sm">' + C.ic('upload', 13) + 'Choose a .csv file<input type="file" accept=".csv,text/csv" data-ch="csv-file" class="sr"></label><button type="button" class="btn sm ghost" data-act="csv-sample">Load an example file with duplicates</button><span class="muted sm">Parsed in your browser; nothing is uploaded.</span></div>' + (IMP.rows.length ? '<p class="csv-sum" role="status">' + (IMP.rows.length - 1) + ' rows and ' + IMP.rows[0].length + ' columns found.</p>' : '');
    else if (st === 1) { var head = IMP.rows[0]; body = '<p class="hint">Match each column to a field. Custom fields are included; unmatched columns are skipped.</p><div class="csv-map2">' + head.map(function (h, i) { return '<div class="cm-row"><span class="mono tr">' + esc(h || 'Column ' + (i + 1)) + '</span><span class="muted sm tr">e.g. ' + esc((IMP.rows[1] || [])[i] || '—') + '</span><label class="sr" for="cm-' + i + '">Field for ' + esc(h) + '</label><select id="cm-' + i + '" data-ch="csv-map" data-i="' + i + '">' + mapOpts().map(function (m) { return '<option value="' + m[0] + '"' + (IMP.map[i] === m[0] ? ' selected' : '') + '>' + esc(m[1]) + '</option>'; }).join('') + '</select></div>'; }).join('') + '</div>' + (IMP.map.indexOf('name') < 0 ? '<p class="late">Map one column to Name to continue.</p>' : ''); }
    else {
      var pl = impPlan();
      body = impTiles(pl) + '<p class="csv-sum" role="status"><b>' + (pl.rows.length - pl.dup) + '</b> new · <b>' + pl.dup + '</b> possible duplicate' + (pl.dup === 1 ? '' : 's') + ' (same email or phone)' + (pl.bad ? ' · <b>' + pl.bad + '</b> without a name will be skipped' : '') + (Object.keys(pl.newCo).length ? ' · creates <b>' + Object.keys(pl.newCo).length + '</b> new compan' + (Object.keys(pl.newCo).length > 1 ? 'ies' : 'y') : '') + '</p>' +
        '<fieldset class="dupmode"><legend>For duplicates</legend>' + [['merge', 'Merge: fill empty fields and add tags on the existing contact'], ['skip', 'Skip them'], ['create', 'Create new contacts anyway']].map(function (x) { return '<label class="chk"><input type="radio" name="dm" value="' + x[0] + '" data-ch="csv-dm"' + (IMP.dm === x[0] ? ' checked' : '') + '> ' + x[1] + '</label>'; }).join('') + '</fieldset>' +
        '<div class="tablewrap csv-t"><table class="tbl dense"><thead><tr><th scope="col">Row</th><th scope="col">Name</th><th scope="col">Email / phone</th><th scope="col">Result</th></tr></thead><tbody>' + pl.rows.map(function (r) { return '<tr><td class="muted">' + (r.i + 2) + '</td><td>' + esc(r.name) + '</td><td class="muted sm">' + esc(r.data.email || r.data.phone || '—') + '</td><td>' + (r.match ? '<span class="dupb">Matches ' + esc(r.match.name) + ' by ' + r.by + '</span> → ' + { merge: 'merge', skip: 'skip', create: 'new contact' }[IMP.dm] : '<span class="ok-t">New</span>') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    return '<ol class="wiz">' + steps + '</ol><div class="wiz-b">' + body + '</div>';
  }
  function impPaint() { var b = $('#imp-b'); if (b) b.innerHTML = stepHtml(); var btn = $('#dlg .dlg-foot .btn.pri'); if (btn) btn.textContent = IMP.step === 2 ? 'Apply' : 'Next'; var all = $('#dlg [data-act="csv-all"]'), pl0 = IMP.step === 2 && impPlan(); if (all) all.hidden = !(pl0 && pl0.rows.some(function (r) { return r.review; })); var back = $('#dlg [data-act="csv-back"]'); if (back) back.hidden = IMP.step === 0; }
  function impLoad(txt) { IMP.raw = txt; var rows = C.csvParse(txt).slice(0, 1001); IMP.rows = rows; IMP.map = rows[0] ? rows[0].map(autoMap) : []; impPaint(); }
  C.acts['csv-all'] = function () { IMP.incl = true; var f = $('#dlg form'); if (f) f.requestSubmit(); };
  C.acts['csv-open'] = function () {
    if (!C.guard('import', 'import data')) return;
    IMP = { step: 0, rows: [], map: [], dm: 'merge', raw: '' };
    C.dialog('Import contacts', '<div id="imp-b"></div>', 'Next', function () {
      if (IMP.step === 0) { if (IMP.rows.length < 2) { C.toast('Paste or choose a CSV with a header row first', { icon: 'x' }); return false; } IMP.step = 1; impPaint(); return false; }
      if (IMP.step === 1) { if (IMP.map.indexOf('name') < 0) { C.toast('Map a column to Name', { icon: 'x' }); return false; } IMP.step = 2; impPaint(); return false; }
      var pl = impPlan(), p = P(), now = Date.now(), made = 0, merged = 0, skipped = 0;
      Object.keys(pl.newCo).forEach(function (nm) { var co = { id: C.nextId(p.companies, 'CO-', 100), name: nm, industry: '—', city: '—', size: '—', domain: nm.toLowerCase().replace(/[^a-z]/g, '') + '.example', owner: C.me().name, created: now, cf: {} }; p.companies.unshift(co); C.audit('import', C.refOf('company', co), 'created from CSV'); });
      pl.rows.forEach(function (r, i) {
        var co = r.coName ? p.companies.filter(function (x) { return x.name.toLowerCase() === r.coName.toLowerCase(); })[0] : null;
        if (r.review && !IMP.incl) { skipped++; return; }
        if (r.match && IMP.dm === 'skip') { skipped++; return; }
        if (r.match && IMP.dm === 'merge') {
          var m = r.match, filled = [];
          Object.keys(r.data).forEach(function (k) { var f = C.fieldDef('contact', k), v = r.data[k]; if (!f || !v || k === 'name') return; if (f.type === 'multi') { var cur = [].concat(C.getF(m, f) || []); v.split(/[;|]/).map(function (x) { return x.trim(); }).forEach(function (x) { if (x && cur.indexOf(x) < 0) { cur.push(x); filled.push(f.label); } }); C.setF(m, f, cur); return; } var cv = C.getF(m, f); if (!cv || cv === '—') { C.setF(m, f, v); filled.push(f.label); } });
          if (co && !m.co) { m.co = co.id; filled.push('Company'); }
          C.audit('import', C.refOf('contact', m), 'merged from CSV', '', filled.join(', ') || 'no empty fields'); merged++; return;
        }
        var c = { id: C.nextId(p.contacts, 'P-', 300), name: r.name, co: co ? co.id : null, role: '', phone: '—', email: '—', city: '—', owner: C.rrNext(), leadId: null, created: now + i, life: 'Lead', source: 'web', tags: ['Imported'], cf: {} };
        Object.keys(r.data).forEach(function (k) { var f = C.fieldDef('contact', k), v = r.data[k]; if (!f || !v) return; C.setF(c, f, f.type === 'multi' ? ['Imported'].concat(v.split(/[;|]/).map(function (x) { return x.trim(); }).filter(Boolean)) : f.type === 'user' ? (C.user(v) ? v : c.owner) : v); });
        if (!c.role) c.role = co ? 'Contact' : 'Homeowner';
        p.contacts.unshift(c); C.pact('system', 'Imported from CSV', { c: c.id, co: c.co }, C.me().name); C.audit('import', C.refOf('contact', c)); made++;
        C.fire('contact.created', { t: 'contact', rec: c }, { silent: true });
      });
      C.save(); C.ui.ls_contacts = null;
      C.toast('Import finished: ' + made + ' created, ' + merged + ' merged, ' + skipped + ' skipped' + (pl.bad ? ', ' + pl.bad + ' without a name' : ''), { icon: 'upload' });
      if (C.cur.name === 'contacts' && !C.cur.arg) setTimeout(rerender, 20); else location.hash = '#/contacts';
    });
    var foot = $('#dlg .dlg-foot'); if (foot) foot.insertAdjacentHTML('afterbegin', '<button type="button" class="btn ghost" data-act="csv-back" hidden>Back</button><span class="grow"></span>'); var pri = $('#dlg .dlg-foot .btn.pri'); if (pri) pri.insertAdjacentHTML('beforebegin', '<button type="button" class="btn" data-act="csv-all" hidden>Apply including review</button>');
    impPaint();
  };
  C.acts['csv-back'] = function () { if (IMP.step > 0) { IMP.step--; impPaint(); } };
  C.ins['csv-text'] = function (el) { clearTimeout(C._csvT); C._csvT = setTimeout(function () { var pos = el.selectionStart; impLoad(el.value); var t = $('#csv-t'); if (t) { t.focus(); t.setSelectionRange(pos, pos); } }, 300); };
  C.acts['csv-sample'] = function () { var ph = (P().contacts.filter(function (c) { return c.name === 'Ankit Bhalla'; })[0] || {}).phone || '+91 98••• ••999'; impLoad(SAMPLE.replace('{PHONE}', ph)); };
  C.chs['csv-file'] = function (el) { var f = el.files && el.files[0]; if (!f) return; if (f.size > 2e6) { C.toast('That file is over 2 MB — try a smaller export', { icon: 'x' }); return; } var r = new FileReader(); r.onload = function () { impLoad(String(r.result).slice(0, 4e5)); }; r.readAsText(f); };
  C.chs['csv-map'] = function (el) { IMP.map[+el.dataset.i] = el.value; impPaint(); var s = $('#cm-' + el.dataset.i); if (s) s.focus(); };
  C.chs['csv-dm'] = function (el) { IMP.dm = el.value; impPaint(); var r = $('[data-ch="csv-dm"][value="' + el.value + '"]'); if (r) r.focus(); };

  // ===== Companies ======================================================================================
  function companiesFiltered() {
    var u = LS('companies'), q = u.q.toLowerCase(), pv = function (c) { return openDeals('company', c.id).reduce(function (s, d) { return s + C.dealVal(d); }, 0); };
    return P().companies.filter(function (c) { return C.visible(c) && (u.owner === 'all' || c.owner === u.owner) && (u.ind === 'all' || c.industry === u.ind) && (!u.cfk || !u.cfv || (c.cf || {})[u.cfk] === u.cfv) && (!q || (c.name + ' ' + c.industry + ' ' + c.city + ' ' + c.domain).toLowerCase().indexOf(q) > -1); })
      .sort(function (a, b) { var va = u.sort === 'pipe' ? -pv(a) : a.name.toLowerCase(), vb = u.sort === 'pipe' ? -pv(b) : b.name.toLowerCase(); return (va > vb ? 1 : va < vb ? -1 : 0) * u.dir; });
  }
  function companiesTable() {
    var a = companiesFiltered(), sel = SEL.companies || {};
    if (!a.length) return '<div class="empty-st">' + C.ic('building', 22) + '<b>No companies match</b><span>Companies are created when you add a contact at a business, or from an import.</span><button type="button" class="btn" data-act="ls-clear" data-kind="companies">Clear filters</button></div>';
    var all = a.every(function (c) { return sel[c.id]; });
    return '<div class="tablewrap"><table class="tbl dense rtbl"><thead><tr><th scope="col" class="c-sel"><input type="checkbox" data-ch="sel-all" data-kind="companies"' + (all ? ' checked' : '') + ' aria-label="Select all ' + a.length + ' companies"></th>' + sortTh('companies', 'name', 'Company') + '<th scope="col">Industry</th><th scope="col">City</th><th scope="col" class="num">People</th>' + sortTh('companies', 'pipe', 'Open pipeline', 'num') + '<th scope="col" class="num">Won</th><th scope="col">Owner</th></tr></thead><tbody>' + a.map(function (co) {
      var ds = C.assoc('company', co.id, 'deal').map(C.deal).filter(Boolean), open = ds.filter(C.dealOpen), won = ds.filter(function (d) { return C.pstage(d.pipe, d.stage).won; });
      return '<tr tabindex="0" data-href="#/companies/' + co.id + '"' + (sel[co.id] ? ' class="sel"' : '') + '>' + selCell('companies', co.id, co.name) + '<td class="c-main"><div class="lc">' + C.logo(co.name, 28) + '<div><a class="lname" href="#/companies/' + co.id + '">' + esc(co.name) + '</a><div class="muted sm mono">' + esc(co.domain) + '</div></div></div></td><td class="muted">' + esc(co.industry) + '</td><td class="muted">' + esc(co.city) + '</td><td class="num">' + C.assoc('company', co.id, 'contact').length + '</td><td class="num">' + (open.length ? C.rs(open.reduce(function (s, d) { return s + C.dealVal(d); }, 0)) : '<span class="muted">—</span>') + '</td><td class="num">' + (won.length ? C.rs(won.reduce(function (s, d) { return s + C.dealVal(d); }, 0)) : '<span class="muted">—</span>') + '</td>' + ownerCell('companies', co) + '</tr>';
    }).join('') + '</tbody></table></div>';
  }
  V.companies = {
    title: function () { var c = C.cur && C.cur.arg && C.company(C.cur.arg); return c ? c.name : 'Companies'; },
    render: function () { var c = C.cur.arg && C.company(C.cur.arg); return c ? (C.visible(c) ? companyPage(c) : noAccess('company')) : companyList(); }
  };
  function companyList() {
    var u = LS('companies'), L = P().companies.filter(C.visible), inds = C.fieldDef('company', 'industry').opts, cfs = cfSelectDefs('company'), cfd = u.cfk ? C.fieldDef('company', u.cfk) : null;
    var opt = function (v, t, cur) { return '<option value="' + esc(v) + '"' + (cur === v ? ' selected' : '') + '>' + esc(t) + '</option>'; };
    return page('Companies', L.length + ' accounts · developers, architects, offices, hospitality and healthcare', (C.can('export') ? '<button type="button" class="btn" data-act="ls-export" data-kind="companies">' + C.ic('down', 14) + 'Export view</button>' : '') + '<button type="button" class="btn pri" data-act="company-new">' + C.ic('plus', 14) + 'New company</button>') + scopeNote() +
      '<section class="card flush"><div class="toolbar" role="search"><div class="sfield">' + C.ic('search', 15) + '<label class="sr" for="kl-q">Search companies</label><input id="kl-q" type="search" data-in="ls-q" data-kind="companies" value="' + esc(u.q) + '" placeholder="Search name, industry, city…" autocomplete="off"></div>' +
      '<label class="sr" for="kf-i">Industry</label><select id="kf-i" class="sel" data-ch="ls-f" data-kind="companies" data-f="ind">' + opt('all', 'Any industry', u.ind) + inds.filter(function (x) { return x !== '—'; }).map(function (x) { return opt(x, x, u.ind); }).join('') + '</select>' +
      '<label class="sr" for="kf-o">Owner</label><select id="kf-o" class="sel" data-ch="ls-f" data-kind="companies" data-f="owner">' + opt('all', 'Any owner', u.owner) + P().users.map(function (x) { return opt(x.name, x.name, u.owner); }).join('') + '</select>' +
      (cfs.length ? '<label class="sr" for="kf-cfk">Custom field</label><select id="kf-cfk" class="sel" data-ch="ls-f" data-kind="companies" data-f="cfk">' + opt('', 'Custom field…', u.cfk) + cfs.map(function (f) { return opt(f.key, f.label, u.cfk); }).join('') + '</select>' + (cfd ? '<label class="sr" for="lf-cfv">' + esc(cfd.label) + '</label><select id="lf-cfv" class="sel" data-ch="ls-f" data-kind="companies" data-f="cfv">' + opt('', 'Any', u.cfv) + cfd.opts.map(function (x) { return opt(x, x, u.cfv); }).join('') + '</select>' : '') : '') +
      '<span class="count" id="ls-n" role="status">' + companiesFiltered().length + ' companies</span></div><div id="ls-res">' + companiesTable() + '</div></section><div id="bulkw">' + bulkBar('companies') + '</div>';
  }
  C.acts['company-new'] = function () {
    C.dialog('New company', '<div class="row2"><div class="field"><label for="nk-n">Name</label><input id="nk-n" name="name" required autocomplete="off"></div><div class="field"><label for="nk-d">Website</label><input id="nk-d" name="domain" autocomplete="off" placeholder="example.in"></div></div><div class="row2"><div class="field"><label for="nk-i">Industry</label><select id="nk-i" name="ind">' + C.fieldDef('company', 'industry').opts.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select></div><div class="field"><label for="nk-c">City</label><input id="nk-c" name="city" value="Gurugram" autocomplete="off"></div></div>', 'Create company', function (fd) {
      var name = (fd.get('name') || '').trim(); if (!name) return false;
      if (P().companies.some(function (x) { return x.name.toLowerCase() === name.toLowerCase(); })) { C.toast('A company with that name already exists', { icon: 'x' }); return false; }
      var co = { id: C.nextId(P().companies, 'CO-', 100), name: name, industry: fd.get('ind'), city: (fd.get('city') || '').trim() || '—', size: '—', domain: (fd.get('domain') || '').trim() || '—', owner: C.me().name, created: Date.now(), cf: {} };
      P().companies.unshift(co); C.pact('system', 'Company created', { co: co.id }, C.me().name); C.audit('create', C.refOf('company', co)); C.save(); location.hash = '#/companies/' + co.id;
    });
  };
  function companyPage(co) {
    keyReset('company:' + co.id);
    var dealIds = C.assoc('company', co.id, 'deal'), deals = dealIds.map(C.deal).filter(Boolean), open = deals.filter(C.dealOpen), won = deals.filter(function (d) { return C.pstage(d.pipe, d.stage).won; });
    return C.recBack('#/companies', 'Companies') + '<header class="rec-h"><div class="rec-id">' + C.logo(co.name, 48) + '<div><h1>' + esc(co.name) + '</h1><p class="muted">' + esc(co.industry) + ' · ' + esc(co.city) + ' · <span class="mono">' + esc(co.domain) + '</span> ' + C.idChip(co.id) + '</p></div></div>' + actionsBar('company', co.id) + '</header>' +
      '<div class="kpis rec-k"><div><span>Open pipeline</span><b>' + C.rs(open.reduce(function (s, d) { return s + C.dealVal(d); }, 0)) + '</b><small>' + open.length + ' deals</small></div><div><span>Won to date</span><b>' + C.rs(won.reduce(function (s, d) { return s + C.dealVal(d); }, 0)) + '</b><small>' + won.length + ' deals</small></div><div><span>Weighted</span><b>' + C.rs(open.reduce(function (s, d) { return s + C.dealVal(d) * C.dealProb(d) / 100; }, 0)) + '</b><small>value × probability</small></div><div><span>Open tickets</span><b>' + P().tickets.filter(function (t) { return t.co === co.id && t.status !== 'closed'; }).length + '</b><small>after-sales</small></div></div>' +
      '<div class="rec"><aside class="rec-attrs card"><h2 class="rbox-h">About</h2>' + C.propPanel('company', co) + '</aside>' +
      '<section class="rec-main">' + C.recCenter('company', co.id, { co: co.id }, false) + '</section>' +
      '<aside class="rec-side">' + C.assocBox('company', co.id, 'contact') + '<section class="rbox"><h2 class="rbox-h">' + C.ic('deal', 14) + 'Deals <span class="count-b">' + deals.length + '</span><button type="button" class="lnk sm" data-act="assoc-add" data-a="company:' + co.id + '" data-want="deal">' + C.ic('link', 12) + 'Link</button></h2>' + C.dealRows(deals) + '</section>' +
      C.recTasks({ t: 'company', id: co.id }) + C.recEvents('company', co.id) + C.recTickets('company:' + co.id, function (t) { return t.co === co.id; }) + C.recQuotes(dealIds) + C.recNotes({ co: co.id }) + C.recFiles({ t: 'company', id: co.id }, { co: co.id }) + '</aside></div>';
  }
})();
