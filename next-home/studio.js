/* The builder's settings, and the projects index. A quiet list on the left (business, modules, look, team, automations) drives
   the working CRM beside it. The business, its data and its flows live in biz.js; the app itself is drawn by crm.js; this file
   owns the choices, the summary, and saving or sharing a setup. Plain DOM, styles through CSSOM only. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, W = window.WORK, Z = window.Biz, $ = function (s) { return d.querySelector(s); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, small = matchMedia('(max-width: 640px)');
  function E(tag, cls, txt) { var e = d.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; }
  function B(txt, cls, fn) { var b = E('button', cls, txt); b.type = 'button'; b.addEventListener('click', fn); return b; }
  function A(p) { for (var i = 1; i < arguments.length; i++) if (arguments[i]) p.appendChild(arguments[i]); return p; }
  var MODS = Z.MODS, PACK = Z.PACK;
  /* five looks, each a different product, and each the house look of one trade: the shell, the navigation, tables, records,
     charts, type and density all change with it. Any look can still be put on any trade. */
  var THEMES = [['atlas', 'Atlas', 'Dark sidebar, dense lists'], ['blueprint', 'Blueprint', 'Squared sheets, ruled tables'], ['till', 'Till', 'Top menu, large and bright'], ['lobby', 'Lobby', 'Warm, serif, a labelled rail'], ['console', 'Console', 'Dark and compact']];
  var OLD = { clean: 'atlas', midnight: 'console', boutique: 'lobby', bold: 'blueprint', soft: 'till', harbour: 'atlas', ledger: 'blueprint' };      // looks from earlier versions, still in saved links
  var NATIVE = { atlas: '#5b2a6e', blueprint: '#ffb800', till: '#f0502f', lobby: '#7b2d3b', console: '#8b8df8' }, HOUSE = { property: 'atlas', build: 'blueprint', retail: 'till', stay: 'lobby', service: 'console' };
  var COLS = ['', '#2563eb', '#0d9f6e', '#d9472b', '#7c3aed', '#be185d'], ROLES = ['owner', 'sales', 'field', 'acct'];
  var DEEP = { pipe: 4, cal: 3, stock: 3, inv: 3, chat: 2, field: 3, rep: 4, portal: 2 };
  var C = { name: '', trade: 'retail', mods: {}, theme: 'till', color: '', role: 'owner', autos: { a1: 1, a2: 1, a3: 1, a4: 1, a5: 1, a6: 0 }, dev: 'desk', view: 'app' };
  var M, App, AU, touched = false, themed = false, keep = '';
  var fr = $('#fr'), app = $('#app2'), cfg = $('#cfg');

  function P() { return PACK[C.trade]; }
  function defaults() { C.mods = {}; P().def.split(' ').forEach(function (m) { C.mods[m] = 1; }); }
  function me() { return P().team[C.role][0]; }
  function add(m) { C.mods[m] = 1; touched = true; sync(); App.paint(); save(); }
  function setRole(v) {
    if (v === 'field' && C.dev !== 'phone' && !small.matches) { keep = C.dev; C.dev = 'phone'; } else if (v !== 'field' && keep) { C.dev = keep; keep = ''; }
    C.role = v; C.view = 'app'; App.open('home');
  }
  function sees() { var n = me(); return C.role === 'owner' ? n + ' sees everything and approves what leaves the business.' : C.role === 'sales' ? n + ' sees their own ' + P().w.pipe.toLowerCase() + ', bookings and invoices. No approvals, no company totals.' : C.role === 'field' ? n + ' sees the day’s jobs and the checklist for each, on a phone. No prices, no pipeline.' : n + ' sees invoices, payments and orders to suppliers. No leads, no chats.'; }

  /* ---- the settings: one calm list. Each group folds; its current value sits beside its name ---- */
  function grp(title, isOpen) { var g = E('details', 'sp-g'), s = E('summary'), v = E('em'); g.open = isOpen; A(s, E('b', '', title), v, E('i')); g.appendChild(s); cfg.appendChild(g); return { el: g, val: v }; }
  function group(parent, key2, items, fn, cls) {
    var g = E('div', cls); g.dataset.g = key2;
    items.forEach(function (it) { var b = B(it[1], '', function () { touched = true; fn(it[0]); sync(); App.paint(); save(); }); b.dataset.v = it[0]; if (it[2]) b.dataset.d = it[2]; g.appendChild(b); });
    parent.appendChild(g); return g;
  }
  var gB = grp('Business', true), nameIn = E('input', 'sp-in'); nameIn.type = 'text'; nameIn.maxLength = 28; nameIn.placeholder = 'Business name'; nameIn.id = 'biz'; nameIn.setAttribute('aria-label', 'Your business name'); nameIn.autocomplete = 'off'; gB.el.appendChild(nameIn);
  nameIn.addEventListener('input', function () { C.name = nameIn.value.trim(); touched = true; App.paint(); save(); });
  group(gB.el, 'trade', Object.keys(PACK).map(function (k) { return [k, PACK[k].n]; }), function (v) { if (v === C.trade) return; C.trade = v; defaults(); if (HOUSE[v]) { C.theme = HOUSE[v]; themed = false; } C.view = 'app'; M.reset(); App.fresh(); ixT = v; index(true); }, 'sp-radio');
  var gM = grp('Modules', true); group(gM.el, 'mods', MODS, function (v) { C.mods[v] = C.mods[v] ? 0 : 1; if (C.mods[v] && (' ' + App.see[C.role] + ' ').indexOf(' ' + v + ' ') >= 0) { App.open(v); C.view = 'app'; } }, 'sp-list');
  var gL = grp('Look', true); group(gL.el, 'theme', THEMES, function (v) { C.theme = v; themed = true; }, 'sp-looks');
  var cg = E('div', 'sp-col'); cg.dataset.g = 'color'; cg.appendChild(E('span', '', 'Colour'));
  COLS.forEach(function (c) { var b = B('', '', function () { C.color = c; touched = true; sync(); save(); }); b.dataset.v = c; if (c) b.style.setProperty('--c', c); b.setAttribute('aria-label', c ? 'Brand colour ' + c : 'The look’s own colour'); b.title = c ? c : 'The look’s own colour'; cg.appendChild(b); });
  var pick = E('input'); pick.type = 'color'; pick.setAttribute('aria-label', 'Pick any brand colour'); pick.addEventListener('input', function () { C.color = pick.value; touched = true; sync(); save(); }); cg.appendChild(pick); gL.el.appendChild(cg);
  var gT = grp('Team', !small.matches), rg = group(gT.el, 'role', ROLES.map(function (k) { return [k, k]; }), setRole, 'sp-radio'), roleP = E('p', 'sp-note'); gT.el.appendChild(roleP);
  var gA = grp('Automations', !small.matches), ag = E('div', 'sp-list sp-two'); ag.dataset.g = 'autos';
  Z.AUTOS.forEach(function (a) { var b = B('', '', function () { var k = a[0]; C.autos[k] = C.autos[k] ? 0 : 1; touched = true; if (C.autos[k] && (k === 'a3' || k === 'a4')) M.sweep(); sync(); App.paint(); save(); }); b.dataset.v = a[0]; A(b, E('b'), E('span')); ag.appendChild(b); }); gA.el.appendChild(ag);
  if (small.matches) { gM.el.open = false; gL.el.open = false; }
  var sum2 = E('div', 'spec'); cfg.appendChild(sum2);
  /* above the app: which view, what day it is in the sample week, which device */
  group($('#vView'), 'view', [['app', 'App'], ['arch', 'System map']], function (v) { C.view = v; }, 'sp-seg'); group($('#vDev'), 'dev', [['desk', 'Desktop'], ['phone', 'Phone']], function (v) { C.dev = v; keep = ''; }, 'sp-seg');
  var ck2 = E('div', 'sp-clk'), ckT = E('b'), ckB = B('Next day', '', function () { App.tick(); }); ckB.setAttribute('aria-label', 'Move the sample week on by a day'); A(ck2, ckT, ckB); $('#vDev').parentNode.insertBefore(ck2, $('#vDev'));
  var tip = $('.st-pv .tip'), hintP = E('p', 'sp-hint'); hintP.setAttribute('aria-live', 'polite');
  if (tip) { tip.parentNode.insertBefore(hintP, tip); tip.appendChild(d.createTextNode(' ')); tip.appendChild(B('Start the week again', 'rst', function () { M.reset(); App.fresh(true); App.note('Sample data is back to Monday morning'); App.paint(); })); }

  /* a brand colour of the visitor's own replaces the look's accent; without one the look keeps its own */
  function lum(h) { var n = parseInt(h.slice(1), 16), f = function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(n >> 16) + .7152 * f(n >> 8 & 255) + .0722 * f(n & 255); }
  function mix(h, t, k) { var a = parseInt(h.slice(1), 16), b = parseInt(t.slice(1), 16), c = function (s) { return Math.round((a >> s & 255) * (1 - k) + (b >> s & 255) * k); }; return 'rgb(' + c(16) + ',' + c(8) + ',' + c(0) + ')'; }
  function brand() {
    var s = app.style, c = C.color, dark = C.theme === 'console', L;
    ['--c-ac', '--c-on', '--c-ac-tx', '--c-ac-soft', '--c-ac2', '--c-on2', '--c-cta', '--c-cta-on'].forEach(function (k) { s.removeProperty(k); });
    if (!/^#[0-9a-f]{6}$/i.test(c)) return; L = lum(c);
    s.setProperty('--c-ac', c); s.setProperty('--c-on', L > .42 ? '#1a1305' : '#fff');
    s.setProperty('--c-ac-tx', dark ? (L < .3 ? mix(c, '#ffffff', .45) : c) : (L > .3 ? mix(c, '#000000', .42) : c));
    s.setProperty('--c-ac-soft', dark ? mix(c, '#101116', .8) : mix(c, '#ffffff', .9));
    s.setProperty('--c-ac2', L > .5 ? mix(c, '#000000', .22) : c); s.setProperty('--c-on2', L > .5 ? '#1a1305' : '#fff'); s.setProperty('--c-cta', c); s.setProperty('--c-cta-on', L > .42 ? '#1a1305' : '#fff');
  }
  function sync() {
    AU = Z.autos(C.trade);
    [].forEach.call(d.querySelectorAll('#build [data-g]'), function (g) { var k = g.dataset.g; [].forEach.call(g.querySelectorAll('button'), function (b) { var v = b.dataset.v; b.setAttribute('aria-pressed', k === 'mods' || k === 'autos' ? !!C[k][v] : C[k] === v); }); });
    [].forEach.call(rg.children, function (b) { b.textContent = P().team[b.dataset.v][1]; b.dataset.d = P().team[b.dataset.v][0]; });
    [].forEach.call(ag.children, function (b, i) { b.firstChild.textContent = AU[i][1]; b.lastChild.textContent = AU[i][2].map(function (x) { return C.mods.chat ? x : x.replace('on WhatsApp', 'by email'); }).join(' → '); });
    gB.val.textContent = P().n; gM.val.textContent = MODS.filter(function (m) { return C.mods[m[0]]; }).length + ' of ' + MODS.length; gL.val.textContent = THEMES.filter(function (t) { return t[0] === C.theme; })[0][1];
    gT.val.textContent = P().team[C.role][1]; gA.val.textContent = Z.AUTOS.filter(function (a) { return C.autos[a[0]]; }).length + ' on'; roleP.textContent = sees();
    fr.dataset.th = C.theme; fr.classList.toggle('phone', C.dev === 'phone'); brand(); pick.value = /^#[0-9a-f]{6}$/i.test(C.color) ? C.color : NATIVE[C.theme]; if (nameIn.value.trim() !== C.name) nameIn.value = C.name;
    if (App) App.fit();
  }
  function spec() { var m = MODS.filter(function (x) { return C.mods[x[0]]; }), a = AU.filter(function (x) { return C.autos[x[0]]; }), w = Math.round(2 + m.reduce(function (s, x) { return s + x[2]; }, 0)); return { m: m, a: a, lo: w, hi: w + 2, n: m.reduce(function (s, x) { return s + DEEP[x[0]]; }, 1), th: THEMES.filter(function (t) { return t[0] === C.theme; })[0][1], r: ROLES.map(function (r) { return P().team[r][1]; }).join(', ') }; }
  function summary() {
    var s = spec(), n = C.name || 'my business', mess = window.MESS && window.MESS.length ? window.MESS.join(', ') : '';
    var body = 'Business: ' + n + '\nTrade: ' + P().n + '\nFirst screen: ' + P().home + '\nModules: ' + s.m.map(function (x) { return x[1]; }).join(', ') + '\nScreens: ' + s.n + '\nLook: ' + s.th + (C.color ? ', brand colour ' + C.color : '') + '\nRoles: ' + s.r + '\nAutomations: ' + (s.a.length ? s.a.map(function (x) { return x[1] + ' → ' + x[2].join(' → '); }).join('; ') : 'none yet') + '\nTypical timeline: ' + s.lo + ' to ' + s.hi + ' weeks' + (mess ? '\nOur mess: ' + mess : '') + '\nLink to this configuration: ' + location.href.split('#')[0] + '#b=' + pack() + '\n\nHow we work today:\n';
    var href = 'mailto:abhimasih0505@gmail.com?subject=' + encodeURIComponent('A system for ' + n) + '&body=' + encodeURIComponent(body);
    sum2.textContent = ''; A(sum2, E('h4', '', (C.name || 'Your') + (C.name ? '’s' : '') + ' system'));
    var dl = E('dl'); [['Modules', s.m.length ? s.m.length + ', with ' + s.n + ' screens' : 'None yet'], ['Roles', ROLES.length + ', one view each'], ['Automations', s.a.length + ' on'], ['Typical timeline', s.lo + ' to ' + s.hi + ' weeks']].forEach(function (x) { A(dl, E('dt', '', x[0]), E('dd', '', x[1])); }); sum2.appendChild(dl);
    sum2.appendChild(E('small', '', 'Two weeks to listen and map, the rest to build, test and launch. A first estimate, not a quote.'));
    var go2 = E('a', 'sp-go', C.name ? 'Build ' + C.name + ' for real →' : 'Build this for real →'); go2.href = '#contact'; go2.addEventListener('click', function () { touched = true; save(); setTimeout(function () { try { window.dispatchEvent(new CustomEvent('build-real')); } catch (e) { /* old browser: the form still opens, unfilled */ } }, 90); }); var sh = B('Copy a link to this setup', 'sp-lk', function () { var u = location.href.split('#')[0] + '#b=' + pack(), ok = function () { sh.textContent = 'Link copied'; setTimeout(function () { sh.textContent = 'Copy a link to this setup'; }, 1800); }; try { history.replaceState(null, '', '#b=' + pack()); } catch (e) { /* file: or sandboxed */ } if (navigator.clipboard) navigator.clipboard.writeText(u).then(ok, ok); else ok(); });
    A(sum2, A(E('p', 'acts'), go2, sh)); sum2.appendChild(E('p', 'sp-48', 'Estimate and a delivery plan within 48 hours.')); if ($('#endH')) $('#endH').textContent = C.name ? 'Let’s build ' + C.name + ' its own system.' : 'Let’s build yours.'; [$('#cta2'), $('#mail')].forEach(function (x) { if (x) x.href = href; });
  }
  /* ---- save, share, restore ---- */
  function pack() { return [C.trade, C.theme, C.color ? C.color.slice(1) : 'auto', MODS.map(function (m) { return C.mods[m[0]] ? 1 : 0; }).join(''), Z.AUTOS.map(function (a) { return C.autos[a[0]] ? 1 : 0; }).join(''), C.role, C.dev, encodeURIComponent(C.name)].join('.'); }
  function unpack(s) {
    var p = s.split('.'); if (p.length < 7 || !PACK[p[0]]) return false; C.trade = p[0];
    if (THEMES.some(function (t) { return t[0] === p[1]; })) { C.theme = p[1]; themed = p[1] !== HOUSE[p[0]]; } else { C.theme = OLD[p[1]] || HOUSE[p[0]]; if (p[2].toLowerCase() === '6a3df0') p[2] = 'auto'; }      /* an old link: its look maps to the nearest new one, and the old default purple gives way to the look's own colour */
    C.color = /^[0-9a-f]{6}$/i.test(p[2]) ? '#' + p[2].toLowerCase() : '';
    C.mods = {}; MODS.forEach(function (m, i) { if (p[3].charAt(i) === '1') C.mods[m[0]] = 1; });
    if (p[4].length >= Z.AUTOS.length) Z.AUTOS.forEach(function (a, i) { C.autos[a[0]] = p[4].charAt(i) === '1' ? 1 : 0; });   /* an older link carries four switches: keep today's defaults */
    if (ROLES.indexOf(p[5]) >= 0) C.role = p[5]; C.dev = p[6] === 'phone' ? 'phone' : 'desk'; try { C.name = decodeURIComponent(p.slice(7).join('.')).slice(0, 28); } catch (e) { C.name = ''; } return true;
  }
  function save() { if (!touched) return; try { localStorage.setItem('am-build', pack()); } catch (e) { /* private mode */ } }
  var ok = false; if (location.hash.indexOf('#b=') === 0) ok = unpack(location.hash.slice(3)); if (!ok) { try { var st0 = localStorage.getItem('am-build'); if (st0) ok = unpack(st0); } catch (e) { /* private mode */ } } if (!ok) defaults();
  addEventListener('mess', function () { var m = window.MESS; if (m && m.length) App.note('Your mess arrived: “' + m[m.length - 1] + '”'); summary(); });

  /* ---- the index: every project on a shelf, sorted by type. Picking a trade pulls its closest projects onto a shelf at the front and
     the tiles glide to their new places. When the page arrives here from the scroll above, the tiles in view come out of the light
     and file onto their shelves: f.js calls land() with how far the light has opened. ---- */
  var ix = $('#ix'), nt = $('#like'), pj = $('#projects'), BASE = root.dataset.base || '', ixT = '', tiles = {}, fly = [], flying = false, lastK = 1, built = false;
  var fineP = matchMedia('(hover: hover) and (pointer: fine)').matches, D3 = { revv: 1, launch: 1, watch: 1, build: 1 };
  var SHELF = [['client', 'Client work', 'Built for clients and in daily use. Case studies with dates and real numbers.'], ['sys', 'Business systems', 'CRMs, stock, quotes, orders and assistants. Sample data inside, so every button can be pressed.'], ['web', 'Websites', 'Storefronts, launches and studio sites, several with live 3D.']];
  var FOR = { property: 'property', build: 'construction', retail: 'retail', stay: 'hospitality', service: 'service' };
  var io = !reduce && 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -10% 0px' }) : null;
  function tile(w) {
    var a = E('a', 'ptile'), th = E('span', 'tw'), src = w.img ? 'img/' + w.img + '-c.webp' : w.card ? 'img/cards/' + w.card + '.webp' : '', tag = w.href.indexOf('projects/') >= 0 ? 'Case study' : D3[w.id] ? 'Live 3D' : '', im, full = null, hot = false;
    a.href = w.href; a.dataset.id = w.id;
    if (src) { im = new Image(); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.width = 760; im.height = 475; im.src = BASE + src; th.appendChild(im); } else th.appendChild(E('i', '', 'Not launched publicly. Screens on request.'));
    if (tag) th.appendChild(E('em', '', tag));
    A(a, th, E('b', '', w.name), E('span', 'tk', w.kind), E('span', 'ts', w.status));
    /* with a mouse, resting on a tile plays the page: the long capture loads once, then scrolls by */
    if (w.img && w.a > 1.5 && fineP && !reduce) {
      im.style.setProperty('--t', (w.a * 1.5).toFixed(1) + 's');
      a.addEventListener('pointerenter', function () { hot = true; if (full === null) { full = new Image(); full.onload = function () { im.src = full.src; full = 1; if (hot) im.classList.add('pan'); }; full.src = BASE + 'img/' + w.img + '.webp'; } else if (full === 1) im.classList.add('pan'); });
      a.addEventListener('pointerleave', function () { hot = false; im.classList.remove('pan'); });
    }
    return a;
  }
  function chips() {
    nt.textContent = ''; nt.appendChild(E('span', '', 'Closest to your trade first:'));
    [['', 'All, by type']].concat(Object.keys(PACK).map(function (k) { return [k, PACK[k].n]; })).forEach(function (c) { var b = B(c[1], '', function () { if (ixT !== c[0]) { ixT = c[0]; index(true); } }); b.setAttribute('aria-pressed', ixT === c[0]); nt.appendChild(b); });
  }
  /* where each tile in the first screen of the index sits, measured once with nothing moving */
  function measure() {
    var all = [].slice.call(ix.querySelectorAll('.ptile')), s; all.forEach(function (el) { el.style.transform = ''; el.style.opacity = ''; }); fly = []; flying = false; ix.classList.remove('flying');
    if (reduce || !root.classList.contains('fall')) return; s = pj.getBoundingClientRect();
    all.forEach(function (el) { var b = el.getBoundingClientRect(); if (b.width && b.top - s.top < innerHeight * 1.02 && b.left < innerWidth) fly.push({ el: el, x: b.left + b.width / 2, y: b.top - s.top + b.height / 2 }); });
    land(lastK);
  }
  function land(k) {
    lastK = k; if (!fly.length) return;
    if (k >= .995) { if (flying) { flying = false; ix.classList.remove('flying'); fly.forEach(function (f) { f.el.style.transform = ''; f.el.style.opacity = ''; }); } return; }
    var top = pj.getBoundingClientRect().top, cx = innerWidth / 2, cy = innerHeight / 2, gap = Math.min(.05, .27 / fly.length);      // dealt out one after another, not as a clump
    if (!flying) { flying = true; ix.classList.add('flying'); }
    fly.forEach(function (f, j) {
      var t = Math.max(0, Math.min(1, (k - .44 - j * gap) / .26)), e = 1 - Math.pow(1 - t, 3);
      f.el.style.transform = 'translate3d(' + ((cx - f.x) * (1 - e)).toFixed(1) + 'px,' + ((cy - top - f.y) * (1 - e)).toFixed(1) + 'px,0) scale(' + (.14 + .86 * e).toFixed(3) + ')'; f.el.style.opacity = Math.min(1, t * 2.4).toFixed(3);
    });
  }
  function index(sorted) {
    var like = ixT ? PACK[ixT].like : [], groups = [], r0 = {}, moved = [], flip = sorted && !reduce;
    if (flip) Object.keys(tiles).forEach(function (id) { tiles[id].style.transform = ''; r0[id] = tiles[id].getBoundingClientRect(); });
    if (like.length) groups.push(['for', 'For ' + FOR[ixT] + ' businesses', 'The ' + like.length + ' closest to that trade. The rest follow, by type.', like.map(function (id) { return W.filter(function (w) { return w.id === id; })[0]; })]);
    SHELF.forEach(function (g) { var l = W.filter(function (w) { return w.cat === g[0] && like.indexOf(w.id) < 0; }); if (l.length) groups.push([g[0], g[1], g[2], l]); });
    ix.textContent = '';
    groups.forEach(function (g, gi) {
      var n = g[3].length, sec = E('section', 'shelf' + (g[0] === 'for' ? ' for' : '')), h = E('header', 'sh-h'), row = E('div', 'sh-row');
      row.style.setProperty('--cols', n % 4 === 0 ? 4 : n % 3 === 0 ? 3 : n % 5 === 0 ? 5 : 4);      // rows that fill: 6 and 9 sit three across, 4 and 8 four across
      A(h, E('span', 'sh-n', '0' + (gi + 1)), E('h3', '', g[1]), E('p', 'sh-c', n + (n > 1 ? ' projects' : ' project')), E('p', 'sh-d', g[2]));
      g[3].forEach(function (w, j) { var t = tiles[w.id] || (tiles[w.id] = tile(w)); t.style.setProperty('--i', j); row.appendChild(t); });
      A(sec, h, row); ix.appendChild(sec);
    });
    chips(); measure(); if ($('#labN')) $('#labN').textContent = '0' + (groups.length + 1);      // the Lab's shelf, written in the page, follows whatever shelves came before it
    [].forEach.call(ix.children, function (sec) { if (!io || built || fly.some(function (f) { return sec.contains(f.el); })) sec.classList.add('seen'); else io.observe(sec); });
    if (io) ix.classList.add('rvl'); built = true;
    if (flip) {
      Object.keys(r0).forEach(function (id) { var el = tiles[id], a = r0[id], b = el.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top, sc = b.width ? a.width / b.width : 1; if (Math.abs(dx) + Math.abs(dy) < 1 && Math.abs(sc - 1) < .01) return; el.style.transition = 'none'; el.style.transformOrigin = '0 0'; el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + sc.toFixed(4) + ')'; moved.push(el); });
      void ix.offsetWidth;
      moved.forEach(function (el) { el.style.transition = 'transform .75s cubic-bezier(.2,.8,.2,1)'; el.style.transform = ''; });
      setTimeout(function () { moved.forEach(function (el) { el.style.transition = ''; el.style.transformOrigin = ''; }); }, 820);
    }
  }
  var rsz; addEventListener('resize', function () { clearTimeout(rsz); rsz = setTimeout(measure, 200); }); if (d.fonts && d.fonts.ready) d.fonts.ready.then(measure);
  window.__ix = { land: land };
  M = Z.make(C);
  App = window.CRM(app, C, M, {
    url: function (t) { $('#frUrl').textContent = t; },
    after: function (h) { ckT.textContent = App.day(); hintP.textContent = h || ''; summary(); },
    add: add, sync: sync,
    auto: function (k) { C.autos[k] = C.autos[k] ? 0 : 1; touched = true; if (C.autos[k] && (k === 'a3' || k === 'a4')) M.sweep(); sync(); App.paint(); save(); },
    role: function (r) { touched = true; setRole(r); sync(); App.paint(); save(); }
  });
  sync(); App.paint(); index();
  if (location.hash.indexOf('#b=') === 0) setTimeout(function () { $('#build').scrollIntoView(); }, 300);
  window.__studio = { C: C, M: M, App: App, paint: function () { App.paint(); }, go: function (s, t, o) { App.go(s, t, o); }, jump: function (r) { App.jump(r); }, book: function (n, w) { M.book(n, w); App.paint(); } };
})();
