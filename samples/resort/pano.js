/* Taradhura: a tiny 360° viewer (plain WebGL, no library). Samples an equirectangular photo per pixel from yaw/pitch/fov.
   TD.pano(el, src, opts) -> { start(), dispose() }. Drag (with inertia), wheel or pinch to zoom, arrow keys, +/-. */
(function () {
  'use strict';
  var TD = window.TD = window.TD || {};
  var VS = 'attribute vec2 p; varying vec2 v; void main(){ v = p; gl_Position = vec4(p, 0.0, 1.0); }';
  var FS = 'precision highp float; varying vec2 v; uniform sampler2D t; uniform float yaw, pitch, fov, asp;\n' +
    'void main(){ float f = tan(fov * 0.5); vec3 d = normalize(vec3(v.x * f * asp, v.y * f, -1.0));\n' +
    ' float cp = cos(pitch), sp = sin(pitch); d = vec3(d.x, d.y * cp + d.z * sp, -d.y * sp + d.z * cp);\n' +
    ' float cy = cos(yaw), sy = sin(yaw); d = vec3(d.x * cy + d.z * sy, d.y, -d.x * sy + d.z * cy);\n' +
    ' float lon = atan(d.x, -d.z), lat = asin(clamp(d.y, -1.0, 1.0));\n' +
    ' vec2 uv = vec2(0.5 + lon / 6.2831853, 0.5 - lat / 3.1415927);\n' +
    ' gl_FragColor = texture2D(t, uv); }';
  TD.pano = function (el, src, opts) {
    opts = opts || {};
    var cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true'); el.insertBefore(cv, el.firstChild);
    var gl = cv.getContext('webgl', { antialias: false, alpha: false }); if (!gl) { cv.remove(); return null; }
    function sh(type, s) { var o = gl.createShader(type); gl.shaderSource(o, s); gl.compileShader(o); return o; }
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['yaw', 'pitch', 'fov', 'asp'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
    var tex = gl.createTexture(), ready = false;
    var img = new Image(); img.decoding = 'async';
    img.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      ready = true; el.classList.add('live'); opts.onReady && opts.onReady(); draw();
    };
    img.src = src;
    var yaw = opts.yaw || 0, pitch = opts.pitch || 0, minP = opts.minPitch == null ? -1.1 : opts.minPitch, fov = 1.35, vy = 0, vp = 0, drag = false, lx = 0, ly = 0, raf = 0, idle = 0, auto = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    function size() { var r = el.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 1.75); cv.width = r.width * d; cv.height = r.height * d; gl.viewport(0, 0, cv.width, cv.height); }
    function draw() {
      if (!ready) return;
      gl.uniform1f(U.yaw, yaw); gl.uniform1f(U.pitch, pitch); gl.uniform1f(U.fov, fov); gl.uniform1f(U.asp, cv.width / cv.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      opts.onTurn && opts.onTurn(yaw);
    }
    function loop() {
      if (!drag) { yaw += vy; pitch += vp; vy *= 0.94; vp *= 0.9; if (auto && Math.abs(vy) < 0.0004 && performance.now() - idle > 2500) yaw += 0.0007; }
      pitch = Math.max(minP, Math.min(1.1, pitch));
      draw(); raf = requestAnimationFrame(loop);
    }
    function down(e) { drag = true; el.classList.add('drag'); lx = e.clientX; ly = e.clientY; vy = vp = 0; idle = performance.now(); el.setPointerCapture && el.setPointerCapture(e.pointerId); }
    function move(e) { if (!drag) return; var k = fov / el.clientHeight; var dx = (e.clientX - lx) * k, dy = (e.clientY - ly) * k; yaw -= dx; pitch += dy; vy = -dx; vp = dy; lx = e.clientX; ly = e.clientY; idle = performance.now(); }
    function up() { drag = false; el.classList.remove('drag'); idle = performance.now(); }
    var pinch = null;
    el.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch' && !e.isPrimary) return; down(e); });
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', function (e) { if (!ready) return; e.preventDefault(); fov = Math.max(0.6, Math.min(1.75, fov + e.deltaY * 0.0012)); idle = performance.now(); }, { passive: false });
    el.addEventListener('touchmove', function (e) { if (e.touches.length === 2) { var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (pinch) fov = Math.max(0.6, Math.min(1.75, fov * pinch / d)); pinch = d; e.preventDefault(); } }, { passive: false });
    el.addEventListener('touchend', function () { pinch = null; });
    el.addEventListener('keydown', function (e) {
      var k = e.key; if (k === 'ArrowLeft') vy = -0.04; else if (k === 'ArrowRight') vy = 0.04; else if (k === 'ArrowUp') vp = 0.03; else if (k === 'ArrowDown') vp = -0.03;
      else if (k === '+' || k === '=') fov = Math.max(0.6, fov - 0.15); else if (k === '-') fov = Math.min(1.75, fov + 0.15); else return;
      e.preventDefault(); idle = performance.now();
    });
    var ro = new ResizeObserver(function () { size(); draw(); }); ro.observe(el); size();
    var io = new IntersectionObserver(function (es) { cancelAnimationFrame(raf); if (es[0].isIntersecting) loop(); }); io.observe(el);
    return { dispose: function () { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); cv.remove(); } };
  };
})();
