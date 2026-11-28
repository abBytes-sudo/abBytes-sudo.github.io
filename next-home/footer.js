/* The end of the page. "Let's build yours." attaches the visitor's own brief from the builder to the contact form (contact.js
   runs the form), shows New Delhi time, is the place the shared black hole (assets/blackhole.js) pulls every letter about
   (the form itself holds still), and ends on a footer that reads like a status line. Plain DOM. Motion only while on screen,
   none under reduced motion. */
(function () {
  'use strict';
  var d = document, sec = d.getElementById('contact');
  if (!sec) return;
  var $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function E(tag, cls, txt) { var e = d.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; }
  function seen(el, fn, th) { if (!el) return; if (!('IntersectionObserver' in window)) { fn(true); return; } new IntersectionObserver(function (es) { fn(es[es.length - 1].isIntersecting); }, { threshold: th || 0 }).observe(el); }

  /* ---- your brief: read from the builder, which restores the same saved setup (localStorage am-build, or a #b= link). It rides on
     the contact form as a small ticket, and contact.js gets the same reading through sec.ftBrief and an 'ft-brief' event ---- */
  var brief = $('#ft-brief');
  function source() {
    if (location.hash.indexOf('#b=') === 0) return 'from a shared link';
    try { if (localStorage.getItem('am-build')) return 'saved in this browser'; } catch (e) { /* private mode */ }
    return '';
  }
  function on(g) { return $$('#build [data-g="' + g + '"] button[aria-pressed="true"]'); }
  function set(s, t) { var e = $(s); if (e) e.textContent = t; }
  function render() {
    var src = source(), trade = on('trade')[0], has = !!(src && trade), info = { has: has };      // no card any more: the setup rides along quietly
    if (brief) brief.hidden = !has;
    if (has) {
      var name = (($('#biz') || {}).value || '').trim(), theme = on('theme')[0], mods = on('mods'), autos = on('autos').length;
      var pick = $('#build [data-g="color"] input[type="color"]'), col = pick && /^#[0-9a-f]{6}$/i.test(pick.value) ? pick.value.toLowerCase() : '#6a3df0';
      var weeks = ''; $$('#build .spec dt').forEach(function (dt) { if (/timeline/i.test(dt.textContent) && dt.nextElementSibling) weeks = dt.nextElementSibling.textContent.trim(); });
      if (brief) brief.style.setProperty('--fb', col);
      set('#ft-src', src); set('#ft-bn', name || 'Your business'); set('#ft-tr', trade.textContent.trim());
      set('#ft-th', theme ? theme.textContent.trim() + ' look' : 'Look to pick');
      set('#ft-mc', mods.length ? mods.length + (mods.length === 1 ? ' module' : ' modules') : 'no modules yet');
      /* the tiny preview: the look (atlas, blueprint, till, lobby or console), its colour, a menu icon and a row for each module */
      var mini = $('#ft-mini'), rail = $('#ft-ms'), rows = $('#ft-ml'), n = Math.max(1, mods.length), i, r;
      if (mini && rail && rows) {
        mini.dataset.th = theme ? theme.dataset.v : 'atlas';
        set('#ft-mu', (name.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'yourbusiness') + '.app');
        rail.textContent = ''; rows.textContent = '';
        for (i = 0; i < Math.min(n + 1, 8); i++) rail.appendChild(E('i'));
        for (i = 0; i < Math.min(n, 4); i++) { r = E('i'); r.style.setProperty('--w', [78, 54, 66, 42][i] + '%'); rows.appendChild(r); }
      }
      info = { has: true, src: src, name: name, trade: trade.dataset.v || '', tradeName: trade.textContent.trim(), look: theme ? theme.textContent.trim() + ' look' : '', mods: mods.map(function (m) { return m.dataset.v; }), autos: autos, weeks: weeks, color: col };
    }
    sec.ftBrief = info;
    if (typeof CustomEvent === 'function') sec.dispatchEvent(new CustomEvent('ft-brief', { detail: info }));
  }
  render();
  var q = 0;
  function later() { if (!q) q = requestAnimationFrame(function () { q = 0; render(); }); }
  var build = $('#build');
  if (build) ['click', 'input', 'change'].forEach(function (t) { build.addEventListener(t, later); });
  addEventListener('hashchange', later);
  d.addEventListener('DOMContentLoaded', render);

  /* ---- New Delhi time (IST is UTC+5:30 all year), ticking only while the section is on screen ---- */
  var tm = $('#ft-time'), hh = $('#ft-clock .ft-hh'), mh = $('#ft-clock .ft-mh'), lastM = -1, lastH = -1, turnM = 0, turnH = 0, iv = 0;
  function tick(hands) {
    if (!tm) return;
    var t = new Date(Date.now() + 19800000), h = t.getUTCHours(), m = t.getUTCMinutes();
    tm.textContent = (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' am' : ' pm');
    tm.setAttribute('datetime', (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + '+05:30');
    if (!hands || !hh || !mh) return;
    var ma = m * 6, ha = (h % 12) * 30 + m / 2;
    if (lastM >= 0 && ma < lastM) turnM++;
    if (lastH >= 0 && ha < lastH) turnH++;
    lastM = ma; lastH = ha;
    mh.style.setProperty('--a', (ma + turnM * 360) + 'deg');
    hh.style.setProperty('--a', (ha + turnH * 360) + 'deg');
  }
  tick(reduce);
  seen(sec, function (v) {
    if (v) { tick(true); if (!iv) iv = setInterval(function () { tick(true); }, 10000); }
    else if (iv) { clearInterval(iv); iv = 0; }
  });

  /* ---- the footer status line: the real date this page last changed, when the server says ---- */
  var up = $('#ft-upd'), lm = Date.parse(d.lastModified);
  if (up && lm && Math.abs(Date.now() - lm) > 120000) {
    var u = new Date(lm);
    up.textContent = u.getDate() + ' ' + MON[u.getMonth()] + ' ' + u.getFullYear();
    up.setAttribute('datetime', u.getFullYear() + '-' + ('0' + (u.getMonth() + 1)).slice(-2) + '-' + ('0' + u.getDate()).slice(-2));
  }
  var bar = $('.ft-bar');
  seen(bar, function (v) { bar.classList.toggle('ft-v', v && !reduce); });

  /* the small black hole that pulls this section's letters about is shared now: assets/blackhole.js, switched on by data-bh on
     #contact and on the footer bar (data-bh-strong on the headline, data-bh-still on the form and the summary). */
})();
