/* Ghatika: wind the Prahar. The crown is the control (drag it, use the arrow keys, or hold "Wind it").
   The power reserve (0–72 h, the Prahar's own figure) is kept for each visitor with a timestamp and runs down in real time:
   come back two days later and the watch has nearly stopped; leave it longer and it shows the time it stopped at.
   The tick is synthesised with Web Audio (no sound file) and is off until the visitor turns it on.
   window.GHWind = { timeFn, reserve(), running(), add(detents), attach(opts), sound(on) } */
(function () {
  'use strict';
  var KEY = 'ghatika:reserve', FULL = 72, PER = 1.5, STEP = Math.PI / 6, RATIO = 0.34; // 1.5 h a detent, 12 detents a turn
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function load() { try { var v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && typeof v.h === 'number' && typeof v.t === 'number') return v; } catch (e) {} return { h: 0, t: Date.now(), wound: false }; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  var st = load();
  var crown = 0, ratchet = 0, listeners = [], setFrom = null, setAt = 0;
  function reserve() { return Math.max(0, st.h - (Date.now() - st.t) / 3.6e6); }
  function running() { return reserve() > 0; }
  function stopMs() { return st.wound ? st.t + st.h * 3.6e6 : 0; }
  function hm(d) { return { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() + d.getMilliseconds() / 1000 }; }
  // what the hands show: 10:10:31 until it is first wound; the local time while it runs (the atelier set it);
  // the moment it stopped once the reserve is spent. Winding a stopped watch sets it: the hands glide to now.
  function timeFn() {
    if (!st.wound) return { h: 10, m: 10, s: 31, run: false };
    if (!running()) { var t = hm(new Date(stopMs())); t.run = false; return t; }
    var now = hm(new Date()); now.run = true;
    if (setFrom) {
      var k = Math.min(1, (performance.now() - setAt) / (reduce ? 1 : 1400)), e = 1 - Math.pow(1 - k, 3);
      var a = setFrom.h * 3600 + setFrom.m * 60 + setFrom.s, b = now.h * 3600 + now.m * 60 + now.s; if (b < a) b += 12 * 3600; if (b - a > 12 * 3600) a += 12 * 3600;
      var v = a + (b - a) * e; now = { h: Math.floor(v / 3600) % 24, m: Math.floor(v / 60) % 60, s: v % 60, run: k >= 1 };
      if (k >= 1) setFrom = null;
    }
    return now;
  }
  function emit() { listeners.forEach(function (f) { try { f(reserve(), running()); } catch (e) {} }); }
  function add(n) {
    if (!n) return;
    if (n > 0) {
      var wasStopped = !running();
      if (wasStopped) { setFrom = timeFn(); setAt = performance.now(); }
      st.h = Math.min(FULL, reserve() + n * PER); st.t = Date.now(); st.wound = true; save();
      ratchet -= n * STEP * RATIO; click(n); buzz();
    }
    crown += n * STEP; emit();
  }

  // ---------- sound: a short filtered noise burst for each beat and each ratchet tooth
  var ac = null, on = false, tickT = 0, active = true;
  try { on = localStorage.getItem('ghatika:sound') === '1'; } catch (e) {}
  function ctx() { if (!ac) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ac = new C(); } if (ac.state === 'suspended') ac.resume(); return ac; }
  function burst(freq, gain, dur, when) {
    var c = ctx(); if (!c) return; var t = when || c.currentTime, n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 6);
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 9; g.gain.value = gain;
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(t);
  }
  function click(n) { if (!on) return; for (var i = 0; i < Math.min(n, 6); i++) burst(1900 + Math.random() * 300, 0.32, 0.012, (ctx() || {}).currentTime + i * 0.03); }
  function buzz() { if (navigator.vibrate && matchMedia('(pointer: coarse)').matches) try { navigator.vibrate(4); } catch (e) {} }
  function loop() {
    clearInterval(tickT); tickT = 0;
    if (!on || !active) return;
    var beat = 0; tickT = setInterval(function () { if (!running() || document.hidden) return; burst(beat % 2 ? 3600 : 4200, beat % 2 ? 0.07 : 0.1, 0.006); beat++; }, 1000 / 6);
  }
  function sound(v) { on = !!v; try { localStorage.setItem('ghatika:sound', on ? '1' : '0'); } catch (e) {} if (on) ctx(); loop(); emit(); }

  // ---------- the controls
  function attach(o) {
    var crownBtn = o.crown, windBtn = o.button, sndBtn = o.sound, arcFill = o.arcFill, hand = o.hand, val = o.value, live = o.live;
    // drag the crown: up (or right) winds; down turns it back and the click holds the ratchet
    var dragging = false, lastX = 0, lastY = 0, acc = 0;
    crownBtn.addEventListener('pointerdown', function (e) { dragging = true; lastX = e.clientX; lastY = e.clientY; acc = 0; crownBtn.setPointerCapture(e.pointerId); crownBtn.classList.add('turning'); if (o.onGrab) o.onGrab(true); e.preventDefault(); });
    crownBtn.addEventListener('pointermove', function (e) {
      if (!dragging) return; var dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
      acc += Math.abs(dy) >= Math.abs(dx) ? -dy : dx;
      while (acc >= 16) { acc -= 16; add(1); } while (acc <= -16) { acc += 16; add(-1); }
    });
    var up = function () { if (!dragging) return; dragging = false; crownBtn.classList.remove('turning'); if (o.onGrab) o.onGrab(false); };
    crownBtn.addEventListener('pointerup', up); crownBtn.addEventListener('pointercancel', up);
    crownBtn.addEventListener('keydown', function (e) {
      var n = { ArrowUp: 2, ArrowRight: 2, ArrowDown: -2, ArrowLeft: -2, Enter: 8, ' ': 8 }[e.key]; if (!n) return;
      e.preventDefault(); add(n); if (o.onGrab) { o.onGrab(true); clearTimeout(attach.kt); attach.kt = setTimeout(function () { o.onGrab(false); }, 1200); }
    });
    // "Wind it": hold to keep winding, or press once for a turn
    var hold = 0, held = false;
    windBtn.addEventListener('pointerdown', function (e) { held = false; clearInterval(hold); if (o.onGrab) o.onGrab(true); hold = setInterval(function () { held = true; add(1); }, 70); windBtn.setPointerCapture(e.pointerId); });
    var stopHold = function () { clearInterval(hold); hold = 0; if (o.onGrab) setTimeout(function () { o.onGrab(false); }, 900); };
    windBtn.addEventListener('pointerup', stopHold); windBtn.addEventListener('pointercancel', stopHold);
    windBtn.addEventListener('click', function () { if (!held) add(8); held = false; });
    if (sndBtn) {
      sndBtn.addEventListener('click', function () { sound(!on); });
    }
    var lastSay = 0;
    function paint(r, run) {
      var f = r / FULL, a0 = Math.PI, a = Math.PI * (1 - f);
      if (arcFill) arcFill.setAttribute('d', f <= 0.001 ? 'M0 0' : 'M' + (60 + 46 * Math.cos(a0)).toFixed(2) + ' ' + (58 - 46 * Math.sin(a0)).toFixed(2) + ' A46 46 0 0 1 ' + (60 + 46 * Math.cos(a)).toFixed(2) + ' ' + (58 - 46 * Math.sin(a)).toFixed(2));
      if (hand) hand.setAttribute('transform', 'rotate(' + (-90 + f * 180).toFixed(2) + ' 60 58)');
      var txt = run ? Math.ceil(r) + ' h' : 'Stopped'; // a running watch never reads 0 h
      if (val) val.textContent = txt;
      if (o.root) { o.root.classList.toggle('running', run); o.root.classList.toggle('full', r >= FULL - 0.01); }
      if (sndBtn) { sndBtn.setAttribute('aria-pressed', on); sndBtn.setAttribute('aria-label', on ? 'Sound of the movement: on' : 'Sound of the movement: off'); sndBtn.classList.toggle('on', on); }
      if (crownBtn) crownBtn.setAttribute('aria-valuenow', Math.ceil(r)), crownBtn.setAttribute('aria-valuetext', run ? Math.ceil(r) + ' hours of power reserve' : 'Stopped. Turn the crown to wind it.');
      if (live && performance.now() - lastSay > 1500) { lastSay = performance.now(); live.textContent = run ? 'Power reserve ' + Math.ceil(r) + ' hours' + (r >= FULL - 0.01 ? ', fully wound.' : '.') : 'The watch has stopped.'; }
      if (o.onChange) o.onChange(r, run, crown, ratchet);
    }
    listeners.push(paint); paint(reserve(), running());
    setInterval(function () { paint(reserve(), running()); }, 30000);
  }
  function setActive(v) { if (active === !!v) return; active = !!v; loop(); }
  document.addEventListener('visibilitychange', loop);
  loop();
  window.GHWind = { timeFn: timeFn, reserve: reserve, running: running, add: add, attach: attach, sound: sound, setActive: setActive, angles: function () { return { crown: crown, ratchet: ratchet }; }, full: FULL };
})();
