/* Your showroom: the "See it as your showroom" panel, and the page chrome (name, monogram, nav, crumbs, title, footer)
   while a showroom name is on. The state and the stock filter live in app.js (revv:brand), so pages draw the right stock first time. */
(function () {
  'use strict';
  var R = window.Revv, D = window.REVV_DATA; if (!R || R.isBack || !D) return;
  var $ = R.$, $$ = R.$$, esc = R.esc, b = R.shop();
  var SW = [['#FF5B1F', 'Orange'], ['#3DDC97', 'Green'], ['#4F8CFF', 'Blue'], ['#F5C518', 'Amber'], ['#E5484D', 'Red'], ['#B78AF7', 'Violet'], ['#2EC4B6', 'Teal']];
  var TOWNS = Object.keys(D.RTO).sort();

  // ---------- page chrome while a showroom name is on ----------
  function hide(el) { el.setAttribute('data-shop-hide', ''); }
  function chrome() {
    if (!b) return;
    var logo = $('.hdr .logo');
    if (logo) { logo.setAttribute('href', 'showroom.html'); logo.setAttribute('aria-label', b.name + ', home'); logo.innerHTML = '<span class="bm" aria-hidden="true">' + esc(b.name.charAt(0).toUpperCase()) + '</span><span class="bn">' + esc(b.name) + '</span>'; }
    $$('a[href="index.html"]').forEach(function (a) { a.setAttribute('href', 'showroom.html'); if (a.textContent.trim() === 'Revv') a.textContent = b.name; });
    $$('a[href="listings.html?type=bike"]').forEach(function (a) { if (b.deals === 'cars') hide(a); else if (/superbikes/i.test(a.textContent)) a.textContent = 'Bikes'; });
    $$('a[href="listings.html?type=car"]').forEach(function (a) { if (b.deals === 'bikes') hide(a); });
    $$('.nav a[href="dealers.html"], .menu a[href="dealers.html"], .menu a[href="admin.html"], .nav a[href="for-dealers.html"], .menu a[href="for-dealers.html"]').forEach(hide);
    document.title = document.title.replace(/Revv/g, b.name);
    $$('.credits span').forEach(function (s, i, all) { if (s === s.parentNode.lastElementChild && s.textContent.indexOf('©') === 0) s.textContent = '© ' + b.name + ', ' + b.city + '. Runs on Revv, a portfolio project by Abhishek.'; });
  }

  // ---------- the panel ----------
  var pill, box, prevColour = b ? b.colour : null;
  function swatches(cur) {
    var known = SW.some(function (s) { return s[0].toLowerCase() === (cur || '').toLowerCase(); });
    return SW.map(function (s) { return '<label title="' + s[1] + '" style="--c:' + s[0] + '"><input type="radio" name="bp-c" value="' + s[0] + '" aria-label="' + s[1] + '"' + (s[0].toLowerCase() === (cur || '#FF5B1F').toLowerCase() ? ' checked' : '') + '><span></span></label>'; }).join('') +
      '<label class="own"><input type="radio" name="bp-c" value="own" aria-label="Your own colour"' + (cur && !known ? ' checked' : '') + ' style="position:absolute;opacity:0;width:1px;height:1px"><input type="color" id="bp-own" value="' + (cur && !known ? cur : '#7A5CFF') + '" aria-label="Pick your own colour">Your own</label>';
  }
  function build() {
    // the way in: a header button on wide screens, a line in the phone menu, or any [data-open-brand] element
    pill = document.createElement('button'); pill.type = 'button'; pill.className = 'bp-hb'; pill.setAttribute('aria-expanded', 'false'); pill.setAttribute('aria-controls', 'bp');
    pill.setAttribute('aria-label', b ? 'Your showroom: ' + b.name : 'See it as your showroom'); pill.title = b ? 'Your showroom' : 'See it as your showroom';
    pill.innerHTML = '<span class="dot" aria-hidden="true"></span><span class="t" aria-hidden="true">' + (b ? 'Your showroom' : 'Your showroom?') + '</span>';
    var hr = $('.hdr .hdr-r'); if (hr) hr.insertBefore(pill, hr.firstChild); else { pill.classList.add('float'); }
    var mn = $('#menu nav'); if (mn) { var ml = document.createElement('a'); ml.href = '#your-showroom'; ml.setAttribute('data-open-brand', ''); ml.className = 'bp-ml'; ml.textContent = b ? 'Your showroom' : 'See it as your showroom'; mn.appendChild(ml); }
    box = document.createElement('section'); box.className = 'bp'; box.id = 'bp'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-labelledby', 'bp-h');
    var cur = b || { name: '', city: 'Jaipur', colour: '#FF5B1F', deals: 'cars' };
    box.innerHTML = '<div class="bp-h"><h2 id="bp-h">' + (b ? 'Your showroom' : 'Your name on it') + '</h2><button type="button" class="x" data-bp-close aria-label="Close">×</button></div>' +
      '<p class="bp-sub">' + (b ? 'This is how buyers see <b>' + esc(b.name) + '</b>: your name, your colour, only your stock. Change anything, or send the link.' : 'See this marketplace as your own showroom: your name, your colour, only your stock, with the same reports, exchange and finance underneath.') + '</p>' +
      '<form id="bp-f" novalidate>' +
      '<div class="fld"><label for="bp-name">Showroom name</label><input class="inp" id="bp-name" maxlength="32" autocomplete="organization" placeholder="Sharma Motors" value="' + esc(cur.name) + '" aria-describedby="bp-name-e"><p class="ferr" id="bp-name-e"></p></div>' +
      '<div class="fld"><label for="bp-city">City</label><select class="sel" id="bp-city">' + TOWNS.map(function (t) { return '<option' + (t === cur.city ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select></div>' +
      '<fieldset><legend>Colour</legend><div class="sw" id="bp-sw">' + swatches(cur.colour) + '</div></fieldset>' +
      '<fieldset><legend>You sell</legend><div class="seg3">' + [['cars', 'Cars'], ['bikes', 'Bikes'], ['both', 'Both']].map(function (o) { return '<label><input type="radio" name="bp-d" value="' + o[0] + '"' + (cur.deals === o[0] ? ' checked' : '') + '><span>' + o[1] + '</span></label>'; }).join('') + '</div></fieldset>' +
      '<button class="btn" type="submit">' + (b ? 'Update my showroom' : 'Show my showroom') + ' <span class="ar" aria-hidden="true">→</span></button></form>' +
      (b ? '<div class="bp-out"><p>Anyone who opens this link sees ' + esc(b.name) + ', with your stock and colour.</p><input class="bp-link" id="bp-link" readonly aria-label="Your showroom link" value="' + esc(R.brandLink(b)) + '">' +
        '<div class="bp-row"><button type="button" class="btn sm" data-bp-copy>Copy link</button><button type="button" class="btn ghost sm" data-bp-back>Back to Revv</button></div></div>' : '');
    if (!hr) document.body.appendChild(pill); document.body.appendChild(box);
    pill.addEventListener('click', function () { box.hidden ? open() : close(); });
    box.addEventListener('click', onClick);
    box.addEventListener('change', onChange);
    box.addEventListener('input', function (e) { if (e.target.id === 'bp-own') { var r = box.querySelector('[name=bp-c][value=own]'); r.checked = true; R.paint(e.target.value); } });
    $('#bp-f', box).addEventListener('submit', onSubmit);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !box.hidden) { close(); pill.focus(); } });
    document.addEventListener('click', function (e) { if (!box.hidden && !box.contains(e.target) && e.target !== pill && !pill.contains(e.target) && !e.target.closest('[data-open-brand]')) close(); });
    document.addEventListener('click', function (e) { var t = e.target.closest('[data-open-brand]'); if (!t) return; e.preventDefault(); var mb = $('#mbtn'); if (mb && mb.getAttribute('aria-expanded') === 'true') mb.click(); open(); });
    if (/^#your-showroom$/.test(location.hash)) open();
  }
  function colour() { var r = box.querySelector('[name=bp-c]:checked'); return !r ? '#FF5B1F' : r.value === 'own' ? $('#bp-own', box).value : r.value; }
  function open() { box.hidden = false; pill.setAttribute('aria-expanded', 'true'); document.body.classList.add('bp-open'); var n = $('#bp-name', box); setTimeout(function () { n.focus(); }, 30); }
  function close() { box.hidden = true; pill.setAttribute('aria-expanded', 'false'); document.body.classList.remove('bp-open'); if (prevColour) R.paint(prevColour); else { var s = document.documentElement.style; ['--sig', '--sig-d', '--sig-hi', '--sig-rgb', '--on-sig'].forEach(function (k) { s.removeProperty(k); }); } }
  function onChange(e) { if (e.target.name === 'bp-c') R.paint(colour()); }
  function onClick(e) {
    if (e.target.closest('[data-bp-close]')) { close(); pill.focus(); return; }
    if (e.target.closest('[data-bp-copy]')) {
      var link = $('#bp-link', box).value, done = function () { R.toast('Link copied. Anyone who opens it sees ' + esc(b.name) + '.'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, function () { $('#bp-link', box).select(); R.toast('Press Ctrl+C or ⌘C to copy the selected link.'); });
      else { $('#bp-link', box).select(); R.toast('Press Ctrl+C or ⌘C to copy the selected link.'); }
      return;
    }
    if (e.target.closest('[data-bp-back]')) { R.setBrand(null); location.href = /showroom\.html$/.test(location.pathname) ? 'index.html' : location.href.split('#')[0]; }
  }
  function onSubmit(e) {
    e.preventDefault();
    var n = $('#bp-name', box), err = $('#bp-name-e', box), name = n.value.trim();
    if (name.length < 2) { n.setAttribute('aria-invalid', 'true'); err.textContent = 'Give the showroom a name, at least two letters.'; n.focus(); return; }
    var nb = R.setBrand({ name: name, city: $('#bp-city', box).value, colour: colour(), deals: (box.querySelector('[name=bp-d]:checked') || {}).value || 'both' });
    if (!nb) return;
    prevColour = nb.colour;
    if (/showroom\.html$/.test(location.pathname)) location.replace('showroom.html'); else location.href = 'showroom.html';
  }

  chrome();
  if (document.body && !document.body.hasAttribute('data-no-panel')) build();
})();
