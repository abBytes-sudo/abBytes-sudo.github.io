/* The arcade shell: a full-screen overlay that any game runs inside. Loaded only when a game card is clicked; each game is its own file.
   A game registers { title, how: [lines], tie: [line, href, label], start(ctx), key(e) }. ctx gives it the stage, score, level, end(), loop(), beep(). */
(function () {
  'use strict';
  var d = document, root = d.documentElement, base = root.dataset.base || '', G = {}, ov, body, card, cur = null, id = '', S = {}, snd = false, ac = null, raf = 0, els = {};
  function E(t, c, x) { var e = d.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; }
  function B(x, c, fn) { var b = E('button', c, x); b.type = 'button'; b.addEventListener('click', fn); return b; }
  function best(v) { try { var o = +localStorage.getItem('am-best-' + id) || 0; if (v !== undefined && v > o) { localStorage.setItem('am-best-' + id, v); o = v; } return o; } catch (e) { return v || 0; } }
  function beep(f, t) { if (!snd) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); var o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.value = .07; o.connect(g); g.connect(ac.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + (t || .13)); o.stop(ac.currentTime + (t || .13)); } catch (e) { /* no audio */ } }
  function build() {
    ov = E('div', 'arc'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); var bar = E('div', 'arc-bar');
    els.t = E('b', 'arc-t'); els.s = E('span', 'arc-s'); els.l = E('span', 'arc-l');
    els.snd = B('Sound: off', 'arc-b', function () { snd = !snd; els.snd.textContent = 'Sound: ' + (snd ? 'on' : 'off'); beep(520); });
    els.p = B('Pause', 'arc-b', pause); bar.appendChild(els.t); bar.appendChild(els.s); bar.appendChild(els.l); bar.appendChild(els.snd); bar.appendChild(els.p); bar.appendChild(B('Exit (Esc)', 'arc-b', close));
    body = E('div', 'arc-body'); card = E('div', 'arc-card'); ov.appendChild(bar); ov.appendChild(body); ov.appendChild(card); d.body.appendChild(ov);
  }
  function panel(h, lines, btns, extra) { card.textContent = ''; var p = E('div', 'arc-p'); p.appendChild(E('h2', '', h)); lines.forEach(function (l) { p.appendChild(E('p', '', l)); }); if (extra) p.appendChild(extra); var a = E('div', 'arc-a'); btns.forEach(function (b) { a.appendChild(b); }); p.appendChild(a); card.appendChild(p); card.classList.add('on'); var f = p.querySelector('button'); if (f) f.focus(); }
  function intro() {
    els.t.textContent = cur.title; els.s.textContent = ''; els.l.textContent = ''; els.p.hidden = !!cur.own; var ul = E('ul'); cur.how.forEach(function (l) { ul.appendChild(E('li', '', l)); });
    panel(cur.title, cur.own ? [] : [best() ? 'Your best: ' + best() : 'No score yet.'], [B('Play', 'arc-go', play), B('Exit', 'arc-x', close)], ul);
  }
  function play() {
    card.classList.remove('on'); body.textContent = ''; cancelAnimationFrame(raf); S = { score: 0, over: false, paused: false }; els.s.textContent = cur.own ? '' : 'Score 0'; els.l.textContent = ''; els.p.textContent = 'Pause';
    cur.start({ root: body, base: base, beep: beep, score: function (n) { S.score = n; els.s.textContent = 'Score ' + n; }, level: function (n) { els.l.textContent = 'Level ' + n; beep(880, .2); }, end: end, shake: function () { body.classList.remove('shake'); void body.offsetWidth; body.classList.add('shake'); },
      loop: function (fn) { var last = 0; (function f(now) { raf = requestAnimationFrame(f); var dt = Math.min(.05, (now - last) / 1000 || .016); last = now; if (!S.paused && !S.over) fn(dt); })(performance.now()); } });
  }
  function end(score, line) {
    if (S.over) return; S.over = true; var was = best(), b = best(score), a = d.createElement('a'); a.className = 'arc-link'; a.href = cur.tie[1].indexOf('#') === 0 ? cur.tie[1] : (base ? '' : '../') + cur.tie[1]; a.textContent = cur.tie[2] + ' →';
    beep(score > was ? 990 : 330, .4); panel(score > was && score ? 'New best: ' + score : 'Score: ' + score, [line || '', 'Best: ' + b, cur.tie[0]], [B('Play again', 'arc-go', play), B('Exit', 'arc-x', close)], a);
  }
  function pause() { if (S.over || !cur || cur.own || card.classList.contains('on') && !S.paused) return; S.paused = !S.paused; els.p.textContent = S.paused ? 'Resume' : 'Pause'; if (S.paused) panel('Paused', ['Press P or Resume to carry on.'], [B('Resume', 'arc-go', pause), B('Exit', 'arc-x', close)]); else card.classList.remove('on'); }
  function close() { cancelAnimationFrame(raf); S.over = true; if (cur && cur.stop) cur.stop(); ov.classList.remove('on'); root.classList.remove('arc-open'); body.textContent = ''; card.classList.remove('on'); cur = null; d.dispatchEvent(new Event('arcade-close')); }
  function show(g) { if (!ov) build(); id = g; cur = G[g]; root.classList.add('arc-open'); void ov.offsetWidth; ov.classList.add('on'); intro(); }
  d.addEventListener('keydown', function (e) {
    if (!cur) return; if (e.key === 'Escape') { close(); return; } if ((e.key === 'p' || e.key === 'P') && !cur.own) { pause(); return; }
    if (cur.key && !S.paused && !S.over && !card.classList.contains('on')) cur.key(e);
  });
  window.Arcade = { reg: function (g, o) { G[g] = o; }, open: function (g) { if (G[g]) return show(g); var s = d.createElement('script'); s.src = base + 'g-' + g + '.js?v=2'; s.onload = function () { show(g); }; d.head.appendChild(s); } };
})();
