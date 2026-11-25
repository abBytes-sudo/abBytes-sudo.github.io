/* Stock Out. Forty-five days running a small shop: three products, limited cash, suppliers that take days. Reorder too late and you turn
   customers away; reorder too much and the cash sits on the shelf. */
(function () {
  'use strict';
  var d = document, order = null;
  function E(t, c, x) { var e = d.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; }
  window.Arcade.reg('stock', {
    title: 'Stock Out',
    how: ['You run the shop for 45 days. Each day customers buy what is on the shelf.', 'Press Order (or keys 1, 2, 3) to buy a batch. It costs cash now and arrives after the supplier’s lead time.', 'Turn a customer away and you lose a star. Lose all five and the shop closes.', 'Rent and wages cost ₹14K every day, so cash is tight. Run out and the shop closes.', 'Watch the news line: demand spikes are announced a day ahead. Score is the cash you end with.'],
    tie: ['Stockroom drafts the purchase order at the reorder point, before the shelf is empty.', 'samples/stockroom/index.html', 'See Stockroom'],
    start: function (c) {
      var P = [{ n: 'Harbor jacket', price: 8, cost: 5, lead: 3, dm: 2.1, s: 9, b: 8 }, { n: 'Linen shirt', price: 5, cost: 3, lead: 2, dm: 3, s: 11, b: 10 }, { n: 'Wool coat', price: 14, cost: 9, lead: 5, dm: 1.1, s: 5, b: 6 }];
      var cash = 60, day = 0, rep = 5, t = 0, len = 1.9, inc = [], spike = null, soon = null, lvl = 1, w = E('div', 'so'), top = E('div', 'so-top'), news = E('p', 'so-n', 'Day 1. The shop is open.'), list = E('div', 'so-l'), rows = [];
      w.appendChild(top); w.appendChild(news); w.appendChild(list); c.root.appendChild(w);
      P.forEach(function (p, i) { var r = E('div', 'so-r'), b = E('button', 'so-b'); b.type = 'button'; b.addEventListener('click', function () { order(i); }); r.appendChild(E('b', '', p.n)); r.appendChild(E('span', 'so-m', '₹' + p.price + 'K each · supplier takes ' + p.lead + ' days')); r.appendChild(E('div', 'so-s')); r.appendChild(E('p', 'so-i')); r.appendChild(b); list.appendChild(r); rows.push(r); });
      function draw() {
        top.textContent = ''; [['Day', day + ' of 45'], ['Cash', '₹' + Math.round(cash) + 'K'], ['Customers', '★'.repeat(rep) + '☆'.repeat(5 - rep)]].forEach(function (x) { var e = E('p'); e.appendChild(E('span', '', x[0])); e.appendChild(E('b', '', x[1])); top.appendChild(e); });
        P.forEach(function (p, i) { var r = rows[i], s = r.children[2], b = r.lastChild, due = inc.filter(function (o) { return o.i === i; }); s.textContent = ''; for (var k = 0; k < Math.min(p.s, 30); k++) s.appendChild(E('i')); if (!p.s) s.appendChild(E('em', '', 'Shelf empty')); r.classList.toggle('low', p.s <= 2);
          r.children[3].textContent = due.length ? 'On the way: ' + due.map(function (o) { return o.q + ' in ' + o.d + (o.d === 1 ? ' day' : ' days'); }).join(', ') : 'Nothing on order'; b.textContent = 'Order ' + p.b + ' · ₹' + p.b * p.cost + 'K  (' + (i + 1) + ')'; b.disabled = cash < p.b * p.cost; });
        c.score(Math.max(0, Math.round(cash)));
      }
      order = function (i) { var p = P[i]; if (cash < p.b * p.cost) { c.beep(160); return; } cash -= p.b * p.cost; inc.push({ i: i, q: p.b, d: p.lead }); c.beep(440); draw(); };
      function tick() {
        day++; var lost = 0, sold = 0, msg = [];
        inc = inc.filter(function (o) { if (--o.d <= 0) { P[o.i].s += o.q; msg.push(o.q + ' ' + P[o.i].n.toLowerCase() + 's arrived'); return false; } return true; });
        if (spike && --spike.d < 0) spike = null; if (soon) { spike = { i: soon.i, d: 2 }; soon = null; }
        if (!spike && day % 6 === 3) { soon = { i: Math.random() * 3 | 0 }; msg.push('Tomorrow: a rush on ' + P[soon.i].n.toLowerCase() + 's, about three times the usual'); }
        P.forEach(function (p, i) { var dm = Math.round(p.dm * (1 + (lvl - 1) * .14) * (spike && spike.i === i ? 3 : 1) * (.45 + Math.random() * 1.1)), s = Math.min(p.s, dm); p.s -= s; cash += s * p.price; sold += s; lost += dm - s; cash -= p.s * .06; rows[i].classList.toggle('hit', s > 0); }); cash -= 14;
        if (lost) { rep--; c.shake(); c.beep(150, .25); msg.unshift(lost + (lost === 1 ? ' customer' : ' customers') + ' turned away'); } else if (sold) c.beep(600, .06);
        if (day % 10 === 0) { lvl++; len = Math.max(1, len * .86); c.level(lvl); msg.push('Word is getting round: more customers a day'); }
        news.textContent = 'Day ' + day + '. ' + (msg.length ? msg.join('. ') + '.' : 'Sold ' + sold + '.'); draw();
        if (cash < 0) c.end(0, 'The shop ran out of cash on day ' + day + '.'); else if (rep <= 0) c.end(Math.max(0, Math.round(cash)), 'The shop closed on day ' + day + ' after turning too many customers away.'); else if (day >= 45) c.end(Math.max(0, Math.round(cash)), 'Forty-five days done. You started with ₹60K.');
      }
      draw(); c.level(1); c.loop(function (dt) { t += dt; if (t > len) { t = 0; tick(); } });
    },
    key: function (e) { var k = { '1': 0, '2': 1, '3': 2 }[e.key]; if (k !== undefined && order) order(k); }
  });
})();
