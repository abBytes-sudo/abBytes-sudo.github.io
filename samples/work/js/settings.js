/* Ordwell — Settings (white-label branding with live preview, custom domain, members/roles/guests, workspace,
   notifications, shortcuts, data) and the in-app Templates gallery with "Use template". */
(function () {
  'use strict';
  var OW = window.OW, UI = OW.UI, Q = OW.Q, D = OW.D, I = UI.I, esc = UI.esc, store = OW.store, app = OW.app;
  var SW = ['#111317', '#C2461C', '#2B59C3', '#0F7B6C', '#7A3FC4', '#B4235A', '#B7791F', '#2F7D32'];
  var TABS = [['Workspace', [['brand', 'Branding', 'brush'], ['domain', 'Domain and login', 'globe'], ['members', 'Members and guests', 'users'], ['roles', 'Roles and permissions', 'shield'], ['workspace', 'General', 'settings']]], ['You', [['notifications', 'Notifications', 'bell'], ['shortcuts', 'Shortcuts', 'keyb'], ['data', 'Data', 'db']]]];

  OW.routes.settings = function (main, args) {
    var tab = args[0] || 'brand', S = store.S;
    var h = '<div class="set"><nav class="set-nav" aria-label="Settings">' + TABS.map(function (g) { return '<h2>' + g[0] + '</h2>' + g[1].map(function (t) { return '<a href="#/settings/' + t[0] + '"' + (t[0] === tab ? ' aria-current="page"' : '') + '>' + I(t[2]) + t[1] + '</a>'; }).join(''); }).join('') + '</nav><div class="set-body" data-keep="set">';
    h += (P[tab] || P.brand)(S);
    main.innerHTML = h + '</div></div>';
    if (W[tab]) W[tab](main, S);
  };
  function sec(title, desc, body) { return '<section class="set-sec"><div class="sl"><h3>' + title + '</h3>' + (desc ? '<p>' + desc + '</p>' : '') + '</div><div>' + body + '</div></section>'; }
  function head(t, d) { return '<div class="page-h" style="margin-bottom:6px"><div><h1>' + t + '</h1><p>' + d + '</p></div></div>'; }
  var P = {}, W = {};

  /* ---------- branding ---------- */
  P.brand = function (S) {
    var b = S.brand, ratio = contrast(b.accent, UI.contrastOn(b.accent));
    return head('Branding', 'Make the whole workspace look like your product. Changes apply live — to the sidebar, emails, forms, the client login and the browser tab.') +
      sec('Product name', 'Shown in the sidebar, the browser tab, emails and the client portal.', '<label class="sr" for="br-n">Product name</label><input id="br-n" class="inp" value="' + esc(b.name) + '" maxlength="32" style="max-width:340px"><div class="err" id="br-ne" hidden></div><p class="hint">Try your agency’s name, like “Fernhill Workroom”.</p>') +
      sec('Logo', 'Square works best. PNG, SVG or JPG under 300 KB; we resize it to 128 px.', '<div class="logo-up"><span class="logo" data-brand-logo>' + (b.logo ? '<img src="' + esc(b.logo) + '" alt="">' : esc(b.name.charAt(0))) + '</span><div style="display:flex;gap:8px;flex-wrap:wrap"><label class="btn">' + I('upload') + 'Upload logo<input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" class="sr" id="br-logo"></label>' + (b.logo ? '<button type="button" class="btn ghost" data-act="br-logo-rm">Use a monogram instead</button>' : '') + '</div></div><div class="err" id="br-le" hidden></div>') +
      sec('Accent colour', 'One colour for buttons, highlights and the active state. We pick white or dark text automatically for contrast.', '<div class="swatches" role="group" aria-label="Preset accents">' + SW.map(function (c) { return '<button type="button" class="swatch" style="--sw:' + c + '" data-act="br-acc" data-c="' + c + '" aria-pressed="' + (c.toLowerCase() === b.accent.toLowerCase()) + '" aria-label="Accent ' + c + '"></button>'; }).join('') + '<span class="color-in"><input type="color" id="br-cp" value="' + esc(b.accent) + '" aria-label="Custom accent colour"><input type="text" id="br-hex" value="' + esc(b.accent) + '" aria-label="Accent hex value" maxlength="7"></span></div>' +
        '<p class="hint" id="br-ratio">' + (UI.contrastOn(b.accent) === '#FFFFFF' ? 'White' : 'Dark') + ' text on this accent: <b>' + ratio.toFixed(1) + ':1</b> ' + (ratio >= 4.5 ? '✓ passes WCAG AA' : '— below AA, consider a deeper shade') + '</p>') +
      sec('Preview', 'What your team and clients see.', '<div class="brand-prev" aria-hidden="true"><div class="bp-side"><div class="r"><span class="logo" data-brand-logo>' + (b.logo ? '<img src="' + esc(b.logo) + '" alt="">' : esc(b.name.charAt(0))) + '</span><span data-brand-name>' + esc(b.name) + '</span></div><i class="on"></i><i></i><i style="width:60%"></i><i style="width:70%"></i></div><div class="bp-main"><div style="font-weight:600;font-size:14px;margin-bottom:8px">Coorg Ember — website relaunch</div><div style="display:flex;gap:6px;margin-bottom:12px"><span class="pill" style="--c:var(--c-active)"><span class="sdot" data-cat="active" style="--c:var(--c-active)"></span>In progress</span><span class="tag cv">client-visible</span></div><span class="bpb">New task</span></div></div>') +
      sec('Reset', '', '<button type="button" class="btn ghost" data-act="br-reset">' + I('refresh') + 'Back to Ordwell defaults</button>');
  };
  W.brand = function (main, S) {
    var n = main.querySelector('#br-n'), snap = null;
    n.addEventListener('focus', function () { snap = store.snap(); });
    n.addEventListener('input', function () { var v = n.value.trim(); var e = main.querySelector('#br-ne'); e.hidden = !!v; e.textContent = v ? '' : 'Your product needs a name.'; if (!v) return; S.brand.name = v; store.save(); app.applyBrand(); document.title = v + ' — the white-label work OS'; });
    n.addEventListener('change', function () { if (n.value.trim() && snap) { store.markUndo(snap, 'Renamed product to ' + n.value.trim()); UI.toast('Product renamed to <b>' + esc(n.value.trim()) + '</b>', { undo: true, icon: 'brush' }); } });
    var cp = main.querySelector('#br-cp'), hx = main.querySelector('#br-hex');
    function live(c) { S.brand.accent = c; store.save(); app.applyBrand(); var r = contrast(c, UI.contrastOn(c)), p = main.querySelector('#br-ratio'); if (p) p.innerHTML = (UI.contrastOn(c) === '#FFFFFF' ? 'White' : 'Dark') + ' text on this accent: <b>' + r.toFixed(1) + ':1</b> ' + (r >= 4.5 ? '✓ passes WCAG AA' : '— below AA, consider a deeper shade'); main.querySelectorAll('.swatch').forEach(function (s) { s.setAttribute('aria-pressed', s.getAttribute('data-c').toLowerCase() === c.toLowerCase()); }); }
    cp.addEventListener('focus', function () { snap = store.snap(); });
    cp.addEventListener('input', function () { hx.value = cp.value.toUpperCase(); live(cp.value.toUpperCase()); });
    cp.addEventListener('change', function () { if (snap) store.markUndo(snap, 'Accent colour'); });
    hx.addEventListener('focus', function () { snap = store.snap(); });
    hx.addEventListener('input', function () { var v = hx.value.trim(); if (v.charAt(0) !== '#') v = '#' + v; if (/^#[0-9a-f]{6}$/i.test(v)) { cp.value = v; live(v.toUpperCase()); } });
    hx.addEventListener('change', function () { if (snap) store.markUndo(snap, 'Accent colour'); });
    var lf = main.querySelector('#br-logo');
    lf.addEventListener('change', function () {
      var f = lf.files[0], e = main.querySelector('#br-le'); if (!f) return;
      if (f.size > 300 * 1024) { e.hidden = false; e.textContent = 'That file is ' + Math.round(f.size / 1024) + ' KB — please use one under 300 KB.'; return; }
      var rd = new FileReader();
      rd.onload = function () {
        var img = new Image();
        img.onload = function () {
          var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d'), s = Math.min(img.width, img.height) || 128;
          x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 128, 128);
          var url; try { url = c.toDataURL('image/png'); } catch (err) { url = rd.result; }
          store.commit('Uploaded a logo', function (S) { S.brand.logo = url; });
        };
        img.onerror = function () { e.hidden = false; e.textContent = 'We couldn’t read that image. Try a PNG or JPG.'; };
        img.src = rd.result;
      };
      rd.readAsDataURL(f);
    });
  };
  function contrast(a, b) {
    function L(hex) { var c = hex.replace('#', ''), r = [0, 2, 4].map(function (i) { var v = parseInt(c.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r[0] + 0.7152 * r[1] + 0.0722 * r[2]; }
    var x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  UI.act('br-acc', function (el) { var c = el.getAttribute('data-c'); store.commit('Accent ' + c, function (S) { S.brand.accent = c; }); });
  UI.act('br-logo-rm', function () { store.commit('Removed logo', function (S) { S.brand.logo = null; }); });
  UI.act('br-reset', function () { store.commit('Branding reset', function (S) { S.brand.name = 'Ordwell'; S.brand.accent = '#111317'; S.brand.logo = null; }); });

  /* ---------- domain & login ---------- */
  P.domain = function (S) {
    var b = S.brand;
    return head('Domain and login', 'Clients sign in on your domain, see your logo and get emails from your name. Nothing says Ordwell unless you want it to.') +
      sec('Custom domain', 'Point a subdomain you own at your workspace. HTTPS is issued automatically.', '<div style="display:flex;gap:8px;flex-wrap:wrap"><label class="sr" for="dm">Custom domain</label><input id="dm" class="inp" style="max-width:300px" value="' + esc(b.domain || '') + '" placeholder="work.youragency.com"><button type="button" class="btn" data-act="dm-verify">' + I('refresh') + 'Verify DNS</button></div><div class="err" id="dm-e" hidden></div>' +
        '<p style="margin-top:10px"><span class="dstate ' + (b.domainState || '') + '"><i></i>' + ({ verified: 'Verified · HTTPS active', pending: 'Checking DNS…', none: 'Not connected' }[b.domainState || 'none']) + '</span></p>' +
        '<div class="dns" aria-label="DNS records to add"><div><span>Type</span><span>Name</span><span>Value</span></div><div><span>CNAME</span><span>' + esc((b.domain || 'work').split('.')[0]) + '</span><span>tenants.ordwell.app</span></div><div><span>TXT</span><span>_ordwell</span><span>verify=fernhill-7c21</span></div></div><p class="hint">DNS changes usually take a few minutes; we check every 60 seconds.</p>') +
      sec('Email sender name', 'Notifications and form receipts come from this name.', '<label class="sr" for="snd">Sender name</label><input id="snd" class="inp" style="max-width:300px" data-change="br-set" data-k="sender" value="' + esc(b.sender || '') + '"><p class="hint">e.g. “Fernhill Digital &lt;notify@' + esc(b.domain || 'your domain') + '&gt;”</p>') +
      sec('Client login page', 'The note under the sign-in form.', '<label class="sr" for="ln">Login note</label><input id="ln" class="inp" data-change="br-set" data-k="loginNote" value="' + esc(b.loginNote || '') + '" style="margin-bottom:12px"><div class="login-prev" aria-label="Login page preview"><div class="lp"><span class="logo" data-brand-logo>' + (b.logo ? '<img src="' + esc(b.logo) + '" alt="">' : esc(b.name.charAt(0))) + '</span><b data-brand-name>' + esc(b.name) + '</b><p>' + esc(b.loginNote || '') + '</p><i></i><i></i><div class="bpb">Sign in</div><small>' + esc(b.domain || '') + (b.poweredBy ? ' · Powered by Ordwell' : '') + '</small></div></div>') +
      sec('“Powered by Ordwell”', 'Show a small credit in the sidebar and on forms.', '<label class="switch"><input type="checkbox" data-change="br-pow"' + (b.poweredBy ? ' checked' : '') + '><i></i>Show the credit</label><p class="hint">Agency plans can hide it completely.</p>');
  };
  UI.act('br-set', function (el) { var k = el.getAttribute('data-k'); store.commit('Updated ' + (k === 'sender' ? 'sender name' : 'login note'), function (S) { S.brand[k] = el.value.trim(); }); });
  UI.act('br-pow', function (el) { store.commit(el.checked ? 'Showing “Powered by”' : 'Hid “Powered by”', function (S) { S.brand.poweredBy = el.checked; }); });
  UI.act('dm-verify', function () {
    var v = document.getElementById('dm').value.trim().toLowerCase(), e = document.getElementById('dm-e');
    if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(v)) { e.hidden = false; e.textContent = v ? 'Use a full hostname like work.youragency.com — no https:// or slashes.' : 'Add the domain you want to use.'; return; }
    store.commit('Checking ' + v, function (S) { S.brand.domain = v; S.brand.domainState = 'pending'; }, { quiet: true });
    setTimeout(function () { store.commit('Domain verified', function (S) { S.brand.domainState = 'verified'; }, { quiet: true, noUndo: true }); UI.toast('<b>' + esc(v) + '</b> is connected · HTTPS issued', { icon: 'globe' }); }, 2200);
  });

  /* ---------- members ---------- */
  var ROLE = { owner: 'Owner', admin: 'Admin', member: 'Member', guest: 'Guest' };
  P.members = function (S) {
    var team = S.users.filter(function (u) { return u.role !== 'guest'; }), guests = S.users.filter(function (u) { return u.role === 'guest'; });
    var h = head('Members and guests', team.length + ' members · ' + guests.length + ' client guests · ' + S.invites.length + ' pending invite' + (S.invites.length === 1 ? '' : 's') + '.');
    h += sec('Invite people', 'Members see every project in the workspace. Guests see only what you share with them.', '<div style="display:flex;gap:8px;flex-wrap:wrap"><label class="sr" for="inv-e">Email</label><input id="inv-e" class="inp" type="email" placeholder="name@company.com" style="flex:1;min-width:200px"><label class="sr" for="inv-r">Role</label><select id="inv-r" class="inp" style="width:auto"><option value="member">Member</option><option value="admin">Admin</option><option value="guest">Guest (client)</option></select><button type="button" class="btn pri" data-act="inv-send">Send invite</button></div><div class="err" id="inv-err" hidden></div>' +
      (S.invites.length ? '<div style="margin-top:12px">' + S.invites.map(function (i) { return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line-2);font-size:13px">' + I('mail') + '<span style="flex:1">' + esc(i.email) + ' <span class="faint">· ' + ROLE[i.role] + ' · invited ' + D.ago(i.at) + '</span></span><button type="button" class="btn sm ghost" data-act="inv-resend" data-id="' + i.id + '">Resend</button><button type="button" class="btn sm ghost danger" data-act="inv-revoke" data-id="' + i.id + '">Revoke</button></div>'; }).join('') + '</div>' : ''));
    h += '<section class="set-sec" style="display:block"><h3 style="font-size:13.5px;margin-bottom:10px">Team</h3><div style="overflow-x:auto"><table class="mtable"><thead><tr><th>Person</th><th>Role</th><th>Capacity</th><th>Open tasks</th><th></th></tr></thead><tbody>' + team.map(function (u) {
      var open = Q.tasks('*', true).filter(function (t) { return t.assignees.indexOf(u.id) > -1 && !Q.isDone(t); }).length;
      return '<tr><td><span class="who">' + UI.av(u.id, 'l') + '<span><b style="font-weight:500">' + esc(u.name) + (u.id === S.me ? ' <span class="faint">(you)</span>' : '') + '</b><small>' + esc(u.title) + ' · ' + esc(u.email) + '</small></span></span></td><td>' + (u.role === 'owner' ? '<span class="tag">Owner</span>' : '<select class="inp" data-change="mem-role" data-id="' + u.id + '" aria-label="Role for ' + esc(u.name) + '">' + ['admin', 'member', 'guest'].map(function (r) { return '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' + ROLE[r] + '</option>'; }).join('') + '</select>') + '</td><td>' + u.cap + 'h / week</td><td>' + open + '</td><td><button type="button" class="btn sm ghost" data-act="mem-view" data-id="' + u.id + '">' + I('eye', 's') + 'View as</button></td></tr>';
    }).join('') + '</tbody></table></div></section>';
    h += '<section class="set-sec" style="display:block"><h3 style="font-size:13.5px;margin-bottom:4px">Client guests</h3><p class="muted" style="font-size:12.5px;margin-bottom:10px">Guests see tasks tagged <span class="tag cv">' + I('eye', 's') + 'client-visible</span> in the projects below, never internal comments or money fields.</p><div style="overflow-x:auto"><table class="mtable"><thead><tr><th>Guest</th><th>Projects</th><th></th></tr></thead><tbody>' + guests.map(function (u) {
      return '<tr><td><span class="who">' + UI.av(u.id, 'l') + '<span><b style="font-weight:500">' + esc(u.name) + '</b><small>' + esc(u.title) + '</small></span></span></td><td>' + (u.guestOf || []).map(function (p) { var pr = Q.project(p); return '<span class="chip" style="margin:2px">' + UI.pdot(pr) + esc(pr.name) + '</span>'; }).join('') + ' <button type="button" class="chip dash" data-act="guest-proj" data-id="' + u.id + '">' + I('plus', 's') + 'Access</button></td><td><button type="button" class="btn sm" data-act="mem-view" data-id="' + u.id + '">' + I('eye', 's') + 'Preview their view</button></td></tr>';
    }).join('') + '</tbody></table></div></section>';
    return h;
  };
  UI.act('inv-send', function () {
    var e = document.getElementById('inv-e').value.trim(), r = document.getElementById('inv-r').value, err = document.getElementById('inv-err');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { err.hidden = false; err.textContent = e ? 'That email looks incomplete — check the part after @.' : 'Add an email address first.'; return; }
    if (store.S.invites.some(function (i) { return i.email === e; }) || store.S.users.some(function (u) { return u.email === e; })) { err.hidden = false; err.textContent = 'That person is already invited or in the workspace.'; return; }
    store.commit('Invited ' + e, function (S) { S.invites.push({ id: store.uid('i'), email: e, role: r, at: Date.now(), by: Q.me() }); });
  });
  UI.act('inv-resend', function () { UI.toast('Invite sent again', { icon: 'mail' }); });
  UI.act('inv-revoke', function (el) { var id = el.getAttribute('data-id'); store.commit('Revoked invite', function (S) { S.invites = S.invites.filter(function (i) { return i.id !== id; }); }); });
  UI.act('mem-role', function (el) {
    var u = Q.user(el.getAttribute('data-id')), r = el.value;
    if (r === 'guest') { UI.confirm('Make ' + u.name + ' a guest?', 'They’ll lose access to every project except the ones you share, and can no longer see internal comments.', 'Change role', function () { store.commit(u.name + ' is now a guest', function () { u.role = 'guest'; u.guestOf = u.guestOf || []; }); }, true); app.render(); return; }
    store.commit(u.name + ' is now ' + ROLE[r], function () { u.role = r; });
  });
  UI.act('mem-view', function (el) { app.viewAs(el.getAttribute('data-id') === store.S.me ? null : el.getAttribute('data-id')); });
  UI.act('guest-proj', function (el) {
    var u = Q.user(el.getAttribute('data-id')), sel = (u.guestOf || []).slice();
    UI.menu(el, Q.projectsVisible().map(function (p) { return { label: p.name, html: UI.pdot(p), checked: sel.indexOf(p.id) > -1, fn: function () { var i = sel.indexOf(p.id); if (i > -1) sel.splice(i, 1); else sel.push(p.id); } }; }), { keepOpen: true, onClose: function () {
      if (sel.join() === (u.guestOf || []).join()) return;
      store.commit('Updated ' + u.name + '’s access', function (S) { u.guestOf = sel; S.projects.forEach(function (p) { var i = p.members.indexOf(u.id), on = sel.indexOf(p.id) > -1; if (on && i < 0) p.members.push(u.id); if (!on && i > -1) p.members.splice(i, 1); }); });
    } });
  });

  /* ---------- roles ---------- */
  P.roles = function () {
    var rows = [['See every project in the workspace', 1, 1, 1, 0], ['See client-visible tasks they’re invited to', 1, 1, 1, 1], ['Comment and react', 1, 1, 1, 1], ['See internal comments', 1, 1, 1, 0], ['See money fields (budget, spent)', 1, 1, 1, 0], ['Create and edit tasks', 1, 1, 1, 0], ['Approve work (move to Approved)', 1, 1, 1, 1], ['Create automations and forms', 1, 1, 0, 0], ['Invite members and guests', 1, 1, 0, 0], ['Change branding and domain', 1, 1, 0, 0], ['Billing and delete workspace', 1, 0, 0, 0]];
    return head('Roles and permissions', 'Four roles cover most agencies. Guests are free and unlimited on every plan.') +
      '<div class="card" style="overflow-x:auto;max-width:820px"><table class="perm"><thead><tr><th>Permission</th><th>Owner</th><th>Admin</th><th>Member</th><th>Guest</th></tr></thead><tbody>' + rows.map(function (r) { return '<tr><td>' + r[0] + '</td>' + r.slice(1).map(function (v) { return '<td class="' + (v ? 'y' : 'n') + '">' + (v ? '✓' : '—') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
      '<div class="callout acc" style="max-width:820px;margin-top:16px">' + I('eye') + '<span>Not sure what a guest sees? Use <b>View as</b> from the account menu or the Members page to preview it exactly.</span></div>';
  };

  /* ---------- workspace ---------- */
  P.workspace = function (S) {
    var ws = OW.byId(S.workspaces, S.ws);
    return head('General', 'Workspace name, working week and spaces.') +
      sec('Workspace name', '', '<label class="sr" for="wsn">Workspace name</label><input id="wsn" class="inp" style="max-width:320px" data-change="ws-name" value="' + esc(ws.name) + '">') +
      sec('Working week', 'Used by the timeline, workload and due-date reminders.', '<div style="display:flex;gap:6px;flex-wrap:wrap">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (d, i) { return '<span class="chip' + (i < 5 ? ' on' : '') + '">' + d + '</span>'; }).join('') + '</div><p class="hint">Time zone: India Standard Time (UTC+5:30) · Currency: ₹ INR · Dates: 24 Nov 2026</p>') +
      sec('Spaces', 'Spaces group projects by team or client type.', S.spaces.filter(function (s) { return s.ws === S.ws; }).map(function (s) { return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line-2)"><span class="sp-dot" style="--h:' + s.hue + '"></span><span style="flex:1">' + esc(s.name) + '</span><span class="faint" style="font-size:12px">' + S.projects.filter(function (p) { return p.space === s.id; }).length + ' projects</span><button type="button" class="btn sm ghost" data-act="sp-rename" data-id="' + s.id + '">Rename</button></div>'; }).join('') + '<button type="button" class="btn sm" style="margin-top:10px" data-act="sp-add">' + I('plus', 's') + 'Add space</button>');
  };
  UI.act('ws-name', function (el) { var v = el.value.trim(); if (!v) return; store.commit('Workspace renamed', function (S) { OW.byId(S.workspaces, S.ws).name = v; }); });
  UI.act('sp-rename', function (el) { var s = Q.space(el.getAttribute('data-id')); UI.dialog({ title: 'Rename space', ok: 'Save', body: '<label class="lbl-t" for="spn">Name</label><input id="spn" class="inp" autofocus value="' + esc(s.name) + '">', onOk: function (d) { var v = d.querySelector('#spn').value.trim(); if (!v) return false; store.commit('Renamed space', function () { s.name = v; }); } }); });
  UI.act('sp-add', function () { UI.dialog({ title: 'Add a space', ok: 'Add space', body: '<label class="lbl-t" for="spa">Name</label><input id="spa" class="inp" autofocus placeholder="e.g. Retainers">', onOk: function (d) { var v = d.querySelector('#spa').value.trim(); if (!v) return false; store.commit('Added space ' + v, function (S) { S.spaces.push({ id: store.uid('s'), ws: S.ws, name: v, hue: Math.round(Math.random() * 360) }); }); } }); });

  /* ---------- notifications / shortcuts / data ---------- */
  P.notifications = function (S) {
    var n = S.prefs.notif || (S.prefs.notif = { mention: true, assign: true, status: true, auto: true, form: true, digest: true });
    var rows = [['mention', '@mentions and replies', 'Always on mobile and email'], ['assign', 'Assigned to me', ''], ['status', 'Status changes on my tasks', ''], ['auto', 'Automation results', 'When a rule notifies you'], ['form', 'Form submissions', 'For projects you own'], ['digest', 'Daily digest at 9:00', 'Overdue and due-today, one email']];
    return head('Notifications', 'What lands in your inbox. Muted items still show in the task’s activity.') + '<div class="card" style="padding:4px 18px;max-width:720px">' + rows.map(function (r) { return '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line-2)"><span style="flex:1"><b style="font-weight:500;font-size:13.5px">' + r[1] + '</b>' + (r[2] ? '<br><small class="muted">' + r[2] + '</small>' : '') + '</span><label class="switch"><input type="checkbox" data-change="nt-pref" data-k="' + r[0] + '"' + (n[r[0]] ? ' checked' : '') + ' aria-label="' + r[1] + '"><i></i></label></div>'; }).join('') + '</div>';
  };
  UI.act('nt-pref', function (el) { store.commit('Notification setting saved', function (S) { S.prefs.notif[el.getAttribute('data-k')] = el.checked; }); });
  P.shortcuts = function () {
    var rows = [['Command palette', '⌘ K'], ['Search', '/'], ['New task', 'C'], ['Undo / redo', '⌘ Z · ⌘ ⇧ Z'], ['Go to My work / Inbox / All tasks', 'G H · G I · G A'], ['Docs / Dashboards / Automations', 'G D · G B · G U'], ['Switch view in a project', '1 – 6'], ['Move through tasks', 'J K'], ['Select / range-select', 'X · ⇧ click'], ['Move a board card', '[ ]'], ['Move / resize a timeline bar', '← → · ⇧ ← →'], ['Table: move / edit cell', 'Arrows · Enter · Tab'], ['Focus mode', 'F'], ['Timer on open task', 'T'], ['Dark theme', '⇧ D']];
    return head('Keyboard shortcuts', 'Everything is reachable from the keyboard.') + '<div class="card" style="padding:6px 18px;max-width:720px"><div class="kb-list">' + rows.map(function (r) { return '<div><span>' + r[0] + '</span><span class="kbd-row">' + r[1].split(' ').map(function (k) { return k === '·' ? '<span class="faint">·</span>' : '<kbd>' + k + '</kbd>'; }).join('') + '</span></div>'; }).join('') + '</div></div>';
  };
  P.data = function (S) {
    var kb = Math.round(JSON.stringify(S).length / 1024);
    return head('Data', 'Your workspace is saved on this device (' + kb + ' KB). Export it any time.') +
      sec('Export', 'Download the whole workspace as JSON.', '<button type="button" class="btn" data-act="data-export">' + I('download') + 'Export workspace (.json)</button>') +
      sec('Start fresh', 'Restore the original Fernhill Digital projects, tasks and settings.', '<button type="button" class="btn danger" data-act="data-reset">' + I('refresh') + 'Start fresh</button>');
  };
  UI.act('data-export', function () { try { var blob = new Blob([JSON.stringify(store.S, null, 2)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ordwell-workspace-' + D.today() + '.json'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 200); } catch (e) { UI.toast('Export isn’t available in this browser'); } });
  UI.act('data-reset', function () { app.resetDemo(); });

  /* ---------- new project (blank) ---------- */
  UI.act('new-project', function () {
    var S = store.S;
    UI.dialog({ title: 'New project', ok: 'Create project',
      body: '<div class="fld"><label class="lbl-t" for="np-n">Project name</label><input id="np-n" class="inp" autofocus placeholder="e.g. Pallava Weaves — Pongal lookbook"><div class="err" id="np-e" hidden></div></div><div class="fld"><label class="lbl-t" for="np-s">Space</label><select id="np-s" class="inp">' + S.spaces.filter(function (s) { return s.ws === S.ws; }).map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + '</option>'; }).join('') + '</select></div><p class="hint">Want statuses, tasks and automations ready to go? <a href="#/templates" style="text-decoration:underline">Start from a template</a>.</p>',
      onOk: function (d) { var n = d.querySelector('#np-n').value.trim(); if (!n) { var e = d.querySelector('#np-e'); e.hidden = false; e.textContent = 'Give the project a name.'; return false; } var id = makeProject({ name: n, space: d.querySelector('#np-s').value, statuses: [['To do', 'todo'], ['In progress', 'active'], ['In review', 'review'], ['Done', 'done']], fields: [], tasks: [], deps: [] }, D.today()); app.go('#/p/' + id + '/list'); } });
  });

  /* ---------- templates ---------- */
  OW.routes.templates = function (main, args, q) {
    if (q && q.use && !Q.isGuest()) { var tu = byId(q.use); history.replaceState(null, '', '#/templates'); if (tu) setTimeout(function () { useTpl(tu); }, 80); }
    var h = '<div class="page"><div class="page-h"><div><h1>Templates</h1><p>Statuses, custom fields, a dated task list with dependencies, views and automations — ready to rename and run.</p></div></div><div class="tpl-grid">';
    OW.TEMPLATES.forEach(function (t) { h += tplCard(t, true); });
    main.innerHTML = h + '</div></div>';
  };
  function tplArt(t) {
    var h = '<div class="tpl-art" style="--h:' + t.hue + '" aria-hidden="true">';
    if (/sprint|onboard/.test(t.id)) { [0, 1, 2].forEach(function (c) { h += '<span class="mini-col" style="left:' + (14 + c * 33) + '%">' + [0, 1, 2].slice(0, 3 - c % 2).map(function () { return '<i></i>'; }).join('') + '</span>'; }); }
    else t.tasks.slice(0, 7).forEach(function (r, i) { h += '<span class="mini-bar" style="left:' + (6 + r[2] * 2) + '%;width:' + Math.max(5, r[3] * 2.4) + '%;top:' + (14 + i * 15) + 'px;opacity:' + (0.45 + i * 0.07) + '"></span>'; });
    return h + '</div>';
  }
  function tplCard(t, inApp) {
    return '<article class="tpl">' + tplArt(t) + '<div class="tpl-b"><h3>' + esc(t.name) + '</h3><p>' + esc(t.blurb) + '</p><div class="tm"><span class="tag">' + t.tasks.length + ' tasks</span><span class="tag">' + t.statuses.length + ' statuses</span>' + (t.fields.length ? '<span class="tag">' + t.fields.length + ' fields</span>' : '') + '<span class="tag">' + t.autos.length + ' automation' + (t.autos.length > 1 ? 's' : '') + '</span></div>' +
      '<div style="display:flex;gap:8px;margin-top:14px"><button type="button" class="btn sm" data-act="tpl-view" data-id="' + t.id + '">Preview</button>' + (inApp ? '<button type="button" class="btn sm pri" data-act="tpl-use" data-id="' + t.id + '">Use template</button>' : '') + '</div></div></article>';
  }
  OW.tplCard = tplCard;
  function byId(id) { return OW.TEMPLATES.filter(function (t) { return t.id === id; })[0]; }
  UI.act('tpl-view', function (el) {
    var t = byId(el.getAttribute('data-id'));
    UI.dialog({ title: t.name, wide: true, ok: OW.app && store.S ? 'Use template' : null, onOk: function () { setTimeout(function () { useTpl(t); }, 10); },
      body: '<p class="muted" style="margin-bottom:14px">' + esc(t.blurb) + '</p><div class="mh" style="padding-left:0">Statuses</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">' + t.statuses.map(function (s) { return '<span class="pill" style="--c:' + UI.CAT[s[1]] + '">' + UI.sdot({ cat: s[1] }) + esc(s[0]) + '</span>'; }).join('') + '</div>' +
        (t.fields.length ? '<div class="mh" style="padding-left:0">Custom fields</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">' + t.fields.map(function (f) { return '<span class="tag">' + I(f[1] === 'formula' ? 'fx' : f[1] === 'select' ? 'sel' : 'hash', 's') + esc(f[0]) + (f[3] ? ' = ' + esc(f[3]) : '') + '</span>'; }).join('') + '</div>' : '') +
        '<div class="mh" style="padding-left:0">Tasks (dated from your start day)</div><div class="preview-list" style="margin-top:4px">' + t.tasks.map(function (r) { return '<div class="pr"><span class="mono" style="width:60px">Day ' + (r[2] + 1) + '</span><span style="flex:1">' + (r[5].indexOf('milestone') > -1 ? I('diamond', 's') + ' ' : '') + esc(r[0]) + '</span><span class="faint">' + r[3] + 'd</span></div>'; }).join('') + '</div>' +
        '<div class="mh" style="padding-left:0;margin-top:12px">Automations included</div>' + t.autos.map(function (a) { return '<p style="font-size:13px;padding:3px 0">' + I('bolt', 's') + ' ' + esc(a) + '</p>'; }).join('') });
  });
  UI.act('tpl-use', function (el) { useTpl(byId(el.getAttribute('data-id'))); });
  function useTpl(t) {
    var S = store.S;
    UI.dialog({ title: 'Use “' + t.name + '”', ok: 'Create project',
      body: '<div class="fld"><label class="lbl-t" for="tu-n">Project name</label><input id="tu-n" class="inp" autofocus value="' + esc(t.name === 'Agency client delivery' ? 'Pallava Weaves — Pongal lookbook site' : t.name === 'Construction site' ? 'Koramangala café fit-out' : t.name) + '"><div class="err" id="tu-e" hidden></div></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="fld"><label class="lbl-t" for="tu-s">Space</label><select id="tu-s" class="inp">' + S.spaces.filter(function (s) { return s.ws === S.ws; }).map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + '</option>'; }).join('') + '</select></div><div class="fld"><label class="lbl-t" for="tu-d">Start date</label><input id="tu-d" class="inp" type="date" value="' + D.add(D.today(), 1) + '"></div></div>' +
        '<p class="hint">' + t.tasks.length + ' tasks are dated from the start day in dependency order — drag them on the timeline afterwards. Automations are created switched on.</p>',
      onOk: function (d) {
        var n = d.querySelector('#tu-n').value.trim(), st = d.querySelector('#tu-d').value || D.today();
        if (!n) { var e = d.querySelector('#tu-e'); e.hidden = false; e.textContent = 'Give the project a name.'; return false; }
        var id = makeProject({ name: n, space: d.querySelector('#tu-s').value, statuses: t.statuses, fields: t.fields, tasks: t.tasks, deps: t.deps, hue: t.hue, tpl: t }, st);
        app.vstate[id] = null; app.go('#/p/' + id + '/timeline');
        setTimeout(function () { UI.toast('Created <b>' + esc(n) + '</b> from “' + esc(t.name) + '” with ' + t.tasks.length + ' tasks', { icon: 'template', undo: true }); }, 200);
      } });
  }
  var ROLEMAP = { design: 'u3', dev: 'u4', frontend: 'u4', backend: 'u8', content: 'u5', newsletter: 'u5', qa: 'u10', reel: 'u6', carousel: 'u3', campaign: 'u9', report: 'u9', civil: 'u7', mep: 'u7', finishes: 'u7' };
  function makeProject(o, start) {
    var id;
    store.commit('Created ' + o.name, function (S) {
      id = store.uid('p');
      var key = o.name.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 3) || 'NEW';
      while (S.projects.some(function (p) { return p.key === key; })) key = key.slice(0, 2) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
      var sts = o.statuses.map(function (s, i) { return { id: 's' + i, name: s[0], cat: s[1] }; });
      var last = o.tasks.reduce(function (m, r) { return Math.max(m, r[2] + r[3]); }, 14);
      var p = { id: id, space: o.space, key: key, name: o.name, client: 'New client', owner: Q.me(), hue: o.hue || Math.round(Math.random() * 360), statuses: sts, health: 'on', budget: 0, start: start, end: D.add(start, last + 2), desc: o.tpl ? 'Created from the “' + o.tpl.name + '” template.' : '', fields: [], members: S.users.filter(function (u) { return u.role !== 'guest'; }).map(function (u) { return u.id; }) };
      S.projects.push(p);
      var fmap = {};
      o.fields.forEach(function (f) { var nf = { id: store.uid('f'), project: id, name: f[0], type: f[1], fmt: f[2] || 'num' }; if (f[3]) nf.formula = f[3]; if (f[4]) nf.options = f[4]; S.fields.push(nf); p.fields.push(nf.id); fmap[f[0]] = nf.id; });
      var made = o.tasks.map(function (r, i) {
        var who = ROLEMAP[r[5][0]] || Q.me();
        var t = OW.A.create({ project: id, title: r[0], status: sts[Math.min(r[1], sts.length - 1)].id, assignees: [who], start: D.add(start, r[2]), due: D.add(start, r[2] + Math.max(0, r[3] - 1)), est: r[4], tags: r[5].slice(), order: i });
        if (o.tpl && o.tpl.id === 'tp-agency') { t.fields[fmap.Budget] = [30000, 60000, 60000, 90000, 120000, 160000, 90000, 320000, 60000, 30000, 0][i] || 0; t.fields[fmap.Spent] = 0; }
        return t;
      });
      (o.deps || []).forEach(function (d) { if (made[d[0]] && made[d[1]]) made[d[1]].deps.push(made[d[0]].id); });
      // schedule pass: nothing starts before its blockers finish (durations kept)
      made.forEach(function (t) { var last = null; t.deps.forEach(function (id) { var b = Q.task(id); if (b && b.due && (!last || b.due > last)) last = b.due; }); if (last && t.start <= last) { var by = D.diff(t.start, last) + 1; t.start = D.add(t.start, by); t.due = D.add(t.due, by); } });
      p.end = made.reduce(function (m, t) { return t.due > m ? t.due : m; }, p.end);
      if (o.tpl) {
        if (o.tpl.id === 'tp-agency') S.automations.push({ id: store.uid('au'), name: 'Client review hand-off', project: id, on: true, trigger: { type: 'status', to: 's3' }, conds: [], actions: [{ type: 'tag', value: 'client-visible' }, { type: 'due', days: 2 }], created: Date.now(), by: Q.me() });
        if (o.tpl.id === 'tp-site') S.automations.push({ id: store.uid('au'), name: 'Snags go to the top', project: id, on: true, trigger: { type: 'status', to: 's2' }, conds: [], actions: [{ type: 'priority', value: 4 }, { type: 'notify', who: 'owner' }], created: Date.now(), by: Q.me() });
      }
      S.favs.push(id);
    }, { quiet: true });
    return id;
  }
})();
