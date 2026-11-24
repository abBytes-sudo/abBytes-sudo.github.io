/* Lumen CRM Pro — design system v2 behaviour: tinted stage pills, workspace switcher, Favourites (pinned records),
   collapsed-sidebar tooltips, slide-over panels from lists and boards, ⌘K recents, sticky header hairline. */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$;
  var P = function () { return C.P(); };
  var RKEY = 'lumen-crm-recents';
  var TYPES = { contacts: 'contact', companies: 'company', deals: 'deal', quotes: 'quote', tickets: 'ticket' };

  // ---- seed favourites; recolour stored pipeline stages to the v2 palette -----------------------------------
  var REMAP = { '#4F46E5': '#4F46E5', '#4338CA': '#4338CA', '#98A0B3': '#9A9AA6', '#717C95': '#7C7C8A', '#4F5B78': '#5B5B6B' };
  C.seeders.push(function (p) {
    if (!p.favs) p.favs = [{ t: 'deal', id: 'D-2041' }, { t: 'company', id: 'CO-101' }, { t: 'contact', id: 'P-318' }].filter(function (f) { return C.recOf(f.t, f.id); });
    Object.keys(p.pipes || {}).forEach(function (k) { p.pipes[k].stages.forEach(function (s) { if (REMAP[s.color]) s.color = REMAP[s.color]; }); });
  });
  if (C.SOURCES.web) C.SOURCES.web.color = '#4F46E5';
  (C.STAGES || []).forEach(function (s) { if (REMAP[s.color]) s.color = REMAP[s.color]; });

  // ---- pills get their tint from the stage dot colour --------------------------------------------------------
  function tint(root) { $$('.pill', root).forEach(function (p) { if (p.style.getPropertyValue('--c')) return; var i = p.querySelector('i[style]'); if (i && i.style.background) p.style.setProperty('--c', i.style.background); }); }
  C.tintPills = tint;

  // ---- favourites in the sidebar -------------------------------------------------------------------------------
  function favIcon(f, o) { return f.t === 'company' ? C.logo(o.name, 18) : f.t === 'contact' ? C.avatar(o.name, 18) : '<span class="fav-av">' + C.ic('deal', 16) + '</span>'; }
  function favLabel(f, o) { return f.t === 'deal' ? o.name.split(' — ').pop() : o.name; }
  C.favsPaint = function () {
    var box = $('#favs'); if (!box || !C.P) return;
    var F = (P().favs || []).filter(function (f) { var o = C.recOf(f.t, f.id); return o && C.visible(o); });
    box.innerHTML = '<div class="ngrp">Favourites</div>' + (F.length ? F.map(function (f) { var o = C.recOf(f.t, f.id), href = C.refHref(f); return '<a href="' + href + '" title="' + esc(favLabel(f, o)) + '" data-fav="' + f.t + ':' + f.id + '">' + favIcon(f, o) + '<span class="lbl tr">' + esc(favLabel(f, o)) + '</span></a>'; }).join('') : '<p class="fav-empty lbl">Star a contact, company or deal to pin it here.</p>');
    var cur = location.hash; $$('a', box).forEach(function (a) { if (a.getAttribute('href') === cur) a.setAttribute('aria-current', 'page'); });
  };
  function isFav(t, id) { return (P().favs || []).some(function (f) { return f.t === t && f.id === id; }); }
  C.acts.fav = function (el) {
    var t = el.dataset.t, id = el.dataset.id, L = P().favs = P().favs || [], on = isFav(t, id), o = C.recOf(t, id);
    if (on) P().favs = L.filter(function (f) { return !(f.t === t && f.id === id); }); else L.unshift({ t: t, id: id });
    C.save(); C.favsPaint(); decorate(); C.toast(on ? 'Removed from Favourites' : 'Pinned ' + favLabel({ t: t }, o) + ' to Favourites', { icon: 'flag' });
    var b = $('[data-act="fav"]'); if (b) b.focus();
  };
  C.IC.star = '<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>';

  // ---- decorate rendered views: pin star on record headers, pill tints ------------------------------------------------
  function decorate() {
    var v = $('#view'); if (!v || !C.cur) return; tint(v); tint($('#drawer')); tint($('#peek'));
    var t = TYPES[C.cur.name], h = $('.rec-h .rec-id h1', v);
    if (h && C.cur.arg && (t === 'contact' || t === 'company' || t === 'deal') && C.recOf(t, C.cur.arg)) {
      var on = isFav(t, C.cur.arg), b = $('.fav-b', v);
      var html = '<button type="button" class="ibtn fav-b' + (on ? ' on' : '') + '" data-act="fav" data-t="' + t + '" data-id="' + C.cur.arg + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Remove from Favourites' : 'Add to Favourites') + '" title="' + (on ? 'Unpin' : 'Pin to Favourites') + '">' + C.ic('star', 16) + '</button>';
      if (b) b.outerHTML = html; else h.insertAdjacentHTML('beforeend', html);
    }
  }
  C.decorate = decorate;
  new MutationObserver(function () { decorate(); }).observe(document.getElementById('view'), { childList: true });
  var rr0 = C.rerender; C.rerender = function (fx) { rr0(fx); decorate(); if (peekState) peekPaint(); };
  var dr0 = C.drawerRefresh; if (dr0) C.drawerRefresh = function () { dr0(); tint($('#drawer')); };

  // ---- sticky header hairline once scrolled ------------------------------------------------------------------------------
  var view = $('#view'); view.addEventListener('scroll', function () { view.classList.toggle('scrolled', view.scrollTop > 4); }, { passive: true });

  // ---- workspace switcher ---------------------------------------------------------------------------------------------------
  function closeWs() { var p = $('#ws-pop'); if (p) { p.remove(); var b = $('#ws'); if (b) b.setAttribute('aria-expanded', 'false'); } }
  C.acts.ws = function (el) {
    if ($('#ws-pop')) { closeWs(); return; }
    var r = el.getBoundingClientRect(), pop = document.createElement('div'); pop.id = 'ws-pop'; pop.className = 'ws-pop'; pop.setAttribute('role', 'menu');
    pop.innerHTML = '<div class="wp-h"><span class="ws-tile">' + C.ic('dash', 14) + '</span><div><b>Lumen Homes</b><small>Interiors · Delhi NCR · 4 seats</small></div></div>' +
      '<a role="menuitem" href="#/settings/users">' + C.ic('user', 15) + 'Members and roles</a><a role="menuitem" href="#/settings/pipelines">' + C.ic('cog', 15) + 'Workspace settings<kbd>G</kbd><kbd>,</kbd></a><a role="menuitem" href="product.html">' + C.ic('ext', 15) + 'About Lumen CRM Pro</a><button type="button" role="menuitem" data-act="theme">' + C.ic('moon', 15) + 'Toggle dark theme<kbd>T</kbd></button><button type="button" role="menuitem" data-act="reset">' + C.ic('refresh', 15) + 'Start fresh</button>';
    document.body.appendChild(pop); pop.style.left = Math.max(8, r.left) + 'px'; pop.style.top = (r.bottom + 6) + 'px';
    el.setAttribute('aria-expanded', 'true'); var f = pop.querySelector('a,button'); if (f) f.focus();
  };
  document.addEventListener('click', function (e) { if ($('#ws-pop') && !e.target.closest('#ws-pop,#ws')) closeWs(); else if (e.target.closest('#ws-pop a, #ws-pop button')) setTimeout(closeWs, 0); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#ws-pop')) { closeWs(); var b = $('#ws'); if (b) b.focus(); } });

  // ---- collapsed sidebar tooltips (fixed, so .side's overflow can't clip them) ------------------------------------------------
  var tip = document.createElement('div'); tip.className = 'navtip'; tip.setAttribute('aria-hidden', 'true'); tip.id = 'navtip'; document.body.appendChild(tip);
  function showTip(a) {
    if (!document.body.classList.contains('side-off') || innerWidth <= 900) return;
    var l = $('.lbl', a), n = $('.nbadge', a), r = a.getBoundingClientRect();
    tip.innerHTML = esc(l ? l.textContent : a.title) + (n && !n.hidden && n.textContent ? '<b>' + esc(n.textContent) + '</b>' : '');
    tip.style.left = (r.right + 10) + 'px'; tip.style.top = Math.round(r.top + r.height / 2 - 14) + 'px'; tip.classList.add('on');
  }
  function hideTip() { tip.classList.remove('on'); }
  document.addEventListener('mouseover', function (e) { var a = e.target.closest && e.target.closest('.side .nav a, .side .who, .side .kbhint'); if (a) showTip(a); else hideTip(); });
  document.addEventListener('focusin', function (e) { var a = e.target.closest && e.target.closest('.side .nav a, .side .who, .side .kbhint'); if (a) showTip(a); else hideTip(); });
  document.addEventListener('scroll', hideTip, true);

  // ---- slide-over panel ------------------------------------------------------------------------------------------------------------
  var peekState = null, opener = null;
  function ensurePeek() {
    if ($('#peek')) return;
    document.body.insertAdjacentHTML('beforeend', '<div class="peek-scrim" id="peek-scrim"></div><aside class="peek" id="peek" role="dialog" aria-modal="false" aria-labelledby="peek-t" tabindex="-1" hidden></aside>');
    $('#peek-scrim').addEventListener('click', closePeek);
  }
  function recentPush(t, id) { try { var L = JSON.parse(localStorage.getItem(RKEY) || '[]').filter(function (x) { return !(x.t === t && x.id === id); }); L.unshift({ t: t, id: id }); localStorage.setItem(RKEY, JSON.stringify(L.slice(0, 8))); } catch (e) { } }
  function peekBody(t, o) {
    var full = C.refHref({ t: t, id: o.id }), sub, head;
    if (t === 'contact') { var co = o.co && C.company(o.co); head = C.avatar(o.name, 44); sub = esc(o.role) + (co ? ' · ' + esc(co.name) : '') + ' · ' + esc(o.city); }
    else if (t === 'company') { head = C.logo(o.name, 44); sub = esc(o.industry) + ' · ' + esc(o.city); }
    else { var s = C.pstage(o.pipe, o.stage); head = '<span class="deal-ic">' + C.ic('deal', 20) + '</span>'; sub = '<span class="pill" style="--c:' + s.color + '"><i style="background:' + s.color + '"></i>' + esc(s.label) + '</span> <b class="mono">' + C.rs(C.dealVal(o)) + '</b> · ' + C.dealProb(o) + '%'; }
    var q = t === 'contact' ? { c: o.id, lead: o.leadId } : t === 'company' ? { co: o.id } : { d: o.id, lead: o.leadId };
    var tl = C.timeline(q).slice(0, 6).map(function (a) { var ty = C.ATYPE[a.type] || ['Activity', 'note']; return '<li class="tl-' + a.type + '"><span class="tl-i">' + C.ic(ty[1], 13) + '</span><div class="tl-b"><div class="tl-h"><b>' + ty[0] + '</b><span class="muted sm">' + esc((a.by || '').split(' ')[0]) + '</span><time>' + C.rel(a.t) + '</time></div><p>' + esc(a.text) + '</p></div></li>'; }).join('');
    var assoc = t === 'contact' ? C.assocBox('contact', o.id, 'deal') : t === 'company' ? C.assocBox('company', o.id, 'contact') : C.assocBox('deal', o.id, 'contact');
    return '<div class="peek-h"><span class="grow">' + { contact: 'Contact', company: 'Company', deal: 'Deal' }[t] + ' · <span class="mono">' + esc(o.id) + '</span></span><a class="btn sm" href="' + full + '" data-act="peek-full">' + C.ic('ext', 14) + 'Open full page</a><button type="button" class="ibtn" data-act="peek-close" aria-label="Close panel (Esc)">' + C.ic('x', 16) + '</button></div>' +
      '<div class="peek-b"><div class="peek-id">' + head + '<div><h2 id="peek-t">' + esc(t === 'deal' ? o.name.split(' — ').pop() : o.name) + '</h2><p>' + sub + '</p></div></div>' +
      '<div class="rec-act">' + [['call', 'phone', 'Log call'], ['wa', 'wa', 'WhatsApp'], ['note', 'note', 'Note']].map(function (x) { return '<button type="button" class="btn sm" data-act="peek-quick" data-v="' + x[0] + '">' + C.ic(x[1], 14) + x[2] + '</button>'; }).join('') + (C.calNew ? '<button type="button" class="btn sm" data-act="rec-sched" data-key="' + t + ':' + o.id + '">' + C.ic('cal', 14) + 'Schedule</button>' : '') + '</div>' +
      C.propPanel(t, o) + assoc + C.recTasks({ t: t, id: o.id }) +
      '<section class="peek-sec"><h3>' + C.ic('flow', 14) + 'Recent activity</h3>' + (tl ? '<ol class="tl rtl">' + tl + '</ol>' : '<p class="empty sm">No activity yet.</p>') + '</section></div>';
  }
  function peekPaint() {
    var pk = $('#peek'); if (!pk || !peekState) return; var o = C.recOf(peekState.t, peekState.id); if (!o) { closePeek(); return; }
    var b = $('.peek-b', pk), y = b ? b.scrollTop : 0, ae = document.activeElement && pk.contains(document.activeElement) ? (document.activeElement.dataset.key || document.activeElement.id) : null;
    pk.innerHTML = peekBody(peekState.t, o); tint(pk); b = $('.peek-b', pk); if (b) b.scrollTop = y;
    if (ae) { var f = pk.querySelector('[data-key="' + ae + '"]') || document.getElementById(ae); if (f && pk.contains(f)) f.focus({ preventScroll: true }); }
  }
  C.peek = function (t, id, from) {
    var o = C.recOf(t, id); if (!o || !C.visible(o)) { location.hash = C.refHref({ t: t, id: id }); return; }
    ensurePeek(); if (!peekState) opener = from || document.activeElement;
    peekState = { t: t, id: id }; var pk = $('#peek'); pk.hidden = false; peekPaint(); recentPush(t, id);
    requestAnimationFrame(function () { pk.classList.add('on'); $('#peek-scrim').classList.add('on'); });
    var c = $('[data-act="peek-close"]', pk); if (c) c.focus({ preventScroll: true });
  };
  function closePeek() {
    var pk = $('#peek'); if (!pk || !peekState) return; peekState = null;
    pk.classList.remove('on'); $('#peek-scrim').classList.remove('on');
    setTimeout(function () { if (!peekState) { pk.hidden = true; pk.innerHTML = ''; } }, C.motion() ? 220 : 0);
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true }); opener = null;
  }
  C.closePeek = closePeek;
  C.acts['peek-close'] = closePeek;
  C.acts['peek-full'] = function () { closePeek(); };
  C.acts['peek-quick'] = function (el) { var s = peekState; if (!s) return; closePeek(); C.ui.rec = C.ui.rec || {}; C.ui.rec.key = s.t + ':' + s.id; C.ui.rec.mode = el.dataset.v; C.ui.rec.tab = 'activity'; C.ui.rec.filter = 'all'; location.hash = C.refHref(s); setTimeout(function () { var x = $('#rc-t') || $('#rc-o'); if (x) x.focus(); }, 500); };
  window.addEventListener('hashchange', function () { if (peekState) closePeek(); setTimeout(C.favsPaint, 0); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !peekState || document.querySelector('dialog[open]') || (e.target.closest && e.target.closest('form.pe'))) return;
    e.stopPropagation(); closePeek();
  }, true);
  // rows and cards open the panel; the name link still opens the full page
  function rowRef(el) { var h = el.dataset.href || ''; var m = h.match(/^#\/(contacts|companies|deals)\/([A-Z]{1,2}-\d+)$/); return m ? { t: TYPES[m[1]], id: m[2] } : null; }
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t.closest || t.closest('a,button,input,select,label,textarea,.rowact')) return;
    var tr = t.closest('tr[data-href]'), r = tr && rowRef(tr);
    if (r) { e.stopPropagation(); C.peek(r.t, r.id, tr); return; }
    var card = t.closest('.dcard'); if (card && Date.now() - (C._dragEnd || 0) > 300) { e.stopPropagation(); C.peek('deal', card.dataset.deal, card); }
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || !e.target.matches) return;
    var r = e.target.matches('tr[data-href]') ? rowRef(e.target) : null; if (r) { e.preventDefault(); e.stopPropagation(); C.peek(r.t, r.id, e.target); return; }
    if (e.target.matches('.dcard')) { e.preventDefault(); e.stopPropagation(); C.peek('deal', e.target.dataset.deal, e.target); }
  }, true);

  // ---- ⌘K recents ----------------------------------------------------------------------------------------------------------------------
  C.onRoute = (function (prev) { return function (name, arg) { if (prev) prev(name, arg); var t = TYPES[name]; if (t && arg && (t === 'contact' || t === 'company' || t === 'deal') && C.recOf(t, arg)) recentPush(t, arg); setTimeout(C.favsPaint, 0); }; })(C.onRoute);
  // tab bar: mark the current place
  C.onRoute = (function (prev) { return function (name, arg) { if (prev) prev(name, arg); var tabs = document.querySelectorAll('#tabbar a'); for (var i = 0; i < tabs.length; i++) { if (tabs[i].dataset.tab === name) tabs[i].setAttribute('aria-current', 'page'); else tabs[i].removeAttribute('aria-current'); } }; })(C.onRoute);
  var pe0 = C.palExtra;
  C.palExtra = function (terms, hit) {
    if (terms.length) return pe0(terms, hit);
    var L = []; try { L = JSON.parse(localStorage.getItem(RKEY) || '[]'); } catch (e) { }
    return L.map(function (x) { var o = C.recOf(x.t, x.id); if (!o || !C.visible(o)) return null; return { g: 'Recent', av: x.t === 'contact' ? o.name : null, ic: x.t === 'company' ? 'building' : x.t === 'deal' ? 'deal' : null, label: x.t === 'deal' ? o.name.split(' — ').pop() : o.name, sub: x.t === 'deal' ? C.pstage(o.pipe, o.stage).label + ' · ' + C.rs(C.dealVal(o)) : x.id, run: function () { location.hash = C.refHref(x); } }; }).filter(Boolean).slice(0, 5);
  };
})();
