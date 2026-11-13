/* Orbit Assistants · section modules "rows" (04 What it does) and "results" (05 The numbers).
   OrbitSections.rows.mount(el, ctx)    el = <section id="rows" data-module="rows">
   OrbitSections.results.mount(el, ctx) el = <section id="results" data-module="results">
   Micro-demos are plain HTML/CSS driven by a small cancellable timer runner; they run only while on screen and
   render their final state statically when motion is off. No inline handlers, no network. */
(function () {
  'use strict';
  window.OrbitSections = window.OrbitSections || {};

  /* ---------- helpers ---------- */
  var CANCEL = { cancelled: true };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function q(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function raf(fn) { requestAnimationFrame(function () { requestAnimationFrame(fn); }); }
  function mkTok() {
    var t = { dead: false, tm: null, rej: null };
    t.sleep = function (ms) { return new Promise(function (res, rej) { if (t.dead) return rej(CANCEL); t.rej = rej; t.tm = setTimeout(function () { t.rej = null; res(); }, ms); }); };
    t.stop = function () { t.dead = true; clearTimeout(t.tm); if (t.rej) { var r = t.rej; t.rej = null; r(CANCEL); } };
    return t;
  }
  function brand(id) {
    var B = window.OrbitBrands;
    return (B && B.byId && B.byId[id]) || { id: id, name: id, short: id, mark: id.slice(0, 2).toUpperCase(), acc: '#5EEAD4', ink: '#04201B', tx: '#0F766E', soft: '#D9F7F1', deep: '#07201E', display: "'Instrument Serif',Georgia,serif" };
  }
  var IC = {
    web: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.6 5.2 3.6 8.5s-1 6.1-3.6 8.5c-2.6-2.4-3.6-5.2-3.6-8.5s1-6.1 3.6-8.5z"/>',
    whatsapp: '<path d="M4 20l1.3-4A8.2 8.2 0 1 1 8 18.7z"/><path d="M9.2 9.2c.2 2.2 2.4 4.4 4.6 4.6l1.1-1.1-1.7-1-.8.6a3.3 3.3 0 0 1-1.7-1.7l.6-.8-1-1.7z"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r=".5"/>'
  };
  var CHN = { web: 'Web chat', whatsapp: 'WhatsApp', instagram: 'Instagram' };
  function icon(k, size) { size = size || 16; return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (IC[k] || '') + '</svg>'; }
  var TICK = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false"><path class="rw-tk" d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* runs a demo's cycle() in a loop while it is on screen and the tab is visible */
  function runWhenVisible(box, demo) {
    var tok = null, inView = false;
    function start() {
      if (tok || !inView || document.hidden) return;
      var t = tok = mkTok();
      (async function () { try { while (!t.dead) await demo.cycle(t); } catch (e) { if (e !== CANCEL) { try { console.error(e); } catch (_) {} } } })();
    }
    function stop() { if (tok) { tok.stop(); tok = null; demo.final(); } }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; inView ? start() : stop(); }, { rootMargin: '80px 0px' }).observe(box);
    } else { inView = true; start(); }
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  }

  /* =====================================================================
     DEMOS (each returns { cycle(tok), final() }; markup is injected into box)
     ===================================================================== */

  /* a. reads sentences */
  var PAL = ['#0F766E', '#B45309', '#1D4ED8', '#BE185D'];
  var A_S = [
    { ch: 'whatsapp', text: '3bhk indiranagar under 1.5 lakh a month, furnished', parts: [['3bhk', 'bhk', '3 BHK'], ['indiranagar', 'locality', 'Indiranagar'], ['under 1.5 lakh a month', 'budget', '≤ ₹1.5 L / month'], ['furnished', 'furnishing', 'Furnished']] },
    { ch: 'web', text: 'table for 6 sat 8pm, bday', parts: [['table for 6', 'party', 'Party of 6'], ['sat 8pm', 'slot', 'Sat · 8:00 pm'], ['bday', 'occasion', 'Birthday']] },
    { ch: 'instagram', text: 'white sneakers under $150 size 42', parts: [['white sneakers', 'item', 'Sneakers · white'], ['under $150', 'budget', '≤ $150'], ['size 42', 'size', 'EU 42']] }
  ];
  function mkA(box) {
    box.innerHTML = '<div class="rw-d rw-a is-final"><div class="rw-d-bar"><span class="rw-chan"></span><span class="rw-tag">demo</span></div>' +
      '<p class="rw-a-text"></p><p class="rw-a-cap">What the assistant understood</p><ul class="rw-a-chips"></ul></div>';
    var root = box.firstChild, chan = root.querySelector('.rw-chan'), txt = root.querySelector('.rw-a-text'), chips = root.querySelector('.rw-a-chips'), idx = 0;
    function parsed(s) {
      var t = s.text, segs = [];
      s.parts.forEach(function (p, i) { var at = t.indexOf(p[0]); if (at >= 0) segs.push({ a: at, b: at + p[0].length, i: i }); });
      segs.sort(function (x, y) { return x.a - y.a; });
      var out = '', pos = 0;
      segs.forEach(function (g) { out += esc(t.slice(pos, g.a)) + '<mark class="rw-m" style="--c:' + PAL[g.i] + ';--cb:' + rgba(PAL[g.i], 0.2) + ';--md:' + (g.i * 0.16) + 's">' + esc(t.slice(g.a, g.b)) + '</mark>'; pos = g.b; });
      return out + esc(t.slice(pos));
    }
    function chipsHTML(s) { return s.parts.map(function (p, i) { return '<li class="rw-chip" style="--c:' + PAL[i] + ';--cb:' + rgba(PAL[i], 0.09) + ';--d:' + (0.25 + i * 0.16) + 's"><small>' + esc(p[1]) + '</small><b>' + esc(p[2]) + '</b></li>'; }).join(''); }
    function setChan(s) { chan.innerHTML = icon(s.ch, 14) + CHN[s.ch] + ' · customer'; }
    function show(s) { setChan(s); txt.innerHTML = parsed(s); chips.innerHTML = chipsHTML(s); }
    return {
      final: function () { root.classList.remove('is-out'); root.classList.add('is-final'); show(A_S[0]); },
      cycle: async function (T) {
        var s = A_S[idx++ % A_S.length];
        root.classList.remove('is-final', 'is-out'); setChan(s); chips.innerHTML = ''; txt.innerHTML = '<span class="rw-a-t"></span><i class="rw-caret"></i>';
        var tt = txt.firstChild;
        await T.sleep(650);
        for (var n = 1; n <= s.text.length; n++) { tt.textContent = s.text.slice(0, n); await T.sleep(48 + Math.random() * 34); }
        await T.sleep(800);
        txt.innerHTML = parsed(s); chips.innerHTML = chipsHTML(s);
        await T.sleep(30);
        raf(function () { q('.rw-m', txt).forEach(function (m) { m.classList.add('on'); }); q('.rw-chip', chips).forEach(function (c) { c.classList.add('on'); }); });
        await T.sleep(4200);
        root.classList.add('is-out');
        await T.sleep(1100);
      }
    };
  }

  /* b. knows where you are */
  var B_CTX = [
    { id: 'realty', url: 'alderway.example/homes/lakeview-court', title: 'Lakeview Court', meta: '3 BHK · Indiranagar · furnished', price: '₹1.35 L / month', btn: 'Book a visit', hi: 'I can see you’re looking at Lakeview Court. Want to see it this Sunday?', qr: ['Sunday 11 am', 'Ask a question'] },
    { id: 'support', url: 'northlane.example/jackets/harbor', title: 'Harbor Jacket', meta: 'Waxed cotton · Sage', price: '$128', btn: 'Add to bag', hi: 'I can see you’re looking at the Harbor Jacket. Sizes 40 to 46 are in stock. Need help with fit?', qr: ['Size guide', 'Delivery time'] },
    { id: 'clinic', url: 'caldercare.example/book/dental', title: 'Dental check-up', meta: '30 min · Dr Iyer', price: 'Tomorrow 6:30 pm', btn: 'Choose a time', hi: 'Booking a dental check-up? Dr Iyer has 6:30 pm free tomorrow. Shall I hold it?', qr: ['Hold 6:30 pm', 'Other days'] }
  ];
  function mkB(box) {
    box.innerHTML = '<div class="rw-d rw-b is-open"><div class="rw-b-chrome"><i></i><i></i><i></i><span class="rw-b-url"></span></div>' +
      '<div class="rw-b-page"><div class="rw-b-c"><div class="rw-b-img"></div><div><h4 class="rw-b-t"></h4><p class="rw-b-meta"></p><p class="rw-b-price"></p><span class="rw-b-btn"></span><span class="rw-b-ln"></span><span class="rw-b-ln" style="width:70%"></span></div></div>' +
      '<div class="rw-b-chat"><div class="rw-b-panel"><div class="rw-b-ph"><span class="rw-b-mk"></span><div><b></b><small>Assistant · replies in seconds</small></div></div>' +
      '<div class="rw-b-body"><span class="rw-b-dots"><i></i><i></i><i></i></span><div class="rw-b-msg"></div><div class="rw-b-qr"></div></div></div>' +
      '<div class="rw-b-fab">' + icon('web', 20) + '</div></div></div></div>';
    var root = box.firstChild, page = root.querySelector('.rw-b-page'), $ = function (s) { return root.querySelector(s); }, fab = $('.rw-b-fab'), idx = 0;
    var dots = $('.rw-b-dots'), msg = $('.rw-b-msg'), qr = $('.rw-b-qr');
    function apply(c) {
      var b = brand(c.id);
      root.style.setProperty('--b', b.acc); root.style.setProperty('--bi', b.ink); root.style.setProperty('--bt', b.tx || b.acc); root.style.setProperty('--bs', b.soft || '#EEE');
      $('.rw-b-url').textContent = c.url;
      var im = $('.rw-b-img'); im.textContent = b.mark; im.style.fontFamily = b.display;
      $('.rw-b-t').textContent = c.title; $('.rw-b-meta').textContent = c.meta; $('.rw-b-price').textContent = c.price; $('.rw-b-btn').textContent = c.btn;
      $('.rw-b-ph b').textContent = b.name; $('.rw-b-mk').textContent = b.mark;
      msg.textContent = c.hi; qr.innerHTML = c.qr.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('');
    }
    return {
      final: function () { page.classList.remove('is-swap'); root.classList.add('is-open'); apply(B_CTX[1]); dots.classList.remove('show'); msg.classList.add('show'); qr.classList.add('show'); fab.classList.remove('pulse'); },
      cycle: async function (T) {
        var c = B_CTX[idx++ % B_CTX.length];
        root.classList.remove('is-open'); dots.classList.remove('show'); msg.classList.remove('show'); qr.classList.remove('show');
        page.classList.add('is-swap'); await T.sleep(750);
        apply(c); page.classList.remove('is-swap'); await T.sleep(1500);
        fab.classList.remove('pulse'); void fab.offsetWidth; fab.classList.add('pulse'); await T.sleep(900);
        root.classList.add('is-open'); await T.sleep(900);
        dots.classList.add('show'); await T.sleep(1300);
        dots.classList.remove('show'); msg.classList.add('show'); await T.sleep(900);
        qr.classList.add('show'); await T.sleep(4200);
        root.classList.remove('is-open'); await T.sleep(1200);
      }
    };
  }

  /* c. does things (paper) */
  function mkC(box) {
    box.innerHTML = '<div class="rw-d rw-c is-final"><div class="rw-c-hd"><b>Book a visit</b><span>Lakeview Court · demo</span></div>' +
      '<ol class="rw-c-steps">' +
      '<li data-s="slot"><span class="rw-c-dot">' + TICK + '</span><span class="rw-c-k">Slot</span><span class="rw-c-v"><span class="rw-c-opt">Sat 11 am</span><span class="rw-c-opt" data-pick>Sun 11 am</span><span class="rw-c-opt">Sun 12 pm</span></span></li>' +
      '<li data-s="name"><span class="rw-c-dot">' + TICK + '</span><span class="rw-c-k">Name</span><span class="rw-c-v"><span class="rw-c-nm"></span></span></li>' +
      '<li data-s="phone"><span class="rw-c-dot">' + TICK + '</span><span class="rw-c-k">Phone</span><span class="rw-c-v"><span class="rw-c-ph">••••• ••417</span><span class="rw-c-code"><i>4</i><i>8</i><i>2</i><i>0</i><small>demo code</small></span><span class="rw-c-ok">Verified</span></span></li>' +
      '</ol><ul class="rw-c-out">' +
      '<li><span class="rw-c-tick">' + TICK + '</span>Visit booked<em>Sun 11 am</em></li>' +
      '<li><span class="rw-c-tick">' + TICK + '</span>Lead created<em>hot · ₹1.5 L</em></li>' +
      '<li><span class="rw-c-tick">' + TICK + '</span>Reminder queued<em>Sat 6 pm</em></li></ul></div>';
    var root = box.firstChild, steps = q('.rw-c-steps>li', root), opts = q('.rw-c-opt', root), nm = root.querySelector('.rw-c-nm'), codes = q('.rw-c-code i', root), outs = q('.rw-c-out li', root);
    var NAME = 'Meera K.';
    function reset() {
      root.classList.remove('is-final', 'is-out');
      steps.forEach(function (s) { s.classList.remove('on', 'done', 's-code', 's-ok'); });
      opts.forEach(function (o) { o.classList.remove('hov', 'sel', 'press'); });
      outs.forEach(function (o) { o.classList.remove('on'); });
      nm.textContent = ''; codes.forEach(function (c) { c.style.opacity = '0'; });
    }
    return {
      final: function () {
        root.classList.add('is-final'); root.classList.remove('is-out');
        steps.forEach(function (s) { s.classList.remove('on'); s.classList.add('done'); }); steps[2].classList.add('s-ok');
        opts.forEach(function (o) { o.classList.remove('hov', 'press'); o.classList.toggle('sel', o.hasAttribute('data-pick')); });
        outs.forEach(function (o) { o.classList.add('on'); }); nm.textContent = NAME; codes.forEach(function (c) { c.style.opacity = ''; });
      },
      cycle: async function (T) {
        reset(); await T.sleep(900);
        steps[0].classList.add('on'); await T.sleep(1100);
        opts[2].classList.add('hov'); await T.sleep(600); opts[2].classList.remove('hov');
        opts[1].classList.add('hov'); await T.sleep(700); opts[1].classList.add('press'); await T.sleep(220); opts[1].classList.remove('press'); opts[1].classList.add('sel'); await T.sleep(700);
        steps[0].classList.replace('on', 'done'); steps[1].classList.add('on'); await T.sleep(700);
        for (var i = 1; i <= NAME.length; i++) { nm.textContent = NAME.slice(0, i); await T.sleep(110); }
        await T.sleep(600); steps[1].classList.replace('on', 'done'); steps[2].classList.add('on'); await T.sleep(1100);
        steps[2].classList.add('s-code'); for (var k = 0; k < codes.length; k++) { codes[k].style.opacity = '1'; await T.sleep(420); }
        await T.sleep(700); steps[2].classList.remove('s-code'); steps[2].classList.add('s-ok'); steps[2].classList.replace('on', 'done'); await T.sleep(1000);
        for (var j = 0; j < outs.length; j++) { outs[j].classList.add('on'); await T.sleep(750); }
        await T.sleep(4200);
        root.classList.add('is-out'); await T.sleep(1100);
      }
    };
  }

  /* d. FAQ you edit (paper) */
  function mkD(box) {
    box.innerHTML = '<div class="rw-d rw-dd"><div class="rw-d-bar"><span>Admin · FAQ editor</span><span class="rw-tag">demo</span></div><div class="rw-d-cols">' +
      '<div class="rw-d-col"><h4>Answer: delivery</h4><div class="rw-d-field"><span class="rw-d-tx"></span><i class="rw-caret is-off"></i></div><span class="rw-d-save">Save</span></div>' +
      '<div class="rw-d-col rw-d-chat"><h4>Live chat</h4><div class="rw-d-b c">How long is delivery?</div><div class="rw-d-b a"></div><span class="rw-d-up">Updated just now</span></div></div></div>';
    var root = box.firstChild, field = root.querySelector('.rw-d-field'), tx = root.querySelector('.rw-d-tx'), caret = root.querySelector('.rw-caret'), save = root.querySelector('.rw-d-save'), ans = root.querySelector('.rw-d-b.a'), up = root.querySelector('.rw-d-up');
    var OLD = 'Delivery takes 3 to 5 days', NEW = 'Delivery now takes 1 day', KEEP = 'Delivery ';
    function set(t) { tx.textContent = t; ans.textContent = t; }
    function ui(on) { field.classList.toggle('focus', on); caret.classList.toggle('is-off', !on); }
    return {
      final: function () { tx.textContent = NEW; ans.textContent = NEW; ui(false); save.classList.remove('press', 'saved'); save.textContent = 'Saved'; up.classList.add('show'); ans.classList.remove('upd'); },
      cycle: async function (T) {
        tx.textContent = OLD; ans.textContent = OLD; ui(false); save.classList.remove('press', 'saved'); save.textContent = 'Save'; up.classList.remove('show'); ans.classList.remove('upd');
        await T.sleep(1800); ui(true); await T.sleep(800);
        for (var n = OLD.length - 1; n >= KEEP.length; n--) { tx.textContent = OLD.slice(0, n); await T.sleep(48); }
        await T.sleep(300);
        for (var m = 1; m <= NEW.length - KEEP.length; m++) { tx.textContent = NEW.slice(0, KEEP.length + m); await T.sleep(85); }
        await T.sleep(800); ui(false); save.classList.add('press'); await T.sleep(260); save.classList.remove('press'); save.classList.add('saved'); save.textContent = 'Saved';
        await T.sleep(260); ans.textContent = NEW; ans.classList.add('upd'); up.classList.add('show'); await T.sleep(1500); ans.classList.remove('upd');
        await T.sleep(3600);
        up.classList.remove('show'); await T.sleep(800);
      }
    };
  }

  /* e. hands over cleanly */
  function mkE(box) {
    box.innerHTML = '<div class="rw-d rw-e is-col is-join"><div class="rw-d-bar"><span>Conversation · handover</span><span class="rw-tag">demo</span></div>' +
      '<div class="rw-e-stage"><div class="rw-e-tr"><p class="rw-e-m c">Can I contest the fine on this notice? It says 15 days.</p><p class="rw-e-m b">That needs a person. I’m passing you to the team with this whole chat.</p></div>' +
      '<div class="rw-e-sum"><b><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h12M12 7l5 5-5 5M20 5v14"/></svg>Handed over: legal question</b><small>2 messages · priority: normal · 09:05</small></div></div>' +
      '<div class="rw-e-join"><span class="rw-e-av">N</span><div class="rw-e-who"><b>Nora joined</b><small>sees the full history</small></div><span class="rw-e-take">Take over</span></div>' +
      '<p class="rw-e-st"><i></i><span></span></p></div>';
    var root = box.firstChild, take = root.querySelector('.rw-e-take'), st = root.querySelector('.rw-e-st'), stt = st.querySelector('span');
    function done(on) { take.classList.toggle('done', on); take.textContent = on ? 'You have the chat' : 'Take over'; st.classList.toggle('show', on); stt.textContent = 'Nora is replying · customer notified'; }
    return {
      final: function () { root.classList.add('is-final', 'is-col', 'is-join'); take.classList.remove('press'); done(true); },
      cycle: async function (T) {
        root.classList.remove('is-final', 'is-col', 'is-join'); take.classList.remove('press'); done(false);
        await T.sleep(2600); root.classList.add('is-col'); await T.sleep(1600);
        root.classList.add('is-join'); await T.sleep(2200);
        take.classList.add('press'); await T.sleep(260); take.classList.remove('press'); await T.sleep(100); done(true);
        await T.sleep(4200);
        root.classList.remove('is-join'); st.classList.remove('show'); await T.sleep(700); root.classList.remove('is-col'); await T.sleep(1000);
      }
    };
  }

  /* f. records everything */
  var F_LOG = [
    ['23:42:07', 'intent', 'property_search · 3 BHK Indiranagar'], ['23:42:08', 'action', 'shortlist sent · 2 homes'],
    ['23:42:51', 'intent', 'visit_request · Sunday'], ['23:43:20', 'booking', 'visit held · Sun 11:00'],
    ['23:43:22', 'lead', 'created · ₹1.5 L · hot'], ['23:43:22', 'action', 'reminder queued · Sat 18:00'],
    ['23:58:40', 'intent', 'faq · parking'], ['23:58:41', 'action', 'answered from FAQ'],
    ['00:12:09', 'intent', 'handover · legal question'], ['00:12:10', 'action', 'assigned to Nora · CRM'],
    ['09:05:12', 'lead', 'follow-up due · 3 hot leads']
  ];
  var F_COL = { intent: '#1D4ED8', action: '#0F766E', lead: '#B45309', booking: '#BE185D' };
  var F_Y = [30, 28, 31, 22, 25, 17, 20, 12, 15, 9, 13, 6, 10, 5];
  function mkF(box) {
    var pts = F_Y.map(function (y, i) { return [i * (300 / (F_Y.length - 1)), 4 + (y / 31) * 34]; });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
    var last = pts[pts.length - 1];
    box.innerHTML = '<div class="rw-d rw-f"><div class="rw-d-bar"><span class="rw-chan"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h10"/></svg>Event log</span><span class="rw-f-n">events <span class="rw-f-c">0</span></span><span class="rw-tag">demo</span></div>' +
      '<ul class="rw-f-log"></ul><svg class="rw-f-spark" viewBox="0 0 300 44" aria-hidden="true" focusable="false"><path class="base" d="M0 42H300"/><path class="ln" pathLength="1" d="' + d + '"/><circle cx="' + last[0] + '" cy="' + last[1].toFixed(1) + '" r="3"/></svg>' +
      '<div class="rw-f-sl"><span>23:42</span><span>events per minute</span><span>09:05</span></div></div>';
    var root = box.firstChild, log = root.querySelector('.rw-f-log'), cnt = root.querySelector('.rw-f-c'), ln = root.querySelector('.ln'), dot = root.querySelector('circle'), TOTAL = 128;
    function li(e, cls) { var c = F_COL[e[1]]; return '<li class="' + (cls || '') + '"><time>' + e[0] + '</time><b style="--c:' + c + ';--cb:' + rgba(c, 0.1) + '">' + e[1] + '</b><span>' + esc(e[2]) + '</span></li>'; }
    return {
      final: function () { log.innerHTML = F_LOG.slice(-7).map(function (e) { return li(e); }).join(''); cnt.textContent = TOTAL; ln.style.transition = 'none'; ln.style.strokeDasharray = '1'; ln.style.strokeDashoffset = '0'; dot.style.opacity = '1'; },
      cycle: async function (T) {
        log.innerHTML = ''; cnt.textContent = '0'; ln.style.transition = 'none'; ln.style.strokeDasharray = '1'; ln.style.strokeDashoffset = '1'; dot.style.transition = 'none'; dot.style.opacity = '0';
        await T.sleep(700); void ln.getBoundingClientRect();
        var step = 1000, total = F_LOG.length * step;
        ln.style.transition = 'stroke-dashoffset ' + (total + 600) + 'ms linear'; ln.style.strokeDashoffset = '0';
        for (var i = 0; i < F_LOG.length; i++) {
          log.insertAdjacentHTML('beforeend', li(F_LOG[i], 'new'));
          while (log.children.length > 8) log.removeChild(log.firstChild);
          cnt.textContent = Math.round(TOTAL * (i + 1) / F_LOG.length);
          await T.sleep(step);
        }
        dot.style.transition = 'opacity 1s'; dot.style.opacity = '1';
        await T.sleep(4200);
        log.style.transition = 'opacity .8s'; log.style.opacity = '0'; await T.sleep(900); log.style.opacity = ''; log.style.transition = '';
      }
    };
  }

  /* =====================================================================
     MODULE: rows
     ===================================================================== */
  var ROWS = [
    { id: 'a', t: 't1', fs: 'clamp(42px,7.6vw,116px)', pad: 'clamp(80px,10vw,150px)', side: 'r', h: 'It reads <em>sentences.</em>',
      sub: 'Budget, place, size and date, pulled from messy text.',
      sr: 'Demo: a messy message such as \u201C3bhk indiranagar under 1.5 lakh a month, furnished\u201D is typed, then split into labelled parts: 3 BHK, Indiranagar, up to 1.5 lakh a month, furnished.', demo: mkA },
    { id: 'b', t: 't2', fs: 'clamp(42px,8.4vw,128px)', pad: 'clamp(72px,8vw,110px)', side: 'l', h: 'It knows <em>where</em> you are.',
      sub: 'It greets people with the page they are on.',
      sr: 'Demo: a browser window shows a home listing, a jacket and a clinic booking page in turn. A chat opens with a greeting that names the page, for example \u201CI can see you\u2019re looking at the Harbor Jacket\u201D.', demo: mkB },
    { id: 'c', t: 't3', fs: 'clamp(44px,9vw,140px)', pad: 'clamp(90px,11vw,160px)', side: 'r', h: 'It <em>does</em> things.',
      sub: 'Books the visit, creates the lead, queues the reminder.',
      sr: 'Demo: a booking card fills in step by step. A Sunday 11 am slot is chosen, the name Meera K. is entered, a demo code verifies the phone, then three ticks appear: visit booked, lead created, reminder queued.', demo: mkC },
    { id: 'd', t: 't4', fs: 'clamp(42px,7.4vw,112px)', pad: 'clamp(72px,8.5vw,120px)', side: 'l', h: 'Answers from <em>your</em> FAQ.',
      sub: 'Edit one line. Every channel updates.',
      sr: 'Demo: in an admin field the text \u201CDelivery takes 3 to 5 days\u201D is retyped to \u201CDelivery now takes 1 day\u201D. After pressing Save, the chat bubble beside it shows the new answer.', demo: mkD },
    { id: 'e', t: 't5', fs: 'clamp(42px,7.8vw,120px)', pad: 'clamp(90px,10.5vw,150px)', side: 'r', h: 'Hands over, <em>cleanly.</em>',
      sub: 'The teammate sees the whole chat.',
      sr: 'Demo: a chat transcript collapses into a card reading \u201CHanded over: legal question\u201D. Nora joins and sees the full history, then presses Take over.', demo: mkE },
    { id: 'f', t: 't6', fs: 'clamp(42px,8.2vw,124px)', pad: 'clamp(80px,10vw,140px)', side: 'l', h: 'Records <em>everything.</em>',
      sub: 'Every intent, action, lead and booking.',
      sr: 'Demo, simulated data: a live event log streams lines such as intent, action, lead and booking, with a small sparkline of events per minute.', demo: mkF }
  ];

  window.OrbitSections.rows = {
    mount: function (el, ctx) {
      ctx = ctx || {};
      var G = ctx.gsap || window.gsap, ST = ctx.ST || window.ScrollTrigger;
      var animated = !!(ctx.animated && !ctx.reduce && G && ST);
      var idx = el.getAttribute('data-index') || '04', name = el.getAttribute('data-name') || 'What it does';
      el.classList.add('rw');
      el.setAttribute('aria-labelledby', 'rw-title');
      el.innerHTML = '<div class="rw-wrap"><h2 class="rw-lab" id="rw-title"><b>' + esc(idx) + '</b> ' + esc(name) + '</h2></div>' +
        ROWS.map(function (r, i) {
          return '<article class="rw-row ' + r.t + '" data-r="' + r.id + '" data-side="' + r.side + '" style="--pad:' + r.pad + '"><div class="rw-wrap rw-in"><span class="rw-rule"></span>' +
            '<div class="rw-txt"><p class="rw-idx"><b>' + String(i + 1).padStart(2, '0') + '</b> / 06</p><h3 class="rw-stmt" style="--fs:' + r.fs + '">' + r.h + '</h3><p class="rw-sub">' + r.sub + '</p></div>' +
            '<div class="rw-demo"><div class="rw-demo-in" aria-hidden="true" style="width:100%;display:grid;justify-items:center"></div><p class="rw-sr">' + esc(r.sr) + '</p></div></div></article>';
        }).join('');

      var demos = ROWS.map(function (r) {
        var box = el.querySelector('[data-r="' + r.id + '"] .rw-demo-in');
        var demo = r.demo(box, ctx);
        demo.final();
        return { box: box, demo: demo };
      });

      if (!animated) return;
      demos.forEach(function (d) { runWhenVisible(d.box, d.demo); });

      /* choreography */
      var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
      q('.rw-stmt', el).forEach(function (h) { h.classList.add('is-pre'); });
      q('.rw-row', el).forEach(function (row) {
        var rule = row.querySelector('.rw-rule'), trig = { trigger: row, start: 'top 82%', once: true };
        if (rule) G.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: 'expo.out', scrollTrigger: trig });
        var idxEl = row.querySelector('.rw-idx'), sub = row.querySelector('.rw-sub'), demo = row.querySelector('.rw-demo-in');
        if (idxEl) G.from(idxEl, { y: 16, autoAlpha: 0, duration: 1.1, ease: 'power4.out', scrollTrigger: { trigger: row, start: 'top 78%', once: true } });
        if (sub) G.from(sub, { y: 28, autoAlpha: 0, duration: 1.3, ease: 'power4.out', delay: 0.35, scrollTrigger: { trigger: row, start: 'top 72%', once: true } });
        if (demo) G.from(demo, { y: 56, autoAlpha: 0, duration: 1.5, ease: 'expo.out', delay: 0.15, scrollTrigger: { trigger: row, start: 'top 72%', once: true } });
      });
      fontsReady.then(function () {
        q('.rw-stmt', el).forEach(function (h) {
          var fallback = function () { h.classList.remove('is-pre'); G.from(h, { y: 40, autoAlpha: 0, duration: 1.3, ease: 'power4.out', scrollTrigger: { trigger: h, start: 'top 88%', once: true } }); };
          var SP = window.SplitText;
          if (!SP) return fallback();
          try {
            SP.create(h, {
              type: 'lines', mask: 'lines', linesClass: 'rw-line', autoSplit: true,
              onSplit: function (self) {
                h.classList.remove('is-pre');
                return G.from(self.lines, { yPercent: 112, duration: 1.4, ease: 'power4.out', stagger: 0.1, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
              }
            });
          } catch (e) { fallback(); }
        });
        try { ST.refresh(); } catch (e) {}
      });
    }
  };

  /* =====================================================================
     MODULE: results
     ===================================================================== */
  var HOURS = [6, 4, 3, 2, 2, 3, 5, 9, 16, 16, 20, 22, 18, 16, 14, 16, 20, 24, 52, 66, 78, 84, 62, 30];
  var SNIP = [['realty', 0], ['support', 0], ['dining', 0], ['build', 0], ['salon', 0], ['clinic', 0], ['realty', 1], ['support', 1], ['salon', 1], ['dining', 1], ['clinic', 1], ['build', 1]];

  window.OrbitSections.results = {
    mount: function (el, ctx) {
      ctx = ctx || {};
      var G = ctx.gsap || window.gsap, ST = ctx.ST || window.ScrollTrigger;
      var animated = !!(ctx.animated && !ctx.reduce && G && ST);
      var idx = el.getAttribute('data-index') || '05', name = el.getAttribute('data-name') || 'The numbers';
      el.classList.add('rs');
      el.setAttribute('aria-labelledby', 'rs-title');

      function fig(cls, valHTML, sr, title) {
        return '<article class="rs-fig ' + cls + '"><span class="rs-rule"></span><div class="rs-fh"><span class="rs-demo">Demo</span></div>' +
          '<p class="rs-v"><span class="rs-sr">' + sr + '</span><span aria-hidden="true" class="rs-vv">' + valHTML + '</span></p><h3 class="rs-ft">' + title + '</h3></article>';
      }
      var items = SNIP.map(function (s) {
        var b = brand(s[0]), m = (b.msgs || [])[s[1]]; if (!m) return '';
        return '<li class="rs-it"><i style="background:' + b.acc + '"></i><span class="rs-sr">' + CHN[m.ch] + ', ' + esc(b.short) + ': </span>' + icon(m.ch, 16) + '<span class="rs-q">' + esc(m.msg) + '</span></li>';
      }).join('');

      el.innerHTML =
        '<div class="rs-wrap"><h2 class="rs-lab" id="rs-title"><b>' + esc(idx) + '</b> ' + esc(name) + '</h2>' +
        '<div class="rs-lead"><span class="rs-rule"></span>' +
        '<p class="rs-big"><span class="rs-sr">85 percent</span><span class="rs-bn" aria-hidden="true">85</span><span class="pc" aria-hidden="true">%</span></p>' +
        '<div class="rs-lt"><p class="rs-claim">of chats finished <em>without</em> a human agent</p><p class="rs-src"><i></i>from a live real-estate deployment</p></div></div>' +
        '<div class="rs-bar" aria-hidden="true"><span class="rs-bar-f"></span></div>' +
        '<div class="rs-figs">' +
        fig('rs-f1', '11<small>s</small>', '11 seconds', 'median first reply') +
        fig('rs-f2', '62<small>%</small>', '62 percent', 'of chats start after 6 pm') +
        fig('rs-f3', '1 in 4', '1 in 4', 'become a lead or booking') +
        '</div>' +
        '<figure class="rs-chart" role="img" aria-label="Chart, demo data: conversations by hour of day. Volume is lowest overnight, dips through the working day and peaks between 8 and 10 pm, inside the after-hours bands."><span class="rs-rule"></span>' +
        '<div class="rs-ch-h"><h3>Conversations by hour</h3><span class="rs-demo">Demo</span></div>' +
        '<div class="rs-ch-box" aria-hidden="true"><div class="rs-band b1"><span>after hours</span></div><div class="rs-band b2"><span>after hours</span></div><svg><path class="rs-line" pathLength="1" d=""/></svg><i class="rs-pt-v"></i><i class="rs-pt"></i><span class="rs-pt-l">11:42 pm \u00B7 one message</span></div>' +
        '<div class="rs-ax" aria-hidden="true"><span>00</span><span style="left:25%">06</span><span style="left:37.5%">09</span><span style="left:50%">12</span><span style="left:75%">18</span><span style="left:100%">24</span></div></figure></div>' +
        '<div class="rs-mq" role="group" aria-label="Real message snippets from the six example businesses"><div class="rs-mq-in"><button type="button" class="rs-pause" aria-pressed="false" aria-label="Pause the scrolling messages">' +
        '<svg class="ps" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><rect x="7" y="5" width="3.4" height="14" rx="1"/><rect x="13.6" y="5" width="3.4" height="14" rx="1"/></svg><svg class="pl" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg></button>' +
        '<div class="rs-mq-view"><div class="rs-mq-track"><ul class="rs-set">' + items + '</ul><ul class="rs-set" aria-hidden="true">' + items + '</ul></div></div></div></div>' +
        '<div class="rs-wrap"><p class="rs-note">Everything marked demo is illustrative.</p></div>';

      var $ = function (s) { return el.querySelector(s); };

      /* chart geometry in real pixels so strokes stay uniform */
      var box = $('.rs-ch-box'), svg = box.querySelector('svg'), path = box.querySelector('.rs-line'), pt = box.querySelector('.rs-pt'), ptv = box.querySelector('.rs-pt-v'), ptl = box.querySelector('.rs-pt-l'), maxH = 84;
      function drawChart() {
        var W = box.clientWidth, H = box.clientHeight; if (!W || !H) return;
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        var P = [[0, HOURS[0]]].concat(HOURS.map(function (v, h) { return [h + 0.5, v]; }), [[24, HOURS[23]]]).map(function (p) { return [p[0] / 24 * W, H - 12 - (p[1] / maxH) * (H - 44)]; });
        var d = 'M' + P[0][0].toFixed(1) + ' ' + P[0][1].toFixed(1);
        for (var i = 0; i < P.length - 1; i++) {
          var p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
          d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
        }
        path.setAttribute('d', d);
        var t = 23.7, a = P[24], b = P[25], k = (t - 23.5) / 0.5, x = t / 24 * W, y = a[1] + (b[1] - a[1]) * k;
        pt.style.left = x + 'px'; pt.style.top = y + 'px'; ptl.style.left = x + 'px'; ptv.style.left = x + 'px'; ptv.style.top = y + 'px';
      }
      drawChart();
      if ('ResizeObserver' in window) new ResizeObserver(drawChart).observe(box); else window.addEventListener('resize', drawChart);
      path.style.strokeDasharray = '1';

      /* marquee */
      var mq = $('.rs-mq'), pause = $('.rs-pause');
      if (!animated) { mq.classList.add('is-static'); }
      else {
        var paused = false;
        pause.addEventListener('click', function () { paused = !paused; mq.classList.toggle('is-paused', paused); pause.setAttribute('aria-pressed', String(paused)); pause.setAttribute('aria-label', paused ? 'Play the scrolling messages' : 'Pause the scrolling messages'); });
        if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { mq.classList.toggle('is-off', !es[0].isIntersecting); }, { rootMargin: '100px 0px' }).observe(mq);
      }
      if (!animated) { path.style.strokeDashoffset = '0'; return; }

      /* choreography */
      function count(node, to, dur, start, once) {
        var o = { v: 0 }; node.firstChild.textContent = '0';
        G.to(o, { v: to, duration: dur, ease: 'power4.out', scrollTrigger: { trigger: start, start: 'top 80%', once: true }, onUpdate: function () { node.firstChild.textContent = String(Math.round(o.v)); }, onComplete: function () { node.firstChild.textContent = String(to); } });
      }
      var lead = $('.rs-lead');
      G.fromTo(lead.querySelector('.rs-rule'), { scaleX: 0 }, { scaleX: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: lead, start: 'top 85%', once: true } });
      count($('.rs-bn'), 85, 2.4, lead);
      G.from($('.rs-big .pc'), { autoAlpha: 0, x: -20, duration: 1.4, ease: 'expo.out', delay: 0.5, scrollTrigger: { trigger: lead, start: 'top 80%', once: true } });
      G.from(lead.querySelectorAll('.rs-claim,.rs-src'), { y: 36, autoAlpha: 0, duration: 1.3, ease: 'power4.out', stagger: 0.15, delay: 0.4, scrollTrigger: { trigger: lead, start: 'top 78%', once: true } });
      G.fromTo($('.rs-bar-f'), { scaleX: 0 }, { scaleX: 1, duration: 2.2, ease: 'expo.out', scrollTrigger: { trigger: $('.rs-bar'), start: 'top 92%', once: true } });

      q('.rs-fig', el).forEach(function (f) {
        var tr = { trigger: f, start: 'top 82%', once: true };
        G.fromTo(f.querySelector('.rs-rule'), { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: 'expo.out', scrollTrigger: tr });
        G.from(f.querySelectorAll('.rs-fh,.rs-v,.rs-ft'), { y: 44, autoAlpha: 0, duration: 1.4, ease: 'power4.out', stagger: 0.1, scrollTrigger: tr });
      });
      var v1 = $('.rs-f1 .rs-vv'), v2 = $('.rs-f2 .rs-vv');
      count(v1, 11, 1.8, $('.rs-f1')); count(v2, 62, 2.2, $('.rs-f2'));

      var ch = $('.rs-chart'), trc = { trigger: ch, start: 'top 80%', once: true };
      G.fromTo(ch.querySelector('.rs-rule'), { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: 'expo.out', scrollTrigger: trc });
      G.fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.8, ease: 'expo.inOut', scrollTrigger: trc });
      G.from(ch.querySelectorAll('.rs-band'), { autoAlpha: 0, duration: 1.6, ease: 'power2.out', stagger: 0.25, scrollTrigger: trc });
      G.from([pt, ptl, ptv], { autoAlpha: 0, duration: 1, delay: 2.2, ease: 'power3.out', scrollTrigger: trc });
      G.from(ch.querySelectorAll('.rs-ch-h,.rs-ax,.rs-ch-n'), { y: 20, autoAlpha: 0, duration: 1.2, ease: 'power4.out', stagger: 0.12, scrollTrigger: trc });
      G.from(mq, { autoAlpha: 0, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: mq, start: 'top 92%', once: true } });
    }
  };
})();
