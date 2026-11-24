/* Lumen CRM Pro — settings: users and roles (permission matrix enforced across the app), pipelines and stages,
   custom fields (appear on records, filters, import and export), lead sources, business hours (drive SLA timers),
   message templates (used by composers, sequences, workflows and conversations), and the global audit log. */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$, V = C.views, page = C.page;
  var P = function () { return C.P(); };
  var TABS = [['workspace', 'Workspace and templates', 'dash'], ['users', 'Users and roles', 'user'], ['pipelines', 'Pipelines', 'pipe'], ['objects', 'Objects', 'box'], ['fields', 'Custom fields', 'note'], ['layouts', 'Page layouts and record types', 'grip'], ['approvals', 'Approval processes', 'check'], ['territories', 'Territories and quotas', 'pin'], ['sources', 'Lead sources', 'flag'], ['hours', 'Business hours', 'clock'], ['templates', 'Templates', 'mail'], ['audit', 'Audit log', 'eye']];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function canSet() { return C.can('settings'); }
  function ro() { return canSet() ? '' : ' disabled'; }
  function saved(what, from, to) { C.audit('settings', null, what, from, to); C.save(); }
  function keep(sel) { C.rerender(); var x = $(sel); if (x) x.focus({ preventScroll: true }); }
  function sw(act, data, on, label, dis) { return '<button type="button" class="switch" role="switch" aria-checked="' + !!on + '" data-act="' + act + '" ' + data + ' aria-label="' + esc(label) + '"' + (dis ? ' disabled' : '') + '><i></i></button>'; }
  function guard() { return canSet() ? true : C.deny('change workspace settings'); }

  V.settings = {
    title: function () { var t = TABS.filter(function (x) { return x[0] === (C.cur && C.cur.arg); })[0]; return t ? 'Settings · ' + t[1] : 'Settings'; },
    render: function () {
      var tab = TABS.some(function (x) { return x[0] === C.cur.arg; }) ? C.cur.arg : 'users';
      var body = (C.setTabs && C.setTabs[tab] ? C.setTabs[tab] : { users: users, pipelines: pipelines, fields: fields, sources: sources, hours: hours, templates: templates, audit: audit }[tab])();
      return page('Settings', 'How this workspace works · changes are logged in the audit log') +
        (canSet() ? '' : '<p class="scope-n">' + C.ic('lock', 12) + ' You’re viewing as ' + esc(C.me().name) + ' (' + C.ROLE_LABEL[C.me().role] + '). Settings are read-only for your role' + (tab === 'templates' && C.can('automation') ? ', except templates' : '') + '.</p>') +
        '<div class="set"><nav class="set-nav" aria-label="Settings sections">' + TABS.map(function (x) { return '<a href="#/settings/' + x[0] + '"' + (x[0] === tab ? ' aria-current="page"' : '') + '>' + C.ic(x[2], 15) + x[1] + '</a>'; }).join('') + '</nav><div class="set-b">' + body + '</div></div>';
    }
  };

  // ---- users and roles ------------------------------------------------------------------------------
  function users() {
    var me = C.me(), R = P().roles;
    var rows = P().users.map(function (u, i) {
      var owned = P().deals.filter(function (d) { return d.owner === u.name && C.dealOpen(d); }).length;
      return '<tr><td class="c-main"><div class="lc">' + C.avatar(u.name, 28) + '<div><b>' + esc(u.name) + (u.name === me.name ? ' <span class="tag">You</span>' : '') + '</b><div class="muted sm">' + esc(u.title) + ' · ' + esc(u.email) + '</div></div></div></td>' +
        '<td><label class="sr" for="ur-' + i + '">Role of ' + esc(u.name) + '</label><select id="ur-' + i + '" class="sel sm" data-ch="u-role" data-i="' + i + '"' + ro() + '>' + Object.keys(C.ROLE_LABEL).map(function (k) { return '<option value="' + k + '"' + (u.role === k ? ' selected' : '') + '>' + C.ROLE_LABEL[k] + '</option>'; }).join('') + '</select></td>' +
        '<td><label class="sr" for="ut-' + i + '">Team of ' + esc(u.name) + '</label><select id="ut-' + i + '" class="sel sm" data-ch="u-team" data-i="' + i + '"' + ro() + '>' + ['Residential', 'Commercial'].map(function (k) { return '<option' + (u.team === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select></td>' +
        '<td class="num">' + owned + '</td><td>' + (u.name === me.name ? '<span class="muted sm">Signed in</span>' : '<button type="button" class="btn sm" data-act="u-as" data-name="' + esc(u.name) + '">View as ' + esc(u.name.split(' ')[0]) + '</button>') + '</td></tr>';
    }).join('');
    var matrix = '<div class="tablewrap"><table class="tbl dense perm"><thead><tr><th scope="col">Permission</th>' + Object.keys(C.ROLE_LABEL).map(function (k) { return '<th scope="col" class="num">' + C.ROLE_LABEL[k] + '</th>'; }).join('') + '</tr></thead><tbody>' + C.PERMS.map(function (p) {
      return '<tr><th scope="row">' + esc(p[1]) + '</th>' + Object.keys(C.ROLE_LABEL).map(function (k) {
        var v = R[k][p[0]], lock = k === 'admin' || !canSet(), id = 'pm-' + k + '-' + p[0];
        if (p[2] === 'bool') return '<td class="num">' + sw('perm', 'data-role="' + k + '" data-p="' + p[0] + '"', v, C.ROLE_LABEL[k] + ': ' + p[1], lock) + '</td>';
        if (p[2] === 'num') return '<td class="num"><label class="sr" for="' + id + '">' + C.ROLE_LABEL[k] + ': ' + esc(p[1]) + '</label><input id="' + id + '" class="inp sm qty" type="number" min="0" max="100" value="' + v + '" data-ch="perm-v" data-role="' + k + '" data-p="' + p[0] + '"' + (lock ? ' disabled' : '') + '></td>';
        return '<td class="num"><label class="sr" for="' + id + '">' + C.ROLE_LABEL[k] + ': ' + esc(p[1]) + '</label><select id="' + id + '" class="sel sm" data-ch="perm-v" data-role="' + k + '" data-p="' + p[0] + '"' + (lock ? ' disabled' : '') + '>' + p[3].map(function (o) { return '<option value="' + o[0] + '"' + (v === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>';
    return '<section class="card flush"><div class="card-h pad"><div><h2>Users</h2><p class="sub">Four seats · use “View as” to see the app exactly as that person does</p></div></div><div class="tablewrap"><table class="tbl dense"><thead><tr><th scope="col">Person</th><th scope="col">Role</th><th scope="col">Team</th><th scope="col" class="num">Open deals</th><th scope="col"><span class="sr">Actions</span></th></tr></thead><tbody>' + rows + '</tbody></table></div></section>' +
      '<section class="card flush"><div class="card-h pad"><div><h2>What each role can do</h2><p class="sub">Enforced everywhere: lists, record pages, the board, bulk actions, import and export, quotes and settings. Admin is always full access.</p></div></div>' + matrix + '</section>';
  }
  C.chs['u-role'] = function (el) { if (!guard()) return; var u = P().users[+el.dataset.i], ov = u.role; if (u.name === C.me().name && el.value !== 'admin' && P().users.filter(function (x) { return x.role === 'admin'; }).length < 2) { C.toast('Keep at least one admin', { icon: 'x' }); el.value = ov; return; } u.role = el.value; saved('Role · ' + u.name, C.ROLE_LABEL[ov], C.ROLE_LABEL[u.role]); keep('#ur-' + el.dataset.i); C.toast(u.name + ' is now ' + C.ROLE_LABEL[u.role]); C.whoPaint(); };
  C.chs['u-team'] = function (el) { if (!guard()) return; var u = P().users[+el.dataset.i], ov = u.team; u.team = el.value; saved('Team · ' + u.name, ov, u.team); keep('#ut-' + el.dataset.i); };
  C.acts['u-as'] = function (el) { C.switchUser(el.dataset.name); };
  C.acts.perm = function (el) { if (!guard()) return; var r = P().roles[el.dataset.role], k = el.dataset.p, ov = r[k]; r[k] = !r[k]; saved('Permission · ' + C.ROLE_LABEL[el.dataset.role] + ' · ' + C.PERMS.filter(function (p) { return p[0] === k; })[0][1], ov ? 'on' : 'off', r[k] ? 'on' : 'off'); keep('[data-act="perm"][data-role="' + el.dataset.role + '"][data-p="' + k + '"]'); };
  C.chs['perm-v'] = function (el) { if (!guard()) return; var r = P().roles[el.dataset.role], k = el.dataset.p, ov = r[k]; r[k] = el.type === 'number' ? Math.max(0, Math.min(100, +el.value || 0)) : el.value; saved('Permission · ' + C.ROLE_LABEL[el.dataset.role] + ' · ' + k, ov, r[k]); keep('#' + el.id); };

  // ---- pipelines ------------------------------------------------------------------------------------------
  function pipelines() {
    var pk = C.ui.setPipe || 'sales', pipe = P().pipes[pk];
    var rows = pipe.stages.map(function (s, i) {
      var n = P().deals.filter(function (d) { return d.pipe === pk && d.stage === s.id; }).length, kind = s.won ? 'Won' : s.lost ? 'Lost' : 'Open', g = P().gates.filter(function (x) { return x.on && x.pipe === pk && x.stage === s.id; })[0];
      return '<tr><td><span class="kdot" style="background:' + s.color + '"></span></td><td><label class="sr" for="st-n' + i + '">Stage name</label><input id="st-n' + i + '" class="inp sm" value="' + esc(s.label) + '" data-ch="st-name" data-i="' + i + '"' + ro() + ' autocomplete="off"></td><td class="num"><label class="sr" for="st-p' + i + '">Probability for ' + esc(s.label) + '</label><input id="st-p' + i + '" class="inp sm qty" type="number" min="0" max="100" value="' + s.p + '" data-ch="st-prob" data-i="' + i + '"' + (s.won || s.lost ? ' disabled' : ro()) + '> %</td><td><span class="tag">' + kind + '</span>' + (g ? ' <span class="gate-f" title="' + esc(C.gateText(g)) + '">' + C.ic('lock', 11) + ' gate</span>' : '') + '</td><td class="num">' + n + '</td><td class="nw">' + (s.won || s.lost ? '' : '<button type="button" class="ibtn" data-act="st-mv" data-d="-1" data-i="' + i + '" aria-label="Move ' + esc(s.label) + ' earlier"' + (i && canSet() ? '' : ' disabled') + '>' + C.ic('arr-u', 14) + '</button><button type="button" class="ibtn" data-act="st-mv" data-d="1" data-i="' + i + '" aria-label="Move ' + esc(s.label) + ' later"' + (canSet() && pipe.stages[i + 1] && !pipe.stages[i + 1].won && !pipe.stages[i + 1].lost ? '' : ' disabled') + '>' + C.ic('arr-d', 14) + '</button><button type="button" class="ibtn" data-act="st-del" data-i="' + i + '" aria-label="Delete stage ' + esc(s.label) + '"' + (n || !canSet() ? ' disabled title="Move its deals first"' : '') + '>' + C.ic('trash', 14) + '</button>') + '</td></tr>';
    }).join('');
    return '<div class="seg" role="group" aria-label="Pipeline">' + Object.keys(P().pipes).map(function (k) { return '<button type="button" data-act="set-pipe" data-v="' + k + '" aria-pressed="' + (k === pk) + '">' + esc(P().pipes[k].label) + '</button>'; }).join('') + '</div>' +
      '<section class="card flush mt"><div class="card-h pad"><div><h2>' + esc(pipe.label) + ' stages</h2><p class="sub">Probability drives the weighted forecast. Stage gates are set in Workflows → Stage gates.</p></div><a class="btn sm" href="#/workflows">' + C.ic('lock', 13) + 'Stage gates</a></div><div class="tablewrap"><table class="tbl dense"><thead><tr><th scope="col"><span class="sr">Colour</span></th><th scope="col">Stage</th><th scope="col" class="num">Probability</th><th scope="col">Type</th><th scope="col" class="num">Deals</th><th scope="col"><span class="sr">Order</span></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (canSet() ? '<form class="gate-add" data-form="st-add"><b class="sm">Add a stage</b><label class="sr" for="st-new">Stage name</label><input id="st-new" name="n" class="inp sm grow" required placeholder="e.g. Contract review" autocomplete="off"><label class="sr" for="st-newp">Probability</label><input id="st-newp" name="p" class="inp sm qty" type="number" min="1" max="99" value="70"><button class="btn sm">Add before Won</button></form>' : '') + '</section>';
  }
  function pipe() { return P().pipes[C.ui.setPipe || 'sales']; }
  C.acts['set-pipe'] = function (el) { C.ui.setPipe = el.dataset.v; keep('[data-act="set-pipe"][data-v="' + el.dataset.v + '"]'); };
  C.chs['st-name'] = function (el) { if (!guard()) return; var s = pipe().stages[+el.dataset.i], ov = s.label, v = el.value.trim(); if (!v) { el.value = ov; return; } s.label = v; saved('Stage renamed (' + pipe().label + ')', ov, v); keep('#st-n' + el.dataset.i); };
  C.chs['st-prob'] = function (el) { if (!guard()) return; var s = pipe().stages[+el.dataset.i], ov = s.p; s.p = Math.max(0, Math.min(100, Math.round(+el.value || 0))); saved('Stage probability · ' + s.label, ov + '%', s.p + '%'); keep('#st-p' + el.dataset.i); };
  C.acts['st-mv'] = function (el) { if (!guard()) return; var st = pipe().stages, i = +el.dataset.i, j = i + +el.dataset.d; if (j < 0 || st[j].won || st[j].lost) return; var t = st[i]; st[i] = st[j]; st[j] = t; saved('Stage order (' + pipe().label + ')', '', t.label + ' moved'); keep('[data-act="st-mv"][data-i="' + j + '"][data-d="' + el.dataset.d + '"]'); };
  C.acts['st-del'] = function (el) { if (!guard()) return; var st = pipe().stages, i = +el.dataset.i, s = st[i]; st.splice(i, 1); saved('Stage deleted (' + pipe().label + ')', s.label, ''); C.rerender(); C.toast('Stage “' + s.label + '” deleted', { icon: 'trash', undo: function () { st.splice(i, 0, s); C.save(); C.rerender(); } }); };
  C.forms['st-add'] = function (f) {
    if (!guard()) return; var st = pipe().stages, n = f.elements.n.value.trim(); if (!n) return;
    var id = n.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20) + '-' + Date.now().toString(36).slice(-3), at = st.map(function (s) { return !!(s.won || s.lost); }).indexOf(true);
    st.splice(at < 0 ? st.length : at, 0, { id: id, label: n, p: Math.max(1, Math.min(99, +f.elements.p.value || 50)), color: '#5E6AD2' });
    saved('Stage added (' + pipe().label + ')', '', n); C.rerender(); C.toast('Stage “' + n + '” added — it’s on the board now');
  };

  // ---- custom fields ----------------------------------------------------------------------------------------
  function fields() {
    var obj = C.ui.setObj || 'contact', defs = C.fieldDefs(obj);
    var rows = defs.map(function (f, i) {
      var used = (obj === 'contact' ? P().contacts : obj === 'company' ? P().companies : P().deals).filter(function (r) { var v = C.getF(r, f); return v !== undefined && v !== '' && v !== null && !(Array.isArray(v) && !v.length); }).length;
      return '<tr><td><b>' + esc(f.label) + '</b><div class="muted sm mono">' + esc(f.key) + '</div></td><td>' + C.FTYPES[f.type] + '</td><td class="muted sm">' + (f.opts ? esc(f.opts.slice(0, 5).join(', ')) + (f.opts.length > 5 ? '…' : '') : '—') + '</td><td>' + (f.sys ? '<span class="tag">Built-in</span>' : '<span class="tag cus">Custom</span>') + '</td><td class="num">' + used + '</td><td class="nw">' + (f.sys || !canSet() ? '' : '<button type="button" class="btn sm ghost" data-act="cf-edit" data-i="' + i + '">Edit</button><button type="button" class="ibtn" data-act="cf-del" data-i="' + i + '" aria-label="Delete field ' + esc(f.label) + '">' + C.ic('trash', 14) + '</button>') + '</td></tr>';
    }).join('');
    return '<div class="seg" role="group" aria-label="Object">' + [['contact', 'Contacts'], ['company', 'Companies'], ['deal', 'Deals']].map(function (x) { return '<button type="button" data-act="set-obj" data-v="' + x[0] + '" aria-pressed="' + (x[0] === obj) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<section class="card flush mt"><div class="card-h pad"><div><h2>' + { contact: 'Contact', company: 'Company', deal: 'Deal' }[obj] + ' fields</h2><p class="sub">A new field appears at once on record pages (inline-editable), in list filters (dropdowns), in CSV import mapping and in exports.</p></div></div><div class="tablewrap"><table class="tbl dense"><thead><tr><th scope="col">Field</th><th scope="col">Type</th><th scope="col">Options</th><th scope="col">Kind</th><th scope="col" class="num">Records with a value</th><th scope="col"><span class="sr">Actions</span></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (canSet() ? '<form class="gate-add" data-form="cf-add"><b class="sm">Add a field</b><label class="sr" for="cf-l">Label</label><input id="cf-l" name="l" class="inp sm grow" required placeholder="e.g. Floor area (sq ft)" autocomplete="off"><label class="sr" for="cf-t">Type</label><select id="cf-t" name="t" class="sel sm">' + Object.keys(C.FTYPES).map(function (k) { return '<option value="' + k + '">' + C.FTYPES[k] + '</option>'; }).join('') + '</select><label class="sr" for="cf-o">Options</label><input id="cf-o" name="o" class="inp sm grow" placeholder="Options, comma-separated (dropdowns only)" autocomplete="off"><button class="btn sm">Add field</button></form>' : '') + '</section>';
  }
  C.acts['set-obj'] = function (el) { C.ui.setObj = el.dataset.v; keep('[data-act="set-obj"][data-v="' + el.dataset.v + '"]'); };
  C.forms['cf-add'] = function (f) {
    if (!guard()) return; var obj = C.ui.setObj || 'contact', l = f.elements.l.value.trim(), t = f.elements.t.value, o = f.elements.o.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    if (!l) return; if ((t === 'select' || t === 'multi') && o.length < 2) { C.toast('Give a dropdown at least two options', { icon: 'x' }); return; }
    var key = 'cf_' + l.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24); if (C.fieldDef(obj, key)) key += '_' + Date.now().toString(36).slice(-3);
    var def = { key: key, label: l, type: t }; if (o.length && (t === 'select' || t === 'multi')) def.opts = o;
    P().fields[obj].push(def); saved('Custom field added (' + obj + 's)', '', l + ' · ' + C.FTYPES[t]); C.rerender(); C.toast('Field “' + l + '” added to every ' + obj, { icon: 'check' });
  };
  C.acts['cf-del'] = function (el) {
    if (!guard()) return; var obj = C.ui.setObj || 'contact', L = P().fields[obj], i = +el.dataset.i, f = L[i];
    C.dialog('Delete field “' + esc(f.label) + '”?', '<p>The field disappears from records, filters and imports. Existing values are kept in the data, so you can undo.</p>', 'Delete field', function () { L.splice(i, 1); saved('Custom field deleted (' + obj + 's)', f.label, ''); setTimeout(C.rerender, 20); C.toast('Field deleted', { icon: 'trash', undo: function () { L.splice(i, 0, f); C.save(); C.rerender(); } }); });
  };
  C.acts['cf-edit'] = function (el) {
    var obj = C.ui.setObj || 'contact', f = P().fields[obj][+el.dataset.i];
    C.dialog('Edit field', '<div class="field"><label for="cfe-l">Label</label><input id="cfe-l" name="l" value="' + esc(f.label) + '" required autocomplete="off"></div>' + (f.opts ? '<div class="field"><label for="cfe-o">Options (comma-separated)</label><textarea id="cfe-o" name="o" rows="3">' + esc(f.opts.join(', ')) + '</textarea></div>' : '') + '<p class="hint">Type: ' + C.FTYPES[f.type] + ' · key <span class="mono">' + esc(f.key) + '</span> (stays the same so existing values keep working)</p>', 'Save field', function (fd) {
      var ol = f.label; f.label = (fd.get('l') || '').trim() || f.label; if (f.opts) f.opts = String(fd.get('o') || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      saved('Custom field edited (' + obj + 's)', ol, f.label + (f.opts ? ' · ' + f.opts.length + ' options' : '')); setTimeout(C.rerender, 20);
    });
  };

  // ---- lead sources --------------------------------------------------------------------------------------------
  function sources() {
    var L = C.S().leads;
    return '<section class="card flush"><div class="card-h pad"><div><h2>Lead sources</h2><p class="sub">Shown in the inbox filters, scoring rules, reports (source ROI) and new-lead forms. Turning one off hides it from forms; existing leads keep it.</p></div></div><div class="tablewrap"><table class="tbl dense"><thead><tr><th scope="col">On</th><th scope="col">Source</th><th scope="col">Key</th><th scope="col" class="num">Leads</th><th scope="col" class="num">Monthly spend (₹)</th></tr></thead><tbody>' + P().sources.map(function (s, i) {
      return '<tr><td>' + sw('src-on', 'data-i="' + i + '"', s.on, (s.on ? 'Turn off ' : 'Turn on ') + s.label, !canSet()) + '</td><td><span class="kdot" style="background:' + s.color + '"></span> <label class="sr" for="src-l' + i + '">Label</label><input id="src-l' + i + '" class="inp sm" value="' + esc(s.label) + '" data-ch="src-l" data-i="' + i + '"' + ro() + ' autocomplete="off"></td><td class="mono muted">' + s.key + '</td><td class="num">' + L.filter(function (l) { return l.source === s.key; }).length + '</td><td class="num"><label class="sr" for="src-s' + i + '">Spend for ' + esc(s.label) + '</label><input id="src-s' + i + '" class="inp sm" type="number" min="0" step="1000" style="width:110px" value="' + (P().spend[s.key] || 0) + '" data-ch="src-spend" data-k="' + s.key + '"' + ro() + '></td></tr>';
    }).join('') + '</tbody></table></div>' + (canSet() ? '<form class="gate-add" data-form="src-add"><b class="sm">Add a source</b><label class="sr" for="src-n">Name</label><input id="src-n" name="n" class="inp sm grow" required placeholder="e.g. Housing portal" autocomplete="off"><label class="sr" for="src-c">Colour</label><input id="src-c" name="c" type="color" value="#5E6AD2" class="inp sm"><button class="btn sm">Add source</button></form>' : '') + '</section>';
  }
  C.acts['src-on'] = function (el) { if (!guard()) return; var s = P().sources[+el.dataset.i]; s.on = !s.on; saved('Lead source ' + (s.on ? 'on' : 'off'), '', s.label); keep('[data-act="src-on"][data-i="' + el.dataset.i + '"]'); };
  C.chs['src-l'] = function (el) { if (!guard()) return; var s = P().sources[+el.dataset.i], ov = s.label; s.label = el.value.trim() || ov; C.applySources(P()); saved('Lead source renamed', ov, s.label); keep('#src-l' + el.dataset.i); };
  C.chs['src-spend'] = function (el) { if (!guard()) return; var k = el.dataset.k, ov = P().spend[k] || 0; P().spend[k] = Math.max(0, +el.value || 0); saved('Monthly spend · ' + C.SOURCES[k].label, C.inr(ov), C.inr(P().spend[k])); };
  C.forms['src-add'] = function (f) { if (!guard()) return; var n = f.elements.n.value.trim(); if (!n) return; var key = n.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 14) || 'src' + Date.now().toString(36); if (C.SOURCES[key]) key += Date.now().toString(36).slice(-2); P().sources.push({ key: key, label: n, color: f.elements.c.value, on: true, custom: true }); C.applySources(P()); saved('Lead source added', '', n); C.rerender(); C.toast('Source “' + n + '” added'); };

  // ---- business hours -----------------------------------------------------------------------------------------------
  function hm(m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
  function hours() {
    var H = P().hours, sla = P().route.sla, ex = new Date(); ex.setDate(ex.getDate() + ((5 - ex.getDay() + 7) % 7)); ex.setHours(21, 45, 0, 0);
    var due = (function () { var t = ex.getTime(); for (var i = 0; i < 60 * 24 * 4 && C.bizMin(ex.getTime(), t) < sla; i += 5) t += 5 * 6e4; return t; })();
    return '<section class="card"><div class="card-h"><div><h2>Business hours</h2><p class="sub">First-reply SLA timers only count time inside these hours, so a lead at 10 pm isn’t “breached” by morning. ' + esc(H.tz) + '.</p></div>' + sw('bh-on', '', H.on, H.on ? 'Turn off business hours' : 'Turn on business hours', !canSet()) + '</div>' +
      '<div class="bh"><div class="bh-days" role="group" aria-label="Working days">' + [1, 2, 3, 4, 5, 6, 0].map(function (d) { return '<button type="button" class="chip" data-act="bh-day" data-d="' + d + '" aria-pressed="' + (H.days.indexOf(d) > -1) + '"' + ro() + '>' + DAYS[d] + '</button>'; }).join('') + '</div>' +
      '<div class="row2"><div class="field"><label for="bh-s">Opens</label><input id="bh-s" type="time" value="' + hm(H.start) + '" data-ch="bh-t" data-k="start"' + ro() + '></div><div class="field"><label for="bh-e">Closes</label><input id="bh-e" type="time" value="' + hm(H.end) + '" data-ch="bh-t" data-k="end"' + ro() + '></div></div>' +
      '<div class="field"><label for="bh-sla">First-reply target</label><select id="bh-sla" data-ch="bh-sla"' + (C.can('automation') ? '' : ' disabled') + '>' + [5, 15, 30, 60].map(function (n) { return '<option value="' + n + '"' + (n === sla ? ' selected' : '') + '>' + n + ' business minutes</option>'; }).join('') + '</select></div>' +
      '<p class="bh-ex">' + C.ic('clock', 14) + ' Example: a WhatsApp lead at <b>9:45 pm on ' + ex.toLocaleDateString('en-GB', { weekday: 'long' }) + '</b> is due a first reply by <b>' + new Date(due).toLocaleString('en-GB', { weekday: 'long', hour: 'numeric', minute: '2-digit', hour12: true }) + '</b>.</p>' +
      '<p class="muted sm">Right now: ' + (C.inHours() ? '<span class="ok-t">inside business hours — timers are running</span>' : '<span class="late">outside business hours — timers are paused</span>') + '</p></div></section>';
  }
  C.acts['bh-on'] = function () { if (!guard()) return; var H = P().hours; H.on = !H.on; saved('Business hours', H.on ? 'off' : 'on', H.on ? 'on' : 'off'); keep('[data-act="bh-on"]'); };
  C.acts['bh-day'] = function (el) { if (!guard()) return; var H = P().hours, d = +el.dataset.d, i = H.days.indexOf(d); if (i > -1) H.days.splice(i, 1); else H.days.push(d); saved('Working days', '', H.days.slice().sort().map(function (x) { return DAYS[x]; }).join(' ')); keep('[data-act="bh-day"][data-d="' + d + '"]'); };
  C.chs['bh-t'] = function (el) { if (!guard()) return; var H = P().hours, p = el.value.split(':'), ov = H[el.dataset.k]; H[el.dataset.k] = (+p[0]) * 60 + (+p[1] || 0); if (H.end <= H.start) { H[el.dataset.k] = ov; C.toast('Closing time must be after opening time', { icon: 'x' }); } saved('Business hours ' + (el.dataset.k === 'start' ? 'open' : 'close'), hm(ov), hm(H[el.dataset.k])); keep('#' + el.id); };
  C.chs['bh-sla'] = function (el) { var ov = P().route.sla; P().route.sla = +el.value; saved('First-reply target', ov + ' min', el.value + ' min'); keep('#bh-sla'); };

  // ---- templates --------------------------------------------------------------------------------------------------------
  var MERGE = ['{{first_name}}', '{{owner}}', '{{service}}', '{{city}}'];
  function canTpl() { return C.can('automation') || C.can('settings'); }
  function templates() {
    var L = P().tpls, sel = C.ui.tplSel && C.tpl(C.ui.tplSel) ? C.tpl(C.ui.tplSel) : L[0], sample = P().contacts[3];
    var used = function (t) { var n = 0; P().seqs.forEach(function (s) { s.steps.forEach(function (x) { if (x.tpl === t.id) n++; }); }); P().wf.forEach(function (w) { w.acts.forEach(function (a) { if (a.type === 'template' && a.v === t.id) n++; }); }); return n; };
    var dis = canTpl() ? '' : ' disabled';
    return '<div class="tpl-g"><section class="card flush"><div class="card-h pad"><div><h2>Templates</h2><p class="sub">' + L.length + ' templates · used by record composers, sequences, workflows and Conversations</p></div>' + (canTpl() ? '<button type="button" class="btn sm" data-act="tpl-new">' + C.ic('plus', 13) + 'New</button>' : '') + '</div><ul class="tpl-l">' + L.map(function (t) { return '<li><button type="button" class="' + (t === sel ? 'on' : '') + '" data-act="tpl-sel" data-id="' + t.id + '" aria-pressed="' + (t === sel) + '"><span class="chb ' + t.ch + '">' + C.ic(t.ch === 'wa' ? 'wa' : 'mail', 12) + '</span><span class="grow"><b>' + esc(t.name) + '</b><small class="muted">' + (t.ch === 'wa' ? 'WhatsApp · ' + (t.id.length > 8 ? 'in review' : 'approved') : 'Email') + ' · used in ' + used(t) + ' place' + (used(t) === 1 ? '' : 's') + '</small></span></button></li>'; }).join('') + '</ul></section>' +
      (sel ? '<section class="card"><div class="card-h"><div><h2>Edit “' + esc(sel.name) + '”</h2><p class="sub">Changes apply everywhere it’s used. WhatsApp templates need Meta’s approval before first use.</p></div>' + (canTpl() ? '<button type="button" class="ibtn" data-act="tpl-del" data-id="' + sel.id + '" aria-label="Delete template">' + C.ic('trash', 15) + '</button>' : '') + '</div>' +
        '<div class="row2"><div class="field"><label for="tp-n">Name</label><input id="tp-n" value="' + esc(sel.name) + '" data-ch="tpl-f" data-k="name"' + dis + ' autocomplete="off"></div><div class="field"><label for="tp-c">Channel</label><select id="tp-c" data-ch="tpl-f" data-k="ch"' + dis + '><option value="wa"' + (sel.ch === 'wa' ? ' selected' : '') + '>WhatsApp</option><option value="email"' + (sel.ch === 'email' ? ' selected' : '') + '>Email</option></select></div></div>' +
        (sel.ch === 'email' ? '<div class="field"><label for="tp-s">Subject</label><input id="tp-s" value="' + esc(sel.subject || '') + '" data-ch="tpl-f" data-k="subject"' + dis + ' autocomplete="off"></div>' : '') +
        '<div class="field"><label for="tp-b">Message</label><textarea id="tp-b" rows="6" data-in="tpl-body"' + dis + '>' + esc(sel.body) + '</textarea></div>' +
        (canTpl() ? '<div class="tpls" role="group" aria-label="Insert merge field">' + MERGE.map(function (m) { return '<button type="button" class="chip mono" data-act="tpl-merge" data-v="' + m + '">' + m + '</button>'; }).join('') + '</div>' : '') +
        '<h3 class="h3">Preview for ' + esc(sample.name) + '</h3><div class="msg-prev ' + sel.ch + '" id="tp-prev">' + (sel.subject ? '<b>' + esc(C.fill(sel.subject, sample)) + '</b>' : '') + '<p>' + esc(C.fill(sel.body, { name: sample.name, owner: sample.owner, city: sample.city })).replace(/\n/g, '<br>') + '</p></div></section>' : '') + '</div>';
  }
  C.acts['tpl-sel'] = function (el) { C.ui.tplSel = el.dataset.id; keep('[data-act="tpl-sel"][data-id="' + el.dataset.id + '"]'); };
  C.chs['tpl-f'] = function (el) { if (!canTpl()) return C.deny('edit templates'); var t = C.tpl(C.ui.tplSel) || P().tpls[0], ov = t[el.dataset.k]; t[el.dataset.k] = el.value; saved('Template · ' + t.name + ' · ' + el.dataset.k, ov, el.value); keep('#' + el.id); };
  C.ins['tpl-body'] = function (el) { var t = C.tpl(C.ui.tplSel) || P().tpls[0], s = P().contacts[3]; t.body = el.value; clearTimeout(C._tpT); C._tpT = setTimeout(function () { saved('Template · ' + t.name, '', 'message edited'); }, 800); var pv = $('#tp-prev p'); if (pv) pv.innerHTML = esc(C.fill(t.body, { name: s.name, owner: s.owner, city: s.city })).replace(/\n/g, '<br>'); };
  C.acts['tpl-merge'] = function (el) { var x = $('#tp-b'), a = x.selectionStart, b = x.selectionEnd; x.value = x.value.slice(0, a) + el.dataset.v + x.value.slice(b); x.focus(); x.setSelectionRange(a + el.dataset.v.length, a + el.dataset.v.length); C.ins['tpl-body'](x); };
  C.acts['tpl-new'] = function () { var t = { id: 'tp' + Date.now().toString(36), ch: 'wa', name: 'New template', body: 'Hi {{first_name}}, ' }; P().tpls.push(t); C.ui.tplSel = t.id; saved('Template created', '', t.name); keep('#tp-n'); };
  C.acts['tpl-del'] = function (el) {
    var L = P().tpls, i = L.map(function (t) { return t.id; }).indexOf(el.dataset.id), t = L[i], inUse = P().seqs.some(function (s) { return s.steps.some(function (x) { return x.tpl === t.id; }); }) || P().wf.some(function (w) { return w.acts.some(function (a) { return a.type === 'template' && a.v === t.id; }); });
    if (inUse) { C.toast('“' + t.name + '” is used by a sequence or workflow — change those first', { icon: 'x' }); return; }
    L.splice(i, 1); C.ui.tplSel = null; saved('Template deleted', t.name, ''); C.rerender(); C.toast('Template deleted', { icon: 'trash', undo: function () { L.splice(i, 0, t); C.save(); C.rerender(); } });
  };

  // ---- audit log ------------------------------------------------------------------------------------------------------------
  function AU() { return C.ui.aud || (C.ui.aud = { who: 'all', act: 'all', obj: 'all', q: '', n: 60 }); }
  function auditRows() {
    var u = AU(), q = u.q.toLowerCase();
    return (P().audit || []).filter(function (a) { return (u.who === 'all' || a.who === u.who) && (u.act === 'all' || a.act === u.act) && (u.obj === 'all' || (a.ref ? a.ref.t : 'settings') === u.obj) && (!q || ((a.ref ? a.ref.name : '') + ' ' + a.field + ' ' + a.from + ' ' + a.to).toLowerCase().indexOf(q) > -1); });
  }
  function audit() {
    var u = AU(), R = auditRows(), acts = {}, objs = {}; (P().audit || []).forEach(function (a) { acts[a.act] = 1; objs[a.ref ? a.ref.t : 'settings'] = 1; });
    var opt = function (v, t, c) { return '<option value="' + esc(v) + '"' + (v === c ? ' selected' : '') + '>' + esc(t) + '</option>'; };
    return '<section class="card flush"><div class="card-h pad"><div><h2>Audit log</h2><p class="sub">' + (P().audit || []).length + ' entries · who changed what, and when, across every record and setting</p></div>' + (C.can('export') ? '<button type="button" class="btn sm" data-act="aud-export">' + C.ic('down', 13) + 'Export</button>' : '') + '</div>' +
      '<div class="toolbar"><div class="sfield">' + C.ic('search', 15) + '<label class="sr" for="au-q">Search the audit log</label><input id="au-q" type="search" data-in="aud-q" value="' + esc(u.q) + '" placeholder="Search record, field or value…" autocomplete="off"></div><label class="sr" for="au-w">User</label><select id="au-w" class="sel" data-ch="aud-f" data-f="who">' + opt('all', 'Anyone', u.who) + P().users.map(function (x) { return opt(x.name, x.name, u.who); }).join('') + '</select><label class="sr" for="au-a">Action</label><select id="au-a" class="sel" data-ch="aud-f" data-f="act">' + opt('all', 'Any action', u.act) + Object.keys(acts).sort().map(function (k) { return opt(k, (C.ACT_LABEL[k] || k).replace(/^./, function (c) { return c.toUpperCase(); }), u.act); }).join('') + '</select><label class="sr" for="au-o">Object</label><select id="au-o" class="sel" data-ch="aud-f" data-f="obj">' + opt('all', 'Any object', u.obj) + Object.keys(objs).sort().map(function (k) { return opt(k, k.replace(/^./, function (c) { return c.toUpperCase(); }), u.obj); }).join('') + '</select><span class="count" id="au-n">' + R.length + ' entries</span></div>' +
      '<div id="au-res">' + auditList(R) + '</div></section>';
  }
  function auditList(R) {
    var u = AU();
    if (!R.length) return '<div class="empty-st">' + C.ic('eye', 22) + '<b>No entries match</b><span>Try another user or action. Every change you make shows up here instantly.</span></div>';
    var days = {}, h = ''; R.slice(0, u.n).forEach(function (a) { var k = C.dayStart(a.t); (days[k] = days[k] || []).push(a); });
    Object.keys(days).sort(function (a, b) { return b - a; }).forEach(function (k) { h += '<li class="aud-day">' + (+k === C.dayStart() ? 'Today' : C.dfull(+k)) + '</li>' + days[k].map(function (a) { return '<li class="aud-r">' + C.avatar(a.who, 22) + '<p>' + C.auditLine(a) + '</p><time class="muted sm nw">' + C.tm(a.t) + '</time></li>'; }).join(''); });
    return '<ol class="aud">' + h + '</ol>' + (R.length > u.n ? '<div class="pad"><button type="button" class="btn sm" data-act="aud-more">Show ' + Math.min(60, R.length - u.n) + ' more</button></div>' : '');
  }
  function audSync() { var R = auditRows(); $('#au-res').innerHTML = auditList(R); $('#au-n').textContent = R.length + ' entries'; }
  C.ins['aud-q'] = function (el) { AU().q = el.value; AU().n = 60; clearTimeout(C._auT); C._auT = setTimeout(audSync, 150); };
  C.chs['aud-f'] = function (el) { AU()[el.dataset.f] = el.value; AU().n = 60; audSync(); };
  C.acts['aud-more'] = function () { AU().n += 60; audSync(); };
  C.acts['aud-export'] = function () { C.exportCSV('audit-log', [['Time', function (a) { return new Date(a.t).toISOString(); }], ['User', function (a) { return a.who; }], ['Action', function (a) { return a.act; }], ['Object', function (a) { return a.ref ? a.ref.t : 'settings'; }], ['Record', function (a) { return a.ref ? a.ref.name : ''; }], ['Field', function (a) { return a.field; }], ['From', function (a) { return a.from; }], ['To', function (a) { return a.to; }]], auditRows()); };
})();
