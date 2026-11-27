/* Concept F · Horizon, Live, Yours. The spine is concept C; the project in front of the orbit boots the real app (from E).
   Concept C · Horizon. A ray-marched, gravitationally lensed black hole (one fragment shader, no libraries). Scroll is gravity:
   projects spiral in one by one, messes orbit and can be flung in, and past the horizon everything is laid out in order. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, LIVE = { crm: 1, estate: 1, stockroom: 1, store: 1, resort: 1, saas: 1 }, W = ['recrm', 'reweb', 'interp', 'boxx', 'studio', 'crm', 'estate', 'stockroom', 'store', 'resort', 'saas'].map(function (id) { return window.WORK.filter(function (w) { return w.id === id; })[0]; }), N = W.length, $ = function (s) { return d.querySelector(s); };
  var mobile = matchMedia('(max-width: 760px)').matches, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { a = a || 0; b = b === undefined ? 1 : b; return v < a ? a : v > b ? b : v; }, sm = function (t) { return t * t * (3 - 2 * t); }, lerp = function (a, b, t) { return a + (b - a) * t; };
  var RISE = 100, STEP = mobile ? 52 : 58, OUT = 130, END = RISE + (N - 1) * STEP + OUT;
  var BASE = root.dataset.base || '';
  function thumb(w, big) { if (!w.img && !w.card) return ''; return BASE + (w.img ? 'img/' + w.img + (big ? '' : '-s') + '.webp' : w.card ? 'img/cards/' + w.card + '.webp' : ''); }

  var copy = $('#copy'); copy.addEventListener('click', function () { var done = function () { copy.textContent = 'Copied'; setTimeout(function () { copy.textContent = 'Copy the address'; }, 1800); }; if (navigator.clipboard) navigator.clipboard.writeText('abhimasih0505@gmail.com').then(done, done); else done(); });

  var cv = $('#gl'), gl = null; try { gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) { /* no WebGL */ }
  /* once the page has moved, the menu gets a solid bar, so nothing (the hero's game hint, its counter, any text) shows through it */
  function bar() { root.classList.toggle('scrd', window.scrollY > 8); } addEventListener('scroll', bar, { passive: true }); bar();
  $('#fall').style.setProperty('--len', END); var pjEl = $('#projects');
  if (reduce || !gl) {
    root.classList.add('no3d', 'inv');
    [].forEach.call(d.querySelectorAll('a[href="#fall"]'), function (a) { a.setAttribute('href', '#build'); if (a.classList.contains('g')) a.textContent = 'See the projects ↓'; else a.hidden = true; });
    return;
  }

  root.classList.add('fall'); pjEl.classList.add('landed');     // the index sits under the end of the fall; see land() below
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { o.disconnect(); boot(); } }, { rootMargin: '70% 0px' }).observe($('#world')); else boot();   // the shader starts only when the fall is near      // let the page paint (poster and text) before compiling the shader
  function boot() {
  /* ---------- the shader: photons bent around a Schwarzschild hole (rs = 1), disk in the y = 0 plane ---------- */
  var FS = 'precision highp float;uniform vec2 R,S;uniform float T,F,K,Q;uniform vec3 C,BX,BY,BZ;' +
    'float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
    'float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);return mix(mix(h1(i),h1(i+vec2(1.,0.)),f.x),mix(h1(i+vec2(0.,1.)),h1(i+vec2(1.,1.)),f.x),f.y);}' +
    'vec3 stars(vec3 d){vec3 a=abs(d);vec2 q;float fc;if(a.x>a.y&&a.x>a.z){q=d.yz/a.x;fc=sign(d.x);}else if(a.y>a.z){q=d.xz/a.y;fc=2.*sign(d.y);}else{q=d.xy/a.z;fc=3.*sign(d.z);}' +
    'vec2 g=q*34.+fc*17.,id=floor(g),f=fract(g)-.5;float h=h1(id);vec2 o=(vec2(h1(id+3.1),h1(id+7.7))-.5)*.7;float s=step(.9,h)*smoothstep(.2,.03,length(f-o));' +
    'float nb=ns(q*2.+fc)*ns(q*5.-fc);return vec3(.78,.86,1.)*s*(.35+.65*h1(id+1.3))+vec3(.11,.04,.17)*nb*.55;}' +
    'vec4 disk(vec3 p,vec3 v){float r=length(p.xz);if(r<3.||r>10.5)return vec4(0.);float w=5.2/(r*sqrt(r)),f1=fract(T*.06),f2=fract(T*.06+.5),a1=w*f1*16.,a2=w*f2*16.;' +
    'vec2 q1=mat2(cos(a1),sin(a1),-sin(a1),cos(a1))*p.xz,q2=mat2(cos(a2),sin(a2),-sin(a2),cos(a2))*p.xz;' +
    'float n1=ns(q1*1.1)*.58+ns(q1*2.9)*.3+ns(q1*5.2)*.12,n2=ns(q2*1.1+9.)*.58+ns(q2*2.9+9.)*.3+ns(q2*5.2+9.)*.12,n=mix(n1,n2,abs(2.*f1-1.));' +
    'float t=(r-3.)/7.5,I=pow(1.-t,2.1)*smoothstep(3.,3.5,r)*(.3+1.4*n*n)*(.72+.28*sin(r*6.+n*5.));' +
    'vec3 c=mix(vec3(1.,.96,.88),vec3(.96,.71,.34),smoothstep(0.,.3,t));c=mix(c,vec3(1.,.31,.85),smoothstep(.28,.7,t));c=mix(c,vec3(.5,.42,1.),smoothstep(.66,1.,t));' +
    'float dp=1.+.72*dot(normalize(vec3(p.z,0.,-p.x)),-normalize(v));I*=dp*dp*smoothstep(10.5,8.4,r);return vec4(c*I*2.3,clamp(I*1.7,0.,.93));}' +
    'void main(){vec2 uv=(gl_FragCoord.xy-.5*R)/R.y-S;vec3 v=normalize(uv.x*BX+uv.y*BY+F*BZ),p=C,hh=cross(p,v);float h2=dot(hh,hh),tr=1.;vec3 col=vec3(0.);' +
    'for(int i=0;i<190;i++){if(float(i)>Q)break;float r2=dot(p,p);if(r2<1.){tr=0.;break;}float r=sqrt(r2),dt=max(.03,.06*r);if(r<12.)dt=min(dt,abs(p.y)*.5+.15);v+=-1.5*h2*p/(r2*r2*r)*dt;vec3 np=p+v*dt;' +
    'if(p.y*np.y<0.){vec4 k=disk(mix(p,np,p.y/(p.y-np.y)),v);col+=tr*k.rgb;tr*=1.-k.a;}p=np;if(r2>6400.&&dot(p,v)>0.)break;}' +
    'col+=tr*stars(normalize(v));col=1.-exp(-col*1.35);col+=(fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))-.5)/255.;float br=K*K*5.2;col=mix(col,vec3(1.),max(smoothstep(br+.001,br*.2,length(uv))*step(.0005,K),K*K*K*K));gl_FragColor=vec4(col,1.);}';
  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  var pr = gl.createProgram(), U = {};
  try {
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}')); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
  } catch (e) { console.warn('black hole shader unavailable', e); root.classList.add('no3d', 'inv'); return; }
  gl.useProgram(pr); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.bindAttribLocation(pr, 0, 'a'); gl.vertexAttribPointer(gl.getAttribLocation(pr, 'a'), 2, gl.FLOAT, false, 0, 0);
  ['R', 'S', 'T', 'F', 'K', 'Q', 'C', 'BX', 'BY', 'BZ'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });

  /* ---------- camera (kept in JS too, so DOM cards and chips sit in the same space) ---------- */
  var F = 1 / Math.tan((mobile ? 58 : 40) * Math.PI / 360), VW = 1, VH = 1, qs = 1, st = { r: 0, s: 0, o: 0, a: 1 }, tg = { r: 0, s: 0, o: 0, a: 1 }, AF = 6, ap = null, haK = -1;
  var C = [0, 7, 34], X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, -1], SX = 0, SY = 0, TF = Math.PI / 2 + (mobile ? 0 : .6), H = {}, P = {};
  /* The hand-off from the hero: while the hero scrolls away the camera is still far out (the hole is the size of the hero's own
     small one) and it sits where that one was, or just above its place in the next frame. It grows and settles as the hero's slab thins. */
  function camera() {
    var e = sm(st.r), eo = sm(st.o), far = Math.pow(AF, 1 - st.a), D = lerp(mobile ? 54 : 66, 34, e) * far, h = lerp(mobile ? 11 : 13, 6.5, e) * far, roll = (mobile ? -.1 : -.2) * (1 - eo), L, c, s, w;
    SX = lerp(mobile ? 0 : .3, mobile ? 0 : .2, e) * (1 - eo); SY = lerp(mobile ? -.2 : 0, mobile ? .2 : .1, e) * (1 - eo);
    if (st.a < .999) { w = sm(clamp((st.a - .1) / .8)); if (ap) { SX = lerp(ap.x, SX, w); SY = lerp(ap.y + (ap.h ? (window.scrollY - ap.s) / VH : 0), SY, w); } else SY = lerp(SY + .16, SY, w); }
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
    VW = innerWidth; VH = innerHeight; base = $('#world').offsetTop; $('#fall').style.setProperty('--len', END - Math.max(0, $('#intro').offsetHeight / innerHeight * 100 - 100)); liveSize(); var q = (mobile ? .85 : 1) * qs;      // 1 = one render pixel per CSS pixel; the loop below raises or lowers qs to hold the frame rate
    cv.width = Math.max(2, Math.round(VW * q)); cv.height = Math.max(2, Math.round(VH * q)); gl.viewport(0, 0, cv.width, cv.height);
  }

  /* ---------- projects in orbit ---------- */
  var orbit = $('#orbit'), cards = W.map(function (w, i) {
    var a = d.createElement('a'), src = thumb(w), b = d.createElement('b'); a.className = 'pc'; a.href = w.href; a.tabIndex = -1; a.setAttribute('aria-hidden', 'true');
    if (src) { var im = new Image(); im.alt = ''; im.src = src; a.appendChild(im); } else { var no = d.createElement('i'); no.textContent = 'Not launched publicly. Screens on request.'; a.appendChild(no); }
    b.textContent = w.name; a.appendChild(b); if (LIVE[w.id]) { var lv = d.createElement('em'); lv.textContent = 'Live'; a.appendChild(lv); } orbit.appendChild(a);
    return { el: a, w: w, live: !!LIVE[w.id], hi: !src, on: false, hv: false, vis: true, zi: 0 };
  });
  var CW = mobile ? 4.4 : 5.6;
  /* in the hero, nothing drifts across the headline: things fade as they near the text block */
  function clear(x, y) { var h = 1 - sm(clamp(st.r * 1.4)); return h < .01 ? 1 : (1 - h * (mobile ? 1 - clamp((y - VH * .62) / (VH * .1)) : 1 - clamp((x - VW * .5) / (VW * .08)))) * (1 - h * (1 - clamp((VH - 112 - y) / 50))); }   // nothing drifts over the text column or the bar at the bottom
  /* The queue waits behind the hole where it can be seen (the next two, dimmed), then each window swings round the near side and in
     from the left. Nothing is switched off at a threshold any more: every limit (the hole in front, the screen edge, the header) is
     a fade, so a window recedes or arrives instead of blinking. */
  function placeCards(t) {
    var hero = 1.6 * (1 - sm(st.r)), fade = clamp(1 - st.o * 3.2) * sm(clamp(st.r * 1.6 - .25)), ew = mobile ? 150 : 130, i, c, u, v, g, m, rad, th, e, k, op, zi, on, uq = sm(clamp(uu));
    for (i = 0; i < N; i++) {
      c = cards[i]; u = i - st.s + hero; e = 0;
      if (u >= 0) { g = u < 1 ? sm(Math.pow(u, 1.4)) : 1; v = u < 1 ? 0 : u - 1; rad = 11 + 4.6 * g + 1.9 * (1 - Math.exp(-v * .5)); th = TF + (mobile ? .95 : 1.8) * g + .8 * (1 - Math.exp(-v * .7)) + Math.sin(t * .22 + i) * .03 * Math.min(u, 1); op = u < 1 ? lerp(1, .7, sm(u)) * Math.max(1 - sm(clamp((u - .22) / .3)), sm(clamp((u - .72) / .28))) : .7 * Math.exp(-v * .56) * clamp(2.4 - v); }      // leaves its place in the queue slowly, is unseen for the middle of the swing, arrives slowly
      else { rad = 11 * Math.exp(u * 1.7); th = TF + u * .76 - 1.1 * u * u; e = sm(clamp(-u * 1.05)); op = 1 - e * e; }     // a calm shrink-and-fade into the hole, no spin
      op *= fade;
      if (op < .01 || !proj(rad * Math.cos(th), u < 0 ? .5 * rad / 11 : .5, rad * Math.sin(th), P)) { if (c.vis) { c.vis = false; c.el.style.visibility = 'hidden'; } continue; }
      k = P.k * CW / 640 * (1 - e * .6) * (i === hov ? 1.05 : 1); m = sm(clamp(u * 2 - 1));      // m: the window in front may cross the edge while it moves; a queued one is shown only when it is whole
      if (P.z > H.z) op *= sm(clamp((Math.hypot(P.x - H.x, P.y - H.y) - 2.5 * H.k) / (1.5 * H.k)));
      op *= clear(P.x, P.y) * clamp((P.y - 200 * k - 62) / 44) * sm(clamp((P.x - 320 * k * m + 56 - 70 * m) / ew)) * sm(clamp((VW - P.x - 320 * k * m + 56 - 70 * m) / ew));
      if (uq > .001) op *= i === cur ? 1 : 1 - uq; if (i === cur) { fr.x = P.x; fr.y = P.y; fr.k = P.k * CW / 640; fr.op = op; }
      if (op < .01) { if (c.vis) { c.vis = false; c.el.style.visibility = 'hidden'; } continue; } if (!c.vis) { c.vis = true; c.el.style.visibility = ''; }
      if (!c.hi && Math.abs(u) < 3.2) { c.hi = true; c.el.firstChild.src = thumb(c.w, true); }
      c.el.style.transform = 'translate3d(' + P.x.toFixed(1) + 'px,' + P.y.toFixed(1) + 'px,0) scale(' + k.toFixed(4) + ')';
      c.el.style.opacity = op.toFixed(3); zi = 2000 - Math.round(P.z * 20); if (zi !== c.zi) { c.zi = zi; c.el.style.zIndex = zi; }
      on = inOrb && i === cur; if (on !== c.on) { c.on = on; c.el.classList.toggle('on', on); } if ((i === hov) !== c.hv) { c.hv = i === hov; c.el.classList.toggle('hv', c.hv); }
    }
  }

  /* ---------- messes: real orbits, a little drag, and a counter ---------- */
  var GM = 170, chips = [], count = 0, yours = [], LAB = ['leads in WhatsApp', 'bookings in a diary', 'enquiries missed at night', 'stock in a spreadsheet', '#REF!', 'missed call', 'follow up??', 'leads_FINAL_v7', 'who has this lead?', 'call back Mon', 'quote v4 final', 'paid? ask accounts', '3 BHK, asked twice', 'copy of copy', 'lost the number', 'double entry', 'reply pending', '=SUM(#N/A)', 'site visit when?', 'which sheet?'];
  function seed(c) { var r = 12.5 + Math.random() * 8, a = Math.random() * 6.283, v = Math.sqrt(GM / r) * (.78 + Math.random() * .28); c.x = r * Math.cos(a); c.z = r * Math.sin(a); c.vx = Math.sin(a) * v; c.vz = -Math.cos(a) * v; c.y = Math.random() * 1.4 - .7; }
  function chip(text, me) { var el = d.createElement('span'); el.className = 'chip' + (me ? ' me' : ''); el.textContent = text; orbit.appendChild(el); var c = { el: el, me: me, text: text, drag: me ? .3 : .045, vis: true }; chips.push(c); return c; }
  /* eight messes at most, each on its own slot of two calm lanes that turn together, so they never pile up or repeat */
  var rot = 0, pool = LAB.slice(8);
  LAB.slice(0, 8).forEach(function (t, i) { var c = chip(t, false); c.lane = 1; c.slot = i; c.r = i % 2 ? 14.4 : 11.8; c.y = 0; c.x = c.r; c.z = 0; });
  function relabel(c) { pool.push(c.text); c.text = pool.shift(); c.el.textContent = c.text; }
  function pushOut() {            // a new mess pushes the oldest one out of its lane and into the hole
    var c = chips.filter(function (x) { return x.lane; })[0]; if (!c) return; var a = rot + c.slot * .7854, v = Math.sqrt(GM / c.r) * .7;
    c.lane = 0; c.vx = Math.sin(a) * v; c.vz = -Math.cos(a) * v; c.drag = .3; chips.push(chips.splice(chips.indexOf(c), 1)[0]);
  }
  function swallowed(c) {
    if (c.me || c.own) count++; $('#count').textContent = count; var hud = $('#hud'); hud.classList.remove('hit'); void hud.offsetWidth; hud.classList.add('hit');
    if (c.own) { c.el.remove(); chips.splice(chips.indexOf(c), 1); return; } if (!c.me) { relabel(c); c.lane = 1; return; }
    c.el.remove(); chips.splice(chips.indexOf(c), 1); yours.push(c.text);
    var y = $('#mine'), b = d.createElement('b'); y.textContent = ''; y.classList.add('on'); y.appendChild(d.createTextNode('You threw in ')); b.textContent = '“' + yours.join('”, “') + '”'; y.appendChild(b); y.appendChild(d.createTextNode('. It goes into your brief when you send it.'));
    window.MESS = yours.slice(); window.dispatchEvent(new Event('mess'));
  }
  function stepChips(dt) {
    rot -= dt * .085;
    var amb = clamp(1.2 - sm(st.r) * 1.4) * clamp(1 - st.o * 4) * sm(clamp((st.a - .72) / .28)), i, c, n, r2, r, a, op, k;
    for (i = chips.length - 1; i >= 0; i--) {
      c = chips[i];
      if (c.lane) { a = rot + c.slot * .7854; c.x = c.r * Math.cos(a); c.z = c.r * Math.sin(a); r = c.r; } else for (n = 0; n < 2; n++) { r2 = c.x * c.x + c.z * c.z; r = Math.sqrt(r2); a = -GM / (r2 * r) * dt / 2; c.vx = (c.vx + a * c.x) * (1 - c.drag * dt / 2); c.vz = (c.vz + a * c.z) * (1 - c.drag * dt / 2); c.x += c.vx * dt / 2; c.z += c.vz * dt / 2; }
      if (r < 2.5) { swallowed(c); continue; } if (r > 70) seed(c);
      op = (c.me ? 1 : amb) * clamp((r - 2.5) / 2);
      if (op >= .02 && proj(c.x, c.y * Math.min(1, r / 9), c.z, P) && P.z > H.z) op *= sm(clamp((Math.hypot(P.x - H.x, P.y - H.y) - 2.5 * H.k) / (1.2 * H.k)));
      if (op < .02 || !proj(c.x, c.y * Math.min(1, r / 9), c.z, P)) { if (c.vis) { c.vis = false; c.el.style.visibility = 'hidden'; } continue; }
      if (!c.me) op *= clear(P.x, P.y); if (!c.vis) { c.vis = true; c.el.style.visibility = ''; }
      op *= clamp((VW - 170 - P.x) / 50) * clamp((P.x - 8) / 40); k = clamp(P.k / 30, .42, 1.5); c.el.style.transform = 'translate3d(' + P.x.toFixed(1) + 'px,' + P.y.toFixed(1) + 'px,0) scale(' + k.toFixed(3) + ')'; c.el.style.opacity = op.toFixed(2); c.el.style.zIndex = 2000 - Math.round(P.z * 20);
    }
  }
  function fling(x, z, vx, vz, text, me) { var c = chip(text || pool[0], me); if (!text) relabel({ text: c.text, el: c.el }); c.x = x; c.z = z; c.vx = vx; c.vz = vz; c.y = 0; if (!me) { c.own = 1; c.drag = .26; } pushOut(); }
  var mess = $('#mess');
  function throwIn() { var t = mess.value.trim(), r = 18, a = TF + .5, v = Math.sqrt(GM / r) * .74; fling(r * Math.cos(a), r * Math.sin(a), Math.sin(a) * v, -Math.cos(a) * v, t, !!t); mess.value = ''; }
  $('#throw').addEventListener('click', throwIn); mess.addEventListener('keydown', function (e) { if (e.key === 'Enter') throwIn(); });
  var hero = $('#intro'), grab = null;
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
    for (i = 0; i < els.length; i++) { if (els[i].closest('.cap,.top,.in,.feed,.gauge,.usebar,#live,a.btn,button,input')) return -1; k = els[i].closest('.pc'); if (k) { for (j = 0; j < N; j++) if (cards[j].el === k) return j; } }
    return -1;
  }
  addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; var h = cardAt(e.clientX, e.clientY); if (h !== hov) { hov = h; root.style.cursor = h >= 0 ? 'pointer' : ''; } }, { passive: true });
  addEventListener('pointerdown', function (e) { downAt = [e.clientX, e.clientY]; });
  addEventListener('click', function (e) { if (Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return; var h = cardAt(e.clientX, e.clientY); if (h < 0 || using) return; e.preventDefault(); if (!cards[h].live) location.href = W[h].href; else if (h === cur && inOrb) use(true); else { want = h; go(h); } });

  /* ---------- live: the project in front is the real app, running. One at a time, laid out at full size and scaled into its card ---------- */
  var liveEl = $('#live'), fr = { x: 0, y: 0, k: 1, op: 0 }, lf = null, lfI = -1, lfOn = false, lT = 0, using = false, uu = 0, want = -1, Wu = 1, Hu = 1;
  function fit() { var iw = mobile ? 390 : 1280, fs = Wu / iw; lf.style.width = iw + 'px'; lf.style.height = Hu / fs + 'px'; lf.style.transform = 'scale(' + fs + ')'; }
  function liveSize() { if (mobile) { Wu = VW; Hu = VH - 54; } else { Wu = Math.min(VW - 24, (VH - 78) * 1.6); Hu = Wu * .625; } liveEl.style.width = Wu + 'px'; if (lf) fit(); }
  function unload() { if (lf) { lf.remove(); lf = null; } if (lfI >= 0) cards[lfI].el.classList.remove('lv'); lfI = -1; lfOn = false; liveEl.style.opacity = 0; }
  function load(i) {
    if (lfI === i || !cards[i].live) return; unload(); lfI = i; lf = d.createElement('iframe'); lf.title = W[i].name + ', running live'; lf.tabIndex = -1; fit();
    lf.addEventListener('load', function () { if (lfI === i) { lfOn = true; cards[i].el.classList.add('lv'); } }); lf.src = W[i].href; liveEl.appendChild(lf);
  }
  function liveShow(i) { clearTimeout(lT); if (lfI !== i && !using) unload(); if (cards[i].live) lT = setTimeout(function () { if (cur === i && inOrb) load(i); }, 800); }
  function use(v) {
    if (v && (cur < 0 || !cards[cur].live)) return; using = v; root.classList.toggle('using', v);
    if (v) { load(cur); lf.tabIndex = 0; $('#useN').textContent = 'You are using ' + W[cur].name + ', live.'; $('#open2').href = W[cur].href; } else if (lf) lf.tabIndex = -1;
  }
  function liveTick(dt) {
    uu += ((using ? 1 : 0) - uu) * (1 - Math.exp(-dt * 6)); if (!inOrb && !using && lfI >= 0 && uu < .02) unload();
    if (!(lfI === cur && lfOn && (inOrb || using || uu > .02))) { liveEl.style.opacity = 0; return; }
    var u = sm(clamp(uu)), s0 = 640 * fr.k / Wu, sc = lerp(s0, 1, u);
    liveEl.style.opacity = lerp(fr.op, 1, u).toFixed(3); liveEl.style.height = lerp(Wu * .625, Hu, u).toFixed(1) + 'px'; liveEl.style.borderRadius = lerp(20 * fr.k / s0, 12, u).toFixed(1) + 'px';
    liveEl.style.transform = 'translate3d(' + lerp(fr.x - 320 * fr.k, (VW - Wu) / 2, u).toFixed(1) + 'px,' + lerp(fr.y - 200 * fr.k, 54 + (VH - 54 - Hu) / 2, u).toFixed(1) + 'px,0) scale(' + sc.toFixed(4) + ')';
  }
  $('#use').addEventListener('click', function () { use(true); }); $('#back').addEventListener('click', function () { use(false); });

  /* ---------- scroll is gravity ---------- */
  var cap = $('#cap'), flash = $('#flash'), dist = $('#dist'), cur = -1, inOrb = false, busy = false, inv = false;
  var base = 0, build = $('#build'), lit = false, landK = -1;
  function top(i) { return base + (RISE + i * STEP) / 100 * innerHeight + 2; }
  function go(i) { window.scrollTo({ top: top(clamp(i, 0, N - 1)), behavior: 'smooth' }); }
  function show(i) {
    var w = W[i]; cur = i; $('#capH').textContent = w.name; $('#capK').textContent = w.kind + ' · ' + w.status; $('#capI').textContent = (i + 1) + ' of ' + N;
    var g = $('#capG'), lv = cards[i].live; g.href = w.href; g.textContent = lv ? 'Open ↗' : w.cta + ' →'; g.classList.toggle('g', !lv); $('#use').hidden = !lv; cap.classList.remove('sw'); void cap.offsetWidth; cap.classList.add('sw'); liveShow(i);
    if (want === i) { want = -1; setTimeout(function () { if (cur === i && inOrb) use(true); }, 950); }
  }
  function state() {
    busy = false; if (using) return; var hh;
    tg.a = clamp(window.scrollY / Math.max(1, base));
    if (tg.a <= 0) ap = null; else if (!ap && tg.a < .5) { hh = window.__hero && window.__hero.at(); ap = hh ? { x: (hh[0] - VW / 2) / VH, y: (VH / 2 - hh[1]) / VH, s: window.scrollY, h: 1 } : null; if (window.__hero) window.__hero.go(); }
    run();
    var p = (window.scrollY - base) / innerHeight * 100, o = clamp((p - RISE - (N - 1) * STEP - 20) / (OUT - 20)), on, i;
    tg.r = clamp(p / RISE); tg.s = clamp((p - RISE) / STEP, 0, N - 1); tg.o = o; on = p > RISE * .82 && o < .22; i = Math.round(tg.s);
    if (on !== inOrb) { inOrb = on; root.classList.toggle('orb', on); } if (on && i !== cur) show(i);
    var bt = build.getBoundingClientRect().top; if (!lit && (o >= .995 || p > END) && bt < innerHeight * .82) { lit = true; build.classList.add('lit'); } var iv = o > .68 || p > END; if (iv !== inv) { inv = iv; root.classList.toggle('inv', iv); }
  }
  addEventListener('scroll', function () { if (!busy) { busy = true; requestAnimationFrame(state); } }, { passive: true });
  $('#prev').addEventListener('click', function () { go(cur - 1); }); $('#next').addEventListener('click', function () { go(cur + 1); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && using) { use(false); return; } if (using || !inOrb || e.metaKey || e.ctrlKey || e.altKey || e.target === mess) return; if (e.key === 'ArrowRight') { go(cur + 1); e.preventDefault(); } else if (e.key === 'ArrowLeft') { go(cur - 1); e.preventDefault(); } });
  [].forEach.call(d.querySelectorAll('a[href="#fall"]'), function (a) { a.addEventListener('click', function (e) { e.preventDefault(); go(0); }); });

  /* ---------- loop ---------- */
  var raf = 0, last = 0, t0 = performance.now(), slow = 0, frames = 0, scrim = 0, qcap = Math.min(window.devicePixelRatio || 1, 2) * (mobile ? .75 : 1);
  /* the exit: a crisp disc of light opens from the centre of the shadow and the projects index, already in place underneath, fades in at its final position */
  function land(k) {
    if (Math.abs(k - landK) < .002 && k !== 1) return; landK = k; flash.style.transform = 'scale(' + Math.pow(k, 1.4).toFixed(4) + ')';
    root.style.setProperty('--land', clamp((k - .5) / .42).toFixed(3)); pjEl.classList.toggle('landed', k > .995);
  }
  function frame(now) {
    raf = requestAnimationFrame(frame); var ms = now - last, dt = Math.min(.05, ms / 1000 || .016), k = 1 - Math.exp(-dt * 5), t = (now - t0) / 1000; last = now;
    st.r += (tg.r - st.r) * k; st.s += (tg.s - st.s) * (1 - Math.exp(-dt * 3.6)); st.o += (tg.o - st.o) * k; st.a += (tg.a - st.a) * (1 - Math.exp(-dt * 7)); if (Math.abs(tg.a - st.a) < .0005) st.a = tg.a; slab(); camera(); proj(0, 0, 0, H);
    gl.uniform2f(U.R, cv.width, cv.height); gl.uniform2f(U.S, SX, SY); gl.uniform1f(U.T, t); gl.uniform1f(U.F, F); gl.uniform1f(U.Q, lerp(190, 70, clamp(st.o * 1.5))); var kk = clamp((st.o - .28) / .72); kk = kk * kk * kk * (kk * (kk * 6 - 15) + 10); gl.uniform1f(U.K, 0); land(kk); if (Math.abs(kk - scrim) > .01) { scrim = kk; cv.parentNode.style.setProperty('--sc', (1 - kk).toFixed(2)); } gl.uniform3fv(U.C, C); gl.uniform3fv(U.BX, X); gl.uniform3fv(U.BY, Y); gl.uniform3fv(U.BZ, Z);
    if (uu < .985) { gl.drawArrays(gl.TRIANGLES, 0, 3); placeCards(t); stepChips(dt); } liveTick(dt);
    if (!wOn && window.scrollY <= 2 && st.a === tg.a) { stop(); return; }      // back at the very top: this still frame is enough, the loop sleeps
    if (ms < 200 && !using && st.o < .04) { slow += ms; if (++frames === 40) { var av = slow / 40; if (av > 22 && qs > .5) { qs = Math.max(.5, qs * .84); qcap = qs; size(); } else if (av < 12.5 && qs < qcap * .97) { qs = Math.min(qcap, qs * 1.15); size(); } slow = frames = 0; } }   // step the resolution down when frames run long, back up (never past a level that failed) when there is headroom
  }
  function slab() { var v = sm(clamp(st.a / .55)); if (Math.abs(v - haK) > .003 || (v !== haK && (v === 0 || v === 1))) { haK = v; root.style.setProperty('--ha', v.toFixed(3)); } }
  function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  var wOn = false;
  function run() { if (!d.hidden && (wOn || (window.scrollY > 2 && window.scrollY <= base) || Math.abs(tg.a - st.a) > .001)) start(); else if (raf) { stop(); if (window.scrollY <= 2) { st.a = tg.a; frame(performance.now()); stop(); } } }
  window.__bh = { jump: function () { state(); st.r = tg.r; st.s = tg.s; st.o = tg.o; st.a = tg.a; } };
  size(); addEventListener('resize', function () { size(); state(); }); state(); st.r = tg.r; st.s = tg.s; st.o = tg.o; st.a = tg.a; frame(performance.now()); stop(); root.classList.add('live'); run();
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { wOn = es[0].isIntersecting; run(); }).observe($('#world')); else wOn = true;
  d.addEventListener('visibilitychange', run);
  }
})();
