/* Ordwell — public form page: renders the form with the workspace's white-label brand and creates a task on submit. */
(function () {
  'use strict';
  var OW = window.OW, UI = OW.UI, store = OW.store, esc = UI.esc, I = UI.I;
  store.load();
  var S = store.S, b = S.brand, root = document.documentElement;
  root.style.setProperty('--accent', b.accent); root.style.setProperty('--on-accent', UI.contrastOn(b.accent));
  var id = (/[?&]f=([^&]+)/.exec(location.search) || [])[1] || 'fm1', f = OW.byId(S.forms, id) || S.forms[0];
  var main = document.getElementById('pf');
  document.title = f.name + ' — ' + (b.sender || b.name);
  function show() {
    main.innerHTML = '<h1 class="sr">' + esc(f.name) + '</h1>' + OW.formHtml(f, 'pf') + '<p class="pf-foot">' + esc(b.domain ? b.domain + '/f/' + f.slug : '') + ' · <a href="index.html#/forms/' + f.id + '">See it arrive in the workspace →</a></p>';
    OW.formWire(main.querySelector('form'), f, function (t) {
      main.innerHTML = '<div class="fprev"><div class="pf-done" role="status"><div class="tick">' + I('check', 'l') + '</div><h1>Thanks — we’ve got it</h1><p>' + esc(b.sender || b.name) + ' will reply within one working day. Your reference:</p><span class="pf-ref">' + esc(t.num) + '</span>' +
        '<p style="margin-top:22px"><a class="btn pri" href="index.html#/p/' + t.project + '/list?t=' + t.id + '">See it in the agency’s workspace</a> <button type="button" class="btn" id="again">Send another</button></p></div></div>';
      document.getElementById('again').addEventListener('click', show);
      main.querySelector('.tick').focus && main.querySelector('h1').setAttribute('tabindex', '-1'); main.querySelector('h1').focus();
    });
  }
  show();
})();
