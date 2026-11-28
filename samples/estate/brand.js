/* Fieldwise — "see it with your name on it".
   A link like product.html#brand=Sharma%20Realty|Pune|1E7A4C (name | city | route colour) shows the page about the app,
   the app and the field app as that brokerage: its name where the brokerage is named, its city in the office lines and
   its colour on every route. The app keeps the hash for its routes, so there the same three parts can also ride in the
   query: index.html?brand=…#/leads. With no brand, nothing here changes anything on the page.
   This file runs before first paint (it is tiny and blocking on purpose) so the visitor never sees the other name first. */
(function () {
  'use strict';
  var KEY = 'fieldwise-brand-v1', d = document, de = d.documentElement, DEF = { name: 'Amaltas Estates', city: 'Green Park', hex: '#B9472A' };
  var SW = [['#B9472A', 'Terracotta'], ['#3B5BDB', 'Indigo'], ['#1E7A4C', 'Forest'], ['#8A3FA0', 'Plum'], ['#0F7B6C', 'Teal'], ['#B7791F', 'Mustard']];
  function clean(s, n) { return String(s == null ? '' : s).replace(/[<>&"'`\\\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, n); }
  function parse(raw) {
    if (!raw) return null; raw = String(raw).replace(/%7C/gi, '|'); var p = raw.split('|'), name = '', city = '';
    try { name = clean(decodeURIComponent(p[0] || ''), 32); city = clean(decodeURIComponent(p[1] || ''), 24); } catch (e) { return null; }
    var hex = /^[0-9a-f]{6}$/i.test(p[2] || '') ? '#' + p[2].toUpperCase() : DEF.hex;
    return name.length >= 2 ? { name: name, city: city || 'your city', hex: hex } : null;
  }
  function stored() { try { var b = JSON.parse(localStorage.getItem(KEY) || 'null'); return b && b.name ? parse([encodeURIComponent(b.name), encodeURIComponent(b.city || ''), String(b.hex || '').replace('#', '')].join('|')) : null; } catch (e) { return null; } }
  function save(b) { try { if (b) localStorage.setItem(KEY, JSON.stringify(b)); else localStorage.removeItem(KEY); } catch (e) { /* private mode: the link still works for this page */ } }

  /* a brand that arrives in the address wins, is remembered, and is then taken out of the address bar */
  var mh = /^#brand=([^#]*)$/.exec(location.hash), mq = /[?&]brand=([^&#]*)/.exec(location.search), b = null;
  if (mh || mq) {
    b = parse(mh ? mh[1] : mq[1]);
    if (b) save(b);
    try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])brand=[^&#]*&?/, '$1').replace(/[?&]$/, '') + (mh ? '' : location.hash)); } catch (e) { /* file: or sandboxed */ }
  }
  if (!b) b = stored();

  /* the route colour must still read as a line on map paper: darken a colour that is too pale */
  function lum(h) { var c = h.replace('#', ''), L = [0, 2, 4].map(function (i) { var v = parseInt(c.substr(i, 2), 16) / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * L[0] + .7152 * L[1] + .0722 * L[2]; }
  function ink(h) { var c = h.replace('#', ''), n = 0; while (lum('#' + c) > .34 && n++ < 12) c = [0, 2, 4].map(function (i) { return ('0' + Math.round(parseInt(c.substr(i, 2), 16) * .9).toString(16)).slice(-2); }).join(''); return '#' + c.toUpperCase(); }
  function short(name) { var s = name.replace(/\s+(Estates?|Realty|Realtors?|Properties|Property|Homes|Housing|Associates|Group|Consultants?|Pvt\.?|Ltd\.?|LLP|& Co\.?)\s*$/i, '').trim(); return s || name; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  var on = !!b, route = on ? ink(b.hex) : DEF.hex, sh = on ? short(b.name) : 'Amaltas';
  /* text drawn by the app: the brokerage's name, wherever the example brokerage was named (HTML strings, already escaped) */
  function text(s) {
    if (!on || typeof s !== 'string' || s.indexOf('Amaltas') < 0 && s.indexOf('Green Park') < 0) return s;
    var N = esc(b.name), S = esc(sh), C = esc(b.city);
    return s.replace(/Amaltas Estates/g, N).replace(/Amaltas office/g, S + ' office').replace(/Amaltas/g, S).replace(/Green Park, New Delhi/g, C).replace(/Green Park office/g, C + ' office');
  }
  function paint(hex) {
    var r = ink(hex); de.style.setProperty('--route', r);
    [].forEach.call(d.querySelectorAll('[stroke="#B9472A"],[stroke="#E27A57"],[data-fwb-stroke]'), function (n) { n.setAttribute('data-fwb-stroke', ''); n.setAttribute('stroke', r); });
  }
  /* the static parts of each page (the app's shell, the page about the app, the field app's frame) */
  function apply() {
    if (!on) return;
    de.classList.add('branded'); paint(b.hex);
    var q = function (s) { return d.querySelector(s); }, all = function (s) { return [].slice.call(d.querySelectorAll(s)); }, t;
    if ((t = q('.brand-t b'))) t.textContent = b.name;                                   // app sidebar
    if ((t = q('#brand-sub'))) t.textContent = 'Fieldwise · ' + b.city;
    if ((t = q('.crumb .muted'))) t.textContent = b.name;
    if ((t = q('#ssr-p'))) t.textContent = b.name + ' · ' + b.city + ' office';
    all('.credit, .side .credit, p.muted.xs').forEach(function (p) { if (/©\s*Amaltas Estates/.test(p.textContent)) p.textContent = '© ' + b.name + '. Runs on Fieldwise, a portfolio project by Abhishek. Photos: Unsplash.'; });
    if ((t = q('.rules-cap'))) { t.textContent = ''; var s = d.createElement('b'); s.textContent = 'Four rules it never forgets.'; t.appendChild(s); t.appendChild(d.createTextNode(' Set up for ' + b.name + ', ' + b.city + '. The homes and the map on this page are a South Delhi book.')); }
    if ((t = q('.hero-c .lbl'))) t.textContent = 'Brokerage CRM · ' + b.city;           // page about the app
    if ((t = q('.end .lbl'))) t.textContent = 'Last stop · ' + b.name + '’s door';
    if ((t = q('.nav .logo')) && !q('.fwb-for')) { var f = d.createElement('button'); f.type = 'button'; f.className = 'fwb-for'; f.setAttribute('data-open-brand', ''); f.setAttribute('aria-haspopup', 'dialog'); f.setAttribute('aria-expanded', 'false'); f.textContent = 'for ' + b.name; t.insertAdjacentElement('afterend', f); }
    if (d.title.indexOf('Amaltas Estates') >= 0) d.title = d.title.replace('Amaltas Estates', b.name); else if (/^Fieldwise —/.test(d.title)) d.title = d.title.replace(/^Fieldwise —/, 'Fieldwise for ' + b.name + ' —');
  }
  function part(x) { return [encodeURIComponent(x.name), encodeURIComponent(x.city), x.hex.replace('#', '')].join('|'); }
  /* the link for where the visitor is now: #brand= on a page or the app's start, ?brand=…#/route on any other app route */
  function link(x) {
    x = x || b; if (!x) return location.href;
    var base = location.origin + location.pathname, h = location.hash;
    return h && h !== '#/today' && /^#\//.test(h) ? base + '?brand=' + part(x) + h : base + '#brand=' + part(x);
  }
  window.FWB = { on: on, brand: b, name: on ? b.name : DEF.name, short: sh, city: on ? b.city : DEF.city, text: text, apply: apply, link: link, paint: paint };
  apply();
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', apply);

  /* ---------- the panel: "See it as yours" ---------- */
  var box = null, opener = null, cssIn = false;
  function css() { if (cssIn) return; cssIn = true; var l = d.createElement('link'); l.rel = 'stylesheet'; l.href = 'brand.css?v=1'; d.head.appendChild(l); }
  function build() {
    css();
    var cur = b || { name: '', city: '', hex: DEF.hex }, known = SW.some(function (s) { return s[0] === cur.hex; });
    box = d.createElement('section'); box.className = 'fwb'; box.id = 'fwb'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'false'); box.setAttribute('aria-labelledby', 'fwb-h');
    box.innerHTML = '<div class="fwb-top"><p class="fwb-k">Your brokerage</p><button type="button" class="fwb-x" data-fwb="close" aria-label="Close">×</button></div>' +
      '<h2 id="fwb-h">' + (on ? esc(b.name) + ', on Fieldwise' : 'Your name on it') + '</h2>' +
      '<p class="fwb-sub">' + (on ? 'This is how your team would see it: your name in the app, your colour on every route. Change anything, or send the link.' : 'See Fieldwise as your own brokerage: your name in the app and on the field phone, your colour on every route.') + '</p>' +
      '<form id="fwb-f" novalidate><label class="fwb-fl" for="fwb-n">Brokerage name</label><input id="fwb-n" class="fwb-in" maxlength="32" autocomplete="organization" placeholder="Sharma Realty" value="' + esc(cur.name) + '" aria-describedby="fwb-e"><p class="fwb-e" id="fwb-e" role="alert"></p>' +
      '<label class="fwb-fl" for="fwb-c">City</label><input id="fwb-c" class="fwb-in" maxlength="24" autocomplete="address-level2" placeholder="Pune" value="' + esc(on ? cur.city : '') + '">' +
      '<fieldset class="fwb-sw"><legend>Route colour</legend><div>' + SW.map(function (s) { return '<label title="' + s[1] + '" style="--c:' + s[0] + '"><input type="radio" name="fwb-col" value="' + s[0] + '" aria-label="' + s[1] + '"' + (s[0] === cur.hex || (!known && s[0] === DEF.hex && !on) ? ' checked' : '') + '><span></span></label>'; }).join('') +
      '<label class="fwb-own"><input type="radio" name="fwb-col" value="own" aria-label="Your own colour"' + (on && !known ? ' checked' : '') + '><input type="color" id="fwb-own" value="' + (on && !known ? cur.hex : '#2E5E8C') + '" aria-label="Pick your own colour"><span>Your own</span></label></div></fieldset>' +
      '<button type="submit" class="fwb-go">' + (on ? 'Update' : 'Show it as mine') + '<span aria-hidden="true"> →</span></button></form>' +
      (on ? '<div class="fwb-out"><p>Anyone who opens this link sees ' + esc(b.name) + '.</p><input class="fwb-in fwb-link" id="fwb-link" readonly aria-label="Your link" value="' + esc(link()) + '"><div class="fwb-row"><button type="button" class="fwb-go sm" data-fwb="copy">Copy link</button><button type="button" class="fwb-back" data-fwb="back">Back to Fieldwise</button></div><p class="fwb-ok" id="fwb-ok" aria-live="polite"></p></div>' : '');
    d.body.appendChild(box);
    function colour() { var r = box.querySelector('[name=fwb-col]:checked'); return !r ? DEF.hex : r.value === 'own' ? box.querySelector('#fwb-own').value.toUpperCase() : r.value; }
    box.addEventListener('change', function (e) { if (e.target.name === 'fwb-col') paint(colour()); });
    box.addEventListener('input', function (e) { if (e.target.id === 'fwb-own') { box.querySelector('[name=fwb-col][value=own]').checked = true; paint(e.target.value); } });
    box.querySelector('#fwb-f').addEventListener('submit', function (e) {
      e.preventDefault(); var n = clean(box.querySelector('#fwb-n').value, 32), c = clean(box.querySelector('#fwb-c').value, 24), err = box.querySelector('#fwb-e');
      if (n.length < 2) { err.textContent = 'Give your brokerage a name, at least two letters.'; box.querySelector('#fwb-n').setAttribute('aria-invalid', 'true'); box.querySelector('#fwb-n').focus(); return; }
      var x = { name: n, city: c || 'your city', hex: colour() }; save(x); location.href = link(x); if (location.hash.indexOf('#brand=') === 0 || /[?&]brand=/.test(location.search)) location.reload();
    });
    box.addEventListener('click', function (e) {
      var a = e.target.closest('[data-fwb]'); if (!a) return; var k = a.getAttribute('data-fwb');
      if (k === 'close') close();
      if (k === 'back') { save(null); location.href = location.pathname + (/^#\//.test(location.hash) ? location.hash : ''); location.reload(); }
      if (k === 'copy') { var f = box.querySelector('#fwb-link'), ok = box.querySelector('#fwb-ok'), done = function () { ok.textContent = 'Copied. Paste it into a message.'; };
        f.value = link(); f.select(); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(f.value).then(done, function () { try { d.execCommand('copy'); done(); } catch (er) { ok.textContent = 'Select the link and copy it.'; } }); else { try { d.execCommand('copy'); done(); } catch (er) { ok.textContent = 'Select the link and copy it.'; } } }
    });
  }
  function open(from) { if (!box) build(); opener = from || null; box.hidden = false; var l = box.querySelector('#fwb-link'); if (l) l.value = link(); setTimeout(function () { var n = box.querySelector('#fwb-n'); if (n) n.focus(); }, 30); if (opener) opener.setAttribute('aria-expanded', 'true'); }
  function close() { if (!box || box.hidden) return; box.hidden = true; if (b) paint(b.hex); else { de.style.removeProperty('--route'); [].forEach.call(d.querySelectorAll('[data-fwb-stroke]'), function (n) { n.setAttribute('stroke', n.closest('.logo, .brand') ? '#E27A57' : '#B9472A'); }); } if (opener) { opener.setAttribute('aria-expanded', 'false'); opener.focus(); } }
  window.FWB.open = open;
  d.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-open-brand]'); if (t) { e.preventDefault(); if (box && !box.hidden) close(); else open(t); return; }
    if (box && !box.hidden && !box.contains(e.target)) close();
  });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box && !box.hidden) { e.stopPropagation(); close(); } }, true);
})();
