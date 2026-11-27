/* Concept F, third act (from concept D · Made to Order). The hero assembles a small working system for the visitor's own business: a pipeline you can drag,
   a calendar you can book, a scripted assistant and a stock list, all wired to each other. Plain DOM, no libraries. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, W = window.WORK, $ = function (s) { return d.querySelector(s); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  function E(tag, cls, txt) { var e = d.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; }
  /* illustrative data per trade. cards: [who, what, value]; stock: [item, left, of]; qr: [question, answer, new card]; like: closest real projects */
  var PACK = {
    property: { n: 'Property', st: ['Enquiry', 'Site visit', 'Won'], k: ['New enquiries', 'Visits booked'], cal: 'Site visits', stT: 'Homes available', unit: ' L',
      cards: [['Mehra family', '3 BHK · Vasant Vihar', 18], ['R. Kapoor', 'Office · Saket', 42], ['Anita S.', '2 BHK · rent', 6], ['D. Bose', 'Plot · Gurugram', 95]],
      stock: [['3 BHK, Tower A', 6, 12], ['2 BHK, Tower B', 9, 14], ['Shops, ground floor', 3, 8]], bot: 'Hello! Buying or renting?',
      qr: [['3 BHK to rent under ₹1.5 lakh', 'Four homes match, in Vasant Vihar and Saket. Shall I book a visit?', ['Web chat lead', '3 BHK · rent', 9]], ['Book a site visit', 'Done. Saturday, 11 am is held for you.', ['Visit request', 'Tower A · Sat', 14]]], like: ['recrm', 'reweb', 'estate', 'launch'] },
    build: { n: 'Construction', st: ['Enquiry', 'Quote sent', 'Won'], k: ['New enquiries', 'Quotes out'], cal: 'Site surveys', stT: 'On hand', unit: ' L',
      cards: [['Villa, Sainik Farm', 'Full interiors', 38], ['Café fit-out', 'Hauz Khas', 12], ['Arora residence', 'Kitchen, wardrobes', 7], ['Office, 4th floor', 'Design-build', 64]],
      stock: [['Plywood, 18 mm', 140, 200], ['Tiles, 600 × 600', 520, 900], ['Site teams free', 2, 5]], bot: 'Hello! What are you building?',
      qr: [['Price for a modular kitchen?', 'Most come to ₹2.4 to 4 lakh. Want a line-by-line quote?', ['Quote request', 'Modular kitchen', 3]], ['Book a site survey', 'Booked. The surveyor will call an hour before.', ['Survey request', 'Flat · Dwarka', 9]]], like: ['interp', 'studio', 'quotes', 'build', 'masonry', 'interior'] },
    retail: { n: 'Retail', st: ['In cart', 'Paid', 'Delivered'], k: ['Open carts', 'Paid orders'], cal: 'Store pickups', stT: 'In stock', unit: 'K',
      cards: [['Order 1042', 'Harbor jacket × 1', 8], ['Order 1043', 'Linen shirt × 2', 5], ['Order 1044', 'Tote and scarf', 4], ['Order 1045', 'Wool coat', 14]],
      stock: [['Harbor jacket', 14, 40], ['Linen shirt', 31, 60], ['Wool coat', 5, 20]], bot: 'Hi! Need help with an order?',
      qr: [['Is the wool coat in a medium?', 'Yes, five left in medium. Shall I hold one?', ['Chat order', 'Wool coat · M', 14]], ['Where is my order?', 'Out for delivery, arriving today by 6 pm.', ['Returning customer', 'Asked about tracking', 3]]], like: ['store', 'orders', 'watch', 'revv', 'stockroom'] },
    stay: { n: 'Hospitality', st: ['Enquiry', 'Held', 'Booked'], k: ['New enquiries', 'Rooms held'], cal: 'Tables and tours', stT: 'Free tonight', unit: 'K',
      cards: [['Iyer, 2 nights', 'Ridge room', 22], ['Wedding party', '14 rooms', 180], ['Sen, weekend', 'Valley suite', 31], ['Company offsite', '3 nights', 240]],
      stock: [['Ridge rooms', 4, 10], ['Valley suites', 2, 6], ['Dinner tables', 7, 16]], bot: 'Namaste! When are you visiting?',
      qr: [['Any rooms this weekend?', 'Two ridge rooms are free, ₹11,000 a night. Hold one?', ['Chat enquiry', 'Ridge room · weekend', 22]], ['A table for four tonight', 'Held for 8 pm.', ['Dinner guest', 'Table for 4', 4]]], like: ['resort', 'saas', 'store'] },
    service: { n: 'Services', st: ['Enquiry', 'Trial', 'Member'], k: ['New enquiries', 'Trials booked'], cal: 'Trial sessions', stT: 'Spots left', unit: 'K',
      cards: [['Kabir', 'Strength · 3 months', 12], ['Naina', 'HYROX prep', 18], ['Dr Rao', 'Morning batch', 9], ['Team of 6', 'Company plan', 54]],
      stock: [['6 am strength', 3, 14], ['7 pm HYROX', 5, 16], ['Sunday open gym', 9, 20]], bot: 'Hey! Want to try a class?',
      qr: [['What does a trial cost?', 'Your first class is free. Shall I book one?', ['Chat lead', 'Free trial', 12]], ['Book me in for 7 pm', 'You are in. Bring water and a towel.', ['Trial booked', '7 pm HYROX', 12]]], like: ['boxx', 'gym', 'saas', 'work', 'crm'] }
  };
  var app = $('#app'), pipe = $('#pipe'), slotsEl = $('#slots'), msgs = $('#msgs'), qr = $('#qr'), stockEl = $('#stock'), tipEl = $('#tip'), toastEl = $('#toast');
  var trade = 'property', P = PACK.property, lists = [], won = 0, step = 0, name = '', tT = 0;
  var TIPS = ['Try it: drag a card across to the last column.', 'Now click a free slot in the calendar.', 'Now ask the assistant something.', 'That is one system: every part knows about the others.'];
  function tip(n) { if (n > step) { step = n; tipEl.textContent = TIPS[n]; } }
  function toast(t) { toastEl.textContent = t; toastEl.classList.add('on'); clearTimeout(tT); tT = setTimeout(function () { toastEl.classList.remove('on'); }, 2300); }
  function bump(el, v) { v = String(v); if (el.textContent === v) return; el.textContent = v; el.classList.remove('up'); void el.offsetWidth; el.classList.add('up'); }
  function money(v) { return '₹' + v + P.unit; }
  function kpis() { bump($('#k1'), lists[0].children.length); bump($('#k2'), lists[1].children.length); bump($('#k3'), money(won)); lists.forEach(function (l) { l.previousSibling.lastChild.textContent = l.children.length; }); }
  function confetti(x, y) {
    if (reduce) return; var cs = [getComputedStyle(root).getPropertyValue('--b').trim(), '#101114', '#ffd23f'], i, c, a, r;
    for (i = 0; i < 26; i++) { c = E('i', 'cf'); a = Math.random() * 6.283; r = 60 + Math.random() * 150; c.style.left = x + 'px'; c.style.top = y + 'px'; c.style.background = cs[i % 3]; c.style.setProperty('--x', Math.cos(a) * r + 'px'); c.style.setProperty('--y', Math.sin(a) * r - 60 + 'px'); c.style.setProperty('--r', Math.random() * 720 - 360 + 'deg'); d.body.appendChild(c); setTimeout(function (n) { n.remove(); }, 1000, c); }
  }
  function land(el, ci) {            // a card arrives in a column: this is where the parts talk to each other
    lists[ci].insertBefore(el, lists[ci].firstChild);
    if (ci === 2 && !el.dataset.done) {
      el.dataset.done = 1; won += +el.dataset.v; var r = el.getBoundingClientRect(), s = stockEl.children[0], b; confetti(r.left + r.width / 2, r.top + r.height / 2);
      if (s && +s.dataset.q > 0) { s.dataset.q = +s.dataset.q - 1; b = s.querySelector('b'); b.textContent = s.dataset.q; b.classList.remove('dn'); void b.offsetWidth; b.classList.add('dn'); s.querySelector('i').style.setProperty('--w', s.dataset.q / s.dataset.of * 100 + '%'); }
      toast(P.st[2] + ': ' + el.querySelector('b').textContent + '. Stock updated.'); tip(1);
    }
    kpis();
  }
  function card(a, fresh) {
    var el = E('div', 'card' + (fresh ? ' new' : '')); el.dataset.v = a[2]; el.appendChild(E('i', '', money(a[2]))); el.appendChild(E('b', '', a[0])); el.appendChild(E('span', '', a[1]));
    el.addEventListener('pointerdown', function (e) {
      if (e.button || el.dataset.done) return; e.preventDefault();
      var r = el.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top, from = el.parentNode, next = el.nextSibling, over = null;
      el.style.width = r.width + 'px'; el.style.left = r.left + 'px'; el.style.top = r.top + 'px'; el.classList.add('drag'); d.body.appendChild(el);
      function mv(ev) { el.style.left = ev.clientX - ox + 'px'; el.style.top = ev.clientY - oy + 'px'; var c = d.elementFromPoint(ev.clientX, ev.clientY); c = c && c.closest('.col'); if (c !== over) { if (over) over.classList.remove('over'); over = c; if (c) c.classList.add('over'); } }
      function up() { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); el.classList.remove('drag'); el.style.width = el.style.left = el.style.top = ''; if (over) { over.classList.remove('over'); land(el, +over.dataset.s); } else from.insertBefore(el, next); }
      addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    });
    return el;
  }
  function render() {
    P = PACK[trade]; won = 0; pipe.textContent = ''; lists = [];
    P.st.forEach(function (s, i) { var c = E('div', 'col'), h = E('h4', '', s), l = E('div', 'list'); c.dataset.s = i; h.appendChild(E('span', '', '0')); c.appendChild(h); c.appendChild(l); pipe.appendChild(c); lists.push(l); });
    P.cards.forEach(function (a, i) { lists[i === 3 ? 1 : 0].appendChild(card(a)); });
    $('#k1l').textContent = P.k[0]; $('#k2l').textContent = P.k[1]; $('#calT').textContent = P.cal; $('#stT').textContent = P.stT;
    slotsEl.textContent = ''; ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach(function (x) { slotsEl.appendChild(E('span', '', x)); });
    [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0].forEach(function (t, i) {
      var b = E('button', t ? 't' : ''); b.type = 'button'; b.setAttribute('aria-label', (t ? 'Taken' : 'Free slot') + ', ' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][i % 5] + ' ' + ['10 am', '1 pm', '4 pm'][i / 5 | 0]); if (t) b.disabled = true;
      b.addEventListener('click', function () { if (b.classList.contains('k')) return; var c = lists[0].firstChild; b.classList.add('k'); b.textContent = c ? c.querySelector('b').textContent.split(/[ ,]/)[0] : 'Held'; if (c) land(c, 1); toast(P.cal + ': booked, and the pipeline moved.'); tip(2); });
      slotsEl.appendChild(b);
    });
    msgs.textContent = ''; msgs.appendChild(E('p', '', P.bot)); qr.textContent = '';
    P.qr.forEach(function (q) { var b = E('button', '', q[0]); b.type = 'button'; b.addEventListener('click', function () { msgs.appendChild(E('p', 'u', q[0])); b.remove(); setTimeout(function () { msgs.appendChild(E('p', '', q[1])); msgs.appendChild(E('p', 's', '→ Added to the pipeline')); lists[0].insertBefore(card(q[2], true), lists[0].firstChild); kpis(); tip(3); }, reduce ? 0 : 600); }); qr.appendChild(b); });
    stockEl.textContent = ''; P.stock.forEach(function (s) { var li = E('li'), i = E('i'); li.dataset.q = s[1]; li.dataset.of = s[2]; li.appendChild(E('span', '', s[0])); li.appendChild(E('b', '', s[1])); i.style.setProperty('--w', s[1] / s[2] * 100 + '%'); li.appendChild(i); stockEl.appendChild(li); });
    kpis(); index();
  }

  /* configurator */
  var small = innerWidth < 760 ? .35 : 1;
  [[-150, -60, 80, -9], [170, -95, 130, 7], [-120, 80, 100, 6], [150, 70, 50, -8]].forEach(function (v, i) { var m = app.querySelectorAll('.m')[i]; m.style.setProperty('--x', v[0] * small + 'px'); m.style.setProperty('--y', v[1] * small + 'px'); m.style.setProperty('--z', v[2] + 'px'); m.style.setProperty('--r', v[3] + 'deg'); m.style.setProperty('--d', i * .07 + 's'); });
  Object.keys(PACK).forEach(function (k) { var b = E('button', '', PACK[k].n); b.type = 'button'; b.setAttribute('aria-pressed', k === trade); b.addEventListener('click', function () { if (k === trade) return; [].forEach.call($('#trades').children, function (c) { c.setAttribute('aria-pressed', c === b); }); app.classList.add('loose'); setTimeout(function () { trade = k; render(); brief(); app.classList.remove('loose'); }, reduce ? 0 : 560); }); $('#trades').appendChild(b); });
  [['#6a3df0', '#efeafe', 'Violet'], ['#4f46e5', '#eeedfd', 'Indigo'], ['#0d9f6e', '#e2f6ee', 'Green'], ['#e5482d', '#fdebe6', 'Vermilion'], ['#c98a00', '#fbf1d6', 'Gold'], ['#d6249f', '#fbe6f4', 'Magenta']].forEach(function (c, i) {
    var b = E('button'); b.type = 'button'; b.style.setProperty('--c', c[0]); b.setAttribute('aria-label', c[2]); b.setAttribute('aria-pressed', !i);
    b.addEventListener('click', function () { root.style.setProperty('--b', c[0]); root.style.setProperty('--bs', c[1]); [].forEach.call($('#cols').children, function (x) { x.setAttribute('aria-pressed', x === b); }); }); $('#cols').appendChild(b);
  });
  function brief() {
    var n = name || 'my business', href = 'mailto:abhimasih0505@gmail.com?subject=' + encodeURIComponent('A system for ' + n) + '&body=' + encodeURIComponent('Business: ' + n + '\nTrade: ' + P.n + (window.MESS && window.MESS.length ? '\nOur mess: ' + window.MESS.join(', ') : '') + '\n\nHow we work today:\n');
    $('#appName').textContent = name || 'Your business'; $('#endH').textContent = name ? 'Let’s build ' + name + ' its own system.' : 'Let’s build yours.';
    $('#cta1').textContent = name ? 'Build ' + name + ' for real →' : 'Build this for real →'; $('#cta2').href = $('#mail').href = href;
  }
  $('#biz').addEventListener('input', function (e) { name = e.target.value.trim(); brief(); });
  if (fine && !reduce) { var stage = $('#ystage'); stage.addEventListener('pointermove', function (e) { var r = stage.getBoundingClientRect(); app.style.transform = 'rotateY(' + ((e.clientX - r.left) / r.width - .5) * 7 + 'deg) rotateX(' + (.5 - (e.clientY - r.top) / r.height) * 5 + 'deg)'; }); stage.addEventListener('pointerleave', function () { app.style.transform = ''; }); }

  /* the real projects: closest to the chosen trade first, with a preview that plays the page */
  var ix = $('#ix'), pv = $('#pv');
  function index() {
    var like = P.like, order = like.map(function (id) { return W.filter(function (w) { return w.id === id; })[0]; }).concat(W.filter(function (w) { return like.indexOf(w.id) < 0; }));
    ix.textContent = ''; $('#like').textContent = 'The ones closest to a ' + P.n.toLowerCase() + ' business are at the top.';
    order.forEach(function (w, i) {
      var a = E('a'), b = E('b', '', w.name); a.href = w.href; if (i < like.length) b.appendChild(E('em', '', 'Like yours'));
      a.appendChild(E('span', 'n', (i < 9 ? '0' : '') + (i + 1))); a.appendChild(b); a.appendChild(E('span', 'k', w.kind)); a.appendChild(E('span', 's', w.status)); a.appendChild(E('span', 'g', '→'));
      function on() { pv.textContent = ''; if (!w.img && !w.card) { pv.classList.remove('on'); return; } var im = new Image(); im.alt = ''; if (w.img) im.addEventListener('load', function () { var dy = pv.clientHeight - im.clientHeight; if (dy < 0 && !reduce) { im.style.setProperty('--y', dy + 'px'); im.style.setProperty('--t', Math.max(6, w.a * 3.4) + 's'); im.classList.add('pan'); } }); im.src = w.img ? 'img/' + w.img + '.webp' : 'img/cards/' + w.card + '.webp'; pv.appendChild(im); pv.classList.add('on'); }
      a.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') on(); }); a.addEventListener('focus', on); a.addEventListener('pointerleave', function () { pv.classList.remove('on'); }); a.addEventListener('blur', function () { pv.classList.remove('on'); });
      ix.appendChild(a);
    });
  }
  render(); brief();
  function mess() { var m = window.MESS; if (m && m.length) app.querySelector('.m').dataset.mess = m[m.length - 1]; brief(); }
  addEventListener('mess', mess); mess();
  if (reduce || !('IntersectionObserver' in window)) app.classList.remove('loose');
  else new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { o.disconnect(); setTimeout(function () { app.classList.remove('loose'); }, 350); } }, { threshold: .35 }).observe(app);
})();
