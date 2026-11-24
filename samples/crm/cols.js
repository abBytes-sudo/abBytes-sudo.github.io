/* Lumen CRM Pro — column choice on the big list tables (contacts, companies, deals, lead inbox, quotes, tickets, products,
   campaigns). A "Columns" button in the page header opens a small menu; the choice is remembered per list. Works on whatever
   table the page rendered, so filters and sorting keep working. */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$;
  var LISTS = { contacts: 1, companies: 1, deals: 1, inbox: 1, quotes: 1, tickets: 1, products: 1, campaigns: 1 };
  function key() { var n = C.cur && C.cur.name; return LISTS[n] && !C.cur.arg ? n : null; }
  function hidden(k) { var p = C.prefs(); p.cols = p.cols || {}; return p.cols[k] || []; }
  function table() { var t = $('#view .tablewrap > table.tbl'); return t && !t.classList.contains('litbl') && !t.classList.contains('mini') && $$('thead th', t).length >= 5 ? t : null; }
  function label(th) { var b = th.querySelector('button'); return ((b || th).textContent || '').replace(/[↑↓▲▼]/g, '').replace(/\s+/g, ' ').trim(); }
  function heads(t) { return $$('thead th', t).map(function (th, i) { return { i: i, th: th, label: label(th), fixed: i === 0 || th.classList.contains('c-sel') || !label(th) }; }); }
  function firstData(hs) { for (var i = 0; i < hs.length; i++) if (!hs[i].th.classList.contains('c-sel') && hs[i].label) return hs[i].i; return 0; }

  var queued = false;
  function apply() {
    queued = false;
    var k = key(), t = k && table(), btn = $('#cols-b');
    if (!k || !t) { if (btn) btn.remove(); return; }
    var hs = heads(t), main = firstData(hs), hid = hidden(k);
    hs.forEach(function (h) { h.fixed = h.fixed || h.i === main; });
    $$('tr', t).forEach(function (tr) {
      if (tr.children.length !== hs.length) return;
      hs.forEach(function (h) { var cell = tr.children[h.i]; if (cell) cell.classList.toggle('col-h', !h.fixed && hid.indexOf(h.label) > -1); });
    });
    var acts = $('#view .page-a');
    if (acts && !btn) {
      var b = document.createElement('button'); b.type = 'button'; b.id = 'cols-b'; b.className = 'btn'; b.setAttribute('data-act', 'cols-open'); b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-expanded', 'false');
      b.innerHTML = C.ic('filter', 14) + '<span>Columns</span>'; acts.insertBefore(b, acts.firstChild);
    }
  }
  function schedule() { if (queued) return; queued = true; (window.requestAnimationFrame || setTimeout)(apply, 0); }
  function boot() { var v = $('#view'); if (!v) return; new MutationObserver(schedule).observe(v, { childList: true, subtree: true }); schedule(); }
  C.onRoute = (function (prev) { return function (n, a) { if (prev) prev(n, a); schedule(); }; })(C.onRoute);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  // ---- the menu ---------------------------------------------------------------------------------------------------------
  function close(focus) { var m = $('#cols-pop'); if (m) m.remove(); var b = $('#cols-b'); if (b) { b.setAttribute('aria-expanded', 'false'); if (focus) b.focus(); } }
  C.acts['cols-open'] = function (el) {
    if ($('#cols-pop')) { close(true); return; }
    var k = key(), t = table(); if (!k || !t) return;
    var hs = heads(t), main = firstData(hs), hid = hidden(k), opts = hs.filter(function (h) { return !h.fixed && h.i !== main; });
    var m = document.createElement('div'); m.id = 'cols-pop'; m.className = 'colmenu'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Choose columns');
    m.innerHTML = '<div class="cm-h"><b>Columns</b><button type="button" class="lnk sm" data-act="cols-reset">Show all</button></div><ul>' + opts.map(function (h, n) { return '<li><label class="chk"><input type="checkbox" data-ch="cols-tog" data-l="' + esc(h.label) + '"' + (hid.indexOf(h.label) < 0 ? ' checked' : '') + '> ' + esc(h.label) + '</label></li>'; }).join('') + '</ul><p class="cm-n">The first column always shows. Your choice is remembered for this list.</p>';
    document.body.appendChild(m);
    var r = el.getBoundingClientRect(); m.style.top = (r.bottom + 6) + 'px'; m.style.left = Math.max(8, Math.min(r.right - m.offsetWidth, innerWidth - m.offsetWidth - 8)) + 'px';
    el.setAttribute('aria-expanded', 'true'); var f = m.querySelector('input'); if (f) f.focus();
  };
  C.chs['cols-tog'] = function (el) {
    var k = key(); if (!k) return; var p = C.prefs(); p.cols = p.cols || {}; var L = (p.cols[k] || []).slice(), l = el.dataset.l, i = L.indexOf(l);
    if (el.checked && i > -1) L.splice(i, 1); if (!el.checked && i < 0) L.push(l);
    p.cols[k] = L; C.savePrefs(); apply();
  };
  C.acts['cols-reset'] = function () { var k = key(); if (!k) return; var p = C.prefs(); p.cols = p.cols || {}; p.cols[k] = []; C.savePrefs(); $$('#cols-pop input').forEach(function (i) { i.checked = true; }); apply(); };
  document.addEventListener('click', function (e) { if ($('#cols-pop') && !e.target.closest('#cols-pop,#cols-b')) close(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#cols-pop')) { e.stopPropagation(); close(true); } }, true);
  window.addEventListener('resize', function () { close(false); });
})();
