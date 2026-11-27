/* Ashlar & Co. · one stone, sixteen hours. A full-bleed face of sandstone under a low raking light. Scrolling works it through
   five stops: rough, sawn, bush-hammered, a drafted margin, then set in the wall. The colour comes from the sandstone texture
   the lab already uses; the relief of each finish is generated in the shader and lit as a normal map; the last stop is that
   texture's own normal map. The light follows the scroll and the pointer. Without WebGL the band shows a photograph. */
(function () {
  'use strict';
  var sec = document.getElementById('stone'), cv = document.getElementById('stoneCv'); if (!sec || !cv) return;
  var stops = [].slice.call(sec.querySelectorAll('.stops button')), live = document.getElementById('stoneLive');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, N = 5, T = [.3, 1.4, 2.4, 3.4, 4.75];
  var gl = null, U = {}, ready = false, raf = 0, forced = reduce ? T[0] / N : null, ptx = .5, pty = .5, cur = -1, started = false;
  function clamp(x) { return Math.min(1, Math.max(0, x)); }
  function progress() { if (forced !== null) return forced; var r = sec.getBoundingClientRect(), span = r.height - innerHeight; return span > 10 ? clamp(-r.top / span) : .5; }

  var VS = 'attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision highp float;',
    'uniform sampler2D D,Nm,A;uniform vec2 R;uniform float S0,S1,F,TH;varying vec2 v;',
    'float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}',
    'float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec2(17.1,9.2);a*=.5;}return s;}',
    'float cell(vec2 p){vec2 i=floor(p),f=fract(p);float d=1.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y));vec2 o=vec2(h21(i+g),h21(i+g+7.3));d=min(d,length(g+o-f));}return d;}',
    // the relief of each finish, in face units (the face is one unit tall)
    'vec2 wp(vec2 p){return p+.35*vec2(fbm(p*1.7),fbm(p*1.7+5.2))-.17;}',
    'float hR(vec2 p){vec2 w=wp(p);return .16*fbm(w*2.2)+.07*fbm(w*7.)+.025*fbm(w*26.)+.03*(1.-abs(vn(w*9.)*2.-1.));}',
    'float hS(vec2 p){vec2 w=wp(p*.5)*2.;return .0006*sin((p.y+.03*sin(p.x*1.3)+.012*fbm(p*3.))*380.)*(.35+.65*fbm(p*2.2))+.0035*fbm(p*70.)+.006*fbm(w*3.);}',
    'float hB(vec2 p){float c=cell(p*88.),c2=cell(p*150.+3.1);return -.009*(1.-smoothstep(.05,.42,c))-.005*(1.-smoothstep(.05,.4,c2))+.004*fbm(p*130.)+.008*fbm(wp(p)*3.);}',
    'float hM(vec2 p,vec2 q){float ax=R.x/R.y,dx=min(q.x,1.-q.x)*ax,dy=min(q.y,1.-q.y),d=min(dx,dy),band=.075;',
    '  float tool=dx<dy?.0012*sin(q.y*820.+fbm(p*6.)*4.):.0012*sin(q.x*ax*820.+fbm(p*6.)*4.);',
    '  float m=.01+tool+.003*fbm(p*70.);return mix(m,hB(p),smoothstep(band,band+.01,d));}',
    'float H(float s,vec2 p,vec2 q){if(s<.5)return hR(p);if(s<1.5)return hS(p);if(s<2.5)return hB(p);return hM(p,q);}',
    'vec3 nrmP(float s,vec2 p,vec2 q){float e=1.5/R.y,k=s<.5?1.:(s<1.5?1.1:1.2);float h=H(s,p,q),hx=H(s,p+vec2(e,0.),q+vec2(e*R.y/R.x,0.)),hy=H(s,p+vec2(0.,e),q+vec2(0.,e));vec3 g=vec3((h-hx)/e*k,(h-hy)/e*k,0.);vec3 t=texture2D(Nm,vec2(.37,.22)+q*vec2(.25,.16)).rgb*2.-1.;t.y=-t.y;return normalize(vec3(t.xy*.8,1.)+g);}',
    // the colour of one block of the sandstone, magnified, with a grain the texture cannot hold at this size
    'vec3 albP(float s,vec2 p,vec2 q){vec3 c=pow(texture2D(D,vec2(.37,.22)+q*vec2(.25,.16)).rgb,vec3(2.2));float g=.88+.24*fbm(p*22.);',
    '  if(s<.5)g*=.82+.3*fbm(wp(p)*2.5);else if(s<1.5)g*=1.04;else g*=1.1;return c*g;}',
    'void main(){vec2 q=v,p=vec2(q.x*R.x/R.y,q.y);',
    '  vec3 n0,n1,a0,a1;float ao=1.;',
    '  if(S0<3.5){n0=nrmP(S0,p,q);a0=albP(S0,p,q);}else{vec2 w=vec2(.08,.06)+vec2(q.x*R.x/R.y,q.y)*.62;n0=normalize(texture2D(Nm,w).rgb*2.-1.);n0.y=-n0.y;a0=pow(texture2D(D,w).rgb,vec3(2.2));ao=texture2D(A,w).r;}',
    '  vec3 n=n0,alb=a0;',
    '  if(F>.001){if(S1<3.5){n1=nrmP(S1,p,q);a1=albP(S1,p,q);}else{vec2 w=vec2(.08,.06)+vec2(q.x*R.x/R.y,q.y)*.62;n1=normalize(texture2D(Nm,w).rgb*2.-1.);n1.y=-n1.y;a1=pow(texture2D(D,w).rgb,vec3(2.2));ao=mix(1.,texture2D(A,w).r,F);}n=normalize(mix(n0,n1,F));alb=mix(a0,a1,F);}',
    // a low warm sun across the face
    '  vec3 L=normalize(vec3(cos(TH)*.96,sin(TH)*.96,.3)),V=vec3(0.,0.,1.),Hh=normalize(L+V);',
    '  float dif=max(dot(n,L),0.),spe=pow(max(dot(n,Hh),0.),28.)*.05;',
    '  vec3 col=alb*(vec3(.16,.15,.14)*ao+vec3(1.,.86,.68)*dif*1.55)+spe;',
    '  col*=1.-.38*pow(length(q-vec2(.55,.45))*1.2,2.);',
    '  col=col/(col+.72)*1.62;gl_FragColor=vec4(pow(col,vec3(1./2.2)),1.);}'
  ].join('\n');

  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
  function tex(unit, url, done) {
    var t = gl.createTexture(), im = new Image(); im.decoding = 'async';
    im.onload = function () { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im); gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); done(); };
    im.onerror = function () { fail(); }; im.src = url;
  }
  function fail() { gl = null; sec.classList.add('nogl'); }
  function start() {
    if (started) return; started = true;
    try { gl = cv.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false }); } catch (e) { gl = null; }
    if (!gl) return fail();
    var hp = gl.getShaderPrecisionFormat && gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    var fs = hp && hp.precision > 0 ? FS : FS.replace('precision highp float;', 'precision mediump float;');
    var vs = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, fs); if (!vs || !f) return fail();
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, f); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return fail();
    gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['R', 'S0', 'S1', 'F', 'TH', 'D', 'Nm', 'A'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
    gl.uniform1i(U.D, 0); gl.uniform1i(U.Nm, 1); gl.uniform1i(U.A, 2);
    var n = 3, base = 'tex/sandstone_blocks_08/';
    function one() { if (--n === 0 && gl) { ready = true; kick(); } }
    tex(0, base + 'diff.jpg', one); tex(1, base + 'nor.jpg', one); tex(2, base + 'arm.jpg', one);
  }
  function place() { var hd = document.getElementById('hd'), off = hd ? Math.max(0, Math.round(hd.getBoundingClientRect().bottom)) : 0; cv.style.top = off + 'px'; cv.style.height = 'calc(100% - ' + off + 'px)'; }
  function render() {
    raf = 0; var p = progress(), s = p * N, a = Math.min(4, Math.floor(s)), t = s - a, f = a >= 4 ? 0 : Math.max(0, Math.min(1, (t - .62) / .38));
    f = f * f * (3 - 2 * f);
    var k = Math.min(4, Math.floor(s + .1)); if (k !== cur) { cur = k; stops.forEach(function (bt, i) { bt.setAttribute('aria-pressed', String(i === k)); }); }
    if (!gl || !ready) return;
    var dpr = Math.min(1.25, (devicePixelRatio || 1) * .8), w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
    gl.uniform2f(U.R, w, h); gl.uniform1f(U.S0, a); gl.uniform1f(U.S1, Math.min(4, a + 1)); gl.uniform1f(U.F, f);
    // the sun walks across the face as you scroll, and leans toward the pointer
    gl.uniform1f(U.TH, -2.55 + p * 1.6 + (ptx - .5) * .9 + (pty - .5) * .35);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(render); }
  stops.forEach(function (bt, i) {
    bt.addEventListener('click', function () {
      var target = T[i] / N;
      if (reduce) { forced = target; kick(); }
      else { var r = sec.getBoundingClientRect(), span = r.height - innerHeight; var y = scrollY + r.top + span * target, L = window.Motion && Motion.lenis; if (L) L.scrollTo(y, { duration: 1.4 }); else scrollTo({ top: y, behavior: 'smooth' }); }
      if (live) live.textContent = 'Stage ' + (i + 1) + ' of 5: ' + bt.querySelector('b').textContent + '. ' + bt.querySelector('.tool').textContent + ', ' + bt.querySelector('.hrs').textContent.replace('h', 'hours') + '.';
    });
  });
  sec.addEventListener('pointermove', function (e) { ptx = e.clientX / innerWidth; pty = e.clientY / innerHeight; kick(); }, { passive: true });
  addEventListener('scroll', kick, { passive: true }); addEventListener('resize', function () { place(); kick(); }); place();
  // the shader and textures load on the first scroll, or when the band is already on screen, never during the page's own load
  function onS() { if (scrollY > 30) { removeEventListener('scroll', onS); start(); } }
  addEventListener('scroll', onS, { passive: true });
  if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); start(); } }); io.observe(sec); } else start();
  render();
})();
