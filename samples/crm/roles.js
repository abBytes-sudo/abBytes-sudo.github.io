/* Lumen CRM Pro — one sidebar per role, a bottom tab bar per role, the "Who is working?" card, and the receiving side of
   the product page's "Say hi" hand-over (localStorage key lumen-crm-hi). Routes a role cannot see still work by URL. */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$;
  var P = function () { return C.P(); };
  var RK = 'lumen-crm-role', SK = 'lumen-crm-who-seen', PK = 'lumen-crm-platform-open', HK = 'lumen-crm-hi';
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ss(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { } }

  C.ROLE_TITLE = { agent: 'Sales agent', manager: 'Sales manager', admin: 'Admin' };
  var PEOPLE = [
    ['Isha Bedi', 'agent', 'Replies to new enquiries, works the call list and moves deals. Eight places, nothing else.'],
    ['Meera Joshi', 'manager', 'Watches the team’s reply times, approves discounts and reads the forecast.'],
    ['Aarav Khanna', 'admin', 'Everything, plus workflows, routing, tracking and settings.']
  ];

  // the chosen person survives "Start fresh" and a re-seeded workspace
  C.seeders.push(function (p) { var r = ls(RK); if (r && p.users.some(function (u) { return u.name === r; })) p.me = r; });

  // ---- layouts ------------------------------------------------------------------------------------------------------
  var WS = ['dashboard', 'inbox', 'pipeline', 'conversations', 'tasks', 'calendar', 'approvals'], REC = ['deals', 'contacts', 'companies', 'quotes', 'tickets', 'campaigns'];
  var PLAT = ['workflows', 'sequences', 'routing', 'bot', 'products', '*cobj', 'rbuilder', 'tracking', 'pixel', 'capi', 'attribution', 'gsc', 'utm', 'integrations', 'settings'];
  var LAY = {
    agent: [['Work', ['dashboard', 'inbox', 'conversations', 'tasks', 'calendar']], ['Records', ['deals', 'contacts', 'quotes']]],
    manager: [['Workspace', WS], ['Records', REC], ['Insights', ['reports', 'forecast']]],
    admin: [['Workspace', WS], ['Records', REC], ['Insights', ['reports', 'forecast', 'dashboards']], ['Platform', PLAT, true]]
  };
  var TABS = {
    agent: [['dashboard', 'Home'], ['inbox', 'Inbox'], ['tasks', 'Tasks'], ['deals', 'Deals']],
    manager: [['dashboard', 'Home'], ['pipeline', 'Board'], ['approvals', 'Approvals'], ['reports', 'Reports']],
    admin: [['dashboard', 'Home'], ['inbox', 'Inbox'], ['deals', 'Deals'], ['reports', 'Reports']]
  };
  var BADGE = { inbox: 'inbox', tasks: 'tasks', approvals: 'approvals' };
  function role() { return C.me().role; }
  C.navOK = function (route) {
    if (route === 'dashboard') return true;
    var lay = LAY[role()] || LAY.admin, ok = false;
    lay.forEach(function (g) { if (g[1].indexOf(route) > -1 || (/^o-/.test(route) && g[1].indexOf('*cobj') > -1)) ok = true; });
    return ok;
  };
  C.navCount = function (r) { var n = 0; (LAY[r] || []).forEach(function (g) { n += g[1].filter(function (k) { return k !== '*cobj'; }).length; }); return n; };

  var chev = '<svg class="ic ngc" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  function platOpen() { return ls(PK) === '1'; }
  C.sideBuild = function () {
    var nav = $('.nav'); if (!nav) return;
    var lay = LAY[role()] || LAY.admin, rest = nav.querySelector('.nav-rest');
    if (!rest) { rest = document.createElement('div'); rest.className = 'nav-rest'; rest.hidden = true; nav.appendChild(rest); }
    $$('.nav a[data-nav]').forEach(function (a) { rest.appendChild(a); });
    Array.prototype.slice.call(nav.children).forEach(function (c) { if (c.id !== 'favs' && c !== rest) nav.removeChild(c); });
    var map = {}; $$('a[data-nav]', rest).forEach(function (a) { map[a.dataset.nav] = a; });
    lay.forEach(function (g, gi) {
      var keys = [];
      g[1].forEach(function (k) { if (k === '*cobj') Object.keys(map).forEach(function (x) { if (map[x].dataset.cobj) keys.push(x); }); else if (map[k]) keys.push(k); });
      if (!keys.length) return;
      if (g[2]) {
        var open = platOpen(), b = document.createElement('button'), w = document.createElement('div');
        b.type = 'button'; b.className = 'ngrp ngrp-b'; b.dataset.act = 'plat-toggle'; b.setAttribute('aria-expanded', String(open)); b.setAttribute('aria-controls', 'nav-plat');
        b.innerHTML = '<span>' + esc(g[0]) + '</span>' + chev;
        w.id = 'nav-plat'; w.className = 'nav-plat'; w.hidden = !open;
        keys.forEach(function (k) { w.appendChild(map[k]); });
        nav.insertBefore(b, rest); nav.insertBefore(w, rest);
      } else {
        var h = document.createElement('div'); h.className = 'ngrp'; h.textContent = g[0]; nav.insertBefore(h, rest);
        keys.forEach(function (k) { nav.insertBefore(map[k], rest); });
      }
    });
    nav.appendChild(rest);
    var cur = C.cur && $('.nav a[data-nav="' + C.cur.name + '"]'); if (cur) cur.setAttribute('aria-current', 'page');
    openForRoute(); tabBuild();
  };
  function openForRoute() {
    var w = $('#nav-plat'), b = $('.ngrp-b'); if (!w || !b) return;
    var inside = !!w.querySelector('a[aria-current]');
    if (inside) { w.hidden = false; b.setAttribute('aria-expanded', 'true'); }
  }
  C.acts['plat-toggle'] = function (el) {
    var w = $('#nav-plat'); if (!w) return; var open = w.hidden; w.hidden = !open; el.setAttribute('aria-expanded', String(open)); ss(PK, open ? '1' : '0');
  };
  function tabBuild() {
    var tb = $('#tabbar'); if (!tb) return;
    var more = tb.querySelector('button'); if (!more) return;
    $$('a', tb).forEach(function (a) { tb.removeChild(a); });
    (TABS[role()] || TABS.admin).forEach(function (t) {
      var src = $('.nav a[data-nav="' + t[0] + '"] svg'), svg = src ? src.outerHTML.replace(/width="\d+" height="\d+"/, 'width="21" height="21"') : '';
      var a = document.createElement('a'); a.href = '#/' + t[0]; a.dataset.tab = t[0];
      a.innerHTML = svg + '<span>' + t[1] + '</span>' + (BADGE[t[0]] ? '<i class="tb-n" data-badge="' + BADGE[t[0]] + '" hidden></i>' : '');
      if (C.cur && C.cur.name === t[0]) a.setAttribute('aria-current', 'page');
      tb.insertBefore(a, more);
    });
    if (C.badges) C.badges();
  }
  C.onRoute = (function (prev) { return function (name, arg) { if (prev) prev(name, arg); openForRoute(); }; })(C.onRoute);

  // ---- the "Who is working?" card ------------------------------------------------------------------------------------
  var opener = null;
  function card() {
    var d = $('#whocard');
    if (!d) {
      d = document.createElement('dialog'); d.id = 'whocard'; d.className = 'whocard'; d.setAttribute('aria-labelledby', 'who-t'); document.body.appendChild(d);
      d.addEventListener('close', function () { ss(SK, '1'); var o = opener; opener = null; if (o && document.contains(o)) o.focus(); });
    }
    var me = C.me().name;
    d.innerHTML = '<h2 id="who-t">Who is working?</h2><p class="wc-s">Pick a person to see the CRM the way they see it.</p><ul role="list">' +
      PEOPLE.map(function (p) {
        var on = p[0] === me, n = C.navCount(p[1]);
        return '<li><button type="button" data-act="role-pick" data-name="' + esc(p[0]) + '"' + (on ? ' aria-current="true"' : '') + '>' + C.avatar(p[0], 36) +
          '<span class="wc-t"><b>' + esc(p[0]) + '</b><em>' + C.ROLE_TITLE[p[1]] + '</em><small>' + esc(p[2]) + '</small></span>' + (on ? '<span class="wc-ck">' + C.ic('check', 15) + '</span>' : '') + '</button></li>';
      }).join('') + '</ul><p class="wc-f"><kbd>Esc</kbd> to close. Switch any time from the bottom of the sidebar.</p>';
    if (!d.open) d.showModal();
    var f = d.querySelector('button[aria-current]') || d.querySelector('button'); if (f) f.focus();
  }
  C.acts.whoami = function (el) { opener = el || null; card(); };
  C.acts['role-pick'] = function (el) {
    var n = el.dataset.name, d = $('#whocard'); ss(RK, n); ss(SK, '1');
    if (d && d.open) d.close();
    if (C.me().name !== n) C.switchUser(n); else C.whoPaint();
    if (!/^#\/dashboard\/?$/.test(location.hash)) location.hash = '#/dashboard'; else C.route(false, true);
  };

  // ---- hand-over from the product page ("Say hi") --------------------------------------------------------------------
  function handoff() {
    var raw = ls(HK); if (raw == null) return false;
    ss(HK, null);
    try {
      var o = JSON.parse(raw);
      if (!o || typeof o !== 'object' || typeof o.name !== 'string' || !o.name.trim()) return false;
      var name = o.name.trim().slice(0, 80), msg = typeof o.message === 'string' ? o.message.trim().slice(0, 600) : '', need = typeof o.need === 'string' ? o.need.trim().slice(0, 60) : '';
      var city = typeof o.city === 'string' ? o.city.trim().slice(0, 60) : '', rs = +o.budget > 0 ? +o.budget : 0;
      var svc = (C.SERVICES || []).filter(function (s) { return s.toLowerCase() === need.toLowerCase(); })[0] || need || 'Enquiry';
      var l = C.newLead({ name: name, phone: '—', source: 'whatsapp', service: svc, loc: city || undefined, budget: rs ? Math.max(.1, Math.round(rs / 1e4) / 10) : undefined, req: msg || undefined, utm: { source: 'whatsapp', medium: 'click-to-chat', campaign: 'say-hi' }, extra: 'from the website' });
      var first = String(o.owner || '').trim().toLowerCase();
      var u = first && P().users.filter(function (x) { return x.name.split(' ')[0].toLowerCase() === first; })[0];
      if (u) l.owner = u.name;
      if (msg) C.log(l, 'msg', 'WhatsApp from ' + name.split(' ')[0] + ': ' + msg);
      C.save(); C.badges();
      if (!ls(RK) && !C.visibleLead(l)) C.switchUser(l.owner);
      else if (!C.visibleLead(l)) C.switchUser(l.owner);
      C.handed = l.id;
      location.hash = '#/inbox/' + l.id;
      if (C.bell) C.bell();
      return true;
    } catch (e) { return false; }
  }
  C.handoff = handoff;
  addEventListener('storage', function (e) { if (e.key === HK && e.newValue) { try { handoff(); } catch (x) { } } });

  // after the store is ready: build the role chrome, take a hand-over, or greet a first visit
  var wp = C.whoPaint, started = false;
  C.whoPaint = function () {
    wp.apply(this, arguments); C.sideBuild();
    if (started) return; started = true;
    var handed = false; try { handed = handoff(); } catch (e) { }
    if (handed) return;
    if (/[?&]embed=1\b/.test(location.search) || ls(SK) || /^#\/[^/]+\/[^/]+/.test(location.hash)) return;
    setTimeout(function () { if (!ls(SK) && !document.querySelector('dialog[open]')) card(); }, 600);
  };
})();
