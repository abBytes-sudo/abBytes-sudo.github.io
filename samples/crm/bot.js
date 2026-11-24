/* Lumen CRM — chatbot manager: node-canvas flow editor, live test chat, transcripts */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$, S = C.S;
  var TYPES = { question: 'Question', answer: 'Answer (ends chat)', lead: 'Capture lead', handoff: 'Hand off to agent' };
  var NICON = { question: 'sms', answer: 'check', lead: 'user', handoff: 'phone' };
  var OUT = { resolved: ['Resolved by bot', 'ok'], lead: ['Lead captured', 'acc'], handoff: ['Handed to agent', 'warn'] };
  var outPill = function (o) { return '<span class="tag-p ' + OUT[o][1] + '">' + OUT[o][0] + '</span>'; };
  var short = function (s, n) { s = String(s || ''); return s.length > (n || 46) ? s.slice(0, (n || 46) - 1) + '…' : s; };
  var flow = function () { return S().bot; };
  var tab = function () { return C.ui.botTab || 'flow'; };
  var side = function () { return C.ui.botSide || 'edit'; };
  var NW = 252, HC = 19;

  function stats() {
    var T = S().transcripts, n = T.length, h = T.filter(function (t) { return t.outcome !== 'handoff'; }).length;
    return { n: n, h: h, pct: n ? Math.round(h / n * 100) : 0, leads: T.filter(function (t) { return t.outcome === 'lead'; }).length, hand: T.filter(function (t) { return t.outcome === 'handoff'; }).length };
  }
  function estH(n) { return 92 + (n.type === 'question' ? (n.options || []).length * 31 + 6 : 0); }
  function layout(f) {
    f.pos = f.pos || {}; var depth = {}, q = [f.start], ids = Object.keys(f.nodes), maxd = 0;
    depth[f.start] = 0;
    while (q.length) { var id = q.shift(), n = f.nodes[id]; if (n.type === 'question') (n.options || []).forEach(function (o) { if (o.next && f.nodes[o.next] && depth[o.next] === undefined) { depth[o.next] = depth[id] + 1; maxd = Math.max(maxd, depth[o.next]); q.push(o.next); } }); }
    ids.forEach(function (id) { if (depth[id] === undefined) depth[id] = maxd + 1; });
    var cols = {}; ids.forEach(function (id) { (cols[depth[id]] = cols[depth[id]] || []).push(id); });
    Object.keys(cols).forEach(function (d) {
      var y = 0; cols[d].forEach(function (id) { if (!f.pos[id]) f.pos[id] = { x: 30 + d * 304, y: 30 + y }; y += estH(f.nodes[id]) + 30; });
    });
  }

  C.views.bot = {
    title: function () { return 'Chatbot manager'; },
    render: function () {
      var st = stats(), t = tab();
      C.chartSpecs.ring = function () { return C.chart.donut({ size: 84, sw: 10, items: [{ label: 'Handled without an agent', value: st.h, color: '#2B59FF' }, { label: 'Handed to an agent', value: st.hand, color: '#DDE1EA' }], center: '', label: st.pct + ' percent of chats handled without an agent' }); };
      var tabs = [['flow', 'Flow & test'], ['log', 'Transcripts']].map(function (x) {
        return '<button type="button" role="tab" id="tab-' + x[0] + '" aria-controls="panel" aria-selected="' + (t === x[0]) + '" tabindex="' + (t === x[0] ? 0 : -1) + '" data-act="tab" data-k="botTab" data-v="' + x[0] + '">' + x[1] + '</button>';
      }).join('');
      return C.page('Chatbot manager', 'A scripted, rule-based assistant that answers common questions and captures leads before an agent is needed', '<button type="button" class="btn" data-act="bot-reset">' + C.ic('refresh', 14) + 'Reset flow</button>') +
        '<section class="botstats" aria-label="Chatbot results"><div class="kpi hero"><div class="ringw"><div class="chart ring" data-chart="ring"></div><span class="ring-c" data-count="' + st.pct + '" data-f="pct">' + st.pct + '%</span></div><div><div class="kl">Handled without an agent</div><div class="kv sm"><span data-count="' + st.h + '" data-f="int">' + st.h + '</span><small> of ' + st.n + ' chats</small></div><div class="ks">Resolved by the bot or turned into a lead</div></div></div>' +
        '<div class="kpi"><div class="kl">Chats this month</div><div class="kv"><span data-count="' + st.n + '" data-f="int">' + st.n + '</span></div><div class="ks">Includes your test chats</div></div>' +
        '<div class="kpi"><div class="kl">Leads captured</div><div class="kv"><span data-count="' + st.leads + '" data-f="int">' + st.leads + '</span></div><div class="ks">Auto-added to the inbox</div></div>' +
        '<div class="kpi"><div class="kl">Handed to an agent</div><div class="kv"><span data-count="' + st.hand + '" data-f="int">' + st.hand + '</span></div><div class="ks">Avg. wait 1m 40s</div></div></section>' +
        '<div class="tabs" role="tablist" aria-label="Chatbot sections">' + tabs + '</div>' +
        '<div id="panel" role="tabpanel" aria-labelledby="tab-' + t + '">' + (t === 'flow' ? flowPanel() : logPanel()) + '</div>';
    },
    mount: function () { if (tab() === 'flow') mountCanvas(); }
  };
  C.acts['bot-reset'] = function () { var f = C.flowSeed(); S().bot = f; C.ui.botNode = null; C.ui.test = null; C.ui.cv = null; C.save(); C.toast('Flow reset to the default script', { icon: 'refresh' }); C.rerender(); };

  // ---------- canvas ---------------------------------------------------------
  var VIEW = function () { return C.ui.cv || (C.ui.cv = { x: 20, y: 20, k: 1, fresh: true }); };
  function selNode() { var f = flow(); return (C.ui.botNode && f.nodes[C.ui.botNode]) ? C.ui.botNode : f.start; }
  function trail() { var T = C.ui.test; return side() === 'test' && T ? T : null; }
  function nodeHTML(id) {
    var f = flow(), n = f.nodes[id], p = f.pos[id], T = trail(), cls = 'cn t-' + n.type + (id === selNode() ? ' sel' : '') + (T && T.trail.some(function (x) { return x.id === id; }) ? ' walk' : '') + (T && T.id === id ? ' live' : '');
    return '<div class="' + cls + '" data-id="' + id + '" tabindex="0" role="button" aria-label="' + TYPES[n.type] + ' node: ' + esc(short(n.text, 70)) + (id === f.start ? ' (start)' : '') + '. Press Enter to edit, arrow keys to move." style="left:' + p.x + 'px;top:' + p.y + 'px;width:' + NW + 'px"><i class="cn-in" aria-hidden="true"></i>' +
      '<header class="cn-h"><span class="cn-t">' + C.ic(NICON[n.type], 13) + TYPES[n.type].split(' ')[0] + '</span>' + (id === f.start ? '<em>Start</em>' : '') + '</header><p class="cn-m">' + esc(short(n.text, 104)) + '</p>' +
      (n.type === 'question' ? '<ul class="cn-o">' + (n.options || []).map(function (o, i) { return '<li data-i="' + i + '"><span>' + esc(short(o.label, 26)) + '</span><i class="cn-port' + (o.next ? ' on' : '') + '" data-port="' + i + '" title="Drag to another node to connect"></i></li>'; }).join('') + '</ul>' : '') + '</div>';
  }
  function portPos(id, i) {
    var f = flow(), p = f.pos[id], li = $('.cn[data-id="' + id + '"] .cn-o li[data-i="' + i + '"]');
    return { x: p.x + NW, y: p.y + (li ? li.offsetTop + li.offsetHeight / 2 : 90 + i * 31) };
  }
  function curve(a, b) { var dx = Math.max(56, Math.abs(b.x - a.x) * .5); return 'M' + a.x + ',' + a.y + ' C' + (a.x + dx) + ',' + a.y + ' ' + (b.x - dx) + ',' + b.y + ' ' + b.x + ',' + b.y; }
  function nodeRects() {
    var f = flow(), r = {};
    Object.keys(f.nodes).forEach(function (id) { var el = $('.cn[data-id="' + id + '"]'), p = f.pos[id]; r[id] = { x: p.x, y: p.y, w: NW, h: el ? el.offsetHeight : estH(f.nodes[id]) }; });
    return r;
  }
  function hits(a, b, rects, skip) {
    var dx = Math.max(56, Math.abs(b.x - a.x) * .5), t, id;
    for (t = .03; t < 1; t += .03) {
      var u = 1 - t, x = u * u * u * a.x + 3 * u * u * t * (a.x + dx) + 3 * u * t * t * (b.x - dx) + t * t * t * b.x, y = u * u * u * a.y + 3 * u * u * t * a.y + 3 * u * t * t * b.y + t * t * t * b.y;
      for (id in rects) { if (skip.indexOf(id) > -1) continue; var r = rects[id]; if (x > r.x - 6 && x < r.x + r.w + 6 && y > r.y - 6 && y < r.y + r.h + 6) return true; }
    }
    return false;
  }
  function rounded(pts, rad) {
    var d = 'M' + pts[0].x + ',' + pts[0].y, i;
    for (i = 1; i < pts.length - 1; i++) {
      var p = pts[i], a = pts[i - 1], b = pts[i + 1], l1 = Math.hypot(p.x - a.x, p.y - a.y), l2 = Math.hypot(b.x - p.x, b.y - p.y), r = Math.min(rad, l1 / 2, l2 / 2);
      d += ' L' + (p.x + (a.x - p.x) / l1 * r).toFixed(1) + ',' + (p.y + (a.y - p.y) / l1 * r).toFixed(1) + ' Q' + p.x + ',' + p.y + ' ' + (p.x + (b.x - p.x) / l2 * r).toFixed(1) + ',' + (p.y + (b.y - p.y) / l2 * r).toFixed(1);
    }
    return d + ' L' + pts[pts.length - 1].x + ',' + pts[pts.length - 1].y;
  }
  function route(a, b, rects, skip, k) {
    if (b.x - a.x > 30 && !hits(a, b, rects, skip)) return curve(a, b);
    var top = 1e9, bot = -1e9, id; for (id in rects) { top = Math.min(top, rects[id].y); bot = Math.max(bot, rects[id].y + rects[id].h); }
    var off = 26 + (k % 6) * 9, above = (a.y + b.y) / 2 < (top + bot) / 2, ly = above ? top - off : bot + off;
    return rounded([a, { x: a.x + 22, y: a.y }, { x: a.x + 22, y: ly }, { x: b.x - 22, y: ly }, { x: b.x - 22, y: b.y }, b], 12);
  }
  function edgesHTML(anim) {
    var rects = nodeRects(), ek = 0;
    var f = flow(), sel = selNode(), T = trail(), out = '<defs><marker id="ar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0.8 7.2 4 0 7.2z" fill="#A9AFBD"/></marker><marker id="ar-on" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0.8 7.2 4 0 7.2z" fill="#2B59FF"/></marker></defs>';
    Object.keys(f.nodes).forEach(function (id) {
      var n = f.nodes[id]; if (n.type !== 'question') return;
      (n.options || []).forEach(function (o, i) {
        if (!o.next || !f.nodes[o.next]) return;
        var a = portPos(id, i), tp = f.pos[o.next], b = { x: tp.x - 3, y: tp.y + HC };
        var walk = T && T.trail.some(function (x) { return x.id === id && x.i === i; }), on = walk || id === sel || o.next === sel;
        out += '<path class="ed' + (on ? ' on' : '') + (walk ? ' walk' : '') + '"' + (anim ? ' pathLength="1"' : '') + ' d="' + route(a, b, rects, [id, o.next], ek++) + '" marker-end="url(#' + (on ? 'ar-on' : 'ar') + ')"/>';
      });
    });
    return out;
  }
  function paintNodes(anim) {
    var w = $('#cv-world'); if (!w) return;
    $$('.cn', w).forEach(function (n) { n.remove(); });
    w.insertAdjacentHTML('beforeend', Object.keys(flow().nodes).map(nodeHTML).join(''));
    paintEdges(anim);
  }
  function paintEdges(anim) {
    var e = $('#cv-edges'); if (!e) return; e.innerHTML = edgesHTML(anim);
    if (anim && C.motion()) $$('path.ed', e).forEach(function (p, i) { gsap.fromTo(p, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .7, delay: .35 + i * .04, ease: 'power2.out', onComplete: function () { p.style.strokeDasharray = 'none'; p.removeAttribute('pathLength'); } }); });
  }
  function applyView() {
    var v = VIEW(), w = $('#cv-world'), cv = $('#cv'); if (!w) return;
    w.style.transform = 'translate(' + v.x + 'px,' + v.y + 'px) scale(' + v.k + ')';
    cv.style.backgroundPosition = v.x + 'px ' + v.y + 'px'; cv.style.backgroundSize = (24 * v.k) + 'px ' + (24 * v.k) + 'px';
    var z = $('#cv-z'); if (z) z.textContent = Math.round(v.k * 100) + '%';
  }
  function bounds() {
    var f = flow(), x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    Object.keys(f.nodes).forEach(function (id) { var p = f.pos[id]; x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + NW); y1 = Math.max(y1, p.y + estH(f.nodes[id])); });
    return { x0: x0, y0: y0, x1: x1, y1: y1 };
  }
  function fit(animate) {
    var cv = $('#cv'), v = VIEW(), b = bounds(), cw = cv.clientWidth, ch = cv.clientHeight, pad = 36;
    var k = Math.min(1, (cw - pad * 2) / (b.x1 - b.x0), (ch - pad * 2) / (b.y1 - b.y0)); k = Math.max(.5, k);
    var nx = (cw - (b.x1 - b.x0) * k) / 2 - b.x0 * k, ny = Math.max(pad - b.y0 * k, (ch - (b.y1 - b.y0) * k) / 2 - b.y0 * k);
    if ((b.x1 - b.x0) * k > cw - pad) nx = pad - b.x0 * k;
    tweenView(nx, ny, k, animate); VIEW().auto = true;
  }
  function offscreen() {
    var cv = $('#cv'), v = VIEW(), b = bounds(); if (!cv) return false;
    return b.x1 * v.k + v.x < 24 || b.x0 * v.k + v.x > cv.clientWidth - 24 || b.y1 * v.k + v.y < 24 || b.y0 * v.k + v.y > cv.clientHeight - 24;
  }
  C.onResize = function () { if (C.cur && C.cur.name === 'bot' && $('#cv')) { var v = VIEW(); if (v.auto || offscreen()) fit(false); } };
  function tweenView(x, y, k, animate) {
    var v = VIEW(); v.fresh = false; v.auto = false;
    if (animate && C.motion()) gsap.to(v, { x: x, y: y, k: k, duration: .45, ease: 'power3.out', onUpdate: applyView, overwrite: true });
    else { v.x = x; v.y = y; v.k = k; applyView(); }
  }
  function zoomAt(cx, cy, f) {
    var cv = $('#cv'), r = cv.getBoundingClientRect(), v = VIEW(), k = Math.max(.35, Math.min(1.6, v.k * f)), px = cx - r.left, py = cy - r.top;
    v.x = px - (px - v.x) * (k / v.k); v.y = py - (py - v.y) * (k / v.k); v.k = k; v.fresh = false; v.auto = false; applyView();
  }
  function ensureVisible(id) {
    var cv = $('#cv'), f = flow(), p = f.pos[id], v = VIEW(); if (!cv || !p) return;
    var sx = p.x * v.k + v.x, sy = p.y * v.k + v.y, w = NW * v.k, h = estH(f.nodes[id]) * v.k, cw = cv.clientWidth, ch = cv.clientHeight;
    if (sx < 20 || sx + w > cw - 20 || sy < 20 || sy + h > ch - 20) tweenView(cw / 2 - (p.x + NW / 2) * v.k, ch / 2 - (p.y + estH(f.nodes[id]) / 2) * v.k, v.k, true);
  }
  function selectNode(id, noInspect) {
    C.ui.botNode = id; $$('.cn').forEach(function (n) { n.classList.toggle('sel', n.dataset.id === id); }); paintEdges();
    if (side() === 'edit') { var ins = $('#inspector'); if (ins) ins.innerHTML = inspector(); }
  }
  function mountCanvas() {
    var cv = $('#cv'); if (!cv) return; var f = flow(); layout(f);
    var first = VIEW().fresh;
    paintNodes(first && !C.noFx); if (first || offscreen()) fit(false); applyView();
    if (first && C.motion() && !C.noFx) gsap.from('#cv-world .cn', { opacity: 0, y: 18, scale: .96, duration: .5, stagger: .06, ease: 'power3.out', clearProps: 'opacity,transform' });
    if (side() === 'test') { if (!C.ui.test) testStart(); paintTest(); }
    bindCanvas(cv);
  }
  function bindCanvas(cv) {
    var g = null, ptrs = {}, pinch = null;
    var pdist = function () { var k = Object.keys(ptrs), a = ptrs[k[0]], b = ptrs[k[1]]; return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };
    cv.addEventListener('wheel', function (e) {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * .0028));
      else { var v = VIEW(); v.x -= e.deltaX; v.y -= e.deltaY; v.fresh = false; v.auto = false; applyView(); }
    }, { passive: false });
    cv.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.closest('.cv-tb')) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (Object.keys(ptrs).length === 2) {
        if (g && g.t === 'link') { var tp = $('#cv-edges .tmp'); if (tp) tp.remove(); $$('.cn.linking,.cn.drop').forEach(function (n) { n.classList.remove('linking'); n.classList.remove('drop'); }); }
        if (g && g.t === 'node') { g.el.classList.remove('drag'); C.save(); }
        g = null; cv.classList.remove('panning'); pinch = pdist(); cv.setPointerCapture(e.pointerId); return;
      }
      if (pinch) return;
      var port = e.target.closest('.cn-port'), node = e.target.closest('.cn'), v = VIEW();
      cv.setPointerCapture(e.pointerId);
      if (port && node) {
        var id = node.dataset.id, i = +port.dataset.port; g = { t: 'link', id: id, i: i, a: portPos(id, i) };
        $('#cv-edges').insertAdjacentHTML('beforeend', '<path class="ed tmp" d="" marker-end="url(#ar-on)"/>'); node.classList.add('linking'); e.preventDefault();
      } else if (node) {
        var p = flow().pos[node.dataset.id]; g = { t: 'node', id: node.dataset.id, el: node, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y, moved: false };
        selectNode(node.dataset.id);
      } else { g = { t: 'pan', sx: e.clientX, sy: e.clientY, ox: v.x, oy: v.y }; cv.classList.add('panning'); }
    });
    cv.addEventListener('pointermove', function (e) {
      if (ptrs[e.pointerId]) { ptrs[e.pointerId].x = e.clientX; ptrs[e.pointerId].y = e.clientY; }
      if (pinch && Object.keys(ptrs).length >= 2) {
        var n2 = pdist(), v0 = VIEW(); zoomAt(n2.x, n2.y, n2.d / pinch.d); v0.x += n2.x - pinch.x; v0.y += n2.y - pinch.y; applyView(); pinch = n2; return;
      }
      if (!g) return; var v = VIEW(), r = cv.getBoundingClientRect();
      if (g.t === 'pan') { v.x = g.ox + e.clientX - g.sx; v.y = g.oy + e.clientY - g.sy; v.fresh = false; v.auto = false; applyView(); }
      else if (g.t === 'node') {
        var dx = (e.clientX - g.sx) / v.k, dy = (e.clientY - g.sy) / v.k; if (!g.moved && Math.hypot(dx, dy) * v.k < 4) return; g.moved = true;
        var p = flow().pos[g.id]; p.x = Math.round(g.ox + dx); p.y = Math.round(g.oy + dy); g.el.style.left = p.x + 'px'; g.el.style.top = p.y + 'px'; g.el.classList.add('drag'); paintEdges();
      } else if (g.t === 'link') {
        var b = { x: (e.clientX - r.left - v.x) / v.k, y: (e.clientY - r.top - v.y) / v.k }, tmp = $('#cv-edges .tmp'); if (tmp) tmp.setAttribute('d', curve(g.a, b));
        var under = document.elementFromPoint(e.clientX, e.clientY), nd = under && under.closest && under.closest('.cn');
        $$('.cn.drop').forEach(function (n) { n.classList.remove('drop'); }); if (nd && nd.dataset.id !== g.id) nd.classList.add('drop');
      }
    });
    var up = function (e) {
      delete ptrs[e.pointerId]; if (Object.keys(ptrs).length < 2) pinch = null;
      if (!g) return; var gg = g; g = null; cv.classList.remove('panning');
      if (gg.t === 'node') { gg.el.classList.remove('drag'); if (gg.moved) { C.save(); } }
      else if (gg.t === 'link') {
        var under = document.elementFromPoint(e.clientX, e.clientY), nd = under && under.closest && under.closest('.cn');
        $$('.cn.drop,.cn.linking').forEach(function (n) { n.classList.remove('drop'); n.classList.remove('linking'); });
        if (nd && nd.dataset.id !== gg.id) {
          flow().nodes[gg.id].options[gg.i].next = nd.dataset.id; C.ui.test = null; C.save(); paintNodes(); selectNode(gg.id); C.toast('Connected to “' + short(flow().nodes[nd.dataset.id].text, 28) + '”', { icon: 'flow' });
        } else paintEdges();
      }
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('keydown', function (e) {
      var n = e.target.closest('.cn'); if (!n || e.target !== n) return; var id = n.dataset.id, p = flow().pos[id];
      if (e.key === 'Enter' || e.key === ' ') { C.ui.botSide = 'edit'; selectNode(id); renderSide(); var t = $('#nm'); if (t) t.focus(); e.preventDefault(); }
      else if (e.key.indexOf('Arrow') === 0) { var s = e.shiftKey ? 48 : 16; p.x += e.key === 'ArrowRight' ? s : e.key === 'ArrowLeft' ? -s : 0; p.y += e.key === 'ArrowDown' ? s : e.key === 'ArrowUp' ? -s : 0; n.style.left = p.x + 'px'; n.style.top = p.y + 'px'; paintEdges(); C.save(); e.preventDefault(); }
    });
    cv.addEventListener('dblclick', function (e) { if (e.target.closest('.cn')) { C.ui.botSide = 'edit'; renderSide(); } });
  }
  C.acts['cv-zin'] = function () { var r = $('#cv').getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.2); };
  C.acts['cv-zout'] = function () { var r = $('#cv').getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.2); };
  C.acts['cv-fit'] = function () { fit(true); };
  C.acts['cv-layout'] = function () { var f = flow(); f.pos = {}; layout(f); C.save(); paintNodes(); fit(true); C.toast('Nodes arranged', { icon: 'flow' }); };
  C.acts['node-add'] = function () {
    var f = flow(), cv = $('#cv'), v = VIEW(), id = 'n' + Date.now().toString(36);
    f.nodes[id] = { type: 'question', text: 'New question — edit me', options: [{ label: 'Option A', next: '' }] };
    f.pos[id] = { x: Math.round((cv.clientWidth / 2 - v.x) / v.k - NW / 2), y: Math.round((cv.clientHeight / 2 - v.y) / v.k - 50) };
    C.ui.botNode = id; C.ui.botSide = 'edit'; C.ui.test = null; C.save(); paintNodes(); renderSide();
    if (C.motion()) gsap.from('.cn[data-id="' + id + '"]', { scale: .8, opacity: 0, duration: .35, ease: 'back.out(1.6)' });
    var t = $('#nm'); if (t) { t.focus(); t.select(); }
  };

  // ---------- side panel ----------------------------------------------------
  function inspector() {
    var f = flow(), id = selNode(), n = f.nodes[id];
    var targets = function (cur) { return '<option value="">(end chat)</option>' + Object.keys(f.nodes).map(function (k) { return '<option value="' + k + '"' + (k === cur ? ' selected' : '') + '>' + esc(short(f.nodes[k].text, 36)) + '</option>'; }).join(''); };
    return '<div class="field"><label for="nt">Node type</label><select id="nt" data-ch="node-type">' + Object.keys(TYPES).map(function (k) { return '<option value="' + k + '"' + (n.type === k ? ' selected' : '') + '>' + TYPES[k] + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="nm">Bot message</label><textarea id="nm" rows="3" data-in="node-text">' + esc(n.text) + '</textarea></div>' +
      (n.type === 'question' ? '<fieldset class="opts"><legend>Answer buttons</legend>' + (n.options || []).map(function (o, i) {
        return '<div class="optrow"><div class="field"><label for="ol' + i + '">Button ' + (i + 1) + '</label><input id="ol' + i + '" data-in="opt-label" data-i="' + i + '" value="' + esc(o.label) + '"></div><div class="field"><label for="on' + i + '">Leads to</label><select id="on' + i + '" data-ch="opt-next" data-i="' + i + '">' + targets(o.next) + '</select></div><button type="button" class="ibtn" data-act="opt-del" data-i="' + i + '" aria-label="Remove button ' + (i + 1) + ': ' + esc(o.label) + '">' + C.ic('trash', 14) + '</button></div>';
      }).join('') + '<button type="button" class="btn sm" data-act="opt-add">' + C.ic('plus', 13) + 'Add answer</button></fieldset>' :
        '<p class="hint">' + (n.type === 'lead' ? 'Shows a name + phone form. Submitting creates a lead in the inbox with source “Chatbot”.' : n.type === 'handoff' ? 'The chat is transferred to the next available agent.' : 'The bot sends this message and the chat ends as resolved.') + '</p>') +
      '<div class="btns end">' + (id !== f.start ? '<button type="button" class="btn sm" data-act="node-start">Make start node</button><button type="button" class="btn sm danger" data-act="node-del">' + C.ic('trash', 13) + 'Delete</button>' : '<span class="muted sm">This is the start node.</span>') + '</div>';
  }
  function sidePanel() {
    var m = side();
    return '<div class="seg full" role="group" aria-label="Side panel"><button type="button" data-act="bot-side" data-v="edit" aria-pressed="' + (m === 'edit') + '">' + C.ic('note', 13) + 'Edit node</button><button type="button" data-act="bot-side" data-v="test" aria-pressed="' + (m === 'test') + '">' + C.ic('play', 13) + 'Test the bot</button></div>' +
      (m === 'edit' ? '<div id="inspector" class="insp">' + inspector() + '</div>' : testPanel());
  }
  function renderSide() { var s = $('#side-p'); if (!s) return; s.innerHTML = sidePanel(); if (side() === 'test') { if (!C.ui.test) testStart(); paintTest(); } paintNodes(); }
  C.acts['bot-side'] = function (el) { C.ui.botSide = el.dataset.v; if (el.dataset.v === 'test') C.ui.test = null; renderSide(); var b = $('[data-act="bot-side"][aria-pressed="true"]'); if (b) b.focus(); };
  function flowPanel() {
    return '<div class="flowgrid"><div class="cv-wrap"><div class="cv" id="cv" aria-label="Chatbot flow canvas. Drag nodes to arrange, drag from a port to connect, scroll to pan, hold ' + C.mod + ' and scroll to zoom."><div class="cv-world" id="cv-world"><svg class="cv-edges" id="cv-edges" width="1" height="1"></svg></div>' +
      '<div class="cv-tb cv-l"><button type="button" class="btn sm pri" data-act="node-add">' + C.ic('plus', 13) + 'Add node</button><button type="button" class="btn sm" data-act="cv-layout">' + C.ic('flow', 13) + 'Arrange</button></div>' +
      '<div class="cv-tb cv-r" role="group" aria-label="Zoom"><button type="button" class="ibtn" data-act="cv-zout" aria-label="Zoom out">' + C.ic('zout', 15) + '</button><span id="cv-z" aria-live="off">100%</span><button type="button" class="ibtn" data-act="cv-zin" aria-label="Zoom in">' + C.ic('zin', 15) + '</button><button type="button" class="ibtn" data-act="cv-fit" aria-label="Fit flow to view">' + C.ic('fit', 15) + '</button></div>' +
      '<p class="cv-hint">Drag to pan · ' + C.mod + ' + scroll to zoom · drag a port to connect</p></div></div>' +
      '<section class="card side-p" id="side-p" aria-label="Node editor and test chat">' + sidePanel() + '</section></div>';
  }
  function dirty() { C.ui.test = null; C.save(); }
  C.acts['opt-add'] = function () { var n = flow().nodes[selNode()]; (n.options = n.options || []).push({ label: 'New answer', next: '' }); dirty(); renderSide(); var l = $$('[data-in="opt-label"]'); l[l.length - 1].focus(); l[l.length - 1].select(); };
  C.acts['opt-del'] = function (el) { var n = flow().nodes[selNode()]; n.options.splice(+el.dataset.i, 1); dirty(); renderSide(); var b = $('[data-act="opt-add"]'); if (b) b.focus(); };
  C.acts['node-del'] = function () {
    var f = flow(), id = selNode(); if (id === f.start) return;
    delete f.nodes[id]; delete f.pos[id]; Object.keys(f.nodes).forEach(function (k) { (f.nodes[k].options || []).forEach(function (o) { if (o.next === id) o.next = ''; }); });
    C.ui.botNode = f.start; dirty(); renderSide(); C.toast('Node deleted', { icon: 'trash' });
  };
  C.acts['node-start'] = function () { flow().start = selNode(); dirty(); renderSide(); C.toast('Start node updated', { icon: 'flag' }); };
  C.ins['node-text'] = function (el) { flow().nodes[selNode()].text = el.value; dirty(); paintNodes(); };
  C.ins['opt-label'] = function (el) { flow().nodes[selNode()].options[+el.dataset.i].label = el.value; dirty(); paintNodes(); };
  C.chs['opt-next'] = function (el) { flow().nodes[selNode()].options[+el.dataset.i].next = el.value; dirty(); paintNodes(); };
  C.chs['node-type'] = function (el) {
    var n = flow().nodes[selNode()]; n.type = el.value; if (n.type === 'question' && !(n.options && n.options.length)) n.options = [{ label: 'Option A', next: '' }];
    dirty(); renderSide(); $('#nt').focus();
  };

  // ---------- test the bot --------------------------------------------------
  var BUD = { 'Under ₹3 L': 2, '₹3–8 L': 5, 'Above ₹8 L': 12 };
  function testStart() {
    C.ui.test = { msgs: [], id: null, done: false, outcome: null, t: Date.now(), picks: [], trail: [], tok: ((C.ui.test && C.ui.test.tok) || 0) + 1 };
    botSay(flow().start, true);
  }
  function botSay(id, instant) {
    var T = C.ui.test, n = flow().nodes[id], tok = T.tok;
    var go = function () {
      if (C.ui.test !== T || T.tok !== tok) return;
      if (!n) { finish('resolved'); return; }
      T.msgs.push({ from: 'bot', text: n.text }); T.id = id; T.typing = false;
      if (n.type === 'answer') finish('resolved'); else if (n.type === 'handoff') { T.msgs.push({ from: 'system', text: 'Agent ' + C.TEAM[1].split(' ')[0] + ' joined the chat' }); finish('handoff'); }
      else if (n.type === 'question' && !(n.options && n.options.length)) finish('resolved');
      paintTest(true); walk(id);
    };
    if (instant) go(); else { T.typing = true; paintTest(); setTimeout(go, 700); }
  }
  function walk(id) {
    $$('.cn').forEach(function (n) { var T = C.ui.test; n.classList.toggle('live', !!T && T.id === id && n.dataset.id === id); n.classList.toggle('walk', !!T && (n.dataset.id === id || T.trail.some(function (x) { return x.id === n.dataset.id; }))); });
    paintEdges(); ensureVisible(id);
  }
  function finish(outcome) {
    var T = C.ui.test; if (T.done) return; T.done = true; T.outcome = outcome;
    S().transcripts.unshift({ id: 'C-' + (2100 + S().transcripts.length), t: T.t, visitor: T.visitor || 'You (test chat)', page: '/test-the-bot', msgs: T.msgs.slice(), outcome: outcome, test: true });
    C.save(); C.toast('Chat ended — ' + OUT[outcome][0].toLowerCase() + ', transcript saved', { icon: 'bot' });
  }
  function chatBubbles(msgs, typing) {
    return msgs.map(function (m) { return '<div class="msg ' + m.from + '"><span class="sr">' + (m.from === 'bot' ? 'Lumi: ' : m.from === 'user' ? 'You: ' : '') + '</span>' + esc(m.text) + '</div>'; }).join('') + (typing ? '<div class="msg bot typing" role="img" aria-label="Lumi is typing"><i></i><i></i><i></i></div>' : '');
  }
  function paintTest(focus) {
    var T = C.ui.test, box = $('#chat'), opts = $('#chat-opts'); if (!box || !T) return;
    var had = box.children.length; box.innerHTML = chatBubbles(T.msgs, T.typing); box.scrollTop = box.scrollHeight;
    if (C.motion() && box.children.length > had && !T.noAnim) { var last = box.children[box.children.length - (T.typing ? 1 : 1)]; if (last) gsap.from(last, { opacity: 0, y: 8, duration: .28, ease: 'power2.out' }); }
    var n = T.id && flow().nodes[T.id], h = '';
    if (T.typing) h = '';
    else if (T.done) h = '<div class="endrow">' + outPill(T.outcome) + '<span class="muted sm">Saved to Transcripts</span><button type="button" class="btn sm pri" data-act="test-restart">Start over</button></div>';
    else if (n && n.type === 'question') h = '<div class="qopts" role="group" aria-label="Choose an answer">' + (n.options || []).map(function (o, i) { return '<button type="button" class="qbtn" data-act="test-pick" data-i="' + i + '">' + esc(o.label) + '</button>'; }).join('') + '</div>';
    else if (n && n.type === 'lead') h = '<form data-form="test-lead" class="leadform"><div class="field"><label for="tl-n">Your name</label><input id="tl-n" name="name" required autocomplete="off"></div><div class="field"><label for="tl-p">Phone number</label><input id="tl-p" name="phone" inputmode="tel" required pattern="[0-9 +\\(\\)\\-]{8,16}" title="Enter a phone number, digits only" autocomplete="off"></div><button class="btn pri">Send</button></form>';
    opts.innerHTML = h;
    if (focus && T.msgs.length > 1) { var f = opts.querySelector('button,input'); if (f) f.focus({ preventScroll: true }); }
  }
  C.acts['test-pick'] = function (el) {
    var T = C.ui.test, n = flow().nodes[T.id], o = n.options[+el.dataset.i]; if (!o) return;
    T.msgs.push({ from: 'user', text: o.label }); T.picks.push(o.label); T.trail.push({ id: T.id, i: +el.dataset.i });
    if (!o.next) { finish('resolved'); paintTest(true); walk(T.id); return; }
    botSay(o.next);
  };
  C.acts['test-restart'] = function () { testStart(); paintTest(); walk(flow().start); var b = $('#chat-opts button'); if (b) b.focus(); };
  C.forms['test-lead'] = function (f) {
    var T = C.ui.test, name = f.elements.name.value.trim(), phone = f.elements.phone.value.trim(); if (!name || !phone) return;
    T.visitor = name; T.msgs.push({ from: 'user', text: name + ' · ' + phone });
    var service = C.SERVICES.filter(function (s) { return T.picks.indexOf(s) > -1; })[0] || 'Modular kitchen', budget = 3;
    T.picks.forEach(function (p) { if (BUD[p]) budget = BUD[p]; });
    var lead = C.newLead({ name: name, phone: phone, source: 'chatbot', service: service, budget: budget, req: 'Captured by the chatbot (test chat). Choices: ' + (T.picks.join(' → ') || 'none') + '.', utm: { source: 'website', medium: 'chatbot', campaign: '' }, extra: 'test chat' });
    C.log(lead, 'msg', 'Lumi (chatbot) collected the requirement and promised a callback');
    T.msgs.push({ from: 'bot', text: 'Thanks ' + name.split(' ')[0] + '! We’ve passed this to the team — expect a call soon.' });
    T.msgs.push({ from: 'system', text: 'Lead ' + lead.id + ' created in the inbox (source: Chatbot)' });
    finish('lead'); C.save(); paintTest(true);
  };
  function testPanel() {
    return '<div class="chatbox"><div class="chat-h">' + C.avatar('Lumi', 30) + '<div class="grow"><b>Lumi</b><div class="muted sm"><span class="live-dot"></span>Preview · runs your current flow</div></div><button type="button" class="btn sm" data-act="test-restart">' + C.ic('refresh', 13) + 'Restart</button></div><div class="chat" id="chat" role="log" aria-live="polite" aria-label="Chat preview"></div><div id="chat-opts" class="chat-opts"></div></div>' +
      '<p class="hint">Finishing a chat saves a transcript, and capturing a lead adds a real entry to this demo’s inbox. Watch the path light up on the canvas.</p>';
  }

  // ---------- transcripts ---------------------------------------------------
  C.acts['tr-f'] = function (el) { C.ui.trf = el.dataset.v; C.ui.tr = null; C.rerender(); var b = $('[data-act="tr-f"][aria-pressed="true"]'); if (b) b.focus(); };
  function logPanel() {
    var all = S().transcripts, f = C.ui.trf || 'all', T = all.filter(function (x) { return f === 'all' || x.outcome === f; }), sel = T.filter(function (x) { return x.id === C.ui.tr; })[0] || T[0];
    var cnt = function (o) { return all.filter(function (x) { return o === 'all' || x.outcome === o; }).length; };
    var chips = [['all', 'All'], ['resolved', 'Resolved'], ['lead', 'Lead captured'], ['handoff', 'Handed off']].map(function (x) { return '<button type="button" class="chip" data-act="tr-f" data-v="' + x[0] + '" aria-pressed="' + (f === x[0]) + '">' + x[1] + ' <b>' + cnt(x[0]) + '</b></button>'; }).join('');
    if (!sel) return '<div class="chips">' + chips + '</div><p class="empty">No transcripts match.</p>';
    return '<div class="loggrid"><section class="card flush"><div class="chips pad">' + chips + '</div><ul class="trlist">' + T.map(function (x) {
      return '<li><button type="button" class="trbtn" data-act="tr-sel" data-id="' + x.id + '" aria-current="' + (x.id === sel.id) + '"><span class="trtop"><b>' + esc(x.visitor) + '</b>' + outPill(x.outcome) + '</span><span class="muted sm">' + esc(x.page) + ' · ' + C.rel(x.t) + ' · ' + x.msgs.length + ' messages' + (x.test ? ' · test' : '') + '</span></button></li>';
    }).join('') + '</ul></section>' +
      '<section class="card" aria-label="Transcript"><div class="card-h"><div><h2>' + esc(sel.visitor) + '</h2><p class="sub">' + esc(sel.id) + ' · ' + C.dt(sel.t) + ' · page ' + esc(sel.page) + '</p></div>' + outPill(sel.outcome) + '</div><div class="chat static">' + chatBubbles(sel.msgs, false) + '</div></section></div>';
  }
  C.acts['tr-sel'] = function (el) { C.ui.tr = el.dataset.id; var y = $('#view').scrollTop; $('#panel').innerHTML = logPanel(); $('#view').scrollTop = y; var b = $('.trbtn[aria-current="true"]'); if (b) b.focus({ preventScroll: true }); if (C.motion()) gsap.from('.chat.static .msg', { opacity: 0, y: 6, duration: .25, stagger: .03, clearProps: 'all' }); };
})();
