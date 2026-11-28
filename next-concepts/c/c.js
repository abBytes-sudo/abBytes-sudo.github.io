/* Concept C · Horizon. A ray-marched, gravitationally lensed black hole (one fragment shader, no libraries). Scroll is gravity:
   projects spiral in one by one, messes orbit and can be flung in, and past the horizon everything is laid out in order. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, W = window.WORK, N = W.length, $ = function (s) { return d.querySelector(s); };
  var mobile = matchMedia('(max-width: 760px)').matches, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { a = a || 0; b = b === undefined ? 1 : b; return v < a ? a : v > b ? b : v; }, sm = function (t) { return t * t * (3 - 2 * t); }, lerp = function (a, b, t) { return a + (b - a) * t; };
  var RISE = 100, STEP = mobile ? 52 : 58, OUT = 130, END = RISE + (N - 1) * STEP + OUT;
  function thumb(w, big) { return w.img ? 'img/' + w.img + (big ? '' : '-s') + '.webp' : w.card ? 'img/cards/' + w.card + (big ? '' : '-480') + '.webp' : ''; }

  /* ---------- inside: the ordered index ---------- */
  var grid = $('#grid'), tabs = $('#tabs');
  W.forEach(function (w) {
    var a = d.createElement('a'), t = d.createElement('span'), b = d.createElement('b'), s = d.createElement('small'), src = thumb(w, !!w.card);
    a.href = w.href; a.dataset.cat = w.cat; t.className = 'th';
    if (src) { var im = new Image(); im.alt = ''; im.loading = 'lazy'; im.src = src; t.appendChild(im); } else { var no = d.createElement('i'); no.textContent = 'Screens on request'; t.appendChild(no); }
    b.textContent = w.name; s.textContent = w.kind + ' · ' + w.status; a.appendChild(t); a.appendChild(b); a.appendChild(s); grid.appendChild(a);
  });
  [['all', 'All'], ['client', 'Client work'], ['web', 'Websites'], ['sys', 'Systems']].forEach(function (t) {
    var b = d.createElement('button'), sp = d.createElement('span'); b.type = 'button'; b.textContent = t[1]; sp.textContent = t[0] === 'all' ? N : W.filter(function (w) { return w.cat === t[0]; }).length; b.appendChild(sp); b.setAttribute('aria-pressed', t[0] === 'all');
    b.addEventListener('click', function () { [].forEach.call(tabs.children, function (c) { c.setAttribute('aria-pressed', c === b); }); [].forEach.call(grid.children, function (a) { a.hidden = t[0] !== 'all' && a.dataset.cat !== t[0]; }); });
    tabs.appendChild(b);
  });
  var copy = $('#copy'); copy.addEventListener('click', function () { var done = function () { copy.textContent = 'Copied'; setTimeout(function () { copy.textContent = 'Copy the address'; }, 1800); }; if (navigator.clipboard) navigator.clipboard.writeText('contact.abbytes@gmail.com').then(done, done); else done(); });

  var cv = $('#gl'), gl = null; try { gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) { /* no WebGL */ }
  $('#fall').style.setProperty('--len', END);
  if (reduce || !gl) {
    root.classList.add('no3d', 'inv');
    [].forEach.call(d.querySelectorAll('a[href="#fall"]'), function (a) { a.setAttribute('href', '#inside'); if (a.classList.contains('g')) a.textContent = 'See the projects ↓'; else a.hidden = true; });
    return;
  }

  requestAnimationFrame(function () { setTimeout(boot, 0); });      // let the page paint (poster and text) before compiling the shader
  function boot() {
  /* ---------- the shader: photons bent around a Schwarzschild hole (rs = 1), disk in the y = 0 plane ---------- */
  var FS = 'precision highp float;uniform vec2 R,S;uniform float T,F,K;uniform vec3 C,BX,BY,BZ;' +
    'float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
    'float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h1(i),h1(i+vec2(1.,0.)),f.x),mix(h1(i+vec2(0.,1.)),h1(i+vec2(1.,1.)),f.x),f.y);}' +
    'vec3 stars(vec3 d){vec3 a=abs(d);vec2 q;float fc;if(a.x>a.y&&a.x>a.z){q=d.yz/a.x;fc=sign(d.x);}else if(a.y>a.z){q=d.xz/a.y;fc=2.*sign(d.y);}else{q=d.xy/a.z;fc=3.*sign(d.z);}' +
    'vec2 g=q*34.+fc*17.,id=floor(g),f=fract(g)-.5;float h=h1(id);vec2 o=(vec2(h1(id+3.1),h1(id+7.7))-.5)*.7;float s=step(.9,h)*smoothstep(.2,.03,length(f-o));' +
    'float nb=ns(q*2.+fc)*ns(q*5.-fc);return vec3(.78,.86,1.)*s*(.35+.65*h1(id+1.3))+vec3(.11,.04,.17)*nb*.55;}' +
    'vec4 disk(vec3 p,vec3 v){float r=length(p.xz);if(r<3.||r>10.5)return vec4(0.);float w=5.2/(r*sqrt(r)),f1=fract(T*.06),f2=fract(T*.06+.5),a1=w*f1*16.,a2=w*f2*16.;' +
    'vec2 q1=mat2(cos(a1),sin(a1),-sin(a1),cos(a1))*p.xz,q2=mat2(cos(a2),sin(a2),-sin(a2),cos(a2))*p.xz;' +
    'float n1=ns(q1*1.1)*.55+ns(q1*3.3)*.3+ns(q1*8.)*.15,n2=ns(q2*1.1+9.)*.55+ns(q2*3.3+9.)*.3+ns(q2*8.+9.)*.15,n=mix(n1,n2,abs(2.*f1-1.));' +
    'float t=(r-3.)/7.5,I=pow(1.-t,2.1)*smoothstep(3.,3.5,r)*(.3+1.4*n*n)*(.72+.28*sin(r*6.+n*5.));' +
    'vec3 c=mix(vec3(1.,.96,.88),vec3(.96,.71,.34),smoothstep(0.,.3,t));c=mix(c,vec3(1.,.31,.85),smoothstep(.28,.7,t));c=mix(c,vec3(.5,.42,1.),smoothstep(.66,1.,t));' +
    'float dp=1.+.72*dot(normalize(vec3(p.z,0.,-p.x)),-normalize(v));I*=dp*dp*smoothstep(10.5,8.4,r);return vec4(c*I*2.3,clamp(I*1.7,0.,.93));}' +
    'void main(){vec2 uv=(gl_FragCoord.xy-.5*R)/R.y-S;vec3 v=normalize(uv.x*BX+uv.y*BY+F*BZ),p=C,hh=cross(p,v);float h2=dot(hh,hh),tr=1.;vec3 col=vec3(0.);' +
    'for(int i=0;i<130;i++){float r2=dot(p,p);if(r2<1.){tr=0.;break;}float r=sqrt(r2),dt=max(.035,.075*r);v+=-1.5*h2*p/(r2*r2*r)*dt;vec3 np=p+v*dt;' +
    'if(p.y*np.y<0.){vec4 k=disk(mix(p,np,p.y/(p.y-np.y)),v);col+=tr*k.rgb;tr*=1.-k.a;}p=np;if(r2>6400.&&dot(p,v)>0.)break;}' +
    'col+=tr*stars(normalize(v));col=1.-exp(-col*1.35);float br=K*K*5.2;col=mix(col,vec3(1.),smoothstep(br+.001,br*.35,length(uv))*step(.0005,K));gl_FragColor=vec4(col,1.);}';
  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  var pr = gl.createProgram(), U = {};
  try {
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}')); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
  } catch (e) { console.warn('black hole shader unavailable', e); root.classList.add('no3d', 'inv'); return; }
  gl.useProgram(pr); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.bindAttribLocation(pr, 0, 'a'); gl.vertexAttribPointer(gl.getAttribLocation(pr, 'a'), 2, gl.FLOAT, false, 0, 0);
  ['R', 'S', 'T', 'F', 'K', 'C', 'BX', 'BY', 'BZ'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });

  /* ---------- camera (kept in JS too, so DOM cards and chips sit in the same space) ---------- */
  var F = 1 / Math.tan((mobile ? 58 : 40) * Math.PI / 360), VW = 1, VH = 1, qs = 1, st = { r: 0, s: 0, o: 0 }, tg = { r: 0, s: 0, o: 0 };
  var C = [0, 7, 34], X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, -1], SX = 0, SY = 0, TF = Math.PI / 2 + (mobile ? 0 : .6), H = {}, P = {};
  function camera() {
    var e = sm(st.r), eo = sm(st.o), D = lerp(54, 34, e), h = lerp(11, 6.5, e), roll = (mobile ? -.1 : -.2) * (1 - eo), L, c, s;
    SX = lerp(mobile ? 0 : .42, mobile ? 0 : .2, e) * (1 - eo); SY = lerp(mobile ? -.2 : 0, mobile ? .2 : .1, e) * (1 - eo);
    D = D * Math.pow(1.7 / D, eo); h = lerp(h, .45, eo); L = Math.hypot(h, D); c = Math.cos(roll); s = Math.sin(roll);
    C = [0, h, D]; Z = [0, -h / L, -D / L]; X = [c, s * D / L, -s * h / L]; Y = [-s, c * D / L, -c * h / L];
  }
  function proj(x, y, z, o) {
    var qx = x - C[0], qy = y - C[1], qz = z - C[2], pz = qx * Z[0] + qy * Z[1] + qz * Z[2]; if (pz < .7) return false;
    o.x = VW / 2 + ((qx * X[0] + qy * X[1] + qz * X[2]) / pz * F + SX) * VH; o.y = VH / 2 - ((qx * Y[0] + qy * Y[1] + qz * Y[2]) / pz * F + SY) * VH; o.k = F * VH / pz; o.z = pz; return true;
  }
  function onPlane(cx, cy) {      // screen point → where that ray meets the disk plane (straight ray; good enough to aim a throw)
    var ux = (cx - VW / 2) / VH - SX, uy = (VH / 2 - cy) / VH - SY, rx = ux * X[0] + uy * Y[0] + F * Z[0], ry = ux * X[1] + uy * Y[1] + F * Z[1], rz = ux * X[2] + uy * Y[2] + F * Z[2];
    if (ry > -1e-3) return null; var t = -C[1] / ry; return t > 110 ? null : [C[0] + rx * t, C[2] + rz * t];
  }
  function size() {
    VW = innerWidth; VH = innerHeight; var q = Math.min(1, Math.sqrt((mobile ? 300000 : 460000) / (VW * VH))) * qs;
    cv.width = Math.max(2, Math.round(VW * q)); cv.height = Math.max(2, Math.round(VH * q)); gl.viewport(0, 0, cv.width, cv.height);
  }

  /* ---------- projects in orbit ---------- */
  var orbit = $('#orbit'), cards = W.map(function (w, i) {
    var a = d.createElement('a'), src = thumb(w), b = d.createElement('b'); a.className = 'pc'; a.href = w.href; a.tabIndex = -1; a.setAttribute('aria-hidden', 'true');
    if (src) { var im = new Image(); im.alt = ''; im.src = src; a.appendChild(im); } else { var no = d.createElement('i'); no.textContent = 'Not launched publicly. Screens on request.'; a.appendChild(no); }
    b.textContent = w.name; a.appendChild(b); orbit.appendChild(a);
    return { el: a, w: w, hi: !src, on: false, hv: false, vis: true, zi: 0 };
  });
  var CW = mobile ? 4.2 : 4.4;
  /* in the hero, nothing drifts across the headline: things fade as they near the text block */
  function clear(x, y) { var h = 1 - sm(clamp(st.r * 1.4)); return h < .01 ? 1 : 1 - h * (mobile ? 1 - clamp((y - VH * .5) / (VH * .1)) : 1 - clamp((x - VW * .47) / (VW * .09))); }
  function placeCards(t) {
    var hero = 1.6 * (1 - sm(st.r)), fade = clamp(1 - st.o * 3.2), i, c, u, rad, th, e, k, op, phi, zi, on;
    for (i = 0; i < N; i++) {
      c = cards[i]; u = i - st.s + hero;
      if (u >= 0) { rad = 11 + 9 * (1 - Math.exp(-u * .22)); th = TF + 4.5 * (1 - Math.exp(-u * .17)) + Math.sin(t * .22 + i) * .04 * Math.min(u, 2); }
      else { rad = 11 * Math.exp(u * 1.7); th = TF + u * .76 - 2.6 * u * u; }
      e = u < 0 ? sm(clamp(-u * 1.05)) : 0; op = (u < 0 ? 1 - e * e : clamp(1.3 - u * .065)) * fade;
      if (op < .01 || !proj(rad * Math.cos(th), u < 0 ? .5 * rad / 11 : .5, rad * Math.sin(th), P) || (P.z > H.z && Math.hypot(P.x - H.x, P.y - H.y) < 2.9 * H.k)) { if (c.vis) { c.vis = false; c.el.style.visibility = 'hidden'; } continue; }
      op *= clear(P.x, P.y); if (!c.vis) { c.vis = true; c.el.style.visibility = ''; }
      if (!c.hi && Math.abs(u) < 1.6) { c.hi = true; c.el.firstChild.src = thumb(c.w, true); }
      k = P.k * CW / 320 * (1 - e * .45) * (i === hov ? 1.07 : 1); phi = Math.atan2(H.y - P.y, H.x - P.x);
      c.el.style.transform = 'translate3d(' + P.x.toFixed(1) + 'px,' + P.y.toFixed(1) + 'px,0) rotate(' + phi.toFixed(3) + 'rad) scale(' + (k * (1 + e * 1.5)).toFixed(4) + ',' + (k * (1 - e * .8)).toFixed(4) + ') rotate(' + (-phi).toFixed(3) + 'rad)';
      c.el.style.opacity = op.toFixed(3); zi = 2000 - Math.round(P.z * 20); if (zi !== c.zi) { c.zi = zi; c.el.style.zIndex = zi; }
      on = inOrb && i === cur; if (on !== c.on) { c.on = on; c.el.classList.toggle('on', on); } if ((i === hov) !== c.hv) { c.hv = i === hov; c.el.classList.toggle('hv', c.hv); }
    }
  }

  /* ---------- messes: real orbits, a little drag, and a counter ---------- */
  var GM = 170, chips = [], count = 0, yours = [], LAB = ['#REF!', 'missed call', 'follow up??', 'leads_FINAL_v7', 'who has this lead?', 'call back Mon', 'quote v4 final', 'paid? ask accounts', '3 BHK, asked twice', 'copy of copy', 'lost the number', 'double entry', 'reply pending', '=SUM(#N/A)', 'site visit when?', 'which sheet?'];
  function seed(c) { var r = 12.5 + Math.random() * 8, a = Math.random() * 6.283, v = Math.sqrt(GM / r) * (.78 + Math.random() * .28); c.x = r * Math.cos(a); c.z = r * Math.sin(a); c.vx = Math.sin(a) * v; c.vz = -Math.cos(a) * v; c.y = Math.random() * 1.4 - .7; }
  function chip(text, me) { var el = d.createElement('span'); el.className = 'chip' + (me ? ' me' : ''); el.textContent = text; orbit.appendChild(el); var c = { el: el, me: me, text: text, drag: me ? .3 : .045, vis: true }; chips.push(c); return c; }
  LAB.concat(LAB.slice(0, mobile ? 0 : 8)).forEach(function (t) { seed(chip(t, false)); });
  function swallowed(c) {
    count++; $('#count').textContent = count; var hud = $('#hud'); hud.classList.remove('hit'); void hud.offsetWidth; hud.classList.add('hit');
    if (!c.me) return seed(c);
    c.el.remove(); chips.splice(chips.indexOf(c), 1); yours.push(c.text);
    var y = $('#yours'), a = d.createElement('a'), sub = 'Our mess: ' + yours.join(', '); y.textContent = ''; y.classList.add('on');
    y.appendChild(d.createTextNode('You threw in ')); var b = d.createElement('b'); b.textContent = '“' + yours.join('”, “') + '”'; y.appendChild(b); y.appendChild(d.createTextNode('. It has a place in here now.'));
    a.href = 'mailto:contact.abbytes@gmail.com?subject=' + encodeURIComponent(sub); a.textContent = 'Tell me about it →'; y.appendChild(a); $('#mail').href = a.href;
  }
  function stepChips(dt) {
    var amb = clamp(1.2 - sm(st.r) * 1.4) * clamp(1 - st.o * 4), i, c, n, r2, r, a, op, k;
    for (i = chips.length - 1; i >= 0; i--) {
      c = chips[i];
      for (n = 0; n < 2; n++) { r2 = c.x * c.x + c.z * c.z; r = Math.sqrt(r2); a = -GM / (r2 * r) * dt / 2; c.vx = (c.vx + a * c.x) * (1 - c.drag * dt / 2); c.vz = (c.vz + a * c.z) * (1 - c.drag * dt / 2); c.x += c.vx * dt / 2; c.z += c.vz * dt / 2; }
      if (r < 2.5) { swallowed(c); continue; } if (r > 70) seed(c);
      op = (c.me ? 1 : amb) * clamp((r - 2.5) / 2);
      if (op < .02 || !proj(c.x, c.y * Math.min(1, r / 9), c.z, P) || (P.z > H.z && Math.hypot(P.x - H.x, P.y - H.y) < 2.9 * H.k)) { if (c.vis) { c.vis = false; c.el.style.visibility = 'hidden'; } continue; }
      if (!c.me) op *= clear(P.x, P.y); if (!c.vis) { c.vis = true; c.el.style.visibility = ''; }
      k = clamp(P.k / 30, .42, 1.5); c.el.style.transform = 'translate3d(' + P.x.toFixed(1) + 'px,' + P.y.toFixed(1) + 'px,0) scale(' + k.toFixed(3) + ')'; c.el.style.opacity = op.toFixed(2); c.el.style.zIndex = 2000 - Math.round(P.z * 20);
    }
  }
  function fling(x, z, vx, vz, text, me) { var c = chip(text || LAB[Math.random() * LAB.length | 0], me); c.x = x; c.z = z; c.vx = vx; c.vz = vz; c.y = 0; if (!me) c.drag = .16; }
  var mess = $('#mess');
  function throwIn() { var t = mess.value.trim(), r = 18, a = TF + .5, v = Math.sqrt(GM / r) * .74; fling(r * Math.cos(a), r * Math.sin(a), Math.sin(a) * v, -Math.cos(a) * v, t, true); mess.value = ''; }
  $('#throw').addEventListener('click', throwIn); mess.addEventListener('keydown', function (e) { if (e.key === 'Enter') throwIn(); });
  var hero = $('#hero'), grab = null;
  hero.addEventListener('pointerdown', function (e) { if (e.button || e.pointerType === 'touch' || e.target.closest('a,button,input,label')) return; var p = onPlane(e.clientX, e.clientY); if (p) grab = { p: p, t: performance.now() }; });
  addEventListener('pointerup', function (e) {
    if (!grab) return; var g = grab, p = onPlane(e.clientX, e.clientY), dt, vx, vz, m, r, v; grab = null; if (!p) return;
    dt = Math.max(.12, (performance.now() - g.t) / 1000); vx = (p[0] - g.p[0]) / dt; vz = (p[1] - g.p[1]) / dt; m = Math.hypot(vx, vz); r = Math.hypot(p[0], p[1]) || 1;
    if (m < 1.5) { v = Math.sqrt(GM / r) * .8; vx = p[1] / r * v; vz = -p[0] / r * v; } else if (m > 15) { vx *= 15 / m; vz *= 15 / m; }
    fling(p[0], p[1], vx, vz, '', false);
  });

  var hov = -1, downAt = [0, 0];
  function cardAt(x, y) {
    var els = d.elementsFromPoint(x, y), i, k, j;
    for (i = 0; i < els.length; i++) { if (els[i].closest('.cap,.top,.in,.feed,.gauge,a.btn,button,input')) return -1; k = els[i].closest('.pc'); if (k) { for (j = 0; j < N; j++) if (cards[j].el === k) return j; } }
    return -1;
  }
  addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; var h = cardAt(e.clientX, e.clientY); if (h !== hov) { hov = h; root.style.cursor = h >= 0 ? 'pointer' : ''; } }, { passive: true });
  addEventListener('pointerdown', function (e) { downAt = [e.clientX, e.clientY]; });
  addEventListener('click', function (e) { if (Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return; var h = cardAt(e.clientX, e.clientY); if (h >= 0) { e.preventDefault(); location.href = W[h].href; } });

  /* ---------- scroll is gravity ---------- */
  var cap = $('#cap'), flash = $('#flash'), dist = $('#dist'), cur = -1, inOrb = false, busy = false, inv = false;
  function top(i) { return (RISE + i * STEP) / 100 * innerHeight + 2; }
  function go(i) { window.scrollTo({ top: top(clamp(i, 0, N - 1)), behavior: 'smooth' }); }
  function show(i) {
    var w = W[i]; cur = i; $('#capN').textContent = window.CATS[w.cat] + ' · ' + (i + 1) + ' of ' + N; $('#capH').textContent = w.name; $('#capK').textContent = w.kind + ' · ' + w.status; $('#capB').textContent = w.blurb;
    var g = $('#capG'); g.href = w.href; g.textContent = w.cta + ' →'; cap.classList.remove('sw'); void cap.offsetWidth; cap.classList.add('sw');
  }
  function state() {
    busy = false; var p = window.scrollY / innerHeight * 100, o = clamp((p - RISE - (N - 1) * STEP - 20) / (OUT - 20)), on, i;
    tg.r = clamp(p / RISE); tg.s = clamp((p - RISE) / STEP, 0, N - 1); tg.o = o; on = p > RISE * .82 && o < .22; i = Math.round(tg.s);
    if (on !== inOrb) { inOrb = on; root.classList.toggle('orb', on); } if (on && i !== cur) show(i);
    var iv = o > .86 || p > END; if (iv !== inv) { inv = iv; root.classList.toggle('inv', iv); }
  }
  addEventListener('scroll', function () { if (!busy) { busy = true; requestAnimationFrame(state); } }, { passive: true });
  $('#prev').addEventListener('click', function () { go(cur - 1); }); $('#next').addEventListener('click', function () { go(cur + 1); });
  addEventListener('keydown', function (e) { if (!inOrb || e.metaKey || e.ctrlKey || e.altKey || e.target === mess) return; if (e.key === 'ArrowRight') { go(cur + 1); e.preventDefault(); } else if (e.key === 'ArrowLeft') { go(cur - 1); e.preventDefault(); } });
  [].forEach.call(d.querySelectorAll('a[href="#fall"]'), function (a) { a.addEventListener('click', function (e) { e.preventDefault(); go(0); }); });

  /* ---------- loop ---------- */
  var raf = 0, last = 0, t0 = performance.now(), slow = 0, frames = 0, scrim = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame); var ms = now - last, dt = Math.min(.05, ms / 1000 || .016), k = 1 - Math.exp(-dt * 5), t = (now - t0) / 1000; last = now;
    st.r += (tg.r - st.r) * k; st.s += (tg.s - st.s) * (1 - Math.exp(-dt * 3.6)); st.o += (tg.o - st.o) * k; camera(); proj(0, 0, 0, H);
    gl.uniform2f(U.R, cv.width, cv.height); gl.uniform2f(U.S, SX, SY); gl.uniform1f(U.T, t); gl.uniform1f(U.F, F); var kk = clamp((st.o - .5) / .5); kk = kk * kk * kk * (kk * (kk * 6 - 15) + 10); gl.uniform1f(U.K, kk); if (Math.abs(kk - scrim) > .01) { scrim = kk; cv.parentNode.style.setProperty('--sc', (1 - kk).toFixed(2)); } gl.uniform3fv(U.C, C); gl.uniform3fv(U.BX, X); gl.uniform3fv(U.BY, Y); gl.uniform3fv(U.BZ, Z);
    gl.drawArrays(gl.TRIANGLES, 0, 3); placeCards(t); stepChips(dt);
    if (inOrb) dist.textContent = (Math.hypot(C[1], C[2]) - 1).toFixed(1);
    if (ms < 200) { slow += ms; if (++frames === 45) { if (slow / 45 > 27 && qs > .4) { qs *= .78; size(); } slow = frames = 0; } }   // too slow: render fewer pixels
  }
  function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  window.__bh = { jump: function () { state(); st.r = tg.r; st.s = tg.s; st.o = tg.o; } };
  size(); addEventListener('resize', function () { size(); state(); }); state(); st.r = tg.r; st.s = tg.s; st.o = tg.o; start(); root.classList.add('live');
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting && !d.hidden) start(); else stop(); }).observe($('#world'));
  d.addEventListener('visibilitychange', function () { if (d.hidden) stop(); else if ($('#world').getBoundingClientRect().bottom > 0) start(); });
  }
})();
