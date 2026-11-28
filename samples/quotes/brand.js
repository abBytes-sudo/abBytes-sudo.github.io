/* "Your name on it": the small panel on the Studio OS page and in the app. Loaded on first use by brand-boot.js.
   A labelled dialog (a popover on a wide screen, a bottom sheet on a phone). Names are always written with textContent. */
(function () {
  'use strict';
  var SB = window.StudioBrand; if (!SB || SB.panel) return;
  var SW = [['0E5C57', 'Lacquer teal'], ['9C5B3E', 'Fired clay'], ['66703A', 'Olive'], ['3F4A8A', 'Indigo'], ['2F3633', 'Charcoal'], ['B07D2A', 'Brushed brass']];
  var dlg = null, opener = null, saved = null, done = false;

  function h(tag, props, kids) {
    var el = document.createElement(tag), k;
    for (k in props || {}) { if (k === 'text') el.textContent = props[k]; else if (props[k] === true) el.setAttribute(k, ''); else if (props[k] !== false && props[k] != null) el.setAttribute(k, props[k]); }
    (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function chars(s) { return Array.from ? Array.from(s) : s.split(''); }
  function plain(s) { return String(s).replace(/[<>&"'`|\u0000-\u001f\u007f-\u009f]/g, '').replace(/\s+/g, ' ').trim(); }

  function place(from) {
    if (window.innerWidth < 700) { dlg.style.top = dlg.style.left = dlg.style.right = dlg.style.bottom = ''; return; }
    var r = from && from.getBoundingClientRect ? from.getBoundingClientRect() : null, w = Math.min(372, window.innerWidth - 24), H = dlg.offsetHeight || 420, vw = window.innerWidth, vh = window.innerHeight, left, top;
    if (!r || !r.width) { left = (vw - w) / 2; top = Math.max(12, (vh - H) / 3); }
    else {
      left = r.left + r.width / 2 > vw / 2 ? r.right - w : r.left;                // hang from the nearer edge
      top = r.bottom + 10 + H <= vh - 12 ? r.bottom + 10 : r.top - 10 - H;          // below if it fits, else above
    }
    dlg.style.left = Math.max(12, Math.min(vw - w - 12, left)) + 'px'; dlg.style.right = 'auto'; dlg.style.bottom = 'auto';
    dlg.style.top = Math.max(12, Math.min(vh - H - 12, top)) + 'px';
  }

  function build() {
    var cur = SB.get(), startHex = cur ? cur.hex : SB.DEFAULT, known = SW.some(function (s) { return s[0] === startHex; });
    var form = h('form', { novalidate: true, id: 'bp-f' });
    var name = h('input', { class: 'bp-inp', id: 'bp-name', type: 'text', maxlength: '32', autocomplete: 'organization', spellcheck: 'false', placeholder: 'e.g. Atelier Kanso', 'aria-describedby': 'bp-err' }); name.value = cur ? cur.name : '';
    var ini = h('input', { class: 'bp-inp bp-ini', id: 'bp-ini', type: 'text', maxlength: '2', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'characters', 'aria-describedby': 'bp-err' }); ini.value = cur ? cur.initial : '';
    var err = h('p', { class: 'bp-err', id: 'bp-err', role: 'alert' });
    var touched = !!cur && cur.initial !== (chars(cur.name)[0] || '').toUpperCase();
    function derive() { var p = chars(plain(name.value)); return p.length ? p[0].toUpperCase() : ''; }
    name.addEventListener('input', function () { if (!touched) ini.value = derive(); name.removeAttribute('aria-invalid'); err.textContent = ''; });
    ini.addEventListener('input', function () { touched = ini.value.trim() !== ''; ini.removeAttribute('aria-invalid'); err.textContent = ''; });

    var cap = h('span', { 'aria-live': 'polite', style: 'margin-left:auto' });
    var sw = h('div', { class: 'bp-sw', role: 'presentation' });
    SW.forEach(function (s) {
      var r = h('input', { type: 'radio', name: 'bp-c', value: s[0], 'aria-label': s[1] }); if (s[0] === startHex) r.checked = true;
      var l = h('label', { title: s[1] }, [r, h('span', { 'aria-hidden': 'true' })]); l.style.setProperty('--c', '#' + s[0]); sw.appendChild(l);
    });
    var own = h('input', { type: 'color', id: 'bp-own', 'aria-label': 'Pick your own colour' }); own.value = '#' + (known ? '8A5A44' : startHex).toLowerCase();
    var ownR = h('input', { type: 'radio', name: 'bp-c', value: 'own', 'aria-label': 'Your own colour' }); if (!known) ownR.checked = true;
    var ownL = h('label', { class: 'bp-own' }, [ownR, own, h('span', { text: 'Your own' })]);

    function hexNow() { var r = form.querySelector('[name=bp-c]:checked'); return !r ? SB.DEFAULT : r.value === 'own' ? own.value.replace('#', '').toUpperCase() : r.value; }
    function names() { var r = form.querySelector('[name=bp-c]:checked'); var s = SW.filter(function (x) { return r && x[0] === r.value; })[0]; cap.textContent = s ? s[1] : '#' + hexNow(); }
    function preview() { names(); SB.paint(hexNow()); }
    form.addEventListener('change', function (e) { if (e.target.name === 'bp-c') preview(); });
    own.addEventListener('input', function () { ownR.checked = true; preview(); });
    ownL.addEventListener('click', function (e) { if (e.target !== own) { ownR.checked = true; preview(); } });

    form.appendChild(h('div', { class: 'bp-row2' }, [
      h('div', { class: 'bp-f' }, [h('label', { for: 'bp-name', text: 'Studio name' }), name]),
      h('div', { class: 'bp-f' }, [h('label', { for: 'bp-ini', text: 'Logo initial' }), ini])
    ]));
    form.appendChild(err);
    form.appendChild(h('fieldset', { class: 'bp-f' }, [h('legend', { text: 'Colour' }), sw, h('div', { class: 'bp-cap' }, [ownL, cap])]));
    form.appendChild(h('button', { type: 'submit', class: 'bp-btn pri', text: 'Show it as mine' }));
    names();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = plain(name.value), nn = chars(n).length, i = plain(ini.value).replace(/\s/g, '');
      if (nn < 2) { name.setAttribute('aria-invalid', 'true'); err.textContent = 'Give your studio a name, at least two letters.'; name.focus(); return; }
      if (nn > 32) { name.setAttribute('aria-invalid', 'true'); err.textContent = 'Keep the name to 32 characters or fewer.'; name.focus(); return; }
      if (chars(i).length > 2) { ini.setAttribute('aria-invalid', 'true'); err.textContent = 'Use one or two letters for the logo.'; ini.focus(); return; }
      var b = SB.set({ name: n, initial: i || derive(), hex: hexNow() });
      if (!b) { err.textContent = 'That did not look right. Check the name and the colour, then try again.'; return; }
      done = true; location.reload();
    });

    var head = h('div', { class: 'bp-hd' }, [h('h2', { id: 'bp-h', text: cur ? 'Your studio' : 'Your name on it' }), h('button', { type: 'button', class: 'bp-x', 'aria-label': 'Close', text: '×' })]);
    var sub = h('p', { class: 'bp-sub' });
    if (cur) { sub.appendChild(document.createTextNode('Every page here, and the quote your client opens, shows as ')); sub.appendChild(h('b', { text: cur.name })); sub.appendChild(document.createTextNode('. Change it, or copy the link to send it on.')); }
    else sub.textContent = 'Type your studio’s name and pick a colour. The product, and the quote your client opens, will carry them.';
    var inner = h('div', { class: 'bp-in' }, [head, sub, form]);

    if (cur) {
      var link = h('input', { class: 'bp-link', id: 'bp-link', type: 'text', readonly: true, 'aria-label': 'Your link', value: SB.link(cur) });
      link.addEventListener('focus', function () { link.select(); });
      var ok = h('p', { class: 'bp-ok', role: 'status' });
      var copy = h('button', { type: 'button', class: 'bp-btn', text: 'Copy link' });
      copy.addEventListener('click', function () {
        function fail() { link.focus(); link.select(); ok.textContent = 'Press Ctrl+C or ⌘C to copy the selected link.'; }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link.value).then(function () { ok.textContent = 'Link copied. Anyone who opens it sees ' + cur.name + '.'; }, fail); else fail();
      });
      var back = h('button', { type: 'button', class: 'bp-quiet', text: 'Back to Studio OS' });
      back.addEventListener('click', function () { SB.clear(); done = true; location.reload(); });
      inner.appendChild(h('div', { class: 'bp-out' }, [h('label', { for: 'bp-link', text: 'Your link' }), link, h('div', { class: 'bp-acts' }, [copy, back]), ok]));
    }
    head.lastChild.addEventListener('click', close);
    return inner;
  }

  function close() { if (dlg && dlg.open) dlg.close(); }
  function closed() {
    if (!done) { var c = SB.get(); SB.paint(c ? c.hex : null); }   // put the accent back unless a new brand was just saved
    if (dlg) { dlg.remove(); dlg = null; }
    var o = opener; opener = null;
    if (o && o.isConnected && o.focus) o.focus();
  }

  SB.panel = {
    open: function (from) {
      if (dlg) return;
      opener = from || document.activeElement; done = false;
      dlg = h('dialog', { class: 'bp', 'aria-labelledby': 'bp-h' }); dlg.appendChild(build());
      dlg.addEventListener('close', closed);
      dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
      document.body.appendChild(dlg);
      place(from);
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      place(from);
      var n = dlg.querySelector('#bp-name'); if (n) n.focus();
    },
    close: close
  };
  window.addEventListener('resize', function () { if (dlg) place(opener); });
})();
