/* Sthira · careers: filterable roles, a role drawer and a working application form that lands in the back office. */
(function () {
  'use strict';
  var D = window.STHIRA, A = window.App, $ = A.$, $$ = A.$$, esc = A.esc;
  var list = $('#jobs'), city = 'all', open = null, lastFocus = null;

  function render() {
    var js = D.JOBS.filter(function (j) { return city === 'all' || j.city === city || j.city === 'All offices'; });
    $('#jcount').textContent = js.length + ' open ' + (js.length === 1 ? 'role' : 'roles');
    list.innerHTML = js.map(function (j) {
      return '<button type="button" class="job" data-id="' + j.id + '"><span><span class="jt">' + esc(j.title) + '</span><span class="m c">' + esc(j.city + ' · ' + j.exp) + '</span></span><span class="m">' + esc(j.city) + '</span><span class="m">' + esc(j.exp) + '</span><span class="m">' + esc(j.pay) + '</span><span class="go" aria-hidden="true">→</span></button>';
    }).join('');
    $$('#jf button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.c === city); });
  }
  $('#jf').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { city = b.dataset.c; render(); } });

  // role select
  $('#a-role').innerHTML = '<option value="">Choose a role</option>' + D.JOBS.map(function (j) { return '<option value="' + j.id + '">' + esc(j.title + ' · ' + j.city) + '</option>'; }).join('') + '<option value="open">Open application</option>';

  // drawer
  var dr = $('#jd'), scrim = $('#scrim');
  function show(id) {
    var j = D.JOBS.filter(function (x) { return x.id === id; })[0]; if (!j) return; open = j; lastFocus = document.activeElement;
    $('#jd-k').textContent = j.team + ' · ' + j.city + ' · ' + j.type;
    $('#jd-h').textContent = j.title;
    $('#jd-b').innerHTML = '<dl class="kv"><div><dt>Experience</dt><dd>' + esc(j.exp) + '</dd></div><div><dt>Pay (CTC)</dt><dd>' + esc(j.pay) + '</dd></div></dl><p style="font-size:18px;line-height:1.55;margin-bottom:24px">' + esc(j.about) + '</p>' +
      '<p class="k" style="margin-bottom:8px">You have</p><ul class="ticks">' + j.must.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' +
      '<p class="k" style="margin:24px 0 8px">Nice to have</p><ul class="ticks">' + j.nice.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' +
      '<p class="pnote" style="margin-top:24px">Interview: a 30-minute call, then a site walk with the project manager. Decision within 10 days.</p>';
    dr.classList.add('on'); scrim.classList.add('on'); document.documentElement.style.overflow = 'hidden'; if (window.Motion && Motion.lenis) Motion.lenis.stop();
    setTimeout(function () { $('#jd-x').focus(); }, 50);
  }
  function hide() { dr.classList.remove('on'); scrim.classList.remove('on'); document.documentElement.style.overflow = ''; if (window.Motion && Motion.lenis) Motion.lenis.start(); lastFocus && lastFocus.focus(); }
  list.addEventListener('click', function (e) { var b = e.target.closest('.job'); if (b) show(b.dataset.id); });
  $('#jd-x').addEventListener('click', hide); scrim.addEventListener('click', hide);
  addEventListener('keydown', function (e) {
    if (!dr.classList.contains('on')) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'Tab') { var f = $$('button, a, input, select, textarea', dr).filter(function (x) { return x.offsetParent; }); var first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
  });
  $('#jd-apply').addEventListener('click', function () {
    var id = open.id; hide(); $('#a-role').value = id;
    var y = $('#apply').getBoundingClientRect().top + scrollY - 90;
    if (window.Motion && Motion.lenis) Motion.lenis.scrollTo(y); else scrollTo({ top: y, behavior: A.reduce ? 'auto' : 'smooth' });
    setTimeout(function () { $('#a-name').focus({ preventScroll: true }); }, 900);
  });

  // file input (demo: we only read the name and size)
  var cv = $('#a-cv'), cvn = $('#a-cv-n'), drop = cv.closest('.file');
  function setFile(f) { if (!f) return; if (f.size > 5 * 1024 * 1024) { cvn.textContent = 'That file is ' + (f.size / 1048576).toFixed(1) + ' MB. Please keep it under 5 MB.'; cvn.style.color = 'var(--bad)'; return; } cvn.style.color = ''; cvn.textContent = f.name + ' · ' + Math.max(1, Math.round(f.size / 1024)) + ' KB'; cv._file = { name: f.name, size: f.size }; }
  cv.addEventListener('change', function () { setFile(cv.files[0]); });
  ['dragover', 'dragenter'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.style.borderColor = 'var(--ink)'; }); });
  drop.addEventListener('dragleave', function () { drop.style.borderColor = ''; });
  drop.addEventListener('drop', function (e) { e.preventDefault(); drop.style.borderColor = ''; setFile(e.dataTransfer.files[0]); });

  // submit
  var fa = $('#f-apply');
  fa.addEventListener('submit', function (e) {
    e.preventDefault(); if (!A.validate(fa)) return;
    var d = Object.fromEntries(new FormData(fa).entries()), btn = $('#a-submit');
    var job = D.JOBS.filter(function (j) { return j.id === d.role; })[0];
    btn.classList.add('loading');
    setTimeout(function () {
      btn.classList.remove('loading');
      var apps = A.store.get('apps', []);
      var ref = 'APP-' + (481 + apps.length);
      apps.unshift({ id: ref, at: new Date(A.NOW.getTime() + apps.length * 60000).toISOString(), role: job ? job.title : 'Open application', roleCity: job ? job.city : '', name: d.name, email: d.email, phone: d.phone, city: d.city, exp: d.exp, notice: d.notice, cv: cv._file ? cv._file.name : null, proj: d.proj, stage: 'new', fresh: true });
      A.store.set('apps', apps);
      fa.hidden = true; var done = $('#a-done'); done.hidden = false;
      $('#a-done-h').textContent = 'Thanks, ' + d.name.split(' ')[0] + '. We’ll reply within a week.';
      $('#a-done-p').textContent = 'Reference ' + ref + ' for ' + (job ? job.title + ' in ' + job.city : 'an open application') + '. ' + (job && job.city !== 'All offices' ? 'If it goes forward, the next step is a 30-minute call with the ' + job.city + ' project manager.' : '');
      done.focus(); A.toast('Application <b>' + ref + '</b> received.');
    }, 800);
  });
  $('#a-again').addEventListener('click', function () { fa.reset(); cvn.textContent = 'Choose a file, or drop it here'; cv._file = null; fa.hidden = false; $('#a-done').hidden = true; $('#a-role').focus(); });

  render();
  var hash = location.hash.slice(1); if (hash && D.JOBS.some(function (j) { return j.id === hash; })) show(hash);
})();
