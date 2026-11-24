/* Lumen CRM Pro — dark/light theme, the "view as" user switcher, and role enforcement for the automation and
   reports modules (wrapped here so the permission rules live in one place). */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$;
  var P = function () { return C.P(); };
  var TKEY = 'lumen-crm-theme';

  // ---- theme -------------------------------------------------------------------------------------------
  function getTheme() { try { return localStorage.getItem(TKEY) || ''; } catch (e) { return ''; } }
  function applyTheme(t) {
    var dark = t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches && false);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    var b = $('#themeb'); if (b) { b.innerHTML = C.ic(dark ? 'sun' : 'moon', 16); b.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme'); }
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', dark ? '#0E1015' : '#4F46E5');
  }
  C.acts.theme = function () {
    var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(TKEY, next); } catch (e) { }
    applyTheme(next); C.drawCharts(); C.toast(next === 'dark' ? 'Dark theme' : 'Light theme', { icon: next === 'dark' ? 'moon' : 'sun' });
  };
  applyTheme(getTheme());

  // ---- view as (user switcher) ---------------------------------------------------------------------------
  C.whoPaint = function () {
    var u = C.me(), w = $('#who'); if (!w) return;
    w.innerHTML = C.avatar(u.name, 26) + '<span class="lbl"><b>' + esc(u.name) + '</b><span>' + C.ROLE_LABEL[u.role] + ' · ' + esc(u.team) + '</span></span><span class="sr"> — switch user</span><span class="lbl who-sw">' + C.ic('chev-d', 13) + '</span>';
    w.removeAttribute('aria-label');
    document.body.dataset.role = u.role;
  };
  C.switchUser = function (name) {
    var p = P(), from = C.me().name; if (!C.user(name) || name === from) return;
    p.me = name; C.audit('login', null, 'View as', from, name, name); C.save();
    var pop = $('#who-pop'); if (pop) pop.hidden = true; $('#who').setAttribute('aria-expanded', 'false');
    C.whoPaint(); C.bell(); C.badges(); C.ui.ls_contacts = null; C.ui.ls_companies = null;
    C.route(false, true);
    var s = C.perm('scope');
    C.toast('Now viewing as ' + name + ' (' + C.ROLE_LABEL[C.me().role] + ')' + (s === 'own' ? ' — only their own records' : s === 'team' ? ' — their team’s records' : ''), { icon: 'user' });
  };
  // The sidebar clips overflow (for its collapse animation), so the popover lives on <body> as a portal and is
  // positioned with position:fixed from the button's rect: opens upward with a 6 px gap, clamped to the viewport.
  function whoPop() { var pop = $('#who-pop'); if (pop && pop.parentNode !== document.body) document.body.appendChild(pop); return pop; }
  function placeWho() {
    var pop = $('#who-pop'), btn = $('#who'); if (!pop || pop.hidden || !btn) return;
    var r = btn.getBoundingClientRect(), m = 8, w = Math.min(300, innerWidth - 2 * m);
    pop.style.width = w + 'px';
    var h = pop.offsetHeight, left = Math.max(m, Math.min(r.left, innerWidth - w - m)), top = r.top - 6 - h;
    if (top < m) top = Math.min(r.bottom + 6, innerHeight - h - m);
    pop.style.left = Math.round(left) + 'px'; pop.style.top = Math.round(Math.max(m, top)) + 'px';
  }
  addEventListener('resize', placeWho); addEventListener('scroll', placeWho, true);
  C.acts.whoami = function (el) {
    var pop = whoPop(), open = pop.hidden; pop.hidden = !open; el.setAttribute('aria-expanded', String(open)); if (!open) return;
    pop.innerHTML = '<div class="bp-h"><b>View the CRM as…</b><span class="muted sm">See exactly what each role can see and do</span></div><ul role="list">' + P().users.map(function (u) { var me = u.name === C.me().name; return '<li><button type="button" data-act="who-pick" data-name="' + esc(u.name) + '"' + (me ? ' aria-current="true"' : '') + '>' + C.avatar(u.name, 24) + '<span><b>' + esc(u.name) + '</b><small>' + C.ROLE_LABEL[u.role] + ' · ' + esc(u.team) + ' · sees ' + { all: 'everything', team: 'their team', own: 'own records' }[P().roles[u.role].scope] + '</small></span>' + (me ? C.ic('check', 14) : '') + '</button></li>'; }).join('') + '</ul><a class="who-set" href="#/settings/users">' + C.ic('cog', 14) + 'Users and permissions</a>';
    placeWho();
    var f = pop.querySelector('button[aria-current]') || pop.querySelector('button'); if (f) f.focus();
  };
  // keep keyboard users inside the portal popover: Tab cycles its items, Shift+Tab from the first returns to the button
  document.addEventListener('keydown', function (e) {
    var pop = $('#who-pop'); if (e.key !== 'Tab' || !pop || pop.hidden || !pop.contains(e.target)) return;
    var f = $$('button, a[href]', pop), i = f.indexOf(e.target);
    if (e.shiftKey && i === 0) { e.preventDefault(); $('#who').focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  });
  C.acts['who-pick'] = function (el) { C.switchUser(el.dataset.name); var w = $('#who'); if (w) w.focus(); };
  document.addEventListener('click', function (e) { var pop = $('#who-pop'); if (pop && !pop.hidden && !e.target.closest('#who-pop,#who')) { pop.hidden = true; $('#who').setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('keydown', function (e) { var pop = $('#who-pop'); if (e.key === 'Escape' && pop && !pop.hidden) { pop.hidden = true; $('#who').setAttribute('aria-expanded', 'false'); $('#who').focus(); } });

  // ---- role enforcement for automation + reports ------------------------------------------------------------
  function wrapAll(bag, names, perm, what) { names.forEach(function (k) { var f = bag[k]; if (!f) return; bag[k] = function (a, b) { if (!C.can(perm)) { if (a && a.type === 'checkbox') a.checked = !a.checked; C.deny(what); C.rerender(); return; } return f(a, b); }; }); }
  wrapAll(C.acts, ['wf-toggle', 'wf-new', 'wc-add', 'wc-del', 'wa-add', 'wa-del', 'wa-mv', 'wf-del', 'gate-toggle', 'gate-del', 'sq-add', 'sq-del', 'sq-toggle', 'seq-new', 'rr-toggle', 'sc-toggle', 'w-reset'], 'automation', 'change automations, sequences or routing');
  wrapAll(C.chs, ['we', 'wc', 'wa', 'sq', 'sla', 'rr-cap', 'sc-pts'], 'automation', 'change automations, sequences or routing');
  wrapAll(C.forms, ['gate-add'], 'automation', 'change stage gates');
  ['workflows', 'sequences', 'routing'].forEach(function (n) {
    var v = C.views[n]; if (!v) return; var r = v.render;
    v.render = function () { var h = r.apply(this, arguments); return C.can('automation') ? h : '<p class="scope-n ro-banner">' + C.ic('lock', 12) + ' Read-only for ' + esc(C.me().name) + ' (' + C.ROLE_LABEL[C.me().role] + '). Managers and admins can change automations.</p>' + h; };
  });
  var rep = C.views.reports;
  if (rep) { var rr = rep.render; rep.render = function () { if (C.can('reports')) return rr.apply(this, arguments); return C.page('Reports', 'Forecasts, ROI and the team leaderboard') + '<div class="empty-st">' + C.ic('lock', 22) + '<b>Reports are for managers and admins</b><span>Your role (' + C.ROLE_LABEL[C.me().role] + ') doesn’t include reports. Your own numbers are on Home.</span><a class="btn" href="#/dashboard">Go to Home</a></div>'; }; }
  C.badgeFns.push(function () { return {}; });
  C.onRoute = (function (prev) { return function (name, arg) { if (prev) prev(name, arg); var pop = $('#who-pop'); if (pop) pop.hidden = true; }; })(C.onRoute);
})();
