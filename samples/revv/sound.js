/* Revv cold start: one button that starts the engine from cold. Starter, catch, a flare of revs, then a cold fast idle that
   settles, with a live waveform and a rev trace. Synthesised in Web Audio from the engine layout (cylinders, firing order),
   so nothing is downloaded and it is not presented as a recording of this vehicle. Loaded only when the button is pressed.
   window.ColdStart.play(box, listing) -> { stop() } */
(function () {
  'use strict';
  function layout(l) {
    var e = String((l.spec && (l.spec.engine || l.spec.motor)) || '').toLowerCase(), cc = parseInt(e.replace(/[^0-9.]/g, ''), 10) || 0;
    var cyl = /v8/.test(e) ? 8 : /v6|six/.test(e) ? 6 : /v4|four|i4/.test(e) ? 4 : /triple|three/.test(e) ? 3 : /twin/.test(e) ? 2 : /single/.test(e) ? 1 : 4;
    if (l.type === 'car' && cyl === 4 && /4\.0|5\.0|v8/.test(e)) cyl = 8;
    return { cyl: cyl, uneven: /v-twin|l-twin|v4|v8|bobber|cruiser/.test(e + ' ' + l.body), idle: l.type === 'bike' ? (cyl <= 2 ? 1100 : 1300) : (cyl >= 8 ? 700 : 800), peak: l.type === 'bike' ? (cyl >= 4 ? 4600 : 3400) : (cyl >= 8 ? 3200 : 2800), cc: cc };
  }
  function rpmAt(t, p) {
    if (t < 0.9) return 210 + 50 * Math.sin(t * 38);                               // cranking on the starter
    if (t < 1.3) { var u = (t - 0.9) / 0.4; return 210 + (p.peak - 210) * (1 - Math.pow(1 - u, 3)); } // it catches and flares
    if (t < 2.5) { var v = (t - 1.3) / 1.2; return p.peak - (p.peak - p.idle * 1.4) * (1 - Math.pow(1 - v, 2)); }
    if (t < 7.5) return p.idle * 1.4 - p.idle * 0.4 * ((t - 2.5) / 5) + Math.sin(t * 3.3) * 28;     // cold fast idle, settling
    return p.idle + Math.sin(t * 2.4) * 22;
  }
  var DUR = 10;
  function play(box, l) {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    var ctx = new AC(), p = layout(l), out = ctx.createGain(), comp = ctx.createDynamicsCompressor(), an = ctx.createAnalyser(); an.fftSize = 1024;
    out.gain.value = 0; out.connect(comp); comp.connect(an); an.connect(ctx.destination);
    var eng = ctx.createGain(); eng.gain.value = 0; eng.connect(out);
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 6; lp.connect(eng);
    var o1 = ctx.createOscillator(); o1.type = 'sawtooth'; var g1 = ctx.createGain(); g1.gain.value = 0.5; o1.connect(g1); g1.connect(lp);
    var o2 = ctx.createOscillator(); o2.type = 'square'; var g2 = ctx.createGain(); g2.gain.value = p.uneven ? 0.32 : 0.1; o2.connect(g2); g2.connect(lp);
    var nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nb.getChannelData(0); for (var i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    var ns = ctx.createBufferSource(); ns.buffer = nb; ns.loop = true; var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
    var ng = ctx.createGain(); ng.gain.value = 0.12; ns.connect(bp); bp.connect(ng); ng.connect(eng);
    var lfo = ctx.createOscillator(); lfo.type = 'square'; var lg = ctx.createGain(); lg.gain.value = 0.1; lfo.connect(lg); lg.connect(ng.gain);
    var so = ctx.createOscillator(); so.type = 'square'; so.frequency.value = 92; var sl = ctx.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 700;
    var sg = ctx.createGain(); sg.gain.value = 0; so.connect(sl); sl.connect(sg); sg.connect(out);
    var T0 = ctx.currentTime + 0.06;
    [o1, o2, ns, lfo, so].forEach(function (n) { n.start(T0); });
    out.gain.setTargetAtTime(0.6, T0, 0.04);
    sg.gain.setValueAtTime(0.16, T0); sg.gain.setTargetAtTime(0, T0 + 0.9, 0.04);
    eng.gain.setValueAtTime(0, T0 + 0.88); eng.gain.linearRampToValueAtTime(1.15, T0 + 0.96); eng.gain.setTargetAtTime(0.85, T0 + 1.4, 0.4);
    out.gain.setTargetAtTime(0, T0 + DUR - 0.8, 0.25);

    var wave = box.querySelector('.cold-w'), trace = box.querySelector('.cold-r'), lab = box.querySelector('.cold-rpm'), wc = wave.getContext('2d'), tc = trace.getContext('2d');
    var dpr = Math.min(2, devicePixelRatio || 1); [wave, trace].forEach(function (c) { c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; });
    var buf = new Uint8Array(an.fftSize), hist = [], raf = 0, done = false;
    tc.clearRect(0, 0, trace.width, trace.height);
    function frame() {
      var t = ctx.currentTime - T0; if (t > DUR) { stop(); return; }
      var rpm = Math.max(0, rpmAt(Math.max(0, t), p)), f = rpm / 60 * p.cyl / 2, now = ctx.currentTime;
      o1.frequency.setTargetAtTime(Math.max(8, f), now, 0.02); o2.frequency.setTargetAtTime(Math.max(4, f / 2), now, 0.02); lfo.frequency.setTargetAtTime(Math.max(4, f), now, 0.02);
      lp.frequency.setTargetAtTime(260 + rpm * 0.55, now, 0.03); bp.frequency.setTargetAtTime(500 + rpm * 0.35, now, 0.05);
      // waveform
      an.getByteTimeDomainData(buf); var W = wave.width, H = wave.height; wc.clearRect(0, 0, W, H); wc.lineWidth = 2 * dpr; wc.strokeStyle = '#ff5b1f'; wc.beginPath();
      for (var i = 0; i < buf.length; i += 2) { var x = i / buf.length * W, y = (buf[i] / 255) * H; if (i) wc.lineTo(x, y); else wc.moveTo(x, y); } wc.stroke();
      // rev trace
      hist.push([t, rpm]); var TW = trace.width, TH = trace.height, top = p.peak * 1.15; tc.clearRect(0, 0, TW, TH);
      tc.strokeStyle = 'rgba(237,234,227,.14)'; tc.lineWidth = 1 * dpr; [0.25, 0.5, 0.75].forEach(function (g) { tc.beginPath(); tc.moveTo(0, TH * g); tc.lineTo(TW, TH * g); tc.stroke(); });
      tc.strokeStyle = '#edeae3'; tc.lineWidth = 2 * dpr; tc.beginPath(); hist.forEach(function (h, k) { var x = h[0] / DUR * TW, y = TH - h[1] / top * TH; if (k) tc.lineTo(x, y); else tc.moveTo(x, y); }); tc.stroke();
      if (lab) lab.textContent = Math.round(rpm / 10) * 10 + ' rpm';
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    function stop() {
      if (done) return; done = true; cancelAnimationFrame(raf); try { out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(0, ctx.currentTime, 0.08); } catch (e) {}
      setTimeout(function () { try { ctx.close(); } catch (e) {} }, 400); if (lab) lab.textContent = 'idle ' + p.idle + ' rpm'; box.dispatchEvent(new CustomEvent('cold:end'));
    }
    return { stop: stop, layout: p };
  }
  window.ColdStart = { play: play, layout: layout };
})();
