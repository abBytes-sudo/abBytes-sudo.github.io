/* Interiors CRM / ERP hero: the client's phone. A faithful copy of the quote link (three rooms, twelve lines,
   fees and GST, the payment schedule) that the reader can scroll, open and accept. Accepting signs the line,
   stamps the quote and plays the studio's side: one Convert to Project and the six-row plan appears.
   Works by touch, mouse and keyboard; with reduced motion every state is shown at once. */
(function () {
  'use strict';
  var d = document, qp = d.getElementById('qp');
  if (!qp) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var pg = d.getElementById('qp-pg'), acc = d.getElementById('q-accept'), done = d.getElementById('q-done'), when = d.getElementById('q-time');
  var stamp = d.getElementById('q-stamp'), sign = qp.querySelector('.q-sign'), crm = d.getElementById('qp-crm');
  var pill = d.getElementById('qc-pill'), head = d.getElementById('qc-h'), plan = d.getElementById('qc-plan'), again = d.getElementById('qc-again');
  var btnText = crm ? crm.querySelector('.qc-btn span') : null;
  var timers = [], won = false;
  function $$(s, r) { return [].slice.call((r || qp).querySelectorAll(s)); }
  function later(fn, ms) { if (reduce) { fn(); return; } timers.push(setTimeout(fn, ms)); }
  function panel(btn) { return d.getElementById(btn.getAttribute('aria-controls')); }

  qp.classList.add('js');
  if (plan) plan.setAttribute('aria-hidden', 'true');

  /* rooms open and close; lines open to show their rate-card entry */
  function setOpen(btn, open, anim) {
    btn.setAttribute('aria-expanded', String(open));
    var p = panel(btn); if (!p) return;
    p.hidden = !open;
    if (open && anim && !reduce) { p.classList.remove('in'); void p.offsetWidth; p.classList.add('in'); }
  }
  $$('.q-sec').forEach(function (b) {
    b.addEventListener('click', function () { setOpen(b, b.getAttribute('aria-expanded') !== 'true', false); });
  });
  $$('.q-line').forEach(function (b) {
    b.addEventListener('click', function () { setOpen(b, b.getAttribute('aria-expanded') !== 'true', true); });
  });

  function stampTime() {
    var t = new Date(), hh = ('0' + t.getHours()).slice(-2), mm = ('0' + t.getMinutes()).slice(-2);
    return t.getDate() + ' ' + MON[t.getMonth()] + ' ' + t.getFullYear() + ', ' + hh + ':' + mm;
  }

  function accept() {
    if (won) return;
    won = true;
    var at = stampTime();
    acc.setAttribute('aria-disabled', 'true');
    acc.textContent = 'Accepted ✓';
    if (sign) sign.classList.add('on');
    later(function () {
      if (stamp) { stamp.hidden = false; if (!reduce) stamp.classList.add('in'); }
      if (when) when.textContent = at;
      if (done) done.hidden = false;
    }, 900);
    if (!crm) return;
    later(function () {
      crm.classList.add('st1');
      if (pill) pill.textContent = 'Accepted · ' + at.split(', ')[1];
      /* on a phone-width screen the studio's side sits under the phone: bring it into view */
      if (innerWidth <= 620) {
        var r = crm.getBoundingClientRect();
        if (r.top > innerHeight * .55) crm.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      }
    }, 1100);
    later(function () { crm.classList.add('st2'); }, 1700);
    later(function () {
      crm.classList.remove('st2'); crm.classList.add('st3');
      if (btnText) btnText.textContent = 'Converted to a project';
      if (head) head.textContent = 'PRJ-2026-108 · Three rooms, turnkey';
      if (plan) plan.removeAttribute('aria-hidden');
      if (again) again.hidden = false;
    }, 2200);
  }

  function reset() {
    timers.forEach(clearTimeout); timers = [];
    won = false;
    acc.removeAttribute('aria-disabled'); acc.textContent = 'Accept Proposal';
    if (sign) sign.classList.remove('on');
    if (stamp) { stamp.hidden = true; stamp.classList.remove('in'); }
    if (done) done.hidden = true;
    if (crm) crm.classList.remove('st1', 'st2', 'st3');
    if (pill) pill.textContent = 'Sent · waiting for the client';
    if (btnText) btnText.textContent = 'Convert to Project';
    if (head) head.textContent = 'QT-2026-212 · Three rooms, turnkey';
    if (plan) plan.setAttribute('aria-hidden', 'true');
    if (again) again.hidden = true;
    $$('.q-line').forEach(function (b) { setOpen(b, false, false); });
    $$('.q-sec').forEach(function (b, i) { setOpen(b, i === 0, false); });
    if (pg) { pg.scrollTop = 0; pg.focus({ preventScroll: true }); }
  }

  acc.addEventListener('click', accept);
  if (again) again.addEventListener('click', reset);
})();
