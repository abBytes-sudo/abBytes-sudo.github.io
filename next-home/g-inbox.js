/* Inbox Rush. Enquiries pour in from every channel; decide what each one needs before it goes cold. Streaks multiply, levels speed up. */
(function () {
  'use strict';
  var d = document, A = ['Reply', 'Book a visit', 'Assign to team', 'Spam'], K = ['→ or 1', '↑ or 2', '↓ or 3', '← or 4'], act = null;
  var M = [['Is the 3 BHK in Vasant Vihar still available?', 0], ['What is the rent for the Saket office?', 0], ['Do you deliver to Gurugram?', 0], ['Roughly what does a modular kitchen cost?', 0], ['Are you open on Sunday?', 0], ['Is the wool coat in a medium?', 0], ['What are your membership prices?', 0],
    ['Can we see the flat on Saturday morning?', 1], ['I’d like a free trial class this week.', 1], ['A table for four tonight at 8?', 1], ['Please send someone to measure the kitchen.', 1], ['Can I come to the site office tomorrow?', 1], ['Two rooms for the long weekend, can you hold them?', 1], ['Can I test-ride the bike on Friday?', 1],
    ['My invoice shows the wrong amount.', 2], ['The tap you fitted last week is leaking.', 2], ['I paid twice for order 1043.', 2], ['Nobody came for the 11 am visit.', 2], ['The key handover is still pending.', 2], ['My refund has not arrived.', 2], ['The site photos have not been updated in two weeks.', 2],
    ['CONGRATULATIONS!! You have won ₹25,00,000', 3], ['We do SEO. First page guaranteed, very cheap.', 3], ['Earn ₹5,000 a day from home.', 3], ['Your account is blocked. Click this link now.', 3], ['Loan approved!!! No documents needed.', 3], ['Buy 10,000 followers today.', 3], ['Dear sir kindly share your bank details for prize.', 3]];
  var WHO = ['Mehra', 'R. Kapoor', 'Anita S.', 'Imran K.', 'Priya N.', 'Joshi & Sons', 'D. Bose', 'Naina', 'Kabir', '+91 98•• ••21', 'Unknown number'], CH = ['WhatsApp', 'Website chat', 'Missed call', 'Instagram', 'Customer portal'];
  function E(t, c, x) { var e = d.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; }
  window.Arcade.reg('inbox', {
    title: 'Inbox Rush',
    how: ['Each enquiry needs one of four things: a reply, a visit booked, the team, or the bin.', 'Arrow keys or 1 to 4. On a phone, swipe the card: right to reply, up to book, down to assign, left for spam.', 'Right calls build a streak (up to ×5). A wrong call, or a lead left waiting too long, costs one of three lives.', 'Every eight right calls the inbox gets faster.'],
    tie: ['In a real system this queue is sorted before anyone opens it: the assistant replies, books the visit and files the lead.', 'samples/saas/index.html', 'See Orbit Assistants'],
    start: function (c) {
      var q = [], lives = 3, combo = 1, right = 0, lvl = 1, t = 1.4, gap = 2.5, score = 0, wrap = E('div', 'ib'), hud = E('p', 'ib-h'), stack = E('div', 'ib-q'), row = E('div', 'ib-a'), pop = E('b', 'ib-pop'), last = -1;
      A.forEach(function (a, i) { var b = E('button', 'ib-b b' + i); b.type = 'button'; b.appendChild(E('b', '', a)); b.appendChild(E('span', '', K[i])); b.addEventListener('click', function () { act(i); }); row.appendChild(b); });
      wrap.appendChild(hud); wrap.appendChild(stack); wrap.appendChild(pop); wrap.appendChild(row); c.root.appendChild(wrap);
      function draw() {
        hud.textContent = '♥'.repeat(lives) + '♡'.repeat(3 - lives) + '   Streak ×' + combo + '   Waiting: ' + q.length; stack.textContent = '';
        q.slice(0, 5).forEach(function (m, i) { var e = E('div', 'ib-c' + (i ? '' : ' first')); e.style.setProperty('--i', i); e.appendChild(E('span', '', m.ch + ' · ' + m.who)); if (!i) { e.appendChild(E('p', '', m.m[0])); e.appendChild(E('i', 'ib-t')); swipe(e); } stack.appendChild(e); });
      }
      function miss(why) { lives--; combo = 1; c.shake(); c.beep(150, .25); pop.textContent = why; pop.className = 'ib-pop bad'; void pop.offsetWidth; pop.classList.add('go'); if (lives <= 0) c.end(score, 'You handled ' + right + ' enquiries and reached level ' + lvl + '.'); }
      function spawn() { var i; do { i = Math.random() * M.length | 0; } while (i === last); last = i; q.push({ m: M[i], who: WHO[Math.random() * WHO.length | 0], ch: M[i][1] === 3 ? 'Unknown sender' : CH[Math.random() * CH.length | 0], t: Math.max(4.5, 9 - lvl * .5), max: Math.max(4.5, 9 - lvl * .5) }); }
      act = function (a) {
        var m = q[0], top = stack.firstChild; if (!m) return; q.shift(); if (top) { top.classList.add('fly', 'f' + a); }
        if (a === m.m[1]) { score += 10 * combo; right++; pop.textContent = '+' + 10 * combo + (combo > 1 ? '  ×' + combo : ''); pop.className = 'ib-pop'; void pop.offsetWidth; pop.classList.add('go'); combo = Math.min(5, combo + 1); c.beep(520 + combo * 70); c.score(score); if (right % 8 === 0) { lvl++; gap = Math.max(.75, gap * .84); c.level(lvl); } }
        else miss('That one needed: ' + A[m.m[1]]);
        setTimeout(draw, top ? 170 : 0);
      };
      function swipe(e) { var x0 = 0, y0 = 0, on = false; e.addEventListener('pointerdown', function (ev) { on = true; x0 = ev.clientX; y0 = ev.clientY; }); e.addEventListener('pointerup', function (ev) { if (!on) return; on = false; var dx = ev.clientX - x0, dy = ev.clientY - y0; if (Math.max(Math.abs(dx), Math.abs(dy)) < 34) return; act(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 3) : (dy < 0 ? 1 : 2)); }); }
      spawn(); draw(); c.level(1);
      c.loop(function (dt) {
        t += dt; if (t > gap) { t = 0; spawn(); if (q.length > 7) { q.shift(); miss('The inbox overflowed'); } draw(); }
        if (q[0]) { q[0].t -= dt; var b = stack.querySelector('.ib-t'); if (b) b.style.transform = 'scaleX(' + Math.max(0, q[0].t / q[0].max) + ')'; if (q[0].t <= 0) { q.shift(); miss('A lead went cold'); draw(); } }
      });
    },
    key: function (e) { var k = { ArrowRight: 0, ArrowUp: 1, ArrowDown: 2, ArrowLeft: 3, '1': 0, '2': 1, '3': 2, '4': 3 }[e.key]; if (k !== undefined && act) { e.preventDefault(); act(k); } }
  });
})();
