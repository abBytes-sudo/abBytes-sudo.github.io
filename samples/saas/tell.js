/* Orbit Assistants: "Tell it your business". The hero composer reads "a dental clinic in Pune" and the page answers in
   its own product: the headline, the accent, the scripted chat in the hero, the trade cards, then (through the
   'orbit:trade' event) the live assistant, the example questions, the read meter, the night shift and the brief.
     window.OrbitTell.current()   { id, noun, city, generic } or null
     window.OrbitTell.set(id)     pick a trade without typing
   Remembered for the session. */
(function () {
  'use strict';
  var d = document, TR = window.OrbitTrades, U = window.OrbitUI, Br = window.OrbitBrands;
  if (!TR || !U) return;
  var reduce = U.reduce, KEY = 'orbit-trade';
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || d).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var ARROW = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  var CHN = { web: 'Web chat', whatsapp: 'WhatsApp', instagram: 'Instagram' };
  var cur = null, playT = [];

  /* ---------- the six trade cards ---------- */
  function cards() {
    var ul = $('#trGrid'); if (!ul) return;
    ul.innerHTML = TR.order.map(function (id) {
      var t = TR.byId[id], c = t.color, b = Br && Br.byId[t.agent], m = b && b.msgs ? b.msgs[0] : { msg: t.questions[0], reply: '' };
      return '<li><a class="tr" href="' + t.page + '" data-t="' + id + '" style="--c:' + c.acc + ';--cs:' + c.soft + ';--ct:' + c.tx + '">' +
        '<span class="tr-h"><i aria-hidden="true"></i><b>' + esc(t.label) + '</b><small>' + esc(t.biz) + '</small><em class="tr-you">Yours</em></span>' +
        '<span class="tr-th"><span class="bub c">' + esc(m.msg) + '</span><span class="bub a">' + esc(m.reply) + '</span></span>' +
        '<span class="tr-f">Open the ' + esc(t.label.toLowerCase()) + ' page ' + ARROW + '</span></a></li>';
    }).join('');
  }

  /* ---------- the scripted chat in the hero ---------- */
  function thread(t, play) {
    var log = $('#hpLog'); if (!log) return; var s = t.story;
    playT.forEach(clearTimeout); playT = [];
    $('#hpAv').textContent = t.mark; $('#hpName').textContent = t.id === 'front' ? (cur && cur.title ? cur.title : 'Your business') : t.biz; $('#hpCh').textContent = (CHN[s.ch] || 'Chat') + ' · online';
    $('#heroPhone').setAttribute('aria-label', 'A ' + (CHN[s.ch] || 'chat') + ' conversation at 11:42 pm. The customer writes: ' + s.m1 + ' The assistant replies: ' + s.r1 + ' Then: ' + s.r2);
    var items = [
      '<p class="bub c">' + esc(s.m1) + '<span class="ts">11:42 pm</span></p>',
      '<p class="bub a">' + esc(s.r1) + '<span class="ts">11:42 pm</span></p>',
      '<div class="hp-card"><b>' + esc(s.card.title) + '</b><small>' + esc(s.card.meta) + '</small><strong>' + esc(s.card.price) + '</strong></div>',
      '<p class="bub c">' + esc(s.m2) + '<span class="ts">11:43 pm</span></p>',
      '<p class="bub a">' + esc(s.r2) + '<span class="ts">11:43 pm</span></p>',
      '<div class="hp-bk"><svg width="18" height="18" aria-hidden="true"><use href="#i-check"/></svg><span><b>' + esc(s.booking.h) + ' · ' + esc(s.booking.day) + ', ' + esc(s.booking.time) + '</b><small>' + esc(s.booking.where) + ' · ' + esc(s.booking.ref) + '</small></span></div>'
    ];
    if (!play || reduce) { log.innerHTML = items.join(''); return; }
    log.innerHTML = '';
    var at = 250, who = [0, 1, 1, 0, 1, 1];
    items.forEach(function (h, i) {
      if (who[i] && (i === 1 || i === 4)) { playT.push(setTimeout(function () { log.insertAdjacentHTML('beforeend', '<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>'); }, at)); at += 650; }
      playT.push(setTimeout(function () { var dt = log.querySelector('.dots'); if (dt) dt.remove(); log.insertAdjacentHTML('beforeend', h); var el = log.lastElementChild; el.classList.add('in'); log.scrollTop = log.scrollHeight; }, at));
      at += who[i] ? 420 : 700;
    });
  }

  /* ---------- swapping a block with a short cross-fade ---------- */
  function swap(el, fn) {
    if (!el) { fn(); return; }
    if (reduce) { fn(); return; }
    el.classList.add('is-swap'); setTimeout(function () { fn(); el.classList.remove('is-swap'); }, 300);
  }

  function say(html, buttons) {
    var log = $('#tellLog'); if (!log) return;
    var old = log.querySelector('.tl-a'); if (old) old.remove();
    log.insertAdjacentHTML('beforeend', '<div class="tl-a"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span></div>');
    var box = log.lastElementChild;
    setTimeout(function () {
      box.innerHTML = '<p class="bub a">' + html + '</p>' + (buttons ? '<div class="chips tl-acts">' + buttons + '</div>' : '');
      var ch = box.querySelector('.tl-change'); if (ch) ch.addEventListener('click', function () { var i = $('#tellIn'); i.value = ''; i.focus(); log.innerHTML = ''; });
      var tr = box.querySelector('.tl-try'); if (tr) tr.addEventListener('click', function (e) { var t = d.getElementById('try'); if (!t) return; e.preventDefault(); if (window.Motion && Motion.lenis) Motion.lenis.scrollTo(t, { offset: -70 }); else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });
    }, reduce ? 0 : 520);
  }

  function apply(res, opt) {
    opt = opt || {}; var t = TR.byId[res.id]; if (!t) return;
    var title = res.generic ? 'Your ' + (res.city ? res.city + ' ' : '') + res.noun : t.biz;
    cur = { id: res.id, noun: res.noun || t.noun, city: res.city || '', generic: !!res.generic, title: title };
    try { sessionStorage.setItem(KEY, JSON.stringify(cur)); } catch (e) {}
    /* colour first, so everything below changes in it */
    U.applyColors(t.color);
    if (Br && Br.byId[t.agent]) Br.set(t.agent);
    swap($('#heroH'), function () { $('#heroHh').textContent = TR.headline(t, cur.city, cur.noun); });
    swap($('#heroSub'), function () { $('#heroSub').textContent = t.sub; });
    swap($('#heroPhone'), function () { thread(t, opt.animate !== false); });
    $$('#tellChips .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-t') === res.id)); });
    $$('#trGrid .tr').forEach(function (a) { a.classList.toggle('is-you', a.getAttribute('data-t') === res.id); });
    var pill = $('#forPill'); if (pill) { pill.hidden = false; pill.textContent = 'for ' + (res.generic ? 'your ' + cur.noun : t.plural); pill.href = t.page || '#trades'; }
    if (opt.reply) {
      var what = cur.noun + (cur.city ? ' in ' + cur.city : '');
      if (res.generic) say('Got it: a ' + esc(what) + '. There’s no ready-made ' + esc(cur.noun) + ' assistant, so the page now shows a front-desk one that books, answers and hands over. The six trade pages are below.', '<a class="chip tl-try" href="#try">Try your assistant</a><button type="button" class="chip tl-change">Change</button>');
      else say('Got it: a ' + esc(what) + '. The page is yours now: your headline, your ' + esc(t.people) + '’ questions, your night shift and a live ' + esc(t.label.toLowerCase()) + ' assistant below.', '<a class="chip tl-try" href="#try">Try the ' + esc(t.label.toLowerCase()) + ' assistant</a><a class="chip" href="' + t.page + '">Open the ' + esc(t.label.toLowerCase()) + ' page</a><button type="button" class="chip tl-change">Change</button>');
    }
    try { d.dispatchEvent(new CustomEvent('orbit:trade', { detail: { id: res.id, trade: t, noun: cur.noun, city: cur.city, generic: cur.generic, title: title } })); } catch (e) {}
  }

  function boot() {
    cards();
    var form = $('#tellForm'), inp = $('#tellIn');
    if (inp && window.matchMedia) { var mq = matchMedia('(max-width: 480px)'), ph = inp.placeholder, fit = function () { inp.placeholder = mq.matches ? 'What do you run?' : ph; }; fit(); if (mq.addEventListener) mq.addEventListener('change', fit); }
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault(); var v = inp.value.replace(/\s+/g, ' ').trim(); if (!v) { inp.focus(); return; }
      var log = $('#tellLog'); log.innerHTML = '<div class="tl-c"><p class="bub c">' + esc(v) + '</p></div>';
      var res = TR.classify(v);
      if (!res) { say('I didn’t catch the kind of business. Try “a salon in Pune” or “we run a bakery”, or tap one below.'); inp.value = ''; return; }
      setTimeout(function () { apply(res, { reply: true }); }, reduce ? 0 : 380);
      inp.value = '';
    });
    $$('#tellChips .chip').forEach(function (c) { c.addEventListener('click', function () { var id = c.getAttribute('data-t'), t = TR.byId[id]; $('#tellLog').innerHTML = ''; apply({ id: id, noun: t.noun, city: '', generic: false }, { reply: true }); }); });
    var saved = null; try { saved = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (saved && TR.byId[saved.id]) apply(saved, { animate: false });
  }
  window.OrbitTell = { current: function () { return cur; }, set: function (id) { var t = TR.byId[id]; if (t) apply({ id: id, noun: t.noun, city: '', generic: false }, { reply: false }); } };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})();
