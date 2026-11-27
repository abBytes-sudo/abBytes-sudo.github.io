/* Constellation: a business plan drawn as stars. A small Canvas 2D renderer projects 3D points onto the page,
   turns them slowly, lets a visitor drag to turn and click a star to read its name and links. Three skies use it:
   the hero (Ember's 24-month plan, the example the live app ships with), "Flat against deep" (the same plan with
   three links lit) and "Paste your plan" (paste-plan.js builds that data with CstSky.create).
   A sky draws only while it is on screen and the tab is visible. Under reduced motion, or on a low-power device,
   it renders a still frame that still turns when dragged. */
(function () {
  'use strict';
  var d = document, W = window, M = Math;
  var reduce = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cn = navigator.connection || {};
  var STILL = reduce || !!cn.saveData || (navigator.hardwareConcurrency || 8) < 3;
  var hasIO = 'IntersectionObserver' in W, TAU = M.PI * 2;
  var coarse = W.matchMedia('(pointer: coarse)').matches;
  function now() { return W.performance ? performance.now() : Date.now(); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255); }

  /* ---- Ember's plan, as the live app ships it: the brand, 6 pillars, 30 initiatives, 27 dependencies ---- */
  var COL = { core: '#ffe7a3', product: '#7fb4ff', brand: '#c79bff', store: '#66e6c8', growth: '#ffc978', ops: '#79e7ff', revenue: '#f58ab0' };
  var ROOT = ['root', 'Ember', 'Direct-to-consumer coffee · 24-month plan', 'A specialty-coffee brand: freshly roasted beans and flexible subscriptions sold online, then extended into marketplaces, retail and wholesale.'];
  var PILLARS = { // name, timing, description
    product: ['Product & Sourcing', 'Months 1–12', 'The coffee itself: sourcing, roasting, the range and freshness.'],
    brand: ['Brand & Content', 'Months 1–24', 'The identity, story and content that make people care.'],
    store: ['Store & Channels', 'Months 2–24', 'Where the coffee is sold: owned, marketplace and retail.'],
    growth: ['Growth & Acquisition', 'Months 3–24', 'How new customers are found, and found affordably.'],
    ops: ['Fulfilment & Ops', 'Months 2–24', 'Getting fresh coffee to the door, reliably and at scale.'],
    revenue: ['Retention & Revenue', 'Months 3–24', 'How revenue is earned, compounded and made predictable.']
  };
  var GROUPS = ['product', 'brand', 'store', 'growth', 'ops', 'revenue'];
  var ATOMS = [ // id, group, name, timing, description, key initiative
    ['p_source', 'product', 'Green-Bean Sourcing', 'Month 1', 'Single-origin and blend suppliers with reliable, traceable supply.'],
    ['p_roast', 'product', 'Roast Profiles & QA', 'Months 1–2', 'Signature roast profiles and a cupping routine for consistency, batch to batch.'],
    ['p_range', 'product', 'Core Range & Blends', 'Months 2–3', 'A tight launch range: a hero blend, two single-origins and one decaf.'],
    ['p_pack', 'product', 'Packaging & Freshness', 'Months 2–3', 'Valve bags, roast-date stamping and packaging that protects freshness in transit.'],
    ['p_expand', 'product', 'Seasonal & Limited Drops', 'Months 6–24', 'Rotating micro-lots and seasonal blends that give reasons to return.'],
    ['b_identity', 'brand', 'Brand Identity & Story', 'Month 1', 'Name, logo, palette and the founding story that give the brand a point of view.'],
    ['b_photo', 'brand', 'Product & Lifestyle Photography', 'Months 1–2', 'A reusable library of product and lifestyle shots for every channel.'],
    ['b_content', 'brand', 'Editorial & Brew Guides', 'Months 2–4', 'Brew guides, origin stories and recipes that build authority and feed SEO.'],
    ['b_social', 'brand', 'Social & Community', 'Months 2–24', 'Instagram, TikTok and a newsletter that turn buyers into a community.'],
    ['b_ugc', 'brand', 'UGC & Reviews Engine', 'Months 4–24', 'Reviews and customer content, collected as social proof.'],
    ['st_site', 'store', 'D2C Store (Shopify) Live', 'Months 2–3', 'The owned storefront: fast, mobile-first and built to convert.'],
    ['st_sub', 'store', 'Subscription Storefront', 'Months 3–4', 'Flexible coffee subscriptions with frequency, grind and gifting options.'],
    ['st_market', 'store', 'Marketplaces (Amazon etc.)', 'Months 6–9', 'Selective marketplace presence for reach, without eating D2C margin.'],
    ['st_retail', 'store', 'Retail & Café Stockists', 'Months 9–15', 'Wholesale to cafés and specialty grocers as a second channel.'],
    ['st_pos', 'store', 'Pop-ups & Sampling Events', 'Months 6–24', 'Pop-ups and events that drive trial and first orders.'],
    ['g_paid', 'growth', 'Paid Social & Search', 'Months 3–24', 'Meta and Google acquisition with a clean first-order economics model.'],
    ['g_seo', 'growth', 'SEO & Content Discovery', 'Months 4–24', 'Rank for brew, origin and gifting intent to lower blended CAC.'],
    ['g_influence', 'growth', 'Creator & Affiliate Program', 'Months 4–24', 'Coffee creators and affiliates as a scalable, trackable channel.'],
    ['g_referral', 'growth', 'Referral & Gifting Loops', 'Months 6–24', 'Give-a-bag, get-a-bag loops that turn happy customers into acquisition.', 1],
    ['g_email', 'growth', 'Lifecycle Email & SMS', 'Months 3–24', 'Welcome, win-back and replenishment flows that do the quiet selling.'],
    ['o_inventory', 'ops', 'Inventory & Roast-to-Order', 'Months 2–3', 'Roast batches planned against demand, so coffee ships days-fresh.'],
    ['o_3pl', 'ops', 'Fulfilment / 3PL', 'Months 3–4', 'Pick, pack and ship that scales, with roast-date-accurate dispatch.'],
    ['o_ship', 'ops', 'Shipping & Packaging Ops', 'Months 3–6', 'Carrier mix, protective packaging and predictable delivery windows.'],
    ['o_cx', 'ops', 'Customer Support Desk', 'Months 3–24', 'Fast, on-brand support across email, chat and social.'],
    ['o_supply', 'ops', 'Supply-Chain Resilience SLA', 'Months 9–24', 'Backup suppliers and stock buffers so the range never goes dark.'],
    ['r_first', 'revenue', 'First Revenue (D2C bags)', 'Month 3', 'Revenue from the first online orders of whole-bean and ground coffee.'],
    ['r_subs', 'revenue', 'Subscription Revenue Engine', 'Months 4–6', 'Recurring, predictable revenue: the heart of the whole model.', 1],
    ['r_ltv', 'revenue', 'Retention & LTV Program', 'Months 6–12', 'Loyalty, replenishment and win-back that lift lifetime value.'],
    ['r_whole', 'revenue', 'Wholesale Revenue Line', 'Months 12–15', 'Higher-volume, lower-margin revenue from cafés and stockists.'],
    ['r_finance', 'revenue', 'Unit Economics & Finance', 'Months 6–24', 'Contribution margin, CAC to LTV and cash flow: the numbers the plan answers to.']
  ];
  var DEPS = [['p_source', 'p_roast'], ['p_roast', 'p_range'], ['p_range', 'p_pack'], ['b_identity', 'b_photo'], ['b_photo', 'b_content'],
    ['b_identity', 'st_site'], ['p_pack', 'st_site'], ['st_site', 'st_sub'], ['st_site', 'r_first'], ['st_sub', 'r_subs'],
    ['o_inventory', 'o_3pl'], ['o_3pl', 'o_ship'], ['o_ship', 'r_first'], ['g_paid', 'r_first'], ['g_email', 'r_subs'],
    ['b_content', 'g_seo'], ['b_social', 'g_influence'], ['r_first', 'g_referral'], ['r_first', 'b_ugc'], ['r_subs', 'r_ltv'],
    ['r_subs', 'r_finance'], ['p_range', 'st_retail'], ['o_supply', 'st_retail'], ['st_retail', 'r_whole'], ['p_expand', 'st_pos'],
    ['r_ltv', 'r_finance'], ['g_referral', 'r_subs']];

  /* the plan in 3D: six pillars wind out from the brand as the arms of a small galaxy, each warped up or down.
     An initiative sits along its arm by the month it starts, so distance from the brand reads as time
     (the app's Now → Month 24). Part-of links are kept for the card and drawn as the arms themselves. */
  function ember() {
    var nodes = [], links = [], at = {}, tips = [], arms = [];
    function add(n) { n.i = nodes.length; at[n.id] = n.i; nodes.push(n); return n; }
    add({ id: 'root', name: ROOT[1], kick: ROOT[2], desc: ROOT[3], kind: 0, color: COL.core, x: 0, y: 0, z: 0 });
    var RING = ['product', 'store', 'revenue', 'growth', 'brand', 'ops'], WARP = [.34, -.24, .2, -.34, .26, -.18];
    RING.forEach(function (g, k) {
      var base = k / 6 * TAU, P = PILLARS[g];
      function spot(r, side, lift) {
        var th = base + r * .0034, c = M.cos(th), sn = M.sin(th);
        return { x: r * c - sn * side, y: r * WARP[k] + lift, z: r * sn + c * side };
      }
      var hp = spot(62, 0, 0);
      var hub = add({ id: g, name: P[0], kick: 'Pillar · ' + P[1], desc: P[2], kind: 1, color: COL[g], x: hp.x, y: hp.y, z: hp.z });
      links.push({ s: 0, t: hub.i, hide: true });
      var j = 0, far = 0, arm = [0, hub.i], mine = [];
      ATOMS.forEach(function (a) {
        if (a[1] !== g) return;
        var m = +(/(\d+)/.exec(a[3]) || [0, 1])[1], r = 104 + (m - 1) * 17 + j * 9;
        var q = spot(r, (j % 2 ? 1 : -1) * (11 + (j >> 1) * 9), (j % 3 - 1) * 13);
        var n = add({ id: a[0], name: a[2], kick: P[0] + ' · ' + a[3], desc: a[4], kind: 2, key: !!a[5], color: COL[g], x: q.x, y: q.y, z: q.z, r: r });
        links.push({ s: hub.i, t: n.i, hide: true });
        mine.push(n); far = M.max(far, r); j++;
      });
      mine.sort(function (a, b) { return a.r - b.r; }).forEach(function (n) { arm.push(n.i); });
      arms.push({ ids: arm, color: COL[g] });
      var tp = spot(far + 46, 0, 0);
      tips.push({ x: tp.x, y: tp.y + 8, z: tp.z, label: P[0].toUpperCase(), color: COL[g], g: hub.i });
    });
    DEPS.forEach(function (p) { links.push({ s: at[p[0]], t: at[p[1]], dep: true }); });
    return { nodes: nodes, links: links, tips: tips, arms: arms, at: at };
  }

  /* ---- glow sprites, one per colour ---- */
  var SPR = {};
  function sprite(c) {
    if (SPR[c]) return SPR[c];
    var s = d.createElement('canvas'), x = s.getContext('2d'), R = 48, k = rgb(c);
    s.width = s.height = R * 2;
    var g = x.createRadialGradient(R, R, 0, R, R, R);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.09, 'rgba(255,255,255,.95)'); g.addColorStop(.16, 'rgba(' + k + ',.9)');
    g.addColorStop(.36, 'rgba(' + k + ',.3)'); g.addColorStop(.66, 'rgba(' + k + ',.07)'); g.addColorStop(1, 'rgba(' + k + ',0)');
    x.fillStyle = g; x.fillRect(0, 0, R * 2, R * 2);
    return (SPR[c] = s);
  }
  function field(n, seed) {
    var out = [], v = seed || 1;
    function r() { v = (v * 16807) % 0x7fffffff; return v / 0x7fffffff; }
    for (var i = 0; i < n; i++) out.push({ x: r(), y: r(), r: .6 + r() * 1.1, a: .18 + r() * .5, f: .4 + r() * 1.4, p: r() * TAU });
    return out;
  }

  /* ---- a sky ---- */
  var ALL = [];
  function Sky(box, o) {
    var s = this;
    s.box = box; s.o = o; s.cv = box.querySelector('canvas'); s.c = s.cv.getContext('2d');
    s.card = box.querySelector('.cst-card'); s.live = box.querySelector('[data-live]');
    s.yaw = o.yaw || 0; s.pitch = o.pitch != null ? o.pitch : .42; s.vel = 0; s.ph = 0;
    s.sel = -1; s.hov = -1; s.hl = o.hl || null; s.hlOn = -1;
    s.raf = 0; s.last = 0; s.vis = !hasIO; s.idle = -1e9; s.down = null; s.D = 1000; s.t0 = now();
    s.bg = field(o.stars || 70, o.seed || 7);
    s.tickB = function (t) { s.tick(t); };
    s.set(o.data || { nodes: [], links: [] });
    s.size(); s.bind();
    if (W.ResizeObserver) new ResizeObserver(function () { s.size(); }).observe(box);
    else W.addEventListener('resize', function () { s.size(); });
    if (hasIO) new IntersectionObserver(function (es) {
      s.vis = es[0].isIntersecting;
      if (s.vis) s.kick(); else if (s.raf) { cancelAnimationFrame(s.raf); s.raf = 0; }
    }, { rootMargin: '80px 0px' }).observe(box);
    d.addEventListener('visibilitychange', function () { if (!d.hidden) s.kick(); });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { s.kick(); });
    if (coarse) { var tip = box.querySelector('.cst-tip span'); if (tip) tip.textContent = tip.textContent.replace('Click', 'Tap'); }
    ALL.push(s);
  }
  var P = Sky.prototype;
  P.set = function (data) {
    var s = this;
    s.n = data.nodes; s.l = data.links; s.tips = data.tips || null; s.arms = data.arms || null;
    s.nb = s.n.map(function () { return { inD: [], outD: [], up: [], down: [] }; });
    var eh = 0, ev = 0;
    s.n.forEach(function (n) { n.rgb = rgb(n.color); if (n.on == null) n.on = true; eh = M.max(eh, M.sqrt(n.x * n.x + n.z * n.z)); ev = M.max(ev, M.abs(n.y)); });
    s.ext = { h: M.max(eh, 140), v: M.max(ev, 50) };
    s.R = data.R || M.max(eh, 160);
    s.l.forEach(function (l) {
      var a = s.n[l.s], b = s.n[l.t];
      if (l.dep) {
        s.nb[l.t].inD.push(l.s); s.nb[l.s].outD.push(l.t);
        var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, mz = (a.z + b.z) / 2, len = M.sqrt(mx * mx + mz * mz) || 1;
        var push = 26 + M.sqrt((a.x - b.x) * (a.x - b.x) + (a.z - b.z) * (a.z - b.z)) * .18;
        l.cp = { x: mx + mx / len * push, y: my + 16, z: mz + mz / len * push };
        l.sp = .16 + ((l.s * 7 + l.t * 13) % 10) / 70; l.ph = ((l.s * 31 + l.t * 17) % 100) / 100;
      } else { s.nb[l.t].up.push(l.s); s.nb[l.s].down.push(l.t); }
    });
    s.order = s.n.map(function (n, i) { return i; });
    s.sel = -1; s.hov = -1; s.focusSet();
    if (s.w) s.size();
  };
  P.size = function () {
    var s = this, w = s.box.clientWidth, h = s.box.clientHeight;
    if (!w || !h) return;
    var dpr = M.min(W.devicePixelRatio || 1, w < 640 ? 1.75 : 2), o = s.o;
    s.w = w; s.h = h; s.dpr = dpr;
    s.cv.width = M.round(w * dpr); s.cv.height = M.round(h * dpr);
    s.f = s.fit(w, h) * s.D * (o.zoom || 1); s.k0 = s.f / s.D; s.ox = w * (o.cx || .5) + (o.dx || 0); s.oy = h * (o.cy || .5) + (o.dy || 0);
    s.kick();
  };
  /* scale so the plan fills the box at every angle it will turn through (all round for spin, a swing for sway) */
  P.fit = function (w, h) {
    var s = this, o = s.o, mx = 80, my = 50, ys = [], a, cp = M.cos(s.pitch), sp = M.sin(s.pitch);
    if (o.mode === 'spin') for (a = 0; a < 16; a++) ys.push(a / 16 * TAU);
    else for (a = -3; a <= 3; a++) ys.push(s.yaw + a * .2);
    ys.forEach(function (yw) {
      var cy = M.cos(yw), sy = M.sin(yw);
      s.n.forEach(function (n) {
        var x1 = n.x * cy + n.z * sy, z1 = -n.x * sy + n.z * cy, y2 = n.y * cp - z1 * sp, z2 = n.y * sp + z1 * cp, k = s.D / (s.D + z2);
        mx = M.max(mx, M.abs(x1 * k)); my = M.max(my, M.abs(y2 * k));
      });
    });
    return M.min((w / 2) * (o.fx || .86) / mx, (h / 2) * (o.fy || .86) / my);
  };
  P.proj = function () {
    var s = this, cy = M.cos(s.yaw), sy = M.sin(s.yaw), cp = M.cos(s.pitch), sp = M.sin(s.pitch), f = s.f, D = s.D, ox = s.ox, oy = s.oy;
    function pr(o) {
      var x1 = o.x * cy + o.z * sy, z1 = -o.x * sy + o.z * cy, y2 = o.y * cp - z1 * sp, z2 = o.y * sp + z1 * cp, k = f / (D + z2);
      o.sx = ox + x1 * k; o.sy = oy - y2 * k; o.k = k; o.d = z2;
    }
    s.n.forEach(pr);
    s.l.forEach(function (l) { if (l.dep) pr(l.cp); });
    if (s.tips) s.tips.forEach(pr);
  };
  P.fade = function (o) { return clamp(.64 - o.d / (this.R * 2.3), .3, 1); };
  /* which stars and links stand out: the selected star and its neighbours, or the highlighted links */
  P.focusSet = function () {
    var s = this, rel = [], i;
    s.focus = s.sel >= 0 || !!(s.hl && s.hl.length);
    if (s.sel >= 0) {
      var nb = s.nb[s.sel]; rel[s.sel] = 2;
      [nb.inD, nb.outD, nb.up, nb.down].forEach(function (a) { a.forEach(function (j) { rel[j] = rel[j] || 1; }); });
    } else if (s.hl) {
      for (i = 0; i < s.hl.length; i++) if (s.hlOn < 0 || s.hlOn === i) { rel[s.hl[i].s] = 1; rel[s.hl[i].t] = 1; }
    }
    s.rel = rel;
  };
  P.lit = function (l) { // 2 lit, 1 normal, 0 dimmed
    var s = this;
    if (s.sel >= 0) return (l.s === s.sel || l.t === s.sel) ? 2 : 0;
    if (s.hl) {
      for (var i = 0; i < s.hl.length; i++) if (s.hl[i].s === l.s && s.hl[i].t === l.t) return (s.hlOn < 0 || s.hlOn === i) ? 2 : 1;
      return 0;
    }
    return 1;
  };
  P.draw = function (t) {
    var s = this, c = s.c, w = s.w, h = s.h, secs = (t - s.t0) / 1000, anim = !STILL, i, n, l, al;
    if (!w) return;
    c.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, w, h);
    var shift = s.yaw * 30;
    c.fillStyle = '#ebe6ff';
    for (i = 0; i < s.bg.length; i++) {
      var b = s.bg[i], x = ((b.x * w + shift * b.r) % w + w) % w;
      c.globalAlpha = b.a * (anim ? .7 + .3 * M.sin(secs * b.f + b.p) : 1);
      c.fillRect(x, b.y * h, b.r, b.r);
    }
    c.globalAlpha = 1;
    s.proj();
    var focus = s.focus, rel = s.rel;
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    /* part-of: each pillar drawn as one smooth arm through its stars, plus any plain part-of lines */
    c.lineWidth = 1.2;
    if (s.arms) s.arms.forEach(function (arm) {
      var ids = arm.ids, k0 = s.n[ids[1]], al0 = .3 * s.fade(k0);
      if (focus) al0 *= rel[ids[1]] ? 1.4 : .3;
      c.strokeStyle = 'rgba(' + k0.rgb + ',' + al0.toFixed(3) + ')';
      c.beginPath(); c.moveTo(s.n[ids[0]].sx, s.n[ids[0]].sy);
      for (var q = 1; q < ids.length - 1; q++) {
        var p1 = s.n[ids[q]], p2 = s.n[ids[q + 1]];
        c.quadraticCurveTo(p1.sx, p1.sy, (p1.sx + p2.sx) / 2, (p1.sy + p2.sy) / 2);
      }
      var pl = s.n[ids[ids.length - 1]]; c.lineTo(pl.sx, pl.sy); c.stroke();
    });
    c.lineWidth = 1;
    for (i = 0; i < s.l.length; i++) {
      l = s.l[i]; if (l.dep || l.hide) continue;
      var a = s.n[l.s], e = s.n[l.t]; if (!a.on || !e.on) continue;
      al = .24 * s.fade(e);
      if (focus) al *= (rel[l.s] && rel[l.t]) ? 1.5 : .25;
      c.strokeStyle = 'rgba(' + e.rgb + ',' + al.toFixed(3) + ')';
      c.beginPath(); c.moveTo(a.sx, a.sy); c.lineTo(e.sx, e.sy); c.stroke();
    }
    /* dependencies: curved lines of light, an arrowhead for direction, particles flowing source → target */
    for (i = 0; i < s.l.length; i++) {
      l = s.l[i]; if (!l.dep) continue;
      var A = s.n[l.s], B = s.n[l.t]; if (!A.on || !B.on) continue;
      var lv = s.lit(l), grow = l.born ? clamp((t - l.born) / 700, 0, 1) : 1;
      al = (lv === 2 ? 1 : lv === 1 ? .62 : .1) * M.max(s.fade(A), s.fade(B)) * grow;
      var g = c.createLinearGradient(A.sx, A.sy, B.sx, B.sy);
      g.addColorStop(0, 'rgba(' + A.rgb + ',' + al.toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + B.rgb + ',' + al.toFixed(3) + ')');
      c.strokeStyle = g; c.lineWidth = lv === 2 ? 2.6 : 1.5;
      c.beginPath(); c.moveTo(A.sx, A.sy); c.quadraticCurveTo(l.cp.sx, l.cp.sy, B.sx, B.sy); c.stroke();
      var q = .66, mx = (1 - q) * (1 - q) * A.sx + 2 * (1 - q) * q * l.cp.sx + q * q * B.sx, my = (1 - q) * (1 - q) * A.sy + 2 * (1 - q) * q * l.cp.sy + q * q * B.sy;
      var tx = 2 * (1 - q) * (l.cp.sx - A.sx) + 2 * q * (B.sx - l.cp.sx), ty = 2 * (1 - q) * (l.cp.sy - A.sy) + 2 * q * (B.sy - l.cp.sy), tl = M.sqrt(tx * tx + ty * ty) || 1;
      tx /= tl; ty /= tl;
      var ah = lv === 2 ? 6.5 : 4.5;
      c.fillStyle = 'rgba(' + B.rgb + ',' + M.min(1, al * 1.3).toFixed(3) + ')';
      c.beginPath(); c.moveTo(mx + tx * ah, my + ty * ah); c.lineTo(mx - tx * ah - ty * ah * .7, my - ty * ah + tx * ah * .7); c.lineTo(mx - tx * ah + ty * ah * .7, my - ty * ah - tx * ah * .7); c.closePath(); c.fill();
      if (anim && lv > 0 && grow === 1) {
        var np = lv === 2 ? 3 : 1, spr = sprite(B.color);
        for (var p = 0; p < np; p++) {
          var u = (secs * l.sp * (lv === 2 ? 1.6 : 1) + l.ph + p / np) % 1, v = 1 - u;
          var px = v * v * A.sx + 2 * v * u * l.cp.sx + u * u * B.sx, py = v * v * A.sy + 2 * v * u * l.cp.sy + u * u * B.sy, ps = lv === 2 ? 13 : 9;
          c.globalAlpha = al * .9 * M.sin(u * M.PI); c.drawImage(spr, px - ps / 2, py - ps / 2, ps, ps);
        }
        c.globalAlpha = 1;
      }
    }
    /* stars, far to near */
    var idx = s.order;
    idx.sort(function (x, y) { return s.n[y].d - s.n[x].d; });
    for (var j = 0; j < idx.length; j++) {
      i = idx[j]; n = s.n[i]; if (!n.on) continue;
      var dim = focus && !rel[i], born = n.born ? clamp((t - n.born) / 520, 0, 1) : 1;
      var sz = (n.kind === 0 ? 64 : n.kind === 1 ? 40 : n.key ? 31 : 25) * (n.k / s.k0) * (dim ? .82 : 1) * (i === s.sel ? 1.4 : i === s.hov ? 1.2 : 1) * (.4 + .6 * born);
      n.ss = sz;
      c.globalAlpha = s.fade(n) * (dim ? .38 : 1) * born;
      c.drawImage(sprite(n.color), n.sx - sz / 2, n.sy - sz / 2, sz, sz);
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    /* birth flashes and the selection ring */
    for (i = 0; i < s.n.length; i++) {
      n = s.n[i]; if (!n.on) continue;
      if (n.born && t - n.born < 900 && anim) {
        var q2 = (t - n.born) / 900;
        c.strokeStyle = 'rgba(' + n.rgb + ',' + (.8 * (1 - q2)).toFixed(3) + ')'; c.lineWidth = 1.2;
        c.beginPath(); c.arc(n.sx, n.sy, 3 + q2 * 20, 0, TAU); c.stroke();
      }
    }
    if (s.sel >= 0) {
      n = s.n[s.sel];
      c.strokeStyle = 'rgba(' + n.rgb + ',.95)'; c.lineWidth = 1.6;
      c.beginPath(); c.arc(n.sx, n.sy, M.max(9, n.ss * .34) + (anim ? 1.5 * M.sin(secs * 3) : 0), 0, TAU); c.stroke();
    }
    s.labels(rel, focus);
    if (!s.box.dataset.ready) { s.box.dataset.ready = M.round(now()); s.box.classList.add('live'); }
  };
  /* labels: pillar names at the spoke tips, the selected star and its neighbours, the star under the pointer */
  P.labels = function (rel, focus) {
    var s = this, c = s.c, boxes = [], w = s.w, h = s.h, o = s.o;
    function free(x, y, tw, th) {
      for (var i = 0; i < boxes.length; i++) { var b = boxes[i]; if (x < b[0] + b[2] && x + tw > b[0] && y < b[1] + b[3] && y + th > b[1]) return false; }
      boxes.push([x, y, tw, th]); return true;
    }
    function put(txt, x, y, col, al, font, side, must) {
      c.font = font;
      var tw = c.measureText(txt).width, th = parseInt(font.replace(/^\D*\d+\s+/, ''), 10) || 12;
      var lx = side < 0 ? x - tw : x;
      if (lx < 6) lx = 6; if (lx + tw > w - 6) lx = w - 6 - tw;
      var ly = clamp(y, th, h - th);
      if (!free(lx - 3, ly - th * .7, tw + 6, th * 1.4) && !must) return;
      c.globalAlpha = al; c.fillStyle = col; c.fillText(txt, lx, ly);
    }
    c.textBaseline = 'middle'; c.shadowColor = 'rgba(8,5,26,.95)'; c.shadowBlur = 7;
    var F1 = '600 13px Inter, system-ui, sans-serif', F2 = '500 12px Inter, system-ui, sans-serif', F3 = '600 10.5px "JetBrains Mono", ui-monospace, monospace';
    if (s.sel >= 0) {
      var n = s.n[s.sel], sd = n.sx > s.ox + 40 ? 1 : n.sx < s.ox - 40 ? -1 : 1;
      put(n.name, n.sx + sd * (n.ss * .32 + 8), n.sy, '#ffffff', 1, F1, sd, true);
    }
    if (s.hov >= 0 && s.hov !== s.sel) {
      var hv = s.n[s.hov], hs = hv.sx > s.ox ? 1 : -1;
      put(hv.name, hv.sx + hs * (hv.ss * .32 + 7), hv.sy, '#ffffff', 1, F1, hs, true);
    }
    if (s.hl && s.sel < 0) s.tags();
    for (var i = 0; i < s.n.length; i++) {
      var m = s.n[i]; if (!m.on || i === s.sel || i === s.hov) continue;
      var show = focus ? rel[i] : (o.labels === 'all' || (o.labels === 'root' && m.kind === 0));
      if (s.hl && s.sel < 0 && s.hlOn < 0 && w < 560) show = false; /* narrow: letters only until one link is picked */
      if (!show) continue;
      var sd2 = m.sx >= s.ox ? 1 : -1;
      put(m.name, m.sx + sd2 * (m.ss * .26 + 6), m.sy, focus ? 'rgba(' + m.rgb + ',1)' : '#ece8ff', focus ? .95 : M.max(.55, s.fade(m)), F2, sd2, false);
    }
    if (s.tips && o.labels !== 'none') {
      c.letterSpacing = '1.5px';
      for (var k = 0; k < s.tips.length; k++) {
        var tp = s.tips[k], dimT = focus && !rel[tp.g];
        put(tp.label, tp.sx + (tp.sx >= s.ox ? 4 : -4), tp.sy, tp.color, (dimT ? .28 : .9) * s.fade(tp), F3, tp.sx >= s.ox ? 1 : -1, false);
      }
      c.letterSpacing = '0px';
    }
    c.shadowBlur = 0; c.globalAlpha = 1;
  };
  /* letters on the highlighted links (Flat against deep) */
  P.tags = function () {
    var s = this, c = s.c;
    for (var i = 0; i < s.hl.length; i++) {
      var hl = s.hl[i], A = s.n[hl.s], B = s.n[hl.t], l = hl.link; if (!l || !l.cp.sx) continue;
      var x = .25 * A.sx + .5 * l.cp.sx + .25 * B.sx, y = .25 * A.sy + .5 * l.cp.sy + .25 * B.sy, on = s.hlOn < 0 || s.hlOn === i;
      c.shadowBlur = 0; c.globalAlpha = on ? 1 : .45;
      c.fillStyle = '#0e0924'; c.strokeStyle = on ? '#4be3c1' : 'rgba(75,227,193,.6)'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(x, y, 11, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#4be3c1'; c.font = '700 12px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.fillText(hl.tag, x, y + .5); c.textAlign = 'start';
      c.shadowBlur = 7;
    }
  };
  P.pick = function (x, y) {
    var s = this, best = -1, bd = 1e9;
    for (var i = 0; i < s.n.length; i++) {
      var n = s.n[i]; if (!n.on || n.sx == null) continue;
      var dx = n.sx - x, dy = n.sy - y, dd = M.sqrt(dx * dx + dy * dy), lim = M.max(coarse ? 22 : 15, (n.ss || 16) * .38);
      if (dd < lim && dd + n.d * .01 < bd) { bd = dd + n.d * .01; best = i; }
    }
    return best;
  };
  P.select = function (i) {
    var s = this;
    s.sel = i; s.focusSet();
    s.box.classList.toggle('has-sel', i >= 0);
    if (i >= 0) s.box.classList.add('used');
    fillCard(s, i);
    s.user(); s.kick();
    if (s.o.onSelect) s.o.onSelect(i);
  };
  P.light = function (k) { this.hlOn = k; this.focusSet(); this.kick(); };
  P.user = function () { this.idle = now(); };
  P.kick = function () { var s = this; if (!s.raf && s.vis && !d.hidden) s.raf = requestAnimationFrame(s.tickB); };
  P.tick = function (t) {
    var s = this; s.raf = 0;
    var dt = s.last ? M.min(64, t - s.last) : 16, go = false; s.last = t;
    if (!s.down) {
      if (s.vel) { s.yaw += s.vel * dt; s.vel *= M.pow(.94, dt / 16); if (M.abs(s.vel) < 1.5e-6) s.vel = 0; go = true; }
      if (!STILL && t - s.idle > 1800) {
        var k = s.sel >= 0 ? .22 : 1;
        if (s.o.mode === 'spin') s.yaw += (s.o.speed || .00009) * dt * k;
        else if (s.o.mode === 'sway') { s.ph += dt * .00026 * k; s.yaw += (s.o.amp || .45) * .00026 * M.cos(s.ph) * dt * k; }
      }
    }
    s.draw(t);
    if (!STILL) go = true;
    if (go && s.vis && !d.hidden) s.raf = requestAnimationFrame(s.tickB);
    else s.last = 0;
  };
  P.bind = function () {
    var s = this, cv = s.cv;
    function pos(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    cv.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      s.down = { x: e.clientX, y: e.clientY, yaw: s.yaw, pitch: s.pitch, lx: e.clientX, lt: now(), moved: false, id: e.pointerId, touch: e.pointerType !== 'mouse' };
      s.vel = 0; s.user();
    });
    cv.addEventListener('pointermove', function (e) {
      var dn = s.down;
      if (dn && dn.id === e.pointerId) {
        var dx = e.clientX - dn.x, dy = e.clientY - dn.y;
        if (!dn.moved && M.abs(dx) + M.abs(dy) > 6) { dn.moved = true; try { cv.setPointerCapture(e.pointerId); } catch (er) { } s.box.classList.add('grab', 'used'); }
        if (dn.moved) {
          s.yaw = dn.yaw + dx * .0085;
          if (!dn.touch) s.pitch = clamp(dn.pitch + dy * .006, -.2, 1.2);
          var tn = now(), dt = tn - dn.lt;
          if (dt > 0 && !STILL) s.vel = .75 * s.vel + .25 * ((e.clientX - dn.lx) * .0085 / dt);
          dn.lx = e.clientX; dn.lt = tn; s.user(); s.kick();
        }
      } else if (e.pointerType === 'mouse') {
        var p = pos(e), i = s.pick(p[0], p[1]);
        if (i !== s.hov) { s.hov = i; cv.style.cursor = i >= 0 ? 'pointer' : ''; s.kick(); }
      }
    });
    function end(e) {
      var dn = s.down; if (!dn || dn.id !== e.pointerId) return;
      s.down = null; s.box.classList.remove('grab');
      if (!dn.moved && e.type === 'pointerup') { var p = pos(e), i = s.pick(p[0], p[1]); if (i >= 0 || s.sel >= 0) s.select(i); }
      else if (now() - dn.lt > 90) s.vel = 0;
      s.user(); s.kick();
    }
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('pointerleave', function () { if (s.hov >= 0) { s.hov = -1; cv.style.cursor = ''; s.kick(); } });
    cv.addEventListener('keydown', function (e) {
      var k = e.key, n = s.n.length; if (!n) return;
      if (k === 'ArrowRight' || k === 'ArrowLeft') {
        e.preventDefault();
        var i = s.sel < 0 ? (k === 'ArrowRight' ? 0 : n - 1) : (s.sel + (k === 'ArrowRight' ? 1 : n - 1)) % n;
        s.select(i);
      } else if (k === 'Escape' && s.sel >= 0) { s.select(-1); }
    });
  };

  /* ---- the card for a selected star: its name, what it needs and what it unlocks ---- */
  function el(tag, cls, txt) { var e = d.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function fillCard(s, i) {
    var cd = s.card;
    if (s.live) s.live.textContent = '';
    if (!cd) return;
    if (i < 0) { cd.hidden = true; cd.textContent = ''; return; }
    var n = s.n[i], nb = s.nb[i];
    cd.textContent = '';
    var x = el('button', 'cst-x'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.textContent = '×';
    x.addEventListener('click', function () { s.select(-1); s.cv.focus(); });
    var k = el('p', 'cst-k', n.kick || ''); k.style.setProperty('--cc', n.color);
    var nm = el('p', 'cst-n', n.name); nm.tabIndex = -1;
    cd.appendChild(x); cd.appendChild(k); cd.appendChild(nm);
    if (n.desc) cd.appendChild(el('p', 'cst-d', n.desc));
    var groups = [['Needs', nb.inD], ['Unlocks', nb.outD], ['Part of', nb.up], [n.kind === 0 ? 'Pillars' : 'Initiatives', nb.down]], any = 0;
    groups.forEach(function (g) {
      if (!g[1].length) return;
      any += g[0] === 'Needs' || g[0] === 'Unlocks' ? g[1].length : 0;
      var row = el('div', 'cst-g'), chips = el('div', 'cst-cs');
      row.appendChild(el('b', null, g[0]));
      g[1].forEach(function (j) {
        var m = s.n[j], b = el('button', 'cst-c', m.name); b.type = 'button'; b.style.setProperty('--cc', m.color);
        b.addEventListener('click', function () { s.select(j); var f = s.card.querySelector('.cst-n'); if (f) f.focus(); });
        chips.appendChild(b);
      });
      row.appendChild(chips); cd.appendChild(row);
    });
    if (n.kind === 2 && !any) cd.appendChild(el('p', 'cst-none', 'No dependencies run to or from this one.'));
    cd.hidden = false;
    if (s.live) s.live.textContent = n.name + '. Needs ' + nb.inD.length + ', unlocks ' + nb.outD.length + '.';
  }

  W.CstSky = { create: function (box, o) { return new Sky(box, o); }, all: ALL, still: STILL, reduce: reduce, ember: ember };

  /* ---- the hero: Ember's plan, turning ---- */
  var hero = d.getElementById('cst-hero');
  if (hero) {
    var wide = W.matchMedia('(min-width: 981px)').matches;
    CstSky.create(hero, { data: ember(), mode: 'spin', speed: .00008, yaw: .5, pitch: .74, fx: wide ? .9 : .88, fy: .92, labels: 'root', stars: 90, seed: 11 });
  }

  /* ---- flat against deep: rows or space, three links the rows hide ---- */
  var fd = d.getElementById('fd');
  if (fd) {
    var data = ember(), at = data.at, THREE = [['p_pack', 'st_site', 'A'], ['o_ship', 'r_first', 'B'], ['o_supply', 'st_retail', 'C']];
    var hl = THREE.map(function (p) {
      var s0 = at[p[0]], t0 = at[p[1]], link = null;
      data.links.forEach(function (l) { if (l.dep && l.s === s0 && l.t === t0) link = l; });
      return { s: s0, t: t0, tag: p[2], link: link };
    });
    var box = d.getElementById('fd-sky'), sky = null;
    var btns = [].slice.call(fd.querySelectorAll('.fd-sw button')), three = [].slice.call(fd.querySelectorAll('.fd-three button'));
    var rows = fd.querySelector('.fd-rows'), space = fd.querySelector('.fd-space');
    function view(v) {
      btns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'); });
      rows.hidden = v !== 'rows'; space.hidden = v !== 'space';
      fd.dataset.view = v;
      if (v === 'space') {
        if (!sky) { sky = CstSky.create(box, { data: data, mode: 'sway', amp: .14, yaw: 2.35, pitch: .62, fx: .8, fy: .84, labels: 'none', hl: hl, stars: 50, seed: 5 }); spread(sky); }
        else sky.size();
      }
    }
    /* turn the plan to the angle where the three lit links and their six stars sit furthest apart */
    function spread(sk) {
      if (!sk.w) return;
      var best = sk.yaw, score = -1, wx = sk.w < 560 ? 4 : 2; /* labels are wide: count sideways distance for less */
      for (var a = 0; a < 48; a++) {
        sk.yaw = a / 48 * TAU; sk.proj();
        var pts = [], m = 1e9, i, j;
        hl.forEach(function (h) {
          var A = sk.n[h.s], B = sk.n[h.t], l = h.link;
          pts.push([.25 * A.sx + .5 * l.cp.sx + .25 * B.sx, .25 * A.sy + .5 * l.cp.sy + .25 * B.sy], [A.sx, A.sy], [B.sx, B.sy]);
        });
        for (i = 0; i < pts.length; i++) for (j = i + 1; j < pts.length; j++) m = M.min(m, M.sqrt(M.pow((pts[i][0] - pts[j][0]) / wx, 2) + M.pow(pts[i][1] - pts[j][1], 2)));
        pts.forEach(function (p) { if (p[0] < 60 || p[0] > sk.w - 60) m *= .8; });
        if (m > score) { score = m; best = sk.yaw; }
      }
      sk.yaw = best;
      /* on a narrow screen, zoom in on the three links themselves; the rest of the plan runs off the edges */
      if (sk.w < 560) {
        sk.o.zoom = 1; sk.o.dx = sk.o.dy = 0; sk.size(); sk.proj();
        var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        hl.forEach(function (h) { [sk.n[h.s], sk.n[h.t]].forEach(function (q) { x0 = M.min(x0, q.sx); x1 = M.max(x1, q.sx); y0 = M.min(y0, q.sy); y1 = M.max(y1, q.sy); }); });
        var z = clamp(M.min(sk.w * .72 / (x1 - x0 || 1), sk.h * .62 / (y1 - y0 || 1)), 1, 1.9), cx0 = (x0 + x1) / 2, cy0 = (y0 + y1) / 2;
        sk.o.zoom = z; sk.o.dx = sk.w / 2 - (sk.ox + (cx0 - sk.ox) * z); sk.o.dy = sk.h / 2 - (sk.oy + (cy0 - sk.oy) * z);
        sk.size();
      }
      sk.kick();
    }
    function light(k) {
      three.forEach(function (b, j) { b.setAttribute('aria-pressed', j === k ? 'true' : 'false'); });
      [].forEach.call(fd.querySelectorAll('.fd-sheet tr'), function (tr) { tr.classList.toggle('on', k >= 0 && tr.dataset.k === String(k)); });
      if (sky) { if (sky.sel >= 0) sky.select(-1); sky.light(k); }
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { view(b.dataset.v); }); });
    three.forEach(function (b, j) {
      b.addEventListener('click', function () { light(b.getAttribute('aria-pressed') === 'true' ? -1 : j); });
    });
    view('space');
  }
})();
