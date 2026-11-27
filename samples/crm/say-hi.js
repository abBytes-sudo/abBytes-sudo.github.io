/* Say hi. Watch the CRM react.
   A small, honest reader for English and Hinglish enquiries (keywords and a few patterns, no network),
   a four-step panel (read, score, route, clock) and a WhatsApp-style thread. Nothing runs until the visitor does something. */
(function () {
  'use strict';

  // ---- reading the message -----------------------------------------------------------------
  var NEEDS = [
    { k: 'cafe', re: /\b(caf[eé]s?|restaurants?)\b/i, label: 'Café fit-out', noun: 'café fit-out' },
    { k: 'office', re: /\b(offices?|fit-?outs?|work-?stations?|\d+\s*seats?|seats)\b/i, label: 'Office fit-out', noun: 'office fit-out' },
    { k: 'home', re: /\b(full[- ]home|full[- ]interiors?|full[- ]flat|flat ka interior|home interiors?|poora ghar)\b/i, label: 'Full-home interiors', noun: 'full-home interior', top: 1 },
    { k: 'kitchen', re: /\b(modular[- ]kitchens?|kitchens?|modular|rasoi)\b/i, label: 'Modular kitchen', noun: 'modular kitchen', top: 1 },
    { k: 'wardrobe', re: /\b(wardrobes?|almirah|almari|closets?)\b/i, label: 'Wardrobes', noun: 'wardrobe job', top: 1 },
    { k: 'ceiling', re: /\bfalse[- ]ceilings?\b/i, label: 'False ceiling', noun: 'false-ceiling job' },
    { k: 'paint', re: /\b(painting|paint|polish|polishing)\b/i, label: 'Painting and polish', noun: 'painting job' },
    { k: 'living', re: /\b(living[- ]room|drawing[- ]room|lounge)\b/i, label: 'Living room', noun: 'living-room makeover' },
    { k: 'kids', re: /\b(kids?'?s?[- ]room|nursery)\b/i, label: 'Kids room', noun: 'kids-room design' },
    { k: 'home', re: /\b\d(?:\.\d)?\s*-?\s*bhk\b/i, label: 'Full-home interiors', noun: 'full-home interior', top: 1 }
  ];
  var CITIES = [
    ['greater noida', 'Greater Noida', 1], ['noida', 'Noida', 1], ['gurgaon|gurugram|gurgram', 'Gurgaon', 1],
    ['faridabad', 'Faridabad', 1], ['ghaziabad', 'Ghaziabad', 1], ['indirapuram', 'Indirapuram', 1], ['okhla', 'Okhla', 1],
    ['saket', 'Saket', 1], ['dwarka', 'Dwarka', 1], ['rohini', 'Rohini', 1], ['vasant kunj', 'Vasant Kunj', 1],
    ['vasant vihar', 'Vasant Vihar', 1], ['lajpat nagar', 'Lajpat Nagar', 1], ['hauz khas', 'Hauz Khas', 1],
    ['greater kailash', 'Greater Kailash', 1], ['janakpuri', 'Janakpuri', 1], ['pitampura', 'Pitampura', 1],
    ['mayur vihar', 'Mayur Vihar', 1], ['punjabi bagh', 'Punjabi Bagh', 1], ['new delhi|delhi', 'Delhi', 1],
    ['mumbai|bombay', 'Mumbai', 0], ['pune', 'Pune', 0], ['bengaluru|bangalore', 'Bengaluru', 0], ['jaipur', 'Jaipur', 0], ['lucknow', 'Lucknow', 0]
  ].map(function (c) { return { re: new RegExp('\\b(?:' + c[0] + ')\\b', 'i'), label: c[1], served: c[2] }; });
  var PRE = '(?:(?:around|approx\\.?|approximately|about|budget(?: of| is)?|under|upto|up to)\\s+)?';
  var BUD = [
    { re: new RegExp(PRE + '(\\d+(?:\\.\\d+)?)\\s*(?:crores?|cr)\\b(?:\\s+tak)?', 'i'), m: 1e7 },
    { re: new RegExp(PRE + '(\\d+(?:\\.\\d+)?)\\s*(?:lakhs?|lacs?|lks?|l)\\b(?:\\s+tak)?', 'i'), m: 1e5 },
    { re: new RegExp(PRE + '(\\d+(?:\\.\\d+)?)\\s*k\\b(?:\\s+tak)?', 'i'), m: 1e3 },
    { re: new RegExp(PRE + '(?:₹|rs\\.?|inr)\\s*(\\d[\\d,]*(?:\\.\\d+)?)(?:\\s+tak)?', 'i'), m: 1, comma: 1 },
    { re: new RegExp(PRE + '\\b(\\d{1,2},\\d{2},\\d{3})\\b(?:\\s+tak)?', 'i'), m: 1, comma: 1 }
  ];
  var TIMING = /\b(this month|next month|this week|next week|kal|aaj|jaldi|urgent(?:ly)?|asap|tomorrow|abhi|immediately|parso|diwali)\b/i;
  var HINGLISH = /\b(ka|ki|ke|hai|hain|karwana|karna|karni|mein|chahiye|chahie|mujhe|humko|hume|ghar|batao|kitna|kitne|lagega|banwana|banwani|aur|nahi|haan|theek|subah|shaam|baje|namaste|kal|aaj|jaldi|tak)\b/i;
  var NAMEQ = /(?:\b[Ii] am|\b[Ii]'m|\b[Tt]his is|\b[Mm]era naam|\b[Mm]y name is)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/;
  var SLOT_CLOCK = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje)\b/i;
  var SLOT_AT = /\bat\s+(\d{1,2})(?::(\d{2}))?\b/i;
  var SLOT_DAY = /\b(?:(tomorrow|kal)\s+)?(morning|evening|afternoon|subah|shaam|dopahar)\b/i;
  var YES = /^\s*(yes|yeah|yep|ok|okay|sure|haan|han|theek hai|thik hai|done|works|sounds good)\b/i;

  function nb(s) { return s.replace(' ', '\u00A0'); }
  function trimN(x) { return String(Math.round(x * 100) / 100); }
  function money(n) { return n >= 1e7 ? '₹' + trimN(n / 1e7) + ' Cr' : n >= 1e5 ? '₹' + trimN(n / 1e5) + ' L' : '₹' + trimN(n / 1e3) + ' K'; }

  // read one message. `replied`: a reply is already in the thread, so a bare "yes" or "evening" can pick a slot.
  function read(text, replied, offered) {
    var out = { ranges: [], need: null, city: null, budget: 0, timing: '', name: '', slot: null, hing: HINGLISH.test(text) }, m, i;
    function add(m0, kind) { if (m0 && m0[0]) out.ranges.push({ s: m0.index, e: m0.index + m0[0].length, k: kind }); }
    var blank = text;
    for (i = 0; i < BUD.length && !out.budget; i++) {
      m = BUD[i].re.exec(text);
      if (m) {
        var v = parseFloat(String(m[1]).replace(/,/g, '')) * BUD[i].m;
        if (v >= 5000) { out.budget = Math.round(v); add(m, 'budget'); blank = text.slice(0, m.index) + new Array(m[0].length + 1).join(' ') + text.slice(m.index + m[0].length); }
      }
    }
    for (i = 0; i < NEEDS.length && !out.need; i++) {
      m = NEEDS[i].re.exec(text);
      if (m) {
        var n = NEEDS[i], bhk = /\b(\d(?:\.\d)?)\s*-?\s*bhk\b/i.exec(text);
        out.need = { k: n.k, label: n.label, noun: n.noun, top: n.top };
        if (n.k === 'home' && bhk) { var b = bhk[1] + ' BHK'; out.need.label += ' ' + b; out.need.noun = b + ' ' + n.noun; if (bhk.index !== m.index) add(bhk, 'need'); }
        add(m, 'need');
      }
    }
    var best = null;
    CITIES.forEach(function (c) { var mm = c.re.exec(text); if (mm && (!best || mm.index < best.m.index || (mm.index === best.m.index && mm[0].length > best.m[0].length))) best = { c: c, m: mm }; });
    if (best) { out.city = { label: best.c.label, served: best.c.served }; add(best.m, 'city'); }
    m = TIMING.exec(text); if (m) { out.timing = m[1].toLowerCase(); add(m, 'timing'); }
    m = NAMEQ.exec(text);
    if (m && !CITIES.some(function (c) { return c.re.test(m[1]); }) && !NEEDS.some(function (x) { return x.re.test(m[1]); })) out.name = m[1];
    // a time for the call
    if ((m = SLOT_CLOCK.exec(blank))) {
      var suf = m[3].toLowerCase(); out.slot = { text: m[1] + (m[2] ? ':' + m[2] : '') + (suf === 'baje' ? ' baje' : ' ' + suf), on: true };
    } else if ((m = SLOT_AT.exec(blank)) && +m[1] >= 1 && +m[1] <= 12) {
      var h = +m[1]; out.slot = { text: h + (m[2] ? ':' + m[2] : '') + (h >= 8 && h <= 11 ? ' am' : ' pm'), on: true };
    } else if ((m = SLOT_DAY.exec(blank)) && (m[1] || replied)) {
      out.slot = { text: (m[1] ? 'tomorrow ' : 'today ') + m[2].toLowerCase(), on: false };
    } else if (replied && YES.test(text)) {
      out.slot = { text: offered || '4 pm', on: true };
    }
    if (out.slot) out.slot.phrase = out.slot.on ? 'at ' + out.slot.text : out.slot.text;
    // drop overlaps
    out.ranges.sort(function (a, b) { return a.s - b.s; });
    var keep = []; out.ranges.forEach(function (r) { if (!keep.length || r.s >= keep[keep.length - 1].e) keep.push(r); }); out.ranges = keep;
    return out;
  }

  // ---- scoring and routing -------------------------------------------------------------------
  function score(st) {
    var rows = [];
    if (st.budget) { rows.push(['Budget stated', 20]); if (st.budget >= 800000) rows.push(['Budget of ₹8 L or more', 10]); } else rows.push(['No budget yet', -10]);
    if (st.city) rows.push(st.city.served ? [st.city.label + ', we serve it', 10] : ['Outside our cities (' + st.city.label + ')', -15]); else rows.push(['No city yet', -5]);
    if (st.need) {
      if (st.need.top) rows.push([(st.need.k === 'kitchen' ? 'Kitchen is' : st.need.k === 'wardrobe' ? 'Wardrobes are' : 'Full-home interiors are') + ' in our top three jobs', 15]);
      else rows.push([st.need.k === 'office' ? 'Office fit-out is a job we take' : 'We take this job', st.need.k === 'office' ? 10 : 5]);
    } else rows.push(['No job named yet', -5]);
    if (st.timing) rows.push(['Timing named (' + st.timing + ')', 10]);
    rows.push(['Asked on WhatsApp', 10]); rows.push(['Replied to inside 15 minutes', 10]);
    var sum = rows.reduce(function (a, r) { return a + r[1]; }, 0);
    return { rows: rows, total: Math.max(0, Math.min(100, sum)) };
  }
  function route(st) {
    if (st.need && st.need.k === 'office') return { who: 'Isha Bedi', first: 'Isha', ini: 'IB', rule: 'Offices go to Isha Bedi' };
    if (st.need && st.need.k === 'kitchen' && st.city && /^(Noida|Greater Noida)$/.test(st.city.label)) return { who: 'Meera Joshi', first: 'Meera', ini: 'MJ', rule: 'Kitchens in Noida go to Meera' };
    return { who: 'Meera Joshi', first: 'Meera', ini: 'MJ', rule: 'Round-robin: Meera is next' };
  }
  function band(t) { return t >= 70 ? ['Hot', 'hot'] : t >= 40 ? ['Warm', 'warm'] : ['Cold', 'cold']; }

  // ---- replies -------------------------------------------------------------------------------------
  var OFFER = 'Can I call you at 4 pm today, or would tomorrow morning suit?';
  function ask(st) {
    if (!st.need) return 'Which job is it: a kitchen, wardrobes, a full home or an office?';
    if (!st.city) return 'Which area is the site in?';
    if (!st.budget) return 'Roughly what budget do you have in mind? A range is fine.';
    return '';
  }
  function reply(st, d, first, closing, rt) {
    if (closing) return 'Thanks. ' + rt.first + ' will call you shortly.';
    var understood = st.need || st.city || st.budget || st.timing;
    if (first) {
      var s = 'Hi! ' + rt.first + ' here from Lumen Homes. ';
      if (!understood) return s + 'What are you planning: a kitchen, wardrobes, a full home or an office?';
      var noun = st.need ? st.need.noun : 'project', art = /^[aeiou]/i.test(noun) ? 'An ' : 'A ';
      s += art + noun + (st.city ? ' in ' + st.city.label : '') + (st.budget ? ' around ' + nb(money(st.budget)) : '') + ' is very doable. ';
      if (st.city && !st.city.served) s += 'We mainly work across Delhi NCR, so I will check ' + st.city.label + ' with the team. ';
      return s + (st.slot ? 'Done, I will call you ' + st.slot.phrase + '.' : OFFER);
    }
    var acks = [];
    if (d.name) acks.push('Nice to meet you, ' + st.name + '.');
    if (d.need || d.city || d.budget) acks.push('Got it: ' + (st.need ? st.need.noun : 'project') + (st.city ? ' in ' + st.city.label : '') + (st.budget ? ', around ' + nb(money(st.budget)) : '') + '.');
    if (d.timing && !acks.length) acks.push('Noted, ' + st.timing + '.');
    if (d.slot) return 'Done. ' + rt.first + ' will call you ' + st.slot.phrase + '. ' + (ask(st) || 'Anything else to tell us before then?');
    var q = ask(st) || (st.slot ? 'Anything else you would like us to know before the call?' : OFFER);
    return (acks.join(' ') || 'Noted.') + ' ' + q;
  }

  // ---- the page ---------------------------------------------------------------------------------
  function go() {
    var $ = function (id) { return document.getElementById(id); };
    var log = $('hi-log'), form = $('hi-form'), inp = $('hi-in'), send = $('hi-send'), steps = $('hi-steps'), openBtn = $('hi-open'), hint = $('hi-hint'), done = $('hi-done');
    if (!log || !form || !inp) return;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var S = { need: null, city: null, budget: 0, timing: '', name: '', slot: null, hing: false, first: '', msgs: 0, replied: false, noAdd: 0, offered: '4 pm', total: 0, reasons: [], rt: route({}), t: 11 * 60 + 2 };
    var busy = false, timers = [], clockT = 0;
    var TICK = '<svg class="tk" viewBox="0 0 17 10" aria-hidden="true"><path d="M1 5.5 4 8.5 10.5 1.5M6.5 8.5 7 9 15.5 1.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
    function fmtT(m) { var h = Math.floor(m / 60), mm = m % 60; return (h % 12 || 12) + ':' + (mm < 10 ? '0' : '') + mm + (h >= 12 ? ' pm' : ' am'); }
    function toEnd() { log.scrollTop = log.scrollHeight; }
    function bubble(cls, text, min) {
      var b = el('div', 'hb ' + cls), p = el('p', '', text), t = el('time'); t.appendChild(document.createTextNode(fmtT(min)));
      if (cls === 'out') t.insertAdjacentHTML('beforeend', TICK);
      b.appendChild(p); b.appendChild(t); log.appendChild(b); toEnd(); return b;
    }
    function card(n) { return $('hs' + n); }
    function out(n) { return card(n).querySelector('.hs-out'); }
    function setOn(n) { var c = card(n); c.classList.remove('done'); c.classList.remove('on'); void c.offsetWidth; c.classList.add('on'); out(n).hidden = false; }
    function setDone(n) { var c = card(n); c.classList.remove('on'); c.classList.add('done'); }

    // 1: read
    function renderRead(text, rd, delta) {
      var o = out(1); o.textContent = '';
      var say = el('p', 'hs-say'), pos = 0;
      rd.ranges.forEach(function (r) { if (r.s > pos) say.appendChild(document.createTextNode(text.slice(pos, r.s))); say.appendChild(el('mark', '', text.slice(r.s, r.e))); pos = r.e; });
      if (pos < text.length) say.appendChild(document.createTextNode(text.slice(pos)));
      var wrap = el('p', 'hs-say'); wrap.appendChild(document.createTextNode('“')); while (say.firstChild) wrap.appendChild(say.firstChild); wrap.appendChild(document.createTextNode('”'));
      o.appendChild(wrap);
      if (!(S.need || S.city || S.budget || S.timing)) { var nn = el('p', 'hs-none', 'Nothing to file yet'); nn.appendChild(el('small', '', 'A job, a place or a budget is enough to start.')); o.appendChild(nn); }
      else if (!delta) { var n2 = el('p', 'hs-none', 'Nothing new to file'); o.appendChild(n2); }
      var f = el('div', 'hs-fields');
      function chip(k, v, miss) { f.appendChild(v ? el('span', 'fchip', k + ': ' + v) : el('span', 'fchip no', '+ ' + miss)); }
      chip('Need', S.need && S.need.label, 'Need'); chip('City', S.city && S.city.label, 'City'); chip('Budget', S.budget && money(S.budget), 'Budget');
      if (S.timing) chip('Timing', S.timing, 'Timing');
      chip('Language', S.hing ? 'Hinglish' : 'English', 'Language');
      o.appendChild(f);
    }
    // 2: score (rows add one at a time, the number ticks up to the total)
    var shown = 0;
    function renderScore(sc, animate) {
      var o = out(2); o.textContent = '';
      var g = el('div', 'hs-score'), num = el('div', 'hs-num'), nv = el('span', '', String(animate ? shown : sc.total)); nv.setAttribute('aria-hidden', 'true');
      num.appendChild(nv); num.appendChild(el('small', '', 'out of 100'));
      var ul = el('ul', 'hs-rows'); g.appendChild(num); g.appendChild(ul); o.appendChild(g);
      var tag = card(2).querySelector('.hs-tag'), b = band(sc.total);
      function addRow(r) { var li = el('li', r[1] < 0 ? 'neg' : '', r[0]); li.appendChild(el('b', '', (r[1] < 0 ? '−' : '+') + Math.abs(r[1]))); ul.appendChild(li); }
      function fin() { nv.textContent = sc.total; shown = sc.total; tag.hidden = false; tag.className = 'hs-tag ' + b[1]; tag.textContent = b[0]; num.appendChild(el('span', 'vh', 'Score ' + sc.total + ' out of 100, ' + b[0] + '.')); }
      if (!animate) { sc.rows.forEach(addRow); fin(); return; }
      tag.hidden = true;
      var n = sc.rows.length, from = shown, t0 = performance.now(), dur = 440;
      sc.rows.forEach(function (r, i) { later(function () { addRow(r); }, Math.round(i * dur / n)); });
      (function tick(now) { var p = Math.min(1, (now - t0) / dur); nv.textContent = Math.round(from + (sc.total - from) * p); if (p < 1) requestAnimationFrame(tick); else fin(); })(t0);
    }
    // 3: route
    function renderRoute(rt) {
      var o = out(3); o.textContent = '';
      var w = el('div', 'hs-who'), d = el('span', 'hs-disc', rt.ini), t = el('div'); d.setAttribute('aria-hidden', 'true');
      t.appendChild(el('b', '', 'Routed to ' + rt.who)); t.appendChild(el('small', '', rt.rule)); w.appendChild(d); w.appendChild(t); o.appendChild(w);
    }
    // 4: the clock
    var secs = 43;
    function clockMarkup() {
      var o = out(4); o.textContent = '';
      var w = el('div', 'hs-clock'), tm = el('span', 'hs-time', '15:00'), cap = el('span', 'hs-cap', 'first reply due, target 15:00'); tm.id = 'hi-time'; cap.id = 'hi-cap';
      w.appendChild(tm); w.appendChild(cap); o.appendChild(w);
      var ln = el('div', 'hs-line'), i = el('i'); i.id = 'hi-ln'; ln.appendChild(i); o.appendChild(ln); ln.setAttribute('aria-hidden', 'true');
    }
    function startClock() {
      clockMarkup(); card(4).classList.remove('stopped'); var t0 = performance.now(), tm = $('hi-time'), ln = $('hi-ln');
      clockT = setInterval(function () { var left = Math.max(0, 900 - (performance.now() - t0) / 1000), m = Math.floor(left / 60), s = Math.ceil(left % 60); if (s === 60) { m++; s = 0; } tm.textContent = m + ':' + (s < 10 ? '0' : '') + s; ln.style.transform = 'scaleX(' + (left / 900) + ')'; }, 100);
    }
    function stopClock() {
      clearInterval(clockT); clockT = 0; if (!$('hi-time')) clockMarkup();
      var c = card(4); c.classList.add('stopped'); $('hi-time').textContent = 'First reply in 0:' + secs + ' \u00B7 target 15:00'; $('hi-cap').textContent = ''; $('hi-ln').style.transform = 'scaleX(1)';
      card(4).classList.add('done'); out(4).hidden = false;
    }

    function open(first) { if (first) { openBtn.disabled = false; hint.hidden = true; } }

    function sendText(text) {
      text = (text || '').replace(/\s+/g, ' ').trim(); if (!text || busy) return;
      busy = true; send.setAttribute('aria-disabled', 'true');
      var first = !S.msgs, before = { need: S.need && S.need.label, city: S.city && S.city.label, budget: S.budget, timing: S.timing, name: S.name, slot: S.slot && S.slot.phrase };
      var rd = read(text, S.replied, S.offered);
      if (rd.need) S.need = rd.need; if (rd.city) S.city = rd.city; if (rd.budget) S.budget = rd.budget; if (rd.timing) S.timing = rd.timing; if (rd.name) S.name = rd.name; if (rd.slot) S.slot = rd.slot;
      if (rd.hing) S.hing = true;
      var d = { need: !!(S.need && S.need.label !== before.need), city: !!(S.city && S.city.label !== before.city), budget: S.budget !== before.budget, timing: S.timing !== before.timing, name: S.name !== before.name, slot: !!(S.slot && S.slot.phrase !== before.slot) };
      var delta = d.need || d.city || d.budget || d.timing || d.name || d.slot;
      if (!delta) S.noAdd++;
      var closing = S.noAdd >= 3;
      var sc = score(S), rt = route(S); S.total = sc.total; S.reasons = sc.rows; S.rt = rt;
      if (!S.msgs) S.first = text; S.msgs++;
      var mine = bubble('out', text, S.t); inp.value = '';
      var rmin = S.t + 1, rtext = reply(S, d, first, closing, rt); secs = 40 + (text.length % 10);
      open(first); steps.setAttribute('aria-busy', 'true');
      function land() {
        var ty = log.querySelector('.typing'); if (ty) ty.remove();
        bubble('in', rtext, rmin); S.t = rmin; S.replied = true;
        if (first) stopClock();
        mine.querySelector('.tk').classList.add('read');
        steps.setAttribute('aria-busy', 'false'); busy = false; send.removeAttribute('aria-disabled');
        if (closing) {
          form.hidden = true; done.textContent = rt.first + ' will call you. You can still open the lead.'; done.hidden = false; done.tabIndex = -1; done.focus({ preventScroll: true });
        }
      }
      if (reduce) {
        card(1).querySelector('.hs-out').hidden = false;
        renderRead(text, rd, delta); renderScore(sc, false); renderRoute(rt);
        if (first) { clockMarkup(); } [1, 2, 3, 4].forEach(function (n) { out(n).hidden = false; setDone(n); });
        land(); return;
      }
      var STEP = first ? 500 : 420;
      setOn(1); renderRead(text, rd, delta);
      later(function () { setDone(1); setOn(2); renderScore(sc, true); }, STEP);
      later(function () { setDone(2); setOn(3); renderRoute(rt); }, STEP * 2);
      later(function () { setDone(3); setOn(4); if (first) startClock(); }, STEP * 3);
      later(function () { setDone(4); { var ty = el('div', 'hb in typing'); ty.setAttribute('aria-hidden', 'true'); ty.appendChild(el('i')); ty.appendChild(el('i')); ty.appendChild(el('i')); log.appendChild(ty); toEnd(); mine.querySelector('.tk').classList.add('read'); } }, STEP * 4);
      later(land, STEP * 4 + 1100);
    }

    form.addEventListener('submit', function (e) { e.preventDefault(); sendText(inp.value); inp.focus({ preventScroll: true }); });
    Array.prototype.forEach.call(document.querySelectorAll('.hi-chip'), function (b) { b.addEventListener('click', function () { sendText(b.textContent); }); });
    inp.addEventListener('focus', function () { document.body.classList.add('hi-focus'); });
    inp.addEventListener('blur', function () { document.body.classList.remove('hi-focus'); });

    // hand the lead to the app: one key, then go
    function payload() {
      var rt = S.rt, owner = rt.first;
      return { name: S.name || 'Kunal Saini', message: S.first, need: S.need ? S.need.label : '', city: S.city ? S.city.label : '', budget: S.budget || 0, score: S.total, reasons: S.reasons.map(function (r) { return [r[0], r[1]]; }), owner: owner, at: new Date().toISOString() };
    }
    openBtn.addEventListener('click', function () {
      if (openBtn.disabled || !S.msgs) return;
      try { localStorage.setItem('lumen-crm-hi', JSON.stringify(payload())); } catch (e) { }
      location.href = 'index.html#/inbox';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
