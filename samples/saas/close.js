/* Orbit Assistants: closing sections. Defines window.OrbitSections.packages, .faq and .brief.
   Each mount(el, ctx) fills its placeholder <section>. Styles live in close.css (.pk- / .fq- / .br-).
   Optional data-index on the placeholder sets the section number shown in the label. */
(function () {
  'use strict';
  var OS = window.OrbitSections = window.OrbitSections || {};
  var CONTACT = '../../index.html#contact';
  var ARROW = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false"><path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6"/></svg>';

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function qa(root, sel) { return [].slice.call(root.querySelectorAll(sel)); }
  /* heading as masked lines: [{t:'html'}] -> block spans, joined by spaces so assistive tech reads words apart */
  function lines(prefix, arr) { return arr.map(function (l) { return '<span class="' + prefix + '-ln"><span class="' + prefix + '-li">' + l + '</span></span>'; }).join(' '); }
  function isStatic(ctx) { return !ctx || !ctx.gsap || !ctx.animated || ctx.reduce; }
  function revealLines(ctx, root, prefix, trigger) {
    if (isStatic(ctx)) return;
    ctx.gsap.from(qa(root, '.' + prefix + '-li'), { yPercent: 118, duration: 1.4, ease: 'power4.out', stagger: 0.13,
      scrollTrigger: { trigger: trigger || root, start: 'top 86%', once: true } });
  }

  /* ========================================================= PACKAGES */
  var PACKS = [
    { n: '01', name: 'Starter', sum: 'One channel, scripted.', cls: '', cta: 'Ask for a quote', primary: false, tl: 'Build time, estimate', time: 'about a week',
      items: [['Channel', 'web chat or WhatsApp'], ['Flows', 'up to three, plus a FAQ'], ['Leads', 'saved to a simple list'], ['Handover', 'by notification']] },
    { n: '02', name: 'Pro', sum: 'Every channel, with a team console.', cls: ' is-pro', cta: 'I’ll build this for you', primary: true, stamp: true, tl: 'Build time, estimate', time: '2 to 4 weeks',
      items: [['Channels', 'web chat, WhatsApp, Instagram'], ['Team side', 'CRM assistant'], ['Connected', 'your catalogue, calendar or CRM'], ['Console', 'one-tap takeover'], ['Insight', 'analytics, editable FAQ']] },
    { n: '03', name: 'Smart replies', sum: 'An optional AI layer.', cls: '', cta: 'Talk it through', primary: false, tl: 'Timing', time: 'added to Pro',
      items: [['Layer', 'AI behind the scripts'], ['Understands', 'looser messages'], ['Answers', 'only from approved content'], ['Backend', 'small, holds the keys'], ['Fallback', 'always a person']] }
  ];

  OS.packages = { mount: function (el, ctx) {
    var idx = el.getAttribute('data-index') || '07';
    var stat = isStatic(ctx);
    el.classList.add('pk'); if (stat) el.classList.add('is-static');
    var cards = PACKS.map(function (p) {
      var items = p.items.map(function (r) { return '<li><span class="pk-k">' + esc(r[0]) + '</span><span class="pk-sr">: </span><i class="pk-dots" aria-hidden="true"></i><span class="pk-v">' + esc(r[1]) + '</span></li>'; }).join('');
      return '<li class="pk-slot' + p.cls + '"><article class="pk-rc" aria-labelledby="pk-n' + p.n + '">' +
        '<div class="pk-paper pk-body">' +
          '<div class="pk-top"><span>Orbit · scope slip</span><span>Nº ' + p.n + '</span></div>' +
          (p.stamp ? '<div class="pk-stamp"><b>RECOMMENDED</b></div>' : '') +
          '<h3 class="pk-name" id="pk-n' + p.n + '">' + esc(p.name) + '</h3>' +
          '<p class="pk-sum">' + esc(p.sum) + '</p><hr class="pk-rule">' +
          '<p class="pk-time"><small>' + esc(p.tl) + '</small><strong>' + esc(p.time) + '</strong></p>' +
          '<button type="button" class="pk-tog" aria-expanded="false" aria-controls="pk-m' + p.n + '"><span>See scope</span><span class="pk-plus" aria-hidden="true"></span></button>' +
          '<div class="pk-more" id="pk-m' + p.n + '"><div><ul class="pk-items">' + items + '</ul></div></div>' +
        '</div>' +
        '<div class="pk-paper pk-stub">' +
          '<p class="pk-fixed">Fixed scope · quote after one call</p>' +
          '<a class="pk-btn' + (p.primary ? ' is-primary' : '') + '" href="' + CONTACT + '"' + (p.primary ? ' data-magnetic' : '') + ' aria-label="' + esc(p.cta) + ', ' + esc(p.name) + ' package"><span>' + esc(p.cta) + '</span>' + ARROW + '</a>' +
        '</div>' +
      '</article></li>';
    }).join('');
    el.innerHTML =
      '<div class="pk-wrap">' +
        '<div class="pk-head">' +
          '<p class="pk-lab"><b>' + esc(idx) + '</b>Packages</p>' +
          '<h2 class="pk-h">' + lines('pk', ['Scope on paper,', 'price after <em>one call.</em>']) + '</h2>' +
          '<p class="pk-note">No price list. Timings are estimates.</p>' +
        '</div>' +
        '<ul class="pk-row">' + cards + '</ul>' +
      '</div>';
    qa(el, '.pk-tog').forEach(function (b) {
      var more = document.getElementById(b.getAttribute('aria-controls')), lab = b.firstChild;
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', String(on)); more.classList.toggle('is-open', on); lab.textContent = on ? 'Hide scope' : 'See scope';
      });
    });
    revealLines(ctx, el, 'pk', el.querySelector('.pk-h'));
    if (stat) return;
    var G = ctx.gsap, row = el.querySelector('.pk-row'), rcs = qa(el, '.pk-rc'), stamp = el.querySelector('.pk-stamp');
    G.set(rcs, { clipPath: 'inset(0 0 100% 0)', y: 36 });
    if (stamp) G.set(stamp, { autoAlpha: 0 });
    var tl = G.timeline({ scrollTrigger: { trigger: row, start: 'top 82%', once: true } });
    tl.to(rcs, { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 1.7, ease: 'expo.out', stagger: 0.22, clearProps: 'clipPath,transform' }, 0);
    if (stamp) tl.fromTo(stamp, { scale: 1.8, rotation: -26, autoAlpha: 0 }, { scale: 1, rotation: -11, autoAlpha: 0.94, duration: 0.9, ease: 'power4.out' }, 1.15);
  } };

  /* ========================================================= FAQ */
  var QS = [
    ['Is this AI?', 'No: it\u2019s scripted and rule-based. An optional Smart replies add-on brings AI and needs a small backend. Demo data stays in your browser.'],
    ['What if it doesn\u2019t know the answer?', 'It asks to rephrase, then offers a person. Three misses always hand over to your team.'],
    ['Does it work on WhatsApp and Instagram?', 'Yes, with your real business accounts. Pro connects both; Starter covers one channel.'],
    ['Can my team take over a chat?', 'Yes. One tap in the agent console, with the full history in view.'],
    ['Who builds and maintains it?', 'Abhishek builds it and tunes it with you. Then your team edits the FAQ without a developer.']
  ];

  OS.faq = { mount: function (el, ctx) {
    var idx = el.getAttribute('data-index') || '08';
    var stat = isStatic(ctx), G = ctx.gsap;
    el.classList.add('fq-sec');
    var items = QS.map(function (q, i) {
      return '<div class="fq-item" data-i="' + i + '">' +
        '<h3 class="fq-q"><button type="button" class="fq-btn" id="fq-b' + i + '" aria-expanded="false" aria-controls="fq-p' + i + '"><span>' + esc(q[0]) + '</span><span class="fq-plus" aria-hidden="true"></span></button></h3>' +
        '<div class="fq-a" id="fq-p' + i + '" role="region" aria-labelledby="fq-b' + i + '" aria-live="polite" aria-busy="false" hidden>' +
          '<div class="fq-row"><span class="fq-av" aria-hidden="true"></span><div class="fq-col">' +
            '<div class="fq-wait" aria-hidden="true"><i></i><i></i><i></i></div>' +
            '<div class="fq-bub"><p class="fq-txt"><span class="fq-on">' + esc(q[1]) + '</span><span class="fq-off"></span></p></div>' +
          '</div></div>' +
        '</div></div>';
    }).join('');
    el.innerHTML =
      '<div class="fq-wrap"><div class="fq-grid">' +
        '<div class="fq-side">' +
          '<p class="fq-lab"><b>' + esc(idx) + '</b>FAQ</p>' +
          '<h2 class="fq-h">' + lines('fq', ['Go on,', '<em>ask.</em>']) + '</h2>' +
          '<p class="fq-lede">Tap a question.</p>' +
        '</div>' +
        '<div class="fq-thread">' + items + '</div>' +
      '</div></div>';
    revealLines(ctx, el, 'fq', el.querySelector('.fq-h'));

    var S = qa(el, '.fq-item').map(function (item, i) {
      return { item: item, btn: item.querySelector('.fq-btn'), panel: item.querySelector('.fq-a'), on: item.querySelector('.fq-on'), off: item.querySelector('.fq-off'), text: QS[i][1], open: false, seen: false, timer: 0, raf: 0, pending: false };
    });

    function finish(it) {
      clearTimeout(it.timer); cancelAnimationFrame(it.raf); it.pending = false;
      it.on.textContent = it.text; it.off.textContent = '';
      it.panel.classList.remove('is-wait', 'is-type'); it.panel.setAttribute('aria-busy', 'false');
    }
    function startType(it, quick) {
      it.pending = false;
      var p = it.panel, h1 = p.offsetHeight;
      p.classList.remove('is-wait'); p.classList.add('is-type');
      G.killTweensOf(p);
      G.fromTo(p, { height: h1 }, { height: 'auto', opacity: 1, duration: 0.7, ease: 'power4.out', clearProps: 'height,opacity' });
      var len = it.text.length, dur = Math.max(900, Math.min(2800, len * (quick ? 6 : 11))), t0 = 0, txt = it.text;
      function step(ts) {
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / dur), n = Math.round(k * len);
        if (k < 1) { var sp = txt.indexOf(' ', n); n = sp < 0 ? len : sp; }
        it.on.textContent = txt.slice(0, n); it.off.textContent = txt.slice(n);
        if (k < 1) it.raf = requestAnimationFrame(step); else finish(it);
      }
      it.raf = requestAnimationFrame(step);
    }
    function openIt(it) {
      it.open = true; it.btn.setAttribute('aria-expanded', 'true');
      var p = it.panel;
      if (stat) { p.hidden = false; finish(it); return; }
      finish(it); G.killTweensOf(p);
      p.hidden = false; p.classList.add('is-wait'); p.setAttribute('aria-busy', 'true');
      it.on.textContent = ''; it.off.textContent = it.text;
      G.fromTo(p, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.8, ease: 'power4.out', clearProps: 'height,opacity' });
      var quick = it.seen; it.seen = true;
      it.timer = setTimeout(function () { startType(it, quick); }, quick ? 650 : 950);
    }
    function closeIt(it) {
      it.open = false; it.btn.setAttribute('aria-expanded', 'false');
      var p = it.panel; finish(it);
      if (stat) { p.hidden = true; return; }
      G.killTweensOf(p);
      G.to(p, { height: 0, opacity: 0, duration: 0.7, ease: 'power4.inOut', onComplete: function () { if (!it.open) p.hidden = true; G.set(p, { clearProps: 'height,opacity' }); } });
    }
    S.forEach(function (it) {
      it.btn.addEventListener('click', function () {
        if (it.open) { closeIt(it); return; }
        S.forEach(function (o) { if (o !== it && o.open) closeIt(o); });
        openIt(it);
      });
    });
    el.querySelector('.fq-thread').addEventListener('keydown', function (e) {
      var k = e.key; if (['ArrowDown', 'ArrowUp', 'Home', 'End'].indexOf(k) < 0) return;
      var bs = S.map(function (s) { return s.btn; }), i = bs.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault();
      var n = k === 'Home' ? 0 : k === 'End' ? bs.length - 1 : (i + (k === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length;
      bs[n].focus();
    });

    /* first question open by default */
    var first = S[0]; first.open = true; first.btn.setAttribute('aria-expanded', 'true'); first.panel.hidden = false;
    if (stat) { finish(first); return; }
    first.panel.classList.add('is-wait'); first.panel.setAttribute('aria-busy', 'true'); first.on.textContent = ''; first.off.textContent = first.text; first.pending = true;
    function kick() { if (first.pending && first.open) first.timer = setTimeout(function () { if (first.pending && first.open) { first.seen = true; startType(first, false); } }, 1100); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); kick(); } }, { threshold: 0.35 });
      io.observe(el.querySelector('.fq-thread'));
    } else kick();
  } };

  /* ========================================================= BRIEF */
  var STEPS = [
    { key: 'industry', multi: false, q: 'What\u2019s your business?', hint: 'Pick one', label: 'Business',
      opts: ['Real estate', 'Retail', 'Construction', 'Clinic', 'Salon', 'Restaurant', 'Something else'] },
    { key: 'channels', multi: true, q: 'Where do customers reach you?', hint: 'Pick any', label: 'Channels',
      opts: ['Web chat', 'WhatsApp', 'Instagram'] },
    { key: 'goals', multi: true, q: 'What should it do?', hint: 'Pick any', label: 'Goals',
      opts: [['Answer FAQs', 'answer FAQs'], ['Book appointments', 'book appointments'], ['Qualify leads', 'qualify leads'], ['Track orders', 'track orders'], ['Hand over to my team', 'hand over to my team']] },
    { key: 'team', multi: false, q: 'How big is the team?', hint: 'Pick one', label: 'Team',
      opts: ['Just me', '2 to 5 people', '6 to 20 people', 'More than 20 people'] },
    { key: 'notes', note: true, q: 'Anything else? (optional)', hint: 'Stays here', label: 'Notes' }
  ];

  OS.brief = { mount: function (el, ctx) {
    var idx = el.getAttribute('data-index') || '09';
    var stat = isStatic(ctx), G = ctx.gsap;
    var photo = ctx && ctx.samples ? ctx.samples('interior/photos/linen.jpg') : '../interior/photos/linen.jpg';
    el.classList.add('br'); if (stat) el.classList.add('is-static');
    var state = { industry: [], channels: [], goals: [], team: [], notes: '' };

    var turns = STEPS.map(function (s, i) {
      var qid = 'br-q' + i, body;
      if (s.note) {
        body = '<div class="br-note"><label for="br-notes">Anything else?</label><input class="br-in" id="br-notes" type="text" maxlength="240" autocomplete="off" aria-describedby="' + qid + '" placeholder="e.g. most enquiries arrive after 8 pm"></div>';
      } else {
        body = '<div class="br-chips" role="group" aria-labelledby="' + qid + '">' + s.opts.map(function (o) {
          var l = Array.isArray(o) ? o[0] : o, v = Array.isArray(o) ? o[1] : o;
          return '<button type="button" class="br-chip' + (s.multi ? ' is-multi' : '') + '" aria-pressed="false" data-s="' + i + '" data-v="' + esc(v) + '">' + esc(l) + '</button>';
        }).join('') + '</div><div class="br-you" hidden aria-hidden="true"><span></span></div>';
      }
      return '<div class="br-turn" data-s="' + i + '"' + (i && !stat ? ' hidden' : '') + '>' +
        '<div class="br-msg"><span class="br-av" aria-hidden="true"></span><div class="br-bubwrap"><div class="br-bub">' +
          '<span class="br-dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
          '<p class="br-q" id="' + qid + '">' + esc(s.q) + '<span class="br-hint">' + esc(s.hint) + '</span></p>' +
        '</div></div></div>' + body + '</div>';
    }).join('');
    var lineHtml = STEPS.map(function (s) { return '<div class="br-line" data-k="' + s.key + '"><b>' + s.label + ':</b> <span class="br-val"></span></div>'; }).join('');

    el.innerHTML =
      '<div class="br-bg" aria-hidden="true"><span class="br-blob"></span><span class="br-blob is-b"></span></div>' +
      '<div class="br-wrap">' +
        '<div class="br-head"><div>' +
          '<p class="br-lab"><b>' + esc(idx) + '</b>Contact</p>' +
          '<h2 class="br-h">' + lines('br', ['I\u2019ll build this', 'for <em>your</em> business.']) + '</h2>' +
        '</div><div class="br-photo" aria-hidden="true"><img src="' + esc(photo) + '" alt="" loading="lazy" decoding="async"></div></div>' +
        '<div class="br-grid">' +
          '<div class="br-chat" role="group" aria-label="Tell me about your business"><div class="br-chat-top"><i aria-hidden="true"></i>Orbit · scripted</div><div class="br-flow">' + turns + '</div></div>' +
          '<aside class="br-card" aria-label="Your brief"><div class="br-sheet">' +
            '<div class="br-card-top"><h3>Your brief</h3><span class="br-hand" aria-hidden="true">writes itself</span></div>' +
            '<div class="br-text" aria-live="polite" aria-atomic="true">' + lineHtml + '</div>' +
            '<textarea class="br-fb" readonly hidden aria-label="Your brief as plain text, ready to copy" rows="6"></textarea>' +
            '<div class="br-acts">' +
              '<button type="button" class="br-b br-copy"><span>Copy brief</span><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false"><rect x="5" y="5" width="8" height="9" stroke="currentColor" stroke-width="1.5"/><path d="M3 11V2h8" stroke="currentColor" stroke-width="1.5"/></svg></button>' +
              '<a class="br-b is-primary" href="' + CONTACT + '" data-magnetic><span>Send it via the contact page</span>' + ARROW + '</a>' +
            '</div>' +
            '<p class="br-status" role="status"></p>' +
            '<p class="br-fine">Nothing is sent from here. Paste it on the contact page.</p>' +
            '<button type="button" class="br-reset">Start over</button>' +
          '</div></aside>' +
        '</div>' +
      '</div>';

    revealLines(ctx, el, 'br', el.querySelector('.br-h'));

    /* ----- brief text ----- */
    var lineEls = {}; qa(el, '.br-line').forEach(function (l) { lineEls[l.getAttribute('data-k')] = l; });
    var last = {};
    function valueOf(k) {
      if (k === 'notes') return state.notes;
      var a = state[k]; if (!a.length) return '';
      return a.join(', ');
    }
    function renderBrief() {
      STEPS.forEach(function (s) {
        var v = valueOf(s.key), l = lineEls[s.key], sp = l.querySelector('.br-val');
        if (v) { sp.textContent = v; sp.className = 'br-val'; } else { sp.textContent = '—'; sp.className = 'br-val br-ph'; }
        if (last[s.key] !== undefined && last[s.key] !== v && v) { l.classList.remove('flash'); void l.offsetWidth; l.classList.add('flash'); }
        last[s.key] = v;
        var turn = el.querySelector('.br-turn[data-s="' + STEPS.indexOf(s) + '"]'), you = turn && turn.querySelector('.br-you');
        if (you) { you.hidden = !v; you.firstChild.textContent = v; }
      });
    }
    function briefText() {
      return STEPS.map(function (s) { var v = valueOf(s.key); return v ? s.label + ': ' + v : ''; }).filter(Boolean).join('\n');
    }

    /* ----- turns ----- */
    var turnEls = qa(el, '.br-turn'), revealed = [0];
    function reveal(i) {
      if (i >= turnEls.length || revealed.indexOf(i) >= 0) return;
      revealed.push(i);
      var t = turnEls[i]; t.hidden = false;
      if (stat) return;
      t.classList.add('is-wait');
      setTimeout(function () {
        t.classList.remove('is-wait');
        G.from(t.querySelector('.br-bub'), { autoAlpha: 0, y: 10, duration: 0.8, ease: 'power4.out', clearProps: 'all' });
        G.from(qa(t, '.br-chip, .br-note'), { autoAlpha: 0, y: 14, duration: 1.1, ease: 'power4.out', stagger: 0.05, clearProps: 'all' });
      }, 650);
    }
    el.addEventListener('click', function (e) {
      var chip = e.target.closest ? e.target.closest('.br-chip') : null; if (!chip || !el.contains(chip)) return;
      var i = +chip.getAttribute('data-s'), s = STEPS[i], v = chip.getAttribute('data-v'), on = chip.getAttribute('aria-pressed') === 'true';
      if (s.multi) {
        chip.setAttribute('aria-pressed', String(!on));
        state[s.key] = qa(turnEls[i], '.br-chip[aria-pressed="true"]').map(function (c) { return c.getAttribute('data-v'); });
        /* keep the brief order of the options regardless of click order */
        var order = qa(turnEls[i], '.br-chip').map(function (c) { return c.getAttribute('data-v'); });
        state[s.key].sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
      } else {
        qa(turnEls[i], '.br-chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        if (on) state[s.key] = []; else { chip.setAttribute('aria-pressed', 'true'); state[s.key] = [v]; }
      }
      if (state[s.key].length) reveal(i + 1);
      renderBrief();
    });
    var notes = el.querySelector('#br-notes');
    notes.addEventListener('input', function () { state.notes = notes.value.replace(/\s+/g, ' ').trim(); renderBrief(); });

    /* ----- actions ----- */
    var status = el.querySelector('.br-status'), fb = el.querySelector('.br-fb'), copyBtn = el.querySelector('.br-copy'), stT = 0;
    function say(msg) { status.textContent = msg; clearTimeout(stT); stT = setTimeout(function () { status.textContent = ''; }, 6000); }
    function fallback(text) {
      fb.value = text; fb.hidden = false; fb.focus(); fb.select();
      var ok = false; try { ok = document.execCommand && document.execCommand('copy'); } catch (e) { ok = false; }
      say(ok ? 'Brief copied.' : 'Brief selected below. Press Ctrl+C or Cmd+C to copy it.');
    }
    copyBtn.addEventListener('click', function () {
      var text = briefText();
      if (!text) { say('Pick a few options first, then copy.'); return; }
      var done = function () { fb.hidden = true; say('Brief copied. Paste it on the contact page.'); };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallback(text); });
        else fallback(text);
      } catch (e) { fallback(text); }
    });
    el.querySelector('.br-reset').addEventListener('click', function () {
      state = { industry: [], channels: [], goals: [], team: [], notes: '' };
      qa(el, '.br-chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      notes.value = ''; fb.hidden = true; last = {}; renderBrief(); say('Brief cleared.');
    });
    renderBrief();

    /* ----- first question: show typing dots, then the question, once the chat is on screen ----- */
    if (!stat) {
      var t0 = turnEls[0]; t0.classList.add('is-wait');
      var go = function () { setTimeout(function () {
        t0.classList.remove('is-wait');
        G.from(t0.querySelector('.br-bub'), { autoAlpha: 0, y: 10, duration: 0.8, ease: 'power4.out', clearProps: 'all' });
        G.from(qa(t0, '.br-chip'), { autoAlpha: 0, y: 14, duration: 1.1, ease: 'power4.out', stagger: 0.05, clearProps: 'all' });
      }, 700); };
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); go(); } }, { threshold: 0.3 });
        io.observe(el.querySelector('.br-chat'));
      } else go();
      G.fromTo(el.querySelector('.br-photo'), { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.6, ease: 'expo.out', clearProps: 'clipPath', scrollTrigger: { trigger: el.querySelector('.br-photo'), start: 'top 88%', once: true } });
      G.from(el.querySelector('.br-photo img'), { scale: 1.25, duration: 2, ease: 'expo.out', scrollTrigger: { trigger: el.querySelector('.br-photo'), start: 'top 88%', once: true } });
      G.from(el.querySelector('.br-card'), { autoAlpha: 0, y: 60, duration: 1.5, ease: 'expo.out', clearProps: 'opacity,visibility,transform', scrollTrigger: { trigger: el.querySelector('.br-grid'), start: 'top 82%', once: true } });
    }

  } };
})();
