/* Atelier Nori · the wall.
   The page is one lime-plastered wall, drawn live by a single WebGL2 fragment shader behind the content:
   hand-troweled plaster under a window's light, headlines pressed into it, limewash brushed on as you scroll,
   prints pinned to it, an oak table of samples, and a lamp for the room with no window.
   Everything is read from the DOM (data-paint, data-light, data-relief, .print, data-cast, .smp), so the page
   stays plain HTML and reads fully without this file (no WebGL, reduced motion, or before the first frame). */
(function () {
  'use strict';
  var W = window, doc = document, root = doc.documentElement, cv = doc.getElementById('wall');
  if (!cv) return;
  var Q = location.search, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]motion/.test(Q);
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var API = W.Wall = { on: false, hour: null, paint: function () {}, board: function () {}, refresh: function () {}, lights: {} };
  if (reduce || /[?&]still/.test(Q)) { root.classList.add('nogl'); return; }

  var VS = '#version 300 es\nin vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FS = [
'#version 300 es',
'precision highp float; precision highp sampler2D; out vec4 O;',
'uniform vec2 uRes,uAtS,uTab,uPtr; uniform float uDpr,uS,uT,uVw,uVh,uIntro,uBoard,uLampK;',
'uniform sampler2D uPl,uAt,uGr,uOak,uSm,uP0,uP1,uP2;',
'uniform vec3 uCA,uCB,uVis,uAmb,uSun; uniform vec4 uCoat,uGrP;',
'uniform vec4 uLa[4],uLb[4]; uniform vec4 uHr[3],uHa[3]; uniform vec3 uHm[3];',
'uniform vec4 uOr[12],uOp[12],uOq[12]; uniform int uOn;',
'float h21(vec2 p){uvec2 q=uvec2(ivec2(floor(p)))*uvec2(1597334673U,3812015801U);uint n=(q.x^q.y)*1597334673U;return float(n)*(1./4294967295.);}',
'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}',
'float fbm(vec2 p){float a=.5,t=0.;for(int i=0;i<4;i++){t+=a*vn(p);p=p*2.03+17.1;a*=.5;}return t;}',
'vec3 lin(vec3 c){return pow(max(c,0.),vec3(2.2));}',
'float sdRR(vec2 q,vec2 hf,float r){vec2 d=abs(q)-hf+r;return length(max(d,0.))+min(max(d.x,d.y),0.)-r;}',
/* dappled light through leaves: soft moving gaps */
'float leaf(vec2 w){float t=uT;vec2 q=w/168.+vec2(sin(t*.37)+.6*sin(t*.91+1.3),cos(t*.29)+.5*sin(t*.7))*.085;',
' q+=.32*vec2(vn(q*.8+vec2(t*.05,0.)),vn(q*.8+vec2(7.,t*.04)))-.16;',
' float n=vn(q)*.56+vn(q*2.1+3.7)*.3+vn(q*4.3+9.1)*.14;return smoothstep(.39,.6,n);}',
/* one light: a window patch (panes, lattice, blinds, sheer, plain) or a lamp. returns its mask, sets the direction to it */
'float light(vec4 l0,vec4 l1,vec4 l3,vec2 w,out vec3 dir){dir=uSun;float ty=l1.z;if(ty<.5)return 0.;',
' if(ty>4.5&&ty<5.5){vec2 d=l0.xy-w;float r=l0.z,q=dot(d,d)/(r*r);dir=normalize(vec3(d/r,l0.w));return 1./((1.+q)*(1.+q*.55));}',
' vec2 a=l0.zw,b=l1.xy,d=w-l0.xy;float det=a.x*b.y-a.y*b.x;float u=(d.x*b.y-d.y*b.x)/det,v=(a.x*d.y-a.y*d.x)/det;',
' float la=length(a),lb=length(b),so=l1.w*(.55+1.1*clamp(v,0.,1.));float su=so/la,sv=so/lb;',
' float m=smoothstep(-su,su,u)*smoothstep(-su,su,1.-u)*smoothstep(-sv,sv,v)*smoothstep(-sv,sv,1.-v);if(m<=0.)return 0.;',
' if(ty<1.5){vec2 g=vec2(u*l3.x,v*l3.y);float du=abs(fract(g.x+.5)-.5)/l3.x,dv=abs(fract(g.y+.5)-.5)/l3.y;float bu=l3.z,bv=l3.z*la/lb;',
'  m*=smoothstep(bu-su,bu+su,du)*smoothstep(bv-sv,bv+sv,dv);}',
' else if(ty<2.5){vec2 g=vec2(u*l3.x,v*l3.y);vec2 c=abs(fract(g)-.5)*2.;vec2 e=vec2(su*l3.x,sv*l3.y)*2.;float s=1.-l3.z;',
'  m*=(1.-smoothstep(s-e.x,s+e.x,c.x))*(1.-smoothstep(s-e.y,s+e.y,c.y));}',
' else if(ty<3.5){float c=abs(fract(v*l3.y+u*.35)-.5)*2.;float e=sv*l3.y*2.,s=1.-l3.z;m*=1.-smoothstep(s-e,s+e,c);}',
' else if(ty<4.5){m*=.74+.26*sin(u*l3.x*6.283+sin(v*3.1+uT*.22)*1.3+uT*.1);}',
' if(l3.w>0.){float lf=leaf(w);m*=mix(1.,lf,l3.w*smoothstep(.2,.75,vn(w/520.+3.)+.25));}',
' return m;}',
/* a headline pressed into the surface: coverage, slope, and the shadow its rim throws inside */
'void relief(vec4 r,vec4 a,vec3 m,vec2 p,vec2 sd,inout float A,inout vec2 G,inout float SH,inout float GI){',
' vec2 l=(p-r.xy)/r.zw;if(l.x<0.||l.x>1.||l.y<0.||l.y>1.||m.y<=0.)return;vec2 uv=a.xy+l*a.zw;vec2 e=vec2(1.15*m.z)/uAtS;',
' float c=texture(uAt,uv).r;float cx=texture(uAt,uv+vec2(e.x,0.)).r-texture(uAt,uv-vec2(e.x,0.)).r;float cy=texture(uAt,uv+vec2(0.,e.y)).r-texture(uAt,uv-vec2(0.,e.y)).r;',
' float cs=texture(uAt,uv+sd*4.2*m.z/uAtS).r;',
' if(m.x>1.5){GI+=smoothstep(.5,.64,c)*m.y;G+=vec2(cx,cy)*m.y*.2;A+=c*m.y*.45;}else{A+=c*m.y;G+=vec2(cx,cy)*m.y;SH+=c*(1.-cs)*m.y;}}',
/* materials on the sample tiles */
'void matl(float id,vec2 l,vec2 px,out vec3 alb,out vec2 n,out float rough,out float met){n=vec2(0.);rough=.8;met=0.;',
' if(id<3.5){vec2 o=vec2(mod(id,2.),floor(id/2.))*.5;vec2 f=fract(l*vec2(1.,1.));vec2 uv=o+(.014+f*.972)*.5;alb=lin(texture(uSm,uv).rgb);',
'  float e=.0016;float bx=dot(texture(uSm,uv+vec2(e,0.)).rgb-texture(uSm,uv-vec2(e,0.)).rgb,vec3(.33));float by=dot(texture(uSm,uv+vec2(0.,e)).rgb-texture(uSm,uv-vec2(0.,e)).rgb,vec3(.33));n=vec2(bx,by)*-2.2;rough=id<.5?.55:id<1.5?.5:id<2.5?.42:.7;}',
' else if(id<4.5){float wx=sin(px.x*2.6),wy=sin(px.y*2.6);float sl=vn(px*vec2(.02,.6))*.5+vn(px*vec2(.6,.02))*.5;alb=lin(vec3(.80,.755,.67))*(.86+.14*sl)*(.93+.07*wx*wy);n=vec2(cos(px.x*2.6)*(.5+.5*wy),cos(px.y*2.6)*(.5-.5*wx))*.16;rough=1.;}',
' else if(id<5.5){float f=fbm(px/90.+4.),g=fbm(px/22.+9.);alb=lin(mix(vec3(.40,.455,.43),vec3(.53,.57,.52),f))*(.94+.1*g);float v=smoothstep(.492,.5,abs(fbm(px/140.+vec2(2.,7.))-.5)+.47);alb*=mix(.93,1.,v);n=vec2(vn(px/3.)-.5,vn(px/3.+5.)-.5)*.05;rough=.34;}',
' else if(id<6.5){float b=vn(vec2(px.x*.035,px.y*2.4))-.5;alb=lin(vec3(.83,.65,.36))*(.9+.14*b);n=vec2(0.,b*.3);rough=.24;met=1.;}',
' else{vec2 g=px/8.5;vec2 ci=floor(g);float md=9.;vec2 mc=vec2(0.);for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 c=ci+vec2(i,j);vec2 o=vec2(h21(c),h21(c+31.7));vec2 dv=g-c-o;float an=h21(c+3.)*3.14;dv=vec2(dv.x*cos(an)-dv.y*sin(an),dv.x*sin(an)+dv.y*cos(an));float d=mix(length(dv),max(abs(dv.x),abs(dv.y)*1.5),.6);if(d<md){md=d;mc=c;}}',
'  float r=.12+.3*h21(mc+5.3)*h21(mc+2.1),k=h21(mc+11.);vec3 chip=k<.26?vec3(.74,.52,.40):k<.5?vec3(.30,.29,.28):k<.78?vec3(.93,.90,.84):vec3(.62,.60,.50);float in1=1.-smoothstep(r-.06,r,md);alb=lin(mix(vec3(.80,.77,.71),chip,in1))*(.95+.08*vn(px/2.));n=vec2(0.);rough=.3;}',
'}',
'void main(){',
' vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uDpr;vec2 w=vec2(p.x,p.y+uS);',
' vec2 sl=vec2(0.);vec3 alb;float rough=1.,met=0.,wet=0.,gloss=0.;',
' bool tab=p.y>uTab.x&&p.y<uTab.y;',
' if(tab){vec2 uv=w/vec2(1180.,980.);vec3 ok=lin(texture(uOak,uv).rgb);alb=mix(vec3(dot(ok,vec3(.33))),ok,.8)*vec3(1.,.975,.93);float g=vn(vec2(w.x*.012,w.y*1.3))-.5;sl=vec2(0.,g*.07)+(vec2(vn(w/2.3),vn(w/2.3+9.))-.5)*.03;rough=.5;',
'  float e0=p.y-uTab.x,e1=uTab.y-p.y;alb*=1.-.5*exp(-e0/22.);alb*=1.-.4*exp(-e1/7.);}',
' else{',
'  vec3 t1=texture(uPl,w/640.).rgb,t2=texture(uPl,(vec2(w.y,-w.x)+vec2(311.,97.))/2150.).rgb;',
'  sl=(t1.rg*2.-1.)*.30+(vec2(-(t2.g*2.-1.),t2.r*2.-1.))*.34;float det=t1.b*.55+t2.b*.45;',
'  vec3 col=uCA;float cov=0.;',
'  if(uCoat.w>.5){float yb=(p.y-uCoat.x)/uCoat.z;float x=p.x/uVw;float top=yb+(vn(vec2(w.x*.021,3.))-.5)*.16+(vn(vec2(w.x*.3,9.))-.5)*.03;',
'   if(top>0.){for(int k=0;k<2;k++){float bi=floor(max(yb,0.))-float(k);if(bi<0.)continue;float ov=yb-bi;if(k==1&&ov>1.+.13+.1*vn(vec2(w.x*.02,bi)))continue;',
'     float xs=mod(bi,2.)<.5?x:1.-x;float br=vn(vec2(w.y*.5,bi*13.7)),b2=vn(vec2(w.y*.07,bi*3.1+x*2.));float fr=(uCoat.y-bi)*1.3-.05-.17*br*br-.07*b2;float e=fr-xs;',
'     float c=smoothstep(0.,.016,e);c*=mix(1.,smoothstep(.28,.62,vn(vec2(xs*uVw*.035,w.y*.75))),smoothstep(.07,0.,e));',
'     float age=max(uCoat.y-yb-.35,0.);float wt=c*exp(-age*1.05)*smoothstep(0.,.25,uCoat.y-yb+.6);if(c>cov){cov=c;wet=wt;}}}',
'   col=mix(uCA,uCB,cov);}',
'  float cloud=fbm(w/360.);float st=vn(vec2(dot(w,vec2(.97,-.24))/900.,dot(w,vec2(.24,.97))/7.));',
'  alb=col*(.905+.15*cloud+.05*(st-.5))*(.87+.26*det);alb*=1.-.3*wet;rough=mix(1.,.25,wet);',
' }',
/* headlines */
' vec2 sd=normalize(uSun.xy);vec3 ld0,ld1;float m0=light(uLa[0],uLa[1],uLa[3],w,ld0),m1=light(uLb[0],uLb[1],uLb[3],w,ld1);',
' if(uLampK>0.){vec2 lpz=(uLa[1].z>4.5?uLa[0].xy:uLb[0].xy)-w;sd=normalize(mix(sd,normalize(lpz+1e-4),uLampK));}',
' float A=0.,SH=0.,GI=0.;vec2 G=vec2(0.);for(int i=0;i<3;i++)relief(uHr[i],uHa[i],uHm[i],p,sd,A,G,SH,GI);',
' A=clamp(A,0.,1.);GI=clamp(GI,0.,1.);sl+=G*-3.1;alb*=1.-.27*A*(1.-GI);',
/* wet-plaster marks */
' float gh=0.;if(uGrP.x>.5&&!tab){vec2 gu=vec2(p.x/uVw,1.-p.y/uVh);gh=texture(uGr,gu).r-.5;float gx=texture(uGr,gu+vec2(uGrP.y,0.)).r-texture(uGr,gu-vec2(uGrP.y,0.)).r;float gy=texture(uGr,gu+vec2(0.,uGrP.z)).r-texture(uGr,gu-vec2(0.,uGrP.z)).r;sl+=vec2(gx,-gy)*uGrP.w;alb*=1.+min(gh,0.)*.55+max(gh,0.)*.18;}',
/* things hung on the wall and laid on the table */
' float sh=0.,occ=0.;int top=-1;vec2 tl=vec2(0.);float tsw=0.;',
' float cot=min(length(uSun.xy)/max(uSun.z,.05),2.4);',
' for(int i=0;i<12;i++){if(i>=uOn)break;vec4 r=uOr[i],q=uOp[i];vec2 hf=r.zw*.5;vec2 lp=p-(r.xy+hf);float v01=clamp(lp.y/r.w+.5,0.,1.);float sw=q.z*v01*v01;lp.x-=sw;',
'  float dd=q.y*(q.x<1.5?(.55+1.5*v01*v01):1.);float d=sdRR(lp+sd*cot*dd,hf,q.w);float bl=1.4+dd*1.1;float s=(1.-smoothstep(-bl,bl,d))*.7;',
'  float d0=sdRR(lp,hf+2.,q.w+2.);float oc=(1.-smoothstep(-5.,9.+dd,d0))*.26;',
'  if(sdRR(lp,hf,q.w)<0.&&q.x!=2.){top=i;tl=lp;tsw=sw;sh=0.;occ=0.;}else{sh=max(sh,s);occ=max(occ,oc);}}',
' vec3 emis=vec3(0.);float pin=0.,lift=0.,refl=0.;',
' if(top>=0){vec4 r=uOr[top],q=uOp[top],t=uOq[top];vec2 hf=r.zw*.5;float d=sdRR(tl,hf,q.w);',
'  if(q.x<1.5){float b=t.w;vec2 inr=tl/(r.zw-2.*b)+.5;alb=lin(vec3(.945,.93,.9));sl=(vec2(vn(p*1.7),vn(p*1.7+7.))-.5)*.035;rough=.85;wet=0.;met=0.;A=0.;SH=0.;GI=0.;gh=0.;',
'   if(inr.x>0.&&inr.x<1.&&inr.y>0.&&inr.y<1.){vec2 uv=.5+(inr-.5)*t.yz;vec3 ph=t.x<.5?texture(uP0,uv).rgb:t.x<1.5?texture(uP1,uv).rgb:texture(uP2,uv).rgb;alb=lin(ph);gloss=.35;lift=.46;}else lift=.3;',
'   float v01=tl.y/r.w+.5;sl.y+=-.05*v01*v01;',
'   vec2 pa=vec2(hf.x-15.,-hf.y+13.);float pd=min(length(tl-vec2(-pa.x,pa.y)),length(tl-pa));if(pd<5.2){pin=1.;vec2 pn=(length(tl-pa)<5.2?tl-pa:tl-vec2(-pa.x,pa.y))/5.2;sl=-pn*.9;alb=lin(vec3(.80,.64,.34));rough=.2;met=1.;}',
'   else alb*=1.-.35*(1.-smoothstep(5.,11.,length((length(tl-pa)<length(tl-vec2(-pa.x,pa.y))?tl-pa:tl-vec2(-pa.x,pa.y))-sd*-3.5)));}',
'  else if(q.x<3.5){vec2 l01=tl/r.zw+.5;matl(t.x,l01*t.yz,tl+r.xy*0.+vec2(t.x*37.,t.x*91.)+hf,alb,sl,rough,met);float rim=smoothstep(-3.2,-.2,d);sl+=normalize(tl/hf+1e-4)*rim*.85;wet=0.;A=0.;SH=0.;GI=0.;gh=0.;refl=pow(max(0.,1.-abs(l01.x*2.3-.75+l01.y*.5)),2.2)+.35*pow(max(0.,1.-abs(l01.x*3.-2.4+l01.y*.5)),3.);}',
'  else{vec2 l01=tl/r.zw+.5;vec3 t1=texture(uPl,(tl+hf+17.)/420.).rgb;sl=(t1.rg*2.-1.)*.3;float cv=0.;float bw=0.;float bi=floor(l01.y*3.);float xs=mod(bi,2.)<.5?l01.x:1.-l01.x;float br=vn(vec2(tl.y*.7,bi*5.));float fr=uBoard*1.9-bi*.62-.05-.16*br*br;float e=fr-xs;cv=smoothstep(0.,.03,e);cv*=mix(1.,smoothstep(.3,.6,vn(vec2(xs*90.,tl.y*.9))),smoothstep(.09,0.,e));float age=max(uBoard-(bi*.62+xs)/1.9,0.);bw=cv*exp(-age*.75);',
'   alb=mix(lin(vec3(.905,.88,.83)),uVis,cv)*(.9+.2*t1.b)*(1.-.3*bw);wet=bw;rough=mix(1.,.25,bw);float rim=smoothstep(-2.5,-.2,d);sl+=normalize(tl/hf+1e-4)*rim*.7;A=0.;SH=0.;GI=0.;gh=0.;met=0.;}',
' }',
/* light it */
' if(GI>0.){alb=mix(alb,lin(vec3(.87,.70,.37)),GI);rough=mix(rough,.26,GI);met=max(met,GI);lift=max(lift,.42*GI);sl+=((vec2(vn(p*.55),vn(p*.55+3.))-.5)*.24+(vec2(vn(p*.06),vn(p*.06+5.))-.5)*.22)*GI;}',
' vec3 N=normalize(vec3(-sl,1.));vec3 V=vec3(0.,0.,1.);',
' vec3 amb=max(uAmb*.86,vec3(lift))*(1.-occ)*(1.-.3*sh)*(1.-.22*A*(1.-GI))*(1.-.42*SH*(1.-GI));vec3 ad=normalize(vec3(-.25,-.62,.74));amb*=mix(1.,max(dot(N,ad),0.)/ad.z,.6);',
' float cl=.88+.12*sin(uT*.071)*sin(uT*.043+1.);vec3 c=alb*amb*(1.-.45*met)+alb*met*uAmb*(.2+1.25*refl);vec3 sp=vec3(0.);',
' for(int k=0;k<2;k++){float m=k==0?m0:m1;if(m<=0.)continue;vec3 ld=k==0?ld0:ld1;vec4 lc=k==0?uLa[2]:uLb[2];bool lamp=(k==0?uLa[1].z:uLb[1].z)>4.5;',
'  float nd=clamp(dot(N,ld)/max(ld.z,.08),0.,2.3);float vis=(1.-sh*(lamp?.85:1.))*(1.-.72*SH*(1.-.6*GI));vec3 e=lc.rgb*lc.a*m*(lamp?1.:cl)*uIntro;',
'  c+=alb*e*nd*vis*(1.-.5*gloss);vec3 H=normalize(ld+V);float nh=max(dot(N,H),0.);float pw=mix(90.,6.,rough);float s=pow(nh,pw)*(1.-rough)*(1.-rough);',
'  sp+=e*vis*s*mix(vec3(.5),alb*3.2,met)*(1.+2.2*met)+e*vis*wet*pow(nh,26.)*.55;}',
' c+=sp+alb*wet*.05;',
' c=mix(c,.76+(1.-exp(-(c-.76)*2.3))*.26,step(.76,c));',
' c=pow(max(c,0.),vec3(1./2.2));c+=(h21(gl_FragCoord.xy+fract(uT)*91.)-.5)/255.;O=vec4(c,1.);}'
  ].join('\n');

  var SIM = [
'#version 300 es', 'precision highp float; out vec4 O; uniform sampler2D uPrev; uniform vec2 uSize,uShift; uniform vec4 uSeg; uniform vec3 uK;',
'void main(){vec2 uv=gl_FragCoord.xy/uSize;vec2 q=uv+uShift;vec2 tx=1./uSize;float h=.5;',
' if(q.x>0.&&q.x<1.&&q.y>0.&&q.y<1.){float c=texture(uPrev,q).r;float n=(texture(uPrev,q+vec2(tx.x,0.)).r+texture(uPrev,q-vec2(tx.x,0.)).r+texture(uPrev,q+vec2(0.,tx.y)).r+texture(uPrev,q-vec2(0.,tx.y)).r)*.25;h=mix(c,n,.1);}',
' h=.5+(h-.5)*uK.z;if(abs(h-.5)<.004)h=.5;',
' if(uK.y>0.){vec2 p=gl_FragCoord.xy,a=uSeg.xy,b=uSeg.zw,pa=p-a,ba=b-a;float t=clamp(dot(pa,ba)/max(dot(ba,ba),1e-4),0.,1.);float d=length(pa-ba*t),r=uK.x;',
'  h+=uK.y*(-.5*exp(-(d*d)/(r*r))+.17*exp(-pow((d-r*1.75)/(r*.6),2.)));}',
' O=vec4(clamp(h,0.,1.),0.,0.,1.);}'
  ].join('\n');

  /* ---------- boot: on the first sign of a visitor, or a moment after load ---------- */
  var booted = false, gl, prog, simP, U = {}, SU = {}, tex = {}, dpr = 1, vw = 0, vh = 0, lenis = null;
  var secs = [], coats = [], heads = [], objs = [], tab = null, atlas = { w: 2, h: 2, s: 1, cv: null, ok: false };
  var ptr = { x: -9999, y: -9999, on: false, px: 0, py: 0, moved: 0, down: false }, t0 = 0, intro = 0, lastS = 0, vis = [0.74, 0.55, 0.42], boardT = -1, drag = null;
  var gr = { a: null, b: null, fa: null, fb: null, w: 0, h: 0, live: 0, seg: null, fmt: null }, photos = new Map(), slots = [null, null, null];
  var MATS = { oak: 0, walnut: 1, parquet: 2, ash: 3, linen: 4, kota: 5, brass: 6, terrazzo: 7 };
  var TYPES = { panes: 1, lattice: 2, blinds: 3, sheer: 4, lamp: 5, plain: 6 };
  var LIME = [0.905, 0.878, 0.827];
  /* a pinned section holds the wall still while the page scrolls through it: pin.len of scroll that the wall does not travel */
  var pin = null, shiftNow = 0, introT = 0, introP = 0, tint = [0.985, 1, 1.02], dim = false, lastHour = '';

  function hex(h) { if (!h || h === 'lime') return LIME.slice(); h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255]; }
  function toLin(c) { return [Math.pow(c[0], 2.2), Math.pow(c[1], 2.2), Math.pow(c[2], 2.2)]; }
  function pr(el) { var x = 0, y = 0, e = el; while (e) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight }; }
  function json(el, k) { var v = el.getAttribute(k); if (!v) return null; try { return JSON.parse(v); } catch (e) { return null; } }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function boot() {
    if (booted) return; booted = true;
    try { gl = cv.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) { gl = null; }
    if (!gl) { root.classList.add('nogl'); return; }
    /* compile off the main thread where the browser can (KHR_parallel_shader_compile), so the page never stalls on the shader */
    var par = gl.getExtension('KHR_parallel_shader_compile'), A = build(VS, FS), B = build(VS, SIM);
    (function wait() { if (par && (!gl.getProgramParameter(A.p, par.COMPLETION_STATUS_KHR) || !gl.getProgramParameter(B.p, par.COMPLETION_STATUS_KHR))) { setTimeout(wait, 40); return; }
      prog = linked(A); simP = linked(B); if (!prog || !simP) { gl = null; root.classList.add('nogl'); return; } boot2(); })();
  }
  function build(vs, fs) { var a = gl.createShader(gl.VERTEX_SHADER), b = gl.createShader(gl.FRAGMENT_SHADER), p = gl.createProgram(); gl.shaderSource(a, vs); gl.compileShader(a); gl.shaderSource(b, fs); gl.compileShader(b); gl.attachShader(p, a); gl.attachShader(p, b); gl.linkProgram(p); return { p: p, a: a, b: b }; }
  function linked(o) { if (gl.getProgramParameter(o.p, gl.LINK_STATUS)) return o.p; if (W.console) console.warn('wall shader', gl.getShaderInfoLog(o.a), gl.getShaderInfoLog(o.b), gl.getProgramInfoLog(o.p)); return null; }
  function boot2() {
    var vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    [prog, simP].forEach(function (p) { var l = gl.getAttribLocation(p, 'a'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0); });
    'uRes uAtS uTab uPtr uDpr uS uT uVw uVh uIntro uBoard uLampK uPl uAt uGr uOak uSm uP0 uP1 uP2 uCA uCB uVis uAmb uSun uCoat uGrP uLa uLb uHr uHa uHm uOr uOp uOq uOn'.split(' ').forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    'uPrev uSize uShift uSeg uK'.split(' ').forEach(function (n) { SU[n] = gl.getUniformLocation(simP, n); });
    gl.useProgram(prog); ['uPl', 'uAt', 'uGr', 'uOak', 'uSm', 'uP0', 'uP1', 'uP2'].forEach(function (n, i) { gl.uniform1i(U[n], i); });
    gr.fmt = gl.getExtension('EXT_color_buffer_float') ? 'f' : (gl.getExtension('EXT_color_buffer_half_float') ? 'f' : 'b');
    var aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    function img(unit, key, url, rep) {
      tex[key] = solid(unit, [128, 128, 128, 255]);
      var im = new Image(); im.decoding = 'async'; im.onload = function () { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex[key]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); var wr = rep === 'mirror' ? gl.MIRRORED_REPEAT : rep ? gl.REPEAT : gl.CLAMP_TO_EDGE; gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wr); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wr);
        if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4); tex[key + 'ok'] = true; };
      im.src = url;
    }
    img(0, 'pl', 'tex/plaster.jpg?v=2', true); tex.at = solid(1, [0, 0, 0, 255]); tex.gr = solid(2, [128, 128, 128, 255]);
    tex.oak = solid(3, [150, 110, 80, 255]); tex.sm = solid(4, [150, 120, 90, 255]); for (var i = 0; i < 3; i++) solid(5 + i, [40, 38, 36, 255]);
    API.lazy = function () { if (!tex.lazy) { tex.lazy = 1; /* the oak is book-matched (mirrored at each repeat), so no knot turns up twice on one screen */ img(3, 'oak', 'tex/oak.jpg', 'mirror'); img(4, 'sm', 'tex/samples.jpg', false); } };
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); root.classList.remove('gl'); API.on = false; }, false);
    if (fine && W.Lenis && !/[?&]native/.test(Q)) { try { lenis = new W.Lenis({ lerp: 0.105, wheelMultiplier: 1 }); API.lenis = lenis; } catch (e) { lenis = null; } }
    listen(); measure(true);
    (doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve()).then(function () { measure(true); start(); });
    if (doc.fonts && doc.fonts.addEventListener) doc.fonts.addEventListener('loadingdone', function () { if (API.on) measure(true); });
  }
  function start() { if (API.on) return; API.on = true; root.classList.add('gl'); t0 = performance.now(); if (scrollY() < 12 && secs.some(function (s) { return s.keys && s.keys.p[0] < 0; }) && !/[?&]nointro/.test(Q)) { introT = t0 + 250; introP = -1.05; } requestAnimationFrame(frame); doc.dispatchEvent(new CustomEvent('wall:on')); }
  function solid(unit, px) { var t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(px)); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); return t; }

  /* ---------- read the page ---------- */
  function measure(full) {
    if (!gl) return;
    vw = root.clientWidth; vh = W.innerHeight; var d = Math.min(W.devicePixelRatio || 1, fine ? 2 : 2), cap = fine ? 2600 : 1700; dpr = Math.min(d, cap / Math.max(vw, 1)); if (API.scale) dpr *= API.scale;
    var cw = Math.round(vw * dpr), ch = Math.round(vh * dpr); if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
    secs = [].map.call(doc.querySelectorAll('[data-paint],[data-surface],[data-light]'), function (el) { var r = pr(el), m = vw < 720;
      var s = { el: el, y: r.y, h: r.h, paint: el.getAttribute('data-paint'), from: el.getAttribute('data-paint-from'), surface: el.getAttribute('data-surface'), amb: parseFloat(el.getAttribute('data-amb') || '1'), lights: [] };
      ['data-light', 'data-light2'].forEach(function (k) { var L = (m && json(el, k + '-m')) || json(el, k); if (L) { var id = el.id + (k === 'data-light2' ? ':2' : ''), ov = API.lights[id]; if (ov) for (var q in ov) L[q] = ov[q]; L.id = id; s.lights.push(L); } });
      return s; });
    pin = null; secs.forEach(function (s) { var K = (vw < 720 && json(s.el, 'data-keys-m')) || json(s.el, 'data-keys'); if (K) { K._c = (K.c || []).map(function (h) { return toLin(hex(h)); }); s.keys = K; }
      if (!pin && s.el.hasAttribute('data-pin')) { var st = s.el.querySelector('[data-stick]'); if (st && getComputedStyle(st).position === 'sticky') { pin = { s: s, el: st, y: s.y, len: Math.max(0, s.h - st.offsetHeight) }; s.pinned = true; } } });
    coats = []; tab = null; secs.forEach(function (s) { if (s.paint) coats.push({ y: s.y, col: toLin(hex(s.paint)), from: s.from ? toLin(hex(s.from)) : null, el: s.el }); if (s.surface === 'table') tab = [s.y, s.y + s.h]; });
    /* the same object is kept for the same element, so its photograph and its place in the frame survive a re-measure */
    var was = new Map(); objs.forEach(function (o) { was.set(o.el, o); });
    objs = [].map.call(doc.querySelectorAll('.print,[data-cast],.smp,.board'), function (el) { var c = el.classList, o = was.get(el) || { el: el, sw: 0, sv: 0 }; o.type = c.contains('print') ? 1 : c.contains('smp') ? 3 : c.contains('board') ? 5 : 2; o.live = c.contains('smp');
      o.depth = parseFloat(el.getAttribute('data-depth') || el.getAttribute('data-cast') || (o.type === 3 ? 7 : 6)); o.rad = parseFloat(el.getAttribute('data-rad') || (o.type === 1 ? 1.5 : o.type === 3 ? 3 : 3)); o.mat = MATS[el.getAttribute('data-mat')] || 0; o.rep = parseFloat(el.getAttribute('data-rep') || '1');
      if (o.type === 1) { o.img = el.querySelector('img'); o.border = parseFloat(el.getAttribute('data-border') || '11'); if (!fine || !lenis) o.type = 2; }
      var r = pos(el); o.x = r.x; o.y = r.y; o.w = r.w; o.h = r.h; o.pin = r.pin || 0; return o; });
    if (full) relayout();
    heads.forEach(function (h) { var r = pos(h.el); h.x = r.x - h.pad; h.y = r.y - h.pad; h.pin = r.pin || 0; });
  }
  /* where a thing sits on the page; inside the pinned frame, where it sits when the frame is not stuck */
  function pos(el) { if (pin && pin.el.contains(el)) { var a = el.getBoundingClientRect(), b = pin.el.getBoundingClientRect(); return { x: a.left, y: pin.y + (a.top - b.top), w: el.offsetWidth, h: el.offsetHeight, pin: 1 }; } return pr(el); }
  /* headlines are split into their own lines, drawn once into an atlas, and pressed into the wall by the shader */
  function relayout() {
    var els = [].slice.call(doc.querySelectorAll('[data-relief]')), s = Math.min(Math.max(dpr, 1), 2), pad = 16;
    heads = els.map(function (el) { if (!el._w) { el._w = 1; var kids = [].slice.call(el.childNodes); el.textContent = ''; kids.forEach(function (n) { if (n.nodeType === 3) { n.textContent.split(/([ \n\t\r]+)/).forEach(function (t) { if (!t) return; if (/^[ \n\t\r]+$/.test(t)) el.appendChild(doc.createTextNode(' ')); else { var sp = doc.createElement('span'); sp.className = 'rw'; sp.textContent = t; el.appendChild(sp); } }); } else el.appendChild(n); }); }
      var old = heads.filter(function (h) { return h.el === el; })[0]; var r = pos(el), cs = getComputedStyle(el), fs = parseFloat(cs.fontSize);
      var h = { el: el, pad: pad, x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2, mode: el.getAttribute('data-relief') === 'gilt' ? 2 : 1, str: old ? old.str : 0, seen: old ? old.seen : 0, fs: fs, font: cs.fontStyle + ' ' + cs.fontWeight + ' ' + (fs * s) + 'px ' + cs.fontFamily, ls: parseFloat(cs.letterSpacing) || 0, lines: [] };
      var cur = null; [].forEach.call(el.querySelectorAll('.rw'), function (sp) { var top = sp.offsetTop; if (!cur || Math.abs(top - cur.top) > fs * .4) { cur = { top: top, x: sp.offsetLeft, t: sp.textContent, hgt: sp.offsetHeight }; h.lines.push(cur); } else cur.t += ' ' + sp.textContent; });
      return h; });
    if (!heads.length) return;
    var maxW = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 4096), x = 0, y = 0, rowH = 0, W2 = 0;
    heads.forEach(function (h) { var aw = Math.ceil(h.w * s) + 2, ah = Math.ceil(h.h * s) + 2; if (aw > maxW) { h.sc = maxW / aw; aw = maxW; ah = Math.ceil(ah * h.sc); } else h.sc = 1; if (x + aw > maxW) { x = 0; y += rowH; rowH = 0; } h.ax = x; h.ay = y; h.aw = aw; h.ah = ah; x += aw; rowH = Math.max(rowH, ah); W2 = Math.max(W2, x); });
    var H2 = y + rowH, c = atlas.cv || (atlas.cv = doc.createElement('canvas')); c.width = W2; c.height = H2; var g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, W2, H2);
    heads.forEach(function (h) { var k = s * h.sc; g.save(); g.beginPath(); g.rect(h.ax, h.ay, h.aw, h.ah); g.clip(); g.font = h.font.replace(/([\d.]+)px/, function (m, n) { return (parseFloat(n) * h.sc) + 'px'; }); g.textBaseline = 'alphabetic'; try { if (h.ls) g.letterSpacing = (h.ls * k) + 'px'; } catch (e) {}
      var asc = g.measureText('Hg').fontBoundingBoxAscent || h.fs * k * .9, OFF = W2 + 4000;
      h.lines.forEach(function (ln) { var tx = h.ax + (h.pad + ln.x) * k, ty = h.ay + (h.pad + ln.top) * k + asc; g.shadowColor = '#fff'; g.shadowBlur = Math.max(1.2, h.fs * k * .021 + .55 * k); g.shadowOffsetX = OFF; g.fillStyle = '#fff'; g.fillText(ln.t, tx - OFF, ty); g.shadowColor = 'transparent'; g.globalAlpha = .34; g.fillText(ln.t, tx, ty); g.globalAlpha = 1; });
      g.restore(); h.k = k; });
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex.at); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    atlas.w = W2; atlas.h = H2; atlas.s = s; atlas.ok = true;
  }

  /* ---------- pointer, resize, the light you can drag ---------- */
  function listen() {
    var rz; W.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { measure(true); }, 140); });
    if (W.ResizeObserver) { var main = doc.querySelector('main'); if (main) new ResizeObserver(function () { clearTimeout(rz); rz = setTimeout(function () { measure(false); }, 120); }).observe(main); }
    W.addEventListener('pointermove', function (e) { ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true; ptr.moved = performance.now(); if (drag) { var L = drag.L; L.x = clamp(drag.x0 + (e.clientX - drag.px) / vw, -0.1, .9); L.y = clamp(drag.y0 + (e.clientY - drag.py) / vh, -.2, .7); var ov = API.lights[L.id] || (API.lights[L.id] = {}); ov.x = L.x; ov.y = L.y; hourOf(L); } }, { passive: true });
    W.addEventListener('pointerdown', function (e) { ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true; ptr.down = true; if (e.pointerType === 'touch') { ptr.tap = performance.now(); return; }
      if (e.target.closest && e.target.closest('a,button,input,select,textarea,label,.smp,.chipc,[data-cast]')) return;
      var S = scrollY() - shiftNow; secs.forEach(function (s) { s.lights.forEach(function (L) { if (!L.drag || drag) return; var o = geom(s, L), dx = e.clientX - o[0], dy = e.clientY + S - o[1], det = o[2] * o[5] - o[3] * o[4], u = (dx * o[5] - dy * o[4]) / det, v = (o[2] * dy - o[3] * dx) / det; if (u > 0 && u < 1 && v > 0 && v < 1) { drag = { L: L, x0: L.x, y0: L.y, px: e.clientX, py: e.clientY }; root.classList.add('dragging-light'); } }); }); });
    W.addEventListener('pointerup', function () { ptr.down = false; if (drag) { drag = null; root.classList.remove('dragging-light'); } });
    doc.addEventListener('pointerleave', function () { ptr.on = false; });
    doc.addEventListener('visibilitychange', function () { if (!doc.hidden && API.on) requestAnimationFrame(frame); });
  }
  function scrollY() { return W.scrollY || W.pageYOffset || 0; }
  function geom(s, L) { var ox = L.x * vw, oy = s.y + L.y * vh - (s.pinned ? 0 : shiftNow), w = L.w * vw, h = L.h * vh; return [ox, oy, w, 0, (L.sh || 0) * h, h]; }
  /* keyed values: where between two keys a progress falls, and the value there */
  function keyAt(P, p) { var n = P.length, i = 0; if (p <= P[0]) return [0, 0, 0]; if (p >= P[n - 1]) return [n - 1, n - 1, 0]; while (i < n - 2 && p > P[i + 1]) i++; return [i, i + 1, (p - P[i]) / (P[i + 1] - P[i])]; }
  function kv(a, k) { return a[k[0]] + (a[k[1]] - a[k[0]]) * k[2]; }
  function clock(h) { var hh = Math.floor(h), mm = Math.round((h - hh) * 12) * 5; if (mm === 60) { hh++; mm = 0; } return (hh > 12 ? hh - 12 : hh) + ':' + (mm < 10 ? '0' : '') + mm + ' pm'; }
  function hourOf(L) { if (!L.drag) return; var hgt = 15.2 + (L.x - (L.x0 == null ? (L.x0 = L.x) : L.x0)) * 4.2 + (L.y - (L.y0 == null ? (L.y0 = L.y) : L.y0)) * 3.0; hgt = clamp(hgt, 13.5, 18.2); var hh = Math.floor(hgt), mm = Math.round((hgt - hh) * 12) * 5; if (mm === 60) { hh++; mm = 0; } API.hour = (hh > 12 ? hh - 12 : hh) + ':' + (mm < 10 ? '0' : '') + mm + ' pm'; doc.dispatchEvent(new CustomEvent('wall:hour', { detail: API.hour })); }

  /* ---------- the frame ---------- */
  var fa = new Float32Array(16), fb = new Float32Array(16), fhr = new Float32Array(12), fha = new Float32Array(12), fhm = new Float32Array(9), fo = new Float32Array(48), fp = new Float32Array(48), fq = new Float32Array(48);
  var amb = [1, 1, 1], sun = [-.78, -.42, .46], lampP = null, lastT = 0, slow = 0, frames = 0, lastSw = 0;
  function frame(now) {
    if (!API.on || doc.hidden) return; requestAnimationFrame(frame);
    if (lenis) lenis.raf(now);
    var S = scrollY(), t = (now - t0) / 1000, dt = Math.min(.05, (now - lastT) / 1000 || .016); lastT = now; intro = Math.min(1, intro + dt / 1.5);
    var shift = pin ? clamp(S - pin.y, 0, pin.len) : 0, Sw = S - shift, pp = pin && pin.len ? shift / pin.len : 0; shiftNow = shift;
    /* the afternoon arrives: on a first visit at the top, the light travels from half past two to ten past four */
    if (introT) { var iu = Math.min(1, (now - introT) / 2800), ie = iu < .5 ? 4 * iu * iu * iu : 1 - Math.pow(-2 * iu + 2, 3) / 2; introP = -1.05 * (1 - ie); if (iu >= 1) { introT = 0; introP = 0; } }
    var pe = pp + introP; API.pe = pe; API.pp = pp;
    secs.forEach(function (s) { var K = s.keys; if (!K) return; var k = keyAt(K.p, s.pinned || !pin ? pe : 0), q, L0 = s.lights[0], L1 = s.lights[1];
      if (L0 && K.L) { for (q in K.L) L0[q] = kv(K.L[q], k); if (K._c.length) { var c0 = K._c[k[0]], c1 = K._c[k[1]]; L0.cc = [c0[0] + (c1[0] - c0[0]) * k[2], c0[1] + (c1[1] - c0[1]) * k[2], c0[2] + (c1[2] - c0[2]) * k[2]]; } }
      if (L1 && K.L2) for (q in K.L2) L1[q] = kv(K.L2[q], k);
      if (K.amb) s.ambK = kv(K.amb, k); if (K.tr) s.tintK = [kv(K.tr, k), kv(K.tg, k), kv(K.tb, k)]; if (K.sx) s.sunK = [kv(K.sx, k), kv(K.sy, k), kv(K.sz, k)];
      if (K.hour) { var hs = clock(kv(K.hour, k)); if (hs !== lastHour) { lastHour = hs; API.hour = hs; doc.dispatchEvent(new CustomEvent('wall:hour', { detail: hs })); } } });
    /* adapt resolution to what the machine can hold */
    frames++; if (dt > .03) slow++; if (frames > 90) { if (slow > 40 && (API.scale || 1) > .62) { API.scale = (API.scale || 1) * .82; measure(false); } slow = 0; frames = 0; }
    gl.viewport(0, 0, cv.width, cv.height); gl.useProgram(prog);
    /* which coat of limewash is going on */
    var k = -1; for (var i = 0; i < coats.length; i++) if (coats[i].y <= S + vh * .9) k = i;
    var bandH = clamp(vh * .25, 150, 270), A = k > 0 ? coats[k - 1].col : toLin(LIME), B = k >= 0 ? coats[k].col : toLin(LIME);
    if (k >= 0 && coats[k].from) A = coats[k].from;
    var front = k >= 0 ? (S + vh * .86 - coats[k].y) / bandH : 0, on = k >= 0 && front < (vh / bandH) + 3.2 && (coats[k].y - S) > -bandH * 8 ? 1 : 0;
    if (k >= 0 && !on) A = B; if (k === 0 && !coats[0].from) { A = B; on = 0; }
    gl.uniform3fv(U.uCA, A); gl.uniform3fv(U.uCB, B); gl.uniform4f(U.uCoat, k >= 0 ? coats[k].y - S : 0, front, bandH, on);
    gl.uniform2f(U.uTab, tab ? tab[0] - S : 1e6, tab ? tab[1] - S : 1e6);
    /* light and air: blend the sections on screen */
    var wa = 0, av = 0, sx = 0, sy = 0, sz = 0, L = [], lampOn = 0, tr = 0, tg = 0, tb = 0, e12 = 1 - Math.exp(-dt * 7.6), e08 = 1 - Math.exp(-dt * 5), e09 = 1 - Math.exp(-dt * 5.6);
    secs.forEach(function (s) { var a = Math.max(0, Math.min(s.y + s.h, S + vh) - Math.max(s.y, S)); if (a <= 0 && !(s.y < S + vh * 1.4 && s.y + s.h > S - vh * .4)) return; if (a > 0 && (s.paint || s.surface || s.lights.length)) { wa += a; av += a * (s.ambK != null ? s.ambK : s.lights[0] && typeof s.lights[0].amb === 'number' ? s.lights[0].amb : s.amb); var tn = s.tintK || [0.985, 1, 1.02]; tr += a * tn[0]; tg += a * tn[1]; tb += a * tn[2]; }
      s.lights.forEach(function (l) { var d = s.sunK || (l.dir === 'r' ? [.78, -.42, .46] : l.dir === 'c' ? [0, -.6, .8] : [-.78, -.42, .46]); if (a > 0 && l.t !== 'lamp') { sx += a * d[0]; sy += a * d[1]; sz += a * d[2]; } L.push({ s: s, l: l, a: a }); }); });
    var ta = wa ? av / wa : 1; amb[0] += (ta - amb[0]) * e12; var sl = Math.hypot(sx, sy, sz); if (sl > 0) { sun[0] += (sx / sl - sun[0]) * e08; sun[1] += (sy / sl - sun[1]) * e08; sun[2] += (sz / sl - sun[2]) * e08; }
    if (wa) { tint[0] += (tr / wa - tint[0]) * e12; tint[1] += (tg / wa - tint[1]) * e12; tint[2] += (tb / wa - tint[2]) * e12; }
    gl.uniform3f(U.uAmb, amb[0] * tint[0], amb[0] * tint[1], amb[0] * tint[2]);
    var dn = amb[0] < .34; if (dn !== dim) { dim = dn; root.classList.toggle('dim', dim); } var sn = Math.hypot(sun[0], sun[1], sun[2]); gl.uniform3f(U.uSun, sun[0] / sn, sun[1] / sn, sun[2] / sn);
    /* two lights at a time: the ones that cover most of the screen, and a light that is switched off gives up its place */
    L.forEach(function (x) { x.k = x.a * (x.l.i == null || x.l.i > .03 ? 1 : .01); }); L.sort(function (a, b) { return b.k - a.k; }); fa.fill(0); fb.fill(0);
    for (i = 0; i < 2 && i < L.length; i++) { var s = L[i].s, l = L[i].l, f = i ? fb : fa, c = l.cc ? null : hex(l.c || '#FFD9A6'), ty = TYPES[l.t] || 6;
      if (ty === 5) { var tx = l.x * vw, tyy = s.pinned ? s.y + l.y * vh + shift : s.y + l.y * s.h; if (l.follow && ptr.on && fine) { var py = ptr.y + S; if (py > s.y - 40 && py < s.y + s.h + 40) { tx = ptr.x; tyy = py; } } else if (l.follow && !fine) { tyy = clamp(S + vh * .42, s.y + vh * .2, s.y + s.h - vh * .25); } tyy -= shift;
        if (!l.p) l.p = [tx, tyy]; l.p[0] += (tx - l.p[0]) * e09; l.p[1] += (tyy - l.p[1]) * e09; f[0] = l.p[0]; f[1] = l.p[1]; f[2] = (l.r || .3) * Math.max(vw, 700); f[3] = l.hgt || .5; f[6] = 5; if (L[i].a > 0 && (l.i == null || l.i > .03)) lampOn = Math.max(lampOn, clamp((.58 - amb[0]) / .2, 0, 1)); }
      else { var o = geom(s, l); f[0] = o[0]; f[1] = o[1]; f[2] = o[2]; f[3] = o[3]; f[4] = o[4]; f[5] = o[5]; f[6] = ty; f[7] = l.soft || 12; f[12] = l.cols || 2; f[13] = l.rows || 3; f[14] = l.bar == null ? .03 : l.bar; f[15] = l.leaf || 0; }
      if (c) { f[8] = Math.pow(c[0], 2.2); f[9] = Math.pow(c[1], 2.2); f[10] = Math.pow(c[2], 2.2); } else { f[8] = l.cc[0]; f[9] = l.cc[1]; f[10] = l.cc[2]; } f[11] = l.i == null ? .8 : l.i; }
    gl.uniform4fv(U.uLa, fa); gl.uniform4fv(U.uLb, fb); gl.uniform1f(U.uLampK, lampOn);
    /* headlines in view press in */
    fhr.fill(0); fha.fill(0); fhm.fill(0); var n = 0;
    heads.forEach(function (h) { var sy0 = h.y - S + (h.pin ? shift : 0); if (sy0 > vh + 60 || sy0 + h.h < -60) return; if (!h.seen && sy0 < vh * .9) h.seen = now; if (h.seen) h.str = Math.min(1, h.str + dt / 1.25); if (n > 2) return; var e = 1 - Math.pow(1 - h.str, 3);
      fhr[n * 4] = h.x; fhr[n * 4 + 1] = sy0; fhr[n * 4 + 2] = h.w; fhr[n * 4 + 3] = h.h; fha[n * 4] = (h.ax + 1) / atlas.w; fha[n * 4 + 1] = (h.ay + 1) / atlas.h; fha[n * 4 + 2] = (h.aw - 2) / atlas.w; fha[n * 4 + 3] = (h.ah - 2) / atlas.h; fhm[n * 3] = h.mode; fhm[n * 3 + 1] = e; fhm[n * 3 + 2] = h.k; n++; });
    gl.uniform4fv(U.uHr, fhr); gl.uniform4fv(U.uHa, fha); gl.uniform3fv(U.uHm, fhm); gl.uniform2f(U.uAtS, atlas.w, atlas.h);
    /* prints, cards, samples */
    var m = 0, vel = S - lastS, used = [0, 0, 0];
    var near = tab && tab[0] - S < vh * 1.5 && tab[1] - S > -vh * .5; if (tab && tab[0] - S < vh * 2.6 && tab[1] - S > -vh) API.lazy();
    for (i = 0; i < objs.length && m < 12; i++) { var o = objs[i]; if ((o.live || o.type === 5) && near) { var r = pr(o.el); o.x = r.x; o.y = r.y; o.w = r.w; o.h = r.h; }
      var y0 = o.y - S + (o.pin ? shift : 0); if (y0 > vh + 140 || y0 + o.h < -140 || o.w < 2) { if (o.type === 1 && (y0 > vh * 2.2 || y0 + o.h < -vh * 1.6)) drop(o); else if (o.type === 1 && y0 < vh * 2) photo(o); continue; }
      var slot = 0, fx = 1, fy = 1;
      if (o.type === 1) { var ph = photo(o); if (!ph || !ph.ok) { continue; } slot = -1; for (var z = 0; z < 3; z++) if (slots[z] === o) slot = z; if (slot < 0) for (z = 0; z < 3; z++) if (!slots[z] || !used[z] && !inView(slots[z], S)) { slot = z; slots[z] = o; break; } if (slot < 0) continue; used[slot] = 1;
        gl.activeTexture(gl.TEXTURE5 + slot); gl.bindTexture(gl.TEXTURE_2D, ph.t); var ia = ph.w / ph.h, ba = (o.w - 2 * o.border) / (o.h - 2 * o.border); if (ia > ba) fx = ba / ia; else fy = ia / ba;
        o.sv += (-vel * .012 - o.sw * .09 - o.sv * .16); o.sw = clamp(o.sw + o.sv, -5, 5); }
      fo[m * 4] = o.x; fo[m * 4 + 1] = y0; fo[m * 4 + 2] = o.w; fo[m * 4 + 3] = o.h; fp[m * 4] = o.type; fp[m * 4 + 1] = o.depth; fp[m * 4 + 2] = o.type === 1 ? o.sw : 0; fp[m * 4 + 3] = o.rad;
      fq[m * 4] = o.type === 1 ? slot : o.mat; fq[m * 4 + 1] = o.type === 1 ? fx : o.rep; fq[m * 4 + 2] = o.type === 1 ? fy : o.rep * o.h / o.w; fq[m * 4 + 3] = o.type === 1 ? o.border : 0; m++; }
    gl.uniform4fv(U.uOr, fo); gl.uniform4fv(U.uOp, fp); gl.uniform4fv(U.uOq, fq); gl.uniform1i(U.uOn, m);
    gl.uniform3fv(U.uVis, vis); gl.uniform1f(U.uBoard, boardT < 0 ? -1 : (now - boardT) / 1000);
    /* marks in the wet plaster (hero only) */
    var wetOn = secs.length && secs[0].el.hasAttribute('data-wet') && S < secs[0].h - 80;
    if (wetOn || gr.live > now) sim(now, S, wetOn, Sw);
    gl.useProgram(prog); gl.viewport(0, 0, cv.width, cv.height); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, gr.a || tex.gr);
    gl.uniform4f(U.uGrP, gr.a && gr.live > now ? 1 : 0, gr.w ? 1.2 / gr.w : 0, gr.h ? 1.2 / gr.h : 0, 26);
    gl.uniform2f(U.uRes, cv.width, cv.height); gl.uniform1f(U.uDpr, cv.width / vw); gl.uniform1f(U.uS, Sw); gl.uniform1f(U.uT, t); gl.uniform1f(U.uVw, vw); gl.uniform1f(U.uVh, vh); gl.uniform1f(U.uIntro, 1 - Math.pow(1 - intro, 3)); gl.uniform2f(U.uPtr, ptr.x, ptr.y);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.drawArrays(gl.TRIANGLES, 0, 3);
    lastS = S; lastSw = Sw; ptr.px = ptr.x; ptr.py = ptr.y;
  }
  function inView(o, S) { var y0 = o.y - S; return y0 < vh + 140 && y0 + o.h > -140; }
  function photo(o) { var im = o.img; if (!im) return null; var ph = photos.get(o); if (ph) return ph; if (!im.complete || !im.naturalWidth) { if (im.loading === 'lazy') im.loading = 'eager'; return null; }
    ph = { t: gl.createTexture(), ok: false, w: im.naturalWidth, h: im.naturalHeight }; photos.set(o, ph);
    var up = function (src) { gl.activeTexture(gl.TEXTURE0 + 9); gl.bindTexture(gl.TEXTURE_2D, ph.t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); ph.ok = true; o.el.classList.add('in-wall'); };
    if (W.createImageBitmap) createImageBitmap(im).then(up, function () { up(im); }); else up(im); return ph; }
  function drop(o) { var ph = photos.get(o); if (!ph) return; gl.deleteTexture(ph.t); photos.delete(o); o.el.classList.remove('in-wall'); for (var z = 0; z < 3; z++) if (slots[z] === o) slots[z] = null; }

  function sim(now, S, wetOn, Sw) {
    var sw = Math.max(64, Math.round(vw / 2)), sh = Math.max(64, Math.round(vh / 2));
    if (!gr.a || gr.w !== sw || gr.h !== sh) { [gr.a, gr.b].forEach(function (t) { if (t) gl.deleteTexture(t); }); gr.w = sw; gr.h = sh; var mk = function () { var t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + 10); gl.bindTexture(gl.TEXTURE_2D, t);
        if (gr.fmt === 'f') gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, sw, sh, 0, gl.RGBA, gl.HALF_FLOAT, null); else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sw, sh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        var f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); gl.clearColor(.5, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); return [t, f]; };
      var A = mk(), B = mk(); gr.a = A[0]; gr.fa = A[1]; gr.b = B[0]; gr.fb = B[1]; }
    var k = sw / vw, amp = 0, seg = [0, 0, 0, 0], sec = secs[0], inHero = wetOn && ptr.on && ptr.y + S < sec.y + sec.h;
    if (inHero && !drag) { var x1 = ptr.x * k, y1 = (vh - ptr.y) * k, x0 = ptr.px * k, y0 = (vh - ptr.py) * k, mv = Math.hypot(x1 - x0, y1 - y0);
      if (ptr.tap && now - ptr.tap < 60) { seg = [x1, y1, x1, y1]; amp = .95; ptr.tap = 0; gr.live = now + 9000; }
      else if (fine && mv > .15 && mv < 140 && now - ptr.moved < 120) { seg = [x0, y0, x1, y1]; amp = Math.min(.42, .14 + mv * .03); gr.live = now + 9000; if (!gr.first) { gr.first = 1; doc.dispatchEvent(new CustomEvent('wall:mark')); } } }
    gl.useProgram(simP); gl.bindFramebuffer(gl.FRAMEBUFFER, gr.fb); gl.viewport(0, 0, sw, sh); gl.activeTexture(gl.TEXTURE0 + 10); gl.bindTexture(gl.TEXTURE_2D, gr.a); gl.uniform1i(SU.uPrev, 10);
    gl.uniform2f(SU.uSize, sw, sh); gl.uniform2f(SU.uShift, 0, -(Sw - lastSw) * k / sh); gl.uniform4fv(SU.uSeg, seg); gl.uniform3f(SU.uK, (fine ? 11 : 24) * k * (vw / 1440 * .4 + .6), amp, .9925);
    gl.drawArrays(gl.TRIANGLES, 0, 3); var t = gr.a; gr.a = gr.b; gr.b = t; t = gr.fa; gr.fa = gr.fb; gr.fb = t;
  }

  /* ---------- for the page ---------- */
  API.paint = function (el, colour) { if (typeof el === 'string') el = doc.querySelector(el); if (!el) return; el.setAttribute('data-paint', colour); if (gl) measure(false); };
  API.board = function (colour) { vis = toLin(hex(colour)); boardT = performance.now(); };
  API.refresh = function (full) { if (gl) measure(!!full); };
  /* move a light to new numbers over time (the light study on the room pages) */
  API.tween = function (id, to, ms) { var L = null; secs.forEach(function (s) { s.lights.forEach(function (l) { if (l.id === id) L = l; }); }); if (!L) return; var from = {}, k, t1 = performance.now(), ov = API.lights[id] || (API.lights[id] = {}); for (k in to) from[k] = typeof to[k] === 'number' ? (L[k] == null ? to[k] : L[k]) : null;
    if (typeof to.c === 'string') { L.c = to.c; ov.c = to.c; } if (to.t) { L.t = to.t; ov.t = to.t; }
    (function step(now) { var u = Math.min(1, (now - t1) / (ms || 1200)), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; for (k in to) if (from[k] !== null) { L[k] = from[k] + (to[k] - from[k]) * e; ov[k] = L[k]; } if (u < 1) requestAnimationFrame(step); })(t1); };
  API.boot = boot;

  var kick = function () { ['pointermove', 'pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel'].forEach(function (e) { W.removeEventListener(e, kick, true); }); (W.requestIdleCallback || setTimeout)(boot, { timeout: 300 }); };
  ['pointermove', 'pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel'].forEach(function (e) { W.addEventListener(e, kick, { capture: true, passive: true, once: true }); });
  /* the wall wakes on the visitor's first move, or by itself a moment after the page has loaded and painted */
  var idle = /[?&]gl/.test(Q) ? 0 : 1400;
  if (doc.readyState === 'complete') setTimeout(kick, idle); else W.addEventListener('load', function () { setTimeout(kick, idle); });
})();
