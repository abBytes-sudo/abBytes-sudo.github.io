/* Orbit Assistants: "Watch it read, key by key". A wide input with a live meter above it. On every key the partial
   sentence goes through the same parsing the assistants use (Hinglish first becomes English the engine reads), and
   the meter lights up: intent, date, time, how many, budget and language, each with a confidence bar.
   Then a dare: three misses and it hands you to a person. Needs the engine (window.Orbit), which saas.js loads. */
(function () {
  'use strict';
  var d = document, TR = window.OrbitTrades, U = window.OrbitUI;
  var box = d.getElementById('meter'); if (!box || !TR) return;
  var reduce = U && U.reduce;
  function $(s) { return box.querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var SLOTS = [['intent', 'What they want'], ['date', 'Day'], ['time', 'Time'], ['qty', 'How many'], ['money', 'Budget'], ['lang', 'Language']];
  var AGENTS = ['dining', 'clinic', 'salon', 'realty', 'build', 'support'];
  var BIZ = { dining: 'Restaurant', clinic: 'Clinic', salon: 'Salon', realty: 'Real estate', build: 'Construction', support: 'Online store', front: 'Front desk' };
  /* what the sentence carries counts too: a BHK is property, an order number is a shop, a party is a table */
  var BOOST = {
    realty: function (bhk, area, party, oid, money) { return bhk ? 3 : 0; },
    build: function (bhk, area) { return area && !bhk ? 2 : 0; },
    dining: function (bhk, area, party) { return party && party > 1 && !bhk ? 1 : 0; },
    support: function (bhk, area, party, oid) { return oid ? 3 : 0; }
  };
  var sessions = {}, ready = false, demoT = [], typedByHand = false, score = { ok: 0, miss: 0 }, strikes = [], lastRead = null;

  box.innerHTML =
    '<div class="mt-meter" id="mtMeter" role="group" aria-label="What the assistant understood">' + SLOTS.map(function (s) {
      return '<div class="mt-s" data-k="' + s[0] + '"><small>' + s[1] + '</small><b>…</b><i class="mt-bar" aria-hidden="true"><span></span></i></div>';
    }).join('') + '</div>' +
    '<form class="mt-in" id="mtForm" autocomplete="off"><label class="sr" for="mtIn">Type a message the way a customer would</label><input id="mtIn" type="text" maxlength="140" placeholder="kal subah 11 baje table for 6" enterkeyhint="send" disabled><button type="submit" class="btn" disabled>Send it</button></form>' +
    '<p class="mt-read" id="mtRead" aria-live="polite"></p>' +
    '<div class="mt-dare"><p><b>Try to confuse it.</b> Three misses and it hands you to a person.</p><p class="mt-score" id="mtScore" aria-live="polite"><span class="mt-k">Understood <b>0</b></span><span class="mt-k">Missed <b>0</b></span><span class="mt-dots" role="img" aria-label="0 of 3 misses"><i></i><i></i><i></i></span></p></div>' +
    '<div class="mt-out" id="mtOut" aria-live="polite"></div>';
  var inp = $('#mtIn'), btn = $('.mt-in button');

  function pref() { var c = window.OrbitTell && OrbitTell.current(); return c ? TR.byId[c.id] : null; }
  function sess(id) { var O = window.Orbit; if (!O || !O.agents[id]) return null; if (!sessions[id]) { try { sessions[id] = O.createSession(id, { silent: true }); } catch (e) { return null; } } return sessions[id]; }
  function dayName(dt) { var t = new Date(); t.setHours(0, 0, 0, 0); var n = Math.round((dt - t) / 864e5); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === 2 ? 'Day after tomorrow' : window.Orbit.fmtDay(dt); }

  var BOOK = { dining: 'table', clinic: 'book', salon: 'book', realty: 'book_visit', build: 'site_visit', front: 'book' };
  function bookOf(id) {
    var a = window.Orbit && Orbit.agents[id], k = BOOK[id]; if (!a || !k) return null;
    var it = (a.intents || []).filter(function (x) { return x.id === k; })[0];
    return it ? it.label || it.id : null;
  }
  function read(text) {
    var O = window.Orbit, h = TR.hinglish(text), norm = h.lang === 'Hinglish' ? h.text : text, N = O.nlp;
    var w = N.when(norm) || {}, party = N.party(norm), bhk = N.bhk(norm), area = N.area(norm), money = N.money(norm), oid = N.orderId(norm);
    var p = pref(), pa = p ? p.agent : null, list = pa && AGENTS.indexOf(pa) < 0 ? [pa].concat(AGENTS) : AGENTS, best = null, human = false;
    list.forEach(function (id) {
      var s = sess(id); if (!s) return; var mt; try { mt = s._match(norm); } catch (e) { return; }
      if (mt.global && mt.global.id === '_human' && mt.gscore >= 3) human = true;
      if (mt.intent && mt.score >= 2.5) { var sc = mt.score + (id === pa ? .75 : 0) + (BOOST[id] ? BOOST[id](bhk, area, party, oid, money) : 0); if (!best || sc > best.sc) best = { id: id, label: mt.intent.label || mt.intent.id, sc: sc, raw: mt.score }; }
      else if (O.kb && O.kb.match) { var kb = O.kb.match(id, norm, O.agents[id].synonyms); if (kb && kb.score >= 3.2 && (!best || kb.score + .5 > best.sc)) best = { id: id, label: 'FAQ: ' + kb.entry.q.replace(/\?$/, ''), sc: kb.score + (id === pa ? .5 : 0), raw: kb.score }; }
    });
    if (human) best = { id: pa || 'front', label: 'Talk to a person', sc: 9, raw: 9 };
    /* no intent word, but a day or time (and maybe a head count): the assistants treat that as a booking, so the meter does too */
    if ((!best || (party && /^FAQ: /.test(best.label))) && (w.date || w.time || w.part || w.timeAmbiguous)) {
      var fid = party && (!pa || pa === 'dining') ? 'dining' : pa, lb = fid && bookOf(fid);
      if (lb) best = { id: fid, label: lb, sc: 3, raw: party ? 4.5 : 3.5 };
    }
    var out = { text: text, norm: norm, lang: h.lang, hits: h.hits, intent: best };
    if (w.date) out.date = { v: dayName(w.date) + (Math.abs(w.date - new Date()) > 2.5 * 864e5 ? '' : ' · ' + O.fmtDay(w.date)), c: 1 };
    if (w.time) out.time = { v: O.fmtTime(w.time), c: 1 };
    else if (w.part) out.time = { v: w.part.charAt(0).toUpperCase() + w.part.slice(1) + ', time to confirm', c: .5 };
    else if (w.timeAmbiguous) out.time = { v: w.timeAmbiguous + ' o’clock, am or pm?', c: .45 };
    var q = party ? party + (party === 1 ? ' person' : ' people') : bhk ? bhk + ' BHK' : area ? area + ' sq ft' : '';
    if (!q) { var m = norm.match(/\b(\d{1,3})\s*(x\s*)?(jackets?|shirts?|pairs?|items?|haircuts?|facials?|tables?|rooms?|plots?|flats?|sessions?|tickets?|kg|boxes?|pieces?)\b/i); if (m) q = m[1] + ' ' + m[3]; }
    if (q) out.qty = { v: q, c: 1 };
    if (money && (money.max || money.min)) { var cur = money.currency === '$' ? '$' : '₹'; out.money = { v: (money.min && money.max ? O.money(money.min, cur) + ' to ' + O.money(money.max, cur) : money.max ? 'up to ' + O.money(money.max, cur) : 'from ' + O.money(money.min, cur)), c: 1 }; }
    else if (oid) out.money = { v: 'Order ' + oid, c: 1 };
    return out;
  }

  function paint(r) {
    lastRead = r;
    function set(k, v, c, sub) {
      var el = box.querySelector('.mt-s[data-k="' + k + '"]'), b = el.querySelector('b'), was = b.textContent, nv = v || '…';
      if (k === 'money') el.querySelector('small').textContent = r && r.money && /^Order /.test(r.money.v) ? 'Order' : 'Budget';
      b.textContent = nv; el.classList.toggle('on', !!v); el.style.setProperty('--c', String(v ? Math.max(.08, c) : 0));
      if (v && was !== nv) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
      if (sub != null) el.setAttribute('data-sub', sub); else el.removeAttribute('data-sub');
    }
    if (!r || !r.text.trim()) { SLOTS.forEach(function (s) { set(s[0], '', 0); }); $('#mtRead').textContent = ''; return; }
    var i = r.intent;
    set('intent', i ? i.label : (r.text.trim().split(/\s+/).length >= 3 ? 'Not sure yet' : ''), i ? Math.min(1, i.raw / 8) : 0, i ? BIZ[i.id] : null);
    set('date', r.date && r.date.v, r.date && r.date.c); set('time', r.time && r.time.v, r.time && r.time.c); set('qty', r.qty && r.qty.v, 1); set('money', r.money && r.money.v, 1);
    set('lang', r.lang + (r.lang === 'Hinglish' ? ' · ' + r.hits + ' words' : ''), r.lang === 'Hinglish' ? Math.min(1, .3 + r.hits / 6) : .9);
    $('#mtRead').innerHTML = r.lang === 'Hinglish' ? 'It reads this as: <code>' + esc(r.norm) + '</code>' : '';
  }

  var rq = 0;
  function onInput() { if (!ready) return; if (rq) cancelAnimationFrame(rq); rq = requestAnimationFrame(function () { rq = 0; paint(read(inp.value)); }); }

  function scorePaint() {
    var s = $('#mtScore'); s.querySelectorAll('.mt-k b')[0].textContent = score.ok; s.querySelectorAll('.mt-k b')[1].textContent = score.miss;
    var dots = s.querySelectorAll('.mt-dots i'); for (var i = 0; i < 3; i++) dots[i].classList.toggle('on', i < strikes.length);
    s.querySelector('.mt-dots').setAttribute('aria-label', strikes.length + ' of 3 misses');
  }
  function submit(e) {
    if (e) e.preventDefault(); var v = inp.value.replace(/\s+/g, ' ').trim(); if (!v || !ready) return;
    stopDemo(); var r = read(v), out = $('#mtOut'), p = pref(), staff = p ? p.staff : { name: 'Nora', role: 'front desk' };
    paint(r);
    if (r.intent) {
      score.ok++; strikes = [];
      var parts = [r.date && r.date.v, r.time && r.time.v, r.qty && r.qty.v, r.money && r.money.v].filter(Boolean);
      out.innerHTML = '<div class="mt-r ok"><p class="bub c">' + esc(v) + '</p><p class="bub a"><b>Understood.</b> ' + esc(r.intent.label) + (parts.length ? ', with ' + esc(parts.join(', ')) : '') + '. ' + (r.intent.label === 'Talk to a person' ? 'A person joins with the chat attached.' : 'It would carry on from here without asking again.') + '</p></div>';
    } else {
      score.miss++; strikes.push(v);
      if (strikes.length >= 3) {
        out.innerHTML = '<div class="mt-hand"><p class="mt-hh">Three misses. It hands you to a person.</p><p class="bub a">I’m passing you to <b>' + esc(staff.name) + '</b> at the ' + esc(staff.role) + ', with everything you wrote, so you won’t need to repeat it.</p><ul class="mt-miss">' + strikes.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul><button type="button" class="btn ghost sm" id="mtAgain">Start again</button></div>';
        out.querySelector('#mtAgain').addEventListener('click', function () { strikes = []; out.innerHTML = ''; scorePaint(); inp.focus(); });
      } else out.innerHTML = '<div class="mt-r"><p class="bub c">' + esc(v) + '</p><p class="bub a">Sorry, I didn’t get that. It would ask you to say it another way, and offer the menu. <span class="mt-left">' + (3 - strikes.length) + ' more ' + (3 - strikes.length === 1 ? 'miss' : 'misses') + ' and a person takes over.</span></p></div>';
    }
    scorePaint(); inp.value = ''; paint(null);
  }

  /* the opening: it types one sentence itself, key by key */
  function stopDemo() { demoT.forEach(clearTimeout); demoT = []; box.classList.remove('is-demo'); }
  function demo() {
    if (typedByHand || !ready) return; stopDemo();
    var p = pref(), s = (p && p.meter) || TR.byId.restaurant.meter;
    inp.value = ''; paint(null); box.classList.add('is-demo');
    if (reduce) { inp.value = s; paint(read(s)); box.classList.remove('is-demo'); return; }
    var at = 400;
    for (var i = 1; i <= s.length; i++) (function (n) { demoT.push(setTimeout(function () { if (typedByHand) return; inp.value = s.slice(0, n); paint(read(inp.value)); }, at)); at += 55 + (s.charAt(n - 1) === ' ' ? 70 : 0); })(i);
    demoT.push(setTimeout(function () { box.classList.remove('is-demo'); inp.placeholder = 'Your turn. Type like your customers do'; }, at + 300));
  }

  function enable() {
    if (ready || !window.Orbit || !Orbit.nlp) return; ready = true;
    inp.disabled = false; btn.disabled = false; box.classList.add('is-ready');
    inp.addEventListener('input', function (e) { if (e.isTrusted) { typedByHand = true; stopDemo(); } onInput(); });
    inp.addEventListener('focus', function () { if (box.classList.contains('is-demo')) { typedByHand = true; stopDemo(); inp.value = ''; paint(null); } });
    $('#mtForm').addEventListener('submit', submit);
    if (seen) demo();
  }
  var seen = false;
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && !seen) { seen = true; io.disconnect(); if (window.OrbitEngine) OrbitEngine.load(); if (ready) demo(); } }); }, { threshold: .35 });
    io.observe(box);
  } else seen = true;
  d.addEventListener('orbit:engine', enable);
  d.addEventListener('orbit:trade', function () { sessions = {}; if (ready && !typedByHand && seen) demo(); else if (ready && inp.value) onInput(); });
  if (window.Orbit && Orbit.nlp) enable();
  window.OrbitMeter = { read: function (t) { return ready ? read(t) : null; } };
})();
