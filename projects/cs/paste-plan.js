/* Paste your plan: one initiative per line, "Launch store > needs payment gateway". Enter (or the button) turns the
   lines into stars: each line lifts off the text box and rises into the sky above it, then its links light up.
   What comes first sits on the left, what it unlocks to the right. The result turns and can be clicked like the
   hero (constellation-hero.js draws it). Nothing leaves the page. */
(function () {
  'use strict';
  var d = document, W = window, M = Math;
  var root = d.getElementById('pp');
  if (!root || !W.CstSky) return;
  var ta = d.getElementById('pp-ta'), go = d.getElementById('pp-go'), clr = d.getElementById('pp-clear'), ex = d.getElementById('pp-ex');
  var st = d.getElementById('pp-st'), box = d.getElementById('pp-sky'), read = d.getElementById('pp-read');
  var LV = ['#66e6c8', '#7fb4ff', '#c79bff', '#f58ab0', '#ffc978', '#79e7ff'], MAXL = 40, MAXN = 60;
  var STILL = CstSky.still, EXAMPLE = ta.value, keep = {}, touched = false, flights = [];
  var sky = CstSky.create(box, { data: { nodes: [], links: [] }, mode: 'sway', yaw: -.18, pitch: .34, fx: .74, fy: .7, labels: 'all', stars: 60, seed: 3 });

  /* ---- "A > needs B, C" lines into stars and links ---- */
  function clean(s) { return s.replace(/^\s*(?:[-*•·–]+|\d+[.)])\s+/, '').replace(/\s+/g, ' ').trim(); }
  function key(s) { return s.toLowerCase().replace(/[^a-z0-9À-ɏऀ-ॿ]+/g, ' ').trim(); }
  function parse(text) {
    var nodes = [], at = {}, links = [], seen = {}, lines = 0, cut = false;
    function node(name, line) {
      name = clean(name).replace(/[.;:,!?]+$/, '').slice(0, 46);
      var k = key(name); if (!k) return -1;
      if (at[k] == null) { if (nodes.length >= MAXN) { cut = true; return -1; } at[k] = nodes.length; nodes.push({ name: name.charAt(0).toUpperCase() + name.slice(1), key: k, line: line }); }
      return at[k];
    }
    text.split(/\r?\n/).forEach(function (raw, li) {
      var s = clean(raw); if (!s) return;
      if (lines >= MAXL) { cut = true; return; }
      lines++;
      var parts = s.split(/\s*(?:->|=>|>|→)\s*/), a = node(parts[0], li);
      if (a < 0) return;
      parts.slice(1).forEach(function (p) {
        p = p.replace(/^(?:needs?|requires?|depends on|after|waits? (?:on|for)|blocked by)\s+/i, '');
        p.split(/\s*(?:,|;|\+|\band\b)\s*/i).forEach(function (q) {
          var b = node(q, li);
          if (b < 0 || b === a || seen[b + '>' + a]) return;
          seen[b + '>' + a] = 1; links.push({ s: b, t: a });
        });
      });
    });
    return { nodes: nodes, links: links, lines: lines, cut: cut };
  }

  /* ---- layout: steps left to right by what has to land first, spread round the step's axis, then relaxed ---- */
  function layout(P) {
    var n = P.nodes.length, lv = [], i, j, it, top = 0, by = [], pos = [];
    for (i = 0; i < n; i++) lv[i] = 0;
    for (it = 0; it < n; it++) {
      var ch = false;
      P.links.forEach(function (l) { if (lv[l.t] < lv[l.s] + 1 && lv[l.s] + 1 < n) { lv[l.t] = lv[l.s] + 1; ch = true; } });
      if (!ch) break;
    }
    for (i = 0; i < n; i++) { top = M.max(top, lv[i]); (by[lv[i]] = by[lv[i]] || []).push(i); }
    var gap = M.min(150, 640 / (top + 1));
    by.forEach(function (arr, L) {
      if (!arr) return;
      arr.forEach(function (i, k) {
        var m = arr.length, a = k / m * 6.2832 + L * 1.25, r = m > 1 ? 64 + 26 * M.min(m, 6) : 48;
        pos[i] = { x: (L - top / 2) * gap, y: M.sin(a) * r * .85 + (L % 2 ? 22 : -22), z: M.cos(a) * r };
      });
    });
    for (it = 0; it < 180; it++) {
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
        var a = pos[i], b = pos[j], dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, dd = M.sqrt(dx * dx + dy * dy + dz * dz) || .01;
        if (dd < 112) { var f = (112 - dd) / dd * .06; a.y -= dy * f; a.z -= dz * f; b.y += dy * f; b.z += dz * f; a.x -= dx * f * .15; b.x += dx * f * .15; }
      }
      P.links.forEach(function (l) {
        var a = pos[l.s], b = pos[l.t], dy = b.y - a.y, dz = b.z - a.z, dd = M.sqrt(dy * dy + dz * dz);
        if (dd > 40) { var f = (dd - 40) / dd * .025; a.y += dy * f; a.z += dz * f; b.y -= dy * f; b.z -= dz * f; }
      });
    }
    var cy = 0, cz = 0;
    for (i = 0; i < n; i++) { cy += pos[i].y / n; cz += pos[i].z / n; }
    for (i = 0; i < n; i++) { pos[i].y -= cy; pos[i].z -= cz; }
    /* on a narrow screen the steps stand upright instead: first things at the bottom, outcomes at the top */
    if (box.clientWidth < 560) for (i = 0; i < n; i++) pos[i] = { x: pos[i].y * .9, y: pos[i].x * 1.15, z: pos[i].z };
    return { lv: lv, top: top, pos: pos };
  }

  /* where each line of the text box sits on screen, wrapping included, via a hidden mirror */
  function lineTops() {
    var cs = getComputedStyle(ta), m = d.createElement('div'), lines = ta.value.split('\n'), spans = [];
    ['boxSizing', 'width', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle',
      'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'wordSpacing'].forEach(function (p) { m.style[p] = cs[p]; });
    m.style.position = 'absolute'; m.style.left = '-9999px'; m.style.top = '0'; m.style.visibility = 'hidden'; m.style.whiteSpace = 'pre-wrap'; m.style.overflowWrap = 'break-word';
    lines.forEach(function (ln, i) {
      var sp = d.createElement('span'); sp.textContent = ln || '​'; m.appendChild(sp); spans.push(sp);
      if (i < lines.length - 1) m.appendChild(d.createTextNode('\n'));
    });
    d.body.appendChild(m);
    var mr = m.getBoundingClientRect(), tr = ta.getBoundingClientRect();
    var out = spans.map(function (sp) { var r = sp.getBoundingClientRect(); return { x: tr.left + r.left - mr.left, y: tr.top + r.top - mr.top - ta.scrollTop + r.height / 2 }; });
    m.parentNode.removeChild(m);
    return out;
  }

  function ignite(i, t) {
    var n = sky.n[i]; if (!n || n.on) return;
    n.on = true; n.born = t;
    sky.l.forEach(function (l) { if ((l.s === i || l.t === i) && sky.n[l.s].on && sky.n[l.t].on) l.born = t; });
    sky.kick();
  }
  function stopFlights() { flights.forEach(function (f) { try { f.a.cancel(); } catch (e) { } if (f.g.parentNode) f.g.parentNode.removeChild(f.g); }); flights = []; }
  function fly(i, from, delay) {
    var n = sky.n[i], g = d.createElement('span'), rr = root.getBoundingClientRect(), sr = box.getBoundingClientRect();
    g.className = 'pp-ghost'; g.textContent = n.name; g.style.setProperty('--c', n.color);
    root.appendChild(g);
    var gw = g.offsetWidth, gh = g.offsetHeight;
    var x0 = from.x - rr.left, y0 = from.y - rr.top - gh / 2, x1 = sr.left - rr.left + n.sx - gw / 2, y1 = sr.top - rr.top + n.sy - gh / 2;
    function tf(x, y, s) { return 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + s + ')'; }
    var a = g.animate([
      { transform: tf(x0, y0, 1), opacity: 0 },
      { transform: tf(x0, y0 - 8, 1), opacity: 1, offset: .14 },
      { transform: tf(x0 + (x1 - x0) * .3, y0 + (y1 - y0) * .62, .92), opacity: 1, offset: .58 },
      { transform: tf(x1, y1, .25), opacity: 0 }
    ], { duration: 1050, delay: delay, easing: 'cubic-bezier(.5,0,.25,1)', fill: 'both' });
    var f = { a: a, g: g }; flights.push(f);
    a.onfinish = function () { if (g.parentNode) g.parentNode.removeChild(g); ignite(i, performance.now()); };
  }

  function say(msg) { st.textContent = msg; }
  function count(nodes, links) { return nodes + (nodes === 1 ? ' star' : ' stars') + ' · ' + links + (links === 1 ? ' link' : ' links'); }
  function build(why) {
    var P = parse(ta.value);
    stopFlights();
    if (!P.nodes.length) {
      sky.set({ nodes: [], links: [] }); keep = {}; root.classList.remove('built');
      read.textContent = 'Your stars appear here';
      say('Write at least one line, for example: Launch store > needs payment gateway');
      return 0;
    }
    var L = layout(P), t = performance.now(), fresh = [];
    var nodes = P.nodes.map(function (p, i) {
      var q = L.pos[i], old = keep[p.key];
      var n = { id: p.key, name: p.name, kick: 'Step ' + (L.lv[i] + 1) + ' of ' + (L.top + 1), kind: 2, color: LV[L.lv[i] % LV.length], x: q.x, y: q.y, z: q.z, line: p.line };
      n.on = !!(old && old.on) || STILL;
      if (!n.on) fresh.push(i);
      return n;
    });
    var links = P.links.map(function (l) { return { s: l.s, t: l.t, dep: true }; });
    sky.set({ nodes: nodes, links: links });
    keep = {}; nodes.forEach(function (n) { keep[n.id] = n; });
    root.classList.add('built');
    read.textContent = count(nodes.length, links.length);
    say(P.lines + (P.lines === 1 ? ' line' : ' lines') + ' became ' + count(nodes.length, links.length) + '.' + (P.cut ? ' Only the first ' + MAXL + ' lines are used.' : '') + ' Drag to turn it; ' + (W.matchMedia('(pointer: coarse)').matches ? 'tap' : 'click') + ' a star.');
    if (fresh.length) {
      sky.proj();
      var tops = lineTops(), order = 0, byLine = {};
      fresh.sort(function (a, b) { return nodes[a].line - nodes[b].line || a - b; });
      fresh.forEach(function (i) {
        var ln = nodes[i].line, k = byLine[ln] = (byLine[ln] || 0) + 1, from = tops[ln] || tops[0];
        fly(i, { x: from.x + (k - 1) * 46, y: from.y }, why === 'auto' ? 160 + order * 120 : order * 95);
        order++;
      });
    }
    sky.kick();
    root.dataset.stars = nodes.length; root.dataset.links = links.length;
    return nodes.length;
  }

  function fit() { ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight + 2) + 'px'; }
  go.addEventListener('click', function () { touched = true; build('button'); });
  ta.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.shiftKey) return;
    touched = true;
    if (e.metaKey || e.ctrlKey) { e.preventDefault(); build('enter'); return; }
    setTimeout(function () { fit(); build('enter'); }, 0);
  });
  ta.addEventListener('input', function () { touched = true; fit(); });
  ta.addEventListener('paste', function () { touched = true; setTimeout(function () { fit(); build('paste'); }, 0); });
  if (clr) clr.addEventListener('click', function () { touched = true; ta.value = ''; fit(); build('clear'); say('Cleared. Write one initiative per line, then press Enter.'); ta.focus(); });
  if (ex) ex.addEventListener('click', function () { touched = true; ta.value = EXAMPLE; fit(); keep = {}; sky.set({ nodes: [], links: [] }); build('button'); });
  fit();
  /* the first time the box comes into view, the example plan rises on its own; after that it is the visitor's */
  if ('IntersectionObserver' in W) {
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      if (!touched) build('auto');
    }, { threshold: .6 });
    io.observe(box);
  } else build('auto');
})();
