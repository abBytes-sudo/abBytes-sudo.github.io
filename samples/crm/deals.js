/* Lumen CRM Pro — deals: multiple pipelines, drag-and-drop kanban that respects stage gates,
   deal record page with Halden Supply line items, stock from the demo bridge, won → Stockroom. */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$, V = C.views, page = C.page;
  var P = function () { return C.P(); };
  function DS() { return C.ui.deals || (C.ui.deals = { pipe: 'sales', owner: 'all', view: 'board', q: '', priority: '', closeIn: 0, minValue: 0, sv: '' }); }
  function stages(pipe) { return C.PIPES[pipe].stages; }
  function gateOn(pipe, stage) { return P().gates.filter(function (g) { return g.on && g.pipe === pipe && g.stage === stage; })[0]; }
  function list() {
    var u = DS(), q = (u.q || '').toLowerCase(), now = Date.now();
    return P().deals.filter(function (d) {
      if (!C.visible(d) || d.pipe !== u.pipe || (u.owner !== 'all' && d.owner !== u.owner)) return false;
      if (q && (d.name + ' ' + d.id + ' ' + ((C.contact(d.c) || {}).name || '')).toLowerCase().indexOf(q) < 0) return false;
      if (u.priority && (d.fields.priority || 'Normal') !== u.priority) return false;
      if (u.closeIn && (!C.dealOpen(d) || d.close - now > u.closeIn * 864e5)) return false;
      if (u.minValue && C.dealVal(d) < u.minValue) return false;
      return true;
    });
  }
  function dealFilters() {
    var u = DS(), V0 = P().views.deals || [];
    return '<div class="vtabs" role="group" aria-label="Saved views"><button type="button" class="vtab' + (!u.sv ? ' on' : '') + '" data-act="dv-pick" data-id="" aria-pressed="' + !u.sv + '">All deals</button>' + V0.map(function (v) { return '<span class="vt"><button type="button" class="vtab' + (u.sv === v.id ? ' on' : '') + '" data-act="dv-pick" data-id="' + v.id + '" aria-pressed="' + (u.sv === v.id) + '">' + esc(v.name) + '</button><button type="button" class="vx" data-act="dv-del" data-id="' + v.id + '" aria-label="Delete saved view ' + esc(v.name) + '">' + C.ic('x', 11) + '</button></span>'; }).join('') + '<button type="button" class="vtab save" data-act="dv-save">' + C.ic('plus', 12) + ' Save view</button></div>' +
      '<div class="dfbar" role="search"><div class="sfield sm">' + C.ic('search', 14) + '<label class="sr" for="dq">Search deals</label><input id="dq" type="search" data-in="dq" value="' + esc(u.q || '') + '" placeholder="Search deals…" autocomplete="off"></div><label class="sr" for="dpr">Priority</label><select id="dpr" class="sel sm" data-ch="dflt" data-f="priority"><option value="">Any priority</option>' + ['Normal', 'High', 'Urgent'].map(function (x) { return '<option' + (u.priority === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select><label class="sr" for="dci">Closing</label><select id="dci" class="sel sm" data-ch="dflt" data-f="closeIn"><option value="0">Any close date</option>' + [[7, 'Closing in 7 days'], [30, 'Closing in 30 days'], [90, 'This quarter']].map(function (x) { return '<option value="' + x[0] + '"' + (+u.closeIn === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select><label class="sr" for="dmv">Minimum value</label><select id="dmv" class="sel sm" data-ch="dflt" data-f="minValue"><option value="0">Any value</option>' + [[500000, '₹5 L+'], [1000000, '₹10 L+'], [2500000, '₹25 L+']].map(function (x) { return '<option value="' + x[0] + '"' + (+u.minValue === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>' + (C.can('export') ? '<button type="button" class="btn sm" data-act="deals-export">' + C.ic('down', 13) + 'Export view</button>' : '') + '</div>';
  }
  C.ins.dq = function (el) { DS().q = el.value; DS().sv = ''; clearTimeout(C._dqT); C._dqT = setTimeout(function () { C.rerender(); var x = $('#dq'); if (x) { x.focus(); x.setSelectionRange(x.value.length, x.value.length); } }, 200); };
  C.chs.dflt = function (el) { var u = DS(); u[el.dataset.f] = el.dataset.f === 'priority' ? el.value : +el.value; u.sv = ''; C.rerender(); var x = $('#' + el.id); if (x) x.focus(); };
  C.acts['dv-pick'] = function (el) { var u = DS(), v = (P().views.deals || []).filter(function (x) { return x.id === el.dataset.id; })[0]; u.q = ''; u.priority = ''; u.closeIn = 0; u.minValue = 0; u.sv = ''; if (v) { Object.keys(v.f).forEach(function (k) { u[k] = v.f[k]; }); u.sv = v.id; } C.rerender(); var b = $('[data-act="dv-pick"][data-id="' + el.dataset.id + '"]'); if (b) b.focus(); };
  C.acts['dv-save'] = function () { var u = DS(); C.dialog('Save deal view', '<div class="field"><label for="dv-n">View name</label><input id="dv-n" name="name" required maxlength="28" placeholder="e.g. Big deals closing soon" autocomplete="off"></div>', 'Save view', function (fd) { var n = (fd.get('name') || '').trim(); if (!n) return false; var v = { id: C.uid('dv'), name: n, f: { q: u.q, priority: u.priority, closeIn: u.closeIn, minValue: u.minValue, owner: u.owner } }; (P().views.deals = P().views.deals || []).push(v); u.sv = v.id; C.audit('settings', null, 'Saved view (deals)', '', n); C.save(); setTimeout(C.rerender, 20); }); };
  C.acts['dv-del'] = function (el) { var L = P().views.deals, v = L.filter(function (x) { return x.id === el.dataset.id; })[0]; P().views.deals = L.filter(function (x) { return x !== v; }); if (DS().sv === v.id) DS().sv = ''; C.save(); C.rerender(); C.toast('View removed', { icon: 'trash', undo: function () { P().views.deals.push(v); C.save(); C.rerender(); } }); };
  C.acts['deals-export'] = function () { C.exportCSV('deals-' + DS().pipe, [['ID', function (d) { return d.id; }], ['Deal', function (d) { return d.name; }], ['Pipeline', function (d) { return C.PIPES[d.pipe].label; }], ['Stage', function (d) { return C.pstage(d.pipe, d.stage).label; }], ['Value (INR)', function (d) { return C.dealVal(d); }], ['Probability %', function (d) { return C.dealProb(d); }], ['Weighted (INR)', function (d) { return Math.round(C.dealVal(d) * C.dealProb(d) / 100); }], ['Expected close', function (d) { return new Date(d.close).toISOString().slice(0, 10); }], ['Owner', function (d) { return d.owner; }], ['Contact', function (d) { return (C.contact(d.c) || {}).name || ''; }], ['Company', function (d) { return (C.company(d.co) || {}).name || ''; }], ['Priority', function (d) { return d.fields.priority || ''; }]].concat(C.fieldDefs('deal').filter(function (f) { return !f.sys; }).map(function (f) { return [f.label, function (d) { return C.fmtF(f, (d.cf || {})[f.key]); }]; })), list()); };
  var stockT = 0; C.bridge.onStock(function () { clearTimeout(stockT); stockT = setTimeout(function () { if (C.cur && C.cur.name === 'deals') { C.rerender(); C.toast('Stock updated from Stockroom', { icon: 'box' }); } }, 150); });
  function stockOf(sku) { var s = C.bridge.stock(); return s && s[sku] && typeof s[sku].available === 'number' ? s[sku].available : null; }
  function shortItems(d) { if (!C.bridge.stock()) return 0; return d.items.filter(function (i) { var a = stockOf(i.sku); return i.sku && a != null && a < i.qty; }).length; }

  // ===== board ================================================================
  function card(d) {
    var co = d.co && C.company(d.co), c = d.c && C.contact(d.c), p = C.dealProb(d), late = C.dealOpen(d) && d.close < Date.now(), sh = shortItems(d), n = d.items.filter(function (i) { return i.sku; }).length;
    var st = stages(d.pipe), idx = st.map(function (s) { return s.id; }).indexOf(d.stage), prev = st[idx - 1], next = st[idx + 1];
    if (next && next.lost) next = null; if (C.pstage(d.pipe, d.stage).lost) { prev = null; }
    return '<li class="kcard dcard" tabindex="0" data-deal="' + d.id + '" data-stage="' + d.stage + '" aria-label="' + esc(d.name + ', ' + C.rs(C.dealVal(d)) + ', ' + p + '% probability. Enter opens. Shift plus arrow keys move it.') + '">' +
      '<div class="k-top"><span class="k-n">' + esc(d.name.split(' — ').pop()) + '</span><b>' + C.rs(C.dealVal(d)) + '</b></div>' +
      '<div class="muted sm dc-who">' + (co ? C.logo(co.name, 14) + esc(co.name) : c ? C.avatar(c.name, 14) + esc(c.name) : '') + '</div>' +
      '<div class="dc-prob" aria-hidden="true"><i style="width:' + p + '%"></i></div>' +
      '<div class="kmeta"><span class="kgrip" aria-hidden="true" title="Drag to move">' + C.ic('grip', 14) + '</span>' + C.avatar(d.owner, 18) + '<span class="muted sm ' + (late ? 'late' : '') + '">' + C.ic('cal', 11) + ' ' + C.dshort(d.close) + '</span>' + (n ? '<span class="muted sm" title="' + n + ' Halden Supply items">' + C.ic('box', 11) + ' ' + n + '</span>' : '') + (sh ? '<span class="short" title="' + sh + ' items short in Stockroom">' + sh + ' short</span>' : '') + '<span class="grow"></span>' +
      (prev ? '<button type="button" class="kmv" data-act="dmove" data-id="' + d.id + '" data-to="' + prev.id + '" aria-label="Move back to ' + prev.label + '">' + C.ic('chev-l', 13) + '</button>' : '') +
      (next ? '<button type="button" class="kmv" data-act="dmove" data-id="' + d.id + '" data-to="' + next.id + '" aria-label="Move forward to ' + next.label + '">' + C.ic('chev-r', 13) + '</button>' : '') + '</div></li>';
  }
  function board() {
    var u = DS(), L = list();
    return stages(u.pipe).map(function (s) {
      var a = L.filter(function (d) { return d.stage === s.id; }).sort(function (x, y) { return x.close - y.close; }), g = gateOn(u.pipe, s.id);
      var v = a.reduce(function (t, d) { return t + C.dealVal(d); }, 0);
      return '<section class="kcol dcol" data-stage="' + s.id + '" aria-labelledby="dk-' + s.id + '"><header class="kh"><i class="kdot" style="background:' + s.color + '"></i><h2 id="dk-' + s.id + '">' + s.label + '</h2>' + (g ? '<span class="gate-ic" title="' + esc(C.gateText(g)) + '">' + C.ic('lock', 12) + '<span class="sr">' + esc(C.gateText(g)) + '</span></span>' : '') + '<span class="count-b">' + a.length + '</span><span class="kv-s">' + C.rs(v) + '</span></header>' +
        '<div class="kh2 muted sm">' + (s.won || s.lost ? (s.won ? 'Closed won' : 'Closed') : s.p + '% · weighted ' + C.rs(v * s.p / 100)) + '</div><div class="klock" aria-hidden="true">' + C.ic('lock', 14) + '<span></span></div>' +
        '<ul class="klist">' + a.map(card).join('') + (a.length ? '' : '<li class="kempty">Drop a deal here</li>') + '</ul></section>';
    }).join('');
  }
  function table() {
    var L = list().sort(function (a, b) { return a.close - b.close; });
    return '<section class="card flush"><div class="tablewrap"><table class="tbl dense"><thead><tr><th scope="col">Deal</th><th scope="col">Stage</th><th scope="col" class="num">Value</th><th scope="col" class="num">Prob.</th><th scope="col" class="num">Weighted</th><th scope="col">Close</th><th scope="col">Owner</th></tr></thead><tbody>' + L.map(function (d) {
      var s = C.pstage(d.pipe, d.stage), co = d.co && C.company(d.co), c = d.c && C.contact(d.c);
      return '<tr tabindex="0" data-href="#/deals/' + d.id + '"><td class="c-main"><a class="lname" href="#/deals/' + d.id + '">' + esc(d.name.split(' — ').pop()) + '</a><div class="muted sm">' + esc(co ? co.name : c ? c.name : '') + ' · <span class="mono">' + d.id + '</span></div></td><td><span class="pill"><i style="background:' + s.color + '"></i>' + s.label + '</span></td><td class="num">' + C.rs(C.dealVal(d)) + '</td><td class="num">' + C.dealProb(d) + '%</td><td class="num">' + C.rs(C.dealVal(d) * C.dealProb(d) / 100) + '</td><td class="nw ' + (C.dealOpen(d) && d.close < Date.now() ? 'late' : 'muted') + '">' + C.dshort(d.close) + '</td><td><span class="own">' + C.avatar(d.owner, 18) + esc(d.owner.split(' ')[0]) + '</span></td></tr>';
    }).join('') + '</tbody></table></div></section>';
  }
  function kpis() {
    var L = list(), open = L.filter(C.dealOpen), m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0);
    var won = L.filter(function (d) { return C.pstage(d.pipe, d.stage).won && (d.wonAt || 0) >= m0.getTime(); });
    var sum = function (a, w) { return a.reduce(function (s, d) { return s + C.dealVal(d) * (w ? C.dealProb(d) / 100 : 1); }, 0); };
    var closed = L.filter(function (d) { return !C.dealOpen(d); }), wr = closed.length ? closed.filter(function (d) { return C.pstage(d.pipe, d.stage).won; }).length / closed.length * 100 : 0;
    return '<div class="kpis"><div><span>Open pipeline</span><b>' + C.rs(sum(open)) + '</b><small>' + open.length + ' deals</small></div><div><span>Weighted forecast</span><b>' + C.rs(sum(open, true)) + '</b><small>value × probability</small></div><div><span>Won this month</span><b>' + C.rs(sum(won)) + '</b><small>' + won.length + ' deals</small></div><div><span>Win rate</span><b>' + Math.round(wr) + '%</b><small>of closed deals</small></div></div>';
  }
  V.deals = {
    title: function () { var d = C.cur && C.cur.arg && C.deal(C.cur.arg); return d ? d.name.split(' — ').pop() : 'Deals'; },
    render: function () { var d = C.cur.arg && C.deal(C.cur.arg); return d ? dealPage(d) : dealsList(); },
    mount: function () { if (!C.cur.arg && DS().view === 'board' && C.motion() && !C.noFx) gsap.from('.dcol', { opacity: 0, y: 14, duration: .45, stagger: .04, ease: 'power3.out', delay: .08, clearProps: 'all' }); }
  };
  function dealsList() {
    var u = DS(), stockOn = !!C.bridge.stock();
    return page('Deals', 'Two pipelines · drag cards between stages · locked stages explain what they need',
      '<div class="seg" role="group" aria-label="Pipeline">' + Object.keys(C.PIPES).map(function (k) { return '<button type="button" data-act="dpipe" data-v="' + k + '" aria-pressed="' + (u.pipe === k) + '">' + C.PIPES[k].label + ' <b class="muted">' + P().deals.filter(function (d) { return d.pipe === k && C.dealOpen(d); }).length + '</b></button>'; }).join('') + '</div>' +
      '<label class="sr" for="do">Owner</label><select id="do" class="sel" data-ch="downer"><option value="all">Everyone</option>' + C.TEAM.map(function (t) { return '<option' + (u.owner === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>' +
      '<div class="seg" role="group" aria-label="Layout"><button type="button" data-act="dview" data-v="board" aria-pressed="' + (u.view === 'board') + '">Board</button><button type="button" data-act="dview" data-v="table" aria-pressed="' + (u.view === 'table') + '">Table</button></div><button type="button" class="btn pri" data-act="deal-new">' + C.ic('plus', 14) + 'New deal</button>') +
      C.scopeNote() + dealFilters() + kpis() + (u.view === 'board' ? '<p class="hint kb-hint">Drag a card, or focus it and press <kbd>⇧</kbd> <kbd>←</kbd> <kbd>→</kbd>. ' + C.ic('lock', 12) + ' marks a stage gate. Stock: ' + (stockOn ? '<span class="ok-t">live from Stockroom</span>' : 'Stockroom not connected in this browser') + '.</p><div class="board dboard" id="dboard" role="region" aria-label="' + C.PIPES[u.pipe].label + ' pipeline board">' + board() + '</div>' : table()) + '<p class="sr" id="dlive" role="status" aria-live="polite"></p>';
  }
  C.acts.dpipe = function (el) { DS().pipe = el.dataset.v; C.rerender(true); var b = $('[data-act="dpipe"][data-v="' + el.dataset.v + '"]'); if (b) b.focus(); };
  C.acts.dview = function (el) { DS().view = el.dataset.v; C.rerender(true); var b = $('[data-act="dview"][data-v="' + el.dataset.v + '"]'); if (b) b.focus(); };
  C.chs.downer = function (el) { DS().owner = el.value; C.rerender(); };

  function snap() { var m = {}; $$('.dcard').forEach(function (c) { m[c.dataset.deal] = c.getBoundingClientRect(); }); return m; }
  function repaint(id, before, to) {
    var b = $('#dboard'); if (!b) { C.rerender(); return; } var sl = b.scrollLeft; b.innerHTML = board(); b.scrollLeft = sl;
    var k = $('.kpis'); if (k) k.outerHTML = kpis();
    if (!C.motion() || !before) return;
    $$('.dcard').forEach(function (c) {
      var r0 = before[c.dataset.deal]; if (!r0) return; var a = c.getBoundingClientRect(), dx = r0.left - a.left, dy = r0.top - a.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return; var moved = c.dataset.deal === id;
      gsap.fromTo(c, { x: dx, y: dy, scale: moved ? 1.03 : 1 }, { x: 0, y: 0, scale: 1, duration: moved ? .5 : .38, ease: moved ? 'expo.out' : 'power3.out', clearProps: 'transform' });
    });
    var col = $('.dcol[data-stage="' + to + '"] .kh'); if (col) gsap.fromTo(col, { backgroundColor: 'rgba(79,70,229,.14)' }, { backgroundColor: 'rgba(79,70,229,0)', duration: .9, clearProps: 'backgroundColor' });
  }
  function moveCard(id, to, o) {
    o = o || {}; var d = C.deal(id); if (!d || d.stage === to) return;
    if (!C.can('edit', d)) { C.deny('move deals owned by others'); repaint(id, null, d.stage); return; }
    var before = snap(); if (o.ghostRect) before[id] = o.ghostRect; var from = d.stage;
    var ok = C.moveDeal(d, to, { after: function () { repaint(id, null, to); C.toast(d.name.split(' — ').pop() + ' → ' + C.pstage(d.pipe, to).label, { icon: 'deal' }); } });
    if (!ok) return;
    repaint(id, before, to);
    var msg = d.name.split(' — ').pop() + ' moved to ' + C.pstage(d.pipe, to).label; var lv = $('#dlive'); if (lv) lv.textContent = msg;
    C.toast(msg + (C.pstage(d.pipe, to).won && d.pipe === 'sales' && d.items.some(function (i) { return i.sku; }) ? ' · sent to Stockroom' : ''), { icon: 'deal', undo: function () { C.moveDeal(d, from, { force: true, quiet: true }); repaint(id, snap(), from); } });
    if (o.focus) { var cd = $('.dcard[data-deal="' + id + '"]'); if (cd) cd.focus({ preventScroll: true }); }
  }
  C.acts.dmove = function (el) { moveCard(el.dataset.id, el.dataset.to); };
  function onBoard() { return C.cur && C.cur.name === 'deals' && !C.cur.arg; }
  document.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('.dcard'); if (!c || e.target.closest('button') || !onBoard()) return;
    if (Date.now() - (C._dragEnd || 0) < 300) return; C._opener = c; location.hash = '#/deals/' + c.dataset.deal;
  });
  document.addEventListener('keydown', function (e) {
    var c = e.target.closest && e.target.closest('.dcard'); if (!c || !onBoard() || e.target !== c) return;
    var st = stages(DS().pipe), si = st.map(function (s) { return s.id; }).indexOf(c.dataset.stage);
    if (e.key === 'Enter') { location.hash = '#/deals/' + c.dataset.deal; e.preventDefault(); return; }
    if (e.shiftKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { var to = st[si + (e.key === 'ArrowRight' ? 1 : -1)]; if (to) moveCard(c.dataset.deal, to.id, { focus: true }); e.preventDefault(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { var n = e.key === 'ArrowDown' ? c.nextElementSibling : c.previousElementSibling; if (n && n.classList.contains('dcard')) n.focus(); e.preventDefault(); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { for (var k = si + (e.key === 'ArrowRight' ? 1 : -1); k >= 0 && k < st.length; k += (e.key === 'ArrowRight' ? 1 : -1)) { var t = $('.dcol[data-stage="' + st[k].id + '"] .dcard'); if (t) { t.focus(); break; } } e.preventDefault(); }
  });
  // pointer drag with a ghost; columns that a gate would block show why while you hover them
  var drag = null, raf = 0;
  document.addEventListener('pointerdown', function (e) {
    if (!onBoard() || e.button !== 0) return; var cd = e.target.closest('.dcard'); if (!cd || e.target.closest('button,a')) return;
    if (e.pointerType === 'touch' && !e.target.closest('.kgrip')) return;
    drag = { id: cd.dataset.deal, card: cd, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, on: false };
  });
  function begin() {
    var r = drag.card.getBoundingClientRect(), g = drag.card.cloneNode(true), d = C.deal(drag.id);
    g.className = 'kcard dcard ghost'; g.removeAttribute('tabindex'); g.removeAttribute('data-deal'); g.style.cssText = 'position:fixed;left:0;top:0;width:' + r.width + 'px;z-index:400;pointer-events:none';
    document.body.appendChild(g); drag.g = g; drag.ox = drag.sx - r.left; drag.oy = drag.sy - r.top; drag.r = r; drag.on = true;
    drag.card.classList.add('lifted'); document.body.classList.add('dragging');
    $$('.dcol').forEach(function (col) { var gt = C.gateFor(d, col.dataset.stage); col.classList.toggle('gated', !!gt); if (gt) col.querySelector('.klock span').textContent = 'Needs ' + C.DFIELDS[gt.field].label.toLowerCase(); });
    pos(); (function loop() { if (!drag || !drag.on) return; var b = $('#dboard'), br = b.getBoundingClientRect(); if (drag.x > br.right - 70) b.scrollLeft += 14; else if (drag.x < br.left + 70) b.scrollLeft -= 14; over(); raf = requestAnimationFrame(loop); })();
  }
  function pos() { drag.g.style.transform = 'translate(' + (drag.x - drag.ox) + 'px,' + (drag.y - drag.oy) + 'px) rotate(1.2deg) scale(1.02)'; }
  function over() { var tg = null; $$('.dcol').forEach(function (c) { var r = c.getBoundingClientRect(), on = drag.x >= r.left && drag.x <= r.right && drag.y >= r.top - 40 && drag.y <= r.bottom; c.classList.toggle('over', on); if (on) tg = c; }); drag.col = tg; }
  document.addEventListener('pointermove', function (e) { if (!drag) return; drag.x = e.clientX; drag.y = e.clientY; if (!drag.on) { if (Math.hypot(drag.x - drag.sx, drag.y - drag.sy) < 6) return; begin(); } pos(); over(); });
  function end(cancel) {
    if (!drag) return; var d = drag; drag = null; cancelAnimationFrame(raf); if (!d.on) return;
    C._dragEnd = Date.now(); document.body.classList.remove('dragging'); $$('.dcol').forEach(function (c) { c.classList.remove('over', 'gated'); });
    var gr = d.g.getBoundingClientRect(), to = !cancel && d.col && d.col.dataset.stage;
    d.card.classList.remove('lifted');
    if (to && to !== d.card.dataset.stage) { d.g.remove(); moveCard(d.id, to, { ghostRect: gr }); return; }
    if (C.motion()) { d.g.style.transition = 'transform .3s cubic-bezier(.2,.8,.2,1)'; d.g.style.transform = 'translate(' + d.r.left + 'px,' + d.r.top + 'px)'; setTimeout(function () { d.g.remove(); }, 300); } else d.g.remove();
  }
  document.addEventListener('pointerup', function (e) { if (drag && drag.on) { drag.x = e.clientX; drag.y = e.clientY; over(); } end(false); });
  document.addEventListener('pointercancel', function () { end(true); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drag && drag.on) end(true); });

  C.acts['deal-new'] = function (el) {
    var u = DS(), from = el && el.dataset && el.dataset.from ? el.dataset.from.split(':') : null, fc = from && from[0] === 'contact' ? from[1] : null, fco = from && from[0] === 'company' ? from[1] : null;
    var pool = P().contacts.filter(function (c) { return C.visible(c) && (!fco || c.co === fco); }).sort(function (a, b) { return a.name < b.name ? -1 : 1; });
    if (fco && !pool.length) pool = P().contacts.filter(C.visible);
    C.dialog('New deal', '<div class="field"><label for="nd-n">Deal name</label><input id="nd-n" name="name" required autocomplete="off" placeholder="e.g. Bluepeak Offices — reception refresh"></div>' +
      '<div class="row2"><div class="field"><label for="nd-p">Pipeline</label><select id="nd-p" name="pipe">' + Object.keys(C.PIPES).map(function (k) { return '<option value="' + k + '"' + (u.pipe === k ? ' selected' : '') + '>' + C.PIPES[k].label + '</option>'; }).join('') + '</select></div><div class="field"><label for="nd-c">Contact</label><select id="nd-c" name="c">' + pool.map(function (c) { return '<option value="' + c.id + '"' + (c.id === fc ? ' selected' : '') + '>' + esc(c.name) + (c.co ? ' · ' + esc((C.company(c.co) || {}).name || '') : '') + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="row2"><div class="field"><label for="nd-v">Value (₹)</label><input id="nd-v" name="v" type="number" min="0" step="1000" value="500000"></div><div class="field"><label for="nd-d">Expected close</label><input id="nd-d" name="close" type="date" value="' + new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10) + '"></div></div>', 'Create deal', function (fd) {
        var name = (fd.get('name') || '').trim(); if (!name) return false;
        var pipe = fd.get('pipe'), c = C.contact(fd.get('c')), d = { id: C.nextId(P().deals, 'D-', 2040), name: name, pipe: pipe, stage: stages(pipe)[0].id, items: [], amount: +fd.get('v') || 0, close: new Date(fd.get('close') + 'T12:00').getTime() || Date.now() + 30 * 864e5, owner: C.me().name, c: c ? c.id : null, co: fco || (c ? c.co : null), leadId: c ? c.leadId : null, created: Date.now(), moved: Date.now(), wonAt: null, fields: { priority: 'Normal' }, prob: null, cf: {} };
        C.audit('create', C.refOf('deal', d));
        if (pipe === 'sales') { d.items.push({ sku: null, name: 'Design and execution', qty: 1, price: d.amount }); }
        P().deals.unshift(d); C.pact('system', 'Deal created in ' + C.PIPES[pipe].label, { c: d.c, co: d.co, d: d.id }, d.owner); C.save();
        C.fire('deal.stage', { t: 'deal', rec: d }, { stage: d.stage }); location.hash = '#/deals/' + d.id;
      });
  };

  // ===== deal page ============================================================
  function stepper(d) {
    var st = stages(d.pipe), cur = st.map(function (s) { return s.id; }).indexOf(d.stage), lost = C.pstage(d.pipe, d.stage).lost;
    return '<div class="steps dsteps" style="--n:' + st.filter(function (s) { return !s.lost; }).length + '" role="group" aria-label="Stage">' + st.filter(function (s) { return !s.lost; }).map(function (s, i) {
      var g = C.gateFor(d, s.id), cls = lost ? '' : i < cur ? ' done' : i === cur ? ' now' : '';
      return '<button type="button" class="stp' + cls + (g ? ' locked' : '') + '" data-act="dstage" data-to="' + s.id + '" aria-pressed="' + (d.stage === s.id) + '"' + (g ? ' title="' + esc(C.gateText(g)) + '"' : '') + '><i></i><span>' + (g ? C.ic('lock', 11) : '') + s.label + '</span>' + (g ? '<span class="sr"> — locked: ' + esc(C.gateText(g)) + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }
  C.acts.dstage = function (el) {
    var d = C.deal(C.cur.arg), to = el.dataset.to, from = d.stage;
    if (!C.can('edit', d)) { C.deny('move deals owned by others'); return; }
    if (C.moveDeal(d, to, { after: function () { C.rerender(); } })) { C.rerender(); C.toast(d.name.split(' — ').pop() + ' → ' + C.pstage(d.pipe, to).label, { icon: 'flag', undo: function () { C.moveDeal(d, from, { force: true, quiet: true }); C.rerender(); } }); }
  };
  C.acts['deal-lost'] = function () {
    var d = C.deal(C.cur.arg), lostSt = stages(d.pipe).filter(function (s) { return s.lost; })[0];
    C.dialog('Close as ' + lostSt.label.toLowerCase(), '<div class="field"><label for="dl-r">Reason</label><select id="dl-r" name="r"><option>Budget mismatch</option><option>Went with another vendor</option><option>Project postponed</option><option>No response</option><option>Other</option></select></div>', 'Mark as ' + lostSt.label.toLowerCase(), function (fd) {
      C.moveDeal(d, lostSt.id, {}); C.pact('note', 'Closed as ' + lostSt.label.toLowerCase() + ': ' + fd.get('r'), { c: d.c, co: d.co, d: d.id }, d.owner); C.save(); setTimeout(C.rerender, 20);
    });
  };
  C.acts['deal-reopen'] = function () { var d = C.deal(C.cur.arg); C.moveDeal(d, stages(d.pipe)[0].id, { force: true }); C.rerender(); };

  C.chs.dfield = function (el) {
    var d = C.deal(C.cur.arg), f = el.dataset.f, v = C.DFIELDS[f].kind === 'money' ? (+el.value || 0) : el.value;
    d.fields[f] = v; C.pact('note', C.DFIELDS[f].label + ' set to ' + (C.DFIELDS[f].kind === 'money' ? C.inr(v) : v || '—'), { c: d.c, co: d.co, d: d.id }, d.owner); C.save(); C.rerender(); C.toast(C.DFIELDS[f].label + ' saved');
    var x = $('#df-' + f); if (x) x.focus();
  };
  C.chs.dprob = function (el) { var d = C.deal(C.cur.arg); d.prob = el.value === '' ? null : Math.max(0, Math.min(100, +el.value)); C.save(); C.rerender(); var x = $('#dp-prob'); if (x) x.focus(); };
  C.chs.dclose = function (el) { var d = C.deal(C.cur.arg), t = new Date(el.value + 'T12:00').getTime(); if (!t) return; d.close = t; C.pact('note', 'Expected close moved to ' + C.dfull(t), { c: d.c, co: d.co, d: d.id }, d.owner); C.save(); C.rerender(); };
  C.chs.damount = function (el) { var d = C.deal(C.cur.arg); d.amount = +el.value || 0; C.save(); C.rerender(); };

  function lineItems(d) {
    var stock = C.bridge.stock(), sub = C.dealVal(d), gst = Math.round(sub * .18), cats = {};
    var wonSent = C.pstage(d.pipe, d.stage).won && C.bridge.wonDeals().some(function (x) { return x && x.id === d.id; }), ord = wonSent ? C.bridge.order(d.id) : null;
    var resOf = function (sku) { var l = ord && (ord.lines || []).filter(function (x) { return x.sku === sku; })[0]; return l ? l : null; };
    C.HALDEN.forEach(function (s) { (cats[s.cat] = cats[s.cat] || []).push(s); });
    if (d.pipe !== 'sales') return '<section class="card li"><div class="card-h"><div><h2>Value</h2><p class="sub">Partnerships track expected annual referral value, without line items</p></div></div><div class="field li-amt"><label for="dp-amt">Expected annual value (₹)</label><input id="dp-amt" class="inp" type="number" min="0" step="10000" value="' + (d.amount || 0) + '" data-ch="damount"></div></section>';
    return '<section class="card li flush"><div class="card-h pad"><div><h2>Line items</h2><p class="sub">Halden Supply catalogue · ' + (wonSent ? '<span class="ok-t">' + C.ic('box', 12) + (ord ? ' Stockroom order <span class="mono">' + esc(ord.so) + '</span> · ' + esc(ord.status) : ' sent to Stockroom') + '</span>' : stock ? '<span class="ok-t">' + C.ic('box', 12) + ' stock live from Stockroom</span>' : C.ic('box', 12) + ' Stockroom not connected — stock shows once Stockroom is open in this browser') + '</p></div></div>' +
      '<div class="tablewrap"><table class="tbl dense litbl"><thead><tr><th scope="col">Item</th><th scope="col">Stock</th><th scope="col" class="num">Qty</th><th scope="col" class="num">Unit</th><th scope="col" class="num">Total</th><th scope="col"><span class="sr">Remove</span></th></tr></thead><tbody>' +
      (d.items.length ? d.items.map(function (it, i) {
        var a = it.sku ? stockOf(it.sku) : null, rl = it.sku && wonSent ? resOf(it.sku) : null, chip = !it.sku ? '<span class="muted sm">Service</span>' :
          wonSent ? (!ord ? '<span class="stk none">Sent to Stockroom</span>' : !rl ? '<span class="stk none">' + (ord.status === 'cancelled' ? 'Order cancelled' : 'Not on order') + '</span>' : (function () {
            var sh = +rl.shipped || 0, r = +rl.res || 0, q = +rl.qty || it.qty, short = Math.max(0, q - r - sh);
            if (sh >= q) return '<span class="stk ok">Dispatched</span>';
            if (!short) return '<span class="stk ok">' + (sh ? sh + ' shipped · ' + r + ' reserved' : 'Reserved ' + r) + '</span>';
            if (r || sh) return '<span class="stk warn">' + (sh ? sh + ' shipped · ' : '') + (r ? 'Reserved ' + r + ' · ' : '') + short + ' backordered</span>';
            return ord.status === 'cancelled' ? '<span class="stk none">Order cancelled</span>' : '<span class="stk bad">Backordered</span>';
          })()) :
          !stock ? '<span class="muted sm">—</span>' : a == null ? '<span class="stk none">Not listed</span>' : a >= it.qty ? '<span class="stk ok">' + a + ' available</span>' : '<span class="stk bad">Short by ' + (it.qty - a) + '</span>';
        return '<tr><td>' + (it.sku ? '<span class="idc">' + it.sku + '</span> ' : '') + esc(it.name) + '</td><td>' + chip + '</td><td class="num"><label class="sr" for="li-q' + i + '">Quantity of ' + esc(it.name) + '</label><input id="li-q' + i + '" class="inp qty" type="number" min="1" max="999" value="' + it.qty + '" data-ch="li-qty" data-i="' + i + '"></td><td class="num">' + C.inr(it.price) + '</td><td class="num"><b>' + C.inr(it.qty * it.price) + '</b></td><td><button type="button" class="ibtn" data-act="li-del" data-i="' + i + '" aria-label="Remove ' + esc(it.name) + '">' + C.ic('trash', 14) + '</button></td></tr>';
      }).join('') : '<tr><td colspan="6" class="empty">No items yet. Add products from the catalogue below.</td></tr>') +
      '</tbody><tfoot><tr><td colspan="4" class="num muted">Subtotal</td><td class="num">' + C.inr(sub) + '</td><td></td></tr><tr><td colspan="4" class="num muted">GST 18%</td><td class="num">' + C.inr(gst) + '</td><td></td></tr><tr class="tot"><td colspan="4" class="num">Total</td><td class="num">' + C.inr(sub + gst) + '</td><td></td></tr></tfoot></table></div>' +
      '<form class="li-add" data-form="li-add"><label class="sr" for="li-s">Product</label><select id="li-s" name="sku" class="sel">' + Object.keys(cats).map(function (k) { return '<optgroup label="' + k + '">' + cats[k].map(function (s) { var a = stock && stock[s.sku] ? ' · ' + stock[s.sku].available + ' in stock' : ''; return '<option value="' + s.sku + '">' + s.sku + ' · ' + esc(s.name) + ' · ' + C.inr(s.price) + a + '</option>'; }).join('') + '</optgroup>'; }).join('') + '<option value="svc">Custom service line…</option></select><label class="sr" for="li-n">Quantity</label><input id="li-n" name="qty" class="inp qty" type="number" min="1" max="999" value="1"><button class="btn">' + C.ic('plus', 13) + 'Add item</button></form></section>';
  }
  C.chs['li-qty'] = function (el) { var d = C.deal(C.cur.arg), it = d.items[+el.dataset.i]; it.qty = Math.max(1, Math.min(999, Math.round(+el.value || 1))); C.save(); sync(d); C.rerender(); var x = $('#li-q' + el.dataset.i); if (x) x.focus(); };
  C.acts['li-del'] = function (el) { var d = C.deal(C.cur.arg), it = d.items.splice(+el.dataset.i, 1)[0]; C.pact('note', 'Removed line item: ' + it.name, { c: d.c, co: d.co, d: d.id }, d.owner); C.save(); sync(d); C.rerender(); C.toast('Removed ' + it.name, { icon: 'trash', undo: function () { d.items.splice(+el.dataset.i, 0, it); C.save(); sync(d); C.rerender(); } }); };
  C.forms['li-add'] = function (f) {
    var d = C.deal(C.cur.arg), sku = f.elements.sku.value, q = Math.max(1, Math.round(+f.elements.qty.value || 1));
    if (sku === 'svc') {
      C.dialog('Add a service line', '<div class="field"><label for="sv-n">Description</label><input id="sv-n" name="n" required autocomplete="off" placeholder="e.g. False ceiling and electricals"></div><div class="field"><label for="sv-p">Price (₹)</label><input id="sv-p" name="p" type="number" min="1000" step="1000" required></div>', 'Add line', function (fd) { d.items.push({ sku: null, name: fd.get('n').trim(), qty: 1, price: +fd.get('p') }); C.save(); sync(d); setTimeout(C.rerender, 20); });
      return;
    }
    var s = C.sku(sku), ex = d.items.filter(function (i) { return i.sku === sku; })[0];
    if (ex) ex.qty += q; else d.items.push({ sku: sku, name: s.name, qty: q, price: s.price });
    C.pact('note', 'Added ' + q + ' × ' + s.name + ' (' + sku + ')', { c: d.c, co: d.co, d: d.id }, d.owner); C.save(); sync(d); C.rerender(); C.toast('Added ' + q + ' × ' + s.name, { icon: 'box' }); var x = $('#li-s'); if (x) { x.value = sku; x.focus(); }
  };
  function sync(d) { if (C.pstage(d.pipe, d.stage).won && d.pipe === 'sales') C.bridgeWon(d); }

  function dealPage(d) {
    if (!C.visible(d)) return C.noAccess('deal');
    C.recKeyReset('deal:' + d.id);
    var s = C.pstage(d.pipe, d.stage), co = d.co && C.company(d.co), c = d.c && C.contact(d.c), v = C.dealVal(d), p = C.dealProb(d);
    var bridged = C.bridge.wonDeals().filter(function (x) { return x && x.id === d.id; })[0];
    var runs = P().runs.filter(function (r) { return r.rec.t === 'deal' && r.rec.id === d.id; }).slice(0, 5);
    var flds = d.pipe === 'sales' ? ['visitOutcome', 'advance', 'priority', 'handover'] : ['pilotReview', 'priority'];
    var banner = s.won ? '<div class="banner ok">' + C.ic('check', 16) + '<div><b>' + (d.pipe === 'sales' ? 'Won · handed to Stockroom' : 'Active partner') + '</b><span>' + (d.pipe === 'sales' ? (bridged ? (function () { var o = C.bridge.order(d.id), n = bridged.items.reduce(function (t, i) { return t + i.qty; }, 0); if (!o) return 'Sent ' + n + ' units across ' + bridged.items.length + ' SKUs to Stockroom via <span class="mono">demo-bridge:won-deals</span>. Open Stockroom to see the order “from Lumen CRM”.'; var sh = (o.lines || []).reduce(function (t, l) { return t + (+l.shipped || 0); }, 0), r = (o.lines || []).reduce(function (t, l) { return t + Math.min(+l.res || 0, l.qty - (+l.shipped || 0)); }, 0), bo = Math.max(0, n - r - sh); return 'Stockroom ' + ((o.orders || []).length > 1 ? 'orders <span class="mono">' + o.orders.map(esc).join(', ') + '</span>' : 'order <span class="mono">' + esc(o.so) + '</span>') + ' · ' + esc(o.status) + ': ' + (sh ? sh + ' shipped, ' : '') + r + ' reserved' + (bo ? ', ' + bo + ' backordered' : '') + ' of ' + n + ' units.'; })() : 'No Halden Supply items on this deal, so nothing to reserve.') : 'Signed ' + C.dfull(d.wonAt || Date.now())) + '</span></div><button type="button" class="btn sm ghost" data-act="deal-reopen">Re-open</button></div>'
      : s.lost ? '<div class="banner">' + C.ic('x', 16) + '<div><b>Closed · ' + s.label + '</b><span>Kept for reporting.</span></div><button type="button" class="btn sm ghost" data-act="deal-reopen">Re-open</button></div>' : '';
    var nextGate = stages(d.pipe).map(function (x) { return C.gateFor(d, x.id); }).filter(Boolean)[0];
    return C.recBack('#/deals', 'Deals') +
      '<header class="rec-h"><div class="rec-id"><span class="deal-ic">' + C.ic('deal', 20) + '</span><div><h1>' + esc(d.name.split(' — ').pop()) + '</h1><p class="muted">' + (co ? '<a href="#/companies/' + co.id + '">' + esc(co.name) + '</a> · ' : '') + (c ? '<a href="#/contacts/' + c.id + '">' + esc(c.name) + '</a> · ' : '') + C.PIPES[d.pipe].label + ' pipeline ' + C.idChip(d.id) + '</p></div></div>' +
      '<div class="deal-num"><b>' + C.rs(v) + '</b><span>' + p + '% · weighted ' + C.rs(v * p / 100) + '</span></div></header>' +
      '<div class="deal-act">' + C.recActions('deal', d.id) + (d.pipe === 'sales' && d.items.length ? '<button type="button" class="btn sm pri" data-act="quote-new" data-id="' + d.id + '">' + C.ic('quote', 14) + 'Create quote</button>' : '') + '</div>' +
      stepper(d) + '<div class="dr-sub">' + (C.dealOpen(d) ? '<button type="button" class="lnk" data-act="deal-lost">Close as ' + stages(d.pipe).filter(function (x) { return x.lost; })[0].label.toLowerCase() + '</button>' + (nextGate ? '<span class="gate-note">' + C.ic('lock', 12) + esc(C.gateText(nextGate)) + ' — fill it in under Fields, or click the stage.</span>' : '') : '') + '</div>' + banner +
      '<div class="rec">' +
      '<aside class="rec-attrs card"><h2 class="rbox-h">Deal</h2><dl class="props"><div class="prop"><dt>Pipeline</dt><dd><span class="pv ro">' + C.PIPES[d.pipe].label + '</span></dd></div><div class="prop"><dt>Stage</dt><dd><span class="pv ro"><span class="pill"><i style="background:' + s.color + '"></i>' + s.label + '</span></span></dd></div>' +
      '<div class="prop"><dt><label for="dp-prob">Probability</label></dt><dd><span class="pv ro"><input id="dp-prob" class="inp sm w70" type="number" min="0" max="100" value="' + (d.prob != null ? d.prob : '') + '" placeholder="' + s.p + '" data-ch="dprob"' + (C.can('edit', d) ? '' : ' disabled') + '> <span class="muted sm">%' + (d.prob == null ? ' · from stage' : ' · override') + '</span></span></dd></div>' +
      '<div class="prop"><dt>Created</dt><dd><span class="pv ro">' + C.dfull(d.created) + '</span></dd></div>' + (d.leadId ? '<div class="prop"><dt>From lead</dt><dd><a class="pv ro mono" href="#/deals/' + d.leadId + '">' + d.leadId + '</a></dd></div>' : '') + '</dl>' +
      C.propPanel('deal', d) + '</aside>' +
      '<section class="rec-main">' + lineItems(d) + C.recCenter('deal', d.id, { d: d.id, lead: d.leadId }, true) + '</section>' +
      '<aside class="rec-side">' + C.assocBox('deal', d.id, 'contact') + C.assocBox('deal', d.id, 'company') + C.recTasks({ t: 'deal', id: d.id }) + C.recEvents('deal', d.id) + C.recQuotes([d.id]) + C.recTickets('deal:' + d.id, function (t) { return t.d === d.id; }) + C.recFiles({ t: 'deal', id: d.id }, { d: d.id }) +
      '<section class="rbox"><h2 class="rbox-h">' + C.ic('bolt', 14) + 'Automation runs</h2>' + (runs.length ? '<ul class="mlist runs">' + runs.map(function (r) { var w = P().wf.filter(function (x) { return x.id === r.wf; })[0]; return '<li class="' + (r.skip ? 'skipped' : 'ok') + '"><a href="#/workflows/' + r.wf + '">' + esc(w ? w.name : r.wf) + '</a><span class="muted sm">' + (r.skip ? 'Skipped' : r.steps.length + ' steps') + ' · ' + C.rel(r.t) + '</span></li>'; }).join('') + '</ul>' : '<p class="empty sm">No workflow has run on this deal yet.</p>') + '</section></aside></div>';
  }
})();
