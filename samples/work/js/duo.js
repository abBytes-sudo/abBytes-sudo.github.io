/* Ordwell, product page: "Drag it here. It moves there."
   Two stages show the same ten tasks (the six layouts live in site.js as OW.viewKit). Drag a card to another column and
   its bar changes colour on the timeline; pull a bar or its right edge and the date changes in the table and the load
   changes in Workload. Everything is one array of tasks; each stage only draws it. Keyboard: arrows on a focused card or bar.
   Loaded deferred; it builds nothing until its section is near the viewport. */
(function () {
  'use strict';
  var OW = window.OW = window.OW || {};
  var root = document.getElementById('duo');
  if (!root) return;
  var started = false;

  function arm() {
    var go = function () {
      if (started) return;
      if (!OW.viewKit) { document.addEventListener('ow:kit', go, { once: true }); return; }
      started = true; boot();
    };
    if (!('IntersectionObserver' in window)) { go(); return; }
    var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); go(); } }, { rootMargin: '700px 0px' });
    io.observe(root);
  }
  arm();

  function boot() {
    var K = OW.viewKit, tasks = K.make(), byId = {}, stages = [], cvOn = false, cvCollapsed = false, cvTimer = 0, drag = null;
    tasks.forEach(function (t) { byId[t.id] = t; });
    var cap = document.getElementById('duo-cap'), cvBtn = document.getElementById('duo-cv'), resetBtn = document.getElementById('duo-reset');
    var VN = ['Board', 'List', 'Timeline', 'Calendar', 'Table', 'Workload'];
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var say = function (m) { if (cap) cap.textContent = m; };
    var visible = function () { return tasks.filter(function (t) { return !(cvCollapsed && !t.cv); }); };
    var due = function (t) { return t.s + t.n - 1; };
    var plural = function (n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); };

    /* ---------- one stage: a row of six view keys and a canvas that draws the tasks in the chosen view ---------- */
    function Stage(el) {
      var self = this;
      this.el = el; this.cv = el.querySelector('.st-cv'); this.R = null; this.bgHTML = ''; this.items = {};
      this.view = +el.querySelector('.st-tabs [aria-pressed="true"]').getAttribute('data-v'); el.setAttribute('data-view', this.view);
      this.bg = document.createElement('div'); this.bg.className = 'st-bg'; this.cv.appendChild(this.bg);
      tasks.forEach(function (t) {
        var e = document.createElement('div'); e.className = 'it2 nofl'; e.setAttribute('role', 'button'); e.tabIndex = 0; e.setAttribute('data-id', t.id); e.innerHTML = K.layersHTML(t);
        self.cv.appendChild(e); self.items[t.id] = e; self.paint(t);
      });
      el.querySelectorAll('.st-tabs .kt').forEach(function (b) { b.addEventListener('click', function () { self.setView(+b.getAttribute('data-v')); }); });
      this.bind();
      if (window.ResizeObserver) { var raf = 0; new ResizeObserver(function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { if (!drag) self.layout(false); }); }).observe(this.cv); }
    }
    Stage.prototype.paint = function (t) {
      var e = this.items[t.id]; K.paintItem(e, t);
      e.setAttribute('data-status', K.COLS[t.st][0]); e.setAttribute('data-due', K.dateLabel(due(t))); e.setAttribute('data-days', t.n);
    };
    Stage.prototype.setView = function (v) {
      this.view = v; this.el.setAttribute('data-view', v);
      this.el.querySelectorAll('.st-tabs .kt').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-v') === v)); });
      this.layout(true);
      say('The ' + (this.el.getAttribute('data-stage') === '0' ? 'left' : 'right') + ' stage now shows the ' + VN[v].toLowerCase() + '. Same ten tasks.');
    };
    Stage.prototype.layout = function (anim, skipId) {
      var W = this.cv.clientWidth, H = this.cv.clientHeight; if (!W || !H) return;
      var v = this.view, R = this.R = K.layouts(visible(), W, H, { cp: true, all: tasks, deps: K.DEPS }), P = R.L[v], flat = v === 1 || v === 4 || v === 5, self = this;
      this.cv.classList.toggle('cp', W < 600);
      tasks.forEach(function (t) {
        var e = self.items[t.id], p = P[t.id];
        if (!p) { if (!e.classList.contains('ghost')) e.classList.add('hid'); return; }
        e.classList.remove('hid');
        e.classList.toggle('ms', !!t.ms);
        if (t.id === skipId) return;
        if (!anim) e.classList.add('nofl');
        e.style.width = p.w + 'px'; e.style.height = p.h + 'px'; e.style.borderRadius = p.r + 'px'; e.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
        e.style.borderColor = flat ? 'transparent' : ''; e.style.boxShadow = v === 5 ? 'none' : flat ? 'inset 0 -1px 0 var(--line-2)' : '';
        var lys = e.children; for (var j = 0; j < lys.length; j++) lys[j].classList.toggle('on', j === v);
        e.querySelectorAll('.ly.cell>span').forEach(function (s, k) { s.style.width = R.cols[k] + 'px'; s.style.display = R.cols[k] ? '' : 'none'; });
        if (!anim) { void e.offsetWidth; e.classList.remove('nofl'); }
      });
      var html = R.bg[v];
      if (this.bgView !== v) { this.bgView = v; this.bg.classList.add('out'); this.bg.style.transition = 'none'; void this.bg.offsetWidth; this.bg.innerHTML = html; this.bgHTML = html; this.bg.style.transition = ''; this.bg.classList.remove('out'); }
      else if (html !== this.bgHTML) { this.bg.innerHTML = html; this.bgHTML = html; }
    };
    Stage.prototype.colAt = function (x) {
      var cols = this.R.geo.cols, best = 0, bd = 1e9;
      cols.forEach(function (c, i) { var d = Math.abs(x - (c.left + c.w / 2)); if (d < bd) { bd = d; best = i; } });
      return best;
    };
    Stage.prototype.mark = function (c) { this.bg.querySelectorAll('.bg-col').forEach(function (b) { b.classList.toggle('drop', +b.getAttribute('data-col') === c); }); };

    /* ---------- changes: one place where a task changes, then every stage repaints and re-lays ---------- */
    function snap(t) { return { st: t.st, s: t.s, n: t.n, over: K.overDays(tasks, t.who) }; }
    function apply(t, patch, skip) {
      for (var k in patch) t[k] = patch[k];
      stages.forEach(function (s) { s.paint(t); s.layout(true, s === skip ? t.id : null); });
    }
    function viewsOtherThan(stage) { return stages.filter(function (s) { return s !== stage; }).map(function (s) { return s.view; }); }
    function echo(stage, what, t) {
      var o = viewsOtherThan(stage), v = o.length ? o[0] : -1;
      if (what === 'status') return v === 2 ? (t.st === 3 ? ' Its bar on the timeline is marked done.' : ' Its bar on the timeline changed colour.') : v === 4 ? ' The table row says ' + K.COLS[t.st][0] + '.' : v === 1 ? ' The list row moved too.' : v === 0 ? ' The card moved there too.' : '';
      return v === 4 ? ' The table shows the new date.' : v === 1 ? ' The list shows the new date.' : v === 3 ? ' The calendar chip moved to the new day.' : '';
    }
    function report(t, b, stage) {
      var d0 = b.s + b.n - 1, d1 = due(t), who = K.PPL[t.who][0], m = '';
      if (b.st !== t.st) m += t.id + ' moved to ' + K.COLS[t.st][0] + '. ' + (d0 === d1 ? 'Due date unchanged.' : 'Due ' + K.dateLabel(d1) + '.') + echo(stage, 'status', t);
      if (b.st === t.st && (b.s !== t.s || b.n !== t.n)) {
        var dd = d1 - d0;
        m += b.n !== t.n && dd !== 0 ? t.id + ' now runs ' + plural(t.n, 'day') + ' and is due ' + K.dateLabel(d1) + '.' : dd !== 0 ? t.id + ' is now due ' + K.dateLabel(d1) + ', ' + plural(Math.abs(dd), 'day') + (dd > 0 ? ' later' : ' earlier') + '.' : t.id + ' moved to start ' + K.dateLabel(t.s) + '.';
        m += ' Status unchanged.' + echo(stage, 'date', t);
        var ov = K.overDays(tasks, t.who);
        if (ov > b.over) m += ' ' + who + ' is over capacity on ' + plural(ov, 'day') + '.'; else if (ov < b.over) m += ' ' + who + (ov ? ' is over capacity on ' + plural(ov, 'day') + '.' : ' is back within capacity.'); else if (viewsOtherThan(stage).indexOf(5) > -1) m += ' ' + who + '’s load recalculated.';
      }
      return m || t.id + ' is where it was.';
    }

    /* ---------- pointer: drag a card between columns, a bar across days, a chip onto a day ---------- */
    Stage.prototype.bind = function () {
      var self = this, cv = this.cv;
      cv.addEventListener('pointerdown', function (e) {
        if (e.button > 0 || drag) return;
        var el = e.target.closest('.it2'); if (!el || el.classList.contains('ghost') || el.classList.contains('hid')) return;
        var v = self.view; if (v !== 0 && v !== 2 && v !== 3) return;
        var t = byId[el.getAttribute('data-id')], p = self.R.L[v][t.id]; if (!p) return;
        var rect = cv.getBoundingClientRect(), mode = 'move';
        if (v === 2 && !t.ms && e.clientX - rect.left - p.x > p.w - 12) mode = 'resize';
        drag = { stage: self, el: el, t: t, x0: e.clientX, y0: e.clientY, p: p, mode: mode, moved: false, pid: e.pointerId, rect: rect, b: snap(t), col: t.st };
        try { el.setPointerCapture(e.pointerId); } catch (x) { }
      });
      cv.addEventListener('pointermove', function (e) {
        if (!drag || drag.stage !== self) {
          if (!drag && self.view === 2) { var h = e.target.closest('.it2'); if (h) { var hp = self.R.L[2][h.getAttribute('data-id')], tt = byId[h.getAttribute('data-id')]; h.classList.toggle('ew', !!hp && !tt.ms && e.clientX - cv.getBoundingClientRect().left - hp.x > hp.w - 12); } }
          return;
        }
        if (e.pointerId !== drag.pid) return;
        var d = drag, dx = e.clientX - d.x0, dy = e.clientY - d.y0, v = self.view, g = self.R.geo, W = cv.clientWidth;
        if (!d.moved) { if (Math.hypot(dx, dy) < 4) return; d.moved = true; d.el.classList.add('drag'); }
        if (v === 0) {
          d.el.style.transform = 'translate(' + (d.p.x + dx) + 'px,' + (d.p.y + dy) + 'px)';
          d.col = self.colAt(e.clientX - d.rect.left); self.mark(d.col);
        } else if (v === 2) {
          var dd = Math.round(dx / g.dw);
          if (d.mode === 'move') {
            d.el.style.transform = 'translate(' + clamp(d.p.x + dx, 0, W - d.p.w) + 'px,' + d.p.y + 'px)';
            var s = clamp(d.b.s + dd, 0, K.DAYS - d.b.n); if (s !== d.t.s) apply(d.t, { s: s }, self);
          } else {
            d.el.style.width = clamp(d.p.w + dx, g.dw, (K.DAYS - d.b.s) * g.dw) + 'px';
            var n = clamp(d.b.n + dd, 1, K.DAYS - d.b.s); if (n !== d.t.n) apply(d.t, { n: n }, self);
          }
        } else if (v === 3) {
          d.el.style.transform = 'translate(' + (d.p.x + dx) + 'px,' + (d.p.y + dy) + 'px)';
          var s2 = clamp(d.b.s + Math.round(dx / g.cw) + 7 * Math.round(dy / g.chh), 0, K.DAYS - d.b.n); if (s2 !== d.t.s) apply(d.t, { s: s2 }, self);
        }
      });
      var end = function (e, cancel) {
        if (!drag || drag.stage !== self || e.pointerId !== drag.pid) return;
        var d = drag; drag = null; d.el.classList.remove('drag'); self.mark(-1);
        if (!d.moved) return;
        var t = d.t;
        if (cancel) { apply(t, { st: d.b.st, s: d.b.s, n: d.b.n }); say(t.id + ' put back.'); return; }
        if (self.view === 0) {
          var c = d.col, mine = tasks.filter(function (x) { return x.st === c && x !== t && !(cvCollapsed && !x.cv); }).sort(function (a, b) { return a.o - b.o; }), y = e.clientY - d.rect.top, i = 0;
          mine.forEach(function (x) { var p = self.R.L[0][x.id]; if (p && y > p.y + p.h / 2) i++; });
          var o = !mine.length ? t.o : i === 0 ? mine[0].o - 1 : i >= mine.length ? mine[mine.length - 1].o + 1 : (mine[i - 1].o + mine[i].o) / 2;
          apply(t, { st: c, o: o });
        } else { apply(t, {}); }
        say(report(t, d.b, self));
      };
      cv.addEventListener('pointerup', function (e) { end(e, false); });
      cv.addEventListener('pointercancel', function (e) { end(e, true); });

      /* keyboard: arrows on a focused card or bar. Board, list, table: left and right change the status. Timeline, calendar,
         workload: they move the due date a day (shift for resizing a bar; up and down move a calendar chip a week) */
      cv.addEventListener('keydown', function (e) {
        var el = e.target; if (!el.classList || !el.classList.contains('it2')) return;
        var k = e.key, dir = k === 'ArrowRight' ? 1 : k === 'ArrowLeft' ? -1 : 0, vert = k === 'ArrowDown' ? 1 : k === 'ArrowUp' ? -1 : 0, v = self.view, t = byId[el.getAttribute('data-id')];
        if (drag && k === 'Escape') return;
        if (!dir && !(v === 3 && vert)) return;
        e.preventDefault();
        var b = snap(t);
        if (v === 0 || v === 1 || v === 4) {
          var ns = clamp(t.st + dir, 0, 3);
          if (ns === t.st) { say(t.id + ' is already in ' + K.COLS[t.st][0] + ', the ' + (dir > 0 ? 'last' : 'first') + ' status.'); return; }
          var top = 0; tasks.forEach(function (x) { if (x.st === ns) top = Math.max(top, x.o); });
          apply(t, { st: ns, o: top + 1 }); say(report(t, b, self));
        } else if (e.shiftKey && v === 2 && !t.ms) {
          var n = clamp(t.n + dir, 1, K.DAYS - t.s); if (n === t.n) { say(t.id + ' can’t get ' + (dir > 0 ? 'longer' : 'shorter') + ' than that.'); return; }
          apply(t, { n: n }); say(report(t, b, self));
        } else {
          var s = clamp(t.s + dir + 7 * vert, 0, K.DAYS - t.n); if (s === t.s) { say(t.id + ' is at the ' + (dir + vert > 0 ? 'last' : 'first') + ' day shown.'); return; }
          apply(t, { s: s }); say(report(t, b, self));
        }
        el.focus();
      });
    };

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drag) { var d = drag; drag = null; d.el.classList.remove('drag'); d.stage.mark(-1); apply(d.t, { st: d.b.st, s: d.b.s, n: d.b.n }); say(d.t.id + ' put back.'); }
    });

    /* ---------- What the client sees: untagged tasks fade, leave faint outlines for 300 ms, then the space closes ---------- */
    function setCV(on) {
      cvOn = on; cvBtn.setAttribute('aria-pressed', String(on)); clearTimeout(cvTimer);
      var hide = tasks.filter(function (t) { return !t.cv; }), seen = tasks.length - hide.length;
      if (on) {
        cvCollapsed = false;
        stages.forEach(function (s) { hide.forEach(function (t) { s.items[t.id].classList.add('ghost'); }); });
        cvTimer = setTimeout(function () {
          cvCollapsed = true;
          stages.forEach(function (s) { hide.forEach(function (t) { var e = s.items[t.id]; e.classList.remove('ghost'); e.classList.add('hid'); }); s.layout(true); });
        }, 300);
        say('Client view: ' + plural(seen, 'task') + ' of ' + tasks.length + ' carry the client-visible tag. The other ' + hide.length + ' disappear from both stages, and so would their budgets and internal comments.');
      } else {
        cvCollapsed = false;
        stages.forEach(function (s) { hide.forEach(function (t) { s.items[t.id].classList.remove('ghost', 'hid'); }); s.layout(true); });
        say('Client view off. All ' + tasks.length + ' tasks are back, with their owners and budgets.');
      }
    }
    cvBtn.addEventListener('click', function () { setCV(cvBtn.getAttribute('aria-pressed') !== 'true'); });
    resetBtn.addEventListener('click', function () {
      clearTimeout(cvTimer); K.make().forEach(function (n, i) { for (var k in n) tasks[i][k] = n[k]; });
      cvOn = false; cvCollapsed = false; cvBtn.setAttribute('aria-pressed', 'false');
      stages.forEach(function (s) { tasks.forEach(function (t) { s.items[t.id].classList.remove('ghost', 'hid'); s.paint(t); }); s.layout(true); });
      say('The ten tasks are back exactly as they started.');
    });

    root.querySelectorAll('.stage').forEach(function (el) { stages.push(new Stage(el)); });
    stages.forEach(function (s) { s.layout(false); });
    OW.duo = { tasks: tasks, stages: stages };
    root.classList.add('ready');
  }
})();
