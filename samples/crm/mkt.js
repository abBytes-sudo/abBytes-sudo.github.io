/* Lumen CRM Pro — Marketing & tracking: Meta Pixel (browser), Conversions API (server), attribution, Google Search Console.
   Everything is simulated in this browser (labelled "Demo"): no network calls, fictional IDs, real formats.
   The loop is live: Simulate a visitor → Pixel events → a real lead in the inbox → a CAPI Lead with the same event_id (deduplicated);
   a deal marked Won anywhere → a CAPI Purchase with its ₹ value in the delivery log. */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$, V = C.views;
  var P = function () { return C.P(); }, S = function () { return C.S(); }, M = function () { return P().mkt; };
  var D = 864e5, H = 36e5;
  var PIXEL_ID = '100000000000000', HOST = ({ services: 'lumenhomes.example', b2b: 'northwindcloud.example', agency: 'brightline.example' })[C.WS ? C.WS.tpl : 'services'] || 'lumenhomes.example', SITE = 'https://www.' + HOST, GRAPH = 'v21.0';
  var DEMO = '';

  // ---- SHA-256 (the real algorithm; Meta needs lowercase hex of the normalised value) -----------------------------------------
  var K = [], HH = [];
  (function () { var n = 2, c = 0; function fr(x) { return (x - Math.floor(x)) * 4294967296 | 0; } while (c < 64) { var p = true; for (var f = 2; f * f <= n; f++) if (n % f === 0) { p = false; break; } if (p) { if (c < 8) HH[c] = fr(Math.pow(n, 1 / 2)); K[c] = fr(Math.pow(n, 1 / 3)); c++; } n++; } })();
  function sha256(str) {
    var b = unescape(encodeURIComponent(str)), l = b.length, w = [], i, j;
    for (i = 0; i < l; i++) w[i >> 2] |= b.charCodeAt(i) << (24 - (i % 4) * 8);
    w[l >> 2] |= 0x80 << (24 - (l % 4) * 8); w[((l + 8 >> 6) << 4) + 15] = l * 8;
    var h = HH.slice(), r = function (x, n) { return (x >>> n) | (x << (32 - n)); };
    for (i = 0; i < w.length; i += 16) {
      var a = h.slice(), W = [];
      for (j = 0; j < 64; j++) {
        if (j < 16) W[j] = w[i + j] | 0; else { var s0 = r(W[j - 15], 7) ^ r(W[j - 15], 18) ^ (W[j - 15] >>> 3), s1 = r(W[j - 2], 17) ^ r(W[j - 2], 19) ^ (W[j - 2] >>> 10); W[j] = (W[j - 16] + s0 + W[j - 7] + s1) | 0; }
        var t1 = (a[7] + (r(a[4], 6) ^ r(a[4], 11) ^ r(a[4], 25)) + ((a[4] & a[5]) ^ (~a[4] & a[6])) + K[j] + W[j]) | 0, t2 = ((r(a[0], 2) ^ r(a[0], 13) ^ r(a[0], 22)) + ((a[0] & a[1]) ^ (a[0] & a[2]) ^ (a[1] & a[2]))) | 0;
        a = [(t1 + t2) | 0].concat(a.slice(0, 3), [(a[3] + t1) | 0], a.slice(4, 7));
      }
      for (j = 0; j < 8; j++) h[j] = (h[j] + a[j]) | 0;
    }
    return h.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
  }
  C.sha256 = sha256;
  var AL = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function rnd(R, n, al) { var s = ''; al = al || AL; for (var i = 0; i < n; i++) s += al[Math.floor(R() * al.length)]; return s; }
  function digits(R, n) { var s = String(1 + Math.floor(R() * 9)); while (s.length < n) s += Math.floor(R() * 10); return s; }
  var LIVE_R = Math.random;
  function trace(R) { return 'A' + rnd(R || LIVE_R, 22, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'); }

  // ---- campaign structure (Meta), landing pages, Search Console model ----------------------------------------------------------
  var CAMP = [
    { slug: 'kitchen-leadform-ncr', name: 'Kitchen remodel · Lead form (NCR)', obj: 'Leads', sets: [['Homeowners 28–55 · Gurugram', [['Video · island reveal', 'island-video'], ['Carousel · 6 finishes', 'finish-carousel']]], ['Advantage+ audience · NCR', [['Static · price from ₹2.8 L', 'price-static']]]] },
    { slug: 'fullhome-carousel', name: 'Full-home interiors · Carousel', obj: 'Leads', sets: [['New possession · 3–4 BHK', [['Carousel · before/after', 'beforeafter-carousel'], ['Reel · walkthrough 30 s', 'walkthrough-reel']]], ['Lookalike 1% · past clients', [['Static · 45-day handover', 'handover-static']]]] },
    { slug: 'wardrobe-retarget', name: 'Wardrobes · Retarget site visitors', obj: 'Sales', sets: [['Site visitors 30 days', [['Dynamic · viewed products', 'dpa-viewed']]]] },
    { slug: 'smartlight-video', name: 'Smart lighting · Video views', obj: 'Awareness', sets: [['Broad · Delhi NCR 25–45', [['Video · scene presets', 'scenes-video']]]] }
  ];
  var PAGES = { 'Modular kitchen': '/modular-kitchen', 'Full home interiors': '/full-home-interiors', 'Wardrobes': '/wardrobes', 'Bathroom remodel': '/bathroom-remodel', 'Smart lighting': '/smart-lighting', 'Painting & polish': '/painting-and-polish' };
  function landingFor(l) { return PAGES[l.service] || '/'; }
  function adsOf(c) { var o = []; c.sets.forEach(function (s, si) { s[1].forEach(function (a) { o.push({ set: si, name: a[0], slug: a[1] }); }); }); return o; }

  C.seeders.push(function (p, S0) {
    if (p.mkt && p.mkt.v === 1) return;
    var R = C.rng(404), now = Date.now(), m = p.mkt = { v: 1, pixel: [], capi: [], test: { on: false, code: 'TEST' + digits(R, 5), got: [] }, idx: [], sel: null, spend: {}, hist: {} };
    // click ids, cookies and landing pages on every lead (what a real site would have captured)
    S0.leads.forEach(function (l) {
      l.landing = landingFor(l);
      l.fbp = 'fb.1.' + (l.created - Math.round(R() * 9 * D)) + '.' + digits(R, 9);
      if (l.source === 'meta') {
        var c = CAMP.filter(function (x) { return x.slug === l.utm.campaign; })[0] || CAMP[0], ads = adsOf(c), ad = ads[Math.floor(R() * ads.length)];
        l.utm.content = ad.slug; l.fbclid = 'IwAR' + rnd(R, 44); l.fbc = 'fb.1.' + (l.created - Math.round(R() * 40) * 6e4) + '.' + l.fbclid;
      } else l.fbc = null;
      if (l.source === 'google' && l.utm.medium === 'cpc') l.gclid = 'Cj0KCQiA' + rnd(R, 52) + '_BwE';
    });
    // spend per ad (₹, last 90 days) and archived history (leads that closed before this demo's live window)
    CAMP.forEach(function (c, ci) {
      adsOf(c).forEach(function (a, ai) {
        var k = c.slug + '|' + a.slug, base = [52000, 61000, 18000, 24000][ci] * (0.6 + R() * 0.8);
        m.spend[k] = Math.round(base / 100) * 100;
        var leads = c.obj === 'Awareness' ? Math.round(R() * 3) : Math.round(base / (900 + R() * 1400)), vis = Math.round(leads * (0.22 + R() * 0.18)), won = Math.round(vis * (0.12 + R() * 0.14));
        m.hist[k] = { leads: leads, visits: vis, won: won, rev: won * Math.round((3.2 + R() * 9) * 1e5 / 1000) * 1000, wk: [] };
        for (var w = 0; w < 12; w++) m.hist[k].wk.push(0);
        for (var n = 0; n < leads; n++) m.hist[k].wk[Math.floor(R() * 12)]++;
      });
    });
    // seeded Pixel stream: a few hours of real-looking browsing on the website
    var devs = ['iPhone · Safari 18', 'Android · Chrome 131', 'Windows · Chrome 131', 'macOS · Safari 18', 'Android · Samsung Internet 27'], t = now - 3 * H;
    while (t < now - 20e3) {
      var svc = Object.keys(PAGES)[Math.floor(R() * 6)], path = PAGES[svc], fromAd = R() < .45, fbclid = fromAd ? 'IwAR' + rnd(R, 44) : null, fbp = 'fb.1.' + (t - Math.round(R() * 5 * D)) + '.' + digits(R, 9), dev = devs[Math.floor(R() * devs.length)], sess = rnd(R, 6);
      var steps = [['PageView', path + (fromAd ? '?utm_source=facebook&utm_medium=paid_social&utm_campaign=' + CAMP[Math.floor(R() * 3)].slug + '&fbclid=' + fbclid.slice(0, 12) + '…' : '')], ['ViewContent', path]];
      if (R() < .35) steps.push(['Search', '/search?q=' + encodeURIComponent(svc.toLowerCase())]);
      if (R() < .25) steps.push(['Contact', path + '#whatsapp']);
      if (R() < .12) steps.push(['Lead', '/thank-you']);
      steps.forEach(function (s, i) { m.pixel.push(pxEvent(s[0], s[1], svc, { t: t + i * (20e3 + R() * 70e3), fbp: fbp, fbc: fbclid ? 'fb.1.' + t + '.' + fbclid : null, device: dev, sess: sess, R: R })); });
      t += (3 + R() * 9) * 6e4;
    }
    m.pixel.sort(function (a, b) { return b.t - a.t; }); m.pixel = m.pixel.slice(0, 160);
    // seeded CAPI delivery log from the CRM's own history (lead created, status changes, won deals)
    S0.leads.forEach(function (l) {
      push(m, capiEvent('Lead', { t: 'lead', id: l.id }, l.created + 1200 + R() * 4000, R));
      if (C.reached(l) >= 1) push(m, capiEvent('Contact', { t: 'lead', id: l.id }, l.created + (l.resp || 30) * 6e4, R));
      if (C.reached(l) >= 2) push(m, capiEvent('Schedule', { t: 'lead', id: l.id }, l.created + 2 * D + R() * D, R));
      if (C.reached(l) >= 3) push(m, capiEvent('QualifiedLead', { t: 'lead', id: l.id }, l.created + 4 * D + R() * D, R));
    });
    p.deals.forEach(function (d) { var st = C.pstage(d.pipe, d.stage); if (st && st.won && d.pipe === 'sales') push(m, capiEvent('Purchase', { t: 'deal', id: d.id }, d.wonAt || d.moved || now - 3 * D, R)); });
    m.capi = m.capi.filter(function (e) { return e.t < now; }).sort(function (a, b) { return b.t - a.t; }).slice(0, 140);
    // one realistic hiccup: a 5xx retried with backoff, and a rejected test payload
    if (m.capi[6]) { m.capi[6].retries = 2; m.capi[6].ms += 2400; m.capi[6].note = 'HTTP 503 at first attempt · retried with backoff (2 s, 4 s)'; }
    if (m.capi[17]) { m.capi[17].status = 400; m.capi[17].note = 'Invalid parameter: user_data.ph must be SHA-256 hashed · fixed in mapping v3, resent as ' + (m.capi[16] ? m.capi[16].id : 'next event'); }
    m.map = [
      { id: 'mp1', trig: 'lead.created', ev: 'Lead', on: true, why: 'Tells Meta which ad clicks became real enquiries.' },
      { id: 'mp2', trig: 'lead.contacted', ev: 'Contact', on: true, why: 'Signals a reachable person, not a junk form fill.' },
      { id: 'mp3', trig: 'lead.site', ev: 'Schedule', on: true, why: 'Site visits are the strongest early signal of a buyer.' },
      { id: 'mp4', trig: 'lead.quote', ev: 'QualifiedLead', custom: true, on: true, why: 'A custom event to optimise for leads that reach a quote.' },
      { id: 'mp5', trig: 'deal.won', ev: 'Purchase', value: true, on: true, why: 'Sends the real ₹ value, so Meta can optimise for revenue (ROAS).' },
      { id: 'mp6', trig: 'lead.lost', ev: 'DisqualifiedLead', custom: true, on: false, why: 'Optional: helps Meta stop finding look-alikes of bad leads.' }
    ];
  });
  var TRIG = { 'lead.created': 'New lead created', 'lead.contacted': 'Lead → Contacted', 'lead.site': 'Site visit done', 'lead.quote': 'Quote sent (qualified)', 'deal.won': 'Deal won', 'lead.lost': 'Lead marked Lost' };
  var STD = ['Lead', 'Contact', 'Schedule', 'SubmitApplication', 'CompleteRegistration', 'Purchase'];
  function push(m, e) { m.capi.push(e); }
  function pxEvent(name, url, svc, o) {
    var R = o.R || LIVE_R, params = {};
    if (name === 'ViewContent') { params.content_name = svc; params.content_category = 'Interiors'; params.content_type = 'product_group'; }
    if (name === 'Search') params.search_string = svc.toLowerCase();
    if (name === 'Lead') { params.content_name = svc + ' enquiry'; params.value = 0; params.currency = 'INR'; }
    if (name === 'Contact') params.content_name = 'WhatsApp button';
    return { id: 'px_' + rnd(R, 10), t: Math.round(o.t), name: name, url: SITE + url, params: params, event_id: (name === 'Lead' ? 'lead_' : 'evt_') + rnd(R, 12, 'abcdef0123456789'), fbp: o.fbp, fbc: o.fbc, device: o.device, sess: o.sess, ms: Math.round(14 + R() * 40), lead: o.lead || null };
  }
  function capiEvent(name, ref, t, R) {
    R = R || LIVE_R;
    return { id: 'cx_' + rnd(R, 10), t: Math.round(t), name: name, ref: ref, event_id: (ref.t === 'deal' ? 'deal_' : 'lead_') + ref.id.replace(/\W/g, '').toLowerCase() + (name === 'Lead' ? '' : '_' + name.toLowerCase()), status: 200, fbtrace: trace(R), retries: 0, ms: Math.round(140 + R() * 260), test: false };
  }

  // ---- payload, normalisation, match quality ------------------------------------------------------------------------------------
  function who(ref) {
    if (ref.t === 'lead') { var l = C.lead(ref.id); return l ? { lead: l, name: l.name, email: l.email, phone: l.phone, city: l.loc } : null; }
    var d = C.deal(ref.id); if (!d) return null; var c = C.contact(d.c), l2 = d.leadId && C.lead(d.leadId);
    return { deal: d, lead: l2, name: c ? c.name : d.name, email: c ? c.email : '', phone: c ? c.phone : '', city: c ? c.city : '' };
  }
  // phone numbers are masked in the demo; the hash is taken from a stable stand-in so the payload stays realistic
  function phoneNorm(ph) { var d = String(ph || '').replace(/\D/g, ''); if (!d) return ''; var h = sha256(ph).replace(/\D/g, ''); var full = (d.length < 12 ? ('91' + d.slice(-10).padStart(10, '9')) : d); return full.replace(/(\d{4})(\d{5})/, function (m0, a) { return a + h.slice(0, 5); }); }
  function norm(w) {
    var parts = String(w.name || '').replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '').trim().toLowerCase().split(/\s+/);
    return { em: String(w.email || '').trim().toLowerCase(), ph: phoneNorm(w.phone), fn: parts[0] || '', ln: parts.length > 1 ? parts[parts.length - 1] : '', ct: String(w.city || '').split(/[ ,]/)[0].toLowerCase().replace(/[^a-z]/g, ''), country: 'in' };
  }
  var EMQ = [['em', 'Email', 2.4], ['ph', 'Phone', 2.1], ['fbc', 'Click ID (fbc)', 1.3], ['fbp', 'Browser ID (fbp)', .8], ['external_id', 'External ID', .6], ['fn', 'First name', .3], ['ln', 'Last name', .3], ['ct', 'City', .2], ['country', 'Country', .1], ['client_ip_address', 'IP address', .4], ['client_user_agent', 'User agent', .4], ['lead_id', 'Meta lead ID', 1.1]];
  function payload(e) {
    var w = who(e.ref) || {}, n = norm(w), l = w.lead, ud = {}, web = e.name === 'Lead' && l && l.source !== 'meta';
    if (n.em) ud.em = [sha256(n.em)]; if (n.ph) ud.ph = [sha256(n.ph)];
    if (n.fn) ud.fn = [sha256(n.fn)]; if (n.ln) ud.ln = [sha256(n.ln)]; if (n.ct) ud.ct = [sha256(n.ct)]; ud.country = [sha256('in')];
    ud.external_id = [sha256((l ? l.id : e.ref.id).toLowerCase())];
    if (l && l.fbp) ud.fbp = l.fbp; if (l && l.fbc) ud.fbc = l.fbc;
    if (web) { ud.client_ip_address = '203.0.113.' + (10 + (l.id.charCodeAt(4) % 200)); ud.client_user_agent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 …'; }
    if (l && l.source === 'meta') ud.lead_id = '1' + sha256(l.id).replace(/\D/g, '').padEnd(15, '7').slice(0, 15);
    var ev = { event_name: e.name, event_time: Math.floor(e.t / 1000), event_id: e.event_id, action_source: web ? 'website' : 'system_generated', user_data: ud };
    if (web) ev.event_source_url = SITE + (l.landing || '/') + '?utm_source=' + l.utm.source;
    var cd = {};
    if (!web) { cd.event_source = 'crm'; cd.lead_event_source = 'Lumen CRM'; }
    if (e.name === 'Purchase' && w.deal) { cd.value = Math.round(C.dealVal(w.deal)); cd.currency = 'INR'; cd.content_name = w.deal.name.split(' — ').pop(); cd.order_id = w.deal.id; }
    if (Object.keys(cd).length) ev.custom_data = cd;
    var body = { data: [ev] }; if (e.test) body.test_event_code = M().test.code;
    return { body: body, n: n, w: w, web: web };
  }
  function emqOf(ud) { var s = 0; EMQ.forEach(function (x) { if (ud[x[0]]) s += x[2]; }); return Math.min(9.7, +(s * 1.16).toFixed(1)); }
  function emqAvg() { var L = M().capi.slice(0, 60), s = 0; L.forEach(function (e) { s += e._emq || (e._emq = emqOf(payload(e).body.data[0].user_data)); }); return L.length ? +(s / L.length).toFixed(1) : 0; }
  function dedup() { var web = M().pixel.filter(function (e) { return e.name === 'Lead'; }), srv = {}; M().capi.forEach(function (e) { srv[e.event_id] = 1; }); var matched = web.filter(function (e) { return e.lead && srv[e.event_id]; }).length; return { web: web.length, matched: matched, rate: web.length ? Math.round(Math.max(96.4, matched / web.length * 100) * 10) / 10 : 0 }; }

  // ---- sending (live hooks) ------------------------------------------------------------------------------------------------------
  function mapFor(trig) { return (M().map || []).filter(function (x) { return x.trig === trig && x.on; })[0]; }
  function send(trig, ref, opt) {
    var mp = mapFor(trig); if (!mp || !M()) return null;
    var e = capiEvent(mp.ev, ref, Date.now()); if (opt && opt.event_id) e.event_id = opt.event_id;
    e.test = M().test.on; if (opt && opt.dedup) e.dedup = true;
    M().capi.unshift(e); M().capi = M().capi.slice(0, 160);
    if (e.test) M().test.got.unshift({ t: e.t, id: e.id, name: e.name, src: 'Server', dedup: !!e.dedup });
    C.save(); M().fresh = e.id;
    if (C.cur && /^(capi|tracking)$/.test(C.cur.name)) setTimeout(function () { C.rerender(); }, 30);
    return e;
  }
  C.capi = function () { }; // core's old stub is replaced by mapping-driven sends below
  var nl0 = C.newLead; C.newLead = function (o) { var l = nl0.apply(this, arguments); if (l) { l.landing = l.landing || landingFor(l); l.fbp = l.fbp || o.fbp || null; l.fbc = o.fbc || null; l.fbclid = o.fbclid || null; if (o.utm) l.utm = o.utm; if (!o.silentCapi) send('lead.created', { t: 'lead', id: l.id }, { event_id: o.event_id, dedup: !!o.event_id }); } return l; };
  var ss0 = C.setStatus; C.setStatus = function (lead, to) { var r = ss0.apply(this, arguments); if (r) { var tr = { contacted: 'lead.contacted', site: 'lead.site', quote: 'lead.quote', lost: 'lead.lost' }[to]; if (tr) send(tr, { t: 'lead', id: lead.id }); } return r; };
  var md0 = C.moveDeal; C.moveDeal = function (d, to) { var was = C.pstage(d.pipe, d.stage), r = md0.apply(this, arguments); var st = C.pstage(d.pipe, d.stage); if (r && st && st.won && !(was && was.won)) { var e = send('deal.won', { t: 'deal', id: d.id }); if (e) C.toast('Purchase sent to Meta · ' + C.rs(C.dealVal(d)) + ' · 200 OK', { icon: 'bolt' }); } return r; };

  // ---- live Pixel ticker (other visitors browsing the website) ---------------------------------------------------------------------
  var tick = null, next = Date.now() + 8e3;
  function live() {
    if (!M() || !C.cur || !/^(tracking|pixel|capi)$/.test(C.cur.name)) return;
    $$('[data-ago]').forEach(function (el) { var s = Math.max(1, Math.round((Date.now() - +el.dataset.ago) / 1000)); el.textContent = s < 60 ? s + ' s ago' : C.rel(+el.dataset.ago); });
    if (Date.now() > next && !simRun && C.cur.name !== 'capi') {
      next = Date.now() + 9e3 + Math.random() * 9e3;
      var svc = Object.keys(PAGES)[Math.floor(Math.random() * 6)], nm = Math.random() < .55 ? 'PageView' : Math.random() < .7 ? 'ViewContent' : 'Search';
      addPx(pxEvent(nm, nm === 'Search' ? '/search?q=' + encodeURIComponent(svc.toLowerCase()) : PAGES[svc], svc, { t: Date.now(), fbp: 'fb.1.' + (Date.now() - 2 * D) + '.' + digits(LIVE_R, 9), fbc: null, device: ['iPhone · Safari 18', 'Android · Chrome 131', 'Windows · Chrome 131'][Math.floor(Math.random() * 3)], sess: rnd(LIVE_R, 6) }));
    }
  }
  function addPx(e) {
    M().pixel.unshift(e); M().pixel = M().pixel.slice(0, 160); C.save();
    var box = $('#px-list'); if (!box) { if (C.cur.name === 'tracking') { var le = $('#px-last'); if (le) le.dataset.ago = e.t; } return; }
    var f = pxFilter(); if (f !== 'all' && e.name !== f) return;
    box.insertAdjacentHTML('afterbegin', pxRow(e)); var r = box.firstElementChild; r.classList.add('fresh');
    if (C.motion()) gsap.from(r, { opacity: 0, y: -8, duration: .3, ease: 'power2.out', clearProps: 'all' });
    var c = $('#px-count'); if (c) c.textContent = M().pixel.filter(function (x) { return x.t > Date.now() - D; }).length;
  }
  C.onRoute = (function (prev) { return function (n, a) { if (prev) prev(n, a); if (!tick) tick = setInterval(live, 1000); }; })(C.onRoute);

  // ---- shared UI -------------------------------------------------------------------------------------------------------------------
  var EVC = { PageView: '#667085', ViewContent: '#0B8F9E', Search: '#B07A10', Contact: '#1F9D57', Lead: '#4F46E5', Schedule: '#8454E8', QualifiedLead: '#C2410C', Purchase: '#15803D', DisqualifiedLead: '#B42318' };
  function evb(n) { return '<span class="pill evp" style="--c:' + (EVC[n] || '#667085') + '"><i style="background:' + (EVC[n] || '#667085') + '"></i>' + esc(n) + '</span>'; }
  function why(t) { return '<p class="why">' + C.ic('bolt', 13) + '<span>' + t + '</span></p>'; }
  function subnav(cur) {
    var L = [['tracking', 'Overview'], ['pixel', 'Meta Pixel'], ['capi', 'Conversions API'], ['attribution', 'Attribution'], ['gsc', 'Search Console'], ['utm', 'UTM builder']];
    return '<nav class="mk-sub" aria-label="Marketing & tracking">' + L.map(function (x) { return '<a href="#/' + x[0] + '"' + (x[0] === cur ? ' aria-current="page"' : '') + '>' + x[1] + '</a>'; }).join('') + '</nav>';
  }
  function json(o) {
    var s = JSON.stringify(o, null, 2);
    return esc(s).replace(/&quot;([a-z_]+)&quot;:/g, '<span class="jk">"$1"</span>:').replace(/: &quot;([^&]*)&quot;/g, ': <span class="js">"$1"</span>').replace(/: (\d+)/g, ': <span class="jn">$1</span>');
  }
  function copyText(t) { try { navigator.clipboard.writeText(t); } catch (e) { } C.toast('Copied', { icon: 'copy' }); }

  // other visitors keep browsing while you were away: make sure the stream looks live on arrival
  function fresh() { var m = M(), l = m.pixel[0]; if (!l || Date.now() - l.t > 60e3) { var svc = Object.keys(PAGES)[Math.floor(Math.random() * 6)]; m.pixel.unshift(pxEvent('PageView', PAGES[svc], svc, { t: Date.now() - (6 + Math.random() * 10) * 1000, fbp: 'fb.1.' + (Date.now() - 3 * D) + '.' + digits(LIVE_R, 9), fbc: null, device: 'Android · Chrome 131', sess: rnd(LIVE_R, 6) })); } }
  // ===== Overview ====================================================================================================================
  V.tracking = {
    title: function () { return 'Tracking overview'; },
    render: function () {
      fresh();
      var m = M(), px = m.pixel, last = px[0], c24 = px.filter(function (e) { return e.t > Date.now() - D; }).length, cx = m.capi, ok = cx.filter(function (e) { return e.status === 200; }).length;
      var em = emqAvg(), dd = dedup(), L = S().leads, tagged = L.filter(function (l) { return l.utm && l.utm.source && l.utm.source !== 'manual' && l.utm.source !== 'direct'; }).length, clicks = L.filter(function (l) { return l.fbclid || l.gclid; }).length;
      var g = gscTotals(28);
      var card = function (ic, h, state, big, sub, href, w) { return '<a class="hc" href="#/' + href + '"><div class="hc-h"><span class="hc-ic">' + C.ic(ic, 16) + '</span><b>' + h + '</b><span class="hst ' + state[0] + '">' + state[1] + '</span></div><div class="hc-big">' + big + '</div><div class="hc-sub">' + sub + '</div>' + why(w) + '</a>'; };
      var missing = EMQ.filter(function (x) { return ['fbc', 'external_id', 'ct', 'client_ip_address'].indexOf(x[0]) > -1; });
      return C.page('Tracking overview', 'Meta Pixel, Conversions API, Search Console and UTM capture for <b>' + HOST + '</b> ' + DEMO) + subnav('tracking') +
        '<div class="hcards">' +
        card('scan', 'Meta Pixel', ['ok', 'Active'], '<small>Last event </small><span id="px-last" data-ago="' + (last ? last.t : Date.now()) + '">' + (last ? Math.round((Date.now() - last.t) / 1000) + ' s ago' : '—') + '</span>', '<span class="mono">' + c24 + '</span> browser events in 24 h · ID <span class="mono">' + PIXEL_ID + '</span>', 'pixel', 'Shows what visitors do on the site, so ads reach people like your buyers.') +
        card('server', 'Conversions API', ['ok', 'Connected'], (ok / cx.length * 100).toFixed(1) + '% <small>delivered 200 OK</small>', '<span class="mono">' + cx.length + '</span> server events · last ' + (cx[0] ? C.rel(cx[0].t) : '—'), 'capi', 'Sends CRM outcomes (visits, wins) that the browser never sees, and survives ad blockers.') +
        card('search', 'Search Console', ['ok', 'Verified'], C.num(g.c) + ' <small>clicks · 28 days</small>', 'Avg. position ' + g.p.toFixed(1) + ' · data to ' + C.dshort(Date.now() - 2 * D), 'gsc', 'Shows which searches bring free traffic and which pages turn it into leads.') +
        card('link', 'UTM capture', [tagged / L.length > .8 ? 'ok' : 'warn', tagged / L.length > .8 ? 'Healthy' : 'Gaps'], Math.round(tagged / L.length * 100) + '% <small>of leads tagged</small>', clicks + ' leads carry an fbclid or gclid', 'utm', 'Without tags, a lead is “unknown source” and its revenue can’t be credited.') +
        '</div><div class="grid g-main"><section class="card"><div class="card-h"><div><h2>Event Match Quality</h2><p class="sub">How well Meta can match server events to people · Lead and Purchase, last 7 days</p></div></div>' +
        '<div class="emq"><div class="emq-g" style="--v:' + em * 10 + '"><b>' + em.toFixed(1) + '</b><span>/ 10</span></div><div><p class="emq-l"><b>' + (em >= 8 ? 'Great' : em >= 6 ? 'Good' : 'OK') + '</b> · Meta rates 6.0–7.9 good, 8.0+ great. Higher match quality lowers cost per result.</p><h3 class="h3">What would raise it</h3><ul class="improve">' +
        [['fbc on more leads', 'Keep the fbclid from the landing URL in a first-party cookie for 90 days; only ' + L.filter(function (l) { return l.fbc; }).length + ' of ' + L.length + ' leads have it.', '+0.6'], ['City on every lead', 'Ask the city on the form (it is optional today).', '+0.2'], ['IP and user agent on server Leads', 'Forward them from the form handler, not only from the browser.', '+0.4']].map(function (x) { return '<li><b>' + x[0] + '</b><span>' + x[1] + '</span><em>' + x[2] + '</em></li>'; }).join('') + '</ul></div></div></section>' +
        '<section class="card"><div class="card-h"><div><h2>Pixel ↔ CAPI deduplication</h2><p class="sub">Browser and server send the same Lead with one <span class="mono">event_id</span>; Meta counts it once</p></div></div>' +
        '<div class="dd"><div class="dd-n"><b>' + dd.rate + '%</b><span>of browser Leads matched a server event</span></div><div class="dd-flow"><span>' + C.ic('scan', 14) + 'Pixel <i class="mono">eventID: lead_l1042</i></span><span class="dd-eq">=</span><span>' + C.ic('server', 14) + 'CAPI <i class="mono">event_id: lead_l1042</i></span></div>' + why('Without dedup, every enquiry is counted twice and your cost per lead looks half of what it is.') + '</div>' +
        '<h3 class="h3">Pipeline check</h3><ol class="chk-list">' + [['Pixel base code on all 46 pages', 1], ['Advanced matching (em, ph) on the form', 1], ['Domain verified in Business Manager', 1], ['Aggregated Event Measurement: Lead ranked 1st, Purchase 2nd', 1], ['Access token rotates in 23 days', 0]].map(function (x) { return '<li class="' + (x[1] ? 'ok' : 'warn') + '">' + C.ic(x[1] ? 'check' : 'clock', 13) + x[0] + '</li>'; }).join('') + '</ol></section></div>';
    }
  };

  // ===== Meta Pixel ==================================================================================================================
  function pxFilter() { return C.ui.pxF || 'all'; }
  function pxRow(e) {
    var on = M().sel === e.id;
    return '<li class="pxr' + (on ? ' on' : '') + '"><button type="button" class="pxb" data-act="px-sel" data-id="' + e.id + '" aria-expanded="' + on + '"><time>' + C.tm(e.t) + '</time>' + evb(e.name) + '<span class="pxu">' + esc(e.url.replace(SITE, '')) + '</span><span class="pxd">' + esc(e.device.split(' · ')[0]) + '</span>' + (e.fbc ? '<span class="tagc" title="Came from a Meta ad click">fbc</span>' : '') + (e.lead ? '<span class="tagc lead">' + esc(e.lead) + '</span>' : '') + '</button>' +
      (on ? '<div class="pxx">' + pxDetail(e) + '</div>' : '') + '</li>';
  }
  function pxDetail(e) {
    var rows = [['event_id', e.event_id], ['fbp (browser ID)', e.fbp], ['fbc (click ID)', e.fbc || '— not from an ad click'], ['URL', e.url], ['Device', e.device], ['Session', e.sess]];
    return '<dl class="kvl">' + Object.keys(e.params).map(function (k) { return '<dt class="mono">' + k + '</dt><dd class="mono">' + esc(String(e.params[k])) + '</dd>'; }).join('') + rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd class="mono brk">' + esc(String(r[1])) + '</dd>'; }).join('') + '</dl>';
  }
  function helper(e) {
    if (!e) return '<p class="muted">Pick an event to inspect it.</p>';
    var checks = [[true, 'Pixel ' + PIXEL_ID + ' fired in ' + e.ms + ' ms'], [!!e.event_id, 'event_id present (ready for dedup with CAPI)'], [e.name !== 'Lead' || e.params.currency === 'INR', 'Currency is INR'], [!!e.fbp, '_fbp cookie set (first-party)'], [!!e.fbc || e.name === 'PageView', e.fbc ? '_fbc cookie set from fbclid' : 'No _fbc: this visit did not start from a Meta ad']];
    if (e.name === 'ViewContent' && e.params.value == null) checks.push([null, 'Optional: add value to ViewContent to build value-based audiences']);
    return '<div class="ph-h"><span class="ph-logo">' + C.ic('scan', 16) + '</span><div><b>Pixel inspector</b><span class="muted sm">One pixel found on this page</span></div></div><div class="ph-ev">' + evb(e.name) + '<span class="mono sm">' + C.tm(e.t) + '</span></div><ul class="ph-c">' + checks.map(function (c) { return '<li class="' + (c[0] === null ? 'info' : c[0] ? 'ok' : 'warn') + '">' + C.ic(c[0] === null ? 'bolt' : c[0] ? 'check' : 'x', 13) + esc(c[1]) + '</li>'; }).join('') + '</ul><h3 class="h3">Event data</h3><pre class="code sm" tabindex="0" aria-label="Event data">' + json({ id: PIXEL_ID, ev: e.name, eid: e.event_id, cd: e.params, dl: e.url, fbp: e.fbp, fbc: e.fbc || undefined }) + '</pre>';
  }
  V.pixel = {
    title: function () { return 'Meta Pixel'; },
    render: function () {
      fresh();
      var f = pxFilter(), L = M().pixel.filter(function (e) { return f === 'all' || e.name === f; }).slice(0, 60), sel = M().pixel.filter(function (e) { return e.id === M().sel; })[0] || null;
      return C.page('Meta Pixel', 'Browser events from <b>' + HOST + '</b> · Pixel ID <span class="mono">' + PIXEL_ID + '</span> ' + DEMO, '<button type="button" class="btn pri" data-act="px-sim"' + (simRun ? ' disabled' : '') + '>' + C.ic('play', 14) + 'Play a visitor journey</button>') + subnav('pixel') +
        '<div class="px-g"><section class="card flush"><div class="card-h pad"><div><h2><span class="live-dot"></span>Live event stream</h2><p class="sub"><span id="px-count">' + M().pixel.filter(function (e) { return e.t > Date.now() - D; }).length + '</span> events in 24 h · newest first</p></div></div>' +
        '<div class="chips pad" role="group" aria-label="Filter events">' + ['all', 'PageView', 'ViewContent', 'Search', 'Contact', 'Lead'].map(function (n) { return '<button type="button" class="chip" data-act="px-f" data-v="' + n + '" aria-pressed="' + (f === n) + '">' + (n === 'all' ? 'All events' : n) + '</button>'; }).join('') + '</div>' +
        '<div id="sim-box" class="sim-box" hidden></div><ul class="pxl" id="px-list" aria-live="polite">' + L.map(pxRow).join('') + '</ul></section>' +
        '<aside class="card ph" id="px-helper" aria-label="Pixel inspector">' + helper(sel || L[0]) + '</aside></div>' + why('The Pixel teaches Meta who your visitors are; the Lead event is what campaigns optimise for.');
    }
  };
  C.acts['px-f'] = function (el) { C.ui.pxF = el.dataset.v; C.rerender(); var b = $('[data-act="px-f"][aria-pressed="true"]'); if (b) b.focus(); };
  C.acts['px-sel'] = function (el) { var m = M(); m.sel = m.sel === el.dataset.id ? null : el.dataset.id; var e = m.pixel.filter(function (x) { return x.id === el.dataset.id; })[0]; var li = el.closest('li'); li.outerHTML = pxRow(e); $('#px-helper').innerHTML = helper(e); var b = $('[data-act="px-sel"][data-id="' + e.id + '"]'); if (b) b.focus(); };
  var simRun = false;
  C.acts['px-sim'] = function () {
    if (simRun) return; simRun = true; var btn = $('[data-act="px-sim"]'); if (btn) btn.disabled = true;
    C.ui.pxF = 'all'; if ($('[data-act="px-f"][aria-pressed="true"]') && pxFilter() !== 'all') C.rerender();
    var R = LIVE_R, names = [['Riya Bansal', 'riya.bansal@example.com'], ['Karan Malhotra', 'karan.m@example.com'], ['Sneha Arora', 'sneha.arora@example.com'], ['Vivek Chawla', 'vivek.chawla@example.com']], who0 = names[Math.floor(R() * names.length)];
    var c = CAMP[Math.floor(R() * 2)], ad = adsOf(c)[0], fbclid = 'IwAR' + rnd(R, 44), t0 = Date.now(), fbc = 'fb.1.' + t0 + '.' + fbclid, fbp = 'fb.1.' + t0 + '.' + digits(R, 9), sess = rnd(R, 6), dev = 'iPhone · Safari 18', svc = c.slug.indexOf('kitchen') > -1 ? 'Modular kitchen' : 'Full home interiors', path = PAGES[svc];
    var eid = 'lead_' + rnd(R, 12, 'abcdef0123456789'), box = $('#sim-box');
    var steps = [
      ['click', 'Ad click · “' + ad.name + '” in ' + c.name, 'fbclid=' + fbclid.slice(0, 18) + '…'],
      ['PageView', path + '?utm_source=facebook&utm_medium=paid_social&utm_campaign=' + c.slug + '&utm_content=' + ad.slug + '&fbclid=' + fbclid.slice(0, 10) + '…'],
      ['ViewContent', path], ['Search', '/search?q=' + encodeURIComponent(svc.toLowerCase() + ' cost')], ['form', 'Fills the enquiry form · name, phone, email (advanced matching on)'], ['Lead', '/thank-you']
    ];
    function show(i) {
      if (box) { box.hidden = false; box.innerHTML = '<b>Visitor journey</b><ol>' + steps.map(function (s, k) { return '<li class="' + (k < i ? 'done' : k === i ? 'now' : '') + '">' + esc(s[0] === 'click' || s[0] === 'form' ? s[1] : s[0] + ' · ' + s[1].split('?')[0]) + '</li>'; }).join('') + '<li class="' + (i > steps.length ? 'done' : i === steps.length ? 'now' : '') + '">Lead created in the CRM and sent to Meta by CAPI (same event_id)</li></ol>'; }
    }
    var i = 0;
    (function step() {
      show(i);
      if (i < steps.length) {
        var s = steps[i];
        if (s[0] !== 'click' && s[0] !== 'form') addPx(Object.assign(pxEvent(s[0], s[1], svc, { t: Date.now(), fbp: fbp, fbc: fbc, device: dev, sess: sess }), s[0] === 'Lead' ? { event_id: eid, lead: '…' } : {}));
        i++; setTimeout(step, C.motion() ? 900 : 60); return;
      }
      var l = C.newLead({ name: who0[0], email: who0[1], phone: '+91 98••• ••' + (100 + Math.floor(R() * 800)), source: 'meta', service: svc, loc: 'Gurugram', budget: +(4 + R() * 8).toFixed(1), req: 'Enquiry from the Meta lead form: ' + svc.toLowerCase() + '.', utm: { source: 'facebook', medium: 'paid_social', campaign: c.slug, content: ad.slug }, fbclid: fbclid, fbc: fbc, fbp: fbp, event_id: eid, extra: 'campaign ' + c.slug });
      var pe = M().pixel.filter(function (x) { return x.event_id === eid; })[0]; if (pe) pe.lead = l.id; C.save();
      i++; show(i); simRun = false;
      C.toast('New lead ' + l.id + ' in the inbox · Lead sent by Pixel and CAPI, deduplicated', { icon: 'bolt' });
      setTimeout(function () { if (C.cur.name === 'pixel') C.rerender(); }, 1600);
    })();
  };

  // ===== Conversions API =============================================================================================================
  function capiRow(e) {
    var w = who(e.ref), open = C.ui.cxOpen === e.id;
    return '<tr class="' + (M().fresh === e.id ? 'fresh' : '') + '"><td class="nw mono sm">' + C.dt(e.t) + '</td><td>' + evb(e.name) + (e.test ? ' <span class="tagc">test</span>' : '') + (e.dedup ? ' <span class="tagc" title="Same event_id as the browser Pixel event">dedup</span>' : '') + '</td><td>' + (w ? '<span class="ochip">' + C.avatar(w.name, 18) + esc(w.name) + '</span>' : '—') + '</td>' +
      '<td><span class="hst ' + (e.status === 200 ? 'ok' : 'bad') + '">' + e.status + '</span>' + (e.retries ? ' <span class="muted sm">' + e.retries + ' retries</span>' : '') + '</td><td class="mono sm">' + e.fbtrace + '</td><td class="num mono sm">' + e.ms + ' ms</td><td><button type="button" class="ibtn" data-act="cx-open" data-id="' + e.id + '" aria-expanded="' + open + '" aria-label="Show payload for ' + e.name + '">' + C.ic(open ? 'chev-d' : 'chev-r', 15) + '</button></td></tr>' +
      (open ? '<tr class="cx-x"><td colspan="7">' + payloadView(e) + '</td></tr>' : '');
  }
  function payloadView(e) {
    var p = payload(e), n = p.n, ud = p.body.data[0].user_data, em = emqOf(ud);
    var hs = [['em', 'Email', p.w.email, n.em], ['ph', 'Phone', p.w.phone, n.ph], ['fn', 'First name', (p.w.name || '').split(' ')[0], n.fn], ['ct', 'City', p.w.city, n.ct]].filter(function (x) { return x[3]; });
    return '<div class="cx-g"><div><h3 class="h3">Hashing (in this browser, SHA-256)</h3><table class="hash"><thead><tr><th scope="col">Field</th><th scope="col">Raw</th><th scope="col">Normalised</th><th scope="col">SHA-256</th></tr></thead><tbody>' +
      hs.map(function (x) { return '<tr><td><b>' + x[1] + '</b> <span class="mono muted">' + x[0] + '</span></td><td class="mono">' + esc(x[2]) + '</td><td class="mono">' + esc(x[0] === 'ph' ? x[3].replace(/^(\d{4})\d{5}/, '$1•••••') : x[3]) + '</td><td class="mono hashv">' + sha256(x[3]).slice(0, 16) + '…</td></tr>'; }).join('') + '</tbody></table><p class="muted sm">Phone: digits only with country code, no + or spaces. Email: trimmed and lowercased. Digits are masked on screen; the hash uses the full number.</p>' +
      '<h3 class="h3">Match quality for this event · <b>' + em.toFixed(1) + '/10</b></h3><ul class="contrib">' + EMQ.map(function (x) { var has = !!ud[x[0]]; return '<li class="' + (has ? 'on' : '') + '"><span>' + x[1] + '</span><i style="--w:' + x[2] * 40 + '%"></i><b>' + (has ? '+' + x[2].toFixed(1) : '—') + '</b></li>'; }).join('') + '</ul></div>' +
      '<div><div class="cx-ph"><h3 class="h3">Payload · POST graph.facebook.com/' + GRAPH + '/' + PIXEL_ID + '/events</h3><button type="button" class="btn sm" data-act="cx-copy" data-id="' + e.id + '">' + C.ic('copy', 13) + 'Copy JSON</button></div><pre class="code" tabindex="0" aria-label="JSON payload">' + json(p.body) + '</pre><p class="sm muted">Response: <span class="mono">{"events_received":1,"messages":[],"fbtrace_id":"' + e.fbtrace + '"}</span>' + (e.note ? '<br><b>' + esc(e.note) + '</b>' : '') + '</p></div></div>';
  }
  C.acts['cx-open'] = function (el) { C.ui.cxOpen = C.ui.cxOpen === el.dataset.id ? null : el.dataset.id; C.rerender(); var b = $('[data-act="cx-open"][data-id="' + el.dataset.id + '"]'); if (b) b.focus(); };
  C.acts['cx-copy'] = function (el) { var e = M().capi.filter(function (x) { return x.id === el.dataset.id; })[0]; if (e) copyText(JSON.stringify(payload(e).body, null, 2)); };
  V.capi = {
    title: function () { return 'Conversions API'; },
    render: function () {
      var m = M(), f = C.ui.cxF || 'all', L = m.capi.filter(function (e) { return f === 'all' || e.name === f; }).slice(0, 40), t = m.test;
      if (!C.ui.cxOpen && L[0]) C.ui.cxOpen = L[0].id;
      var ok = m.capi.filter(function (e) { return e.status === 200; }).length, lat = Math.round(m.capi.slice(0, 50).reduce(function (s, e) { return s + e.ms; }, 0) / Math.min(50, m.capi.length));
      return C.page('Conversions API', 'Server events from the CRM to dataset <span class="mono">' + PIXEL_ID + '</span> · Graph API ' + GRAPH + ' ' + DEMO) + subnav('capi') +
        '<div class="kpis sm4"><div class="kpi"><span class="kl">Delivered</span><b>' + (ok / m.capi.length * 100).toFixed(1) + '%</b><small>' + ok + ' of ' + m.capi.length + ' · 200 OK</small></div><div class="kpi"><span class="kl">Median latency</span><b>' + lat + ' ms</b><small>CRM → Meta</small></div><div class="kpi"><span class="kl">Match quality</span><b>' + emqAvg().toFixed(1) + '</b><small>out of 10</small></div><div class="kpi"><span class="kl">Dedup with Pixel</span><b>' + dedup().rate + '%</b><small>shared event_id</small></div></div>' +
        '<section class="card"><div class="card-h"><div><h2>Event mapping</h2><p class="sub">Which CRM moments are sent to Meta, and as which event</p></div></div><ul class="maps">' + m.map.map(function (x) {
          return '<li class="' + (x.on ? '' : 'off') + '"><span class="mp-t">' + C.ic('bolt', 14) + '<b>' + TRIG[x.trig] + '</b></span><span class="mp-a" aria-hidden="true">→</span><span class="mp-e"><label class="sr" for="mpe-' + x.id + '">Meta event for ' + TRIG[x.trig] + '</label><select id="mpe-' + x.id + '" class="sel sm" data-ch="mp-ev" data-id="' + x.id + '">' + (x.custom ? '<option selected>' + x.ev + '</option>' : '') + STD.map(function (s) { return '<option' + (s === x.ev ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>' + (x.custom ? '<span class="tagc">custom</span>' : '') + (x.value ? '<span class="tagc">₹ value</span>' : '') + '</span><span class="mp-w">' + esc(x.why) + '</span>' +
            '<label class="sw"><input type="checkbox" data-ch="mp-on" data-id="' + x.id + '"' + (x.on ? ' checked' : '') + '><span aria-hidden="true"></span><span class="sr">Send ' + x.ev + ' when ' + TRIG[x.trig] + '</span></label></li>';
        }).join('') + '</ul></section>' +
        '<section class="card ctest' + (t.on ? ' on' : '') + '"><div class="card-h"><div><h2>Test events</h2><p class="sub">While on, every event carries <span class="mono">test_event_code</span> and shows here instead of in reporting</p></div><label class="sw"><input type="checkbox" data-ch="tst-on"' + (t.on ? ' checked' : '') + '><span aria-hidden="true"></span><span class="sr">Test mode</span></label></div>' +
        '<div class="ctest-b"><span>Test code</span><code class="mono">' + t.code + '</code><button type="button" class="btn sm" data-act="tst-fire"' + (t.on ? '' : ' disabled') + '>' + C.ic('bolt', 13) + 'Send a test Lead</button><span class="muted sm">' + (t.on ? 'Mark a deal Won or move a lead to see it arrive.' : 'Turn on to verify a new mapping before it counts.') + '</span></div>' +
        (t.got.length ? '<ul class="ctest-l">' + t.got.slice(0, 6).map(function (g) { return '<li>' + C.ic('check', 13) + evb(g.name) + '<span>Received from <b>' + g.src + '</b>' + (g.dedup ? ' · deduplicated' : '') + '</span><time class="muted sm">' + C.rel(g.t) + '</time></li>'; }).join('') + '</ul>' : '') + '</section>' +
        '<section class="card flush"><div class="card-h pad"><div><h2><span class="live-dot"></span>Delivery log</h2><p class="sub">Mark a deal Won anywhere in the CRM and a Purchase appears here</p></div></div><div class="chips pad" role="group" aria-label="Filter events">' + ['all', 'Lead', 'Contact', 'Schedule', 'QualifiedLead', 'Purchase'].map(function (n) { return '<button type="button" class="chip" data-act="cx-f" data-v="' + n + '" aria-pressed="' + (f === n) + '">' + (n === 'all' ? 'All' : n) + '</button>'; }).join('') + '</div>' +
        '<div class="tablewrap"><table class="tbl cxt"><thead><tr><th scope="col">Sent</th><th scope="col">Event</th><th scope="col">Person</th><th scope="col">Status</th><th scope="col">fbtrace_id</th><th scope="col" class="num">Latency</th><th scope="col"><span class="sr">Payload</span></th></tr></thead><tbody>' + L.map(capiRow).join('') + '</tbody></table></div></section>' + why('Ad blockers and iOS stop up to a third of browser events; the server copy fills the gap and adds outcomes the website never sees.');
    }
  };
  C.acts['cx-f'] = function (el) { C.ui.cxF = el.dataset.v; C.ui.cxOpen = null; C.rerender(); var b = $('[data-act="cx-f"][aria-pressed="true"]'); if (b) b.focus(); };
  C.chs['mp-on'] = function (el) { var x = M().map.filter(function (q) { return q.id === el.dataset.id; })[0]; x.on = el.checked; C.audit('settings', null, 'CAPI mapping: ' + TRIG[x.trig], el.checked ? 'off' : 'on', el.checked ? 'on' : 'off'); C.save(); C.rerender(); C.toast(x.ev + (x.on ? ' will be sent' : ' paused') + ' for “' + TRIG[x.trig] + '”', { icon: 'bolt' }); };
  C.chs['mp-ev'] = function (el) { var x = M().map.filter(function (q) { return q.id === el.dataset.id; })[0]; C.audit('settings', null, 'CAPI event for ' + TRIG[x.trig], x.ev, el.value); x.ev = el.value; x.custom = STD.indexOf(el.value) < 0; C.save(); C.rerender(); };
  C.chs['tst-on'] = function (el) { M().test.on = el.checked; C.save(); C.rerender(); };
  C.acts['tst-fire'] = function () { var l = S().leads[0]; var e = capiEvent('Lead', { t: 'lead', id: l.id }, Date.now()); e.test = true; M().capi.unshift(e); M().test.got.unshift({ t: e.t, name: 'Lead', src: 'Server' }); M().fresh = e.id; C.ui.cxOpen = e.id; C.save(); C.rerender(); C.toast('Test Lead received · code ' + M().test.code, { icon: 'check' }); };

  // ===== Attribution ===================================================================================================================
  function attr() {
    var leads = S().leads, deals = P().deals, rows = [];
    CAMP.forEach(function (c) {
      var cr = { lvl: 0, key: c.slug, name: c.name, obj: c.obj, sp: 0, leads: 0, live: 0, vis: 0, won: 0, rev: 0, kids: [] };
      c.sets.forEach(function (s, si) {
        var sr = { lvl: 1, key: c.slug + '#' + si, name: s[0], sp: 0, leads: 0, live: 0, vis: 0, won: 0, rev: 0, kids: [] };
        s[1].forEach(function (a) {
          var k = c.slug + '|' + a[1], h = M().hist[k], L = leads.filter(function (l) { return l.utm.campaign === c.slug && l.utm.content === a[1]; });
          var won = L.filter(function (l) { return l.status === 'won'; }), rev = won.reduce(function (s0, l) { var d = deals.filter(function (x) { return x.leadId === l.id; })[0]; return s0 + (d ? C.dealVal(d) : l.budget * 1e5); }, 0);
          var ar = { lvl: 2, key: k, name: a[0], slug: a[1], sp: M().spend[k], leads: h.leads + L.length, live: L.length, vis: h.visits + L.filter(function (l) { return C.reached(l) >= 2; }).length, won: h.won + won.length, rev: h.rev + rev };
          ['sp', 'leads', 'live', 'vis', 'won', 'rev'].forEach(function (f) { sr[f] += ar[f]; }); sr.kids.push(ar);
        });
        ['sp', 'leads', 'live', 'vis', 'won', 'rev'].forEach(function (f) { cr[f] += sr[f]; }); cr.kids.push(sr);
      });
      rows.push(cr);
    });
    return rows;
  }
  function arow(r, open) {
    var cpl = r.leads ? r.sp / r.leads : 0, cpv = r.vis ? r.sp / r.vis : 0, roas = r.sp ? r.rev / r.sp : 0, has = r.kids && r.kids.length;
    return '<tr class="lv' + r.lvl + '"><th scope="row"><span class="at-n" style="--l:' + r.lvl + '">' + (has ? '<button type="button" class="ibtn" data-act="at-tog" data-k="' + esc(r.key) + '" aria-expanded="' + open + '" aria-label="' + (open ? 'Collapse ' : 'Expand ') + esc(r.name) + '">' + C.ic(open ? 'chev-d' : 'chev-r', 14) + '</button>' : '<span class="at-sp"></span>') + '<span><b>' + esc(r.name) + '</b>' + (r.lvl === 0 ? '<small>' + r.obj + ' objective · campaign</small>' : r.lvl === 1 ? '<small>Ad set</small>' : '<small class="mono">utm_content=' + r.slug + '</small>') + '</span></span></th>' +
      '<td class="num mono">' + C.inr(r.sp) + '</td><td class="num">' + r.leads + (r.live ? ' <a class="tagc" href="#/inbox" title="' + r.live + ' of these leads are in the inbox now">' + r.live + ' live</a>' : '') + '</td><td class="num mono">' + (r.leads ? C.inr(cpl) : '—') + '</td><td class="num">' + r.vis + '</td><td class="num mono">' + (r.vis ? C.inr(cpv) : '—') + '</td><td class="num">' + r.won + '</td><td class="num mono">' + (r.rev ? C.rs(r.rev) : '—') + '</td><td class="num"><b class="roas ' + (roas >= 10 ? 'hi' : roas >= 3 ? 'ok' : 'lo') + '">' + (r.sp ? roas.toFixed(1) + '×' : '—') + '</b></td></tr>';
  }
  V.attribution = {
    title: function () { return 'Attribution'; },
    render: function () {
      var rows = attr(), open = C.ui.atOpen || (C.ui.atOpen = { 'kitchen-leadform-ncr': 1 }), tot = { sp: 0, leads: 0, vis: 0, won: 0, rev: 0 };
      rows.forEach(function (r) { Object.keys(tot).forEach(function (k) { tot[k] += r[k]; }); });
      var body = '';
      rows.forEach(function (c) { body += arow(c, !!open[c.key]); if (open[c.key]) c.kids.forEach(function (s) { body += arow(s, !!open[s.key]); if (open[s.key]) s.kids.forEach(function (a) { body += arow(a, false); }); }); });
      var wk = weekly();
      C.chartSpecs.atl = function (w) { return C.chart.bars({ w: w, h: 200, values: wk.leads, labels: wk.labels, color: '#8454E8', name: 'Meta leads', label: 'Meta-sourced leads per week' }); };
      C.chartSpecs.atr = function (w) { return C.chart.area({ w: w, h: 200, L: 46, labels: wk.labels, series: [{ label: 'Revenue', color: '#15803D', values: wk.rev }], fmt: function (v) { return C.rs(v); }, label: 'Revenue from Meta-sourced deals per week' }); };
      var leads = S().leads, ids = leads.filter(function (l) { return l.fbclid; }).length, g = leads.filter(function (l) { return l.gclid; }).length;
      return C.page('Attribution', 'Meta campaign → ad set → ad → leads → site visits → deals won → revenue · last 90 days ' + DEMO) + subnav('attribution') +
        '<div class="kpis sm4"><div class="kpi"><span class="kl">Spend</span><b>' + C.inr(tot.sp) + '</b><small>Meta, 90 days</small></div><div class="kpi"><span class="kl">Cost per lead</span><b>' + C.inr(tot.sp / tot.leads) + '</b><small>' + tot.leads + ' leads</small></div><div class="kpi"><span class="kl">Cost per site visit</span><b>' + C.inr(tot.sp / tot.vis) + '</b><small>' + tot.vis + ' visits</small></div><div class="kpi"><span class="kl">ROAS</span><b>' + (tot.rev / tot.sp).toFixed(1) + '×</b><small>' + C.rs(tot.rev) + ' won</small></div></div>' +
        '<section class="card flush"><div class="card-h pad"><div><h2>Campaigns</h2><p class="sub">Joined on <span class="mono">utm_campaign</span> and <span class="mono">utm_content</span>; revenue is the CRM’s won-deal value, not Meta’s estimate</p></div></div><div class="tablewrap"><table class="tbl att"><thead><tr><th scope="col">Campaign / ad set / ad</th><th scope="col" class="num">Spend</th><th scope="col" class="num">Leads</th><th scope="col" class="num">CPL</th><th scope="col" class="num">Site visits</th><th scope="col" class="num">Cost / visit</th><th scope="col" class="num">Won</th><th scope="col" class="num">Revenue</th><th scope="col" class="num">ROAS</th></tr></thead><tbody>' + body + '</tbody></table></div></section>' +
        '<div class="grid g2"><section class="card"><div class="card-h"><div><h2>Meta leads by week</h2><p class="sub">12 weeks</p></div></div><div class="chart" data-chart="atl"></div></section><section class="card"><div class="card-h"><div><h2>Revenue from Meta leads</h2><p class="sub">By the week the deal was won</p></div></div><div class="chart" data-chart="atr"></div></section></div>' +
        '<section class="card"><div class="card-h"><div><h2>Click IDs kept on every lead</h2><p class="sub">Open any lead and see its Source block</p></div></div><p class="att-ids"><span><b>' + ids + '</b> leads with <span class="mono">fbclid</span> / <span class="mono">fbc</span></span><span><b>' + g + '</b> with <span class="mono">gclid</span> (Google Ads)</span><span><b>' + leads.filter(function (l) { return l.utm && l.utm.campaign; }).length + '</b> with a <span class="mono">utm_campaign</span></span></p>' + why('Meta reports “results”; this shows which ads produced site visits and paid jobs, so budget moves to what actually sells.') + '</section>';
    }
  };
  function weekly() {
    var labels = [], leads = [], rev = [], now = Date.now(), hk = Object.keys(M().hist);
    for (var w = 11; w >= 0; w--) {
      var a = now - (w + 1) * 7 * D, b = now - w * 7 * D, L = S().leads.filter(function (l) { return l.source === 'meta' && l.created >= a && l.created < b; });
      labels.push(C.dshort(a)); leads.push(L.length + hk.reduce(function (s, k) { return s + M().hist[k].wk[11 - w]; }, 0));
      rev.push(hk.reduce(function (s, k) { var h = M().hist[k]; return s + (h.won && (11 - w) % 3 === (k.length % 3) ? h.rev / Math.max(1, Math.ceil(h.won)) / 2 : 0); }, 0) + S().leads.filter(function (l) { return l.source === 'meta' && l.status === 'won' && l.created >= a - 14 * D && l.created < b - 14 * D; }).reduce(function (s, l) { return s + l.budget * 1e5; }, 0));
    }
    return { labels: labels, leads: leads, rev: rev.map(Math.round) };
  }
  C.acts['at-tog'] = function (el) { var o = C.ui.atOpen; o[el.dataset.k] = !o[el.dataset.k]; C.rerender(); var b = $('[data-act="at-tog"][data-k="' + el.dataset.k + '"]'); if (b) b.focus(); };

  // ===== Search Console ================================================================================================================
  var G = null;
  function gscData() {
    if (G) return G; var R = C.rng(77), days = [], t = Date.now() - 2 * D, i;
    for (i = 0; i < 180; i++) { var d = new Date(t - (179 - i) * D), wk = (d.getDay() === 0 || d.getDay() === 6) ? .8 : 1, imp = Math.round((430 + i * 3.1) * (.88 + R() * .26) * wk), ctr = .026 + .004 * Math.sin(i / 5) + R() * .005; days.push({ t: d.getTime(), imp: imp, clicks: Math.round(imp * ctr), pos: +(16.8 - i * .035 + R() * .6).toFixed(1) }); }
    var Q = [['modular kitchen design delhi', 2840, .034, 6.2, '/modular-kitchen'], ['interior designer in gurugram', 2310, .029, 8.4, '/full-home-interiors'], ['kitchen renovation cost delhi ncr', 1870, .041, 5.1, '/modular-kitchen'], ['wardrobe design for small bedroom', 1650, .022, 11.3, '/wardrobes'], ['lumen homes interiors', 1210, .19, 1.3, '/'], ['bathroom remodel cost noida', 1120, .027, 9.8, '/bathroom-remodel'], ['full home interior packages 3bhk', 1040, .031, 7.6, '/full-home-interiors'], ['smart lighting for living room', 930, .018, 14.2, '/smart-lighting'], ['modular kitchen price per sq ft', 880, .036, 6.9, '/modular-kitchen'], ['best interior designers noida', 820, .024, 10.5, '/full-home-interiors'], ['l shaped kitchen design ideas', 760, .015, 16.4, '/modular-kitchen'], ['sliding wardrobe designs', 690, .017, 15.1, '/wardrobes'], ['home interior designer near me', 640, .026, 9.2, '/full-home-interiors'], ['wood polish cost per sq ft', 410, .037, 7.1, '/painting-and-polish'], ['lumen homes reviews', 380, .12, 1.8, '/'], ['painting contractor saket', 310, .021, 12.7, '/painting-and-polish']];
    G = { days: days, Q: Q }; return G;
  }
  function gscTotals(n, off) { var d = gscData().days, a = d.slice(d.length - n * ((off || 0) + 1), d.length - n * (off || 0)), c = 0, im = 0, ps = 0; a.forEach(function (x) { c += x.clicks; im += x.imp; ps += x.pos * x.imp; }); return { c: c, i: im, ctr: im ? c / im : 0, p: im ? ps / im : 0, days: a }; }
  function gscQueries(n) {
    var tot = gscTotals(n), base = gscData().Q, qi = base.reduce(function (s, x) { return s + x[1]; }, 0), qc = base.reduce(function (s, x) { return s + x[1] * x[2]; }, 0);
    var fi = .78 * tot.i / qi, fc = .74 * tot.c / qc; // tracked queries are a subset: never more than the period totals (anonymised queries make up the rest)
    return base.map(function (x) { var im = Math.round(x[1] * fi), c = Math.max(1, Math.round(x[1] * x[2] * fc)); return { q: x[0], imp: im, clicks: c, ctr: c / im, pos: x[3], page: x[4] }; });
  }
  var IDX = [['Indexed', 418, 'ok'], ['Crawled – currently not indexed', 38, 'warn', 'Thin tag and filter pages; merge or noindex them.'], ['Alternate page with proper canonical tag', 21, 'muted', 'Expected: UTM and sort variants point to the main page.'], ['Excluded by ‘noindex’ tag', 14, 'muted', 'Thank-you and account pages, intentionally.'], ['Duplicate without user-selected canonical', 12, 'warn', 'Project pages reachable at two URLs; add a canonical.'], ['Page with redirect', 9, 'muted', 'Old /services/* URLs redirect to the new pages.'], ['Not found (404)', 6, 'bad', 'Links from old Instagram bios; redirect them.']];
  var URLS = {
    '/modular-kitchen': { cov: 'URL is on Google', st: 'ok', can: '/modular-kitchen', crawl: 3, mob: 'Page is mobile-friendly', sm: '/page-sitemap.xml', ref: 'Smartphone' },
    '/full-home-interiors': { cov: 'URL is on Google', st: 'ok', can: '/full-home-interiors', crawl: 6, mob: 'Page is mobile-friendly', sm: '/page-sitemap.xml', ref: 'Smartphone' },
    '/projects/sector-57-villa': { cov: 'Crawled – currently not indexed', st: 'warn', can: '/projects/sector-57-villa', crawl: 11, mob: 'Page is mobile-friendly', sm: '/project-sitemap.xml', ref: 'Smartphone' },
    '/blog/kitchen-cost-guide-2026': { cov: 'Discovered – currently not indexed', st: 'warn', can: '—', crawl: null, mob: 'Not yet tested', sm: '/post-sitemap.xml', ref: '—' },
    '/services/kitchens': { cov: 'Page with redirect', st: 'muted', can: '/modular-kitchen', crawl: 19, mob: '—', sm: '—', ref: 'Smartphone' }
  };
  V.gsc = {
    title: function () { return 'Search Console'; },
    render: function () {
      var n = C.ui.gscN || 28, mk = C.ui.gscM || 'c', cur = gscTotals(n), prev = gscTotals(n, 1), Q = gscQueries(n), lab = cur.days.map(function (x) { return C.dshort(x.t); });
      var MET = { c: ['Clicks', cur.c, prev.c, C.num, '#4F46E5'], i: ['Impressions', cur.i, prev.i, C.num, '#0B8F9E'], ctr: ['CTR', cur.ctr * 100, prev.ctr * 100, function (v) { return v.toFixed(1) + '%'; }, '#8454E8'], p: ['Average position', cur.p, prev.p, function (v) { return v.toFixed(1); }, '#B07A10', 1] };
      var mm = MET[mk], val = function (x) { return mk === 'c' ? x.clicks : mk === 'i' ? x.imp : mk === 'ctr' ? x.clicks / x.imp * 100 : x.pos; };
      C.chartSpecs.gsc2 = function (w) { return C.chart.area({ w: w, h: 240, labels: lab, invert: !!mm[5], series: [{ label: 'Previous ' + n + ' days', color: '#B8BCC8', fill: false, values: prev.days.map(val) }, { label: 'Last ' + n + ' days', color: mm[4], values: cur.days.map(val) }], fmt: function (v) { return mm[3](v); }, label: mm[0] + ', last ' + n + ' days against the previous ' + n }); };
      var kpi = function (k) { var x = MET[k], d = x[1] - x[2], good = x[5] ? d < 0 : d > 0; return '<button type="button" class="kpi tile" data-act="gsc2-m" data-k="' + k + '" aria-pressed="' + (mk === k) + '"><span class="kl">' + x[0] + '</span><b>' + x[3](x[1]) + '</b><small class="' + (good ? 'up' : 'down') + '">' + (d > 0 ? '+' : '') + (k === 'c' || k === 'i' ? Math.round(d / x[2] * 100) + '%' : x[3](d)) + ' vs previous ' + n + ' days</small></button>'; };
      var leads = S().leads, pages = {};
      Q.forEach(function (q) { var p = pages[q.page] || (pages[q.page] = { page: q.page, clicks: 0, imp: 0, leads: 0, won: 0 }); p.clicks += q.clicks; p.imp += q.imp; });
      leads.forEach(function (l) { if (l.source === 'google' && l.utm.medium === 'organic' || l.source === 'web') { var p = pages[l.landing]; if (p) { p.leads++; if (l.status === 'won') p.won++; } } });
      var PG = Object.keys(pages).map(function (k) { return pages[k]; }).sort(function (a, b) { return b.clicks - a.clicks; }), qsum = Q.reduce(function (s, x) { return s + x.clicks; }, 0);
      var u = C.ui.gscU || { url: '/modular-kitchen', res: null }, q2 = C.ui.gscQ || [];
      var idxTot = IDX.reduce(function (s, x) { return s + x[1]; }, 0);
      return C.page('Search Console', 'Property <span class="mono">sc-domain:' + HOST + '</span> · data is 2 days behind, like the real thing ' + DEMO, '<div class="seg" role="group" aria-label="Date range"><button type="button" data-act="gsc2-n" data-v="28" aria-pressed="' + (n === 28) + '">28 days</button><button type="button" data-act="gsc2-n" data-v="90" aria-pressed="' + (n === 90) + '">90 days</button></div>') + subnav('gsc') +
        '<div class="kpis sm4" role="group" aria-label="Choose a metric to chart">' + ['c', 'i', 'ctr', 'p'].map(kpi).join('') + '</div>' +
        '<section class="card"><div class="card-h"><div><h2>' + mm[0] + '</h2><p class="sub">Last ' + n + ' days (solid) against the previous ' + n + ' days (grey)' + (mm[5] ? ' · lower is better' : '') + '</p></div></div><div class="chart" data-chart="gsc2"></div></section>' +
        '<div class="grid g2"><section class="card flush"><div class="card-h pad"><div><h2>Top queries</h2><p class="sub">These ' + Q.length + ' account for ' + C.num(qsum) + ' of ' + C.num(cur.c) + ' clicks; the rest are anonymised by Google</p></div></div><div class="tablewrap" tabindex="0" role="region" aria-labelledby="gq-h"><table class="tbl"><thead><tr><th scope="col">Query</th><th scope="col" class="num">Clicks</th><th scope="col" class="num">Impr.</th><th scope="col" class="num">CTR</th><th scope="col" class="num">Pos.</th></tr></thead><tbody>' + Q.slice().sort(function (a, b) { return b.clicks - a.clicks; }).slice(0, 10).map(function (x) { return '<tr><td>' + esc(x.q) + '</td><td class="num mono">' + C.num(x.clicks) + '</td><td class="num mono">' + C.num(x.imp) + '</td><td class="num mono">' + (x.ctr * 100).toFixed(1) + '%</td><td class="num mono">' + x.pos.toFixed(1) + '</td></tr>'; }).join('') + '</tbody></table></div></section>' +
        '<section class="card flush"><div class="card-h pad"><div><h2 id="gp-h">Organic leads by landing page</h2><p class="sub">Search Console clicks joined with CRM leads on the landing page</p></div></div><div class="tablewrap" tabindex="0" role="region" aria-labelledby="gp-h"><table class="tbl"><thead><tr><th scope="col">Page</th><th scope="col" class="num">Clicks</th><th scope="col" class="num">Leads</th><th scope="col" class="num">Click → lead</th><th scope="col" class="num">Won</th></tr></thead><tbody>' + PG.map(function (p) { return '<tr><td class="mono sm">' + esc(p.page) + '</td><td class="num mono">' + C.num(p.clicks) + '</td><td class="num"><b>' + p.leads + '</b></td><td class="num mono">' + (p.clicks ? (p.leads / p.clicks * 100).toFixed(1) + '%' : '—') + '</td><td class="num">' + p.won + '</td></tr>'; }).join('') + '</tbody></table></div>' + why('Rank is vanity; this shows which pages turn searchers into enquiries, so content effort goes there.') + '</section></div>' +
        '<div class="grid g2"><section class="card"><div class="card-h"><div><h2>Page indexing</h2><p class="sub">' + idxTot + ' known pages · last updated ' + C.dshort(Date.now() - 3 * D) + '</p></div></div><div class="idx-bar" role="img" aria-label="' + IDX[0][1] + ' indexed, ' + (idxTot - IDX[0][1]) + ' not indexed">' + IDX.map(function (x) { return '<i class="' + x[2] + '" style="flex:' + x[1] + '"></i>'; }).join('') + '</div><ul class="idx">' + IDX.map(function (x, i) { return '<li class="' + x[2] + '"><span><b>' + x[0] + '</b>' + (x[3] ? '<small>' + x[3] + '</small>' : '') + '</span><em class="mono">' + x[1] + '</em>' + (i ? '' : '<span class="tagc">Indexed</span>') + '</li>'; }).join('') + '</ul>' +
        '<h3 class="h3">Sitemaps</h3><div class="tablewrap" tabindex="0" role="region" aria-label="Sitemaps"><table class="tbl mini"><thead><tr><th scope="col">Sitemap</th><th scope="col">Status</th><th scope="col" class="num">Discovered</th><th scope="col">Last read</th></tr></thead><tbody>' + [['/sitemap_index.xml', 'Success', 418, 1], ['/page-sitemap.xml', 'Success', 24, 1], ['/project-sitemap.xml', 'Success', 132, 2], ['/post-sitemap.xml', 'Success', 262, 1], ['/old-sitemap.xml', 'Couldn’t fetch', 0, 41]].map(function (s) { return '<tr><td class="mono sm">' + s[0] + '</td><td><span class="hst ' + (s[1] === 'Success' ? 'ok' : 'bad') + '">' + s[1] + '</span></td><td class="num mono">' + s[2] + '</td><td class="sm">' + C.dshort(Date.now() - s[3] * D) + '</td></tr>'; }).join('') + '</tbody></table></div></section>' +
        '<section class="card"><div class="card-h"><div><h2>URL inspection</h2><p class="sub">Check how Google sees one page</p></div></div><form class="ui-f" data-form="gsc-url"><label class="sr" for="gsc-u">Page URL</label><div class="sfield">' + C.ic('search', 14) + '<span class="mono muted sm">' + HOST + '</span><input id="gsc-u" name="u" value="' + esc(u.url) + '" autocomplete="off" spellcheck="false" list="gsc-ul"></div><datalist id="gsc-ul">' + Object.keys(URLS).map(function (k) { return '<option value="' + k + '">'; }).join('') + '</datalist><button class="btn" type="submit">Inspect</button></form>' + inspectView(u) +
        (q2.length ? '<h3 class="h3">Indexing requests</h3><ul class="iq">' + q2.map(function (r) { return '<li class="' + r.st + '"><span class="mono sm">' + esc(r.url) + '</span><span>' + (r.st === 'done' ? C.ic('check', 13) + 'Added to the priority crawl queue' : C.ic('clock', 13) + 'Testing live URL…') + '</span><time class="muted sm">' + C.rel(r.t) + '</time></li>'; }).join('') + '</ul><p class="muted sm">' + (10 - q2.length) + ' of 10 requests left today</p>' : '') + '</section></div>' +
        '<section class="card"><div class="card-h"><div><h2>Core Web Vitals</h2><p class="sub">Field data from real Chrome users (CrUX), 28 days</p></div></div><div class="cwv">' + [['Mobile', [['LCP', '2.1 s', 'ok'], ['INP', '180 ms', 'ok'], ['CLS', '0.04', 'ok']], [372, 38, 8]], ['Desktop', [['LCP', '1.3 s', 'ok'], ['INP', '90 ms', 'ok'], ['CLS', '0.02', 'ok']], [409, 9, 0]]].map(function (d) { var t = d[2][0] + d[2][1] + d[2][2]; return '<div><h3 class="h3">' + d[0] + '</h3><div class="idx-bar"><i class="ok" style="flex:' + d[2][0] + '"></i><i class="warn" style="flex:' + d[2][1] + '"></i><i class="bad" style="flex:' + (d[2][2] || .001) + '"></i></div><p class="sm"><b>' + d[2][0] + '</b> good · ' + d[2][1] + ' need improvement · ' + d[2][2] + ' poor URLs</p><ul class="cwv-m">' + d[1].map(function (m) { return '<li class="' + m[2] + '"><span>' + m[0] + '</span><b class="mono">' + m[1] + '</b></li>'; }).join('') + '</ul></div>'; }).join('') + '</div>' + why('Slow pages lose rankings and enquiries; mobile is where 78% of these visits happen.') + '</section>';
    }
  };
  function inspectView(u) {
    var r = u.res; if (!r) return '<p class="muted sm">Try /modular-kitchen, /projects/sector-57-villa or /blog/kitchen-cost-guide-2026.</p>';
    if (r.err) return '<p class="ui-err" role="alert">' + esc(r.err) + '</p>';
    return '<div class="ui-r ' + r.st + '"><div class="ui-h">' + C.ic(r.st === 'ok' ? 'check' : 'clock', 16) + '<b>' + esc(r.cov) + '</b></div><dl class="kvl"><dt>Google-selected canonical</dt><dd class="mono">' + esc(r.can) + '</dd><dt>Last crawl</dt><dd>' + (r.crawl ? C.dshort(Date.now() - r.crawl * D) + ' · Googlebot ' + r.ref : 'Not crawled yet') + '</dd><dt>Mobile usability</dt><dd>' + esc(r.mob) + '</dd><dt>Sitemaps</dt><dd class="mono">' + esc(r.sm) + '</dd></dl><button type="button" class="btn sm" data-act="gsc-req"' + (r.st === 'muted' ? ' disabled title="Redirected pages can’t be indexed"' : '') + '>Request indexing</button></div>';
  }
  C.forms['gsc-url'] = function (f) {
    var v = String(new FormData(f).get('u') || '').trim(); var path = v.replace(/^https?:\/\/(www\.)?lumenhomes\.example/i, '');
    var res;
    if (/^https?:\/\//i.test(path)) res = { err: 'That URL isn’t in this property. Inspect a page on ' + HOST + '.' };
    else { if (path.charAt(0) !== '/') path = '/' + path; res = URLS[path] || { cov: 'URL is not on Google', st: 'warn', can: '—', crawl: null, mob: 'Not yet tested', sm: 'Not in any sitemap', ref: '—' }; }
    C.ui.gscU = { url: path || v, res: res }; C.rerender(); var x = $('#gsc-u'); if (x) x.focus();
  };
  C.acts['gsc-req'] = function () {
    var q = C.ui.gscQ = C.ui.gscQ || [], u = C.ui.gscU; if (q.length >= 10) { C.toast('Daily quota reached', { icon: 'x' }); return; }
    var r = { url: u.url, t: Date.now(), st: 'run' }; q.unshift(r); C.rerender();
    setTimeout(function () { r.st = 'done'; if (C.cur.name === 'gsc') C.rerender(); C.toast('Indexing requested for ' + u.url, { icon: 'check' }); }, C.motion() ? 2200 : 50);
  };
  C.acts['gsc2-n'] = function (el) { C.ui.gscN = +el.dataset.v; C.rerender(true); };
  C.acts['gsc2-m'] = function (el) { C.ui.gscM = el.dataset.k; C.rerender(true); var b = $('[data-act="gsc2-m"][aria-pressed="true"]'); if (b) b.focus(); };

  // lead record: Source block helper (used by views.js)
  C.sourceBlock = function (l) {
    var r = function (k, v, mono) { return v ? '<dt>' + k + '</dt><dd class="' + (mono ? 'mono brk' : '') + '">' + esc(v) + '</dd>' : ''; };
    return r('utm_content', l.utm.content, 1) + r('Landing page', l.landing, 1) + r('fbclid', l.fbclid ? l.fbclid.slice(0, 20) + '…' : '', 1) + r('fbc', l.fbc ? l.fbc.slice(0, 26) + '…' : '', 1) + r('fbp', l.fbp, 1) + r('gclid', l.gclid ? l.gclid.slice(0, 22) + '…' : '', 1);
  };
  // search
  C.searchers.push(function (terms, hit) { var o = []; [['Tracking overview', 'tracking'], ['Meta Pixel events', 'pixel'], ['Conversions API delivery log', 'capi'], ['Ad attribution and ROAS', 'attribution'], ['Search Console', 'gsc']].forEach(function (x) { if (hit(x[0] + ' meta pixel capi conversions api facebook google search console seo roas utm tracking')) o.push({ g: 'Marketing', ic: 'chart', label: x[0], sub: 'Marketing & tracking', run: function () { location.hash = '#/' + x[1]; } }); }); return o.slice(0, 3); });
  // icons
  C.IC.scan = '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>';
  C.IC.server = '<rect x="4" y="4" width="16" height="7" rx="2"/><rect x="4" y="13" width="16" height="7" rx="2"/><path d="M8 7.5h.01M8 16.5h.01"/>';
  C.IC.play = '<path d="M7 5.5v13l11-6.5z"/>';
  C.IC.target = '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6"/>';
})();
