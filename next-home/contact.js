/* The contact form at the foot of the page. It starts short (name, email, phone with a country code, the best way to reach
   you, and what you need) and writes the message for the visitor from what they have already done here: the needs they tap,
   the system they configured in the builder (sent as studio.js's own summary and #b= link), the mess they threw into the hero,
   the project they came back from and how they like to be reached. The draft follows their choices until they type over it.
   The Services page opens it pre-filled with the visitor's whole estimate list:
     index.html?pick=website:standard,crm:starter&addon=care,seo-setup#contact
   pick = service[:package], comma separated (website, crm, automation, assistant, erp, seo : starter, standard, custom);
   addon = care, analytics, gbp, whatsapp-api, speed, seo-setup, seo-content, comma separated. The needs are ticked; one shared
   package ticks the Package row, different ones are listed per service under the needs; the draft names all of it.
   urgent=1 ticks "Urgent build" (a checkbox beside the packages), and the draft asks what an urgent build would take.
   The older single form still works: ?service=crm&tier=standard (service takes a comma list, tier also takes unsure).
   It sends to my inbox through Web3Forms (fetch, JSON), then shows a thank-you that sums up what was sent, or an error that
   keeps the message and offers email instead. Contact details are remembered in this browser for next time.
   Countries come from countries.js (local data). Plain DOM, no inline styles (CSP); calm motion, none under reduced motion. */
(function () {
  'use strict';
  var d = document, f = d.getElementById('cf'), sec = d.getElementById('contact');
  if (!f || !sec || !window.fetch || !window.JSON) return;            // the email address beside the form stays the way in
  var KEY = 'a97e9109-fa83-484f-8a86-9b3b484e08dc', API = 'https://api.web3forms.com/submit', MAIL = 'contact.abbytes@gmail.com', MEM = 'am-contact';
  var $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nm = $('#cf-name'), em = $('#cf-email'), ph = $('#cf-phone'), phOpt = $('#cf-phone-opt'), msg = $('#cf-msg'), msgW = $('#cf-msgw'), rew = $('#cf-rew'), more = $('#cf-more'), xb = $('#cf-xb');
  var cc = $('#cf-cc'), ccp = $('#cf-ccp'), ccq = $('#cf-ccq'), ccl = $('#cf-ccl'), ccn = $('#cf-ccn');
  var send = $('#cf-send'), sl = $('#cf-sl'), st = $('#cf-st'), fail = $('#cf-fail'), att = $('#cf-att'), hi = $('#cf-hi'), rt = $('#cf-rt'), ok = $('#cf-ok'), hp = $('input[name="botcheck"]', f);
  var busy = false, auto = true, last = '', told = false, came = null, extras = [], pk = {}, seo = '', HI = hi ? hi.textContent : '', addP = $('#cf-add'), SEO = 'SEO content + sitemaps';
  function E(tag, cls, txt) { var e = d.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; }
  function mem(k, v, sess) {            // localStorage (or sessionStorage), JSON, never throws: private mode and blocked storage just forget
    try { var S = sess ? sessionStorage : localStorage; if (v === undefined) return JSON.parse(S.getItem(k) || 'null'); if (v === null) S.removeItem(k); else S.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ }
    return null;
  }
  function and(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function first() { return nm.value.trim().split(/\s+/)[0] || ''; }
  function pref() { var r = $('#cf-pref input:checked'); return r ? r.value : ''; }

  /* ---- what the visitor has already done on this page ---- */
  var WANT = { 'Website': 'a website', 'CRM and back office': 'a CRM and back office', 'Automation': 'some automation', 'WhatsApp or chat assistant': 'a WhatsApp or chat assistant', 'Custom ERP': 'a custom ERP', 'SEO content + sitemaps': 'SEO content with sitemaps and indexing' };
  var SYS = { 'CRM and back office': 1, 'Custom ERP': 1, 'Automation': 1 };
  var ADD = { 'care': ['Care plan', 'a care plan'], 'analytics': ['Analytics with AI-referral tracking', 'analytics with AI-referral tracking'], 'gbp': ['Google Business Profile', 'a Google Business Profile setup'], 'whatsapp-api': ['WhatsApp Business API onboarding', 'WhatsApp Business API onboarding'], 'speed': ['Speed and security pass', 'a speed and security pass'] };
  var CAL = { property: 'site visits', build: 'site surveys', retail: 'store pickups', stay: 'bookings', service: 'appointments' };
  var STOCK = { property: 'unit inventory', build: 'materials', stay: 'supplies', service: 'stock' };
  function needs() { return $$('#cf-need input:checked').map(function (i) { return i.value; }); }
  function tier() { var r = $('#cf-tier input[type=radio]:checked'); return r ? r.value : ''; }
  var urg = $('#cf-urgent');
  function rush() { return !!(urg && urg.checked); }
  function setup() { var b = sec.ftBrief; return b && b.has && (!att || att.checked) ? b : null; }        // footer.js reads the builder for us
  function modules(b) {
    var M = { pipe: 'leads and pipeline', cal: CAL[b.trade] || 'bookings', stock: STOCK[b.trade] || 'inventory', inv: 'invoices and payments', chat: 'WhatsApp', field: 'a field app', rep: 'reports', portal: 'a customer portal' };
    var out = (b.mods || []).map(function (m) { return M[m]; }).filter(Boolean);
    if (out.length > 4) out = out.slice(0, 3).concat(['the ' + (out.length - 3) + ' other modules I picked']);
    return and(out);
  }
  function business(b) { var n = (b.tradeName || '').toLowerCase(); return (n === 'services' ? 'service' : n || 'small') + ' business'; }
  /* the project they came back from: the page that sent them here, or the last project they opened from this page */
  function project(u) {
    var W = window.WORK || [], x, w, p, i;
    try { x = new URL(u, location.href); } catch (e) { return null; }
    if (x.origin !== location.origin) return null;
    for (i = 0; i < W.length; i++) {
      try { w = new URL(W[i].href, location.href); } catch (e) { continue; }
      if (w.origin !== location.origin) continue;
      p = w.pathname;
      if (p.indexOf('/samples/') >= 0 ? x.pathname.indexOf(p.slice(0, p.lastIndexOf('/') + 1)) === 0 : x.pathname === p) return { name: W[i].name, cs: p.indexOf('/projects/') >= 0, path: p };
    }
    return null;
  }
  came = (d.referrer && project(d.referrer)) || project(mem('am-from', undefined, true) || '');
  d.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href]'); if (a && project(a.href)) mem('am-from', a.href, true); }, true);
  (function () {                      // the site that first sent them here (LinkedIn, a search, GitHub), kept for this visit
    var h = ''; try { h = d.referrer ? new URL(d.referrer).hostname : ''; } catch (e) { h = ''; }
    if (h && h !== location.hostname && !mem('am-ref', undefined, true)) mem('am-ref', h, true);
  })();

  /* ---- the message writes itself from all of that, until they type over it ---- */
  function draft() {
    var n = needs(), b = setup(), sys = n.some(function (x) { return SYS[x]; }), w = pref(), t = tier();
    var items = n.map(function (x) {
      var wd = x === SEO && seo ? (seo === 'setup' ? 'SEO setup (sitemaps and indexing)' : 'an SEO content pack') : WANT[x];
      return wd && pk[x] ? wd + ' (' + pk[x] + ' package)' : wd;
    }).filter(Boolean).concat(extras.map(function (k) { return ADD[k][1]; }));
    var unsure = !items.length || n.indexOf('Not sure yet') >= 0;
    var want = unsure ? 'I’m not sure yet what I need' : 'I’m looking at ' + and(items);
    if (!unsure && b && sys && b.mods && b.mods.length) want += ' with ' + modules(b);
    var s = [b ? 'I run ' + (b.name ? b.name + ', a ' + business(b) + ', and ' : 'a ' + business(b) + ' and ') + want + '.' : want + '.'];
    var mess = (window.MESS || []).filter(Boolean).slice(-3);
    if (mess.length) s.push('Right now it’s ' + and(mess.map(function (m) { return '“' + m + '”'; })) + '.');
    if (t) s.push(t === 'Not sure' ? 'I’m not sure which package fits.' : 'The ' + t + ' package looks about right.');
    if (b) s.push(unsure || !sys ? 'I tried configuring a system on your site (link attached).' : 'I configured it on your site (link attached).');
    if (came) s.push(came.cs ? 'I read your ' + came.name + ' case study.' : came.name + ' caught my eye.');
    if (rush()) s.push('I need it sooner than the typical timeline, so please tell me what an urgent build would take.');
    s.push((unsure ? 'Could we talk it through this week?' : 'Could you send me an estimate and a delivery plan?') + (w === 'Email' ? ' Email works best for me.' : w === 'WhatsApp' ? ' Happy to talk on WhatsApp.' : w === 'Phone' ? ' A phone call works best for me.' : ''));
    return 'Hi Abhishek,\n\n' + s.join(' ') + (first() ? '\n\n' + first() : '');
  }
  function grow() { msg.style.height = 'auto'; msg.style.height = Math.min(msg.scrollHeight + 4, 440) + 'px'; }
  function redraft(force) {
    if (msgW.hidden || (!auto && !force)) return;
    var t = draft();
    if (msg.value !== t) {
      msg.value = t; grow();
      if (!reduce && !force) { msg.classList.remove('cf-new'); void msg.offsetWidth; msg.classList.add('cf-new'); }
    }
    last = t; auto = true; rew.hidden = true; say(msg, 'cf-msg-e', '');
  }
  function reveal() {
    if (!msgW.hidden) return;
    msgW.hidden = false; auto = true; redraft(true);
    if (!told) { told = true; st.textContent = 'I drafted your message from your choices. You can change any of it.'; }
  }
  msg.addEventListener('input', function () { auto = msg.value === last; rew.hidden = auto; grow(); if (msg.value.trim()) say(msg, 'cf-msg-e', ''); });
  rew.addEventListener('click', function () { auto = true; redraft(true); msg.focus(); });

  /* ---- what do you need: tap to choose. "Not sure yet" stands alone ---- */
  $$('#cf-need input').forEach(function (i) {
    i.addEventListener('change', function () {
      if (i.checked) $$('#cf-need input:checked').forEach(function (o) { if (o !== i && (i.value === 'Not sure yet' || o.value === 'Not sure yet')) o.checked = false; });
      if (!i.checked) { delete pk[i.value]; if (i.value === SEO) seo = ''; showAdd(); }
      if (needs().length) { say(null, 'cf-need-e', ''); reveal(); }
      redraft();
    });
  });
  $$('#cf-tier input[type=radio]').forEach(function (i) { i.addEventListener('change', function () { pk = {}; showAdd(); reveal(); redraft(); }); });
  if (urg) urg.addEventListener('change', function () { if (needs().length || extras.length) reveal(); redraft(); });   // one package for all replaces a per-service list
  function picked() { return Object.keys(pk).map(function (x) { return x + ' · ' + pk[x]; }); }
  function showAdd() {                   // what came over from the Services page and has no chip of its own: per-service packages, the SEO part, add-ons
    if (!addP) return;
    var rows = [], pl = picked(), ex = extras.map(function (k) { return ADD[k][0]; });
    if (pl.length) rows.push(['Packages: ', pl.join(', ')]);
    if (seo) rows.push(['SEO: ', seo === 'setup' ? 'setup only' : 'content pack only']);
    if (ex.length) rows.push([ex.length > 1 ? 'Add-ons: ' : 'Add-on: ', ex.join(', ')]);
    addP.textContent = ''; addP.hidden = !rows.length; if (!rows.length) return;
    rows.forEach(function (r, i) { if (i) addP.appendChild(d.createTextNode(' · ')); addP.appendChild(E('span', '', r[0])); addP.appendChild(E('b', '', r[1])); });
    addP.appendChild(d.createTextNode(' · '));
    var x = E('button', 'cf-lnk', 'remove'); x.type = 'button'; x.addEventListener('click', function () { extras = []; pk = {}; seo = ''; showAdd(); redraft(); var c = $('#cf-need input'); if (c) c.focus(); });
    addP.appendChild(x);
  }
  if (att) att.addEventListener('change', function () { redraft(); });
  sec.addEventListener('ft-brief', function () { redraft(); });
  addEventListener('build-real', function () {          // "Build this for real" in the builder: the setup rides along (footer.js), the form opens drafted
    if (!needs().length) { var c = $('#cf-need input[data-k="crm"]'); if (c) c.checked = true; }
    say(null, 'cf-need-e', ''); reveal(); redraft(true);
    if (!told || !st.textContent) st.textContent = 'Your setup from the builder is attached, and the message is drafted from it. You can change any of it.';
    setTimeout(function () { var t = f.getBoundingClientRect().top; if (t > innerHeight * .4 || t < 60) scrollTo(0, t + pageYOffset - 76); }, 60);
  });
  addEventListener('mess', function () { redraft(); });

  /* ---- add details (how you found me), out of the way until asked for ---- */
  more.addEventListener('click', function () { var open = xb.hidden; xb.hidden = !open; more.setAttribute('aria-expanded', String(open)); if (open) { var r = $('input', xb); if (r) r.focus(); } });

  /* ---- the country code: guessed from the time zone and language, India otherwise, searchable by name or code ---- */
  var CC = String(window.CF_CC || 'IN|India|91').split(';').map(function (s) { var p = s.split('|'); return { iso: p[0], name: p[1], dial: p[2] }; });
  var BY = {}; CC.forEach(function (c) { BY[c.iso] = c; });
  var LEN = window.CF_LEN || {}, TRUNK = String(window.CF_TRUNK || '').split(' '), MAIN = window.CF_MAIN || {}, TZ = window.CF_TZ || {};
  function flag(iso) { try { return String.fromCodePoint(127462 + iso.charCodeAt(0) - 65, 127462 + iso.charCodeAt(1) - 65); } catch (e) { return ''; } }
  function guess() {
    var tz = '', L, i, m;
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { tz = ''; }
    if (BY[TZ[tz]]) return TZ[tz];
    L = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (i = 0; i < L.length; i++) { m = /[-_]([A-Za-z]{2})$/.exec(L[i] || ''); if (m && BY[m[1].toUpperCase()]) return m[1].toUpperCase(); }
    return 'IN';
  }
  var cur = BY[guess()] || BY.IN || CC[0];
  function setCountry(c) {
    if (!c) return; cur = c;
    $('#cf-ccf').textContent = flag(c.iso); $('#cf-ccd').textContent = '+' + c.dial;
    cc.setAttribute('aria-label', 'Country code: ' + c.name + ', +' + c.dial + '. Change');
    if (ph.value.trim() && ph.getAttribute('aria-invalid')) checkPhone(false);
  }
  var opts = [], act = -1;
  function plain(s) { s = String(s || '').toLowerCase(); return s.normalize ? s.normalize('NFD').replace(/[̀-ͯ]/g, '') : s; }
  function list(q) {
    q = (q || '').trim();
    var qn = plain(q).replace(/^\+/, ''), qd = /^\+?\d+$/.test(q) ? q.replace(/\D/g, '') : '', out;
    if (!q) {
      var top = [cur.iso, 'IN', 'AE', 'US', 'GB', 'SG', 'AU', 'CA'].filter(function (x, i, a) { return BY[x] && a.indexOf(x) === i; }).map(function (x) { return BY[x]; });
      out = top.concat([null], CC);
    } else {
      out = CC.filter(function (c) { return qd ? c.dial.indexOf(qd) === 0 : plain(c.name).indexOf(qn) >= 0 || c.iso.toLowerCase() === qn; });
      out.sort(function (a, b) { var sa = qd ? a.dial.length : plain(a.name).indexOf(qn) === 0 ? 0 : 1, sb = qd ? b.dial.length : plain(b.name).indexOf(qn) === 0 ? 0 : 1; return sa - sb; });
    }
    ccl.textContent = ''; opts = []; act = -1;
    out.forEach(function (c) {
      if (!c) { var sep = E('li', 'cf-ccsep'); sep.setAttribute('role', 'separator'); ccl.appendChild(sep); return; }
      var li = E('li'); li.id = 'cf-cc-' + opts.length; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(c === cur));
      li.appendChild(E('span', 'cf-flag', flag(c.iso))).setAttribute('aria-hidden', 'true');
      li.appendChild(E('span', 'cf-cn', c.name)); li.appendChild(E('span', 'cf-cd', '+' + c.dial));
      li.dataset.iso = c.iso; ccl.appendChild(li); opts.push(li);
      if (act < 0 && c === cur && !q) act = opts.length - 1;
    });
    ccn.hidden = opts.length > 0;
    mark(opts.length ? Math.max(0, act) : -1);
  }
  function mark(i) {
    if (opts[act]) opts[act].classList.remove('is-act');
    act = i;
    if (opts[act]) { opts[act].classList.add('is-act'); ccq.setAttribute('aria-activedescendant', opts[act].id); opts[act].scrollIntoView({ block: 'nearest' }); }
    else ccq.removeAttribute('aria-activedescendant');
  }
  function openCC() { if (busy) return; ccp.hidden = false; cc.setAttribute('aria-expanded', 'true'); ccq.value = ''; list(''); ccq.focus(); }
  function closeCC(back) { if (ccp.hidden) return; ccp.hidden = true; cc.setAttribute('aria-expanded', 'false'); if (back) cc.focus(); }
  function pick(li) { if (!li) return; setCountry(BY[li.dataset.iso]); closeCC(); remember(); ph.focus(); }
  cc.addEventListener('click', function () { if (ccp.hidden) openCC(); else closeCC(true); });
  cc.addEventListener('keydown', function (e) { if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && ccp.hidden) { e.preventDefault(); openCC(); } });
  ccq.addEventListener('input', function () { list(ccq.value); });
  ccq.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'PageDown' || k === 'PageUp') { e.preventDefault(); if (opts.length) mark(Math.max(0, Math.min(opts.length - 1, act + (k === 'ArrowDown' ? 1 : k === 'ArrowUp' ? -1 : k === 'PageDown' ? 8 : -8)))); }
    else if (k === 'Home' && e.ctrlKey) { e.preventDefault(); mark(0); }
    else if (k === 'End' && e.ctrlKey) { e.preventDefault(); mark(opts.length - 1); }
    else if (k === 'Enter') { e.preventDefault(); e.stopPropagation(); pick(opts[act]); }
    else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); closeCC(true); }
    else if (k === 'Tab') closeCC();
  });
  ccl.addEventListener('mousedown', function (e) { e.preventDefault(); });         // keep focus in the search box
  ccl.addEventListener('click', function (e) { var li = e.target.closest('li[role="option"]'); if (li) pick(li); });
  ccl.addEventListener('mousemove', function (e) { var li = e.target.closest('li[role="option"]'); if (li && opts.indexOf(li) !== act) mark(opts.indexOf(li)); });
  d.addEventListener('pointerdown', function (e) { if (!ccp.hidden && !ccp.contains(e.target) && !cc.contains(e.target)) closeCC(); });
  f.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !ccp.hidden) { e.preventDefault(); closeCC(true); } });

  /* ---- the number: digits for the chosen country, read kindly. "+44 …" or "0044 …" switches the country, a leading 0 at home is dropped ---- */
  function range(c) { return c.dial === '1' ? [10, 10] : LEN[c.iso] || null; }
  function parse() {
    var v = ph.value.trim(), c = cur, n = v.replace(/\D/g, ''), r;
    if (!v) return { c: c, nat: '' };
    if (/[a-z]/i.test(v)) return { c: c, nat: n, letters: true };
    if (v.charAt(0) === '+' || /^00/.test(n)) {
      var all = n.replace(/^00/, ''), hit = null;
      if (all.indexOf(c.dial) === 0) hit = c;
      else CC.forEach(function (x) { if (all.indexOf(x.dial) === 0 && (!hit || x.dial.length > hit.dial.length || (x.dial.length === hit.dial.length && MAIN[x.dial] === x.iso))) hit = x; });
      return hit ? { c: hit, nat: all.slice(hit.dial.length) } : { c: c, nat: all };
    }
    if (c.dial === '1' && n.length === 11 && n.charAt(0) === '1') n = n.slice(1);
    else if (TRUNK.indexOf(c.iso) >= 0 && n.charAt(0) === '0') n = n.slice(1);
    r = range(c);
    if (r && n.length > r[1] && n.indexOf(c.dial) === 0 && n.length - c.dial.length >= r[0] && n.length - c.dial.length <= r[1]) n = n.slice(c.dial.length);   // the code typed without +
    return { c: c, nat: n };
  }
  function digitsSay(r) { return r[0] === r[1] ? r[0] + ' digits' : r[0] + ' to ' + r[1] + ' digits'; }
  function checkPhone(show) {
    var p = parse(), r = range(p.c), w = pref(), m = '';
    if (!ph.value.trim()) { if (w !== 'Email') m = w ? 'Add your number so I can reach you ' + (w === 'WhatsApp' ? 'on WhatsApp.' : 'by phone.') : 'Add a phone number, or pick Email as the best way to reach you.'; }
    else if (p.letters) m = 'Just the digits, please.';
    else if (r && p.nat.length < r[0]) m = 'That looks short for ' + p.c.name + ': numbers there have ' + digitsSay(r) + '.';
    else if (r && p.nat.length > r[1]) m = 'That looks long for ' + p.c.name + ': numbers there have ' + digitsSay(r) + '.';
    else if (!r && p.nat.length < 6) m = 'That looks short for a phone number.';
    else if (!r && p.nat.length > 14) m = 'That looks long for a phone number.';
    if (show || !m) say(ph, 'cf-phone-e', m);
    return !m;
  }
  function phoneOut() { var p = parse(); return p.nat ? { full: '+' + p.c.dial + ' ' + p.nat, c: p.c } : null; }
  ph.addEventListener('blur', function () {
    if (!ph.value.trim()) return;
    var p = parse(); if (p.c !== cur) setCountry(p.c);           // they typed a +code: the picker follows
    checkPhone(true);
  });
  ph.addEventListener('input', function () { if (ph.getAttribute('aria-invalid')) checkPhone(false); });

  /* ---- the best way to reach you: email makes the phone optional, and says so ---- */
  function reach() {
    var w = pref(), need = w !== 'Email';
    phOpt.hidden = need; ph.setAttribute('aria-required', String(need));
    if (!need && !ph.value.trim()) say(ph, 'cf-phone-e', ''); else if (ph.getAttribute('aria-invalid')) checkPhone(true);
  }
  $$('#cf-pref input').forEach(function (i) { i.addEventListener('change', function () { reach(); redraft(); remember(); }); });

  /* ---- friendly checks, shown when a field is left, cleared as soon as it is right ---- */
  var EM = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var DOMS = ['gmail.com', 'yahoo.com', 'yahoo.co.in', 'ymail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'rediffmail.com', 'protonmail.com', 'proton.me', 'zoho.com', 'aol.com', 'mail.com', 'email.com', 'gmx.com'];
  function dist(a, b) {                    // edits between two domains, a swap of neighbours counting as one
    var D = [], i, j, c;
    for (i = 0; i <= a.length; i++) D[i] = [i];
    for (j = 1; j <= b.length; j++) D[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) {
      c = a[i - 1] === b[j - 1] ? 0 : 1; D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) D[i][j] = Math.min(D[i][j], D[i - 2][j - 2] + 1);
    }
    return D[a.length][b.length];
  }
  function typo(v) {
    var at = v.lastIndexOf('@'), dom = v.slice(at + 1).toLowerCase(), best = '', bd = 3;
    if (DOMS.indexOf(dom) >= 0) return '';
    DOMS.forEach(function (x) { var k = dist(dom, x); if (k < bd) { bd = k; best = x; } });
    return best ? v.slice(0, at + 1) + best : '';
  }
  function say(el, id, text, tip) {
    var p = d.getElementById(id); if (!p) return;
    p.textContent = ''; p.className = 'cf-e' + (tip && !text ? ' tip' : '');
    if (text) p.textContent = text;
    else if (tip) {
      var b = E('button', 'cf-lnk', tip); b.type = 'button';
      b.addEventListener('click', function () { em.value = tip; say(em, id, ''); remember(); em.focus(); });
      p.appendChild(d.createTextNode('Did you mean ')); p.appendChild(b); p.appendChild(d.createTextNode('?'));
    }
    if (el) { if (text) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); }
  }
  function checkName(show) { var good = nm.value.trim().length > 0; if (show || good) say(nm, 'cf-name-e', good ? '' : 'What should I call you?'); return good; }
  function checkMail(show) {
    var v = em.value.trim(), m = '';
    if (!v) m = 'I’ll need an email to reply to.';
    else if (v.indexOf('@') < 0) m = 'That’s missing an @. Something like name@company.com.';
    else if (!EM.test(v)) m = 'That address looks unfinished. Is it like name@company.com?';
    if (show || !m) say(em, 'cf-email-e', m, m ? '' : typo(v));
    return !m;
  }
  function checkNeed(show) { var good = needs().length > 0 || extras.length > 0; if (show || good) say(null, 'cf-need-e', good ? '' : 'Pick one, or “Not sure yet”.'); return good; }
  function checkMsg(show) { var good = msgW.hidden || msg.value.trim().length > 0; if (show || good) say(msg, 'cf-msg-e', good ? '' : 'Add a line or two, or let me draft it again.'); if (!good) rew.hidden = false; return good; }
  nm.addEventListener('blur', function () { if (nm.value.trim() || nm.getAttribute('aria-invalid')) checkName(true); });
  nm.addEventListener('input', function () { if (nm.getAttribute('aria-invalid')) checkName(false); redraft(); });
  em.addEventListener('blur', function () { if (em.value.trim()) checkMail(true); });
  em.addEventListener('input', function () { if (em.getAttribute('aria-invalid')) checkMail(false); });
  [nm, em, ph].forEach(function (i) { i.addEventListener('change', remember); });

  /* ---- remembered for next time, in this browser only ---- */
  function remember() {
    var n = nm.value.trim().slice(0, 80), e = em.value.trim(), p = ph.value.trim().slice(0, 24);
    if (n || EM.test(e) || p) mem(MEM, { n: n, e: EM.test(e) ? e : '', p: p, c: cur.iso, w: pref() });
  }
  function greet(n) {
    if (!hi || !n) return;
    hi.textContent = 'Welcome back, ' + n.split(/\s+/)[0] + ' · ';
    var b = E('button', 'cf-lnk', 'not you?'); b.type = 'button'; b.addEventListener('click', forget); hi.appendChild(b);
  }
  function forget() {
    mem(MEM, null); nm.value = ''; em.value = ''; ph.value = '';
    $$('#cf-pref input').forEach(function (i) { i.checked = false; });
    say(em, 'cf-email-e', ''); say(ph, 'cf-phone-e', ''); setCountry(BY[guess()] || cur); reach();
    hi.textContent = HI; redraft(); nm.focus();
  }
  var back = mem(MEM);
  if (back && typeof back === 'object') {
    if (!nm.value && back.n) nm.value = String(back.n).slice(0, 80);
    if (!em.value && back.e) em.value = String(back.e).slice(0, 120);
    if (!ph.value && back.p) ph.value = String(back.p).slice(0, 24);
    if (back.c && BY[back.c]) cur = BY[back.c];
    if (back.w) { var r0 = $('#cf-pref input[value="' + String(back.w).replace(/[^A-Za-z]/g, '') + '"]'); if (r0) r0.checked = true; }
    greet(back.n);
  }
  setCountry(cur); reach();

  /* ---- New Delhi time beside the button ---- */
  function ist() { var t = new Date(Date.now() + 330 * 60000); return { h: t.getUTCHours(), m: t.getUTCMinutes() }; }      // IST is UTC+5:30 all year
  function hm(t) { return (t.h % 12 || 12) + ':' + (t.m < 10 ? '0' : '') + t.m + (t.h < 12 ? ' am' : ' pm'); }
  function when() { if (rt) rt.title = 'New Delhi time now: ' + hm(ist()); }         // the time itself is on the New Delhi card
  when(); f.addEventListener('focusin', when);

  /* ---- Enter moves on, like a well-made paper form. Ctrl or Cmd + Enter sends from the message ---- */
  function stops() {                       // the text fields, one stop per group of chips, then the send button
    var seen = [];
    return $$('input, textarea, button', f).filter(function (el) {
      if (el === hp || el === ccq || el.disabled || !el.offsetParent) return false;
      if (el.tagName === 'BUTTON') return el === send;
      if (el.type === 'checkbox' || el.type === 'radio') { var g = el.closest('fieldset'); if (!g || seen.indexOf(g) >= 0) return false; seen.push(g); }
      return true;
    });
  }
  f.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.isComposing || e.altKey || e.shiftKey) return;
    var t = e.target;
    if (t === ccq) return;                                    // the country search keeps its own Enter
    if (t === msg) { if (e.metaKey || e.ctrlKey) { e.preventDefault(); go(); } return; }
    if (t.tagName !== 'INPUT') return;                       // buttons and links keep Enter
    e.preventDefault();
    if (t.type === 'checkbox' || t.type === 'radio') { t.click(); return; }     // a chip: Enter taps it
    if (t === em) checkMail(true); else if (t === nm) checkName(true); else if (t === ph && ph.value.trim()) { var p = parse(); if (p.c !== cur) setCountry(p.c); checkPhone(true); }
    var all = stops(), i = all.indexOf(t), nx = all[i + 1] || send;
    if ((nx.type === 'checkbox' || nx.type === 'radio') && nx.closest('fieldset')) { var on = $('input:checked', nx.closest('fieldset')); if (on) nx = on; }
    nx.focus();
  });

  /* ---- sending ---- */
  function setup2() {                     // the builder's own summary and #b= link, as studio.js wrote them into the email link
    var b = setup(); if (!b) return null;
    var a = $('#mail'), href = a ? a.getAttribute('href') || '' : '', i = href.indexOf('body='), body = '', link = '', m;
    if (i >= 0) { try { body = decodeURIComponent(href.slice(i + 5)); } catch (e) { body = ''; } }
    m = /Link to this configuration: (\S+)/.exec(body); if (m) link = m[1];
    if (!link) { var p = null; try { p = localStorage.getItem('am-build'); } catch (e) { p = null; } link = location.hash.indexOf('#b=') === 0 ? location.href : p ? location.href.split('#')[0] + '#b=' + p : ''; }
    var sum = body ? body.split('\nLink to this configuration:')[0].trim() : [b.name || 'Business name not set', b.tradeName, b.look, (b.mods || []).length + ' modules'].join(' · ');
    return { summary: sum, link: link, b: b };
  }
  function payload() {
    var n = needs(), name = nm.value.trim(), o = {
      access_key: KEY,
      subject: (rush() ? 'Urgent: ' : '') + 'New project enquiry: ' + (n.join(' + ') || (extras.length ? ADD[extras[0]][0] : 'Not sure yet')) + (tier() ? ' (' + tier() + ')' : '') + ' from ' + name,
      from_name: name + ' via your portfolio',
      name: name, email: em.value.trim()
    };
    var tel = phoneOut(), fm = $('.cf-xb input[name="found"]:checked', f), s = setup2(), mess = (window.MESS || []).filter(Boolean), ref = mem('am-ref', undefined, true);
    if (tel) { o.phone = tel.full; o['phone country'] = tel.c.name; }
    o['preferred contact'] = pref() || 'No preference';
    o.need = n.join(', '); o.message = msg.value.trim() || draft();
    if (tier()) o['package'] = tier(); else if (picked().length) o['package'] = picked().join('; ');
    if (rush()) o['urgent'] = 'Yes, an urgent build was asked for';
    if (seo) o['seo part'] = seo === 'setup' ? 'Setup only (sitemaps and indexing)' : 'Content pack only';
    if (extras.length) o['add-ons'] = extras.map(function (k) { return ADD[k][0]; }).join(', ');
    if (fm) o['found me via'] = fm.value;
    if (s) { o['builder setup'] = s.summary; if (s.link) o['builder link'] = s.link; }
    if (mess.length) o['their mess'] = mess.join(', ');
    if (came) o['came from'] = came.name + ' (' + came.path + ')';
    if (ref) o['arrived from'] = ref;
    o['sent from'] = location.origin + location.pathname;
    return o;
  }
  function lock(on) {
    busy = on; f.classList.toggle('is-busy', on); f.setAttribute('aria-busy', on ? 'true' : 'false');
    send.setAttribute('aria-disabled', on ? 'true' : 'false'); sl.textContent = on ? 'Sending…' : 'Send it';
    $$('input, textarea', f).forEach(function (i) { if (i !== hp) i.disabled = on; });
    cc.disabled = on;
  }
  function mailto(o) {
    var body = o.message + '\n\n' + o.name + '\n' + o.email + (o.phone ? '\n' + o.phone : '') + (o['preferred contact'] !== 'No preference' ? '\nBest way to reach me: ' + o['preferred contact'] : '') + (o['builder link'] ? '\n\nMy setup: ' + o['builder link'] : '');
    if (body.length > 1700) body = body.slice(0, 1700) + '…';
    return 'mailto:' + MAIL + '?subject=' + encodeURIComponent(o.subject) + '&body=' + encodeURIComponent(body);
  }
  function failed(why, o) {
    fail.textContent = '';
    var p1 = E('p'), p2 = E('p', 'cf-fa'), again = E('button', 'btn b', 'Try again'), mail = E('a', 'btn', 'Email it to me instead');
    p1.appendChild(E('b', '', 'That didn’t send. ')); p1.appendChild(d.createTextNode((why ? why + ' ' : '') + 'Your message is still here, so nothing is lost.'));
    again.type = 'submit'; mail.href = mailto(o);
    p2.appendChild(again); p2.appendChild(mail); fail.appendChild(p1); fail.appendChild(p2);
    fail.hidden = false; st.textContent = '';
    again.focus();
  }
  function row(dl, k, v) { if (!v) return; dl.appendChild(E('dt', '', k)); dl.appendChild(E('dd', '', v)); }
  function done(o) {
    remember(); greet(o.name);
    var s = setup2(), dl = $('#cf-sum'), q = o.message;
    $('#cf-okh').textContent = 'Thanks, ' + (o.name.split(/\s+/)[0] || 'friend') + '. Your estimate is on its way.';
    $('#cf-okt').textContent = hm(ist()) + ' in New Delhi';
    dl.textContent = '';
    row(dl, 'You need', o.need.split(', ').join(' · '));
    row(dl, 'Package', o['package']);
    row(dl, 'SEO', o['seo part']);
    row(dl, 'Urgent', o['urgent'] ? 'Yes' : '');
    row(dl, 'Add-ons', o['add-ons']);
    row(dl, 'Reply to', o.email);
    row(dl, 'Phone', o.phone);
    row(dl, 'Best way', o['preferred contact'] !== 'No preference' ? o['preferred contact'] : '');
    row(dl, 'Found me via', o['found me via']);
    $('#cf-q').textContent = q.length > 360 ? q.slice(0, 340).replace(/\s+\S*$/, '') + ' …' : q;
    st.textContent = ''; fail.textContent = ''; fail.hidden = true;
    f.hidden = true; ok.hidden = false;
    ok.focus({ preventScroll: true });
    var r = ok.getBoundingClientRect(); if (r.top < 0 || r.top > innerHeight * .6) ok.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }
  function go() {
    if (busy) return;
    closeCC();
    var a = checkName(true), b = checkMail(true), p = checkPhone(true), c = checkNeed(true), m = checkMsg(true);
    if (!(a && b && p && c && m)) { (!a ? nm : !b ? em : !p ? ph : !c ? $('#cf-need input') : msg).focus(); return; }
    var o = payload();
    if (hp && hp.checked) { done(o); return; }                 // the honeypot was ticked: a bot. Thank it, send nothing
    fail.textContent = ''; fail.hidden = true; lock(true); st.textContent = 'Sending your message…';
    var ctl = window.AbortController ? new AbortController() : null, timer = setTimeout(function () { if (ctl) ctl.abort(); }, 20000);
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(o), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, s: r.status, j: j || {} }; }); })
      .then(function (r) {
        clearTimeout(timer); lock(false);
        if (r.ok && r.j.success) { done(o); return; }
        var why = r.s === 429 ? 'Too many tries from this connection in a short while; give it a few minutes.' : '';
        failed(why, o);
      })
      .catch(function (e) {
        clearTimeout(timer); lock(false);
        failed(navigator.onLine === false ? 'You seem to be offline.' : e && e.name === 'AbortError' ? 'It took too long to answer.' : '', o);
      });
  }
  f.addEventListener('submit', function (e) { e.preventDefault(); go(); });

  $('#cf-again').addEventListener('click', function () {        // a new note: the needs and message start over, contact details stay
    $$('#cf-need input, #cf-tier input, .cf-xb input', f).forEach(function (i) { i.checked = false; });
    extras = []; pk = {}; seo = ''; showAdd();
    if (hp) hp.checked = false;
    msg.value = ''; last = ''; auto = true; msgW.hidden = true; rew.hidden = true;
    xb.hidden = true; more.setAttribute('aria-expanded', 'false');
    ok.hidden = true; f.hidden = false;
    var c = $('#cf-need input'); if (c) c.focus();
  });

  /* ---- arriving from the Services page with an estimate list (see the top of this file) ---- */
  (function () {
    var q = null; try { q = new URLSearchParams(location.search); } catch (e) { q = null; }
    if (!q) return;
    var TL = { starter: 'Starter', standard: 'Standard', custom: 'Custom' }, tiers = {}, want = {}, got = [], parts = {};
    function arr(k) { return String(q.get(k) || '').toLowerCase().split(',').map(function (x) { return x.replace(/[^a-z:-]/g, ''); }).filter(Boolean); }
    arr('pick').forEach(function (x) { var a = x.split(':'); want[a[0]] = 1; if (TL[a[1]]) tiers[a[0]] = TL[a[1]]; });
    arr('service').forEach(function (k) { want[k] = 1; });
    arr('addon').forEach(function (k) {
      if (k === 'seo-setup' || k === 'seo-content') { want.seo = 1; parts[k.slice(4)] = 1; }
      else if (ADD[k] && extras.indexOf(k) < 0) extras.push(k);
    });
    seo = parts.setup && !parts.content ? 'setup' : parts.content && !parts.setup ? 'content' : '';
    var vals = {};                                                          // data-k → the chip's value
    $$('#cf-need input').forEach(function (i) { var k = i.getAttribute('data-k'); if (k && k !== 'unsure' && want[k]) { i.checked = true; vals[k] = i.value; got.push(i.value); } });
    var tr = String(q.get('tier') || '').toLowerCase().replace(/[^a-z]/g, ''), kinds = {}, n = 0, all = true;
    Object.keys(vals).forEach(function (k) { if (k === 'seo' && !tiers[k]) return; n++; if (tiers[k]) kinds[tiers[k]] = 1; else all = false; });
    var one = Object.keys(kinds), r = null;
    if (tr) r = $('#cf-tier input[type=radio][data-k="' + tr + '"]');                    // an explicit tier= wins
    else if (one.length === 1 && all && n) r = $('#cf-tier input[value="' + one[0] + '"]');      // every service on the same package: tick it
    else Object.keys(vals).forEach(function (k) { if (tiers[k]) pk[vals[k]] = tiers[k]; });      // mixed: list them per service
    if (r) { r.checked = true; got.push(r.value === 'Not sure' ? 'package not decided' : r.value + ' package'); }
    picked().forEach(function (x) { got.push(x); });
    if (urg && q.get('urgent') === '1') { urg.checked = true; got.push('urgent build'); }
    extras.forEach(function (k) { got.push(ADD[k][0]); });
    showAdd();
    if (!got.length) return;
    reveal(); redraft(true); told = true;
    st.textContent = 'Filled in from the Services page: ' + got.join(', ') + '. You can change any of it.';
    if (location.hash === '#contact') {                   // on a phone the form sits below the heading: bring the form itself up
      var place = function () { var t = f.getBoundingClientRect().top; if (t > innerHeight * .4) scrollTo(0, t + pageYOffset - 76); };
      if (d.readyState === 'complete') setTimeout(place, 300); else addEventListener('load', function () { setTimeout(place, 300); });
    }
  })();

  f.hidden = false;                       // the form only shows once it can work
  if (!msgW.hidden) grow();               // a pre-filled draft was sized while the form was still hidden
})();
