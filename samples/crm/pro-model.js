/* Lumen CRM Pro — shared model contracts used by every module:
   users, roles and permissions · audit log · typed fields (built-in + custom) · many-to-many associations ·
   business-hours SLA · CSV export · global search and nav-badge hooks · skeleton states · module seeders.
   Modules extend through arrays: C.seeders, C.searchers, C.badgeFns. */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$;
  var P = function () { return C.P(); };
  C.seeders = C.seeders || [];      // fn(P, S): idempotent; seed only the keys you own when they are missing
  C.searchers = C.searchers || [];  // fn(terms, hit) -> [{ g, ic | av, label, sub, run }]
  C.badgeFns = C.badgeFns || [];    // fn() -> { badgeName: count }
  C.IC.moon = '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'; C.IC.sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  C.IC.cog = '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>';
  C.IC.ticket = '<path d="M3 8.5V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.5a2.5 2.5 0 0 0 0 5V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2.5a2.5 2.5 0 0 0 0-5z"/><path d="M9 5v12" stroke-dasharray="2 2"/>';
  C.IC.quote = '<path d="M6 3h9l4 4v14H6z"/><path d="M14.5 3v4.5H19M9 12h7M9 15.5h7M9 9h3"/>'; C.IC.down = '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>'; C.IC.print = '<path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="7" rx="1"/>';
  C.ATYPE.meeting = ['Meeting', 'cal']; C.ATYPE.ticket = ['Ticket', 'flag']; C.ATYPE.quote = ['Quote', 'note']; C.ATYPE.convo = ['Conversation', 'mail'];

  // ---- users, roles, permissions --------------------------------------------------------
  C.ROLE_LABEL = { admin: 'Admin', manager: 'Manager', agent: 'Agent' };
  C.PERMS = [
    ['scope', 'Records they can see', 'select', [['all', 'Everyone’s'], ['team', 'Their team’s'], ['own', 'Only their own']]],
    ['editOthers', 'Edit records owned by others', 'bool'], ['delete', 'Delete records', 'bool'], ['bulk', 'Bulk actions', 'bool'],
    ['import', 'Import CSV', 'bool'], ['export', 'Export CSV', 'bool'], ['automation', 'Edit workflows, sequences and gates', 'bool'],
    ['reports', 'See reports', 'bool'], ['settings', 'Change settings (pipelines, fields, users)', 'bool'], ['discount', 'Max quote discount (%)', 'num']
  ];
  C.users = function () { return P().users; };
  C.user = function (name) { return P().users.filter(function (u) { return u.name === name; })[0] || null; };
  C.me = function () { return C.user(P().me) || P().users[0]; };
  C.perm = function (k) { var r = P().roles[C.me().role] || {}; return r[k]; };
  C.teamOf = function (name) { var u = C.user(name); return u ? u.team : ''; };
  C.visibleOwner = function (owner) {
    var s = C.perm('scope'), me = C.me();
    return s === 'all' || !owner ? true : s === 'team' ? C.teamOf(owner) === me.team : owner === me.name;
  };
  C.visible = function (rec) { return !rec || C.visibleOwner(rec.owner); };
  C.visibleLead = function (l) { return C.visibleOwner(l.owner); };
  // can(action[, record]) — 'edit' checks ownership against editOthers
  C.can = function (k, rec) {
    if (k === 'edit') return !rec || rec.owner === C.me().name || !!C.perm('editOthers');
    var v = C.perm(k); return typeof v === 'number' ? v > 0 : !!v;
  };
  C.deny = function (what) { C.toast('Your role (' + C.ROLE_LABEL[C.me().role] + ') can’t ' + what + '. Switch user from the sidebar to try another role.', { icon: 'lock' }); return false; };
  C.guard = function (k, what, rec) { return C.can(k, rec) ? true : C.deny(what); };

  // ---- audit log -----------------------------------------------------------------------------
  C.refOf = function (t, o) { return { t: t, id: o.id, name: o.name || o.subj || o.title || o.id }; };
  C.audit = function (act, ref, field, from, to, who) {
    var p = P(); if (!p.audit) p.audit = [];
    p.audit.unshift({ t: Date.now(), who: who || C.me().name, act: act, ref: ref || null, field: field || '', from: from == null ? '' : String(from).slice(0, 120), to: to == null ? '' : String(to).slice(0, 120) });
    if (p.audit.length > 600) p.audit.length = 600;
  };
  C.auditFor = function (t, id) { return (P().audit || []).filter(function (a) { return a.ref && a.ref.t === t && a.ref.id === id; }); };
  C.ACT_LABEL = { create: 'created', update: 'changed', delete: 'deleted', stage: 'moved', assign: 'reassigned', import: 'imported', export: 'exported', settings: 'updated settings', link: 'associated', unlink: 'removed association', status: 'changed status of', bulk: 'bulk-updated', login: 'switched to' };
  C.auditLine = function (a) {
    var r = a.ref ? '<a href="' + C.refHref(a.ref) + '">' + esc(a.ref.name) + '</a>' : '';
    return '<b>' + esc(a.who.split(' ')[0]) + '</b> ' + (C.ACT_LABEL[a.act] || a.act) + ' ' + r + (a.field ? ' · <span class="muted">' + esc(a.field) + '</span>' : '') + (a.from || a.to ? ' <span class="aud-ft">' + (a.from ? '<s>' + esc(a.from) + '</s> → ' : '') + esc(a.to) + '</span>' : '');
  };

  // ---- typed fields (built-in + custom) ----------------------------------------------------------
  // def: { key, label, type: text|textarea|number|currency|date|select|multi|user|phone|email, opts?, sys?, path? }
  // path: where a built-in lives ('rec' = record property, 'fields' = deal.fields); custom values live in rec.cf
  C.FTYPES = { text: 'Text', textarea: 'Long text', number: 'Number', currency: '₹ Currency', date: 'Date', select: 'Dropdown', multi: 'Multi-select', user: 'User', phone: 'Phone', email: 'Email' };
  C.fieldDefs = function (obj) { return (P().fields || {})[obj] || []; };
  C.fieldDef = function (obj, key) { return C.fieldDefs(obj).filter(function (f) { return f.key === key; })[0]; };
  C.getF = function (rec, f) { if (f.path === 'rec') return rec[f.key]; if (f.path === 'fields') return (rec.fields || {})[f.key]; return (rec.cf || {})[f.key]; };
  C.setF = function (rec, f, v) { if (f.path === 'rec') rec[f.key] = v; else if (f.path === 'fields') { rec.fields = rec.fields || {}; rec.fields[f.key] = v; } else { rec.cf = rec.cf || {}; rec.cf[f.key] = v; } };
  C.fmtF = function (f, v) {
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '';
    if (f.type === 'currency') return +v ? C.inr(+v) : '';
    if (f.type === 'number') return C.num(+v);
    if (f.type === 'date') return C.dfull(typeof v === 'number' ? v : new Date(v + 'T12:00').getTime());
    if (f.type === 'multi') return [].concat(v).join(', ');
    return String(v);
  };
  C.fieldInput = function (f, v, id, extra) {
    extra = extra || ''; var a = ' id="' + id + '" name="v" ' + extra;
    if (f.type === 'select' || f.type === 'user') {
      var o = f.type === 'user' ? P().users.map(function (u) { return u.name; }) : (f.opts || []);
      return '<select' + a + '><option value="">—</option>' + o.map(function (x) { return '<option' + (x === v ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>';
    }
    if (f.type === 'multi') return '<div class="msel" role="group" aria-label="' + esc(f.label) + '">' + (f.opts || []).map(function (x, i) { return '<label class="chk"><input type="checkbox" name="v" value="' + esc(x) + '"' + ([].concat(v || []).indexOf(x) > -1 ? ' checked' : '') + '> ' + esc(x) + '</label>'; }).join('') + '</div>';
    if (f.type === 'textarea') return '<textarea' + a + ' rows="3">' + esc(v || '') + '</textarea>';
    var t = { number: 'number', currency: 'number', date: 'date', phone: 'tel', email: 'email' }[f.type] || 'text';
    var val = f.type === 'date' && typeof v === 'number' ? new Date(v).toISOString().slice(0, 10) : (v == null ? '' : v);
    return '<input type="' + t + '"' + a + (f.type === 'currency' ? ' min="0" step="1000" inputmode="numeric"' : '') + ' value="' + esc(val) + '" autocomplete="off">';
  };
  C.readField = function (f, fd) {
    if (f.type === 'multi') return fd.getAll('v');
    var v = fd.get('v'); if (v == null) return '';
    if (f.type === 'number' || f.type === 'currency') return v === '' ? '' : +v;
    if (f.type === 'date') return v ? new Date(v + 'T12:00').getTime() : '';
    return String(v).trim();
  };

  // ---- associations (many-to-many) --------------------------------------------------------------
  // primary links live on the records (contact.co, deal.c, deal.co); extra links live in P.links: { a: 't:id', b: 't:id', label }
  function key(t, id) { return t + ':' + id; }
  C.assoc = function (t, id, want) {
    var out = [], k = key(t, id), add = function (x) { if (x && out.indexOf(x) < 0) out.push(x); };
    var p = P();
    if (t === 'contact') { var c = C.contact(id); if (c && want === 'company') add(c.co); if (want === 'deal') p.deals.forEach(function (d) { if (d.c === id) add(d.id); }); }
    if (t === 'company') { if (want === 'contact') p.contacts.forEach(function (c) { if (c.co === id) add(c.id); }); if (want === 'deal') p.deals.forEach(function (d) { if (d.co === id) add(d.id); }); }
    if (t === 'deal') { var d = C.deal(id); if (d && want === 'contact') add(d.c); if (d && want === 'company') add(d.co); }
    (p.links || []).forEach(function (l) { var o = l.a === k ? l.b : l.b === k ? l.a : null; if (o && o.split(':')[0] === want) add(o.split(':')[1]); });
    return out;
  };
  C.assocLabel = function (t1, id1, t2, id2) { var a = key(t1, id1), b = key(t2, id2), l = (P().links || []).filter(function (x) { return (x.a === a && x.b === b) || (x.a === b && x.b === a); })[0]; return l ? l.label : 'Primary'; };
  C.isPrimary = function (t1, id1, t2, id2) { return C.assocLabel(t1, id1, t2, id2) === 'Primary'; };
  C.link = function (t1, id1, t2, id2, label) {
    var p = P(); p.links = p.links || []; if (C.assoc(t1, id1, t2).indexOf(id2) > -1) return false;
    p.links.push({ a: key(t1, id1), b: key(t2, id2), label: label || 'Associated' }); return true;
  };
  C.unlink = function (t1, id1, t2, id2) {
    var a = key(t1, id1), b = key(t2, id2), p = P(), n = (p.links || []).length;
    p.links = (p.links || []).filter(function (x) { return !((x.a === a && x.b === b) || (x.a === b && x.b === a)); });
    return p.links.length < n;
  };
  C.recOf = function (t, id) { return t === 'deal' ? C.deal(id) : t === 'contact' ? C.contact(id) : t === 'company' ? C.company(id) : t === 'lead' ? C.lead(id) : null; };

  // ---- business hours + SLA ------------------------------------------------------------------------
  // minutes between a and b that fall inside business hours (P.hours: days 0–6, start/end minutes, IST = browser time in the demo)
  C.bizMin = function (a, b) {
    var H = P().hours; if (!H || !H.on) return (b - a) / 6e4;
    var m = 0, d = new Date(a); d.setHours(0, 0, 0, 0);
    for (var g = 0; g < 60 && d.getTime() < b; g++) {
      if (H.days.indexOf(d.getDay()) > -1) { var s = d.getTime() + H.start * 6e4, e = d.getTime() + H.end * 6e4, lo = Math.max(a, s), hi = Math.min(b, e); if (hi > lo) m += (hi - lo) / 6e4; }
      d.setDate(d.getDate() + 1);
    }
    return m;
  };
  C.inHours = function (t) { var H = P().hours, d = new Date(t || Date.now()), mm = d.getHours() * 60 + d.getMinutes(); return !H || !H.on || (H.days.indexOf(d.getDay()) > -1 && mm >= H.start && mm < H.end); };
  C.sla = function (l) {
    var tgt = P().route.sla;
    if (l.resp != null) return { state: l.resp <= tgt ? 'met' : 'late', min: l.resp, tgt: tgt };
    var m = C.bizMin(l.created, Date.now());
    return { state: m < tgt * .5 ? 'ok' : m < tgt ? 'risk' : 'breach', min: m, tgt: tgt, paused: !C.inHours() };
  };
  C.hm = function (m) { var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? 'pm' : 'am', h12 = h % 12 || 12; return h12 + (mm ? ':' + String(mm).padStart(2, '0') : '') + ' ' + ap; };

  // ---- CSV export ----------------------------------------------------------------------------------
  C.csvCell = function (v) { v = v == null ? '' : Array.isArray(v) ? v.join('; ') : String(v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  C.exportCSV = function (name, cols, rows, ref) {
    if (!C.guard('export', 'export data')) return;
    var lines = [cols.map(function (c) { return C.csvCell(c[0]); }).join(',')].concat(rows.map(function (r) { return cols.map(function (c) { return C.csvCell(c[1](r)); }).join(','); }));
    var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'lumen-' + name + '-' + new Date().toISOString().slice(0, 10) + '.csv'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    C.audit('export', null, name, '', rows.length + ' rows'); C.save();
    C.toast('Exported ' + rows.length + ' rows to CSV', { icon: 'upload' });
  };

  // ---- global search (palette) ----------------------------------------------------------------------
  C.palExtra = function (terms, hit) {
    if (!terms.length) return [];
    var out = [], p = P();
    p.contacts.filter(C.visible).filter(function (c) { return hit(c.name + ' ' + c.email + ' ' + c.phone + ' ' + c.role + ' ' + c.city + ' ' + (c.co ? (C.company(c.co) || {}).name : '')); }).slice(0, 5).forEach(function (c) { out.push({ g: 'Contacts', av: c.name, label: c.name, sub: c.id + ' · ' + c.role + (c.co ? ' · ' + C.company(c.co).name : ''), run: function () { location.hash = '#/contacts/' + c.id; } }); });
    p.companies.filter(C.visible).filter(function (c) { return hit(c.name + ' ' + c.industry + ' ' + c.city + ' ' + c.domain); }).slice(0, 4).forEach(function (c) { out.push({ g: 'Companies', ic: 'building', label: c.name, sub: c.industry + ' · ' + c.city, run: function () { location.hash = '#/companies/' + c.id; } }); });
    p.deals.filter(C.visible).filter(function (d) { return hit(d.name + ' ' + d.id + ' ' + C.pstage(d.pipe, d.stage).label); }).slice(0, 5).forEach(function (d) { out.push({ g: 'Deals', ic: 'deal', label: d.name, sub: d.id + ' · ' + C.pstage(d.pipe, d.stage).label + ' · ' + C.rs(C.dealVal(d)), run: function () { location.hash = '#/deals/' + d.id; } }); });
    p.acts.filter(function (a) { return a.type === 'note' && hit(a.text); }).slice(0, 4).forEach(function (a) { var r = a.d ? { t: 'deal', id: a.d } : a.c ? { t: 'contact', id: a.c } : { t: 'company', id: a.co }; out.push({ g: 'Notes', ic: 'note', label: a.text.slice(0, 70), sub: C.refName(r) + ' · ' + C.dshort(a.t), run: function () { location.hash = C.refHref(r); } }); });
    C.searchers.forEach(function (f) { try { out = out.concat(f(terms, hit) || []); } catch (e) { } });
    return out;
  };

  // ---- skeleton states: the first visit to a heavy view shows a short loading skeleton -----------------
  var seen = {}, SK = { contacts: 'table', companies: 'table', deals: 'board', reports: 'cards', conversations: 'split', calendar: 'cal', settings: 'table', routing: 'cards', workflows: 'table' };
  C.preSkel = function (v, done) {
    var name = C.cur && C.cur.name, kind = SK[name]; if (!kind || seen[name] || (C.cur.arg && name !== 'conversations')) return false;
    seen[name] = 1; var main = $('#view'), row = function (w) { return '<span class="sk" style="width:' + w + '"></span>'; }, h = '';
    if (kind === 'table') { for (var i = 0; i < 9; i++) h += '<div class="sk-row">' + row('28px') + row(30 + (i * 17) % 30 + '%') + row('18%') + row('12%') + '</div>'; }
    else if (kind === 'board') { for (var j = 0; j < 5; j++) h += '<div class="sk-col">' + row('60%') + '<span class="sk sk-card"></span><span class="sk sk-card"></span>' + (j % 2 ? '' : '<span class="sk sk-card"></span>') + '</div>'; h = '<div class="sk-board">' + h + '</div>'; }
    else { for (var k = 0; k < 4; k++) h += '<span class="sk sk-block"></span>'; h = '<div class="sk-grid">' + h + '</div>'; }
    main.innerHTML = '<div class="sk-page" aria-busy="true" aria-label="Loading"><div class="sk-h">' + row('180px') + row('320px') + '</div>' + h + '</div>';
    setTimeout(done, C.motion() ? 260 : 120);
    return true;
  };
})();
