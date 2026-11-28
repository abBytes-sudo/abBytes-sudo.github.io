/* Services page. Small and optional: the page reads fine without it.
   1 the header goes clear over the dark hero and white once it has scrolled away (as on the homepage)
   2 the jump bar marks the service on screen
   3 blocks arrive as they scroll in (never under reduced motion)
   4 on phones, the dots under a row of packages follow the swipe
   5 the estimate: a toggle on every card, a slim tray, and one list at the end whose button carries the picks to the contact form
   No inline styles or handlers (CSP). */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hero = d.getElementById('top'), IO = 'IntersectionObserver' in window;

  /* 1 header */
  function head() { root.classList.toggle('inv', !hero || hero.getBoundingClientRect().bottom < 64); }
  addEventListener('scroll', head, { passive: true }); addEventListener('resize', head); head();

  /* 2 jump bar */
  var links = $$('#jump a'), byId = {}, bar = d.querySelector('#jump ul');
  links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
  function mark(id) {
    links.forEach(function (a) { var on = a === byId[id]; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    var a = byId[id]; if (a && bar && bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: Math.max(0, a.offsetLeft - 18), behavior: reduce ? 'auto' : 'smooth' });
  }
  var secs = Object.keys(byId).map(function (id) { return d.getElementById(id); }).filter(Boolean), cur = null, tick = 0;
  function spy() {                       // the last section whose top has passed under the bars; none before the first or after the add-ons
    tick = 0;
    var hit = null, i, r;
    for (i = 0; i < secs.length; i++) { r = secs[i].getBoundingClientRect(); if (r.top <= 150) hit = secs[i]; }
    if (hit && hit.getBoundingClientRect().bottom < 150) hit = null;
    var id = hit ? hit.id : null; if (id !== cur) { cur = id; mark(id); }
  }
  if (secs.length) { addEventListener('scroll', function () { if (!tick) tick = requestAnimationFrame(spy); }, { passive: true }); addEventListener('resize', spy); spy(); }

  /* 3 arrive on scroll */
  if (IO && !reduce) {
    root.classList.add('js');
    var rv = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('on'); rv.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.rv').forEach(function (el) { rv.observe(el); });
    setTimeout(function () { $$('.rv').forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('on'); }); }, 900);
  }

  /* 4 package dots on phones */
  $$('.tiers').forEach(function (row) {
    var wrap = row.parentNode, dots = $$('.swipe i', wrap), tip = wrap.querySelector('.swipe span'), cards = $$('.tier', row), t = 0;
    if (!dots.length) return;
    var NAMES = ['Starter', 'Standard', 'Custom'];
    function sync() {
      var mid = row.scrollLeft + row.clientWidth / 2, best = 0, bd = 1e9;
      cards.forEach(function (c, i) { var k = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (k < bd) { bd = k; best = i; } });
      dots.forEach(function (o, i) { o.classList.toggle('on', i === best); });
      if (tip) tip.textContent = best === 0 ? 'Swipe for Standard and Custom' : NAMES[best] + ' · ' + (best + 1) + ' of 3';
    }
    row.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(sync, 60); }, { passive: true });
  });

  /* 5 the estimate. One package a service, any number of add-ons. Kept for the visit (sessionStorage), so coming back keeps the list.
     The form link: index.html?pick=website:standard,crm:starter&addon=care,seo-setup#contact (contact.js reads it). */
  var picks = $$('.pick'), list = d.getElementById('bill-l');
  if (!picks.length || !list) return;
  root.classList.add('sel');
  var KEY = 'am-est', order = [], tray = d.getElementById('tray'), say = d.getElementById('est-say'), endSec = d.getElementById('estimate'), endSeen = false;
  var el = function (id) { return d.getElementById(id); };
  function pid(b) { return b.dataset.kind === 'svc' ? 'svc:' + b.dataset.k + ':' + b.dataset.tier : 'add:' + b.dataset.k; }
  function isOn(b) { return b.getAttribute('aria-pressed') === 'true'; }
  function byPid(id) { for (var i = 0; i < picks.length; i++) if (pid(picks[i]) === id) return picks[i]; return null; }
  function label(b) { return b.dataset.name + (b.dataset.label ? ' · ' + b.dataset.label : ''); }
  function press(b, v) {
    b.setAttribute('aria-pressed', v ? 'true' : 'false');
    var i = order.indexOf(pid(b)); if (v && i < 0) order.push(pid(b)); if (!v && i >= 0) order.splice(i, 1);
  }
  function span(a, b, open) {                   // working days → words
    var plus = open ? '+' : '';
    if (b <= 9) return (a === b ? a : a + '–' + b) + plus + ' working days';
    var wa = Math.max(1, Math.round(a / 5)), wb = Math.round(b / 5);
    if (wb <= 26) return (wa === wb ? 'About ' + wa : wa + '–' + wb) + plus + ' weeks';
    var ma = Math.round(a / 10) / 2, mb = Math.round(b / 10) / 2;
    return (ma === mb ? 'About ' + ma : ma + '–' + mb) + plus + ' months';
  }
  function render(spoken) {
    var on = order.map(byPid).filter(function (b) { return b && isOn(b); });
    $$('.tier, .ad').forEach(function (c) { c.classList.toggle('picked', $$('.pick', c).some(isOn)); });
    /* the list */
    list.textContent = '';
    on.forEach(function (b) {
      var li = d.createElement('li'), n = d.createElement('b'), s = d.createElement('small'), t = d.createElement('span'), x = d.createElement('button');
      n.textContent = b.dataset.name; s.textContent = b.dataset.kind === 'svc' ? b.dataset.label + ' package' : 'Add-on';
      t.textContent = b.dataset.time || 'timed in your estimate';
      x.type = 'button'; x.className = 'bill-x'; x.textContent = '×'; x.setAttribute('aria-label', 'Remove ' + label(b).replace(' · ', ', '));
      x.addEventListener('click', function () { press(b, false); save(); render('Removed ' + label(b) + '.'); (list.querySelector('.bill-x') || el('bill-go')).focus(); });
      li.appendChild(n); li.appendChild(s); li.appendChild(t); li.appendChild(x); list.appendChild(li);
    });
    el('bill-0').hidden = on.length > 0;
    el('bill-n').textContent = on.length ? on.length + (on.length === 1 ? ' item' : ' items') : 'one form, about a minute';
    /* the combined timeline: counted parts added up as if built one after the other */
    var a = 0, z = 0, open = false, counted = 0, later = 0;
    on.forEach(function (b) { if (b.dataset.min) { a += +b.dataset.min; z += +b.dataset.max; counted++; if (b.hasAttribute('data-open')) open = true; } else if (!b.hasAttribute('data-ong')) later++; });
    var box = el('bill-t'); box.hidden = !on.length;
    if (on.length) {
      el('bill-tl').textContent = counted > 1 ? 'Typical combined timeline' : 'Typical timeline';
      el('bill-tt').textContent = counted ? span(a, z, open) : later ? 'In your estimate' : 'Starts in 1–2 working days';
      var notes = [];
      if (counted > 1) notes.push('Added up as if built one after the other. Your delivery plan says what can run side by side.');
      else if (counted) notes.push('Working time, from the day your content and approvals arrive.');
      if (later && counted) notes.push(later === 1 ? 'One part is timed in the estimate itself.' : later + ' parts are timed in the estimate itself.');
      if (!counted && later) notes.push('These are scoped from your brief, so the timeline comes with the estimate.');
      el('bill-ts').textContent = notes.join(' ');
    }
    /* the link to the form, on the one button and the two quiet links */
    var pk = on.filter(function (b) { return b.dataset.kind === 'svc'; }).map(function (b) { return b.dataset.k + ':' + b.dataset.tier; });
    var ad = on.filter(function (b) { return b.dataset.kind === 'add'; }).map(function (b) { return b.dataset.k; });
    var q = []; if (pk.length) q.push('pick=' + pk.join(',')); if (ad.length) q.push('addon=' + ad.join(','));
    $$('a[data-est]').forEach(function (l) { if (!l.hasAttribute('data-h')) l.setAttribute('data-h', l.getAttribute('href')); l.setAttribute('href', on.length ? 'index.html?' + q.join('&') + '#contact' : l.getAttribute('data-h')); });
    /* the header count and the tray */
    var cn = el('top-n'); if (cn) { cn.hidden = !on.length; cn.textContent = on.length; }
    if (tray) {
      el('tray-n').textContent = on.length + ' in my estimate';
      el('tray-l').textContent = on.map(label).join(', ');
      if (on.length) tray.hidden = false;
      tray.classList.toggle('off', !on.length || endSeen);
    }
    if (spoken && say) say.textContent = spoken + ' ' + (on.length ? on.length + (on.length === 1 ? ' item' : ' items') + ' in your estimate.' : 'Your estimate is empty.');
  }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(order)); } catch (e) { /* storage blocked: the list lasts for this page view */ } }
  picks.forEach(function (b) {
    b.addEventListener('click', function () {
      var v = !isOn(b);
      if (v && b.dataset.kind === 'svc') picks.forEach(function (o) { if (o !== b && o.dataset.kind === 'svc' && o.dataset.k === b.dataset.k && isOn(o)) press(o, false); });
      press(b, v); save(); render((v ? 'Added ' : 'Removed ') + label(b) + '.');
    });
  });
  try { (JSON.parse(sessionStorage.getItem(KEY) || '[]') || []).forEach(function (id) { var b = byPid(String(id)); if (b) press(b, true); }); } catch (e) { order = []; }
  if (IO && endSec) new IntersectionObserver(function (es) { endSeen = es[0].isIntersecting; render(); }, { rootMargin: '0px 0px -30% 0px' }).observe(endSec);
  render();
})();
