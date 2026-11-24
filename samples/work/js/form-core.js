/* Ordwell — form renderer + validation + submit, shared by the in-app builder preview and the public form page. */
(function () {
  'use strict';
  var OW = window.OW, UI = OW.UI, D = OW.D, I = UI.I, esc = UI.esc, store = OW.store;
  /* shared renderer used by the builder preview and the public page */
  OW.formHtml = function (f, pre) {
    var S = store.S, b = S.brand;
    var h = '<form class="fprev" data-form="' + f.id + '" novalidate><div class="fprev-h"><div class="brandrow"><span class="logo" data-brand-logo style="width:28px;height:28px;font-size:13px">' + (b.logo ? '<img src="' + esc(b.logo) + '" alt="">' : esc(b.name.charAt(0))) + '</span>' + esc(b.sender || b.name) + '</div><h3>' + esc(f.name) + '</h3><p>' + esc(f.intro) + '</p></div><div class="fprev-b">';
    if (!f.on) h += '<div class="callout">' + I('clock') + '<span>This form is paused and not accepting responses right now.</span></div>';
    f.fields.forEach(function (q) {
      var id = pre + '-' + q.id, req = q.req ? ' <span style="color:var(--bad)" aria-hidden="true">*</span>' : ' <span class="faint">(optional)</span>';
      h += '<div class="fld"><label class="lbl-t" for="' + id + '">' + esc(q.label) + req + '</label>';
      if (q.type === 'long') h += '<textarea id="' + id + '" class="inp" rows="3" name="' + q.id + '" placeholder="' + esc(q.ph || '') + '"' + (q.req ? ' aria-required="true"' : '') + '></textarea>';
      else if (q.type === 'select') h += '<select id="' + id + '" class="inp" name="' + q.id + '"' + (q.req ? ' aria-required="true"' : '') + '><option value="">Choose…</option>' + (q.options || []).map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>';
      else if (q.type === 'file') h += '<label class="drop-z" for="' + id + '">' + I('upload') + '<span data-fl>Add files</span></label><input type="file" multiple class="sr" id="' + id + '" name="' + q.id + '">';
      else h += '<input id="' + id + '" class="inp" name="' + q.id + '" type="' + (q.type === 'date' ? 'date' : q.type === 'email' ? 'email' : q.type === 'number' ? 'number' : 'text') + '" placeholder="' + esc(q.ph || '') + '"' + (q.type === 'date' ? ' min="' + D.today() + '"' : '') + (q.req ? ' aria-required="true"' : '') + (q.type === 'email' ? ' autocomplete="email"' : '') + '>';
      h += '<div class="err" id="' + id + '-e" hidden></div></div>';
    });
    h += '<button type="submit" class="btn pri lg" style="width:100%"' + (f.on ? '' : ' disabled') + '>Send request</button><p class="hint" style="text-align:center;margin-top:10px">' + (b.poweredBy && b.name.toLowerCase() !== 'ordwell' ? 'Powered by Ordwell · ' : '') + 'Replies within one working day.</p></div></form>';
    return h;
  };
  OW.formWire = function (form, f, done) {
    if (!form) return;
    form.addEventListener('change', function (e) { if (e.target.type === 'file') { var l = e.target.previousElementSibling && e.target.previousElementSibling.querySelector('[data-fl]'); if (l) l.textContent = e.target.files.length ? Array.prototype.map.call(e.target.files, function (x) { return x.name; }).join(', ') : 'Add files'; } });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); if (!f.on) return;
      var vals = {}, bad = null;
      f.fields.forEach(function (q) {
        var el = form.querySelector('[name="' + q.id + '"]'), err = form.querySelector('#' + el.id + '-e'), v;
        if (q.type === 'file') v = Array.prototype.map.call(el.files || [], function (x) { var ext = (x.name.split('.').pop() || '').toLowerCase(); return { name: x.name, kb: Math.max(1, Math.round(x.size / 1024)), kind: /png|jpe?g|gif|webp/.test(ext) ? 'image' : /pdf/.test(ext) ? 'pdf' : 'doc' }; });
        else v = el.value.trim();
        var msg = '';
        if (q.req && (!v || (Array.isArray(v) && !v.length))) msg = q.type === 'email' ? 'Add an email so we can reply.' : q.type === 'date' ? 'Pick the date you need it by.' : 'This one is needed to start the work.';
        else if (q.type === 'email' && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) msg = 'That email looks incomplete — check the part after @.';
        else if (q.type === 'date' && v && v < D.today()) msg = 'That date has passed — pick today or later.';
        el.setAttribute('aria-invalid', msg ? 'true' : 'false'); if (err) { err.hidden = !msg; err.textContent = msg; }
        if (msg && !bad) bad = el; vals[q.id] = v;
      });
      if (bad) { bad.focus(); return; }
      var t = store.commit('Form submitted', function () { return OW.A.submitForm(f, vals); }, { quiet: true });
      form.reset(); form.querySelectorAll('[data-fl]').forEach(function (l) { l.textContent = 'Add files'; });
      done && done(t);
    });
  };

})();
