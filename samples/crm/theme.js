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

  // ---- view as (user switcher). The picker itself is the "Who is working?" card in roles.js ------------------------
  C.whoPaint = function () {
    var u = C.me(), w = $('#who'); if (!w) return;
    w.innerHTML = C.avatar(u.name, 26) + '<span class="lbl"><b>' + esc(u.name) + '</b><span>' + ((C.ROLE_TITLE || C.ROLE_LABEL)[u.role]) + ' · ' + esc(u.team) + '</span></span><span class="sr"> — switch person</span><span class="lbl who-sw">' + C.ic('chev-d', 13) + '</span>';
    w.removeAttribute('aria-label');
    document.body.dataset.role = u.role;
  };
  C.switchUser = function (name) {
    var p = P(), from = C.me().name; if (!C.user(name) || name === from) return;
    p.me = name; C.audit('login', null, 'Switched person', from, name, name); C.save();
    C.whoPaint(); C.bell(); C.badges(); C.ui.ls_contacts = null; C.ui.ls_companies = null;
    C.route(false, true);
    var s = C.perm('scope');
    C.toast('Now working as ' + name + ' (' + C.ROLE_LABEL[C.me().role] + ')' + (s === 'own' ? ': only their own records' : s === 'team' ? ': their team’s records' : ''), { icon: 'user' });
  };

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
  })();
